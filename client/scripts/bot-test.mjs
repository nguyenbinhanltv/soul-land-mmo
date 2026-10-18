// Kiểm thử nhanh: 2 bot đăng nhập, di chuyển, đánh hồn thú, thử hấp thụ.
// Chạy khi server đang bật: npm run bot --prefix client
import { Client } from "colyseus.js";
const API="http://localhost:2567";
const post=async(p,b)=>(await fetch(API+p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)})).json();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function bot(name){
  const l=await post("/api/login",{name,password:"abcd"});
  const a=await post("/api/awaken",{token:l.token});
  const room=await new Client("ws://localhost:2567").joinOrCreate("forest",{token:l.token});
  const logs=[]; room.onMessage("log",m=>logs.push(m.text)); for(const t of ["chat","fx","dmg"]) room.onMessage(t,()=>{});
  return {room,logs,ch:a.character};
}
const A=await bot("Tester A"), B=await bot("Tester B");
await sleep(800);
const st=A.room.state, p=st.players.get(A.room.sessionId);
console.log("players",st.players.size,"beasts",st.beasts.size,"lvl",p.level,"hp",p.hp,"/",p.maxHp);
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
let dr=null; st.drops.forEach(d=>dr=d);
if(dr){ for(let i=0;i<50 && Math.hypot(dr.x-p.x,dr.y-p.y)>10;i++){const dx=dr.x-p.x,dy=dr.y-p.y,d=Math.hypot(dx,dy); A.room.send("input",{x:+(dx/d).toFixed(2),y:+(dy/d).toFixed(2)}); await sleep(60);} A.room.send("input",{x:0,y:0}); await sleep(150); A.room.send("absorb"); await sleep(300); console.log("absorb:",A.logs.at(-1)); }
B.room.send("chat",{text:"xin chào"}); await sleep(200);
await A.room.leave(); await B.room.leave(); process.exit(0);
