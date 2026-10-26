// Nhóm bot "shardBuy" (#703 bước 2, tách nguyên văn từ bot-test.mjs).
import { SHARD_BUY, shardBuyPrice, shardBuyCost, formatHonTe, ARENA_SHARDS, VOHON, vohonIndex, npcDef, SHARD_SELL, MAPS, shardCode, RING_ITEM, starCost, SHARD_UNLOCK } from "../../../shared/data.ts";
import { same, bot, test, looseOf, enter, trade, qtyOf, npcSpot, talk, bagKey, ok, post, sleep, waitFor, needHookSkip } from "./lib.mjs";

/**
 * #282 Thương hội Thiên Đấu đổi mảnh võ hồn (bot riêng M; BOT_ONLY=shardbuy, nhóm 5): giá tăng dần, chỉ mảnh SR / SSR (không UR, không Lam
 * Ngân Thảo, mã lạ), đứng xa / NPC khác bị từ chối, mua 1 / mua N, thiếu Hồn Tệ / thiếu chỗ từ chối hết, bấm dồn không vượt trần hay sai
 * giá, hết lượt, số đã đổi lưu DB (hook claims) và còn sau khi vào lại, sang ngày mới (hook day) thì đặt lại.
 */
export async function shardBuyTest(){
  console.log("[#282] Thương hội Thiên Đấu đổi mảnh võ hồn");
  const K=SHARD_BUY, P=Array.from({length:K.daily},(_,i)=>shardBuyPrice(i));
  ok(same(P,[2000,3000,4500,6800,10100,15200,22800,34200,51300,76900])&&shardBuyCost(0,K.daily)===226800&&shardBuyCost(3,2)===P[3]+P[4]&&shardBuyCost(5,0)===0,
    `giá mảnh trong ngày ${P.map(formatHonTe).join(" / ")}; đủ ${K.daily} mảnh ${formatHonTe(shardBuyCost(0,K.daily))}`);
  ok(ARENA_SHARDS.length>0&&ARENA_SHARDS.every(id=>VOHON[vohonIndex(id)].rarity!=="UR")&&!ARENA_SHARDS.includes("lam_ngan_thao")&&npcDef(K.npc)?.role==="shop",
    `chỉ ${ARENA_SHARDS.length} võ hồn SR / SSR (không UR, không Lam Ngân Thảo), ở ${npcDef(K.npc)?.name} · ${npcDef(K.npc)?.title}`);
  ok(Math.max(...Object.values(SHARD_SELL))*K.daily<P[0],`không vòng in tiền: thương nhân mua lại mảnh tối đa ${formatHonTe(Math.max(...Object.values(SHARD_SELL)))}`);
  const M=await bot("Mua mảnh","u_minh_linh_mieu",{sex:1,hair:1,hairCol:3,outfitCol:0});
  if(!(await test(M,"ping"))?.enabled){ needHookSkip("bỏ qua Thương hội đổi mảnh (cần hook warp, coin, give, day, claims): bật server bằng GAME_TEST=1"); await M.room.leave(); return; }
  const TD="thien_dau_thanh", me=()=>M.room.state.players?.get(M.room.sessionId), loose=()=>looseOf(M);
  try{
  await waitFor(()=>me()&&M.bag,3000);
  async function warp(mapId,x,y){
    M.travel=null; M.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>M.travel?.mapId===mapId,4000),`warp -> ${MAPS[mapId].name}`);
    await M.room.leave(); await sleep(300); M.mapId=(await post("/api/me",{token:M.token})).mapId; await enter(M);
    await waitFor(()=>me()&&M.bag,3000);
  }
  async function relog(){ await M.room.leave(); await sleep(400); M.mapId=(await post("/api/me",{token:M.token})).mapId; await enter(M); await waitFor(()=>me()&&M.bag,3000); }
  const info=async()=>{ M.shardInfo=null; M.room.send("shardinfo"); await waitFor(()=>M.shardInfo,1500); return M.shardInfo?.n; };
  const coin=async n=>{ await test(M,"coin",{n}); return waitFor(()=>M.bag.honTe===n,1500); };
  const buy=(vohon,qty,npc=K.npc)=>trade(M,"shardbuy",{vohon,qty,npc});
  const has=id=>qtyOf(M,shardCode(id)), rar=r=>ARENA_SHARDS.filter(id=>VOHON[vohonIndex(id)].rarity===r);
  const [SR]=rar("SR"), [SSR]=rar("SSR"), SR2=ARENA_SHARDS.find(id=>id!==SR&&id!==SSR), UR=VOHON.find(v=>v.rarity==="UR").id; // SR2: võ hồn thứ ba, chưa có mảnh
  await coin(1e6);
  // Đứng ở làng (không có Chưởng quỹ): từ chối.
  let t=await buy(SR,1); ok(/đứng cạnh thương nhân/.test(t)&&M.bag.honTe===1e6&&!has(SR),`chưa tới Thiên Đấu Thành: từ chối (${t})`);
  const sp=npcSpot(TD,K.npc); await warp(TD,sp.x,sp.y+16);
  ok(await talk(M,K.npc)===K.npc,`đứng cạnh ${npcDef(K.npc).name}: mở hộp thoại`);
  ok(await info()===0&&M.shardInfo.daily===K.daily,`tài khoản mới: hôm nay đã đổi 0/${K.daily}`);
  // Mảnh không bán: UR, Lam Ngân Thảo, mã lạ; số lượng sai; NPC khác (lò rèn ở xa).
  for(const v of [UR,"lam_ngan_thao","xx",7]){ t=await buy(v,1); ok(/chỉ đổi mảnh võ hồn SR \/ SSR/.test(t)&&M.bag.honTe===1e6,`mảnh ${v}: từ chối (${t})`); }
  ok(!has(UR)&&!has("lam_ngan_thao"),"không có mảnh UR / Lam Ngân Thảo nào vào túi");
  for(const q of [0,K.daily+1,1.5,"2"]){ t=await buy(SR,q); ok(/Mỗi lần đổi từ 1 đến/.test(t)&&M.bag.honTe===1e6,`số lượng ${JSON.stringify(q)}: từ chối`); }
  t=await buy(SR,1,"lo_ren_thien_dau"); ok(/đứng cạnh thương nhân/.test(t)&&M.bag.honTe===1e6,`gửi mã NPC lò rèn: từ chối (${t})`);
  // Mua 1 rồi mua 3: giá tăng dần, tính chung mọi võ hồn.
  t=await buy(SR,1); await waitFor(()=>M.shardInfo?.n===1,1500);
  ok(has(SR)===1&&M.bag.honTe===1e6-P[0]&&/hôm nay 1\/10/.test(t),`đổi 1 mảnh ${VOHON[vohonIndex(SR)].name}: −${formatHonTe(P[0])} (${t})`);
  t=await buy(SSR,3); await waitFor(()=>M.shardInfo?.n===4,1500);
  ok(has(SSR)===3&&M.bag.honTe===1e6-shardBuyCost(0,4)&&M.shardInfo.n===4,`đổi 3 mảnh ${VOHON[vohonIndex(SSR)].name}: −${formatHonTe(shardBuyCost(1,3))} (${P.slice(1,4).map(formatHonTe).join(" + ")})`);
  // Thiếu Hồn Tệ (thiếu 1 đồng cho 2 mảnh kế tiếp): từ chối hết.
  await coin(shardBuyCost(4,2)-1); t=await buy(SR,2);
  ok(/Không đủ Hồn Tệ/.test(t)&&has(SR)===1&&M.bag.honTe===shardBuyCost(4,2)-1&&await info()===4,`thiếu Hồn Tệ: từ chối, không mất gì (${t})`);
  // Thiếu chỗ: lấp túi bằng hồn hoàn (mỗi chiếc một ô), mảnh võ hồn chưa có ô nào thì không vào được.
  await coin(1e6);
  { const free=M.bag.slots-loose().length; await test(M,"give",{code:RING_ITEM,qty:free,years:10}); await waitFor(()=>loose().length>=M.bag.slots,2000);
    t=await buy(SR2,1); ok(/không đủ chỗ/.test(t)&&!has(SR2)&&M.bag.honTe===1e6&&await info()===4,`túi đầy ${loose().length}/${M.bag.slots} ô: từ chối, không trừ tiền (${t})`);
    const one=loose().find(i=>i.code===RING_ITEM&&i.years===10); M.room.send("discard",{id:one?.id}); // chừa đúng một ô cho mảnh võ hồn mới
    await waitFor(()=>!loose().some(i=>i.id===one?.id),2000); }
  // Bấm dồn: 8 lần đổi 1 mảnh liền khi còn 6 lượt: đúng 6 lần được, giá đúng thứ tự, không vượt trần.
  const before=has(SR2);
  for(let k=0;k<8;k++) M.room.send("shardbuy",{vohon:SR2,qty:1,npc:K.npc});
  ok(await waitFor(()=>has(SR2)===before+6&&M.bag.honTe===1e6-shardBuyCost(4,6),4000)&&await info()===K.daily,
    `bấm dồn 8 lần: nhận đúng 6 mảnh, −${formatHonTe(shardBuyCost(4,6))}, hôm nay ${M.shardInfo?.n}/${K.daily}`);
  await sleep(300); ok(has(SR2)===before+6&&M.bag.honTe===1e6-shardBuyCost(4,6),"không có lần đổi thừa nào tới muộn");
  t=await buy(SR,1); ok(/đã đổi đủ 10\/10/.test(t)&&has(SR)===1,`hết lượt: từ chối (${t})`);
  { const c=await test(M,"claims"); ok(c?.s===K.daily&&c?.sdb===K.daily,`DB: hôm nay ${c?.sdb}/${K.daily} mảnh (bộ nhớ ${c?.s})`); }
  // Vào lại: vẫn đúng số đã đổi, mảnh và Hồn Tệ đã lưu.
  { const bk=bagKey(M); await relog(); await test(M,"goto",{x:sp.x,y:sp.y+16});
    ok(M.room.state.mapId===TD&&await info()===K.daily&&bagKey(M)===bk&&has(SR2)===before+6&&has(SSR)===3&&M.bag.honTe===1e6-shardBuyCost(4,6),
      `vào lại: hôm nay vẫn ${M.shardInfo?.n}/${K.daily}, mảnh và Hồn Tệ đã lưu`); }
  t=await buy(SR,1); ok(/đã đổi đủ/.test(t),"vào lại vẫn hết lượt");
  // Sang ngày mới (hook day): đặt lại, mảnh đầu lại giá gốc.
  const h0=M.bag.honTe; await test(M,"day",{shift:1});
  ok(await info()===0,"qua 00:00 giờ Việt Nam: đặt lại 0/10");
  t=await buy(SR,1); await waitFor(()=>M.shardInfo?.n===1,1500);
  ok(has(SR)===2&&M.bag.honTe===h0-P[0],`ngày mới: đổi lại được, giá ${formatHonTe(P[0])} (${t})`);
  { const c=await test(M,"claims"); ok(c?.sdb===1,`DB ngày mới: ${c?.sdb}/${K.daily}`); }
  // Review #298: lần đổi còn chờ DB (claimBusy) thì không tiêu được mảnh vào mở võ hồn / lên sao (DB từ chối thì mảnh bị lấy lại).
  { for(const it of loose().filter(i=>i.code===RING_ITEM&&i.years===10).slice(0,2)) M.room.send("discard",{id:it.id});
    await waitFor(()=>M.bag.slots-loose().length>=2,2000);
    const UM="u_minh_linh_mieu", stars=()=>M.owned.list.find(v=>v.vohon===UM)?.stars, s0=stars();
    await test(M,"give",{code:shardCode(UM),qty:starCost(s0)}); await test(M,"give",{code:shardCode(SR2),qty:SHARD_UNLOCK-has(SR2)});
    ok((await test(M,"claimhold",{on:true}))?.busy===true&&has(SR2)===SHARD_UNLOCK&&has(UM)>=starCost(s0),`đủ mảnh mở ${VOHON[vohonIndex(SR2)].name} và lên sao ${VOHON[vohonIndex(UM)].name}; giữ chỗ (hook claimhold)`);
    let l=M.logs.length; M.room.send("starup",{vohon:UM}); M.room.send("unlock",{vohon:SR2}); await waitFor(()=>M.logs.length>=l+2,1500);
    const said=M.logs.slice(l);
    ok(said.length>=2&&said.every(x=>/mảnh vừa đổi/.test(x))&&stars()===s0&&!M.owned.list.some(v=>v.vohon===SR2)&&has(SR2)===SHARD_UNLOCK,`đang chờ DB: lên sao / mở võ hồn bị từ chối (${said.join(" | ")})`);
    // Nhả giữ chỗ (lần đổi đã được DB xác nhận): lên sao được. Lần đổi thật ở RAM xong ngay trong microtask nên không đo khoảng chờ bằng
    // tin starup gửi liền sau shardbuy được; khoảng chờ thử bằng hook claimhold ở trên.
    await test(M,"claimhold",{on:false});
    M.room.send("starup",{vohon:UM}); ok(await waitFor(()=>stars()===s0+1,2000),`hết chờ DB: lên ${s0+1}★ được`); }
  await test(M,"day",{shift:0});
  } finally { await test(M,"day",{shift:0}).catch(()=>{}); await M.room.leave().catch(()=>{}); }
}
