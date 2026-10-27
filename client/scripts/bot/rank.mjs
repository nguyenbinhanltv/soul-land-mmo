// Nhóm bot "rank" (docs/design/xep-hang.md bước X2; BOT_ONLY=rank, nhóm 6 của BOT_PART): tin `rank {op:"boards"|"top"}` cho Cấp / Sưu tầm,
// điểm ghi lúc vào phòng và lúc rời phòng, `updated_at` ("đạt mốc trước") chỉ đổi khi điểm đổi, đội hình công khai chỉ mã võ hồn + cấp + sao.
// Phần thuần (tie-break, ẩn tài khoản test, phân trang, xoá tài khoản test) do server/scripts/rank-test.ts thử.
import { sleep, waitFor, ok, bot, enter, sendTeam, test, needHookSkip, post } from "./lib.mjs";
import { RANK_BOARDS, RANK_CD, RANK_PAGE_MAX, TEAM_SIZE } from "../../../shared/data.ts";

/** Xin một trang bảng (đợi hết nhịp RANK_CD của chính bot đó trước); trả tin `rankTop` hoặc null nếu không tới. */
async function ask(b,board,page=1,pageSize=10){
  const wait=(b.rankAt??0)+RANK_CD*1000+120-Date.now(); if(wait>0) await sleep(wait);
  const n=b.rankTopN??0; b.rankAt=Date.now(); b.room.send("rank",{op:"top",board,page,pageSize});
  return (await waitFor(()=>(b.rankTopN??0)>n,2500))?b.rankTop:null;
}
const rowsOk=t=>t.rows.every(r=>Object.keys(r).every(k=>["rank","name","score","tong","lineup","me"].includes(k))
  &&r.lineup.length<=TEAM_SIZE&&r.lineup.every(s=>Object.keys(s).sort().join()==="level,stars,vohon"));
/** Rời phòng (lần ghi cuối chụp điểm) rồi vào lại, như tài khoản thật thoát và vào lại. */
async function relog(b){
  await test(b,"goto",{x:b.room.state.players.get(b.room.sessionId).x,y:b.room.state.players.get(b.room.sessionId).y}); await b.room.leave(); await sleep(400);
  b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>b.owned&&b.room.state.players?.get(b.room.sessionId),3000); bind(b);
}
function bind(b){ b.room.onMessage("rankTop",m=>{b.rankTop=m; b.rankTopN=(b.rankTopN??0)+1;}); b.room.onMessage("rank",m=>{ if(m?.k==="boards") b.rankBoards=m; }); }

export async function rankTest(){
  console.log("[X2] Bảng Xếp Hạng: Cấp / Sưu tầm, tin rank, điểm lúc vào / rời phòng");
  ok(RANK_BOARDS.map(b=>b.code).join()==="cap,suu_tam"&&RANK_PAGE_MAX>=10,"RANK_BOARDS có Cấp (cap) và Sưu tầm (suu_tam)");
  const A=await bot("Xếp hạng A","u_minh_linh_mieu",{sex:0,hair:1,hairCol:2,outfitCol:1}), B=await bot("Xếp hạng B","u_minh_linh_mieu",{sex:1,hair:2,hairCol:0,outfitCol:3});
  for(const b of [A,B]) bind(b);
  await waitFor(()=>A.owned&&B.owned,3000);
  const me=b=>b.room.state.players?.get(b.room.sessionId);

  // ---- boards ----
  await sleep(RANK_CD*1000+120); A.room.send("rank",{op:"boards"}); await waitFor(()=>A.rankBoards,2000);
  ok(A.rankBoards?.list?.map(x=>x.board).join()==="cap,suu_tam"&&A.rankBoards.list.every(x=>x.name&&x.group&&x.period===0),`rank boards: danh mục ${JSON.stringify(A.rankBoards?.list?.map(x=>x.board))}`);

  // ---- vào phòng là có điểm: tài khoản mới đã nằm trên bảng Cấp, hạng của mình tính riêng ----
  let t=null; for(let i=0;i<4&&!t?.me;i++) t=await ask(A,"cap");
  const lvA=A.owned.list.find(v=>v.rowId===A.owned.active)?.level;
  ok(!!t&&t.board==="cap"&&t.period===0&&t.page===1&&Number.isInteger(t.total)&&t.total>=1&&typeof t.hasNext==="boolean"&&Number.isFinite(t.asOf),"rankTop cap: đủ trường trang (board, period, page, total, hasNext, asOf)");
  ok(t?.me&&t.me.rank>=1&&t.me.score===lvA&&Number.isFinite(t.me.at),`người mới đã có hạng ngay khi vào phòng (hạng ${t?.me?.rank}, điểm ${t?.me?.score} = cấp ${lvA})`);
  ok(rowsOk(t)&&t.rows.every((r,i)=>r.rank===t.rows[0].rank+i)&&t.rows.every((r,i,a)=>i===0||a[i-1].score>=r.score),"các dòng: hạng liên tiếp, điểm giảm dần, chỉ trường công khai (không Hồn Tệ, túi, bản đồ, vị trí)");
  const line=t.rows.find(r=>r.me);
  if(line) ok(line.name===A.name.replace(/ \w+$/,"")||typeof line.name==="string","dòng của mình có tên hiển thị");

  // ---- nhịp, tin lạ ----
  await sleep(RANK_CD*1000+120); const n0=A.rankTopN; A.rankAt=Date.now(); A.room.send("rank",{op:"top",board:"cap"}); A.room.send("rank",{op:"top",board:"cap"}); await sleep(700);
  ok((A.rankTopN-n0)===1,`xin dồn trong RANK_CD (${RANK_CD}s): không trả quá một lần (${A.rankTopN-n0})`);
  for(const bad of [{op:"top",board:"khong_co"},{op:"top",board:{}},{op:"top"},{op:"xoa"},{op:"top",board:"cap",page:"x",pageSize:{}}]){
    await sleep(RANK_CD*1000+120); const n=A.rankTopN, l=A.logs.length; A.rankAt=Date.now(); A.room.send("rank",bad); await sleep(400);
    const good=bad.board==="cap"; // trang / cỡ trang lạ thì kẹp lại, vẫn trả bảng
    ok(good?(A.rankTopN===n+1&&A.rankTop.page===1):(A.rankTopN===n&&A.logs.length>l),`tin ${JSON.stringify(bad)}: ${good?"kẹp về trang 1":"từ chối bằng log, không trả bảng"}`);
  }
  const big=await ask(A,"cap",1,9999);
  ok(big&&big.pageSize===RANK_PAGE_MAX&&big.rows.length<=RANK_PAGE_MAX,`pageSize quá lớn bị kẹp ${big?.pageSize}`);
  const last=await ask(A,"cap",Math.max(1,Math.ceil(big.total/big.pageSize)),big.pageSize), past=await ask(A,"cap",Math.ceil(big.total/big.pageSize)+3,big.pageSize);
  ok(last&&last.rows.length>=1&&!last.hasNext&&past&&past.rows.length===0&&past.me,"trang cuối có dòng và hết hasNext; trang quá cuối rỗng nhưng vẫn có dòng của mình");

  if(!(await test(A,"ping"))?.enabled){ needHookSkip("bỏ qua đổi cấp / võ hồn / đội hình (cần hook set, grant): bật server bằng GAME_TEST=1"); await A.room.leave(); await B.room.leave(); return; }

  // ---- Cấp: cùng cấp thì kinh nghiệm quyết thứ tự; điểm chỉ đổi sau lần ghi (rời phòng) ----
  for(const [b,xp] of [[A,10],[B,500]]) await test(b,"set",{rowId:b.owned.active,level:42,xp});
  await relog(A); await relog(B);
  let ta=await ask(A,"cap"), tb=await ask(B,"cap");
  ok(ta?.me?.score===42&&tb?.me?.score===42,`rời phòng ghi điểm: cả hai cấp 42 (${ta?.me?.score}, ${tb?.me?.score})`);
  ok(tb.me.rank<ta.me.rank,`cùng cấp 42: kinh nghiệm 500 đứng trước 10 (B ${tb.me.rank} < A ${ta.me.rank})`);
  const atA=ta.me.at;
  await test(A,"set",{rowId:A.owned.active,level:42,xp:20}); await relog(A); ta=await ask(A,"cap");
  ok(ta.me.score===42&&ta.me.at===atA,`chỉ đổi kinh nghiệm: điểm và mốc "đạt trước" (at) không đổi (${ta.me.at} = ${atA})`);
  await test(A,"set",{rowId:A.owned.active,level:43,xp:0}); await relog(A); ta=await ask(A,"cap"); tb=await ask(B,"cap");
  ok(ta.me.score===43&&ta.me.at>atA&&ta.me.rank<tb.me.rank,`lên cấp 43: điểm mới, at mới, đứng trên B (hạng ${ta.me.rank} < ${tb.me.rank})`);

  // ---- Sưu tầm + đội hình công khai ----
  const s0=await ask(A,"suu_tam");
  await test(A,"grant",{vohon:"hao_thien_chuy"}); await test(A,"grant",{vohon:"hoa_long"});
  const ids=A.owned.list.map(v=>v.rowId);
  await sendTeam(A,[ids[ids.length-1],A.owned.active,0,0]); // đổi thứ tự đội hình: chỉ `extra` đổi
  await relog(A); const s1=await ask(A,"suu_tam"), c1=await ask(A,"cap");
  ok(s1.me.score===ids.length&&s1.me.score>=(s0.me?.score??0)+2,`Sưu tầm: sở hữu ${ids.length} võ hồn, điểm ${s1.me.score}`);
  const mine=c1.rows.find(r=>r.me)??c1.rows[0];
  ok(c1.me.score===43&&c1.me.at===ta.me.at,"đổi đội hình / thêm võ hồn không đổi điểm Cấp hay mốc at của Cấp");
  if(c1.rows.some(r=>r.me)) ok(mine.lineup.length>=1&&mine.lineup[0].vohon==="hoa_long"&&rowsOk(c1),`đội hình công khai cập nhật theo đội hình đang lưu (ô 1: ${mine.lineup[0]?.vohon})`);
  await A.room.leave(); await B.room.leave();
}
