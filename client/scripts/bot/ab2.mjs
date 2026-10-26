// Khối ab2 của INLINE: 8.1a–8.1d, 8.3, 9.5, 9.6, 3.5, BĐ4 (nhóm 2) (#703 bước 5, tách nguyên văn từ bot-test.mjs; nhận ctx = các biến của luồng A / B / C).
import { ok, same, bot, waitFor, test, sendTeam, sleep, step, lastLog, enter, qtyOf, mapUrl } from "./lib.mjs";
import { HIGH_RINGS, ringSkill, CHAN_THAN_RING, chanThanOf, VOHON, skillChoices, loadoutOf, DEFAULT_LOADOUT, parseLoadout, skillPower, calcStats, vohonIndex, tierOfYears, TEAM_COMBAT_SECS, bondsOf, PCT_HP_CAP, chanThanStats, buffPower, PHAP_TUONG, TIERS, skillsOf, TIEN_CO_RIENG, phoenixFieldR, PHOENIX_FIELD_R, STATUS, PHONG_LOI, BUFFS, buffBit, EXTRA_VOHON, HE, AWAKEN_CHOICES, SKILLS, MAPS, KING_CHEST, kingShardPool, ARENA_SHARDS, itemDef, shardCode, SHARD_UNLOCK, starSkillMult, STAR_SKILL, MAX_STARS, starCdMult, STAR_CD_STARS, STAR_CD, starTienCoMult, STAR_TIEN_CO_STARS, STAR_TIEN_CO, starRing, STAR_SKILL_RINGS, starMult, TIEN_CO_MAX, CHAN_THAN_SKILL_COST, CHAN_THAN_SKILL_CD, CHAN_THAN_SKILL_SLOT, parseLevelRange, BEAST_SKILL_YEARS, beastSkillOf, teleHits, TELE_PAD, statusBit, BEASTS, beastStats, TELE_WARN, PLAYER_CHARM, TELE_FIRST, BOSSES, bossIndex, beastIndex, bossHpMult, teleZones, SPAWN_CLEAR, ELITE, beastBuffBit, ELITE_RAGE, BEAST_BUFFS, CORE_ITEM } from "../../../shared/data.ts";
import { readFileSync } from "node:fs";

// 8.1a: hồn kỹ vòng 5–10, chọn 4 ô mang theo, Võ Hồn Chân Thân (5 võ hồn mẫu)
export async function ab2Block1(ctx) {
  const { B, FIVE, beastOf, clearDir, dmgsOn, exp, hasBuff, hasSt, inSafeOf, leaveSafe, meOf, skillCast, spawnNear, vname } = ctx;


    // Hàm thuần: vòng 7 không phải hồn kỹ, 5 võ hồn mẫu có đủ vòng 5, 6, 8, 9, 10, võ hồn khác vòng 5+ không có hồn kỹ; kiểm dạng ô.
    ok(FIVE.every(id=>HIGH_RINGS.every(n=>ringSkill(id,n-1))&&!ringSkill(id,CHAN_THAN_RING-1)&&chanThanOf(id)&&ringSkill(id,9).ult),
      "5 võ hồn mẫu có hồn kỹ vòng 5, 6, 8, 9, 10 (vòng 10 là tuyệt kỹ) và Võ Hồn Chân Thân vòng 7");
    // Võ hồn chưa có dữ liệu vòng 5–10 (từ 8.1b Hỏa Long đã có; lấy võ hồn đầu tiên còn thiếu, trừ Xúc Xích dùng ở dưới). Khi 8.1c và
    // 8.1d đều xong thì không còn võ hồn nào thiếu: bỏ qua các bước dùng ND (luật "chỉ tăng chỉ số" vẫn giữ cho võ hồn thêm sau).
    const ND=VOHON.map(v=>v.id).find(id=>!chanThanOf(id)&&!ringSkill(id,4)&&id!=="xuc_xich"), ndName=ND?vname(ND):"";
    if(ND) ok(!ringSkill(ND,4)&&!chanThanOf(ND)&&same(skillChoices(ND,10),[0,1,2,3])&&same(skillChoices("hao_thien_chuy",10),[0,1,2,3,4,5,7,8,9]),
      `võ hồn chưa có dữ liệu (${ndName}): vòng 5–10 không có hồn kỹ (chỉ tăng chỉ số)`);
    else ok(VOHON.every(v=>chanThanOf(v.id)&&HIGH_RINGS.every(n=>ringSkill(v.id,n-1)))&&same(skillChoices("hao_thien_chuy",10),[0,1,2,3,4,5,7,8,9]),
      `cả ${VOHON.length} võ hồn đã có hồn kỹ vòng 5–10 và Chân Thân (không còn võ hồn chỉ tăng chỉ số)`);
    ok(same(loadoutOf("lam_ngan_thao",[]),[...DEFAULT_LOADOUT])&&same(loadoutOf("lam_ngan_thao",[4,9,-1,0]),[4,9,-1,0])&&(!ND||same(loadoutOf(ND,[4,1,2,3]),[...DEFAULT_LOADOUT]))
      &&!parseLoadout([0,0,1,2])&&!parseLoadout([0,1,2])&&!parseLoadout([0,1,2,10])&&same(parseLoadout([-1,-1,3,2]),[-1,-1,3,2]),
      "4 ô mang theo: mặc định vòng 1–4, ô trống -1, từ chối trùng / thiếu ô / vòng lạ");
    const K=await bot("Tester CT","hoa_long",{sex:1,hair:1,hairCol:4,outfitCol:2});
    await waitFor(()=>K.owned&&K.squad&&meOf(K)); const kp=meOf(K);
    for(const vohon of ["hao_thien_chuy","u_minh_linh_mieu","bich_lan_xa_hoang","cuu_bao_luu_ly_thap",ND].filter(Boolean)) await test(K,"grant",{vohon});
    const rowK=id=>K.owned.list.find(v=>v.vohon===id).rowId, vK=id=>K.owned.list.find(v=>v.vohon===id);
    ok(FIVE.every(id=>K.owned.list.some(v=>v.vohon===id))&&K.owned.list.every(v=>same(v.skills,[...DEFAULT_LOADOUT])),"K có 5 võ hồn mẫu + Hỏa Long, 4 ô mặc định vòng 1–4");
    const Y10=[423,764,1760,5000,12000,20000,50000,100000,100000,100000], P10=i=>skillPower(Y10[i]);
    // Từ 8.2 công của mọi võ hồn có cộng minh của tài khoản (K nhiều võ hồn cấp 100, nhiều hồn hoàn là đạt mốc): lấy % từ hook stats.
    let kres={}; const atkK=(id,n=10)=>calcStats(vohonIndex(id),n*10,Y10.slice(0,n).map(tierOfYears),1,{},{},kres).atk;
    for(const id of [...FIVE,ND].filter(Boolean)) await test(K,"set",{rowId:rowK(id),level:100,xp:0,rings:Y10});
    await test(K,"set",{rowId:rowK("u_minh_linh_mieu"),level:60,xp:0,rings:Y10.slice(0,6)});
    kres=(await test(K,"stats")).res?.bonus??{}; console.log(`  K cộng minh: ${JSON.stringify(kres)}`);
    async function lineupK(id){ await test(K,"clear"); await test(K,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(K,[rowK(id),0,0,0]);
      // Lấp đội bằng võ hồn mẫu không tạo ràng buộc (9.4: Lam Ngân Thảo + Hạo Thiên Chùy là Song Sinh Võ Hồn, đổi sát thương hồn kỹ).
      const fill=[]; for(const x of FIVE) if(x!==id&&fill.length<3&&!bondsOf([id,...fill,x]).length) fill.push(x);
      await sendTeam(K,[rowK(id),...fill.map(rowK)]); return K.owned.active===rowK(id)&&await waitFor(()=>kp.vh===vohonIndex(id)); }
    async function loadout(id,skills){ const n=K.ownedMsgs, l=K.logs.length; K.room.send("loadout",{rowId:rowK(id),skills}); await waitFor(()=>K.ownedMsgs>n&&K.logs.length>l,1500); await sleep(80); return K.logs.at(-1)??""; }
    const castK=(i,wait=200)=>skillCast(K,i,wait);
    async function chanThan(){ const l=K.logs.length; K.fxs=[]; K.dmgs=[]; K.room.send("chanthan"); await waitFor(()=>K.logs.length>l,1500); await sleep(80); return K.logs.at(-1)??""; }
    const stats=async()=>(await test(K,"stats")).live;
    // Hồn thú từ 1.000 năm có chiêu báo trước (3.5) có thể choáng K giữa chừng: Câm lặng cả vùng để chúng chỉ đứng chịu đòn.
    const hush=()=>test(K,"status",{s:"silence",secs:20,all:true});
    // Võ Hồn Chân Thân trong làng (vùng an toàn) bị chặn.
    ok(await lineupK("hao_thien_chuy"),"K: Hạo Thiên Chùy ra trận (cấp 100, 10 hồn hoàn)");
    ok(inSafeOf(K)&&/Vùng an toàn/.test(await chanThan())&&kp.ava===0,"trong làng: không biến Chân Thân");
    // Xếp ô: sai thì bị từ chối, server gửi lại ô đang lưu.
    ok(/phím riêng/.test(await loadout("hao_thien_chuy",[6,1,2,3]))&&same(vK("hao_thien_chuy").skills,[...DEFAULT_LOADOUT]),"xếp vòng 7 (Chân Thân) vào ô: từ chối");
    if(ND) ok(/chưa có hồn kỹ vòng 5/.test(await loadout(ND,[4,1,2,3])),`${ndName} (chưa có dữ liệu) xếp vòng 5: từ chối`);
    ok(/chưa có hồn hoàn thứ 8/.test(await loadout("u_minh_linh_mieu",[7,1,2,3]))&&same(vK("u_minh_linh_mieu").skills,[...DEFAULT_LOADOUT]),"U Minh Linh Miêu 6 hồn hoàn xếp vòng 8: từ chối");
    ok(/không hợp lệ/.test(await loadout("hao_thien_chuy",[4,4,2,3])),"ô trùng: từ chối");
    { const n=K.ownedMsgs, l=K.logs.length; K.room.send("loadout",{rowId:999999,skills:[4,1,2,3]}); await waitFor(()=>K.logs.length>l&&K.ownedMsgs>n,1500);
      ok(/không sở hữu/.test(K.logs.at(-1)??""),"võ hồn không phải của mình: từ chối"); }
    ok(await leaveSafe(K),"K: ra khỏi làng");
    let [kx,ky]=clearDir(kp.x,kp.y,110); const kat=d=>[Math.round(kx*d),Math.round(ky*d)];
    async function faceK(){ [kx,ky]=clearDir(kp.x,kp.y,110); await step(K,kx,ky); }
    await test(K,"hurt",{pct:10});
    ok(/Đang giao chiến/.test(await loadout("hao_thien_chuy",[4,5,9,0]))&&same(vK("hao_thien_chuy").skills,[...DEFAULT_LOADOUT]),"đang giao chiến: không xếp ô");
    await test(K,"rest",{s:TEAM_COMBAT_SECS+1});
    await loadout("hao_thien_chuy",[4,5,9,0]);
    ok(same(vK("hao_thien_chuy").skills,[4,5,9,0]),`Hạo Thiên Chùy mang: ${vK("hao_thien_chuy").skills.map(r=>ringSkill("hao_thien_chuy",r).name).join(", ")}`);
    // Hồn kỹ vòng 5 (ô U): quanh thân, sức mạnh theo hồn hoàn 12.000 năm, Phá giáp 2 tầng.
    {
      const id="hao_thien_chuy", atk=atkK(id), s5=ringSkill(id,4), s6=ringSkill(id,5), ult=ringSkill(id,9);
      await test(K,"clear"); await test(K,"ready"); const b5=await spawnNear(K,4,...kat(30),20); const hp5=beastOf(K,b5)?.maxHp??0;
      await test(K,"status",{s:"stun",secs:10}); await castK(0);
      let want=exp(atk*P10(4)*s5.dmg+Math.min(hp5*s5.pctHp,atk*P10(4)*PCT_HP_CAP));
      ok(want.includes(dmgsOn(K,b5)[0]?.v)&&await waitFor(()=>beastOf(K,b5)?.armor===2,800)&&K.fxs.some(f=>f.k==="soulring"&&f.i===4),
        `vòng 5 ${s5.name} (ô U): ${dmgsOn(K,b5)[0]?.v} (cần ${want.join(" hoặc ")}), Phá giáp ${beastOf(K,b5)?.armor} tầng, sáng vòng 5`);
      ok(Math.abs(kp.cds[0]-s5.cd)<0.5&&kp.cds[1]===0,`hồi chiêu theo ô: U ${kp.cds[0].toFixed(1)} giây (cần ${s5.cd}), I chưa hồi`);
      // Vòng 6 (ô I): nửa trước mặt, hất tung.
      await test(K,"clear"); await faceK(); const b6=await spawnNear(K,4,...kat(30),20); const hp6=beastOf(K,b6)?.maxHp??0; await hush(); await castK(1);
      want=exp(atk*P10(5)*s6.dmg+Math.min(hp6*s6.pctHp,atk*P10(5)*PCT_HP_CAP));
      ok(want.includes(dmgsOn(K,b6)[0]?.v)&&await waitFor(()=>hasSt(beastOf(K,b6),"stun"),800),`vòng 6 ${s6.name} (ô I): ${dmgsOn(K,b6)[0]?.v} (cần ${want.join(" hoặc ")}), hất tung [hướng ${kx},${ky}]`);
      // Tuyệt kỹ vòng 10 (ô O): 12 nhát, nhát cuối Choáng 2 giây; ai cũng thấy fx ult.
      await test(K,"clear"); const bu=await spawnNear(K,4,...kat(40),20); const hpu=beastOf(K,bu)?.maxHp??0; await hush(); const bf=B.fxs.length;
      await castK(2,0);
      ok(await waitFor(()=>dmgsOn(K,bu).length>=ult.n&&hasSt(beastOf(K,bu),"stun"),3000),`tuyệt kỹ ${ult.name}: ${dmgsOn(K,bu).length}/${ult.n} nhát, nhát cuối Choáng`);
      want=exp(atk*P10(9)*ult.dmg+Math.min(hpu*ult.pctHp,atk*P10(9)*PCT_HP_CAP));
      ok(want.includes(dmgsOn(K,bu)[0]?.v),`tuyệt kỹ nhát đầu ${dmgsOn(K,bu)[0]?.v} (cần ${want.join(" hoặc ")}: sức mạnh hồn hoàn 10 vạn năm ×${P10(9)})`);
      ok(K.fxs.some(f=>f.k==="ult"&&f.name===ult.name)&&(B.room.roomId!==K.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===K.room.sessionId),800)),"fx tuyệt kỹ: mình và người cùng phòng đều nhận");
      // Đổi chỗ ô ngoài giao chiến: hồi chiêu đi theo hồn kỹ, không làm mới.
      const cdU=kp.cds[2]; await test(K,"clear"); await test(K,"rest",{s:TEAM_COMBAT_SECS+1});
      await loadout(id,[9,5,4,0]);
      ok(same(vK(id).skills,[9,5,4,0])&&kp.cds[0]>=cdU-1&&kp.cds[0]>30,`chuyển tuyệt kỹ từ ô O sang ô U: hồi chiêu đi theo (${kp.cds[0].toFixed(1)} giây)`);
      ok(kp.cds[2]<=s5.cd+0.1,`ô O nhận ${s5.name}: hồi chiêu của chính nó ${kp.cds[2].toFixed(1)} giây (≤ ${s5.cd}), không giữ hồi chiêu tuyệt kỹ vừa rời ô`);
      K.fxs=[]; K.room.send("skill",{i:0}); await sleep(250); ok(!K.fxs.some(f=>f.k==="ult"),"ô U đang hồi chiêu: không tung lại tuyệt kỹ");
      // Bỏ tuyệt kỹ ra rồi xếp lại vào ô khác (ô đó hết hồi chiêu): vẫn giữ hồi chiêu còn lại của tuyệt kỹ.
      await loadout(id,[-1,5,4,0]); await loadout(id,[5,9,4,0]);
      ok(same(vK(id).skills,[5,9,4,0])&&kp.cds[1]>30,`bỏ tuyệt kỹ ra rồi xếp vào ô I: hồi chiêu còn ${kp.cds[1].toFixed(1)} giây`);
      ok(kp.cds[0]<=s6.cd+0.1,`ô U (vừa trống) nhận ${s6.name}: hồi chiêu ${kp.cds[0].toFixed(1)} giây (≤ ${s6.cd})`);
      await loadout(id,[9,5,4,0]);
      await test(K,"ready");
    }
    // Võ Hồn Chân Thân (phím R) của Hạo Thiên Chùy: chỉ số tăng theo hồn hoàn vòng 7, đúng thời gian, hồi chiêu riêng từng võ hồn.
    {
      const id="hao_thien_chuy", def=chanThanOf(id), cs=chanThanStats(def,Y10[6]), bp=buffPower(Y10[6]);
      await test(K,"clear"); await test(K,"ready"); const s0=await stats(); const hp0=kp.hp;
      const bc=await spawnNear(K,4,...kat(30),20); const hpc=beastOf(K,bc)?.maxHp??0; await hush(); const bf=B.fxs.length;
      const msg=await chanThan();
      ok(kp.ava>def.secs-1&&Math.abs(kp.avaCd-def.cd)<1&&msg.includes(def.name),`${def.name}: ${kp.ava.toFixed(1)} giây, hồi ${kp.avaCd.toFixed(0)} giây`);
      const s1=await stats();
      ok(Math.abs(cs.atk-def.stats.atk*bp)<1e-3&&Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.01&&Math.abs(s1.def-s0.def-cs.def)<1e-3,
        `chỉ số × buffPower(50.000 năm) ${bp}: công ${s0.atkNow.toFixed(1)} -> ${s1.atkNow.toFixed(1)} (+${Math.round(cs.atk*100)}%), giảm sát thương +${Math.round(cs.def*100)}%`);
      ok(s1.maxHp===Math.round(s0.maxHp*(1+cs.hp))&&kp.hp>=hp0+(s1.maxHp-s0.maxHp)-1,`sinh lực tối đa ${s0.maxHp} -> ${s1.maxHp}, hồi phần tăng thêm (${hp0} -> ${kp.hp})`);
      const want=exp(s1.atkNow*P10(6)*def.burst.dmg+Math.min(hpc*def.burst.pctHp,s1.atkNow*P10(6)*PCT_HP_CAP));
      ok(want.includes(dmgsOn(K,bc)[0]?.v)&&await waitFor(()=>hasSt(beastOf(K,bc),"stun"),800),`biến hình nện đất: ${dmgsOn(K,bc)[0]?.v} (cần ${want.join(" hoặc ")}, công đã tăng), Choáng`);
      ok(K.fxs.some(f=>f.k==="avatar"&&f.on)&&(B.room.roomId!==K.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="avatar"&&f.id===K.room.sessionId),800)
        &&await waitFor(()=>B.room.state.players.get(K.room.sessionId)?.ava>0,800)),"người cùng phòng thấy Chân Thân (fx avatar, PlayerState.ava)");
      { const av=K.fxs.find(f=>f.k==="avatar"&&f.on); ok(!!av&&typeof av.name==="string"&&/^#[0-9a-f]{6}$/i.test(av.col)&&!!PHAP_TUONG[id]&&PHAP_TUONG[id].sheet==="pt_"+id,
        `tin Chân Thân đủ tên + màu, võ hồn ${id} có pháp tướng ở PHAP_TUONG (${PHAP_TUONG[id]?.formula})`); }
      // Hồn kỹ khi đang Chân Thân dùng công đã tăng (ô I = vòng 6).
      await test(K,"clear"); await faceK(); const b2=await spawnNear(K,4,...kat(30),20); const h2=beastOf(K,b2)?.maxHp??0; await hush(); const s6=ringSkill(id,5);
      const s2=await stats(); await castK(1);
      const w2=exp(s2.atkNow*P10(5)*s6.dmg+Math.min(h2*s6.pctHp,s2.atkNow*P10(5)*PCT_HP_CAP));
      ok(kp.ava>0&&w2.includes(dmgsOn(K,b2)[0]?.v),`đang Chân Thân: ${s6.name} ${dmgsOn(K,b2)[0]?.v} (cần ${w2.join(" hoặc ")})`);
      ok(/còn \d+ giây/.test(await chanThan()),"bấm R khi đang Chân Thân: báo giây còn lại");
      const skip=Math.floor(kp.ava)-1; await test(K,"rest",{s:skip}); await sleep(200); // hook rest nhận số giây nguyên
      ok(kp.ava>0&&kp.ava<2.1,`trôi ${skip} giây: còn ${kp.ava.toFixed(2)} giây`);
      ok(await waitFor(()=>kp.ava===0,3000)&&await lastLog(K,/đã hết/),"hết giờ: tắt Chân Thân, báo");
      const s3=await stats();
      ok(Math.abs(s3.atkNow-s0.atkNow)<0.01&&s3.maxHp===s0.maxHp&&!s3.ava,`chỉ số về như cũ: công ${s3.atkNow.toFixed(1)}, sinh lực tối đa ${s3.maxHp}`);
      ok(kp.avaCd>def.cd-def.secs-3&&kp.avaCd<def.cd-def.secs+1,`còn hồi chiêu ${kp.avaCd.toFixed(1)} giây`);
      K.room.send("chanthan"); await sleep(300); ok(kp.ava===0,"đang hồi chiêu: không biến hình");
      await test(K,"rest",{s:def.cd}); ok(kp.avaCd===0,"nghỉ đủ: hết hồi chiêu");
      await test(K,"clear"); await chanThan(); ok(kp.ava>0,"biến hình lại");
      // Đổi võ hồn thì hết Chân Thân; hồi chiêu riêng từng võ hồn.
      await test(K,"rest",{s:TEAM_COMBAT_SECS+1}); await waitFor(()=>kp.swCd===0,3500);
      // Từ 9.4 đội lấp của Hạo Thiên Chùy không có Lam Ngân Thảo (Song Sinh Võ Hồn): đổi sang Bích Lân Xà Hoàng.
      const SW="bich_lan_xa_hoang";
      K.room.send("switch",{slot:K.owned.team.indexOf(rowK(SW))});
      ok(await waitFor(()=>K.owned.active===rowK(SW)&&kp.ava===0&&kp.avaCd===0,1500),`đổi sang ${VOHON[vohonIndex(SW)].name}: Chân Thân của Hạo Thiên hết, ${VOHON[vohonIndex(SW)].name} chưa hồi chiêu [ra trận ${K.owned.active===rowK(SW)}, ava ${kp.ava}, hồi ${kp.avaCd}]`);
      const s4=await stats(); ok(Math.abs(s4.atkNow-atkK(SW))<0.01,`${VOHON[vohonIndex(SW)].name} không mang chỉ số Chân Thân của Hạo Thiên: công ${s4.atkNow.toFixed(1)}`);
    }
    // Lam Ngân Thảo: vòng 5 lướt Trói, vòng 6 lãnh vực 6 nhát, tuyệt kỹ kéo cả vùng lại và giam; Chân Thân Lam Ngân Hoàng.
    {
      const id="lam_ngan_thao", atk=atkK(id), s5=ringSkill(id,4), s6=ringSkill(id,5), ult=ringSkill(id,9);
      ok(await lineupK(id),"K: Lam Ngân Thảo ra trận"); await test(K,"clear"); await test(K,"rest",{s:TEAM_COMBAT_SECS+1}); await loadout(id,[4,5,9,-1]);
      ok(same(vK(id).skills,[4,5,9,-1]),"Lam Ngân Thảo mang vòng 5, 6, 10, ô P trống");
      K.room.send("skill",{i:3}); ok(await lastLog(K,/chưa mang hồn kỹ/),"ô trống: báo chọn ở bảng đội hình");
      await test(K,"ready"); await faceK(); const b5=await spawnNear(K,4,...kat(50),20); await hush(); await castK(0);
      let want=exp(atk*P10(4)*s5.dmg);
      ok(want.includes(dmgsOn(K,b5)[0]?.v)&&await waitFor(()=>hasSt(beastOf(K,b5),"root"),800),`vòng 5 ${s5.name}: lướt ${dmgsOn(K,b5)[0]?.v} (cần ${want.join(" hoặc ")}), Trói [hướng ${kx},${ky}]`);
      await test(K,"clear"); const b6=await spawnNear(K,4,...kat(30),20); await test(K,"status",{s:"stun",secs:10}); await castK(1,0);
      ok(await waitFor(()=>dmgsOn(K,b6).length>=s6.n,s6.n*s6.every*1000+1500)&&await waitFor(()=>hasSt(beastOf(K,b6),"root"),800),`vòng 6 ${s6.name}: ${dmgsOn(K,b6).length}/${s6.n} nhát, nhát cuối Trói`);
      want=exp(atk*P10(5)*s6.dmg); ok(want.includes(dmgsOn(K,b6)[0]?.v),`lãnh vực nhát đầu ${dmgsOn(K,b6)[0]?.v} (cần ${want.join(" hoặc ")})`);
      // Vòng 5 vừa lướt đi: tính lại hướng thông thoáng từ chỗ đứng mới, không thì hồn thú cách 110 pixel có thể sinh sau vật cản, kéo không về.
      [kx,ky]=clearDir(kp.x,kp.y,130);
      await test(K,"clear"); const g1=await spawnNear(K,4,...kat(70),20), g2=await spawnNear(K,4,...kat(110),20); await test(K,"status",{s:"stun",secs:10,all:true});
      await castK(2,300);
      const dist=bid=>{ const q=beastOf(K,bid); return q?Math.hypot(q.x-kp.x,q.y-kp.y):-1; };
      want=exp(atk*P10(9)*ult.dmg);
      ok(await waitFor(()=>[g1,g2].every(g=>dist(g)>=0&&dist(g)<TIERS[4].size/2+16&&hasSt(beastOf(K,g),"root")&&beastOf(K,g).poison===3),800)&&want.includes(dmgsOn(K,g1)[0]?.v),
        `tuyệt kỹ ${ult.name}: ${dmgsOn(K,g1)[0]?.v} (cần ${want.join(" hoặc ")}), kéo 2 hồn thú về ${dist(g1).toFixed(0)} / ${dist(g2).toFixed(0)} pixel, Trói, Trúng độc 3 tầng`);
      // H8 (#491): pha nổ của tiếng T3 chọn theo id người tung, nên tin wave / burst của tuyệt kỹ phải mang id (trước đây server không gửi).
      ok(ult.area==="around"&&K.fxs.some(f=>f.k==="wave"&&f.id===K.room.sessionId),`${ult.name}: fx nổ (wave) mang id người tung (tiếng T3 pha boom)`);
      const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]); await test(K,"clear"); await test(K,"ready"); const s0=await stats();
      await chanThan(); const s1=await stats();
      ok(kp.ava>0&&Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.01&&Math.abs(s1.def-cs.def)<1e-3,`${def.name}: tốc độ ${s0.spd.toFixed(1)} -> ${s1.spd.toFixed(1)}, giảm sát thương ${Math.round(s1.def*100)}%`);
      await test(K,"rest",{s:def.secs});
      ok(await waitFor(()=>kp.ava===0,1500),"Lam Ngân Hoàng Chân Thân hết sau "+def.secs+" giây");
    }
    // U Minh Linh Miêu 6 hồn hoàn: vòng 5–6 dùng được, Chân Thân cần vòng 7. Võ hồn chưa có dữ liệu (ND): vòng 5+ chỉ tăng chỉ số.
    {
      ok(await lineupK("u_minh_linh_mieu"),"K: U Minh Linh Miêu ra trận (6 hồn hoàn)");
      await loadout("u_minh_linh_mieu",[4,5,0,1]); const id="u_minh_linh_mieu", s6=ringSkill(id,5);
      ok(same(vK(id).skills,[4,5,0,1]),"U Minh Linh Miêu mang vòng 5, 6, 1, 2");
      ok(/cần hồn hoàn thứ 7/.test(await chanThan())&&kp.ava===0,"6 hồn hoàn: chưa biến Chân Thân");
      await test(K,"ready"); const weak=await spawnNear(K,4,...kat(100),20); await test(K,"bhp",{pct:20}); const full=await spawnNear(K,4,...kat(30),20); await hush();
      await castK(1,600); ok(dmgsOn(K,weak).length>=1&&!dmgsOn(K,full).length,`vòng 6 ${s6.name}: khóa hồn thú yếu máu ở xa (${dmgsOn(K,weak).length} nhát), bỏ qua con gần đủ máu`);
      if(ND){
        ok(await lineupK(ND),`K: ${ndName} ra trận (10 hồn hoàn, chưa có dữ liệu vòng 5–10)`);
        ok(/chưa có Võ Hồn Chân Thân/.test(await chanThan()),`${ndName}: chưa có Chân Thân`);
        const s0=await stats(), base=calcStats(vohonIndex(ND),100,Y10.map(tierOfYears),1,{},{},kres);
        ok(s0.maxHp===base.maxHp&&Math.abs(s0.atk-base.atk)<0.01&&same(vK(ND).skills,[...DEFAULT_LOADOUT]),`${ndName} vòng 5–10 chỉ tăng chỉ số: sinh lực ${s0.maxHp}, công ${s0.atk.toFixed(1)}; ô mặc định vòng 1–4`);
        await test(K,"ready"); await faceK(); await spawnNear(K,4,...kat(30)); await castK(1);
        ok(K.dmgs.length>0&&K.fxs.some(f=>f.k==="soulring"&&f.i===1),`${ndName} ô I vẫn là ${skillsOf(ND)[1].name}`);
      }
    }
    // Cửu Bảo Lưu Ly Tháp: tuyệt kỹ thật Vô Địch Thần Quang (miễn sát thương cả đội), Chân Thân giảm tiêu hao.
    {
      const id="cuu_bao_luu_ly_thap", ult=ringSkill(id,9), def=chanThanOf(id);
      // Đã chốt 2026-10-20: tiên cơ riêng (bản nhỏ) đổi tên Lưu Ly Hộ Thể; vòng 4 Thiên Càn Bạch Ngọc Đỉnh đổi tên để không gần trùng.
      const TC="thien_can_bach_ngoc_dinh";
      ok(ult.name==="Vô Địch Thần Quang"&&TIEN_CO_RIENG[id].name==="Lưu Ly Hộ Thể"&&skillsOf(TC)[3].name==="Ngọc Đỉnh Hộ Thế",
        `tên: tuyệt kỹ ${ult.name}, tiên cơ ${TIEN_CO_RIENG[id].name}, vòng 4 ${VOHON[vohonIndex(TC)].name} ${skillsOf(TC)[3].name}`);
      ok(await lineupK(id),"K: Cửu Bảo Lưu Ly Tháp ra trận");
      await loadout(id,[9,7,8,4]); await test(K,"ready"); await test(K,"hurt",{pct:50});
      const hp0=kp.hp; await castK(0,300);
      ok(K.fxs.some(f=>f.k==="ult")&&hasBuff(kp,"inv")&&hasBuff(kp,"atk")&&kp.hp>hp0,`tuyệt kỹ ${ult.name}: miễn sát thương, tăng công, hồi sinh lực ${hp0} -> ${kp.hp}`);
      await test(K,"rest",{s:ult.self.secs}); ok(!hasBuff(kp,"inv"),`hết ${ult.self.secs} giây: hết miễn sát thương`);
      // Phục Chế của Xúc Xích không sao chép tuyệt kỹ: hồn kỹ gần nhất trước đó là của võ hồn ND (không có ND thì
      // của U Minh Linh Miêu), không còn trong đội, nên không có gì để chép.
      await test(K,"grant",{vohon:"xuc_xich"}); await test(K,"set",{rowId:rowK("xuc_xich"),level:40,xp:0,rings:Y10.slice(0,4)});
      await sendTeam(K,[rowK(id),rowK("xuc_xich"),0,0]); await waitFor(()=>kp.swCd===0,3500);
      K.room.send("switch",{slot:1}); ok(await waitFor(()=>K.owned.active===rowK("xuc_xich"),1500),"đổi sang Xúc Xích");
      await test(K,"ready"); const pc=skillsOf("xuc_xich")[3], lp=K.logs.length; K.fxs=[]; K.room.send("skill",{i:3});
      ok(await waitFor(()=>K.logs.length>lp,1500)&&/chưa có hồn kỹ/.test(K.logs.at(-1)??"")&&!K.fxs.some(f=>f.k==="soulring")&&!hasBuff(kp,"inv"),
        `${pc.name} không sao chép ${ult.name}: ${K.logs.at(-1)}`);
      await waitFor(()=>kp.swCd===0,3500); K.room.send("switch",{slot:0}); ok(await waitFor(()=>K.owned.active===rowK(id),1500),"đổi về Cửu Bảo Lưu Ly Tháp");
      // Chân Thân giảm tiêu hao: còn ít hồn lực hơn giá gốc của vòng 8 (60) nhưng đủ giá đã giảm thì vẫn tung được.
      const cs=chanThanStats(def,Y10[6]), s8=ringSkill(id,7), cost=s8.cost*(1-Math.min(0.9,cs.mp)); await test(K,"ready"); await chanThan(); const st=await stats();
      const pct=Math.ceil((cost+8)/st.maxMp*100); await test(K,"ready",{mp:pct}); const mp0=kp.mp; await castK(1,250);
      ok(kp.ava>0&&mp0<s8.cost&&K.fxs.some(f=>f.k==="soulring"&&f.i===7)&&!/Không đủ/.test(K.logs.at(-1)??""),
        `${def.name}: còn ${mp0} hồn lực vẫn tung ${s8.name} (giá ${s8.cost} giảm ${Math.round(cs.mp*100)}% còn ${cost.toFixed(1)}), giảm sát thương ${Math.round(st.def*100)}%`);
      await test(K,"rest",{s:def.secs});
    }
    // Ô đã chọn lưu DB: thoát rồi vào lại.
    {
      const want=Object.fromEntries(K.owned.list.map(v=>[v.vohon,v.skills]));
      await K.room.leave(); await sleep(500);
      await enter(K); await waitFor(()=>K.owned);
      const got=Object.fromEntries(K.owned.list.map(v=>[v.vohon,v.skills]));
      ok(same(got,want)&&same(got.hao_thien_chuy,[9,5,4,0])&&same(got.lam_ngan_thao,[4,5,9,-1]),`thoát vào lại: ô mang theo giữ nguyên (${Object.entries(got).map(([k,v])=>`${k} ${v.join("/")}`).join("; ")})`);
      ok(meOf(K)?.ava===0,"vào lại: không còn Chân Thân");
      await K.room.leave();
    }
  
}

// 8.1b: hồn kỹ vòng 5–10 và Võ Hồn Chân Thân lưu phái Thiêu đốt
export async function ab2Block2(ctx) {
  const { B, beastOf, clearDir, dmgsOn, exp, hasBuff, hasSt, leaveSafe, meOf, skillCast, spawnNear, vname } = ctx;


    const FIRE=["ta_hoa_phuong_hoang","hoa_long","hoa_anh","ky_nhung_thong_thien_cuc","nguyet_nhan"];
    ok(FIRE.every(id=>HIGH_RINGS.every(n=>ringSkill(id,n-1))&&!ringSkill(id,CHAN_THAN_RING-1)&&chanThanOf(id)?.burst&&ringSkill(id,9).ult&&/^Tuyệt kỹ:/.test(ringSkill(id,9).desc)),
      "5 võ hồn Thiêu đốt có hồn kỹ vòng 5, 6, 8, 9, 10 (vòng 10 là tuyệt kỹ) và Võ Hồn Chân Thân vòng 7");
    ok(phoenixFieldR("ta_hoa_phuong_hoang",false)===PHOENIX_FIELD_R&&phoenixFieldR("ta_hoa_phuong_hoang",true)===chanThanOf("ta_hoa_phuong_hoang").field
      &&chanThanOf("ta_hoa_phuong_hoang").field>PHOENIX_FIELD_R&&phoenixFieldR("hoa_long",true)===PHOENIX_FIELD_R,
      `lãnh vực phượng hoàng: bán kính ${PHOENIX_FIELD_R}, Tà Hỏa Phượng Hoàng Chân Thân ${chanThanOf("ta_hoa_phuong_hoang").field}`);
    const T=await bot("Tester TD","hoa_long",{sex:0,hair:2,hairCol:3,outfitCol:1});
    await waitFor(()=>T.owned&&T.squad&&meOf(T)); const tp=meOf(T);
    for(const vohon of FIRE.filter(x=>x!=="hoa_long")) await test(T,"grant",{vohon});
    const rowT=id=>T.owned.list.find(v=>v.vohon===id).rowId, vT=id=>T.owned.list.find(v=>v.vohon===id);
    const Y10=[423,764,1760,5000,12000,20000,50000,100000,100000,100000], P10=i=>skillPower(Y10[i]), bc=STATUS.burn.col;
    for(const id of FIRE) await test(T,"set",{rowId:rowT(id),level:100,xp:0,rings:Y10});
    const tres=(await test(T,"stats")).res?.bonus??{};
    const stats=async()=>(await test(T,"stats")).live;
    const hush=()=>test(T,"status",{s:"silence",secs:20,all:true});
    // Đội: võ hồn thử ra trận + 3 võ hồn Thiêu đốt khác (có ràng buộc Tà Hỏa – Hỏa Ảnh nếu đủ cặp, nên công lấy từ hook stats).
    async function lineupT(id){ await test(T,"clear"); await test(T,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(T,[rowT(id),0,0,0]);
      await sendTeam(T,[rowT(id),...FIRE.filter(x=>x!==id).slice(0,3).map(rowT)]); return T.owned.active===rowT(id)&&await waitFor(()=>tp.vh===vohonIndex(id)); }
    async function loadoutT(id,skills){ const n=T.ownedMsgs, l=T.logs.length; T.room.send("loadout",{rowId:rowT(id),skills}); await waitFor(()=>T.ownedMsgs>n&&T.logs.length>l,1500); await sleep(80); }
    const castT=(i,wait=250)=>skillCast(T,i,wait);
    async function chanThanT(){ const l=T.logs.length; T.fxs=[]; T.dmgs=[]; T.room.send("chanthan"); await waitFor(()=>T.logs.length>l,1500); await sleep(120); return T.logs.at(-1)??""; }
    const hitsT=bid=>dmgsOn(T,bid).filter(x=>x.c!==bc); // bỏ sát thương Thiêu đốt mỗi giây / kích nổ
    // Trạng thái của hồn kỹ có trên hồn thú (tầng Thiêu đốt / Phá giáp đếm từ đồng bộ, trạng thái khác theo bit).
    const stHas=(b,list)=>!!b&&(list??[]).every(a=>a.s==="burn"?b.burn>=Math.min(a.n??1,5):a.s==="armor"?b.armor>=(a.n??1):hasSt(b,a.s));
    const stTxt=list=>(list??[]).map(a=>`${STATUS[a.s].name}${a.n?` ${a.n} tầng`:""}`).join(", ");
    ok(await leaveSafe(T),"T: ra khỏi làng");
    let [tx,ty]=clearDir(tp.x,tp.y,150); const tat=d=>[Math.round(tx*d),Math.round(ty*d)];
    async function faceT(){ [tx,ty]=clearDir(tp.x,tp.y,150); await step(T,tx,ty); }
    /**
     * Hồn kỹ vòng `ring` (chỉ số) ở ô `i`: hồn thú bậc 4 cách `d` theo hướng nhìn, kiểm nhát đầu và trạng thái. `hold`: giữ hồn thú đứng yên
     * bằng Choáng (true) hoặc Trói ("root"; vẫn bị Choáng được), false = không giữ (để đẩy lùi); trạng thái dùng để giữ thì không kiểm.
     */
    async function ringT(id,ring,i,{d=30,hold=true,wait=450,mult=1}={}){
      const sk=ringSkill(id,ring), atk=(await stats()).atkNow;
      await test(T,"clear"); await faceT(); const bid=await spawnNear(T,4,...tat(d),20); await hush();
      const hs=hold===true?"stun":hold||""; if(hs) await test(T,"status",{s:hs,secs:10});
      await test(T,"ready"); await castT(i,wait);
      const n=sk.area==="around"&&sk.n>1?sk.n:1;
      const sts=[...(sk.status??[]),...(sk.finisher??[])].filter(a=>a.s!==hs);
      await waitFor(()=>hitsT(bid).length>=n&&stHas(beastOf(T,bid),sts),n>1?n*(sk.every??0.15)*1000+1500:1500);
      const want=exp(atk*P10(ring)*sk.dmg*mult), got=hitsT(bid).map(x=>x.v), b=beastOf(T,bid);
      ok(want.includes(got[0])&&T.fxs.some(f=>f.k==="soulring"&&f.i===ring),`${vname(id)} vòng ${ring+1} ${sk.name}: ${got.length} nhát, nhát đầu ${got[0]} (cần ${want.join(" hoặc ")})`);
      if(sts.length) ok(stHas(b,sts),`${sk.name}: ${stTxt(sts)} [Thiêu đốt ${b?.burn}, Phá giáp ${b?.armor}]`);
      return bid;
    }
    /** Chân Thân: chỉ số theo hồn hoàn vòng 7, đòn biến hình đúng công đã tăng (hồn thú cách `d`). */
    async function chanT(id,{d=30}={}){
      const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]);
      await test(T,"clear"); await test(T,"ready"); await faceT(); const s0=await stats();
      const bid=await spawnNear(T,4,...tat(d),20); await hush(); await test(T,"status",{s:"stun",secs:10});
      const msg=await chanThanT(), s1=await stats();
      ok(tp.ava>def.secs-1&&msg.includes(def.name)&&T.fxs.some(f=>f.k==="avatar"&&f.on),`${def.name}: ${tp.ava.toFixed(1)} giây`);
      const okStat=(!cs.atk||Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.02)&&(!cs.spd||Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.02)
        &&(!cs.def||Math.abs(s1.def-s0.def-cs.def)<1e-3)&&(!cs.crit||Math.abs(s1.critB-s0.critB-cs.crit)<1e-3)&&(!cs.hp||s1.maxHp===Math.round(s0.maxHp*(1+cs.hp)));
      ok(okStat,`${def.name} × buffPower(50.000 năm): ${Object.entries(cs).map(([k,v])=>`${k} +${Math.round(v*100)}%`).join(", ")} [công ${s0.atkNow.toFixed(1)} -> ${s1.atkNow.toFixed(1)}, tốc ${s0.spd.toFixed(1)} -> ${s1.spd.toFixed(1)}]`);
      const bst=def.burst, want=exp(s1.atkNow*P10(6)*bst.dmg), got=hitsT(bid)[0]?.v;
      await waitFor(()=>stHas(beastOf(T,bid),(bst.status??[]).filter(a=>a.s!=="stun")),1000);
      ok(want.includes(got)&&stHas(beastOf(T,bid),(bst.status??[]).filter(a=>a.s!=="stun")),`biến hình: ${got} (cần ${want.join(" hoặc ")}), ${stTxt(bst.status)||"không trạng thái"}`);
      return {def,cs,bid,s0,s1};
    }
    const endT=async()=>{ await test(T,"clear"); await test(T,"rest",{s:30}); await waitFor(()=>tp.ava===0&&!hasBuff(tp,"phoenix"),1500); };

    // Tà Hỏa Phượng Hoàng: vòng 5 mũi quạt, vòng 6 bay lướt; tuyệt kỹ đốt đủ 5 tầng cả vùng; Chân Thân lãnh vực mạnh và rộng hơn.
    {
      const id="ta_hoa_phuong_hoang", ult=ringSkill(id,9);
      ok(await lineupT(id),`T: ${vname(id)} ra trận (cấp 100, 10 hồn hoàn)`);
      await loadoutT(id,[4,5,9,-1]); ok(same(vT(id).skills,[4,5,9,-1]),"Tà Hỏa Phượng Hoàng mang vòng 5, 6, 10");
      await ringT(id,4,0);
      const x0=tp.x, y0=tp.y; await ringT(id,5,1,{d:50});
      ok(Math.hypot(tp.x-x0,tp.y-y0)>=60&&T.fxs.some(f=>f.k==="fly"),`${ringSkill(id,5).name}: bay ${Math.hypot(tp.x-x0,tp.y-y0).toFixed(0)} pixel (fx fly)`);
      await test(T,"clear"); await faceT(); const atk=(await stats()).atkNow;
      const u1=await spawnNear(T,4,...tat(40),20), u2=await spawnNear(T,4,...tat(140),20); await hush(); await test(T,"status",{s:"stun",secs:10,all:true});
      const bf=B.fxs.length; await test(T,"ready"); await castT(2,400);
      ok(await waitFor(()=>[u1,u2].every(u=>beastOf(T,u)?.burn===5),800)&&exp(atk*P10(9)*ult.dmg).includes(hitsT(u1)[0]?.v)&&hasBuff(tp,"phoenix"),
        `tuyệt kỹ ${ult.name}: ${hitsT(u1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), Thiêu đốt 5 tầng cả hồn thú cách 140, mở lãnh vực`);
      ok(T.fxs.some(f=>f.k==="ult"&&f.name===ult.name)&&(B.room.roomId!==T.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===T.room.sessionId),800)),"fx tuyệt kỹ: người cùng phòng cũng thấy");
      await endT();
      // Chân Thân: lãnh vực phượng hoàng (buff 15 giây) bán kính `field` khi đang Chân Thân, đổi võ hồn thì về PHOENIX_FIELD_R.
      const {def}=await chanT(id), amp=def.burst.self.buff.phoenix*buffPower(Y10[6]), R=def.field;
      ok(await waitFor(()=>hasBuff(tp,"phoenix"),500),`${def.name}: mở lãnh vực phượng hoàng +${Math.round(amp*100)}%`);
      await test(T,"clear"); const mid=Math.round((PHOENIX_FIELD_R+R)/2), s1=await stats();
      const fb=await spawnNear(T,4,...tat(mid),20); await hush(); await test(T,"status",{s:"stun",secs:10}); await test(T,"ready"); await castT(0,900);
      let want=exp(s1.atkNow*P10(4)*ringSkill(id,4).dmg*(1+amp));
      ok(want.includes(hitsT(fb)[0]?.v),`đang Chân Thân, hồn thú cách ${mid} (> ${PHOENIX_FIELD_R}, < ${R}): ${hitsT(fb)[0]?.v} (cần ${want.join(" hoặc ")}, +${Math.round(amp*100)}%)`);
      await waitFor(()=>tp.swCd===0,3500); T.room.send("switch",{slot:T.owned.team.indexOf(rowT("hoa_long"))});
      ok(await waitFor(()=>T.owned.active===rowT("hoa_long")&&tp.ava===0,1500)&&hasBuff(tp,"phoenix"),"đổi sang Hỏa Long: hết Chân Thân, lãnh vực (thuộc hồn sư) vẫn còn");
      const hl=ringSkill("hoa_long",1), ah=(await stats()).atkNow; await test(T,"ready"); await castT(1,350);
      want=exp(ah*skillPower(Y10[1])*hl.dmg);
      ok(want.includes(hitsT(fb)[0]?.v),`hết Chân Thân: hồn thú cách ${mid} ngoài lãnh vực, ${hl.name} ${hitsT(fb)[0]?.v} (cần ${want.join(" hoặc ")})`);
      await endT();
    }
    // Hỏa Long: vòng 5 mũi quạt tầm xa, vòng 6 3 đạn không trượt; tuyệt kỹ Viêm bạo toàn vùng; Chân Thân Viêm bạo.
    {
      const id="hoa_long", ult=ringSkill(id,9);
      ok(await lineupT(id),`T: ${vname(id)} ra trận`); await loadoutT(id,[4,5,9,-1]);
      await ringT(id,4,0); const b6=await ringT(id,5,1,{d:120,wait:900});
      ok(hitsT(b6).length>=ringSkill(id,5).n,`${ringSkill(id,5).name}: ${hitsT(b6).length}/${ringSkill(id,5).n} đạn trúng hồn thú cách 120`);
      // Tuyệt kỹ: hồn thú cách 150 (ngoài Viêm Bạo vòng 4 bán kính 110) có sẵn 2 tầng; 2 đợt đầu chồng lên 5 tầng, đợt cuối kích nổ × (1 + mult).
      await test(T,"clear"); await faceT(); const atk=(await stats()).atkNow;
      const fb=await spawnNear(T,4,...tat(150),20); await hush(); await test(T,"status",{s:"stun",secs:10}); await test(T,"status",{s:"burn",n:2});
      // Các đợt chạy theo nhịp server (later, dt kẹp 100 ms): server bận thì đợt 2 tới muộn hơn 0,5 giây thật. Chờ theo state; 5 tầng
      // giữ tới đợt cuối (thêm 0,5 giây nhịp server) nên poll 50 ms không lỡ.
      await test(T,"ready"); await castT(2,0);
      ok(await waitFor(()=>beastOf(T,fb)?.burn===5,2500),`tuyệt kỹ ${ult.name}: 2 đợt đầu chồng Thiêu đốt ${beastOf(T,fb)?.burn} tầng (hồn thú cách 150)`);
      // Đọc Thiêu đốt trước đợt cuối; mỗi giây Thiêu đốt chỉ gây v × n, kích nổ gây v × n × giây còn lại × 1,5 × (1 + mult).
      const bs=(await test(T,"bst")).st?.burn, big=x=>x.c===bc&&bs&&x.v>bs.v*bs.n*2;
      await waitFor(()=>dmgsOn(T,fb).some(big),1500); await sleep(150);
      const boom=Math.max(0,...dmgsOn(T,fb).filter(big).map(x=>x.v));
      const wantB=bs?bs.v*bs.n*Math.max(0.5,bs.t-0.3)*STATUS.burn.boom*(1+ult.boom.mult):0;
      ok(bs&&boom>0&&Math.abs(boom/wantB-1)<0.15&&beastOf(T,fb)?.burn===ult.status[0].n,
        `đợt cuối Viêm bạo toàn vùng: kích nổ ${boom} ≈ ${wantB.toFixed(0)} (× ${1+ult.boom.mult}), còn ${beastOf(T,fb)?.burn} tầng [bst ${JSON.stringify(bs)}]`);
      ok(exp(atk*P10(9)*ult.dmg).includes(hitsT(fb)[0]?.v)&&hitsT(fb).length>=ult.n,`tuyệt kỹ: ${hitsT(fb).length}/${ult.n} đợt, đợt đầu ${hitsT(fb)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")})`);
      await endT();
      // Chân Thân: đòn biến hình là Viêm bạo (kích nổ 4 tầng có sẵn rồi đặt lại 1 tầng).
      const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]);
      await test(T,"clear"); await test(T,"ready"); await faceT(); const s0=await stats();
      const cb=await spawnNear(T,4,...tat(30),20); await hush(); await test(T,"status",{s:"stun",secs:10}); await test(T,"status",{s:"burn",n:4});
      await chanThanT(); const s1=await stats();
      ok(tp.ava>0&&Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.02&&Math.abs(s1.critB-s0.critB-cs.crit)<1e-3,`${def.name}: công +${Math.round(cs.atk*100)}%, chí mạng +${Math.round(cs.crit*100)}%`);
      ok(await waitFor(()=>dmgsOn(T,cb).some(x=>x.c===bc&&x.v>s0.atkNow)&&beastOf(T,cb)?.burn===def.burst.boom.keep,800),`biến hình Viêm bạo: kích nổ ${Math.max(0,...dmgsOn(T,cb).filter(x=>x.c===bc).map(x=>x.v))}, còn ${beastOf(T,cb)?.burn} tầng`);
      await endT();
    }
    // Hỏa Ảnh: vòng 5 chưởng đẩy lùi + Dễ thương, vòng 6 lồng lửa nhát cuối Choáng; tuyệt kỹ Choáng cả vùng; Chân Thân giảm sát thương.
    {
      const id="hoa_anh", ult=ringSkill(id,9);
      ok(await lineupT(id),`T: ${vname(id)} ra trận`); await loadoutT(id,[4,5,9,-1]);
      await ringT(id,4,0,{hold:false});
      await ringT(id,5,1,{d:60,hold:"root",wait:0});
      await test(T,"clear"); await faceT(); const atk=(await stats()).atkNow;
      const u1=await spawnNear(T,4,...tat(40),20), u2=await spawnNear(T,4,...tat(140),20); await hush(); await test(T,"ready"); await castT(2,400);
      ok(await waitFor(()=>[u1,u2].every(u=>stHas(beastOf(T,u),ult.status)),800)&&exp(atk*P10(9)*ult.dmg).includes(hitsT(u1)[0]?.v)&&T.fxs.some(f=>f.k==="ult"),
        `tuyệt kỹ ${ult.name}: ${hitsT(u1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), ${stTxt(ult.status)} cả hồn thú cách 140`);
      await endT(); await chanT(id); await endT();
    }
    // Kỳ Nhung Thông Thiên Cúc: vòng 5 cánh hoa quạt, vòng 6 Trói + Phá giáp; tuyệt kỹ 12 nhát, nhát cuối Trói; Chân Thân bão cánh hoa.
    {
      const id="ky_nhung_thong_thien_cuc", ult=ringSkill(id,9);
      ok(await lineupT(id),`T: ${vname(id)} ra trận`); await loadoutT(id,[4,5,9,-1]);
      await ringT(id,4,0); await ringT(id,5,1);
      ok(ringSkill(id,4).cd<ringSkill("ta_hoa_phuong_hoang",4).cd&&ringSkill(id,7).cd<ringSkill("ta_hoa_phuong_hoang",7).cd,"Kỳ Nhung hồi chiêu ngắn hơn võ hồn bùng nổ (lấp khoảng)");
      await test(T,"clear"); await faceT(); const atk=(await stats()).atkNow;
      const u=await spawnNear(T,4,...tat(60),40); await hush(); await test(T,"status",{s:"stun",secs:10}); await test(T,"ready"); await castT(2,0);
      ok(await waitFor(()=>hitsT(u).length>=ult.n&&hasSt(beastOf(T,u),"root"),ult.n*ult.every*1000+1500)&&beastOf(T,u)?.burn===5&&exp(atk*P10(9)*ult.dmg).includes(hitsT(u)[0]?.v),
        `tuyệt kỹ ${ult.name}: ${hitsT(u).length}/${ult.n} nhát, nhát đầu ${hitsT(u)[0]?.v}, Thiêu đốt ${beastOf(T,u)?.burn} tầng, Phá giáp ${beastOf(T,u)?.armor}, nhát cuối Trói`);
      await endT(); await chanT(id); await endT();
    }
    // Nguyệt Nhận: vòng 5 lướt xuyên, vòng 6 khóa hồn thú yếu máu; tuyệt kỹ 8 nhát vào hồn thú yếu máu nhất cả vùng; Chân Thân.
    {
      const id="nguyet_nhan", ult=ringSkill(id,9);
      ok(await lineupT(id),`T: ${vname(id)} ra trận`); await loadoutT(id,[4,5,9,-1]);
      await ringT(id,4,0,{d:50});
      await test(T,"clear"); await faceT(); await test(T,"ready");
      const weak=await spawnNear(T,4,...tat(140),20); await test(T,"bhp",{pct:20}); const full=await spawnNear(T,4,...tat(30),20); await hush();
      await castT(1,700); const s6=ringSkill(id,5);
      ok(hitsT(weak).length>=1&&!hitsT(full).length,`vòng 6 ${s6.name}: khóa hồn thú yếu máu cách 140 (${hitsT(weak).length} nhát), bỏ qua con đủ máu cách 30`);
      await test(T,"clear"); await faceT(); await test(T,"ready");
      const w2=await spawnNear(T,4,...tat(150),200); await test(T,"bhp",{pct:30}); const f2=await spawnNear(T,4,...tat(30),20); await hush();
      await castT(2,0);
      ok(await waitFor(()=>hitsT(w2).length>=ult.n,ult.n*ult.every*1000+1500)&&!hitsT(f2).length&&T.fxs.some(f=>f.k==="ult"),
        `tuyệt kỹ ${ult.name}: ${hitsT(w2).length}/${ult.n} nhát vào hồn thú yếu máu cách 150, không đánh con đủ máu`);
      await endT(); await chanT(id); await endT();
    }
    // Ô đã chọn lưu DB: thoát rồi vào lại.
    {
      const want=Object.fromEntries(T.owned.list.map(v=>[v.vohon,v.skills]));
      await T.room.leave(); await sleep(500); await enter(T); await waitFor(()=>T.owned);
      const got=Object.fromEntries(T.owned.list.map(v=>[v.vohon,v.skills]));
      ok(same(got,want)&&FIRE.every(id=>same(got[id],[4,5,9,-1])),"thoát vào lại: 5 võ hồn Thiêu đốt vẫn mang vòng 5, 6, 10");
      await T.room.leave();
    }
  
}

// 8.1c: hồn kỹ vòng 5–10 và Võ Hồn Chân Thân lưu phái Cảm điện
export async function ab2Block3(ctx) {
  const { VILLAGE_RY, beastOf, clearDir, dmgsOn, exp, hasBuff, hasSt, inSafeOf, leaveSafe, meOf, safe, skillCast, spawnNear, vname } = ctx;


    const LD="lam_dien_ba_vuong_long", KV="kim_vu_mieu_ung", CK="can_khon_hon_nguyen_toa", YH="yeu_ho", XX="xuc_xich", SHOCK=[LD,KV,CK,YH,XX];
    ok(SHOCK.every(id=>HIGH_RINGS.every(n=>ringSkill(id,n-1))&&!ringSkill(id,CHAN_THAN_RING-1)&&chanThanOf(id)?.burst&&ringSkill(id,9).ult&&/^Tuyệt kỹ:/.test(ringSkill(id,9).desc)),
      "5 võ hồn Cảm điện có hồn kỹ vòng 5, 6, 8, 9, 10 (vòng 10 là tuyệt kỹ) và Võ Hồn Chân Thân vòng 7");
    ok(ringSkill(LD,9).shockR>ringSkill(LD,9).r&&chanThanOf(LD).lei>1&&ringSkill(XX,8).copy===1&&!ringSkill(XX,9).copy,
      `tuyệt kỹ Lam Điện sét tìm Cảm điện tới ${ringSkill(LD,9).shockR} (vùng ${ringSkill(LD,9).r}); Chân Thân Lam Điện Phong Lôi ×${chanThanOf(LD).lei}; Xúc Xích vòng 9 Phục Chế không giảm`);
    const Q=await bot("Tester CD",LD,{sex:1,hair:3,hairCol:2,outfitCol:3});
    await waitFor(()=>Q.owned&&Q.squad&&meOf(Q)); const qp=meOf(Q);
    for(const vohon of SHOCK.filter(x=>x!==LD)) await test(Q,"grant",{vohon});
    const rowQ=id=>Q.owned.list.find(v=>v.vohon===id).rowId, vQ=id=>Q.owned.list.find(v=>v.vohon===id);
    const Y10=[423,764,1760,5000,12000,20000,50000,100000,100000,100000], P10=i=>skillPower(Y10[i]), sc=STATUS.shock.col;
    for(const id of SHOCK) await test(Q,"set",{rowId:rowQ(id),level:100,xp:0,rings:Y10});
    const stats=async()=>(await test(Q,"stats")).live;
    async function lineupQ(id,rest=SHOCK.filter(x=>x!==id).slice(0,3)){ await test(Q,"clear"); await test(Q,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(Q,[rowQ(id),0,0,0]);
      await sendTeam(Q,[rowQ(id),...rest.map(rowQ)]); return Q.owned.active===rowQ(id)&&await waitFor(()=>qp.vh===vohonIndex(id)); }
    async function loadoutQ(id,skills){ const n=Q.ownedMsgs, l=Q.logs.length; Q.room.send("loadout",{rowId:rowQ(id),skills}); await waitFor(()=>Q.ownedMsgs>n&&Q.logs.length>l,1500); await sleep(80); return same(vQ(id).skills,skills); }
    const castQ=(i,wait=250)=>skillCast(Q,i,wait);
    async function chanThanQ(){ const l=Q.logs.length; Q.fxs=[]; Q.dmgs=[]; Q.room.send("chanthan"); await waitFor(()=>Q.logs.length>l,1500); await sleep(120); return Q.logs.at(-1)??""; }
    const hitsQ=bid=>dmgsOn(Q,bid).filter(x=>x.c!==sc); // bỏ sát thương lan Cảm điện
    const hush=()=>test(Q,"status",{s:"silence",secs:20,all:true}), hold=(s="stun")=>test(Q,"status",{s,secs:10,all:true});
    // Trạng thái trên hồn thú: Mị hoặc / Phong ấn đếm tầng; đủ 3 tầng thì đã bùng phát (Mê hoặc / Dễ thương) nên tầng có thể về 0.
    const stHas=(b,list)=>!!b&&(list??[]).every(a=>a.s==="lock"?b.lock>=(a.n??1)||hasSt(b,"vuln"):a.s==="allure"?b.allure>=(a.n??1)||hasSt(b,"charm"):hasSt(b,a.s));
    const stTxt=list=>(list??[]).map(a=>`${STATUS[a.s].name}${a.n?` ${a.n} tầng`:""}`).join(", ");
    ok(await leaveSafe(Q),"Q: ra khỏi làng");
    let [qx,qy]=clearDir(qp.x,qp.y,210); const qat=d=>[Math.round(qx*d),Math.round(qy*d)];
    async function faceQ(len=210){ [qx,qy]=clearDir(qp.x,qp.y,len); await step(Q,qx,qy); }
    /**
     * Hồn kỹ vòng `ring` ở ô `i`: hồn thú bậc 4 cách `d`, giữ bằng `hs` (Choáng / Trói, không kiểm), `pre`: trạng thái gây trước (để thử
     * thêm sát thương theo tầng); kiểm nhát đầu (dmg + perStack nếu có sẵn trạng thái) và trạng thái của hồn kỹ.
     */
    async function ringQ(id,ring,i,{d=30,hs="stun",pre=[],wait=450,n}={}){
      const sk=ringSkill(id,ring), atk=(await stats()).atkNow;
      await test(Q,"clear"); await faceQ(); const bid=await spawnNear(Q,4,...qat(d),20); await hush();
      if(hs) await test(Q,"status",{s:hs,secs:10}); for(const s of pre) await test(Q,"status",{s,secs:10});
      await test(Q,"ready"); await castQ(i,wait);
      const hits=n??(sk.n>1&&sk.area!=="proj"?sk.n:1), sts=[...(sk.status??[]),...(sk.finisher??[])].filter(a=>a.s!==hs);
      await waitFor(()=>hitsQ(bid).length>=hits&&stHas(beastOf(Q,bid),sts),hits>1?hits*(sk.every??0.15)*1000+1500:1500);
      // Dễ thương có sẵn: mọi sát thương lên hồn thú thêm STATUS.vuln.amp (damageBeast).
      const m=sk.dmg+(sk.perStack&&pre.includes(sk.perStack.s)?sk.perStack.dmg:0), amp=pre.includes("vuln")?1+STATUS.vuln.amp:1;
      const want=exp(atk*P10(ring)*m*amp), got=hitsQ(bid).map(x=>x.v), b=beastOf(Q,bid);
      ok(want.includes(got[0])&&got.length>=hits&&Q.fxs.some(f=>f.k==="soulring"&&f.i===ring),
        `${vname(id)} vòng ${ring+1} ${sk.name}: ${got.length}/${hits} nhát, nhát đầu ${got[0]} (cần ${want.join(" hoặc ")}${m!==sk.dmg?`, có sẵn ${STATUS[sk.perStack.s].name}`:""})`);
      if(sts.length) ok(stHas(b,sts),`${sk.name}: ${stTxt(sts)} [Mị hoặc ${b?.allure}, Phong ấn ${b?.lock}]`);
      return bid;
    }
    /** Chân Thân: chỉ số × buffPower vòng 7, đòn biến hình theo công đã tăng (hồn thú cách `d`, `pre`: trạng thái có sẵn). */
    async function chanQ(id,{d=30,pre=[]}={}){
      const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]), bst=def.burst;
      await test(Q,"clear"); await test(Q,"ready"); await faceQ(); const s0=await stats();
      const bid=await spawnNear(Q,4,...qat(d),20); await hush(); await test(Q,"status",{s:"stun",secs:10}); for(const s of pre) await test(Q,"status",{s,secs:10});
      const msg=await chanThanQ(), s1=await stats();
      ok(qp.ava>def.secs-1&&msg.includes(def.name)&&Q.fxs.some(f=>f.k==="avatar"&&f.on),`${def.name}: ${qp.ava.toFixed(1)} giây`);
      const okStat=(!cs.atk||Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.02)&&(!cs.spd||Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.02)
        &&(!cs.def||Math.abs(s1.def-s0.def-cs.def)<1e-3)&&(!cs.crit||Math.abs(s1.critB-s0.critB-cs.crit)<1e-3)&&(!cs.hp||s1.maxHp===Math.round(s0.maxHp*(1+cs.hp)));
      ok(okStat,`${def.name} × buffPower(50.000 năm): ${Object.entries(cs).map(([k,v])=>`${k} +${Math.round(v*100)}%`).join(", ")} [công ${s0.atkNow.toFixed(1)} -> ${s1.atkNow.toFixed(1)}, tốc ${s0.spd.toFixed(1)} -> ${s1.spd.toFixed(1)}]`);
      const sts=(bst.status??[]).filter(a=>a.s!=="stun"), m=bst.dmg+(bst.perStack&&pre.includes(bst.perStack.s)?bst.perStack.dmg:0);
      await waitFor(()=>stHas(beastOf(Q,bid),sts),1000);
      const want=exp(s1.atkNow*P10(6)*m), got=hitsQ(bid)[0]?.v;
      ok(want.includes(got)&&stHas(beastOf(Q,bid),sts),`biến hình: ${got} (cần ${want.join(" hoặc ")}), ${stTxt(sts)||"không trạng thái"}`);
      return {def,cs,bid,s0,s1};
    }
    const endQ=async()=>{ await test(Q,"clear"); await test(Q,"rest",{s:30}); await waitFor(()=>qp.ava===0,1500); };

    // Lam Điện Bá Vương Long: vòng 5 đánh hồn thú Cảm điện đau hơn, vòng 6 5 tia; tuyệt kỹ sét tìm mọi hồn thú Cảm điện ngoài vùng;
    // Chân Thân: đòn biến hình kích Cảm điện, Phong Lôi Chi Lực tích gấp đôi.
    {
      const id=LD, ult=ringSkill(id,9);
      ok(await lineupQ(id),`Q: ${vname(id)} ra trận (cấp 100, 10 hồn hoàn)`);
      ok(await loadoutQ(id,[4,5,9,-1]),"Lam Điện mang vòng 5, 6, 10");
      await ringQ(id,4,0,{pre:["shock"]});
      await ringQ(id,5,1,{d:120,wait:1300});
      // Tuyệt kỹ: u1 trong vùng (60), u2 Cảm điện ở ~205 (ngoài 160, trong shockR), u3 không Cảm điện ở ~185: sét chỉ tìm u2.
      // Hook status chỉ nhắm hồn thú trong 160: gây trạng thái cho u2 / u3 lúc còn gần (150 / 130) rồi lùi Q ra 55 pixel.
      // Q vừa ra khỏi làng: tới đường làng phía đông trước (như F ở 3.5) để bước lùi không vào vùng an toàn.
      await test(Q,"goto",{x:safe.x+safe.width+140,y:VILLAGE_RY}); await test(Q,"clear"); [qx,qy]=clearDir(qp.x,qp.y,210,60); await step(Q,qx,qy); const atk=(await stats()).atkNow;
      const u2=await spawnNear(Q,4,...qat(150),20); await test(Q,"status",{s:"shock",secs:20}); await test(Q,"status",{s:"stun",secs:10});
      const u3=await spawnNear(Q,4,...qat(130),20); await test(Q,"status",{s:"stun",secs:10});
      const bx=Math.round(qp.x-qx*55), by=Math.round(qp.y-qy*55); await test(Q,"goto",{x:bx,y:by}); await waitFor(()=>Math.hypot(qp.x-bx,qp.y-by)<1,800);
      const u1=await spawnNear(Q,4,...qat(60),20); await hush(); await hold();
      const far=bid=>{ const q=beastOf(Q,bid); return q?Math.hypot(q.x-qp.x,q.y-qp.y):-1; }, d2=far(u2), d3=far(u3);
      await test(Q,"ready"); await castQ(2,0);
      ok(await waitFor(()=>hitsQ(u1).length>=ult.n&&hitsQ(u2).length>=ult.n&&hasSt(beastOf(Q,u2),"stun"),ult.n*ult.every*1000+1500)&&!dmgsOn(Q,u3).length,
        `tuyệt kỹ ${ult.name}: u1 (60) ${hitsQ(u1).length} đợt, u2 Cảm điện cách ${d2.toFixed(0)} ${hitsQ(u2).length} đợt + Choáng, u3 không Cảm điện cách ${d3.toFixed(0)} không trúng (${dmgsOn(Q,u3).length}) [trong làng ${inSafeOf(Q)}, hướng ${qx},${qy}, log ${Q.logs.at(-1)}]`);
      ok(exp(atk*P10(9)*(ult.dmg+ult.perStack.dmg)).includes(hitsQ(u2)[0]?.v)&&Q.fxs.some(f=>f.k==="zap"&&f.to?.length>=1)&&Q.fxs.some(f=>f.k==="ult"&&f.name===ult.name),
        `sét tìm u2: ${hitsQ(u2)[0]?.v} (cần ${exp(atk*P10(9)*(ult.dmg+ult.perStack.dmg)).join(" hoặc ")}: +${ult.perStack.dmg*100}% vì Cảm điện), fx zap + ult`);
      await endQ();
      const {def}=await chanQ(id,{pre:["shock"]});
      // Phong Lôi Chi Lực khi Chân Thân: vòng 5 trúng hồn thú Cảm điện +gain × shockMult × lei; hết Chân Thân thì về × shockMult.
      const gainCT=PHONG_LOI.gain.skill*PHONG_LOI.shockMult*def.lei, gain0=PHONG_LOI.gain.skill*PHONG_LOI.shockMult;
      await test(Q,"lei",{v:0}); await test(Q,"status",{s:"shock",secs:10}); await test(Q,"ready"); await castQ(0,300);
      ok(qp.ava>0&&await waitFor(()=>qp.lei===gainCT,600),`đang Chân Thân: Phong Lôi Chi Lực +${qp.lei} (cần ${gainCT} = ${PHONG_LOI.gain.skill} × ${PHONG_LOI.shockMult} × ${def.lei})`);
      await endQ(); await faceQ(); await spawnNear(Q,4,...qat(30),20); await hush(); await test(Q,"status",{s:"stun",secs:10}); await test(Q,"status",{s:"shock",secs:10});
      await test(Q,"lei",{v:0}); await test(Q,"ready"); await castQ(0,300);
      ok(qp.ava===0&&await waitFor(()=>qp.lei===gain0,600),`hết Chân Thân: Phong Lôi Chi Lực +${qp.lei} (cần ${gain0})`);
      await test(Q,"lei",{v:0}); await endQ();
    }
    // Kim Vũ Miêu Ưng: vòng 5 vuốt 4 nhát, vòng 6 bay lướt Câm lặng; tuyệt kỹ Cảm điện 10 giây cả vùng 200; Chân Thân.
    {
      const id=KV, ult=ringSkill(id,9);
      ok(await lineupQ(id),`Q: ${vname(id)} ra trận`); await loadoutQ(id,[4,5,9,-1]);
      await ringQ(id,4,0,{d:50,wait:900});
      const x0=qp.x, y0=qp.y; await ringQ(id,5,1,{d:60,hs:"root"});
      ok(Math.hypot(qp.x-x0,qp.y-y0)>=80&&Q.fxs.some(f=>f.k==="fly"),`${ringSkill(id,5).name}: bay ${Math.hypot(qp.x-x0,qp.y-y0).toFixed(0)} pixel (fx fly)`);
      await test(Q,"clear"); await faceQ(); const atk=(await stats()).atkNow;
      const u2=await spawnNear(Q,4,...qat(180),20); await test(Q,"status",{s:"stun",secs:10});
      const u1=await spawnNear(Q,4,...qat(40),20); await hold(); await test(Q,"ready"); await castQ(2,0);
      ok(await waitFor(()=>[u1,u2].every(u=>hitsQ(u).length>=ult.n&&hasSt(beastOf(Q,u),"shock")&&hasSt(beastOf(Q,u),"silence")),ult.n*ult.every*1000+1500)
        &&exp(atk*P10(9)*ult.dmg).includes(hitsQ(u1)[0]?.v),`tuyệt kỹ ${ult.name}: ${hitsQ(u1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), Cảm điện + Câm lặng cả hồn thú cách 180`);
      const bs=(await test(Q,"bst")).st?.shock; ok(bs&&bs.t>STATUS.shock.secs+2,`Cảm điện của tuyệt kỹ còn ${bs?.t.toFixed(1)} giây (> ${STATUS.shock.secs + 2}, mặc định ${STATUS.shock.secs})`);
      await endQ(); await chanQ(id); await endQ();
    }
    // Càn Khôn Hỗn Nguyên Tỏa: vòng 5 3 xích (Phong ấn đủ 3 tầng → Dễ thương), vòng 6 bay tới đặt ngục, vòng 9 đánh mạnh mục tiêu Dễ thương;
    // tuyệt kỹ vùng phong tỏa 150; Chân Thân kéo về, Phong ấn đủ tầng.
    {
      const id=CK, ult=ringSkill(id,9);
      ok(await lineupQ(id),`Q: ${vname(id)} ra trận`); await loadoutQ(id,[4,5,9,8]);
      const b5=await ringQ(id,4,0,{d:100,wait:900,n:3});
      ok(hasSt(beastOf(Q,b5),"vuln")&&!beastOf(Q,b5)?.lock,`3 xích Phong ấn đủ 3 tầng: bùng phát Dễ thương (Phong ấn còn ${beastOf(Q,b5)?.lock})`);
      const b6=await ringQ(id,5,1,{d:120,hs:"root",wait:0}), q6=beastOf(Q,b6);
      ok(q6&&Math.hypot(q6.x-qp.x,q6.y-qp.y)<40&&hasSt(q6,"vuln"),`${ringSkill(id,5).name}: bay tới hồn thú (còn cách ${q6?Math.hypot(q6.x-qp.x,q6.y-qp.y).toFixed(0):"?"}), Dễ thương`);
      await ringQ(id,8,3,{d:40,pre:["vuln"]});
      await test(Q,"clear"); await faceQ();
      const u2=await spawnNear(Q,4,...qat(200),20); await test(Q,"status",{s:"stun",secs:10});
      const u1=await spawnNear(Q,4,...qat(150),20); await test(Q,"status",{s:"stun",secs:10}); const x0=qp.x, y0=qp.y;
      await test(Q,"ready"); await castQ(2,0);
      // Tin dmg tới trước bản vá state: chờ cả số tầng Phong ấn.
      ok(await waitFor(()=>[u1,u2].every(u=>hitsQ(u).length>=ult.n&&stHas(beastOf(Q,u),[{s:"shock"},{s:"vuln"},{s:"root"}])&&beastOf(Q,u)?.lock===ult.n%3),ult.n*ult.every*1000+2000)
        &&Math.hypot(qp.x-x0,qp.y-y0)>=100&&Q.fxs.some(f=>f.k==="ult"),
        `tuyệt kỹ ${ult.name}: bay ${Math.hypot(qp.x-x0,qp.y-y0).toFixed(0)} pixel, ${hitsQ(u1).length}/${hitsQ(u2).length} nhát vào 2 hồn thú, Dễ thương, Phong ấn còn ${beastOf(Q,u2)?.lock} tầng, Trói, Cảm điện`);
      await endQ(); await chanQ(id); await endQ();
    }
    // Yêu Hồ: vòng 5 Mị hoặc 2 tầng, vòng 6 tàng hình; tuyệt kỹ Mê hoặc diện rộng (hồn thú bỏ mục tiêu); Chân Thân.
    {
      const id=YH, ult=ringSkill(id,9);
      ok(await lineupQ(id),`Q: ${vname(id)} ra trận`); await loadoutQ(id,[4,5,9,-1]);
      await ringQ(id,4,0);
      await ringQ(id,5,1,{d:40}); ok(hasBuff(qp,"hide"),`${ringSkill(id,5).name}: hồn sư tàng hình`);
      await test(Q,"clear"); await faceQ(); const atk=(await stats()).atkNow;
      const u2=await spawnNear(Q,4,...qat(165),20); await test(Q,"status",{s:"root",secs:10});
      const u1=await spawnNear(Q,4,...qat(40),20); await hold("root"); await test(Q,"ready"); await castQ(2,300);
      ok(await waitFor(()=>[u1,u2].every(u=>stHas(beastOf(Q,u),ult.status)&&!beastOf(Q,u).aggro),800)&&exp(atk*P10(9)*ult.dmg).includes(hitsQ(u1)[0]?.v)&&hasBuff(qp,"hide"),
        `tuyệt kỹ ${ult.name}: ${hitsQ(u1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), ${stTxt(ult.status)} cả hồn thú cách 165, bỏ mục tiêu; tàng hình`);
      await endQ(); await chanQ(id); await endQ();
    }
    // Xúc Xích: vòng 5 hồi sinh lực + khiên, vòng 6 xúc xích bay Cảm điện; vòng 9 Phục Chế không giảm (chép hồn kỹ vòng 5 của Lam Điện);
    // tuyệt kỹ hồi máu, hồn lực, tăng công / tốc; Chân Thân giảm tiêu hao, hồi hồn lực.
    {
      const id=XX, ult=ringSkill(id,9), s5=ringSkill(id,4);
      ok(await lineupQ(id,[LD,KV,YH]),`Q: ${vname(id)} ra trận, Lam Điện trong đội`); await loadoutQ(id,[4,5,8,9]);
      await test(Q,"ready"); await test(Q,"hurt",{pct:60}); await waitFor(()=>qp.hp<qp.maxHp); const h0=qp.hp; await castQ(0,300);
      const heal=Math.round(qp.maxHp*s5.self.heal*buffPower(Y10[4]));
      ok(Math.abs(qp.hp-h0-heal)<=2&&qp.shield>0,`vòng 5 ${s5.name}: hồi ${qp.hp-h0} (cần ≈ ${heal}), khiên ${qp.shield}`);
      await ringQ(id,5,1,{wait:600});
      // Phục Chế vòng 9: Lam Điện tung vòng 5 (ô U) rồi đổi sang Xúc Xích tung ô O; sát thương theo công Xúc Xích × sức mạnh vòng 9 × 1.
      await test(Q,"clear"); await faceQ();
      const bc=await spawnNear(Q,4,...qat(30),20); await hush(); await test(Q,"status",{s:"stun",secs:10});
      await waitFor(()=>qp.swCd===0,3500); Q.room.send("switch",{slot:Q.owned.team.indexOf(rowQ(LD))}); ok(await waitFor(()=>Q.owned.active===rowQ(LD),1500),"đổi sang Lam Điện");
      await test(Q,"ready"); await castQ(0,300); ok(hitsQ(bc).length>0,`Lam Điện tung ${ringSkill(LD,4).name}`);
      await waitFor(()=>qp.swCd===0,3500); Q.room.send("switch",{slot:Q.owned.team.indexOf(rowQ(id))}); ok(await waitFor(()=>Q.owned.active===rowQ(id),1500),"đổi về Xúc Xích");
      await test(Q,"status",{s:"shock",secs:10}); const ax=(await stats()).atkNow, src=ringSkill(LD,4); await test(Q,"ready"); const l=Q.logs.length; await castQ(2,300);
      const want=exp(ax*P10(8)*ringSkill(id,8).copy*(src.dmg+src.perStack.dmg));
      ok(Q.logs.slice(l).some(t=>t.includes(`sao chép ${src.name}`))&&want.includes(hitsQ(bc)[0]?.v),
        `vòng 9 ${ringSkill(id,8).name}: sao chép ${src.name} ${hitsQ(bc)[0]?.v} (cần ${want.join(" hoặc ")}: công Xúc Xích × hồn hoàn vòng 9 × ${ringSkill(id,8).copy})`);
      await test(Q,"clear"); await test(Q,"ready"); await test(Q,"hurt",{pct:60}); await waitFor(()=>qp.hp<qp.maxHp); const h1=qp.hp, m1=qp.mp; await castQ(3,300);
      ok(Q.fxs.some(f=>f.k==="ult"&&f.name===ult.name)&&qp.hp>h1&&qp.shield>0&&hasBuff(qp,"atk")&&hasBuff(qp,"spd"),
        `tuyệt kỹ ${ult.name}: hồi ${h1} -> ${qp.hp}, hồn lực ${m1} -> ${qp.mp} (trừ ${ult.cost} rồi hồi), khiên ${qp.shield}, tăng công và tốc độ`);
      // Chân Thân: không đánh, chỉ hồi; giảm tiêu hao hồn kỹ.
      await test(Q,"rest",{s:30}); await test(Q,"ready",{mp:100}); const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]), s0=await stats();
      await test(Q,"hurt",{pct:60}); await waitFor(()=>qp.hp<qp.maxHp); const h2=qp.hp; const msg=await chanThanQ(); const s1=await stats();
      ok(qp.ava>0&&msg.includes(def.name)&&qp.hp>h2&&Math.abs(s1.def-s0.def-cs.def)<1e-3&&Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.02&&s1.maxHp===Math.round(s0.maxHp*(1+cs.hp)),
        `${def.name}: hồi ${h2} -> ${qp.hp}, giảm sát thương +${Math.round(cs.def*100)}%, tốc độ +${Math.round(cs.spd*100)}%, sinh lực tối đa ${s0.maxHp} -> ${s1.maxHp}`);
      await endQ();
    }
    // Ô đã chọn lưu DB: thoát rồi vào lại.
    {
      await test(Q,"rest",{s:TEAM_COMBAT_SECS+1});
      const want=Object.fromEntries(Q.owned.list.map(v=>[v.vohon,v.skills]));
      await Q.room.leave(); await sleep(500); await enter(Q); await waitFor(()=>Q.owned);
      const got=Object.fromEntries(Q.owned.list.map(v=>[v.vohon,v.skills]));
      ok(same(got,want)&&same(got[CK],[4,5,9,8])&&same(got[XX],[4,5,8,9]),"thoát vào lại: 5 võ hồn Cảm điện giữ ô mang theo");
      await Q.room.leave();
    }
  
}

// 8.1d: hồn kỹ vòng 5–10 và Võ Hồn Chân Thân 5 võ hồn còn lại
export async function ab2Block4(ctx) {
  const { B, beastOf, clearDir, dmgsOn, exp, hasBuff, hasSt, leaveSafe, meOf, skillCast, spawnNear, vname } = ctx;


    const REST=["cuu_tinh_that_sat_kiem","nhu_cot_tho","tu_vong_chu_hoang","quy_mi","thien_can_bach_ngoc_dinh"];
    ok(REST.every(id=>HIGH_RINGS.every(n=>ringSkill(id,n-1))&&!ringSkill(id,CHAN_THAN_RING-1)&&chanThanOf(id)?.burst&&ringSkill(id,9).ult&&/^Tuyệt kỹ:/.test(ringSkill(id,9).desc)),
      "5 võ hồn còn lại có hồn kỹ vòng 5, 6, 8, 9, 10 (vòng 10 là tuyệt kỹ) và Võ Hồn Chân Thân vòng 7");
    // Tuyệt kỹ thật mang đúng tên trong bảng 5.1; bản nhỏ ở vòng 4 đổi tên để 4 ô mang theo không có hai hồn kỹ trùng tên.
    const ULT={cuu_tinh_that_sat_kiem:"Kiếm Trảm Sơn Hà",quy_mi:"Quỷ Ảnh Trùng Trùng",thien_can_bach_ngoc_dinh:"Tịnh Thế Lưu Ly"};
    ok(Object.entries(ULT).every(([id,n])=>ringSkill(id,9).name===n&&skillChoices(id,10).filter(r=>ringSkill(id,r).name===n).length===1),
      `tuyệt kỹ thật: ${Object.values(ULT).join(", ")}; vòng 4 là bản nhỏ (${Object.keys(ULT).map(id=>ringSkill(id,3).name).join(", ")})`);
    const done=VOHON.filter(v=>chanThanOf(v.id)&&HIGH_RINGS.every(n=>ringSkill(v.id,n-1))).length;
    console.log(`  võ hồn đã đủ vòng 5–10: ${done}/${VOHON.length}`);
    const U=await bot("Tester CL","cuu_tinh_that_sat_kiem",{sex:1,hair:0,hairCol:2,outfitCol:4});
    await waitFor(()=>U.owned&&U.squad&&meOf(U)); const up=meOf(U);
    for(const vohon of REST.slice(1)) await test(U,"grant",{vohon});
    const rowU=id=>U.owned.list.find(v=>v.vohon===id).rowId, vU=id=>U.owned.list.find(v=>v.vohon===id);
    const Y10=[423,764,1760,5000,12000,20000,50000,100000,100000,100000], P10=i=>skillPower(Y10[i]);
    for(const id of REST) await test(U,"set",{rowId:rowU(id),level:100,xp:0,rings:Y10});
    const stats=async()=>(await test(U,"stats")).live;
    const hush=()=>test(U,"status",{s:"silence",secs:20,all:true});
    async function lineupU(id){ await test(U,"clear"); await test(U,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(U,[rowU(id),0,0,0]);
      await sendTeam(U,[rowU(id),...REST.filter(x=>x!==id).slice(0,3).map(rowU)]); return U.owned.active===rowU(id)&&await waitFor(()=>up.vh===vohonIndex(id)); }
    async function loadoutU(id,skills){ const n=U.ownedMsgs, l=U.logs.length; U.room.send("loadout",{rowId:rowU(id),skills}); await waitFor(()=>U.ownedMsgs>n&&U.logs.length>l,1500); await sleep(80); }
    const castU=(i,wait=250)=>skillCast(U,i,wait);
    async function chanThanU(){ const l=U.logs.length; U.fxs=[]; U.dmgs=[]; U.room.send("chanthan"); await waitFor(()=>U.logs.length>l,1500); await sleep(120); return U.logs.at(-1)??""; }
    // Bỏ sát thương Trúng độc mỗi giây (màu độc) khi đếm nhát của hồn kỹ.
    const pc=STATUS.poison.col, hitsU=bid=>dmgsOn(U,bid).filter(x=>x.c!==pc);
    const stHas=(b,list)=>!!b&&(list??[]).every(a=>a.s==="poison"?b.poison>=Math.min(a.n??1,5):a.s==="armor"?b.armor>=Math.min(a.n??1,3):a.s==="allure"?b.allure>=(a.n??1):hasSt(b,a.s));
    const stTxt=list=>(list??[]).map(a=>`${STATUS[a.s].name}${a.n?` ${a.n} tầng`:""}`).join(", ");
    const buffTxt=e=>Object.keys(e?.buff??{}).map(k=>BUFFS[k].name).join(", ");
    ok(await leaveSafe(U),"U: ra khỏi làng");
    let [ux,uy]=clearDir(up.x,up.y,170); const uat=d=>[Math.round(ux*d),Math.round(uy*d)];
    async function faceU(){ [ux,uy]=clearDir(up.x,up.y,170); await step(U,ux,uy); }
    /** Hồn kỹ đánh vòng `ring` ở ô `i`: hồn thú bậc 4 cách `d` theo hướng nhìn, đứng yên bằng Choáng; nhát đầu theo năm và trạng thái. */
    async function ringU(id,ring,i,{d=30,wait=450}={}){
      const sk=ringSkill(id,ring), atk=(await stats()).atkNow;
      await test(U,"clear"); await faceU(); const bid=await spawnNear(U,4,...uat(d),20); await hush(); await test(U,"status",{s:"stun",secs:10});
      await test(U,"ready"); await castU(i,wait);
      const n=(sk.area==="around"||sk.area==="target")&&sk.n>1?sk.n:1, sts=[...(sk.status??[]),...(sk.finisher??[])].filter(a=>a.s!=="stun");
      await waitFor(()=>hitsU(bid).length>=n&&stHas(beastOf(U,bid),sts),n>1?n*(sk.every??0.15)*1000+1500:1500);
      const want=exp(atk*P10(ring)*sk.dmg), got=hitsU(bid).map(x=>x.v), b=beastOf(U,bid);
      ok(want.includes(got[0])&&got.length>=n&&U.fxs.some(f=>f.k==="soulring"&&f.i===ring),`${vname(id)} vòng ${ring+1} ${sk.name}: ${got.length}/${n} nhát, nhát đầu ${got[0]} (cần ${want.join(" hoặc ")})`);
      if(sts.length) ok(stHas(b,sts),`${sk.name}: ${stTxt(sts)} [Trúng độc ${b?.poison}, Phá giáp ${b?.armor}, Mị hoặc ${b?.allure}]`);
      return bid;
    }
    /** Hồn kỹ lên bản thân vòng `ring` ở ô `i`: hiệu ứng có lợi, hồi sinh lực cả đội, khiên (đang mất nửa sinh lực). */
    async function selfU(id,ring,i){
      const sk=ringSkill(id,ring), e=sk.self;
      await test(U,"clear"); await test(U,"rest",{s:30}); await test(U,"ready"); await test(U,"hurt",{pct:50}); const hp0=up.hp; await castU(i,300);
      ok(Object.keys(e.buff??{}).every(k=>hasBuff(up,k))&&(!e.heal||up.hp>hp0)&&(!e.shield||up.shield>0)&&U.fxs.some(f=>f.k==="soulring"&&f.i===ring),
        `${vname(id)} vòng ${ring+1} ${sk.name}: ${buffTxt(e)||"không hiệu ứng có lợi"}${e.heal?`, hồi ${hp0} -> ${up.hp}`:""}${e.shield?`, khiên ${up.shield}`:""}`);
    }
    /** Chân Thân: chỉ số × buffPower vòng 7, đòn biến hình theo công đã tăng (hồn thú cách `d`). */
    async function chanU(id,{d=30}={}){
      const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]);
      await test(U,"clear"); await test(U,"rest",{s:30}); await test(U,"ready"); await faceU(); const s0=await stats();
      const bid=await spawnNear(U,4,...uat(d),20); await hush(); await test(U,"status",{s:"stun",secs:10});
      const msg=await chanThanU(), s1=await stats();
      ok(up.ava>def.secs-1&&msg.includes(def.name)&&U.fxs.some(f=>f.k==="avatar"&&f.on),`${def.name}: ${up.ava.toFixed(1)} giây`);
      const okStat=(!cs.atk||Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.02)&&(!cs.spd||Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.02)
        &&(!cs.def||Math.abs(s1.def-s0.def-cs.def)<1e-3)&&(!cs.crit||Math.abs(s1.critB-s0.critB-cs.crit)<1e-3)&&(!cs.hp||s1.maxHp===Math.round(s0.maxHp*(1+cs.hp)));
      ok(okStat,`${def.name} × buffPower(50.000 năm): ${Object.entries(cs).map(([k,v])=>`${k} +${Math.round(v*100)}%`).join(", ")} [công ${s0.atkNow.toFixed(1)} -> ${s1.atkNow.toFixed(1)}]`);
      const bst=def.burst, sts=(bst.status??[]).filter(a=>a.s!=="stun"), want=exp(s1.atkNow*P10(6)*bst.dmg);
      await waitFor(()=>hitsU(bid).length&&stHas(beastOf(U,bid),sts),1000);
      ok(want.includes(hitsU(bid)[0]?.v)&&stHas(beastOf(U,bid),sts),`biến hình: ${hitsU(bid)[0]?.v} (cần ${want.join(" hoặc ")}), ${stTxt(bst.status)||"không trạng thái"}`);
      return {def,cs,bid,s0,s1};
    }
    const endU=async()=>{ await test(U,"clear"); await test(U,"rest",{s:30}); await waitFor(()=>up.ava===0,1500); };

    // Cửu Tinh Thất Sát Kiếm: vòng 5 kiếm mang Phá giáp 2 tầng, vòng 6 kiếm trận 8 nhát; tuyệt kỹ Kiếm Trảm Sơn Hà thật theo tầng Phá giáp.
    {
      const id="cuu_tinh_that_sat_kiem", ult=ringSkill(id,9);
      ok(await lineupU(id),`U: ${vname(id)} ra trận (cấp 100, 10 hồn hoàn)`);
      await loadoutU(id,[4,5,9,-1]); ok(same(vU(id).skills,[4,5,9,-1]),`${vname(id)} mang vòng 5, 6, 10`);
      await ringU(id,4,0); const b6=await ringU(id,5,1,{wait:0});
      ok(beastOf(U,b6)?.armor===3,`${ringSkill(id,5).name}: 8 nhát cộng Phá giáp tới ${beastOf(U,b6)?.armor} tầng (tối đa)`);
      // Hồn thú cách 120 (ngoài nửa trước mặt 64 của bản nhỏ vòng 4) có sẵn Phá giáp 3 tầng: mỗi tầng thêm perStack.
      await test(U,"clear"); await faceU(); const atk=(await stats()).atkNow;
      const fb=await spawnNear(U,4,...uat(120),20); await hush(); await test(U,"status",{s:"stun",secs:10}); await test(U,"status",{s:"armor",n:3});
      const bf=B.fxs.length; await test(U,"ready"); await castU(2,400);
      const want=exp(atk*P10(9)*(ult.dmg+ult.perStack.dmg*3)*(1+3*STATUS.armor.amp)); // Phá giáp còn làm nhận thêm sát thương đòn trực tiếp
      ok(want.includes(hitsU(fb)[0]?.v)&&U.fxs.some(f=>f.k==="ult"&&f.name===ult.name),
        `tuyệt kỹ ${ult.name}: hồn thú cách 120 có 3 tầng Phá giáp ${hitsU(fb)[0]?.v} (cần ${want.join(" hoặc ")}: (${ult.dmg*100}% + 3 × ${ult.perStack.dmg*100}%) × Phá giáp)`);
      ok(B.room.roomId!==U.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===U.room.sessionId),800),"fx tuyệt kỹ: người cùng phòng cũng thấy");
      await endU(); await chanU(id); await endU();
    }
    // Nhu Cốt Thố: vòng 5 Mị Hoặc, vòng 6 thuấn di xa; tuyệt kỹ Bát Đoạn Suất 8 đoạn, hút máu, đoạn cuối Choáng; Chân Thân chí mạng.
    {
      const id="nhu_cot_tho", ult=ringSkill(id,9);
      ok(await lineupU(id),`U: ${vname(id)} ra trận`); await loadoutU(id,[4,5,9,-1]);
      await ringU(id,4,0);
      const x0=up.x, y0=up.y; await ringU(id,5,1,{d:50});
      ok(Math.hypot(up.x-x0,up.y-y0)>=80,`${ringSkill(id,5).name}: thuấn di ${Math.hypot(up.x-x0,up.y-y0).toFixed(0)} pixel`);
      await test(U,"clear"); await faceU(); const atk=(await stats()).atkNow;
      const u=await spawnNear(U,4,...uat(80),20); await hush(); await test(U,"ready"); await test(U,"hurt",{pct:60}); const hp0=up.hp; await castU(2,0);
      ok(await waitFor(()=>hitsU(u).length>=ult.n&&hasSt(beastOf(U,u),"stun"),ult.n*ult.every*1000+1500)&&exp(atk*P10(9)*ult.dmg).includes(hitsU(u)[0]?.v)&&up.hp>hp0,
        `tuyệt kỹ ${ult.name}: ${hitsU(u).length}/${ult.n} đoạn, đoạn đầu ${hitsU(u)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), đoạn cuối Choáng, hút máu ${hp0} -> ${up.hp}`);
      await endU(); await chanU(id); await endU();
    }
    // Tử Vong Chu Hoàng: vòng 5 tơ độc quạt, vòng 6 lưới chụp lên hồn thú ở xa; tuyệt kỹ thiên võng kéo cả vùng; Chân Thân gom quái.
    {
      const id="tu_vong_chu_hoang", ult=ringSkill(id,9);
      ok(await lineupU(id),`U: ${vname(id)} ra trận`); await loadoutU(id,[4,5,9,-1]);
      await ringU(id,4,0);
      const b6=await ringU(id,5,1,{d:110,wait:0}), q6=beastOf(U,b6), d6=q6?Math.hypot(q6.x-up.x,q6.y-up.y):-1;
      ok(d6>ringSkill(id,5).r&&hitsU(b6).length>=ringSkill(id,5).n,`${ringSkill(id,5).name}: lưới đặt vào hồn thú cách ${d6.toFixed(0)} (> bán kính ${ringSkill(id,5).r}, hồn sư không bay tới), ${hitsU(b6).length} nhát`);
      await test(U,"clear"); await faceU(); const atk=(await stats()).atkNow;
      const g1=await spawnNear(U,4,...uat(70),20), g2=await spawnNear(U,4,...uat(130),20); await test(U,"status",{s:"stun",secs:10,all:true});
      await test(U,"ready"); await castU(2,300);
      const dist=bid=>{ const q=beastOf(U,bid); return q?Math.hypot(q.x-up.x,q.y-up.y):-1; }, sts=ult.status;
      ok(await waitFor(()=>[g1,g2].every(g=>dist(g)>=0&&dist(g)<TIERS[4].size/2+16&&stHas(beastOf(U,g),sts)),800)&&exp(atk*P10(9)*ult.dmg).includes(hitsU(g1)[0]?.v),
        `tuyệt kỹ ${ult.name}: ${hitsU(g1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), kéo 2 hồn thú về ${dist(g1).toFixed(0)} / ${dist(g2).toFixed(0)} pixel, ${stTxt(sts)}`);
      await endU(); await chanU(id); await endU();
    }
    // Quỷ Mị: vòng 5 quỷ ảnh hút máu, vòng 6 gia trì cả đội; tuyệt kỹ Quỷ Ảnh Trùng Trùng thật: nổ quanh thân rồi cả đội tàng hình.
    {
      const id="quy_mi", ult=ringSkill(id,9);
      ok(await lineupU(id),`U: ${vname(id)} ra trận`); await loadoutU(id,[4,5,9,-1]);
      await test(U,"hurt",{pct:50}); const hp5=up.hp; await ringU(id,4,0);
      ok(up.hp>hp5,`${ringSkill(id,4).name}: hút máu ${hp5} -> ${up.hp}`);
      await selfU(id,5,1);
      await endU(); await faceU(); const atk=(await stats()).atkNow;
      const q=await spawnNear(U,4,...uat(60),20); await hush(); await test(U,"ready"); const bf=B.fxs.length; await castU(2,300);
      ok(exp(atk*P10(9)*ult.dmg).includes(hitsU(q)[0]?.v)&&stHas(beastOf(U,q),ult.status)&&["hide","atk","leech"].every(k=>hasBuff(up,k))&&U.fxs.some(f=>f.k==="ult"),
        `tuyệt kỹ ${ult.name}: ${hitsU(q)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), Dễ thương, rồi ${buffTxt(ult.self)}`);
      ok(await waitFor(()=>!beastOf(U,q)?.aggro,1500),"tàng hình: hồn thú vừa bị đánh không nhắm tới hồn sư");
      ok(B.room.roomId!==U.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===U.room.sessionId)&&(B.room.state.players.get(U.room.sessionId)?.buff&buffBit("hide")),800),
        "người cùng phòng thấy tuyệt kỹ và hồn sư tàng hình");
      // Tàng hình thuộc hồn sư: đổi võ hồn vẫn còn; đánh thường thì hiện hình.
      await waitFor(()=>up.swCd===0,3500); U.room.send("switch",{slot:U.owned.team.indexOf(rowU("nhu_cot_tho"))});
      ok(await waitFor(()=>U.owned.active===rowU("nhu_cot_tho"),1500)&&hasBuff(up,"hide")&&hasBuff(up,"leech"),"đổi sang Nhu Cốt Thố: vẫn tàng hình, hút huyết");
      U.room.send("attack"); ok(await waitFor(()=>!hasBuff(up,"hide"),1000)&&hasBuff(up,"atk"),"đánh thường: hiện hình, tăng công còn");
      ok(await lineupU(id),`U: ${vname(id)} ra trận lại`); await endU();
      const {def}=await chanU(id); ok(hasBuff(up,"leech"),`${def.name}: hút huyết ${Math.round(def.burst.self.buff.leech*buffPower(Y10[6])*100)}% (cả đội)`);
      await endU();
    }
    // Thiên Càn Bạch Ngọc Đỉnh: vòng 5 trấn hồn Dễ thương + Phá giáp, vòng 6 hồi máu + khiên; tuyệt kỹ Tịnh Thế Lưu Ly thật; Chân Thân.
    {
      const id="thien_can_bach_ngoc_dinh", ult=ringSkill(id,9);
      ok(await lineupU(id),`U: ${vname(id)} ra trận`); await loadoutU(id,[4,5,9,-1]);
      await ringU(id,4,0); await selfU(id,5,1);
      await endU(); await faceU(); const atk=(await stats()).atkNow;
      const t1=await spawnNear(U,4,...uat(40),20), t2=await spawnNear(U,4,...uat(140),20); await hush(); await test(U,"status",{s:"stun",secs:10,all:true});
      await test(U,"ready"); await test(U,"hurt",{pct:60}); const hp0=up.hp; await castU(2,400);
      ok(exp(atk*P10(9)*ult.dmg).includes(hitsU(t1)[0]?.v)&&[t1,t2].every(t=>stHas(beastOf(U,t),ult.status))&&up.hp>hp0&&up.shield>0&&hasBuff(up,"def")&&U.fxs.some(f=>f.k==="ult"),
        `tuyệt kỹ ${ult.name}: ${hitsU(t1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), ${stTxt(ult.status)} cả hồn thú cách 140; hồi ${hp0} -> ${up.hp}, khiên ${up.shield}, tăng thủ`);
      await endU(); await test(U,"hurt",{pct:50});
      const {def}=await chanU(id); ok(up.shield>0,`${def.name}: khiên ${up.shield}`);
      await endU();
    }
    // Ô đã chọn lưu DB: thoát rồi vào lại.
    {
      await U.room.leave(); await sleep(500); await enter(U); await waitFor(()=>U.owned);
      ok(REST.every(id=>same(vU(id).skills,[4,5,9,-1])),"thoát vào lại: 5 võ hồn còn lại vẫn mang vòng 5, 6, 10");
      await U.room.leave();
    }
  
}

// 8.3: 4 võ hồn mới (Phá Hồn Thương, A Ngân, Liệt Hỏa Thương Lang, Băng Phượng Hoàng)
export async function ab2Block5(ctx) {
  const { B, beastOf, clearDir, dmgsOn, exp, hasBuff, hasSt, leaveSafe, meOf, skillCast, spawnNear, tienCo, vname } = ctx;


    const NEW=EXTRA_VOHON, n0=vohonIndex(NEW[0]); // Bạch Hổ (#194) thêm sau 4 võ hồn này, ở cuối VOHON
    ok(NEW.length===4&&NEW.every((id,k)=>vohonIndex(id)===n0+k)&&vohonIndex("cuu_bao_luu_ly_thap")===n0-1&&vohonIndex("bach_ho")===n0+NEW.length&&VOHON.length===n0+NEW.length+1,
      `8.3: 4 võ hồn mới nối nhau (chỉ số ${n0}–${n0+NEW.length-1}), Bạch Hổ (#194) sau đó, võ hồn cũ giữ chỉ số: ${NEW.map(id=>`${vname(id)} (${VOHON[vohonIndex(id)].rarity}, ${HE[VOHON[vohonIndex(id)].he].name})`).join(", ")}`);
    ok(AWAKEN_CHOICES.length===17&&AWAKEN_CHOICES.every(v=>v.rarity==="SSR"&&!NEW.includes(v.id)),"lựa chọn thức tỉnh vẫn là 17 SSR cơ bản, không có võ hồn mới");
    ok(NEW.every(id=>skillsOf(id)!==SKILLS&&skillsOf(id).length===4&&TIEN_CO_RIENG[id]&&HIGH_RINGS.every(n=>ringSkill(id,n-1))&&!ringSkill(id,CHAN_THAN_RING-1)
      &&ringSkill(id,9).ult&&/^Tuyệt kỹ:/.test(ringSkill(id,9).desc)&&chanThanOf(id)?.burst&&new Set(skillChoices(id,10).map(r=>ringSkill(id,r).name)).size===9),
      "4 võ hồn mới có hồn kỹ vòng 1–4, 5, 6, 8, 9, tuyệt kỹ vòng 10 (tên không trùng), tiên cơ riêng và Chân Thân vòng 7");
    const ctNames=Object.values(VOHON).map(v=>chanThanOf(v.id)?.name).filter(Boolean);
    ok(new Set(ctNames).size===ctNames.length&&ctNames.length===VOHON.length,`cả ${VOHON.length} võ hồn có Chân Thân, không trùng tên`);
    // Nguồn: mảnh rơi theo bản đồ, rương thú vương, Đại Đấu Hồn Trường.
    const where=id=>Object.values(MAPS).filter(m=>m.shards.includes(id)).map(m=>m.id);
    // Đã chốt 2026-10-20: Phá Hồn Thương chuyển về rơi ở Hải Thần Đảo (trước đó chỉ ở rương mọi thú vương, KING_CHEST.every).
    ok(same(where("a_ngan"),["thanh_hon_thon"])&&same(where("liet_hoa_thuong_lang"),["lac_nhat_sam_lam"])&&same(where("bang_phuong_hoang"),["cuc_bac_chi_dia"])&&same(where("pha_hon_thuong"),["hai_than_dao"]),
      "mảnh: A Ngân ở Thánh Hồn Thôn, Liệt Hỏa Thương Lang ở Lạc Nhật Sâm Lâm, Băng Phượng Hoàng ở Cực Bắc Chi Địa, Phá Hồn Thương ở Hải Thần Đảo");
    const kings=Object.values(MAPS).filter(m=>m.king).map(m=>m.id);
    ok(kings.length>=4&&!KING_CHEST.every.length&&kings.every(m=>kingShardPool(m).filter(x=>x.vohon==="pha_hon_thuong").length===(m==="hai_than_dao"?1:0))
      &&kingShardPool("hai_than_dao").some(x=>x.vohon==="pha_hon_thuong"&&x.w===3)&&kingShardPool("lac_nhat_sam_lam").some(x=>x.vohon==="liet_hoa_thuong_lang"&&x.w===3)
      &&kingShardPool("cuc_bac_chi_dia").some(x=>x.vohon==="bang_phuong_hoang"&&x.w===3)&&kingShardPool("tinh_dau_ngoai_vi")[3].vohon===KING_CHEST.fire,
      `rương thú vương (${kings.length} bản đồ): mảnh bản đồ trọng số 3; Phá Hồn Thương chỉ ở rương Hải Thần Đảo (trọng số 3), không còn ở rương khác`);
    ok(NEW.every(id=>ARENA_SHARDS.includes(id)&&itemDef(shardCode(id))?.kind==="manh_vo_hon"),"mảnh 4 võ hồn mới là vật phẩm và nằm trong thưởng Đại Đấu Hồn Trường");

    const N=await bot("Tester VH","yeu_ho",{sex:0,hair:2,hairCol:4,outfitCol:2});
    await waitFor(()=>N.owned&&N.squad&&N.bag&&meOf(N)); const np=meOf(N);
    // Mở bằng 50 mảnh (hook give): 49 mảnh bị từ chối, đủ 50 thì mở ở cấp 1, 1★, không tự vào đội, hết mảnh.
    async function shardN(type,vohon){ const l=N.logs.length; N.room.send(type,{vohon}); await waitFor(()=>N.logs.length>l,2000); await sleep(150); return N.logs.at(-1)??""; }
    for(const id of NEW){
      const code=shardCode(id); await test(N,"give",{code,qty:SHARD_UNLOCK-1});
      const t1=await shardN("unlock",id);
      ok(!N.owned.list.some(v=>v.vohon===id)&&qtyOf(N,code)===SHARD_UNLOCK-1,`${vname(id)}: ${SHARD_UNLOCK-1} mảnh chưa mở được (${t1})`);
      await test(N,"give",{code,qty:1}); const t2=await shardN("unlock",id), v=N.owned.list.find(v=>v.vohon===id);
      ok(v&&v.level===1&&v.stars===1&&!N.owned.team.includes(v.rowId)&&qtyOf(N,code)===0,`${vname(id)}: đủ ${SHARD_UNLOCK} mảnh thì mở, cấp 1, 1★, chưa vào đội (${t2})`);
    }
    const rowN=id=>N.owned.list.find(v=>v.vohon===id).rowId, vN=id=>N.owned.list.find(v=>v.vohon===id);
    // Xếp đội 4 võ hồn mới (ngoài giao chiến).
    await test(N,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(N,NEW.map(rowN));
    ok(same(N.owned.team,NEW.map(rowN))&&await waitFor(()=>np.vh===vohonIndex(NEW[0])),`xếp đội 4 võ hồn mới: ${NEW.map(vname).join(", ")}`);
    const Y10=[423,764,1760,5000,12000,20000,50000,100000,100000,100000], P10=i=>skillPower(Y10[i]);
    for(const id of NEW) await test(N,"set",{rowId:rowN(id),level:100,xp:0,rings:Y10});
    const stats=async()=>(await test(N,"stats")).live, hush=()=>test(N,"status",{s:"silence",secs:20,all:true});
    // Đội mới vẫn chứa võ hồn đang ra trận thì võ hồn đó giữ nguyên: gửi [id,0,0,0] trước rồi mới đội đủ 4.
    async function lineupN(id){ await test(N,"clear"); await test(N,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(N,[rowN(id),0,0,0]);
      await sendTeam(N,[rowN(id),...NEW.filter(x=>x!==id).map(rowN)]); return N.owned.active===rowN(id)&&await waitFor(()=>np.vh===vohonIndex(id)); }
    async function loadoutN(id,skills){ const n=N.ownedMsgs, l=N.logs.length; N.room.send("loadout",{rowId:rowN(id),skills}); await waitFor(()=>N.ownedMsgs>n&&N.logs.length>l,1500); await sleep(80); }
    const castN=(i,wait=250)=>skillCast(N,i,wait);
    const pc=STATUS.poison.col, hitsN=bid=>dmgsOn(N,bid).filter(x=>x.c!==pc&&x.c!==STATUS.burn.col);
    const stHas=(b,list)=>!!b&&(list??[]).every(a=>a.s==="armor"?b.armor>=Math.min(a.n??1,3):a.s==="burn"?b.burn>=1:hasSt(b,a.s));
    const stTxt=list=>(list??[]).map(a=>`${STATUS[a.s].name}${a.n?` ${a.n} tầng`:""}`).join(", ");
    const buffTxt=e=>Object.keys(e?.buff??{}).map(k=>BUFFS[k].name).join(", ");
    ok(await leaveSafe(N),"N: ra khỏi làng");
    let [nx,ny]=clearDir(np.x,np.y,170); const nat=d=>[Math.round(nx*d),Math.round(ny*d)];
    async function faceN(){ [nx,ny]=clearDir(np.x,np.y,170); await step(N,nx,ny); }
    /** Hồn kỹ đánh vòng `ring` ở ô `i`: hồn thú bậc 4 cách `d` theo hướng nhìn, đứng yên bằng Choáng; nhát đầu theo năm và trạng thái. */
    async function ringN(id,ring,i,{d=30,wait=450}={}){
      const sk=ringSkill(id,ring), atk=(await stats()).atkNow;
      await test(N,"clear"); await faceN(); const bid=await spawnNear(N,4,...nat(d),20); await hush(); await test(N,"status",{s:"stun",secs:10});
      await test(N,"ready"); await castN(i,wait);
      const n=(sk.area==="around"||sk.area==="target")&&sk.n>1?sk.n:1, sts=[...(sk.status??[]),...(sk.finisher??[])].filter(a=>a.s!=="stun");
      await waitFor(()=>hitsN(bid).length>=n&&stHas(beastOf(N,bid),sts),n>1?n*(sk.every??0.15)*1000+1500:1500);
      const want=exp(atk*P10(ring)*sk.dmg), got=hitsN(bid).map(x=>x.v), b=beastOf(N,bid);
      ok(want.includes(got[0])&&got.length>=n&&N.fxs.some(f=>f.k==="soulring"&&f.i===ring),`${vname(id)} vòng ${ring+1} ${sk.name}: ${got.length}/${n} nhát, nhát đầu ${got[0]} (cần ${want.join(" hoặc ")})`);
      if(sts.length) ok(stHas(b,sts),`${sk.name}: ${stTxt(sts)} [Phá giáp ${b?.armor}, Thiêu đốt ${b?.burn}]`);
      return bid;
    }
    /** Hồn kỹ lên bản thân vòng `ring` ở ô `i`: hiệu ứng có lợi, hồi sinh lực cả đội, khiên (đang mất nửa sinh lực). */
    async function selfN(id,ring,i){
      const sk=ringSkill(id,ring), e=sk.self;
      await test(N,"clear"); await test(N,"rest",{s:30}); await test(N,"ready"); await test(N,"hurt",{pct:50}); const hp0=np.hp; await castN(i,300);
      ok(Object.keys(e.buff??{}).every(k=>hasBuff(np,k))&&(!e.heal||np.hp>hp0)&&(!e.shield||np.shield>0)&&N.fxs.some(f=>f.k==="soulring"&&f.i===ring),
        `${vname(id)} vòng ${ring+1} ${sk.name}: ${buffTxt(e)||"không hiệu ứng có lợi"}${e.heal?`, hồi ${hp0} -> ${np.hp}`:""}${e.shield?`, khiên ${np.shield}`:""}`);
    }
    const endN=async()=>{ await test(N,"clear"); await test(N,"rest",{s:30}); await waitFor(()=>np.ava===0,1500); };
    for(const id of NEW){
      ok(await lineupN(id),`N: ${vname(id)} ra trận (cấp 100, 10 hồn hoàn)`);
      ok(same(vN(id).skills??[...DEFAULT_LOADOUT],[...DEFAULT_LOADOUT])||same(loadoutOf(id,vN(id).skills),[...DEFAULT_LOADOUT]),`${vname(id)}: 4 ô mặc định vòng 1–4`);
      // Vòng 1–4 (U / I / O / P).
      for(let r=0;r<4;r++){
        const sk=ringSkill(id,r);
        if(sk.area==="self") await selfN(id,r,r);
        else {
          if(sk.self) { await test(N,"hurt",{pct:50}); }
          const hp0=np.hp; await ringN(id,r,r,{wait:sk.n>1?0:450});
          if(sk.self) ok(Object.keys(sk.self.buff??{}).every(k=>hasBuff(np,k))&&(!sk.self.heal||np.hp>hp0),`${sk.name}: lên bản thân ${buffTxt(sk.self)}${sk.self.heal?` hồi ${hp0} -> ${np.hp}`:""}`);
        }
        await test(N,"rest",{s:30});
      }
      // Tiên cơ riêng: đổi tay vào với năng lượng đầy.
      {
        const own=TIEN_CO_RIENG[id], atk=(await stats()).atkNow, other=NEW[(NEW.indexOf(id)+1)%NEW.length];
        ok(await lineupN(other),`N: ${vname(other)} ra trận, ${vname(id)} chờ`); await faceN(); await test(N,"clear");
        if(own.self?.heal){ await test(N,"hurt",{pct:50}); await sleep(150); }
        const r=await tienCo(N,rowN(id),{tier:4,dx:nat(own.area==="dash"?40:20)[0],dy:nat(own.area==="dash"?40:20)[1]});
        const w=exp(atk*own.dmg), first=hitsN(r.bid)[0]?.v, list=[...(own.status??[]),...(own.finisher??[])].filter(a=>a.s!=="stun");
        ok(r.fx?.own&&r.fx.vh===vohonIndex(id)&&w.includes(first),`tiên cơ riêng ${vname(id)} ${own.name}: sát thương ${first} (cần ${w.join(" hoặc ")})`);
        if(list.length) ok(await waitFor(()=>stHas(beastOf(N,r.bid),list),1500),`${own.name}: gây ${stTxt(list)}`);
        await test(N,"rest",{s:30});
      }
      // Vòng 5, 6, tuyệt kỹ vòng 10; Chân Thân vòng 7 (phím R).
      ok(await lineupN(id),`N: ${vname(id)} ra trận lại`); await loadoutN(id,[4,5,9,-1]); ok(same(vN(id).skills,[4,5,9,-1]),`${vname(id)} mang vòng 5, 6, 10`);
      for(const [r,i] of [[4,0],[5,1],[9,2]]){
        const sk=ringSkill(id,r);
        if(sk.area==="self") await selfN(id,r,i);
        else {
          const bf=B.fxs.length; if(sk.self) await test(N,"hurt",{pct:50}); const hp0=np.hp;
          await ringN(id,r,i,{d:sk.at?110:30,wait:sk.n>1?0:450});
          if(sk.self) ok(Object.keys(sk.self.buff??{}).every(k=>hasBuff(np,k))&&(!sk.self.heal||np.hp>hp0)&&(!sk.self.shield||np.shield>0),
            `${sk.name}: lên bản thân ${buffTxt(sk.self)}${sk.self.heal?` hồi ${hp0} -> ${np.hp}`:""}${sk.self.shield?`, khiên ${np.shield}`:""}`);
          if(sk.ult) ok(N.fxs.some(f=>f.k==="ult"&&f.name===sk.name)&&(B.room.roomId!==N.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===N.room.sessionId),800)),
            `tuyệt kỹ ${sk.name}: fx ult (người cùng phòng cũng thấy)`);
        }
        await test(N,"rest",{s:60});
      }
      {
        await endN(); const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]);
        await test(N,"ready"); await faceN(); const s0=await stats();
        const bid=await spawnNear(N,4,...nat(30),20); await hush(); await test(N,"status",{s:"stun",secs:10});
        const l=N.logs.length; N.fxs=[]; N.dmgs=[]; N.room.send("chanthan"); await waitFor(()=>N.logs.length>l,1500); await sleep(120);
        const msg=N.logs.at(-1)??"", s1=await stats();
        ok(np.ava>def.secs-1&&msg.includes(def.name)&&N.fxs.some(f=>f.k==="avatar"&&f.on),`${def.name}: ${np.ava.toFixed(1)} giây`);
        const okStat=(!cs.atk||Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.02)&&(!cs.spd||Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.02)
          &&(!cs.def||Math.abs(s1.def-s0.def-cs.def)<1e-3)&&(!cs.crit||Math.abs(s1.critB-s0.critB-cs.crit)<1e-3)&&(!cs.hp||s1.maxHp===Math.round(s0.maxHp*(1+cs.hp)));
        ok(okStat,`${def.name} × buffPower(50.000 năm): ${Object.entries(cs).map(([k,v])=>`${k} +${Math.round(v*100)}%`).join(", ")} [công ${s0.atkNow.toFixed(1)} -> ${s1.atkNow.toFixed(1)}]`);
        const bst=def.burst, sts=(bst.status??[]).filter(a=>a.s!=="stun"), want=exp(s1.atkNow*P10(6)*bst.dmg);
        await waitFor(()=>hitsN(bid).length&&stHas(beastOf(N,bid),sts),1000);
        ok(want.includes(hitsN(bid)[0]?.v)&&stHas(beastOf(N,bid),sts),`biến hình: ${hitsN(bid)[0]?.v} (cần ${want.join(" hoặc ")}), ${stTxt(bst.status)||"không trạng thái"}`);
        await endN();
      }
    }
    // Mảnh rơi đúng bản đồ: hạ hồn thú ở Thánh Hồn Thôn (hook shard cố định võ hồn A Ngân) thì +1 mảnh A Ngân vào túi người hạ.
    // Lạc Nhật / Cực Bắc: phần BĐ6b / BĐ6c hạ hồn thú với từng võ hồn của bản đồ (gồm Liệt Hỏa Thương Lang, Băng Phượng Hoàng).
    {
      const list=MAPS[N.room.state.mapId].shards, i=list.indexOf("a_ngan"), code=shardCode("a_ngan"), q0=qtyOf(N,code);
      await test(N,"clear"); await test(N,"shard",{r:0,i}); await test(N,"beast",{dx:14,dy:0,years:200}); await test(N,"slay");
      ok(N.room.state.mapId==="thanh_hon_thon"&&i>=0&&await waitFor(()=>qtyOf(N,code)===q0+1,1500),`Thánh Hồn Thôn: hạ hồn thú 200 năm rơi 1 Mảnh A Ngân (${q0} -> ${qtyOf(N,code)})`);
      await test(N,"shard",{r:-1}); await test(N,"clear");
    }
    // Thoát vào lại: 4 võ hồn mới vẫn sở hữu, đội và ô mang theo giữ nguyên.
    await N.room.leave(); await sleep(500); await enter(N); await waitFor(()=>N.owned);
    ok(NEW.every(id=>vN(id)?.level===100&&same(vN(id).skills,[4,5,9,-1]))&&N.owned.team.every(r=>NEW.some(id=>rowN(id)===r)),"thoát vào lại: 4 võ hồn mới, đội và ô mang theo còn nguyên");
    await N.room.leave();
  
}

// 9.5: hiệu ứng hồn kỹ theo sao võ hồn (STAR_SKILL, 4★ hồi chiêu, 6★ tiên cơ riêng)
export async function ab2Block6(ctx) {
  const { clearDir, dmgsOn, exp, leaveSafe, meOf, spawnNear, sqOf, vname } = ctx;


    const near=(a,b)=>Math.abs(a-b)<1e-9;
    ok(near(starSkillMult(1),1)&&near(starSkillMult(2),1+STAR_SKILL)&&near(starSkillMult(MAX_STARS),1.15)&&near(starSkillMult(0),1)&&near(starSkillMult(99),1.15)
      &&starCdMult(STAR_CD_STARS-1)===1&&starCdMult(STAR_CD_STARS)===STAR_CD&&starCdMult(MAX_STARS)===STAR_CD
      &&near(starTienCoMult(STAR_TIEN_CO_STARS-1),starSkillMult(STAR_TIEN_CO_STARS-1))&&near(starTienCoMult(MAX_STARS),1.15+STAR_TIEN_CO)
      &&starRing(0)&&starRing(STAR_SKILL_RINGS-1)&&!starRing(STAR_SKILL_RINGS),
      `hàm thuần: hồn kỹ vòng 1–${STAR_SKILL_RINGS} +${Math.round(STAR_SKILL*100)}%/sao (6★ ×${starSkillMult(6)}), từ ${STAR_CD_STARS}★ hồi chiêu ×${STAR_CD}, tiên cơ riêng 6★ ×${starTienCoMult(6).toFixed(2)}`);
    const S=await bot("Tester Sao","yeu_ho",{sex:1,hair:2,hairCol:3,outfitCol:1});
    await waitFor(()=>S.owned&&S.squad&&meOf(S)); const sp=meOf(S), V="cuu_tinh_that_sat_kiem";
    await test(S,"grant",{vohon:V});
    const rowS=id=>S.owned.list.find(v=>v.vohon===id).rowId, vS=id=>S.owned.list.find(v=>v.vohon===id);
    const Y=[423,764,1760], sk=skillsOf(V)[0], own=TIEN_CO_RIENG[V], P=skillPower(Y[0]);
    await test(S,"set",{rowId:rowS(V),level:30,xp:0,rings:Y,stars:1});
    await sendTeam(S,[rowS(V),0,0,0]); await sendTeam(S,[rowS(V),rowS("yeu_ho"),0,0]);
    ok(S.owned.active===rowS(V)&&await waitFor(()=>sp.vh===vohonIndex(V))&&vS(V).stars===1,`S: ${vname(V)} ra trận (cấp 30, 3 hồn hoàn, 1★), ${vname("yeu_ho")} dự bị`);
    ok(await leaveSafe(S),"S: ra khỏi làng");
    const stats=async()=>(await test(S,"stats")).live;
    const hits=bid=>dmgsOn(S,bid);
    async function setStars(stars){ await test(S,"set",{rowId:rowS(V),stars}); return waitFor(()=>vS(V)?.stars===stars,1500); }
    // Cùng hồn kỹ vòng 1 (Thất Sát Kiếm Khí, nửa trước mặt) ở mỗi mức sao: nhát đầu lên hồn thú đứng yên, hồi chiêu ngay sau khi tung.
    async function cast(stars){
      await setStars(stars); await test(S,"clear"); await test(S,"ready");
      const [dx,dy]=clearDir(sp.x,sp.y,110); await step(S,dx,dy);
      const bid=await spawnNear(S,1,Math.round(dx*30),Math.round(dy*30),20); await test(S,"status",{s:"stun",secs:10,all:true});
      // Hồi chiêu đọc ở bản vá state đầu tiên có hồi chiêu (tin dmg có thể tới trước; đọc sau một khoảng cố định thì đã trôi bớt).
      const atk=(await stats()).atkNow; S.dmgs=[]; S.room.send("skill",{i:0}); let cd=0;
      await waitFor(()=>{ cd=Math.max(cd,sp.cds[0]??0); return hits(bid).length&&cd>0; },1500);
      return {v:hits(bid)[0]?.v,atk,cd,want:exp(atk*P*starSkillMult(stars)*sk.dmg)};
    }
    const r1=await cast(1), r4=await cast(4), r6=await cast(6);
    ok(r1.want.includes(r1.v)&&Math.abs(r1.cd-sk.cd)<0.25,`1★ ${sk.name}: ${r1.v} (cần ${r1.want.join(" hoặc ")}), hồi ${r1.cd.toFixed(2)} giây (cần ${sk.cd})`);
    ok(r4.want.includes(r4.v)&&Math.abs(r4.cd-sk.cd*STAR_CD)<0.25&&r4.cd<r1.cd-0.2,
      `4★: ${r4.v} (cần ${r4.want.join(" hoặc ")}, hồn kỹ ×${starSkillMult(4)}), hồi chiêu ngắn hơn ${r4.cd.toFixed(2)} giây (cần ${(sk.cd*STAR_CD).toFixed(2)})`);
    ok(r6.want.includes(r6.v)&&Math.abs(r6.cd-sk.cd*STAR_CD)<0.25,`6★: ${r6.v} (cần ${r6.want.join(" hoặc ")}, hồn kỹ ×${starSkillMult(6)} và công ×${starMult(6)} của STAR_STAT)`);
    // Tỉ lệ nhát đầu 6★ / 1★ = công (STAR_STAT, cộng minh) × starSkillMult(6); cả hai không chí mạng thì so thẳng.
    if(r1.v===r1.want[0]&&r6.v===r6.want[0]){ const k=(r6.atk/r1.atk)*starSkillMult(6);
      ok(Math.abs(r6.v/r1.v-k)<2/r1.v+0.01,`tỉ lệ 6★ / 1★: ${(r6.v/r1.v).toFixed(3)} (cần ${k.toFixed(3)} = công ${(r6.atk/r1.atk).toFixed(3)} × ${starSkillMult(6)})`); }
    // Mọi hồn kỹ vòng 1–4 đều nhận: ô I (vòng 2) cũng hồi chiêu ngắn hơn ở 6★.
    { await test(S,"ready"); const s2=skillsOf(V)[1]; const bid=await spawnNear(S,1,20,0,20); await test(S,"status",{s:"stun",secs:10,all:true});
      S.room.send("skill",{i:1}); await waitFor(()=>sp.cds[1]>0,1500);
      ok(Math.abs(sp.cds[1]-s2.cd*STAR_CD)<0.25,`6★ ${s2.name} (vòng 2): hồi ${sp.cds[1].toFixed(2)} giây (cần ${(s2.cd*STAR_CD).toFixed(2)})`); if(bid) await test(S,"clear"); }
    // Tiên cơ riêng (Thất Sát Kiếm Vực, quanh thân): 1★ ×1, 6★ ×starTienCoMult(6) = 1,15 + 0,2.
    async function tc(stars){
      await setStars(stars); await test(S,"clear"); await test(S,"energy",{v:0});
      await waitFor(()=>sp.swCd===0,4000); S.room.send("switch",{slot:1}); await waitFor(()=>S.owned.active===rowS("yeu_ho"),2000);
      await test(S,"rest",{s:1}); await waitFor(()=>sp.swCd===0,4000);
      await test(S,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sqOf(S,rowS(V))?.en===TIEN_CO_MAX,1500);
      await test(S,"clear"); const bid=await spawnNear(S,1,20,0,20); S.dmgs=[];
      S.room.send("switch",{slot:0}); await waitFor(()=>S.owned.active===rowS(V)&&hits(bid).length,2000); await sleep(80);
      const atk=(await stats()).atkNow;
      return {v:hits(bid)[0]?.v,want:exp(atk*own.dmg*starTienCoMult(stars))};
    }
    const t1=await tc(1), t6=await tc(6);
    ok(t1.want.includes(t1.v),`tiên cơ riêng 1★ ${own.name}: ${t1.v} (cần ${t1.want.join(" hoặc ")})`);
    ok(t6.want.includes(t6.v),`tiên cơ riêng 6★: ${t6.v} (cần ${t6.want.join(" hoặc ")}, ×${starTienCoMult(6).toFixed(2)} = hồn kỹ +15% và 6★ +${Math.round(STAR_TIEN_CO*100)}%)`);
    // Sao lưu DB (vohons.stars, có từ 3.4): thoát vào lại vẫn 6★.
    await S.room.leave(); await sleep(500); await enter(S); await waitFor(()=>S.owned);
    ok(vS(V)?.stars===6,`thoát vào lại: ${vname(V)} vẫn ${vS(V)?.stars}★`);
    await S.room.leave();
  
}

// 9.6: hồn kỹ Chân Thân (ChanThanDef.skill: ô P đổi thành hồn kỹ này trong lúc biến hình, hồi chiêu riêng)
export async function ab2Block7(ctx) {
  const { beastOf, clearDir, dmgsOn, exp, hasSt, leaveSafe, meOf, spawnNear, vname } = ctx;


    // Hàm thuần: đủ 25 võ hồn, 40 hồn lực, hồi 8 giây; mạnh hơn vòng 9 khoảng 20% (tổng hệ số sát thương), cùng lối đánh.
    const tot=s=>s.dmg*(s.n??1);
    const bad=VOHON.filter(v=>{ const ct=chanThanOf(v.id)?.skill, r9=ringSkill(v.id,8); if(!ct||ct.cost!==CHAN_THAN_SKILL_COST||ct.cd!==CHAN_THAN_SKILL_CD||!r9) return true;
      if(tot(r9)>0&&Math.abs(tot(ct)/tot(r9)-1.2)>0.05) return true;
      if(v.he==="phu_tro"&&!(ct.self&&(ct.self.heal||ct.self.shield||ct.self.buff))) return true;
      if(v.he==="khong_che"&&!((ct.area==="around"||(ct.area==="proj"&&ct.spread>=360))&&[...(ct.status??[]),...(ct.finisher??[])].some(a=>["stun","root","silence","lock","allure","slow"].includes(a.s)))) return true;
      return false; });
    ok(VOHON.length===25&&!bad.length&&CHAN_THAN_SKILL_SLOT===3,
      `cả ${VOHON.length} võ hồn có hồn kỹ Chân Thân (${CHAN_THAN_SKILL_COST} hồn lực, hồi ${CHAN_THAN_SKILL_CD} giây, ×1,2 vòng 9, đúng lối đánh)${bad.length?` – lỗi: ${bad.map(v=>v.id).join(", ")}`:""}`);
    const C=await bot("Tester CTS","yeu_ho",{sex:0,hair:3,hairCol:2,outfitCol:4});
    await waitFor(()=>C.owned&&C.squad&&meOf(C)); const cp=meOf(C), V="bang_phuong_hoang", def=chanThanOf(V), ct=def.skill, sP=skillsOf(V)[3];
    await test(C,"grant",{vohon:V});
    const rowC=id=>C.owned.list.find(v=>v.vohon===id).rowId;
    const Y=[423,764,1760,5000,12000,20000,50000,100000,100000,100000];
    await test(C,"set",{rowId:rowC(V),level:100,xp:0,rings:Y});
    await sendTeam(C,[rowC(V),0,0,0]); await sendTeam(C,[rowC(V),rowC("yeu_ho"),0,0]);
    ok(C.owned.active===rowC(V)&&await waitFor(()=>cp.vh===vohonIndex(V))&&!bondsOf([V,"yeu_ho"]).length,`C: ${vname(V)} ra trận (cấp 100, 10 hồn hoàn), ô P mặc định ${sP.name}`);
    ok(await leaveSafe(C),"C: ra khỏi làng");
    const stats=async()=>(await test(C,"stats")).live, hush=()=>test(C,"status",{s:"silence",secs:20,all:true});
    // Chờ fx soulring (hồn kỹ đã tung) rồi chờ nhát đầu lên hồn thú `bid` và bản vá state (tin tới trước bản vá state).
    async function castP(bid){ C.dmgs=[]; C.fxs=[]; C.room.send("skill",{i:CHAN_THAN_SKILL_SLOT});
      if(!bid){ await sleep(300); return; }
      await waitFor(()=>C.fxs.some(f=>f.k==="soulring"),1500); await waitFor(()=>dmgsOn(C,bid).length,1000); await sleep(150); }
    async function arena(){ await test(C,"clear"); const [dx,dy]=clearDir(cp.x,cp.y,110); await step(C,dx,dy);
      const bid=await spawnNear(C,4,Math.round(dx*30),Math.round(dy*30),20); await hush(); return bid; }
    // Chưa Chân Thân: ô P là hồn kỹ vòng 4 đang mang.
    await test(C,"ready"); let bid=await arena(); let atk=(await stats()).atkNow; await castP(bid);
    let want=exp(atk*skillPower(Y[3])*sP.dmg);
    ok(want.includes(dmgsOn(C,bid)[0]?.v)&&C.fxs.some(f=>f.k==="soulring"&&f.i===3&&!f.ct)&&Math.abs(cp.cds[3]-sP.cd)<0.5&&cp.ctCd===0,
      `chưa Chân Thân: ô P tung ${sP.name} ${dmgsOn(C,bid)[0]?.v} (cần ${want.join(" hoặc ")}), hồi ô P ${cp.cds[3].toFixed(1)} giây`);
    // Chân Thân: ô P thành hồn kỹ Chân Thân, dù hồn kỹ ô P cũ đang hồi chiêu; hồi chiêu riêng, không đụng hồi chiêu ô P cũ.
    bid=await arena(); const l=C.logs.length; C.room.send("chanthan"); await waitFor(()=>C.logs.length>l&&cp.ava>0,1500); await sleep(600);
    atk=(await stats()).atkNow; const mp0=cp.mp, cd0=cp.cds[3]; await castP(bid); await waitFor(()=>cp.ctCd>0,800);
    want=exp(atk*skillPower(Y[CHAN_THAN_RING-1])*ct.dmg);
    ok(cp.ava>0&&want.includes(dmgsOn(C,bid)[0]?.v)&&C.fxs.some(f=>f.k==="soulring"&&f.ct&&f.i===CHAN_THAN_RING-1),
      `đang Chân Thân: ô P tung ${ct.name} ${dmgsOn(C,bid)[0]?.v} (cần ${want.join(" hoặc ")}: công đã tăng × sức mạnh hồn hoàn vòng 7 ×${skillPower(Y[6])})`);
    ok(C.fxs.some(f=>(f.k==="wave"||f.k==="burst")&&f.id===C.room.sessionId),`${ct.name}: fx nổ (wave / burst) mang id người tung (tiếng T3 pha boom)`);
    ok(Math.abs(cp.ctCd-ct.cd)<0.5&&cp.cds[3]>0&&cp.cds[3]<=cd0&&mp0-cp.mp>ct.cost-30&&mp0-cp.mp<=ct.cost+1, // hồn lực tự hồi tới ~28/giây ở cấp 100 trong lúc chờ
      `hồi chiêu riêng ${cp.ctCd.toFixed(1)} giây (cần ${ct.cd}), ô P cũ vẫn ${cp.cds[3].toFixed(1)} giây (trước ${cd0.toFixed(1)}), hồn lực ${mp0} -> ${cp.mp} (tốn ${ct.cost}, trừ phần tự hồi)`);
    ok(await waitFor(()=>hasSt(beastOf(C,bid),"vuln")&&hasSt(beastOf(C,bid),"slow"),800),`${ct.name}: khống chế diện rộng (Choáng, Làm chậm, Dễ thương)`);
    await castP(); ok(!C.fxs.some(f=>f.k==="soulring")&&cp.ava>0,"hồn kỹ Chân Thân đang hồi chiêu: ô P không tung");
    // Hết Chân Thân: ô P trở lại hồn kỹ vòng 4.
    await test(C,"rest",{s:Math.ceil(cp.ava)+1}); ok(await waitFor(()=>cp.ava===0,3000),"hết Chân Thân");
    await test(C,"ready"); bid=await arena(); atk=(await stats()).atkNow; await castP(bid);
    want=exp(atk*skillPower(Y[3])*sP.dmg);
    ok(want.includes(dmgsOn(C,bid)[0]?.v)&&C.fxs.some(f=>f.k==="soulring"&&f.i===3&&!f.ct)&&cp.ctCd===0,
      `hết Chân Thân: ô P về ${sP.name} ${dmgsOn(C,bid)[0]?.v} (cần ${want.join(" hoặc ")})`);
    await C.room.leave();
  
}

// 3.5: chiêu có báo trước của hồn thú từ 1.000 năm
export async function ab2Block8(ctx) {
  const { VILLAGE_RY, beastOf, blocked, goTo, inSafeOf, leaveSafe, meOf, safe, tienCo } = ctx;


    // Hàm thuần: mọi loài của vùng có hồn thú từ 1.000 năm ở Ngoại vi / Nội địa đều có chiêu; hình vùng tính trúng đúng.
    const zonesOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[])
      .filter(o=>(o.type??o.class)==="zone").map(o=>{ const pr=n=>(o.properties??[]).find(q=>q.name===n)?.value;
        return {yr:parseLevelRange(pr("years")),sp:String(pr("beasts")??"").split(",").map(x=>x.split(":")[0].trim()).filter(Boolean)}; });
    const need=new Set(), miss=[];
    for(const m of ["tinh_dau_ngoai_vi","tinh_dau_noi_dia","cuc_bac_chi_dia"]) for(const z of zonesOf(m)) if(z.yr[1]>=BEAST_SKILL_YEARS)
      for(const sp of z.sp){ need.add(sp); if(!beastSkillOf(sp,Math.max(BEAST_SKILL_YEARS,z.yr[0]))) miss.push(sp); }
    ok(need.size>=27&&!miss.length,`mọi loài từ 1.000 năm ở Ngoại vi / Nội địa / Cực Bắc có chiêu báo trước (${need.size} loài)`+(miss.length?`: thiếu ${miss.join(", ")}`:""));
    ok(!beastSkillOf("liet_trao_hung",999)&&beastSkillOf("quy_dang",1200)?.name==="Quật Roi"&&beastSkillOf("quy_dang",3000)?.name==="Rễ Trói",
      "dưới 1.000 năm chỉ đánh thường; Quỷ Đằng ngàn năm (từ 1.500 năm) dùng Rễ Trói thay Quật Roi");
    const L={shape:"line",x:0,y:0,ang:0,r:100,w:14,arc:0}, C={...L,shape:"cone",r:50,arc:90}, R={...L,shape:"circle",r:30};
    ok(teleHits(L,50,7+TELE_PAD)&&!teleHits(L,50,12+TELE_PAD)&&!teleHits(L,-10,0)&&!teleHits(L,110,0)&&teleHits(C,30,20)&&!teleHits(C,0,30)
      &&teleHits(R,0,30+TELE_PAD)&&!teleHits(R,0,36),"teleHits: vệt, nón, vòng (người chơi là hình tròn bán kính TELE_PAD)");

    const F=await bot("Tester F","lam_dien_ba_vuong_long",{sex:1,hair:1,hairCol:1,outfitCol:2});
    await waitFor(()=>F.owned&&F.squad&&meOf(F)); const fm=meOf(F), fid=F.room.sessionId, act=F.owned.active;
    await test(F,"set",{rowId:act,level:40,xp:0,rings:[423,764,1760,5000]});
    ok(await leaveSafe(F),"F: ra khỏi làng");
    const ry=VILLAGE_RY, X0=safe.x+safe.width+140; ok(await goTo(F,X0,ry),`F tới đường làng phía đông (${fm.x.toFixed(0)},${fm.y.toFixed(0)})`);
    const hasP=s=>(fm.st&statusBit(s))!==0, distB=bid=>{ const q=beastOf(F,bid); return q?Math.hypot(q.x-fm.x,q.y-fm.y):-1; };
    /** Sinh hồn thú loài `sp` `years` năm cách F (dx, dy) (hook spawn nhận species), sau khi dọn hồn thú quanh F.
     *  Nhận ra con mới theo id chưa có trước đó: hồn thú vừa sinh đã nhắm F và đi tới (hơn 6 pixel khi server bận) trước khi bị Trói. */
    async function spawnSp(sp,years,dx,dy=0){ await test(F,"clear"); const before=new Set(F.room.state.beasts.keys()), x=fm.x+dx, y=fm.y+dy; let id=null;
      const r=await test(F,"spawn",{tier:tierOfYears(years),years,species:sp,dx,dy});
      await waitFor(()=>{ if(r?.bid) return F.room.state.beasts.has(r.bid)&&(id=r.bid);
        F.room.state.beasts.forEach((o,k)=>{ if(!before.has(k)&&Math.hypot(o.x-x,o.y-y)<30&&BEASTS[o.species]?.id===sp) id=k; }); return id; });
      if(!id) console.log(`  ⚠ spawnSp: không thấy ${sp} quanh ${x.toFixed(0)},${y.toFixed(0)}`);
      return id; }
    /** Hồn thú gần nhất báo trước chiêu (hook tele), chạy `during` trong lúc báo trước, chờ fx teleHit (hoặc teleEnd: bị ngắt). */
    async function teleRun(bid,during){ F.fxs=[]; F.hurts=[]; const t0=Date.now(), r=await test(F,"tele");
      const tele=F.fxs.find(f=>f.k==="tele"&&f.bid===bid), cast=F.room.state.beasts.get(bid)?.cast;
      if(during) await during();
      await waitFor(()=>F.fxs.some(f=>(f.k==="teleHit"||f.k==="teleEnd")&&f.bid===bid),2500);
      const hit=F.fxs.find(f=>f.k==="teleHit"&&f.bid===bid), ms=Date.now()-t0; await sleep(120);
      return {r,tele,cast,hit,ms,end:F.fxs.some(f=>f.k==="teleEnd"&&f.bid===bid),hurts:F.hurts.filter(h=>h.c!=="#8ef08a")}; }

    // Vòng quanh thân (Liệt Trảo Hùng · Vỗ Đất): đứng trong vùng thì trúng sau 0,8 giây. Hồn thú bị Trói (không ngắt chiêu) để đứng yên.
    const VD=beastSkillOf("liet_trao_hung",1500), base=beastStats(1500).dmg*VD.dmg*VOHON[fm.vh].def;
    let bid=await spawnSp("liet_trao_hung",1500,30); await test(F,"status",{s:"root",secs:30});
    let x=await teleRun(bid);
    ok(x.r?.name===VD.name&&x.tele?.shape==="circle"&&x.tele.r===VD.r&&x.tele.t===TELE_WARN&&x.cast===true,
      `fx tele: ${x.tele?.name} vòng quanh thân r=${x.tele?.r}, báo trước ${x.tele?.t} giây; BeastState.cast = ${x.cast}`);
    const hv=-(x.hurts[0]?.v??0);
    ok(x.hit?.hit.includes(fid)&&x.ms>=TELE_WARN*1000-100&&hv>=Math.floor(base*0.9)&&hv<=Math.ceil(base*1.1),
      `đứng trong vùng: trúng ${VD.name} sau ${x.ms} ms, mất ${hv} (cần ${Math.round(base*0.9)}–${Math.round(base*1.1)})`);
    // Né bằng cách ra khỏi vùng trước khi hết 0,8 giây: dịch ngay (hook goto) và chạy bộ thật.
    bid=await spawnSp("liet_trao_hung",1500,30); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid,()=>test(F,"goto",{x:fm.x-60,y:fm.y}));
    ok(x.hit&&!x.hit.hit.includes(fid)&&!x.hurts.length,`ra khỏi vùng (cách ${distB(bid).toFixed(0)} pixel) trước khi tung: không trúng`);
    await goTo(F,X0,ry);
    bid=await spawnSp("liet_trao_hung",1500,30); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid,async()=>{ F.room.send("input",{x:-1,y:0}); await sleep(850); F.room.send("input",{x:0,y:0}); });
    ok(x.hit&&!x.hit.hit.includes(fid)&&!x.hurts.length,`chạy bộ ra khỏi vùng trong lúc báo trước: không trúng (tung sau ${x.ms} ms, cách ${distB(bid).toFixed(0)} pixel)`);
    // Vùng an toàn: đứng trong làng, vẫn nằm trong vòng của hồn thú ngoài làng, không trúng.
    await goTo(F,safe.x+safe.width+4,ry); bid=await spawnSp("liet_trao_hung",1500,26); await test(F,"status",{s:"root",secs:30});
    await test(F,"goto",{x:safe.x+safe.width-6,y:ry}); ok(inSafeOf(F),"F đứng mép trong làng");
    x=await teleRun(bid); const db=distB(bid);
    ok(x.hit&&db>=0&&db<VD.r&&!x.hit.hit.includes(fid)&&!x.hurts.length,`vùng an toàn: trong vòng (cách ${db.toFixed(0)} < ${VD.r}) nhưng không trúng`);
    await goTo(F,X0,ry);
    // Vệt dài (Mạn Đà La Xà · Phun Độc): trúng thì Trúng độc trên hồn sư, mất máu mỗi giây; né ngang khỏi vệt.
    const PD=beastSkillOf("man_da_la_xa",1500);
    bid=await spawnSp("man_da_la_xa",1500,40); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid);
    ok(x.tele?.shape==="line"&&x.hit?.hit.includes(fid)&&hasP("poison"),`${PD.name}: vệt dài ${x.tele?.r}, trúng, Trúng độc trên hồn sư (st ${fm.st})`);
    F.hurts=[]; ok(await waitFor(()=>F.hurts.some(h=>h.c==="#8ef08a"),1600),`Trúng độc: mất ${-(F.hurts.find(h=>h.c==="#8ef08a")?.v??0)} sinh lực mỗi giây`);
    const side=blocked(fm.x,fm.y+30)?-30:30;
    bid=await spawnSp("man_da_la_xa",1500,40); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid,()=>test(F,"goto",{x:fm.x,y:fm.y+side}));
    ok(x.hit&&!x.hit.hit.includes(fid)&&!x.hurts.length,`bước ngang ${Math.abs(side)} pixel khỏi vệt: không trúng`);
    await goTo(F,X0,ry);
    // Trói trên hồn sư (Nhân Diện Ma Chu · Phun Tơ): không đi được tới khi hết Trói.
    const PT=beastSkillOf("nhan_dien_ma_chu",3000);
    bid=await spawnSp("nhan_dien_ma_chu",3000,40); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid); const x1=fm.x;
    F.room.send("input",{x:-1,y:0}); await sleep(700); const moved=Math.abs(fm.x-x1);
    ok(x.hit?.hit.includes(fid)&&hasP("root")&&moved<1,`${PT.name}: hồn sư bị Trói, đi không được (dịch ${moved.toFixed(1)} pixel)`);
    ok(await waitFor(()=>!hasP("root")&&Math.abs(fm.x-x1)>4,2000),`hết Trói ${PT.status[0].secs} giây thì đi được`); F.room.send("input",{x:0,y:0});
    await goTo(F,X0,ry);
    // Mê hoặc / Đóng băng riêng trên hồn sư (#116). Thực Nhân Hoa (đứng yên) · Phấn Mê trúng thì Mê hoặc, không còn là Choáng.
    const PM=beastSkillOf("thuc_nhan_hoa",10000);
    bid=await spawnSp("thuc_nhan_hoa",10000,30); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid);
    ok(PM.status[0].s==="charm"&&x.hit?.hit.includes(fid)&&hasP("charm")&&!hasP("stun"),`${PM.name}: trúng thì Mê hoặc trên hồn sư (st ${fm.st})`);
    await test(F,"clear"); await goTo(F,X0,ry); await waitFor(()=>!hasP("charm"),1500);
    // Mê hoặc: phím bị bỏ qua, server tự đi lung tung quanh chỗ bị Mê hoặc (PLAYER_CHARM), PlayerState.spd = 0 (client không dự đoán);
    // không dùng được hồn kỹ. Hết Mê hoặc thì đi theo phím lại.
    { await test(F,"pst",{s:"charm",secs:3}); const c0={x:fm.x,y:fm.y}; let far=0, spd0=true;
      F.room.send("input",{x:-1,y:0}); await test(F,"ready"); F.room.send("skill",{i:0});
      ok(await lastLog(F,/Mê hoặc: không dùng được hồn kỹ/)&&fm.cds[0]===0,"Mê hoặc trên hồn sư: không dùng được hồn kỹ");
      await waitFor(()=>{ far=Math.max(far,Math.hypot(fm.x-c0.x,fm.y-c0.y)); spd0&&=!hasP("charm")||fm.spd===0; return !hasP("charm"); },4000);
      const x2=fm.x; ok(await waitFor(()=>fm.x<x2-4,1500),"hết Mê hoặc: đi theo phím lại"); F.room.send("input",{x:0,y:0});
      ok(far>2&&far<=PLAYER_CHARM.r*Math.SQRT2+3&&spd0,`Mê hoặc: tự đi lung tung quanh chỗ đứng (xa nhất ${far.toFixed(1)} pixel, tối đa ${(PLAYER_CHARM.r*Math.SQRT2).toFixed(0)}), bỏ qua phím, spd đồng bộ 0`); }
    await goTo(F,X0,ry);
    // Đóng băng (Hàn Băng Địa Long · Phun Băng là Đóng băng): không đi, không dùng hồn kỹ; hết giờ thì đi được.
    { const FB=beastSkillOf("han_bang_dia_long",30000); await test(F,"pst",{s:"freeze",secs:1.5}); const z0=fm.x;
      F.room.send("input",{x:-1,y:0}); await sleep(500); await test(F,"ready"); F.room.send("skill",{i:0});
      ok(FB.status[0].s==="freeze"&&hasP("freeze")&&!hasP("stun")&&Math.abs(fm.x-z0)<1&&fm.spd===0&&await lastLog(F,/Đóng băng: không dùng được hồn kỹ/)&&fm.cds[0]===0,
        `Đóng băng (${FB.name}): đứng yên (dịch ${Math.abs(fm.x-z0).toFixed(1)} pixel), không dùng được hồn kỹ`);
      ok(await waitFor(()=>!hasP("freeze")&&Math.abs(fm.x-z0)>4,2500),"hết Đóng băng thì đi được"); F.room.send("input",{x:0,y:0}); }
    await goTo(F,X0,ry);
    // Câm lặng trên hồn thú ngắt chiêu đang báo trước; hồn thú dưới 1.000 năm không có chiêu.
    bid=await spawnSp("liet_trao_hung",1500,30); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid,()=>test(F,"status",{s:"silence",secs:3}));
    ok(x.end&&!x.hit&&!x.hurts.length&&beastOf(F,bid)?.cast===false,"Câm lặng ngắt chiêu báo trước (fx teleEnd, không tung)");
    bid=await spawnSp("liet_trao_hung",999,30); const no=await test(F,"tele");
    ok(bid&&!no?.name,"hồn thú 999 năm không có chiêu báo trước");
    // Tự tung: hồn thú có mục tiêu tự chọn lúc tung chiêu (không dùng hook).
    bid=await spawnSp("liet_trao_hung",1500,30); F.fxs=[];
    ok(await waitFor(()=>F.fxs.some(f=>f.k==="tele"&&f.bid===bid),(TELE_FIRST[1]+3)*1000),`hồn thú tự tung ${VD.name} sau khi có mục tiêu`);
    await test(F,"clear");
    // Câm lặng trên hồn sư chặn hồn kỹ; tiên cơ Xúc Xích (Thanh Tâm Hương Tràng) giải khống chế.
    await test(F,"grant",{vohon:"xuc_xich"}); const xr=F.owned.list.find(v=>v.vohon==="xuc_xich")?.rowId;
    await test(F,"set",{rowId:xr,level:40,xp:0,rings:[423]}); await test(F,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(F,[act,xr,0,0]);
    await test(F,"pst",{s:"silence",secs:20}); await test(F,"pst",{s:"root",secs:20}); await test(F,"ready");
    F.room.send("skill",{i:0}); ok(hasP("silence")&&hasP("root")&&await lastLog(F,/Câm lặng: không dùng được hồn kỹ/)&&fm.cds[0]===0,"Câm lặng trên hồn sư: không dùng được hồn kỹ");
    await test(F,"pst",{s:"freeze",secs:20}); // #116: thanh tẩy giải cả Đóng băng
    const tc=await tienCo(F,xr,{tier:-1});
    ok(tc.fx&&await waitFor(()=>fm.st===0,800),`tiên cơ ${TIEN_CO_RIENG.xuc_xich.name}: giải Trói, Câm lặng và Đóng băng (st ${fm.st})`);
    // Thiên Càn Bạch Ngọc Đỉnh (2.5d): tiên cơ thanh tẩy đội.
    await test(F,"grant",{vohon:"thien_can_bach_ngoc_dinh"}); const tr=F.owned.list.find(v=>v.vohon==="thien_can_bach_ngoc_dinh")?.rowId;
    await test(F,"set",{rowId:tr,level:40,xp:0,rings:[423]}); await test(F,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(F,[xr,tr,0,0]);
    await test(F,"pst",{s:"poison",n:2,secs:20}); await test(F,"pst",{s:"slow",secs:20}); await test(F,"pst",{s:"charm",secs:20}); // #116: cả Mê hoặc
    const tt=await tienCo(F,tr,{tier:-1});
    ok(tt.fx&&await waitFor(()=>fm.st===0,800),`tiên cơ ${TIEN_CO_RIENG.thien_can_bach_ngoc_dinh.name}: thanh tẩy Trúng độc, Làm chậm và Mê hoặc (st ${fm.st})`);
    await F.room.leave();
  
}

// BĐ4: tinh anh (biến dị)
export async function ab2Block9(ctx) {
  const { VILLAGE_RY, blocked, meOf, safe, spawnObj, st } = ctx;


    // Dữ liệu: mỗi tầng niên hạn (các vùng cùng `years`; bản đồ cũ mỗi vùng một tầng, bản đồ lớn tools/maps chia tầng thành vài vùng có
    // tên, 11.3) của các bản đồ săn có đúng 1 object `elite`; mã trong BOSSES, 2 chiêu, loài gốc có trong BEASTS.
    const objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
    const inR=(r,x,y)=>x>=r.x&&x<=r.x+(r.width??r.w)&&y>=r.y&&y<=r.y+(r.height??r.h);
    const bad=[];
    for(const m of ["thanh_hon_thon","tinh_dau_ngoai_vi","tinh_dau_noi_dia","lac_nhat_sam_lam","cuc_bac_chi_dia","hai_than_dao"]){ // BĐ6b thêm Lạc Nhật, BĐ6c Cực Bắc, BĐ6d Hải Thần Đảo
      const os=objsOf(m), zs=os.filter(o=>o.type==="zone"), es=os.filter(o=>o.type==="elite");
      const yr=z=>z.properties.find(q=>q.name==="years")?.value;
      for(const y of new Set(zs.map(yr))){ const k=es.filter(e=>zs.some(z=>yr(z)===y&&inR(z,e.x+e.width/2,e.y+e.height/2))).length; if(k!==1) bad.push(`${m}/${y} năm: ${k}`); }
      for(const e of es){ const id=e.properties.find(q=>q.name==="boss")?.value, d=BOSSES[bossIndex(id)]; if(!d||d.rank!==1||d.skills.length!==2||beastIndex(d.species)<0) bad.push(`${m}/${id}`); }
    }
    ok(!bad.length,`mỗi tầng niên hạn của 6 bản đồ săn có đúng 1 tinh anh (BOSSES, 2 chiêu, loài gốc có thật)`+(bad.length?`: ${bad.join("; ")}`:""));
    ok([[1,1],[2,1.6],[4,2.8],[10,6.4],[20,12.4]].every(([n,v])=>Math.abs(bossHpMult(n)-v)<1e-9),"hệ số máu theo số người đúng bảng 5.4 (x1 / x1,6 / x2,8 / x6,4 / x12,4)");
    const GT=BOSSES[bossIndex("huyet_gai_quy_dang")].skills[0], gz=teleZones(GT,0,0,100,0), TL=BOSSES[bossIndex("hac_sat_quy_ho")].skills[0], tz=teleZones(TL,0,0,100,0);
    ok(gz.length===3&&gz.map(z=>Math.round(z.x)).join()===`${100-GT.step},100,${100+GT.step}`&&tz.length===3&&Math.abs(tz[2].ang-tz[0].ang-TL.spread*Math.PI/180)<1e-9,
      `chiêu nhiều vùng: ${GT.name} 3 vòng thành hàng (${gz.map(z=>Math.round(z.x)).join(", ")}), ${TL.name} 3 vệt tỏa ${TL.spread}°`);

    const G=await bot("Tester G","thien_can_bach_ngoc_dinh",{sex:0,hair:2,hairCol:4,outfitCol:5}), H=await bot("Tester H","tu_vong_chu_hoang",{sex:1,hair:3,hairCol:1,outfitCol:0});
    await waitFor(()=>G.owned&&H.owned&&meOf(G)&&meOf(H));
    const gm=meOf(G), hm=meOf(H), gid=G.room.sessionId, hid=H.room.sessionId;
    // Hồn hoàn 10 năm (sức mạnh hồn kỹ x1) để vài đòn không hạ ngay tinh anh 450 năm (503 máu).
    await test(G,"set",{rowId:G.owned.active,level:40,xp:0,rings:[10,10,10,10]}); await test(H,"set",{rowId:H.owned.active,level:10,xp:0,rings:[10]});
    // Tinh anh bị hook `clear` của các phần trước xóa thì đang chờ hồi sinh: rút thời gian chờ rồi đợi sinh lại.
    await test(G,"erespawn",{s:0});
    const els=async()=>(await test(G,"elite")).list;
    let L=await els(); for(let k=0;k<20&&L.some(e=>!e.bid);k++){ await sleep(400); L=await els(); }
    const tz2=objsOf(st.mapId), zoneOf=n=>tz2.find(o=>o.type==="zone"&&o.name===n), gates=[spawnObj,...tz2.filter(o=>o.type==="portal"),...tz2.filter(o=>o.type==="arrive").map(o=>({...o,width:0,height:0}))];
    const nearGate=(x,y)=>gates.some(r=>x>r.x-SPAWN_CLEAR&&x<r.x+r.width+SPAWN_CLEAR&&y>r.y-SPAWN_CLEAR&&y<r.y+r.height+SPAWN_CLEAR);
    // Chỗ sinh (hx, hy) nằm trong chữ nhật `elite`, ngoài làng và ngoài SPAWN_CLEAR; tinh anh lang thang quanh đó nên chỉ cần còn trong vùng.
    const elBad=L.filter(e=>{ const b=e.bid&&st.beasts.get(e.bid), z=zoneOf(e.zone), yr=parseLevelRange(z?.properties.find(q=>q.name==="years")?.value);
      return !b||b.rank!==1||b.species!==bossIndex(e.boss)||!inR(e.rect,e.hx,e.hy)||inR(safe,e.hx,e.hy)||nearGate(e.hx,e.hy)||!inR(z,b.x,b.y)||e.years!==yr[1]; });
    ok(L.length===3&&!elBad.length,`Thánh Hồn Thôn: 3 tinh anh trong đúng vùng, niên hạn = mức trên của vùng, ngoài làng và ngoài SPAWN_CLEAR: ${L.map(e=>`${e.name} (${e.zone}, ${e.years} năm)`).join("; ")}`+(elBad.length?` ✗ ${elBad.map(e=>e.boss).join(",")}`:""));
    const statBad=L.filter(e=>{ const s=beastStats(e.years), b=st.beasts.get(e.bid);
      return e.base!==Math.round(s.hp*ELITE.hp)||b?.maxHp!==e.base||Math.abs(e.dmg-s.dmg*ELITE.dmg)>1e-6||e.skills.join()!==BOSSES[bossIndex(e.boss)].skills.map(x=>x.name).join(); });
    ok(!statBad.length,`chỉ số tinh anh: máu x${ELITE.hp}, sát thương x${ELITE.dmg} so với loài gốc cùng năm, 2 chiêu: ${L.map(e=>`${e.name} ${e.base} máu, ${e.dmg.toFixed(1)} sát thương, ${e.skills.join(" / ")}`).join("; ")}`);

    // Đến cạnh tinh anh `boss` (hook goto tới điểm đứng được cách `d` pixel), dọn hồn thú thường quanh đó (giữ tinh anh).
    const eOf=boss=>L.find(e=>e.boss===boss), eb=boss=>st.beasts.get(eOf(boss)?.bid), info=async boss=>(await els()).find(e=>e.boss===boss);
    async function near(b,boss,d){ const t=eb(boss); if(!t) return false;
      for(let k=0;k<32;k++){ const a=k*Math.PI/8+(k>=16?0.2:0), r=k>=16?d*1.5:d, x=Math.round(t.x+Math.cos(a)*r), y=Math.round(t.y+Math.sin(a)*r);
        if(blocked(x,y)||inR(safe,x,y)) continue; await test(b,"goto",{x,y}); const q=meOf(b); if(Math.hypot(q.x-x,q.y-y)<1) return true; }
      return false; }
    const away=async b=>{ await test(b,"goto",{x:safe.x+safe.width/2,y:VILLAGE_RY}); };
    async function tranAp(){ await test(G,"ready"); G.dmgs=[]; G.room.send("skill",{i:2}); await waitFor(()=>G.dmgs.length>0,1500); }
    const TN="thiet_nha_da_tru_vuong", tn=()=>eb(TN), tnid=()=>eOf(TN).bid;
    await away(H);
    ok(await near(G,TN,24),`G đứng cạnh ${eOf(TN).name} (${gm.x.toFixed(0)},${gm.y.toFixed(0)})`);
    await test(G,"clear",{keep:1});
    // Giao chiến 1 người (H ở làng, ngoài bán kính): máu tối đa giữ nguyên.
    await tranAp(); let I=await info(TN);
    ok(I.engaged&&I.n===1&&I.parts.join()===gid&&I.maxHp===I.base&&I.hp<I.maxHp,`G đánh trúng: bắt đầu giao chiến, 1 người tham gia, máu ${I.hp}/${I.maxHp}`);
    // Cuồng nộ khi máu dưới 50%.
    G.fxs=[]; await test(G,"bhp",{pct:40,bid:tnid()}); // theo bid: bầy tinh anh gọi ra có thể đứng gần hơn
    ok(await waitFor(()=>(tn()?.buff&beastBuffBit("rage"))!==0,1500)&&G.fxs.some(f=>f.k==="rage"&&f.bid===tnid()),`máu ${tn()?.hp}/${tn()?.maxHp} (dưới ${ELITE_RAGE.hp*100}%): nổi ${BEAST_BUFFS.rage.name}`);
    // Người vào giữa trận: H tới gần và gây sát thương thì thành người tham gia, máu tối đa x1,6, máu hiện tại giữ tỉ lệ.
    ok(await near(H,TN,40),"H tới gần tinh anh");
    const r0=tn().hp/tn().maxHp; await test(H,"ready"); H.dmgs=[]; H.room.send("skill",{i:0});
    await waitFor(()=>H.dmgs.some(x=>x.bid===tnid()),1500); await sleep(150); I=await info(TN);
    // Trúng độc của H có thể gây thêm sát thương theo thời gian trước hoặc sau lúc hook chụp: cho phép lệch tới tổng các nhát độc.
    const onT=H.dmgs.filter(x=>x.bid===tnid()), dot=onT.filter(x=>x.c===STATUS.poison.col).reduce((a,x)=>a+x.v,0), dH=onT.reduce((a,x)=>a+x.v,0)-dot;
    const want=Math.round(r0*Math.round(I.base*1.6))-dH;
    ok(I.n===2&&I.parts.includes(hid)&&I.maxHp===Math.round(I.base*bossHpMult(2))&&I.hp<=want+2&&I.hp>=want-dot-2,
      `H gây ${dH} sát thương (+${dot} độc): 2 người tham gia, máu tối đa ${I.base} -> ${I.maxHp} (x1,6), máu ${I.hp} (giữ tỉ lệ ${(r0*100).toFixed(0)}%: cần ≈${want})`);
    // Thiên Càn Trấn Áp xóa Cuồng nộ ("xóa buff địch"), Cuồng nộ không nổi lại ngay.
    G.fxs=[]; await tranAp();
    ok(await waitFor(()=>!(tn()?.buff&beastBuffBit("rage")),1000)&&G.fxs.some(f=>f.k==="dispel")&&/Xóa Cuồng nộ/.test(G.logs.slice(-4).join("\n")),
      `${skillsOf("thien_can_bach_ngoc_dinh")[2].name} xóa ${BEAST_BUFFS.rage.name} (log: ${G.logs.at(-1)})`);
    await sleep(700); I=await info(TN); ok(!I.rage&&I.rageCd>ELITE_RAGE.cd-3,`chưa nổi lại ngay (chờ ${I.rageCd.toFixed(1)} giây)`);
    // Ra khỏi bán kính 30 giây liên tục thì bị loại; số người giảm thì máu tối đa giảm, giữ tỉ lệ.
    // Trúng độc của H còn trên tinh anh thì máu tụt giữa lúc đọc tỉ lệ và lúc hook etick (mỗi nhát ~2% máu tối đa): chờ hết độc trước.
    await away(G); await waitFor(()=>!((tn()?.st??0)&statusBit("poison")),(STATUS.poison.secs+2)*1000);
    const r1=tn().hp/tn().maxHp; await test(G,"etick",{s:ELITE.outSecs+1}); I=await info(TN);
    ok(I.engaged&&I.parts.join()===hid&&I.n===1&&I.maxHp===I.base&&Math.abs(I.hp/I.maxHp-r1)<0.02,`G ở ngoài ${ELITE.radius} pixel ${ELITE.outSecs} giây: bị loại, 1 người, máu ${I.hp}/${I.maxHp} (giữ tỉ lệ)`);
    await near(G,TN,30); await test(G,"bhp",{pct:100,bid:tnid()}); await tranAp(); I=await info(TN); ok(I.n===2&&I.parts.length===2,`G quay lại đánh: lại 2 người, máu ${I.hp}/${I.maxHp}`);
    // Rời phòng thì bị loại ngay, nhưng số người giảm tối đa 1 mỗi 10 giây.
    await H.room.leave(); await sleep(300); I=await info(TN);
    ok(I.parts.join()===gid&&I.n===2,`H rời phòng: bị loại, nhưng số người áp vào máu vẫn ${I.n} (vừa giảm chưa đủ ${ELITE.dropEvery} giây)`);
    await test(G,"etick",{s:ELITE.dropEvery}); I=await info(TN); ok(I.n===1&&I.maxHp===I.base,`sau ${ELITE.dropEvery} giây: 1 người, máu tối đa ${I.maxHp}`);
    // Bỏ giao chiến: 15 giây không còn người tham gia nào trong bán kính thì về chỗ, hồi đầy máu, xóa danh sách.
    await away(G); await test(G,"etick",{s:ELITE.idleSecs+1}); I=await info(TN);
    ok(!I.engaged&&!I.parts.length&&I.n===1&&I.hp===I.base&&I.maxHp===I.base,`${ELITE.idleSecs} giây không ai trong bán kính: bỏ giao chiến, hồi đầy ${I.hp}/${I.maxHp}`);

    // 2 chiêu báo trước qua bộ máy 3.5: tên, hình đúng bảng; đứng trong vòng thì trúng với sát thương x1,5.
    await near(G,TN,20); await test(G,"clear",{keep:1}); await test(G,"status",{s:"root",secs:30});
    const sk=BOSSES[bossIndex(TN)].skills, casts=[];
    // Vòng quanh thân trước (đứng sát thì trúng), vệt lao sau (tung xong tinh anh lao ra xa).
    for(const i of [1,0]){ G.fxs=[]; G.hurts=[]; const r=await test(G,"tele",{i});
      const tl=G.fxs.find(f=>f.k==="tele"&&f.bid===tnid()); await waitFor(()=>G.fxs.some(f=>(f.k==="teleHit"||f.k==="teleEnd")&&f.bid===tnid()),2500); await sleep(150);
      casts[i]=({r,tl,hit:G.fxs.find(f=>f.k==="teleHit"&&f.bid===tnid()),hurt:-(G.hurts.find(h=>h.c!=="#8ef08a")?.v??0)}); }
    ok(casts.every((c,i)=>c.r?.name===sk[i].name&&c.tl?.shape===sk[i].shape&&c.tl.r===sk[i].r),`2 chiêu báo trước: ${casts.map(c=>`${c.tl?.name} (${c.tl?.shape} ${c.tl?.r})`).join(", ")}`);
    const yrs=eOf(TN).years, exp=beastStats(yrs).dmg*ELITE.dmg*sk[1].dmg*VOHON[gm.vh].def, c1=casts[1];
    ok(c1.hit?.hit.includes(gid)&&c1.hurt>=Math.floor(exp*0.9)&&c1.hurt<=Math.ceil(exp*1.1),`${sk[1].name} trúng: mất ${c1.hurt} (cần ${Math.round(exp*0.9)}–${Math.round(exp*1.1)}, sát thương x${ELITE.dmg})`);

    // Gọi bầy (Ngân Bối Phong Lang Đầu Lĩnh · Hú Bầy): gọi đủ 2 sói con, gọi lại không vượt quá 2.
    const NB="ngan_boi_phong_lang_dau_linh", nbid=()=>eOf(NB).bid, hb=BOSSES[bossIndex(NB)].skills[0];
    if(await near(G,NB,20)){
      await test(G,"clear",{keep:1}); await test(G,"status",{s:"root",secs:30});
      const pups=()=>[...st.beasts.values()].filter(o=>!o.rank&&BEASTS[o.species]?.id===hb.summon.species&&Math.hypot(o.x-eb(NB).x,o.y-eb(NB).y)<80).length;
      G.fxs=[]; await test(G,"tele",{i:0}); await waitFor(()=>G.fxs.some(f=>f.k==="teleHit"&&f.bid===nbid()),2500); await sleep(200);
      const n1=pups(), m1=(await info(NB)).minions;
      await test(G,"rest",{s:1}); G.fxs=[]; await test(G,"tele",{i:0}); await waitFor(()=>G.fxs.some(f=>f.k==="teleHit"&&f.bid===nbid()),2500); await sleep(200);
      ok(n1===hb.summon.n&&m1===hb.summon.n&&(await info(NB)).minions===hb.summon.n,`${hb.name}: gọi ${n1} ${BEASTS[beastIndex(hb.summon.species)].name}, gọi lại vẫn tối đa ${hb.summon.n}`);
      await test(G,"clear",{keep:1});
    } else ok(false,`G không tới được ${eOf(NB).name}`);

    // Hạ tinh anh: hồn hoàn mang đúng số năm, báo cả phòng; hồi sinh sau 8–12 phút (hook rút ngắn) ở đúng chỗ.
    await near(G,TN,20); await test(G,"clear",{keep:1}); const tx=tn().x, ty=tn().y, oldId=tnid();
    await test(G,"bhp",{pct:1,bid:oldId}); G.elite=[]; const before=new Set(st.drops.keys());
    for(let k=0;k<4&&st.beasts.has(oldId);k++) await tranAp();
    const dr=[...st.drops.entries()].find(([k])=>!before.has(k))?.[1];
    ok(!st.beasts.has(oldId)&&dr?.years===yrs&&dr.owner===gid&&await waitFor(()=>G.elite.some(m=>m.k==="down"),1000)&&/Hạ Tinh anh Thiết Nha Dã Trư Vương/.test(G.logs.join("\n")),
      `hạ ${eOf(TN).name}: hồn hoàn ${dr?.years} năm thuộc G, báo cả phòng (${G.elite.find(m=>m.k==="down")?.name})`);
    I=await info(TN); ok(!I.bid&&I.respawn>ELITE.respawn[0]-5&&I.respawn<=ELITE.respawn[1],`chờ hồi sinh ${(I.respawn/60).toFixed(1)} phút (${ELITE.respawn[0]/60}–${ELITE.respawn[1]/60} phút)`);
    await away(G); G.elite=[]; await test(G,"erespawn",{s:0.5});
    ok(await waitFor(()=>G.elite.some(m=>m.k==="spawn"&&/Thiết Nha/.test(m.name)),4000),`hồi sinh: cả phòng nhận thông báo "${G.elite.find(m=>m.k==="spawn")?.name} xuất hiện" ở ${G.elite.find(m=>m.k==="spawn")?.zone}`);
    I=await info(TN); const nb=I.bid&&st.beasts.get(I.bid);
    ok(nb&&I.bid!==oldId&&nb.rank===1&&inR(I.rect,nb.x,nb.y)&&nb.hp===I.base&&!I.engaged,`tinh anh mới ở đúng chỗ (${nb?.x.toFixed(0)},${nb?.y.toFixed(0)}), đầy máu ${nb?.hp}`);

    // ---------- #119: đóng góp theo tài khoản (thoát vào lại không mất); thưởng tinh anh khóa ELITE.lock giây theo tài khoản ----------
    const lk=`${st.mapId}|${TN}`, TNn=eOf(TN).name; let lc=(await test(G,"elock")).locks;
    ok(lc[lk]>ELITE.lock-60&&lc[lk]<=ELITE.lock,`#119: G vừa nhận thưởng ${TNn}: khóa ${lk} còn ${lc[lk]?.toFixed(0)} giây (ELITE.lock ${ELITE.lock})`);
    L=await els();
    await near(G,TN,24); await test(G,"clear",{keep:1}); await tranAp(); await sleep(150);
    I=await info(TN); const g0=G.room.sessionId, v0=I.dmgBy?.[g0]??0;
    ok(I.engaged&&v0>0,`#119: G đánh ${TNn} mới: đóng góp ${v0}`);
    const rid=G.room.roomId; await G.room.leave(); await sleep(300); await enter(G,rid); await waitFor(()=>meOf(G)&&G.owned,3000);
    I=await info(TN); const g1=G.room.sessionId;
    ok(g1!==g0&&I.engaged&&(I.dmgBy[g1]??0)>=v0&&!(g0 in I.dmgBy)&&!I.parts.includes(g1),
      `#119: G thoát rồi vào lại (phiên mới): đóng góp ${I.dmgBy[g1]} chuyển sang phiên mới, phiên cũ không còn; chưa là người tham gia tới khi đánh lại`);
    // Còn khóa: hạ tinh anh chỉ thưởng như hồn thú thường (hồn hạch theo coreChance, không chắc chắn), có nhắc.
    await test(G,"core",{r:50}); let ln=G.logs.length, bf=new Set(st.drops.keys());
    await test(G,"slay",{bid:I.bid}); await sleep(250);
    let nd=[...st.drops.entries()].filter(([k])=>!bf.has(k)).map(([,x])=>x);
    ok(nd.length&&!nd.some(x=>x.item===CORE_ITEM)&&nd.every(x=>x.owner===g1)&&/Đã nhận thưởng .* chưa lâu/.test(G.logs.slice(ln).join("\n")),
      `#119: G còn khóa hạ ${TNn}: như hồn thú thường (số ngẫu nhiên 0,5: không hồn hạch), "${G.logs.slice(ln).find(t=>/chưa lâu/.test(t))}"`);
    lc=(await test(G,"elock",{s:0})).locks; ok(!(lk in lc),"#119: hook elock s=0 bỏ khóa");
    const tb=(await test(G,"beast",{boss:TN,dx:14,dy:0})).bid; bf=new Set(st.drops.keys());
    await test(G,"slay",{bid:tb}); await sleep(250); nd=[...st.drops.entries()].filter(([k])=>!bf.has(k)).map(([,x])=>x); lc=(await test(G,"elock")).locks;
    ok(nd.some(x=>x.item===CORE_ITEM&&x.owner===g1)&&lc[lk]>ELITE.lock-60,`#119: hết khóa: hạ ${TNn} lại chắc chắn rơi hồn hạch, khóa lại ${lc[lk]?.toFixed(0)} giây`);
    await test(G,"core",{r:100});
    await G.room.leave();
  
}
