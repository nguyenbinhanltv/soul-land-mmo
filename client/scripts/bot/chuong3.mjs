// Nhóm bot chuong3 (#703 bước 4): chương 3 Hải Thần Đảo (#284). Tách nguyên văn từ bot-test.mjs.
import { readFileSync } from "node:fs";
import { post, sleep, waitFor, ok, mapUrl, bot, enter, qtyOf, bonesOf, npcSpot, talk, looseOf, test } from "./lib.mjs";
import { VOHON, vohonIndex, itemDef, formatYears, MAPS, SHARD_UNLOCK, shardCode, BONE_SLOTS, boneName, BOSSES, bossIndex, beastIndex, parseBoneSubs, npcDef, QUEST_STARTER, QUEST_CH2, QUEST_CH3, QUEST_AFTER, questChain, parseQuest, questStatus, questGoalHit, questRewardText, TONG_MON, tongDef, CAMP_MERCHANT, CAMP_PT_GAP, FUSION } from "../../../shared/data.ts";
import { campMerchantSpot } from "../../../shared/camp.ts";

/**
 * Chương 3 "Hải Thần Đảo" (#284, phần 1; BOT_ONLY=chuong3, nhóm 5 của BOT_PART): dữ liệu chuỗi (8 bài, Hải Mã Đấu La ở Bến Hải Thần,
 * Ba Tái Tây trong vùng an toàn Thánh địa Hải Thần, Hải Mã Đấu La trong vùng an toàn nhỏ ở trại, thưởng hợp lệ không mảnh UR, đủ SHARD_UNLOCK mảnh Nhu Cốt Thố); mở sau chương 2;
 * sự kiện talk / elite / king lọc theo bản đồ, `world` chỉ tính boss thế giới; đi hết 8 bài, tiến độ hai chuỗi cũ không đổi, lưu qua
 * lần vào lại. #285: chỉ bài 8 thưởng hồn cốt Thâm Hải Ma Kình đúng BossDef.years; túi thiếu một ô cho hồn cốt thì từ chối, giữ
 * tiến độ; trả được thì đúng một hồn cốt, vị trí hợp lệ, +0, chưa có dòng phụ; không nhận lần hai; vào lại còn trong túi. Bài đếm bằng sự kiện cũ (hạ hồn thú, tổ đội) thử một lần hạ thật rồi đặt đủ số đếm bằng hook quest.
 * #286: bài 9 / 10 nối vào cuối (xong 8 bài thì thấy bài 9). Bài 9: D (Yêu Hồ) và E (Nguyệt Nhận) cùng tổ đội tung Võ Hồn Dung Hợp Kỹ
 * thật; người chưa nhận không được tính, cả người mời lẫn người hưởng ứng đã nhận đều được tính. Bài 10: gia nhập tông qua hook `tong`;
 * đã có tông lúc nhận thì xong ngay, chưa có thì đếm khi gia nhập.
 */
export async function chapter3Test(){
  console.log("[#284] Chương 3: Hải Thần Đảo");
  const ch=questChain(QUEST_CH3), HT="hai_than_dao", objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const gs=npcSpot(HT,"hai_ma_dau_la"), bt=npcSpot(HT,"ba_tai_tay"), os=objsOf(HT), inR=(r,x,y)=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height;
  const sanctum=os.find(o=>o.type==="safe"&&o.name==="Thánh địa Hải Thần"), pier=os.find(o=>o.type==="safe"&&o.name==="Bến Hải Thần"), spawn=os.filter(o=>o.type==="spawn").at(-1), cm=campMerchantSpot(JSON.parse(readFileSync(mapUrl(HT),"utf8")),HT);
  ok(ch&&ch.steps.length===10&&ch.giver==="hai_ma_dau_la"&&ch.map===HT&&gs&&QUEST_AFTER[QUEST_CH3]===QUEST_CH2,
    `chuỗi "${ch?.name}": ${ch?.steps.length} bài, ${npcDef(ch?.giver)?.name} ở ${MAPS[ch?.map]?.name}, mở sau chương 2`);
  ok(new Set(ch.steps.map(x=>x.id)).size===10&&ch.steps.every(x=>x.offer.length&&x.done.length&&x.goals.length&&x.goals.every(g=>Number.isInteger(g.n)&&g.n>0&&g.text)
    &&x.reward.items.every(r=>itemDef(r.code)&&r.qty>0&&VOHON.find(v=>shardCode(v.id)===r.code)?.rarity!=="UR")),"mỗi bài có lời giao, lời trả, mục tiêu và thưởng hợp lệ (không mảnh UR)");
  ok(ch.steps.every(x=>x.goals.every(g=>(!g.map||MAPS[g.map])&&(!g.npc||g.npc===CAMP_MERCHANT||Object.keys(MAPS).some(m=>npcSpot(m,g.npc))))),"mục tiêu trỏ tới NPC, bản đồ có thật");
  const nhu=ch.steps.reduce((a,x)=>a+x.reward.items.filter(r=>r.code===shardCode("nhu_cot_tho")).reduce((b,r)=>b+r.qty,0),0);
  ok(nhu===SHARD_UNLOCK,`tổng mảnh Nhu Cốt Thố cả chuỗi = SHARD_UNLOCK (${nhu})`);
  // #285: chỉ bài cuối thưởng hồn cốt, đúng một hồn cốt Thâm Hải Ma Kình bằng niên hạn của Thâm Hải Ma Kình Vương (BossDef.years).
  const MKV=BOSSES[bossIndex("tham_hai_ma_kinh_vuong")], rb=ch.steps[7].reward.bones;
  ok(ch.steps.every((x,i)=>i===7||!x.reward.bones?.length)&&[QUEST_STARTER,QUEST_CH2].every(c=>questChain(c).steps.every(x=>!x.reward.bones?.length))
    &&rb?.length===1&&rb[0].beast==="tham_hai_ma_kinh"&&rb[0].beast===MKV?.species&&rb[0].years===MKV?.years&&beastIndex(rb[0].beast)>=0
    &&questRewardText(ch.steps[7].reward).endsWith(`1 hồn cốt Thâm Hải Ma Kình ${formatYears(MKV.years)} (vị trí ngẫu nhiên)`),
    `chỉ bài 8 thưởng hồn cốt: ${questRewardText(ch.steps[7].reward)}`);
  ok(sanctum&&bt&&inR(sanctum,bt.x,bt.y)&&pier&&inR(pier,gs.x,gs.y)&&inR(pier,gs.x,gs.y+16)&&spawn&&inR(spawn,gs.x,gs.y)&&cm&&!inR(pier,cm.x,cm.y)&&Math.hypot(cm.x-gs.x,cm.y-gs.y)>=CAMP_PT_GAP,
    `Tiled: Ba Tái Tây trong Thánh địa Hải Thần, Hải Mã Đấu La (${gs?.x},${gs?.y}) và chỗ đứng nói chuyện trong vùng an toàn nhỏ Bến Hải Thần ở trại cổng, thương nhân lưu động vẫn có chỗ (${cm?.x},${cm?.y})`);
  const [g1,,g3,,,g6,g7]=ch.steps.map(x=>x.goals), talkG=g1[1];
  ok(questGoalHit(talkG,{k:"talk",npc:CAMP_MERCHANT,map:HT})&&!questGoalHit(talkG,{k:"talk",npc:CAMP_MERCHANT,map:"tinh_dau_ngoai_vi"})
    &&questGoalHit(g3[0],{k:"elite",map:HT})&&!questGoalHit(g3[0],{k:"elite",map:"thanh_hon_thon"})&&questGoalHit(g6[0],{k:"king",map:HT})&&!questGoalHit(g6[0],{k:"king",map:"loi_tinh_dau"})
    &&questGoalHit(g7[0],{k:"world",map:"loi_tinh_dau"})&&!questGoalHit(g7[0],{k:"king",map:"loi_tinh_dau"}),"khớp sự kiện: talk / elite / king lọc theo bản đồ, world chỉ boss thế giới");
  // #286: hai bài nối vào cuối; tài khoản đã xong 8 bài (dòng `quests` cũ step 8) đọc ra bài 9 chưa nhận.
  const [g9,g10]=ch.steps.slice(8).map(x=>x.goals), sh9=ch.steps[8]?.reward.items, sh10=ch.steps[9]?.reward.items, old8=parseQuest({step:8,accepted:false,prog:[]},QUEST_CH3);
  ok(g9?.length===1&&g9[0].k==="fusion"&&!g9[0].have&&questGoalHit(g9[0],{k:"fusion"})&&!questGoalHit(g9[0],{k:"tong"})
    &&g10?.length===1&&g10[0].k==="tong"&&g10[0].have===true&&questGoalHit(g10[0],{k:"tong"})&&!questGoalHit(g10[0],{k:"fusion"})
    &&sh9?.some(r=>r.code===shardCode("u_minh_linh_mieu"))&&sh10?.some(r=>r.code===shardCode("lam_dien_ba_vuong_long")),
    `bài 9 "${ch.steps[8]?.name}" (fusion: ${questRewardText(ch.steps[8]?.reward??{honTe:0,items:[]})}), bài 10 "${ch.steps[9]?.name}" (tong, have: ${questRewardText(ch.steps[9]?.reward??{honTe:0,items:[]})})`);
  ok(old8.step===8&&questStatus(old8)==="offer","tiến độ cũ đã xong 8 bài: thành bài 9 chưa nhận");
  const D=await bot("Hải Thần","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:4}); // Yêu Hồ: cặp Yêu Nguyệt với E ở bài 9 (#286)
  const dme=()=>D.room.state.players?.get(D.room.sessionId);
  if(!(await test(D,"ping"))?.enabled){ console.log("  ⚠ bỏ qua phần server (cần hook warp, goto, quest, king…): bật server bằng GAME_TEST=1"); await D.room.leave(); return; }
  const q3=()=>D.chains[QUEST_CH3], cnt=(i=0)=>q3().prog?.[i]??0;
  async function warp(mapId,x=0,y=0,b=D){
    b.travel=null; b.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>b.travel?.mapId===mapId,4000),`warp -> ${mapId}`);
    await b.room.leave(); await sleep(300); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b);
    await waitFor(()=>b.room.state.players?.get(b.room.sessionId)&&b.bag&&b.quest&&b.chains[QUEST_CH3],3000);
  }
  /** Gửi `quest {op, chain: QUEST_CH3}`; chờ tin "quest" mới của chuỗi này. Trả dòng log cuối. */
  async function qop(op){ const was=q3(), l=D.logs.length; D.room.send("quest",{op,chain:QUEST_CH3}); await waitFor(()=>q3()!==was,1500); await sleep(60); return D.logs.slice(l).at(-1)??""; }
  const setStep=async(i,accepted=false,prog)=>{ await test(D,"quest",{chain:QUEST_CH3,step:i,accepted,prog}); await waitFor(()=>q3().step===i&&q3().accepted===accepted); };
  const atGiver=()=>test(D,"goto",{x:gs.x,y:gs.y+16}), back=async()=>{ if(D.room.state.mapId!==HT) await warp(HT,gs.x,gs.y+16); else await atGiver(); };
  async function acc(i){ const t=await qop("accept"); ok(q3().step===i&&q3().accepted,`nhận bài ${i+1} "${ch.steps[i].name}" (${t})`); }
  async function turn(i){
    const r=ch.steps[i].reward, ht=D.bag.honTe, q0=r.items.map(x=>qtyOf(D,x.code)), n=D.bagMsgs??0, t=await qop("turnin"); await waitFor(()=>(D.bagMsgs??0)>n,1500);
    ok(q3().step===i+1&&!q3().accepted&&D.bag.honTe===ht+r.honTe&&r.items.every((x,k)=>qtyOf(D,x.code)===q0[k]+x.qty),`trả bài ${i+1} "${ch.steps[i].name}": +${questRewardText(r)} (${t})`);
  }
  const full=async(i)=>{ await setStep(i,true,ch.steps[i].goals.map(g=>g.n)); ok(await waitFor(()=>q3().status==="ready"),`bài ${i+1}: đủ mục tiêu`); };
  const slayAt=async(extra)=>{ await test(D,"clear"); const r=await test(D,"beast",{dx:14,dy:0,...extra}); await test(D,"slay",{bid:r?.bid}); await sleep(200); return r?.bid; };
  /** Gọi thú vương / boss thế giới của bản đồ đang đứng (khung mới mỗi lần), D góp 1 sát thương rồi hạ. Trong vùng an toàn không gây sát thương: ở Hải Thần Đảo ra chỗ thương nhân lưu động (ngoài vùng an toàn Bến Hải Thần) trước. */
  async function slayKing(opts={}){ if(D.room.state.mapId===HT) await test(D,"goto",{x:cm.x,y:cm.y+12});
    await test(D,"king",{kop:"spawn",...opts}); const kb=()=>[...D.room.state.beasts.entries()].find(([,b])=>b.rank>=2);
    const okb=await waitFor(()=>kb(),2500); const kid=kb()?.[0];
    if(opts.mapId) { await test(D,"wmech",{m:"hold",secs:120}); await test(D,"wmech",{m:"timers"}); }
    await test(D,"kdmg",{v:1,bid:kid}); await test(D,"slay",{bid:kid}); await sleep(250);
    return okb&&!!kid;
  }
  ok(await waitFor(()=>q3(),2000)&&q3().step===0&&!q3().accepted,`tài khoản mới: có tiến độ chương 3 ở bài 1 (${JSON.stringify(q3())})`);
  await warp(HT,gs.x,gs.y+16);
  let t=await qop("accept"); ok(/Chưa mở/.test(t)&&!q3().accepted,`chưa xong chương 2: không nhận được chương 3 (${t})`);
  await test(D,"quest",{step:questChain(QUEST_STARTER).steps.length,accepted:false});
  await test(D,"quest",{chain:QUEST_CH2,step:questChain(QUEST_CH2).steps.length,accepted:false});
  ok(await waitFor(()=>D.quest.status==="done"&&D.chains[QUEST_CH2]?.status==="done"),"hook quest: đặt chuỗi tân thủ và chương 2 xong");
  // Bài 1: đã đứng ở Hải Thần Đảo nên xong mục tiêu bản đồ; nói chuyện với thương nhân lưu động ở bản đồ khác không tính.
  await acc(0); ok(cnt(0)===1&&cnt(1)===0,`nhận bài 1 ở Hải Thần Đảo: xong mục tiêu bản đồ (${JSON.stringify(q3().prog)})`);
  const cmNV=campMerchantSpot(JSON.parse(readFileSync(mapUrl("tinh_dau_ngoai_vi"),"utf8")),"tinh_dau_ngoai_vi");
  await warp("tinh_dau_ngoai_vi",cmNV.x,cmNV.y+12); ok(await talk(D,CAMP_MERCHANT)===CAMP_MERCHANT&&cnt(1)===0,`nói chuyện với thương nhân lưu động ở Tinh Đấu Ngoại vi: không tính (${JSON.stringify(q3().prog)})`);
  await warp(HT,cm.x,cm.y+12); await talk(D,CAMP_MERCHANT);
  ok(await waitFor(()=>q3().status==="ready"),`nói chuyện với thương nhân lưu động ở Bến Hải Thần: bài 1 xong (${JSON.stringify(q3().prog)})`);
  await atGiver(); await turn(0);
  // Bài 2: một lần hạ thật ở Hải Thần Đảo tính.
  await acc(1); await test(D,"clear",{all:true}); await slayAt(); ok(await waitFor(()=>cnt()===1),`bài 2: hạ hồn thú ở Hải Thần Đảo tính (${JSON.stringify(q3().prog)})`);
  await full(1); await atGiver(); await turn(1);
  // Bài 3 (elite theo bản đồ): tinh anh ở Thánh Hồn Thôn không tính, ở Hải Thần Đảo tính.
  await acc(2); const EH=(await test(D,"elite"))?.list?.[0]?.boss;
  await warp("thanh_hon_thon"); const ET=(await test(D,"elite"))?.list?.[0]?.boss;
  ok(!!EH&&!!ET,`có tinh anh ở cả hai bản đồ (${EH}, ${ET})`);
  await slayAt({boss:ET}); ok(cnt()===0,`bài 3: hạ tinh anh ở Thánh Hồn Thôn không tính (${JSON.stringify(q3().prog)})`);
  await warp(HT,gs.x,gs.y+16); await slayAt({boss:EH}); ok(await waitFor(()=>cnt()===1),`bài 3: hạ tinh anh ở Hải Thần Đảo tính (${JSON.stringify(q3().prog)})`);
  await full(2); await atGiver(); await turn(2);
  // Bài 4 (kill + fit + party, sự kiện đã thử ở chương 2): đặt đủ số đếm. Bài 5 (kill + fit): một lần hạ thật hợp cấp tính.
  await acc(3); await slayAt(); ok(cnt()===0,`bài 4: hạ một mình không tính party (${JSON.stringify(q3().prog)})`);
  await full(3); await atGiver(); await turn(3);
  await acc(4); await slayAt(); ok(await waitFor(()=>cnt()===1),`bài 5: hạ hồn thú hợp cấp ở Hải Thần Đảo tính (${JSON.stringify(q3().prog)})`);
  await full(4); await atGiver(); await turn(4);
  // Bài 6 (king theo bản đồ): thú vương Tinh Đấu Ngoại vi không tính, Thâm Hải Ma Kình Vương tính.
  await acc(5); await warp("tinh_dau_ngoai_vi");
  ok(await slayKing()&&cnt()===0,`bài 6: hạ thú vương Tinh Đấu Ngoại vi không tính (${JSON.stringify(q3().prog)})`);
  await warp(HT,gs.x,gs.y+16); ok(await slayKing(),"Thâm Hải Ma Kình Vương xuất hiện và bị hạ");
  ok(await waitFor(()=>q3().status==="ready"),`bài 6: có đóng góp khi hạ thú vương Hải Thần Đảo: xong (${JSON.stringify(q3().prog)})`);
  await atGiver(); await turn(5);
  // Bài 7 (world): thú vương thường không tính; boss thế giới ở Lõi Tinh Đấu tính.
  await acc(6); ok(await slayKing()&&cnt()===0,`bài 7: hạ thú vương Hải Thần Đảo không tính (${JSON.stringify(q3().prog)})`);
  await warp("loi_tinh_dau"); ok(await slayKing({mapId:"loi_tinh_dau",boss:"thai_than_cu_vien"}),"boss thế giới Thái Thản Cự Viên xuất hiện và bị hạ");
  ok(await waitFor(()=>q3().status==="ready")&&cnt()===1,`bài 7: có đóng góp khi hạ boss thế giới: xong (${JSON.stringify(q3().prog)})`);
  await back(); await turn(6);
  // Bài 8: gặp Ba Tái Tây trong Thánh địa Hải Thần (vùng an toàn: không giao chiến).
  await acc(7); await test(D,"goto",{x:bt.x,y:bt.y+16}); ok(Math.hypot(dme().x-bt.x,dme().y-bt.y-16)<1,`đứng cạnh Ba Tái Tây (${dme().x},${dme().y})`);
  { const l=D.logs.length; D.room.send("attack"); await waitFor(()=>D.logs.length>l,1500); ok(/Vùng an toàn/.test(D.logs.slice(l).join(" ")),`Thánh địa Hải Thần là vùng an toàn (${D.logs.slice(l).at(-1)})`); }
  ok(await talk(D,"ba_tai_tay")==="ba_tai_tay"&&await waitFor(()=>q3().status==="ready"),"nói chuyện với Ba Tái Tây: bài 8 xong");
  t=await qop("turnin"); ok(/lại gần Hải Mã Đấu La/.test(t)&&q3().step===7,`đứng ở Thánh địa: phải về Bến Hải Thần trả bài (${t})`);
  await atGiver();
  // #285: túi chỉ đủ chỗ cho vật phẩm thưởng, thiếu một ô cho hồn cốt: từ chối, giữ tiến độ, không nhận gì; bỏ thêm một ô thì trả được.
  { const r=ch.steps[7].reward, loose=()=>looseOf(D), itemSlots=r.items.reduce((a,x)=>{ const st=itemDef(x.code).stack,
      part=loose().filter(i=>i.code===x.code&&!i.lock).reduce((b,i)=>b+Math.max(0,st-i.qty),0); return a+Math.ceil(Math.max(0,x.qty-part)/st); },0);
    await test(D,"give",{code:"hoi_hon_dan",qty:D.bag.slots*itemDef("hoi_hon_dan").stack});
    ok(await waitFor(()=>loose().length===D.bag.slots,2000),`làm đầy túi ${loose().length}/${D.bag.slots} ô`);
    const drop=async(n)=>{ const k=loose().length; for(const it of loose().filter(i=>i.code==="hoi_hon_dan"&&!i.lock).slice(0,n)) D.room.send("discard",{id:it.id}); return waitFor(()=>loose().length===k-n,2000); };
    ok(await drop(itemSlots),`bỏ ${itemSlots} ô: túi còn đúng chỗ cho vật phẩm thưởng (${D.bag.slots-loose().length} ô trống)`);
    const ht=D.bag.honTe, nb=bonesOf(D).length; t=await qop("turnin");
    ok(/không đủ chỗ/.test(t)&&q3().step===7&&q3().status==="ready"&&D.bag.honTe===ht&&bonesOf(D).length===nb,`thiếu một ô cho hồn cốt: không trả được bài 8, giữ tiến độ (${t})`);
    ok(await drop(1),`bỏ thêm 1 ô (${D.bag.slots-loose().length} ô trống)`);
  }
  const bones0=new Set(bonesOf(D).map(i=>i.id)); await turn(7);
  const nb8=bonesOf(D).filter(i=>!bones0.has(i.id)), b8=nb8[0];
  ok(nb8.length===1&&b8.stats?.beast===MKV.species&&b8.years===MKV.years&&BONE_SLOTS.some(s=>s.id===b8.stats?.slot)&&!b8.enhance&&!parseBoneSubs(b8.stats).length&&b8.vohon===null
    &&D.logs.slice(-4).some(l=>l.includes(boneName(MKV.species,b8.stats?.slot,MKV.years))),
    `trả bài 8: nhận đúng 1 hồn cốt ${b8&&boneName(b8.stats?.beast,b8.stats?.slot,b8.years)} (+${b8?.enhance??0}, ${parseBoneSubs(b8?.stats).length} dòng phụ)`);
  ok(q3().step===8&&q3().status==="offer"&&q3().ev==="reward",`xong 8 bài: Hải Mã Đấu La giao tiếp bài 9 "${ch.steps[8].name}" (#286)`);
  // #286 bài 9 (fusion): D mời, E hưởng ứng, cùng tổ đội, đứng ngoài vùng an toàn cạnh thương nhân lưu động. Lần 1: D đã nhận, E chưa
  // nhận (không tính cho E). Lần 2: E đã nhận (người hưởng ứng cũng được tính).
  { const k=looseOf(D).length, fill=looseOf(D).filter(i=>i.code==="hoi_hon_dan"&&!i.lock); for(const it of fill) D.room.send("discard",{id:it.id});
    ok(await waitFor(()=>looseOf(D).length===k-fill.length,3000),`bỏ ${fill.length} ô Hồi Hồn Đan độn túi ở bài 8: còn chỗ cho thưởng bài 9 / 10`); }
  await acc(8); ok(cnt()===0&&q3().status==="active",`nhận bài 9: chưa tính gì (${JSON.stringify(q3().prog)})`);
  const E=await bot("Hải Thần E","nguyet_nhan",{sex:1,hair:2,hairCol:1,outfitCol:2});
  try{
    const meP=b=>b.room.state.players.get(b.room.sessionId), rowOf=(b,v)=>b.owned?.list.find(x=>x.vohon===v)?.rowId, e3=()=>E.chains[QUEST_CH3];
    const safes=os.filter(o=>o.type==="safe"), inSafe=b=>safes.some(r=>inR(r,meP(b).x,meP(b).y));
    await waitFor(()=>E.owned&&meP(E)&&e3(),3000);
    await warp(HT,cm.x,cm.y+12,E); await test(D,"goto",{x:cm.x,y:cm.y+12});
    ok(E.room.roomId===D.room.roomId,`E vào cùng phòng Hải Thần Đảo với D (${E.room.roomId})`);
    const Y=[423,764,1760,5000,12000,30000].slice(0,FUSION.minRings);
    await test(D,"set",{rowId:rowOf(D,"yeu_ho"),level:35,xp:0,rings:Y}); await test(E,"set",{rowId:rowOf(E,"nguyet_nhan"),level:35,xp:0,rings:Y});
    let spot=false;
    for(const [dx,dy] of [[40,0],[-40,0],[0,40],[0,-40],[30,30],[-30,30],[60,0],[0,60]]){
      const x=cm.x+dx, y=cm.y+12+dy; await test(E,"goto",{x,y});
      if(await waitFor(()=>Math.hypot(meP(E).x-x,meP(E).y-y)<0.5,600)&&!inSafe(D)&&!inSafe(E)){ spot=true; break; }
    }
    ok(spot&&meP(D).vh===vohonIndex("yeu_ho")&&meP(E).vh===vohonIndex("nguyet_nhan"),`D Yêu Hồ (${meP(D).x},${meP(D).y}), E Nguyệt Nhận (${meP(E).x},${meP(E).y}), ngoài vùng an toàn, ${Y.length} hồn hoàn`);
    await test(D,"party",{pop:"rlreset"});
    { const k=E.partyMsgs??0; D.room.send("party",{op:"invite",name:E.name}); await waitFor(()=>(E.partyMsgs??0)>k,2000);
      E.room.send("party",{op:"accept",name:D.name}); ok(await waitFor(()=>D.party?.members?.length===2&&E.party?.id===D.party.id,2000),"D và E cùng tổ đội"); }
    await test(E,"quest",{chain:QUEST_CH3,step:8,accepted:false}); await waitFor(()=>e3()?.step===8&&!e3().accepted);
    /** D mời, E hưởng ứng (hook ready: đầy hồn lực, hết hồi chiêu dung hợp); true khi cả hai nhận tin `done`. */
    const fire=async()=>{ await test(D,"clear"); for(const b of [D,E]){ await test(b,"ready"); b.fus.length=0; }
      D.room.send("fusion",{op:"start"}); await waitFor(()=>E.fus.some(m=>m.k==="ask"),1500);
      E.room.send("fusion",{op:"join"}); return waitFor(()=>D.fus.some(m=>m.k==="done")&&E.fus.some(m=>m.k==="done"),1500); };
    ok(await fire()&&await waitFor(()=>q3().status==="ready")&&cnt()===1,`dung hợp kỹ lần 1: D (người mời) xong bài 9 (${JSON.stringify(q3().prog)})`);
    ok(e3().step===8&&!e3().accepted&&!e3().prog?.length,`E chưa nhận bài 9: không tính (${JSON.stringify(e3())})`);
    await test(E,"quest",{chain:QUEST_CH3,step:8,accepted:true,prog:[0]}); await waitFor(()=>e3()?.accepted);
    ok(await fire()&&await waitFor(()=>e3().status==="ready")&&e3().prog?.[0]===1&&cnt()===1,`dung hợp kỹ lần 2: E (người hưởng ứng) đã nhận được tính (${JSON.stringify(e3().prog)}), D kẹp ở 1`);
  } finally { await E.room.leave().catch(()=>{}); }
  await atGiver(); await turn(8);
  // #286 bài 10 (tong, have): đã có tông lúc nhận thì xong ngay; gia nhập trước khi nhận không cộng vào bài chưa nhận.
  const T0=TONG_MON[0].id, T1=TONG_MON[1].id;
  await test(D,"tong",{set:T0}); ok(q3().step===9&&!q3().accepted&&!q3().prog.length,`gia nhập tông trước khi nhận bài 10: không cộng (${JSON.stringify(q3())})`);
  await acc(9); ok(await waitFor(()=>q3().status==="ready")&&cnt()===1,`đã thuộc ${tongDef(T0).name} lúc nhận bài 10: xong ngay (${JSON.stringify(q3().prog)})`);
  await test(D,"tong",{set:""}); await setStep(9);
  await acc(9); ok(q3().status==="active"&&cnt()===0,`chưa thuộc tông lúc nhận bài 10: chưa xong (${JSON.stringify(q3().prog)})`);
  await test(D,"tong",{set:T1}); ok(await waitFor(()=>q3().status==="ready")&&cnt()===1,`gia nhập ${tongDef(T1).name}: bài 10 xong (${JSON.stringify(q3().prog)})`);
  await turn(9);
  ok(q3().step===10&&questStatus(q3())==="done"&&q3().ev==="finish",`xong cả chuỗi "${ch.name}"`);
  t=await qop("turnin"); ok(/Đã học xong/.test(t)&&bonesOf(D).length===bones0.size+1,`xong rồi: trả lại không nhận thêm hồn cốt (${t})`);
  await D.room.leave(); await sleep(400); await enter(D); await waitFor(()=>dme()&&D.quest&&D.chains[QUEST_CH3]&&D.chains[QUEST_CH2]&&D.bag);
  ok(q3().step===10&&D.chains[QUEST_CH2].status==="done"&&D.quest.status==="done","thoát vào lại: chương 3 xong, tân thủ và chương 2 giữ nguyên");
  { const b=bonesOf(D).find(i=>i.id===b8?.id); ok(b&&b.stats?.beast===MKV.species&&b.stats?.slot===b8.stats.slot&&b.years===MKV.years,`thoát vào lại: hồn cốt thưởng còn trong túi (${b&&boneName(b.stats.beast,b.stats.slot,b.years)})`); }
  await D.room.leave();
}
