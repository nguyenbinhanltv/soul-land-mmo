// Nhóm bot "autoBoss" (#703 bước 6, tách nguyên văn từ bot-test.mjs): Tự săn đánh tinh anh, thú vương, boss thế giới.
import { readFileSync } from "node:fs";
import { sleep, waitFor, ok, mapUrl, bot, enter, sendTeam, same, test } from "./lib.mjs";
import { BEASTS, VOHON, vohonIndex, STATUS, statusBit, TEAM_COMBAT_SECS, MAPS, beastSkillOf, TELE_PAD, BOSSES, bossIndex, beastIndex, ELITE, beastName, KING, WORLD_SLAM, teleSafe, SWITCH_CD, CHAN_THAN_RING, ringSkill, AWAKEN_CHOICES, TICK_RATE, SYNC_VIEW, AUTO_MAX_PER_CELL, AUTO_DEFAULTS, parseAuto, AUTO_BOSS } from "../../../shared/data.ts";

/**
 * Vùng lưu lại trên mặt đất (#161, mục 5.3; BOT_ONLY=ground chỉ chạy phần này): 4 chiêu vũng / sương độc có `ground` (tinh anh theo
 * bảng gốc: Nổ Túi Độc 6 giây, Lân Độc Vụ 8 giây). Trên Thánh Hồn Thôn, ngay ngoài làng: Độc Vụ Thiềm tung Sương Độc dưới chân bot thì
 * để lại sương (state.grounds), đứng trong sương thì Trúng độc cộng tầng theo nhịp, ra khỏi sương thì thôi nhận, sương mất khi hết
 * giờ; người ở xa không có vùng trong state, lại gần (vào tầm sau khi vùng đã có) thì thấy; vũng ở mép làng: bước vào làng (vùng an
 * toàn, vẫn trong vũng) thì hết độc và không nhận thêm; hồn thú gây ra bị hạ thì vũng mất ngay.
 */
export async function autoBossTest(){
  console.log("[#218] Tự săn đánh tinh anh, thú vương, boss thế giới: né chiêu báo trước / vùng độc, đóng góp, giới hạn thưởng");
  ok(AUTO_DEFAULTS.elite&&AUTO_DEFAULTS.king&&AUTO_DEFAULTS.world&&["elite","king","world"].every(k=>parseAuto({})[k]===true)
    &&!parseAuto({elite:false}).elite&&parseAuto({elite:false}).king&&parseAuto({king:0}).king===true&&!parseAuto({world:false}).world,
    "3 công tắc tinh anh / thú vương / boss thế giới mặc định bật, bản lưu cũ / sai kiểu thì bật");
  const A=await bot("Săn Boss","cuu_tinh_that_sat_kiem",{sex:0,hair:1,hairCol:3,outfitCol:2});
  if(!(await test(A,"ping"))?.enabled){ console.log("  ⚠ bỏ qua tự săn đánh boss (cần hook warp, goto, spawn, tele, elite, king, wmech, auto): bật server bằng GAME_TEST=1"); await A.room.leave(); return; }
  const NV="tinh_dau_ngoai_vi", LT="loi_tinh_dau", VIEN="thai_than_cu_vien";
  let sid=A.room.sessionId; // đổi mỗi lần vào phòng mới (warp)
  const me=()=>A.room.state.players?.get(A.room.sessionId), objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const autoOp=async(op,more={})=>{ A.autoMsg=null; A.room.send("auto",{op,...more}); await waitFor(()=>A.autoMsg,1500); return A.autoMsg; };
  const info=async(more={})=>(await test(A,"auto",more))??{};
  /** Chờ điều kiện bất đồng bộ (đọc hook test) tới `ms` mili giây. */
  const until=async(fn,ms=5000)=>{ for(let t=0;t<=ms;t+=200){ if(await fn()) return true; await sleep(200); } return false; };
  async function warp(mapId,x,y){ A.travel=null; await test(A,"warp",{mapId,x,y}); await waitFor(()=>A.travel,4000); const tv=A.travel;
    await A.room.leave(); await sleep(300); A.mapId=mapId; await enter(A,tv?.roomId??undefined); await waitFor(()=>me()&&A.bag&&A.owned,3000);
    sid=A.room.sessionId; await test(A,"view",{all:true}); return A.room.state.mapId===mapId; }
  /** Đứng ở chỗ đứng được đầu tiên quanh (x, y), bán kính `r0`.. theo 8 hướng, thỏa `cond`. */
  async function near(x,y,r0=60,cond=()=>true){ for(let r=r0;r<=r0+120;r+=20) for(let k=0;k<8;k++){ const a=k*Math.PI/4, px=Math.round(x+r*Math.cos(a)), py=Math.round(y+r*Math.sin(a));
    if(!cond(px,py)) continue; await test(A,"goto",{x:px,y:py}); if(Math.hypot(me().x-px,me().y-py)<1) return true; } return false; }
  const cfg=(o={})=>autoOp("set",{cfg:{...AUTO_DEFAULTS,...o}});
  /**
   * Đổi đội hình (ngoài giao chiến mới đổi được: nghỉ TEAM_COMBAT_SECS giây bằng hook rest trước). Dọn hồn thú thường quanh mình trước (giữ
   * tinh anh / thú vương / boss): hồn kỹ nhiều nhát tự săn vừa tung (Vô Ngã Kiếm Trận: 6 nhát trong 3 giây) vẫn đánh hồn thú quanh A sau
   * khi tắt tự săn, mỗi nhát trúng là giao chiến lại; nhát rơi giữa hook rest và tin team thì server từ chối đổi đội hình (#268).
   */
  const team=async slots=>{ for(let k=0;k<4&&!same(A.owned.team,slots);k++){ await test(A,"clear",{keep:true}); await test(A,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(A,slots); if(!same(A.owned.team,slots)) await sleep(500); } return same(A.owned.team,slots); };
  /**
   * Võ hồn chính của lượt tự săn là võ hồn ra trận lúc bật (tiên cơ / cơ chế đổi tay lượt trước có thể để lại võ hồn khác): đổi về `row`.
   * Tin vohons tới trước bản vá state: chờ võ hồn trong state (vh, cùng bản vá với swCd) khớp võ hồn ra trận của tin vohons rồi mới đọc swCd
   * (tự săn vừa đổi tay thì swCd đọc được có lúc còn 0) và trước khi trả về; server vẫn bỏ qua tin switch (không trả lời) thì gửi lại.
   */
  const vhSynced=()=>waitFor(()=>me().vh===vohonIndex(A.owned.list.find(v=>v.rowId===A.owned.active)?.vohon??""),1500);
  const swReady=async()=>{ await vhSynced(); await waitFor(()=>!(me().swCd>0),SWITCH_CD*1000+500); };
  const toRow=async row=>{ if(!A.owned.team.includes(row)) return false; await swReady();
    for(let k=0;k<3&&A.owned.active!==row;k++){ A.room.send("switch",{slot:A.owned.team.indexOf(row)});
      if(!await waitFor(()=>A.owned.active===row,1500)&&k<2) await swReady(); }
    await vhSynced(); return A.owned.active===row; };
  try{
    await waitFor(()=>me()&&A.bag&&A.owned,3000);
    // Đội: võ hồn chính (cường công), Lam Ngân Thảo (khống chế), Xúc Xích (phụ trợ, hồn kỹ thanh tẩy ở ô U); mọi võ hồn cấp 100, 9 hồn hoàn.
    await test(A,"grant",{vohon:"xuc_xich"}); await waitFor(()=>A.owned.list.some(v=>v.vohon==="xuc_xich"),3000);
    const rowOf=v=>A.owned.list.find(x=>x.vohon===v)?.rowId, main=A.owned.active, LAM=rowOf("lam_ngan_thao"), XUC=rowOf("xuc_xich");
    await sendTeam(A,[main,LAM,XUC,0]);
    const R9=[400,700,1700,5000,12000,20000,50000,100000,100000];
    for(const v of A.owned.list) await test(A,"set",{rowId:v.rowId,level:100,xp:0,rings:R9});
    const cr=[...Array(R9.length).keys()].find(r=>r!==CHAN_THAN_RING-1&&ringSkill("xuc_xich",r)?.self?.cleanse);
    { const n=A.ownedMsgs; A.room.send("loadout",{rowId:XUC,skills:[cr,0,1,2]}); await waitFor(()=>A.ownedMsgs>n,1500); }
    ok(A.owned.team[1]===LAM&&A.owned.team[2]===XUC&&cr>=0,`đội: ${VOHON[me().vh].name} + Lam Ngân Thảo (khống chế) + Xúc Xích (phụ trợ, ô U: ${ringSkill("xuc_xich",cr)?.name})`);

    // ---- Tinh Đấu Ngoại vi: né chiêu báo trước và vũng độc (mọi lúc tự săn) ----
    const ar=objsOf(NV).find(o=>o.type==="arrive"&&o.name==="tu_nac_dinh_thanh"), safe=objsOf(NV).filter(o=>o.type==="safe"||o.type==="spawn");
    const farSafe=(x,y)=>safe.every(o=>x<o.x-80||x>o.x+o.width+80||y<o.y-80||y>o.y+o.height+80);
    ok(await warp(NV,ar.x,ar.y),`tới ${MAPS[NV].name}`);
    let placed=false; for(let r=200;r<=1200&&!placed;r+=100) placed=await near(ar.x,ar.y,r,farSafe);
    ok(placed,`đứng ngoài trại cổng (${me().x},${me().y})`);
    await test(A,"clear",{keep:true});
    const tt=beastSkillOf("that_tinh_doc_thiem",5000);
    const P=(await test(A,"spawn",{species:"that_tinh_doc_thiem",years:5000,tier:2,dx:50,dy:0,hpx:1000}))?.bid, pb=()=>A.room.state.beasts.get(P);
    await cfg({elite:false,king:false,world:false}); let m=await autoOp("on");
    ok(m?.on&&await until(async()=>(await info()).target===P,4000),`tự săn nhắm ${BEASTS[beastIndex("that_tinh_doc_thiem")].name} (${tt.name}: vòng bán kính ${tt.r} dưới chân, báo trước ${tt.warn} giây, để lại vũng độc)`);
    await waitFor(()=>pb()&&Math.hypot(pb().x-me().x,pb().y-me().y)<40,6000);
    const d0=(await info()).dodges; A.fxs=[];
    const tl=await test(A,"tele",{i:0,bid:P,cancel:true});
    const fired=await waitFor(()=>A.fxs.some(f=>f.k==="teleHit"&&f.bid===P),tt.warn*1000+1500), th=A.fxs.find(f=>f.k==="teleHit"&&f.bid===P), at=me();
    let ai=await info();
    ok(tl?.bid===P&&fired&&!th.hit.includes(sid)&&ai.dodges>d0,`${tt.name} nhắm A: tự săn né ra khỏi vùng trước khi nổ (không trúng; ${ai.dodges-d0} lần né; `
      +`tâm vùng ${th?.x?.toFixed(0)},${th?.y?.toFixed(0)}, A lúc nổ ${at.x.toFixed(0)},${at.y.toFixed(0)}, trúng ${JSON.stringify(th?.hit)})`);
    const pool=(await test(A,"ground",{ttl:30}))?.grounds?.find(z=>z.src===P);
    // Chẩn đoán (#328): lề nhỏ nhất (khoảng cách tới tâm trừ r + TELE_PAD) và chỗ A / P lúc đó.
    let inPool=0, low=null; for(let k=0;k<15;k++){ if(pool){ const g=Math.hypot(me().x-pool.x,me().y-pool.y)-pool.r-TELE_PAD; if(g<=0) inPool++;
      if(!low||g<low.g) low={g,a:[me().x.toFixed(1),me().y.toFixed(1)],p:pb()?[pb().x.toFixed(0),pb().y.toFixed(0)]:null,k}; } await sleep(200); }
    ok(pool&&inPool===0&&me().auto,`vũng độc còn ${pool?.ttl?.toFixed(0)} giây: tự săn đánh tiếp mà không bước vào vũng (3 giây)`
      +(pool&&inPool===0&&me().auto?"":` [vũng ${pool?`${pool.x.toFixed(0)},${pool.y.toFixed(0)} r${pool.r}`:"không có"}, ${inPool}/15 lần trong vũng, lề nhỏ nhất ${low?.g?.toFixed(2)} ở lần ${low?.k} (A ${low?.a}, P ${low?.p}), tự săn ${me().auto?"bật":`dừng: ${A.autoMsg?.why}`}, ${JSON.stringify(await info().then(x=>({target:x.target,dodge:x.dodge,dodges:x.dodges})))}]`));
    // Bật tự săn khi đang đứng trong vũng: ra khỏi vũng ngay.
    await autoOp("off"); await test(A,"goto",{x:Math.round(pool.x),y:Math.round(pool.y)});
    const d1=(await info()).dodges; m=await autoOp("on");
    ok(m?.on&&await waitFor(()=>Math.hypot(me().x-pool.x,me().y-pool.y)>pool.r+TELE_PAD,2500)&&(await info()).dodges>d1,`đứng giữa vũng rồi bật: ra khỏi vũng (cách tâm ${Math.hypot(me().x-pool.x,me().y-pool.y).toFixed(0)} pixel)`);
    await autoOp("off"); await test(A,"slay",{bid:P});

    // ---- Tinh anh: mục tiêu chung, đóng góp, khóa ELITE.lock, công tắc ----
    let el=(await test(A,"elite")).list; if(!el.some(e=>e.bid)){ await test(A,"erespawn",{s:0}); await until(async()=>(el=(await test(A,"elite")).list).some(e=>e.bid),3000); }
    const E1=el.find(e=>e.bid), lockKey=`${NV}|${E1?.boss}`;
    ok(E1&&await near(E1.x,E1.y,70,farSafe),`${E1?.name} ở ${E1?.zone}: đứng cách ${Math.hypot(E1.x-me().x,E1.y-me().y).toFixed(0)} pixel`);
    // Đang khóa thưởng loài tinh anh này (đặt khóa thẳng bằng hook elock {key}): tự săn không nhắm (vào đánh chỉ làm tinh anh nhiều máu hơn
    // cho người khác); hết khóa thì nhắm.
    await test(A,"bmax",{bid:E1.bid,x:1000}); await test(A,"elock",{key:lockKey,s:120}); await test(A,"clear",{keep:true});
    await cfg({years:[0,0],king:false,world:false}); m=await autoOp("on");
    let took=!m?.on; for(let k=0;k<12;k++){ ai=await info(); if(ai.target===E1.bid) took=true; await sleep(250); }
    ok(!took,`đang khóa thưởng ${lockKey}: tự săn không nhắm tinh anh (mục tiêu ${ai.target})`);
    await test(A,"elock",{s:0});
    ok(await until(async()=>{ ai=await info(); return ai.target===E1.bid&&ai.boss; },4000),`hết khóa: tự săn (khoảng niên hạn trống) tới đánh tinh anh trước cả hồn thú đang đánh mình (mục tiêu ${ai.target})`);
    let one=null;
    ok(await until(async()=>{ one=(await test(A,"elite",{bid:E1.bid})).one; return one?.engaged&&one.parts.includes(sid)&&one.dmgBy[sid]>0; },10000),
      `thành người tham gia, đóng góp ${one?.dmgBy?.[sid]} sát thương`);
    await cfg({years:[0,0],elite:false,king:false,world:false});
    ok(await until(async()=>(await info()).target!==E1.bid,2000)&&me().auto,"tắt công tắc Tinh anh: thôi nhắm tinh anh, vẫn tự săn");
    await cfg({years:[0,0],king:false,world:false});
    ok(await until(async()=>(await info()).target===E1.bid,4000),"bật lại: nhắm lại tinh anh");
    const k0=me().kills, lowHp=async bid=>{ const b=A.room.state.beasts.get(bid); if(b) await test(A,"kdmg",{bid,v:Math.max(1,b.hp-200)}); };
    await lowHp(E1.bid);
    ok(await waitFor(()=>!A.room.state.beasts.has(E1.bid)&&me().kills>k0,30000),
      `tự săn hạ tinh anh [tự săn ${JSON.stringify(await info().then(x=>({target:x.target,boss:x.boss,away:x.away})))}, A ${me().x?.toFixed(0)},${me().y?.toFixed(0)} ${me().hp}/${me().maxHp}, tinh anh ${A.room.state.beasts.get(E1.bid)?.hp}]`);
    const lk=(await test(A,"elock")).locks; ok(lk[lockKey]>ELITE.lock-30,`nhận thưởng tinh anh: khóa ${lockKey} ${Math.round(lk[lockKey]??0)} giây`);
    await autoOp("off");

    // ---- Thú vương: mục tiêu chung, giới hạn KING.daily, lùi khi ít máu, hạ thì nhận rương ----
    // Bỏ Xúc Xích khỏi đội trong phần này: trạng thái xấu lâu của thú vương làm tự săn đổi sang Xúc Xích thanh tẩy (đầy máu), lẫn với bước lùi.
    ok(await toRow(main)&&await team([main,LAM,0,0]),"thú vương: đội chỉ võ hồn chính + Lam Ngân Thảo");
    await test(A,"king",{kop:"spawn"}); await waitFor(()=>[...A.room.state.beasts.values()].some(b=>b.rank===2),2000);
    let ki=await test(A,"king"); const LR=ki.lair, KB=ki.bid, kb=()=>A.room.state.beasts.get(KB);
    await test(A,"bmax",{bid:KB,x:1000});
    const inL=(x,y)=>x>=LR.x&&x<=LR.x+LR.w&&y>=LR.y&&y<=LR.y+LR.h;
    ok(KB&&await near(LR.x+LR.w/2,LR.y+LR.h/2,Math.max(LR.w,LR.h)/2+30,(x,y)=>!inL(x,y)&&farSafe(x,y)),`thú vương ${beastName(2,kb()?.species)} trong hang; A đứng ngoài hang`);
    await cfg({years:[0,0],elite:false,world:false}); m=await autoOp("on");
    ok(m?.on&&await until(async()=>{ ai=await info(); return ai.target===KB&&ai.boss; },10000),"tự săn tới đánh thú vương");
    ok(await until(async()=>{ ki=await test(A,"king"); return ki.parts?.includes(sid)&&ki.dmgBy?.[sid]>0; },30000),`đóng góp được ghi: ${ki.dmgBy?.[sid]} sát thương`);
    await info({kn:KING.daily});
    ok(await until(async()=>(await info()).target!==KB,8000),`hết lượt rương hôm nay (${KING.daily}/${KING.daily}): thôi nhắm thú vương`);
    await info({kn:0});
    // Chờ theo state (không theo giờ cố định): server chạy chậm trên runner CI thì nhịp quyết định (AUTO_HZ) và đi bộ đều chậm theo,
    // 3 giây thật không đủ; điều kiện vẫn như cũ, chỉ có trần chờ rộng hơn. Kèm vết mục tiêu / sinh lực để lần trượt sau còn chẩn đoán.
    const tg=[]; ok(await until(async()=>{ const x=await info(); tg.push(`${me().hp}/${me().maxHp}${x.away?" lùi":""} ${x.target===KB?"nhắm":x.target??"-"}`); return x.target===KB; },15000),
      `còn lượt: nhắm lại thú vương [${tg.slice(-8).join(" | ")}]`);
    // Ít máu (không uống đan): lùi ra cách thú vương ít nhất AUTO_BOSS.dist, hồi đủ thì quay lại.
    // Không đổi tay tiên cơ, không tung hồn kỹ trong bước này (đổi sang võ hồn còn đầy máu, hồn kỹ hút máu / hồi máu cũng là cách thoát,
    // nhưng ở đây thử lùi).
    // Thú vương đứng Choáng trong bước này: đánh tiếp lúc còn 20% sinh lực thì võ hồn ra trận gục trước khi kịp lùi (võ hồn khác vào thay).
    await cfg({years:[0,0],elite:false,world:false,hp:0,tienCo:false,skills:[]}); await waitFor(()=>!(me().swCd>0),SWITCH_CD*1000+500);
    // Đứng ngoài tầm đánh thường lúc mất máu: một đòn trúng có hút huyết trước nhịp quyết định kế tiếp đã đủ hồi lại (khi đó không cần lùi).
    await test(A,"status",{s:"stun",secs:10,bid:KB}); await near(kb().x,kb().y,72,(x,y)=>farSafe(x,y));
    await test(A,"hurt",{pct:80}); const rt=[`${me().hp}/${me().maxHp}`];
    // Chờ bản vá state mang sinh lực mới tới bot (hook trả trước bản vá), rồi chờ cờ lùi và quãng đi ra theo state, không theo giờ cố định.
    await waitFor(()=>me().hp<me().maxHp*AUTO_BOSS.retreat,5000);
    const sample=async()=>{ ai=await info(); rt.push(`${me().hp}/${me().maxHp} ${VOHON[me().vh].id.slice(0,5)}${ai.away?" lùi":""} ${Math.hypot(me().x-kb().x,me().y-kb().y).toFixed(0)}px`); return ai; };
    ok(await until(async()=>(await sample()).away,10000)
      &&await waitFor(()=>Math.hypot(me().x-kb().x,me().y-kb().y)>=AUTO_BOSS.dist-8,15000),
      `sinh lực ${me().hp}/${me().maxHp} dưới ${AUTO_BOSS.retreat*100}%: lùi ra cách thú vương ${Math.hypot(me().x-kb().x,me().y-kb().y).toFixed(0)} pixel [${rt.slice(-12).join(" | ")}]`);
    await test(A,"pregen",{s:0,hp:100,mp:100});
    ok(await until(async()=>{ ai=await info(); return !ai.away&&ai.target===KB; },10000),"hồi đủ sinh lực: quay lại đánh");
    await cfg({years:[0,0],elite:false,world:false});
    await lowHp(KB);
    ok(await waitFor(()=>!kb(),30000),"tự săn hạ thú vương");
    const cl=await test(A,"claims");
    ok(cl?.n===1&&cl.db===1&&A.logs.some(t=>/^Nhận .*Rương/i.test(t)||/Nhận .*rương/i.test(t)),`đóng góp đủ: nhận rương, lượt ${cl?.n}/${KING.daily} hôm nay (DB ${cl?.db})`);
    await autoOp("off");

    // ---- Lõi Tinh Đấu: boss thế giới (tự săn bật được ở bản đồ boss), ngắt tích lực, né chiêu toàn sàn, thanh tẩy ----
    ok(await team([main,LAM,XUC,0]),"boss thế giới: đội có lại Xúc Xích (phụ trợ)");
    const arLT=objsOf(LT).find(o=>o.type==="arrive"&&o.name==="tu_tinh_dau_noi_dia");
    ok(await warp(LT,arLT.x,arLT.y),`tới ${MAPS[LT].name}`);
    await test(A,"king",{kop:"spawn",mapId:LT,boss:VIEN}); await waitFor(()=>[...A.room.state.beasts.values()].some(b=>b.rank===3),2000);
    await test(A,"wmech",{m:"hold",secs:300}); await test(A,"wmech",{m:"timers"});
    ki=await test(A,"king"); const WB=ki.bid, wb=()=>A.room.state.beasts.get(WB), WL=ki.lair, inW=(x,y)=>x>=WL.x&&x<=WL.x+WL.w&&y>=WL.y&&y<=WL.y+WL.h;
    await test(A,"bmax",{bid:WB,x:100});
    ok(WB&&await near(wb().x,wb().y,40,inW),"A vào sàn đấu cạnh boss thế giới");
    // Không đổi tay tiên cơ ở phần này: chỉ đổi võ hồn theo cơ chế boss (khống chế, phụ trợ). Võ hồn chính của lượt tự săn là võ hồn ra
    // trận lúc bật: đổi về võ hồn chính trước.
    await toRow(main);
    await cfg({years:[0,0],elite:false,king:false,tienCo:false}); m=await autoOp("on");
    ok(m?.on&&await until(async()=>{ ai=await info(); return ai.target===WB&&ai.boss; },3000),`bật tự săn ở ${MAPS[LT].name} (bản đồ boss): đánh boss thế giới`);
    ok(await until(async()=>(ki=await test(A,"king")).dmgBy?.[sid]>0,8000),`đóng góp ${ki.dmgBy?.[sid]} sát thương`);
    const DV=BOSSES[bossIndex(VIEN)], CH=DV.world.charge.skill;
    // Tiên cơ có thể vừa đổi tay: chờ hết hồi chiêu đổi, hồn kỹ sẵn sàng rồi mới cho tích lực.
    await waitFor(()=>!(me().swCd>0),SWITCH_CD*1000+500); await test(A,"ready");
    A.boss=[]; A.fxs=[]; await test(A,"wmech",{m:"hold",secs:0}); await test(A,"wmech",{m:"charge"});
    // Lần ngắt chỉ tính khi võ hồn Khống chế đang ra trận (worldBreak): có tin `brk` của A là đã đổi sang Lam Ngân Thảo.
    const vhs=new Set(); await waitFor(()=>{ vhs.add(VOHON[me().vh].id); return A.boss.some(x=>x.k==="brk"&&x.by===me().name); },CH.warn*1000);
    // Tin `brk` có thể tới trước bản vá state mang võ hồn vừa đổi (#362: lần ngắt đã tính, tức server thấy Khống chế ra trận, mà bot chưa
    // thấy Lam Ngân Thảo); đổi lại phải chờ SWITCH_CD giây nên bản vá kế tiếp luôn còn Lam Ngân Thảo: chờ thấy nó.
    if(A.boss.some(x=>x.k==="brk"&&x.by===me().name)) await waitFor(()=>{ vhs.add(VOHON[me().vh].id); return vhs.has("lam_ngan_thao"); },1000);
    ok(A.boss.some(x=>x.k==="brk"&&x.by===me().name)&&vhs.has("lam_ngan_thao"),`boss tích lực ${CH.name}: đổi sang Lam Ngân Thảo (khống chế) và ngắt (${A.boss.filter(x=>x.k==="brk").length} lần; võ hồn ra trận ${[...vhs].join(" → ")})`);
    await waitFor(()=>!wb()||!wb().chg||A.boss.some(x=>x.k==="broken"),CH.warn*1000+1500);
    await waitFor(()=>A.boss.some(x=>x.k==="broken")||A.fxs.some(f=>f.k==="teleHit"&&f.name===CH.name),10000);
    const ch=A.fxs.find(f=>f.k==="teleHit"&&f.name===CH.name);
    ok(A.boss.some(x=>x.k==="broken")||(ch&&!ch.hit.includes(sid)),A.boss.some(x=>x.k==="broken")?"tích lực bị ngắt (boss Choáng)":`không ngắt kịp: A đứng vào vòng an toàn / ra khỏi sàn, không trúng ${CH.name}`);
    await test(A,"wmech",{m:"hold",secs:300}); await sleep(600);
    await near(wb().x,wb().y,30,inW); await sleep(300);
    A.fxs=[]; const dS=(await info()).dodges; await test(A,"wmech",{m:"hold",secs:0}); await test(A,"wmech",{m:"slam"});
    // Lúc bắt đầu báo trước: A đứng trong sàn, ngoài mọi vòng an toàn thì phải né (vòng rải ngẫu nhiên, có thể trùng chỗ A đang đứng).
    await waitFor(()=>A.fxs.some(f=>f.k==="tele"&&f.name===WORLD_SLAM.name),1500);
    const p0=me(), sf0=A.fxs.find(f=>f.k==="tele"&&f.name===WORLD_SLAM.name)?.safe??[], must=inW(p0.x,p0.y)&&!sf0.some(q=>teleSafe(q,p0.x,p0.y));
    ok(await waitFor(()=>A.fxs.some(f=>f.k==="teleHit"&&f.name===WORLD_SLAM.name),WORLD_SLAM.warn*1000+2000),`${WORLD_SLAM.name} (chiêu toàn sàn) tung`);
    const sl=A.fxs.find(f=>f.k==="teleHit"&&f.name===WORLD_SLAM.name), mp=me();
    ai=await info();
    ok(sl&&!sl.hit.includes(sid)&&(!must||ai.dodges>dS),`${must?"":"(lúc báo trước đã đứng ở chỗ an toàn) "}né ${WORLD_SLAM.name}: không trúng (${(sl?.safe??[]).some(q=>teleSafe(q,mp.x,mp.y))?"đứng trong vòng an toàn":inW(mp.x,mp.y)?"trong sàn":"ra khỏi sàn"}; `
      +`${ai.dodges-dS} lần chọn chỗ né, trúng ${JSON.stringify(sl?.hit)})`);
    await test(A,"wmech",{m:"hold",secs:300});
    // Vết thương sâu (trạng thái xấu còn lâu): đổi sang Xúc Xích (phụ trợ), tung hồn kỹ thanh tẩy, rồi về võ hồn chính.
    const armorBit=statusBit("armor"), onMain=await waitFor(()=>A.owned.active===main&&!(me().swCd>0),SWITCH_CD*2000+3000); await test(A,"ready");
    await test(A,"pst",{s:"armor",n:3,secs:30});
    // Đổi tay và thanh tẩy có thể xong trong cùng một nhịp server (bản vá không kịp mang trạng thái): xét kết quả, không xét lúc có trạng thái.
    const vh2=new Set(), cleaned=await waitFor(()=>{ vh2.add(VOHON[me().vh].id); return vh2.has("xuc_xich")&&!(me().st&armorBit); },8000);
    // Chẩn đoán (#328): trượt kèm đội không có Xúc Xích là dây chuyền của dòng "boss thế giới: đội có lại Xúc Xích" ở trên.
    if(!cleaned){ const g=await test(A,"ground"), i3=await info(); console.log(`  (thanh tẩy: st ${JSON.stringify(g?.st)}, cleanse ${i3.cleanse}, đội ${JSON.stringify(A.owned.team)} ${JSON.stringify(A.squad?.list?.map(x=>[x.rowId,x.hp,x.down]))}, ra trận ${A.owned.active}, Xúc Xích ${XUC}, `
      +`đã về võ hồn chính trước khi gây ${onMain}, hồi đổi ${me().swCd}, hồn lực ${me().mp}/${me().maxMp}, mục tiêu ${i3.target} (boss ${i3.boss}), lùi ${i3.away}, vai ${i3.role})`); }
    ok(cleaned,`${A.owned.team.includes(XUC)?"":"(đội không có Xúc Xích) "}${STATUS.armor.name} 30 giây: đổi sang Xúc Xích, thanh tẩy (${ringSkill("xuc_xich",cr)?.name}; võ hồn ra trận ${[...vh2].join(" → ")}, `
      +`còn ${Object.keys(STATUS).filter(s=>me().st&statusBit(s)).join(", ")||"không trạng thái"}; tự săn ${JSON.stringify(await info().then(x=>({role:x.role,target:x.target,away:x.away})))})`);
    const mainDown=()=>A.squad?.list?.find(x=>x.rowId===main)?.down>0;
    const back=await waitFor(()=>A.owned.active===main||mainDown(),SWITCH_CD*1000+3000); ai=await info();
    ok(back,mainDown()?"xong việc: võ hồn chính đã gục, ở lại võ hồn đang ra trận":`xong việc: về võ hồn chính (đang ${VOHON[me().vh].name}; `
      +`${JSON.stringify({home:ai.home,main,role:ai.role,target:ai.target,boss:ai.boss,swCd:me().swCd,squad:A.squad?.list?.map(x=>[x.rowId,x.hp,x.down])})})`);
    await autoOp("off"); await test(A,"slay",{bid:WB});

    // ---- Cực Bắc Chi Địa: Cực Hàn (#163) của Huyền Minh Băng Giao: đủ AUTO_BOSS.chill tầng Hàn, không có thanh tẩy thì tới Hỏa Đàn xả ----
    const CB="cuc_bac_chi_dia", CD=BOSSES[bossIndex(MAPS[CB].king)]?.phase2?.cold, han=()=>me()?.han??0;
    if(CD){
      ok(await toRow(main)&&await team([main,LAM,0,0]),"Cực Hàn: đội không có võ hồn phụ trợ (phải tới Hỏa Đàn)");
      ok(await warp(CB,0,0),`tới ${MAPS[CB].name}`);
      await test(A,"clear",{all:true,keep:1});
      await test(A,"king",{kop:"spawn"}); await waitFor(()=>[...A.room.state.beasts.values()].some(b=>b.rank===2),2000);
      let kc=await test(A,"king"); const CKB=kc.bid, CL=kc.lair, ck=()=>A.room.state.beasts.get(CKB), inC=(x,y)=>x>=CL.x&&x<CL.x+CL.w&&y>=CL.y&&y<CL.y+CL.h;
      await test(A,"bmax",{bid:CKB,x:100});
      const fire=(await test(A,"cold"))?.fire, hold=()=>test(A,"status",{s:"stun",secs:60,bid:CKB}), dF=()=>Math.hypot(me().x-fire.x,me().y-fire.y);
      await hold();
      ok(fire&&CKB&&await near(ck().x,ck().y,40,(x,y)=>inC(x,y)&&Math.hypot(x-fire.x,y-fire.y)>CD.fire.r+40),`A trong hang cạnh ${beastName(2,ck()?.species)}, cách Hỏa Đàn ${fire?dF().toFixed(0):"?"} pixel`);
      await test(A,"kdmg",{bid:CKB,v:1}); kc=await test(A,"king"); await test(A,"kdmg",{bid:CKB,v:Math.ceil(kc.hp-kc.maxHp*KING.phaseHp)+1});
      ok(await waitFor(()=>ck()?.phase===2,2000),"thú vương sang giai đoạn 2 (Cực Hàn)");
      await sleep(KING.roarSecs*1000+150); await hold(); // tiếng gầm bỏ khống chế: hết gầm thì Choáng lại (không đánh A)
      // Võ hồn ra trận là võ hồn chính (không phụ trợ): không có hồn kỹ thanh tẩy nào để giải tầng Hàn.
      ok(await toRow(main)&&VOHON[me().vh].he!=="phu_tro",`ra trận ${VOHON[me().vh].name}, đội không có võ hồn phụ trợ`);
      await cfg({years:[0,0],elite:false,world:false,tienCo:false}); m=await autoOp("on");
      ok(m?.on&&await until(async()=>(await info()).target===CKB,3000),"tự săn đánh thú vương giai đoạn 2");
      // Tích nhanh tầng Hàn (hook cold {acc}: như đã đứng gần đủ một nhịp).
      for(let k=0;k<AUTO_BOSS.chill;k++){ await test(A,"cold",{acc:CD.every-0.05}); await waitFor(()=>han()>k,1500); }
      const h0=han(); let warm=false, minF=Infinity, left=false; const tr=[];
      const cleared=await until(async()=>{ const i=await info(); if(i.warm) warm=true; minF=Math.min(minF,dF()); if(!inC(me().x,me().y)) left=true;
        tr.push(`${dF().toFixed(0)}${i.warm?" tới Hỏa Đàn":""} ${han()} tầng ${VOHON[me().vh].id}`); return han()===0; },8000);
      // Đọc vị trí theo bản vá, mỗi lần đọc cách nhau vài nhịp (đi được ~20 pixel): lề 16 pixel.
      ok(h0>=AUTO_BOSS.chill&&cleared&&warm&&!left&&minF<=CD.fire.r+16,`${h0} tầng Hàn, không có thanh tẩy: tới Hỏa Đàn (cách ${minF.toFixed(0)} pixel, bán kính ${CD.fire.r}), xả hết tầng${left?" (có lúc ra khỏi hang)":""} [${tr.join(" ")}]`);
      ok(await until(async()=>{ ai=await info(); return !ai.warm&&ai.target===CKB&&dF()>CD.fire.r; },6000)&&me().auto,"hết tầng Hàn: quay lại đánh thú vương");
      await autoOp("off"); await test(A,"slay",{bid:CKB});
    }
  }finally{ await A.room.leave(); }
}

/**
 * Đo hiệu năng (#218; BOT_ONLY=autobossperf, không chạy trong bot đầy đủ): AB_N bot (mặc định 12) cấp 100 tự săn cùng đánh boss thế giới ở
 * Lõi Tinh Đấu AB_SECS giây (mặc định 40), có Bạo Nộ / tích lực chen giữa để mọi người cùng né. Cần server PERF_LOG=1:
 *   npm run bot:local -- --only autobossperf --env PERF_LOG=1
 * In thời gian tick / bản vá trung bình, lớn nhất của phòng lúc đứng yên và lúc cùng đánh, số lần né, máu boss đã mất.
 */
export async function autoBossPerf(){
  const N=Math.max(2,Number(process.env.AB_N)||12), SECS=Math.max(10,Number(process.env.AB_SECS)||40), LT="loi_tinh_dau", VIEN="thai_than_cu_vien";
  console.log(`[#218] Đo hiệu năng: ${N} bot tự săn cùng đánh boss thế giới ${SECS} giây`);
  const B=[]; for(let i=0;i<N;i++) B.push(await bot(`Đánh Boss ${i}`,AWAKEN_CHOICES[i%AWAKEN_CHOICES.length].id,{sex:i%2,hair:i%4,hairCol:i%5,outfitCol:i%6}));
  const mo=b=>b.room.state.players?.get(b.room.sessionId), H=B[0];
  try{
    if(!(await test(H,"ping"))?.enabled){ console.log("  ⚠ bỏ qua: bật server bằng GAME_TEST=1"); return; }
    const arLT=JSON.parse(readFileSync(mapUrl(LT),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="arrive"&&o.name==="tu_tinh_dau_noi_dia");
    const R9=[400,700,1700,5000,12000,20000,50000,100000,100000];
    for(const b of B){
      await waitFor(()=>mo(b)&&b.owned,3000);
      for(const v of b.owned.list) await test(b,"set",{rowId:v.rowId,level:100,xp:0,rings:R9});
      b.travel=null; await test(b,"warp",{mapId:LT,x:arLT.x,y:arLT.y}); await waitFor(()=>b.travel,4000); const tv=b.travel;
      await b.room.leave(); await sleep(200); b.mapId=LT; await enter(b,tv?.roomId??undefined); await waitFor(()=>mo(b)&&b.owned&&b.bag,3000);
    }
    const rooms=new Set(B.map(b=>b.room.roomId));
    ok(rooms.size===1,`${N} bot cùng một kênh ${MAPS[LT].name}`);
    await test(H,"king",{kop:"spawn",mapId:LT,boss:VIEN,life:1800}); await waitFor(()=>[...H.room.state.beasts.values()].some(x=>x.rank===3),2000);
    // Máu boss x AB_HPX (mặc định 10) để cả lượt đo là trận đánh thật (12 hồn sư cấp 100 hạ boss máu gốc WORLD.hp trong khoảng 2,5 phút;
    // 10 x WORLD.hp 150 bằng máu của lượt đo cũ 50 x 30 trước #265).
    let ki=await test(H,"king"); await test(H,"bmax",{bid:ki.bid,x:Math.max(1,Number(process.env.AB_HPX)||10)}); ki=await test(H,"king");
    const L=ki.lair, cell=SYNC_VIEW.cell, used=new Map();
    // Rải mỗi bot một chỗ trong sàn đấu (mỗi ô lưới đồng bộ tối đa AUTO_MAX_PER_CELL điểm neo); sàn đầy thì ra quanh sàn (lề tăng dần).
    for(const b of B) for(let k=0;k<400;k++){
      const pad=k<200?-16:16*Math.ceil((k-199)/50), x=Math.round(L.x-pad+Math.random()*(L.w+2*pad)), y=Math.round(L.y-pad+Math.random()*(L.h+2*pad));
      const key=`${Math.floor(x/cell)},${Math.floor(y/cell)}`;
      if((used.get(key)??0)>=AUTO_MAX_PER_CELL) continue; await test(b,"goto",{x,y}); if(Math.hypot(mo(b).x-x,mo(b).y-y)<1){ used.set(key,(used.get(key)??0)+1); break; }
    }
    const perf=async(reset)=>test(H,"perf",{reset});
    const p0=await perf(true); if(!p0?.on) console.log("  ⚠ server chưa bật PERF_LOG=1: không đo được thời gian tick (npm run bot:local -- --only autobossperf --env PERF_LOG=1)");
    await sleep(10000); const idle=await perf(true);
    const ons=[]; for(const b of B){ b.autoMsg=null; b.room.send("auto",{op:"set",cfg:{...AUTO_DEFAULTS,elite:false,king:false}}); await waitFor(()=>b.autoMsg,1500);
      b.autoMsg=null; b.room.send("auto",{op:"on"}); await waitFor(()=>b.autoMsg,1500); ons.push(!!b.autoMsg?.on); }
    ok(ons.every(Boolean),`${ons.filter(Boolean).length}/${N} bot bật tự săn`);
    await perf(true); const hp0=ki.hp/ki.maxHp, t0=Date.now();
    await sleep(SECS*1000/4); await test(H,"wmech",{m:"slam"});
    await sleep(SECS*1000/4); await test(H,"wmech",{m:"charge"});
    await sleep(SECS*1000/2);
    const fight=await perf(true), k2=await test(H,"king"), infos=[]; for(const b of B) infos.push(await test(b,"auto"));
    const dodges=infos.reduce((s,x)=>s+(x?.dodges??0),0), onBoss=infos.filter(x=>x?.target===ki.bid).length, still=B.filter(b=>mo(b)?.auto).length;
    const f=(x)=>x?.n?`tick ${x.tick.toFixed(3)} ms (tự săn ${x.auto.toFixed(3)} ms), bản vá ${x.patch.toFixed(3)} ms, lớn nhất ${x.max.toFixed(2)} ms (${x.n} nhịp)`:"không đo";
    console.log(`  · đứng yên ${N} bot: ${f(idle)}`);
    const off=B.map((b,i)=>[b,infos[i]]).filter(([,x])=>x?.target!==ki.bid).map(([b,x])=>`${b.name.split(" ").slice(0,3).join(" ")}: ${mo(b)?.auto?`nhắm ${x?.target}`:"đã dừng"} (${mo(b)?.x?.toFixed(0)},${mo(b)?.y?.toFixed(0)})`);
    if(off.length) console.log(`  · không nhắm boss: ${off.join("; ")}`);
    console.log(`  · ${still} bot tự săn đánh boss ${((Date.now()-t0)/1000).toFixed(0)} giây: ${f(fight)}; ${onBoss} bot đang nhắm boss, ${dodges} lần né, máu boss ${(hp0*100).toFixed(0)}% → ${k2.bid?(k2.hp/k2.maxHp*100).toFixed(0)+"%":"đã bị hạ"}`);
    ok(still>=N-1&&(onBoss>=N-1||!k2.bid)&&dodges>0,`${N} bot cùng đánh một boss, cùng né chiêu toàn sàn`);
    if(fight?.n) ok(fight.tick<1000/TICK_RATE/2,`tick trung bình ${fight.tick.toFixed(3)} ms < nửa chu kỳ ${(1000/TICK_RATE/2).toFixed(0)} ms`);
    if(k2.bid) await test(H,"slay",{bid:k2.bid});
  }finally{ for(const b of B) await b.room.leave().catch(()=>{}); }
}
