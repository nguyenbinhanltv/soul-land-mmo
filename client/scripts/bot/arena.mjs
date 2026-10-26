// Nhóm bot arena (#703 bước 4): Đại Đấu Hồn Trường 7.2, 9.7 và soát chống gian lận đấu trường #741. Tách nguyên văn từ bot-test.mjs.
import { Client } from "colyseus.js";
import { arenaAuditTest } from "../arena-audit-test.mjs";
import { WS, post, sleep, waitFor, ok, bot, enter, qtyOf, bagKey, AT, objOf, npcSpot, sendTeam, same, test, needHookSkip } from "./lib.mjs";
import { TEAM_SIZE, VOHON, HE, vohonIndex, calcStats, tierOfYears, itemDef, formatHonTe, skillsOf, buffPower, STATUS, statusBit, buffBit, TEAM_COMBAT_SECS, MAPS, MAX_RINGS, shardCode, HE_IDS, CORE_SET_FX, npcDef, CHAN_THAN_RING, ringSkill, chanThanOf, PARTY_BUFF_R, PARTY_BUFF_MULT, RES_VOHON_LEVEL, ARENA, ARENA_MAP, ARENA_SHARDS, eloAfter, arenaTeamElo, arenaCrossPairs, arenaWindow, arenaPairs, arenaRanked, ARENA_HE_DMG, CORE_FX_RULE } from "../../../shared/data.ts";

/** #741 soát chống gian lận đấu trường: bài ở module tách, nhận các hàm dùng chung. */
export function arenaAuditRun(){ return arenaAuditTest({bot,enter,test,post,waitFor,sleep,ok,npcSpot,AT,ARENA,MAPS,TEAM_SIZE}); }

/**
 * 7.2 Đại Đấu Hồn Trường: hàm thuần (Elo, cửa sổ ghép nới dần, ghép Elo gần nhất); 3 tài khoản mới ở Thiên Đấu Thành (từ BĐ6a; 7.2 là
 * Nặc Đinh Thành): xếp hàng ở NPC
 * (đứng xa / đang giao chiến bị từ chối, hủy; đang niệm đi cổng thì không bị ghép, đi cổng xong thì ra khỏi hàng chờ), ghép theo Elo gần
 * nhất, vào sân (cả đội đầy, chưa đánh được lúc đếm ngược, message ngoài trận bị chặn); trận 1 rời sân = thua; trận 2 đạn hồn kỹ và đánh
 * thường trúng đối thủ (Trúng độc), hạ hết đội (hook down) -> thắng; trận 3 không vào sân = thua; trận 4 hết giờ so % sinh lực. Mỗi trận:
 * Elo đúng eloAfter, thưởng người thắng vào túi (lưu DB), kinh nghiệm / đồ / đội hình không đổi, hết giờ kết quả thì về đúng bản đồ và vị
 * trí cũ. Bảng xếp hạng đúng thứ tự (kể cả bằng Elo thì nhiều trận thắng trước), lượt thưởng còn lại.
 * 9.7 chống dàn xếp: hàm thuần (tránh ghép lại đối thủ vừa đấu); hai tài khoản mới đấu nhau 4 trận liền (không còn ai khác nên vẫn
 * ghép lại): 3 trận đầu tính Elo và thưởng, trận 4 giao hữu (báo trước ở ArenaState.friendly; không đổi Elo / thành tích, không
 * thưởng, không mất lượt thắng có thưởng); sang ngày mới (hook day trong sân) lại tính Elo; có người thứ ba trong cửa sổ thì không ghép
 * lại đối thủ vừa đấu.
 */
export async function arenaTest(){
  console.log("[7.2] Đại Đấu Hồn Trường: ghép trận, đấu, Elo, thưởng, bảng xếp hạng");
  const K=ARENA.k, exp=(r,o)=>1/(1+10**((o-r)/400));
  ok(arenaTeamElo([1000,1100])===1050&&arenaTeamElo([1000])===1000&&arenaTeamElo([])===0,
    "Elo đội 2v2: lấy trung bình các thành viên, làm tròn và không có thành viên thì 0");
  ok(JSON.stringify(arenaCrossPairs([11,12],[21,22]))===JSON.stringify([[11,21],[11,22],[12,21],[12,22]]),
    "chống dàn xếp đội: kiểm đủ 4 cặp tài khoản chéo giữa hai bên");
  ok(eloAfter(1000,1000,1)===1000+K/2&&eloAfter(1000,1000,0)===1000-K/2&&eloAfter(1000,1000,0.5)===1000
    &&eloAfter(1200,1000,1)===Math.round(1200+K*(1-exp(1200,1000)))&&eloAfter(1000,1200,1)===Math.round(1000+K*(1-exp(1000,1200)))&&eloAfter(10,10,0)===0,
    `Elo: K=${K}, ngang nhau ±${K/2}, thắng người mạnh hơn được nhiều hơn (+${eloAfter(1000,1200,1)-1000} / +${eloAfter(1200,1000,1)-1200}), không dưới 0`);
  ok(arenaWindow(0)===ARENA.window.base&&arenaWindow(4)===ARENA.window.base+4*ARENA.window.perSec&&arenaWindow(1e6)===ARENA.window.max,
    `cửa sổ ghép ${ARENA.window.base} + ${ARENA.window.perSec}/giây chờ, tối đa ${ARENA.window.max}`);
  const P=l=>JSON.stringify(arenaPairs(l.map(([id,elo,wait=0])=>({id,elo,wait}))));
  ok(P([["a",1000],["b",1500],["c",1040]])==='[["a","c"]]',"ghép người chờ lâu nhất với Elo gần nhất trong cửa sổ, người quá xa chờ tiếp");
  ok(P([["a",1000],["b",1500]])==="[]"&&P([["a",1000,20],["b",1500]])==='[["a","b"]]',"chênh 500 Elo: chưa ghép; chờ 20 giây thì cửa sổ đủ rộng");
  ok(P([["a",1000,30],["b",1090],["c",1050],["d",1500]])==='[["a","c"]]',"nhiều người vừa cửa sổ: chọn Elo gần nhất");
  ok(MAPS[ARENA_MAP]?.kind==="arena"&&npcDef("dau_hon_truong")?.role==="arena"&&!!npcSpot(AT,"dau_hon_truong")&&!npcSpot("nac_dinh_thanh","dau_hon_truong"),
    `sân đấu riêng (kind arena), NPC Đại Đấu Hồn Trường ở ${MAPS[AT].name} (BĐ6a), không còn ở Nặc Đinh Thành`);
  // Không token: static onAuth từ chối trước khi mở phòng (#235); có token thì "không tồn tại" (matchmakeSeatTest).
  let err=""; try{ const r=await new Client(WS).joinOrCreate("map",{mapId:ARENA_MAP}); await r.leave(); }catch(e){ err=String(e?.message??e); }
  ok(/không tồn tại|không hợp lệ/.test(err),`không mở được phòng bản đồ trên sân đấu (${err})`);
  err=""; try{ const r=await new Client(WS).create("arena",{matchId:"khong_co"}); await r.leave(); }catch(e){ err=String(e?.message??e); }
  ok(/không tồn tại|invalid method/.test(err),`client không tự mở được trận đấu (${err})`); // #164: server tắt hẳn `create`

  const E=await bot("Đấu sĩ","bich_lan_xa_hoang",{sex:1,hair:1,hairCol:2,outfitCol:0});
  const F=await bot("Võ sĩ","u_minh_linh_mieu",{sex:0,hair:2,hairCol:4,outfitCol:5});
  const G=await bot("Kiếm khách","hoa_anh",{sex:0,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(E,"ping"))?.enabled){ needHookSkip("bỏ qua trận đấu (cần hook warp, aelo, down, afast): bật server bằng GAME_TEST=1"); for(const b of [E,F,G]) await b.room.leave(); return; }
  const ns=npcSpot(AT,"dau_hon_truong"), meOf=b=>b.room.state.players?.get(b.room.sessionId);
  const at=(b,dx=0)=>test(b,"goto",{x:ns.x+dx,y:ns.y+16});
  /** Hook warp sang Thiên Đấu Thành cạnh NPC (transaction đi cổng), rồi vào phòng mới như đi cổng thật. */
  async function warpTown(b){
    b.travel=null; b.room.send("test",{op:"warp",mapId:AT,x:ns.x,y:ns.y+16});
    ok(await waitFor(()=>b.travel?.mapId===AT,4000),`${b.name}: tới ${MAPS[AT].name}`);
    await b.room.leave(); await sleep(300); await back(b);
  }
  /** Vào lại phòng của bản đồ đang lưu (/api/me), chờ state, đội hình, túi đồ. */
  async function back(b){ b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>meOf(b)&&b.owned&&b.bag&&b.squad,3000); }
  /** Chờ hết nhịp xếp hàng ARENA.queueCd (#208) của `b`: tính từ lúc bot nhận tin đã đọc Elo, muộn hơn mốc server ghi. */
  const qwait=async b=>{ const w=(b.aqAt??0)+ARENA.queueCd*1000+20-Date.now(); if(w>0) await sleep(w); };
  /**
   * Gửi `arena {op}`, chờ tin "arena" k = queue (và dòng log mới khi xếp hàng). Trả dòng log mới nhất của lần này. `queue` chờ hết
   * nhịp xếp hàng trước (qwait), để bài khác không bị báo thao tác quá nhanh; xếp hàng được (đã đọc Elo) thì ghi mốc mới.
   */
  async function aop(b,op){
    if(op==="queue") await qwait(b);
    const l=b.logs.length, n=b.aqN; b.room.send("arena",{op}); await waitFor(()=>b.aqN>n&&(op!=="queue"||b.logs.length>l),2000);
    if(op==="queue"&&b.logs.slice(l).some(x=>/Đang tìm đối thủ \(Elo/.test(x))) b.aqAt=Date.now();
    await sleep(60); return b.logs.slice(l).at(-1)??""; }
  const found=b=>b.arena.filter(m=>m.k==="found").at(-1), endOf=b=>b.arena.filter(m=>m.k==="end").at(-1);
  /** Đang ở bản đồ, đã được ghép: rời phòng bản đồ, vào phòng sân đấu bằng mã phòng. */
  async function enterArena(b,match=found(b)){ const id=match?.roomId; if(!id) throw new Error(`${b.name}: thiếu mã phòng sân đấu`); await b.room.leave(); await enter(b,id); await waitFor(()=>meOf(b)&&b.owned&&b.bag&&b.squad,3000); }
  /** Hết giờ hiện kết quả (hook afast): server đóng kết nối mã 4005, bot vào lại bản đồ cũ. */
  async function kickBack(b){
    await test(b,"afast",{s:0}); ok(await waitFor(()=>b.leftCode===4005,3000),`${b.name}: hết giờ kết quả thì server đưa ra khỏi sân (mã ${b.leftCode})`);
    await back(b);
  }
  const prog=b=>JSON.stringify(b.owned.list.map(v=>[v.rowId,v.level,v.xp,v.stars,v.rings]));
  const sides=b=>[...b.room.state.sides];
  /** Kiểm Elo / thành tích của trận vừa xong: `score` của bot `b` gặp Elo `foe`. */
  function checkEnd(b,score,reason,elo0,foe,label){
    const m=endOf(b);
    ok(m&&m.score===score&&m.reason===reason&&m.elo0===elo0&&m.elo1===eloAfter(elo0,foe,score),
      `${label}: ${b.name} ${score===1?"thắng":score===0?"thua":"hòa"} (${m?.why}), Elo ${m?.elo0} → ${m?.elo1} (= eloAfter(${elo0}, ${foe}, ${score}) = ${eloAfter(elo0,foe,score)})`);
    return m;
  }
  /** Người thắng có thưởng: Hồn Tệ và mảnh vào túi (túi trong sân đã có), còn lại `left` lượt hôm nay. */
  async function checkReward(b,m,before,left){
    ok(await waitFor(()=>b.bag.honTe===before.honTe+m.reward?.honTe),`thưởng ${formatHonTe(m.reward?.honTe??0)} vào túi (${formatHonTe(before.honTe)} → ${formatHonTe(b.bag.honTe)})`);
    ok(m.reward&&ARENA_SHARDS.some(v=>shardCode(v)===m.reward.code)&&qtyOf(b,m.reward.code)===before.q(m.reward.code)+m.reward.qty&&m.reward.qty+(m.reward.coin?1:0)>=1&&m.left===left,
      `thưởng ${m.reward?.qty} ${itemDef(m.reward?.code)?.name}; còn ${m.left}/${ARENA.dailyWins} trận thắng có thưởng hôm nay`);
  }
  const snap=b=>{ const h=b.bag.honTe, items=b.bag.items.map(i=>({...i})); return { honTe:h, q:code=>items.filter(i=>i.code===code).reduce((a,i)=>a+i.qty,0), key:bagKey(b) }; };

  for(const b of [E,F,G]) await warpTown(b);
  // E có hồn hoàn vòng 1 để thử hồn kỹ (Bích Lân Độc Tiễn: 3 mũi độc) lên đối thủ.
  await test(E,"set",{rowId:E.owned.active,level:10,rings:[100]});

  // ---- Xếp hàng ở NPC ----
  { const sq=objOf(AT,"spawn"); await test(E,"goto",{x:sq.x+sq.width/2,y:sq.y+sq.height/2}); } let t=await aop(E,"queue"); ok(/lại gần/.test(t)&&!E.aq.on,`đứng xa NPC: không xếp hàng được (${t})`);
  await at(E); await test(E,"hurt",{pct:5}); t=await aop(E,"queue"); ok(/giao chiến/.test(t)&&!E.aq.on,`vừa bị đánh: không xếp hàng được (${t})`);
  // Tổ đội 2 người (7.2): trưởng nhóm xếp cho cả hai, thành phần bị khóa tới khi hủy.
  E.room.send("party",{op:"invite",name:F.name}); await sleep(300); F.room.send("party",{op:"accept",name:E.name}); await sleep(400);
  await test(E,"rest"); t=await aop(E,"queue"); ok(E.aq.on&&F.aq.on&&E.aq.elo===ARENA.startElo,`tổ đội 2 người: trưởng nhóm xếp hàng cho cả đội Elo ${E.aq.elo} (${t})`);
  t=await aop(E,"cancel"); ok(!E.aq.on&&!F.aq.on&&/hủy/.test(t),`hủy hàng chờ tổ đội: cả hai được mở khóa (${t})`);
  E.room.send("party",{op:"leave"}); await waitFor(()=>!E.party?.id&&!F.party?.id,1500); await sleep(1000);
  // Thành viên đi cổng thì cả bên ra khỏi hàng và trưởng nhóm nhận queue off + log.
  F.room.send("party",{op:"invite",name:E.name}); await sleep(250); E.room.send("party",{op:"accept",name:F.name});
  ok(await waitFor(()=>E.party?.id&&F.party?.id===E.party.id&&E.party.members.length===2&&F.party.members.length===2,1500),"tạo lại tổ đội 2 người trước bài đi cổng");
  await at(E); await at(F); await aop(F,"queue");
  ok(E.aq?.members?.length===2&&F.aq?.members?.length===2,"thành viên đi cổng: mục hàng có đủ hai thành viên");
  const travelLog=F.logs.length; { const g=objOf(AT,"portal","Về Nặc Đinh Thành"); await test(E,"goto",{x:g.x+g.width/2,y:g.y+g.height/2}); } E.travel=null; E.room.send("travel",{portal:"Về Nặc Đinh Thành"});
  ok(await waitFor(()=>E.travel?.mapId,4000)&&await waitFor(()=>F.aq&&!F.aq.on,1500)&&F.logs.slice(travelLog).some(x=>/hàng chờ.*hủy/.test(x)),`thành viên đi cổng: trưởng nhóm nhận queue off và log hủy (F.aq=${JSON.stringify(F.aq)}, queues=${JSON.stringify(F.arena.filter(m=>m.k==="queue").slice(-6))}, F.log=${F.logs.slice(travelLog).join(" | ")}, E.travel=${JSON.stringify(E.travel)})`);
  await E.room.leave(); await sleep(300); await back(E); await warpTown(E); await aop(E,"cancel"); E.room.send("party",{op:"leave"}); F.room.send("party",{op:"leave"}); await waitFor(()=>!E.party?.id&&!F.party?.id,1500);
  // Khóa cả tài khoản solo: không nhận lời mời đã có và không gửi lời mời mới khi đang chờ.
  await aop(G,"cancel"); G.room.send("party",{op:"invite",name:E.name});
  ok(await waitFor(()=>E.party?.invites?.some(i=>i.name===G.name),1500),"người mời: lời mời mới được tạo trước khi xếp đơn");
  await aop(E,"queue"); let partyLockLog=E.logs.length;
  E.room.send("party",{op:"accept",name:G.name}); await waitFor(()=>E.logs.length>partyLockLog,1500);
  ok(E.aq.on&&!E.party?.id&&/xếp hàng/.test(E.logs.slice(partyLockLog).join(" ")),"đang xếp hàng đơn: không nhận lời mời vào tổ đội");
  E.room.send("party",{op:"leave"}); await waitFor(()=>!E.party?.id&&!F.party?.id,1500); await aop(E,"cancel");
  E.room.send("party",{op:"decline",name:G.name}); await sleep(200);
  await waitFor(()=>!(E.party?.invites??[]).some(i=>i.name===G.name),1500);
  await aop(E,"queue"); partyLockLog=E.logs.length; E.room.send("party",{op:"invite",name:F.name}); await waitFor(()=>E.logs.length>partyLockLog,1500);
  ok(E.aq.on&&/xếp hàng/.test(E.logs.slice(partyLockLog).join(" ")),"đang xếp hàng đơn: không mời người khác vào tổ đội");
  await aop(E,"cancel");
  // Người mời đã xếp đơn trước khi thành viên nhận lời cũng không được lập tổ đội mới.
  G.room.send("party",{op:"invite",name:F.name}); await waitFor(()=>F.party?.invites?.some(i=>i.name===G.name),1500);
  await qwait(G); await aop(G,"queue"); partyLockLog=F.logs.length;
  F.room.send("party",{op:"accept",name:G.name}); await waitFor(()=>F.logs.length>partyLockLog,1500);
  ok(G.aq.on&&!F.party?.id&&/Người mời.*xếp hàng/.test(F.logs.slice(partyLockLog).join(" ")),`người mời đang xếp hàng đơn: thành viên không nhận lời mời (G.aq=${JSON.stringify(G.aq)}, F.party=${JSON.stringify(F.party)}, F.log=${F.logs.slice(partyLockLog).join(" | ")})`);
  await aop(G,"cancel"); F.room.send("party",{op:"decline",name:G.name}); await sleep(200);
  await waitFor(()=>!(F.party?.invites??[]).some(i=>i.name===G.name),1500);
  t=await aop(E,"queue"); ok(E.aq.on&&E.aq.elo===ARENA.startElo,`cạnh NPC: đang tìm trận, Elo khởi đầu ${E.aq.elo} (${t})`);
  t=await aop(E,"queue"); ok(/rồi/.test(t)&&E.aq.on,`xếp hàng lần hai: báo đang tìm (${t})`);
  t=await aop(E,"cancel"); ok(!E.aq.on&&/hủy/.test(t),`hủy xếp hàng (${t})`);
  // Nhịp xếp hàng (#208): xếp hàng (đọc Elo từ DB, chờ đọc xong) rồi gửi dồn cancel / queue trong một giây: chỉ lần đầu đọc DB (một
  // dòng "Đang tìm đối thủ (Elo"), các lần queue sau đều bị từ chối bằng tin log "thao tác quá nhanh"; hết nhịp thì xếp lại được.
  { const n=4; t=await aop(E,"queue"); ok(E.aq.on&&/Đang tìm đối thủ \(Elo/.test(t),`xếp hàng lại sau khi hủy (${t})`);
    const l=E.logs.length;
    for(let i=0;i<n;i++){ E.room.send("arena",{op:"cancel"}); E.room.send("arena",{op:"queue"}); } E.room.send("arena",{op:"cancel"});
    const got=()=>E.logs.slice(l), cnt=re=>got().filter(x=>re.test(x)).length;
    await waitFor(()=>cnt(/quá nhanh/)>=n&&cnt(/hủy/)>=1,2000); await sleep(300);
    ok(cnt(/Đang tìm đối thủ/)===0&&cnt(/quá nhanh/)===n&&!E.aq.on,
      `cancel / queue dồn ${n} lần trong ${ARENA.queueCd} giây: không đọc DB thêm, ${cnt(/quá nhanh/)} lần báo "${got().find(x=>/quá nhanh/.test(x))}", cuối cùng đã hủy`);
    t=await aop(E,"queue"); ok(E.aq.on&&/Đang tìm đối thủ \(Elo/.test(t),`sau ARENA.queueCd = ${ARENA.queueCd} giây: xếp hàng lại được (${t})`);
    t=await aop(E,"cancel"); ok(!E.aq.on&&/hủy/.test(t),`hủy xếp hàng (${t})`); }
  // Hủy lúc đang đọc Elo (#225/#227): F (cùng Elo khởi đầu) đang chờ; hook aslow làm chậm lần đọc DB kế tiếp của E. E xếp hàng, hủy trước khi
  // đọc xong rồi xếp lại ngay (bị báo thao tác quá nhanh): cờ bận giữ tới khi đọc cũ kết thúc, không bị hai lần đọc chồng nhau.
  // Tin "arena" k = queue: một cho cancel, một cho queue bị từ chối, một khi đọc xong; sau đó chờ thêm vài lượt ghép (500 ms một lượt).
  { const ms=1500; await at(F); await aop(F,"queue"); await qwait(E); await test(E,"aslow",{ms});
    const l=E.logs.length, n=E.aqN, got=()=>E.logs.slice(l), has=re=>got().some(x=>re.test(x));
    E.room.send("arena",{op:"queue"}); E.aqAt=Date.now(); await sleep(150);
    E.room.send("arena",{op:"cancel"}); E.room.send("arena",{op:"queue"});
    await waitFor(()=>E.aqN>=n+3,ms+3000); await sleep(1500); await test(E,"aslow",{ms:0});
    ok(F.aq.on&&!E.aq.on&&!found(E)&&!found(F)&&!has(/Đang tìm đối thủ/)&&has(/hủy/)&&has(/quá nhanh/),
      `hủy trong lúc đọc Elo (chậm ${ms} ms): đọc xong không vào hàng chờ, không bị ghép với F (${got().join(" | ")})`);
    t=await aop(F,"cancel"); ok(/hủy/.test(t),"F vẫn chờ một mình, hủy");
    await sleep(ARENA.queueCd*1000+100); t=await aop(E,"queue"); ok(E.aq.on&&/Đang tìm đối thủ/.test(t),"đọc cũ đã kết thúc: sau queueCd được xếp lại, không có lần đọc chồng");
    t=await aop(E,"cancel"); ok(!E.aq.on&&/hủy/.test(t),"hủy hàng sau khi đọc cũ kết thúc"); }
  // Đang niệm đi cổng: không bị ghép; đi cổng xong thì ra khỏi hàng chờ.
  await at(F); await aop(F,"queue"); { const g=objOf(AT,"portal","Về Nặc Đinh Thành"); await test(F,"goto",{x:g.x+g.width/2,y:g.y+g.height/2}); }
  await qwait(E); F.travel=null; F.room.send("travel",{portal:"Về Nặc Đinh Thành"}); await sleep(100); await aop(E,"queue");
  ok(await waitFor(()=>F.travel?.mapId,4000),"F đi qua cổng trong lúc đang xếp hàng");
  ok(!found(E)&&!found(F),"đang niệm đi cổng: không bị ghép trận");
  await F.room.leave(); await sleep(300); await back(F);
  t=await aop(F,"cancel"); ok(F.mapId==="nac_dinh_thanh"&&!/hủy/.test(t)&&!F.aq.on,`F sang ${MAPS[F.mapId].name}: đã ra khỏi hàng chờ khi đi cổng`);
  t=await aop(E,"cancel"); ok(/hủy/.test(t),"E vẫn trong hàng chờ một mình, hủy");
  await warpTown(F);

  // ---- Trận 1: ghép theo Elo gần nhất (E 1000 gặp G 1040, không gặp F 1500); G rời sân lúc đếm ngược = thua ----
  // G (Hỏa Ảnh, lưu phái Thiêu đốt 8.1b) có đủ 7 hồn hoàn để thử Võ Hồn Chân Thân trong sân.
  await test(G,"set",{rowId:G.owned.active,level:70,xp:0,rings:Array(CHAN_THAN_RING).fill(100)});
  await test(E,"aelo",{elo:1000}); await test(F,"aelo",{elo:1500}); await test(G,"aelo",{elo:1040});
  await at(E,-12); await at(F,0); await at(G,12);
  await aop(E,"queue"); await aop(F,"queue"); ok(E.aq.on&&F.aq.on&&E.aq.elo===1000&&F.aq.elo===1500,"Elo đọc từ DB lúc xếp hàng (hook aelo)");
  await sleep(1500); ok(!found(E)&&!found(F),"E 1000, F 1500: chưa ghép ngay");
  await aop(G,"queue");
  ok(await waitFor(()=>found(E)&&found(G),3000)&&found(E).roomId===found(G).roomId&&!found(F)&&found(E).foe===G.name,`ghép E (1000) với G (1040), không với F (1500): ${found(E)?.foe}`);
  t=await aop(F,"cancel"); ok(/hủy/.test(t),"F vẫn chờ, hủy");
  const posE=[meOf(E).x,meOf(E).y], posG=[meOf(G).x,meOf(G).y], progE=prog(E), teamE=JSON.stringify(E.owned.team)+E.owned.active, bagE=snap(E);
  await enterArena(E); await enterArena(G);
  ok(E.room.state.mapId===ARENA_MAP&&sides(E).map(s=>s.name).sort().join()===[E.name,G.name].sort().join(),`vào sân ${MAPS[ARENA_MAP].name}: ${sides(E).map(s=>`${s.name} (${s.elo})`).join(" – ")}`);
  ok(await waitFor(()=>E.room.state.phase==="ready",3000),`cả hai vào sân: đếm ngược ${E.room.state.time.toFixed(1)} giây`);
  ok([E,G].every(b=>meOf(b).hp===meOf(b).maxHp&&b.squad.list.every(s=>s.hp===s.maxHp&&!s.down))&&Math.abs(meOf(E).x-meOf(G).x)>200,"cả đội đầy sinh lực, hai bên ở hai phía sân");
  let l=E.logs.length; E.room.send("team",{slots:[0,0,0,0]}); ok(await waitFor(()=>E.logs.length>l)&&/không làm được/.test(E.logs.at(-1)),`trong sân: xếp đội bị chặn (${E.logs.at(-1)})`);
  l=E.logs.length; E.room.send("use",{id:E.bag.items[0]?.id}); ok(await waitFor(()=>E.logs.length>l)&&/không làm được/.test(E.logs.at(-1)),"trong sân: dùng đan bị chặn");
  l=E.logs.length; E.room.send("skill",{i:0}); ok(await waitFor(()=>E.logs.length>l)&&/đếm ngược/.test(E.logs.at(-1)),"đang đếm ngược: chưa dùng hồn kỹ");
  // #993: đánh thường lúc đếm ngược có báo lý do; giữ phím / bấm dồn thì chỉ báo 1 lần mỗi giây.
  l=E.logs.length; E.room.send("attack"); E.room.send("attack"); E.room.send("attack"); await sleep(400);
  ok(E.logs.slice(l).filter(x=>/đếm ngược/.test(x)).length===1,`đang đếm ngược: đánh thường bị báo lý do, bấm dồn chỉ 1 dòng (${JSON.stringify(E.logs.slice(l))})`);
  l=E.logs.length; E.room.send("fusion",{op:"start"}); ok(await waitFor(()=>E.logs.length>l)&&/không làm được/.test(E.logs.at(-1)),"trong sân: G (fusion) nhận câu từ chối của server");
  // Chân Thân lưu phái Thiêu đốt (8.1b) khi giao đấu: Hỏa Ảnh Chân Thân nổ quanh thân trúng E (Thiêu đốt, Choáng, Dễ thương).
  await test(E,"afast",{s:0}); await waitFor(()=>E.room.state.phase==="fight",2000);
  const eP=()=>G.room.state.players.get(E.room.sessionId); await test(G,"goto",{x:eP().x+30,y:eP().y}); const hpE=eP().hp;
  G.room.send("chanthan");
  ok(await waitFor(()=>meOf(G).ava>0&&eP().hp<hpE&&(eP().st&statusBit("burn"))&&(eP().st&statusBit("stun")),2000),
    `${chanThanOf("hoa_anh").name} trong sân: biến hình, trúng E ${hpE} → ${eP().hp}, Thiêu đốt + Choáng`);
  await G.room.leave();
  ok(await waitFor(()=>endOf(E),3000),"G rời sân giữa trận: trận có kết quả ngay");
  let m=checkEnd(E,1,"leave",1000,1040,"Trận 1");
  await checkReward(E,m,bagE,ARENA.dailyWins-1);
  const eloG1=eloAfter(1040,1000,0);
  await sleep(300); await back(G);
  ok(G.room.state.mapId===AT&&Math.hypot(meOf(G).x-posG[0],meOf(G).y-posG[1])<1,`G rời sân: về ${MAPS[AT].name} đúng chỗ cũ`);
  const bagE1=bagKey(E);
  await kickBack(E);
  ok(E.room.state.mapId===AT&&Math.hypot(meOf(E).x-posE[0],meOf(E).y-posE[1])<1,`E về ${MAPS[AT].name} đúng chỗ cũ (${meOf(E).x.toFixed(0)},${meOf(E).y.toFixed(0)})`);
  ok(bagKey(E)===bagE1&&prog(E)===progE&&JSON.stringify(E.owned.team)+E.owned.active===teamE,"phần thưởng đã lưu; cấp, kinh nghiệm, hồn hoàn, đội hình không đổi");

  // 8.1a trong sân: võ hồn ra trận của E có đủ 7 hồn hoàn (Võ Hồn Chân Thân) và mang hồn kỹ vòng 5 ở ô U; F lên cấp 70 để chịu các đòn thử.
  const rowE=E.owned.active; await test(E,"set",{rowId:rowE,level:70,xp:0,rings:Array(CHAN_THAN_RING).fill(100)});
  await test(E,"rest"); let n0=E.ownedMsgs; E.room.send("loadout",{rowId:rowE,skills:[4,1,2,3]}); await waitFor(()=>E.ownedMsgs>n0,1500); await sleep(80);
  ok(same(E.owned.list.find(v=>v.rowId===rowE)?.skills,[4,1,2,3]),`ở thành: xếp ${ringSkill("bich_lan_xa_hoang",4).name} (vòng 5) vào ô U`);
  for(const v of F.owned.list) await test(F,"set",{rowId:v.rowId,level:70,xp:0});
  // Cộng minh (8.2) áp cả trong sân: E có 4 võ hồn cấp RES_VOHON_LEVEL (mốc Võ hồn 1), sinh lực tối đa trong sân bằng ở thành.
  for(const vo of ["hao_thien_chuy","hoa_long"]) await test(E,"grant",{vohon:vo});
  for(const v of E.owned.list) if(v.rowId!==rowE) await test(E,"set",{rowId:v.rowId,level:RES_VOHON_LEVEL,xp:0});
  await test(E,"rest"); await waitFor(()=>E.squad,2000);
  const ev=E.owned.list.find(v=>v.rowId===E.owned.active), resHp=meOf(E).maxHp, resSquad=JSON.stringify(E.squad.list.map(s=>[s.rowId,s.maxHp]));
  ok(resHp>calcStats(vohonIndex(ev.vohon),ev.level,ev.rings.map(tierOfYears),ev.stars).maxHp,`cộng minh: E có mốc Võ hồn 1, sinh lực tối đa ${resHp} (cao hơn khi không có cộng minh)`);
  // ---- Trận 2: E gặp F; đạn hồn kỹ và đánh thường trúng đối thủ; F gục cả đội (hook down) -> E thắng ----
  await test(F,"aelo",{elo:1030});
  await aop(E,"queue"); await aop(F,"queue");
  ok(await waitFor(()=>found(E)&&found(F)&&found(E).roomId===found(F).roomId,3000),"ghép E với F");
  const eloE2=E.aq.elo, posF=[meOf(F).x,meOf(F).y], progF=prog(F), teamF=JSON.stringify(F.owned.team)+F.owned.active, bagF=bagKey(F), bagE2=snap(E);
  await enterArena(E); await enterArena(F);
  ok(meOf(E).maxHp===resHp&&JSON.stringify(E.squad.list.map(s=>[s.rowId,s.maxHp]))===resSquad,`trong sân cộng minh vẫn áp: sinh lực tối đa ${meOf(E).maxHp} = ở thành, cả đội như ở thành`);
  await waitFor(()=>E.room.state.phase==="ready",3000);
  l=E.logs.length; E.room.send("chanthan"); ok(await waitFor(()=>E.logs.length>l)&&/đếm ngược/.test(E.logs.at(-1))&&!meOf(E).ava,"đang đếm ngược: chưa biến Võ Hồn Chân Thân");
  l=E.logs.length; E.room.send("loadout",{rowId:rowE,skills:[0,1,2,3]}); ok(await waitFor(()=>E.logs.length>l)&&/không làm được/.test(E.logs.at(-1)),"trong sân: xếp ô hồn kỹ mang theo bị chặn");
  l=E.logs.length; E.room.send("fusion",{op:"start"}); ok(await waitFor(()=>E.logs.length>l)&&/không làm được/.test(E.logs.at(-1)),"trong sân: Võ Hồn Dung Hợp Kỹ bị chặn (#192)");
  await test(E,"afast",{s:0});
  ok(await waitFor(()=>E.room.state.phase==="fight",2000)&&E.arena.some(m=>m.k==="fight"),`hết đếm ngược: giao đấu ${Math.round(E.room.state.time)} giây`);
  const sid=b=>b.room.sessionId, fv=()=>E.room.state.players.get(sid(F)), sE=sides(E).findIndex(s=>s.sid===sid(E)), dir=sE===0?1:-1;
  // Dự đoán chuyển động (#50) trong sân: phòng mới nên số thứ tự input bắt đầu lại từ 0 (ở bản đồ E đã bị hook goto tăng); input kèm `s` được áp.
  ok(meOf(E).seq===0,`vào sân: số thứ tự input đặt lại (seq ${meOf(E).seq})`);
  const x0=meOf(E).x; E.room.send("input",{x:dir,y:0,s:1});
  ok(await waitFor(()=>meOf(E).seq===1&&meOf(E).seqT>0&&Math.abs(meOf(E).x-x0)>2,1500),`input {s:1} trong sân: server ghi seq 1, seqT ${meOf(E).seqT.toFixed(2)} giây, đi ${Math.abs(meOf(E).x-x0).toFixed(0)} pixel`);
  E.room.send("input",{x:0,y:0,s:2}); await waitFor(()=>meOf(E).seq===2,1500);
  await test(E,"goto",{x:fv().x-dir*40,y:fv().y});
  const hp0=fv().hp; E.room.send("skill",{i:0});
  ok(await waitFor(()=>fv().hp<hp0&&(fv().st&statusBit("poison")),2000),`${ringSkill("bich_lan_xa_hoang",4).name} (hồn kỹ vòng 5 ở ô U) trúng đối thủ: ${hp0} → ${fv().hp}, Trúng độc`);
  await test(E,"goto",{x:fv().x-dir*10,y:fv().y}); const hp1=fv().hp; E.room.send("attack");
  ok(await waitFor(()=>fv().hp<hp1,1500),`đánh thường trúng đối thủ: ${hp1} → ${fv().hp}`);
  const hp2=fv().hp; E.room.send("chanthan");
  ok(await waitFor(()=>meOf(E).ava>0&&meOf(E).avaCd>0&&fv().hp<hp2,2000),`${chanThanOf("bich_lan_xa_hoang").name} khi giao đấu: biến hình ${meOf(E).ava.toFixed(1)} giây, độc khí trúng đối thủ ${hp2} → ${fv().hp}`);
  ok(await waitFor(()=>sides(E).find(s=>s.sid===sid(F)).pct<1,1500),`thanh trận đấu: F còn ${Math.round(sides(E).find(s=>s.sid===sid(F)).pct*100)}% sinh lực cả đội`);
  for(let k=0;k<TEAM_SIZE&&!meOf(F).dead;k++) await test(F,"down");
  ok(meOf(F).dead&&await waitFor(()=>endOf(E)&&endOf(F),3000),"F gục cả đội: trận kết thúc");
  m=checkEnd(E,1,"ko",eloE2,1030,"Trận 2"); checkEnd(F,0,"ko",1030,eloE2,"Trận 2");
  await checkReward(E,m,bagE2,ARENA.dailyWins-2);
  ok(!endOf(F).reward&&bagKey(F)===bagF,"thua không mất gì: túi và Hồn Tệ của F giữ nguyên");
  const eloF2=endOf(F).elo1, eloE3=m.elo1;
  await kickBack(F);
  ok(Math.hypot(meOf(F).x-posF[0],meOf(F).y-posF[1])<1&&prog(F)===progF&&JSON.stringify(F.owned.team)+F.owned.active===teamF&&bagKey(F)===bagF&&F.squad.list.every(s=>!s.down),
    "F về đúng chỗ cũ; cấp, kinh nghiệm, đội hình, võ hồn ra trận, túi không đổi; cả đội hồi đầy");
  await kickBack(E);
  ok(!meOf(E).ava&&!meOf(E).avaCd&&[...meOf(E).cds].every(c=>c===0)&&same(E.owned.list.find(v=>v.rowId===rowE)?.skills,[4,1,2,3]),
    "về bản đồ: không mang Chân Thân / hồi chiêu ra khỏi trận; ô hồn kỹ mang theo giữ như trước trận");

  // ---- Trận 3: F gặp G, G không vào sân (bỏ trận) -> F thắng ----
  await aop(F,"queue"); await aop(G,"queue");
  ok(await waitFor(()=>found(F)&&found(G)&&found(F).roomId===found(G).roomId,3000),"ghép F với G");
  const bagF3=snap(F), eloG3=G.aq.elo; ok(eloG3===eloG1,`G thua trận 1: Elo ${eloG3} (= eloAfter(1040, 1000, 0))`);
  await enterArena(F); await test(F,"afast",{s:0});
  ok(await waitFor(()=>endOf(F),3000),"G không vào sân: hết giờ chờ thì trận có kết quả");
  // #790: bỏ cuộc trước giao đấu: F (bên còn lại) không đổi Elo, không thưởng; G (người bỏ cuộc) bị trừ Elo như thua (kiểm ở bảng xếp hạng bên dưới).
  m=endOf(F);
  ok(m&&m.score===1&&m.reason==="noshow"&&m.friendly&&m.elo0===eloF2&&m.elo1===eloF2&&!m.reward&&m.rec.wins===0&&bagKey(F)===bagF3.key,
    `Trận 3: F thắng vì G bỏ cuộc nhưng không đổi Elo (${m?.elo0} → ${m?.elo1}), không thưởng, không tính thắng`);
  await G.room.leave(); await sleep(300); await back(G);
  ok(G.room.state.mapId===AT,`G (đã ghép mà không vào sân) vẫn ở ${MAPS[AT].name}`);
  await kickBack(F);
  const eloF3=m.elo1, eloG4=eloAfter(eloG3,eloF2,0); // G bỏ cuộc: trừ Elo đúng như thua

  // 8.1c (lưu phái Cảm điện): E đưa Lam Điện Bá Vương Long và Yêu Hồ đủ 10 hồn hoàn vào đội, mang tuyệt kỹ ở ô U.
  const LD="lam_dien_ba_vuong_long", YH="yeu_ho";
  for(const vo of [LD,YH]) await test(E,"grant",{vohon:vo});
  const rowOf=vo=>E.owned.list.find(v=>v.vohon===vo).rowId, rowLD=rowOf(LD), rowYH=rowOf(YH);
  // Cấp thấp, hồn hoàn 10 năm: chỉ cần tuyệt kỹ trúng; sau tuyệt kỹ Chu Hoàng (8.1d) đội F không được gục hết (trận 4 thắng theo %).
  for(const r of [rowLD,rowYH]) await test(E,"set",{rowId:r,level:40,xp:0,rings:Array(MAX_RINGS).fill(10)});
  await test(E,"rest",{s:TEAM_COMBAT_SECS+1});
  for(const r of [rowLD,rowYH]){ n0=E.ownedMsgs; E.room.send("loadout",{rowId:r,skills:[9,4,5,-1]}); await waitFor(()=>E.ownedMsgs>n0,1500); await sleep(80); }
  ok([rowLD,rowYH].every(r=>same(E.owned.list.find(v=>v.rowId===r)?.skills,[9,4,5,-1])),"ở thành: Lam Điện Bá Vương Long, Yêu Hồ mang tuyệt kỹ ở ô U");

  // ---- Trận 4: E gặp F, hết giờ: E còn đủ sinh lực, F mất một nửa -> E thắng theo % ----
  // 8.1d trong sân: E ra trận Tử Vong Chu Hoàng (10 hồn hoàn) mang tuyệt kỹ Tử Vong Thiên Võng ở ô U.
  await test(E,"grant",{vohon:"tu_vong_chu_hoang"}); const rowC=E.owned.list.find(v=>v.vohon==="tu_vong_chu_hoang").rowId, ultC=ringSkill("tu_vong_chu_hoang",9);
  await test(E,"set",{rowId:rowC,level:100,xp:0,rings:Array(10).fill(100)}); await test(E,"rest",{s:TEAM_COMBAT_SECS+1});
  await sendTeam(E,[rowC,0,0,0]); await sendTeam(E,[rowC,rowLD,rowYH,0]); n0=E.ownedMsgs; E.room.send("loadout",{rowId:rowC,skills:[9,0,1,2]}); await waitFor(()=>E.ownedMsgs>n0,1500); await sleep(80);
  ok(E.owned.active===rowC&&same(E.owned.list.find(v=>v.rowId===rowC)?.skills,[9,0,1,2]),`ở thành: E ra trận Tử Vong Chu Hoàng, ${ultC.name} ở ô U`);
  await aop(E,"queue"); await aop(F,"queue");
  ok(await waitFor(()=>found(E)&&found(F)&&found(E).roomId===found(F).roomId,3000),`ghép E (${E.aq.elo}) với F (${F.aq.elo})`);
  await enterArena(E); await enterArena(F); await waitFor(()=>E.room.state.phase==="ready",3000);
  await test(E,"afast",{s:0}); await waitFor(()=>E.room.state.phase==="fight",2000);
  // Tuyệt kỹ trúng đối thủ: sát thương và trạng thái có trên hồn sư (Trói, Trúng độc, Câm lặng, Cảm điện); kéo chỉ áp lên hồn thú.
  // Đếm đòn trúng F bằng tin dmg (F.hurts) như 8.1c dưới đây, không so sinh lực: tuyệt kỹ chí mạng có thể hạ võ hồn ra trận của F, F tự
  // đổi sang võ hồn còn đầy sinh lực (trạng thái vẫn ở trên hồn sư) nên sinh lực sau đòn có thể cao hơn trước (#217).
  {
    const d4=sides(E).findIndex(s=>s.sid===sid(E))===0?1:-1; await test(E,"goto",{x:fv().x-d4*90,y:fv().y}); await sleep(150);
    const hpF=fv().hp, fx0=fv().x, bf=F.fxs.length, actF=F.owned.active; F.hurts=[]; E.room.send("skill",{i:0});
    const has=s=>(fv().st&statusBit(s))!==0, hit=()=>F.hurts.find(m=>m.v<0);
    ok(await waitFor(()=>hit()&&["root","poison","silence","shock"].every(has),2000)&&Math.abs(fv().x-fx0)<2
      &&await waitFor(()=>F.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===sid(E)),800),
      `${ultC.name} (8.1d) trong sân: trúng F ${-(hit()?.v??0)}${hit()?.crit?" (chí mạng)":""} (sinh lực ${hpF} → ${fv().hp}${F.owned.active!==actF?", võ hồn ra trận gục, tự đổi":""}),`+
      ` Trói + Trúng độc + Câm lặng + Cảm điện, F không bị kéo, F thấy fx tuyệt kỹ`+
      ` [F có ${["root","poison","silence","shock"].filter(has).join("+")}, lệch x ${(fv().x-fx0).toFixed(1)}, cách E ${Math.hypot(meOf(E).x-fv().x,meOf(E).y-fv().y).toFixed(0)},`+
      ` fx ${F.fxs.slice(bf).map(f=>f.k).join(",")}, log E ${JSON.stringify(E.logs.slice(-1))}]`);
  }
  // 8.1c trong sân: đổi sang Lam Điện Bá Vương Long (ô U còn hồi chiêu chung của tuyệt kỹ vừa tung: đặt lại bằng hook ready).
  await waitFor(()=>meOf(E).swCd===0,3500); E.room.send("switch",{slot:E.owned.team.indexOf(rowLD)});
  ok(await waitFor(()=>E.owned.active===rowLD,1500),"E đổi sang Lam Điện Bá Vương Long trong sân"); await test(E,"ready");
  // 8.1c trong sân: tuyệt kỹ Lam Điện (sét tìm mục tiêu Cảm điện ngoài vùng) trúng F đang Cảm điện ở xa; tuyệt kỹ Yêu Hồ gây Câm lặng,
  // Làm chậm lên F, còn Mê hoặc / Mị hoặc chỉ áp lên hồn thú (5.9).
  {
    const f4=()=>E.room.state.players.get(F.room.sessionId), ldU=ringSkill(LD,9), yhU=ringSkill(YH,9), dx=meOf(E).x<f4().x?-1:1;
    await test(F,"pst",{s:"shock",secs:20}); await waitFor(()=>f4().st&statusBit("shock"),1000);
    // Đếm đòn trúng F bằng tin dmg (F.hurts): võ hồn của F có thể gục và tự đổi nên không so sinh lực.
    await test(E,"goto",{x:f4().x+dx*(ldU.r+50),y:f4().y}); const dd=Math.hypot(meOf(E).x-f4().x,meOf(E).y-f4().y); E.fxs=[]; F.hurts=[]; E.room.send("skill",{i:0});
    ok(await waitFor(()=>F.hurts.filter(m=>m.v<0).length>=ldU.n&&(f4().st&statusBit("stun")),3000)&&E.fxs.some(f=>f.k==="zap"),
      `${ldU.name} trong sân: F Cảm điện cách ${dd.toFixed(0)} (ngoài vùng ${ldU.r}, trong ${ldU.shockR}) vẫn trúng sét ${F.hurts.filter(m=>m.v<0).length}/${ldU.n} đợt (${F.hurts.map(m=>-m.v).join("/")}), Choáng, fx zap`);
    await waitFor(()=>meOf(E).swCd===0,3500); E.room.send("switch",{slot:E.owned.team.indexOf(rowYH)});
    ok(await waitFor(()=>E.owned.active===rowYH,1500),"E đổi sang Yêu Hồ trong sân");
    // Ô U còn hồi chiêu chung của tuyệt kỹ Lam Điện (hồi chiêu theo ô khi đổi võ hồn, 8.1a): đặt lại bằng hook ready.
    await test(E,"ready"); await test(E,"goto",{x:f4().x+dx*40,y:f4().y}); F.hurts=[]; E.room.send("skill",{i:0});
    ok(await waitFor(()=>F.hurts.some(m=>m.v<0)&&(f4().st&statusBit("silence"))&&(f4().st&statusBit("slow")),2000)&&!(f4().st&(statusBit("charm")|statusBit("allure"))),
      `${yhU.name} trong sân: trúng F ${F.hurts.map(m=>-m.v).join("/")}, Câm lặng + Làm chậm; Mê hoặc chỉ áp lên hồn thú`);
  }
  await test(F,"hurt",{pct:50}); await test(E,"afast",{s:0});
  ok(await waitFor(()=>endOf(E)&&endOf(F),3000),"hết giờ: trận có kết quả");
  m=checkEnd(E,1,"time",eloE3,eloF3,"Trận 4"); checkEnd(F,0,"time",eloF3,eloE3,"Trận 4");
  // Tin "arena end" đi riêng với bản vá state (winner, pct): chờ state thay vì đọc ngay.
  const pctOf=b=>sides(E).find(s=>s.sid===sid(b))?.pct;
  ok(await waitFor(()=>E.room.state.winner===sides(E).findIndex(s=>s.sid===sid(E))&&pctOf(E)===1&&pctOf(F)<1,1500),
    `so sinh lực cả đội: E ${Math.round(pctOf(E)*100)}%, F ${Math.round(pctOf(F)*100)}% [winner ${E.room.state.winner}, pct E ${pctOf(E)}, F ${pctOf(F)}]`);
  const eloE4=m.elo1, eloF4=endOf(F)?.elo1;
  await kickBack(E); await kickBack(F);

  // ---- Bảng xếp hạng ----
  async function top(b){ await sleep(ARENA.topCd*1000+50); const n=b.topN; b.room.send("arena",{op:"top"}); b.room.send("arena",{op:"top"}); await waitFor(()=>b.topN>n,2000); await sleep(300); return b.topN-n; }
  ok(await top(E)===1,"xin bảng xếp hạng dồn dập: chỉ trả một lần");
  let L=E.top.list; const idx=n=>L.findIndex(r=>r.name===n);
  ok(L.length<=ARENA.topN&&L.every((r,i)=>!i||L[i-1].elo>r.elo||(L[i-1].elo===r.elo&&L[i-1].wins>=r.wins)),`top ${L.length}: Elo giảm dần, bằng Elo thì nhiều trận thắng trước`);
  ok(E.top.me?.elo===eloE4&&E.top.me.wins===3&&E.top.me.losses===0&&L.find(r=>r.me)?.name===E.name&&E.top.left===ARENA.dailyWins-3,
    `E: hạng ${E.top.me?.rank}, Elo ${E.top.me?.elo}, 3 thắng 0 thua, còn ${E.top.left} lượt thưởng hôm nay`);
  ok(L.find(r=>r.name===F.name)?.elo===eloF4&&L.find(r=>r.name===G.name)?.elo===eloG4&&idx(E.name)<idx(F.name)&&idx(E.name)<idx(G.name)&&(eloG4>eloF4)===(idx(G.name)<idx(F.name)),
    `Elo đã lưu: E ${eloE4}, F ${eloF4}, G ${eloG4} (E đầu; F không được cộng Elo vì G bỏ cuộc, #790)`);
  await test(G,"aelo",{elo:eloF4,wins:9}); await top(E); L=E.top.list;
  ok(idx(G.name)>=0&&idx(G.name)<idx(F.name),`G bằng Elo F (${eloF4}) nhưng nhiều trận thắng hơn: xếp trên F`);
  for(const b of [E,F,G]) await b.room.leave();

  // ---- 9.7 Chống dàn xếp ----
  console.log("[9.7] Chống dàn xếp Đại Đấu Hồn Trường: trận tính Elo theo cặp mỗi ngày, tránh ghép lại đối thủ vừa đấu");
  const R=ARENA.rematchSecs, Q=l=>JSON.stringify(arenaPairs(l.map(([id,elo,wait=0,last])=>({id,elo,wait,last}))));
  ok(ARENA.pairDaily===3&&R===60&&arenaRanked(ARENA.pairDaily)&&!arenaRanked(ARENA.pairDaily+1),
    `ARENA.pairDaily = ${ARENA.pairDaily} trận tính Elo mỗi cặp mỗi ngày, trận thứ ${ARENA.pairDaily+1} giao hữu; tránh ghép lại trong ${R} giây chờ đầu`);
  ok(Q([["a",1000,0,"b"],["b",1000,0,"a"],["c",1050]])==='[["a","c"]]',"a, b vừa đấu nhau: a gặp c (Elo xa hơn nhưng trong cửa sổ) thay vì b");
  ok(Q([["a",1000,0],["b",1000,0,"a"],["c",1050]])==='[["a","c"]]',"chỉ một bên ghi đối thủ trước cũng tránh");
  ok(Q([["a",1000,0,"b"],["b",1000,0,"a"]])==='[["a","b"]]'&&Q([["a",1000,0,"b"],["b",1000,0,"a"],["c",1500]])==='[["a","b"]]',
    "không còn ai khác trong cửa sổ: ghép lại");
  ok(Q([["a",1000,R,"b"],["b",1000,R,"a"],["c",1050]])==='[["a","b"]]'&&Q([["a",1000,R,"b"],["b",1000,R-1,"a"],["c",1050]])==='[["a","c"]]',
    `cả hai đã chờ đủ ${R} giây: ghép lại được; một bên chưa đủ thì vẫn tránh`);
  ok(Q([["a",1000,0,"b"],["b",1000,0,"a"],["c",1050,0,"d"],["d",1050,0,"c"]])==='[["a","c"],["b","d"]]',"hai cặp vừa đấu: đổi chéo đối thủ");

  const H=await bot("Song đấu A","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:3,outfitCol:1});
  const I=await bot("Song đấu B","hoa_anh",{sex:1,hair:2,hairCol:1,outfitCol:3});
  for(const b of [H,I]) await warpTown(b);
  const fresh=(b,n,k)=>b.arena.slice(n).filter(m=>m.k===k).at(-1);
  /** H và I xếp hàng (không còn ai khác), vào sân, I gục cả đội: H thắng. Trả tin "end" mới của H và I. `day` = hook day trong sân. */
  async function duel(k,day=0){
    const nH=H.arena.length, nI=I.arena.length;
    await at(H,-12); await at(I,12); await aop(H,"queue"); await aop(I,"queue");
    ok(await waitFor(()=>fresh(H,nH,"found")&&fresh(I,nI,"found")&&fresh(H,nH,"found").roomId===fresh(I,nI,"found").roomId,3000)&&fresh(H,nH,"found").foe===I.name,
      `trận ${k}: vừa đấu nhau mà không còn ai khác xếp hàng thì vẫn ghép H với I`);
    await enterArena(H); await enterArena(I); await waitFor(()=>H.room.state.phase==="ready",3000); await sleep(200);
    const pre=H.room.state.friendly;
    if(day) await test(H,"day",{shift:day});
    await test(H,"afast",{s:0}); await waitFor(()=>H.room.state.phase==="fight",2000);
    for(let j=0;j<TEAM_SIZE&&!meOf(I).dead;j++) await test(I,"down");
    ok(await waitFor(()=>fresh(H,nH,"end")&&fresh(I,nI,"end"),3000),`trận ${k}: I gục cả đội, trận kết thúc`);
    return { h:fresh(H,nH,"end"), i:fresh(I,nI,"end"), pre };
  }
  let eH=ARENA.startElo, eI=ARENA.startElo;
  for(let k=1;k<=ARENA.pairDaily;k++){
    const bag0=snap(H), r=await duel(k);
    ok(!r.pre&&!r.h.friendly&&!r.i.friendly&&r.h.elo0===eH&&r.h.elo1===eloAfter(eH,eI,1)&&r.i.elo1===eloAfter(eI,eH,0)&&r.h.rec.wins===k,
      `trận ${k}/${ARENA.pairDaily}: tính Elo, H ${r.h.elo0} → ${r.h.elo1}, I ${r.i.elo0} → ${r.i.elo1}, H ${r.h.rec.wins} thắng`);
    await checkReward(H,r.h,bag0,ARENA.dailyWins-k);
    eH=r.h.elo1; eI=r.i.elo1;
    await kickBack(H); await kickBack(I);
  }
  {
    const bag0=bagKey(H), bagI=bagKey(I), k=ARENA.pairDaily+1, r=await duel(k);
    ok(r.pre&&H.room.state.friendly,`trận ${k}: sân báo trước giao hữu (ArenaState.friendly) từ lúc đếm ngược`);
    ok(r.h.score===1&&r.h.friendly&&r.i.friendly&&r.h.elo0===eH&&r.h.elo1===eH&&r.i.elo1===eI&&!r.h.reward&&!r.h.capped,
      `trận ${k} giao hữu: H vẫn thắng nhưng Elo giữ nguyên (H ${r.h.elo1}, I ${r.i.elo1}), không thưởng`);
    ok(r.h.rec.wins===ARENA.pairDaily&&r.i.rec.losses===ARENA.pairDaily&&r.h.left===ARENA.dailyWins-ARENA.pairDaily,
      `trận ${k}: không tính thành tích (H ${r.h.rec.wins} thắng, I ${r.i.rec.losses} thua), không mất lượt thắng có thưởng (còn ${r.h.left}/${ARENA.dailyWins})`);
    await sleep(300); ok(bagKey(H)===bag0&&bagKey(I)===bagI,"trận giao hữu: túi và Hồn Tệ hai bên không đổi");
    await kickBack(H); await kickBack(I);
  }
  {
    // Sang ngày mới (hook day trong sân: phòng sân đấu tính ngày theo giờ Việt Nam lúc hết trận): cặp lại có ARENA.pairDaily trận tính Elo.
    const k=ARENA.pairDaily+2, r=await duel(k,1);
    ok(!r.h.friendly&&r.h.elo1===eloAfter(eH,eI,1)&&r.i.elo1===eloAfter(eI,eH,0)&&!!r.h.reward,
      `trận ${k} sang ngày hôm sau: tính Elo lại (H ${r.h.elo0} → ${r.h.elo1}), có thưởng`);
    await kickBack(H); await kickBack(I);
  }
  {
    // Có người thứ ba trong cửa sổ: H (xếp hàng trước) không gặp lại I dù Elo gần hơn, gặp J.
    const J=await bot("Song đấu C","u_minh_linh_mieu",{sex:0,hair:0,hairCol:2,outfitCol:4}); await warpTown(J);
    await test(H,"aelo",{elo:1000}); await test(I,"aelo",{elo:1000}); await test(J,"aelo",{elo:1060});
    const nH=H.arena.length, nI=I.arena.length;
    await at(H,-12); await at(I,12); await at(J,0);
    await aop(H,"queue"); await aop(I,"queue"); await aop(J,"queue");
    ok(await waitFor(()=>fresh(H,nH,"found"),3000)&&fresh(H,nH,"found").foe===J.name&&!fresh(I,nI,"found"),
      `H (1000) vừa đấu I (1000), J (1060) trong cửa sổ: H gặp ${fresh(H,nH,"found")?.foe}, I chờ tiếp`);
    t=await aop(I,"cancel"); ok(/hủy/.test(t),"I vẫn chờ, hủy");
    await enterArena(H); await test(H,"afast",{s:0}); await waitFor(()=>fresh(H,nH,"end"),3000);
    await J.room.leave(); await sleep(300); await back(J);
    await kickBack(H);
    for(const b of [H,I,J]) await b.room.leave();
  }
  // ---- Tổ đội 2v2: hai tổ đội cùng kênh, vào đủ 4 người, hạ cả đội và cập nhật Elo / thưởng từng tài khoản ----
  {
    const K=await bot("Đội A1","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:0,outfitCol:0});
    const L=await bot("Đội A2","hoa_anh",{sex:1,hair:1,hairCol:1,outfitCol:1});
    const M=await bot("Đội B1","u_minh_linh_mieu",{sex:0,hair:1,hairCol:2,outfitCol:2});
    const N=await bot("Đội B2","bich_lan_xa_hoang",{sex:1,hair:1,hairCol:3,outfitCol:3});
    const all=[K,L,M,N]; for(const b of all) await warpTown(b);
    const joinParty=async(lead,mate)=>{ lead.room.send("party",{op:"invite",name:mate.name}); await sleep(250); mate.room.send("party",{op:"accept",name:lead.name}); await waitFor(()=>lead.party?.members.length===2&&mate.party?.id===lead.party?.id,1500); };
    await joinParty(K,L); await joinParty(M,N);
    await at(K,-12); await at(L,-12); await at(M,12); await at(N,12);
    const nK=K.arena.length, nL=L.arena.length, nM=M.arena.length, nN=N.arena.length;
    await aop(K,"queue"); await aop(M,"queue");
    const found2=b=>b.arena.slice(b===K?nK:b===L?nL:b===M?nM:nN).filter(m=>m.k==="found").at(-1);
    ok(await waitFor(()=>found2(K)&&found2(L)&&found2(M)&&found2(N),4000),"2v2: cả hai trưởng nhóm nhận được mã trận cho đủ 4 thành viên");
    ok(found2(K)?.foe.includes(M.name)&&found2(K)?.foe.includes(N.name)&&found2(M)?.foe.includes(K.name)&&found2(M)?.foe.includes(L.name),"2v2: tin ghép trận có đủ tên hai thành viên đối thủ");
    await Promise.all(all.map(async b=>enterArena(b)));
    await waitFor(()=>K.room.state.phase==="ready",3000);
    const ss=[...K.room.state.sides];
    ok(ss.length===2&&ss.every(s=>s.name.includes(" / "))&&ss.every(s=>s.sid.split(",").length===2),"ArenaRoom 2v2: hai bên có đủ 2 session và HUD nhận tên đội");
    await test(K,"afast",{s:0}); await waitFor(()=>K.room.state.phase==="fight",2000);
    for(const b of [M,N]) for(let j=0;j<TEAM_SIZE&&!b.room.state.players.get(b.room.sessionId).dead;j++) await test(b,"down");
    ok(await waitFor(()=>K.arena.slice(nK).some(m=>m.k==="end")&&L.arena.slice(nL).some(m=>m.k==="end")&&M.arena.slice(nM).some(m=>m.k==="end")&&N.arena.slice(nN).some(m=>m.k==="end"),4000),"2v2: hạ cả hai thành viên một bên thì trận kết thúc");
    const end2=b=>b.arena.slice(b===K?nK:b===L?nL:b===M?nM:nN).filter(m=>m.k==="end").at(-1);
    ok([K,L].every(b=>end2(b)?.score===1&&end2(b)?.elo1===eloAfter(1000,1000,1))&&[M,N].every(b=>end2(b)?.score===0&&end2(b)?.elo1===eloAfter(1000,1000,0)),"2v2: Elo cập nhật riêng từng tài khoản theo Elo đội đối thủ");
    await Promise.all(all.map(b=>kickBack(b)));

    // Thành viên rời trong pha chờ: không được chuyển sang giao đấu khi đủ các session còn lại.
    const nK2=K.arena.length, nL2=L.arena.length, nM2=M.arena.length, nN2=N.arena.length;
    const qK2=await aop(K,"queue"), qM2=await aop(M,"queue");
    const found3=b=>b.arena.slice(b===K?nK2:b===L?nL2:b===M?nM2:nN2).filter(m=>m.k==="found").at(-1);
    ok(await waitFor(()=>found3(K)&&found3(L)&&found3(M)&&found3(N),4000),"2v2 rời khi chờ: cả hai đội nhận được mã trận"
      +(found3(K)&&found3(L)&&found3(M)&&found3(N)?"":` [K: ${qK2}; M: ${qM2}; kênh ${all.map(b=>b.room.roomId).join(" ")}; nhận mã ${all.map(b=>!!found3(b)).join("/")}]`));
    await enterArena(K,found3(K)); await enterArena(M,found3(M));
    ok(K.room.state.phase==="wait","2v2 rời khi chờ: mới có một người mỗi bên thì vẫn chờ");
    await K.room.leave();
    ok(await waitFor(()=>M.arena.slice(nM2).some(m=>m.k==="end"),3000),"2v2 rời khi chờ: bên còn lại nhận kết quả ngay");
    const leftWait=()=>M.arena.slice(nM2).filter(m=>m.k==="end").at(-1);
    ok(await waitFor(()=>M.room.state.phase==="end"&&leftWait()?.reason==="leave",1000),"2v2 rời khi chờ: bên rời thua leave, không vào pha giao đấu");
    await back(K);
    if(M.room.state.phase==="end") await kickBack(M);
    else { await test(M,"afast",{s:0}); await M.room.leave().catch(()=>{}); await sleep(300); await back(M); }
    for(const b of all) await b.room.leave();
  }
  // ---- Không ghép chéo 1v2: bên đơn và bên tổ đội cùng chờ phải tiếp tục chờ ----
  {
    const Solo=await bot("Đơn lệch", "bich_lan_xa_hoang", {sex:0,hair:0,hairCol:0,outfitCol:0});
    const TeamA=await bot("Đội lệch A", "hoa_anh", {sex:1,hair:0,hairCol:1,outfitCol:1});
    const TeamB=await bot("Đội lệch B", "u_minh_linh_mieu", {sex:0,hair:0,hairCol:2,outfitCol:2});
    const mismatched=[Solo,TeamA,TeamB]; for(const b of mismatched) await warpTown(b);
    TeamA.room.send("party",{op:"invite",name:TeamB.name}); await sleep(250);
    TeamB.room.send("party",{op:"accept",name:TeamA.name}); await waitFor(()=>TeamA.party?.members.length===2&&TeamB.party?.id===TeamA.party?.id,1500);
    await at(Solo,-12); await at(TeamA,12); await at(TeamB,12);
    const nSolo=Solo.arena.length, nTeamA=TeamA.arena.length, nTeamB=TeamB.arena.length;
    await aop(Solo,"queue"); await aop(TeamA,"queue");
    await sleep(1500);
    const freshFound=(b,n)=>b.arena.slice(n).some(m=>m.k==="found");
    ok(!freshFound(Solo,nSolo)&&!freshFound(TeamA,nTeamA)&&!freshFound(TeamB,nTeamB),
      "không ghép người đơn với tổ đội 2 người thành trận 1v2");
    await aop(Solo,"cancel"); await aop(TeamA,"cancel");
    for(const b of mismatched) await b.room.leave();
  }
  // ---- #278 Xem trực tiếp: danh sách trận, vào xem (phòng sân chỉ đọc), lệnh của người xem bị bỏ qua, giới hạn người xem, về bản đồ cũ ----
  {
    console.log("[#278] Xem trực tiếp Đại Đấu Hồn Trường: danh sách, vào xem, chỉ đọc, ARENA.watchMax, rời / hết trận về bản đồ cũ");
    const WA=await bot("Đấu xem A","bich_lan_xa_hoang",{sex:0,hair:0,hairCol:1,outfitCol:3});
    const WB=await bot("Đấu xem B","hoa_anh",{sex:1,hair:0,hairCol:3,outfitCol:2});
    const V=await bot("Người xem","u_minh_linh_mieu",{sex:0,hair:1,hairCol:4,outfitCol:0});
    const V2=await bot("Người xem 2","bich_lan_xa_hoang",{sex:1,hair:2,hairCol:0,outfitCol:4});
    for(const b of [WA,WB,V,V2]) await warpTown(b);
    const last=(b,k,n=0)=>b.arena.slice(n).filter(m=>m.k===k).at(-1);
    /** Gửi `arena {op, roomId}`, chờ tin `k` mới hoặc dòng log mới; trả {m: tin mới, log: dòng log mới}. */
    async function wop(b,op,k,extra={}){
      await sleep(ARENA.topCd*1000+50); const n=b.arena.length, l=b.logs.length;
      b.room.send("arena",{op,...extra}); await waitFor(()=>last(b,k,n)||b.logs.length>l,2000);
      return { m:last(b,k,n), log:b.logs.slice(l).at(-1)??"" };
    }
    await at(WA,-12); await at(WB,12); const nA=WA.arena.length, nB=WB.arena.length;
    await aop(WA,"queue"); await aop(WB,"queue");
    const fA=()=>last(WA,"found",nA), fB=()=>last(WB,"found",nB);
    ok(await waitFor(()=>fA()&&fB()&&fA().roomId===fB().roomId,3000),"#278: ghép WA với WB");
    const rid=fA().roomId;
    for(const b of [WA,WB]){ await b.room.leave(); await enter(b,rid); await waitFor(()=>meOf(b)&&b.owned&&b.squad,3000); }
    ok(await waitFor(()=>WA.room.state.phase==="ready",3000),"WA, WB vào sân: đếm ngược");
    // Danh sách: trận đang đếm ngược có trong danh sách, đúng chế độ / tên / Elo / số người xem.
    await test(V,"goto",{x:ns.x+200,y:ns.y+16});
    let r=await wop(V,"live","live"); const row=()=>r.m?.list.find(x=>x.roomId===rid);
    ok(r.m&&r.m.list.length<=ARENA.liveN&&r.m.list.every(x=>x.phase==="ready"||x.phase==="fight")&&row()?.mode==="1v1"&&row()?.watchers===0
      &&row()?.sides.map(x=>x.name).sort().join()===[WA.name,WB.name].sort().join(),`danh sách xem trận: ${JSON.stringify(row())}`);
    r=await wop(V,"watch","watch",{roomId:rid}); ok(!r.m&&/lại gần/.test(r.log),`đứng xa biển: không vào xem được (${r.log})`);
    await at(V,0); await at(V2,6);
    await aop(V,"queue"); r=await wop(V,"watch","watch",{roomId:rid}); ok(!r.m&&/xếp hàng/.test(r.log),`đang xếp hàng: không vào xem được (${r.log})`);
    await aop(V,"cancel");
    r=await wop(V,"watch","watch",{roomId:"khong_co"}); ok(!r.m&&/không còn diễn ra/.test(r.log),`mã trận sai: từ chối (${r.log})`);
    // Giới hạn người xem ở server: hạ tối đa còn 1 (hook awatch), người thứ hai bị từ chối.
    ok((await test(V,"awatch",{max:1}))?.max===1,"hook awatch: tối đa 1 người xem mỗi trận");
    const posV=[meOf(V).x,meOf(V).y], bagV=bagKey(V), progV=prog(V);
    r=await wop(V,"watch","watch",{roomId:rid}); ok(r.m?.roomId===rid,`V được giữ chỗ xem trận (${r.log||"tin watch"})`);
    r=await wop(V2,"watch","watch",{roomId:rid}); ok(!r.m&&/đủ 1 người xem/.test(r.log),`V2: trận đủ người xem (gồm chỗ đang giữ) thì từ chối (${r.log})`);
    await V.room.leave(); await sleep(300); await enter(V,rid);
    ok(await waitFor(()=>WA.room.state.watchers===1&&V.room.state.watchers===1,2000)&&V.room.state.phase&&!V.room.state.players.has(V.room.sessionId)
      &&[...V.room.state.players.values()].map(p=>p.name).sort().join()===[WA.name,WB.name].sort().join(),
      `V vào xem: watchers ${WA.room.state.watchers}, không có hồn sư của V trên sân, V thấy cả hai người đấu`);
    // Đếm ngược có thể đã xong lúc người xem vào (afast trong lúc giao đấu sẽ kết thúc trận): chỉ rút giờ khi còn đếm ngược.
    if(WA.room.state.phase==="ready") await test(WA,"afast",{s:0});
    ok(await waitFor(()=>WA.room.state.phase==="fight",2000),"giao đấu khi đang có người xem");
    // Mọi message của người xem bị bỏ qua: không đánh, không chat bản đồ của sân, không dùng hook test, không bị ngắt kết nối.
    const hpA=meOf(WA).hp, hpB=meOf(WB).hp, chA=WA.chats.length, lV=V.logs.length; V.test=null;
    for(const [t,m] of [["attack",{}],["skill",{i:0}],["chanthan",{}],["input",{x:1,y:0}],["chat",{text:"người xem nói"}],["test",{op:"ping"}],["arena",{op:"queue"}],["party",{op:"leave"}]]) V.room.send(t,m);
    await sleep(800);
    ok(V.leftCode===null&&!V.test&&V.logs.length===lV&&!WA.chats.slice(chA).some(c=>c.text==="người xem nói")&&meOf(WA).hp===hpA&&meOf(WB).hp===hpB&&WA.room.state.phase==="fight",
      `lệnh của người xem bị bỏ qua: V vẫn kết nối, không có phản hồi / chat, hai bên không mất sinh lực`);
    // Rời xem giữa trận: về đúng chỗ cũ ở bản đồ, trận tiếp tục, người thứ hai xem được.
    V.room.send("arena",{op:"unwatch"}); ok(await waitFor(()=>V.leftCode===4005,2000),`V rời xem (mã ${V.leftCode})`);
    await back(V);
    ok(V.room.state.mapId===AT&&Math.hypot(meOf(V).x-posV[0],meOf(V).y-posV[1])<1&&bagKey(V)===bagV&&prog(V)===progV,
      `V về ${MAPS[AT].name} đúng chỗ cũ; túi, cấp, đội hình không đổi`);
    ok(await waitFor(()=>WA.room.state.watchers===0,2000)&&WA.room.state.phase==="fight"&&!endOf(WA),"người xem rời: watchers 0, trận vẫn đang giao đấu");
    const posV2=[meOf(V2).x,meOf(V2).y], bagV2=bagKey(V2);
    r=await wop(V2,"watch","watch",{roomId:rid}); ok(r.m?.roomId===rid,"V2 vào xem sau khi V rời (còn chỗ)");
    await V2.room.leave(); await sleep(300); await enter(V2,rid); await waitFor(()=>WA.room.state.watchers===1,2000);
    // Hết trận: người xem không nhận kết quả / thưởng, bị đưa ra cùng người đấu và về bản đồ cũ.
    for(let j=0;j<TEAM_SIZE&&!meOf(WB).dead;j++) await test(WB,"down");
    ok(await waitFor(()=>endOf(WA)&&endOf(WB),3000)&&!V2.arena.some(m=>m.k==="end"),"hết trận: hai bên có kết quả, người xem không nhận tin kết quả");
    await test(WA,"afast",{s:0});
    ok(await waitFor(()=>V2.leftCode===4005,3000),`hết giờ kết quả: người xem bị đưa ra (mã ${V2.leftCode})`);
    await back(V2);
    ok(V2.room.state.mapId===AT&&Math.hypot(meOf(V2).x-posV2[0],meOf(V2).y-posV2[1])<1&&bagKey(V2)===bagV2,`V2 về ${MAPS[AT].name} đúng chỗ cũ, túi không đổi`);
    for(const w of [WA,WB]){ await waitFor(()=>w.leftCode===4005,3000); await back(w); }
    await test(V,"awatch",{});
    for(const b of [WA,WB,V,V2]) await b.room.leave();
  }
  // ---- #277 Cân bằng PvP: hệ số sát thương theo hệ, hồi / khiên, khống chế, hiệu ứng bộ hồn hạch lên đối thủ (mục 5.9) ----
  // Đo bằng hook pvp (đòn / trạng thái thử lên đối thủ, đặt hiệu ứng bộ ngay trước khi làm) để không phụ thuộc chí mạng ngẫu nhiên.
  {
    console.log("[#277] Cân bằng PvP trong sân: ARENA_HE_DMG, ARENA.healMult, ARENA.ccMult, bộ hồn hạch lên đối thủ");
    const PA=await bot("Cân bằng A","bich_lan_xa_hoang",{sex:0,hair:2,hairCol:1,outfitCol:2});
    const PB=await bot("Cân bằng B","hoa_anh",{sex:1,hair:2,hairCol:2,outfitCol:1});
    for(const b of [PA,PB]) await warpTown(b);
    // Đội PA đủ bốn hệ: Bích Lân Xà Hoàng (Khống chế), Lam Điện Bá Vương Long (Cường công), Hỏa Long (Mẫn công), Xúc Xích (Phụ trợ).
    const HE_VH={khong_che:"bich_lan_xa_hoang",cuong_cong:"lam_dien_ba_vuong_long",man_cong:"hoa_long",phu_tro:"xuc_xich"};
    for(const vo of Object.values(HE_VH)) if(!PA.owned.list.some(v=>v.vohon===vo)) await test(PA,"grant",{vohon:vo});
    const rowHe=Object.fromEntries(HE_IDS.map(he=>[he,PA.owned.list.find(v=>v.vohon===HE_VH[he])?.rowId]));
    for(const v of PA.owned.list) await test(PA,"set",{rowId:v.rowId,level:70,xp:0});
    for(const v of PB.owned.list) await test(PB,"set",{rowId:v.rowId,level:70,xp:0});
    await sendTeam(PA,HE_IDS.map(he=>rowHe[he])); await test(PA,"rest"); await test(PB,"rest");
    ok(HE_IDS.every(he=>PA.owned.team.includes(rowHe[he])),`PA: đội ${HE_IDS.map(he=>`${HE[he].name} ${VOHON[vohonIndex(HE_VH[he])].name}`).join(", ")}`);
    const healTown=(await test(PA,"pvp",{k:"heal"}))?.mult;
    await at(PA,-12); await at(PB,12); const nA=PA.arena.length, nB=PB.arena.length;
    await aop(PA,"queue"); await aop(PB,"queue");
    const fA=()=>PA.arena.slice(nA).filter(m=>m.k==="found").at(-1), fB=()=>PB.arena.slice(nB).filter(m=>m.k==="found").at(-1);
    ok(await waitFor(()=>fA()&&fB()&&fA().roomId===fB().roomId,3000),"#277: ghép PA với PB");
    for(const b of [PA,PB]){ const id=(b===PA?fA():fB()).roomId; await b.room.leave(); await enter(b,id); await waitFor(()=>meOf(b)&&b.owned&&b.bag&&b.squad,3000); }
    await waitFor(()=>PA.room.state.phase==="ready",3000); await test(PA,"afast",{s:0}); await waitFor(()=>PA.room.state.phase==="fight",2000);
    // Sát thương theo hệ võ hồn ra trận của người đánh: × ARENA_HE_DMG rồi × ARENA.dmgMult, phía đối thủ × thủ theo hệ của nó.
    const D=400, want=(he,foeVh,m=1)=>Math.round(D*ARENA_HE_DMG[he]*ARENA.dmgMult*m*VOHON[foeVh].def);
    const hit=(extra={})=>test(PA,"pvp",{k:"hit",dmg:D,crit:-1,full:true,fx:{},...extra});
    const rows=[];
    for(const he of HE_IDS){
      if(PA.owned.active!==rowHe[he]){ await waitFor(()=>meOf(PA).swCd===0,4000); PA.room.send("switch",{slot:PA.owned.team.indexOf(rowHe[he])}); await waitFor(()=>PA.owned.active===rowHe[he],1500); }
      const r=await hit(); rows.push({he,ok:PA.owned.active===rowHe[he]&&r?.hit&&Math.abs(r.dealt-want(he,r.foeVh))<=1,dealt:r?.dealt,want:r?want(he,r.foeVh):"?"});
    }
    ok(rows.every(x=>x.ok),`sát thương lên đối thủ theo hệ người đánh: ${rows.map(x=>`${HE[x.he].name} ×${ARENA_HE_DMG[x.he]} ${x.dealt}/${x.want}`).join(", ")}`);
    const he=HE_IDS.find(h=>rowHe[h]===PA.owned.active);
    // Hồi sinh lực / khiên trong sân × ARENA.healMult (cùng đội, cùng võ hồn ra trận như ở thành).
    const healArena=(await test(PA,"pvp",{k:"heal"}))?.mult;
    ok(typeof healTown==="number"&&Math.abs(healArena-healTown*ARENA.healMult)<1e-9,`hồi máu / khiên: ở thành ×${healTown}, trong sân ×${healArena} (= × ARENA.healMult ${ARENA.healMult})`);
    // Khống chế từ đối thủ × ARENA.ccMult (bộ Lam Ngân 2 món không kéo dài khống chế lên hồn sư); Làm chậm không đổi.
    const st=(s,extra={})=>test(PA,"pvp",{k:"st",s,secs:10,fx:{},...extra});
    const cc=[];
    for(const s of ["stun","root","silence"]) cc.push([s,(await st(s,{fx:{cc:CORE_SET_FX.lam_ngan.two.cc}}))?.t]);
    const slow=(await st("slow"))?.t;
    ok(cc.every(([,t])=>Math.abs(t-10*ARENA.ccMult)<1e-6)&&Math.abs(slow-10)<1e-6,
      `khống chế từ đối thủ 10 giây → ${cc.map(([s,t])=>`${STATUS[s].name} ${t?.toFixed(2)}`).join(", ")} (× ARENA.ccMult, kể cả mang Lam Ngân 2 món); Làm chậm ${slow?.toFixed(2)}`);
    // Bộ Xà Hoàng 4 món: đối thủ Trúng độc đủ tầng do người mang bộ gây nhận thêm sát thương.
    const pv=CORE_SET_FX.xa_hoang.four.poisonVuln;
    await st("poison",{n:CORE_FX_RULE.poisonStacks});
    const p0=await hit(), p1=await hit({fx:{poisonVuln:pv}});
    ok(Math.abs(p0?.dealt-want(he,p0?.foeVh))<=1&&Math.abs(p1?.dealt-want(he,p1?.foeVh,1+pv))<=1,`Xà Hoàng 4 món: đối thủ ${CORE_FX_RULE.poisonStacks} tầng độc nhận ${p0?.dealt} → ${p1?.dealt} (×${1+pv})`);
    // Bộ Thất Sát 4 món: tỉ lệ chí mạng thêm chỉ khi đối thủ Phá giáp (hook bù −1 tỉ lệ: không Phá giáp thì không chí mạng).
    const live=(await test(PA,"stats"))?.live, ac=2;
    const a0=await hit({fx:{armorCrit:ac}});
    await st("armor"); const a1=await hit(), a2=await hit({fx:{armorCrit:ac}});
    ok(Math.abs(a0?.dealt-want(he,a0?.foeVh))<=1&&a1?.dealt>0&&Math.abs(a2?.dealt-Math.round(a1.dealt*live?.critMult))<=2,
      `Thất Sát 4 món: không Phá giáp thì không chí mạng (${a0?.dealt}); Phá giáp thì chí mạng ${a1?.dealt} → ${a2?.dealt} (×${live?.critMult})`);
    // Bộ Phượng Hoàng (sau các đòn đo sát thương: Thiêu đốt cháy dần sinh lực đối thủ): 2 món Thiêu đốt mạnh hơn (theo hệ người gây, tính lúc gây), 4 món thêm một tầng tối đa.
    const b0=await st("burn"), b1=await st("burn",{fx:{burn:CORE_SET_FX.phuong_hoang.two.burn}});
    ok(b0&&b1&&Math.abs(b1.v/b0.v-(1+CORE_SET_FX.phuong_hoang.two.burn))<1e-9&&b1.src,`Phượng Hoàng 2 món: Thiêu đốt lên đối thủ ${b0?.v.toFixed(2)} → ${b1?.v.toFixed(2)} mỗi tầng (×${1+CORE_SET_FX.phuong_hoang.two.burn})`);
    const n0=(await st("burn",{n:9}))?.n, n1=(await st("burn",{n:9,fx:{burnMax:CORE_SET_FX.phuong_hoang.four.burnMax}}))?.n;
    ok(n0===STATUS.burn.max&&n1===STATUS.burn.max+CORE_SET_FX.phuong_hoang.four.burnMax,`Phượng Hoàng 4 món: tầng Thiêu đốt tối đa trên đối thủ ${n0} → ${n1}`);
    // Khống chế không do đối thủ gây (như hồn thú ngoài rừng; vùng an toàn của thành không nhận trạng thái) giữ nguyên thời gian.
    const pve=(await test(PA,"pvp",{k:"st",self:true,s:"stun",secs:10}))?.t;
    ok(Math.abs(pve-10)<1e-6,`Choáng không do đối thủ gây: 10 giây giữ ${pve?.toFixed(2)}`);
    await test(PA,"afast",{s:0}); await waitFor(()=>PA.room.state.phase==="end",3000);
    await kickBack(PA); await kickBack(PB);
    const healBack=(await test(PA,"pvp",{k:"heal"}))?.mult;
    ok(healBack===healTown,`về thành: hệ số hồi máu / khiên trở lại ×${healBack}`);
    for(const b of [PA,PB]) await b.room.leave();
  }
  // ---- #279 2v2: hiệu ứng phụ trợ lan cho đồng đội cùng bên (mức × PARTY_BUFF_MULT, hồi / khiên thêm × ARENA.healMult), không lan cho đối thủ ----
  {
    console.log("[#279] 2v2: phụ trợ lan cho đồng đội cùng bên trong sân, không lan cho đối thủ");
    const SA=await bot("Lan đội A","bich_lan_xa_hoang",{sex:1,hair:1,hairCol:2,outfitCol:0});
    const SB=await bot("Lan đội B","bich_lan_xa_hoang",{sex:0,hair:2,hairCol:0,outfitCol:1});
    const OA=await bot("Lan địch A","hoa_anh",{sex:0,hair:0,hairCol:3,outfitCol:2});
    const OB=await bot("Lan địch B","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:4});
    const all=[SA,SB,OA,OB]; for(const b of all) await warpTown(b);
    // SA: Cửu Bảo Lưu Ly Tháp (Phụ trợ) 4 hồn hoàn ra trận.
    const CB="cuu_bao_luu_ly_thap", sk=skillsOf(CB), Y=[423,764,1760,5000], BP=i=>buffPower(Y[i]);
    await test(SA,"grant",{vohon:CB}); const cb=SA.owned.list.find(v=>v.vohon===CB)?.rowId, st=SA.owned.list.find(v=>v.vohon==="bich_lan_xa_hoang")?.rowId;
    await test(SA,"set",{rowId:cb,level:40,xp:0,rings:Y}); await sendTeam(SA,[cb,0,0,0]); await sendTeam(SA,[cb,st,0,0]);
    ok(SA.owned.active===cb,"SA: Cửu Bảo Lưu Ly Tháp ra trận (4 hồn hoàn)");
    const joinParty=async(lead,mate)=>{ await test(lead,"party",{pop:"rlreset"}); lead.room.send("party",{op:"invite",name:mate.name}); await sleep(250); mate.room.send("party",{op:"accept",name:lead.name});
      await waitFor(()=>lead.party?.members.length===2&&mate.party?.id===lead.party?.id,1500); };
    await joinParty(SA,SB); await joinParty(OA,OB);
    await at(SA,-12); await at(SB,-12); await at(OA,12); await at(OB,12);
    const n0=new Map(all.map(b=>[b,b.arena.length])), fnd=b=>b.arena.slice(n0.get(b)).filter(m=>m.k==="found").at(-1);
    await aop(SA,"queue"); await aop(OA,"queue");
    ok(await waitFor(()=>all.every(fnd),4000)&&new Set(all.map(b=>fnd(b).roomId)).size===1,"#279: ghép 2v2 (SA + SB gặp OA + OB)");
    for(const b of all){ const id=fnd(b).roomId; await b.room.leave(); await enter(b,id); await waitFor(()=>meOf(b)&&b.owned&&b.squad,3000); }
    await waitFor(()=>SA.room.state.phase==="ready",3000); if(SA.room.state.phase==="ready") await test(SA,"afast",{s:0});
    ok(await waitFor(()=>SA.room.state.phase==="fight",3000),"2v2: giao đấu");
    // SB (đồng đội) và OA (đối thủ) đứng trong PARTY_BUFF_R quanh SA; OB ở xa.
    const pa=meOf(SA), live=async b=>(await test(b,"stats")).live, d=b=>Math.round(Math.hypot(meOf(b).x-meOf(SA).x,meOf(b).y-meOf(SA).y));
    await test(SB,"goto",{x:pa.x,y:pa.y+60}); await test(OA,"goto",{x:pa.x,y:pa.y-60}); await sleep(200);
    ok(d(SB)<PARTY_BUFF_R&&d(OA)<PARTY_BUFF_R,`SB cách SA ${d(SB)}, OA (đối thủ) cách ${d(OA)} pixel (< ${PARTY_BUFF_R})`);
    // Lực Chi Lưu Ly (tăng công): SB nhận × PARTY_BUFF_MULT, OA không.
    await test(SA,"ready"); let lb=SB.logs.length; SA.room.send("skill",{i:0});
    await waitFor(()=>SB.logs.length>lb,1500); await waitFor(()=>(meOf(SB).buff&buffBit("atk"))!==0,1000);
    const wantAtk=sk[0].self.buff.atk*BP(0); let lB=await live(SB), lO=await live(OA);
    ok(Math.abs((lB.buffs.atk?.v??0)-wantAtk*PARTY_BUFF_MULT)<1e-9&&!lO.buffs.atk&&!OA.logs.some(t=>t.includes(SA.name)),
      `${sk[0].name} trong sân: SB công +${((lB.buffs.atk?.v??0)*100).toFixed(1)}% (× ${PARTY_BUFF_MULT}), OA không nhận`);
    // Phòng Chi Lưu Ly (khiên theo sinh lực tối đa): SA × hm (đã × ARENA.healMult), SB × hm × PARTY_BUFF_MULT, OA không.
    const hm=(await test(SA,"pvp",{k:"heal"}))?.mult;
    await test(SA,"ready"); SB.gifts=[]; lb=SB.logs.length; SA.room.send("skill",{i:3});
    await waitFor(()=>SB.logs.length>lb,1500); await waitFor(()=>meOf(SB).shield>0,1000);
    lB=await live(SB); lO=await live(OA); const la=await live(SA);
    const wantB=Math.round(lB.maxHp*sk[3].self.shield*BP(3)*hm*PARTY_BUFF_MULT), wantA=Math.round(la.maxHp*sk[3].self.shield*BP(3)*hm);
    ok(Math.abs(hm-ARENA.healMult)<1e-9&&lB.shield===wantB&&la.shield===wantA&&!lO.shield&&!lO.buffs.def,
      `${sk[3].name} trong sân: khiên SA ${la.shield} (cần ${wantA}, × healMult ${hm}), SB ${lB.shield} (cần ${wantB} = × ${PARTY_BUFF_MULT} × ${hm}), OA ${lO.shield||0}`);
    // Đồng đội đứng xa quá PARTY_BUFF_R: không nhận.
    await test(SB,"rest",{s:30}); await test(SB,"goto",{x:pa.x+PARTY_BUFF_R+80,y:pa.y}); await sleep(200);
    await test(SA,"ready"); lb=SB.logs.length; SA.room.send("skill",{i:0}); await sleep(500);
    lB=await live(SB); ok(d(SB)>PARTY_BUFF_R&&!lB.buffs.atk&&SB.logs.length===lb,`SB đứng ${d(SB)} pixel: không nhận`);
    for(const b of [OA,OB]) for(let j=0;j<TEAM_SIZE&&!meOf(b).dead;j++) await test(b,"down");
    await waitFor(()=>SA.room.state.phase==="end",3000); await test(SA,"afast",{s:0});
    for(const b of all){ await waitFor(()=>b.leftCode===4005,3000); await back(b); }
    for(const b of all) await b.room.leave();
  }
}
