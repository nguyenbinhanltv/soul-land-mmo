// Khối ab1 của INLINE: 2.5a–2.5d (bot E), BĐ5, 3.2 (nhóm 1) (#703 bước 5, tách nguyên văn từ bot-test.mjs; nhận ctx = các biến của luồng A / B / C).
import { bot, waitFor, test, ok, lastLog, sleep, step, sendTeam, same, mapUrl, post, enter, qtyOf, bonesOf, bagKey, useItem, sj } from "./lib.mjs";
import * as SD from "../../../shared/data.ts";
import { skillPower, buffPower, calcStats, vohonIndex, tierOfYears, STATUS, hpRegen, mpRegen, VOHON, SAFE_REGEN_MULT, TEAM_COMBAT_SECS, TEAM_SIZE, skillsOf, TIERS, CC_TIER_MULT, PCT_HP_CAP, BEAST_REGEN, BEAST_DEF_MULT, beastDef, BEAST_DEF, BEASTS, beastIndex, defMult, TIEN_CO_RIENG, SKILLS, PHOENIX_FIELD_R, TIEN_CO_MAX, PHONG_LOI, TIEN_CO_IDLE_SECS, REVIVE_SECS, bondsOf, BONDS, bondSum, BOND_KEYS, BUFFS, kingNext, kingActive, KING, vnHHMM, BOSSES, parseLevelRange, bossIndex, MAPS, vnDay, KING_TIMES, KING_CHEST, bossHpMult, beastStats, TELE_WARN, chestCode, kingShardPool, shardCode, CORE_ITEM, coreStarBand, coreSetIndex, CORE_SUBS, BAG_SLOTS, RING_ITEM, DROP_OWNER_SECS, formatYears, ringLimit, absorbChance, MAX_YEARS, absorbSecs, MAX_LEVEL, MAX_RINGS, starCost, STAR_COST, MAX_STARS, SHARD_UNLOCK, shardChance, itemDef, starMult, boneChance, BONE_SLOTS, BONE_ITEM, boneStats, boneName, PICKUP_RANGE, ELITE, beastName, coreChance, CORE_SETS, MAX_CORE_STARS, CORE_STAT_IDS, CORE_STAR_K, coreMainValue, coreName, coreStatText, rollCore, CORE_STATS, coreSubMax, CORE_SUB_ROLL, CORE_MAP_SET, boneBonus, BONE_SKILLS, BONE_ACTIVE_SLOTS, boneSkillOf, bonePassive, BONE_PASSIVE_CAP, statusBit, boneFeedXp, BONE_FEED_PER_YEAR, BONE_FEED_SAME_SLOT, BONE_FEED_CARRY, BONE_MAX_ENHANCE, boneEnhanceLevel, boneEnhanceNeed, boneSkillMult, boneEnhancePreview, enhanceFee, BONE_ENHANCE_FEE, CORE_ENHANCE_FEE, CORE_MAX_ENHANCE, formatHonTe, parseBoneSubs, BONE_MAX_SUBS, boneSubsDue, CORE_SLOTS, coreBonus, coreFx, CORE_SET_FX, CRIT, TIEN_CO_GAIN, tienCoOf, coreFeedXp, CORE_FEED_STAR, CORE_FEED_SAME_SET, CORE_FEED_CARRY, coreEnhanceLevel, coreEnhanceNeed, CORE_ENHANCE_MAIN, coreSubRolls, coreUpgradeSubs, CORE_MAX_SUBS, coreEnhancePreview } from "../../../shared/data.ts";
import { readFileSync } from "node:fs";

// 2.5a–2.5d dùng bot E.
export async function ab1Block1(ctx) {
  const { B, FIVE, VILLAGE_RY, beastOf, cast, clearDir, dmgsOn, exp, goTo, hasBuff, hasSt, inSafeOf, leaveSafe, meOf, safe, spawnNear, sqOf, switchRow, tienCo, vname } = ctx;


  const E=await bot("Tester E","u_minh_linh_mieu",{sex:0,hair:2,hairCol:2,outfitCol:3});
  await waitFor(()=>E.owned&&E.squad&&meOf(E)); const me=meOf(E);
  for(const vohon of ["hao_thien_chuy","cuu_bao_luu_ly_thap","bich_lan_xa_hoang","tu_vong_chu_hoang"]) await test(E,"grant",{vohon});
  ok(FIVE.every(id=>E.owned.list.some(v=>v.vohon===id)),`E sở hữu 5 võ hồn mẫu (hook grant): ${E.owned.list.map(v=>v.vohon).join(", ")}`);
  const rowE=id=>E.owned.list.find(v=>v.vohon===id).rowId, YRS=[423,764,1760,5000], P=i=>skillPower(YRS[i]), BP=i=>buffPower(YRS[i]);
  const atkE=id=>calcStats(vohonIndex(id),40,YRS.map(tierOfYears),1,{},{},E.res?.bonus).atk; // E đủ mốc cộng minh Võ hồn / Hồn hoàn (8.2)
  for(const id of [...FIVE,"tu_vong_chu_hoang"]) await test(E,"set",{rowId:rowE(id),level:40,xp:0,rings:YRS});
  ok(await leaveSafe(E),"E: ra khỏi làng");
  {
    // Vùng an toàn (BĐ2): không tung hồn kỹ; sát thương theo thời gian của người đứng trong làng tạm dừng, ra ngoài thì tiếp tục;
    // sinh lực / hồn lực trong làng hồi nhanh hơn ngoài rừng (#112).
    const ry=VILLAGE_RY, out=safe.x+safe.width+30, bid=await spawnNear(E,3,40), pc=STATUS.poison.col, ticks=()=>E.dmgs.filter(d=>d.bid===bid&&d.c===pc);
    await test(E,"status",{s:"stun",secs:30}); await test(E,"status",{s:"poison",n:2,secs:30});
    E.dmgs=[]; ok(await waitFor(()=>ticks().length,1500),`Trúng độc ngoài làng: mất ${ticks()[0]?.v} mỗi giây`);
    ok(ticks().every(d=>d.dot===true&&d.by===E.room.sessionId),`Tin dmg của độc có cờ dot và by = người gây (${JSON.stringify(ticks()[0]?.by)}, dot ${ticks()[0]?.dot})`);
    await goTo(E,safe.x+safe.width-24,ry); ok(inSafeOf(E),"E vào làng");
    E.dmgs=[]; await test(E,"ready"); E.room.send("skill",{i:0}); ok(await lastLog(E,/Vùng an toàn/),"trong làng: không tung hồn kỹ");
    await sleep(2200); ok(!ticks().length,"trong làng: độc do mình gây tạm dừng, không gây sát thương");
    // #112: hồi sinh lực / hồn lực 1 giây (hook pregen chạy đúng regenPlayer): khớp hpRegen / mpRegen, trong làng nhanh gấp SAFE_REGEN_MULT.
    const regen=async(inside,hit)=>{ const r=await test(E,"pregen",{s:1,hp:20,mp:0,hit});
      if(typeof r?.hp!=="number"){ ok(false,`${inside?"trong":"ngoài"} làng: hook pregen không chạy (E gục / đang đi cổng?)`); return {hp:NaN,mp:NaN}; }
      const hp=Math.min(r.maxHp-r.hp0,hpRegen(r.maxHp,hit?0:99,inside)), mp=Math.min(r.maxMp-r.mp0,mpRegen(r.level,VOHON[r.vh].mp,inside));
      ok(r.safe===inside&&Math.abs(r.hp-hp)<1e-6&&Math.abs(r.mp-mp)<1e-6,
        `${inside?"trong":"ngoài"} làng${hit?", vừa bị đánh":""}: hồi ${r.hp.toFixed(2)} sinh lực (cần ${hp.toFixed(2)}), ${r.mp.toFixed(2)} hồn lực (cần ${mp.toFixed(2)}) mỗi giây`);
      return r; };
    const full=()=>test(E,"pregen",{s:0,hp:100,mp:100}); // trả lại đầy sinh lực / hồn lực, coi như đã lâu không bị đánh
    const sIn=await regen(true,false), sInHit=await regen(true,true); await full(); // ra khỏi làng với đầy sinh lực như trước
    await goTo(E,out,ry); E.dmgs=[]; ok(!inSafeOf(E)&&await waitFor(()=>ticks().length,1500),"ra khỏi làng: độc gây sát thương tiếp");
    const sOut=await regen(false,false), sOutHit=await regen(false,true); await full();
    const rt=(x,y)=>Math.abs(x/y-SAFE_REGEN_MULT)<1e-6;
    ok(rt(sIn.hp,sOut.hp)&&rt(sInHit.hp,sOutHit.hp)&&rt(sIn.mp,sOut.mp),`vùng an toàn hồi nhanh gấp ${SAFE_REGEN_MULT}: sinh lực ${sIn.hp.toFixed(1)} / ${sOut.hp.toFixed(1)}, vừa bị đánh ${sInHit.hp.toFixed(1)} / ${sOutHit.hp.toFixed(1)}, hồn lực ${sIn.mp.toFixed(1)} / ${sOut.mp.toFixed(1)}`);
    await test(E,"clear");
  }
  // Hướng thử: tính lại ở chỗ đứng hiện tại mỗi lần quay mặt (không vướng cây, không ra ngoài bản đồ trong 100 pixel).
  let [ux,uy]=clearDir(me.x,me.y,100); const at=d=>[Math.round(ux*d),Math.round(uy*d)];
  async function face(back=0){ [ux,uy]=clearDir(me.x,me.y,100,back); await step(E,ux,uy); }
  /** Xếp đội [id, ...rest] ngoài giao chiến để `id` ra trận. */
  async function lineup(id,rest=[]){ await test(E,"clear"); await test(E,"rest",{s:TEAM_COMBAT_SECS+1}); const t=[id,...rest].map(rowE); while(t.length<TEAM_SIZE) t.push(0);
    await sendTeam(E,t); return E.owned.active===rowE(id)&&await waitFor(()=>me.vh===vohonIndex(id)); }
  const spawnAt=(tier,d)=>spawnNear(E,tier,...at(d));
  console.log(`  E đứng ${me.x.toFixed(0)},${me.y.toFixed(0)}, hướng thử ${ux},${uy}`);

  // Lam Ngân Thảo (khống chế): Triền Nhiễu trói + trúng độc, Ký Sinh dễ thương, Tù Lung gom quái, Chu Võng choáng.
  {
    const id="lam_ngan_thao", sk=skillsOf(id), atk=atkE(id);
    ok(await lineup(id),`E: ${vname(id)} ra trận (cấp 40, hồn hoàn ${YRS.join("/")} năm)`);
    await face(); await test(E,"ready");
    await cast(E,0); ok(/không có hồn thú/.test(E.logs.at(-1)??"")&&me.cds[0]===0,"hồn kỹ đánh một mục tiêu: không có hồn thú trong tầm thì không tung, không hồi chiêu");
    const bid=await spawnAt(3,50); await test(E,"ready"); await cast(E,0);
    const b=beastOf(E,bid); let want=exp(atk*P(0)*sk[0].dmg);
    ok(want.includes(dmgsOn(E,bid)[0]?.v)&&hasSt(b,"root")&&hasSt(b,"poison")&&b.poison===1,
      `${sk[0].name}: sát thương ${dmgsOn(E,bid)[0]?.v} (cần ${want.join(" hoặc ")}), Trói + Trúng độc ${b?.poison} tầng`);
    const bx=b.x, by=b.y; await sleep(700);
    ok(beastOf(E,bid)&&b.x===bx&&b.y===by,"Trói: hồn thú đứng yên");
    const pc=STATUS.poison.col, tick=()=>dmgsOn(E,bid).find(d=>d.c===pc)?.v;
    E.dmgs=[]; await waitFor(()=>tick(),1500); want=Math.round(atk*STATUS.poison.dot*P(0));
    ok(tick()===want,`Trúng độc: mất ${tick()} sinh lực mỗi giây (cần ${want})`);
    await test(E,"ready"); await cast(E,1); want=exp(atk*P(1)*sk[1].dmg);
    ok(want.includes(dmgsOn(E,bid)[0]?.v)&&hasSt(b,"vuln"),`${sk[1].name}: sát thương ${dmgsOn(E,bid)[0]?.v} (cần ${want.join(" hoặc ")}), Dễ thương`);
    E.dmgs=[]; await waitFor(()=>tick(),1500); want=Math.round(atk*STATUS.poison.dot*P(0)*(1+STATUS.vuln.amp));
    ok(tick()===want,`Dễ thương: độc mất ${tick()} mỗi giây (cần ${want}, +${STATUS.vuln.amp*100}%)`);
    // Tù Lung: hai hồn thú (đang choáng để đứng yên) ở xa bị kéo về sát thân.
    await test(E,"clear"); const g1=await spawnAt(3,70), g2=await spawnAt(3,84);
    await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"ready"); await cast(E,2,300);
    const near=bid=>{const q=beastOf(E,bid); return q?Math.hypot(q.x-me.x,q.y-me.y):-1;};
    ok([g1,g2].every(g=>near(g)>=0&&near(g)<TIERS[3].size/2+16&&hasSt(beastOf(E,g),"root")),`${sk[2].name}: kéo 2 hồn thú về cách ${near(g1).toFixed(0)} / ${near(g2).toFixed(0)} pixel, Trói`);
    // Chu Võng: choáng; hồn thú 10 vạn năm bị khống chế ngắn hơn (CC_TIER_MULT).
    await test(E,"clear"); const cb=await spawnAt(4,30); await test(E,"ready"); await cast(E,3);
    want=exp(atk*P(3)*sk[3].dmg);
    ok(want.includes(dmgsOn(E,cb)[0]?.v)&&hasSt(beastOf(E,cb),"stun"),`${sk[3].name}: sát thương ${dmgsOn(E,cb)[0]?.v} (cần ${want.join(" hoặc ")}), Choáng`);
    // Chờ theo state, hạn chờ vẫn ngắn hơn 2 giây choáng đầy đủ tính từ lúc tung (thời gian trạng thái chạy theo nhịp server).
    const secs=2*CC_TIER_MULT[4];
    ok(await waitFor(()=>!hasSt(beastOf(E,cb),"stun"),secs*1000+700),`hồn thú 10 vạn năm hết choáng sau ${secs} giây (2 × ${CC_TIER_MULT[4]})`);
    await test(E,"clear");
  }
  // Hạo Thiên Chùy (cường công): % sinh lực, Phá giáp, liên hoàn kết thúc bằng hất tung.
  {
    const id="hao_thien_chuy", sk=skillsOf(id), atk=atkE(id);
    ok(await lineup(id),`E: ${vname(id)} ra trận`);
    await face(26); const f=await spawnAt(3,22), bk=await spawnAt(3,-26);
    await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"ready"); await cast(E,1);
    let want=exp(atk*P(1)*sk[1].dmg);
    ok(want.includes(dmgsOn(E,f)[0]?.v)&&beastOf(E,f)?.armor===2&&beastOf(E,bk)?.armor===2,`${sk[1].name}: sát thương ${dmgsOn(E,f)[0]?.v} (cần ${want.join(" hoặc ")}), Phá giáp ${beastOf(E,f)?.armor} tầng`);
    await cast(E,0);
    want=exp((atk*P(0)*sk[0].dmg+Math.min(TIERS[3].hp*sk[0].pctHp,atk*P(0)*PCT_HP_CAP))*(1+2*STATUS.armor.amp));
    ok(want.includes(dmgsOn(E,f)[0]?.v)&&!dmgsOn(E,bk).length,`${sk[0].name}: nửa trước mặt ${dmgsOn(E,f)[0]?.v} (cần ${want.join(" hoặc ")}: +3% sinh lực, Phá giáp +20%), hồn thú phía sau không trúng`);
    await test(E,"clear"); const lb=await spawnAt(4,40); await test(E,"ready"); await cast(E,2,0);
    ok(await waitFor(()=>dmgsOn(E,lb).length>=4&&hasSt(beastOf(E,lb),"stun"),1500),`${sk[2].name}: ${dmgsOn(E,lb).length} nhát liên hoàn, nhát cuối hất tung (Choáng)`);
    want=exp(atk*P(2)*sk[2].dmg+Math.min(TIERS[4].hp*sk[2].pctHp,atk*P(2)*PCT_HP_CAP));
    ok(dmgsOn(E,lb).every(d=>want.includes(d.v)),`mỗi nhát ${dmgsOn(E,lb).map(d=>d.v).join("/")} (cần ${want.join(" hoặc ")})`);
    await test(E,"clear"); const pb=await spawnAt(4,40); await test(E,"ready"); await cast(E,3);
    want=exp(atk*P(3)*sk[3].dmg+Math.min(TIERS[4].hp*sk[3].pctHp,atk*P(3)*PCT_HP_CAP));
    ok(want.includes(dmgsOn(E,pb)[0]?.v)&&hasSt(beastOf(E,pb),"stun"),`${sk[3].name}: sát thương ${dmgsOn(E,pb)[0]?.v} (cần ${want.join(" hoặc ")}, có 6% sinh lực), hất tung`);
    await test(E,"clear");
  }
  // U Minh Linh Miêu (mẫn công): lướt, cào liên hoàn kèm Phá giáp, tăng tốc và chí mạng.
  {
    const id="u_minh_linh_mieu", sk=skillsOf(id), atk=atkE(id);
    ok(await lineup(id),`E: ${vname(id)} ra trận`);
    await face(); const bid=await spawnAt(4,40); await test(E,"status",{s:"stun",secs:10});
    const x0=me.x, y0=me.y; await test(E,"ready"); await cast(E,0);
    let want=exp(atk*P(0)*sk[0].dmg);
    ok(Math.hypot(me.x-x0,me.y-y0)>=50&&want.includes(dmgsOn(E,bid)[0]?.v),`${sk[0].name}: lướt ${Math.hypot(me.x-x0,me.y-y0).toFixed(0)} pixel xuyên hồn thú, sát thương ${dmgsOn(E,bid)[0]?.v} (cần ${want.join(" hoặc ")})`);
    await cast(E,1,0);
    ok(await waitFor(()=>dmgsOn(E,bid).length>=3&&beastOf(E,bid)?.armor===3,1200),`${sk[1].name}: ${dmgsOn(E,bid).length} nhát, Phá giáp ${beastOf(E,bid)?.armor} tầng`);
    await cast(E,2);
    ok(await waitFor(()=>hasBuff(me,"spd")&&hasBuff(me,"crit"),500),`${sk[2].name}: hồn sư được tăng tốc và tăng chí mạng`);
    await test(E,"clear"); const bb=await spawnAt(4,60); await test(E,"ready"); await cast(E,3,0);
    ok(await waitFor(()=>dmgsOn(E,bb).length>=sk[3].n,2000),`${sk[3].name}: lướt tới và cào ${dmgsOn(E,bb).length}/${sk[3].n} nhát`);
    await test(E,"clear");
  }
  // Bích Lân Xà Hoàng (khống chế, trúng độc): độc cộng dồn, câm lặng diện rộng, Vạn Xà Phệ Tâm hút máu.
  {
    const id="bich_lan_xa_hoang", sk=skillsOf(id), atk=atkE(id);
    ok(await lineup(id),`E: ${vname(id)} ra trận`);
    const [vx,vy]=clearDir(me.x,me.y,60); await step(E,vx,vy);
    const bid=await spawnNear(E,4,Math.round(vx*40),Math.round(vy*40)); await test(E,"status",{s:"stun",secs:10});
    await test(E,"ready"); await cast(E,0,500);
    const b=beastOf(E,bid), p1=b?.poison??0, want=exp(atk*P(0)*sk[0].dmg);
    ok(p1>=1&&dmgsOn(E,bid).every(d=>want.includes(d.v)),`${sk[0].name}: ${dmgsOn(E,bid).length} mũi trúng, Trúng độc ${p1} tầng`);
    await cast(E,1);
    ok(b?.poison===Math.min(STATUS.poison.max,p1+2),`${sk[1].name}: Trúng độc cộng dồn ${p1} -> ${b?.poison} tầng (tối đa ${STATUS.poison.max})`);
    const sb=await spawnNear(E,3,Math.round(vx*10),Math.round(vy*10)); E.hurts=[];
    ok(await waitFor(()=>E.hurts.length>0,3000),"hồn thú kề bên đánh hồn sư");
    await cast(E,2);
    ok(await waitFor(()=>hasSt(beastOf(E,sb),"silence")&&hasSt(beastOf(E,sb),"vuln")&&hasSt(b,"silence"),500),`${sk[2].name}: Câm lặng và Dễ thương diện rộng`+
      ` (kề bên: ${beastOf(E,sb)?`st ${beastOf(E,sb).st}, cách ${Math.hypot(beastOf(E,sb).x-me.x,beastOf(E,sb).y-me.y).toFixed(0)}`:"không còn"}; xa: ${beastOf(E,bid)?`st ${beastOf(E,bid).st}`:"không còn"}; log ${E.logs.at(-1)})`);
    // Từ 3.5 Câm lặng chỉ chặn và ngắt chiêu báo trước: hồn thú kề bên vẫn đánh thường.
    E.hurts=[]; ok(await waitFor(()=>E.hurts.length>0,2500)&&hasSt(beastOf(E,sb),"silence"),"Câm lặng (từ 3.5): hồn thú kề bên vẫn đánh thường");
    await test(E,"clear"); const vb=await spawnAt(4,30);
    await test(E,"status",{s:"stun",secs:10}); await test(E,"status",{s:"poison",n:4}); await test(E,"hurt",{pct:50});
    await waitFor(()=>me.hp<=me.maxHp*0.6); const h0=me.hp;
    await test(E,"ready"); await cast(E,3);
    const got=dmgsOn(E,vb)[0]?.v, w=exp(atk*P(3)*(sk[3].dmg+sk[3].perStack.dmg*4));
    ok(w.includes(got),`${sk[3].name}: 4 tầng độc, sát thương ${got} (cần ${w.join(" hoặc ")})`);
    const hw=Math.min(me.maxHp,h0+Math.floor(got*sk[3].lifesteal));
    ok(await waitFor(()=>me.hp>=hw-1,500)&&me.hp<=Math.min(me.maxHp,hw+4),`hút máu ${sk[3].lifesteal*100}%: sinh lực ${h0} -> ${me.hp} (cần ~${hw})`);
    await test(E,"clear");
  }
  // Cửu Bảo Lưu Ly Tháp (phụ trợ): tăng công / tốc / thủ thuộc hồn sư (đổi võ hồn vẫn còn), hồi và giảm tiêu hao hồn lực.
  // Kèm kiểm tra Thiêu đốt (cộng dồn, sát thương theo công người gây) và Viêm bạo qua hook.
  {
    const id="cuu_bao_luu_ly_thap", sk=skillsOf(id), atk=atkE(id), bc=STATUS.burn.col;
    ok(await lineup(id,["hao_thien_chuy"]),`E: ${vname(id)} ra trận`);
    await face(); const bid=await spawnAt(4,40); await test(E,"status",{s:"stun",secs:20});
    await test(E,"status",{s:"burn",n:3}); const b=beastOf(E,bid);
    const tick=()=>dmgsOn(E,bid).find(d=>d.c===bc)?.v;
    E.dmgs=[]; await waitFor(()=>tick(),1500); let want=Math.round(atk*STATUS.burn.dot*3);
    ok(b?.burn===3&&tick()===want,`Thiêu đốt 3 tầng: mất ${tick()} mỗi giây (cần ${want})`);
    await test(E,"status",{s:"burn",n:5}); ok(await waitFor(()=>b?.burn===STATUS.burn.max,500),`Thiêu đốt cộng dồn tối đa ${b?.burn} tầng`);
    await test(E,"ready"); await cast(E,0);
    ok(hasBuff(me,"atk")&&hasBuff(B.room.state.players.get(E.room.sessionId),"atk"),`${sk[0].name}: tăng công (người khác cũng thấy hào quang)`);
    await test(E,"status",{s:"burn"}); E.dmgs=[]; await waitFor(()=>tick(),1500);
    want=Math.round(atk*(1+sk[0].self.buff.atk*BP(0))*STATUS.burn.dot*STATUS.burn.max);
    ok(tick()===want,`tăng công ${Math.round(sk[0].self.buff.atk*BP(0)*100)}%: Thiêu đốt gây lại mạnh hơn, ${tick()} mỗi giây (cần ${want})`);
    E.dmgs=[]; await test(E,"boom");
    ok(await waitFor(()=>!hasSt(b,"burn"),500)&&dmgsOn(E,bid).some(d=>d.c===bc&&d.v>want),`Viêm bạo: kích nổ mọi tầng một lần ${dmgsOn(E,bid).find(d=>d.c===bc)?.v}, hết Thiêu đốt`);
    await cast(E,1); ok(await waitFor(()=>hasBuff(me,"spd"),500),`${sk[1].name}: tăng tốc (log ${E.logs.at(-1)})`);
    await test(E,"ready",{mp:20}); await waitFor(()=>me.mp<=me.maxMp*0.22); const m20=me.mp; await cast(E,2);
    want=Math.floor(me.maxMp*(0.2+sk[2].self.mp*BP(2)));
    ok(hasBuff(me,"mp")&&me.mp>=want-1&&me.mp<=want+8,`${sk[2].name}: hồn lực ${m20} -> ${me.mp} (cần ~${want}), giảm tiêu hao`);
    await test(E,"ready",{mp:50}); await waitFor(()=>Math.abs(me.mp-me.maxMp*0.5)<=2); const m0=me.mp; await cast(E,0,150);
    ok(m0-me.mp<=sk[0].cost*(1-sk[2].self.buff.mp*BP(2))+1.3,`giảm tiêu hao: ${sk[0].name} tốn ${m0-me.mp} hồn lực (gốc ${sk[0].cost})`);
    await test(E,"ready"); await cast(E,3);
    want=Math.round(me.maxHp*sk[3].self.shield*BP(3));
    ok(hasBuff(me,"def")&&me.shield===want,`${sk[3].name}: tăng thủ, khiên ${me.shield} (cần ${want})`);
    const h0=me.hp; await test(E,"hurt",{pct:20}); await waitFor(()=>me.hp<h0);
    const lost=h0-me.hp, full=Math.floor(h0*0.2);
    ok(lost<=Math.round(full*(1-sk[3].self.buff.def*BP(3)))+2&&lost>=Math.round(full*(1-sk[3].self.buff.def*BP(3)))-2,`tăng thủ: mất ${lost} thay vì ${full}`);
    const hb=rowE("hao_thien_chuy"); ok(await switchRow(E,hb),"đổi sang Hạo Thiên Chùy");
    ok(["atk","spd","def","mp"].every(x=>hasBuff(me,x)),"hiệu ứng có lợi thuộc hồn sư: đổi võ hồn vẫn còn");
    await test(E,"clear");
  }
  // Cảm điện lan sát thương, hồi máu hồn thú và Trúng độc giảm hồi máu (engine, qua hook).
  {
    await face(); const s1=await spawnAt(0,14), s2=await spawnAt(0,60); // hồn thú 10 năm không tự lao vào, hồn thú thứ hai ngoài tầm đánh thường
    await test(E,"status",{s:"stun",secs:5,all:true}); await test(E,"status",{s:"shock",all:true});
    ok(hasSt(beastOf(E,s1),"shock")&&hasSt(beastOf(E,s2),"shock"),"Cảm điện lên 2 hồn thú");
    E.dmgs=[]; E.room.send("attack"); await waitFor(()=>dmgsOn(E,s2).length,800);
    const v1=dmgsOn(E,s1)[0]?.v, ch=dmgsOn(E,s2)[0];
    ok(v1&&ch?.c===STATUS.shock.col&&ch.v===Math.max(1,Math.round(v1*STATUS.shock.chain))&&dmgsOn(E,s1).length===1,
      `Cảm điện: đánh trúng ${v1}, lan ${ch?.v} sang hồn thú cảm điện gần đó (cần ${Math.round((v1??0)*STATUS.shock.chain)}), không lan ngược`);
    await test(E,"clear"); await spawnAt(2,110);
    await test(E,"bhp",{pct:50}); const g1=(await test(E,"regen",{s:5})).gain;
    await test(E,"bhp",{pct:50}); await test(E,"status",{s:"poison",secs:30}); const g2=(await test(E,"regen",{s:5})).gain;
    const w1=Math.floor(TIERS[2].hp*BEAST_REGEN.pct*5);
    ok(g1===w1&&g2===Math.floor(w1*(1-STATUS.poison.healCut)),`hồn thú hồi ${g1} sinh lực trong 5 giây ngoài giao chiến (cần ${w1}); Trúng độc chỉ hồi ${g2}`);
    await test(E,"clear");
  }
  // Chỉ số thủ của hồn thú (#116, BEAST_DEF): theo loài (BEAST_DEF_MULT) và niên hạn; đòn trực tiếp nhân defMult, Phá giáp giảm thủ thật
  // (STATUS.armor.shred mỗi tầng, đủ tầng thì hết thủ). Hồn thú bị Trói sẵn để đứng yên (Choáng thì ràng buộc Băng Hỏa có thể cộng thêm).
  {
    const hard=Object.keys(BEAST_DEF_MULT).find(k=>BEAST_DEF_MULT[k]>1), soft=Object.keys(BEAST_DEF_MULT).find(k=>BEAST_DEF_MULT[k]<1);
    const thu=async(species,tier,real=true)=>{ await test(E,"clear"); await face();
      const bid=(await test(E,"spawn",{tier,dx:at(60)[0],dy:at(60)[1],species,...(real?{realDef:1}:{})}))?.bid; await waitFor(()=>beastOf(E,bid),1000);
      await test(E,"status",{bid,s:"root",secs:30}); return {bid,def:(await test(E,"bst",{bid}))?.def}; };
    const deal=async bid=>(await test(E,"bdmg",{bid,v:1000}))?.dealt;
    const h4=await thu(hard,4), s4=await thu(soft,4), h0=await thu(hard,0);
    ok(Math.abs(h4.def-beastDef(hard,TIERS[4].years))<1e-9&&h4.def>BEAST_DEF.ref&&s4.def<BEAST_DEF.ref&&h0.def<h4.def,
      `thủ theo loài / niên hạn: ${BEASTS[beastIndex(hard)].name} ${TIERS[4].age} ${h4.def?.toFixed(3)}, cùng loài ${TIERS[0].age} ${h0.def?.toFixed(3)}, `+
      `${BEASTS[beastIndex(soft)].name} ${TIERS[4].age} ${s4.def?.toFixed(3)} (thủ chuẩn ${BEAST_DEF.ref.toFixed(3)})`);
    const h=await thu(hard,4), d0=await deal(h.bid), want=n=>Math.max(1,Math.round(1000*defMult(h.def,n*STATUS.armor.shred)));
    await test(E,"status",{bid:h.bid,s:"armor",n:1,secs:30}); const d1=await deal(h.bid);
    await test(E,"status",{bid:h.bid,s:"armor",n:2,secs:30}); const d3=await deal(h.bid);
    ok(d0===want(0)&&d0<1000&&d1===want(1)&&d3===want(STATUS.armor.max)&&d3===Math.round(1000/(1-BEAST_DEF.ref)),
      `đòn trực tiếp 1000 lên hồn thú thủ cao: ${d0} (cần ${want(0)}), Phá giáp 1 tầng ${d1} (cần ${want(1)}), ${STATUS.armor.max} tầng hết thủ ${d3} (cần ${want(STATUS.armor.max)})`);
    const r=await thu(hard,4,false), r0=await deal(r.bid); await test(E,"status",{bid:r.bid,s:"armor",n:STATUS.armor.max,secs:30}); const r3=await deal(r.bid);
    const r3w=Math.round(1000*defMult(BEAST_DEF.ref,1));
    ok(r.def===BEAST_DEF.ref&&r0===1000&&r3===r3w,`hồn thú thủ chuẩn nhận đúng như trước khi có thủ: ${r0}, Phá giáp ${STATUS.armor.max} tầng ${r3} (cần ${r3w})`);
    await test(E,"clear");
  }
  // Tiên cơ riêng của 5 võ hồn (đổi tay vào với năng lượng đầy), và tiên cơ chung khống chế (Tử Vong Chu Hoàng chưa có tiên cơ riêng, tới 2.5d).
  await test(E,"rest",{s:15}); ok(await waitFor(()=>!me.buff),"nghỉ 15 giây: hết mọi hiệu ứng có lợi");
  for(const [k,id] of FIVE.entries()){
    const own=TIEN_CO_RIENG[id], other=FIVE[(k+1)%FIVE.length], atk=atkE(id);
    await lineup(other,[id]); await face();
    const r=await tienCo(E,rowE(id),{tier:own.area==="self"?-1:3,dx:at(own.dash?70:20)[0],dy:at(own.dash?70:20)[1]});
    ok(r.fx?.own&&r.fx.vh===vohonIndex(id)&&await lastLog(E,new RegExp(own.name)),`tiên cơ riêng ${vname(id)}: ${own.name}`);
    const b=r.bid?beastOf(E,r.bid):null;
    if(own.dmg){
      const w=exp(atk*own.dmg+(own.pctHp?Math.min(TIERS[3].hp*own.pctHp,atk*PCT_HP_CAP):0));
      ok(w.includes(r.dmg),`${own.name}: sát thương ${r.dmg} (cần ${w.join(" hoặc ")})`);
    }
    if(own.status) ok(await waitFor(()=>own.status.every(a=>hasSt(b,a.s)&&(!a.n||b[a.s]===a.n)),500),`${own.name}: gây ${own.status.map(a=>STATUS[a.s].name+(a.n?` ${a.n} tầng`:"")).join(", ")}`);
    if((own.n??1)>1) ok(await waitFor(()=>dmgsOn(E,r.bid).length>=own.n,1500),`${own.name}: ${dmgsOn(E,r.bid).length}/${own.n} nhát`);
    if(own.self?.buff?.inv){
      ok(await waitFor(()=>hasBuff(me,"inv"),500),`${own.name}: miễn sát thương`);
      await spawnNear(E,1,...at(8)); E.hurts=[]; const h=me.hp;
      ok(await waitFor(()=>E.hurts.some(x=>x.immune),2500)&&me.hp>=h,`hồn thú đánh trúng: hiện "Miễn", sinh lực giữ ${me.hp}`);
    }
    await test(E,"clear");
  }
  // ---------- 2.5b: lưu phái Thiêu đốt (Tà Hỏa Phượng Hoàng, Hỏa Long, Hỏa Ảnh, Kỳ Nhung Thông Thiên Cúc, Nguyệt Nhận) ----------
  {
    const FIRE=["ta_hoa_phuong_hoang","hoa_long","hoa_anh","ky_nhung_thong_thien_cuc","nguyet_nhan"], bc=STATUS.burn.col;
    ok(FIRE.every(v=>skillsOf(v).length===4&&skillsOf(v)!==SKILLS&&TIEN_CO_RIENG[v]),"2.5b: 5 võ hồn Thiêu đốt có 4 hồn kỹ riêng và tiên cơ riêng");
    for(const vohon of FIRE) if(!E.owned.list.some(v=>v.vohon===vohon)) await test(E,"grant",{vohon});
    ok(FIRE.every(id=>E.owned.list.some(v=>v.vohon===id)),"E sở hữu 5 võ hồn Thiêu đốt (hook grant)");
    // Hạ hồn thú thì võ hồn có thể lên cấp (công đổi): đặt lại cấp 40 đầu mỗi phần.
    const reset=async()=>{ for(const id of FIRE) await test(E,"set",{rowId:rowE(id),level:40,xp:0,rings:YRS}); };
    await reset();
    const hitsOn=bid=>dmgsOn(E,bid).filter(d=>d.c!==bc), dist=bid=>{const q=beastOf(E,bid); return q?Math.hypot(q.x-me.x,q.y-me.y):-1;};
    const stOk=(b,list)=>!!b&&(list??[]).every(a=>hasSt(b,a.s)&&(!a.n||(b[a.s]??0)>=a.n));
    const stName=list=>(list??[]).map(a=>STATUS[a.s].name+(a.n?` ${a.n} tầng`:"")).join(", ");
    /** Chẩn đoán khi hồn kỹ không trúng: võ hồn ra trận, chỗ đứng, hồn thú thử, log cuối. */
    const whyMiss=(id,bid)=>{ const q=beastOf(E,bid);
      return `ra trận ${VOHON[me.vh]?.id}${VOHON[me.vh]?.id===id?"":` (cần ${id})`}, E ${me.x.toFixed(0)},${me.y.toFixed(0)}${inSafeOf(E)?" trong làng":""}, hướng ${ux},${uy}, `+
        `hồn thú ${q?`${q.x.toFixed(0)},${q.y.toFixed(0)} cách ${dist(bid).toFixed(0)}`:"không thấy"}, log: ${E.logs.slice(-3).join(" | ")}`; };
    /** Tung hồn kỹ ô i vào một hồn thú mới (bậc `tier`, cách `d` theo hướng thử; `stun`: choáng sẵn để đứng yên): kiểm từng nhát và trạng thái. */
    async function basic(id,i,{tier=4,d=24,stun=true,n=1}={}){
      const sk=skillsOf(id)[i], atk=atkE(id);
      await test(E,"clear"); await face(); const bid=await spawnAt(tier,d); if(stun) await test(E,"status",{s:"stun",secs:10});
      await test(E,"ready"); await cast(E,i,0);
      await waitFor(()=>hitsOn(bid).length>=n&&stOk(beastOf(E,bid),sk.status),n>1?4000:1200);
      // Nhát đầu đúng công thức; các nhát sau có thể mạnh hơn vì Phá giáp cộng dồn từ nhát trước.
      const want=exp(atk*P(i)*sk.dmg), got=hitsOn(bid).map(x=>x.v);
      ok(got.length>=n&&want.includes(got[0]),`${sk.name}: ${got.length} nhát ${got.join("/")} (nhát đầu cần ${want.join(" hoặc ")})`+(got.length?"":` [${whyMiss(id,bid)}]`));
      if(sk.status) ok(stOk(beastOf(E,bid),sk.status),`${sk.name}: gây ${stName(sk.status)}`);
      return bid;
    }
    // Tà Hỏa Phượng Hoàng: thiêu đốt diện rộng, bay (chỉ hiệu ứng), lãnh vực phượng hoàng +30% sát thương nhận.
    {
      const id="ta_hoa_phuong_hoang", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id,["hoa_long"]),`E: ${vname(id)} ra trận`);
      await basic(id,0); await basic(id,1);
      const x0=me.x, y0=me.y; await basic(id,2,{d:40});
      ok(Math.hypot(me.x-x0,me.y-y0)>=50&&E.fxs.some(f=>f.k==="fly"&&f.id===E.room.sessionId),`${sk[2].name}: bay ${Math.hypot(me.x-x0,me.y-y0).toFixed(0)} pixel qua hồn thú (fx fly)`);
      const fb=await basic(id,3);
      ok(await waitFor(()=>hasBuff(me,"phoenix")&&hasBuff(B.room.state.players.get(E.room.sessionId),"phoenix"),500),`${sk[3].name}: mở lãnh vực (người khác cũng thấy)`);
      const amp=sk[3].self.buff.phoenix*BP(3);
      await test(E,"ready"); await cast(E,0); let want=exp(atk*P(0)*sk[0].dmg*(1+amp));
      ok(want.includes(hitsOn(fb)[0]?.v),`trong lãnh vực: ${sk[0].name} ${hitsOn(fb)[0]?.v} (cần ${want.join(" hoặc ")}, +${Math.round(amp*100)}%)`+(hitsOn(fb).length?"":` [${whyMiss(id,fb)}]`));
      // Đổi sang Hỏa Long: lãnh vực thuộc hồn sư nên vẫn còn; hồn thú ngoài bán kính không bị tăng sát thương.
      await test(E,"energy",{v:0}); ok(await switchRow(E,rowE("hoa_long"))&&hasBuff(me,"phoenix"),"đổi sang Hỏa Long: lãnh vực vẫn còn");
      const hl=skillsOf("hoa_long"), ah=atkE("hoa_long");
      await test(E,"clear"); const far=await spawnAt(4,PHOENIX_FIELD_R+30); await test(E,"status",{s:"stun",secs:10});
      await test(E,"ready"); await cast(E,1); want=exp(ah*P(1)*hl[1].dmg);
      ok(want.includes(hitsOn(far)[0]?.v),`ngoài lãnh vực (cách ${dist(far).toFixed(0)}): ${hl[1].name} ${hitsOn(far)[0]?.v} (cần ${want.join(" hoặc ")})`);
      const nb=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10});
      await test(E,"ready"); await cast(E,1); want=exp(ah*P(1)*hl[1].dmg*(1+amp));
      ok(want.includes(hitsOn(nb)[0]?.v),`trong lãnh vực: ${hl[1].name} của Hỏa Long ${hitsOn(nb)[0]?.v} (cần ${want.join(" hoặc ")})`);
      await test(E,"clear");
    }
    await reset();
    // Hỏa Long: tầm xa phạm vi rộng, Viêm bạo kích nổ toàn bộ tầng Thiêu đốt rồi đặt lại 1 tầng.
    {
      const id="hoa_long", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id,["ta_hoa_phuong_hoang"])&&!hasBuff(me,"phoenix"),`E: ${vname(id)} ra trận (lãnh vực đã hết)`);
      await basic(id,0); await basic(id,1,{d:110}); await basic(id,2);
      const nb=await basic(id,3); ok(await waitFor(()=>beastOf(E,nb)?.burn===sk[3].boom.keep,500),`${sk[3].name} khi chưa có Thiêu đốt: đặt ${beastOf(E,nb)?.burn} tầng`);
      await test(E,"clear"); await face(); const bid=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10});
      await test(E,"status",{s:"burn",n:4}); const b=beastOf(E,bid); await waitFor(()=>b?.burn===4,500);
      await test(E,"ready"); await cast(E,3,300);
      const boom=dmgsOn(E,bid).find(x=>x.c===bc&&x.v>atk)?.v, lo=Math.round(atk*STATUS.burn.dot*4*(STATUS.burn.secs-1)*STATUS.burn.boom), hi=Math.round(atk*STATUS.burn.dot*4*STATUS.burn.secs*STATUS.burn.boom);
      ok(boom>=lo&&boom<=hi&&b?.burn===sk[3].boom.keep,`Viêm bạo: kích nổ 4 tầng ${boom} (khoảng ${lo}–${hi}), còn ${b?.burn} tầng đặt lại`);
      // Combo lưu phái: Tà Hỏa Phượng Hoàng cộng dồn Thiêu đốt, đổi tay vào Hỏa Long đầy năng lượng: tiên cơ Viêm bạo.
      await lineup("ta_hoa_phuong_hoang"); // đội mới vẫn có võ hồn đang ra trận thì nó giữ nguyên ra trận
      ok(await lineup("ta_hoa_phuong_hoang",[id]),"E: Tà Hỏa Phượng Hoàng ra trận, Hỏa Long chờ");
      await face(); const cb=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10});
      await test(E,"ready"); await cast(E,1); await test(E,"ready"); await cast(E,1); const c=beastOf(E,cb);
      ok(c?.burn===4,`Dục Hỏa Phượng Hoàng 2 lần: Thiêu đốt cộng dồn ${c?.burn} tầng`);
      await waitFor(()=>me.swCd===0,3500); await test(E,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sqOf(E,rowE(id))?.en===TIEN_CO_MAX);
      E.dmgs=[]; E.room.send("switch",{slot:E.owned.team.indexOf(rowE(id))});
      const lo2=Math.round(atkE("ta_hoa_phuong_hoang")*P(1)*STATUS.burn.dot*4*(STATUS.burn.secs-1.5)*STATUS.burn.boom);
      ok(await waitFor(()=>dmgsOn(E,cb).some(x=>x.c===bc&&x.v>=lo2)&&c?.burn===1,1500)&&await lastLog(E,new RegExp(TIEN_CO_RIENG[id].name)),
        `tiên cơ ${TIEN_CO_RIENG[id].name}: kích nổ ${Math.max(0,...dmgsOn(E,cb).filter(x=>x.c===bc).map(x=>x.v))} (≥ ${lo2}), đặt lại ${c?.burn} tầng`);
      await test(E,"clear");
    }
    await reset();
    // Hỏa Ảnh: đẩy lùi, choáng, Dễ thương cho đồng đội, thiêu đốt.
    {
      const id="hoa_anh", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await test(E,"clear"); await face(); const pb=await spawnAt(3,20); await test(E,"ready"); const d0=dist(pb); await cast(E,0,120);
      ok(dist(pb)>=d0+sk[0].push*CC_TIER_MULT[3]*0.7&&exp(atk*P(0)*sk[0].dmg).includes(hitsOn(pb)[0]?.v)&&hasSt(beastOf(E,pb),"burn"),
        `${sk[0].name}: đẩy lùi ${d0.toFixed(0)} -> ${dist(pb).toFixed(0)} pixel, sát thương ${hitsOn(pb)[0]?.v}, Thiêu đốt`);
      await basic(id,1,{stun:false});
      const vb=await basic(id,2); await test(E,"ready"); await cast(E,0); const w=exp(atk*P(0)*sk[0].dmg*(1+STATUS.vuln.amp));
      ok(w.includes(hitsOn(vb)[0]?.v),`Dễ thương: ${sk[0].name} sau đó ${hitsOn(vb)[0]?.v} (cần ${w.join(" hoặc ")})`);
      await basic(id,3,{stun:false});
      await test(E,"clear");
    }
    await reset();
    // Kỳ Nhung Thông Thiên Cúc: cánh hoa nhiều nhát liên tục quanh thân, Phá giáp, Trói.
    {
      const id="ky_nhung_thong_thien_cuc", sk=skillsOf(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await basic(id,0);
      const b1=await basic(id,1,{n:sk[1].n}); ok(await waitFor(()=>beastOf(E,b1)?.burn===STATUS.burn.max,500),`${sk[1].name}: Thiêu đốt cộng dồn ${beastOf(E,b1)?.burn} tầng`);
      await basic(id,2,{stun:false});
      // 8 nhát: Phá giáp tăng dần nên chỉ kiểm số nhát, tầng tối đa và Trói ở nhát cuối.
      await test(E,"clear"); await face(); const b3=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10}); await test(E,"ready"); await cast(E,3,0);
      ok(await waitFor(()=>hitsOn(b3).length>=sk[3].n&&hasSt(beastOf(E,b3),"root"),4000)&&beastOf(E,b3)?.burn===STATUS.burn.max&&beastOf(E,b3)?.armor===STATUS.armor.max,
        `${sk[3].name}: ${hitsOn(b3).length}/${sk[3].n} nhát, Thiêu đốt ${beastOf(E,b3)?.burn}, Phá giáp ${beastOf(E,b3)?.armor}, nhát cuối Trói`);
      await test(E,"clear");
    }
    await reset();
    // Nguyệt Nhận: lướt xuyên hàng, khóa hồn thú yếu máu nhất (không phải gần nhất), càng ít máu càng đau.
    {
      const id="nguyet_nhan", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await basic(id,0,{d:40}); await basic(id,2);
      // Hồn thú 10 vạn năm để còn sống qua các nhát (chí mạng có thể hạ sớm ở nhát cuối).
      for(const [i,dd,pct] of [[1,70,20],[3,90,50]]){
        await test(E,"clear"); await face(); const far=await spawnAt(4,dd); await test(E,"bhp",{pct}); await test(E,"status",{s:"stun",secs:10});
        const near=await spawnAt(4,22); await test(E,"status",{s:"stun",secs:10}); await test(E,"ready"); await cast(E,i,0);
        ok(await waitFor(()=>hitsOn(far).length>=sk[i].n||(hitsOn(far).length&&!beastOf(E,far)),1500)&&!hitsOn(near).length,`${sk[i].name}: khóa hồn thú yếu máu cách ${dd} (${hitsOn(far).length} nhát), bỏ qua hồn thú gần đủ máu`);
        const w=exp(atk*P(i)*sk[i].dmg*(1+sk[i].lowHp*(1-pct/100)));
        ok(w.includes(hitsOn(far)[0]?.v),`${sk[i].name}: mục tiêu còn ${pct}% sinh lực, nhát đầu ${hitsOn(far)[0]?.v} (cần ${w.join(" hoặc ")}, +${Math.round(sk[i].lowHp*(100-pct))}%)`);
      }
      await test(E,"clear");
    }
    await reset();
    // Tiên cơ riêng của 5 võ hồn Thiêu đốt.
    await test(E,"rest",{s:15});
    for(const [k,id] of FIRE.entries()){
      const own=TIEN_CO_RIENG[id], other=FIRE[(k+1)%FIRE.length], atk=atkE(id);
      await lineup(other,[id]); await face(); E.fxs=[];
      const r=await tienCo(E,rowE(id),{tier:4,dx:at(own.dash?70:20)[0],dy:at(own.dash?70:20)[1]});
      ok(r.fx?.own&&r.fx.vh===vohonIndex(id)&&await lastLog(E,new RegExp(own.name)),`tiên cơ riêng ${vname(id)}: ${own.name}`);
      const w=exp(atk*own.dmg), first=hitsOn(r.bid)[0]?.v, b=beastOf(E,r.bid);
      ok(w.includes(first),`${own.name}: sát thương ${first} (cần ${w.join(" hoặc ")})`);
      if(own.status) ok(await waitFor(()=>stOk(b,own.status),800),`${own.name}: gây ${stName(own.status)}`);
      if(own.boom) ok(await waitFor(()=>b?.burn===own.boom.keep,800),`${own.name}: đặt lại ${b?.burn} tầng Thiêu đốt`);
      if((own.n??1)>1) ok(await waitFor(()=>hitsOn(r.bid).length>=own.n,2500),`${own.name}: ${hitsOn(r.bid).length}/${own.n} nhát`);
      if(own.finisher) ok(await waitFor(()=>stOk(b,own.finisher),2500),`${own.name}: nhát cuối ${stName(own.finisher)}`);
      if(own.self?.buff?.phoenix) ok(await waitFor(()=>hasBuff(me,"phoenix"),500)&&E.fxs.some(f=>f.k==="fly"),`${own.name}: bay và mở lãnh vực phượng hoàng`);
      await test(E,"clear"); await test(E,"rest",{s:15}); await reset();
    }
  }
  // ---------- 2.5c: lưu phái Cảm điện (Lam Điện Bá Vương Long, Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa, Yêu Hồ, Xúc Xích) ----------
  {
    const ELEC=["lam_dien_ba_vuong_long","kim_vu_mieu_ung","can_khon_hon_nguyen_toa","yeu_ho","xuc_xich"], sc=STATUS.shock.col, LD="lam_dien_ba_vuong_long";
    ok(ELEC.every(v=>skillsOf(v).length===4&&skillsOf(v)!==SKILLS&&TIEN_CO_RIENG[v]),"2.5c: 5 võ hồn Cảm điện có 4 hồn kỹ riêng và tiên cơ riêng");
    for(const vohon of ELEC) if(!E.owned.list.some(v=>v.vohon===vohon)) await test(E,"grant",{vohon});
    ok(ELEC.every(id=>E.owned.list.some(v=>v.vohon===id)),"E sở hữu 5 võ hồn Cảm điện (hook grant)");
    // Đặt lại cấp 40 (hạ hồn thú có thể lên cấp, công đổi) và Phong Lôi Chi Lực về 0 (đầy thì Lôi Động Minh Thiên tự tung, lẫn vào số đo).
    const reset=async()=>{ for(const id of ELEC) await test(E,"set",{rowId:rowE(id),level:40,xp:0,rings:YRS}); await test(E,"lei",{v:0}); };
    await reset();
    const hitsOn=bid=>dmgsOn(E,bid).filter(d=>d.c!==sc), chainOn=bid=>dmgsOn(E,bid).filter(d=>d.c===sc);
    const dist=bid=>{const q=beastOf(E,bid); return q?Math.hypot(q.x-me.x,q.y-me.y):-1;}, posOf=bid=>{const q=beastOf(E,bid); return q?[q.x,q.y]:[0,0];};
    const stacksOf=(b,s)=>s==="allure"?b.allure:s==="lock"?b.lock:b[s];
    // Trạng thái cộng dồn đủ tầng thì bùng phát (Mị hoặc -> Mê hoặc, Phong ấn -> Dễ thương): kiểm trạng thái sau khi bùng phát.
    const after=list=>(list??[]).map(a=>STATUS[a.s].burst&&(a.n??1)>=STATUS[a.s].max?{s:STATUS[a.s].burst.s}:a);
    const stOk=(b,list)=>!!b&&after(list).every(a=>hasSt(b,a.s)&&(!a.n||(stacksOf(b,a.s)??0)>=a.n));
    const stName=list=>after(list).map(a=>STATUS[a.s].name+(a.n?` ${a.n} tầng`:"")).join(", ");
    /** Tung hồn kỹ ô i vào một hồn thú mới (bậc `tier`, cách `d` theo hướng thử; `stun`: choáng sẵn để đứng yên): kiểm nhát đầu và trạng thái. */
    async function basic(id,i,{tier=4,d=24,stun=true,n=1,st=true}={}){
      const sk=skillsOf(id)[i], atk=atkE(id);
      await test(E,"clear"); await face(); const bid=await spawnAt(tier,d); if(stun) await test(E,"status",{s:"stun",secs:10});
      await test(E,"lei",{v:0}); await test(E,"ready"); await cast(E,i,0);
      await waitFor(()=>hitsOn(bid).length>=n&&(!st||stOk(beastOf(E,bid),sk.status)),n>1?4500:1200);
      const want=exp(atk*P(i)*sk.dmg), got=hitsOn(bid).map(x=>x.v);
      ok(got.length>=n&&want.includes(got[0]),`${sk.name}: ${got.length} nhát ${got.join("/")} (nhát đầu cần ${want.join(" hoặc ")})`);
      if(st&&sk.status) ok(stOk(beastOf(E,bid),sk.status),`${sk.name}: gây ${stName(sk.status)}`);
      return bid;
    }
    // Lam Điện Bá Vương Long: Cảm điện diện rộng, lan Cảm điện, thêm sát thương lên hồn thú Cảm điện, Phong Lôi Chi Lực.
    {
      const id=LD, sk=skillsOf(id), atk=atkE(id), G=PHONG_LOI.gain, M=PHONG_LOI.shockMult;
      ok(await lineup(id,["kim_vu_mieu_ung"]),`E: ${vname(id)} ra trận`);
      const b0=await basic(id,0);
      ok(await waitFor(()=>me.lei===G.skill,500),`${PHONG_LOI.name}: hồn kỹ trúng hồn thú chưa Cảm điện +${me.lei} (cần ${G.skill})`);
      await test(E,"ready"); await cast(E,0);
      ok(hitsOn(b0).length===1&&await waitFor(()=>me.lei===G.skill*(1+M),500),`hồn kỹ trúng hồn thú đang Cảm điện: ×${M}, ${PHONG_LOI.name} ${me.lei} (cần ${G.skill*(1+M)})`);
      await test(E,"lei",{v:0}); await sleep(450); E.dmgs=[]; E.room.send("attack"); await waitFor(()=>hitsOn(b0).length,800);
      ok(hitsOn(b0).length===1&&await waitFor(()=>me.lei===G.attack*M,500),`đòn thường trúng hồn thú Cảm điện: ${PHONG_LOI.name} ${me.lei} (cần ${G.attack*M})`);
      await basic(id,1);
      // Lan Cảm điện: 3 tia sét vào mục tiêu gần nhất, mỗi tia lan 40% sang hồn thú Cảm điện gần đó; hồn thú xa hơn chainR không bị lan.
      await test(E,"clear"); await face(); const c1=await spawnAt(4,20), c2=await spawnAt(4,56), c3=await spawnAt(4,100);
      await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"status",{s:"shock",secs:10,all:true});
      ok([c1,c2,c3].every(c=>hasSt(beastOf(E,c),"shock")),"3 hồn thú Cảm điện (hook)");
      await test(E,"lei",{v:0}); await test(E,"ready"); await cast(E,2,0);
      await waitFor(()=>hitsOn(c1).length>=sk[2].n&&chainOn(c2).length>=sk[2].n,1500);
      const h=hitsOn(c1).map(x=>x.v), ch=chainOn(c2).map(x=>x.v), w0=exp(atk*P(2)*sk[2].dmg);
      ok(h.length===sk[2].n&&w0.includes(h[0]),`${sk[2].name}: ${h.length} tia ${h.join("/")} vào mục tiêu gần nhất (tia đầu cần ${w0.join(" hoặc ")})`);
      ok(ch.length===h.length&&ch.every((v,k)=>v===Math.max(1,Math.round(h[k]*STATUS.shock.chain)))&&!hitsOn(c2).length,
        `lan Cảm điện mỗi tia: ${ch.join("/")} sang hồn thú cách ${Math.hypot(posOf(c1)[0]-posOf(c2)[0],posOf(c1)[1]-posOf(c2)[1]).toFixed(0)} pixel (cần ${h.map(v=>Math.round(v*STATUS.shock.chain)).join("/")})`);
      ok(!dmgsOn(E,c3).length,`hồn thú Cảm điện cách xa hơn ${STATUS.shock.chainR} pixel không bị lan`);
      // Long Hống: hồn thú đang Cảm điện chịu thêm 120% công.
      await test(E,"clear"); await face(); const lb=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10}); await test(E,"status",{s:"shock"});
      await test(E,"lei",{v:0}); await test(E,"ready"); await cast(E,3);
      let want=exp(atk*P(3)*(sk[3].dmg+sk[3].perStack.dmg));
      ok(want.includes(hitsOn(lb)[0]?.v),`${sk[3].name} lên hồn thú Cảm điện: ${hitsOn(lb)[0]?.v} (cần ${want.join(" hoặc ")})`);
      // Phong Lôi Chi Lực đầy: tự tung Lôi Động Minh Thiên (Choáng = ngắt chiêu), về 0. Hồn thú Trói sẵn (không Choáng) để thấy Choáng mới.
      await test(E,"clear"); await face(); const lm=await spawnAt(4,24); await test(E,"status",{s:"root",secs:10}); await test(E,"status",{s:"shock",secs:10});
      await test(E,"lei",{v:PHONG_LOI.max-G.skill*M}); await test(E,"ready"); E.dmgs=[]; E.fxs=[]; E.room.send("skill",{i:1});
      const fired=await waitFor(()=>E.fxs.some(f=>f.k==="bolt"&&f.id===E.room.sessionId)&&hitsOn(lm).length>=2,1500);
      const ls=PHONG_LOI.skill, pw=skillPower(Math.max(...YRS)); want=exp(atk*pw*(ls.dmg+ls.perStack.dmg));
      ok(fired&&await lastLog(E,new RegExp(ls.name))&&await waitFor(()=>me.lei===0,500),`${PHONG_LOI.name} đầy sau hồn kỹ trúng hồn thú Cảm điện: tự tung ${ls.name}, thanh về ${me.lei}`);
      ok(want.includes(hitsOn(lm)[1]?.v),`${ls.name}: sát thương ${hitsOn(lm)[1]?.v} (cần ${want.join(" hoặc ")}, sức mạnh ×${pw} theo hồn hoàn ${Math.max(...YRS)} năm)`);
      ok(await waitFor(()=>hasSt(beastOf(E,lm),"stun"),400),`${ls.name}: Choáng (ngắt chiêu)`);
      // Ngoài giao chiến thì giảm dần; Lam Điện gục thì mất hết.
      await test(E,"clear"); await test(E,"lei",{v:50});
      ok(await waitFor(()=>B.room.state.players.get(E.room.sessionId)?.lei===50,500),"người khác thấy thanh Phong Lôi Chi Lực (state công khai)");
      await test(E,"rest",{s:TIEN_CO_IDLE_SECS+2});
      ok(me.lei>=50-2*PHONG_LOI.decay-6&&me.lei<=50-2*PHONG_LOI.decay,`ngoài giao chiến ${TIEN_CO_IDLE_SECS+2} giây: ${PHONG_LOI.name} 50 -> ${me.lei}`);
      await test(E,"lei",{v:60}); await test(E,"down"); ok(await waitFor(()=>me.lei===0&&E.owned.active!==rowE(id)),`${vname(id)} gục: mất ${PHONG_LOI.name}`);
      await test(E,"rest",{s:REVIVE_SECS+1}); await test(E,"clear");
    }
    await reset();
    // Kim Vũ Miêu Ưng: vuốt sét Cảm điện, tê liệt (co giật không đi + Câm lặng không đánh), bay, áo nghĩa phủ Cảm điện toàn vùng.
    {
      const id="kim_vu_mieu_ung", sk=skillsOf(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await basic(id,0,{n:sk[0].n});
      // Tê liệt trên hồn thú vạn năm (khống chế × 0,75): Choáng (đã chốt 2026-10-20, thay Trói) nên không đi, không đánh; hết Choáng
      // trước, Câm lặng còn lâu hơn.
      const tl=sk[1].status, tS=tl.find(a=>a.s==="stun")?.secs, tQ=tl.find(a=>a.s==="silence")?.secs;
      ok(tS>0&&tQ>tS&&!tl.some(a=>a.s==="root"),`${sk[1].name}: tê liệt = Choáng ${tS} giây + Câm lặng ${tQ} giây (không còn Trói)`);
      const tb=await basic(id,1,{tier:3,d:40,stun:false}), t0=posOf(tb); E.hurts=[]; await sleep(tS*CC_TIER_MULT[3]*1000-500);
      ok(beastOf(E,tb)&&same(posOf(tb),t0)&&!E.hurts.length&&hasSt(beastOf(E,tb),"stun")&&hasSt(beastOf(E,tb),"silence"),"tê liệt: hồn thú kề bên đứng yên, không đánh (Choáng + Câm lặng)");
      // Thời gian trạng thái chạy theo nhịp server (dt mỗi nhịp kẹp 100 ms, server bận thì chậm hơn đồng hồ thật): chờ hết Choáng
      // rồi mới xem Câm lặng (còn thêm 2,25 giây), không đo bằng một khoảng ngủ cố định.
      const unstun=await waitFor(()=>!hasSt(beastOf(E,tb),"stun"),tS*CC_TIER_MULT[3]*1000), silent=hasSt(beastOf(E,tb),"silence");
      ok(unstun&&silent,`hết Choáng sau ${tS*CC_TIER_MULT[3]} giây, Câm lặng còn (${tQ*CC_TIER_MULT[3]} giây)`+
        (unstun&&silent?"":` [hồn thú ${beastOf(E,tb)?"còn":"mất"}, Choáng ${hasSt(beastOf(E,tb),"stun")}, Câm lặng ${silent}]`));
      const x0=me.x, y0=me.y; await basic(id,2,{d:40});
      ok(Math.hypot(me.x-x0,me.y-y0)>=50&&E.fxs.some(f=>f.k==="fly"&&f.id===E.room.sessionId),`${sk[2].name}: bay ${Math.hypot(me.x-x0,me.y-y0).toFixed(0)} pixel qua hồn thú (fx fly)`);
      // Áo nghĩa: mọi hồn thú trong 160 pixel Cảm điện 8 giây (lâu hơn mặc định 6 giây).
      await test(E,"clear"); await face(70); const a1=await spawnAt(4,24), a2=await spawnAt(4,90), a3=await spawnAt(4,-70);
      await test(E,"status",{s:"stun",secs:12,all:true}); await test(E,"ready"); await cast(E,3,300);
      ok([a1,a2,a3].every(a=>hasSt(beastOf(E,a),"shock"))&&exp(atkE(id)*P(3)*sk[3].dmg).includes(hitsOn(a2)[0]?.v),`${sk[3].name}: phủ Cảm điện 3 hồn thú (cách ${[a1,a2,a3].map(a=>dist(a).toFixed(0)).join("/")}), sát thương ${hitsOn(a2)[0]?.v}`);
      await sleep((STATUS.shock.secs+0.6)*1000);
      ok([a1,a2,a3].every(a=>hasSt(beastOf(E,a),"shock")),`sau ${STATUS.shock.secs+0.6} giây vẫn Cảm điện (8 giây)`);
      // Combo lưu phái: phủ Cảm điện rồi đổi tay vào Lam Điện Bá Vương Long đầy năng lượng: tiên cơ kích nổ Cảm điện, lan sang hồn thú bên cạnh.
      await lineup(id,[LD]); await face(); const k1=await spawnAt(4,24), k2=await spawnAt(4,60);
      await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"ready"); await cast(E,3,300);
      ok(hasSt(beastOf(E,k1),"shock")&&hasSt(beastOf(E,k2),"shock"),"Kim Ưng Lôi Vực phủ Cảm điện 2 hồn thú");
      await waitFor(()=>me.swCd===0,3500); await test(E,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sqOf(E,rowE(LD))?.en===TIEN_CO_MAX);
      E.dmgs=[]; E.room.send("switch",{slot:E.owned.team.indexOf(rowE(LD))});
      const own=TIEN_CO_RIENG[LD], w=exp(atkE(LD)*(own.dmg+own.perStack.dmg));
      ok(await waitFor(()=>hitsOn(k1).length&&chainOn(k2).length,1500)&&w.includes(hitsOn(k1)[0]?.v)&&await lastLog(E,new RegExp(own.name)),
        `combo: đổi tay vào ${vname(LD)}, ${own.name} lên hồn thú Cảm điện ${hitsOn(k1)[0]?.v} (cần ${w.join(" hoặc ")}), lan ${chainOn(k2).map(x=>x.v).join("/")}`);
      await test(E,"clear");
    }
    await reset();
    // Càn Khôn Hỗn Nguyên Tỏa: Phong ấn cộng dồn thành Dễ thương 6,8 giây, vùng phong tỏa cố định (bay tới), gom quái.
    {
      const id="can_khon_hon_nguyen_toa", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      const l0=await basic(id,0); ok(beastOf(E,l0)?.lock===1,`${sk[0].name}: Phong ấn ${beastOf(E,l0)?.lock} tầng`);
      await test(E,"status",{s:"lock",n:STATUS.lock.max-2}); ok(beastOf(E,l0)?.lock===STATUS.lock.max-1&&!hasSt(beastOf(E,l0),"vuln"),`Phong ấn ${STATUS.lock.max-1} tầng: chưa Dễ thương`);
      await test(E,"status",{s:"lock"}); const vt=Date.now();
      ok(!hasSt(beastOf(E,l0),"lock")&&hasSt(beastOf(E,l0),"vuln"),`đủ ${STATUS.lock.max} tầng Phong ấn: bùng phát thành Dễ thương, xóa Phong ấn`);
      await test(E,"ready"); E.dmgs=[]; await cast(E,0); const wv=exp(atk*P(0)*sk[0].dmg*(1+STATUS.vuln.amp));
      ok(wv.includes(hitsOn(l0)[0]?.v),`Dễ thương: ${sk[0].name} ${hitsOn(l0)[0]?.v} (cần ${wv.join(" hoặc ")})`);
      await sleep(Math.max(0,(STATUS.vuln.secs+0.8)*1000-(Date.now()-vt)));
      ok(hasSt(beastOf(E,l0),"vuln"),`Dễ thương từ Phong ấn còn sau ${STATUS.vuln.secs+0.8} giây (mặc định ${STATUS.vuln.secs})`);
      // Hết hạn thì chờ theo state (thời gian trạng thái chạy theo nhịp server, server bận thì chậm hơn đồng hồ thật).
      ok(await waitFor(()=>!hasSt(beastOf(E,l0),"vuln"),Math.max(0,(STATUS.lock.burst.secs+1.6)*1000-(Date.now()-vt))),`hết Dễ thương sau ${STATUS.lock.burst.secs} giây`);
      // Vùng phong tỏa: bay tới hồn thú cách 90, vùng cố định ở chỗ đặt; hồn sư lùi ra xa vùng vẫn đánh đủ nhát.
      for(const [i,zd] of [[1,100],[3,115]]){
        // Hướng thử phải trống hết quãng tới hồn thú (face() chỉ kiểm 100 pixel).
        await test(E,"clear"); [ux,uy]=clearDir(me.x,me.y,zd+20); await step(E,ux,uy); const zb=await spawnAt(4,zd); await test(E,"status",{s:"stun",secs:10,bid:zb});
        // Hồn thú hoang lang thang vào gần thì có thể thành mục tiêu thay cho con vừa sinh: ghi lại để chẩn đoán.
        const others=()=>[...E.room.state.beasts.entries()].filter(([k,o])=>k!==zb&&Math.hypot(o.x-me.x,o.y-me.y)<160).map(([,o])=>`${Math.hypot(o.x-me.x,o.y-me.y).toFixed(0)}`);
        // Chờ thấy cú bay trong state (server bận thì bản vá đến sau hơn 150 ms), không đo sau một khoảng cố định.
        await test(E,"ready"); const d0=dist(zb), o0=others(); await cast(E,i,0);
        await waitFor(()=>dist(zb)<d0-40&&E.fxs.some(f=>f.k==="zone"),1500); const d1=dist(zb);
        ok(d1<d0-40&&E.fxs.some(f=>f.k==="zone"&&Math.abs(f.r-sk[i].r)<1),`${sk[i].name}: bay tới (cách ${d0.toFixed(0)} -> ${d1.toFixed(0)}), đặt vùng phong tỏa`+
          (d1<d0-40?"":` [hướng ${ux},${uy}, hồn thú khác gần: ${o0.join("/")||"không"}]`));
        // Lùi theo đường vừa bay (không vướng cây) tới khi ra ngoài bán kính vùng.
        E.room.send("input",{x:-ux,y:-uy}); await waitFor(()=>dist(zb)>sk[i].r+8,2500); E.room.send("input",{x:0,y:0});
        const away=dist(zb);
        await waitFor(()=>hitsOn(zb).length>=sk[i].n,(sk[i].n*sk[i].every+1)*1000);
        const hs=hitsOn(zb).map(x=>x.v), w1=exp(atk*P(i)*sk[i].dmg), b=beastOf(E,zb);
        ok(away>sk[i].r&&hs.length===sk[i].n&&w1.includes(hs[0]),`vùng cố định: hồn sư cách ${away.toFixed(0)} (> ${sk[i].r}) vẫn ${hs.length}/${sk[i].n} nhát ${hs.join("/")} (nhát đầu cần ${w1.join(" hoặc ")})`+
          (away>sk[i].r?"":` [đứng ${me.x.toFixed(0)},${me.y.toFixed(0)}, hướng lùi ${-ux},${-uy}, choáng ${hasSt(b,"stun")}, hồn thú khác gần: ${others().join("/")||"không"}, sinh lực ${me.hp}]`));
        ok(hasSt(b,"vuln")&&(b?.lock??9)<STATUS.lock.max&&(!sk[i].status.some(a=>a.s==="shock")||hasSt(b,"shock")),`${sk[i].name}: Phong ấn cộng dồn thành Dễ thương (còn ${b?.lock} tầng)`+(sk[i].status.some(a=>a.s==="shock")?", Cảm điện":""));
      }
      // Càn Khôn Đảo Chuyển: kéo hai hồn thú về sát thân, Phong ấn, Cảm điện (gom lại để lan Cảm điện).
      await test(E,"clear"); await face(); const g1=await spawnAt(3,60), g2=await spawnAt(3,74);
      await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"ready"); const gd=[dist(g1),dist(g2)]; await cast(E,2,0);
      const pulled=()=>[g1,g2].every(g=>dist(g)>=0&&dist(g)<TIERS[3].size/2+16&&hasSt(beastOf(E,g),"shock")&&beastOf(E,g).lock===1);
      await waitFor(pulled,1500);
      ok(pulled(),`${sk[2].name}: kéo 2 hồn thú về cách ${dist(g1).toFixed(0)} / ${dist(g2).toFixed(0)} pixel, Phong ấn, Cảm điện`+
        (pulled()?"":` [trước khi tung ${gd.map(x=>x.toFixed(0)).join("/")}, hồn sư ${me.x.toFixed(0)},${me.y.toFixed(0)}, sinh lực ${me.hp}, hồn lực ${me.mp}/${me.maxMp}, st ${me.st}, log ${E.logs.slice(-2).join(" | ")}]`));
      await test(E,"clear");
    }
    await reset();
    // Yêu Hồ: Mị hoặc cộng dồn thành Mê hoặc (đi lung tung, không đánh), làm chậm, ảo ảnh tàng hình, lãnh vực cố định.
    {
      const id="yeu_ho", sk=skillsOf(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      const m0=await basic(id,0); ok(beastOf(E,m0)?.allure===1,`${sk[0].name}: Mị hoặc ${beastOf(E,m0)?.allure} tầng`);
      const m3=await basic(id,3,{st:false}); const b3=beastOf(E,m3);
      ok(await waitFor(()=>b3?.allure===2&&hasSt(b3,"silence")&&hasSt(b3,"shock"),500),`${sk[3].name}: Mị hoặc ${b3?.allure} tầng, Câm lặng (ngắt chiêu), Cảm điện`);
      await test(E,"ready"); await cast(E,0);
      ok(hasSt(beastOf(E,m3),"charm")&&!hasSt(beastOf(E,m3),"allure"),"Mị hoặc đủ 3 tầng: Mê hoặc, xóa Mị hoặc");
      // Mê hoặc trên hồn thú vạn năm đang đánh hồn sư: bỏ mục tiêu, đi lung tung, không đánh; đang Mê hoặc không cộng thêm Mị hoặc.
      await test(E,"clear"); await face(); const cb=await spawnAt(3,16); await waitFor(()=>beastOf(E,cb)?.aggro,1500);
      const tC=Date.now(), cMs=STATUS.charm.secs*CC_TIER_MULT[3]*1000; await test(E,"status",{s:"allure",n:3}); const p0=posOf(cb); E.hurts=[];
      await test(E,"status",{s:"allure"});
      ok(hasSt(beastOf(E,cb),"charm")&&!beastOf(E,cb)?.allure,"đang Mê hoặc: không cộng thêm Mị hoặc");
      // Theo dõi tới khi hết Mê hoặc (1,875 giây trên hồn thú vạn năm): đi lung tung đổi hướng ngẫu nhiên nên lấy quãng xa nhất, không lấy
      // điểm cuối. Đòn trúng chỉ đếm tới trước lúc Mê hoặc có thể hết trên server (tính từ lúc gửi hook, trừ 300 ms): hết Mê hoặc thì
      // hồn thú đánh ngay, tin dmg gửi ngay còn bản vá state xóa Mê hoặc đến sau, và hai lần hỏi hook trước đó dài ra khi server bận.
      let far=0, agg=false, hurt=0;
      await waitFor(()=>{ const q=beastOf(E,cb); if(!q||!hasSt(q,"charm")) return true;
        far=Math.max(far,Math.hypot(q.x-p0[0],q.y-p0[1])); agg||=q.aggro; if(Date.now()<tC+cMs-300) hurt=E.hurts.length; return false; },cMs+1000);
      ok(beastOf(E,cb)&&!agg&&!hurt&&far>4,`Mê hoặc: bỏ mục tiêu, không đánh, đi lung tung ${far.toFixed(0)} pixel`+
        (hurt||agg?` [nhắm hồn sư ${agg}, trúng ${E.hurts.slice(0,hurt).map(h=>`${h.v} ${h.c}`).join("/")||"không"}]`:""));
      ok(await waitFor(()=>!hasSt(beastOf(E,cb),"charm"),STATUS.charm.secs*CC_TIER_MULT[3]*1000),`hết Mê hoặc sau ${STATUS.charm.secs*CC_TIER_MULT[3]} giây`);
      // Làm chậm: hồn thú đuổi theo hồn sư đi chậm hơn (đo quãng đi trong 0,6 giây).
      const run=async slow=>{ await test(E,"clear"); await face(); const sb=await spawnAt(1,60); if(slow) await test(E,"status",{s:"slow",secs:5});
        await sleep(150); const q0=posOf(sb); await sleep(600); const q1=posOf(sb); return Math.hypot(q1[0]-q0[0],q1[1]-q0[1]); };
      const v0=await run(false), v1=await run(true);
      ok(v0>8&&v1<v0*(1-STATUS.slow.slow/2)&&v1>v0*(1-STATUS.slow.slow)*0.6,`Làm chậm: hồn thú đi ${v1.toFixed(1)} pixel thay vì ${v0.toFixed(1)} (−${STATUS.slow.slow*100}%)`);
      // Ảo ảnh tàng hình: hồn thú đang đuổi mất dấu; đánh thường thì hiện hình.
      // Hồn thú vạn năm (chủ động đuổi, đủ máu để chí mạng không hạ ngay).
      await reset(); await test(E,"clear"); await face(); const hb=await spawnAt(3,30); await waitFor(()=>beastOf(E,hb)?.aggro,1500);
      await test(E,"ready"); await cast(E,1,0);
      ok(await waitFor(()=>hasBuff(me,"hide")&&hasBuff(B.room.state.players.get(E.room.sessionId),"hide")&&beastOf(E,hb)?.allure===1,800),`${sk[1].name}: tàng hình (người khác thấy), ảo ảnh Mị hoặc 1 tầng`+
        (hasBuff(me,"hide")&&beastOf(E,hb)?"":` (tàng hình ${hasBuff(me,"hide")}, võ hồn ${VOHON[me.vh].id}, sinh lực ${me.hp}/${me.maxHp}, hồn thú ${beastOf(E,hb)?`cách ${dist(hb).toFixed(0)}, Mị hoặc ${beastOf(E,hb).allure}`:"không còn"}, log ${E.logs.slice(-2).join(" | ")})`));
      ok(await waitFor(()=>beastOf(E,hb)&&!beastOf(E,hb).aggro,800),"tàng hình: hồn thú bỏ mục tiêu"+(beastOf(E,hb)?.aggro?` (vẫn đuổi, cách ${dist(hb).toFixed(0)})`:""));
      await sleep(450); E.room.send("attack"); ok(await waitFor(()=>!hasBuff(me,"hide"),600),"đánh thường: hiện hình");
      // Đã chốt 2026-10-20: bị đòn trực tiếp đánh trúng (hook `hurt` đi qua hurtPlayer như đòn của hồn thú) cũng hiện hình.
      await test(E,"ready"); await cast(E,1,0); ok(await waitFor(()=>hasBuff(me,"hide"),800),`${sk[1].name}: tàng hình lại`);
      await test(E,"hurt",{pct:5}); ok(await waitFor(()=>!hasBuff(me,"hide"),600)&&!hasBuff(B.room.state.players.get(E.room.sessionId),"hide"),"bị đánh trúng: hiện hình (người khác cũng thấy)");
      // Lãnh vực đặt xuống đất: cố định chỗ tung, Làm chậm mỗi nhát, nhát cuối Mị hoặc.
      // Hồn thú đứng sau lưng; hồn sư đi tới trước (đường đã kiểm không vướng cây) ra ngoài bán kính, lãnh vực vẫn ở chỗ cũ.
      await test(E,"clear"); await face(30); const fb=await spawnAt(4,-30); await test(E,"status",{s:"stun",secs:10});
      await test(E,"ready"); await cast(E,2,100);
      ok(E.fxs.some(f=>f.k==="zone"&&Math.abs(f.r-sk[2].r)<1),`${sk[2].name}: đặt lãnh vực`);
      E.room.send("input",{x:ux,y:uy}); await waitFor(()=>dist(fb)>sk[2].r+8,2500); E.room.send("input",{x:0,y:0}); const away=dist(fb);
      ok(await waitFor(()=>hitsOn(fb).length>=sk[2].n&&beastOf(E,fb)?.allure===1,4000)&&hasSt(beastOf(E,fb),"slow")&&away>sk[2].r,
        `lãnh vực cố định: ${hitsOn(fb).length}/${sk[2].n} nhát dù hồn sư đã đi xa (cách ${away.toFixed(0)}), Làm chậm, nhát cuối Mị hoặc 1 tầng`);
      await test(E,"clear");
    }
    await reset();
    // Xúc Xích: hồi sinh lực, hồi hồn lực, xúc xích bay, Phục Chế sao chép hồn kỹ võ hồn khác trong đội.
    {
      const id="xuc_xich", sk=skillsOf(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận (một mình trong đội)`);
      await test(E,"hurt",{pct:60}); await waitFor(()=>me.hp<me.maxHp*0.5); const h0=me.hp; await test(E,"ready"); await cast(E,0,300);
      ok(me.hp>=h0+Math.floor(me.maxHp*sk[0].self.heal*BP(0))-1,`${sk[0].name}: sinh lực ${h0} -> ${me.hp}/${me.maxHp} (+${Math.round(sk[0].self.heal*BP(0)*100)}%)`);
      await test(E,"ready",{mp:20}); const mq=me.mp; await cast(E,1,300);
      ok(me.mp>=mq+Math.floor(me.maxMp*sk[1].self.mp*BP(1))-1,`${sk[1].name}: hồn lực ${mq} -> ${me.mp}/${me.maxMp}`);
      await test(E,"ready"); await cast(E,2,200);
      ok(hasBuff(me,"spd")&&E.fxs.some(f=>f.k==="fly"&&f.id===E.room.sessionId),`${sk[2].name}: tăng tốc, bay (fx fly)`);
      await test(E,"ready"); await cast(E,3,200);
      ok(/chưa có hồn kỹ/.test(E.logs.at(-1)??"")&&me.cds[3]===0,`${sk[3].name}: đội không có võ hồn khác vừa tung hồn kỹ thì không tung, không hồi chiêu`);
      // Lam Điện tung Lôi Đình Phích Lịch, đổi sang Xúc Xích: Phục Chế tung lại hồn kỹ đó với công của Xúc Xích × 0,8 sức mạnh vòng 4.
      await test(E,"rest",{s:15}); await lineup(LD); ok(await lineup(LD,[id]),`E: ${vname(LD)} ra trận, ${vname(id)} chờ`); await face(); const cb=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10});
      await test(E,"lei",{v:0}); await test(E,"ready"); await cast(E,1);
      ok(await switchRow(E,rowE(id)),"đổi sang Xúc Xích");
      await test(E,"ready"); await cast(E,3,300); const lsk=skillsOf(LD)[1], w=exp(atkE(id)*P(3)*sk[3].copy*lsk.dmg);
      ok(await lastLog(E,new RegExp(`sao chép ${lsk.name}`))&&w.includes(hitsOn(cb)[0]?.v),`${sk[3].name}: sao chép ${lsk.name}, sát thương ${hitsOn(cb)[0]?.v} (cần ${w.join(" hoặc ")})`);
      // Hiệu ứng lên bản thân cũng × copy: Cửu Bảo Lưu Ly Tháp tung Phòng Chi Lưu Ly (khiên), Xúc Xích chép lại -> khiên = 0,8 lần.
      const CB="cuu_bao_luu_ly_thap", psk=skillsOf(CB)[3];
      await test(E,"set",{rowId:rowE(CB),level:40,xp:0,rings:YRS}); await test(E,"rest",{s:15});
      await lineup(CB); ok(await lineup(CB,[id]),`E: ${vname(CB)} ra trận, ${vname(id)} chờ`);
      await test(E,"hurt",{pct:5}); await waitFor(()=>me.shield===0); await test(E,"ready"); await cast(E,3,0);
      const s0=()=>Math.round(me.maxHp*psk.self.shield*BP(3));
      ok(await waitFor(()=>me.shield>0&&me.shield===s0(),800),`${psk.name}: khiên gốc ${me.shield} (cần ${s0()})`);
      ok(await switchRow(E,rowE(id)),"đổi sang Xúc Xích");
      await test(E,"hurt",{pct:5}); await waitFor(()=>me.shield===0); await test(E,"ready"); await cast(E,3,0);
      const s1=()=>Math.round(me.maxHp*psk.self.shield*BP(3)*sk[3].copy);
      ok(await lastLog(E,new RegExp(`sao chép ${psk.name}`))&&await waitFor(()=>me.vh===vohonIndex(id)&&me.shield>0&&me.shield===s1(),800),
        `${sk[3].name}: sao chép ${psk.name}, khiên ${me.shield} (cần ${s1()} = ${sk[3].copy} lần khiên gốc theo sinh lực Xúc Xích)`);
      // Võ hồn nguồn đã gục thì không chép: Lam Điện tung hồn kỹ rồi gục, Xúc Xích tự ra trận, Phục Chế không tung.
      await test(E,"clear"); await test(E,"rest",{s:15}); await lineup(LD); ok(await lineup(LD,[id]),`E: ${vname(LD)} ra trận, ${vname(id)} chờ`);
      await test(E,"lei",{v:0}); await test(E,"ready"); await cast(E,1,200);
      await test(E,"down"); ok(await waitFor(()=>me.vh===vohonIndex(id)&&!me.dead,1500),`${vname(LD)} gục, ${vname(id)} tự ra trận`);
      await test(E,"ready"); await cast(E,3,300);
      ok(/chưa có hồn kỹ/.test(E.logs.at(-1)??"")&&me.cds[3]===0,`${sk[3].name}: võ hồn nguồn đang gục thì không sao chép, không hồi chiêu (${E.logs.at(-1)})`);
      await test(E,"rest",{s:REVIVE_SECS+1}); await test(E,"clear");
    }
    await reset();
    // Tiên cơ riêng của 5 võ hồn Cảm điện.
    await test(E,"rest",{s:15});
    for(const [k,id] of ELEC.entries()){
      const own=TIEN_CO_RIENG[id], other=ELEC[(k+1)%ELEC.length], atk=atkE(id);
      await lineup(other,[id]); await face(); E.fxs=[];
      // Tiên cơ phụ trợ: võ hồn đang ra trận (sẽ ra sân) mất máu trước để thấy được hồi; hồn lực thuộc hồn sư, giữ tỉ lệ khi đổi.
      if(own.area==="self"){ await test(E,"hurt",{pct:50}); await test(E,"drain",{pct:50}); await sleep(150); }
      const oth=E.owned.active, h0=me.hp, max0=me.maxHp, mr=me.mp/me.maxMp;
      const r=await tienCo(E,rowE(id),{tier:own.area==="self"?-1:4,dx:at(20)[0],dy:at(20)[1]});
      ok(r.fx?.own&&r.fx.vh===vohonIndex(id)&&await lastLog(E,new RegExp(own.name)),`tiên cơ riêng ${vname(id)}: ${own.name}`);
      if(own.dmg){
        const w=exp(atk*own.dmg), first=hitsOn(r.bid)[0]?.v, b=beastOf(E,r.bid);
        ok(w.includes(first),`${own.name}: sát thương ${first} (cần ${w.join(" hoặc ")})`);
        if(own.status) ok(await waitFor(()=>stOk(b,own.status),800),`${own.name}: gây ${stName(own.status)}`);
        if(own.fly) ok(E.fxs.some(f=>f.k==="fly"),`${own.name}: bay`);
      } else {
        // Khiên và hồn lực theo chỉ số của võ hồn vừa đổi vào: đọc trong waitFor (bản vá state đổi võ hồn có thể đến sau tin trả lời).
        const sh=()=>Math.round(me.maxHp*own.self.shield), mw=()=>Math.floor(mr*me.maxMp+me.maxMp*own.self.mp)-2;
        ok(await waitFor(()=>me.vh===vohonIndex(id)&&me.shield===sh()&&sqOf(E,oth)?.hp>=h0+Math.floor(max0*own.self.heal)-1&&me.mp>=mw(),1000),
          `${own.name}: võ hồn trong đội ${h0} -> ${sqOf(E,oth)?.hp}/${max0}, hồn lực ${me.mp}/${me.maxMp} (cần ≥ ${mw()}), khiên ${me.shield} (cần ${sh()})`);
      }
      await test(E,"clear"); await test(E,"rest",{s:15}); await reset();
    }
    // Tung tiên cơ cũng hiện hình như đánh thường: Yêu Hồ tàng hình rồi đổi tay vào Lam Điện đầy năng lượng.
    {
      const YH="yeu_ho", hsk=skillsOf(YH)[1];
      await lineup(YH); ok(await lineup(YH,[LD]),`E: ${vname(YH)} ra trận, ${vname(LD)} chờ`); await face(); await test(E,"ready"); await cast(E,1,0);
      ok(await waitFor(()=>hasBuff(me,"hide"),800),`${hsk.name}: tàng hình`); const t0=Date.now();
      const r=await tienCo(E,rowE(LD),{tier:-1}), dt=Date.now()-t0;
      ok(r.fx?.k==="tienco"&&await waitFor(()=>!hasBuff(me,"hide"),600)&&dt<hsk.self.secs*1000-300,
        `tiên cơ ${TIEN_CO_RIENG[LD].name}: hiện hình (tung sau ${dt} ms, tàng hình còn ${hsk.self.secs} giây)`);
      await test(E,"clear"); await test(E,"rest",{s:15}); await reset();
    }
  }
  // ---------- 2.5d: 5 võ hồn còn lại (Cửu Tinh Thất Sát Kiếm, Nhu Cốt Thố, Tử Vong Chu Hoàng, Quỷ Mị, Thiên Càn Bạch Ngọc Đỉnh), ràng buộc ----------
  {
    const REST=["cuu_tinh_that_sat_kiem","nhu_cot_tho","tu_vong_chu_hoang","quy_mi","thien_can_bach_ngoc_dinh"];
    ok(VOHON.every(v=>skillsOf(v.id).length===4&&skillsOf(v.id)!==SKILLS&&TIEN_CO_RIENG[v.id]),`2.5d: cả ${VOHON.length} võ hồn có 4 hồn kỹ riêng và tiên cơ riêng`);
    ok(skillsOf("vo_hon_chua_co")===SKILLS,"4 hồn kỹ chung giữ làm dự phòng cho võ hồn chưa có bảng riêng");
    for(const vohon of REST) if(!E.owned.list.some(v=>v.vohon===vohon)) await test(E,"grant",{vohon});
    ok(REST.every(id=>E.owned.list.some(v=>v.vohon===id)),"E sở hữu 5 võ hồn còn lại (hook grant)");
    // Đặt lại cấp 40 (hạ hồn thú có thể lên cấp, công đổi), năng lượng về 0 (đổi tay vào võ hồn đầy năng lượng sẽ tung tiên cơ).
    const reset=async()=>{ for(const id of [...REST,"hao_thien_chuy","ta_hoa_phuong_hoang","hoa_anh"]) await test(E,"set",{rowId:rowE(id),level:40,xp:0,rings:YRS}); await test(E,"energy",{v:0}); };
    await reset(); await test(E,"rest",{s:15});
    const skip=new Set([STATUS.poison.col,STATUS.shock.col,STATUS.burn.col]); // sát thương theo thời gian và lan Cảm điện
    const hitsOn=bid=>dmgsOn(E,bid).filter(d=>!skip.has(d.c)), dist=bid=>{const q=beastOf(E,bid); return q?Math.hypot(q.x-me.x,q.y-me.y):-1;};
    const stOk=(b,list)=>!!b&&(list??[]).every(a=>hasSt(b,a.s)&&(!a.n||(b[a.s]??0)>=a.n));
    const stName=list=>(list??[]).map(a=>STATUS[a.s].name+(a.n?` ${a.n} tầng`:"")).join(", ");
    const moved=(x0,y0)=>Math.hypot(me.x-x0,me.y-y0), sum=a=>a.reduce((x,y)=>x+y,0);
    /** Hồn thú mới bậc `tier` cách `d` theo hướng thử, gây sẵn trạng thái `pre` qua hook (mặc định Choáng để đứng yên). */
    async function target(tier,d,pre=["stun"]){
      await test(E,"clear"); await face(); const bid=await spawnAt(tier,d);
      for(const a of pre) await test(E,"status",typeof a==="string"?{s:a,secs:10}:{secs:10,...a});
      return bid;
    }
    /** Hồn sư mất `pct`% sinh lực (hook) để thấy được hồi / hút máu; trả về sinh lực sau khi mất. */
    async function hurtTo(pct){ const h=me.hp; await test(E,"hurt",{pct}); await waitFor(()=>me.hp<h); return me.hp; }
    /** Tung hồn kỹ ô i vào hồn thú mới: kiểm nhát đầu đúng công thức và trạng thái. */
    async function basic(id,i,{tier=4,d=24,pre=["stun"],n=1,st=true}={}){
      const sk=skillsOf(id)[i], atk=atkE(id), bid=await target(tier,d,pre);
      await test(E,"ready"); await cast(E,i,0);
      await waitFor(()=>hitsOn(bid).length>=n&&(!st||stOk(beastOf(E,bid),sk.status)),n>1?4500:1200);
      const want=exp(atk*P(i)*sk.dmg), got=hitsOn(bid).map(x=>x.v);
      ok(got.length>=n&&want.includes(got[0]),`${sk.name}: ${got.length} nhát ${got.join("/")} (nhát đầu cần ${want.join(" hoặc ")})`+(got.length?"":` [${E.logs.slice(-2).join(" | ")}]`));
      if(st&&sk.status) ok(stOk(beastOf(E,bid),sk.status),`${sk.name}: gây ${stName(sk.status)}`);
      return bid;
    }
    // Cửu Tinh Thất Sát Kiếm: Liệt thương (Phá giáp) cộng dồn, Vô Ngã Kiếm Trận liên tục, Thất Sát Trảm (bản nhỏ của Kiếm Trảm Sơn Hà) mạnh theo tầng Phá giáp.
    {
      const id="cuu_tinh_that_sat_kiem", sk=skillsOf(id), atk=atkE(id), n=STATUS.armor.max;
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await basic(id,0,{d:28}); await basic(id,1,{d:30});
      const kb=await basic(id,2,{n:sk[2].n});
      ok(beastOf(E,kb)?.armor===n,`${sk[2].name}: kiếm trận ${hitsOn(kb).length} nhát, Phá giáp cộng dồn ${beastOf(E,kb)?.armor} tầng`);
      const tb=await target(4,30,["stun",{s:"armor",n}]); await test(E,"ready"); await cast(E,3);
      const w=exp(atk*P(3)*(sk[3].dmg+sk[3].perStack.dmg*n)*(1+n*STATUS.armor.amp)), got=hitsOn(tb)[0]?.v;
      ok(w.includes(got),`${sk[3].name}: mục tiêu Phá giáp ${n} tầng, sát thương ${got} (cần ${w.join(" hoặc ")})`);
      await test(E,"clear");
    }
    // Nhu Cốt Thố: lướt, quật ngã (Choáng), tăng chí mạng, hút máu; ràng buộc chí mạng với Hạo Thiên Chùy.
    {
      const id="nhu_cot_tho", sk=skillsOf(id), atk=atkE(id), still=["root","charm"]; // đứng yên (Trói), không đánh (Mê hoặc; từ 3.5 Câm lặng không chặn đánh thường), nhưng chưa Choáng
      ok(await lineup(id,["hao_thien_chuy"]),`E: ${vname(id)} ra trận, Hạo Thiên Chùy trong đội`);
      let bo=await test(E,"bond");
      ok(bondsOf(["hao_thien_chuy","nhu_cot_tho"])[0]===BONDS[0]&&bo.crit===BONDS[0].crit&&bo.burn===0,`ràng buộc ${BONDS[0].name}: chí mạng +${Math.round(bo.crit*100)}% khi cả hai trong đội`);
      let bid=await target(4,45,still), h0=await hurtTo(50), x0=me.x, y0=me.y;
      // Tin dmg tới trước bản vá state: Choáng phải chờ theo state (trượt khi máy tải cao, PR #92). Choáng chỉ 0,6 × CC_TIER_MULT[4] =
      // 0,3 giây nên chờ ngay từ lúc server xử lý chiêu (cast không ngủ thêm): ngủ 200 ms rồi mới đọc thì máy tải cao có lúc đã hết Choáng.
      // Sinh lực hút về nằm cùng bản vá với Choáng, tin dmg tới trước bản vá ấy.
      await test(E,"ready"); await cast(E,0,0);
      const stun=await waitFor(()=>hasSt(beastOf(E,bid),"stun"),1000); await waitFor(()=>hitsOn(bid).length>0,1000);
      let got=hitsOn(bid)[0]?.v, w=exp(atk*P(0)*sk[0].dmg), hw=Math.min(me.maxHp,h0+Math.floor((got??0)*sk[0].lifesteal));
      ok(w.includes(got)&&moved(x0,y0)>=10&&stun,`${sk[0].name}: lướt ${moved(x0,y0).toFixed(0)} pixel, sát thương ${got} (cần ${w.join(" hoặc ")}), quật ngã (Choáng)`);
      ok(me.hp>=hw-1&&me.hp<=hw+4,`${sk[0].name}: hút ${sk[0].lifesteal*100}% sát thương, sinh lực ${h0} -> ${me.hp} (cần ~${hw})`);
      bid=await target(4,40); x0=me.x; y0=me.y; await test(E,"ready"); await cast(E,1);
      got=hitsOn(bid)[0]?.v; w=exp(atk*P(1)*sk[1].dmg);
      ok(moved(x0,y0)>=50&&w.includes(got),`${sk[1].name}: thuấn di ${moved(x0,y0).toFixed(0)} pixel xuyên hồn thú, sát thương ${got} (cần ${w.join(" hoặc ")})`);
      // Vô Địch Kim Thân: hồn thú kề bên vừa đánh xong, đòn kế tiếp (1,1 giây sau) rơi vào lúc bất tử.
      await test(E,"clear"); await face(); await spawnAt(3,14); E.hurts=[];
      ok(await waitFor(()=>E.hurts.length>0,3000),"hồn thú kề bên đánh hồn sư");
      await test(E,"ready"); await cast(E,2,150); E.hurts=[];
      ok(await waitFor(()=>hasBuff(me,"crit"),500),`${sk[2].name}: chí mạng +${Math.round(sk[2].self.buff.crit*BP(2)*100)}% trong ${sk[2].self.secs} giây`);
      await sleep(sk[2].inv*1000-450);
      ok(!E.hurts.length,`${sk[2].name}: bất tử ${sk[2].inv} giây, hồn thú kề bên không gây sát thương`);
      bid=await target(4,55,still); h0=await hurtTo(50); await test(E,"ready"); await cast(E,3,0);
      ok(await waitFor(()=>hitsOn(bid).length>=sk[3].n&&hasSt(beastOf(E,bid),"stun"),3000),`${sk[3].name}: ${hitsOn(bid).length}/${sk[3].n} đoạn, đoạn cuối quật ngã (Choáng)`);
      const all=hitsOn(bid).map(x=>x.v); w=exp(atk*P(3)*sk[3].dmg); hw=Math.min(me.maxHp,h0+Math.floor(sum(all)*sk[3].lifesteal));
      ok(w.includes(all[0])&&me.hp>=hw-4&&me.hp<=hw+6,`đoạn đầu ${all[0]} (cần ${w.join(" hoặc ")}); hút ${sk[3].lifesteal*100}% của ${sum(all)}: sinh lực ${h0} -> ${me.hp} (cần ~${hw})`);
      await lineup(id); bo=await test(E,"bond"); ok(bo.crit===0,"bỏ Hạo Thiên Chùy khỏi đội: hết ràng buộc");
      await test(E,"clear");
    }
    // Tử Vong Chu Hoàng: độc nhện, giăng tơ gom quái, lưới độc cố định, Thiên La mạnh theo tầng Trúng độc.
    {
      const id="tu_vong_chu_hoang", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await basic(id,0,{d:50});
      await test(E,"clear"); await face(); const g1=await spawnAt(3,70), g2=await spawnAt(3,84);
      await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"ready"); await cast(E,1,300);
      ok([g1,g2].every(g=>dist(g)>=0&&dist(g)<TIERS[3].size/2+16&&stOk(beastOf(E,g),sk[1].status)),
        `${sk[1].name}: kéo 2 hồn thú về cách ${dist(g1).toFixed(0)} / ${dist(g2).toFixed(0)} pixel, ${stName(sk[1].status)}`);
      const vb=await basic(id,2,{n:sk[2].n});
      ok(await waitFor(()=>hasSt(beastOf(E,vb),"root"),800)&&beastOf(E,vb)?.poison===STATUS.poison.max,`${sk[2].name}: nhát cuối Trói, Trúng độc cộng dồn ${beastOf(E,vb)?.poison} tầng`);
      const tb=await target(4,60,["stun",{s:"poison",n:4}]); await test(E,"ready"); await cast(E,3,300);
      const w=exp(atk*P(3)*(sk[3].dmg+sk[3].perStack.dmg*4)), got=hitsOn(tb)[0]?.v;
      ok(w.includes(got)&&dist(tb)<TIERS[4].size/2+16&&stOk(beastOf(E,tb),[{s:"root"},{s:"shock"}])&&beastOf(E,tb)?.poison===STATUS.poison.max,
        `${sk[3].name}: 4 tầng độc, sát thương ${got} (cần ${w.join(" hoặc ")}), kéo về ${dist(tb).toFixed(0)} pixel, Trói, Cảm điện, độc ${beastOf(E,tb)?.poison} tầng`);
      await test(E,"clear");
    }
    // Quỷ Mị: hút máu, hút huyết cả đội (đổi võ hồn vẫn còn), tăng sát thương đội, Quỷ Ảnh Tiềm Hành tàng hình cả đội.
    {
      const id="quy_mi", sk=skillsOf(id), atk=atkE(id), CT="cuu_tinh_that_sat_kiem";
      await test(E,"rest",{s:15}); ok(await lineup(id,[CT]),`E: ${vname(id)} ra trận, ${vname(CT)} chờ`); await test(E,"energy",{v:0});
      let bid=await target(4,50,["root","charm"]), h0=await hurtTo(50);
      await test(E,"ready"); await cast(E,0);
      let got=hitsOn(bid)[0]?.v, w=exp(atk*P(0)*sk[0].dmg), hw=Math.min(me.maxHp,h0+Math.floor((got??0)*sk[0].lifesteal));
      ok(w.includes(got)&&me.hp>=hw-1&&me.hp<=hw+4,`${sk[0].name}: sát thương ${got} (cần ${w.join(" hoặc ")}), hút máu: sinh lực ${h0} -> ${me.hp} (cần ~${hw})`);
      await test(E,"ready"); await cast(E,1);
      const lv=sk[1].self.buff.leech*BP(1);
      ok(await waitFor(()=>hasBuff(me,"leech")&&hasBuff(B.room.state.players.get(E.room.sessionId),"leech"),500),`${sk[1].name}: hút huyết ${Math.round(lv*100)}% (người khác cũng thấy)`);
      await test(E,"energy",{v:0}); ok(await switchRow(E,rowE(CT))&&hasBuff(me,"leech"),`đổi sang ${vname(CT)}: hút huyết vẫn còn`);
      bid=await target(4,28); h0=await hurtTo(50); await test(E,"ready"); await cast(E,0);
      got=hitsOn(bid)[0]?.v; hw=Math.min(me.maxHp,h0+Math.floor((got??0)*lv));
      ok(got&&me.hp>=hw-1&&me.hp<=hw+4,`${skillsOf(CT)[0].name} khi có hút huyết: sát thương ${got}, sinh lực ${h0} -> ${me.hp} (cần ~${hw})`);
      await test(E,"clear"); await test(E,"energy",{v:0}); ok(await switchRow(E,rowE(id)),`đổi về ${vname(id)}`);
      await test(E,"ready"); await cast(E,2);
      ok(await waitFor(()=>hasBuff(me,"atk")&&hasBuff(me,"crit"),500),`${sk[2].name}: tăng công, tăng chí mạng`);
      await test(E,"clear"); await face(); const hb=await spawnAt(3,30); await waitFor(()=>beastOf(E,hb)?.aggro,1500);
      await test(E,"ready"); await cast(E,3,0);
      ok(await waitFor(()=>hasBuff(me,"hide")&&hasBuff(B.room.state.players.get(E.room.sessionId),"hide"),800),`${sk[3].name}: tàng hình (người khác thấy)`);
      ok(await waitFor(()=>beastOf(E,hb)&&!beastOf(E,hb).aggro,800),"tàng hình: hồn thú bỏ mục tiêu"+(beastOf(E,hb)?.aggro?` (vẫn đuổi, cách ${dist(hb).toFixed(0)})`:""));
      await test(E,"energy",{v:0}); ok(await switchRow(E,rowE(CT))&&hasBuff(me,"hide"),`đổi sang ${vname(CT)}: vẫn tàng hình (cả đội)`);
      await sleep(450); E.room.send("attack"); ok(await waitFor(()=>!hasBuff(me,"hide"),600),"đánh thường: hiện hình");
      await test(E,"clear");
    }
    // Thiên Càn Bạch Ngọc Đỉnh: hồi máu, khiên, Dễ thương + Câm lặng cho đồng đội đánh boss.
    {
      const id="thien_can_bach_ngoc_dinh", sk=skillsOf(id);
      await test(E,"rest",{s:15}); ok(await lineup(id),`E: ${vname(id)} ra trận`);
      let h0=await hurtTo(60); await test(E,"ready"); await cast(E,0,300);
      ok(me.hp>=h0+Math.floor(me.maxHp*sk[0].self.heal*BP(0))-1,`${sk[0].name}: sinh lực ${h0} -> ${me.hp}/${me.maxHp} (+${Math.round(sk[0].self.heal*BP(0)*100)}%)`);
      await test(E,"ready"); await cast(E,1,0); const s1=()=>Math.round(me.maxHp*sk[1].self.shield*BP(1));
      ok(await waitFor(()=>hasBuff(me,"def")&&me.shield===s1(),800),`${sk[1].name}: tăng thủ, khiên ${me.shield} (cần ${s1()})`);
      await basic(id,2,{d:30});
      h0=await hurtTo(60); await test(E,"ready"); await cast(E,3,0); const s3=()=>Math.round(me.maxHp*sk[3].self.shield*BP(3));
      ok(await waitFor(()=>me.shield===s3(),800)&&me.hp>=h0+Math.floor(me.maxHp*sk[3].self.heal*BP(3))-1,`${sk[3].name}: sinh lực ${h0} -> ${me.hp}/${me.maxHp}, khiên ${me.shield} (cần ${s3()})`);
      await test(E,"clear");
    }
    // Ràng buộc Tà Hỏa – Hỏa Ảnh: Thiêu đốt của hồn sư mạnh thêm khi cả hai trong đội (đo sát thương mỗi giây qua hook).
    {
      const TH="ta_hoa_phuong_hoang", bc=STATUS.burn.col, n=3, atk=atkE(TH);
      await test(E,"rest",{s:15}); await reset();
      const tick=async team=>{ await lineup(TH,team); const bid=await target(4,30); E.dmgs=[]; await test(E,"status",{s:"burn",n});
        await waitFor(()=>dmgsOn(E,bid).some(d=>d.c===bc),1500); return dmgsOn(E,bid).find(d=>d.c===bc)?.v; };
      const t0=await tick([]), t1=await tick(["hoa_anh"]), bo=await test(E,"bond");
      const w0=Math.round(atk*STATUS.burn.dot*n), w1=Math.round(atk*STATUS.burn.dot*n*(1+BONDS[1].burn));
      ok(t0===w0&&t1===w1&&bo.burn===BONDS[1].burn,`ràng buộc ${BONDS[1].name}: Thiêu đốt ${n} tầng ${t0} -> ${t1} mỗi giây (cần ${w0} -> ${w1})`);
      await test(E,"clear");
    }
    // 9.4: ràng buộc đầy đủ. Hook `bond` trả tổng mỗi loại; sát thương / hồi máu / khiên đổi đúng tỉ lệ khi đội có cặp; võ hồn trong cặp
    // đang gục vẫn tính; bỏ khỏi đội thì hết.
    {
      for(const vohon of ["a_ngan","bang_phuong_hoang","hoa_long"]) if(!E.owned.list.some(v=>v.vohon===vohon)) await test(E,"grant",{vohon});
      await test(E,"rest",{s:15}); await reset();
      const CT="cuu_tinh_that_sat_kiem", HT="hao_thien_chuy", LN="lam_ngan_thao", CB="cuu_bao_luu_ly_thap", TC="thien_can_bach_ngoc_dinh";
      const bk=name=>BONDS.find(b=>b.name===name), SS=bk("Song Sinh Võ Hồn"), LH=bk("Lam Ngân Hoàng"), BH=bk("Băng Hỏa Lưỡng Nghi"), TB=bk("Thất Bảo Lưu Ly Tông");
      const all=VOHON.map(v=>v.id), same=(a,b)=>Math.abs(a-b)<1e-9;
      ok(BONDS.length===6&&SS?.skill===0.08&&LH?.heal===0.15&&BH?.stunBurn===0.12&&TB?.atk===0.08&&bondSum([LN,HT],"skill")===0.08&&bondSum([HT],"skill")===0
        &&BOND_KEYS.every(k=>same(bondSum(all,k),BONDS.reduce((a,b)=>a+(b[k]??0),0))),
        `9.4: ${BONDS.length} ràng buộc (${BONDS.map(b=>b.name).join(", ")}); bondSum cộng mọi cặp cùng loại`);
      await lineup(HT,["nhu_cot_tho",LN,"a_ngan"]); let bo=await test(E,"bond");
      const want={crit:0.1,burn:0,skill:SS.skill,heal:LH.heal,stunBurn:0,atk:0};
      ok(BOND_KEYS.every(k=>same(bo[k],want[k])),`hook bond đội Hạo Thiên Chùy + Nhu Cốt Thố + Lam Ngân Thảo + A Ngân: ${JSON.stringify(bo)}`);
      // Nhát đầu Thất Sát Kiếm Khí của Cửu Tinh Thất Sát Kiếm (ra trận) lên hồn thú mới, theo đội.
      const sk=skillsOf(CT)[0], base=atkE(CT)*P(0)*sk.dmg;
      const hit0=async(team,pre=["stun"])=>{ await lineup(CT,team); const bid=await target(4,28,pre); await test(E,"ready"); await cast(E,0);
        await waitFor(()=>hitsOn(bid).length>0,1200); return hitsOn(bid)[0]?.v; };
      const chk=async(team,mult,what,pre)=>{ const got=await hit0(team,pre), w=exp(base*mult);
        ok(w.includes(got),`${what}: ${sk.name} ${got} (cần ${w.join(" hoặc ")}, × ${+mult.toFixed(4)})`); };
      await chk([],1,"không ràng buộc");
      await chk([HT,LN],1+SS.skill,`ràng buộc ${SS.name} (sức mạnh hồn kỹ +${SS.skill*100}%)`);
      await chk([CB],1+TB.atk,`ràng buộc ${TB.name} (công +${TB.atk*100}%)`);
      await chk([HT,LN,CB],(1+SS.skill)*(1+TB.atk),`${SS.name} + ${TB.name} cùng lúc`);
      await chk(["bang_phuong_hoang","hoa_long"],1+BH.stunBurn,`ràng buộc ${BH.name}, hồn thú Choáng`);
      await chk(["bang_phuong_hoang","hoa_long"],1,`ràng buộc ${BH.name}, hồn thú chỉ bị Trói`,["root"]);
      await chk(["bang_phuong_hoang","hoa_long"],1+BH.stunBurn,`ràng buộc ${BH.name}, hồn thú Trói + Thiêu đốt`,["root",{s:"burn",n:1}]);
      // Lam Ngân Hoàng: hồi máu và khiên của Thiên Càn Bạch Ngọc Đỉnh (ra trận) mạnh thêm 15%.
      const tsk=skillsOf(TC), heal=async team=>{ await lineup(TC,team); await test(E,"rest",{s:15}); const h0=await hurtTo(60);
        await test(E,"ready"); await cast(E,0,300); return {h0,gain:me.hp-h0,max:me.maxHp}; };
      for(const [team,m] of [[[],1],[["a_ngan",LN],1+LH.heal]]){
        const r=await heal(team), w=r.max*tsk[0].self.heal*BP(0)*m;
        ok(r.h0+w<r.max&&Math.abs(r.gain-w)<=2,`${tsk[0].name}${m>1?` + ${LH.name}`:""}: hồi ${r.gain} (cần ~${w.toFixed(1)})`);
        await test(E,"ready"); await cast(E,1,0); const sw=()=>Math.round(me.maxHp*tsk[1].self.shield*BP(1)*m);
        ok(await waitFor(()=>me.shield===sw(),800),`${tsk[1].name}${m>1?` + ${LH.name}`:""}: khiên ${me.shield} (cần ${sw()})`);
      }
      // Võ hồn trong cặp đang gục vẫn tính; bỏ khỏi đội thì hết.
      await lineup(CB,[CT]); await test(E,"down"); await waitFor(()=>E.owned.active===rowE(CT)&&me.vh===vohonIndex(CT),2000);
      bo=await test(E,"bond"); const st=(await test(E,"stats")).live;
      ok(E.owned.active===rowE(CT)&&same(bo.atk,TB.atk)&&Math.abs(st.atkNow-st.atk*(1+TB.atk))<1e-6,
        `${vname(CB)} gục, ${vname(CT)} ra trận: vẫn ${TB.name}, công ${st.atkNow.toFixed(1)} = ${st.atk.toFixed(1)} × ${1+TB.atk}`);
      // Kết thúc với Thiên Càn Bạch Ngọc Đỉnh ra trận: bài tiên cơ riêng kế tiếp cần đổi tay vào Cửu Tinh Thất Sát Kiếm.
      await test(E,"rest",{s:REVIVE_SECS+1}); await lineup(TC); bo=await test(E,"bond");
      ok(BOND_KEYS.every(k=>bo[k]===0),`đội chỉ còn ${vname(TC)}: hết ràng buộc`);
      await test(E,"clear");
    }
    // Tiên cơ riêng của 5 võ hồn (đổi tay vào với năng lượng đầy).
    await test(E,"rest",{s:15}); await reset();
    for(const [k,id] of REST.entries()){
      const own=TIEN_CO_RIENG[id], other=REST[(k+1)%REST.length], atk=atkE(id);
      await lineup(other,[id]); await face(); E.fxs=[];
      if(own.self?.heal){ await hurtTo(50); await sleep(150); }
      const oth=E.owned.active, h0=me.hp, max0=me.maxHp, d=own.dash?60:20;
      const r=await tienCo(E,rowE(id),{tier:own.area==="self"?-1:4,dx:at(d)[0],dy:at(d)[1]});
      ok(r.fx?.own&&r.fx.vh===vohonIndex(id)&&await lastLog(E,new RegExp(own.name)),`tiên cơ riêng ${vname(id)}: ${own.name}`);
      if(own.dmg){
        const w=exp(atk*own.dmg), first=hitsOn(r.bid)[0]?.v, list=[...(own.status??[]),...(own.finisher??[])];
        ok(w.includes(first),`${own.name}: sát thương ${first} (cần ${w.join(" hoặc ")})`);
        if((own.n??1)>1) ok(await waitFor(()=>hitsOn(r.bid).length>=own.n,1500),`${own.name}: ${hitsOn(r.bid).length}/${own.n} nhát`);
        if(list.length) ok(await waitFor(()=>stOk(beastOf(E,r.bid),list),1500),`${own.name}: gây ${stName(list)}`);
      } else {
        const buffs=Object.keys(own.self.buff??{});
        if(buffs.length) ok(await waitFor(()=>me.vh===vohonIndex(id)&&buffs.every(x=>hasBuff(me,x)),800),`${own.name}: ${buffs.map(x=>BUFFS[x].name).join(", ")}`);
        if(own.self.shield){ const sh=()=>Math.round(me.maxHp*own.self.shield);
          ok(await waitFor(()=>me.vh===vohonIndex(id)&&me.shield===sh()&&sqOf(E,oth)?.hp>=h0+Math.floor(max0*own.self.heal)-1,1000),
            `${own.name}: võ hồn trong đội ${h0} -> ${sqOf(E,oth)?.hp}/${max0}, khiên ${me.shield} (cần ${sh()})`); }
      }
      await test(E,"clear"); await test(E,"rest",{s:15}); await reset();
    }
  }
  await E.room.leave();
  
}

// BĐ5: tà hóa thú vương theo lịch, máu theo số người, giai đoạn 2, chia thưởng, 3 lần/ngày, rương
export async function ab1Block2(ctx) {
  const { A, bossClock, meOf } = ctx;


    // Lịch boss của server (20:00 / 22:00 giờ Việt Nam) chen vào các kiểm tra dùng hook `king` nếu đồng hồ lịch đang trong lúc báo trước
    // hay lúc thú vương ở bản đồ. GAME_TEST mặc định cho lịch đứng yên ngoài mọi khung; server chạy đồng hồ thật (BOSS_CLOCK=real) thì báo.
    { const {now,mode}=await bossClock(A), nx=kingNext(now);
      if(mode.startsWith("frozen")){ await sleep(300); ok((await bossClock(A)).now===now&&kingActive(now)===null&&nx-now>(KING.warnSecs+1800)*1000,
        `GAME_TEST: lịch boss đứng yên ở ${vnHHMM(now)} giờ Việt Nam (${mode}), không theo giờ thật: lịch thật không chen vào bài thử`); }
      if(kingActive(now)!==null||nx-now<(KING.warnSecs+180)*1000)
        console.log(`  ⚠ Đồng hồ lịch boss (${mode}) gần / trong khung thú vương (${vnHHMM(kingActive(now)??nx)} giờ Việt Nam): kiểm tra BĐ5 có thể trượt vì lịch, chạy lại sau ${KING.lifeSecs/60} phút.`); }
    // Dữ liệu: thú vương của Ngoại vi và Nội địa (bảng 5.3), Thánh Hồn Thôn không có; hang (object `boss`) ở vùng sâu nhất.
    const kings=BOSSES.filter(b=>b.rank===2), objsK=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
    const kbad=[];
    for(const [m,id,hp] of [["tinh_dau_ngoai_vi","huyet_nguyet_lang_vuong",72],["tinh_dau_noi_dia","thien_doc_chu_hoang",84],["lac_nhat_sam_lam","luong_nghi_thu_ho_xa",84],["cuc_bac_chi_dia","huyen_minh_bang_giao",96],["hai_than_dao","tham_hai_ma_kinh_vuong",96]]){
      // Vùng sâu nhất = vùng có niên hạn cao nhất (Cực Bắc BĐ6c chia vùng theo hàng, càng lên bắc càng sâu).
      const zy=z=>parseLevelRange(z.properties.find(q=>q.name==="years")?.value)?.[1]??0;
      // Bản đồ lớn (11.3): vùng sâu nhất có thể là nhiều chữ nhật; hang phải nằm trong các mảnh cùng niên hạn cao nhất.
      const d=BOSSES[bossIndex(id)], os=objsK(m), lr=os.filter(o=>o.type==="boss"), zs=os.filter(o=>o.type==="zone"), top=Math.max(...zs.map(zy));
      const inDeep=(x,y)=>zs.some(z=>zy(z)===top&&x>=z.x&&x<=z.x+z.width&&y>=z.y&&y<=z.y+z.height);
      if(MAPS[m].king!==id||d?.rank!==2||d.hp!==hp||beastIndex(d.species)<0) kbad.push(`${m}: ${id}`);
      if(d&&(d.skills.length<2||d.skills.length>3||!(d.phase2?.skills.length||d.phase2?.split)||[...d.skills,...d.phase2.skills].some(s=>s.warn<1))) kbad.push(`${id}: chiêu`);
      if(lr.length!==1||lr[0].properties.find(q=>q.name==="boss")?.value!==id||![[0,0],[1,0],[0,1],[1,1]].every(([a,b])=>inDeep(lr[0].x+a*lr[0].width,lr[0].y+b*lr[0].height))) kbad.push(`${m}: hang`);
    }
    if(MAPS.thanh_hon_thon.king||objsK("thanh_hon_thon").some(o=>o.type==="boss")) kbad.push("thanh_hon_thon có thú vương");
    ok(!kbad.length&&kings.length===5,`5 thú vương (BĐ6b thêm Lạc Nhật, BĐ6c Cực Bắc, BĐ6d Hải Thần Đảo; ${kings.map(k=>`${k.name} x${k.hp}: ${k.skills.map(s=>s.name).join(", ")} + GĐ2 ${k.phase2.name}`).join("; ")}), hang ở vùng sâu nhất, Thánh Hồn Thôn không có`+(kbad.length?`: ${kbad.join("; ")}`:""));
    // Lịch theo giờ Việt Nam (UTC+7, Asia/Ho_Chi_Minh): 20:00 và 22:00; ngày nhận thưởng đổi lúc 00:00.
    const U=(h,mi=0,d=19)=>Date.UTC(2026,9,d,h,mi);
    ok(vnDay(U(16,59)+59000)==="2026-10-19"&&vnDay(U(17,0))==="2026-10-20"&&kingNext(U(12,0))===U(13,0)&&kingNext(U(13,30))===U(15,0)&&kingNext(U(16,0))===U(13,0,20)
      &&kingActive(U(13,10))===U(13,0)&&kingActive(U(13,0)+KING.lifeSecs*1000)===null&&kingActive(U(12,59))===null&&vnHHMM(kingNext(U(14,0)))==="22:00",
      `lịch ${KING_TIMES.join(" / ")} giờ Việt Nam, rút đi sau ${KING.lifeSecs/60} phút, ngày mới lúc 00:00 (23:59 UTC+7 = ${vnDay(U(16,59))}, 00:00 = ${vnDay(U(17,0))})`);
    ok(KING_CHEST.ur===0&&KING.share===0.03&&KING.daily===3&&[1,2,4,10].every(n=>Math.abs(bossHpMult(n)-(1+0.6*(n-1)))<1e-9),"đã chốt: ngưỡng rương 3%, 3 lần/ngày, máu x(1 + 0,6 × (N − 1)); từ BĐ6 (BĐ6e) rương thú vương không còn mảnh UR (5% trước BĐ6)");

    const K=await bot("Tester K","u_minh_linh_mieu",{sex:0,hair:1,hairCol:2,outfitCol:3}), L=await bot("Tester L","nhu_cot_tho",{sex:1,hair:0,hairCol:5,outfitCol:2});
    await waitFor(()=>K.owned&&L.owned&&meOf(K)&&meOf(L));
    /** Đưa bot sang Tinh Đấu Ngoại vi (tài khoản cũ còn `tinh_dau` vào Ngoại vi ở trại cổng, hook legacy của BĐ3). */
    async function toNgoaiVi(b){ const lg=await test(b,"legacy",{mapId:"tinh_dau",x:0,y:0}); await b.room.leave(); await sleep(300);
      b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>b.room.state.players&&meOf(b)&&b.owned); return !!lg?.saved&&b.room.state.mapId==="tinh_dau_ngoai_vi"; }
    ok(await toNgoaiVi(K),"K tới Tinh Đấu Ngoại vi");
    // Báo trước toàn server (presence): A ở Thánh Hồn Thôn cũng nhận đếm ngược.
    A.boss=[]; K.boss=[]; let ki=await test(K,"king",{kop:"warn",s:120});
    ok(await waitFor(()=>A.boss.some(m=>m.k==="warn")&&K.boss.some(m=>m.k==="warn"),1500),`báo trước toàn server: A (${A.room.state.mapId}) "${A.boss.find(m=>m.k==="warn")?.name} xuất hiện sau ${A.boss.find(m=>m.k==="warn")?.in} giây ở ${A.boss.find(m=>m.k==="warn")?.mapName}"`);
    const wa=A.boss.find(m=>m.k==="warn"), wk=K.boss.find(m=>m.k==="warn");
    ok(wa&&!wa.here&&wk?.here&&wk.in===120&&wk.name==="Tà hóa Huyết Nguyệt Lang Vương",`đếm ngược 120 giây; A ở bản đồ khác (here=${wa?.here}), K ở đúng bản đồ (here=${wk?.here})`);
    ok(await toNgoaiVi(L)&&await waitFor(()=>L.boss.some(m=>m.k==="warn"&&m.in<=120&&m.in>100),1500),`L vào Ngoại vi giữa lúc chờ: nhận đếm ngược còn lại (${L.boss.find(m=>m.k==="warn")?.in} giây)`);
    ok(K.room.roomId===L.room.roomId,"K và L cùng kênh Ngoại vi");
    const kings2=()=>[...K.room.state.beasts.entries()].filter(([,b])=>b.rank===2), kingB=()=>kings2()[0]?.[1], kid=()=>kings2()[0]?.[0];
    A.boss=[]; A.chats=[]; K.boss=[];
    await test(K,"king",{kop:"spawn"});
    ok(await waitFor(()=>kingB()&&A.boss.some(m=>m.k==="spawn")&&K.boss.some(m=>m.k==="spawn"),2000),`xuất hiện: báo toàn server (A nhận "${A.boss.find(m=>m.k==="spawn")?.name} … ${A.boss.find(m=>m.k==="spawn")?.mapName}")`);
    ki=await test(K,"king"); const LR=ki.lair, inLair=(x,y)=>x>=LR.x&&x<=LR.x+LR.w&&y>=LR.y&&y<=LR.y+LR.h, Y=MAPS.tinh_dau_ngoai_vi.years[1];
    const kbase=Math.round(beastStats(Y).hp*BOSSES[bossIndex("huyet_nguyet_lang_vuong")].hp);
    ok(ki.bid&&inLair(ki.x,ki.y)&&ki.years===Y&&ki.base===kbase&&ki.maxHp===kbase&&Math.abs(ki.dmg-beastStats(Y).dmg*KING.dmg)<1e-6&&ki.phase===1&&ki.skills.length===2&&ki.life>KING.lifeSecs-5,
      `thú vương trong hang (${ki.x?.toFixed(0)},${ki.y?.toFixed(0)}), ${ki.years} năm, máu x${BOSSES[bossIndex("huyet_nguyet_lang_vuong")].hp} = ${ki.maxHp}, sát thương x${KING.dmg}, giai đoạn 1, 2 chiêu (${ki.skills?.join(", ")}), rút đi sau ${Math.round(ki.life)} giây`);
    await test(K,"king",{kop:"spawn"}); await sleep(200);
    ok(kings2().length===1,"đang có thú vương thì khung giờ mới không sinh thêm (mỗi kênh một con)");

    // Vào hang: K và L đứng trong hang lúc thú vương bắt đầu giao chiến thì cả hai là người tham gia, máu tối đa x1,6.
    async function intoLair(b,dx,dy){ const t=kingB(); for(let k=0;k<24;k++){ const a=k*Math.PI/6, r=k<12?1:1.6, x=Math.round(t.x+dx*r*Math.cos(a)-dy*Math.sin(a)), y=Math.round(t.y+dx*r*Math.sin(a)+dy*Math.cos(a));
      if(!inLair(x,y)) continue; await test(b,"goto",{x,y}); const q=meOf(b); if(Math.hypot(q.x-x,q.y-y)<1) return true; } return false; }
    const outLair=async b=>{ await test(b,"goto",{x:LR.x+LR.w/2,y:LR.y-40}); return !inLair(meOf(b).x,meOf(b).y); };
    ok(await intoLair(K,40,0)&&await intoLair(L,-40,0),`K, L vào hang (${meOf(K).x.toFixed(0)},${meOf(K).y.toFixed(0)}) / (${meOf(L).x.toFixed(0)},${meOf(L).y.toFixed(0)})`);
    await test(K,"clear",{keep:1}); await test(L,"clear",{keep:1});
    // Thú vương x2 sát thương hạ nhanh võ hồn cấp thấp: Choáng dài để nó đứng yên trong lúc thử (giai đoạn 2 gầm lên thì mất Choáng).
    await test(K,"kdmg",{v:1}); await test(K,"status",{s:"stun",secs:60}); ki=await test(K,"king");
    ok(ki.engaged&&ki.n===2&&ki.parts.length===2&&ki.maxHp===Math.round(kbase*bossHpMult(2))&&kingB().parts===2,`K đánh: L đứng trong hang cũng thành người tham gia, 2 người, máu tối đa ${kbase} -> ${ki.maxHp} (x1,6)`);
    // Ra khỏi hang 30 giây liên tục thì bị loại; máu giữ tỉ lệ.
    ok(await outLair(L),"L ra khỏi hang"); const r0=ki.hp/ki.maxHp; await test(K,"etick",{s:KING.outSecs+1}); ki=await test(K,"king");
    ok(ki.parts.join()===K.room.sessionId&&ki.n===1&&ki.maxHp===kbase&&Math.abs(ki.hp/ki.maxHp-r0)<0.01,`L ngoài hang ${KING.outSecs} giây: bị loại, 1 người, máu ${ki.hp}/${ki.maxHp} (giữ tỉ lệ)`);
    ok(await intoLair(L,-40,0),"L quay lại hang"); await test(L,"kdmg",{v:1}); ki=await test(K,"king"); ok(ki.n===2,`L đánh: lại ${ki.n} người`);
    ok(inLair(kingB().x,kingB().y),"thú vương không ra khỏi hang");

    // Giai đoạn 2 ở 50% máu: gầm 2 giây (không nhận khống chế), thêm chiêu, nhanh hơn.
    K.fxs=[]; K.boss=[];
    await test(K,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*KING.phaseHp)+1});
    ok(await waitFor(()=>kingB()?.phase===2,1500)&&K.fxs.some(f=>f.k==="roar")&&K.boss.some(m=>m.k==="phase"&&m.title==="Huyết Cuồng"),`máu ${kingB()?.hp}/${kingB()?.maxHp}: giai đoạn 2 – ${K.boss.find(m=>m.k==="phase")?.title} (${K.boss.find(m=>m.k==="phase")?.desc})`);
    await test(K,"status",{s:"stun",secs:5}); ki=await test(K,"king");
    ok(ki.roar>0&&!ki.st.includes("stun")&&ki.skills.length===3&&ki.skills[2]==="Huyết Cuồng Xung"&&Math.abs(ki.spd-1.4)<1e-9,`đang gầm (${ki.roar.toFixed(1)} giây): không nhận Choáng; chiêu ${ki.skills.join(", ")}; tốc độ x${ki.spd}`);
    await sleep(KING.roarSecs*1000+300);
    await test(K,"status",{s:"stun",secs:60}); ki=await test(K,"king"); ok(!ki.roar&&ki.st.includes("stun"),"hết gầm thì khống chế lại có tác dụng");
    K.fxs=[]; await test(K,"rest",{s:1}); const tl=await test(K,"tele",{i:2}); await waitFor(()=>K.fxs.some(f=>f.k==="tele"),800);
    const tf=K.fxs.find(f=>f.k==="tele"); ok(tl?.name==="Huyết Cuồng Xung"&&tf?.t>=1.2,`chiêu giai đoạn 2 ${tf?.name}: báo trước ${tf?.t} giây (dài hơn hồn thú thường ${TELE_WARN})`);
    await waitFor(()=>K.fxs.some(f=>f.k==="teleHit"||f.k==="teleEnd"),2500);

    // Chia thưởng: L đóng góp 2% (dưới 3%) thì không có rương; người nhiều nhất (K) được ưu tiên hồn hoàn.
    const chestK=b=>qtyOf(b,chestCode("huyet_nguyet_lang_vuong"));
    async function finish(share){ // L gây `share` phần tổng sát thương cuối cùng, K hạ nốt
      let I=await test(K,"king"); const lPrev=(I.list.find(x=>x.id===L.room.sessionId)?.pct??0)/100*I.total, want=Math.floor(share*(I.total+I.hp)-lPrev);
      if(want>0) await test(L,"kdmg",{v:want});
      const before=new Set(K.room.state.drops.keys()); K.boss=[]; await test(K,"kdmg",{v:1e8});
      await waitFor(()=>K.boss.some(m=>m.k==="down"),1500); await sleep(300);
      return { down:K.boss.find(m=>m.k==="down"), drop:[...K.room.state.drops.entries()].find(([k])=>!before.has(k))?.[1] };
    }
    await test(L,"set",{rowId:L.owned.active,level:15,xp:0,rings:[10]}); const lxp=meOf(L).xp;
    K.logs=[]; L.logs=[]; A.chats=[];
    let f=await finish(0.02);
    const lp=f.down?.list.find(x=>x.id===L.room.sessionId)?.pct;
    ok(f.down&&!kingB()&&lp>=1&&lp<3&&f.drop?.owner===K.room.sessionId&&f.drop.years===Y,`hạ thú vương: L đóng góp ${lp}%, K ${f.down?.list[0]?.pct}%; hồn hoàn ${f.drop?.years} năm ưu tiên K (nhiều nhất)`);
    ok(await waitFor(()=>chestK(K)===1,2000)&&chestK(L)===0&&/cần từ 3% mới nhận rương/.test(L.logs.join("\n"))&&/lượt 1\/3/.test(K.logs.join("\n")),`K (≥3%) nhận rương (lượt 1/3), L (<3%) không nhận: "${L.logs.find(t=>/cần từ/.test(t))}"`);
    ok(meOf(L).xp>lxp||meOf(L).level>15,`L vẫn nhận kinh nghiệm (${lxp} -> ${meOf(L).xp}, cấp ${meOf(L).level})`);
    ok(await waitFor(()=>A.chats.some(m=>/Tà hóa Huyết Nguyệt Lang Vương ở Tinh Đấu Ngoại vi đã bị hạ/.test(m.text)),1500),`toàn server được báo: "${A.chats.find(m=>/bị hạ/.test(m.text))?.text}"`);

    // Lần 2: L đóng góp 5% thì có rương. Lần 3: K đủ 3 lượt. Lần 4: hết lượt, vẫn đánh được, nhắc khi vào giao chiến.
    const fight=async(share)=>{ await test(K,"king",{kop:"spawn"}); await waitFor(()=>kingB(),1500); await intoLair(K,40,0); if(share) await intoLair(L,-40,0); else await outLair(L);
      await test(K,"clear",{keep:1}); await test(K,"kdmg",{v:1}); await test(K,"status",{s:"stun",secs:60}); return finish(share); };
    K.logs=[]; L.logs=[]; f=await fight(0.05);
    ok(await waitFor(()=>chestK(L)===1&&chestK(K)===2,2000)&&/lượt 1\/3/.test(L.logs.join("\n"))&&/lượt 2\/3/.test(K.logs.join("\n")),`lần 2: L đóng góp ${f.down?.list.find(x=>x.id===L.room.sessionId)?.pct}% nhận rương (1/3), K 2/3`);
    K.logs=[]; await fight(0); ok(await waitFor(()=>chestK(K)===3,2000)&&/lượt 3\/3/.test(K.logs.join("\n")),"lần 3: K nhận rương thứ 3 (3/3)");
    K.logs=[]; f=await fight(0); await sleep(300);
    ok(f.down&&chestK(K)===3&&/Hôm nay đã hết lượt nhận thưởng thú vương/.test(K.logs.join("\n")),`lần 4: vẫn hạ được nhưng không nhận rương, có nhắc: "${K.logs.find(t=>/hết lượt/.test(t))}"`);
    ok(K.logs.findIndex(t=>/hết lượt/.test(t))<K.logs.findIndex(t=>/^Hạ Tà hóa/.test(t)),"nhắc hết lượt ngay khi vào giao chiến (trước lúc hạ)");
    let cl=await test(K,"claims"); ok(cl.n===3&&cl.db===3,`lượt hôm nay ${cl.day}: ${cl.n} (DB ${cl.db})`);

    // Mở rương: hồn cốt (loài gốc, năm thú vương), mảnh của bản đồ, mảnh UR, 1 hồn hạch sao cao (5.1); cần KING_CHEST.slots ô trống.
    const pool=kingShardPool("tinh_dau_ngoai_vi"), chestIt=()=>K.bag.items.find(i=>i.code===chestCode("huyet_nguyet_lang_vuong"));
    async function open(){ const l=K.logs.length, n=K.bagMsgs; K.room.send("open",{id:chestIt().id}); await waitFor(()=>K.logs.length>l&&K.bagMsgs>n,1500); await sleep(100); return K.logs.at(-1)??""; }
    const s0=qtyOf(K,shardCode(pool[0].vohon)), ur0=KING_CHEST.urShards.reduce((a,v)=>a+qtyOf(K,shardCode(v)),0), b0=bonesOf(K).length;
    const kCores=()=>(K.bag?.items??[]).filter(i=>i.code===CORE_ITEM), c0=kCores().length, cHi=coreStarBand(Y)[1];
    await test(K,"chest",{bone:0,ur:0,i:0,n:4,s:1}); let lg=await open();
    const nb=bonesOf(K).find(i=>i.years===Y&&i.stats?.beast==="phong_lang"&&i.stats?.slot==="than");
    ok(chestK(K)===2&&bonesOf(K).length===b0+1&&nb&&qtyOf(K,shardCode(pool[0].vohon))===s0+4&&KING_CHEST.urShards.reduce((a,v)=>a+qtyOf(K,shardCode(v)),0)===ur0,`mở rương (từ BĐ6 không còn mảnh UR dù số ngẫu nhiên 0): ${lg}`);
    const nc=kCores().slice(c0);
    ok(nc.length===1&&nc[0].stars===cHi&&coreSetIndex(nc[0].stats?.set)>=0&&nc[0].stats?.subs?.length===CORE_SUBS[cHi-1],`rương có 1 hồn hạch sao cao nhất theo ${Y} năm: ${nc[0]?.stars}★ bộ ${nc[0]?.stats?.set}, ${nc[0]?.stats?.subs?.length} dòng phụ`);
    const s3=qtyOf(K,shardCode(pool[3].vohon)), b1=bonesOf(K).length;
    await test(K,"chest",{bone:100,ur:100,i:3}); lg=await open(); const got=qtyOf(K,shardCode(pool[3].vohon))-s3;
    ok(pool[3].vohon===KING_CHEST.fire&&got>=KING_CHEST.shards[0]&&got<=KING_CHEST.shards[1]&&bonesOf(K).length===b1&&chestK(K)===1,`mở rương lần 2 (không hồn cốt, không UR): ${lg}`);
    // Nhóm "bản đồ chưa mở" rỗng dần: BĐ6b bỏ Bích Lân Xà Hoàng (Lạc Nhật), BĐ6c Yêu Hồ (Cực Bắc), BĐ6d Quỷ Mị (Hải Thần Đảo); từ BĐ6d
    // mọi võ hồn trong KING_CHEST.later đều đã có bản đồ rơi mảnh nên nhóm này không còn ai (trọng số 1).
    ok(!pool.some(x=>x.w===1)&&KING_CHEST.later.every(v=>Object.values(MAPS).some(m=>m.shards.includes(v)))&&!pool.some(x=>x.vohon==="quy_mi")&&!pool.some(x=>x.vohon==="yeu_ho")&&!pool.some(x=>x.vohon==="bich_lan_xa_hoang")&&pool.filter(x=>MAPS.tinh_dau_ngoai_vi.shards.includes(x.vohon)).length===3,`mảnh trong rương: của bản đồ, Tà Hỏa Phượng Hoàng, võ hồn bản đồ chưa mở (${pool.map(x=>x.vohon).join(", ")})`);
    // Túi còn dưới KING_CHEST.slots ô trống: không mở được, rương còn nguyên.
    const free=BAG_SLOTS-K.bag.items.filter(i=>i.vohon===null).length; await test(K,"give",{code:"hon_hoan",qty:free-KING_CHEST.slots+1,years:10}); await sleep(100);
    lg=await open(); ok(new RegExp(`Cần ${KING_CHEST.slots} ô trống`).test(lg)&&chestK(K)===1,`túi còn ${KING_CHEST.slots-1} ô trống: "${lg}"`);
    for(const it of K.bag.items.filter(i=>i.code==="hon_hoan"&&i.years===10)){ K.room.send("discard",{id:it.id}); } await waitFor(()=>!K.bag.items.some(i=>i.code==="hon_hoan"&&i.years===10),2000);
    await test(K,"chest",{off:1});

    // Lưu: thoát rồi vào lại vẫn còn rương, lượt hôm nay vẫn 3.
    await K.room.leave(); await sleep(400); await enter(K); await waitFor(()=>K.bag&&K.room.state.players&&meOf(K));
    cl=await test(K,"claims"); ok(chestK(K)===1&&cl.n===3&&cl.db===3,`vào lại: còn ${chestK(K)} rương, lượt hôm nay ${cl.n}/3 (DB ${cl.db})`);
    // Sang ngày mới (00:00 giờ Việt Nam): lượt đặt lại.
    const dy=await test(K,"day",{shift:1}); cl=await test(K,"claims"); K.logs=[]; await fight(0);
    ok(cl.n===0&&await waitFor(()=>chestK(K)===2,2000)&&/lượt 1\/3/.test(K.logs.join("\n")),`ngày ${dy.day}: lượt về 0, hạ thú vương lại nhận rương (1/3)`);
    await test(K,"day",{shift:0});

    // Rút đi: không ai hạ trong 15 phút thì thú vương rời bản đồ, toàn server được báo; người vào sau thấy thời gian còn lại.
    await test(K,"king",{kop:"spawn"}); await waitFor(()=>kingB(),1500);
    await L.room.leave(); await sleep(300); await enter(L); await waitFor(()=>L.room.state.players&&meOf(L));
    ok(await waitFor(()=>L.boss.some(m=>m.k==="here"&&m.life>KING.lifeSecs-30),1500),`L vào lại khi thú vương đang ở bản đồ: còn ${Math.round(L.boss.find(m=>m.k==="here")?.life)} giây trước khi rút đi`);
    A.chats=[]; K.boss=[]; await test(K,"etick",{s:KING.lifeSecs});
    ok(await waitFor(()=>!kingB()&&K.boss.some(m=>m.k==="leave")&&A.chats.some(m=>/đã rút đi/.test(m.text)),1500),`hết ${KING.lifeSecs/60} phút: rút đi ("${A.chats.find(m=>/rút đi/.test(m.text))?.text}")`);

    // Phòng trống bị hủy rồi mở lại trong cùng khung giờ (mục 6, suất thú vương theo bản đồ ở mức tiến trình): còn sống thì về với
    // thời gian còn lại, đã hạ thì không sinh lại. Phòng mới mở trong lúc chờ vẫn có đếm ngược.
    const reopen=async(withL)=>{ const old=K.room.roomId; await K.room.leave(); if(withL) await L.room.leave(); await sleep(600);
      await enter(K); await waitFor(()=>K.room.state.players&&meOf(K)&&K.owned); await sleep(300); return K.room.roomId!==old; };
    await test(K,"king",{kop:"spawn"}); await waitFor(()=>kingB(),1500); ki=await test(K,"king"); const kslot=ki.slot, klife=ki.life;
    const okReopen=await reopen(true); ki=await test(K,"king");
    ok(okReopen&&ki.slot===kslot&&ki.seat==="alive"&&kingB()&&ki.hp===kbase&&ki.phase===1&&ki.life<=klife&&ki.life>klife-15,
      `phòng hủy rồi mở lại (${ki.roomId}): thú vương còn sống trở lại cùng khung, đầy máu, còn ${Math.round(ki.life)}/${Math.round(klife)} giây`);
    await test(A,"king",{kop:"warn",s:30,mapId:"tinh_dau_ngoai_vi"}); await sleep(200);
    K.boss=[]; await reopen();
    ok(await waitFor(()=>K.boss.some(m=>m.k==="warn"&&m.here&&m.in<=30&&m.in>=20),1500),`phòng mở ra trong lúc chờ: có đếm ngược (${K.boss.find(m=>m.k==="warn")?.in} giây)`);
    await enter(L); await waitFor(()=>L.room.state.players&&meOf(L)); await waitFor(()=>kingB(),1500);
    // Bảng xếp hạng sát thương chỉ gửi cho người tham gia: L đứng ngoài hang, chưa đánh thì không nhận.
    await intoLair(K,40,0); await outLair(L); await test(K,"clear",{keep:1}); K.boss=[]; L.boss=[];
    await test(K,"kdmg",{v:1}); await test(K,"status",{s:"stun",secs:60});
    ok(await waitFor(()=>K.boss.some(m=>m.k==="rank"),2500)&&!L.boss.some(m=>m.k==="rank"),"bảng xếp hạng sát thương chỉ gửi cho người tham gia (K trong hang có, L ngoài hang không)");
    f=await finish(0); ki=await test(K,"king"); const dslot=ki.slot;
    ok(f.down&&ki.seat==="down","hạ thú vương của phòng mới mở");
    ok(await reopen(true)&&!(await waitFor(()=>kingB(),800))&&(ki=await test(K,"king")).slot===dslot&&ki.seat==="down"&&!ki.bid,
      `hạ rồi để phòng hủy, mở lại trong cùng khung giờ: không sinh thú vương mới (suất "${ki.seat}")`);
    await K.room.leave();
  
}

// 3.2: hạ hồn thú -> hồn hoàn mang đúng số năm -> nhặt vào túi; ưu tiên người hạ 15 giây; túi đầy; hấp thụ từ túi
export async function ab1Block3(ctx) {
  const { A, B, VILLAGE_RY, blocked, comboHits, inSafe, meOf, p, safe, spawnObj, sqOf, st, tiled, vOf } = ctx;


    const zs=tiled.layers.flatMap(l=>l.objects??[]).filter(o=>(o.type??o.class)==="zone"), hz=zs.find(z=>/Bãi tập/.test(z.name))??zs[0];
    // Hai chỗ cạnh bên (x±8) cũng phải đứng được: mảnh võ hồn rơi khi túi đầy (3.4, x+8) và hồn cốt (4.1, x−8) nằm cạnh hồn hoàn,
    // không chồng lên nó (chồng thì nhấn E chọn hồn hoàn trước).
    let spot=null; for(let k=0;k<400&&!spot;k++){ const x=Math.round(hz.x+30+Math.random()*(hz.width-60)), y=Math.round(hz.y+40+Math.random()*(hz.height-80)); if(!blocked(x,y)&&!blocked(x+8,y)&&!blocked(x-8,y)) spot={x,y}; }
    await test(A,"goto",spot); ok(await waitFor(()=>Math.hypot(p.x-spot.x,p.y-spot.y)<1),`A tới ${hz.name} (${spot.x},${spot.y})`);
    await test(A,"clear");
    await test(A,"bone",{r:100}); // 4.1: hồn cốt rơi ngẫu nhiên (1% ở 1.234 năm) không xen vào các kiểm tra hồn hoàn, mảnh võ hồn
    const ringsOf=b=>(b.bag?.items??[]).filter(i=>i.code===RING_ITEM), bp=()=>meOf(B);
    /** Đặt hồn thú 1 máu `years` năm (loài `species`, mặc định loài đầu; `boss`: tinh anh BĐ4) ngay chỗ `b` (mặc định A) đứng (hook test),
     *  `b` đánh hạ; trả về hồn hoàn vừa rơi. */
    async function killFor(years,species,boss,b=A){
      const before=new Set(st.drops.keys()), fresh=()=>[...st.drops.keys()].find(k=>!before.has(k));
      await test(b,"beast",{dx:0,dy:0,years,species,boss});
      for(let i=0;i<15&&!fresh();i++){ b.room.send("attack"); await waitFor(fresh,450); }
      const id=fresh(); return id?{id,dr:st.drops.get(id)}:null;
    }
    const k1=await killFor(437);
    ok(k1&&k1.dr.years===437&&k1.dr.tier===tierOfYears(437)&&k1.dr.owner===A.room.sessionId,`hạ hồn thú 437 năm: hồn hoàn rơi ${k1?.dr.years} năm, màu ${TIERS[k1?.dr.tier??0].color}, thuộc A`);
    ok(A.logs.some(t=>/^Hạ .*437 năm.*Hồn hoàn 437 năm/.test(t)),"thông báo hạ hồn thú kèm số năm");
    if(k1){
      await test(B,"goto",{x:k1.dr.x,y:k1.dr.y}); await waitFor(()=>Math.hypot(bp().x-k1.dr.x,bp().y-k1.dr.y)<1);
      const b0=ringsOf(B).length; B.room.send("pickup");
      ok(await lastLog(B,/thuộc về người hạ/)&&st.drops.has(k1.id)&&ringsOf(B).length===b0,`B không nhặt được trong ${DROP_OWNER_SECS} giây đầu: ${B.logs.at(-1)}`);
      // Đồ rơi chồng nhau: hồn hoàn của B rơi đúng chỗ hồn hoàn của A (rơi trước) thì B nhấn E vẫn nhặt được của mình.
      await test(B,"edrop",{seed:7});
      const kb=await killFor(10,undefined,undefined,B); B.room.send("pickup");
      ok(kb&&await waitFor(()=>!st.drops.has(kb.id))&&st.drops.has(k1.id)&&ringsOf(B).some(i=>i.years===10),`đồ rơi chồng nhau: B nhặt hồn hoàn của mình nằm dưới hồn hoàn của A (${B.logs.at(-1)})`);
      ok([...st.drops.values()].some(d=>d.item===SD.EQUIP_ITEM&&d.owner===B.room.sessionId),"hồi quy: trang bị của B còn dưới đất sau khi nhặt hồn hoàn chồng nhau");
      await test(B,"edrop",{off:true});
      for(const i of ringsOf(B).filter(i=>i.years===10)) B.room.send("discard",{id:i.id});
      await waitFor(()=>!ringsOf(B).some(i=>i.years===10));
      const a0=ringsOf(A).length; A.room.send("pickup");
      ok(await waitFor(()=>ringsOf(A).length===a0+1)&&await waitFor(()=>!st.drops.has(k1.id)),"A nhặt hồn hoàn của mình");
      ok(ringsOf(A).some(i=>i.years===437&&i.qty===1&&i.kind==="hon_hoan"),"túi A có hồn hoàn đúng 437 năm (mỗi chiếc một ô)");
      ok(!ringsOf(B).some(i=>i.years===437),"túi B không có hồn hoàn của A");
    }
    // Dọn đồ rơi kèm của ca chồng nhau: pickup ưu tiên trang bị B được nhặt trước hồn hoàn đang khóa của A.
    await test(A,"drops",{s:SD.DROP_TTL_SECS});
    ok(await waitFor(()=>st.drops.size===0),"dọn đồ rơi còn sót trước khi thử hết thời gian ưu tiên");
    // Hết thời gian ưu tiên thì ai cũng nhặt được.
    const k2=await killFor(1234);
    if(k2){
      const l=B.logs.length, b0=bagKey(B);
      B.room.send("pickup");
      ok(await waitFor(()=>B.logs.slice(l).some(t=>t.startsWith(`Hồn hoàn ${formatYears(1234)} thuộc về người hạ`)),800)
        &&st.drops.has(k2.id)&&k2.dr.owner===A.room.sessionId&&k2.dr.ownerTtl>0&&bagKey(B)===b0&&!ringsOf(B).some(i=>i.years===1234),
        `B chưa nhặt được hồn hoàn 1.234 năm: ${B.logs.slice(l).join(" | ")}`);
      await test(A,"drops",{s:DROP_OWNER_SECS});
      B.room.send("pickup"); ok(await waitFor(()=>ringsOf(B).some(i=>i.years===1234))&&await waitFor(()=>!st.drops.has(k2.id)),`hết ${DROP_OWNER_SECS} giây: B nhặt được hồn hoàn 1.234 năm`);
    }
    // Túi đầy: báo, hồn hoàn ở lại dưới đất; bỏ bớt một ô rồi nhặt được.
    const free=BAG_SLOTS-A.bag.items.filter(i=>i.vohon===null).length;
    await test(A,"give",{code:RING_ITEM,qty:free,years:50});
    ok(A.bag.items.length===BAG_SLOTS,`túi A đầy ${A.bag.items.length}/${BAG_SLOTS} ô`);
    const k3=await killFor(88);
    if(k3){
      A.room.send("pickup"); ok(await lastLog(A,/Túi đồ đã đầy/)&&st.drops.has(k3.id),`túi đầy: ${A.logs.at(-1)}`);
      const junk=ringsOf(A).find(i=>i.years===50);
      B.room.send("discard",{id:junk.id}); ok(await lastLog(B,/Không có vật phẩm/)&&A.bag.items.some(i=>i.id===junk.id),"B không bỏ được đồ trong túi A");
      A.room.send("discard",{id:junk.id}); ok(await waitFor(()=>!A.bag.items.some(i=>i.id===junk.id)),"A bỏ một hồn hoàn trong túi");
      A.room.send("pickup"); ok(await waitFor(()=>ringsOf(A).some(i=>i.years===88)),"bỏ bớt rồi nhặt được hồn hoàn 88 năm");
    }
    for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
    ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
    // ---------- 3.3: hấp thụ từ túi theo giới hạn của truyện, tỉ lệ thất bại, thất bại thì mất hồn hoàn; đủ 10 vòng, cấp 100 ----------
    ok(same([1,2,3,4,5,6,7,8,9,10].map(ringLimit),[423,764,1760,5000,12000,20000,50000,100000,100000,100000]),"giới hạn hấp thụ theo vòng = bảng 5.2");
    const ac=(y,s)=>{ const c=absorbChance(y,s); return [c.over,c.fail]; };
    ok(same(ac(423,1),[0,0])&&same(ac(528,1),[25,0.3])&&same(ac(529,1),[26,0.6])&&same(ac(634,1),[50,0.6])&&same(ac(846,1),[100,0.9])&&same(ac(847,1),[101,null])&&same(ac(MAX_YEARS,8),[0,0]),
      "tỉ lệ thất bại theo % vượt: ≤25% 30%, ≤50% 60%, ≤100% 90%, >100% không cho");
    ok(absorbSecs(10)===3&&absorbSecs(1000)===9&&absorbSecs(MAX_YEARS)===15,`thời gian hấp thụ: 10 năm ${absorbSecs(10)} giây, 1.000 năm ${absorbSecs(1000)} giây, 100.000 năm ${absorbSecs(MAX_YEARS)} giây`);
    // Làng (vùng an toàn) để hồn thú không đánh gián đoạn.
    const camp={x:Math.round(spawnObj.x+spawnObj.width/2),y:Math.round(spawnObj.y+spawnObj.height/2)};
    await test(A,"goto",camp); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
    const act=A.owned.active, bench=A.owned.list.find(v=>v.rowId!==act)?.rowId;
    /** Thêm một hồn hoàn `years` năm vào túi A (hook give) và trả về ô đó. */
    const give=async(b,years)=>{ const had=new Set(ringsOf(b).map(i=>i.id)); await test(b,"give",{code:RING_ITEM,qty:1,years}); await waitFor(()=>ringsOf(b).some(i=>!had.has(i.id))); return ringsOf(b).find(i=>!had.has(i.id)); };
    /** Gửi absorb {itemId, vohonId}; trả về tin "absorbing" bắt đầu, hoặc null nếu bị từ chối (dòng log cuối là lý do). */
    async function absorb(b,itemId,vohonId){ b.absorbing=null; const l=b.logs.length; b.room.send("absorb",{itemId,vohonId}); await waitFor(()=>b.absorbing?.on||b.logs.length>l,1500); await sleep(80); return b.absorbing?.on?b.absorbing:null; }
    /** Hook rush: kết thúc hấp thụ ngay (cùng hàm finishAbsorb của server); trả về kết quả ok / fail / cancel. */
    async function rush(b){ b.absorbing=null; await test(b,"rush"); await waitFor(()=>b.absorbing&&!b.absorbing.on,1500); return b.absorbing?.result; }
    const has=(b,it)=>b.bag.items.some(i=>i.id===it.id);
    const r437=ringsOf(A).find(i=>i.years===437)??await give(A,437);
    await test(A,"set",{rowId:act,level:5,xp:0,rings:[]});
    ok(!await absorb(A,r437.id,act)&&/cần đạt cấp 10/.test(A.logs.at(-1)),`chưa tới bình cảnh: ${A.logs.at(-1)}`);
    ok(!await absorb(B,r437.id,act)&&/Hãy chọn một hồn hoàn/.test(B.logs.at(-1)),"B không hấp thụ được hồn hoàn trong túi A");
    const rB=await give(B,60);
    ok(!await absorb(B,rB.id,act)&&/không sở hữu/.test(B.logs.at(-1)),"B không hấp thụ vào võ hồn của A");
    B.room.send("discard",{id:rB.id});
    const dan=A.bag.items.find(i=>i.code!==RING_ITEM);
    if(dan) ok(!await absorb(A,dan.id,act)&&/Hãy chọn một hồn hoàn/.test(A.logs.at(-1)),"không hấp thụ được đan dược");
    await test(A,"set",{rowId:act,level:10,xp:0,rings:[]});
    await test(A,"hurt",{pct:0});
    ok(!await absorb(A,r437.id,act)&&/giao chiến/.test(A.logs.at(-1)),`đang giao chiến: ${A.logs.at(-1)}`);
    await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
    const r847=await give(A,847);
    ok(!await absorb(A,r847.id,act)&&/101%.*không thể hấp thụ/.test(A.logs.at(-1))&&has(A,r847),`vượt >100% bị từ chối, hồn hoàn còn trong túi: ${A.logs.at(-1)}`);
    // Trong giới hạn: luôn thành công kể cả khi cố định số ngẫu nhiên xấu nhất (0); chờ đúng thời gian thật (3 giây cho 10 năm).
    await test(A,"roll",{r:0});
    const r10=await give(A,10), t0=Date.now(), s1=await absorb(A,r10.id,act);
    ok(s1&&s1.fail===0&&s1.slot===1&&s1.secs===absorbSecs(10)&&p.absorb>0,`bắt đầu hấp thụ 10 năm vào vòng 1: ${JSON.stringify(s1)}`);
    A.room.send("discard",{id:r10.id}); ok(await lastLog(A,/Đang hấp thụ/),"không bỏ được hồn hoàn đang hấp thụ");
    ok(await waitFor(()=>A.absorbing&&!A.absorbing.on,(absorbSecs(10)+2)*1000)&&A.absorbing.result==="ok"&&Date.now()-t0>=absorbSecs(10)*1000-300,
      `trong giới hạn (số ngẫu nhiên 0): thành công sau ${((Date.now()-t0)/1000).toFixed(1)} giây`);
    ok(await waitFor(()=>p.rings.length===1&&p.level===11&&!has(A,r10)),`thành công: cấp ${p.level}, ${p.rings.length} hồn hoàn, hồn hoàn rời túi`);
    ok(same(vOf(act)?.rings,[10]),`võ hồn lưu số năm vào vòng: ${JSON.stringify(vOf(act)?.rings)}`);
    // Vượt giới hạn có tỉ lệ: cố định số ngẫu nhiên 0,10 < 30% -> thất bại, mất hồn hoàn, không phạt gì thêm.
    await test(A,"set",{rowId:act,level:20,xp:0,rings:[10]}); await test(A,"roll",{r:10});
    const r900=await give(A,900), hp0=p.hp, s2=await absorb(A,r900.id,act);
    ok(s2&&s2.over===18&&s2.fail===0.3,`hồn hoàn 900 năm vào vòng 2 (giới hạn 764): vượt ${s2?.over}%, ${s2?.fail} thất bại`);
    ok(await rush(A)==="fail"&&await waitFor(()=>!has(A,r900))&&p.rings.length===1&&p.level===20&&p.hp===hp0&&p.xpNeed===0,
      `thất bại: mất hồn hoàn, vẫn ${p.rings.length} hồn hoàn, cấp ${p.level}, sinh lực ${p.hp}/${hp0}, còn ở bình cảnh`);
    ok(/Thất bại.*900 năm vỡ tan/.test(A.logs.at(-1)??""),`thông báo thất bại: ${A.logs.at(-1)}`);
    // Vượt đúng 100% (90% thất bại), số ngẫu nhiên 0,99 -> thành công, lưu đúng số năm.
    await test(A,"roll",{r:99});
    const r1528=await give(A,1528), s3=await absorb(A,r1528.id,act);
    ok(s3&&s3.over===100&&s3.fail===0.9,"hồn hoàn 1.528 năm vào vòng 2: vượt 100%, 90% thất bại");
    ok(await rush(A)==="ok"&&await waitFor(()=>p.rings.length===2&&p.level===21)&&same(vOf(act)?.rings,[10,1528]),`vượt giới hạn nhưng thành công: ${JSON.stringify(vOf(act)?.rings)}, cấp ${p.level}`);
    // Di chuyển hoặc bị đánh thì hủy, không mất gì.
    await test(A,"set",{rowId:act,level:30,xp:0,rings:[10,1528]});
    const r1700=await give(A,1700);
    ok(await absorb(A,r1700.id,act),"bắt đầu hấp thụ 1.700 năm vào vòng 3");
    // Giữ phím tới khi server báo hủy: server bận thì một tick có thể nhận cả lệnh đi lẫn lệnh dừng, hồn sư không bước nào.
    A.absorbing=null; A.room.send("input",{x:1,y:0}); await waitFor(()=>A.absorbing?.result,2000); A.room.send("input",{x:0,y:0});
    // Tin absorbing / log tới trước bản vá state (p.absorb): chờ cả điều kiện.
    ok(await waitFor(()=>A.absorbing?.result==="cancel"&&/hủy hấp thụ/.test(A.logs.at(-1))&&p.absorb===0&&p.rings.length===2&&has(A,r1700)),
      "di chuyển: hủy, hồn hoàn vẫn trong túi"+(A.absorbing?.result==="cancel"&&p.absorb===0?"":` [absorbing ${JSON.stringify(A.absorbing)}, absorb ${p.absorb}, log ${A.logs.at(-1)}]`));
    await test(A,"goto",camp);
    ok(await absorb(A,r1700.id,act),"hấp thụ lại");
    A.absorbing=null; await test(A,"hurt",{pct:1});
    ok(await waitFor(()=>A.absorbing?.result==="cancel")&&p.rings.length===2&&has(A,r1700),"bị đánh: hủy, hồn hoàn vẫn trong túi");
    await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
    // Chọn võ hồn khác (không ra trận) đang ở bình cảnh.
    if(bench){
      await test(A,"set",{rowId:bench,level:10,xp:0,rings:[]});
      const r300=await give(A,300), s4=await absorb(A,r300.id,bench);
      ok(s4&&s4.rowId===bench&&s4.fail===0,`hấp thụ vào ${VOHON[vohonIndex(vOf(bench).vohon)].name} (không ra trận)`);
      ok(await rush(A)==="ok"&&await waitFor(()=>same(vOf(bench)?.rings,[300])&&vOf(bench).level===11)&&p.rings.length===2&&!has(A,r300),
        `võ hồn không ra trận: ${JSON.stringify(vOf(bench)?.rings)}, cấp ${vOf(bench)?.level}; võ hồn ra trận không đổi`);
    }
    // Lên đủ 10 vòng, cấp 100 (hook set đặt 9 vòng ở cấp 100 = bình cảnh cuối).
    await test(A,"roll",{r:-1});
    const nine=[400,700,1700,5000,12000,20000,50000,100000,100000];
    await test(A,"set",{rowId:act,level:MAX_LEVEL,xp:0,rings:nine});
    ok(p.level===MAX_LEVEL&&p.rings.length===9&&p.xpNeed===0,`cấp ${p.level}, 9 hồn hoàn: bình cảnh cuối`);
    const rRed=await give(A,MAX_YEARS), s5=await absorb(A,rRed.id,act);
    ok(s5&&s5.slot===10&&s5.fail===0&&s5.secs===15,`hồn hoàn 100.000 năm vào vòng 10: ${JSON.stringify(s5)}`);
    ok(await rush(A)==="ok"&&await waitFor(()=>p.rings.length===MAX_RINGS)&&p.level===MAX_LEVEL&&p.xpNeed===0&&p.rings[9]===4,`đủ ${p.rings.length} hồn hoàn, cấp ${p.level} (tối đa)`);
    ok(p.maxHp===calcStats(p.vh,MAX_LEVEL,[...p.rings],1,{},{},A.res?.bonus).maxHp,`vòng 5–10 tăng chỉ số: sinh lực tối đa ${p.maxHp}`);
    await test(A,"kill",{tier:4}); await sleep(100);
    ok(p.level===MAX_LEVEL&&p.xp===0,"cấp tối đa: không nhận thêm kinh nghiệm");
    const r50=await give(A,50);
    ok(!await absorb(A,r50.id,act)&&/đủ 10 hồn hoàn/.test(A.logs.at(-1)),`không hấp thụ vòng 11: ${A.logs.at(-1)}`);
    ok(same(vOf(act)?.rings,[...nine,MAX_YEARS]),"võ hồn lưu đủ 10 vòng");
    for(const i of ringsOf(A).filter(i=>[437,847,1700,50].includes(i.years))) A.room.send("discard",{id:i.id});
    await waitFor(()=>!ringsOf(A).some(i=>[437,847,1700,50].includes(i.years)),3000);
    // ---------- 3.4: mảnh võ hồn rơi theo bản đồ, mở võ hồn bằng 50 mảnh, lên sao 20/40/80/120/200 ----------
    ok(same([1,2,3,4,5,6].map(starCost),[...STAR_COST,null])&&same(STAR_COST,[20,40,80,120,200])&&MAX_STARS===6&&SHARD_UNLOCK===50,"giá lên sao 20/40/80/120/200, mở võ hồn 50 mảnh");
    ok(shardChance(437)===0.1&&shardChance(1000)===0.15&&shardChance(25000)===0.2&&shardChance(MAX_YEARS)===1,"tỉ lệ rơi mảnh theo niên hạn: 10% / 15% / 20% / 100%");
    ok(Object.values(MAPS).every(m=>m.kind!=="hunt"||(m.shards.length>=2&&m.shards.length<=4))&&Object.values(MAPS).every(m=>m.shards.every(id=>vohonIndex(id)>=0&&itemDef(shardCode(id))?.kind==="manh_vo_hon")),
      "mỗi bản đồ săn rơi mảnh của 2–4 võ hồn có thật (từ 8.3)");
    ok(calcStats(0,30,[1,1],6).maxHp>calcStats(0,30,[1,1],1).maxHp&&starMult(1)===1&&starMult(MAX_STARS)>starMult(2),"mỗi sao tăng chỉ số gốc");
    const list=MAPS[st.mapId].shards, gift=list.indexOf("lam_ngan_thao"), ui=list.findIndex(id=>!A.owned.list.some(v=>v.vohon===id));
    const nv=list[ui], nvName=VOHON[vohonIndex(nv)].name, nvCode=shardCode(nv), giftCode=shardCode("lam_ngan_thao");
    ok(gift>=0&&ui>=0,`Thánh Hồn Thôn rơi mảnh Lam Ngân Thảo và ${nvName} (A chưa có)`);
    await test(A,"goto",spot); await test(A,"clear");
    // Các phần trên hạ hồn thú với tỉ lệ rơi mảnh thật (10%): bỏ mảnh của hai võ hồn sắp thử để bắt đầu từ 0, B ghi số mảnh đang có.
    for(const i of A.bag.items.filter(i=>i.code===nvCode||i.code===giftCode)) A.room.send("discard",{id:i.id});
    ok(await waitFor(()=>qtyOf(A,nvCode)===0&&qtyOf(A,giftCode)===0,3000),"bắt đầu từ 0 mảnh");
    const bNv=qtyOf(B,nvCode), bGift=qtyOf(B,giftCode), log0=A.logs.length;
    /** Gửi unlock / starup rồi chờ dòng log trả lời (thành công thì kèm tin vohons và bag). */
    async function shardOp(b,type,vohon){ const l=b.logs.length; b.room.send(type,{vohon}); await waitFor(()=>b.logs.length>l,2000); await sleep(150); return b.logs.at(-1)??""; }
    const vohonOf=(b,id)=>b.owned.list.find(v=>v.vohon===id);
    // Số ngẫu nhiên 0,99 ≥ 10%: hạ hồn thú 437 năm không rơi mảnh; 0,05 < 10%: rơi đúng một mảnh của võ hồn được chọn, vào thẳng túi.
    await test(A,"shard",{r:99});
    const n0=qtyOf(A,nvCode); await killFor(437); await sleep(150);
    ok(qtyOf(A,nvCode)===n0&&!A.logs.slice(log0).some(t=>/^Nhận \d+ Mảnh/.test(t)),"số ngẫu nhiên 0,99: không rơi mảnh");
    await test(A,"shard",{r:5,i:ui});
    await killFor(437);
    ok(await waitFor(()=>qtyOf(A,nvCode)===n0+1)&&A.bag.items.some(i=>i.code===nvCode&&i.kind==="manh_vo_hon"),`số ngẫu nhiên 0,05: rơi 1 Mảnh ${nvName} vào túi`);
    ok(A.logs.some(t=>t===`Nhận 1 Mảnh ${nvName} (${n0+1}/${SHARD_UNLOCK}).`),`thông báo nhận mảnh kèm tiến độ: ${A.logs.filter(t=>/^Nhận/.test(t)).at(-1)}`);
    ok(qtyOf(B,nvCode)===bNv,"mảnh vào túi người hạ, không vào túi người khác");
    // Hai hồn hoàn 437 năm vừa rơi còn nằm ở chỗ A đứng: cho hết hạn (hook drops) để phần dưới chỉ còn hồn hoàn và mảnh của lần hạ sau.
    await test(A,"drops",{s:3600}); await waitFor(()=>!st.drops.size);
    // Túi đầy: mảnh rơi xuống đất cạnh hồn hoàn, cùng luật ưu tiên người hạ; bỏ bớt rồi nhặt được.
    {
      const freeA=BAG_SLOTS-A.bag.items.filter(i=>i.vohon===null).length;
      await test(A,"give",{code:RING_ITEM,qty:freeA,years:50});
      await test(A,"shard",{r:5,i:gift});
      // Hồn hoàn của các lần hạ trước nằm đúng chỗ này: cho hết hạn, nếu không khi mảnh rơi chồng lên (ô cạnh bên không đứng được)
      // thì B nhấn nhặt sẽ trúng hồn hoàn cũ thay cho mảnh.
      await test(A,"drops",{s:3600}); await waitFor(()=>!st.drops.size,1000);
      const before=new Set(st.drops.keys()); await killFor(88);
      const sid=[...st.drops.keys()].find(k=>!before.has(k)&&st.drops.get(k).item===giftCode), sd=sid&&st.drops.get(sid);
      ok(sd&&sd.qty===1&&sd.owner===A.room.sessionId&&qtyOf(A,giftCode)===0&&/Túi đồ đã đầy.*Mảnh Lam Ngân Thảo rơi xuống đất/.test(A.logs.find(t=>/Mảnh Lam Ngân Thảo rơi/.test(t))??""),
        `túi đầy: Mảnh Lam Ngân Thảo rơi xuống đất, thuộc A`);
      if(sd){
        await test(B,"goto",{x:sd.x,y:sd.y}); await waitFor(()=>Math.hypot(bp().x-sd.x,bp().y-sd.y)<1);
        await test(A,"goto",{x:sd.x,y:sd.y}); await waitFor(()=>Math.hypot(p.x-sd.x,p.y-sd.y)<1);
        B.room.send("pickup"); ok(await lastLog(B,/Mảnh Lam Ngân Thảo thuộc về người hạ/)&&st.drops.has(sid)&&qtyOf(B,giftCode)===bGift,`B không nhặt được mảnh của A: ${B.logs.at(-1)}`);
        // Mảnh có thể nằm chồng lên hồn hoàn (chỗ cạnh bên không đứng được): nhặt hồn hoàn trước thì nhấn E thêm lần nữa.
        const l0=A.logs.length; A.room.send("pickup");
        ok(await waitFor(()=>A.logs.length>l0)&&A.logs.slice(l0).some(t=>t.startsWith(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt`))&&st.drops.has(sid),`A túi đầy: ${A.logs.at(-1)}`);
        for(let k=0;k<3&&qtyOf(A,giftCode)===0;k++){
          const junk=ringsOf(A).find(i=>i.years===50); A.room.send("discard",{id:junk.id}); await waitFor(()=>!A.bag.items.some(i=>i.id===junk.id));
          A.room.send("pickup"); await waitFor(()=>qtyOf(A,giftCode)===1,1000);
        }
        ok(qtyOf(A,giftCode)===1&&await waitFor(()=>!st.drops.has(sid)),"bỏ bớt rồi A nhặt được Mảnh Lam Ngân Thảo");
      }
      for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
      ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
    }
    await test(A,"shard",{r:-1});
    await test(A,"goto",camp);
    // Mở võ hồn: thiếu mảnh bị từ chối; đủ 50 thì mở (cấp 1, 1 sao), mảnh bị trừ; mở lần hai bị từ chối.
    ok(/Cần 50 Mảnh .* mới có 1/.test(await shardOp(A,"unlock",nv))&&!vohonOf(A,nv),`thiếu mảnh: ${A.logs.at(-1)}`);
    await test(A,"give",{code:nvCode,qty:SHARD_UNLOCK-2});
    ok(/mới có 49/.test(await shardOp(A,"unlock",nv))&&qtyOf(A,nvCode)===49,"49 mảnh: vẫn bị từ chối, không mất mảnh");
    ok(/không tồn tại/.test(await shardOp(A,"unlock","khong_co")),"võ hồn không tồn tại bị từ chối");
    ok(/Đã sở hữu/.test(await shardOp(A,"unlock","lam_ngan_thao")),"võ hồn đã sở hữu thì không mở lại");
    await test(A,"give",{code:nvCode,qty:3});
    if(bNv<SHARD_UNLOCK) ok(/Cần 50 Mảnh/.test(await shardOp(B,"unlock",nv))&&!vohonOf(B,nv),"B không dùng được mảnh trong túi A");
    const cnt=A.owned.list.length;
    ok(/^Mở võ hồn /.test(await shardOp(A,"unlock",nv))&&await waitFor(()=>vohonOf(A,nv))&&A.owned.list.length===cnt+1,`đủ 50 mảnh: mở ${nvName}`);
    const nvRow=vohonOf(A,nv);
    ok(nvRow?.level===1&&nvRow.stars===1&&!A.owned.team.includes(nvRow.rowId)&&await waitFor(()=>qtyOf(A,nvCode)===2),`${nvName} cấp ${nvRow?.level}, ${nvRow?.stars} sao; trừ đúng 50 mảnh (còn ${qtyOf(A,nvCode)})`);
    ok(/Đã sở hữu/.test(await shardOp(A,"unlock",nv))&&A.owned.list.length===cnt+1,"mở lần hai bị từ chối");
    // Lên sao: thiếu mảnh bị từ chối; đủ thì lên, trừ đúng giá; tới 6★ thì dừng.
    ok(/Cần 20 Mảnh .* lên 2★, mới có 2/.test(await shardOp(A,"starup",nv)),`lên sao thiếu mảnh: ${A.logs.at(-1)}`);
    ok(/Chưa sở hữu/.test(await shardOp(B,"starup",nv)),"B chưa sở hữu thì không lên sao được");
    await test(A,"give",{code:nvCode,qty:18});
    ok(/lên 2★/.test(await shardOp(A,"starup",nv))&&vohonOf(A,nv).stars===2&&await waitFor(()=>qtyOf(A,nvCode)===0),"20 mảnh: lên 2★, hết mảnh");
    await test(A,"give",{code:nvCode,qty:STAR_COST.slice(1).reduce((a,b)=>a+b,0)+5});
    for(let s=3;s<=MAX_STARS;s++) await shardOp(A,"starup",nv);
    ok(vohonOf(A,nv).stars===MAX_STARS&&await waitFor(()=>qtyOf(A,nvCode)===5),`lên tới ${vohonOf(A,nv).stars}★, còn ${qtyOf(A,nvCode)} mảnh dư`);
    ok(/đã đạt 6★/.test(await shardOp(A,"starup",nv))&&vohonOf(A,nv).stars===MAX_STARS&&qtyOf(A,nvCode)===5,"6★: không lên thêm, không mất mảnh");
    // Lên sao võ hồn đang ra trận: chỉ số gốc tăng ngay.
    const actId=vOf(act).vohon, actStars=vOf(act).stars, cost=starCost(actStars), hp0s=p.maxHp;
    if(cost){
      await test(A,"give",{code:shardCode(actId),qty:cost});
      await shardOp(A,"starup",actId);
      ok(vOf(act).stars===actStars+1&&await waitFor(()=>p.maxHp===calcStats(p.vh,p.level,[...p.rings],actStars+1,{},{},A.res?.bonus).maxHp)&&p.maxHp>hp0s,
        `võ hồn ra trận lên ${actStars+1}★: sinh lực tối đa ${hp0s} -> ${p.maxHp}`);
    }
    for(const i of A.bag.items.filter(i=>i.code===nvCode)) A.room.send("discard",{id:i.id});
    await waitFor(()=>qtyOf(A,nvCode)===0,3000);
    // ---------- 4.1: hồn cốt rơi theo bảng 5.3 (0% / 1% / 4% / 20%), mang loài và số năm của hồn thú, vị trí ngẫu nhiên; nằm trong túi ----------
    ok(boneChance(999)===0&&boneChance(1000)===0.01&&boneChance(9999)===0.01&&boneChance(10000)===0.04&&boneChance(MAX_YEARS-1)===0.04&&boneChance(MAX_YEARS)===0.2,
      "tỉ lệ rơi hồn cốt theo niên hạn: 0% / 1% / 4% / 20%");
    ok(same(BONE_SLOTS.map(s=>s.name),["Đầu","Thân","Tay trái","Tay phải","Chân trái","Chân phải"])&&itemDef(BONE_ITEM)?.kind==="hon_cot"&&itemDef(BONE_ITEM).stack===1,
      "6 vị trí hồn cốt; hồn cốt không gộp (mỗi món một ô)");
    ok(BONE_SLOTS.every(s=>{ const a=boneStats(s.id,1000)[s.stat], b=boneStats(s.id,32000)[s.stat], c=boneStats(s.id,MAX_YEARS)[s.stat]; return a>0&&a<b&&b<c; }),
      `chỉ số gốc tăng theo số năm (Tay phải: ${[1000,32000,MAX_YEARS].map(y=>boneStats("tay_phai",y).atk).join(" / ")} công)`);
    const AK="am_kim_khung_trao_hung", akName=boneName(AK,"tay_phai",32000), slotOf=id=>BONE_SLOTS.findIndex(s=>s.id===id);
    ok(akName==="Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm",`tên hồn cốt: ${akName}`);
    await test(A,"goto",spot); await test(A,"clear");
    /** Hạ hồn thú `years` năm loài `species`; trả về hồn cốt vừa rơi (cùng lúc với hồn hoàn), hoặc undefined. */
    async function killBone(years,species,boss){
      const before=new Set(st.drops.keys()); await killFor(years,species,boss); await sleep(150);
      const e=[...st.drops.entries()].find(([k,d])=>!before.has(k)&&d.item===BONE_ITEM); return e&&{id:e[0],dr:e[1]};
    }
    /** A đứng lên hồn cốt rồi nhấn E (hồn cốt có thể chồng lên hồn hoàn: nhấn thêm); true khi hồn cốt đã rời mặt đất. */
    async function pickBone(kb){
      await test(A,"goto",{x:kb.dr.x,y:kb.dr.y}); await waitFor(()=>Math.hypot(p.x-kb.dr.x,p.y-kb.dr.y)<1);
      for(let k=0;k<3&&st.drops.has(kb.id);k++){ const l=A.logs.length; A.room.send("pickup"); await waitFor(()=>A.logs.length>l,1500); await waitFor(()=>!st.drops.has(kb.id),300); }
      return !st.drops.has(kb.id);
    }
    await test(A,"bone",{r:99});
    ok(!await killBone(32000,AK),"số ngẫu nhiên 0,99: hạ hồn thú 32.000 năm không rơi hồn cốt");
    await test(A,"bone",{r:0});
    ok(!await killBone(999),"hồn thú dưới 1.000 năm không bao giờ rơi hồn cốt (0%)");
    await test(A,"bone",{r:0,s:slotOf("tay_phai")});
    const nb0=bonesOf(A).length, kb=await killBone(32000,AK);
    ok(kb&&kb.dr.years===32000&&kb.dr.tier===tierOfYears(32000)&&kb.dr.species===beastIndex(AK)&&kb.dr.slot===slotOf("tay_phai")&&kb.dr.owner===A.room.sessionId,
      `hạ ${BEASTS[beastIndex(AK)].name} 32.000 năm (số ngẫu nhiên 0): hồn cốt rơi xuống đất, thuộc A`);
    ok(A.logs.some(t=>t.startsWith(`Hồn cốt ${akName} rơi xuống đất`)),"thông báo hồn cốt rơi kèm loài, vị trí, số năm");
    if(kb){
      await test(B,"goto",{x:kb.dr.x,y:kb.dr.y}); await waitFor(()=>Math.hypot(bp().x-kb.dr.x,bp().y-kb.dr.y)<1);
      const bb=bonesOf(B).length; B.room.send("pickup");
      ok(await lastLog(B,/Hồn cốt thuộc về người hạ/)&&st.drops.has(kb.id)&&bonesOf(B).length===bb,`B không nhặt được hồn cốt của A: ${B.logs.at(-1)}`);
      ok(await pickBone(kb)&&await waitFor(()=>bonesOf(A).length===nb0+1),"A nhặt hồn cốt vào túi");
      const it=bonesOf(A).at(-1);
      ok(it&&it.kind==="hon_cot"&&it.qty===1&&it.years===32000&&it.stats?.beast===AK&&it.stats?.slot==="tay_phai"&&it.enhance===0&&it.vohon===null,
        `túi A: hồn cốt ${it&&boneName(it.stats?.beast,it.stats?.slot,it.years)}, cường hóa +${it?.enhance}, chưa gắn`);
      ok(A.logs.some(t=>t.startsWith(`Nhặt hồn cốt ${akName} vào túi đồ`)),"thông báo nhặt hồn cốt");
      await useItem(A,it.id); ok(/không dùng trực tiếp/.test(A.logs.at(-1)??"")&&bonesOf(A).some(i=>i.id===it.id),"hồn cốt không dùng như đan được");
      const l=A.logs.length; A.room.send("absorb",{itemId:it.id}); await waitFor(()=>A.logs.length>l);
      ok(/Hãy chọn một hồn hoàn/.test(A.logs.at(-1)??"")&&bonesOf(A).some(i=>i.id===it.id),"hồn cốt không hấp thụ như hồn hoàn được");
    }
    // Vị trí ngẫu nhiên: hồn cốt 1.500 năm (1%, số ngẫu nhiên 0) có vị trí hợp lệ; mỗi món một ô.
    await test(A,"bone",{r:0});
    const kr=await killBone(1500);
    ok(kr&&kr.dr.years===1500&&kr.dr.slot<BONE_SLOTS.length&&await pickBone(kr)&&await waitFor(()=>bonesOf(A).length===nb0+2),
      `vị trí ngẫu nhiên: ${kr?BONE_SLOTS[kr.dr.slot]?.name:"?"}; hai hồn cốt nằm hai ô`);
    // Túi đầy: báo, hồn cốt ở lại dưới đất; bỏ bớt một ô rồi nhặt được.
    {
      const freeA=BAG_SLOTS-A.bag.items.filter(i=>i.vohon===null).length;
      await test(A,"give",{code:RING_ITEM,qty:freeA,years:50});
      // Chỗ mới, chưa có đồ rơi: nhấn E nhặt vật gần nhất, hồn hoàn của lần hạ trước nằm cùng chỗ thì sẽ bị nhặt nhầm.
      const clean=[[40,0],[-40,0],[0,40],[0,-40],[40,40],[-40,-40]].map(([dx,dy])=>({x:spot.x+dx,y:spot.y+dy}))
        .find(q=>!blocked(q.x,q.y)&&!blocked(q.x-8,q.y)&&![...st.drops.values()].some(d=>Math.hypot(d.x-q.x+8,d.y-q.y)<PICKUP_RANGE+8))??spot;
      await test(A,"goto",clean); await test(A,"bone",{r:0,s:slotOf("dau")});
      const kf=await killBone(12000,"quy_ho");
      ok(kf&&kf.dr.slot===slotOf("dau"),"hồn cốt Đầu 12.000 năm rơi khi túi A đầy");
      if(kf){
        await pickBone(kf);
        ok(st.drops.has(kf.id)&&A.logs.some(t=>t.startsWith(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt vật phẩm rồi mới nhặt được hồn cốt Quỷ Hổ – Đầu, 12.000 năm`)),
          `túi đầy: báo, hồn cốt ở lại dưới đất [${A.logs.slice(-3).join(" | ")}; còn dưới đất ${st.drops.has(kf.id)}, túi ${A.bag.items.length} ô]`);
        const junk=ringsOf(A).find(i=>i.years===50); A.room.send("discard",{id:junk.id}); await waitFor(()=>!A.bag.items.some(i=>i.id===junk.id));
        ok(await pickBone(kf)&&bonesOf(A).some(i=>i.years===12000&&i.stats?.slot==="dau"&&i.stats?.beast==="quy_ho"),"bỏ bớt rồi nhặt được hồn cốt Quỷ Hổ – Đầu");
      }
      for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
      ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
    }
    // BĐ4: tinh anh rơi hồn cốt với tỉ lệ x ELITE.bone (mục 5.4), hồn cốt mang loài gốc, quyền ưu tiên như hồn hoàn.
    {
      const near=(a,b)=>Math.abs(a-b)<1e-9, x3=ELITE.bone;
      ok(near(boneChance(999,x3),0)&&near(boneChance(1000,x3),0.01*x3)&&near(boneChance(10000,x3),0.04*x3)&&near(boneChance(MAX_YEARS,x3),0.2*x3)&&boneChance(MAX_YEARS,10)===1,
        `tỉ lệ hồn cốt của tinh anh x${x3}: ${[999,1000,10000,MAX_YEARS].map(y=>`${+(boneChance(y,x3)*100).toFixed(2)}%`).join(" / ")} (tối đa 100%)`);
      const HN="huyet_nhan_phong_lang", hb=BOSSES[bossIndex(HN)], base=beastIndex(hb.species);
      await test(A,"goto",spot); await test(A,"clear");
      // Số ngẫu nhiên 0,02: hồn thú thường 1.500 năm (1%) không rơi, tinh anh 1.500 năm (3%) rơi.
      await test(A,"bone",{r:2,s:slotOf("than")});
      ok(!await killBone(1500,hb.species),`số ngẫu nhiên 0,02: hạ ${BEASTS[base].name} thường 1.500 năm (${boneChance(1500)*100}%) không rơi hồn cốt`);
      A.elite=[]; const ke=await killBone(1500,undefined,HN);
      ok(ke&&ke.dr.years===1500&&ke.dr.species===base&&ke.dr.slot===slotOf("than")&&ke.dr.owner===A.room.sessionId&&await waitFor(()=>A.elite.some(m=>m.k==="down"),1000),
        `cùng số ngẫu nhiên: hạ ${beastName(1,bossIndex(HN))} 1.500 năm (${+(boneChance(1500,x3)*100).toFixed(2)}%) rơi hồn cốt ${ke?boneName(BEASTS[ke.dr.species]?.id,BONE_SLOTS[ke.dr.slot]?.id,ke.dr.years):"?"} (loài gốc), thuộc A`);
      await test(A,"bone",{r:4}); await test(A,"elock",{s:0}); // #119: bỏ khóa thưởng tinh anh để thử đúng tỉ lệ x ELITE.bone
      ok(!await killBone(1500,undefined,HN),`số ngẫu nhiên 0,04 (trên ${+(boneChance(1500,x3)*100).toFixed(2)}%): tinh anh không rơi hồn cốt`);
    }
    // ---------- 5.1: hồn hạch rơi theo bảng 5.3 (15% 1–2★ / 25% 2–4★ / 40% 3–5★ / 100% 5–6★), bộ theo bản đồ, chỉ số chính và phụ; nằm trong túi ----------
    {
      const coresOf=b=>(b.bag?.items??[]).filter(i=>i.code===CORE_ITEM), mapSets=MAPS[st.mapId].cores;
      ok(same([10,999,1000,9999,10000,MAX_YEARS-1,MAX_YEARS].map(coreChance),[0.15,0.15,0.25,0.25,0.4,0.4,1])
        &&same([10,999,1000,9999,10000,MAX_YEARS-1,MAX_YEARS].map(coreStarBand),[[1,2],[1,2],[2,4],[2,4],[3,5],[3,5],[5,6]]),
        "bảng rơi hồn hạch theo niên hạn: 15% 1–2★ / 25% 2–4★ / 40% 3–5★ / 100% 5–6★");
      ok(itemDef(CORE_ITEM)?.kind==="hon_hach"&&itemDef(CORE_ITEM).stack===1&&CORE_SETS.length===9&&same(CORE_SUBS,[0,1,1,2,3,4])&&CORE_SUBS[MAX_CORE_STARS-1]===4,
        "9 bộ hồn hạch; mỗi món một ô; dòng phụ theo sao 0 / 1 / 1 / 2 / 3 / 4 (1★ 0 dòng … 6★ 4 dòng)");
      ok(same(mapSets,["lam_ngan","tien_co"])&&same(MAPS.tinh_dau_ngoai_vi.cores,["linh_mieu","hao_thien","xa_hoang"])&&same(MAPS.tinh_dau_noi_dia.cores,["ba_vuong_long","that_sat","luu_ly"]),
        `bộ đặc trưng theo bản đồ (bảng 5.3): ${MAPS[st.mapId].name} ${mapSets.map(s=>CORE_SETS[coreSetIndex(s)].name).join(", ")}`);
      ok(CORE_STAT_IDS.every(k=>CORE_STAR_K.every((_,i)=>i===0||coreMainValue(k,i+1)>=coreMainValue(k,i)))&&coreMainValue("hp",6)>coreMainValue("hp",1),
        `chỉ số chính tăng theo sao (Sinh lực 1★…6★: ${[1,2,3,4,5,6].map(s=>coreMainValue("hp",s)).join(" / ")})`);
      ok(coreName("hao_thien",4)==="Hồn hạch Hạo Thiên 4★"&&coreStatText("atk_pct",12)==="Công +12%"&&coreStatText("crit",2.4)==="Tỉ lệ chí mạng +2,4%"&&coreStatText("hp",300)==="Sinh lực +300",
        `tên và dòng chỉ số: ${coreName("hao_thien",4)}, ${coreStatText("crit",2.4)}`);
      // Tung nhiều lần (hàm thuần, ngẫu nhiên của bot): sao luôn trong khoảng, đủ mọi sao của khoảng, dòng phụ đúng số, khác nhau, khác chỉ số chính, giá trị trong khoảng.
      const N=5000, YS=[10,437,1500,12000,MAX_YEARS]; let bad=[], own=0; const seen=new Set(), mains=new Set();
      for(let i=0;i<N;i++){
        const y=YS[i%YS.length], [lo,hi]=coreStarBand(y), c=rollCore(y,mapSets,Math.random), ks=c.data.subs.map(s=>s[0]);
        const tol=k=>CORE_STATS[k].pct?0.051:0.51, vOk=c.data.subs.every(([k,v])=>v>=Math.max(CORE_STATS[k].pct?0.1:1,coreSubMax(k,c.stars)*CORE_SUB_ROLL[0]-tol(k))&&v<=coreSubMax(k,c.stars)*CORE_SUB_ROLL[1]+tol(k));
        if(c.stars<lo||c.stars>hi||ks.length!==CORE_SUBS[c.stars-1]||new Set(ks).size!==ks.length||ks.includes(c.data.main)||coreSetIndex(c.data.set)<0||!vOk) bad.push(JSON.stringify([y,c]));
        seen.add(`${y}:${c.stars}`); mains.add(c.data.main); if(mapSets.includes(c.data.set)) own++;
      }
      const allStars=YS.every(y=>{ const [lo,hi]=coreStarBand(y); for(let s=lo;s<=hi;s++) if(!seen.has(`${y}:${s}`)) return false; return true; });
      ok(!bad.length&&allStars&&mains.size===CORE_STAT_IDS.length,`tung ${N} hồn hạch: sao đúng khoảng theo niên hạn, đủ mọi sao, số dòng phụ đúng theo sao, không trùng${bad.length?` (sai: ${bad[0]})`:""}`);
      const share=own/N, want=CORE_MAP_SET+(1-CORE_MAP_SET)*mapSets.length/CORE_SETS.length;
      ok(Math.abs(share-want)<0.04,`bộ đặc trưng của bản đồ chiếm ${(share*100).toFixed(1)}% (kỳ vọng ${(want*100).toFixed(1)}%)`);
      ok(rollCore(1500,mapSets,Math.random,{high:true}).stars===4&&rollCore(MAX_YEARS,[],Math.random,{high:true}).stars===6,"tùy chọn sao cao (rương thú vương BĐ5): sao cao nhất của khoảng");

      await test(A,"goto",spot); await test(A,"clear"); await test(A,"drops",{s:3600}); await sleep(150); // dọn đồ rơi cũ: E chỉ nhặt đồ mới
      /** Hạ hồn thú `years` năm (loài `species`, tinh anh `boss`); trả về hồn hạch vừa rơi xuống đất, hoặc undefined. */
      async function killCore(years,species,boss){
        const before=new Set(st.drops.keys()); await killFor(years,species,boss); await sleep(150);
        const e=[...st.drops.entries()].find(([k,d])=>!before.has(k)&&d.item===CORE_ITEM); return e&&{id:e[0],dr:e[1]};
      }
      /** `b` đứng lên hồn hạch rồi nhặt đúng hồn hạch đó theo ID (hook `pickup {did}`, #1490); true khi hồn hạch đã rời mặt đất.
       * Tin `pickup` thật không có ID và chọn món gần nhất: hồn hạch chồng đúng vị trí hồn hoàn (không ô lệch nào đứng được) thì hòa khoảng cách,
       * server lấy món đầu tiên là hồn hoàn, nên không dùng tin thật ở đây. */
      async function pickCore(kc,b=A){
        const q=meOf(b); await test(b,"goto",{x:kc.dr.x,y:kc.dr.y}); await waitFor(()=>Math.hypot(q.x-kc.dr.x,q.y-kc.dr.y)<1);
        if(st.drops.has(kc.id)){ const l=b.logs.length; await test(b,"pickup",{did:kc.id}); await waitFor(()=>b.logs.length>l,1500); await waitFor(()=>!st.drops.has(kc.id),300); }
        return !st.drops.has(kc.id);
      }
      const checkIt=(it,stars)=>it&&it.kind==="hon_hach"&&it.qty===1&&it.stars===stars&&it.years===null&&it.enhance===0&&it.vohon===null
        &&coreSetIndex(it.stats?.set)>=0&&CORE_STAT_IDS.includes(it.stats?.main)&&it.stats?.subs?.length===CORE_SUBS[stars-1];
      await test(A,"core",{r:99});
      ok(!await killCore(437),"số ngẫu nhiên 0,99: hạ hồn thú 437 năm (15%) không rơi hồn hạch");
      await test(A,"core",{r:14,stars:6}); // sao 6 nằm ngoài khoảng 1–2★ của 437 năm: bỏ qua, tung trong khoảng
      const kc=await killCore(437), c0=coresOf(A).length;
      ok(kc&&kc.dr.years===437&&kc.dr.stars>=1&&kc.dr.stars<=2&&kc.dr.cset<CORE_SETS.length&&kc.dr.owner===A.room.sessionId,
        `số ngẫu nhiên 0,14: hạ hồn thú 437 năm rơi ${kc?coreName(CORE_SETS[kc.dr.cset].id,kc.dr.stars):"?"} xuống đất (1–2★, sao cố định ngoài khoảng bị bỏ qua), thuộc A`);
      ok(kc&&A.logs.some(t=>t.startsWith(`${coreName(CORE_SETS[kc.dr.cset].id,kc.dr.stars)} rơi xuống đất`)),"thông báo hồn hạch rơi kèm bộ và sao");
      if(kc){
        await test(B,"goto",{x:kc.dr.x,y:kc.dr.y}); await waitFor(()=>Math.hypot(bp().x-kc.dr.x,bp().y-kc.dr.y)<1);
        const bb=coresOf(B).length, bl=B.logs.length; await test(B,"pickup",{did:kc.id}); await waitFor(()=>B.logs.length>bl,1500);
        ok(/^Hồn hạch .* thuộc về người hạ/.test(B.logs.at(-1)??"")&&st.drops.has(kc.id)&&coresOf(B).length===bb,`B không nhặt được hồn hạch của A trong ${DROP_OWNER_SECS} giây đầu: ${B.logs.at(-1)}`);
        ok(await pickCore(kc)&&await waitFor(()=>coresOf(A).length===c0+1),"A nhặt hồn hạch vào túi");
        const it=coresOf(A).at(-1);
        ok(checkIt(it,kc.dr.stars)&&it.stats.set===CORE_SETS[kc.dr.cset].id,
          `túi A: ${it&&coreName(it.stats?.set,it.stars)}, chính ${it&&coreStatText(it.stats.main,coreMainValue(it.stats.main,it.stars))}, ${it?.stats?.subs?.length} dòng phụ, +${it?.enhance}, chưa gắn`);
        ok(A.logs.some(t=>t.startsWith(`Nhặt ${coreName(CORE_SETS[kc.dr.cset].id,kc.dr.stars)} vào túi đồ`)),"thông báo nhặt hồn hạch");
        await useItem(A,it.id); ok(/không dùng trực tiếp/.test(A.logs.at(-1)??"")&&coresOf(A).some(i=>i.id===it.id),"hồn hạch không dùng như đan được");
        let l=A.logs.length; A.room.send("absorb",{itemId:it.id}); await waitFor(()=>A.logs.length>l);
        ok(/Hãy chọn một hồn hoàn/.test(A.logs.at(-1)??"")&&coresOf(A).some(i=>i.id===it.id),"hồn hạch không hấp thụ như hồn hoàn được");
        l=A.logs.length; A.room.send("equip",{itemId:it.id,vohonId:A.owned.active}); await waitFor(()=>A.logs.length>l);
        ok(/Không có hồn cốt/.test(A.logs.at(-1)??"")&&coresOf(A).find(i=>i.id===it.id)?.vohon===null,"hồn hạch không gắn vào ô hồn cốt (tin equip của hồn cốt; gắn hồn hạch ở 5.2)");
      }
      // Sao theo niên hạn (số ngẫu nhiên rơi 0, sao ngẫu nhiên): mỗi khoảng hạ 3 con, nhặt rồi kiểm số dòng phụ.
      await test(A,"core",{r:0});
      for(const [y,label] of [[1500,"2–4★"],[12000,"3–5★"],[MAX_YEARS,"5–6★"]]){
        const [lo,hi]=coreStarBand(y), got=[];
        for(let k=0;k<3;k++){
          await test(A,"goto",spot); await test(A,"drops",{s:3600}); await sleep(120);
          const n=coresOf(A).length, kk=await killCore(y);
          if(kk&&await pickCore(kk)&&await waitFor(()=>coresOf(A).length===n+1)){ const it=coresOf(A).at(-1); got.push(checkIt(it,kk.dr.stars)&&it.stars>=lo&&it.stars<=hi?it.stars:`sai ${JSON.stringify(it)}`); }
          else got.push("không rơi");
        }
        ok(got.every(s=>Number.isInteger(s)),`hạ hồn thú ${y.toLocaleString("vi-VN")} năm: hồn hạch ${got.map(s=>Number.isInteger(s)?`${s}★`:s).join(", ")} (khoảng ${label}), dòng phụ đúng số theo sao`);
      }
      // Hook give: đủ 6 mức sao, bộ cố định; số dòng phụ đúng CORE_SUBS.
      const g0=new Set(coresOf(A).map(i=>i.id));
      for(let s=1;s<=MAX_CORE_STARS;s++) await test(A,"give",{code:CORE_ITEM,stars:s,set:"hao_thien"});
      const gv=coresOf(A).filter(i=>!g0.has(i.id));
      ok(gv.length===MAX_CORE_STARS&&gv.every((it,i)=>checkIt(it,i+1)&&it.stats.set==="hao_thien"),`1★…6★: dòng phụ ${gv.map(i=>i.stats?.subs?.length).join(" / ")}`);
      for(const i of gv) A.room.send("discard",{id:i.id});
      ok(await waitFor(()=>!coresOf(A).some(i=>g0.has(i.id)===false),3000),"bỏ hồn hạch trong túi được");
      // Túi đầy: báo, hồn hạch ở lại dưới đất; bỏ bớt một ô rồi nhặt được.
      {
        await test(A,"goto",spot); await test(A,"drops",{s:3600}); await sleep(120);
        const freeA=BAG_SLOTS-A.bag.items.filter(i=>i.vohon===null).length;
        await test(A,"give",{code:RING_ITEM,qty:freeA,years:50});
        await test(A,"core",{r:0,set:coreSetIndex("tien_co")});
        const kf=await killCore(12000);
        ok(kf&&CORE_SETS[kf.dr.cset].id==="tien_co","hồn hạch Tiên Cơ (bộ cố định bằng hook) rơi khi túi A đầy");
        if(kf){
          await pickCore(kf);
          ok(st.drops.has(kf.id)&&A.logs.some(t=>t.startsWith(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt vật phẩm rồi mới nhặt được ${coreName("tien_co",kf.dr.stars)}`)),
            `túi đầy: báo, hồn hạch ở lại dưới đất [${A.logs.slice(-2).join(" | ")}]`);
          const junk=ringsOf(A).find(i=>i.years===50); A.room.send("discard",{id:junk.id}); await waitFor(()=>!A.bag.items.some(i=>i.id===junk.id));
          ok(await pickCore(kf)&&coresOf(A).some(i=>i.stats?.set==="tien_co"&&i.stars===kf.dr.stars),"bỏ bớt rồi nhặt được hồn hạch Tiên Cơ");
        }
        for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
        ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
      }
      // Tinh anh (mục 5.4): chắc chắn rơi 1 hồn hạch, sao theo niên hạn, quyền ưu tiên như hồn hoàn.
      {
        const HN="huyet_nhan_phong_lang", hb=BOSSES[bossIndex(HN)];
        await test(A,"goto",spot); await test(A,"drops",{s:3600}); await sleep(120);
        await test(A,"core",{r:99});
        ok(!await killCore(1500,hb.species),"số ngẫu nhiên 0,99: hồn thú thường 1.500 năm (25%) không rơi hồn hạch");
        // #119: hạ cùng loài tinh anh liên tiếp thì bị khóa thưởng ELITE.lock giây; bài này thử luật rơi của từng lần hạ nên bỏ khóa trước.
        await test(A,"elock",{s:0}); A.elite=[]; const ke=await killCore(1500,undefined,HN);
        ok(ke&&ke.dr.stars>=2&&ke.dr.stars<=4&&ke.dr.owner===A.room.sessionId&&await waitFor(()=>A.elite.some(m=>m.k==="down"),1000),
          `cùng số ngẫu nhiên: hạ ${beastName(1,bossIndex(HN))} 1.500 năm chắc chắn rơi ${ke?coreName(CORE_SETS[ke.dr.cset].id,ke.dr.stars):"không có hồn hạch"} (2–4★), thuộc A`);
        await test(A,"core",{r:-1}); // số ngẫu nhiên thật: tinh anh vẫn luôn rơi
        let all=0; for(let k=0;k<3;k++){ await test(A,"drops",{s:3600}); await test(A,"elock",{s:0}); await sleep(120); if(await killCore(437,undefined,HN)) all++; }
        ok(all===3,`số ngẫu nhiên thật: hạ tinh anh 3 lần, rơi hồn hạch ${all}/3 lần`);
        await test(A,"drops",{s:3600});
      }
      // Giữ lại hồn hạch trong túi để kiểm khi vào lại (bagKey so cả sao và chỉ số).
      A.coreKeep=coresOf(A).map(i=>[i.id,i.stars,sj(i.stats),i.vohon]);
      ok(A.coreKeep.length>=3,`túi A còn ${A.coreKeep.length} hồn hạch (kiểm khi vào lại)`);
      await test(A,"core",{r:100}); // tắt lại cho các phần sau
    }
    await test(A,"bone",{r:-1});
    // ---------- 4.2: gắn hồn cốt vào 6 ô của võ hồn (đúng vị trí, đổi chỗ, tháo), cộng chỉ số; chỉ ngoài giao chiến ----------
    {
      /** Gửi equip / unequip; server luôn gửi lại túi và một dòng log (gắn, tháo hoặc lý do từ chối). Trả dòng log đó. */
      async function boneOp(type,msg){ const n=A.bagMsgs??0, l=A.logs.length; A.room.send(type,msg); await waitFor(()=>(A.bagMsgs??0)>n&&A.logs.length>l,2000); await sleep(80); return A.logs.at(-1)??""; }
      const eqOf=id=>A.bag.items.find(i=>i.id===id)?.vohon, loose=()=>A.bag.items.filter(i=>i.vohon===null).length;
      const act=A.owned.active, other=A.owned.list.find(v=>v.rowId!==act)?.rowId;
      const tp=bonesOf(A).find(i=>i.stats?.slot==="tay_phai"&&i.years===32000), hd=bonesOf(A).find(i=>i.stats?.slot==="dau"&&i.years===12000);
      const addAtk=boneStats("tay_phai",32000).atk, addMp=boneStats("dau",12000).mp;
      const bb=boneBonus([{slot:"tay_phai",years:32000},{slot:"dau",years:12000},{slot:"than",years:1000}]);
      ok(same([bb.hp,bb.mp,bb.atk],[boneStats("than",1000).hp,addMp,addAtk])&&CORE_STAT_IDS.every(k=>["hp","mp","atk"].includes(k)||bb[k]===0),
        "boneBonus cộng đúng chỉ số chính từng vị trí");
      ok(tp&&hd,"A có hồn cốt Tay phải 32.000 năm và Đầu 12.000 năm để gắn");
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const s0=await test(A,"stats");
      ok(CORE_STAT_IDS.every(k=>s0.bones[k]===0)&&s0.live.maxHp===s0.base.maxHp&&s0.live.maxMp===s0.base.maxMp,"chưa gắn: chỉ số võ hồn ra trận = chỉ số gốc");
      let t=await boneOp("equip",{itemId:tp.id,vohonId:act,slot:"dau"});
      ok(/chỉ gắn vào ô Tay phải, không gắn vào ô Đầu/.test(t)&&eqOf(tp.id)===null,`thả hồn cốt Tay phải vào ô Đầu bị từ chối: ${t}`);
      t=await boneOp("equip",{itemId:tp.id,vohonId:act,slot:"xyz"}); ok(/chỉ gắn vào ô Tay phải/.test(t)&&eqOf(tp.id)===null,"ô lạ bị từ chối");
      t=await boneOp("equip",{itemId:tp.id,vohonId:987654321}); ok(/không sở hữu/.test(t)&&eqOf(tp.id)===null,`võ hồn không thuộc mình bị từ chối: ${t}`);
      t=await boneOp("equip",{itemId:tp.id,vohonId:String(act)}); ok(/không sở hữu/.test(t)&&eqOf(tp.id)===null,"vohonId không phải số nguyên bị từ chối");
      const dan=A.bag.items.find(i=>i.code!==BONE_ITEM&&i.vohon===null);
      if(dan){ t=await boneOp("equip",{itemId:dan.id,vohonId:act}); ok(/Không có hồn cốt này/.test(t),`gắn vật phẩm không phải hồn cốt bị từ chối: ${t}`); }
      t=await boneOp("equip",{itemId:"khong-co",vohonId:act}); ok(/Không có hồn cốt này/.test(t),"id lạ bị từ chối");
      await test(A,"energy",{v:0}); // tính như vừa giao chiến
      t=await boneOp("equip",{itemId:tp.id,vohonId:act}); ok(/Đang giao chiến/.test(t)&&eqOf(tp.id)===null,`đang giao chiến: gắn bị từ chối (${t})`);
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const free0=loose();
      t=await boneOp("equip",{itemId:tp.id,vohonId:act,slot:"tay_phai"});
      const s1=await test(A,"stats");
      ok(eqOf(tp.id)===act&&loose()===free0-1&&t.startsWith(`Gắn hồn cốt ${akName} vào ô Tay phải`),`gắn đúng ô Tay phải, không còn chiếm ô túi: ${t}`);
      ok(s1.bones.atk===addAtk&&Math.abs(s1.live.atk-(s1.base.atk+addAtk))<1e-6&&s1.live.maxHp===s1.base.maxHp,
        `võ hồn ra trận: công ${s1.base.atk.toFixed(1)} -> ${s1.live.atk.toFixed(1)} (+${addAtk}), sinh lực không đổi`);
      const mp0=p.maxMp; await boneOp("equip",{itemId:hd.id,vohonId:act}); // không gửi ô: server tự lấy ô theo vị trí của hồn cốt
      ok(eqOf(hd.id)===act&&await waitFor(()=>p.maxMp===mp0+addMp),`gắn Đầu: hồn lực tối đa ${mp0} -> ${p.maxMp} (+${addMp}), ngay khi đang ra trận`);
      // Đổi chỗ: ô Tay phải đã có thì món cũ về túi, số ô túi không đổi.
      await test(A,"give",{code:BONE_ITEM,years:1000,beast:AK,slot:"tay_phai"});
      const tp2=bonesOf(A).find(i=>i.stats?.slot==="tay_phai"&&i.years===1000&&i.vohon===null), free1=loose();
      t=await boneOp("equip",{itemId:tp2.id,vohonId:act});
      const s2=await test(A,"stats");
      ok(eqOf(tp2.id)===act&&eqOf(tp.id)===null&&loose()===free1&&s2.bones.atk===boneStats("tay_phai",1000).atk&&/về túi đồ/.test(t),
        `đổi chỗ: Tay phải 1.000 năm vào ô, 32.000 năm về túi (${t})`);
      await boneOp("equip",{itemId:tp.id,vohonId:act});
      ok(eqOf(tp.id)===act&&eqOf(tp2.id)===null&&(await test(A,"stats")).bones.atk===addAtk,"đổi lại: 32.000 năm vào ô, 1.000 năm về túi");
      if(other){
        t=await boneOp("equip",{itemId:tp.id,vohonId:other}); ok(/tháo ra trước/.test(t)&&eqOf(tp.id)===act,`hồn cốt đang gắn trên võ hồn khác không gắn thẳng sang: ${t}`);
        await boneOp("equip",{itemId:tp2.id,vohonId:other});
        const so=await test(A,"stats",{rowId:other}), sa=await test(A,"stats");
        ok(eqOf(tp2.id)===other&&so.bones.atk===boneStats("tay_phai",1000).atk&&so.live===null&&sa.bones.atk===addAtk&&sa.bones.mp===addMp,
          "gắn vào võ hồn không ra trận: chỉ võ hồn đó được cộng, võ hồn ra trận giữ phần của mình");
        // Đổi võ hồn ra trận: chỉ số theo hồn cốt của võ hồn mới, đổi về thì như cũ.
        const slotO=A.owned.team.indexOf(other), slotA=A.owned.team.indexOf(act);
        if(slotO>=0&&slotA>=0){
          await waitFor(()=>p.swCd===0,3500); A.room.send("switch",{slot:slotO});
          ok(await waitFor(()=>A.owned.active===other),"đổi sang võ hồn có hồn cốt Tay phải 1.000 năm");
          const sw=await test(A,"stats");
          ok(sw.bones.atk===boneStats("tay_phai",1000).atk&&sw.bones.mp===0&&Math.abs(sw.live.atk-sw.stats.atk)<1e-6&&p.maxMp===sw.stats.maxMp,
            `ra trận: công ${sw.live.atk.toFixed(1)} (hồn cốt +${sw.bones.atk}), hồn lực tối đa ${p.maxMp} không có Đầu`);
          await waitFor(()=>p.swCd===0,3500); A.room.send("switch",{slot:slotA});
          ok(await waitFor(()=>A.owned.active===act)&&Math.abs((await test(A,"stats")).live.atk-s1.live.atk)<1e-6,"đổi về: chỉ số như trước");
        } else console.log("  ⚠ bỏ qua đổi võ hồn ra trận (võ hồn thứ hai không ở trong đội)");
        // Gục: võ hồn ra trận gục vẫn giữ hồn cốt (mục 2: thua không mất đồ).
        A.ko=null; await test(A,"down"); await waitFor(()=>A.ko,2000);
        ok(eqOf(tp.id)===act&&eqOf(hd.id)===act&&eqOf(tp2.id)===other,"võ hồn gục: hồn cốt vẫn gắn nguyên");
        await test(A,"rest",{s:REVIVE_SECS+1}); await waitFor(()=>!p.dead,4000);
        const sb=A.owned.team.indexOf(act);
        if(A.owned.active!==act&&sb>=0){ await waitFor(()=>p.swCd===0,3500); A.room.send("switch",{slot:sb}); await waitFor(()=>A.owned.active===act); }
      }
      // Tháo khi túi đầy: từ chối, hồn cốt vẫn gắn.
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      await test(A,"give",{code:RING_ITEM,qty:BAG_SLOTS-loose(),years:50});
      t=await boneOp("unequip",{itemId:hd.id});
      ok(loose()===BAG_SLOTS&&/Túi đồ đã đầy .* tháo được hồn cốt/.test(t)&&eqOf(hd.id)===act,`túi đầy: tháo bị từ chối (${t})`);
      for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
      ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
      t=await boneOp("unequip",{itemId:tp2.id}); // hồn cốt của võ hồn không ra trận cũng tháo được
      t=await boneOp("unequip",{itemId:hd.id});
      ok(eqOf(hd.id)===null&&A.bag.items.find(i=>i.id===hd.id)?.enhance===0&&await waitFor(()=>p.maxMp===mp0)&&/giữ cường hóa \+0/.test(t),
        `tháo Đầu về túi, giữ cường hóa, hồn lực tối đa về ${p.maxMp} (${t})`);
      t=await boneOp("unequip",{itemId:hd.id}); ok(/không gắn trên võ hồn nào/.test(t),"tháo hồn cốt đang ở túi bị từ chối");
      A.room.send("discard",{id:tp2.id}); await waitFor(()=>!A.bag.items.some(i=>i.id===tp2.id));
      ok(eqOf(tp.id)===act&&eqOf(hd.id)===null,"còn Tay phải 32.000 năm gắn trên võ hồn ra trận (kiểm khi vào lại)");
      const l=A.logs.length; A.room.send("discard",{id:tp.id}); await waitFor(()=>A.logs.length>l);
      ok(eqOf(tp.id)===act,"hồn cốt đang gắn không bỏ được (không nằm trong túi)");
      A.boneEq={id:tp.id,vohon:act,atk:addAtk};
    }
    // ---------- 4.3: kỹ năng hồn cốt chủ động (đầu, hai tay: Z/X/C) và bị động (thân, hai chân) của võ hồn ra trận ----------
    {
      async function boneOp(type,msg){ const n=A.bagMsgs??0, l=A.logs.length; A.room.send(type,msg); await waitFor(()=>(A.bagMsgs??0)>n&&A.logs.length>l,2000); await sleep(80); return A.logs.at(-1)??""; }
      /** Gửi boneskill {i}, chờ `wait` ms; trả các dòng log mới (lý do từ chối nếu có). */
      async function bsk(i,wait=300){ A.dmgs=[]; A.fxs=[]; const l=A.logs.length; A.room.send("boneskill",{i}); await sleep(wait); return A.logs.slice(l).join(" | "); }
      const SP=BEASTS.map(b=>b.id), MD="man_da_la_xa", TG="thiet_giap_te_nguu";
      ok(SP.every(s=>{ const k=BONE_SKILLS[s]; return k&&k.active.name&&k.active.cost>0&&k.active.cd>0&&k.passive.name&&Object.keys({...k.passive.buff,...k.passive.resist}).length>0; }),
        `mọi loài trong BEASTS (${SP.length}) có 1 kỹ năng chủ động và 1 kỹ năng bị động`);
      ok(same(BONE_ACTIVE_SLOTS,["dau","tay_trai","tay_phai"])&&BONE_SLOTS.every(s=>boneSkillOf(AK,s.id)?.active===s.active),"đầu, hai tay: chủ động; thân, hai chân: bị động");
      ok(boneSkillOf(MD,"tay_phai").sk.status?.some(a=>a.s==="poison")&&/Vỗ Đất/.test(boneSkillOf(AK,"tay_phai").sk.name),
        `theo loài: ${boneSkillOf(MD,"tay_phai").sk.name} (Mạn Đà La Xà), ${boneSkillOf(AK,"tay_phai").sk.name} (Ám Kim Khủng Trảo Hùng)`);
      const pv=y=>bonePassive([{beast:TG,slot:"than",years:y}]).buff.def;
      ok(pv(1000)<pv(32000)&&pv(32000)<pv(MAX_YEARS)&&Math.abs(pv(32000)-BONE_SKILLS[TG].passive.buff.def*buffPower(32000))<1e-4&&bonePassive([{beast:AK,slot:"tay_phai",years:32000}]).buff.def===undefined,
        `bị động mạnh theo số năm (${BONE_SKILLS[TG].passive.name}: ${[1000,32000,MAX_YEARS].map(pv).join(" / ")}), hồn cốt chủ động không cộng bị động`);
      ok(bonePassive(["than","chan_trai","chan_phai"].map(slot=>({beast:TG,slot,years:MAX_YEARS}))).buff.def===BONE_PASSIVE_CAP.def,`3 bị động cùng loại cộng dồn tối đa ${BONE_PASSIVE_CAP.def}`);
      const act=A.owned.active, tpw=bonesOf(A).find(i=>i.vohon===act&&i.stats?.slot==="tay_phai");
      ok(tpw?.stats?.beast===AK,"võ hồn ra trận đang gắn hồn cốt Tay phải Ám Kim Khủng Trảo Hùng (từ 4.2)");
      // Các phần trước để A ở cấp cao, nhiều hồn hoàn niên hạn cao: một nút đã hạ luôn hồn thú 100.000 năm (không còn để đo Choáng /
      // Trúng độc). Tạm về cấp 15, 1 hồn hoàn 423 năm; cuối phần trả lại như cũ.
      const v0=A.owned.list.find(v=>v.rowId===act), keep0={rowId:act,level:v0.level,xp:v0.xp,rings:[...v0.rings]};
      await test(A,"set",{rowId:act,level:15,rings:[423]});
      await test(A,"goto",spot); await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      await test(A,"give",{code:BONE_ITEM,years:5000,beast:MD,slot:"tay_trai"}); await test(A,"give",{code:BONE_ITEM,years:12000,beast:TG,slot:"than"});
      const md=bonesOf(A).find(i=>i.vohon===null&&i.stats?.beast===MD&&i.years===5000), tg=bonesOf(A).find(i=>i.vohon===null&&i.stats?.beast===TG&&i.years===12000);
      await boneOp("equip",{itemId:md.id,vohonId:act}); await boneOp("equip",{itemId:tg.id,vohonId:act});
      // Bị động: Tê Giáp (giảm sát thương nhận) áp ngay khi gắn trên võ hồn ra trận; hook hurt mất 30% sinh lực x (1 − giảm).
      const want=bonePassive([{beast:TG,slot:"than",years:12000}]), s1=await test(A,"stats");
      ok(A.bag.items.find(i=>i.id===tg.id)?.vohon===act&&same(s1.live?.passive,want),`gắn Thân ${BONE_SKILLS[TG].passive.name}: bị động ${JSON.stringify(s1.live?.passive)}`);
      // Hồi đầy trước (hook set không đổi gì ngoài tính lại chỉ số): đầy sinh lực thì không hồi thêm giữa lúc đọc và lúc hook chạy.
      async function hurtLoss(){ await test(A,"set",{rowId:act}); await waitFor(()=>p.hp===p.maxHp,1000); const h=p.hp; await test(A,"hurt",{pct:30}); await waitFor(()=>p.hp<h,1000); return {h,loss:h-p.hp}; }
      let hl=await hurtLoss(), exp=Math.floor(hl.h*0.3)*(1-want.buff.def);
      ok(Math.abs(hl.loss-exp)<=3,`bị động áp đúng: mất ${hl.loss} sinh lực (30% của ${hl.h} sau khi giảm ${(want.buff.def*100).toFixed(1)}% ≈ ${exp.toFixed(0)})`);
      // Chủ động: Ám Kim Vỗ Đất (C, tay phải) trúng hồn thú cạnh bên, choáng, tốn hồn lực, hồi chiêu riêng.
      await test(A,"clear"); await test(A,"beast",{dx:16,dy:0,years:MAX_YEARS}); await test(A,"bhp",{pct:100}); await test(A,"ready");
      const bid=[...st.beasts.entries()].find(([,b])=>Math.hypot(b.x-p.x-16,b.y-p.y)<2)?.[0], skC=boneSkillOf(AK,"tay_phai").sk, mp0=p.mp;
      // Choáng trên hồn thú 100.000 năm chỉ còn 0,4 giây (CC_TIER_MULT): theo dõi suốt lúc chờ thay vì đọc một lần.
      let stunned=false; const watch=setInterval(()=>{ const b=st.beasts.get(bid); if(b&&(b.st&statusBit("stun"))) stunned=true; },20);
      let r=await bsk(2); clearInterval(watch);
      const fxB=A.fxs.find(f=>f.k==="bone"), bb=st.beasts.get(bid);
      ok(fxB&&fxB.i===2&&fxB.sp===beastIndex(AK)&&fxB.tier===tierOfYears(32000),`fx bone: nút ${fxB?.i}, loài ${BEASTS[fxB?.sp]?.name}, bậc ${fxB?.tier}`);
      ok(bid&&A.dmgs.some(m=>m.bid===bid)&&bb&&stunned,`${skC.name} trúng hồn thú cạnh bên và gây Choáng (${r||"không log"})`);
      ok(mp0-p.mp>=skC.cost-3&&mp0-p.mp<=skC.cost,`tốn hồn lực: ${mp0} -> ${p.mp} (${skC.cost})`);
      ok(p.bcds[2]>skC.cd-1&&p.bcds[2]<=skC.cd&&p.bcds[0]===0&&p.bcds[1]===0,`hồi chiêu riêng nút C: ${p.bcds[2].toFixed(1)} / ${skC.cd} giây, Z / X không đổi`);
      const mp1=p.mp; r=await bsk(2);
      ok(!A.fxs.some(f=>f.k==="bone")&&p.mp>=mp1,"đang hồi chiêu: bấm lại không tung, không tốn hồn lực");
      // X (tay trái): Mạn Đà La Phun Độc gây Trúng độc 2 tầng, hồi chiêu riêng.
      r=await bsk(1); await waitFor(()=>(st.beasts.get(bid)?.poison??0)>=2,600);
      ok(A.fxs.some(f=>f.k==="bone"&&f.i===1)&&(st.beasts.get(bid)?.poison??0)>=2&&p.bcds[1]>0,`${boneSkillOf(MD,"tay_trai").sk.name}: Trúng độc ${st.beasts.get(bid)?.poison} tầng, hồi chiêu ${p.bcds[1].toFixed(1)} giây`);
      r=await bsk(0); ok(/Ô Đầu .* chưa gắn hồn cốt/.test(r)&&!A.fxs.some(f=>f.k==="bone"),`Z (Đầu trống): ${r}`);
      // Câm lặng chặn kỹ năng hồn cốt (vẫn đánh thường); vùng an toàn chặn.
      await test(A,"ready"); await test(A,"pst",{s:"silence",secs:2}); const mp2=p.mp;
      r=await bsk(2); ok(/Câm lặng/.test(r)&&!A.fxs.some(f=>f.k==="bone")&&p.bcds[2]===0&&p.mp>=mp2,`đang Câm lặng: bị chặn (${r})`);
      await test(A,"clear"); const safeAt={x:Math.round(safe.x+safe.width/2),y:VILLAGE_RY};
      await test(A,"goto",safeAt); await waitFor(()=>inSafe(),1000); await test(A,"ready"); const mp3=p.mp;
      r=await bsk(2); ok(inSafe()&&/Vùng an toàn/.test(r)&&!A.fxs.some(f=>f.k==="bone")&&p.bcds[2]===0&&p.mp>=mp3,`vùng an toàn: bị chặn (${r})`);
      // #270 (mục 5.3 "đang niệm vẫn đánh được"): đang niệm đi cổng vẫn dùng được kỹ năng hồn cốt như hồn kỹ, không hủy niệm.
      // Cổng làng (ngoài vùng an toàn); hồn thú cạnh bên không đánh trả (hook beast), bước ra khỏi cổng thì mới hủy niệm.
      const gate=JSON.parse(readFileSync(mapUrl(st.mapId),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="portal");
      if(gate){
        await test(A,"goto",{x:gate.x+gate.width/2,y:gate.y+gate.height/2}); await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
        await test(A,"beast",{dx:16,dy:0,years:MAX_YEARS}); await test(A,"bhp",{pct:100}); await test(A,"ready");
        await waitFor(()=>A.portal?.name===gate.name,1000); const lt=A.logs.length, m0=st.mapId;
        // Niệm chỉ TRAVEL_CAST giây: gửi liền tin đi cổng, kỹ năng hồn cốt, rời cổng (hook goto). Server xử lý tin theo thứ tự nên kỹ năng
        // dùng lúc đang niệm và niệm bị hủy vì rời cổng, không phụ thuộc máy chậm hay nhanh.
        A.dmgs=[]; A.fxs=[]; A.room.send("travel",{portal:gate.name}); A.room.send("boneskill",{i:2}); await test(A,"goto",spot);
        await waitFor(()=>A.fxs.some(f=>f.k==="bone")&&A.logs.slice(lt).some(t=>/hủy đi qua cổng/.test(t)),1500);
        const cast=A.logs.slice(lt).filter(t=>!/Đã rời cổng: hủy đi qua cổng/.test(t)).join(" | ");
        ok(/Đang đi tới/.test(cast)&&A.fxs.some(f=>f.k==="bone"&&f.i===2)&&p.bcds[2]>0&&!/hủy|không dùng được/.test(cast)
          &&A.logs.slice(lt).some(t=>/Đã rời cổng: hủy đi qua cổng/.test(t))&&st.mapId===m0,
          `đang niệm đi cổng: dùng được kỹ năng hồn cốt, vẫn niệm tới khi rời cổng (${A.logs.slice(lt).join(" | ")})`);
        await test(A,"clear");
      } else ok(false,`#270: ${st.mapId} không có cổng để thử kỹ năng hồn cốt khi đang niệm`);
      await test(A,"goto",spot); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      // Tháo hồn cốt Thân: mất bị động ngay.
      await boneOp("unequip",{itemId:tg.id});
      const s2=await test(A,"stats"); hl=await hurtLoss(); exp=Math.floor(hl.h*0.3);
      ok(same(s2.live?.passive,{buff:{},resist:{}})&&Math.abs(hl.loss-exp)<=3,`tháo Thân: hết bị động, mất ${hl.loss} sinh lực (≈ ${exp})`);
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1}); await boneOp("unequip",{itemId:md.id});
      for(const it of [md,tg]) A.room.send("discard",{id:it.id});
      ok(await waitFor(()=>!A.bag.items.some(i=>i.id===md.id||i.id===tg.id),2000)&&bonesOf(A).find(i=>i.id===tpw.id)?.vohon===act,"dọn hồn cốt thử 4.3, Tay phải 32.000 năm vẫn gắn");
      await test(A,"clear"); await test(A,"set",keep0); await test(A,"ready");
    }
    // ---------- 4.4: cường hóa hồn cốt bằng hồn cốt dư (điểm theo niên hạn, cùng vị trí +50%, +0..+20, mốc nâng kỹ năng) ----------
    {
      async function boneOp(type,msg){ const n=A.bagMsgs??0, l=A.logs.length; A.room.send(type,msg); await waitFor(()=>(A.bagMsgs??0)>n&&A.logs.length>l,2000); await sleep(80); return A.logs.at(-1)??""; }
      /** Gửi enhance; server luôn gửi lại túi và một dòng log (kết quả hoặc lý do từ chối). Trả dòng log đó. */
      const enh=(targetId,materialIds)=>{ A.enh=null; return boneOp("enhance",{targetId,materialIds}); };
      /** Hook give một hồn cốt; trả về món vừa vào túi. */
      async function give(years,slot,beast=AK){ const had=new Set(bonesOf(A).map(i=>i.id)); await test(A,"give",{code:BONE_ITEM,years,beast,slot}); return bonesOf(A).find(i=>!had.has(i.id)); }
      const itemOf=id=>A.bag.items.find(i=>i.id===id), MD="man_da_la_xa", TG="thiet_giap_te_nguu";
      const fx=(years,slot,tgt,xp)=>boneFeedXp({slot,years,xp},tgt), atkAt=n=>boneStats("tay_phai",32000,n).atk;
      // Công thức (shared/data.ts, chờ chốt).
      ok(fx(1000,"tay_phai","tay_phai")===Math.round(1000*BONE_FEED_PER_YEAR*BONE_FEED_SAME_SLOT)&&fx(1000,"dau","tay_phai")===Math.round(1000*BONE_FEED_PER_YEAR)&&fx(32000,"dau","tay_phai")===32*fx(1000,"dau","tay_phai"),
        `điểm nguyên liệu tỉ lệ niên hạn (1.000 năm ${fx(1000,"dau","tay_phai")}, 32.000 năm ${fx(32000,"dau","tay_phai")}), cùng vị trí ×${BONE_FEED_SAME_SLOT} (${fx(1000,"tay_phai","tay_phai")})`);
      ok(fx(1000,"dau","tay_phai",100)===fx(1000,"dau","tay_phai")+Math.floor(100*BONE_FEED_CARRY),`nguyên liệu đã cường hóa trả lại ${BONE_FEED_CARRY*100}% điểm đã nạp`);
      ok(Array.from({length:BONE_MAX_ENHANCE+1},(_,n)=>boneEnhanceLevel(boneEnhanceNeed(n))===n&&(n===0||boneEnhanceLevel(boneEnhanceNeed(n)-1)===n-1)).every(Boolean)&&boneEnhanceLevel(1e9)===BONE_MAX_ENHANCE,
        `bảng ngưỡng +1..+${BONE_MAX_ENHANCE} (+5 / +10 / +15 / +20 cần ${[5,10,15,20].map(boneEnhanceNeed).join(" / ")} điểm)`);
      ok(Array.from({length:BONE_MAX_ENHANCE},(_,n)=>atkAt(n+1)>atkAt(n)&&boneStats("tay_trai",1000,n+1).atk>boneStats("tay_trai",1000,n).atk).every(Boolean),
        `mỗi cấp tăng chỉ số chính (Tay phải 32.000 năm: ${atkAt(0)} -> +5 ${atkAt(5)} -> +20 ${atkAt(20)} công)`);
      ok([0,4,5,9,10,15,20].map(n=>boneSkillMult(n).toFixed(2)).join(" ")==="1.00 1.00 1.10 1.10 1.20 1.30 1.40","mốc +5 / +10 / +15 / +20: kỹ năng ×1,1 / ×1,2 / ×1,3 / ×1,4");
      ok(boneName(AK,"tay_phai",32000,5)==="+5 Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm"&&boneName(AK,"tay_phai",32000)===akName,`tên có +N: ${boneName(AK,"tay_phai",32000,5)}`);
      const pv=boneEnhancePreview({slot:"than",xp:boneEnhanceNeed(19)},[{slot:"than",years:MAX_YEARS}]);
      ok(pv.level===BONE_MAX_ENHANCE&&pv.xp===boneEnhanceNeed(BONE_MAX_ENHANCE)&&pv.waste===boneEnhanceNeed(19)+pv.gain-pv.xp&&pv.waste>0,`xem trước: kẹp ở +${BONE_MAX_ENHANCE}, dư ${pv.waste} điểm`);
      // #281: phí Hồn Tệ theo cấp vượt qua (hàm thuần): cấp thấp miễn phí, chia nhỏ hay nhảy một lần cùng tổng, chưa lên cấp không mất phí.
      { const stepSum=(T,a,b)=>Array.from({length:b-a},(_,k)=>enhanceFee(T,a+k,a+k+1)).reduce((x,y)=>x+y,0);
        ok(BONE_ENHANCE_FEE.length===BONE_MAX_ENHANCE&&CORE_ENHANCE_FEE.length===CORE_MAX_ENHANCE&&enhanceFee(BONE_ENHANCE_FEE,0,5)===0&&enhanceFee(CORE_ENHANCE_FEE,0,3)===0
          &&enhanceFee(BONE_ENHANCE_FEE,0,10)===5000&&enhanceFee(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE)===60000&&enhanceFee(CORE_ENHANCE_FEE,0,CORE_MAX_ENHANCE)===55500
          &&enhanceFee(BONE_ENHANCE_FEE,4,7)===BONE_ENHANCE_FEE[4]+BONE_ENHANCE_FEE[5]+BONE_ENHANCE_FEE[6]&&enhanceFee(BONE_ENHANCE_FEE,8,8)===0
          &&stepSum(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE)===enhanceFee(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE)&&stepSum(CORE_ENHANCE_FEE,2,13)===enhanceFee(CORE_ENHANCE_FEE,2,13),
          `phí cường hóa: +1..+5 miễn phí, tới +10 ${formatHonTe(enhanceFee(BONE_ENHANCE_FEE,0,10))}, +20 ${formatHonTe(enhanceFee(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE))}; hồn hạch +15 ${formatHonTe(enhanceFee(CORE_ENHANCE_FEE,0,CORE_MAX_ENHANCE))}; chia nhỏ cùng tổng`); }
      // Hồn cốt đích: Tay phải 32.000 năm đang gắn trên võ hồn ra trận (từ 4.2).
      const act=A.owned.active, tpw=bonesOf(A).find(i=>i.vohon===act&&i.stats?.slot==="tay_phai"&&i.years===32000);
      ok(tpw&&tpw.enhance===0,"đích: hồn cốt Tay phải 32.000 năm đang gắn, +0");
      await test(A,"goto",spot); await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const coin0=A.bag.honTe, coin=async n=>{ await test(A,"coin",{n}); return waitFor(()=>A.bag.honTe===n,1500); }; // #281: số dư biết trước, trả lại cuối bài
      await coin(1000);
      const m1=await give(1000,"tay_phai"), m2=await give(1000,"dau",MD), s0=await test(A,"stats");
      let t=await enh(tpw.id,[m1.id,m2.id]), tw=itemOf(tpw.id);
      const g1=fx(1000,"tay_phai","tay_phai")+fx(1000,"dau","tay_phai"), s1=await test(A,"stats");
      ok(!itemOf(m1.id)&&!itemOf(m2.id),"nguyên liệu bị xóa khỏi túi");
      ok(tw.stats.xp===g1&&tw.enhance===1&&tw.vohon===act&&tw.stats.beast===AK&&tw.stats.slot==="tay_phai"&&A.enh?.from===0&&A.enh?.to===1&&A.enh?.gain===g1,
        `cùng vị trí ${fx(1000,"tay_phai","tay_phai")} + khác vị trí ${fx(1000,"dau","tay_phai")} = ${g1} điểm: +${tw.enhance}, vẫn gắn (${t})`);
      ok(s1.bones.atk===atkAt(1)&&Math.abs(s1.live.atk-s0.live.atk-(atkAt(1)-atkAt(0)))<1e-6,`đang gắn: công ${s0.live.atk.toFixed(1)} -> ${s1.live.atk.toFixed(1)} ngay (hồn cốt +${atkAt(0)} -> +${atkAt(1)})`);
      // Từ chối: chính nó, hồn cốt đang gắn, không phải hồn cốt, trùng, rỗng, đích lạ, đang giao chiến. Không mất gì.
      const hd=await give(1000,"dau"); await boneOp("equip",{itemId:hd.id,vohonId:act});
      const m3=await give(5000,"tay_phai"), xpNow=()=>itemOf(tpw.id)?.stats?.xp, kept=()=>xpNow()===g1&&!!itemOf(m3.id);
      t=await enh(tpw.id,[tpw.id]); ok(/chính hồn cốt/.test(t)&&kept(),`dùng chính nó làm nguyên liệu bị từ chối: ${t}`);
      t=await enh(tpw.id,[hd.id]); ok(/đang gắn trên võ hồn/.test(t)&&itemOf(hd.id)?.vohon===act&&kept(),`hồn cốt đang gắn không làm nguyên liệu được: ${t}`);
      t=await enh(tpw.id,[m3.id,hd.id]); ok(/đang gắn trên võ hồn/.test(t)&&kept(),"một nguyên liệu sai thì cả lần bị từ chối, nguyên liệu đúng còn nguyên");
      const dan=A.bag.items.find(i=>i.code!==BONE_ITEM&&i.vohon===null);
      if(dan){ t=await enh(tpw.id,[dan.id]); ok(/phải là hồn cốt/.test(t)&&itemOf(dan.id)&&kept(),`vật phẩm không phải hồn cốt: ${t}`);
        t=await enh(dan.id,[m3.id]); ok(/Không có hồn cốt này/.test(t)&&kept(),"đích không phải hồn cốt bị từ chối"); }
      t=await enh(tpw.id,[m3.id,m3.id]); ok(/trùng/.test(t)&&kept(),`chọn trùng: ${t}`);
      t=await enh(tpw.id,[]); ok(/ít nhất một/.test(t)&&kept(),"không có nguyên liệu bị từ chối");
      t=await enh(tpw.id,"x"); ok(/ít nhất một/.test(t)&&kept(),"materialIds không phải mảng bị từ chối");
      t=await enh("khong-co",[m3.id]); ok(/Không có hồn cốt này/.test(t)&&kept(),"đích lạ bị từ chối");
      await test(A,"energy",{v:0}); // tính như vừa giao chiến
      t=await enh(tpw.id,[m3.id]); ok(/Đang giao chiến: .*cường hóa/.test(t)&&kept(),`đang giao chiến: bị từ chối (${t})`);
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      // Lên mốc +5: Tay phải 5.000 năm (cùng vị trí) + Tay trái 10.000 năm (khác vị trí).
      const m4=await give(10000,"tay_trai"), g5=g1+fx(5000,"tay_phai","tay_phai")+fx(10000,"tay_trai","tay_phai");
      t=await enh(tpw.id,[m3.id,m4.id]); tw=itemOf(tpw.id); const s5=await test(A,"stats");
      ok(!itemOf(m3.id)&&!itemOf(m4.id)&&tw.stats.xp===g5&&tw.enhance===boneEnhanceLevel(g5)&&tw.enhance===5&&s5.bones.atk===atkAt(5)&&Math.abs(s5.live.atk-s5.stats.atk)<1e-6,
        `lên mốc +5 (${g5} điểm), công hồn cốt +${s5.bones.atk}: ${t}`);
      ok(A.bag.honTe===1000&&A.enh?.fee===0&&!/phí/.test(t),`#281: +0 → +1 → +5 miễn phí (Hồn Tệ giữ ${formatHonTe(A.bag.honTe)})`);
      ok(A.logs.at(-1)?.includes(boneName(AK,"tay_phai",32000,5)),"log ghi tên hồn cốt kèm +5");
      // Mốc nâng kỹ năng: bị động Thân Thiết Giáp Tê Ngưu 12.000 năm lên +20 bằng 5 hồn cốt 100.000 năm cùng vị trí (điểm dư bị bỏ).
      const tg=await give(12000,"than",TG); await boneOp("equip",{itemId:tg.id,vohonId:act});
      const sp0=await test(A,"stats"), def0=sp0.live.passive.buff.def, hp0=p.maxHp, mats=[];
      for(let k=0;k<5;k++) mats.push((await give(MAX_YEARS,"than",TG)).id);
      // #281: +0 → +20 một lần cần phí của cả 20 cấp; thiếu 1 đồng thì từ chối, không mất nguyên liệu / điểm / tiền.
      const fee20=enhanceFee(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE), fee6=enhanceFee(BONE_ENHANCE_FEE,5,6);
      await coin(fee20-1); t=await enh(tg.id,mats);
      ok(/Không đủ Hồn Tệ/.test(t)&&t.includes(formatHonTe(fee20))&&mats.every(id=>itemOf(id))&&itemOf(tg.id).enhance===0&&!itemOf(tg.id).stats?.xp&&A.bag.honTe===fee20-1&&!A.enh,
        `thiếu Hồn Tệ (${formatHonTe(fee20-1)} < ${formatHonTe(fee20)}): từ chối cả lần, không mất gì (${t})`);
      await coin(fee20+fee6+321);
      t=await enh(tg.id,mats); await waitFor(()=>parseBoneSubs(itemOf(tg.id)?.stats).length===BONE_MAX_SUBS); const tgi=itemOf(tg.id), s20=await test(A,"stats");
      ok(A.enh?.fee===fee20&&A.bag.honTe===fee6+321&&t.includes(`phí −${formatHonTe(fee20)}`),`+0 → +20: trừ đúng ${formatHonTe(fee20)} cùng lần, còn ${formatHonTe(A.bag.honTe)}`);
      const def20=bonePassive([{beast:TG,slot:"than",years:12000,enhance:20}]).buff.def, dHp=boneStats("than",12000,20).hp-boneStats("than",12000).hp;
      ok(tgi.enhance===BONE_MAX_ENHANCE&&tgi.stats.xp===boneEnhanceNeed(BONE_MAX_ENHANCE)&&/dư .* điểm bị bỏ/.test(t)&&mats.every(id=>!itemOf(id)),`5 nguyên liệu 100.000 năm: +${tgi.enhance} tối đa, điểm dư bị bỏ (${t})`);
      ok(Math.abs(s20.live.passive.buff.def-def20)<1e-4&&Math.abs(def20-Math.min(BONE_PASSIVE_CAP.def,def0*boneSkillMult(20)))<1e-3&&def20>def0,
        `mốc +20 nâng bị động ${BONE_SKILLS[TG].passive.name}: giảm sát thương ${def0} -> ${s20.live.passive.buff.def} (×${boneSkillMult(20)})`);
      // Từ #187 mốc còn thêm dòng phụ ngẫu nhiên: Thân có thể ra % sinh lực, Tay phải +5 đang gắn có thể ra sinh lực cố định. Phần
      // hồn cốt khớp boneBonus mọi hồn cốt đang gắn (dòng phụ đọc từ túi), sinh lực tối đa tăng ít nhất phần chỉ số chính.
      const wantB=boneBonus(bonesOf(A).filter(i=>i.vohon===act).map(i=>({slot:i.stats.slot,years:i.years,enhance:i.enhance,subs:parseBoneSubs(i.stats)})));
      ok(CORE_STAT_IDS.every(k=>Math.abs(s20.bones[k]-wantB[k])<1e-9)&&parseBoneSubs(tgi.stats).length===boneSubsDue(BONE_MAX_ENHANCE)
        &&await waitFor(()=>p.maxHp===s20.live.maxHp)&&s20.live.maxHp===s20.stats.maxHp&&p.maxHp>=hp0+dHp,
        `sinh lực tối đa ${hp0} -> ${p.maxHp} (chỉ số chính +${dHp}${s20.bones.hp_pct?`, dòng phụ +${s20.bones.hp_pct}%`:""}${s20.bones.hp>boneStats("than",12000,20).hp?`, dòng phụ +${s20.bones.hp-boneStats("than",12000,20).hp} sinh lực`:""}) ngay khi đang gắn`);
      const m5=await give(1000,"than",TG); t=await enh(tg.id,[m5.id]); ok(/tối đa \+20/.test(t)&&itemOf(m5.id),`đã +20: từ chối, nguyên liệu còn nguyên (${t})`);
      // Hồn cốt trong túi (không gắn) cũng cường hóa được; hồn cốt đã cường hóa làm nguyên liệu trả lại 80% điểm.
      const m6=await give(2000,"than",TG); t=await enh(m5.id,[m6.id]);
      const m5i=itemOf(m5.id), g6=fx(2000,"than","than");
      ok(m5i?.vohon===null&&m5i.stats.xp===g6&&m5i.enhance===boneEnhanceLevel(g6)&&!itemOf(m6.id),`cường hóa hồn cốt trong túi: +${m5i?.enhance} (${g6} điểm)`);
      const g7=g5+fx(1000,"than","tay_phai",g6); t=await enh(tpw.id,[m5.id]); tw=itemOf(tpw.id);
      ok(tw.stats.xp===g7&&tw.enhance===boneEnhanceLevel(g7)&&!itemOf(m5.id)&&/vẫn \+5|lên \+/.test(t),`nguyên liệu +${m5i?.enhance}: ${fx(1000,"than","tay_phai")} + ${Math.floor(g6*BONE_FEED_CARRY)} điểm trả lại = ${g7-g5} (${t})`);
      { const f=enhanceFee(BONE_ENHANCE_FEE,5,tw.enhance);
        ok(tw.enhance===6&&f===fee6&&A.enh?.fee===f&&A.bag.honTe===321,`#281: +5 → +${tw.enhance} trả phí ${formatHonTe(f)} (m5 +0 → +${m5i?.enhance} miễn phí), còn ${formatHonTe(A.bag.honTe)}`); }
      await coin(coin0);
      // Tháo về túi vẫn giữ cấp và điểm; võ hồn mất phần chỉ số của hồn cốt đó.
      t=await boneOp("unequip",{itemId:tg.id});
      ok(itemOf(tg.id)?.vohon===null&&itemOf(tg.id).enhance===BONE_MAX_ENHANCE&&itemOf(tg.id).stats.xp===boneEnhanceNeed(BONE_MAX_ENHANCE)&&/giữ cường hóa \+20/.test(t)&&await waitFor(()=>p.maxHp===hp0-boneStats("than",12000).hp),
        `tháo về túi giữ +20, sinh lực tối đa ${hp0+dHp} -> ${p.maxHp} (không còn hồn cốt Thân; ${t})`);
      await boneOp("unequip",{itemId:hd.id});
      for(const it of [tg,hd]) A.room.send("discard",{id:it.id});
      ok(await waitFor(()=>!itemOf(tg.id)&&!itemOf(hd.id),2000)&&itemOf(tpw.id)?.vohon===act,`dọn hồn cốt thử 4.4, Tay phải +${itemOf(tpw.id)?.enhance} vẫn gắn (kiểm khi vào lại)`);
      A.boneEq.atk=boneStats("tay_phai",32000,itemOf(tpw.id).enhance).atk;
    }
    // ---------- 5.2: gắn hồn hạch vào 6 ô của võ hồn, chỉ số chính và phụ cộng vào võ hồn, hiệu ứng bộ 2 / 4 món ----------
    {
      const coresOf=b=>(b.bag?.items??[]).filter(i=>i.code===CORE_ITEM), itOf=id=>A.bag.items.find(i=>i.id===id);
      const eqOf=id=>itOf(id)?.vohon, slotAt=id=>itOf(id)?.stats?.slot, loose=()=>A.bag.items.filter(i=>i.vohon===null).length;
      const worn=list=>list.map(i=>({stars:i.stars,data:i.stats}));
      /** Gửi equipcore / unequipcore; server luôn gửi lại túi và (trừ khi không đổi gì) một dòng log. Trả dòng log mới nhất. */
      async function coreOp(type,msg){ const n=A.bagMsgs??0, l=A.logs.length; A.room.send(type,msg); await waitFor(()=>(A.bagMsgs??0)>n&&A.logs.length>l,2000); await sleep(80); return A.logs.at(-1)??""; }
      /** Hook give: `n` hồn hạch `stars` sao bộ `set`; trả các món mới. */
      async function giveCores(set,n,stars=6){ const before=new Set(coresOf(A).map(i=>i.id)); for(let k=0;k<n;k++) await test(A,"give",{code:CORE_ITEM,stars,set}); return coresOf(A).filter(i=>!before.has(i.id)); }
      /** Hồn thú `years` năm đứng yên cạnh A (đầy máu), làm mục tiêu cho hook status / bst. */
      async function dummy(years,dx=12){ await test(A,"clear"); await test(A,"beast",{dx,dy:0,years}); await test(A,"bhp",{pct:100}); // hồn thú vừa sinh có thể đã lao về phía A trước bản vá state kế tiếp (dx 20 ngoài tầm đánh): lấy con gần điểm sinh nhất (đã clear)
        const d=([,b])=>Math.hypot(b.x-p.x-dx,b.y-p.y); return [...st.beasts.entries()].filter(e=>d(e)<16).sort((a,b)=>d(a)-d(b))[0]?.[0]; }
      const act=A.owned.active, bench=A.owned.team.find(r=>r&&r!==act);
      // Hàm thuần: chỉ số chính theo sao + dòng phụ; bộ 2 / 4 món; 4 + 2 và 2 + 2 + 2.
      const mk=(set,main,subs=[],stars=6)=>({stars,data:{set,main,subs}});
      ok(CORE_SLOTS===6&&same(coreBonus([mk("that_sat","atk",[["crit",3],["hp",90]]),mk("lam_ngan","hp_pct",[],1)]),
        {hp:90,atk:30,mp:0,hp_pct:coreMainValue("hp_pct",1),atk_pct:0,mp_pct:0,crit:3,crit_dmg:0}),"coreBonus: chỉ số chính theo sao + dòng phụ, 1 món mỗi bộ chưa có hiệu ứng");
      const ht2=coreFx([mk("hao_thien","hp"),mk("hao_thien","mp")]), ht4=coreFx([0,1,2,3].map(()=>mk("hao_thien","hp")));
      ok(same(ht2,{atk:0.15})&&same(ht4,{atk:0.15,combo:0.4})&&coreBonus([mk("hao_thien","hp"),mk("hao_thien","mp")]).atk_pct===15,
        "bộ Hạo Thiên: 2 món +15% công (vào chỉ số), 4 món thêm đòn thứ 3 liên tiếp +40%");
      const f42=coreFx([...[0,1,2,3].map(()=>mk("phuong_hoang","hp")),mk("tien_co","hp"),mk("tien_co","atk")]);
      const f222=coreFx(["xa_hoang","xa_hoang","linh_mieu","linh_mieu","lam_ngan","lam_ngan"].map(s=>mk(s,"hp")));
      ok(same(f42,{burn:0.12,burnMax:1,boom:0.3,energy:0.2})&&same(f222,{poison:0.15,crit:0.12,cc:0.2}),
        `ghép 4 + 2 (${JSON.stringify(f42)}) và 2 + 2 + 2 (${JSON.stringify(f222)})`);
      ok(same(CORE_SET_FX.tien_co,{two:{energy:0.2},four:{tienCo:0.35}})&&calcStats(0,10,[1],1,{},{atk_pct:10,crit:5}).atk===calcStats(0,10,[1]).atk*1.1
        &&calcStats(0,10,[1],1,{},{crit:5,crit_dmg:10}).crit===CRIT.chance+0.05,"calcStats nhận hồn hạch: % nhân phần gốc, chí mạng cộng vào");

      await test(A,"goto",spot); await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const s0=await test(A,"stats");
      const resCrit0=(s0.res?.bonus?.crit??0)/100;
      // Từ #187 hồn cốt đang gắn có thể có dòng phụ chí mạng (tung ngẫu nhiên): chí mạng = gốc + cộng minh + phần hồn cốt (`bones`).
      ok(Object.values(s0.cores).every(x=>x===0)&&same(s0.fx,{})&&Math.abs(s0.live.crit-(CRIT.chance+resCrit0+s0.bones.crit/100))<1e-9&&Math.abs(s0.live.critMult-(CRIT.mult+s0.bones.crit_dmg/100))<1e-9,
        `chưa gắn hồn hạch: không cộng gì, chí mạng gốc + cộng minh ${(resCrit0*100).toFixed(1)}%${s0.bones.crit||s0.bones.crit_dmg?` + hồn cốt (${s0.bones.crit}% / ${s0.bones.crit_dmg}%)`:""}`);
      const HT=await giveCores("hao_thien",4);
      ok(HT.length===4&&HT.every(i=>i.vohon===null),"A có 4 hồn hạch Hạo Thiên 6★ (hook give)");
      // Từ chối: không phải hồn hạch, id lạ, võ hồn không thuộc mình, ô sai, đang giao chiến.
      const dan=A.bag.items.find(i=>i.code!==CORE_ITEM&&i.vohon===null&&i.code!==BONE_ITEM), bone=bonesOf(A)[0];
      let t;
      if(dan){ t=await coreOp("equipcore",{itemId:dan.id,vohonId:act}); ok(/Không có hồn hạch này/.test(t),`gắn vật phẩm không phải hồn hạch bị từ chối: ${t}`); }
      if(bone){ t=await coreOp("equipcore",{itemId:bone.id,vohonId:act}); ok(/Không có hồn hạch này/.test(t)&&bonesOf(A).find(i=>i.id===bone.id)?.vohon===bone.vohon,"hồn cốt không gắn vào ô hồn hạch"); }
      t=await coreOp("equipcore",{itemId:"khong-co",vohonId:act}); ok(/Không có hồn hạch này/.test(t),"id lạ bị từ chối");
      t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:987654321}); ok(/không sở hữu/.test(t)&&eqOf(HT[0].id)===null,`võ hồn không thuộc mình bị từ chối: ${t}`);
      t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:String(act)}); ok(/không sở hữu/.test(t),"vohonId không phải số nguyên bị từ chối");
      for(const bad of [6,-1,1.5,"2"]){ t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:act,slot:bad}); ok(/Ô hồn hạch không hợp lệ/.test(t)&&eqOf(HT[0].id)===null,`ô ${JSON.stringify(bad)} bị từ chối`); }
      await test(A,"energy",{v:0}); // tính như vừa giao chiến
      t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:act}); ok(/Đang giao chiến: .* gắn \/ tháo hồn hạch/.test(t)&&eqOf(HT[0].id)===null,`đang giao chiến: gắn bị từ chối (${t})`);
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      // Gắn vào ô 4 (chỉ số 3): không còn chiếm ô túi; chỉ số chính + phụ cộng ngay vào võ hồn ra trận.
      const free0=loose();
      t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:act,slot:3});
      let s1=await test(A,"stats");
      ok(eqOf(HT[0].id)===act&&slotAt(HT[0].id)===3&&loose()===free0-1&&t.startsWith(`Gắn hồn hạch Hạo Thiên 6★ vào ô 4`),`gắn vào ô 4: ${t}`);
      ok(same(s1.cores,coreBonus(worn([itOf(HT[0].id)])))&&same(s1.fx,{})&&s1.live.maxHp===s1.stats.maxHp&&s1.live.maxMp===s1.stats.maxMp&&Math.abs(s1.live.atk-s1.stats.atk)<1e-6,
        `chỉ số hồn hạch cộng ngay: ${CORE_STAT_IDS.filter(k=>s1.cores[k]).map(k=>coreStatText(k,s1.cores[k])).join(", ")} (1 món: chưa có hiệu ứng bộ)`);
      // Không gửi ô: vào ô trống đầu tiên; đủ 2 món Hạo Thiên thì +15% công.
      t=await coreOp("equipcore",{itemId:HT[1].id,vohonId:act});
      s1=await test(A,"stats");
      const noSet={...s1.cores,atk_pct:s1.cores.atk_pct-15}, vh=vohonIndex(A.owned.list.find(v=>v.rowId===act).vohon), vv=A.owned.list.find(v=>v.rowId===act);
      const calc=c=>calcStats(vh,vv.level,vv.rings.map(tierOfYears),vv.stars,s1.bones,c,A.res?.bonus).atk;
      ok(slotAt(HT[1].id)===0&&/Kích hoạt bộ Hạo Thiên 2 món: \+15% công/.test(t)&&s1.sets.hao_thien===2&&same(s1.fx,{atk:0.15}),`không chọn ô: vào ô 1; ${t}`);
      ok(same(s1.cores,coreBonus(worn([0,1].map(k=>itOf(HT[k].id)))))&&Math.abs(s1.live.atk-calc(s1.cores))<1e-6&&calc(s1.cores)>calc(noSet),
        `bộ Hạo Thiên 2 món: công ${calc(noSet).toFixed(1)} -> ${s1.live.atk.toFixed(1)} (+15%)`);
      // Đổi chỗ: ô 1 đã có thì món cũ về túi, số ô túi không đổi; chuyển giữa hai ô của cùng võ hồn.
      const free1=loose();
      t=await coreOp("equipcore",{itemId:HT[2].id,vohonId:act,slot:0});
      ok(eqOf(HT[2].id)===act&&slotAt(HT[2].id)===0&&eqOf(HT[1].id)===null&&slotAt(HT[1].id)===undefined&&loose()===free1&&/về túi đồ/.test(t),`đổi chỗ: ô 1 thay món mới, món cũ về túi (${t})`);
      t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:act,slot:0});
      ok(slotAt(HT[0].id)===0&&slotAt(HT[2].id)===3&&/^Chuyển .* sang ô 1 .* sang ô 4/.test(t),`chuyển ô 4 sang ô 1, hai món đổi chỗ (${t})`);
      await coreOp("equipcore",{itemId:HT[1].id,vohonId:act}); await coreOp("equipcore",{itemId:HT[3].id,vohonId:act});
      s1=await test(A,"stats");
      ok(same([0,1,2,3].map(k=>slotAt(HT[k].id)),[0,1,3,2])&&s1.sets.hao_thien===4&&same(s1.fx,{atk:0.15,combo:0.4})&&A.logs.some(x=>/Kích hoạt bộ Hạo Thiên 4 món/.test(x)),
        `4 món Hạo Thiên ở ô 1–4: ${JSON.stringify(s1.fx)}`);
      // Hạo Thiên 4 món: đòn thường trúng thứ 3 liên tiếp thêm sát thương (fx combo đúng ở đòn thứ 3).
      // Trói hồn thú để đòn đánh không đẩy lùi nó ra khỏi tầm (đòn trượt thì đếm lại).
      await test(A,"goto",spot); await step(A,1,0); const htB=await dummy(MAX_YEARS); await test(A,"status",{s:"root",secs:10,bid:htB}); await test(A,"ready");
      const {combos,why}=await comboHits(A,htB);
      ok(same(combos,[0,0,1]),`Hạo Thiên 4 món: liên kích ở đòn thứ 3 (${combos.join(", ")})`+(same(combos,[0,0,1])?"":` [${why}]`));
      if(bench){ t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:bench}); ok(/tháo ra trước/.test(t)&&eqOf(HT[0].id)===act,`hồn hạch đang gắn trên võ hồn khác không gắn thẳng sang: ${t}`); }
      // Gục: hồn hạch vẫn gắn nguyên (mục 2: thua không mất đồ).
      if(bench){
        A.ko=null; await test(A,"down"); await waitFor(()=>A.ko,2000);
        ok(HT.every(i=>eqOf(i.id)===act),"võ hồn gục: hồn hạch vẫn gắn nguyên");
        await test(A,"rest",{s:REVIVE_SECS+1}); await waitFor(()=>!p.dead,4000);
        if(A.owned.active!==act){ await waitFor(()=>p.swCd===0,3500); A.room.send("switch",{slot:A.owned.team.indexOf(act)}); await waitFor(()=>A.owned.active===act); }
      }
      // Tháo khi túi đầy: từ chối; tháo về túi giữ nâng cấp.
      await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      await test(A,"give",{code:RING_ITEM,qty:BAG_SLOTS-loose(),years:50});
      t=await coreOp("unequipcore",{itemId:HT[3].id});
      ok(loose()===BAG_SLOTS&&/Túi đồ đã đầy .* tháo được hồn hạch/.test(t)&&eqOf(HT[3].id)===act,`túi đầy: tháo bị từ chối (${t})`);
      for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
      ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
      const l0=A.logs.length; A.room.send("discard",{id:HT[3].id}); await waitFor(()=>A.logs.length>l0);
      ok(eqOf(HT[3].id)===act,"hồn hạch đang gắn không bỏ được (không nằm trong túi)");
      for(const it of HT) t=await coreOp("unequipcore",{itemId:it.id});
      s1=await test(A,"stats");
      ok(HT.every(i=>eqOf(i.id)===null&&slotAt(i.id)===undefined)&&/giữ nâng cấp \+0/.test(t)&&Object.values(s1.cores).every(x=>x===0)&&same(s1.fx,{})&&Math.abs(s1.live.atk-s0.live.atk)<1e-6,
        `tháo cả 4 về túi: chỉ số về như cũ (${t})`);
      t=await coreOp("unequipcore",{itemId:HT[0].id}); ok(/không gắn trên võ hồn nào/.test(t),"tháo hồn hạch đang ở túi bị từ chối");
      for(const it of HT) A.room.send("discard",{id:it.id});
      await waitFor(()=>!HT.some(i=>itOf(i.id)),2000);

      // Tiên Cơ (docs/design/hon-hach.md): 2 món trên võ hồn ngoài sân tích năng lượng +20%; 4 món: tiên cơ của võ hồn đó +35% sát thương.
      if(bench){
        const TC=await giveCores("tien_co",4);
        await coreOp("equipcore",{itemId:TC[0].id,vohonId:bench}); t=await coreOp("equipcore",{itemId:TC[1].id,vohonId:bench});
        const sb=await test(A,"stats",{rowId:bench}), sa=await test(A,"stats");
        ok(sb.sets.tien_co===2&&same(sb.fx,{energy:0.2})&&sb.live===null&&same(sa.fx,{}),"gắn 2 Tiên Cơ vào võ hồn ngoài sân: chỉ võ hồn đó có bộ");
        await test(A,"goto",spot); await step(A,1,0); await test(A,"clear"); await test(A,"beast",{dx:12,dy:0,years:10});
        await test(A,"energy",{v:0}); await waitFor(()=>sqOf(A,bench)?.en===0);
        A.room.send("attack"); await waitFor(()=>sqOf(A,bench)?.en>0);
        ok(sqOf(A,bench)?.en===Math.floor(TIEN_CO_GAIN.attack*1.2),`Tiên Cơ 2 món: đòn thường +${sqOf(A,bench)?.en} năng lượng cho võ hồn mang bộ (thường ${TIEN_CO_GAIN.attack})`);
        await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
        await coreOp("equipcore",{itemId:TC[2].id,vohonId:bench}); await coreOp("equipcore",{itemId:TC[3].id,vohonId:bench});
        const sb4=await test(A,"stats",{rowId:bench}), bv=A.owned.list.find(v=>v.rowId===bench), tc=tienCoOf(bv.vohon);
        ok(sb4.sets.tien_co===4&&same(sb4.fx,{energy:0.2,tienCo:0.35}),"4 món Tiên Cơ trên võ hồn ngoài sân");
        // Đổi tay vào võ hồn đầy năng lượng: sát thương tiên cơ = công × hệ số × 1,35 (chí mạng thì nhân hệ số chí mạng).
        await waitFor(()=>p.swCd===0,3500); await test(A,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sqOf(A,bench)?.en===TIEN_CO_MAX);
        const bid=await dummy(1500,20); A.dmgs=[]; A.fx=[];
        A.room.send("switch",{slot:A.owned.team.indexOf(bench)});
        await waitFor(()=>A.fx.length&&A.dmgs.some(d=>d.bid===bid),1500);
        const dm=A.dmgs.find(d=>d.bid===bid), sw=await test(A,"stats");
        if(tc.pctHp||tc.lowHp||!tc.dmg) console.log(`  ⚠ bỏ qua đo sát thương tiên cơ của ${bv.vohon} (có % sinh lực / theo máu đã mất)`);
        else { const want=sw.live.atk*tc.dmg*1.35*(dm?.crit?sw.live.critMult:1);
          ok(dm&&Math.abs(dm.v-want)<=1&&sw.rowId===bench,`Tiên Cơ 4 món: ${tc.name} gây ${dm?.v}${dm?.crit?" (chí mạng)":""} ≈ ${want.toFixed(1)} (công ${sw.live.atk.toFixed(1)} × ${tc.dmg} × 1,35)`); }
        await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
        await waitFor(()=>p.swCd===0,3500); A.room.send("switch",{slot:A.owned.team.indexOf(act)}); await waitFor(()=>A.owned.active===act);
        A.coreBench={vohon:bench,ids:TC.map(i=>i.id)}; // giữ 4 Tiên Cơ trên võ hồn ngoài sân: kiểm khi vào lại
      } else console.log("  ⚠ bỏ qua Tiên Cơ (đội chỉ có một võ hồn)");

      // Phượng Hoàng 4 + Xà Hoàng 2 (ghép 4 + 2): Thiêu đốt +12%, thêm 1 tầng tối đa, Viêm bạo +30%; Trúng độc +15%.
      const PH=await giveCores("phuong_hoang",4), XH=await giveCores("xa_hoang",4);
      await test(A,"goto",spot); await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      for(const it of [...PH,XH[0],XH[1]]) await coreOp("equipcore",{itemId:it.id,vohonId:act});
      t=await coreOp("equipcore",{itemId:XH[2].id,vohonId:act});
      s1=await test(A,"stats");
      ok(/đã đủ 6 hồn hạch: chọn một ô để thay/.test(t)&&eqOf(XH[2].id)===null&&same(Object.values(s1.slots).sort(),[0,1,2,3,4,5]),`đủ 6 ô: món thứ 7 không chọn ô bị từ chối (${t})`);
      ok(s1.sets.phuong_hoang===4&&s1.sets.xa_hoang===2&&same(s1.fx,{burn:0.12,burnMax:1,boom:0.3,poison:0.15}),`ghép 4 + 2: ${JSON.stringify(s1.fx)}`);
      const atkNow=s1.live.atk*(1+(s1.live.passive?.buff?.atk??0)), bond=await test(A,"bond");
      await dummy(MAX_YEARS); await test(A,"status",{s:"burn",n:9}); await test(A,"status",{s:"poison",n:5});
      let bs=await test(A,"bst");
      const wantBurn=atkNow*STATUS.burn.dot*(1+bond.burn+0.12), wantPoi=atkNow*STATUS.poison.dot*1.15;
      ok(bs.st?.burn?.n===STATUS.burn.max+1&&Math.abs(bs.st.burn.v-wantBurn)<1e-6&&bs.st.burn.mine,`Phượng Hoàng: Thiêu đốt ${bs.st?.burn?.n} tầng (tối đa ${STATUS.burn.max}+1), mỗi tầng ${bs.st?.burn?.v.toFixed(2)}/giây (+12%)`);
      ok(Math.abs((bs.st?.poison?.v??0)-wantPoi)<1e-6,`Xà Hoàng 2 món: Trúng độc mỗi tầng ${bs.st?.poison?.v.toFixed(2)}/giây (+15%)`);
      // Viêm bạo: sát thương còn lại × 1,5 × 1,3 (đo theo thời gian còn lại ngay trước khi kích nổ).
      bs=await test(A,"bst"); A.dmgs=[]; const bb=bs.st.burn, bidB=bs.bid; await test(A,"boom");
      await waitFor(()=>A.dmgs.some(d=>d.bid===bidB&&d.c===STATUS.burn.col&&d.v>bb.v*bb.n),800);
      const boomD=A.dmgs.filter(d=>d.bid===bidB&&d.c===STATUS.burn.col).reduce((a,d)=>Math.max(a,d.v),0), boomW=bb.v*bb.n*bb.t*STATUS.burn.boom*1.3;
      ok(boomD>0&&Math.abs(boomD/boomW-1)<0.08,`Phượng Hoàng 4 món: Viêm bạo ${boomD} ≈ ${boomW.toFixed(0)} (×1,3)`);
      // Đổi 2 Phượng Hoàng lấy 2 Xà Hoàng (4 + 2 ngược lại): Trúng độc đủ 5 tầng thì như Dễ thương 10%; Thiêu đốt về 5 tầng tối đa.
      const sPH=[slotAt(PH[2].id),slotAt(PH[3].id)];
      await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      await coreOp("equipcore",{itemId:XH[2].id,vohonId:act,slot:sPH[0]}); await coreOp("equipcore",{itemId:XH[3].id,vohonId:act,slot:sPH[1]});
      s1=await test(A,"stats");
      ok(s1.sets.xa_hoang===4&&s1.sets.phuong_hoang===2&&same(s1.fx,{burn:0.12,poison:0.15,poisonVuln:0.1})&&eqOf(PH[2].id)===null,`đổi 2 món: Xà Hoàng 4 + Phượng Hoàng 2 ${JSON.stringify(s1.fx)}`);
      const bidP=await dummy(MAX_YEARS); await test(A,"status",{s:"burn",n:9}); await test(A,"status",{s:"poison",n:5});
      bs=await test(A,"bst"); A.dmgs=[];
      ok(bs.st?.burn?.n===STATUS.burn.max,`không còn Phượng Hoàng 4 món: Thiêu đốt tối đa ${bs.st?.burn?.n} tầng`);
      await waitFor(()=>A.dmgs.some(d=>d.bid===bidP&&d.c===STATUS.poison.col),1500);
      const pd=A.dmgs.find(d=>d.bid===bidP&&d.c===STATUS.poison.col), pw=bs.st.poison.v*bs.st.poison.n*1.1;
      ok(pd&&Math.abs(pd.v-pw)<=1,`Xà Hoàng 4 món: Trúng độc 5 tầng gây ${pd?.v} mỗi giây ≈ ${pw.toFixed(1)} (như Dễ thương +10%)`);
      // Linh Miêu 2 (+12% chí mạng) + Lam Ngân 2 (+20% thời gian khống chế) + Xà Hoàng 2 (ghép 2 + 2 + 2).
      await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const LM=await giveCores("linh_mieu",2), LN=await giveCores("lam_ngan",2);
      const sl=[...PH.slice(0,2),...XH.slice(0,2)].map(i=>slotAt(i.id));
      for(const [k,it] of [...LM,...LN].entries()) await coreOp("equipcore",{itemId:it.id,vohonId:act,slot:sl[k]});
      s1=await test(A,"stats");
      ok(s1.sets.linh_mieu===2&&s1.sets.lam_ngan===2&&s1.sets.xa_hoang===2&&same(s1.fx,{poison:0.15,crit:0.12,cc:0.2})&&!Object.keys(s1.sets).includes("phuong_hoang"),
        `ghép 2 + 2 + 2: ${JSON.stringify(s1.sets)}`);
      const resCrit1=(s1.res?.bonus?.crit??0)/100;
      ok(s1.cores.crit>=12&&Math.abs(s1.live.crit-(CRIT.chance+resCrit1+(s1.cores.crit+s1.bones.crit)/100))<1e-9&&Math.abs(s1.live.critMult-(CRIT.mult+(s1.cores.crit_dmg+s1.bones.crit_dmg)/100))<1e-9,
        `Linh Miêu 2 món: tỉ lệ chí mạng ${(s1.live.crit*100).toFixed(1)}% (gốc ${CRIT.chance*100}% + cộng minh ${(resCrit1*100).toFixed(1)}% + hồn hạch ${s1.cores.crit}%${s1.bones.crit?` + hồn cốt ${s1.bones.crit}%`:""}), hệ số ${s1.live.critMult.toFixed(2)}`);
      await dummy(500); await test(A,"status",{s:"root"}); bs=await test(A,"bst");
      const rootW=STATUS.root.secs*1.2;
      ok(bs.st?.root&&bs.st.root.t>rootW-0.25&&bs.st.root.t<=rootW+1e-9,`Lam Ngân 2 món: Trói ${bs.st?.root?.t.toFixed(2)} giây (thường ${STATUS.root.secs}, +20%)`);
      await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      for(const it of [...PH,...XH].filter(i=>itOf(i.id))) { if(eqOf(it.id)!==null) await coreOp("unequipcore",{itemId:it.id}); A.room.send("discard",{id:it.id}); }
      ok(await waitFor(()=>![...PH,...XH].some(i=>itOf(i.id)),3000),"dọn hồn hạch thử Phượng Hoàng / Xà Hoàng");
      // ---------- 5.3: nâng cấp hồn hạch bằng hồn hạch dư (+0..+15, điểm theo sao, cùng bộ thêm, mỗi 3 cấp 1 dòng phụ) ----------
      {
        const up=(targetId,materialIds)=>{ A.coreUp=null; return coreOp("enhancecore",{targetId,materialIds}); };
        const fx=(stars,set,tgt,xp)=>coreFeedXp({set,stars,xp},tgt);
        const tol=k=>CORE_STATS[k].pct?0.11:1.01, inRoll=(k,v,stars)=>v>=coreSubMax(k,stars)*CORE_SUB_ROLL[0]-tol(k)&&v<=coreSubMax(k,stars)*CORE_SUB_ROLL[1]+tol(k);
        const wornE=()=>coresOf(A).filter(i=>i.vohon===act).map(i=>({stars:i.stars,data:i.stats,enhance:i.enhance}));
        const liveOk=s=>s.live.maxHp===s.stats.maxHp&&s.live.maxMp===s.stats.maxMp&&Math.abs(s.live.atk-s.stats.atk)<1e-6&&Math.abs(s.live.crit-s.stats.crit)<1e-9&&Math.abs(s.live.critMult-s.stats.critMult)<1e-9;
        // Công thức (shared/data.ts, chờ chốt).
        ok(fx(1,"a","b")===CORE_FEED_STAR[0]&&fx(6,"a","b")===CORE_FEED_STAR[5]&&fx(4,"a","a")===Math.round(CORE_FEED_STAR[3]*CORE_FEED_SAME_SET)&&fx(2,"a","b",100)===CORE_FEED_STAR[1]+Math.floor(100*CORE_FEED_CARRY),
          `điểm nguyên liệu theo sao (${CORE_FEED_STAR.join(" / ")}), cùng bộ ×${CORE_FEED_SAME_SET}, nguyên liệu đã nâng cấp trả lại ${CORE_FEED_CARRY*100}%`);
        ok(Array.from({length:CORE_MAX_ENHANCE+1},(_,n)=>coreEnhanceLevel(coreEnhanceNeed(n))===n&&(n===0||coreEnhanceLevel(coreEnhanceNeed(n)-1)===n-1)).every(Boolean)&&coreEnhanceLevel(1e9)===CORE_MAX_ENHANCE,
          `bảng ngưỡng +1..+${CORE_MAX_ENHANCE} (+3 / +6 / +9 / +12 / +15 cần ${[3,6,9,12,15].map(coreEnhanceNeed).join(" / ")} điểm)`);
        ok(CORE_STAT_IDS.every(k=>Array.from({length:CORE_MAX_ENHANCE},(_,n)=>coreMainValue(k,6,n+1)>coreMainValue(k,6,n)).every(Boolean))&&coreMainValue("atk",6,15)===Math.round(30*(1+15*CORE_ENHANCE_MAIN)),
          `mỗi cấp tăng chỉ số chính (Công 6★: ${coreMainValue("atk",6)} → +15 ${coreMainValue("atk",6,15)})`);
        ok(coreName("hao_thien",4,6)==="+6 Hồn hạch Hạo Thiên 4★"&&coreName("hao_thien",4)==="Hồn hạch Hạo Thiên 4★",`tên có +N: ${coreName("hao_thien",4,6)}`);
        ok(coreSubRolls(0,15)===5&&coreSubRolls(2,3)===1&&coreSubRolls(3,5)===0&&coreSubRolls(5,12)===3,"mốc dòng phụ +3 / +6 / +9 / +12 / +15");
        { const d0={set:"hao_thien",main:"atk",subs:[["hp",50],["crit",2]]}, r=coreUpgradeSubs(d0,6,5,Math.random), ks=r.data.subs.map(x=>x[0]);
          ok(r.ups.length===5&&r.ups.filter(u=>u.add).length===2&&r.data.subs.length===CORE_MAX_SUBS&&new Set(ks).size===4&&!ks.includes("atk")&&same(d0.subs,[["hp",50],["crit",2]])
            &&r.ups.every(u=>inRoll(u.k,u.v,6))&&r.ups.filter(u=>!u.add).every(u=>ks.includes(u.k)),`coreUpgradeSubs: 2 dòng + 5 lần = 4 dòng (2 mới, 3 lần tăng dòng có sẵn) ${JSON.stringify(r.data.subs)}`); }
        { const pv=coreEnhancePreview({set:"a",xp:coreEnhanceNeed(14),subs:4},[{set:"a",stars:6}]);
          ok(pv.level===CORE_MAX_ENHANCE&&pv.xp===coreEnhanceNeed(CORE_MAX_ENHANCE)&&pv.waste>0&&pv.rolls===1&&pv.adds===0,`xem trước: kẹp ở +${CORE_MAX_ENHANCE}, dư ${pv.waste} điểm, đủ 4 dòng thì tăng dòng có sẵn`); }
        // Đích: Linh Miêu 4★ (2 dòng phụ) gắn vào ô của LM[0] trên võ hồn ra trận (vẫn đủ 2 món Linh Miêu), LM[0] về túi.
        await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
        const [T]=await giveCores("linh_mieu",1,4), lmSlot=slotAt(LM[0].id);
        await coreOp("equipcore",{itemId:T.id,vohonId:act,slot:lmSlot});
        ok(eqOf(T.id)===act&&slotAt(T.id)===lmSlot&&eqOf(LM[0].id)===null&&itOf(T.id).stats.subs.length===CORE_SUBS[3]&&itOf(T.id).enhance===0,
          `đích: ${coreName("linh_mieu",4)} (${CORE_SUBS[3]} dòng phụ) gắn ở ô ${lmSlot+1}, ${coreName("linh_mieu",6)} cũ về túi`);
        const main=itOf(T.id).stats.main, s0=await test(A,"stats");
        // Từ chối (không mất gì): chính nó, hồn hạch đang gắn, vật phẩm khác, hồn cốt làm đích, rỗng, không phải mảng, trùng, đích lạ, đang giao chiến.
        let r=await up(T.id,[T.id]); ok(/chính hồn hạch/.test(r),`chính nó làm nguyên liệu bị từ chối: ${r}`);
        r=await up(T.id,[LM[1].id]); ok(/đang gắn trên võ hồn/.test(r)&&eqOf(LM[1].id)===act,`hồn hạch đang gắn làm nguyên liệu bị từ chối: ${r}`);
        r=await up(T.id,[LM[0].id,LM[1].id]); ok(/đang gắn trên võ hồn/.test(r)&&itOf(LM[0].id),"lẫn một món đang gắn: cả lần bị từ chối, món hợp lệ còn nguyên");
        if(dan){ r=await up(T.id,[dan.id]); ok(/Nguyên liệu phải là hồn hạch/.test(r)&&itOf(dan.id),`vật phẩm không phải hồn hạch bị từ chối: ${r}`); }
        if(bone){ r=await up(bone.id,[LM[0].id]); ok(/Không có hồn hạch này/.test(r)&&itOf(LM[0].id),"hồn cốt không nâng cấp bằng tin của hồn hạch"); }
        r=await up(T.id,[]); ok(/ít nhất một/.test(r),"không chọn nguyên liệu bị từ chối");
        r=await up(T.id,LM[0].id); ok(/ít nhất một/.test(r),"materialIds không phải mảng bị từ chối");
        r=await up(T.id,[LM[0].id,LM[0].id]); ok(/trùng/.test(r),"nguyên liệu trùng bị từ chối");
        r=await up("khong-co",[LM[0].id]); ok(/Không có hồn hạch này/.test(r),"đích lạ bị từ chối");
        await test(A,"energy",{v:0}); // tính như vừa giao chiến
        r=await up(T.id,[LM[0].id]); ok(/Đang giao chiến: .* nâng cấp hồn hạch/.test(r)&&itOf(LM[0].id),`đang giao chiến: bị từ chối (${r})`);
        await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
        ok(itOf(T.id).enhance===0&&!itOf(T.id).stats.xp&&itOf(T.id).stats.subs.length===CORE_SUBS[3],"sau các lần bị từ chối: đích vẫn +0, không mất nguyên liệu");
        // +2: hai hồn hạch Tiên Cơ 3★ khác bộ.
        const M3=await giveCores("tien_co",3,3), g2=2*fx(3,"tien_co","linh_mieu");
        r=await up(T.id,[M3[0].id,M3[1].id]); let tw=itOf(T.id); const s1=await test(A,"stats");
        const dMain=s1.cores[main]-s0.cores[main], wMain=coreMainValue(main,4,2)-coreMainValue(main,4);
        ok(tw.stats.xp===g2&&tw.enhance===coreEnhanceLevel(g2)&&tw.enhance===2&&tw.stats.subs.length===CORE_SUBS[3]&&!itOf(M3[0].id)&&!itOf(M3[1].id)&&eqOf(T.id)===act&&slotAt(T.id)===lmSlot
          &&A.coreUp?.from===0&&A.coreUp?.to===2&&A.coreUp?.gain===g2&&A.coreUp?.subs.length===0,`2 hồn hạch 3★ khác bộ = ${g2} điểm: +${tw.enhance}, chưa tới mốc dòng phụ, 2 nguyên liệu đã mất (${r})`);
        ok(Math.abs(dMain-wMain)<0.11&&dMain>0&&liveOk(s1)&&same(s1.cores,coreBonus(wornE())),`đang gắn: ${CORE_STATS[main].name} chính +${dMain.toFixed(1)} ngay (≈ ${wMain.toFixed(1)}), chỉ số trong trận khớp`);
        // +3: thêm một 3★ (120 điểm) → thêm 1 dòng phụ mới.
        const subs2=tw.stats.subs; r=await up(T.id,[M3[2].id]); tw=itOf(T.id); const s2=await test(A,"stats");
        const nk=tw.stats.subs[2]?.[0], nv=tw.stats.subs[2]?.[1];
        ok(tw.enhance===3&&tw.stats.xp===3*fx(3,"tien_co","linh_mieu")&&tw.stats.subs.length===3&&same(tw.stats.subs.slice(0,2),subs2)&&nk!==main&&!subs2.some(x=>x[0]===nk)&&inRoll(nk,nv,4)
          &&A.coreUp?.subs.length===1&&A.coreUp.subs[0].add&&A.coreUp.subs[0].k===nk&&/thêm dòng phụ/.test(r),`+3: thêm dòng phụ ${nk&&coreStatText(nk,nv)} (${r})`);
        ok(Math.abs(s2.cores[nk]-s1.cores[nk]-nv)<0.11&&liveOk(s2)&&same(s2.cores,coreBonus(wornE())),`dòng phụ mới cộng ngay vào võ hồn đang gắn (${CORE_STATS[nk]?.name} +${(s2.cores[nk]-s1.cores[nk]).toFixed(1)})`);
        // Tới +15: năm hồn hạch Linh Miêu 6★ cùng bộ (+6 thêm dòng thứ 4, +9 / +12 / +15 tăng dòng có sẵn), điểm dư bị bỏ.
        // #281: +0 → +3 miễn phí; +3 → +15 cần phí của 12 cấp, thiếu thì từ chối cả lần.
        const coin0=A.bag.honTe, coin=async n=>{ await test(A,"coin",{n}); return waitFor(()=>A.bag.honTe===n,1500); };
        const M6=await giveCores("linh_mieu",5,6), before=new Map(tw.stats.subs.map(([k,v])=>[k,v])), fee15=enhanceFee(CORE_ENHANCE_FEE,3,CORE_MAX_ENHANCE);
        ok(A.coreUp?.fee===0,"#281: hồn hạch +0 → +2 → +3 miễn phí");
        await coin(fee15-1); r=await up(T.id,M6.map(i=>i.id));
        ok(/Không đủ Hồn Tệ/.test(r)&&r.includes(formatHonTe(fee15))&&M6.every(i=>itOf(i.id))&&itOf(T.id).enhance===3&&A.bag.honTe===fee15-1&&!A.coreUp,
          `thiếu Hồn Tệ (${formatHonTe(fee15-1)} < ${formatHonTe(fee15)}): từ chối, không mất nguyên liệu / cấp / tiền (${r})`);
        await coin(fee15+55);
        r=await up(T.id,M6.map(i=>i.id)); tw=itOf(T.id);
        ok(A.coreUp?.fee===fee15&&A.bag.honTe===55&&r.includes(`phí −${formatHonTe(fee15)}`),`+3 → +15: trừ đúng ${formatHonTe(fee15)}, còn ${formatHonTe(A.bag.honTe)}`);
        await coin(coin0); const s3=await test(A,"stats"), ups=A.coreUp?.subs??[];
        const growOk=tw.stats.subs.every(([k,v])=>Math.abs(v-(before.get(k)??0)-ups.filter(u=>u.k===k).reduce((a,u)=>a+u.v,0))<(CORE_STATS[k].pct?0.15:0.5)); // mỗi dòng: tăng đúng tổng các lần tung (dòng mới ở +6 có thể được tăng tiếp)
        ok(tw.enhance===CORE_MAX_ENHANCE&&tw.stats.xp===coreEnhanceNeed(CORE_MAX_ENHANCE)&&/dư .* điểm bị bỏ/.test(r)&&M6.every(i=>!itOf(i.id))&&tw.stats.subs.length===CORE_MAX_SUBS
          &&ups.length===4&&ups.filter(u=>u.add).length===1&&ups.every(u=>inRoll(u.k,u.v,4))&&growOk,
          `5 hồn hạch 6★ cùng bộ: +${tw.enhance} tối đa, ${tw.stats.subs.length} dòng phụ (1 dòng mới, 3 lần tăng: ${ups.filter(u=>!u.add).map(u=>coreStatText(u.k,u.to)).join(", ")})`);
        ok(liveOk(s3)&&same(s3.cores,coreBonus(wornE()))&&Math.abs(s3.cores[main]-s0.cores[main]-(coreMainValue(main,4,15)-coreMainValue(main,4)))<0.11,
          `+15 đang gắn: ${coreStatText(main,coreMainValue(main,4,15))} chính (+0: ${coreStatText(main,coreMainValue(main,4))}), chỉ số trong trận khớp`);
        const [M1]=await giveCores("tien_co",1,1); r=await up(T.id,[M1.id]); ok(/tối đa \+15/.test(r)&&itOf(M1.id),`+15 bị từ chối: ${r}`);
        // Hồn hạch trong túi: X (Tiên Cơ 2★) nâng bằng Y (cùng bộ), rồi X làm nguyên liệu cho LM[0] trả lại 80% điểm đã nạp.
        const [X,Y]=await giveCores("tien_co",2,2); r=await up(X.id,[Y.id]); const gx=fx(2,"tien_co","tien_co");
        ok(itOf(X.id)?.vohon===null&&itOf(X.id).stats.xp===gx&&itOf(X.id).enhance===coreEnhanceLevel(gx)&&!itOf(Y.id),`nâng cấp hồn hạch trong túi: +${itOf(X.id)?.enhance} (${gx} điểm)`);
        r=await up(LM[0].id,[X.id]); const gl=fx(2,"tien_co","linh_mieu",gx);
        ok(itOf(LM[0].id).stats.xp===gl&&itOf(LM[0].id).enhance===coreEnhanceLevel(gl)&&!itOf(X.id),`nguyên liệu +${coreEnhanceLevel(gx)}: ${fx(2,"tien_co","linh_mieu")} + ${Math.floor(gx*CORE_FEED_CARRY)} điểm trả lại = ${gl} (${r})`);
        for(const it of [LM[0],M1]) A.room.send("discard",{id:it.id});
        ok(await waitFor(()=>!itOf(LM[0].id)&&!itOf(M1.id),2000)&&eqOf(T.id)===act,`dọn hồn hạch thử 5.3, ${coreName("linh_mieu",4,15)} vẫn gắn (kiểm khi vào lại)`);
      }
      s1=await test(A,"stats");
      A.coreEq={vohon:act,slots:s1.slots,cores:s1.cores,fx:s1.fx}; // Linh Miêu 2 + Lam Ngân 2 vẫn gắn: kiểm khi vào lại
      ok(Object.keys(s1.slots).length===4&&same(s1.fx,{crit:0.12,cc:0.2}),`còn 4 hồn hạch gắn trên võ hồn ra trận (kiểm khi vào lại): ${JSON.stringify(s1.sets)}`);
      A.coreKeep=coresOf(A).map(i=>[i.id,i.stars,sj(i.stats),i.vohon]); // 5.1 + 5.2: vào lại phải còn nguyên (kiểm ở dưới)
    }
    A.boneKeep=bonesOf(A).map(i=>[i.id,i.years,i.stats?.beast,i.stats?.slot]); // vào lại phải còn nguyên (kiểm ở dưới)
  
}
