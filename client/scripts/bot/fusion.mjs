// Nhóm bot "fusion" (#703 bước 3, tách nguyên văn từ bot-test.mjs).
import { readFileSync } from "node:fs";
import { sleep, waitFor, ok, mapUrl, bot, enter, sendTeam, test } from "./lib.mjs";
import { vohonIndex, TEAM_COMBAT_SECS, PARTY_BUFF_R, FUSION, FUSIONS, fusionIndex } from "../../../shared/data.ts";

/**
 * Võ Hồn Dung Hợp Kỹ (#192; BOT_ONLY=fusion). A cầm Yêu Hồ, B và O cầm Nguyệt Nhận (cặp Yêu Nguyệt); A và B cùng
 * tổ đội, O đứng gần nhưng ngoài đội. Từ chối kèm lý do: vùng an toàn, chưa có tổ đội, thiếu hồn hoàn, đứng xa, đồng đội trong vùng an
 * toàn, sai cặp, đang hồi chiêu, hưởng ứng khi chưa được mời; hết FUSION.window thì hủy không tốn gì. Tung được: B nhận lời nhắc, O
 * không; chiêu nổ ở điểm giữa, mỗi người tốn FUSION.cost hồn lực và vào hồi chiêu; không tạo năng lượng tiên cơ; đóng góp tinh anh chia đôi;
 * tin riêng vohons mang giây hồi chiêu còn lại `fcd` cho ô G của client, cả sau khi vào lại (#193).
 */
export async function fusionTest(){
  console.log("\n== Võ Hồn Dung Hợp Kỹ (#192) ==");
  const fi=fusionIndex("yeu_ho","nguyet_nhan"), YN=FUSIONS[fi], sumDmg=f=>f.parts.reduce((a,x)=>a+x.dmg*(x.n??1),0);
  // Số cân bằng chỉ ở shared/data.ts: bài chỉ kiểm quan hệ / cấu trúc, in số ra để đọc.
  ok(FUSION.r===PARTY_BUFF_R&&FUSION.window>0&&FUSION.cd>FUSION.window&&FUSION.cost>0&&FUSION.minRings>1,`FUSION: r ${FUSION.r} (= PARTY_BUFF_R), chờ ${FUSION.window} giây, hồi ${FUSION.cd} giây, ${FUSION.cost} hồn lực, ${FUSION.minRings} hồn hoàn`);
  const MVP=[["yeu_ho","nguyet_nhan"],["hao_thien_chuy","nhu_cot_tho"],["lam_dien_ba_vuong_long","bich_lan_xa_hoang"],["bang_phuong_hoang","hoa_long"],["bach_ho","u_minh_linh_mieu"]];
  ok(fi>=0&&fusionIndex("nguyet_nhan","yeu_ho")===fi&&MVP.every(([a,b])=>fusionIndex(a,b)>=0)&&FUSIONS.every(f=>f.parts.every(x=>x.area==="around")&&sumDmg(f)>0),
    `${MVP.length} cặp có trong FUSIONS, vùng quanh điểm giữa, tổng dmg ${FUSIONS.map(f=>`${f.name} ${sumDmg(f).toFixed(1)}`).join(", ")}`);
  const A=await bot("Dung Hợp A","yeu_ho",{sex:1,hair:2,hairCol:1,outfitCol:2});
  const B=await bot("Dung Hợp B","nguyet_nhan",{sex:0,hair:1,hairCol:3,outfitCol:4});
  const O=await bot("Dung Hợp O","nguyet_nhan",{sex:0,hair:3,hairCol:2,outfitCol:1});
  const U=await bot("Dung Hợp U","u_minh_linh_mieu",{sex:1,hair:1,hairCol:5,outfitCol:3}); // #194: cặp U Minh Bạch Hổ với O cầm Bạch Hổ
  try{
  if(!(await test(A,"ping"))?.enabled){ console.log("  ⚠ bỏ qua dung hợp kỹ (cần hook set, goto, party): bật server bằng GAME_TEST=1"); return; }
  const meP=b=>b.room.state.players.get(b.room.sessionId), rowOf=(b,v)=>b.owned.list.find(x=>x.vohon===v)?.rowId;
  await waitFor(()=>[A,B,O].every(b=>b.owned&&meP(b)),3000);
  const Y=[423,764,1760,5000,12000,30000].slice(0,FUSION.minRings);
  const sf=JSON.parse(readFileSync(mapUrl(A.room.state.mapId),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="safe");
  const inSf=b=>{ const q=meP(b); return !!sf&&q.x>=sf.x&&q.x<=sf.x+sf.width&&q.y>=sf.y&&q.y<=sf.y+sf.height; };
  /** `b` gửi `fusion {op}`, trả dòng log mới (lý do / lời nhắc). */
  const fus=async(b,op)=>{ const l=b.logs.length; b.room.send("fusion",{op}); await waitFor(()=>b.logs.length>l,1500); return b.logs.slice(l).join(" | "); };
  for(const [b,v] of [[A,"yeu_ho"],[B,"nguyet_nhan"],[O,"nguyet_nhan"]]){
    await test(b,"set",{rowId:rowOf(b,v),level:35,xp:0,rings:Y});
    const want=[rowOf(b,v),rowOf(b,"lam_ngan_thao"),0,0]; // ô 2 Lam Ngân Thảo để thử sai cặp và đổi võ hồn
    if(JSON.stringify(b.owned.team)!==JSON.stringify(want)||b.owned.active!==want[0]) await sendTeam(b,want);
  }
  ok([A,B,O].every(b=>meP(b).rings.length===Y.length)&&meP(A).vh===vohonIndex("yeu_ho")&&meP(B).vh===vohonIndex("nguyet_nhan"),`A Yêu Hồ, B / O Nguyệt Nhận ra trận, ${Y.length} hồn hoàn`);
  // Trong làng (vùng an toàn): từ chối.
  // Chỗ A đứng lúc vào (trong làng, đứng được): B quay lại đây cho bài "đồng đội trong vùng an toàn"; tâm vùng an toàn của bản ×8
  // có thể là nhà / lửa trại, hook goto bỏ qua ô không đứng được.
  const home=inSf(A)?{x:meP(A).x,y:meP(A).y}:{x:Math.round(sf.x+sf.width/2),y:Math.round(sf.y+sf.height/2)};
  let w=inSf(A)?await fus(A,"start"):"(A không ở trong làng)";
  ok(/vùng an toàn/.test(w),`A trong làng: "${w}"`);
  // Ra ngoài làng: điểm đứng được cho A, B (100 pixel) và O (60 pixel), cả ba ngoài làng; B đứng được cả ở ngoài FUSION.r (bài "đứng xa").
  let ax=0, ay=0, okSpot=false;
  for(let k=0;k<12&&!okSpot;k++){
    ax=Math.round(sf.x+sf.width+60+k*40); ay=Math.round(sf.y+sf.height/2+(k%3-1)*60);
    await test(A,"goto",{x:ax,y:ay}); await test(B,"goto",{x:ax+100,y:ay}); await test(O,"goto",{x:ax+30,y:ay+50});
    okSpot=await waitFor(()=>Math.hypot(meP(A).x-ax,meP(A).y-ay)<0.5&&Math.hypot(meP(B).x-ax-100,meP(B).y-ay)<0.5&&Math.hypot(meP(O).x-ax-30,meP(O).y-ay-50)<0.5,600)
      &&!inSf(A)&&!inSf(B)&&!inSf(O);
    if(okSpot){ const fx=ax+FUSION.r+80; await test(B,"goto",{x:fx,y:ay}); okSpot=await waitFor(()=>Math.hypot(meP(B).x-fx,meP(B).y-ay)<0.5,600);
      await test(B,"goto",{x:ax+100,y:ay}); okSpot=okSpot&&await waitFor(()=>Math.hypot(meP(B).x-ax-100,meP(B).y-ay)<0.5,600); }
  }
  ok(okSpot,`A (${ax},${ay}), B cách 100 pixel, O cách ${Math.round(Math.hypot(30,50))} pixel, ngoài làng`);
  if(!okSpot) return;
  const clean=async()=>{ for(const b of [A,B,O]) await test(b,"clear"); };
  await clean(); for(const b of [A,B,O]) await test(b,"ready");
  w=await fus(A,"start"); ok(/tổ đội/.test(w)&&!O.fus.length&&!B.fus.length,`chưa có tổ đội (O cầm Nguyệt Nhận đứng gần): "${w}"`);
  // Tổ đội A + B; O ngoài đội.
  await test(A,"party",{pop:"rlreset"});
  const n=B.partyMsgs??0; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>(B.partyMsgs??0)>n,2000);
  B.room.send("party",{op:"accept",name:A.name}); await waitFor(()=>A.party?.members?.length===2&&B.party?.id===A.party.id,2000);
  ok(A.party?.members?.length===2&&B.party?.id===A.party.id&&!O.party?.id,"A và B cùng tổ đội, O ngoài đội");
  // Thiếu hồn hoàn (B thiếu một vòng).
  await test(B,"set",{rowId:rowOf(B,"nguyet_nhan"),level:35,xp:0,rings:Y.slice(0,-1)});
  w=await fus(A,"start"); ok(w.includes(`${Y.length-1} hồn hoàn`)&&w.includes(B.name)&&!B.fus.length,`B thiếu hồn hoàn: "${w}"`);
  await test(B,"set",{rowId:rowOf(B,"nguyet_nhan"),level:35,xp:0,rings:Y}); await test(B,"ready");
  // Đứng xa.
  await test(B,"goto",{x:ax+FUSION.r+80,y:ay}); await sleep(150);
  w=await fus(A,"start"); ok(/đứng xa/.test(w)&&!B.fus.length&&!O.fus.length,`B đứng ${Math.round(meP(B).x-meP(A).x)} pixel: "${w}" (O ngoài đội đứng gần không được mời)`);
  // Đồng đội trong vùng an toàn.
  await test(B,"goto",home); await sleep(150);
  w=inSf(B)?await fus(A,"start"):"(B không vào được làng)"; ok(/vùng an toàn/.test(w)&&w.includes(B.name),`B trong làng: "${w}"`);
  await test(B,"goto",{x:ax+100,y:ay}); await sleep(150);
  // Sai cặp: B đổi sang Lam Ngân Thảo.
  await waitFor(()=>meP(B).swCd===0,3500); B.room.send("switch",{slot:1}); await waitFor(()=>meP(B).vh===vohonIndex("lam_ngan_thao"),2000);
  w=await fus(A,"start"); ok(/không đồng đội nào ra trận Nguyệt Nhận/.test(w),`B ra trận Lam Ngân Thảo (sai cặp): "${w}"`);
  await waitFor(()=>meP(B).swCd===0,3500); B.room.send("switch",{slot:0}); await waitFor(()=>meP(B).vh===vohonIndex("nguyet_nhan"),2000);
  // Hưởng ứng khi chưa được mời.
  w=await fus(B,"join"); ok(/chưa có lời mời/.test(w),`B hưởng ứng khi chưa được mời: "${w}"`);
  // Mời rồi hết giờ: hủy, không tốn gì (hook rest trôi FUSION.window giây cho A).
  await test(A,"ready"); await test(B,"ready");
  w=await fus(A,"start");
  ok(await waitFor(()=>B.fus.some(m=>m.k==="ask"&&m.i===fi),1500)&&A.fus.some(m=>m.k==="wait")&&!O.fus.length&&B.logs.some(t=>t.includes(`mời Võ Hồn Dung Hợp Kỹ ${YN.name}`)),
    `A mời: B nhận lời nhắc ${YN.name} (${FUSION.window} giây), O không: "${w}"`);
  w=await fus(A,"start"); ok(/đang chờ/.test(w),`mời lần nữa khi đang chờ: "${w}"`);
  const mpA=meP(A).mp, mpB=meP(B).mp; B.fus.length=0; const lb=B.logs.length;
  await test(A,"rest",{s:Math.ceil(FUSION.window)+1}); // hook nhận số giây nguyên
  ok(await waitFor(()=>B.fus.some(m=>m.k==="cancel")&&B.logs.slice(lb).some(t=>/hết .* giây chờ/.test(t)),1500)&&meP(A).mp>=mpA&&meP(B).mp>=mpB,
    `hết ${FUSION.window} giây: hủy, không tốn hồn lực (A ${mpA} -> ${meP(A).mp}, B ${mpB} -> ${meP(B).mp})`);
  w=await fus(B,"join"); ok(/chưa có lời mời/.test(w),`sau khi hủy, B hưởng ứng: "${w}"`);
  // Mời rồi B chạy xa trước khi hưởng ứng: hủy, không tốn gì.
  await fus(A,"start"); await test(B,"goto",{x:ax+FUSION.r+80,y:ay}); await sleep(150);
  w=await fus(B,"join"); ok(/đã hủy: .*đứng xa/.test(w)&&meP(B).mp>=mpB,`B ra xa rồi mới hưởng ứng: "${w}"`);
  await test(B,"goto",{x:ax+100,y:ay}); await sleep(150);
  // Mời rồi B rời tổ đội trước khi hưởng ứng: hủy, không tốn gì; vào lại tổ đội.
  await fus(A,"start"); B.room.send("party",{op:"leave"}); await waitFor(()=>!B.party?.id,2000);
  w=await fus(B,"join"); ok(/đã hủy: .*không còn cùng tổ đội/.test(w)&&meP(B).mp>=mpB,`B rời tổ đội rồi mới hưởng ứng: "${w}"`);
  { await test(A,"party",{pop:"rlreset"}); const k=B.partyMsgs??0; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>(B.partyMsgs??0)>k,2000);
    B.room.send("party",{op:"accept",name:A.name}); ok(await waitFor(()=>A.party?.members?.length===2&&B.party?.id===A.party.id,2000),"A và B vào lại tổ đội"); }
  // Tung thật lên tinh anh đặt ở điểm giữa: nổ ở điểm giữa, tốn hồn lực, hồi chiêu, không tiên cơ, đóng góp chia đôi.
  await clean(); await test(A,"ready"); await test(B,"ready");
  const EB="bach_nhung_tho_vuong", eb=(await test(A,"beast",{boss:EB,dx:50,dy:0,hpx:50})).bid; // đầy máu, trâu: không gục sau một chiêu
  await test(A,"status",{s:"root",secs:30,bid:eb}); // tinh anh đứng yên ở điểm giữa
  const pa={x:meP(A).x,y:meP(A).y}, pb={x:meP(B).x,y:meP(B).y}, mid={x:Math.round((pa.x+pb.x)/2),y:Math.round((pa.y+pb.y)/2)};
  const mp0=[meP(A).mp,meP(B).mp], en0=JSON.stringify(A.squad?.list.map(s=>s.en)); A.fxs=[]; A.fus.length=0; B.fus.length=0;
  await fus(A,"start"); await waitFor(()=>B.fus.some(m=>m.k==="ask"),1500);
  w=await fus(B,"join");
  ok(await waitFor(()=>A.fus.some(m=>m.k==="done")&&B.fus.some(m=>m.k==="done"),1500)&&w.includes(`Võ Hồn Dung Hợp Kỹ ${YN.name}`),`B hưởng ứng: tung ${YN.name}: "${w}"`);
  const fx=A.fxs.find(f=>f.k==="fusion"), wave=A.fxs.find(f=>f.k==="wave");
  ok(fx&&fx.x===mid.x&&fx.y===mid.y&&wave&&Math.abs(wave.x-(pa.x+pb.x)/2)<1&&Math.abs(wave.y+6-(pa.y+pb.y)/2)<1,
    `nổ ở điểm giữa (${mid.x},${mid.y}): fx fusion (${fx?.x},${fx?.y}), vùng (${wave?.x?.toFixed(0)},${(wave?.y+6).toFixed(0)})`);
  ok(fx?.va===vohonIndex("yeu_ho")&&fx?.vb===vohonIndex("nguyet_nhan"),`fx fusion mang võ hồn hai người cho màu luồng sáng (#193): va ${fx?.va}, vb ${fx?.vb}`);
  // Hồn lực tự hồi vài điểm mỗi giây: chờ bản vá có phần trừ rồi so với khoảng hẹp quanh FUSION.cost.
  const spent=b=>mp0[b===A?0:1]-meP(b).mp;
  ok(await waitFor(()=>[A,B].every(b=>spent(b)>=FUSION.cost-6&&spent(b)<=FUSION.cost),1500),`mỗi người tốn ${FUSION.cost} hồn lực: A ${mp0[0]} -> ${meP(A).mp}, B ${mp0[1]} -> ${meP(B).mp}`);
  await sleep(YN.parts[0].n*(YN.parts[0].every??0.15)*1000+300);
  ok(JSON.stringify(A.squad?.list.map(s=>s.en))===en0,`không tạo năng lượng tiên cơ (đội A ${en0})`);
  const one=(await test(A,"elite",{bid:eb})).one, da=one?.dmgBy?.[A.room.sessionId]??0, db=one?.dmgBy?.[B.room.sessionId]??0;
  ok(one&&da>0&&Math.abs(da-db)<1e-6&&one.parts.includes(A.room.sessionId)&&one.parts.includes(B.room.sessionId),
    `đóng góp tinh anh chia đôi: A ${da.toFixed(1)}, B ${db.toFixed(1)}; cả hai là người tham gia`);
  // Hồi chiêu của hồn sư: đổi võ hồn không làm mới.
  w=await fus(A,"start"); ok(/hồi chiêu dung hợp/.test(w),`A tung lại ngay: "${w}"`);
  // #193: ô hồi chiêu G của client đọc giây còn lại từ tin riêng vohons (`fcd`).
  { const n0=A.ownedMsgs; A.room.send("vohons"); await waitFor(()=>A.ownedMsgs>n0,2500);
    ok(A.owned?.fcd>FUSION.cd-30&&A.owned.fcd<=FUSION.cd,`tin riêng vohons có hồi chiêu dung hợp còn lại: ${A.owned?.fcd} giây (FUSION.cd ${FUSION.cd})`); }
  await waitFor(()=>meP(B).swCd===0,3500); B.room.send("switch",{slot:1}); await waitFor(()=>meP(B).vh===vohonIndex("lam_ngan_thao"),2000);
  await waitFor(()=>meP(B).swCd===0,3500); B.room.send("switch",{slot:0}); await waitFor(()=>meP(B).vh===vohonIndex("nguyet_nhan"),2000);
  w=await fus(B,"start"); ok(/hồi chiêu dung hợp/.test(w),`B đổi võ hồn rồi đổi lại vẫn còn hồi chiêu: "${w}"`);
  // Hồi chiêu theo tài khoản: thoát rồi vào lại (phòng mới, dữ liệu phiên mới) vẫn còn.
  await B.room.leave(); await sleep(300); await enter(B); await waitFor(()=>meP(B)&&B.owned,3000);
  w=await fus(B,"start"); ok(/hồi chiêu dung hợp/.test(w),`B thoát rồi vào lại vẫn còn hồi chiêu: "${w}"`);
  ok(B.owned?.fcd>0&&B.owned.fcd<=FUSION.cd,`vào lại: vohons của B vẫn có hồi chiêu dung hợp ${B.owned?.fcd} giây (ô G không làm mới)`);
  // #194: U Minh Bạch Hổ. O (chưa dùng dung hợp) nhận Bạch Hổ bằng hook grant, U cầm U Minh Linh Miêu, hai người lập tổ đội riêng.
  { const UB=FUSIONS[fusionIndex("bach_ho","u_minh_linh_mieu")];
    await test(O,"grant",{vohon:"bach_ho"}); ok(await waitFor(()=>rowOf(O,"bach_ho"),2000),"O nhận Bạch Hổ (hook grant)");
    const wantO=[rowOf(O,"bach_ho"),0,0,0], wantU=[rowOf(U,"u_minh_linh_mieu"),0,0,0];
    await test(O,"clear"); await test(U,"clear"); await test(O,"rest",{s:TEAM_COMBAT_SECS+1}); await test(U,"rest",{s:TEAM_COMBAT_SECS+1});
    await test(O,"set",{rowId:wantO[0],level:35,xp:0,rings:Y}); await test(U,"set",{rowId:wantU[0],level:35,xp:0,rings:Y});
    await sendTeam(O,wantO); await sendTeam(U,wantU);
    ok(await waitFor(()=>meP(O).vh===vohonIndex("bach_ho")&&meP(U).vh===vohonIndex("u_minh_linh_mieu"),2500),`O ra trận Bạch Hổ, U ra trận U Minh Linh Miêu (${UB?.name})`);
    const ox=Math.round(meP(O).x), oy=Math.round(meP(O).y);
    let near=false; // hook goto bỏ qua ô không đứng được: thử vài chỗ quanh O, chọn chỗ U tới được ngoài làng
    for(const [dx,dy] of [[0,50],[50,0],[-50,0],[0,-50],[40,40],[-40,-40]]){
      await test(U,"goto",{x:ox+dx,y:oy+dy}); near=await waitFor(()=>Math.hypot(meP(U).x-ox-dx,meP(U).y-oy-dy)<0.5,600)&&!inSf(U); if(near) break; }
    ok(near,`U đứng gần O (${Math.round(Math.hypot(meP(U).x-meP(O).x,meP(U).y-meP(O).y))} pixel), ngoài làng`);
    await test(O,"party",{pop:"rlreset"});
    { const k=U.partyMsgs??0; O.room.send("party",{op:"invite",name:U.name}); await waitFor(()=>(U.partyMsgs??0)>k,2000);
      U.room.send("party",{op:"accept",name:O.name}); ok(await waitFor(()=>O.party?.members?.length===2&&U.party?.id===O.party.id,2000),"O và U cùng tổ đội"); }
    await test(O,"clear"); await test(U,"clear"); await test(O,"ready"); await test(U,"ready");
    const eb2=(await test(O,"beast",{boss:EB,dx:40,dy:0,hpx:50})).bid; await test(O,"status",{s:"root",secs:30,bid:eb2});
    O.fxs=[]; O.fus.length=0; U.fus.length=0;
    w=await fus(O,"start"); ok(await waitFor(()=>U.fus.some(m=>m.k==="ask"&&m.i===fusionIndex("bach_ho","u_minh_linh_mieu")),1500),`O mời: U nhận lời nhắc ${UB.name}: "${w}"`);
    w=await fus(U,"join");
    ok(await waitFor(()=>O.fus.some(m=>m.k==="done")&&U.fus.some(m=>m.k==="done"),1500)&&w.includes(`Võ Hồn Dung Hợp Kỹ ${UB.name}`),`U hưởng ứng: tung ${UB.name}: "${w}"`);
    const fx2=O.fxs.find(f=>f.k==="fusion");
    ok(fx2?.va===vohonIndex("bach_ho")&&fx2?.vb===vohonIndex("u_minh_linh_mieu"),`fx fusion mang Bạch Hổ và U Minh Linh Miêu: va ${fx2?.va}, vb ${fx2?.vb}`);
    await sleep(UB.parts.reduce((a,x)=>a+(x.n??1)*(x.every??0.15),0)*1000+500);
    const one2=(await test(O,"elite",{bid:eb2})).one, d1=one2?.dmgBy?.[O.room.sessionId]??0, d2=one2?.dmgBy?.[U.room.sessionId]??0;
    ok(one2&&d1>0&&Math.abs(d1-d2)<1e-6,`đóng góp tinh anh chia đôi: O ${d1.toFixed(1)}, U ${d2.toFixed(1)}`);
    const ar=O.room.state.beasts.get(eb2)?.armor??0;
    ok(ar>=2,`U Minh Bạch Hổ để lại Phá giáp trên tinh anh: ${ar} tầng`);
  }
  } finally { for(const b of [A,B,O,U]) await b.room.leave().catch(()=>{}); }
}
