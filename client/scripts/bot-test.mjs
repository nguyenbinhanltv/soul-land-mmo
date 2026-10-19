// Kiểm thử nhanh: 2 bot đăng nhập, tạo nhân vật, qua lễ thức tỉnh, vào phòng bản đồ, xếp đội hình, đổi võ hồn trong trận,
// di chuyển, đánh hồn thú, thử hấp thụ, rồi vào lại để kiểm tra đội hình đã lưu.
// Chạy khi server đang bật: npm run bot --prefix client   (server khác cổng: SERVER_URL=http://localhost:2600)
// Phần luật gục từng võ hồn và chia kinh nghiệm (2.3b), năng lượng và chiêu tiên cơ theo 4 hệ (2.4), trạng thái dùng chung và
// hồn kỹ riêng của 5 võ hồn mẫu (2.5a) cần server bật hook kiểm thử:
// GAME_TEST=1 npm run dev:server.
import { Client } from "colyseus.js";
import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { TIERS, TEAM_SIZE, XP_SHARE_ACTIVE, XP_SHARE_BENCH, REVIVE_SECS, RESPAWN_SECS, xpNeed, beastLevel, xpLevelScale,
  VOHON, HE, vohonIndex, calcStats, tierOfYears, TIEN_CO, TIEN_CO_MAX, TIEN_CO_GAIN, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY,
  TIER_MULT, SKILLS, skillsOf, skillPower, buffPower, BUFF_SCALE, TIEN_CO_RIENG, tienCoOf, STATUS, statusBit, buffBit, CRIT, PCT_HP_CAP,
  CC_TIER_MULT, BEAST_REGEN, TEAM_COMBAT_SECS } from "../../shared/data.ts";
const API=process.env.SERVER_URL??"http://localhost:2567", WS=API.replace(/^http/,"ws");
const post=async(p,b)=>{const r=await fetch(API+p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}); return {status:r.status,...await r.json()};};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Mật khẩu và hậu tố tên sinh ngẫu nhiên mỗi lần chạy (không ghi mật khẩu trong mã): mỗi lần chạy là tài khoản mới, kể cả với PostgreSQL.
const PASS=process.env.BOT_PASSWORD??randomBytes(12).toString("hex"), RUN=randomBytes(3).toString("hex");
const waitFor=async(fn,ms=2000)=>{for(let t=0;t<ms;t+=50){if(fn()) return true; await sleep(50);} return false;};
let fails=0; const ok=(cond,msg)=>{console.log(cond?"  ✓":"  ✗",msg); if(!cond) fails++;};

// Tạo nhân vật (một lần, trước lễ thức tỉnh; tài khoản cũ chọn lại một lần), rồi lễ thức tỉnh:
// tài khoản mới tự chọn 1 SSR (kèm Lam Ngân Thảo); tài khoản cũ không thức tỉnh lại được.
async function bot(name,choice,looks){
  const l=await post("/api/login",{name:`${name} ${RUN}`,password:PASS});
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
  if(!l.character){
    ok((await post("/api/awaken",{token:l.token})).status===400,"thiếu lựa chọn -> 400");
    ok((await post("/api/awaken",{token:l.token,vohon:"hao_thien_chuy"})).status===400,"chọn UR -> 400");
    ok((await post("/api/awaken",{token:l.token,vohon:"lam_ngan_thao"})).status===400,"chọn Lam Ngân Thảo -> 400");
    const a=await post("/api/awaken",{token:l.token,vohon:choice});
    ok(a.status===200 && a.character?.vohon===choice,`thức tỉnh ${choice}, cấp ${a.character?.level}`);
  }
  ok((await post("/api/awaken",{token:l.token,vohon:choice})).status===409,"thức tỉnh lần hai -> 409");
  // Không gửi mapId: server chọn bản đồ mặc định và báo qua state.mapId.
  const b={token:l.token,logs:[],owned:null,ownedMsgs:0,looks:me.looks,isNew:!l.character};
  await enter(b);
  return b;
}
/** Vào phòng bản đồ và nghe tin nhắn riêng (log, danh sách võ hồn + đội hình). */
async function enter(b){
  b.room=await new Client(WS).joinOrCreate("map",{token:b.token}); b.owned=null; b.ownedMsgs=0;
  b.room.onMessage("log",m=>b.logs.push(m.text)); b.room.onMessage("chat",()=>{});
  b.fx=[]; b.fxs=[]; b.dmgs=[]; b.hurts=[];
  b.room.onMessage("fx",m=>{b.fxs.push(m); if(m.k==="tienco") b.fx.push(m);});
  b.room.onMessage("dmg",m=>{if(m.bid) b.dmgs.push(m); else if(m.id===b.room.sessionId) b.hurts.push(m);});
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
A.room.send("input",{x:1,y:0}); await sleep(1500);
console.log("A x",p.x.toFixed(1),"B sees A x",B.room.state.players.get(A.room.sessionId).x.toFixed(1));
for(let i=0;i<300;i++){
  let best=null,bd=1e9; st.beasts.forEach(b=>{const d=Math.hypot(b.x-p.x,b.y-p.y); if(d<bd){bd=d;best=b;}});
  if(best){ const dx=best.x-p.x,dy=best.y-p.y,d=Math.hypot(dx,dy)||1; A.room.send("input",{x:+(dx/d).toFixed(2),y:+(dy/d).toFixed(2)}); if(d<22) A.room.send("attack"); }
  await sleep(100);
  if(st.drops.size) break;
}
A.room.send("input",{x:0,y:0});
console.log("drops",st.drops.size,"kills",p.kills,"xp",p.xp,"lvl",p.level,"logs",A.logs.slice(-2));
// Năng lượng tiên cơ (2.4): đánh thường trúng thì võ hồn khác trong đội tích năng lượng, võ hồn ra trận không tự tích.
if(p.kills){
  const benchRow=A.owned.team.find(r=>r&&r!==A.owned.active), en=A.squad?.list.find(s=>s.rowId===benchRow)?.en??0;
  ok(en>0&&(en===TIEN_CO_MAX||en%TIEN_CO_GAIN.attack===0),`đánh hồn thú: võ hồn ngoài sân tích ${en}/${TIEN_CO_MAX} năng lượng tiên cơ`);
  ok((A.squad?.list.find(s=>s.rowId===A.owned.active)?.en??0)===0,"võ hồn ra trận không tự tích năng lượng");
}
// Vừa đánh xong (đang giao chiến): đổi võ hồn trong đội được, xếp đội thì không.
if(p.kills){
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
// Tin trả lời của hook đến trước bản vá state kế tiếp: chờ thêm một nhịp đồng bộ (patchRate 50 ms) rồi mới đọc state.
async function test(b,op,extra={}){ b.test=null; const n=b.ownedMsgs; b.room.send("test",{op,...extra}); await waitFor(()=>b.test&&b.ownedMsgs>n); await sleep(80); return b.test; }
const vOf=r=>A.owned.list.find(v=>v.rowId===r), sq=r=>A.squad?.list.find(s=>s.rowId===r);
const tiled=JSON.parse(readFileSync(new URL(`../../shared/assets/${st.mapId}.json`,import.meta.url),"utf8"));
const spawnObj=tiled.layers.flatMap(l=>l.objects??[]).find(o=>(o.type??o.class)==="spawn");
// Ô chặn (thuộc tính collides) như server/src/map.ts, để bot chọn hướng không vướng cây khi thử lướt.
const solidGid=new Set(tiled.tilesets.flatMap(ts=>(ts.tiles??[]).filter(t=>(t.properties??[]).some(q=>q.name==="collides"&&q.value)).map(t=>ts.firstgid+t.id)));
const solid=new Set(tiled.layers.filter(l=>l.type==="tilelayer").flatMap(l=>l.data.flatMap((g,i)=>solidGid.has(g)?[i]:[])));
const TS=tiled.tilewidth, blocked=(x,y)=>{ for(let ty=Math.floor((y-4)/TS);ty<=Math.floor((y+4)/TS);ty++) for(let tx=Math.floor((x-5)/TS);tx<=Math.floor((x+5)/TS);tx++)
  if(tx<0||ty<0||tx>=tiled.width||ty>=tiled.height||solid.has(ty*tiled.width+tx)) return true; return false; };
/** Hướng (dx, dy) dài `len` pixel từ vị trí (x, y) mà đường đi không vướng ô chặn. */
const clearDir=(x,y,len)=>[[1,0],[-1,0],[0,1],[0,-1],[0.7,0.7],[-0.7,0.7],[0.7,-0.7],[-0.7,-0.7]].find(([ux,uy])=>{ for(let d=2;d<=len;d+=2) if(blocked(x+ux*d,y+uy*d)) return false; return true; })??[1,0];
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
  ok(same(got,want)&&want[0]<xpNeed(5)&&await waitFor(()=>p.xp===want[0]),`chia kinh nghiệm hồn thú ${TIERS[1].age}: ra trận +${got[0]}, võ hồn khác +${got[1]} (cần ${want.join("/")}); ô trống bỏ đi`);
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
  await test(A,"clear"); // hồn thú hoang gần đó đánh trúng thì võ hồn mới không còn đầy sinh lực
  const cd0=p.swCd; A.ko=null; await test(A,"down");
  ok(await waitFor(()=>A.owned.active===a&&A.ko?.next),`võ hồn gục tự đổi sang ${A.ko?.next} dù đang hồi chiêu`);
  ok(!p.dead&&await waitFor(()=>p.hp===p.maxHp,500),`không gục cả người, võ hồn mới đủ sinh lực riêng ${p.hp}/${p.maxHp}`);
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

  // ---------- 2.4: năng lượng và chiêu tiên cơ ----------
  const meOf=b=>b.room.state.players.get(b.room.sessionId), sqOf=(b,r)=>b.squad?.list.find(s=>s.rowId===r);
  const vOfB=(b,r)=>b.owned.list.find(v=>v.rowId===r), heOf=(b,r)=>VOHON[vohonIndex(vOfB(b,r).vohon)].he;
  const atkOf=v=>calcStats(vohonIndex(v.vohon),v.level,v.rings.map(tierOfYears)).atk;
  /** Sát thương tiên cơ dự kiến của võ hồn v: [thường, chí mạng]. */
  const tcDmg=(v,he)=>{const x=atkOf(v)*tienCoOf(v.vohon).dmg; return [Math.max(1,Math.round(x)),Math.max(1,Math.round(x*1.8))];};
  // Hồn thú mới gần chỗ sinh nhất (bộ sinh hồn thú của bản đồ có thể thêm hồn thú khác cùng lúc ở nơi xa).
  async function spawnNear(b,tier,dx,dy=0){ const before=new Set(b.room.state.beasts.keys()), q=meOf(b), x=q.x+dx, y=q.y+dy;
    await test(b,"spawn",{tier,dx,dy}); let id=null;
    await waitFor(()=>{ let best=40; b.room.state.beasts.forEach((o,k)=>{ const d=Math.hypot(o.x-x,o.y-y); if(!before.has(k)&&o.tier===tier&&d<best){ best=d; id=k; } }); return id; });
    if(!id) console.log(`  ⚠ spawnNear: không thấy hồn thú bậc ${tier} quanh ${x.toFixed(0)},${y.toFixed(0)}; mới: ${[...b.room.state.beasts.entries()].filter(([k])=>!before.has(k)).map(([,o])=>`${o.tier}@${o.x.toFixed(0)},${o.y.toFixed(0)}`).join(" ")}`);
    return id; }
  async function switchRow(b,row){ await sleep(150); await waitFor(()=>meOf(b).swCd===0,3500); b.room.send("switch",{slot:b.owned.team.indexOf(row)}); return waitFor(()=>b.owned.active===row); }
  /** Đặt năng lượng đầy (hook), sinh hồn thú bậc `tier` cách `dx` (tier < 0: không sinh), rồi đổi tay vào võ hồn `row`. */
  async function tienCo(b,row,{tier=1,dx=20,dy=0}={}){
    await sleep(150); // vừa đổi võ hồn thì hồi chiêu đổi có thể chưa kịp đồng bộ
    await waitFor(()=>meOf(b).swCd===0,3500);
    await test(b,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sqOf(b,row)?.en===TIEN_CO_MAX);
    await test(b,"clear"); // hồn thú khác ở gần có thể thành mục tiêu thay cho con vừa sinh
    const bid=tier>=0?await spawnNear(b,tier,dx,dy):null;
    b.fx=[]; b.dmgs=[]; const x0=meOf(b).x, y0=meOf(b).y;
    b.room.send("switch",{slot:b.owned.team.indexOf(row)});
    await waitFor(()=>b.fx.length&&(!bid||b.dmgs.some(d=>d.bid===bid)),1500);
    return {fx:b.fx[0],dmg:b.dmgs.find(d=>d.bid===bid)?.v,bid,x0,y0};
  }
  {
    // Tích năng lượng: mỗi đòn đánh thường trúng +TIEN_CO_GAIN.attack dù trúng nhiều hồn thú; Hồn Tiễn 10 mũi chỉ tính một lần.
    const act=A.owned.active, bench=A.owned.team.find(r=>r&&r!==act);
    await test(A,"energy",{v:0}); await waitFor(()=>sqOf(A,bench)?.en===0);
    A.room.send("input",{x:1,y:0}); await sleep(60); A.room.send("input",{x:0,y:0}); await sleep(100);
    await spawnNear(A,1,12); await spawnNear(A,1,14);
    A.room.send("attack"); await waitFor(()=>sqOf(A,bench)?.en>0);
    ok(sqOf(A,bench)?.en===TIEN_CO_GAIN.attack&&sqOf(A,act)?.en===0,`đòn thường trúng 2 hồn thú: võ hồn ngoài sân +${sqOf(A,bench)?.en} (cần ${TIEN_CO_GAIN.attack}), võ hồn ra trận ${sqOf(A,act)?.en}`);
    await test(A,"set",{rowId:act,level:30,xp:0,rings:[10,100,100]}); await test(A,"energy",{v:0}); await waitFor(()=>sqOf(A,bench)?.en===0);
    await spawnNear(A,1,-20);
    A.room.send("skill",{i:2}); await sleep(900);
    ok(sqOf(A,bench)?.en===TIEN_CO_GAIN.skill,`Hồn Tiễn 10 mũi trúng nhiều hồn thú: +${sqOf(A,bench)?.en} một lần (cần ${TIEN_CO_GAIN.skill})`);
    // Chưa đầy thì đổi vào không tung tiên cơ, năng lượng giữ nguyên.
    await test(A,"energy",{v:TIEN_CO_MAX-10}); await waitFor(()=>sqOf(A,bench)?.en===TIEN_CO_MAX-10);
    A.fx=[]; await switchRow(A,bench); await sleep(300);
    ok(!A.fx.length&&sqOf(A,bench)?.en===TIEN_CO_MAX-10,"chưa đủ năng lượng: đổi vào không tung tiên cơ");
    // Ra khỏi giao chiến quá TIEN_CO_IDLE_SECS giây thì giảm dần (vừa đánh trúng nên đồng hồ giao chiến bắt đầu từ 0).
    await test(A,"energy",{v:TIEN_CO_MAX}); await test(A,"rest",{s:TIEN_CO_IDLE_SECS-1}); // hook energy tính như vừa giao chiến
    const e1=sqOf(A,act)?.en; await test(A,"rest",{s:3});
    const want=TIEN_CO_MAX-2*TIEN_CO_DECAY, e2=sqOf(A,act)?.en;
    ok(e1>=TIEN_CO_MAX-1&&e2>=want-6&&e2<=want, // thêm vài điểm cho thời gian thật giữa các lệnh hook
     `ngoài giao chiến: ${TIEN_CO_IDLE_SECS-1} giây vẫn ${e1}, thêm 3 giây còn ${e2} (giảm ${TIEN_CO_DECAY}/giây sau ${TIEN_CO_IDLE_SECS} giây)`);
    await test(A,"clear");
  }
  {
    // Cường công và khống chế (A: SSR cường công + Lam Ngân Thảo khống chế): đổi vào với năng lượng đầy.
    for(let k=0;k<2;k++){
      const row=A.owned.team.find(r=>r&&r!==A.owned.active), he=heOf(A,row), v=vOfB(A,row);
      const r=await tienCo(A,row,{tier:he==="khong_che"?2:1,dx:20}), want=tcDmg(v,he); // khống chế: hồn thú đủ máu để còn sống sau chí mạng
      ok(r.fx?.he===he&&r.fx.id===A.room.sessionId&&await lastLog(A,/Tiên cơ/),`đổi vào ${v.vohon} đủ năng lượng: tung tiên cơ ${HE[he].name} (${tienCoOf(v.vohon).name})`);
      ok(want.includes(r.dmg),`tiên cơ ${tienCoOf(v.vohon).name}: sát thương ${r.dmg} (cần ${want.join(" hoặc ")})`);
      ok(await waitFor(()=>sqOf(A,row)?.en===0),"tung xong thì hết năng lượng");
      if(he==="khong_che"&&!TIEN_CO_RIENG[v.vohon]){
        ok(await waitFor(()=>(A.room.state.beasts.get(r.bid)?.st&statusBit("stun"))>0,800),"khống chế: hồn thú bị choáng");
        const b=A.room.state.beasts.get(r.bid);
        await sleep(100); const bx=b?.x; await sleep(TIEN_CO[he].stun*1000-500);
        ok(!A.room.state.beasts.get(r.bid)||((b.st&statusBit("stun"))&&Math.abs(b.x-bx)<1),"đang choáng: hồn thú đứng yên");
        ok(await waitFor(()=>!(A.room.state.beasts.get(r.bid)?.st&statusBit("stun")),1500),`hết choáng sau ${TIEN_CO[he].stun} giây`);
      }
      await test(A,"clear");
    }
    // Gục thì mất năng lượng; tự đổi khi gục không tung tiên cơ (giữ năng lượng của võ hồn tự ra trận).
    const fallen=A.owned.active, next=A.owned.team.find(r=>r&&r!==fallen);
    await waitFor(()=>p.swCd===0,3500);
    await test(A,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sqOf(A,fallen)?.en===TIEN_CO_MAX);
    A.fx=[]; await test(A,"down"); await waitFor(()=>A.owned.active===next); await sleep(300);
    ok(sqOf(A,fallen)?.en===0&&sqOf(A,next)?.en===TIEN_CO_MAX&&!A.fx.length,`gục: mất năng lượng (${sqOf(A,fallen)?.en}); tự đổi không tung tiên cơ, giữ ${sqOf(A,next)?.en}`);
    await test(A,"rest",{s:REVIVE_SECS+1});
  }
  // Mẫn công và phụ trợ: thêm hai tài khoản bot với SSR tương ứng (kèm Lam Ngân Thảo).
  const C=await bot("Tester C","nguyet_nhan",{sex:0,hair:1,hairCol:1,outfitCol:2}), D=await bot("Tester D","thien_can_bach_ngoc_dinh",{sex:1,hair:0,hairCol:4,outfitCol:0});
  for(const b of [C,D]) await waitFor(()=>b.owned&&b.squad);
  {
    const ssr=C.owned.list.find(v=>v.vohon==="nguyet_nhan").rowId, lnt=C.owned.list.find(v=>v.vohon==="lam_ngan_thao").rowId;
    ok(await switchRow(C,lnt),"C: Lam Ngân Thảo ra trận");
    // Hồn thú bậc 0 (không tự lao vào) cách 70 pixel theo hướng không vướng cây.
    const cp=meOf(C), [ux,uy]=clearDir(cp.x,cp.y,70), want=tcDmg(vOfB(C,ssr),"man_cong"); // tính trước: hạ hồn thú có thể lên cấp
    let x0=cp.x, y0=cp.y; const moved=()=>Math.hypot(cp.x-x0,cp.y-y0);
    const r=await tienCo(C,ssr,{tier:0,dx:Math.round(ux*70),dy:Math.round(uy*70)}); x0=r.x0; y0=r.y0;
    const bt=C.room.state.beasts.get(r.bid);
    ok(r.fx?.he==="man_cong"&&await waitFor(()=>moved()>=40,800),`mẫn công: lướt ${moved().toFixed(0)} pixel tới hồn thú`+
      (moved()<40?` (fx ${JSON.stringify(r.fx)}, từ ${r.x0?.toFixed(0)},${r.y0?.toFixed(0)} hướng ${ux},${uy}, hồn thú ${bt?`${bt.x.toFixed(0)},${bt.y.toFixed(0)}`:"không còn"}, log ${C.logs.slice(-2).join(" | ")})`:""));
    ok(want.includes(r.dmg),`mẫn công ${TIEN_CO.man_cong.name}: chém một mục tiêu ${r.dmg} (cần ${want.join(" hoặc ")})`);
    await test(C,"clear"); await C.room.leave(); // bớt người trong doanh trại: hồn thú ở ca sau nhắm đúng D
  }
  {
    const ssr=D.owned.list.find(v=>v.vohon==="thien_can_bach_ngoc_dinh").rowId, lnt=D.owned.list.find(v=>v.vohon==="lam_ngan_thao").rowId, dp=meOf(D);
    ok(await switchRow(D,lnt),"D: Lam Ngân Thảo ra trận");
    await test(D,"hurt",{pct:50}); await waitFor(()=>dp.hp<dp.maxHp); const h0=dp.hp, max0=dp.maxHp;
    const r=await tienCo(D,ssr,{tier:-1});
    const v=vOfB(D,ssr), tc=TIEN_CO.phu_tro, shield=Math.round(calcStats(vohonIndex(v.vohon),v.level,v.rings.map(tierOfYears)).maxHp*tc.shield);
    ok(r.fx?.he==="phu_tro"&&await waitFor(()=>dp.shield===shield,800),`phụ trợ ${tc.name}: khiên ${dp.shield} (cần ${shield})`);
    ok(await waitFor(()=>sqOf(D,lnt)?.hp>=Math.min(max0,h0+Math.floor(max0*tc.heal))),`hồi cả đội: Lam Ngân Thảo ${h0} -> ${sqOf(D,lnt)?.hp}/${max0}`);
    const hp1=dp.hp; D.hurts=[]; const hb=await spawnNear(D,1,10), hbs=D.room.state.beasts.get(hb);
    const shOk=await waitFor(()=>D.hurts.length&&dp.shield<shield,3000);
    ok(shOk&&D.hurts[0].c==="#9ad8ff"&&dp.hp>=hp1,`khiên đỡ đòn hồn thú: sinh lực giữ ${dp.hp}, khiên còn ${dp.shield}/${shield}`+
      (shOk?"":` (đòn nhận ${JSON.stringify(D.hurts)}, hồn thú ${hbs?`cách ${Math.hypot(hbs.x-dp.x,hbs.y-dp.y).toFixed(0)}, aggro ${hbs.aggro}`:"không còn"})`));
    ok(await waitFor(()=>dp.shield===0,tc.shieldSecs*1000+1000),`khiên hết sau ${tc.shieldSecs} giây`);
    await test(D,"clear");
  }
  ok(!B.fx.some(m=>m.id===B.room.sessionId),"B không tung tiên cơ (không đổi võ hồn)");
  ok(B.squad&&!B.squad.list.some(s=>A.owned.team.includes(s.rowId)),"năng lượng tiên cơ chỉ gửi cho chính chủ");
  await D.room.leave();

  // ---------- 2.5a: trạng thái dùng chung, hồn kỹ riêng vòng 1–4 của 5 võ hồn mẫu, tiên cơ riêng ----------
  const FIVE=["lam_ngan_thao","hao_thien_chuy","u_minh_linh_mieu","bich_lan_xa_hoang","cuu_bao_luu_ly_thap"];
  const exp=x=>[Math.max(1,Math.round(x)),Math.max(1,Math.round(x*CRIT.mult))];
  const hasSt=(b,s)=>!!b&&(b.st&statusBit(s))!==0, hasBuff=(q,s)=>!!q&&(q.buff&buffBit(s))!==0;
  const beastOf=(b,bid)=>b.room.state.beasts.get(bid), dmgsOn=(b,bid)=>b.dmgs.filter(d=>d.bid===bid);
  const vname=id=>VOHON[vohonIndex(id)].name;
  async function cast(b,i,wait=200){ b.dmgs=[]; b.fxs=[]; b.room.send("skill",{i}); await sleep(wait); }
  // Hàm thuần: sức mạnh hồn kỹ theo số năm (đúng mốc bậc thì bằng TIER_MULT cũ), bảng hồn kỹ theo mã võ hồn.
  ok(same(TIERS.map(t=>skillPower(t.years)),TIER_MULT)&&Math.abs(skillPower(423)-1.694)<0.01&&skillPower(5000)>2.5&&skillPower(5000)<2.6,
    `sức mạnh hồn kỹ theo số năm: mốc bậc ${TIERS.map(t=>skillPower(t.years)).join("/")}, 423 năm ${skillPower(423)}, 5.000 năm ${skillPower(5000)}`);
  ok(buffPower(10)===1&&Math.abs(buffPower(100000)-(1+3.5*BUFF_SCALE))<1e-3,`hiệu ứng có lợi tăng chậm hơn: 10 vạn năm ×${buffPower(100000)}`);
  ok(skillsOf("ta_hoa_phuong_hoang")===SKILLS&&FIVE.every(v=>skillsOf(v).length===4&&skillsOf(v)!==SKILLS&&TIEN_CO_RIENG[v]),"5 võ hồn mẫu có 4 hồn kỹ riêng và tiên cơ riêng, võ hồn khác dùng 4 hồn kỹ chung");
  {
    // Võ hồn chưa có hồn kỹ riêng (Tà Hỏa Phượng Hoàng) vẫn dùng hồn kỹ chung, sát thương như trước.
    const ta=A.owned.list.find(v=>v.vohon==="ta_hoa_phuong_hoang").rowId;
    ok(await switchRow(A,ta),"A: Tà Hỏa Phượng Hoàng ra trận");
    await test(A,"set",{rowId:ta,level:30,xp:0,rings:[10,100,100]}); await test(A,"clear"); await test(A,"ready");
    const bid=await spawnNear(A,2,20); await cast(A,0);
    const want=exp(atkOf(vOfB(A,ta))*SKILLS[0].dmg*skillPower(10)), got=dmgsOn(A,bid)[0]?.v;
    ok(want.includes(got),`hồn kỹ chung ${SKILLS[0].name}: sát thương ${got} (cần ${want.join(" hoặc ")})`);
    ok(A.fxs.some(f=>f.k==="soulring"&&f.i===0&&f.vh===vohonIndex("ta_hoa_phuong_hoang")),"fx soulring kèm vh để client hiện tên hồn kỹ");
    await test(A,"clear");
  }
  const E=await bot("Tester E","u_minh_linh_mieu",{sex:0,hair:2,hairCol:2,outfitCol:3});
  await waitFor(()=>E.owned&&E.squad&&meOf(E)); const me=meOf(E);
  for(const vohon of ["hao_thien_chuy","cuu_bao_luu_ly_thap","bich_lan_xa_hoang","yeu_ho"]) await test(E,"grant",{vohon});
  ok(FIVE.every(id=>E.owned.list.some(v=>v.vohon===id)),`E sở hữu 5 võ hồn mẫu (hook grant): ${E.owned.list.map(v=>v.vohon).join(", ")}`);
  const rowE=id=>E.owned.list.find(v=>v.vohon===id).rowId, YRS=[423,764,1760,5000], P=i=>skillPower(YRS[i]), BP=i=>buffPower(YRS[i]);
  const atkE=id=>calcStats(vohonIndex(id),40,YRS.map(tierOfYears)).atk;
  for(const id of [...FIVE,"yeu_ho"]) await test(E,"set",{rowId:rowE(id),level:40,xp:0,rings:YRS});
  const inCampOf=q=>q.x>=spawnObj.x&&q.x<=spawnObj.x+spawnObj.width&&q.y>=spawnObj.y&&q.y<=spawnObj.y+spawnObj.height;
  for(let i=0;i<80&&inCampOf(me);i++){ E.room.send("input",{x:1,y:0}); await sleep(100); }
  E.room.send("input",{x:0,y:0}); await sleep(150);
  // Hướng thử: tính lại ở chỗ đứng hiện tại mỗi lần quay mặt (không vướng cây, không ra ngoài bản đồ trong 100 pixel).
  let [ux,uy]=clearDir(me.x,me.y,100); const at=d=>[Math.round(ux*d),Math.round(uy*d)];
  async function face(){ [ux,uy]=clearDir(me.x,me.y,100); E.room.send("input",{x:ux,y:uy}); await sleep(60); E.room.send("input",{x:0,y:0}); await sleep(100); }
  /** Xếp đội [id, ...rest] ngoài giao chiến để `id` ra trận. */
  async function lineup(id,rest=[]){ await test(E,"clear"); await test(E,"rest",{s:TEAM_COMBAT_SECS+1}); const t=[id,...rest].map(rowE); while(t.length<TEAM_SIZE) t.push(0);
    await sendTeam(E,t); return E.owned.active===rowE(id)&&await waitFor(()=>me.vh===vohonIndex(id)); }
  const spawnAt=(tier,d)=>spawnNear(E,tier,...at(d));
  console.log(`  E đứng ${me.x.toFixed(0)},${me.y.toFixed(0)}, hướng thử ${ux},${uy}`);

  // Lam Ngân Thảo (khống chế): Triền Nhiễu trói + trúng độc, Ký Sinh dễ thương, Tù Lung gom quái, Chu Võng choáng.
  {
    const id="lam_ngan_thao", sk=skillsOf(id), atk=atkE(id);
    ok(await lineup(id),`E: ${vname(id)} ra trận (cấp 40, hồn hoàn ${YRS.join("/")} năm)`);
    await face(); await test(E,"ready");
    await cast(E,0); ok(/không có hồn thú/.test(E.logs.at(-1)??"")&&me.cds[0]===0,"hồn kỹ đánh một mục tiêu: không có hồn thú trong tầm thì không tung, không hồi chiêu");
    const bid=await spawnAt(3,50); await test(E,"ready"); await cast(E,0);
    const b=beastOf(E,bid); let want=exp(atk*P(0)*sk[0].dmg);
    ok(want.includes(dmgsOn(E,bid)[0]?.v)&&hasSt(b,"root")&&hasSt(b,"poison")&&b.poison===1,
      `${sk[0].name}: sát thương ${dmgsOn(E,bid)[0]?.v} (cần ${want.join(" hoặc ")}), Trói + Trúng độc ${b?.poison} tầng`);
    const bx=b.x, by=b.y; await sleep(700);
    ok(beastOf(E,bid)&&b.x===bx&&b.y===by,"Trói: hồn thú đứng yên");
    const pc=STATUS.poison.col, tick=()=>dmgsOn(E,bid).find(d=>d.c===pc)?.v;
    E.dmgs=[]; await waitFor(()=>tick(),1500); want=Math.round(atk*STATUS.poison.dot*P(0));
    ok(tick()===want,`Trúng độc: mất ${tick()} sinh lực mỗi giây (cần ${want})`);
    await test(E,"ready"); await cast(E,1); want=exp(atk*P(1)*sk[1].dmg);
    ok(want.includes(dmgsOn(E,bid)[0]?.v)&&hasSt(b,"vuln"),`${sk[1].name}: sát thương ${dmgsOn(E,bid)[0]?.v} (cần ${want.join(" hoặc ")}), Dễ thương`);
    E.dmgs=[]; await waitFor(()=>tick(),1500); want=Math.round(atk*STATUS.poison.dot*P(0)*(1+STATUS.vuln.amp));
    ok(tick()===want,`Dễ thương: độc mất ${tick()} mỗi giây (cần ${want}, +${STATUS.vuln.amp*100}%)`);
    // Tù Lung: hai hồn thú (đang choáng để đứng yên) ở xa bị kéo về sát thân.
    await test(E,"clear"); const g1=await spawnAt(3,70), g2=await spawnAt(3,84);
    await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"ready"); await cast(E,2,300);
    const near=bid=>{const q=beastOf(E,bid); return q?Math.hypot(q.x-me.x,q.y-me.y):-1;};
    ok([g1,g2].every(g=>near(g)>=0&&near(g)<TIERS[3].size/2+16&&hasSt(beastOf(E,g),"root")),`${sk[2].name}: kéo 2 hồn thú về cách ${near(g1).toFixed(0)} / ${near(g2).toFixed(0)} pixel, Trói`);
    // Chu Võng: choáng; hồn thú 10 vạn năm bị khống chế ngắn hơn (CC_TIER_MULT).
    await test(E,"clear"); const cb=await spawnAt(4,30); await test(E,"ready"); await cast(E,3);
    want=exp(atk*P(3)*sk[3].dmg);
    ok(want.includes(dmgsOn(E,cb)[0]?.v)&&hasSt(beastOf(E,cb),"stun"),`${sk[3].name}: sát thương ${dmgsOn(E,cb)[0]?.v} (cần ${want.join(" hoặc ")}), Choáng`);
    const secs=2*CC_TIER_MULT[4]; await sleep(secs*1000+300);
    ok(!hasSt(beastOf(E,cb),"stun"),`hồn thú 10 vạn năm hết choáng sau ${secs} giây (2 × ${CC_TIER_MULT[4]})`);
    await test(E,"clear");
  }
  // Hạo Thiên Chùy (cường công): % sinh lực, Phá giáp, liên hoàn kết thúc bằng hất tung.
  {
    const id="hao_thien_chuy", sk=skillsOf(id), atk=atkE(id);
    ok(await lineup(id),`E: ${vname(id)} ra trận`);
    await face(); const f=await spawnAt(3,22), bk=await spawnAt(3,-26);
    await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"ready"); await cast(E,1);
    let want=exp(atk*P(1)*sk[1].dmg);
    ok(want.includes(dmgsOn(E,f)[0]?.v)&&beastOf(E,f)?.armor===2&&beastOf(E,bk)?.armor===2,`${sk[1].name}: sát thương ${dmgsOn(E,f)[0]?.v} (cần ${want.join(" hoặc ")}), Phá giáp ${beastOf(E,f)?.armor} tầng`);
    await cast(E,0);
    want=exp((atk*P(0)*sk[0].dmg+Math.min(TIERS[3].hp*sk[0].pctHp,atk*P(0)*PCT_HP_CAP))*(1+2*STATUS.armor.amp));
    ok(want.includes(dmgsOn(E,f)[0]?.v)&&!dmgsOn(E,bk).length,`${sk[0].name}: nửa trước mặt ${dmgsOn(E,f)[0]?.v} (cần ${want.join(" hoặc ")}: +3% sinh lực, Phá giáp +20%), hồn thú phía sau không trúng`);
    await test(E,"clear"); const lb=await spawnAt(4,40); await test(E,"ready"); await cast(E,2,0);
    ok(await waitFor(()=>dmgsOn(E,lb).length>=4&&hasSt(beastOf(E,lb),"stun"),1500),`${sk[2].name}: ${dmgsOn(E,lb).length} nhát liên hoàn, nhát cuối hất tung (Choáng)`);
    want=exp(atk*P(2)*sk[2].dmg+Math.min(TIERS[4].hp*sk[2].pctHp,atk*P(2)*PCT_HP_CAP));
    ok(dmgsOn(E,lb).every(d=>want.includes(d.v)),`mỗi nhát ${dmgsOn(E,lb).map(d=>d.v).join("/")} (cần ${want.join(" hoặc ")})`);
    await test(E,"clear"); const pb=await spawnAt(4,40); await test(E,"ready"); await cast(E,3);
    want=exp(atk*P(3)*sk[3].dmg+Math.min(TIERS[4].hp*sk[3].pctHp,atk*P(3)*PCT_HP_CAP));
    ok(want.includes(dmgsOn(E,pb)[0]?.v)&&hasSt(beastOf(E,pb),"stun"),`${sk[3].name}: sát thương ${dmgsOn(E,pb)[0]?.v} (cần ${want.join(" hoặc ")}, có 6% sinh lực), hất tung`);
    await test(E,"clear");
  }
  // U Minh Linh Miêu (mẫn công): lướt, cào liên hoàn kèm Phá giáp, tăng tốc và chí mạng.
  {
    const id="u_minh_linh_mieu", sk=skillsOf(id), atk=atkE(id);
    ok(await lineup(id),`E: ${vname(id)} ra trận`);
    await face(); const bid=await spawnAt(4,40); await test(E,"status",{s:"stun",secs:10});
    const x0=me.x, y0=me.y; await test(E,"ready"); await cast(E,0);
    let want=exp(atk*P(0)*sk[0].dmg);
    ok(Math.hypot(me.x-x0,me.y-y0)>=50&&want.includes(dmgsOn(E,bid)[0]?.v),`${sk[0].name}: lướt ${Math.hypot(me.x-x0,me.y-y0).toFixed(0)} pixel xuyên hồn thú, sát thương ${dmgsOn(E,bid)[0]?.v} (cần ${want.join(" hoặc ")})`);
    await cast(E,1,0);
    ok(await waitFor(()=>dmgsOn(E,bid).length>=3&&beastOf(E,bid)?.armor===3,1200),`${sk[1].name}: ${dmgsOn(E,bid).length} nhát, Phá giáp ${beastOf(E,bid)?.armor} tầng`);
    await cast(E,2);
    ok(await waitFor(()=>hasBuff(me,"spd")&&hasBuff(me,"crit"),500),`${sk[2].name}: hồn sư được tăng tốc và tăng chí mạng`);
    await test(E,"clear"); const bb=await spawnAt(4,60); await test(E,"ready"); await cast(E,3,0);
    ok(await waitFor(()=>dmgsOn(E,bb).length>=sk[3].n,2000),`${sk[3].name}: lướt tới và cào ${dmgsOn(E,bb).length}/${sk[3].n} nhát`);
    await test(E,"clear");
  }
  // Bích Lân Xà Hoàng (khống chế, trúng độc): độc cộng dồn, câm lặng diện rộng, Vạn Xà Phệ Tâm hút máu.
  {
    const id="bich_lan_xa_hoang", sk=skillsOf(id), atk=atkE(id);
    ok(await lineup(id),`E: ${vname(id)} ra trận`);
    const [vx,vy]=clearDir(me.x,me.y,60); E.room.send("input",{x:vx,y:vy}); await sleep(60); E.room.send("input",{x:0,y:0}); await sleep(100);
    const bid=await spawnNear(E,4,Math.round(vx*40),Math.round(vy*40)); await test(E,"status",{s:"stun",secs:10});
    await test(E,"ready"); await cast(E,0,500);
    const b=beastOf(E,bid), p1=b?.poison??0, want=exp(atk*P(0)*sk[0].dmg);
    ok(p1>=1&&dmgsOn(E,bid).every(d=>want.includes(d.v)),`${sk[0].name}: ${dmgsOn(E,bid).length} mũi trúng, Trúng độc ${p1} tầng`);
    await cast(E,1);
    ok(b?.poison===Math.min(STATUS.poison.max,p1+2),`${sk[1].name}: Trúng độc cộng dồn ${p1} -> ${b?.poison} tầng (tối đa ${STATUS.poison.max})`);
    const sb=await spawnNear(E,3,Math.round(vx*10),Math.round(vy*10)); E.hurts=[];
    ok(await waitFor(()=>E.hurts.length>0,3000),"hồn thú kề bên đánh hồn sư");
    await cast(E,2);
    ok(await waitFor(()=>hasSt(beastOf(E,sb),"silence")&&hasSt(beastOf(E,sb),"vuln")&&hasSt(b,"silence"),500),`${sk[2].name}: Câm lặng và Dễ thương diện rộng`+
      ` (kề bên: ${beastOf(E,sb)?`st ${beastOf(E,sb).st}, cách ${Math.hypot(beastOf(E,sb).x-me.x,beastOf(E,sb).y-me.y).toFixed(0)}`:"không còn"}; xa: ${beastOf(E,bid)?`st ${beastOf(E,bid).st}`:"không còn"}; log ${E.logs.at(-1)})`);
    E.hurts=[]; await sleep(2000);
    ok(!E.hurts.length&&hasSt(beastOf(E,sb),"silence"),"Câm lặng: hồn thú kề bên không đánh được trong 2 giây");
    await test(E,"clear"); const vb=await spawnAt(4,30);
    await test(E,"status",{s:"stun",secs:10}); await test(E,"status",{s:"poison",n:4}); await test(E,"hurt",{pct:50});
    await waitFor(()=>me.hp<=me.maxHp*0.6); const h0=me.hp;
    await test(E,"ready"); await cast(E,3);
    const got=dmgsOn(E,vb)[0]?.v, w=exp(atk*P(3)*(sk[3].dmg+sk[3].perStack.dmg*4));
    ok(w.includes(got),`${sk[3].name}: 4 tầng độc, sát thương ${got} (cần ${w.join(" hoặc ")})`);
    const hw=Math.min(me.maxHp,h0+Math.floor(got*sk[3].lifesteal));
    ok(await waitFor(()=>me.hp>=hw-1,500)&&me.hp<=Math.min(me.maxHp,hw+4),`hút máu ${sk[3].lifesteal*100}%: sinh lực ${h0} -> ${me.hp} (cần ~${hw})`);
    await test(E,"clear");
  }
  // Cửu Bảo Lưu Ly Tháp (phụ trợ): tăng công / tốc / thủ thuộc hồn sư (đổi võ hồn vẫn còn), hồi và giảm tiêu hao hồn lực.
  // Kèm kiểm tra Thiêu đốt (cộng dồn, sát thương theo công người gây) và Viêm bạo qua hook.
  {
    const id="cuu_bao_luu_ly_thap", sk=skillsOf(id), atk=atkE(id), bc=STATUS.burn.col;
    ok(await lineup(id,["hao_thien_chuy"]),`E: ${vname(id)} ra trận`);
    await face(); const bid=await spawnAt(4,40); await test(E,"status",{s:"stun",secs:20});
    await test(E,"status",{s:"burn",n:3}); const b=beastOf(E,bid);
    const tick=()=>dmgsOn(E,bid).find(d=>d.c===bc)?.v;
    E.dmgs=[]; await waitFor(()=>tick(),1500); let want=Math.round(atk*STATUS.burn.dot*3);
    ok(b?.burn===3&&tick()===want,`Thiêu đốt 3 tầng: mất ${tick()} mỗi giây (cần ${want})`);
    await test(E,"status",{s:"burn",n:5}); ok(await waitFor(()=>b?.burn===STATUS.burn.max,500),`Thiêu đốt cộng dồn tối đa ${b?.burn} tầng`);
    await test(E,"ready"); await cast(E,0);
    ok(hasBuff(me,"atk")&&hasBuff(B.room.state.players.get(E.room.sessionId),"atk"),`${sk[0].name}: tăng công (người khác cũng thấy hào quang)`);
    await test(E,"status",{s:"burn"}); E.dmgs=[]; await waitFor(()=>tick(),1500);
    want=Math.round(atk*(1+sk[0].self.buff.atk*BP(0))*STATUS.burn.dot*STATUS.burn.max);
    ok(tick()===want,`tăng công ${Math.round(sk[0].self.buff.atk*BP(0)*100)}%: Thiêu đốt gây lại mạnh hơn, ${tick()} mỗi giây (cần ${want})`);
    E.dmgs=[]; await test(E,"boom");
    ok(await waitFor(()=>!hasSt(b,"burn"),500)&&dmgsOn(E,bid).some(d=>d.c===bc&&d.v>want),`Viêm bạo: kích nổ mọi tầng một lần ${dmgsOn(E,bid).find(d=>d.c===bc)?.v}, hết Thiêu đốt`);
    await cast(E,1); ok(await waitFor(()=>hasBuff(me,"spd"),500),`${sk[1].name}: tăng tốc (log ${E.logs.at(-1)})`);
    await test(E,"ready",{mp:20}); await waitFor(()=>me.mp<=me.maxMp*0.22); const m20=me.mp; await cast(E,2);
    want=Math.floor(me.maxMp*(0.2+sk[2].self.mp*BP(2)));
    ok(hasBuff(me,"mp")&&me.mp>=want-1&&me.mp<=want+8,`${sk[2].name}: hồn lực ${m20} -> ${me.mp} (cần ~${want}), giảm tiêu hao`);
    await test(E,"ready",{mp:50}); await waitFor(()=>Math.abs(me.mp-me.maxMp*0.5)<=2); const m0=me.mp; await cast(E,0,150);
    ok(m0-me.mp<=sk[0].cost*(1-sk[2].self.buff.mp*BP(2))+1.3,`giảm tiêu hao: ${sk[0].name} tốn ${m0-me.mp} hồn lực (gốc ${sk[0].cost})`);
    await test(E,"ready"); await cast(E,3);
    want=Math.round(me.maxHp*sk[3].self.shield*BP(3));
    ok(hasBuff(me,"def")&&me.shield===want,`${sk[3].name}: tăng thủ, khiên ${me.shield} (cần ${want})`);
    const h0=me.hp; await test(E,"hurt",{pct:20}); await waitFor(()=>me.hp<h0);
    const lost=h0-me.hp, full=Math.floor(h0*0.2);
    ok(lost<=Math.round(full*(1-sk[3].self.buff.def*BP(3)))+2&&lost>=Math.round(full*(1-sk[3].self.buff.def*BP(3)))-2,`tăng thủ: mất ${lost} thay vì ${full}`);
    const hb=rowE("hao_thien_chuy"); ok(await switchRow(E,hb),"đổi sang Hạo Thiên Chùy");
    ok(["atk","spd","def","mp"].every(x=>hasBuff(me,x)),"hiệu ứng có lợi thuộc hồn sư: đổi võ hồn vẫn còn");
    await test(E,"clear");
  }
  // Cảm điện lan sát thương, hồi máu hồn thú và Trúng độc giảm hồi máu (engine, qua hook).
  {
    await face(); const s1=await spawnAt(0,14), s2=await spawnAt(0,60); // hồn thú 10 năm không tự lao vào, hồn thú thứ hai ngoài tầm đánh thường
    await test(E,"status",{s:"stun",secs:5,all:true}); await test(E,"status",{s:"shock",all:true});
    ok(hasSt(beastOf(E,s1),"shock")&&hasSt(beastOf(E,s2),"shock"),"Cảm điện lên 2 hồn thú");
    E.dmgs=[]; E.room.send("attack"); await waitFor(()=>dmgsOn(E,s2).length,800);
    const v1=dmgsOn(E,s1)[0]?.v, ch=dmgsOn(E,s2)[0];
    ok(v1&&ch?.c===STATUS.shock.col&&ch.v===Math.max(1,Math.round(v1*STATUS.shock.chain))&&dmgsOn(E,s1).length===1,
      `Cảm điện: đánh trúng ${v1}, lan ${ch?.v} sang hồn thú cảm điện gần đó (cần ${Math.round((v1??0)*STATUS.shock.chain)}), không lan ngược`);
    await test(E,"clear"); await spawnAt(2,110);
    await test(E,"beast",{pct:50}); const g1=(await test(E,"regen",{s:5})).gain;
    await test(E,"beast",{pct:50}); await test(E,"status",{s:"poison",secs:30}); const g2=(await test(E,"regen",{s:5})).gain;
    const w1=Math.floor(TIERS[2].hp*BEAST_REGEN.pct*5);
    ok(g1===w1&&g2===Math.floor(w1*(1-STATUS.poison.healCut)),`hồn thú hồi ${g1} sinh lực trong 5 giây ngoài giao chiến (cần ${w1}); Trúng độc chỉ hồi ${g2}`);
    await test(E,"clear");
  }
  // Tiên cơ riêng của 5 võ hồn (đổi tay vào với năng lượng đầy), và tiên cơ chung khống chế (Yêu Hồ chưa có tiên cơ riêng).
  await test(E,"rest",{s:15}); ok(await waitFor(()=>!me.buff),"nghỉ 15 giây: hết mọi hiệu ứng có lợi");
  for(const [k,id] of FIVE.entries()){
    const own=TIEN_CO_RIENG[id], other=FIVE[(k+1)%FIVE.length], atk=atkE(id);
    await lineup(other,[id]); await face();
    const r=await tienCo(E,rowE(id),{tier:own.area==="self"?-1:3,dx:at(own.dash?70:20)[0],dy:at(own.dash?70:20)[1]});
    ok(r.fx?.own&&r.fx.vh===vohonIndex(id)&&await lastLog(E,new RegExp(own.name)),`tiên cơ riêng ${vname(id)}: ${own.name}`);
    const b=r.bid?beastOf(E,r.bid):null;
    if(own.dmg){
      const w=exp(atk*own.dmg+(own.pctHp?Math.min(TIERS[3].hp*own.pctHp,atk*PCT_HP_CAP):0));
      ok(w.includes(r.dmg),`${own.name}: sát thương ${r.dmg} (cần ${w.join(" hoặc ")})`);
    }
    if(own.status) ok(await waitFor(()=>own.status.every(a=>hasSt(b,a.s)&&(!a.n||b[a.s]===a.n)),500),`${own.name}: gây ${own.status.map(a=>STATUS[a.s].name+(a.n?` ${a.n} tầng`:"")).join(", ")}`);
    if((own.n??1)>1) ok(await waitFor(()=>dmgsOn(E,r.bid).length>=own.n,1500),`${own.name}: ${dmgsOn(E,r.bid).length}/${own.n} nhát`);
    if(own.self?.buff?.inv){
      ok(await waitFor(()=>hasBuff(me,"inv"),500),`${own.name}: miễn sát thương`);
      await spawnNear(E,1,...at(8)); E.hurts=[]; const h=me.hp;
      ok(await waitFor(()=>E.hurts.some(x=>x.immune),2500)&&me.hp>=h,`hồn thú đánh trúng: hiện "Miễn", sinh lực giữ ${me.hp}`);
    }
    await test(E,"clear");
  }
  {
    const id="yeu_ho";
    await lineup("lam_ngan_thao",[id]); await face();
    const r=await tienCo(E,rowE(id),{tier:2,dx:at(20)[0],dy:at(20)[1]}), tc=TIEN_CO.khong_che;
    ok(!r.fx?.own&&r.fx?.he==="khong_che"&&tcDmg(vOfB(E,rowE(id)),"khong_che").includes(r.dmg),`võ hồn chưa có tiên cơ riêng (${vname(id)}) vẫn dùng ${tc.name}: sát thương ${r.dmg}`);
    ok(await waitFor(()=>hasSt(beastOf(E,r.bid),"stun"),800),`${tc.name}: hồn thú bị choáng`);
    const b=beastOf(E,r.bid); await sleep(100); const bx=b?.x; await sleep(tc.stun*1000-500);
    ok(!beastOf(E,r.bid)||(hasSt(b,"stun")&&Math.abs(b.x-bx)<1),"đang choáng: hồn thú đứng yên");
    ok(await waitFor(()=>!hasSt(beastOf(E,r.bid),"stun"),1500),`hết choáng sau ${tc.stun} giây`);
    await test(E,"clear");
  }
  await E.room.leave();
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
console.log(fails?`✗ ${fails} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua");
process.exit(fails?1:0);
