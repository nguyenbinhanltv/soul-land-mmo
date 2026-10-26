// Nhóm bot bag (#703 bước 4): túi đồ, cửa hàng, trang bị hồn sư (E1–E4, #215). Tách nguyên văn từ bot-test.mjs.
import { bagDiff, applyBagDelta } from "../../../shared/bagSync.ts";
import { readFileSync } from "node:fs";
import { post, sleep, waitFor, ok, mapUrl, bot, enter, qtyOf, bagKey, sj, useItem, AT, objOf, npcSpot, trade, looseOf, sendTeam, same, test, needHookSkip } from "./lib.mjs";
import * as SD from "../../../shared/data.ts";
import { BAG_SLOTS, BAG_PAGE, DAN_CD, itemDef, formatHonTe, TEAM_COMBAT_SECS, MAPS, RING_ITEM, shardCode, BONE_ITEM, BONE_PASSIVE_CAP, CORE_ITEM, ITEMS, ITEM_KINDS, SHOP, sellPrice, ringSellPrice, SHARD_SELL, BAG_EXPAND, BAG_MAX_SLOTS, BAG_EXPAND_COST, bagExpandCost, bagSlotsOf, BUYBACK_MAX, parseSell, EQUIP_ITEM, EQUIP_SLOTS, EQUIP_LUCK_MAX, EQUIP_ROLL, EQUIP_ILVL_K, parseEquip, equipStats, equipDefTotal, equipTemplate, equipSlotIndex, EQUIP_ENHANCE, EQUIP_STONES, EQUIP_CHARM, equipEnhanceStep, equipEnhanceResult, EQUIP_SYNTH, EQUIP_SYNTH_KEEP, EQUIP_ESSENCE, EQUIP_SALVAGE, EQUIP_SOUL, equipSynthStep, equipSynthOutcome, equipSalvage, equipAutoSalvageable } from "../../../shared/data.ts";

/** #215: hàm thuần đồng bộ túi theo thay đổi (shared/bagSync.ts): ô đổi / mới / mất, thứ tự, không đổi gì thì delta rỗng. */
export function bagSyncPure(){
  console.log("[#215] Đồng bộ túi theo thay đổi: bagDiff / applyBagDelta");
  const it=(id,q)=>({id,qty:q}), a=[it("a",1),it("b",1),it("c",1)], s0=bagDiff(new Map(),a).next;
  const b=[it("a",2),it("c",1),it("d",1)], d1=bagDiff(s0,b);
  ok(same(d1.delta.up?.map(i=>i.id),["a","d"])&&same(d1.delta.rm,["b"])&&!d1.delta.ord&&same(applyBagDelta(a,d1.delta),b),
    `đổi số lượng, bỏ một ô, thêm một ô: ${JSON.stringify(d1.delta)}`);
  const c=[it("d",1),it("a",2),it("c",1)], d2=bagDiff(d1.next,c);
  ok(!d2.delta.up&&!d2.delta.rm&&same(d2.delta.ord,["d","a","c"])&&same(applyBagDelta(b,d2.delta),c),`chỉ đổi thứ tự (sắp xếp): gửi kèm thứ tự ${JSON.stringify(d2.delta)}`);
  ok(same(bagDiff(d2.next,c).delta,{})&&same(applyBagDelta(c,{}),c),"không đổi gì: delta rỗng");
}

export async function bagPageTest(E,relog){
  console.log("[#215] Túi 250–500 ô: trang, sắp xếp, đồng bộ theo thay đổi");
  const loose=()=>looseOf(E), full=async()=>{ E.bag=null; E.room.send("bag"); await waitFor(()=>E.bag,2000); };
  ok(E.bag.slots/BAG_PAGE===BAG_MAX_SLOTS/BAG_PAGE&&BAG_SLOTS/BAG_PAGE===5,`túi ${E.bag.slots} ô = ${E.bag.slots/BAG_PAGE} trang × ${BAG_PAGE} ô (khởi đầu ${BAG_SLOTS/BAG_PAGE} trang)`);
  ok(E.bagStat.bagd.n>E.bagStat.bag.n,`túi đổi gửi tin "bagd": ${E.bagStat.bagd.n} tin "bagd", ${E.bagStat.bag.n} tin "bag" (cả túi, khi vào phòng / xin lại)`);
  let k=bagKey(E); await full(); ok(bagKey(E)===k,"túi dựng từ các tin \"bagd\" khớp cả túi xin lại");
  // Mảnh chia hai ô chưa đầy (bán gần hết ô đầu), hồn hoàn lẫn số năm.
  const sc=shardCode("hao_thien_chuy"), st=itemDef(sc).stack;
  await test(E,"give",{code:sc,qty:st+3});
  await trade(E,"sell",{id:loose().find(i=>i.code===sc&&i.qty===st).id,qty:st-1});
  for(const y of [300,10,5000,120]) await test(E,"give",{code:RING_ITEM,qty:1,years:y});
  ok(same(loose().filter(i=>i.code===sc).map(i=>i.qty),[1,3]),`mảnh Hạo Thiên Chùy ở hai ô chưa đầy: ${loose().filter(i=>i.code===sc).map(i=>i.qty).join(" + ")}`);
  const n0=loose().length, l0=E.logs.length; E.bagLast=null; E.room.send("sortbag");
  await waitFor(()=>E.logs.length>l0&&E.bagLast,2000);
  const kinds=Object.keys(ITEM_KINDS), rank=i=>{ const d=itemDef(i.code); return d?kinds.indexOf(d.kind)*1e4+ITEMS.indexOf(d):1e9; };
  const L=loose(), rings=L.filter(i=>i.code===RING_ITEM).map(i=>i.years);
  ok(/Đã sắp xếp túi đồ, gộp bớt 1 ô/.test(E.logs.at(-1))&&same(L.filter(i=>i.code===sc).map(i=>i.qty),[4])&&L.length===n0-1,`sắp xếp: gộp mảnh về một ô ${L.filter(i=>i.code===sc).map(i=>i.qty)}, ${n0} → ${L.length} ô (${E.logs.at(-1)})`);
  ok(L.every((i,j)=>j===0||rank(L[j-1])<=rank(i))&&rings.every((y,j)=>j===0||rings[j-1]>=y)&&E.bagLast?.k==="bagd"&&E.bagLast.m.ord?.length===E.bag.items.length,
    `xếp theo nhóm / loại, hồn hoàn số năm giảm dần (${rings.join(", ")}), tin "bagd" kèm thứ tự ${E.bagLast?.m.ord?.length} ô`);
  k=bagKey(E); await full(); ok(bagKey(E)===k,"sau sắp xếp: túi dựng từ tin \"bagd\" khớp cả túi xin lại");
  E.bagLast=null; E.room.send("sortbag"); await waitFor(()=>E.bagLast,2000);
  ok(E.bagLast?.k==="bagd"&&!E.bagLast.m.ord&&!E.bagLast.m.up&&!E.bagLast.m.rm,`sắp xếp lần nữa khi đã gọn: không gửi lại ô nào (${E.bagLast?.n} byte)`);
  const ids=loose().map(i=>i.id); await relog();
  ok(same(loose().map(i=>i.id),ids),`rời game rồi vào lại: thứ tự ${ids.length} ô sau sắp xếp còn nguyên`);
  for(const it of loose().filter(i=>i.code===RING_ITEM||i.code===sc)) E.room.send("discard",{id:it.id});
  await waitFor(()=>!loose().some(i=>i.code===RING_ITEM||i.code===sc),3000);
  await test(E,"coin",{n:1e6}); // phần sau (đan lớn) tính Hồn Tệ từ mốc này
}

export async function shopBuybackTest(){
  console.log("[9.8] Thương nhân: đan lớn, mở rộng túi, mua lại đồ bán nhầm");
  const big=["dai_hoi_huyet_dan","dai_hoi_hon_dan"].map(c=>itemDef(c)), small=itemDef("hoi_huyet_dan");
  ok(big.every(d=>d?.kind==="dan"&&d.cd==="dan"&&d.stack===small.stack)&&big[0].hp===0.6&&big[1].mp===0.6,"Đại Hồi Huyết Đan / Đại Hồi Hồn Đan: đan hồi 60%, chung hồi chiêu đan");
  ok(big.every(d=>SHOP.find(r=>r.code===d.id)?.price===120)&&big.every(d=>sellPrice({code:d.id,years:null,stars:null,enhance:0})===null),
    `thương nhân bán đan lớn ${formatHonTe(120)}, không mua lại đan`);
  // #215: 250 ô (5 trang × 50), +50 ô (một trang) mỗi lần tới 500 ô, 5 mức giá tăng dần.
  ok(BAG_SLOTS===250&&BAG_PAGE===50&&BAG_EXPAND===BAG_PAGE&&BAG_MAX_SLOTS===500&&BAG_SLOTS%BAG_PAGE===0&&BAG_EXPAND_COST.length===(BAG_MAX_SLOTS-BAG_SLOTS)/BAG_EXPAND
    &&BAG_EXPAND_COST.every((c,k)=>k===0||c>BAG_EXPAND_COST[k-1])&&same([250,300,350,400,450,500].map(bagExpandCost),[...BAG_EXPAND_COST,null]),
    `mở rộng túi: ${[250,300,350,400,450].map(n=>`${n}→${n+BAG_EXPAND} ô ${formatHonTe(bagExpandCost(n))}`).join(", ")}, tối đa ${BAG_MAX_SLOTS} ô (${BAG_MAX_SLOTS/BAG_PAGE} trang)`);
  ok(bagSlotsOf(null)===BAG_SLOTS&&bagSlotsOf(undefined)===BAG_SLOTS&&bagSlotsOf("x")===BAG_SLOTS&&bagSlotsOf(300)===300&&bagSlotsOf(999)===BAG_MAX_SLOTS&&bagSlotsOf(55)===BAG_SLOTS,
    "bagSlotsOf: dữ liệu trống / hỏng là mức khởi đầu, kẹp trong khoảng");
  const E=await bot("Lái buôn","u_minh_linh_mieu",{sex:0,hair:2,hairCol:0,outfitCol:1});
  if(!(await test(E,"ping"))?.enabled){ needHookSkip("bỏ qua mua / bán / mở rộng (cần hook warp, goto, coin, give…): bật server bằng GAME_TEST=1"); await E.room.leave(); return; }
  const eme=()=>E.room.state.players?.get(E.room.sessionId), loose=()=>looseOf(E);
  /** Hook warp: sang `mapId` tại (x, y) qua transaction đi cổng rồi vào phòng mới như đi cổng thật. */
  async function warp(mapId,x,y){
    E.travel=null; E.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>E.travel?.mapId===mapId,4000),`warp -> ${MAPS[mapId].name}`);
    await E.room.leave(); await sleep(300); E.mapId=(await post("/api/me",{token:E.token})).mapId; await enter(E);
    await waitFor(()=>eme()&&E.bag,3000);
  }
  /** Rời game rồi vào lại (không qua đi cổng). */
  async function relog(){ await E.room.leave(); await sleep(400); E.mapId=(await post("/api/me",{token:E.token})).mapId; await enter(E); await waitFor(()=>eme()&&E.bag,3000); }
  const tn=npcSpot("nac_dinh_thanh","thuong_nhan");
  await warp("nac_dinh_thanh",tn.x+60,tn.y+16);
  ok(E.bag?.slots===BAG_SLOTS&&E.bag.buyback?.length===0,`tài khoản mới: túi ${E.bag?.slots} ô, chưa có đồ mua lại`);
  await test(E,"coin",{n:1e6});
  let t=await trade(E,"expand",{}); ok(/đứng cạnh thương nhân/.test(t)&&E.bag.slots===BAG_SLOTS&&E.bag.honTe===1e6,`đứng xa thương nhân: mở rộng túi bị từ chối (${t})`);
  await test(E,"goto",{x:tn.x,y:tn.y+16});
  // ---- Mở rộng túi ----
  const c0=bagExpandCost(BAG_SLOTS);
  await test(E,"coin",{n:c0-1});
  t=await trade(E,"expand",{}); ok(/Không đủ Hồn Tệ/.test(t)&&E.bag.slots===BAG_SLOTS&&E.bag.honTe===c0-1,`thiếu 1 đồng: không mở rộng được, không mất tiền (${t})`);
  await test(E,"coin",{n:c0});
  const s1=BAG_SLOTS+BAG_EXPAND;
  t=await trade(E,"expand",{}); ok(E.bag.slots===s1&&E.bag.honTe===0&&t.includes(`${BAG_SLOTS} → ${s1} ô`),`mở rộng túi: ${BAG_SLOTS} → ${E.bag.slots} ô, −${formatHonTe(c0)} (${t})`);
  // Túi s1 ô nhận đúng s1 ô (hồn hoàn mỗi chiếc một ô), chiếc kế tiếp không nhận.
  await test(E,"give",{code:RING_ITEM,qty:E.bag.slots-loose().length+1,years:10});
  ok(loose().length===s1&&E.logs.at(-1)?.includes(`Túi đồ đã đầy (${s1} ô)`),`túi đầy ở ${loose().length}/${E.bag.slots} ô: chiếc thứ ${s1+1} không nhận (${E.logs.at(-1)})`);
  for(const it of loose().filter(i=>i.code===RING_ITEM)) E.room.send("discard",{id:it.id});
  ok(await waitFor(()=>!loose().some(i=>i.code===RING_ITEM),3000),"bỏ hết hồn hoàn thử");
  await relog();
  ok(E.bag.slots===BAG_SLOTS+BAG_EXPAND&&E.bag.honTe===0,`thoát vào lại: túi vẫn ${E.bag.slots} ô (đã lưu)`);
  // Giá lần sau tăng dần; tới BAG_MAX_SLOTS thì hết.
  await test(E,"coin",{n:BAG_EXPAND_COST.slice(1).reduce((a,v)=>a+v,0)});
  for(let k=1;k<BAG_EXPAND_COST.length;k++){
    const s0=E.bag.slots, h0=E.bag.honTe; t=await trade(E,"expand",{});
    ok(E.bag.slots===s0+BAG_EXPAND&&E.bag.honTe===h0-BAG_EXPAND_COST[k],`mở rộng lần ${k+1}: ${s0} → ${E.bag.slots} ô, −${formatHonTe(BAG_EXPAND_COST[k])}`);
  }
  await test(E,"coin",{n:1e6});
  t=await trade(E,"expand",{}); ok(E.bag.slots===BAG_MAX_SLOTS&&E.bag.honTe===1e6&&/tối đa/.test(t),`đã ${BAG_MAX_SLOTS} ô: không mở rộng thêm, không mất tiền (${t})`);
  await bagPageTest(E,relog);
  // ---- Đan lớn ----
  const [dh,dn]=big.map(d=>SHOP.find(r=>r.code===d.id));
  t=await trade(E,"buy",{code:dh.code,qty:2}); ok(qtyOf(E,dh.code)===2&&E.bag.honTe===1e6-2*dh.price,`mua 2 Đại Hồi Huyết Đan: −${formatHonTe(2*dh.price)} (${t})`);
  t=await trade(E,"buy",{code:dn.code,qty:1}); ok(qtyOf(E,dn.code)===1&&E.bag.honTe===1e6-2*dh.price-dn.price,`mua 1 Đại Hồi Hồn Đan (${t})`);
  // Tin trả lời hook / dòng log đến trước bản vá state và tin "bag": chờ sinh lực đã giảm, chờ túi đã bớt đan rồi mới đo.
  await test(E,"rest",{s:DAN_CD}); await test(E,"hurt",{pct:90}); await waitFor(()=>eme().hp<=eme().maxHp*0.2);
  const p=eme(), hp0=p.hp;
  await useItem(E,E.bag.items.find(i=>i.code===dh.code).id);
  const hg=Number(/Dùng Đại Hồi Huyết Đan: \+(\d+) sinh lực/.exec(E.logs.at(-1))?.[1]);
  ok(await waitFor(()=>qtyOf(E,dh.code)===1)&&Math.abs(hg-p.maxHp*0.6)<=1&&await waitFor(()=>eme().hp>=hp0+hg-1),`Đại Hồi Huyết Đan hồi đúng 60%: +${hg}/${p.maxHp} sinh lực, ${hp0} -> ${eme().hp} (${E.logs.at(-1)})`);
  { const q=qtyOf(E,"hoi_hon_dan"); await useItem(E,E.bag.items.find(i=>i.code==="hoi_hon_dan").id);
    ok(qtyOf(E,"hoi_hon_dan")===q&&/Đan dược đang hồi/.test(E.logs.at(-1))&&E.bag.cd>DAN_CD-2,`chung hồi chiêu đan: ngay sau đan lớn không dùng được Hồi Hồn Đan (${E.logs.at(-1)})`); }
  await test(E,"rest",{s:DAN_CD}); await test(E,"drain",{pct:90});
  await useItem(E,E.bag.items.find(i=>i.code===dn.code).id);
  const mg=Number(/Dùng Đại Hồi Hồn Đan: \+(\d+) hồn lực/.exec(E.logs.at(-1))?.[1]);
  ok(await waitFor(()=>qtyOf(E,dn.code)===0)&&Math.abs(mg-eme().maxMp*0.6)<=1,`Đại Hồi Hồn Đan hồi đúng 60%: +${mg}/${eme().maxMp} hồn lực (${E.logs.at(-1)})`);
  { const bk=bagKey(E); t=await trade(E,"sell",{id:E.bag.items.find(i=>i.code===dh.code).id}); ok(bagKey(E)===bk&&/không mua/.test(t),`thương nhân không mua Đại Hồi Huyết Đan (${t})`); }
  // ---- Mua lại ----
  await test(E,"give",{code:BONE_ITEM,years:12000,beast:"thiet_giap_te_nguu",slot:"than",enhance:5});
  const bn=loose().find(i=>i.code===BONE_ITEM&&i.enhance===5), bp=sellPrice(bn);
  let ht=E.bag.honTe; t=await trade(E,"sell",{id:bn.id});
  const bb=E.bag.buyback?.[0];
  ok(!E.bag.items.some(i=>i.id===bn.id)&&E.bag.honTe===ht+bp&&bb?.code===BONE_ITEM&&bb.years===12000&&bb.enhance===5&&sj(bb.stats)===sj(bn.stats)&&bb.price===bp,
    `bán hồn cốt Thân 12.000 năm +5: +${formatHonTe(bp)}, thương nhân giữ để mua lại (${t})`);
  await test(E,"coin",{n:bp-1});
  t=await trade(E,"buyback",{key:bb.key}); ok(/Không đủ Hồn Tệ/.test(t)&&E.bag.honTe===bp-1&&E.bag.buyback.length===1,`thiếu 1 đồng: không mua lại được (${t})`);
  await test(E,"coin",{n:bp+500});
  // Túi đầy (BAG_MAX_SLOTS ô): mua lại hồn cốt bị từ chối, không mất tiền.
  await test(E,"give",{code:RING_ITEM,qty:E.bag.slots-loose().length,years:10});
  t=await trade(E,"buyback",{key:bb.key}); ok(loose().length===E.bag.slots&&/không đủ chỗ/.test(t)&&E.bag.honTe===bp+500&&E.bag.buyback.length===1,`túi đầy ${loose().length}/${E.bag.slots} ô: mua lại bị từ chối (${t})`);
  E.room.send("discard",{id:loose().find(i=>i.code===RING_ITEM).id}); await waitFor(()=>loose().length===E.bag.slots-1,2000);
  for(const [m,why] of [[{key:"khong-co"},"mã lạ"],[{key:7},"mã dạng số"],[{},"thiếu mã"]]){
    const bk=bagKey(E); t=await trade(E,"buyback",m); ok(bagKey(E)===bk&&/không còn giữ/.test(t),`mua lại ${why}: bị từ chối (${t})`);
  }
  t=await trade(E,"buyback",{key:bb.key});
  const back=loose().find(i=>i.code===BONE_ITEM&&i.years===12000);
  ok(back&&back.id!==bn.id&&back.enhance===5&&sj(back.stats)===sj(bn.stats)&&E.bag.honTe===500&&E.bag.buyback.length===0,
    `mua lại đúng món: hồn cốt ${back?.years} năm +${back?.enhance}, cùng chỉ số, −${formatHonTe(bp)} (${t})`);
  t=await trade(E,"buyback",{key:bb.key}); ok(/không còn giữ/.test(t)&&E.bag.honTe===500,`mua lại lần hai cùng món: bị từ chối (${t})`);
  // Mảnh bán một phần: mua lại đúng số đã bán, gộp về ô cũ.
  for(const it of loose().filter(i=>i.code===RING_ITEM).slice(0,10)) E.room.send("discard",{id:it.id});
  await waitFor(()=>loose().length<=E.bag.slots-10,2000);
  const sc=shardCode("hao_thien_chuy"); await test(E,"give",{code:sc,qty:5});
  ht=E.bag.honTe; t=await trade(E,"sell",{id:loose().find(i=>i.code===sc).id,qty:2});
  ok(qtyOf(E,sc)===3&&E.bag.buyback[0]?.qty===2&&E.bag.honTe===ht+2*SHARD_SELL.UR,`bán 2 / 5 mảnh Hạo Thiên Chùy (${t})`);
  t=await trade(E,"buyback",{key:E.bag.buyback[0].key});
  ok(qtyOf(E,sc)===5&&loose().filter(i=>i.code===sc).length===1&&E.bag.honTe===ht,`mua lại 2 mảnh: gộp về 5 mảnh một ô, Hồn Tệ về như cũ (${t})`);
  // Chỉ giữ BUYBACK_MAX lần bán gần nhất (mới nhất trước).
  const ys=[110,120,130,140,150,160];
  for(const y of ys) await test(E,"give",{code:RING_ITEM,years:y});
  for(const y of ys) await trade(E,"sell",{id:loose().find(i=>i.code===RING_ITEM&&i.years===y).id});
  ok(same(E.bag.buyback.map(b=>b.years),ys.slice(-BUYBACK_MAX).reverse()),`bán ${ys.length} hồn hoàn: thương nhân chỉ giữ ${BUYBACK_MAX} chiếc gần nhất (${E.bag.buyback.map(b=>b.years).join(", ")} năm)`);
  // Đứng xa thì không mua lại được; đi cổng sang Thiên Đấu Thành danh sách vẫn còn, mua lại ở thương nhân Thiên Đấu.
  { const sq=objOf("nac_dinh_thanh","spawn"); await test(E,"goto",{x:sq.x+sq.width/2,y:sq.y+sq.height/2}); }
  { const bk=bagKey(E); t=await trade(E,"buyback",{key:E.bag.buyback[0].key}); ok(bagKey(E)===bk&&/đứng cạnh thương nhân/.test(t),`đứng xa thương nhân: mua lại bị từ chối (${t})`); }
  const tt=npcSpot(AT,"thuong_nhan_thien_dau"); await warp(AT,tt.x,tt.y+16);
  ok(same(E.bag.buyback.map(b=>b.years),ys.slice(-BUYBACK_MAX).reverse())&&E.bag.slots===BAG_MAX_SLOTS,"đi cổng sang Thiên Đấu Thành: danh sách mua lại và số ô túi còn nguyên");
  ht=E.bag.honTe; t=await trade(E,"buyback",{key:E.bag.buyback[0].key});
  ok(loose().some(i=>i.code===RING_ITEM&&i.years===160)&&E.bag.honTe===ht-ringSellPrice(160)&&E.bag.buyback.length===BUYBACK_MAX-1,`thương nhân Thiên Đấu mua lại hồn hoàn 160 năm (${t})`);
  t=await trade(E,"buy",{code:dh.code,qty:1}); ok(/Mua 1 Đại Hồi Huyết Đan/.test(t),`thương nhân Thiên Đấu bán đan lớn cùng giá (${t})`);
  // Rời game: thương nhân quên đồ đã bán; túi, số ô, Hồn Tệ vẫn lưu.
  const bk=bagKey(E); await relog();
  ok(E.bag.buyback?.length===0&&bagKey(E)===bk&&E.bag.slots===BAG_MAX_SLOTS,`rời game rồi vào lại: danh sách mua lại trống, túi ${E.bag.slots} ô và Hồn Tệ còn nguyên`);
  await E.room.leave();
}

/**
 * Trang bị hồn sư E1 (mục 5.15, BOT_ONLY=bag): hàm thuần parseEquip; mặc / tháo / đổi chỗ qua lệnh equipgear / unequipgear; món đang mặc không
 * chiếm ô túi và không nằm trong tin bag; chỉ số khớp server (stats, giảm sát thương, công vũ khí); may mắn 9 thì mọi đòn ra max; từ chối
 * đúng; 20 lệnh dồn cùng lúc chỉ một lệnh có hiệu lực; lưu qua lần vào lại (kiểm cả với --pg: chỉ mục duy nhất, đổi chỗ trong một lần ghi).
 */
/**
 * NV5 (#459, BOT_ONLY=charbag, thuộc nhóm bag của BOT_PART): lệnh gắn / tháo do giao diện Nhân vật + Túi dựng (client/src/charBagContract.ts:
 * quickCommand = bấm đúp, unmountCommand = tháo, kèm "switch" của nút Ra trận) đúng là các tin server có sẵn và server nhận: hồn cốt (equip / unequip),
 * hồn hạch (equipcore / unequipcore), trang bị hồn sư (equipgear / unequipgear), đội (team / switch). Hợp đồng gửi đi là gì thì bot gửi đúng thế.
 */
export async function charBagCmdTest(){
  console.log("[NV5] Lệnh gắn / tháo từ giao diện Nhân vật + Túi (hợp đồng client) được server nhận");
  const C=await import("../../src/charBagContract.ts");
  const S=await bot("Nhân vật Túi","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(S,"ping"))?.enabled){ needHookSkip("bỏ qua nhân vật + túi (cần hook gear, give, rest): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  try{
  await waitFor(()=>S.bag&&S.owned,3000);
  await test(S,"clear"); await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); await test(S,"gear",{clear:true});
  const row=()=>S.owned.active, view=()=>({rowId:row(),bag:S.bag.items,gear:S.gear?.items??[]});
  const itemOf=id=>S.bag.items.find(i=>i.id===id);
  /** Gửi một lệnh của hợp đồng, chờ túi / trang bị đổi hoặc dòng log; trả dòng log mới nhất ("" nếu chỉ có tin đổi). */
  async function send(cmd){ const b=S.bagMsgs??0, g=S.gearN??0, l=S.logs.length; S.room.send(cmd.msg,cmd.data);
    await waitFor(()=>(S.bagMsgs??0)>b||(S.gearN??0)>g||S.logs.length>l,2000); await sleep(150); return S.logs.length>l?S.logs.at(-1):""; }
  const fresh=async(code,give)=>{ const before=new Set(S.bag.items.map(i=>i.id)); await test(S,"give",{code,...give}); await waitFor(()=>S.bag.items.some(i=>i.code===code&&!before.has(i.id)),1500); return S.bag.items.filter(i=>i.code===code&&!before.has(i.id)); };

  // ---- Hồn cốt: bấm đúp trong Túi = equip vào đúng ô của võ hồn đang xem; kéo ra Túi = unequip ----
  const [bone]=await fresh(BONE_ITEM,{slot:"tay_trai"});
  const bc=C.quickCommand(bone,view());
  ok(bc?.msg==="equip"&&bc.data.itemId===bone.id&&bc.data.vohonId===row()&&bc.data.slot==="tay_trai","bấm đúp hồn cốt Tay trái: hợp đồng ra equip {itemId, vohonId = võ hồn đang xem, slot}");
  let t=await send(bc);
  ok(itemOf(bone.id)?.vohon===row(),`server nhận equip: hồn cốt gắn vào võ hồn ${row()} (${t||"không có dòng từ chối"})`);
  ok(C.quickCommand(itemOf(bone.id),view())===null,"hồn cốt đã gắn: bấm đúp trong Túi không còn lệnh gắn lại");
  const ubc=C.unmountCommand(itemOf(bone.id),{tab:"bone",slot:"tay_trai",rowId:row()});
  ok(ubc?.msg==="unequip"&&ubc.data.itemId===bone.id,"kéo ô Tay trái ra Túi: hợp đồng ra unequip {itemId}");
  await send(ubc);
  ok(itemOf(bone.id)?.vohon===null,"server nhận unequip: hồn cốt về túi");

  // ---- Hồn hạch: ô trống thấp nhất, rồi tháo ----
  const cores=await fresh(CORE_ITEM,{stars:2,qty:1}); const [c2]=await fresh(CORE_ITEM,{stars:2,qty:1}); const c1=cores[0];
  const cc1=C.quickCommand(c1,view());
  ok(cc1?.msg==="equipcore"&&cc1.data.vohonId===row()&&cc1.data.slot===0,"bấm đúp hồn hạch thứ nhất: equipcore vào ô 0");
  await send(cc1);
  const cc2=C.quickCommand(c2,view());
  ok(itemOf(c1.id)?.vohon===row()&&itemOf(c1.id).stats.slot===0&&cc2?.msg==="equipcore"&&cc2.data.slot===1,"server gắn hồn hạch vào ô 0; hồn hạch thứ hai đi ô 1 (ô trống thấp nhất)");
  await send(cc2);
  ok(itemOf(c2.id)?.vohon===row()&&itemOf(c2.id).stats.slot===1,"server nhận equipcore ô 1");
  const ucc=C.unmountCommand(itemOf(c2.id),{tab:"core",slot:1,rowId:row()});
  ok(ucc?.msg==="unequipcore","kéo ô hồn hạch ra Túi: unequipcore");
  await send(ucc);
  ok(itemOf(c2.id)?.vohon===null,"server nhận unequipcore: hồn hạch về túi");
  await send(C.unmountCommand(itemOf(c1.id),{tab:"core",slot:0,rowId:row()}));

  // ---- Trang bị hồn sư: equipgear / unequipgear ----
  const gid=(await test(S,"gear",{tpl:"mu_tu_kim",ilvl:3,enhance:0}))?.id; await waitFor(()=>itemOf(gid),1500);
  const gc=C.quickCommand(itemOf(gid),view());
  ok(gc?.msg==="equipgear"&&gc.data.id===gid,"bấm đúp Mũ Tử Kim: equipgear {id}");
  await send(gc);
  const slotMu=SD.EQUIP_SLOTS.findIndex(s=>s.id==="mu"), worn=()=>S.gear?.items.find(g=>g.slot===slotMu);
  ok(worn()?.id===gid&&!itemOf(gid),"server nhận equipgear: Mũ vào ô Mũ, rời túi");
  const ugc=C.unmountCommand(C.gearAsBagItem(worn()),{tab:"equip",slot:"mu",rowId:null});
  ok(ugc?.msg==="unequipgear"&&ugc.data.slot===slotMu,"kéo ô Mũ ra Túi: unequipgear {slot theo chỉ số ô}");
  await send(ugc);
  ok(!worn()&&!!itemOf(gid),"server nhận unequipgear: Mũ về túi");

  // ---- Đội: team + nút "Ra trận" (switch theo ô đội) ----
  await test(S,"grant",{vohon:"hoa_long"}); await waitFor(()=>S.owned.list.length>=2,1500);
  const a=row(), other=S.owned.list.find(v=>v.rowId!==a).rowId;
  await sendTeam(S,[a,other,0,0]);
  ok(same(S.owned.team.slice(0,2),[a,other]),"tin team: đội [đang ra trận, võ hồn thứ hai]");
  await test(S,"clear"); await test(S,"rest",{s:TEAM_COMBAT_SECS+1});
  const n=S.ownedMsgs; S.room.send("switch",{slot:S.owned.team.indexOf(other)}); await waitFor(()=>S.ownedMsgs>n&&row()===other,2000);
  ok(row()===other,"nút Ra trận: switch {slot} đổi võ hồn ra trận");
  }finally{ await S.room.leave(); }
}

export async function gearTest(){
  console.log("[E1] Trang bị hồn sư: mặc / tháo, chỉ số, may mắn, lưu");
  // Hàm thuần: parseEquip nhận object và chuỗi JSON (MemoryStore / pg), kẹp số, bỏ mẫu lạ.
  const raw={tpl:"vu_khi_chi_bao",ilvl:7,roll:0.05,affixes:[["crit",1],["xx",2]],luck:3};
  ok(same(parseEquip(raw)?.affixes,[["crit",1]])&&parseEquip(JSON.stringify(raw))?.luck===3&&parseEquip({...raw,luck:99,ilvl:99,roll:5})?.luck===EQUIP_LUCK_MAX
    &&parseEquip({...raw,ilvl:99,roll:5}).ilvl===EQUIP_ILVL_K.length&&parseEquip({...raw,roll:5}).roll===EQUIP_ROLL
    &&parseEquip({tpl:"khong_co"})===null&&parseEquip("{hỏng")===null&&parseEquip(null)===null&&parseEquip(7)===null,
    "parseEquip: nhận object / chuỗi JSON, kẹp ilvl, roll, may mắn, bỏ dòng phụ lạ, mẫu lạ hoặc dữ liệu hỏng thì null");
  ok(equipDefTotal(BONE_PASSIVE_CAP.def-0.01,0.5)===BONE_PASSIVE_CAP.def&&equipDefTotal(0,0.02)===0.02,"equipDefTotal: gộp với bị động hồn cốt dưới cùng một trần");
  // HL4 (#573): lpcGearLooks đè đúng ô áo / mũ cho mọi bộ dựng sẵn x mọi bậc; không mặc / mã lạ giữ nguyên; Ẩn mũ bỏ mũ trang bị.
  { let bad=0; const n=SD.EQUIP_TIERS.length;
    for(const pr of SD.LPC_PRESETS){
      for(let c=1;c<=n;c++){ const o=SD.lpcGearLooks(pr.lpc,c,c), g=SD.LPC_GEAR; if(o.parts.torso!==g.ao[c-1].m[0]||o.parts.hat!==g.mu[c-1].m[0]||!SD.decodeLpc(SD.encodeLpc(o))) bad++; }
      const keep=SD.lpcGearLooks(pr.lpc,0,0), junk=SD.lpcGearLooks(pr.lpc,99,99), hid=SD.lpcGearLooks(pr.lpc,n,n,true);
      if(SD.encodeLpc(keep)!==SD.encodeLpc(pr.lpc)||SD.encodeLpc(junk)!==SD.encodeLpc(pr.lpc)||hid.parts.hat!==pr.lpc.parts.hat||hid.parts.torso!==SD.LPC_GEAR.ao[n-1].m[0]) bad++;
    }
    ok(bad===0&&SD.lpcGearCode(0)===1&&SD.lpcGearCode(n)===0&&SD.lpcGearCode(null)===0&&SD.LPC_GEAR.ao.length===n&&SD.LPC_GEAR.mu.length===n,"lpcGearLooks: mọi bộ dựng sẵn x mọi bậc đè đúng áo / mũ và vẫn hợp lệ; không mặc / mã lạ giữ nguyên; Ẩn mũ bỏ mũ trang bị"); }
  const S=await bot("Trang bị","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(S,"ping"))?.enabled){ needHookSkip("bỏ qua trang bị (cần hook gear, hurt, rest): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  try{
  const me=()=>S.room.state.players?.get(S.room.sessionId), loose=()=>looseOf(S), free=()=>S.bag.slots-loose().length;
  await waitFor(()=>me()&&S.bag,3000);
  async function rejoin(){ await S.room.leave(); await sleep(400); S.mapId=(await post("/api/me",{token:S.token})).mapId; await enter(S); await waitFor(()=>me()&&S.bag&&S.gear,3000); }
  /** Gửi lệnh trang bị; chờ tin gear (đổi được) hoặc dòng log từ chối. Trả dòng log mới nhất ("" nếu chỉ có tin gear). */
  async function op(type,msg){ const g=S.gearN??0, l=S.logs.length; S.room.send(type,msg); await waitFor(()=>(S.gearN??0)>g||S.logs.length>l,2000); await sleep(100); return S.gearN>g?"":(S.logs.at(-1)??""); }
  const mk=async(tpl,more={})=>{ const r=await test(S,"gear",{tpl,...more}); await waitFor(()=>loose().some(i=>i.id===r?.id),1500); return r?.id; };
  const inBag=id=>loose().some(i=>i.id===id), worn=slot=>S.gear?.items.find(g=>g.slot===slot);
  const eq=(tpl,ilvl,roll=0,luck=0,affixes=[])=>({tpl,ilvl,enhance:0,roll:roll*EQUIP_ROLL,luck,affixes});
  const slotOf=tpl=>equipSlotIndex(equipTemplate(tpl).slot);
  await test(S,"gear",{clear:true}); await test(S,"rest",{s:TEAM_COMBAT_SECS+1});
  const s0=await test(S,"stats"), base0=s0.stats;
  ok(s0.gear.red===0&&s0.gear.luck===0&&s0.gear.weapon===null&&(S.gear?.items.length??0)===0,"chưa mặc gì: không cộng chỉ số, giảm sát thương, may mắn, công vũ khí");
  const W1=await mk("vu_khi_chi_bao",{ilvl:7,roll:1,luck:5}), W2=await mk("vu_khi_pham_khi",{ilvl:1}), A1=await mk("ao_tu_kim",{ilvl:5,affixes:[["crit",1]]}), A2=await mk("ao_pham_khi",{ilvl:1});
  const N1=await mk("day_chuyen_than_khi",{ilvl:6,luck:4}), N2=await mk("vong_trai_han_ngoc",{ilvl:3,enhance:5});
  ok([W1,W2,A1,A2,N1,N2].every(Boolean)&&loose().filter(i=>i.code===EQUIP_ITEM).length===6,"hook gear: 6 món trang bị vào túi (cùng ô được hai món)");
  const rm=loose().find(i=>i.id===A1);
  ok(rm.kind==="trang_bi"&&rm.stats.tpl==="ao_tu_kim"&&rm.stats.ilvl===5&&same(rm.stats.affixes,[["crit",1]]),"dữ liệu món (stats = EquipData) tới client nguyên vẹn");
  // ---- Từ chối ----
  const dan=loose().find(i=>i.code!==EQUIP_ITEM&&i.code!==CORE_ITEM&&i.code!==BONE_ITEM);
  let t=await op("equipgear",{id:dan.id}); ok(/Không có trang bị này/.test(t),`vật phẩm không phải trang bị bị từ chối: ${t}`);
  for(const bad of ["khong-co",7,null,{},[A1]]){ t=await op("equipgear",{id:bad}); ok(/Không có trang bị này/.test(t)&&(S.gear?.items.length??0)===0,`id ${JSON.stringify(bad)} bị từ chối`); }
  t=await op("equipgear",null); ok(/Không có trang bị này/.test(t),"tin equipgear rỗng bị từ chối, không ném lỗi");
  for(const bad of [0,"vu_khi",99,-1,1.5,"x",null,{}]){ t=await op("unequipgear",{slot:bad}); ok(/chưa mặc trang bị/.test(t),`tháo ô ${JSON.stringify(bad)} (trống / lạ) bị từ chối`); }
  // Đang giao chiến: không mặc / tháo được.
  await test(S,"hurt",{pct:1}); t=await op("equipgear",{id:A1});
  ok(/Đang giao chiến: .* gắn \/ tháo trang bị/.test(t)&&inBag(A1)&&!S.gear?.items.length,`đang giao chiến: mặc bị từ chối (${t})`);
  await test(S,"rest",{s:TEAM_COMBAT_SECS+1});
  // ---- Mặc áo: không chiếm ô túi, không nằm trong tin bag, chỉ số khớp ----
  const n0=loose().length; t=await op("equipgear",{id:A1});
  const e1=equipStats([eq("ao_tu_kim",5,0,0,[["crit",1]])]), s1=await test(S,"stats");
  ok(t===""&&worn(2)?.id===A1&&!inBag(A1)&&loose().length===n0-1&&free()===S.bag.slots-n0+1&&same(S.gear.st,e1),
    `mặc Áo Tử Kim: vào ô ${EQUIP_SLOTS[2].name}, rời túi (${n0} -> ${loose().length} ô), tin gear = equipStats`);
  ok(s1.stats.maxHp-base0.maxHp===e1.bonus.hp&&s1.live.maxHp===s1.stats.maxHp&&Math.abs(s1.live.crit-(s0.live.crit+e1.bonus.crit/100))<1e-9&&s1.gear.red===e1.red,
    `chỉ số vào calcStats: sinh lực tối đa ${base0.maxHp} -> ${s1.stats.maxHp} (+${e1.bonus.hp}), chí mạng +${e1.bonus.crit}%, giảm sát thương ${(e1.red*100).toFixed(1)}%`);
  ok(Math.abs(s1.live.def-s0.live.def-e1.red)<1e-9||s1.live.def===BONE_PASSIVE_CAP.def,`giảm sát thương nhận vào buff def: ${s0.live.def} -> ${s1.live.def}`);
  ok(me().maxHp===s1.stats.maxHp,"state công khai: sinh lực tối đa theo chỉ số mới");
  // HL4 (#573): áo / mũ đang mặc đồng bộ công khai chỉ dưới dạng bậc + 1 (lpcGearCode), không lộ chỉ số.
  await waitFor(()=>me().gearAo===equipTemplate("ao_tu_kim").tier+1,1500);
  ok(me().gearAo===equipTemplate("ao_tu_kim").tier+1&&me().gearMu===0,`state công khai: mặc Áo Tử Kim -> gearAo = ${me().gearAo} (bậc + 1), chưa mặc mũ -> gearMu = 0`);
  // ---- Đổi chỗ: món cũ về túi đúng chỗ món mới rời ----
  const idx=loose().findIndex(i=>i.id===A2); t=await op("equipgear",{id:A2});
  ok(t===""&&worn(2)?.id===A2&&inBag(A1)&&!inBag(A2)&&loose().findIndex(i=>i.id===A1)===idx&&loose().length===n0-1,
    `đổi Áo: Áo Phàm Khí vào ô, Áo Tử Kim về túi đúng chỗ (số ô túi giữ nguyên ${loose().length})`);
  ok(me().gearAo===1,"đổi sang Áo Phàm Khí: gearAo = 1");
  ok(same(S.gear.st,equipStats([eq("ao_pham_khi",1)]))&&(await test(S,"stats")).stats.maxHp===base0.maxHp+equipStats([eq("ao_pham_khi",1)]).bonus.hp,"chỉ số theo món mới, không cộng dồn món cũ");
  // ---- Vũ khí + dây chuyền + vòng: công mỗi đòn, may mắn cộng hai ô, cường hóa vào chỉ số ----
  await op("equipgear",{id:W2}); await op("equipgear",{id:W1}); await op("equipgear",{id:N2});
  ok(worn(0)?.id===W1&&inBag(W2)&&worn(6)?.id===N2&&slotOf("vong_trai_han_ngoc")===6,"mặc vũ khí (đổi chỗ), vòng tay trái");
  const eW=equipStats([eq("vu_khi_chi_bao",7,1,5)]);
  let g=await test(S,"stats"), m=g.live.atkNow/(g.live.atk+(eW.weapon.min+eW.weapon.max)/2);
  ok(same(g.gear.weapon,eW.weapon)&&g.gear.luck===5&&g.live.atkRolls.every(r=>r>=(g.live.atk+eW.weapon.min)*m-1e-6&&r<=(g.live.atk+eW.weapon.max)*m+1e-6)&&new Set(g.live.atkRolls).size>1,
    `vũ khí: công mỗi đòn ${eW.weapon.min}–${eW.weapon.max}, may mắn 5: 12 đòn nằm trong khoảng và không đều nhau`);
  const eN2=equipStats([eq("vong_trai_han_ngoc",3)]); void eN2;
  await op("equipgear",{id:N1});
  g=await test(S,"stats"); m=g.live.atkNow/(g.live.atk+(eW.weapon.min+eW.weapon.max)/2);
  ok(g.gear.luck===EQUIP_LUCK_MAX&&g.live.atkRolls.every(r=>Math.abs(r-(g.live.atk+eW.weapon.max)*m)<1e-6),
    `may mắn vũ khí 5 + dây chuyền 4 = ${g.gear.luck}: mọi đòn ra công tối đa (${g.live.atkRolls.map(r=>r.toFixed(1)).join(", ")})`);
  const eAll=equipStats([eq("vu_khi_chi_bao",7,1,5),eq("day_chuyen_than_khi",6,0,4),{...eq("vong_trai_han_ngoc",3),enhance:5},eq("ao_pham_khi",1)]);
  ok(same(g.gear.bonus,eAll.bonus)&&g.gear.red===eAll.red,`tổng bộ đang mặc khớp equipStats (giảm sát thương ${(eAll.red*100).toFixed(1)}%, cường hóa +5 của vòng tính vào chỉ số)`);
  // ---- Lưu qua lần vào lại ----
  const keep=S.gear.items.map(i=>`${i.slot}:${i.id}:${i.enhance}`).sort(), bagIds=new Set(loose().map(i=>i.id));
  await rejoin();
  ok(same(S.gear.items.map(i=>`${i.slot}:${i.id}:${i.enhance}`).sort(),keep)&&[W1,N1,N2,A2].every(id=>!inBag(id))&&[W2,A1].every(inBag)&&loose().length===bagIds.size,
    `vào lại: ${S.gear.items.length} món vẫn mặc đúng ô, món trong túi còn nguyên (${loose().length} ô)`);
  ok(me().gearAo===equipTemplate("ao_pham_khi").tier+1,`vào lại: gearAo đồng bộ lại từ trang bị đã mặc (${me().gearAo})`);
  const s2=await test(S,"stats"); ok(same(s2.gear.bonus,eAll.bonus)&&s2.gear.luck===EQUIP_LUCK_MAX&&s2.stats.maxHp===g.stats.maxHp,"chỉ số sau khi vào lại giống trước (tính lại từ dữ liệu đã lưu)");
  // Đổi chỗ vũ khí rồi vào lại: một lần ghi đổi ô cho hai món (chỉ mục duy nhất (tài khoản, ô) không vướng).
  await op("equipgear",{id:W2}); await rejoin();
  ok(worn(0)?.id===W2&&inBag(W1)&&S.gear.items.length===4,"đổi chỗ vũ khí rồi vào lại: Vũ Khí Phàm Khí đang mặc, Chí Bảo về túi");
  // ---- 20 lệnh dồn cùng lúc: chỉ một lệnh có hiệu lực, không nhân đồ ----
  for(let k=0;k<20;k++) S.room.send("equipgear",{id:W1});
  await waitFor(()=>worn(0)?.id===W1,2000); await sleep(400);
  ok(worn(0)?.id===W1&&S.gear.items.filter(i=>i.id===W1).length===1&&!inBag(W1)&&inBag(W2)&&S.gear.items.length===4&&loose().filter(i=>i.code===EQUIP_ITEM).length===2,
    "20 lệnh mặc cùng một món: ô có đúng một món, không nhân đồ, món cũ về túi một lần");
  await rejoin(); ok(S.gear.items.length===4&&worn(0)?.id===W1&&loose().filter(i=>i.code===EQUIP_ITEM).length===2,"vào lại sau đua lệnh: vẫn 4 món mặc, 2 món trong túi");
  // ---- Tháo ----
  t=await op("unequipgear",{slot:0}); ok(t===""&&!worn(0)&&inBag(W1)&&S.gear.items.length===3&&S.gear.st.weapon===null,"tháo vũ khí theo chỉ số ô: về túi, không còn công vũ khí");
  t=await op("unequipgear",{slot:"day_chuyen"}); ok(t===""&&!worn(5)&&inBag(N1)&&S.gear.st.luck===0,"tháo theo mã ô (day_chuyen): về túi, hết may mắn");
  // Túi đầy: không tháo được; vẫn đổi chỗ được (số ô không đổi).
  const room=free(); if(room>0) await test(S,"give",{code:RING_ITEM,qty:room,years:100}); await waitFor(()=>free()===0,3000);
  t=await op("unequipgear",{slot:2}); ok(/Túi đồ đã đầy/.test(t)&&worn(2)&&free()===0,`túi đầy: tháo bị từ chối, món vẫn mặc (${t})`);
  t=await op("equipgear",{id:A1}); ok(t===""&&worn(2)?.id===A1&&inBag(A2)&&free()===0,"túi đầy: đổi chỗ vẫn được (món cũ chiếm đúng ô món mới rời)");
  await test(S,"gear",{clear:true});
  ok(!(S.gear?.items.length)&&loose().every(i=>i.code!==EQUIP_ITEM)&&(await test(S,"stats")).stats.maxHp===base0.maxHp,"dọn: hết trang bị, sinh lực tối đa về gốc");
  }finally{ await S.room.leave().catch(()=>{}); }
}

/**
 * E3 (#414) Thợ rèn cường hóa trang bị hồn sư +1 → +15: bảng số (hàm thuần), thất bại ở nấc giữa tụt cấp, +13–15 không bùa phá hủy (món biến khỏi DB), có bùa giữ cấp
 * và mất 1 bùa, bùa không trừ ở nấc không phá hủy, từ chối đúng (xa Thợ rèn, thiếu đá / Hồn Tệ, đã tối đa), món đang mặc cường hóa được (chỉ số tính lại),
 * 20 lệnh dồn cùng lúc chỉ một lệnh được xử lý (hook enhslow giữ lệnh trong chuỗi lưu), lưu qua lần vào lại (với --pg: transaction thật).
 */
export async function gearEnhanceTest(){
  console.log("[E3] Thợ rèn: cường hóa trang bị hồn sư, phá hủy, Bùa Hộ Mệnh, chống nhân đồ");
  const st=l=>equipEnhanceStep(l);
  ok(EQUIP_ENHANCE.length===5&&st(0).stone===0&&st(15)===null&&st(14).fail.kind==="destroy"&&st(11).fail.kind==="down"&&st(5).fail.kind==="keep",
    "bảng cường hóa: 5 nấc, +15 là tối đa, +13–15 thất bại phá hủy, +7–12 tụt cấp, thấp hơn giữ cấp");
  ok(same(equipEnhanceResult(14,false,false),{enhance:0,destroyed:true,charmUsed:false})&&same(equipEnhanceResult(14,false,true),{enhance:14,destroyed:false,charmUsed:true})
    &&same(equipEnhanceResult(10,false,true),{enhance:9,destroyed:false,charmUsed:false})&&equipEnhanceResult(15,true,false)===null,
    "equipEnhanceResult: phá hủy / bùa giữ cấp / bùa không có tác dụng ở nấc tụt cấp / +15 không cường hóa nữa");
  const S=await bot("Cuong hoa","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(S,"ping"))?.enabled){ needHookSkip("bỏ qua cường hóa trang bị (cần hook gear, give, coin, enhroll, enhslow): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  try{
  const me=()=>S.room.state.players?.get(S.room.sessionId), loose=()=>looseOf(S), find=id=>loose().find(i=>i.id===id)??S.gear?.items.find(g=>g.id===id);
  const watch=()=>{ S.enhN=0; S.enhLast=null; S.room.onMessage("equipenhd",m=>{ S.enhLast=m; S.enhN++; }); S.room.onMessage("equipenhp",()=>{}); };
  watch();
  S.travel=null; S.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>S.travel,4000);
  if(S.travel){ const t=S.travel; await S.room.leave(); await sleep(300); S.mapId=t.mapId; await enter(S,t.roomId??undefined); watch(); }
  await waitFor(()=>me()&&S.bag&&S.gear,4000);
  async function rejoin(){ await S.room.leave(); await sleep(400); S.mapId=(await post("/api/me",{token:S.token})).mapId; await enter(S); watch(); await waitFor(()=>me()&&S.bag&&S.gear,4000); }
  const lr=npcSpot("nac_dinh_thanh","lo_ren");
  const have=code=>loose().filter(i=>i.code===code).reduce((n,i)=>n+i.qty,0);
  const give=async(code,qty)=>{ const n=have(code); await test(S,"give",{code,qty}); await waitFor(()=>have(code)===n+qty,2000); };
  const coin=async n=>{ await test(S,"coin",{n}); await waitFor(()=>S.bag.honTe===n,1500); };
  const mk=async(tpl,enhance)=>{ const r=await test(S,"gear",{tpl,enhance,ilvl:3}); await waitFor(()=>loose().some(i=>i.id===r?.id),1500); return r?.id; };
  /** Gửi equipenh; trả kết quả (tin equipenhd) hoặc null kèm dòng log từ chối. */
  async function enh(id,charm=false){ const n=S.enhN, l=S.logs.length; S.room.send("equipenh",{id,charm}); await waitFor(()=>S.enhN>n||S.logs.length>l,2500); await sleep(150); return S.enhN>n?S.enhLast:null; }
  const stone=l=>EQUIP_STONES[st(l).stone].id;
  await test(S,"gear",{clear:true}); await test(S,"rest",{s:TEAM_COMBAT_SECS+1});

  // ---- Từ chối ----
  const A=await mk("vu_khi_pham_khi",3); await coin(1e6); await give(stone(3),20);
  let r=await enh(A); ok(r===null&&/lại gần Thợ rèn/.test(S.logs.at(-1))&&find(A).enhance===3&&have(stone(3))===20&&S.bag.honTe===1e6,`xa Thợ rèn: bị từ chối, không trừ gì (${S.logs.at(-1)})`);
  await test(S,"goto",{x:lr.x,y:lr.y+16});
  await test(S,"enhroll",{r:0});
  await coin(st(3).fee-1); r=await enh(A); ok(r===null&&/Không đủ Hồn Tệ/.test(S.logs.at(-1))&&find(A).enhance===3&&have(stone(3))===20,`thiếu Hồn Tệ: bị từ chối, đá còn nguyên (${S.logs.at(-1)})`);
  await coin(1e6); S.room.send("discard",{id:loose().find(i=>i.code===stone(3))?.id}); await waitFor(()=>have(stone(3))===0,2000);
  r=await enh(A); ok(r===null&&/Không đủ/.test(S.logs.at(-1))&&find(A).enhance===3&&S.bag.honTe===1e6,`thiếu đá: bị từ chối, Hồn Tệ còn nguyên (${S.logs.at(-1)})`);
  r=await enh("khong-co-id"); ok(r===null&&/Không có trang bị/.test(S.logs.at(-1)),"id lạ: bị từ chối");

  // ---- Thành công: +3 → +4 (nấc 4–6: đá II ×qty, phí), đá và phí trừ ----
  const B=await mk("vu_khi_pham_khi",3); await give(stone(3),st(3).qty*3); await coin(1e6);
  const s4=st(3); r=await enh(B);
  ok(r?.ok===true&&r.to===4&&find(B).enhance===4&&have(stone(3))===st(3).qty*2&&S.bag.honTe===1e6-s4.fee,`tung thắng: +3 → +4, trừ ${s4.qty} đá và phí ${s4.fee}`);

  // ---- Thất bại nấc giữa: +11 → thất bại tụt 1 cấp (+10), đá và phí vẫn trừ ----
  await test(S,"enhroll",{r:99});
  const M=await mk("vu_khi_pham_khi",11); await give(stone(11),st(11).qty); await coin(1e6);
  r=await enh(M); ok(r&&!r.ok&&!r.destroyed&&r.to===10&&find(M).enhance===10&&have(stone(11))===0&&S.bag.honTe===1e6-st(11).fee,"+11 thất bại: tụt 1 cấp xuống +10, đá và phí đã trừ");
  const K=await mk("vu_khi_pham_khi",5); await give(stone(5),st(5).qty); r=await enh(K,true);
  ok(r&&!r.ok&&r.to===5&&!r.charmUsed&&find(K).enhance===5,"+5 thất bại: giữ cấp");

  // ---- Phá hủy +14 không bùa; có bùa giữ cấp, mất 1 bùa; bùa không trừ ở nấc không phá hủy ----
  const D=await mk("vu_khi_pham_khi",14), P=await mk("ao_pham_khi",14);
  await give(stone(14),st(14).qty*3); await give(EQUIP_CHARM,2); await coin(1e6);
  r=await enh(P,true); ok(r&&!r.ok&&!r.destroyed&&r.charmUsed&&r.to===14&&find(P).enhance===14&&have(EQUIP_CHARM)===1&&have(stone(14))===st(14).qty*2&&S.bag.honTe===1e6-st(14).fee,
    "+14 thất bại có bùa: giữ +14, mất 1 Bùa Hộ Mệnh (còn 1), đá và phí vẫn trừ");
  r=await enh(D,false); ok(r&&r.destroyed&&r.to===null&&!find(D)&&have(EQUIP_CHARM)===1,"+14 thất bại không bùa: món bị PHÁ HỦY, không trừ bùa");
  await rejoin(); ok(!find(D)&&find(P)?.enhance===14&&have(EQUIP_CHARM)===1,"vào lại: món bị phá hủy đã biến mất khỏi DB, món có bùa vẫn +14, còn 1 bùa");
  await test(S,"goto",{x:lr.x,y:lr.y+16}); await test(S,"enhroll",{r:99});
  await give(stone(14),st(14).qty); await coin(1e6);
  r=await enh(P,true); ok(r?.charmUsed&&have(EQUIP_CHARM)===0&&find(P).enhance===14,"dùng nốt bùa cuối: bùa về 0");
  await give(stone(14),st(14).qty); const sk=have(stone(14)); r=await enh(P,true); ok(r===null&&/Không có Bùa Hộ Mệnh/.test(S.logs.at(-1))&&find(P).enhance===14&&have(stone(14))===sk,"chọn dùng bùa mà hết bùa: bị từ chối, không trừ đá, món còn nguyên");
  await test(S,"enhroll",{r:0}); r=await enh(P,false); ok(r?.ok&&find(P).enhance===15,"+14 → +15 thành công");
  r=await enh(P,false); ok(r===null&&/tối đa/.test(S.logs.at(-1)),"+15: đã tối đa, bị từ chối");

  // ---- Món đang mặc cường hóa được, chỉ số tính lại ngay ----
  const W=await mk("vu_khi_chi_bao",0); await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); S.room.send("equipgear",{id:W}); await waitFor(()=>S.gear?.items.some(g=>g.id===W),2000);
  const e0=S.gear.st.weapon; await give(stone(0),st(0).qty); await coin(1e6); r=await enh(W);
  const eW=equipStats([{...parseEquip(find(W).stats),enhance:1}]);
  ok(r?.ok&&find(W).enhance===1&&S.gear.items.find(g=>g.id===W).enhance===1&&same(S.gear.st.weapon,eW.weapon)&&S.gear.st.weapon.max>e0.max,"món đang mặc: cường hóa +1, công vũ khí tính lại ngay khớp equipStats");
  ok(await waitFor(()=>S.bag.honTe===1e6-st(0).fee&&have(stone(0))===0,2000),`món đang mặc: tin bag cũng về đúng (đá còn ${have(stone(0))}, Hồn Tệ ${S.bag.honTe})`);
  await test(S,"enhroll",{r:99}); await test(S,"gear",{clear:true}); // món +14 mặc rồi bị phá hủy: ô trống, chỉ số về 0
  const W2=await mk("vu_khi_chi_bao",14); await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); S.room.send("equipgear",{id:W2}); await waitFor(()=>S.gear?.items.some(g=>g.id===W2),2000);
  await give(stone(14),st(14).qty); r=await enh(W2); await sleep(200);
  ok(r?.destroyed&&!find(W2)&&S.gear.items.length===0&&S.gear.st.weapon===null,"món đang mặc +14 thất bại không bùa: bị phá hủy, ô trống, hết công vũ khí");
  await rejoin(); ok(!find(W2)&&S.gear.items.length===0,"vào lại: món mặc bị phá hủy không xuất hiện lại");

  // HL4 (#573): áo đang mặc bị phá hủy khi cường hóa thì gearAo (state công khai) về 0, người khác không còn thấy áo đó.
  { const pl=()=>S.room.state.players.get(S.room.sessionId), A=await mk("ao_tu_kim",14); await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); S.room.send("equipgear",{id:A}); await waitFor(()=>pl()?.gearAo===4,2000);
    const worn=pl()?.gearAo; await test(S,"enhroll",{r:99}); await give(stone(14),st(14).qty); await coin(1e6); r=await enh(A); await waitFor(()=>pl()?.gearAo===0,2000);
    ok(worn===4&&r?.destroyed&&pl()?.gearAo===0,`áo đang mặc +14 bị phá hủy: gearAo ${worn} -> ${pl()?.gearAo} (hết hiện áo trên lớp LPC)`); }

  // ---- 20 lệnh dồn cùng lúc: một lệnh được xử lý, không nhân đồ ----
  await test(S,"goto",{x:lr.x,y:lr.y+16}); await test(S,"enhroll",{r:0});
  const T=await mk("day_chuyen_than_khi",0); await give(stone(0),30); await coin(1e6);
  const stones0=have(stone(0)), coin0=S.bag.honTe, n0=S.enhN; await test(S,"enhslow",{ms:400});
  for(let k=0;k<20;k++) S.room.send("equipenh",{id:T,charm:false});
  await waitFor(()=>S.enhN>n0,3000); await sleep(900); await test(S,"enhslow",{ms:0});
  ok(S.enhN===n0+1&&find(T).enhance===1&&have(stone(0))===stones0-st(0).qty&&S.bag.honTe===coin0-st(0).fee,
    `20 lệnh dồn: đúng 1 lệnh được xử lý (+0 → +${find(T).enhance}), trừ ${stones0-have(stone(0))} đá và ${coin0-S.bag.honTe} Hồn Tệ`);
  r=await enh(T); ok(r?.ok&&find(T).enhance===2,"sau khi xong, lệnh kế tiếp được nhận lại bình thường");
  await rejoin(); ok(find(T)?.enhance===2,"vào lại: cấp cường hóa đã lưu");
  // ---- #559: khóa Redis theo món (chỉ khi chạy nhiều tiến trình, hook itemlock giả tiến trình khác đang giữ món) ----
  const LK=await mk("day_chuyen_than_khi",0); await give(stone(0),30); await coin(1e6); await test(S,"enhroll",{r:0});
  const held=await test(S,"itemlock",{id:LK,on:true});
  if(!held?.redis) console.log("  ⚠ bỏ qua khóa Redis theo món (cần --procs 2 --pg --env REDIS_URL=…)");
  else{
    const lk0=have(stone(0)), lc0=S.bag.honTe, ln=S.enhN;
    r=await enh(LK); ok(held.held&&r===null&&/đang được xử lý/.test(S.logs.at(-1))&&find(LK).enhance===0&&have(stone(0))===lk0&&S.bag.honTe===lc0,
      `món đang bị tiến trình khác giữ khóa: cường hóa bị từ chối "đang xử lý", không trừ đá / phí (${S.logs.at(-1)})`);
    await test(S,"itemlock",{id:LK,on:false}); r=await enh(LK);
    ok(r?.ok&&find(LK).enhance===1&&have(stone(0))===lk0-st(0).qty&&S.bag.honTe===lc0-st(0).fee,"nhả khóa: cường hóa chạy, đúng một lần trừ đá và phí");
    await rejoin(); ok(find(LK)?.enhance===1&&have(stone(0))===lk0-st(0).qty,"vào lại: đúng một lần cường hóa đã lưu (không nhân, không mất đồ)");
    // Rời game khi món vừa mặc đang bị giữ khóa: lần ghi cuối chờ có hạn rồi vẫn ghi, không mất tiến độ (#559).
    await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); await test(S,"itemlock",{id:LK,on:true}); S.room.send("equipgear",{id:LK}); await waitFor(()=>S.gear?.items.some(g=>g.id===LK),2000);
    await rejoin(); await test(S,"itemlock",{id:LK,on:false});
    ok(S.gear?.items.some(g=>g.id===LK&&g.enhance===1),"rời game khi món đang bị giữ khóa: lần ghi cuối vẫn lưu, vào lại món vẫn đang mặc");
  }
  await test(S,"enhroll",{r:-1}); await test(S,"gear",{clear:true});
  }finally{ await S.room.leave().catch(()=>{}); }
}

/**
 * E4 (#415) Thợ rèn hợp thành 3 → 1 và phân giải hàng loạt: bảng số và hàm thuần (equipSynthOutcome, equipSalvage, equipAutoSalvageable), thành công (món mới bậc kế,
 * ilvl cao nhất, giữ nửa cấp), thất bại từng bậc (T2 → T3 mất 2 hiến tế; T3 → T4 món chính −1 cấp; T4 → T5 mất cả 3, hoàn Tinh Hoa), từ chối đúng (khác bậc / ô, khoá,
 * trùng id, đang mặc, thiếu phí / Tinh Hoa, xa Thợ rèn, bậc cao nhất), 20 lệnh dồn chỉ 1 lệnh được xử lý, phân giải (Hồn Tệ + nguyên liệu, không kinh nghiệm,
 * túi đầy từ chối cả lượt không mất món), tự phân giải (mặc định tắt, bỏ qua món khoá / cường hóa), lưu qua lần vào lại (với --pg: transaction thật).
 */
export async function gearSynthTest(){
  console.log("[E4] Thợ rèn: hợp thành 3 → 1, phân giải hàng loạt, tự phân giải");
  ok(EQUIP_SYNTH.length===5&&equipSynthStep(5)===null&&equipSynthStep(0).p===1&&equipSynthStep(4).all&&equipSynthStep(3).mainLoss===1&&equipSynthStep(4).essence>0,
    "bảng hợp thành: T0 → T4 hợp được, T5 không; T3 → T4 món chính −1 cấp, T4 → T5 mất cả 3");
  ok(same(equipSynthOutcome(2,9,true),{ok:true,enhance:Math.floor(9*EQUIP_SYNTH_KEEP)})&&same(equipSynthOutcome(2,9,false),{ok:false,main:9,refund:0})
    &&same(equipSynthOutcome(3,9,false),{ok:false,main:8,refund:0})&&same(equipSynthOutcome(3,0,false),{ok:false,main:0,refund:0})
    &&same(equipSynthOutcome(4,9,false),{ok:false,main:null,refund:Math.floor(equipSynthStep(4).essence*equipSynthStep(4).refund)})&&equipSynthOutcome(5,0,true)===null,
    "equipSynthOutcome: giữ nửa cấp khi thành công, tụt 1 cấp ở T3, mất cả ba và hoàn Tinh Hoa ở T4, không tụt dưới +0");
  const lo=equipSalvage(2,5,()=>0), hi=equipSalvage(2,5,()=>0.999);
  ok(lo.coin===Math.round(EQUIP_SALVAGE[2].coin*2)&&lo.items.length===EQUIP_SALVAGE[2].mats.length&&hi.items.length===1&&hi.coin===lo.coin&&lo.items.every((m,i)=>m.qty===EQUIP_SALVAGE[2].mats[i].qty[0]),
    "equipSalvage: Hồn Tệ gốc × (1 + cấp / 5), rnd thấp ra đủ nguyên liệu số nhỏ nhất, rnd cao chỉ còn dòng chắc chắn");
  const mkp=(tier,enhance,extra={})=>({code:"trang_bi",stats:{tpl:["vu_khi","mu","ao"][0]+"_"+["pham_khi","tinh_thiet","han_ngoc","tu_kim","than_khi","chi_bao"][tier],ilvl:1,roll:0,affixes:[],luck:0},enhance,...extra});
  const cfg=parseSell({salv:3,salvEnh:2});
  ok(equipAutoSalvageable(mkp(2,1),cfg)&&!equipAutoSalvageable(mkp(3,0),cfg)&&!equipAutoSalvageable(mkp(0,2),cfg)&&!equipAutoSalvageable(mkp(0,0,{locked:true}),cfg)
    &&!equipAutoSalvageable(mkp(0,0,{equipSlot:0}),cfg)&&!equipAutoSalvageable(mkp(0,0),parseSell({}))&&parseSell({salv:99}).salv===5&&parseSell({}).salv===0,
    "equipAutoSalvageable: dưới bậc / cấp đặt, bỏ qua món khoá / đang mặc; mặc định tắt; kẹp tối đa T4");
  const S=await bot("Hop thanh","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(S,"ping"))?.enabled){ needHookSkip("bỏ qua hợp thành / phân giải (cần hook gear, give, coin, synroll, enhslow): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  try{
  const me=()=>S.room.state.players?.get(S.room.sessionId), loose=()=>looseOf(S), find=id=>loose().find(i=>i.id===id)??S.gear?.items.find(g=>g.id===id);
  const watch=()=>{ S.synN=0; S.synLast=null; S.salvN=0; S.salvLast=null; S.room.onMessage("equipsynd",m=>{ S.synLast=m; S.synN++; }); S.room.onMessage("equipsalvd",m=>{ S.salvLast=m; S.salvN++; }); };
  watch();
  S.travel=null; S.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>S.travel,4000);
  if(S.travel){ const t=S.travel; await S.room.leave(); await sleep(300); S.mapId=t.mapId; await enter(S,t.roomId??undefined); watch(); }
  await waitFor(()=>me()&&S.bag&&S.gear,4000);
  async function rejoin(){ await S.room.leave(); await sleep(400); S.mapId=(await post("/api/me",{token:S.token})).mapId; await enter(S); watch(); await waitFor(()=>me()&&S.bag&&S.gear,4000); }
  const lr=npcSpot("nac_dinh_thanh","lo_ren");
  const have=code=>loose().filter(i=>i.code===code).reduce((n,i)=>n+i.qty,0);
  const equips=()=>loose().filter(i=>i.code==="trang_bi");
  const give=async(code,qty)=>{ const n=have(code); await test(S,"give",{code,qty}); await waitFor(()=>have(code)===n+qty,2000); };
  const coin=async n=>{ await test(S,"coin",{n}); await waitFor(()=>S.bag.honTe===n,1500); };
  const mk=async(tpl,enhance,ilvl=3)=>{ const r=await test(S,"gear",{tpl,enhance,ilvl}); await waitFor(()=>loose().some(i=>i.id===r?.id),1500); return r?.id; };
  const tierOf=id=>equipTemplate(parseEquip(find(id)?.stats)?.tpl)?.tier;
  /** Gửi equipsynth; trả kết quả (tin equipsynd) hoặc null kèm dòng log từ chối. */
  async function syn(main,sac){ const n=S.synN, l=S.logs.length; S.room.send("equipsynth",{main,sacrifice:sac}); await waitFor(()=>S.synN>n||S.logs.length>l,2500); await sleep(150); return S.synN>n?S.synLast:null; }
  async function salv(ids){ const n=S.salvN, l=S.logs.length; S.room.send("equipsalvage",{ids}); await waitFor(()=>S.salvN>n||S.logs.length>l,2500); await sleep(150); return S.salvN>n?S.salvLast:null; }
  const clearAll=async()=>{ await test(S,"gear",{clear:true}); await waitFor(()=>!equips().length,1500); };
  await clearAll(); await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); await coin(1e6);
  const ILVL_OF=id=>parseEquip(find(id)?.stats)?.ilvl;

  // ---- Từ chối (không đổi gì) ----
  const [a1,a2,a3]=[await mk("vu_khi_pham_khi",4,2),await mk("vu_khi_pham_khi",0,5),await mk("vu_khi_pham_khi",0,1)];
  const snap=()=>JSON.stringify([equips().map(i=>[i.id,i.enhance]).sort(),S.bag.honTe]);
  const before=snap();
  let r=await syn(a1,[a2,a3]); ok(r===null&&/lại gần Thợ rèn/.test(S.logs.at(-1))&&snap()===before,`xa Thợ rèn: từ chối, không đổi gì (${S.logs.at(-1)})`);
  await test(S,"goto",{x:lr.x,y:lr.y+16}); await test(S,"synroll",{r:0});
  r=await syn(a1,[a2]); ok(r===null&&/đúng 2 món hiến tế/.test(S.logs.at(-1))&&snap()===before,"chỉ 1 hiến tế: từ chối");
  r=await syn(a1,[a2,a2]); ok(r===null&&/không hợp lệ/.test(S.logs.at(-1))&&snap()===before,"hiến tế trùng id: từ chối");
  r=await syn(a1,[a1,a2]); ok(r===null&&/không hợp lệ/.test(S.logs.at(-1))&&snap()===before,"món chính cũng là hiến tế: từ chối");
  r=await syn(a1,[a2,"khong-co-id"]); ok(r===null&&/Không có trang bị/.test(S.logs.at(-1))&&snap()===before,"id lạ: từ chối");
  const o1=await mk("mu_pham_khi",0), o2=await mk("vu_khi_tinh_thiet",0); const b2=snap();
  r=await syn(a1,[a2,o1]); ok(r===null&&/cùng bậc và cùng ô/.test(S.logs.at(-1))&&snap()===b2,"khác ô: từ chối");
  r=await syn(a1,[a2,o2]); ok(r===null&&/cùng bậc và cùng ô/.test(S.logs.at(-1))&&snap()===b2,"khác bậc: từ chối");
  S.room.send("lock",{id:a3}); await waitFor(()=>find(a3)?.lock===true,1500); const b3=snap();
  r=await syn(a1,[a2,a3]); ok(r===null&&/đang khóa/.test(S.logs.at(-1))&&snap()===b3,"hiến tế đang khoá: từ chối");
  S.room.send("lock",{id:a3}); await waitFor(()=>!find(a3)?.lock,1500);
  S.room.send("equipgear",{id:a3}); await waitFor(()=>S.gear?.items.some(g=>g.id===a3),2000);
  r=await syn(a1,[a2,a3]); ok(r===null&&/đang mặc/.test(S.logs.at(-1))&&find(a3)?.enhance===0&&equips().length===4,"hiến tế đang mặc: từ chối, món vẫn đang mặc");
  S.room.send("unequipgear",{slot:0}); await waitFor(()=>!S.gear?.items.length,2000);
  await coin(equipSynthStep(0).fee-1); r=await syn(a1,[a2,a3]); ok(r===null&&/Không đủ Hồn Tệ/.test(S.logs.at(-1))&&equips().length===5&&S.bag.honTe===equipSynthStep(0).fee-1,"thiếu phí: từ chối, không mất món / tiền");
  await coin(1e6);
  const c5=await mk("vu_khi_chi_bao",0), c5b=await mk("vu_khi_chi_bao",0), c5c=await mk("vu_khi_chi_bao",0);
  r=await syn(c5,[c5b,c5c]); ok(r===null&&/bậc cao nhất/.test(S.logs.at(-1))&&equips().length===8,"Chí Bảo: đã là bậc cao nhất, từ chối");
  await clearAll();

  // ---- Thành công T0 → T1: ilvl cao nhất, giữ nửa cấp, phí trừ ----
  const [s1,s2,s3]=[await mk("vu_khi_pham_khi",5,2),await mk("vu_khi_pham_khi",0,5),await mk("vu_khi_pham_khi",0,1)]; const h0=S.bag.honTe;
  r=await syn(s1,[s2,s3]);
  const made=r?.made&&find(r.made), me0=made&&parseEquip(made.stats);
  ok(r?.ok&&!find(s1)&&!find(s2)&&!find(s3)&&equips().length===1&&me0?.tpl==="vu_khi_tinh_thiet"&&me0.ilvl===5&&made.enhance===Math.floor(5*EQUIP_SYNTH_KEEP)&&r.enhance===made.enhance&&S.bag.honTe===h0-equipSynthStep(0).fee,
    `hợp thành T0 → T1: 3 món thành 1 ${me0?.tpl} (ilvl ${me0?.ilvl}, +${made?.enhance}), phí −${equipSynthStep(0).fee}`);
  await rejoin(); ok(equips().length===1&&find(r.made)?.enhance===2&&parseEquip(find(r.made).stats)?.tpl==="vu_khi_tinh_thiet","vào lại: món mới đã lưu, 3 món cũ không còn");
  await clearAll();

  // ---- Thất bại T2 → T3: mất 2 hiến tế, món chính nguyên cấp ----
  await test(S,"synroll",{r:99});
  const [f1,f2,f3]=[await mk("vu_khi_han_ngoc",7),await mk("vu_khi_han_ngoc",0),await mk("vu_khi_han_ngoc",0)]; const hf=S.bag.honTe;
  r=await syn(f1,[f2,f3]); ok(r&&!r.ok&&r.enhance===7&&find(f1)?.enhance===7&&!find(f2)&&!find(f3)&&equips().length===1&&S.bag.honTe===hf-equipSynthStep(2).fee,
    "T2 → T3 thất bại: mất 2 hiến tế, món chính giữ +7, phí vẫn trừ");
  await clearAll();
  // ---- Thất bại T3 → T4: món chính −1 cấp (không dưới +0) ----
  const [g1,g2,g3]=[await mk("vu_khi_tu_kim",6),await mk("vu_khi_tu_kim",0),await mk("vu_khi_tu_kim",0)];
  r=await syn(g1,[g2,g3]); ok(r&&!r.ok&&r.enhance===5&&find(g1)?.enhance===5&&equips().length===1,"T3 → T4 thất bại: mất 2 hiến tế, món chính +6 → +5");
  await clearAll();
  const [z1,z2,z3]=[await mk("vu_khi_tu_kim",0),await mk("vu_khi_tu_kim",0),await mk("vu_khi_tu_kim",0)];
  r=await syn(z1,[z2,z3]); ok(r&&!r.ok&&find(z1)?.enhance===0&&equips().length===1,"T3 → T4 thất bại ở +0: không tụt dưới +0");
  await clearAll();
  // ---- T4 → T5: cần Tinh Hoa; thất bại mất cả 3, hoàn 30% ----
  const st4=equipSynthStep(4);
  const [t1,t2,t3]=[await mk("vu_khi_than_khi",3),await mk("vu_khi_than_khi",0),await mk("vu_khi_than_khi",0)];
  r=await syn(t1,[t2,t3]); ok(r===null&&/Không đủ Tinh Hoa/.test(S.logs.at(-1))&&equips().length===3&&S.bag.honTe>=st4.fee,"thiếu Tinh Hoa Đường Môn: từ chối, không mất món");
  await give(EQUIP_ESSENCE,st4.essence+2); const hh=S.bag.honTe;
  r=await syn(t1,[t2,t3]); const refund=Math.floor(st4.essence*st4.refund);
  ok(r&&!r.ok&&r.enhance===null&&r.refund===refund&&equips().length===0&&have(EQUIP_ESSENCE)===2+refund&&S.bag.honTe===hh-st4.fee,
    `T4 → T5 thất bại: mất cả 3 món, Tinh Hoa −${st4.essence} +${refund} hoàn lại (còn ${have(EQUIP_ESSENCE)}), phí −${st4.fee}`);
  await test(S,"synroll",{r:0});
  const [u1,u2,u3]=[await mk("vu_khi_than_khi",4),await mk("vu_khi_than_khi",0),await mk("vu_khi_than_khi",0)]; await give(EQUIP_ESSENCE,st4.essence-have(EQUIP_ESSENCE)>0?st4.essence-have(EQUIP_ESSENCE):0); const e0=have(EQUIP_ESSENCE);
  r=await syn(u1,[u2,u3]); ok(r?.ok&&tierOf(r.made)===5&&find(r.made).enhance===2&&have(EQUIP_ESSENCE)===e0-st4.essence,`T4 → T5 thành công: ra Đường Môn Chí Bảo +2, tiêu ${st4.essence} Tinh Hoa`);
  await clearAll(); await coin(1e6);

  // ---- 20 lệnh dồn cùng lúc: chỉ một lệnh được xử lý ----
  const [d1,d2,d3]=[await mk("mu_pham_khi",0),await mk("mu_pham_khi",0),await mk("mu_pham_khi",0)]; const n0=S.synN; await test(S,"enhslow",{ms:400});
  for(let k=0;k<20;k++) S.room.send("equipsynth",{main:d1,sacrifice:[d2,d3]});
  await waitFor(()=>S.synN>n0,3000); await sleep(900); await test(S,"enhslow",{ms:0});
  ok(S.synN===n0+1&&equips().length===1&&tierOf(equips()[0].id)===1,`20 lệnh dồn: đúng 1 lệnh được xử lý (còn ${equips().length} món bậc ${tierOf(equips()[0]?.id)})`);
  await clearAll();

  // ---- Phân giải: Hồn Tệ + nguyên liệu, không kinh nghiệm ----
  await test(S,"synroll",{r:0}); await coin(1000);
  const xp0=me()?.xp ?? null;
  const p1=await mk("vu_khi_pham_khi",0), p2=await mk("mu_tinh_thiet",5), p3=await mk("ao_than_khi",0);
  const exp=[[0,0],[1,5],[4,0]].map(([t,e])=>equipSalvage(t,e,()=>0));
  const coinSum=exp.reduce((a,x)=>a+x.coin,0), mats={}; for(const x of exp) for(const m of x.items) mats[m.code]=(mats[m.code]??0)+m.qty;
  const before0=Object.fromEntries(Object.keys(mats).map(c=>[c,have(c)]));
  r=await salv([p1,p2,p3]); await sleep(200);
  ok(r&&r.n===3&&r.coin===coinSum&&S.bag.honTe===1000+coinSum&&!equips().length&&Object.entries(mats).every(([c,q])=>have(c)===before0[c]+q&&r.items.find(m=>m.code===c)?.qty===q),
    `phân giải 3 món (T0, T1 +5, T4): +${coinSum} Hồn Tệ và ${Object.entries(mats).map(([c,q])=>`${q} ${c}`).join(", ")}`);
  ok(xp0===null||me()?.xp===xp0,"phân giải không cho kinh nghiệm");
  await rejoin(); ok(S.bag.honTe===1000+coinSum&&!equips().length&&Object.entries(mats).every(([c,q])=>have(c)===before0[c]+q),"vào lại: Hồn Tệ và nguyên liệu đã lưu, món đã mất");
  await test(S,"goto",{x:lr.x,y:lr.y+16}); await test(S,"synroll",{r:0});
  // từ chối
  const q1=await mk("vu_khi_pham_khi",0), q2=await mk("mu_pham_khi",0); const bq=snap();
  r=await salv([]); ok(r===null&&/Chưa chọn/.test(S.logs.at(-1)),"danh sách rỗng: từ chối");
  r=await salv([q1,"khong-co-id"]); ok(r===null&&/Không có trang bị/.test(S.logs.at(-1))&&snap()===bq,"có id lạ: từ chối cả lượt, không mất món");
  r=await salv([q1,q1]); ok(r===null&&/không hợp lệ/.test(S.logs.at(-1))&&snap()===bq,"id trùng: từ chối");
  S.room.send("lock",{id:q2}); await waitFor(()=>find(q2)?.lock===true,1500);
  r=await salv([q1,q2]); ok(r===null&&/đang khóa/.test(S.logs.at(-1))&&find(q1)&&find(q2),"có món khoá: từ chối cả lượt");
  S.room.send("lock",{id:q2}); await waitFor(()=>!find(q2)?.lock,1500);
  S.room.send("equipgear",{id:q1}); await waitFor(()=>S.gear?.items.some(g=>g.id===q1),2000);
  r=await salv([q1]); ok(r===null&&/đang mặc/.test(S.logs.at(-1))&&S.gear.items.some(g=>g.id===q1),"món đang mặc: từ chối, món vẫn mặc");
  S.room.send("unequipgear",{slot:0}); await waitFor(()=>!S.gear?.items.length,2000);
  r=await salv(Array.from({length:51},(_,i)=>"x"+i)); ok(r===null&&/tối đa 50/.test(S.logs.at(-1)),"quá 50 món một lệnh: từ chối");
  await test(S,"goto",{x:lr.x,y:lr.y+16});
  await clearAll();

  // ---- Túi đầy: nguyên liệu không có chỗ → từ chối cả lượt, không mất món ----
  const isMat=i=>/^da_cuong_hoa_/.test(i.code)||i.code===EQUIP_ESSENCE||i.code===EQUIP_SOUL;
  for(const it of loose().filter(isMat)) S.room.send("discard",{id:it.id}); await waitFor(()=>!loose().some(isMat),3000); // bỏ đá còn thừa để nguyên liệu phải mở ô mới
  const w1=await mk("mu_tinh_thiet",0); // T1: cần ô mới cho 2 loại đá, nhả 1 ô
  await test(S,"give",{code:RING_ITEM,qty:S.bag.slots-loose().length,years:10}); await waitFor(()=>loose().length>=S.bag.slots,3000);
  const full=loose().length, hw=S.bag.honTe;
  r=await salv([w1]); ok(r===null&&/không đủ chỗ/.test(S.logs.at(-1))&&find(w1)&&loose().length===full&&S.bag.honTe===hw,`túi đầy ${full}/${S.bag.slots}: từ chối cả lượt, món còn nguyên (${S.logs.at(-1)})`);
  await rejoin(); ok(find(w1)&&S.bag.honTe===hw,"vào lại: món vẫn còn, Hồn Tệ không đổi");
  for(const it of loose().filter(i=>i.code===RING_ITEM)) S.room.send("discard",{id:it.id});
  ok(await waitFor(()=>!loose().some(i=>i.code===RING_ITEM),5000),"bỏ hết hồn hoàn thử");
  await clearAll();

  // ---- Tự phân giải: mặc định tắt; bật thì chỉ món hợp bộ lọc, bỏ qua khoá / cường hóa cao ----
  await test(S,"synroll",{r:0});
  const aa=await mk("vu_khi_pham_khi",0), ab=await mk("mu_tinh_thiet",0), ac=await mk("ao_pham_khi",2), ad=await mk("dai_han_ngoc",0), ae=await mk("giay_pham_khi",0);
  S.room.send("lock",{id:ae}); await waitFor(()=>find(ae)?.lock===true,1500);
  await test(S,"give",{code:RING_ITEM,qty:S.bag.slots-loose().length-1,years:10}); await waitFor(()=>loose().length>=S.bag.slots-1,3000);
  await sleep(1500); const nAuto=S.salvN;
  ok(S.bag.sell?.salv===0&&equips().length===5&&S.salvN===nAuto,"mặc định tắt: túi gần đầy cũng không tự phân giải");
  const coinA=S.bag.honTe; S.room.send("autosell",{cfg:{on:false,salv:2,salvEnh:1}});
  ok(await waitFor(()=>S.salvN>nAuto,4000),"bật tự phân giải: server tự phân giải khi túi gần đầy");
  await sleep(300);
  ok(!find(aa)&&!find(ab)&&find(ac)&&find(ad)&&find(ae)&&S.salvLast?.auto===true&&S.salvLast.n===2&&S.bag.honTe>coinA&&S.bag.sell.on===false,
    "tự phân giải đúng 2 món (T0 +0, T1 +0); giữ món +2, T2 và món khoá; không bật tự bán");
  await rejoin(); ok(!find(aa)&&!find(ab)&&find(ac)&&find(ae)?.lock===true&&S.bag.sell?.salv===2,"vào lại: kết quả và bộ lọc tự phân giải đã lưu");
  S.room.send("autosell",{cfg:{salv:0}});
  for(const it of loose().filter(i=>i.code===RING_ITEM)) S.room.send("discard",{id:it.id});
  await waitFor(()=>!loose().some(i=>i.code===RING_ITEM),5000);
  await test(S,"synroll",{r:-1}); await clearAll();
  }finally{ await S.room.leave().catch(()=>{}); }
}

// Rơi trang bị (E2, mục 5.15; equipDropTest nằm trong nhóm "bag"): hook `edrop {seed}` đặt RNG có hạt cho mọi lần tung rơi trang bị của người này, bot tung lại
// cùng hạt bằng rollEquipDrop / rollEquipCharm của shared để so từng món: hồn thú thường rơi đất (nhặt E, túi đầy thì ở lại), đá vào thẳng túi, rương thú vương / boss
// thế giới cho đồ lúc MỞ (cần đủ ô trống), lưu qua lần vào lại (stats JSON).
export async function equipDropTest(){
  console.log("[E2] Rơi trang bị: hồn thú thường rơi đất, đá vào túi, rương thú vương / boss thế giới");
  const mulberry=seed=>{ let a=seed>>>0; return ()=>{ a=(a+0x6d2b79f5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; };
  const S=await bot("Rơi trang bị","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(S,"ping"))?.enabled){ needHookSkip("bỏ qua rơi trang bị (cần hook edrop, beast, give): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  try{
  const me=()=>S.room.state.players?.get(S.room.sessionId), loose=()=>looseOf(S), eqs=()=>loose().filter(i=>i.code===SD.EQUIP_ITEM), st=S.room.state, mapId=st.mapId;
  await waitFor(()=>me()&&S.bag,3000);
  if(!SD.EQUIP_MAPS[mapId]){ console.log(`  ⚠ bỏ qua rơi trang bị: ${mapId} không có bảng rơi`); return; }
  async function rejoin(){ await S.room.leave(); await sleep(400); S.mapId=(await post("/api/me",{token:S.token})).mapId; await enter(S); await waitFor(()=>me()&&S.bag&&S.gear,3000); }
  const plain=e=>({tpl:e.tpl,ilvl:e.ilvl,roll:e.roll,affixes:e.affixes,luck:e.luck});
  await test(S,"gear",{clear:true});
  // ---- Hồn thú thường: tìm hạt cho đúng một món trang bị (A) và hạt chỉ ra đá (B) ----
  const seedFor=(pred)=>{ for(let k=1;k<200000;k++){ const d=SD.rollEquipDrop(0,mapId,mulberry(k)); if(pred(d)) return k; } return 0; };
  const sA=seedFor(d=>d.length===1&&d[0].kind==="equip"), sB=seedFor(d=>d.length===1&&d[0].kind==="stone");
  ok(sA>0&&sB>0,`hạt thử: A=${sA} (một món trang bị), B=${sB} (một nhóm đá)`);
  const zs=JSON.parse(readFileSync(mapUrl(mapId),"utf8")).layers.flatMap(l=>l.objects??[]).filter(o=>(o.type??o.class)==="zone"), hz=zs.find(z=>/Bãi tập/.test(z.name))??zs[0];
  // Chỗ đứng được: thử vài điểm trong vùng tới khi hook goto đặt được đúng chỗ.
  for(let k=0;k<60;k++){ const x=Math.round(hz.x+30+Math.random()*(hz.width-60)), y=Math.round(hz.y+40+Math.random()*(hz.height-80)); await test(S,"goto",{x,y}); await sleep(60); if(me()&&Math.hypot(me().x-x,me().y-y)<1) break; }
  await test(S,"clear"); await test(S,"bone",{r:100}); await test(S,"core",{r:100}); await test(S,"shard",{r:100}); await test(S,"herb",{r:100}); // chỉ để các rơi khác không xen vào
  async function kill(seed){
    await test(S,"edrop",{seed}); const before=new Set(st.drops.keys()), fresh=()=>[...st.drops.entries()].filter(([k])=>!before.has(k));
    const r=await test(S,"beast",{dx:0,dy:0}); await waitFor(()=>r?.bid&&st.beasts.has(r.bid),1000);
    for(let i=0;i<15&&r?.bid&&st.beasts.has(r.bid);i++){ S.room.send("attack"); await waitFor(()=>!st.beasts.has(r.bid),450); }
    await sleep(300); return fresh();
  }
  // Món trang bị rơi xuống đất, đúng mẫu và bậc; không có trong túi tới khi nhặt.
  const e0=eqs().length; S.logs=[]; let nd=await kill(sA); const want=SD.rollEquipDrop(0,mapId,mulberry(sA))[0].item, tpl=SD.equipTemplate(want.tpl);
  const gd=nd.find(([,d])=>d.item===SD.EQUIP_ITEM);
  ok(gd&&SD.EQUIP_TEMPLATES[gd[1].cset]?.id===want.tpl&&gd[1].stars===tpl.tier+1&&gd[1].owner===S.room.sessionId&&eqs().length===e0,
    `hạt ${sA}: ${SD.equipName(want.tpl)} (bậc ${tpl.tier}) rơi xuống đất, thuộc người hạ, chưa vào túi (${gd?.[1].cset}/${gd?.[1].stars})`);
  ok(S.logs.some(t=>t.includes(SD.equipName(want.tpl))&&/rơi xuống đất/.test(t)),"thông báo món rơi kèm tên");
  // Hồn hoàn nằm đúng chỗ người hạ đứng nên mỗi lần nhấn E nhặt món gần nhất: nhấn tới khi món trang bị vào túi.
  for(let k=0;k<6&&st.drops.has(gd[0]);k++){ S.room.send("pickup"); await waitFor(()=>!st.drops.has(gd[0]),400); }
  ok(await waitFor(()=>eqs().length===e0+1)&&!st.drops.has(gd[0]),"nhặt (E): món vào túi, hết dưới đất");
  const got=eqs().at(-1); ok(got&&same(plain(parseEquip(got.stats)),plain(want)),`chỉ số trong túi đúng bản đã tung (${JSON.stringify(plain(parseEquip(got.stats)))})`);
  // Đá: vào thẳng túi, không rơi đất; số lượng theo tung.
  const wst=SD.rollEquipDrop(0,mapId,mulberry(sB))[0], q0=qtyOf(S,wst.code); S.logs=[]; nd=await kill(sB);
  ok(await waitFor(()=>qtyOf(S,wst.code)===q0+wst.qty)&&!nd.some(([,d])=>d.item===wst.code||d.item===SD.EQUIP_ITEM),`hạt ${sB}: +${wst.qty} ${SD.itemDef(wst.code).name} vào thẳng túi (${q0} -> ${qtyOf(S,wst.code)}), không rơi đất`);
  // Túi đầy: món vẫn rơi đất và ở lại sau khi nhặt không được.
  const free=()=>S.bag.slots-loose().length; if(free()>0) await test(S,"give",{code:RING_ITEM,qty:free(),years:100}); await waitFor(()=>free()===0,3000);
  nd=await kill(sA); const gf=nd.find(([,d])=>d.item===SD.EQUIP_ITEM); S.logs=[]; S.room.send("pickup"); await sleep(400);
  ok(gf&&st.drops.has(gf[0])&&/Túi đồ đã đầy/.test(S.logs.at(-1)??""),`túi đầy: không nhặt được, món ở lại dưới đất (${S.logs.at(-1)})`);
  for(const i of loose().filter(i=>i.code===RING_ITEM&&i.years===100)) S.room.send("discard",{id:i.id}); await waitFor(()=>free()>=SD.WORLD_CHEST.slots,4000);
  // ---- Rương thú vương / boss thế giới: đồ rơi lúc MỞ ----
  const kingMap="tinh_dau_ngoai_vi", kingId="huyet_nguyet_lang_vuong", worldB=SD.BOSSES.find(b=>b.rank===3), worldMap=Object.values(SD.MAPS).find(m=>m.world?.includes(worldB.id)).id;
  ok(SD.EQUIP_MAPS[kingMap]&&SD.EQUIP_MAPS[worldMap],`bản đồ rương có bảng rơi: ${kingMap}, ${worldMap}`);
  const stoneIds=SD.EQUIP_STONES.map(x=>x.id);
  async function open(code,rank,map,seed,label){
    await test(S,"give",{code,qty:1}); await waitFor(()=>qtyOf(S,code)>=1,1500); await test(S,"edrop",{seed});
    const r=mulberry(seed), drops=SD.rollEquipDrop(rank,map,r), charm=SD.rollEquipCharm(rank,r), e0=eqs().length, c0=qtyOf(S,SD.EQUIP_CHARM), s0=stoneIds.map(c=>qtyOf(S,c));
    const exp=drops.filter(d=>d.kind==="stone").reduce((a,d)=>(a[d.code]=(a[d.code]??0)+d.qty,a),{}), items=drops.filter(d=>d.kind==="equip").map(d=>d.item);
    const n=S.bagMsgs??0; S.room.send("open",{id:loose().find(i=>i.code===code).id}); await waitFor(()=>(S.bagMsgs??0)>n,2000); await sleep(200);
    const newEq=eqs().slice(e0).map(i=>plain(parseEquip(i.stats)));
    ok(same(newEq,items.map(plain)),`${label}: ${items.length} món trang bị trong rương khớp lần tung (hạt ${seed}): ${newEq.map(x=>x.tpl).join(", ")||"không có"}`);
    ok(stoneIds.every((c,i)=>qtyOf(S,c)-s0[i]===(exp[c]??0))&&qtyOf(S,SD.EQUIP_CHARM)-c0===charm,`${label}: đá ${JSON.stringify(exp)} và ${charm} Bùa Hộ Mệnh khớp lần tung`);
    return items;
  }
  const findSeed=(rank,map)=>{ for(let k=1;k<5000;k++){ const r=mulberry(k), d=SD.rollEquipDrop(rank,map,r); if(d.some(x=>x.kind==="equip")&&d.some(x=>x.kind==="stone")&&SD.rollEquipCharm(rank,r)) return k; } return 0; };
  const kSeed=findSeed(2,kingMap), wSeed=findSeed(3,worldMap);
  ok(kSeed>0&&wSeed>0,`hạt rương có cả trang bị, đá và bùa: thú vương ${kSeed}, boss ${wSeed}`);
  await open(SD.chestCode(kingId),2,kingMap,kSeed,"rương thú vương");
  const wi=await open(SD.chestCode(worldB.id),3,worldMap,wSeed,"rương boss thế giới");
  ok(wi.every(e=>SD.equipTemplate(e.tpl).tier<=SD.EQUIP_MAPS[worldMap].maxTier),"món từ rương không vượt bậc tối đa của bản đồ");
  // Thiếu ô trống: không mở được, rương còn nguyên (số ô cần đã gồm chỗ cho trang bị).
  await test(S,"give",{code:SD.chestCode(kingId),qty:1}); await waitFor(()=>qtyOf(S,SD.chestCode(kingId))>=1,1500);
  const f2=free(); if(f2>=SD.KING_CHEST.slots) await test(S,"give",{code:RING_ITEM,qty:f2-SD.KING_CHEST.slots+1,years:100}); await waitFor(()=>free()===SD.KING_CHEST.slots-1,2000);
  const lg=S.logs.length; S.room.send("open",{id:loose().find(i=>i.code===SD.chestCode(kingId)).id}); await waitFor(()=>S.logs.length>lg,1500);
  ok(new RegExp(`Cần ${SD.KING_CHEST.slots} ô trống`).test(S.logs.at(-1)??"")&&qtyOf(S,SD.chestCode(kingId))===1,`túi còn ${SD.KING_CHEST.slots-1} ô: "${S.logs.at(-1)}"`);
  // ---- Lưu qua lần vào lại (stats JSON ở PgStore / MemoryStore) ----
  const keep=eqs().map(i=>JSON.stringify([i.id,plain(parseEquip(i.stats)),i.enhance])).sort();
  await rejoin();
  ok(keep.length>=3&&same(eqs().map(i=>JSON.stringify([i.id,plain(parseEquip(i.stats)),i.enhance])).sort(),keep),`vào lại: ${keep.length} món trang bị rơi còn nguyên chỉ số`);
  await test(S,"edrop",{off:true});
  } finally { await S.room.leave().catch(()=>{}); }
}

/** BOT_ONLY=bag / bài "bag" của nhóm 4: gom các bài túi đồ và trang bị theo đúng thứ tự cũ. */
export async function bagTest(){ bagSyncPure(); await shopBuybackTest(); await charBagCmdTest(); await gearTest(); await gearEnhanceTest(); await gearSynthTest(); await equipDropTest(); }
