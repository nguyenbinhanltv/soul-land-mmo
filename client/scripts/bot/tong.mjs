// Nhóm bot "tong" (#703 bước 3, tách nguyên văn từ bot-test.mjs).
import { post, sleep, waitFor, ok, bot, enter, npcSpot, talk, test } from "./lib.mjs";
import { npcDef, BAG_MAX_SLOTS, QUEST_STARTER, questChain, TONG_MON, TONG_MIN_LEVEL, TONG_SWITCH_DAYS, tongDef, tongWeek, isDaily, TONG_DAILY, TONG_POINTS, TONG_WEEK_MIN, TONG_WEEK_REWARD, TONG_POOL, TONG_BOARD_CD, tongTaskIds, tongTaskPicks, isTongTask, tongWeekDay, tongTop } from "../../../shared/data.ts";

/**
 * #215 (bot E ở thương nhân, túi đã BAG_MAX_SLOTS ô): số trang, túi dựng từ các tin "bagd" khớp cả túi xin lại, "Sắp xếp" gộp chồng
 * mảnh chưa đầy và xếp theo nhóm / loại / số năm (gửi kèm thứ tự), thứ tự giữ sau khi vào lại (items.created_at).
 */
// Tự bán từ xa (#216, mục 5.7 "Tự bán"; BOT_ONLY=sell): bộ lọc, khoá món, bán khi túi còn dưới AUTO_SELL_FREE ô trống, lưu qua lần vào
// lại, mua lại ở thương nhân, tự săn bán thay vì dừng khi túi đầy (tổng kết có dòng đã tự bán).
export async function tongTest(){
  console.log("[#196] Tông môn");
  const noon=Date.UTC(2026,9,22,5,0), mon=Date.UTC(2026,9,19)/86400000;
  ok(TONG_MON.length===4&&new Set(TONG_MON.map(t=>t.id)).size===4&&TONG_MON.every(t=>npcDef(t.npc)?.role==="tong"&&tongDef(t.id)===t)&&!tongDef("x"),"TONG_MON: 4 tông, mỗi tông một sứ giả role tong");
  ok(tongWeek(noon)===mon&&tongWeek(Date.UTC(2026,9,18,18,0))===mon&&tongWeek(Date.UTC(2026,9,18,16,0))===mon-7,
    `tongWeek: thứ Hai giờ Việt Nam (${tongWeek(noon)})`);
  const S=await bot("Tông môn","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2}), O=await bot("Tông quan sát","u_minh_linh_mieu",{sex:0,hair:1,hairCol:2,outfitCol:1});
  if(!(await test(S,"ping"))?.enabled){ console.log("  ⚠ bỏ qua tông môn (cần hook test): bật server bằng GAME_TEST=1"); await S.room.leave(); await O.room.leave(); return; }
  try{
  const MAP="thien_dau_thanh", spot=id=>npcSpot(MAP,id), nsteps=questChain(QUEST_STARTER).steps.length;
  const me=b=>b.room.state.players?.get(b.room.sessionId), seen=()=>O.room.state.players?.get(S.room.sessionId);
  async function rejoin(b){ await b.room.leave(); await sleep(400); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>me(b)&&b.bag,3000); }
  async function toThienDau(b,id){ b.travel=null; b.room.send("test",{op:"warp",mapId:MAP,x:spot(id).x,y:spot(id).y+16});
    ok(await waitFor(()=>b.travel?.mapId===MAP,4000),`${b.name}: tới Thiên Đấu Thành`); await rejoin(b); await test(b,"goto",{x:spot(id).x,y:spot(id).y+16}); }
  async function near(b,id){ await test(b,"goto",{x:spot(id).x,y:spot(id).y+16}); }
  async function act(b,op,tong){ const l=b.logs.length, n=b.tongN; b.room.send("tong",{op,tong}); await waitFor(()=>b.tongN>n,1500); await sleep(150); return b.logs.slice(l).join(" | "); } // 150 ms: bản vá state tới sau tin riêng
  const H=TONG_MON[0], T=TONG_MON[1], L=TONG_MON[2];
  await toThienDau(S,H.npc); await toThienDau(O,H.npc);
  ok(await talk(S,H.npc)===H.npc&&S.tong?.tong===""&&S.tong.wait===0&&me(S).tong===0,"nói chuyện với sứ giả: chưa thuộc tông nào, không phải chờ");
  let t=await act(S,"join",H.id); ok(/chuỗi/.test(t)&&me(S).tong===0,`chưa xong chuỗi tân thủ: từ chối (${t})`);
  await test(S,"quest",{step:nsteps,accepted:false}); await test(S,"set",{rowId:S.owned.active,level:TONG_MIN_LEVEL-1,xp:0});
  t=await act(S,"join",H.id); ok(new RegExp(`cấp ${TONG_MIN_LEVEL}`).test(t)&&me(S).tong===0,`võ hồn cấp ${TONG_MIN_LEVEL-1}: từ chối (${t})`);
  await test(S,"set",{rowId:S.owned.active,level:TONG_MIN_LEVEL,xp:0});
  t=await act(S,"join",T.id); ok(/lại gần/.test(t)&&me(S).tong===0,`đứng xa sứ giả ${T.name}: từ chối (${t})`);
  t=await act(S,"join","khong_co"); ok(/không tồn tại/.test(t)&&me(S).tong===0,`mã tông lạ: từ chối (${t})`);
  t=await act(S,"leave"); ok(/chưa thuộc/.test(t),`rời khi chưa có tông: từ chối (${t})`);
  t=await act(S,"join",H.id); ok(S.tong.tong===H.id&&me(S).tong===1&&/gia nhập/.test(t),`đủ điều kiện: gia nhập ${H.name} (${t})`);
  ok(await waitFor(()=>seen()?.tong===1,2000),"người ở gần thấy PlayerState.tong của hồn sư");
  ok(S.tong.wait>TONG_SWITCH_DAYS*86400-30&&S.tong.wait<=TONG_SWITCH_DAYS*86400,`thời gian chờ đổi tông ~${TONG_SWITCH_DAYS} ngày (${S.tong.wait} giây)`);
  t=await act(S,"join",H.id); ok(/đã là người/.test(t),`gia nhập đúng tông đang thuộc: từ chối (${t})`);
  await near(S,T.npc); t=await act(S,"join",T.id); ok(/ngày nữa/.test(t)&&me(S).tong===1,`đổi tông trước hạn: từ chối (${t})`);
  // Lưu DB: vào lại vẫn đúng tông, tân thủ và cấp còn nguyên.
  await rejoin(S); await test(S,"goto",{x:spot(H.npc).x,y:spot(H.npc).y+16});
  ok(me(S).tong===1&&await talk(S,H.npc)===H.npc&&S.tong?.tong===H.id&&S.tong.wait>0,"vào lại: vẫn thuộc tông cũ, vẫn còn thời gian chờ (lưu DB)");
  ok(await waitFor(()=>seen()?.tong===1,2000),"người quan sát vẫn thấy tên tông sau khi vào lại");
  // Đổi tông sau thời gian chờ.
  let h=await test(S,"tong",{back:TONG_SWITCH_DAYS+1}); ok(h.tong===H.id,"hook tong lùi giờ gia nhập");
  await near(S,T.npc); await talk(S,T.npc);
  ok(S.tong.wait===0,"sau thời gian chờ: không còn phải chờ");
  t=await act(S,"join",T.id); ok(S.tong.tong===T.id&&me(S).tong===2&&/rời .* gia nhập/.test(t),`đổi sang ${T.name} (${t})`);
  ok(await waitFor(()=>seen()?.tong===2,2000),"người quan sát thấy tông mới");
  // Rời tông: cần đứng gần sứ giả; rời rồi vào ngay tông khác vẫn phải chờ (không lách thời gian chờ).
  await near(S,"phat_lan_duc");
  t=await act(S,"leave"); ok(/lại gần/.test(t)&&me(S).tong===2,`rời tông khi đứng xa: từ chối (${t})`);
  await near(S,L.npc); t=await act(S,"leave"); ok(S.tong.tong===""&&me(S).tong===0&&/rời/.test(t),`rời ${T.name} (${t})`);
  ok(await waitFor(()=>seen()?.tong===0,2000),"người quan sát thấy hồn sư không còn tên tông");
  t=await act(S,"join",L.id); ok(/ngày nữa/.test(t)&&me(S).tong===0,`rời rồi vào tông khác ngay: vẫn phải chờ (${t})`);
  await test(S,"tong",{back:TONG_SWITCH_DAYS+1}); await rejoin(S); await test(S,"goto",{x:spot(L.npc).x,y:spot(L.npc).y+16});
  ok(me(S).tong===0&&await talk(S,L.npc)===L.npc&&S.tong?.tong==="","vào lại: vẫn không thuộc tông (rời đã lưu)");
  t=await act(S,"join",L.id); ok(S.tong.tong===L.id&&me(S).tong===3&&/Chúc mừng/.test(t),`hết thời gian chờ: gia nhập ${L.name} (${t})`);
  // #796: ghi DB lỗi (hook savefail only=tong, #797): rời / gia nhập không đổi gì, báo lỗi, DB giữ nguyên; lệnh thứ hai trong lúc chờ bị chặn.
  { const lag=async()=>{ await sleep(300); return (await test(S,"savefail",{n:0})).left; };
    await near(S,L.npc); await sleep(300); await test(S,"savefail",{n:1,only:"tong"});
    t=await act(S,"leave"); ok(/Không lưu được/.test(t)&&!/đã rời/.test(t)&&S.tong.tong===L.id&&me(S).tong===3&&await lag()===0,`rời tông khi ghi DB lỗi: báo lỗi, vẫn thuộc ${L.name} (${t})`);
    await rejoin(S); await test(S,"goto",{x:spot(L.npc).x,y:spot(L.npc).y+16});
    ok(me(S).tong===3&&await talk(S,L.npc)===L.npc&&S.tong?.tong===L.id,"vào lại sau lần rời lỗi: DB vẫn tông cũ, không lệch");
    t=await act(S,"leave"); ok(S.tong.tong===""&&me(S).tong===0&&/rời/.test(t),`rời tông lại (không lỗi): đúng (${t})`);
    await test(S,"tong",{back:TONG_SWITCH_DAYS+1}); await near(S,H.npc); await sleep(300); await test(S,"savefail",{n:1,only:"tong"});
    t=await act(S,"join",H.id); ok(/Không lưu được/.test(t)&&!/gia nhập/.test(t.replace(/Không lưu được[^|]*/,""))&&S.tong.tong===""&&me(S).tong===0&&await lag()===0,`gia nhập khi ghi DB lỗi: báo lỗi, chưa thuộc tông nào (${t})`);
    await rejoin(S); await test(S,"goto",{x:spot(H.npc).x,y:spot(H.npc).y+16}); await talk(S,H.npc);
    ok(me(S).tong===0&&S.tong?.tong===""&&S.tong.wait===0,"vào lại sau lần gia nhập lỗi: vẫn chưa thuộc tông, tongAt không bị ghi (không phải chờ)");
    const l0=S.logs.length, n0=S.tongN; for(let k=0;k<3;k++) S.room.send("tong",{op:"join",tong:H.id});
    await waitFor(()=>S.tongN>n0+1,2000); await sleep(400);
    ok(S.tong.tong===H.id&&me(S).tong===1&&S.logs.slice(l0).filter(x=>/Chúc mừng/.test(x)).length===1,`gia nhập bấm dồn 3 lần: chỉ một lần thành công (lệnh sau bị chặn "đang xử lý" hoặc "đã là người") (tông ${S.tong.tong}, ${me(S).tong}, ${JSON.stringify(S.logs.slice(l0))})`); }
  t=await act(S,"leave"); ok(S.tong.tong==="","rời tông cuối"); 
  }finally{ await S.room.leave().catch(()=>{}); await O.room.leave().catch(()=>{}); }
  await tongWeekTest();
}
/**
 * #197 Tông môn 2 (gọi cuối tongTest, BOT_ONLY=tong): dữ liệu tông vụ / tuần (hàm thuần); A, B vào Hạo Thiên Tông, C vào Thất Bảo Lưu Ly
 * Tông. Tông vụ chỉ ở sứ giả tông mình (người ngoài tông, sứ giả tông khác bị từ chối), trả bài cộng Hồn Tệ và TONG_POINTS điểm tuần
 * (lưu DB). Hook tpts dựng điểm tuần: A 50, B 30 (không hoạt động), C 45. Bảng tuần: điểm trung bình thành viên hoạt động, top cá nhân.
 * Qua tuần (hook tweek): A nhận thưởng hạng nhất đúng một lần (cả sau khi vào lại), C nhận thưởng thường, B không nhận. Đổi tông xoá
 * điểm tuần hiện tại (MemoryStore.setTong / PgStore như nhau).
 */
async function tongWeekTest(){
  console.log("[#197] Tông vụ, điểm tuần, bảng xếp hạng, thưởng tuần");
  const day="2026-10-22", ids=tongTaskIds(day), picks=tongTaskPicks("20261022");
  ok(TONG_DAILY.count===2&&ids.join()==="tong:20261022:0,tong:20261022:1"&&ids.every(isTongTask)&&!isTongTask("daily:20261022:0")&&!isDaily(ids[0]),"mã tông vụ tong:<yyyymmdd>:<i>, khác khảo hạch");
  ok(new Set(picks.map(t=>t.id)).size===TONG_DAILY.count&&picks.every(t=>TONG_POOL.includes(t))&&JSON.stringify(tongTaskPicks("20261022"))===JSON.stringify(picks),`bộ tông vụ ổn định theo ngày, không trùng: ${picks.map(t=>t.name).join(", ")}`);
  ok(ids.every((id,i)=>{ const c=questChain(id); return c&&c.giver===""&&c.steps.length===1&&c.steps[0].id===picks[i].id&&c.steps[0].reward.items.length===0&&c.steps[0].reward.honTe===picks[i].honTe; })&&!questChain("tong:20261022:2"),
    "questChain đọc được tông vụ (một bước, thưởng Hồn Tệ, không vật phẩm); số bài ngoài TONG_DAILY.count thì không");
  ok(tongWeekDay(Date.UTC(2026,9,19)/86400000)==="2026-10-19",`tongWeekDay: ngày thứ Hai của tuần (${tongWeekDay(Date.UTC(2026,9,19)/86400000)})`);
  ok(JSON.stringify(tongTop([{tong:"a",active:1,avg:50},{tong:"b",active:2,avg:45},{tong:"c",active:0,avg:0}]))==='["a"]'&&JSON.stringify(tongTop([{tong:"a",active:1,avg:40},{tong:"b",active:1,avg:40}]))==='["a","b"]'&&tongTop([{tong:"c",active:0,avg:0}]).length===0,
    "tongTop: tông có điểm trung bình cao nhất (bằng nhau cùng hạng nhất), không tính tông không ai hoạt động");
  const A=await bot("Tông vụ A","u_minh_linh_mieu",{sex:1,hair:1,hairCol:3,outfitCol:0}), B=await bot("Tông vụ B","u_minh_linh_mieu",{sex:0,hair:2,hairCol:0,outfitCol:3});
  const C=await bot("Tông vụ C","u_minh_linh_mieu",{sex:1,hair:2,hairCol:2,outfitCol:1});
  if(!(await test(A,"ping"))?.enabled){ console.log("  ⚠ bỏ qua tông vụ (cần hook test): bật server bằng GAME_TEST=1"); for(const b of [A,B,C]) await b.room.leave(); return; }
  const MAP="thien_dau_thanh", spot=id=>npcSpot(MAP,id), nsteps=questChain(QUEST_STARTER).steps.length, me=b=>b.room.state.players?.get(b.room.sessionId);
  const H=TONG_MON[0], T=TONG_MON[1];
  async function rejoin(b){ await b.room.leave(); await sleep(400); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>me(b)&&b.bag,3000); }
  async function near(b,id){ await test(b,"goto",{x:spot(id).x,y:spot(id).y+16}); }
  async function to(b,id){ b.travel=null; b.room.send("test",{op:"warp",mapId:MAP,x:spot(id).x,y:spot(id).y+16}); await waitFor(()=>b.travel?.mapId===MAP,4000); await rejoin(b); await near(b,id); }
  /** Gửi `tong {op…}`, chờ tin "tong" hoặc dòng log mới; trả các dòng log mới. */
  async function op(b,m){ const l=b.logs.length, n=b.tongN; b.room.send("tong",m); await waitFor(()=>b.tongN>n||b.logs.length>l,1500); await sleep(120); return b.logs.slice(l).join(" | "); }
  /** Xin bảng tông tuần (qua nhịp TONG_BOARD_CD), chờ tin "tongBoard" mới. */
  async function board(b){ await sleep(TONG_BOARD_CD*1000+60); const n=b.tboardN; b.room.send("tong",{op:"board"}); await waitFor(()=>b.tboardN>n,2000); return b.tboard; }
  async function pts(b,n){ const l=b.logs.length; await test(b,"tpts",{n}); await waitFor(()=>b.logs.slice(l).some(t=>/\[test\] điểm tông/.test(t)),2000); }
  async function join(b,t){ await test(b,"quest",{step:nsteps,accepted:false}); await test(b,"set",{rowId:b.owned.active,level:TONG_MIN_LEVEL,xp:0}); await to(b,t.npc); await op(b,{op:"join",tong:t.id}); return b.tong?.tong===t.id; }
  try{
    const w0=(await test(A,"tweek",{shift:70})).week; // tuần riêng của bài này (10 tuần sau), không lẫn điểm bài khác
    await to(A,H.npc); await talk(A,H.npc);
    ok(A.tong?.tasks?.length===TONG_DAILY.count&&A.tong.tasks.every(q=>isTongTask(q.chain)&&q.status==="offer"),`sứ giả gửi ${A.tong?.tasks?.length} tông vụ hôm nay (chưa nhận)`);
    let t=await op(A,{op:"accept",chain:A.tong.tasks[0].chain}); ok(/trong tông môn/.test(t),`chưa vào tông: không nhận tông vụ (${t})`);
    ok(await join(A,H)&&await join(B,H)&&await join(C,T),`A, B vào ${H.name}; C vào ${T.name}`);
    await near(C,H.npc); t=await op(C,{op:"accept",chain:C.tong.tasks[0].chain}); ok(/sứ giả/.test(t)&&/Thất Bảo/.test(t),`C đứng ở sứ giả tông khác: không nhận (${t})`);
    // A: một tông vụ không phải nộp đồ, nhận rồi đặt đủ mục tiêu (hook ttask), trả bài.
    await near(A,H.npc); await op(A,{op:"get"});
    const i=A.tong.tasks.findIndex(q=>!questChain(q.chain).steps[0].goals.some(g=>g.k==="give")), q0=A.tong.tasks[i], s0=questChain(q0.chain).steps[0];
    t=await op(A,{op:"accept",chain:q0.chain}); ok(A.tong.tasks[i].status==="active"&&/Nhận tông vụ/.test(t),`nhận tông vụ "${s0.name}"`);
    t=await op(A,{op:"turnin",chain:q0.chain}); ok(/Chưa xong/.test(t),`chưa đủ mục tiêu: không trả được (${t})`);
    await test(A,"ttask",{i,step:0,accepted:true,prog:s0.goals.map(g=>g.n)}); await op(A,{op:"get"});
    ok(A.tong.tasks[i].status==="ready","hook ttask: đủ mục tiêu, chờ trả");
    const coin0=A.bag.honTe; t=await op(A,{op:"turnin",chain:q0.chain});
    ok(A.tong.tasks[i].status==="done"&&new RegExp(`${TONG_POINTS} điểm`).test(t)&&await waitFor(()=>A.bag.honTe===coin0+s0.reward.honTe,1500),`trả tông vụ: +${s0.reward.honTe} đồng, +${TONG_POINTS} điểm (${t})`);
    t=await op(A,{op:"turnin",chain:q0.chain}); ok(/Đã xong/.test(t),`trả lần hai: từ chối (${t})`);
    let bd=await board(A); ok(bd?.week===w0&&bd.me===TONG_POINTS,`bảng tuần: A có ${bd?.me} điểm tuần ${bd?.week}`);
    await rejoin(A); await near(A,H.npc); await op(A,{op:"get"});
    ok(A.tong.tasks[i].status==="done"&&(await board(A))?.me===TONG_POINTS,"vào lại: tông vụ vẫn xong, điểm tuần vẫn còn (lưu DB)");
    // Điểm tuần: A 50, B 30 (dưới TONG_WEEK_MIN: không hoạt động), C 45.
    await pts(A,50-TONG_POINTS); await pts(B,30); await pts(C,45);
    bd=await board(A); const row=id=>bd.cur.tongs.find(r=>r.tong===id);
    ok(row(H.id)?.active===1&&row(H.id)?.avg===50&&row(T.id)?.active===1&&row(T.id)?.avg===45,
      `điểm trung bình thành viên hoạt động (từ ${TONG_WEEK_MIN} điểm): ${H.name} ${row(H.id)?.avg} (${row(H.id)?.active} người), ${T.name} ${row(T.id)?.avg}`);
    ok(JSON.stringify(bd.cur.top[H.id]?.map(x=>[x.name,x.points]))===JSON.stringify([[A.name,50],[B.name,30]]),`top cá nhân ${H.name}: ${JSON.stringify(bd.cur.top[H.id])}`);
    t=await op(A,{op:"claim"}); ok(/chưa đủ/.test(t),`tuần này chưa có thưởng tuần trước: từ chối (${t})`);
    // Qua tuần: thưởng tuần trước, đúng một lần, đúng hạng.
    await test(A,"tweek",{shift:77});
    bd=await board(A); ok(bd.last.week===w0&&JSON.stringify(bd.last.first)===JSON.stringify([H.id])&&bd.last.reward==="top"&&!bd.last.claimed&&bd.me===0,
      `tuần mới: tuần trước hạng nhất ${H.name}, A được thưởng ${bd.last.reward}, điểm tuần mới ${bd.me}`);
    const shards=b=>b.bag.items.filter(x=>/^manh_/.test(x.code)).reduce((a,x)=>a+x.qty,0);
    const a0=A.bag.honTe, sa0=shards(A); t=await op(A,{op:"claim"});
    ok(await waitFor(()=>A.bag.honTe===a0+TONG_WEEK_REWARD.top.honTe&&shards(A)===sa0+TONG_WEEK_REWARD.top.shards,2000),`A nhận thưởng hạng nhất: +${A.bag.honTe-a0} đồng, +${shards(A)-sa0} mảnh (${t})`);
    t=await op(A,{op:"claim"}); ok(/Đã nhận/.test(t)&&A.bag.honTe===a0+TONG_WEEK_REWARD.top.honTe,`nhận lần hai: từ chối (${t})`);
    await rejoin(A); await near(A,H.npc); t=await op(A,{op:"claim"}); ok(/Đã nhận/.test(t)&&(await board(A)).last.claimed,"vào lại: vẫn đã nhận (lượt ở DB)");
    await near(B,H.npc); t=await op(B,{op:"claim"}); ok(/chưa đủ/.test(t),`B (30 điểm, không hoạt động): không có thưởng (${t})`);
    await near(C,T.npc); const c0=C.bag.honTe, sc0=shards(C); t=await op(C,{op:"claim"});
    ok(await waitFor(()=>C.bag.honTe===c0+TONG_WEEK_REWARD.rest.honTe&&shards(C)===sc0+TONG_WEEK_REWARD.rest.shards,2000),`C (${T.name}, không hạng nhất) nhận thưởng thường: +${C.bag.honTe-c0} đồng, +${shards(C)-sc0} mảnh`);
    // Đổi tông xoá điểm tuần hiện tại.
    await pts(C,20); ok((await board(C)).me===20,"C có 20 điểm tuần mới");
    await test(C,"tong",{back:TONG_SWITCH_DAYS+1}); await near(C,H.npc); t=await op(C,{op:"join",tong:H.id});
    ok(C.tong.tong===H.id&&(await board(C)).me===0,`C đổi sang ${H.name}: điểm tuần hiện tại bỏ (${t})`);
    // Rời tông cũng xoá điểm tuần (#320): C có 60 điểm rồi rời, sang tuần sau không có thưởng tuần của tông cũ.
    await pts(C,60); ok((await board(C)).me===60,"C có 60 điểm tuần");
    await near(C,H.npc); t=await op(C,{op:"leave"});
    ok(C.tong.tong===""&&(await board(C)).me===0&&/điểm tuần này đã bỏ/.test(t),`C rời ${H.name}: điểm tuần hiện tại bỏ (${t})`);
    await test(A,"tweek",{shift:84}); bd=await board(C);
    ok(bd.last.reward==null&&!bd.last.claimed,`tuần sau: C đã rời, không có thưởng tuần của tông cũ (${bd.last.reward})`);
  }finally{
    await test(A,"tweek",{shift:0}).catch(()=>{});
    for(const b of [A,B,C]) await b.room.leave().catch(()=>{});
  }
}
