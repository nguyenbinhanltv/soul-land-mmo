// Nhóm bot "achv" (Thành Tựu, mục 5.23, #1317; BOT_ONLY=achv, nhóm 2 của BOT_PART): tin `achv {op:"get"|"claim", id}` qua server thật.
// Phần thuần (hình dạng danh mục, trần thưởng, luật ghi có điều kiện của store) do server/scripts/achv-test.ts thử; ở đây thử đường đi đầy đủ: trạng thái lúc mới,
// tin lạ / id lạ, nhận khi chưa đạt, bộ đếm (hook `achv` cộng như server đếm), nhận đúng một lần, nhận đúp / dồn 200 / năm tin cùng lúc, cấp, ghi lỗi hoàn lại (savefail),
// túi đầy, vào lại phòng.
import { sleep, waitFor, ok, bot, test, qtyOf, needHookSkip, post, enter } from "./lib.mjs";
import { ACHV, RING_ITEM, achvDef } from "../../../shared/data.ts";

export async function achvTest(){
  console.log("[#1317] Thành Tựu qua server");
  const A=await bot("Thành Tựu A","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3});
  if(!(await test(A,"ping"))?.enabled){ needHookSkip("bỏ qua Thành Tựu (cần hook achv, coin, savefail, set): bật server bằng GAME_TEST=1"); await A.room.leave(); return; }
  const me=b=>b.room.state.players?.get(b.room.sessionId);
  await waitFor(()=>A.bag&&A.owned,3000);
  /** Gửi một tin `achv` và chờ tin trả lời mới (mọi lần từ chối cũng trả lại trạng thái kèm `err`). */
  const act=async msg=>{ const n=A.av.length; A.room.send("achv",msg); const got=await waitFor(()=>A.av.length>n,3000); await sleep(80); return got?A.av.at(-1):null; };
  const bump=async(key,n=1)=>{ const w=A.av.length; await test(A,"achv",{key,n}); await waitFor(()=>A.av.length>w,3000); await sleep(80); return A.av.at(-1); };
  const coin=async n=>{ await test(A,"coin",{n}); return waitFor(()=>A.bag.honTe===n,1500); };
  const loose=()=>A.bag.items.filter(i=>i.vohon===null||i.vohon===undefined);
  const reward=id=>achvDef(id).reward;

  // 1. Vào phòng: server tự gửi trạng thái; tài khoản mới chưa nhận gì, chưa có bộ đếm.
  ok(await waitFor(()=>A.av.length>0,3000),"vào phòng: server tự gửi achv (chấm đỏ)");
  let s=A.av[0];
  ok(s&&s.claimed.length===0&&s.stats.elite===0&&s.stats.king===0&&s.stats.world===0&&s.stats.bicanh===0&&s.stats.owned>=1&&s.stats.level>=1&&typeof s.ready==="number",`lúc mới: chưa nhận gì, bộ đếm 0 (owned ${s?.stats.owned}, level ${s?.stats.level}, ready ${s?.ready})`);
  { await sleep(1100); s=await act({op:"get"}); ok(s&&Array.isArray(s.claimed)&&s.stats,"get: trả trạng thái"); }
  { const n=A.av.length; for(const m of [{op:"set"},{op:1},null,{},"x",{op:"claim"},{op:"claim",id:null},{op:"claim",id:{a:1}},{op:"claim",id:["elite_t1"]},{op:"claim",id:"khong_co"},{op:"claim",id:"__proto__"}]) A.room.send("achv",m);
    await sleep(700); ok(A.leftCode===null,"tin lạ / id lạ: vẫn kết nối"); ok(A.av.slice(n).every(x=>x.err&&x.claimed.length===0),"tin lạ / id lạ không nhận gì (chỉ có thể trả lỗi)"); }

  // 2. Nhận khi chưa đạt: từ chối, không đổi Hồn Tệ.
  await coin(1000);
  s=await act({op:"claim",id:"elite_t1"}); ok(!!s?.err&&/Chưa đạt/.test(s.err)&&s.claimed.length===0&&A.bag.honTe===1000,`nhận elite_t1 khi chưa đạt: từ chối, không mất / được gì (${s?.err})`);

  // 3. Bộ đếm tăng (như server đếm) → đạt; nhận đúng một lần.
  s=await bump("elite",1); ok(s?.stats.elite===1&&s.ready>=1&&s.claimed.length===0,`bộ đếm elite = ${s?.stats.elite}, ready ${s?.ready}: đạt mà chưa nhận (không tự nhận hộ)`);
  s=await act({op:"claim",id:"elite_t1"}); const r1=reward("elite_t1").honTe??0;
  ok(s&&!s.err&&s.claimedNow?.id==="elite_t1"&&s.claimed.includes("elite_t1")&&await waitFor(()=>A.bag.honTe===1000+r1,1500),`nhận elite_t1: +${r1} Hồn Tệ, đánh dấu đã nhận (claimed ${JSON.stringify(s?.claimed)})`);
  s=await act({op:"claim",id:"elite_t1"}); ok(!!s?.err&&/đã nhận/i.test(s.err)&&A.bag.honTe===1000+r1,`nhận lại elite_t1: từ chối, không cộng thêm (${s?.err})`);
  { const before=A.bag.honTe, n=A.av.length; for(let k=0;k<200;k++) A.room.send("achv",{op:"claim",id:"elite_t1"}); await waitFor(()=>A.av.length>=n+1,4000); await sleep(800);
    ok(A.bag.honTe===before&&A.leftCode===null&&A.av.at(-1).claimed.filter(x=>x==="elite_t1").length===1,`dồn 200 claim đã nhận: Hồn Tệ không đổi (${before}→${A.bag.honTe}), vẫn một dòng claimed, vẫn kết nối`); }
  // 4. Năm tin claim cùng lúc cho một thành tựu vừa đạt: chỉ một lần nhận.
  await bump("king",1); { const before=A.bag.honTe, r=reward("king_t1").honTe??0, n=A.av.length; for(let k=0;k<5;k++) A.room.send("achv",{op:"claim",id:"king_t1"}); await waitFor(()=>A.av.length>=n+1,3000); await sleep(1000);
    ok(await waitFor(()=>A.bag.honTe===before+r,1500)&&A.av.at(-1).claimed.filter(x=>x==="king_t1").length===1,`5 claim king_t1 cùng lúc: đúng một lần nhận (+${r}, Hồn Tệ ${before}→${A.bag.honTe})`); }

  // 5. Cấp: võ hồn ra trận lên cấp 15 → level_t1 đạt (chỉ số suy từ trạng thái server, không từ client).
  { const act0=A.owned.list.find(v=>v.rowId===A.owned.active); const w=A.av.length; await test(A,"set",{rowId:act0.rowId,level:15,xp:0,rings:[]}); await sleep(300);
    s=await act({op:"get"}); if(!s||s.stats.level<15) { await sleep(1100); s=await act({op:"get"}); }
    ok(s?.stats.level>=15,`đặt cấp 15: chỉ số level = ${s?.stats.level}`);
    const b0=A.bag.honTe, r=reward("level_t1").honTe??0; s=await act({op:"claim",id:"level_t1"});
    ok(s&&!s.err&&s.claimed.includes("level_t1")&&await waitFor(()=>A.bag.honTe===b0+r,1500),`nhận level_t1: +${r} Hồn Tệ (${s?.err??"ok"})`);
    s=await act({op:"claim",id:"level_t2"}); ok(!!s?.err&&/Chưa đạt/.test(s.err),`level_t2 chưa đạt (cấp ${s?.stats.level}): từ chối`); void w; }

  // 6. Ghi lỗi (savefail): hoàn lại, không đánh dấu đã nhận; nhận lại được ngay sau đó.
  await bump("bicanh",1); await coin(2000);
  await test(A,"savefail",{n:1,only:"bag"}); s=await act({op:"claim",id:"bicanh_t1"});
  ok(!!s?.err&&/Không lưu được/.test(s.err)&&!s.claimed.includes("bicanh_t1")&&await waitFor(()=>A.bag.honTe===2000,1500),`ghi DB lỗi: không cộng quà, không đánh dấu đã nhận (${s?.err})`); await sleep(200);
  s=await act({op:"claim",id:"bicanh_t1"}); ok(!s?.err&&s.claimed.includes("bicanh_t1"),`nhận lại sau lỗi: được (${s?.err??"ok"})`);

  // 7. Túi đầy: world_t1 có mảnh võ hồn (cần ô mới) → từ chối cả phần quà, không mất thành tựu; bỏ bớt đồ rồi nhận được.
  await bump("world",1); await coin(2000);
  { const free=A.bag.slots-loose().length; await test(A,"give",{code:RING_ITEM,qty:free,years:10}); await waitFor(()=>loose().length>=A.bag.slots,2000);
    s=await act({op:"claim",id:"world_t1"}); ok(!!s?.err&&/không đủ chỗ/.test(s.err)&&!s.claimed.includes("world_t1")&&A.bag.honTe===2000,`túi đầy ${loose().length}/${A.bag.slots}: từ chối, không mất thành tựu (${s?.err})`);
    const one=loose().find(i=>i.code===RING_ITEM); A.room.send("discard",{id:one?.id}); await waitFor(()=>!loose().some(i=>i.id===one?.id),2000);
    s=await act({op:"claim",id:"world_t1"}); const r=reward("world_t1");
    ok(!s?.err&&s.claimedNow?.items?.some(x=>x.code.startsWith("manh_"))&&await waitFor(()=>A.bag.honTe===2000+(r.honTe??0),1500),`bỏ một ô rồi nhận: được (${JSON.stringify(s?.claimedNow?.items)})`); }

  // 8. Hook `achv` không nhận mã bộ đếm lạ; bộ đếm chỉ tăng.
  { const before=(await act({op:"get"}))?.stats.elite; await test(A,"achv",{key:"la",n:5}); await sleep(300); s=await act({op:"get"}); ok(s?.stats.elite===before&&A.leftCode===null,`bộ đếm lạ không đổi gì (elite ${before} → ${s?.stats.elite})`); }

  // 9. Vào lại phòng: đã nhận còn nguyên, bộ đếm còn nguyên.
  const keep=[...A.av.at(-1).claimed].sort(), eliteNow=A.av.at(-1).stats.elite; await A.room.leave(); await sleep(400); A.mapId=(await post("/api/me",{token:A.token})).mapId; A.av=[]; await enter(A); await waitFor(()=>me(A)&&A.bag,3000);
  ok(await waitFor(()=>A.av.length>0,3000)&&JSON.stringify([...A.av[0].claimed].sort())===JSON.stringify(keep)&&A.av[0].stats.elite===eliteNow,`vào lại phòng: ${keep.length} thành tựu đã nhận còn nguyên, bộ đếm elite ${eliteNow} còn nguyên: ${A.av[0]?.stats.elite}`);
  ok(ACHV.length>0&&qtyOf(A,RING_ITEM)>=0,"danh mục có thành tựu");
  await A.room.leave();
}
