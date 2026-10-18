// Kiểm thử nhanh: 2 bot đăng nhập, tạo nhân vật, qua lễ thức tỉnh, vào phòng bản đồ, đổi võ hồn ra trận, di chuyển, đánh hồn thú, thử hấp thụ.
// Chạy khi server đang bật: npm run bot --prefix client   (server khác cổng: SERVER_URL=http://localhost:2600)
import { Client } from "colyseus.js";
import { existsSync } from "node:fs";
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
  if(!l.character){
    ok((await post("/api/awaken",{token:l.token})).status===400,"thiếu lựa chọn -> 400");
    ok((await post("/api/awaken",{token:l.token,vohon:"hao_thien_chuy"})).status===400,"chọn UR -> 400");
    ok((await post("/api/awaken",{token:l.token,vohon:"lam_ngan_thao"})).status===400,"chọn Lam Ngân Thảo -> 400");
    const a=await post("/api/awaken",{token:l.token,vohon:choice});
    ok(a.status===200 && a.character?.vohon===choice,`thức tỉnh ${choice}, cấp ${a.character?.level}`);
  }
  ok((await post("/api/awaken",{token:l.token,vohon:choice})).status===409,"thức tỉnh lần hai -> 409");
  // Không gửi mapId: server chọn bản đồ mặc định và báo qua state.mapId.
  const room=await new Client(WS).joinOrCreate("map",{token:l.token});
  const b={room,logs:[],owned:null,ownedMsgs:0,looks:me.looks};
  room.onMessage("log",m=>b.logs.push(m.text)); for(const t of ["chat","fx","dmg"]) room.onMessage(t,()=>{});
  room.onMessage("vohons",m=>{b.owned=m; b.ownedMsgs++;});
  room.send("vohons");
  return b;
}
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

// Đổi võ hồn ra trận khi ngoài giao chiến.
const other=A.owned?.list.find(v=>v.rowId!==A.owned.active);
if(other){
  const vh0=p.vh, n0=A.ownedMsgs, bView=()=>B.room.state.players.get(A.room.sessionId);
  A.room.send("pick",{rowId:other.rowId});
  ok(await waitFor(()=>A.ownedMsgs>n0&&A.owned.active===other.rowId),`đổi sang ${other.vohon}`);
  ok(await waitFor(()=>p.vh!==vh0&&p.level===other.level),`state đồng bộ: vh ${vh0} -> ${p.vh}, cấp ${p.level}`);
  ok(await waitFor(()=>bView()?.vh===p.vh),"B thấy A đổi võ hồn");
  ok(B.ownedMsgs===1,"B không nhận danh sách võ hồn của A");
  A.room.send("pick",{rowId:999999}); await sleep(200);
  ok(/không sở hữu/.test(A.logs.at(-1)??""),"chặn đổi sang võ hồn không sở hữu");
}

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
// Vừa đánh xong: không được đổi võ hồn.
if(other&&p.kills){ A.room.send("pick",{rowId:A.owned.list.find(v=>v.rowId!==A.owned.active).rowId}); await sleep(200); ok(/giao chiến/.test(A.logs.at(-1)??""),"chặn đổi võ hồn khi đang giao chiến"); }
let dr=null; st.drops.forEach(d=>dr=d);
if(dr){ for(let i=0;i<50 && Math.hypot(dr.x-p.x,dr.y-p.y)>10;i++){const dx=dr.x-p.x,dy=dr.y-p.y,d=Math.hypot(dx,dy); A.room.send("input",{x:+(dx/d).toFixed(2),y:+(dy/d).toFixed(2)}); await sleep(60);} A.room.send("input",{x:0,y:0}); await sleep(150); A.room.send("absorb"); await sleep(300); console.log("absorb:",A.logs.at(-1)); }
B.room.send("chat",{text:"xin chào"}); await sleep(200);
await A.room.leave(); await B.room.leave();
console.log(fails?`✗ ${fails} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua");
process.exit(fails?1:0);
