// Nhóm bot "dex" (#1720, BOT_ONLY=dex): Sổ tay hồn thú ghi ở server (rooms/dex.ts). Bot không có Phaser nên chỉ gửi ý định như client:
// quái gần thì được ghi "đã gặp", hạ thì cộng số lần, nạp lại sau khi vào phòng lần nữa (bảng `bestiary` khi --pg), client không khai tay được.
import { readFileSync } from "node:fs";
import { sleep, waitFor, ok, mapUrl, bot, enter, npcSpot, test, needHookSkip } from "./lib.mjs";
import { BEASTS, BEAST_REVEAL } from "../../../shared/data.ts";

export async function dexTest(){
  console.log("[#1720] Sổ tay hồn thú: gặp / hạ do server ghi, nạp lại khi vào lại, client không khai được");
  const F=await bot("Sổ tay thú","xuc_xich",{sex:0,hair:2,hairCol:3,outfitCol:2});
  const mo=()=>F.room.state.players?.get(F.room.sessionId), bs=bid=>F.room.state.beasts.get(bid);
  await waitFor(()=>F.owned&&mo(),3000);
  try{
    if(!(await test(F,"ping"))?.enabled){ needHookSkip("bỏ qua sổ tay (cần hook goto, spawn, clear): bật server bằng GAME_TEST=1"); return; }
    const sv=JSON.parse(readFileSync(mapUrl("thanh_hon_thon"),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="safe"), tv=npcSpot("thanh_hon_thon","to_van_dao");
    let out=false;
    for(const [dx,dy] of [[40,0],[60,0],[40,24],[40,-24],[80,0],[60,48],[60,-48]]){
      const x=sv.x+sv.width+dx, y=Math.max(sv.y+8,Math.min(sv.y+sv.height-8,tv.y))+dy; await test(F,"goto",{x,y});
      if(Math.hypot(mo().x-x,mo().y-y)<1){ out=true; break; } }
    ok(out,`ra ngoài làng (${mo().x.toFixed(0)}, ${mo().y.toFixed(0)})`);
    await test(F,"clear");
    // 1) Xin sổ tay: tài khoản mới chưa gặp loài nào.
    const n0=F.dexN; F.room.send("dex",{op:"get"}); ok(await waitFor(()=>F.dexN>n0,2000),"xin sổ tay: server trả tin dex"); const book=()=>F.dex;
    ok(Object.values(book()).every(n=>n===0),`tài khoản mới: chưa hạ con nào (${JSON.stringify(book())})`);
    // 2) Quái xa (ngoài BEAST_REVEAL.r) rồi lại gần thì ghi "đã gặp" (kills 0). Không khẳng định "xa thì chưa ghi": quái thật cùng loài có thể đang ở gần.
    const far=(await test(F,"spawn",{tier:0,dx:BEAST_REVEAL.r+60,hpx:6}))?.bid; await waitFor(()=>bs(far),1000);
    const sp=BEASTS[bs(far)?.species]?.id;
    await test(F,"goto",{x:bs(far).x-30,y:bs(far).y});
    ok(await waitFor(()=>book()[sp]===0,3000),`lại gần: ${sp} ghi "đã gặp" (kills 0)`);
    // 3) Hạ quái: cộng số lần hạ.
    F.room.send("target",{id:far}); await sleep(200);
    await test(F,"bhp",{pct:1,bid:far});
    // Quái 1% sinh lực chết bằng đòn thường của F khi F trong tầm; quái đi lang thang / lùi nên F lùi xa tầm thì đòn trễ (#1748: CI nhóm 1 ba lượt, quái chết
    // sau ~10 giây, sổ cộng muộn hơn mốc chờ). Cứ mỗi giây áp sát lại và khoá lại quái, tổng vẫn chờ tối đa 20 giây rồi mới ✗.
    let dead=false;
    for(const t0=Date.now();!dead&&Date.now()-t0<20000;){
      dead=await waitFor(()=>!bs(far),1000);
      if(!dead&&bs(far)){ await test(F,"goto",{x:bs(far).x-24,y:bs(far).y}); F.room.send("target",{id:far}); await test(F,"bhp",{pct:1,bid:far}); }
    }
    ok(dead,"quái chết"); ok(await waitFor(()=>book()[sp]===1,3000),`hạ ${sp}: kills 1 (${book()[sp]})`);
    // 4) Client không khai tay được: tin lạ không đổi sổ.
    const before=JSON.stringify(book());
    for(const bad of [{op:"set",set:{[BEASTS[BEASTS.length-1].id]:9}},{op:"see",id:BEASTS[BEASTS.length-1].id},{set:{x:1}},null,7,"x"]){ F.room.send("dex",bad); }
    await sleep(700); F.room.send("dex",{op:"get"}); await sleep(500);
    ok(JSON.stringify(book())===before,`tin dex giả không đổi sổ (${JSON.stringify(book())})`);
    // 5) Vào lại phòng: sổ nạp lại từ nơi lưu (PostgreSQL khi --pg).
    await sleep(500); await F.room.leave(); await sleep(300); await enter(F); F.dex={};
    F.room.send("dex",{op:"get"});
    ok(await waitFor(()=>book()[sp]===1,4000),`vào lại: sổ nạp lại ${sp}=1 (${JSON.stringify(book())})`);
  } finally { try{ await F.room.leave(); }catch{} }
}
