// Nhóm bot cheat, cheat2 (#703 bước 4): chống gian lận 1 (#164) và 2 (#165). Tách nguyên văn từ bot-test.mjs.
import { Client } from "colyseus.js";
import { API, WS, post, sleep, waitFor, ok, bot, enter, npcSpot, trade, looseOf, same, test, needHookSkip } from "./lib.mjs";
import { MAPS, RING_ITEM, vnDay, questChain, DAILY, dailyKey, dailyPicks, ARENA_MAP, BAG_MSG_BURST, BAG_MSG_RATE, MSG_GROUP, MSG_HARD, MSG_FLOOD_CODE, ASK_CD, ATTACK_CD } from "../../../shared/data.ts";

/**
 * Chống gian lận 1 (#164; BOT_ONLY=cheat): message di chuyển, chiến đấu, đi cổng, truyền tống, kênh mang giá trị
 * lạ (sai kiểu, số không hợp lệ, thiếu trường) bị bỏ qua: phòng vẫn chạy, client vẫn ở phòng, vị trí / hồi chiêu / võ hồn ra
 * trận không đổi. Hướng đi quá dài không đi nhanh hơn; gửi dồn đánh
 * thường / đổi võ hồn chỉ ra một lần. Client không tự mở phòng bản đồ (`create`). Xếp ô hồn kỹ / đội hình gửi dồn vẫn lưu đúng lần cuối.
 */
/**
 * #235: matchmake HTTP (joinOrCreate, joinById) kiểm token ở static onAuth trước khi giữ chỗ / mở kênh. Token sai / thiếu gửi dồn quá
 * sức chứa một kênh: không giữ chỗ, không mở kênh mới (danh sách kênh của X không đổi). Token đúng: sai bản đồ / bản đồ sân đấu bị từ
 * chối trước khi giữ chỗ, joinById kênh bản đồ khác không giữ chỗ; mỗi tài khoản giữ tối đa 3 chỗ chưa dùng (kể cả request song song),
 * dùng (mở WebSocket) xong thì giữ được tiếp.
 */
export async function matchmakeSeatTest(X){
  const mm=(m,target,body)=>fetch(API+`/matchmake/${m}/${target}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
    .then(async r=>({status:r.status,...await r.json().catch(()=>({}))})).catch(e=>({status:0,error:String(e)}));
  const chans=async()=>{ await sleep(1050); X.chans=null; X.room.send("channels"); await waitFor(()=>X.chans,1500); return X.chans?.list??null; };
  const cap=(await fetch(API+"/health").then(r=>r.json()).catch(()=>({}))).chMax??60, c0=await chans(), bad=[];
  for(let k=0;k<=cap;k++) for(const [m,t,b] of [["joinOrCreate","map",{mapId:X.mapId}],["joinOrCreate","map",{token:"x".repeat(64),mapId:X.mapId}],
    ["joinOrCreate","map",{token:{toString:0},mapId:X.mapId}],["joinById",X.room.roomId,{token:"sai",mapId:X.mapId}]]){
    const r=await mm(m,t,b);
    if(r.sessionId||r.room||!/không hợp lệ/.test(r.error??"")) bad.push(`${m} ${JSON.stringify(b.token)}: ${r.error??"được giữ chỗ"}`);
  }
  const c1=await chans();
  ok(!bad.length,`matchmake token sai / thiếu ×${4*(cap+1)}: bị từ chối, không giữ chỗ${bad.length?` (${bad[0]})`:""}`);
  ok(c0&&c1&&c1.length<=c0.length&&c1.every(c=>c.n<=(c0.find(o=>o.ch===c.ch)?.n??0)),
    `token sai không mở kênh mới, không chiếm chỗ: ${JSON.stringify(c0?.map(c=>[c.ch,c.n]))} -> ${JSON.stringify(c1?.map(c=>[c.ch,c.n]))}`);
  // Token đúng: tài khoản mới (ở Thánh Hồn Thôn) đã rời phòng.
  const Y=await bot("Giữ chỗ","bich_lan_xa_hoang",{sex:1,hair:0,hairCol:0,outfitCol:0});
  await Y.room.leave(); await sleep(300);
  let r=await mm("joinOrCreate","map",{token:Y.token,mapId:"nac_dinh_thanh"});
  ok(!r.sessionId&&/Sai bản đồ/.test(r.error??""),`token đúng nhưng sai bản đồ: từ chối trước khi giữ chỗ (${r.error??"được giữ chỗ"})`);
  r=await mm("joinOrCreate","map",{token:Y.token,mapId:ARENA_MAP});
  ok(!r.sessionId&&/không tồn tại/.test(r.error??""),`token đúng, bản đồ sân đấu: từ chối (${r.error??"được giữ chỗ"})`);
  r=await mm("joinById",X.room.roomId,{token:Y.token,mapId:Y.mapId});
  const c2=await chans();
  ok(!r.sessionId&&JSON.stringify(c2)===JSON.stringify(c1),`token đúng, joinById kênh bản đồ khác: không giữ chỗ (${r.error??"được giữ chỗ"}; ${JSON.stringify(c2?.map(c=>[c.ch,c.n]))})`);
  // Gửi song song: kiểm số chỗ và ghi chỗ tạm cùng một nhịp nên không cùng lọt qua giới hạn.
  const seats=await Promise.all(Array.from({length:6},()=>mm("joinOrCreate","map",{token:Y.token,mapId:Y.mapId})));
  ok(seats.filter(s=>s.sessionId).length===3&&seats.filter(s=>!s.sessionId).every(s=>/thử lại/.test(s.error??"")),
    `giữ tối đa 3 chỗ chưa dùng mỗi tài khoản (6 request song song): ${seats.map(s=>s.sessionId?"giữ":s.error).join(" / ")}`);
  // Dùng các chỗ đã giữ (mở WebSocket như client): onAuth của phòng vẫn chạy (nạp hồn sư), giữ chỗ lại được.
  let named=0;
  for(const s of seats.filter(s=>s.sessionId)){
    try{ const room=await new Client(WS).consumeSeatReservation(s); if(await waitFor(()=>room.state.players?.get(room.sessionId)?.name===Y.name,3000)) named++; await room.leave(); await sleep(200); }catch{}
  }
  ok(named>=1,`dùng chỗ đã giữ: onAuth của phòng vẫn nạp hồn sư (${named}/3 lần vào)`);
  r=await mm("joinOrCreate","map",{token:Y.token,mapId:Y.mapId});
  ok(!!r.sessionId,`dùng xong thì giữ chỗ lại được (${r.error??"giữ"})`);
  if(r.sessionId){ try{ const room=await new Client(WS).consumeSeatReservation(r); await room.leave(); }catch{} }
}

export async function cheatTest(){
  console.log("\n== Chống gian lận: di chuyển, chiến đấu, đi cổng, truyền tống, kênh (#164) ==");
  // Gọi thẳng HTTP matchmake: với `create` của colyseus.js thì onAuth từ chối (không token) làm client tự rời, nhưng phòng vẫn đã mở.
  const mk=await fetch(API+"/matchmake/create/map",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mapId:"thanh_hon_thon"})})
    .then(async r=>({status:r.status,...await r.json().catch(()=>({}))})).catch(e=>({status:0,error:String(e)}));
  ok(!mk.sessionId&&!mk.room&&/invalid method/.test(mk.error??""),`matchmake create (không token): bị từ chối, không mở phòng, không giữ chỗ (${mk.status} ${mk.error??""})`);
  const X=await bot("Gian lận","bich_lan_xa_hoang",{sex:0,hair:0,hairCol:0,outfitCol:0});
  try{
  if(!(await test(X,"ping"))?.enabled){ needHookSkip("bỏ qua chống gian lận 1 (cần hook rest, set): bật server bằng GAME_TEST=1"); return; }
  // Sang thành (không hồn thú kéo / đẩy làm lệch vị trí khi so trước / sau), vào đúng kênh server chọn như client.
  X.travel=null; X.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>X.travel,4000);
  if(X.travel){ const t=X.travel; await X.room.leave(); await sleep(300); X.mapId=t.mapId; await enter(X,t.roomId??undefined); }
  const sid=X.room.sessionId, me=()=>X.room.state.players?.get(sid);
  await waitFor(()=>me()&&X.owned,3000);
  ok(X.room.state.mapId==="nac_dinh_thanh",`bài chạy ở ${MAPS[X.room.state.mapId]?.name} (thành, không hồn thú)`);
  await matchmakeSeatTest(X);
  const alive=async()=>X.leftCode===null&&(await fetch(API+"/health").then(r=>r.json()).catch(()=>({}))).ok===true;
  const snap=()=>{ const p=me(); return {x:p.x,y:p.y,cds:[...p.cds],bcds:[...p.bcds],swCd:p.swCd,active:X.owned?.active,team:JSON.stringify(X.owned?.team)}; };
  X.room.send("input",{x:0,y:0}); await sleep(200);

  // Giá trị sai kiểu và số không hợp lệ.
  const ODD=[{toString:0},{toString:0,valueOf:0},{x:{y:[1]}},[1],"1",null,true], NUM=[NaN,Infinity,-Infinity,-1,0.5,1e308];
  const probes=[["input",v=>({x:v,y:v,s:v,w:v}),[NaN,Infinity,-Infinity]],["input",()=>({x:1e308,y:1e308,s:-1}),[0]],["attack",v=>v],
    ["skill",v=>({i:v})],["boneskill",v=>({i:v})],["chanthan",v=>v],["switch",v=>({slot:v})],["loadout",v=>({rowId:v,skills:[v,v,v,v]})],
    ["team",v=>({slots:[v,v,v,v]})],["travel",v=>({portal:v})],["wp",v=>({op:"go",key:v})],["wp",v=>({op:v})],["channels",v=>v],["channel",v=>({ch:v})],
    ["test",v=>({op:v})],["arena",v=>({op:v})],["party",v=>({op:v})],["party",v=>({op:"invite",name:v,sid:v})]];
  const s0=snap(), down=[];
  for(const [type,mk,nums=NUM] of probes){
    for(const v of [...ODD,...nums]) X.room.send(type,mk(v));
    X.room.send(type,{}); X.room.send(type,[1,2]); X.room.send(type,"x");
    await sleep(120);
    if(!(await alive())) down.push(type);
  }
  await sleep(300);
  ok(!down.length&&await alive(),`${probes.length} kiểu message × ${ODD.length+NUM.length+3} giá trị lạ: bị bỏ qua, phòng vẫn chạy${down.length?` (hỏng từ ${down[0]})`:""}`);
  if(down.length) return;
  // Các message còn lại (ngoài đợt này): mọi trường mang cùng giá trị lạ.
  const rest=["auto","offline","absorb","pickup","discard","sortbag","lock","autosell","vohons","boss","bag","use","open","unlock","starup","equip","unequip",
    "equipcore","unequipcore","enhance","enhancecore","talk","buy","sell","buyback","expand","shardbuy","shardinfo","looks","quest","resonance","chat",
    "equipgear","unequipgear","equipenh","equipsynth","equipsalvage","equipenhpreview","equipluck","equipluckpreview","coreset","fusion","tong","rally","friend","gm","stats","fog"];
  for(const type of rest){
    for(const v of ODD) X.room.send(type,{op:v,id:v,itemId:v,vohonId:v,vohon:v,slot:v,targetId:v,materialIds:[v],npc:v,code:v,qty:v,key:v,cfg:v,chain:v,text:v,looks:v,ids:[v,v],main:v,sacrifice:[v,v],charm:v,set:v,tong:v,cmd:v,rowId:v});
    X.room.send(type,"x"); X.room.send(type,[1]);
  }
  await sleep(500);
  ok(await alive(),`${rest.length} message khác × ${ODD.length+2} giá trị lạ: phòng vẫn chạy`);
  // Mảng rất dài (vượt giới hạn tải của WebSocket: server đóng kết nối của người gửi) và mảng lồng nhau (200 tầng): bot riêng gửi, phòng của X vẫn chạy.
  const Z=await bot("Gian lận Z","bich_lan_xa_hoang",{sex:0,hair:0,hairCol:0,outfitCol:0});
  try{
    const big=Array.from({length:1e5},(_,i)=>i+1); let nest=[1]; for(let k=0;k<200;k++) nest=[nest];
    for(const ids of [nest,[nest,nest],[...Array(500).keys()]]) Z.room.send("equipsalvage",{ids});
    Z.room.send("equipsynth",{main:1,sacrifice:nest}); Z.room.send("enhance",{targetId:1,materialIds:nest});
    await sleep(500);
    ok(Z.leftCode===null,"mảng lồng 200 tầng, mảng 500 phần tử: server nhận và bỏ qua, kết nối của người gửi còn nguyên");
    try{ Z.room.send("equipsalvage",{ids:[big,nest]}); Z.room.send("equipsynth",{main:1,sacrifice:big}); }catch{} // quá cỡ: server đóng kết nối người gửi
    await sleep(800);
  } finally { await Promise.race([Z.room.leave().catch(()=>{}),sleep(1000)]); }
  ok(await alive(),"equipsalvage / equipsynth / enhance với mảng 10^5 phần tử, mảng lồng 200 tầng: phòng vẫn chạy");

  // Giới hạn tin ghi túi (#677): dồn 200 tin sortbag thì server bỏ phần dư (không ngắt), tin sau khi hồi token vẫn xử lý.
  await test(X,"baglimit",{on:1}); const lg0=X.logs.length; for(let k=0;k<200;k++) X.room.send("sortbag"); await sleep(800);
  const sorted=X.logs.slice(lg0).filter(t=>/sắp xếp túi/.test(t)).length;
  ok(await alive()&&X.leftCode===null,`dồn 200 tin sortbag: phòng sống, kết nối không bị ngắt`);
  ok(sorted>=1&&sorted<=BAG_MSG_BURST+BAG_MSG_RATE*2,`server chỉ xử lý ${sorted}/200 tin sortbag (trần ${BAG_MSG_BURST} dồn + ${BAG_MSG_RATE}/giây)`);
  await sleep(1100); const lg1=X.logs.length; X.room.send("sortbag"); await waitFor(()=>X.logs.length>lg1,2000);
  ok(X.logs.length>lg1,"hết dồn, token hồi lại: tin sortbag tiếp theo vẫn được xử lý");
  // Giới hạn tin theo nhóm + trần tuyệt đối (#734): dồn tin mua bán / đọc dữ liệu bị bỏ phần dư (không ngắt); dồn quá trần tuyệt đối thì ngắt.
  const countSell=async(type,payload,n)=>{ const l0=X.logs.length; for(let k=0;k<n;k++) X.room.send(type,payload); await sleep(800); return X.logs.length-l0; };
  const trade=await countSell("sell",{id:999999,qty:1,npc:"khong_co"},200);
  ok(trade>=1&&trade<=MSG_GROUP.trade.burst+MSG_GROUP.trade.rate*2&&X.leftCode===null,`dồn 200 tin sell: server chỉ xử lý ${trade} (trần ${MSG_GROUP.trade.burst} dồn + ${MSG_GROUP.trade.rate}/giây), không ngắt`);
  await sleep(1100); { const l1=X.logs.length; X.room.send("sell",{id:999999,qty:1,npc:"khong_co"}); await waitFor(()=>X.logs.length>l1,2000); ok(X.logs.length>l1,"hết dồn, token hồi lại: tin sell tiếp theo vẫn được xử lý"); }
  { let got=0; const h=()=>{got++;}; X.room.onMessage("shardinfo",h); for(let k=0;k<200;k++) X.room.send("shardinfo"); await sleep(800);
    ok(got>=1&&got<=MSG_GROUP.read.burst+MSG_GROUP.read.rate*2&&X.leftCode===null,`dồn 200 tin shardinfo: server chỉ trả ${got} (trần ${MSG_GROUP.read.burst} dồn + ${MSG_GROUP.read.rate}/giây), không ngắt`); }
  { const F=await bot("Dồn tin F","bich_lan_xa_hoang",{sex:0,hair:0,hairCol:0,outfitCol:0}); // bot riêng: bị ngắt không ảnh hưởng các bài sau
    try{ await test(F,"baglimit",{on:1}); const n=MSG_HARD.burst+MSG_HARD.maxOver+300; for(let k=0;k<n;k++) F.room.send("input",{x:0,y:0}); await waitFor(()=>F.leftCode!==null,3000);
      ok(F.leftCode===MSG_FLOOD_CODE&&await alive(),`dồn ${n} tin input một gói: vượt trần tuyệt đối, server ngắt kết nối người gửi (mã ${F.leftCode}), phòng vẫn chạy`);
    } finally { await Promise.race([F.room.leave().catch(()=>{}),sleep(1000)]); } }
  { const G=await bot("Dồn tin G","bich_lan_xa_hoang",{sex:0,hair:0,hairCol:0,outfitCol:0}); // gửi đều tay theo loạt nhỏ: vẫn bị ngắt
    try{ await test(G,"baglimit",{on:1}); const t0=Date.now(); let sent=0; while(G.leftCode===null&&Date.now()-t0<5000){ for(let k=0;k<30;k++){ G.room.send("stats",{rowId:0}); sent++; } await sleep(5); }
      ok(G.leftCode===MSG_FLOOD_CODE&&await alive(),`dồn đều tay ${sent} tin trong ${Date.now()-t0} ms: server vẫn ngắt kết nối người gửi (mã ${G.leftCode})`);
    } finally { await Promise.race([G.room.leave().catch(()=>{}),sleep(1000)]); } }
  { const H=await bot("Kéo chuột H","bich_lan_xa_hoang",{sex:0,hair:0,hairCol:0,outfitCol:0}); // 240 Hz kéo chuột 3 giây (> rate): không bị ngắt, tin input cuối vẫn tới
    try{ await test(H,"baglimit",{on:1}); const hp=()=>H.room.state.players?.get(H.room.sessionId); await waitFor(()=>hp(),3000);
      for(let k=0;k<720;k++){ H.room.send("input",{x:1,y:0,s:k}); if(k%4===3) await sleep(16); } H.room.send("input",{x:0,y:0,s:999}); await sleep(600); const x1=hp().x; await sleep(500);
      ok(H.leftCode===null&&Math.abs(hp().x-x1)<1,`240 Hz kéo chuột 3 giây: không bị ngắt, tin dừng cuối vẫn xử lý (nhân vật đứng yên)`);
    } finally { await Promise.race([H.room.leave().catch(()=>{}),sleep(1000)]); } }
  await test(X,"baglimit",{on:0}); // các bài sau dọn túi hàng loạt: tắt lại
  for(let k=0;k<5;k++) X.room.send("test",{op:"throw"}); // lỗi bất ngờ trong handler (hook): chỉ ghi log
  await sleep(300);
  ok(await alive()&&(await test(X,"ping"))?.enabled,"lỗi bất ngờ trong handler (hook throw ×5): phòng vẫn xử lý message tiếp");
  const s1=snap();
  ok(Math.hypot(s1.x-s0.x,s1.y-s0.y)<0.5,`giá trị lạ không làm hồn sư di chuyển (${s0.x.toFixed(1)},${s0.y.toFixed(1)} -> ${s1.x.toFixed(1)},${s1.y.toFixed(1)})`);
  ok(s1.cds.every(c=>c===0)&&s1.bcds.every(c=>c===0)&&s1.swCd===0&&s1.active===s0.active&&s1.team===s0.team,
    `giá trị lạ không tung hồn kỹ / kỹ năng hồn cốt, không đổi võ hồn hay đội hình (hồi chiêu ${s1.cds}/${s1.bcds}/${s1.swCd})`);

  // Hướng đi dài bao nhiêu cũng chỉ đi đúng tốc độ (clampDir), tốc độ do server tính.
  const p0={x:me().x,y:me().y}, spd=me().spd;
  X.room.send("input",{x:1e9,y:1}); await sleep(500); X.room.send("input",{x:0,y:0}); await sleep(300);
  const moved=Math.hypot(me().x-p0.x,me().y-p0.y);
  ok(spd>0&&moved<=spd*0.9,`input {x: 1e9}: đi ${moved.toFixed(1)} px trong ~0,5 giây, không quá tốc độ ${spd.toFixed(1)} px/giây`);

  // Gửi dồn trong một nhịp: đánh thường chỉ ra một đòn (ATTACK_CD) hoặc một dòng từ chối (vùng an toàn); đổi võ hồn chỉ một lần (SWITCH_CD).
  X.fxs=[]; let l=X.logs.length;
  for(let k=0;k<30;k++) X.room.send("attack");
  await sleep(300);
  const swings=X.fxs.filter(f=>f.k==="slash"&&f.id===sid).length+X.logs.slice(l).filter(t=>/Vùng an toàn/.test(t)).length;
  ok(swings===1,`gửi dồn 30 lần attack: ${swings} đòn / lần từ chối (ATTACK_CD ${ATTACK_CD} giây)`);
  await test(X,"rest",{s:10});
  const slot=X.owned.team.findIndex(r=>r&&r!==X.owned.active);
  l=X.logs.length;
  for(let k=0;k<10;k++) X.room.send("switch",{slot});
  await sleep(300);
  const outs=X.logs.slice(l).filter(t=>/ra trận/.test(t)).length;
  ok(slot>=0&&outs===1&&me().swCd>0,`gửi dồn 10 lần switch: đổi võ hồn ${outs} lần, hồi ${me().swCd.toFixed(1)} giây`);

  // Xếp ô hồn kỹ / đội hình gửi dồn (ngoài giao chiến): lần ghi DB gộp lại nhưng vẫn lưu đúng lần cuối.
  await test(X,"rest",{s:10});
  const row=X.owned.active, other=X.owned.list.find(v=>v.rowId!==row)?.rowId;
  await test(X,"set",{rowId:row,rings:[50,50]});
  for(let k=0;k<41;k++) X.room.send("loadout",{rowId:row,skills:k%2?[0,1,-1,-1]:[1,0,-1,-1]});
  for(let k=0;k<21;k++) X.room.send("team",{slots:k%2?[row,0,0,0]:[other,0,0,0]});
  ok(await waitFor(()=>X.owned?.active===other&&same(X.owned.team,[other,0,0,0])&&same(X.owned.list.find(v=>v.rowId===row)?.skills,[1,0,-1,-1]),3000),
    `gửi dồn 41 lần loadout, 21 lần team: lần cuối có hiệu lực (ô ${JSON.stringify(X.owned?.list.find(v=>v.rowId===row)?.skills)}, đội ${JSON.stringify(X.owned?.team)})`);
  await X.room.leave(); await sleep(300);
  X.mapId=(await post("/api/me",{token:X.token})).mapId; await enter(X); await waitFor(()=>X.owned&&me(),3000);
  const v=X.owned?.list.find(x=>x.rowId===row);
  ok(X.owned?.active===other&&same(X.owned.team,[other,0,0,0])&&same(v?.skills,[1,0,-1,-1])&&same(v?.rings,[50,50]),
    `vào lại: đội ${JSON.stringify(X.owned?.team)}, ra trận ${X.owned?.active}, ô hồn kỹ ${JSON.stringify(v?.skills)}, hồn hoàn ${JSON.stringify(v?.rings)} đúng lần cuối`);
  } finally { await X.room.leave().catch(()=>{}); }
}

/**
 * Chống gian lận 2 (#165; BOT_ONLY=cheat2 chỉ chạy phần này): tin xin lại `bag` / `vohons` / `quest get` theo nhịp ASK_CD (gửi dồn chỉ
 * nhận tối đa 2 tin); hồn hoàn đang hấp thụ không tính cho bài khảo hạch nộp hồn hoàn, thôi hấp thụ thì tính lại; đang ghi phần thưởng
 * boss (claimBusy, hook claimhold) thì không bán / bỏ / hấp thụ đồ, xong thì bán được; đi cổng commit xong mà phòng nhận lỗi (hook
 * travellost) thì vẫn chuyển bản đồ. Phần lưu một transaction (saveProgress) thử ở `npm run test:accounts --prefix server`.
 */
export async function cheatBagTest(){
  console.log("[Chống gian lận 2] Túi đồ, mua bán, phần thưởng (#165)");
  const G=await bot("Gian lận","bich_lan_xa_hoang",{sex:1,hair:1,hairCol:2,outfitCol:3});
  if(!(await test(G,"ping"))?.enabled){ needHookSkip("bỏ qua phần chống gian lận 2 (cần hook give, daily, warp, claimhold…): bật server bằng GAME_TEST=1"); await G.room.leave(); return; }
  // Nhịp tin xin lại dữ liệu riêng: gửi dồn 20 lần trong một nhịp thì nhận 1 tin ngay (hoặc khi hết nhịp của lần xin trước) và tối đa 1
  // tin hẹn khi hết nhịp; chờ tối đa 3 nhịp để bắt tin thừa nếu server không gộp. Túi đếm tin "bag" (cả túi, chỉ gửi khi xin), không đếm "bagd".
  for(const [type,msg,cnt] of [["bag",undefined,()=>G.bagStat.bag.n],["vohons",undefined,()=>G.ownedMsgs],["quest",{op:"get"},()=>G.questMsgs]]){
    const n0=cnt(); for(let k=0;k<20;k++) G.room.send(type,msg);
    const got=await waitFor(()=>cnt()>n0,2000); await waitFor(()=>cnt()>n0+2,ASK_CD*3000);
    ok(got&&cnt()-n0<=2,`gửi dồn 20 tin "${type}": nhận ${cnt()-n0} tin (gộp theo nhịp ASK_CD ${ASK_CD} giây)`);
    const n1=cnt(); G.room.send(type,msg);
    ok(await waitFor(()=>cnt()>n1,2000),`hết nhịp: xin "${type}" lần nữa vẫn được trả`);
  }
  const gs=npcSpot(DAILY.map,DAILY.giver);
  G.travel=null; G.room.send("test",{op:"warp",mapId:DAILY.map,x:gs.x,y:gs.y+16});
  ok(await waitFor(()=>G.travel?.mapId===DAILY.map,4000),`warp -> ${MAPS[DAILY.map].name}`);
  await G.room.leave(); await waitFor(()=>G.leftCode!==null,2000);
  G.mapId=(await post("/api/me",{token:G.token})).mapId; await enter(G); await waitFor(()=>G.room.state.players?.get(G.room.sessionId)&&G.owned&&G.bag&&G.daily,3000);
  // Hồn hoàn đang hấp thụ không tính cho bài khảo hạch nộp hồn hoàn. Chọn ngày (hook daily lệch cho cả tiến trình, nên luôn trả về 0 ở
  // finally) có bài đó.
  const setOf=day=>dailyPicks(dailyKey(day)), today=(await test(G,"daily",{})).day, [y,mo,dd]=today.split("-").map(Number);
  const dayAt=s=>vnDay(Date.UTC(y,mo-1,dd,5)+s*86400000), shift=Array.from({length:240},(_,s)=>s).find(s=>setOf(dayAt(s)).some(p=>p.tpl.id==="nop_hon_hoan"));
  try{
    let n=G.dailyMsgs; if(shift!==undefined){ await test(G,"daily",{shift}); await waitFor(()=>G.dailyMsgs>n&&G.daily.day===dayAt(shift),1500); }
    const iR=G.daily.list.findIndex(q=>questChain(q.chain)?.steps[0].id==="nop_hon_hoan");
    ok(shift!==undefined&&iR>=0,`ngày ${shift===undefined?"?":dayAt(shift)} (lệch ${shift}) có bài nộp hồn hoàn (bài ${iR+1})`);
    if(iR>=0) await ringGiveTest(iR);
  } finally { await test(G,"daily",{shift:0}); }
  async function ringGiveTest(iR){
    const st=()=>G.daily.list[iR]?.status;
    async function dq(op){ const k=G.dailyMsgs, l=G.logs.length; G.room.send("quest",{op,chain:G.daily.list[iR].chain}); await waitFor(()=>G.dailyMsgs>k&&G.logs.length>l,1500); return G.logs.slice(l).at(-1)??""; }
    await test(G,"goto",{x:gs.x,y:gs.y+16});
    for(const it of looseOf(G).filter(i=>i.code===RING_ITEM)) G.room.send("discard",{id:it.id});
    await waitFor(()=>!looseOf(G).some(i=>i.code===RING_ITEM),2000);
    let t=await dq("accept"); ok(G.daily.list[iR].accepted,`nhận bài "${questChain(G.daily.list[iR].chain).steps[0].name}" (${t})`);
    // Võ hồn ra trận ở bình cảnh cấp 10, chưa có hồn hoàn; một hồn hoàn trong túi thì bài đủ.
    await test(G,"set",{rowId:G.owned.active,level:10,xp:0,rings:[]}); await test(G,"give",{code:RING_ITEM,qty:1});
    ok(await waitFor(()=>looseOf(G).some(i=>i.code===RING_ITEM)&&st()==="ready",2000),"một hồn hoàn trong túi: bài nộp hồn hoàn đủ");
    const ring=looseOf(G).find(i=>i.code===RING_ITEM);
    const absorb=async()=>{ G.absorbing=null; G.room.send("absorb",{itemId:ring.id}); return waitFor(()=>G.absorbing?.on,1500); };
    ok(await absorb()&&await waitFor(()=>st()==="active",1500),`bắt đầu hấp thụ hồn hoàn đó: bài về chưa đủ (${st()})`);
    // Đi một bước: thôi hấp thụ, hồn hoàn lại tính.
    G.room.send("input",{x:1,y:0}); await waitFor(()=>G.absorbing?.on===false,1500); G.room.send("input",{x:0,y:0});
    ok(G.absorbing?.result==="cancel"&&await waitFor(()=>st()==="ready",1500),"di chuyển thì thôi hấp thụ: hồn hoàn lại tính, bài đủ");
    await test(G,"goto",{x:gs.x,y:gs.y+16});
    ok(await absorb()&&await waitFor(()=>st()==="active",1500),"hấp thụ lại: bài về chưa đủ");
    t=await dq("turnin");
    ok(/Chưa xong/.test(t)&&G.absorbing?.on&&looseOf(G).some(i=>i.id===ring.id)&&st()==="active",`trả bài khi hồn hoàn duy nhất đang hấp thụ: từ chối, hấp thụ vẫn chạy (${t})`);
    await test(G,"rush"); ok(await waitFor(()=>G.absorbing?.result==="ok"&&!looseOf(G).some(i=>i.id===ring.id),1500),"hấp thụ xong bình thường");
    await test(G,"give",{code:RING_ITEM,qty:1}); await waitFor(()=>st()==="ready",1500);
    t=await dq("turnin"); ok(/Trả khảo hạch/.test(t)&&st()==="done",`có hồn hoàn khác trong túi: trả bài được (${t})`);
  }
  // Đang ghi phần thưởng boss (claimBusy): không bán / bỏ / hấp thụ; nhả thì bán được.
  const sp=npcSpot(DAILY.map,"thuong_nhan_thien_dau"); await test(G,"goto",{x:sp.x,y:sp.y+16});
  await test(G,"set",{rowId:G.owned.active,level:20,xp:0,rings:[10]}); await test(G,"give",{code:RING_ITEM,qty:1});
  await waitFor(()=>looseOf(G).some(i=>i.code===RING_ITEM),1500);
  const r2=looseOf(G).find(i=>i.code===RING_ITEM), h0=G.bag.honTe;
  ok((await test(G,"claimhold",{on:true}))?.busy===true,"hook claimhold: giữ như đang chờ DB ghi phần thưởng boss");
  let t=await trade(G,"sell",{id:r2.id,npc:"thuong_nhan_thien_dau"});
  ok(/phần thưởng boss/.test(t)&&G.bag.honTe===h0&&looseOf(G).some(i=>i.id===r2.id),`đang ghi phần thưởng boss: không bán được (${t})`);
  { const l=G.logs.length; G.room.send("discard",{id:r2.id}); await waitFor(()=>G.logs.length>l,1500);
    ok(/phần thưởng boss/.test(G.logs.at(-1))&&looseOf(G).some(i=>i.id===r2.id),`không bỏ được (${G.logs.at(-1)})`); }
  { const l=G.logs.length; G.absorbing=null; G.room.send("absorb",{itemId:r2.id}); await waitFor(()=>G.logs.length>l,1500);
    ok(/phần thưởng boss/.test(G.logs.at(-1))&&!G.absorbing?.on,`không hấp thụ được (${G.logs.at(-1)})`); }
  ok((await test(G,"claimhold",{on:false}))?.busy===false,"nhả claimhold");
  t=await trade(G,"sell",{id:r2.id,npc:"thuong_nhan_thien_dau"});
  ok(/^Bán/.test(t)&&G.bag.honTe>h0&&!looseOf(G).some(i=>i.id===r2.id),`xong thì bán được (${t})`);
  // Đi cổng mà transaction đã commit nhưng phòng nhận lỗi (hook travellost): server đọc lại DB, thấy đã ở bản đồ đích thì vẫn cho đi (không
  // ở lại phòng cũ, nơi mọi lần lưu sau sẽ bị lớp chặn WHERE map_id bỏ); lưu ở phòng mới vẫn được.
  { const ns=npcSpot("nac_dinh_thanh","thuong_nhan"), l=G.logs.length; await test(G,"travellost");
    G.travel=null; G.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:ns.x,y:ns.y+16});
    ok(await waitFor(()=>G.travel?.mapId==="nac_dinh_thanh",4000)&&!G.logs.slice(l).some(x=>/Không chuyển được/.test(x)),
      "đi cổng báo lỗi sau khi đã commit: vẫn chuyển bản đồ, không báo lỗi cho người chơi");
    await G.room.leave(); await waitFor(()=>G.leftCode!==null,2000);
    G.mapId=(await post("/api/me",{token:G.token})).mapId; await enter(G); await waitFor(()=>G.room.state.players?.get(G.room.sessionId)&&G.bag,3000);
    ok(G.mapId==="nac_dinh_thanh"&&G.room.state.mapId==="nac_dinh_thanh",`/api/me và phòng mới: ${G.mapId}`);
    await test(G,"coin",{n:4321}); await G.room.leave(); await waitFor(()=>G.leftCode!==null,2000);
    await enter(G); await waitFor(()=>G.bag,3000);
    ok(G.bag?.honTe===4321,`lưu ở phòng mới vẫn được: vào lại còn ${G.bag?.honTe} đồng`); }
  await G.room.leave();
}
