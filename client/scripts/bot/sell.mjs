// Nhóm bot "sell" (#703 bước 2, tách nguyên văn từ bot-test.mjs).
import { SELL_DEFAULTS, parseSell, BONE_MAX_ENHANCE, RING_ITEM, CORE_ITEM, BONE_ITEM, MAX_YEARS, autoSellable, AUTO_SELL_GUARD, AUTO_SELL_FREE, ringSellPrice, CORE_SELL, formatHonTe, AUTO_SELL_BUYBACK } from "../../../shared/data.ts";
import { readFileSync } from "node:fs";
import { same, bot, test, looseOf, enter, trade, npcSpot, mapUrl, ok, post, sleep, waitFor, needHookSkip } from "./lib.mjs";

export async function sellTest(){
  console.log("[#216] Tự bán từ xa khi túi đầy");
  const D=SELL_DEFAULTS, ps=parseSell({on:1,ring:-5,bone:99,core:0,shard:"x",high:true});
  ok(D.on===false&&same(parseSell(null),D)&&ps.on===false&&ps.ring===0&&ps.bone===BONE_MAX_ENHANCE+1&&ps.core===1&&ps.shard===D.shard&&ps.high===true,
    `parseSell: mặc định tắt, kẹp giá trị (${JSON.stringify(ps)})`);
  const cfg={...D,on:true}, R=(years,more={})=>({code:RING_ITEM,years,stars:null,enhance:0,...more}), C=(stars,enhance=0)=>({code:CORE_ITEM,years:null,stars,enhance});
  const B=(enhance)=>({code:BONE_ITEM,years:500,stars:null,enhance}), all={...cfg,ring:MAX_YEARS+1};
  ok(autoSellable(R(500),cfg)&&!autoSellable(R(1500),cfg)&&!autoSellable(R(500,{locked:true}),cfg)&&!autoSellable(R(500,{vohon:1}),cfg)
    &&!autoSellable(R(AUTO_SELL_GUARD),all)&&autoSellable(R(AUTO_SELL_GUARD),{...all,high:true})
    &&autoSellable(C(2),cfg)&&!autoSellable(C(3),cfg)&&!autoSellable(C(1,1),cfg)&&!autoSellable(B(0),cfg)&&autoSellable(B(0),{...cfg,bone:1})&&!autoSellable(B(1),{...cfg,bone:1})
    &&!autoSellable({code:"hoi_huyet_dan",years:null,stars:null,enhance:0},{...all,shard:true,bone:99,core:99}),
    "autoSellable: hồn hoàn dưới ngưỡng, không khoá / gắn, vạn năm cần bật, hồn hạch chưa nâng cấp dưới N sao, hồn cốt dưới mức cường hóa, không bán đan");
  const S=await bot("Tự bán","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(S,"ping"))?.enabled){ needHookSkip("bỏ qua tự bán (cần hook give, coin, warp, goto): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  try{
  const me=()=>S.room.state.players?.get(S.room.sessionId), loose=()=>looseOf(S), free=()=>S.bag.slots-loose().length;
  async function rejoin(){ await S.room.leave(); await sleep(400); S.mapId=(await post("/api/me",{token:S.token})).mapId; await enter(S); await waitFor(()=>me()&&S.bag,3000); }
  async function setSell(c){ const n=S.bagMsgs??0; S.room.send("autosell",{cfg:c}); return waitFor(()=>(S.bagMsgs??0)>n&&same(S.bag.sell,parseSell(c)),1500); }
  await waitFor(()=>me()&&S.bag,3000);
  ok(same(S.bag.sell,D)&&same(S.bag.sold,[]),"tài khoản mới: tự bán tắt, chưa có đồ tự bán");
  await test(S,"coin",{n:0});
  // ---- Khoá món ----
  await test(S,"give",{code:RING_ITEM,qty:1,years:300});
  const lk=loose().find(i=>i.code===RING_ITEM&&i.years===300);
  let t=await trade(S,"lock",{id:lk?.id});
  ok(loose().find(i=>i.id===lk?.id)?.lock===true&&/Đã khoá/.test(t),`khoá hồn hoàn 300 năm (${t})`);
  { const l=S.logs.length; S.room.send("discard",{id:lk.id}); await waitFor(()=>S.logs.length>l,1500);
    ok(loose().some(i=>i.id===lk.id)&&/đang khoá/.test(S.logs.at(-1)??""),`món khoá không bỏ được (${S.logs.at(-1)})`); }
  // Đồ gộp được mới vào túi không gộp vào ô khoá (addItem / bagRoom / bagFits cùng luật): khoá chồng đan khởi đầu rồi nhận thêm 1 viên.
  { const pot=loose().find(i=>i.code==="hoi_huyet_dan"), q0=pot?.qty;
    await trade(S,"lock",{id:pot?.id}); await test(S,"give",{code:"hoi_huyet_dan",qty:1});
    const pots=loose().filter(i=>i.code==="hoi_huyet_dan");
    ok(pots.length===2&&pots.find(i=>i.id===pot.id)?.qty===q0&&pots.find(i=>i.id===pot.id)?.lock&&pots.some(i=>i.id!==pot.id&&i.qty===1&&!i.lock),
      `chồng ${q0} Hồi Huyết Đan đang khoá: viên mới vào ô riêng không khoá`); }
  // ---- Bật tự bán, lấp túi tới dưới AUTO_SELL_FREE ô trống ----
  ok(await setSell(cfg)&&S.bag.sell.on&&free()>=AUTO_SELL_FREE&&S.bag.honTe===0,`bật tự bán khi túi còn ${free()} ô trống: chưa bán gì`);
  await test(S,"give",{code:RING_ITEM,qty:1,years:AUTO_SELL_GUARD}); // vạn năm: không bán (chưa bật `high`)
  await test(S,"give",{code:CORE_ITEM,qty:1,stars:2});
  const n100=free()-2, gain=n100*ringSellPrice(100)+CORE_SELL[1];
  S.autosold=null;
  await test(S,"give",{code:RING_ITEM,qty:n100,years:100});
  ok(await waitFor(()=>S.autosold&&!loose().some(i=>i.code===RING_ITEM&&i.years===100),3000)&&S.autosold.n===n100+1&&S.autosold.coins===gain&&S.bag.honTe===gain,
    `còn 2 ô trống: tự bán ${S.autosold?.n} món (${n100} hồn hoàn 100 năm + hồn hạch 2★), +${formatHonTe(S.autosold?.coins??0)}`);
  const said=S.logs.find(l=>l.startsWith("Đã tự bán"))??"";
  ok(/Đã tự bán .* món, \+/.test(said)&&loose().some(i=>i.id===lk.id)&&loose().some(i=>i.years===AUTO_SELL_GUARD)&&loose().some(i=>i.code==="hoi_huyet_dan"),
    `giữ món khoá, hồn hoàn vạn năm, đan (${said})`);
  ok(S.bag.sold?.length===AUTO_SELL_BUYBACK&&S.bag.sold.every(r=>r.price>0&&r.qty>=1),`giữ ${S.bag.sold?.length}/${AUTO_SELL_BUYBACK} món tự bán gần nhất để mua lại`);
  // ---- Vào lại: bộ lọc, khoá, danh sách mua lại còn nguyên ----
  const sold0=S.bag.sold.map(r=>r.key);
  await rejoin();
  ok(S.bag.sell?.on===true&&same(S.bag.sold?.map(r=>r.key),sold0)&&loose().find(i=>i.id===lk.id)?.lock===true&&S.bag.honTe===gain,
    "thoát vào lại: tự bán vẫn bật, món khoá vẫn khoá, đồ tự bán vẫn mua lại được (lưu cùng túi)");
  // ---- Mua lại ở thương nhân ----
  const tn=npcSpot("nac_dinh_thanh","thuong_nhan");
  S.travel=null; S.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:tn.x,y:tn.y+16});
  ok(await waitFor(()=>S.travel?.mapId==="nac_dinh_thanh",4000),"tới Nặc Đinh Thành");
  await rejoin(); await test(S,"goto",{x:tn.x,y:tn.y+16});
  t=await trade(S,"sell",{id:lk.id}); ok(loose().some(i=>i.id===lk.id)&&/đang khoá/.test(t),`thương nhân: món khoá không bán được (${t})`);
  // Túi chỉ còn 1 ô trống, đầy hồn hoàn vạn năm (bộ lọc không bán): mua lại một món hợp bộ lọc thì món về túi đã khoá, nhịp sau không bị bán lại.
  await test(S,"give",{code:RING_ITEM,qty:free()-1,years:AUTO_SELL_GUARD});
  const r0=S.bag.sold[0], h0=S.bag.honTe;
  t=await trade(S,"buyback",{key:r0.key});
  const back=()=>loose().find(i=>i.code===r0.code&&i.years===r0.years&&i.stars===r0.stars);
  ok(S.bag.honTe===h0-r0.price*r0.qty&&S.bag.sold.length===AUTO_SELL_BUYBACK-1&&!S.bag.sold.some(r=>r.key===r0.key)&&back()?.lock===true&&/đã khoá/.test(t),
    `mua lại món tự bán đúng giá −${formatHonTe(r0.price*r0.qty)}, về túi đã khoá (${t})`);
  await sleep(600);
  ok(back()&&free()===0&&S.bag.honTe===h0-r0.price*r0.qty,`túi đầy, bộ lọc vẫn bật: món vừa mua lại không bị tự bán lại`);
  // Cho bán cả vạn năm, mọi niên hạn: đổi bộ lọc là xét ngay, bán hết hồn hoàn vạn năm, giữ món khoá.
  S.autosold=null; await setSell({...S.bag.sell,ring:MAX_YEARS+1,high:true});
  ok(await waitFor(()=>S.autosold&&!loose().some(i=>i.years===AUTO_SELL_GUARD),3000)&&back()&&loose().some(i=>i.id===lk.id),
    `bật bán cả vạn năm: tự bán ${S.autosold?.n} món, giữ món khoá và món vừa mua lại`);
  // ---- Tự săn: túi đầy thì bán theo bộ lọc rồi săn tiếp, tổng kết có dòng đã tự bán ----
  const autoOp=async(op)=>{ S.autoMsg=null; S.room.send("auto",{op}); await waitFor(()=>S.autoMsg,1500); return S.autoMsg; };
  const objs=JSON.parse(readFileSync(mapUrl("thanh_hon_thon"),"utf8")).layers.flatMap(l=>l.objects??[]), sv=objs.find(o=>o.type==="safe"), tv=npcSpot("thanh_hon_thon","to_van_dao");
  S.travel=null; S.room.send("test",{op:"warp",mapId:"thanh_hon_thon",x:tv.x,y:tv.y+16});
  await waitFor(()=>S.travel?.mapId==="thanh_hon_thon",4000); await rejoin();
  for(const [dx,dy] of [[40,0],[60,0],[40,24],[40,-24],[80,0],[60,48],[60,-48]]){
    const x=sv.x+sv.width+dx, y=Math.max(sv.y+8,Math.min(sv.y+sv.height-8,tv.y))+dy; await test(S,"goto",{x,y});
    if(Math.hypot(me().x-x,me().y-y)<1) break;
  }
  let m=await autoOp("on");
  if(!m?.on){ console.log(`  ⚠ bỏ qua phần tự săn: không bật được (${m?.why})`); return; }
  S.autosold=null;
  await test(S,"give",{code:RING_ITEM,qty:free(),years:50});
  ok(await waitFor(()=>S.autosold,3000)&&me()?.auto&&free()>=AUTO_SELL_FREE,`tự săn: túi đầy thì tự bán ${S.autosold?.n} món, vẫn săn tiếp (còn ${free()} ô trống)`);
  m=await autoOp("off");
  ok(m&&!m.on&&m.sum?.sold?.[0]>=S.autosold?.n&&m.sum.sold[1]>0,`tổng kết tự săn có dòng đã tự bán: ${JSON.stringify(m?.sum?.sold)}`);
  // Tắt tự bán rồi lấp đầy túi: tự săn từ chối như cũ.
  await setSell({...S.bag.sell,on:false}); await test(S,"give",{code:RING_ITEM,qty:free(),years:50});
  m=await autoOp("on"); ok(m&&!m.on&&/túi đồ đã đầy/.test(m.why??""),`tắt tự bán, túi đầy: không bật được tự săn (${m?.why})`);
  } finally { await S.room.leave(); }
}
