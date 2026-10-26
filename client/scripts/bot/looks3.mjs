// Nhóm bot "looks3" (#703 bước 2, tách nguyên văn từ bot-test.mjs).
import { npcDef, LOOKS_CHANGE, looksChangeCost, LPC_RAMPS, parseLpc, encodeLpc, presetToLpc } from "../../../shared/data.ts";
import { bot, test, npcSpot, enter, talk, ok, post, sleep, waitFor } from "./lib.mjs";

/**
 * Đổi ngoại hình ở thợ may (L4 #511, BOT_ONLY=looks3): tạo nhân vật lần đầu miễn phí cả hai chế độ (đã kiểm ở looks2 / bot()); sau đó chỉ đổi
 * được qua thợ may (role "looks") đứng gần: lần đầu miễn phí, từ lần hai tốn LOOKS_CHANGE.cost, thiếu tiền / đứng xa / mã lạ / giống hiện
 * tại bị từ chối không mất gì; ba lệnh đổi cùng lúc chỉ một lệnh được tính (trừ tiền một lần); lưu qua lần vào lại; người xung quanh thấy ngay.
 */
export async function looks3Test(){
  console.log("[#511] Đổi ngoại hình ở thợ may");
  const npc=npcDef("tho_may"), npc2=npcDef("tho_may_thien_dau");
  ok(npc?.role==="looks"&&npc2?.role==="looks"&&LOOKS_CHANGE.free===1&&LOOKS_CHANGE.cost>0&&looksChangeCost(0)===0&&looksChangeCost(LOOKS_CHANGE.free)===LOOKS_CHANGE.cost,
    `dữ liệu: thợ may role looks, ${LOOKS_CHANGE.free} lần đầu miễn phí, sau đó ${LOOKS_CHANGE.cost} đồng`);
  const S=await bot("Thợ may","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2}), O=await bot("Thợ may xem","u_minh_linh_mieu",{sex:0,hair:1,hairCol:2,outfitCol:1});
  if(!(await test(S,"ping"))?.enabled){ console.log("  ⚠ bỏ qua đổi ngoại hình (cần hook test): bật server bằng GAME_TEST=1"); await S.room.leave(); await O.room.leave(); return; }
  try{
  const MAP="nac_dinh_thanh", sp=npcSpot(MAP,"tho_may"), me=b=>b.room.state.players?.get(b.room.sessionId), seen=()=>O.room.state.players?.get(S.room.sessionId);
  async function rejoin(b){ await b.room.leave(); await sleep(400); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>me(b)&&b.bag,3000); }
  for(const b of [S,O]){ b.travel=null; b.room.send("test",{op:"warp",mapId:MAP,x:sp.x,y:sp.y+16}); ok(await waitFor(()=>b.travel?.mapId===MAP,4000),`${b.name}: tới ${MAP}`); await rejoin(b); await test(b,"goto",{x:sp.x,y:sp.y+16}); }
  // Gửi `looks`, chờ tin `looksinfo` (số lần đã đổi, hoặc lý do từ chối); trả {err, n, honTe}.
  async function change(b,looks,npcId="tho_may"){ const n=b.looksN; b.room.send("looks",{looks,npc:npcId}); await waitFor(()=>b.looksN>n,2000); await sleep(150); return {...b.looksInfo, honTe:b.bag?.honTe}; }
  const lpc={v:1,body:1,parts:{body:"body.body",head:"head.female",hair:"hair.long_straight",torso:"torso.longsleeve"},colors:{skin:"amber",eye:"green",hair:"chestnut",torso:LPC_RAMPS.cloth.allow[3]}};
  const lpc2={...lpc,body:0,parts:{...lpc.parts,head:"head.male",hair:"hair.parted"}};
  ok(parseLpc(lpc)&&parseLpc(lpc2),"dữ liệu thử hợp lệ");
  const E=encodeLpc(parseLpc(lpc)), E2=encodeLpc(parseLpc(lpc2)), EP=encodeLpc(presetToLpc({sex:0,hair:2,hairCol:3,outfitCol:4,skin:1})); // EP: preset kiểu cũ gửi lên đã đổi sang LPC (HL2)
  const preset={mode:"preset",sex:0,hair:2,hairCol:3,outfitCol:4,skin:1};
  const state=()=>{ const p=me(S); return p?{sex:p.sex,hair:p.hair,hairCol:p.hairCol,outfitCol:p.outfitCol,skin:p.skin,lpc:p.lpc}:null; };
  const before=JSON.stringify(state()); await test(S,"coin",{n:LOOKS_CHANGE.cost*5}); await sleep(200);
  // Đứng xa thợ may: từ chối, không đổi, không mất tiền.
  await test(S,"goto",{x:sp.x+400,y:sp.y+400});
  let r=await change(S,{mode:"lpc",lpc}); ok(/lại gần/.test(r.err??"")&&JSON.stringify(state())===before&&r.honTe===LOOKS_CHANGE.cost*5,`đứng xa thợ may: từ chối (${r.err})`);
  await test(S,"goto",{x:sp.x,y:sp.y+16});
  ok(await talk(S,"tho_may")==="tho_may"&&S.looksInfo?.n===0,"nói chuyện với thợ may: số lần đã đổi 0");
  // Mã lạ / giá trị sai / giống hiện tại: từ chối.
  const badLpc=[{...lpc,parts:{...lpc.parts,hair:"hair.khong_co"}},{...lpc,parts:{...lpc.parts,hair:"torso.longsleeve"}},{...lpc,colors:{...lpc.colors,hair:"xanh_la_cay"}},{...lpc,parts:{body:"body.body"}},{...lpc,v:2}];
  for(const b of badLpc){ r=await change(S,{mode:"lpc",lpc:b}); ok(/không hợp lệ/.test(r.err??"")&&JSON.stringify(state())===before&&S.looksInfo.n===0,"mã LPC lạ / sai ô / sai màu / thiếu ô / sai phiên bản: từ chối"); }
  for(const b of [{...preset,hair:9},{...preset,mode:"khac"},null,"x",{mode:"lpc"}]){ r=await change(S,b); ok(/không hợp lệ/.test(r.err??"")&&JSON.stringify(state())===before,`ngoại hình sai ${JSON.stringify(b)}: từ chối`); }
  r=await change(S,{mode:"preset",sex:1,hair:0,hairCol:1,outfitCol:2,skin:0}); ok(/giống hiện tại/.test(r.err??"")&&r.n===0,`giống hiện tại: từ chối (${r.err})`);
  r=await change(S,preset,"dai_su"); ok(/thợ may/.test(r.err??"")&&JSON.stringify(state())===before,"mã NPC không phải thợ may: từ chối");
  ok(r.honTe===LOOKS_CHANGE.cost*5,"các ca bị từ chối không trừ tiền");
  // Lần 1: preset -> lpc, miễn phí.
  r=await change(S,{mode:"lpc",lpc}); ok(!r.err&&r.n===1&&r.honTe===LOOKS_CHANGE.cost*5&&state().lpc===E,`đổi lần đầu (Mẫu dựng sẵn → Tự tạo): miễn phí, số lần = ${r.n}`);
  ok(await waitFor(()=>seen()?.lpc===E,2000),"người ở gần thấy ngoại hình mới ngay");
  let acc=await post("/api/me",{token:S.token}); ok(acc.looks?.mode==="lpc"&&acc.looks.chosen&&acc.looks.changes===1&&encodeLpc(acc.looks.lpc)===E,"/api/me: ngoại hình mới và số lần đổi = 1 (lưu DB)");
  // Lần 2: lpc -> preset (không `mode`, như client cũ), tốn tiền.
  r=await change(S,{sex:0,hair:2,hairCol:3,outfitCol:4,skin:1}); ok(!r.err&&r.n===2&&r.honTe===LOOKS_CHANGE.cost*4&&state().lpc===EP&&state().hair===0,`đổi lần hai (Tự tạo → preset kiểu cũ, server đổi sang LPC): −${LOOKS_CHANGE.cost}, còn ${r.honTe}`);
  acc=await post("/api/me",{token:S.token}); ok(acc.looks?.mode==="lpc"&&acc.looks.changes===2&&encodeLpc(acc.looks.lpc)===EP,"/api/me: LPC từ preset cũ, số lần đổi = 2");
  ok(await waitFor(()=>seen()?.lpc===EP,2000),"người ở gần thấy ngoại hình mới (về preset)");
  // Thiếu tiền (thiếu 1 đồng): từ chối, không đổi gì.
  await test(S,"coin",{n:LOOKS_CHANGE.cost-1}); await sleep(200);
  r=await change(S,{mode:"lpc",lpc:lpc2}); ok(/Hồn Tệ/.test(r.err??"")&&r.n===2&&r.honTe===LOOKS_CHANGE.cost-1&&state().lpc===EP,"thiếu tiền: từ chối, không đổi, không mất tiền");
  // Chống đua lệnh: đủ tiền cho đúng một lần, gửi ba lệnh cùng lúc: chỉ một lệnh được tính.
  await test(S,"coin",{n:LOOKS_CHANGE.cost}); await sleep(200);
  const n0=S.looksN; for(const l of [lpc2,lpc,lpc2]) S.room.send("looks",{looks:{mode:"lpc",lpc:l},npc:"tho_may"});
  await waitFor(()=>S.looksN>=n0+3,3000); await sleep(400);
  acc=await post("/api/me",{token:S.token});
  ok(acc.looks.changes===3&&S.bag?.honTe===0&&state().lpc===E2,`ba lệnh đổi dồn: chỉ một lệnh được tính (số lần ${acc.looks.changes}, còn ${S.bag?.honTe} đồng)`);
  // Lưu qua lần vào lại; thợ may thứ hai (Thiên Đấu) tính chung số lần.
  await rejoin(S); ok(state().lpc===E2,"vào lại: ngoại hình lưu đúng");
  await test(S,"coin",{n:LOOKS_CHANGE.cost}); await sleep(200);
  const sp2=npcSpot("thien_dau_thanh","tho_may_thien_dau");
  S.travel=null; S.room.send("test",{op:"warp",mapId:"thien_dau_thanh",x:sp2.x,y:sp2.y+16});
  ok(await waitFor(()=>S.travel?.mapId==="thien_dau_thanh",4000),"tới Thiên Đấu Thành"); await rejoin(S); await test(S,"goto",{x:sp2.x,y:sp2.y+16});
  ok(await talk(S,"tho_may_thien_dau")==="tho_may_thien_dau"&&S.looksInfo?.n===3,"thợ may Thiên Đấu: số lần đổi dùng chung theo tài khoản (3)");
  r=await change(S,preset,"tho_may_thien_dau"); ok(!r.err&&r.n===4&&r.honTe===0&&state().lpc===EP,`đổi ở thợ may Thiên Đấu: tốn ${LOOKS_CHANGE.cost}, số lần = ${r.n}`);
  }finally{ await S.room.leave().catch(()=>{}); await O.room.leave().catch(()=>{}); }
}
