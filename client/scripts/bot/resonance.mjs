// Nhóm bot "resonance" (#703 bước 3, tách nguyên văn từ bot-test.mjs).
import { post, sleep, waitFor, ok, bot, enter, sendTeam, test, needHookSkip } from "./lib.mjs";
import { BEASTS, VOHON, vohonIndex, calcStats, tierOfYears, RING_ITEM, starCost, shardCode, BONE_ITEM, BONE_SLOTS, CORE_ITEM, RESONANCE, RES_VOHON_LEVEL, RESONANCE_RANK_CD, RESONANCE_RANK_PAGE_MAX, RES_BONE_ENHANCE, RES_CORE_STARS, RESONANCE_EFFECT_CAP, resonanceProgress, resonanceLevels, resonanceBonus } from "../../../shared/data.ts";

/**
 * 8.2 Cộng minh: bảng RESONANCE đúng mốc 5.10 (hàm thuần), rồi một tài khoản mới đạt từng mốc của 5 trụ cột bằng hook (grant / set
 * võ hồn, hấp thụ thật, give hồn cốt +10 / hồn hạch 5★ rồi gắn bằng message thật): chỉ số mọi võ hồn (ra trận, trong đội, ngoài
 * đội, đổi vào sau) tăng đúng %, thông báo mốc mới (log + `ev`), tháo đồ thì mất mốc, thoát vào lại vẫn giữ.
 */
export async function resonanceTest(){
  console.log("[8.2] Cộng minh: 5 trụ cột, cộng chỉ số cho mọi võ hồn");
  const NEED={vohon:[4,6,8],ring:[10,25,50],bone:[6,12,24],core:[8,16,24],star:[4,10,18]};
  ok(RESONANCE.length===5&&RESONANCE.every(r=>JSON.stringify(r.steps.map(s=>s.need))===JSON.stringify(NEED[r.id])&&r.steps.every(s=>Object.values(s.bonus).every(v=>v>0))),
    "RESONANCE: Võ hồn 4/6/8, Hồn hoàn 10/25/50, Hồn cốt 6/12/24, Hồn hạch 8/16/24, Sao 4/10/18 (mục 5.10)");
  const pv=resonanceProgress({vohons:[{level:RES_VOHON_LEVEL,rings:3,stars:3},{level:RES_VOHON_LEVEL-1,rings:7,stars:1},{level:100,rings:10,stars:2}],
    bones:[{enhance:RES_BONE_ENHANCE},{enhance:RES_BONE_ENHANCE-1}],cores:[{stars:RES_CORE_STARS},{stars:RES_CORE_STARS-1},{stars:6}]});
  ok(JSON.stringify(pv)===JSON.stringify([2,20,1,2,3])&&JSON.stringify(resonanceLevels([4,24,6,23,10]))===JSON.stringify([1,1,1,2,2])
    &&JSON.stringify(resonanceLevels([99,99,99,99,99]))===JSON.stringify([3,3,3,3,3])&&JSON.stringify(resonanceBonus([0,0,0,0,0]))===JSON.stringify({hp:0,mp:0,atk:0,crit:0,def:0,spd:0}),
    `resonanceProgress / resonanceLevels: cấp ${RES_VOHON_LEVEL}+, hồn cốt +${RES_BONE_ENHANCE}, hồn hạch ${RES_CORE_STARS}★, sao võ hồn (${JSON.stringify(pv)})`);
  const starSteps=RESONANCE[4].steps;
  starSteps.push({need:999,bonus:{crit:4,def:6,spd:6}});
  const capped=resonanceBonus([0,0,0,0,4]);
  starSteps.pop();
  ok(Object.entries(RESONANCE_EFFECT_CAP).every(([k,cap])=>capped[k]<=cap)
    &&capped.crit===RESONANCE_EFFECT_CAP.crit&&capped.def===RESONANCE_EFFECT_CAP.def&&capped.spd===RESONANCE_EFFECT_CAP.spd,
    `resonanceBonus kẹp đúng RESONANCE_EFFECT_CAP với mốc giả (${JSON.stringify(capped)})`);
  const R=await bot("Cộng minh","u_minh_linh_mieu",{sex:0,hair:2,hairCol:3,outfitCol:1});
  const rme=()=>R.room.state.players?.get(R.room.sessionId);
  await waitFor(()=>R.owned&&R.bag&&R.res&&rme(),3000);
  ok(R.res&&R.res.lv.every(x=>x===0)&&R.res.bonus.hp===0&&R.res.bonus.atk===0,`tài khoản mới: chưa đạt mốc nào (${JSON.stringify(R.res)})`);
  if(!(await test(R,"ping"))?.enabled){ needHookSkip("bỏ qua đạt mốc cộng minh (cần hook grant, set, give): bật server bằng GAME_TEST=1"); await R.room.leave(); return; }
  const lvOf=()=>JSON.stringify(R.res?.lv), sameStats=(a,b)=>a&&b&&a.maxHp===b.maxHp&&a.maxMp===b.maxMp&&Math.abs(a.atk-b.atk)<1e-6;
  /** Kiểm tra chỉ số của mọi võ hồn sở hữu (hook stats) = calcStats kèm cộng minh `lv`; võ hồn ra trận: chỉ số đang dùng cũng vậy. */
  async function checkAll(lv,label){
    const res=resonanceBonus(lv); let good=true, more=true, live=false, n=0;
    for(const v of R.owned.list){
      const s=await test(R,"stats",{rowId:v.rowId}), vh=vohonIndex(v.vohon), rings=v.rings.map(tierOfYears);
      const want=calcStats(vh,v.level,rings,v.stars,s.bones,s.cores,res), bare=calcStats(vh,v.level,rings,v.stars,s.bones,s.cores);
      if(!sameStats(s.stats,want)||JSON.stringify(s.res?.lv)!==JSON.stringify(lv)) { good=false; console.log("    ",v.vohon,JSON.stringify(s.stats),JSON.stringify(want)); }
      if(lv.some(x=>x>0)&&!(s.stats.maxHp>=bare.maxHp&&s.stats.atk>=bare.atk&&(s.stats.maxHp>bare.maxHp||s.stats.atk>bare.atk||s.stats.maxMp>bare.maxMp))) more=false;
      if(v.rowId===R.owned.active){ live=s.live&&s.live.maxHp===want.maxHp&&s.live.maxMp===want.maxMp&&Math.abs(s.live.atk-want.atk)<1e-6&&rme().maxHp===want.maxHp; }
      n++;
    }
    ok(good&&more&&live,`${label}: chỉ số ${n} võ hồn = calcStats kèm cộng minh ${JSON.stringify(res)} (võ hồn ra trận dùng ngay)`);
  }
  const L0=R.logs.length;
  // ---- Võ hồn: sở hữu 4 / 6 / 8 võ hồn cấp 30+ ----
  for(const vo of ["hao_thien_chuy","ta_hoa_phuong_hoang","hoa_long","nhu_cot_tho","yeu_ho","quy_mi"]) await test(R,"grant",{vohon:vo});
  ok(R.owned.list.length===8,`có 8 võ hồn (${R.owned.list.map(v=>v.vohon).join(", ")})`);
  const ids=R.owned.list.map(v=>v.rowId), act=R.owned.active;
  for(let i=0;i<3;i++) await test(R,"set",{rowId:ids[i],level:RES_VOHON_LEVEL,xp:0});
  await test(R,"set",{rowId:ids[3],level:RES_VOHON_LEVEL-1,xp:0});
  ok(R.res.prog[0]===3&&R.res.lv[0]===0,`3 võ hồn cấp ${RES_VOHON_LEVEL} + 1 võ hồn cấp ${RES_VOHON_LEVEL-1}: chưa đạt mốc (${R.res.prog[0]}/4)`);
  let e0=R.resEv.length;
  await test(R,"set",{rowId:ids[3],level:RES_VOHON_LEVEL,xp:0});
  ok(R.res.prog[0]===4&&R.res.lv[0]===1&&R.resEv.slice(e0).some(e=>e.pillar===0&&e.step===0&&e.up)
    &&R.logs.slice(L0).some(t=>/Cộng minh Võ hồn đạt mốc 1\/3/.test(t)),`võ hồn thứ 4 lên cấp ${RES_VOHON_LEVEL}: đạt mốc 1, có thông báo (${R.logs.slice(L0).find(t=>/Cộng minh/.test(t))})`);
  await checkAll(R.res.lv,"mốc Võ hồn 1");
  for(let i=4;i<6;i++) await test(R,"set",{rowId:ids[i],level:RES_VOHON_LEVEL,xp:0});
  ok(R.res.lv[0]===2,`6 võ hồn cấp ${RES_VOHON_LEVEL}+: mốc 2 (${lvOf()})`);
  for(let i=6;i<8;i++) await test(R,"set",{rowId:ids[i],level:RES_VOHON_LEVEL,xp:0});
  ok(R.res.lv[0]===3&&R.res.bonus.hp===10,`8 võ hồn cấp ${RES_VOHON_LEVEL}+: đủ 3 mốc, sinh lực +${R.res.bonus.hp}%`);
  // ---- Sao võ hồn: tổng sao cộng thêm 4 / 10 / 18; đường starup thật phải cập nhật mốc ngay ----
  async function starupOp(vohon) {
    const l=R.logs.length;
    R.room.send("starup",{vohon});
    await waitFor(()=>R.logs.length>l,2000);
    return R.logs.at(-1)??"";
  }
  async function starupMilestone(values, rowId, need, label) {
    for (const [i, stars] of values.entries()) await test(R,"set",{rowId:ids[i],stars});
    const code=shardCode(R.owned.list.find(v=>v.rowId===rowId).vohon), before=R.resEv.length;
    await test(R,"give",{code,qty:starCost(1)});
    const log=await starupOp(R.owned.list.find(v=>v.rowId===rowId).vohon);
    await waitFor(()=>R.res.prog?.[4]===need,2000);
    ok(R.res.prog[4]===need&&R.res.lv[4]===(need>=18?3:need>=10?2:1)&&R.resEv.slice(before).some(e=>e.pillar===4&&e.up)
      &&/lên \d+★/.test(log),`${label}: starup thật cập nhật mốc (${log})`);
  }
  await starupMilestone([3,2,1,1],ids[3],4,"4 sao cộng thêm: chí mạng +1 điểm %");
  ok(R.res.bonus.crit===1&&R.res.bonus.def===0&&R.res.bonus.spd===0,"4 sao: chưa mở giảm sát thương / tốc chạy");
  await starupMilestone([6,4,2,1,1],ids[3],10,"10 sao cộng thêm: giảm sát thương +1%");
  ok(R.res.bonus.crit===1&&R.res.bonus.def===1,"10 sao: chí mạng giữ +1 điểm %");
  await starupMilestone([6,6,4,1,5],ids[3],18,"18 sao cộng thêm: tốc chạy +2%");
  ok(R.res.bonus.crit===1&&R.res.bonus.def===1&&R.res.bonus.spd===2,"18 sao: đủ hiệu ứng Sao võ hồn");
  // ---- Hồn hoàn: tổng 10 / 25 / 50 hồn hoàn trên mọi võ hồn; mốc cuối bằng một lần hấp thụ thật ----
  const Y=n=>Array.from({length:n},()=>10), setRings=(i,n)=>test(R,"set",{rowId:ids[i],level:Math.max(RES_VOHON_LEVEL,(n+1)*10>100?100:n*10+10),xp:0,rings:Y(n)});
  await setRings(0,3); await setRings(1,3); await setRings(2,3);
  ok(R.res.prog[1]===9&&R.res.lv[1]===0,`9 hồn hoàn: chưa đạt mốc (${R.res.prog[1]}/10)`);
  e0=R.resEv.length; await setRings(3,1);
  ok(R.res.lv[1]===1&&R.resEv.slice(e0).some(e=>e.pillar===1&&e.step===0&&e.up),`10 hồn hoàn: mốc Hồn hoàn 1 (công +${R.res.bonus.atk}%)`);
  await checkAll(R.res.lv,"mốc Võ hồn 3 + Hồn hoàn 1");
  await setRings(0,10); await setRings(1,10); await setRings(2,5);
  ok(R.res.prog[1]===26&&R.res.lv[1]===2,`26 hồn hoàn: mốc 2 (${lvOf()})`);
  await setRings(2,10); await setRings(3,10); await setRings(4,9);
  ok(R.res.prog[1]===49&&R.res.lv[1]===2,`49 hồn hoàn: vẫn mốc 2`);
  // Võ hồn thứ 5 đang ở bình cảnh cấp 100 với 9 vòng: hấp thụ hồn hoàn thứ 10 thật (cố định số ngẫu nhiên, xong ngay).
  await test(R,"set",{rowId:ids[4],level:100,xp:0,rings:Y(9)});
  const nb=R.bagMsgs??0; await test(R,"give",{code:RING_ITEM,qty:1}); await waitFor(()=>(R.bagMsgs??0)>nb);
  const ring=R.bag.items.find(i=>i.code===RING_ITEM);
  await test(R,"roll",{r:0}); e0=R.resEv.length;
  R.absorbing=null; R.room.send("absorb",{itemId:ring?.id,vohonId:ids[4]}); await waitFor(()=>R.absorbing?.on);
  await test(R,"rush"); await waitFor(()=>R.absorbing?.result==="ok"); await waitFor(()=>R.res.prog[1]===50,1500);
  ok(R.absorbing?.result==="ok"&&R.res.prog[1]===50&&R.res.lv[1]===3&&R.resEv.slice(e0).some(e=>e.pillar===1&&e.step===2&&e.up)
    &&R.logs.some(t=>/Cộng minh Hồn hoàn đạt mốc 3\/3/.test(t)),`hấp thụ hồn hoàn thứ 50: mốc Hồn hoàn 3, có thông báo (công +${R.res.bonus.atk}%)`);
  await test(R,"roll",{r:-1});
  // ---- Hồn cốt: 6 / 12 / 24 hồn cốt +10 đang gắn (6 vị trí x 4 võ hồn) ----
  /** Cho hồn cốt / hồn hạch bằng hook rồi gắn từng món bằng message thật vào võ hồn `rowId`. */
  async function gearUp(rowId,list){
    for(const g of list){
      const before=new Set(R.bag.items.map(i=>i.id)), n=R.bagMsgs??0;
      await test(R,"give",g); await waitFor(()=>(R.bagMsgs??0)>n);
      const it=R.bag.items.find(i=>!before.has(i.id)&&i.code===g.code);
      const m=R.bagMsgs??0; R.room.send(g.code===BONE_ITEM?"equip":"equipcore",{itemId:it?.id,vohonId:rowId}); await waitFor(()=>(R.bagMsgs??0)>m);
    }
    await sleep(80);
  }
  const bones6=e=>BONE_SLOTS.map(s=>({code:BONE_ITEM,qty:1,tier:2,beast:BEASTS[0].id,slot:s.id,enhance:e}));
  await gearUp(ids[0],bones6(RES_BONE_ENHANCE-1));
  ok(R.res.prog[2]===0&&R.res.lv[2]===0,`6 hồn cốt +${RES_BONE_ENHANCE-1} đang gắn: không tính`);
  e0=R.resEv.length; await gearUp(ids[1],bones6(RES_BONE_ENHANCE));
  ok(R.res.prog[2]===6&&R.res.lv[2]===1&&R.resEv.slice(e0).some(e=>e.pillar===2&&e.step===0&&e.up),`6 hồn cốt +${RES_BONE_ENHANCE} gắn trên ${VOHON[vohonIndex(R.owned.list[1].vohon)].name}: mốc Hồn cốt 1`);
  await gearUp(ids[2],bones6(RES_BONE_ENHANCE));
  ok(R.res.prog[2]===12&&R.res.lv[2]===2,`12 hồn cốt +${RES_BONE_ENHANCE}: mốc 2`);
  await gearUp(ids[3],bones6(RES_BONE_ENHANCE)); await gearUp(ids[4],bones6(RES_BONE_ENHANCE+5));
  ok(R.res.prog[2]===24&&R.res.lv[2]===3,`24 hồn cốt +${RES_BONE_ENHANCE} trở lên trên 4 võ hồn: mốc 3 (${lvOf()})`);
  // Tháo một món thì mất mốc 3 (có báo), gắn lại thì có lại.
  const off=R.bag.items.find(i=>i.code===BONE_ITEM&&i.vohon===ids[4]);
  let m=R.bagMsgs??0, l=R.logs.length; R.room.send("unequip",{itemId:off.id}); await waitFor(()=>(R.bagMsgs??0)>m); await sleep(80);
  ok(R.res.prog[2]===23&&R.res.lv[2]===2&&R.logs.slice(l).some(t=>/Cộng minh Hồn cốt còn 2\/3/.test(t)),`tháo 1 hồn cốt: còn 23, mất mốc 3 (${R.logs.slice(l).find(t=>/Cộng minh/.test(t))})`);
  m=R.bagMsgs??0; R.room.send("equip",{itemId:off.id,vohonId:ids[4]}); await waitFor(()=>(R.bagMsgs??0)>m); await sleep(80);
  ok(R.res.lv[2]===3,"gắn lại: mốc Hồn cốt 3");
  // ---- Hồn hạch: 8 / 16 / 24 hồn hạch 5★ trở lên đang gắn ----
  const cores=(n,stars)=>Array.from({length:n},()=>({code:CORE_ITEM,qty:1,stars}));
  await gearUp(ids[5],cores(6,RES_CORE_STARS-1));
  ok(R.res.prog[3]===0,`6 hồn hạch ${RES_CORE_STARS-1}★ đang gắn: không tính`);
  await gearUp(ids[0],cores(6,RES_CORE_STARS)); await gearUp(ids[1],cores(1,RES_CORE_STARS));
  ok(R.res.prog[3]===7&&R.res.lv[3]===0,`7 hồn hạch ${RES_CORE_STARS}★: chưa đạt mốc`);
  e0=R.resEv.length; await gearUp(ids[1],cores(1,RES_CORE_STARS+1));
  ok(R.res.prog[3]===8&&R.res.lv[3]===1&&R.resEv.slice(e0).some(e=>e.pillar===3&&e.step===0&&e.up),"8 hồn hạch 5★ trở lên: mốc Hồn hạch 1");
  await gearUp(ids[1],cores(4,RES_CORE_STARS)); await gearUp(ids[2],cores(4,RES_CORE_STARS));
  ok(R.res.prog[3]===16&&R.res.lv[3]===2,"16 hồn hạch: mốc 2");
  await gearUp(ids[2],cores(2,RES_CORE_STARS)); await gearUp(ids[3],cores(6,RES_CORE_STARS));
  ok(R.res.prog[3]===24&&JSON.stringify(R.res.lv)===JSON.stringify([3,3,3,3,3]),`24 hồn hạch: đủ 15 mốc (${lvOf()}, ${JSON.stringify(R.res.bonus)})`);
  const all=resonanceBonus([3,3,3,3,3]);
  ok(R.res.bonus.hp===all.hp&&R.res.bonus.mp===all.mp&&R.res.bonus.atk===all.atk&&R.res.bonus.crit===1&&R.res.bonus.def===1&&R.res.bonus.spd===2&&R.resEv.filter(e=>e.up).length>=15,
    `tổng cộng minh ${JSON.stringify(all)}, cap crit 3 / def 5 / spd 5; hiện tại crit ${R.res.bonus.crit}, def ${R.res.bonus.def}, spd ${R.res.bonus.spd}, đã báo ${R.resEv.filter(e=>e.up).length} mốc`);
  await checkAll([3,3,3,3,3],"đủ 15 mốc");
  // Võ hồn trong đội nhưng không ra trận: sinh lực tối đa trong tin squad cũng có cộng minh; đổi vào sau thì chỉ số đang dùng có ngay.
  await test(R,"rest"); await sendTeam(R,[act,ids.find(r=>r!==act&&r!==ids[0])??ids[1],0,0]);
  const bench=R.owned.team[1], bv=R.owned.list.find(v=>v.rowId===bench), bs=await test(R,"stats",{rowId:bench});
  ok(await waitFor(()=>R.squad?.list.find(x=>x.rowId===bench)?.maxHp===bs.stats.maxHp),`võ hồn ngoài sân ${bv.vohon}: sinh lực tối đa trong đội ${bs.stats.maxHp} có cộng minh`);
  R.room.send("switch",{slot:1}); await waitFor(()=>R.owned.active===bench||rme()?.vh===vohonIndex(bv.vohon)); await sleep(150);
  const sw=await test(R,"stats");
  ok(sw.rowId===bench&&sw.live.maxHp===calcStats(vohonIndex(bv.vohon),bv.level,bv.rings.map(tierOfYears),bv.stars,sw.bones,sw.cores,all).maxHp&&rme().maxHp===sw.live.maxHp,
    `đổi ${VOHON[vohonIndex(bv.vohon)].name} vào: sinh lực tối đa ${sw.live.maxHp} có cộng minh`);
  // ---- Thoát vào lại: tiến độ tính lại từ dữ liệu đã lưu, không báo lại mốc ----
  R.resTop=null; R.room.send("resonance",{op:"top",page:1,pageSize:99}); await waitFor(()=>R.resTop,2000);
  ok(R.resTop?.page===1&&R.resTop.pageSize===RESONANCE_RANK_PAGE_MAX&&R.resTop.total>=1&&R.resTop.me?.rank>=1&&R.resTop.list.every(r=>!("accountId" in r)&&typeof r.name==="string"&&Number.isInteger(r.score)),
    `bảng xếp hạng: trang ${R.resTop?.page}/${R.resTop?.pageSize}, ${R.resTop?.total} tài khoản, dòng công khai không lộ accountId`);
  const top1=JSON.stringify(R.resTop); await sleep(RESONANCE_RANK_CD*1000+300);
  R.resTop=null; R.room.send("resonance",{op:"top",page:1,pageSize:99}); await waitFor(()=>R.resTop,2000);
  ok(JSON.stringify(R.resTop)===top1,`bảng xếp hạng: hai lần xin liên tiếp (trong RESONANCE_RANK_CACHE) trả cùng kết quả`);
  const keep=JSON.stringify([R.res.prog,R.res.lv,R.res.bonus]);
  await test(R,"goto",{x:rme().x,y:rme().y}); await R.room.leave(); await sleep(400);
  R.mapId=(await post("/api/me",{token:R.token})).mapId; await enter(R); await waitFor(()=>R.res&&R.owned&&rme(),3000);
  ok(JSON.stringify([R.res.prog,R.res.lv,R.res.bonus])===keep&&!R.resEv.length,`thoát vào lại: cộng minh giữ nguyên ${keep}, không báo lại mốc`);
  await checkAll([3,3,3,3,3],"vào lại");
  await R.room.leave();
}
