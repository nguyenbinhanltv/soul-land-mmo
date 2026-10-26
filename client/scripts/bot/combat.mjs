// Nhóm bot "combat" (#703 bước 6, tách nguyên văn từ bot-test.mjs): Chiến đấu: khoá mục tiêu, che tầm nhìn, Cực Hàn, hang chia phần, dòng phụ hồn cốt, liên kích.
import { readFileSync } from "node:fs";
import { post, sleep, waitFor, ok, mapUrl, bot, enter, bonesOf, npcSpot, sendTeam, same, test, step, needHookSkip } from "./lib.mjs";
import { TIERS, calcStats, TIEN_CO_MAX, formatHonTe, TIEN_CO_RIENG, STATUS, STATUS_IDS, statusBit, CRIT, TEAM_COMBAT_SECS, MAPS, MAX_YEARS, BONE_ITEM, BONE_SLOTS, boneStats, boneBonus, TELE_PAD, BOSSES, bossIndex, KING, BONE_MAX_ENHANCE, BONE_ENHANCE_FEE, enhanceFee, BONE_MAX_SUBS, BONE_SUB_K, BONE_SUB_POOL, BONE_ENHANCE_MILESTONES, boneSubMax, boneSubsDue, parseBoneSubs, boneAddSubs, CORE_ITEM, CORE_SUB_ROLL, CORE_STATS, CORE_STAT_IDS, coreStatText, PLAYER_STATUS, AUTO_DEFAULTS, GROUND_KINDS } from "../../../shared/data.ts";
import { hoaDanSpot } from "../../../shared/hoaDan.ts";
import { comboHits } from "./village.mjs";

/**
 * #175: tinh anh Ma Chương Vương (Hải Thần Đảo, ô tinh anh thật) tung Phun Mực nhắm F: F có Che tầm nhìn (bit `ink` trong state công
 * khai, người khác vẽ biểu tượng trên đầu) đúng thời gian STATUS.ink, không Câm lặng / Làm chậm như bản tối thiểu cũ và vẫn dùng được
 * hồn kỹ; tiên cơ Xúc Xích thanh tẩy giải; gây lại thì hết giờ tự hết.
 */
/**
 * M3 #750: khoá mục tiêu (rooms/lock.ts). Bot không có Phaser nên chỉ gửi ý định `target {id}` như client; kiểm phần server: giữ khoá,
 * tự đánh trong tầm không cần tin `attack`, bị đánh / Choáng không huỷ, quái chết thì huỷ (tin `lock` rỗng), id sai bị bỏ, Space chưa khoá
 * tự quay mặt về quái gần nhất trong tầm.
 */
export async function lockTest(){
  console.log("[M3 #750] Khoá mục tiêu: tự đánh, giữ khoá khi bị đánh / Choáng, Space tự quay mặt");
  const F=await bot("Khoá mục tiêu","xuc_xich",{sex:0,hair:2,hairCol:3,outfitCol:2});
  const mo=()=>F.room.state.players?.get(F.room.sessionId), bs=bid=>F.room.state.beasts.get(bid);
  let lockMsg=null, lockWhy=null, n=0; F.room.onMessage("lock",m=>{ lockMsg=m.id; lockWhy=m.why??null; n++; });
  await waitFor(()=>F.owned&&mo(),3000);
  try{
    if(!(await test(F,"ping"))?.enabled){ needHookSkip("bỏ qua khoá mục tiêu (cần hook goto, spawn, clear, pst): bật server bằng GAME_TEST=1"); return; }
    // Ra ngoài vùng an toàn của làng (không đánh được trong làng).
    const sv=JSON.parse(readFileSync(mapUrl("thanh_hon_thon"),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="safe"), tv=npcSpot("thanh_hon_thon","to_van_dao");
    let out=false;
    for(const [dx,dy] of [[40,0],[60,0],[40,24],[40,-24],[80,0],[60,48],[60,-48]]){
      const x=sv.x+sv.width+dx, y=Math.max(sv.y+8,Math.min(sv.y+sv.height-8,tv.y))+dy; await test(F,"goto",{x,y});
      if(Math.hypot(mo().x-x,mo().y-y)<1){ out=true; break; } }
    ok(out,`ra ngoài làng (${mo().x.toFixed(0)}, ${mo().y.toFixed(0)})`);
    await test(F,"clear"); await test(F,"rest",{s:TEAM_COMBAT_SECS+1});
    // 1) Khoá một con ở xa (ngoài tầm đánh): server giữ khoá, báo lại bằng tin riêng `lock`.
    const bid=(await test(F,"spawn",{tier:0,dx:70,hpx:6}))?.bid; await waitFor(()=>bs(bid),1000);
    F.room.send("target",{id:bid});
    ok(await waitFor(()=>lockMsg===bid,1500),`bấm quái: server khoá ${bid} (tin lock)`);
    // 2) Ngoài tầm thì không đánh; hồn sư tới sát (client lái A* như bấm đi, ở đây dịch chuyển bằng hook) thì tự đánh, không gửi tin attack nào.
    const hf=bs(bid)?.hp; await sleep(500);
    ok(Math.hypot(bs(bid).x-mo().x,bs(bid).y-mo().y)>40?bs(bid).hp===hf:true,`ngoài tầm đánh: chưa ra đòn (sinh lực quái ${hf} -> ${bs(bid)?.hp})`);
    await test(F,"goto",{x:bs(bid).x-18,y:bs(bid).y});
    const h0=bs(bid)?.hp, m0=mo().maxHp;
    ok(await waitFor(()=>bs(bid)&&bs(bid).hp<h0,6000),`trong tầm thì tự đánh thường, không bấm đánh (sinh lực quái ${h0} -> ${bs(bid)?.hp})`);
    // 3) Bị đánh: vẫn giữ khoá.
    await test(F,"hurt",{pct:15}); const hit=mo().hp<m0, kept=lockMsg===bid&&n>0; // hook hurt = bị đánh một đòn (như hồn thú trúng)
    ok(hit&&kept,`bị đánh (sinh lực ${mo().hp}/${m0}): vẫn giữ khoá`);
    await sleep(600); ok(lockMsg===bid&&!!bs(bid),"bị đánh xong vẫn giữ khoá sau 0,6 giây");
    // 4) Choáng: không đánh được (noAtk) nhưng không mất khoá; hết Choáng thì đánh tiếp.
    await test(F,"pst",{s:"stun",secs:1.5}); await waitFor(()=>((mo().st??0)&statusBit("stun"))!==0,1000);
    const hs=bs(bid)?.hp; await sleep(900);
    ok(lockMsg===bid&&(bs(bid)?.hp??0)>=(hs??0),`đang Choáng: không đánh, vẫn giữ khoá (sinh lực quái ${hs} -> ${bs(bid)?.hp})`);
    ok(await waitFor(()=>bs(bid)&&bs(bid).hp<hs,5000),"hết Choáng: tự đánh tiếp");
    // 5) Quái chết thì server huỷ khoá.
    await test(F,"bhp",{pct:1,bid});
    ok(await waitFor(()=>!bs(bid)&&lockMsg==="",8000),`quái chết: huỷ khoá (lock "${lockMsg}")`);
    ok(lockWhy==="gone",`quái chết: tin lock mang lý do "gone" (${lockWhy}) để chip báo lý do (M5 #751)`);
    // 6) Chống gian lận: id không có thật / sai kiểu bị bỏ, khoá cũ cũng bỏ.
    await test(F,"clear");
    const b2=(await test(F,"spawn",{tier:0,dx:70}))?.bid; await waitFor(()=>bs(b2),1000);
    F.room.send("target",{id:b2}); await waitFor(()=>lockMsg===b2,1500);
    for(const bad of ["khong-co-id",{x:1},7,null]){
      F.room.send("target",{id:b2}); await waitFor(()=>lockMsg===b2,1500);
      F.room.send("target",{id:bad}); const cleared=await waitFor(()=>lockMsg==="",1000);
      ok(cleared,`id sai ${JSON.stringify(bad)}: bỏ khoá, không khoá lung tung`); }
    // 6b) Chưa khoá mà bị từ chối: vẫn nhận tin `lock ""` (client đã đặt khoá tạm, không có tin này sẽ vẽ vòng khoá giả).
    await sleep(200); const n0=n; F.room.send("target",{id:"khong-co-id"});
    ok(await waitFor(()=>n>n0&&lockMsg==="",1000),"chưa khoá, bấm id sai: server vẫn trả lock rỗng để client bỏ khoá tạm");
    // 7) Space chưa khoá: quay mặt về quái gần nhất trong tầm (hồn sư đang quay lưng) rồi đánh.
    await test(F,"clear"); F.room.send("input",{x:-1,y:0}); await sleep(250); F.room.send("input",{x:0,y:0}); await sleep(150);
    await test(F,"goto",{x:mo().x,y:mo().y});
    const b3=(await test(F,"spawn",{tier:0,dx:22,hpx:6}))?.bid; await waitFor(()=>bs(b3),1000);
    const k0=bs(b3)?.hp; F.room.send("attack");
    ok(await waitFor(()=>bs(b3)&&bs(b3).hp<k0,1200)&&lockMsg==="",`Space chưa khoá, quái ở sau lưng trong tầm: tự quay mặt, đánh trúng (${k0} -> ${bs(b3)?.hp}), không khoá`);
    // 8) Thứ tự ưu tiên lệnh (M5 #751): khoá > tự săn. Đang khoá thì bật tự săn bị từ chối (nêu lý do); bấm quái khi đang tự săn thì tự săn tắt, khoá thắng.
    await test(F,"clear"); const b4=(await test(F,"spawn",{tier:0,dx:70}))?.bid; await waitFor(()=>bs(b4),1000);
    F.room.send("target",{id:b4}); await waitFor(()=>lockMsg===b4,1500);
    F.autoMsg=null; F.room.send("auto",{op:"on"}); await waitFor(()=>F.autoMsg,1500);
    ok(F.autoMsg&&!F.autoMsg.on&&/khoá mục tiêu/.test(F.autoMsg.why??"")&&!mo().auto&&lockMsg===b4,`đang khoá: bật tự săn bị từ chối (${F.autoMsg?.why}), khoá vẫn giữ`);
    F.room.send("target",{id:""}); await waitFor(()=>lockMsg==="",1000);
    F.autoMsg=null; F.room.send("auto",{op:"on"}); await waitFor(()=>F.autoMsg,1500);
    ok(F.autoMsg?.on&&await waitFor(()=>mo().auto,1000),"hết khoá: bật được tự săn");
    F.room.send("target",{id:b4}); await waitFor(()=>lockMsg===b4,1500);
    ok(await waitFor(()=>!mo().auto&&F.autoMsg&&!F.autoMsg.on,2000)&&lockMsg===b4,"đang tự săn rồi bấm quái: tự săn tắt, khoá thắng");
    await test(F,"clear");
  } finally { await F.room.leave().catch(()=>{}); }
}

export async function inkTest(){
  console.log("[#175] Phun Mực: Che tầm nhìn, thanh tẩy, hết giờ");
  const HT="hai_than_dao", EB="ma_chuong_vuong", ED=BOSSES[bossIndex(EB)], PM=ED?.skills.findIndex(s=>s.name==="Phun Mực")??-1, IK=STATUS.ink;
  const pm=ED?.skills[PM];
  ok(PM>=0&&pm.shape==="circle"&&same(pm.status?.map(a=>a.s),["ink"])&&IK&&!IK.noMove&&!IK.noAtk&&!IK.noSkill&&!IK.slow&&!IK.wander
    &&PLAYER_STATUS.includes("ink")&&STATUS_IDS.indexOf("ink")>STATUS_IDS.indexOf("chill")&&statusBit("ink")<1<<16,
    `${ED?.name} – ${pm?.name}: vòng, gây ${IK?.name} ${IK?.secs} giây (không khống chế; thêm sau Hàn, bit ${Math.log2(statusBit("ink"))} vừa trường uint16)`);
  if(PM<0) return;
  const F=await bot("Phun Mực F","xuc_xich",{sex:0,hair:2,hairCol:3,outfitCol:2});
  const mo=()=>F.room.state.players?.get(F.room.sessionId), has=s=>((mo()?.st??0)&statusBit(s))!==0, sq=r=>F.squad?.list.find(s=>s.rowId===r);
  const pst=async()=>(await test(F,"cold")).st; // hook cold trả trạng thái trên người gọi (thời gian còn lại)
  await waitFor(()=>F.owned&&mo(),3000);
  try{
    if(!(await test(F,"ping"))?.enabled){ needHookSkip("bỏ qua Phun Mực (cần hook warp, erespawn, tele): bật server bằng GAME_TEST=1"); return; }
    const xr=F.owned.list.find(v=>v.vohon==="xuc_xich")?.rowId, lr=F.owned.list.find(v=>v.vohon==="lam_ngan_thao")?.rowId;
    for(const r of [xr,lr]) await test(F,"set",{rowId:r,level:100,xp:0,rings:[423,764,1760,5000,12000]});
    F.travel=null; await test(F,"warp",{mapId:HT,x:0,y:0}); await waitFor(()=>F.travel,3000); const tv=F.travel;
    await F.room.leave(); await sleep(300); F.mapId=tv.mapId; await enter(F,tv.roomId??undefined); await waitFor(()=>mo()&&F.owned&&F.bag&&F.squad,3000);
    ok(F.room.state.mapId===HT,"F tới Hải Thần Đảo");
    // Xúc Xích ngồi ghế dự bị để lát nữa đổi tay vào tung tiên cơ thanh tẩy.
    await test(F,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(F,[lr,xr,0,0]);
    if(F.owned.active!==lr){ await waitFor(()=>mo().swCd===0,3500); F.room.send("switch",{slot:0}); await waitFor(()=>F.owned.active===lr,2000); }
    ok(F.owned.active===lr&&F.owned.team.includes(xr),"đội: Lam Ngân Thảo ra trận, Xúc Xích dự bị");
    // Tinh anh hồi sinh ở tick sau hook erespawn: chờ ô có bid và vị trí.
    await test(F,"erespawn",{s:0}); let cur=null;
    for(let k=0;k<20&&!(cur?.bid&&Number.isFinite(cur.x));k++){ await sleep(150); cur=(await test(F,"elite")).list.find(x=>x.boss===EB); }
    ok(cur?.bid&&Number.isFinite(cur.x),`${ED.name} có mặt ở ${cur?.zone} (${cur?.x?.toFixed(0)},${cur?.y?.toFixed(0)})`);
    if(!cur?.bid) return;
    const eb={bid:cur.bid};
    // Tinh anh sinh ở điểm ngẫu nhiên trong ô: thử vài chỗ đứng quanh (chỗ bị nước / đá chặn thì goto không đổi vị trí).
    let at=null; for(const [dx,dy] of [[24,0],[0,24],[-24,0],[0,-24],[30,12],[-30,12],[12,30],[12,-30]]){
      await test(F,"goto",{x:cur.x+dx,y:cur.y+dy}); if(Math.hypot(mo().x-cur.x-dx,mo().y-cur.y-dy)<1){ at=[dx,dy]; break; } }
    ok(!!at,`F đứng cạnh ${ED.name} ${JSON.stringify(at)}`);
    // Đòn không tính trúng khi còn khung bất tử (vừa vào phòng, vừa bị đánh): dọn hồn thú thường, tung lại tối đa 3 lần cách 1,6 giây.
    let th=null, why="";
    for(let k=0;k<3&&!has("ink");k++){
      if(k) await sleep(1600);
      await test(F,"clear",{keep:1}); await test(F,"ready"); F.fxs=[];
      const t=await test(F,"tele",{i:PM,cancel:1,...eb});
      await waitFor(()=>F.fxs.some(f=>f.k==="teleHit"&&f.bid===cur.bid),3000);
      th=F.fxs.find(f=>f.k==="teleHit"&&f.bid===cur.bid); await waitFor(()=>has("ink"),800);
      why+=` [lần ${k+1}: ${t?.name}, teleHit ${th?(th.hit.includes(F.room.sessionId)?"trúng F":"không trúng F"):"chưa có"}]`;
    }
    await test(F,"status",{s:"stun",secs:60,...eb}); // tinh anh đứng Choáng, không tung tiếp
    let st=await pst();
    ok(has("ink")&&!has("silence")&&!has("slow")&&st.ink&&st.ink.t<=IK.secs&&st.ink.t>IK.secs-2&&!st.silence&&!st.slow,
      `trúng ${pm.name}: ${IK.name} còn ${st.ink?.t?.toFixed(2)} giây (đặt ${IK.secs}), không Câm lặng / Làm chậm;${why}`);
    // Không đổi luật đánh: vẫn dùng hồn kỹ (Câm lặng cũ thì bị từ chối).
    { await test(F,"ready"); const l=F.logs.length; F.room.send("skill",{i:0});
      ok(await waitFor(()=>mo().cds[0]>0,1500)&&!F.logs.slice(l).some(t=>/không dùng được hồn kỹ/.test(t))&&has("ink"),
        `đang ${IK.name} vẫn dùng hồn kỹ (hồi chiêu ô 1: ${mo().cds[0]?.toFixed?.(2)})`);
      await test(F,"bhp",{pct:100,...eb}); } // trả máu tinh anh (bài Hải Thần Đảo dùng lại)
    // Thanh tẩy: đổi tay vào Xúc Xích đầy năng lượng, tiên cơ giải Che tầm nhìn.
    await waitFor(()=>mo().swCd===0,3500); await test(F,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sq(xr)?.en===TIEN_CO_MAX,1500);
    await test(F,"pst",{s:"ink",secs:20}); await waitFor(()=>has("ink"),1000); // máy chậm: Che tầm nhìn của Phun Mực có thể đã gần hết
    const h0=has("ink"); F.room.send("switch",{slot:F.owned.team.indexOf(xr)});
    ok(h0&&await waitFor(()=>F.owned.active===xr&&!has("ink"),2500),`tiên cơ ${TIEN_CO_RIENG.xuc_xich.name} thanh tẩy: hết ${IK.name}`);
    // Hết giờ thì tự hết.
    await test(F,"pst",{s:"ink",secs:1}); const t0=Date.now();
    ok(await waitFor(()=>has("ink"),1000)&&await waitFor(()=>!has("ink"),2500),`${IK.name} 1 giây: hết sau ${((Date.now()-t0)/1000).toFixed(1)} giây`);
  } finally {
    // Không hạ tinh anh (bài Hải Thần Đảo đếm đủ 4 tinh anh); Choáng tự hết, phòng trống thì tự hủy.
    await F.room.leave().catch(()=>{});
  }
}

/**
 * #163: Cực Hàn (giai đoạn 2 của Tà hóa Huyền Minh Băng Giao, Cực Bắc Chi Địa; ColdDef, STATUS.chill). F (Xúc Xích + Lam Ngân Thảo)
 * đứng trong hang, xa Hỏa Đàn; thú vương bị Choáng bằng hook để không đánh. Giai đoạn 1 không tích. Giai đoạn 2: đủ nhịp thật thì có
 * 1 tầng Hàn; hook `cold {acc}` rút ngắn nhịp tới đủ tầng thì Đóng băng (tầng về 0, ngừng tích khi đang Đóng băng). Đứng cạnh Hỏa Đàn
 * (chỗ server tính khớp hàm dùng chung của client) thì xả hết tầng và không tích; tiên cơ Xúc Xích thanh tẩy cũng xả; rời hang thì mất
 * tầng; hạ thú vương thì mất tầng.
 */
export async function coldTest(){
  console.log("[#163] Cực Hàn: tầng Hàn, Đóng băng, Hỏa Đàn, thanh tẩy");
  const CB="cuc_bac_chi_dia", KB=MAPS[CB].king, KD=BOSSES[bossIndex(KB)], CD=KD?.phase2?.cold, CH=STATUS.chill, FZ=CH?.burst;
  ok(KB==="huyen_minh_bang_giao"&&CD&&CH?.max===4&&FZ?.s==="freeze"&&FZ.secs===3&&PLAYER_STATUS.includes("chill"),
    `${KD?.name} – ${KD?.phase2?.name}: mỗi ${CD?.every} giây một ${CH?.name}, đủ ${CH?.max} tầng thì ${STATUS[FZ?.s]?.name} ${FZ?.secs} giây (thiết kế gốc 4 tầng / 3 giây), Hỏa Đàn bán kính ${CD?.fire.r}`);
  if(!CD) return;
  const spot=hoaDanSpot(JSON.parse(readFileSync(mapUrl(CB),"utf8")),CB);
  const F=await bot("Cực Hàn F","xuc_xich",{sex:1,hair:1,hairCol:2,outfitCol:1});
  const mo=()=>F.room.state.players?.get(F.room.sessionId), kingB=()=>[...F.room.state.beasts.values()].find(b=>b.rank===2);
  const has=s=>((mo()?.st??0)&statusBit(s))!==0, han=()=>mo()?.han??0, sq=r=>F.squad?.list.find(s=>s.rowId===r);
  await waitFor(()=>F.owned&&mo(),3000);
  try{
    const xr=F.owned.list.find(v=>v.vohon==="xuc_xich")?.rowId, lr=F.owned.list.find(v=>v.vohon==="lam_ngan_thao")?.rowId;
    for(const r of [xr,lr]) await test(F,"set",{rowId:r,level:50,xp:0,rings:[423,764,1760,5000,12000]});
    F.travel=null; await test(F,"warp",{mapId:CB,x:0,y:0}); await waitFor(()=>F.travel,3000); const tv=F.travel;
    await F.room.leave(); await sleep(300); F.mapId=tv.mapId; await enter(F,tv.roomId??undefined); await waitFor(()=>mo()&&F.owned&&F.bag&&F.squad,3000);
    ok(F.room.state.mapId===CB,"F tới Cực Bắc Chi Địa");
    // Xúc Xích ngồi ghế dự bị để lát nữa đổi tay vào tung tiên cơ thanh tẩy.
    await test(F,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(F,[lr,xr,0,0]);
    if(F.owned.active!==lr){ await waitFor(()=>mo().swCd===0,3500); F.room.send("switch",{slot:0}); await waitFor(()=>F.owned.active===lr,2000); }
    ok(F.owned.active===lr&&F.owned.team.includes(xr),"đội: Lam Ngân Thảo ra trận, Xúc Xích dự bị");
    await test(F,"view",{all:true}); await test(F,"clear",{all:true,keep:1});
    let c=await test(F,"cold");
    await test(F,"king",{kop:"spawn"}); ok(await waitFor(()=>kingB(),2000),"thú vương xuất hiện");
    let ki=await test(F,"king"); const LR=ki.lair, kb=ki.bid, inL=(x,y)=>x>=LR.x&&x<LR.x+LR.w&&y>=LR.y&&y<LR.y+LR.h;
    ok(spot&&c.fire&&c.fire.x===spot.x&&c.fire.y===spot.y&&inL(spot.x,spot.y),
      `Hỏa Đàn (${c.fire?.x},${c.fire?.y}) trong hang (${LR.x},${LR.y} ${LR.w}×${LR.h}): server và hàm dùng chung (client) cùng chỗ`);
    const hold=()=>test(F,"status",{s:"stun",secs:60,bid:kb}); // thú vương đứng Choáng, không đánh F
    const far=[[LR.x+LR.w/2,LR.y+LR.h*0.3],[LR.x+LR.w*0.3,LR.y+LR.h/2],[LR.x+LR.w*0.7,LR.y+LR.h/2],[LR.x+LR.w*0.25,LR.y+LR.h*0.35]].map(([x,y])=>[Math.round(x),Math.round(y)]);
    const goFar=async()=>{ for(const [x,y] of far){ if(Math.hypot(x-spot.x,y-spot.y)<=CD.fire.r+16) continue; await test(F,"goto",{x,y}); if(Math.hypot(mo().x-x,mo().y-y)<1) return true; } return false; };
    await hold(); ok(await goFar()&&inL(mo().x,mo().y),`F đứng trong hang, xa Hỏa Đàn (${mo().x.toFixed(0)},${mo().y.toFixed(0)}; cách ${Math.hypot(mo().x-spot.x,mo().y-spot.y).toFixed(0)})`);
    // Giai đoạn 1: là người tham gia trong hang nhưng chưa có Cực Hàn.
    await test(F,"kdmg",{v:1}); await sleep(300); c=await test(F,"cold");
    ok(!c.on&&c.acc===null&&!has("chill"),"giai đoạn 1: không tích tầng Hàn");
    ki=await test(F,"king"); await test(F,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*KING.phaseHp)+1});
    ok(await waitFor(()=>kingB()?.phase===2,2000),`giai đoạn 2 ${KD.phase2.name}`);
    await sleep(KING.roarSecs*1000+150); await hold(); // tiếng gầm bỏ khống chế: hết gầm thì Choáng lại
    c=await test(F,"cold"); ok(c.on&&c.acc!==null,"Cực Hàn đang chạy, F (người tham gia trong hang) đang tích");
    // Nhịp thật: đứng xa Hỏa Đàn một nhịp thì có 1 tầng (bản vá: bit `chill` và số tầng `han`).
    const t0=Date.now();
    ok(await waitFor(()=>has("chill")&&han()===1,(CD.every+1.5)*1000),`đứng xa Hỏa Đàn: sau ${((Date.now()-t0)/1000).toFixed(1)} giây có ${han()} tầng Hàn (nhịp ${CD.every} giây)`);
    const step=async n=>{ await test(F,"cold",{acc:CD.every-0.05}); return waitFor(()=>han()===n,1500); };
    const st2=[]; for(let n=2;n<CH.max;n++) st2.push(await step(n)?n:`✗${han()}`);
    ok(st2.every(x=>typeof x==="number"),`tích tiếp: ${st2.join(" → ")} tầng`);
    const l0=F.logs.length; await test(F,"cold",{acc:CD.every-0.05});
    ok(await waitFor(()=>has(FZ.s)&&!has("chill")&&han()===0,1500)&&await waitFor(()=>F.logs.slice(l0).some(t=>/tầng Hàn/.test(t)),800),
      `đủ ${CH.max} tầng: ${STATUS[FZ.s].name}, tầng về 0 ("${F.logs.slice(l0).find(t=>/tầng Hàn/.test(t))}")`);
    c=await test(F,"cold"); ok(c.st[FZ.s]&&c.st[FZ.s].t<=FZ.secs&&c.st[FZ.s].t>FZ.secs-1,`${STATUS[FZ.s].name} còn ${c.st[FZ.s]?.t.toFixed(2)} giây (đặt ${FZ.secs})`);
    await test(F,"cold",{acc:CD.every-0.05}); await sleep(400);
    ok(has(FZ.s)&&!has("chill")&&han()===0,`đang ${STATUS[FZ.s].name}: không tích thêm tầng`);
    ok(await waitFor(()=>!has(FZ.s),(FZ.secs+1)*1000),`hết ${STATUS[FZ.s].name}`);
    // Hỏa Đàn: đứng cạnh (trong bán kính, phía tâm hang) thì xả hết tầng, đứng đó không tích.
    await hold(); await step(1); await step(2);
    const nx=spot.x, ny=spot.y-(CD.fire.r-6); F.logs.length=0; await test(F,"goto",{x:nx,y:ny});
    ok(Math.hypot(mo().x-nx,mo().y-ny)<1&&await waitFor(()=>!has("chill")&&han()===0,1000)&&await waitFor(()=>F.logs.some(t=>/Hỏa Đàn/.test(t)),800),
      `2 tầng, đứng cạnh Hỏa Đàn (cách ${Math.hypot(mo().x-spot.x,mo().y-spot.y).toFixed(0)} ≤ ${CD.fire.r}): xả hết tầng ("${F.logs.find(t=>/Hỏa Đàn/.test(t))}")`);
    await test(F,"cold",{acc:CD.every-0.05}); await sleep(500); c=await test(F,"cold");
    ok(!has("chill")&&han()===0&&c.acc===0,"đứng cạnh Hỏa Đàn: không tích tầng");
    // Thanh tẩy: đổi tay vào Xúc Xích đầy năng lượng, tiên cơ giải hết tầng Hàn.
    await goFar(); await step(1); await step(2);
    await waitFor(()=>mo().swCd===0,3500); await test(F,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sq(xr)?.en===TIEN_CO_MAX,1500);
    await test(F,"cold",{acc:CD.every-1.5}); // sắp tới tầng kế tiếp: thanh tẩy xả cả số giây đã tích như Hỏa Đàn
    const h0=han(); F.room.send("switch",{slot:F.owned.team.indexOf(xr)});
    ok(h0===2&&await waitFor(()=>F.owned.active===xr&&!has("chill")&&han()===0,2000),`${h0} tầng, tiên cơ ${TIEN_CO_RIENG.xuc_xich.name} thanh tẩy: tầng Hàn về 0`);
    c=await test(F,"cold"); ok(c.acc!==null&&c.acc<1,`thanh tẩy: tích lại từ đầu (đã tích ${c.acc?.toFixed(2)} giây, trước đó ${CD.every-1.5})`);
    ok(await step(1),"sau thanh tẩy vẫn ở trong hang thì tích lại từ đầu");
    // Rời hang thì mất tầng.
    const ox=Math.round(LR.x+LR.w/2); let out=false;
    for(const y of [LR.y+LR.h+30,LR.y+LR.h+60,LR.y-30]){ await test(F,"goto",{x:ox,y:Math.round(y)}); if(!inL(mo().x,mo().y)&&Math.abs(mo().y-y)<1){ out=true; break; } }
    ok(out&&await waitFor(()=>!has("chill")&&han()===0,1000),`ra khỏi hang (${mo().x.toFixed(0)},${mo().y.toFixed(0)}): mất tầng Hàn`);
    // Hạ thú vương thì mất tầng.
    await hold(); await goFar(); ok(await step(1),"vào lại hang, tích 1 tầng");
    await test(F,"kdmg",{v:1e8});
    ok(await waitFor(()=>!kingB()&&!has("chill")&&han()===0,2500),"hạ thú vương: mất tầng Hàn");
    c=await test(F,"cold"); ok(!c.on&&c.acc===null,"không còn Cực Hàn");
  } finally {
    if(kingB()) await test(F,"kdmg",{v:1e8}).catch(()=>{}); // bài lỗi giữa chừng: không để thú vương sống sang cucBacTest
    await F.room.leave().catch(()=>{});
  }
}

/**
 * #173: hang chia phần luân phiên. Lưỡng Nghi Luân Chuyển (GĐ2 Lưỡng Nghi Thủ Hộ Xà, Lạc Nhật): hang chia nửa băng, nửa lửa (SplitDef),
 * mỗi lần chỉ một nửa hóa, báo trước rồi mới có tác dụng; đứng đúng nửa (nửa kia) thì không bị gì, đứng nhầm nửa băng thì Đóng băng một
 * lần rồi Làm chậm (không bị đóng băng lại khi còn đứng), nửa lửa thì Thiêu đốt cộng tầng; đổi phần thì nửa cũ tan ngay. Tự săn đang
 * đứng trong nửa đang hóa thì ra khỏi đó và không bước lại vào. Tơ Vạn Chu Phệ (GĐ2 Thiên Độc Chu Hoàng, Nội địa): tơ phủ 1/3 hang lần
 * lượt từng phần, bước vào bị Trói một lần rồi Làm chậm. Song Sắc Mãng (tinh anh) đổi băng / hỏa: chiêu gây trạng thái theo dạng lúc bắt
 * đầu báo trước, báo trước đổi dạng (formWarn). Thú vương đứng Choáng bằng hook để không đánh; F được hồi đầy bằng hook giữa các bước.
 */
export async function splitTest(){
  console.log("[#173] Hang chia phần luân phiên: Lưỡng Nghi Luân Chuyển, tơ Vạn Chu Phệ, Song Sắc Mãng đổi băng / hỏa");
  const LN="lac_nhat_sam_lam", ND="tinh_dau_noi_dia", LK=BOSSES[bossIndex(MAPS[LN].king)], VK=BOSSES[bossIndex(MAPS[ND].king)], SS=BOSSES[bossIndex("bang_hoa_song_sac_mang")];
  const LS=LK?.phase2?.split, VS=VK?.phase2?.split, FD=SS?.forms, ICE=LS?.grounds[0], FIRE=LS?.grounds[1], WEB=VS?.grounds[0], kinds=s=>s?.grounds.map(g=>g.kind).join(" / ");
  ok(LS?.parts===2&&LS.warn>0&&LS.every>LS.warn&&ICE?.kind==="ice"&&ICE.once?.some(a=>a.s==="freeze")&&ICE.status.some(a=>a.s==="slow")&&!ICE.status.some(a=>a.s==="freeze")
    &&FIRE?.kind==="fire"&&FIRE.status.some(a=>a.s==="burn")&&LS.grounds.every(g=>g.secs>=LS.every-LS.warn&&g.warn===undefined),
    `${LK?.name} – ${LK?.phase2?.name}: hang chia ${LS?.parts} phần (${kinds(LS)}), đổi mỗi ${LS?.every} giây, báo trước ${LS?.warn} giây`);
  ok(VS?.parts===3&&VS.warn>0&&WEB?.kind==="web"&&WEB.once?.some(a=>a.s==="root")&&WEB.status.some(a=>a.s==="slow")&&!WEB.status.some(a=>a.s==="root")&&WEB.secs>=VS.every-VS.warn
    &&VK.phase2.skills.some(s=>s.eggs)&&!VK.phase2.skills.some(s=>s.name==="Chu Ti Phong Tỏa"),
    `${VK?.name} – ${VK?.phase2?.name}: tơ phủ 1/${VS?.parts} hang lần lượt, đổi mỗi ${VS?.every} giây, báo trước ${VS?.warn} giây; vẫn đẻ bọc trứng`);
  ok(FD?.forms.length===2&&FD.every>FD.warn&&SS.skills.every(s=>!s.status&&s.forms?.length===2&&s.forms[0].every(a=>a.s==="slow")&&s.forms[1].every(a=>a.s==="burn")),
    `${SS?.name}: đổi ${FD?.forms.map(f=>f.name).join(" / ")} mỗi ${FD?.every} giây (báo trước ${FD?.warn} giây); dạng băng chiêu Làm chậm, dạng hỏa Thiêu đốt`);
  ok(["ice","fire","web"].every(k=>GROUND_KINDS.some(g=>g.id===k)),"kiểu vùng băng / lửa / tơ có trong GROUND_KINDS (client vẽ)");
  if(!LS||!VS||!FD) return;
  const F=await bot("Lưỡng Nghi F","xuc_xich",{sex:1,hair:1,hairCol:2,outfitCol:4});
  if(!(await test(F,"ping"))?.enabled){ needHookSkip("bỏ qua hang chia phần (cần hook warp, king, split, form): bật server bằng GAME_TEST=1"); await F.room.leave(); return; }
  const mo=()=>F.room.state.players?.get(F.room.sessionId), kingB=()=>[...F.room.state.beasts.values()].find(b=>b.rank===2);
  const has=s=>((mo()?.st??0)&statusBit(s))!==0, heal=()=>test(F,"pregen",{hp:100,mp:100,s:0});
  const autoOp=async(op,more={})=>{ F.autoMsg=null; F.room.send("auto",{op,...more}); await waitFor(()=>F.autoMsg,1500); return F.autoMsg; };
  /** Điểm (x, y) nằm trong dải `t` cách mép ít nhất `m` pixel (m < 0: tính cả lề ngoài mép). */
  const onPart=(t,x,y,m=0)=>{ const dx=x-t.x, dy=y-t.y, u=dx*Math.cos(t.ang)+dy*Math.sin(t.ang), v=-dx*Math.sin(t.ang)+dy*Math.cos(t.ang); return u>=m&&u<=t.r-m&&Math.abs(v)<=t.w/2-m; };
  /** Đứng ở một chỗ đi được trong dải `t`, cách mép ít nhất 14 pixel. */
  const goPart=async t=>{ for(const u of [0.5,0.35,0.65,0.25,0.75]) for(const v of [0,-0.2,0.2,-0.35,0.35]){
    const x=Math.round(t.x+Math.cos(t.ang)*u*t.r-Math.sin(t.ang)*v*t.w), y=Math.round(t.y+Math.sin(t.ang)*u*t.r+Math.cos(t.ang)*v*t.w);
    if(!onPart(t,x,y,14)) continue; await test(F,"goto",{x,y}); if(Math.hypot(mo().x-x,mo().y-y)<1) return true; } return false; };
  /** `fn` đúng suốt `ms` mili giây (kiểm mỗi 100). */
  const holds=async(fn,ms)=>{ for(let t=0;t<ms;t+=100){ if(!fn()) return false; await sleep(100); } return fn(); };
  /** Tới bản đồ `mapId`, gọi thú vương, đứng trong hang, đưa thú vương sang giai đoạn 2 (đứng Choáng, hết tiếng gầm). */
  async function phase2(mapId,K){
    F.travel=null; await test(F,"warp",{mapId,x:0,y:0}); await waitFor(()=>F.travel,3000); const tv=F.travel;
    await F.room.leave(); await sleep(300); F.mapId=mapId; await enter(F,tv.roomId??undefined); await waitFor(()=>mo()&&F.owned,3000);
    ok(F.room.state.mapId===mapId,`F tới ${MAPS[mapId].name}`);
    await test(F,"view",{all:true}); await test(F,"clear",{all:true,keep:1});
    await test(F,"king",{kop:"spawn"}); ok(await waitFor(()=>kingB(),2000),`${K.name} xuất hiện`);
    let ki=await test(F,"king"); const LR=ki.lair, kb=ki.bid, hold=()=>test(F,"status",{s:"stun",secs:60,bid:kb});
    await hold();
    ok(await goPart({shape:"line",x:LR.x,y:LR.y+LR.h/2,ang:0,r:LR.w,w:LR.h}),`F đứng trong hang (${mo().x},${mo().y})`);
    await test(F,"kdmg",{v:1}); await sleep(300);
    const s1=await test(F,"split"); ok(!s1.on&&!s1.zone.length&&!s1.grounds.some(z=>z.src===kb),"giai đoạn 1: hang chưa chia phần");
    ki=await test(F,"king"); await test(F,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*KING.phaseHp)+1});
    ok(await waitFor(()=>kingB()?.phase===2,2000),`giai đoạn 2 ${K.phase2.name}`);
    await sleep(KING.roarSecs*1000+150); await hold(); await heal(); // tiếng gầm bỏ khống chế: hết gầm thì Choáng lại
    return { LR, kb };
  }
  try{
    await waitFor(()=>F.owned&&mo(),3000);
    const xr=F.owned.list.find(v=>v.vohon==="xuc_xich")?.rowId; await test(F,"set",{rowId:xr,level:100,xp:0,rings:[400,700,1700,5000,12000,20000,50000,100000,100000]});

    // ---- Lưỡng Nghi Luân Chuyển ----
    let { LR, kb } = await phase2(LN,LK);
    let t=await test(F,"split",{next:600}); // giữ phần hiện tại, bot tự gọi đổi phần
    const P=t.parts, z0=t.grounds.find(z=>t.zone.includes(z.id)), long=Math.max(LR.w,LR.h);
    ok(t.on&&P.length===2&&Math.abs(P[0].r+P[1].r-long)<1e-6&&P.every(p=>p.shape==="line"&&Math.abs(p.w-Math.min(LR.w,LR.h))<1e-6)&&t.zone.length===1&&z0?.src===kb
      &&z0.shape==="line"&&t.kind===LS.grounds[t.part%2].kind&&z0.kind===t.kind&&Math.abs(z0.x-P[t.part].x)<1e-6&&Math.abs(z0.y-P[t.part].y)<1e-6,
      `hết gầm: hang chia ${P.length} nửa (mỗi nửa ${P[0]?.r}×${P[0]?.w}), nửa ${t.part} hóa ${t.kind}`);
    if(t.kind!=="ice"){ t=await test(F,"split",{next:0}); await test(F,"split",{next:600}); }
    const ip=t.part, iceP=P[ip], fireP=P[1-ip], iceId=t.zone[0];
    ok(t.kind==="ice"&&(await test(F,"split")).grounds.find(z=>z.id===iceId)?.wait>0,`nửa băng đang báo trước (${LS.warn} giây)`);
    // Đứng đúng nửa (nửa kia): không bị gì.
    ok(await goPart(fireP),`F đứng ở nửa không hóa (${mo().x},${mo().y})`);
    ok(await waitFor(()=>F.room.state.grounds.get(iceId)?.wait===0,(LS.warn+1)*1000),"nửa băng hết báo trước, có tác dụng");
    ok(await holds(()=>!has("freeze")&&!has("slow")&&!has("burn"),1600),"đứng đúng nửa: không Đóng băng, không Làm chậm, không Thiêu đốt");
    // Đứng nhầm nửa băng: Đóng băng một lần, rồi Làm chậm; không bị đóng băng lại khi còn đứng.
    ok(await goPart(iceP),`F bước vào nửa băng (${mo().x},${mo().y})`);
    ok(await waitFor(()=>has("freeze"),1600)&&has("slow"),`đứng nhầm nửa băng: ${STATUS.freeze.name} + ${STATUS.slow.name}`);
    ok(await waitFor(()=>!has("freeze"),3000),`${STATUS.freeze.name} hết giờ`);
    ok(await holds(()=>!has("freeze"),2200)&&has("slow")&&onPart(iceP,mo().x,mo().y),`còn đứng trong nửa băng 2 giây: không bị ${STATUS.freeze.name} lại, vẫn ${STATUS.slow.name}`);
    // Đổi phần: nửa băng tan ngay, nửa lửa báo trước rồi Thiêu đốt cộng tầng.
    t=await test(F,"split",{next:0}); await test(F,"split",{next:600}); const fireId=t.zone[0];
    ok(t.kind==="fire"&&t.part===1-ip&&!t.grounds.some(z=>z.id===iceId)&&t.grounds.find(z=>z.id===fireId)?.wait>0,"đổi phần: nửa băng tan ngay, nửa lửa đang báo trước");
    await heal(); ok(await goPart(fireP),"F sang nửa lửa lúc còn báo trước");
    ok(await holds(()=>!has("burn"),300),"nửa lửa đang báo trước: chưa Thiêu đốt");
    ok(await waitFor(()=>has("burn"),(LS.warn+1.5)*1000),`hết báo trước: ${STATUS.burn.name}`);
    const b1=(await test(F,"split")).st.burn?.n??0; await sleep(2100); const b2=(await test(F,"split")).st.burn?.n??0;
    ok(b1>=1&&b2>b1,`đứng trong nửa lửa: ${STATUS.burn.name} cộng tầng ${b1} → ${b2}`);
    await heal(); ok(await goPart(iceP),"F sang nửa băng (đã tan)");
    await sleep(300); const b3=(await test(F,"split")).st.burn?.n??0; await sleep(1600); const b4=(await test(F,"split")).st.burn?.n??0;
    ok(b4<=b3&&!has("freeze"),`ra khỏi nửa lửa: ${STATUS.burn.name} không cộng thêm (${b3} → ${b4}), nửa băng đã tan không Đóng băng`);
    // Tự săn: đứng trong nửa đang hóa (lửa) thì ra khỏi đó và không bước lại vào.
    await heal(); await test(F,"ground",{ttl:30}); await goPart(fireP);
    await autoOp("set",{cfg:{...AUTO_DEFAULTS}}); const am=await autoOp("on");
    if(!am?.on) console.log(`  ⚠ không bật được tự săn (${JSON.stringify(am)}): bỏ qua phần tự săn`);
    else {
      ok(await waitFor(()=>!onPart(fireP,mo().x,mo().y,-TELE_PAD),3000),`tự săn: ra khỏi nửa lửa (${mo().x.toFixed(0)},${mo().y.toFixed(0)})`);
      ok(await holds(()=>!onPart(fireP,mo().x,mo().y,-TELE_PAD)&&mo().auto,2500),"tự săn đánh tiếp mà không bước lại vào nửa lửa (2,5 giây)");
      await autoOp("off");
    }
    await test(F,"kdmg",{v:1e8});
    ok(await waitFor(()=>!kingB()&&F.room.state.grounds.size===0,2500),"hạ thú vương: hang thôi chia phần (vùng mất khỏi state)");
    t=await test(F,"split"); ok(!t.on&&!t.grounds.length,"không còn Lưỡng Nghi Luân Chuyển");

    // ---- Tơ Vạn Chu Phệ ----
    ({ LR, kb } = await phase2(ND,VK));
    t=await test(F,"split",{next:600});
    const Q=t.parts, w0=t.zone[0], wz=t.grounds.find(z=>z.id===w0);
    ok(t.on&&Q.length===3&&Math.abs(Q.reduce((a,p)=>a+p.r,0)-Math.max(LR.w,LR.h))<1e-6&&t.kind==="web"&&wz?.kind==="web"&&wz.src===kb&&wz.wait>0,
      `hết gầm: tơ phủ phần ${t.part} trong ${Q.length} phần của hang (mỗi phần ${Q[0]?.r?.toFixed(0)}×${Q[0]?.w}), đang báo trước`);
    const webP=Q[t.part], p0=t.part; await heal();
    ok(await goPart(webP),"F đứng trong phần sắp phủ tơ");
    ok(await waitFor(()=>has("root"),(VS.warn+1.5)*1000)&&has("slow"),`tơ phủ: ${STATUS.root.name} + ${STATUS.slow.name}`);
    ok(await waitFor(()=>!has("root"),3000)&&await holds(()=>!has("root"),2200)&&has("slow"),`hết ${STATUS.root.name}: còn đứng trong tơ không bị ${STATUS.root.name} lại, vẫn ${STATUS.slow.name}`);
    t=await test(F,"split",{next:0}); await test(F,"split",{next:600});
    ok(t.part===(p0+1)%3&&!t.grounds.some(z=>z.id===w0)&&t.grounds.filter(z=>z.src===kb).length===1,`luân phiên: tơ sang phần ${t.part}, phần cũ tan ngay`);
    await test(F,"kdmg",{v:1e8});
    ok(await waitFor(()=>!kingB()&&F.room.state.grounds.size===0,2500),"hạ thú vương: tơ mất");

    // ---- Song Sắc Mãng đổi băng / hỏa ----
    await heal(); await goPart({shape:"line",x:LR.x,y:LR.y+LR.h/2,ang:0,r:LR.w,w:LR.h});
    const sb=(await test(F,"beast",{boss:SS.id,dx:24,dy:0,skills:true}))?.bid, sB=()=>F.room.state.beasts.get(sb);
    ok(sb&&await waitFor(()=>sB()?.form>0,1500),`${SS.name} sinh ra ở dạng ${FD.forms[(sB()?.form??1)-1]?.name}`);
    let f=await test(F,"form",{bid:sb});
    if(f.form!==0){ F.fxs=[]; f=await test(F,"form",{bid:sb,next:0}); ok(await waitFor(()=>F.fxs.some(x=>x.k==="form"&&x.bid===sb),1000),"đổi dạng: có fx form"); }
    ok(f.form===0&&await waitFor(()=>sB()?.form===1&&!sB().formWarn,1000),`dạng ${FD.forms[0].name}, chưa báo trước đổi`);
    await test(F,"form",{bid:sb,next:FD.warn-0.5});
    ok(await waitFor(()=>sB()?.formWarn,1000),`còn dưới ${FD.warn} giây: báo trước đổi dạng`);
    await test(F,"form",{bid:sb,next:600});
    /**
     * Trước mỗi lần tung: hết trạng thái của lần trước (thời gian trạng thái chạy theo nhịp server nên chờ theo state, không theo giờ
     * thật), dọn hồn thú thường (giữ tinh anh như `phase2`: ô tinh anh xa hang, dọn thì 8–12 phút mới sinh lại), hồi đầy. Hồn thú Nội địa
     * sinh lại ngay ngoài tầm cấm sinh quanh hồn sư (spawnBeast) rồi lang thang tới: một đòn của nó ngay trước khi chiêu tung đặt khung
     * bất tử nên chiêu vẫn trúng F mà không gây trạng thái (#289).
     */
    const ready=async()=>{ const gone=await waitFor(()=>!has("slow")&&!has("burn"),8000); await test(F,"clear",{all:true,keep:1}); await heal();
      ok(gone&&!has("slow")&&!has("burn"),`F hết ${STATUS.slow.name} / ${STATUS.burn.name} trước lần tung kế`); F.fxs=[]; F.hurts=[]; };
    const hitOf=()=>F.fxs.find(x=>x.k==="teleHit"&&x.bid===sb), waitHit=()=>waitFor(()=>hitOf(),(SS.skills[1].warn+1.5)*1000);
    /** Chẩn đoán khi trượt: chiêu có trúng F không, trạng thái đang có, các đòn lên F trong lần tung, dạng hiện tại. */
    const why=()=>{ const h=hitOf(), st=STATUS_IDS.filter(s=>has(s)).map(s=>STATUS[s].name).join(" + ")||"không";
      return ` [${h?(h.hit.includes(F.room.sessionId)?"trúng F":`trúng ${h.hit.length} người, không có F`):"không có teleHit"}, trạng thái ${st}, đòn lên F ${F.hurts.map(x=>x.immune?"miễn":x.v).join(", ")||"không"}, dạng ${sB()?.form}]`; };
    await ready(); const t1=await test(F,"tele",{i:1,bid:sb,cancel:true});
    let hitOk=t1?.bid===sb&&await waitHit()&&hitOf().hit.includes(F.room.sessionId)&&await waitFor(()=>has("slow"),500)&&!has("burn");
    ok(hitOk,`dạng ${FD.forms[0].name}: ${SS.skills[1].name} trúng gây ${STATUS.slow.name}, không ${STATUS.burn.name}${hitOk?"":why()}`);
    f=await test(F,"form",{bid:sb,next:0}); await test(F,"form",{bid:sb,next:600});
    ok(f.form===1&&await waitFor(()=>sB()?.form===2&&!sB().formWarn,1000),`đổi sang dạng ${FD.forms[1].name}`);
    // Bắt đầu báo trước ở dạng hỏa, đổi sang băng giữa chừng: chiêu vẫn theo dạng lúc bắt đầu (Thiêu đốt).
    // `tele` và `form next:0` gửi liền nhau (server xử lý theo thứ tự): dạng đổi ngay sau khi chiêu bắt đầu báo trước, không phụ thuộc
    // một vòng hỏi đáp có nhanh hơn TELE_WARN không. Hai câu trả lời nhận bằng listener riêng (`test()` chỉ giữ một câu trả lời).
    await ready(); const form0=sB()?.form, rs=[], off=F.room.onMessage("test",m=>rs.push(m));
    F.room.send("test",{op:"tele",i:1,bid:sb,cancel:true}); F.room.send("test",{op:"form",bid:sb,next:0});
    // Đủ hai câu trả lời rồi mới gỡ listener: câu tới muộn không lọt sang test() sau.
    await waitFor(()=>rs.length>=2,5000); off(); const tl=rs.find(m=>m.op==="tele"), fs=rs.find(m=>m.op==="form");
    ok(form0===2&&tl?.bid===sb&&fs?.form===0,`dạng ${FD.forms[1].name}: bắt đầu báo trước ${SS.skills[1].name}, rồi đổi ${FD.forms[0].name} ngay`);
    await test(F,"form",{bid:sb,next:600});
    const fxAt=k=>F.fxs.findIndex(x=>x.k===k&&x.bid===sb), hit=await waitHit();
    ok(hit&&fxAt("form")>=0&&fxAt("form")<fxAt("teleHit")&&sB()?.form===1,`đổi ${FD.forms[0].name} khi chiêu còn đang báo trước`);
    hitOk=hit&&hitOf().hit.includes(F.room.sessionId)&&await waitFor(()=>has("burn"),500)&&!has("slow");
    ok(hitOk,`bắt đầu ở dạng ${FD.forms[1].name}, đổi ${FD.forms[0].name} giữa lúc báo trước: chiêu vẫn gây ${STATUS.burn.name}, không ${STATUS.slow.name}${hitOk?"":why()}`);
    await test(F,"slay",{bid:sb});
  } finally {
    if(kingB()) await test(F,"kdmg",{v:1e8}).catch(()=>{}); // bài lỗi giữa chừng: không để thú vương sống sang bài khác
    await F.room.leave().catch(()=>{});
  }
}

/**
 * #187: dòng phụ hồn cốt. Hàm thuần (bộ theo vị trí, mức theo bậc, đủ dòng ở mốc cuối), rồi S cường hóa hồn cốt đang gắn qua từng
 * mốc (mỗi mốc 1 dòng, không trùng, cộng ngay vào chỉ số); hồn cốt +N tạo bằng hook `give` (chưa có dòng) được tung bù khi vào lại,
 * vào lần nữa không tung thêm (đã lưu; lượt PostgreSQL kiểm qua DB thật).
 */
export async function boneSubTest(){
  console.log("[#187] Hồn cốt: dòng phụ ngẫu nhiên ở mốc cường hóa, tung bù cho hồn cốt cũ");
  // Hàm thuần (shared/data.ts): bộ theo vị trí, mức theo bậc niên hạn, đủ dòng ở mốc cuối.
  const rd=(k,x)=>CORE_STATS[k].pct?Math.max(0.1,Math.round(x*10)/10):Math.max(1,Math.round(x));
  const inRoll=(k,v,years)=>v>=rd(k,boneSubMax(k,years)*CORE_SUB_ROLL[0])-1e-9&&v<=rd(k,boneSubMax(k,years)*CORE_SUB_ROLL[1])+1e-9;
  const poolOk=(slot,subs)=>subs.every(([k])=>BONE_SUB_POOL[slot].includes(k))&&new Set(subs.map(([k])=>k)).size===subs.length
    &&!subs.some(([k])=>k===BONE_SLOTS.find(s=>s.id===slot).stat);
  ok(BONE_SLOTS.every(s=>BONE_SUB_POOL[s.id].length>=BONE_MAX_SUBS&&BONE_SUB_POOL[s.id].every(k=>CORE_STATS[k]&&k!==s.stat))
    &&BONE_SUB_K.length===TIERS.length&&BONE_SUB_K.every((x,i)=>i===0||x>BONE_SUB_K[i-1])&&BONE_SUB_K.at(-1)===1,
    `bộ dòng phụ theo vị trí (mã CORE_STATS, không trùng chỉ số chính), hệ số theo bậc ${BONE_SUB_K.join(" / ")}`);
  ok([0,4,5,9,10,15,19,20].map(boneSubsDue).join(" ")==="0 0 1 1 2 3 3 4"&&BONE_ENHANCE_MILESTONES.length===BONE_MAX_SUBS,"số dòng phải có: một dòng mỗi mốc +5 / +10 / +15 / +20");
  ok(boneSubMax("crit",MAX_YEARS)===CORE_STATS.crit.sub&&Math.abs(boneSubMax("hp",1000)-CORE_STATS.hp.sub*BONE_SUB_K[2])<1e-9,"mức dòng phụ = CORE_STATS.sub × BONE_SUB_K theo bậc");
  { const r=boneAddSubs("tay_phai",MAX_YEARS,20,[],Math.random), r2=boneAddSubs("tay_phai",32000,10,[["crit",2]],Math.random), r3=boneAddSubs("than",5000,15,r2.subs.slice(0,1),Math.random);
    ok(r.subs.length===BONE_MAX_SUBS&&r.added.length===BONE_MAX_SUBS&&poolOk("tay_phai",r.subs)&&r.subs.every(([k,v])=>inRoll(k,v,MAX_YEARS)),`+20 từ 0 dòng: đủ ${BONE_MAX_SUBS} dòng ${JSON.stringify(r.subs)}`);
    ok(r2.added.length===1&&r2.subs[0][0]==="crit"&&r2.subs[0][1]===2&&poolOk("tay_phai",r2.subs)&&inRoll(r2.added[0][0],r2.added[0][1],32000),`+10 có 1 dòng: thêm đúng 1 dòng không trùng ${JSON.stringify(r2.subs)}`);
    ok(boneAddSubs("tay_phai",32000,9,[["crit",2]],Math.random).added.length===0&&boneAddSubs("dau",1000,4,[],Math.random).subs.length===0,"chưa qua mốc mới thì không thêm dòng");
    ok(r3.subs.length===3&&r3.added.length===2,"tung bù: thêm đúng phần còn thiếu"); }
  ok(same(parseBoneSubs({subs:[["crit",2],["crit",3],["xx",1],["hp","1"],["hp",30],["atk_pct",1],["mp",9],["mp_pct",1]]}),[["crit",2],["hp",30],["atk_pct",1],["mp",9]])&&same(parseBoneSubs({}),[]),
    "parseBoneSubs bỏ mục hỏng / trùng, tối đa 4 dòng");
  const bb=boneBonus([{slot:"tay_phai",years:32000,enhance:10,subs:[["atk_pct",3],["hp",40]]},{slot:"dau",years:1000,subs:[["atk_pct",1.5]]}]);
  ok(bb.atk===boneStats("tay_phai",32000,10).atk&&bb.atk_pct===4.5&&bb.hp===40&&bb.mp===boneStats("dau",1000).mp,"boneBonus cộng dòng phụ (cùng mã thì dồn)");
  ok(Math.abs(calcStats(0,30,[1,1],1,{atk_pct:10,crit:5,crit_dmg:10}).atk-calcStats(0,30,[1,1],1,{},{atk_pct:10}).atk)<1e-9
    &&calcStats(0,30,[1,1],1,{crit:5,crit_dmg:10}).crit===CRIT.chance+0.05&&calcStats(0,30,[1,1],1,{crit_dmg:10}).critMult===CRIT.mult+0.1,
    "calcStats: dòng % / chí mạng của hồn cốt tính như hồn hạch");
  // Trong game: S cường hóa hồn cốt đang gắn qua các mốc; hồn cốt +N tạo bằng hook (không dòng phụ) được tung bù một lần khi vào lại.
  const S=await bot("Cốt Phụ","u_minh_linh_mieu",{sex:1,hair:0,hairCol:2,outfitCol:1});
  const me=()=>S.room.state.players?.get(S.room.sessionId);
  await waitFor(()=>S.owned&&S.bag&&me(),3000);
  if(!(await test(S,"ping"))?.enabled){ needHookSkip("bỏ qua dòng phụ hồn cốt trong game (cần hook give, stats): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  try{
    const AK="am_kim_khung_trao_hung", act=S.owned.active, itemOf=id=>S.bag.items.find(i=>i.id===id);
    async function op(type,msg){ const n=S.bagMsgs??0, l=S.logs.length; S.room.send(type,msg); await waitFor(()=>(S.bagMsgs??0)>n&&S.logs.length>l,2000); await sleep(80); return S.logs.at(-1)??""; }
    async function give(years,slot,enhance=0){ const had=new Set(bonesOf(S).map(i=>i.id)); await test(S,"give",{code:BONE_ITEM,years,beast:AK,slot,enhance}); return bonesOf(S).find(i=>!had.has(i.id)); }
    const enh=(t,m)=>{ S.enh=null; return op("enhance",{targetId:t,materialIds:m}); };
    const liveOk=s=>s.live&&s.live.maxHp===s.stats.maxHp&&s.live.maxMp===s.stats.maxMp&&Math.abs(s.live.atk-s.stats.atk)<1e-6&&Math.abs(s.live.crit-s.stats.crit)<1e-9&&Math.abs(s.live.critMult-s.stats.critMult)<1e-9;
    const subsOf=id=>parseBoneSubs(itemOf(id)?.stats);
    await test(S,"rest",{s:TEAM_COMBAT_SECS+1});
    // #281: đủ phí đưa một hồn cốt +0 → +20 qua nhiều lần (tổng bằng một lần), dư 777 đồng; mỗi lần trừ đúng phí các cấp vừa qua.
    const feeAll=enhanceFee(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE); await test(S,"coin",{n:feeAll+777}); await waitFor(()=>S.bag.honTe===feeAll+777,1500);
    let paid=0; const feeOk=()=>{ const e=S.enh; if(!e) return false; paid+=e.fee; return e.fee===enhanceFee(BONE_ENHANCE_FEE,e.from,e.to)&&S.bag.honTe===feeAll+777-paid; };
    const tp=await give(32000,"tay_phai"); await op("equip",{itemId:tp.id,vohonId:act});
    ok(itemOf(tp.id)?.vohon===act&&subsOf(tp.id).length===0,"đích: Tay phải 32.000 năm đang gắn, chưa có dòng phụ");
    // +0 -> +8 (qua mốc +5): một dòng.
    let m=await give(32000,"tay_phai"), t=await enh(tp.id,[m.id]), s1=await test(S,"stats"), sub=subsOf(tp.id), fees=[feeOk()];
    ok(itemOf(tp.id).enhance>=5&&itemOf(tp.id).enhance<10&&sub.length===1&&poolOk("tay_phai",sub)&&inRoll(sub[0][0],sub[0][1],32000),
      `qua mốc +5 (lên +${itemOf(tp.id).enhance}): thêm 1 dòng ${coreStatText(...(sub[0]??["hp",0]))}`);
    ok(same(S.enh?.subs,sub.map(([k,v])=>({k,v})))&&t.includes(`thêm dòng phụ ${coreStatText(...(sub[0]??["hp",0]))}`),`tin "enhanced" và log báo dòng vừa thêm: ${t}`);
    ok(s1.bones[sub[0]?.[0]]>=sub[0]?.[1]&&liveOk(s1),"dòng phụ cộng ngay vào võ hồn ra trận (boneBonus, calcStats)");
    // Không qua mốc mới: không thêm dòng.
    const lv1=itemOf(tp.id).enhance; m=await give(1000,"tay_phai"); await enh(tp.id,[m.id]); fees.push(feeOk());
    ok(itemOf(tp.id).enhance<10&&same(subsOf(tp.id),sub)&&(S.enh?.subs??[]).length===0,`+${lv1} -> +${itemOf(tp.id).enhance} chưa tới mốc +10: dòng phụ giữ nguyên`);
    // Qua +10 và +15 một lần: thêm 2 dòng; rồi +20: đủ 4 dòng, không trùng, không trùng chỉ số chính.
    const ms=[await give(MAX_YEARS,"tay_phai"),await give(MAX_YEARS,"tay_phai")]; t=await enh(tp.id,ms.map(x=>x.id)); fees.push(feeOk()); const lv2=itemOf(tp.id).enhance, sub2=subsOf(tp.id);
    ok(lv2>=15&&lv2<20&&sub2.length===3&&same(sub2[0],sub[0])&&poolOk("tay_phai",sub2)&&sub2.every(([k,v])=>inRoll(k,v,32000))&&(S.enh?.subs??[]).length===2,
      `qua mốc +10, +15 cùng lúc (lên +${lv2}): thêm 2 dòng ${JSON.stringify(sub2.slice(1))}`);
    const m20=[]; for(let k=0;k<4;k++) m20.push((await give(MAX_YEARS,"tay_phai")).id);
    await enh(tp.id,m20); fees.push(feeOk()); const sub4=subsOf(tp.id), s4=await test(S,"stats");
    ok(fees.every(Boolean)&&paid===feeAll&&S.bag.honTe===777,`#281: 4 lần cường hóa +0 → +${BONE_MAX_ENHANCE} trả phí từng lần đúng các cấp vừa qua, tổng ${formatHonTe(paid)} (= một lần), còn ${formatHonTe(S.bag.honTe)}`);
    ok(itemOf(tp.id).enhance===BONE_MAX_ENHANCE&&sub4.length===BONE_MAX_SUBS&&poolOk("tay_phai",sub4)&&same(sub4.slice(0,3),sub2),
      `+${BONE_MAX_ENHANCE}: đủ ${BONE_MAX_SUBS} dòng ${sub4.map(x=>coreStatText(...x)).join(", ")}`);
    const want=boneBonus([{slot:"tay_phai",years:32000,enhance:BONE_MAX_ENHANCE,subs:sub4}]);
    ok(CORE_STAT_IDS.every(k=>Math.abs(s4.bones[k]-want[k])<1e-9)&&liveOk(s4),"chỉ số trong trận khớp boneBonus kèm 4 dòng phụ");
    // UI-2 (#352): tin riêng "stats" của bảng nhân vật = đúng chỉ số server dùng khi đánh (calcStats, kèm hồn cốt đang gắn), `base` là khi không gắn gì.
    { const n0=S.charStatsMsgs??0; S.room.send("stats",{rowId:act}); await waitFor(()=>(S.charStatsMsgs??0)>n0,3000);
      const cs=S.charStats, sameStat=(x,y)=>["maxHp","maxMp","speed","crit","critMult"].every(k=>Math.abs(x[k]-y[k])<1e-9)&&Math.abs(x.atk-y.atk)<1e-6;
      ok(cs&&cs.rowId===act&&sameStat(cs.total,s4.stats)&&sameStat(cs.base,s4.base),"tin stats: chỉ số tổng hợp và gốc khớp số server tính (calcStats)");
      ok(cs&&cs.total.maxHp===s4.live.maxHp&&cs.total.maxMp===s4.live.maxMp&&Math.abs(cs.total.atk-s4.live.atk)<1e-6&&Math.abs(cs.total.crit-s4.live.crit)<1e-9&&Math.abs(cs.total.critMult-s4.live.critMult)<1e-9,
        "tin stats khớp chỉ số đang dùng khi đánh (live: sinh lực, hồn lực, công, chí mạng)");
      ok(cs&&cs.total.atk>cs.base.atk&&cs.total.atk-cs.base.atk>=s4.bones.atk-1e-6,"tin stats: phần hồn cốt đang gắn cộng vào công (tổng > gốc)");
      const n1=S.charStatsMsgs; S.room.send("stats",{rowId:-5}); S.room.send("stats",{rowId:"x"}); await waitFor(()=>(S.charStatsMsgs??0)>n1,3000);
      ok(S.charStats.rowId===act,"tin stats với rowId lạ: trả võ hồn ra trận, không lỗi");
      // Xin dồn trong một nhịp ASK_CD (bấm nhanh qua các thẻ): tin hẹn cuối phải là võ hồn xin sau cùng, không phải lần xin đầu.
      await sleep(400); const other=S.owned.list.find(v=>v.rowId!==act)?.rowId, ids=other?[act,act,other]:[act,act,act], n2=S.charStatsMsgs??0;
      for(const r of ids) S.room.send("stats",{rowId:r}); await sleep(900);
      ok((S.charStatsMsgs??0)>n2&&S.charStats.rowId===ids[2],`xin stats dồn ${ids.join(", ")}: tin cuối là võ hồn xin sau cùng (${S.charStats.rowId})`); }
    // Tung bù: hồn cốt +N tạo bằng hook (như hồn cốt cường hóa trước #187) chưa có dòng phụ.
    const old=[[await give(12000,"than",12),2],[await give(MAX_YEARS,"dau",20),4],[await give(5000,"chan_trai",4),0]];
    await op("equip",{itemId:old[1][0].id,vohonId:act});
    ok(old.every(([it])=>subsOf(it.id).length===0),"hồn cốt +12 / +20 / +4 tạo bằng hook: chưa có dòng phụ");
    const rejoin=async()=>{ await S.room.leave(); await sleep(400); S.mapId=(await post("/api/me",{token:S.token})).mapId; S.bag=null; await enter(S); S.room.send("bag"); await waitFor(()=>me()&&S.bag&&S.owned,3000); };
    await rejoin();
    const got=old.map(([it])=>subsOf(it.id)), s5=await test(S,"stats");
    ok(S.bag.honTe===777,`#281: vào lại, Hồn Tệ sau phí cường hóa đã lưu (${formatHonTe(S.bag.honTe)})`);
    ok(old.every(([it,n],i)=>got[i].length===n&&poolOk(it.stats.slot,got[i])&&got[i].every(([k,v])=>inRoll(k,v,it.years))),
      `vào lại: tung bù đúng số dòng còn thiếu (+12: ${got[0].length}, +20: ${got[1].length}, +4: ${got[2].length})`);
    ok(same(subsOf(tp.id),sub4),"hồn cốt đã đủ dòng không bị tung thêm");
    ok(itemOf(old[1][0].id)?.vohon===act&&CORE_STAT_IDS.every(k=>Math.abs(s5.bones[k]-boneBonus([{slot:"tay_phai",years:32000,enhance:20,subs:sub4},{slot:"dau",years:MAX_YEARS,enhance:20,subs:got[1]}])[k])<1e-9)&&liveOk(s5),
      "dòng tung bù của hồn cốt đang gắn cộng vào chỉ số ngay khi vào");
    await rejoin();
    ok(old.every(([it],i)=>same(subsOf(it.id),got[i]))&&same(subsOf(tp.id),sub4),"vào lại lần nữa: không tung thêm, dòng phụ giữ nguyên (đã lưu)");
  } finally { await S.room.leave(); }
}

/** #249: bài "liên kích ở đòn thứ 3" của nhóm 1 (comboHits) lặp COMBO_ROUNDS lượt trên một bot riêng gắn 4 hồn hạch Hạo Thiên. */
export async function comboTest(){
  console.log("[#249] Hạo Thiên 4 món: liên kích ở đòn thứ 3, lặp nhiều lượt");
  const H=await bot("Liên Kích","u_minh_linh_mieu",{sex:0,hair:1,hairCol:3,outfitCol:2}), me=()=>H.room.state.players?.get(H.room.sessionId);
  await waitFor(()=>H.owned&&H.bag&&me(),3000);
  if(!(await test(H,"ping"))?.enabled){ needHookSkip("bỏ qua liên kích (cần hook give, beast, status): bật server bằng GAME_TEST=1"); await H.room.leave(); return; }
  try{
    const act=H.owned.active, cores=()=>(H.bag?.items??[]).filter(i=>i.code===CORE_ITEM);
    await test(H,"set",{rowId:act,level:100,xp:0,rings:[400,700,1700,5000,12000,20000,50000,100000,100000]});
    for(let k=0;k<4;k++) await test(H,"give",{code:CORE_ITEM,stars:6,set:"hao_thien"});
    for(const it of cores()){ const n=H.bagMsgs??0; H.room.send("equipcore",{itemId:it.id,vohonId:act}); await waitFor(()=>(H.bagMsgs??0)>n,2000); }
    const fx=(await test(H,"stats")).fx;
    ok(same(fx,{atk:0.15,combo:0.4}),`gắn 4 hồn hạch Hạo Thiên: ${JSON.stringify(fx)}`);
    // Chỗ đứng ngay ngoài mép đông làng (đánh được), quay mặt về đông.
    const sv=JSON.parse(readFileSync(mapUrl("thanh_hon_thon"),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="safe");
    let at=null; for(let dy=0;dy<=sv.height/2&&!at;dy+=8) for(const sg of [1,-1]){ const x=sv.x+sv.width+40, y=Math.round(sv.y+sv.height/2+sg*dy);
      await test(H,"goto",{x,y}); if(Math.hypot(me().x-x,me().y-y)<1){ at={x,y}; break; } }
    ok(!!at,`đứng ngoài mép đông làng (${at?.x},${at?.y})`);
    if(!at||!fx?.combo) return;
    const N=Number(process.env.COMBO_ROUNDS??10); let good=0;
    for(let r=0;r<N;r++){
      await test(H,"goto",at); await step(H,1,0); await test(H,"clear");
      const bid=(await test(H,"beast",{dx:12,dy:0,years:MAX_YEARS}))?.bid; await test(H,"bhp",{bid,pct:100}); await test(H,"status",{s:"root",secs:10,bid}); await test(H,"ready");
      const {combos,why}=await comboHits(H,bid);
      if(!same(combos,[0,0,1])){ ok(false,`lượt ${r+1}/${N}: liên kích ở đòn thứ 3 (${combos.join(", ")}) [${why}]`); break; }
      good++;
    }
    if(good===N) ok(true,`${N}/${N} lượt: liên kích đúng ở đòn thứ 3`);
  } finally { await H.room.leave(); }
}
