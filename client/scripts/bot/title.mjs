// Nhóm bot "danhhieu" (Danh Hiệu, mục 5.25, #1789; BOT_ONLY=danhhieu, nhóm 2 của BOT_PART): tin `title {op:"get"|"equip", id?}` qua server thật.
// Phần thuần (danh mục, luật ghi của store, chạy đua) do server/scripts/title-test.ts thử; ở đây thử đường đi đầy đủ: trạng thái lúc vào, tin lạ / mã lạ,
// đeo danh hiệu chưa mở bị từ chối, đeo / bỏ đeo, danh hiệu có hạn hết hạn tự về mặc định cấp, người khác thấy `titleId` trong tầm nhìn và không thấy ngoài tầm,
// dồn 200 tin, vào lại phòng. Mở danh hiệu không cấp qua tin client: dùng hook `title` (GAME_TEST) thay phần server tự cấp.
import { readFileSync } from "node:fs";
import { sleep, waitFor, ok, bot, test, needHookSkip, post, enter, mapFileOf } from "./lib.mjs";
import { TITLE_DEFS } from "../../../shared/data.ts";

export async function titleTest(){
  console.log("[#1789] Danh Hiệu qua server");
  const A=await bot("Danh Hiệu A","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3},true);
  const B=await bot("Danh Hiệu B","yeu_ho",{sex:1,hair:1,hairCol:1,outfitCol:2},true);
  if(!(await test(A,"ping"))?.enabled){ needHookSkip("bỏ qua Danh Hiệu (cần hook title, goto): bật server bằng GAME_TEST=1"); await A.room.leave(); await B.room.leave(); return; }
  const me=b=>b.room.state.players?.get(b.room.sessionId), seen=(b,o)=>b.room.state.players?.get(o.room.sessionId);
  const dist=(a,c)=>Math.hypot(a.x-c.x,a.y-c.y);
  /** Gửi một tin `title` và chờ tin riêng trả lời mới (mọi lần từ chối cũng trả lại trạng thái kèm `err`). */
  const act=async msg=>{ const n=A.tt.length; A.room.send("title",msg); const got=await waitFor(()=>A.tt.length>n,3000); await sleep(80); return got?A.tt.at(-1):null; };
  const grant=(id,ttlMs)=>test(A,"title",{grant:id,...(ttlMs?{ttlMs}:{})});
  // Danh hiệu không thuộc nhóm cấp: server mới cấp được, người chơi mới chưa có.
  const other=TITLE_DEFS.filter(t=>t.group!=="cap"&&t.source.kind!=="level"), vip=other[0].id, vip2=other[1].id, vip3=other[2].id;
  await waitFor(()=>me(A)&&me(B),3000);

  // 1. Vào phòng: server tự gửi danh sách riêng; lúc mới chỉ có danh hiệu cấp, chưa đeo, titleId công khai rỗng.
  ok(await waitFor(()=>A.tt.length>0,3000),"vào phòng: server tự gửi tin title");
  let s=A.tt.at(-1);
  ok(s&&Array.isArray(s.owned)&&s.equipped===null&&s.owned.some(o=>o.id==="cap_1")&&s.owned.every(o=>TITLE_DEFS.find(t=>t.id===o.id)?.group==="cap"),`lúc mới: chỉ danh hiệu cấp (${s?.owned.map(o=>o.id)}), chưa đeo`);
  ok(me(A).titleId==="","titleId công khai rỗng (dùng danh hiệu cấp mặc định)");
  s=await act({op:"get"}); ok(s&&Array.isArray(s.owned),"get: trả trạng thái");

  // 2. Tin lạ / mã lạ: vẫn kết nối, không đổi gì, không mở gì.
  { const n=A.tt.length; for(const m of [null,{},{op:1},"x",{op:"grant",id:vip},{op:"set",id:vip},{op:"equip",id:{a:1}},{op:"equip",id:["cap_1"]},{op:"equip",id:"khong_co"},{op:"equip",id:"__proto__"},{op:"equip",id:7}]) A.room.send("title",m);
    await sleep(900); ok(A.leftCode===null,"tin lạ / mã lạ: vẫn kết nối"); ok(me(A).titleId===""&&A.tt.slice(n).every(x=>x.equipped===null&&!x.owned.some(o=>o.id===vip)),"tin lạ không đeo, không mở gì (client không có đường cấp)"); }

  // 3. Đeo danh hiệu không sở hữu: từ chối, titleId giữ nguyên.
  s=await act({op:"equip",id:vip}); ok(!!s?.err&&s.equipped===null&&me(A).titleId==="",`đeo ${vip} khi chưa có: từ chối (${s?.err})`);
  s=await act({op:"equip",id:"cap_10"}); ok(!!s?.err&&me(A).titleId==="",`đeo cap_10 khi cấp thấp: từ chối (${s?.err})`);

  // 4. Đeo / bỏ đeo danh hiệu cấp đã mở.
  s=await act({op:"equip",id:"cap_1"}); ok(!s?.err&&s.equippedNow==="cap_1"&&s.equipped==="cap_1"&&await waitFor(()=>me(A).titleId==="cap_1",1500),`đeo cap_1: titleId = ${me(A).titleId}`);
  s=await act({op:"equip",id:null}); ok(!s?.err&&s.equipped===null&&await waitFor(()=>me(A).titleId==="",1500),"bỏ đeo (id null): về mặc định theo cấp");
  await act({op:"equip",id:"cap_1"}); s=await act({op:"equip"}); ok(s?.equipped===null&&await waitFor(()=>me(A).titleId==="",1500),"thiếu id: cũng về mặc định");

  // 5. Mở danh hiệu (hook, như server cấp) rồi đeo; cấp lại không đổi gì (idempotent).
  let r=await grant(vip); ok(r?.grant==="new"&&r.owned.includes(vip),`hook cấp ${vip}: mới`);
  r=await grant(vip); ok(r?.grant==="dup",`cấp lại ${vip}: dup, không đổi`);
  s=await act({op:"equip",id:vip}); ok(!s?.err&&s.equipped===vip&&await waitFor(()=>me(A).titleId===vip,1500),`đeo ${vip}: titleId = ${me(A).titleId}`);

  // 6. Người khác thấy titleId trong tầm nhìn; ra ngoài tầm thì không có trong state (không rò), về lại thì thấy.
  const MAP=A.room.state.mapId, objs=JSON.parse(readFileSync(new URL(`../../../shared/assets/${mapFileOf(MAP)}.json`,import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[]);
  ok(await waitFor(()=>seen(B,A)?.titleId===vip,2500),`B ở gần thấy titleId của A = ${seen(B,A)?.titleId}`);
  { const w=objs.filter(o=>o.type==="waypoint").map(o=>({x:o.x+o.width/2,y:o.y+o.height/2})).sort((p,q)=>dist(q,me(A))-dist(p,me(A)))[0];
    const home={x:me(A).x,y:me(A).y}; let moved=false;
    if(w) for(const [dx,dy] of [[0,0],[16,0],[0,16],[-16,0],[0,-16],[32,32],[-32,32]]){ await test(B,"goto",{x:w.x+dx,y:w.y+dy}); if(dist(me(B),{x:w.x+dx,y:w.y+dy})<2){ moved=true; break; } }
    if(moved&&dist(me(B),home)>800){
      ok(await waitFor(()=>!B.room.state.players.has(A.room.sessionId),2500),`B xa A ${Math.round(dist(me(B),home))} pixel: A không có trong state của B (titleId không lộ)`);
      for(const [dx,dy] of [[0,0],[16,0],[0,16],[-16,0],[0,-16]]){ await test(B,"goto",{x:home.x+dx,y:home.y+dy}); if(dist(me(B),home)<40) break; }
      ok(await waitFor(()=>seen(B,A)?.titleId===vip,3000),`B quay lại: thấy lại titleId = ${seen(B,A)?.titleId}`);
    } else console.log("  ⚠ không dịch B ra đủ xa trên bản đồ này, bỏ kiểm tra ngoài tầm"); }
  await act({op:"equip",id:null}); ok(await waitFor(()=>seen(B,A)?.titleId==="",2500),"A bỏ đeo: B thấy titleId rỗng");

  // 7. Danh hiệu có hạn: đang đeo mà hết hạn thì tự về mặc định (không cần tin của client), tin riêng báo lại.
  r=await grant(vip2,2500); ok(r?.grant==="new"&&r.owned.includes(vip2),`cấp ${vip2} có hạn 2,5 giây`);
  s=await act({op:"equip",id:vip2}); ok(!s?.err&&await waitFor(()=>me(A).titleId===vip2,1500),`đeo ${vip2} còn hạn`);
  { const n=A.tt.length; ok(await waitFor(()=>me(A).titleId==="",7000)&&await waitFor(()=>A.tt.length>n&&A.tt.at(-1).equipped===null&&!A.tt.at(-1).owned.some(o=>o.id===vip2),3000),"hết hạn: titleId tự về rỗng, danh sách riêng không còn danh hiệu đó"); }
  s=await act({op:"equip",id:vip2}); ok(!!s?.err&&me(A).titleId==="",`đeo lại ${vip2} đã hết hạn: từ chối (${s?.err})`);
  await sleep(200); ok(seen(B,A)?.titleId==="","B thấy A về mặc định sau khi hết hạn");

  // 8. Dồn 200 tin equip luân phiên: vẫn kết nối, kết quả cuối khớp (một ô đeo duy nhất).
  await grant(vip3);
  { const n=A.tt.length; for(let k=0;k<200;k++) A.room.send("title",{op:"equip",id:k%2?"cap_1":vip3}); await waitFor(()=>A.tt.length>n,4000); await sleep(1200);
    const fin=await act({op:"get"}); ok(A.leftCode===null&&fin&&(fin.equipped===null||["cap_1",vip3].includes(fin.equipped))&&me(A).titleId===(fin.equipped??""),`dồn 200 equip: vẫn kết nối, titleId = "${me(A).titleId}" khớp danh sách riêng (${fin?.equipped}), ${A.tt.length-n} tin trả`); }

  // 9. Vào lại phòng: danh hiệu đang đeo còn nguyên.
  s=await act({op:"equip",id:vip3}); const keep=s?.equipped; await A.room.leave(); await sleep(400); A.mapId=(await post("/api/me",{token:A.token})).mapId; A.tt=[]; await enter(A); await waitFor(()=>me(A),3000);
  ok(await waitFor(()=>A.tt.length>0,3000)&&A.tt.at(-1).equipped===keep&&await waitFor(()=>me(A).titleId===keep,2000),`vào lại: vẫn đeo ${keep} (titleId = ${me(A).titleId})`);
  await A.room.leave(); await B.room.leave();
}
