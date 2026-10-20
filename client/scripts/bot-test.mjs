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
// gắn hồn cốt (4.2: đúng / sai vị trí, đổi chỗ, tháo khi túi đầy, chỉ số, giao chiến, đi cổng và vào lại), kỹ năng hồn cốt
// (4.3: chủ động trúng, tốn hồn lực, hồi chiêu riêng, bị chặn khi Câm lặng / vùng an toàn; bị động áp khi gắn, mất khi tháo), cường hóa hồn
// cốt (4.4: điểm theo niên hạn, cùng vị trí +50%, mốc +5 / +20, nguyên liệu bị xóa, từ chối đang gắn / chính nó / giao chiến, chỉ số
// tăng ngay khi đang gắn, giữ cấp khi tháo, qua đi cổng và vào lại), hồn hạch rơi
// (5.1: sao theo niên hạn, bộ theo bản đồ, số dòng phụ theo sao, tinh anh chắc chắn rơi, túi đầy, đi cổng và vào lại), gắn hồn hạch
// (5.2: 6 ô, đổi chỗ, tháo khi túi đầy, chỉ số chính và phụ, bộ 2 / 4 món của Hạo Thiên, Tiên Cơ, Phượng Hoàng, Xà Hoàng, Linh Miêu,
// Lam Ngân, giao chiến, gục, đi cổng và vào lại), nâng cấp hồn hạch (5.3: điểm theo sao, cùng bộ thêm, +3 thêm dòng phụ, tới +15,
// nguyên liệu bị xóa, từ chối đang gắn / chính nó / giao chiến, chỉ số tăng ngay khi đang gắn, vào lại), tà hóa thú vương
// (BĐ5: lịch giờ Việt Nam, báo toàn server, máu theo số người trong hang, giai đoạn 2, chia thưởng theo ngưỡng 3%, 3 lần/ngày,
// mở rương, rút đi, phòng hủy rồi mở lại), NPC (6.1: nói chuyện khi đứng gần, mua đan đủ / thiếu Hồn Tệ, túi đầy, bán đồ dư theo giá,
// không bán đồ đang gắn / đan, lò rèn cường hóa hồn cốt và nâng cấp hồn hạch, đứng xa bị từ chối, vào lại còn nguyên), nhiệm vụ tân thủ (6.2: tài khoản mới
// đi hết chuỗi của Ngọc Tiểu Cương, mục tiêu đếm theo sự kiện thật, nhận / trả khi đứng xa bị từ chối, thưởng đúng, túi đầy, đi cổng
// và thoát vào lại giữ tiến độ, mục tiêu đã đạt sẵn), tổ đội người chơi (7.1: mời theo tên / bấm vào hồn sư, từ chối, chống spam
// lời mời, tối đa 4, chia kinh nghiệm trong / ngoài 300 pixel và khác bản đồ, +5% mỗi người, giảm chênh cấp từng người, 40/20
// trong đội võ hồn, ưu tiên nhặt cả tổ đội, rời / đuổi / chuyển trưởng nhóm / giải tán, rời game quá lâu), cộng minh (8.2: từng
// mốc của 4 trụ cột Võ hồn / Hồn hoàn / Hồn cốt / Hồn hạch, chỉ số mọi võ hồn kể cả võ hồn đổi vào sau, thông báo mốc mới, mất mốc
// khi tháo đồ, thoát vào lại vẫn giữ), hồn kỹ vòng 5–10 và Võ Hồn Chân Thân (8.1a: hồn kỹ vòng 5, 6, 10 đúng sức mạnh
// theo năm, chọn 4 ô mang theo và từ chối khi sai / giao chiến, hồi chiêu đi theo hồn kỹ khi đổi ô, Chân Thân tăng chỉ số rồi tắt đúng giờ,
// hồi chiêu riêng, đổi võ hồn thì hết, võ hồn chưa có dữ liệu chỉ tăng chỉ số, Phục Chế không chép tuyệt kỹ, ô lưu sau khi thoát vào lại), Đại Đấu Hồn Trường (7.2: xếp hàng ở NPC, ghép theo Elo gần nhất, không ghép khi đang đi cổng /
// trong tổ đội, đấu đội võ hồn trong phòng riêng, đánh trúng đối thủ, hạ hết đội / rời sân / không vào sân / hết giờ, Elo, thưởng,
// về đúng bản đồ và vị trí cũ, bảng xếp hạng, cộng minh và Chân Thân trong sân) cần server bật hook kiểm thử: GAME_TEST=1 npm run dev:server.
import { Client } from "colyseus.js";
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { TIERS, TRAVEL_CAST, TEAM_SIZE, XP_SHARE_ACTIVE, XP_SHARE_BENCH, REVIVE_SECS, RESPAWN_SECS, xpNeed, beastLevel, xpLevelScale,
  BEASTS, MAP_MOVED, XP_LEVEL_CAP,
  VOHON, HE, vohonIndex, calcStats, tierOfYears, TIEN_CO, TIEN_CO_MAX, TIEN_CO_GAIN, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY,
  BAG_SLOTS, DAN_CD, STARTER_ITEMS, itemDef, formatHonTe, formatYears,
  TIER_MULT, SKILLS, skillsOf, skillPower, buffPower, BUFF_SCALE, TIEN_CO_RIENG, tienCoOf, STATUS, statusBit, buffBit, BUFFS, CRIT, PCT_HP_CAP,
  BONDS, bondsOf,
  CC_TIER_MULT, BEAST_REGEN, TEAM_COMBAT_SECS, PHOENIX_FIELD_R, PHONG_LOI, BEAST_AGGRO_R, BEAST_WANDER, SPAWN_CLEAR,
  MAPS, MAX_YEARS, beastStats, rollYears, tierBand, parseLevelRange, RING_ITEM, DROP_OWNER_SECS, absorbSecs, absorbChance, ringLimit,
  MAX_RINGS, MAX_LEVEL, SHARD_UNLOCK, STAR_COST, MAX_STARS, starCost, shardChance, shardCode, starMult,
  BONE_ITEM, BONE_SLOTS, boneChance, boneStats, boneName, boneBonus, PICKUP_RANGE,
  BEAST_SKILL_YEARS, beastSkillOf, teleHits, TELE_PAD, TELE_WARN, TELE_FIRST,
  BOSSES, bossIndex, beastIndex, ELITE, ELITE_RAGE, bossHpMult, teleZones, beastBuffBit, BEAST_BUFFS, beastName,
  KING, KING_CHEST, KING_TIMES, kingNext, kingActive, vnDay, vnHHMM, kingShardPool, chestCode,
  BONE_SKILLS, BONE_ACTIVE_SLOTS, BONE_PASSIVE_CAP, boneSkillOf, bonePassive,
  BONE_MAX_ENHANCE, BONE_FEED_PER_YEAR, BONE_FEED_SAME_SLOT, BONE_FEED_CARRY, boneFeedXp, boneEnhanceLevel, boneEnhanceNeed, boneSkillMult,
  boneEnhancePreview,
  CORE_ITEM, CORE_SETS, CORE_SUBS, CORE_SUB_ROLL, CORE_STATS, CORE_STAT_IDS, CORE_STAR_K, CORE_MAP_SET, MAX_CORE_STARS, coreChance, coreStarBand, rollCore,
  coreSubMax, coreSetIndex, coreName, coreStatText, coreMainValue, CORE_SLOTS, CORE_SET_FX, coreBonus, coreFx,
  CORE_MAX_ENHANCE, CORE_FEED_STAR, CORE_FEED_SAME_SET, CORE_FEED_CARRY, CORE_ENHANCE_MAIN, CORE_MAX_SUBS, coreFeedXp, coreEnhanceLevel, coreEnhanceNeed,
  coreEnhancePreview, coreUpgradeSubs, coreSubRolls,
  NPCS, npcDef, NPC_RANGE, SHOP, SHOP_MAX_QTY, sellPrice, ringSellPrice, RING_SELL, BONE_SELL, BONE_SELL_ENH, CORE_SELL, SHARD_SELL,
  QUEST_STARTER, questChain, questStart, parseQuest, questStatus, questRewardText, SWITCH_CD,
  HIGH_RINGS, CHAN_THAN_RING, DEFAULT_LOADOUT, ringSkill, skillChoices, loadoutOf, parseLoadout, chanThanOf, chanThanStats,
  PARTY_MAX, PARTY_XP_RANGE, PARTY_INVITE_SECS, PARTY_OFFLINE_SECS, partyXpShare,
  RESONANCE, RES_VOHON_LEVEL, RES_BONE_ENHANCE, RES_CORE_STARS, resonanceProgress, resonanceLevels, resonanceBonus,
  ARENA, ARENA_MAP, ARENA_SHARDS, eloAfter, arenaWindow, arenaPairs } from "../../shared/data.ts";
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
/** Vào phòng bản đồ (từ 7.2: hoặc phòng sân đấu `roomId` server gửi khi ghép trận) và nghe tin nhắn riêng (log, danh sách võ hồn + đội hình). */
async function enter(b,roomId){
  // Bản đồ đang đứng lấy từ /api/me (server lưu); client chỉ chuyển mapId để ghép phòng.
  b.room=roomId?await new Client(WS).joinById(roomId,{token:b.token}):await new Client(WS).joinOrCreate("map",{token:b.token,mapId:b.mapId});
  b.owned=null; b.ownedMsgs=0; b.portal=null; b.travel=null; b.squad=null;
  b.leftCode=null; b.room.onLeave(c=>{b.leftCode=c;});
  // Đại Đấu Hồn Trường (7.2): xếp hàng / đã ghép / pha trận / kết quả, bảng xếp hạng.
  b.arena=[]; b.aq=null; b.aqN=0; b.room.onMessage("arena",m=>{b.arena.push(m); if(m.k==="queue"){b.aq=m; b.aqN++;}});
  b.top=null; b.topN=0; b.room.onMessage("arenaTop",m=>{b.top=m; b.topN++;});
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
  b.room.onMessage("enhanced",m=>{b.enh=m;}); // kết quả cường hóa hồn cốt (4.4)
  b.room.onMessage("enhancedcore",m=>{b.coreUp=m;}); // kết quả nâng cấp hồn hạch (5.3)
  b.npc=null; b.room.onMessage("npc",m=>{b.npc=m;}); // server cho mở hộp thoại NPC (6.1)
  b.party=null; b.partyMsgs=0; b.room.onMessage("party",m=>{b.party=m; b.partyMsgs++;}); // khung tổ đội (7.1)
  b.quest=null; b.questMsgs=0; b.room.onMessage("quest",m=>{b.quest=m; b.questMsgs++;}); // tiến độ nhiệm vụ tân thủ (6.2)
  b.res=null; b.resMsgs=0; b.resEv=[]; b.room.onMessage("resonance",m=>{b.res=m; b.resMsgs++; if(m.ev) b.resEv.push(...m.ev);}); // cộng minh (8.2)
  b.elite=[]; b.room.onMessage("elite",m=>b.elite.push(m)); // tinh anh xuất hiện / bị hạ (BĐ4)
  b.boss=[]; b.room.onMessage("boss",m=>{b.boss.push(m); if(b.boss.length>200) b.boss.shift();}); // thú vương: báo trước, xuất hiện, xếp hạng, bị hạ (BĐ5)
  // 5.1: hồn hạch rơi 15% cả với hồn thú dưới 1.000 năm; tắt khi có hook (GAME_TEST=1) để không xen vào các kiểm tra đồ rơi khác,
  // phần 5.1 tự bật lại. Chờ trả lời (server gửi tin vohons trước tin test) rồi mới đếm lại tin vohons, để không lẫn vào kiểm tra sau.
  b.test=null; b.room.send("test",{op:"core",r:100}); await waitFor(()=>b.test,1500); b.test=null; b.owned=null; b.ownedMsgs=0;
  b.bag=null; b.room.send("vohons"); b.room.send("bag"); b.room.send("quest",{op:"get"}); b.room.send("resonance");
}
/**
 * Túi đồ (3.1): tổng số món theo mã, và dấu vân tay cả túi (id, mã, số lượng, số năm từng ô + Hồn Tệ; từ 4.1 loài / vị trí /
 * cường hóa hồn cốt, từ 4.2 võ hồn đang gắn, từ 5.1 sao / bộ / chỉ số hồn hạch) để so trước/sau khi lưu.
 */
const qtyOf=(b,code)=>(b.bag?.items??[]).filter(i=>i.code===code).reduce((a,i)=>a+i.qty,0);
const bagKey=b=>b.bag&&JSON.stringify([b.bag.honTe,b.bag.items.map(i=>[i.id,i.code,i.qty,i.years,i.stars,i.enhance,i.stats&&Object.entries(i.stats).sort(),i.vohon])]);
const bonesOf=b=>(b.bag?.items??[]).filter(i=>i.code===BONE_ITEM);
/** JSON với khóa đã sắp (cột JSONB của PostgreSQL đổi thứ tự khóa khi đọc lại, ví dụ `items.stats` của hồn hạch có thêm `slot` từ 5.2). */
const sj=o=>JSON.stringify(o&&typeof o==="object"?Object.entries(o).sort():o);
/** Gửi `use {id}` rồi chờ server trả túi mới (dùng được) hoặc một dòng log (bị từ chối). */
async function useItem(b,id){ const n=b.bagMsgs??0, l=b.logs.length; b.room.send("use",{id}); await waitFor(()=>(b.bagMsgs??0)>n||b.logs.length>l,1500); }
const lastLog=(b,re)=>waitFor(()=>re.test(b.logs.at(-1)??""),800);
// ---------- 6.1: NPC ----------
/** Chỗ đứng của NPC `id` trong file Tiled của bản đồ (object `npc`, thuộc tính `npc`). */
const npcSpot=(mapId,id)=>{ const o=JSON.parse(readFileSync(new URL(`../../shared/assets/${mapId}.json`,import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[])
  .find(o=>o.type==="npc"&&(o.properties??[]).find(q=>q.name==="npc")?.value===id); return o?{x:o.x,y:o.y}:null; };
/** Gửi `talk {npc}`; trả mã NPC nếu server cho mở hộp thoại (tin `npc`), null nếu bị từ chối (một dòng log). */
async function talk(b,npc){ b.npc=null; const l=b.logs.length; b.room.send("talk",{npc}); await waitFor(()=>b.npc||b.logs.length>l,1500); return b.npc?.id??null; }
/** Gửi `buy` / `sell`; server luôn trả một dòng log (kết quả hoặc lý do) rồi túi mới. Trả dòng log đó. */
async function trade(b,type,msg){ const n=b.bagMsgs??0, l=b.logs.length; b.room.send(type,msg); await waitFor(()=>(b.bagMsgs??0)>n&&b.logs.length>l,1500); return b.logs.at(-1)??""; }
const looseOf=b=>(b.bag?.items??[]).filter(i=>i.vohon===null);
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
/** Hướng (dx, dy) dài `len` pixel từ vị trí (x, y) mà đường đi không vướng ô chặn (và `back` pixel phía sau lưng, cho hồn thú sinh sau lưng). */
const clearDir=(x,y,len,back=0)=>[[1,0],[-1,0],[0,1],[0,-1],[0.7,0.7],[-0.7,0.7],[0.7,-0.7],[-0.7,-0.7]].find(([ux,uy])=>{ for(let d=2-back;d<=len;d+=2) if(blocked(x+ux*d,y+uy*d)) return false; return true; })??[1,0];
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
  // Từ 8.2 công của mọi võ hồn có cộng minh của tài khoản `b` (tin "resonance"; bot nhiều võ hồn cấp 30+ / nhiều hồn hoàn là đạt mốc).
  const atkOf=(v,b=A)=>calcStats(vohonIndex(v.vohon),v.level,v.rings.map(tierOfYears),1,{},{},b.res?.bonus).atk;
  /** Sát thương tiên cơ dự kiến của võ hồn v của bot `b`: [thường, chí mạng]. */
  const tcDmg=(v,he,b=A)=>{const x=atkOf(v,b)*tienCoOf(v.vohon).dmg; return [Math.max(1,Math.round(x)),Math.max(1,Math.round(x*1.8))];};
  // Hồn thú mới gần chỗ sinh nhất (bộ sinh hồn thú của bản đồ có thể thêm hồn thú khác cùng lúc ở nơi xa).
  async function spawnNear(b,tier,dx,dy=0,hpx=1){ const before=new Set(b.room.state.beasts.keys()), q=meOf(b), x=q.x+dx, y=q.y+dy;
    await test(b,"spawn",{tier,dx,dy,hpx}); let id=null;
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
  const atkE=id=>calcStats(vohonIndex(id),40,YRS.map(tierOfYears),1,{},{},E.res?.bonus).atk; // E đủ mốc cộng minh Võ hồn / Hồn hoàn (8.2)
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
  async function face(back=0){ [ux,uy]=clearDir(me.x,me.y,100,back); await step(E,ux,uy); }
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
    // Chờ theo state, hạn chờ vẫn ngắn hơn 2 giây choáng đầy đủ tính từ lúc tung (thời gian trạng thái chạy theo nhịp server).
    const secs=2*CC_TIER_MULT[4];
    ok(await waitFor(()=>!hasSt(beastOf(E,cb),"stun"),secs*1000+700),`hồn thú 10 vạn năm hết choáng sau ${secs} giây (2 × ${CC_TIER_MULT[4]})`);
    await test(E,"clear");
  }
  // Hạo Thiên Chùy (cường công): % sinh lực, Phá giáp, liên hoàn kết thúc bằng hất tung.
  {
    const id="hao_thien_chuy", sk=skillsOf(id), atk=atkE(id);
    ok(await lineup(id),`E: ${vname(id)} ra trận`);
    await face(26); const f=await spawnAt(3,22), bk=await spawnAt(3,-26);
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
      // Thời gian trạng thái chạy theo nhịp server (dt mỗi nhịp kẹp 100 ms, server bận thì chậm hơn đồng hồ thật): chờ hết co giật
      // rồi mới xem Câm lặng (còn thêm 1,5 giây), không đo bằng một khoảng ngủ cố định.
      const unroot=await waitFor(()=>!hasSt(beastOf(E,tb),"root"),3*CC_TIER_MULT[3]*1000), silent=hasSt(beastOf(E,tb),"silence");
      ok(unroot&&silent,`hết co giật sau ${3*CC_TIER_MULT[3]} giây, Câm lặng còn (${5*CC_TIER_MULT[3]} giây)`+
        (unroot&&silent?"":` [hồn thú ${beastOf(E,tb)?"còn":"mất"}, co giật ${hasSt(beastOf(E,tb),"root")}, Câm lặng ${silent}]`));
      const x0=me.x, y0=me.y; await basic(id,2,{d:40});
      ok(Math.hypot(me.x-x0,me.y-y0)>=50&&E.fxs.some(f=>f.k==="fly"&&f.id===E.room.sessionId),`${sk[2].name}: bay ${Math.hypot(me.x-x0,me.y-y0).toFixed(0)} pixel qua hồn thú (fx fly)`);
      // Áo nghĩa: mọi hồn thú trong 160 pixel Cảm điện 8 giây (lâu hơn mặc định 6 giây).
      await test(E,"clear"); await face(70); const a1=await spawnAt(4,24), a2=await spawnAt(4,90), a3=await spawnAt(4,-70);
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
      // Hết hạn thì chờ theo state (thời gian trạng thái chạy theo nhịp server, server bận thì chậm hơn đồng hồ thật).
      ok(await waitFor(()=>!hasSt(beastOf(E,l0),"vuln"),Math.max(0,(STATUS.lock.burst.secs+1.6)*1000-(Date.now()-vt))),`hết Dễ thương sau ${STATUS.lock.burst.secs} giây`);
      // Vùng phong tỏa: bay tới hồn thú cách 90, vùng cố định ở chỗ đặt; hồn sư lùi ra xa vùng vẫn đánh đủ nhát.
      for(const [i,zd] of [[1,100],[3,115]]){
        // Hướng thử phải trống hết quãng tới hồn thú (face() chỉ kiểm 100 pixel).
        await test(E,"clear"); [ux,uy]=clearDir(me.x,me.y,zd+20); await step(E,ux,uy); const zb=await spawnAt(4,zd); await test(E,"status",{s:"stun",secs:10});
        // Hồn thú hoang lang thang vào gần thì có thể thành mục tiêu thay cho con vừa sinh: ghi lại để chẩn đoán.
        const others=()=>[...E.room.state.beasts.entries()].filter(([k,o])=>k!==zb&&Math.hypot(o.x-me.x,o.y-me.y)<160).map(([,o])=>`${Math.hypot(o.x-me.x,o.y-me.y).toFixed(0)}`);
        // Chờ thấy cú bay trong state (server bận thì bản vá đến sau hơn 150 ms), không đo sau một khoảng cố định.
        await test(E,"ready"); const d0=dist(zb), o0=others(); await cast(E,i,0);
        await waitFor(()=>dist(zb)<d0-40&&E.fxs.some(f=>f.k==="zone"),1500); const d1=dist(zb);
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
      const tC=Date.now(), cMs=STATUS.charm.secs*CC_TIER_MULT[3]*1000; await test(E,"status",{s:"allure",n:3}); const p0=posOf(cb); E.hurts=[];
      await test(E,"status",{s:"allure"});
      ok(hasSt(beastOf(E,cb),"charm")&&!beastOf(E,cb)?.allure,"đang Mê hoặc: không cộng thêm Mị hoặc");
      // Theo dõi tới khi hết Mê hoặc (1,875 giây trên hồn thú vạn năm): đi lung tung đổi hướng ngẫu nhiên nên lấy quãng xa nhất, không lấy
      // điểm cuối. Đòn trúng chỉ đếm tới trước lúc Mê hoặc có thể hết trên server (tính từ lúc gửi hook, trừ 300 ms): hết Mê hoặc thì
      // hồn thú đánh ngay, tin dmg gửi ngay còn bản vá state xóa Mê hoặc đến sau, và hai lần hỏi hook trước đó dài ra khi server bận.
      let far=0, agg=false, hurt=0;
      await waitFor(()=>{ const q=beastOf(E,cb); if(!q||!hasSt(q,"charm")) return true;
        far=Math.max(far,Math.hypot(q.x-p0[0],q.y-p0[1])); agg||=q.aggro; if(Date.now()<tC+cMs-300) hurt=E.hurts.length; return false; },cMs+1000);
      ok(beastOf(E,cb)&&!agg&&!hurt&&far>4,`Mê hoặc: bỏ mục tiêu, không đánh, đi lung tung ${far.toFixed(0)} pixel`+
        (hurt||agg?` [nhắm hồn sư ${agg}, trúng ${E.hurts.slice(0,hurt).map(h=>`${h.v} ${h.c}`).join("/")||"không"}]`:""));
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
      await test(E,"clear"); await face(30); const fb=await spawnAt(4,-30); await test(E,"status",{s:"stun",secs:10});
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
  // ---------- 8.1a: hồn kỹ vòng 5–10, chọn 4 ô mang theo, Võ Hồn Chân Thân (5 võ hồn mẫu) ----------
  {
    // Hàm thuần: vòng 7 không phải hồn kỹ, 5 võ hồn mẫu có đủ vòng 5, 6, 8, 9, 10, võ hồn khác vòng 5+ không có hồn kỹ; kiểm dạng ô.
    ok(FIVE.every(id=>HIGH_RINGS.every(n=>ringSkill(id,n-1))&&!ringSkill(id,CHAN_THAN_RING-1)&&chanThanOf(id)&&ringSkill(id,9).ult),
      "5 võ hồn mẫu có hồn kỹ vòng 5, 6, 8, 9, 10 (vòng 10 là tuyệt kỹ) và Võ Hồn Chân Thân vòng 7");
    ok(!ringSkill("hoa_long",4)&&!chanThanOf("hoa_long")&&same(skillChoices("hoa_long",10),[0,1,2,3])&&same(skillChoices("hao_thien_chuy",10),[0,1,2,3,4,5,7,8,9]),
      "võ hồn chưa có dữ liệu: vòng 5–10 không có hồn kỹ (chỉ tăng chỉ số)");
    ok(same(loadoutOf("lam_ngan_thao",[]),[...DEFAULT_LOADOUT])&&same(loadoutOf("lam_ngan_thao",[4,9,-1,0]),[4,9,-1,0])&&same(loadoutOf("hoa_long",[4,1,2,3]),[...DEFAULT_LOADOUT])
      &&!parseLoadout([0,0,1,2])&&!parseLoadout([0,1,2])&&!parseLoadout([0,1,2,10])&&same(parseLoadout([-1,-1,3,2]),[-1,-1,3,2]),
      "4 ô mang theo: mặc định vòng 1–4, ô trống -1, từ chối trùng / thiếu ô / vòng lạ");
    const K=await bot("Tester CT","hoa_long",{sex:1,hair:1,hairCol:4,outfitCol:2});
    await waitFor(()=>K.owned&&K.squad&&meOf(K)); const kp=meOf(K);
    for(const vohon of ["hao_thien_chuy","u_minh_linh_mieu","bich_lan_xa_hoang","cuu_bao_luu_ly_thap"]) await test(K,"grant",{vohon});
    const rowK=id=>K.owned.list.find(v=>v.vohon===id).rowId, vK=id=>K.owned.list.find(v=>v.vohon===id);
    ok(FIVE.every(id=>K.owned.list.some(v=>v.vohon===id))&&K.owned.list.every(v=>same(v.skills,[...DEFAULT_LOADOUT])),"K có 5 võ hồn mẫu + Hỏa Long, 4 ô mặc định vòng 1–4");
    const Y10=[423,764,1760,5000,12000,20000,50000,100000,100000,100000], P10=i=>skillPower(Y10[i]);
    // Từ 8.2 công của mọi võ hồn có cộng minh của tài khoản (K nhiều võ hồn cấp 100, nhiều hồn hoàn là đạt mốc): lấy % từ hook stats.
    let kres={}; const atkK=(id,n=10)=>calcStats(vohonIndex(id),n*10,Y10.slice(0,n).map(tierOfYears),1,{},{},kres).atk;
    for(const id of [...FIVE,"hoa_long"]) await test(K,"set",{rowId:rowK(id),level:100,xp:0,rings:Y10});
    await test(K,"set",{rowId:rowK("u_minh_linh_mieu"),level:60,xp:0,rings:Y10.slice(0,6)});
    kres=(await test(K,"stats")).res?.bonus??{}; console.log(`  K cộng minh: ${JSON.stringify(kres)}`);
    async function lineupK(id){ await test(K,"clear"); await test(K,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(K,[rowK(id),0,0,0]);
      await sendTeam(K,[rowK(id),...FIVE.filter(x=>x!==id).slice(0,3).map(rowK)]); return K.owned.active===rowK(id)&&await waitFor(()=>kp.vh===vohonIndex(id)); }
    async function loadout(id,skills){ const n=K.ownedMsgs, l=K.logs.length; K.room.send("loadout",{rowId:rowK(id),skills}); await waitFor(()=>K.ownedMsgs>n&&K.logs.length>l,1500); await sleep(80); return K.logs.at(-1)??""; }
    async function castK(i,wait=200){ K.dmgs=[]; K.fxs=[]; K.room.send("skill",{i}); await sleep(wait); }
    async function chanThan(){ const l=K.logs.length; K.fxs=[]; K.dmgs=[]; K.room.send("chanthan"); await waitFor(()=>K.logs.length>l,1500); await sleep(80); return K.logs.at(-1)??""; }
    const stats=async()=>(await test(K,"stats")).live;
    // Hồn thú từ 1.000 năm có chiêu báo trước (3.5) có thể choáng K giữa chừng: Câm lặng cả vùng để chúng chỉ đứng chịu đòn.
    const hush=()=>test(K,"status",{s:"silence",secs:20,all:true});
    // Võ Hồn Chân Thân trong làng (vùng an toàn) bị chặn.
    ok(await lineupK("hao_thien_chuy"),"K: Hạo Thiên Chùy ra trận (cấp 100, 10 hồn hoàn)");
    ok(inSafeOf(K)&&/Vùng an toàn/.test(await chanThan())&&kp.ava===0,"trong làng: không biến Chân Thân");
    // Xếp ô: sai thì bị từ chối, server gửi lại ô đang lưu.
    ok(/phím riêng/.test(await loadout("hao_thien_chuy",[6,1,2,3]))&&same(vK("hao_thien_chuy").skills,[...DEFAULT_LOADOUT]),"xếp vòng 7 (Chân Thân) vào ô: từ chối");
    ok(/chưa có hồn kỹ vòng 5/.test(await loadout("hoa_long",[4,1,2,3])),"Hỏa Long (chưa có dữ liệu) xếp vòng 5: từ chối");
    ok(/chưa có hồn hoàn thứ 8/.test(await loadout("u_minh_linh_mieu",[7,1,2,3]))&&same(vK("u_minh_linh_mieu").skills,[...DEFAULT_LOADOUT]),"U Minh Linh Miêu 6 hồn hoàn xếp vòng 8: từ chối");
    ok(/không hợp lệ/.test(await loadout("hao_thien_chuy",[4,4,2,3])),"ô trùng: từ chối");
    { const n=K.ownedMsgs, l=K.logs.length; K.room.send("loadout",{rowId:999999,skills:[4,1,2,3]}); await waitFor(()=>K.logs.length>l&&K.ownedMsgs>n,1500);
      ok(/không sở hữu/.test(K.logs.at(-1)??""),"võ hồn không phải của mình: từ chối"); }
    ok(await leaveSafe(K),"K: ra khỏi làng");
    let [kx,ky]=clearDir(kp.x,kp.y,110); const kat=d=>[Math.round(kx*d),Math.round(ky*d)];
    async function faceK(){ [kx,ky]=clearDir(kp.x,kp.y,110); await step(K,kx,ky); }
    await test(K,"hurt",{pct:10});
    ok(/Đang giao chiến/.test(await loadout("hao_thien_chuy",[4,5,9,0]))&&same(vK("hao_thien_chuy").skills,[...DEFAULT_LOADOUT]),"đang giao chiến: không xếp ô");
    await test(K,"rest",{s:TEAM_COMBAT_SECS+1});
    await loadout("hao_thien_chuy",[4,5,9,0]);
    ok(same(vK("hao_thien_chuy").skills,[4,5,9,0]),`Hạo Thiên Chùy mang: ${vK("hao_thien_chuy").skills.map(r=>ringSkill("hao_thien_chuy",r).name).join(", ")}`);
    // Hồn kỹ vòng 5 (ô U): quanh thân, sức mạnh theo hồn hoàn 12.000 năm, Phá giáp 2 tầng.
    {
      const id="hao_thien_chuy", atk=atkK(id), s5=ringSkill(id,4), s6=ringSkill(id,5), ult=ringSkill(id,9);
      await test(K,"clear"); await test(K,"ready"); const b5=await spawnNear(K,4,...kat(30),20); const hp5=beastOf(K,b5)?.maxHp??0;
      await test(K,"status",{s:"stun",secs:10}); await castK(0);
      let want=exp(atk*P10(4)*s5.dmg+Math.min(hp5*s5.pctHp,atk*P10(4)*PCT_HP_CAP));
      ok(want.includes(dmgsOn(K,b5)[0]?.v)&&await waitFor(()=>beastOf(K,b5)?.armor===2,800)&&K.fxs.some(f=>f.k==="soulring"&&f.i===4),
        `vòng 5 ${s5.name} (ô U): ${dmgsOn(K,b5)[0]?.v} (cần ${want.join(" hoặc ")}), Phá giáp ${beastOf(K,b5)?.armor} tầng, sáng vòng 5`);
      ok(Math.abs(kp.cds[0]-s5.cd)<0.5&&kp.cds[1]===0,`hồi chiêu theo ô: U ${kp.cds[0].toFixed(1)} giây (cần ${s5.cd}), I chưa hồi`);
      // Vòng 6 (ô I): nửa trước mặt, hất tung.
      await test(K,"clear"); await faceK(); const b6=await spawnNear(K,4,...kat(30),20); const hp6=beastOf(K,b6)?.maxHp??0; await hush(); await castK(1);
      want=exp(atk*P10(5)*s6.dmg+Math.min(hp6*s6.pctHp,atk*P10(5)*PCT_HP_CAP));
      ok(want.includes(dmgsOn(K,b6)[0]?.v)&&await waitFor(()=>hasSt(beastOf(K,b6),"stun"),800),`vòng 6 ${s6.name} (ô I): ${dmgsOn(K,b6)[0]?.v} (cần ${want.join(" hoặc ")}), hất tung [hướng ${kx},${ky}]`);
      // Tuyệt kỹ vòng 10 (ô O): 12 nhát, nhát cuối Choáng 2 giây; ai cũng thấy fx ult.
      await test(K,"clear"); const bu=await spawnNear(K,4,...kat(40),20); const hpu=beastOf(K,bu)?.maxHp??0; await hush(); const bf=B.fxs.length;
      await castK(2,0);
      ok(await waitFor(()=>dmgsOn(K,bu).length>=ult.n&&hasSt(beastOf(K,bu),"stun"),3000),`tuyệt kỹ ${ult.name}: ${dmgsOn(K,bu).length}/${ult.n} nhát, nhát cuối Choáng`);
      want=exp(atk*P10(9)*ult.dmg+Math.min(hpu*ult.pctHp,atk*P10(9)*PCT_HP_CAP));
      ok(want.includes(dmgsOn(K,bu)[0]?.v),`tuyệt kỹ nhát đầu ${dmgsOn(K,bu)[0]?.v} (cần ${want.join(" hoặc ")}: sức mạnh hồn hoàn 10 vạn năm ×${P10(9)})`);
      ok(K.fxs.some(f=>f.k==="ult"&&f.name===ult.name)&&(B.room.roomId!==K.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===K.room.sessionId),800)),"fx tuyệt kỹ: mình và người cùng phòng đều nhận");
      // Đổi chỗ ô ngoài giao chiến: hồi chiêu đi theo hồn kỹ, không làm mới.
      const cdU=kp.cds[2]; await test(K,"clear"); await test(K,"rest",{s:TEAM_COMBAT_SECS+1});
      await loadout(id,[9,5,4,0]);
      ok(same(vK(id).skills,[9,5,4,0])&&kp.cds[0]>=cdU-1&&kp.cds[0]>30,`chuyển tuyệt kỹ từ ô O sang ô U: hồi chiêu đi theo (${kp.cds[0].toFixed(1)} giây)`);
      ok(kp.cds[2]<=s5.cd+0.1,`ô O nhận ${s5.name}: hồi chiêu của chính nó ${kp.cds[2].toFixed(1)} giây (≤ ${s5.cd}), không giữ hồi chiêu tuyệt kỹ vừa rời ô`);
      K.fxs=[]; K.room.send("skill",{i:0}); await sleep(250); ok(!K.fxs.some(f=>f.k==="ult"),"ô U đang hồi chiêu: không tung lại tuyệt kỹ");
      // Bỏ tuyệt kỹ ra rồi xếp lại vào ô khác (ô đó hết hồi chiêu): vẫn giữ hồi chiêu còn lại của tuyệt kỹ.
      await loadout(id,[-1,5,4,0]); await loadout(id,[5,9,4,0]);
      ok(same(vK(id).skills,[5,9,4,0])&&kp.cds[1]>30,`bỏ tuyệt kỹ ra rồi xếp vào ô I: hồi chiêu còn ${kp.cds[1].toFixed(1)} giây`);
      ok(kp.cds[0]<=s6.cd+0.1,`ô U (vừa trống) nhận ${s6.name}: hồi chiêu ${kp.cds[0].toFixed(1)} giây (≤ ${s6.cd})`);
      await loadout(id,[9,5,4,0]);
      await test(K,"ready");
    }
    // Võ Hồn Chân Thân (phím R) của Hạo Thiên Chùy: chỉ số tăng theo hồn hoàn vòng 7, đúng thời gian, hồi chiêu riêng từng võ hồn.
    {
      const id="hao_thien_chuy", def=chanThanOf(id), cs=chanThanStats(def,Y10[6]), bp=buffPower(Y10[6]);
      await test(K,"clear"); await test(K,"ready"); const s0=await stats(); const hp0=kp.hp;
      const bc=await spawnNear(K,4,...kat(30),20); const hpc=beastOf(K,bc)?.maxHp??0; await hush(); const bf=B.fxs.length;
      const msg=await chanThan();
      ok(kp.ava>def.secs-1&&Math.abs(kp.avaCd-def.cd)<1&&msg.includes(def.name),`${def.name}: ${kp.ava.toFixed(1)} giây, hồi ${kp.avaCd.toFixed(0)} giây`);
      const s1=await stats();
      ok(Math.abs(cs.atk-def.stats.atk*bp)<1e-3&&Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.01&&Math.abs(s1.def-s0.def-cs.def)<1e-3,
        `chỉ số × buffPower(50.000 năm) ${bp}: công ${s0.atkNow.toFixed(1)} -> ${s1.atkNow.toFixed(1)} (+${Math.round(cs.atk*100)}%), giảm sát thương +${Math.round(cs.def*100)}%`);
      ok(s1.maxHp===Math.round(s0.maxHp*(1+cs.hp))&&kp.hp>=hp0+(s1.maxHp-s0.maxHp)-1,`sinh lực tối đa ${s0.maxHp} -> ${s1.maxHp}, hồi phần tăng thêm (${hp0} -> ${kp.hp})`);
      const want=exp(s1.atkNow*P10(6)*def.burst.dmg+Math.min(hpc*def.burst.pctHp,s1.atkNow*P10(6)*PCT_HP_CAP));
      ok(want.includes(dmgsOn(K,bc)[0]?.v)&&await waitFor(()=>hasSt(beastOf(K,bc),"stun"),800),`biến hình nện đất: ${dmgsOn(K,bc)[0]?.v} (cần ${want.join(" hoặc ")}, công đã tăng), Choáng`);
      ok(K.fxs.some(f=>f.k==="avatar"&&f.on)&&(B.room.roomId!==K.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="avatar"&&f.id===K.room.sessionId),800)
        &&await waitFor(()=>B.room.state.players.get(K.room.sessionId)?.ava>0,800)),"người cùng phòng thấy Chân Thân (fx avatar, PlayerState.ava)");
      // Hồn kỹ khi đang Chân Thân dùng công đã tăng (ô I = vòng 6).
      await test(K,"clear"); await faceK(); const b2=await spawnNear(K,4,...kat(30),20); const h2=beastOf(K,b2)?.maxHp??0; await hush(); const s6=ringSkill(id,5);
      const s2=await stats(); await castK(1);
      const w2=exp(s2.atkNow*P10(5)*s6.dmg+Math.min(h2*s6.pctHp,s2.atkNow*P10(5)*PCT_HP_CAP));
      ok(kp.ava>0&&w2.includes(dmgsOn(K,b2)[0]?.v),`đang Chân Thân: ${s6.name} ${dmgsOn(K,b2)[0]?.v} (cần ${w2.join(" hoặc ")})`);
      ok(/còn \d+ giây/.test(await chanThan()),"bấm R khi đang Chân Thân: báo giây còn lại");
      const skip=Math.floor(kp.ava)-1; await test(K,"rest",{s:skip}); await sleep(200); // hook rest nhận số giây nguyên
      ok(kp.ava>0&&kp.ava<2.1,`trôi ${skip} giây: còn ${kp.ava.toFixed(2)} giây`);
      ok(await waitFor(()=>kp.ava===0,3000)&&await lastLog(K,/đã hết/),"hết giờ: tắt Chân Thân, báo");
      const s3=await stats();
      ok(Math.abs(s3.atkNow-s0.atkNow)<0.01&&s3.maxHp===s0.maxHp&&!s3.ava,`chỉ số về như cũ: công ${s3.atkNow.toFixed(1)}, sinh lực tối đa ${s3.maxHp}`);
      ok(kp.avaCd>def.cd-def.secs-3&&kp.avaCd<def.cd-def.secs+1,`còn hồi chiêu ${kp.avaCd.toFixed(1)} giây`);
      K.room.send("chanthan"); await sleep(300); ok(kp.ava===0,"đang hồi chiêu: không biến hình");
      await test(K,"rest",{s:def.cd}); ok(kp.avaCd===0,"nghỉ đủ: hết hồi chiêu");
      await test(K,"clear"); await chanThan(); ok(kp.ava>0,"biến hình lại");
      // Đổi võ hồn thì hết Chân Thân; hồi chiêu riêng từng võ hồn.
      await test(K,"rest",{s:TEAM_COMBAT_SECS+1}); await waitFor(()=>kp.swCd===0,3500);
      K.room.send("switch",{slot:K.owned.team.indexOf(rowK("lam_ngan_thao"))});
      ok(await waitFor(()=>K.owned.active===rowK("lam_ngan_thao")&&kp.ava===0&&kp.avaCd===0,1500),`đổi sang Lam Ngân Thảo: Chân Thân của Hạo Thiên hết, Lam Ngân chưa hồi chiêu [ra trận ${K.owned.active===rowK("lam_ngan_thao")}, ava ${kp.ava}, hồi ${kp.avaCd}]`);
      const s4=await stats(); ok(Math.abs(s4.atkNow-atkK("lam_ngan_thao"))<0.01,`Lam Ngân Thảo không mang chỉ số Chân Thân của Hạo Thiên: công ${s4.atkNow.toFixed(1)}`);
    }
    // Lam Ngân Thảo: vòng 5 lướt Trói, vòng 6 lãnh vực 6 nhát, tuyệt kỹ kéo cả vùng lại và giam; Chân Thân Lam Ngân Hoàng.
    {
      const id="lam_ngan_thao", atk=atkK(id), s5=ringSkill(id,4), s6=ringSkill(id,5), ult=ringSkill(id,9);
      await test(K,"clear"); await test(K,"rest",{s:TEAM_COMBAT_SECS+1}); await loadout(id,[4,5,9,-1]);
      ok(same(vK(id).skills,[4,5,9,-1]),"Lam Ngân Thảo mang vòng 5, 6, 10, ô P trống");
      K.room.send("skill",{i:3}); ok(await lastLog(K,/chưa mang hồn kỹ/),"ô trống: báo chọn ở bảng đội hình");
      await test(K,"ready"); await faceK(); const b5=await spawnNear(K,4,...kat(50),20); await hush(); await castK(0);
      let want=exp(atk*P10(4)*s5.dmg);
      ok(want.includes(dmgsOn(K,b5)[0]?.v)&&await waitFor(()=>hasSt(beastOf(K,b5),"root"),800),`vòng 5 ${s5.name}: lướt ${dmgsOn(K,b5)[0]?.v} (cần ${want.join(" hoặc ")}), Trói [hướng ${kx},${ky}]`);
      await test(K,"clear"); const b6=await spawnNear(K,4,...kat(30),20); await test(K,"status",{s:"stun",secs:10}); await castK(1,0);
      ok(await waitFor(()=>dmgsOn(K,b6).length>=s6.n,s6.n*s6.every*1000+1500)&&await waitFor(()=>hasSt(beastOf(K,b6),"root"),800),`vòng 6 ${s6.name}: ${dmgsOn(K,b6).length}/${s6.n} nhát, nhát cuối Trói`);
      want=exp(atk*P10(5)*s6.dmg); ok(want.includes(dmgsOn(K,b6)[0]?.v),`lãnh vực nhát đầu ${dmgsOn(K,b6)[0]?.v} (cần ${want.join(" hoặc ")})`);
      await test(K,"clear"); const g1=await spawnNear(K,4,...kat(70),20), g2=await spawnNear(K,4,...kat(110),20); await test(K,"status",{s:"stun",secs:10,all:true});
      await castK(2,300);
      const dist=bid=>{ const q=beastOf(K,bid); return q?Math.hypot(q.x-kp.x,q.y-kp.y):-1; };
      want=exp(atk*P10(9)*ult.dmg);
      ok(await waitFor(()=>[g1,g2].every(g=>dist(g)>=0&&dist(g)<TIERS[4].size/2+16&&hasSt(beastOf(K,g),"root")&&beastOf(K,g).poison===3),800)&&want.includes(dmgsOn(K,g1)[0]?.v),
        `tuyệt kỹ ${ult.name}: ${dmgsOn(K,g1)[0]?.v} (cần ${want.join(" hoặc ")}), kéo 2 hồn thú về ${dist(g1).toFixed(0)} / ${dist(g2).toFixed(0)} pixel, Trói, Trúng độc 3 tầng`);
      const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]); await test(K,"clear"); await test(K,"ready"); const s0=await stats();
      await chanThan(); const s1=await stats();
      ok(kp.ava>0&&Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.01&&Math.abs(s1.def-cs.def)<1e-3,`${def.name}: tốc độ ${s0.spd.toFixed(1)} -> ${s1.spd.toFixed(1)}, giảm sát thương ${Math.round(s1.def*100)}%`);
      await test(K,"rest",{s:def.secs});
      ok(await waitFor(()=>kp.ava===0,1500),"Lam Ngân Hoàng Chân Thân hết sau "+def.secs+" giây");
    }
    // U Minh Linh Miêu 6 hồn hoàn: vòng 5–6 dùng được, Chân Thân cần vòng 7. Hỏa Long (chưa có dữ liệu): vòng 5+ chỉ tăng chỉ số.
    {
      ok(await lineupK("u_minh_linh_mieu"),"K: U Minh Linh Miêu ra trận (6 hồn hoàn)");
      await loadout("u_minh_linh_mieu",[4,5,0,1]); const id="u_minh_linh_mieu", s6=ringSkill(id,5);
      ok(same(vK(id).skills,[4,5,0,1]),"U Minh Linh Miêu mang vòng 5, 6, 1, 2");
      ok(/cần hồn hoàn thứ 7/.test(await chanThan())&&kp.ava===0,"6 hồn hoàn: chưa biến Chân Thân");
      await test(K,"ready"); const weak=await spawnNear(K,4,...kat(100),20); await test(K,"bhp",{pct:20}); const full=await spawnNear(K,4,...kat(30),20); await hush();
      await castK(1,600); ok(dmgsOn(K,weak).length>=1&&!dmgsOn(K,full).length,`vòng 6 ${s6.name}: khóa hồn thú yếu máu ở xa (${dmgsOn(K,weak).length} nhát), bỏ qua con gần đủ máu`);
      ok(await lineupK("hoa_long"),"K: Hỏa Long ra trận (10 hồn hoàn, chưa có dữ liệu vòng 5–10)");
      ok(/chưa có Võ Hồn Chân Thân/.test(await chanThan()),"Hỏa Long: chưa có Chân Thân");
      const s0=await stats(), base=calcStats(vohonIndex("hoa_long"),100,Y10.map(tierOfYears),1,{},{},kres);
      ok(s0.maxHp===base.maxHp&&Math.abs(s0.atk-base.atk)<0.01&&same(vK("hoa_long").skills,[...DEFAULT_LOADOUT]),`Hỏa Long vòng 5–10 chỉ tăng chỉ số: sinh lực ${s0.maxHp}, công ${s0.atk.toFixed(1)}; ô mặc định vòng 1–4`);
      await test(K,"ready"); await faceK(); await spawnNear(K,4,...kat(30)); await castK(1);
      ok(K.dmgs.length>0&&K.fxs.some(f=>f.k==="soulring"&&f.i===1),`Hỏa Long ô I vẫn là ${skillsOf("hoa_long")[1].name}`);
    }
    // Cửu Bảo Lưu Ly Tháp: tuyệt kỹ thật Vô Địch Thần Quang (miễn sát thương cả đội), Chân Thân giảm tiêu hao.
    {
      const id="cuu_bao_luu_ly_thap", ult=ringSkill(id,9), def=chanThanOf(id);
      ok(await lineupK(id),"K: Cửu Bảo Lưu Ly Tháp ra trận");
      await loadout(id,[9,7,8,4]); await test(K,"ready"); await test(K,"hurt",{pct:50});
      const hp0=kp.hp; await castK(0,300);
      ok(K.fxs.some(f=>f.k==="ult")&&hasBuff(kp,"inv")&&hasBuff(kp,"atk")&&kp.hp>hp0,`tuyệt kỹ ${ult.name}: miễn sát thương, tăng công, hồi sinh lực ${hp0} -> ${kp.hp}`);
      await test(K,"rest",{s:ult.self.secs}); ok(!hasBuff(kp,"inv"),`hết ${ult.self.secs} giây: hết miễn sát thương`);
      // Phục Chế của Xúc Xích không sao chép tuyệt kỹ: hồn kỹ gần nhất trước đó là của Hỏa Long (không còn trong đội) nên không có gì để chép.
      await test(K,"grant",{vohon:"xuc_xich"}); await test(K,"set",{rowId:rowK("xuc_xich"),level:40,xp:0,rings:Y10.slice(0,4)});
      await sendTeam(K,[rowK(id),rowK("xuc_xich"),0,0]); await waitFor(()=>kp.swCd===0,3500);
      K.room.send("switch",{slot:1}); ok(await waitFor(()=>K.owned.active===rowK("xuc_xich"),1500),"đổi sang Xúc Xích");
      await test(K,"ready"); const pc=skillsOf("xuc_xich")[3], lp=K.logs.length; K.fxs=[]; K.room.send("skill",{i:3});
      ok(await waitFor(()=>K.logs.length>lp,1500)&&/chưa có hồn kỹ/.test(K.logs.at(-1)??"")&&!K.fxs.some(f=>f.k==="soulring")&&!hasBuff(kp,"inv"),
        `${pc.name} không sao chép ${ult.name}: ${K.logs.at(-1)}`);
      await waitFor(()=>kp.swCd===0,3500); K.room.send("switch",{slot:0}); ok(await waitFor(()=>K.owned.active===rowK(id),1500),"đổi về Cửu Bảo Lưu Ly Tháp");
      // Chân Thân giảm tiêu hao: còn ít hồn lực hơn giá gốc của vòng 8 (60) nhưng đủ giá đã giảm thì vẫn tung được.
      const cs=chanThanStats(def,Y10[6]), s8=ringSkill(id,7), cost=s8.cost*(1-Math.min(0.9,cs.mp)); await test(K,"ready"); await chanThan(); const st=await stats();
      const pct=Math.ceil((cost+8)/st.maxMp*100); await test(K,"ready",{mp:pct}); const mp0=kp.mp; await castK(1,250);
      ok(kp.ava>0&&mp0<s8.cost&&K.fxs.some(f=>f.k==="soulring"&&f.i===7)&&!/Không đủ/.test(K.logs.at(-1)??""),
        `${def.name}: còn ${mp0} hồn lực vẫn tung ${s8.name} (giá ${s8.cost} giảm ${Math.round(cs.mp*100)}% còn ${cost.toFixed(1)}), giảm sát thương ${Math.round(st.def*100)}%`);
      await test(K,"rest",{s:def.secs});
    }
    // Ô đã chọn lưu DB: thoát rồi vào lại.
    {
      const want=Object.fromEntries(K.owned.list.map(v=>[v.vohon,v.skills]));
      await K.room.leave(); await sleep(500);
      await enter(K); await waitFor(()=>K.owned);
      const got=Object.fromEntries(K.owned.list.map(v=>[v.vohon,v.skills]));
      ok(same(got,want)&&same(got.hao_thien_chuy,[9,5,4,0])&&same(got.lam_ngan_thao,[4,5,9,-1]),`thoát vào lại: ô mang theo giữ nguyên (${Object.entries(got).map(([k,v])=>`${k} ${v.join("/")}`).join("; ")})`);
      ok(meOf(K)?.ava===0,"vào lại: không còn Chân Thân");
      await K.room.leave();
    }
  }
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
    /** Sinh hồn thú loài `sp` `years` năm cách F (dx, dy) (hook spawn nhận species), sau khi dọn hồn thú quanh F.
     *  Nhận ra con mới theo id chưa có trước đó: hồn thú vừa sinh đã nhắm F và đi tới (hơn 6 pixel khi server bận) trước khi bị Trói. */
    async function spawnSp(sp,years,dx,dy=0){ await test(F,"clear"); const before=new Set(F.room.state.beasts.keys()), x=fm.x+dx, y=fm.y+dy; let id=null;
      await test(F,"spawn",{tier:tierOfYears(years),years,species:sp,dx,dy});
      await waitFor(()=>{ F.room.state.beasts.forEach((o,k)=>{ if(!before.has(k)&&Math.hypot(o.x-x,o.y-y)<30&&BEASTS[o.species]?.id===sp) id=k; }); return id; });
      if(!id) console.log(`  ⚠ spawnSp: không thấy ${sp} quanh ${x.toFixed(0)},${y.toFixed(0)}`);
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
    // Lịch thật (20:00 / 22:00 giờ Việt Nam) chen vào các kiểm tra dùng hook `king`: chạy bot trong lúc báo trước hay lúc thú vương
    // thật đang ở bản đồ thì vài kiểm tra có thể trượt. Báo rõ để không nhầm với lỗi thật.
    { const now=Date.now(), nx=kingNext(now); if(kingActive(now)!==null||nx-now<(KING.warnSecs+180)*1000)
      console.log(`  ⚠ Đang gần / trong khung thú vương thật (${vnHHMM(kingActive(now)??nx)} giờ Việt Nam): kiểm tra BĐ5 có thể trượt vì lịch thật, chạy lại sau ${KING.lifeSecs/60} phút.`); }
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

    // Mở rương: hồn cốt (loài gốc, năm thú vương), mảnh của bản đồ, mảnh UR, 1 hồn hạch sao cao (5.1); cần KING_CHEST.slots ô trống.
    const pool=kingShardPool("tinh_dau_ngoai_vi"), chestIt=()=>K.bag.items.find(i=>i.code===chestCode("huyet_nguyet_lang_vuong"));
    async function open(){ const l=K.logs.length, n=K.bagMsgs; K.room.send("open",{id:chestIt().id}); await waitFor(()=>K.logs.length>l&&K.bagMsgs>n,1500); await sleep(100); return K.logs.at(-1)??""; }
    const s0=qtyOf(K,shardCode(pool[0].vohon)), ur0=KING_CHEST.urShards.reduce((a,v)=>a+qtyOf(K,shardCode(v)),0), b0=bonesOf(K).length;
    const kCores=()=>(K.bag?.items??[]).filter(i=>i.code===CORE_ITEM), c0=kCores().length, cHi=coreStarBand(Y)[1];
    await test(K,"chest",{bone:0,ur:0,i:0,n:4,s:1}); let lg=await open();
    const nb=bonesOf(K).find(i=>i.years===Y&&i.stats?.beast==="phong_lang"&&i.stats?.slot==="than");
    ok(chestK(K)===2&&bonesOf(K).length===b0+1&&nb&&qtyOf(K,shardCode(pool[0].vohon))===s0+4&&KING_CHEST.urShards.reduce((a,v)=>a+qtyOf(K,shardCode(v)),0)===ur0+1,`mở rương: ${lg}`);
    const nc=kCores().slice(c0);
    ok(nc.length===1&&nc[0].stars===cHi&&coreSetIndex(nc[0].stats?.set)>=0&&nc[0].stats?.subs?.length===CORE_SUBS[cHi-1],`rương có 1 hồn hạch sao cao nhất theo ${Y} năm: ${nc[0]?.stars}★ bộ ${nc[0]?.stats?.set}, ${nc[0]?.stats?.subs?.length} dòng phụ`);
    const s3=qtyOf(K,shardCode(pool[3].vohon)), b1=bonesOf(K).length;
    await test(K,"chest",{bone:100,ur:100,i:3}); lg=await open(); const got=qtyOf(K,shardCode(pool[3].vohon))-s3;
    ok(pool[3].vohon===KING_CHEST.fire&&got>=KING_CHEST.shards[0]&&got<=KING_CHEST.shards[1]&&bonesOf(K).length===b1&&chestK(K)===1,`mở rương lần 2 (không hồn cốt, không UR): ${lg}`);
    ok(pool.some(x=>x.vohon==="bich_lan_xa_hoang")&&pool.filter(x=>MAPS.tinh_dau_ngoai_vi.shards.includes(x.vohon)).length===3,`mảnh trong rương: của bản đồ, Tà Hỏa Phượng Hoàng, võ hồn bản đồ chưa mở (${pool.map(x=>x.vohon).join(", ")})`);
    // Túi còn dưới KING_CHEST.slots ô trống: không mở được, rương còn nguyên.
    const free=BAG_SLOTS-K.bag.items.filter(i=>i.vohon===null).length; await test(K,"give",{code:"hon_hoan",qty:free-KING_CHEST.slots+1,years:10}); await sleep(100);
    lg=await open(); ok(new RegExp(`Cần ${KING_CHEST.slots} ô trống`).test(lg)&&chestK(K)===1,`túi còn ${KING_CHEST.slots-1} ô trống: "${lg}"`);
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

    // Phòng trống bị hủy rồi mở lại trong cùng khung giờ (mục 6, suất thú vương theo bản đồ ở mức tiến trình): còn sống thì về với
    // thời gian còn lại, đã hạ thì không sinh lại. Phòng mới mở trong lúc chờ vẫn có đếm ngược.
    const reopen=async(withL)=>{ const old=K.room.roomId; await K.room.leave(); if(withL) await L.room.leave(); await sleep(600);
      await enter(K); await waitFor(()=>K.room.state.players&&meOf(K)&&K.owned); await sleep(300); return K.room.roomId!==old; };
    await test(K,"king",{kop:"spawn"}); await waitFor(()=>kingB(),1500); ki=await test(K,"king"); const kslot=ki.slot, klife=ki.life;
    const okReopen=await reopen(true); ki=await test(K,"king");
    ok(okReopen&&ki.slot===kslot&&ki.seat==="alive"&&kingB()&&ki.hp===kbase&&ki.phase===1&&ki.life<=klife&&ki.life>klife-15,
      `phòng hủy rồi mở lại (${ki.roomId}): thú vương còn sống trở lại cùng khung, đầy máu, còn ${Math.round(ki.life)}/${Math.round(klife)} giây`);
    await test(A,"king",{kop:"warn",s:30,mapId:"tinh_dau_ngoai_vi"}); await sleep(200);
    K.boss=[]; await reopen();
    ok(await waitFor(()=>K.boss.some(m=>m.k==="warn"&&m.here&&m.in<=30&&m.in>=20),1500),`phòng mở ra trong lúc chờ: có đếm ngược (${K.boss.find(m=>m.k==="warn")?.in} giây)`);
    await enter(L); await waitFor(()=>L.room.state.players&&meOf(L)); await waitFor(()=>kingB(),1500);
    // Bảng xếp hạng sát thương chỉ gửi cho người tham gia: L đứng ngoài hang, chưa đánh thì không nhận.
    await intoLair(K,40,0); await outLair(L); await test(K,"clear",{keep:1}); K.boss=[]; L.boss=[];
    await test(K,"kdmg",{v:1}); await test(K,"status",{s:"stun",secs:60});
    ok(await waitFor(()=>K.boss.some(m=>m.k==="rank"),2500)&&!L.boss.some(m=>m.k==="rank"),"bảng xếp hạng sát thương chỉ gửi cho người tham gia (K trong hang có, L ngoài hang không)");
    f=await finish(0); ki=await test(K,"king"); const dslot=ki.slot;
    ok(f.down&&ki.seat==="down","hạ thú vương của phòng mới mở");
    ok(await reopen(true)&&!(await waitFor(()=>kingB(),800))&&(ki=await test(K,"king")).slot===dslot&&ki.seat==="down"&&!ki.bid,
      `hạ rồi để phòng hủy, mở lại trong cùng khung giờ: không sinh thú vương mới (suất "${ki.seat}")`);
    await K.room.leave();
  }
  // ---------- 3.2: hạ hồn thú -> hồn hoàn mang đúng số năm -> nhặt vào túi; ưu tiên người hạ 15 giây; túi đầy; hấp thụ từ túi ----------
  {
    const zs=tiled.layers.flatMap(l=>l.objects??[]).filter(o=>(o.type??o.class)==="zone"), hz=zs.find(z=>/Bãi tập/.test(z.name))??zs[0];
    // Hai chỗ cạnh bên (x±8) cũng phải đứng được: mảnh võ hồn rơi khi túi đầy (3.4, x+8) và hồn cốt (4.1, x−8) nằm cạnh hồn hoàn,
    // không chồng lên nó (chồng thì nhấn E chọn hồn hoàn trước).
    let spot=null; for(let k=0;k<400&&!spot;k++){ const x=Math.round(hz.x+30+Math.random()*(hz.width-60)), y=Math.round(hz.y+40+Math.random()*(hz.height-80)); if(!blocked(x,y)&&!blocked(x+8,y)&&!blocked(x-8,y)) spot={x,y}; }
    await test(A,"goto",spot); ok(await waitFor(()=>Math.hypot(p.x-spot.x,p.y-spot.y)<1),`A tới ${hz.name} (${spot.x},${spot.y})`);
    await test(A,"clear");
    await test(A,"bone",{r:100}); // 4.1: hồn cốt rơi ngẫu nhiên (1% ở 1.234 năm) không xen vào các kiểm tra hồn hoàn, mảnh võ hồn
    const ringsOf=b=>(b.bag?.items??[]).filter(i=>i.code===RING_ITEM), bp=()=>meOf(B);
    /** Đặt hồn thú 1 máu `years` năm (loài `species`, mặc định loài đầu; `boss`: tinh anh BĐ4) ngay chỗ `b` (mặc định A) đứng (hook test),
     *  `b` đánh hạ; trả về hồn hoàn vừa rơi. */
    async function killFor(years,species,boss,b=A){
      const before=new Set(st.drops.keys()), fresh=()=>[...st.drops.keys()].find(k=>!before.has(k));
      await test(b,"beast",{dx:0,dy:0,years,species,boss});
      for(let i=0;i<15&&!fresh();i++){ b.room.send("attack"); await waitFor(fresh,450); }
      const id=fresh(); return id?{id,dr:st.drops.get(id)}:null;
    }
    const k1=await killFor(437);
    ok(k1&&k1.dr.years===437&&k1.dr.tier===tierOfYears(437)&&k1.dr.owner===A.room.sessionId,`hạ hồn thú 437 năm: hồn hoàn rơi ${k1?.dr.years} năm, màu ${TIERS[k1?.dr.tier??0].color}, thuộc A`);
    ok(A.logs.some(t=>/^Hạ .*437 năm.*Hồn hoàn 437 năm/.test(t)),"thông báo hạ hồn thú kèm số năm");
    if(k1){
      await test(B,"goto",{x:k1.dr.x,y:k1.dr.y}); await waitFor(()=>Math.hypot(bp().x-k1.dr.x,bp().y-k1.dr.y)<1);
      const b0=ringsOf(B).length; B.room.send("pickup");
      ok(await lastLog(B,/thuộc về người hạ/)&&st.drops.has(k1.id)&&ringsOf(B).length===b0,`B không nhặt được trong ${DROP_OWNER_SECS} giây đầu: ${B.logs.at(-1)}`);
      // Đồ rơi chồng nhau: hồn hoàn của B rơi đúng chỗ hồn hoàn của A (rơi trước) thì B nhấn E vẫn nhặt được của mình.
      const kb=await killFor(10,undefined,undefined,B); B.room.send("pickup");
      ok(kb&&await waitFor(()=>!st.drops.has(kb.id))&&st.drops.has(k1.id)&&ringsOf(B).some(i=>i.years===10),`đồ rơi chồng nhau: B nhặt hồn hoàn của mình nằm dưới hồn hoàn của A (${B.logs.at(-1)})`);
      for(const i of ringsOf(B).filter(i=>i.years===10)) B.room.send("discard",{id:i.id});
      await waitFor(()=>!ringsOf(B).some(i=>i.years===10));
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
    ok(p.maxHp===calcStats(p.vh,MAX_LEVEL,[...p.rings],1,{},{},A.res?.bonus).maxHp,`vòng 5–10 tăng chỉ số: sinh lực tối đa ${p.maxHp}`);
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
    // Hai hồn hoàn 437 năm vừa rơi còn nằm ở chỗ A đứng: cho hết hạn (hook drops) để phần dưới chỉ còn hồn hoàn và mảnh của lần hạ sau.
    await test(A,"drops",{s:3600}); await waitFor(()=>!st.drops.size);
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
      ok(vOf(act).stars===actStars+1&&await waitFor(()=>p.maxHp===calcStats(p.vh,p.level,[...p.rings],actStars+1,{},{},A.res?.bonus).maxHp)&&p.maxHp>hp0s,
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
    // ---------- 5.1: hồn hạch rơi theo bảng 5.3 (15% 1–2★ / 25% 2–4★ / 40% 3–5★ / 100% 5–6★), bộ theo bản đồ, chỉ số chính và phụ; nằm trong túi ----------
    {
      const coresOf=b=>(b.bag?.items??[]).filter(i=>i.code===CORE_ITEM), mapSets=MAPS[st.mapId].cores;
      ok(same([10,999,1000,9999,10000,MAX_YEARS-1,MAX_YEARS].map(coreChance),[0.15,0.15,0.25,0.25,0.4,0.4,1])
        &&same([10,999,1000,9999,10000,MAX_YEARS-1,MAX_YEARS].map(coreStarBand),[[1,2],[1,2],[2,4],[2,4],[3,5],[3,5],[5,6]]),
        "bảng rơi hồn hạch theo niên hạn: 15% 1–2★ / 25% 2–4★ / 40% 3–5★ / 100% 5–6★");
      ok(itemDef(CORE_ITEM)?.kind==="hon_hach"&&itemDef(CORE_ITEM).stack===1&&CORE_SETS.length===9&&same(CORE_SUBS,[0,1,1,2,3,4])&&CORE_SUBS[MAX_CORE_STARS-1]===4,
        "9 bộ hồn hạch; mỗi món một ô; dòng phụ theo sao 0 / 1 / 1 / 2 / 3 / 4 (1★ 0 dòng … 6★ 4 dòng)");
      ok(same(mapSets,["lam_ngan","tien_co"])&&same(MAPS.tinh_dau_ngoai_vi.cores,["linh_mieu","hao_thien","xa_hoang"])&&same(MAPS.tinh_dau_noi_dia.cores,["ba_vuong_long","that_sat","luu_ly"]),
        `bộ đặc trưng theo bản đồ (bảng 5.3): ${MAPS[st.mapId].name} ${mapSets.map(s=>CORE_SETS[coreSetIndex(s)].name).join(", ")}`);
      ok(CORE_STAT_IDS.every(k=>CORE_STAR_K.every((_,i)=>i===0||coreMainValue(k,i+1)>=coreMainValue(k,i)))&&coreMainValue("hp",6)>coreMainValue("hp",1),
        `chỉ số chính tăng theo sao (Sinh lực 1★…6★: ${[1,2,3,4,5,6].map(s=>coreMainValue("hp",s)).join(" / ")})`);
      ok(coreName("hao_thien",4)==="Hồn hạch Hạo Thiên 4★"&&coreStatText("atk_pct",12)==="Công +12%"&&coreStatText("crit",2.4)==="Tỉ lệ chí mạng +2,4%"&&coreStatText("hp",300)==="Sinh lực +300",
        `tên và dòng chỉ số: ${coreName("hao_thien",4)}, ${coreStatText("crit",2.4)}`);
      // Tung nhiều lần (hàm thuần, ngẫu nhiên của bot): sao luôn trong khoảng, đủ mọi sao của khoảng, dòng phụ đúng số, khác nhau, khác chỉ số chính, giá trị trong khoảng.
      const N=5000, YS=[10,437,1500,12000,MAX_YEARS]; let bad=[], own=0; const seen=new Set(), mains=new Set();
      for(let i=0;i<N;i++){
        const y=YS[i%YS.length], [lo,hi]=coreStarBand(y), c=rollCore(y,mapSets,Math.random), ks=c.data.subs.map(s=>s[0]);
        const tol=k=>CORE_STATS[k].pct?0.051:0.51, vOk=c.data.subs.every(([k,v])=>v>=Math.max(CORE_STATS[k].pct?0.1:1,coreSubMax(k,c.stars)*CORE_SUB_ROLL[0]-tol(k))&&v<=coreSubMax(k,c.stars)*CORE_SUB_ROLL[1]+tol(k));
        if(c.stars<lo||c.stars>hi||ks.length!==CORE_SUBS[c.stars-1]||new Set(ks).size!==ks.length||ks.includes(c.data.main)||coreSetIndex(c.data.set)<0||!vOk) bad.push(JSON.stringify([y,c]));
        seen.add(`${y}:${c.stars}`); mains.add(c.data.main); if(mapSets.includes(c.data.set)) own++;
      }
      const allStars=YS.every(y=>{ const [lo,hi]=coreStarBand(y); for(let s=lo;s<=hi;s++) if(!seen.has(`${y}:${s}`)) return false; return true; });
      ok(!bad.length&&allStars&&mains.size===CORE_STAT_IDS.length,`tung ${N} hồn hạch: sao đúng khoảng theo niên hạn, đủ mọi sao, số dòng phụ đúng theo sao, không trùng${bad.length?` (sai: ${bad[0]})`:""}`);
      const share=own/N, want=CORE_MAP_SET+(1-CORE_MAP_SET)*mapSets.length/CORE_SETS.length;
      ok(Math.abs(share-want)<0.04,`bộ đặc trưng của bản đồ chiếm ${(share*100).toFixed(1)}% (kỳ vọng ${(want*100).toFixed(1)}%)`);
      ok(rollCore(1500,mapSets,Math.random,{high:true}).stars===4&&rollCore(MAX_YEARS,[],Math.random,{high:true}).stars===6,"tùy chọn sao cao (rương thú vương BĐ5): sao cao nhất của khoảng");

      await test(A,"goto",spot); await test(A,"clear"); await test(A,"drops",{s:3600}); await sleep(150); // dọn đồ rơi cũ: E chỉ nhặt đồ mới
      /** Hạ hồn thú `years` năm (loài `species`, tinh anh `boss`); trả về hồn hạch vừa rơi xuống đất, hoặc undefined. */
      async function killCore(years,species,boss){
        const before=new Set(st.drops.keys()); await killFor(years,species,boss); await sleep(150);
        const e=[...st.drops.entries()].find(([k,d])=>!before.has(k)&&d.item===CORE_ITEM); return e&&{id:e[0],dr:e[1]};
      }
      /** `b` đứng lên hồn hạch rồi nhấn E (có thể chồng lên hồn hoàn: nhấn thêm); true khi hồn hạch đã rời mặt đất. */
      async function pickCore(kc,b=A){
        const q=meOf(b); await test(b,"goto",{x:kc.dr.x,y:kc.dr.y}); await waitFor(()=>Math.hypot(q.x-kc.dr.x,q.y-kc.dr.y)<1);
        for(let k=0;k<3&&st.drops.has(kc.id);k++){ const l=b.logs.length; b.room.send("pickup"); await waitFor(()=>b.logs.length>l,1500); await waitFor(()=>!st.drops.has(kc.id),300); }
        return !st.drops.has(kc.id);
      }
      const checkIt=(it,stars)=>it&&it.kind==="hon_hach"&&it.qty===1&&it.stars===stars&&it.years===null&&it.enhance===0&&it.vohon===null
        &&coreSetIndex(it.stats?.set)>=0&&CORE_STAT_IDS.includes(it.stats?.main)&&it.stats?.subs?.length===CORE_SUBS[stars-1];
      await test(A,"core",{r:99});
      ok(!await killCore(437),"số ngẫu nhiên 0,99: hạ hồn thú 437 năm (15%) không rơi hồn hạch");
      await test(A,"core",{r:14,stars:6}); // sao 6 nằm ngoài khoảng 1–2★ của 437 năm: bỏ qua, tung trong khoảng
      const kc=await killCore(437), c0=coresOf(A).length;
      ok(kc&&kc.dr.years===437&&kc.dr.stars>=1&&kc.dr.stars<=2&&kc.dr.cset<CORE_SETS.length&&kc.dr.owner===A.room.sessionId,
        `số ngẫu nhiên 0,14: hạ hồn thú 437 năm rơi ${kc?coreName(CORE_SETS[kc.dr.cset].id,kc.dr.stars):"?"} xuống đất (1–2★, sao cố định ngoài khoảng bị bỏ qua), thuộc A`);
      ok(kc&&A.logs.some(t=>t.startsWith(`${coreName(CORE_SETS[kc.dr.cset].id,kc.dr.stars)} rơi xuống đất`)),"thông báo hồn hạch rơi kèm bộ và sao");
      if(kc){
        await test(B,"goto",{x:kc.dr.x,y:kc.dr.y}); await waitFor(()=>Math.hypot(bp().x-kc.dr.x,bp().y-kc.dr.y)<1);
        const bb=coresOf(B).length, bl=B.logs.length; B.room.send("pickup"); await waitFor(()=>B.logs.length>bl,1500);
        ok(/^Hồn hạch .* thuộc về người hạ/.test(B.logs.at(-1)??"")&&st.drops.has(kc.id)&&coresOf(B).length===bb,`B không nhặt được hồn hạch của A trong ${DROP_OWNER_SECS} giây đầu: ${B.logs.at(-1)}`);
        ok(await pickCore(kc)&&await waitFor(()=>coresOf(A).length===c0+1),"A nhặt hồn hạch vào túi");
        const it=coresOf(A).at(-1);
        ok(checkIt(it,kc.dr.stars)&&it.stats.set===CORE_SETS[kc.dr.cset].id,
          `túi A: ${it&&coreName(it.stats?.set,it.stars)}, chính ${it&&coreStatText(it.stats.main,coreMainValue(it.stats.main,it.stars))}, ${it?.stats?.subs?.length} dòng phụ, +${it?.enhance}, chưa gắn`);
        ok(A.logs.some(t=>t.startsWith(`Nhặt ${coreName(CORE_SETS[kc.dr.cset].id,kc.dr.stars)} vào túi đồ`)),"thông báo nhặt hồn hạch");
        await useItem(A,it.id); ok(/không dùng trực tiếp/.test(A.logs.at(-1)??"")&&coresOf(A).some(i=>i.id===it.id),"hồn hạch không dùng như đan được");
        let l=A.logs.length; A.room.send("absorb",{itemId:it.id}); await waitFor(()=>A.logs.length>l);
        ok(/Hãy chọn một hồn hoàn/.test(A.logs.at(-1)??"")&&coresOf(A).some(i=>i.id===it.id),"hồn hạch không hấp thụ như hồn hoàn được");
        l=A.logs.length; A.room.send("equip",{itemId:it.id,vohonId:A.owned.active}); await waitFor(()=>A.logs.length>l);
        ok(/Không có hồn cốt/.test(A.logs.at(-1)??"")&&coresOf(A).find(i=>i.id===it.id)?.vohon===null,"hồn hạch không gắn vào ô hồn cốt (tin equip của hồn cốt; gắn hồn hạch ở 5.2)");
      }
      // Sao theo niên hạn (số ngẫu nhiên rơi 0, sao ngẫu nhiên): mỗi khoảng hạ 3 con, nhặt rồi kiểm số dòng phụ.
      await test(A,"core",{r:0});
      for(const [y,label] of [[1500,"2–4★"],[12000,"3–5★"],[MAX_YEARS,"5–6★"]]){
        const [lo,hi]=coreStarBand(y), got=[];
        for(let k=0;k<3;k++){
          await test(A,"goto",spot); await test(A,"drops",{s:3600}); await sleep(120);
          const n=coresOf(A).length, kk=await killCore(y);
          if(kk&&await pickCore(kk)&&await waitFor(()=>coresOf(A).length===n+1)){ const it=coresOf(A).at(-1); got.push(checkIt(it,kk.dr.stars)&&it.stars>=lo&&it.stars<=hi?it.stars:`sai ${JSON.stringify(it)}`); }
          else got.push("không rơi");
        }
        ok(got.every(s=>Number.isInteger(s)),`hạ hồn thú ${y.toLocaleString("vi-VN")} năm: hồn hạch ${got.map(s=>Number.isInteger(s)?`${s}★`:s).join(", ")} (khoảng ${label}), dòng phụ đúng số theo sao`);
      }
      // Hook give: đủ 6 mức sao, bộ cố định; số dòng phụ đúng CORE_SUBS.
      const g0=new Set(coresOf(A).map(i=>i.id));
      for(let s=1;s<=MAX_CORE_STARS;s++) await test(A,"give",{code:CORE_ITEM,stars:s,set:"hao_thien"});
      const gv=coresOf(A).filter(i=>!g0.has(i.id));
      ok(gv.length===MAX_CORE_STARS&&gv.every((it,i)=>checkIt(it,i+1)&&it.stats.set==="hao_thien"),`1★…6★: dòng phụ ${gv.map(i=>i.stats?.subs?.length).join(" / ")}`);
      for(const i of gv) A.room.send("discard",{id:i.id});
      ok(await waitFor(()=>!coresOf(A).some(i=>g0.has(i.id)===false),3000),"bỏ hồn hạch trong túi được");
      // Túi đầy: báo, hồn hạch ở lại dưới đất; bỏ bớt một ô rồi nhặt được.
      {
        await test(A,"goto",spot); await test(A,"drops",{s:3600}); await sleep(120);
        const freeA=BAG_SLOTS-A.bag.items.filter(i=>i.vohon===null).length;
        await test(A,"give",{code:RING_ITEM,qty:freeA,years:50});
        await test(A,"core",{r:0,set:coreSetIndex("tien_co")});
        const kf=await killCore(12000);
        ok(kf&&CORE_SETS[kf.dr.cset].id==="tien_co","hồn hạch Tiên Cơ (bộ cố định bằng hook) rơi khi túi A đầy");
        if(kf){
          await pickCore(kf);
          ok(st.drops.has(kf.id)&&A.logs.some(t=>t.startsWith(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt vật phẩm rồi mới nhặt được ${coreName("tien_co",kf.dr.stars)}`)),
            `túi đầy: báo, hồn hạch ở lại dưới đất [${A.logs.slice(-2).join(" | ")}]`);
          const junk=ringsOf(A).find(i=>i.years===50); A.room.send("discard",{id:junk.id}); await waitFor(()=>!A.bag.items.some(i=>i.id===junk.id));
          ok(await pickCore(kf)&&coresOf(A).some(i=>i.stats?.set==="tien_co"&&i.stars===kf.dr.stars),"bỏ bớt rồi nhặt được hồn hạch Tiên Cơ");
        }
        for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
        ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
      }
      // Tinh anh (mục 5.4): chắc chắn rơi 1 hồn hạch, sao theo niên hạn, quyền ưu tiên như hồn hoàn.
      {
        const HN="huyet_nhan_phong_lang", hb=BOSSES[bossIndex(HN)];
        await test(A,"goto",spot); await test(A,"drops",{s:3600}); await sleep(120);
        await test(A,"core",{r:99});
        ok(!await killCore(1500,hb.species),"số ngẫu nhiên 0,99: hồn thú thường 1.500 năm (25%) không rơi hồn hạch");
        A.elite=[]; const ke=await killCore(1500,undefined,HN);
        ok(ke&&ke.dr.stars>=2&&ke.dr.stars<=4&&ke.dr.owner===A.room.sessionId&&await waitFor(()=>A.elite.some(m=>m.k==="down"),1000),
          `cùng số ngẫu nhiên: hạ ${beastName(1,bossIndex(HN))} 1.500 năm chắc chắn rơi ${ke?coreName(CORE_SETS[ke.dr.cset].id,ke.dr.stars):"không có hồn hạch"} (2–4★), thuộc A`);
        await test(A,"core",{r:-1}); // số ngẫu nhiên thật: tinh anh vẫn luôn rơi
        let all=0; for(let k=0;k<3;k++){ await test(A,"drops",{s:3600}); await sleep(120); if(await killCore(437,undefined,HN)) all++; }
        ok(all===3,`số ngẫu nhiên thật: hạ tinh anh 3 lần, rơi hồn hạch ${all}/3 lần`);
        await test(A,"drops",{s:3600});
      }
      // Giữ lại hồn hạch trong túi để kiểm khi vào lại (bagKey so cả sao và chỉ số).
      A.coreKeep=coresOf(A).map(i=>[i.id,i.stars,sj(i.stats),i.vohon]);
      ok(A.coreKeep.length>=3,`túi A còn ${A.coreKeep.length} hồn hạch (kiểm khi vào lại)`);
      await test(A,"core",{r:100}); // tắt lại cho các phần sau
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
    // ---------- 4.3: kỹ năng hồn cốt chủ động (đầu, hai tay: Z/X/C) và bị động (thân, hai chân) của võ hồn ra trận ----------
    {
      async function boneOp(type,msg){ const n=A.bagMsgs??0, l=A.logs.length; A.room.send(type,msg); await waitFor(()=>(A.bagMsgs??0)>n&&A.logs.length>l,2000); await sleep(80); return A.logs.at(-1)??""; }
      /** Gửi boneskill {i}, chờ `wait` ms; trả các dòng log mới (lý do từ chối nếu có). */
      async function bsk(i,wait=300){ A.dmgs=[]; A.fxs=[]; const l=A.logs.length; A.room.send("boneskill",{i}); await sleep(wait); return A.logs.slice(l).join(" | "); }
      const SP=BEASTS.map(b=>b.id), MD="man_da_la_xa", TG="thiet_giap_te_nguu";
      ok(SP.every(s=>{ const k=BONE_SKILLS[s]; return k&&k.active.name&&k.active.cost>0&&k.active.cd>0&&k.passive.name&&Object.keys({...k.passive.buff,...k.passive.resist}).length>0; }),
        `mọi loài trong BEASTS (${SP.length}) có 1 kỹ năng chủ động và 1 kỹ năng bị động`);
      ok(same(BONE_ACTIVE_SLOTS,["dau","tay_trai","tay_phai"])&&BONE_SLOTS.every(s=>boneSkillOf(AK,s.id)?.active===s.active),"đầu, hai tay: chủ động; thân, hai chân: bị động");
      ok(boneSkillOf(MD,"tay_phai").sk.status?.some(a=>a.s==="poison")&&/Vỗ Đất/.test(boneSkillOf(AK,"tay_phai").sk.name),
        `theo loài: ${boneSkillOf(MD,"tay_phai").sk.name} (Mạn Đà La Xà), ${boneSkillOf(AK,"tay_phai").sk.name} (Ám Kim Khủng Trảo Hùng)`);
      const pv=y=>bonePassive([{beast:TG,slot:"than",years:y}]).buff.def;
      ok(pv(1000)<pv(32000)&&pv(32000)<pv(MAX_YEARS)&&Math.abs(pv(32000)-BONE_SKILLS[TG].passive.buff.def*buffPower(32000))<1e-4&&bonePassive([{beast:AK,slot:"tay_phai",years:32000}]).buff.def===undefined,
        `bị động mạnh theo số năm (${BONE_SKILLS[TG].passive.name}: ${[1000,32000,MAX_YEARS].map(pv).join(" / ")}), hồn cốt chủ động không cộng bị động`);
      ok(bonePassive(["than","chan_trai","chan_phai"].map(slot=>({beast:TG,slot,years:MAX_YEARS}))).buff.def===BONE_PASSIVE_CAP.def,`3 bị động cùng loại cộng dồn tối đa ${BONE_PASSIVE_CAP.def}`);
      const act=A.owned.active, tpw=bonesOf(A).find(i=>i.vohon===act&&i.stats?.slot==="tay_phai");
      ok(tpw?.stats?.beast===AK,"võ hồn ra trận đang gắn hồn cốt Tay phải Ám Kim Khủng Trảo Hùng (từ 4.2)");
      // Các phần trước để A ở cấp cao, nhiều hồn hoàn niên hạn cao: một nút đã hạ luôn hồn thú 100.000 năm (không còn để đo Choáng /
      // Trúng độc). Tạm về cấp 15, 1 hồn hoàn 423 năm; cuối phần trả lại như cũ.
      const v0=A.owned.list.find(v=>v.rowId===act), keep0={rowId:act,level:v0.level,xp:v0.xp,rings:[...v0.rings]};
      await test(A,"set",{rowId:act,level:15,rings:[423]});
      await test(A,"goto",spot); await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      await test(A,"give",{code:BONE_ITEM,years:5000,beast:MD,slot:"tay_trai"}); await test(A,"give",{code:BONE_ITEM,years:12000,beast:TG,slot:"than"});
      const md=bonesOf(A).find(i=>i.vohon===null&&i.stats?.beast===MD&&i.years===5000), tg=bonesOf(A).find(i=>i.vohon===null&&i.stats?.beast===TG&&i.years===12000);
      await boneOp("equip",{itemId:md.id,vohonId:act}); await boneOp("equip",{itemId:tg.id,vohonId:act});
      // Bị động: Tê Giáp (giảm sát thương nhận) áp ngay khi gắn trên võ hồn ra trận; hook hurt mất 30% sinh lực x (1 − giảm).
      const want=bonePassive([{beast:TG,slot:"than",years:12000}]), s1=await test(A,"stats");
      ok(A.bag.items.find(i=>i.id===tg.id)?.vohon===act&&same(s1.live?.passive,want),`gắn Thân ${BONE_SKILLS[TG].passive.name}: bị động ${JSON.stringify(s1.live?.passive)}`);
      // Hồi đầy trước (hook set không đổi gì ngoài tính lại chỉ số): đầy sinh lực thì không hồi thêm giữa lúc đọc và lúc hook chạy.
      async function hurtLoss(){ await test(A,"set",{rowId:act}); await waitFor(()=>p.hp===p.maxHp,1000); const h=p.hp; await test(A,"hurt",{pct:30}); await waitFor(()=>p.hp<h,1000); return {h,loss:h-p.hp}; }
      let hl=await hurtLoss(), exp=Math.floor(hl.h*0.3)*(1-want.buff.def);
      ok(Math.abs(hl.loss-exp)<=3,`bị động áp đúng: mất ${hl.loss} sinh lực (30% của ${hl.h} sau khi giảm ${(want.buff.def*100).toFixed(1)}% ≈ ${exp.toFixed(0)})`);
      // Chủ động: Ám Kim Vỗ Đất (C, tay phải) trúng hồn thú cạnh bên, choáng, tốn hồn lực, hồi chiêu riêng.
      await test(A,"clear"); await test(A,"beast",{dx:16,dy:0,years:MAX_YEARS}); await test(A,"bhp",{pct:100}); await test(A,"ready");
      const bid=[...st.beasts.entries()].find(([,b])=>Math.hypot(b.x-p.x-16,b.y-p.y)<2)?.[0], skC=boneSkillOf(AK,"tay_phai").sk, mp0=p.mp;
      // Choáng trên hồn thú 100.000 năm chỉ còn 0,4 giây (CC_TIER_MULT): theo dõi suốt lúc chờ thay vì đọc một lần.
      let stunned=false; const watch=setInterval(()=>{ const b=st.beasts.get(bid); if(b&&(b.st&statusBit("stun"))) stunned=true; },20);
      let r=await bsk(2); clearInterval(watch);
      const fxB=A.fxs.find(f=>f.k==="bone"), bb=st.beasts.get(bid);
      ok(fxB&&fxB.i===2&&fxB.sp===beastIndex(AK)&&fxB.tier===tierOfYears(32000),`fx bone: nút ${fxB?.i}, loài ${BEASTS[fxB?.sp]?.name}, bậc ${fxB?.tier}`);
      ok(bid&&A.dmgs.some(m=>m.bid===bid)&&bb&&stunned,`${skC.name} trúng hồn thú cạnh bên và gây Choáng (${r||"không log"})`);
      ok(mp0-p.mp>=skC.cost-3&&mp0-p.mp<=skC.cost,`tốn hồn lực: ${mp0} -> ${p.mp} (${skC.cost})`);
      ok(p.bcds[2]>skC.cd-1&&p.bcds[2]<=skC.cd&&p.bcds[0]===0&&p.bcds[1]===0,`hồi chiêu riêng nút C: ${p.bcds[2].toFixed(1)} / ${skC.cd} giây, Z / X không đổi`);
      const mp1=p.mp; r=await bsk(2);
      ok(!A.fxs.some(f=>f.k==="bone")&&p.mp>=mp1,"đang hồi chiêu: bấm lại không tung, không tốn hồn lực");
      // X (tay trái): Mạn Đà La Phun Độc gây Trúng độc 2 tầng, hồi chiêu riêng.
      r=await bsk(1); await waitFor(()=>(st.beasts.get(bid)?.poison??0)>=2,600);
      ok(A.fxs.some(f=>f.k==="bone"&&f.i===1)&&(st.beasts.get(bid)?.poison??0)>=2&&p.bcds[1]>0,`${boneSkillOf(MD,"tay_trai").sk.name}: Trúng độc ${st.beasts.get(bid)?.poison} tầng, hồi chiêu ${p.bcds[1].toFixed(1)} giây`);
      r=await bsk(0); ok(/Ô Đầu .* chưa gắn hồn cốt/.test(r)&&!A.fxs.some(f=>f.k==="bone"),`Z (Đầu trống): ${r}`);
      // Câm lặng chặn kỹ năng hồn cốt (vẫn đánh thường); vùng an toàn chặn.
      await test(A,"ready"); await test(A,"pst",{s:"silence",secs:2}); const mp2=p.mp;
      r=await bsk(2); ok(/Câm lặng/.test(r)&&!A.fxs.some(f=>f.k==="bone")&&p.bcds[2]===0&&p.mp>=mp2,`đang Câm lặng: bị chặn (${r})`);
      await test(A,"clear"); const safeAt={x:Math.round(safe.x+safe.width/2),y:27.5*16};
      await test(A,"goto",safeAt); await waitFor(()=>inSafe(),1000); await test(A,"ready"); const mp3=p.mp;
      r=await bsk(2); ok(inSafe()&&/Vùng an toàn/.test(r)&&!A.fxs.some(f=>f.k==="bone")&&p.bcds[2]===0&&p.mp>=mp3,`vùng an toàn: bị chặn (${r})`);
      await test(A,"goto",spot); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      // Tháo hồn cốt Thân: mất bị động ngay.
      await boneOp("unequip",{itemId:tg.id});
      const s2=await test(A,"stats"); hl=await hurtLoss(); exp=Math.floor(hl.h*0.3);
      ok(same(s2.live?.passive,{buff:{},resist:{}})&&Math.abs(hl.loss-exp)<=3,`tháo Thân: hết bị động, mất ${hl.loss} sinh lực (≈ ${exp})`);
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1}); await boneOp("unequip",{itemId:md.id});
      for(const it of [md,tg]) A.room.send("discard",{id:it.id});
      ok(await waitFor(()=>!A.bag.items.some(i=>i.id===md.id||i.id===tg.id),2000)&&bonesOf(A).find(i=>i.id===tpw.id)?.vohon===act,"dọn hồn cốt thử 4.3, Tay phải 32.000 năm vẫn gắn");
      await test(A,"clear"); await test(A,"set",keep0); await test(A,"ready");
    }
    // ---------- 4.4: cường hóa hồn cốt bằng hồn cốt dư (điểm theo niên hạn, cùng vị trí +50%, +0..+20, mốc nâng kỹ năng) ----------
    {
      async function boneOp(type,msg){ const n=A.bagMsgs??0, l=A.logs.length; A.room.send(type,msg); await waitFor(()=>(A.bagMsgs??0)>n&&A.logs.length>l,2000); await sleep(80); return A.logs.at(-1)??""; }
      /** Gửi enhance; server luôn gửi lại túi và một dòng log (kết quả hoặc lý do từ chối). Trả dòng log đó. */
      const enh=(targetId,materialIds)=>{ A.enh=null; return boneOp("enhance",{targetId,materialIds}); };
      /** Hook give một hồn cốt; trả về món vừa vào túi. */
      async function give(years,slot,beast=AK){ const had=new Set(bonesOf(A).map(i=>i.id)); await test(A,"give",{code:BONE_ITEM,years,beast,slot}); return bonesOf(A).find(i=>!had.has(i.id)); }
      const itemOf=id=>A.bag.items.find(i=>i.id===id), MD="man_da_la_xa", TG="thiet_giap_te_nguu";
      const fx=(years,slot,tgt,xp)=>boneFeedXp({slot,years,xp},tgt), atkAt=n=>boneStats("tay_phai",32000,n).atk;
      // Công thức (shared/data.ts, chờ chốt).
      ok(fx(1000,"tay_phai","tay_phai")===Math.round(1000*BONE_FEED_PER_YEAR*BONE_FEED_SAME_SLOT)&&fx(1000,"dau","tay_phai")===Math.round(1000*BONE_FEED_PER_YEAR)&&fx(32000,"dau","tay_phai")===32*fx(1000,"dau","tay_phai"),
        `điểm nguyên liệu tỉ lệ niên hạn (1.000 năm ${fx(1000,"dau","tay_phai")}, 32.000 năm ${fx(32000,"dau","tay_phai")}), cùng vị trí ×${BONE_FEED_SAME_SLOT} (${fx(1000,"tay_phai","tay_phai")})`);
      ok(fx(1000,"dau","tay_phai",100)===fx(1000,"dau","tay_phai")+Math.floor(100*BONE_FEED_CARRY),`nguyên liệu đã cường hóa trả lại ${BONE_FEED_CARRY*100}% điểm đã nạp`);
      ok(Array.from({length:BONE_MAX_ENHANCE+1},(_,n)=>boneEnhanceLevel(boneEnhanceNeed(n))===n&&(n===0||boneEnhanceLevel(boneEnhanceNeed(n)-1)===n-1)).every(Boolean)&&boneEnhanceLevel(1e9)===BONE_MAX_ENHANCE,
        `bảng ngưỡng +1..+${BONE_MAX_ENHANCE} (+5 / +10 / +15 / +20 cần ${[5,10,15,20].map(boneEnhanceNeed).join(" / ")} điểm)`);
      ok(Array.from({length:BONE_MAX_ENHANCE},(_,n)=>atkAt(n+1)>atkAt(n)&&boneStats("tay_trai",1000,n+1).atk>boneStats("tay_trai",1000,n).atk).every(Boolean),
        `mỗi cấp tăng chỉ số chính (Tay phải 32.000 năm: ${atkAt(0)} -> +5 ${atkAt(5)} -> +20 ${atkAt(20)} công)`);
      ok([0,4,5,9,10,15,20].map(n=>boneSkillMult(n).toFixed(2)).join(" ")==="1.00 1.00 1.10 1.10 1.20 1.30 1.40","mốc +5 / +10 / +15 / +20: kỹ năng ×1,1 / ×1,2 / ×1,3 / ×1,4");
      ok(boneName(AK,"tay_phai",32000,5)==="+5 Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm"&&boneName(AK,"tay_phai",32000)===akName,`tên có +N: ${boneName(AK,"tay_phai",32000,5)}`);
      const pv=boneEnhancePreview({slot:"than",xp:boneEnhanceNeed(19)},[{slot:"than",years:MAX_YEARS}]);
      ok(pv.level===BONE_MAX_ENHANCE&&pv.xp===boneEnhanceNeed(BONE_MAX_ENHANCE)&&pv.waste===boneEnhanceNeed(19)+pv.gain-pv.xp&&pv.waste>0,`xem trước: kẹp ở +${BONE_MAX_ENHANCE}, dư ${pv.waste} điểm`);
      // Hồn cốt đích: Tay phải 32.000 năm đang gắn trên võ hồn ra trận (từ 4.2).
      const act=A.owned.active, tpw=bonesOf(A).find(i=>i.vohon===act&&i.stats?.slot==="tay_phai"&&i.years===32000);
      ok(tpw&&tpw.enhance===0,"đích: hồn cốt Tay phải 32.000 năm đang gắn, +0");
      await test(A,"goto",spot); await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const m1=await give(1000,"tay_phai"), m2=await give(1000,"dau",MD), s0=await test(A,"stats");
      let t=await enh(tpw.id,[m1.id,m2.id]), tw=itemOf(tpw.id);
      const g1=fx(1000,"tay_phai","tay_phai")+fx(1000,"dau","tay_phai"), s1=await test(A,"stats");
      ok(!itemOf(m1.id)&&!itemOf(m2.id),"nguyên liệu bị xóa khỏi túi");
      ok(tw.stats.xp===g1&&tw.enhance===1&&tw.vohon===act&&tw.stats.beast===AK&&tw.stats.slot==="tay_phai"&&A.enh?.from===0&&A.enh?.to===1&&A.enh?.gain===g1,
        `cùng vị trí ${fx(1000,"tay_phai","tay_phai")} + khác vị trí ${fx(1000,"dau","tay_phai")} = ${g1} điểm: +${tw.enhance}, vẫn gắn (${t})`);
      ok(s1.bones.atk===atkAt(1)&&Math.abs(s1.live.atk-s0.live.atk-(atkAt(1)-atkAt(0)))<1e-6,`đang gắn: công ${s0.live.atk.toFixed(1)} -> ${s1.live.atk.toFixed(1)} ngay (hồn cốt +${atkAt(0)} -> +${atkAt(1)})`);
      // Từ chối: chính nó, hồn cốt đang gắn, không phải hồn cốt, trùng, rỗng, đích lạ, đang giao chiến. Không mất gì.
      const hd=await give(1000,"dau"); await boneOp("equip",{itemId:hd.id,vohonId:act});
      const m3=await give(5000,"tay_phai"), xpNow=()=>itemOf(tpw.id)?.stats?.xp, kept=()=>xpNow()===g1&&!!itemOf(m3.id);
      t=await enh(tpw.id,[tpw.id]); ok(/chính hồn cốt/.test(t)&&kept(),`dùng chính nó làm nguyên liệu bị từ chối: ${t}`);
      t=await enh(tpw.id,[hd.id]); ok(/đang gắn trên võ hồn/.test(t)&&itemOf(hd.id)?.vohon===act&&kept(),`hồn cốt đang gắn không làm nguyên liệu được: ${t}`);
      t=await enh(tpw.id,[m3.id,hd.id]); ok(/đang gắn trên võ hồn/.test(t)&&kept(),"một nguyên liệu sai thì cả lần bị từ chối, nguyên liệu đúng còn nguyên");
      const dan=A.bag.items.find(i=>i.code!==BONE_ITEM&&i.vohon===null);
      if(dan){ t=await enh(tpw.id,[dan.id]); ok(/phải là hồn cốt/.test(t)&&itemOf(dan.id)&&kept(),`vật phẩm không phải hồn cốt: ${t}`);
        t=await enh(dan.id,[m3.id]); ok(/Không có hồn cốt này/.test(t)&&kept(),"đích không phải hồn cốt bị từ chối"); }
      t=await enh(tpw.id,[m3.id,m3.id]); ok(/trùng/.test(t)&&kept(),`chọn trùng: ${t}`);
      t=await enh(tpw.id,[]); ok(/ít nhất một/.test(t)&&kept(),"không có nguyên liệu bị từ chối");
      t=await enh(tpw.id,"x"); ok(/ít nhất một/.test(t)&&kept(),"materialIds không phải mảng bị từ chối");
      t=await enh("khong-co",[m3.id]); ok(/Không có hồn cốt này/.test(t)&&kept(),"đích lạ bị từ chối");
      await test(A,"energy",{v:0}); // tính như vừa giao chiến
      t=await enh(tpw.id,[m3.id]); ok(/Đang giao chiến: .*cường hóa/.test(t)&&kept(),`đang giao chiến: bị từ chối (${t})`);
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      // Lên mốc +5: Tay phải 5.000 năm (cùng vị trí) + Tay trái 10.000 năm (khác vị trí).
      const m4=await give(10000,"tay_trai"), g5=g1+fx(5000,"tay_phai","tay_phai")+fx(10000,"tay_trai","tay_phai");
      t=await enh(tpw.id,[m3.id,m4.id]); tw=itemOf(tpw.id); const s5=await test(A,"stats");
      ok(!itemOf(m3.id)&&!itemOf(m4.id)&&tw.stats.xp===g5&&tw.enhance===boneEnhanceLevel(g5)&&tw.enhance===5&&s5.bones.atk===atkAt(5)&&Math.abs(s5.live.atk-s5.stats.atk)<1e-6,
        `lên mốc +5 (${g5} điểm), công hồn cốt +${s5.bones.atk}: ${t}`);
      ok(A.logs.at(-1)?.includes(boneName(AK,"tay_phai",32000,5)),"log ghi tên hồn cốt kèm +5");
      // Mốc nâng kỹ năng: bị động Thân Thiết Giáp Tê Ngưu 12.000 năm lên +20 bằng 5 hồn cốt 100.000 năm cùng vị trí (điểm dư bị bỏ).
      const tg=await give(12000,"than",TG); await boneOp("equip",{itemId:tg.id,vohonId:act});
      const sp0=await test(A,"stats"), def0=sp0.live.passive.buff.def, hp0=p.maxHp, mats=[];
      for(let k=0;k<5;k++) mats.push((await give(MAX_YEARS,"than",TG)).id);
      t=await enh(tg.id,mats); const tgi=itemOf(tg.id), s20=await test(A,"stats");
      const def20=bonePassive([{beast:TG,slot:"than",years:12000,enhance:20}]).buff.def, dHp=boneStats("than",12000,20).hp-boneStats("than",12000).hp;
      ok(tgi.enhance===BONE_MAX_ENHANCE&&tgi.stats.xp===boneEnhanceNeed(BONE_MAX_ENHANCE)&&/dư .* điểm bị bỏ/.test(t)&&mats.every(id=>!itemOf(id)),`5 nguyên liệu 100.000 năm: +${tgi.enhance} tối đa, điểm dư bị bỏ (${t})`);
      ok(Math.abs(s20.live.passive.buff.def-def20)<1e-4&&Math.abs(def20-Math.min(BONE_PASSIVE_CAP.def,def0*boneSkillMult(20)))<1e-3&&def20>def0,
        `mốc +20 nâng bị động ${BONE_SKILLS[TG].passive.name}: giảm sát thương ${def0} -> ${s20.live.passive.buff.def} (×${boneSkillMult(20)})`);
      ok(s20.bones.hp===boneStats("than",12000,20).hp&&await waitFor(()=>p.maxHp===hp0+dHp),`sinh lực tối đa ${hp0} -> ${p.maxHp} (+${dHp}) ngay khi đang gắn`);
      const m5=await give(1000,"than",TG); t=await enh(tg.id,[m5.id]); ok(/tối đa \+20/.test(t)&&itemOf(m5.id),`đã +20: từ chối, nguyên liệu còn nguyên (${t})`);
      // Hồn cốt trong túi (không gắn) cũng cường hóa được; hồn cốt đã cường hóa làm nguyên liệu trả lại 80% điểm.
      const m6=await give(2000,"than",TG); t=await enh(m5.id,[m6.id]);
      const m5i=itemOf(m5.id), g6=fx(2000,"than","than");
      ok(m5i?.vohon===null&&m5i.stats.xp===g6&&m5i.enhance===boneEnhanceLevel(g6)&&!itemOf(m6.id),`cường hóa hồn cốt trong túi: +${m5i?.enhance} (${g6} điểm)`);
      const g7=g5+fx(1000,"than","tay_phai",g6); t=await enh(tpw.id,[m5.id]); tw=itemOf(tpw.id);
      ok(tw.stats.xp===g7&&tw.enhance===boneEnhanceLevel(g7)&&!itemOf(m5.id)&&/vẫn \+5|lên \+/.test(t),`nguyên liệu +${m5i?.enhance}: ${fx(1000,"than","tay_phai")} + ${Math.floor(g6*BONE_FEED_CARRY)} điểm trả lại = ${g7-g5} (${t})`);
      // Tháo về túi vẫn giữ cấp và điểm; võ hồn mất phần chỉ số của hồn cốt đó.
      t=await boneOp("unequip",{itemId:tg.id});
      ok(itemOf(tg.id)?.vohon===null&&itemOf(tg.id).enhance===BONE_MAX_ENHANCE&&itemOf(tg.id).stats.xp===boneEnhanceNeed(BONE_MAX_ENHANCE)&&/giữ cường hóa \+20/.test(t)&&await waitFor(()=>p.maxHp===hp0-boneStats("than",12000).hp),
        `tháo về túi giữ +20, sinh lực tối đa ${hp0+dHp} -> ${p.maxHp} (không còn hồn cốt Thân; ${t})`);
      await boneOp("unequip",{itemId:hd.id});
      for(const it of [tg,hd]) A.room.send("discard",{id:it.id});
      ok(await waitFor(()=>!itemOf(tg.id)&&!itemOf(hd.id),2000)&&itemOf(tpw.id)?.vohon===act,`dọn hồn cốt thử 4.4, Tay phải +${itemOf(tpw.id)?.enhance} vẫn gắn (kiểm khi vào lại)`);
      A.boneEq.atk=boneStats("tay_phai",32000,itemOf(tpw.id).enhance).atk;
    }
    // ---------- 5.2: gắn hồn hạch vào 6 ô của võ hồn, chỉ số chính và phụ cộng vào võ hồn, hiệu ứng bộ 2 / 4 món ----------
    {
      const coresOf=b=>(b.bag?.items??[]).filter(i=>i.code===CORE_ITEM), itOf=id=>A.bag.items.find(i=>i.id===id);
      const eqOf=id=>itOf(id)?.vohon, slotAt=id=>itOf(id)?.stats?.slot, loose=()=>A.bag.items.filter(i=>i.vohon===null).length;
      const worn=list=>list.map(i=>({stars:i.stars,data:i.stats}));
      /** Gửi equipcore / unequipcore; server luôn gửi lại túi và (trừ khi không đổi gì) một dòng log. Trả dòng log mới nhất. */
      async function coreOp(type,msg){ const n=A.bagMsgs??0, l=A.logs.length; A.room.send(type,msg); await waitFor(()=>(A.bagMsgs??0)>n&&A.logs.length>l,2000); await sleep(80); return A.logs.at(-1)??""; }
      /** Hook give: `n` hồn hạch `stars` sao bộ `set`; trả các món mới. */
      async function giveCores(set,n,stars=6){ const before=new Set(coresOf(A).map(i=>i.id)); for(let k=0;k<n;k++) await test(A,"give",{code:CORE_ITEM,stars,set}); return coresOf(A).filter(i=>!before.has(i.id)); }
      /** Hồn thú `years` năm đứng yên cạnh A (đầy máu), làm mục tiêu cho hook status / bst. */
      async function dummy(years,dx=12){ await test(A,"clear"); await test(A,"beast",{dx,dy:0,years}); await test(A,"bhp",{pct:100}); // hồn thú vừa sinh có thể đã lao về phía A trước bản vá state kế tiếp (dx 20 ngoài tầm đánh): lấy con gần điểm sinh nhất (đã clear)
        const d=([,b])=>Math.hypot(b.x-p.x-dx,b.y-p.y); return [...st.beasts.entries()].filter(e=>d(e)<16).sort((a,b)=>d(a)-d(b))[0]?.[0]; }
      const act=A.owned.active, bench=A.owned.team.find(r=>r&&r!==act);
      // Hàm thuần: chỉ số chính theo sao + dòng phụ; bộ 2 / 4 món; 4 + 2 và 2 + 2 + 2.
      const mk=(set,main,subs=[],stars=6)=>({stars,data:{set,main,subs}});
      ok(CORE_SLOTS===6&&same(coreBonus([mk("that_sat","atk",[["crit",3],["hp",90]]),mk("lam_ngan","hp_pct",[],1)]),
        {hp:90,atk:30,mp:0,hp_pct:coreMainValue("hp_pct",1),atk_pct:0,mp_pct:0,crit:3,crit_dmg:0}),"coreBonus: chỉ số chính theo sao + dòng phụ, 1 món mỗi bộ chưa có hiệu ứng");
      const ht2=coreFx([mk("hao_thien","hp"),mk("hao_thien","mp")]), ht4=coreFx([0,1,2,3].map(()=>mk("hao_thien","hp")));
      ok(same(ht2,{atk:0.15})&&same(ht4,{atk:0.15,combo:0.4})&&coreBonus([mk("hao_thien","hp"),mk("hao_thien","mp")]).atk_pct===15,
        "bộ Hạo Thiên: 2 món +15% công (vào chỉ số), 4 món thêm đòn thứ 3 liên tiếp +40%");
      const f42=coreFx([...[0,1,2,3].map(()=>mk("phuong_hoang","hp")),mk("tien_co","hp"),mk("tien_co","atk")]);
      const f222=coreFx(["xa_hoang","xa_hoang","linh_mieu","linh_mieu","lam_ngan","lam_ngan"].map(s=>mk(s,"hp")));
      ok(same(f42,{burn:0.12,burnMax:1,boom:0.3,energy:0.2})&&same(f222,{poison:0.15,crit:0.12,cc:0.2}),
        `ghép 4 + 2 (${JSON.stringify(f42)}) và 2 + 2 + 2 (${JSON.stringify(f222)})`);
      ok(same(CORE_SET_FX.tien_co,{two:{energy:0.2},four:{tienCo:0.35}})&&calcStats(0,10,[1],1,{},{atk_pct:10,crit:5}).atk===calcStats(0,10,[1]).atk*1.1
        &&calcStats(0,10,[1],1,{},{crit:5,crit_dmg:10}).crit===CRIT.chance+0.05,"calcStats nhận hồn hạch: % nhân phần gốc, chí mạng cộng vào");

      await test(A,"goto",spot); await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const s0=await test(A,"stats");
      ok(Object.values(s0.cores).every(x=>x===0)&&same(s0.fx,{})&&s0.live.crit===CRIT.chance&&s0.live.critMult===CRIT.mult,"chưa gắn hồn hạch: không cộng gì, chí mạng gốc");
      const HT=await giveCores("hao_thien",4);
      ok(HT.length===4&&HT.every(i=>i.vohon===null),"A có 4 hồn hạch Hạo Thiên 6★ (hook give)");
      // Từ chối: không phải hồn hạch, id lạ, võ hồn không thuộc mình, ô sai, đang giao chiến.
      const dan=A.bag.items.find(i=>i.code!==CORE_ITEM&&i.vohon===null&&i.code!==BONE_ITEM), bone=bonesOf(A)[0];
      let t;
      if(dan){ t=await coreOp("equipcore",{itemId:dan.id,vohonId:act}); ok(/Không có hồn hạch này/.test(t),`gắn vật phẩm không phải hồn hạch bị từ chối: ${t}`); }
      if(bone){ t=await coreOp("equipcore",{itemId:bone.id,vohonId:act}); ok(/Không có hồn hạch này/.test(t)&&bonesOf(A).find(i=>i.id===bone.id)?.vohon===bone.vohon,"hồn cốt không gắn vào ô hồn hạch"); }
      t=await coreOp("equipcore",{itemId:"khong-co",vohonId:act}); ok(/Không có hồn hạch này/.test(t),"id lạ bị từ chối");
      t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:987654321}); ok(/không sở hữu/.test(t)&&eqOf(HT[0].id)===null,`võ hồn không thuộc mình bị từ chối: ${t}`);
      t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:String(act)}); ok(/không sở hữu/.test(t),"vohonId không phải số nguyên bị từ chối");
      for(const bad of [6,-1,1.5,"2"]){ t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:act,slot:bad}); ok(/Ô hồn hạch không hợp lệ/.test(t)&&eqOf(HT[0].id)===null,`ô ${JSON.stringify(bad)} bị từ chối`); }
      await test(A,"energy",{v:0}); // tính như vừa giao chiến
      t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:act}); ok(/Đang giao chiến: .* gắn \/ tháo hồn hạch/.test(t)&&eqOf(HT[0].id)===null,`đang giao chiến: gắn bị từ chối (${t})`);
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      // Gắn vào ô 4 (chỉ số 3): không còn chiếm ô túi; chỉ số chính + phụ cộng ngay vào võ hồn ra trận.
      const free0=loose();
      t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:act,slot:3});
      let s1=await test(A,"stats");
      ok(eqOf(HT[0].id)===act&&slotAt(HT[0].id)===3&&loose()===free0-1&&t.startsWith(`Gắn hồn hạch Hạo Thiên 6★ vào ô 4`),`gắn vào ô 4: ${t}`);
      ok(same(s1.cores,coreBonus(worn([itOf(HT[0].id)])))&&same(s1.fx,{})&&s1.live.maxHp===s1.stats.maxHp&&s1.live.maxMp===s1.stats.maxMp&&Math.abs(s1.live.atk-s1.stats.atk)<1e-6,
        `chỉ số hồn hạch cộng ngay: ${CORE_STAT_IDS.filter(k=>s1.cores[k]).map(k=>coreStatText(k,s1.cores[k])).join(", ")} (1 món: chưa có hiệu ứng bộ)`);
      // Không gửi ô: vào ô trống đầu tiên; đủ 2 món Hạo Thiên thì +15% công.
      t=await coreOp("equipcore",{itemId:HT[1].id,vohonId:act});
      s1=await test(A,"stats");
      const noSet={...s1.cores,atk_pct:s1.cores.atk_pct-15}, vh=vohonIndex(A.owned.list.find(v=>v.rowId===act).vohon), vv=A.owned.list.find(v=>v.rowId===act);
      const calc=c=>calcStats(vh,vv.level,vv.rings.map(tierOfYears),vv.stars,s1.bones,c,A.res?.bonus).atk;
      ok(slotAt(HT[1].id)===0&&/Kích hoạt bộ Hạo Thiên 2 món: \+15% công/.test(t)&&s1.sets.hao_thien===2&&same(s1.fx,{atk:0.15}),`không chọn ô: vào ô 1; ${t}`);
      ok(same(s1.cores,coreBonus(worn([0,1].map(k=>itOf(HT[k].id)))))&&Math.abs(s1.live.atk-calc(s1.cores))<1e-6&&calc(s1.cores)>calc(noSet),
        `bộ Hạo Thiên 2 món: công ${calc(noSet).toFixed(1)} -> ${s1.live.atk.toFixed(1)} (+15%)`);
      // Đổi chỗ: ô 1 đã có thì món cũ về túi, số ô túi không đổi; chuyển giữa hai ô của cùng võ hồn.
      const free1=loose();
      t=await coreOp("equipcore",{itemId:HT[2].id,vohonId:act,slot:0});
      ok(eqOf(HT[2].id)===act&&slotAt(HT[2].id)===0&&eqOf(HT[1].id)===null&&slotAt(HT[1].id)===undefined&&loose()===free1&&/về túi đồ/.test(t),`đổi chỗ: ô 1 thay món mới, món cũ về túi (${t})`);
      t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:act,slot:0});
      ok(slotAt(HT[0].id)===0&&slotAt(HT[2].id)===3&&/^Chuyển .* sang ô 1 .* sang ô 4/.test(t),`chuyển ô 4 sang ô 1, hai món đổi chỗ (${t})`);
      await coreOp("equipcore",{itemId:HT[1].id,vohonId:act}); await coreOp("equipcore",{itemId:HT[3].id,vohonId:act});
      s1=await test(A,"stats");
      ok(same([0,1,2,3].map(k=>slotAt(HT[k].id)),[0,1,3,2])&&s1.sets.hao_thien===4&&same(s1.fx,{atk:0.15,combo:0.4})&&A.logs.some(x=>/Kích hoạt bộ Hạo Thiên 4 món/.test(x)),
        `4 món Hạo Thiên ở ô 1–4: ${JSON.stringify(s1.fx)}`);
      // Hạo Thiên 4 món: đòn thường trúng thứ 3 liên tiếp thêm sát thương (fx combo đúng ở đòn thứ 3).
      // Trói hồn thú để đòn đánh không đẩy lùi nó ra khỏi tầm (đòn trượt thì đếm lại).
      await test(A,"goto",spot); await step(A,1,0); await dummy(MAX_YEARS); await test(A,"status",{s:"root",secs:10}); await test(A,"ready");
      const combos=[]; for(let k=0;k<3;k++){ A.fxs=[]; await sleep(450); A.room.send("attack"); await sleep(250); combos.push(A.fxs.filter(f=>f.k==="combo"&&f.id===A.room.sessionId).length); }
      ok(same(combos,[0,0,1]),`Hạo Thiên 4 món: liên kích ở đòn thứ 3 (${combos.join(", ")})`);
      if(bench){ t=await coreOp("equipcore",{itemId:HT[0].id,vohonId:bench}); ok(/tháo ra trước/.test(t)&&eqOf(HT[0].id)===act,`hồn hạch đang gắn trên võ hồn khác không gắn thẳng sang: ${t}`); }
      // Gục: hồn hạch vẫn gắn nguyên (mục 2: thua không mất đồ).
      if(bench){
        A.ko=null; await test(A,"down"); await waitFor(()=>A.ko,2000);
        ok(HT.every(i=>eqOf(i.id)===act),"võ hồn gục: hồn hạch vẫn gắn nguyên");
        await test(A,"rest",{s:REVIVE_SECS+1}); await waitFor(()=>!p.dead,4000);
        if(A.owned.active!==act){ await waitFor(()=>p.swCd===0,3500); A.room.send("switch",{slot:A.owned.team.indexOf(act)}); await waitFor(()=>A.owned.active===act); }
      }
      // Tháo khi túi đầy: từ chối; tháo về túi giữ nâng cấp.
      await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      await test(A,"give",{code:RING_ITEM,qty:BAG_SLOTS-loose(),years:50});
      t=await coreOp("unequipcore",{itemId:HT[3].id});
      ok(loose()===BAG_SLOTS&&/Túi đồ đã đầy .* tháo được hồn hạch/.test(t)&&eqOf(HT[3].id)===act,`túi đầy: tháo bị từ chối (${t})`);
      for(const i of ringsOf(A).filter(i=>i.years===50)) A.room.send("discard",{id:i.id});
      ok(await waitFor(()=>!ringsOf(A).some(i=>i.years===50),3000),"dọn túi A");
      const l0=A.logs.length; A.room.send("discard",{id:HT[3].id}); await waitFor(()=>A.logs.length>l0);
      ok(eqOf(HT[3].id)===act,"hồn hạch đang gắn không bỏ được (không nằm trong túi)");
      for(const it of HT) t=await coreOp("unequipcore",{itemId:it.id});
      s1=await test(A,"stats");
      ok(HT.every(i=>eqOf(i.id)===null&&slotAt(i.id)===undefined)&&/giữ nâng cấp \+0/.test(t)&&Object.values(s1.cores).every(x=>x===0)&&same(s1.fx,{})&&Math.abs(s1.live.atk-s0.live.atk)<1e-6,
        `tháo cả 4 về túi: chỉ số về như cũ (${t})`);
      t=await coreOp("unequipcore",{itemId:HT[0].id}); ok(/không gắn trên võ hồn nào/.test(t),"tháo hồn hạch đang ở túi bị từ chối");
      for(const it of HT) A.room.send("discard",{id:it.id});
      await waitFor(()=>!HT.some(i=>itOf(i.id)),2000);

      // Tiên Cơ (mục 2.4): 2 món trên võ hồn ngoài sân tích năng lượng +20%; 4 món: tiên cơ của võ hồn đó +35% sát thương.
      if(bench){
        const TC=await giveCores("tien_co",4);
        await coreOp("equipcore",{itemId:TC[0].id,vohonId:bench}); t=await coreOp("equipcore",{itemId:TC[1].id,vohonId:bench});
        const sb=await test(A,"stats",{rowId:bench}), sa=await test(A,"stats");
        ok(sb.sets.tien_co===2&&same(sb.fx,{energy:0.2})&&sb.live===null&&same(sa.fx,{}),"gắn 2 Tiên Cơ vào võ hồn ngoài sân: chỉ võ hồn đó có bộ");
        await test(A,"goto",spot); await step(A,1,0); await test(A,"clear"); await test(A,"beast",{dx:12,dy:0,years:10});
        await test(A,"energy",{v:0}); await waitFor(()=>sqOf(A,bench)?.en===0);
        A.room.send("attack"); await waitFor(()=>sqOf(A,bench)?.en>0);
        ok(sqOf(A,bench)?.en===Math.floor(TIEN_CO_GAIN.attack*1.2),`Tiên Cơ 2 món: đòn thường +${sqOf(A,bench)?.en} năng lượng cho võ hồn mang bộ (thường ${TIEN_CO_GAIN.attack})`);
        await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
        await coreOp("equipcore",{itemId:TC[2].id,vohonId:bench}); await coreOp("equipcore",{itemId:TC[3].id,vohonId:bench});
        const sb4=await test(A,"stats",{rowId:bench}), bv=A.owned.list.find(v=>v.rowId===bench), tc=tienCoOf(bv.vohon);
        ok(sb4.sets.tien_co===4&&same(sb4.fx,{energy:0.2,tienCo:0.35}),"4 món Tiên Cơ trên võ hồn ngoài sân");
        // Đổi tay vào võ hồn đầy năng lượng: sát thương tiên cơ = công × hệ số × 1,35 (chí mạng thì nhân hệ số chí mạng).
        await waitFor(()=>p.swCd===0,3500); await test(A,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sqOf(A,bench)?.en===TIEN_CO_MAX);
        const bid=await dummy(1500,20); A.dmgs=[]; A.fx=[];
        A.room.send("switch",{slot:A.owned.team.indexOf(bench)});
        await waitFor(()=>A.fx.length&&A.dmgs.some(d=>d.bid===bid),1500);
        const dm=A.dmgs.find(d=>d.bid===bid), sw=await test(A,"stats");
        if(tc.pctHp||tc.lowHp||!tc.dmg) console.log(`  ⚠ bỏ qua đo sát thương tiên cơ của ${bv.vohon} (có % sinh lực / theo máu đã mất)`);
        else { const want=sw.live.atk*tc.dmg*1.35*(dm?.crit?sw.live.critMult:1);
          ok(dm&&Math.abs(dm.v-want)<=1&&sw.rowId===bench,`Tiên Cơ 4 món: ${tc.name} gây ${dm?.v}${dm?.crit?" (chí mạng)":""} ≈ ${want.toFixed(1)} (công ${sw.live.atk.toFixed(1)} × ${tc.dmg} × 1,35)`); }
        await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
        await waitFor(()=>p.swCd===0,3500); A.room.send("switch",{slot:A.owned.team.indexOf(act)}); await waitFor(()=>A.owned.active===act);
        A.coreBench={vohon:bench,ids:TC.map(i=>i.id)}; // giữ 4 Tiên Cơ trên võ hồn ngoài sân: kiểm khi vào lại
      } else console.log("  ⚠ bỏ qua Tiên Cơ (đội chỉ có một võ hồn)");

      // Phượng Hoàng 4 + Xà Hoàng 2 (ghép 4 + 2): Thiêu đốt +12%, thêm 1 tầng tối đa, Viêm bạo +30%; Trúng độc +15%.
      const PH=await giveCores("phuong_hoang",4), XH=await giveCores("xa_hoang",4);
      await test(A,"goto",spot); await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      for(const it of [...PH,XH[0],XH[1]]) await coreOp("equipcore",{itemId:it.id,vohonId:act});
      t=await coreOp("equipcore",{itemId:XH[2].id,vohonId:act});
      s1=await test(A,"stats");
      ok(/đã đủ 6 hồn hạch: chọn một ô để thay/.test(t)&&eqOf(XH[2].id)===null&&same(Object.values(s1.slots).sort(),[0,1,2,3,4,5]),`đủ 6 ô: món thứ 7 không chọn ô bị từ chối (${t})`);
      ok(s1.sets.phuong_hoang===4&&s1.sets.xa_hoang===2&&same(s1.fx,{burn:0.12,burnMax:1,boom:0.3,poison:0.15}),`ghép 4 + 2: ${JSON.stringify(s1.fx)}`);
      const atkNow=s1.live.atk*(1+(s1.live.passive?.buff?.atk??0)), bond=await test(A,"bond");
      await dummy(MAX_YEARS); await test(A,"status",{s:"burn",n:9}); await test(A,"status",{s:"poison",n:5});
      let bs=await test(A,"bst");
      const wantBurn=atkNow*STATUS.burn.dot*(1+bond.burn+0.12), wantPoi=atkNow*STATUS.poison.dot*1.15;
      ok(bs.st?.burn?.n===STATUS.burn.max+1&&Math.abs(bs.st.burn.v-wantBurn)<1e-6&&bs.st.burn.mine,`Phượng Hoàng: Thiêu đốt ${bs.st?.burn?.n} tầng (tối đa ${STATUS.burn.max}+1), mỗi tầng ${bs.st?.burn?.v.toFixed(2)}/giây (+12%)`);
      ok(Math.abs((bs.st?.poison?.v??0)-wantPoi)<1e-6,`Xà Hoàng 2 món: Trúng độc mỗi tầng ${bs.st?.poison?.v.toFixed(2)}/giây (+15%)`);
      // Viêm bạo: sát thương còn lại × 1,5 × 1,3 (đo theo thời gian còn lại ngay trước khi kích nổ).
      bs=await test(A,"bst"); A.dmgs=[]; const bb=bs.st.burn, bidB=bs.bid; await test(A,"boom");
      await waitFor(()=>A.dmgs.some(d=>d.bid===bidB&&d.c===STATUS.burn.col&&d.v>bb.v*bb.n),800);
      const boomD=A.dmgs.filter(d=>d.bid===bidB&&d.c===STATUS.burn.col).reduce((a,d)=>Math.max(a,d.v),0), boomW=bb.v*bb.n*bb.t*STATUS.burn.boom*1.3;
      ok(boomD>0&&Math.abs(boomD/boomW-1)<0.08,`Phượng Hoàng 4 món: Viêm bạo ${boomD} ≈ ${boomW.toFixed(0)} (×1,3)`);
      // Đổi 2 Phượng Hoàng lấy 2 Xà Hoàng (4 + 2 ngược lại): Trúng độc đủ 5 tầng thì như Dễ thương 10%; Thiêu đốt về 5 tầng tối đa.
      const sPH=[slotAt(PH[2].id),slotAt(PH[3].id)];
      await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      await coreOp("equipcore",{itemId:XH[2].id,vohonId:act,slot:sPH[0]}); await coreOp("equipcore",{itemId:XH[3].id,vohonId:act,slot:sPH[1]});
      s1=await test(A,"stats");
      ok(s1.sets.xa_hoang===4&&s1.sets.phuong_hoang===2&&same(s1.fx,{burn:0.12,poison:0.15,poisonVuln:0.1})&&eqOf(PH[2].id)===null,`đổi 2 món: Xà Hoàng 4 + Phượng Hoàng 2 ${JSON.stringify(s1.fx)}`);
      const bidP=await dummy(MAX_YEARS); await test(A,"status",{s:"burn",n:9}); await test(A,"status",{s:"poison",n:5});
      bs=await test(A,"bst"); A.dmgs=[];
      ok(bs.st?.burn?.n===STATUS.burn.max,`không còn Phượng Hoàng 4 món: Thiêu đốt tối đa ${bs.st?.burn?.n} tầng`);
      await waitFor(()=>A.dmgs.some(d=>d.bid===bidP&&d.c===STATUS.poison.col),1500);
      const pd=A.dmgs.find(d=>d.bid===bidP&&d.c===STATUS.poison.col), pw=bs.st.poison.v*bs.st.poison.n*1.1;
      ok(pd&&Math.abs(pd.v-pw)<=1,`Xà Hoàng 4 món: Trúng độc 5 tầng gây ${pd?.v} mỗi giây ≈ ${pw.toFixed(1)} (như Dễ thương +10%)`);
      // Linh Miêu 2 (+12% chí mạng) + Lam Ngân 2 (+20% thời gian khống chế) + Xà Hoàng 2 (ghép 2 + 2 + 2).
      await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const LM=await giveCores("linh_mieu",2), LN=await giveCores("lam_ngan",2);
      const sl=[...PH.slice(0,2),...XH.slice(0,2)].map(i=>slotAt(i.id));
      for(const [k,it] of [...LM,...LN].entries()) await coreOp("equipcore",{itemId:it.id,vohonId:act,slot:sl[k]});
      s1=await test(A,"stats");
      ok(s1.sets.linh_mieu===2&&s1.sets.lam_ngan===2&&s1.sets.xa_hoang===2&&same(s1.fx,{poison:0.15,crit:0.12,cc:0.2})&&!Object.keys(s1.sets).includes("phuong_hoang"),
        `ghép 2 + 2 + 2: ${JSON.stringify(s1.sets)}`);
      ok(s1.cores.crit>=12&&Math.abs(s1.live.crit-(CRIT.chance+s1.cores.crit/100))<1e-9&&Math.abs(s1.live.critMult-(CRIT.mult+s1.cores.crit_dmg/100))<1e-9,
        `Linh Miêu 2 món: tỉ lệ chí mạng ${(s1.live.crit*100).toFixed(1)}% (gốc ${CRIT.chance*100}% + hồn hạch ${s1.cores.crit}%), hệ số ${s1.live.critMult.toFixed(2)}`);
      await dummy(500); await test(A,"status",{s:"root"}); bs=await test(A,"bst");
      const rootW=STATUS.root.secs*1.2;
      ok(bs.st?.root&&bs.st.root.t>rootW-0.25&&bs.st.root.t<=rootW+1e-9,`Lam Ngân 2 món: Trói ${bs.st?.root?.t.toFixed(2)} giây (thường ${STATUS.root.secs}, +20%)`);
      await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      for(const it of [...PH,...XH].filter(i=>itOf(i.id))) { if(eqOf(it.id)!==null) await coreOp("unequipcore",{itemId:it.id}); A.room.send("discard",{id:it.id}); }
      ok(await waitFor(()=>![...PH,...XH].some(i=>itOf(i.id)),3000),"dọn hồn hạch thử Phượng Hoàng / Xà Hoàng");
      // ---------- 5.3: nâng cấp hồn hạch bằng hồn hạch dư (+0..+15, điểm theo sao, cùng bộ thêm, mỗi 3 cấp 1 dòng phụ) ----------
      {
        const up=(targetId,materialIds)=>{ A.coreUp=null; return coreOp("enhancecore",{targetId,materialIds}); };
        const fx=(stars,set,tgt,xp)=>coreFeedXp({set,stars,xp},tgt);
        const tol=k=>CORE_STATS[k].pct?0.11:1.01, inRoll=(k,v,stars)=>v>=coreSubMax(k,stars)*CORE_SUB_ROLL[0]-tol(k)&&v<=coreSubMax(k,stars)*CORE_SUB_ROLL[1]+tol(k);
        const wornE=()=>coresOf(A).filter(i=>i.vohon===act).map(i=>({stars:i.stars,data:i.stats,enhance:i.enhance}));
        const liveOk=s=>s.live.maxHp===s.stats.maxHp&&s.live.maxMp===s.stats.maxMp&&Math.abs(s.live.atk-s.stats.atk)<1e-6&&Math.abs(s.live.crit-s.stats.crit)<1e-9&&Math.abs(s.live.critMult-s.stats.critMult)<1e-9;
        // Công thức (shared/data.ts, chờ chốt).
        ok(fx(1,"a","b")===CORE_FEED_STAR[0]&&fx(6,"a","b")===CORE_FEED_STAR[5]&&fx(4,"a","a")===Math.round(CORE_FEED_STAR[3]*CORE_FEED_SAME_SET)&&fx(2,"a","b",100)===CORE_FEED_STAR[1]+Math.floor(100*CORE_FEED_CARRY),
          `điểm nguyên liệu theo sao (${CORE_FEED_STAR.join(" / ")}), cùng bộ ×${CORE_FEED_SAME_SET}, nguyên liệu đã nâng cấp trả lại ${CORE_FEED_CARRY*100}%`);
        ok(Array.from({length:CORE_MAX_ENHANCE+1},(_,n)=>coreEnhanceLevel(coreEnhanceNeed(n))===n&&(n===0||coreEnhanceLevel(coreEnhanceNeed(n)-1)===n-1)).every(Boolean)&&coreEnhanceLevel(1e9)===CORE_MAX_ENHANCE,
          `bảng ngưỡng +1..+${CORE_MAX_ENHANCE} (+3 / +6 / +9 / +12 / +15 cần ${[3,6,9,12,15].map(coreEnhanceNeed).join(" / ")} điểm)`);
        ok(CORE_STAT_IDS.every(k=>Array.from({length:CORE_MAX_ENHANCE},(_,n)=>coreMainValue(k,6,n+1)>coreMainValue(k,6,n)).every(Boolean))&&coreMainValue("atk",6,15)===Math.round(30*(1+15*CORE_ENHANCE_MAIN)),
          `mỗi cấp tăng chỉ số chính (Công 6★: ${coreMainValue("atk",6)} → +15 ${coreMainValue("atk",6,15)})`);
        ok(coreName("hao_thien",4,6)==="+6 Hồn hạch Hạo Thiên 4★"&&coreName("hao_thien",4)==="Hồn hạch Hạo Thiên 4★",`tên có +N: ${coreName("hao_thien",4,6)}`);
        ok(coreSubRolls(0,15)===5&&coreSubRolls(2,3)===1&&coreSubRolls(3,5)===0&&coreSubRolls(5,12)===3,"mốc dòng phụ +3 / +6 / +9 / +12 / +15");
        { const d0={set:"hao_thien",main:"atk",subs:[["hp",50],["crit",2]]}, r=coreUpgradeSubs(d0,6,5,Math.random), ks=r.data.subs.map(x=>x[0]);
          ok(r.ups.length===5&&r.ups.filter(u=>u.add).length===2&&r.data.subs.length===CORE_MAX_SUBS&&new Set(ks).size===4&&!ks.includes("atk")&&same(d0.subs,[["hp",50],["crit",2]])
            &&r.ups.every(u=>inRoll(u.k,u.v,6))&&r.ups.filter(u=>!u.add).every(u=>ks.includes(u.k)),`coreUpgradeSubs: 2 dòng + 5 lần = 4 dòng (2 mới, 3 lần tăng dòng có sẵn) ${JSON.stringify(r.data.subs)}`); }
        { const pv=coreEnhancePreview({set:"a",xp:coreEnhanceNeed(14),subs:4},[{set:"a",stars:6}]);
          ok(pv.level===CORE_MAX_ENHANCE&&pv.xp===coreEnhanceNeed(CORE_MAX_ENHANCE)&&pv.waste>0&&pv.rolls===1&&pv.adds===0,`xem trước: kẹp ở +${CORE_MAX_ENHANCE}, dư ${pv.waste} điểm, đủ 4 dòng thì tăng dòng có sẵn`); }
        // Đích: Linh Miêu 4★ (2 dòng phụ) gắn vào ô của LM[0] trên võ hồn ra trận (vẫn đủ 2 món Linh Miêu), LM[0] về túi.
        await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
        const [T]=await giveCores("linh_mieu",1,4), lmSlot=slotAt(LM[0].id);
        await coreOp("equipcore",{itemId:T.id,vohonId:act,slot:lmSlot});
        ok(eqOf(T.id)===act&&slotAt(T.id)===lmSlot&&eqOf(LM[0].id)===null&&itOf(T.id).stats.subs.length===CORE_SUBS[3]&&itOf(T.id).enhance===0,
          `đích: ${coreName("linh_mieu",4)} (${CORE_SUBS[3]} dòng phụ) gắn ở ô ${lmSlot+1}, ${coreName("linh_mieu",6)} cũ về túi`);
        const main=itOf(T.id).stats.main, s0=await test(A,"stats");
        // Từ chối (không mất gì): chính nó, hồn hạch đang gắn, vật phẩm khác, hồn cốt làm đích, rỗng, không phải mảng, trùng, đích lạ, đang giao chiến.
        let r=await up(T.id,[T.id]); ok(/chính hồn hạch/.test(r),`chính nó làm nguyên liệu bị từ chối: ${r}`);
        r=await up(T.id,[LM[1].id]); ok(/đang gắn trên võ hồn/.test(r)&&eqOf(LM[1].id)===act,`hồn hạch đang gắn làm nguyên liệu bị từ chối: ${r}`);
        r=await up(T.id,[LM[0].id,LM[1].id]); ok(/đang gắn trên võ hồn/.test(r)&&itOf(LM[0].id),"lẫn một món đang gắn: cả lần bị từ chối, món hợp lệ còn nguyên");
        if(dan){ r=await up(T.id,[dan.id]); ok(/Nguyên liệu phải là hồn hạch/.test(r)&&itOf(dan.id),`vật phẩm không phải hồn hạch bị từ chối: ${r}`); }
        if(bone){ r=await up(bone.id,[LM[0].id]); ok(/Không có hồn hạch này/.test(r)&&itOf(LM[0].id),"hồn cốt không nâng cấp bằng tin của hồn hạch"); }
        r=await up(T.id,[]); ok(/ít nhất một/.test(r),"không chọn nguyên liệu bị từ chối");
        r=await up(T.id,LM[0].id); ok(/ít nhất một/.test(r),"materialIds không phải mảng bị từ chối");
        r=await up(T.id,[LM[0].id,LM[0].id]); ok(/trùng/.test(r),"nguyên liệu trùng bị từ chối");
        r=await up("khong-co",[LM[0].id]); ok(/Không có hồn hạch này/.test(r),"đích lạ bị từ chối");
        await test(A,"energy",{v:0}); // tính như vừa giao chiến
        r=await up(T.id,[LM[0].id]); ok(/Đang giao chiến: .* nâng cấp hồn hạch/.test(r)&&itOf(LM[0].id),`đang giao chiến: bị từ chối (${r})`);
        await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
        ok(itOf(T.id).enhance===0&&!itOf(T.id).stats.xp&&itOf(T.id).stats.subs.length===CORE_SUBS[3],"sau các lần bị từ chối: đích vẫn +0, không mất nguyên liệu");
        // +2: hai hồn hạch Tiên Cơ 3★ khác bộ.
        const M3=await giveCores("tien_co",3,3), g2=2*fx(3,"tien_co","linh_mieu");
        r=await up(T.id,[M3[0].id,M3[1].id]); let tw=itOf(T.id); const s1=await test(A,"stats");
        const dMain=s1.cores[main]-s0.cores[main], wMain=coreMainValue(main,4,2)-coreMainValue(main,4);
        ok(tw.stats.xp===g2&&tw.enhance===coreEnhanceLevel(g2)&&tw.enhance===2&&tw.stats.subs.length===CORE_SUBS[3]&&!itOf(M3[0].id)&&!itOf(M3[1].id)&&eqOf(T.id)===act&&slotAt(T.id)===lmSlot
          &&A.coreUp?.from===0&&A.coreUp?.to===2&&A.coreUp?.gain===g2&&A.coreUp?.subs.length===0,`2 hồn hạch 3★ khác bộ = ${g2} điểm: +${tw.enhance}, chưa tới mốc dòng phụ, 2 nguyên liệu đã mất (${r})`);
        ok(Math.abs(dMain-wMain)<0.11&&dMain>0&&liveOk(s1)&&same(s1.cores,coreBonus(wornE())),`đang gắn: ${CORE_STATS[main].name} chính +${dMain.toFixed(1)} ngay (≈ ${wMain.toFixed(1)}), chỉ số trong trận khớp`);
        // +3: thêm một 3★ (120 điểm) → thêm 1 dòng phụ mới.
        const subs2=tw.stats.subs; r=await up(T.id,[M3[2].id]); tw=itOf(T.id); const s2=await test(A,"stats");
        const nk=tw.stats.subs[2]?.[0], nv=tw.stats.subs[2]?.[1];
        ok(tw.enhance===3&&tw.stats.xp===3*fx(3,"tien_co","linh_mieu")&&tw.stats.subs.length===3&&same(tw.stats.subs.slice(0,2),subs2)&&nk!==main&&!subs2.some(x=>x[0]===nk)&&inRoll(nk,nv,4)
          &&A.coreUp?.subs.length===1&&A.coreUp.subs[0].add&&A.coreUp.subs[0].k===nk&&/thêm dòng phụ/.test(r),`+3: thêm dòng phụ ${nk&&coreStatText(nk,nv)} (${r})`);
        ok(Math.abs(s2.cores[nk]-s1.cores[nk]-nv)<0.11&&liveOk(s2)&&same(s2.cores,coreBonus(wornE())),`dòng phụ mới cộng ngay vào võ hồn đang gắn (${CORE_STATS[nk]?.name} +${(s2.cores[nk]-s1.cores[nk]).toFixed(1)})`);
        // Tới +15: năm hồn hạch Linh Miêu 6★ cùng bộ (+6 thêm dòng thứ 4, +9 / +12 / +15 tăng dòng có sẵn), điểm dư bị bỏ.
        const M6=await giveCores("linh_mieu",5,6), before=new Map(tw.stats.subs.map(([k,v])=>[k,v]));
        r=await up(T.id,M6.map(i=>i.id)); tw=itOf(T.id); const s3=await test(A,"stats"), ups=A.coreUp?.subs??[];
        const growOk=tw.stats.subs.every(([k,v])=>Math.abs(v-(before.get(k)??0)-ups.filter(u=>u.k===k).reduce((a,u)=>a+u.v,0))<(CORE_STATS[k].pct?0.15:0.5)); // mỗi dòng: tăng đúng tổng các lần tung (dòng mới ở +6 có thể được tăng tiếp)
        ok(tw.enhance===CORE_MAX_ENHANCE&&tw.stats.xp===coreEnhanceNeed(CORE_MAX_ENHANCE)&&/dư .* điểm bị bỏ/.test(r)&&M6.every(i=>!itOf(i.id))&&tw.stats.subs.length===CORE_MAX_SUBS
          &&ups.length===4&&ups.filter(u=>u.add).length===1&&ups.every(u=>inRoll(u.k,u.v,4))&&growOk,
          `5 hồn hạch 6★ cùng bộ: +${tw.enhance} tối đa, ${tw.stats.subs.length} dòng phụ (1 dòng mới, 3 lần tăng: ${ups.filter(u=>!u.add).map(u=>coreStatText(u.k,u.to)).join(", ")})`);
        ok(liveOk(s3)&&same(s3.cores,coreBonus(wornE()))&&Math.abs(s3.cores[main]-s0.cores[main]-(coreMainValue(main,4,15)-coreMainValue(main,4)))<0.11,
          `+15 đang gắn: ${coreStatText(main,coreMainValue(main,4,15))} chính (+0: ${coreStatText(main,coreMainValue(main,4))}), chỉ số trong trận khớp`);
        const [M1]=await giveCores("tien_co",1,1); r=await up(T.id,[M1.id]); ok(/tối đa \+15/.test(r)&&itOf(M1.id),`+15 bị từ chối: ${r}`);
        // Hồn hạch trong túi: X (Tiên Cơ 2★) nâng bằng Y (cùng bộ), rồi X làm nguyên liệu cho LM[0] trả lại 80% điểm đã nạp.
        const [X,Y]=await giveCores("tien_co",2,2); r=await up(X.id,[Y.id]); const gx=fx(2,"tien_co","tien_co");
        ok(itOf(X.id)?.vohon===null&&itOf(X.id).stats.xp===gx&&itOf(X.id).enhance===coreEnhanceLevel(gx)&&!itOf(Y.id),`nâng cấp hồn hạch trong túi: +${itOf(X.id)?.enhance} (${gx} điểm)`);
        r=await up(LM[0].id,[X.id]); const gl=fx(2,"tien_co","linh_mieu",gx);
        ok(itOf(LM[0].id).stats.xp===gl&&itOf(LM[0].id).enhance===coreEnhanceLevel(gl)&&!itOf(X.id),`nguyên liệu +${coreEnhanceLevel(gx)}: ${fx(2,"tien_co","linh_mieu")} + ${Math.floor(gx*CORE_FEED_CARRY)} điểm trả lại = ${gl} (${r})`);
        for(const it of [LM[0],M1]) A.room.send("discard",{id:it.id});
        ok(await waitFor(()=>!itOf(LM[0].id)&&!itOf(M1.id),2000)&&eqOf(T.id)===act,`dọn hồn hạch thử 5.3, ${coreName("linh_mieu",4,15)} vẫn gắn (kiểm khi vào lại)`);
      }
      s1=await test(A,"stats");
      A.coreEq={vohon:act,slots:s1.slots,cores:s1.cores,fx:s1.fx}; // Linh Miêu 2 + Lam Ngân 2 vẫn gắn: kiểm khi vào lại
      ok(Object.keys(s1.slots).length===4&&same(s1.fx,{crit:0.12,cc:0.2}),`còn 4 hồn hạch gắn trên võ hồn ra trận (kiểm khi vào lại): ${JSON.stringify(s1.sets)}`);
      A.coreKeep=coresOf(A).map(i=>[i.id,i.stars,sj(i.stats),i.vohon]); // 5.1 + 5.2: vào lại phải còn nguyên (kiểm ở dưới)
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
// 6.1: NPC trong làng. Đứng xa thì server từ chối; lại gần (hook goto) thì cho mở hộp thoại; NPC của bản đồ khác không có ở đây.
{
  console.log("[6.1] NPC ở Thánh Hồn Thôn");
  const tv=npcSpot("thanh_hon_thon","to_van_dao"), lk=npcSpot("thanh_hon_thon","lao_kiet_khac");
  ok(tv&&lk,"Thánh Hồn Thôn có Tố Vân Đào và Lão Kiệt Khắc (object npc)");
  const far=Math.hypot(tv.x-me().x,tv.y-me().y);
  if(far>NPC_RANGE) ok(await talk(C,"to_van_dao")===null&&/lại gần Tố Vân Đào/.test(C.logs.at(-1)),`đứng cách ${far.toFixed(0)} px (> ${NPC_RANGE}): Tố Vân Đào chưa nói chuyện (${C.logs.at(-1)})`);
  ok(await talk(C,"dai_su")===null&&/Không có NPC này/.test(C.logs.at(-1)),"Đại Sư không ở Thánh Hồn Thôn: bị từ chối");
  ok(await talk(C,"ai_do")===null&&/Không có NPC này/.test(C.logs.at(-1)),"mã NPC lạ bị từ chối");
  ok(/đứng cạnh thương nhân/.test(await trade(C,"buy",{code:"hoi_huyet_dan",qty:1})),"trong làng không có thương nhân: không mua được đan");
  if((await test(C,"ping"))?.enabled){
    const home=[me().x,me().y];
    for(const [id,sp] of [["to_van_dao",tv],["lao_kiet_khac",lk]]){
      await test(C,"goto",{x:sp.x,y:sp.y+16});
      ok(Math.hypot(me().x-sp.x,me().y-sp.y-16)<1,`đứng cạnh ${npcDef(id).name} (cách 16 px)`);
      ok(await talk(C,id)===id,`nói chuyện với ${npcDef(id).name}, ${npcDef(id).title}: server cho mở hộp thoại (${npcDef(id).lines.length} câu)`);
    }
    await test(C,"goto",{x:home[0],y:home[1]});
  } else console.log("  ⚠ bỏ qua nói chuyện với NPC trong làng (cần hook goto): bật server bằng GAME_TEST=1");
}
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
  // 5.1: hồn hạch chưa lưu cũng nằm trong transaction đi cổng; bagKey so cả sao, bộ, chỉ số.
  await test(C,"give",{code:CORE_ITEM,stars:6,set:"phuong_hoang"});
  const cc=(C.bag?.items??[]).find(i=>i.code===CORE_ITEM&&i.stars===6);
  ok(cc&&cc.stats?.set==="phuong_hoang"&&cc.stats?.subs?.length===4,`C có ${cc&&coreName(cc.stats?.set,cc.stars)} 4 dòng phụ (hook give)`);
  C.coreKeep=cc&&[cc.id,cc.stars,JSON.stringify(cc.stats)];
  // 5.2: hồn hạch vừa gắn (chưa lưu) cũng nằm trong transaction đi cổng; bagKey so cả võ hồn và ô đang gắn.
  { const before=new Set(C.bag.items.map(i=>i.id));
    for(let k=0;k<2;k++) await test(C,"give",{code:CORE_ITEM,stars:3,set:"tien_co"});
    const tcs=C.bag.items.filter(i=>!before.has(i.id)), at=[5,2];
    tcs.forEach((it,k)=>C.room.send("equipcore",{itemId:it.id,vohonId:C.owned.active,slot:at[k]}));
    ok(tcs.length===2&&await waitFor(()=>tcs.every((t,k)=>{ const i=C.bag.items.find(x=>x.id===t.id); return i?.vohon===C.owned.active&&i.stats?.slot===at[k]; })),
      "C gắn 2 hồn hạch Tiên Cơ vào ô 6 và ô 3 của võ hồn ra trận (trong làng, ngoài giao chiến)");
    C.coreEq={vohon:C.owned.active,slots:Object.fromEntries(tcs.map((t,k)=>[t.id,at[k]]))};
    // 5.3: nâng cấp hồn hạch đang gắn ngay trong làng rồi đi cổng: cấp, điểm và dòng phụ mới chưa lưu cũng nằm trong transaction
    // đi cổng, nguyên liệu không quay lại.
    const had=new Set(C.bag.items.map(i=>i.id));
    for(let k=0;k<2;k++) await test(C,"give",{code:CORE_ITEM,stars:3,set:"tien_co"});
    const cmat=C.bag.items.filter(i=>!had.has(i.id)).map(i=>i.id), cuLv=coreEnhanceLevel(2*coreFeedXp({set:"tien_co",stars:3},"tien_co"));
    { const n=C.bagMsgs??0; C.room.send("enhancecore",{targetId:tcs[0].id,materialIds:cmat}); await waitFor(()=>(C.bagMsgs??0)>n&&C.bag.items.find(i=>i.id===tcs[0].id)?.enhance===cuLv,2000); }
    const cu=C.bag.items.find(i=>i.id===tcs[0].id);
    ok(cmat.length===2&&cu?.enhance===cuLv&&cuLv===3&&cu.stats.subs.length===CORE_SUBS[2]+1&&cu.vohon===C.owned.active&&!C.bag.items.some(i=>cmat.includes(i.id)),
      `C nâng cấp hồn hạch Tiên Cơ đang gắn lên +${cu?.enhance} trong làng (${cu?.stats.subs.length} dòng phụ), 2 nguyên liệu đã mất`);
    C.coreUp=cu&&[cu.id,cu.enhance,sj(cu.stats)]; }
  // 4.2: hồn cốt vừa gắn (chưa lưu) cũng nằm trong transaction đi cổng; bagKey so cả võ hồn đang gắn.
  const cb=bonesOf(C).find(i=>i.years===32000&&i.vohon===null);
  C.room.send("equip",{itemId:cb.id,vohonId:C.owned.active});
  ok(await waitFor(()=>bonesOf(C).find(i=>i.id===cb.id)?.vohon===C.owned.active),"C gắn hồn cốt Tay phải vào võ hồn ra trận (trong làng, ngoài giao chiến)");
  // 4.4: cường hóa ngay trong làng (vùng an toàn, ngoài giao chiến) rồi đi cổng: cấp và điểm cường hóa chưa lưu cũng nằm trong
  // transaction đi cổng, nguyên liệu không quay lại.
  for(const y of [10000,10000]) await test(C,"give",{code:BONE_ITEM,years:y,beast:"am_kim_khung_trao_hung",slot:"tay_phai"});
  const cm=bonesOf(C).filter(i=>i.vohon===null&&i.years===10000).map(i=>i.id), cLv=boneEnhanceLevel(2*boneFeedXp({slot:"tay_phai",years:10000},"tay_phai"));
  { const n=C.bagMsgs??0; C.room.send("enhance",{targetId:cb.id,materialIds:cm}); await waitFor(()=>(C.bagMsgs??0)>n&&bonesOf(C).find(i=>i.id===cb.id)?.enhance===cLv,2000); }
  ok(bonesOf(C).find(i=>i.id===cb.id)?.enhance===cLv&&!bonesOf(C).some(i=>cm.includes(i.id)),`C cường hóa hồn cốt đang gắn lên +${cLv} trong làng, 2 nguyên liệu đã mất`);
  C.boneEq={id:cb.id,vohon:C.owned.active,atk:boneStats("tay_phai",32000,cLv).atk};
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
  if(C.coreKeep){ const it=C2.bag.items.find(i=>i.id===C.coreKeep[0]);
    ok(it&&same([it.id,it.stars,JSON.stringify(it.stats)],C.coreKeep),`đi cổng, thoát vào lại, đăng nhập lại: ${it&&coreName(it.stats?.set,it.stars)} còn nguyên chỉ số`); }
  if(C.coreUp){ const it=C2.bag.items.find(i=>i.id===C.coreUp[0]); // 5.3
    ok(it&&same([it.id,it.enhance,sj(it.stats)],C.coreUp),`đi cổng, thoát vào lại, đăng nhập lại: ${it&&coreName(it.stats?.set,it.stars,it.enhance)} còn nguyên cấp, điểm và ${it?.stats?.subs?.length} dòng phụ`); }
  if(C.coreEq){ // 5.2: qua 5 lần đi cổng, thoát vào lại, đăng nhập lại: hồn hạch vẫn gắn đúng ô, bộ Tiên Cơ 2 món vẫn có
    const sv=await test(C2,"stats",{rowId:C.coreEq.vohon});
    ok(sj(sv.slots)===sj(C.coreEq.slots)&&sv.sets.tien_co===2&&same(sv.fx,{energy:0.2}),`đi cổng, thoát vào lại, đăng nhập lại: 2 hồn hạch Tiên Cơ vẫn gắn ô ${Object.values(sv.slots).map(s=>s+1).join(", ")}`);
  }
  if(C.boneEq){ // 4.2: qua 5 lần đi cổng, thoát vào lại, đăng nhập lại: hồn cốt vẫn gắn, chỉ số vẫn cộng
    const sv=await test(C2,"stats",{rowId:C.boneEq.vohon});
    ok(C2.bag.items.find(i=>i.id===C.boneEq.id)?.vohon===C.boneEq.vohon&&sv.bones.atk===C.boneEq.atk,
      `đi cổng, thoát vào lại, đăng nhập lại: hồn cốt vẫn gắn, cường hóa +${C2.bag.items.find(i=>i.id===C.boneEq.id)?.enhance}, công +${sv.bones.atk}`);
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
await npcTown();
await questTest();
await arenaTest();
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
if((await test(C,"ping"))?.enabled) await partyTest(C);
await resonanceTest();
await C.room.leave();
console.log(fails?`✗ ${fails} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua");
process.exit(fails?1:0);

/**
 * 6.1 ở Nặc Đinh Thành: bảng giá (hàm thuần), mọi NPC của NPCS đặt đúng một chỗ trong Tiled, đứng xa bị từ chối; với hook: thương
 * nhân (mua đủ / thiếu Hồn Tệ, số lượng sai, túi đầy kể cả chỉ vừa một phần, bán hồn hoàn / hồn cốt / hồn hạch / mảnh đúng giá, không
 * bán đan / đồ đang gắn / id lạ, đứng xa), lò rèn (mở hộp thoại, cường hóa hồn cốt), Đại Sư, Đại Đấu Hồn Trường; vào lại còn nguyên.
 */
async function npcTown(){
  console.log("[6.1] NPC ở Nặc Đinh Thành: thương nhân, lò rèn, Đại Sư");
  const all=["thanh_hon_thon","nac_dinh_thanh"].flatMap(m=>JSON.parse(readFileSync(new URL(`../../shared/assets/${m}.json`,import.meta.url),"utf8"))
    .layers.flatMap(l=>l.objects??[]).filter(o=>o.type==="npc").map(o=>(o.properties??[]).find(q=>q.name==="npc")?.value));
  ok(all.every(id=>npcDef(id))&&NPCS.every(n=>all.filter(x=>x===n.id).length===1),`mỗi NPC trong NPCS đặt đúng một chỗ ở Thánh Hồn Thôn / Nặc Đinh Thành: ${all.join(", ")}`);
  ok(NPCS.every(n=>n.lines.length&&n.lines.every(t=>t.length>10)),"NPC nào cũng có lời thoại");
  // Bảng giá mua lại (chờ chốt): đúng mốc, tăng theo niên hạn / sao; hồn cốt gấp BONE_SELL lần, mỗi cấp cường hóa +10%; không mua đan, rương.
  ok(RING_SELL.every(([y,v])=>ringSellPrice(y)===v)&&[10,50,100,437,1000,5000,10000,50000,100000].every((y,i,a)=>!i||ringSellPrice(y)>=ringSellPrice(a[i-1])),
    `giá hồn hoàn: ${[10,100,437,1000,10000,100000].map(y=>`${y} năm ${ringSellPrice(y)}`).join(", ")} đồng`);
  const ring=y=>({code:RING_ITEM,years:y,stars:null,enhance:0});
  ok(sellPrice({code:BONE_ITEM,years:10000,stars:null,enhance:0})===Math.round(ringSellPrice(10000)*BONE_SELL)
    &&sellPrice({code:BONE_ITEM,years:10000,stars:null,enhance:5})===Math.round(ringSellPrice(10000)*BONE_SELL*(1+5*BONE_SELL_ENH)),"giá hồn cốt theo niên hạn và cấp cường hóa");
  ok(CORE_SELL.every((v,i)=>sellPrice({code:CORE_ITEM,years:null,stars:i+1,enhance:0})===v),`giá hồn hạch 1★…6★: ${CORE_SELL.join(" / ")} đồng`);
  ok(sellPrice({code:shardCode("hao_thien_chuy"),years:null,stars:null,enhance:0})===SHARD_SELL.UR&&sellPrice({code:shardCode("lam_ngan_thao"),years:null,stars:null,enhance:0})===SHARD_SELL[VOHON[vohonIndex("lam_ngan_thao")].rarity],
    "giá mảnh võ hồn theo độ hiếm");
  ok(sellPrice({code:"hoi_huyet_dan",years:null,stars:null,enhance:0})===null&&sellPrice({code:chestCode(BOSSES.find(b=>b.rank===2).id),years:null,stars:null,enhance:0})===null&&sellPrice({code:"khong_co",years:null,stars:null,enhance:0})===null&&sellPrice(ring(437))>0,
    "thương nhân không mua đan, rương, đồ lạ");
  ok(SHOP.every(r=>itemDef(r.code)?.kind==="dan"&&r.price>0)&&SHOP.some(r=>r.code==="hoi_huyet_dan")&&SHOP.some(r=>r.code==="hoi_hon_dan"),`thương nhân bán ${SHOP.map(r=>`${itemDef(r.code).name} ${formatHonTe(r.price)}`).join(", ")}`);
  const tn=npcSpot("nac_dinh_thanh","thuong_nhan"), lr=npcSpot("nac_dinh_thanh","lo_ren"), ds=npcSpot("nac_dinh_thanh","dai_su"), dt=npcSpot("nac_dinh_thanh","dau_hon_truong");
  ok(Math.hypot(tn.x-me().x,tn.y-me().y)>NPC_RANGE&&await talk(C,"thuong_nhan")===null&&/lại gần Thương nhân/.test(C.logs.at(-1)),"đứng ở cổng đông: thương nhân chưa nói chuyện");
  const bk0=bagKey(C);
  ok(/đứng cạnh thương nhân/.test(await trade(C,"buy",{code:"hoi_huyet_dan",qty:1}))&&bagKey(C)===bk0,"đứng xa thương nhân: mua bị từ chối, túi và Hồn Tệ không đổi");
  ok(/đứng cạnh thương nhân/.test(await trade(C,"sell",{id:looseOf(C)[0]?.id}))&&bagKey(C)===bk0,"đứng xa thương nhân: bán bị từ chối");
  ok(await talk(C,"to_van_dao")===null&&/Không có NPC này/.test(C.logs.at(-1)),"Tố Vân Đào không ở Nặc Đinh Thành: bị từ chối");
  if(!(await test(C,"ping"))?.enabled){ console.log("  ⚠ bỏ qua mua / bán / lò rèn (cần hook goto, give, coin): bật server bằng GAME_TEST=1"); return; }
  await test(C,"goto",{x:tn.x,y:tn.y+16});
  ok(await talk(C,"thuong_nhan")==="thuong_nhan","đứng cạnh thương nhân: mở hộp thoại cửa hàng");
  // Dọn túi về trạng thái biết trước (hồn cốt đang gắn không nằm trong ô túi nên vẫn giữ).
  for(const it of looseOf(C)) C.room.send("discard",{id:it.id});
  ok(await waitFor(()=>looseOf(C).length===0,3000),`dọn túi: ${looseOf(C).length} ô`);
  const [hh,hn]=["hoi_huyet_dan","hoi_hon_dan"].map(c=>SHOP.find(r=>r.code===c)), stack=itemDef(hh.code).stack;
  await test(C,"coin",{n:0});
  let t=await trade(C,"buy",{code:hh.code,qty:1});
  ok(/Không đủ Hồn Tệ/.test(t)&&C.bag.honTe===0&&looseOf(C).length===0,`0 đồng: mua 1 Hồi Huyết Đan bị từ chối (${t})`);
  await test(C,"coin",{n:hh.price*3+hn.price-1});
  t=await trade(C,"buy",{code:hh.code,qty:3});
  ok(qtyOf(C,hh.code)===3&&C.bag.honTe===hn.price-1&&/Mua 3 Hồi Huyết Đan/.test(t),`đủ tiền: mua 3 Hồi Huyết Đan, trừ ${formatHonTe(hh.price*3)}, còn ${formatHonTe(C.bag.honTe)} (${t})`);
  t=await trade(C,"buy",{code:hn.code,qty:1});
  ok(/Không đủ Hồn Tệ/.test(t)&&qtyOf(C,hn.code)===0&&C.bag.honTe===hn.price-1,`thiếu đúng 1 đồng: không mua được Hồi Hồn Đan, không mất tiền (${t})`);
  await test(C,"coin",{n:1e9});
  for(const [m,why] of [[{code:hh.code,qty:0},"0 món"],[{code:hh.code,qty:SHOP_MAX_QTY+1},`${SHOP_MAX_QTY+1} món`],[{code:hh.code,qty:1.5},"1,5 món"],[{code:hh.code,qty:"2"},"số dạng chữ"],
    [{code:RING_ITEM,qty:1},"hồn hoàn (không bán)"],[{code:"khong_co",qty:1},"mã lạ"],[{qty:1},"thiếu mã"]]){
    const bk=bagKey(C); t=await trade(C,"buy",m); ok(bagKey(C)===bk&&/Mỗi lần mua|không bán món này/.test(t),`mua ${why}: bị từ chối (${t})`);
  }
  // Túi đầy: 39 ô Hồi Hồn Đan + ô Hồi Huyết Đan còn chỗ cho stack − 3 viên. Mua vừa đúng chỗ còn lại thì được, hơn 1 viên thì từ chối hết.
  await test(C,"give",{code:hn.code,qty:BAG_SLOTS*stack});
  ok(looseOf(C).length===BAG_SLOTS,`túi đầy ${looseOf(C).length}/${BAG_SLOTS} ô`);
  let ht=C.bag.honTe; t=await trade(C,"buy",{code:hh.code,qty:stack-3+1});
  ok(/không đủ chỗ/.test(t)&&qtyOf(C,hh.code)===3&&C.bag.honTe===ht,`túi đầy, mua ${stack-2} viên (chỉ còn chỗ ${stack-3}): từ chối hết, không mất tiền (${t})`);
  t=await trade(C,"buy",{code:hh.code,qty:stack-3});
  ok(qtyOf(C,hh.code)===stack&&C.bag.honTe===ht-hh.price*(stack-3)&&looseOf(C).length===BAG_SLOTS,`túi đầy vẫn mua vừa ô Hồi Huyết Đan chưa đầy: ${stack-3} viên (${t})`);
  t=await trade(C,"buy",{code:hh.code,qty:1}); ok(/không đủ chỗ/.test(t)&&qtyOf(C,hh.code)===stack,`túi đầy hẳn: không mua được nữa (${t})`);
  // Bán đồ dư: bỏ 5 ô Hồi Hồn Đan lấy chỗ, nhận hồn hoàn / hồn cốt / hồn hạch / mảnh (hook give), bán từng món đúng giá.
  for(const it of looseOf(C).filter(i=>i.code===hn.code).slice(0,5)) C.room.send("discard",{id:it.id});
  ok(await waitFor(()=>looseOf(C).length===BAG_SLOTS-5,2000),"bỏ 5 ô Hồi Hồn Đan để có chỗ");
  await test(C,"give",{code:RING_ITEM,years:1760}); await test(C,"give",{code:BONE_ITEM,years:12000,beast:"thiet_giap_te_nguu",slot:"than"});
  await test(C,"give",{code:CORE_ITEM,stars:4,set:"hao_thien"}); await test(C,"give",{code:shardCode("hao_thien_chuy"),qty:5});
  const rg=looseOf(C).find(i=>i.code===RING_ITEM&&i.years===1760), bn=looseOf(C).find(i=>i.code===BONE_ITEM&&i.years===12000), cr=looseOf(C).find(i=>i.code===CORE_ITEM&&i.stars===4), sh=looseOf(C).find(i=>i.code===shardCode("hao_thien_chuy"));
  ok(rg&&bn&&cr&&sh?.qty===5,"có hồn hoàn 1.760 năm, hồn cốt Thân 12.000 năm, hồn hạch 4★, 5 mảnh Hạo Thiên Chùy");
  for(const [it,qty,name] of [[rg,undefined,"hồn hoàn 1.760 năm"],[bn,undefined,"hồn cốt 12.000 năm"],[cr,undefined,"hồn hạch 4★"],[sh,2,"2 mảnh Hạo Thiên Chùy"]]){
    ht=C.bag.honTe; const price=sellPrice(it)*(qty??1);
    t=await trade(C,"sell",qty?{id:it.id,qty}:{id:it.id});
    const left=C.bag.items.find(i=>i.id===it.id);
    ok(C.bag.honTe===ht+price&&(qty?left?.qty===it.qty-qty:!left)&&/^Bán /.test(t),`bán ${name}: +${formatHonTe(price)}${qty?`, còn ${left?.qty} mảnh`:""} (${t})`);
  }
  for(const [m,re,why] of [[{id:sh.id,qty:4},/Số lượng bán/,"4 mảnh khi chỉ còn 3"],[{id:sh.id,qty:0},/Số lượng bán/,"0 món"],[{id:looseOf(C).find(i=>i.code===hh.code).id},/không mua/,"Hồi Huyết Đan"],
    [{id:"khong-co"},/Không có vật phẩm/,"id lạ"],[{id:7},/Không có vật phẩm/,"id dạng số"]]){
    const bk=bagKey(C); t=await trade(C,"sell",m); ok(bagKey(C)===bk&&re.test(t),`bán ${why}: bị từ chối (${t})`);
  }
  const worn=(C.bag?.items??[]).find(i=>i.vohon!==null);
  if(worn){ const bk=bagKey(C); t=await trade(C,"sell",{id:worn.id}); ok(bagKey(C)===bk&&/đang gắn trên võ hồn/.test(t),`hồn cốt đang gắn không bán được (${t})`); }
  else ok(false,"C còn hồn cốt đang gắn để thử bán");
  // Bấm dồn dập: 3 lần bán liền (mỗi lần 1 mảnh) đều được tính, lưu chỉ xếp một lần trong chuỗi lưu.
  ht=C.bag.honTe; for(let k=0;k<3;k++) C.room.send("sell",{id:sh.id,qty:1});
  ok(await waitFor(()=>!C.bag.items.some(i=>i.id===sh.id)&&C.bag.honTe===ht+3*sellPrice(sh),2000),`bán liền 3 lần: hết mảnh, +${formatHonTe(3*sellPrice(sh))}`);
  // Đứng xa thương nhân (sang quảng trường) thì bán bị từ chối.
  await test(C,"goto",{x:30*16,y:20*16});
  { const it=looseOf(C)[0], bk=bagKey(C); t=await trade(C,"sell",{id:it.id}); ok(bagKey(C)===bk&&/đứng cạnh thương nhân/.test(t),`đi ra quảng trường: bán bị từ chối (${t})`); }
  // Lò rèn: mở hộp thoại, cường hóa hồn cốt trong túi bằng 2 hồn cốt dư (message enhance của 4.4).
  await test(C,"goto",{x:lr.x,y:lr.y+16});
  ok(await talk(C,"lo_ren")==="lo_ren","đứng cạnh Thợ rèn: mở hộp thoại lò rèn");
  for(const it of looseOf(C).filter(i=>i.code===hn.code).slice(0,3)) C.room.send("discard",{id:it.id});
  await waitFor(()=>looseOf(C).filter(i=>i.code===hn.code).length<=BAG_SLOTS-9,2000);
  for(let k=0;k<3;k++) await test(C,"give",{code:BONE_ITEM,years:1000,beast:"am_kim_khung_trao_hung",slot:"tay_trai"});
  const [tg,...mats]=looseOf(C).filter(i=>i.code===BONE_ITEM&&i.years===1000).map(i=>i.id), lv=boneEnhanceLevel(2*boneFeedXp({slot:"tay_trai",years:1000},"tay_trai"));
  { const n=C.bagMsgs??0; C.enh=null; C.room.send("enhance",{targetId:tg,materialIds:mats}); await waitFor(()=>(C.bagMsgs??0)>n&&C.enh,2000); }
  ok(C.enh?.to===lv&&C.bag.items.find(i=>i.id===tg)?.enhance===lv&&!mats.some(id=>C.bag.items.some(i=>i.id===id)),`lò rèn: cường hóa hồn cốt Tay trái 1.000 năm lên +${lv}, 2 nguyên liệu đã mất`);
  // 5.3: lò rèn cũng nâng cấp hồn hạch (message enhancecore): 1 hồn hạch Lam Ngân 2★ + 2 nguyên liệu 3★ cùng bộ.
  { const had=new Set(C.bag.items.map(i=>i.id));
    await test(C,"give",{code:CORE_ITEM,stars:2,set:"lam_ngan"}); for(let k=0;k<2;k++) await test(C,"give",{code:CORE_ITEM,stars:3,set:"lam_ngan"});
    const fresh=C.bag.items.filter(i=>!had.has(i.id)), ct=fresh.find(i=>i.stars===2), cm=fresh.filter(i=>i.stars===3).map(i=>i.id);
    const cl=coreEnhanceLevel(2*coreFeedXp({set:"lam_ngan",stars:3},"lam_ngan"));
    const n=C.bagMsgs??0; C.coreUp=null; C.room.send("enhancecore",{targetId:ct?.id,materialIds:cm}); await waitFor(()=>(C.bagMsgs??0)>n&&C.coreUp,2000);
    const cu=C.bag.items.find(i=>i.id===ct?.id);
    ok(ct&&cm.length===2&&C.coreUp?.to===cl&&cu?.enhance===cl&&cu.stats.subs.length===CORE_SUBS[1]+1&&!cm.some(id=>C.bag.items.some(i=>i.id===id)),
      `lò rèn: nâng cấp hồn hạch Lam Ngân 2★ lên +${cu?.enhance} (${cu?.stats.subs.length} dòng phụ), 2 nguyên liệu đã mất`); }
  // Đại Sư và Đại Đấu Hồn Trường: chỉ có lời thoại (nhiệm vụ ở 6.2); đứng cạnh Thợ rèn thì Đại Sư ở xa.
  ok(await talk(C,"dai_su")===null&&/lại gần Ngọc Tiểu Cương/.test(C.logs.at(-1)),"đứng ở lò rèn: Đại Sư ở xa, chưa nói chuyện");
  await test(C,"goto",{x:ds.x,y:ds.y+16}); ok(await talk(C,"dai_su")==="dai_su","đứng cạnh Ngọc Tiểu Cương (Đại Sư): mở hộp thoại");
  ok(npcDef("dai_su").lines.some(t=>t.includes(formatYears(ringLimit(1)))&&t.includes(formatYears(ringLimit(4)))),"Đại Sư giải thích giới hạn hồn hoàn theo vòng (RING_LIMIT)");
  await test(C,"goto",{x:dt.x,y:dt.y+16}); ok(await talk(C,"dau_hon_truong")==="dau_hon_truong","Đại Đấu Hồn Trường (sắp mở): có lời giới thiệu");
  // Vào lại: Hồn Tệ và túi sau mua / bán / cường hóa đã lưu.
  const bk=bagKey(C); await C.room.leave(); await sleep(400);
  await enter(C); await waitFor(()=>me()&&C.bag);
  ok(bagKey(C)===bk,`vào lại: túi và Hồn Tệ sau mua / bán đã lưu (${formatHonTe(C.bag?.honTe??0)}, ${looseOf(C).length} ô)`);
}

/**
 * 7.1: tổ đội người chơi. 5 bot mới ở Thánh Hồn Thôn (P1–P5) và bot C (đang ở bản đồ khác). Hàm thuần partyXpShare; mời theo tên /
 * theo sid (bấm vào hồn sư), từ chối, mời lại cùng người, mời quá nhanh, đủ 4 người, người đã có đội; chia kinh nghiệm: 2 người trong
 * 300 pixel (+5%), người ngoài bán kính và người khác bản đồ không nhận, 3 người, giảm chênh cấp theo từng người, 40/20 cho võ hồn
 * không ra trận, một mình; ưu tiên nhặt hồn hoàn / hồn cốt / hồn hạch cho cả tổ đội, người ngoài đội không nhặt được; trưởng nhóm rời
 * thì chuyển, đuổi, nhường, còn 1 người thì giải tán; rời game quá PARTY_OFFLINE_SECS giây thì ra khỏi đội.
 */
async function partyTest(C){
  console.log("[7.1] tổ đội người chơi: mời, chia kinh nghiệm, ưu tiên nhặt, rời / đuổi / chuyển trưởng nhóm");
  ok(partyXpShare(1)===1&&Math.abs(partyXpShare(2)-0.525)<1e-9&&Math.abs(partyXpShare(3)-1.1/3)<1e-9&&Math.abs(partyXpShare(4)-0.2875)<1e-9&&PARTY_MAX===4,
    "partyXpShare: 1 người 100%, 2 người 52,5%, 3 người 36,7%, 4 người 28,75% (tổng +5% mỗi người thêm)");
  const P=[];
  for(let i=1;i<=5;i++) P.push(await bot(`Đội ${i}`,"bich_lan_xa_hoang",{sex:i%2,hair:i%4,hairCol:i,outfitCol:i%6}));
  const [P1,P2,P3,P4,P5]=P, meP=b=>b.room.state.players.get(b.room.sessionId);
  await waitFor(()=>P.every(b=>b.party&&meP(b)&&b.owned),3000);
  ok(P.every(b=>b.party?.id===0&&b.party.members.length===0),"chưa có tổ đội: khung tổ đội trống");
  /** Gửi `party {op, …}` từ `b`; chờ khung tổ đội của `w` (mặc định chính `b`) đổi hoặc `b` nhận một dòng log. Trả các dòng log mới. */
  async function pact(b,op,extra={},w=b){ const n=w.partyMsgs, l=b.logs.length; b.room.send("party",{op,...extra}); await waitFor(()=>w.partyMsgs>n||b.logs.length>l,2000); await sleep(120); return b.logs.slice(l).join(" | "); }
  const names=b=>(b.party?.members??[]).map(m=>m.name);
  // ---- mời, từ chối, chống spam ----
  let r=await pact(P1,"invite",{name:P2.name},P2);
  ok(P2.party?.invites.some(i=>i.name===P1.name&&i.secs>0&&i.secs<=PARTY_INVITE_SECS)&&/mời bạn vào tổ đội/.test(P2.logs.join(" ")),`P2 nhận lời mời của P1 (${r})`);
  await pact(P2,"accept",{name:P1.name}); await waitFor(()=>P1.party?.members.length===2);
  ok(P1.party?.id>0&&P1.party.id===P2.party?.id&&same(names(P1),[P1.name,P2.name])&&P1.party.members[0].leader&&P2.party.invites.length===0,
    `P2 vào đội: ${names(P1).join(", ")}, P1 trưởng nhóm`);
  ok(P1.party.members.find(m=>m.name===P2.name)?.sid===P2.room.sessionId,"thành viên cùng phòng có sid (đánh dấu trên bản đồ nhỏ)");
  r=await pact(P1,"invite",{sid:P3.room.sessionId},P3); // bấm vào hồn sư cùng phòng
  ok(P3.party?.invites.some(i=>i.name===P1.name),`mời bằng cách bấm vào hồn sư (sid): ${r}`);
  await pact(P1,"invite",{name:P4.name},P4);
  await pact(P4,"decline",{name:P1.name},P1);
  ok(P4.party?.invites.length===0&&/từ chối lời mời/.test(P1.logs.join(" ")),"P4 từ chối: P1 được báo");
  r=await pact(P1,"invite",{name:P4.name}); ok(/Vừa mời người này rồi/.test(r),`mời lại ngay người vừa từ chối: ${r}`);
  r=await pact(P1,"invite",{name:C.name}); ok(/mời quá nhanh/.test(r),`mời liền 4 lần: bị chặn như chat (${r})`);
  r=await pact(P1,"invite",{name:"Không Có "+RUN}); ok(/Không có hồn sư nào/.test(r),`mời tên không có trong game: ${r}`);
  r=await pact(P1,"invite",{name:P1.name}); ok(/tự mời/.test(r),"không tự mời chính mình");
  await test(P1,"party",{pop:"rlreset"});
  await pact(P3,"accept",{name:P1.name}); await waitFor(()=>P1.party?.members.length===3);
  await pact(P1,"invite",{name:C.name},C); await pact(C,"accept",{name:P1.name}); await waitFor(()=>P1.party?.members.length===4);
  ok(P1.party?.members.length===4&&C.party?.id===P1.party.id,`4 người: ${names(P1).join(", ")}`);
  const cRow=P1.party.members.find(m=>m.name===C.name);
  ok(cRow&&!cRow.sid&&cRow.map===C.room.state.mapId&&!cRow.off,`thành viên ở bản đồ khác: không có sid, ghi bản đồ ${cRow?.map}`);
  await sleep(700); // khung tổ đội cập nhật sinh lực mỗi 0,5 giây
  ok(P1.party.members.every(m=>m.maxHp>0&&m.level>0),"khung tổ đội có cấp và sinh lực võ hồn ra trận của mọi thành viên");
  r=await pact(P1,"invite",{name:P5.name}); ok(/đủ 4 người/.test(r)&&!(P5.party?.invites.length),`mời người thứ 5: ${r}`);
  r=await pact(P5,"invite",{name:P2.name}); ok(/tổ đội khác/.test(r),`mời người đã có đội: ${r}`);
  r=await pact(P4,"accept",{name:P1.name}); ok(/không còn hiệu lực/.test(r),`chấp nhận lời mời đã từ chối: ${r}`);
  r=await pact(P2,"kick",{name:P3.name}); ok(/Chỉ trưởng nhóm/.test(r),`thành viên không đuổi được: ${r}`);
  // ---- chia kinh nghiệm ----
  const Y=400, X0=beastStats(Y).xp, LV=8;
  /** Đưa bot tới (x, y) nếu đứng được (hook goto). */
  const place=async(b,x,y)=>{ await test(b,"goto",{x,y}); return Math.hypot(meP(b).x-x,meP(b).y-y)<1; };
  /** Tìm chỗ đứng được cách (x0, y0) khoảng `d` pixel và đưa bot tới. */
  async function near(b,x0,y0,d){
    for(let a=0;a<16;a++){ const t=a*Math.PI/8; for(const k of [1,1.1,0.9,1.2]){ const x=x0+Math.cos(t)*d*k, y=y0+Math.sin(t)*d*k; if(!blocked(x,y)&&await place(b,x,y)) return true; } }
    return false;
  }
  const bx=meP(P1).x, by=meP(P1).y;
  ok(await near(P2,bx,by,40)&&await near(P3,bx,by,PARTY_XP_RANGE+80),`P2 cách P1 khoảng 40 pixel, P3 ngoài ${PARTY_XP_RANGE} pixel`);
  const benchOf=b=>b.owned.list.find(v=>v.rowId!==b.owned.active&&b.owned.team.includes(v.rowId));
  /** Đặt võ hồn ra trận cấp `lv` (kèm đủ hồn hoàn để không bình cảnh), võ hồn còn lại trong đội cấp LV, kinh nghiệm 0. */
  async function reset(b,lv=LV){
    const bn=benchOf(b);
    await test(b,"set",{rowId:b.owned.active,level:lv,xp:0,rings:Array(Math.floor(lv/10)).fill(Y)});
    if(bn) await test(b,"set",{rowId:bn.rowId,level:LV,xp:0,rings:[]});
  }
  const xpNow=b=>({a:meP(b).xp,b:benchOf(b)?.xp??0});
  /** P1 hạ một hồn thú Y năm ngay dưới chân (hook beast + slay, qua đúng killBeast); trả kinh nghiệm từng bot sau đó. */
  async function killY(list){
    for(const b of list) await reset(b,b.lv??LV);
    await test(P1,"clear"); await test(P1,"beast",{years:Y}); const k=await test(P1,"slay");
    await sleep(250); for(const b of list){ const n=b.ownedMsgs; b.room.send("vohons"); await waitFor(()=>b.ownedMsgs>n); }
    return { k, got:list.map(b=>xpNow(b)) };
  }
  const exp=(n,lv,share=XP_SHARE_ACTIVE)=>Math.round(X0*partyXpShare(n)*xpLevelScale(lv,beastLevel(Y))*share);
  ok(exp(1,LV)<xpNeed(LV)&&beastLevel(Y)>LV-10,`thử với hồn thú ${formatYears(Y)} (${X0} kinh nghiệm gốc), võ hồn cấp ${LV}: không lên cấp, không giảm chênh cấp`);
  let kk=await killY([P1,P2,P3,C]);
  const [g1,g2,g3,gc]=kk.got;
  ok(kk.k?.bid&&g1.a===exp(2,LV)&&g2.a===exp(2,LV),`2 người trong ${PARTY_XP_RANGE} pixel: mỗi người ${g1.a}/${g2.a} = ${X0} × 52,5% × 40% (một mình ${exp(1,LV)})`);
  ok(g1.b===exp(2,LV,XP_SHARE_BENCH)&&g2.b===exp(2,LV,XP_SHARE_BENCH),`võ hồn không ra trận mỗi người nhận 20%: ${g1.b}/${g2.b}`);
  ok(g3.a===0&&g3.b===0,`P3 ngoài ${PARTY_XP_RANGE} pixel không nhận (${g3.a})`);
  ok(gc.a===0&&gc.b===0,`C ở ${MAPS[C.room.state.mapId].name} (khác bản đồ) không nhận (${gc.a})`);
  ok(/Tổ đội 2 người chia kinh nghiệm/.test(P2.logs.join(" ")),"đồng đội được báo phần chia kinh nghiệm");
  // 3 người, P2 cao hơn hồn thú 15 cấp: giảm 50% riêng phần của P2.
  ok(await near(P3,bx,by,60),"P3 vào trong bán kính");
  P2.lv=25; kk=await killY([P1,P2,P3]); P2.lv=LV;
  ok(kk.got[0].a===exp(3,LV)&&kk.got[2].a===exp(3,LV)&&kk.got[1].a===exp(3,25),
    `3 người: ${kk.got.map(x=>x.a).join("/")}; P2 cấp 25 giảm 50% theo chênh cấp của riêng mình (${exp(3,25)})`);
  // ---- nhiệm vụ 6.2: hạ hồn thú cùng đội tính cho đồng đội được chia kinh nghiệm ----
  { const zone=tiled.layers.flatMap(l=>l.objects??[]).find(o=>o.type==="zone"&&o.name===questChain(QUEST_STARTER).steps[1].goals[0].zone);
    const step=questChain(QUEST_STARTER).steps.findIndex(s=>s.goals.some(g=>g.k==="kill"&&g.map===st.mapId));
    const zx=zone.x+zone.width/2, zy=zone.y+zone.height/2;
    ok(step>=0&&(await place(P1,zx,zy)||await near(P1,zx,zy,20)),`P1 ở ${zone.name} (bài ${step+1} cần hạ hồn thú ở đây)`);
    const placed=await near(P2,meP(P1).x,meP(P1).y,30)&&await near(P3,meP(P1).x,meP(P1).y,PARTY_XP_RANGE+80);
    const far=Math.hypot(meP(P3).x-meP(P1).x,meP(P3).y-meP(P1).y);
    ok(placed&&far>PARTY_XP_RANGE,`P2 đứng cạnh P1, P3 cách ${Math.round(far)} pixel (ngoài bán kính)`);
    for(const b of [P1,P2,P3]) await test(b,"quest",{step,accepted:true,prog:[0]});
    await test(P1,"clear"); await test(P1,"beast",{years:Y}); await test(P1,"slay");
    const pq=await Promise.all([P1,P2,P3].map(b=>test(b,"quest")));
    ok(same(pq.map(q=>q.quest.prog[0]),[1,1,0]),`nhiệm vụ "${questChain(QUEST_STARTER).steps[step].name}": người hạ +1, đồng đội trong bán kính +1, đồng đội ngoài bán kính 0 (${pq.map(q=>q.quest.prog[0]).join("/")})`);
    for(const b of [P1,P2,P3]) await test(b,"quest",{step:0,accepted:false,prog:[]});
    await place(P1,bx,by); await near(P2,bx,by,40); }
  // ---- ưu tiên nhặt cho cả tổ đội ----
  await test(P1,"core",{r:0,stars:2}); await test(P1,"bone",{r:0});
  await test(P1,"clear"); await test(P1,"beast",{years:1200}); const kd=await test(P1,"slay");
  await test(P1,"core",{r:100}); await test(P1,"bone",{r:-1});
  await sleep(200);
  const drops=[]; P2.room.state.drops.forEach((d,id)=>{ if(Math.hypot(d.x-kd.x,d.y-kd.y)<30&&d.owner===P1.room.sessionId&&d.years===kd.years) drops.push({id,item:d.item,party:d.party}); });
  ok(drops.length===3&&drops.every(d=>d.party===P1.party.id),`hồn hoàn, hồn cốt, hồn hạch rơi ưu tiên P1 kèm tổ đội ${P1.party.id} (${drops.map(d=>d.item||"hồn hoàn").join(", ")})`);
  ok(await near(P4,kd.x,kd.y,4),"P4 (ngoài đội) đứng cạnh đồ rơi");
  { const l=P4.logs.length; P4.room.send("pickup"); await waitFor(()=>P4.logs.length>l); ok(/thuộc về tổ đội của người hạ/.test(P4.logs.at(-1)),`P4 ngoài đội không nhặt được: ${P4.logs.at(-1)}`); }
  ok(await near(P2,kd.x,kd.y,4),"P2 (đồng đội) đứng cạnh đồ rơi");
  let picked=0; // hồn hoàn 400 năm của các lần hạ ở trên cũng nằm đây (cùng ưu tiên tổ đội): nhặt hết
  for(let i=0;i<drops.length+3;i++){ const n=P2.bagMsgs??0; P2.room.send("pickup"); if(await waitFor(()=>(P2.bagMsgs??0)>n,1500)) picked++; await sleep(100); }
  const has=c=>looseOf(P2).some(i=>i.code===c&&(c===CORE_ITEM||i.years===1200));
  ok(picked>=drops.length&&has(RING_ITEM)&&has(BONE_ITEM)&&has(CORE_ITEM),`P2 nhặt được cả ${picked} món của P1 trong 15 giây đầu (hồn hoàn, hồn cốt, hồn hạch)`);
  // ---- trưởng nhóm rời thì chuyển, đuổi, nhường, giải tán ----
  await pact(P1,"leave",{},P2); await waitFor(()=>P2.party?.members.length===3);
  ok(P1.party?.id===0&&P2.party?.members.find(m=>m.leader)?.name===P2.name&&/trở thành trưởng nhóm/.test(P2.logs.join(" ")),
    `trưởng nhóm P1 rời: P2 thành trưởng nhóm (${names(P2).join(", ")})`);
  { // P1 giờ một mình: so +5% (2 người nhận tổng 105% của một mình).
    const l=P1.logs.length, solo=await killY([P1]);
    ok(solo.got[0].a===exp(1,LV)&&Math.abs(2*exp(2,LV)-1.05*exp(1,LV))<=1,`một mình nhận ${solo.got[0].a}; 2 người cùng chia tổng ${2*exp(2,LV)} ≈ 105%`);
    ok(!/Tổ đội/.test(P1.logs.slice(l).join(" ")),"không còn tổ đội: không chia kinh nghiệm");
  }
  await pact(P2,"kick",{name:P3.name},P3); await waitFor(()=>P3.party?.id===0);
  ok(P3.party?.id===0&&/mời ra khỏi tổ đội/.test(P3.logs.join(" "))&&same(names(P2),[P2.name,C.name]),`trưởng nhóm đuổi P3: còn ${names(P2).join(", ")}`);
  await pact(P2,"lead",{name:C.name},C); await waitFor(()=>C.party?.members.find(m=>m.leader)?.name===C.name);
  ok(C.party?.members.find(m=>m.leader)?.name===C.name,"nhường trưởng nhóm cho C (ở bản đồ khác)");
  await pact(C,"leave",{},P2); await waitFor(()=>P2.party?.id===0);
  ok(P2.party?.id===0&&C.party?.id===0&&/giải tán/.test(P2.logs.join(" ")),"còn 1 người: tổ đội giải tán");
  // ---- rời game quá lâu ----
  await pact(P4,"invite",{name:P5.name},P5); await pact(P5,"accept",{name:P4.name}); await waitFor(()=>P4.party?.members.length===2);
  await P5.room.leave(); await waitFor(()=>P4.party?.members.find(m=>m.name===P5.name)?.off,2000);
  ok(P4.party?.members.find(m=>m.name===P5.name)?.off===true,"P5 rời game: vẫn trong đội, khung ghi đã rời");
  const ag=await test(P4,"party",{pop:"age",name:P5.name,s:PARTY_OFFLINE_SECS}); await waitFor(()=>P4.party?.id===0,2000);
  ok(ag?.aged&&P4.party?.id===0&&/rời game quá lâu/.test(P4.logs.join(" ")),`quá ${PARTY_OFFLINE_SECS} giây không vào lại: ra khỏi đội, tổ đội giải tán`);
  for(const b of [P1,P2,P3,P4]) await b.room.leave();
}

/**
 * 6.2: chuỗi tân thủ của Ngọc Tiểu Cương. Dữ liệu (QUESTS: số bài, mục tiêu, NPC / vùng / bản đồ có thật, phần thưởng hợp lệ,
 * parseQuest kẹp dữ liệu hỏng); tài khoản mới D bắt đầu ở bài 1, ở Thánh Hồn Thôn không nhận được. Với hook: D sang Nặc Đinh Thành
 * (hook warp đi qua đúng transaction đi cổng), đi hết 7 bài: mục tiêu chỉ đếm sau khi nhận, đếm theo sự kiện thật (nói chuyện, hạ hồn
 * thú đúng vùng / bản đồ, đổi tay khi đang giao chiến, tiên cơ, hấp thụ trong giới hạn, gắn hồn hạch, vào Ngoại vi); nhận / trả khi
 * đứng xa, chưa xong, chưa nhận đều bị từ chối; thưởng đúng Hồn Tệ và vật phẩm; túi đầy thì không trả được; mục tiêu đã đạt sẵn tính
 * xong ngay khi nhận (tài khoản cũ); đi cổng, thoát vào lại giữ tiến độ.
 */
async function questTest(){
  console.log("[6.2] Nhiệm vụ: chuỗi tân thủ của Ngọc Tiểu Cương");
  const ch=questChain(QUEST_STARTER), mapObjs=id=>JSON.parse(readFileSync(new URL(`../../shared/assets/${id}.json`,import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[]);
  ok(ch&&ch.steps.length>=6&&ch.steps.length<=10&&npcSpot(ch.map,ch.giver),`chuỗi "${ch?.name}": ${ch?.steps.length} bài, ${npcDef(ch?.giver)?.name} ở ${MAPS[ch?.map]?.name}`);
  ok(new Set(ch.steps.map(s=>s.id)).size===ch.steps.length&&ch.steps.every(s=>s.offer.length&&s.done.length&&s.goals.length&&s.goals.every(g=>Number.isInteger(g.n)&&g.n>0&&g.text)
    &&s.reward.honTe>=0&&(s.reward.honTe>0||s.reward.items.length)&&s.reward.items.every(r=>itemDef(r.code)&&r.qty>0)),"mỗi bài có lời giao, lời trả, mục tiêu và phần thưởng hợp lệ");
  ok(ch.steps.every(s=>s.goals.every(g=>(!g.map||MAPS[g.map])&&(!g.npc||Object.keys(MAPS).some(m=>npcSpot(m,g.npc)))
    &&(!g.zone||mapObjs(g.map).some(o=>o.type==="zone"&&o.name===g.zone)))),"mục tiêu trỏ tới NPC, bản đồ, vùng săn có thật");
  ok(same(parseQuest({step:99,accepted:true,prog:[5]},QUEST_STARTER),{chain:QUEST_STARTER,step:ch.steps.length,accepted:false,prog:[]})
    &&same(parseQuest({step:1,accepted:true,prog:[99]},QUEST_STARTER).prog,[ch.steps[1].goals[0].n])&&same(parseQuest({step:2,accepted:true,prog:["x",-3]},QUEST_STARTER).prog,[0,0])
    &&same(parseQuest(null,QUEST_STARTER),questStart(QUEST_STARTER))&&questStatus(parseQuest({step:ch.steps.length},QUEST_STARTER))==="done","parseQuest kẹp bước, số đếm, dữ liệu hỏng");
  const D=await bot("Đệ tử "+Date.now().toString(36).slice(-5),"u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  const dme=()=>D.room.state.players?.get(D.room.sessionId);
  /** Gửi `quest {op}`; server luôn trả tin "quest" (kèm log khi nhận / trả / từ chối). Trả dòng log cuối của lần này. */
  async function qop(op){ const n=D.questMsgs, l=D.logs.length; D.room.send("quest",{op}); await waitFor(()=>D.questMsgs>n,1500); await sleep(60); return D.logs.slice(l).at(-1)??""; }
  ok(await waitFor(()=>D.quest,2000)&&D.quest.chain===QUEST_STARTER&&D.quest.step===0&&!D.quest.accepted&&D.quest.status==="offer",`tài khoản mới: bài 1 chưa nhận (${JSON.stringify(D.quest)})`);
  let t=await qop("accept"); ok(/không ở đây/.test(t)&&!D.quest.accepted,`ở Thánh Hồn Thôn: không nhận được nhiệm vụ (${t})`);
  t=await qop("lung_tung"); ok(/không hợp lệ/.test(t),`thao tác lạ bị từ chối (${t})`);
  if(!(await test(D,"ping"))?.enabled){ console.log("  ⚠ bỏ qua đi hết chuỗi (cần hook warp, goto, beast, give…): bật server bằng GAME_TEST=1"); await D.room.leave(); return; }
  /** Hook warp: sang `mapId` tại (x, y) qua transaction đi cổng, rồi rời phòng và vào phòng mới như đi cổng thật. */
  async function warp(mapId,x,y){
    const q0=JSON.stringify([D.quest.step,D.quest.accepted,D.quest.prog]), bk=bagKey(D);
    D.travel=null; D.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>D.travel?.mapId===mapId,4000),`warp -> ${mapId}`);
    await D.room.leave(); await sleep(300); D.mapId=(await post("/api/me",{token:D.token})).mapId; await enter(D);
    await waitFor(()=>dme()&&D.bag&&D.quest,3000);
    ok(D.room.state.mapId===mapId&&bagKey(D)===bk&&(JSON.stringify([D.quest.step,D.quest.accepted,D.quest.prog])===q0||D.quest.status==="active"||D.quest.status==="ready"),
      `vào ${MAPS[mapId].name}: túi đồ và tiến độ nhiệm vụ qua transaction đi cổng (${JSON.stringify(D.quest.prog)})`);
  }
  const ds=npcSpot(ch.map,ch.giver), atGiver=()=>test(D,"goto",{x:ds.x,y:ds.y+16}), go=(id)=>{ const sp=npcSpot(ch.map,id); return test(D,"goto",{x:sp.x,y:sp.y+16}); };
  async function accept(i,expect="accept"){ const tt=await qop("accept"); ok(D.quest.step===i&&D.quest.accepted&&D.quest.ev===expect,`nhận bài ${i+1} "${ch.steps[i].name}" (${tt})`); }
  async function turnIn(i){
    const s=ch.steps[i], ht=D.bag.honTe, before=Object.fromEntries(s.reward.items.map(r=>[r.code,qtyOf(D,r.code)])), n=D.bagMsgs??0;
    const tt=await qop("turnin"); await waitFor(()=>(D.bagMsgs??0)>n,1500);
    ok(D.quest.step===i+1&&!D.quest.accepted&&D.quest.done===s.id&&D.bag.honTe===ht+s.reward.honTe&&s.reward.items.every(r=>qtyOf(D,r.code)===before[r.code]+r.qty),
      `trả bài ${i+1} "${s.name}": +${questRewardText(s.reward)} (${tt})`);
  }
  /** Đặt hồn thú 1 máu ngay chỗ D đứng rồi đánh hạ. */
  async function killOne(){
    const st=D.room.state; await test(D,"clear"); const ids=new Set(st.beasts.keys());
    await test(D,"beast",{dx:0,dy:0}); const fresh=()=>[...st.beasts.keys()].find(k=>!ids.has(k)); await waitFor(fresh,1000); const bid=fresh();
    for(let i=0;i<15&&bid&&st.beasts.has(bid);i++){ D.room.send("attack"); await waitFor(()=>!st.beasts.has(bid),450); }
    return !!bid&&!st.beasts.has(bid);
  }
  const progOf=()=>JSON.stringify(D.quest.prog);
  // Bài 1: gặp Thương nhân. Nói chuyện trước khi nhận không tính; nhận / trả khi đứng xa bị từ chối.
  const tn=npcSpot(ch.map,"thuong_nhan");
  await warp(ch.map,tn.x,tn.y+16);
  ok(await talk(D,"thuong_nhan")==="thuong_nhan"&&!D.quest.accepted,"chưa nhận bài: nói chuyện với Thương nhân không tính");
  t=await qop("accept"); ok(/lại gần Ngọc Tiểu Cương/.test(t)&&!D.quest.accepted,`đứng xa Đại Sư: không nhận được (${t})`);
  await atGiver(); ok(await talk(D,ch.giver)===ch.giver,"đứng cạnh Đại Sư: mở hộp thoại");
  t=await qop("turnin"); ok(/Chưa nhận/.test(t)&&D.quest.step===0,`chưa nhận thì không trả được (${t})`);
  await accept(0);
  t=await qop("accept"); ok(/Đang làm/.test(t)&&D.quest.step===0,`nhận lại bài đang làm bị từ chối (${t})`);
  const hb=D.bag.honTe; t=await qop("turnin"); ok(/Chưa xong/.test(t)&&D.quest.step===0&&D.bag.honTe===hb,`chưa xong thì không trả được (${t})`);
  await go("thuong_nhan"); await talk(D,"thuong_nhan");
  ok(await waitFor(()=>D.quest.status==="ready")&&D.quest.ev==="ready"&&same(D.quest.prog,[1]),`nói chuyện với Thương nhân: bài 1 xong (${progOf()})`);
  t=await qop("turnin"); ok(/lại gần Ngọc Tiểu Cương/.test(t)&&D.quest.step===0&&D.bag.honTe===hb,`đứng ở cửa hàng: trả nhiệm vụ bị từ chối, chưa nhận thưởng (${t})`);
  await atGiver(); await turnIn(0);
  t=await qop("turnin"); ok(/Chưa nhận/.test(t)&&D.quest.step===1,`trả lần hai bị từ chối, không nhận thưởng hai lần (${t})`);
  // Bài 2: hạ 8 hồn thú ở Bãi tập hồn sư. Hạ ở Đồng lúa thì không tính.
  await accept(1); const need2=ch.steps[1].goals[0].n;
  await warp("thanh_hon_thon",250,400);
  ok(await killOne()&&D.quest.prog[0]===0,`hạ hồn thú ở Đồng lúa: Bãi tập vẫn ${progOf()}`);
  await test(D,"goto",{x:850,y:300}); await test(D,"rest",{s:10});
  for(let k=0;k<need2;k++) await killOne();
  ok(await waitFor(()=>D.quest.status==="ready")&&D.quest.prog[0]===need2,`hạ ${need2} hồn thú ở Bãi tập hồn sư: ${progOf()}`);
  // Đang ở Thánh Hồn Thôn: không trả được, phải về Nặc Đinh Thành.
  t=await qop("turnin"); ok(/không ở đây/.test(t)&&D.quest.step===1,`ở Thánh Hồn Thôn: không trả được (${t})`);
  await warp(ch.map,ds.x,ds.y+16); await turnIn(1);
  // Bài 3: đổi tay khi giao chiến (ngoài giao chiến không tính) và tiên cơ.
  await accept(2);
  await warp("thanh_hon_thon",850,300); await test(D,"rest",{s:10});
  const other=()=>D.owned.team.findIndex(r=>r&&r!==D.owned.active);
  await switchSlot(other()); ok(D.quest.prog[0]===0,`đổi võ hồn ngoài giao chiến: không tính (${progOf()})`);
  // Hồn thú hoang ở Bãi tập có thể đánh gục võ hồn ra trận trong lúc chờ hồi chiêu đổi: dọn quanh mình trước.
  await sleep(SWITCH_CD*1000+200); await test(D,"clear"); await killOne();
  await switchSlot(other()); ok(await waitFor(()=>D.quest.prog[0]===1),`đổi võ hồn khi đang giao chiến: ${progOf()} (${D.logs.slice(-3).join(" | ")})`);
  await sleep(SWITCH_CD*1000+200); await test(D,"energy",{v:100}); await test(D,"beast",{dx:8,dy:0});
  await switchSlot(other());
  ok(await waitFor(()=>D.quest.status==="ready")&&D.quest.prog[1]===1,`tung tiên cơ: bài 3 xong (${progOf()})`);
  await warp(ch.map,ds.x,ds.y+16); await turnIn(2);
  // Bài 4: hấp thụ trong giới hạn. Vượt giới hạn (thành công nhờ hook roll) không tính; trong giới hạn thì tính.
  await accept(3); ok(D.quest.prog[0]===0,"chưa võ hồn nào có hồn hoàn: bài 4 chưa xong khi nhận");
  const [r1,r2]=D.owned.team.filter(Boolean);
  for(const r of [r1,r2]) await test(D,"set",{rowId:r,level:10,xp:0,rings:[]});
  await test(D,"roll",{r:99});
  const absorbOne=async(years,rowId)=>{ await test(D,"give",{code:RING_ITEM,years}); const it=D.bag.items.find(i=>i.code===RING_ITEM&&i.years===years);
    D.absorbing=null; D.room.send("absorb",{itemId:it.id,vohonId:rowId}); await waitFor(()=>D.absorbing?.on,1500); D.absorbing=null; await test(D,"rush"); await waitFor(()=>D.absorbing&&!D.absorbing.on,1500); return D.absorbing?.result; };
  const over=Math.round(ringLimit(1)*1.18);
  ok(await absorbOne(over,r1)==="ok"&&D.quest.prog[0]===0,`hấp thụ hồn hoàn ${over} năm (vượt giới hạn vòng 1, thành công nhờ hook roll): không tính (${progOf()})`);
  ok(await absorbOne(ringLimit(1)-123,r2)==="ok"&&await waitFor(()=>D.quest.status==="ready"),`hấp thụ hồn hoàn ${ringLimit(1)-123} năm trong giới hạn: bài 4 xong (${progOf()})`);
  await test(D,"roll",{r:-1});
  await turnIn(3);
  // Tài khoản cũ (đã có hồn hoàn): nhận bài 4 thì tính xong ngay. Lùi tiến độ bằng hook rồi đặt lại bài 5 (không trả lần hai).
  await test(D,"quest",{step:3,accepted:false}); await accept(3,"ready");
  ok(D.quest.status==="ready","đã có võ hồn mang hồn hoàn: nhận bài 4 là xong ngay (mục tiêu đã đạt sẵn)");
  await test(D,"quest",{step:4,accepted:false}); ok(D.quest.step===4&&!D.quest.accepted,"hook quest: về lại bài 5 chưa nhận");
  // Bài 5: gắn hồn hạch (sự kiện gắn thật, ngoài giao chiến).
  await accept(4); ok(D.quest.prog[0]===0,"chưa gắn gì: bài 5 chưa xong khi nhận");
  await test(D,"give",{code:CORE_ITEM,stars:2,set:"tien_co"}); const core=D.bag.items.find(i=>i.code===CORE_ITEM&&i.vohon===null);
  D.room.send("equipcore",{itemId:core.id,vohonId:D.owned.active});
  ok(await waitFor(()=>D.quest.status==="ready"),`gắn hồn hạch vào võ hồn ra trận: bài 5 xong (${progOf()})`);
  await turnIn(4);
  // Bài 6: gặp Thợ rèn.
  await accept(5); await go("lo_ren"); await talk(D,"lo_ren");
  ok(await waitFor(()=>D.quest.status==="ready"),"nói chuyện với Thợ rèn: bài 6 xong");
  await atGiver(); await turnIn(5);
  // Bài 7: vào Tinh Đấu Ngoại vi và hạ 5 hồn thú ở đó; thoát vào lại giữa chừng vẫn giữ tiến độ.
  await accept(6); ok(same(D.quest.prog,[0,0]),"đang ở Nặc Đinh Thành: chưa đặt chân tới Ngoại vi");
  await warp("tinh_dau_ngoai_vi",88,504); ok(D.quest.prog[0]===1,`vào Tinh Đấu Ngoại vi: ${progOf()}`);
  const need7=ch.steps[6].goals[1].n;
  for(let k=0;k<2;k++) await killOne();
  ok(D.quest.prog[1]===2,`hạ 2 hồn thú ở Ngoại vi: ${progOf()}`);
  const q7=progOf(); await D.room.leave(); await sleep(400); await enter(D); await waitFor(()=>dme()&&D.quest);
  ok(progOf()===q7&&D.quest.accepted&&D.quest.step===6,`thoát vào lại: tiến độ bài 7 giữ nguyên ${progOf()}`);
  for(let k=2;k<need7;k++) await killOne();
  ok(await waitFor(()=>D.quest.status==="ready"),`hạ đủ ${need7} hồn thú ở Ngoại vi: bài 7 xong (${progOf()})`);
  await warp(ch.map,ds.x,ds.y+16);
  // Túi đầy: không trả được, không mất tiến độ, không nhận thưởng; bỏ bớt đồ rồi trả được.
  await test(D,"give",{code:"hoi_hon_dan",qty:BAG_SLOTS*itemDef("hoi_hon_dan").stack});
  const hf=D.bag.honTe; t=await qop("turnin");
  ok(/không đủ chỗ/.test(t)&&D.quest.step===6&&D.quest.status==="ready"&&D.bag.honTe===hf,`túi đầy: không trả được bài 7, giữ tiến độ (${t})`);
  for(const it of looseOf(D).filter(i=>i.code==="hoi_hon_dan").slice(0,6)) D.room.send("discard",{id:it.id});
  await waitFor(()=>looseOf(D).length<=BAG_SLOTS-6,2000);
  await turnIn(6);
  ok(D.quest.status==="done"&&D.quest.ev==="finish",`xong cả chuỗi "${ch.name}"`);
  t=await qop("accept"); ok(/Đã học xong/.test(t),`xong rồi thì không nhận thêm (${t})`);
  const bk=bagKey(D); await D.room.leave(); await sleep(400); await enter(D); await waitFor(()=>dme()&&D.quest&&D.bag);
  ok(D.quest.status==="done"&&D.quest.step===ch.steps.length&&bagKey(D)===bk,`thoát vào lại: chuỗi đã xong, túi và Hồn Tệ còn nguyên (${formatHonTe(D.bag.honTe)})`);
  await D.room.leave();
  /** Đổi sang ô `slot` của đội, chờ server gửi lại đội hình. */
  async function switchSlot(slot){ const n=D.ownedMsgs; D.room.send("switch",{slot}); await waitFor(()=>D.ownedMsgs>n,1500); await sleep(80); }
}

/**
 * 7.2 Đại Đấu Hồn Trường: hàm thuần (Elo, cửa sổ ghép nới dần, ghép Elo gần nhất); 3 tài khoản mới ở Nặc Đinh Thành: xếp hàng ở NPC
 * (đứng xa / đang giao chiến bị từ chối, hủy; đang niệm đi cổng thì không bị ghép, đi cổng xong thì ra khỏi hàng chờ), ghép theo Elo gần
 * nhất, vào sân (cả đội đầy, chưa đánh được lúc đếm ngược, message ngoài trận bị chặn); trận 1 rời sân = thua; trận 2 đạn hồn kỹ và đánh
 * thường trúng đối thủ (Trúng độc), hạ hết đội (hook down) -> thắng; trận 3 không vào sân = thua; trận 4 hết giờ so % sinh lực. Mỗi trận:
 * Elo đúng eloAfter, thưởng người thắng vào túi (lưu DB), kinh nghiệm / đồ / đội hình không đổi, hết giờ kết quả thì về đúng bản đồ và vị
 * trí cũ. Bảng xếp hạng đúng thứ tự (kể cả bằng Elo thì nhiều trận thắng trước), lượt thưởng còn lại.
 */
async function arenaTest(){
  console.log("[7.2] Đại Đấu Hồn Trường: ghép trận, đấu, Elo, thưởng, bảng xếp hạng");
  const K=ARENA.k, exp=(r,o)=>1/(1+10**((o-r)/400));
  ok(eloAfter(1000,1000,1)===1000+K/2&&eloAfter(1000,1000,0)===1000-K/2&&eloAfter(1000,1000,0.5)===1000
    &&eloAfter(1200,1000,1)===Math.round(1200+K*(1-exp(1200,1000)))&&eloAfter(1000,1200,1)===Math.round(1000+K*(1-exp(1000,1200)))&&eloAfter(10,10,0)===0,
    `Elo: K=${K}, ngang nhau ±${K/2}, thắng người mạnh hơn được nhiều hơn (+${eloAfter(1000,1200,1)-1000} / +${eloAfter(1200,1000,1)-1200}), không dưới 0`);
  ok(arenaWindow(0)===ARENA.window.base&&arenaWindow(4)===ARENA.window.base+4*ARENA.window.perSec&&arenaWindow(1e6)===ARENA.window.max,
    `cửa sổ ghép ${ARENA.window.base} + ${ARENA.window.perSec}/giây chờ, tối đa ${ARENA.window.max}`);
  const P=l=>JSON.stringify(arenaPairs(l.map(([id,elo,wait=0])=>({id,elo,wait}))));
  ok(P([["a",1000],["b",1500],["c",1040]])==='[["a","c"]]',"ghép người chờ lâu nhất với Elo gần nhất trong cửa sổ, người quá xa chờ tiếp");
  ok(P([["a",1000],["b",1500]])==="[]"&&P([["a",1000,20],["b",1500]])==='[["a","b"]]',"chênh 500 Elo: chưa ghép; chờ 20 giây thì cửa sổ đủ rộng");
  ok(P([["a",1000,30],["b",1090],["c",1050],["d",1500]])==='[["a","c"]]',"nhiều người vừa cửa sổ: chọn Elo gần nhất");
  ok(MAPS[ARENA_MAP]?.kind==="arena"&&npcDef("dau_hon_truong")?.role==="arena"&&!!npcSpot("nac_dinh_thanh","dau_hon_truong"),"sân đấu riêng (kind arena), NPC Đại Đấu Hồn Trường ở Nặc Đinh Thành");
  let err=""; try{ const r=await new Client(WS).joinOrCreate("map",{mapId:ARENA_MAP}); await r.leave(); }catch(e){ err=String(e?.message??e); }
  ok(/không tồn tại/.test(err),`không mở được phòng bản đồ trên sân đấu (${err})`);
  err=""; try{ const r=await new Client(WS).create("arena",{matchId:"khong_co"}); await r.leave(); }catch(e){ err=String(e?.message??e); }
  ok(/không tồn tại/.test(err),`client không tự mở được trận đấu (${err})`);

  const E=await bot("Đấu sĩ","bich_lan_xa_hoang",{sex:1,hair:1,hairCol:2,outfitCol:0});
  const F=await bot("Võ sĩ","u_minh_linh_mieu",{sex:0,hair:2,hairCol:4,outfitCol:5});
  const G=await bot("Kiếm khách","hoa_long",{sex:0,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(E,"ping"))?.enabled){ console.log("  ⚠ bỏ qua trận đấu (cần hook warp, aelo, down, afast): bật server bằng GAME_TEST=1"); for(const b of [E,F,G]) await b.room.leave(); return; }
  const ns=npcSpot("nac_dinh_thanh","dau_hon_truong"), meOf=b=>b.room.state.players?.get(b.room.sessionId);
  const at=(b,dx=0)=>test(b,"goto",{x:ns.x+dx,y:ns.y+16});
  /** Hook warp sang Nặc Đinh Thành cạnh NPC (transaction đi cổng), rồi vào phòng mới như đi cổng thật. */
  async function warpTown(b){
    b.travel=null; b.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:ns.x,y:ns.y+16});
    ok(await waitFor(()=>b.travel?.mapId==="nac_dinh_thanh",4000),`${b.name}: tới Nặc Đinh Thành`);
    await b.room.leave(); await sleep(300); await back(b);
  }
  /** Vào lại phòng của bản đồ đang lưu (/api/me), chờ state, đội hình, túi đồ. */
  async function back(b){ b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>meOf(b)&&b.owned&&b.bag&&b.squad,3000); }
  /** Gửi `arena {op}`, chờ tin "arena" k = queue (và dòng log mới khi xếp hàng). Trả dòng log mới nhất của lần này. */
  async function aop(b,op){ const l=b.logs.length, n=b.aqN; b.room.send("arena",{op}); await waitFor(()=>b.aqN>n&&(op!=="queue"||b.logs.length>l),2000); await sleep(60); return b.logs.slice(l).at(-1)??""; }
  const found=b=>b.arena.filter(m=>m.k==="found").at(-1), endOf=b=>b.arena.filter(m=>m.k==="end").at(-1);
  /** Đang ở bản đồ, đã được ghép: rời phòng bản đồ, vào phòng sân đấu bằng mã phòng. */
  async function enterArena(b){ const id=found(b).roomId; await b.room.leave(); await enter(b,id); await waitFor(()=>meOf(b)&&b.owned&&b.bag&&b.squad,3000); }
  /** Hết giờ hiện kết quả (hook afast): server đóng kết nối mã 4005, bot vào lại bản đồ cũ. */
  async function kickBack(b){
    await test(b,"afast",{s:0}); ok(await waitFor(()=>b.leftCode===4005,3000),`${b.name}: hết giờ kết quả thì server đưa ra khỏi sân (mã ${b.leftCode})`);
    await back(b);
  }
  const prog=b=>JSON.stringify(b.owned.list.map(v=>[v.rowId,v.level,v.xp,v.stars,v.rings]));
  const sides=b=>[...b.room.state.sides];
  /** Kiểm Elo / thành tích của trận vừa xong: `score` của bot `b` gặp Elo `foe`. */
  function checkEnd(b,score,reason,elo0,foe,label){
    const m=endOf(b);
    ok(m&&m.score===score&&m.reason===reason&&m.elo0===elo0&&m.elo1===eloAfter(elo0,foe,score),
      `${label}: ${b.name} ${score===1?"thắng":score===0?"thua":"hòa"} (${m?.why}), Elo ${m?.elo0} → ${m?.elo1} (= eloAfter(${elo0}, ${foe}, ${score}) = ${eloAfter(elo0,foe,score)})`);
    return m;
  }
  /** Người thắng có thưởng: Hồn Tệ và mảnh vào túi (túi trong sân đã có), còn lại `left` lượt hôm nay. */
  async function checkReward(b,m,before,left){
    ok(await waitFor(()=>b.bag.honTe===before.honTe+m.reward?.honTe),`thưởng ${formatHonTe(m.reward?.honTe??0)} vào túi (${formatHonTe(before.honTe)} → ${formatHonTe(b.bag.honTe)})`);
    ok(m.reward&&ARENA_SHARDS.some(v=>shardCode(v)===m.reward.code)&&qtyOf(b,m.reward.code)===before.q(m.reward.code)+m.reward.qty&&m.reward.qty+(m.reward.coin?1:0)>=1&&m.left===left,
      `thưởng ${m.reward?.qty} ${itemDef(m.reward?.code)?.name}; còn ${m.left}/${ARENA.dailyWins} trận thắng có thưởng hôm nay`);
  }
  const snap=b=>{ const h=b.bag.honTe, items=b.bag.items.map(i=>({...i})); return { honTe:h, q:code=>items.filter(i=>i.code===code).reduce((a,i)=>a+i.qty,0), key:bagKey(b) }; };

  for(const b of [E,F,G]) await warpTown(b);
  // E có hồn hoàn vòng 1 để thử hồn kỹ (Bích Lân Độc Tiễn: 3 mũi độc) lên đối thủ.
  await test(E,"set",{rowId:E.owned.active,level:10,rings:[100]});

  // ---- Xếp hàng ở NPC ----
  await test(E,"goto",{x:30*16,y:20*16}); let t=await aop(E,"queue"); ok(/lại gần/.test(t)&&!E.aq.on,`đứng xa NPC: không xếp hàng được (${t})`);
  await at(E); await test(E,"hurt",{pct:5}); t=await aop(E,"queue"); ok(/giao chiến/.test(t)&&!E.aq.on,`vừa bị đánh: không xếp hàng được (${t})`);
  // Đang trong tổ đội (7.1): không xếp hàng được; rời tổ đội thì được.
  E.room.send("party",{op:"invite",name:F.name}); await sleep(300); F.room.send("party",{op:"accept",name:E.name}); await sleep(400);
  await test(E,"rest"); t=await aop(E,"queue"); ok(/tổ đội/.test(t)&&!E.aq.on,`đang trong tổ đội: không xếp hàng được (${t})`);
  E.room.send("party",{op:"leave"}); await sleep(400);
  t=await aop(E,"queue"); ok(E.aq.on&&E.aq.elo===ARENA.startElo,`cạnh NPC: đang tìm trận, Elo khởi đầu ${E.aq.elo} (${t})`);
  t=await aop(E,"queue"); ok(/rồi/.test(t)&&E.aq.on,`xếp hàng lần hai: báo đang tìm (${t})`);
  t=await aop(E,"cancel"); ok(!E.aq.on&&/hủy/.test(t),`hủy xếp hàng (${t})`);
  // Đang niệm đi cổng: không bị ghép; đi cổng xong thì ra khỏi hàng chờ.
  await at(F); await aop(F,"queue"); await test(F,"goto",{x:(60-1.5)*16,y:20.5*16});
  F.travel=null; F.room.send("travel",{portal:"Đi Tinh Đấu Ngoại vi"}); await sleep(100); await aop(E,"queue");
  ok(await waitFor(()=>F.travel?.mapId,4000),"F đi qua cổng trong lúc đang xếp hàng");
  ok(!found(E)&&!found(F),"đang niệm đi cổng: không bị ghép trận");
  await F.room.leave(); await sleep(300); await back(F);
  t=await aop(F,"cancel"); ok(F.mapId==="tinh_dau_ngoai_vi"&&!/hủy/.test(t)&&!F.aq.on,`F sang ${MAPS[F.mapId].name}: đã ra khỏi hàng chờ khi đi cổng`);
  t=await aop(E,"cancel"); ok(/hủy/.test(t),"E vẫn trong hàng chờ một mình, hủy");
  await warpTown(F);

  // ---- Trận 1: ghép theo Elo gần nhất (E 1000 gặp G 1040, không gặp F 1500); G rời sân lúc đếm ngược = thua ----
  await test(E,"aelo",{elo:1000}); await test(F,"aelo",{elo:1500}); await test(G,"aelo",{elo:1040});
  await at(E,-12); await at(F,0); await at(G,12);
  await aop(E,"queue"); await aop(F,"queue"); ok(E.aq.on&&F.aq.on&&E.aq.elo===1000&&F.aq.elo===1500,"Elo đọc từ DB lúc xếp hàng (hook aelo)");
  await sleep(1500); ok(!found(E)&&!found(F),"E 1000, F 1500: chưa ghép ngay");
  await aop(G,"queue");
  ok(await waitFor(()=>found(E)&&found(G),3000)&&found(E).roomId===found(G).roomId&&!found(F)&&found(E).foe===G.name,`ghép E (1000) với G (1040), không với F (1500): ${found(E)?.foe}`);
  t=await aop(F,"cancel"); ok(/hủy/.test(t),"F vẫn chờ, hủy");
  const posE=[meOf(E).x,meOf(E).y], posG=[meOf(G).x,meOf(G).y], progE=prog(E), teamE=JSON.stringify(E.owned.team)+E.owned.active, bagE=snap(E);
  await enterArena(E); await enterArena(G);
  ok(E.room.state.mapId===ARENA_MAP&&sides(E).map(s=>s.name).sort().join()===[E.name,G.name].sort().join(),`vào sân ${MAPS[ARENA_MAP].name}: ${sides(E).map(s=>`${s.name} (${s.elo})`).join(" – ")}`);
  ok(await waitFor(()=>E.room.state.phase==="ready",3000),`cả hai vào sân: đếm ngược ${E.room.state.time.toFixed(1)} giây`);
  ok([E,G].every(b=>meOf(b).hp===meOf(b).maxHp&&b.squad.list.every(s=>s.hp===s.maxHp&&!s.down))&&Math.abs(meOf(E).x-meOf(G).x)>200,"cả đội đầy sinh lực, hai bên ở hai phía sân");
  let l=E.logs.length; E.room.send("team",{slots:[0,0,0,0]}); ok(await waitFor(()=>E.logs.length>l)&&/không làm được/.test(E.logs.at(-1)),`trong sân: xếp đội bị chặn (${E.logs.at(-1)})`);
  l=E.logs.length; E.room.send("use",{id:E.bag.items[0]?.id}); ok(await waitFor(()=>E.logs.length>l)&&/không làm được/.test(E.logs.at(-1)),"trong sân: dùng đan bị chặn");
  l=E.logs.length; E.room.send("skill",{i:0}); ok(await waitFor(()=>E.logs.length>l)&&/đếm ngược/.test(E.logs.at(-1)),"đang đếm ngược: chưa dùng hồn kỹ");
  await G.room.leave();
  ok(await waitFor(()=>endOf(E),3000),"G rời sân: trận có kết quả ngay");
  let m=checkEnd(E,1,"leave",1000,1040,"Trận 1");
  await checkReward(E,m,bagE,ARENA.dailyWins-1);
  const eloG1=eloAfter(1040,1000,0);
  await sleep(300); await back(G);
  ok(G.room.state.mapId==="nac_dinh_thanh"&&Math.hypot(meOf(G).x-posG[0],meOf(G).y-posG[1])<1,"G rời sân: về Nặc Đinh Thành đúng chỗ cũ");
  const bagE1=bagKey(E);
  await kickBack(E);
  ok(E.room.state.mapId==="nac_dinh_thanh"&&Math.hypot(meOf(E).x-posE[0],meOf(E).y-posE[1])<1,`E về Nặc Đinh Thành đúng chỗ cũ (${meOf(E).x.toFixed(0)},${meOf(E).y.toFixed(0)})`);
  ok(bagKey(E)===bagE1&&prog(E)===progE&&JSON.stringify(E.owned.team)+E.owned.active===teamE,"phần thưởng đã lưu; cấp, kinh nghiệm, hồn hoàn, đội hình không đổi");

  // 8.1a trong sân: võ hồn ra trận của E có đủ 7 hồn hoàn (Võ Hồn Chân Thân) và mang hồn kỹ vòng 5 ở ô U; F lên cấp 70 để chịu các đòn thử.
  const rowE=E.owned.active; await test(E,"set",{rowId:rowE,level:70,xp:0,rings:Array(CHAN_THAN_RING).fill(100)});
  await test(E,"rest"); let n0=E.ownedMsgs; E.room.send("loadout",{rowId:rowE,skills:[4,1,2,3]}); await waitFor(()=>E.ownedMsgs>n0,1500); await sleep(80);
  ok(same(E.owned.list.find(v=>v.rowId===rowE)?.skills,[4,1,2,3]),`ở thành: xếp ${ringSkill("bich_lan_xa_hoang",4).name} (vòng 5) vào ô U`);
  for(const v of F.owned.list) await test(F,"set",{rowId:v.rowId,level:70,xp:0});
  // Cộng minh (8.2) áp cả trong sân: E có 4 võ hồn cấp RES_VOHON_LEVEL (mốc Võ hồn 1), sinh lực tối đa trong sân bằng ở thành.
  for(const vo of ["hao_thien_chuy","hoa_long"]) await test(E,"grant",{vohon:vo});
  for(const v of E.owned.list) if(v.rowId!==rowE) await test(E,"set",{rowId:v.rowId,level:RES_VOHON_LEVEL,xp:0});
  await test(E,"rest"); await waitFor(()=>E.squad,2000);
  const ev=E.owned.list.find(v=>v.rowId===E.owned.active), resHp=meOf(E).maxHp, resSquad=JSON.stringify(E.squad.list.map(s=>[s.rowId,s.maxHp]));
  ok(resHp>calcStats(vohonIndex(ev.vohon),ev.level,ev.rings.map(tierOfYears),ev.stars).maxHp,`cộng minh: E có mốc Võ hồn 1, sinh lực tối đa ${resHp} (cao hơn khi không có cộng minh)`);
  // ---- Trận 2: E gặp F; đạn hồn kỹ và đánh thường trúng đối thủ; F gục cả đội (hook down) -> E thắng ----
  await test(F,"aelo",{elo:1030});
  await aop(E,"queue"); await aop(F,"queue");
  ok(await waitFor(()=>found(E)&&found(F)&&found(E).roomId===found(F).roomId,3000),"ghép E với F");
  const eloE2=E.aq.elo, posF=[meOf(F).x,meOf(F).y], progF=prog(F), teamF=JSON.stringify(F.owned.team)+F.owned.active, bagF=bagKey(F), bagE2=snap(E);
  await enterArena(E); await enterArena(F);
  ok(meOf(E).maxHp===resHp&&JSON.stringify(E.squad.list.map(s=>[s.rowId,s.maxHp]))===resSquad,`trong sân cộng minh vẫn áp: sinh lực tối đa ${meOf(E).maxHp} = ở thành, cả đội như ở thành`);
  await waitFor(()=>E.room.state.phase==="ready",3000);
  l=E.logs.length; E.room.send("chanthan"); ok(await waitFor(()=>E.logs.length>l)&&/đếm ngược/.test(E.logs.at(-1))&&!meOf(E).ava,"đang đếm ngược: chưa biến Võ Hồn Chân Thân");
  l=E.logs.length; E.room.send("loadout",{rowId:rowE,skills:[0,1,2,3]}); ok(await waitFor(()=>E.logs.length>l)&&/không làm được/.test(E.logs.at(-1)),"trong sân: xếp ô hồn kỹ mang theo bị chặn");
  await test(E,"afast",{s:0});
  ok(await waitFor(()=>E.room.state.phase==="fight",2000)&&E.arena.some(m=>m.k==="fight"),`hết đếm ngược: giao đấu ${Math.round(E.room.state.time)} giây`);
  const sid=b=>b.room.sessionId, fv=()=>E.room.state.players.get(sid(F)), sE=sides(E).findIndex(s=>s.sid===sid(E)), dir=sE===0?1:-1;
  await test(E,"goto",{x:fv().x-dir*40,y:fv().y});
  const hp0=fv().hp; E.room.send("skill",{i:0});
  ok(await waitFor(()=>fv().hp<hp0&&(fv().st&statusBit("poison")),2000),`${ringSkill("bich_lan_xa_hoang",4).name} (hồn kỹ vòng 5 ở ô U) trúng đối thủ: ${hp0} → ${fv().hp}, Trúng độc`);
  await test(E,"goto",{x:fv().x-dir*10,y:fv().y}); const hp1=fv().hp; E.room.send("attack");
  ok(await waitFor(()=>fv().hp<hp1,1500),`đánh thường trúng đối thủ: ${hp1} → ${fv().hp}`);
  const hp2=fv().hp; E.room.send("chanthan");
  ok(await waitFor(()=>meOf(E).ava>0&&meOf(E).avaCd>0&&fv().hp<hp2,2000),`${chanThanOf("bich_lan_xa_hoang").name} khi giao đấu: biến hình ${meOf(E).ava.toFixed(1)} giây, độc khí trúng đối thủ ${hp2} → ${fv().hp}`);
  ok(await waitFor(()=>sides(E).find(s=>s.sid===sid(F)).pct<1,1500),`thanh trận đấu: F còn ${Math.round(sides(E).find(s=>s.sid===sid(F)).pct*100)}% sinh lực cả đội`);
  for(let k=0;k<TEAM_SIZE&&!meOf(F).dead;k++) await test(F,"down");
  ok(meOf(F).dead&&await waitFor(()=>endOf(E)&&endOf(F),3000),"F gục cả đội: trận kết thúc");
  m=checkEnd(E,1,"ko",eloE2,1030,"Trận 2"); checkEnd(F,0,"ko",1030,eloE2,"Trận 2");
  await checkReward(E,m,bagE2,ARENA.dailyWins-2);
  ok(!endOf(F).reward&&bagKey(F)===bagF,"thua không mất gì: túi và Hồn Tệ của F giữ nguyên");
  const eloF2=endOf(F).elo1, eloE3=m.elo1;
  await kickBack(F);
  ok(Math.hypot(meOf(F).x-posF[0],meOf(F).y-posF[1])<1&&prog(F)===progF&&JSON.stringify(F.owned.team)+F.owned.active===teamF&&bagKey(F)===bagF&&F.squad.list.every(s=>!s.down),
    "F về đúng chỗ cũ; cấp, kinh nghiệm, đội hình, võ hồn ra trận, túi không đổi; cả đội hồi đầy");
  await kickBack(E);
  ok(!meOf(E).ava&&!meOf(E).avaCd&&[...meOf(E).cds].every(c=>c===0)&&same(E.owned.list.find(v=>v.rowId===rowE)?.skills,[4,1,2,3]),
    "về bản đồ: không mang Chân Thân / hồi chiêu ra khỏi trận; ô hồn kỹ mang theo giữ như trước trận");

  // ---- Trận 3: F gặp G, G không vào sân (bỏ trận) -> F thắng ----
  await aop(F,"queue"); await aop(G,"queue");
  ok(await waitFor(()=>found(F)&&found(G)&&found(F).roomId===found(G).roomId,3000),"ghép F với G");
  const bagF3=snap(F), eloG3=G.aq.elo; ok(eloG3===eloG1,`G thua trận 1: Elo ${eloG3} (= eloAfter(1040, 1000, 0))`);
  await enterArena(F); await test(F,"afast",{s:0});
  ok(await waitFor(()=>endOf(F),3000),"G không vào sân: hết giờ chờ thì trận có kết quả");
  m=checkEnd(F,1,"noshow",eloF2,eloG3,"Trận 3"); await checkReward(F,m,bagF3,ARENA.dailyWins-1);
  await G.room.leave(); await sleep(300); await back(G);
  ok(G.room.state.mapId==="nac_dinh_thanh","G (đã ghép mà không vào sân) vẫn ở Nặc Đinh Thành");
  await kickBack(F);
  const eloF3=m.elo1, eloG4=eloAfter(eloG3,eloF2,0);

  // ---- Trận 4: E gặp F, hết giờ: E còn đủ sinh lực, F mất một nửa -> E thắng theo % ----
  await aop(E,"queue"); await aop(F,"queue");
  ok(await waitFor(()=>found(E)&&found(F)&&found(E).roomId===found(F).roomId,3000),`ghép E (${E.aq.elo}) với F (${F.aq.elo})`);
  await enterArena(E); await enterArena(F); await waitFor(()=>E.room.state.phase==="ready",3000);
  await test(E,"afast",{s:0}); await waitFor(()=>E.room.state.phase==="fight",2000);
  await test(F,"hurt",{pct:50}); await test(E,"afast",{s:0});
  ok(await waitFor(()=>endOf(E)&&endOf(F),3000),"hết giờ: trận có kết quả");
  m=checkEnd(E,1,"time",eloE3,eloF3,"Trận 4"); checkEnd(F,0,"time",eloF3,eloE3,"Trận 4");
  ok(E.room.state.winner===sides(E).findIndex(s=>s.sid===sid(E))&&sides(E).find(s=>s.sid===sid(E)).pct===1&&sides(E).find(s=>s.sid===sid(F)).pct<1,
    `so sinh lực cả đội: E ${Math.round(sides(E).find(s=>s.sid===sid(E)).pct*100)}%, F ${Math.round(sides(E).find(s=>s.sid===sid(F)).pct*100)}%`);
  const eloE4=m.elo1, eloF4=endOf(F)?.elo1;
  await kickBack(E); await kickBack(F);

  // ---- Bảng xếp hạng ----
  async function top(b){ await sleep(ARENA.topCd*1000+50); const n=b.topN; b.room.send("arena",{op:"top"}); b.room.send("arena",{op:"top"}); await waitFor(()=>b.topN>n,2000); await sleep(300); return b.topN-n; }
  ok(await top(E)===1,"xin bảng xếp hạng dồn dập: chỉ trả một lần");
  let L=E.top.list; const idx=n=>L.findIndex(r=>r.name===n);
  ok(L.length<=ARENA.topN&&L.every((r,i)=>!i||L[i-1].elo>r.elo||(L[i-1].elo===r.elo&&L[i-1].wins>=r.wins)),`top ${L.length}: Elo giảm dần, bằng Elo thì nhiều trận thắng trước`);
  ok(E.top.me?.elo===eloE4&&E.top.me.wins===3&&E.top.me.losses===0&&L.find(r=>r.me)?.name===E.name&&E.top.left===ARENA.dailyWins-3,
    `E: hạng ${E.top.me?.rank}, Elo ${E.top.me?.elo}, 3 thắng 0 thua, còn ${E.top.left} lượt thưởng hôm nay`);
  ok(L.find(r=>r.name===F.name)?.elo===eloF4&&L.find(r=>r.name===G.name)?.elo===eloG4&&idx(E.name)<idx(F.name)&&idx(F.name)<idx(G.name),
    `Elo đã lưu: E ${eloE4}, F ${eloF4}, G ${eloG4} (thứ tự E, F, G)`);
  await test(G,"aelo",{elo:eloF4,wins:9}); await top(E); L=E.top.list;
  ok(idx(G.name)>=0&&idx(G.name)<idx(F.name),`G bằng Elo F (${eloF4}) nhưng nhiều trận thắng hơn: xếp trên F`);
  for(const b of [E,F,G]) await b.room.leave();
}
/**
 * 8.2 Cộng minh: bảng RESONANCE đúng mốc 5.10 (hàm thuần), rồi một tài khoản mới đạt từng mốc của 4 trụ cột bằng hook (grant / set
 * võ hồn, hấp thụ thật, give hồn cốt +10 / hồn hạch 5★ rồi gắn bằng message thật): chỉ số mọi võ hồn (ra trận, trong đội, ngoài
 * đội, đổi vào sau) tăng đúng %, thông báo mốc mới (log + `ev`), tháo đồ thì mất mốc, thoát vào lại vẫn giữ.
 */
async function resonanceTest(){
  console.log("[8.2] Cộng minh: 4 trụ cột, cộng chỉ số cho mọi võ hồn");
  const NEED={vohon:[4,6,8],ring:[10,25,50],bone:[6,12,24],core:[8,16,24]};
  ok(RESONANCE.length===4&&RESONANCE.every(r=>JSON.stringify(r.steps.map(s=>s.need))===JSON.stringify(NEED[r.id])&&r.steps.every(s=>Object.values(s.bonus).every(v=>v>0))),
    "RESONANCE: Võ hồn 4/6/8, Hồn hoàn 10/25/50, Hồn cốt 6/12/24, Hồn hạch 8/16/24 (mục 5.10)");
  const pv=resonanceProgress({vohons:[{level:RES_VOHON_LEVEL,rings:3},{level:RES_VOHON_LEVEL-1,rings:7},{level:100,rings:10}],
    bones:[{enhance:RES_BONE_ENHANCE},{enhance:RES_BONE_ENHANCE-1}],cores:[{stars:RES_CORE_STARS},{stars:RES_CORE_STARS-1},{stars:6}]});
  ok(JSON.stringify(pv)===JSON.stringify([2,20,1,2])&&JSON.stringify(resonanceLevels([4,24,6,23]))===JSON.stringify([1,1,1,2])
    &&JSON.stringify(resonanceLevels([99,99,99,99]))===JSON.stringify([3,3,3,3])&&JSON.stringify(resonanceBonus([0,0,0,0]))===JSON.stringify({hp:0,mp:0,atk:0}),
    `resonanceProgress / resonanceLevels: cấp ${RES_VOHON_LEVEL}+, hồn cốt +${RES_BONE_ENHANCE}, hồn hạch ${RES_CORE_STARS}★ (${JSON.stringify(pv)})`);
  const R=await bot("Cộng minh","u_minh_linh_mieu",{sex:0,hair:2,hairCol:3,outfitCol:1});
  const rme=()=>R.room.state.players?.get(R.room.sessionId);
  await waitFor(()=>R.owned&&R.bag&&R.res&&rme(),3000);
  ok(R.res&&R.res.lv.every(x=>x===0)&&R.res.bonus.hp===0&&R.res.bonus.atk===0,`tài khoản mới: chưa đạt mốc nào (${JSON.stringify(R.res)})`);
  if(!(await test(R,"ping"))?.enabled){ console.log("  ⚠ bỏ qua đạt mốc cộng minh (cần hook grant, set, give): bật server bằng GAME_TEST=1"); await R.room.leave(); return; }
  const lvOf=()=>JSON.stringify(R.res?.lv), sameStats=(a,b)=>a&&b&&a.maxHp===b.maxHp&&a.maxMp===b.maxMp&&Math.abs(a.atk-b.atk)<1e-6;
  /** Kiểm tra chỉ số của mọi võ hồn sở hữu (hook stats) = calcStats kèm cộng minh `lv`; võ hồn ra trận: chỉ số đang dùng cũng vậy. */
  async function checkAll(lv,label){
    const res=resonanceBonus(lv); let good=true, more=true, live=false, n=0;
    for(const v of R.owned.list){
      const s=await test(R,"stats",{rowId:v.rowId}), vh=vohonIndex(v.vohon), rings=v.rings.map(tierOfYears);
      const want=calcStats(vh,v.level,rings,v.stars,s.bones,s.cores,res), bare=calcStats(vh,v.level,rings,v.stars,s.bones,s.cores);
      if(!sameStats(s.stats,want)||JSON.stringify(s.res?.lv)!==JSON.stringify(lv)) { good=false; console.log("    ",v.vohon,JSON.stringify(s.stats),JSON.stringify(want)); }
      if(lv.some(x=>x>0)&&!(s.stats.maxHp>=bare.maxHp&&s.stats.atk>=bare.atk&&(s.stats.maxHp>bare.maxHp||s.stats.atk>bare.atk||s.stats.maxMp>bare.maxMp))) more=false;
      if(v.rowId===R.owned.active){ live=s.live&&s.live.maxHp===want.maxHp&&s.live.maxMp===want.maxMp&&Math.abs(s.live.atk-want.atk)<1e-6&&rme().maxHp===want.maxHp; }
      n++;
    }
    ok(good&&more&&live,`${label}: chỉ số ${n} võ hồn = calcStats kèm cộng minh ${JSON.stringify(res)} (võ hồn ra trận dùng ngay)`);
  }
  const L0=R.logs.length;
  // ---- Võ hồn: sở hữu 4 / 6 / 8 võ hồn cấp 30+ ----
  for(const vo of ["hao_thien_chuy","ta_hoa_phuong_hoang","hoa_long","nhu_cot_tho","yeu_ho","quy_mi"]) await test(R,"grant",{vohon:vo});
  ok(R.owned.list.length===8,`có 8 võ hồn (${R.owned.list.map(v=>v.vohon).join(", ")})`);
  const ids=R.owned.list.map(v=>v.rowId), act=R.owned.active;
  for(let i=0;i<3;i++) await test(R,"set",{rowId:ids[i],level:RES_VOHON_LEVEL,xp:0});
  await test(R,"set",{rowId:ids[3],level:RES_VOHON_LEVEL-1,xp:0});
  ok(R.res.prog[0]===3&&R.res.lv[0]===0,`3 võ hồn cấp ${RES_VOHON_LEVEL} + 1 võ hồn cấp ${RES_VOHON_LEVEL-1}: chưa đạt mốc (${R.res.prog[0]}/4)`);
  let e0=R.resEv.length;
  await test(R,"set",{rowId:ids[3],level:RES_VOHON_LEVEL,xp:0});
  ok(R.res.prog[0]===4&&R.res.lv[0]===1&&R.resEv.slice(e0).some(e=>e.pillar===0&&e.step===0&&e.up)
    &&R.logs.slice(L0).some(t=>/Cộng minh Võ hồn đạt mốc 1\/3/.test(t)),`võ hồn thứ 4 lên cấp ${RES_VOHON_LEVEL}: đạt mốc 1, có thông báo (${R.logs.slice(L0).find(t=>/Cộng minh/.test(t))})`);
  await checkAll(R.res.lv,"mốc Võ hồn 1");
  for(let i=4;i<6;i++) await test(R,"set",{rowId:ids[i],level:RES_VOHON_LEVEL,xp:0});
  ok(R.res.lv[0]===2,`6 võ hồn cấp ${RES_VOHON_LEVEL}+: mốc 2 (${lvOf()})`);
  for(let i=6;i<8;i++) await test(R,"set",{rowId:ids[i],level:RES_VOHON_LEVEL,xp:0});
  ok(R.res.lv[0]===3&&R.res.bonus.hp===10,`8 võ hồn cấp ${RES_VOHON_LEVEL}+: đủ 3 mốc, sinh lực +${R.res.bonus.hp}%`);
  // ---- Hồn hoàn: tổng 10 / 25 / 50 hồn hoàn trên mọi võ hồn; mốc cuối bằng một lần hấp thụ thật ----
  const Y=n=>Array.from({length:n},()=>10), setRings=(i,n)=>test(R,"set",{rowId:ids[i],level:Math.max(RES_VOHON_LEVEL,(n+1)*10>100?100:n*10+10),xp:0,rings:Y(n)});
  await setRings(0,3); await setRings(1,3); await setRings(2,3);
  ok(R.res.prog[1]===9&&R.res.lv[1]===0,`9 hồn hoàn: chưa đạt mốc (${R.res.prog[1]}/10)`);
  e0=R.resEv.length; await setRings(3,1);
  ok(R.res.lv[1]===1&&R.resEv.slice(e0).some(e=>e.pillar===1&&e.step===0&&e.up),`10 hồn hoàn: mốc Hồn hoàn 1 (công +${R.res.bonus.atk}%)`);
  await checkAll(R.res.lv,"mốc Võ hồn 3 + Hồn hoàn 1");
  await setRings(0,10); await setRings(1,10); await setRings(2,5);
  ok(R.res.prog[1]===26&&R.res.lv[1]===2,`26 hồn hoàn: mốc 2 (${lvOf()})`);
  await setRings(2,10); await setRings(3,10); await setRings(4,9);
  ok(R.res.prog[1]===49&&R.res.lv[1]===2,`49 hồn hoàn: vẫn mốc 2`);
  // Võ hồn thứ 5 đang ở bình cảnh cấp 100 với 9 vòng: hấp thụ hồn hoàn thứ 10 thật (cố định số ngẫu nhiên, xong ngay).
  await test(R,"set",{rowId:ids[4],level:100,xp:0,rings:Y(9)});
  const nb=R.bagMsgs??0; await test(R,"give",{code:RING_ITEM,qty:1}); await waitFor(()=>(R.bagMsgs??0)>nb);
  const ring=R.bag.items.find(i=>i.code===RING_ITEM);
  await test(R,"roll",{r:0}); e0=R.resEv.length;
  R.absorbing=null; R.room.send("absorb",{itemId:ring?.id,vohonId:ids[4]}); await waitFor(()=>R.absorbing?.on);
  await test(R,"rush"); await waitFor(()=>R.absorbing?.result==="ok"); await waitFor(()=>R.res.prog[1]===50,1500);
  ok(R.absorbing?.result==="ok"&&R.res.prog[1]===50&&R.res.lv[1]===3&&R.resEv.slice(e0).some(e=>e.pillar===1&&e.step===2&&e.up)
    &&R.logs.some(t=>/Cộng minh Hồn hoàn đạt mốc 3\/3/.test(t)),`hấp thụ hồn hoàn thứ 50: mốc Hồn hoàn 3, có thông báo (công +${R.res.bonus.atk}%)`);
  await test(R,"roll",{r:-1});
  // ---- Hồn cốt: 6 / 12 / 24 hồn cốt +10 đang gắn (6 vị trí x 4 võ hồn) ----
  /** Cho hồn cốt / hồn hạch bằng hook rồi gắn từng món bằng message thật vào võ hồn `rowId`. */
  async function gearUp(rowId,list){
    for(const g of list){
      const before=new Set(R.bag.items.map(i=>i.id)), n=R.bagMsgs??0;
      await test(R,"give",g); await waitFor(()=>(R.bagMsgs??0)>n);
      const it=R.bag.items.find(i=>!before.has(i.id)&&i.code===g.code);
      const m=R.bagMsgs??0; R.room.send(g.code===BONE_ITEM?"equip":"equipcore",{itemId:it?.id,vohonId:rowId}); await waitFor(()=>(R.bagMsgs??0)>m);
    }
    await sleep(80);
  }
  const bones6=e=>BONE_SLOTS.map(s=>({code:BONE_ITEM,qty:1,tier:2,beast:BEASTS[0].id,slot:s.id,enhance:e}));
  await gearUp(ids[0],bones6(RES_BONE_ENHANCE-1));
  ok(R.res.prog[2]===0&&R.res.lv[2]===0,`6 hồn cốt +${RES_BONE_ENHANCE-1} đang gắn: không tính`);
  e0=R.resEv.length; await gearUp(ids[1],bones6(RES_BONE_ENHANCE));
  ok(R.res.prog[2]===6&&R.res.lv[2]===1&&R.resEv.slice(e0).some(e=>e.pillar===2&&e.step===0&&e.up),`6 hồn cốt +${RES_BONE_ENHANCE} gắn trên ${VOHON[vohonIndex(R.owned.list[1].vohon)].name}: mốc Hồn cốt 1`);
  await gearUp(ids[2],bones6(RES_BONE_ENHANCE));
  ok(R.res.prog[2]===12&&R.res.lv[2]===2,`12 hồn cốt +${RES_BONE_ENHANCE}: mốc 2`);
  await gearUp(ids[3],bones6(RES_BONE_ENHANCE)); await gearUp(ids[4],bones6(RES_BONE_ENHANCE+5));
  ok(R.res.prog[2]===24&&R.res.lv[2]===3,`24 hồn cốt +${RES_BONE_ENHANCE} trở lên trên 4 võ hồn: mốc 3 (${lvOf()})`);
  // Tháo một món thì mất mốc 3 (có báo), gắn lại thì có lại.
  const off=R.bag.items.find(i=>i.code===BONE_ITEM&&i.vohon===ids[4]);
  let m=R.bagMsgs??0, l=R.logs.length; R.room.send("unequip",{itemId:off.id}); await waitFor(()=>(R.bagMsgs??0)>m); await sleep(80);
  ok(R.res.prog[2]===23&&R.res.lv[2]===2&&R.logs.slice(l).some(t=>/Cộng minh Hồn cốt còn 2\/3/.test(t)),`tháo 1 hồn cốt: còn 23, mất mốc 3 (${R.logs.slice(l).find(t=>/Cộng minh/.test(t))})`);
  m=R.bagMsgs??0; R.room.send("equip",{itemId:off.id,vohonId:ids[4]}); await waitFor(()=>(R.bagMsgs??0)>m); await sleep(80);
  ok(R.res.lv[2]===3,"gắn lại: mốc Hồn cốt 3");
  // ---- Hồn hạch: 8 / 16 / 24 hồn hạch 5★ trở lên đang gắn ----
  const cores=(n,stars)=>Array.from({length:n},()=>({code:CORE_ITEM,qty:1,stars}));
  await gearUp(ids[5],cores(6,RES_CORE_STARS-1));
  ok(R.res.prog[3]===0,`6 hồn hạch ${RES_CORE_STARS-1}★ đang gắn: không tính`);
  await gearUp(ids[0],cores(6,RES_CORE_STARS)); await gearUp(ids[1],cores(1,RES_CORE_STARS));
  ok(R.res.prog[3]===7&&R.res.lv[3]===0,`7 hồn hạch ${RES_CORE_STARS}★: chưa đạt mốc`);
  e0=R.resEv.length; await gearUp(ids[1],cores(1,RES_CORE_STARS+1));
  ok(R.res.prog[3]===8&&R.res.lv[3]===1&&R.resEv.slice(e0).some(e=>e.pillar===3&&e.step===0&&e.up),"8 hồn hạch 5★ trở lên: mốc Hồn hạch 1");
  await gearUp(ids[1],cores(4,RES_CORE_STARS)); await gearUp(ids[2],cores(4,RES_CORE_STARS));
  ok(R.res.prog[3]===16&&R.res.lv[3]===2,"16 hồn hạch: mốc 2");
  await gearUp(ids[2],cores(2,RES_CORE_STARS)); await gearUp(ids[3],cores(6,RES_CORE_STARS));
  ok(R.res.prog[3]===24&&JSON.stringify(R.res.lv)===JSON.stringify([3,3,3,3]),`24 hồn hạch: đủ 12 mốc (${lvOf()}, ${JSON.stringify(R.res.bonus)})`);
  const all=resonanceBonus([3,3,3,3]);
  ok(R.res.bonus.hp===all.hp&&R.res.bonus.mp===all.mp&&R.res.bonus.atk===all.atk&&R.resEv.filter(e=>e.up).length>=12,
    `tổng cộng minh ${JSON.stringify(all)}, đã báo ${R.resEv.filter(e=>e.up).length} mốc`);
  await checkAll([3,3,3,3],"đủ 12 mốc");
  // Võ hồn trong đội nhưng không ra trận: sinh lực tối đa trong tin squad cũng có cộng minh; đổi vào sau thì chỉ số đang dùng có ngay.
  await test(R,"rest"); await sendTeam(R,[act,ids.find(r=>r!==act&&r!==ids[0])??ids[1],0,0]);
  const bench=R.owned.team[1], bv=R.owned.list.find(v=>v.rowId===bench), bs=await test(R,"stats",{rowId:bench});
  ok(await waitFor(()=>R.squad?.list.find(x=>x.rowId===bench)?.maxHp===bs.stats.maxHp),`võ hồn ngoài sân ${bv.vohon}: sinh lực tối đa trong đội ${bs.stats.maxHp} có cộng minh`);
  R.room.send("switch",{slot:1}); await waitFor(()=>R.owned.active===bench||rme()?.vh===vohonIndex(bv.vohon)); await sleep(150);
  const sw=await test(R,"stats");
  ok(sw.rowId===bench&&sw.live.maxHp===calcStats(vohonIndex(bv.vohon),bv.level,bv.rings.map(tierOfYears),bv.stars,sw.bones,sw.cores,all).maxHp&&rme().maxHp===sw.live.maxHp,
    `đổi ${VOHON[vohonIndex(bv.vohon)].name} vào: sinh lực tối đa ${sw.live.maxHp} có cộng minh`);
  // ---- Thoát vào lại: tiến độ tính lại từ dữ liệu đã lưu, không báo lại mốc ----
  const keep=JSON.stringify([R.res.prog,R.res.lv,R.res.bonus]);
  await test(R,"goto",{x:rme().x,y:rme().y}); await R.room.leave(); await sleep(400);
  R.mapId=(await post("/api/me",{token:R.token})).mapId; await enter(R); await waitFor(()=>R.res&&R.owned&&rme(),3000);
  ok(JSON.stringify([R.res.prog,R.res.lv,R.res.bonus])===keep&&!R.resEv.length,`thoát vào lại: cộng minh giữ nguyên ${keep}, không báo lại mốc`);
  await checkAll([3,3,3,3],"vào lại");
  await R.room.leave();
}
