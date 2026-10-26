// Nhóm bot "tide" (#703 bước 3, tách nguyên văn từ bot-test.mjs).
import { solidGrid, hits, PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { clearLine } from "../../../shared/path.ts";
import { readFileSync } from "node:fs";
import { sleep, waitFor, ok, mapUrl, bot, enter, test } from "./lib.mjs";
import { STATUS, statusBit, MAPS, BOSSES, bossIndex, KING, RUN_MULT, PLAYER_STATUS, GROUND_KINDS, SLOW_CAP } from "../../../shared/data.ts";

/**
 * #174: Thủy Triều Dâng (giai đoạn 2 của Tà hóa Thâm Hải Ma Kình Vương, Hải Thần Đảo; TideDef, STATUS.flood). F đứng trong hang, thú
 * vương bị Choáng bằng hook để không đánh. Giai đoạn 1 không có nước. Giai đoạn 2: mỗi đợt `flood.n` vùng ngập (vùng lưu lại, #161) trong
 * hang, `whirl.n` vùng có xoáy đồng tâm; đợt mới (hook `tide {next:0}`) ở chỗ khác đợt trước, đang báo trước thì chưa gây gì, hết báo trước
 * thì nước đợt cũ rút. Đứng trong vùng ngập: Ngập nước, Làm chậm 50% (tốc độ thật `spd` giảm một nửa), cộng Làm chậm khác tối đa SLOW_CAP;
 * ra khỏi nước thì hết. Đứng trong xoáy: bị kéo về tâm (tới tâm thì đứng đó); vùng ngập không có xoáy thì không kéo. Hạ thú vương: nước mất.
 */
export async function tideTest(){
  console.log("[#174] Thủy Triều Dâng: vùng ngập luân phiên, Ngập nước, xoáy nước");
  const HT="hai_than_dao", KB=MAPS[HT].king, KD=BOSSES[bossIndex(KB)], TD=KD?.phase2?.tide, FL=STATUS.flood, fg=TD?.flood.ground, wg=TD?.whirl.ground;
  ok(KB==="tham_hai_ma_kinh_vuong"&&TD&&FL?.slow===0.5&&SLOW_CAP>=FL.slow&&PLAYER_STATUS.includes("flood")&&fg?.kind==="flood"&&fg.status.some(a=>a.s==="flood")
    &&wg?.kind==="whirl"&&wg.pull>0&&TD.whirl.n>=1&&TD.whirl.n<=TD.flood.n&&TD.whirl.r<TD.flood.r&&TD.warn>0&&fg.warn===undefined&&wg.warn===undefined&&fg.secs>=TD.every&&TD.gap>=1&&TD.shift>0
    &&GROUND_KINDS.some(k=>k.id==="flood")&&GROUND_KINDS.some(k=>k.id==="whirl")&&KD.phase2.skills.length>=1&&KD.phase2.skills.every(s=>s.warn>=1&&!s.status?.some(a=>a.s==="slow")),
    `${KD?.name} – ${KD?.phase2?.name}: mỗi ${TD?.every} giây ${TD?.flood.n} vùng ngập bán kính ${TD?.flood.r} (${FL?.name} ${FL?.slow*100}%, Làm chậm tối đa ${SLOW_CAP*100}%), ${TD?.whirl.n} xoáy bán kính ${TD?.whirl.r} kéo ${wg?.pull} pixel/giây, báo trước ${TD?.warn} giây`);
  if(!TD) return;
  const F=await bot("Thủy Triều F","xuc_xich",{sex:0,hair:2,hairCol:1,outfitCol:3});
  if(!(await test(F,"ping"))?.enabled){ console.log("  ⚠ bỏ qua Thủy Triều Dâng (cần hook warp, king, tide): bật server bằng GAME_TEST=1"); await F.room.leave(); return; }
  const mo=()=>F.room.state.players?.get(F.room.sessionId), kingB=()=>[...F.room.state.beasts.values()].find(b=>b.rank===2);
  const has=s=>((mo()?.st??0)&statusBit(s))!==0, d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), kindOf=q=>GROUND_KINDS[q.kind]?.id;
  await waitFor(()=>F.owned&&mo(),3000);
  try{
    const xr=F.owned.list.find(v=>v.vohon==="xuc_xich")?.rowId; await test(F,"set",{rowId:xr,level:50,xp:0,rings:[423,764,1760,5000,12000]});
    F.travel=null; await test(F,"warp",{mapId:HT,x:0,y:0}); await waitFor(()=>F.travel,3000); const tv=F.travel;
    await F.room.leave(); await sleep(300); F.mapId=tv.mapId; await enter(F,tv.roomId??undefined); await waitFor(()=>mo()&&F.owned,3000);
    ok(F.room.state.mapId===HT,"F tới Hải Thần Đảo");
    await test(F,"view",{all:true}); await test(F,"clear",{all:true,keep:1});
    await test(F,"king",{kop:"spawn"}); ok(await waitFor(()=>kingB(),2000),"thú vương xuất hiện");
    let ki=await test(F,"king"); const LR=ki.lair, kb=ki.bid, inL=(x,y)=>x>=LR.x&&x<LR.x+LR.w&&y>=LR.y&&y<LR.y+LR.h;
    const hold=()=>test(F,"status",{s:"stun",secs:60,bid:kb}); // thú vương đứng Choáng, không đánh F
    const go=async(x,y)=>{ x=Math.round(x); y=Math.round(y); await test(F,"goto",{x,y}); return d2(mo(),{x,y})<1; };
    await hold();
    let inside=false; for(const [fx,fy] of [[0.3,0.5],[0.7,0.5],[0.5,0.3],[0.5,0.7]]) if(await go(LR.x+LR.w*fx,LR.y+LR.h*fy)){ inside=true; break; }
    ok(inside&&inL(mo().x,mo().y),`F đứng trong hang (${mo().x.toFixed(0)},${mo().y.toFixed(0)})`);
    // Tốc độ gốc lúc chắc chắn chưa có nước, chưa Làm chậm (quy về không chạy): bài Làm chậm 50% dưới đây so với số này khi lúc đo F đã ngập.
    const base0=!has("flood")&&!has("slow")?mo().spd/(mo().calm&&!mo().walk?RUN_MULT:1):0;
    await test(F,"kdmg",{v:1}); await sleep(300); let t=await test(F,"tide");
    ok(!t.on&&!t.wave.length&&!t.grounds.some(z=>z.src===kb),"giai đoạn 1: chưa có nước");
    ki=await test(F,"king"); await test(F,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*KING.phaseHp)+1});
    ok(await waitFor(()=>kingB()?.phase===2,2000),`giai đoạn 2 ${KD.phase2.name}`);
    // Hết gầm chạy theo nhịp server (dt kẹp), máy bận thì chậm hơn đồng hồ thật (#364): chờ theo state (roar về 0, rồi đợt đầu dâng), không sleep cố định.
    // Hạn chót tính theo thời gian thật nhưng rộng (gấp 5 lần), chỉ để không treo bot; trượt thì dòng ✗ in roar / on / số vùng.
    const pollOp=async(op,pred,ms)=>{ let r; for(let t0=Date.now();Date.now()-t0<ms;){ r=await test(F,op); if(pred(r)) return r; await sleep(100); } return r; };
    const roar=await pollOp("king",r=>!(r?.roar>0),(KING.roarSecs*5+5)*1000);
    await hold(); // tiếng gầm bỏ khống chế: hết gầm thì Choáng lại
    t=await pollOp("tide",r=>r?.on&&r.wave?.length>0,(TD.every+5)*1000);
    await test(F,"tide",{next:600}); // giữ đợt hiện tại, bot tự gọi đợt mới
    t=await test(F,"tide");
    const ours=t.grounds.filter(z=>t.wave.includes(z.id)), fl0=ours.filter(z=>z.kind==="flood"), wh0=ours.filter(z=>z.kind==="whirl");
    ok(t.on&&fl0.length===TD.flood.n&&wh0.length===TD.whirl.n&&ours.every(z=>z.src===kb&&z.shape==="circle"&&inL(z.x,z.y))
      &&fl0.every(z=>z.r===TD.flood.r)&&wh0.every(z=>z.r===TD.whirl.r&&fl0.some(f=>d2(f,z)<1)),
      `hết gầm: nước dâng ngay, ${fl0.length} vùng ngập + ${wh0.length} xoáy (đồng tâm vùng ngập) trong hang`+(t.on&&fl0.length===TD.flood.n?"":` [roar ${roar?.roar}, on ${t.on}, đợt ${t.wave.length} id, tới đợt kế ${t.next?.toFixed?.(1)}, thú vương giai đoạn ${kingB()?.phase}, vùng ${t.grounds.length}]`));
    // Đợt mới: chỗ khác đợt trước; đang báo trước thì chưa có tác dụng; nước đợt cũ (đã có tác dụng) chỉ còn tới lúc đợt mới hết báo trước.
    let old=[...t.wave]; const prev=t.spots;
    ok(await waitFor(()=>old.every(id=>F.room.state.grounds.get(id)?.wait===0),(TD.warn+1)*1000),"đợt đầu hết báo trước, có tác dụng");
    const oldTtl=Math.min(...(await test(F,"tide")).grounds.filter(z=>old.includes(z.id)).map(z=>z.ttl));
    t=await test(F,"tide",{next:0}); await test(F,"tide",{next:600});
    const waveOf=k=>t.grounds.filter(z=>t.wave.includes(z.id)&&z.kind===k);
    let fl=waveOf("flood"), wh=waveOf("whirl");
    ok(fl.length===TD.flood.n&&wh.length===TD.whirl.n&&fl.every(z=>prev.every(p=>d2(p,z)>=TD.shift*TD.flood.r)),
      `đợt mới ở chỗ khác: tâm cách mọi tâm đợt trước ≥ ${TD.shift*TD.flood.r} (gần nhất ${Math.min(...fl.flatMap(z=>prev.map(p=>d2(p,z)))).toFixed(0)})`);
    const cut=t.grounds.filter(z=>old.includes(z.id));
    ok(oldTtl>TD.warn+1&&cut.length===old.length&&cut.every(z=>z.ttl<=TD.warn+0.05),`nước đợt cũ (còn ${oldTtl.toFixed(1)} giây) rút khi đợt mới hết báo trước (còn ${Math.max(...cut.map(z=>z.ttl)).toFixed(2)} giây)`);
    // Nước đợt cũ còn tác dụng tới lúc đợt mới hết báo trước: đứng trong vùng ngập không xoáy của đợt mới, xa hẳn mọi vùng ngập cũ còn lại
    // và mọi xoáy mới. Chỉ thử chỗ đứng được theo đúng luật hook goto (map.standable: hộp hồn sư không chạm ô chặn). Vị trí đợt ngẫu nhiên
    // (#313): đợt không còn chỗ như vậy (vùng không xoáy kẹp giữa các tâm cũ, sát vách hang) thì chờ đợt đó có tác dụng rồi gọi đợt kế
    // (luật: đợt kế ở chỗ khác đợt trước), tối đa `WAVES` đợt, mỗi đợt thử tối đa 12 chỗ.
    const grid=solidGrid(JSON.parse(readFileSync(mapUrl(HT),"utf8"))), WAVES=5, xy=q=>`${q.x.toFixed(0)},${q.y.toFixed(0)}`;
    let calm, olds=[], cand=[], st0=null, tried=0, waves=1;
    const far=p=>Math.min(...olds.map(q=>d2(p,q)));
    for(;;){
      calm=fl.find(z=>!wh.some(w=>d2(w,z)<1)); // vùng ngập không có xoáy
      olds=t.grounds.filter(z=>z.src===kb&&z.kind==="flood"&&!t.wave.includes(z.id)); cand=[]; tried=0;
      if(calm) for(let dx=-32;dx<=32;dx+=4) for(let dy=-32;dy<=32;dy+=4){ const p={x:Math.round(calm.x+dx),y:Math.round(calm.y+dy)}; // goto làm tròn
        if(d2(p,calm)<=TD.flood.r-8&&far(p)>TD.flood.r+8&&wh.every(w=>d2(p,w)>TD.whirl.r+6)&&!hits(grid,p.x,p.y,PLAYER_HW,PLAYER_HH)) cand.push(p); }
      cand.sort((a,b)=>far(b)-far(a)); for(const p of cand.slice(0,12)){ tried++; if(await go(p.x,p.y)){ st0=p; break; } }
      if(st0||waves>=WAVES) break;
      console.log(`  (đợt mới thứ ${waves} không có chỗ đứng: vùng ngập không xoáy ${calm?xy(calm):"không có"}, xoáy ${wh.map(xy).join(" ")}, vùng ngập cũ ${olds.map(xy).join(" ")}; gọi đợt kế)`);
      old=[...t.wave];
      // Đợt gọi thêm chỉ chờ, không thêm dòng ✓ (số ✓ của nhóm không đổi theo lượt); Choáng lại thú vương vì gọi thêm đợt tốn thời gian.
      if(!(await waitFor(()=>old.every(id=>F.room.state.grounds.get(id)?.wait===0),(TD.warn+1)*1000))){ ok(false,`đợt mới thứ ${waves} hết báo trước, có tác dụng`); break; }
      await hold(); t=await test(F,"tide",{next:0}); await test(F,"tide",{next:600});
      if(!t.on||t.wave.every(id=>old.includes(id))){ console.log(`  (không gọi được đợt kế: Thủy Triều Dâng ${t.on?"không ra đợt mới":"đã thôi chạy"})`); break; }
      waves++; fl=waveOf("flood"); wh=waveOf("whirl");
    }
    ok(calm&&st0,`F đứng trong vùng ngập không xoáy của đợt mới, cách vùng ngập cũ ${st0?far(st0).toFixed(0):"?"} (${st0?.x},${st0?.y})`+(waves>1?`, ở đợt mới thứ ${waves}`:"")+(st0?"":
      ` [đợt cuối: ${cand.length} chỗ thỏa đứng được, thử ${tried} chỗ không tới được; vùng ngập không xoáy ${calm?xy(calm):"không có"}, xoáy ${wh.map(xy).join(" ")}, vùng ngập cũ ${olds.map(xy).join(" ")}]`));
    if(!calm) return; // không có vùng ngập không xoáy: các bước sau cần nó (finally hạ thú vương)
    await waitFor(()=>!has("flood"),FL.secs*1000+500); // Ngập nước còn lại từ lúc đứng trong nước đợt cũ
    let g=await test(F,"tide"), zc=g.grounds.find(z=>z.id===calm?.id);
    if(zc?.wait>0) ok(!g.st.flood&&g.slow===0,`đang báo trước (còn ${zc.wait.toFixed(2)} giây): chưa bị ${FL.name}`);
    else console.log("  ⚠ không kịp thử lúc báo trước (máy chậm)");
    // Hết báo trước: Ngập nước, Làm chậm 50%; tốc độ thật giảm một nửa.
    // Máy chậm (#303): chờ hết Ngập nước của đợt cũ thì vùng mới đã hết báo trước, F ngập lại ngay, mo().spd lúc này đã giảm (76 → 76).
    // Chỉ lấy tốc độ đang có làm mốc khi chưa ngập / Làm chậm; không thì dùng tốc độ gốc đo trong hang (base0).
    const dry0=!has("flood")&&!has("slow"), calmOut=mo().calm, spdOut=dry0?mo().spd:base0*(calmOut&&!mo().walk?RUN_MULT:1);
    ok(await waitFor(()=>has("flood")&&F.room.state.grounds.get(calm.id)?.wait===0,(TD.warn+1)*1000),`hết báo trước: bị ${FL.name}`);
    g=await test(F,"tide"); await sleep(150);
    const want=0.5*(mo().calm?RUN_MULT:1)/(calmOut?RUN_MULT:1);
    ok(g.st.flood&&Math.abs(g.slow-FL.slow)<1e-6&&spdOut>0&&Math.abs(mo().spd/spdOut-want)<0.02,
      `Làm chậm ${(g.slow*100).toFixed(0)}%: tốc độ ${spdOut.toFixed(1)}${dry0?"":" (gốc đo trong hang)"} → ${mo().spd.toFixed(1)} pixel/giây`);
    ok(!g.grounds.some(z=>old.includes(z.id))&&await waitFor(()=>![...F.room.state.grounds.values()].some(q=>q.wait>0)&&[...F.room.state.grounds.values()].some(q=>kindOf(q)==="flood")
      &&[...F.room.state.grounds.values()].some(q=>kindOf(q)==="whirl"),1500),"đợt cũ đã rút; state.grounds có vùng ngập và xoáy đã có tác dụng (client vẽ được)");
    await test(F,"ground",{ttl:30}); // giữ nước cho các bước sau, không phụ thuộc máy nhanh / chậm
    // Không xoáy thì không bị kéo.
    const pc=await go(calm.x+TD.flood.r-12,calm.y)||await go(calm.x-TD.flood.r+12,calm.y)||await go(calm.x,calm.y+TD.flood.r-12)||await go(calm.x,calm.y-TD.flood.r+12);
    const c0={x:mo().x,y:mo().y}; await sleep(700);
    ok(pc&&d2(mo(),c0)<0.5&&has("flood"),`vùng ngập không xoáy: đứng yên (lệch ${d2(mo(),c0).toFixed(1)} pixel), vẫn ${FL.name}`);
    // Ra khỏi nước: hết Ngập nước.
    const dry=[]; for(let i=1;i<10;i++) for(let j=1;j<10;j++) dry.push({x:LR.x+LR.w*i/10,y:LR.y+LR.h*j/10});
    let out=false; for(const p of dry){ if(g.grounds.some(z=>z.src===kb&&d2(z,p)<z.r+10)) continue; if(await go(p.x,p.y)){ out=true; break; } }
    ok(out&&await waitFor(()=>!has("flood"),(FL.secs+1)*1000)&&(await test(F,"tide")).slow===0,`ra khỏi nước (${mo().x.toFixed(0)},${mo().y.toFixed(0)}): hết ${FL.name}, không còn Làm chậm`);
    // Cộng với Làm chậm khác, tối đa SLOW_CAP.
    await go(calm.x,calm.y); await waitFor(()=>has("flood"),1500); await test(F,"pst",{s:"slow"});
    g=await test(F,"tide");
    ok(g.st.flood&&g.st.slow&&Math.abs(g.slow-Math.min(SLOW_CAP,FL.slow+STATUS.slow.slow))<1e-6,`${FL.name} + ${STATUS.slow.name}: chậm ${(g.slow*100).toFixed(0)}% (cộng lại, tối đa ${SLOW_CAP*100}%)`);
    // Xoáy: đứng gần mép xoáy thì bị kéo về tâm, tới tâm thì đứng đó.
    // Chỗ đứng gần mép xoáy mà đường thẳng tới tâm không vướng (vướng thì luật dừng kéo); bản vá đầu sau goto (seq tăng) có thể đã bị kéo
    // một chút nên không đòi đúng chỗ.
    const w=wh[0]; let wp=null;
    for(const z of wh) for(let k=0;k<8&&!wp;k++){
      const a=k*Math.PI/4, p={x:Math.round(z.x+Math.cos(a)*(TD.whirl.r-4)),y:Math.round(z.y+Math.sin(a)*(TD.whirl.r-4))};
      if(!clearLine(grid,p,z)) continue;
      const s0=mo().seq; await test(F,"goto",p); if(await waitFor(()=>mo().seq!==s0,1000)&&d2(mo(),z)<=TD.whirl.r) wp={z,p};
    }
    const wz=wp?.z??w, r0=d2(mo(),wz); await sleep(400); const r1=d2(mo(),wz);
    ok(wp&&r0>TD.whirl.r/2&&r1<r0-wg.pull*0.2,`đứng trong xoáy cách tâm ${r0.toFixed(1)}: 0,4 giây sau còn ${r1.toFixed(1)} (kéo ${wg.pull} pixel/giây)`);
    ok(await waitFor(()=>d2(mo(),wz)<1.5,(TD.whirl.r/wg.pull+1.5)*1000),`bị kéo tới tâm xoáy (cách ${d2(mo(),wz).toFixed(1)})`);
    // Hạ thú vương: nước mất, luật thôi chạy.
    await test(F,"kdmg",{v:1e8});
    ok(await waitFor(()=>!kingB()&&F.room.state.grounds.size===0,2500),"hạ thú vương: nước mất khỏi state");
    t=await test(F,"tide"); ok(!t.on&&!t.grounds.some(z=>z.src===kb),"không còn Thủy Triều Dâng");
  } finally {
    if(kingB()) await test(F,"kdmg",{v:1e8}).catch(()=>{}); // bài lỗi giữa chừng: không để thú vương sống sang bài khác
    await F.room.leave().catch(()=>{});
  }
}
