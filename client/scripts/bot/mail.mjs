// Nhóm bot "mail" (Thư hệ thống, mục 5.24, #1336; BOT_ONLY=mail, nhóm 2 của BOT_PART): tin `mail {op:"get"|"read"|"claim"|"claimAll"|"del", id}` qua server thật.
// Phần thuần (hình dạng, hạn, hộp đầy, luật ghi có điều kiện của store) do server/scripts/mail-test.ts thử; ở đây thử đường đi đầy đủ: hộp trống lúc mới, tin lạ / id lạ / thư không có,
// gửi thư (hook `mail`, như server gửi), chống tạo trùng, nhận đúng một lần, nhận đúp / dồn 200 / năm tin cùng lúc, nhận tất cả, đọc / xóa, hết hạn, ghi lỗi hoàn lại (savefail), túi đầy, vào lại phòng.
import { sleep, waitFor, ok, bot, test, needHookSkip, post, enter } from "./lib.mjs";
import { ITEMS, RING_ITEM } from "../../../shared/data.ts";

export async function mailTest(){
  console.log("[#1336] Thư hệ thống qua server");
  const A=await bot("Thư A","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3});
  if(!(await test(A,"ping"))?.enabled){ needHookSkip("bỏ qua Thư (cần hook mail, coin, savefail, give): bật server bằng GAME_TEST=1"); await A.room.leave(); return; }
  const me=b=>b.room.state.players?.get(b.room.sessionId);
  await waitFor(()=>A.bag&&A.owned,3000);
  /** Gửi một tin `mail` và chờ tin trả lời mới (mọi lần từ chối cũng trả lại hộp thư kèm `err`). */
  const act=async msg=>{ const n=A.mv.length; A.room.send("mail",msg); const got=await waitFor(()=>A.mv.length>n,3000); await sleep(80); return got?A.mv.at(-1):null; };
  /** Server gửi một thư cho người chơi (hook test `mail`); chờ hộp thư đẩy xuống nếu thư được nhận. */
  const send=async(extra={})=>{ const w=A.mv.length; const r=await test(A,"mail",extra); if(r?.res==="ok") await waitFor(()=>A.mv.length>w,2000); await sleep(60); return r; };
  const coin=async n=>{ await test(A,"coin",{n}); return waitFor(()=>A.bag.honTe===n,1500); };
  const loose=()=>A.bag.items.filter(i=>i.vohon===null||i.vohon===undefined);
  const held=new Set(A.bag.items.map(i=>i.code)), stackCode=ITEMS.find(i=>i.stack>1&&!held.has(i.id)).id;

  // 1. Vào phòng: server tự gửi hộp thư (trống).
  ok(await waitFor(()=>A.mv.length>0,3000),"vào phòng: server tự gửi mail (chấm đỏ)");
  let s=A.mv[0]; ok(s&&Array.isArray(s.list)&&s.list.length===0&&s.unread===0&&s.pending===0,`lúc mới: hộp trống (${s?.list?.length}, chưa đọc ${s?.unread}, chờ nhận ${s?.pending})`);
  { await sleep(1100); s=await act({op:"get"}); ok(s&&Array.isArray(s.list),"get: trả hộp thư"); }
  { const n=A.mv.length; for(const m of [{op:"set"},{op:1},null,{},"x",{op:"claim"},{op:"claim",id:null},{op:"claim",id:{a:1}},{op:"claim",id:[1]},{op:"claim",id:"1"},{op:"claim",id:-5},{op:"claim",id:1.5},{op:"claim",id:999999},{op:"del",id:999999},{op:"read",id:"__proto__"},{op:"claimAll"}]) A.room.send("mail",m);
    await sleep(900); ok(A.leftCode===null,"tin lạ / id lạ / thư không có: vẫn kết nối"); ok(A.mv.slice(n).every(x=>x.list.length===0),"không tạo / nhận gì ra từ tin lạ"); }

  // 2. Gửi thư (như server gửi): chống tạo trùng; nội dung sai bị từ chối ở server.
  await coin(1000);
  let r=await send({title:"Quà thử 1",honTe:50,items:[{code:stackCode,qty:3}],dedup:"bot:1"}); ok(r?.res==="ok","gửi thư 1");
  s=A.mv.at(-1); ok(s.list.length===1&&s.unread===1&&s.pending===1&&s.list[0].honTe===50&&s.list[0].items[0]?.qty===3&&s.list[0].from==="Quản trị",`thư tới: chưa đọc 1, chờ nhận 1, người gửi "${s.list[0]?.from}"`);
  r=await send({title:"Quà thử 1",honTe:50,dedup:"bot:1"}); ok(r?.res==="dup","cùng dedup: không ra thư thứ hai"); ok((await act({op:"get"})).list.length===1,"hộp vẫn một thư");
  r=await send({title:"x",items:[{code:RING_ITEM,qty:1}],dedup:"bot:bad"}); ok(!!r?.error,"vật phẩm có dữ liệu riêng bị từ chối");
  const id1=A.mv.at(-1).list.find(m=>m.title==="Quà thử 1").id;

  // 3. Đọc, nhận đúng một lần, nhận đúp, dồn 200, năm tin cùng lúc.
  s=await act({op:"read",id:id1}); ok(s.list[0].read===true&&s.unread===0&&s.pending===1,"read: chỉ bỏ chấm 'chưa đọc', vẫn còn đính kèm chờ nhận");
  s=await act({op:"del",id:id1}); ok(!!s.err&&s.list.length===1,`del thư còn đính kèm chưa nhận: từ chối (${s?.err})`);
  s=await act({op:"claim",id:id1}); ok(s&&!s.err&&s.claimedNow?.count===1&&s.list[0].claimed===true&&s.pending===0&&await waitFor(()=>A.bag.honTe===1050&&A.bag.items.some(i=>i.code===stackCode&&i.qty===3),1500),`nhận thư 1: +50 Hồn Tệ và 3 vật phẩm (Hồn Tệ ${A.bag.honTe})`);
  s=await act({op:"claim",id:id1}); ok(!!s?.err&&A.bag.honTe===1050,`nhận lại: từ chối, không cộng thêm (${s?.err})`);
  { const before=A.bag.honTe, n=A.mv.length; for(let k=0;k<200;k++) A.room.send("mail",{op:"claim",id:id1}); await waitFor(()=>A.mv.length>=n+1,4000); await sleep(800);
    ok(A.bag.honTe===before&&A.leftCode===null,`dồn 200 claim đã nhận: Hồn Tệ không đổi (${before}→${A.bag.honTe}), vẫn kết nối`); }
  await send({title:"Quà thử 2",honTe:20,dedup:"bot:2"}); { const id2=A.mv.at(-1).list[0].id, before=A.bag.honTe, n=A.mv.length; for(let k=0;k<5;k++) A.room.send("mail",{op:"claim",id:id2}); await waitFor(()=>A.mv.length>=n+1,3000); await sleep(1000);
    ok(await waitFor(()=>A.bag.honTe===before+20,1500),`5 claim cùng lúc: đúng một lần nhận (+20, Hồn Tệ ${before}→${A.bag.honTe})`); }
  s=await act({op:"del",id:id1}); ok(!s.err&&!s.list.some(m=>m.id===id1),"del thư đã nhận: biến khỏi hộp");
  r=await send({title:"Quà thử 1",honTe:50,dedup:"bot:1"}); ok(r?.res==="dup","thư đã xóa: dedup vẫn chặn tạo lại");

  // 4. Nhận tất cả.
  { await coin(0); for(const k of [3,4,5]) await send({title:`Gộp ${k}`,honTe:10*k,dedup:`bot:${k}`}); const n0=A.mv.at(-1).list.filter(m=>!m.claimed&&(m.honTe||m.items.length)).length;
    s=await act({op:"claimAll"}); ok(s&&!s.err&&s.claimedNow?.count===n0&&n0>=3&&s.pending===0&&await waitFor(()=>A.bag.honTe===s.claimedNow.honTe,1500),`claimAll: nhận ${s?.claimedNow?.count}/${n0} thư, +${s?.claimedNow?.honTe} Hồn Tệ`);
    s=await act({op:"claimAll"}); ok(!!s?.err&&!s.claimedNow,"claimAll khi hết thư chờ: báo, không nhận gì"); }

  // 5. Hết hạn: thư sống rất ngắn rồi nhận → không còn.
  await coin(100); r=await send({title:"Sắp hết hạn",honTe:500,dedup:"bot:exp",ttlMs:1200}); ok(r?.res==="ok","gửi thư hạn ngắn");
  { const idx=A.mv.at(-1).list.find(m=>m.title==="Sắp hết hạn")?.id; await sleep(1700); s=await act({op:"claim",id:idx}); ok(!!s?.err&&A.bag.honTe===100&&!s.list.some(m=>m.id===idx),`thư hết hạn: không nhận được, biến khỏi hộp (${s?.err})`); }

  // 6. Ghi lỗi (savefail): hoàn lại, không đánh dấu đã nhận; nhận lại được sau đó.
  await coin(2000); await send({title:"Thử lỗi",honTe:40,dedup:"bot:sf"}); { const idx=A.mv.at(-1).list.find(m=>m.title==="Thử lỗi").id;
    await test(A,"savefail",{n:1,only:"bag"}); s=await act({op:"claim",id:idx}); ok(!!s?.err&&/Không lưu được/.test(s.err)&&!s.list.find(m=>m.id===idx).claimed&&await waitFor(()=>A.bag.honTe===2000,1500),`ghi DB lỗi: không cộng quà, không đánh dấu đã nhận (${s?.err})`); await sleep(200);
    s=await act({op:"claim",id:idx}); ok(!s?.err&&s.list.find(m=>m.id===idx).claimed&&await waitFor(()=>A.bag.honTe===2040,1500),`nhận lại sau lỗi: được (${s?.err??"ok"})`); }

  // 7. Túi đầy: thư có vật phẩm mới (cần ô trống) bị từ chối cả gói, thư còn nguyên; bỏ một ô rồi nhận được.
  await coin(300); await send({title:"Túi đầy",honTe:60,items:[{code:stackCode,qty:99}],dedup:"bot:full"}); { const idx=A.mv.at(-1).list.find(m=>m.title==="Túi đầy").id;
    const take=A.bag.items.find(i=>i.code===stackCode); if(take){ A.room.send("discard",{id:take.id}); await waitFor(()=>!A.bag.items.some(i=>i.id===take.id),2000); }
    const free=A.bag.slots-loose().length; await test(A,"give",{code:RING_ITEM,qty:free,years:10}); await waitFor(()=>loose().length>=A.bag.slots,2000);
    s=await act({op:"claim",id:idx}); ok(!!s?.err&&/không đủ chỗ/.test(s.err)&&!s.list.find(m=>m.id===idx).claimed&&A.bag.honTe===300,`túi đầy ${loose().length}/${A.bag.slots}: từ chối cả gói, thư còn nguyên (${s?.err})`);
    const one=loose().find(i=>i.code===RING_ITEM); A.room.send("discard",{id:one?.id}); await waitFor(()=>!loose().some(i=>i.id===one?.id),2000);
    s=await act({op:"claim",id:idx}); ok(!s?.err&&await waitFor(()=>A.bag.honTe===360&&A.bag.items.some(i=>i.code===stackCode),1500),`bỏ một ô rồi nhận: được (${s?.err??"ok"})`); }

  // 8. Vào lại phòng: thư còn nguyên (đã nhận / chưa đọc giữ trạng thái).
  await send({title:"Giữ lại",honTe:5,dedup:"bot:keep"}); const keep=A.mv.at(-1).list.map(m=>`${m.id}:${m.claimed}`).sort();
  await A.room.leave(); await sleep(400); A.mapId=(await post("/api/me",{token:A.token})).mapId; A.mv=[]; await enter(A); await waitFor(()=>me(A)&&A.bag,3000);
  ok(await waitFor(()=>A.mv.length>0,3000)&&JSON.stringify(A.mv[0].list.map(m=>`${m.id}:${m.claimed}`).sort())===JSON.stringify(keep)&&A.mv[0].pending===1,`vào lại phòng: ${keep.length} thư còn nguyên, 1 thư chờ nhận`);
  await A.room.leave();
}
