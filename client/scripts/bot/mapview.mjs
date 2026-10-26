// Nhóm bot "mapview" (#703 bước 6, tách nguyên văn từ bot-test.mjs): Bản đồ: tầm nhìn đồng bộ, cờ, điểm dịch chuyển, doanh trại, bản đồ lớn, sương mù, dấu tập trung.
import { Client } from "colyseus.js";
import { solidGrid, hits, isSolidTile, PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { findLongPath, buildNav, navNode, clearLine, pathLength } from "../../../shared/path.ts";
import { autoLeg } from "../../../shared/autowalk.ts";
import { readFileSync } from "node:fs";
import { checkBeastYears, checkGateClear, post, sleep, waitFor, ok, mapFileOf, mapUrl, zonesByName, bot, enter, qtyOf, bagKey, npcSpot, talk, trade, same, test, needHookSkip } from "./lib.mjs";
import { TRAVEL_CAST, itemDef, formatHonTe, TEAM_COMBAT_SECS, MAPS, parseLevelRange, RING_ITEM, BOAT_CAST, npcDef, NPC_RANGE, SHOP, sellPrice, PLAYER_SPEED, TICK_RATE, WAYPOINT_CAST, WAYPOINT_FEE, waypointFee, SYNC_VIEW, CAMP_MERCHANT, CAMP_SHOP, CAMP_STEP, shopOf, shopExpands, RADAR, RALLY, MAPS as RALLY_MAPS, FOG, AUTO_MOVE, AUTOWALK, TILE } from "../../../shared/data.ts";
import { rallyUpsert, rallyPrune } from "../../../shared/rally.ts";
import { fogDims, fogCount, fogGet, fogCellOf, fogValid } from "../../../shared/fog.ts";
import { loadMap } from "../../../server/src/map.ts";
import { campMerchantSpot } from "../../../shared/camp.ts";

export async function syncViewTest(){
  console.log("[11.4] Đồng bộ theo vùng gần, hồn thú ngủ, bản đồ nhỏ");
  ok(SYNC_VIEW.r<SYNC_VIEW.out&&SYNC_VIEW.out<SYNC_VIEW.fx&&SYNC_VIEW.wake>=SYNC_VIEW.out,`SYNC_VIEW: vào ${SYNC_VIEW.r} < ra ${SYNC_VIEW.out} < fx ${SYNC_VIEW.fx}, ngủ ngoài ${SYNC_VIEW.wake} pixel`);
  const V=await bot("Gần","lam_dien_ba_vuong_long",{sex:0,hair:1,hairCol:2,outfitCol:1},true);
  const W=await bot("Xa","lam_dien_ba_vuong_long",{sex:1,hair:1,hairCol:1,outfitCol:3},true);
  if(!(await test(V,"ping"))?.enabled){ needHookSkip("bỏ qua 11.4 (cần hook view, warp, goto): bật server bằng GAME_TEST=1"); await V.room.leave(); await W.room.leave(); return; }
  const MAP="tinh_dau_ngoai_vi", objs=JSON.parse(readFileSync(new URL(`../../../shared/assets/${mapFileOf(MAP)}.json`,import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[]);
  const wpAt=n=>{ const o=objs.find(o=>o.type==="waypoint"&&o.name===n); return {x:o.x+o.width/2,y:o.y+o.height/2}; };
  const west=wpAt("trai_cong"), east=wpAt("tram_gac");
  const me=b=>b.room.state.players.get(b.room.sessionId), dist=(a,c)=>Math.hypot(a.x-c.x,a.y-c.y);
  async function warp(b,p){
    b.travel=null; b.room.send("test",{op:"warp",mapId:MAP,x:p.x,y:p.y});
    ok(await waitFor(()=>b.travel?.mapId===MAP,4000),`${b.name}: warp -> ${MAPS[MAP].name}`);
    const roomId=b.travel?.roomId??undefined; await b.room.leave(); await sleep(300); b.mapId=MAP; await enter(b,roomId); await waitFor(()=>me(b),3000);
  }
  /** Đứng ở (x, y) hoặc chỗ đứng được gần đó (hook goto chỉ nhận ô đứng được). */
  async function place(b,p){
    for(const [dx,dy] of [[0,0],[16,0],[0,16],[-16,0],[0,-16],[32,32],[-32,32],[32,-32],[-32,-32],[48,0],[0,48]]){
      const q={x:p.x+dx,y:p.y+dy}; await test(b,"goto",q); if(me(b)&&dist(me(b),q)<2) return true;
    }
    return false;
  }
  await warp(V,west); await warp(W,east);
  await place(V,west); await place(W,east);
  const sid=W.room.sessionId, vsid=V.room.sessionId;
  await waitFor(()=>!V.room.state.players.has(sid),1500);
  let v=await test(V,"view");
  ok(me(V)&&!V.room.state.players.has(sid)&&!W.room.state.players.has(vsid)&&V.room.state.online===v?.total?.players&&v.total.players>=2,
    `hồn sư cách ${Math.round(dist(me(V),me(W)))} pixel không có trong state của nhau; state.online = ${V.room.state.online} (cả phòng ${v?.total?.players})`);
  const bs=[...V.room.state.beasts.values()], farB=bs.filter(b=>!b.rank&&dist(b,me(V))>SYNC_VIEW.out+40), ranked=bs.filter(b=>b.rank).length;
  ok(!farB.length&&V.room.state.beasts.size<=v.total.beasts&&ranked===v.total.ranked,
    `state có ${V.room.state.beasts.size}/${v.total.beasts} hồn thú, không con thường nào xa quá ${SYNC_VIEW.out} pixel (${farB.length}), đủ ${ranked}/${v.total.ranked} tinh anh / thú vương`);
  // R5 (#432): tin mini lọc theo RADAR.far. Người lạ ngoài bán kính KHÔNG có trong tin (không lộ vị trí), chính mình luôn có.
  const farPx=dist(me(V),me(W)), miniHas=(b,id)=>b.mini?.p?.some((v,i)=>i%3===0&&v===id);
  V.mini=null; await waitFor(()=>V.mini?.p?.length,2500); await sleep(1200);
  ok(farPx>RADAR.far*16,`hai bot cách ${Math.round(farPx/16)} ô, xa hơn RADAR.far = ${RADAR.far} ô`);
  ok(miniHas(V,vsid)&&!miniHas(V,sid)&&!miniHas(W,vsid),"tin mini: người lạ ngoài RADAR.far không có trong tin của nhau, chính mình có");
  // Đồng đội tổ đội ở xa vẫn có (luật R5).
  W.room.send("party",{op:"invite",name:V.name}); await sleep(300); V.room.send("party",{op:"accept",name:W.name});
  await waitFor(()=>V.party?.members?.length===2,2500);
  V.mini=null; ok(await waitFor(()=>miniHas(V,sid),3000),"tin mini: đồng đội tổ đội ở xa có trong tin");
  const k=V.mini?.p?.indexOf(sid)??-1;
  ok(k>=0&&Math.abs(V.mini.p[k+1]-Math.floor(me(W).x/16))<=2&&Math.abs(V.mini.p[k+2]-Math.floor(me(W).y/16))<=2,`tin mini: vị trí theo ô ${V.mini?.p?.slice(k+1,k+3)}`);
  V.room.send("party",{op:"leave"}); await waitFor(()=>!V.party||V.party.members?.length<2,2500);
  V.mini=null; await waitFor(()=>V.mini?.p?.length,2500); await sleep(1200);
  ok(!miniHas(V,sid),"rời tổ đội: người ở xa lại biến khỏi tin mini");
  // Chống gian lận (#166): sid ở xa (lấy từ tin mini) không đổi được ra tên qua lời mời tổ đội.
  /** Khung tổ đội mới nhất của `b` (xin `party {op:"get"}`, chờ tin về): đọc sau khi server đã xử lý tin của người kia. */
  const partyNow=async b=>{ const n=b.partyMsgs; b.room.send("party",{op:"get"}); await waitFor(()=>b.partyMsgs>n,2000); return b.party; };
  const inviteSid=async()=>{ const l=V.logs.length; V.room.send("party",{op:"invite",sid}); await waitFor(()=>V.logs.length>l,2000); return V.logs.slice(l).join(" | "); };
  { const t=await inviteSid(), wp=await partyNow(W);
    ok(/không còn ở đây/.test(t)&&!t.includes(W.name)&&!!wp&&!wp.invites.length,`mời tổ đội bằng sid của hồn sư ở xa: bị từ chối, không lộ tên (${t})`); }
  // Lại gần dưới SYNC_VIEW.r: thấy nhau.
  await place(W,{x:west.x+48,y:west.y+16});
  ok(await waitFor(()=>V.room.state.players.has(sid)&&W.room.state.players.has(vsid),1500),`lại gần (${Math.round(dist(me(W),me(V)))} pixel): hai bên thấy nhau`);
  V.mini=null; ok(await waitFor(()=>miniHas(V,sid),3000),"tin mini: người lạ trong RADAR.far (đang gần) có trong tin");
  // Bấm vào hồn sư đang thấy (sid): lời mời tới đúng người, có tên người mời; từ chối để dọn.
  { const t=await inviteSid(), wp=await partyNow(W);
    ok(wp?.invites?.some(i=>i.name===V.name)&&t.includes(W.name),`mời tổ đội bằng sid của hồn sư đang thấy: W nhận lời mời của V (${t})`);
    W.room.send("party",{op:"decline",name:V.name}); const wq=await partyNow(W); ok(!!wq&&!wq.invites.length,"W từ chối: hết lời mời"); }
  // Tin fx: người ở xa đánh thường thì không gửi tới; ở gần thì có.
  await place(W,east); ok(await waitFor(()=>!V.room.state.players.has(sid),1500),"đi xa quá out: hồn sư rời state");
  V.fxs=[]; W.fxs=[]; W.room.send("attack"); await waitFor(()=>W.fxs.some(f=>f.k==="slash"&&f.id===sid),1500); await sleep(300);
  ok(W.fxs.some(f=>f.k==="slash"&&f.id===sid)&&!V.fxs.some(f=>f.id===sid),"tin fx (đánh thường) của hồn sư ở xa không gửi tới");
  await place(W,{x:west.x+48,y:west.y+16}); await waitFor(()=>V.room.state.players.has(sid),1500); await sleep(1200);
  V.fxs=[]; W.room.send("attack"); ok(await waitFor(()=>V.fxs.some(f=>f.k==="slash"&&f.id===sid),1500),"ở gần thì nhận tin fx của nhau");
  // Hồn thú: rời state khi mình đi xa, ngủ khi không ai trong SYNC_VIEW.wake, có lại và thức khi quay về.
  await place(W,east); await test(V,"clear");
  const bid=(await test(V,"spawn",{tier:0,dx:60,dy:0}))?.bid;
  ok(!!bid&&await waitFor(()=>V.room.state.beasts.has(bid),1500),"hồn thú vừa sinh cạnh mình có trong state");
  await place(V,{x:east.x,y:east.y+48});
  ok(await waitFor(()=>!V.room.state.beasts.has(bid),1500),"đi xa quá out: hồn thú rời state");
  let x=await test(V,"view",{bid});
  ok(!!x?.beast&&!x.beast.seen,`server vẫn còn hồn thú đó (${Math.round(x?.beast?.x)},${Math.round(x?.beast?.y)}), chỉ không đồng bộ`);
  if(x?.total?.players===2){
    ok(x.beast&&!x.beast.awake,"không hồn sư nào trong tầm thức: hồn thú ngủ");
    const p0=x.beast&&{x:x.beast.x,y:x.beast.y}; await sleep(2500); x=await test(V,"view",{bid});
    ok(x?.beast&&p0&&x.beast.x===p0.x&&x.beast.y===p0.y&&!x.beast.moving,"hồn thú ngủ không lang thang (2,5 giây)");
  } else console.log(`  ⚠ bỏ qua kiểm tra hồn thú ngủ: phòng có ${x?.total?.players} hồn sư`);
  await place(V,west);
  ok(await waitFor(()=>V.room.state.beasts.has(bid),1500),"quay lại: hồn thú vào lại state");
  x=await test(V,"view",{bid}); ok(x?.beast?.awake&&x.beast.seen,"hồn thú thức lại");
  // Đồ rơi: hạ hồn thú cạnh V thì V thấy đồ rơi, W ở xa không thấy nhưng bản đồ nhỏ của W có.
  const d0=(await test(V,"beast",{dx:30,dy:0}))?.bid; const drops0=V.room.state.drops.size;
  await test(V,"slay",{bid:d0});
  ok(await waitFor(()=>V.room.state.drops.size>drops0,1500),"đồ rơi cạnh mình có trong state");
  const near=d=>dist(d,me(V))<80; await sleep(300);
  ok(![...W.room.state.drops.values()].some(near),"hồn sư ở xa không nhận đồ rơi đó");
  W.mini=null; ok(await waitFor(()=>(W.mini?.d?.length??0)>=3,2500)&&W.mini.d.some((t,i)=>i%3===0&&Math.abs(t*16-me(V).x)<96),"bản đồ nhỏ của người ở xa vẫn có đồ rơi");
  // Hook view: tắt lọc thì thấy cả hồn sư ở xa, bật lại thì mất.
  ok((await test(V,"view",{all:true}))?.all===true,"hook view all: tắt lọc");
  ok(await waitFor(()=>V.room.state.players.has(sid),1500),"tắt lọc: thấy cả hồn sư ở xa");
  await test(V,"view",{all:false}); ok(await waitFor(()=>!V.room.state.players.has(sid),1500),"bật lại lọc: hồn sư ở xa rời state");
  await V.room.leave(); await W.room.leave();
}

/**
 * Tự đi tới cờ (R4 #431; BOT_ONLY=flag): cùng bản đồ, xuyên một cổng, bị chặn. Client (GameScene.flagTick) chỉ lái hướng đi bằng `input` và gửi
 * `travel` khi server báo đang đứng trên cổng; bot lặp lại đúng vòng đó với cùng hàm dùng chung (autoLeg, findLongPath) và `route` thật
 * của tin "daily", để kiểm đường dữ liệu trên bản đồ ×8 thật: đường đi dài, cổng có thật, server không có lệnh dịch chuyển.
 */
export async function flagTest(){
  console.log("[R4 #431] Tự đi tới cờ: cùng bản đồ, xuyên cổng, bị chặn");
  const HT="thanh_hon_thon", ND="nac_dinh_thanh";
  const T=await bot("Đi cờ","kim_vu_mieu_ung",{sex:1,hair:0,hairCol:3,outfitCol:2});
  const me=()=>T.room.state.players?.get(T.room.sessionId);
  await waitFor(()=>me()&&T.daily,3000);
  const gridOf=m=>solidGrid(JSON.parse(readFileSync(mapUrl(m),"utf8")));
  const navOf=new Map(), nav=(m,g)=>{ if(!navOf.has(m)) navOf.set(m,buildNav(g,AUTO_MOVE.nav.block)); return navOf.get(m); };
  const objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const near=()=>Math.max(3,me().spd*(1/TICK_RATE+0.05));
  const here=()=>T.room.state.mapId;
  async function rejoin(){
    const t=T.travel; await T.room.leave(); await sleep(250); T.mapId=t.mapId; await enter(T,t.roomId??undefined);
    await waitFor(()=>me(),3000); T.room.send("quest",{op:"get"}); // không chờ tin daily: autoWalk chờ khi cần route, như GameScene.flagTick
  }
  /**
   * Một lần "tự đi" như GameScene.flagTick: chặng cờ / cổng theo autoLeg, đường findLongPath, lái hướng bằng `input`, kẹt 5 giây thì dừng,
   * đứng trên cổng thì `travel` rồi vào bản đồ mới. Trả "arrived" | "none" | "stuck" | "gate" | "timeout".
   */
  async function autoWalk(goal,maxMs=120000){
    const t0=Date.now(); let best=Infinity, bestT=Date.now(), mapAt=here();
    while(Date.now()-t0<maxMs){
      if(here()!==goal.map&&!T.daily&&!(await waitFor(()=>T.daily,AUTOWALK.gateSecs*1000))) return "none"; // vừa qua cổng: chờ tin daily có route
      const leg=autoLeg(here(),{map:goal.map,tile:goal.tx!=null},T.daily?.route??{});
      if(leg.k==="arrived") return "arrived";
      if(leg.k==="none") return "none";
      const g=gridOf(here()), p=me(), raw=objsOf(here());
      let tx, ty;
      if(leg.k==="flag"){ tx=goal.tx*TILE; ty=goal.ty*TILE; }
      else { const o=raw.find(q=>q.type==="portal"&&(q.properties??[]).find(z=>z.name==="to")?.value===leg.to); if(!o) return "none"; tx=o.x+o.width/2; ty=o.y+o.height/2; }
      if(mapAt!==here()){ mapAt=here(); best=Infinity; bestT=Date.now(); }
      if(leg.k==="gate"&&T.portal?.name&&T.portal.to===leg.to){
        T.room.send("input",{x:0,y:0}); T.travel=null; T.room.send("travel",{portal:T.portal.name});
        if(!(await waitFor(()=>T.travel?.mapId===leg.to,AUTOWALK.gateSecs*1000))) return "gate";
        await rejoin(); continue;
      }
      const d=Math.hypot(tx-p.x,ty-p.y)/TILE;
      if(leg.k==="flag"&&d<AUTOWALK.arrive){ T.room.send("input",{x:0,y:0}); return "arrived"; }
      if(d<best-AUTOWALK.progress){ best=d; bestT=Date.now(); } else if(Date.now()-bestT>AUTOWALK.stuckSecs*1000){ T.room.send("input",{x:0,y:0}); return "stuck"; }
      const path=findLongPath(g,nav(here(),g),p,{x:tx,y:ty},AUTO_MOVE.nav.look), end=path.at(-1);
      if(!end||Math.hypot(end.x-tx,end.y-ty)>TILE*2){ T.room.send("input",{x:0,y:0}); return "none"; }
      // Đi hết đoạn này (như goal của GameScene): tới từng điểm, bỏ khi kẹt 0,5 giây không gần thêm.
      let i=0, dBest=Infinity, dT=Date.now();
      while(i<path.length&&Date.now()-t0<maxMs){
        const q=me(); let w=path[i], L=Math.hypot(w.x-q.x,w.y-q.y);
        while(L<near()&&i<path.length-1){ w=path[++i]; L=Math.hypot(w.x-q.x,w.y-q.y); dBest=Infinity; dT=Date.now(); }
        if(L<near()) break;
        if(Date.now()-dT>500){ if(L>dBest-2) break; dBest=L; dT=Date.now(); }
        if(leg.k==="gate"&&T.portal?.name) break; // server báo đã đứng trên cổng
        T.room.send("input",{x:+((w.x-q.x)/L).toFixed(2),y:+((w.y-q.y)/L).toFixed(2)}); await sleep(50);
      }
      T.room.send("input",{x:0,y:0}); await sleep(80);
    }
    T.room.send("input",{x:0,y:0}); return "timeout";
  }
  /** Ô thoáng cách (cx, cy) chừng `r` ô theo hướng a, đi bộ tới được từ vị trí đang đứng (cùng vùng liên thông, không phải ô chặn). */
  const reachable=(g,nv,from,p)=>{ const a=navNode(nv,from.x,from.y), b=navNode(nv,p.x,p.y); return a>=0&&b>=0&&nv.region[a]===nv.region[b]; };

  if(!(await test(T,"ping"))?.enabled){ needHookSkip("bỏ qua tự đi tới cờ (cần hook goto, down): bật server bằng GAME_TEST=1"); await T.room.leave(); return; }
  // 1. Cùng bản đồ: cờ xa (≥ 50 ô), phải đi vòng vật cản bằng đường dài.
  await test(T,"clear",{all:true}); T.room.send("input",{x:0,y:0});
  { const g=gridOf(HT), nv=nav(HT,g), p0={x:me().x,y:me().y}; let flag=null;
    for(let r=60;r<=140&&!flag;r+=10) for(let a=0;a<24&&!flag;a++){
      const tx=Math.floor(p0.x/TILE+Math.cos(a*Math.PI/12)*r), ty=Math.floor(p0.y/TILE+Math.sin(a*Math.PI/12)*r), x=(tx+.5)*TILE, y=(ty+.5)*TILE;
      if(tx<2||ty<2||tx>=g.MW-2||ty>=g.MH-2||isSolidTile(g,tx,ty)||hits(g,x,y,PLAYER_HW+1,PLAYER_HH+1)||!reachable(g,nv,p0,{x,y})) continue;
      const path=findLongPath(g,nv,p0,{x,y},AUTO_MOVE.nav.look), end=path.at(-1);
      if(end&&Math.hypot(end.x-x,end.y-y)<TILE&&!clearLine(g,p0,{x,y})) flag={tx:tx+.5,ty:ty+.5,len:pathLength(p0,path)};
    }
    if(!flag) console.log("  ⚠ bỏ qua cờ cùng bản đồ: không có ô xa bị chắn quanh",p0.x.toFixed(0),p0.y.toFixed(0));
    else {
      const res=await autoWalk({map:HT,tx:flag.tx,ty:flag.ty}), q=me(), d=Math.hypot(q.x-flag.tx*TILE,q.y-flag.ty*TILE)/TILE;
      ok(res==="arrived"&&d<AUTOWALK.arrive+1,`cờ cùng bản đồ: đường ${(flag.len/TILE).toFixed(0)} ô vòng vật cản, ${res}, còn cách cờ ${d.toFixed(1)} ô (server tính vị trí, không dịch chuyển)`);
      ok(here()===HT,"cùng bản đồ: không đổi phòng");
    }
  }
  // 2. Xuyên một cổng: tới Nặc Đinh Thành rồi đi tiếp tới một ô trong bản đồ mới.
  { ok(T.daily.route?.[ND]===ND,`route từ ${MAPS[HT].name}: tới ${MAPS[ND].name} qua cổng trực tiếp (${JSON.stringify(T.daily.route)})`);
    const res1=await autoWalk({map:ND,tx:null,ty:null});
    ok(res1==="arrived"&&here()===ND,`đi tới bản đồ ${MAPS[ND].name} qua cổng thật: ${res1}, đang ở ${MAPS[here()]?.name}`);
    const g=gridOf(ND), nv=nav(ND,g), p0={x:me().x,y:me().y}; let flag=null;
    for(let r=30;r<=90&&!flag;r+=10) for(let a=0;a<24&&!flag;a++){
      const tx=Math.floor(p0.x/TILE+Math.cos(a*Math.PI/12)*r), ty=Math.floor(p0.y/TILE+Math.sin(a*Math.PI/12)*r), x=(tx+.5)*TILE, y=(ty+.5)*TILE;
      if(tx<2||ty<2||tx>=g.MW-2||ty>=g.MH-2||isSolidTile(g,tx,ty)||hits(g,x,y,PLAYER_HW+1,PLAYER_HH+1)||!reachable(g,nv,p0,{x,y})) continue;
      const end=findLongPath(g,nv,p0,{x,y},AUTO_MOVE.nav.look).at(-1); if(end&&Math.hypot(end.x-x,end.y-y)<TILE) flag={tx:tx+.5,ty:ty+.5};
    }
    ok(!!flag,"có ô cờ đi được trong bản đồ mới");
    if(flag){ const res2=await autoWalk({map:ND,tx:flag.tx,ty:flag.ty}), q=me(), d=Math.hypot(q.x-flag.tx*TILE,q.y-flag.ty*TILE)/TILE;
      ok(res2==="arrived"&&d<AUTOWALK.arrive+1,`tiếp tục tới cờ trong ${MAPS[ND].name}: ${res2}, còn cách ${d.toFixed(1)} ô`); }
    // Đi ngược về: cờ ở bản đồ cũ, chặng đầu là cổng (route từ bản đồ mới).
    ok(T.daily.route?.[HT]===HT,`route từ ${MAPS[ND].name} về ${MAPS[HT].name} là cổng trực tiếp`);
    const res3=await autoWalk({map:HT,tx:null,ty:null}); ok(res3==="arrived"&&here()===HT,`đi ngược lại ${MAPS[HT].name} qua cổng: ${res3}`);
  }
  // 3b. Server không nhận lệnh dịch chuyển: input lạ (toạ độ đích) bị bỏ qua, chỉ hướng đi.
  { const p=me(), x0=p.x, y0=p.y;
    T.room.send("input",{x:1,y:0,tx:x0+500,ty:y0+500}); await sleep(300); T.room.send("input",{x:0,y:0}); await sleep(150);
    ok(Math.hypot(me().x-x0,me().y-y0)<PLAYER_SPEED,`input kèm toạ độ đích không dịch chuyển (đi ${Math.hypot(me().x-x0,me().y-y0).toFixed(0)} px, tối đa ${PLAYER_SPEED} px/giây)`); }
  // 3. Bị chặn: ô chặn không đặt được cờ, ô không cùng vùng liên thông không có đường, bản đồ không có cổng tới (sân đấu), cổng bị từ chối.
  { const g=gridOf(HT), nv=nav(HT,g); let solid=null;
    for(let y=0;y<g.MH&&!solid;y++) for(let x=0;x<g.MW&&!solid;x++) if(isSolidTile(g,x,y)) solid={x,y};
    ok(!!solid&&isSolidTile(g,solid.x,solid.y),"ô chặn: client từ chối đặt cờ (isSolidTile)");
    let isle=null; const p0={x:me().x,y:me().y};
    for(let y=2;y<g.MH-2&&!isle;y+=3) for(let x=2;x<g.MW-2&&!isle;x+=3){ const px=(x+.5)*TILE, py=(y+.5)*TILE;
      if(!isSolidTile(g,x,y)&&navNode(nv,px,py)>=0&&!reachable(g,nv,p0,{x:px,y:py})) isle={x:x+.5,y:y+.5}; }
    if(isle){ const res=await autoWalk({map:HT,tx:isle.x,ty:isle.y},8000); ok(res==="none"&&Math.hypot(me().x-p0.x,me().y-p0.y)<TILE,`ô ở vùng tách biệt (${isle.x},${isle.y}): "không có đường", đứng yên`); }
    else console.log("  ⚠ bỏ qua vùng tách biệt: bản đồ chỉ có một vùng liên thông");
    ok(autoLeg(HT,{map:"dai_dau_hon_truong",tile:false},T.daily.route).k==="none"&&T.daily.route?.dai_dau_hon_truong===undefined,"bản đồ không có cổng đi bộ tới (sân đấu): không có đường, không tự dùng truyền tống / Hồi Thành Phù");
    // Cổng bị từ chối: xin qua cổng khi không đứng trong cổng (client sửa / lỗi thời gian) thì server từ chối, không dịch chuyển.
    const portal=objsOf(HT).find(o=>o.type==="portal"&&(o.properties??[]).find(z=>z.name==="to")?.value===ND);
    await test(T,"goto",{x:p0.x,y:p0.y}); T.travel=null; const l=T.logs.length; T.room.send("travel",{portal:portal.name}); await sleep(700);
    ok(!T.travel&&T.logs.slice(l).some(t=>/đứng trong cổng/.test(t))&&here()===HT,`xin qua cổng khi không đứng trong cổng: server từ chối ("${T.logs.at(-1)}"), không dịch chuyển`);
  }
  // 5. Hai cổng liên tiếp (#516): Thánh Hồn Thôn → Nặc Đinh Thành → Tinh Đấu Ngoại vi. Vào Nặc Đinh Thành chưa có tin daily mà vẫn phải đi tiếp.
  { const far="tinh_dau_ngoai_vi";
    ok(T.daily?.route?.[far]===ND&&autoLeg(HT,{map:far,tile:false},T.daily.route).k==="gate",`route: ${MAPS[far].name} cách hai cổng, chặng đầu là ${MAPS[ND].name}`);
    let hops=0; T.room.onMessage("travel",()=>{hops++;}); const first=T.room.sessionId;
    const res=await autoWalk({map:far,tx:null,ty:null},240000);
    ok(res==="arrived"&&here()===far&&first!==T.room.sessionId,`đi hai cổng liền: ${res}, đang ở ${MAPS[here()]?.name}`); }
  await T.room.leave();
}

/**
 * 11.2 Truyền tống trận và bản đồ thế giới: dữ liệu (mọi bản đồ trừ sân đấu có 1–3 object `waypoint`, tâm đứng được, phí theo số lần
 * đi cổng, Hồi Thành Phù bán ở thương nhân, không mua lại). Với hook: bot T (tài khoản mới) mở khóa trận khi bước lên (tin `wp`, bản
 * đồ thế giới ghi đã mở), không đứng trên trận thì chỉ xem, trận chưa mở / thiếu Hồn Tệ / đang giao chiến bị từ chối; niệm WAYPOINT_CAST
 * giây rồi dịch chuyển trong cùng bản đồ (trừ phí) và sang bản đồ khác (transaction đi cổng, phí lưu qua đi cổng); bị đánh hoặc di
 * chuyển thì hủy, không mất gì; Hồi Thành Phù về thành gần nhất, mất một phù, bị đánh thì hủy và giữ phù; thoát vào lại vẫn nhớ trận đã mở.
 */
export async function waypointTest(){
  console.log("[11.2] Truyền tống trận, bản đồ thế giới, Hồi Thành Phù");
  const objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const wps={};
  for(const id of Object.keys(MAPS)){
    const list=objsOf(id).filter(o=>o.type==="waypoint").map(o=>({key:`${id}:${o.name}`,map:id,label:(o.properties??[]).find(q=>q.name==="label")?.value,x:o.x+o.width/2,y:o.y+o.height/2}));
    if(MAPS[id].kind==="arena") ok(!list.length,`${MAPS[id].name}: sân đấu không có truyền tống trận`);
    else ok(list.length>=1&&list.length<=3&&list.every(w=>w.label),`${MAPS[id].name}: ${list.length} truyền tống trận (${list.map(w=>w.label).join(", ")})`);
    for(const w of list) wps[w.key]=w;
  }
  ok(WAYPOINT_CAST===3&&waypointFee(0)===WAYPOINT_FEE.base&&waypointFee(2)===WAYPOINT_FEE.base+2*WAYPOINT_FEE.perHop,`phí truyền tống: ${[0,1,2,3].map(h=>formatHonTe(waypointFee(h))).join(" / ")} theo số lần đi cổng, niệm ${WAYPOINT_CAST} giây`);
  const phu=itemDef("hoi_thanh_phu"), phuPrice=SHOP.find(r=>r.code==="hoi_thanh_phu")?.price;
  ok(phu?.recall&&phu.kind==="phu"&&phuPrice>0&&sellPrice({code:"hoi_thanh_phu",years:null,stars:null,enhance:0})===null,`Hồi Thành Phù: thương nhân bán ${formatHonTe(phuPrice??0)}, không mua lại`);
  const T=await bot("Du hành","kim_vu_mieu_ung",{sex:1,hair:0,hairCol:3,outfitCol:2});
  if(!(await test(T,"ping"))?.enabled){ needHookSkip("bỏ qua truyền tống (cần hook warp, goto, coin, hurt): bật server bằng GAME_TEST=1"); await T.room.leave(); return; }
  const tme=()=>T.room.state.players?.get(T.room.sessionId);
  await waitFor(()=>tme()&&T.bag,3000);
  const world=async()=>{ T.world=null; T.room.send("wp",{op:"list"}); await waitFor(()=>T.world,1500); return T.world; };
  const at=(w)=>Math.hypot(tme().x-w.x,tme().y-w.y)<1;
  async function rejoin(){ await T.room.leave(); await sleep(300); T.mapId=(await post("/api/me",{token:T.token})).mapId; await enter(T); await waitFor(()=>tme()&&T.bag,3000); }
  async function warp(mapId,x,y){
    T.travel=null; T.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>T.travel?.mapId===mapId,4000),`warp -> ${MAPS[mapId].name}`);
    await rejoin();
  }
  /** Đứng lên trận `key` (hook goto) và chờ tin `wp {k: "here"}`. */
  async function stand(key){ const w=wps[key]; T.wpHere=null; await test(T,"goto",{x:w.x,y:w.y}); await waitFor(()=>T.wpHere?.key===key,1500); return w; }
  /** Xin truyền tống tới `key`, chờ log trả lời (bắt đầu niệm hoặc từ chối). */
  async function go(key){ const l=T.logs.length; T.recall=null; T.room.send("wp",{op:"go",key}); await waitFor(()=>T.logs.length>l,1500); return T.logs.at(-1)??""; }
  const coin=async n=>{ await test(T,"coin",{n}); await waitFor(()=>T.bag?.honTe===n,1500); };

  // Thánh Hồn Thôn: bản đồ thế giới khi không đứng trên trận chỉ để xem.
  const lang="thanh_hon_thon:lang", nd="nac_dinh_thanh:quang_truong", tc="tinh_dau_ngoai_vi:trai_cong", rt="tinh_dau_ngoai_vi:rung_thua";
  const tv=npcSpot("thanh_hon_thon","to_van_dao"); await test(T,"goto",{x:tv.x,y:tv.y+16});
  let w=await world();
  ok(w&&w.cur===""&&w.list.length===Object.keys(wps).length&&w.list.every(x=>wps[x.key]),`bản đồ thế giới: ${w?.list.length} trận, không đứng trên trận nào`);
  ok(w&&w.links.some(([a,b])=>[a,b].sort().join()==="nac_dinh_thanh,thanh_hon_thon"),"bản đồ thế giới có nét nối Thánh Hồn Thôn – Nặc Đinh Thành");
  ok(w?.list.find(x=>x.key===nd)?.fee===waypointFee(1)&&w.list.find(x=>x.key===lang)?.fee===waypointFee(0),"phí theo số lần đi cổng từ bản đồ đang ở");
  ok(/đứng trên một truyền tống trận/.test(await go(lang)),"không đứng trên trận: chỉ xem, không dịch chuyển được");
  // Bước lên trận làng: mở khóa.
  T.wpUnlock=[]; await stand(lang);
  ok(await waitFor(()=>T.wpUnlock.includes(lang)||T.world?.list.find(x=>x.key===lang)?.open,1500),"bước lên trận Quảng trường làng: mở khóa (tin wp unlock)");
  w=await world(); ok(w?.cur===lang&&w.list.find(x=>x.key===lang)?.open&&!w.list.find(x=>x.key===nd)?.open,"bản đồ thế giới: đang đứng trên trận làng, trận làng đã mở, Nặc Đinh chưa mở");
  ok(/Chưa mở khóa/.test(await go(nd)),"trận chưa mở: từ chối");
  ok(/chính trận này/.test(await go(lang)),"chọn chính trận đang đứng: từ chối");
  // Mở thêm trận ở Nặc Đinh Thành và Tinh Đấu Ngoại vi.
  await warp("nac_dinh_thanh",wps[nd].x,wps[nd].y);
  ok(await waitFor(()=>T.wpUnlock.includes(nd),2000),"xuất hiện ngay trên trận Nặc Đinh: mở khóa");
  await warp("tinh_dau_ngoai_vi",wps[tc].x,wps[tc].y);
  ok(await waitFor(()=>T.wpUnlock.includes(tc),2000),"trận Trại cổng Ngoại vi: mở khóa");
  await test(T,"clear",{all:true});
  await stand(rt); ok(await waitFor(()=>T.wpUnlock.includes(rt),2000),"trận Rừng thưa (giữa bản đồ săn): mở khóa");
  // Thiếu Hồn Tệ.
  await coin(0); ok(/Không đủ Hồn Tệ/.test(await go(tc)),"không đủ Hồn Tệ: từ chối");
  // Cùng bản đồ: niệm rồi dịch chuyển, trừ phí.
  await coin(100); const fee0=waypointFee(0);
  ok(/Đang niệm truyền tống/.test(await go(tc))&&await waitFor(()=>T.recall?.on,800)&&T.recall.secs===WAYPOINT_CAST,`niệm truyền tống ${WAYPOINT_CAST} giây (thanh niệm)`);
  await sleep(1500); ok(at(wps[rt])&&T.bag.honTe===100,"đang niệm: chưa dịch chuyển, chưa trừ phí");
  ok(await waitFor(()=>at(wps[tc]),3000)&&await waitFor(()=>T.bag.honTe===100-fee0,1500),`niệm xong: tới Trại cổng Ngoại vi, trừ ${formatHonTe(fee0)} (còn ${formatHonTe(T.bag.honTe)})`);
  ok(T.room.state.mapId==="tinh_dau_ngoai_vi"&&T.recall?.on===false,"cùng bản đồ: không đổi phòng, tắt thanh niệm");
  // Đang giao chiến: từ chối.
  await test(T,"hurt",{pct:1}); ok(/Đang giao chiến/.test(await go(rt)),"đang giao chiến (vừa bị đánh): từ chối truyền tống");
  await sleep(TEAM_COMBAT_SECS*1000+300);
  // Bị đánh khi đang niệm: hủy, không mất gì.
  { const h=T.bag.honTe; ok(/Đang niệm/.test(await go(rt)),"hết giao chiến: niệm được");
    await sleep(600); const l=T.logs.length; await test(T,"hurt",{pct:1});
    ok(await waitFor(()=>T.logs.slice(l).some(t=>/Bị tấn công: đã hủy truyền tống/.test(t)),1500)&&T.recall?.on===false,"bị đánh khi đang niệm: hủy truyền tống");
    await sleep(WAYPOINT_CAST*1000); ok(at(wps[tc])&&T.bag.honTe===h,"đã hủy: không dịch chuyển, không trừ phí"); }
  await sleep(TEAM_COMBAT_SECS*1000+300);
  // Di chuyển khi đang niệm: hủy.
  { const h=T.bag.honTe; ok(/Đang niệm/.test(await go(rt)),"niệm lần nữa"); await sleep(500);
    const l=T.logs.length; T.room.send("input",{x:1,y:0}); await sleep(250); T.room.send("input",{x:0,y:0});
    ok(await waitFor(()=>T.logs.slice(l).some(t=>/Di chuyển: đã hủy truyền tống/.test(t)),1500),"di chuyển khi đang niệm: hủy");
    await sleep(WAYPOINT_CAST*1000); ok(!at(wps[rt])&&T.bag.honTe===h,"đã hủy: không tới Rừng thưa, không trừ phí"); }
  // Sang bản đồ khác: transaction đi cổng, phí theo số lần đi cổng, lưu qua đi cổng.
  { await stand(tc); const h=T.bag.honTe, fee=waypointFee(1); T.travel=null;
    ok(/Đang niệm/.test(await go(nd)),`niệm truyền tống tới Nặc Đinh Thành (${formatHonTe(fee)})`);
    ok(await waitFor(()=>T.travel?.mapId==="nac_dinh_thanh",WAYPOINT_CAST*1000+2500),"niệm xong: server cho chuyển bản đồ (travel)");
    await rejoin();
    ok(T.room.state.mapId==="nac_dinh_thanh"&&at(wps[nd]),`tới trận Quảng trường Nặc Đinh (${tme().x},${tme().y})`);
    ok(T.bag.honTe===h-fee,`phí đã trừ và lưu qua đi cổng: ${formatHonTe(h)} → ${formatHonTe(T.bag.honTe)}`); }
  // Hồi Thành Phù: mua ở thương nhân, dùng ở Tinh Đấu Nội địa (bản đồ săn) thì về thành gần nhất (Nặc Đinh Thành).
  { const sp=npcSpot("nac_dinh_thanh","thuong_nhan"); await test(T,"goto",{x:sp.x,y:sp.y+16}); await coin(500);
    const t=await trade(T,"buy",{code:"hoi_thanh_phu",qty:3}); ok(qtyOf(T,"hoi_thanh_phu")===3&&T.bag.honTe===500-3*phuPrice,`mua 3 Hồi Thành Phù (${t})`); }
  const ndi=objsOf("tinh_dau_noi_dia").find(o=>o.type==="spawn");
  await warp("tinh_dau_noi_dia",ndi.x+ndi.width/2,ndi.y+ndi.height-20); await test(T,"clear",{all:true});
  const phuId=()=>T.bag.items.find(i=>i.code==="hoi_thanh_phu")?.id;
  await test(T,"hurt",{pct:1}); { const l=T.logs.length; T.room.send("use",{id:phuId()}); await waitFor(()=>T.logs.length>l,1500); }
  ok(/Đang giao chiến/.test(T.logs.at(-1))&&qtyOf(T,"hoi_thanh_phu")===3,"Hồi Thành Phù khi đang giao chiến: từ chối, không mất phù");
  await sleep(TEAM_COMBAT_SECS*1000+300);
  { const l=T.logs.length; T.recall=null; T.room.send("use",{id:phuId()}); await waitFor(()=>T.recall?.on,1500);
    ok(/Hồi Thành Phù về Nặc Đinh Thành/.test(T.logs.slice(l).join("|")),`dùng Hồi Thành Phù: niệm về thành gần nhất (${T.logs.at(-1)})`);
    await sleep(500); await test(T,"hurt",{pct:1});
    ok(await waitFor(()=>T.recall?.on===false,1500)&&qtyOf(T,"hoi_thanh_phu")===3&&T.room.state.mapId==="tinh_dau_noi_dia","bị đánh khi niệm Hồi Thành Phù: hủy, giữ phù"); }
  await sleep(TEAM_COMBAT_SECS*1000+300);
  { T.travel=null; T.recall=null; T.room.send("use",{id:phuId()}); await waitFor(()=>T.recall?.on,1500);
    ok(await waitFor(()=>T.travel?.mapId==="nac_dinh_thanh",WAYPOINT_CAST*1000+2500),"niệm xong: về Nặc Đinh Thành");
    await rejoin();
    ok(T.room.state.mapId==="nac_dinh_thanh"&&at(wps[nd])&&qtyOf(T,"hoi_thanh_phu")===2,`về trận Quảng trường Nặc Đinh, còn ${qtyOf(T,"hoi_thanh_phu")} phù`); }
  // Thoát vào lại: vẫn nhớ trận đã mở.
  await rejoin(); w=await world();
  ok([lang,nd,tc,rt].every(k=>w?.list.find(x=>x.key===k)?.open)&&w.list.filter(x=>x.open).length===4,`thoát vào lại: còn ${w?.list.filter(x=>x.open).length} trận đã mở`);
  await T.room.leave();
}

/**
 * #111 Thương nhân lưu động ở trại cổng: dữ liệu (mọi bản đồ săn trừ Thánh Hồn Thôn có đúng một chỗ trong trại `spawn`, đứng được,
 * ngoài cổng / truyền tống trận; thành, Lõi Tinh Đấu, sân đấu không có; bảng hàng CAMP_SHOP không rẻ hơn SHOP, không mở rộng túi). Với hook:
 * bot M (tài khoản mới) tới trại Tinh Đấu Ngoại vi, đứng xa thì nói chuyện / mua / bán bị từ chối; lại gần thì mở hộp thoại, mua đan và
 * Hồi Thành Phù đúng giá trại, đan lớn bị từ chối, mở rộng túi bị từ chối, bán hồn hoàn đúng giá trong thành và mua lại được; thoát
 * vào lại thì túi và Hồn Tệ giữ nguyên. Sang trại Cực Bắc (bản đồ khác) vẫn mua được.
 */
export async function campTest(){
  console.log("[#111] Thương nhân lưu động ở trại cổng bản đồ săn");
  const rawOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")); // 11.3 / 11.5: đúng file server đang dùng (MAP_V1)
  const spots={};
  for(const id of Object.keys(MAPS)){
    const raw=rawOf(id), objs=raw.layers.flatMap(l=>l.objects??[]), sp=campMerchantSpot(raw,id); spots[id]=sp;
    const want=MAPS[id].kind==="hunt"&&id!=="thanh_hon_thon";
    if(!want){ ok(!sp,`${MAPS[id].name}: không có thương nhân lưu động`); continue; }
    const s=objs.find(o=>o.type==="spawn"), g=solidGrid(raw);
    const inR=(o,x,y)=>x>=o.x&&x<o.x+o.width&&y>=o.y&&y<o.y+o.height;
    const arr=objs.filter(o=>o.type==="arrive").map(o=>Math.hypot(o.x-sp?.x,o.y-sp?.y)), near=Math.min(...arr);
    ok(sp&&inR(s,sp.x,sp.y)&&!hits(g,sp.x,sp.y,PLAYER_HW,PLAYER_HH)&&!objs.some(o=>(o.type==="portal"||o.type==="waypoint")&&inR(o,sp.x,sp.y))
      &&near<=NPC_RANGE-CAMP_STEP&&!hits(g,sp.x,sp.y+16,PLAYER_HW,PLAYER_HH),
      `${MAPS[id].name}: thương nhân lưu động đứng ở ${s?.name} (${sp?.x},${sp?.y}), đứng được, ngoài cổng / truyền tống trận, cách điểm tới ${near.toFixed(0)} px (≤ ${NPC_RANGE-CAMP_STEP}: lệch vài bước vẫn nói chuyện được)`);
  }
  const def=npcDef(CAMP_MERCHANT), price=c=>CAMP_SHOP.find(r=>r.code===c)?.price, town=c=>SHOP.find(r=>r.code===c)?.price;
  ok(def?.role==="shop"&&shopOf(CAMP_MERCHANT)===CAMP_SHOP&&shopOf("thuong_nhan")===SHOP&&!shopExpands(CAMP_MERCHANT)&&shopExpands("thuong_nhan"),
    "thương nhân lưu động: vai trò shop, bảng hàng riêng, không mở rộng túi");
  ok(CAMP_SHOP.every(r=>town(r.code)&&r.price>=town(r.code))&&!price("dai_hoi_huyet_dan")&&price("hoi_thanh_phu"),
    `bảng hàng trại: ${CAMP_SHOP.map(r=>`${itemDef(r.code).name} ${formatHonTe(r.price)}`).join(", ")} (không rẻ hơn trong thành, không có đan lớn)`);
  const M=await bot("Lữ khách","kim_vu_mieu_ung",{sex:0,hair:1,hairCol:2,outfitCol:3});
  if(!(await test(M,"ping"))?.enabled){ needHookSkip("bỏ qua thương nhân lưu động (cần hook warp, goto, coin, give): bật server bằng GAME_TEST=1"); await M.room.leave(); return; }
  const mme=()=>M.room.state.players?.get(M.room.sessionId);
  await waitFor(()=>mme()&&M.bag,3000);
  async function rejoin(){ await M.room.leave(); await sleep(300); M.mapId=(await post("/api/me",{token:M.token})).mapId; await enter(M); await waitFor(()=>mme()&&M.bag,3000); }
  async function warp(mapId,x,y){
    M.travel=null; M.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>M.travel?.mapId===mapId,4000),`warp -> ${MAPS[mapId].name}`);
    await rejoin();
  }
  const coin=async n=>{ await test(M,"coin",{n}); await waitFor(()=>M.bag?.honTe===n,1500); };
  const map="tinh_dau_ngoai_vi", sp=spots[map];
  if(!sp||!spots.cuc_bac_chi_dia){ ok(false,"thiếu chỗ đứng của thương nhân lưu động: bỏ phần thử với hook"); await M.room.leave(); return; }
  // Đứng xa (trong trại, ngoài NPC_RANGE): từ chối.
  const raw=rawOf(map), g=solidGrid(raw), s0=raw.layers.flatMap(l=>l.objects??[]).find(o=>o.type==="spawn");
  const far=[[0,0],[1,0],[0,1],[1,1]].map(([i,j])=>({x:s0.x+8+i*(s0.width-16),y:s0.y+8+j*(s0.height-16)}))
    .filter(q=>!hits(g,q.x,q.y,PLAYER_HW,PLAYER_HH)).sort((a,b)=>Math.hypot(b.x-sp.x,b.y-sp.y)-Math.hypot(a.x-sp.x,a.y-sp.y))[0];
  if(!far){ ok(false,"trại không có góc đứng được để thử đứng xa"); await M.room.leave(); return; }
  await warp(map,far.x,far.y); await test(M,"clear",{all:true}); await coin(1000);
  ok(Math.hypot(mme().x-sp.x,mme().y-sp.y)>NPC_RANGE&&await talk(M,CAMP_MERCHANT)===null&&/lại gần Thương nhân lưu động/.test(M.logs.at(-1)),
    `đứng cách ${Math.hypot(mme().x-sp.x,mme().y-sp.y).toFixed(0)} px: chưa nói chuyện được`);
  { const bk=bagKey(M); ok(/đứng cạnh thương nhân/.test(await trade(M,"buy",{code:"hoi_huyet_dan",qty:1}))&&bagKey(M)===bk,"đứng xa: mua bị từ chối, túi và Hồn Tệ không đổi"); }
  // Lại gần: mở hộp thoại, mua theo giá trại.
  await test(M,"goto",{x:sp.x,y:sp.y+16});
  ok(await talk(M,CAMP_MERCHANT)===CAMP_MERCHANT,"đứng cạnh thương nhân lưu động: mở hộp thoại");
  const hh=qtyOf(M,"hoi_huyet_dan"); let t=await trade(M,"buy",{code:"hoi_huyet_dan",qty:2,npc:CAMP_MERCHANT});
  ok(qtyOf(M,"hoi_huyet_dan")===hh+2&&M.bag.honTe===1000-2*price("hoi_huyet_dan"),`mua 2 Hồi Huyết Đan giá trại ${formatHonTe(2*price("hoi_huyet_dan"))} (${t})`);
  let ht=M.bag.honTe; t=await trade(M,"buy",{code:"hoi_thanh_phu",qty:1});
  ok(qtyOf(M,"hoi_thanh_phu")===1&&M.bag.honTe===ht-price("hoi_thanh_phu"),`mua Hồi Thành Phù giá trại ${formatHonTe(price("hoi_thanh_phu"))} (${t})`);
  { const bk=bagKey(M); t=await trade(M,"buy",{code:"dai_hoi_huyet_dan",qty:1}); ok(bagKey(M)===bk&&/không bán món này/.test(t),`đan lớn: thương nhân lưu động không bán (${t})`); }
  { const bk=bagKey(M), s=M.bag.slots; t=await trade(M,"expand",{npc:CAMP_MERCHANT}); ok(bagKey(M)===bk&&M.bag.slots===s&&/không mở rộng túi/.test(t),`mở rộng túi ở trại: từ chối (${t})`); }
  // Client gửi mã thương nhân đang mở hộp thoại: thương nhân trong thành không ở đây thì từ chối (không tính giá theo bảng khác).
  { const bk=bagKey(M); t=await trade(M,"buy",{code:"dai_hoi_huyet_dan",qty:1,npc:"thuong_nhan"}); ok(bagKey(M)===bk&&/đứng cạnh thương nhân/.test(t),`mua với mã thương nhân trong thành ở trại: từ chối (${t})`); }
  { const bk=bagKey(M); t=await trade(M,"buy",{code:"hoi_huyet_dan",qty:1,npc:"lao_kiet_khac"}); ok(bagKey(M)===bk&&/đứng cạnh thương nhân/.test(t),`mã NPC không phải thương nhân: từ chối (${t})`); }
  // Trại không phải vùng an toàn: đang giao chiến thì không mua bán.
  await test(M,"hurt",{pct:1});
  { const bk=bagKey(M); t=await trade(M,"buy",{code:"hoi_huyet_dan",qty:1,npc:CAMP_MERCHANT}); ok(bagKey(M)===bk&&/Đang giao chiến/.test(t),`đang giao chiến ở trại: mua bị từ chối (${t})`); }
  await sleep(TEAM_COMBAT_SECS*1000+300);
  await coin(10); { const bk=bagKey(M); t=await trade(M,"buy",{code:"hoi_hon_dan",qty:1}); ok(bagKey(M)===bk&&/Không đủ Hồn Tệ/.test(t),`thiếu Hồn Tệ: từ chối (${t})`); }
  // Bán hồn hoàn dư: giá như thương nhân trong thành (sellPrice); mua lại được ở trại.
  await test(M,"give",{code:RING_ITEM,qty:1,years:1000}); await waitFor(()=>M.bag.items.some(i=>i.code===RING_ITEM&&i.years===1000),1500);
  const ring=M.bag.items.find(i=>i.code===RING_ITEM&&i.years===1000), rp=sellPrice(ring);
  ht=M.bag.honTe; t=await trade(M,"sell",{id:ring.id});
  ok(!M.bag.items.some(i=>i.id===ring.id)&&M.bag.honTe===ht+rp,`bán hồn hoàn 1000 năm: +${formatHonTe(rp)} như trong thành (${t})`);
  ok(M.bag.buyback?.length===1,"thương nhân lưu động giữ món vừa bán để mua lại");
  t=await trade(M,"buyback",{key:M.bag.buyback[0].key});
  ok(M.bag.items.some(i=>i.code===RING_ITEM&&i.years===1000)&&M.bag.honTe===ht,`mua lại hồn hoàn ở trại đúng giá đã bán (${t})`);
  // Vào lại: túi và Hồn Tệ đã lưu.
  const keep=bagKey(M); await sleep(300); await rejoin();
  ok(M.room.state.mapId===map&&bagKey(M)===keep,"thoát vào lại: túi và Hồn Tệ giữ nguyên sau khi mua / bán ở trại");
  // Trại của bản đồ săn khác (Cực Bắc) cũng có.
  const cb=spots.cuc_bac_chi_dia; await warp("cuc_bac_chi_dia",cb.x,cb.y+16); await coin(1000);
  t=await trade(M,"buy",{code:"hoi_hon_dan",qty:1}); ok(M.bag.honTe===1000-price("hoi_hon_dan"),`trại Cực Bắc: mua Hồi Hồn Đan (${t})`);
  await M.room.leave();
}

/**
 * 11.3 / 11.5: bản đồ ×8 dựng bằng tools/maps (`<mapId>.v2.json`, mặc định; bản nào bật đường lùi MAP_V1 thì bỏ qua): diện tích, vùng
 * có tên giữ tên và niên hạn các vùng cũ, mật độ BEAST_DENSITY, giữ đúng cổng / điểm đến / mã truyền tống trận của bản cũ, tinh anh và
 * hang trong vùng; rồi đi trên từng bản: hồn thú đúng loài / niên hạn và không sát cổng, đi mọi cổng hai chiều xuất hiện đúng điểm
 * `arrive`, mở khóa mọi truyền tống trận. Cuối cùng (hook locfile): vị trí lưu ở file Tiled khác file đang dùng (hoặc dòng trước 11.5
 * khi bản đồ đã có bản ×8) thì vào ở trại cổng, cùng file thì giữ chỗ.
 */
export async function bigMapTest(){
  const BIG=Object.keys(MAPS).filter(m=>mapFileOf(m)!==m);
  console.log(`[11.3 / 11.5] Bản đồ ×8 dựng bằng tools/maps: ${BIG.map(m=>MAPS[m].name).join(", ")||"không có"}`);
  if(!BIG.length){ console.log("  ⚠ bỏ qua bản đồ ×8: đang bật MAP_V1 cho mọi bản đồ"); return; }
  const objsOf=m=>m.layers.flatMap(l=>l.objects??[]), pr=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  const fileOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")), oldOf=m=>JSON.parse(readFileSync(new URL(`../../../shared/assets/${m}.json`,import.meta.url),"utf8"));
  const inR=(o,x,y)=>x>=o.x&&x<=o.x+o.width&&y>=o.y&&y<=o.y+o.height, sum=a=>a.reduce((s,z)=>s+pr(z,"count"),0);
  const gateKey=o=>[o.type,o.name,pr(o,"to")??"",pr(o,"arrive")??"",pr(o,"level")??"",pr(o,"boat")??""].join("|");
  for(const NV of BIG){
    const raw=fileOf(NV), old=oldOf(NV), objs=objsOf(raw), oldObjs=objsOf(old), k=raw.width*raw.height/(old.width*old.height), nm=MAPS[NV].name;
    // Lõi Tinh Đấu, Đại Đấu Hồn Trường giữ cỡ hợp lối chơi (chỉ làm đẹp, 11.5); bản đồ săn và thành trấn ×8.
    if(["boss","arena"].includes(MAPS[NV].kind)) ok(raw.width===old.width&&raw.height===old.height,`${nm}: giữ cỡ ${raw.width}×${raw.height} ô như bản cũ`);
    else ok(k>=7.5&&k<=8.5,`${nm}: diện tích ×${k.toFixed(2)}: ${raw.width}×${raw.height} ô (bản cũ ${old.width}×${old.height})`);
    const zs=objs.filter(o=>o.type==="zone"), zn=zonesByName(objs), oldZn=zonesByName(oldObjs), [ylo,yhi]=MAPS[NV].years??[0,0]; // thành trấn: không vùng hồn thú
    const total=sum(zs), oldTotal=sum(oldObjs.filter(o=>o.type==="zone")), tiersOf=m=>new Set([...m.values()].map(z=>z.years)).size;
    ok(zs.every(z=>{ const y=parseLevelRange(pr(z,"years")); return y&&y[0]>=ylo&&y[1]<=yhi; })&&[...oldZn.values()].every(o=>zn.get(o.name)?.years===o.years)
      &&zn.size>=oldZn.size&&tiersOf(zn)===tiersOf(oldZn),
      `${nm}: ${zn.size} vùng có tên (${[...zn.keys()].join(", ")}) trong ${zs.length} mảnh, giữ tên và niên hạn ${oldZn.size} vùng cũ, niên hạn trong ${ylo}–${yhi} năm`);
    ok(total>=6*oldTotal&&total<=11*oldTotal,`${nm}: ${total} hồn thú thường theo BEAST_DENSITY (bản cũ ${oldTotal}, ×${(total/oldTotal).toFixed(1)})`);
    const lair=objs.find(o=>o.type==="boss"), es=objs.filter(o=>o.type==="elite"), oldEs=oldObjs.filter(o=>o.type==="elite");
    ok(same(es.map(e=>pr(e,"boss")).sort(),oldEs.map(e=>pr(e,"boss")).sort())&&es.every(e=>zs.some(z=>inR(z,e.x+e.width/2,e.y+e.height/2)))
      &&(!MAPS[NV].king||pr(lair,"boss")===MAPS[NV].king&&zs.some(z=>inR(z,lair.x+lair.width/2,lair.y+lair.height/2))),
      `${nm}: ${es.length} tinh anh như bản cũ${lair?` và hang ${lair.name}`:""} nằm trong vùng`);
    const wp=objs.filter(o=>o.type==="waypoint").map(o=>o.name), oldWp=oldObjs.filter(o=>o.type==="waypoint").map(o=>o.name);
    ok(oldWp.every(n=>wp.includes(n))&&(MAPS[NV].kind==="arena"?!wp.length:wp.length>=1&&wp.length<=3),`${nm}: truyền tống trận ${wp.join(", ")} (giữ mã cũ ${oldWp.join(", ")}, mã lưu DB không đổi)`);
    const gates=objs.filter(o=>o.type==="portal"||o.type==="arrive").map(gateKey).sort(), oldGates=oldObjs.filter(o=>o.type==="portal"||o.type==="arrive").map(gateKey).sort();
    ok(same(gates,oldGates),`${nm}: giữ đúng cổng và điểm đến của bản cũ (${objs.filter(o=>o.type==="portal").map(o=>o.name).join(", ")})`);
    // Điểm giữa hồ (`lake`, #118): Du Thủy của boss thế giới lặn ra đây; bản ×8 phải giữ, nằm trên nền nước.
    { const ol=oldObjs.find(o=>o.type==="lake"), lk=objs.find(o=>o.type==="lake"), gd=raw.layers.find(l=>l.name==="ground")?.data, wet=new Set([9,34,35]);
      if(ol) ok(lk&&wet.has(gd?.[Math.floor(lk.y/16)*raw.width+Math.floor(lk.x/16)]),`${nm}: giữ điểm giữa hồ "${ol.name}" (${lk?`${lk.x/16}, ${lk.y/16}, nền gid ${gd?.[Math.floor(lk.y/16)*raw.width+Math.floor(lk.x/16)]}`:"thiếu"})`); }
  }
  const B=await bot("Rừng lớn","kim_vu_mieu_ung",{sex:0,hair:2,hairCol:1,outfitCol:3});
  if(!(await test(B,"ping"))?.enabled){ needHookSkip("bỏ qua phần đi trên bản đồ ×8 (cần hook warp, goto): bật server bằng GAME_TEST=1"); await B.room.leave(); return; }
  const bme=()=>B.room.state.players?.get(B.room.sessionId);
  async function rejoin(){ await B.room.leave(); await sleep(300); B.mapId=(await post("/api/me",{token:B.token})).mapId; await enter(B); await waitFor(()=>bme()&&B.bag,3000); }
  async function warp(mapId,x,y){ B.travel=null; B.room.send("test",{op:"warp",mapId,x,y}); await waitFor(()=>B.travel?.mapId===mapId,4000); await rejoin(); }
  /** Đứng giữa cổng `name` của bản đồ đang ở rồi đi cổng; phải tới `to` ở đúng điểm `arrive` của file Tiled bản đồ đích. */
  async function hop(objsHere,name,to){
    const p=objsHere.find(o=>o.type==="portal"&&o.name===name), ar=objsOf(fileOf(to)).find(o=>o.type==="arrive"&&o.name===pr(p,"arrive"));
    await test(B,"goto",{x:p.x+p.width/2,y:p.y+p.height/2}); await sleep(200);
    B.travel=null; B.room.send("travel",{portal:name});
    const went=await waitFor(()=>B.travel?.mapId===to,(pr(p,"boat")?BOAT_CAST:TRAVEL_CAST)*1000+3000); if(went) await rejoin();
    ok(went&&B.room.state.mapId===to&&Math.hypot(bme().x-ar.x,bme().y-ar.y)<1,`cổng "${name}" -> ${MAPS[to].name}, xuất hiện ở ${ar?.name} (${bme()?.x},${bme()?.y})`);
  }
  for(const NV of BIG){
    if(MAPS[NV].kind==="arena") continue; // sân đấu chỉ ArenaRoom mở (bài arenaTest), không cổng / điểm đến
    const objs=objsOf(fileOf(NV)), nm=MAPS[NV].name, total=sum(objs.filter(o=>o.type==="zone")), a0=objs.find(o=>o.type==="arrive");
    await warp(NV,a0.x,a0.y);
    ok(B.room.state.mapId===NV&&B.room.state.mapFile===mapFileOf(NV),`${nm}: phòng báo file bản đồ ${B.room.state.mapFile} (client tải đúng file này)`);
    if(total) ok(await waitFor(()=>[...B.room.state.beasts.values()].filter(x=>!x.rank).length>=total*0.9,8000),`${nm}: đã sinh ${[...B.room.state.beasts.values()].filter(x=>!x.rank).length}/${total} hồn thú thường`);
    if(total) checkGateClear(B,checkBeastYears(B)); // thành trấn: không hồn thú
    // Mọi cổng hai chiều: sang bản đồ kề rồi về bằng cổng của bản đó trỏ về đây.
    for(const p of objs.filter(o=>o.type==="portal")){
      const to=pr(p,"to"), there=objsOf(fileOf(to)), back=there.find(o=>o.type==="portal"&&pr(o,"to")===NV);
      await hop(objs,p.name,to); if(back) await hop(there,back.name,NV);
    }
    // Truyền tống trận: bước lên thì mở khóa.
    for(const w of objs.filter(o=>o.type==="waypoint")){
      const key=`${NV}:${w.name}`; B.wpHere=null; await test(B,"goto",{x:w.x+w.width/2,y:w.y+w.height/2});
      ok(await waitFor(()=>B.wpUnlock.includes(key),2000),`${nm}: truyền tống trận ${pr(w,"label")} mở khóa khi bước lên`);
    }
  }
  // 11.5: vị trí đã lưu chỉ có nghĩa trên đúng file Tiled lúc ghi (accounts.map_file). Hook locfile giả vị trí lưu ở phiên bản khác
  // (bản cũ khi ×8 là mặc định, hoặc bản ×8 khi bật MAP_V1) hoặc dòng trước 11.5 (NULL = bản cũ): vào lại thì ở trại cổng `spawn`.
  { const NV=BIG.includes("cuc_bac_chi_dia")?"cuc_bac_chi_dia":BIG[0], raw=fileOf(NV), objs=objsOf(raw), g=solidGrid(raw), nm=MAPS[NV].name;
    const sp=objs.filter(o=>o.type==="spawn").at(-1), os=objsOf(oldOf(NV)).filter(o=>o.type==="spawn").at(-1), cur=mapFileOf(NV), other=cur===NV?`${NV}.v2`:NV;
    // Chỗ đứng ngoài trại: tâm trại của bản cũ (trường hợp review: trại Cực Bắc cũ nằm giữa Băng Phong Cốc của bản ×8), không được thì trận / điểm tới.
    const P=[{x:os.x+os.width/2,y:os.y+os.height/2},...objs.filter(o=>o.type==="waypoint").map(o=>({x:o.x+o.width/2,y:o.y+o.height/2})),...objs.filter(o=>o.type==="arrive")]
      .map(q=>({x:Math.round(q.x),y:Math.round(q.y)})).find(q=>!hits(g,q.x,q.y,PLAYER_HW,PLAYER_HH)&&!inR(sp,q.x,q.y));
    const at=q=>Math.hypot(bme().x-q.x,bme().y-q.y)<1, inCamp=()=>inR(sp,bme().x,bme().y);
    await warp(NV,P.x,P.y);
    ok(B.room.state.mapId===NV&&at(P),`${nm}: tới (${P.x},${P.y}) ngoài trại cổng`);
    await rejoin(); ok(B.room.state.mapId===NV&&at(P),`${nm}: vị trí lưu cùng file ${cur} thì vào lại đúng chỗ (${bme()?.x},${bme()?.y})`);
    await test(B,"locfile",{file:other}); await rejoin();
    ok(B.room.state.mapId===NV&&inCamp(),`${nm}: vị trí lưu ở file ${other} (phiên bản khác) thì vào ở trại cổng (${bme()?.x.toFixed(0)},${bme()?.y.toFixed(0)})`);
    await test(B,"goto",{x:P.x,y:P.y}); await test(B,"locfile",{file:""}); await rejoin();
    ok(B.room.state.mapId===NV&&(cur===NV?at(P):inCamp()),`${nm}: vị trí lưu trước 11.5 (map_file NULL = bản cũ) ${cur===NV?"giữ nguyên":"vào ở trại cổng"} (${bme()?.x.toFixed(0)},${bme()?.y.toFixed(0)})`);
    // Bản đồ chưa có bản ×8: dòng trước 11.5 vẫn giữ vị trí (không đưa mọi người về trại). Bỏ bản đồ có `exit` (Lõi Tinh Đấu: đăng
    // xuất thì về bờ hồ Nội địa, BĐ6e); không còn bản đồ nào như vậy thì bỏ qua, phần lưu trữ đã có ở test:accounts.
    const V1M=Object.keys(MAPS).find(m=>MAPS[m].kind!=="arena"&&!MAPS[m].exit&&mapFileOf(m)===m&&m!==NV);
    if(V1M){ const a=objsOf(fileOf(V1M)).find(o=>o.type==="arrive"); await warp(V1M,a.x,a.y); await test(B,"locfile",{file:""}); await rejoin();
      ok(B.room.state.mapId===V1M&&at(a),`${MAPS[V1M].name} (chưa có bản ×8): vị trí lưu trước 11.5 giữ nguyên (${bme()?.x},${bme()?.y})`); }
  }
  await B.room.leave();
}

export async function fogTest(){
  console.log("[#435] Sương mù khám phá");
  const A=await bot("Fog A","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3}), B=await bot("Fog B","kim_vu_mieu_ung",{sex:1,hair:0,hairCol:1,outfitCol:1});
  if(!(await test(A,"ping"))?.enabled){ needHookSkip("bỏ qua sương mù (cần hook goto, warp, gmadmin): bật server bằng GAME_TEST=1"); await A.room.leave(); await B.room.leave(); return; }
  const me=b=>b.room.state.players?.get(b.room.sessionId), M1="tinh_dau_ngoai_vi", M2="tinh_dau_noi_dia";
  const dimsOf=id=>{ const m=loadMap(id); return fogDims(m.MW,m.MH); };
  const askFog=async b=>{ await sleep(300); b.fogBits=null; b.room.send("fog"); await waitFor(()=>b.fogBits,3000); return b.fogBits; };
  const warpTo=async(b,mapId)=>{ b.travel=null; await test(b,"warp",{mapId,x:0,y:0}); ok(await waitFor(()=>b.travel?.mapId===mapId,4000),`warp -> ${mapId}`);
    await b.room.leave(); await sleep(300); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>me(b)&&b.bag,4000); };
  const rejoin=async b=>{ await b.room.leave(); await sleep(500); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>me(b)&&b.bag,4000); };
  // Chỗ đứng được xa chỗ vào ít nhất ~45 ô (ngoài tầm nhìn FOG.sight), quét theo vòng quanh chỗ đứng hiện tại.
  const farSpot=(mapId,from)=>{ const m=loadMap(mapId), cx=from.x/TILE, cy=from.y/TILE, d=dimsOf(mapId);
    for(const r of [60,50,70,45,80]) for(let a=0;a<48;a++){ const x=cx+Math.cos(a/48*Math.PI*2)*r, y=cy+Math.sin(a/48*Math.PI*2)*r;
      if(x>2&&y>2&&x<m.MW-2&&y<m.MH-2&&m.standable(x*TILE,y*TILE)&&fogCellOf(d,x,y)>=0) return {px:x*TILE,py:y*TILE,tx:x,ty:y}; }
    return null; };
  const cellAt=(mapId,tx,ty)=>fogCellOf(dimsOf(mapId),tx,ty);
  await waitFor(()=>me(A)&&A.bag&&me(B)&&B.bag,4000);
  // 1. Bản đồ mở sẵn (Thánh Hồn Thôn): không có sương mù, server không gửi bitset.
  ok(FOG.open.includes(A.mapId),`tài khoản mới ở bản đồ mở sẵn (${A.mapId})`);
  A.room.send("fog"); await sleep(1500);
  ok(A.fogMsgs===0&&A.fogd.length===0,"bản đồ mở sẵn: không gửi tin fog / fogd");
  // 2. Vào bản đồ săn: ô quanh chỗ đứng đã mở, phần còn lại chưa.
  await warpTo(A,M1); await askFog(A);
  const d1=dimsOf(M1), spawnCell=cellAt(M1,me(A).x/TILE,me(A).y/TILE);
  ok(A.fogBits&&fogValid(A.fogBits,d1),`vào ${M1}: bitset đúng cỡ (${A.fogBits?.length} byte, lưới ${d1.cw}×${d1.ch})`);
  const c0=fogCount(A.fogBits);
  ok(c0>0&&c0<d1.cells/4&&fogGet(A.fogBits,spawnCell),`ô quanh chỗ vào được mở (${c0}/${d1.cells}), ô đang đứng có mở`);
  // 3. Đi tới chỗ mới: ô đó được đánh dấu; tin fogd có số ô đó, mỗi tin không quá FOG.maxAdd ô.
  const far=farSpot(M1,me(A)); ok(!!far,"có chỗ đứng được cách xa chỗ vào");
  const cell=cellAt(M1,far.tx,far.ty); ok(!fogGet(A.fogBits,cell),"chỗ xa chưa được mở trước khi tới");
  A.fogd=[]; await test(A,"goto",{x:far.px,y:far.py});
  ok(await waitFor(()=>A.fogd.some(m=>m.add?.includes(cell)),8000),`tới ô mới ${cell}: tin fogd báo mở ô đó`);
  ok(A.fogd.every(m=>Array.isArray(m.add)&&m.add.length>0&&m.add.length<=FOG.maxAdd&&m.add.every(i=>Number.isInteger(i)&&i>=0&&i<d1.cells)),`fogd: số ô hợp lệ, mỗi tin ≤ ${FOG.maxAdd} ô (${A.fogd.length} tin)`);
  await askFog(A); const c1=fogCount(A.fogBits);
  ok(fogGet(A.fogBits,cell)&&fogGet(A.fogBits,spawnCell)&&c1>c0,`bitset đầy đủ: có ô mới và ô cũ (${c0} -> ${c1})`);
  // 4. Tin lạ từ client không đổi gì (server tự quyết ô nào đã khám phá).
  const before=Uint8Array.from(A.fogBits);
  A.room.send("fog",{bits:new Array(d1.bytes).fill(255)}); A.room.send("fog",{bits:"x".repeat(3000),add:[1,2,3]}); A.room.send("fog",null); A.room.send("fog",{add:[0,1,2,3,4,5],bits:{a:1}});
  await sleep(500); await askFog(A);
  ok(A.leftCode===null&&before.length===A.fogBits.length&&before.every((v,i)=>v===A.fogBits[i]),"tin fog lạ từ client (bitset giả, số ô, kiểu sai) bị bỏ: bitset không đổi, vẫn kết nối");
  // 5. Thoát vào lại: còn nguyên (ghi lúc rời phòng), kể cả ô đã tới.
  await rejoin(A); await askFog(A);
  ok(A.mapId===M1&&A.fogBits&&fogValid(A.fogBits,d1)&&fogGet(A.fogBits,cell)&&fogGet(A.fogBits,spawnCell)&&fogCount(A.fogBits)>=c1,`thoát vào lại: bitset còn nguyên (${A.fogBits?fogCount(A.fogBits):0} ô, có ô đã tới)`);
  // 6. Tài khoản khác ở cùng bản đồ không thấy phần của A.
  await warpTo(B,M1); await askFog(B);
  ok(B.fogBits&&fogValid(B.fogBits,d1)&&!fogGet(B.fogBits,cell)&&fogCount(B.fogBits)<c1,`tài khoản khác: không thấy ô của A (B có ${B.fogBits?fogCount(B.fogBits):0} ô, A ${c1})`);
  // 7. Mỗi bản đồ một bitset: sang bản đồ khác chỉ có phần quanh chỗ vào; quay lại vẫn đủ.
  await warpTo(A,M2); await askFog(A); const d2=dimsOf(M2);
  ok(A.fogBits&&fogValid(A.fogBits,d2)&&fogCount(A.fogBits)>0&&fogCount(A.fogBits)<d2.cells/4,`đổi bản đồ ${M2}: bitset riêng đúng cỡ (${A.fogBits?fogCount(A.fogBits):0}/${d2.cells} ô)`);
  await warpTo(A,M1); await askFog(A);
  ok(A.fogBits&&fogValid(A.fogBits,d1)&&fogGet(A.fogBits,cell),"quay lại bản đồ cũ: ô đã khám phá vẫn còn");
  // 8. Lệnh GM (admin): fog open mở cả bản đồ và được lưu; fog reset xoá; tài khoản thường bị từ chối.
  const gm=async(b,cmd)=>{ const l=b.logs.length; b.room.send("gm",{cmd}); await waitFor(()=>b.logs.length>l,2000); await sleep(150); return b.logs.slice(l).join(" | "); };
  ok(/Không có quyền/.test(await gm(B,"fog open")),"tài khoản thường: lệnh GM fog bị từ chối");
  await askFog(B); ok(fogCount(B.fogBits)<d1.cells/2,"tài khoản thường: bản đồ vẫn chưa mở");
  await test(A,"gmadmin",{on:true});
  A.fogBits=null; let t=await gm(A,"fog open"); await waitFor(()=>A.fogBits&&fogCount(A.fogBits)===d1.cells,3000);
  ok(A.fogBits&&fogCount(A.fogBits)===d1.cells&&fogValid(A.fogBits,d1),`GM fog open: mở cả bản đồ (${t})`);
  await rejoin(A); await askFog(A); ok(A.fogBits&&fogCount(A.fogBits)===d1.cells,"GM fog open: còn nguyên sau khi vào lại (đã lưu)");
  A.fogBits=null; t=await gm(A,"fog reset"); await waitFor(()=>A.fogBits&&fogCount(A.fogBits)<d1.cells/4,3000);
  ok(A.fogBits&&fogCount(A.fogBits)>0&&fogCount(A.fogBits)<d1.cells/4,`GM fog reset: về gần trống, chỉ mở quanh chỗ đứng (${A.fogBits?fogCount(A.fogBits):0} ô; ${t})`);
  ok(/open|reset/i.test(await gm(A,"fog xyz")),"GM fog xyz: báo lỗi cú pháp");
  await warpTo(A,"thanh_hon_thon"); A.room.send("fog"); await sleep(800);
  ok(/mở sẵn/.test(await gm(A,"fog open")),"GM fog ở bản đồ mở sẵn: báo không có sương mù");
  await test(A,"gmadmin",{on:false});
  await A.room.leave(); await B.room.leave();
}

/**
 * Sương mù khám phá (R8 #435, BOT_ONLY=fog): bản đồ mở sẵn không có sương; vào bản đồ săn thì server mở ô quanh chỗ đứng (tin `fog` cả bitset, `fogd` phần mới);
 * đi tới chỗ mới thì ô đó được đánh dấu, thoát vào lại vẫn còn (cần `--pg` để thử PostgreSQL), mỗi bản đồ một bitset riêng, tài khoản khác không thấy,
 * tin lạ từ client không làm đổi gì, lệnh GM `fog open|reset` (admin) mở cả bản đồ / xoá, tài khoản thường bị từ chối.
 */
/**
 * Dấu "Tập trung ở đây" của tổ đội (R6 #433, BOT_ONLY=rally): người ngoài tổ đội không đặt được và không nhận; thành viên (kể cả ở bản đồ khác)
 * nhận tin `rally` kèm chat hệ thống; ô không hợp lệ bị bỏ; spam bị chặn theo RALLY.burst; rời tổ đội thì thôi nhận; hết hạn theo RALLY.secs.
 */
export async function rallyTest(){
  console.log("[R6 #433] Dấu Tập trung ở đây của tổ đội");
  const A=await bot("Tập A","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3}), B=await bot("Tập B","kim_vu_mieu_ung",{sex:1,hair:0,hairCol:1,outfitCol:1}),
    E=await bot("Tập E","bich_lan_xa_hoang",{sex:0,hair:2,hairCol:3,outfitCol:2}), C=await bot("Tập C","yeu_ho",{sex:1,hair:3,hairCol:1,outfitCol:4});
  if(!(await test(A,"ping"))?.enabled){ needHookSkip("bỏ qua dấu tập trung (cần hook test): bật server bằng GAME_TEST=1"); for(const b of [A,B,E,C]) await b.room.leave(); return; }
  const me=b=>b.room.state.players?.get(b.room.sessionId), map=loadMap(A.mapId), M2="tinh_dau_ngoai_vi";
  await waitFor(()=>[A,B,E,C].every(b=>me(b)&&b.bag&&b.party),4000);
  const rl=async b=>{ await test(b,"rally",{rop:"rlreset"}); };
  const logsOf=(b,n)=>b.logs.slice(n).join(" | "), sysChat=(b,n)=>b.chats.slice(n).filter(c=>c.name==="Hệ thống"&&c.ch==="party"&&/Tập trung ở đây/.test(c.text));
  // Hai ô quanh A: một ô đi được (cách A vài ô), một ô vật cản.
  const ax=Math.floor(me(A).x/TILE), ay=Math.floor(me(A).y/TILE); let good=null, wall=null;
  for(let r=2;r<30&&!(good&&wall);r++) for(let dx=-r;dx<=r;dx++) for(const dy of [-r,r]){ const x=ax+dx, y=ay+dy; if(x<1||y<1||x>=map.MW-1||y>=map.MH-1) continue;
    if(!good&&map.standable((x+0.5)*TILE,(y+0.5)*TILE)) good={x,y}; if(!wall&&!map.standable((x+0.5)*TILE,(y+0.5)*TILE)) wall={x,y}; }
  ok(!!good,"có ô đi được gần chỗ đứng");
  // 1. Chưa vào tổ đội: không đặt được, chỉ nhận lời nhắc.
  await rl(A); let n=A.logs.length; A.room.send("rally",{tx:good.x+0.3,ty:good.y+0.7}); await sleep(600);
  ok(/trong tổ đội/.test(logsOf(A,n))&&!A.rallies.length&&!B.rallies.length,`chưa có tổ đội: không đặt được (${logsOf(A,n)})`);
  // 2. Lập tổ đội A (trưởng) + B + E; E sang bản đồ khác.
  for(const m of [B,E]){ A.room.send("party",{op:"invite",name:m.name}); await sleep(300); m.room.send("party",{op:"accept",name:A.name}); await waitFor(()=>m.party?.id>0,2000); }
  ok(A.party?.id>0&&B.party?.id===A.party.id&&E.party?.id===A.party.id,"A, B, E cùng một tổ đội");
  E.travel=null; await test(E,"warp",{mapId:M2,x:0,y:0}); ok(await waitFor(()=>E.travel?.mapId===M2,4000),`E sang ${M2}`);
  await E.room.leave(); await sleep(300); E.mapId=(await post("/api/me",{token:E.token})).mapId; await enter(E); await waitFor(()=>me(E)&&E.bag,4000);
  // 3. A đặt dấu: A, B, E nhận (E ở bản đồ khác); C (ngoài tổ đội) không nhận gì.
  const nb=[A,B,E,C].map(b=>b.chats.length); await rl(A); A.room.send("rally",{tx:good.x+0.3,ty:good.y+0.7});
  ok(await waitFor(()=>A.rallies.length&&B.rallies.length&&E.rallies.length,3000),"A, B, E đều nhận tin rally");
  const m=B.rallies[0];
  ok(m.from===A.name&&m.map===A.mapId&&m.tx===good.x+0.5&&m.ty===good.y+0.5&&m.secs===RALLY.secs&&Number.isInteger(m.ch),`tin rally đúng: người đặt, bản đồ ${m.map}, ô về tâm (${m.tx}, ${m.ty}), ${m.secs}s`);
  ok(E.rallies[0].map===A.mapId&&E.rallies[0].map!==M2,"E ở bản đồ khác vẫn nhận, dấu ghi bản đồ của người đặt");
  await sleep(500);
  ok(sysChat(B,nb[1]).length===1&&sysChat(E,nb[2]).length===1&&sysChat(E,nb[2])[0].text.includes(RALLY_MAPS[A.mapId].name),"chat hệ thống tổ đội: B 1 dòng, E 1 dòng kèm tên bản đồ");
  ok(!C.rallies.length&&!sysChat(C,nb[3]).length,"người ngoài tổ đội không nhận tin rally, không có dòng chat");
  ok(Object.keys(m).sort().join()==="ch,from,map,secs,tx,ty","tin rally chỉ có người đặt (tên), bản đồ, kênh, ô đích, số giây: không lộ id tài khoản, phiên hay vị trí người đặt");
  // 4. Ô không hợp lệ: vật cản, ngoài bản đồ, kiểu lạ: bị bỏ, không tốn lượt, không rơi kết nối.
  const before=B.rallies.length; await rl(A); n=A.logs.length;
  for(const v of [{tx:wall.x+0.5,ty:wall.y+0.5},{tx:-3,ty:4},{tx:map.MW+5,ty:4},{tx:NaN,ty:1},{tx:"3",ty:"4"},{tx:null,ty:{}},{},null,"x",[1,2]]) A.room.send("rally",v);
  await sleep(800);
  ok(B.rallies.length===before&&A.leftCode===null&&/không đi được/.test(logsOf(A,n)),`ô lạ / vật cản / ngoài bản đồ bị bỏ, vẫn kết nối (${logsOf(A,n).slice(0,60)})`);
  A.room.send("rally",{tx:good.x+0.5,ty:good.y+0.5}); ok(await waitFor(()=>B.rallies.length===before+1,2000),"ô lạ không tốn lượt: dấu hợp lệ ngay sau đó vẫn gửi được");
  // 5. Spam: gửi dồn 12 lần, người nhận chỉ nhận tối đa burst (+1 nếu hồi kịp), người gửi nhận lời nhắc "quá nhanh".
  await rl(A); const b0=B.rallies.length; n=A.logs.length;
  for(let i=0;i<12;i++) A.room.send("rally",{tx:good.x+0.5,ty:good.y+0.5});
  await sleep(1200); const got=B.rallies.length-b0;
  ok(got>=RALLY.burst&&got<=RALLY.burst+1&&/quá nhanh/.test(logsOf(A,n)),`spam 12 lần: B nhận ${got} (burst ${RALLY.burst}), A bị nhắc "quá nhanh"`);
  await sleep(Math.ceil(RALLY.refillMs*1.2)); A.room.send("rally",{tx:good.x+0.5,ty:good.y+0.5});
  ok(await waitFor(()=>B.rallies.length===b0+got+1,2000),"chờ hồi một lượt thì đặt lại được");
  // 6. Hết hạn: client giữ mỗi người một dấu và bỏ khi hết RALLY.secs (cùng hàm thuần shared/rally.ts).
  let list=[]; const t0=1e6; list=rallyUpsert(list,B.rallies.at(-1),t0); list=rallyUpsert(list,B.rallies.at(-1),t0+1000);
  ok(list.length===1&&rallyPrune(list,t0+1000+RALLY.secs*1000-1,null).length===1&&rallyPrune(list,t0+1000+RALLY.secs*1000,null).length===0,`mỗi người một dấu; hết hạn đúng sau ${RALLY.secs}s`);
  // 7. B rời tổ đội: không nhận dấu mới nữa, không đặt được; A vẫn đặt được và E vẫn nhận.
  await rl(A); B.room.send("party",{op:"leave"}); await waitFor(()=>B.party?.id===0,2000); const bb=B.rallies.length, eb=E.rallies.length; n=B.logs.length;
  A.room.send("rally",{tx:good.x+0.5,ty:good.y+0.5}); ok(await waitFor(()=>E.rallies.length>eb,2000),"B đã rời: E vẫn nhận dấu mới của A"); await sleep(500);
  ok(B.rallies.length===bb,"B đã rời tổ đội: không nhận dấu mới"); B.room.send("rally",{tx:good.x+0.5,ty:good.y+0.5}); await sleep(600);
  ok(/trong tổ đội/.test(logsOf(B,n))&&B.rallies.length===bb,"B đã rời: không đặt được dấu");
  for(const b of [A,B,E,C]) await b.room.leave().catch(()=>{});
}
