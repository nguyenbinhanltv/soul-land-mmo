// Tiện ích chung của bài bot (#703): bot-test.mjs (bộ chạy + bảng nhóm) và các nhóm trong bot/<nhóm>.mjs cùng dùng.
// Biến toàn cục cũ (API, RUN, PASS, đếm lỗi) nằm ở đây và được export; đếm lỗi đọc qua failCount() vì không export được `let` ghi đè.
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { Client } from "colyseus.js";
import { SKIN_TONES, presetToLpc, QUEST_STARTER, BONE_ITEM } from "../../../shared/data.ts";
import { fogBytes } from "../../../shared/fog.ts";
import { pack } from "@colyseus/msgpackr";
import { applyBagDelta } from "../../../shared/bagSync.ts";

export const API = process.env.SERVER_URL ?? "http://localhost:2567", WS = API.replace(/^http/, "ws");
export const post = async (p, b) => { const r = await fetch(API + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); return { status: r.status, ...await r.json() }; };
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const waitFor = async (fn, ms = 2000) => { for (let t = 0; t < ms; t += 50) { if (fn()) return true; await sleep(50); } return false; };
// Mật khẩu bot sinh ngẫu nhiên mỗi lần chạy (không ghi cứng trong mã); tên bot kèm hậu tố lần chạy nên luôn là tài khoản mới.
export const PASS = randomUUID(), RUN = Date.now().toString(36).slice(-5);

let fails = 0;
/** Ghi một kiểm tra: in ✓ / ✗ và cộng số lỗi. */
export const ok = (cond, msg) => { console.log(cond ? "  ✓" : "  ✗", msg); if (!cond) fails++; };
/** Số kiểm tra thất bại tới lúc này (đọc mã thoát / dòng tổng kết). */
export const failCount = () => fails;

// ---- Bot dùng chung: đăng nhập / vào phòng / hook test / NPC / giao dịch (chuyển nguyên văn từ bot-test.mjs, bước 2 của #703) ----
// Mật khẩu bot sinh ngẫu nhiên mỗi lần chạy (không ghi cứng trong mã); tên bot kèm hậu tố lần chạy nên luôn là tài khoản mới.
// 11.5: server dùng bản dựng bằng tools/maps (`<mapId>.v2.json`) khi có file; bật đường lùi MAP_V1 (bản cũ) thì chạy bot với cùng
// MAP_V1 để đọc đúng file Tiled.
export const MAP_V1=new Set((process.env.MAP_V1??"").split(",").map(s=>s.trim()).filter(Boolean));
export const mapFileOf=m=>!(MAP_V1.has(m)||MAP_V1.has("all"))&&existsSync(new URL(`../../../shared/assets/${m}.v2.json`,import.meta.url))?`${m}.v2`:m;
export const mapUrl=m=>new URL(`../../../shared/assets/${mapFileOf(m)}.json`,import.meta.url);
// Tạo nhân vật (một lần, trước lễ thức tỉnh; tài khoản cũ chọn lại một lần), rồi lễ thức tỉnh:
// tài khoản mới tự chọn 1 SSR (kèm Lam Ngân Thảo); tài khoản cũ không thức tỉnh lại được.
export async function bot(name,choice,looks,near=false){
  name+=" "+RUN; const l=await post("/api/login",{name,password:PASS});
  console.log(`[${name}] ${l.character?"đã thức tỉnh từ trước":"tài khoản mới"}, ${l.looks?.chosen?"đã tạo nhân vật":"chưa tạo nhân vật"}`);
  ok(l.looks&&["sex","hair","hairCol","outfitCol","skin"].every(k=>Number.isInteger(l.looks[k])),"login trả ngoại hình (kể cả tông da, 9.9)");
  if(!l.looks?.chosen) ok(l.looks?.skin===0,`9.9: chưa tạo nhân vật thì tông da mặc định 0 (${l.looks?.skin})`);
  if(!l.looks?.chosen){
    if(!l.character) ok((await post("/api/awaken",{token:l.token,vohon:choice})).status===409,"thức tỉnh trước khi tạo nhân vật -> 409");
    let joined=true; try{ const r=await new Client(WS).joinOrCreate("map",{token:l.token}); await r.leave(); }catch{ joined=false; }
    ok(!joined,"vào bản đồ trước khi tạo nhân vật bị từ chối");
    for(const bad of [{...looks,sex:2},{...looks,hair:4},{...looks,hairCol:-1},{...looks,outfitCol:6},{...looks,hair:1.5},{...looks,sex:"1"},{sex:0},
      {...looks,skin:SKIN_TONES.length},{...looks,skin:-1},{...looks,skin:1.5},{...looks,skin:"2"}])
      ok((await post("/api/looks",{token:l.token,...bad})).status===400,`ngoại hình sai ${JSON.stringify(bad)} -> 400`);
    const r=await post("/api/looks",{token:l.token,...looks});
    // Không gửi `skin` (client cũ, trước 9.9) thì server lưu tông 0.
    ok(r.status===200&&r.looks?.chosen&&r.looks.mode==="lpc"&&JSON.stringify(r.looks.lpc)===JSON.stringify(presetToLpc({skin:0,...looks})),`tạo nhân vật ${JSON.stringify(looks)} (preset từ client cũ -> LPC gần nhất, HL2)`);
  }
  ok((await post("/api/looks",{token:l.token,...looks})).status===409,"tạo nhân vật lần hai -> 409");
  const me=await post("/api/me",{token:l.token});
  ok(me.looks?.chosen&&me.looks.mode==="lpc"&&JSON.stringify(me.looks.lpc)===JSON.stringify(l.looks?.chosen?l.looks.lpc:presetToLpc({skin:0,...looks})),`/api/me: đã tạo nhân vật, ngoại hình LPC`);
  ok(typeof me.mapId==="string"&&me.mapId===l.mapId,`/api/login và /api/me trả bản đồ đang đứng: ${me.mapId}`);
  if(!l.character) ok(me.mapId==="thanh_hon_thon","tài khoản mới bắt đầu ở Thánh Hồn Thôn");
  if(!l.character){
    ok((await post("/api/awaken",{token:l.token})).status===400,"thiếu lựa chọn -> 400");
    ok((await post("/api/awaken",{token:l.token,vohon:"hao_thien_chuy"})).status===400,"chọn UR -> 400");
    ok((await post("/api/awaken",{token:l.token,vohon:"lam_ngan_thao"})).status===400,"chọn Lam Ngân Thảo -> 400");
    ok((await post("/api/awaken",{token:l.token,vohon:"bang_phuong_hoang"})).status===400,"chọn võ hồn SSR ngoài danh sách cơ bản (8.3, Băng Phượng Hoàng) -> 400");
    const a=await post("/api/awaken",{token:l.token,vohon:choice});
    ok(a.status===200 && a.character?.vohon===choice,`thức tỉnh ${choice}, cấp ${a.character?.level}`);
  }
  ok((await post("/api/awaken",{token:l.token,vohon:choice})).status===409,"thức tỉnh lần hai -> 409");
  // Không gửi mapId: server chọn bản đồ mặc định và báo qua state.mapId.
  const b={name,token:l.token,logs:[],owned:null,ownedMsgs:0,looks:me.looks,isNew:!l.character,mapId:me.mapId,near};
  await enter(b);
  return b;
}
/**
 * Vào phòng bản đồ và nghe tin nhắn riêng (log, danh sách võ hồn + đội hình). `roomId`: vào thẳng phòng đó: kênh server chọn (như
 * client sau `travel`, mục 6 "Nhiều kênh") hoặc phòng sân đấu server gửi khi ghép trận (7.2).
 */
export async function enter(b,roomId){
  // Bản đồ đang đứng lấy từ /api/me (server lưu); client chỉ chuyển mapId để ghép phòng.
  const opts={token:b.token,mapId:b.mapId};
  b.room=roomId?await new Client(WS).joinById(roomId,opts):await new Client(WS).joinOrCreate("map",opts);
  b.owned=null; b.ownedMsgs=0; b.portal=null; b.travel=null; b.squad=null;
  b.chans=null; b.room.onMessage("channels",m=>{b.chans=m;}); // danh sách kênh (mục 6 "Nhiều kênh")
  b.mini=null; b.room.onMessage("mini",m=>{b.mini=m;}); // bản đồ nhỏ: vị trí cả bản đồ (11.4)
  b.fogBits=null; b.fogMsgs=0; b.fogd=[]; b.room.onMessage("fog",m=>{ b.fogBits=fogBytes(m?.bits); b.fogMsgs++; }); b.room.onMessage("fogd",m=>{ b.fogd.push(m); }); // sương mù khám phá (R8)
  b.rallies=[]; b.room.onMessage("rally",m=>{ b.rallies.push(m); }); // dấu "Tập trung ở đây" của tổ đội (R6)
  b.leftCode=null; b.room.onLeave(c=>{b.leftCode=c;});
  // Đại Đấu Hồn Trường (7.2): xếp hàng / đã ghép / pha trận / kết quả, bảng xếp hạng.
  b.arena=[]; b.aq=null; b.aqN=0; b.room.onMessage("arena",m=>{b.arena.push(m); if(m.k==="queue"){b.aq=m; b.aqN++;}});
  b.tong=null; b.tongN=0; b.room.onMessage("tong",m=>{b.tong=m; b.tongN++;}); // tông môn (#196)
  b.tboard=null; b.tboardN=0; b.room.onMessage("tongBoard",m=>{b.tboard=m; b.tboardN++;}); // bảng tông tuần (#197)
  b.top=null; b.topN=0; b.room.onMessage("arenaTop",m=>{b.top=m; b.topN++;});
  b.room.onMessage("log",m=>b.logs.push(m.text)); b.chats=[]; b.room.onMessage("chat",m=>{b.chats.push(m); if(b.chats.length>200) b.chats.shift();});
  b.fx=[]; b.fxs=[]; b.dmgs=[]; b.hurts=[]; b.gifts=[];
  b.room.onMessage("fx",m=>{b.fxs.push(m); if(m.k==="tienco") b.fx.push(m);});
  // `to` (9.1): số hồi sinh lực / khiên một đồng đội tổ đội nhận từ hiệu ứng phụ trợ; bot giữ những số mình nhận.
  b.room.onMessage("dmg",m=>{if(m.bid) b.dmgs.push(m); else if(m.to){ if(m.to===b.room.sessionId) b.gifts.push(m); } else if(m.id===b.room.sessionId) b.hurts.push(m);});
  b.room.onMessage("portal",m=>{b.portal=m;}); b.room.onMessage("travel",m=>{b.travel=m;});
  // Truyền tống trận (11.2): đứng trên trận, trận vừa mở khóa (giữ qua các lần vào phòng), bản đồ thế giới, thanh niệm.
  b.wpHere=null; b.wpUnlock??=[]; b.room.onMessage("wp",m=>{ if(m.k==="here") b.wpHere=m.key?m:null; if(m.k==="unlock") b.wpUnlock.push(m.key); });
  b.world=null; b.room.onMessage("world",m=>{b.world=m;}); b.recall=null; b.room.onMessage("recall",m=>{b.recall=m;});
  b.autost=[]; b.room.onMessage("autost",m=>{b.autost.push({...m,t:Date.now()});}); // trạng thái tự săn (AH2, #609)
  b.autoMsg=null; b.room.onMessage("auto",m=>{b.autoMsg=m;}); // tự săn (Auto 1): bật / tắt, giờ còn lại, lý do dừng
  b.offMsg=null; b.room.onMessage("offline",m=>{b.offMsg=m;}); b.room.send("offline"); // ủy thác offline (Auto 3): xin bảng nhận thưởng
  b.room.onMessage("vohons",m=>{b.owned=m; b.ownedMsgs++;});
  b.room.onMessage("squad",m=>{b.squad=m; b.squadMsgs=(b.squadMsgs??0)+1;});
  b.room.onMessage("stats",m=>{b.charStats=m; b.charStatsMsgs=(b.charStatsMsgs??0)+1;}); // UI-2: chỉ số tổng hợp cho bảng nhân vật
  b.room.onMessage("ko",m=>{b.ko=m;});
  b.fus=[]; b.room.onMessage("fusion",m=>b.fus.push(m)); // Võ Hồn Dung Hợp Kỹ (#192): ask / wait / done / cancel
  // Bản vá state đi riêng với tin nhắn (máy bận thì tới sau cả trăm ms): đếm bản vá, test() chờ bản vá đầu tiên sau tin trả hook.
  b.patchN=0; b.room.onStateChange(()=>{b.patchN++;});
  b.room.onMessage("test",m=>{b.test=m; b.testPatch=b.patchN;});
  // Túi đồ: tin "bag" là cả túi; từ #215 mỗi lần túi đổi server chỉ gửi tin "bagd" (phần đổi, shared/bagSync.ts). Chưa có túi gốc
  // (b.bag=null chờ tin "bag" vừa xin) thì bỏ qua tin "bagd". `bagStat`: số tin và byte msgpack của từng loại (đo đồng bộ túi, cộng dồn qua các lần vào phòng).
  b.bagStat??={bag:{n:0,bytes:0,max:0},bagd:{n:0,bytes:0,max:0}};
  const bagCount=(k,m)=>{ const st=b.bagStat[k], n=pack(m).length; st.n++; st.bytes+=n; st.max=Math.max(st.max,n); b.bagLast={k,n,m}; };
  b.room.onMessage("bag",m=>{b.bag=m; b.bagMsgs=(b.bagMsgs??0)+1; bagCount("bag",m);});
  b.room.onMessage("bagd",m=>{
    if(b.bag) b.bag={slots:m.slots,honTe:m.honTe,cd:m.cd,items:applyBagDelta(b.bag.items,m),buyback:m.buyback??b.bag.buyback,sell:m.sell??b.bag.sell,sold:m.sold??b.bag.sold};
    b.bagMsgs=(b.bagMsgs??0)+1; bagCount("bagd",m);
  });
  b.gear=null; b.gearN=0; b.room.onMessage("gear",m=>{b.gear=m; b.gearN++;}); // trang bị hồn sư đang mặc (E1, mục 5.15)
  b.room.onMessage("absorbing",m=>{b.absorbing=m;});
  b.room.onMessage("autosold",m=>{b.autosold=m;}); // tự bán từ xa (#216): số món, Hồn Tệ
  b.room.onMessage("enhanced",m=>{b.enh=m;}); // kết quả cường hóa hồn cốt (4.4)
  b.room.onMessage("enhancedcore",m=>{b.coreUp=m;}); // kết quả nâng cấp hồn hạch (5.3)
  b.looksInfo=null; b.looksN=0; b.room.onMessage("looksinfo",m=>{b.looksInfo=m; b.looksN++;}); // thợ may (L4 #511): số lần đã đổi ngoại hình / lý do từ chối
  b.room.onMessage("shardinfo",m=>{b.shardInfo=m;}); // Thương hội đổi mảnh (#282): số mảnh đã đổi hôm nay
  b.npc=null; b.room.onMessage("npc",m=>{b.npc=m;}); // server cho mở hộp thoại NPC (6.1)
  b.party=null; b.partyMsgs=0; b.room.onMessage("party",m=>{b.party=m; b.partyMsgs++;}); // khung tổ đội (7.1)
  b.friends=null; b.friendsN=0; b.room.onMessage("friends",m=>{b.friends=m; b.friendsN++;}); // bảng bạn bè (#195)
  b.quest=null; b.questMsgs=0; b.chains={}; b.chainMsgs=0; // tiến độ nhiệm vụ tân thủ (6.2); chuỗi cố định khác (chương 2, #189) ở b.chains[mã chuỗi]
  b.room.onMessage("quest",m=>{ if(m.chain===QUEST_STARTER){b.quest=m; b.questMsgs++;} else {b.chains[m.chain]=m; b.chainMsgs++;} });
  b.daily=null; b.dailyMsgs=0; b.room.onMessage("daily",m=>{b.daily=m; b.dailyMsgs++;}); // khảo hạch hằng ngày của Phất Lan Đức
  b.res=null; b.resMsgs=0; b.resEv=[]; b.resTop=null; b.room.onMessage("resonance",m=>{b.res=m; b.resMsgs++; if(m.ev) b.resEv.push(...m.ev);}); // cộng minh (8.2)
  b.room.onMessage("resonanceTop",m=>{b.resTop=m;});
  b.elite=[]; b.room.onMessage("elite",m=>b.elite.push(m)); // tinh anh xuất hiện / bị hạ (BĐ4)
  b.boss=[]; b.room.onMessage("boss",m=>{b.boss.push(m); if(b.boss.length>200) b.boss.shift();}); // thú vương: báo trước, xuất hiện, xếp hạng, bị hạ (BĐ5)
  // 5.1: hồn hạch rơi 15% cả với hồn thú dưới 1.000 năm; tắt khi có hook (GAME_TEST=1) để không xen vào các kiểm tra đồ rơi khác,
  // phần 5.1 tự bật lại. Chờ trả lời (server gửi tin vohons trước tin test) rồi mới đếm lại tin vohons, để không lẫn vào kiểm tra sau.
  b.test=null; b.room.send("test",{op:"core",r:100}); await waitFor(()=>b.test,1500); b.test=null; b.owned=null; b.ownedMsgs=0;
  // 11.4: state chỉ có thực thể ở gần (lọc đồng bộ theo vùng); bot đọc hồn thú / hồn sư ở xa nên tắt lọc, trừ bot thử lọc (`b.near`).
  if(!b.near){ b.room.send("test",{op:"view",all:true}); await waitFor(()=>b.test,1500); b.test=null; b.owned=null; b.ownedMsgs=0; }
  b.bag=null; b.room.send("vohons"); b.room.send("boss"); b.room.send("bag"); b.room.send("quest",{op:"get"}); b.room.send("resonance");
}
/**
 * Túi đồ (3.1): tổng số món theo mã, và dấu vân tay cả túi (id, mã, số lượng, số năm từng ô + Hồn Tệ; từ 4.1 loài / vị trí /
 * cường hóa hồn cốt, từ 4.2 võ hồn đang gắn, từ 5.1 sao / bộ / chỉ số hồn hạch) để so trước/sau khi lưu.
 */
export const qtyOf=(b,code)=>(b.bag?.items??[]).filter(i=>i.code===code).reduce((a,i)=>a+i.qty,0);
export const bagKey=b=>b.bag&&JSON.stringify([b.bag.honTe,b.bag.items.map(i=>[i.id,i.code,i.qty,i.years,i.stars,i.enhance,i.stats&&Object.entries(i.stats).sort(),i.vohon])]);
export const bonesOf=b=>(b.bag?.items??[]).filter(i=>i.code===BONE_ITEM);
/** JSON với khóa đã sắp (cột JSONB của PostgreSQL đổi thứ tự khóa khi đọc lại, ví dụ `items.stats` của hồn hạch có thêm `slot` từ 5.2). */
export const sj=o=>JSON.stringify(o&&typeof o==="object"?Object.entries(o).sort():o);
/** Gửi `use {id}` rồi chờ server trả túi mới (dùng được) hoặc một dòng log (bị từ chối). */
export async function useItem(b,id){ const n=b.bagMsgs??0, l=b.logs.length; b.room.send("use",{id}); await waitFor(()=>(b.bagMsgs??0)>n||b.logs.length>l,1500); }
export const lastLog=(b,re)=>waitFor(()=>re.test(b.logs.at(-1)??""),800);
// ---------- 6.1: NPC ----------
/** Thành đặt Đại Đấu Hồn Trường (từ BĐ6a; 7.2 là lối vào tạm ở Nặc Đinh Thành). */
export const AT="thien_dau_thanh";
/** Chỗ đứng của NPC `id` trong file Tiled của bản đồ (object `npc`, thuộc tính `npc`). */
/** Object `type` tên `name` của file Tiled đang dùng (bản ×8 hoặc bản cũ khi MAP_V1, 11.5): thay tọa độ ô ghi cứng của bản cũ. */
export const objOf=(mapId,type,name)=>JSON.parse(readFileSync(mapUrl(mapId),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type===type&&(name===undefined||o.name===name));
export const npcSpot=(mapId,id)=>{ const o=JSON.parse(readFileSync(mapUrl(mapId),"utf8")).layers.flatMap(l=>l.objects??[])
  .find(o=>o.type==="npc"&&(o.properties??[]).find(q=>q.name==="npc")?.value===id); return o?{x:o.x,y:o.y}:null; };
/** Gửi `talk {npc}`; trả mã NPC nếu server cho mở hộp thoại (tin `npc`), null nếu bị từ chối (một dòng log). */
export async function talk(b,npc){ b.npc=null; const l=b.logs.length; b.room.send("talk",{npc}); await waitFor(()=>b.npc||b.logs.length>l,1500); return b.npc?.id??null; }
/** Gửi `buy` / `sell`; server luôn trả một dòng log (kết quả hoặc lý do) rồi túi mới. Trả dòng log đó. */
export async function trade(b,type,msg){ const n=b.bagMsgs??0, l=b.logs.length; b.room.send(type,msg); await waitFor(()=>(b.bagMsgs??0)>n&&b.logs.length>l,1500); return b.logs.at(-1)??""; }
export const looseOf=b=>(b.bag?.items??[]).filter(i=>i.vohon===null);
/** Gửi đội hình rồi chờ server gửi lại đội (đã lưu hoặc bị từ chối). */
export async function sendTeam(b,slots){ const n=b.ownedMsgs; b.room.send("team",{slots}); await waitFor(()=>b.ownedMsgs>n); return b.owned.team; }
export const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
/**
 * Hook kiểm thử: gửi `test {op}`, chờ tin trả rồi chờ bản vá state đầu tiên tới sau tin đó (mọi thay đổi state của hook nằm trong bản
 * vá ấy; tin nhắn và bản vá đi riêng nên đọc state ngay khi tin trả tới có lúc còn số cũ, vd sinh lực trước `hurt`).
 */
export async function test(b,op,extra={}){ b.test=null; const n=b.ownedMsgs; b.room.send("test",{op,...extra}); await waitFor(()=>b.test&&b.ownedMsgs>n);
  const t=b.test; if(t) await waitFor(()=>b.patchN>b.testPatch,600); await sleep(30); return t; }
/**
 * Vùng của file Tiled gộp theo tên (bản đồ lớn dựng bằng tools/maps tách một vùng có tên thành nhiều mảnh chữ nhật, 11.3 / 11.5):
 * Map tên -> { name, years, beasts (mã loài), rects }.
 */
export function zonesByName(objs){
  const m=new Map(), pr=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  for(const o of objs.filter(o=>(o.type??o.class)==="zone")){
    const z=m.get(o.name)??{name:o.name,years:pr(o,"years"),beasts:String(pr(o,"beasts")??"").split(",").map(x=>x.split(":")[0].trim()).filter(Boolean),rects:[]};
    z.rects.push(o); m.set(o.name,z);
  }
  return m;
}
