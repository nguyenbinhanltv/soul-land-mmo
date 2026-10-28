// Nhóm bot "welfare" (Phúc Lợi: Sổ Điểm Danh 21 ngày, mục 5.21, P3 #877; BOT_ONLY=welfare, nhóm 2 của BOT_PART): tin `welfare {op:"get"|"sign"|"makeup"}` qua server thật.
// Giờ do server quyết nên bot đẩy ngày bằng hook `day {shift}` (room.dayShift, như `today()`), không bao giờ gửi giờ / ngày. Phần thuần (trần quà, ranh giới 00:00,
// luật ghi có điều kiện của store) do server/scripts/welfare-test.ts thử; ở đây thử đường đi đầy đủ: ký hôm nay, ký đúp, dồn 200 `sign`, ô lạ, ký bù miễn phí / trả
// phí / hết lượt, hết chu kỳ mở chu kỳ mới, đồng hồ lùi, túi đầy, ghi lỗi hoàn lại (savefail), vào lại phòng, qua 00:00, trong sân đấu bị chặn.
import { post, sleep, waitFor, ok, bot, enter, test, qtyOf, npcSpot, AT, needHookSkip } from "./lib.mjs";
import { ASK_CD, CHECKIN, MSG_GROUP, RING_ITEM, checkinFee } from "../../../shared/data.ts";

export async function welfareTest(){
  console.log("[#877] Phúc Lợi: Sổ Điểm Danh qua server");
  const A=await bot("Phúc Lợi A","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3}), B=await bot("Phúc Lợi B","kim_vu_mieu_ung",{sex:1,hair:0,hairCol:1,outfitCol:1});
  if(!(await test(A,"ping"))?.enabled){ needHookSkip("bỏ qua Phúc Lợi (cần hook day, coin, savefail): bật server bằng GAME_TEST=1"); await A.room.leave(); await B.room.leave(); return; }
  const me=b=>b.room.state.players?.get(b.room.sessionId), R=CHECKIN.rewards, [FREE,MAX]=[CHECKIN.makeupFree,CHECKIN.makeupMax];
  await waitFor(()=>A.bag&&B.bag,3000);
  /** Gửi một tin `welfare` và chờ tin trả lời mới (mọi lần từ chối cũng trả lại trạng thái kèm `err`); trả tin đó + dòng log mới. */
  const act=async(msg,b=A)=>{ const n=b.wf.length, nl=b.logs.length; b.room.send("welfare",msg); const got=await waitFor(()=>b.wf.length>n,3000); await sleep(60); return got?{...b.wf.at(-1),log:b.logs.slice(nl).at(-1)}:null; };
  const get=async()=>{ await sleep(ASK_CD*1000+100); return act({op:"get"}); };
  // Đẩy ngày bằng hook `day`; ngày đổi thì tick (mỗi giây) tự gửi một tin welfare mới: chờ tin đó (trừ khi `push` = false) để không lẫn với trả lời của lần `act` kế tiếp.
  let cur=0;
  const shift=async(n,push=true)=>{ if(n===cur) return; cur=n; const w=A.wf.length; await test(A,"day",{shift:n}); if(push) await waitFor(()=>A.wf.length>w,4000); await sleep(120); };
  const coin=async n=>{ await test(A,"coin",{n}); return waitFor(()=>A.bag.honTe===n,1500); };
  const honTe=async want=>{ await waitFor(()=>A.bag.honTe===want,1500); return A.bag.honTe; };
  const loose=()=>A.bag.items.filter(i=>i.vohon===null||i.vohon===undefined);
  const items=g=>g.map(x=>`${x.qty}×${x.code}`).join();

  // 1. Chưa từng ký: chưa có chu kỳ, đủ lượt ký bù; tin lạ không trả gì.
  let s=await get();
  ok(s&&s.cycle===0&&s.day===-1&&s.mask===0&&s.endsAt===0&&s.makeupLeft===MAX&&s.free===FREE&&s.fee===0&&s.now>0,`get lúc mới: chưa có chu kỳ (cycle ${s?.cycle}, day ${s?.day}, lượt ký bù ${s?.makeupLeft}, miễn phí ${s?.free})`);
  { const n=A.wf.length; for(const m of [{op:"set"},{op:1},null,{},"x",{op:"makeup"},{op:"makeup",day:null}]) A.room.send("welfare",m); await sleep(500);
    ok(A.leftCode===null,"tin lạ / rỗng: vẫn kết nối"); ok(A.wf.slice(n).every(x=>x.err),"tin lạ không đổi sổ (chỉ có thể trả lỗi)"); }
  s=await act({op:"makeup",day:0}); ok(!!s?.err&&s.cycle===0,`ký bù khi chưa có chu kỳ: từ chối (${s?.err})`);

  // 2. Điểm danh hôm nay: nhận quà ô 1, mở chu kỳ 1 từ hôm nay (giờ server); client không gửi ngày.
  await coin(1000); const hon0=1000, gives0=R[0].honTe??0;
  s=await act({op:"sign",day:7,when:1,now:9e12});
  ok(s&&!s.err&&s.signed?.day===0&&s.cycle===1&&s.day===0&&s.mask===1&&s.makeupLeft===MAX,`sign: ô 1, chu kỳ 1 (mask ${s?.mask}, signed ${JSON.stringify(s?.signed&&{day:s.signed.day,honTe:s.signed.honTe})}); tham số giờ / ngày của client bị bỏ qua`);
  ok(s?.signed?.honTe===gives0&&await honTe(hon0+gives0)===hon0+gives0,`quà ô 1: +${gives0} Hồn Tệ vào túi`);
  ok(s?.endsAt>s?.now&&s.endsAt-s.now<=CHECKIN.days*86400000&&s.endsAt-s.now>(CHECKIN.days-1)*86400000-1,"endsAt: hết chu kỳ lúc 00:00 sau ô cuối (theo đồng hồ server)");
  // 3. Ký đúp và dồn 200 `sign`: không thêm ô, không thêm quà.
  s=await act({op:"sign"}); ok(!!s?.err&&/đã điểm danh/.test(s.err)&&s.mask===1,`ký lần hai cùng ngày: từ chối (${s?.err})`);
  { const before=A.bag.honTe, n=A.wf.length; for(let k=0;k<200;k++) A.room.send("welfare",{op:"sign"}); await waitFor(()=>A.wf.length>=n+200,6000); await sleep(300);
    s=await get(); ok(s?.mask===1&&A.bag.honTe===before&&A.leftCode===null,`dồn 200 sign: mask vẫn ${s?.mask}, Hồn Tệ không đổi (${before}→${A.bag.honTe}), vẫn kết nối`); }
  // 3b. Giới hạn tần suất thật (soát P5): khi GAME_TEST=1 giới hạn mặc định tắt nên ở đây bật `baglimit`; dồn 200 `sign` chỉ được xử lý cỡ burst + rate của nhóm `trade`, phần còn lại bị bỏ.
  { await test(A,"baglimit",{on:true}); await sleep(1200); const before=A.bag.honTe, n=A.wf.length; for(let k=0;k<200;k++) A.room.send("welfare",{op:"sign"}); await sleep(1500);
    const got=A.wf.length-n; await test(A,"baglimit",{on:false}); s=await get();
    ok(got>0&&got<=MSG_GROUP.trade.burst+MSG_GROUP.trade.rate*3&&s?.mask===1&&A.bag.honTe===before&&A.leftCode===null,`bật giới hạn tin: 200 sign chỉ xử lý ${got} (≤ burst ${MSG_GROUP.trade.burst} + rate), mask ${s?.mask}, Hồn Tệ không đổi`); }
  // 4. Ô lạ / ô hôm nay / ô tương lai: từ chối.
  for(const day of [0,1,5,CHECKIN.days-1,CHECKIN.days,-1,0.5,"1",null,NaN,1e9]){ s=await act({op:"makeup",day}); ok(!!s?.err&&s.mask===1&&s.makeupLeft===MAX,`ký bù ô ${JSON.stringify(day)} (hôm nay / tương lai / lạ): từ chối (${s?.err})`); }

  // 5. Đẩy ngày +4 (ô hôm nay = ô 5): ký bù ô 2, 3 miễn phí (quà y như ô đó); ô 4 tốn phí nên cần xác nhận.
  await shift(4); s=await get(); ok(s?.day===4&&s.mask===1,`đẩy +4 ngày: ô hôm nay = ô ${s?.day+1}`);
  const huyet0=qtyOf(A,"hoi_huyet_dan"), hon1=await honTe(A.bag.honTe);
  s=await act({op:"makeup",day:1}); ok(!s?.err&&s.signed?.makeup===true&&s.signed.day===1&&s.mask===3&&s.makeupLeft===MAX-1&&s.free===FREE-1&&s.signed.fee===0,`ký bù ô 2 miễn phí: ${items(s?.signed?.items??[])}, còn ${s?.makeupLeft} lượt (${s?.err??"ok"})`);
  ok(await waitFor(()=>qtyOf(A,"hoi_huyet_dan")===huyet0+R[1].items[0].qty,1500),`quà ký bù = quà ô 2 (+${R[1].items[0].qty} Hồi Huyết Đan)`);
  s=await act({op:"makeup",day:1}); ok(!!s?.err&&/đã ký/.test(s.err)&&s.mask===3,`ký bù lại ô 2: từ chối (${s?.err})`);
  s=await act({op:"makeup",day:2}); ok(!s?.err&&s.mask===7&&s.free===0&&s.fee===CHECKIN.makeupFee[0]&&await honTe(hon1+(R[2].honTe??0))===hon1+(R[2].honTe??0),`ký bù ô 3: hết lượt miễn phí, lượt kế tốn ${s?.fee}`);
  const hon2=A.bag.honTe;
  s=await act({op:"makeup",day:3}); ok(!!s?.err&&/xác nhận/.test(s.err)&&s.mask===7&&A.bag.honTe===hon2,`ký bù trả phí khi chưa xác nhận (pay): từ chối, không trừ tiền (${s?.err})`);
  await coin(CHECKIN.makeupFee[0]-1);
  s=await act({op:"makeup",day:3,pay:true}); ok(!!s?.err&&/không đủ Hồn Tệ/i.test(s.err)&&s.mask===7&&A.bag.honTe===CHECKIN.makeupFee[0]-1,`thiếu Hồn Tệ: từ chối, không mất gì (${s?.err})`);
  // 6. Trả phí lũy tiến cho tới hết lượt (makeupMax), rồi hết lượt.
  await coin(1e7); let mask=7;
  for(let k=0;k<MAX-FREE;k++){
    const day=3+k, fee=CHECKIN.makeupFee[k]; await shift(day+1); const pre=await honTe(A.bag.honTe); // đẩy ngày để ô `day` thuộc quá khứ (ô hôm nay = day + 1)
    s=await act({op:"makeup",day,pay:true}); mask|=1<<day;
    ok(!s?.err&&s.mask===mask&&s.signed?.fee===fee&&await honTe(pre-fee+(R[day].honTe??0))===pre-fee+(R[day].honTe??0),`ký bù có phí #${k+1}: ô ${day+1} trừ ${fee}, nhận quà ô đó (mask ${s?.mask})`);
  }
  s=await get(); ok(s?.makeupLeft===0&&s.fee===null&&checkinFee(MAX)===null,"hết lượt ký bù: fee null");
  await shift(10); const hon3=A.bag.honTe; s=await act({op:"makeup",day:MAX+1,pay:true}); ok(!!s?.err&&/Hết lượt/.test(s.err)&&A.bag.honTe===hon3&&s.mask===mask,`hết lượt ký bù: từ chối, không trừ tiền (${s?.err})`);
  // 7. Hết chu kỳ: ô chưa ký mất, ký bù không được; ký hôm nay mở chu kỳ 2 (ô 1) với đủ lượt; chu kỳ cũ không bị trừ gì.
  await shift(CHECKIN.days+2); s=await get(); ok(s?.day===-1&&s.cycle===1&&s.endsAt===0,`quá ${CHECKIN.days} ngày: không còn chu kỳ đang chạy (day ${s?.day})`);
  s=await act({op:"makeup",day:MAX+1,pay:true}); ok(!!s?.err&&s.day===-1,`hết chu kỳ: ký bù bị từ chối (${s?.err})`);
  s=await act({op:"sign"}); ok(!s?.err&&s.cycle===2&&s.day===0&&s.mask===1&&s.makeupLeft===MAX&&s.free===FREE,`ký hôm nay sau khi nghỉ lâu: chu kỳ 2, ô 1, đủ ${MAX} lượt (cycle ${s?.cycle}, mask ${s?.mask})`);
  // 8. Đồng hồ lùi: từ chối cả sign lẫn makeup, không đổi gì.
  await shift(CHECKIN.days-1); const hon4=A.bag.honTe;
  for(const m of [{op:"sign"},{op:"makeup",day:0}]){ s=await act(m); ok(!!s?.err&&/lùi/.test(s.err)&&s.mask===1&&A.bag.honTe===hon4,`đồng hồ lùi: ${m.op} bị từ chối, không cộng ô (${s?.err})`); }
  // 9. Ghi lỗi (savefail): hoàn lại quà và mask, ký lại được ngay sau đó.
  await shift(CHECKIN.days+3); await coin(5000);
  await test(A,"savefail",{n:1,only:"bag"}); s=await act({op:"sign"});
  ok(!!s?.err&&/Không lưu được/.test(s.err)&&s.mask===1&&await honTe(5000)===5000&&qtyOf(A,"hoi_huyet_dan")>=huyet0,`ghi DB lỗi: không cộng quà, mask không đổi (${s?.err})`); await sleep(200);
  s=await act({op:"sign"}); ok(!s?.err&&s.mask===3&&s.signed?.day===1,`ký lại sau lỗi: được (ô ${s?.signed?.day+1})`);
  // 10. Túi đầy: ô 7 (mốc) có mảnh võ hồn chưa có chồng nào (cần ô mới) → từ chối cả phần quà, không mất ô; bỏ bớt đồ rồi ký được.
  await shift(CHECKIN.days+8); await coin(5000);
  { const free=A.bag.slots-loose().length; await test(A,"give",{code:RING_ITEM,qty:free,years:10}); await waitFor(()=>loose().length>=A.bag.slots,2000);
    const mk=3; s=await act({op:"sign"}); ok(!!s?.err&&/không đủ chỗ/.test(s.err)&&s.mask===mk&&A.bag.honTe===5000,`túi đầy ${loose().length}/${A.bag.slots}: từ chối, không mất ô (${s?.err})`);
    const one=loose().find(i=>i.code===RING_ITEM); A.room.send("discard",{id:one?.id}); await waitFor(()=>!loose().some(i=>i.id===one?.id),2000);
    s=await act({op:"sign"}); ok(!s?.err&&s.signed?.day===6&&s.mask===(mk|1<<6)&&s.signed.items.some(x=>x.code.startsWith("manh_"))&&await honTe(5000+(R[6].honTe??0))===5000+(R[6].honTe??0),`bỏ một ô rồi ký: được (ô ${s?.signed?.day+1}: ${items(s?.signed?.items??[])})`); }
  // 11. Vào lại phòng: sổ còn nguyên, server gửi trạng thái lúc vào (chấm đỏ); phòng giữ nhờ B.
  const keep=s?.mask; await A.room.leave(); await sleep(400); A.mapId=(await post("/api/me",{token:A.token})).mapId; await enter(A); await waitFor(()=>me(A)&&A.bag,3000);
  ok(await waitFor(()=>A.wf.length>0,3000)&&A.wf[0].mask===keep&&A.wf[0].cycle===2,`vào lại phòng: server tự gửi welfare (mask ${A.wf[0]?.mask}, chu kỳ ${A.wf[0]?.cycle})`);
  // 12. Qua 00:00 khi đang chơi: server gửi lại trạng thái, không tự nhận hộ.
  { const n=A.wf.length, m0=keep; await shift(CHECKIN.days+9,false); const got=await waitFor(()=>A.wf.length>n,4000);
    ok(got&&A.wf.at(-1).day===7&&A.wf.at(-1).mask===m0,`qua 00:00: tự gửi welfare mới (ô hôm nay ${A.wf.at(-1)?.day+1}), mask không đổi ${A.wf.at(-1)?.mask}`); }
  // 13. Trong sân Đại Đấu Hồn Trường (ArenaRoom): `welfare` bị từ chối.
  await shift(0);
  const ns=npcSpot(AT,"dau_hon_truong");
  for(const [b,dx] of [[A,-12],[B,12]]){
    b.travel=null; b.room.send("test",{op:"warp",mapId:AT,x:ns.x+dx,y:ns.y+16});
    ok(await waitFor(()=>b.travel?.mapId===AT,4000),`${b.name}: tới sân đấu thành`);
    await b.room.leave(); await sleep(300); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>me(b)&&b.owned&&b.bag&&b.squad,3000);
  }
  const fnd=b=>b.arena.filter(m=>m.k==="found").at(-1);
  for(let t=0;t<12&&!(fnd(A)&&fnd(B));t++){ for(const b of [A,B]) if(!fnd(b)) b.room.send("arena",{op:"queue"}); await sleep(1000); }
  ok(!!fnd(A)&&!!fnd(B)&&fnd(A).roomId===fnd(B).roomId,"hai bot ghép trận");
  if(fnd(A)){
    await A.room.leave(); await enter(A,fnd(A).roomId); await waitFor(()=>me(A)&&A.owned&&A.bag&&A.squad,3000);
    const nl=A.logs.length, nw=A.wf.length; A.room.send("welfare",{op:"sign"}); A.room.send("welfare",{op:"get"}); await waitFor(()=>A.logs.length>nl||A.wf.length>nw,2000); await sleep(500);
    ok(A.wf.length===nw&&A.logs.slice(nl).some(x=>/Đại Đấu Hồn Trường/.test(x)),`trong sân: welfare bị từ chối (${A.logs.slice(nl).at(-1)??"không có log"})`);
    ok(A.leftCode===null,"trong sân: từ chối xong vẫn kết nối");
  }
  await A.room.leave(); await B.room.leave();
}
