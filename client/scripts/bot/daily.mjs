// Nhóm bot "daily" (#703 bước 3, tách nguyên văn từ bot-test.mjs).
import { readFileSync } from "node:fs";
import { post, sleep, waitFor, ok, mapUrl, bot, enter, qtyOf, bagKey, npcSpot, looseOf, same, test, needHookSkip } from "./lib.mjs";
import { TIERS, BAG_SLOTS, itemDef, MAPS, RING_ITEM, vnDay, CORE_ITEM, npcDef, NPC_RANGE, QUEST_STARTER, questChain, parseQuest, questStatus, questRewardText, DAILY, DAILY_POOL, dailyIds, dailyKey, dailyPicks, isDaily, fitBeast, fitMaps, ARENA_SHARDS } from "../../../shared/data.ts";

/**
 * Nhiệm vụ hằng ngày (khảo hạch Sử Lai Khắc của Phất Lan Đức, mục 5.8): hàm thuần (mã chuỗi `daily:<yyyymmdd>:<i>`, bộ bài ổn định
 * theo ngày, bài 1 săn, các bài sau không trùng, mẫu hợp lệ, parseQuest, hồn thú / bản đồ hợp cấp, chỉ đường giữa các bản đồ); tài
 * khoản mới: 3 bài chưa nhận, ở bản đồ khác không nhận được. Ở Thiên Đấu Thành (hook `daily {shift}` chọn ngày có bài đấu hồn và bài
 * nộp đồ): đứng xa bị từ chối, nhận cả 3 bài; nộp đồ đếm theo túi (đồ đang gắn không tính); một trận Đại Đấu Hồn Trường thật với bot
 * thứ hai (tiến độ ghi trong phòng sân đấu, mang về bản đồ); hồn thú không hợp cấp không tính, hợp cấp thì tính; thoát vào lại giữ
 * tiến độ; trả bài: thưởng đúng, đồ nộp bị trừ, túi đầy thì từ chối và giữ nguyên túi, trả lần hai bị từ chối; sang ngày mới (hook
 * `day`) thì đổi bộ bài, bài ngày cũ không trả được.
 */
export async function dailyTest(){
  console.log("[Hằng ngày] Khảo hạch Sử Lai Khắc của Phất Lan Đức");
  const ids=dailyIds("2026-10-21");
  ok(same(ids,["daily:20261021:0","daily:20261021:1","daily:20261021:2"])&&ids.every(isDaily)&&!isDaily(QUEST_STARTER)&&!isDaily("daily:20261021:x")
    &&dailyKey("2026-10-21")==="20261021","mã chuỗi daily:<yyyymmdd>:<i>, không lẫn chuỗi tân thủ");
  const setOf=day=>dailyPicks(dailyKey(day)), sig=day=>setOf(day).map(p=>`${p.tpl.id}/${p.shard}`).join();
  const days=Array.from({length:90},(_,i)=>vnDay(Date.UTC(2026,9,1,5)+i*86400000)), sets=days.map(setOf);
  ok(sig("2026-10-21")===sig("2026-10-21")&&new Set(days.map(sig)).size>20,`cùng ngày cùng bộ bài, 90 ngày có ${new Set(days.map(sig)).size} bộ khác nhau`);
  ok(sets.every(s=>s.length===DAILY.count&&s[0].tpl.group==="hunt"&&s.slice(1).every(p=>p.tpl.group==="misc")&&new Set(s.map(p=>p.tpl.id)).size===s.length
    &&s.every(p=>ARENA_SHARDS.includes(p.shard)))&&DAILY_POOL.every(t=>sets.some(s=>s.some(p=>p.tpl===t))),
    `bài 1 là bài săn, các bài sau không trùng, mảnh võ hồn SR / SSR; mẫu nào (${DAILY_POOL.length}) cũng có ngày ra`);
  ok(DAILY_POOL.every(t=>t.offer.length&&t.done.length&&t.honTe>0&&t.shards>0&&t.goals.length&&t.goals.every(g=>Number.isInteger(g.n)&&g.n>0&&g.text
    &&(!g.near||npcSpot(DAILY.map,g.near))&&(!g.item||itemDef(g.item))&&(g.k!=="give"||g.item)))&&npcSpot(DAILY.map,DAILY.giver),
    `mẫu hợp lệ; ${npcDef(DAILY.giver)?.name} và NPC chỉ đường có ở ${MAPS[DAILY.map].name}`);
  const c0=questChain(ids[0]), g0=c0?.steps[0].goals[0];
  ok(c0&&c0.giver===DAILY.giver&&c0.map===DAILY.map&&c0.steps.length===1&&c0.steps[0].reward.items[0]?.qty===setOf("2026-10-21")[0].tpl.shards&&!questChain("daily:20261021:9"),
    `questChain suy bài từ mã: "${c0?.steps[0].name}", thưởng ${questRewardText(c0?.steps[0].reward??{honTe:0,items:[]})}`);
  ok(same(parseQuest({step:0,accepted:true,prog:[999]},ids[0]).prog,[g0.n])&&questStatus(parseQuest({step:1},ids[0]))==="done"&&questStatus(parseQuest(null,ids[0]))==="offer",
    "parseQuest kẹp tiến độ bài khảo hạch như chuỗi thường");
  ok(fitBeast(10,100)&&!fitBeast(40,100)&&fitBeast(40,5000)&&same(fitMaps(5),["thanh_hon_thon"])&&fitMaps(45).includes("lac_nhat_sam_lam")&&!fitMaps(95).includes("loi_tinh_dau"),
    "hồn thú hợp cấp (không bị giảm kinh nghiệm), bãi săn hợp cấp theo cấp đề xuất");

  const D=await bot("Học viên","bich_lan_xa_hoang",{sex:1,hair:2,hairCol:0,outfitCol:1});
  const dme=()=>D.room.state.players?.get(D.room.sessionId), cur=i=>D.daily.list[i];
  ok(await waitFor(()=>D.daily,2000)&&D.daily.list.length===DAILY.count&&D.daily.list.every(q=>q.status==="offer")&&same(D.daily.list.map(q=>q.chain),dailyIds(D.daily.day)),
    `tài khoản mới: ${DAILY.count} bài ngày ${D.daily?.day} chưa nhận`);
  ok(D.daily.route?.[DAILY.map]==="nac_dinh_thanh"&&D.daily.route?.tinh_dau_ngoai_vi==="nac_dinh_thanh"&&!D.daily.route?.thanh_hon_thon,
    `chỉ đường từ Thánh Hồn Thôn: tới ${MAPS[DAILY.map].name} đi qua Nặc Đinh Thành (${JSON.stringify(D.daily.route)})`);
  /** Gửi `quest {op, chain}` cho bài `i` (hoặc mã `chain`); server luôn trả tin "daily". Trả dòng log cuối của lần này. */
  async function dop(op,i,chain){ const n=D.dailyMsgs, l=D.logs.length; D.room.send("quest",{op,chain:chain??cur(i).chain}); await waitFor(()=>D.dailyMsgs>n,1500); await sleep(60); return D.logs.slice(l).at(-1)??""; }
  let t=await dop("accept",0); ok(/không ở đây/.test(t)&&cur(0).status==="offer",`ở Thánh Hồn Thôn: không nhận được khảo hạch (${t})`);
  if(!(await test(D,"ping"))?.enabled){ needHookSkip("bỏ qua phần khảo hạch (cần hook warp, daily, beast, give, afast…): bật server bằng GAME_TEST=1"); await D.room.leave(); return; }
  const gs=npcSpot(DAILY.map,DAILY.giver), ns=npcSpot(DAILY.map,"dau_hon_truong");
  async function back(b){ b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>b.room.state.players?.get(b.room.sessionId)&&b.owned&&b.bag&&b.daily,3000); }
  async function warp(b,mapId,x,y){
    b.travel=null; b.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>b.travel?.mapId===mapId,4000),`${b.name}: warp -> ${MAPS[mapId].name}`);
    await b.room.leave(); await sleep(300); await back(b);
  }
  await warp(D,DAILY.map,gs.x,gs.y+16);
  ok(D.daily.route?.thanh_hon_thon==="nac_dinh_thanh"&&D.daily.route?.lac_nhat_sam_lam==="lac_nhat_sam_lam",`chỉ đường từ ${MAPS[DAILY.map].name}: ${JSON.stringify(D.daily.route)}`);
  // Chọn ngày (lệch so với hôm nay của server) có cả bài đấu hồn và một bài nộp đồ.
  const today=(await test(D,"daily",{})).day, [y,mo,dd]=today.split("-").map(Number);
  const dayAt=s=>vnDay(Date.UTC(y,mo-1,dd,5)+s*86400000);
  // Ưu tiên bài nộp hồn hạch (thử được cả "đồ đang gắn không tính" và "nộp xong trống ô cho phần thưởng").
  const has=(s,f)=>setOf(dayAt(s)).some(p=>f(p.tpl)), within=f=>Array.from({length:120},(_,s)=>s).find(s=>has(s,x=>x.id==="dau_hon")&&has(s,f));
  const shift=within(x=>x.id==="nop_hon_hach")??within(x=>x.goals.some(g=>g.k==="give"));
  ok(shift!==undefined,`ngày ${dayAt(shift)} (lệch ${shift}) có bài đấu hồn và bài nộp đồ`);
  let n=D.dailyMsgs; const r0=await test(D,"daily",{shift}); await waitFor(()=>D.dailyMsgs>n&&D.daily.day===dayAt(shift),1500);
  ok(r0?.day===dayAt(shift)&&D.daily.day===dayAt(shift)&&same(D.daily.list.map(q=>q.chain),dailyIds(dayAt(shift)))&&D.daily.list.every(q=>q.status==="offer"),
    `hook daily: sang bộ bài ngày ${D.daily.day} (${D.daily.list.map(q=>questChain(q.chain).steps[0].name).join(", ")})`);
  const tpl=i=>questChain(cur(i).chain).steps[0], iH=0, iA=D.daily.list.findIndex((q,i)=>tpl(i).id==="dau_hon"), iG=D.daily.list.findIndex((q,i)=>tpl(i).goals.some(g=>g.k==="give"));
  await test(D,"goto",{x:gs.x+NPC_RANGE+60,y:gs.y+16});
  t=await dop("accept",iH); ok(/lại gần/.test(t)&&cur(iH).status==="offer",`đứng xa ${npcDef(DAILY.giver).name}: không nhận được (${t})`);
  await test(D,"goto",{x:gs.x,y:gs.y+16});
  t=await dop("lung_tung",iH); ok(/không hợp lệ/.test(t),`thao tác lạ bị từ chối (${t})`);
  t=await dop("turnin",iH); ok(/Chưa nhận/.test(t),`chưa nhận thì không trả được (${t})`);
  // Bài nộp đồ: bỏ hết món đó khỏi túi trước khi nhận, gắn một món (nếu là hồn hạch) để thấy đồ đang gắn không tính.
  const gg=tpl(iG).goals.find(g=>g.k==="give"), give=gg.item, loose=()=>looseOf(D).filter(i=>i.code===give&&!(i.enhance>0)).reduce((a,i)=>a+i.qty,0);
  for(const it of looseOf(D).filter(i=>i.code===give)) D.room.send("discard",{id:it.id});
  await waitFor(()=>loose()===0,2000);
  const giveOne=k=>give===CORE_ITEM?test(D,"give",{code:CORE_ITEM,stars:1,set:"tien_co"}):give===RING_ITEM?test(D,"give",{code:RING_ITEM,qty:k}):test(D,"give",{code:give,qty:k});
  if(give===CORE_ITEM){ await giveOne(1); const core=looseOf(D).find(i=>i.code===CORE_ITEM); n=D.ownedMsgs; D.room.send("equipcore",{itemId:core.id,vohonId:D.owned.active}); await waitFor(()=>!looseOf(D).some(i=>i.code===CORE_ITEM),1500); }
  for(const i of [iH,iA,iG]){ const tt=await dop("accept",i); ok(cur(i).accepted&&cur(i).status==="active"&&D.daily.ev==="accept"&&D.daily.i===i,`nhận bài ${i+1} "${tpl(i).name}" (${tt})`); }
  t=await dop("accept",iH); ok(/Đang làm/.test(t),`nhận lại bài đang làm bị từ chối (${t})`);
  const hb=D.bag.honTe; t=await dop("turnin",iG); ok(/Chưa xong/.test(t)&&D.bag.honTe===hb,`chưa đủ đồ thì không trả được (${t})`);
  ok(cur(iG).prog[0]===0,`${give===CORE_ITEM?"hồn hạch đang gắn trên võ hồn không tính":"chưa có món nào"}: ${gg.text} ${cur(iG).prog[0]}/${gg.n}`);
  for(let k=0;k<gg.n-1;k++) await giveOne(1);
  ok(await waitFor(()=>cur(iG).prog[0]===gg.n-1)&&cur(iG).status==="active",`nộp đồ đếm theo túi: ${cur(iG).prog[0]}/${gg.n}`);
  await giveOne(1);
  ok(await waitFor(()=>cur(iG).status==="ready")&&D.daily.ev==="ready",`đủ ${gg.n} món trong túi: bài "${tpl(iG).name}" xong`);
  // Túi đầy: đồ gộp được (đan) nộp xong vẫn còn ô thì từ chối, túi và tiến độ giữ nguyên; đồ mỗi món một ô (hồn hạch, hồn hoàn)
  // nộp xong thì trống ô cho phần thưởng (bớt đồ nộp trước rồi mới kiểm tra chỗ).
  const stacks=itemDef(give).stack>1; if(stacks) await giveOne(1);
  const dropDan=async()=>{ for(const it of looseOf(D).filter(i=>i.code==="hoi_hon_dan")) D.room.send("discard",{id:it.id}); await waitFor(()=>!looseOf(D).some(i=>i.code==="hoi_hon_dan"),2000); };
  await test(D,"give",{code:"hoi_hon_dan",qty:BAG_SLOTS*itemDef("hoi_hon_dan").stack});
  if(stacks){
    const full=bagKey(D); t=await dop("turnin",iG);
    ok(/không đủ chỗ/.test(t)&&bagKey(D)===full&&cur(iG).status==="ready",`túi đầy: không trả được, không mất đồ nộp (${t})`);
    await dropDan();
  }
  async function turnIn(i){
    const s=tpl(i), ht=D.bag.honTe, sh=s.reward.items[0], before=qtyOf(D,sh.code), g=s.goals.find(x=>x.k==="give"), had=g?loose():0, nb=D.bagMsgs??0;
    const tt=await dop("turnin",i); await waitFor(()=>(D.bagMsgs??0)>nb,1500);
    ok(cur(i).status==="done"&&D.daily.ev==="reward"&&D.bag.honTe===ht+s.reward.honTe&&qtyOf(D,sh.code)===before+sh.qty&&(!g||loose()===had-g.n),
      `trả bài ${i+1} "${s.name}": +${questRewardText(s.reward)}${g?`, nộp ${g.n} (${had} -> ${loose()})`:""} (${tt})`);
  }
  await turnIn(iG);
  if(!stacks){ ok(cur(iG).status==="done","túi đầy nhưng đồ nộp chiếm ô: nộp xong đủ chỗ cho phần thưởng"); await dropDan(); }
  t=await dop("turnin",iG); ok(/Đã xong/.test(t)&&cur(iG).status==="done",`trả lần hai bị từ chối (${t})`);

  // Bài đấu hồn: một trận thật với bot thứ hai, hết giờ (hook afast). Tiến độ ghi ở phòng sân đấu, mang về bản đồ.
  const E=await bot("Bạn học","u_minh_linh_mieu",{sex:0,hair:1,hairCol:3,outfitCol:2});
  await warp(E,DAILY.map,ns.x+20,ns.y+16);
  await test(D,"goto",{x:ns.x,y:ns.y+16}); await test(E,"goto",{x:ns.x+20,y:ns.y+16});
  for(const b of [D,E]){ b.arena=[]; b.room.send("arena",{op:"queue"}); }
  const found=b=>b.arena.filter(m=>m.k==="found").at(-1);
  ok(await waitFor(()=>found(D)&&found(E)&&found(D).roomId===found(E).roomId,4000),"xếp hàng ở Đại Đấu Hồn Trường: D gặp E");
  for(const b of [D,E]){ const id=found(b).roomId; await b.room.leave(); await enter(b,id); await waitFor(()=>b.room.state.players?.get(b.room.sessionId)&&b.daily,3000); }
  ok(D.daily?.day===dayAt(shift)&&cur(iA).status==="active",`trong sân: bộ bài ngày ${D.daily?.day} nạp lại từ DB, bài đấu hồn đang làm`);
  await waitFor(()=>D.room.state.phase==="ready",3000); await test(D,"afast",{s:0}); await waitFor(()=>D.room.state.phase==="fight",2000);
  await test(D,"afast",{s:0});
  ok(await waitFor(()=>cur(iA).status==="ready",3000)&&D.daily.ev==="ready",`đánh xong một trận (${D.arena.filter(m=>m.k==="end").at(-1)?.why??"?"}): bài "${tpl(iA).name}" xong`);
  ok(await waitFor(()=>E.daily?.list.every(q=>q.status==="offer"),1000),"E chưa nhận bài đấu hồn: không tính gì");
  for(const b of [D,E]){ await test(b,"afast",{s:0}); await waitFor(()=>b.leftCode===4005,3000); await back(b); }
  ok(D.room.state.mapId===DAILY.map&&cur(iA).status==="ready",`về ${MAPS[DAILY.map].name}: bài đấu hồn vẫn chờ trả`);
  await E.room.leave();

  // Bài săn: hồn thú không hợp cấp không tính, hợp cấp thì tính (cả lúc cấp thấp hơn bãi săn).
  const gh=tpl(iH).goals[0], row=D.owned.active;
  const arD=JSON.parse(readFileSync(mapUrl("tinh_dau_ngoai_vi"),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="arrive"&&o.name==="tu_nac_dinh_thanh");
  await warp(D,"tinh_dau_ngoai_vi",arD.x,arD.y);
  async function killOne(){
    const st=D.room.state; await test(D,"clear"); const ids0=new Set(st.beasts.keys());
    const r=await test(D,"beast",{dx:0,dy:0}); const fresh=()=>r?.bid&&st.beasts.has(r.bid)?r.bid:[...st.beasts.keys()].find(k=>!ids0.has(k)); await waitFor(fresh,1000); const bid=fresh();
    for(let i=0;i<15&&bid&&st.beasts.has(bid);i++){ D.room.send("attack"); await waitFor(()=>!st.beasts.has(bid),450); }
    return !!bid&&!st.beasts.has(bid);
  }
  await test(D,"set",{rowId:row,level:40,xp:0}); await waitFor(()=>dme()?.level===40,1500);
  ok(await killOne()&&(await waitFor(()=>false,300),cur(iH).prog[0]===0),`võ hồn cấp 40 hạ hồn thú bậc ${TIERS[0].color}: không hợp cấp, không tính (${cur(iH).prog[0]}/${gh.n})`);
  await test(D,"set",{rowId:row,level:10,xp:0}); await waitFor(()=>dme()?.level===10,1500);
  ok(await killOne()&&await waitFor(()=>cur(iH).prog[0]===1),`võ hồn cấp 10: hợp cấp, tính (${cur(iH).prog[0]}/${gh.n})`);
  // Thoát vào lại: tiến độ giữ nguyên (lưu cùng túi đồ).
  const q1=JSON.stringify(D.daily.list.map(q=>[q.chain,q.accepted,q.step,q.prog])); await D.room.leave(); await sleep(400); await back(D);
  ok(JSON.stringify(D.daily.list.map(q=>[q.chain,q.accepted,q.step,q.prog]))===q1,`thoát vào lại: tiến độ khảo hạch giữ nguyên ${q1}`);
  n=D.dailyMsgs; await test(D,"daily",{i:iH,step:0,accepted:true,prog:[gh.n-1]}); await waitFor(()=>D.dailyMsgs>n);
  ok(await killOne()&&await waitFor(()=>cur(iH).status==="ready"),`hạ đủ ${gh.n} hồn thú hợp cấp: bài "${tpl(iH).name}" xong`);
  t=await dop("turnin",iH); ok(/không ở đây/.test(t)&&cur(iH).status==="ready",`ở bãi săn: không trả được (${t})`);
  await warp(D,DAILY.map,gs.x,gs.y+16);
  await turnIn(iH); await turnIn(iA);
  ok(D.daily.list.every(q=>q.status==="done"),"xong cả 3 bài hôm nay");

  // Sang ngày mới (hook day của phòng): bộ bài mới chưa nhận, bài ngày cũ không trả được.
  const old=cur(0).chain; n=D.dailyMsgs; await test(D,"day",{shift:1});
  ok(await waitFor(()=>D.dailyMsgs>n&&D.daily.ev==="reset")&&D.daily.day===dayAt(shift+1)&&same(D.daily.list.map(q=>q.chain),dailyIds(dayAt(shift+1)))&&D.daily.list.every(q=>q.status==="offer"),
    `qua 0:00: bộ bài ngày ${D.daily.day} chưa nhận`);
  t=await dop("turnin",0,old); ok(/hết hạn/.test(t),`trả bài ngày cũ bị từ chối (${t})`);
  await test(D,"day",{shift:0}); await test(D,"daily",{shift:0});
  await D.room.leave();
}
