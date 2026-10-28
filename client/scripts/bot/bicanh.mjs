// Nhóm bot "bicanh" (Bí Cảnh, mục 5.22, P2 + P4 #877; BOT_ONLY=bicanh, nhóm 2 của BOT_PART): tin `bicanh {op:"get"|"enter"|"buy", id, pay?}` và dùng Hồn Kinh Quyển qua server thật.
// Giờ do server quyết nên bot đẩy ngày bằng hook `day {shift}` (room.dayShift, khóa ngày Bí Cảnh dùng cùng đồng hồ), không bao giờ gửi giờ / ngày. Ranh giới 04:59 / 05:00 và giá lũy tiến
// là hàm thuần, do server/scripts/bicanh-test.ts thử; ở đây thử đường đi đầy đủ: get, id lạ, mua chưa xác nhận / thiếu Hồn Tệ / đúng giá lũy tiến / quá trần,
// dồn 200 `buy`, ghi lỗi hoàn lại (savefail), qua ngày đặt lại lượt, dùng quyển cho võ hồn dự bị / đang ra trận, kẹp bình cảnh, không mất quyển khi bị từ chối.
import { sleep, waitFor, ok, bot, test, qtyOf, needHookSkip } from "./lib.mjs";
import { bicanhRoomTest } from "./bicanhRoom.mjs";
import { ASK_CD, BICANH, bicanhRunPrice, itemDef, xpNeed } from "../../../shared/data.ts";

export async function bicanhTest(){
  console.log("[#877] Bí Cảnh: lượt, mua lượt, Hồn Kinh Quyển qua server");
  const A=await bot("Bí Cảnh A","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3});
  if(!(await test(A,"ping"))?.enabled){ needHookSkip("bỏ qua Bí Cảnh (cần hook day, coin, savefail, set): bật server bằng GAME_TEST=1"); await A.room.leave(); return; }
  const S=BICANH.scenes[0], ID=S.id, HOUR=3600000, price=i=>bicanhRunPrice(S,i), runOf=m=>m?.runs?.find(r=>r.id===ID);
  await waitFor(()=>A.bag,3000);
  /** Gửi một tin `bicanh` và chờ tin trả lời mới (mọi lần từ chối cũng trả lại trạng thái kèm `err`); trả tin đó + dòng log mới. */
  const act=async msg=>{ const n=A.bc.length, nl=A.logs.length; A.room.send("bicanh",msg); const got=await waitFor(()=>A.bc.length>n,3000); await sleep(80); return got?{...A.bc.at(-1),log:A.logs.slice(nl).at(-1)}:null; };
  const get=async()=>{ await sleep(ASK_CD*1000+100); return act({op:"get"}); };
  const coin=async n=>{ await test(A,"coin",{n}); return waitFor(()=>A.bag.honTe===n,1500); };
  const honTe=async want=>{ await waitFor(()=>A.bag.honTe===want,1500); return A.bag.honTe; };
  let cur=0;
  const shift=async n=>{ if(n===cur) return; cur=n; await test(A,"day",{shift:n}); await sleep(1300); }; // tick mỗi giây tự gửi lại trạng thái khi qua ngày Bí Cảnh

  // 1. get: đủ lượt miễn phí, chưa mua, giá lượt mua đầu, đếm ngược tới 05:00 (server tính).
  let s=await get(), r=runOf(s);
  ok(r&&r.name===S.name&&r.left===S.runs&&r.max===S.runs&&r.bought===0&&r.price===price(0)&&s.resetIn>0&&s.resetIn<=24*HOUR&&!s.err,
    `get lúc mới: ${r?.left}/${r?.max} lượt, đã mua ${r?.bought}, giá lượt mua ${r?.price}, làm mới sau ${Math.round(s?.resetIn/60000)} phút`);
  ok(s.runs.length===BICANH.scenes.length,"danh sách đúng các phụ bản của BICANH.scenes");
  const reset0=s.resetIn; await sleep(1200); s=await get(); ok(s.resetIn<=reset0&&reset0-s.resetIn<5000,`đếm ngược không tăng (${reset0} → ${s.resetIn})`);
  // 2. Tin lạ / id lạ: không đổi gì, không rớt kết nối.
  { const n=A.bc.length; for(const m of [{op:"set"},{op:1},null,{},"x",{op:"buy"},{op:"buy",id:null},{op:"buy",id:"x",pay:true},{op:"buy",id:{}},{op:"enter",id:"__proto__"},{op:"enter",id:7}]) A.room.send("bicanh",m); await sleep(600);
    ok(A.leftCode===null,"tin lạ / id lạ: vẫn kết nối"); ok(A.bc.slice(n).every(x=>x.err)&&runOf(A.bc.at(-1)??s)?.left!==0,"tin lạ chỉ có thể trả lỗi, không đổi lượt"); }
  // 3. `enter` (vào phòng, trừ lượt, dồn 200, hoàn lượt, thưởng) do bicanhRoomTest thử ở cuối (bicanhRoom.mjs).
  // 4. Mua lượt: chưa xác nhận / thiếu Hồn Tệ → từ chối, không mất tiền.
  await coin(price(0)+500);
  s=await act({op:"buy",id:ID}); ok(!!s?.err&&/xác nhận/.test(s.err)&&runOf(s).bought===0&&A.bag.honTe===price(0)+500,`buy chưa xác nhận (pay): từ chối, không trừ tiền (${s?.err})`);
  s=await act({op:"buy",id:ID,pay:"true"}); ok(!!s?.err&&runOf(s).bought===0&&A.bag.honTe===price(0)+500,"pay không phải true thật: coi như chưa xác nhận");
  await coin(price(0)-1); s=await act({op:"buy",id:ID,pay:true}); ok(!!s?.err&&/không đủ Hồn Tệ/i.test(s.err)&&A.bag.honTe===price(0)-1&&runOf(s).bought===0,`thiếu Hồn Tệ: từ chối, không mất gì (${s?.err})`);
  // 5. Mua đúng giá lũy tiến từng lượt tới nửa trần; mỗi lượt thêm một lượt vào, trừ đúng giá.
  const half=Math.max(1,Math.floor(S.buyMax/2)); let have=1e7;
  await coin(have);
  for(let i=0;i<half;i++){ s=await act({op:"buy",id:ID,pay:true}); have-=price(i);
    ok(!s?.err&&runOf(s).bought===i+1&&runOf(s).left===S.runs+i+1&&runOf(s).max===S.runs+i+1&&runOf(s).price===(i+1<S.buyMax?price(i+1):null)&&await honTe(have)===have,
      `mua lượt #${i+1}: −${price(i)} Hồn Tệ, ${runOf(s)?.left}/${runOf(s)?.max} lượt, giá kế tiếp ${runOf(s)?.price}`); }
  // 6. Dồn 200 buy (xác nhận) cùng lúc: nhịp nhóm `trade` có thể bỏ bớt tin, nhưng số lượt mua không bao giờ vượt trần và tiền trừ đúng tổng giá các lượt đã mua; rồi mua nốt từng lượt tới trần.
  { for(let k=0;k<200;k++) A.room.send("bicanh",{op:"buy",id:ID,pay:true}); await sleep(3000); s=await get(); r=runOf(s);
    const sum=n=>{ let t=0; for(let i=0;i<n;i++) t+=price(i); return t; };
    ok(r.bought>=half&&r.bought<=S.buyMax&&r.left===S.runs+r.bought&&await honTe(1e7-sum(r.bought))===1e7-sum(r.bought)&&A.leftCode===null,
      `dồn 200 buy: đã mua ${r.bought}/${S.buyMax} (không vượt trần), Hồn Tệ 10000000→${A.bag.honTe} (đúng tổng giá ${r.bought} lượt = ${sum(r.bought)})`);
    await sleep(3500); // nhịp trade hồi token sau đợt dồn
    for(let k=0;k<S.buyMax&&runOf(s).bought<S.buyMax;k++) s=await act({op:"buy",id:ID,pay:true});
    r=runOf(s); ok(r.bought===S.buyMax&&r.left===S.runs+S.buyMax&&r.price===null&&await honTe(1e7-sum(S.buyMax))===1e7-sum(S.buyMax),`mua nốt tới trần: ${r.bought}/${S.buyMax}, tổng phí ${sum(S.buyMax)}, hết lượt mua (price null)`); }
  const hon1=A.bag.honTe; s=await act({op:"buy",id:ID,pay:true}); ok(!!s?.err&&/đã mua đủ/.test(s.err)&&A.bag.honTe===hon1&&runOf(s).bought===S.buyMax,`quá trần mua: từ chối, không trừ tiền (${s?.err})`);
  // 7. Qua ngày Bí Cảnh (đẩy +1 ngày): lượt đặt lại, trần mua đặt lại, giá về lượt đầu; về lại ngày cũ thì thấy lại số đã mua hôm đó.
  await shift(1); s=await get(); r=runOf(s); ok(r.left===S.runs&&r.max===S.runs&&r.bought===0&&r.price===price(0),`+1 ngày: lượt đặt lại ${r.left}/${r.max}, đã mua ${r.bought}, giá ${r.price}`);
  await shift(0); s=await get(); ok(runOf(s).bought===S.buyMax,"về lại ngày cũ: vẫn thấy lượt đã mua hôm đó (ghi theo ngày)");
  // 8. Ghi lỗi (savefail): hoàn lại Hồn Tệ, không tăng lượt mua; mua lại được ngay sau đó.
  await shift(2); await coin(5e4);
  await test(A,"savefail",{n:1,only:"bag"}); s=await act({op:"buy",id:ID,pay:true});
  ok(!!s?.err&&/Không lưu được/.test(s.err)&&runOf(s).bought===0&&await honTe(5e4)===5e4,`ghi DB lỗi: hoàn Hồn Tệ, lượt mua không tăng (${s?.err})`); await sleep(200);
  s=await act({op:"buy",id:ID,pay:true}); ok(!s?.err&&runOf(s).bought===1&&await honTe(5e4-price(0))===5e4-price(0),"mua lại sau lỗi: được");

  // 9. Hồn Kinh Quyển: dùng cho võ hồn dự bị (cộng kinh nghiệm, kẹp bình cảnh), cho võ hồn ra trận, từ chối thì không mất quyển.
  const def=itemDef(BICANH.tome), act0=A.owned.active, benchId=A.owned.list.find(v=>v.rowId!==act0)?.rowId;
  ok(!!def&&def.kind==="kinh_quyen"&&!!benchId,`có Hồn Kinh Quyển trong ITEMS và một võ hồn dự bị (rowId ${benchId})`);
  await test(A,"give",{code:BICANH.tome,qty:9}); await waitFor(()=>qtyOf(A,BICANH.tome)===9,1500);
  const tomeIt=()=>A.bag.items.find(i=>i.code===BICANH.tome), vo=id=>A.owned.list.find(v=>v.rowId===id), RINGS5=[1000,1000,1000,1000,1000];
  const use=async vohonId=>{ const n=A.ownedMsgs, nl=A.logs.length, q=qtyOf(A,BICANH.tome); A.room.send("use",{id:tomeIt()?.id,vohonId}); await waitFor(()=>A.ownedMsgs>n||A.logs.length>nl,1500); await sleep(150); await waitFor(()=>qtyOf(A,BICANH.tome)!==q,400); return A.logs.slice(nl).join(" | "); };
  // Võ hồn dự bị cấp 50, 5 vòng (bình cảnh ở cấp 60): +tomeXp kinh nghiệm, không lên cấp.
  await test(A,"set",{rowId:benchId,level:50,xp:0,rings:RINGS5}); let q=qtyOf(A,BICANH.tome), lg=await use(benchId);
  ok(qtyOf(A,BICANH.tome)===q-1&&vo(benchId).level===50&&vo(benchId).xp===BICANH.tomeXp&&BICANH.tomeXp<xpNeed(50),`quyển cho võ hồn dự bị: −1 quyển, +${BICANH.tomeXp} kinh nghiệm (xp ${vo(benchId).xp}, cấp ${vo(benchId).level}) (${lg})`);
  // Gần ngưỡng lên cấp: lên cấp bình thường, kinh nghiệm dư chuyển sang cấp mới.
  await test(A,"set",{rowId:benchId,level:50,xp:xpNeed(50)-100,rings:RINGS5}); q=qtyOf(A,BICANH.tome); lg=await use(benchId);
  ok(qtyOf(A,BICANH.tome)===q-1&&vo(benchId).level===51&&vo(benchId).xp===BICANH.tomeXp-100,`quyển làm lên cấp 51, kinh nghiệm dư ${vo(benchId).xp} (${lg})`);
  // Chạm bình cảnh giữa chừng: kinh nghiệm dừng ở bình cảnh (cấp 60 với 5 vòng), phần dư không giữ lại.
  await test(A,"set",{rowId:benchId,level:59,xp:xpNeed(59)-10,rings:RINGS5}); q=qtyOf(A,BICANH.tome); lg=await use(benchId);
  ok(qtyOf(A,BICANH.tome)===q-1&&vo(benchId).level===60&&vo(benchId).xp===0&&/bình cảnh/.test(lg),`lên tới bình cảnh cấp 60 thì dừng, xp ${vo(benchId).xp} (${lg})`);
  // Đang ở bình cảnh: từ chối, không mất quyển, không đổi cấp / kinh nghiệm.
  q=qtyOf(A,BICANH.tome); lg=await use(benchId); ok(qtyOf(A,BICANH.tome)===q&&vo(benchId).level===60&&vo(benchId).xp===0&&/bình cảnh/.test(lg),`võ hồn đang ở bình cảnh: từ chối, không mất quyển (${lg})`);
  // Võ hồn lạ / thiếu: từ chối, không mất quyển.
  for(const bad of [999999,undefined,null,"x",{}]){ lg=await use(bad); ok(qtyOf(A,BICANH.tome)===q&&/Chọn võ hồn/.test(lg),`võ hồn ${JSON.stringify(bad)}: từ chối, không mất quyển`); }
  // Võ hồn đang ra trận: cùng đường cộng kinh nghiệm.
  await test(A,"set",{rowId:act0,level:30,xp:0,rings:[1000,1000,1000]}); await sleep(200); q=qtyOf(A,BICANH.tome); lg=await use(act0);
  const me=A.room.state.players.get(A.room.sessionId);
  ok(qtyOf(A,BICANH.tome)===q-1&&me.xp===BICANH.tomeXp&&me.level===30,`quyển cho võ hồn ra trận: +${BICANH.tomeXp} kinh nghiệm (xp ${me.xp}) (${lg})`);
  // Võ hồn ra trận vừa chạm bình cảnh bằng chính quyển (cấp thật ở state, d.ch chưa chép): dùng ngay quyển thứ hai phải bị từ chối, không mất quyển.
  await test(A,"set",{rowId:act0,level:9,xp:xpNeed(9)-1,rings:[]}); await sleep(200); q=qtyOf(A,BICANH.tome);
  A.room.send("use",{id:tomeIt()?.id,vohonId:act0}); A.room.send("use",{id:tomeIt()?.id,vohonId:act0}); await sleep(800);
  ok(qtyOf(A,BICANH.tome)===q-1&&A.room.state.players.get(A.room.sessionId).level===10,`võ hồn ra trận chạm bình cảnh: quyển thứ hai bị từ chối, chỉ mất 1 quyển (${q}→${qtyOf(A,BICANH.tome)}, cấp ${A.room.state.players.get(A.room.sessionId).level})`);
  await A.room.leave();
  await bicanhRoomTest();
}
