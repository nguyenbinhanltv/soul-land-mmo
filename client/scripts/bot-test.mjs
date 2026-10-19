// Kiểm thử nhanh: 2 bot đăng nhập, tạo nhân vật, qua lễ thức tỉnh, vào phòng bản đồ, xếp đội hình, đổi võ hồn trong trận,
// di chuyển, đánh hồn thú, thử hấp thụ, rồi vào lại để kiểm tra đội hình đã lưu.
// Bot thứ ba (tài khoản mới mỗi lần chạy) đi cổng Thánh Hồn Thôn -> Nặc Đinh Thành -> Tinh Đấu Ngoại vi -> Nội địa -> Ngoại vi
// -> Nặc Đinh Thành, thoát và vào lại để kiểm tra bản đồ và vị trí đã lưu (BĐ2, BĐ3), rồi giả làm tài khoản cũ còn `tinh_dau`.
// Quy cấp theo niên hạn và giảm kinh nghiệm theo chênh cấp (BĐ3): bảng cấp tương đương, hạ hồn thú nhiều mức năm qua hook.
// Chạy khi server đang bật: npm run bot --prefix client   (server khác cổng: SERVER_URL=http://localhost:2600)
// Túi đồ (3.1): nhận đan khởi đầu, dùng đan, hồi chiêu chung, Hồn Tệ khi hạ hồn thú, gộp đồ và giới hạn ô, túi đồ giữ nguyên khi
// đi cổng và khi thoát vào lại.
// Hồn thú theo số năm (3.2): tuổi nằm trong khoảng niên hạn của vùng, hạ thú thì hồn hoàn rơi mang đúng số năm, nhặt (E) vào túi,
// người khác không nhặt được trong 15 giây đầu, túi đầy thì báo, bỏ vật phẩm.
// Hấp thụ (3.3): giới hạn theo vòng của truyện, vượt >100% bị từ chối, tỉ lệ thất bại (hook roll cố định ngẫu nhiên) thì mất hồn
// hoàn, di chuyển / bị đánh thì hủy không mất gì, chọn võ hồn không ra trận, lên đủ 10 vòng / cấp 100 (hook set, rush).
// Phần luật gục từng võ hồn và chia kinh nghiệm (2.3b), năng lượng và chiêu tiên cơ theo 4 hệ (2.4), dùng đan khi mất máu (3.1),
// trạng thái dùng chung và hồn kỹ riêng của 5 võ hồn mẫu (2.5a), 5 võ hồn lưu phái Thiêu đốt (2.5b), 5 võ hồn lưu phái Cảm điện
// (2.5c: lan Cảm điện, Phong Lôi Chi Lực, Mê hoặc, Làm chậm, Phong ấn, tàng hình, vùng cố định, Phục Chế), 5 võ hồn còn lại
// (2.5d: Liệt thương, hút máu, hút huyết cả đội, tàng hình cả đội, gom quái, hồi máu và khiên, ràng buộc), chiêu báo trước của hồn
// thú (3.5: đứng trong vùng thì trúng, ra khỏi vùng trước 0,8 giây thì không, vùng an toàn không trúng, trạng thái trên hồn sư), tinh anh
// (BĐ4: đúng vùng, hệ số máu / sát thương, máu tăng theo số người tham gia, 2 chiêu, gọi bầy, Cuồng nộ và xóa buff, hồi sinh),
// gắn hồn cốt (4.2: đúng / sai vị trí, đổi chỗ, tháo khi túi đầy, chỉ số, giao chiến, đi cổng và vào lại), tà hóa thú vương
// (BĐ5: lịch giờ Việt Nam, báo toàn server, máu theo số người trong hang, giai đoạn 2, chia thưởng theo ngưỡng 3%, 3 lần/ngày,
// mở rương, rút đi) cần server bật hook kiểm thử:
// GAME_TEST=1 npm run dev:server.
import { Client } from "colyseus.js";
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { TIERS, TRAVEL_CAST, TEAM_SIZE, XP_SHARE_ACTIVE, XP_SHARE_BENCH, REVIVE_SECS, RESPAWN_SECS, xpNeed, beastLevel, xpLevelScale,
  BEASTS, MAP_MOVED, XP_LEVEL_CAP,
  VOHON, HE, vohonIndex, calcStats, tierOfYears, TIEN_CO, TIEN_CO_MAX, TIEN_CO_GAIN, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY,
  BAG_SLOTS, DAN_CD, STARTER_ITEMS, itemDef, formatHonTe,
  TIER_MULT, SKILLS, skillsOf, skillPower, buffPower, BUFF_SCALE, TIEN_CO_RIENG, tienCoOf, STATUS, statusBit, buffBit, BUFFS, CRIT, PCT_HP_CAP,
  BONDS, bondsOf,
  CC_TIER_MULT, BEAST_REGEN, TEAM_COMBAT_SECS, PHOENIX_FIELD_R, PHONG_LOI, BEAST_AGGRO_R, BEAST_WANDER, SPAWN_CLEAR,
  MAPS, MAX_YEARS, beastStats, rollYears, tierBand, parseLevelRange, RING_ITEM, DROP_OWNER_SECS, absorbSecs, absorbChance, ringLimit,
  MAX_RINGS, MAX_LEVEL, SHARD_UNLOCK, STAR_COST, MAX_STARS, starCost, shardChance, shardCode, starMult,
  BONE_ITEM, BONE_SLOTS, boneChance, boneStats, boneName, boneBonus, PICKUP_RANGE,
  BEAST_SKILL_YEARS, beastSkillOf, teleHits, TELE_PAD, TELE_WARN, TELE_FIRST,
  BOSSES, bossIndex, beastIndex, ELITE, ELITE_RAGE, bossHpMult, teleZones, beastBuffBit, BEAST_BUFFS, beastName,
  KING, KING_CHEST, KING_TIMES, kingNext, kingActive, vnDay, vnHHMM, kingShardPool, chestCode } from "../../shared/data.ts";
const API=process.env.SERVER_URL??"http://localhost:2567", WS=API.replace(/^http/,"ws");
const post=async(p,b)=>{const r=await fetch(API+p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}); return {status:r.status,...await r.json()};};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const waitFor=async(fn,ms=2000)=>{for(let t=0;t<ms;t+=50){if(fn()) return true; await sleep(50);} return false;};
// Mật khẩu bot sinh ngẫu nhiên mỗi lần chạy (không ghi cứng trong mã); tên bot kèm hậu tố lần chạy nên luôn là tài khoản mới.
const PASS=randomUUID(), RUN=Date.now().toString(36).slice(-5);
let fails=0; const ok=(cond,msg)=>{console.log(cond?"  ✓":"  ✗",msg); if(!cond) fails++;};

// Tạo nhân vật (một lần, trước lễ thức tỉnh; tài khoản cũ chọn lại một lần), rồi lễ thức tỉnh:
// tài khoản mới tự chọn 1 SSR (kèm Lam Ngân Thảo); tài khoản cũ không thức tỉnh lại được.
async function bot(name,choice,looks){
  name+=" "+RUN; const l=await post("/api/login",{name,password:PASS});
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
  b.room.onMessage("log",m=>b.logs.push(m.text)); b.chats=[]; b.room.onMessage("chat",m=>{b.chats.push(m); if(b.chats.length>200) b.chats.shift();});
  b.fx=[]; b.fxs=[]; b.dmgs=[]; b.hurts=[];
  b.room.onMessage("fx",m=>{b.fxs.push(m); if(m.k==="tienco") b.fx.push(m);});
  b.room.onMessage("dmg",m=>{if(m.bid) b.dmgs.push(m); else if(m.id===b.room.sessionId) b.hurts.push(m);});
  b.room.onMessage("portal",m=>{b.portal=m;}); b.room.onMessage("travel",m=>{b.travel=m;});
  b.room.onMessage("vohons",m=>{b.owned=m; b.ownedMsgs++;});
  b.room.onMessage("squad",m=>{b.squad=m; b.squadMsgs=(b.squadMsgs??0)+1;});
  b.room.onMessage("ko",m=>{b.ko=m;});
  b.room.onMessage("test",m=>{b.test=m;});
  b.room.onMessage("bag",m=>{b.bag=m; b.bagMsgs=(b.bagMsgs??0)+1;});
  b.room.onMessage("absorbing",m=>{b.absorbing=m;});
  b.elite=[]; b.room.onMessage("elite",m=>b.elite.push(m)); // tinh anh xuất hiện / bị hạ (BĐ4)
  b.boss=[]; b.room.onMessage("boss",m=>{b.boss.push(m); if(b.boss.length>200) b.boss.shift();}); // thú vương: báo trước, xuất hiện, xếp hạng, bị hạ (BĐ5)
  b.bag=null; b.room.send("vohons"); b.room.send("bag");
}
/**
 * Túi đồ (3.1): tổng số món theo mã, và dấu vân tay cả túi (id, mã, số lượng, số năm từng ô + Hồn Tệ; từ 4.1 loài / vị trí /
 * cường hóa hồn cốt, từ 4.2 võ hồn đang gắn) để so trước/sau khi lưu.
 */
const qtyOf=(b,code)=>(b.bag?.items??[]).filter(i=>i.code===code).reduce((a,i)=>a+i.qty,0);
const bagKey=b=>b.bag&&JSON.stringify([b.bag.honTe,b.bag.items.map(i=>[i.id,i.code,i.qty,i.years,i.enhance,i.stats&&Object.entries(i.stats).sort(),i.vohon])]);
const bonesOf=b=>(b.bag?.items??[]).filter(i=>i.code===BONE_ITEM);
/** Gửi `use {id}` rồi chờ server trả túi mới (dùng được) hoặc một dòng log (bị từ chối). */
async function useItem(b,id){ const n=b.bagMsgs??0, l=b.logs.length; b.room.send("use",{id}); await waitFor(()=>(b.bagMsgs??0)>n||b.logs.length>l,1500); }
const lastLog=(b,re)=>waitFor(()=>re.test(b.logs.at(-1)??""),800);
/** Gửi đội hình rồi chờ server gửi lại đội (đã lưu hoặc bị từ chối). */
async function sendTeam(b,slots){ const n=b.ownedMsgs; b.room.send("team",{slots}); await waitFor(()=>b.ownedMsgs>n); return b.owned.team; }
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const A=await bot("Tester A","lam_dien_ba_vuong_long",{sex:1,hair:2,hairCol:3,outfitCol:4}), B=await bot("Tester B","bich_lan_xa_hoang",{sex:0,hair:3,hairCol:5,outfitCol:1});
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

// ---------- 3.2: hồn thú có tuổi theo số năm ----------
// Hàm thuần: đúng mốc năm thì bằng chỉ số của bậc, giữa hai mốc tăng liên tục; tuổi tung ra luôn nằm trong khoảng.
ok(TIERS.every(t=>{ const s=beastStats(t.years); return s.hp===t.hp&&s.dmg===t.dmg&&s.xp===t.xp; }),"beastStats đúng mốc năm = chỉ số bậc");
ok([10,50,99,100,437,999,1000,5000,25000,99999,100000].every((y,i,a)=>!i||beastStats(y).hp>=beastStats(a[i-1]).hp)&&beastStats(437).hp>TIERS[1].hp&&beastStats(437).hp<TIERS[2].hp,
  `máu hồn thú tăng theo số năm: 100 năm ${beastStats(100).hp}, 437 năm ${beastStats(437).hp}, 999 năm ${beastStats(999).hp}`);
ok([[10,100],[80,250],[300,700],[15000,25000],[100000,100000]].every(([lo,hi])=>[0,0.3,0.999999].every(r=>{ const y=rollYears(lo,hi,r); return y>=lo&&y<=hi&&Number.isInteger(y); })),"rollYears nằm trong khoảng");
ok(same(tierBand(1),[100,999])&&same(tierBand(4),[MAX_YEARS,MAX_YEARS]),"khoảng năm theo màu: vàng 100–999, đỏ 100.000");
/** Mọi hồn thú trong phòng của bot `b` có tuổi nằm trong khoảng `years` của một vùng gần đó (bảng 5.3), bậc và máu suy từ số năm. */
function checkBeastYears(b){
  const s=b.room.state, map=JSON.parse(readFileSync(new URL(`../../shared/assets/${s.mapId}.json`,import.meta.url),"utf8"));
  const prop=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  const zs=map.layers.flatMap(l=>l.objects??[]).filter(o=>(o.type??o.class)==="zone").map(o=>({...o,yr:parseLevelRange(prop(o,"years")),
    sp:String(prop(o,"beasts")??"").split(",").map(x=>x.split(":")[0].trim()).filter(Boolean)}));
  const bad=[], ys=[]; let n=0;
  s.beasts.forEach(x=>{ n++; ys.push(x.years);
    // Hồn thú đi lang thang / đuổi người tối đa 220 pixel quanh chỗ sinh: so với các vùng trong phạm vi đó.
    const near=zs.filter(z=>z.yr&&x.x>=z.x-240&&x.x<=z.x+z.width+240&&x.y>=z.y-240&&x.y<=z.y+z.height+240);
    // Loài và số năm phải khớp cùng một vùng (bảng 5.3): loài khai báo ở `beasts`, tuổi trong `years`.
    // Tinh anh (BĐ4, `rank` 1): niên hạn bằng mức trên của vùng, máu x ELITE.hp (nhân thêm theo số người tham gia nếu đang giao chiến).
    const base=x.rank?Math.round(beastStats(x.years).hp*ELITE.hp):beastStats(x.years).hp;
    if(!near.some(z=>x.rank?x.years===z.yr[1]:x.years>=z.yr[0]&&x.years<=z.yr[1]&&z.sp.includes(BEASTS[x.species]?.id))||x.tier!==tierOfYears(x.years)
      ||!(x.maxHp===base||x.rank&&[2,3,4,5,6].some(n=>x.maxHp===Math.round(base*bossHpMult(n)))))
      bad.push(`${x.rank?BOSSES[x.species]?.id:BEASTS[x.species]?.id} ${x.years}@${x.x.toFixed(0)},${x.y.toFixed(0)}`); });
  const [lo,hi]=MAPS[s.mapId].years??[0,0];
  ok(zs.every(z=>z.yr)&&n>0&&!bad.length&&ys.every(y=>y>=lo&&y<=hi),
    `${s.mapId}: ${n} hồn thú có loài và số năm đúng vùng (${Math.min(...ys)}–${Math.max(...ys)} năm, bản đồ ${lo}–${hi})`+(bad.length?` sai: ${bad.join(" ")}`:""));
  return map;
}
/**
 * Không hồn thú nào sát trại cổng / cổng / điểm xuất hiện (mục 5.8: không sinh trong SPAWN_CLEAR pixel mỗi trục quanh chúng; hồn thú
 * lang thang tối đa BEAST_WANDER pixel mỗi trục quanh chỗ sinh, nên không con nào trong SPAWN_CLEAR − BEAST_WANDER pixel: ngoài tầm
 * phát hiện của người đứng ở đó). Gọi lúc vừa vào bản đồ, khi chưa kéo hồn thú nào về.
 */
function checkGateClear(b,map){
  const gates=map.layers.flatMap(l=>l.objects??[]).filter(o=>["spawn","portal","arrive"].includes(o.type)), r=SPAWN_CLEAR-BEAST_WANDER;
  const inBox=(g,x,y)=>x>g.x-r&&x<g.x+(g.width??0)+r&&y>g.y-r&&y<g.y+(g.height??0)+r;
  const near=[]; b.room.state.beasts.forEach(x=>{ for(const g of gates) if(inBox(g,x.x,x.y)) near.push(`${g.name}: ${x.years} năm ở ${x.x.toFixed(0)},${x.y.toFixed(0)}`); });
  ok(r>=BEAST_AGGRO_R&&!near.length,`${b.room.state.mapId}: không hồn thú nào trong ${r} pixel quanh ${gates.length} trại cổng / cổng / điểm xuất hiện`+(near.length?` (${near.join("; ")})`:""));
}
checkBeastYears(A);
ok(B.room.state.beasts.size===st.beasts.size&&[...st.beasts.entries()].every(([k,x])=>B.room.state.beasts.get(k)?.years===x.years),"B thấy cùng số năm của hồn thú");

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

// ---------- 3.1: túi đồ chỉ gửi chính chủ, đan khởi đầu, dùng đan bị từ chối khi không hợp lệ ----------
ok(await waitFor(()=>A.bag&&B.bag),"nhận tin túi đồ riêng");
ok(A.bag?.slots===BAG_SLOTS&&A.bag.honTe===0,`túi ${A.bag?.items.length}/${A.bag?.slots} ô, Hồn Tệ ${A.bag?.honTe}`);
ok(STARTER_ITEMS.every(s=>qtyOf(A,s.code)===s.qty)&&A.bag.items.length===STARTER_ITEMS.length,
  `tài khoản mới nhận đan khởi đầu: ${A.bag?.items.map(i=>`${i.qty} ${itemDef(i.code)?.name}`).join(", ")}`);
ok(/Quà khởi đầu/.test(A.logs.join("|")),"báo quà khởi đầu");
ok(A.bag&&B.bag&&!A.bag.items.some(i=>B.bag.items.some(j=>j.id===i.id)),"túi đồ A và B tách biệt");
ok(!("bag" in bView())&&!("honTe" in bView()),"state công khai không có túi đồ, Hồn Tệ");
{
  const huyet=A.bag.items.find(i=>i.code==="hoi_huyet_dan"), hon=A.bag.items.find(i=>i.code==="hoi_hon_dan"), k0=bagKey(A);
  await useItem(A,huyet.id); ok(await lastLog(A,/Sinh lực đang đầy/)&&bagKey(A)===k0,"sinh lực đầy: không phí Hồi Huyết Đan");
  await useItem(A,hon.id); ok(await lastLog(A,/Hồn lực đang đầy/)&&bagKey(A)===k0,"hồn lực đầy: không phí Hồi Hồn Đan");
  for(const bad of [{id:"khong-co"},{id:123},{id:null},{}]){ await useItem(A,bad.id); }
  ok(await lastLog(A,/Không có vật phẩm/)&&bagKey(A)===k0,"id sai bị từ chối");
  const bk=bagKey(B); await useItem(B,huyet.id);
  ok(await lastLog(B,/Không có vật phẩm/)&&bagKey(A)===k0&&bagKey(B)===bk,"B dùng id món đồ của A: bị từ chối");
}
ok(formatHonTe(0)==="0 đồng"&&formatHonTe(1234567)==="123 kim 45 ngân 67 đồng"&&formatHonTe(10005)==="1 kim 5 đồng",`quy đổi Hồn Tệ: ${formatHonTe(1234567)}`);

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
const inSafeOf=b=>{ const q=b.room.state.players.get(b.room.sessionId); return !!safe&&q.x>=safe.x&&q.x<=safe.x+safe.width&&q.y>=safe.y&&q.y<=safe.y+safe.height; };
const inSafe=()=>inSafeOf(A);
/** Đi thẳng tới (tx, ty), mỗi 50 ms chỉnh lại hướng; trả về true khi tới cách dưới 3 pixel. */
async function goTo(b,tx,ty,ms=8000){
  const q=b.room.state.players.get(b.room.sessionId);
  const ok=await waitFor(()=>{ const dx=tx-q.x, dy=ty-q.y, d=Math.hypot(dx,dy); if(d<3) return true;
    b.room.send("input",{x:+(dx/d).toFixed(2),y:+(dy/d).toFixed(2)}); return false; },ms);
  b.room.send("input",{x:0,y:0}); await sleep(150); return ok;
}
/** Bước một chút theo (x, y) để quay mặt: chờ thấy bước rồi mới dừng. Gửi dừng sau một khoảng cố định thì server bận có thể nhận
 *  cả hai tin trong cùng một nhịp, không bước, hướng nhìn (chỉ đổi khi bước) giữ hướng cũ và đòn đánh / hồn kỹ có hướng bắn trượt. */
async function step(b,x,y){
  const q=b.room.state.players.get(b.room.sessionId), x0=q.x, y0=q.y;
  b.room.send("input",{x,y}); await waitFor(()=>Math.hypot(q.x-x0,q.y-y0)>=1,1000); b.room.send("input",{x:0,y:0}); await sleep(100);
}
/** Đi từ làng (vùng an toàn) ra Bãi tập theo đường làng (hàng ô 27–28); ngoài làng thì đi về phía đông một đoạn. */
async function leaveSafe(b){
  const q=b.room.state.players.get(b.room.sessionId), ry=27.5*16;
  if(inSafeOf(b)){ await goTo(b,q.x,ry,4000); await goTo(b,safe.x+safe.width+30,ry); }
  else { b.room.send("input",{x:1,y:0}); await sleep(1500); b.room.send("input",{x:0,y:0}); await sleep(150); }
  if(inSafeOf(b)) console.log(`  (${b.name} kẹt ở ${q.x.toFixed(0)},${q.y.toFixed(0)})`);
  return !inSafeOf(b);
}
await leaveSafe(A);
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
// Năng lượng tiên cơ (2.4): đánh thường trúng thì võ hồn khác trong đội tích năng lượng, võ hồn ra trận không tự tích.
if(p.kills){
  const benchRow=A.owned.team.find(r=>r&&r!==A.owned.active), en=A.squad?.list.find(s=>s.rowId===benchRow)?.en??0;
  ok(en>0&&(en===TIEN_CO_MAX||en%TIEN_CO_GAIN.attack===0),`đánh hồn thú: võ hồn ngoài sân tích ${en}/${TIEN_CO_MAX} năng lượng tiên cơ`);
  ok((A.squad?.list.find(s=>s.rowId===A.owned.active)?.en??0)===0,"võ hồn ra trận không tự tích năng lượng");
}
// Hồn Tệ (3.1): hạ hồn thú thì người hạ nhận vài đồng.
if(p.kills>kills0) ok(await waitFor(()=>A.bag?.honTe>0)&&A.logs.some(t=>/^Hạ .*Hồn Tệ/.test(t)),`hạ ${p.kills-kills0} hồn thú: Hồn Tệ ${A.bag?.honTe} đồng (${formatHonTe(A.bag?.honTe??0)})`);
// Vừa đánh xong (đang giao chiến): đổi võ hồn trong đội được, xếp đội thì không.
if(p.kills>kills0){
  await waitFor(()=>p.swCd===0,3500);
  const want=A.owned.team.find(r=>r&&r!==A.owned.active), t0=[...A.owned.team];
  A.room.send("switch",{slot:A.owned.team.indexOf(want)});
  ok(await waitFor(()=>A.owned.active===want),"đổi võ hồn trong đội khi đang giao chiến");
  ok(same(await sendTeam(A,[t0[1],t0[0],t0[2],t0[3]]),t0)&&await lastLog(A,/giao chiến/),"chặn xếp đội khi đang giao chiến");
}
let dr=null; st.drops.forEach(d=>{ if(d.owner===A.room.sessionId) dr=d; });
if(dr){
  // 3.2: hồn hoàn dưới đất mang số năm của hồn thú; đi tới, nhấn E (pickup) thì vào túi đồ.
  const yrs=dr.years, n0=(A.bag?.items??[]).filter(i=>i.code===RING_ITEM).length;
  ok(yrs>=10&&dr.tier===tierOfYears(yrs)&&A.logs.some(t=>t.startsWith("Hạ ")&&t.includes(`${yrs.toLocaleString("vi-VN")} năm`)),`hồn hoàn rơi mang số năm của hồn thú: ${yrs} năm`);
  for(let i=0;i<50 && Math.hypot(dr.x-p.x,dr.y-p.y)>10;i++){const dx=dr.x-p.x,dy=dr.y-p.y,d=Math.hypot(dx,dy); A.room.send("input",{x:+(dx/d).toFixed(2),y:+(dy/d).toFixed(2)}); await sleep(60);}
  A.room.send("input",{x:0,y:0}); await sleep(150); A.room.send("pickup");
  ok(await waitFor(()=>(A.bag?.items??[]).filter(i=>i.code===RING_ITEM).length===n0+1),`nhặt hồn hoàn: túi có ${A.bag?.items.filter(i=>i.code===RING_ITEM).map(i=>i.years).join(", ")} năm`);
  const it=A.bag?.items.find(i=>i.code===RING_ITEM&&i.years===yrs);
  if(it){ A.room.send("absorb",{itemId:it.id}); await sleep(300); console.log("absorb:",A.logs.at(-1)); }
}
// ---------- 2.3b: gục từng võ hồn, hồi sinh, chia kinh nghiệm 40/20 cho đội ----------
// Hàm luật thuần trong shared/data.ts: cấp tương đương theo số năm (BĐ3, bảng "Quy cấp theo niên hạn" ở 5.3, tính từ giới hạn
// hồn hoàn) và giảm kinh nghiệm theo chênh cấp.
{
  const tbl=[[10,10],[423,10],[424,20],[764,20],[765,30],[1760,30],[1761,40],[5000,40],[5001,50],[12000,50],[12001,60],[20000,60],[20001,70],[50000,70],[50001,80],[100000,80]];
  const bad=tbl.filter(([y,lv])=>beastLevel(y)!==lv);
  ok(!bad.length,"cấp tương đương theo niên hạn = bảng 5.3"+(bad.length?`: sai ${bad.map(([y])=>`${y} năm -> ${beastLevel(y)}`).join(", ")}`:""));
  ok([1,2,3,4,5,6,7,8,9,10].every(k=>beastLevel(ringLimit(k))===10*Math.min(k,8)&&(k>=8||beastLevel(ringLimit(k)+1)===10*(k+1))),"cấp tương đương = bình cảnh nhỏ nhất hấp thụ được trong giới hạn");
  // Bảng vùng 5.3: cột "Cấp" của Ngoại vi và Nội địa.
  const zl=[["300-700","10–20"],["600-1200","20–30"],["1000-1600","30"],["1400-2000","30–40"],["1500-5000","30–40"],["4000-12000","40–50"],["10000-18000","50–60"],["15000-25000","60–70"]];
  ok(zl.every(([r,w])=>{ const [a,b]=parseLevelRange(r).map(beastLevel); return (a===b?`${a}`:`${a}–${b}`)===w; }),"cấp tương đương các vùng Ngoại vi / Nội địa đúng bảng 5.3");
}
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
  {
    // 3.1: dùng đan khi mất máu / hồn lực, hồi chiêu chung giữa Hồi Huyết Đan và Hồi Hồn Đan.
    await test(A,"rest",{s:DAN_CD});
    await test(A,"hurt",{pct:60}); await waitFor(()=>p.hp<p.maxHp*0.6);
    const huyet=A.bag.items.find(i=>i.code==="hoi_huyet_dan"), q0=qtyOf(A,"hoi_huyet_dan"), hp0=p.hp, gain=Math.floor(p.maxHp*itemDef("hoi_huyet_dan").hp);
    await useItem(A,huyet.id);
    ok(qtyOf(A,"hoi_huyet_dan")===q0-1&&await waitFor(()=>p.hp>=Math.min(p.maxHp,hp0-1+gain)),`dùng Hồi Huyết Đan: sinh lực ${hp0} -> ${p.hp}/${p.maxHp}, còn ${qtyOf(A,"hoi_huyet_dan")} viên`);
    ok(A.bag.cd>DAN_CD-1&&A.bag.cd<=DAN_CD,`hồi chiêu đan ${A.bag.cd.toFixed(2)} giây`);
    await test(A,"drain",{pct:80}); await waitFor(()=>p.mp<p.maxMp*0.3);
    const hon=A.bag.items.find(i=>i.code==="hoi_hon_dan"), h0=qtyOf(A,"hoi_hon_dan");
    await useItem(A,hon.id); ok(await lastLog(A,/Đan dược đang hồi/)&&qtyOf(A,"hoi_hon_dan")===h0,"Hồi Hồn Đan chung hồi chiêu với Hồi Huyết Đan: bị chặn");
    await test(A,"rest",{s:DAN_CD}); ok(A.bag.cd===0,"nghỉ đủ: hết hồi chiêu đan");
    const mp0=p.mp; await useItem(A,hon.id);
    ok(qtyOf(A,"hoi_hon_dan")===h0-1&&await waitFor(()=>p.mp>mp0),`dùng Hồi Hồn Đan: hồn lực ${mp0} -> ${p.mp}/${p.maxMp}`);
    await test(A,"rest",{s:DAN_CD});
  }
  const a=A.owned.active, bn=A.owned.team.find(r=>r&&r!==a), orig=[a,bn].map(r=>({rowId:r,level:vOf(r).level,xp:vOf(r).xp,rings:[...vOf(r).rings]}));
  ok(A.owned.team.filter(Boolean).length===2&&TEAM_SIZE===4,"đội 2 võ hồn, 2 ô trống");
  /** Hạ hồn thú bậc `tier` (qua hook): trả về kinh nghiệm mỗi võ hồn nhận được. */
  const kill=async tier=>{ const x0=[a,bn].map(r=>vOf(r).xp); await test(A,"kill",{tier}); return [a,bn].map((r,i)=>vOf(r).xp-x0[i]); };
  const split=(lv,tier,years=TIERS[tier].years)=>{ const base=beastStats(years).xp*xpLevelScale(lv,beastLevel(years)); return [Math.round(base*XP_SHARE_ACTIVE),Math.round(base*XP_SHARE_BENCH)]; };
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
    ok(same(got,want),`ra trận cấp ${lv}, hồn thú cấp tương đương ${beastLevel(TIERS[1].years)}: x${xpLevelScale(lv,beastLevel(TIERS[1].years))} -> +${got.join("/")} (cần ${want.join("/")})`);
  }
  // BĐ3: giảm theo cấp tương đương của số năm hồn thú (không theo bậc): võ hồn ra trận cấp 45 hạ hồn thú 1.761 năm (cấp 40) nhận
  // đủ, 1.760 năm (cấp 30, kém 15) còn 50%, 764 năm (cấp 20, kém 25) còn 10%. Cấp võ hồn tính tối đa XP_LEVEL_CAP (80).
  const killY=async years=>{ const x0=[a,bn].map(r=>vOf(r).xp); await test(A,"kill",{tier:0,years}); return [a,bn].map((r,i)=>vOf(r).xp-x0[i]); };
  for(const [lv,rings,years,k] of [[45,[10,100,100,1000],1761,1],[45,[10,100,100,1000],1760,0.5],[45,[10,100,100,1000],764,0.1],
    [95,[10,100,100,1000,5000,10000,20000,50000,90000],100000,1],[95,[10,100,100,1000,5000,10000,20000,50000,90000],50000,0.5]]){
    await test(A,"set",{rowId:a,level:lv,xp:0,rings}); await test(A,"set",{rowId:bn,level:45,xp:0,rings:[10,100,100,1000]});
    got=await killY(years); want=split(lv,0,years);
    ok(xpLevelScale(lv,beastLevel(years))===k&&same(got,want)&&want[0]>0,
      `ra trận cấp ${lv}${lv>XP_LEVEL_CAP?` (tính ${XP_LEVEL_CAP})`:""}, hồn thú ${years} năm (cấp ${beastLevel(years)}): ${k*100}% -> +${got.join("/")} (cần ${want.join("/")})`);
  }
  await test(A,"set",{rowId:bn,level:5,xp:0,rings:[]});
  await test(A,"set",{rowId:a,level:5,xp:0,rings:[]});

  // Đứng trong làng nhưng ngoài doanh trại (ở doanh trại võ hồn gục hồi ngay): vùng an toàn không có hồn thú đánh tới, nên sinh lực
  // từng võ hồn chỉ đổi theo hook. Ở Bãi tập, hồn thú vàng chủ động (từ 3.2) có thể đánh võ hồn sắp tự ra trận trước khi thử.
  const ry=27.5*16; let spot=null; // đường làng đông–tây (hàng ô 27–28)
  for(let x=safe.x+16;x<spawnObj.x-16&&!spot;x+=8) if(!blocked(x,ry)) spot={x,y:ry};
  if(spot) await test(A,"goto",spot);
  ok(inSafe()&&!inCamp(),`đứng trong làng, ngoài doanh trại: ${p.x.toFixed(0)},${p.y.toFixed(0)}`);
  await test(A,"set",{rowId:a,level:5,xp:0,rings:[]}); // hồi đầy võ hồn ra trận
  // Võ hồn ra trận gục -> tự đổi sang võ hồn còn sống, không chờ hồi chiêu đổi; võ hồn mới giữ sinh lực riêng (đầy).
  const s0=A.owned.team.indexOf(bn); A.room.send("switch",{slot:s0});
  ok(await waitFor(()=>A.owned.active===bn&&p.swCd>2),"đổi tay sang ô 2, đang hồi chiêu đổi");
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
  { const k=bagKey(A); await useItem(A,A.bag.items.find(i=>i.code==="hoi_huyet_dan").id); ok(await lastLog(A,/Đã gục/)&&bagKey(A)===k,"cả đội gục: không dùng được đan"); }
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
  if(inSafe()){
    // Vùng an toàn không giao chiến: đổi vào võ hồn đầy năng lượng vẫn đổi được nhưng không tung tiên cơ, giữ năng lượng.
    const row=A.owned.team.find(r=>r&&r!==A.owned.active);
    await waitFor(()=>p.swCd===0,3500);
    await test(A,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sqOf(A,row)?.en===TIEN_CO_MAX);
    A.fx=[]; await switchRow(A,row); await sleep(300);
    ok(!A.fx.length&&sqOf(A,row)?.en===TIEN_CO_MAX&&/Vùng an toàn/.test(A.logs.slice(-3).join("|")),"trong làng: đổi vào võ hồn đầy năng lượng không tung tiên cơ, giữ năng lượng");
  }
  ok(await leaveSafe(A),"ra khỏi làng để thử tiên cơ");
  {
    // Tích năng lượng: mỗi đòn đánh thường trúng +TIEN_CO_GAIN.attack dù trúng nhiều hồn thú; Hồn Tiễn 10 mũi chỉ tính một lần.
    const act=A.owned.active, bench=A.owned.team.find(r=>r&&r!==act);
    await test(A,"energy",{v:0}); await waitFor(()=>sqOf(A,bench)?.en===0);
    await step(A,1,0);
    await spawnNear(A,1,12); await spawnNear(A,1,14);
    A.room.send("attack"); await waitFor(()=>sqOf(A,bench)?.en>0);
    ok(sqOf(A,bench)?.en===TIEN_CO_GAIN.attack&&sqOf(A,act)?.en===0,`đòn thường trúng 2 hồn thú: võ hồn ngoài sân +${sqOf(A,bench)?.en} (cần ${TIEN_CO_GAIN.attack}), võ hồn ra trận ${sqOf(A,act)?.en}`);
    await test(A,"set",{rowId:act,level:30,xp:0,rings:[10,100,100]}); await test(A,"energy",{v:0}); await waitFor(()=>sqOf(A,bench)?.en===0);
    await spawnNear(A,1,-20);
    A.room.send("skill",{i:2}); await sleep(900);
    ok(sqOf(A,bench)?.en===TIEN_CO_GAIN.skill,`hồn kỹ 3 (${skillsOf(VOHON[p.vh].id)[2].name}, nhiều mũi / nhiều nhát): +${sqOf(A,bench)?.en} một lần (cần ${TIEN_CO_GAIN.skill})`);
    // Chưa đầy thì đổi vào không tung tiên cơ, năng lượng giữ nguyên.
    await test(A,"energy",{v:TIEN_CO_MAX-10}); await waitFor(()=>sqOf(A,bench)?.en===TIEN_CO_MAX-10);
    A.fx=[]; await switchRow(A,bench); await sleep(300);
    ok(!A.fx.length&&sqOf(A,bench)?.en===TIEN_CO_MAX-10,"chưa đủ năng lượng: đổi vào không tung tiên cơ");
    // Ra khỏi giao chiến quá TIEN_CO_IDLE_SECS giây thì giảm dần (vừa đánh trúng nên đồng hồ giao chiến bắt đầu từ 0).
    // Dọn hồn thú vừa sinh trước: nó đánh trúng A thì đồng hồ giao chiến về 0, năng lượng không giảm.
    await test(A,"clear"); await test(A,"energy",{v:TIEN_CO_MAX}); await test(A,"rest",{s:TIEN_CO_IDLE_SECS-1}); // hook energy tính như vừa giao chiến
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
  // A quay vào làng (hồn thú bỏ qua người trong vùng an toàn) để hồn thú ở ca sau nhắm đúng C, D vừa ra Bãi tập.
  A.room.send("input",{x:-1,y:0}); ok(await waitFor(()=>inSafe()&&p.x<safe.x+safe.width-24,4000),"A quay vào làng"); A.room.send("input",{x:0,y:0});
  // Mẫn công và phụ trợ: thêm hai tài khoản bot với SSR tương ứng (kèm Lam Ngân Thảo).
  const C=await bot("Tester C","nguyet_nhan",{sex:0,hair:1,hairCol:1,outfitCol:2}), D=await bot("Tester D","thien_can_bach_ngoc_dinh",{sex:1,hair:0,hairCol:4,outfitCol:0});
  for(const b of [C,D]){ await waitFor(()=>b.owned&&b.squad); ok(await leaveSafe(b),`${b.name}: ra khỏi làng`); }
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
    // Từ 2.5d Thiên Càn Bạch Ngọc Đỉnh có tiên cơ riêng (hồi cả đội + khiên) thay cho Hộ Thể chung.
    const v=vOfB(D,ssr), own=TIEN_CO_RIENG[v.vohon], tc={name:own.name,heal:own.self.heal,shield:own.self.shield,shieldSecs:own.self.secs};
    const shield=Math.round(calcStats(vohonIndex(v.vohon),v.level,v.rings.map(tierOfYears)).maxHp*tc.shield);
    ok(r.fx?.he==="phu_tro"&&r.fx.own&&await waitFor(()=>dp.shield===shield,800),`phụ trợ ${tc.name}: khiên ${dp.shield} (cần ${shield})`);
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
  ok(FIVE.every(v=>skillsOf(v).length===4&&skillsOf(v)!==SKILLS&&TIEN_CO_RIENG[v]),"5 võ hồn mẫu có 4 hồn kỹ riêng và tiên cơ riêng");
  {
    // Từ 2.5c Lam Điện Bá Vương Long có hồn kỹ riêng (hồn kỹ chung thử với Tử Vong Chu Hoàng ở dưới): hồn kỹ 2 quanh thân, Cảm điện.
    const ta=A.owned.list.find(v=>v.vohon==="lam_dien_ba_vuong_long").rowId, sk1=skillsOf("lam_dien_ba_vuong_long")[1];
    ok(await leaveSafe(A),"A: ra khỏi làng");
    ok(await switchRow(A,ta),"A: Lam Điện Bá Vương Long ra trận");
    await test(A,"set",{rowId:ta,level:30,xp:0,rings:[10,100,100]}); await test(A,"clear"); await test(A,"ready"); await test(A,"lei",{v:0});
    const bid=await spawnNear(A,2,20); await cast(A,1);
    const want=exp(atkOf(vOfB(A,ta))*sk1.dmg*skillPower(100)), got=dmgsOn(A,bid)[0]?.v;
    ok(want.includes(got)&&hasSt(A.room.state.beasts.get(bid),"shock"),`hồn kỹ riêng ${sk1.name}: sát thương ${got} (cần ${want.join(" hoặc ")}), Cảm điện`);
    ok(A.fxs.some(f=>f.k==="soulring"&&f.i===1&&f.vh===vohonIndex("lam_dien_ba_vuong_long")),"fx soulring kèm vh để client hiện tên hồn kỹ");
    await test(A,"clear");
    A.room.send("input",{x:-1,y:0}); ok(await waitFor(()=>inSafe()&&p.x<safe.x+safe.width-24,4000),"A quay vào làng"); A.room.send("input",{x:0,y:0});
  }
  const E=await bot("Tester E","u_minh_linh_mieu",{sex:0,hair:2,hairCol:2,outfitCol:3});
  await waitFor(()=>E.owned&&E.squad&&meOf(E)); const me=meOf(E);
  for(const vohon of ["hao_thien_chuy","cuu_bao_luu_ly_thap","bich_lan_xa_hoang","tu_vong_chu_hoang"]) await test(E,"grant",{vohon});
  ok(FIVE.every(id=>E.owned.list.some(v=>v.vohon===id)),`E sở hữu 5 võ hồn mẫu (hook grant): ${E.owned.list.map(v=>v.vohon).join(", ")}`);
  const rowE=id=>E.owned.list.find(v=>v.vohon===id).rowId, YRS=[423,764,1760,5000], P=i=>skillPower(YRS[i]), BP=i=>buffPower(YRS[i]);
  const atkE=id=>calcStats(vohonIndex(id),40,YRS.map(tierOfYears)).atk;
  for(const id of [...FIVE,"tu_vong_chu_hoang"]) await test(E,"set",{rowId:rowE(id),level:40,xp:0,rings:YRS});
  ok(await leaveSafe(E),"E: ra khỏi làng");
  {
    // Vùng an toàn (BĐ2): không tung hồn kỹ; sát thương theo thời gian của người đứng trong làng tạm dừng, ra ngoài thì tiếp tục.
    const ry=27.5*16, out=safe.x+safe.width+30, bid=await spawnNear(E,3,40), pc=STATUS.poison.col, ticks=()=>E.dmgs.filter(d=>d.bid===bid&&d.c===pc);
    await test(E,"status",{s:"stun",secs:30}); await test(E,"status",{s:"poison",n:2,secs:30});
    E.dmgs=[]; ok(await waitFor(()=>ticks().length,1500),`Trúng độc ngoài làng: mất ${ticks()[0]?.v} mỗi giây`);
    await goTo(E,safe.x+safe.width-24,ry); ok(inSafeOf(E),"E vào làng");
    E.dmgs=[]; await test(E,"ready"); E.room.send("skill",{i:0}); ok(await lastLog(E,/Vùng an toàn/),"trong làng: không tung hồn kỹ");
    await sleep(2200); ok(!ticks().length,"trong làng: độc do mình gây tạm dừng, không gây sát thương");
    await goTo(E,out,ry); E.dmgs=[]; ok(!inSafeOf(E)&&await waitFor(()=>ticks().length,1500),"ra khỏi làng: độc gây sát thương tiếp");
    await test(E,"clear");
  }
  // Hướng thử: tính lại ở chỗ đứng hiện tại mỗi lần quay mặt (không vướng cây, không ra ngoài bản đồ trong 100 pixel).
  let [ux,uy]=clearDir(me.x,me.y,100); const at=d=>[Math.round(ux*d),Math.round(uy*d)];
  async function face(){ [ux,uy]=clearDir(me.x,me.y,100); await step(E,ux,uy); }
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
    const [vx,vy]=clearDir(me.x,me.y,60); await step(E,vx,vy);
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
    // Từ 3.5 Câm lặng chỉ chặn và ngắt chiêu báo trước: hồn thú kề bên vẫn đánh thường.
    E.hurts=[]; ok(await waitFor(()=>E.hurts.length>0,2500)&&hasSt(beastOf(E,sb),"silence"),"Câm lặng (từ 3.5): hồn thú kề bên vẫn đánh thường");
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
    await test(E,"bhp",{pct:50}); const g1=(await test(E,"regen",{s:5})).gain;
    await test(E,"bhp",{pct:50}); await test(E,"status",{s:"poison",secs:30}); const g2=(await test(E,"regen",{s:5})).gain;
    const w1=Math.floor(TIERS[2].hp*BEAST_REGEN.pct*5);
    ok(g1===w1&&g2===Math.floor(w1*(1-STATUS.poison.healCut)),`hồn thú hồi ${g1} sinh lực trong 5 giây ngoài giao chiến (cần ${w1}); Trúng độc chỉ hồi ${g2}`);
    await test(E,"clear");
  }
  // Tiên cơ riêng của 5 võ hồn (đổi tay vào với năng lượng đầy), và tiên cơ chung khống chế (Tử Vong Chu Hoàng chưa có tiên cơ riêng, tới 2.5d).
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
  // ---------- 2.5b: lưu phái Thiêu đốt (Tà Hỏa Phượng Hoàng, Hỏa Long, Hỏa Ảnh, Kỳ Nhung Thông Thiên Cúc, Nguyệt Nhận) ----------
  {
    const FIRE=["ta_hoa_phuong_hoang","hoa_long","hoa_anh","ky_nhung_thong_thien_cuc","nguyet_nhan"], bc=STATUS.burn.col;
    ok(FIRE.every(v=>skillsOf(v).length===4&&skillsOf(v)!==SKILLS&&TIEN_CO_RIENG[v]),"2.5b: 5 võ hồn Thiêu đốt có 4 hồn kỹ riêng và tiên cơ riêng");
    for(const vohon of FIRE) if(!E.owned.list.some(v=>v.vohon===vohon)) await test(E,"grant",{vohon});
    ok(FIRE.every(id=>E.owned.list.some(v=>v.vohon===id)),"E sở hữu 5 võ hồn Thiêu đốt (hook grant)");
    // Hạ hồn thú thì võ hồn có thể lên cấp (công đổi): đặt lại cấp 40 đầu mỗi phần.
    const reset=async()=>{ for(const id of FIRE) await test(E,"set",{rowId:rowE(id),level:40,xp:0,rings:YRS}); };
    await reset();
    const hitsOn=bid=>dmgsOn(E,bid).filter(d=>d.c!==bc), dist=bid=>{const q=beastOf(E,bid); return q?Math.hypot(q.x-me.x,q.y-me.y):-1;};
    const stOk=(b,list)=>!!b&&(list??[]).every(a=>hasSt(b,a.s)&&(!a.n||(b[a.s]??0)>=a.n));
    const stName=list=>(list??[]).map(a=>STATUS[a.s].name+(a.n?` ${a.n} tầng`:"")).join(", ");
    /** Chẩn đoán khi hồn kỹ không trúng: võ hồn ra trận, chỗ đứng, hồn thú thử, log cuối. */
    const whyMiss=(id,bid)=>{ const q=beastOf(E,bid);
      return `ra trận ${VOHON[me.vh]?.id}${VOHON[me.vh]?.id===id?"":` (cần ${id})`}, E ${me.x.toFixed(0)},${me.y.toFixed(0)}${inSafeOf(E)?" trong làng":""}, hướng ${ux},${uy}, `+
        `hồn thú ${q?`${q.x.toFixed(0)},${q.y.toFixed(0)} cách ${dist(bid).toFixed(0)}`:"không thấy"}, log: ${E.logs.slice(-3).join(" | ")}`; };
    /** Tung hồn kỹ ô i vào một hồn thú mới (bậc `tier`, cách `d` theo hướng thử; `stun`: choáng sẵn để đứng yên): kiểm từng nhát và trạng thái. */
    async function basic(id,i,{tier=4,d=24,stun=true,n=1}={}){
      const sk=skillsOf(id)[i], atk=atkE(id);
      await test(E,"clear"); await face(); const bid=await spawnAt(tier,d); if(stun) await test(E,"status",{s:"stun",secs:10});
      await test(E,"ready"); await cast(E,i,0);
      await waitFor(()=>hitsOn(bid).length>=n&&stOk(beastOf(E,bid),sk.status),n>1?4000:1200);
      // Nhát đầu đúng công thức; các nhát sau có thể mạnh hơn vì Phá giáp cộng dồn từ nhát trước.
      const want=exp(atk*P(i)*sk.dmg), got=hitsOn(bid).map(x=>x.v);
      ok(got.length>=n&&want.includes(got[0]),`${sk.name}: ${got.length} nhát ${got.join("/")} (nhát đầu cần ${want.join(" hoặc ")})`+(got.length?"":` [${whyMiss(id,bid)}]`));
      if(sk.status) ok(stOk(beastOf(E,bid),sk.status),`${sk.name}: gây ${stName(sk.status)}`);
      return bid;
    }
    // Tà Hỏa Phượng Hoàng: thiêu đốt diện rộng, bay (chỉ hiệu ứng), lãnh vực phượng hoàng +30% sát thương nhận.
    {
      const id="ta_hoa_phuong_hoang", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id,["hoa_long"]),`E: ${vname(id)} ra trận`);
      await basic(id,0); await basic(id,1);
      const x0=me.x, y0=me.y; await basic(id,2,{d:40});
      ok(Math.hypot(me.x-x0,me.y-y0)>=50&&E.fxs.some(f=>f.k==="fly"&&f.id===E.room.sessionId),`${sk[2].name}: bay ${Math.hypot(me.x-x0,me.y-y0).toFixed(0)} pixel qua hồn thú (fx fly)`);
      const fb=await basic(id,3);
      ok(await waitFor(()=>hasBuff(me,"phoenix")&&hasBuff(B.room.state.players.get(E.room.sessionId),"phoenix"),500),`${sk[3].name}: mở lãnh vực (người khác cũng thấy)`);
      const amp=sk[3].self.buff.phoenix*BP(3);
      await test(E,"ready"); await cast(E,0); let want=exp(atk*P(0)*sk[0].dmg*(1+amp));
      ok(want.includes(hitsOn(fb)[0]?.v),`trong lãnh vực: ${sk[0].name} ${hitsOn(fb)[0]?.v} (cần ${want.join(" hoặc ")}, +${Math.round(amp*100)}%)`+(hitsOn(fb).length?"":` [${whyMiss(id,fb)}]`));
      // Đổi sang Hỏa Long: lãnh vực thuộc hồn sư nên vẫn còn; hồn thú ngoài bán kính không bị tăng sát thương.
      await test(E,"energy",{v:0}); ok(await switchRow(E,rowE("hoa_long"))&&hasBuff(me,"phoenix"),"đổi sang Hỏa Long: lãnh vực vẫn còn");
      const hl=skillsOf("hoa_long"), ah=atkE("hoa_long");
      await test(E,"clear"); const far=await spawnAt(4,PHOENIX_FIELD_R+30); await test(E,"status",{s:"stun",secs:10});
      await test(E,"ready"); await cast(E,1); want=exp(ah*P(1)*hl[1].dmg);
      ok(want.includes(hitsOn(far)[0]?.v),`ngoài lãnh vực (cách ${dist(far).toFixed(0)}): ${hl[1].name} ${hitsOn(far)[0]?.v} (cần ${want.join(" hoặc ")})`);
      const nb=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10});
      await test(E,"ready"); await cast(E,1); want=exp(ah*P(1)*hl[1].dmg*(1+amp));
      ok(want.includes(hitsOn(nb)[0]?.v),`trong lãnh vực: ${hl[1].name} của Hỏa Long ${hitsOn(nb)[0]?.v} (cần ${want.join(" hoặc ")})`);
      await test(E,"clear");
    }
    await reset();
    // Hỏa Long: tầm xa phạm vi rộng, Viêm bạo kích nổ toàn bộ tầng Thiêu đốt rồi đặt lại 1 tầng.
    {
      const id="hoa_long", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id,["ta_hoa_phuong_hoang"])&&!hasBuff(me,"phoenix"),`E: ${vname(id)} ra trận (lãnh vực đã hết)`);
      await basic(id,0); await basic(id,1,{d:110}); await basic(id,2);
      const nb=await basic(id,3); ok(await waitFor(()=>beastOf(E,nb)?.burn===sk[3].boom.keep,500),`${sk[3].name} khi chưa có Thiêu đốt: đặt ${beastOf(E,nb)?.burn} tầng`);
      await test(E,"clear"); await face(); const bid=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10});
      await test(E,"status",{s:"burn",n:4}); const b=beastOf(E,bid); await waitFor(()=>b?.burn===4,500);
      await test(E,"ready"); await cast(E,3,300);
      const boom=dmgsOn(E,bid).find(x=>x.c===bc&&x.v>atk)?.v, lo=Math.round(atk*STATUS.burn.dot*4*(STATUS.burn.secs-1)*STATUS.burn.boom), hi=Math.round(atk*STATUS.burn.dot*4*STATUS.burn.secs*STATUS.burn.boom);
      ok(boom>=lo&&boom<=hi&&b?.burn===sk[3].boom.keep,`Viêm bạo: kích nổ 4 tầng ${boom} (khoảng ${lo}–${hi}), còn ${b?.burn} tầng đặt lại`);
      // Combo lưu phái: Tà Hỏa Phượng Hoàng cộng dồn Thiêu đốt, đổi tay vào Hỏa Long đầy năng lượng: tiên cơ Viêm bạo.
      await lineup("ta_hoa_phuong_hoang"); // đội mới vẫn có võ hồn đang ra trận thì nó giữ nguyên ra trận
      ok(await lineup("ta_hoa_phuong_hoang",[id]),"E: Tà Hỏa Phượng Hoàng ra trận, Hỏa Long chờ");
      await face(); const cb=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10});
      await test(E,"ready"); await cast(E,1); await test(E,"ready"); await cast(E,1); const c=beastOf(E,cb);
      ok(c?.burn===4,`Dục Hỏa Phượng Hoàng 2 lần: Thiêu đốt cộng dồn ${c?.burn} tầng`);
      await waitFor(()=>me.swCd===0,3500); await test(E,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sqOf(E,rowE(id))?.en===TIEN_CO_MAX);
      E.dmgs=[]; E.room.send("switch",{slot:E.owned.team.indexOf(rowE(id))});
      const lo2=Math.round(atkE("ta_hoa_phuong_hoang")*P(1)*STATUS.burn.dot*4*(STATUS.burn.secs-1.5)*STATUS.burn.boom);
      ok(await waitFor(()=>dmgsOn(E,cb).some(x=>x.c===bc&&x.v>=lo2)&&c?.burn===1,1500)&&await lastLog(E,new RegExp(TIEN_CO_RIENG[id].name)),
        `tiên cơ ${TIEN_CO_RIENG[id].name}: kích nổ ${Math.max(0,...dmgsOn(E,cb).filter(x=>x.c===bc).map(x=>x.v))} (≥ ${lo2}), đặt lại ${c?.burn} tầng`);
      await test(E,"clear");
    }
    await reset();
    // Hỏa Ảnh: đẩy lùi, choáng, Dễ thương cho đồng đội, thiêu đốt.
    {
      const id="hoa_anh", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await test(E,"clear"); await face(); const pb=await spawnAt(3,20); await test(E,"ready"); const d0=dist(pb); await cast(E,0,120);
      ok(dist(pb)>=d0+sk[0].push*CC_TIER_MULT[3]*0.7&&exp(atk*P(0)*sk[0].dmg).includes(hitsOn(pb)[0]?.v)&&hasSt(beastOf(E,pb),"burn"),
        `${sk[0].name}: đẩy lùi ${d0.toFixed(0)} -> ${dist(pb).toFixed(0)} pixel, sát thương ${hitsOn(pb)[0]?.v}, Thiêu đốt`);
      await basic(id,1,{stun:false});
      const vb=await basic(id,2); await test(E,"ready"); await cast(E,0); const w=exp(atk*P(0)*sk[0].dmg*(1+STATUS.vuln.amp));
      ok(w.includes(hitsOn(vb)[0]?.v),`Dễ thương: ${sk[0].name} sau đó ${hitsOn(vb)[0]?.v} (cần ${w.join(" hoặc ")})`);
      await basic(id,3,{stun:false});
      await test(E,"clear");
    }
    await reset();
    // Kỳ Nhung Thông Thiên Cúc: cánh hoa nhiều nhát liên tục quanh thân, Phá giáp, Trói.
    {
      const id="ky_nhung_thong_thien_cuc", sk=skillsOf(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await basic(id,0);
      const b1=await basic(id,1,{n:sk[1].n}); ok(await waitFor(()=>beastOf(E,b1)?.burn===STATUS.burn.max,500),`${sk[1].name}: Thiêu đốt cộng dồn ${beastOf(E,b1)?.burn} tầng`);
      await basic(id,2,{stun:false});
      // 8 nhát: Phá giáp tăng dần nên chỉ kiểm số nhát, tầng tối đa và Trói ở nhát cuối.
      await test(E,"clear"); await face(); const b3=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10}); await test(E,"ready"); await cast(E,3,0);
      ok(await waitFor(()=>hitsOn(b3).length>=sk[3].n&&hasSt(beastOf(E,b3),"root"),4000)&&beastOf(E,b3)?.burn===STATUS.burn.max&&beastOf(E,b3)?.armor===STATUS.armor.max,
        `${sk[3].name}: ${hitsOn(b3).length}/${sk[3].n} nhát, Thiêu đốt ${beastOf(E,b3)?.burn}, Phá giáp ${beastOf(E,b3)?.armor}, nhát cuối Trói`);
      await test(E,"clear");
    }
    await reset();
    // Nguyệt Nhận: lướt xuyên hàng, khóa hồn thú yếu máu nhất (không phải gần nhất), càng ít máu càng đau.
    {
      const id="nguyet_nhan", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await basic(id,0,{d:40}); await basic(id,2);
      // Hồn thú 10 vạn năm để còn sống qua các nhát (chí mạng có thể hạ sớm ở nhát cuối).
      for(const [i,dd,pct] of [[1,70,20],[3,90,50]]){
        await test(E,"clear"); await face(); const far=await spawnAt(4,dd); await test(E,"bhp",{pct}); await test(E,"status",{s:"stun",secs:10});
        const near=await spawnAt(4,22); await test(E,"status",{s:"stun",secs:10}); await test(E,"ready"); await cast(E,i,0);
        ok(await waitFor(()=>hitsOn(far).length>=sk[i].n||(hitsOn(far).length&&!beastOf(E,far)),1500)&&!hitsOn(near).length,`${sk[i].name}: khóa hồn thú yếu máu cách ${dd} (${hitsOn(far).length} nhát), bỏ qua hồn thú gần đủ máu`);
        const w=exp(atk*P(i)*sk[i].dmg*(1+sk[i].lowHp*(1-pct/100)));
        ok(w.includes(hitsOn(far)[0]?.v),`${sk[i].name}: mục tiêu còn ${pct}% sinh lực, nhát đầu ${hitsOn(far)[0]?.v} (cần ${w.join(" hoặc ")}, +${Math.round(sk[i].lowHp*(100-pct))}%)`);
      }
      await test(E,"clear");
    }
    await reset();
    // Tiên cơ riêng của 5 võ hồn Thiêu đốt.
    await test(E,"rest",{s:15});
    for(const [k,id] of FIRE.entries()){
      const own=TIEN_CO_RIENG[id], other=FIRE[(k+1)%FIRE.length], atk=atkE(id);
      await lineup(other,[id]); await face(); E.fxs=[];
      const r=await tienCo(E,rowE(id),{tier:4,dx:at(own.dash?70:20)[0],dy:at(own.dash?70:20)[1]});
      ok(r.fx?.own&&r.fx.vh===vohonIndex(id)&&await lastLog(E,new RegExp(own.name)),`tiên cơ riêng ${vname(id)}: ${own.name}`);
      const w=exp(atk*own.dmg), first=hitsOn(r.bid)[0]?.v, b=beastOf(E,r.bid);
      ok(w.includes(first),`${own.name}: sát thương ${first} (cần ${w.join(" hoặc ")})`);
      if(own.status) ok(await waitFor(()=>stOk(b,own.status),800),`${own.name}: gây ${stName(own.status)}`);
      if(own.boom) ok(await waitFor(()=>b?.burn===own.boom.keep,800),`${own.name}: đặt lại ${b?.burn} tầng Thiêu đốt`);
      if((own.n??1)>1) ok(await waitFor(()=>hitsOn(r.bid).length>=own.n,2500),`${own.name}: ${hitsOn(r.bid).length}/${own.n} nhát`);
      if(own.finisher) ok(await waitFor(()=>stOk(b,own.finisher),2500),`${own.name}: nhát cuối ${stName(own.finisher)}`);
      if(own.self?.buff?.phoenix) ok(await waitFor(()=>hasBuff(me,"phoenix"),500)&&E.fxs.some(f=>f.k==="fly"),`${own.name}: bay và mở lãnh vực phượng hoàng`);
      await test(E,"clear"); await test(E,"rest",{s:15}); await reset();
    }
  }
  // ---------- 2.5c: lưu phái Cảm điện (Lam Điện Bá Vương Long, Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa, Yêu Hồ, Xúc Xích) ----------
  {
    const ELEC=["lam_dien_ba_vuong_long","kim_vu_mieu_ung","can_khon_hon_nguyen_toa","yeu_ho","xuc_xich"], sc=STATUS.shock.col, LD="lam_dien_ba_vuong_long";
    ok(ELEC.every(v=>skillsOf(v).length===4&&skillsOf(v)!==SKILLS&&TIEN_CO_RIENG[v]),"2.5c: 5 võ hồn Cảm điện có 4 hồn kỹ riêng và tiên cơ riêng");
    for(const vohon of ELEC) if(!E.owned.list.some(v=>v.vohon===vohon)) await test(E,"grant",{vohon});
    ok(ELEC.every(id=>E.owned.list.some(v=>v.vohon===id)),"E sở hữu 5 võ hồn Cảm điện (hook grant)");
    // Đặt lại cấp 40 (hạ hồn thú có thể lên cấp, công đổi) và Phong Lôi Chi Lực về 0 (đầy thì Lôi Động Minh Thiên tự tung, lẫn vào số đo).
    const reset=async()=>{ for(const id of ELEC) await test(E,"set",{rowId:rowE(id),level:40,xp:0,rings:YRS}); await test(E,"lei",{v:0}); };
    await reset();
    const hitsOn=bid=>dmgsOn(E,bid).filter(d=>d.c!==sc), chainOn=bid=>dmgsOn(E,bid).filter(d=>d.c===sc);
    const dist=bid=>{const q=beastOf(E,bid); return q?Math.hypot(q.x-me.x,q.y-me.y):-1;}, posOf=bid=>{const q=beastOf(E,bid); return q?[q.x,q.y]:[0,0];};
    const stacksOf=(b,s)=>s==="allure"?b.allure:s==="lock"?b.lock:b[s];
    // Trạng thái cộng dồn đủ tầng thì bùng phát (Mị hoặc -> Mê hoặc, Phong ấn -> Dễ thương): kiểm trạng thái sau khi bùng phát.
    const after=list=>(list??[]).map(a=>STATUS[a.s].burst&&(a.n??1)>=STATUS[a.s].max?{s:STATUS[a.s].burst.s}:a);
    const stOk=(b,list)=>!!b&&after(list).every(a=>hasSt(b,a.s)&&(!a.n||(stacksOf(b,a.s)??0)>=a.n));
    const stName=list=>after(list).map(a=>STATUS[a.s].name+(a.n?` ${a.n} tầng`:"")).join(", ");
    /** Tung hồn kỹ ô i vào một hồn thú mới (bậc `tier`, cách `d` theo hướng thử; `stun`: choáng sẵn để đứng yên): kiểm nhát đầu và trạng thái. */
    async function basic(id,i,{tier=4,d=24,stun=true,n=1,st=true}={}){
      const sk=skillsOf(id)[i], atk=atkE(id);
      await test(E,"clear"); await face(); const bid=await spawnAt(tier,d); if(stun) await test(E,"status",{s:"stun",secs:10});
      await test(E,"lei",{v:0}); await test(E,"ready"); await cast(E,i,0);
      await waitFor(()=>hitsOn(bid).length>=n&&(!st||stOk(beastOf(E,bid),sk.status)),n>1?4500:1200);
      const want=exp(atk*P(i)*sk.dmg), got=hitsOn(bid).map(x=>x.v);
      ok(got.length>=n&&want.includes(got[0]),`${sk.name}: ${got.length} nhát ${got.join("/")} (nhát đầu cần ${want.join(" hoặc ")})`);
      if(st&&sk.status) ok(stOk(beastOf(E,bid),sk.status),`${sk.name}: gây ${stName(sk.status)}`);
      return bid;
    }
    // Lam Điện Bá Vương Long: Cảm điện diện rộng, lan Cảm điện, thêm sát thương lên hồn thú Cảm điện, Phong Lôi Chi Lực.
    {
      const id=LD, sk=skillsOf(id), atk=atkE(id), G=PHONG_LOI.gain, M=PHONG_LOI.shockMult;
      ok(await lineup(id,["kim_vu_mieu_ung"]),`E: ${vname(id)} ra trận`);
      const b0=await basic(id,0);
      ok(await waitFor(()=>me.lei===G.skill,500),`${PHONG_LOI.name}: hồn kỹ trúng hồn thú chưa Cảm điện +${me.lei} (cần ${G.skill})`);
      await test(E,"ready"); await cast(E,0);
      ok(hitsOn(b0).length===1&&await waitFor(()=>me.lei===G.skill*(1+M),500),`hồn kỹ trúng hồn thú đang Cảm điện: ×${M}, ${PHONG_LOI.name} ${me.lei} (cần ${G.skill*(1+M)})`);
      await test(E,"lei",{v:0}); await sleep(450); E.dmgs=[]; E.room.send("attack"); await waitFor(()=>hitsOn(b0).length,800);
      ok(hitsOn(b0).length===1&&await waitFor(()=>me.lei===G.attack*M,500),`đòn thường trúng hồn thú Cảm điện: ${PHONG_LOI.name} ${me.lei} (cần ${G.attack*M})`);
      await basic(id,1);
      // Lan Cảm điện: 3 tia sét vào mục tiêu gần nhất, mỗi tia lan 40% sang hồn thú Cảm điện gần đó; hồn thú xa hơn chainR không bị lan.
      await test(E,"clear"); await face(); const c1=await spawnAt(4,20), c2=await spawnAt(4,56), c3=await spawnAt(4,100);
      await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"status",{s:"shock",secs:10,all:true});
      ok([c1,c2,c3].every(c=>hasSt(beastOf(E,c),"shock")),"3 hồn thú Cảm điện (hook)");
      await test(E,"lei",{v:0}); await test(E,"ready"); await cast(E,2,0);
      await waitFor(()=>hitsOn(c1).length>=sk[2].n&&chainOn(c2).length>=sk[2].n,1500);
      const h=hitsOn(c1).map(x=>x.v), ch=chainOn(c2).map(x=>x.v), w0=exp(atk*P(2)*sk[2].dmg);
      ok(h.length===sk[2].n&&w0.includes(h[0]),`${sk[2].name}: ${h.length} tia ${h.join("/")} vào mục tiêu gần nhất (tia đầu cần ${w0.join(" hoặc ")})`);
      ok(ch.length===h.length&&ch.every((v,k)=>v===Math.max(1,Math.round(h[k]*STATUS.shock.chain)))&&!hitsOn(c2).length,
        `lan Cảm điện mỗi tia: ${ch.join("/")} sang hồn thú cách ${Math.hypot(posOf(c1)[0]-posOf(c2)[0],posOf(c1)[1]-posOf(c2)[1]).toFixed(0)} pixel (cần ${h.map(v=>Math.round(v*STATUS.shock.chain)).join("/")})`);
      ok(!dmgsOn(E,c3).length,`hồn thú Cảm điện cách xa hơn ${STATUS.shock.chainR} pixel không bị lan`);
      // Long Hống: hồn thú đang Cảm điện chịu thêm 120% công.
      await test(E,"clear"); await face(); const lb=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10}); await test(E,"status",{s:"shock"});
      await test(E,"lei",{v:0}); await test(E,"ready"); await cast(E,3);
      let want=exp(atk*P(3)*(sk[3].dmg+sk[3].perStack.dmg));
      ok(want.includes(hitsOn(lb)[0]?.v),`${sk[3].name} lên hồn thú Cảm điện: ${hitsOn(lb)[0]?.v} (cần ${want.join(" hoặc ")})`);
      // Phong Lôi Chi Lực đầy: tự tung Lôi Động Minh Thiên (Choáng = ngắt chiêu), về 0. Hồn thú Trói sẵn (không Choáng) để thấy Choáng mới.
      await test(E,"clear"); await face(); const lm=await spawnAt(4,24); await test(E,"status",{s:"root",secs:10}); await test(E,"status",{s:"shock",secs:10});
      await test(E,"lei",{v:PHONG_LOI.max-G.skill*M}); await test(E,"ready"); E.dmgs=[]; E.fxs=[]; E.room.send("skill",{i:1});
      const fired=await waitFor(()=>E.fxs.some(f=>f.k==="bolt"&&f.id===E.room.sessionId)&&hitsOn(lm).length>=2,1500);
      const ls=PHONG_LOI.skill, pw=skillPower(Math.max(...YRS)); want=exp(atk*pw*(ls.dmg+ls.perStack.dmg));
      ok(fired&&await lastLog(E,new RegExp(ls.name))&&await waitFor(()=>me.lei===0,500),`${PHONG_LOI.name} đầy sau hồn kỹ trúng hồn thú Cảm điện: tự tung ${ls.name}, thanh về ${me.lei}`);
      ok(want.includes(hitsOn(lm)[1]?.v),`${ls.name}: sát thương ${hitsOn(lm)[1]?.v} (cần ${want.join(" hoặc ")}, sức mạnh ×${pw} theo hồn hoàn ${Math.max(...YRS)} năm)`);
      ok(await waitFor(()=>hasSt(beastOf(E,lm),"stun"),400),`${ls.name}: Choáng (ngắt chiêu)`);
      // Ngoài giao chiến thì giảm dần; Lam Điện gục thì mất hết.
      await test(E,"clear"); await test(E,"lei",{v:50});
      ok(await waitFor(()=>B.room.state.players.get(E.room.sessionId)?.lei===50,500),"người khác thấy thanh Phong Lôi Chi Lực (state công khai)");
      await test(E,"rest",{s:TIEN_CO_IDLE_SECS+2});
      ok(me.lei>=50-2*PHONG_LOI.decay-6&&me.lei<=50-2*PHONG_LOI.decay,`ngoài giao chiến ${TIEN_CO_IDLE_SECS+2} giây: ${PHONG_LOI.name} 50 -> ${me.lei}`);
      await test(E,"lei",{v:60}); await test(E,"down"); ok(await waitFor(()=>me.lei===0&&E.owned.active!==rowE(id)),`${vname(id)} gục: mất ${PHONG_LOI.name}`);
      await test(E,"rest",{s:REVIVE_SECS+1}); await test(E,"clear");
    }
    await reset();
    // Kim Vũ Miêu Ưng: vuốt sét Cảm điện, tê liệt (co giật không đi + Câm lặng không đánh), bay, áo nghĩa phủ Cảm điện toàn vùng.
    {
      const id="kim_vu_mieu_ung", sk=skillsOf(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await basic(id,0,{n:sk[0].n});
      // Tê liệt trên hồn thú vạn năm (khống chế × 0,75): không đi, không đánh; hết co giật trước, Câm lặng còn lâu hơn.
      const tb=await basic(id,1,{tier:3,d:40,stun:false}), t0=posOf(tb); E.hurts=[]; await sleep(1500);
      ok(beastOf(E,tb)&&same(posOf(tb),t0)&&!E.hurts.length&&hasSt(beastOf(E,tb),"root")&&hasSt(beastOf(E,tb),"silence"),"tê liệt: hồn thú kề bên đứng yên, không đánh");
      await sleep(3*CC_TIER_MULT[3]*1000-1500+500);
      ok(!hasSt(beastOf(E,tb),"root")&&hasSt(beastOf(E,tb),"silence"),`hết co giật sau ${3*CC_TIER_MULT[3]} giây, Câm lặng còn (${5*CC_TIER_MULT[3]} giây)`);
      const x0=me.x, y0=me.y; await basic(id,2,{d:40});
      ok(Math.hypot(me.x-x0,me.y-y0)>=50&&E.fxs.some(f=>f.k==="fly"&&f.id===E.room.sessionId),`${sk[2].name}: bay ${Math.hypot(me.x-x0,me.y-y0).toFixed(0)} pixel qua hồn thú (fx fly)`);
      // Áo nghĩa: mọi hồn thú trong 160 pixel Cảm điện 8 giây (lâu hơn mặc định 6 giây).
      await test(E,"clear"); await face(); const a1=await spawnAt(4,24), a2=await spawnAt(4,90), a3=await spawnAt(4,-70);
      await test(E,"status",{s:"stun",secs:12,all:true}); await test(E,"ready"); await cast(E,3,300);
      ok([a1,a2,a3].every(a=>hasSt(beastOf(E,a),"shock"))&&exp(atkE(id)*P(3)*sk[3].dmg).includes(hitsOn(a2)[0]?.v),`${sk[3].name}: phủ Cảm điện 3 hồn thú (cách ${[a1,a2,a3].map(a=>dist(a).toFixed(0)).join("/")}), sát thương ${hitsOn(a2)[0]?.v}`);
      await sleep((STATUS.shock.secs+0.6)*1000);
      ok([a1,a2,a3].every(a=>hasSt(beastOf(E,a),"shock")),`sau ${STATUS.shock.secs+0.6} giây vẫn Cảm điện (8 giây)`);
      // Combo lưu phái: phủ Cảm điện rồi đổi tay vào Lam Điện Bá Vương Long đầy năng lượng: tiên cơ kích nổ Cảm điện, lan sang hồn thú bên cạnh.
      await lineup(id,[LD]); await face(); const k1=await spawnAt(4,24), k2=await spawnAt(4,60);
      await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"ready"); await cast(E,3,300);
      ok(hasSt(beastOf(E,k1),"shock")&&hasSt(beastOf(E,k2),"shock"),"Kim Ưng Lôi Vực phủ Cảm điện 2 hồn thú");
      await waitFor(()=>me.swCd===0,3500); await test(E,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sqOf(E,rowE(LD))?.en===TIEN_CO_MAX);
      E.dmgs=[]; E.room.send("switch",{slot:E.owned.team.indexOf(rowE(LD))});
      const own=TIEN_CO_RIENG[LD], w=exp(atkE(LD)*(own.dmg+own.perStack.dmg));
      ok(await waitFor(()=>hitsOn(k1).length&&chainOn(k2).length,1500)&&w.includes(hitsOn(k1)[0]?.v)&&await lastLog(E,new RegExp(own.name)),
        `combo: đổi tay vào ${vname(LD)}, ${own.name} lên hồn thú Cảm điện ${hitsOn(k1)[0]?.v} (cần ${w.join(" hoặc ")}), lan ${chainOn(k2).map(x=>x.v).join("/")}`);
      await test(E,"clear");
    }
    await reset();
    // Càn Khôn Hỗn Nguyên Tỏa: Phong ấn cộng dồn thành Dễ thương 6,8 giây, vùng phong tỏa cố định (bay tới), gom quái.
    {
      const id="can_khon_hon_nguyen_toa", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      const l0=await basic(id,0); ok(beastOf(E,l0)?.lock===1,`${sk[0].name}: Phong ấn ${beastOf(E,l0)?.lock} tầng`);
      await test(E,"status",{s:"lock",n:STATUS.lock.max-2}); ok(beastOf(E,l0)?.lock===STATUS.lock.max-1&&!hasSt(beastOf(E,l0),"vuln"),`Phong ấn ${STATUS.lock.max-1} tầng: chưa Dễ thương`);
      await test(E,"status",{s:"lock"}); const vt=Date.now();
      ok(!hasSt(beastOf(E,l0),"lock")&&hasSt(beastOf(E,l0),"vuln"),`đủ ${STATUS.lock.max} tầng Phong ấn: bùng phát thành Dễ thương, xóa Phong ấn`);
      await test(E,"ready"); E.dmgs=[]; await cast(E,0); const wv=exp(atk*P(0)*sk[0].dmg*(1+STATUS.vuln.amp));
      ok(wv.includes(hitsOn(l0)[0]?.v),`Dễ thương: ${sk[0].name} ${hitsOn(l0)[0]?.v} (cần ${wv.join(" hoặc ")})`);
      await sleep(Math.max(0,(STATUS.vuln.secs+0.8)*1000-(Date.now()-vt)));
      ok(hasSt(beastOf(E,l0),"vuln"),`Dễ thương từ Phong ấn còn sau ${STATUS.vuln.secs+0.8} giây (mặc định ${STATUS.vuln.secs})`);
      await sleep(Math.max(0,(STATUS.lock.burst.secs+0.6)*1000-(Date.now()-vt)));
      ok(!hasSt(beastOf(E,l0),"vuln"),`hết Dễ thương sau ${STATUS.lock.burst.secs} giây`);
      // Vùng phong tỏa: bay tới hồn thú cách 90, vùng cố định ở chỗ đặt; hồn sư lùi ra xa vùng vẫn đánh đủ nhát.
      for(const [i,zd] of [[1,100],[3,115]]){
        // Hướng thử phải trống hết quãng tới hồn thú (face() chỉ kiểm 100 pixel).
        await test(E,"clear"); [ux,uy]=clearDir(me.x,me.y,zd+20); await step(E,ux,uy); const zb=await spawnAt(4,zd); await test(E,"status",{s:"stun",secs:10});
        // Hồn thú hoang lang thang vào gần thì có thể thành mục tiêu thay cho con vừa sinh: ghi lại để chẩn đoán.
        const others=()=>[...E.room.state.beasts.entries()].filter(([k,o])=>k!==zb&&Math.hypot(o.x-me.x,o.y-me.y)<160).map(([,o])=>`${Math.hypot(o.x-me.x,o.y-me.y).toFixed(0)}`);
        await test(E,"ready"); const d0=dist(zb), o0=others(); await cast(E,i,150); const d1=dist(zb);
        ok(d1<d0-40&&E.fxs.some(f=>f.k==="zone"&&Math.abs(f.r-sk[i].r)<1),`${sk[i].name}: bay tới (cách ${d0.toFixed(0)} -> ${d1.toFixed(0)}), đặt vùng phong tỏa`+
          (d1<d0-40?"":` [hướng ${ux},${uy}, hồn thú khác gần: ${o0.join("/")||"không"}]`));
        // Lùi theo đường vừa bay (không vướng cây) tới khi ra ngoài bán kính vùng.
        E.room.send("input",{x:-ux,y:-uy}); await waitFor(()=>dist(zb)>sk[i].r+8,2500); E.room.send("input",{x:0,y:0});
        const away=dist(zb);
        await waitFor(()=>hitsOn(zb).length>=sk[i].n,(sk[i].n*sk[i].every+1)*1000);
        const hs=hitsOn(zb).map(x=>x.v), w1=exp(atk*P(i)*sk[i].dmg), b=beastOf(E,zb);
        ok(away>sk[i].r&&hs.length===sk[i].n&&w1.includes(hs[0]),`vùng cố định: hồn sư cách ${away.toFixed(0)} (> ${sk[i].r}) vẫn ${hs.length}/${sk[i].n} nhát ${hs.join("/")} (nhát đầu cần ${w1.join(" hoặc ")})`+
          (away>sk[i].r?"":` [đứng ${me.x.toFixed(0)},${me.y.toFixed(0)}, hướng lùi ${-ux},${-uy}]`));
        ok(hasSt(b,"vuln")&&(b?.lock??9)<STATUS.lock.max&&(!sk[i].status.some(a=>a.s==="shock")||hasSt(b,"shock")),`${sk[i].name}: Phong ấn cộng dồn thành Dễ thương (còn ${b?.lock} tầng)`+(sk[i].status.some(a=>a.s==="shock")?", Cảm điện":""));
      }
      // Càn Khôn Đảo Chuyển: kéo hai hồn thú về sát thân, Phong ấn, Cảm điện (gom lại để lan Cảm điện).
      await test(E,"clear"); await face(); const g1=await spawnAt(3,60), g2=await spawnAt(3,74);
      await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"ready"); await cast(E,2,300);
      ok([g1,g2].every(g=>dist(g)>=0&&dist(g)<TIERS[3].size/2+16&&hasSt(beastOf(E,g),"shock")&&beastOf(E,g).lock===1),`${sk[2].name}: kéo 2 hồn thú về cách ${dist(g1).toFixed(0)} / ${dist(g2).toFixed(0)} pixel, Phong ấn, Cảm điện`);
      await test(E,"clear");
    }
    await reset();
    // Yêu Hồ: Mị hoặc cộng dồn thành Mê hoặc (đi lung tung, không đánh), làm chậm, ảo ảnh tàng hình, lãnh vực cố định.
    {
      const id="yeu_ho", sk=skillsOf(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      const m0=await basic(id,0); ok(beastOf(E,m0)?.allure===1,`${sk[0].name}: Mị hoặc ${beastOf(E,m0)?.allure} tầng`);
      const m3=await basic(id,3,{st:false}); const b3=beastOf(E,m3);
      ok(await waitFor(()=>b3?.allure===2&&hasSt(b3,"silence")&&hasSt(b3,"shock"),500),`${sk[3].name}: Mị hoặc ${b3?.allure} tầng, Câm lặng (ngắt chiêu), Cảm điện`);
      await test(E,"ready"); await cast(E,0);
      ok(hasSt(beastOf(E,m3),"charm")&&!hasSt(beastOf(E,m3),"allure"),"Mị hoặc đủ 3 tầng: Mê hoặc, xóa Mị hoặc");
      // Mê hoặc trên hồn thú vạn năm đang đánh hồn sư: bỏ mục tiêu, đi lung tung, không đánh; đang Mê hoặc không cộng thêm Mị hoặc.
      await test(E,"clear"); await face(); const cb=await spawnAt(3,16); await waitFor(()=>beastOf(E,cb)?.aggro,1500);
      await test(E,"status",{s:"allure",n:3}); const p0=posOf(cb); E.hurts=[];
      await test(E,"status",{s:"allure"});
      ok(hasSt(beastOf(E,cb),"charm")&&!beastOf(E,cb)?.allure,"đang Mê hoặc: không cộng thêm Mị hoặc");
      await sleep(1300); const p1=posOf(cb);
      ok(beastOf(E,cb)&&!beastOf(E,cb).aggro&&!E.hurts.length&&Math.hypot(p1[0]-p0[0],p1[1]-p0[1])>4,`Mê hoặc: bỏ mục tiêu, không đánh, đi lung tung ${Math.hypot(p1[0]-p0[0],p1[1]-p0[1]).toFixed(0)} pixel`);
      ok(await waitFor(()=>!hasSt(beastOf(E,cb),"charm"),STATUS.charm.secs*CC_TIER_MULT[3]*1000),`hết Mê hoặc sau ${STATUS.charm.secs*CC_TIER_MULT[3]} giây`);
      // Làm chậm: hồn thú đuổi theo hồn sư đi chậm hơn (đo quãng đi trong 0,6 giây).
      const run=async slow=>{ await test(E,"clear"); await face(); const sb=await spawnAt(1,60); if(slow) await test(E,"status",{s:"slow",secs:5});
        await sleep(150); const q0=posOf(sb); await sleep(600); const q1=posOf(sb); return Math.hypot(q1[0]-q0[0],q1[1]-q0[1]); };
      const v0=await run(false), v1=await run(true);
      ok(v0>8&&v1<v0*(1-STATUS.slow.slow/2)&&v1>v0*(1-STATUS.slow.slow)*0.6,`Làm chậm: hồn thú đi ${v1.toFixed(1)} pixel thay vì ${v0.toFixed(1)} (−${STATUS.slow.slow*100}%)`);
      // Ảo ảnh tàng hình: hồn thú đang đuổi mất dấu; đánh thường thì hiện hình.
      // Hồn thú vạn năm (chủ động đuổi, đủ máu để chí mạng không hạ ngay).
      await reset(); await test(E,"clear"); await face(); const hb=await spawnAt(3,30); await waitFor(()=>beastOf(E,hb)?.aggro,1500);
      await test(E,"ready"); await cast(E,1,0);
      ok(await waitFor(()=>hasBuff(me,"hide")&&hasBuff(B.room.state.players.get(E.room.sessionId),"hide")&&beastOf(E,hb)?.allure===1,800),`${sk[1].name}: tàng hình (người khác thấy), ảo ảnh Mị hoặc 1 tầng`+
        (hasBuff(me,"hide")&&beastOf(E,hb)?"":` (tàng hình ${hasBuff(me,"hide")}, võ hồn ${VOHON[me.vh].id}, sinh lực ${me.hp}/${me.maxHp}, hồn thú ${beastOf(E,hb)?`cách ${dist(hb).toFixed(0)}, Mị hoặc ${beastOf(E,hb).allure}`:"không còn"}, log ${E.logs.slice(-2).join(" | ")})`));
      ok(await waitFor(()=>beastOf(E,hb)&&!beastOf(E,hb).aggro,800),"tàng hình: hồn thú bỏ mục tiêu"+(beastOf(E,hb)?.aggro?` (vẫn đuổi, cách ${dist(hb).toFixed(0)})`:""));
      await sleep(450); E.room.send("attack"); ok(await waitFor(()=>!hasBuff(me,"hide"),600),"đánh thường: hiện hình");
      // Lãnh vực đặt xuống đất: cố định chỗ tung, Làm chậm mỗi nhát, nhát cuối Mị hoặc.
      // Hồn thú đứng sau lưng; hồn sư đi tới trước (đường đã kiểm không vướng cây) ra ngoài bán kính, lãnh vực vẫn ở chỗ cũ.
      await test(E,"clear"); await face(); const fb=await spawnAt(4,-30); await test(E,"status",{s:"stun",secs:10});
      await test(E,"ready"); await cast(E,2,100);
      ok(E.fxs.some(f=>f.k==="zone"&&Math.abs(f.r-sk[2].r)<1),`${sk[2].name}: đặt lãnh vực`);
      E.room.send("input",{x:ux,y:uy}); await waitFor(()=>dist(fb)>sk[2].r+8,2500); E.room.send("input",{x:0,y:0}); const away=dist(fb);
      ok(await waitFor(()=>hitsOn(fb).length>=sk[2].n&&beastOf(E,fb)?.allure===1,4000)&&hasSt(beastOf(E,fb),"slow")&&away>sk[2].r,
        `lãnh vực cố định: ${hitsOn(fb).length}/${sk[2].n} nhát dù hồn sư đã đi xa (cách ${away.toFixed(0)}), Làm chậm, nhát cuối Mị hoặc 1 tầng`);
      await test(E,"clear");
    }
    await reset();
    // Xúc Xích: hồi sinh lực, hồi hồn lực, xúc xích bay, Phục Chế sao chép hồn kỹ võ hồn khác trong đội.
    {
      const id="xuc_xich", sk=skillsOf(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận (một mình trong đội)`);
      await test(E,"hurt",{pct:60}); await waitFor(()=>me.hp<me.maxHp*0.5); const h0=me.hp; await test(E,"ready"); await cast(E,0,300);
      ok(me.hp>=h0+Math.floor(me.maxHp*sk[0].self.heal*BP(0))-1,`${sk[0].name}: sinh lực ${h0} -> ${me.hp}/${me.maxHp} (+${Math.round(sk[0].self.heal*BP(0)*100)}%)`);
      await test(E,"ready",{mp:20}); const mq=me.mp; await cast(E,1,300);
      ok(me.mp>=mq+Math.floor(me.maxMp*sk[1].self.mp*BP(1))-1,`${sk[1].name}: hồn lực ${mq} -> ${me.mp}/${me.maxMp}`);
      await test(E,"ready"); await cast(E,2,200);
      ok(hasBuff(me,"spd")&&E.fxs.some(f=>f.k==="fly"&&f.id===E.room.sessionId),`${sk[2].name}: tăng tốc, bay (fx fly)`);
      await test(E,"ready"); await cast(E,3,200);
      ok(/chưa có hồn kỹ/.test(E.logs.at(-1)??"")&&me.cds[3]===0,`${sk[3].name}: đội không có võ hồn khác vừa tung hồn kỹ thì không tung, không hồi chiêu`);
      // Lam Điện tung Lôi Đình Phích Lịch, đổi sang Xúc Xích: Phục Chế tung lại hồn kỹ đó với công của Xúc Xích × 0,8 sức mạnh vòng 4.
      await test(E,"rest",{s:15}); await lineup(LD); ok(await lineup(LD,[id]),`E: ${vname(LD)} ra trận, ${vname(id)} chờ`); await face(); const cb=await spawnAt(4,24); await test(E,"status",{s:"stun",secs:10});
      await test(E,"lei",{v:0}); await test(E,"ready"); await cast(E,1);
      ok(await switchRow(E,rowE(id)),"đổi sang Xúc Xích");
      await test(E,"ready"); await cast(E,3,300); const lsk=skillsOf(LD)[1], w=exp(atkE(id)*P(3)*sk[3].copy*lsk.dmg);
      ok(await lastLog(E,new RegExp(`sao chép ${lsk.name}`))&&w.includes(hitsOn(cb)[0]?.v),`${sk[3].name}: sao chép ${lsk.name}, sát thương ${hitsOn(cb)[0]?.v} (cần ${w.join(" hoặc ")})`);
      // Hiệu ứng lên bản thân cũng × copy: Cửu Bảo Lưu Ly Tháp tung Phòng Chi Lưu Ly (khiên), Xúc Xích chép lại -> khiên = 0,8 lần.
      const CB="cuu_bao_luu_ly_thap", psk=skillsOf(CB)[3];
      await test(E,"set",{rowId:rowE(CB),level:40,xp:0,rings:YRS}); await test(E,"rest",{s:15});
      await lineup(CB); ok(await lineup(CB,[id]),`E: ${vname(CB)} ra trận, ${vname(id)} chờ`);
      await test(E,"hurt",{pct:5}); await waitFor(()=>me.shield===0); await test(E,"ready"); await cast(E,3,0);
      const s0=()=>Math.round(me.maxHp*psk.self.shield*BP(3));
      ok(await waitFor(()=>me.shield>0&&me.shield===s0(),800),`${psk.name}: khiên gốc ${me.shield} (cần ${s0()})`);
      ok(await switchRow(E,rowE(id)),"đổi sang Xúc Xích");
      await test(E,"hurt",{pct:5}); await waitFor(()=>me.shield===0); await test(E,"ready"); await cast(E,3,0);
      const s1=()=>Math.round(me.maxHp*psk.self.shield*BP(3)*sk[3].copy);
      ok(await lastLog(E,new RegExp(`sao chép ${psk.name}`))&&await waitFor(()=>me.vh===vohonIndex(id)&&me.shield>0&&me.shield===s1(),800),
        `${sk[3].name}: sao chép ${psk.name}, khiên ${me.shield} (cần ${s1()} = ${sk[3].copy} lần khiên gốc theo sinh lực Xúc Xích)`);
      // Võ hồn nguồn đã gục thì không chép: Lam Điện tung hồn kỹ rồi gục, Xúc Xích tự ra trận, Phục Chế không tung.
      await test(E,"clear"); await test(E,"rest",{s:15}); await lineup(LD); ok(await lineup(LD,[id]),`E: ${vname(LD)} ra trận, ${vname(id)} chờ`);
      await test(E,"lei",{v:0}); await test(E,"ready"); await cast(E,1,200);
      await test(E,"down"); ok(await waitFor(()=>me.vh===vohonIndex(id)&&!me.dead,1500),`${vname(LD)} gục, ${vname(id)} tự ra trận`);
      await test(E,"ready"); await cast(E,3,300);
      ok(/chưa có hồn kỹ/.test(E.logs.at(-1)??"")&&me.cds[3]===0,`${sk[3].name}: võ hồn nguồn đang gục thì không sao chép, không hồi chiêu (${E.logs.at(-1)})`);
      await test(E,"rest",{s:REVIVE_SECS+1}); await test(E,"clear");
    }
    await reset();
    // Tiên cơ riêng của 5 võ hồn Cảm điện.
    await test(E,"rest",{s:15});
    for(const [k,id] of ELEC.entries()){
      const own=TIEN_CO_RIENG[id], other=ELEC[(k+1)%ELEC.length], atk=atkE(id);
      await lineup(other,[id]); await face(); E.fxs=[];
      // Tiên cơ phụ trợ: võ hồn đang ra trận (sẽ ra sân) mất máu trước để thấy được hồi; hồn lực thuộc hồn sư, giữ tỉ lệ khi đổi.
      if(own.area==="self"){ await test(E,"hurt",{pct:50}); await test(E,"drain",{pct:50}); await sleep(150); }
      const oth=E.owned.active, h0=me.hp, max0=me.maxHp, mr=me.mp/me.maxMp;
      const r=await tienCo(E,rowE(id),{tier:own.area==="self"?-1:4,dx:at(20)[0],dy:at(20)[1]});
      ok(r.fx?.own&&r.fx.vh===vohonIndex(id)&&await lastLog(E,new RegExp(own.name)),`tiên cơ riêng ${vname(id)}: ${own.name}`);
      if(own.dmg){
        const w=exp(atk*own.dmg), first=hitsOn(r.bid)[0]?.v, b=beastOf(E,r.bid);
        ok(w.includes(first),`${own.name}: sát thương ${first} (cần ${w.join(" hoặc ")})`);
        if(own.status) ok(await waitFor(()=>stOk(b,own.status),800),`${own.name}: gây ${stName(own.status)}`);
        if(own.fly) ok(E.fxs.some(f=>f.k==="fly"),`${own.name}: bay`);
      } else {
        // Khiên và hồn lực theo chỉ số của võ hồn vừa đổi vào: đọc trong waitFor (bản vá state đổi võ hồn có thể đến sau tin trả lời).
        const sh=()=>Math.round(me.maxHp*own.self.shield), mw=()=>Math.floor(mr*me.maxMp+me.maxMp*own.self.mp)-2;
        ok(await waitFor(()=>me.vh===vohonIndex(id)&&me.shield===sh()&&sqOf(E,oth)?.hp>=h0+Math.floor(max0*own.self.heal)-1&&me.mp>=mw(),1000),
          `${own.name}: võ hồn trong đội ${h0} -> ${sqOf(E,oth)?.hp}/${max0}, hồn lực ${me.mp}/${me.maxMp} (cần ≥ ${mw()}), khiên ${me.shield} (cần ${sh()})`);
      }
      await test(E,"clear"); await test(E,"rest",{s:15}); await reset();
    }
    // Tung tiên cơ cũng hiện hình như đánh thường: Yêu Hồ tàng hình rồi đổi tay vào Lam Điện đầy năng lượng.
    {
      const YH="yeu_ho", hsk=skillsOf(YH)[1];
      await lineup(YH); ok(await lineup(YH,[LD]),`E: ${vname(YH)} ra trận, ${vname(LD)} chờ`); await face(); await test(E,"ready"); await cast(E,1,0);
      ok(await waitFor(()=>hasBuff(me,"hide"),800),`${hsk.name}: tàng hình`); const t0=Date.now();
      const r=await tienCo(E,rowE(LD),{tier:-1}), dt=Date.now()-t0;
      ok(r.fx?.k==="tienco"&&await waitFor(()=>!hasBuff(me,"hide"),600)&&dt<hsk.self.secs*1000-300,
        `tiên cơ ${TIEN_CO_RIENG[LD].name}: hiện hình (tung sau ${dt} ms, tàng hình còn ${hsk.self.secs} giây)`);
      await test(E,"clear"); await test(E,"rest",{s:15}); await reset();
    }
  }
  // ---------- 2.5d: 5 võ hồn còn lại (Cửu Tinh Thất Sát Kiếm, Nhu Cốt Thố, Tử Vong Chu Hoàng, Quỷ Mị, Thiên Càn Bạch Ngọc Đỉnh), ràng buộc ----------
  {
    const REST=["cuu_tinh_that_sat_kiem","nhu_cot_tho","tu_vong_chu_hoang","quy_mi","thien_can_bach_ngoc_dinh"];
    ok(VOHON.every(v=>skillsOf(v.id).length===4&&skillsOf(v.id)!==SKILLS&&TIEN_CO_RIENG[v.id]),`2.5d: cả ${VOHON.length} võ hồn có 4 hồn kỹ riêng và tiên cơ riêng`);
    ok(skillsOf("vo_hon_chua_co")===SKILLS,"4 hồn kỹ chung giữ làm dự phòng cho võ hồn chưa có bảng riêng");
    for(const vohon of REST) if(!E.owned.list.some(v=>v.vohon===vohon)) await test(E,"grant",{vohon});
    ok(REST.every(id=>E.owned.list.some(v=>v.vohon===id)),"E sở hữu 5 võ hồn còn lại (hook grant)");
    // Đặt lại cấp 40 (hạ hồn thú có thể lên cấp, công đổi), năng lượng về 0 (đổi tay vào võ hồn đầy năng lượng sẽ tung tiên cơ).
    const reset=async()=>{ for(const id of [...REST,"hao_thien_chuy","ta_hoa_phuong_hoang","hoa_anh"]) await test(E,"set",{rowId:rowE(id),level:40,xp:0,rings:YRS}); await test(E,"energy",{v:0}); };
    await reset(); await test(E,"rest",{s:15});
    const skip=new Set([STATUS.poison.col,STATUS.shock.col,STATUS.burn.col]); // sát thương theo thời gian và lan Cảm điện
    const hitsOn=bid=>dmgsOn(E,bid).filter(d=>!skip.has(d.c)), dist=bid=>{const q=beastOf(E,bid); return q?Math.hypot(q.x-me.x,q.y-me.y):-1;};
    const stOk=(b,list)=>!!b&&(list??[]).every(a=>hasSt(b,a.s)&&(!a.n||(b[a.s]??0)>=a.n));
    const stName=list=>(list??[]).map(a=>STATUS[a.s].name+(a.n?` ${a.n} tầng`:"")).join(", ");
    const moved=(x0,y0)=>Math.hypot(me.x-x0,me.y-y0), sum=a=>a.reduce((x,y)=>x+y,0);
    /** Hồn thú mới bậc `tier` cách `d` theo hướng thử, gây sẵn trạng thái `pre` qua hook (mặc định Choáng để đứng yên). */
    async function target(tier,d,pre=["stun"]){
      await test(E,"clear"); await face(); const bid=await spawnAt(tier,d);
      for(const a of pre) await test(E,"status",typeof a==="string"?{s:a,secs:10}:{secs:10,...a});
      return bid;
    }
    /** Hồn sư mất `pct`% sinh lực (hook) để thấy được hồi / hút máu; trả về sinh lực sau khi mất. */
    async function hurtTo(pct){ const h=me.hp; await test(E,"hurt",{pct}); await waitFor(()=>me.hp<h); return me.hp; }
    /** Tung hồn kỹ ô i vào hồn thú mới: kiểm nhát đầu đúng công thức và trạng thái. */
    async function basic(id,i,{tier=4,d=24,pre=["stun"],n=1,st=true}={}){
      const sk=skillsOf(id)[i], atk=atkE(id), bid=await target(tier,d,pre);
      await test(E,"ready"); await cast(E,i,0);
      await waitFor(()=>hitsOn(bid).length>=n&&(!st||stOk(beastOf(E,bid),sk.status)),n>1?4500:1200);
      const want=exp(atk*P(i)*sk.dmg), got=hitsOn(bid).map(x=>x.v);
      ok(got.length>=n&&want.includes(got[0]),`${sk.name}: ${got.length} nhát ${got.join("/")} (nhát đầu cần ${want.join(" hoặc ")})`+(got.length?"":` [${E.logs.slice(-2).join(" | ")}]`));
      if(st&&sk.status) ok(stOk(beastOf(E,bid),sk.status),`${sk.name}: gây ${stName(sk.status)}`);
      return bid;
    }
    // Cửu Tinh Thất Sát Kiếm: Liệt thương (Phá giáp) cộng dồn, Vô Ngã Kiếm Trận liên tục, Kiếm Trảm Sơn Hà mạnh theo tầng Phá giáp.
    {
      const id="cuu_tinh_that_sat_kiem", sk=skillsOf(id), atk=atkE(id), n=STATUS.armor.max;
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await basic(id,0,{d:28}); await basic(id,1,{d:30});
      const kb=await basic(id,2,{n:sk[2].n});
      ok(beastOf(E,kb)?.armor===n,`${sk[2].name}: kiếm trận ${hitsOn(kb).length} nhát, Phá giáp cộng dồn ${beastOf(E,kb)?.armor} tầng`);
      const tb=await target(4,30,["stun",{s:"armor",n}]); await test(E,"ready"); await cast(E,3);
      const w=exp(atk*P(3)*(sk[3].dmg+sk[3].perStack.dmg*n)*(1+n*STATUS.armor.amp)), got=hitsOn(tb)[0]?.v;
      ok(w.includes(got),`${sk[3].name}: mục tiêu Phá giáp ${n} tầng, sát thương ${got} (cần ${w.join(" hoặc ")})`);
      await test(E,"clear");
    }
    // Nhu Cốt Thố: lướt, quật ngã (Choáng), tăng chí mạng, hút máu; ràng buộc chí mạng với Hạo Thiên Chùy.
    {
      const id="nhu_cot_tho", sk=skillsOf(id), atk=atkE(id), still=["root","charm"]; // đứng yên (Trói), không đánh (Mê hoặc; từ 3.5 Câm lặng không chặn đánh thường), nhưng chưa Choáng
      ok(await lineup(id,["hao_thien_chuy"]),`E: ${vname(id)} ra trận, Hạo Thiên Chùy trong đội`);
      let bo=await test(E,"bond");
      ok(bondsOf(["hao_thien_chuy","nhu_cot_tho"])[0]===BONDS[0]&&bo.crit===BONDS[0].crit&&bo.burn===0,`ràng buộc ${BONDS[0].name}: chí mạng +${Math.round(bo.crit*100)}% khi cả hai trong đội`);
      let bid=await target(4,45,still), h0=await hurtTo(50), x0=me.x, y0=me.y;
      await test(E,"ready"); await cast(E,0);
      let got=hitsOn(bid)[0]?.v, w=exp(atk*P(0)*sk[0].dmg), hw=Math.min(me.maxHp,h0+Math.floor((got??0)*sk[0].lifesteal));
      ok(w.includes(got)&&moved(x0,y0)>=10&&hasSt(beastOf(E,bid),"stun"),`${sk[0].name}: lướt ${moved(x0,y0).toFixed(0)} pixel, sát thương ${got} (cần ${w.join(" hoặc ")}), quật ngã (Choáng)`);
      ok(me.hp>=hw-1&&me.hp<=hw+4,`${sk[0].name}: hút ${sk[0].lifesteal*100}% sát thương, sinh lực ${h0} -> ${me.hp} (cần ~${hw})`);
      bid=await target(4,40); x0=me.x; y0=me.y; await test(E,"ready"); await cast(E,1);
      got=hitsOn(bid)[0]?.v; w=exp(atk*P(1)*sk[1].dmg);
      ok(moved(x0,y0)>=50&&w.includes(got),`${sk[1].name}: thuấn di ${moved(x0,y0).toFixed(0)} pixel xuyên hồn thú, sát thương ${got} (cần ${w.join(" hoặc ")})`);
      // Vô Địch Kim Thân: hồn thú kề bên vừa đánh xong, đòn kế tiếp (1,1 giây sau) rơi vào lúc bất tử.
      await test(E,"clear"); await face(); await spawnAt(3,14); E.hurts=[];
      ok(await waitFor(()=>E.hurts.length>0,3000),"hồn thú kề bên đánh hồn sư");
      await test(E,"ready"); await cast(E,2,150); E.hurts=[];
      ok(await waitFor(()=>hasBuff(me,"crit"),500),`${sk[2].name}: chí mạng +${Math.round(sk[2].self.buff.crit*BP(2)*100)}% trong ${sk[2].self.secs} giây`);
      await sleep(sk[2].inv*1000-450);
      ok(!E.hurts.length,`${sk[2].name}: bất tử ${sk[2].inv} giây, hồn thú kề bên không gây sát thương`);
      bid=await target(4,55,still); h0=await hurtTo(50); await test(E,"ready"); await cast(E,3,0);
      ok(await waitFor(()=>hitsOn(bid).length>=sk[3].n&&hasSt(beastOf(E,bid),"stun"),3000),`${sk[3].name}: ${hitsOn(bid).length}/${sk[3].n} đoạn, đoạn cuối quật ngã (Choáng)`);
      const all=hitsOn(bid).map(x=>x.v); w=exp(atk*P(3)*sk[3].dmg); hw=Math.min(me.maxHp,h0+Math.floor(sum(all)*sk[3].lifesteal));
      ok(w.includes(all[0])&&me.hp>=hw-4&&me.hp<=hw+6,`đoạn đầu ${all[0]} (cần ${w.join(" hoặc ")}); hút ${sk[3].lifesteal*100}% của ${sum(all)}: sinh lực ${h0} -> ${me.hp} (cần ~${hw})`);
      await lineup(id); bo=await test(E,"bond"); ok(bo.crit===0,"bỏ Hạo Thiên Chùy khỏi đội: hết ràng buộc");
      await test(E,"clear");
    }
    // Tử Vong Chu Hoàng: độc nhện, giăng tơ gom quái, lưới độc cố định, Thiên La mạnh theo tầng Trúng độc.
    {
      const id="tu_vong_chu_hoang", sk=skillsOf(id), atk=atkE(id);
      ok(await lineup(id),`E: ${vname(id)} ra trận`);
      await basic(id,0,{d:50});
      await test(E,"clear"); await face(); const g1=await spawnAt(3,70), g2=await spawnAt(3,84);
      await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"ready"); await cast(E,1,300);
      ok([g1,g2].every(g=>dist(g)>=0&&dist(g)<TIERS[3].size/2+16&&stOk(beastOf(E,g),sk[1].status)),
        `${sk[1].name}: kéo 2 hồn thú về cách ${dist(g1).toFixed(0)} / ${dist(g2).toFixed(0)} pixel, ${stName(sk[1].status)}`);
      const vb=await basic(id,2,{n:sk[2].n});
      ok(await waitFor(()=>hasSt(beastOf(E,vb),"root"),800)&&beastOf(E,vb)?.poison===STATUS.poison.max,`${sk[2].name}: nhát cuối Trói, Trúng độc cộng dồn ${beastOf(E,vb)?.poison} tầng`);
      const tb=await target(4,60,["stun",{s:"poison",n:4}]); await test(E,"ready"); await cast(E,3,300);
      const w=exp(atk*P(3)*(sk[3].dmg+sk[3].perStack.dmg*4)), got=hitsOn(tb)[0]?.v;
      ok(w.includes(got)&&dist(tb)<TIERS[4].size/2+16&&stOk(beastOf(E,tb),[{s:"root"},{s:"shock"}])&&beastOf(E,tb)?.poison===STATUS.poison.max,
        `${sk[3].name}: 4 tầng độc, sát thương ${got} (cần ${w.join(" hoặc ")}), kéo về ${dist(tb).toFixed(0)} pixel, Trói, Cảm điện, độc ${beastOf(E,tb)?.poison} tầng`);
      await test(E,"clear");
    }
    // Quỷ Mị: hút máu, hút huyết cả đội (đổi võ hồn vẫn còn), tăng sát thương đội, Quỷ Ảnh Trùng Trùng tàng hình cả đội.
    {
      const id="quy_mi", sk=skillsOf(id), atk=atkE(id), CT="cuu_tinh_that_sat_kiem";
      await test(E,"rest",{s:15}); ok(await lineup(id,[CT]),`E: ${vname(id)} ra trận, ${vname(CT)} chờ`); await test(E,"energy",{v:0});
      let bid=await target(4,50,["root","charm"]), h0=await hurtTo(50);
      await test(E,"ready"); await cast(E,0);
      let got=hitsOn(bid)[0]?.v, w=exp(atk*P(0)*sk[0].dmg), hw=Math.min(me.maxHp,h0+Math.floor((got??0)*sk[0].lifesteal));
      ok(w.includes(got)&&me.hp>=hw-1&&me.hp<=hw+4,`${sk[0].name}: sát thương ${got} (cần ${w.join(" hoặc ")}), hút máu: sinh lực ${h0} -> ${me.hp} (cần ~${hw})`);
      await test(E,"ready"); await cast(E,1);
      const lv=sk[1].self.buff.leech*BP(1);
      ok(await waitFor(()=>hasBuff(me,"leech")&&hasBuff(B.room.state.players.get(E.room.sessionId),"leech"),500),`${sk[1].name}: hút huyết ${Math.round(lv*100)}% (người khác cũng thấy)`);
      await test(E,"energy",{v:0}); ok(await switchRow(E,rowE(CT))&&hasBuff(me,"leech"),`đổi sang ${vname(CT)}: hút huyết vẫn còn`);
      bid=await target(4,28); h0=await hurtTo(50); await test(E,"ready"); await cast(E,0);
      got=hitsOn(bid)[0]?.v; hw=Math.min(me.maxHp,h0+Math.floor((got??0)*lv));
      ok(got&&me.hp>=hw-1&&me.hp<=hw+4,`${skillsOf(CT)[0].name} khi có hút huyết: sát thương ${got}, sinh lực ${h0} -> ${me.hp} (cần ~${hw})`);
      await test(E,"clear"); await test(E,"energy",{v:0}); ok(await switchRow(E,rowE(id)),`đổi về ${vname(id)}`);
      await test(E,"ready"); await cast(E,2);
      ok(await waitFor(()=>hasBuff(me,"atk")&&hasBuff(me,"crit"),500),`${sk[2].name}: tăng công, tăng chí mạng`);
      await test(E,"clear"); await face(); const hb=await spawnAt(3,30); await waitFor(()=>beastOf(E,hb)?.aggro,1500);
      await test(E,"ready"); await cast(E,3,0);
      ok(await waitFor(()=>hasBuff(me,"hide")&&hasBuff(B.room.state.players.get(E.room.sessionId),"hide"),800),`${sk[3].name}: tàng hình (người khác thấy)`);
      ok(await waitFor(()=>beastOf(E,hb)&&!beastOf(E,hb).aggro,800),"tàng hình: hồn thú bỏ mục tiêu"+(beastOf(E,hb)?.aggro?` (vẫn đuổi, cách ${dist(hb).toFixed(0)})`:""));
      await test(E,"energy",{v:0}); ok(await switchRow(E,rowE(CT))&&hasBuff(me,"hide"),`đổi sang ${vname(CT)}: vẫn tàng hình (cả đội)`);
      await sleep(450); E.room.send("attack"); ok(await waitFor(()=>!hasBuff(me,"hide"),600),"đánh thường: hiện hình");
      await test(E,"clear");
    }
    // Thiên Càn Bạch Ngọc Đỉnh: hồi máu, khiên, Dễ thương + Câm lặng cho đồng đội đánh boss.
    {
      const id="thien_can_bach_ngoc_dinh", sk=skillsOf(id);
      await test(E,"rest",{s:15}); ok(await lineup(id),`E: ${vname(id)} ra trận`);
      let h0=await hurtTo(60); await test(E,"ready"); await cast(E,0,300);
      ok(me.hp>=h0+Math.floor(me.maxHp*sk[0].self.heal*BP(0))-1,`${sk[0].name}: sinh lực ${h0} -> ${me.hp}/${me.maxHp} (+${Math.round(sk[0].self.heal*BP(0)*100)}%)`);
      await test(E,"ready"); await cast(E,1,0); const s1=()=>Math.round(me.maxHp*sk[1].self.shield*BP(1));
      ok(await waitFor(()=>hasBuff(me,"def")&&me.shield===s1(),800),`${sk[1].name}: tăng thủ, khiên ${me.shield} (cần ${s1()})`);
      await basic(id,2,{d:30});
      h0=await hurtTo(60); await test(E,"ready"); await cast(E,3,0); const s3=()=>Math.round(me.maxHp*sk[3].self.shield*BP(3));
      ok(await waitFor(()=>me.shield===s3(),800)&&me.hp>=h0+Math.floor(me.maxHp*sk[3].self.heal*BP(3))-1,`${sk[3].name}: sinh lực ${h0} -> ${me.hp}/${me.maxHp}, khiên ${me.shield} (cần ${s3()})`);
      await test(E,"clear");
    }
    // Ràng buộc Tà Hỏa – Hỏa Ảnh: Thiêu đốt của hồn sư mạnh thêm khi cả hai trong đội (đo sát thương mỗi giây qua hook).
    {
      const TH="ta_hoa_phuong_hoang", bc=STATUS.burn.col, n=3, atk=atkE(TH);
      await test(E,"rest",{s:15}); await reset();
      const tick=async team=>{ await lineup(TH,team); const bid=await target(4,30); E.dmgs=[]; await test(E,"status",{s:"burn",n});
        await waitFor(()=>dmgsOn(E,bid).some(d=>d.c===bc),1500); return dmgsOn(E,bid).find(d=>d.c===bc)?.v; };
      const t0=await tick([]), t1=await tick(["hoa_anh"]), bo=await test(E,"bond");
      const w0=Math.round(atk*STATUS.burn.dot*n), w1=Math.round(atk*STATUS.burn.dot*n*(1+BONDS[1].burn));
      ok(t0===w0&&t1===w1&&bo.burn===BONDS[1].burn,`ràng buộc ${BONDS[1].name}: Thiêu đốt ${n} tầng ${t0} -> ${t1} mỗi giây (cần ${w0} -> ${w1})`);
      await test(E,"clear");
    }
    // Tiên cơ riêng của 5 võ hồn (đổi tay vào với năng lượng đầy).
    await test(E,"rest",{s:15}); await reset();
    for(const [k,id] of REST.entries()){
      const own=TIEN_CO_RIENG[id], other=REST[(k+1)%REST.length], atk=atkE(id);
      await lineup(other,[id]); await face(); E.fxs=[];
      if(own.self?.heal){ await hurtTo(50); await sleep(150); }
      const oth=E.owned.active, h0=me.hp, max0=me.maxHp, d=own.dash?60:20;
      const r=await tienCo(E,rowE(id),{tier:own.area==="self"?-1:4,dx:at(d)[0],dy:at(d)[1]});
      ok(r.fx?.own&&r.fx.vh===vohonIndex(id)&&await lastLog(E,new RegExp(own.name)),`tiên cơ riêng ${vname(id)}: ${own.name}`);
      if(own.dmg){
        const w=exp(atk*own.dmg), first=hitsOn(r.bid)[0]?.v, list=[...(own.status??[]),...(own.finisher??[])];
        ok(w.includes(first),`${own.name}: sát thương ${first} (cần ${w.join(" hoặc ")})`);
        if((own.n??1)>1) ok(await waitFor(()=>hitsOn(r.bid).length>=own.n,1500),`${own.name}: ${hitsOn(r.bid).length}/${own.n} nhát`);
        if(list.length) ok(await waitFor(()=>stOk(beastOf(E,r.bid),list),1500),`${own.name}: gây ${stName(list)}`);
      } else {
        const buffs=Object.keys(own.self.buff??{});
        if(buffs.length) ok(await waitFor(()=>me.vh===vohonIndex(id)&&buffs.every(x=>hasBuff(me,x)),800),`${own.name}: ${buffs.map(x=>BUFFS[x].name).join(", ")}`);
        if(own.self.shield){ const sh=()=>Math.round(me.maxHp*own.self.shield);
          ok(await waitFor(()=>me.vh===vohonIndex(id)&&me.shield===sh()&&sqOf(E,oth)?.hp>=h0+Math.floor(max0*own.self.heal)-1,1000),
            `${own.name}: võ hồn trong đội ${h0} -> ${sqOf(E,oth)?.hp}/${max0}, khiên ${me.shield} (cần ${sh()})`); }
      }
      await test(E,"clear"); await test(E,"rest",{s:15}); await reset();
    }
  }
  await E.room.leave();
  // ---------- 3.5: chiêu có báo trước của hồn thú từ 1.000 năm ----------
  {
    // Hàm thuần: mọi loài của vùng có hồn thú từ 1.000 năm ở Ngoại vi / Nội địa đều có chiêu; hình vùng tính trúng đúng.
    const zonesOf=m=>JSON.parse(readFileSync(new URL(`../../shared/assets/${m}.json`,import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[])
      .filter(o=>(o.type??o.class)==="zone").map(o=>{ const pr=n=>(o.properties??[]).find(q=>q.name===n)?.value;
        return {yr:parseLevelRange(pr("years")),sp:String(pr("beasts")??"").split(",").map(x=>x.split(":")[0].trim()).filter(Boolean)}; });
    const need=new Set(), miss=[];
    for(const m of ["tinh_dau_ngoai_vi","tinh_dau_noi_dia"]) for(const z of zonesOf(m)) if(z.yr[1]>=BEAST_SKILL_YEARS)
      for(const sp of z.sp){ need.add(sp); if(!beastSkillOf(sp,Math.max(BEAST_SKILL_YEARS,z.yr[0]))) miss.push(sp); }
    ok(need.size>=15&&!miss.length,`mọi loài từ 1.000 năm ở Ngoại vi / Nội địa có chiêu báo trước (${need.size} loài)`+(miss.length?`: thiếu ${miss.join(", ")}`:""));
    ok(!beastSkillOf("liet_trao_hung",999)&&beastSkillOf("quy_dang",1200)?.name==="Quật Roi"&&beastSkillOf("quy_dang",3000)?.name==="Rễ Trói",
      "dưới 1.000 năm chỉ đánh thường; Quỷ Đằng ngàn năm (từ 1.500 năm) dùng Rễ Trói thay Quật Roi");
    const L={shape:"line",x:0,y:0,ang:0,r:100,w:14,arc:0}, C={...L,shape:"cone",r:50,arc:90}, R={...L,shape:"circle",r:30};
    ok(teleHits(L,50,7+TELE_PAD)&&!teleHits(L,50,12+TELE_PAD)&&!teleHits(L,-10,0)&&!teleHits(L,110,0)&&teleHits(C,30,20)&&!teleHits(C,0,30)
      &&teleHits(R,0,30+TELE_PAD)&&!teleHits(R,0,36),"teleHits: vệt, nón, vòng (người chơi là hình tròn bán kính TELE_PAD)");

    const F=await bot("Tester F","lam_dien_ba_vuong_long",{sex:1,hair:1,hairCol:1,outfitCol:2});
    await waitFor(()=>F.owned&&F.squad&&meOf(F)); const fm=meOf(F), fid=F.room.sessionId, act=F.owned.active;
    await test(F,"set",{rowId:act,level:40,xp:0,rings:[423,764,1760,5000]});
    ok(await leaveSafe(F),"F: ra khỏi làng");
    const ry=27.5*16, X0=safe.x+safe.width+140; ok(await goTo(F,X0,ry),`F tới đường làng phía đông (${fm.x.toFixed(0)},${fm.y.toFixed(0)})`);
    const hasP=s=>(fm.st&statusBit(s))!==0, distB=bid=>{ const q=beastOf(F,bid); return q?Math.hypot(q.x-fm.x,q.y-fm.y):-1; };
    /** Sinh hồn thú loài `sp` `years` năm cách F (dx, dy) (hook spawn nhận species), sau khi dọn hồn thú quanh F. */
    async function spawnSp(sp,years,dx,dy=0){ await test(F,"clear"); const x=fm.x+dx, y=fm.y+dy; let id=null;
      await test(F,"spawn",{tier:tierOfYears(years),years,species:sp,dx,dy});
      await waitFor(()=>{ F.room.state.beasts.forEach((o,k)=>{ if(Math.hypot(o.x-x,o.y-y)<6&&BEASTS[o.species]?.id===sp) id=k; }); return id; });
      return id; }
    /** Hồn thú gần nhất báo trước chiêu (hook tele), chạy `during` trong lúc báo trước, chờ fx teleHit (hoặc teleEnd: bị ngắt). */
    async function teleRun(bid,during){ F.fxs=[]; F.hurts=[]; const t0=Date.now(), r=await test(F,"tele");
      const tele=F.fxs.find(f=>f.k==="tele"&&f.bid===bid), cast=F.room.state.beasts.get(bid)?.cast;
      if(during) await during();
      await waitFor(()=>F.fxs.some(f=>(f.k==="teleHit"||f.k==="teleEnd")&&f.bid===bid),2500);
      const hit=F.fxs.find(f=>f.k==="teleHit"&&f.bid===bid), ms=Date.now()-t0; await sleep(120);
      return {r,tele,cast,hit,ms,end:F.fxs.some(f=>f.k==="teleEnd"&&f.bid===bid),hurts:F.hurts.filter(h=>h.c!=="#8ef08a")}; }

    // Vòng quanh thân (Liệt Trảo Hùng · Vỗ Đất): đứng trong vùng thì trúng sau 0,8 giây. Hồn thú bị Trói (không ngắt chiêu) để đứng yên.
    const VD=beastSkillOf("liet_trao_hung",1500), base=beastStats(1500).dmg*VD.dmg*VOHON[fm.vh].def;
    let bid=await spawnSp("liet_trao_hung",1500,30); await test(F,"status",{s:"root",secs:30});
    let x=await teleRun(bid);
    ok(x.r?.name===VD.name&&x.tele?.shape==="circle"&&x.tele.r===VD.r&&x.tele.t===TELE_WARN&&x.cast===true,
      `fx tele: ${x.tele?.name} vòng quanh thân r=${x.tele?.r}, báo trước ${x.tele?.t} giây; BeastState.cast = ${x.cast}`);
    const hv=-(x.hurts[0]?.v??0);
    ok(x.hit?.hit.includes(fid)&&x.ms>=TELE_WARN*1000-100&&hv>=Math.floor(base*0.9)&&hv<=Math.ceil(base*1.1),
      `đứng trong vùng: trúng ${VD.name} sau ${x.ms} ms, mất ${hv} (cần ${Math.round(base*0.9)}–${Math.round(base*1.1)})`);
    // Né bằng cách ra khỏi vùng trước khi hết 0,8 giây: dịch ngay (hook goto) và chạy bộ thật.
    bid=await spawnSp("liet_trao_hung",1500,30); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid,()=>test(F,"goto",{x:fm.x-60,y:fm.y}));
    ok(x.hit&&!x.hit.hit.includes(fid)&&!x.hurts.length,`ra khỏi vùng (cách ${distB(bid).toFixed(0)} pixel) trước khi tung: không trúng`);
    await goTo(F,X0,ry);
    bid=await spawnSp("liet_trao_hung",1500,30); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid,async()=>{ F.room.send("input",{x:-1,y:0}); await sleep(850); F.room.send("input",{x:0,y:0}); });
    ok(x.hit&&!x.hit.hit.includes(fid)&&!x.hurts.length,`chạy bộ ra khỏi vùng trong lúc báo trước: không trúng (tung sau ${x.ms} ms, cách ${distB(bid).toFixed(0)} pixel)`);
    // Vùng an toàn: đứng trong làng, vẫn nằm trong vòng của hồn thú ngoài làng, không trúng.
    await goTo(F,safe.x+safe.width+4,ry); bid=await spawnSp("liet_trao_hung",1500,26); await test(F,"status",{s:"root",secs:30});
    await test(F,"goto",{x:safe.x+safe.width-6,y:ry}); ok(inSafeOf(F),"F đứng mép trong làng");
    x=await teleRun(bid); const db=distB(bid);
    ok(x.hit&&db>=0&&db<VD.r&&!x.hit.hit.includes(fid)&&!x.hurts.length,`vùng an toàn: trong vòng (cách ${db.toFixed(0)} < ${VD.r}) nhưng không trúng`);
    await goTo(F,X0,ry);
    // Vệt dài (Mạn Đà La Xà · Phun Độc): trúng thì Trúng độc trên hồn sư, mất máu mỗi giây; né ngang khỏi vệt.
    const PD=beastSkillOf("man_da_la_xa",1500);
    bid=await spawnSp("man_da_la_xa",1500,40); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid);
    ok(x.tele?.shape==="line"&&x.hit?.hit.includes(fid)&&hasP("poison"),`${PD.name}: vệt dài ${x.tele?.r}, trúng, Trúng độc trên hồn sư (st ${fm.st})`);
    F.hurts=[]; ok(await waitFor(()=>F.hurts.some(h=>h.c==="#8ef08a"),1600),`Trúng độc: mất ${-(F.hurts.find(h=>h.c==="#8ef08a")?.v??0)} sinh lực mỗi giây`);
    const side=blocked(fm.x,fm.y+30)?-30:30;
    bid=await spawnSp("man_da_la_xa",1500,40); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid,()=>test(F,"goto",{x:fm.x,y:fm.y+side}));
    ok(x.hit&&!x.hit.hit.includes(fid)&&!x.hurts.length,`bước ngang ${Math.abs(side)} pixel khỏi vệt: không trúng`);
    await goTo(F,X0,ry);
    // Trói trên hồn sư (Nhân Diện Ma Chu · Phun Tơ): không đi được tới khi hết Trói.
    const PT=beastSkillOf("nhan_dien_ma_chu",3000);
    bid=await spawnSp("nhan_dien_ma_chu",3000,40); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid); const x1=fm.x;
    F.room.send("input",{x:-1,y:0}); await sleep(700); const moved=Math.abs(fm.x-x1);
    ok(x.hit?.hit.includes(fid)&&hasP("root")&&moved<1,`${PT.name}: hồn sư bị Trói, đi không được (dịch ${moved.toFixed(1)} pixel)`);
    ok(await waitFor(()=>!hasP("root")&&Math.abs(fm.x-x1)>4,2000),`hết Trói ${PT.status[0].secs} giây thì đi được`); F.room.send("input",{x:0,y:0});
    await goTo(F,X0,ry);
    // Câm lặng trên hồn thú ngắt chiêu đang báo trước; hồn thú dưới 1.000 năm không có chiêu.
    bid=await spawnSp("liet_trao_hung",1500,30); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid,()=>test(F,"status",{s:"silence",secs:3}));
    ok(x.end&&!x.hit&&!x.hurts.length&&beastOf(F,bid)?.cast===false,"Câm lặng ngắt chiêu báo trước (fx teleEnd, không tung)");
    bid=await spawnSp("liet_trao_hung",999,30); const no=await test(F,"tele");
    ok(bid&&!no?.name,"hồn thú 999 năm không có chiêu báo trước");
    // Tự tung: hồn thú có mục tiêu tự chọn lúc tung chiêu (không dùng hook).
    bid=await spawnSp("liet_trao_hung",1500,30); F.fxs=[];
    ok(await waitFor(()=>F.fxs.some(f=>f.k==="tele"&&f.bid===bid),(TELE_FIRST[1]+3)*1000),`hồn thú tự tung ${VD.name} sau khi có mục tiêu`);
    await test(F,"clear");
    // Câm lặng trên hồn sư chặn hồn kỹ; tiên cơ Xúc Xích (Thanh Tâm Hương Tràng) giải khống chế.
    await test(F,"grant",{vohon:"xuc_xich"}); const xr=F.owned.list.find(v=>v.vohon==="xuc_xich")?.rowId;
    await test(F,"set",{rowId:xr,level:40,xp:0,rings:[423]}); await test(F,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(F,[act,xr,0,0]);
    await test(F,"pst",{s:"silence",secs:20}); await test(F,"pst",{s:"root",secs:20}); await test(F,"ready");
    F.room.send("skill",{i:0}); ok(hasP("silence")&&hasP("root")&&await lastLog(F,/Câm lặng: không dùng được hồn kỹ/)&&fm.cds[0]===0,"Câm lặng trên hồn sư: không dùng được hồn kỹ");
    const tc=await tienCo(F,xr,{tier:-1});
    ok(tc.fx&&await waitFor(()=>fm.st===0,800),`tiên cơ ${TIEN_CO_RIENG.xuc_xich.name}: giải Trói và Câm lặng (st ${fm.st})`);
    // Thiên Càn Bạch Ngọc Đỉnh (2.5d): tiên cơ thanh tẩy đội.
    await test(F,"grant",{vohon:"thien_can_bach_ngoc_dinh"}); const tr=F.owned.list.find(v=>v.vohon==="thien_can_bach_ngoc_dinh")?.rowId;
    await test(F,"set",{rowId:tr,level:40,xp:0,rings:[423]}); await test(F,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(F,[xr,tr,0,0]);
    await test(F,"pst",{s:"poison",n:2,secs:20}); await test(F,"pst",{s:"slow",secs:20});
    const tt=await tienCo(F,tr,{tier:-1});
    ok(tt.fx&&await waitFor(()=>fm.st===0,800),`tiên cơ ${TIEN_CO_RIENG.thien_can_bach_ngoc_dinh.name}: thanh tẩy Trúng độc và Làm chậm (st ${fm.st})`);
    await F.room.leave();
  }
  // ---------- BĐ4: tinh anh (biến dị) ----------
  {
    // Dữ liệu: mỗi vùng (theo tên) của 3 bản đồ săn có đúng 1 object `elite`; mã trong BOSSES, 2 chiêu, loài gốc có trong BEASTS.
    const objsOf=m=>JSON.parse(readFileSync(new URL(`../../shared/assets/${m}.json`,import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[]);
    const inR=(r,x,y)=>x>=r.x&&x<=r.x+(r.width??r.w)&&y>=r.y&&y<=r.y+(r.height??r.h);
    const bad=[];
    for(const m of ["thanh_hon_thon","tinh_dau_ngoai_vi","tinh_dau_noi_dia"]){
      const os=objsOf(m), zs=os.filter(o=>o.type==="zone"), es=os.filter(o=>o.type==="elite");
      for(const n of new Set(zs.map(z=>z.name))){ const k=es.filter(e=>zs.some(z=>z.name===n&&inR(z,e.x+e.width/2,e.y+e.height/2))).length; if(k!==1) bad.push(`${m}/${n}: ${k}`); }
      for(const e of es){ const id=e.properties.find(q=>q.name==="boss")?.value, d=BOSSES[bossIndex(id)]; if(!d||d.rank!==1||d.skills.length!==2||beastIndex(d.species)<0) bad.push(`${m}/${id}`); }
    }
    ok(!bad.length,`mỗi vùng của 3 bản đồ săn có đúng 1 tinh anh (BOSSES, 2 chiêu, loài gốc có thật)`+(bad.length?`: ${bad.join("; ")}`:""));
    ok([[1,1],[2,1.6],[4,2.8],[10,6.4],[20,12.4]].every(([n,v])=>Math.abs(bossHpMult(n)-v)<1e-9),"hệ số máu theo số người đúng bảng 5.4 (x1 / x1,6 / x2,8 / x6,4 / x12,4)");
    const GT=BOSSES[bossIndex("huyet_gai_quy_dang")].skills[0], gz=teleZones(GT,0,0,100,0), TL=BOSSES[bossIndex("hac_sat_quy_ho")].skills[0], tz=teleZones(TL,0,0,100,0);
    ok(gz.length===3&&gz.map(z=>Math.round(z.x)).join()===`${100-GT.step},100,${100+GT.step}`&&tz.length===3&&Math.abs(tz[2].ang-tz[0].ang-TL.spread*Math.PI/180)<1e-9,
      `chiêu nhiều vùng: ${GT.name} 3 vòng thành hàng (${gz.map(z=>Math.round(z.x)).join(", ")}), ${TL.name} 3 vệt tỏa ${TL.spread}°`);

    const G=await bot("Tester G","thien_can_bach_ngoc_dinh",{sex:0,hair:2,hairCol:4,outfitCol:5}), H=await bot("Tester H","tu_vong_chu_hoang",{sex:1,hair:3,hairCol:1,outfitCol:0});
    await waitFor(()=>G.owned&&H.owned&&meOf(G)&&meOf(H));
    const gm=meOf(G), hm=meOf(H), gid=G.room.sessionId, hid=H.room.sessionId;
    // Hồn hoàn 10 năm (sức mạnh hồn kỹ x1) để vài đòn không hạ ngay tinh anh 450 năm (503 máu).
    await test(G,"set",{rowId:G.owned.active,level:40,xp:0,rings:[10,10,10,10]}); await test(H,"set",{rowId:H.owned.active,level:10,xp:0,rings:[10]});
    // Tinh anh bị hook `clear` của các phần trước xóa thì đang chờ hồi sinh: rút thời gian chờ rồi đợi sinh lại.
    await test(G,"erespawn",{s:0});
    const els=async()=>(await test(G,"elite")).list;
    let L=await els(); for(let k=0;k<20&&L.some(e=>!e.bid);k++){ await sleep(400); L=await els(); }
    const tz2=objsOf(st.mapId), zoneOf=n=>tz2.find(o=>o.type==="zone"&&o.name===n), gates=[spawnObj,...tz2.filter(o=>o.type==="portal"),...tz2.filter(o=>o.type==="arrive").map(o=>({...o,width:0,height:0}))];
    const nearGate=(x,y)=>gates.some(r=>x>r.x-SPAWN_CLEAR&&x<r.x+r.width+SPAWN_CLEAR&&y>r.y-SPAWN_CLEAR&&y<r.y+r.height+SPAWN_CLEAR);
    // Chỗ sinh (hx, hy) nằm trong chữ nhật `elite`, ngoài làng và ngoài SPAWN_CLEAR; tinh anh lang thang quanh đó nên chỉ cần còn trong vùng.
    const elBad=L.filter(e=>{ const b=e.bid&&st.beasts.get(e.bid), z=zoneOf(e.zone), yr=parseLevelRange(z?.properties.find(q=>q.name==="years")?.value);
      return !b||b.rank!==1||b.species!==bossIndex(e.boss)||!inR(e.rect,e.hx,e.hy)||inR(safe,e.hx,e.hy)||nearGate(e.hx,e.hy)||!inR(z,b.x,b.y)||e.years!==yr[1]; });
    ok(L.length===3&&!elBad.length,`Thánh Hồn Thôn: 3 tinh anh trong đúng vùng, niên hạn = mức trên của vùng, ngoài làng và ngoài SPAWN_CLEAR: ${L.map(e=>`${e.name} (${e.zone}, ${e.years} năm)`).join("; ")}`+(elBad.length?` ✗ ${elBad.map(e=>e.boss).join(",")}`:""));
    const statBad=L.filter(e=>{ const s=beastStats(e.years), b=st.beasts.get(e.bid);
      return e.base!==Math.round(s.hp*ELITE.hp)||b?.maxHp!==e.base||Math.abs(e.dmg-s.dmg*ELITE.dmg)>1e-6||e.skills.join()!==BOSSES[bossIndex(e.boss)].skills.map(x=>x.name).join(); });
    ok(!statBad.length,`chỉ số tinh anh: máu x${ELITE.hp}, sát thương x${ELITE.dmg} so với loài gốc cùng năm, 2 chiêu: ${L.map(e=>`${e.name} ${e.base} máu, ${e.dmg.toFixed(1)} sát thương, ${e.skills.join(" / ")}`).join("; ")}`);

    // Đến cạnh tinh anh `boss` (hook goto tới điểm đứng được cách `d` pixel), dọn hồn thú thường quanh đó (giữ tinh anh).
    const eOf=boss=>L.find(e=>e.boss===boss), eb=boss=>st.beasts.get(eOf(boss)?.bid), info=async boss=>(await els()).find(e=>e.boss===boss);
    async function near(b,boss,d){ const t=eb(boss); if(!t) return false;
      for(let k=0;k<32;k++){ const a=k*Math.PI/8+(k>=16?0.2:0), r=k>=16?d*1.5:d, x=Math.round(t.x+Math.cos(a)*r), y=Math.round(t.y+Math.sin(a)*r);
        if(blocked(x,y)||inR(safe,x,y)) continue; await test(b,"goto",{x,y}); const q=meOf(b); if(Math.hypot(q.x-x,q.y-y)<1) return true; }
      return false; }
    const away=async b=>{ await test(b,"goto",{x:safe.x+safe.width/2,y:27.5*16}); };
    async function tranAp(){ await test(G,"ready"); G.dmgs=[]; G.room.send("skill",{i:2}); await waitFor(()=>G.dmgs.length>0,1500); }
    const TN="thiet_nha_da_tru_vuong", tn=()=>eb(TN), tnid=()=>eOf(TN).bid;
    await away(H);
    ok(await near(G,TN,24),`G đứng cạnh ${eOf(TN).name} (${gm.x.toFixed(0)},${gm.y.toFixed(0)})`);
    await test(G,"clear",{keep:1});
    // Giao chiến 1 người (H ở làng, ngoài bán kính): máu tối đa giữ nguyên.
    await tranAp(); let I=await info(TN);
    ok(I.engaged&&I.n===1&&I.parts.join()===gid&&I.maxHp===I.base&&I.hp<I.maxHp,`G đánh trúng: bắt đầu giao chiến, 1 người tham gia, máu ${I.hp}/${I.maxHp}`);
    // Cuồng nộ khi máu dưới 50%.
    G.fxs=[]; await test(G,"bhp",{pct:40});
    ok(await waitFor(()=>(tn()?.buff&beastBuffBit("rage"))!==0,1500)&&G.fxs.some(f=>f.k==="rage"&&f.bid===tnid()),`máu ${tn()?.hp}/${tn()?.maxHp} (dưới ${ELITE_RAGE.hp*100}%): nổi ${BEAST_BUFFS.rage.name}`);
    // Người vào giữa trận: H tới gần và gây sát thương thì thành người tham gia, máu tối đa x1,6, máu hiện tại giữ tỉ lệ.
    ok(await near(H,TN,40),"H tới gần tinh anh");
    const r0=tn().hp/tn().maxHp; await test(H,"ready"); H.dmgs=[]; H.room.send("skill",{i:0});
    await waitFor(()=>H.dmgs.some(x=>x.bid===tnid()),1500); await sleep(150); I=await info(TN);
    // Trúng độc của H có thể gây thêm sát thương theo thời gian trước hoặc sau lúc hook chụp: cho phép lệch tới tổng các nhát độc.
    const onT=H.dmgs.filter(x=>x.bid===tnid()), dot=onT.filter(x=>x.c===STATUS.poison.col).reduce((a,x)=>a+x.v,0), dH=onT.reduce((a,x)=>a+x.v,0)-dot;
    const want=Math.round(r0*Math.round(I.base*1.6))-dH;
    ok(I.n===2&&I.parts.includes(hid)&&I.maxHp===Math.round(I.base*bossHpMult(2))&&I.hp<=want+2&&I.hp>=want-dot-2,
      `H gây ${dH} sát thương (+${dot} độc): 2 người tham gia, máu tối đa ${I.base} -> ${I.maxHp} (x1,6), máu ${I.hp} (giữ tỉ lệ ${(r0*100).toFixed(0)}%: cần ≈${want})`);
    // Thiên Càn Trấn Áp xóa Cuồng nộ ("xóa buff địch"), Cuồng nộ không nổi lại ngay.
    G.fxs=[]; await tranAp();
    ok(await waitFor(()=>!(tn()?.buff&beastBuffBit("rage")),1000)&&G.fxs.some(f=>f.k==="dispel")&&/Xóa Cuồng nộ/.test(G.logs.slice(-4).join("\n")),
      `${skillsOf("thien_can_bach_ngoc_dinh")[2].name} xóa ${BEAST_BUFFS.rage.name} (log: ${G.logs.at(-1)})`);
    await sleep(700); I=await info(TN); ok(!I.rage&&I.rageCd>ELITE_RAGE.cd-3,`chưa nổi lại ngay (chờ ${I.rageCd.toFixed(1)} giây)`);
    // Ra khỏi bán kính 30 giây liên tục thì bị loại; số người giảm thì máu tối đa giảm, giữ tỉ lệ.
    await away(G); const r1=tn().hp/tn().maxHp; await test(G,"etick",{s:ELITE.outSecs+1}); I=await info(TN);
    ok(I.engaged&&I.parts.join()===hid&&I.n===1&&I.maxHp===I.base&&Math.abs(I.hp/I.maxHp-r1)<0.02,`G ở ngoài ${ELITE.radius} pixel ${ELITE.outSecs} giây: bị loại, 1 người, máu ${I.hp}/${I.maxHp} (giữ tỉ lệ)`);
    await near(G,TN,30); await test(G,"bhp",{pct:100}); await tranAp(); I=await info(TN); ok(I.n===2&&I.parts.length===2,`G quay lại đánh: lại 2 người, máu ${I.hp}/${I.maxHp}`);
    // Rời phòng thì bị loại ngay, nhưng số người giảm tối đa 1 mỗi 10 giây.
    await H.room.leave(); await sleep(300); I=await info(TN);
    ok(I.parts.join()===gid&&I.n===2,`H rời phòng: bị loại, nhưng số người áp vào máu vẫn ${I.n} (vừa giảm chưa đủ ${ELITE.dropEvery} giây)`);
    await test(G,"etick",{s:ELITE.dropEvery}); I=await info(TN); ok(I.n===1&&I.maxHp===I.base,`sau ${ELITE.dropEvery} giây: 1 người, máu tối đa ${I.maxHp}`);
    // Bỏ giao chiến: 15 giây không còn người tham gia nào trong bán kính thì về chỗ, hồi đầy máu, xóa danh sách.
    await away(G); await test(G,"etick",{s:ELITE.idleSecs+1}); I=await info(TN);
    ok(!I.engaged&&!I.parts.length&&I.n===1&&I.hp===I.base&&I.maxHp===I.base,`${ELITE.idleSecs} giây không ai trong bán kính: bỏ giao chiến, hồi đầy ${I.hp}/${I.maxHp}`);

    // 2 chiêu báo trước qua bộ máy 3.5: tên, hình đúng bảng; đứng trong vòng thì trúng với sát thương x1,5.
    await near(G,TN,20); await test(G,"clear",{keep:1}); await test(G,"status",{s:"root",secs:30});
    const sk=BOSSES[bossIndex(TN)].skills, casts=[];
    // Vòng quanh thân trước (đứng sát thì trúng), vệt lao sau (tung xong tinh anh lao ra xa).
    for(const i of [1,0]){ G.fxs=[]; G.hurts=[]; const r=await test(G,"tele",{i});
      const tl=G.fxs.find(f=>f.k==="tele"&&f.bid===tnid()); await waitFor(()=>G.fxs.some(f=>(f.k==="teleHit"||f.k==="teleEnd")&&f.bid===tnid()),2500); await sleep(150);
      casts[i]=({r,tl,hit:G.fxs.find(f=>f.k==="teleHit"&&f.bid===tnid()),hurt:-(G.hurts.find(h=>h.c!=="#8ef08a")?.v??0)}); }
    ok(casts.every((c,i)=>c.r?.name===sk[i].name&&c.tl?.shape===sk[i].shape&&c.tl.r===sk[i].r),`2 chiêu báo trước: ${casts.map(c=>`${c.tl?.name} (${c.tl?.shape} ${c.tl?.r})`).join(", ")}`);
    const yrs=eOf(TN).years, exp=beastStats(yrs).dmg*ELITE.dmg*sk[1].dmg*VOHON[gm.vh].def, c1=casts[1];
    ok(c1.hit?.hit.includes(gid)&&c1.hurt>=Math.floor(exp*0.9)&&c1.hurt<=Math.ceil(exp*1.1),`${sk[1].name} trúng: mất ${c1.hurt} (cần ${Math.round(exp*0.9)}–${Math.round(exp*1.1)}, sát thương x${ELITE.dmg})`);

    // Gọi bầy (Ngân Bối Phong Lang Đầu Lĩnh · Hú Bầy): gọi đủ 2 sói con, gọi lại không vượt quá 2.
    const NB="ngan_boi_phong_lang_dau_linh", nbid=()=>eOf(NB).bid, hb=BOSSES[bossIndex(NB)].skills[0];
    if(await near(G,NB,20)){
      await test(G,"clear",{keep:1}); await test(G,"status",{s:"root",secs:30});
      const pups=()=>[...st.beasts.values()].filter(o=>!o.rank&&BEASTS[o.species]?.id===hb.summon.species&&Math.hypot(o.x-eb(NB).x,o.y-eb(NB).y)<80).length;
      G.fxs=[]; await test(G,"tele",{i:0}); await waitFor(()=>G.fxs.some(f=>f.k==="teleHit"&&f.bid===nbid()),2500); await sleep(200);
      const n1=pups(), m1=(await info(NB)).minions;
      await test(G,"rest",{s:1}); G.fxs=[]; await test(G,"tele",{i:0}); await waitFor(()=>G.fxs.some(f=>f.k==="teleHit"&&f.bid===nbid()),2500); await sleep(200);
      ok(n1===hb.summon.n&&m1===hb.summon.n&&(await info(NB)).minions===hb.summon.n,`${hb.name}: gọi ${n1} ${BEASTS[beastIndex(hb.summon.species)].name}, gọi lại vẫn tối đa ${hb.summon.n}`);
      await test(G,"clear",{keep:1});
    } else ok(false,`G không tới được ${eOf(NB).name}`);

    // Hạ tinh anh: hồn hoàn mang đúng số năm, báo cả phòng; hồi sinh sau 8–12 phút (hook rút ngắn) ở đúng chỗ.
    await near(G,TN,20); await test(G,"clear",{keep:1}); const tx=tn().x, ty=tn().y, oldId=tnid();
    await test(G,"bhp",{pct:1}); G.elite=[]; const before=new Set(st.drops.keys());
    for(let k=0;k<4&&st.beasts.has(oldId);k++) await tranAp();
    const dr=[...st.drops.entries()].find(([k])=>!before.has(k))?.[1];
    ok(!st.beasts.has(oldId)&&dr?.years===yrs&&dr.owner===gid&&await waitFor(()=>G.elite.some(m=>m.k==="down"),1000)&&/Hạ Tinh anh Thiết Nha Dã Trư Vương/.test(G.logs.join("\n")),
      `hạ ${eOf(TN).name}: hồn hoàn ${dr?.years} năm thuộc G, báo cả phòng (${G.elite.find(m=>m.k==="down")?.name})`);
    I=await info(TN); ok(!I.bid&&I.respawn>ELITE.respawn[0]-5&&I.respawn<=ELITE.respawn[1],`chờ hồi sinh ${(I.respawn/60).toFixed(1)} phút (${ELITE.respawn[0]/60}–${ELITE.respawn[1]/60} phút)`);
    await away(G); G.elite=[]; await test(G,"erespawn",{s:0.5});
    ok(await waitFor(()=>G.elite.some(m=>m.k==="spawn"&&/Thiết Nha/.test(m.name)),4000),`hồi sinh: cả phòng nhận thông báo "${G.elite.find(m=>m.k==="spawn")?.name} xuất hiện" ở ${G.elite.find(m=>m.k==="spawn")?.zone}`);
    I=await info(TN); const nb=I.bid&&st.beasts.get(I.bid);
    ok(nb&&I.bid!==oldId&&nb.rank===1&&inR(I.rect,nb.x,nb.y)&&nb.hp===I.base&&!I.engaged,`tinh anh mới ở đúng chỗ (${nb?.x.toFixed(0)},${nb?.y.toFixed(0)}), đầy máu ${nb?.hp}`);
    await G.room.leave();
  }
  // ---------- BĐ5: tà hóa thú vương theo lịch, máu theo số người, giai đoạn 2, chia thưởng, 3 lần/ngày, rương ----------
  {
    // Dữ liệu: thú vương của Ngoại vi và Nội địa (bảng 5.3), Thánh Hồn Thôn không có; hang (object `boss`) ở vùng sâu nhất.
    const kings=BOSSES.filter(b=>b.rank===2), objsK=m=>JSON.parse(readFileSync(new URL(`../../shared/assets/${m}.json`,import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[]);
    const kbad=[];
    for(const [m,id,hp] of [["tinh_dau_ngoai_vi","huyet_nguyet_lang_vuong",6],["tinh_dau_noi_dia","thien_doc_chu_hoang",7]]){
      const d=BOSSES[bossIndex(id)], os=objsK(m), lr=os.filter(o=>o.type==="boss"), zs=os.filter(o=>o.type==="zone"), deep=zs.reduce((a,z)=>z.x>a.x?z:a);
      if(MAPS[m].king!==id||d?.rank!==2||d.hp!==hp||beastIndex(d.species)<0) kbad.push(`${m}: ${id}`);
      if(d&&(d.skills.length<2||d.skills.length>3||!d.phase2?.skills.length||[...d.skills,...d.phase2.skills].some(s=>s.warn<1))) kbad.push(`${id}: chiêu`);
      if(lr.length!==1||lr[0].properties.find(q=>q.name==="boss")?.value!==id||lr[0].x<deep.x||lr[0].x+lr[0].width>deep.x+deep.width) kbad.push(`${m}: hang`);
    }
    if(MAPS.thanh_hon_thon.king||objsK("thanh_hon_thon").some(o=>o.type==="boss")) kbad.push("thanh_hon_thon có thú vương");
    ok(!kbad.length&&kings.length===2,`2 thú vương (${kings.map(k=>`${k.name} x${k.hp}: ${k.skills.map(s=>s.name).join(", ")} + GĐ2 ${k.phase2.name}`).join("; ")}), hang ở vùng sâu nhất, Thánh Hồn Thôn không có`+(kbad.length?`: ${kbad.join("; ")}`:""));
    // Lịch theo giờ Việt Nam (UTC+7, Asia/Ho_Chi_Minh): 20:00 và 22:00; ngày nhận thưởng đổi lúc 00:00.
    const U=(h,mi=0,d=19)=>Date.UTC(2026,9,d,h,mi);
    ok(vnDay(U(16,59)+59000)==="2026-10-19"&&vnDay(U(17,0))==="2026-10-20"&&kingNext(U(12,0))===U(13,0)&&kingNext(U(13,30))===U(15,0)&&kingNext(U(16,0))===U(13,0,20)
      &&kingActive(U(13,10))===U(13,0)&&kingActive(U(13,0)+KING.lifeSecs*1000)===null&&kingActive(U(12,59))===null&&vnHHMM(kingNext(U(14,0)))==="22:00",
      `lịch ${KING_TIMES.join(" / ")} giờ Việt Nam, rút đi sau ${KING.lifeSecs/60} phút, ngày mới lúc 00:00 (23:59 UTC+7 = ${vnDay(U(16,59))}, 00:00 = ${vnDay(U(17,0))})`);
    ok(KING_CHEST.ur===0.05&&KING.share===0.03&&KING.daily===3&&[1,2,4,10].every(n=>Math.abs(bossHpMult(n)-(1+0.6*(n-1)))<1e-9),"đã chốt: mảnh UR 5%, ngưỡng rương 3%, 3 lần/ngày, máu x(1 + 0,6 × (N − 1))");

    const K=await bot("Tester K","u_minh_linh_mieu",{sex:0,hair:1,hairCol:2,outfitCol:3}), L=await bot("Tester L","nhu_cot_tho",{sex:1,hair:0,hairCol:5,outfitCol:2});
    await waitFor(()=>K.owned&&L.owned&&meOf(K)&&meOf(L));
    /** Đưa bot sang Tinh Đấu Ngoại vi (tài khoản cũ còn `tinh_dau` vào Ngoại vi ở trại cổng, hook legacy của BĐ3). */
    async function toNgoaiVi(b){ const lg=await test(b,"legacy",{mapId:"tinh_dau",x:0,y:0}); await b.room.leave(); await sleep(300);
      b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>b.room.state.players&&meOf(b)&&b.owned); return !!lg?.saved&&b.room.state.mapId==="tinh_dau_ngoai_vi"; }
    ok(await toNgoaiVi(K),"K tới Tinh Đấu Ngoại vi");
    // Báo trước toàn server (presence): A ở Thánh Hồn Thôn cũng nhận đếm ngược.
    A.boss=[]; K.boss=[]; let ki=await test(K,"king",{kop:"warn",s:120});
    ok(await waitFor(()=>A.boss.some(m=>m.k==="warn")&&K.boss.some(m=>m.k==="warn"),1500),`báo trước toàn server: A (${A.room.state.mapId}) "${A.boss.find(m=>m.k==="warn")?.name} xuất hiện sau ${A.boss.find(m=>m.k==="warn")?.in} giây ở ${A.boss.find(m=>m.k==="warn")?.mapName}"`);
    const wa=A.boss.find(m=>m.k==="warn"), wk=K.boss.find(m=>m.k==="warn");
    ok(wa&&!wa.here&&wk?.here&&wk.in===120&&wk.name==="Tà hóa Huyết Nguyệt Lang Vương",`đếm ngược 120 giây; A ở bản đồ khác (here=${wa?.here}), K ở đúng bản đồ (here=${wk?.here})`);
    ok(await toNgoaiVi(L)&&await waitFor(()=>L.boss.some(m=>m.k==="warn"&&m.in<=120&&m.in>100),1500),`L vào Ngoại vi giữa lúc chờ: nhận đếm ngược còn lại (${L.boss.find(m=>m.k==="warn")?.in} giây)`);
    ok(K.room.roomId===L.room.roomId,"K và L cùng kênh Ngoại vi");
    const kings2=()=>[...K.room.state.beasts.entries()].filter(([,b])=>b.rank===2), kingB=()=>kings2()[0]?.[1], kid=()=>kings2()[0]?.[0];
    A.boss=[]; A.chats=[]; K.boss=[];
    await test(K,"king",{kop:"spawn"});
    ok(await waitFor(()=>kingB()&&A.boss.some(m=>m.k==="spawn")&&K.boss.some(m=>m.k==="spawn"),2000),`xuất hiện: báo toàn server (A nhận "${A.boss.find(m=>m.k==="spawn")?.name} … ${A.boss.find(m=>m.k==="spawn")?.mapName}")`);
    ki=await test(K,"king"); const LR=ki.lair, inLair=(x,y)=>x>=LR.x&&x<=LR.x+LR.w&&y>=LR.y&&y<=LR.y+LR.h, Y=MAPS.tinh_dau_ngoai_vi.years[1];
    const kbase=Math.round(beastStats(Y).hp*BOSSES[bossIndex("huyet_nguyet_lang_vuong")].hp);
    ok(ki.bid&&inLair(ki.x,ki.y)&&ki.years===Y&&ki.base===kbase&&ki.maxHp===kbase&&Math.abs(ki.dmg-beastStats(Y).dmg*KING.dmg)<1e-6&&ki.phase===1&&ki.skills.length===2&&ki.life>KING.lifeSecs-5,
      `thú vương trong hang (${ki.x?.toFixed(0)},${ki.y?.toFixed(0)}), ${ki.years} năm, máu x6 = ${ki.maxHp}, sát thương x${KING.dmg}, giai đoạn 1, 2 chiêu (${ki.skills?.join(", ")}), rút đi sau ${Math.round(ki.life)} giây`);
    await test(K,"king",{kop:"spawn"}); await sleep(200);
    ok(kings2().length===1,"đang có thú vương thì khung giờ mới không sinh thêm (mỗi kênh một con)");

    // Vào hang: K và L đứng trong hang lúc thú vương bắt đầu giao chiến thì cả hai là người tham gia, máu tối đa x1,6.
    async function intoLair(b,dx,dy){ const t=kingB(); for(let k=0;k<24;k++){ const a=k*Math.PI/6, r=k<12?1:1.6, x=Math.round(t.x+dx*r*Math.cos(a)-dy*Math.sin(a)), y=Math.round(t.y+dx*r*Math.sin(a)+dy*Math.cos(a));
      if(!inLair(x,y)) continue; await test(b,"goto",{x,y}); const q=meOf(b); if(Math.hypot(q.x-x,q.y-y)<1) return true; } return false; }
    const outLair=async b=>{ await test(b,"goto",{x:LR.x+LR.w/2,y:LR.y-40}); return !inLair(meOf(b).x,meOf(b).y); };
    ok(await intoLair(K,40,0)&&await intoLair(L,-40,0),`K, L vào hang (${meOf(K).x.toFixed(0)},${meOf(K).y.toFixed(0)}) / (${meOf(L).x.toFixed(0)},${meOf(L).y.toFixed(0)})`);
    await test(K,"clear",{keep:1}); await test(L,"clear",{keep:1});
    // Thú vương x2 sát thương hạ nhanh võ hồn cấp thấp: Choáng dài để nó đứng yên trong lúc thử (giai đoạn 2 gầm lên thì mất Choáng).
    await test(K,"kdmg",{v:1}); await test(K,"status",{s:"stun",secs:60}); ki=await test(K,"king");
    ok(ki.engaged&&ki.n===2&&ki.parts.length===2&&ki.maxHp===Math.round(kbase*bossHpMult(2))&&kingB().parts===2,`K đánh: L đứng trong hang cũng thành người tham gia, 2 người, máu tối đa ${kbase} -> ${ki.maxHp} (x1,6)`);
    // Ra khỏi hang 30 giây liên tục thì bị loại; máu giữ tỉ lệ.
    ok(await outLair(L),"L ra khỏi hang"); const r0=ki.hp/ki.maxHp; await test(K,"etick",{s:KING.outSecs+1}); ki=await test(K,"king");
    ok(ki.parts.join()===K.room.sessionId&&ki.n===1&&ki.maxHp===kbase&&Math.abs(ki.hp/ki.maxHp-r0)<0.01,`L ngoài hang ${KING.outSecs} giây: bị loại, 1 người, máu ${ki.hp}/${ki.maxHp} (giữ tỉ lệ)`);
    ok(await intoLair(L,-40,0),"L quay lại hang"); await test(L,"kdmg",{v:1}); ki=await test(K,"king"); ok(ki.n===2,`L đánh: lại ${ki.n} người`);
    ok(inLair(kingB().x,kingB().y),"thú vương không ra khỏi hang");

    // Giai đoạn 2 ở 50% máu: gầm 2 giây (không nhận khống chế), thêm chiêu, nhanh hơn.
    K.fxs=[]; K.boss=[];
    await test(K,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*KING.phaseHp)+1});
    ok(await waitFor(()=>kingB()?.phase===2,1500)&&K.fxs.some(f=>f.k==="roar")&&K.boss.some(m=>m.k==="phase"&&m.title==="Huyết Cuồng"),`máu ${kingB()?.hp}/${kingB()?.maxHp}: giai đoạn 2 – ${K.boss.find(m=>m.k==="phase")?.title} (${K.boss.find(m=>m.k==="phase")?.desc})`);
    await test(K,"status",{s:"stun",secs:5}); ki=await test(K,"king");
    ok(ki.roar>0&&!ki.st.includes("stun")&&ki.skills.length===3&&ki.skills[2]==="Huyết Cuồng Xung"&&Math.abs(ki.spd-1.4)<1e-9,`đang gầm (${ki.roar.toFixed(1)} giây): không nhận Choáng; chiêu ${ki.skills.join(", ")}; tốc độ x${ki.spd}`);
    await sleep(KING.roarSecs*1000+300);
    await test(K,"status",{s:"stun",secs:60}); ki=await test(K,"king"); ok(!ki.roar&&ki.st.includes("stun"),"hết gầm thì khống chế lại có tác dụng");
    K.fxs=[]; await test(K,"rest",{s:1}); const tl=await test(K,"tele",{i:2}); await waitFor(()=>K.fxs.some(f=>f.k==="tele"),800);
    const tf=K.fxs.find(f=>f.k==="tele"); ok(tl?.name==="Huyết Cuồng Xung"&&tf?.t>=1.2,`chiêu giai đoạn 2 ${tf?.name}: báo trước ${tf?.t} giây (dài hơn hồn thú thường ${TELE_WARN})`);
    await waitFor(()=>K.fxs.some(f=>f.k==="teleHit"||f.k==="teleEnd"),2500);

    // Chia thưởng: L đóng góp 2% (dưới 3%) thì không có rương; người nhiều nhất (K) được ưu tiên hồn hoàn.
    const chestK=b=>qtyOf(b,chestCode("huyet_nguyet_lang_vuong"));
    async function finish(share){ // L gây `share` phần tổng sát thương cuối cùng, K hạ nốt
      let I=await test(K,"king"); const lPrev=(I.list.find(x=>x.id===L.room.sessionId)?.pct??0)/100*I.total, want=Math.floor(share*(I.total+I.hp)-lPrev);
      if(want>0) await test(L,"kdmg",{v:want});
      const before=new Set(K.room.state.drops.keys()); K.boss=[]; await test(K,"kdmg",{v:1e8});
      await waitFor(()=>K.boss.some(m=>m.k==="down"),1500); await sleep(300);
      return { down:K.boss.find(m=>m.k==="down"), drop:[...K.room.state.drops.entries()].find(([k])=>!before.has(k))?.[1] };
    }
    await test(L,"set",{rowId:L.owned.active,level:15,xp:0,rings:[10]}); const lxp=meOf(L).xp;
    K.logs=[]; L.logs=[]; A.chats=[];
    let f=await finish(0.02);
    const lp=f.down?.list.find(x=>x.id===L.room.sessionId)?.pct;
    ok(f.down&&!kingB()&&lp>=1&&lp<3&&f.drop?.owner===K.room.sessionId&&f.drop.years===Y,`hạ thú vương: L đóng góp ${lp}%, K ${f.down?.list[0]?.pct}%; hồn hoàn ${f.drop?.years} năm ưu tiên K (nhiều nhất)`);
    ok(await waitFor(()=>chestK(K)===1,2000)&&chestK(L)===0&&/cần từ 3% mới nhận rương/.test(L.logs.join("\n"))&&/lượt 1\/3/.test(K.logs.join("\n")),`K (≥3%) nhận rương (lượt 1/3), L (<3%) không nhận: "${L.logs.find(t=>/cần từ/.test(t))}"`);
    ok(meOf(L).xp>lxp||meOf(L).level>15,`L vẫn nhận kinh nghiệm (${lxp} -> ${meOf(L).xp}, cấp ${meOf(L).level})`);
    ok(await waitFor(()=>A.chats.some(m=>/Tà hóa Huyết Nguyệt Lang Vương ở Tinh Đấu Ngoại vi đã bị hạ/.test(m.text)),1500),`toàn server được báo: "${A.chats.find(m=>/bị hạ/.test(m.text))?.text}"`);

    // Lần 2: L đóng góp 5% thì có rương. Lần 3: K đủ 3 lượt. Lần 4: hết lượt, vẫn đánh được, nhắc khi vào giao chiến.
    const fight=async(share)=>{ await test(K,"king",{kop:"spawn"}); await waitFor(()=>kingB(),1500); await intoLair(K,40,0); if(share) await intoLair(L,-40,0); else await outLair(L);
      await test(K,"clear",{keep:1}); await test(K,"kdmg",{v:1}); await test(K,"status",{s:"stun",secs:60}); return finish(share); };
    K.logs=[]; L.logs=[]; f=await fight(0.05);
    ok(await waitFor(()=>chestK(L)===1&&chestK(K)===2,2000)&&/lượt 1\/3/.test(L.logs.join("\n"))&&/lượt 2\/3/.test(K.logs.join("\n")),`lần 2: L đóng góp ${f.down?.list.find(x=>x.id===L.room.sessionId)?.pct}% nhận rương (1/3), K 2/3`);
    K.logs=[]; await fight(0); ok(await waitFor(()=>chestK(K)===3,2000)&&/lượt 3\/3/.test(K.logs.join("\n")),"lần 3: K nhận rương thứ 3 (3/3)");
    K.logs=[]; f=await fight(0); await sleep(300);
    ok(f.down&&chestK(K)===3&&/Hôm nay đã hết lượt nhận thưởng thú vương/.test(K.logs.join("\n")),`lần 4: vẫn hạ được nhưng không nhận rương, có nhắc: "${K.logs.find(t=>/hết lượt/.test(t))}"`);
    ok(K.logs.findIndex(t=>/hết lượt/.test(t))<K.logs.findIndex(t=>/^Hạ Tà hóa/.test(t)),"nhắc hết lượt ngay khi vào giao chiến (trước lúc hạ)");
    let cl=await test(K,"claims"); ok(cl.n===3&&cl.db===3,`lượt hôm nay ${cl.day}: ${cl.n} (DB ${cl.db})`);

    // Mở rương: hồn cốt (loài gốc, năm thú vương), mảnh của bản đồ, mảnh UR; cần 3 ô trống.
    const pool=kingShardPool("tinh_dau_ngoai_vi"), chestIt=()=>K.bag.items.find(i=>i.code===chestCode("huyet_nguyet_lang_vuong"));
    async function open(){ const l=K.logs.length, n=K.bagMsgs; K.room.send("open",{id:chestIt().id}); await waitFor(()=>K.logs.length>l&&K.bagMsgs>n,1500); await sleep(100); return K.logs.at(-1)??""; }
    const s0=qtyOf(K,shardCode(pool[0].vohon)), ur0=KING_CHEST.urShards.reduce((a,v)=>a+qtyOf(K,shardCode(v)),0), b0=bonesOf(K).length;
    await test(K,"chest",{bone:0,ur:0,i:0,n:4,s:1}); let lg=await open();
    const nb=bonesOf(K).find(i=>i.years===Y&&i.stats?.beast==="phong_lang"&&i.stats?.slot==="than");
    ok(chestK(K)===2&&bonesOf(K).length===b0+1&&nb&&qtyOf(K,shardCode(pool[0].vohon))===s0+4&&KING_CHEST.urShards.reduce((a,v)=>a+qtyOf(K,shardCode(v)),0)===ur0+1,`mở rương: ${lg}`);
    const s3=qtyOf(K,shardCode(pool[3].vohon)), b1=bonesOf(K).length;
    await test(K,"chest",{bone:100,ur:100,i:3}); lg=await open(); const got=qtyOf(K,shardCode(pool[3].vohon))-s3;
    ok(pool[3].vohon===KING_CHEST.fire&&got>=KING_CHEST.shards[0]&&got<=KING_CHEST.shards[1]&&bonesOf(K).length===b1&&chestK(K)===1,`mở rương lần 2 (không hồn cốt, không UR): ${lg}`);
    ok(pool.some(x=>x.vohon==="bich_lan_xa_hoang")&&pool.filter(x=>MAPS.tinh_dau_ngoai_vi.shards.includes(x.vohon)).length===3,`mảnh trong rương: của bản đồ, Tà Hỏa Phượng Hoàng, võ hồn bản đồ chưa mở (${pool.map(x=>x.vohon).join(", ")})`);
    // Túi còn dưới 3 ô trống: không mở được, rương còn nguyên.
    const free=BAG_SLOTS-K.bag.items.filter(i=>i.vohon===null).length; await test(K,"give",{code:"hon_hoan",qty:free-2,years:10}); await sleep(100);
    lg=await open(); ok(/Cần 3 ô trống/.test(lg)&&chestK(K)===1,`túi còn 2 ô trống: "${lg}"`);
    for(const it of K.bag.items.filter(i=>i.code==="hon_hoan"&&i.years===10)){ K.room.send("discard",{id:it.id}); } await waitFor(()=>!K.bag.items.some(i=>i.code==="hon_hoan"&&i.years===10),2000);
    await test(K,"chest",{off:1});

    // Lưu: thoát rồi vào lại vẫn còn rương, lượt hôm nay vẫn 3.
    await K.room.leave(); await sleep(400); await enter(K); await waitFor(()=>K.bag&&K.room.state.players&&meOf(K));
    cl=await test(K,"claims"); ok(chestK(K)===1&&cl.n===3&&cl.db===3,`vào lại: còn ${chestK(K)} rương, lượt hôm nay ${cl.n}/3 (DB ${cl.db})`);
    // Sang ngày mới (00:00 giờ Việt Nam): lượt đặt lại.
    const dy=await test(K,"day",{shift:1}); cl=await test(K,"claims"); K.logs=[]; await fight(0);
    ok(cl.n===0&&await waitFor(()=>chestK(K)===2,2000)&&/lượt 1\/3/.test(K.logs.join("\n")),`ngày ${dy.day}: lượt về 0, hạ thú vương lại nhận rương (1/3)`);
    await test(K,"day",{shift:0});

    // Rút đi: không ai hạ trong 15 phút thì thú vương rời bản đồ, toàn server được báo; người vào sau thấy thời gian còn lại.
    await test(K,"king",{kop:"spawn"}); await waitFor(()=>kingB(),1500);
    await L.room.leave(); await sleep(300); await enter(L); await waitFor(()=>L.room.state.players&&meOf(L));
    ok(await waitFor(()=>L.boss.some(m=>m.k==="here"&&m.life>KING.lifeSecs-30),1500),`L vào lại khi thú vương đang ở bản đồ: còn ${Math.round(L.boss.find(m=>m.k==="here")?.life)} giây trước khi rút đi`);
    A.chats=[]; K.boss=[]; await test(K,"etick",{s:KING.lifeSecs});
    ok(await waitFor(()=>!kingB()&&K.boss.some(m=>m.k==="leave")&&A.chats.some(m=>/đã rút đi/.test(m.text)),1500),`hết ${KING.lifeSecs/60} phút: rút đi ("${A.chats.find(m=>/rút đi/.test(m.text))?.text}")`);
    await K.room.leave(); await L.room.leave();
  }
  // ---------- 3.2: hạ hồn thú -> hồn hoàn mang đúng số năm -> nhặt vào túi; ưu tiên người hạ 15 giây; túi đầy; hấp thụ từ túi ----------
  {
    const zs=tiled.layers.flatMap(l=>l.objects??[]).filter(o=>(o.type??o.class)==="zone"), hz=zs.find(z=>/Bãi tập/.test(z.name))??zs[0];
    let spot=null; for(let k=0;k<400&&!spot;k++){ const x=Math.round(hz.x+30+Math.random()*(hz.width-60)), y=Math.round(hz.y+40+Math.random()*(hz.height-80)); if(!blocked(x,y)) spot={x,y}; }
    await test(A,"goto",spot); ok(await waitFor(()=>Math.hypot(p.x-spot.x,p.y-spot.y)<1),`A tới ${hz.name} (${spot.x},${spot.y})`);
    await test(A,"clear");
    await test(A,"bone",{r:100}); // 4.1: hồn cốt rơi ngẫu nhiên (1% ở 1.234 năm) không xen vào các kiểm tra hồn hoàn, mảnh võ hồn
    const ringsOf=b=>(b.bag?.items??[]).filter(i=>i.code===RING_ITEM), bp=()=>meOf(B);
    /** Đặt hồn thú 1 máu `years` năm (loài `species`, mặc định loài đầu; `boss`: tinh anh BĐ4) ngay chỗ A đứng (hook test), A đánh hạ; trả về hồn hoàn vừa rơi. */
    async function killFor(years,species,boss){
      const before=new Set(st.drops.keys()), fresh=()=>[...st.drops.keys()].find(k=>!before.has(k));
      await test(A,"beast",{dx:0,dy:0,years,species,boss});
      for(let i=0;i<15&&!fresh();i++){ A.room.send("attack"); await waitFor(fresh,450); }
      const id=fresh(); return id?{id,dr:st.drops.get(id)}:null;
    }
    const k1=await killFor(437);
    ok(k1&&k1.dr.years===437&&k1.dr.tier===tierOfYears(437)&&k1.dr.owner===A.room.sessionId,`hạ hồn thú 437 năm: hồn hoàn rơi ${k1?.dr.years} năm, màu ${TIERS[k1?.dr.tier??0].color}, thuộc A`);
    ok(A.logs.some(t=>/^Hạ .*437 năm.*Hồn hoàn 437 năm/.test(t)),"thông báo hạ hồn thú kèm số năm");
    if(k1){
      await test(B,"goto",{x:k1.dr.x,y:k1.dr.y}); await waitFor(()=>Math.hypot(bp().x-k1.dr.x,bp().y-k1.dr.y)<1);
      const b0=ringsOf(B).length; B.room.send("pickup");
      ok(await lastLog(B,/thuộc về người hạ/)&&st.drops.has(k1.id)&&ringsOf(B).length===b0,`B không nhặt được trong ${DROP_OWNER_SECS} giây đầu: ${B.logs.at(-1)}`);
      const a0=ringsOf(A).length; A.room.send("pickup");
      ok(await waitFor(()=>ringsOf(A).length===a0+1)&&await waitFor(()=>!st.drops.has(k1.id)),"A nhặt hồn hoàn của mình");
      ok(ringsOf(A).some(i=>i.years===437&&i.qty===1&&i.kind==="hon_hoan"),"túi A có hồn hoàn đúng 437 năm (mỗi chiếc một ô)");
      ok(!ringsOf(B).some(i=>i.years===437),"túi B không có hồn hoàn của A");
    }
    // Hết thời gian ưu tiên thì ai cũng nhặt được.
    const k2=await killFor(1234);
    if(k2){
      B.room.send("pickup"); ok(await lastLog(B,/thuộc về người hạ/),"B chưa nhặt được hồn hoàn 1.234 năm");
      await test(A,"drops",{s:DROP_OWNER_SECS});
      B.room.send("pickup"); ok(await waitFor(()=>ringsOf(B).some(i=>i.years===1234))&&await waitFor(()=>!st.drops.has(k2.id)),`hết ${DROP_OWNER_SECS} giây: B nhặt được hồn hoàn 1.234 năm`);
    }
    // Túi đầy: báo, hồn hoàn ở lại dưới đất; bỏ bớt một ô rồi nhặt được.
    const free=BAG_SLOTS-A.bag.items.filter(i=>i.vohon===null).length;
    await test(A,"give",{code:RING_ITEM,qty:free,years:50});
    ok(A.bag.items.length===BAG_SLOTS,`túi A đầy ${A.bag.items.length}/${BAG_SLOTS} ô`);
    const k3=await killFor(88);
    if(k3){
      A.room.send("pickup"); ok(await lastLog(A,/Túi đồ đã đầy/)&&st.drops.has(k3.id),`túi đầy: ${A.logs.at(-1)}`);
      const junk=ringsOf(A).find(i=>i.years===50);
      B.room.send("discard",{id:junk.id}); ok(await lastLog(B,/Không có vật phẩm/)&&A.bag.items.some(i=>i.id===junk.id),"B không bỏ được đồ trong túi A");
      A.room.send("discard",{id:junk.id}); ok(await waitFor(()=>!A.bag.items.some(i=>i.id===junk.id)),"A bỏ một hồn hoàn trong túi");
      A.room.send("pickup"); ok(await waitFor(()=>ringsOf(A).some(i=>i.years===88)),"bỏ bớt rồi nhặt được hồn hoàn 88 năm");
    }
    for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
    ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
    // ---------- 3.3: hấp thụ từ túi theo giới hạn của truyện, tỉ lệ thất bại, thất bại thì mất hồn hoàn; đủ 10 vòng, cấp 100 ----------
    ok(same([1,2,3,4,5,6,7,8,9,10].map(ringLimit),[423,764,1760,5000,12000,20000,50000,100000,100000,100000]),"giới hạn hấp thụ theo vòng = bảng 5.2");
    const ac=(y,s)=>{ const c=absorbChance(y,s); return [c.over,c.fail]; };
    ok(same(ac(423,1),[0,0])&&same(ac(528,1),[25,0.3])&&same(ac(529,1),[26,0.6])&&same(ac(634,1),[50,0.6])&&same(ac(846,1),[100,0.9])&&same(ac(847,1),[101,null])&&same(ac(MAX_YEARS,8),[0,0]),
      "tỉ lệ thất bại theo % vượt: ≤25% 30%, ≤50% 60%, ≤100% 90%, >100% không cho");
    ok(absorbSecs(10)===3&&absorbSecs(1000)===9&&absorbSecs(MAX_YEARS)===15,`thời gian hấp thụ: 10 năm ${absorbSecs(10)} giây, 1.000 năm ${absorbSecs(1000)} giây, 100.000 năm ${absorbSecs(MAX_YEARS)} giây`);
    // Làng (vùng an toàn) để hồn thú không đánh gián đoạn.
    const camp={x:Math.round(spawnObj.x+spawnObj.width/2),y:Math.round(spawnObj.y+spawnObj.height/2)};
    await test(A,"goto",camp); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
    const act=A.owned.active, bench=A.owned.list.find(v=>v.rowId!==act)?.rowId;
    /** Thêm một hồn hoàn `years` năm vào túi A (hook give) và trả về ô đó. */
    const give=async(b,years)=>{ const had=new Set(ringsOf(b).map(i=>i.id)); await test(b,"give",{code:RING_ITEM,qty:1,years}); await waitFor(()=>ringsOf(b).some(i=>!had.has(i.id))); return ringsOf(b).find(i=>!had.has(i.id)); };
    /** Gửi absorb {itemId, vohonId}; trả về tin "absorbing" bắt đầu, hoặc null nếu bị từ chối (dòng log cuối là lý do). */
    async function absorb(b,itemId,vohonId){ b.absorbing=null; const l=b.logs.length; b.room.send("absorb",{itemId,vohonId}); await waitFor(()=>b.absorbing?.on||b.logs.length>l,1500); await sleep(80); return b.absorbing?.on?b.absorbing:null; }
    /** Hook rush: kết thúc hấp thụ ngay (cùng hàm finishAbsorb của server); trả về kết quả ok / fail / cancel. */
    async function rush(b){ b.absorbing=null; await test(b,"rush"); await waitFor(()=>b.absorbing&&!b.absorbing.on,1500); return b.absorbing?.result; }
    const has=(b,it)=>b.bag.items.some(i=>i.id===it.id);
    const r437=ringsOf(A).find(i=>i.years===437)??await give(A,437);
    await test(A,"set",{rowId:act,level:5,xp:0,rings:[]});
    ok(!await absorb(A,r437.id,act)&&/cần đạt cấp 10/.test(A.logs.at(-1)),`chưa tới bình cảnh: ${A.logs.at(-1)}`);
    ok(!await absorb(B,r437.id,act)&&/Hãy chọn một hồn hoàn/.test(B.logs.at(-1)),"B không hấp thụ được hồn hoàn trong túi A");
    const rB=await give(B,60);
    ok(!await absorb(B,rB.id,act)&&/không sở hữu/.test(B.logs.at(-1)),"B không hấp thụ vào võ hồn của A");
    B.room.send("discard",{id:rB.id});
    const dan=A.bag.items.find(i=>i.code!==RING_ITEM);
    if(dan) ok(!await absorb(A,dan.id,act)&&/Hãy chọn một hồn hoàn/.test(A.logs.at(-1)),"không hấp thụ được đan dược");
    await test(A,"set",{rowId:act,level:10,xp:0,rings:[]});
    await test(A,"hurt",{pct:0});
    ok(!await absorb(A,r437.id,act)&&/giao chiến/.test(A.logs.at(-1)),`đang giao chiến: ${A.logs.at(-1)}`);
    await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
    const r847=await give(A,847);
    ok(!await absorb(A,r847.id,act)&&/101%.*không thể hấp thụ/.test(A.logs.at(-1))&&has(A,r847),`vượt >100% bị từ chối, hồn hoàn còn trong túi: ${A.logs.at(-1)}`);
    // Trong giới hạn: luôn thành công kể cả khi cố định số ngẫu nhiên xấu nhất (0); chờ đúng thời gian thật (3 giây cho 10 năm).
    await test(A,"roll",{r:0});
    const r10=await give(A,10), t0=Date.now(), s1=await absorb(A,r10.id,act);
    ok(s1&&s1.fail===0&&s1.slot===1&&s1.secs===absorbSecs(10)&&p.absorb>0,`bắt đầu hấp thụ 10 năm vào vòng 1: ${JSON.stringify(s1)}`);
    A.room.send("discard",{id:r10.id}); ok(await lastLog(A,/Đang hấp thụ/),"không bỏ được hồn hoàn đang hấp thụ");
    ok(await waitFor(()=>A.absorbing&&!A.absorbing.on,(absorbSecs(10)+2)*1000)&&A.absorbing.result==="ok"&&Date.now()-t0>=absorbSecs(10)*1000-300,
      `trong giới hạn (số ngẫu nhiên 0): thành công sau ${((Date.now()-t0)/1000).toFixed(1)} giây`);
    ok(await waitFor(()=>p.rings.length===1&&p.level===11&&!has(A,r10)),`thành công: cấp ${p.level}, ${p.rings.length} hồn hoàn, hồn hoàn rời túi`);
    ok(same(vOf(act)?.rings,[10]),`võ hồn lưu số năm vào vòng: ${JSON.stringify(vOf(act)?.rings)}`);
    // Vượt giới hạn có tỉ lệ: cố định số ngẫu nhiên 0,10 < 30% -> thất bại, mất hồn hoàn, không phạt gì thêm.
    await test(A,"set",{rowId:act,level:20,xp:0,rings:[10]}); await test(A,"roll",{r:10});
    const r900=await give(A,900), hp0=p.hp, s2=await absorb(A,r900.id,act);
    ok(s2&&s2.over===18&&s2.fail===0.3,`hồn hoàn 900 năm vào vòng 2 (giới hạn 764): vượt ${s2?.over}%, ${s2?.fail} thất bại`);
    ok(await rush(A)==="fail"&&await waitFor(()=>!has(A,r900))&&p.rings.length===1&&p.level===20&&p.hp===hp0&&p.xpNeed===0,
      `thất bại: mất hồn hoàn, vẫn ${p.rings.length} hồn hoàn, cấp ${p.level}, sinh lực ${p.hp}/${hp0}, còn ở bình cảnh`);
    ok(/Thất bại.*900 năm vỡ tan/.test(A.logs.at(-1)??""),`thông báo thất bại: ${A.logs.at(-1)}`);
    // Vượt đúng 100% (90% thất bại), số ngẫu nhiên 0,99 -> thành công, lưu đúng số năm.
    await test(A,"roll",{r:99});
    const r1528=await give(A,1528), s3=await absorb(A,r1528.id,act);
    ok(s3&&s3.over===100&&s3.fail===0.9,"hồn hoàn 1.528 năm vào vòng 2: vượt 100%, 90% thất bại");
    ok(await rush(A)==="ok"&&await waitFor(()=>p.rings.length===2&&p.level===21)&&same(vOf(act)?.rings,[10,1528]),`vượt giới hạn nhưng thành công: ${JSON.stringify(vOf(act)?.rings)}, cấp ${p.level}`);
    // Di chuyển hoặc bị đánh thì hủy, không mất gì.
    await test(A,"set",{rowId:act,level:30,xp:0,rings:[10,1528]});
    const r1700=await give(A,1700);
    ok(await absorb(A,r1700.id,act),"bắt đầu hấp thụ 1.700 năm vào vòng 3");
    A.absorbing=null; A.room.send("input",{x:1,y:0}); await sleep(250); A.room.send("input",{x:0,y:0});
    ok(await waitFor(()=>A.absorbing?.result==="cancel")&&/hủy hấp thụ/.test(A.logs.at(-1))&&p.absorb===0&&p.rings.length===2&&has(A,r1700),"di chuyển: hủy, hồn hoàn vẫn trong túi");
    await test(A,"goto",camp);
    ok(await absorb(A,r1700.id,act),"hấp thụ lại");
    A.absorbing=null; await test(A,"hurt",{pct:1});
    ok(await waitFor(()=>A.absorbing?.result==="cancel")&&p.rings.length===2&&has(A,r1700),"bị đánh: hủy, hồn hoàn vẫn trong túi");
    await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
    // Chọn võ hồn khác (không ra trận) đang ở bình cảnh.
    if(bench){
      await test(A,"set",{rowId:bench,level:10,xp:0,rings:[]});
      const r300=await give(A,300), s4=await absorb(A,r300.id,bench);
      ok(s4&&s4.rowId===bench&&s4.fail===0,`hấp thụ vào ${VOHON[vohonIndex(vOf(bench).vohon)].name} (không ra trận)`);
      ok(await rush(A)==="ok"&&await waitFor(()=>same(vOf(bench)?.rings,[300])&&vOf(bench).level===11)&&p.rings.length===2&&!has(A,r300),
        `võ hồn không ra trận: ${JSON.stringify(vOf(bench)?.rings)}, cấp ${vOf(bench)?.level}; võ hồn ra trận không đổi`);
    }
    // Lên đủ 10 vòng, cấp 100 (hook set đặt 9 vòng ở cấp 100 = bình cảnh cuối).
    await test(A,"roll",{r:-1});
    const nine=[400,700,1700,5000,12000,20000,50000,100000,100000];
    await test(A,"set",{rowId:act,level:MAX_LEVEL,xp:0,rings:nine});
    ok(p.level===MAX_LEVEL&&p.rings.length===9&&p.xpNeed===0,`cấp ${p.level}, 9 hồn hoàn: bình cảnh cuối`);
    const rRed=await give(A,MAX_YEARS), s5=await absorb(A,rRed.id,act);
    ok(s5&&s5.slot===10&&s5.fail===0&&s5.secs===15,`hồn hoàn 100.000 năm vào vòng 10: ${JSON.stringify(s5)}`);
    ok(await rush(A)==="ok"&&await waitFor(()=>p.rings.length===MAX_RINGS)&&p.level===MAX_LEVEL&&p.xpNeed===0&&p.rings[9]===4,`đủ ${p.rings.length} hồn hoàn, cấp ${p.level} (tối đa)`);
    ok(p.maxHp===calcStats(p.vh,MAX_LEVEL,[...p.rings]).maxHp,`vòng 5–10 tăng chỉ số: sinh lực tối đa ${p.maxHp}`);
    await test(A,"kill",{tier:4}); await sleep(100);
    ok(p.level===MAX_LEVEL&&p.xp===0,"cấp tối đa: không nhận thêm kinh nghiệm");
    const r50=await give(A,50);
    ok(!await absorb(A,r50.id,act)&&/đủ 10 hồn hoàn/.test(A.logs.at(-1)),`không hấp thụ vòng 11: ${A.logs.at(-1)}`);
    ok(same(vOf(act)?.rings,[...nine,MAX_YEARS]),"võ hồn lưu đủ 10 vòng");
    for(const i of ringsOf(A).filter(i=>[437,847,1700,50].includes(i.years))) A.room.send("discard",{id:i.id});
    await waitFor(()=>!ringsOf(A).some(i=>[437,847,1700,50].includes(i.years)),3000);
    // ---------- 3.4: mảnh võ hồn rơi theo bản đồ, mở võ hồn bằng 50 mảnh, lên sao 20/40/80/120/200 ----------
    ok(same([1,2,3,4,5,6].map(starCost),[...STAR_COST,null])&&same(STAR_COST,[20,40,80,120,200])&&MAX_STARS===6&&SHARD_UNLOCK===50,"giá lên sao 20/40/80/120/200, mở võ hồn 50 mảnh");
    ok(shardChance(437)===0.1&&shardChance(1000)===0.15&&shardChance(25000)===0.2&&shardChance(MAX_YEARS)===1,"tỉ lệ rơi mảnh theo niên hạn: 10% / 15% / 20% / 100%");
    ok(Object.values(MAPS).every(m=>m.kind!=="hunt"||(m.shards.length>=2&&m.shards.length<=3))&&Object.values(MAPS).every(m=>m.shards.every(id=>vohonIndex(id)>=0&&itemDef(shardCode(id))?.kind==="manh_vo_hon")),
      "mỗi bản đồ săn rơi mảnh của 2–3 võ hồn có thật");
    ok(calcStats(0,30,[1,1],6).maxHp>calcStats(0,30,[1,1],1).maxHp&&starMult(1)===1&&starMult(MAX_STARS)>starMult(2),"mỗi sao tăng chỉ số gốc");
    const list=MAPS[st.mapId].shards, gift=list.indexOf("lam_ngan_thao"), ui=list.findIndex(id=>!A.owned.list.some(v=>v.vohon===id));
    const nv=list[ui], nvName=VOHON[vohonIndex(nv)].name, nvCode=shardCode(nv), giftCode=shardCode("lam_ngan_thao");
    ok(gift>=0&&ui>=0,`Thánh Hồn Thôn rơi mảnh Lam Ngân Thảo và ${nvName} (A chưa có)`);
    await test(A,"goto",spot); await test(A,"clear");
    // Các phần trên hạ hồn thú với tỉ lệ rơi mảnh thật (10%): bỏ mảnh của hai võ hồn sắp thử để bắt đầu từ 0, B ghi số mảnh đang có.
    for(const i of A.bag.items.filter(i=>i.code===nvCode||i.code===giftCode)) A.room.send("discard",{id:i.id});
    ok(await waitFor(()=>qtyOf(A,nvCode)===0&&qtyOf(A,giftCode)===0,3000),"bắt đầu từ 0 mảnh");
    const bNv=qtyOf(B,nvCode), bGift=qtyOf(B,giftCode), log0=A.logs.length;
    /** Gửi unlock / starup rồi chờ dòng log trả lời (thành công thì kèm tin vohons và bag). */
    async function shardOp(b,type,vohon){ const l=b.logs.length; b.room.send(type,{vohon}); await waitFor(()=>b.logs.length>l,2000); await sleep(150); return b.logs.at(-1)??""; }
    const vohonOf=(b,id)=>b.owned.list.find(v=>v.vohon===id);
    // Số ngẫu nhiên 0,99 ≥ 10%: hạ hồn thú 437 năm không rơi mảnh; 0,05 < 10%: rơi đúng một mảnh của võ hồn được chọn, vào thẳng túi.
    await test(A,"shard",{r:99});
    const n0=qtyOf(A,nvCode); await killFor(437); await sleep(150);
    ok(qtyOf(A,nvCode)===n0&&!A.logs.slice(log0).some(t=>/^Nhận \d+ Mảnh/.test(t)),"số ngẫu nhiên 0,99: không rơi mảnh");
    await test(A,"shard",{r:5,i:ui});
    await killFor(437);
    ok(await waitFor(()=>qtyOf(A,nvCode)===n0+1)&&A.bag.items.some(i=>i.code===nvCode&&i.kind==="manh_vo_hon"),`số ngẫu nhiên 0,05: rơi 1 Mảnh ${nvName} vào túi`);
    ok(A.logs.some(t=>t===`Nhận 1 Mảnh ${nvName} (${n0+1}/${SHARD_UNLOCK}).`),`thông báo nhận mảnh kèm tiến độ: ${A.logs.filter(t=>/^Nhận/.test(t)).at(-1)}`);
    ok(qtyOf(B,nvCode)===bNv,"mảnh vào túi người hạ, không vào túi người khác");
    // Túi đầy: mảnh rơi xuống đất cạnh hồn hoàn, cùng luật ưu tiên người hạ; bỏ bớt rồi nhặt được.
    {
      const freeA=BAG_SLOTS-A.bag.items.filter(i=>i.vohon===null).length;
      await test(A,"give",{code:RING_ITEM,qty:freeA,years:50});
      await test(A,"shard",{r:5,i:gift});
      // Hồn hoàn của các lần hạ trước nằm đúng chỗ này: cho hết hạn, nếu không khi mảnh rơi chồng lên (ô cạnh bên không đứng được)
      // thì B nhấn nhặt sẽ trúng hồn hoàn cũ thay cho mảnh.
      await test(A,"drops",{s:3600}); await waitFor(()=>!st.drops.size,1000);
      const before=new Set(st.drops.keys()); await killFor(88);
      const sid=[...st.drops.keys()].find(k=>!before.has(k)&&st.drops.get(k).item===giftCode), sd=sid&&st.drops.get(sid);
      ok(sd&&sd.qty===1&&sd.owner===A.room.sessionId&&qtyOf(A,giftCode)===0&&/Túi đồ đã đầy.*Mảnh Lam Ngân Thảo rơi xuống đất/.test(A.logs.find(t=>/Mảnh Lam Ngân Thảo rơi/.test(t))??""),
        `túi đầy: Mảnh Lam Ngân Thảo rơi xuống đất, thuộc A`);
      if(sd){
        await test(B,"goto",{x:sd.x,y:sd.y}); await waitFor(()=>Math.hypot(bp().x-sd.x,bp().y-sd.y)<1);
        await test(A,"goto",{x:sd.x,y:sd.y}); await waitFor(()=>Math.hypot(p.x-sd.x,p.y-sd.y)<1);
        B.room.send("pickup"); ok(await lastLog(B,/Mảnh Lam Ngân Thảo thuộc về người hạ/)&&st.drops.has(sid)&&qtyOf(B,giftCode)===bGift,`B không nhặt được mảnh của A: ${B.logs.at(-1)}`);
        // Mảnh có thể nằm chồng lên hồn hoàn (chỗ cạnh bên không đứng được): nhặt hồn hoàn trước thì nhấn E thêm lần nữa.
        const l0=A.logs.length; A.room.send("pickup");
        ok(await waitFor(()=>A.logs.length>l0)&&A.logs.slice(l0).some(t=>/^Túi đồ đã đầy \(40 ô\): bỏ bớt/.test(t))&&st.drops.has(sid),`A túi đầy: ${A.logs.at(-1)}`);
        for(let k=0;k<3&&qtyOf(A,giftCode)===0;k++){
          const junk=ringsOf(A).find(i=>i.years===50); A.room.send("discard",{id:junk.id}); await waitFor(()=>!A.bag.items.some(i=>i.id===junk.id));
          A.room.send("pickup"); await waitFor(()=>qtyOf(A,giftCode)===1,1000);
        }
        ok(qtyOf(A,giftCode)===1&&await waitFor(()=>!st.drops.has(sid)),"bỏ bớt rồi A nhặt được Mảnh Lam Ngân Thảo");
      }
      for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
      ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
    }
    await test(A,"shard",{r:-1});
    await test(A,"goto",camp);
    // Mở võ hồn: thiếu mảnh bị từ chối; đủ 50 thì mở (cấp 1, 1 sao), mảnh bị trừ; mở lần hai bị từ chối.
    ok(/Cần 50 Mảnh .* mới có 1/.test(await shardOp(A,"unlock",nv))&&!vohonOf(A,nv),`thiếu mảnh: ${A.logs.at(-1)}`);
    await test(A,"give",{code:nvCode,qty:SHARD_UNLOCK-2});
    ok(/mới có 49/.test(await shardOp(A,"unlock",nv))&&qtyOf(A,nvCode)===49,"49 mảnh: vẫn bị từ chối, không mất mảnh");
    ok(/không tồn tại/.test(await shardOp(A,"unlock","khong_co")),"võ hồn không tồn tại bị từ chối");
    ok(/Đã sở hữu/.test(await shardOp(A,"unlock","lam_ngan_thao")),"võ hồn đã sở hữu thì không mở lại");
    await test(A,"give",{code:nvCode,qty:3});
    if(bNv<SHARD_UNLOCK) ok(/Cần 50 Mảnh/.test(await shardOp(B,"unlock",nv))&&!vohonOf(B,nv),"B không dùng được mảnh trong túi A");
    const cnt=A.owned.list.length;
    ok(/^Mở võ hồn /.test(await shardOp(A,"unlock",nv))&&await waitFor(()=>vohonOf(A,nv))&&A.owned.list.length===cnt+1,`đủ 50 mảnh: mở ${nvName}`);
    const nvRow=vohonOf(A,nv);
    ok(nvRow?.level===1&&nvRow.stars===1&&!A.owned.team.includes(nvRow.rowId)&&await waitFor(()=>qtyOf(A,nvCode)===2),`${nvName} cấp ${nvRow?.level}, ${nvRow?.stars} sao; trừ đúng 50 mảnh (còn ${qtyOf(A,nvCode)})`);
    ok(/Đã sở hữu/.test(await shardOp(A,"unlock",nv))&&A.owned.list.length===cnt+1,"mở lần hai bị từ chối");
    // Lên sao: thiếu mảnh bị từ chối; đủ thì lên, trừ đúng giá; tới 6★ thì dừng.
    ok(/Cần 20 Mảnh .* lên 2★, mới có 2/.test(await shardOp(A,"starup",nv)),`lên sao thiếu mảnh: ${A.logs.at(-1)}`);
    ok(/Chưa sở hữu/.test(await shardOp(B,"starup",nv)),"B chưa sở hữu thì không lên sao được");
    await test(A,"give",{code:nvCode,qty:18});
    ok(/lên 2★/.test(await shardOp(A,"starup",nv))&&vohonOf(A,nv).stars===2&&await waitFor(()=>qtyOf(A,nvCode)===0),"20 mảnh: lên 2★, hết mảnh");
    await test(A,"give",{code:nvCode,qty:STAR_COST.slice(1).reduce((a,b)=>a+b,0)+5});
    for(let s=3;s<=MAX_STARS;s++) await shardOp(A,"starup",nv);
    ok(vohonOf(A,nv).stars===MAX_STARS&&await waitFor(()=>qtyOf(A,nvCode)===5),`lên tới ${vohonOf(A,nv).stars}★, còn ${qtyOf(A,nvCode)} mảnh dư`);
    ok(/đã đạt 6★/.test(await shardOp(A,"starup",nv))&&vohonOf(A,nv).stars===MAX_STARS&&qtyOf(A,nvCode)===5,"6★: không lên thêm, không mất mảnh");
    // Lên sao võ hồn đang ra trận: chỉ số gốc tăng ngay.
    const actId=vOf(act).vohon, actStars=vOf(act).stars, cost=starCost(actStars), hp0s=p.maxHp;
    if(cost){
      await test(A,"give",{code:shardCode(actId),qty:cost});
      await shardOp(A,"starup",actId);
      ok(vOf(act).stars===actStars+1&&await waitFor(()=>p.maxHp===calcStats(p.vh,p.level,[...p.rings],actStars+1).maxHp)&&p.maxHp>hp0s,
        `võ hồn ra trận lên ${actStars+1}★: sinh lực tối đa ${hp0s} -> ${p.maxHp}`);
    }
    for(const i of A.bag.items.filter(i=>i.code===nvCode)) A.room.send("discard",{id:i.id});
    await waitFor(()=>qtyOf(A,nvCode)===0,3000);
    // ---------- 4.1: hồn cốt rơi theo bảng 5.3 (0% / 1% / 4% / 20%), mang loài và số năm của hồn thú, vị trí ngẫu nhiên; nằm trong túi ----------
    ok(boneChance(999)===0&&boneChance(1000)===0.01&&boneChance(9999)===0.01&&boneChance(10000)===0.04&&boneChance(MAX_YEARS-1)===0.04&&boneChance(MAX_YEARS)===0.2,
      "tỉ lệ rơi hồn cốt theo niên hạn: 0% / 1% / 4% / 20%");
    ok(same(BONE_SLOTS.map(s=>s.name),["Đầu","Thân","Tay trái","Tay phải","Chân trái","Chân phải"])&&itemDef(BONE_ITEM)?.kind==="hon_cot"&&itemDef(BONE_ITEM).stack===1,
      "6 vị trí hồn cốt; hồn cốt không gộp (mỗi món một ô)");
    ok(BONE_SLOTS.every(s=>{ const a=boneStats(s.id,1000)[s.stat], b=boneStats(s.id,32000)[s.stat], c=boneStats(s.id,MAX_YEARS)[s.stat]; return a>0&&a<b&&b<c; }),
      `chỉ số gốc tăng theo số năm (Tay phải: ${[1000,32000,MAX_YEARS].map(y=>boneStats("tay_phai",y).atk).join(" / ")} công)`);
    const AK="am_kim_khung_trao_hung", akName=boneName(AK,"tay_phai",32000), slotOf=id=>BONE_SLOTS.findIndex(s=>s.id===id);
    ok(akName==="Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm",`tên hồn cốt: ${akName}`);
    await test(A,"goto",spot); await test(A,"clear");
    /** Hạ hồn thú `years` năm loài `species`; trả về hồn cốt vừa rơi (cùng lúc với hồn hoàn), hoặc undefined. */
    async function killBone(years,species,boss){
      const before=new Set(st.drops.keys()); await killFor(years,species,boss); await sleep(150);
      const e=[...st.drops.entries()].find(([k,d])=>!before.has(k)&&d.item===BONE_ITEM); return e&&{id:e[0],dr:e[1]};
    }
    /** A đứng lên hồn cốt rồi nhấn E (hồn cốt có thể chồng lên hồn hoàn: nhấn thêm); true khi hồn cốt đã rời mặt đất. */
    async function pickBone(kb){
      await test(A,"goto",{x:kb.dr.x,y:kb.dr.y}); await waitFor(()=>Math.hypot(p.x-kb.dr.x,p.y-kb.dr.y)<1);
      for(let k=0;k<3&&st.drops.has(kb.id);k++){ const l=A.logs.length; A.room.send("pickup"); await waitFor(()=>A.logs.length>l,1500); await waitFor(()=>!st.drops.has(kb.id),300); }
      return !st.drops.has(kb.id);
    }
    await test(A,"bone",{r:99});
    ok(!await killBone(32000,AK),"số ngẫu nhiên 0,99: hạ hồn thú 32.000 năm không rơi hồn cốt");
    await test(A,"bone",{r:0});
    ok(!await killBone(999),"hồn thú dưới 1.000 năm không bao giờ rơi hồn cốt (0%)");
    await test(A,"bone",{r:0,s:slotOf("tay_phai")});
    const nb0=bonesOf(A).length, kb=await killBone(32000,AK);
    ok(kb&&kb.dr.years===32000&&kb.dr.tier===tierOfYears(32000)&&kb.dr.species===beastIndex(AK)&&kb.dr.slot===slotOf("tay_phai")&&kb.dr.owner===A.room.sessionId,
      `hạ ${BEASTS[beastIndex(AK)].name} 32.000 năm (số ngẫu nhiên 0): hồn cốt rơi xuống đất, thuộc A`);
    ok(A.logs.some(t=>t.startsWith(`Hồn cốt ${akName} rơi xuống đất`)),"thông báo hồn cốt rơi kèm loài, vị trí, số năm");
    if(kb){
      await test(B,"goto",{x:kb.dr.x,y:kb.dr.y}); await waitFor(()=>Math.hypot(bp().x-kb.dr.x,bp().y-kb.dr.y)<1);
      const bb=bonesOf(B).length; B.room.send("pickup");
      ok(await lastLog(B,/Hồn cốt thuộc về người hạ/)&&st.drops.has(kb.id)&&bonesOf(B).length===bb,`B không nhặt được hồn cốt của A: ${B.logs.at(-1)}`);
      ok(await pickBone(kb)&&await waitFor(()=>bonesOf(A).length===nb0+1),"A nhặt hồn cốt vào túi");
      const it=bonesOf(A).at(-1);
      ok(it&&it.kind==="hon_cot"&&it.qty===1&&it.years===32000&&it.stats?.beast===AK&&it.stats?.slot==="tay_phai"&&it.enhance===0&&it.vohon===null,
        `túi A: hồn cốt ${it&&boneName(it.stats?.beast,it.stats?.slot,it.years)}, cường hóa +${it?.enhance}, chưa gắn`);
      ok(A.logs.some(t=>t.startsWith(`Nhặt hồn cốt ${akName} vào túi đồ`)),"thông báo nhặt hồn cốt");
      await useItem(A,it.id); ok(/không dùng trực tiếp/.test(A.logs.at(-1)??"")&&bonesOf(A).some(i=>i.id===it.id),"hồn cốt không dùng như đan được");
      const l=A.logs.length; A.room.send("absorb",{itemId:it.id}); await waitFor(()=>A.logs.length>l);
      ok(/Hãy chọn một hồn hoàn/.test(A.logs.at(-1)??"")&&bonesOf(A).some(i=>i.id===it.id),"hồn cốt không hấp thụ như hồn hoàn được");
    }
    // Vị trí ngẫu nhiên: hồn cốt 1.500 năm (1%, số ngẫu nhiên 0) có vị trí hợp lệ; mỗi món một ô.
    await test(A,"bone",{r:0});
    const kr=await killBone(1500);
    ok(kr&&kr.dr.years===1500&&kr.dr.slot<BONE_SLOTS.length&&await pickBone(kr)&&await waitFor(()=>bonesOf(A).length===nb0+2),
      `vị trí ngẫu nhiên: ${kr?BONE_SLOTS[kr.dr.slot]?.name:"?"}; hai hồn cốt nằm hai ô`);
    // Túi đầy: báo, hồn cốt ở lại dưới đất; bỏ bớt một ô rồi nhặt được.
    {
      const freeA=BAG_SLOTS-A.bag.items.filter(i=>i.vohon===null).length;
      await test(A,"give",{code:RING_ITEM,qty:freeA,years:50});
      // Chỗ mới, chưa có đồ rơi: nhấn E nhặt vật gần nhất, hồn hoàn của lần hạ trước nằm cùng chỗ thì sẽ bị nhặt nhầm.
      const clean=[[40,0],[-40,0],[0,40],[0,-40],[40,40],[-40,-40]].map(([dx,dy])=>({x:spot.x+dx,y:spot.y+dy}))
        .find(q=>!blocked(q.x,q.y)&&!blocked(q.x-8,q.y)&&![...st.drops.values()].some(d=>Math.hypot(d.x-q.x+8,d.y-q.y)<PICKUP_RANGE+8))??spot;
      await test(A,"goto",clean); await test(A,"bone",{r:0,s:slotOf("dau")});
      const kf=await killBone(12000,"quy_ho");
      ok(kf&&kf.dr.slot===slotOf("dau"),"hồn cốt Đầu 12.000 năm rơi khi túi A đầy");
      if(kf){
        await pickBone(kf);
        ok(st.drops.has(kf.id)&&A.logs.some(t=>t.startsWith(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt vật phẩm rồi mới nhặt được hồn cốt Quỷ Hổ – Đầu, 12.000 năm`)),
          `túi đầy: báo, hồn cốt ở lại dưới đất [${A.logs.slice(-3).join(" | ")}; còn dưới đất ${st.drops.has(kf.id)}, túi ${A.bag.items.length} ô]`);
        const junk=ringsOf(A).find(i=>i.years===50); A.room.send("discard",{id:junk.id}); await waitFor(()=>!A.bag.items.some(i=>i.id===junk.id));
        ok(await pickBone(kf)&&bonesOf(A).some(i=>i.years===12000&&i.stats?.slot==="dau"&&i.stats?.beast==="quy_ho"),"bỏ bớt rồi nhặt được hồn cốt Quỷ Hổ – Đầu");
      }
      for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
      ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
    }
    // BĐ4: tinh anh rơi hồn cốt với tỉ lệ x ELITE.bone (mục 5.4), hồn cốt mang loài gốc, quyền ưu tiên như hồn hoàn.
    {
      const near=(a,b)=>Math.abs(a-b)<1e-9, x3=ELITE.bone;
      ok(near(boneChance(999,x3),0)&&near(boneChance(1000,x3),0.01*x3)&&near(boneChance(10000,x3),0.04*x3)&&near(boneChance(MAX_YEARS,x3),0.2*x3)&&boneChance(MAX_YEARS,10)===1,
        `tỉ lệ hồn cốt của tinh anh x${x3}: ${[999,1000,10000,MAX_YEARS].map(y=>`${+(boneChance(y,x3)*100).toFixed(2)}%`).join(" / ")} (tối đa 100%)`);
      const HN="huyet_nhan_phong_lang", hb=BOSSES[bossIndex(HN)], base=beastIndex(hb.species);
      await test(A,"goto",spot); await test(A,"clear");
      // Số ngẫu nhiên 0,02: hồn thú thường 1.500 năm (1%) không rơi, tinh anh 1.500 năm (3%) rơi.
      await test(A,"bone",{r:2,s:slotOf("than")});
      ok(!await killBone(1500,hb.species),`số ngẫu nhiên 0,02: hạ ${BEASTS[base].name} thường 1.500 năm (${boneChance(1500)*100}%) không rơi hồn cốt`);
      A.elite=[]; const ke=await killBone(1500,undefined,HN);
      ok(ke&&ke.dr.years===1500&&ke.dr.species===base&&ke.dr.slot===slotOf("than")&&ke.dr.owner===A.room.sessionId&&await waitFor(()=>A.elite.some(m=>m.k==="down"),1000),
        `cùng số ngẫu nhiên: hạ ${beastName(1,bossIndex(HN))} 1.500 năm (${+(boneChance(1500,x3)*100).toFixed(2)}%) rơi hồn cốt ${ke?boneName(BEASTS[ke.dr.species]?.id,BONE_SLOTS[ke.dr.slot]?.id,ke.dr.years):"?"} (loài gốc), thuộc A`);
      await test(A,"bone",{r:4});
      ok(!await killBone(1500,undefined,HN),`số ngẫu nhiên 0,04 (trên ${+(boneChance(1500,x3)*100).toFixed(2)}%): tinh anh không rơi hồn cốt`);
    }
    await test(A,"bone",{r:-1});
    // ---------- 4.2: gắn hồn cốt vào 6 ô của võ hồn (đúng vị trí, đổi chỗ, tháo), cộng chỉ số; chỉ ngoài giao chiến ----------
    {
      /** Gửi equip / unequip; server luôn gửi lại túi và một dòng log (gắn, tháo hoặc lý do từ chối). Trả dòng log đó. */
      async function boneOp(type,msg){ const n=A.bagMsgs??0, l=A.logs.length; A.room.send(type,msg); await waitFor(()=>(A.bagMsgs??0)>n&&A.logs.length>l,2000); await sleep(80); return A.logs.at(-1)??""; }
      const eqOf=id=>A.bag.items.find(i=>i.id===id)?.vohon, loose=()=>A.bag.items.filter(i=>i.vohon===null).length;
      const act=A.owned.active, other=A.owned.list.find(v=>v.rowId!==act)?.rowId;
      const tp=bonesOf(A).find(i=>i.stats?.slot==="tay_phai"&&i.years===32000), hd=bonesOf(A).find(i=>i.stats?.slot==="dau"&&i.years===12000);
      const addAtk=boneStats("tay_phai",32000).atk, addMp=boneStats("dau",12000).mp;
      ok(same(boneBonus([{slot:"tay_phai",years:32000},{slot:"dau",years:12000},{slot:"than",years:1000}]),{hp:boneStats("than",1000).hp,mp:addMp,atk:addAtk}),
        "boneBonus cộng đúng chỉ số chính từng vị trí");
      ok(tp&&hd,"A có hồn cốt Tay phải 32.000 năm và Đầu 12.000 năm để gắn");
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const s0=await test(A,"stats");
      ok(same(s0.bones,{hp:0,mp:0,atk:0})&&s0.live.maxHp===s0.base.maxHp&&s0.live.maxMp===s0.base.maxMp,"chưa gắn: chỉ số võ hồn ra trận = chỉ số gốc");
      let t=await boneOp("equip",{itemId:tp.id,vohonId:act,slot:"dau"});
      ok(/chỉ gắn vào ô Tay phải, không gắn vào ô Đầu/.test(t)&&eqOf(tp.id)===null,`thả hồn cốt Tay phải vào ô Đầu bị từ chối: ${t}`);
      t=await boneOp("equip",{itemId:tp.id,vohonId:act,slot:"xyz"}); ok(/chỉ gắn vào ô Tay phải/.test(t)&&eqOf(tp.id)===null,"ô lạ bị từ chối");
      t=await boneOp("equip",{itemId:tp.id,vohonId:987654321}); ok(/không sở hữu/.test(t)&&eqOf(tp.id)===null,`võ hồn không thuộc mình bị từ chối: ${t}`);
      t=await boneOp("equip",{itemId:tp.id,vohonId:String(act)}); ok(/không sở hữu/.test(t)&&eqOf(tp.id)===null,"vohonId không phải số nguyên bị từ chối");
      const dan=A.bag.items.find(i=>i.code!==BONE_ITEM&&i.vohon===null);
      if(dan){ t=await boneOp("equip",{itemId:dan.id,vohonId:act}); ok(/Không có hồn cốt này/.test(t),`gắn vật phẩm không phải hồn cốt bị từ chối: ${t}`); }
      t=await boneOp("equip",{itemId:"khong-co",vohonId:act}); ok(/Không có hồn cốt này/.test(t),"id lạ bị từ chối");
      await test(A,"energy",{v:0}); // tính như vừa giao chiến
      t=await boneOp("equip",{itemId:tp.id,vohonId:act}); ok(/Đang giao chiến/.test(t)&&eqOf(tp.id)===null,`đang giao chiến: gắn bị từ chối (${t})`);
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const free0=loose();
      t=await boneOp("equip",{itemId:tp.id,vohonId:act,slot:"tay_phai"});
      const s1=await test(A,"stats");
      ok(eqOf(tp.id)===act&&loose()===free0-1&&t.startsWith(`Gắn hồn cốt ${akName} vào ô Tay phải`),`gắn đúng ô Tay phải, không còn chiếm ô túi: ${t}`);
      ok(s1.bones.atk===addAtk&&Math.abs(s1.live.atk-(s1.base.atk+addAtk))<1e-6&&s1.live.maxHp===s1.base.maxHp,
        `võ hồn ra trận: công ${s1.base.atk.toFixed(1)} -> ${s1.live.atk.toFixed(1)} (+${addAtk}), sinh lực không đổi`);
      const mp0=p.maxMp; await boneOp("equip",{itemId:hd.id,vohonId:act}); // không gửi ô: server tự lấy ô theo vị trí của hồn cốt
      ok(eqOf(hd.id)===act&&await waitFor(()=>p.maxMp===mp0+addMp),`gắn Đầu: hồn lực tối đa ${mp0} -> ${p.maxMp} (+${addMp}), ngay khi đang ra trận`);
      // Đổi chỗ: ô Tay phải đã có thì món cũ về túi, số ô túi không đổi.
      await test(A,"give",{code:BONE_ITEM,years:1000,beast:AK,slot:"tay_phai"});
      const tp2=bonesOf(A).find(i=>i.stats?.slot==="tay_phai"&&i.years===1000&&i.vohon===null), free1=loose();
      t=await boneOp("equip",{itemId:tp2.id,vohonId:act});
      const s2=await test(A,"stats");
      ok(eqOf(tp2.id)===act&&eqOf(tp.id)===null&&loose()===free1&&s2.bones.atk===boneStats("tay_phai",1000).atk&&/về túi đồ/.test(t),
        `đổi chỗ: Tay phải 1.000 năm vào ô, 32.000 năm về túi (${t})`);
      await boneOp("equip",{itemId:tp.id,vohonId:act});
      ok(eqOf(tp.id)===act&&eqOf(tp2.id)===null&&(await test(A,"stats")).bones.atk===addAtk,"đổi lại: 32.000 năm vào ô, 1.000 năm về túi");
      if(other){
        t=await boneOp("equip",{itemId:tp.id,vohonId:other}); ok(/tháo ra trước/.test(t)&&eqOf(tp.id)===act,`hồn cốt đang gắn trên võ hồn khác không gắn thẳng sang: ${t}`);
        await boneOp("equip",{itemId:tp2.id,vohonId:other});
        const so=await test(A,"stats",{rowId:other}), sa=await test(A,"stats");
        ok(eqOf(tp2.id)===other&&so.bones.atk===boneStats("tay_phai",1000).atk&&so.live===null&&sa.bones.atk===addAtk&&sa.bones.mp===addMp,
          "gắn vào võ hồn không ra trận: chỉ võ hồn đó được cộng, võ hồn ra trận giữ phần của mình");
        // Đổi võ hồn ra trận: chỉ số theo hồn cốt của võ hồn mới, đổi về thì như cũ.
        const slotO=A.owned.team.indexOf(other), slotA=A.owned.team.indexOf(act);
        if(slotO>=0&&slotA>=0){
          await waitFor(()=>p.swCd===0,3500); A.room.send("switch",{slot:slotO});
          ok(await waitFor(()=>A.owned.active===other),"đổi sang võ hồn có hồn cốt Tay phải 1.000 năm");
          const sw=await test(A,"stats");
          ok(sw.bones.atk===boneStats("tay_phai",1000).atk&&sw.bones.mp===0&&Math.abs(sw.live.atk-sw.stats.atk)<1e-6&&p.maxMp===sw.stats.maxMp,
            `ra trận: công ${sw.live.atk.toFixed(1)} (hồn cốt +${sw.bones.atk}), hồn lực tối đa ${p.maxMp} không có Đầu`);
          await waitFor(()=>p.swCd===0,3500); A.room.send("switch",{slot:slotA});
          ok(await waitFor(()=>A.owned.active===act)&&Math.abs((await test(A,"stats")).live.atk-s1.live.atk)<1e-6,"đổi về: chỉ số như trước");
        } else console.log("  ⚠ bỏ qua đổi võ hồn ra trận (võ hồn thứ hai không ở trong đội)");
        // Gục: võ hồn ra trận gục vẫn giữ hồn cốt (mục 2: thua không mất đồ).
        A.ko=null; await test(A,"down"); await waitFor(()=>A.ko,2000);
        ok(eqOf(tp.id)===act&&eqOf(hd.id)===act&&eqOf(tp2.id)===other,"võ hồn gục: hồn cốt vẫn gắn nguyên");
        await test(A,"rest",{s:REVIVE_SECS+1}); await waitFor(()=>!p.dead,4000);
        const sb=A.owned.team.indexOf(act);
        if(A.owned.active!==act&&sb>=0){ await waitFor(()=>p.swCd===0,3500); A.room.send("switch",{slot:sb}); await waitFor(()=>A.owned.active===act); }
      }
      // Tháo khi túi đầy: từ chối, hồn cốt vẫn gắn.
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      await test(A,"give",{code:RING_ITEM,qty:BAG_SLOTS-loose(),years:50});
      t=await boneOp("unequip",{itemId:hd.id});
      ok(loose()===BAG_SLOTS&&/Túi đồ đã đầy .* tháo được hồn cốt/.test(t)&&eqOf(hd.id)===act,`túi đầy: tháo bị từ chối (${t})`);
      for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
      ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
      t=await boneOp("unequip",{itemId:tp2.id}); // hồn cốt của võ hồn không ra trận cũng tháo được
      t=await boneOp("unequip",{itemId:hd.id});
      ok(eqOf(hd.id)===null&&A.bag.items.find(i=>i.id===hd.id)?.enhance===0&&await waitFor(()=>p.maxMp===mp0)&&/giữ cường hóa \+0/.test(t),
        `tháo Đầu về túi, giữ cường hóa, hồn lực tối đa về ${p.maxMp} (${t})`);
      t=await boneOp("unequip",{itemId:hd.id}); ok(/không gắn trên võ hồn nào/.test(t),"tháo hồn cốt đang ở túi bị từ chối");
      A.room.send("discard",{id:tp2.id}); await waitFor(()=>!A.bag.items.some(i=>i.id===tp2.id));
      ok(eqOf(tp.id)===act&&eqOf(hd.id)===null,"còn Tay phải 32.000 năm gắn trên võ hồn ra trận (kiểm khi vào lại)");
      const l=A.logs.length; A.room.send("discard",{id:tp.id}); await waitFor(()=>A.logs.length>l);
      ok(eqOf(tp.id)===act,"hồn cốt đang gắn không bỏ được (không nằm trong túi)");
      A.boneEq={id:tp.id,vohon:act,atk:addAtk};
    }
    A.boneKeep=bonesOf(A).map(i=>[i.id,i.years,i.stats?.beast,i.stats?.slot]); // vào lại phải còn nguyên (kiểm ở dưới)
  }
  for(const o of orig) await test(A,"set",o);
}

B.room.send("chat",{text:"xin chào"}); await sleep(200);
// Lần thử hấp thụ ở trên có thể vẫn đang chạy (không có GAME_TEST thì chỉ cách khoảng 2,5 giây): hấp thụ xong thì lên cấp
// nhưng server không gửi lại tin vohons. Chờ xong rồi xin lại danh sách, để bản so sánh là tiến độ server giữ lúc rời phòng.
await waitFor(()=>p.absorb===0,8000);
{ const n=A.ownedMsgs; A.room.send("vohons"); await waitFor(()=>A.ownedMsgs>n); }
await A.room.leave(); await B.room.leave();

// Vào lại: đội hình, võ hồn ra trận và tiến độ từng võ hồn (cả võ hồn không ra trận) đã lưu.
const prog=()=>A.owned.list.map(v=>[v.rowId,v.level,v.xp,v.stars]);
const saved={team:[...A.owned.team],active:A.owned.active,prog:prog(),bag:bagKey(A)}; await sleep(500);
await enter(A); await waitFor(()=>A.owned&&A.bag);
ok(bagKey(A)===saved.bag,`vào lại: túi đồ và Hồn Tệ đã lưu (${A.bag?.items.length} ô, ${formatHonTe(A.bag?.honTe??0)})`);
if(A.boneKeep) ok(A.boneKeep.length>=3&&same(bonesOf(A).map(i=>[i.id,i.years,i.stats?.beast,i.stats?.slot]),A.boneKeep),`vào lại: ${A.boneKeep.length} hồn cốt còn nguyên loài, vị trí, số năm`);
if(A.boneEq){ // 4.2: hồn cốt đang gắn vẫn gắn, chỉ số vẫn cộng
  const sv=await test(A,"stats");
  ok(A.bag.items.find(i=>i.id===A.boneEq.id)?.vohon===A.boneEq.vohon&&sv.rowId===A.boneEq.vohon&&sv.bones.atk===A.boneEq.atk&&Math.abs(sv.live.atk-sv.stats.atk)<1e-6,
    `vào lại: hồn cốt Tay phải vẫn gắn trên võ hồn ra trận, công +${sv.bones.atk}`);
}
ok(A.owned&&same(A.owned.team,saved.team)&&A.owned.active===saved.active,`vào lại: đội ${JSON.stringify(A.owned?.team)}, ra trận ${A.owned?.active}`);
ok(same(prog(),saved.prog),`vào lại: cấp, kinh nghiệm, sao từng võ hồn (cả võ hồn mở bằng mảnh) đã lưu ${JSON.stringify(prog())}`);
await A.room.leave();

// ---------- BĐ2: cổng, chặn mềm, lưu bản đồ và vị trí ----------
console.log("[cổng] tài khoản mới đi Thánh Hồn Thôn -> Nặc Đinh Thành -> Ngoại vi -> Nội địa -> Ngoại vi -> Nặc Đinh Thành");
let C=await bot("Lữ "+Date.now().toString(36).slice(-6),"bich_lan_xa_hoang",{sex:0,hair:1,hairCol:2,outfitCol:3});
const me=()=>C.room.state.players?.get(C.room.sessionId);
let joinErr=""; try{ const r=await new Client(WS).joinOrCreate("map",{token:C.token,mapId:"nac_dinh_thanh"}); await r.leave(); }catch(e){ joinErr=String(e?.message??e); }
ok(/Sai bản đồ/.test(joinErr),`vào bản đồ khác bản đồ đã lưu bị từ chối: ${joinErr}`);
ok(C.room.state.mapId==="thanh_hon_thon","C ở Thánh Hồn Thôn");
/** Đi theo vector (x,y) đến khi cond() đúng hoặc hết giờ, rồi dừng. */
async function walk(x,y,cond,ms=12000){ C.room.send("input",{x,y}); const r=await waitFor(cond,ms); C.room.send("input",{x:0,y:0}); await sleep(150); return r; }
/** Đi tới cột x (pixel) theo phương ngang. */
const walkToX=async(tx)=>walk(Math.sign(tx-me().x),0,()=>Math.abs(me().x-tx)<3);
/** Đi cổng `name` tới `to`; `during` chạy ngay sau khi xin đi (lúc đang niệm), `after` chạy khi đã nhận `travel`, trước khi rời phòng. */
async function travelBy(name,to,during,after){
  C.travel=null; C.room.send("travel",{portal:name}); await during?.();
  // Quanh cổng và trại cổng không sinh hồn thú (SPAWN_CLEAR): không hồn thú hoang nào đánh hủy niệm, kể cả khi không có GAME_TEST.
  ok(await waitFor(()=>C.travel,4000)&&C.travel.mapId===to,`đi cổng "${name}" -> travel ${C.travel?.mapId}`+(C.travel?"":` (log: ${C.logs.slice(-4).join(" | ")})`));
  await after?.();
  const x0=me().x, bk=bagKey(C); C.room.send("input",{x:1,y:0}); C.room.send("use",{id:C.bag?.items[0]?.id}); await sleep(300);
  ok(me().x===x0,"đang chuyển bản đồ: server bỏ qua input");
  ok(bagKey(C)===bk,"đang chuyển bản đồ: không dùng được đan");
  await C.room.leave(); await sleep(300);
  const m=await post("/api/me",{token:C.token});
  ok(m.mapId===to,`/api/me sau khi đi cổng: ${m.mapId}`);
  C.mapId=m.mapId; await enter(C); await waitFor(()=>me()&&C.bag);
  ok(C.room.state.mapId===to,`vào phòng ${C.room.state.mapId}`);
  ok(bagKey(C)===bk,`đi cổng: túi đồ và Hồn Tệ giữ nguyên (${C.bag?.items.length} ô, ${formatHonTe(C.bag?.honTe??0)})`);
}
// Thánh Hồn Thôn: từ quảng trường làng (vùng an toàn) theo đường làng xuống cổng ở mép nam.
C.room.send("attack"); ok(await lastLog(C,/Vùng an toàn/),"trong làng (vùng an toàn) không đánh được");
C.room.send("travel",{portal:"Cổng không có"}); ok(await lastLog(C,/không tồn tại/),"cổng không tồn tại bị từ chối");
C.room.send("travel",{portal:"Đi Nặc Đinh Thành"}); ok(await lastLog(C,/đứng trong cổng/),"không đứng trong cổng thì không đi được");
await walkToX(36.5*16);
ok(await walk(0,1,()=>C.portal?.name),`tới cổng: ${JSON.stringify(C.portal)}`);
ok(C.portal?.to==="nac_dinh_thanh"&&C.portal.toName==="Nặc Đinh Thành"&&!C.portal.warn,"hộp cổng: đích Nặc Đinh Thành, không cảnh báo");
C.room.send("travel",{portal:"Đi Nặc Đinh Thành"}); await sleep(200);
C.room.send("absorb"); ok(await lastLog(C,/không thể hấp thụ/),"đang niệm cổng: không hấp thụ được");
await walk(0,-1,()=>!C.portal?.name,3000);
ok(await lastLog(C,/rời cổng/),"rời cổng khi đang niệm: hủy");
ok(!C.travel,"chưa được chuyển bản đồ");
ok(await walk(0,1,()=>C.portal?.name),"quay lại cổng");
// Kinh nghiệm chia cho võ hồn dự bị (chưa lưu) phải nằm trong transaction đi cổng (cần hook test).
let benchXp=null;
if((await test(C,"ping"))?.enabled){
  await test(C,"kill",{tier:1}); const bn=C.owned.team.find(r=>r&&r!==C.owned.active);
  benchXp=[bn,C.owned.list.find(v=>v.rowId===bn).xp];
  // 3.1: gộp đồ cùng loại theo `stack`, giới hạn ô túi; mọi thay đổi chưa lưu này phải nằm trong transaction đi cổng.
  const st=itemDef("hoi_huyet_dan").stack, h0=qtyOf(C,"hoi_huyet_dan");
  await test(C,"give",{code:"hoi_huyet_dan",qty:2*st});
  const stacks=C.bag.items.filter(i=>i.code==="hoi_huyet_dan").map(i=>i.qty);
  ok(qtyOf(C,"hoi_huyet_dan")===h0+2*st&&stacks.length===3&&stacks[0]===st&&stacks[1]===st,`gộp Hồi Huyết Đan: ${stacks.join(" + ")} (tối đa ${st} mỗi ô)`);
  // 4.1: hồn cốt chưa lưu cũng nằm trong transaction đi cổng; bagKey so cả loài, vị trí, số năm, cường hóa.
  await test(C,"give",{code:BONE_ITEM,years:32000,beast:"am_kim_khung_trao_hung",slot:"tay_phai"});
  ok(bonesOf(C).some(i=>i.years===32000&&i.stats?.beast==="am_kim_khung_trao_hung"&&i.stats?.slot==="tay_phai"),"C có hồn cốt Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm (hook give)");
  // 4.2: hồn cốt vừa gắn (chưa lưu) cũng nằm trong transaction đi cổng; bagKey so cả võ hồn đang gắn.
  const cb=bonesOf(C).find(i=>i.years===32000&&i.vohon===null);
  C.room.send("equip",{itemId:cb.id,vohonId:C.owned.active});
  ok(await waitFor(()=>bonesOf(C).find(i=>i.id===cb.id)?.vohon===C.owned.active),"C gắn hồn cốt Tay phải vào võ hồn ra trận (trong làng, ngoài giao chiến)");
  C.boneEq={id:cb.id,vohon:C.owned.active,atk:boneStats("tay_phai",32000).atk};
  await test(C,"give",{code:"hoi_hon_dan",qty:BAG_SLOTS*st});
  const cLoose=()=>C.bag.items.filter(i=>i.vohon===null).length;
  ok(cLoose()===BAG_SLOTS&&await lastLog(C,/Túi đồ đã đầy/),`túi đầy ${cLoose()}/${BAG_SLOTS} ô (hồn cốt đang gắn không chiếm ô): phần dư không nhận`);
  const n1=qtyOf(C,"hoi_huyet_dan"); await test(C,"give",{code:"hoi_huyet_dan",qty:1});
  ok(qtyOf(C,"hoi_huyet_dan")===n1+1,"túi đầy vẫn gộp vào ô cùng loại chưa đầy");
  await test(C,"coin",{n:1234567});
  await test(C,"rest",{s:DAN_CD}); await test(C,"hurt",{pct:50});
  const q=qtyOf(C,"hoi_huyet_dan"); await useItem(C,C.bag.items.find(i=>i.code==="hoi_huyet_dan").id);
  ok(qtyOf(C,"hoi_huyet_dan")===q-1,"C dùng một Hồi Huyết Đan ngay trước khi đi cổng");
}
await travelBy("Đi Nặc Đinh Thành","nac_dinh_thanh");
if(benchXp){ await waitFor(()=>C.owned); const v=C.owned?.list.find(v=>v.rowId===benchXp[0]);
  ok(v?.xp===benchXp[1],`đi cổng lưu cả kinh nghiệm võ hồn dự bị: ${v?.xp} (trước khi đi ${benchXp[1]})`); }
ok(Math.hypot(me().x-5.5*16,me().y-20.5*16)<1,`xuất hiện ở điểm tu_thanh_hon_thon: ${me().x},${me().y}`);
ok(!C.portal?.name,"điểm xuất hiện nằm ngoài cổng");
ok(C.room.state.beasts.size===0,"Nặc Đinh Thành không có hồn thú");
C.room.send("attack"); ok(await lastLog(C,/Vùng an toàn/),"trong thành không đánh được");
// Nặc Đinh Thành: theo đại lộ sang cổng đông đi Tinh Đấu Ngoại vi (chặn mềm: cảnh báo khi dưới cấp đề xuất nhưng vẫn đi được).
ok(!MAPS.tinh_dau&&MAPS[MAP_MOVED.tinh_dau]&&MAPS.tinh_dau_noi_dia,"MAPS bỏ tinh_dau, có Ngoại vi và Nội địa");
ok(await walk(1,0,()=>C.portal?.name,15000),`tới cổng đông: ${JSON.stringify(C.portal)}`);
const lvC=me().level;
ok(C.portal?.to==="tinh_dau_ngoai_vi"&&JSON.stringify(C.portal.level)==="[10,30]"&&C.portal.warn===(lvC<10),`cổng đi Ngoại vi: cấp đề xuất 10–30, cấp ${lvC} -> cảnh báo ${C.portal?.warn}`);
await travelBy("Đi Tinh Đấu Ngoại vi","tinh_dau_ngoai_vi");
ok(Math.hypot(me().x-5.5*16,me().y-31.5*16)<1,`xuất hiện ở trại cổng Ngoại vi: ${me().x},${me().y}`);
checkGateClear(C,checkBeastYears(C)); // vùng Ngoại vi theo bảng 5.3: 300–700 … 1.400–2.000 năm
if((await test(C,"ping"))?.enabled){
  // BĐ3: Ngoại vi -> Nội địa (cổng mép đông, đề xuất 30–60) -> về Ngoại vi. Đi bộ xuyên rừng cấp thấp thì gục: nhảy tới trạm gác
  // phía đông (hook goto), dọn hồn thú quanh mình rồi mới bước vào cổng.
  await test(C,"goto",{x:83.5*16,y:31*16}); await test(C,"clear");
  ok(await walk(1,0,()=>C.portal?.name,4000),`tới cổng đông Ngoại vi: ${JSON.stringify(C.portal)}`);
  ok(C.portal?.to==="tinh_dau_noi_dia"&&C.portal.toName===MAPS.tinh_dau_noi_dia.name&&JSON.stringify(C.portal.level)==="[30,60]"&&C.portal.warn===(me().level<30),
    `cổng vào Nội địa: cấp đề xuất 30–60, cấp ${me().level} -> cảnh báo ${C.portal?.warn}`);
  await travelBy("Vào Tinh Đấu Nội địa","tinh_dau_noi_dia");
  ok(Math.hypot(me().x-5.5*16,me().y-31.5*16)<1,`xuất hiện ở trại cổng Nội địa: ${me().x},${me().y}`);
  checkGateClear(C,checkBeastYears(C)); // vùng Nội địa: 1.500–5.000 … 15.000–25.000 năm
  ok(!JSON.parse(readFileSync(new URL("../../shared/assets/tinh_dau_noi_dia.json",import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[]).some(o=>o.type==="portal"&&!MAPS[(o.properties??[]).find(q=>q.name==="to")?.value]),
    "Nội địa chưa có cổng tới bản đồ chưa mở (Lõi Tinh Đấu để BĐ6)");
  await test(C,"clear");
  ok(await walk(-1,0,()=>C.portal?.name,4000),`tới cổng về Ngoại vi: ${JSON.stringify(C.portal)}`);
  ok(C.portal?.to==="tinh_dau_ngoai_vi"&&JSON.stringify(C.portal.level)==="[10,30]"&&C.portal.warn===(me().level<10),`cổng về Ngoại vi: đề xuất 10–30, cảnh báo ${C.portal?.warn}`);
  await travelBy("Về Tinh Đấu Ngoại vi","tinh_dau_ngoai_vi");
  ok(Math.hypot(me().x-83.5*16,me().y-31*16)<1&&!C.portal?.name,`về Ngoại vi: xuất hiện ở trạm gác phía đông ${me().x},${me().y}, ngoài cổng`);
  await test(C,"goto",{x:5.5*16,y:31.5*16});
} else console.log("  ⚠ bỏ qua Ngoại vi -> Nội địa (cần hook goto): bật server bằng GAME_TEST=1");
// Thoát và vào lại: đúng bản đồ, đúng vị trí đã lưu khi rời phòng.
await walk(1,0,()=>me().x>8*16,3000); const pos=[me().x,me().y];
await C.room.leave(); await sleep(400);
const m2=await post("/api/me",{token:C.token}); ok(m2.mapId==="tinh_dau_ngoai_vi",`thoát rồi /api/me: ${m2.mapId}`);
const bag2=bagKey(C); C.mapId=m2.mapId; await enter(C); await waitFor(()=>me()&&C.bag);
ok(bagKey(C)===bag2,`thoát rồi vào lại: túi đồ giữ nguyên (${C.bag?.items.length} ô)`);
ok(C.room.state.mapId==="tinh_dau_ngoai_vi"&&Math.abs(me().x-pos[0])<1&&Math.abs(me().y-pos[1])<1,`vào lại đúng vị trí ${me().x.toFixed(1)},${me().y.toFixed(1)} (đã lưu ${pos.map(v=>v.toFixed(1))})`);
// Đăng nhập lần nữa: phiên cũ bị đá (presence), phiên mới vào đúng bản đồ.
// Tiến độ chưa lưu của phiên cũ (đặt qua hook test) phải còn: phiên mới chỉ nạp DB sau khi phiên cũ lưu xong lần cuối (mục 6).
const relog=(await test(C,"ping"))?.enabled?C.owned.team.filter(Boolean).map((rowId,i)=>[rowId,1234+i]):null;
if(relog) for(const [rowId,xp] of relog) await test(C,"set",{rowId,xp});
// Túi đồ và Hồn Tệ chưa lưu của phiên cũ cũng phải còn (loadBag của phiên mới chạy sau lần lưu túi đồ của phiên cũ).
let relogBag=null;
if(relog){ await test(C,"coin",{n:(C.bag?.honTe??0)+4321}); await test(C,"give",{code:"hoi_huyet_dan",qty:1}); relogBag=bagKey(C); }
let kicked=0; C.room.onLeave(code=>{kicked=code;});
const l2=await post("/api/login",{name:C.name,password:PASS}); ok(l2.mapId==="tinh_dau_ngoai_vi","đăng nhập lại: /api/login trả tinh_dau_ngoai_vi");
const C2={name:C.name,token:l2.token,logs:[],mapId:l2.mapId}; await enter(C2);
ok(await waitFor(()=>kicked===4001),"phiên cũ bị đá khi tài khoản vào lại");
if(relog){ await waitFor(()=>C2.owned); const got=relog.map(([r])=>C2.owned?.list.find(v=>v.rowId===r)?.xp);
  ok(same(got,relog.map(([,xp])=>xp)),`đăng nhập lại: phiên mới nạp tiến độ phiên cũ vừa lưu lúc bị đá (kinh nghiệm ${got.join("/")})`);
  await waitFor(()=>C2.bag);
  ok(bagKey(C2)===relogBag,`đăng nhập lại: phiên mới nạp túi đồ, Hồn Tệ phiên cũ vừa lưu lúc bị đá (${formatHonTe(C2.bag?.honTe??0)}, ${C2.bag?.items.length} ô)`);
  if(C.boneEq){ // 4.2: qua 5 lần đi cổng, thoát vào lại, đăng nhập lại: hồn cốt vẫn gắn, chỉ số vẫn cộng
    const sv=await test(C2,"stats",{rowId:C.boneEq.vohon});
    ok(C2.bag.items.find(i=>i.id===C.boneEq.id)?.vohon===C.boneEq.vohon&&sv.bones.atk===C.boneEq.atk,
      `đi cổng, thoát vào lại, đăng nhập lại: hồn cốt vẫn gắn, công +${sv.bones.atk}`);
  } }
C=C2;
await waitFor(()=>me());
// Đường về: cổng ở mép tây doanh trại -> Nặc Đinh Thành (cổng đông).
ok(await walk(-1,0,()=>C.portal?.name,6000)&&C.portal.to==="nac_dinh_thanh",`tới cổng về Nặc Đinh Thành: ${C.portal?.name}`);
// Hồn kỹ 3 bắn lúc đang niệm: đạn bay tới hồn thú sau khi transaction đi cổng đã chụp dữ liệu thì bị bỏ, không hạ được
// (nếu hạ được thì kills/kinh nghiệm cộng sau lúc lưu và mất hẳn). Cần hook test.
let shot=null;
if((await test(C,"ping"))?.enabled){
  await test(C,"set",{rowId:C.owned.active,level:30,xp:0,rings:[1,1,1]});
  await test(C,"clear"); // đạn chỉ có thể trúng hồn thú thử bên dưới
  const ids=new Set(C.room.state.beasts.keys());
  // Đạn bay 170 px/s từ (x, y-8): hồn thú cách 90 px về phía đông, trúng sau ~0,53 giây.
  await test(C,"beast",{dx:90,dy:TIERS[0].size/2-8});
  const fresh=()=>[...C.room.state.beasts.keys()].find(k=>!ids.has(k)); // state đồng bộ sau tin nhắn test
  ok(await waitFor(fresh),"hook test đặt hồn thú 1 máu cạnh cổng");
  shot={bid:fresh(),kills:me().kills};
}
await travelBy("Về Nặc Đinh Thành","nac_dinh_thanh",
  shot&&(async()=>{ await sleep(TRAVEL_CAST*1000-200); C.room.send("skill",{i:2}); await sleep(150); }),
  shot&&(async()=>{
    ok(me().cds[2]>0,"hồn kỹ 3 đã bắn trong lúc niệm cổng");
    await sleep(800);
    ok(C.room.state.beasts.has(shot.bid)&&me().kills===shot.kills&&!C.logs.some(t=>/^Hạ /.test(t)),
      "đạn hồn kỹ bắn lúc niệm không hạ hồn thú sau khi đã lưu để đi cổng");
  }));
ok(Math.hypot(me().x-54.5*16,me().y-20.5*16)<1,`xuất hiện ở cổng đông Nặc Đinh Thành: ${me().x},${me().y}`);
// BĐ3: tài khoản cũ còn map_id `tinh_dau` (bản đồ đã tách) -> vào Ngoại vi ở trại cổng, bỏ vị trí cũ. Hook legacy ghi mã cũ
// qua đúng transaction đi cổng, như tài khoản đăng xuất ở Tinh Đấu trước BĐ3.
if((await test(C,"ping"))?.enabled){
  const lg=await test(C,"legacy",{mapId:"tinh_dau",x:700,y:480});
  ok(lg?.saved,`ghi map_id cũ tinh_dau (vị trí 700,480): ${JSON.stringify(lg)}`);
  await C.room.leave(); await sleep(300);
  const ml=await post("/api/me",{token:C.token}), ll=await post("/api/login",{name:C.name,password:PASS});
  ok(ml.mapId==="tinh_dau_ngoai_vi"&&ll.mapId==="tinh_dau_ngoai_vi",`tài khoản ở tinh_dau: /api/me và /api/login trả ${ml.mapId} / ${ll.mapId}`);
  C.token=ll.token; C.mapId=ml.mapId; await enter(C); await waitFor(()=>me());
  const sp=JSON.parse(readFileSync(new URL("../../shared/assets/tinh_dau_ngoai_vi.json",import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="spawn");
  ok(C.room.state.mapId==="tinh_dau_ngoai_vi"&&me().x>=sp.x&&me().x<=sp.x+sp.width&&me().y>=sp.y&&me().y<=sp.y+sp.height,
    `vào Ngoại vi ở ${sp.name} (${me().x.toFixed(0)},${me().y.toFixed(0)}), không giữ vị trí cũ 700,480`);
  // Lớp chặn WHERE map_id theo bản đồ đã ánh xạ: rời phòng Ngoại vi thì ghi được vị trí mới.
  await test(C,"goto",{x:7.5*16,y:31.5*16}); await C.room.leave(); await sleep(300);
  C.mapId=(await post("/api/me",{token:C.token})).mapId; await enter(C); await waitFor(()=>me());
  ok(Math.abs(me().x-7.5*16)<1&&Math.abs(me().y-31.5*16)<1,`rời rồi vào lại: vị trí mới ở Ngoại vi đã lưu (${me().x},${me().y})`);
}
await C.room.leave();
console.log(fails?`✗ ${fails} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua");
process.exit(fails?1:0);
