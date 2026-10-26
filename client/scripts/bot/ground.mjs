// Nhóm bot "ground" (#703 bước 3, tách nguyên văn từ bot-test.mjs).
import { readFileSync } from "node:fs";
import { sleep, waitFor, ok, mapUrl, bot, test, needHookSkip } from "./lib.mjs";
import { statusBit, beastSkillOf, TELE_PAD, BOSSES, bossIndex, SYNC_VIEW, GROUND_KINDS, GROUND_TICK, TELE_SHAPES } from "../../../shared/data.ts";

export async function groundTest(){
  console.log("[#161] Vùng lưu lại trên mặt đất: vũng độc, sương độc");
  const skOf=(boss,name)=>BOSSES[bossIndex(boss)]?.skills.find(s=>s.name===name);
  const tt=beastSkillOf("that_tinh_doc_thiem",5000), dv=beastSkillOf("doc_vu_thiem",12000), kb=skOf("kim_boi_that_tinh_thiem","Nổ Túi Độc"), sd=skOf("song_dau_bich_lan_xa","Lân Độc Vụ");
  const poisonGround=s=>s?.ground&&s.ground.secs>0&&s.ground.status.some(a=>a.s==="poison");
  ok(tt?.ground?.kind==="pool"&&dv?.ground?.kind==="mist"&&kb?.ground?.kind==="pool"&&kb.ground.secs===6&&sd?.ground?.kind==="mist"&&sd.ground.secs===8
    &&[tt,dv,kb,sd].every(poisonGround)&&GROUND_KINDS.every(k=>!/^#ff/i.test(k.col)),
    `4 chiêu để lại vùng: ${[tt,dv,kb,sd].map(s=>`${s?.name} ${GROUND_KINDS.find(k=>k.id===s?.ground?.kind)?.name} ${s?.ground?.secs} giây`).join(", ")}; màu không đỏ`);
  const G=await bot("Độc Vụ","u_minh_linh_mieu",{sex:0,hair:2,hairCol:1,outfitCol:2}), V=await bot("Xa Độc","u_minh_linh_mieu",{sex:1,hair:1,hairCol:2,outfitCol:3},true);
  if(!(await test(G,"ping"))?.enabled){ needHookSkip("bỏ qua vùng lưu lại (cần hook goto, spawn, tele, ground): bật server bằng GAME_TEST=1"); for(const b of [G,V]) await b.room.leave(); return; }
  try{
  const me=b=>b.room.state.players?.get(b.room.sessionId), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  await waitFor(()=>me(G)&&G.owned&&me(V)&&V.owned,3000);
  await test(G,"set",{rowId:G.owned.active,level:60}); await test(G,"ready"); // đủ máu chịu chiêu và độc
  const sv=JSON.parse(readFileSync(mapUrl("thanh_hon_thon"),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="safe");
  const inSv=(x,y)=>x>=sv.x&&x<=sv.x+sv.width&&y>=sv.y&&y<=sv.y+sv.height;
  /** Đặt bot `b` ở chỗ đứng được đầu tiên trong `pts` (thỏa `cond`); trả điểm đã đứng hoặc null. */
  const place=async(b,pts,cond=()=>true)=>{ for(const [x,y] of pts){ if(!cond(x,y)) continue; await test(b,"goto",{x,y}); if(Math.hypot(me(b).x-x,me(b).y-y)<1) return {x,y}; } return null; };
  const edge=[]; for(let dy=0;dy<=sv.height/2;dy+=8) for(const sg of [1,-1]) edge.push([sv.x+sv.width+10,Math.round(sv.y+sv.height/2+sg*dy)]);
  // Chỗ đứng ngay ngoài mép đông làng (10 pixel) mà điểm `inX` pixel về tây đứng được và ở trong làng, vẫn trong vũng (bán kính Phun Độc).
  const inX=Math.round((10+tt.r)/2); let spot=null;
  for(const [x,y] of edge) if(!inSv(x,y)&&inSv(x-inX,y)&&await place(G,[[x-inX,y]])&&(spot=await place(G,[[x,y]]))) break;
  ok(!!spot,`G đứng ngay ngoài mép đông làng (${spot?.x},${spot?.y})`);
  if(!spot) return;
  const ground=async(more={})=>(await test(G,"ground",more))??{grounds:[],st:{}};
  /** Hồn thú loài `species` cạnh G báo trước chiêu đầu nhắm G, chờ tung; rồi Choáng 60 giây (không đuổi, không tung tiếp). */
  const castAt=async(species,years)=>{
    await test(G,"clear"); G.fxs=[];
    const bid=(await test(G,"spawn",{species,years,tier:2,dx:70,dy:0}))?.bid; if(!bid) return null;
    const t=await test(G,"tele",{i:0,bid}); const name=t?.name;
    const hit=await waitFor(()=>G.fxs.some(f=>f.k==="teleHit"&&f.bid===bid),2500);
    await test(G,"status",{s:"stun",secs:60,bid});
    return hit?{bid,name}:null;
  };

  // ---- Sương Độc (Độc Vụ Thiềm): sương lưu lại dưới chân, Trúng độc theo nhịp, ra khỏi sương thì thôi ----
  // Chỗ xa G hơn SYNC_VIEW.out + bán kính vùng (góc bản đồ xa nhất).
  const corners=[]; for(let k=0;k<=96;k+=16) for(const [x,y] of [[24+k,24],[24,24+k],[24+k,840],[24,840-k],[1128-k,24],[1128-k,840]]) corners.push([x,y]);
  const far=await place(V,corners,(x,y)=>Math.hypot(x-spot.x,y-spot.y)>SYNC_VIEW.out+dv.r+40);
  let c=await castAt("doc_vu_thiem",12000), g=await ground(), z=g.grounds.find(x=>x.src===c?.bid);
  ok(c&&z?.kind==="mist"&&z.shape==="circle"&&Math.hypot(z.x-spot.x,z.y-spot.y)<2&&z.r===dv.r&&Math.abs(z.ttl-dv.ground.secs)<1,
    `${c?.name} tung: để lại sương độc bán kính ${z?.r} dưới chân G, còn ${z?.ttl?.toFixed(1)} giây`);
  await ground({ttl:30}); // kéo dài để các bước sau không phụ thuộc máy nhanh / chậm; cuối phần rút lại để thử hết giờ
  ok(await waitFor(()=>[...G.room.state.grounds.values()].some(q=>GROUND_KINDS[q.kind]?.id==="mist"&&TELE_SHAPES[q.shape]==="circle"&&Math.hypot(q.x-spot.x,q.y-spot.y)<2),1000),
    "state.grounds của G có vùng sương (client vẽ được)");
  const n1=g.st.poison?.n??0;
  ok(n1>=1,`đứng trong sương lúc tung: Trúng độc ${n1} tầng`);
  ok(far&&dist(me(V),spot)>SYNC_VIEW.out+dv.r&&V.room.state.grounds.size===0,`V ở xa (${far?Math.round(dist(me(V),spot)):"?"} pixel, lọc theo vùng gần): không có vùng trong state`);
  await sleep(GROUND_TICK*2000+200); g=await ground();
  const n2=g.st.poison?.n??0;
  ok(n2>=n1+2&&dist(me(G),spot)<1,`đứng yên trong sương ${GROUND_TICK*2} nhịp: Trúng độc ${n1} -> ${n2} tầng`);
  const nearV=await place(V,[[spot.x+60,spot.y],[spot.x+60,spot.y+30],[spot.x+60,spot.y-30],[spot.x,spot.y+60],[spot.x,spot.y-60],[spot.x+100,spot.y]]);
  ok(nearV&&await waitFor(()=>V.room.state.grounds.size>=1,1500)&&[...V.room.state.grounds.values()].some(q=>GROUND_KINDS[q.kind]?.id==="mist"&&q.ttl>0),
    "V vào tầm sau khi sương đã có: thấy sương trong state (không chỉ tin fx lúc tung)");
  await test(G,"goto",{x:spot.x+dv.r+30,y:spot.y}); g=await ground(); const n3=g.st.poison?.n??0, t3=g.st.poison?.t??0;
  await sleep(GROUND_TICK*1000+400); g=await ground(); const n4=g.st.poison?.n??0, t4=g.st.poison?.t??0, live=g.grounds.some(x=>x.src===c?.bid);
  // Đủ tầng tối đa thì số tầng không tăng được nữa: xét cả thời gian còn lại không được làm mới (vẫn giảm dần).
  ok(live&&n4<=n3&&t4<t3-GROUND_TICK*0.5&&!inSv(me(G).x,me(G).y)&&Math.hypot(me(G).x-spot.x,me(G).y-spot.y)>dv.r+TELE_PAD,
    `ra khỏi sương (sương còn): không nhận thêm tầng (${n3} -> ${n4}), Trúng độc không được làm mới (${t3.toFixed(1)} -> ${t4.toFixed(1)} giây)`);
  await ground({ttl:0.5});
  ok(await waitFor(()=>G.room.state.grounds.size===0,2000)&&!(await ground()).grounds.some(x=>x.src===c?.bid),"sương hết giờ thì mất khỏi state");
  ok(await waitFor(()=>!(me(G).st&statusBit("poison")),4000),"rời sương một lúc: hết Trúng độc");

  // ---- Phun Độc (Thất Tinh Độc Thiềm): vũng ở mép làng, bước vào làng (vẫn trong vũng) thì hết độc, không nhận thêm ----
  await test(G,"goto",spot); await test(G,"ready");
  c=await castAt("that_tinh_doc_thiem",5000); g=await ground({ttl:30}); z=g.grounds.find(x=>x.src===c?.bid);
  ok(c&&z?.kind==="pool"&&(g.st.poison?.n??0)>=1,`${c?.name} tung: vũng độc dưới chân G, Trúng độc ${g.st.poison?.n??0} tầng`);
  await test(G,"goto",{x:spot.x-inX,y:spot.y});
  const inPool=z&&Math.hypot(me(G).x-z.x,me(G).y-z.y)<z.r;
  await sleep(GROUND_TICK*2000+200); g=await ground();
  ok(inPool&&inSv(me(G).x,me(G).y)&&g.grounds.some(x=>x.src===c?.bid)&&!g.st.poison&&!(me(G).st&statusBit("poison")),
    `vào làng (vùng an toàn) mà vẫn trong vũng ${GROUND_TICK*2} nhịp: hết Trúng độc, không nhận thêm`+(inPool&&!g.st.poison?"":` (G ${me(G).x},${me(G).y}, vũng ${JSON.stringify(z)}, độc ${JSON.stringify(g.st.poison)})`));

  // ---- Hồn thú gây ra bị hạ thì vũng mất ngay ----
  await test(G,"goto",spot);
  c=await castAt("that_tinh_doc_thiem",5000); g=await ground();
  const had=g.grounds.some(x=>x.src===c?.bid);
  await test(G,"slay",{bid:c?.bid}); g=await ground();
  ok(c&&had&&!g.grounds.some(x=>x.src===c.bid)&&await waitFor(()=>G.room.state.grounds.size===0,1000),`${c?.name}: hạ Thất Tinh Độc Thiềm thì vũng của nó mất ngay`);
  } finally { for(const b of [G,V]) await b.room.leave().catch(()=>{}); }
}
