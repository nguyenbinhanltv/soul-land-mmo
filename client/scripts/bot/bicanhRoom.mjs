// Nhóm bot bicanh, phần phòng (P3 #877, mục 5.22): `bicanh {op:"enter"}` mở phòng riêng BiCanhRoom. Tách khỏi bicanh.mjs (lượt, mua lượt, quyển).
// Tài khoản mới ở bản đồ thường: dồn 200 `enter` chỉ trừ một lượt (một tin `found`), túi đầy bị từ chối TRƯỚC khi trừ lượt, sang phòng riêng, chặn tin ngoài trận,
// sóng theo kịch bản (tuổi theo vòng kế, không rơi đồ / Hồn Tệ / kinh nghiệm), thắng nhận quyển (ghi DB), thua không quyển, rời giữa chừng giữ sóng đã xong, trần quyển ngày,
// ghi lỗi lúc chốt hoàn lượt, không vào phòng thì hoàn lượt, hết lượt không vào được, đồng hồ lùi bị từ chối. Hạ hồn thú bằng hook `slay` (đường killBeast thật), rút giờ bằng `bcfast`.
// Bot không dựa vào ngẫu nhiên kịch bản (loài, chỗ đứng): chỉ đếm sóng, số con, tuổi.
import { sleep, waitFor, ok, bot, test, qtyOf, needHookSkip, post, enter } from "./lib.mjs";
import { ASK_CD, BICANH, MAX_RINGS, bicanhRunTomes, ringLimit } from "../../../shared/data.ts";

const ARENA_MAP_ID = "dai_dau_hon_truong";

export async function bicanhRoomTest(){
  console.log("[#877 P3] Bí Cảnh: phòng riêng, sóng, thưởng, hoàn lượt, chống gian lận");
  const B=await bot("Bí Cảnh B","hoa_anh",{sex:1,hair:2,hairCol:1,outfitCol:4});
  if(!(await test(B,"ping"))?.enabled){ needHookSkip("bỏ qua phòng Bí Cảnh (cần hook slay, down, bcfast, day, coin, savefail): bật server bằng GAME_TEST=1"); await B.room.leave(); return; }
  const S=BICANH.scenes[0], ID=S.id, runOf=m=>m?.runs?.find(r=>r.id===ID), tomes=()=>qtyOf(B,BICANH.tome), meOf=()=>B.room.state.players?.get(B.room.sessionId);
  await waitFor(()=>B.bag,3000);
  const act=async msg=>{ const n=B.bc.length; B.room.send("bicanh",msg); await waitFor(()=>B.bc.length>n,3000); await sleep(80); return B.bc.at(-1); };
  const get=async()=>{ await sleep(ASK_CD*1000+100); return act({op:"get"}); };
  const left=async()=>runOf(await get())?.left;
  const back=async()=>{ B.mapId=(await post("/api/me",{token:B.token})).mapId; await enter(B); await waitFor(()=>meOf()&&B.owned&&B.bag&&B.squad,4000); };
  const waitMsg=async(k,ms=15000)=>{ await waitFor(()=>B.bc.some(m=>m.k===k),ms); return B.bc.find(m=>m.k===k); };
  const slayAll=async()=>{ for(let g=0;g<20;g++){ const ids=[]; B.room.state.beasts.forEach((_,k)=>ids.push(k)); if(!ids.length) return; for(const bid of ids) await test(B,"slay",{bid}); await sleep(100); } };
  const tomeBag=async n=>{ await waitFor(()=>tomes()===n,2500); return tomes(); };
  /** Gửi `spam` tin enter, chờ `found` rồi sang phòng riêng. Trả `found` (kèm số tin found nhận được), hoặc `{err}` nếu bị từ chối. */
  const open=async(spam=1)=>{ const n=B.bc.length; for(let k=0;k<spam;k++) B.room.send("bicanh",{op:"enter",id:ID});
    await waitFor(()=>B.bc.slice(n).some(m=>m.k==="found"||m.err),5000); await sleep(spam>1?1500:100);
    const msgs=B.bc.slice(n), f=msgs.find(m=>m.k==="found");
    if(!f) return {err:msgs.find(m=>m.err)?.err??"không có phản hồi",found:0};
    await B.room.leave(); await enter(B,f.roomId); await waitFor(()=>meOf(),3000);
    return {...f,found:msgs.filter(m=>m.k==="found").length}; };
  /** Rút đếm ngược rồi chờ tin `fight` + sóng đầu. */
  const fight=async()=>{ await test(B,"bcfast",{s:0.2}); const f=await waitMsg("fight",8000); await waitMsg("wave",4000); return f; };
  /** Hạ sóng thứ `w` (từ 0) tới khi server báo `clear` (hoặc `end`). Tin `wave` / `fight` tới TRƯỚC bản vá state: `slayAll` một lần có thể thấy `beasts` rỗng, không hạ con nào, sóng không bao giờ xong
   * (CI nhóm 2: `end` không tới, `winAll` trả undefined, bài đọc `e.win` ném TypeError). Nên lặp hạ lại cho tới khi server xác nhận. */
  const clearWave=async(w,ms=8000)=>{ const done=()=>B.bc.some(m=>m.k==="end"||(m.k==="clear"&&m.wave>w)); for(let t=0;t<ms&&!done();t+=150){ await slayAll(); await sleep(150); } return done(); };
  /** Hạ hết hồn thú từng sóng tới khi có tin `end`. */
  const winAll=async()=>{ for(let w=0;w<S.waves.length;w++){ await waitFor(()=>B.bc.filter(m=>m.k==="wave").length>w,8000); await clearWave(w); if(B.bc.some(m=>m.k==="end")) break; } return waitMsg("end",8000); };
  /** Sau `end`: rút giờ kết quả, bị đưa ra (4005) rồi vào lại bản đồ. */
  const leave=async()=>{ await test(B,"bcfast",{s:0.2}); await waitFor(()=>B.leftCode===4005,4000); await back(); };

  // 1. Túi đầy: từ chối TRƯỚC khi trừ lượt, không mở phòng.
  const C=await bot("Bí Cảnh C","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3});
  await waitFor(()=>C.bag,3000);
  await test(C,"give",{code:"hoi_huyet_dan",qty:99*Math.max(1,C.bag.slots-C.bag.items.length+2)}); await waitFor(()=>C.bag.items.length>=C.bag.slots,2500);
  { const n=C.bc.length; C.room.send("bicanh",{op:"enter",id:ID}); await waitFor(()=>C.bc.length>n,3000); await sleep(200);
    const m=C.bc.at(-1); ok(!!m?.err&&/Túi không đủ chỗ/.test(m.err)&&runOf(m)?.left===S.runs&&!C.bc.slice(n).some(x=>x.k==="found"),`túi đầy: từ chối trước khi trừ lượt (${m?.err}; ${runOf(m)?.left}/${S.runs})`); }
  await C.room.leave();

  // 2. Thắng: dồn 200 enter chỉ trừ một lượt (một tin found), sóng theo kịch bản, không rơi đồ, quyển ghi DB.
  const me0=meOf(), hon0=B.bag.honTe, xp0=me0.xp, rings=me0.rings.length;
  const bad=await act({op:"enter",id:"x"}); ok(!!bad.err&&runOf(bad)?.left===S.runs,"enter id lạ: từ chối, không trừ lượt");
  let f=await open(200);
  ok(!f.err&&f.found===1&&f.id===ID&&f.waves===S.waves.length&&!!f.roomId,`dồn 200 enter: một tin found (${f.found}), phòng ${f.roomId}`);
  ok(B.room.state.mapId===ARENA_MAP_ID,"vào phòng riêng trên sân Bí Cảnh");
  { const n=B.logs.length; for(const m of [["bicanh",{op:"enter",id:ID}],["bicanh",{op:"buy",id:ID,pay:true}],["buy",{code:"hoi_huyet_dan",qty:1}],["travel",{portal:"x"}],["sortbag",{}],["arena",{op:"queue"}],["use",{id:"x"}]]) B.room.send(...m);
    await sleep(600); ok(B.leftCode===null&&B.logs.slice(n).some(t=>/Bí Cảnh/.test(t)),"tin ngoài trận trong phòng (bicanh lồng, mua, đi cổng, túi, đấu trường): bị chặn, vẫn kết nối"); }
  B.room.send("attack"); await sleep(300); ok(B.room.state.beasts.size===0,"chưa đếm ngược xong: chưa có hồn thú");
  await fight();
  const w1=B.bc.find(m=>m.k==="wave"), yrs=Math.round(ringLimit(Math.min(MAX_RINGS,rings+1))*S.waves[0].yearsPct), years=[]; B.room.state.beasts.forEach(b=>years.push(b.years));
  ok(w1.wave===1&&w1.of===S.waves.length&&w1.n===S.waves[0].n&&!w1.elite&&years.length===S.waves[0].n&&years.every(y=>y===yrs),`sóng 1: ${w1.n} hồn thú ${yrs} năm (vòng kế tiếp ×${S.waves[0].yearsPct})`);
  // Chống hạ độ khó: đổi võ hồn trong lúc nghỉ giữa sóng không đổi niên hạn sóng kế (số hồn hoàn chốt lúc vào phòng).
  await clearWave(0); await waitMsg("clear",8000); for(let sl=0;sl<4;sl++) B.room.send("switch",{slot:sl});
  await waitFor(()=>B.bc.filter(m=>m.k==="wave").length>1,8000); { const y2=Math.round(ringLimit(Math.min(MAX_RINGS,rings+1))*S.waves[1].yearsPct), ys=[]; B.room.state.beasts.forEach(b=>{ if(!b.elite&&b.tier!==undefined) ys.push(b.years); });
    ok(ys.length>0&&ys.every(y=>y===y2),`đổi võ hồn giữa sóng: sóng 2 vẫn ${y2} năm (${ys.join(",")})`); }
  const end=await winAll();
  ok(B.bc.filter(m=>m.k==="wave").length===S.waves.length&&B.bc.find(m=>m.k==="wave"&&m.wave===S.waves.length).elite===true,"đủ các sóng, sóng cuối có tinh anh");
  ok(end.win&&end.reason==="win"&&end.cleared===S.waves.length&&end.tomes===bicanhRunTomes(S)&&!end.err,`thắng: hạ ${end.cleared}/${end.of} sóng, thưởng ${end.tomes} quyển`);
  ok(B.room.state.drops.size===0&&B.bag.honTe===hon0&&meOf().xp===xp0,"không rơi đồ, không Hồn Tệ, không kinh nghiệm trong phòng");
  await leave(); ok(await tomeBag(bicanhRunTomes(S))===bicanhRunTomes(S)&&await left()===S.runs-1,`về bản đồ: ${tomes()} quyển trong túi (đã lưu DB), còn ${S.runs-1}/${S.runs} lượt`);

  // 3. Thua: gục hết đội → không quyển, lượt vẫn mất.
  f=await open(); ok(!f.err,"vào lượt 2"); await fight();
  for(let k=0;k<6&&!meOf()?.dead;k++) await test(B,"down");
  { const e=await waitMsg("end",6000); ok(e&&!e.win&&e.reason==="dead"&&e.cleared===0&&e.tomes===0&&!e.err,`thua (gục hết đội): ${e?.cleared}/${e?.of} sóng, ${e?.tomes} quyển`); }
  await leave(); ok(tomes()===bicanhRunTomes(S)&&await left()===S.runs-2,`thua không quyển, lượt không hoàn (${S.runs-2}/${S.runs})`);

  // 4. Rời giữa chừng sau khi hạ sóng 1: giữ phần sóng đã xong (một lần), lượt không hoàn.
  f=await open(); await fight(); await clearWave(0); await waitMsg("clear",8000);
  const want=tomes()+S.waves[0].tomes; await B.room.leave(); await sleep(800); await back();
  ok(await tomeBag(want)===want&&await left()===S.runs-3,`rời giữa chừng: giữ ${S.waves[0].tomes} quyển của sóng 1 (${tomes()} quyển), lượt không hoàn (${S.runs-3}/${S.runs})`);
  // 5. Hết lượt miễn phí: không mở phòng, không trừ thêm.
  { const n=B.bc.length; B.room.send("bicanh",{op:"enter",id:ID}); await waitFor(()=>B.bc.length>n,3000); await sleep(200); const m=B.bc.at(-1);
    ok(!!m?.err&&/hết lượt/.test(m.err)&&runOf(m).left===0&&!B.bc.slice(n).some(x=>x.k==="found"),`hết lượt: từ chối (${m?.err})`); }

  // 6. Mua đủ lượt, thắng nhiều lần: trần quyển ngày kẹp phần thưởng, bộ đếm không vượt; ghi lỗi lúc chốt thì hoàn lượt.
  await test(B,"coin",{n:1e6}); await waitFor(()=>B.bag.honTe===1e6,1500);
  for(let i=0;i<S.buyMax;i++){ await sleep(500); await act({op:"buy",id:ID,pay:true}); }
  // 6b. Không vào phòng: phòng hủy sau joinSecs, hoàn lượt (người chơi chưa nhận gì), bị đưa ra khỏi bản đồ cũ.
  const l1=await left();
  if(l1>0){ const n=B.bc.length; B.room.send("bicanh",{op:"enter",id:ID}); await waitFor(()=>B.bc.slice(n).some(m=>m.k==="found"),5000);
    ok(B.bc.slice(n).some(m=>m.k==="found"),"enter: có tin found");
    await waitFor(()=>B.leftCode!==null,(BICANH.joinSecs+8)*1000); await sleep(800); await back();
    ok(await left()===l1,`không vào phòng: lượt hoàn lại (${l1})`); }
  else console.log("  (hết lượt trước bước không-vào-phòng: bỏ qua)");

  let got=tomes(), capped=null;
  for(let r=0;r<S.buyMax;r++){
    f=await open(); if(f.err){ ok(false,`lượt mua #${r+1}: vào phòng (${f.err})`); break; }
    await fight(); const e=await winAll(), give=Math.min(bicanhRunTomes(S),Math.max(0,BICANH.tomeDailyCap-got));
    ok(e.win&&e.tomes===give&&!!e.capped===(give<bicanhRunTomes(S)),`lượt mua #${r+1}: thắng, nhận ${e.tomes}/${bicanhRunTomes(S)} quyển${e.capped?" (kẹp trần ngày)":""} (tổng ${got+e.tomes}/${BICANH.tomeDailyCap})`);
    got+=e.tomes; if(e.capped) capped=e; await leave(); ok(await tomeBag(got)===got,`túi có ${got} quyển (không vượt trần ngày ${BICANH.tomeDailyCap})`);
    if(r===0){
      const l0=await left(); f=await open(); await fight(); await test(B,"savefail",{n:1,only:"bag"});
      const e2=await winAll(); ok(!!e2.err&&e2.refunded&&e2.tomes===0,`ghi DB lỗi lúc chốt: không thưởng, hoàn lượt (${e2.err})`);
      await leave(); ok(tomes()===got&&await left()===l0,`sau lỗi: quyển giữ ${got}, lượt ${l0} (hoàn lại)`);
    }
  }
  ok(!!capped||got<=BICANH.tomeDailyCap,"trần quyển ngày kẹp được phần thưởng (hoặc chưa tới trần)");

  // 7. Đồng hồ lùi: đã vào ngày +1 rồi quay về ngày cũ thì từ chối.
  await test(B,"day",{shift:1}); await sleep(1300); f=await open(); ok(!f.err,`ngày +1: có lượt mới, vào phòng (${f.err??""})`);
  if(!f.err){ await B.room.leave(); await sleep(500); await back(); }
  await test(B,"day",{shift:0}); await sleep(1300);
  { const n=B.bc.length; B.room.send("bicanh",{op:"enter",id:ID}); await waitFor(()=>B.bc.length>n,3000); await sleep(200);
    ok(/lùi/.test(B.bc.at(-1)?.err??"")&&!B.bc.slice(n).some(x=>x.k==="found"),`đồng hồ lùi: từ chối enter (${B.bc.at(-1)?.err})`); }
  await B.room.leave();
}
