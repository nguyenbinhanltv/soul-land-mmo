// Hàm phụ dùng chung của luồng A / B và các bài ở bot/<nhóm>.mjs (#703 bước 6, tách nguyên văn từ bot-test.mjs): làng, hồn kỹ, liên kích.
import { readFileSync } from "node:fs";
import { goTo, sleep, waitFor, mapUrl } from "./lib.mjs";
import { VOHON } from "../../../shared/data.ts";

/**
 * Vùng an toàn (làng) của bản đồ `mapId` và các hàm đi / kiểm tra trong làng. Trong làng (vùng safe) không có hồn thú: theo đường làng
 * đông–tây (hàng ô 27–28, tools/gen-map.mjs) ra Bãi tập rồi mới săn.
 */
export function villageKit(mapId){
  const safe=JSON.parse(readFileSync(mapUrl(mapId),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="safe");
  const inSafeOf=b=>{ const q=b.room.state.players.get(b.room.sessionId); return !!safe&&q.x>=safe.x&&q.x<=safe.x+safe.width&&q.y>=safe.y&&q.y<=safe.y+safe.height; };
  /** Hàng đường làng đông–tây qua giữa làng (tâm vùng an toàn; bản cũ hàng ô 27–28, bản ×8 hàng 76–79). */
  const VILLAGE_RY=safe.y+safe.height/2+8;
  /** Đi từ làng (vùng an toàn) ra Bãi tập theo đường làng; ngoài làng thì đi về phía đông một đoạn. */
  async function leaveSafe(b){
    const q=b.room.state.players.get(b.room.sessionId), ry=VILLAGE_RY;
    const trace=[], tr=()=>trace.push(`${q.x.toFixed(0)},${q.y.toFixed(0)} moving ${q.moving} spd ${q.spd?.toFixed?.(0)} hp ${q.hp}/${q.maxHp} st ${q.st}`), t0=Date.now(), tick=setInterval(tr,1000);
    if(inSafeOf(b)){
      await goTo(b,q.x,ry,4000);
      // Thời gian đi chạy theo nhịp server (dt kẹp), máy bận thì chậm hơn đồng hồ thật: hết hạn mà còn đang tiến thì đi tiếp (#368),
      // chỉ bỏ cuộc khi một lượt không nhích thêm được 10 pixel.
      for(let n=0;n<6&&inSafeOf(b);n++){ const x0=q.x; await goTo(b,safe.x+safe.width+30,ry); if(Math.abs(q.x-x0)<10) break; }
    }
    else { b.room.send("input",{x:1,y:0}); await sleep(1500); b.room.send("input",{x:0,y:0}); await sleep(150); }
    clearInterval(tick); tr();
    if(inSafeOf(b)) console.log(`  (${b.name} kẹt ở ${q.x.toFixed(0)},${q.y.toFixed(0)} sau ${Date.now()-t0} ms; vết mỗi giây: ${trace.join(" | ")}; log ${b.logs.slice(-3).join(" | ")})`);
    return !inSafeOf(b);
  }
  return { safe, inSafeOf, VILLAGE_RY, leaveSafe };
}

/** Bộ Hạo Thiên 4 món (5.2): `b` đánh thường 3 đòn liên tiếp vào hồn thú `bid` (đã trói, `b` quay mặt về nó); trả số fx `combo`
 *  của từng đòn và chẩn đoán. Chờ theo tin, không sleep cố định (#249): đòn tới khi còn hồi chiêu đánh thường (ATTACK_CD trừ theo
 *  nhịp server, `dt` bị kẹp khi server bận) bị bỏ im lặng, không chém và không đổi bộ đếm liên kích, nên chưa thấy fx `slash` thì
 *  gửi lại; đã chém thì chờ tin `dmg` của `bid` (server gửi `slash`, `combo`, `dmg` liền nhau trong cùng lượt xử lý) rồi mới đếm. */
export async function comboHits(b,bid){
  const sid=b.room.sessionId, q=b.room.state.players.get(sid), combos=[], why=[];
  for(let k=0;k<3;k++){
    b.fxs=[]; b.dmgs=[]; let sent=0;
    while(sent<8&&!b.fxs.some(f=>f.k==="slash"&&f.id===sid)){ b.room.send("attack"); sent++; await waitFor(()=>b.fxs.some(f=>f.k==="slash"&&f.id===sid),400); }
    const hit=await waitFor(()=>b.dmgs.some(m=>m.bid===bid),1500), bb=b.room.state.beasts.get(bid);
    combos.push(b.fxs.filter(f=>f.k==="combo"&&f.id===sid).length);
    why.push(`đòn ${k+1}: gửi ${sent}, chém ${b.fxs.filter(f=>f.k==="slash"&&f.id===sid).length}, ${hit?`trúng ${b.dmgs.filter(m=>m.bid===bid).map(m=>m.v).join("+")}`:"không trúng"}`
      +`, A ${q.x.toFixed(0)},${q.y.toFixed(0)} ${q.hp}/${q.maxHp} ${VOHON[q.vh]?.name}, hồn thú ${bb?`${bb.x.toFixed(0)},${bb.y.toFixed(0)} ${bb.hp}`:"mất"}`);
  }
  return {combos,why:why.join("; ")};
}

/**
 * Tung hồn kỹ ô `i` rồi chờ `wait` ms tính từ lúc server đã xử lý (fx soulring của chính mình, hoặc dòng log từ chối), không từ lúc
 * gửi: máy bận thì lệnh tới server muộn cả trăm ms, đọc sát thương sau một khoảng cố định tính từ lúc gửi có lúc chưa có nhát nào.
 */
export async function skillCast(b,i,wait){ b.dmgs=[]; b.fxs=[]; const l=b.logs.length; b.room.send("skill",{i});
  await waitFor(()=>b.fxs.some(f=>f.k==="soulring"&&f.id===b.room.sessionId)||b.logs.length>l,1500); await sleep(wait); }
