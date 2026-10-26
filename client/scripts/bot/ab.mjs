// Phần chung + luồng A / B của bot-test.mjs (#703 bước 7): đăng nhập, vào bản đồ, di chuyển, đánh quái, túi / nhân vật, 2.3b, 2.4,
// rồi các khối INLINE ab1 / ab2 (khối không thụt lề lại để diff gọn), cuối cùng thoát và vào lại kiểm tra dữ liệu đã lưu.
// Bộ chạy (bot-test.mjs) truyền ngữ cảnh { inPart } và nhận lại { HOOK, tiled, st, blocked, vil } cho bot C và các bài độc lập.
import { solidGrid, hits, PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { findPath, clearLine, pathLength } from "../../../shared/path.ts";
import { existsSync, readFileSync } from "node:fs";
import { goTo, checkBeastYears, bossClock, API, sleep, waitFor, ok, mapUrl, zonesByName, bot, enter, qtyOf, bagKey, bonesOf, sj, useItem, lastLog, sendTeam, same, test, step, needHookSkip } from "./lib.mjs"; // tiện ích chung + bot / enter / test … (#703)
import { ab1Block1, ab1Block2, ab1Block3 } from "./ab1.mjs"; // khối ab1 của INLINE (#703 bước 5)
import { ab2Block1, ab2Block2, ab2Block3, ab2Block4, ab2Block5, ab2Block6, ab2Block7, ab2Block8, ab2Block9 } from "./ab2.mjs"; // khối ab2 của INLINE
import { villageKit, skillCast, comboHits } from "./village.mjs"; // hàm phụ làng / hồn kỹ dùng chung với luồng A / B
import { TIERS, TEAM_SIZE, XP_SHARE_ACTIVE, XP_SHARE_BENCH, REVIVE_SECS, RESPAWN_SECS, xpNeed, beastLevel, xpLevelScale, BEASTS, XP_LEVEL_CAP, VOHON, HE, vohonIndex, calcStats, tierOfYears, TIEN_CO, TIEN_CO_MAX, TIEN_CO_GAIN, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY, BAG_SLOTS, DAN_CD, STARTER_ITEMS, itemDef, formatHonTe, TIER_MULT, SKILLS, skillsOf, skillPower, buffPower, BUFF_SCALE, TIEN_CO_RIENG, tienCoOf, statusBit, buffBit, CRIT, TEAM_COMBAT_SECS, BEAST_AGGRO_R, MAX_YEARS, beastStats, rollYears, tierBand, parseLevelRange, RING_ITEM, ringLimit, beastSkillOf, CORE_ITEM, SKIN_TONES, parseLooks, PLAYER_SPEED, RUN_MULT, BEAST_GAIT, BEAST_LEASH, TICK_RATE } from "../../../shared/data.ts";
import { encodeLpc } from "../../../shared/data.ts"; // Looks v2 (#509)
import { BEAST_ROOTED, beastMelee } from "../../../shared/data.ts"; // hồn thú: thú thực vật đứng yên, thủ, trạng thái riêng trên hồn sư (#116)

/** @param {{ inPart: (k:string)=>boolean }} ctx  inPart(khóa INLINE): khối đó có thuộc nhóm đang chạy không. */
export async function abFlow({ inPart }){
// Chống gian lận (#166): API REST gặp dữ liệu lạ trả lỗi JSON ngay (không treo request, không lộ stack / đường dẫn server).
{
  console.log("\n== Chống gian lận: API REST ==");
  const raw=async(p,body)=>{ try{ const r=await fetch(API+p,{method:"POST",headers:{"Content-Type":"application/json"},body,signal:AbortSignal.timeout(3000)});
    const t=await r.text(); let j=null; try{ j=JSON.parse(t); }catch{} return {status:r.status,j,t,cors:r.headers.get("access-control-allow-origin")}; }catch(e){ return {status:0,j:null,t:String(e)}; } };
  const leak=t=>/node_modules|\/src\/|\bat [\w.<]+ \(/.test(t);
  for(const p of ["/api/me","/api/channel","/api/looks","/api/awaken"]){
    const bad=[];
    for(const token of ["\u0000",`${"a".repeat(31)}\u0000`,{x:1},["t"],12,"x".repeat(3000)]){
      const r=await raw(p,JSON.stringify({token})); if(!(r.status===401&&typeof r.j?.error==="string")) bad.push(`${JSON.stringify(token).slice(0,12)}:${r.status}`);
    }
    ok(!bad.length,`${p}: token lạ (NUL, object, mảng, số, quá dài) -> 401 JSON ${bad.join(" ")}`);
  }
  for(const [p,body] of [["/api/login",'{"name":'],["/api/me","not json"]]){
    const r=await raw(p,body); ok(r.status===400&&typeof r.j?.error==="string"&&!leak(r.t)&&!!r.cors,`${p} JSON hỏng -> 400 JSON có header CORS, không lộ stack (${r.status})`);
  }
  const big=await raw("/api/login",JSON.stringify({name:"x",password:"p".repeat(20000)}));
  ok(big.status===413&&typeof big.j?.error==="string"&&!leak(big.t)&&!!big.cors,`/api/login body > 10kb -> 413 JSON có header CORS (${big.status})`);
  ok((await fetch(API+"/health").then(r=>r.json()).catch(()=>({}))).ok,"server vẫn trả /health sau các request lạ");
}

// 9.9: A tạo nhân vật tông da 2; B không gửi tông da (như client / tài khoản cũ có từ trước 9.9) nên giữ tông 0.
const A=await bot("Tester A","lam_dien_ba_vuong_long",{sex:1,hair:2,hairCol:3,outfitCol:4,skin:2}), B=await bot("Tester B","bich_lan_xa_hoang",{sex:0,hair:3,hairCol:5,outfitCol:1});
await sleep(800);
const st=A.room.state, p=st.players.get(A.room.sessionId);
console.log("players",st.players.size,"beasts",st.beasts.size,"lvl",p.level,"hp",p.hp,"/",p.maxHp);

// Bản đồ: hai bot cùng một phòng, state có mapId và file Tiled tương ứng tồn tại.
ok(A.room.roomId===B.room.roomId,"A và B cùng phòng");
// Ngoại hình đồng bộ qua schema: B thấy đúng ngoại hình A đã lưu.
const aSeen=B.room.state.players.get(A.room.sessionId);
ok(aSeen&&["sex","hair","hairCol","outfitCol","skin"].every(k=>aSeen[k]===A.looks[k]),`B thấy ngoại hình A: ${aSeen&&[aSeen.sex,aSeen.hair,aSeen.hairCol,aSeen.outfitCol,aSeen.skin].join("/")}`);
{ // ---------- 9.9: tông da ----------
  const bSeen=A.room.state.players.get(B.room.sessionId);
  ok(A.looks.mode==="lpc"&&A.looks.lpc.colors.skin==="bronze"&&aSeen?.lpc===encodeLpc(A.looks.lpc),`HL2: A gửi preset tông da 2 (${SKIN_TONES[2].name}) -> LPC da ${A.looks.lpc?.colors.skin}, B thấy đúng chuỗi lpc`);
  ok(B.looks.mode==="lpc"&&B.looks.lpc.colors.skin==="light"&&bSeen?.lpc===encodeLpc(B.looks.lpc),`HL2: B không gửi tông da (client cũ) -> da LPC ${B.looks.lpc?.colors.skin}, A thấy đúng chuỗi lpc`);
  ok(SKIN_TONES.length===3&&SKIN_TONES.every(t=>t.ramp.length===3&&t.ramp.every(c=>/^#[0-9a-f]{6}$/.test(c)))&&SKIN_TONES[0].ramp[1]==="#f1c7a0",
    `9.9: SKIN_TONES 3 tông, mỗi tông 3 sắc, tông 0 quanh #f1c7a0: ${SKIN_TONES.map(t=>t.name).join(", ")}`);
  const gpl=readFileSync(new URL("../../../art/palette.gpl",import.meta.url),"utf8").toLowerCase();
  ok(SKIN_TONES.every(t=>t.ramp.every(c=>gpl.includes(c))),"9.9: mọi sắc da của SKIN_TONES có trong art/palette.gpl");
  ok(parseLooks({sex:0,hair:0,hairCol:0,outfitCol:0})?.skin===0&&parseLooks({sex:0,hair:0,hairCol:0,outfitCol:0,skin:3})===null,"9.9: parseLooks thiếu skin = 0, skin ngoài khoảng = null");
}
ok(typeof st.mapId==="string"&&st.mapId.length>0,`state.mapId = ${st.mapId}`);
ok(existsSync(mapUrl(st.mapId)),`có file shared/assets/${st.mapId}.json`);
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
/** Điểm (x, y) nằm trong một mảnh của vùng `z` (zonesByName). */
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
// Dự đoán chuyển động phía client (mục 6): input kèm số thứ tự `s` -> server trả PlayerState.seq, seqT (giây đã áp hướng đó, chỉ
// đếm khi hướng khác 0) và spd (tốc độ thật). Cùng một bản vá: quãng đã đi = spd × seqT (đường làng thẳng, không vướng).
{
  const x0=p.x, y0=p.y; let probe=null;
  A.room.send("input",{x:1,y:0,s:7});
  ok(await waitFor(()=>{ if(p.seq===7&&p.seqT>0.08){ probe={d:Math.hypot(p.x-x0,p.y-y0),t:p.seqT,spd:p.spd}; return true; } return false; }),`input s=7 -> seq ${p.seq}, seqT ${p.seqT.toFixed(2)}`);
  ok(probe&&probe.spd>0&&Math.abs(probe.d-probe.spd*probe.t)<1.5,`quãng đi khớp spd × seqT: ${probe?.d.toFixed(1)} ≈ ${probe&&(probe.spd*probe.t).toFixed(1)}`);
  A.room.send("input",{x:0,y:0,s:8}); await waitFor(()=>p.seq===8); await sleep(300);
  ok(p.seq===8&&p.seqT===0,`dừng (s=8): seqT đứng ở ${p.seqT}`);
  A.room.send("input",{x:-1,y:0}); await sleep(250); A.room.send("input",{x:0,y:0}); await sleep(150);
  ok(p.seq===8,`input không có s (bot cũ) giữ seq ${p.seq}`);
}
// Làng (vùng safe), leaveSafe, inSafeOf, VILLAGE_RY: bot/village.mjs (dùng chung với các bài party.mjs).
const vil=villageKit(st.mapId), { safe, inSafeOf, VILLAGE_RY, leaveSafe }=vil;
const inSafe=()=>inSafeOf(A);
await leaveSafe(A);
// Di chuyển (11.1): ngoài giao chiến tự chạy × RUN_MULT, input `w` (giữ Shift) đi bộ, giao chiến thì đi bộ; hồn thú đuổi nhanh hơn
// lang thang rồi bỏ đuổi về chỗ sinh và hồi máu; bấm chuột tìm đường A* (shared/path.ts) đi vòng vật cản trên lưới va chạm của server.
if((await test(A,"ping"))?.enabled){
  const home=[p.x,p.y], act0=A.owned.active; // vừa ra khỏi làng: phần săn hồn thú sau khối này bắt đầu từ đây
  const grid=solidGrid(JSON.parse(readFileSync(mapUrl(st.mapId),"utf8"))); // file Tiled đang dùng (bản ×8 hoặc bản cũ khi MAP_V1)
  const walkSpd=PLAYER_SPEED*VOHON[p.vh].spd, near=(a,b)=>Math.abs(a-b)<0.05*b;
  const gait=async(msg,want)=>{ A.room.send("input",msg); return waitFor(()=>p.moving&&want(),1500); };
  // Vừa ra khỏi làng là Bãi tập: hồn thú 100 năm hung hăng đánh trúng A ngay sau lúc nghỉ thì A vào giao chiến lại (đi bộ), bài đo nhầm
  // tốc độ giao chiến (#297). Dọn hồn thú quanh A trước khi nghỉ; dòng ✗ in sinh lực A và hồn thú đang nhắm A ở gần.
  await test(A,"clear");
  await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
  const runOk=await gait({x:1,y:0},()=>p.calm&&!p.walk&&near(p.spd,walkSpd*RUN_MULT));
  const foes=()=>[...st.beasts.values()].filter(b=>b.aggro&&Math.hypot(b.x-p.x,b.y-p.y)<2*BEAST_AGGRO_R).map(b=>`${b.x.toFixed(0)},${b.y.toFixed(0)}`).join(" ")||"không";
  ok(runOk,`ngoài giao chiến: tự chạy ${p.spd.toFixed(1)} ≈ ${(walkSpd*RUN_MULT).toFixed(1)} px/giây (calm ${p.calm})`
    +(runOk?"":` [A ${p.x.toFixed(0)},${p.y.toFixed(0)}, sinh lực ${p.hp}/${p.maxHp}, hồn thú hung hăng gần: ${foes()}; log ${A.logs.slice(-2).join(" | ")}]`));
  ok(await gait({x:-1,y:0,w:1},()=>p.walk&&near(p.spd,walkSpd)),`giữ Shift (w): đi bộ ${p.spd.toFixed(1)} ≈ ${walkSpd.toFixed(1)} px/giây`);
  A.room.send("input",{x:0,y:0}); await test(A,"hurt",{pct:1});
  ok(await gait({x:1,y:0},()=>!p.calm&&!p.walk&&near(p.spd,walkSpd)),`vừa bị đánh (giao chiến): đi bộ ${p.spd.toFixed(1)} px/giây dù không giữ Shift`);
  A.room.send("input",{x:0,y:0}); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
  ok(await gait({x:-1,y:0},()=>p.calm&&near(p.spd,walkSpd*RUN_MULT)),"hết giao chiến: chạy lại");
  A.room.send("input",{x:0,y:0}); await sleep(150);

  // Hồn thú đuổi rồi bỏ về: sinh hồn thú 100 năm (thấy người trong BEAST_AGGRO_R) cạnh A, còn nửa máu; A dịch ra xa chỗ sinh hơn BEAST_LEASH.r.
  await test(A,"clear");
  const sp=await test(A,"spawn",{tier:1,dx:40}), bid=sp?.bid, hx=p.x+40, hy=p.y, bOf=()=>st.beasts.get(bid);
  await test(A,"bhp",{bid,pct:50});
  ok(await waitFor(()=>bOf()?.aggro,2000),"hồn thú 100 năm phát hiện A");
  let spot=null;
  for(const [dx,dy] of [[BEAST_LEASH.r+70,0],[BEAST_LEASH.r+70,16],[BEAST_LEASH.r+70,-16],[BEAST_LEASH.r+90,0],[BEAST_LEASH.r+60,32],[BEAST_LEASH.r+60,-32]]){
    if(!clearLine(grid,{x:hx,y:hy},{x:hx+dx,y:hy+dy})) continue; // hồn thú đuổi thẳng được, không vướng cây
    await test(A,"goto",{x:hx+dx,y:hy+dy}); if(Math.hypot(p.x-hx-dx,p.y-hy-dy)<1){ spot=[dx,dy]; break; } }
  if(!spot) console.log("  ⚠ bỏ qua kiểm tra bỏ đuổi: không có chỗ đứng cách chỗ sinh", BEAST_LEASH.r+70, "pixel");
  else {
    // A đứng chờ ở đây hơn chục giây, sâu trong Bãi tập: dọn hồn thú hoang quanh mình (hồn thú thử còn cách hơn tầm `clear` 160 pixel),
    // không thì chúng đánh A suốt lúc chờ, có lần gục cả Lam Điện.
    if(bOf()&&Math.hypot(bOf().x-p.x,bOf().y-p.y)>170) await test(A,"clear");
    // Tốc độ đuổi: đo quãng đi trong 0,5 giây khi đang đuổi.
    let chase=null; const b0=bOf();
    if(b0){ const x0=b0.x,y0=b0.y,t0=Date.now(); await sleep(500); const b1=bOf(); if(b1?.aggro) chase=Math.hypot(b1.x-x0,b1.y-y0)/((Date.now()-t0)/1000); }
    const want=TIERS[1].spd*BEAST_GAIT.chase;
    ok(chase!==null&&chase>want*0.75&&chase<want*1.25,`hồn thú đuổi ~${chase?.toFixed(1)} px/giây (TIERS.spd × chase = ${want.toFixed(1)})`);
    ok(await waitFor(()=>bOf()&&!bOf().aggro&&Math.hypot(bOf().x-hx,bOf().y-hy)>BEAST_LEASH.r-20,(BEAST_LEASH.r/want+3)*1000),
      `xa chỗ sinh quá ${BEAST_LEASH.r} pixel: bỏ đuổi (cách chỗ sinh ${bOf()&&Math.hypot(bOf().x-hx,bOf().y-hy).toFixed(0)})`);
    ok(await waitFor(()=>bOf()&&Math.hypot(bOf().x-hx,bOf().y-hy)<BEAST_LEASH.near+4,(BEAST_LEASH.secs+2)*1000),
      `chạy về chỗ sinh (còn cách ${bOf()&&Math.hypot(bOf().x-hx,bOf().y-hy).toFixed(1)} pixel), không quay lại đuổi (aggro ${bOf()?.aggro})`);
    ok(bOf()&&bOf().hp===bOf().maxHp,`hồi máu trên đường về: ${bOf()?.hp}/${bOf()?.maxHp}`);
  }
  await test(A,"clear");

  // Thú thực vật đứng yên (#116, BEAST_ROOTED): Quỷ Đằng 1.000 năm thấy A trong tầm với (tầm Quật Roi + margin) nhưng không đuổi; bị
  // đánh không bị đẩy lùi; A ra ngoài tầm với thì bỏ mục tiêu, vẫn ở chỗ sinh.
  {
    const rs=BEAST_ROOTED.ids[1], ry0=TIERS[2].years, reach=Math.max(beastMelee(2,true),beastSkillOf(rs,ry0)?.range??0)+BEAST_ROOTED.margin; await step(A,1,0);
    const r0=(await test(A,"spawn",{tier:2,years:ry0,dx:40,species:rs}))?.bid, rOf=()=>st.beasts.get(r0);
    await waitFor(()=>rOf(),1000); const rx=rOf()?.x??0, ry=rOf()?.y??0; // chỗ sinh theo state (A có thể còn trôi sau bước vừa đi)
    ok(BEAST_ROOTED.ids.includes(BEASTS[rOf()?.species]?.id)&&await waitFor(()=>rOf()?.aggro,2000),`${BEASTS[rOf()?.species]?.name}: phát hiện A`);
    await sleep(1000);
    ok(rOf()&&Math.hypot(rOf().x-rx,rOf().y-ry)<0.5&&!rOf().moving,`đứng yên, không đuổi (lệch ${rOf()&&Math.hypot(rOf().x-rx,rOf().y-ry).toFixed(1)} pixel)`);
    await test(A,"goto",{x:rx-14,y:ry}); await step(A,1,0); await test(A,"goto",{x:rx-14,y:ry});
    const h0=rOf()?.hp; A.room.send("attack");
    ok(await waitFor(()=>rOf()&&rOf().hp<h0,1500)&&(await sleep(300),Math.hypot(rOf().x-rx,rOf().y-ry)<0.5),`bị đánh thường không bị đẩy lùi (lệch ${rOf()&&Math.hypot(rOf().x-rx,rOf().y-ry).toFixed(1)} pixel)`);
    let far=false;
    const fd=Math.round(reach+30);
    for(const [dx,dy] of [[-fd,0],[0,fd],[0,-fd],[fd,0]]){
      await test(A,"goto",{x:rx+dx,y:ry+dy}); if(Math.hypot(p.x-rx-dx,p.y-ry-dy)<1){ far=true; break; } }
    if(!far) console.log("  ⚠ bỏ qua kiểm tra bỏ mục tiêu của thú đứng yên: không có chỗ đứng cách", fd, "pixel");
    else ok(await waitFor(()=>rOf()&&!rOf().aggro,1500)&&Math.hypot(rOf().x-rx,rOf().y-ry)<0.5,`A ra ngoài tầm với ${reach.toFixed(0)} pixel: bỏ mục tiêu, vẫn ở chỗ sinh`+
      ` (cách A ${rOf()&&Math.hypot(rOf().x-p.x,rOf().y-p.y).toFixed(0)}, aggro ${rOf()?.aggro}, lệch ${rOf()&&Math.hypot(rOf().x-rx,rOf().y-ry).toFixed(1)})`);
    await test(A,"clear");
  }

  // Bấm chuột tìm đường: điểm quanh A mà đường thẳng vướng ô chặn nhưng A* đi vòng được; đi theo đường như GameScene.sendInput.
  let goal=null, route=null;
  for(let r=48;r<=200&&!goal;r+=16) for(let a=0;a<32&&!goal;a++){
    const g={x:p.x+Math.cos(a*Math.PI/16)*r,y:p.y+Math.sin(a*Math.PI/16)*r};
    if(hits(grid,g.x,g.y,PLAYER_HW+1,PLAYER_HH+1)||clearLine(grid,p,g)) continue;
    if(safe&&g.x>=safe.x&&g.x<=safe.x+safe.width&&g.y>=safe.y&&g.y<=safe.y+safe.height) continue;
    const path=findPath(grid,p,g); if(path.length>=2&&Math.hypot(path.at(-1).x-g.x,path.at(-1).y-g.y)<0.01){ goal=g; route=path; }
  }
  if(!goal) console.log("  ⚠ bỏ qua kiểm tra tìm đường: không có điểm bị chắn quanh",p.x.toFixed(0),p.y.toFixed(0));
  else {
    // Như GameScene: tới điểm khi còn cách dưới quãng đi một lần chỉnh hướng (bot chỉnh mỗi 50 ms theo vị trí server, mỗi nhịp đi tới
    // spd / TICK_RATE pixel), không thì lắc qua lại quanh điểm.
    const len=pathLength(p,route), nearOf=()=>Math.max(3,p.spd*(1/TICK_RATE+0.05)); let i=0, best=1e9, stuck=Date.now();
    const done=await waitFor(()=>{
      let w=route[i], d=Math.hypot(w.x-p.x,w.y-p.y);
      while(d<nearOf()&&i<route.length-1){ w=route[++i]; d=Math.hypot(w.x-p.x,w.y-p.y); best=1e9; }
      if(d<nearOf()) return true;
      if(d<best-1){ best=d; stuck=Date.now(); } else if(Date.now()-stuck>1500) return true; // kẹt
      A.room.send("input",{x:+((w.x-p.x)/d).toFixed(2),y:+((w.y-p.y)/d).toFixed(2)}); return false;
    },15000);
    A.room.send("input",{x:0,y:0}); await sleep(150);
    ok(done&&Math.hypot(p.x-goal.x,p.y-goal.y)<nearOf()+2,`bấm chuột tìm đường: vòng qua vật cản ${route.length} đoạn (${len.toFixed(0)} px) tới (${goal.x.toFixed(0)}, ${goal.y.toFixed(0)}), đang ở (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`);
  }
  // Phần săn hồn thú sau đây cần A như lúc vừa ra khỏi làng: còn Lam Điện ra trận, đủ sinh lực, gần làng. Đi săn tiếp từ chỗ sâu trong
  // Bãi tập với nửa sinh lực thì Lam Điện có thể gục, tự đổi sang Lam Ngân Thảo, mọi bài tiên cơ / đổi võ hồn / 2.3b sau trượt dây chuyền.
  // Trả A về chỗ cũ, dọn hồn thú quanh đó, chờ hồi đầy sinh lực (hồi theo nhịp server khi 5 giây không bị đánh).
  await test(A,"goto",{x:home[0],y:home[1]}); await test(A,"clear");
  ok(await waitFor(()=>p.hp===p.maxHp,30000)&&A.owned.active===act0,
    `về chỗ vừa ra khỏi làng: võ hồn ra trận ${A.owned.active===act0?"vẫn":"KHÔNG còn"} là ${A.owned.list.find(v=>v.rowId===act0)?.vohon}, hồi đầy sinh lực ${p.hp}/${p.maxHp}`);
}
console.log("A x",p.x.toFixed(1),"B sees A x",B.room.state.players.get(A.room.sessionId).x.toFixed(1));
// Bài đo tiên cơ dưới đây cần cả đội bắt đầu từ 0 năng lượng: đòn đánh Quỷ Đằng (thú đứng yên, #148) ở trên đã cho võ hồn ngoài sân
// 10 năng lượng, ra khỏi giao chiến quá TIEN_CO_IDLE_SECS thì giảm dần liên tục (TIEN_CO_DECAY), cộng thêm đòn mới thành số lẻ (43, 73).
await test(A,"energy",{v:0});
// Săn một hồn thú thử biết trước (#267): hồn thú hoang gần nhất có lúc là con 200+ năm (~136 máu, ~12 sát thương mỗi đòn) ngang sức
// Lam Điện cấp 3–4 (~122 sinh lực), đánh gục võ hồn ra trận giữa trận; A tự đổi sang Lam Ngân Thảo, võ hồn gục mất năng lượng nên
// "tích 0/100", rồi đổi võ hồn và 2.3b trượt dây chuyền. Dọn quanh A, sinh hồn thú 10 năm ngay cạnh (phía xa làng) và chỉ đánh con đó
// theo bid; server không bật GAME_TEST thì săn con gần nhất như cũ.
await test(A,"clear");
const huntBid=(await test(A,"spawn",{tier:0,dx:16}))?.bid, huntAct=A.owned.active;
const kills0=p.kills;
for(let i=0;i<300;i++){
  let best=null,bd=1e9; st.beasts.forEach((b,k)=>{ if(huntBid&&k!==huntBid) return; const d=Math.hypot(b.x-p.x,b.y-p.y); if(d<bd){bd=d;best=b;}});
  if(best){ const dx=best.x-p.x,dy=best.y-p.y,d=Math.hypot(dx,dy)||1; A.room.send("input",{x:+(dx/d).toFixed(2),y:+(dy/d).toFixed(2)}); if(d<22) A.room.send("attack"); }
  await sleep(100);
  if(st.drops.size) break;
}
A.room.send("input",{x:0,y:0});
console.log("drops",st.drops.size,"kills",p.kills,"xp",p.xp,"lvl",p.level,"logs",A.logs.slice(-2));
// Không hạ được hồn thú thử trong 30 giây (máy chậm, hồn thú hoang xen vào) là chập chờn chứ không phải lỗi luật: in ⚠ có lý do và
// danh sách kiểm tra bị bỏ, không để cả loạt ✓ biến mất lặng lẽ (#959). Các kiểm tra dưới đây chắc chắn khi đã hạ được.
const hunted=p.kills>kills0;
if(!hunted) console.log(`  ⚠ săn hồn thú thử: không hạ được con nào (hồn thú thử ${huntBid??"không có"}, kills ${p.kills}, sinh lực ${p.hp}/${p.maxHp}, log ${JSON.stringify(A.logs.slice(-3))}): `+
  "bỏ qua tích năng lượng tiên cơ, Hồn Tệ, đổi võ hồn khi giao chiến, chặn xếp đội, hồn hoàn rơi / nhặt / hấp thụ");
// Năng lượng tiên cơ (2.4): đánh thường trúng thì võ hồn khác trong đội tích năng lượng, võ hồn ra trận không tự tích.
if(hunted){
  const benchRow=A.owned.team.find(r=>r&&r!==A.owned.active), en=A.squad?.list.find(s=>s.rowId===benchRow)?.en??0;
  const vh=r=>A.owned.list.find(v=>v.rowId===r)?.vohon;
  ok(en>0&&(en===TIEN_CO_MAX||en%TIEN_CO_GAIN.attack===0),`đánh hồn thú: võ hồn ngoài sân tích ${en}/${TIEN_CO_MAX} năng lượng tiên cơ`+(en>0?"":
    ` [ra trận ${vh(A.owned.active)}${A.owned.active===huntAct?"":` (lúc bắt đầu ${vh(huntAct)})`}, sinh lực ${p.hp}/${p.maxHp}, hồn thú thử ${huntBid??"không có"}, log ${JSON.stringify(A.logs.slice(-3))}]`));
  ok((A.squad?.list.find(s=>s.rowId===A.owned.active)?.en??0)===0,"võ hồn ra trận không tự tích năng lượng");
}
// Hồn Tệ (3.1): hạ hồn thú thì người hạ nhận vài đồng.
if(hunted) ok(await waitFor(()=>A.bag?.honTe>0)&&A.logs.some(t=>/^Hạ .*Hồn Tệ/.test(t)),`hạ ${p.kills-kills0} hồn thú: Hồn Tệ ${A.bag?.honTe} đồng (${formatHonTe(A.bag?.honTe??0)})`);
// Vừa đánh xong (đang giao chiến): đổi võ hồn trong đội được, xếp đội thì không.
if(hunted){
  await waitFor(()=>p.swCd===0,3500);
  const want=A.owned.team.find(r=>r&&r!==A.owned.active), t0=[...A.owned.team];
  A.room.send("switch",{slot:A.owned.team.indexOf(want)});
  ok(await waitFor(()=>A.owned.active===want),"đổi võ hồn trong đội khi đang giao chiến");
  ok(same(await sendTeam(A,[t0[1],t0[0],t0[2],t0[3]]),t0)&&await lastLog(A,/giao chiến/),"chặn xếp đội khi đang giao chiến");
}
// Chỉ hồn hoàn (item === ""): túi đã đầy thì mảnh / tiên thảo / trang bị rơi cạnh hồn hoàn cũng của A, cái rơi sau mang years 0.
let dr=null; st.drops.forEach(d=>{ if(d.owner===A.room.sessionId&&!d.item) dr=d; });
if(hunted&&!dr) console.log(`  ⚠ săn hồn thú thử: đã hạ ${p.kills-kills0} con nhưng không có hồn hoàn rơi của A (${st.drops.size} vật rơi dưới đất): bỏ qua nhặt / hấp thụ hồn hoàn`);
if(dr){
  // 3.2: hồn hoàn dưới đất mang số năm của hồn thú; đi tới, nhấn E (pickup) thì vào túi đồ.
  const yrs=dr.years, n0=(A.bag?.items??[]).filter(i=>i.code===RING_ITEM).length;
  ok(yrs>=10&&dr.tier===tierOfYears(yrs)&&A.logs.some(t=>t.startsWith("Hạ ")&&t.includes(`${yrs.toLocaleString("vi-VN")} năm`)),`hồn hoàn rơi mang số năm của hồn thú: ${yrs} năm`);
  for(let i=0;i<50 && Math.hypot(dr.x-p.x,dr.y-p.y)>10;i++){const dx=dr.x-p.x,dy=dr.y-p.y,d=Math.hypot(dx,dy); A.room.send("input",{x:+(dx/d).toFixed(2),y:+(dy/d).toFixed(2)}); await sleep(60);}
  A.room.send("input",{x:0,y:0}); await sleep(150); A.room.send("pickup");
  // Đồ rơi khác (mảnh, tiên thảo) chồng cạnh hồn hoàn: nhấn E nhặt món ưu tiên người hạ gần nhất trước, lần sau mới tới hồn hoàn.
  for(let k=0;k<4&&!await waitFor(()=>(A.bag?.items??[]).filter(i=>i.code===RING_ITEM).length===n0+1,1500)&&[...st.drops.values()].includes(dr);k++) A.room.send("pickup");
  ok(await waitFor(()=>(A.bag?.items??[]).filter(i=>i.code===RING_ITEM).length===n0+1),`nhặt hồn hoàn: túi có ${A.bag?.items.filter(i=>i.code===RING_ITEM).map(i=>i.years).join(", ")} năm`+
    ` [cách hồn hoàn ${Math.hypot(dr.x-p.x,dr.y-p.y).toFixed(0)}, còn dưới đất ${[...st.drops.values()].includes(dr)}, st ${p.st}, sinh lực ${p.hp}/${p.maxHp}, log ${JSON.stringify(A.logs.slice(-3))}]`);
  const it=A.bag?.items.find(i=>i.code===RING_ITEM&&i.years===yrs);
  // Nhặt đã ✓ thì hồn hoàn phải có trong túi; gửi hấp thụ thì server phải bắt đầu (tin absorbing {on:true}), không chỉ in log.
  ok(!!it,`hồn hoàn ${yrs} năm vừa nhặt có trong túi để hấp thụ`);
  if(it){
    A.absorbing=null; A.room.send("absorb",{itemId:it.id});
    ok(await waitFor(()=>A.absorbing?.on,1500),`hấp thụ hồn hoàn ${yrs} năm: server bắt đầu hấp thụ`+(A.absorbing?.on?"":` [absorbing ${JSON.stringify(A.absorbing)}, log ${JSON.stringify(A.logs.slice(-2))}]`));
  }
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
/**
 * Giờ của lịch boss phía server (hook `king` trả `clock`, `clockMode`): với GAME_TEST=1 server mặc định cho lịch đứng yên ngoài mọi
 * khung (BOSS_CLOCK ở server/src/schedule.ts), nên lịch thật 20:00 / 21:00 / 22:00 không chen vào bài thử boss. Server cũ thì giờ thật.
 */
const vOf=r=>A.owned.list.find(v=>v.rowId===r), sq=r=>A.squad?.list.find(s=>s.rowId===r);
const tiled=JSON.parse(readFileSync(mapUrl(st.mapId),"utf8"));
const spawnObj=tiled.layers.flatMap(l=>l.objects??[]).find(o=>(o.type??o.class)==="spawn");
// Ô chặn (thuộc tính collides) như server/src/map.ts, để bot chọn hướng không vướng cây khi thử lướt.
const solidGid=new Set(tiled.tilesets.flatMap(ts=>(ts.tiles??[]).filter(t=>(t.properties??[]).some(q=>q.name==="collides"&&q.value)).map(t=>ts.firstgid+t.id)));
const solid=new Set(tiled.layers.filter(l=>l.type==="tilelayer").flatMap(l=>l.data.flatMap((g,i)=>solidGid.has(g)?[i]:[])));
const TS=tiled.tilewidth, blocked=(x,y)=>{ for(let ty=Math.floor((y-4)/TS);ty<=Math.floor((y+4)/TS);ty++) for(let tx=Math.floor((x-5)/TS);tx<=Math.floor((x+5)/TS);tx++)
  if(tx<0||ty<0||tx>=tiled.width||ty>=tiled.height||solid.has(ty*tiled.width+tx)) return true; return false; };
/** Hướng (dx, dy) dài `len` pixel từ vị trí (x, y) mà đường đi không vướng ô chặn (và `back` pixel phía sau lưng, cho hồn thú sinh sau lưng). */
const clearDir=(x,y,len,back=0)=>[[1,0],[-1,0],[0,1],[0,-1],[0.7,0.7],[-0.7,0.7],[0.7,-0.7],[-0.7,-0.7]].find(([ux,uy])=>{ for(let d=2-back;d<=len;d+=2) if(blocked(x+ux*d,y+uy*d)) return false; return true; })??[1,0];
const inCamp=()=>p.x>=spawnObj.x&&p.x<=spawnObj.x+spawnObj.width&&p.y>=spawnObj.y&&p.y<=spawnObj.y+spawnObj.height;
if(!(await test(A,"ping"))?.enabled) needHookSkip("bỏ qua kiểm tra 2.3b (gục, hồi sinh, chia kinh nghiệm): bật server bằng GAME_TEST=1");
else {
  await waitFor(()=>p.swCd===0&&p.absorb===0,8000); // lần thử hấp thụ ở trên có thể còn đang chạy
  {
    // 3.1: dùng đan khi mất máu / hồn lực, hồi chiêu chung giữa Hồi Huyết Đan và Hồi Hồn Đan.
    await test(A,"rest",{s:DAN_CD});
    await test(A,"hurt",{pct:60}); await waitFor(()=>p.hp<p.maxHp*0.6);
    const huyet=A.bag.items.find(i=>i.code==="hoi_huyet_dan"), q0=qtyOf(A,"hoi_huyet_dan"), hp0=p.hp, gain=Math.floor(p.maxHp*itemDef("hoi_huyet_dan").hp);
    await useItem(A,huyet.id);
    ok(qtyOf(A,"hoi_huyet_dan")===q0-1&&await waitFor(()=>p.hp>=Math.min(p.maxHp,hp0-1+gain)),`dùng Hồi Huyết Đan: sinh lực ${hp0} -> ${p.hp}/${p.maxHp}, còn ${qtyOf(A,"hoi_huyet_dan")} viên`+(qtyOf(A,"hoi_huyet_dan")===q0-1?"":` [log ${A.logs.slice(-2).join(" | ")}]`));
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
  const ry=VILLAGE_RY; let spot=null; // đường làng đông–tây
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
  // Từ 8.2 công của mọi võ hồn có cộng minh của tài khoản `b` (tin "resonance"; bot nhiều võ hồn cấp 30+ / nhiều hồn hoàn là đạt mốc).
  const atkOf=(v,b=A)=>calcStats(vohonIndex(v.vohon),v.level,v.rings.map(tierOfYears),1,{},{},b.res?.bonus).atk;
  /** Sát thương tiên cơ dự kiến của võ hồn v của bot `b`: [thường, chí mạng]. */
  const tcDmg=(v,he,b=A)=>{const x=atkOf(v,b)*tienCoOf(v.vohon).dmg; return [Math.max(1,Math.round(x)),Math.max(1,Math.round(x*1.8))];};
  // Hồn thú mới gần chỗ sinh nhất (bộ sinh hồn thú của bản đồ có thể thêm hồn thú khác cùng lúc ở nơi xa).
  async function spawnNear(b,tier,dx,dy=0,hpx=1){ const before=new Set(b.room.state.beasts.keys()), q=meOf(b), x=q.x+dx, y=q.y+dy;
    // Hook spawn trả id con vừa sinh (server cũ: tìm theo vị trí; hồn thú bậc cao đã lao đi quá 40 pixel khi máy bận thì không thấy).
    const r=await test(b,"spawn",{tier,dx,dy,hpx}); let id=null;
    if(r?.bid){ if(await waitFor(()=>b.room.state.beasts.has(r.bid))) id=r.bid; }
    else await waitFor(()=>{ let best=40; b.room.state.beasts.forEach((o,k)=>{ const d=Math.hypot(o.x-x,o.y-y); if(!before.has(k)&&o.tier===tier&&d<best){ best=d; id=k; } }); return id; });
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
    const cp=meOf(C), [ux,uy]=clearDir(cp.x,cp.y,70), want=tcDmg(vOfB(C,ssr),"man_cong",C); // tính trước: hạ hồn thú có thể lên cấp
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
    const shield=Math.round(calcStats(vohonIndex(v.vohon),v.level,v.rings.map(tierOfYears),1,{},{},D.res?.bonus).maxHp*tc.shield);
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
  const cast=(b,i,wait=200)=>skillCast(b,i,wait);
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
  // 2.5a–2.5d dùng bot E (khối ab1 của INLINE; khối không thụt lề lại để diff gọn). Các hàm phụ ở trên dùng chung cho đoạn sau.
  if(inPart("ab1")){ await ab1Block1({ B, FIVE, VILLAGE_RY, beastOf, cast, clearDir, dmgsOn, exp, goTo, hasBuff, hasSt, inSafeOf, leaveSafe, meOf, safe, spawnNear, sqOf, switchRow, tienCo, vname }); } // hết nhóm 1: 2.5a–2.5d
  // ---------- 8.1a: hồn kỹ vòng 5–10, chọn 4 ô mang theo, Võ Hồn Chân Thân (5 võ hồn mẫu) ----------
  if(inPart("ab2")){ await ab2Block1({ B, FIVE, beastOf, clearDir, dmgsOn, exp, hasBuff, hasSt, inSafeOf, leaveSafe, meOf, skillCast, spawnNear, vname }); }
  // ---------- 8.1b: hồn kỹ vòng 5–10 và Võ Hồn Chân Thân lưu phái Thiêu đốt ----------
  if(inPart("ab2")){ await ab2Block2({ B, beastOf, clearDir, dmgsOn, exp, hasBuff, hasSt, leaveSafe, meOf, skillCast, spawnNear, vname }); }
  // ---------- 8.1c: hồn kỹ vòng 5–10 và Võ Hồn Chân Thân lưu phái Cảm điện ----------
  if(inPart("ab2")){ await ab2Block3({ VILLAGE_RY, beastOf, clearDir, dmgsOn, exp, hasBuff, hasSt, inSafeOf, leaveSafe, meOf, safe, skillCast, spawnNear, vname }); }
  // ---------- 8.1d: hồn kỹ vòng 5–10 và Võ Hồn Chân Thân 5 võ hồn còn lại ----------
  if(inPart("ab2")){ await ab2Block4({ B, beastOf, clearDir, dmgsOn, exp, hasBuff, hasSt, leaveSafe, meOf, skillCast, spawnNear, vname }); }
  // ---------- 8.3: 4 võ hồn mới (Phá Hồn Thương, A Ngân, Liệt Hỏa Thương Lang, Băng Phượng Hoàng) ----------
  if(inPart("ab2")){ await ab2Block5({ B, beastOf, clearDir, dmgsOn, exp, hasBuff, hasSt, leaveSafe, meOf, skillCast, spawnNear, tienCo, vname }); }
  // ---------- 9.5: hiệu ứng hồn kỹ theo sao võ hồn (STAR_SKILL, 4★ hồi chiêu, 6★ tiên cơ riêng) ----------
  if(inPart("ab2")){ await ab2Block6({ clearDir, dmgsOn, exp, leaveSafe, meOf, spawnNear, sqOf, vname }); }
  // ---------- 9.6: hồn kỹ Chân Thân (ChanThanDef.skill: ô P đổi thành hồn kỹ này trong lúc biến hình, hồi chiêu riêng) ----------
  if(inPart("ab2")){ await ab2Block7({ beastOf, clearDir, dmgsOn, exp, hasSt, leaveSafe, meOf, spawnNear, vname }); }
  // ---------- 3.5: chiêu có báo trước của hồn thú từ 1.000 năm ----------
  if(inPart("ab2")){ await ab2Block8({ VILLAGE_RY, beastOf, blocked, goTo, inSafeOf, leaveSafe, meOf, safe, tienCo }); }
  // ---------- BĐ4: tinh anh (biến dị) ----------
  if(inPart("ab2")){ await ab2Block9({ VILLAGE_RY, blocked, meOf, safe, spawnObj, st }); }
  // ---------- BĐ5: tà hóa thú vương theo lịch, máu theo số người, giai đoạn 2, chia thưởng, 3 lần/ngày, rương ----------
  if(inPart("ab1")){ await ab1Block2({ A, bossClock, meOf }); }
  // ---------- 3.2: hạ hồn thú -> hồn hoàn mang đúng số năm -> nhặt vào túi; ưu tiên người hạ 15 giây; túi đầy; hấp thụ từ túi ----------
  if(inPart("ab1")){ await ab1Block3({ A, B, VILLAGE_RY, blocked, comboHits, inSafe, meOf, p, safe, spawnObj, sqOf, st, tiled, vOf }); }
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
if(A.coreKeep) ok(same((A.bag?.items??[]).filter(i=>i.code===CORE_ITEM).map(i=>[i.id,i.stars,sj(i.stats),i.vohon]),A.coreKeep),
  `vào lại: ${A.coreKeep.length} hồn hạch còn nguyên bộ, sao, chỉ số chính và phụ, võ hồn và ô đang gắn`);
if(A.coreEq){ // 5.2: hồn hạch đang gắn vẫn gắn đúng ô, chỉ số và hiệu ứng bộ vẫn áp
  const sv=await test(A,"stats");
  ok(sv.rowId===A.coreEq.vohon&&sj(sv.slots)===sj(A.coreEq.slots)&&same(sv.cores,A.coreEq.cores)&&same(sv.live.fx,A.coreEq.fx),
    `vào lại: ${Object.keys(sv.slots).length} hồn hạch vẫn gắn đúng ô trên võ hồn ra trận, hiệu ứng bộ ${JSON.stringify(sv.live.fx)}`);
}
if(A.coreBench){ const sb=await test(A,"stats",{rowId:A.coreBench.vohon});
  ok(A.coreBench.ids.every(id=>A.bag.items.find(i=>i.id===id)?.vohon===A.coreBench.vohon)&&sb.sets.tien_co===4,"vào lại: 4 Tiên Cơ vẫn gắn trên võ hồn ngoài sân"); }
if(A.boneKeep) ok(A.boneKeep.length>=3&&same(bonesOf(A).map(i=>[i.id,i.years,i.stats?.beast,i.stats?.slot]),A.boneKeep),`vào lại: ${A.boneKeep.length} hồn cốt còn nguyên loài, vị trí, số năm`);
if(A.boneEq){ // 4.2: hồn cốt đang gắn vẫn gắn, chỉ số vẫn cộng
  const sv=await test(A,"stats");
  ok(A.bag.items.find(i=>i.id===A.boneEq.id)?.vohon===A.boneEq.vohon&&sv.rowId===A.boneEq.vohon&&sv.bones.atk===A.boneEq.atk&&Math.abs(sv.live.atk-sv.stats.atk)<1e-6,
    `vào lại: hồn cốt Tay phải vẫn gắn trên võ hồn ra trận, công +${sv.bones.atk}`);
}
ok(A.owned&&same(A.owned.team,saved.team)&&A.owned.active===saved.active,`vào lại: đội ${JSON.stringify(A.owned?.team)}, ra trận ${A.owned?.active}`);
ok(same(prog(),saved.prog),`vào lại: cấp, kinh nghiệm, sao từng võ hồn (cả võ hồn mở bằng mảnh) đã lưu ${JSON.stringify(prog())}`);
const HOOK=!!(await test(A,"ping"))?.enabled; // bài độc lập cần hook test (STANDALONE) bỏ qua khi server không bật GAME_TEST=1
await A.room.leave();
return { HOOK, tiled, st, blocked, vil };
}
