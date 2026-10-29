// Nhóm bot bicanh, phần soát chống gian lận (P6 #877, docs/tech/soat-gian-lan-bi-canh.md): đóng vai kẻ gian cầm client sửa được.
// Vé phòng (người khác joinById / joinOrCreate không vé, chủ vé vào hai lần, vào lại phòng đã chốt), tranh `enter` với `buy` cùng nhịp, rời lúc đếm ngược (không hoàn lượt, không quyển),
// tin ngoài danh sách chặn gửi trong phòng (đổi kênh, tông môn, ngoại hình, hạch, đội hình, tổ đội, bạn bè, chat) không đổi túi / Hồn Tệ / vị trí, hook không bật khi thiếu GAME_TEST.
// Không dựa vào ngẫu nhiên kịch bản. Chạy cuối nhóm bicanh (tài khoản riêng, hai lượt vào phòng).
import { Client } from "colyseus.js";
import { sleep, waitFor, ok, bot, test, qtyOf, needHookSkip, post, enter, bagKey, WS } from "./lib.mjs";
import { ASK_CD, BICANH, bicanhRunPrice } from "../../../shared/data.ts";

export async function bicanhSoatTest(){
  console.log("[#877 P6] Bí Cảnh: soát chống gian lận (vé phòng, tranh enter / buy, rời sớm, tin ngoài danh sách chặn)");
  const V=await bot("Bí Cảnh V","hoa_anh",{sex:1,hair:2,hairCol:1,outfitCol:4});
  if(!(await test(V,"ping"))?.enabled){ needHookSkip("bỏ qua soát Bí Cảnh (cần hook coin, down, bcfast): bật server bằng GAME_TEST=1"); await V.room.leave(); return; }
  const X=await bot("Bí Cảnh X","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3});
  const S=BICANH.scenes[0], ID=S.id, price=i=>bicanhRunPrice(S,i), runOf=m=>m?.runs?.find(r=>r.id===ID), meOf=()=>V.room.state.players?.get(V.room.sessionId);
  await waitFor(()=>V.bag&&X.bag,3000);
  const get=async()=>{ await sleep(ASK_CD*1000+100); const n=V.bc.length; V.room.send("bicanh",{op:"get"}); await waitFor(()=>V.bc.length>n,3000); await sleep(80); return V.bc.at(-1); };
  const back=async()=>{ V.mapId=(await post("/api/me",{token:V.token})).mapId; await enter(V); await waitFor(()=>meOf()&&V.owned&&V.bag&&V.squad,4000); };
  /** Mọi cách vào phòng `roomId` mà bị từ chối đều ném lỗi: trả true nếu bị từ chối. */
  const rejected=async(go)=>{ try{ const r=await go(); await r.leave().catch(()=>{}); return false; }catch{ return true; } };
  const joinBy=(who,roomId)=>new Client(WS).joinById(roomId,{token:who.token,mapId:who.mapId});
  const foundOf=async(n)=>{ await waitFor(()=>V.bc.slice(n).some(m=>m.k==="found"||m.err),5000); await sleep(300); return V.bc.slice(n).filter(m=>m.k==="found"); };

  // 1. Tranh `enter` với `buy` cùng nhịp (hai tin nối nhau, không chờ): đúng một phòng, tiền trừ đúng số lượt mua thành công, lượt không lệch.
  const COIN=1e6; await test(V,"coin",{n:COIN}); await waitFor(()=>V.bag.honTe===COIN,1500);
  let n0=V.bc.length; V.room.send("bicanh",{op:"enter",id:ID}); V.room.send("bicanh",{op:"buy",id:ID,pay:true}); V.room.send("bicanh",{op:"enter",id:ID});
  const found=await foundOf(n0); const roomId=found[0]?.roomId;
  ok(found.length===1&&!!roomId,`enter + buy + enter dồn: đúng một tin found (${found.length})`);
  await V.room.leave(); await sleep(400);
  // 2. Vé: người khác (có token hợp lệ) không vào được phòng của chủ vé; không vé thì không mở được phòng Bí Cảnh; vé không bị tiêu hao bởi kẻ thử.
  ok(await rejected(()=>joinBy(X,roomId)),"tài khoản khác joinById phòng Bí Cảnh của người ta: bị từ chối");
  ok(await rejected(()=>new Client(WS).joinOrCreate("bicanh",{token:X.token})),"joinOrCreate('bicanh') không vé: không mở được phòng");
  ok(await rejected(()=>new Client(WS).joinOrCreate("bicanh",{token:X.token,ticket:"x"})),"joinOrCreate('bicanh') vé giả: không mở được phòng");
  ok(await rejected(()=>new Client(WS).create("bicanh",{token:X.token,ticket:"x"})),"create('bicanh') vé giả: bị từ chối");
  ok(await rejected(()=>new Client(WS).joinOrCreate("bicanh",{token:"khong-co-token"})),"joinOrCreate('bicanh') token lạ: bị từ chối");
  // 3. Chủ vé vào được (vé còn nguyên sau các lần thử), vào lần hai cùng lúc thì bị từ chối và phiên đầu không rớt.
  V.mapId=(await post("/api/me",{token:V.token})).mapId;
  await enter(V,roomId); await waitFor(()=>meOf(),3000);
  ok(!!meOf()&&V.room.state.mapId==="dai_dau_hon_truong","chủ vé vào được phòng sau các lần thử của kẻ khác");
  ok(await rejected(()=>joinBy(V,roomId)),"chủ vé vào lần hai (hai tab) cùng phòng: bị từ chối");
  await sleep(500); ok(V.leftCode===null&&!!meOf(),"phiên đầu vẫn nguyên sau lần vào thứ hai");
  // 4. Rời lúc đếm ngược (trước giao đấu): thua, lượt KHÔNG hoàn, không quyển; về bản đồ đủ nguyên.
  const tome0=qtyOf(V,BICANH.tome), hon0=V.bag.honTe;
  await V.room.leave(); await sleep(900); await back();
  let s=await get(), r=runOf(s);
  ok(r.left===S.runs+r.bought-1&&qtyOf(V,BICANH.tome)===tome0,`rời lúc đếm ngược: lượt không hoàn (${r.left}/${r.max}), không quyển (${qtyOf(V,BICANH.tome)})`);
  ok(V.bag.honTe===COIN-(r.bought?[...Array(r.bought).keys()].reduce((a,i)=>a+price(i),0):0)&&hon0===V.bag.honTe,`tranh enter / buy: Hồn Tệ khớp số lượt mua (${r.bought} lượt, ${V.bag.honTe})`);
  // 5. Phòng đã chốt (thua) không vào lại được bằng chính mã phòng; tin ngoài danh sách chặn gửi trong phòng không đổi túi / tiền / vị trí.
  n0=V.bc.length; V.room.send("bicanh",{op:"enter",id:ID}); const f2=await foundOf(n0); ok(f2.length===1,"vào lượt kế: có phòng");
  await V.room.leave(); V.mapId=(await post("/api/me",{token:V.token})).mapId; await enter(V,f2[0].roomId); await waitFor(()=>meOf(),3000);
  await sleep(1200); const key0=bagKey(V); // chờ các tin riêng đầu phòng (túi, võ hồn) về hết rồi mới lấy mốc
  const odd=[];
  for(const m of [["channel",{ch:2}],["channels",{}],["tong",{op:"claim"}],["tong",{op:"turnin",chain:"x"}],["tong",{op:"join",tong:"x"}],["looks",{looks:{sex:0,hair:1,hairCol:1,outfitCol:1,skin:0}}],
    ["coreset",{id:1,set:"x",npc:"x"}],["loadout",{rowId:1,skills:[0]}],["party",{op:"create"}],["party",{op:"invite",name:X.name}],["friend",{op:"add",name:X.name}],["chat",{text:"xin chào"}],
    ["rally",{}],["shardinfo",{}],["talk",{npc:"x"}],["wp",{op:"cast",key:"x"}],["rank",{op:"boards"}],["welfare",{op:"sign"}],["calendar",{op:"get"}]]){
    V.room.send(...m); await sleep(250);
    if(V.leftCode!==null||bagKey(V)!==key0||V.room.state.mapId!=="dai_dau_hon_truong"){ odd.push(`${m[0]}${m[1].op?":"+m[1].op:""}`); break; } }
  ok(!odd.length,`tin ngoài danh sách chặn (kênh, tông, ngoại hình, hạch, tổ đội, bạn bè, chat…): không đổi túi / Hồn Tệ, vẫn trong phòng${odd.length?` (đổi ở: ${odd[0]}, mã rời ${V.leftCode}, túi ${bagKey(V)===key0?"giữ":"đổi"}, bản đồ ${V.room.state.mapId}, kênh ${V.room.state.channel})`:""}`);
  await test(V,"bcfast",{s:0.2}); await waitFor(()=>V.bc.some(m=>m.k==="fight"),8000);
  for(let k=0;k<8&&!meOf()?.dead;k++) await test(V,"down");
  const end=await (async()=>{ await waitFor(()=>V.bc.some(m=>m.k==="end"),6000); return V.bc.find(m=>m.k==="end"); })();
  ok(end&&!end.win&&end.tomes===0,"thua: kết quả chốt, không quyển");
  ok(await rejected(()=>joinBy(V,f2[0].roomId)),"phòng đã chốt: chủ vé vào lại bằng mã phòng bị từ chối");
  await test(V,"bcfast",{s:0.2}); await waitFor(()=>V.leftCode===4005,4000); await back();
  s=await get(); ok(V.bag.honTe===hon0&&qtyOf(V,BICANH.tome)===tome0&&runOf(s).left===S.runs+runOf(s).bought-2,`sau hai lượt thua / rời sớm: Hồn Tệ ${V.bag.honTe}, quyển ${qtyOf(V,BICANH.tome)}, lượt ${runOf(s).left}/${runOf(s).max} (không hoàn)`);
  await V.room.leave(); await X.room.leave();
}
