// Nhóm bot auto (#703 bước 4): tự săn online phía server (Auto 1, mục 5.13). Tách nguyên văn từ bot-test.mjs.
import { solidGrid, hits, PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { findPath, clearLine, pathLength } from "../../../shared/path.ts";
import { pack } from "@colyseus/msgpackr";
import { readFileSync } from "node:fs";
import { post, sleep, waitFor, ok, mapUrl, bot, enter, qtyOf, bonesOf, npcSpot, trade, looseOf, sendTeam, same, test, step, needHookSkip } from "./lib.mjs";
import { AUTO_HZ, TIERS, TEAM_SIZE, RESPAWN_SECS, TIEN_CO_MAX, itemDef, formatHonTe, BEAST_AGGRO_R, BEAST_WANDER, MAPS, MAX_YEARS, RING_ITEM, BONE_ITEM, CORE_ITEM, MAX_CORE_STARS, ITEMS, SHOP, sellPrice, SWITCH_CD, SYNC_VIEW, CAMP_SHOP, AUTO_AOE_MIN, AUTO_CLUSTER, AUTO_REST, AUTO_LOOT_WAIT, AUTO_BOSS_DETOUR, AUTO_DAILY_SECS, AUTO_RADIUS, AUTO_MAX_PER_CELL, AUTO_DEFAULTS, AUTO_MOVE, AUTO_PACE, AUTO_STATUS, AUTO_PARTY, AUTO_STUCK, AUTO_HINT, autoHint, parseAuto, autoLeft, autoTimeText, AUTO_RADIUS_MIN, AUTO_LOOT_KINDS, AUTO_TOKEN, AUTO_TOKEN_SECS, AUTO_TOKEN_PRICE, AUTO_BONUS_MAX, OFFLINE, offlineFight, BEAST_ROOTED, TILE } from "../../../shared/data.ts";

/**
 * 9.8 thương nhân (bot riêng E, tài khoản mới nên túi khởi đầu BAG_SLOTS ô): hàm thuần (đan lớn, giá mở rộng túi, bagSlotsOf); với
 * hook: mở rộng túi (đứng xa / thiếu Hồn Tệ bị từ chối, BAG_SLOTS → +BAG_EXPAND ô nhận thêm đúng chừng ấy ô, vào lại vẫn giữ, giá lần
 * sau, tới BAG_MAX_SLOTS thì hết; #215 trang, sắp xếp, đồng bộ theo thay đổi ở bagPageTest), đan lớn (mua 120 đồng, hồi đúng 60% sinh lực / hồn lực, chung hồi chiêu đan, thương nhân không mua lại), mua lại (hồn cốt cường
 * hóa về đúng chỉ số và cấp, Hồn Tệ trả đúng; thiếu tiền / túi đầy / mã lạ / đứng xa bị từ chối; chỉ giữ BUYBACK_MAX món; mảnh bán
 * một phần mua lại gộp ô; đi cổng sang Thiên Đấu Thành vẫn còn và mua lại được ở thương nhân Thiên Đấu; rời game thì mất).
 */
/**
 * 11.4: hai bot bật lọc đồng bộ ở hai đầu Tinh Đấu Ngoại vi (trận Trại cổng / Trạm gác). State chỉ có hồn sư, hồn thú, đồ rơi trong
 * SYNC_VIEW.r (tinh anh luôn có), `online` đếm cả phòng; lại gần thì thấy nhau; tin fx của người ở xa không gửi; tin mini lọc hồn sư theo RADAR.far (người lạ ở xa không có, đồng đội tổ đội có; R5 #432), có
 * đồ rơi ở xa; hồn thú cách mọi hồn sư quá SYNC_VIEW.wake ngủ (đứng yên) rồi thức khi có người lại gần; hook view tắt / bật lọc.
 */
/**
 * Tự săn online phía server (Auto 1, mục 5.13; BOT_ONLY=auto chỉ chạy phần này): không bật được trong vùng an toàn, vào vùng an toàn
 * thì dừng; trên Tinh Đấu Ngoại vi (bản ×8 mặc định, bản cũ khi MAP_V1) tự đi tới, đánh thường, tung hồn kỹ, hạ hồn thú và nhặt hồn hoàn; tự đi /
 * tự đánh thì tắt (tay ưu tiên); không đánh hồn thú người khác đang giao chiến; uống đan khi ít máu; đổi tay tung tiên cơ rồi về;
 * dừng khi bị PvP (hook), khi cả đội gục, khi hết giờ trong ngày (sang ngày mới bật lại được), khi túi đầy; giới hạn người treo mỗi
 * ô lưới; cài đặt và giờ treo lưu qua lần vào lại.
 * Auto 2: cài đặt mở rộng (bán kính, thứ tự ô đội tiên cơ, sao hồn hạch, loại vật phẩm), tổng kết khi dừng, Ủy Thác Lệnh (mua ở
 * thương nhân, cộng quỹ giờ treo, chỉ tiêu sau giờ miễn phí, trần AUTO_BONUS_MAX, lưu qua lần vào lại).
 */
export async function autoTest(){
  console.log("[Auto 1] Tự săn online phía server");
  ok(AUTO_DAILY_SECS===12*3600&&autoLeft(0)===AUTO_DAILY_SECS&&autoLeft(AUTO_DAILY_SECS+5)===0&&autoTimeText(AUTO_DAILY_SECS)==="12 giờ",`giới hạn ${autoTimeText(AUTO_DAILY_SECS)} treo mỗi ngày (AUTO_DAILY_SECS)`);
  const pa=parseAuto({years:[900,10],hp:5,mp:-1,skills:[3,3,9,0,"1",1.5],ring:-5,bone:"x"});
  ok(same(pa.years,[10,900])&&pa.hp===0.95&&pa.mp===0&&same(pa.skills,[3,0])&&pa.ring===-1&&pa.bone===AUTO_DEFAULTS.bone&&same(parseAuto(null),AUTO_DEFAULTS),
    `parseAuto kẹp cài đặt: ${JSON.stringify(pa)}`);
  const pb=parseAuto({radius:99,slots:[3,3,0,7,-1],coreStar:9,kinds:["tien_thao","dan","x"]}), pc=parseAuto({radius:1,coreStar:0,item:false});
  ok(pb.radius===AUTO_RADIUS/16&&pc.radius===AUTO_RADIUS_MIN/16&&same(pb.slots,[3,0])&&pb.coreStar===MAX_CORE_STARS&&pc.coreStar===1&&same(pb.kinds,["tien_thao"])
    &&same(pc.kinds,[])&&same(parseAuto({}).kinds,AUTO_LOOT_KINDS)&&AUTO_DEFAULTS.radius===AUTO_RADIUS/16,
    `Auto 2: kẹp bán kính ${AUTO_RADIUS_MIN/16}–${AUTO_RADIUS/16} ô, thứ tự ô đội, sao hồn hạch, loại vật phẩm; bản lưu cũ item:false thì không nhặt loại nào`);
  ok(AUTO_DEFAULTS.scope==="map"&&parseAuto({}).scope==="map"&&parseAuto({scope:"near"}).scope==="near"&&parseAuto({scope:"x"}).scope==="map",
    `#213: phạm vi mặc định "Toàn bản đồ", chọn được "Chỉ quanh chỗ đứng" (near), bản lưu cũ / sai thì toàn bản đồ`);
  // Các phần Auto 1 / Auto 2 bên dưới thử vùng neo: chạy với phạm vi "Chỉ quanh chỗ đứng"; phần #213 thử toàn bản đồ riêng.
  const NEAR={...AUTO_DEFAULTS,scope:"near"};
  const A=await bot("Treo máy","u_minh_linh_mieu",{sex:0,hair:1,hairCol:2,outfitCol:1});
  if(!(await test(A,"ping"))?.enabled){ needHookSkip("bỏ qua tự săn (cần hook warp, goto, spawn, auto): bật server bằng GAME_TEST=1"); await A.room.leave(); return; }
  const extra=[];
  try{
  const NV="tinh_dau_ngoai_vi", me=b=>b.room.state.players?.get(b.room.sessionId);
  const objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  /** Gửi `auto {op}` rồi chờ tin riêng `auto` trả về (bật / tắt / từ chối / trạng thái). */
  const autoOp=async(b,op,more={})=>{ b.autoMsg=null; b.room.send("auto",{op,...more}); await waitFor(()=>b.autoMsg,1500); return b.autoMsg; };
  /** Tự săn đã dừng với lý do khớp `re` (tin `auto` và cờ `auto` trong state). */
  const stopped=(b,re,ms=5000)=>waitFor(()=>b.autoMsg&&!b.autoMsg.on&&re.test(b.autoMsg.why??"")&&!me(b)?.auto,ms);
  async function rejoin(b){ await b.room.leave(); await sleep(300); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>me(b)&&b.bag&&b.owned,3000); }
  async function warp(b,mapId,x,y){ b.travel=null; b.room.send("test",{op:"warp",mapId,x,y}); await waitFor(()=>b.travel?.mapId===mapId,4000); await rejoin(b); }
  await waitFor(()=>me(A)&&A.bag&&A.owned,3000);
  ok((await autoOp(A,"get"))?.on===false&&A.autoMsg.left===AUTO_DAILY_SECS&&same(A.autoMsg.cfg,AUTO_DEFAULTS),`tài khoản mới: chưa tự săn, còn ${autoTimeText(A.autoMsg?.left??0)}, cài đặt mặc định`);

  // ---- Thánh Hồn Thôn: trong làng (vùng an toàn) không bật được; bật ngoài làng rồi đi vào làng thì dừng ----
  const sv=objsOf("thanh_hon_thon").find(o=>o.type==="safe"), tv=npcSpot("thanh_hon_thon","to_van_dao");
  await test(A,"goto",{x:tv.x,y:tv.y+16});
  let m=await autoOp(A,"on");
  ok(m&&!m.on&&/vùng an toàn/.test(m.why??"")&&!me(A).auto,`trong làng: từ chối (${m?.why})`);
  let out=false;
  for(const [dx,dy] of [[40,0],[60,0],[40,24],[40,-24],[80,0],[60,48],[60,-48]]){
    const x=sv.x+sv.width+dx, y=Math.max(sv.y+8,Math.min(sv.y+sv.height-8,tv.y))+dy; await test(A,"goto",{x,y});
    if(Math.hypot(me(A).x-x,me(A).y-y)<1){ out=true; break; }
  }
  m=await autoOp(A,"on");
  ok(out&&m?.on&&await waitFor(()=>me(A).auto,1000),`ra ngoài làng (${me(A).x.toFixed(0)},${me(A).y.toFixed(0)}): bật được, state có cờ auto (chữ "Tự động" trên đầu)`);
  await test(A,"goto",{x:tv.x,y:tv.y+16});
  ok(await stopped(A,/vùng an toàn/),`vào làng: dừng (${A.autoMsg?.why})`);

  // ---- Tinh Đấu Ngoại vi: hạ hồn thú, hồn kỹ, nhặt ----
  const ar=objsOf(NV).find(o=>o.type==="arrive"&&o.name==="tu_nac_dinh_thanh");
  await warp(A,NV,ar.x,ar.y);
  ok(A.room.state.mapId===NV,`tới ${MAPS[NV].name} (${A.room.state.mapFile||NV})`);
  // Điểm neo cách trại cổng quá bán kính tự săn (đi dạo vào trại thì võ hồn gục hồi ngay, cả đội không gục được), chỗ đứng được gần nhất.
  const camp=objsOf(NV).find(o=>o.type==="spawn"), M=AUTO_RADIUS+48, inCamp=(x,y)=>x>=camp.x-M&&x<=camp.x+camp.width+M&&y>=camp.y-M&&y<=camp.y+camp.height+M;
  for(let r=48;r<=960&&inCamp(me(A).x,me(A).y);r+=32) for(const [ux,uy] of [[1,0],[0,1],[0,-1],[-1,0],[0.7,0.7],[0.7,-0.7]]){
    const x=Math.round(ar.x+ux*r), y=Math.round(ar.y+uy*r); if(inCamp(x,y)) continue;
    await test(A,"goto",{x,y}); if(Math.hypot(me(A).x-x,me(A).y-y)<1) break;
  }
  const home={x:me(A).x,y:me(A).y}, act=A.owned.active;
  ok(!inCamp(home.x,home.y),`điểm neo ngoài trại cổng (${home.x},${home.y})`);
  await test(A,"set",{rowId:act,level:21,rings:[423,812]}); // 2 hồn hoàn: hồn kỹ vòng 1–2 mở
  await test(A,"clear");
  let r0=qtyOf(A,RING_ITEM), k0=me(A).kills;
  let sp=await test(A,"spawn",{tier:0,dx:56,dy:0,years:150,hpx:8}); const b1=sp?.bid;
  await autoOp(A,"set",{cfg:NEAR});
  A.fxs=[]; A.autost=[]; m=await autoOp(A,"on"); const on0=Date.now();
  ok(m?.on&&m.left<=AUTO_DAILY_SECS,`bật tự săn ở bãi săn (điểm neo ${home.x.toFixed(0)},${home.y.toFixed(0)})`);
  ok(b1&&await waitFor(()=>!A.room.state.beasts.has(b1),25000),`tự đi tới và hạ hồn thú ${b1}`);
  ok(me(A).kills>k0,`tính là người chơi hạ (${k0} → ${me(A).kills} hồn thú)`);
  ok(A.fxs.some(f=>f.k==="slash"&&f.id===A.room.sessionId)&&A.fxs.some(f=>f.k==="soulring"&&f.id===A.room.sessionId),"đánh thường và tung hồn kỹ qua đúng lệnh của người chơi (fx slash, soulring)");
  ok(await waitFor(()=>qtyOf(A,RING_ITEM)>r0,8000),`tự nhặt hồn hoàn vào túi (${r0} → ${qtyOf(A,RING_ITEM)})`);
  ok(me(A).auto&&Math.hypot(me(A).x-home.x,me(A).y-home.y)<=AUTO_RADIUS+2*16,`vẫn tự săn, đứng trong vùng neo (${Math.hypot(me(A).x-home.x,me(A).y-home.y).toFixed(0)} pixel)`);

  // AH2 (#609): tin riêng `autost` có mã việc hợp lệ, gọn và không dày (tối đa ~1 tin mỗi giây), đã thấy việc "đánh"; không gửi khi không tự săn.
  const JOBS=["loot","fight","go","dodge","back","rest","spawn","patrol"], st=A.autost, secs0=(Date.now()-on0)/1000;
  ok(st.length>=1&&st.every(s=>JOBS.includes(s.k)&&(s.path===undefined||s.path.length%2===0&&s.path.length<=2*AUTO_STATUS.path+2)&&JSON.stringify(s).length<400),`tin autost hợp lệ, gọn (${st.length} tin: ${[...new Set(st.map(s=>s.k))].join(", ")})`);
  ok(st.some(s=>s.k==="fight"&&s.n)&&st.length<=secs0/AUTO_STATUS.every+3,`autost không dày: ${st.length} tin trong ${secs0.toFixed(0)} giây, có việc "đánh <tên>"`);

  // ---- Tay ưu tiên ----
  A.room.send("input",{x:1,y:0});
  ok(await stopped(A,/tự di chuyển/),`tự bấm đi: tắt (${A.autoMsg?.why})`);
  // Auto 2: tin `auto` lúc dừng có tổng kết lượt vừa rồi (thời gian, hồn thú đã hạ, kinh nghiệm, Hồn Tệ, đồ nhặt).
  const sum=A.autoMsg?.sum;
  ok(sum&&sum.secs>0&&sum.kills>=1&&sum.xp>0&&sum.coins>0&&sum.loot.some(([n,q])=>/^Hồn hoàn/.test(n)&&q>=1)&&A.autoMsg.left>0,
    `tổng kết khi dừng: ${JSON.stringify(sum)}, còn ${autoTimeText(A.autoMsg?.left??0)}`);
  ok(!sum?.rate||sum.rate.length===3&&sum.rate.every(v=>v>=0),`tổng kết có thống kê theo giờ đúng dạng (${JSON.stringify(sum?.rate)})`);
  const nSt=A.autost.length; await sleep(1500);
  ok(A.autost.length===nSt,"đã dừng: không còn tin autost");
  A.room.send("input",{x:0,y:0}); await sleep(100);
  m=await autoOp(A,"on"); A.room.send("attack");
  ok(m?.on&&await stopped(A,/tự ra đòn/),`tự bấm đánh: tắt (${A.autoMsg?.why})`);
  m=await autoOp(A,"on"); const off=await autoOp(A,"off");
  ok(m?.on&&!off?.on&&/đã tắt/.test(off?.why??""),"bấm lại nút / phím T: tắt");

  // ---- #291: đường thẳng tới mục tiêu thông thì đi thẳng (không tìm đường A*), có ô chặn ở giữa thì theo đường A* ----
  // Hồn thú đứng yên (BEAST_ROOTED) để đường thẳng không đổi vì nó lang thang; chỗ thử chọn theo lưới ô chặn của file Tiled đang dùng.
  // Không tung hồn kỹ / tiên cơ (đòn tầm xa trúng từ chỗ đứng): chỉ đánh thường nên phải đi tới sát mới đánh trúng.
  {
    const g=solidGrid(JSON.parse(readFileSync(mapUrl(NV),"utf8"))), free=(x,y)=>!hits(g,x,y,PLAYER_HW+1,PLAYER_HH+1);
    const safes=objsOf(NV).filter(o=>o.type==="safe"), inSafe=(x,y)=>safes.some(o=>x>=o.x-48&&x<=o.x+o.width+48&&y>=o.y-48&&y<=o.y+o.height+48);
    const okAt=(x,y)=>free(x,y)&&!inCamp(x,y)&&!inSafe(x,y);
    /** Cặp (chỗ đứng, chỗ hồn thú) gần điểm neo: `wall` thì đường thẳng vướng ô chặn mà A* tới được, không thì đường thẳng thông. */
    const pick=wall=>{
      const tx0=Math.floor(home.x/16), ty0=Math.floor(home.y/16), cand=[];
      for(let dy=-40;dy<=40;dy++) for(let dx=-40;dx<=40;dx++) cand.push([dx,dy]);
      cand.sort((a,b)=>Math.hypot(...a)-Math.hypot(...b));
      for(const [dx,dy] of cand){
        const P={x:(tx0+dx)*16+8,y:(ty0+dy)*16+8}; if(!okAt(P.x,P.y)) continue;
        for(const d of [80,96,112]) for(const [ux,uy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const Q={x:P.x+ux*d,y:P.y+uy*d}; if(!okAt(Q.x,Q.y)) continue;
          if(!wall){ if(clearLine(g,P,Q)) return {P,Q}; continue; }
          if(clearLine(g,P,Q)) continue;
          const path=findPath(g,P,Q,AUTO_MOVE.path), end=path.at(-1);
          if(end&&Math.hypot(end.x-Q.x,end.y-Q.y)<4&&pathLength(P,path)<=3*d) return {P,Q};
        }
      }
      return null;
    };
    /** Bật tự săn đứng ở P với hồn thú đứng yên ở Q; theo dõi hook `auto` tới khi đánh trúng nó. */
    const run=async({P,Q})=>{
      await test(A,"goto",P); await test(A,"clear");
      if(Math.hypot(me(A).x-P.x,me(A).y-P.y)>=1) return null;
      const bid=(await test(A,"spawn",{species:"thuc_nhan_hoa",tier:0,dx:Q.x-P.x,dy:Q.y-P.y,years:15,hpx:200}))?.bid, bb=()=>A.room.state.beasts.get(bid);
      // #1421: chọn mục tiêu theo chi phí (đường đi + giây hạ ước lượng, chia hệ số cụm), nên cụm hồn thú tự nhiên ở xa hơn 160 pixel (ngoài vùng dọn
      // của `clear`) có thể thắng con thử và A đi tới đó trước: ways = ["path"] dù đường thẳng tới con thử thông. Dọn cả bản đồ, chỉ giữ con thử.
      await test(A,"clear",{all:true,keep:true,but:bid});
      const ways=new Set(), tgs=[]; let st=null;
      if(!bid||!(await autoOp(A,"on"))?.on) return null;
      const t00=Date.now(); let hit=false, ms=0; // waitFor chỉ nhận hàm đồng bộ: hỏi hook `auto` mỗi nhịp để ghi cách đi của từng lúc
      for(const t0=Date.now();Date.now()-t0<12000&&!hit;await sleep(100)){ st=await test(A,"auto"); if(st?.way) ways.add(st.way); if(st?.target&&st.target!==tgs.at(-1)) tgs.push(st.target); hit=!!bb()&&bb().hp<bb().maxHp; if(hit) ms=Date.now()-t00; }
      st=await test(A,"auto"); await autoOp(A,"off"); await test(A,"clear");
      return {hit,ms,ways:[...ways],target:st?.target===bid,plans:st?.plans,lines:st?.lines,start:P,beast:Q,bid,tgs};
    };
    const L=pick(false), W=pick(true);
    await autoOp(A,"set",{cfg:{...NEAR,skills:[],tienCo:false}});
    if(!L||!W) console.log(`  ⚠ bỏ qua #291 đi thẳng / A*: không tìm được chỗ thử quanh điểm neo (thông ${!!L}, vướng ${!!W})`);
    else{
      const a=await run(L);
      ok(a?.hit&&a.target&&a.plans===0&&a.lines>=1&&a.ways.includes("line")&&!a.ways.includes("path"),
        `#291: đường thẳng thông: đi thẳng tới hồn thú, không tìm đường A* (${JSON.stringify(a)})`);
      const w=await run(W);
      ok(w?.hit&&w.target&&w.plans>=1&&w.lines>=1&&w.ways.includes("path"),
        `#291: có ô chặn ở giữa: đi theo đường A* vòng qua rồi đánh trúng (${JSON.stringify(w)})`);
    }
    await autoOp(A,"set",{cfg:NEAR});
  }

  // ---- Không cướp quái: B đang đánh X, A treo cạnh không đánh X mà đánh Y ----
  const B=await bot("Treo cạnh","nguyet_nhan",{sex:1,hair:2,hairCol:0,outfitCol:4}); extra.push(B);
  await warp(B,NV,ar.x,ar.y);
  if(B.room.roomId!==A.room.roomId) console.log("  ⚠ bỏ qua phần không cướp quái: hai bot khác kênh");
  else{
    // B đứng cạnh A, quanh điểm neo +70 pixel: hook goto bỏ qua chỗ không đứng được (bản ×8 có ô chặn lẻ ngay đó), nên tìm chỗ đứng được
    // gần nhất theo lưới ô chặn, không thì B ở lại điểm vào trại cổng cách xa và bài không còn thử "treo cạnh" (#305).
    const gNV=solidGrid(JSON.parse(readFileSync(mapUrl(NV),"utf8")));
    await test(A,"goto",home);
    let bAt=null;
    for(const [dx,dy] of [[70,0],[70,-8],[70,8],[64,0],[76,0],[64,-8],[64,8],[76,-8],[76,8],[58,0],[82,0],[70,-16],[70,16]]){
      const x=home.x+dx, y=home.y+dy; if(hits(gNV,x,y,PLAYER_HW,PLAYER_HH)||inCamp(x,y)) continue;
      await test(B,"goto",{x,y}); if(Math.hypot(me(B).x-x,me(B).y-y)<1){ bAt={x,y}; break; }
    }
    if(!bAt) console.log(`  ⚠ B không tới được chỗ cạnh điểm neo, vẫn ở ${me(B).x.toFixed(0)},${me(B).y.toFixed(0)}`);
    await test(A,"clear"); await test(B,"clear");
    await test(B,"set",{rowId:B.owned.active,level:60}); // B trụ được suốt bài (X đánh B; B gục thì X thôi giao chiến với B)
    sp=await test(B,"spawn",{tier:0,dx:16,dy:0,years:150,hpx:60}); const X=sp?.bid, xb=()=>A.room.state.beasts.get(X);
    for(let k=0;k<6&&X&&xb()&&xb().hp>=xb().maxHp;k++){ await step(B,1,0); B.room.send("attack"); await sleep(250); }
    const hx=xb()?.hp;
    ok(X&&hx<xb()?.maxHp,`B đánh hồn thú X (${hx}/${xb()?.maxHp})`);
    // Bài thử đòn thường / hồn kỹ không cướp quái, không phải tiên cơ: tiên cơ riêng lướt tới hồn thú gần nhất (X cách 13 pixel) và cào thẳng X nếu
    // A còn năng lượng từ các bài trước (#979: CI nhóm 4 trượt lặp, log "lướt tới hồn thú gần nhất"). Tắt đổi tay tiên cơ và xả năng lượng cả đội.
    await autoOp(A,"set",{cfg:{...NEAR,tienCo:false}}); await test(A,"energy",{v:0});
    m=await autoOp(A,"on");
    const took=await waitFor(()=>!xb()||xb().hp<hx,3500);
    const info=await test(A,"auto",{bid:X});
    if(info?.target===X) console.log(`  (X: nhắm ${info.beast?.target}, đánh gần nhất ${info.beast?.hitBy}, ${info.beast?.calm?.toFixed(1)} giây trước; A ${A.room.sessionId}, B ${B.room.sessionId})`);
    ok(m?.on&&!took&&info?.on&&info.target!==X&&xb()?.hp>=hx,`A treo cạnh (${Math.hypot(xb().x-me(A).x,xb().y-me(A).y).toFixed(0)} pixel) không đánh X đang giao chiến với B (mục tiêu ${info?.target})`);
    // Bãi 300 năm trở lên: hồn thú hoang hung hăng hồi sinh liên tục, đánh A thì tự săn đánh trả trước rồi mới tới Y. Dọn quanh A trong
    // lúc chờ (giữ X, Y), như các bài tự săn khác; vẫn chờ 15 giây.
    await test(A,"clear",{but:[X]});
    // Y sinh xa cả B lẫn X (hơn tầm aggro BEAST_AGGRO_R), vẫn trong vùng neo: tự săn dắt A đi dạo khắp quanh đó nên A có thể đang đứng sát B,
    // Y sinh trong tầm B thì nhắm B (người gần nhất), tự săn không cướp quái người khác nên A không đánh Y (#305: CI trượt, Y cạnh B, nhắm B,
    // 15 giây không ai đánh). Đánh A–Y xa X để đòn của A không trúng lan sang X.
    const yCand=[...Array(24).keys()].flatMap(k=>[100,80].map(r=>{ const a=k*Math.PI/12, dx=Math.round(Math.cos(a)*r), dy=Math.round(Math.sin(a)*r), x=me(A).x+dx, y=me(A).y+dy;
      return {dx,dy,away:Math.min(Math.hypot(x-me(B).x,y-me(B).y),Math.hypot(x-xb().x,y-xb().y)),solid:hits(gNV,x,y,PLAYER_HW,PLAYER_HH),far:Math.hypot(x-home.x,y-home.y)>AUTO_RADIUS-8}; }));
    const yAt=yCand.filter(c=>!c.solid&&!c.far).sort((u,v)=>v.away-u.away)[0];
    // Không có chỗ nào xa hơn tầm aggro: báo ✗ rõ (không lùi về chỗ sinh cũ vốn gây lỗi), vẫn sinh Y để các kiểm tra sau chạy tiếp.
    ok(yAt&&yAt.away>BEAST_AGGRO_R+40,`chỗ sinh Y xa B và X hơn tầm aggro ${BEAST_AGGRO_R} (xa nhất ${yAt?.away.toFixed(0)} pixel; ${yCand.length} chỗ: ${yCand.filter(c=>c.solid).length} ô chặn, ${yCand.filter(c=>c.far).length} ngoài vùng neo; A ${me(A).x.toFixed(0)},${me(A).y.toFixed(0)}, B ${me(B).x.toFixed(0)},${me(B).y.toFixed(0)}, X ${xb()?.x.toFixed(0)},${xb()?.y.toFixed(0)})`);
    const ySite=`chỗ sinh Y ${yAt?`dx,dy ${yAt.dx},${yAt.dy}, cách B / X ${yAt.away.toFixed(0)} pixel`:"đường lùi dx,dy -50,0 (không có chỗ hợp lệ)"}`;
    // Nợ nhịp (AUTO_PACE): A vừa hạ một hồn thú hoang đánh trả trong lúc chờ X thì còn nợ vài giây tới hơn chục giây, tự săn đứng nghỉ, không
    // nhắm Y, không dạo (#305 lần 3: CI A đứng yên 15 giây, mục tiêu / đích rỗng, Y đầy máu cách 115 pixel). Bài này thử luật không cướp quái,
    // không phải trần tốc độ (bài riêng bên dưới), nên xóa nợ trước và trong lúc chờ.
    await test(A,"auto",{pace:0});
    sp=await test(A,"spawn",{tier:0,dx:yAt?.dx??-50,dy:yAt?.dy??0,years:150}); const Y=sp?.bid;
    let downY=false; const yTrack=[];
    for(const t0=Date.now();Y&&!downY&&Date.now()-t0<15000;){
      downY=await waitFor(()=>!A.room.state.beasts.has(Y),500);
      if(!downY){ const yb=A.room.state.beasts.get(Y), st=await test(A,"auto",{bid:Y,pace:0}); yTrack.push(`${((Date.now()-t0)/1000).toFixed(1)}s Y ${yb?.x.toFixed(0)},${yb?.y.toFixed(0)} nhắm ${st?.beast?.target} A ${me(A).x.toFixed(0)},${me(A).y.toFixed(0)} ${st?.on?"bật":"TẮT"} mục tiêu ${st?.target} nợ ${st?.pace?.toFixed?.(1)}`); await test(A,"clear",{but:[X,Y]}); }
    }
    // Chẩn đoán khi trượt (#305): chỗ A / B / X / Y, sinh lực Y, mục tiêu / đích / đường của tự săn, Y nhắm ai / bị bỏ qua.
    const whyY=downY&&xb()?.hp>=hx?"":await (async()=>{ const st=await test(A,"auto",{bid:Y}), yb=A.room.state.beasts.get(Y), at=o=>o?`${o.x.toFixed(0)},${o.y.toFixed(0)}`:"-";
      return ` [${ySite}; A(${A.room.sessionId}) ${at(me(A))}, B(${B.room.sessionId}) ${at(me(B))}, X ${at(xb())}, Y ${yb?`${at(yb)} ${yb.hp}/${yb.maxHp}`:"đã mất"}; tự săn ${st?.on?"bật":"TẮT"} (${A.autoMsg?.why??"-"}), mục tiêu ${st?.target}, nợ nhịp ${st?.pace?.toFixed?.(1)} (ước lượng ${st?.est?.toFixed?.(1)}), đích ${JSON.stringify(st?.goal)}, đường ${st?.path}, Y ${JSON.stringify(st?.beast)}; vết Y ${yTrack.join(" | ")}; log ${A.logs.slice(-3).join(" | ")}]`; })();
    ok(Y&&downY&&xb()?.hp>=hx,`A hạ hồn thú Y không ai giành, X không mất sinh lực (${hx} → ${xb()?.hp})${whyY}`);
    await autoOp(A,"off"); await autoOp(A,"set",{cfg:NEAR}); await test(B,"slay",{bid:X});
    // Các bài sau không dùng B tới bài nợ nhịp: về điểm vào trại cổng (hồn thú hoang không lang thang tới), không kéo hồn thú hoang tới A.
    await test(B,"goto",ar);
  }

  // ---- Đan và tiên cơ trong lúc đánh ----
  await test(A,"goto",home); await test(A,"clear");
  sp=await test(A,"spawn",{tier:0,dx:40,dy:0,years:150,hpx:80}); const Z=sp?.bid;
  m=await autoOp(A,"on");
  ok(m?.on&&await waitFor(()=>(A.room.state.beasts.get(Z)?.hp??0)<(A.room.state.beasts.get(Z)?.maxHp??0),8000),"tự săn đánh hồn thú Z (nhiều sinh lực)");
  const pot0=qtyOf(A,"hoi_huyet_dan");
  await test(A,"hurt",{pct:70});
  // Túi (tin riêng) có thể về trước bản vá state mang sinh lực mới: chờ cả hai.
  ok(await waitFor(()=>qtyOf(A,"hoi_huyet_dan")<pot0&&me(A).hp>me(A).maxHp*0.3,4000),`sinh lực dưới ${AUTO_DEFAULTS.hp*100}%: tự uống Hồi Huyết Đan (${pot0} → ${qtyOf(A,"hoi_huyet_dan")})`);
  const act0=A.owned.active; A.fx=[];
  await test(A,"energy",{v:TIEN_CO_MAX});
  ok(await waitFor(()=>A.owned.active!==act0&&A.fx.some(f=>f.id===A.room.sessionId),4000),`đầy năng lượng tiên cơ: tự đổi tay sang võ hồn khác và tung tiên cơ (${A.fx[0]?.name??""})`);
  ok(await waitFor(()=>A.owned.active===act0,(SWITCH_CD+3)*1000),`hết hồi chiêu đổi (${SWITCH_CD} giây): về võ hồn chính`);
  ok(me(A).auto,"vẫn tự săn");

  // ---- Bị người chơi tấn công (hook: phòng bản đồ không có PvP thật) ----
  await test(A,"auto",{pvp:true});
  ok(await stopped(A,/người chơi tấn công/),`bị PvP: dừng (${A.autoMsg?.why})`);
  await test(A,"slay",{bid:Z});

  // ---- Cả đội gục ----
  m=await autoOp(A,"on");
  const l0=A.logs.length;
  for(let k=0;k<TEAM_SIZE&&!me(A).dead&&A.autoMsg?.on;k++) await test(A,"down");
  const wiped=m?.on&&await stopped(A,/gục/);
  ok(wiped,`cả đội gục: dừng (${A.autoMsg?.why})`);
  if(!wiped) console.log(`  (bật: ${JSON.stringify(m)}; log: ${A.logs.slice(l0).join(" | ")})`);
  await waitFor(()=>!me(A).dead,(RESPAWN_SECS+2)*1000);

  // ---- Auto 2: bán kính vùng neo theo cài đặt; thứ tự ô đội rỗng thì không đổi tay tiên cơ ----
  await test(A,"goto",home); await test(A,"clear");
  await autoOp(A,"set",{cfg:{...NEAR,radius:AUTO_RADIUS_MIN/16,slots:[]}});
  sp=await test(A,"spawn",{tier:0,dx:180,dy:0,years:15}); const far=sp?.bid; // 10 năm không hung hăng; lang thang tối đa 60 pixel
  m=await autoOp(A,"on"); await sleep(2500);
  let info=await test(A,"auto");
  ok(m?.on&&far&&A.room.state.beasts.has(far)&&info?.target!==far,`bán kính ${AUTO_RADIUS_MIN/16} ô: không nhắm hồn thú cách điểm neo 180 pixel (mục tiêu ${info?.target})`);
  const act1=A.owned.active; await test(A,"energy",{v:TIEN_CO_MAX});
  // Hook spawn đặt theo chỗ người chơi (đã đi dạo trong vùng neo): tính lại để hồn thú cách ĐIỂM NEO 36 pixel, trong bán kính 80 pixel.
  sp=await test(A,"spawn",{tier:0,dx:Math.round(home.x+36-me(A).x),dy:Math.round(home.y-me(A).y),years:15,hpx:20}); const near=sp?.bid;
  const hitN=near&&await waitFor(()=>(A.room.state.beasts.get(near)?.hp??0)<(A.room.state.beasts.get(near)?.maxHp??1),8000);
  // Chẩn đoán khi trượt: chỗ A / hồn thú, mục tiêu, đích, đường đi của tự săn, hồn thú đó nhắm ai / bị bỏ qua.
  const whyN=hitN?"":await (async()=>{ const st=await test(A,"auto",{bid:near}), b=A.room.state.beasts.get(near);
    return ` [A ${me(A).x.toFixed(0)},${me(A).y.toFixed(0)} chết ${me(A).dead}; ${near} ${b?`${b.x.toFixed(0)},${b.y.toFixed(0)} ${b.hp}/${b.maxHp}`:"đã mất"}; mục tiêu ${st?.target}, đích ${JSON.stringify(st?.goal)}, đường ${st?.path}, ${JSON.stringify(st?.beast)}; log ${A.logs.slice(-3).join(" | ")}]`; })();
  ok(hitN,`hồn thú trong bán kính: tự đi tới đánh${whyN}`);
  await sleep(1500);
  ok(A.owned.active===act1,"thứ tự ô đội rỗng: đầy năng lượng tiên cơ cũng không đổi tay");
  await autoOp(A,"off"); await test(A,"slay",{bid:near}); await test(A,"slay",{bid:far}); await test(A,"energy",{v:0});
  await autoOp(A,"set",{cfg:NEAR});

  // ---- Nhịp tin auto (F2 báo cáo soát): gửi dồn 20 `set`, cấu hình cuối vẫn được áp (không bị bỏ) ----
  {
    const R0=AUTO_RADIUS_MIN/16, last=Math.min(R0+3,AUTO_RADIUS/16);
    await test(A,"auto",{rate:true}); A.autoMsg=null;
    for(let i=0;i<20;i++) A.room.send("auto",{op:"set",cfg:{...NEAR,radius:i<19?R0:last}});
    await waitFor(()=>A.autoMsg?.cfg?.radius===last,4000);
    ok(A.autoMsg?.cfg?.radius===last,`gửi dồn 20 tin set: cấu hình cuối (bán kính ${last}) được áp, không bị nhịp bỏ mất`);
    A.autoMsg=null; A.room.send("auto",{op:"on"}); await sleep(400);
    ok(!me(A)?.auto&&A.autoMsg?.on===false,"nhịp thật: tin on ngay sau lượt dồn bị chặn (chỉ nhận lại trạng thái)");
    await test(A,"auto",{rate:false}); await autoOp(A,"set",{cfg:NEAR}); ok(same(A.autoMsg?.cfg,parseAuto(NEAR)),"đặt lại cấu hình gốc sau lượt gửi dồn");
  }

  // ---- #213: toàn bản đồ. Quanh điểm neo không có hồn thú hợp niên hạn (10–200 năm: Ngoại vi tự sinh 300 năm trở lên) thì tự đi xa,
  // ngoài khung A* thường (AUTO_MOVE.path), theo đường dài có điểm trung gian, hạ con ở đó rồi vẫn tự săn. "Chỉ quanh chỗ đứng" thì không đi.
  {
    const box=AUTO_MOVE.path.maxTiles*16, minD=box+6*16, safes=objsOf(NV).filter(o=>o.type==="safe"), M2=48;
    const bad=(x,y)=>inCamp(x,y)||safes.some(o=>x>=o.x-M2&&x<=o.x+o.width+M2&&y>=o.y-M2&&y<=o.y+o.height+M2);
    let F=null;
    for(let r=minD;r<=minD+20*16&&!F;r+=48) for(const [ux,uy] of [[1,0],[0,1],[-1,0],[0,-1],[0.7,0.7],[0.7,-0.7],[-0.7,0.7],[-0.7,-0.7]]){
      const x=Math.round(home.x+ux*r), y=Math.round(home.y+uy*r); if(bad(x,y)) continue;
      await test(A,"goto",{x,y}); if(Math.hypot(me(A).x-x,me(A).y-y)<1){ F={x,y}; break; }
    }
    if(!F) console.log("  ⚠ bỏ qua tự săn toàn bản đồ: không tìm được chỗ đứng xa điểm neo");
    else{
      await test(A,"clear");
      // Loài cắm rễ (BEAST_ROOTED): không lang thang về phía điểm neo, nên lúc hạ A luôn ở xa điểm neo hơn khung A* (#325).
      sp=await test(A,"spawn",{tier:0,dx:0,dy:0,years:15,hpx:3,species:BEAST_ROOTED.ids[0]}); const fb=sp?.bid;
      await test(A,"goto",home); await test(A,"clear");
      await autoOp(A,"set",{cfg:{...NEAR,years:[10,200],slots:[]}});
      m=await autoOp(A,"on"); await sleep(2500);
      info=await test(A,"auto",{bid:fb});
      ok(m?.on&&fb&&info?.beast&&info.target!==fb&&Math.hypot(me(A).x-home.x,me(A).y-home.y)<=AUTO_RADIUS+32,
        `"Chỉ quanh chỗ đứng": không đi tới hồn thú cách ${Math.round(Math.hypot(F.x-home.x,F.y-home.y)/16)} ô (mục tiêu ${info?.target})`);
      await autoOp(A,"off"); await test(A,"goto",home);
      // Đường 30 ô đi qua bãi hồn thú 600 năm trở lên hung hăng (tự săn đánh trả trước): võ hồn cấp 60 để không mất cả phút đánh trả.
      await test(A,"set",{rowId:act,level:60});
      const k1=me(A).kills, l1=A.logs.length;
      // Tắt đánh tinh anh / thú vương / boss thế giới (#218: có trên bản đồ thì tới đánh trước mọi việc khác): không thì A đi lần lượt tới
      // từng tinh anh khắp Ngoại vi (hơn 200 ô, vòng dọn bên dưới xóa con đó khi tới gần) rồi mới về hồn thú thử, sát 90 giây chờ (#325).
      await autoOp(A,"set",{cfg:{...AUTO_DEFAULTS,years:[10,200],slots:[],elite:false,king:false,world:false}});
      m=await autoOp(A,"on");
      ok(m?.on&&A.logs.slice(l1).some(t=>/khắp bản đồ/.test(t)),`"Toàn bản đồ" (mặc định): bật, báo săn khắp bản đồ`);
      await waitFor(()=>me(A).auto,2000); // tin riêng `auto` có thể về trước bản vá state mang cờ auto
      let far=0, gone=false;
      for(let t=0;t<90000&&!gone&&me(A).auto;t+=500){ await sleep(500); far=Math.max(far,Math.hypot(me(A).x-home.x,me(A).y-home.y)); await test(A,"clear",{but:fb}); gone=!(await test(A,"auto",{bid:fb,pace:0}))?.beast; }
      // Dọc đường dọn hồn thú tự nhiên quanh A (bãi 300 năm trở lên hung hăng, hồi sinh liên tục) và giữ nợ nhịp 0: bài này thử đường đi,
      // đánh trả và trần tốc độ thử ở phần khác.
      ok(gone&&far>box,`vùng neo trống: tự đi xa ${Math.round(far/16)} ô (ngoài khung A* ${AUTO_MOVE.path.maxTiles} ô) hạ hồn thú cách ${Math.round(Math.hypot(F.x-home.x,F.y-home.y)/16)} ô (${k1} → ${me(A).kills})`);
      if(!gone){ const st=await test(A,"auto",{bid:fb}); console.log(`  (A ở ${JSON.stringify({p:[me(A).x,me(A).y],drop:st?.drop,goal:st?.goal,path:st?.path})}; A ở ${me(A).x.toFixed(0)},${me(A).y.toFixed(0)}, cách hồn thú xa ${Math.round(Math.hypot(me(A).x-F.x,me(A).y-F.y)/16)} ô; tự săn ${JSON.stringify(st)}; log ${A.logs.slice(-4).join(" | ")})`); }
      ok(me(A).auto&&!A.logs.slice(l1).some(t=>/Đã dừng/.test(t)),`vẫn tự săn sau khi đi xa (đường dài không vào vùng an toàn)${me(A).auto?"":`: ${A.autoMsg?.why}`}`);
      await autoOp(A,"off"); if(!gone) await test(A,"slay",{bid:fb});
      await test(A,"set",{rowId:act,level:21}); await autoOp(A,"set",{cfg:NEAR});
    }
  }

  // ---- #324: hồn thú sau lưng, cùng ô với mình, sát ô chặn: đường thẳng vướng mà A* trả đường rỗng (không có ô nào để đi). Tự săn phải
  // quay lại đánh, không coi là không tới được rồi bỏ qua nó AUTO_MOVE.skip giây (quanh điểm neo có nhiều ô chặn lẻ; bài nợ nhịp bên dưới
  // từng trượt vì vậy: hồn thú thử bị bỏ qua đúng 10 giây chờ). Chỗ thử chọn theo lưới ô chặn của file Tiled đang dùng.
  {
    const g=solidGrid(JSON.parse(readFileSync(mapUrl(NV),"utf8"))), s=TIERS[0].size, F=[[1,0],[-1,0],[0,1],[0,-1]];
    const reach=(P,f,Q)=>Math.hypot(Q.x-(P.x+f[0]*10),Q.y-s/2-(P.y-6+f[1]*10))<18+s/2-2; // hình đòn thường (AutoHunter.inReach)
    /** Độ dời nguyên tới chỗ hồn thú sau lưng P (mặt hướng f): cùng ô, ngoài tầm đánh, đường thẳng vướng, A* rỗng; không có thì null. */
    const behind=(P,f)=>{
      const tx=Math.floor(P.x/16), ty=Math.floor(P.y/16);
      for(let dy=-15;dy<=15;dy++) for(let dx=-15;dx<=15;dx++){
        const Q={x:P.x+dx,y:P.y+dy};
        if(Math.floor(Q.x/16)!==tx||Math.floor(Q.y/16)!==ty||Math.hypot(dx,dy)<=8||dx*f[0]+dy*f[1]>0) continue;
        if(hits(g,Q.x,Q.y,3,3)||reach(P,f,Q)||clearLine(g,P,Q)||findPath(g,P,Q,AUTO_MOVE.path).length) continue;
        return {dx,dy};
      }
      return null;
    };
    // Chỗ đứng S gần điểm neo: bước một chút theo f (quay mặt) từ S thì chỗ mới vẫn có hồn thú sau lưng như trên.
    let spot=null;
    for(let r=0;r<=4&&!spot;r++) for(let ty=Math.floor(home.y/16)-r;ty<=Math.floor(home.y/16)+r&&!spot;ty++) for(let tx=Math.floor(home.x/16)-r;tx<=Math.floor(home.x/16)+r&&!spot;tx++){
      if(Math.max(Math.abs(tx-Math.floor(home.x/16)),Math.abs(ty-Math.floor(home.y/16)))!==r) continue;
      for(let oy=2;oy<=14&&!spot;oy+=2) for(let ox=2;ox<=14&&!spot;ox+=2) for(const f of F){
        const S={x:tx*16+ox,y:ty*16+oy};
        if(hits(g,S.x,S.y,PLAYER_HW,PLAYER_HH)||inCamp(S.x,S.y)) continue;
        let all=true; for(let k=1;k<=8&&all;k++){ const P={x:S.x+f[0]*k,y:S.y+f[1]*k}; all=!hits(g,P.x,P.y,PLAYER_HW,PLAYER_HH)&&!!behind(P,f); }
        if(!all) continue;
        await test(A,"goto",S); if(Math.hypot(me(A).x-S.x,me(A).y-S.y)>=1) continue;
        await step(A,f[0],f[1]);
        const P={x:me(A).x,y:me(A).y}, q=behind(P,f); if(q){ spot={P,f,q}; break; }
      }
    }
    if(!spot) console.log("  ⚠ bỏ qua #324 (hồn thú sau lưng cùng ô): không tìm được chỗ thử quanh điểm neo");
    else{
      // Bãi quanh điểm neo có hồn thú hoang hung hăng hồi sinh liên tục: một con đánh A thì tự săn đánh trả trước và kéo A đi (#360). Dọn cả
      // bản đồ (giữ tinh anh) trước khi sinh, rồi dọn quanh A mỗi 250 ms trong lúc chờ (giữ hồn thú thử), như bài nợ nhịp.
      await test(A,"clear",{all:true,keep:true});
      // Loài cắm rễ (BEAST_ROOTED): không lang thang, không bị đẩy lùi, chỗ đứng giữ đúng như đã chọn. Không hồn kỹ / tiên cơ (trúng từ xa).
      const bid=(await test(A,"spawn",{tier:0,dx:spot.q.dx,dy:spot.q.dy,years:15,species:BEAST_ROOTED.ids[0],hpx:50}))?.bid, bb=()=>A.room.state.beasts.get(bid);
      // Không nhặt đồ: rảnh (hồn thú thử không hung hăng) thì tự săn nhặt đồ rơi trước khi nhắm hồn thú mới, mà quanh điểm neo còn hồn hoàn
      // của bài trước (Y bài "không cướp quái") nên A đi nhặt rồi mới quay lại, quá 4 giây (#305).
      await autoOp(A,"set",{cfg:{...NEAR,years:[10,200],slots:[],skills:[],tienCo:false,ring:-1,bone:false,core:false,kinds:[]}});
      m=await autoOp(A,"on");
      let hit=false;
      for(const t0=Date.now();m?.on&&bid&&!hit&&Date.now()-t0<4000;){ hit=await waitFor(()=>bb()&&bb().hp<bb().maxHp,250); if(!hit) await test(A,"clear",{but:[bid]}); }
      const st=await test(A,"auto",{bid});
      ok(hit&&st?.beast?.skip==null,`#324: hồn thú sau lưng cùng ô, sát ô chặn (đứng ${spot.P.x.toFixed(1)},${spot.P.y.toFixed(1)} mặt ${spot.f}, hồn thú +${spot.q.dx},+${spot.q.dy}): quay lại đánh, không bỏ qua`
        +(hit&&st?.beast?.skip==null?"":` [A ${me(A).x.toFixed(1)},${me(A).y.toFixed(1)}; hồn thú thử ${bid}, mục tiêu ${st?.target}, đích ${JSON.stringify(st?.goal)}, đường ${st?.path}, ${JSON.stringify(st?.beast)}; log ${A.logs.slice(-3).join(" | ")}]`));
      await autoOp(A,"off"); if(bid) await test(A,"slay",{bid});
      await autoOp(A,"set",{cfg:NEAR});
    }
  }

  // ---- #213: trần tốc độ (AUTO_PACE): còn nợ nhịp thì đứng nghỉ; mỗi con hạ cộng thời gian tự đánh (offlineFight, mốc ủy thác offline) ----
  {
    // Điểm neo ở bãi hồn thú hung hăng hồi sinh liên tục: trong lúc chờ, dọn hồn thú tự nhiên quanh A (giữ các con đang thử) để không
    // có trận đánh trả nào xen vào nợ nhịp.
    const quiet=async(fn,ms,keep)=>{ for(let t=0;t<ms;t+=500){ if(fn()) return true; await test(A,"clear",{but:keep}); await sleep(500); } return fn(); };
    /** Chẩn đoán khi trượt (#266): chỗ A, hồn thú `bid`, mục tiêu / nợ của tự săn, hồn thú đó nhắm ai / bị bỏ qua / người treo khác nhắm. */
    const why=async bid=>{ const st=await test(A,"auto",{bid}), b=A.room.state.beasts.get(bid);
      return ` [A ${me(A).x.toFixed(0)},${me(A).y.toFixed(0)}; ${bid} ${b?`${b.x.toFixed(0)},${b.y.toFixed(0)} ${b.hp}/${b.maxHp}`:"đã mất"}; mục tiêu ${st?.target}, nợ ${st?.pace?.toFixed(1)}, ${JSON.stringify(st?.beast)}; log ${A.logs.slice(-3).join(" | ")}]`; };
    // B (bài không cướp quái) đứng cạnh điểm neo kéo hồn thú hoang tới sát hồn thú thử: đòn của A vướng hồn thú B đang bị đuổi quá
    // AUTO_MOVE.stuck giây thì tự săn bỏ qua con thử AUTO_MOVE.skip giây (#266: hết 10 giây chờ mà chưa hạ, nợ kẹp -credit). Trong lúc
    // thử, B đứng ở điểm vào trại cổng (hồn thú không lang thang tới).
    await test(B,"goto",ar);
    if(me(B)&&Math.hypot(me(B).x-ar.x,me(B).y-ar.y)>1) console.log(`  ⚠ B không tới được điểm vào trại cổng (${ar.x},${ar.y}), vẫn ở ${me(B).x.toFixed(0)},${me(B).y.toFixed(0)}: hồn thú hoang có thể xen vào bài nợ nhịp`);
    await test(A,"goto",home); await test(A,"clear");
    await autoOp(A,"set",{cfg:{...NEAR,years:[10,200],slots:[]}});
    m=await autoOp(A,"on"); await test(A,"auto",{pace:4});
    // Chống lách trần tốc độ: tắt rồi bật lại tự săn không xóa nợ nhịp.
    await test(A,"auto",{pace:30}); await autoOp(A,"off"); m=await autoOp(A,"on"); info=await test(A,"auto");
    ok(m?.on&&info?.pace>20,`tắt rồi bật lại tự săn: nợ nhịp còn ${info?.pace?.toFixed(1)} giây (không về 0)`);
    await test(A,"auto",{pace:4});
    const pb=(await test(A,"spawn",{tier:0,dx:40,dy:0,years:15}))?.bid;
    await quiet(()=>false,2000,[pb]); info=await test(A,"auto");
    ok(m?.on&&pb&&info?.pace>0&&info.target!==pb&&A.room.state.beasts.has(pb),`còn nợ nhịp ${info?.pace?.toFixed(1)} giây: đứng nghỉ, chưa nhắm hồn thú mới (mục tiêu ${info?.target})`);
    // #422: nợ nhịp chỉ giảm theo giờ server trong lúc đi tới / đánh (không kẹp), nên trận dài ngang ước lượng (~4 giây) làm nợ về ≤ 0 dù
    // đã cộng đúng. Đo nợ + giờ server (`secs`) mỗi 100 ms tới khi con thử mất, rồi so với nợ trước − thời gian trôi + ước lượng.
    let pre=null, pk=false;
    for(let t=0;t<10000&&!pk;t+=100){
      if(!A.room.state.beasts.has(pb)){ pk=true; break; }
      const s=await test(A,"auto"); if(s&&A.room.state.beasts.has(pb)) pre=s;
      await test(A,"clear",{but:[pb]}); await sleep(100);
    }
    ok(pk,`hết nợ nhịp: hạ tiếp${pk?"":await why(pb)}`);
    info=await test(A,"auto");
    const expect=pre&&info?pre.pace-(info.secs-pre.secs)+info.est:null;
    // Không đo được nợ trước khi hạ thì không có gì để so: báo ✗ kèm chẩn đoán, không lọt qua bằng điều kiện nợ > 0 (dễ chập chờn lại).
    ok(pre!=null,`hạ một con: đo được nợ nhịp trước khi hạ (con thử ${pb}, còn trong state: ${A.room.state.beasts.has(pb)}, sau hạ nợ ${info?.pace?.toFixed(1)}, ước lượng ${info?.est?.toFixed(1)})`);
    ok(info?.pace>0||(expect!=null&&info.est>0&&Math.abs(info.pace-expect)<=1.5),`hạ một con: cộng thời gian tự đánh con đó vào nợ nhịp (còn ${info?.pace?.toFixed(1)} giây, ước lượng ${info?.est?.toFixed(1)}, dự kiến ${expect?.toFixed(1)}, mục tiêu ${info?.target})`);
    // Trận dài hơn AUTO_PACE.credit giây: thời gian thật đã trừ vào nợ, nên sau khi hạ nợ chỉ còn phần ước lượng vượt thời gian thật
    // (không kẹp lúc đang đánh rồi cộng nguyên ước lượng, tức không tính trận hai lần).
    await test(A,"clear",{all:true,keep:true}); await test(A,"auto",{pace:0}); // cả bản đồ: không hồn thú tự nhiên nào xen vào trận
    // Loài cắm rễ (BEAST_ROOTED, không bị đẩy lùi): hồn thú thường bị đòn của A đẩy dần ra xa, quá BEAST_LEASH.r thì bỏ đuổi chạy về
    // chỗ sinh và tự săn thôi nhắm giữa trận (#266).
    const lb=(await test(A,"spawn",{tier:0,dx:30,dy:0,years:15,species:BEAST_ROOTED.ids[0],hpx:1000}))?.bid;
    let engaged=false; for(let t=0;t<5000&&lb&&!engaged;t+=250){ engaged=(await test(A,"auto"))?.target===lb; if(!engaged) await sleep(250); }
    const lt0=Date.now();
    // Đánh lâu hơn credit giây (hồn thú nhiều sinh lực), rồi hạ nốt bằng hook như đòn cuối của A; suốt trận A phải giữ mục tiêu này.
    let stay=engaged, left=null;
    for(let t=0;t<(AUTO_PACE.credit+5)*1000;t+=1000){ await sleep(1000); await test(A,"clear",{but:lb}); const st=await test(A,"auto",{bid:lb}); if(st?.target!==lb&&stay){ stay=false; left=st; } }
    await test(A,"slay",{bid:lb}); const LF=(Date.now()-lt0)/1000;
    info=await test(A,"auto");
    if(!stay) console.log(`  ⚠ bỏ qua kiểm trận dài: A không giữ mục tiêu suốt trận (${engaged?`đổi sang ${left?.target}, hồn thú ${JSON.stringify(left?.beast)}, nợ ${left?.pace?.toFixed(1)}`:"chưa nhắm"})`);
    else ok(!A.room.state.beasts.has(lb)&&info?.pace<=Math.max(-AUTO_PACE.credit,(info?.est??0)-LF)+1.5,
      `trận dài ${LF.toFixed(0)} giây (ước lượng tự đánh ${info?.est?.toFixed(1)} giây): sau khi hạ nợ ${info?.pace?.toFixed(1)} giây, không tính trận hai lần`);
    // Sáu hồn thú yếu quanh mình (cách nhau ~60 pixel), bắt đầu từ nợ 0: trong T giây nhắm tối đa 1 + T / OFFLINE.seek con, cộng một con
    // hồn kỹ diện rộng có thể hạ lan (không trần thì hạ hết cả sáu).
    // T giây đo theo giờ server (`secs` của lượt tự săn, cùng đồng hồ với nợ nhịp) tính từ lúc đặt nợ 0, không theo số vòng chờ: mỗi vòng
    // còn một lần gọi hook, cộng 6 lần sinh hồn thú, máy tải thì thời gian thật dài hơn T (#328: 12 giây thật hạ 5/6).
    await test(A,"clear"); const s0=(await test(A,"auto",{pace:0}))?.secs, w0=Date.now();
    const six=[]; for(let k=0;k<6;k++) six.push((await test(A,"spawn",{tier:0,dx:Math.round(60*Math.cos(k*Math.PI/3)),dy:Math.round(60*Math.sin(k*Math.PI/3)),years:15}))?.bid);
    const T=10, cap=2+Math.floor(T/OFFLINE.seek), downs=()=>six.filter(b=>b&&!A.room.state.beasts.has(b)).length;
    // Số con đã hạ ở lần đọc cuối còn trong T giây (bản vá state tới sau lời hook); lần đọc thưa dần về 50 ms khi gần hết T.
    let dead=0, el=0, st=null;
    while(Date.now()-w0<T*4000){
      await test(A,"clear",{but:six}); st=await test(A,"auto"); el=(st?.secs??NaN)-s0;
      if(!(el<=T)) break;
      dead=downs(); await sleep(Math.max(50,Math.min(500,(T-el)*1000)));
    }
    ok(me(A).auto&&dead>=1&&dead<=cap&&dead<6,`trần tốc độ: ${T} giây hạ ${dead}/6 hồn thú yếu sát bên (tối đa ${cap})`
      +(me(A).auto&&dead>=1&&dead<=cap&&dead<6?"":` [giờ server ${el?.toFixed?.(1)} giây, thật ${((Date.now()-w0)/1000).toFixed(1)} giây, nợ ${st?.pace?.toFixed?.(1)}, ước lượng ${st?.est?.toFixed?.(1)}, mục tiêu ${st?.target}, đã hạ lúc dừng ${downs()}]`));
    await autoOp(A,"off"); for(const b of six) if(b) await test(A,"slay",{bid:b});
    await autoOp(A,"set",{cfg:NEAR});
  }

  // ---- Auto 2: lọc hồn hạch theo sao ----
  await test(A,"goto",home); await test(A,"clear");
  await autoOp(A,"set",{cfg:{...NEAR,ring:-1,bone:false,coreStar:3}});
  await test(A,"core",{r:0,stars:2}); // chắc chắn rơi hồn hạch 2 sao
  sp=await test(A,"spawn",{tier:0,dx:30,dy:0,years:1500}); const sc=await test(A,"slay",{bid:sp?.bid}); await test(A,"core",{r:-1});
  const coreAt=()=>[...A.room.state.drops.entries()].find(([,d])=>d.item===CORE_ITEM&&Math.hypot(d.x-sc.x,d.y-sc.y)<24)?.[0];
  await waitFor(()=>coreAt(),1500); const cd=coreAt(), c0=qtyOf(A,CORE_ITEM);
  m=await autoOp(A,"on"); await sleep(2500);
  ok(cd&&m?.on&&A.room.state.drops.has(cd)&&qtyOf(A,CORE_ITEM)===c0,`chỉ nhặt hồn hạch từ 3★: hồn hạch 2★ vẫn nằm dưới đất`);
  // Về chỗ cũ rồi mới bật lại: lúc nãy đi dạo trong vùng neo, điểm neo mới có thể cách hồn hạch quá bán kính (đúng luật thì không nhặt).
  // Dọn hồn thú hoang quanh đó trong lúc chờ: hồn thú lao vào thì tự săn đánh trả trước rồi mới đi nhặt.
  await autoOp(A,"off"); await autoOp(A,"set",{cfg:{...NEAR,ring:-1,bone:false,coreStar:2}}); await test(A,"goto",home); await test(A,"clear"); m=await autoOp(A,"on");
  let gotCore=false; for(let k=0;k<5&&!gotCore;k++){ gotCore=await waitFor(()=>qtyOf(A,CORE_ITEM)>c0,2000); if(!gotCore) await test(A,"clear"); }
  ok(cd&&m?.on&&gotCore,`hạ ngưỡng còn 2★: nhặt hồn hạch (${c0} → ${qtyOf(A,CORE_ITEM)})`);
  if(!gotCore) console.log(`  (bật ${JSON.stringify(m)}; hồn hạch ${cd} ${JSON.stringify(A.room.state.drops.get(cd)?.toJSON?.())}; tự săn ${JSON.stringify(await test(A,"auto"))}; log ${A.logs.slice(-4).join(" | ")})`);
  await autoOp(A,"off"); await autoOp(A,"set",{cfg:NEAR});

  // ---- Giới hạn giờ treo mỗi ngày ----
  await test(A,"goto",home); await test(A,"clear");
  await test(A,"auto",{used:AUTO_DAILY_SECS-1.5});
  m=await autoOp(A,"on");
  ok(m?.on&&m.left<=2&&await stopped(A,/đủ 12 giờ/,5000),`còn 1,5 giây: bật được rồi tự dừng (${A.autoMsg?.why})`);
  m=await autoOp(A,"on");
  ok(m&&!m.on&&/đã treo đủ/.test(m.why??""),`hết giờ hôm nay: từ chối (${m?.why})`);
  await test(A,"day",{shift:1});
  m=await autoOp(A,"on");
  ok(m?.on&&m.left>=AUTO_DAILY_SECS-5,`sang ngày mới (giờ Việt Nam): bật lại được, còn ${autoTimeText(m?.left??0)}`);
  await autoOp(A,"off"); await test(A,"day",{shift:0});

  // ---- Auto 2: Ủy Thác Lệnh (mua ở thương nhân trong thành, cộng quỹ giờ treo ngoài giờ miễn phí) ----
  ok(SHOP.some(r=>r.code===AUTO_TOKEN&&r.price===AUTO_TOKEN_PRICE)&&!CAMP_SHOP.some(r=>r.code===AUTO_TOKEN)&&itemDef(AUTO_TOKEN)?.auto===AUTO_TOKEN_SECS
    &&sellPrice({code:AUTO_TOKEN,years:null,stars:null,enhance:0})===null,
    `Ủy Thác Lệnh: thương nhân trong thành bán ${formatHonTe(AUTO_TOKEN_PRICE)}, không mua lại, +${autoTimeText(AUTO_TOKEN_SECS)} mỗi lệnh`);
  const tn=npcSpot("nac_dinh_thanh","thuong_nhan");
  await warp(A,"nac_dinh_thanh",tn.x,tn.y+16);
  await test(A,"coin",{n:AUTO_TOKEN_PRICE+5}); await waitFor(()=>A.bag.honTe===AUTO_TOKEN_PRICE+5,1500);
  const tk0=qtyOf(A,AUTO_TOKEN), tbuy=await trade(A,"buy",{code:AUTO_TOKEN,qty:1});
  ok(await waitFor(()=>qtyOf(A,AUTO_TOKEN)===tk0+1&&A.bag.honTe===5,1500),`mua 1 Ủy Thác Lệnh, còn ${formatHonTe(A.bag.honTe)} (${tbuy})`);
  await test(A,"auto",{used:AUTO_DAILY_SECS,bonus:0});
  const useTok=async()=>{ A.autoMsg=null; A.room.send("use",{id:A.bag.items.find(i=>i.code===AUTO_TOKEN)?.id}); await waitFor(()=>A.autoMsg,1500); return A.autoMsg; };
  m=await useTok();
  ok(m&&m.bonus===AUTO_TOKEN_SECS&&m.left===AUTO_TOKEN_SECS&&await waitFor(()=>qtyOf(A,AUTO_TOKEN)===tk0,1500),
    `hết giờ miễn phí, dùng lệnh: còn ${autoTimeText(m?.left??0)} (cộng thêm ${autoTimeText(m?.bonus??0)}), lệnh trong túi ${qtyOf(A,AUTO_TOKEN)}`);
  await warp(A,NV,home.x,home.y); m=await autoOp(A,"get");
  ok(m&&Math.abs(m.bonus-AUTO_TOKEN_SECS)<=2&&m.left<=AUTO_TOKEN_SECS,`vào lại: quỹ giờ cộng thêm còn ${autoTimeText(m?.bonus??0)} (lưu cùng túi đồ)`);
  await test(A,"clear"); m=await autoOp(A,"on"); await sleep(1500); await autoOp(A,"off");
  info=await test(A,"auto");
  ok(m?.on&&info?.used>=AUTO_DAILY_SECS&&info.bonus<AUTO_TOKEN_SECS&&info.bonus>AUTO_TOKEN_SECS-30,`đã hết giờ miễn phí: bật được, tiêu quỹ cộng thêm (${info?.bonus?.toFixed(1)} giây còn)`);
  await test(A,"auto",{bonus:1.5}); m=await autoOp(A,"on");
  ok(m?.on&&await stopped(A,/đủ 12 giờ/,5000)&&A.autoMsg.bonus===0,`quỹ còn 1,5 giây: treo hết rồi dừng (${A.autoMsg?.why})`);
  await test(A,"auto",{bonus:AUTO_BONUS_MAX-60}); await test(A,"give",{code:AUTO_TOKEN,qty:1}); await waitFor(()=>qtyOf(A,AUTO_TOKEN)===tk0+1,1500);
  const tl=A.logs.length; A.room.send("use",{id:A.bag.items.find(i=>i.code===AUTO_TOKEN)?.id});
  ok(await waitFor(()=>A.logs.slice(tl).some(t=>/tối đa/.test(t)),1500)&&qtyOf(A,AUTO_TOKEN)===tk0+1,`quỹ gần đầy (${autoTimeText(AUTO_BONUS_MAX)}): không dùng được, lệnh còn trong túi`);
  await test(A,"auto",{used:0,bonus:0});

  // ---- Giới hạn người treo mỗi ô lưới ----
  const C=await bot("Treo ba","hoa_long",{sex:0,hair:3,hairCol:4,outfitCol:0}); extra.push(C);
  const D=await bot("Treo bốn","yeu_ho",{sex:1,hair:1,hairCol:5,outfitCol:5}); extra.push(D);
  await warp(C,NV,ar.x,ar.y); await warp(D,NV,ar.x,ar.y);
  const crowd=[A,B,C,D].filter(b=>b.room.roomId===A.room.roomId);
  if(crowd.length<AUTO_MAX_PER_CELL+1) console.log("  ⚠ bỏ qua giới hạn mỗi ô lưới: các bot khác kênh");
  else{
    for(const b of crowd) await test(b,"goto",home);
    await test(A,"clear");
    const res=[]; for(const b of crowd.slice(0,AUTO_MAX_PER_CELL+1)) res.push(await autoOp(b,"on"));
    ok(res.slice(0,AUTO_MAX_PER_CELL).every(x=>x?.on)&&!res[AUTO_MAX_PER_CELL]?.on&&/đã có \d+ người treo/.test(res[AUTO_MAX_PER_CELL]?.why??""),
      `${AUTO_MAX_PER_CELL} người treo chung một ô lưới (${SYNC_VIEW.cell} pixel); người thứ ${AUTO_MAX_PER_CELL+1} bị từ chối (${res[AUTO_MAX_PER_CELL]?.why})`);
    for(const b of crowd) await autoOp(b,"off");
  }

  // ---- Cài đặt và giờ treo lưu qua lần vào lại; mất kết nối thì dừng ----
  const cfg={...NEAR,years:[100,5000],hp:0.5,skills:[1,0],ring:500,core:false};
  m=await autoOp(A,"set",{cfg});
  ok(same(m?.cfg,cfg),"đổi cài đặt (tin auto set)");
  await test(A,"auto",{used:3600}); await autoOp(A,"on");
  await rejoin(A); m=await autoOp(A,"get");
  ok(m&&!m.on&&!me(A).auto&&same(m.cfg,cfg)&&Math.abs(m.left-(AUTO_DAILY_SECS-3600))<=5,`vào lại: không tự bật, giữ cài đặt và giờ treo (còn ${autoTimeText(m?.left??0)})`);

  // ---- Bộ lọc nhặt: hồn hoàn (bị lọc) nằm gần hơn hồn cốt (được nhặt) thì vẫn chỉ nhặt hồn cốt ----
  await test(A,"goto",home); await test(A,"clear");
  await autoOp(A,"set",{cfg:{...NEAR,ring:-1,bone:true}});
  await test(A,"bone",{r:0,s:0}); // r/100 dưới tỉ lệ rơi: chắc chắn rơi hồn cốt
  sp=await test(A,"spawn",{tier:0,dx:30,dy:0,years:1500}); const sb=await test(A,"slay",{bid:sp?.bid}); await test(A,"bone",{r:-1});
  const dropsAt=()=>[...A.room.state.drops.entries()].filter(([,d])=>Math.hypot(d.x-sb.x,d.y-sb.y)<12);
  await waitFor(()=>dropsAt().length>=2,1500);
  const ringD=dropsAt().find(([,d])=>d.item==="")?.[0], boneD=dropsAt().find(([,d])=>d.item===BONE_ITEM)?.[0];
  const rd=A.room.state.drops.get(ringD); if(rd) await test(A,"goto",{x:rd.x,y:rd.y}); // đứng đúng chỗ hồn hoàn: hồn hoàn là món gần nhất
  const bn0=bonesOf(A).length, rn0=qtyOf(A,RING_ITEM);
  m=await autoOp(A,"on");
  const gotBone=await waitFor(()=>bonesOf(A).length>bn0,4000);
  ok(ringD&&boneD&&m?.on&&gotBone&&qtyOf(A,RING_ITEM)===rn0&&A.room.state.drops.has(ringD),
    `bộ lọc không nhặt hồn hoàn: đứng trên hồn hoàn, chỉ nhặt hồn cốt cạnh đó (hồn cốt ${bn0} → ${bonesOf(A).length}, hồn hoàn ${rn0} → ${qtyOf(A,RING_ITEM)}, hồn hoàn còn dưới đất: ${A.room.state.drops.has(ringD)})`);
  if(!gotBone) console.log(`  (giết ${JSON.stringify(sb)}; đồ gần: ${JSON.stringify(dropsAt().map(([k,d])=>[k,d.item,d.x,d.y,d.owner===A.room.sessionId]))}; bật ${JSON.stringify(m)}; tự săn ${JSON.stringify(await test(A,"auto"))}; log ${A.logs.slice(-4).join(" | ")})`);
  await autoOp(A,"off"); await autoOp(A,"set",{cfg});

  // ---- AH1 (#608): nhặt đồ ưu tiên, chọn mục tiêu theo chi phí, chế độ boss ----
  ok(AUTO_DEFAULTS.bossMode==="near"&&parseAuto({}).bossMode==="near"&&parseAuto({bossMode:"always"}).bossMode==="always"&&parseAuto({bossMode:"off"}).bossMode==="off"
    &&parseAuto({bossMode:"x"}).bossMode==="near"&&parseAuto({bossMode:1}).bossMode==="near",`AH1: bossMode mặc định "Khi gần", bản lưu cũ / sai kiểu thì "near", kẹp về near | always | off`);
  const infoA=async(more={})=>(await test(A,"auto",more))??{};
  { const PK={...NEAR,years:[0,MAX_YEARS],ring:-1,bone:true,core:false,slots:[],skills:[],tienCo:false,elite:false,king:false,world:false};
    await test(A,"goto",home); await test(A,"clear",{all:true,keep:true}); await autoOp(A,"set",{cfg:PK});
    const bonesN=()=>bonesOf(A).length;
    // Đang đi tới một con (chưa đánh trúng) mà có đồ rơi trong AUTO_LOOT_RADIUS: nhặt xong mới nhắm con đó (con đó vẫn nguyên sinh lực).
    const tgt=(await test(A,"spawn",{tier:0,dx:200,dy:0,years:15,hpx:50}))?.bid, bn0=bonesN();
    m=await autoOp(A,"on");
    let targeted=false; for(let t=0;t<3000&&!targeted;t+=100){ targeted=(await infoA()).target===tgt; if(!targeted) await sleep(100); }
    await test(A,"bone",{r:0,s:0}); const kb=(await test(A,"spawn",{tier:0,dx:-48,dy:0,years:1500}))?.bid; await test(A,"slay",{bid:kb}); await test(A,"bone",{r:-1});
    await test(A,"auto",{pace:0}); // slay tính như hạ một con (nợ nhịp AUTO_PACE): bỏ nợ để thấy rõ thứ tự nhặt → nhắm
    let picked=false, hurt=false, retarget=false, first=null;
    for(let t=0;t<8000&&!(picked&&retarget);t+=100){
      const st=await infoA(), tb=A.room.state.beasts.get(tgt);
      if(!picked&&bonesN()>bn0){ picked=true; first=st; }
      if(!picked&&tb&&tb.hp<tb.maxHp) hurt=true;
      if(picked&&st.target===tgt) retarget=true;
      await sleep(100);
    }
    ok(m?.on&&targeted&&picked&&!hurt&&retarget,`nhặt xong mới nhắm con mới: đang đi tới con ${tgt} thì hồn cốt rơi cạnh, nhặt trước (con đó chưa bị đánh), rồi quay lại nhắm nó (nhặt ${picked}, bị đánh trước khi nhặt ${hurt}, nhắm lại ${retarget})`);
    await autoOp(A,"off"); await test(A,"clear",{all:true,keep:true});
    // Sau khi hạ một con: chờ AUTO_LOOT_WAIT cho đồ rơi rồi mới nhắm con mới (hồn thú thứ hai đã có sẵn cạnh đó).
    await test(A,"goto",home); await autoOp(A,"set",{cfg:PK});
    const w1=(await test(A,"spawn",{tier:0,dx:30,dy:0,years:10}))?.bid, w2=(await test(A,"spawn",{tier:0,dx:-60,dy:0,years:10,hpx:50}))?.bid;
    await test(A,"auto",{pace:0}); m=await autoOp(A,"on");
    let tw=null, gone=false, t1=0;
    for(let t=0;t<8000&&tw===null;t+=50){ if(!A.room.state.beasts.has(w1)&&!gone){ gone=true; t1=Date.now(); await test(A,"auto",{pace:0}); }
      if(gone&&(await infoA()).target===w2) tw=(Date.now()-t1)/1000; await sleep(50); }
    ok(m?.on&&gone&&tw!==null&&tw>=AUTO_LOOT_WAIT-0.35,`sau khi hạ một con: chờ đồ rơi (AUTO_LOOT_WAIT ${AUTO_LOOT_WAIT} giây) rồi mới nhắm con kế (sau ${tw?.toFixed(2)} giây, đã hạ ${gone})`);
    await autoOp(A,"off"); await test(A,"clear",{all:true,keep:true});
  }
  // Boss xa 40 ô + quái thường gần: "near" đánh quái gần; "always" (như cũ) tới boss; "off" không đánh boss.
  { const BO={...AUTO_DEFAULTS,scope:"map",years:[0,MAX_YEARS],bone:false,core:false,ring:-1,slots:[],skills:[],tienCo:false,king:false,world:false,elite:true};
    let el=(await test(A,"elite")).list; if(!el.some(e=>e.bid)){ await test(A,"erespawn",{s:0}); for(let k=0;k<15&&!(el=(await test(A,"elite")).list).some(e=>e.bid);k++) await sleep(200); }
    const E=el.find(e=>e.bid);
    // Chỗ xa boss ≥ 30 ô mà boss đi bộ tới được (cùng vùng liên thông): thử bằng chế độ "always", nhắm được boss là đúng chỗ.
    let far=null;
    if(E) for(const r of [640,560,480]) for(let k=0;k<16&&!far;k++){ const a=k*Math.PI/8, x=Math.round(E.x+r*Math.cos(a)), y=Math.round(E.y+r*Math.sin(a));
      await test(A,"goto",{x,y}); if(Math.hypot(me(A).x-x,me(A).y-y)>=1||inCamp(x,y)||el.some(e=>e.bid&&Math.hypot(e.x-x,e.y-y)<480)) continue; // mọi tinh anh đều ≥ 30 ô
      await test(A,"clear",{all:true,keep:true}); await autoOp(A,"set",{cfg:{...BO,bossMode:"always"}}); await autoOp(A,"on");
      for(let t=0;t<1500&&!far;t+=250){ if((await infoA()).boss) far={x,y,r}; else await sleep(250); }
      await autoOp(A,"off"); }
    ok(E&&far,`AH1: boss ${E?.name} cách ${far?(Math.hypot(E.x-me(A).x,E.y-me(A).y)/TILE).toFixed(0):"?"} ô (AUTO_BOSS_DETOUR ${AUTO_BOSS_DETOUR/TILE} ô)`);
    if(E&&far){
      const E1=E.bid, setup=async cfg2=>{ await autoOp(A,"off"); await test(A,"goto",far); await test(A,"clear",{all:true,keep:true}); await autoOp(A,"set",{cfg:{...BO,...cfg2}}); await test(A,"auto",{pace:0}); };
      const near1=async()=>(await test(A,"spawn",{tier:0,dx:40,dy:0,years:10,hpx:20}))?.bid;
      await setup({bossMode:"near"}); let nb=await near1(); m=await autoOp(A,"on"); let sawBoss=false, sawNear=false;
      for(let t=0;t<3500;t+=250){ const st=await infoA(); if(st.boss&&A.room.state.beasts.has(nb)) sawBoss=true; if(st.target===nb&&!st.boss) sawNear=true; await sleep(250); }
      ok(m?.on&&sawNear&&!sawBoss,`"Khi gần": boss xa + quái thường gần → đánh quái gần, không chạy tới boss (quái gần ${sawNear}, boss ${sawBoss})`);
      await test(A,"clear",{all:true,keep:true}); let toBoss=false;
      for(let t=0;t<6000&&!toBoss;t+=250){ await test(A,"clear",{all:true,keep:true}); const st=await infoA(); toBoss=st.boss; await sleep(250); } // dọn liên tục: hồn thú hồi sinh quanh A không xen vào
      ok(toBoss,`"Khi gần": hết quái thường quanh mình thì tới đánh boss`+(toBoss?"":` [tự săn ${JSON.stringify(await infoA().then(x=>({on:x.on,target:x.target,boss:x.boss,goal:x.goal,pace:x.pace})))}, A ${me(A).x.toFixed(0)},${me(A).y.toFixed(0)}, boss ${E.x.toFixed(0)},${E.y.toFixed(0)}, hồn thú thường gần: ${[...A.room.state.beasts.values()].filter(b=>!b.rank&&Math.hypot(b.x-me(A).x,b.y-me(A).y)<240).length}]`));
      await setup({bossMode:"always"}); nb=await near1(); m=await autoOp(A,"on"); toBoss=false;
      for(let t=0;t<3500&&!toBoss;t+=250){ const st=await infoA(); toBoss=st.boss; await sleep(250); }
      ok(m?.on&&toBoss,`"Luôn ưu tiên": tới boss xa trước cả quái thường gần (hành vi cũ)`);
      await setup({bossMode:"off"}); await test(A,"clear",{all:true,keep:true}); m=await autoOp(A,"on"); sawBoss=false;
      for(let t=0;t<3000;t+=250){ const st=await infoA(); if(st.boss) sawBoss=true; await sleep(250); }
      ok(m?.on&&!sawBoss,`"Không": không nhắm boss dù hết quái thường`);
      await autoOp(A,"off"); await test(A,"clear",{all:true,keep:true});
    }
  }
  // ---- AH4 (#611): gợi ý niên hạn hợp sức, chống kẹt đi vòng lặp, tổ đội cùng treo ----
  // Gốc chập chờn (#1678): bài trước (đánh trả, gục, tiên cơ) có thể để võ hồn khác ra trận (Lam Ngân Thảo cấp 5) → mọi vùng quá sức, best=null. Đặt lại đúng fixture đầu bài (võ hồn chính, cấp 21, 2 hồn hoàn) trước khi khẳng định gợi ý.
  await autoOp(A,"off"); await test(A,"clear",{all:true,keep:true}); await test(A,"ready"); await test(A,"rest",{s:10});
  if(A.owned.active!==act){ await waitFor(()=>A.room.state.players.get(A.room.sessionId)?.swCd===0,3500); const slot=A.owned.team.indexOf(act); A.room.send("switch",{slot:slot<0?0:slot}); await waitFor(()=>A.owned.active===act,2000); }
  await test(A,"set",{rowId:act,level:21,rings:[423,812]}); await test(A,"goto",home);
  { const strong={atk:3000,crit:0.2,critMult:2,maxHp:60000,def:1}, weak={atk:20,crit:0.1,critMult:1.8,maxHp:300,def:1}, zs=[{name:"Vùng thấp",years:[10,300],species:["phong_lang"]},{name:"Vùng cao",years:[2000,20000],species:["phong_lang"]}];
    const hs=autoHint(strong,zs), hw=autoHint(weak,zs);
    ok(hs.best?.zone==="Vùng cao"&&hs.best.years[0]===2000&&hs.best.years[1]>2000&&offlineFight(strong,hs.best.years[1],"phong_lang").secs<=AUTO_HINT.maxSecs&&offlineFight(strong,hs.best.years[1]+1,"phong_lang").secs>AUTO_HINT.maxSecs||hs.best?.full,
      `AH4 gợi ý: võ hồn mạnh được vùng cao, tới mức hạ một con ≤ ${AUTO_HINT.maxSecs} giây (${JSON.stringify(hs.best)})`);
    ok(hw.best?.zone==="Vùng thấp"&&hw.rows.find(r=>r.zone==="Vùng cao").years===null,`AH4 gợi ý: võ hồn yếu chỉ hợp vùng thấp, vùng cao "quá sức" (${JSON.stringify(hw.rows)})`);
    const g=await autoOp(A,"get"), h=g?.hint;
    ok(h&&h.rows.length>0&&h.best?.years&&h.best.years[0]<=h.best.years[1],`AH4: tin "auto" ở bản đồ săn kèm gợi ý hợp sức (${JSON.stringify(h?.best)}) [ra trận ${A.owned.active===act?"chính":"khác"}, hàng ${JSON.stringify(A.owned.list.find(v=>v.rowId===A.owned.active))}, rows ${JSON.stringify(h?.rows)}]`);
    // Soát AH3/AH4: tin `auto` vượt nhịp vẫn được trả lời; gợi ý lấy từ bộ nhớ đệm theo chỉ số võ hồn (không tính lại mỗi tin), kết quả phải y nguyên.
    await test(A,"auto",{rate:true}); A.autoMsg=null; let n=0; A.room.onMessage("auto",()=>{n++;});
    for(let i=0;i<60;i++) A.room.send("auto",{op:"get"});
    await waitFor(()=>n>=60,3000); await sleep(100);
    ok(n>=60&&same(A.autoMsg?.hint,h),`Soát AH4: 60 tin "auto get" dồn dập (vượt nhịp) đều được trả lời, gợi ý không đổi (${n} tin)`);
    await test(A,"auto",{rate:false});
  }
  { const LP={...AUTO_DEFAULTS,scope:"map",years:[0,MAX_YEARS],bone:false,core:false,ring:-1,slots:[],skills:[],tienCo:false,elite:false,king:false,world:false};
    await test(A,"goto",home); await test(A,"clear",{all:true,keep:true}); await autoOp(A,"set",{cfg:LP});
    const lt=(await test(A,"spawn",{tier:0,dx:300,dy:0,years:15,hpx:50}))?.bid;
    await test(A,"auto",{pace:0}); m=await autoOp(A,"on"); A.autost.length=0;
    let tg=false; for(let t=0;t<3000&&!tg;t+=100){ tg=(await infoA()).target===lt; if(!tg) await sleep(100); }
    await test(A,"auto",{loop:true});
    let st=null; for(let t=0;t<4000&&st?.why!=="loop";t+=100){ st=await infoA(); await sleep(100); }
    ok(m?.on&&tg&&st?.why==="loop"&&st.target!==lt,`AH4 chống kẹt: đang đi tới con ${lt} mà ${AUTO_STUCK.window} giây không nhích → lý do "${st?.why}", bỏ mục tiêu đó (nhắm ${st?.target})`);
    ok(await waitFor(()=>A.autost.some(x=>x.w==="loop"),2500),`AH4 chống kẹt: dòng trạng thái ghi lý do đi vòng lặp (${JSON.stringify(A.autost.at(-1))})`);
    await autoOp(A,"off"); await test(A,"clear",{all:true,keep:true});
  }
  if(B.room.roomId!==A.room.roomId) console.log("  ⚠ bỏ qua tổ đội cùng treo: hai bot khác kênh");
  else{
    const pm=async(b,op,extra2,w)=>{ const n=w.partyMsgs; b.room.send("party",{op,...extra2}); await waitFor(()=>w.partyMsgs>n,2000); await sleep(120); };
    await autoOp(B,"off"); await test(A,"goto",home); await test(B,"goto",{x:home.x+16,y:home.y});
    await pm(A,"invite",{name:B.name},B); await pm(B,"accept",{name:A.name},A); await waitFor(()=>A.party?.members?.length===2,2000);
    const PT={...AUTO_DEFAULTS,scope:"map",years:[0,MAX_YEARS],bone:false,core:false,ring:-1,slots:[],skills:[],tienCo:false,elite:false,king:false,world:false};
    await test(A,"clear",{all:true,keep:true}); await autoOp(A,"set",{cfg:PT}); await autoOp(B,"set",{cfg:PT});
    // Hai con ở hai phía (180 pixel, trong AUTO_PARTY.leash quanh cả hai người): đồng đội dồn vào cùng một con, không tách ra hai bên.
    const t1=(await test(A,"spawn",{tier:0,dx:90,dy:0,years:20,hpx:80}))?.bid, t2=(await test(A,"spawn",{tier:0,dx:-90,dy:0,years:20,hpx:80}))?.bid;
    await test(A,"auto",{pace:0}); await test(B,"auto",{pace:0});
    const ma=await autoOp(A,"on"), mb=await autoOp(B,"on");
    let same2=false, mates=0, apart=0;
    for(let t=0;t<9000;t+=250){ const sa=await infoA(), sb=await test(B,"auto"); mates=Math.max(mates,sa.mates??0);
      if(sa.target&&sa.target===sb?.target) same2=true;
      apart=Math.max(apart,Math.hypot(me(A).x-me(B).x,me(A).y-me(B).y));
      await test(A,"auto",{pace:0}); await test(B,"auto",{pace:0}); await sleep(250); }
    ok(ma?.on&&mb?.on&&mates===1&&same2&&apart<=AUTO_PARTY.leash*2,`AH4 tổ đội cùng treo: thấy đồng đội (${mates}), cùng nhắm một con (${same2}), không tách xa (xa nhất ${(apart/TILE).toFixed(1)} ô, ngưỡng ${AUTO_PARTY.leash*2/TILE})`);
    await autoOp(A,"off"); await autoOp(B,"off"); await test(A,"clear",{all:true,keep:true});
    // Con cách đồng đội xa hơn AUTO_PARTY.leash (cả hai đứng cạnh nhau) thì không ai nhắm.
    // (hook spawn giới hạn độ lệch: đặt con ở bên phải rồi dời cả hai người sang trái cho tới khi xa con hơn AUTO_PARTY.leash)
    await test(A,"goto",home); await test(B,"goto",{x:home.x+16,y:home.y});
    const fr=(await test(A,"spawn",{tier:0,dx:150,dy:0,years:20,hpx:80}))?.bid, fb0=A.room.state.beasts.get(fr);
    // Con lang thang tối đa BEAST_WANDER mỗi trục quanh chỗ sinh (chéo ≈ ×1.42): biên phải lớn hơn thế, không thì con lang thang lọt vào leash là hợp lệ.
    const FAR=AUTO_PARTY.leash+Math.ceil(BEAST_WANDER*1.42)+16;
    for(let k=0;k<16;k++){ const a=k*Math.PI/8, r=FAR+60; await test(A,"goto",{x:Math.round(fb0.x+r*Math.cos(a)),y:Math.round(fb0.y+r*Math.sin(a))}); if(Math.hypot(me(A).x-fb0.x,me(A).y-fb0.y)>FAR&&!inCamp(me(A).x,me(A).y)) break; }
    await test(B,"goto",{x:me(A).x-8,y:me(A).y});
    await sleep(300);
    const farOk=Math.hypot(me(A).x-fb0.x,me(A).y-fb0.y)>FAR&&Math.hypot(me(B).x-fb0.x,me(B).y-fb0.y)>FAR;
    await test(A,"auto",{pace:0}); await test(B,"auto",{pace:0});
    if(!farOk) console.log("  ⚠ bỏ qua leash: không đứng được đủ xa con");
    else{
      // Gốc chập chờn (#1421): bài cũ đo trên vị trí client lúc hai người đang tự đi tuần / đi theo nhau (cả bản đồ) và chờ 5-10 giây: đồng đội bước
      // vào leash của con (hợp lệ) rồi bước ra, còn client (máy tải, bản vá state trễ) thấy vị trí cũ nên coi là "cách xa" → ✗ giả. Nay: bật
      // với nợ nhịp (paceNext) nên cả hai đứng yên, chờ thấy nhau, rồi hỏi server (pick = findTarget đúng lúc đó, vị trí cố định) chọn con nào;
      // đối chứng đặt đồng đội vào leash thì phải chọn. Không còn đo khi hai người tự đi (lấy mẫu rời rạc khi họ di chuyển là chính họ lỗi của bài cũ): chọn và giữ / bỏ mục tiêu đều đo ở vị trí cố định.
      try{
      await autoOp(A,"set",{cfg:PT}); await autoOp(B,"set",{cfg:PT});
      await test(A,"auto",{paceNext:3600}); await test(B,"auto",{paceNext:3600});
      await Promise.all([autoOp(A,"on"),autoOp(B,"on")]);
      let seen=false; for(let t=0;t<4000&&!seen;t+=100){ seen=(await infoA()).mates>=1&&((await test(B,"auto"))?.mates??0)>=1; if(!seen) await sleep(100); }
      await test(A,"clear",{all:true,keep:true,but:fr}); // hồn thú tự nhiên hồi sinh: chỉ giữ con thử
      const fe0=A.room.state.beasts.get(fr), dd=s=>Math.round(Math.hypot(me(s).x-fe0.x,me(s).y-fe0.y)), pk=async s=>(await test(s,"auto",{pick:true}))?.pick;
      const pa=await pk(A), pb=await pk(B), frOk=!!(await infoA({bid:fr})).beast; // con thử còn thì "không chọn" mới có nghĩa
      ok(seen&&frOk&&pa!==fr&&pb!==fr,`AH4 tổ đội: con ở cách đồng đội xa hơn AUTO_PARTY.leash (${AUTO_PARTY.leash/TILE} ô), hai người đứng yên: không ai chọn`+(seen?"":" [hai người chưa thấy nhau]")+(frOk?"":" [con thử không còn]")+(pa===fr||pb===fr?` [A chọn ${pa}, B chọn ${pb}, fr ${fr}; cách con A ${dd(A)}, B ${dd(B)}]`:""));
      // Đối chứng: đồng đội đứng trong leash của con thì người kia chọn con đó (luật không "chặn hết" nên bài trên mới có nghĩa).
      const B0={x:me(B).x,y:me(B).y};
      // Chỗ không đứng được (tường) thì `goto` không dời: thử hướng khác; đọc khoảng cách ở server (vị trí client trễ khi máy tải).
      let mD=null; for(let k=0;k<16;k++){ const an=k*Math.PI/8; await test(B,"goto",{x:Math.round(fe0.x+AUTO_PARTY.leash/2*Math.cos(an)),y:Math.round(fe0.y+AUTO_PARTY.leash/2*Math.sin(an))}); mD=(await infoA({bid:fr})).beast?.mateD?.[0]; if(Number.isFinite(mD)&&mD<=AUTO_PARTY.leash-16) break; }
      let pc=null; for(let t=0;t<3000&&pc!==fr;t+=100){ await test(A,"clear",{all:true,keep:true,but:fr}); pc=await pk(A); if(pc!==fr) await sleep(100); }
      ok(pc===fr,`AH4 tổ đội: đối chứng, đồng đội đứng trong leash (cách con ${mD} pixel) thì người kia chọn con đó (chọn ${pc}, fr ${fr})`);
      // keep(): A đã chọn con khi B trong leash, rồi B ra xa hơn leash (đọc ở server) thì sau ≥ 2 nhịp quyết định (clock) A phải bỏ con (trừ khi đã
      // đánh trúng nó / nó đang đánh A, khi đó keep() miễn leash). B vẫn đứng yên (nợ nhịp) nên chỉ có A thả nợ và tự chọn.
      await test(A,"auto",{pace:0});
      let sk=null; for(let t=0;t<3000&&sk?.target!==fr;t+=100){ await test(A,"clear",{all:true,keep:true,but:fr}); sk=await infoA({bid:fr}); if(sk.target!==fr) await sleep(100); }
      await test(B,"goto",B0);
      const mD2=(await infoA({bid:fr})).beast?.mateD?.[0], c0=(await infoA()).clock; let sk2=null;
      for(let t=0;t<4000;t+=100){ await test(A,"clear",{all:true,keep:true,but:fr}); /* con tự nhiên hồi sinh gần hơn thì A đổi sang nó, không phải do leash */ sk2=await infoA({bid:fr}); if(sk2.clock>=c0+2/AUTO_HZ+0.25) break; await sleep(100); }
      const exempt=!!sk2?.beast&&(sk2.beast.hit||sk2.beast.target===A.room.sessionId);
      ok(sk?.target===fr&&Number.isFinite(mD2)&&mD2>AUTO_PARTY.leash&&(sk2?.target!==fr||exempt),`AH4 tổ đội: keep(): A đã chọn con khi đồng đội trong leash, đồng đội ra xa (${mD2} pixel) thì sau 2 nhịp A bỏ con (đã chọn ${sk?.target===fr}, còn nhắm ${sk2?.target}, fr ${fr}, miễn leash ${exempt})`);
      await test(B,"auto",{pace:0});
      } finally { await autoOp(A,"off"); await autoOp(B,"off"); await test(A,"auto",{paceNext:0}); await test(B,"auto",{paceNext:0}); } // nợ nhịp 3600 không được rò sang bài sau
    }
    await test(A,"clear",{all:true,keep:true});
    // "Chỉ quanh chỗ đứng", hai neo cách nhau xa hơn R + leash: không kéo nhau, mỗi người săn con ở vùng mình.
    const NR={...PT,scope:"near",radius:AUTO_RADIUS_MIN/TILE}; await autoOp(A,"set",{cfg:NR}); await autoOp(B,"set",{cfg:NR});
    await test(A,"goto",home); let farAt=null;
    for(const [dx,dy] of [[640,0],[-640,0],[0,640],[0,-640],[560,0],[-560,0],[0,560],[0,-560],[480,0],[-480,0]]){
      await test(B,"goto",{x:home.x+dx,y:home.y+dy}); if(Math.hypot(me(B).x-home.x,me(B).y-home.y)>AUTO_RADIUS_MIN+AUTO_PARTY.leash+8&&!inCamp(me(B).x,me(B).y)){ farAt={x:me(B).x,y:me(B).y}; break; } }
    if(!farAt) console.log("  ⚠ bỏ qua neo xa nhau: không tìm được chỗ đứng đủ xa");
    else{
      await test(A,"clear",{all:true,keep:true}); await test(B,"clear",{all:true,keep:true});
      const ba=(await test(A,"spawn",{tier:0,dx:60,dy:0,years:20,hpx:80}))?.bid; await test(B,"goto",farAt); const bb2=(await test(B,"spawn",{tier:0,dx:60,dy:0,years:20,hpx:80}))?.bid;
      await test(A,"auto",{pace:0}); await test(B,"auto",{pace:0});
      await autoOp(A,"on"); await autoOp(B,"on"); let ta=false, tb=false, loops=0;
      for(let t=0;t<6000&&!(ta&&tb);t+=250){ const sa=await infoA(), sb=await test(B,"auto"); ta||=sa.target===ba; tb||=sb?.target===bb2; if(sa.why||sb?.why) loops++; await sleep(250); }
      ok(ta&&tb&&loops===0,`AH4 tổ đội "chỉ quanh chỗ đứng", neo cách nhau ${(Math.hypot(farAt.x-home.x,farAt.y-home.y)/TILE).toFixed(0)} ô: mỗi người săn con ở vùng mình (A ${ta}, B ${tb}, lần đổi việc vì kẹt ${loops})`);
      await autoOp(A,"off"); await autoOp(B,"off");
    }
    await test(A,"goto",home); await test(B,"goto",{x:home.x+16,y:home.y});
    B.room.send("party",{op:"leave"}); await sleep(300);
  }

  // ---- AH3 (#610): ưu tiên cụm quái + hồn kỹ diện rộng, nhớ chỗ hồi sinh, nghỉ hồi khi hết đan ----
  ok(AUTO_DEFAULTS.restNoPot===true&&parseAuto({}).restNoPot===true&&parseAuto({restNoPot:false}).restNoPot===false&&parseAuto({restNoPot:"x"}).restNoPot===true
    &&AUTO_AOE_MIN>=2&&AUTO_CLUSTER.bonus>0&&AUTO_REST.resume>0&&AUTO_REST.resume<=1,`AH3: restNoPot mặc định bật, bản lưu cũ / sai kiểu thì bật; AUTO_AOE_MIN ${AUTO_AOE_MIN}, AUTO_CLUSTER, AUTO_REST có số`);
  { const P3={...NEAR,years:[0,MAX_YEARS],ring:-1,bone:false,core:false,slots:[],skills:[],tienCo:false,elite:false,king:false,world:false,hp:0.45,mp:0};
    // B1: con lẻ gần hơn một chút, cụm 5 con xa hơn: chọn cụm.
    await test(A,"goto",home); await test(A,"clear",{all:true,keep:true}); await autoOp(A,"set",{cfg:P3});
    const lone=(await test(A,"spawn",{tier:0,dx:90,dy:0,years:10,hpx:50}))?.bid, pack=[];
    for(const [dx,dy] of [[-130,0],[-150,16],[-150,-16],[-170,0],[-130,24]]) pack.push((await test(A,"spawn",{tier:0,dx,dy,years:10,hpx:50}))?.bid);
    await test(A,"auto",{pace:0}); m=await autoOp(A,"on"); let pick3=null;
    for(let t=0;t<3000&&!pick3;t+=100){ pick3=(await infoA()).target; if(!pick3) await sleep(100); }
    ok(m?.on&&pick3&&pack.includes(pick3)&&pick3!==lone,`AH3 B1: con lẻ cách 90 pixel, cụm 5 con cách 130 pixel → nhắm vào cụm (${pick3===lone?"con lẻ":pack.includes(pick3)?"cụm":pick3})`);
    // B1: đông (≥ AUTO_AOE_MIN con quanh thân) thì hồn kỹ diện rộng lên trước.
    await autoOp(A,"off"); await test(A,"clear",{all:true,keep:true}); await autoOp(A,"set",{cfg:{...P3,skills:[3,2,1,0]}});
    const aoe=(await infoA()).aoe??[];
    if(!aoe.length) console.log("  ⚠ bỏ qua hồn kỹ diện rộng: võ hồn đang ra trận chưa có hồn kỹ quanh thân / trước mặt");
    else{
      for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20],[28,14]]) await test(A,"spawn",{tier:0,dx,dy,years:10,hpx:200});
      await test(A,"auto",{pace:0}); await autoOp(A,"on"); let c0=0;
      for(let t=0;t<6000&&!c0;t+=200){ c0=(await infoA()).aoeCasts; if(!c0) await sleep(200); }
      ok(c0>=1,`AH3 B1: ${AUTO_AOE_MIN}+ con quanh thân → tung hồn kỹ diện rộng trước (ô ${aoe.join(",")}, ${c0} lần)`);
    }
    await autoOp(A,"off"); await test(A,"clear",{all:true,keep:true});
    // B1b: đổi sang võ hồn có hồn kỹ quanh thân (Hạo Thiên Chùy: Chấn Địa Chùy quanh thân, Trọng Kích trước mặt) rồi kiểm luật AoE thật:
    // đông (≥ AUTO_AOE_MIN) thì tung trước và trúng ≥ 2 con một lần; ít hơn thì không tính là "đông"; bonus cụm không làm săn chậm đi.
    { const act3=A.owned.active, HV="hao_thien_chuy", Y4=[423,764,1760,5000];
      await test(A,"grant",{vohon:HV}); await waitFor(()=>A.owned.list.some(v=>v.vohon===HV),1500);
      const rowH=A.owned.list.find(v=>v.vohon===HV)?.rowId;
      await test(A,"set",{rowId:rowH,level:40,xp:0,rings:Y4}); await test(A,"rest",{s:10}); await sendTeam(A,[act3,rowH,0,0]);
      await waitFor(()=>A.room.state.players.get(A.room.sessionId)?.swCd===0,3500); A.room.send("switch",{slot:1});
      if(!await waitFor(()=>A.owned.active===rowH,1500)) console.log("  ⚠ bỏ qua AH3 hồn kỹ diện rộng thật: không đổi được sang Hạo Thiên Chùy",JSON.stringify({row:rowH,team:A.owned.team,act:A.owned.active,act3,log:A.logs.at(-1),n:A.owned.list.length}));
      else{
        await test(A,"ready"); await test(A,"goto",home);
        const P4={...P3,skills:[1,0,2,3],mp:0}, around=[[20,0],[-20,0],[0,20],[0,-20],[28,14]], hpOf=bid=>A.room.state.beasts.get(bid)?.hp, maxOf=bid=>A.room.state.beasts.get(bid)?.maxHp;
        await autoOp(A,"set",{cfg:P4});
        // Dưới ngưỡng (1 con, AUTO_AOE_MIN - 1 con): đánh bình thường, không tính là tung vì đông.
        for(const n of [1,AUTO_AOE_MIN-1]){
          await test(A,"clear",{all:true,keep:true}); await test(A,"ready"); await test(A,"goto",home);
          const mine=[]; for(const [dx,dy] of around.slice(0,n)) mine.push((await test(A,"spawn",{tier:0,dx,dy,years:10,hpx:400}))?.bid);
          await test(A,"auto",{pace:0}); m=await autoOp(A,"on"); let fought=false;
          for(let t=0;t<3500;t+=250){ await test(A,"clear",{all:true,keep:true,but:mine}); const st=await infoA(); if(st.target) fought=true; await sleep(250); } // dọn liên tục: hồn thú hồi sinh không làm đủ ngưỡng đông
          const st=await infoA();
          ok(m?.on&&fought&&st.aoeCasts===0,`AH3 B1b: ${n} con quanh thân (dưới ${AUTO_AOE_MIN}) → vẫn đánh, không tung hồn kỹ diện rộng vì đông (${st.aoeCasts} lần)`);
          await autoOp(A,"off");
        }
        // Đủ đông: tung trước, một lần tung trúng ≥ 2 con (con ngoài mục tiêu chỉ mất máu do hồn kỹ diện rộng).
        await test(A,"clear",{all:true,keep:true}); await test(A,"ready"); await test(A,"goto",home);
        const crowd=[]; for(const [dx,dy] of around) crowd.push((await test(A,"spawn",{tier:0,dx,dy,years:10,hpx:400}))?.bid);
        await test(A,"auto",{pace:0}); await autoOp(A,"on"); let c1=0, hurt=0;
        for(let t=0;t<6000&&!c1;t+=100){ await test(A,"clear",{all:true,keep:true,but:crowd}); c1=(await infoA()).aoeCasts; if(!c1) await sleep(100); }
        await sleep(300); hurt=crowd.filter(b=>hpOf(b)!==undefined&&hpOf(b)<maxOf(b)).length;
        const aoe1=(await infoA()).aoe??[];
        ok(aoe1.includes(1),`AH3 B1b: Hạo Thiên Chùy có hồn kỹ diện rộng ở ô 1 (ô ${aoe1.join(",")})`);
        ok(c1>=1&&hurt>=2,`AH3 B1b: ${crowd.length} con quanh thân → hồn kỹ diện rộng tung ${c1} lần, ${hurt} con mất máu ngay lượt đầu`);
        await autoOp(A,"off"); await test(A,"clear",{all:true,keep:true});
        // Bonus cụm (AUTO_CLUSTER.bonus) chỉ đổi thứ tự chọn: hạ một cụm không được lâu hơn hạ cùng số con rải xa (>AUTO_CLUSTER.r).
        // Hạ 5 con mất ~15–18 giây ngay ở máy dev (3 giây / con, #1000): trần 30 giây cũ chỉ dư ~1,6 lần nên runner CI chậm thì ✗ lặng. Trần chỉ chặn treo; so sánh cụm / rải dùng ms đo được.
        const CLEAR_CAP=90000;
        const clearTime=async layout=>{
          await test(A,"ready"); await test(A,"goto",home); await test(A,"clear",{all:true,keep:true});
          const ids=[]; for(const [dx,dy] of layout) ids.push((await test(A,"spawn",{tier:0,dx,dy,years:10}))?.bid);
          await test(A,"auto",{pace:0}); await autoOp(A,"on"); const t0=Date.now();
          while(Date.now()-t0<CLEAR_CAP&&ids.some(b=>A.room.state.beasts.has(b))){ await test(A,"clear",{all:true,keep:true,but:ids}); await sleep(150); } // chỉ đo 5 con của bài
          const left=ids.filter(b=>A.room.state.beasts.has(b)).length; await autoOp(A,"off"); return {ms:Date.now()-t0,left};
        };
        const packL=[[120,0],[140,16],[140,-16],[160,0],[120,24]], spreadL=[[120,0],[-120,0],[0,120],[0,-120],[110,110]];
        const tp=await clearTime(packL), ts=await clearTime(spreadL);
        ok(tp.left===0&&ts.left===0&&tp.ms<=ts.ms*1.25+1500,`AH3 B1b: hạ cụm 5 con mất ${tp.ms}ms, 5 con rải xa mất ${ts.ms}ms (còn ${tp.left}/${ts.left}); bonus cụm ${AUTO_CLUSTER.bonus} không làm săn chậm`);
        // Trả võ hồn ban đầu.
        await autoOp(A,"off"); await test(A,"clear",{all:true,keep:true}); await test(A,"ready"); await test(A,"rest",{s:10});
        await waitFor(()=>A.room.state.players.get(A.room.sessionId)?.swCd===0,3500); A.room.send("switch",{slot:0});
        if(!await waitFor(()=>A.owned.active===act3,1500)) console.log("  ⚠ AH3 B1b: không trả được võ hồn ban đầu, các bài sau chạy bằng Hạo Thiên Chùy");
        await test(A,"goto",home); await autoOp(A,"set",{cfg:P3});
      }
    }
    // B2: hạ một con rồi hết quái: nhớ vùng hồi sinh, đi dạo trong vùng đó ("Đi tới chỗ hồi sinh"). Dọn liên tục để hồn thú hồi sinh không xen vào.
    await test(A,"goto",home); await autoOp(A,"set",{cfg:P3});
    const k1=(await test(A,"spawn",{tier:0,dx:30,dy:0,years:10}))?.bid;
    await test(A,"auto",{pace:0}); await autoOp(A,"on"); let remembered=0, sawSpawn=false;
    for(let t=0;t<9000&&!(remembered&&sawSpawn);t+=250){
      if(!A.room.state.beasts.has(k1)){ await test(A,"clear",{all:true,keep:true}); await test(A,"auto",{pace:0}); }
      const st=await infoA(); remembered=Math.max(remembered,st.spawns); if(st.spawning&&st.patrol) sawSpawn=true; await sleep(250);
    }
    ok(remembered>=1&&sawSpawn,`AH3 B2: hạ con ở vùng sinh → nhớ ${remembered} vùng, hết quái thì đi tới chỗ hồi sinh (thấy ${sawSpawn})`);
    await autoOp(A,"off"); await test(A,"clear",{all:true,keep:true});
    // B3: hết đan → nghỉ hồi tới AUTO_REST.resume rồi săn tiếp (không nhắm con mới khi đang nghỉ); stopNoPot thì dừng như cũ.
    for(const it of looseOf(A)) if(ITEMS.find(x=>x.id===it.code)?.hp) A.room.send("discard",{id:it.id});
    await sleep(500);
    await test(A,"goto",home); await autoOp(A,"set",{cfg:{...P3,restNoPot:true,stopNoPot:false}});
    await test(A,"auto",{pace:0}); m=await autoOp(A,"on"); await test(A,"hurt",{pct:70}); await sleep(600);
    // Con mồi lang thang ±BEAST_WANDER mỗi trục quanh chỗ sinh (hx, hy); findTarget chỉ nhận con trong AUTO_RADIUS quanh NEO (không lề), mà neo
    // lệch vị trí người chơi 14–28 pixel (#1550). Nên đặt theo neo đọc ở server, không theo chỗ đứng: hook spawn cộng dx, dy vào vị trí người chơi.
    // Con mồi ở neo + BDX theo một trong 4 trục (chọn bên dưới). Con mồi chỉ đi tới điểm trong ô hx ± BEAST_WANDER mỗi trục quanh điểm sinh, nên:
    //   cách neo xa nhất = hypot(BDX + BEAST_WANDER, BEAST_WANDER) = hypot(210, 60) ≈ 218,4 < AUTO_RADIUS 240 (dư 21,6 pixel cho sai số làm tròn / đẩy nền);
    //   vị trí đặt thật được đo lại (BDX ±6) vì hook spawn kẹp điểm sinh vào bản đồ: neo sát mép thì con mồi bị kéo về 96 pixel (đã gặp), biên trên mất nghĩa;
    //   ô lang thang phải cách người chơi > BEAST_AGGRO_R (con mồi không tự đánh lúc nghỉ).
    const BDX=150;
    // Người chơi còn đi về neo sau lệnh hurt thì vị trí ở client cũ hơn server: chờ tới khi đang nghỉ (đứng yên) và vị trí không đổi giữa hai lần đọc.
    let px=null, py=null; for(let t=0;t<8000;t+=300){ const st=await infoA(), x=me(A).x, y=me(A).y; if(st.resting&&x===px&&y===py) break; px=x; py=y; await sleep(300); }
    const st0=await infoA(); let pl={x:me(A).x,y:me(A).y}; const an=st0.anchor??pl; // chụp vị trí người chơi trước khi đặt (me(A) là đối tượng sống)
    const bound=Math.hypot(BDX+BEAST_WANDER,BEAST_WANDER);
    ok(bound<AUTO_RADIUS,`AH3 B3: con mồi dự định cách neo ${BDX} pixel, cận xấu nhất tính được ${bound.toFixed(1)} < ${AUTO_RADIUS}`);
    // Hướng đặt: một trong 4 trục quanh neo, điểm sinh phải trong bản đồ (hook spawn kẹp vào [8, MW·TILE-8]: neo gần mép thì bị kẹp, cách neo chỉ ~96 pixel) và không vướng nền;
    // chọn hướng mà ô lang thang hx ± BEAST_WANDER xa người chơi nhất (khoảng cách từ người chơi tới hình chữ nhật), phải > BEAST_AGGRO_R.
    // Neo sát mép có thể chỉ còn hướng nằm cùng phía người chơi (lệch neo tới ~35 pixel → chỉ cách 57 < 70): khi đó đưa người chơi về đúng neo (lệch 0 → cách ≥ BDX - BEAST_WANDER = 90 > 70) rồi chọn lại.
    const gB3=solidGrid(JSON.parse(readFileSync(mapUrl(NV),"utf8"))), W=BEAST_WANDER;
    const boxD=(c)=>Math.hypot(Math.max(0,Math.abs(pl.x-c.x)-W),Math.max(0,Math.abs(pl.y-c.y)-W));
    const pick=()=>[[1,0],[-1,0],[0,1],[0,-1]].map(([ux,uy])=>({x:an.x+ux*BDX,y:an.y+uy*BDX})).filter(c=>c.x>=8+W&&c.x<=gB3.MW*TILE-8-W&&c.y>=24+W&&c.y<=gB3.MH*TILE-24-W&&![[0,0],[W,W],[-W,W],[W,-W],[-W,-W]].some(([ox,oy])=>hits(gB3,c.x+ox,c.y+oy,6,4))).sort((a,b)=>boxD(b)-boxD(a))[0];
    let spot=pick();
    if(st0.anchor&&!(spot&&boxD(spot)>BEAST_AGGRO_R)){
      await test(A,"goto",{x:Math.round(an.x),y:Math.round(an.y)}); px=null; py=null;
      for(let t=0;t<4000;t+=300){ const st=await infoA(), x=me(A).x, y=me(A).y; if(st.resting&&x===px&&y===py) break; px=x; py=y; await sleep(300); }
      pl={x:me(A).x,y:me(A).y}; spot=pick();
    }
    // Điều kiện tiền đề của bài (không phải hành vi cần kiểm): không đạt thì báo ⚠ rõ, bài hành vi bên dưới vẫn chạy và tự báo ✗ nếu bait thật sự ngoài vùng.
    if(!(st0.anchor&&spot&&boxD(spot)>BEAST_AGGRO_R)) console.log("  ⚠ AH3 B3: không dựng được vị trí đặt con mồi hợp lệ",JSON.stringify({an,pl,spot,box:spot?boxD(spot):null,anchor:!!st0.anchor}));
    else console.log(`  ℹ AH3 B3: neo ${Math.round(an.x)},${Math.round(an.y)}; bait ${Math.round(spot.x)},${Math.round(spot.y)}; người chơi lệch neo ${Math.round(Math.hypot(pl.x-an.x,pl.y-an.y))} pixel, ô lang thang cách người chơi ≥ ${boxD(spot).toFixed(0)} > ${BEAST_AGGRO_R}`);
    const bait=(await test(A,"spawn",{tier:0,dx:Math.round((spot?.x??an.x+BDX)-pl.x),dy:Math.round((spot?.y??an.y)-pl.y),years:10,hpx:50}))?.bid; let rested=false, baited=false, back=false, maxDA=null;
    // Vị trí đặt thật (chưa lang thang, hx = điểm sinh) phải đúng BDX quanh neo: nếu nền chắn / bị kẹp thì biên ở trên không còn đúng.
    await waitFor(()=>A.room.state.beasts.get(bait),1500); const b0=A.room.state.beasts.get(bait), d0=b0?Math.round(Math.hypot(b0.x-an.x,b0.y-an.y)):null;
    ok(d0!==null&&Math.abs(d0-BDX)<=6,`AH3 B3: con mồi vừa đặt cách neo ${d0??"không thấy"} pixel (cần ${BDX} ±6, nên cận xấu nhất ≤ ${(bound+6).toFixed(1)} < ${AUTO_RADIUS})`);
    for(let t=0;t<40000&&!back;t+=300){ const st=await infoA(), bb=A.room.state.beasts.get(bait); if(bb&&st.anchor) maxDA=Math.max(maxDA??0,Math.round(Math.hypot(bb.x-st.anchor.x,bb.y-st.anchor.y)));
      if(st.resting) { rested=true; if(st.target===bait) baited=true; } else if(rested&&st.target===bait) back=true; await sleep(300); }
    ok(m?.on&&rested&&!baited&&back&&me(A).hp>=me(A).maxHp*AUTO_REST.resume-1,`AH3 B3: hết đan, sinh lực dưới ${AUTO_DEFAULTS.hp*100}% → nghỉ (không nhắm con mới), tới ${AUTO_REST.resume*100}% sinh lực săn tiếp (nghỉ ${rested}, nhắm khi nghỉ ${baited}, săn tiếp ${back}, sinh lực ${me(A).hp}/${me(A).maxHp})`);
    console.log(`  ℹ AH3 B3: con mồi cách neo tối đa ${maxDA??"không đo được"} pixel (giới hạn ${AUTO_RADIUS}, tính ${bound.toFixed(1)}), neo lệch người chơi lúc đặt ${Math.round(Math.hypot(pl.x-an.x,pl.y-an.y))} pixel`);
    await autoOp(A,"off"); await test(A,"clear",{all:true,keep:true}); await test(A,"goto",home);
    await autoOp(A,"set",{cfg:{...P3,restNoPot:true,stopNoPot:true}}); await test(A,"auto",{pace:0}); m=await autoOp(A,"on"); await test(A,"hurt",{pct:70});
    ok(m?.on&&await stopped(A,/hết đan/,4000),`AH3 B3: chọn "hết đan thì dừng" → dừng, không nghỉ (${A.autoMsg?.why})`);
  }
  await test(A,"goto",home); await autoOp(A,"set",{cfg});

  // #215: khi tự săn, mỗi lần nhặt / hạ hồn thú server chỉ gửi phần túi đổi (tin "bagd"), không gửi lại cả túi.
  { const st=A.bagStat;
    ok(st.bagd.n>0&&st.bagd.max<1500,`đồng bộ túi khi tự săn: ${st.bagd.n} tin "bagd", trung bình ${Math.round(st.bagd.bytes/Math.max(1,st.bagd.n))} byte, lớn nhất ${st.bagd.max} byte (cả túi "bag": ${st.bag.n} tin, lớn nhất ${st.bag.max} byte)`); }
  // ---- Túi đầy ----
  await test(A,"goto",home); await test(A,"clear");
  const free=()=>A.bag.slots-looseOf(A).length;
  await test(A,"give",{code:RING_ITEM,qty:Math.max(0,free()-1),years:20}); await waitFor(()=>free()===1,2000);
  { A.bagLast=null; A.room.send("bag"); await waitFor(()=>A.bagLast?.k==="bag",2000); const full=A.bagLast?.n??0;
    A.bagLast=null; await test(A,"give",{code:RING_ITEM,qty:1,years:20}); await waitFor(()=>A.bagLast,2000); const one=A.bagLast;
    ok(one?.k==="bagd"&&one.m.up?.length===1&&!one.m.rm&&!one.m.ord&&one.n*20<full,`túi ${looseOf(A).length} ô: thêm 1 hồn hoàn gửi ${one?.n} byte ("bagd" 1 ô), cả túi ${full} byte`);
    A.room.send("discard",{id:looseOf(A).at(-1).id}); await waitFor(()=>free()===1,2000); }
  m=await autoOp(A,"on");
  await test(A,"give",{code:RING_ITEM,qty:1,years:20});
  ok(m?.on&&await stopped(A,/túi đồ đã đầy/),`túi đầy khi đang treo: dừng (${A.autoMsg?.why})`);
  m=await autoOp(A,"on");
  ok(m&&!m.on&&/túi đồ đã đầy/.test(m.why??""),`túi đầy: không bật được (${m?.why})`);
  } finally { for(const b of [A,...extra]) await b.room.leave().catch(()=>{}); }
}
