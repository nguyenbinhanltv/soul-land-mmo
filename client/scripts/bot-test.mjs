// Kiểm thử nhanh: 2 bot đăng nhập, tạo nhân vật, qua lễ thức tỉnh, vào phòng bản đồ, xếp đội hình, đổi võ hồn trong trận,
// di chuyển, đánh hồn thú, thử hấp thụ, rồi vào lại để kiểm tra đội hình đã lưu.
// Bot thứ ba (tài khoản mới mỗi lần chạy) đi cổng Thánh Hồn Thôn -> Nặc Đinh Thành -> Tinh Đấu -> Nặc Đinh Thành,
// thoát và vào lại để kiểm tra bản đồ và vị trí đã lưu (BĐ2).
// Chạy khi server đang bật: npm run bot --prefix client   (server khác cổng: SERVER_URL=http://localhost:2600)
// Phần luật gục từng võ hồn và chia kinh nghiệm (2.3b) cần server bật hook kiểm thử: GAME_TEST=1 npm run dev:server.
import { Client } from "colyseus.js";
import { existsSync, readFileSync } from "node:fs";
import { TIERS, TEAM_SIZE, XP_SHARE_ACTIVE, XP_SHARE_BENCH, REVIVE_SECS, RESPAWN_SECS, xpNeed, beastLevel, xpLevelScale } from "../../shared/data.ts";
const API=process.env.SERVER_URL??"http://localhost:2567", WS=API.replace(/^http/,"ws");
const post=async(p,b)=>{const r=await fetch(API+p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}); return {status:r.status,...await r.json()};};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const waitFor=async(fn,ms=2000)=>{for(let t=0;t<ms;t+=50){if(fn()) return true; await sleep(50);} return false;};
let fails=0; const ok=(cond,msg)=>{console.log(cond?"  ✓":"  ✗",msg); if(!cond) fails++;};

// Tạo nhân vật (một lần, trước lễ thức tỉnh; tài khoản cũ chọn lại một lần), rồi lễ thức tỉnh:
// tài khoản mới tự chọn 1 SSR (kèm Lam Ngân Thảo); tài khoản cũ không thức tỉnh lại được.
async function bot(name,choice,looks){
  const l=await post("/api/login",{name,password:"abcd"});
  console.log(`[${name}] ${l.character?"đã thức tỉnh từ trước":"tài khoản mới"}, ${l.looks?.chosen?"đã tạo nhân vật":"chưa tạo nhân vật"}`);
  ok(l.looks&&["sex","hair","hairCol","outfitCol"].every(k=>Number.isInteger(l.looks[k])),"login trả ngoại hình");
  if(!l.looks?.chosen){
    if(!l.character) ok((await post("/api/awaken",{token:l.token,vohon:choice})).status===409,"thức tỉnh trước khi tạo nhân vật -> 409");
    let joined=true; try{ const r=await new Client(WS).joinOrCreate("map",{token:l.token}); await r.leave(); }catch{ joined=false; }
    ok(!joined,"vào bản đồ trước khi tạo nhân vật bị từ chối");
    for(const bad of [{...looks,sex:2},{...looks,hair:4},{...looks,hairCol:-1},{...looks,outfitCol:6},{...looks,hair:1.5},{...looks,sex:"1"},{sex:0}])
      ok((await post("/api/looks",{token:l.token,...bad})).status===400,`ngoại hình sai ${JSON.stringify(bad)} -> 400`);
    const r=await post("/api/looks",{token:l.token,...looks});
    ok(r.status===200&&r.looks?.chosen&&r.looks.hairCol===looks.hairCol,`tạo nhân vật ${JSON.stringify(looks)}`);
  }
  ok((await post("/api/looks",{token:l.token,...looks})).status===409,"tạo nhân vật lần hai -> 409");
  const me=await post("/api/me",{token:l.token});
  ok(me.looks?.chosen,"/api/me: đã tạo nhân vật");
  ok(typeof me.mapId==="string"&&me.mapId===l.mapId,`/api/login và /api/me trả bản đồ đang đứng: ${me.mapId}`);
  if(!l.character) ok(me.mapId==="thanh_hon_thon","tài khoản mới bắt đầu ở Thánh Hồn Thôn");
  if(!l.character){
    ok((await post("/api/awaken",{token:l.token})).status===400,"thiếu lựa chọn -> 400");
    ok((await post("/api/awaken",{token:l.token,vohon:"hao_thien_chuy"})).status===400,"chọn UR -> 400");
    ok((await post("/api/awaken",{token:l.token,vohon:"lam_ngan_thao"})).status===400,"chọn Lam Ngân Thảo -> 400");
    const a=await post("/api/awaken",{token:l.token,vohon:choice});
    ok(a.status===200 && a.character?.vohon===choice,`thức tỉnh ${choice}, cấp ${a.character?.level}`);
  }
  ok((await post("/api/awaken",{token:l.token,vohon:choice})).status===409,"thức tỉnh lần hai -> 409");
  // Không gửi mapId: server chọn bản đồ mặc định và báo qua state.mapId.
  const b={name,token:l.token,logs:[],owned:null,ownedMsgs:0,looks:me.looks,isNew:!l.character,mapId:me.mapId};
  await enter(b);
  return b;
}
/** Vào phòng bản đồ và nghe tin nhắn riêng (log, danh sách võ hồn + đội hình). */
async function enter(b){
  // Bản đồ đang đứng lấy từ /api/me (server lưu); client chỉ chuyển mapId để ghép phòng.
  b.room=await new Client(WS).joinOrCreate("map",{token:b.token,mapId:b.mapId}); b.owned=null; b.ownedMsgs=0; b.portal=null; b.travel=null;
  b.room.onMessage("log",m=>b.logs.push(m.text)); for(const t of ["chat","fx","dmg"]) b.room.onMessage(t,()=>{});
  b.room.onMessage("portal",m=>{b.portal=m;}); b.room.onMessage("travel",m=>{b.travel=m;});
  b.room.onMessage("vohons",m=>{b.owned=m; b.ownedMsgs++;});
  b.room.onMessage("squad",m=>{b.squad=m; b.squadMsgs=(b.squadMsgs??0)+1;});
  b.room.onMessage("ko",m=>{b.ko=m;});
  b.room.onMessage("test",m=>{b.test=m;});
  b.room.send("vohons");
}
const lastLog=(b,re)=>waitFor(()=>re.test(b.logs.at(-1)??""),800);
/** Gửi đội hình rồi chờ server gửi lại đội (đã lưu hoặc bị từ chối). */
async function sendTeam(b,slots){ const n=b.ownedMsgs; b.room.send("team",{slots}); await waitFor(()=>b.ownedMsgs>n); return b.owned.team; }
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const A=await bot("Tester A","ta_hoa_phuong_hoang",{sex:1,hair:2,hairCol:3,outfitCol:4}), B=await bot("Tester B","bich_lan_xa_hoang",{sex:0,hair:3,hairCol:5,outfitCol:1});
await sleep(800);
const st=A.room.state, p=st.players.get(A.room.sessionId);
console.log("players",st.players.size,"beasts",st.beasts.size,"lvl",p.level,"hp",p.hp,"/",p.maxHp);

// Bản đồ: hai bot cùng một phòng, state có mapId và file Tiled tương ứng tồn tại.
ok(A.room.roomId===B.room.roomId,"A và B cùng phòng");
// Ngoại hình đồng bộ qua schema: B thấy đúng ngoại hình A đã lưu.
const aSeen=B.room.state.players.get(A.room.sessionId);
ok(aSeen&&["sex","hair","hairCol","outfitCol"].every(k=>aSeen[k]===A.looks[k]),`B thấy ngoại hình A: ${aSeen&&[aSeen.sex,aSeen.hair,aSeen.hairCol,aSeen.outfitCol].join("/")}`);
ok(typeof st.mapId==="string"&&st.mapId.length>0,`state.mapId = ${st.mapId}`);
ok(existsSync(new URL(`../../shared/assets/${st.mapId}.json`,import.meta.url)),`có file shared/assets/${st.mapId}.json`);
const species=new Set(); st.beasts.forEach(b=>species.add(b.species));
console.log("  loài đang có (chỉ số BEASTS):",[...species].sort((a,b)=>a-b).join(", "));
ok(species.size>1,"hồn thú có nhiều loài");

// Võ hồn sở hữu: chỉ chính chủ nhận danh sách.
ok(await waitFor(()=>A.owned&&B.owned),"nhận danh sách võ hồn riêng");
const vhs=A.owned?.list.map(v=>v.vohon)??[];
console.log("  A sở hữu:",vhs.join(", "),"| ra trận:",A.owned?.active);
ok(vhs.includes("lam_ngan_thao"),"A có Lam Ngân Thảo");
ok(A.owned&&B.owned&&!A.owned.list.some(v=>B.owned.list.some(w=>w.rowId===v.rowId)),"danh sách A và B tách biệt");

// Đội hình 4 ô: chỉ chính chủ nhận; võ hồn ra trận luôn nằm trong đội.
const T=A.owned?.team??[], ids=A.owned?.list.map(v=>v.rowId)??[], bView=()=>B.room.state.players.get(A.room.sessionId);
console.log("  đội A:",JSON.stringify(T),"| ra trận:",A.owned?.active);
ok(T.length===4&&T.includes(A.owned.active)&&T.every(r=>r===0||ids.includes(r)),"A có đội 4 ô, võ hồn ra trận nằm trong đội");
if(A.isNew) ok(T[0]===A.owned.active&&T.filter(Boolean).length===2,"tài khoản mới: võ hồn ra trận ở ô 1, Lam Ngân Thảo trong đội");
console.log("  B: tin vohons",B.ownedMsgs,"đội",JSON.stringify(B.owned?.team));
ok(B.ownedMsgs===1&&!B.owned.team.some(r=>r&&T.includes(r)),"B không nhận đội hình của A");
ok(!("team" in bView()),"state công khai không có đội hình");

// Xếp đội (ngoài giao chiến): chặn đội sai, đổi chỗ, bỏ võ hồn ra trận khỏi đội.
const [x,y]=ids, base=[x,y,0,0];
ok(same(await sendTeam(A,base),base),`xếp đội ${JSON.stringify(base)}`);
for(const [bad,re,why] of [[[x,999999,0,0],/không sở hữu/,"võ hồn không sở hữu"],[[x,x,0,0],/không hợp lệ/,"trùng võ hồn"],[[x,y,0],/không hợp lệ/,"thiếu ô"],
  [[0,0,0,0],/không hợp lệ/,"đội trống"],[[x,"2",0,0],/không hợp lệ/,"ô không phải số"],[[x,-1,0,0],/không hợp lệ/,"số âm"]])
  ok(same(await sendTeam(A,bad),base)&&await lastLog(A,re),`chặn đội sai: ${why}`);
const swapped=[0,0,y,x], act0=A.owned.active;
ok(same(await sendTeam(A,swapped),swapped)&&A.owned.active===act0,"đổi chỗ trong đội, võ hồn ra trận giữ nguyên");
const solo=[0,act0===x?y:x,0,0];
ok(same(await sendTeam(A,solo),solo)&&A.owned.active===solo[1],"bỏ võ hồn ra trận khỏi đội -> võ hồn còn lại ra trận");
ok(await waitFor(()=>p.vh===bView()?.vh&&p.level===A.owned.list.find(v=>v.rowId===solo[1]).level),"state và B thấy võ hồn mới");
ok(same(await sendTeam(A,base),base),"xếp lại đội 2 võ hồn");

// Đổi võ hồn trong đội bằng switch {slot}: hồi chiêu 3 giây, chặn ô trống và chỉ số sai.
async function switchTo(slot){
  const want=A.owned.team[slot], vh0=p.vh; A.room.send("switch",{slot});
  return await waitFor(()=>A.owned.active===want&&p.vh!==vh0&&bView()?.vh===p.vh);
}
const s0=A.owned.team.indexOf(A.owned.active), s1=1-s0;
ok(await switchTo(s1),`switch ô ${s1+1}: đổi sang ${A.owned.list.find(v=>v.rowId===A.owned.active)?.vohon}, B thấy`);
ok(p.swCd>2&&p.swCd<=3,`hồi chiêu đổi ${p.swCd.toFixed(2)} giây`);
const actNow=A.owned.active; A.room.send("switch",{slot:s0}); await sleep(300);
ok(A.owned.active===actNow,"đang hồi chiêu: không đổi được");
A.room.send("switch",{slot:2}); ok(await lastLog(A,/đang trống/),"chặn đổi sang ô trống");
for(const bad of [{slot:4},{slot:-1},{slot:"x"},{slot:1.5},{}]) A.room.send("switch",bad);
await sleep(300); ok(A.owned.active===actNow,"bỏ qua switch có ô sai");

// Hướng nhìn 4 phía (PlayerState.dir: 0 xuống, 1 phải, 2 lên, 3 trái) do server tính từ input.
const aView=()=>B.room.state.players.get(A.room.sessionId);
for(const [x,y,d] of [[0,1,0],[-1,0,3],[0,-1,2],[0.6,0.4,1]]){
  A.room.send("input",{x,y});
  ok(await waitFor(()=>p.dir===d&&aView()?.dir===d),`input ${x},${y} -> hướng ${d}, B thấy ${aView()?.dir}`);
}
A.room.send("input",{x:0,y:0}); await sleep(200);
ok(p.dir===1,"đứng yên giữ hướng nhìn cũ");
// Trong làng (vùng safe) không có hồn thú: theo đường làng đông–tây (hàng ô 27–28, tools/gen-map.mjs) ra Bãi tập rồi mới săn.
const safe=JSON.parse(readFileSync(new URL(`../../shared/assets/${st.mapId}.json`,import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="safe");
const inSafe=()=>safe&&p.x>=safe.x&&p.x<=safe.x+safe.width&&p.y>=safe.y&&p.y<=safe.y+safe.height;
if(inSafe()){
  const ry=27.5*16; A.room.send("input",{x:0,y:Math.sign(ry-p.y)}); await waitFor(()=>Math.abs(p.y-ry)<3,4000);
  A.room.send("input",{x:1,y:0}); await waitFor(()=>!inSafe()&&p.x>safe.x+safe.width+24,8000);
} else { A.room.send("input",{x:1,y:0}); await sleep(1500); }
console.log("A x",p.x.toFixed(1),"B sees A x",B.room.state.players.get(A.room.sessionId).x.toFixed(1));
const kills0=p.kills;
for(let i=0;i<300;i++){
  let best=null,bd=1e9; st.beasts.forEach(b=>{const d=Math.hypot(b.x-p.x,b.y-p.y); if(d<bd){bd=d;best=b;}});
  if(best){ const dx=best.x-p.x,dy=best.y-p.y,d=Math.hypot(dx,dy)||1; A.room.send("input",{x:+(dx/d).toFixed(2),y:+(dy/d).toFixed(2)}); if(d<22) A.room.send("attack"); }
  await sleep(100);
  if(st.drops.size) break;
}
A.room.send("input",{x:0,y:0});
console.log("drops",st.drops.size,"kills",p.kills,"xp",p.xp,"lvl",p.level,"logs",A.logs.slice(-2));
// Vừa đánh xong (đang giao chiến): đổi võ hồn trong đội được, xếp đội thì không.
if(p.kills>kills0){
  await waitFor(()=>p.swCd===0,3500);
  const want=A.owned.team.find(r=>r&&r!==A.owned.active), t0=[...A.owned.team];
  A.room.send("switch",{slot:A.owned.team.indexOf(want)});
  ok(await waitFor(()=>A.owned.active===want),"đổi võ hồn trong đội khi đang giao chiến");
  ok(same(await sendTeam(A,[t0[1],t0[0],t0[2],t0[3]]),t0)&&await lastLog(A,/giao chiến/),"chặn xếp đội khi đang giao chiến");
}
let dr=null; st.drops.forEach(d=>dr=d);
if(dr){ for(let i=0;i<50 && Math.hypot(dr.x-p.x,dr.y-p.y)>10;i++){const dx=dr.x-p.x,dy=dr.y-p.y,d=Math.hypot(dx,dy); A.room.send("input",{x:+(dx/d).toFixed(2),y:+(dy/d).toFixed(2)}); await sleep(60);} A.room.send("input",{x:0,y:0}); await sleep(150); A.room.send("absorb"); await sleep(300); console.log("absorb:",A.logs.at(-1)); }
// ---------- 2.3b: gục từng võ hồn, hồi sinh, chia kinh nghiệm 40/20 cho đội ----------
// Hàm luật thuần trong shared/data.ts: cấp tương đương theo bậc và giảm kinh nghiệm theo chênh cấp (mục 5.3).
ok(same(TIERS.map((_,t)=>beastLevel(t)),[10,10,20,40,70]),`cấp tương đương theo bậc: ${TIERS.map((_,t)=>beastLevel(t)).join("/")}`);
ok(xpLevelScale(19,10)===1&&xpLevelScale(20,10)===0.5&&xpLevelScale(30,10)===0.1&&xpLevelScale(99,70)===0.5&&xpLevelScale(5,70)===1,"giảm kinh nghiệm 100/50/10%, cấp võ hồn tính tối đa 80");
ok(A.squad&&B.squad&&!B.squad.list.some(s=>A.owned.team.includes(s.rowId)),"tin squad chỉ gửi cho chính chủ");
async function test(b,op,extra={}){ b.test=null; const n=b.ownedMsgs; b.room.send("test",{op,...extra}); await waitFor(()=>b.test&&b.ownedMsgs>n); return b.test; }
const vOf=r=>A.owned.list.find(v=>v.rowId===r), sq=r=>A.squad?.list.find(s=>s.rowId===r);
const spawnObj=JSON.parse(readFileSync(new URL(`../../shared/assets/${st.mapId}.json`,import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>(o.type??o.class)==="spawn");
const inCamp=()=>p.x>=spawnObj.x&&p.x<=spawnObj.x+spawnObj.width&&p.y>=spawnObj.y&&p.y<=spawnObj.y+spawnObj.height;
if(!(await test(A,"ping"))?.enabled) console.log("  ⚠ bỏ qua kiểm tra 2.3b (gục, hồi sinh, chia kinh nghiệm): bật server bằng GAME_TEST=1");
else {
  await waitFor(()=>p.swCd===0&&p.absorb===0,8000); // lần thử hấp thụ ở trên có thể còn đang chạy
  const a=A.owned.active, bn=A.owned.team.find(r=>r&&r!==a), orig=[a,bn].map(r=>({rowId:r,level:vOf(r).level,xp:vOf(r).xp,rings:[...vOf(r).rings]}));
  ok(A.owned.team.filter(Boolean).length===2&&TEAM_SIZE===4,"đội 2 võ hồn, 2 ô trống");
  /** Hạ hồn thú bậc `tier` (qua hook): trả về kinh nghiệm mỗi võ hồn nhận được. */
  const kill=async tier=>{ const x0=[a,bn].map(r=>vOf(r).xp); await test(A,"kill",{tier}); return [a,bn].map((r,i)=>vOf(r).xp-x0[i]); };
  const split=(lv,tier)=>{ const base=TIERS[tier].xp*xpLevelScale(lv,beastLevel(tier)); return [Math.round(base*XP_SHARE_ACTIVE),Math.round(base*XP_SHARE_BENCH)]; };
  // Chia 40/20: hai võ hồn cấp 5 chưa có hồn hoàn (chưa bình cảnh, đủ xa mốc lên cấp).
  await test(A,"set",{rowId:a,level:5,xp:0,rings:[]}); await test(A,"set",{rowId:bn,level:5,xp:0,rings:[]});
  let got=await kill(1), want=split(5,1);
  ok(same(got,want)&&want[0]<xpNeed(5)&&await waitFor(()=>p.xp===want[0],1000),`chia kinh nghiệm hồn thú ${TIERS[1].age}: ra trận +${got[0]}, võ hồn khác +${got[1]} (cần ${want.join("/")}); ô trống bỏ đi`);
  // Võ hồn ở bình cảnh không nhận, phần đó không dồn cho võ hồn ra trận.
  await test(A,"set",{rowId:bn,level:10,xp:0,rings:[]});
  got=await kill(1);
  ok(got[0]===want[0]&&got[1]===0&&vOf(bn).level===10,`võ hồn ở bình cảnh không nhận: +${got.join("/")}`);
  // Giảm theo chênh cấp với võ hồn ra trận (một lần, trước khi chia).
  await test(A,"set",{rowId:bn,level:5,xp:0,rings:[]});
  for(const [lv,rings] of [[25,[10,100]],[35,[10,100,100]]]){
    await test(A,"set",{rowId:a,level:lv,xp:0,rings});
    got=await kill(1); want=split(lv,1);
    ok(same(got,want),`ra trận cấp ${lv}, hồn thú cấp tương đương ${beastLevel(1)}: x${xpLevelScale(lv,beastLevel(1))} -> +${got.join("/")} (cần ${want.join("/")})`);
  }
  await test(A,"set",{rowId:a,level:5,xp:0,rings:[]});

  // Ra khỏi doanh trại (ở doanh trại võ hồn gục hồi ngay).
  for(let i=0;i<80&&inCamp();i++){ A.room.send("input",{x:1,y:0}); await sleep(100); }
  A.room.send("input",{x:0,y:0}); await sleep(150);
  ok(!inCamp(),"đứng ngoài doanh trại");
  // Võ hồn ra trận gục -> tự đổi sang võ hồn còn sống, không chờ hồi chiêu đổi; võ hồn mới giữ sinh lực riêng (đầy).
  const s0=A.owned.team.indexOf(bn); A.room.send("switch",{slot:s0});
  ok(await waitFor(()=>A.owned.active===bn&&p.swCd>2),"đổi tay sang ô 2, đang hồi chiêu đổi");
  const cd0=p.swCd; A.ko=null; await test(A,"down");
  ok(await waitFor(()=>A.owned.active===a&&A.ko?.next),`võ hồn gục tự đổi sang ${A.ko?.next} dù đang hồi chiêu`);
  ok(!p.dead&&p.hp===p.maxHp,`không gục cả người, võ hồn mới đủ sinh lực riêng ${p.hp}/${p.maxHp}`);
  ok(p.swCd>0&&p.swCd<=cd0,`hồi chiêu đổi không bị tính thêm (${p.swCd.toFixed(2)})`);
  ok(/gục.*tự động ra trận/.test(A.logs.join("\n")),"thông báo tự đổi võ hồn");
  ok(await waitFor(()=>sq(bn)?.down>0&&sq(bn).hp===0&&A.squad.combat),`squad: ${vOf(bn).vohon} đã gục, còn ${sq(bn)?.down} giây, đang giao chiến`);
  await waitFor(()=>p.swCd===0,3500);
  A.room.send("switch",{slot:s0}); ok(await lastLog(A,/đã gục/)&&A.owned.active===a,"không đổi vào võ hồn đã gục");
  // Hồi lại sau REVIVE_SECS giây ngoài trận.
  await test(A,"rest",{s:REVIVE_SECS-1});
  ok(sq(bn)?.down===1,`nghỉ ${REVIVE_SECS-1} giây: vẫn gục, còn ${sq(bn)?.down} giây`);
  await test(A,"rest",{s:2});
  ok(await waitFor(()=>sq(bn)?.down===0&&sq(bn).hp===sq(bn).maxHp)&&await lastLog(A,/hồi phục/),`nghỉ đủ ${REVIVE_SECS} giây ngoài trận: hồi đầy ${sq(bn)?.hp}/${sq(bn)?.maxHp}`);
  // Cả đội gục: về doanh trại, không mất kinh nghiệm, hồi đầy cả đội.
  await test(A,"kill",{tier:0});
  const xpBefore=[a,bn].map(r=>vOf(r).xp);
  A.ko=null; await test(A,"down"); await waitFor(()=>A.owned.active===bn);
  A.ko=null; await test(A,"down");
  ok(await waitFor(()=>p.dead&&A.ko&&A.ko.next===null)&&/cả đội/i.test(A.logs.join("\n")),"cả đội gục: thông báo về doanh trại");
  ok(same([a,bn].map(r=>vOf(r).xp),xpBefore),`không mất kinh nghiệm (${xpBefore.join("/")})`);
  ok(await waitFor(()=>!p.dead,RESPAWN_SECS*1000+1500)&&inCamp(),"hồi sinh ở doanh trại");
  ok(await waitFor(()=>p.hp===p.maxHp&&A.squad.list.every(s=>!s.down&&s.hp===s.maxHp)),"cả đội hồi đầy");
  // Ở doanh trại: võ hồn gục hồi ngay.
  const act=A.owned.active; await test(A,"down");
  ok(await waitFor(()=>A.owned.active!==act&&sq(act)?.down===0)&&/doanh trại/.test(A.logs.slice(-3).join("\n")),"gục trong doanh trại: tự đổi rồi hồi ngay");
  for(const o of orig) await test(A,"set",o);
}

B.room.send("chat",{text:"xin chào"}); await sleep(200);
await A.room.leave(); await B.room.leave();

// Vào lại: đội hình, võ hồn ra trận và tiến độ từng võ hồn (cả võ hồn không ra trận) đã lưu.
const prog=()=>A.owned.list.map(v=>[v.rowId,v.level,v.xp]);
const saved={team:[...A.owned.team],active:A.owned.active,prog:prog()}; await sleep(500);
await enter(A); await waitFor(()=>A.owned);
ok(A.owned&&same(A.owned.team,saved.team)&&A.owned.active===saved.active,`vào lại: đội ${JSON.stringify(A.owned?.team)}, ra trận ${A.owned?.active}`);
ok(same(prog(),saved.prog),`vào lại: cấp, kinh nghiệm từng võ hồn đã lưu ${JSON.stringify(prog())}`);
await A.room.leave();

// ---------- BĐ2: cổng, chặn mềm, lưu bản đồ và vị trí ----------
console.log("[cổng] tài khoản mới đi Thánh Hồn Thôn -> Nặc Đinh Thành -> Tinh Đấu -> Nặc Đinh Thành");
let C=await bot("Lữ "+Date.now().toString(36).slice(-6),"bich_lan_xa_hoang",{sex:0,hair:1,hairCol:2,outfitCol:3});
const me=()=>C.room.state.players?.get(C.room.sessionId);
let joinErr=""; try{ const r=await new Client(WS).joinOrCreate("map",{token:C.token,mapId:"nac_dinh_thanh"}); await r.leave(); }catch(e){ joinErr=String(e?.message??e); }
ok(/Sai bản đồ/.test(joinErr),`vào bản đồ khác bản đồ đã lưu bị từ chối: ${joinErr}`);
ok(C.room.state.mapId==="thanh_hon_thon","C ở Thánh Hồn Thôn");
/** Đi theo vector (x,y) đến khi cond() đúng hoặc hết giờ, rồi dừng. */
async function walk(x,y,cond,ms=12000){ C.room.send("input",{x,y}); const r=await waitFor(cond,ms); C.room.send("input",{x:0,y:0}); await sleep(150); return r; }
/** Đi tới cột x (pixel) theo phương ngang. */
const walkToX=async(tx)=>walk(Math.sign(tx-me().x),0,()=>Math.abs(me().x-tx)<3);
async function travelBy(name,to){
  C.travel=null; C.room.send("travel",{portal:name});
  ok(await waitFor(()=>C.travel,4000)&&C.travel.mapId===to,`đi cổng "${name}" -> travel ${C.travel?.mapId}`);
  const x0=me().x; C.room.send("input",{x:1,y:0}); await sleep(300);
  ok(me().x===x0,"đang chuyển bản đồ: server bỏ qua input");
  await C.room.leave(); await sleep(300);
  const m=await post("/api/me",{token:C.token});
  ok(m.mapId===to,`/api/me sau khi đi cổng: ${m.mapId}`);
  C.mapId=m.mapId; await enter(C); await waitFor(()=>me());
  ok(C.room.state.mapId===to,`vào phòng ${C.room.state.mapId}`);
}
// Thánh Hồn Thôn: từ quảng trường làng (vùng an toàn) theo đường làng xuống cổng ở mép nam.
C.room.send("attack"); ok(await lastLog(C,/Vùng an toàn/),"trong làng (vùng an toàn) không đánh được");
C.room.send("travel",{portal:"Cổng không có"}); ok(await lastLog(C,/không tồn tại/),"cổng không tồn tại bị từ chối");
C.room.send("travel",{portal:"Đi Nặc Đinh Thành"}); ok(await lastLog(C,/đứng trong cổng/),"không đứng trong cổng thì không đi được");
await walkToX(36.5*16);
ok(await walk(0,1,()=>C.portal?.name),`tới cổng: ${JSON.stringify(C.portal)}`);
ok(C.portal?.to==="nac_dinh_thanh"&&C.portal.toName==="Nặc Đinh Thành"&&!C.portal.warn,"hộp cổng: đích Nặc Đinh Thành, không cảnh báo");
C.room.send("travel",{portal:"Đi Nặc Đinh Thành"}); await sleep(200);
await walk(0,-1,()=>!C.portal?.name,3000);
ok(await lastLog(C,/rời cổng/),"rời cổng khi đang niệm: hủy");
ok(!C.travel,"chưa được chuyển bản đồ");
ok(await walk(0,1,()=>C.portal?.name),"quay lại cổng");
// Kinh nghiệm chia cho võ hồn dự bị (chưa lưu) phải nằm trong transaction đi cổng (cần hook test).
let benchXp=null;
if((await test(C,"ping"))?.enabled){
  await test(C,"kill",{tier:1}); const bn=C.owned.team.find(r=>r&&r!==C.owned.active);
  benchXp=[bn,C.owned.list.find(v=>v.rowId===bn).xp];
}
await travelBy("Đi Nặc Đinh Thành","nac_dinh_thanh");
if(benchXp){ await waitFor(()=>C.owned); const v=C.owned?.list.find(v=>v.rowId===benchXp[0]);
  ok(v?.xp===benchXp[1],`đi cổng lưu cả kinh nghiệm võ hồn dự bị: ${v?.xp} (trước khi đi ${benchXp[1]})`); }
ok(Math.hypot(me().x-5.5*16,me().y-20.5*16)<1,`xuất hiện ở điểm tu_thanh_hon_thon: ${me().x},${me().y}`);
ok(!C.portal?.name,"điểm xuất hiện nằm ngoài cổng");
ok(C.room.state.beasts.size===0,"Nặc Đinh Thành không có hồn thú");
C.room.send("attack"); ok(await lastLog(C,/Vùng an toàn/),"trong thành không đánh được");
// Nặc Đinh Thành: theo đại lộ sang cổng đông đi Tinh Đấu (chặn mềm: cảnh báo khi dưới cấp đề xuất nhưng vẫn đi được).
ok(await walk(1,0,()=>C.portal?.name,15000),`tới cổng đông: ${JSON.stringify(C.portal)}`);
const lvC=me().level;
ok(C.portal?.to==="tinh_dau"&&JSON.stringify(C.portal.level)==="[10,60]"&&C.portal.warn===(lvC<10),`cấp đề xuất 10–60, cấp ${lvC} -> cảnh báo ${C.portal?.warn}`);
await travelBy("Đi Tinh Đấu Đại Sâm Lâm","tinh_dau");
ok(Math.hypot(me().x-5.5*16,me().y-31.5*16)<1,`xuất hiện ở doanh trại Tinh Đấu: ${me().x},${me().y}`);
// Thoát và vào lại: đúng bản đồ, đúng vị trí đã lưu khi rời phòng.
await walk(1,0,()=>me().x>8*16,3000); const pos=[me().x,me().y];
await C.room.leave(); await sleep(400);
const m2=await post("/api/me",{token:C.token}); ok(m2.mapId==="tinh_dau",`thoát rồi /api/me: ${m2.mapId}`);
C.mapId=m2.mapId; await enter(C); await waitFor(()=>me());
ok(C.room.state.mapId==="tinh_dau"&&Math.abs(me().x-pos[0])<1&&Math.abs(me().y-pos[1])<1,`vào lại đúng vị trí ${me().x.toFixed(1)},${me().y.toFixed(1)} (đã lưu ${pos.map(v=>v.toFixed(1))})`);
// Đăng nhập lần nữa: phiên cũ bị đá (presence), phiên mới vào đúng bản đồ.
let kicked=0; C.room.onLeave(code=>{kicked=code;});
const l2=await post("/api/login",{name:C.name,password:"abcd"}); ok(l2.mapId==="tinh_dau","đăng nhập lại: /api/login trả tinh_dau");
const C2={name:C.name,token:l2.token,logs:[],mapId:l2.mapId}; await enter(C2);
ok(await waitFor(()=>kicked===4001),"phiên cũ bị đá khi tài khoản vào lại");
C=C2;
await waitFor(()=>me());
// Đường về: cổng ở mép tây doanh trại -> Nặc Đinh Thành (cổng đông).
ok(await walk(-1,0,()=>C.portal?.name,6000)&&C.portal.to==="nac_dinh_thanh",`tới cổng về Nặc Đinh Thành: ${C.portal?.name}`);
await travelBy("Về Nặc Đinh Thành","nac_dinh_thanh");
ok(Math.hypot(me().x-54.5*16,me().y-20.5*16)<1,`xuất hiện ở cổng đông Nặc Đinh Thành: ${me().x},${me().y}`);
await C.room.leave();
console.log(fails?`✗ ${fails} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua");
process.exit(fails?1:0);
