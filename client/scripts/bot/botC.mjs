// Khối botC của INLINE: bot C đi cổng BĐ2, NPC 6.1, BĐ6a–BĐ6e, BĐ3, tổ đội 7.1 (nhóm 3) (#703 bước 5, tách nguyên văn từ bot-test.mjs).
// `C` là bot của luồng này: botCFlow gán, các hàm bên dưới (npcTown, thienDauTest, …) dùng chung.
import { inZone, test, needHookSkip } from "./lib.mjs";
import { bossClock } from "./lib.mjs";
import { waitFor, sleep, goTo, ok, bagKey, post, enter, bot, WS, failCount, lastLog, npcSpot, talk, trade, objOf, qtyOf, bonesOf, sj, useItem, checkGateClear, checkBeastYears, mapUrl, PASS, same, AT, looseOf, zonesByName, RUN } from "./lib.mjs";
import * as SD from "../../../shared/data.ts";
import { formatHonTe, NPC_RANGE, npcDef, itemDef, BONE_ITEM, CORE_ITEM, coreName, coreEnhanceLevel, coreFeedXp, CORE_SUBS, boneEnhanceLevel, boneFeedXp, enhanceFee, BONE_ENHANCE_FEE, boneStats, BAG_SLOTS, DAN_CD, MAPS, MAP_MOVED, TIERS, TRAVEL_CAST, NPCS, CAMP_MERCHANT, RING_SELL, ringSellPrice, RING_ITEM, sellPrice, BONE_SELL, BONE_SELL_ENH, CORE_SELL, shardCode, SHARD_SELL, VOHON, vohonIndex, chestCode, BOSSES, SHOP, SHOP_MAX_QTY, coreResetFee, formatYears, ringLimit, parseLevelRange, beastIndex, beastSkillOf, BONE_SKILLS, bossIndex, herbChance, HERBS, HERB_ELITE, herbBonus, HERB_PCT, HERB_MAX, parseHerbs, calcStats, kingShardPool, rollCore, TEAM_COMBAT_SECS, coreStarBand, CORE_SETS, CORE_MAP_SET, tierOfYears, statusBit, beastName, MAX_YEARS, RED_BEAST_CHANCE, kingYears, BOAT_CAST, beastStats, rollCoreStats, coreSetIndex, BEASTS, STATUS, KING, WORLD_SLAM, FLOOR_SAFE, teleSafe, TELE_PAD, WORLD, WORLD_TIME, KING_CHEST, bossHpMult, worldNext, worldActive, vnHHMM, KING_TIMES, worldBossOn, SWITCH_CD, HE_IDS, TIEN_CO_MAX, WORLD_RING, BONE_SLOTS, WORLD_CHEST, partyXpShare, PARTY_MAX, PARTY_INVITE_SECS, PARTY_XP_RANGE, XP_SHARE_ACTIVE, xpLevelScale, beastLevel, xpNeed, XP_SHARE_BENCH, questChain, QUEST_STARTER, PARTY_OFFLINE_SECS } from "../../../shared/data.ts";
import { Client } from "colyseus.js";
import { readFileSync } from "node:fs";
let C;
const me=()=>C.room.state.players?.get(C.room.sessionId);

/** Đi theo vector (x,y) đến khi cond() đúng hoặc hết giờ, rồi dừng. */
async function walk(x,y,cond,ms=12000){ C.room.send("input",{x,y}); const r=await waitFor(cond,ms); C.room.send("input",{x:0,y:0}); await sleep(150); return r; }

/**
 * Đi tới cột x (pixel) theo phương ngang. Từ 11.1 ngoài giao chiến tự chạy ~7,6 pixel mỗi nhịp, nhảy qua được khoảng ±3 pixel rồi đi quá
 * đà; đi bộ ~4,75 pixel mỗi nhịp vẫn trượt nếu bot lỡ đúng nhịp nằm trong khoảng. goTo chỉnh hướng mỗi lần và chậm lại khi gần đích.
 */
const walkToX=async(tx)=>goTo(C,tx,me().y,12000);

/** Đi cổng `name` tới `to`; `during` chạy ngay sau khi xin đi (lúc đang niệm), `after` chạy khi đã nhận `travel`, trước khi rời phòng. */
async function travelBy(name,to,during,after){
  C.travel=null; C.room.send("travel",{portal:name}); await during?.();
  // Quanh cổng và trại cổng không sinh hồn thú (SPAWN_CLEAR): không hồn thú hoang nào đánh hủy niệm, kể cả khi không có GAME_TEST.
  ok(await waitFor(()=>C.travel,4000)&&C.travel.mapId===to,`đi cổng "${name}" -> travel ${C.travel?.mapId}`+(C.travel?"":` (log: ${C.logs.slice(-4).join(" | ")})`));
  await after?.();
  const x0=me().x, bk=bagKey(C); C.room.send("input",{x:1,y:0}); C.room.send("use",{id:C.bag?.items[0]?.id}); await sleep(300);
  ok(me().x===x0,"đang chuyển bản đồ: server bỏ qua input");
  ok(bagKey(C)===bk,"đang chuyển bản đồ: không dùng được đan");
  await C.room.leave(); await sleep(300);
  const m=await post("/api/me",{token:C.token});
  ok(m.mapId===to,`/api/me sau khi đi cổng: ${m.mapId}`);
  C.mapId=m.mapId; await enter(C); await waitFor(()=>me()&&C.bag);
  ok(C.room.state.mapId===to,`vào phòng ${C.room.state.mapId}`);
  ok(bagKey(C)===bk,`đi cổng: túi đồ và Hồn Tệ giữ nguyên (${C.bag?.items.length} ô, ${formatHonTe(C.bag?.honTe??0)})`);
}

/** Luồng bot C (ctx: HOOK, timing, T0 của bộ chạy). */
export async function botCFlow(ctx) {
  const { HOOK, timing, world } = ctx;
const tC=Date.now();
console.log("[cổng] tài khoản mới đi Thánh Hồn Thôn -> Nặc Đinh Thành -> Ngoại vi -> Nội địa -> Ngoại vi -> Nặc Đinh Thành");
C=await bot("Lữ "+Date.now().toString(36).slice(-6),"bich_lan_xa_hoang",{sex:0,hair:1,hairCol:2,outfitCol:3});
let joinErr=""; try{ const r=await new Client(WS).joinOrCreate("map",{token:C.token,mapId:"nac_dinh_thanh"}); await r.leave(); }catch(e){ joinErr=String(e?.message??e); }
ok(/Sai bản đồ/.test(joinErr),`vào bản đồ khác bản đồ đã lưu bị từ chối: ${joinErr}`);
ok(C.room.state.mapId==="thanh_hon_thon","C ở Thánh Hồn Thôn");
// BOT_ONLY=world (ctx.world của botCFlow): sau khi có bot C (ở Thánh Hồn Thôn), chỉ chạy phần boss thế giới ở Lõi Tinh Đấu (BĐ6e, #118).
if(world){ await loiTinhDauTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
// Thánh Hồn Thôn: từ quảng trường làng (vùng an toàn) theo đường làng xuống cổng ở mép nam.
C.room.send("attack"); ok(await lastLog(C,/Vùng an toàn/),"trong làng (vùng an toàn) không đánh được");
C.room.send("travel",{portal:"Cổng không có"}); ok(await lastLog(C,/không tồn tại/),"cổng không tồn tại bị từ chối");
C.room.send("travel",{portal:"Đi Nặc Đinh Thành"}); ok(await lastLog(C,/đứng trong cổng/),"không đứng trong cổng thì không đi được");
// 6.1: NPC trong làng. Đứng xa thì server từ chối; lại gần (hook goto) thì cho mở hộp thoại; NPC của bản đồ khác không có ở đây.
{
  console.log("[6.1] NPC ở Thánh Hồn Thôn");
  const tv=npcSpot("thanh_hon_thon","to_van_dao"), lk=npcSpot("thanh_hon_thon","lao_kiet_khac");
  ok(tv&&lk,"Thánh Hồn Thôn có Tố Vân Đào và Lão Kiệt Khắc (object npc)");
  const far=Math.hypot(tv.x-me().x,tv.y-me().y);
  if(far>NPC_RANGE) ok(await talk(C,"to_van_dao")===null&&/lại gần Tố Vân Đào/.test(C.logs.at(-1)),`đứng cách ${far.toFixed(0)} px (> ${NPC_RANGE}): Tố Vân Đào chưa nói chuyện (${C.logs.at(-1)})`);
  ok(await talk(C,"dai_su")===null&&/Không có NPC này/.test(C.logs.at(-1)),"Đại Sư không ở Thánh Hồn Thôn: bị từ chối");
  ok(await talk(C,"ai_do")===null&&/Không có NPC này/.test(C.logs.at(-1)),"mã NPC lạ bị từ chối");
  ok(/đứng cạnh thương nhân/.test(await trade(C,"buy",{code:"hoi_huyet_dan",qty:1})),"trong làng không có thương nhân: không mua được đan");
  if((await test(C,"ping"))?.enabled){
    const home=[me().x,me().y];
    for(const [id,sp] of [["to_van_dao",tv],["lao_kiet_khac",lk]]){
      await test(C,"goto",{x:sp.x,y:sp.y+16});
      ok(Math.hypot(me().x-sp.x,me().y-sp.y-16)<1,`đứng cạnh ${npcDef(id).name} (cách 16 px)`);
      ok(await talk(C,id)===id,`nói chuyện với ${npcDef(id).name}, ${npcDef(id).title}: server cho mở hộp thoại (${npcDef(id).lines.length} câu)`);
    }
    await test(C,"goto",{x:home[0],y:home[1]});
  } else needHookSkip("bỏ qua nói chuyện với NPC trong làng (cần hook goto): bật server bằng GAME_TEST=1");
}
{ const g=objOf("thanh_hon_thon","portal","Đi Nặc Đinh Thành"); await walkToX(g.x+g.width/2); }
ok(await walk(0,1,()=>C.portal?.name),`tới cổng: ${JSON.stringify(C.portal)}`);
ok(C.portal?.to==="nac_dinh_thanh"&&C.portal.toName==="Nặc Đinh Thành"&&!C.portal.warn,"hộp cổng: đích Nặc Đinh Thành, không cảnh báo");
C.room.send("travel",{portal:"Đi Nặc Đinh Thành"}); await sleep(200);
C.room.send("absorb"); ok(await lastLog(C,/không thể hấp thụ/),"đang niệm cổng: không hấp thụ được");
await walk(0,-1,()=>!C.portal?.name,3000);
ok(await lastLog(C,/rời cổng/),"rời cổng khi đang niệm: hủy");
ok(!C.travel,"chưa được chuyển bản đồ");
ok(await walk(0,1,()=>C.portal?.name),"quay lại cổng");
// Kinh nghiệm chia cho võ hồn dự bị (chưa lưu) phải nằm trong transaction đi cổng (cần hook test).
let benchXp=null;
if((await test(C,"ping"))?.enabled){
  await test(C,"kill",{tier:1}); const bn=C.owned.team.find(r=>r&&r!==C.owned.active);
  benchXp=[bn,C.owned.list.find(v=>v.rowId===bn).xp];
  // 3.1: gộp đồ cùng loại theo `stack`, giới hạn ô túi; mọi thay đổi chưa lưu này phải nằm trong transaction đi cổng.
  const st=itemDef("hoi_huyet_dan").stack, h0=qtyOf(C,"hoi_huyet_dan");
  await test(C,"give",{code:"hoi_huyet_dan",qty:2*st});
  const stacks=C.bag.items.filter(i=>i.code==="hoi_huyet_dan").map(i=>i.qty);
  ok(qtyOf(C,"hoi_huyet_dan")===h0+2*st&&stacks.length===3&&stacks[0]===st&&stacks[1]===st,`gộp Hồi Huyết Đan: ${stacks.join(" + ")} (tối đa ${st} mỗi ô)`);
  // 4.1: hồn cốt chưa lưu cũng nằm trong transaction đi cổng; bagKey so cả loài, vị trí, số năm, cường hóa.
  await test(C,"give",{code:BONE_ITEM,years:32000,beast:"am_kim_khung_trao_hung",slot:"tay_phai"});
  ok(bonesOf(C).some(i=>i.years===32000&&i.stats?.beast==="am_kim_khung_trao_hung"&&i.stats?.slot==="tay_phai"),"C có hồn cốt Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm (hook give)");
  // 5.1: hồn hạch chưa lưu cũng nằm trong transaction đi cổng; bagKey so cả sao, bộ, chỉ số.
  await test(C,"give",{code:CORE_ITEM,stars:6,set:"phuong_hoang"});
  const cc=(C.bag?.items??[]).find(i=>i.code===CORE_ITEM&&i.stars===6);
  ok(cc&&cc.stats?.set==="phuong_hoang"&&cc.stats?.subs?.length===4,`C có ${cc&&coreName(cc.stats?.set,cc.stars)} 4 dòng phụ (hook give)`);
  C.coreKeep=cc&&[cc.id,cc.stars,JSON.stringify(cc.stats)];
  // 5.2: hồn hạch vừa gắn (chưa lưu) cũng nằm trong transaction đi cổng; bagKey so cả võ hồn và ô đang gắn.
  { const before=new Set(C.bag.items.map(i=>i.id));
    for(let k=0;k<2;k++) await test(C,"give",{code:CORE_ITEM,stars:3,set:"tien_co"});
    const tcs=C.bag.items.filter(i=>!before.has(i.id)), at=[5,2];
    tcs.forEach((it,k)=>C.room.send("equipcore",{itemId:it.id,vohonId:C.owned.active,slot:at[k]}));
    ok(tcs.length===2&&await waitFor(()=>tcs.every((t,k)=>{ const i=C.bag.items.find(x=>x.id===t.id); return i?.vohon===C.owned.active&&i.stats?.slot===at[k]; })),
      "C gắn 2 hồn hạch Tiên Cơ vào ô 6 và ô 3 của võ hồn ra trận (trong làng, ngoài giao chiến)");
    C.coreEq={vohon:C.owned.active,slots:Object.fromEntries(tcs.map((t,k)=>[t.id,at[k]]))};
    // 5.3: nâng cấp hồn hạch đang gắn ngay trong làng rồi đi cổng: cấp, điểm và dòng phụ mới chưa lưu cũng nằm trong transaction
    // đi cổng, nguyên liệu không quay lại.
    const had=new Set(C.bag.items.map(i=>i.id));
    for(let k=0;k<2;k++) await test(C,"give",{code:CORE_ITEM,stars:3,set:"tien_co"});
    const cmat=C.bag.items.filter(i=>!had.has(i.id)).map(i=>i.id), cuLv=coreEnhanceLevel(2*coreFeedXp({set:"tien_co",stars:3},"tien_co"));
    { const n=C.bagMsgs??0; C.room.send("enhancecore",{targetId:tcs[0].id,materialIds:cmat}); await waitFor(()=>(C.bagMsgs??0)>n&&C.bag.items.find(i=>i.id===tcs[0].id)?.enhance===cuLv,2000); }
    const cu=C.bag.items.find(i=>i.id===tcs[0].id);
    ok(cmat.length===2&&cu?.enhance===cuLv&&cuLv===3&&cu.stats.subs.length===CORE_SUBS[2]+1&&cu.vohon===C.owned.active&&!C.bag.items.some(i=>cmat.includes(i.id)),
      `C nâng cấp hồn hạch Tiên Cơ đang gắn lên +${cu?.enhance} trong làng (${cu?.stats.subs.length} dòng phụ), 2 nguyên liệu đã mất`);
    C.coreUp=cu&&[cu.id,cu.enhance,sj(cu.stats)]; }
  // 4.2: hồn cốt vừa gắn (chưa lưu) cũng nằm trong transaction đi cổng; bagKey so cả võ hồn đang gắn.
  const cb=bonesOf(C).find(i=>i.years===32000&&i.vohon===null);
  C.room.send("equip",{itemId:cb.id,vohonId:C.owned.active});
  ok(await waitFor(()=>bonesOf(C).find(i=>i.id===cb.id)?.vohon===C.owned.active),"C gắn hồn cốt Tay phải vào võ hồn ra trận (trong làng, ngoài giao chiến)");
  // 4.4: cường hóa ngay trong làng (vùng an toàn, ngoài giao chiến) rồi đi cổng: cấp và điểm cường hóa chưa lưu cũng nằm trong
  // transaction đi cổng, nguyên liệu không quay lại.
  for(const y of [10000,10000]) await test(C,"give",{code:BONE_ITEM,years:y,beast:"am_kim_khung_trao_hung",slot:"tay_phai"});
  const cm=bonesOf(C).filter(i=>i.vohon===null&&i.years===10000).map(i=>i.id), cLv=boneEnhanceLevel(2*boneFeedXp({slot:"tay_phai",years:10000},"tay_phai"));
  const cFee=enhanceFee(BONE_ENHANCE_FEE,0,cLv); await test(C,"coin",{n:cFee+50}); await waitFor(()=>C.bag.honTe===cFee+50,1500); // #281: phí từ +6
  { const n=C.bagMsgs??0; C.room.send("enhance",{targetId:cb.id,materialIds:cm}); await waitFor(()=>(C.bagMsgs??0)>n&&bonesOf(C).find(i=>i.id===cb.id)?.enhance===cLv,2000); }
  ok(bonesOf(C).find(i=>i.id===cb.id)?.enhance===cLv&&!bonesOf(C).some(i=>cm.includes(i.id))&&cFee>0&&await waitFor(()=>C.bag.honTe===50,1500),
    `C cường hóa hồn cốt đang gắn lên +${cLv} trong làng, 2 nguyên liệu đã mất, phí ${formatHonTe(cFee)}`);
  C.boneEq={id:cb.id,vohon:C.owned.active,atk:boneStats("tay_phai",32000,cLv).atk};
  await test(C,"give",{code:"hoi_hon_dan",qty:BAG_SLOTS*st});
  const cLoose=()=>C.bag.items.filter(i=>i.vohon===null).length;
  ok(cLoose()===BAG_SLOTS&&await lastLog(C,/Túi đồ đã đầy/),`túi đầy ${cLoose()}/${BAG_SLOTS} ô (hồn cốt đang gắn không chiếm ô): phần dư không nhận`);
  const n1=qtyOf(C,"hoi_huyet_dan"); await test(C,"give",{code:"hoi_huyet_dan",qty:1});
  ok(qtyOf(C,"hoi_huyet_dan")===n1+1,"túi đầy vẫn gộp vào ô cùng loại chưa đầy");
  await test(C,"coin",{n:1234567});
  await test(C,"rest",{s:DAN_CD}); await test(C,"hurt",{pct:50});
  const q=qtyOf(C,"hoi_huyet_dan"); await useItem(C,C.bag.items.find(i=>i.code==="hoi_huyet_dan").id);
  ok(qtyOf(C,"hoi_huyet_dan")===q-1,"C dùng một Hồi Huyết Đan ngay trước khi đi cổng");
}
await travelBy("Đi Nặc Đinh Thành","nac_dinh_thanh");
if(benchXp){ await waitFor(()=>C.owned); const v=C.owned?.list.find(v=>v.rowId===benchXp[0]);
  ok(v?.xp===benchXp[1],`đi cổng lưu cả kinh nghiệm võ hồn dự bị: ${v?.xp} (trước khi đi ${benchXp[1]})`); }
{ const a=objOf("nac_dinh_thanh","arrive","tu_thanh_hon_thon"); ok(Math.hypot(me().x-a.x,me().y-a.y)<1,`xuất hiện ở điểm tu_thanh_hon_thon: ${me().x},${me().y}`); }
ok(!C.portal?.name,"điểm xuất hiện nằm ngoài cổng");
ok(C.room.state.beasts.size===0,"Nặc Đinh Thành không có hồn thú");
C.room.send("attack"); ok(await lastLog(C,/Vùng an toàn/),"trong thành không đánh được");
// Nặc Đinh Thành: theo đại lộ sang cổng đông đi Tinh Đấu Ngoại vi (chặn mềm: cảnh báo khi dưới cấp đề xuất nhưng vẫn đi được).
ok(!MAPS.tinh_dau&&MAPS[MAP_MOVED.tinh_dau]&&MAPS.tinh_dau_noi_dia,"MAPS bỏ tinh_dau, có Ngoại vi và Nội địa");
ok(await walk(1,0,()=>C.portal?.name,30000),`tới cổng đông: ${JSON.stringify(C.portal)}`);
const lvC=me().level;
ok(C.portal?.to==="tinh_dau_ngoai_vi"&&JSON.stringify(C.portal.level)==="[10,30]"&&C.portal.warn===(lvC<10),`cổng đi Ngoại vi: cấp đề xuất 10–30, cấp ${lvC} -> cảnh báo ${C.portal?.warn}`);
await travelBy("Đi Tinh Đấu Ngoại vi","tinh_dau_ngoai_vi");
// Điểm xuất hiện đọc từ file Tiled đang dùng (bản ×8 hoặc bản cũ khi MAP_V1, 11.3 / 11.5).
const arriveOf=(m,n)=>objOf(m,"arrive",n);
const nvW=arriveOf("tinh_dau_ngoai_vi","tu_nac_dinh_thanh"), nvE=arriveOf("tinh_dau_ngoai_vi","tu_tinh_dau_noi_dia"), ndW=arriveOf("tinh_dau_noi_dia","tu_tinh_dau_ngoai_vi");
ok(Math.hypot(me().x-nvW.x,me().y-nvW.y)<1,`xuất hiện ở trại cổng Ngoại vi: ${me().x},${me().y}`);
checkGateClear(C,checkBeastYears(C)); // vùng Ngoại vi theo bảng 5.3: 300–700 … 1.400–2.000 năm
if((await test(C,"ping"))?.enabled){
  // BĐ3: Ngoại vi -> Nội địa (cổng mép đông, đề xuất 30–60) -> về Ngoại vi. Đi bộ xuyên rừng cấp thấp thì gục: nhảy tới trạm gác
  // phía đông (hook goto), dọn hồn thú quanh mình rồi mới bước vào cổng.
  await test(C,"goto",{x:nvE.x,y:nvE.y}); await test(C,"clear");
  ok(await walk(1,0,()=>C.portal?.name,4000),`tới cổng đông Ngoại vi: ${JSON.stringify(C.portal)}`);
  ok(C.portal?.to==="tinh_dau_noi_dia"&&C.portal.toName===MAPS.tinh_dau_noi_dia.name&&JSON.stringify(C.portal.level)==="[30,60]"&&C.portal.warn===(me().level<30),
    `cổng vào Nội địa: cấp đề xuất 30–60, cấp ${me().level} -> cảnh báo ${C.portal?.warn}`);
  await travelBy("Vào Tinh Đấu Nội địa","tinh_dau_noi_dia");
  ok(Math.hypot(me().x-ndW.x,me().y-ndW.y)<1,`xuất hiện ở trại cổng Nội địa: ${me().x},${me().y}`);
  checkGateClear(C,checkBeastYears(C)); // vùng Nội địa: 1.500–5.000 … 15.000–25.000 năm
  ok(!JSON.parse(readFileSync(mapUrl("tinh_dau_noi_dia"),"utf8")).layers.flatMap(l=>l.objects??[]).some(o=>o.type==="portal"&&!MAPS[(o.properties??[]).find(q=>q.name==="to")?.value]),
    "Nội địa chưa có cổng tới bản đồ chưa mở (Lõi Tinh Đấu để BĐ6)");
  await test(C,"clear");
  ok(await walk(-1,0,()=>C.portal?.name,4000),`tới cổng về Ngoại vi: ${JSON.stringify(C.portal)}`);
  ok(C.portal?.to==="tinh_dau_ngoai_vi"&&JSON.stringify(C.portal.level)==="[10,30]"&&C.portal.warn===(me().level<10),`cổng về Ngoại vi: đề xuất 10–30, cảnh báo ${C.portal?.warn}`);
  await travelBy("Về Tinh Đấu Ngoại vi","tinh_dau_ngoai_vi");
  ok(Math.hypot(me().x-nvE.x,me().y-nvE.y)<1&&!C.portal?.name,`về Ngoại vi: xuất hiện ở trạm gác phía đông ${me().x},${me().y}, ngoài cổng`);
  await test(C,"goto",{x:nvW.x,y:nvW.y});
} else needHookSkip("bỏ qua Ngoại vi -> Nội địa (cần hook goto): bật server bằng GAME_TEST=1");
// Thoát và vào lại: đúng bản đồ, đúng vị trí đã lưu khi rời phòng.
await walk(1,0,()=>me().x>nvW.x+40,3000); const pos=[me().x,me().y];
await C.room.leave(); await sleep(400);
const m2=await post("/api/me",{token:C.token}); ok(m2.mapId==="tinh_dau_ngoai_vi",`thoát rồi /api/me: ${m2.mapId}`);
const bag2=bagKey(C); C.mapId=m2.mapId; await enter(C); await waitFor(()=>me()&&C.bag);
ok(bagKey(C)===bag2,`thoát rồi vào lại: túi đồ giữ nguyên (${C.bag?.items.length} ô)`);
ok(C.room.state.mapId==="tinh_dau_ngoai_vi"&&Math.abs(me().x-pos[0])<1&&Math.abs(me().y-pos[1])<1,`vào lại đúng vị trí ${me().x.toFixed(1)},${me().y.toFixed(1)} (đã lưu ${pos.map(v=>v.toFixed(1))})`);
// Đăng nhập lần nữa: phiên cũ bị đá (presence), phiên mới vào đúng bản đồ.
// Tiến độ chưa lưu của phiên cũ (đặt qua hook test) phải còn: phiên mới chỉ nạp DB sau khi phiên cũ lưu xong lần cuối (mục 6).
const relog=(await test(C,"ping"))?.enabled?C.owned.team.filter(Boolean).map((rowId,i)=>[rowId,1234+i]):null;
if(relog) for(const [rowId,xp] of relog) await test(C,"set",{rowId,xp});
// Túi đồ và Hồn Tệ chưa lưu của phiên cũ cũng phải còn (loadBag của phiên mới chạy sau lần lưu túi đồ của phiên cũ).
let relogBag=null;
if(relog){ await test(C,"coin",{n:(C.bag?.honTe??0)+4321}); await test(C,"give",{code:"hoi_huyet_dan",qty:1}); relogBag=bagKey(C); }
let kicked=0; C.room.onLeave(code=>{kicked=code;});
const l2=await post("/api/login",{name:C.name,password:PASS}); ok(l2.mapId==="tinh_dau_ngoai_vi","đăng nhập lại: /api/login trả tinh_dau_ngoai_vi");
const C2={name:C.name,token:l2.token,logs:[],mapId:l2.mapId}; await enter(C2);
ok(await waitFor(()=>kicked===4001),"phiên cũ bị đá khi tài khoản vào lại");
if(relog){ await waitFor(()=>C2.owned); const got=relog.map(([r])=>C2.owned?.list.find(v=>v.rowId===r)?.xp);
  ok(same(got,relog.map(([,xp])=>xp)),`đăng nhập lại: phiên mới nạp tiến độ phiên cũ vừa lưu lúc bị đá (kinh nghiệm ${got.join("/")})`);
  await waitFor(()=>C2.bag);
  ok(bagKey(C2)===relogBag,`đăng nhập lại: phiên mới nạp túi đồ, Hồn Tệ phiên cũ vừa lưu lúc bị đá (${formatHonTe(C2.bag?.honTe??0)}, ${C2.bag?.items.length} ô)`);
  if(C.coreKeep){ const it=C2.bag.items.find(i=>i.id===C.coreKeep[0]);
    ok(it&&same([it.id,it.stars,JSON.stringify(it.stats)],C.coreKeep),`đi cổng, thoát vào lại, đăng nhập lại: ${it&&coreName(it.stats?.set,it.stars)} còn nguyên chỉ số`); }
  if(C.coreUp){ const it=C2.bag.items.find(i=>i.id===C.coreUp[0]); // 5.3
    ok(it&&same([it.id,it.enhance,sj(it.stats)],C.coreUp),`đi cổng, thoát vào lại, đăng nhập lại: ${it&&coreName(it.stats?.set,it.stars,it.enhance)} còn nguyên cấp, điểm và ${it?.stats?.subs?.length} dòng phụ`); }
  if(C.coreEq){ // 5.2: qua 5 lần đi cổng, thoát vào lại, đăng nhập lại: hồn hạch vẫn gắn đúng ô, bộ Tiên Cơ 2 món vẫn có
    const sv=await test(C2,"stats",{rowId:C.coreEq.vohon});
    ok(sj(sv.slots)===sj(C.coreEq.slots)&&sv.sets.tien_co===2&&same(sv.fx,{energy:0.2}),`đi cổng, thoát vào lại, đăng nhập lại: 2 hồn hạch Tiên Cơ vẫn gắn ô ${Object.values(sv.slots).map(s=>s+1).join(", ")}`);
  }
  if(C.boneEq){ // 4.2: qua 5 lần đi cổng, thoát vào lại, đăng nhập lại: hồn cốt vẫn gắn, chỉ số vẫn cộng
    const sv=await test(C2,"stats",{rowId:C.boneEq.vohon});
    ok(C2.bag.items.find(i=>i.id===C.boneEq.id)?.vohon===C.boneEq.vohon&&sv.bones.atk===C.boneEq.atk,
      `đi cổng, thoát vào lại, đăng nhập lại: hồn cốt vẫn gắn, cường hóa +${C2.bag.items.find(i=>i.id===C.boneEq.id)?.enhance}, công +${sv.bones.atk}`);
  } }
C=C2;
await waitFor(()=>me());
// Đường về: cổng ở mép tây doanh trại -> Nặc Đinh Thành (cổng đông).
ok(await walk(-1,0,()=>C.portal?.name,6000)&&C.portal.to==="nac_dinh_thanh",`tới cổng về Nặc Đinh Thành: ${C.portal?.name}`);
// Hồn kỹ 3 bắn lúc đang niệm: đạn bay tới hồn thú sau khi transaction đi cổng đã chụp dữ liệu thì bị bỏ, không hạ được
// (nếu hạ được thì kills/kinh nghiệm cộng sau lúc lưu và mất hẳn). Cần hook test.
let shot=null;
if((await test(C,"ping"))?.enabled){
  await test(C,"set",{rowId:C.owned.active,level:30,xp:0,rings:[1,1,1]});
  await test(C,"clear"); // đạn chỉ có thể trúng hồn thú thử bên dưới
  const ids=new Set(C.room.state.beasts.keys());
  // Đạn bay 170 px/s từ (x, y-8): hồn thú cách 90 px về phía đông, trúng sau ~0,53 giây.
  const nb=await test(C,"beast",{dx:90,dy:TIERS[0].size/2-8}); // hook trả id; server cũ: con mới đầu tiên
  const fresh=()=>nb?.bid?(C.room.state.beasts.has(nb.bid)&&nb.bid):[...C.room.state.beasts.keys()].find(k=>!ids.has(k));
  ok(await waitFor(fresh),"hook test đặt hồn thú 1 máu cạnh cổng");
  shot={bid:fresh(),kills:me().kills};
}
await travelBy("Về Nặc Đinh Thành","nac_dinh_thanh",
  shot&&(async()=>{ await sleep(TRAVEL_CAST*1000-200); C.room.send("skill",{i:2}); await sleep(150); }),
  shot&&(async()=>{
    ok(me().cds[2]>0,"hồn kỹ 3 đã bắn trong lúc niệm cổng");
    await sleep(800);
    ok(C.room.state.beasts.has(shot.bid)&&me().kills===shot.kills&&!C.logs.some(t=>/^Hạ /.test(t)),
      "đạn hồn kỹ bắn lúc niệm không hạ hồn thú sau khi đã lưu để đi cổng");
  }));
{ const a=objOf("nac_dinh_thanh","arrive","tu_tinh_dau_ngoai_vi"); ok(Math.hypot(me().x-a.x,me().y-a.y)<1,`xuất hiện ở cổng đông Nặc Đinh Thành: ${me().x},${me().y}`); }
await npcTown();
await thienDauTest();
await lacNhatTest();
await haiThanTest();
await loiTinhDauTest();
// BĐ3: tài khoản cũ còn map_id `tinh_dau` (bản đồ đã tách) -> vào Ngoại vi ở trại cổng, bỏ vị trí cũ. Hook legacy ghi mã cũ
// qua đúng transaction đi cổng, như tài khoản đăng xuất ở Tinh Đấu trước BĐ3.
if((await test(C,"ping"))?.enabled){
  const lg=await test(C,"legacy",{mapId:"tinh_dau",x:700,y:480});
  ok(lg?.saved,`ghi map_id cũ tinh_dau (vị trí 700,480): ${JSON.stringify(lg)}`);
  await C.room.leave(); await sleep(300);
  const ml=await post("/api/me",{token:C.token}), ll=await post("/api/login",{name:C.name,password:PASS});
  ok(ml.mapId==="tinh_dau_ngoai_vi"&&ll.mapId==="tinh_dau_ngoai_vi",`tài khoản ở tinh_dau: /api/me và /api/login trả ${ml.mapId} / ${ll.mapId}`);
  C.token=ll.token; C.mapId=ml.mapId; await enter(C); await waitFor(()=>me());
  const sp=JSON.parse(readFileSync(mapUrl("tinh_dau_ngoai_vi"),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="spawn");
  ok(C.room.state.mapId==="tinh_dau_ngoai_vi"&&me().x>=sp.x&&me().x<=sp.x+sp.width&&me().y>=sp.y&&me().y<=sp.y+sp.height,
    `vào Ngoại vi ở ${sp.name} (${me().x.toFixed(0)},${me().y.toFixed(0)}), không giữ vị trí cũ 700,480`);
  // Lớp chặn WHERE map_id theo bản đồ đã ánh xạ: rời phòng Ngoại vi thì ghi được vị trí mới.
  const np=[nvW.x+32,nvW.y]; // bản cũ: ô (7,31) cạnh điểm xuất hiện
  await test(C,"goto",{x:np[0],y:np[1]}); await C.room.leave(); await sleep(300);
  C.mapId=(await post("/api/me",{token:C.token})).mapId; await enter(C); await waitFor(()=>me());
  ok(Math.abs(me().x-np[0])<1&&Math.abs(me().y-np[1])<1,`rời rồi vào lại: vị trí mới ở Ngoại vi đã lưu (${me().x},${me().y})`);
}
if((await test(C,"ping"))?.enabled) await partyTest(C,ctx);
await C.room.leave();
timing.push(`botC ${Math.round((Date.now()-tC)/1000)}`);
}


/**
 * 6.1 ở Nặc Đinh Thành: bảng giá (hàm thuần), mọi NPC của NPCS đặt đúng một chỗ trong Tiled, đứng xa bị từ chối; với hook: thương
 * nhân (mua đủ / thiếu Hồn Tệ, số lượng sai, túi đầy kể cả chỉ vừa một phần, bán hồn hoàn / hồn cốt / hồn hạch / mảnh đúng giá, không
 * bán đan / đồ đang gắn / id lạ, đứng xa), lò rèn (mở hộp thoại, cường hóa hồn cốt), Đại Sư, Đại Đấu Hồn Trường; vào lại còn nguyên.
 */
async function npcTown(){
  console.log("[6.1] NPC ở Nặc Đinh Thành: thương nhân, lò rèn, Đại Sư");
  const all=["thanh_hon_thon","nac_dinh_thanh",AT,"hai_than_dao"].flatMap(m=>JSON.parse(readFileSync(mapUrl(m),"utf8"))
    .layers.flatMap(l=>l.objects??[]).filter(o=>o.type==="npc").map(o=>(o.properties??[]).find(q=>q.name==="npc")?.value));
  ok(all.every(id=>npcDef(id))&&NPCS.every(n=>all.filter(x=>x===n.id).length===(n.id===CAMP_MERCHANT?0:1)),`mỗi NPC trong NPCS (trừ thương nhân lưu động, campTest) đặt đúng một chỗ ở Thánh Hồn Thôn / Nặc Đinh Thành / Thiên Đấu Thành / Hải Thần Đảo (#284): ${all.join(", ")}`);
  ok(NPCS.every(n=>n.lines.length&&n.lines.every(t=>t.length>10)),"NPC nào cũng có lời thoại");
  // Bảng giá mua lại (chờ chốt): đúng mốc, tăng theo niên hạn / sao; hồn cốt gấp BONE_SELL lần, mỗi cấp cường hóa +10%; không mua đan, rương.
  ok(RING_SELL.every(([y,v])=>ringSellPrice(y)===v)&&[10,50,100,437,1000,5000,10000,50000,100000].every((y,i,a)=>!i||ringSellPrice(y)>=ringSellPrice(a[i-1])),
    `giá hồn hoàn: ${[10,100,437,1000,10000,100000].map(y=>`${y} năm ${ringSellPrice(y)}`).join(", ")} đồng`);
  const ring=y=>({code:RING_ITEM,years:y,stars:null,enhance:0});
  ok(sellPrice({code:BONE_ITEM,years:10000,stars:null,enhance:0})===Math.round(ringSellPrice(10000)*BONE_SELL)
    &&sellPrice({code:BONE_ITEM,years:10000,stars:null,enhance:5})===Math.round(ringSellPrice(10000)*BONE_SELL*(1+5*BONE_SELL_ENH)),"giá hồn cốt theo niên hạn và cấp cường hóa");
  ok(CORE_SELL.every((v,i)=>sellPrice({code:CORE_ITEM,years:null,stars:i+1,enhance:0})===v),`giá hồn hạch 1★…6★: ${CORE_SELL.join(" / ")} đồng`);
  ok(sellPrice({code:shardCode("hao_thien_chuy"),years:null,stars:null,enhance:0})===SHARD_SELL.UR&&sellPrice({code:shardCode("lam_ngan_thao"),years:null,stars:null,enhance:0})===SHARD_SELL[VOHON[vohonIndex("lam_ngan_thao")].rarity],
    "giá mảnh võ hồn theo độ hiếm");
  ok(sellPrice({code:"hoi_huyet_dan",years:null,stars:null,enhance:0})===null&&sellPrice({code:chestCode(BOSSES.find(b=>b.rank===2).id),years:null,stars:null,enhance:0})===null&&sellPrice({code:"khong_co",years:null,stars:null,enhance:0})===null&&sellPrice(ring(437))>0,
    "thương nhân không mua đan, rương, đồ lạ");
  ok(SHOP.every(r=>["dan","phu","lenh"].includes(itemDef(r.code)?.kind)&&r.price>0)&&SHOP.some(r=>r.code==="hoi_huyet_dan")&&SHOP.some(r=>r.code==="hoi_hon_dan"),`thương nhân bán ${SHOP.map(r=>`${itemDef(r.code).name} ${formatHonTe(r.price)}`).join(", ")}`);
  const tn=npcSpot("nac_dinh_thanh","thuong_nhan"), lr=npcSpot("nac_dinh_thanh","lo_ren"), ds=npcSpot("nac_dinh_thanh","dai_su"), sg=npcSpot("nac_dinh_thanh","su_gia_dau_hon");
  ok(Math.hypot(tn.x-me().x,tn.y-me().y)>NPC_RANGE&&await talk(C,"thuong_nhan")===null&&/lại gần Thương nhân/.test(C.logs.at(-1)),"đứng ở cổng đông: thương nhân chưa nói chuyện");
  const bk0=bagKey(C);
  ok(/đứng cạnh thương nhân/.test(await trade(C,"buy",{code:"hoi_huyet_dan",qty:1}))&&bagKey(C)===bk0,"đứng xa thương nhân: mua bị từ chối, túi và Hồn Tệ không đổi");
  ok(/đứng cạnh thương nhân/.test(await trade(C,"sell",{id:looseOf(C)[0]?.id}))&&bagKey(C)===bk0,"đứng xa thương nhân: bán bị từ chối");
  ok(await talk(C,"to_van_dao")===null&&/Không có NPC này/.test(C.logs.at(-1)),"Tố Vân Đào không ở Nặc Đinh Thành: bị từ chối");
  if(!(await test(C,"ping"))?.enabled){ needHookSkip("bỏ qua mua / bán / lò rèn (cần hook goto, give, coin): bật server bằng GAME_TEST=1"); return; }
  await test(C,"goto",{x:tn.x,y:tn.y+16});
  ok(await talk(C,"thuong_nhan")==="thuong_nhan","đứng cạnh thương nhân: mở hộp thoại cửa hàng");
  // Dọn túi về trạng thái biết trước (hồn cốt đang gắn không nằm trong ô túi nên vẫn giữ).
  for(const it of looseOf(C)) C.room.send("discard",{id:it.id});
  ok(await waitFor(()=>looseOf(C).length===0,3000),`dọn túi: ${looseOf(C).length} ô`);
  const [hh,hn]=["hoi_huyet_dan","hoi_hon_dan"].map(c=>SHOP.find(r=>r.code===c)), stack=itemDef(hh.code).stack;
  await test(C,"coin",{n:0});
  let t=await trade(C,"buy",{code:hh.code,qty:1});
  ok(/Không đủ Hồn Tệ/.test(t)&&C.bag.honTe===0&&looseOf(C).length===0,`0 đồng: mua 1 Hồi Huyết Đan bị từ chối (${t})`);
  await test(C,"coin",{n:hh.price*3+hn.price-1});
  t=await trade(C,"buy",{code:hh.code,qty:3});
  ok(qtyOf(C,hh.code)===3&&C.bag.honTe===hn.price-1&&/Mua 3 Hồi Huyết Đan/.test(t),`đủ tiền: mua 3 Hồi Huyết Đan, trừ ${formatHonTe(hh.price*3)}, còn ${formatHonTe(C.bag.honTe)} (${t})`);
  t=await trade(C,"buy",{code:hn.code,qty:1});
  ok(/Không đủ Hồn Tệ/.test(t)&&qtyOf(C,hn.code)===0&&C.bag.honTe===hn.price-1,`thiếu đúng 1 đồng: không mua được Hồi Hồn Đan, không mất tiền (${t})`);
  await test(C,"coin",{n:1e9});
  for(const [m,why] of [[{code:hh.code,qty:0},"0 món"],[{code:hh.code,qty:SHOP_MAX_QTY+1},`${SHOP_MAX_QTY+1} món`],[{code:hh.code,qty:1.5},"1,5 món"],[{code:hh.code,qty:"2"},"số dạng chữ"],
    [{code:RING_ITEM,qty:1},"hồn hoàn (không bán)"],[{code:"khong_co",qty:1},"mã lạ"],[{qty:1},"thiếu mã"]]){
    const bk=bagKey(C); t=await trade(C,"buy",m); ok(bagKey(C)===bk&&/Mỗi lần mua|không bán món này/.test(t),`mua ${why}: bị từ chối (${t})`);
  }
  // Túi đầy: 39 ô Hồi Hồn Đan + ô Hồi Huyết Đan còn chỗ cho stack − 3 viên. Mua vừa đúng chỗ còn lại thì được, hơn 1 viên thì từ chối hết.
  await test(C,"give",{code:hn.code,qty:BAG_SLOTS*stack});
  ok(looseOf(C).length===BAG_SLOTS,`túi đầy ${looseOf(C).length}/${BAG_SLOTS} ô`);
  let ht=C.bag.honTe; t=await trade(C,"buy",{code:hh.code,qty:stack-3+1});
  ok(/không đủ chỗ/.test(t)&&qtyOf(C,hh.code)===3&&C.bag.honTe===ht,`túi đầy, mua ${stack-2} viên (chỉ còn chỗ ${stack-3}): từ chối hết, không mất tiền (${t})`);
  t=await trade(C,"buy",{code:hh.code,qty:stack-3});
  ok(qtyOf(C,hh.code)===stack&&C.bag.honTe===ht-hh.price*(stack-3)&&looseOf(C).length===BAG_SLOTS,`túi đầy vẫn mua vừa ô Hồi Huyết Đan chưa đầy: ${stack-3} viên (${t})`);
  t=await trade(C,"buy",{code:hh.code,qty:1}); ok(/không đủ chỗ/.test(t)&&qtyOf(C,hh.code)===stack,`túi đầy hẳn: không mua được nữa (${t})`);
  // Bán đồ dư: bỏ 5 ô Hồi Hồn Đan lấy chỗ, nhận hồn hoàn / hồn cốt / hồn hạch / mảnh (hook give), bán từng món đúng giá.
  for(const it of looseOf(C).filter(i=>i.code===hn.code).slice(0,5)) C.room.send("discard",{id:it.id});
  ok(await waitFor(()=>looseOf(C).length===BAG_SLOTS-5,2000),"bỏ 5 ô Hồi Hồn Đan để có chỗ");
  await test(C,"give",{code:RING_ITEM,years:1760}); await test(C,"give",{code:BONE_ITEM,years:12000,beast:"thiet_giap_te_nguu",slot:"than"});
  await test(C,"give",{code:CORE_ITEM,stars:4,set:"hao_thien"}); await test(C,"give",{code:shardCode("hao_thien_chuy"),qty:5});
  const rg=looseOf(C).find(i=>i.code===RING_ITEM&&i.years===1760), bn=looseOf(C).find(i=>i.code===BONE_ITEM&&i.years===12000), cr=looseOf(C).find(i=>i.code===CORE_ITEM&&i.stars===4), sh=looseOf(C).find(i=>i.code===shardCode("hao_thien_chuy"));
  ok(rg&&bn&&cr&&sh?.qty===5,"có hồn hoàn 1.760 năm, hồn cốt Thân 12.000 năm, hồn hạch 4★, 5 mảnh Hạo Thiên Chùy");
  for(const [it,qty,name] of [[rg,undefined,"hồn hoàn 1.760 năm"],[bn,undefined,"hồn cốt 12.000 năm"],[cr,undefined,"hồn hạch 4★"],[sh,2,"2 mảnh Hạo Thiên Chùy"]]){
    ht=C.bag.honTe; const price=sellPrice(it)*(qty??1);
    t=await trade(C,"sell",qty?{id:it.id,qty}:{id:it.id});
    const left=C.bag.items.find(i=>i.id===it.id);
    ok(C.bag.honTe===ht+price&&(qty?left?.qty===it.qty-qty:!left)&&/^Bán /.test(t),`bán ${name}: +${formatHonTe(price)}${qty?`, còn ${left?.qty} mảnh`:""} (${t})`);
  }
  for(const [m,re,why] of [[{id:sh.id,qty:4},/Số lượng bán/,"4 mảnh khi chỉ còn 3"],[{id:sh.id,qty:0},/Số lượng bán/,"0 món"],[{id:looseOf(C).find(i=>i.code===hh.code).id},/không mua/,"Hồi Huyết Đan"],
    [{id:"khong-co"},/Không có vật phẩm/,"id lạ"],[{id:7},/Không có vật phẩm/,"id dạng số"]]){
    const bk=bagKey(C); t=await trade(C,"sell",m); ok(bagKey(C)===bk&&re.test(t),`bán ${why}: bị từ chối (${t})`);
  }
  const worn=(C.bag?.items??[]).find(i=>i.vohon!==null);
  if(worn){ const bk=bagKey(C); t=await trade(C,"sell",{id:worn.id}); ok(bagKey(C)===bk&&/đang gắn trên võ hồn/.test(t),`hồn cốt đang gắn không bán được (${t})`); }
  else ok(false,"C còn hồn cốt đang gắn để thử bán");
  // Bấm dồn dập: 3 lần bán liền (mỗi lần 1 mảnh) đều được tính, lưu chỉ xếp một lần trong chuỗi lưu.
  ht=C.bag.honTe; for(let k=0;k<3;k++) C.room.send("sell",{id:sh.id,qty:1});
  ok(await waitFor(()=>!C.bag.items.some(i=>i.id===sh.id)&&C.bag.honTe===ht+3*sellPrice(sh),2000),`bán liền 3 lần: hết mảnh, +${formatHonTe(3*sellPrice(sh))}`);
  // Đứng xa thương nhân (sang quảng trường) thì bán bị từ chối.
  { const sq=objOf("nac_dinh_thanh","spawn"); await test(C,"goto",{x:sq.x+sq.width/2,y:sq.y+sq.height/2}); }
  { const it=looseOf(C)[0], bk=bagKey(C); t=await trade(C,"sell",{id:it.id}); ok(bagKey(C)===bk&&/đứng cạnh thương nhân/.test(t),`đi ra quảng trường: bán bị từ chối (${t})`); }
  // Lò rèn: mở hộp thoại, cường hóa hồn cốt trong túi bằng 2 hồn cốt dư (message enhance của 4.4).
  await test(C,"goto",{x:lr.x,y:lr.y+16});
  ok(await talk(C,"lo_ren")==="lo_ren","đứng cạnh Thợ rèn: mở hộp thoại lò rèn");
  for(const it of looseOf(C).filter(i=>i.code===hn.code).slice(0,3)) C.room.send("discard",{id:it.id});
  await waitFor(()=>looseOf(C).filter(i=>i.code===hn.code).length<=BAG_SLOTS-9,2000);
  for(let k=0;k<3;k++) await test(C,"give",{code:BONE_ITEM,years:1000,beast:"am_kim_khung_trao_hung",slot:"tay_trai"});
  const [tg,...mats]=looseOf(C).filter(i=>i.code===BONE_ITEM&&i.years===1000).map(i=>i.id), lv=boneEnhanceLevel(2*boneFeedXp({slot:"tay_trai",years:1000},"tay_trai"));
  { const n=C.bagMsgs??0; C.enh=null; C.room.send("enhance",{targetId:tg,materialIds:mats}); await waitFor(()=>(C.bagMsgs??0)>n&&C.enh,2000); }
  ok(C.enh?.to===lv&&C.bag.items.find(i=>i.id===tg)?.enhance===lv&&!mats.some(id=>C.bag.items.some(i=>i.id===id)),`lò rèn: cường hóa hồn cốt Tay trái 1.000 năm lên +${lv}, 2 nguyên liệu đã mất`);
  // 5.3: lò rèn cũng nâng cấp hồn hạch (message enhancecore): 1 hồn hạch Lam Ngân 2★ + 2 nguyên liệu 3★ cùng bộ.
  { const had=new Set(C.bag.items.map(i=>i.id));
    await test(C,"give",{code:CORE_ITEM,stars:2,set:"lam_ngan"}); for(let k=0;k<2;k++) await test(C,"give",{code:CORE_ITEM,stars:3,set:"lam_ngan"});
    const fresh=C.bag.items.filter(i=>!had.has(i.id)), ct=fresh.find(i=>i.stars===2), cm=fresh.filter(i=>i.stars===3).map(i=>i.id);
    const cl=coreEnhanceLevel(2*coreFeedXp({set:"lam_ngan",stars:3},"lam_ngan"));
    const n=C.bagMsgs??0; C.coreUp=null; C.room.send("enhancecore",{targetId:ct?.id,materialIds:cm}); await waitFor(()=>(C.bagMsgs??0)>n&&C.coreUp,2000);
    const cu=C.bag.items.find(i=>i.id===ct?.id);
    ok(ct&&cm.length===2&&C.coreUp?.to===cl&&cu?.enhance===cl&&cu.stats.subs.length===CORE_SUBS[1]+1&&!cm.some(id=>C.bag.items.some(i=>i.id===id)),
      `lò rèn: nâng cấp hồn hạch Lam Ngân 2★ lên +${cu?.enhance} (${cu?.stats.subs.length} dòng phụ), 2 nguyên liệu đã mất`); }
  // #283: đổi bộ hồn hạch ở Thợ rèn (message coreset): giữ sao / cấp / chỉ số / dòng phụ, phí theo sao, bị từ chối thì không trừ gì.
  { const had=new Set(C.bag.items.map(i=>i.id)), coin=async n=>{ await test(C,"coin",{n}); return waitFor(()=>C.bag.honTe===n,1500); };
    await test(C,"give",{code:CORE_ITEM,stars:2,set:"lam_ngan"}); await test(C,"give",{code:CORE_ITEM,stars:5,set:"hao_thien"});
    const fresh=C.bag.items.filter(i=>!had.has(i.id)), c2=fresh.find(i=>i.stars===2), c5=fresh.find(i=>i.stars===5), before=JSON.stringify(c2?.stats);
    const set=async(id,to,npc="lo_ren")=>{ const l=C.logs.length, n=C.bagMsgs??0; C.room.send("coreset",{id,set:to,npc}); await waitFor(()=>(C.bagMsgs??0)>n&&C.logs.length>l,1500); return C.logs.at(-1); };
    const cur=id=>C.bag.items.find(i=>i.id===id);
    ok(!!c2&&!!c5,"đổi bộ: có hồn hạch 2★ Lam Ngân và 5★ Hạo Thiên để thử"); await coin(coreResetFee(2)-1);
    let t=await set(c2.id,"hao_thien"); ok(/Không đủ Hồn Tệ/.test(t)&&cur(c2.id).stats.set==="lam_ngan"&&C.bag.honTe===coreResetFee(2)-1,`đổi bộ thiếu Hồn Tệ bị từ chối, không trừ gì: ${t}`);
    await coin(coreResetFee(2)+coreResetFee(5)+7);
    t=await set(c2.id,"lam_ngan"); ok(/đã thuộc/.test(t)&&C.bag.honTe===coreResetFee(2)+coreResetFee(5)+7,`đổi sang đúng bộ hiện tại bị từ chối: ${t}`);
    t=await set(c2.id,"khong_co_bo"); ok(/không hợp lệ/.test(t)&&cur(c2.id).stats.set==="lam_ngan","bộ lạ bị từ chối");
    t=await set("khong-co","hao_thien"); ok(/Không có hồn hạch/.test(t),"món lạ (của người khác) bị từ chối");
    t=await set(c2.id,"hao_thien","dai_su"); ok(/Thợ rèn/.test(t)&&cur(c2.id).stats.set==="lam_ngan","NPC không phải Thợ rèn bị từ chối");
    await test(C,"goto",{x:ds.x,y:ds.y+16}); t=await set(c2.id,"hao_thien"); ok(/lại gần Thợ rèn/.test(t)&&cur(c2.id).stats.set==="lam_ngan","đứng xa Thợ rèn: bị từ chối");
    await test(C,"goto",{x:lr.x,y:lr.y+16});
    t=await set(c2.id,"hao_thien"); const u=cur(c2.id), o=JSON.parse(before);
    ok(u.stats.set==="hao_thien"&&u.stars===2&&u.stats.main===o.main&&JSON.stringify(u.stats.subs)===JSON.stringify(o.subs)&&C.bag.honTe===coreResetFee(5)+7,`đổi bộ 2★ Lam Ngân → Hạo Thiên: phí ${coreResetFee(2)} đồng, giữ sao / chỉ số chính / dòng phụ (${t})`);
    await waitFor(()=>C.owned,2000); const vid=C.owned?.active;
    C.room.send("equipcore",{itemId:c5.id,vohonId:vid}); await waitFor(()=>cur(c5.id)?.vohon===vid,2000);
    t=await set(c5.id,"lam_ngan"); ok(cur(c5.id).stats.set==="lam_ngan"&&cur(c5.id).vohon===vid&&cur(c5.id).stars===5&&C.bag.honTe===7,`đổi bộ món đang gắn (5★, ${coreResetFee(5)} đồng): vẫn gắn, đã sang Lam Ngân (${t})`);
    globalThis.__coreSetIds=[c2.id,c5.id]; }
  // Đại Sư và sứ giả Đại Đấu Hồn Trường (BĐ6a, chỗ của lối vào tạm 7.2): chỉ có lời thoại (nhiệm vụ ở 6.2); đứng cạnh Thợ rèn thì Đại Sư ở xa.
  ok(await talk(C,"dai_su")===null&&/lại gần Ngọc Tiểu Cương/.test(C.logs.at(-1)),"đứng ở lò rèn: Đại Sư ở xa, chưa nói chuyện");
  await test(C,"goto",{x:ds.x,y:ds.y+16}); ok(await talk(C,"dai_su")==="dai_su","đứng cạnh Ngọc Tiểu Cương (Đại Sư): mở hộp thoại");
  ok(npcDef("dai_su").lines.some(t=>t.includes(formatYears(ringLimit(1)))&&t.includes(formatYears(ringLimit(4)))),"Đại Sư giải thích giới hạn hồn hoàn theo vòng (RING_LIMIT)");
  await test(C,"goto",{x:sg.x,y:sg.y+16}); ok(await talk(C,"su_gia_dau_hon")==="su_gia_dau_hon"&&npcDef("su_gia_dau_hon").role==="talk","sứ giả Đại Đấu Hồn Trường: chỉ đường lên Thiên Đấu Thành");
  ok(await talk(C,"dau_hon_truong")===null&&/Không có NPC này/.test(C.logs.at(-1)),"Đại Đấu Hồn Trường không còn ở Nặc Đinh Thành (BĐ6a)");
  { const l=C.logs.length; C.room.send("arena",{op:"queue"}); await waitFor(()=>C.logs.length>l,1500);
    ok(/lại gần Đại Đấu Hồn Trường/.test(C.logs.at(-1)),`đứng cạnh sứ giả: không xếp hàng đấu hồn được (${C.logs.at(-1)})`); }
  // Vào lại: Hồn Tệ và túi sau mua / bán / cường hóa đã lưu.
  const bk=bagKey(C); await C.room.leave(); await sleep(400);
  await enter(C); await waitFor(()=>me()&&C.bag);
  ok(bagKey(C)===bk,`vào lại: túi và Hồn Tệ sau mua / bán đã lưu (${formatHonTe(C.bag?.honTe??0)}, ${looseOf(C).length} ô)`);
  { const [i2,i5]=globalThis.__coreSetIds, g=id=>C.bag.items.find(i=>i.id===id);
    ok(g(i2)?.stats.set==="hao_thien"&&g(i5)?.stats.set==="lam_ngan"&&g(i5)?.vohon!==null,"vào lại: bộ hồn hạch đã đổi (trong túi và đang gắn) vẫn đúng")
    C.room.send("unequipcore",{itemId:i5}); await waitFor(()=>g(i5)?.vohon===null,2000);
    for(const id of [i2,i5]) C.room.send("discard",{id}); await waitFor(()=>!g(i2)&&!g(i5),2000); } // dọn: bài sau cần túi còn chỗ
}


/**
 * BĐ6a Thiên Đấu Thành: bot C đi bộ qua cổng bắc Nặc Đinh Thành (thành an toàn, không cảnh báo cấp), xuất hiện đúng điểm `arrive`; thành
 * không có hồn thú, không giao chiến; NPC thành (Phất Lan Đức, thương nhân mua được đan, lò rèn, Đại Đấu Hồn Trường) nói chuyện được;
 * không còn biển "sắp mở" (cổng tây Lạc Nhật mở từ BĐ6b, lacNhatTest; cổng bắc Cực Bắc từ BĐ6c, cucBacTest; bến thuyền Hải Thần Đảo từ BĐ6d, haiThanTest); thoát vào lại đúng bản đồ
 * và vị trí; đi bộ về Nặc Đinh Thành, xuất hiện ở cổng bắc.
 */
async function thienDauTest(){
  console.log("[BĐ6a] Thiên Đấu Thành: cổng Nặc Đinh Thành <-> Thiên Đấu Thành, NPC thành, cổng chưa mở");
  const raw=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const objs=raw(AT), portals=objs.filter(o=>o.type==="portal").map(o=>o.name);
  ok(MAPS[AT]?.kind==="town"&&MAPS[AT].level===null&&MAPS[AT].name==="Thiên Đấu Thành","MAPS: Thiên Đấu Thành là thành an toàn (town), không cấp đề xuất");
  // BĐ6b mở cổng tây (Lạc Nhật Sâm Lâm), BĐ6c cổng bắc (Cực Bắc Chi Địa), BĐ6d bến thuyền (Hải Thần Đảo): portal thay biển `cong_lac_nhat` /
  // `cong_cuc_bac` / `ben_thuyen_hai_than`.
  ok(same([...portals].sort(),["Về Nặc Đinh Thành","Đi Lạc Nhật Sâm Lâm","Đi Cực Bắc Chi Địa","Thuyền đi Hải Thần Đảo"].sort()),`Thiên Đấu Thành có cổng về Nặc Đinh Thành, cổng tây đi Lạc Nhật, cổng bắc đi Cực Bắc và bến thuyền đi Hải Thần Đảo: ${portals.join(", ")}`);
  ok(["cong_lac_nhat","cong_cuc_bac","ben_thuyen_hai_than"].every(id=>!npcDef(id)&&!npcSpot(AT,id)),"không còn biển \"sắp mở\" nào (BĐ6b–d)");
  const signs=[];
  if(!(await test(C,"ping"))?.enabled){ needHookSkip("bỏ qua đi Thiên Đấu Thành (cần hook goto, coin): bật server bằng GAME_TEST=1"); return; }
  C.room.send("travel",{portal:"Đi Thiên Đấu Thành"}); ok(await lastLog(C,/đứng trong cổng/),"Nặc Đinh Thành: chưa đứng trong cổng bắc thì không đi được");
  // Đi bộ thật từ điểm xuất hiện của cổng bắc lên cổng.
  const back=raw("nac_dinh_thanh").find(o=>o.type==="arrive"&&o.name==="tu_thien_dau_thanh");
  await test(C,"goto",{x:back.x,y:back.y});
  ok(await walk(0,-1,()=>C.portal?.name,4000)&&C.portal.name==="Đi Thiên Đấu Thành",`tới cổng bắc: ${JSON.stringify(C.portal)}`);
  ok(C.portal?.to===AT&&C.portal.toName==="Thiên Đấu Thành"&&!C.portal.warn&&!C.portal.level,"hộp cổng: đích Thiên Đấu Thành, không cấp đề xuất, không cảnh báo");
  await travelBy("Đi Thiên Đấu Thành",AT);
  const ar=objs.find(o=>o.type==="arrive"&&o.name==="tu_nac_dinh_thanh");
  ok(Math.hypot(me().x-ar.x,me().y-ar.y)<1,`xuất hiện ở cổng nam Thiên Đấu Thành: ${me().x},${me().y}`);
  ok(C.room.state.beasts.size===0,"Thiên Đấu Thành không có hồn thú");
  C.room.send("attack"); ok(await lastLog(C,/Vùng an toàn/),"thành an toàn: không đánh được");
  C.room.send("skill",{i:0}); ok(await lastLog(C,/Vùng an toàn/),"thành an toàn: không dùng hồn kỹ được");
  await sleep(1500); ok(C.room.state.beasts.size===0,"vẫn không sinh hồn thú sau một lúc");
  // NPC thành.
  for(const id of ["phat_lan_duc","thuong_nhan_thien_dau","lo_ren_thien_dau","dau_hon_truong",...signs]){
    const sp=npcSpot(AT,id); await test(C,"goto",{x:sp.x,y:sp.y+16});
    ok(await talk(C,id)===id,`${npcDef(id).name} (${npcDef(id).title}): mở hộp thoại`);
  }
  ok(await talk(C,"thuong_nhan")===null&&/Không có NPC này/.test(C.logs.at(-1)),"Thương nhân Nặc Đinh không ở Thiên Đấu Thành");
  { const sp=npcSpot(AT,"thuong_nhan_thien_dau"); await test(C,"goto",{x:sp.x,y:sp.y+16}); await test(C,"coin",{n:1000});
    const hh=SHOP.find(r=>r.code==="hoi_huyet_dan"), q0=qtyOf(C,hh.code), h0=C.bag.honTe, t=await trade(C,"buy",{code:hh.code,qty:1});
    ok(qtyOf(C,hh.code)===q0+1&&C.bag.honTe===h0-hh.price,`thương nhân Thiên Đấu bán đan cùng giá (${t})`); }
  // Cổng chưa mở: xin đi bị từ chối, đi tiếp ra ngoài bị tường / sông chặn, không hiện hộp cổng.
  for(const [id,dx,dy] of []){ // từ BĐ6d không còn cổng chưa mở (giữ khung để thử cổng mới về sau)
    C.room.send("travel",{portal:npcDef(id).name}); ok(await lastLog(C,/không tồn tại/),`${npcDef(id).name}: không phải cổng`);
    const sp=npcSpot(AT,id); await test(C,"goto",{x:sp.x,y:sp.y+16}); C.portal=null;
    await walk(dx,dy,()=>false,1500); const q=me();
    // tường thành ở cột / hàng 0 (tools/gen-map.mjs)
    ok(q.x>16&&q.y>16&&q.x<(JSON.parse(readFileSync(mapUrl(AT),"utf8")).width-3)*16&&!C.portal?.name&&C.room.state.mapId===AT,`${npcDef(id).name}: đi tiếp bị chặn ở (${q.x.toFixed(0)},${q.y.toFixed(0)}), vẫn ở Thiên Đấu Thành`);
  }
  await cucBacTest();
  // Thoát vào lại: đúng bản đồ, đúng chỗ.
  { const sp=npcSpot(AT,"phat_lan_duc"); await test(C,"goto",{x:sp.x,y:sp.y+16}); await C.room.leave(); await sleep(400);
    const m=await post("/api/me",{token:C.token}); ok(m.mapId===AT,`thoát rồi /api/me: ${m.mapId}`);
    C.mapId=m.mapId; await enter(C); await waitFor(()=>me()&&C.bag);
    ok(C.room.state.mapId===AT&&Math.hypot(me().x-sp.x,me().y-sp.y-16)<1,`vào lại: Thiên Đấu Thành đúng chỗ cũ (${me().x},${me().y})`); }
  // Đi bộ về Nặc Đinh Thành theo đại lộ xuống cổng nam.
  await test(C,"goto",{x:ar.x,y:ar.y});
  ok(await walk(0,1,()=>C.portal?.name,4000)&&C.portal.to==="nac_dinh_thanh"&&!C.portal.warn,`tới cổng nam: ${C.portal?.name}`);
  await travelBy("Về Nặc Đinh Thành","nac_dinh_thanh");
  ok(Math.hypot(me().x-back.x,me().y-back.y)<1,`về Nặc Đinh Thành ở cổng bắc: ${me().x},${me().y}`);
}


/**
 * BĐ6b Lạc Nhật Sâm Lâm: dữ liệu (MAPS, 4 vùng đúng bảng 5.3, loài từ 1.000 năm có chiêu báo trước và kỹ năng hồn cốt, tinh anh mỗi
 * vùng, thú vương và hang ở vùng sâu nhất, rơi đặc trưng, tiên thảo chỉ ở đây và vùng sâu tỉ lệ cao). Với hook: bot L (tài khoản mới,
 * cấp thấp) tới cổng tây Thiên Đấu Thành (hộp cổng có cấp đề xuất 40–70 và cảnh báo đỏ, vẫn đi được), xuất hiện ở trại cổng Lạc Nhật;
 * hồn thú đúng loài / năm theo vùng, không sát cổng; 4 tinh anh có mặt; tiên thảo rơi theo vùng (nông không rơi, sâu rơi với cùng số
 * ngẫu nhiên; tinh anh x HERB_ELITE); mảnh 3 võ hồn và hồn hạch của bản đồ; dùng tiên thảo cho võ hồn dự bị / ra trận tăng đúng %
 * chỉ số, tối đa HERB_MAX cây, từ chối võ hồn lạ; thoát vào lại vẫn giữ; Hút Sinh của Khô Đằng Thụ Vương hồi máu khi trúng người đang
 * bị Trói; thú vương xuất hiện theo lịch (hook king).
 */
async function lacNhatTest(){
  console.log("[BĐ6b] Lạc Nhật Sâm Lâm: cổng tây Thiên Đấu Thành, vùng, tinh anh, thú vương, tiên thảo, rơi đặc trưng");
  const LN="lac_nhat_sam_lam", M=MAPS[LN];
  const objs=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const prop=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  ok(M?.kind==="hunt"&&M.name==="Lạc Nhật Sâm Lâm"&&same(M.level,[40,70])&&same(M.years,[5000,30000]),"MAPS: Lạc Nhật Sâm Lâm là bản đồ săn cấp 40–70, 5.000–30.000 năm");
  ok(same(M.shards,["bich_lan_xa_hoang","ky_nhung_thong_thien_cuc","hoa_long","liet_hoa_thuong_lang"])&&same(M.cores,["xa_hoang","phuong_hoang"])&&M.king==="luong_nghi_thu_ho_xa",
    `rơi đặc trưng: mảnh ${M.shards.map(v=>VOHON[vohonIndex(v)]?.name).join(", ")}; bộ hồn hạch ${M.cores.join(", ")}`);
  // Vùng (bảng 5.3): tên, niên hạn, loài, tinh anh; theo chiều đông.
  const ZT=[["Rừng hoa độc","5000-10000",["thuc_nhan_hoa","cuc_yeu_hoa_linh","doc_cuc_dang"],"huyet_man_thuc_nhan_hoa"],
    ["Đầm Bích Lân","10000-18000",["bich_lan_xa","doc_vu_thiem","hac_thuy_mang"],"song_dau_bich_lan_xa"],
    ["Băng Hỏa Tuyền","16000-25000",["liet_hoa_tich_dich","huyen_bang_thiem","hoa_linh_diep"],"bang_hoa_song_sac_mang"],
    ["Lưỡng Nghi Nhãn","22000-30000",["co_moc_thu_nhan","y_la_hoa_yeu","thanh_lan_doc_co"],"kho_dang_thu_vuong"]];
  // Bản ×8 (11.5): mỗi tầng niên hạn có vùng mang tên bảng 5.3 (có thể thêm vùng có tên khác cùng niên hạn), vùng chia nhiều mảnh.
  const os=objs(LN), zn=zonesByName(os), es=os.filter(o=>o.type==="elite"), zbad=[], low=y=>parseLevelRange(y)?.[0]??0;
  const tiers=[...new Set([...zn.values()].map(z=>z.years))].sort((a,b)=>low(a)-low(b));
  ZT.forEach(([n,y,sp,el],i)=>{
    const z=zn.get(n); if(!z||z.years!==y||tiers[i]!==y||!same(z.beasts,sp)) zbad.push(n);
    if(sp.some(x=>beastIndex(x)<0||!beastSkillOf(x,parseLevelRange(y)[0])||!BONE_SKILLS[x])) zbad.push(`${n}: loài`);
    const e=es.filter(e=>inZone(z,e.x+e.width/2,e.y+e.height/2)), d=BOSSES[bossIndex(el)];
    if(e.length!==1||prop(e[0],"boss")!==el||d?.rank!==1||d.skills.length!==2||beastIndex(d.species)<0) zbad.push(`${n}: tinh anh`);
  });
  ok(tiers.length===4&&!zbad.length,`4 tầng niên hạn đúng bảng 5.3 (loài từ 1.000 năm có chiêu báo trước và kỹ năng hồn cốt, mỗi tầng 1 tinh anh): ${tiers.map(y=>`${[...zn.values()].filter(z=>z.years===y).map(z=>z.name).join(" / ")} ${y}`).join("; ")}`+(zbad.length?` sai: ${zbad.join(", ")}`:""));
  const K=BOSSES[bossIndex(M.king)], lr=os.filter(o=>o.type==="boss"), deep={name:ZT[3][0],rects:[...zn.values()].filter(z=>z.years===ZT[3][1]).flatMap(z=>z.rects)};
  ok(K?.rank===2&&K.hp===84&&K.skills.length>=2&&K.skills.length<=3&&(K.phase2?.skills.length||K.phase2?.split)&&[...K.skills,...K.phase2.skills].every(s=>s.warn>=1)
    &&lr.length===1&&prop(lr[0],"boss")===M.king&&inZone(deep,lr[0].x+lr[0].width/2,lr[0].y+lr[0].height/2),
    `thú vương ${K?.name} x${K?.hp}: ${K?.skills.map(s=>s.name).join(", ")} + GĐ2 ${K?.phase2?.name} (${K?.phase2?.skills.map(s=>s.name).join(", ")}), hang ở ${deep.name}`);
  const west=objs(AT).find(o=>o.type==="portal"&&prop(o,"to")===LN), back=os.filter(o=>o.type==="portal");
  ok(west?.name==="Đi Lạc Nhật Sâm Lâm"&&prop(west,"level")==="40-70"&&!npcDef("cong_lac_nhat")&&back.length===1&&prop(back[0],"to")===AT&&!prop(back[0],"level"),
    "cổng tây Thiên Đấu Thành -> Lạc Nhật (đề xuất 40–70, thay biển \"sắp mở\"); Lạc Nhật chỉ có cổng về Thiên Đấu Thành (thành: không cấp đề xuất)");
  // Tiên thảo: hàm thuần.
  const hc=ZT.map(([n])=>herbChance(LN,n)), pc=x=>`${(x*100).toLocaleString("vi-VN")}%`;
  ok(HERBS.length>=3&&HERBS.every(h=>itemDef(h.id)?.kind==="tien_thao"&&itemDef(h.id).stack>1)&&hc.every((c,i)=>c>0&&(!i||c>hc[i-1]))
    &&herbChance(LN,ZT[3][0],true)===Math.min(1,hc[3]*HERB_ELITE)&&herbChance(LN,"Không có")===0&&Object.values(MAPS).every(m=>m.id===LN||!m.herbs),
    `tiên thảo (${HERBS.map(h=>h.name).join(", ")}) chỉ rơi ở Lạc Nhật, vùng càng sâu càng cao: ${hc.map(pc).join(" / ")}, tinh anh x${HERB_ELITE}`);
  ok(same(herbBonus({[HERBS[0].id]:3,[HERBS[2].id]:99,la:5}),{[HERBS[0].stat]:3*HERB_PCT,[HERBS[1].stat]:0,[HERBS[2].stat]:HERB_MAX*HERB_PCT})
    &&same(parseHerbs({[HERBS[0].id]:"2",la:4,[HERBS[1].id]:-3,[HERBS[2].id]:99}),{[HERBS[0].id]:2,[HERBS[2].id]:HERB_MAX})
    &&calcStats(0,30,[1,1],1,{},{},{},{hp:5}).maxHp===calcStats(0,30,[1,1],1,{},{},{hp:5}).maxHp&&calcStats(0,30,[1,1],1,{},{},{},{hp:5}).maxHp>calcStats(0,30,[1,1]).maxHp,
    "herbBonus / parseHerbs (bỏ mã lạ, kẹp tối đa) và calcStats cộng % tiên thảo như cộng minh");
  const pool=kingShardPool(LN), rc=rollCore(20000,M.cores,()=>0);
  ok(M.shards.every(v=>pool.some(x=>x.vohon===v&&x.w===3))&&!pool.some(x=>x.w===1&&M.shards.includes(x.vohon))&&M.cores.includes(rc.data.set),
    `rương thú vương Lạc Nhật: mảnh của bản đồ trọng số 3; hồn hạch bộ đặc trưng (${rc.data.set})`);
  if(!(await test(C,"ping"))?.enabled){ needHookSkip("bỏ qua đi Lạc Nhật (cần hook warp, herb, king): bật server bằng GAME_TEST=1"); return; }

  const L=await bot("Lạc Nhật","bich_lan_xa_hoang",{sex:1,hair:2,hairCol:3,outfitCol:4}), C0=C;
  C=L; // dùng chung các hàm đi bộ / đi cổng của bot C (me, walk, travelBy)
  try{
    await waitFor(()=>me()&&L.owned&&L.bag);
    const ar=objs(AT).find(o=>o.type==="arrive"&&o.name==="tu_lac_nhat_sam_lam");
    L.travel=null; await test(L,"warp",{mapId:AT,x:ar.x,y:ar.y}); await waitFor(()=>L.travel,3000);
    await L.room.leave(); await sleep(300); L.mapId=AT; await enter(L); await waitFor(()=>me()&&L.owned&&L.bag);
    ok(L.room.state.mapId===AT&&Math.hypot(me().x-ar.x,me().y-ar.y)<1,`Thiên Đấu Thành: đứng ở điểm xuất hiện của cổng tây (${me().x},${me().y})`);
    ok(await walk(-1,0,()=>L.portal?.name,4000)&&L.portal.name==="Đi Lạc Nhật Sâm Lâm",`đi bộ tới cổng tây: ${JSON.stringify(L.portal)}`);
    ok(L.portal?.to===LN&&L.portal.toName==="Lạc Nhật Sâm Lâm"&&same(L.portal.level,[40,70])&&L.portal.warn&&me().level<40,
      `hộp cổng: đề xuất cấp 40–70, cấp ${me().level} có cảnh báo đỏ (chặn mềm)`);
    await travelBy("Đi Lạc Nhật Sâm Lâm",LN);
    const arr=os.find(o=>o.type==="arrive"&&o.name==="tu_thien_dau_thanh");
    ok(Math.hypot(me().x-arr.x,me().y-arr.y)<1,`dưới cấp vẫn vào được, xuất hiện ở trại cổng Lạc Nhật: ${me().x},${me().y}`);
    await waitFor(()=>L.room.state.beasts.size>20,3000);
    const map=checkBeastYears(L); checkGateClear(L,map);
    // Tinh anh: mỗi vùng một con, niên hạn bằng mức trên của vùng.
    const el=await test(L,"elite");
    ok(el.list?.length===4&&ZT.every(([n,y,,id])=>el.list.some(e=>e.boss===id&&e.zone===n&&e.bid&&e.years===parseLevelRange(y)[1])),
      `4 tinh anh có mặt: ${(el.list??[]).map(e=>`${e.name} (${e.zone}, ${e.years} năm)`).join("; ")}`);

    // Ô đứng được của Lạc Nhật (tile chặn như server/src/map.ts), để đặt bot vào từng vùng.
    const ts=JSON.parse(readFileSync(mapUrl(LN),"utf8"));
    const sg=new Set(ts.tilesets.flatMap(t=>(t.tiles??[]).filter(x=>(x.properties??[]).some(q=>q.name==="collides"&&q.value)).map(x=>t.firstgid+x.id)));
    const sol=new Set(ts.layers.filter(l=>l.type==="tilelayer").flatMap(l=>l.data.flatMap((g,i)=>sg.has(g)?[i]:[])));
    const free=(x,y)=>{ for(let ty=Math.floor((y-12)/16);ty<=Math.floor((y+12)/16);ty++) for(let tx=Math.floor((x-24)/16);tx<=Math.floor((x+24)/16);tx++)
      if(tx<0||ty<0||tx>=ts.width||ty>=ts.height||sol.has(ty*ts.width+tx)) return false; return true; };
    /** Đưa L tới một chỗ trống trong vùng tên `name` (thử từng mảnh chữ nhật; xa tinh anh và hang), dọn hồn thú quanh đó. */
    async function toZone(name){
      for(const z of zn.get(name)?.rects??[]) for(let y=z.y+40;y<z.y+z.height-40;y+=24) for(let x=z.x+40;x<z.x+z.width-40;x+=24){
        if(!free(x,y)||es.some(e=>Math.abs(x-e.x-e.width/2)<200&&Math.abs(y-e.y-e.height/2)<200)||lr.some(e=>Math.abs(x-e.x-e.width/2)<260&&Math.abs(y-e.y-e.height/2)<220)) continue;
        await test(L,"goto",{x,y}); if(Math.hypot(me().x-x,me().y-y)<1){ await test(L,"clear",{keep:1}); await test(L,"rest",{s:TEAM_COMBAT_SECS+1}); return true; }
      }
      return false;
    }
    /** Sinh hồn thú 1 máu cạnh L (loài `species`, `years`, hoặc tinh anh `boss`) rồi hạ nó qua killBeast. Trả các dòng log mới. */
    async function slay(extra){ const l=L.logs.length; await test(L,"beast",{dx:14,dy:0,...extra}); await test(L,"slay"); await sleep(150); return L.logs.slice(l).join(" | "); }
    await test(L,"shard",{r:100}); await test(L,"bone",{r:100}); await test(L,"core",{r:100});
    // Tiên thảo: cùng số ngẫu nhiên 3% thì vùng nông (1%) không rơi, vùng sâu nhất (5%) rơi; 6% thì thường không, tinh anh (x3) rơi.
    const H0=HERBS[0], h=()=>HERBS.reduce((a,x)=>a+qtyOf(L,x.id),0);
    ok(await toZone(ZT[0][0]),"tới Rừng hoa độc");
    await test(L,"herb",{r:3,i:0}); let n0=h(), lg=await slay({species:"thuc_nhan_hoa",years:8000});
    ok(h()===n0&&!/tiên thảo/.test(lg),`Rừng hoa độc, số ngẫu nhiên 3% (tỉ lệ ${pc(hc[0])}): không rơi tiên thảo`);
    ok(await toZone(ZT[3][0]),"tới Lưỡng Nghi Nhãn");
    await test(L,"herb",{r:3,i:0}); n0=h(); lg=await slay({species:"co_moc_thu_nhan",years:26000});
    ok(qtyOf(L,H0.id)===1&&h()===n0+1&&/Tìm được tiên thảo/.test(lg),`Lưỡng Nghi Nhãn, cùng số ngẫu nhiên (tỉ lệ ${pc(hc[3])}): rơi ${H0.name} vào túi (${lg})`);
    await test(L,"herb",{r:6,i:2}); n0=h(); lg=await slay({species:"co_moc_thu_nhan",years:26000});
    ok(h()===n0,"số ngẫu nhiên 6%: hồn thú thường vùng sâu nhất không rơi");
    await test(L,"herb",{r:6,i:2}); n0=h(); lg=await slay({boss:"kho_dang_thu_vuong",years:30000});
    ok(qtyOf(L,HERBS[2].id)===1&&h()===n0+1,`tinh anh (x${HERB_ELITE} = ${pc(herbChance(LN,ZT[3][0],true))}) rơi ${HERBS[2].name}`);
    await test(L,"herb",{r:-1}); await test(L,"clear",{keep:1});
    // Rơi đặc trưng: mảnh 4 võ hồn của bản đồ (từ 8.3 có Liệt Hỏa Thương Lang); hồn hạch rơi xuống đất.
    for(let i=0;i<M.shards.length;i++){
      const code=shardCode(M.shards[i]), q0=qtyOf(L,code); await test(L,"shard",{r:0,i}); lg=await slay({species:"y_la_hoa_yeu",years:24000});
      ok(qtyOf(L,code)===q0+1,`mảnh rơi đặc trưng: ${itemDef(code).name} (${lg.split(" | ").find(t=>/Mảnh/.test(t))??lg})`);
    }
    await test(L,"shard",{r:100});
    { await test(L,"core",{r:0,stars:0,set:-1}); const d0=new Set(L.room.state.drops.keys()); await slay({species:"thanh_lan_doc_co",years:24000});
      const nd=[...L.room.state.drops.entries()].filter(([k,x])=>!d0.has(k)&&x.item===CORE_ITEM).map(([,x])=>x), band=coreStarBand(24000);
      ok(nd.length===1&&nd[0].stars>=band[0]&&nd[0].stars<=band[1],`hồn hạch rơi ở Lạc Nhật: ${nd[0]?.stars}★ bộ ${CORE_SETS[nd[0]?.cset]?.name} (sao ${band.join("–")} theo 24.000 năm)`);
      await test(L,"core",{r:100});
      let hits=0; for(let k=0;k<400;k++) if(M.cores.includes(rollCore(24000,M.cores,Math.random).data.set)) hits++;
      ok(hits>=400*(CORE_MAP_SET-0.12),`hồn hạch rơi ở Lạc Nhật phần lớn thuộc bộ Xà Hoàng / Phượng Hoàng: ${hits}/400`); }

    // Dùng tiên thảo cho võ hồn dự bị (Lam Ngân Thảo) và võ hồn ra trận.
    const act=L.owned.active, bench=L.owned.list.find(v=>v.rowId!==act).rowId;
    await test(L,"set",{rowId:bench,level:50,xp:0,rings:[]});
    await test(L,"give",{code:H0.id,qty:HERB_MAX+1}); await test(L,"give",{code:HERBS[2].id,qty:1});
    const herbIt=c=>L.bag.items.find(i=>i.code===c);
    const useOn=async(code,vohonId)=>{ const n=L.ownedMsgs, l=L.logs.length; L.room.send("use",{id:herbIt(code)?.id,vohonId}); await waitFor(()=>L.ownedMsgs>n||L.logs.length>l,1500); await sleep(120); return L.logs.slice(l).join(" | "); };
    const vh=v=>vohonIndex(v.vohon);
    let s0=await test(L,"stats",{rowId:bench}), q0=qtyOf(L,H0.id);
    lg=await useOn(H0.id,bench); let s1=await test(L,"stats",{rowId:bench}), bv=L.owned.list.find(v=>v.rowId===bench);
    ok(qtyOf(L,H0.id)===q0-1&&bv.herbs?.[H0.id]===1&&s1.herbs?.[H0.id]===1&&s1.base.maxHp>s0.base.maxHp
      &&s1.base.maxHp===calcStats(vh(bv),bv.level,bv.rings.map(tierOfYears),bv.stars,{},{},L.res?.bonus,herbBonus(bv.herbs)).maxHp,
      `dùng ${H0.name} cho võ hồn dự bị: sinh lực tối đa ${s0.base.maxHp} -> ${s1.base.maxHp} (+${HERB_PCT}%), mất 1 cây (${lg})`);
    const a0=await test(L,"stats",{rowId:act}); lg=await useOn(HERBS[2].id,act); const a1=await test(L,"stats",{rowId:act}), av=L.owned.list.find(v=>v.rowId===act);
    ok(av.herbs?.[HERBS[2].id]===1&&a1.live.atk>a0.live.atk&&Math.abs(a1.live.atk-calcStats(vh(av),av.level,av.rings.map(tierOfYears),av.stars,a1.bones,a1.cores,L.res?.bonus,herbBonus(av.herbs)).atk)<1e-6,
      `dùng ${HERBS[2].name} cho võ hồn ra trận: công đang dùng ${a0.live.atk.toFixed(2)} -> ${a1.live.atk.toFixed(2)}`);
    // Trong túi còn cây Ỷ La rơi ở trên (q0 tính cả cây đó): so số cây tương đối.
    const q1=qtyOf(L,H0.id);
    lg=await useOn(H0.id,999999); ok(/Chọn võ hồn/.test(lg)&&qtyOf(L,H0.id)===q1,`võ hồn không phải của mình: từ chối, không mất cây (${lg})`);
    lg=await useOn(H0.id,undefined); ok(/Chọn võ hồn/.test(lg)&&qtyOf(L,H0.id)===q1,"thiếu võ hồn: từ chối");
    for(let k=1;k<HERB_MAX;k++) await useOn(H0.id,bench);
    lg=await useOn(H0.id,bench); bv=L.owned.list.find(v=>v.rowId===bench);
    ok(bv.herbs?.[H0.id]===HERB_MAX&&qtyOf(L,H0.id)===q1-(HERB_MAX-1)&&/đã dùng đủ/.test(lg),`tối đa ${HERB_MAX} cây mỗi loại mỗi võ hồn: cây thứ ${HERB_MAX+1} bị từ chối (${lg})`);
    // Thoát vào lại: số cây và chỉ số đã lưu.
    const keep=JSON.stringify(L.owned.list.map(v=>[v.rowId,sj(v.herbs)])), sb=(await test(L,"stats",{rowId:bench})).base.maxHp, hp0=me().maxHp, q2=qtyOf(L,H0.id);
    await L.room.leave(); await sleep(400); await enter(L); await waitFor(()=>me()&&L.owned&&L.bag);
    const s2=await test(L,"stats",{rowId:bench});
    ok(L.room.state.mapId===LN&&JSON.stringify(L.owned.list.map(v=>[v.rowId,sj(v.herbs)]))===keep&&s2.base.maxHp===sb&&me().maxHp===hp0&&qtyOf(L,H0.id)===q2,
      `thoát vào lại: tiên thảo đã dùng còn nguyên (${keep}), sinh lực tối đa võ hồn dự bị ${s2.base.maxHp}, túi còn ${q2} ${H0.name}`);

    // Hút Sinh (Khô Đằng Thụ Vương): trúng người đang bị Trói thì hồi máu.
    { const e=el.list.find(x=>x.boss==="kho_dang_thu_vuong");
      await test(L,"set",{rowId:act,level:100,xp:0,rings:[]}); await test(L,"rest",{s:TEAM_COMBAT_SECS+1});
      // Tinh anh hồi sinh ở tick sau hook erespawn: chờ tới khi ô có bid và vị trí (đọc sớm thì bid null, hook tele / bhp nhắm hồn thú
      // gần nhất khác hoặc không có ai: "tele {}").
      await test(L,"erespawn",{s:0}); let cur=null;
      for(let k=0;k<20&&!(cur?.bid&&L.room.state.beasts.has(cur.bid)&&Number.isFinite(cur.x));k++){ await sleep(150); cur=(await test(L,"elite")).list.find(x=>x.boss==="kho_dang_thu_vuong"); }
      cur??=e;
      // Tinh anh sinh ở điểm ngẫu nhiên trong ô của nó: thử vài chỗ đứng quanh (chỗ bị cây / nước chặn thì goto không đổi vị trí).
      let at=null; for(const [dx,dy] of [[20,0],[0,20],[-20,0],[0,-20],[28,10],[-28,10],[10,28],[10,-28]]){
        await test(L,"goto",{x:cur.x+dx,y:cur.y+dy}); if(Math.hypot(me().x-cur.x-dx,me().y-cur.y-dy)<1){ at=[dx,dy]; break; } }
      // Nhắm đúng tinh anh theo bid (tùy tùng / hồn thú khác có thể đứng gần hơn), bỏ chiêu nó đang tự báo trước.
      const eb={bid:cur.bid};
      // Máu đặt bằng hook bhp đọc từ state: chờ bản vá tới (đọc sớm thì hp1 còn máu cũ, cao hơn máu sau khi hồi).
      const half=async()=>{ await test(L,"bhp",{pct:50,...eb}); await waitFor(()=>{ const q=L.room.state.beasts.get(cur.bid); return !q||q.hp<=Math.round(q.maxHp*0.5); },1500); };
      // Đòn không tính trúng khi hồn sư còn khung bất tử (vừa vào lại phòng 1,5 giây, vừa bị hồn thú khác / tùy tùng đánh 0,45 giây):
      // dọn hồn thú thường quanh L (giữ tinh anh) trước mỗi lần, tung lại tối đa 3 lần cách 1,6 giây (BĐ6e). Tinh anh đang báo trước thì
      // không đánh thường.
      let t={}, b=null, hp1=0, why="";
      for(let k=0;k<3&&!(b&&b.hp>hp1);k++){
        if(k) await sleep(1600);
        await test(L,"clear",{keep:1}); await half(); await test(L,"pst",{s:"root",secs:5}); L.fxs=[];
        t=await test(L,"tele",{i:1,cancel:1,...eb}); b=L.room.state.beasts.get(t.bid); hp1=b?.hp; await waitFor(()=>!b||b.hp>hp1,2500);
        const th=L.fxs.find(f=>f.k==="teleHit"&&f.bid===t.bid);
        why+=` [lần ${k+1}: teleHit ${th?(th.hit.includes(L.room.sessionId)?"trúng L":"không trúng L"):"chưa có"}, Trói ${(me().st&statusBit("root"))!==0}]`;
      }
      ok(t.name==="Hút Sinh"&&b&&b.hp>hp1,`Hút Sinh trúng người đang bị Trói: ${b?beastName(b.rank,b.species):"?"} hồi ${b?b.hp-hp1:0} máu (${hp1} -> ${b?.hp}; đứng cạnh ${JSON.stringify(at)}, tinh anh ở ${cur.x?.toFixed(0)},${cur.y?.toFixed(0)}, tele ${JSON.stringify(t)})`+(b&&b.hp>hp1?"":why));
    }
    // Thú vương theo lịch (hook king): xuất hiện trong hang, đúng niên hạn mức trên của bản đồ.
    { await test(L,"goto",{x:arr.x,y:arr.y}); await test(L,"king",{kop:"spawn",mapId:LN}); let ki=null;
      for(let k=0;k<20&&!ki?.bid;k++){ await sleep(150); ki=await test(L,"king"); }
      const lair=lr[0], inL=ki?.bid&&ki.x>=lair.x&&ki.x<=lair.x+lair.width&&ki.y>=lair.y&&ki.y<=lair.y+lair.height;
      ok(ki?.bid&&inL&&ki.years===M.years[1]&&same(ki.skills,K.skills.map(s=>s.name))&&L.boss.some(m=>m.k==="spawn"),
        `Tà hóa ${K.name} xuất hiện trong hang (${ki?.years} năm, ${ki?.hp}/${ki?.maxHp} máu, chiêu ${ki?.skills?.join(", ")})`); }
  } finally { C=C0; await L.room.leave().catch(()=>{}); }
}


/**
 * BĐ6d Hải Thần Đảo / Ma Quỷ Hải Vực: dữ liệu (MAPS, 4 vùng đúng bảng 5.3, loài từ 1.000 năm có chiêu báo trước và kỹ năng hồn cốt,
 * tinh anh mỗi vùng, thú vương 95.000 năm và hang ở vùng sâu nhất, rơi đặc trưng, chỉ Hải Thần Uyên lên tới 100.000 năm, bến thuyền hai
 * chiều). Với hook: bot H (tài khoản mới, cấp thấp) tới bến thuyền Thiên Đấu Thành (hộp "Đi thuyền tới", đề xuất 80–100, cảnh báo đỏ,
 * BOAT_CAST giây), bước ra khỏi bến thì hủy, đi thuyền thật thì tới bến Hải Thần; hồn thú đúng loài / năm theo vùng, không sát bến;
 * 4 tinh anh có mặt; luật tối đa 1 hồn thú thường 100.000 năm mỗi kênh (tinh anh 100.000 năm không tính, vùng khác không sinh, hạ con
 * đỏ thì sinh lại được) và đồ rơi của nó; mảnh 3 võ hồn và hồn hạch của bản đồ; thú vương xuất hiện trong hang (hook king); đi thuyền về.
 */
async function haiThanTest(){
  console.log("[BĐ6d] Hải Thần Đảo: bến thuyền Thiên Đấu Thành, vùng, tinh anh, thú vương, luật 1 hồn thú 100.000 năm, rơi đặc trưng");
  const HT="hai_than_dao", M=MAPS[HT];
  const objs=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const prop=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  ok(M?.kind==="hunt"&&M.name==="Hải Thần Đảo"&&same(M.level,[80,100])&&same(M.years,[50000,MAX_YEARS]),"MAPS: Hải Thần Đảo là bản đồ săn cấp 80–100, 50.000–100.000 năm");
  ok(same(M.shards,["quy_mi","thien_can_bach_ngoc_dinh","hoa_anh","pha_hon_thuong"])&&same(M.cores,["ba_vuong_long","tien_co"])&&M.king==="tham_hai_ma_kinh_vuong", // Phá Hồn Thương từ 2026-10-20
    `rơi đặc trưng: mảnh ${M.shards.map(v=>VOHON[vohonIndex(v)]?.name).join(", ")}; bộ hồn hạch ${M.cores.join(", ")}`);
  const ZT=[["Bãi san hô","50000-65000",["thiet_giap_cu_giai","lam_lan_hai_xa","kiem_ngu"],"hac_giap_cu_giai_vuong"],
    ["Ma Quỷ Hải Vực","60000-80000",["quy_dien_hai_yeu","tham_hai_ma_chuong","loi_quang_hai_dieu"],"ma_chuong_vuong"],
    ["Vách Hải Thần","75000-90000",["kim_lan_long_quy","huyet_nha_cu_sa","loi_van_hai_ung"],"huyet_sa_bao_quan"],
    ["Hải Thần Uyên","85000-100000",["tham_hai_ma_kinh","u_linh_hai_mau"],"hac_uyen_ma_kinh"]];
  // Bản ×8 (11.5): mỗi tầng niên hạn có vùng mang tên bảng 5.3 (có thể thêm vùng có tên khác cùng niên hạn), vùng chia nhiều mảnh.
  const os=objs(HT), zn=zonesByName(os), es=os.filter(o=>o.type==="elite"), zbad=[], low=y=>parseLevelRange(y)?.[0]??0;
  const tiers=[...new Set([...zn.values()].map(z=>z.years))].sort((a,b)=>low(a)-low(b));
  ZT.forEach(([n,y,sp,el],i)=>{
    const z=zn.get(n); if(!z||z.years!==y||tiers[i]!==y||!same(z.beasts,sp)) zbad.push(n);
    if(sp.some(x=>beastIndex(x)<0||!beastSkillOf(x,parseLevelRange(y)[0])||!BONE_SKILLS[x])) zbad.push(`${n}: loài`);
    const e=es.filter(e=>inZone(z,e.x+e.width/2,e.y+e.height/2)), d=BOSSES[bossIndex(el)];
    if(e.length!==1||prop(e[0],"boss")!==el||d?.rank!==1||d.skills.length!==2||beastIndex(d.species)<0) zbad.push(`${n}: tinh anh`);
  });
  ok(tiers.length===4&&!zbad.length,`4 tầng niên hạn đúng bảng 5.3 (loài có chiêu báo trước và kỹ năng hồn cốt, mỗi tầng 1 tinh anh): ${tiers.map(y=>`${[...zn.values()].filter(z=>z.years===y).map(z=>z.name).join(" / ")} ${y}`).join("; ")}`+(zbad.length?` sai: ${zbad.join(", ")}`:""));
  // Chỉ Hải Thần Uyên sinh được hồn thú thường 100.000 năm (mục 5.3): mọi vùng của mọi bản đồ săn khác có mức trên dưới MAX_YEARS.
  const tops=Object.values(MAPS).filter(m=>m.kind==="hunt").flatMap(m=>objs(m.id).filter(o=>o.type==="zone"&&parseLevelRange(prop(o,"years"))?.[1]>=MAX_YEARS).map(o=>`${m.id}/${o.name}`)).filter((x,i,a)=>a.indexOf(x)===i);
  ok(same(tops,[`${HT}/Hải Thần Uyên`])&&RED_BEAST_CHANCE>0&&RED_BEAST_CHANCE<1,`chỉ ${tops.join(", ")} lên tới ${MAX_YEARS} năm (tỉ lệ ra đúng ${MAX_YEARS} năm mỗi lần sinh ${RED_BEAST_CHANCE*100}%)`);
  const K=BOSSES[bossIndex(M.king)], lr=os.filter(o=>o.type==="boss"), deep=zn.get(ZT[3][0]);
  ok(K?.rank===2&&K.hp===96&&kingYears(HT)===95000&&K.skills.length>=2&&K.skills.length<=3&&K.phase2?.skills.length&&[...K.skills,...K.phase2.skills].every(s=>s.warn>=1)
    &&lr.length===1&&prop(lr[0],"boss")===M.king&&inZone(deep,lr[0].x+lr[0].width/2,lr[0].y+lr[0].height/2),
    `thú vương ${K?.name} x${K?.hp} ${kingYears(HT)} năm: ${K?.skills.map(s=>s.name).join(", ")} + GĐ2 ${K?.phase2?.name} (${K?.phase2?.skills.map(s=>s.name).join(", ")}), hang ở ${deep.name}`);
  ok(BOSSES[bossIndex("huyet_sa_bao_quan")]?.skills.some(s=>s.weak&&s.at==="target"),"Huyết Khí của Huyết Sa Bạo Quân nhắm người ít máu nhất (weak)");
  const dock=objs(AT).find(o=>o.type==="portal"&&prop(o,"to")===HT), back=os.filter(o=>o.type==="portal");
  ok(dock?.name==="Thuyền đi Hải Thần Đảo"&&prop(dock,"level")==="80-100"&&prop(dock,"boat")===true&&!npcDef("ben_thuyen_hai_than")
    &&back.length===1&&prop(back[0],"to")===AT&&!prop(back[0],"level")&&prop(back[0],"boat")===true&&BOAT_CAST>TRAVEL_CAST,
    `bến thuyền Thiên Đấu Thành -> Hải Thần Đảo (đề xuất 80–100, đi thuyền ${BOAT_CAST} giây, thay biển "sắp mở"); Hải Thần Đảo chỉ có thuyền về Thiên Đấu Thành (không cấp đề xuất)`);
  const pool=kingShardPool(HT), rc=rollCore(90000,M.cores,()=>0);
  ok(M.shards.every(v=>pool.some(x=>x.vohon===v&&x.w===3))&&!kingShardPool("tinh_dau_ngoai_vi").some(x=>M.shards.includes(x.vohon))&&M.cores.includes(rc.data.set),
    `rương thú vương Hải Thần Đảo: mảnh của bản đồ trọng số 3 (${M.shards.length} võ hồn, có Phá Hồn Thương), các võ hồn này thôi nằm trong nhóm "bản đồ chưa mở"; hồn hạch bộ đặc trưng (${rc.data.set})`);
  if(!(await test(C,"ping"))?.enabled){ needHookSkip("bỏ qua đi Hải Thần Đảo (cần hook warp, red, king): bật server bằng GAME_TEST=1"); return; }

  const H=await bot("Hải Thần","quy_mi",{sex:0,hair:1,hairCol:2,outfitCol:3}), C0=C;
  C=H; // dùng chung các hàm đi bộ / đi cổng của bot C (me, walk, travelBy)
  try{
    await waitFor(()=>me()&&H.owned&&H.bag);
    const ar=objs(AT).find(o=>o.type==="arrive"&&o.name==="tu_hai_than_dao");
    H.travel=null; await test(H,"warp",{mapId:AT,x:ar.x,y:ar.y}); await waitFor(()=>H.travel,3000);
    await H.room.leave(); await sleep(300); H.mapId=AT; await enter(H); await waitFor(()=>me()&&H.owned&&H.bag);
    ok(H.room.state.mapId===AT&&Math.hypot(me().x-ar.x,me().y-ar.y)<1,`Thiên Đấu Thành: đứng trên cầu tàu (${me().x},${me().y})`);
    ok(await walk(1,0,()=>H.portal?.name,4000)&&H.portal.name==="Thuyền đi Hải Thần Đảo",`đi bộ ra đầu cầu tàu: ${JSON.stringify(H.portal)}`);
    ok(H.portal?.to===HT&&H.portal.toName==="Hải Thần Đảo"&&same(H.portal.level,[80,100])&&H.portal.warn&&H.portal.boat===BOAT_CAST&&me().level<80,
      `hộp bến thuyền: đề xuất cấp 80–100, đi thuyền ${H.portal?.boat} giây, cấp ${me().level} có cảnh báo đỏ (chặn mềm)`);
    // Bước ra khỏi bến khi đang đi thuyền: hủy.
    { const l=H.logs.length; H.room.send("travel",{portal:H.portal.name}); await sleep(400); await walk(-1,0,()=>!H.portal?.name,1500); await sleep(300);
      const lg=H.logs.slice(l).join(" | ");
      ok(/Lên thuyền/.test(lg)&&/hủy đi qua cổng/.test(lg)&&!H.travel&&H.room.state.mapId===AT,`đang đi thuyền mà rời bến thì hủy: ${lg}`); }
    ok(await walk(1,0,()=>H.portal?.name,3000),"quay lại đầu cầu tàu");
    let t0=0;
    await travelBy("Thuyền đi Hải Thần Đảo",HT,async()=>{ t0=Date.now(); await sleep((TRAVEL_CAST+0.8)*1000);
      ok(!H.travel&&H.room.state.mapId===AT,`sau ${TRAVEL_CAST+0.8} giây vẫn đang đi thuyền (cổng thường chỉ niệm ${TRAVEL_CAST} giây)`); },
      async()=>ok(Date.now()-t0>=BOAT_CAST*1000-250,`đi thuyền mất ${((Date.now()-t0)/1000).toFixed(1)} giây (BOAT_CAST ${BOAT_CAST})`));
    const arr=os.find(o=>o.type==="arrive"&&o.name==="tu_thien_dau_thanh");
    ok(Math.hypot(me().x-arr.x,me().y-arr.y)<1,`dưới cấp vẫn tới được, xuất hiện ở bến Hải Thần: ${me().x},${me().y}`);
    await waitFor(()=>H.room.state.beasts.size>25,3000);
    const map=checkBeastYears(H); checkGateClear(H,map);
    const el=await test(H,"elite");
    ok(el.list?.length===4&&ZT.every(([n,y,,id])=>el.list.some(e=>e.boss===id&&e.zone===n&&e.bid&&e.years===parseLevelRange(y)[1])),
      `4 tinh anh có mặt: ${(el.list??[]).map(e=>`${e.name} (${e.zone}, ${e.years} năm)`).join("; ")}`);

    // Luật 1 hồn thú thường 100.000 năm mỗi kênh. Hook `red` cố định số ngẫu nhiên (0 = luôn ra đỏ nếu được) và sinh ngay trong vùng.
    const reds=()=>[...H.room.state.beasts.entries()].filter(([,b])=>!b.rank&&b.years>=MAX_YEARS);
    ok(reds().length<=1,`lúc vào: ${reds().length} hồn thú thường ${MAX_YEARS} năm (tối đa 1)`);
    let r=await test(H,"red",{r:0,zone:"Hải Thần Uyên",n:1});
    ok(r.reds===1&&r.elites>=1,`sinh ở Hải Thần Uyên với số ngẫu nhiên 0: kênh có đúng 1 hồn thú thường ${MAX_YEARS} năm, tinh anh ${MAX_YEARS} năm (${r.elites}) không tính`);
    r=await test(H,"red",{r:0,zone:"Hải Thần Uyên",n:6});
    ok(r.reds===1&&r.years.length>=1&&r.years.every(y=>y>=85000&&y<MAX_YEARS),`đã có 1 con: sinh thêm ${r.years.length} con ở Hải Thần Uyên đều dưới ${MAX_YEARS} năm (${r.years.join(", ")})`);
    r=await test(H,"red",{r:0,zone:"Vách Hải Thần",n:6});
    ok(r.reds===1&&r.years.length>=1&&r.years.every(y=>y>=75000&&y<=90000),`vùng khác không bao giờ ra ${MAX_YEARS} năm: Vách Hải Thần ${r.years.join(", ")}`);
    await sleep(1500); ok(reds().length===1,`sau vài lượt sinh tự nhiên vẫn đúng 1 con ${MAX_YEARS} năm`);
    // Hạ con đỏ: đồ rơi theo bảng 100.000 năm (mảnh võ hồn 100%, hồn hạch 5–6★), rồi kênh sinh lại được con đỏ mới.
    { const [rid,rb]=reds()[0]; let at=null;
      for(const [dx,dy] of [[18,0],[-18,0],[0,18],[0,-18],[26,8],[-26,8],[8,26],[8,-26]]){ await test(H,"goto",{x:rb.x+dx,y:rb.y+dy}); if(Math.hypot(me().x-rb.x-dx,me().y-rb.y-dy)<1){ at=[dx,dy]; break; } }
      await test(H,"shard",{r:-1}); await test(H,"core",{r:-1,stars:0,set:-1});
      const sh0=M.shards.reduce((a,v)=>a+qtyOf(H,shardCode(v)),0), d0=new Set(H.room.state.drops.keys()), l=H.logs.length;
      const k=await test(H,"slay",{bid:rid}); await sleep(250);
      const nd=[...H.room.state.drops.entries()].filter(([q,x])=>!d0.has(q)&&x.item===CORE_ITEM).map(([,x])=>x), sh1=M.shards.reduce((a,v)=>a+qtyOf(H,shardCode(v)),0);
      ok(k.bid===rid&&k.years===MAX_YEARS&&sh1>sh0&&nd.length===1&&nd[0].stars>=coreStarBand(MAX_YEARS)[0],
        `hạ hồn thú ${MAX_YEARS} năm: mảnh võ hồn của bản đồ +${sh1-sh0}, hồn hạch ${nd[0]?.stars}★ bộ ${CORE_SETS[nd[0]?.cset]?.name} (${H.logs.slice(l).find(t=>/Mảnh/.test(t))??""}; đứng cạnh ${JSON.stringify(at)}, hạ ${k.bid===rid?"đúng con đỏ":k.bid} ${k.years} năm)`);
      await test(H,"shard",{r:100}); await test(H,"core",{r:100});
      r=await test(H,"red",{r:0,zone:"Hải Thần Uyên",n:1});
      ok(!reds().some(([q])=>q===rid)&&r.reds===1&&r.years.includes(MAX_YEARS),`con đỏ đã bị hạ: kênh sinh lại được 1 con ${MAX_YEARS} năm mới (${r.years.join(", ")}, ${r.reds} con đỏ)`);
      await test(H,"red",{r:-1}); }

    // Rơi đặc trưng: mảnh 3 võ hồn của bản đồ; hồn hạch phần lớn thuộc bộ Bá Vương Long / Tiên Cơ.
    await test(H,"goto",{x:arr.x,y:arr.y}); await test(H,"clear",{keep:1});
    async function slay(extra){ const l=H.logs.length; await test(H,"beast",{dx:14,dy:0,...extra}); await test(H,"slay"); await sleep(150); return H.logs.slice(l).join(" | "); }
    for(let i=0;i<M.shards.length;i++){
      const code=shardCode(M.shards[i]), q0=qtyOf(H,code); await test(H,"shard",{r:0,i}); const lg=await slay({species:"kiem_ngu",years:60000});
      ok(qtyOf(H,code)>q0,`mảnh rơi đặc trưng: ${itemDef(code).name} (${lg.split(" | ").find(t=>/Mảnh/.test(t))??lg})`);
    }
    await test(H,"shard",{r:100});
    { let hits=0; for(let k=0;k<400;k++) if(M.cores.includes(rollCore(70000,M.cores,Math.random).data.set)) hits++;
      ok(hits>=400*(CORE_MAP_SET-0.12),`hồn hạch rơi ở Hải Thần Đảo phần lớn thuộc bộ Bá Vương Long / Tiên Cơ: ${hits}/400`); }

    // Thú vương theo lịch (hook king): xuất hiện trong hang, niên hạn 95.000 năm (kingYears), máu x96 (#264).
    { await test(H,"king",{kop:"spawn",mapId:HT}); let ki=null;
      for(let k=0;k<20&&!ki?.bid;k++){ await sleep(150); ki=await test(H,"king"); }
      const lair=lr[0], inL=ki?.bid&&ki.x>=lair.x&&ki.x<=lair.x+lair.width&&ki.y>=lair.y&&ki.y<=lair.y+lair.height;
      ok(ki?.bid&&inL&&ki.years===kingYears(HT)&&ki.base===Math.round(beastStats(ki.years).hp*K.hp)&&same(ki.skills,K.skills.map(s=>s.name))&&H.boss.some(m=>m.k==="spawn"),
        `Tà hóa ${K.name} xuất hiện trong hang (${ki?.years} năm, máu gốc ${ki?.base}, chiêu ${ki?.skills?.join(", ")})`); }

    // Đi thuyền về Thiên Đấu Thành: không cấp đề xuất, không cảnh báo. Hồn thú bị kéo theo ở các bước trên (đang đuổi H) thì dọn cả
    // bản đồ trước, để không con nào đuổi tới bến đánh hủy đi thuyền.
    await test(H,"goto",{x:arr.x,y:arr.y}); await test(H,"clear",{keep:1,all:1}); await test(H,"rest",{s:TEAM_COMBAT_SECS+1}); H.portal=null;
    ok(await walk(-1,0,()=>H.portal?.name,4000)&&H.portal.name==="Thuyền về Thiên Đấu Thành"&&H.portal.boat===BOAT_CAST&&!H.portal.warn&&!H.portal.level,
      `bến Hải Thần: ${JSON.stringify(H.portal)}`);
    await travelBy("Thuyền về Thiên Đấu Thành",AT);
    ok(Math.hypot(me().x-ar.x,me().y-ar.y)<1,`về Thiên Đấu Thành trên cầu tàu: ${me().x},${me().y}`);
  } finally { C=C0; await H.room.leave().catch(()=>{}); }
}


/**
 * BĐ6c Cực Bắc Chi Địa (gọi trong thienDauTest, bot C đang ở Thiên Đấu Thành): dữ liệu bảng 5.3 (4 vùng, loài, niên hạn, chiêu từ
 * 1.000 năm, tinh anh, thú vương, hồn cốt theo loài, rơi đặc trưng); đi bộ lên cổng bắc Thiên Đấu Thành (cấp đề xuất 60–85, chặn mềm),
 * xuất hiện ở trại cổng; hồn thú đúng khoảng năm theo vùng, không sát cổng; chiêu báo trước thật của hồn thú băng (đóng băng = Choáng,
 * Mê hoặc lên hồn sư = Choáng ngắn, Làm chậm); 4 tinh anh có mặt (hook `elite`); thú vương theo lịch (hook `king`), giai đoạn 2 Cực
 * Hàn, hạ thì có rương; mảnh võ hồn và hồn hạch rơi theo bảng "Rơi đặc trưng"; đi cổng về Thiên Đấu Thành.
 */
async function cucBacTest(){
  console.log("[BĐ6c] Cực Bắc Chi Địa: cổng bắc Thiên Đấu Thành, vùng, hồn thú băng, tinh anh, thú vương, rơi đặc trưng");
  const CBM="cuc_bac_chi_dia", M=MAPS[CBM];
  const objs=JSON.parse(readFileSync(mapUrl(CBM),"utf8")).layers.flatMap(l=>l.objects??[]);
  const pr=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value, inR=(r,x,y)=>x>=r.x&&x<=r.x+(r.width??r.w)&&y>=r.y&&y<=r.y+(r.height??r.h);
  ok(M?.kind==="hunt"&&same(M.level,[60,85])&&same(M.years,[20000,80000])&&same(M.shards,["yeu_ho","can_khon_hon_nguyen_toa","nguyet_nhan","bang_phuong_hoang"])
    &&same(M.cores,["lam_ngan","that_sat"])&&M.king==="huyen_minh_bang_giao","MAPS: Cực Bắc Chi Địa săn cấp 60–85, 20.000–80.000 năm, mảnh Yêu Hồ / Càn Khôn Hỗn Nguyên Tỏa / Nguyệt Nhận, bộ Lam Ngân / Thất Sát");
  // Bảng 5.3: tên vùng, niên hạn, loài thường, tinh anh (từ nam lên bắc).
  const TB=[["Tuyết nguyên","20000-35000",["tuyet_lang","bang_nguyen_cu_tuong","bang_vu_ung"],"ngan_nguyet_tuyet_lang_vuong"],
    ["Băng hà nứt","30000-50000",["bang_giap_cu_quy","tuyet_vi_yeu_ho","bang_tinh_hat"],"luc_vi_bang_ho"],
    ["Băng Phong Cốc","45000-65000",["han_bang_dia_long","bang_phong_bach_hung","han_nguyet_ung"],"huyen_bang_toa_lien_mang"],
    ["Cực Bắc Băng Uyên","60000-80000",["bang_bich_hat","huyen_minh_bang_tam","tuyet_ma_vien"],"bang_bich_hat_vuong"]];
  // Bản ×8 (11.5): vùng chia nhiều mảnh, mỗi tầng niên hạn có thể thêm vùng có tên khác (cùng niên hạn).
  const zn=zonesByName(objs), es=objs.filter(o=>o.type==="elite"), zbad=[];
  for(const [n,yr,sp,el] of TB){ const z=zn.get(n), y=parseLevelRange(yr), e=es.find(o=>pr(o,"boss")===el);
    if(!z||!same(parseLevelRange(z.years),y)||!same([...z.beasts].sort(),[...sp].sort())) zbad.push(`${n}: vùng`);
    if(sp.some(s=>beastIndex(s)<0||!beastSkillOf(s,y[0])||!BONE_SKILLS[s])) zbad.push(`${n}: loài / chiêu / hồn cốt`);
    if(!e||!inZone(z,e.x+e.width/2,e.y+e.height/2)||BOSSES[bossIndex(el)]?.skills.length!==2) zbad.push(`${n}: tinh anh`); }
  // Vùng chồng nhau 10 cấp theo chiều sâu: càng lên bắc (y nhỏ) càng già (so mép trên các mảnh của mọi vùng cùng tầng).
  const tierTop=yr=>Math.min(...[...zn.values()].filter(z=>z.years===yr).flatMap(z=>z.rects.map(r=>r.y)));
  const order=TB.map(([,yr])=>tierTop(yr)), nTier=new Set([...zn.values()].map(z=>z.years)).size;
  ok(!zbad.length&&nTier===4&&order.every((y,i)=>!i||y<order[i-1]),`4 tầng đúng bảng 5.3, từ nam lên bắc: ${TB.map(([n,yr])=>`${n} ${yr}`).join(" → ")}`+(zbad.length?`: ${zbad.join("; ")}`:""));
  const kd=BOSSES[bossIndex(M.king)], lair=objs.find(o=>o.type==="boss"), deep={name:TB[3][0],rects:[...zn.values()].filter(z=>z.years===TB[3][1]).flatMap(z=>z.rects)};
  ok(kd?.rank===2&&kd.hp===96&&kd.skills.length===2&&kd.phase2?.name==="Cực Hàn"&&kd.phase2.skills.length===1&&kd.phase2.cold&&lair&&pr(lair,"boss")===M.king&&inZone(deep,lair.x,lair.y)&&inZone(deep,lair.x+lair.width,lair.y+lair.height)
    &&itemDef(chestCode(M.king))?.kind==="ruong",`thú vương ${kd?.name} x${kd?.hp}: ${kd?.skills.map(s=>s.name).join(", ")} + GĐ2 ${kd?.phase2?.name} (${kd?.phase2?.skills.map(s=>s.name).join(", ")}), hang trong ${deep?.name}`);
  // Rơi đặc trưng: mảnh của Cực Bắc vào rương các bản đồ khác không còn là "bản đồ chưa mở"; hồn hạch phần lớn thuộc bộ của bản đồ.
  const pool=kingShardPool(CBM), poolNV=kingShardPool("tinh_dau_ngoai_vi").map(x=>x.vohon);
  ok(M.shards.every(v=>pool.find(x=>x.vohon===v)?.w===3&&!poolNV.includes(v)),`rương thú vương: mảnh Cực Bắc trọng số 3 ở Cực Bắc, không còn trong nhóm "bản đồ chưa mở" (${poolNV.join(", ")})`);
  ok(rollCoreStats(5,M.cores,()=>0).set==="lam_ngan"&&rollCoreStats(5,M.cores,()=>0.5).set==="that_sat"&&CORE_MAP_SET>=0.5,`hồn hạch rơi ở Cực Bắc: ${CORE_MAP_SET*100}% thuộc bộ ${M.cores.map(s=>CORE_SETS[coreSetIndex(s)].name).join(" / ")}`);
  if(!(await test(C,"ping"))?.enabled){ needHookSkip("bỏ qua đi Cực Bắc (cần hook goto, warp, spawn, tele, elite, king): bật server bằng GAME_TEST=1"); return; }

  // Đi bộ lên cổng bắc Thiên Đấu Thành.
  const tdObjs=JSON.parse(readFileSync(mapUrl(AT),"utf8")).layers.flatMap(l=>l.objects??[]);
  const back=tdObjs.find(o=>o.type==="arrive"&&o.name==="tu_cuc_bac_chi_dia");
  await test(C,"goto",{x:back.x,y:back.y}); C.portal=null;
  ok(await walk(0,-1,()=>C.portal?.name,4000)&&C.portal.name==="Đi Cực Bắc Chi Địa",`tới cổng bắc Thiên Đấu Thành: ${JSON.stringify(C.portal)}`);
  ok(C.portal?.to===CBM&&C.portal.toName===M.name&&same(C.portal.level,[60,85])&&C.portal.warn===(me().level<60),`hộp cổng: đề xuất cấp 60–85, cấp ${me().level} -> cảnh báo ${C.portal?.warn} (chặn mềm: vẫn đi được)`);
  await travelBy("Đi Cực Bắc Chi Địa",CBM);
  const ar=objs.find(o=>o.type==="arrive"&&o.name==="tu_thien_dau_thanh"), camp=objs.find(o=>o.type==="spawn");
  ok(Math.hypot(me().x-ar.x,me().y-ar.y)<1&&inR(camp,me().x,me().y),`xuất hiện ở trại cổng Cực Bắc: ${me().x},${me().y}`);
  await waitFor(()=>C.room.state.beasts.size>=10,3000);
  checkGateClear(C,checkBeastYears(C)); // vùng Cực Bắc: 20.000–35.000 … 60.000–80.000 năm

  // Võ hồn ra trận cấp 80, 8 vòng (đủ sinh lực chịu chiêu hồn thú vạn năm); trả lại như cũ ở cuối.
  const act=C.owned.active, v0=C.owned.list.find(v=>v.rowId===act);
  await test(C,"set",{rowId:act,level:80,xp:0,rings:[423,764,1760,5000,12000,20000,50000,90000]});
  await sleep(1600); // vừa vào bản đồ thì bất tử 1,5 giây (chiêu trúng nhưng không mất máu, không gây trạng thái)
  // Chiêu báo trước thật: Đóng băng, Mê hoặc lên hồn sư (từ #116 là trạng thái riêng, trước đó là Choáng), Làm chậm; đứng trong vùng thì trúng.
  for(const [sp,years,dx,dy,s] of [["han_bang_dia_long",50000,26,0,"freeze"],["tuyet_vi_yeu_ho",40000,60,0,"charm"],["bang_nguyen_cu_tuong",25000,24,0,"slow"]]){
    await test(C,"clear"); await test(C,"ready"); const before=new Set(C.room.state.beasts.keys());
    const sr=await test(C,"spawn",{tier:tierOfYears(years),years,species:sp,dx,dy});
    let bid=null; await waitFor(()=>{ if(sr?.bid) return C.room.state.beasts.has(sr.bid)&&(bid=sr.bid);
      C.room.state.beasts.forEach((o,k)=>{ if(!before.has(k)&&BEASTS[o.species]?.id===sp) bid=k; }); return bid; });
    await test(C,"status",{s:"root",secs:30}); C.fxs=[];
    const r=await test(C,"tele",{i:0}), def=beastSkillOf(sp,years), tl=C.fxs.find(f=>f.k==="tele"&&f.bid===bid)??(await waitFor(()=>C.fxs.some(f=>f.k==="tele"&&f.bid===bid),800),C.fxs.find(f=>f.k==="tele"&&f.bid===bid));
    await waitFor(()=>C.fxs.some(f=>(f.k==="teleHit"||f.k==="teleEnd")&&f.bid===bid),2500);
    // Tin fx đến trước bản vá state: chờ trạng thái hiện trên PlayerState.st.
    const hit=C.fxs.find(f=>f.k==="teleHit"&&f.bid===bid), got=await waitFor(()=>(me().st&statusBit(s))!==0,800);
    ok(r?.name===def.name&&tl?.shape===def.shape&&hit?.hit.includes(C.room.sessionId)&&got,
      `${BEASTS[beastIndex(sp)].name} ${formatYears(years)}: ${def.name} (${def.shape} ${def.r}) trúng, gây ${STATUS[s].name}${def.status?.[0]?.secs?` ${def.status[0].secs} giây`:""}`
      +(got&&hit?.hit.includes(C.room.sessionId)?"":` [bid ${bid}, tele ${JSON.stringify(r)}, fx ${C.fxs.filter(f=>/^tele/.test(f.k)).map(f=>`${f.k}:${f.bid}:${f.hit??""}`).join(" ")}, st ${me().st}, sinh lực ${me().hp}/${me().maxHp}, chết ${me().dead}]`));
    await sleep(1300);
  }
  await test(C,"clear");

  // Tinh anh: mỗi vùng 1 con, niên hạn bằng mức trên của vùng (hook elite; vừa bị xóa thì rút giờ chờ hồi sinh).
  await test(C,"erespawn",{s:0});
  let L=(await test(C,"elite")).list; for(let k=0;k<20&&L.some(e=>!e.bid);k++){ await sleep(400); L=(await test(C,"elite")).list; }
  const ebad=L.filter(e=>{ const t=TB.find(x=>x[3]===e.boss), b=e.bid&&C.room.state.beasts.get(e.bid);
    return !t||e.zone!==t[0]||e.years!==parseLevelRange(t[1])[1]||!b||b.rank!==1||e.skills.join()!==BOSSES[bossIndex(e.boss)].skills.map(x=>x.name).join(); });
  ok(L.length===4&&!ebad.length,`4 tinh anh có mặt: ${L.map(e=>`${e.name} (${e.zone}, ${e.years} năm: ${e.skills?.join(" / ")})`).join("; ")}`+(ebad.length?` ✗ ${ebad.map(e=>e.boss).join(",")}`:""));

  // Thú vương theo lịch (hook king phát sự kiện như schedule.ts): trong hang, 80.000 năm, máu x96 (#264); giai đoạn 2 Cực Hàn; hạ thì có rương.
  C.boss=[]; await test(C,"king",{kop:"spawn"});
  const kingB=()=>[...C.room.state.beasts.values()].find(b=>b.rank===2);
  ok(await waitFor(()=>kingB()&&C.boss.some(m=>m.k==="spawn"),2500),`xuất hiện: "${C.boss.find(m=>m.k==="spawn")?.name}" ở ${C.boss.find(m=>m.k==="spawn")?.mapName}`);
  let ki=await test(C,"king"); const Y=M.years[1], kbase=Math.round(beastStats(Y).hp*kd.hp);
  ok(ki.bid&&inR(ki.lair,ki.x,ki.y)&&ki.years===Y&&ki.base===kbase&&ki.phase===1&&same(ki.skills,kd.skills.map(s=>s.name)),
    `thú vương trong hang (${ki.x?.toFixed(0)},${ki.y?.toFixed(0)}), ${ki.years} năm, máu ${ki.maxHp} (x${kd.hp}), chiêu ${ki.skills?.join(", ")}`);
  // Gây sát thương là thành người tham gia (mục 5.4), nên C đứng ở trại cổng, ngoài tầm thú vương.
  await test(C,"kdmg",{v:1}); ki=await test(C,"king"); C.boss=[];
  await test(C,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*KING.phaseHp)+1});
  ok(await waitFor(()=>kingB()?.phase===2,1500)&&C.boss.some(m=>m.k==="phase"&&m.title==="Cực Hàn"),`giai đoạn 2 – ${C.boss.find(m=>m.k==="phase")?.title} (${C.boss.find(m=>m.k==="phase")?.desc})`);
  ki=await test(C,"king");
  ok(same(ki.skills,[...kd.skills,...kd.phase2.skills].map(s=>s.name))&&Math.abs(ki.spd-kd.phase2.spd)<1e-9,`chiêu giai đoạn 2: ${ki.skills.join(", ")}; tốc độ x${ki.spd}`);
  const ch0=qtyOf(C,chestCode(M.king)); C.boss=[]; await test(C,"kdmg",{v:1e8});
  ok(await waitFor(()=>!kingB()&&C.boss.some(m=>m.k==="down"),2500)&&await waitFor(()=>qtyOf(C,chestCode(M.king))===ch0+1,2000),
    `hạ thú vương: nhận ${itemDef(chestCode(M.king))?.name} (${C.logs.slice(-2).join(" | ")})`);
  await test(C,"goto",{x:ar.x,y:ar.y});

  // Rơi đặc trưng: mảnh của 4 võ hồn Cực Bắc (từ 8.3 có Băng Phượng Hoàng) vào túi người hạ (hook shard cố định võ hồn), hồn hạch sao theo niên hạn.
  await test(C,"core",{r:0});
  // Hồi quy #730: seed này rơi thêm hai chồng đá khác loại trước mảnh thứ tư.
  const stone4=qtyOf(C,"da_cuong_hoa_4"), stone3=qtyOf(C,"da_cuong_hoa_3");
  await test(C,"edrop",{seed:166});
  // Bài trước nhét đầy túi bằng Hồi Hồn Đan. Chừa chỗ cho cả mảnh lẫn các loại đá rơi thẳng vào túi.
  { const free=M.shards.length+SD.EQUIP_MAPS[CBM].stones.filter(w=>w>0).length+1;
    const loose=()=>C.bag.items.filter(i=>i.vohon===null), junk=loose().filter(i=>i.code==="hoi_hon_dan").slice(0,Math.max(0,loose().length-(BAG_SLOTS-free)));
    for(const i of junk) C.room.send("discard",{id:i.id});
    ok(await waitFor(()=>loose().length<=BAG_SLOTS-free,3000),`túi C chừa chỗ cho mảnh rơi đặc trưng: ${loose().length}/${BAG_SLOTS} ô (bỏ ${junk.length} ô Hồi Hồn Đan; còn ${Object.entries(loose().reduce((m,i)=>(m[i.code]=(m[i.code]??0)+1,m),{})).map(([k,v])=>`${k}:${v}`).join(" ")})`); }
  for(let i=0;i<M.shards.length;i++){
    const [n,yr,sp]=TB[i], y=parseLevelRange(yr)[0], code=shardCode(M.shards[i]), q0=qtyOf(C,code);
    await test(C,"clear"); await test(C,"shard",{r:0,i}); const before=new Set(C.room.state.drops.keys());
    await test(C,"spawn",{tier:tierOfYears(y),years:y,species:sp[0],dx:20}); await sleep(150);
    const sl=await test(C,"slay"); await waitFor(()=>qtyOf(C,code)>q0,1500);
    const nd=[...C.room.state.drops.entries()].filter(([k])=>!before.has(k)).map(([,d])=>d), core=nd.find(d=>d.item===CORE_ITEM), ring=nd.find(d=>!d.item);
    const [lo,hi]=coreStarBand(y);
    ok(sl?.years===y&&qtyOf(C,code)===q0+1&&ring?.years===y&&core&&core.stars>=lo&&core.stars<=hi,
      `hạ ${BEASTS[beastIndex(sp[0])].name} ${formatYears(y)} (${n}): +1 mảnh ${VOHON[vohonIndex(M.shards[i])].name}, hồn hoàn ${formatYears(ring?.years??0)}, hồn hạch ${core?.stars}★ ${CORE_SETS[core?.cset]?.name}`+
      (sl?.years===y&&qtyOf(C,code)===q0+1&&ring?.years===y&&core&&core.stars>=lo&&core.stars<=hi?"":` [slay ${sl?.years}, mảnh ${qtyOf(C,code)-q0}, sao ${lo}-${hi}, đồ rơi mới ${nd.map(d=>`${d.item||"hoàn"}:${d.years}:${d.stars}`).join(" ")}]`));
  }
  ok(qtyOf(C,"da_cuong_hoa_4")===stone4+1&&qtyOf(C,"da_cuong_hoa_3")===stone3+2,
    "hồi quy túi Cực Bắc: nhận đủ 1 Đá Cường Hóa IV và 2 Đá Cường Hóa III");
  await test(C,"edrop",{off:true});
  await test(C,"shard",{r:-1}); await test(C,"core",{r:100}); await test(C,"clear");
  await test(C,"set",{rowId:act,level:v0.level,xp:v0.xp,rings:v0.rings});

  // Về Thiên Đấu Thành bằng cổng ở mép nam, xuất hiện ở cổng bắc.
  await test(C,"goto",{x:ar.x,y:ar.y}); C.portal=null;
  ok(await walk(0,1,()=>C.portal?.name,4000)&&C.portal.to===AT&&!C.portal.warn&&!C.portal.level,`tới cổng về Thiên Đấu Thành: ${C.portal?.name}`);
  await travelBy("Về Thiên Đấu Thành",AT);
  ok(Math.hypot(me().x-back.x,me().y-back.y)<1,`về Thiên Đấu Thành ở cổng bắc: ${me().x},${me().y}`);
}


/**
 * BĐ6e: Lõi Tinh Đấu và boss thế giới 100.000 năm (mục 5.3, 5.4). Hàm thuần (lịch 21:00 giờ Việt Nam, luân phiên theo ngày), dữ liệu
 * (MAPS, BOSSES, Tiled: sàn đấu, cổng bờ hồ Nội địa); với hook: bot W1 cấp thấp đi bộ vào cổng bờ hồ (đề xuất 90–100, cảnh báo đỏ,
 * vẫn đi được), báo trước / xuất hiện toàn server, 3 bot cùng đánh (máu x(1 + 0,6 × (N − 1)), bị loại khi ra khỏi sàn), điểm yếu hệ
 * (đổi võ hồn đúng hệ thì x2,5), Bá Thể (cường công phá nhanh gấp 3, không phá kịp thì boss hồi máu), tích lực Đại Địa Chấn (chỉ khống
 * chế của võ hồn Khống chế mới ngắt, đủ 3 lần thì ngắt; không ngắt thì cả sàn dính Vết thương sâu, đổi sang võ hồn phụ trợ thanh tẩy
 * được), nổi giận (x3, chiêu toàn sàn), Du Thủy (lặn không nhận sát thương, nổi lên lộ điểm yếu mẫn công), Thanh Lân Độc Vụ, chia
 * thưởng (hồn hoàn đỏ cho người nhiều nhất, rương từ 3%), 1 lần/ngày (sang ngày mới đặt lại), mở rương (hồn cốt, mảnh UR, hồn hạch
 * 5–6★), lặn xuống hồ sau 15 phút, đăng xuất ở Lõi thì lần sau về bờ hồ Nội địa.
 * #118: chiêu toàn sàn (Bạo Nộ, Thanh Lân Độc Vụ, Đại Địa Chấn) có vòng an toàn (đứng trong vòng thì không trúng); Du Thủy lặn ra giữa
 * hồ (điểm `lake`), báo trước chỗ nổi lên (tin dive sx/sy) và nổi lên đúng chỗ đó khi hết giờ lặn.
 */
async function loiTinhDauTest(){
  console.log("[BĐ6e] Lõi Tinh Đấu: boss thế giới, cơ chế đổi võ hồn, chia thưởng, 1 lần/ngày, đăng xuất về Nội địa");
  const LT="loi_tinh_dau", ND="tinh_dau_noi_dia", M=MAPS[LT], VIEN="thai_than_cu_vien", MANG="thien_thanh_nguu_mang";
  const objs=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const prop=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  const DV=BOSSES[bossIndex(VIEN)], DM=BOSSES[bossIndex(MANG)];
  ok(M?.kind==="boss"&&M.name==="Lõi Tinh Đấu"&&same(M.level,[90,100])&&same(M.years,[100000,100000])&&same(M.world,[VIEN,MANG])&&M.exit===ND&&!M.king,
    "MAPS: Lõi Tinh Đấu là bản đồ boss, cấp 90–100, boss thế giới 100.000 năm luân phiên, đăng xuất về Nội địa");
  ok([DV,DM].every(d=>d?.rank===3&&beastIndex(d.species)>=0&&BONE_SKILLS[d.species]&&d.skills.length&&d.skills.every(s=>s.warn>=1))
    &&DV.world?.charge?.need===3&&DV.world.charge.skill.floor&&DV.world.armor?.he==="cuong_cong"&&DM.world?.miasma?.skill.floor&&DM.world.dive?.he==="man_cong"
    &&WORLD_SLAM.floor&&beastName(3,bossIndex(VIEN))==="Boss thế giới Thái Thản Cự Viên",
    `2 boss thế giới: ${DV?.name} (${DV?.skills.map(s=>s.name).join(", ")}; Bá Thể, Đại Địa Chấn) và ${DM?.name} (${DM?.skills.map(s=>s.name).join(", ")}; Thanh Lân Độc Vụ, Du Thủy)`);
  // #118: mọi chiêu toàn sàn có vòng an toàn, đủ thời gian đi bộ tới vòng gần nhất; teleSafe là hàm thuần.
  { const fl=[WORLD_SLAM,DV.world.charge.skill,DM.world.miasma.skill], c={shape:"circle",x:100,y:100,ang:0,r:40,w:0,arc:0};
    ok(fl.every(d=>d.floor&&d.safe?.n>0&&d.safe.r>0&&d.warn>=2.5)&&WORLD_SLAM.safe===FLOOR_SAFE.floor&&DV.world.charge.skill.safe===FLOOR_SAFE.charge
      &&teleSafe(c,100,140+TELE_PAD)&&!teleSafe(c,100,141+TELE_PAD)&&DM.world.dive.away>0,
      `chiêu toàn sàn né được: ${fl.map(d=>`${d.name} ${d.safe?.n} vòng r${d.safe?.r}, báo trước ${d.warn} giây`).join("; ")}`); }
  ok(WORLD.hp===150&&WORLD.daily===1&&WORLD.share===0.03&&WORLD_TIME==="21:00"&&WORLD.enrageSecs===600&&WORLD.lifeSecs===900&&WORLD.warnSecs===300&&KING_CHEST.ur===0
    &&[1,3,10].every(n=>Math.abs(bossHpMult(n)-(1+0.6*(n-1)))<1e-9),
    "đã chốt: máu x150 (#265), 21:00 mỗi ngày, báo trước 5 phút, nổi giận sau 10 phút, 1 lần/ngày, từ 3% có thưởng; từ BĐ6 rương thú vương không còn mảnh UR");
  const U=(h,mi=0,d=19)=>Date.UTC(2026,9,d,h,mi);
  ok(worldNext(U(13,0))===U(14,0)&&worldNext(U(14,0))===U(14,0,20)&&worldActive(U(14,5))===U(14,0)&&worldActive(U(14,0)+WORLD.lifeSecs*1000)===null
    &&worldActive(U(13,59))===null&&vnHHMM(worldNext(U(1,0)))==="21:00"&&!KING_TIMES.includes(WORLD_TIME)
    &&worldBossOn(LT,U(14,0))!==worldBossOn(LT,U(14,0,20))&&worldBossOn(LT,U(14,0))===worldBossOn(LT,U(14,0,21))&&worldBossOn("tinh_dau_noi_dia",U(14,0))===null,
    `lịch boss thế giới ${WORLD_TIME} giờ Việt Nam (không trùng ${KING_TIMES.join(" / ")}), luân phiên theo ngày: 19/10 ${worldBossOn(LT,U(14,0))}, 20/10 ${worldBossOn(LT,U(14,0,20))}`);
  const os=objs(LT), lr=os.filter(o=>o.type==="boss"), zs=os.filter(o=>o.type==="zone"), back=os.filter(o=>o.type==="portal");
  const nd=objs(ND), gate=nd.find(o=>o.type==="portal"&&prop(o,"to")===LT), arrND=nd.find(o=>o.type==="arrive"&&o.name==="tu_loi_tinh_dau"), arrLT=os.find(o=>o.type==="arrive"&&o.name==="tu_tinh_dau_noi_dia");
  // Cổng nằm trong tầng sâu nhất của Nội địa (Hắc Ám Lâm; bản ×8 chia nhiều mảnh và thêm vùng có tên cùng niên hạn, 11.5).
  const ndz=[...zonesByName(nd).values()], hacY=ndz.map(z=>z.years).sort((a,b)=>parseLevelRange(b)[0]-parseLevelRange(a)[0])[0];
  const hac={name:ndz.filter(z=>z.years===hacY).map(z=>z.name).join(" / "),rects:ndz.filter(z=>z.years===hacY).flatMap(z=>z.rects)};
  const lake=os.filter(o=>o.type==="lake");
  { const L=lr[0]; ok(lake.length===1&&lake[0].point&&L&&lake[0].x>L.x+L.width,`Tiled: điểm giữa hồ "${lake[0]?.name}" (${lake[0]?.x},${lake[0]?.y}) phía đông sàn đấu (#118: Du Thủy lặn ra đây)`); }
  ok(lr.length===1&&M.world.includes(prop(lr[0],"boss"))&&zs.length===1&&prop(zs[0],"count")===0&&back.length===1&&prop(back[0],"to")===ND&&prop(back[0],"arrive")==="tu_loi_tinh_dau"
    &&gate&&!prop(gate,"level")&&prop(gate,"arrive")==="tu_tinh_dau_noi_dia"&&arrND&&arrLT&&inZone(hac,gate.x+gate.width/2,gate.y+gate.height/2),
    `Tiled: sàn đấu "${lr[0]?.name}" ${lr[0]?.width/16}×${lr[0]?.height/16} ô, không hồn thú thường, cổng về Nội địa; Nội địa có cổng "${gate?.name}" ở ${hac.name} (cấp đề xuất lấy MAPS: 90–100)`);
  if(!(await test(C,"ping"))?.enabled){ needHookSkip("bỏ qua boss thế giới (cần hook warp, king, wmech, kdmg): bật server bằng GAME_TEST=1"); return; }
  { const {now,mode}=await bossClock(C), nx=worldNext(now); if(worldActive(now)!==null||nx-now<(WORLD.warnSecs+300)*1000)
    console.log(`  ⚠ Đồng hồ lịch boss (${mode}) gần / trong khung boss thế giới (${WORLD_TIME} giờ Việt Nam): kiểm tra BĐ6e có thể trượt vì lịch, chạy lại sau ${WORLD.lifeSecs/60} phút.`); }

  const C0=C, W1=await bot("Thái Thản","cuu_tinh_that_sat_kiem",{sex:0,hair:2,hairCol:1,outfitCol:0}),
    W2=await bot("Ngưu Mãng","u_minh_linh_mieu",{sex:1,hair:1,hairCol:4,outfitCol:2}), W3=await bot("Thanh Tẩy","xuc_xich",{sex:0,hair:3,hairCol:0,outfitCol:5});
  const W=[W1,W2,W3], mo=b=>b.room.state.players?.get(b.room.sessionId), sid=b=>b.room.sessionId;
  const rowOf=(b,v)=>b.owned.list.find(x=>x.vohon===v)?.rowId;
  /** Đổi võ hồn ra trận của `b` sang võ hồn mã `v` (switch theo ô đội hình). */
  async function swTo(b,v){ const r=rowOf(b,v), slot=b.owned.team.indexOf(r); if(b.owned.active===r) return true; await waitFor(()=>!(mo(b)?.swCd>0),SWITCH_CD*1000+500);
    b.room.send("switch",{slot}); return await waitFor(()=>b.owned.active===r&&VOHON[mo(b).vh]?.id===v,2000); }
  /** Vào Lõi Tinh Đấu bằng hook warp (đi cổng ẩn), đứng ở trại cổng. */
  async function warpIn(b){ b.travel=null; await test(b,"warp",{mapId:LT,x:arrLT.x,y:arrLT.y}); await waitFor(()=>b.travel,3000);
    await b.room.leave(); await sleep(300); b.mapId=LT; await enter(b); await waitFor(()=>mo(b)&&b.owned&&b.bag); return b.room.state.mapId===LT; }
  C=W1;
  try{
    await waitFor(()=>W.every(b=>mo(b)&&b.owned&&b.bag));
    // W1 (cấp thấp) đi bộ vào cổng bờ hồ ở Nội địa.
    W1.travel=null; await test(W1,"warp",{mapId:ND,x:arrND.x,y:arrND.y}); await waitFor(()=>W1.travel,3000);
    await W1.room.leave(); await sleep(300); W1.mapId=ND; await enter(W1); await waitFor(()=>mo(W1)&&W1.owned&&W1.bag);
    ok(W1.room.state.mapId===ND&&Math.hypot(me().x-arrND.x,me().y-arrND.y)<1,`Nội địa: đứng ở bến bờ hồ (${me().x},${me().y})`);
    ok(await walk(1,0,()=>W1.portal?.name,5000)&&W1.portal.name==="Đi Lõi Tinh Đấu",`đi bộ tới cổng bờ hồ: ${JSON.stringify(W1.portal)}`);
    ok(W1.portal?.to===LT&&W1.portal.toName==="Lõi Tinh Đấu"&&same(W1.portal.level,[90,100])&&W1.portal.warn&&me().level<90,
      `hộp cổng: đề xuất cấp 90–100, cấp ${me().level} có cảnh báo đỏ (chặn mềm)`);
    await travelBy("Đi Lõi Tinh Đấu",LT);
    ok(Math.hypot(me().x-arrLT.x,me().y-arrLT.y)<1,`dưới cấp vẫn vào được, xuất hiện ở trại cổng Lõi Tinh Đấu: ${me().x},${me().y}`);
    await sleep(1500); ok([...W1.room.state.beasts.values()].every(b=>b.rank===3),"Lõi Tinh Đấu không có hồn thú thường (chỉ boss thế giới)");

    // Báo trước toàn server: C0 ở bản đồ khác nhận đếm ngược "Boss thế giới …".
    C0.boss=[]; W1.boss=[];
    await test(W1,"king",{kop:"warn",s:120,mapId:LT,boss:VIEN});
    ok(await waitFor(()=>C0.boss.some(m=>m.k==="warn"&&m.world)&&W1.boss.some(m=>m.k==="warn"),1500),
      `báo trước toàn server: C (${C0.room.state.mapId}) nhận "${C0.boss.find(m=>m.k==="warn")?.name} sau ${C0.boss.find(m=>m.k==="warn")?.in} giây ở ${C0.boss.find(m=>m.k==="warn")?.mapName}"`);
    ok(C0.boss.find(m=>m.k==="warn")?.here===false&&W1.boss.find(m=>m.k==="warn")?.here===true&&W1.boss.find(m=>m.k==="warn")?.name==="Boss thế giới Thái Thản Cự Viên","đếm ngược: C ở bản đồ khác, W1 ở đúng bản đồ");
    ok(await warpIn(W2)&&await waitFor(()=>W2.boss.some(m=>m.k==="warn"&&m.in<=120&&m.in>90),1500),`W2 vào Lõi giữa lúc chờ: nhận đếm ngược còn lại (${W2.boss.find(m=>m.k==="warn")?.in} giây)`);
    const bossB=()=>[...W1.room.state.beasts.values()].find(b=>b.rank===3);
    C0.boss=[];
    await test(W1,"king",{kop:"spawn",mapId:LT,boss:VIEN});
    ok(await waitFor(()=>bossB()&&C0.boss.some(m=>m.k==="spawn"&&m.world),2000),`xuất hiện: báo toàn server (C nhận "${C0.boss.find(m=>m.k==="spawn")?.name} … ${C0.boss.find(m=>m.k==="spawn")?.mapName}")`);
    let ki=await test(W1,"king"); const LR=ki.lair, inL=(x,y)=>x>=LR.x&&x<=LR.x+LR.w&&y>=LR.y&&y<=LR.y+LR.h, Y=100000;
    const base=Math.round(beastStats(Y).hp*WORLD.hp);
    ok(ki.bid&&ki.rank===3&&ki.boss===VIEN&&inL(ki.x,ki.y)&&ki.years===Y&&ki.base===base&&ki.maxHp===base&&Math.abs(ki.dmg-beastStats(Y).dmg*WORLD.dmg)<1e-6&&ki.phase===1&&ki.life>WORLD.lifeSecs-5,
      `${beastName(3,bossIndex(VIEN))} trên sàn đấu, ${ki.years} năm, máu x${WORLD.hp} = ${ki.maxHp}, sát thương x${WORLD.dmg}, lặn xuống hồ sau ${Math.round(ki.life)} giây`);
    ok(await warpIn(W3)&&await waitFor(()=>W3.boss.some(m=>m.k==="here"&&m.here&&m.world&&m.rageIn>WORLD.enrageSecs-60),1500),`W3 vào khi boss đang ở: nhận thời gian còn lại và đồng hồ nổi giận (${Math.round(W3.boss.find(m=>m.k==="here")?.rageIn??0)} giây)`);
    // Cấp 100 cho mọi võ hồn của 3 bot (chịu được sát thương boss 100.000 năm), giữ boss đứng yên, hoãn mọi cơ chế để thử từng cái.
    const R9=[400,700,1700,5000,12000,20000,50000,100000,100000];
    for(const b of W) for(const v of b.owned.list) await test(b,"set",{rowId:v.rowId,level:100,xp:0,rings:R9});
    await test(W1,"wmech",{m:"hold",secs:300}); await test(W1,"wmech",{m:"timers"});
    /** Đưa `b` vào sàn cạnh boss (thử nhiều chỗ quanh boss). */
    async function intoLair(b,dx,dy){ const t=bossB(); for(let k=0;k<24;k++){ const a=k*Math.PI/6, r=k<12?1:1.6, x=Math.round(t.x+dx*r*Math.cos(a)-dy*Math.sin(a)), y=Math.round(t.y+dx*r*Math.sin(a)+dy*Math.cos(a));
      if(!inL(x,y)) continue; await test(b,"goto",{x,y}); const q=mo(b); if(Math.hypot(q.x-x,q.y-y)<1) return true; } return false; }
    const outLair=async b=>{ await test(b,"goto",{x:arrLT.x,y:arrLT.y}); return !inL(mo(b).x,mo(b).y); };
    /** Chiêu toàn sàn (#118): `s` là một vòng an toàn thì đưa `b` vào tâm vòng; null thì đưa `b` tới chỗ trong sàn ngoài mọi vòng `safe`. */
    const inSafe=(safe,x,y)=>safe.some(q=>teleSafe(q,x,y));
    async function placeFloor(b,safe,s){
      if(s){ await test(b,"goto",{x:s.x,y:s.y}); return Math.hypot(mo(b).x-s.x,mo(b).y-s.y)<1; }
      if(inL(mo(b).x,mo(b).y)&&!inSafe(safe,mo(b).x,mo(b).y)) return true;
      const t=bossB(); for(let k=0;k<48;k++){ const a=k*Math.PI/8, r=40+20*Math.floor(k/16), x=Math.round(t.x+r*Math.cos(a)), y=Math.round(t.y+r*Math.sin(a));
        if(!inL(x,y)||inSafe(safe,x,y)) continue; await test(b,"goto",{x,y}); if(Math.hypot(mo(b).x-x,mo(b).y-y)<1) return true; }
      return false; }
    /** Vòng an toàn của chiêu toàn sàn `name` vừa báo trước (fx tele của W1). */
    const safeOf=async name=>{ await waitFor(()=>W1.fxs.some(f=>f.k==="tele"&&f.name===name),1500); return W1.fxs.findLast(f=>f.k==="tele"&&f.name===name)?.safe??[]; };
    /** Vòng an toàn hợp lệ: đủ `n` vòng bán kính `r`, tâm trong sàn, không chồng nhau. */
    const safeOk=(safe,def)=>safe.length===def.safe.n&&safe.every((q,i)=>q.r===def.safe.r&&inL(q.x,q.y)&&safe.every((o,j)=>j===i||Math.hypot(o.x-q.x,o.y-q.y)>=2*q.r));
    ok(await intoLair(W1,40,0)&&await intoLair(W2,-40,0)&&await intoLair(W3,0,30),"3 bot vào sàn đấu cạnh boss");
    await test(W1,"kdmg",{v:1}); ki=await test(W1,"king");
    ok(ki.engaged&&ki.n===3&&ki.parts.length===3&&ki.maxHp===Math.round(base*bossHpMult(3))&&bossB().parts===3,`W1 đánh: cả 3 người trong sàn thành người tham gia, máu tối đa ${base} -> ${ki.maxHp} (x${bossHpMult(3)})`);
    ok(await outLair(W3),"W3 ra khỏi sàn"); const r0=ki.hp/ki.maxHp; await test(W1,"etick",{s:WORLD.outSecs+1}); ki=await test(W1,"king");
    ok(ki.n===2&&!ki.parts.includes(sid(W3))&&ki.maxHp===Math.round(base*bossHpMult(2))&&Math.abs(ki.hp/ki.maxHp-r0)<0.01,`W3 ngoài sàn ${WORLD.outSecs} giây: bị loại, còn 2 người, máu ${ki.hp}/${ki.maxHp} (giữ tỉ lệ)`);
    ok(await intoLair(W3,0,30),"W3 quay lại sàn"); await test(W3,"kdmg",{v:1}); ki=await test(W1,"king"); ok(ki.n===3,`W3 đánh: lại ${ki.n} người`);

    // Điểm yếu hệ: võ hồn đúng hệ x2,5, hệ khác x0,5; W2 đổi sang võ hồn đúng hệ thì gây x2,5.
    const dealt=async(b,v)=>(await test(b,"kdmg",{v}))?.dealt;
    W1.boss=[]; await test(W1,"wmech",{m:"weak",he:"cuong_cong",secs:30});
    ok(await waitFor(()=>bossB().weak===1+HE_IDS.indexOf("cuong_cong")&&W1.boss.some(m=>m.k==="weak"&&m.he==="cuong_cong"),1000),"điểm yếu hệ Cường công hiện trên boss (BeastState.weak) và báo cả sàn");
    let d1=await dealt(W1,1000), d2=await dealt(W2,1000);
    ok(d1===1000*WORLD.weakMult&&d2===1000*WORLD.offMult,`điểm yếu Cường công: W1 (${VOHON[mo(W1).vh].name}, cường công) gây ${d1}, W2 (${VOHON[mo(W2).vh].name}, mẫn công) gây ${d2}`);
    await test(W1,"wmech",{m:"weak",he:"khong_che",secs:30}); d2=await dealt(W2,1000);
    ok(await swTo(W2,"lam_ngan_thao"),"W2 đổi sang Lam Ngân Thảo (khống chế)"); const d3=await dealt(W2,1000);
    ok(d2===1000*WORLD.offMult&&d3===1000*WORLD.weakMult,`điểm yếu Khống chế: W2 trước khi đổi gây ${d2}, sau khi đổi sang võ hồn đúng hệ gây ${d3}`);
    W1.boss=[]; await test(W1,"wmech",{m:"weak",he:"khong_che",secs:1});
    ok(await waitFor(()=>bossB().weak===0&&W1.boss.some(m=>m.k==="weakEnd"),2500)&&await dealt(W2,1000)===1000,"hết giờ điểm yếu: sát thương về bình thường");
    // Mốc máu 75%: tự hiện điểm yếu một hệ ngẫu nhiên.
    ki=await test(W1,"king"); W1.boss=[]; await test(W1,"wmech",{m:"timers",weakNext:0});
    await test(W1,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*WORLD.weakAt[0])+10}); await test(W1,"etick",{s:0.05});
    ok(await waitFor(()=>bossB().weak>0&&W1.boss.some(m=>m.k==="weak"),1500),`máu xuống dưới ${WORLD.weakAt[0]*100}%: lộ điểm yếu hệ ${W1.boss.find(m=>m.k==="weak")?.he} ${WORLD.weakSecs} giây`);
    await test(W1,"wmech",{m:"weak",secs:1}); await test(W1,"wmech",{m:"timers"}); ok(await waitFor(()=>bossB().weak===0,2500),"điểm yếu hết giờ trước khi thử Bá Thể");

    // Bá Thể: khiên 6% máu tối đa; cường công phá nhanh gấp 3; vỡ khiên thì phần dư vào máu; hết giờ chưa vỡ thì boss hồi máu.
    ki=await test(W1,"king"); W1.boss=[]; await test(W1,"wmech",{m:"armor"}); let ka=await test(W1,"king"); const sh0=ka.world.shield;
    ok(sh0===Math.round(ka.maxHp*DV.world.armor.pct)&&bossB().shield===sh0&&W1.boss.some(m=>m.k==="armor"),`Bá Thể: khiên ${sh0} (${DV.world.armor.pct*100}% máu tối đa ${ka.maxHp})`);
    await test(W2,"kdmg",{v:100}); let kb=await test(W1,"king"); await test(W1,"kdmg",{v:100}); let kc=await test(W1,"king");
    ok(kb.world.shield===sh0-100&&kc.world.shield===sh0-100-100*DV.world.armor.mult&&kc.hp===ka.hp,`W2 (khống chế) đánh 100 -> khiên −100; W1 (cường công) đánh 100 -> khiên −${100*DV.world.armor.mult}; máu không đổi (${kc.hp})`);
    const rest=kc.world.shield; W1.boss=[]; await test(W1,"kdmg",{v:Math.ceil(rest/DV.world.armor.mult)+500}); kc=await test(W1,"king");
    ok(kc.world.shield===0&&bossB().shield===0&&W1.boss.some(m=>m.k==="armorBreak")&&kc.hp<ka.hp&&ka.hp-kc.hp<=500+1,`W1 phá vỡ Bá Thể: phần dư vào máu (${ka.hp} -> ${kc.hp})`);
    await test(W1,"wmech",{m:"armor"}); ka=await test(W1,"king"); W1.boss=[]; await test(W1,"etick",{s:DV.world.armor.secs+0.5}); kc=await test(W1,"king");
    ok(kc.world.shield===0&&kc.hp===Math.min(kc.maxHp,ka.hp+ka.world.shield)&&W1.boss.some(m=>m.k==="armorEnd"),`Bá Thể hết ${DV.world.armor.secs} giây chưa vỡ: boss hồi ${kc.hp-ka.hp} máu`);

    // Tích lực Đại Địa Chấn: boss miễn khống chế; chỉ khống chế của võ hồn Khống chế mới tính, đủ 3 lần thì ngắt, boss Choáng.
    await test(W3,"status",{s:"root",secs:3}); ki=await test(W1,"king");
    ok(VOHON[mo(W3).vh].id==="xuc_xich"&&!ki.st.includes("root"),"boss thế giới không nhận khống chế (W3 Xúc Xích gây Trói: bị bỏ)");
    ok(await swTo(W1,"lam_ngan_thao"),"W1 đổi sang Lam Ngân Thảo (khống chế)");
    await test(W1,"wmech",{m:"hold",secs:0}); W1.boss=[]; await test(W1,"wmech",{m:"charge"}); ki=await test(W1,"king");
    ok(ki.charge&&ki.cast==="Đại Địa Chấn"&&W1.boss.some(m=>m.k==="charge"&&m.need===3)&&await waitFor(()=>bossB().chg,1000),
      `boss tích lực ${ki.cast} (${DV.world.charge.skill.warn} giây, cần ${DV.world.charge.need} lần khống chế; BeastState.chg bật)`);
    await test(W3,"status",{s:"stun"}); ki=await test(W1,"king"); const b0=ki.world.brk;
    await test(W1,"status",{s:"stun"}); await sleep(350); await test(W1,"status",{s:"root"}); await sleep(350); await test(W2,"status",{s:"silence"});
    ki=await test(W1,"king");
    ok(b0===0&&!ki.charge&&ki.st.includes("stun")&&W1.boss.some(m=>m.k==="broken")&&W1.boss.filter(m=>m.k==="brk").length===3&&await waitFor(()=>!bossB().chg,1000),
      `W3 (phụ trợ) khống chế không tính (${b0}/3); W1, W1, W2 (khống chế) 3 lần: ngắt, boss Choáng ${DV.world.charge.stun} giây`);
    // Không ngắt: cả sàn trúng Vết thương sâu (Phá giáp 3 tầng 30 giây); W3 đổi sang võ hồn phụ trợ đầy năng lượng tiên cơ thì thanh tẩy.
    await swTo(W3,"lam_ngan_thao");
    for(const b of W) await test(b,"set",{rowId:b.owned.active,level:100,xp:0,rings:R9});
    await test(W1,"wmech",{m:"hold",secs:0}); W1.boss=[]; W1.hurts=[]; W1.fxs=[]; await test(W1,"wmech",{m:"charge"});
    { const sf=await safeOf("Đại Địa Chấn"); let pl=true; for(const b of W) pl=await placeFloor(b,sf,null)&&pl;
      ok(safeOk(sf,DV.world.charge.skill)&&pl,`Đại Địa Chấn có ${sf.length} vòng an toàn trong sàn (${sf.map(q=>`${q.x},${q.y}`).join("; ")}); 3 bot đứng ngoài vòng`);
      // Tin `boss` (client xin lại lúc vào phòng): nhận lại `here` và vùng chiêu toàn sàn đang báo trước (thời gian còn lại).
      W3.boss=[]; W3.fxs=[]; W3.room.send("boss");
      ok(await waitFor(()=>W3.boss.some(m=>m.k==="here"&&m.here&&m.world)&&W3.fxs.some(f=>f.k==="tele"&&f.name==="Đại Địa Chấn"&&same(f.safe,sf)&&f.t<DV.world.charge.skill.warn&&f.warn===DV.world.charge.skill.warn),1500),
        `xin lại tin boss (người vừa vào): nhận "here" và vùng ${DV.world.charge.skill.name} đang báo trước kèm vòng an toàn (còn ${W3.fxs.find(f=>f.k==="tele")?.t?.toFixed(1)} giây)`);
      W3.boss=[]; W3.room.send("boss"); await sleep(400);
      ok(!W3.boss.some(m=>m.k==="here"),"xin lại tin boss lần nữa trong 1 giây: server bỏ (chặn lặp)"); }
    ok(await waitFor(()=>W1.boss.some(m=>m.k==="chargeHit"),DV.world.charge.skill.warn*1000+1500)&&await waitFor(()=>!bossB().chg,1000),"không ngắt kịp: Đại Địa Chấn trúng cả sàn (hết cờ tích lực)");
    await test(W1,"wmech",{m:"hold",secs:300}); await sleep(200);
    const armorBit=statusBit("armor");
    ok(W.every(b=>mo(b).st&armorBit)&&W1.hurts.length>0,`3 người trong sàn dính Vết thương sâu (${STATUS.armor.name} 3 tầng), W1 mất máu`);
    await sleep(1100); await test(W3,"energy",{v:TIEN_CO_MAX}); const sl=W3.owned.team.indexOf(rowOf(W3,"xuc_xich")); await waitFor(()=>!(mo(W3)?.swCd>0),SWITCH_CD*1000+500);
    W3.room.send("switch",{slot:sl}); await waitFor(()=>!(mo(W3).st&armorBit),2000);
    ok(!(mo(W3).st&armorBit)&&mo(W1).st&armorBit,`W3 đổi sang Xúc Xích (phụ trợ) đầy năng lượng: tiên cơ thanh tẩy Vết thương sâu; W1 chưa thanh tẩy vẫn còn`);

    // Nổi giận sau 10 phút: sát thương x3, nhanh hơn, chiêu toàn sàn Bạo Nộ. Nổi giận đúng lúc đang tích lực thì hủy tích lực (hết cờ chg,
    // client thôi nhắc ngắt).
    await test(W1,"wmech",{m:"hold",secs:0}); await test(W1,"wmech",{m:"charge"}); const chg0=await waitFor(()=>bossB().chg,1000);
    W1.boss=[]; W1.fxs=[]; await test(W1,"wmech",{m:"rage"}); await waitFor(()=>bossB().phase===2,1500); ki=await test(W1,"king");
    ok(chg0&&!ki.charge&&!bossB().chg,"nổi giận giữa lúc tích lực: hủy tích lực, BeastState.chg tắt");
    ok(ki.phase===2&&ki.world.rage&&Math.abs(ki.now-ki.dmg*WORLD.rageDmg)<1e-6&&Math.abs(ki.spd-WORLD.rageSpd)<1e-9&&W1.boss.some(m=>m.k==="rage")&&W1.fxs.some(f=>f.k==="roar"),
      `nổi giận (${Math.round(ki.life)} giây còn lại): sát thương ${ki.dmg.toFixed(0)} -> ${ki.now.toFixed(0)} (x${WORLD.rageDmg}), tốc độ x${ki.spd}`);
    await test(W1,"wmech",{m:"hold",secs:0}); W1.fxs=[]; await test(W1,"wmech",{m:"slam"});
    // #118: W2 đứng vào một vòng an toàn, W1 và W3 đứng ngoài mọi vòng (vẫn trong sàn).
    const sfS=await safeOf("Bạo Nộ"), plS=await placeFloor(W2,sfS,sfS[0])&&await placeFloor(W1,sfS,null)&&await placeFloor(W3,sfS,null);
    ok(safeOk(sfS,WORLD_SLAM)&&plS,`Bạo Nộ có ${sfS.length} vòng an toàn bán kính ${WORLD_SLAM.safe.r} trong sàn, rải theo bề ngang (${sfS.map(q=>`${q.x},${q.y}`).join("; ")}); W2 vào vòng đầu`);
    ok(await waitFor(()=>W1.fxs.some(f=>f.k==="teleHit"&&f.name==="Bạo Nộ"),(KING.roarSecs+WORLD_SLAM.warn)*1000+1500),"Bạo Nộ tung (sau tiếng gầm nổi giận)");
    await test(W1,"wmech",{m:"hold",secs:300});
    const tf=W1.fxs.find(f=>f.k==="tele"&&f.name==="Bạo Nộ"), th=W1.fxs.find(f=>f.k==="teleHit"&&f.name==="Bạo Nộ");
    ok(tf&&tf.shape==="line"&&tf.r===LR.w&&tf.w===LR.h&&tf.x===LR.x&&th.hit.includes(sid(W1))&&th.hit.includes(sid(W3))&&same(th.safe,sfS),`chiêu toàn sàn: vùng phủ đúng sàn đấu ${LR.w}×${LR.h}, W1 và W3 ngoài vòng an toàn trúng`);
    ok(!th.hit.includes(sid(W2)),`W2 đứng trong vòng an toàn lúc Bạo Nộ nổ: không trúng (trúng: ${th.hit.length} người)`);

    // Chia thưởng: W1 nhiều nhất (hồn hoàn đỏ 100.000 năm + rương), W2 từ 3% (hồn hoàn + rương), W3 dưới 3% (không thưởng).
    const chestOf=(b,id)=>qtyOf(b,chestCode(id)), ringsY=b=>(b.bag?.items??[]).filter(i=>i.code===RING_ITEM).map(i=>i.years);
    for(const b of W) await test(b,"set",{rowId:b.owned.active,level:100,xp:0,rings:R9});
    ki=await test(W1,"king"); const prev2=(ki.list.find(x=>x.id===sid(W2))?.pct??0)/100*ki.total, want2=Math.floor(0.1*(ki.total+ki.hp)-prev2);
    if(want2>0) await test(W2,"kdmg",{v:want2});
    const drops0=W1.room.state.drops.size; W1.boss=[]; C0.chats=[]; for(const b of W) b.logs=[];
    await test(W1,"kdmg",{v:1e9});
    ok(await waitFor(()=>!bossB()&&W1.boss.some(m=>m.k==="down"),2000),"hạ boss thế giới");
    const dn=W1.boss.find(m=>m.k==="down"), p1=dn?.list.find(x=>x.id===sid(W1))?.pct, p2=dn?.list.find(x=>x.id===sid(W2))?.pct, p3=dn?.list.find(x=>x.id===sid(W3))?.pct;
    ok(dn?.top===mo(W1).name&&p1>p2&&p2>=3&&p3<3,`đóng góp: W1 ${p1}%, W2 ${p2}%, W3 ${p3}%`);
    ok(await waitFor(()=>chestOf(W1,VIEN)===1&&chestOf(W2,VIEN)===1,2500)&&ringsY(W1).includes(WORLD_RING.top)
      &&ringsY(W2).some(y=>y===WORLD_RING.top||(y>=WORLD_RING.black[0]&&y<=WORLD_RING.black[1])),
      `W1 nhận hồn hoàn đỏ ${formatYears(WORLD_RING.top)} và rương; W2 nhận hồn hoàn ${formatYears(ringsY(W2).at(-1)??0)} và rương (${W1.logs.find(t=>/Nhận hồn hoàn/.test(t))})`);
    ok(chestOf(W3,VIEN)===0&&!ringsY(W3).length&&/cần từ 3% mới nhận thưởng/.test(W3.logs.join("\n")),`W3 dưới 3%: không nhận hồn hoàn, rương ("${W3.logs.find(t=>/cần từ/.test(t))}")`);
    ok(W1.room.state.drops.size===drops0,"boss thế giới không rơi hồn hoàn xuống đất (vào thẳng túi)");
    ok(await waitFor(()=>C0.chats.some(m=>/Boss thế giới Thái Thản Cự Viên ở Lõi Tinh Đấu đã bị hạ/.test(m.text)),1500),`toàn server được báo: "${C0.chats.find(m=>/bị hạ/.test(m.text))?.text}"`);
    let cl=await test(W1,"claims"); ok(cl.w===1&&cl.wdb===1&&cl.n===0&&cl.db===0,`lượt boss thế giới hôm nay ${cl.w}/${WORLD.daily} (DB ${cl.wdb}), lượt thú vương không đổi (${cl.n})`);

    // Mở rương: hồn cốt 100.000 năm loài gốc, mảnh UR, hồn hạch 5–6★ bộ bất kỳ.
    { const it=()=>W1.bag.items.find(i=>i.code===chestCode(VIEN)), bn=bonesOf(W1).length, ur0=qtyOf(W1,shardCode("hao_thien_chuy")), cc0=(W1.bag.items.filter(i=>i.code===CORE_ITEM)).length;
      await test(W1,"chest",{bone:0,i:0,n:2,s:1}); const l=W1.logs.length; W1.room.send("open",{id:it().id}); await waitFor(()=>W1.logs.length>l&&chestOf(W1,VIEN)===0,1500); await sleep(150);
      const nb=bonesOf(W1).find(i=>i.years===Y&&i.stats?.beast===VIEN&&i.stats?.slot===BONE_SLOTS[1].id), nc=W1.bag.items.filter(i=>i.code===CORE_ITEM).slice(cc0);
      ok(chestOf(W1,VIEN)===0&&bonesOf(W1).length===bn+1&&nb&&qtyOf(W1,shardCode("hao_thien_chuy"))===ur0+2&&nc.length===1&&nc[0].stars>=WORLD_CHEST.stars[0]&&nc[0].stars<=WORLD_CHEST.stars[1],
        `mở rương boss thế giới: ${W1.logs.at(-1)}`);
      await test(W1,"chest",{off:1}); }

    // Boss của ngày hôm sau (luân phiên): Thiên Thanh Ngưu Mãng; hôm nay đã nhận thưởng thì W1 vẫn đánh được nhưng không nhận gì.
    W1.logs=[]; await test(W1,"king",{kop:"spawn",mapId:LT,boss:MANG}); await waitFor(()=>bossB(),1500); ki=await test(W1,"king");
    ok(ki.boss===MANG&&ki.rank===3&&ki.maxHp===base,`boss thế giới thứ hai: ${beastName(3,bossIndex(MANG))} (${ki.skills?.join(", ")})`);
    await test(W1,"wmech",{m:"hold",secs:300}); await test(W1,"wmech",{m:"timers"});
    await intoLair(W1,40,0); await intoLair(W2,-40,0); await test(W1,"kdmg",{v:1});
    ok(/Hôm nay đã hết lượt nhận thưởng boss thế giới/.test(W1.logs.join("\n")),`vào giao chiến khi đã nhận thưởng hôm nay: nhắc "${W1.logs.find(t=>/hết lượt/.test(t))}"`);
    // Du Thủy: lặn không nhận sát thương; nổi lên chỗ khác, lộ điểm yếu Mẫn công.
    const pos0=[bossB().x,bossB().y]; W1.boss=[]; const wd=await test(W1,"wmech",{m:"dive"});
    ok(await waitFor(()=>bossB().dive,1000)&&await dealt(W1,1000)===0&&W1.boss.some(m=>m.k==="dive"),"Du Thủy: boss lặn xuống hồ, đánh không mất máu");
    // #118: lặn ra giữa hồ (điểm `lake`), chỗ nổi lên báo trước cho cả phòng ngay lúc lặn.
    await waitFor(()=>W1.boss.some(m=>m.k==="dive")&&W2.boss.some(m=>m.k==="dive"),1500);
    const dv=W1.boss.find(m=>m.k==="dive"), dv2=W2.boss.findLast(m=>m.k==="dive");
    ok(await waitFor(()=>Math.hypot(bossB().x-lake[0].x,bossB().y-lake[0].y)<1,1000)&&wd.x===lake[0].x&&wd.y===lake[0].y,`Du Thủy: boss lặn ra giữa hồ (${Math.round(bossB().x)},${Math.round(bossB().y)})`);
    ok(dv&&dv.sx!==undefined&&dv2?.sx===dv.sx&&dv2?.sy===dv.sy&&inL(dv.sx,dv.sy)&&Math.hypot(dv.sx-pos0[0],dv.sy-pos0[1])>=DM.world.dive.away&&wd.surf?.x===dv.sx&&wd.surf?.y===dv.sy,
      `báo trước chỗ nổi lên cho cả phòng: ${dv?.sx},${dv?.sy} (trong sàn, cách chỗ lặn ≥ ${DM.world.dive.away})`);
    await test(W1,"etick",{s:DM.world.dive.secs+0.1});
    ok(await waitFor(()=>!bossB().dive&&bossB().weak===1+HE_IDS.indexOf("man_cong"),1000)&&bossB().x===dv?.sx&&bossB().y===dv?.sy&&W1.boss.some(m=>m.k==="surface"),
      `hết ${DM.world.dive.secs} giây lặn: nổi lên đúng chỗ đã báo (${pos0.map(Math.round)} -> ${Math.round(bossB().x)},${Math.round(bossB().y)}), lộ điểm yếu Mẫn công ${DM.world.dive.weakSecs} giây`);
    ok(await swTo(W2,"u_minh_linh_mieu")&&await dealt(W2,1000)===1000*WORLD.weakMult,"W2 đổi lại U Minh Linh Miêu (mẫn công): gây x2,5 lúc boss vừa nổi lên");
    // Thanh Lân Độc Vụ: độc toàn sàn (Trúng độc nhiều tầng 30 giây).
    for(const b of [W1,W2]) await intoLair(b,b===W1?40:-40,0);
    await test(W1,"wmech",{m:"hold",secs:0}); W1.boss=[]; W1.fxs=[]; await test(W1,"wmech",{m:"miasma"});
    const sfM=await safeOf("Thanh Lân Độc Vụ"), plM=await placeFloor(W2,sfM,sfM.at(-1))&&await placeFloor(W1,sfM,null);
    ok(safeOk(sfM,DM.world.miasma.skill)&&plM,`Thanh Lân Độc Vụ có ${sfM.length} vòng an toàn; W2 vào vòng cuối, W1 ngoài vòng`);
    ok(await waitFor(()=>W1.fxs.some(f=>f.k==="teleHit"&&f.name==="Thanh Lân Độc Vụ"),DM.world.miasma.skill.warn*1000+1500),"Thanh Lân Độc Vụ tung");
    await test(W1,"wmech",{m:"hold",secs:300}); await sleep(150);
    ok(mo(W1).st&statusBit("poison")&&!(mo(W2).st&statusBit("poison")),"W1 ngoài vòng trúng độc toàn sàn (Vết thương sâu), W2 trong vòng an toàn không trúng");
    W1.logs=[]; const c1=chestOf(W1,MANG); await test(W1,"kdmg",{v:1e9}); await waitFor(()=>!bossB(),1500); await sleep(500);
    ok(chestOf(W1,MANG)===c1&&!W1.logs.some(t=>/Nhận hồn hoàn/.test(t))&&/hết lượt nhận thưởng boss thế giới/.test(W1.logs.join("\n")),`đã nhận thưởng hôm nay: hạ boss thứ hai không nhận thêm (${WORLD.daily} lần/ngày)`);
    // Sang ngày mới (00:00 giờ Việt Nam): lượt đặt lại.
    const dy=await test(W1,"day",{shift:1}); cl=await test(W1,"claims"); W1.logs=[];
    await test(W1,"king",{kop:"spawn",mapId:LT,boss:VIEN}); await waitFor(()=>bossB(),1500); await test(W1,"wmech",{m:"hold",secs:300}); await test(W1,"wmech",{m:"timers"});
    await intoLair(W1,40,0); await test(W1,"kdmg",{v:1}); await test(W1,"kdmg",{v:1e9});
    ok(cl.w===0&&await waitFor(()=>chestOf(W1,VIEN)===1,2500)&&/lượt 1\/1/.test(W1.logs.join("\n")),`ngày ${dy.day}: lượt về 0, hạ boss lại nhận thưởng (1/1)`);
    await test(W1,"day",{shift:0});

    // 15 phút không ai hạ: lặn xuống hồ, toàn server được báo.
    await test(W1,"king",{kop:"spawn",mapId:LT,boss:VIEN}); await waitFor(()=>bossB(),1500);
    C0.chats=[]; W1.boss=[]; await test(W1,"etick",{s:WORLD.lifeSecs});
    ok(await waitFor(()=>!bossB()&&W1.boss.some(m=>m.k==="leave"&&m.world)&&C0.chats.some(m=>/lặn xuống hồ/.test(m.text)),1500),`hết ${WORLD.lifeSecs/60} phút: boss lặn xuống hồ ("${C0.chats.find(m=>/lặn xuống hồ/.test(m.text))?.text}")`);

    // Đăng xuất ở Lõi Tinh Đấu: lần sau vào ở bờ hồ Nội địa (điểm arrive của cổng về), túi đồ còn nguyên.
    const bk=bagKey(W2); await W2.room.leave(); await sleep(500);
    const m2=await post("/api/me",{token:W2.token}); W2.mapId=m2.mapId; await enter(W2); await waitFor(()=>mo(W2)&&W2.bag);
    ok(m2.mapId===ND&&W2.room.state.mapId===ND&&Math.hypot(mo(W2).x-arrND.x,mo(W2).y-arrND.y)<1&&bagKey(W2)===bk,
      `đăng xuất ở Lõi Tinh Đấu: vào lại ở bờ hồ Nội địa (${mo(W2).x},${mo(W2).y}), túi còn nguyên (rương ${chestOf(W2,VIEN)}, hồn hoàn ${ringsY(W2).join(", ")} năm)`);
  } finally { C=C0; for(const b of W) await b.room.leave().catch(()=>{}); }
}


/**
 * 7.1: tổ đội người chơi. 5 bot mới ở Thánh Hồn Thôn (P1–P5) và bot C (đang ở bản đồ khác). Hàm thuần partyXpShare; mời theo tên /
 * theo sid (bấm vào hồn sư), từ chối, mời lại cùng người, mời quá nhanh, đủ 4 người, người đã có đội; chia kinh nghiệm: 2 người trong
 * 300 pixel (+5%), người ngoài bán kính và người khác bản đồ không nhận, 3 người, giảm chênh cấp theo từng người, 40/20 cho võ hồn
 * không ra trận, một mình; ưu tiên nhặt hồn hoàn / hồn cốt / hồn hạch cho cả tổ đội, người ngoài đội không nhặt được; trưởng nhóm rời
 * thì chuyển, đuổi, nhường, còn 1 người thì giải tán; rời game quá PARTY_OFFLINE_SECS giây thì ra khỏi đội.
 */
async function partyTest(C,{ tiled, st, blocked }){
  console.log("[7.1] tổ đội người chơi: mời, chia kinh nghiệm, ưu tiên nhặt, rời / đuổi / chuyển trưởng nhóm");
  ok(partyXpShare(1)===1&&Math.abs(partyXpShare(2)-0.525)<1e-9&&Math.abs(partyXpShare(3)-1.1/3)<1e-9&&Math.abs(partyXpShare(4)-0.2875)<1e-9&&PARTY_MAX===4,
    "partyXpShare: 1 người 100%, 2 người 52,5%, 3 người 36,7%, 4 người 28,75% (tổng +5% mỗi người thêm)");
  const P=[];
  for(let i=1;i<=5;i++) P.push(await bot(`Đội ${i}`,"bich_lan_xa_hoang",{sex:i%2,hair:i%4,hairCol:i,outfitCol:i%6}));
  const [P1,P2,P3,P4,P5]=P, meP=b=>b.room.state.players.get(b.room.sessionId);
  await waitFor(()=>P.every(b=>b.party&&meP(b)&&b.owned),3000);
  ok(P.every(b=>b.party?.id===0&&b.party.members.length===0),"chưa có tổ đội: khung tổ đội trống");
  /** Gửi `party {op, …}` từ `b`; chờ khung tổ đội của `w` (mặc định chính `b`) đổi hoặc `b` nhận một dòng log. Trả các dòng log mới. */
  async function pact(b,op,extra={},w=b){ const n=w.partyMsgs, l=b.logs.length; b.room.send("party",{op,...extra}); await waitFor(()=>w.partyMsgs>n||b.logs.length>l,2000); await sleep(120); return b.logs.slice(l).join(" | "); }
  const names=b=>(b.party?.members??[]).map(m=>m.name);
  // ---- mời, từ chối, chống spam ----
  let r=await pact(P1,"invite",{name:P2.name},P2);
  ok(P2.party?.invites.some(i=>i.name===P1.name&&i.secs>0&&i.secs<=PARTY_INVITE_SECS)&&/mời bạn vào tổ đội/.test(P2.logs.join(" ")),`P2 nhận lời mời của P1 (${r})`);
  await pact(P2,"accept",{name:P1.name}); await waitFor(()=>P1.party?.members.length===2);
  ok(P1.party?.id>0&&P1.party.id===P2.party?.id&&same(names(P1),[P1.name,P2.name])&&P1.party.members[0].leader&&P2.party.invites.length===0,
    `P2 vào đội: ${names(P1).join(", ")}, P1 trưởng nhóm`);
  ok(P1.party.members.find(m=>m.name===P2.name)?.sid===P2.room.sessionId,"thành viên cùng phòng có sid (đánh dấu trên bản đồ nhỏ)");
  r=await pact(P1,"invite",{sid:P3.room.sessionId},P3); // bấm vào hồn sư cùng phòng
  ok(P3.party?.invites.some(i=>i.name===P1.name),`mời bằng cách bấm vào hồn sư (sid): ${r}`);
  await pact(P1,"invite",{name:P4.name},P4);
  await pact(P4,"decline",{name:P1.name},P1);
  ok(P4.party?.invites.length===0&&/từ chối lời mời/.test(P1.logs.join(" ")),"P4 từ chối: P1 được báo");
  r=await pact(P1,"invite",{name:P4.name}); ok(/Vừa mời người này rồi/.test(r),`mời lại ngay người vừa từ chối: ${r}`);
  r=await pact(P1,"invite",{name:C.name}); ok(/mời quá nhanh/.test(r),`mời liền 4 lần: bị chặn như chat (${r})`);
  r=await pact(P1,"invite",{name:"Không Có "+RUN}); ok(/Không có hồn sư nào/.test(r),`mời tên không có trong game: ${r}`);
  r=await pact(P1,"invite",{name:P1.name}); ok(/tự mời/.test(r),"không tự mời chính mình");
  await test(P1,"party",{pop:"rlreset"});
  await pact(P3,"accept",{name:P1.name}); await waitFor(()=>P1.party?.members.length===3);
  await pact(P1,"invite",{name:C.name},C); await pact(C,"accept",{name:P1.name}); await waitFor(()=>P1.party?.members.length===4);
  ok(P1.party?.members.length===4&&C.party?.id===P1.party.id,`4 người: ${names(P1).join(", ")}`);
  const cRow=P1.party.members.find(m=>m.name===C.name);
  ok(cRow&&!cRow.sid&&cRow.map===C.room.state.mapId&&!cRow.off,`thành viên ở bản đồ khác: không có sid, ghi bản đồ ${cRow?.map}`);
  await sleep(700); // khung tổ đội cập nhật sinh lực mỗi 0,5 giây
  ok(P1.party.members.every(m=>m.maxHp>0&&m.level>0),"khung tổ đội có cấp và sinh lực võ hồn ra trận của mọi thành viên");
  r=await pact(P1,"invite",{name:P5.name}); ok(/đủ 4 người/.test(r)&&!(P5.party?.invites.length),`mời người thứ 5: ${r}`);
  r=await pact(P5,"invite",{name:P2.name}); ok(/tổ đội khác/.test(r),`mời người đã có đội: ${r}`);
  r=await pact(P4,"accept",{name:P1.name}); ok(/không còn hiệu lực/.test(r),`chấp nhận lời mời đã từ chối: ${r}`);
  r=await pact(P2,"kick",{name:P3.name}); ok(/Chỉ trưởng nhóm/.test(r),`thành viên không đuổi được: ${r}`);
  // ---- chia kinh nghiệm ----
  const Y=400, X0=beastStats(Y).xp, LV=8;
  /** Đưa bot tới (x, y) nếu đứng được (hook goto). */
  const place=async(b,x,y)=>{ await test(b,"goto",{x,y}); return Math.hypot(meP(b).x-x,meP(b).y-y)<1; };
  /** Tìm chỗ đứng được cách (x0, y0) khoảng `d` pixel và đưa bot tới. */
  async function near(b,x0,y0,d){
    for(let a=0;a<16;a++){ const t=a*Math.PI/8; for(const k of [1,1.1,0.9,1.2]){ const x=x0+Math.cos(t)*d*k, y=y0+Math.sin(t)*d*k; if(!blocked(x,y)&&await place(b,x,y)) return true; } }
    return false;
  }
  const bx=meP(P1).x, by=meP(P1).y;
  ok(await near(P2,bx,by,40)&&await near(P3,bx,by,PARTY_XP_RANGE+80),`P2 cách P1 khoảng 40 pixel, P3 ngoài ${PARTY_XP_RANGE} pixel`);
  const benchOf=b=>b.owned.list.find(v=>v.rowId!==b.owned.active&&b.owned.team.includes(v.rowId));
  /** Đặt võ hồn ra trận cấp `lv` (kèm đủ hồn hoàn để không bình cảnh), võ hồn còn lại trong đội cấp LV, kinh nghiệm 0. */
  async function reset(b,lv=LV){
    const bn=benchOf(b);
    await test(b,"set",{rowId:b.owned.active,level:lv,xp:0,rings:Array(Math.floor(lv/10)).fill(Y)});
    if(bn) await test(b,"set",{rowId:bn.rowId,level:LV,xp:0,rings:[]});
  }
  const xpNow=b=>({a:meP(b).xp,b:benchOf(b)?.xp??0});
  /** P1 hạ một hồn thú Y năm ngay dưới chân (hook beast + slay, qua đúng killBeast); trả kinh nghiệm từng bot sau đó. */
  async function killY(list){
    for(const b of list) await reset(b,b.lv??LV);
    await test(P1,"clear"); await test(P1,"beast",{years:Y}); const k=await test(P1,"slay");
    await sleep(250); for(const b of list){ const n=b.ownedMsgs; b.room.send("vohons"); await waitFor(()=>b.ownedMsgs>n); }
    return { k, got:list.map(b=>xpNow(b)) };
  }
  const exp=(n,lv,share=XP_SHARE_ACTIVE)=>Math.round(X0*partyXpShare(n)*xpLevelScale(lv,beastLevel(Y))*share);
  ok(exp(1,LV)<xpNeed(LV)&&beastLevel(Y)>LV-10,`thử với hồn thú ${formatYears(Y)} (${X0} kinh nghiệm gốc), võ hồn cấp ${LV}: không lên cấp, không giảm chênh cấp`);
  let kk=await killY([P1,P2,P3,C]);
  const [g1,g2,g3,gc]=kk.got;
  ok(kk.k?.bid&&g1.a===exp(2,LV)&&g2.a===exp(2,LV),`2 người trong ${PARTY_XP_RANGE} pixel: mỗi người ${g1.a}/${g2.a} = ${X0} × 52,5% × 40% (một mình ${exp(1,LV)})`);
  ok(g1.b===exp(2,LV,XP_SHARE_BENCH)&&g2.b===exp(2,LV,XP_SHARE_BENCH),`võ hồn không ra trận mỗi người nhận 20%: ${g1.b}/${g2.b}`);
  ok(g3.a===0&&g3.b===0,`P3 ngoài ${PARTY_XP_RANGE} pixel không nhận (${g3.a})`);
  ok(gc.a===0&&gc.b===0,`C ở ${MAPS[C.room.state.mapId].name} (khác bản đồ) không nhận (${gc.a})`);
  ok(/Tổ đội 2 người chia kinh nghiệm/.test(P2.logs.join(" ")),"đồng đội được báo phần chia kinh nghiệm");
  // 3 người, P2 cao hơn hồn thú 15 cấp: giảm 50% riêng phần của P2.
  ok(await near(P3,bx,by,60),"P3 vào trong bán kính");
  P2.lv=25; kk=await killY([P1,P2,P3]); P2.lv=LV;
  ok(kk.got[0].a===exp(3,LV)&&kk.got[2].a===exp(3,LV)&&kk.got[1].a===exp(3,25),
    `3 người: ${kk.got.map(x=>x.a).join("/")}; P2 cấp 25 giảm 50% theo chênh cấp của riêng mình (${exp(3,25)})`);
  // ---- nhiệm vụ 6.2: hạ hồn thú cùng đội tính cho đồng đội được chia kinh nghiệm ----
  { const zone=tiled.layers.flatMap(l=>l.objects??[]).find(o=>o.type==="zone"&&o.name===questChain(QUEST_STARTER).steps[1].goals[0].zone);
    const step=questChain(QUEST_STARTER).steps.findIndex(s=>s.goals.some(g=>g.k==="kill"&&g.map===st.mapId));
    const zx=zone.x+zone.width/2, zy=zone.y+zone.height/2;
    ok(step>=0&&(await place(P1,zx,zy)||await near(P1,zx,zy,20)),`P1 ở ${zone.name} (bài ${step+1} cần hạ hồn thú ở đây)`);
    const placed=await near(P2,meP(P1).x,meP(P1).y,30)&&await near(P3,meP(P1).x,meP(P1).y,PARTY_XP_RANGE+80);
    const far=Math.hypot(meP(P3).x-meP(P1).x,meP(P3).y-meP(P1).y);
    ok(placed&&far>PARTY_XP_RANGE,`P2 đứng cạnh P1, P3 cách ${Math.round(far)} pixel (ngoài bán kính)`);
    for(const b of [P1,P2,P3]) await test(b,"quest",{step,accepted:true,prog:[0]});
    await test(P1,"clear"); await test(P1,"beast",{years:Y}); await test(P1,"slay");
    const pq=await Promise.all([P1,P2,P3].map(b=>test(b,"quest")));
    ok(same(pq.map(q=>q.quest.prog[0]),[1,1,0]),`nhiệm vụ "${questChain(QUEST_STARTER).steps[step].name}": người hạ +1, đồng đội trong bán kính +1, đồng đội ngoài bán kính 0 (${pq.map(q=>q.quest.prog[0]).join("/")})`);
    for(const b of [P1,P2,P3]) await test(b,"quest",{step:0,accepted:false,prog:[]});
    await place(P1,bx,by); await near(P2,bx,by,40); }
  // ---- ưu tiên nhặt cho cả tổ đội ----
  await test(P1,"core",{r:0,stars:2}); await test(P1,"bone",{r:0});
  await test(P1,"clear"); await test(P1,"beast",{years:1200}); const kd=await test(P1,"slay");
  await test(P1,"core",{r:100}); await test(P1,"bone",{r:-1});
  await sleep(200);
  const drops=[]; P2.room.state.drops.forEach((d,id)=>{ if(Math.hypot(d.x-kd.x,d.y-kd.y)<30&&d.owner===P1.room.sessionId&&d.years===kd.years) drops.push({id,item:d.item,party:d.party}); });
  ok(drops.length===3&&drops.every(d=>d.party===P1.party.id),`hồn hoàn, hồn cốt, hồn hạch rơi ưu tiên P1 kèm tổ đội ${P1.party.id} (${drops.map(d=>d.item||"hồn hoàn").join(", ")})`);
  ok(await near(P4,kd.x,kd.y,4),"P4 (ngoài đội) đứng cạnh đồ rơi");
  { const l=P4.logs.length; P4.room.send("pickup"); await waitFor(()=>P4.logs.length>l); ok(/thuộc về tổ đội của người hạ/.test(P4.logs.at(-1)),`P4 ngoài đội không nhặt được: ${P4.logs.at(-1)}`); }
  ok(await near(P2,kd.x,kd.y,4),"P2 (đồng đội) đứng cạnh đồ rơi");
  let picked=0; // hồn hoàn 400 năm của các lần hạ ở trên cũng nằm đây (cùng ưu tiên tổ đội): nhặt hết
  for(let i=0;i<drops.length+3;i++){ const n=P2.bagMsgs??0; P2.room.send("pickup"); if(await waitFor(()=>(P2.bagMsgs??0)>n,1500)) picked++; await sleep(100); }
  const has=c=>looseOf(P2).some(i=>i.code===c&&(c===CORE_ITEM||i.years===1200));
  ok(picked>=drops.length&&has(RING_ITEM)&&has(BONE_ITEM)&&has(CORE_ITEM),`P2 nhặt được cả ${picked} món của P1 trong 15 giây đầu (hồn hoàn, hồn cốt, hồn hạch)`);
  // ---- trưởng nhóm rời thì chuyển, đuổi, nhường, giải tán ----
  await pact(P1,"leave",{},P2); await waitFor(()=>P2.party?.members.length===3);
  ok(P1.party?.id===0&&P2.party?.members.find(m=>m.leader)?.name===P2.name&&/trở thành trưởng nhóm/.test(P2.logs.join(" ")),
    `trưởng nhóm P1 rời: P2 thành trưởng nhóm (${names(P2).join(", ")})`);
  { // P1 giờ một mình: so +5% (2 người nhận tổng 105% của một mình).
    const l=P1.logs.length, solo=await killY([P1]);
    ok(solo.got[0].a===exp(1,LV)&&Math.abs(2*exp(2,LV)-1.05*exp(1,LV))<=1,`một mình nhận ${solo.got[0].a}; 2 người cùng chia tổng ${2*exp(2,LV)} ≈ 105%`);
    ok(!/Tổ đội/.test(P1.logs.slice(l).join(" ")),"không còn tổ đội: không chia kinh nghiệm");
  }
  await pact(P2,"kick",{name:P3.name},P3); await waitFor(()=>P3.party?.id===0);
  ok(P3.party?.id===0&&/mời ra khỏi tổ đội/.test(P3.logs.join(" "))&&same(names(P2),[P2.name,C.name]),`trưởng nhóm đuổi P3: còn ${names(P2).join(", ")}`);
  await pact(P2,"lead",{name:C.name},C); await waitFor(()=>C.party?.members.find(m=>m.leader)?.name===C.name);
  ok(C.party?.members.find(m=>m.leader)?.name===C.name,"nhường trưởng nhóm cho C (ở bản đồ khác)");
  await pact(C,"leave",{},P2); await waitFor(()=>P2.party?.id===0);
  ok(P2.party?.id===0&&C.party?.id===0&&/giải tán/.test(P2.logs.join(" ")),"còn 1 người: tổ đội giải tán");
  // ---- rời game quá lâu ----
  await pact(P4,"invite",{name:P5.name},P5); await pact(P5,"accept",{name:P4.name}); await waitFor(()=>P4.party?.members.length===2);
  await P5.room.leave(); await waitFor(()=>P4.party?.members.find(m=>m.name===P5.name)?.off,2000);
  ok(P4.party?.members.find(m=>m.name===P5.name)?.off===true,"P5 rời game: vẫn trong đội, khung ghi đã rời");
  const ag=await test(P4,"party",{pop:"age",name:P5.name,s:PARTY_OFFLINE_SECS}); await waitFor(()=>P4.party?.id===0,2000);
  ok(ag?.aged&&P4.party?.id===0&&/rời game quá lâu/.test(P4.logs.join(" ")),`quá ${PARTY_OFFLINE_SECS} giây không vào lại: ra khỏi đội, tổ đội giải tán`);
  for(const b of [P1,P2,P3,P4]) await b.room.leave();
}
