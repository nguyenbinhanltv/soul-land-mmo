// Nhóm bot "egg" (#703 bước 3, tách nguyên văn từ bot-test.mjs).
import { sleep, waitFor, ok, bot, enter, test } from "./lib.mjs";
import { BEASTS, statusBit, MAPS, beastStats, BOSSES, bossIndex, beastIndex, KING, beastDef, defMult, ATK_SPREAD, xpBlocked } from "../../../shared/data.ts";

/**
 * #162: Vạn Chu Phệ (giai đoạn 2 của Tà hóa Thiên Độc Chu Hoàng, Tinh Đấu Nội địa) đẻ bọc trứng (EggDef). E đứng ngoài hang (thú vương
 * không đuổi được, chỉ tung chiêu bằng hook `tele`): đẻ đủ `n` bọc trong hang, máu `hp` lần máu nhện con cùng số năm, đồng bộ đồng hồ
 * nở; phá một bọc thì nó không nở và không có kinh nghiệm / Hồn Tệ / đồ rơi; hết giờ (hook `egg {t}` rút ngắn) mỗi bọc còn lại nở `per`
 * nhện con; còn nhện con thì chỉ đẻ thêm cho đủ tối đa `n` × `per`; thú vương bị hạ thì bọc tan, không nở.
 */
export async function eggTest(){
  console.log("[#162] Vạn Chu Phệ: bọc trứng phá được, không phá thì nở nhện con");
  const ND="tinh_dau_noi_dia", KB=MAPS[ND].king, VCP=BOSSES[bossIndex(KB)].phase2.skills.find(x=>x.eggs), EG=VCP?.eggs;
  ok(KB==="thien_doc_chu_hoang"&&EG?.n===3&&EG.per===2&&EG.secs===8&&BEASTS[beastIndex(EG.species)],`${VCP?.name}: ${EG?.n} bọc, ${EG?.secs} giây, mỗi bọc ${EG?.per} ${BEASTS[beastIndex(EG?.species)]?.name} (thiết kế gốc), máu bọc x${EG?.hp}`);
  if(!EG) return;
  const E=await bot("Bọc Trứng E","u_minh_linh_mieu",{sex:0,hair:2,hairCol:1,outfitCol:3});
  const mo=b=>b.room.state.players?.get(b.room.sessionId), kingB=()=>[...E.room.state.beasts.values()].find(b=>b.rank===2);
  await waitFor(()=>E.owned&&mo(E),3000);
  try{
    // #238: hồn hoàn thứ 5 8.000 năm (không 12.000) để một đòn đánh thường, kể cả chí mạng, không phá nổi bọc máu thấp nhất (kiểm ở dưới); 5 hồn hoàn để cấp 50 không ở bình cảnh.
    const RG=[423,764,1760,5000,8000]; await test(E,"set",{rowId:E.owned.active,level:50,xp:0,rings:RG});
    E.travel=null; await test(E,"warp",{mapId:ND,x:0,y:0}); await waitFor(()=>E.travel,3000); const tv=E.travel;
    await E.room.leave(); await sleep(300); E.mapId=tv.mapId; await enter(E,tv.roomId??undefined); await waitFor(()=>mo(E)&&E.owned&&E.bag,3000);
    ok(E.room.state.mapId===ND,"E tới Tinh Đấu Nội địa");
    await test(E,"view",{all:true}); // đọc bọc / nhện con trong hang dù đứng xa
    await test(E,"king",{kop:"spawn"}); ok(await waitFor(()=>kingB(),2000),"thú vương xuất hiện");
    let ki=await test(E,"king"); const LR=ki.lair, kb=ki.bid, inL=(x,y)=>x>=LR.x&&x<=LR.x+LR.w&&y>=LR.y&&y<=LR.y+LR.h;
    // Đứng ngoài hang, sát mép: thú vương không nhận làm mục tiêu nên chỉ tung chiêu khi hook `tele` bảo.
    let out=false; for(const [x,y] of [[LR.x+LR.w/2,LR.y-30],[LR.x+LR.w/2,LR.y+LR.h+30],[LR.x-30,LR.y+LR.h/2],[LR.x+LR.w+30,LR.y+LR.h/2],[LR.x+LR.w/2,LR.y-60]]){
      await test(E,"goto",{x:Math.round(x),y:Math.round(y)}); if(Math.hypot(mo(E).x-x,mo(E).y-y)<1&&!inL(mo(E).x,mo(E).y)){ out=true; break; } }
    ok(out,`E đứng ngoài hang (${mo(E).x.toFixed(0)},${mo(E).y.toFixed(0)})`);
    await test(E,"kdmg",{v:1}); ki=await test(E,"king"); await test(E,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*KING.phaseHp)+1});
    ok(await waitFor(()=>kingB()?.phase===2,2000),"giai đoạn 2 Vạn Chu Phệ"); await sleep(KING.roarSecs*1000+300);
    ki=await test(E,"king"); const vi=ki.skills.indexOf(VCP.name);
    const cast=async()=>{ E.fxs=[]; const r=await test(E,"tele",{i:vi,bid:kb,cancel:1});
      return r?.name===VCP.name&&await waitFor(()=>E.fxs.some(f=>f.k==="teleHit"&&f.bid===kb),2500); };
    const eggs=async(t)=>(await test(E,"egg",t===undefined?{}:{t}))?.eggs?.filter(x=>x.mother===kb)??[];
    ok(vi>=0&&await cast(),`thú vương tung ${VCP.name} (chiêu ${vi})`);
    let eg=await eggs(); const hpOf=y=>Math.max(1,Math.round(Math.round(beastStats(y).hp)*EG.hp));
    ok(eg.length===EG.n&&eg.every(e=>inL(e.x,e.y)&&e.years>=EG.years[0]&&e.years<=EG.years[1]&&e.hp===e.maxHp&&e.maxHp===hpOf(e.years)&&e.t>EG.secs-2&&e.t<=EG.secs),
      `đẻ ${eg.length} bọc trứng trong hang: ${eg.map(e=>`${e.years} năm, máu ${e.maxHp} (cần ${hpOf(e.years)}), nở sau ${e.t.toFixed(1)} giây`).join("; ")}`);
    ok(await waitFor(()=>eg.every(e=>{ const b=E.room.state.beasts.get(e.bid); return b&&b.egg>0&&b.egg<=EG.secs*10&&b.species===beastIndex(EG.species)&&!b.rank; }),1500),
      `client thấy ${eg.length} bọc trứng (BeastState.egg: ${eg.map(e=>E.room.state.beasts.get(e.bid)?.egg).join(", ")} phần mười giây)`);
    // Bọc đứng yên, không đánh: 1 giây sau vẫn đúng chỗ.
    await sleep(1000); const eg1=await eggs(); ok(eg1.length===EG.n&&eg1.every(e=>{ const o=eg.find(x=>x.bid===e.bid); return o&&o.x===e.x&&o.y===e.y; }),"bọc trứng đứng yên");
    // Đánh thường thật (không qua hook): thú vương Choáng ngắn để E đứng cạnh bọc thứ hai trong hang mà không bị đánh, rồi E ra lại.
    const ox=Math.round(mo(E).x), oy=Math.round(mo(E).y), b2=eg[1];
    // #238: đòn đánh thường lớn nhất (công x (1 + ATK_SPREAD) x combo Hạo Thiên x thủ của bọc ít năm nhất trừ xuyên thủ x chí mạng) phải nhỏ hơn máu bọc ít năm nhất, không thì bọc vỡ ngay.
    const lv=(await test(E,"stats"))?.live, hitMax=lv?Math.round(lv.atkNow*(1+ATK_SPREAD)*(1+(lv.fx?.combo??0))*defMult(beastDef(EG.species,EG.years[0]),lv.fx?.pierce??0)*Math.max(1,lv.critMult)):Infinity;
    ok(hitMax<hpOf(EG.years[0]),`đòn đánh thường tối đa ${hitMax} < máu bọc ${EG.years[0]} năm ${hpOf(EG.years[0])} (bọc đánh thử: ${b2.years} năm, máu ${b2.maxHp})`);
    await test(E,"status",{s:"stun",secs:3,bid:kb}); E.dmgs=[];
    // #238: đứng sát bọc (±8 / ±6 px): điểm đánh (cách chân 10 px theo hướng mặt) luôn trong tầm trúng 18 + nửa cỡ bọc dù quay hướng nào;
    // cũ ±14 px bên phải bọc khi quay phải (hướng mặc định, E chưa đi) sát mép tầm, goto làm tròn toạ độ thì đôi khi trượt.
    for(const [dx,dy] of [[8,0],[-8,0],[0,6],[0,-6]]){ await test(E,"goto",{x:Math.round(b2.x+dx),y:Math.round(b2.y+dy)}); if(Math.hypot(mo(E).x-b2.x-dx,mo(E).y-b2.y-dy)<1) break; }
    E.room.send("attack"); const hit=await waitFor(()=>E.dmgs.some(m=>m.bid===b2.bid),1500); const at=[mo(E).x-b2.x,mo(E).y-b2.y].map(v=>v.toFixed(1)).join(", "); await test(E,"goto",{x:ox,y:oy});
    ok(hit&&(await eggs()).find(e=>e.bid===b2.bid)?.hp<b2.maxHp,`đánh thường trúng bọc trứng: -${E.dmgs.find(m=>m.bid===b2.bid)?.v} máu, bọc vẫn đứng yên chờ nở [E lệch bọc (${at}), sinh lực ${mo(E).hp}]`);
    await waitFor(()=>!((kingB()?.st??0)&statusBit("stun")),4000);
    // Phá một bọc: không nở, không kinh nghiệm / Hồn Tệ / đồ rơi.
    ok(!xpBlocked(mo(E).level,RG.length),`E cấp ${mo(E).level}, ${RG.length} hồn hoàn: không ở bình cảnh (kinh nghiệm còn tăng được, dòng "không kinh nghiệm" có nghĩa)`);
    const br=eg[0], xp0=JSON.stringify([mo(E).level,mo(E).xp]), coin0=E.bag.honTe, l0=E.logs.length, d0=new Set(E.room.state.drops.keys()); E.fxs=[];
    const dealt=(await test(E,"bdmg",{bid:br.bid,v:1e8}))?.dealt;
    ok(dealt>0&&await waitFor(()=>E.fxs.some(f=>f.k==="egg"&&f.s==="break"),1500)&&(await eggs()).length===EG.n-1&&E.logs.slice(l0).some(t=>/Phá vỡ một bọc trứng/.test(t)),
      `phá một bọc: vỡ, còn ${EG.n-1} bọc; log "${E.logs.slice(l0).find(t=>/bọc trứng/.test(t))}"`);
    await sleep(300);
    ok(JSON.stringify([mo(E).level,mo(E).xp])===xp0&&E.bag.honTe===coin0&&![...E.room.state.drops.keys()].some(k=>!d0.has(k)),"phá bọc: không kinh nghiệm, không Hồn Tệ, không đồ rơi");
    // Hết giờ: mỗi bọc còn lại nở `per` nhện con cùng số năm; bọc đã phá không nở.
    const left=(await eggs()).map(e=>e.years); E.fxs=[]; await eggs(0.2);
    ok(await waitFor(()=>E.fxs.filter(f=>f.k==="egg"&&f.s==="hatch").length===EG.n-1,2000),`hết ${EG.secs} giây: ${EG.n-1} bọc nở`);
    let ei=await test(E,"egg"); const sp=ei.minions.map(id=>E.room.state.beasts.get(id));
    ok(!ei.eggs.length&&ei.minions.length===(EG.n-1)*EG.per&&sp.every(b=>b&&b.species===beastIndex(EG.species)&&!b.egg&&left.includes(b.years)),
      `nở ${ei.minions.length} ${BEASTS[beastIndex(EG.species)].name} (cần ${(EG.n-1)*EG.per}: bọc bị phá không nở), số năm ${sp.map(b=>b?.years).join(", ")}`);
    // Còn 4 nhện con: lần đẻ sau chỉ thêm cho đủ tối đa n × per nhện (1 bọc).
    ok(await cast(),`tung ${VCP.name} lần 2`); eg=await eggs();
    ok(eg.length===Math.floor((EG.n*EG.per-ei.minions.length)/EG.per),`còn ${ei.minions.length} nhện con: chỉ đẻ thêm ${eg.length} bọc (tối đa ${EG.n*EG.per} nhện)`);
    // Thú vương bị hạ: bọc tan, không nở.
    await test(E,"clear",{all:true,keep:1}); ok(await cast(),`dọn nhện con, tung ${VCP.name} lần 3`); eg=await eggs();
    ok(eg.length===EG.n,`đẻ lại đủ ${eg.length} bọc`);
    E.fxs=[]; E.boss=[]; await test(E,"kdmg",{v:1e8});
    ok(await waitFor(()=>!kingB()&&E.fxs.filter(f=>f.k==="egg"&&f.s==="fade").length===EG.n,2500)&&!E.fxs.some(f=>f.k==="egg"&&f.s==="hatch"),"hạ thú vương: bọc trứng tan, không nở");
    ei=await test(E,"egg"); ok(!ei.eggs.length&&eg.every(e=>!E.room.state.beasts.has(e.bid)),"không còn bọc nào");
  } finally { await E.room.leave().catch(()=>{}); }
}
