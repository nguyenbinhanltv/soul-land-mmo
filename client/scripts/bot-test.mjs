// Kiểm thử nhanh: 2 bot đăng nhập, tạo nhân vật (từ 9.9 cả tông da: A tông 2, B không gửi tông da như client cũ nên tông 0, hai bên thấy
// đúng chỉ số của nhau), qua lễ thức tỉnh, vào phòng bản đồ, xếp đội hình, đổi võ hồn trong trận,
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
// mở rương, rút đi, phòng hủy rồi mở lại), boss thế giới ở Lõi Tinh Đấu (BĐ6e: cổng bờ hồ Nội địa, 3 bot cùng đánh, máu theo
// số người, điểm yếu hệ và đổi võ hồn, Bá Thể, ngắt tích lực bằng võ hồn khống chế, thanh tẩy bằng võ hồn phụ trợ, nổi giận, Du Thủy,
// chia thưởng hồn hoàn đỏ / rương, 1 lần/ngày, lặn xuống hồ, đăng xuất ở Lõi về Nội địa), NPC (6.1: nói chuyện khi đứng gần, mua đan đủ / thiếu Hồn Tệ, túi đầy, bán đồ dư theo giá,
// không bán đồ đang gắn / đan, lò rèn cường hóa hồn cốt và nâng cấp hồn hạch, đứng xa bị từ chối, vào lại còn nguyên), nhiệm vụ tân thủ (6.2: tài khoản mới
// đi hết chuỗi của Ngọc Tiểu Cương, mục tiêu đếm theo sự kiện thật, nhận / trả khi đứng xa bị từ chối, thưởng đúng, túi đầy, đi cổng
// và thoát vào lại giữ tiến độ, mục tiêu đã đạt sẵn), tổ đội người chơi (7.1: mời theo tên / bấm vào hồn sư, từ chối, chống spam
// lời mời, tối đa 4, chia kinh nghiệm trong / ngoài 300 pixel và khác bản đồ, +5% mỗi người, giảm chênh cấp từng người, 40/20
// trong đội võ hồn, ưu tiên nhặt cả tổ đội, rời / đuổi / chuyển trưởng nhóm / giải tán, rời game quá lâu), cộng minh (8.2: từng
// mốc của 5 trụ cột Võ hồn / Hồn hoàn / Hồn cốt / Hồn hạch / Sao, chỉ số mọi võ hồn kể cả võ hồn đổi vào sau, thông báo mốc mới, mất mốc
// khi tháo đồ, thoát vào lại vẫn giữ), hồn kỹ vòng 5–10 và Võ Hồn Chân Thân (8.1a: hồn kỹ vòng 5, 6, 10 đúng sức mạnh
// theo năm, chọn 4 ô mang theo và từ chối khi sai / giao chiến, hồi chiêu đi theo hồn kỹ khi đổi ô, Chân Thân tăng chỉ số rồi tắt đúng giờ,
// hồi chiêu riêng, đổi võ hồn thì hết, võ hồn chưa có dữ liệu chỉ tăng chỉ số, Phục Chế không chép tuyệt kỹ, ô lưu sau khi thoát vào lại;
// 8.1b lưu phái Thiêu đốt: vòng 5–6, tuyệt kỹ và Chân Thân của 5 võ hồn, lãnh vực phượng hoàng rộng hơn khi Chân Thân, Viêm bạo toàn vùng;
// 8.1c lưu phái Cảm điện: vòng 5–6, tuyệt kỹ và Chân Thân của 5 võ hồn, sét tìm hồn thú Cảm điện ngoài vùng, Phong Lôi gấp đôi khi Chân Thân,
// Phong ấn đủ tầng thành Dễ thương, Mê hoặc diện rộng, Phục Chế đại thành;
// 8.1d 5 võ hồn còn lại: vòng 5–6, tuyệt kỹ thật Kiếm Trảm Sơn Hà / Quỷ Ảnh Trùng Trùng / Tịnh Thế Lưu Ly, Chân Thân),
// Đại Đấu Hồn Trường (7.2: xếp hàng ở NPC, ghép theo Elo gần nhất, không ghép khi đang đi cổng / trong tổ đội, đấu đội võ hồn trong
// phòng riêng, đánh trúng đối thủ, hạ hết đội / rời sân / không vào sân / hết giờ, Elo, thưởng, về đúng bản đồ và vị trí cũ, bảng xếp
// hạng, cộng minh, Chân Thân (cả lưu phái Thiêu đốt), tuyệt kỹ Tử Vong Chu Hoàng (8.1d), tuyệt kỹ Cảm điện (8.1c: sét tìm đối thủ Cảm điện, Mê hoặc chỉ lên hồn thú) và dự đoán chuyển động trong sân) cần server bật hook kiểm thử: GAME_TEST=1 npm run dev:server.
// Đồng bộ theo vùng gần (11.4, syncViewTest; BOT_ONLY=view chỉ chạy phần này): hồn sư / hồn thú / đồ rơi ở xa không có trong state,
// tinh anh luôn có, lại gần thì có, tin fx ở xa không gửi, bản đồ nhỏ (tin mini), hồn thú xa mọi hồn sư thì ngủ, hook view tắt lọc.
// Các bot khác tắt lọc (hook view all) vì đọc thực thể ở xa.
// Truyền tống trận (11.2, waypointTest; BOT_ONLY=waypoint chỉ chạy phần này): mở khóa khi bước lên, bản đồ thế giới, phí theo số lần đi cổng,
// niệm rồi dịch chuyển cùng / khác bản đồ, cấm khi giao chiến, hủy khi bị đánh / di chuyển, thiếu Hồn Tệ, Hồi Thành Phù, vào lại vẫn nhớ.
// Bản đồ lớn (11.3, bigMapTest; BOT_ONLY=bigmap): server và bot cùng bật MAP_V2=tinh_dau_ngoai_vi thì kiểm Tinh Đấu Ngoại vi ×8 (vùng, mật độ,
// cổng hai chiều, truyền tống trận); mọi bài khác đọc file Tiled theo MAP_V2 (mapUrl) nên chạy được trên bản ×8.
// Nhiều kênh (mục 6): server bật CHANNEL_MAX=2 GAME_TEST=1 thì bot chỉ chạy phần kênh (channelTest) rồi thoát: bot thứ 3 vào kênh 2,
// danh sách và đổi kênh giữ tiến độ, đồng đội tổ đội được xếp chung kênh khi vào game / đi cổng, thú vương mỗi kênh một con.
import { Client } from "colyseus.js";
import { solidGrid, hits, PLAYER_HW, PLAYER_HH } from "../../shared/move.ts";
import { findPath, clearLine, pathLength } from "../src/path.ts";
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { TIERS, TRAVEL_CAST, CHANNEL_CD, TEAM_SIZE, XP_SHARE_ACTIVE, XP_SHARE_BENCH, REVIVE_SECS, RESPAWN_SECS, xpNeed, beastLevel, xpLevelScale,
  BEASTS, MAP_MOVED, XP_LEVEL_CAP,
  VOHON, HE, vohonIndex, calcStats, tierOfYears, TIEN_CO, TIEN_CO_MAX, TIEN_CO_GAIN, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY,
  BAG_SLOTS, DAN_CD, STARTER_ITEMS, itemDef, formatHonTe, formatYears,
  TIER_MULT, SKILLS, skillsOf, skillPower, buffPower, BUFF_SCALE, TIEN_CO_RIENG, tienCoOf, STATUS, statusBit, buffBit, BUFFS, CRIT, PCT_HP_CAP,
  BONDS, bondsOf, BOND_KEYS, bondSum,
  CC_TIER_MULT, BEAST_REGEN, TEAM_COMBAT_SECS, PHOENIX_FIELD_R, PHONG_LOI, BEAST_AGGRO_R, BEAST_WANDER, SPAWN_CLEAR,
  MAPS, MAX_YEARS, beastStats, rollYears, tierBand, parseLevelRange, RING_ITEM, DROP_OWNER_SECS, absorbSecs, absorbChance, ringLimit,
  MAX_RINGS, MAX_LEVEL, SHARD_UNLOCK, STAR_COST, MAX_STARS, starCost, shardChance, shardCode, starMult,
  STAR_SKILL, STAR_SKILL_RINGS, STAR_CD_STARS, STAR_CD, STAR_TIEN_CO_STARS, STAR_TIEN_CO, starSkillMult, starCdMult, starTienCoMult, starRing,
  BONE_ITEM, BONE_SLOTS, boneChance, boneStats, boneName, boneBonus, PICKUP_RANGE,
  BEAST_SKILL_YEARS, beastSkillOf, teleHits, TELE_PAD, TELE_WARN, TELE_FIRST,
  BOSSES, bossIndex, beastIndex, ELITE, ELITE_RAGE, bossHpMult, teleZones, beastBuffBit, BEAST_BUFFS, beastName,
  KING, KING_CHEST, KING_TIMES, kingNext, kingActive, vnDay, vnHHMM, kingShardPool, chestCode, kingYears, BOAT_CAST, RED_BEAST_CHANCE,
  WORLD, WORLD_TIME, WORLD_SLAM, WORLD_RING, WORLD_CHEST, worldNext, worldActive, worldBossOn, HE_IDS,
  HERBS, HERB_MAX, HERB_PCT, HERB_ELITE, herbChance, herbBonus, parseHerbs,
  BONE_SKILLS, BONE_ACTIVE_SLOTS, BONE_PASSIVE_CAP, boneSkillOf, bonePassive,
  BONE_MAX_ENHANCE, BONE_FEED_PER_YEAR, BONE_FEED_SAME_SLOT, BONE_FEED_CARRY, boneFeedXp, boneEnhanceLevel, boneEnhanceNeed, boneSkillMult,
  boneEnhancePreview,
  CORE_ITEM, CORE_SETS, CORE_SUBS, CORE_SUB_ROLL, CORE_STATS, CORE_STAT_IDS, CORE_STAR_K, CORE_MAP_SET, MAX_CORE_STARS, coreChance, coreStarBand, rollCore, rollCoreStats,
  coreSubMax, coreSetIndex, coreName, coreStatText, coreMainValue, CORE_SLOTS, CORE_SET_FX, coreBonus, coreFx,
  CORE_MAX_ENHANCE, CORE_FEED_STAR, CORE_FEED_SAME_SET, CORE_FEED_CARRY, CORE_ENHANCE_MAIN, CORE_MAX_SUBS, coreFeedXp, coreEnhanceLevel, coreEnhanceNeed,
  coreEnhancePreview, coreUpgradeSubs, coreSubRolls,
  NPCS, npcDef, NPC_RANGE, SHOP, SHOP_MAX_QTY, sellPrice, ringSellPrice, RING_SELL, BONE_SELL, BONE_SELL_ENH, CORE_SELL, SHARD_SELL,
  BAG_EXPAND, BAG_MAX_SLOTS, BAG_EXPAND_COST, bagExpandCost, bagSlotsOf, BUYBACK_MAX,
  QUEST_STARTER, questChain, questStart, parseQuest, questStatus, questRewardText, SWITCH_CD,
  DAILY, DAILY_POOL, dailyIds, dailyKey, dailyPicks, isDaily, fitBeast, fitMaps,
  HIGH_RINGS, CHAN_THAN_RING, DEFAULT_LOADOUT, ringSkill, skillChoices, loadoutOf, parseLoadout, chanThanOf, chanThanStats, phoenixFieldR, CHAN_THAN_SKILL_SLOT, CHAN_THAN_SKILL_COST, CHAN_THAN_SKILL_CD,
  PARTY_MAX, PARTY_XP_RANGE, PARTY_INVITE_SECS, PARTY_OFFLINE_SECS, partyXpShare, PARTY_BUFF_R, PARTY_BUFF_MULT, PARTY_BUFF_SKIP, SUPPORT_CONTRIB, COPY_R, COPY_WINDOW,
  RESONANCE, RES_VOHON_LEVEL, RES_BONE_ENHANCE, RES_CORE_STARS, resonanceProgress, resonanceLevels, resonanceBonus,
  ARENA, ARENA_MAP, ARENA_SHARDS, eloAfter, arenaWindow, arenaPairs, arenaRanked, EXTRA_VOHON, AWAKEN_CHOICES, SKIN_TONES, parseLooks,
  PLAYER_SPEED, RUN_MULT, BEAST_GAIT, BEAST_LEASH, TICK_RATE,
  WAYPOINT_CAST, WAYPOINT_FEE, waypointFee, SYNC_VIEW } from "../../shared/data.ts";
import { SAFE_REGEN_MULT, hpRegen, mpRegen } from "../../shared/data.ts"; // hồi sinh lực / hồn lực, vùng an toàn (#112)
const API=process.env.SERVER_URL??"http://localhost:2567", WS=API.replace(/^http/,"ws");
const post=async(p,b)=>{const r=await fetch(API+p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}); return {status:r.status,...await r.json()};};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const waitFor=async(fn,ms=2000)=>{for(let t=0;t<ms;t+=50){if(fn()) return true; await sleep(50);} return false;};
// Mật khẩu bot sinh ngẫu nhiên mỗi lần chạy (không ghi cứng trong mã); tên bot kèm hậu tố lần chạy nên luôn là tài khoản mới.
const PASS=randomUUID(), RUN=Date.now().toString(36).slice(-5);
// 11.3: server bật MAP_V2 (bản đồ dựng lại bằng tools/maps, `<mapId>.v2.json`) thì chạy bot với cùng MAP_V2 để đọc đúng file Tiled.
const MAP_V2=new Set((process.env.MAP_V2??"").split(",").map(s=>s.trim()).filter(Boolean));
const mapFileOf=m=>(MAP_V2.has(m)||MAP_V2.has("all"))&&existsSync(new URL(`../../shared/assets/${m}.v2.json`,import.meta.url))?`${m}.v2`:m;
const mapUrl=m=>new URL(`../../shared/assets/${mapFileOf(m)}.json`,import.meta.url);
let fails=0; const ok=(cond,msg)=>{console.log(cond?"  ✓":"  ✗",msg); if(!cond) fails++;};

// Tạo nhân vật (một lần, trước lễ thức tỉnh; tài khoản cũ chọn lại một lần), rồi lễ thức tỉnh:
// tài khoản mới tự chọn 1 SSR (kèm Lam Ngân Thảo); tài khoản cũ không thức tỉnh lại được.
async function bot(name,choice,looks,near=false){
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
    ok(r.status===200&&r.looks?.chosen&&r.looks.hairCol===looks.hairCol&&r.looks.skin===(looks.skin??0),`tạo nhân vật ${JSON.stringify(looks)}, tông da ${r.looks?.skin}`);
  }
  ok((await post("/api/looks",{token:l.token,...looks})).status===409,"tạo nhân vật lần hai -> 409");
  const me=await post("/api/me",{token:l.token});
  ok(me.looks?.chosen&&me.looks.skin===(l.looks?.chosen?l.looks.skin:looks.skin??0),`/api/me: đã tạo nhân vật, tông da ${me.looks?.skin}`);
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
async function enter(b,roomId){
  // Bản đồ đang đứng lấy từ /api/me (server lưu); client chỉ chuyển mapId để ghép phòng.
  const opts={token:b.token,mapId:b.mapId};
  b.room=roomId?await new Client(WS).joinById(roomId,opts):await new Client(WS).joinOrCreate("map",opts);
  b.owned=null; b.ownedMsgs=0; b.portal=null; b.travel=null; b.squad=null;
  b.chans=null; b.room.onMessage("channels",m=>{b.chans=m;}); // danh sách kênh (mục 6 "Nhiều kênh")
  b.mini=null; b.room.onMessage("mini",m=>{b.mini=m;}); // bản đồ nhỏ: vị trí cả bản đồ (11.4)
  b.leftCode=null; b.room.onLeave(c=>{b.leftCode=c;});
  // Đại Đấu Hồn Trường (7.2): xếp hàng / đã ghép / pha trận / kết quả, bảng xếp hạng.
  b.arena=[]; b.aq=null; b.aqN=0; b.room.onMessage("arena",m=>{b.arena.push(m); if(m.k==="queue"){b.aq=m; b.aqN++;}});
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
  b.room.onMessage("vohons",m=>{b.owned=m; b.ownedMsgs++;});
  b.room.onMessage("squad",m=>{b.squad=m; b.squadMsgs=(b.squadMsgs??0)+1;});
  b.room.onMessage("ko",m=>{b.ko=m;});
  // Bản vá state đi riêng với tin nhắn (máy bận thì tới sau cả trăm ms): đếm bản vá, test() chờ bản vá đầu tiên sau tin trả hook.
  b.patchN=0; b.room.onStateChange(()=>{b.patchN++;});
  b.room.onMessage("test",m=>{b.test=m; b.testPatch=b.patchN;});
  b.room.onMessage("bag",m=>{b.bag=m; b.bagMsgs=(b.bagMsgs??0)+1;});
  b.room.onMessage("absorbing",m=>{b.absorbing=m;});
  b.room.onMessage("enhanced",m=>{b.enh=m;}); // kết quả cường hóa hồn cốt (4.4)
  b.room.onMessage("enhancedcore",m=>{b.coreUp=m;}); // kết quả nâng cấp hồn hạch (5.3)
  b.npc=null; b.room.onMessage("npc",m=>{b.npc=m;}); // server cho mở hộp thoại NPC (6.1)
  b.party=null; b.partyMsgs=0; b.room.onMessage("party",m=>{b.party=m; b.partyMsgs++;}); // khung tổ đội (7.1)
  b.quest=null; b.questMsgs=0; b.room.onMessage("quest",m=>{b.quest=m; b.questMsgs++;}); // tiến độ nhiệm vụ tân thủ (6.2)
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
/** Thành đặt Đại Đấu Hồn Trường (từ BĐ6a; 7.2 là lối vào tạm ở Nặc Đinh Thành). */
const AT="thien_dau_thanh";
/** Chỗ đứng của NPC `id` trong file Tiled của bản đồ (object `npc`, thuộc tính `npc`). */
const npcSpot=(mapId,id)=>{ const o=JSON.parse(readFileSync(mapUrl(mapId),"utf8")).layers.flatMap(l=>l.objects??[])
  .find(o=>o.type==="npc"&&(o.properties??[]).find(q=>q.name==="npc")?.value===id); return o?{x:o.x,y:o.y}:null; };
/** Gửi `talk {npc}`; trả mã NPC nếu server cho mở hộp thoại (tin `npc`), null nếu bị từ chối (một dòng log). */
async function talk(b,npc){ b.npc=null; const l=b.logs.length; b.room.send("talk",{npc}); await waitFor(()=>b.npc||b.logs.length>l,1500); return b.npc?.id??null; }
/** Gửi `buy` / `sell`; server luôn trả một dòng log (kết quả hoặc lý do) rồi túi mới. Trả dòng log đó. */
async function trade(b,type,msg){ const n=b.bagMsgs??0, l=b.logs.length; b.room.send(type,msg); await waitFor(()=>(b.bagMsgs??0)>n&&b.logs.length>l,1500); return b.logs.at(-1)??""; }
const looseOf=b=>(b.bag?.items??[]).filter(i=>i.vohon===null);
/** Gửi đội hình rồi chờ server gửi lại đội (đã lưu hoặc bị từ chối). */
async function sendTeam(b,slots){ const n=b.ownedMsgs; b.room.send("team",{slots}); await waitFor(()=>b.ownedMsgs>n); return b.owned.team; }
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

// ---- Nhiều kênh (mục 6): cần server hạ số người mỗi kênh, CHANNEL_MAX=2 GAME_TEST=1 npm run dev:server. Khi đó bot chỉ chạy phần
// này rồi thoát (các phần khác cần nhiều bot chung một phòng); server bình thường (60 người / kênh) thì bỏ qua phần này. ----
const health=await fetch(API+"/health").then(r=>r.json()).catch(()=>({}));
if(health.chMax===2){ await channelTest(); console.log(fails?`✗ ${fails} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(fails?1:0); }
// BOT_ONLY=daily: chỉ chạy phần khảo hạch hằng ngày (thử nhanh khi sửa phần đó; lần chạy đầy đủ vẫn gồm phần này).
if(process.env.BOT_ONLY==="waypoint"){ await waypointTest(); console.log(fails?`✗ ${fails} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(fails?1:0); }
if(process.env.BOT_ONLY==="bigmap"){ await bigMapTest(); console.log(fails?`✗ ${fails} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(fails?1:0); }
if(process.env.BOT_ONLY==="view"){ await syncViewTest(); console.log(fails?`✗ ${fails} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(fails?1:0); }
if(process.env.BOT_ONLY==="daily"){ await dailyTest(); console.log(fails?`✗ ${fails} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(fails?1:0); }
console.log(`  ⚠ bỏ qua kiểm tra nhiều kênh (server ${health.chMax??"?"} người / kênh): chạy thêm một lần với server CHANNEL_MAX=2 GAME_TEST=1`);
/**
 * Bot thứ 3 vào kênh 2; danh sách kênh; đổi kênh (từ chối khi đầy / chưa mở / đang ở / giao chiến / vừa đổi) giữ tiến độ chưa lưu và
 * vị trí; vào game và đi cổng ưu tiên kênh của đồng đội tổ đội, không thì kênh ít người nhất còn chỗ; thú vương mỗi kênh một con,
 * báo toàn server qua mọi kênh, đổi kênh rồi hạ thú vương kênh khác trong cùng khung giờ không nhận thêm rương.
 */
async function channelTest(){
  console.log(`\n== Nhiều kênh: server ${health.chMax} người / kênh ==`);
  const chOf=b=>b.room.state.channel, meC=b=>b.room.state.players?.get(b.room.sessionId);
  const T=async(b,op,extra={})=>{ b.test=null; b.room.send("test",{op,...extra}); await waitFor(()=>b.test,2000); await sleep(80); return b.test; };
  const say=async(b,type,msg)=>{ const l=b.logs.length; b.room.send(type,msg); await waitFor(()=>b.logs.length>l,2000); await sleep(50); return b.logs.slice(l).join(" | "); };
  const chans=async b=>{ await sleep(1050); b.chans=null; b.room.send("channels"); await waitFor(()=>b.chans,1500); return b.chans; };
  const fresh=async b=>{ b.owned=null; b.bag=null; b.room.send("vohons"); b.room.send("bag"); await waitFor(()=>b.owned&&b.bag&&meC(b),2000); };
  /** Đi theo tin `travel` như client: rời phòng cũ, vào đúng phòng server chọn (roomId null thì joinOrCreate). */
  const follow=async b=>{ const t=b.travel; await b.room.leave(); await sleep(200); b.mapId=t.mapId; await enter(b,t.roomId??undefined); await fresh(b); };
  const prog=b=>JSON.stringify(b.owned.list.map(v=>[v.rowId,v.level,v.xp,v.stars,v.rings]));
  const pact=async(b,op,extra,w)=>{ const n=w.partyMsgs; b.room.send("party",{op,...extra}); await waitFor(()=>w.partyMsgs>n,2000); await sleep(120); };

  // ---- Phòng đầy thì mở kênh mới; số kênh đồng bộ cho client ----
  const P1=await bot("Kenh P1","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:1,outfitCol:1}), P2=await bot("Kenh P2","nhu_cot_tho",{sex:1,hair:1,hairCol:2,outfitCol:2});
  await waitFor(()=>chOf(P1)&&chOf(P2));
  ok(P1.room.roomId===P2.room.roomId&&chOf(P1)===1&&chOf(P2)===1,`P1, P2 cùng kênh ${chOf(P1)} của ${P1.room.state.mapId}`);
  const P3=await bot("Kenh P3","u_minh_linh_mieu",{sex:0,hair:2,hairCol:3,outfitCol:3}); await waitFor(()=>chOf(P3));
  ok(P3.room.roomId!==P1.room.roomId&&chOf(P3)===2&&P3.room.state.mapId===P1.room.state.mapId,`bot thứ 3 vào kênh ${chOf(P3)} (kênh 1 đã đủ 2 người)`);
  ok((await T(P3,"chan")).chMax===2,"hook chan: 2 người / kênh");
  let cl=await chans(P3);
  ok(cl?.cur===2&&JSON.stringify(cl.list)===JSON.stringify([{ch:1,n:2,max:2,full:true},{ch:2,n:1,max:2,full:false}]),`danh sách kênh: ${JSON.stringify(cl)}`);
  // Xin dồn trong 1 giây (mở, đóng, mở lại bảng): không bị bỏ, server gửi lại khi hết giây đó.
  await sleep(1050); let nCh=0; P3.room.onMessage("channels",m=>{P3.chans=m; nCh++;}); P3.room.send("channels"); await sleep(100); P3.room.send("channels");
  ok(await waitFor(()=>nCh>=2,2500),`xin danh sách 2 lần trong 1 giây: nhận đủ ${nCh} lần (lần sau được hẹn gửi lại)`);
  ok(/đã đầy/.test(await say(P3,"channel",{ch:1})),"đổi sang kênh 1 (đã đầy) bị từ chối");
  ok(/không còn mở/.test(await say(P3,"channel",{ch:3})),"kênh 3 (chưa mở) bị từ chối");
  ok(/Đang ở kênh 2/.test(await say(P3,"channel",{ch:2})),"chọn kênh đang ở bị từ chối");
  ok(/không hợp lệ/.test(await say(P3,"channel",{ch:"x"})),"số kênh sai kiểu bị từ chối");

  // ---- Đổi kênh giữ tiến độ chưa lưu (kinh nghiệm, túi đồ) và vị trí: lưu như đi cổng ----
  await fresh(P2); await T(P2,"kill",{tier:1}); await T(P2,"give",{code:"hoi_huyet_dan",qty:3}); await fresh(P2);
  await T(P2,"lei",{v:0}); // vừa giao chiến
  ok(/giao chiến/.test(await say(P2,"channel",{ch:2})),"đang giao chiến thì không đổi kênh được");
  await T(P2,"rest",{s:TEAM_COMBAT_SECS+1}); await fresh(P2);
  const before={prog:prog(P2),bag:bagKey(P2),x:meC(P2).x,y:meC(P2).y};
  P2.travel=null; const l2=await say(P2,"channel",{ch:2});
  ok(/Đang chuyển sang kênh 2/.test(l2)&&await waitFor(()=>P2.travel,3000)&&P2.travel.mapId===P2.mapId&&P2.travel.roomId===P3.room.roomId,
    `đổi sang kênh 2: "${l2}", travel ${JSON.stringify(P2.travel)}`);
  await follow(P2);
  ok(P2.room.roomId===P3.room.roomId&&chOf(P2)===2,`P2 vào kênh ${chOf(P2)} cùng P3`);
  ok(prog(P2)===before.prog&&bagKey(P2)===before.bag,`đổi kênh giữ tiến độ: võ hồn ${before.prog}, túi đồ giữ nguyên`);
  ok(Math.hypot(meC(P2).x-before.x,meC(P2).y-before.y)<1,`giữ vị trí (${before.x.toFixed(0)},${before.y.toFixed(0)}) -> (${meC(P2).x.toFixed(0)},${meC(P2).y.toFixed(0)})`);
  ok(/Vừa đổi kênh/.test(await say(P2,"channel",{ch:1})),`đổi lại ngay: phải chờ ${CHANNEL_CD} giây`);
  cl=await chans(P1); ok(JSON.stringify(cl?.list.map(c=>[c.ch,c.n]))==="[[1,1],[2,2]]",`sau khi đổi: kênh 1 có 1 người, kênh 2 có 2 người (${JSON.stringify(cl?.list)})`);
  // Thoát vào lại: tiến độ đã nằm trong DB (transaction đổi kênh), không phải chỉ trong bộ nhớ phòng.
  // Tự rời rồi joinById kênh khác không né được luật đổi kênh: CHANNEL_CD giây chỉ vào lại được kênh vừa rời; /api/channel đưa về đó.
  await P2.room.leave(); await sleep(400);
  let pick=await post("/api/channel",{token:P2.token});
  ok(pick.mapId===P2.mapId&&pick.roomId===P3.room.roomId,"vừa tự rời kênh 2: /api/channel đưa về đúng kênh 2");
  let dodge=""; try{ const r=await new Client(WS).joinById(P1.room.roomId,{token:P2.token,mapId:P2.mapId}); await r.leave(); dodge="vào được"; }catch(e){ dodge=String(e?.message??e); }
  ok(/Vừa rời kênh 2/.test(dodge),`tự rời rồi joinById kênh 1 ngay: bị từ chối ("${dodge}")`);
  await enter(P2,pick.roomId); await fresh(P2);
  ok(chOf(P2)===2&&prog(P2)===before.prog&&bagKey(P2)===before.bag,"thoát vào lại kênh 2: tiến độ trước khi đổi kênh vẫn còn (đã lưu)");
  await T(P2,"chan",{nolock:1}); await P2.room.leave(); await sleep(400); // hook: lần rời này không khóa kênh
  pick=await post("/api/channel",{token:P2.token});
  ok(pick.roomId===P1.room.roomId,"không tổ đội, không vừa rời kênh nào: vào game ở kênh ít người nhất còn chỗ (bằng nhau thì kênh số nhỏ hơn): kênh 1");
  await enter(P2,pick.roomId); await fresh(P2); ok(chOf(P2)===1,"P2 vào kênh 1");

  // ---- Tổ đội: vào game / đi cổng ưu tiên kênh của đồng đội ----
  await T(P3,"party",{pop:"rlreset"});
  await pact(P3,"invite",{name:P2.name},P2); await pact(P2,"accept",{name:P3.name},P3); await waitFor(()=>P3.party?.members?.length===2,2000);
  const m2=P3.party?.members.find(m=>m.name===P2.name);
  ok(m2&&!m2.sid&&m2.map===P2.mapId&&m2.ch===1,`khung tổ đội của P3 (kênh 2) ghi P2 ở ${m2?.map} · Kênh ${m2?.ch}`);
  await T(P2,"chan",{nolock:1}); await P2.room.leave(); await sleep(400);
  pick=await post("/api/channel",{token:P2.token});
  ok(pick.roomId===P3.room.roomId,"có tổ đội: vào game ở kênh của đồng đội (kênh 2) dù kênh 1 cũng còn chỗ");
  await enter(P2,pick.roomId); await fresh(P2); ok(P2.room.roomId===P3.room.roomId&&chOf(P2)===2,"P2 vào kênh 2 cùng đồng đội P3");
  // Đi cổng (hook warp, cùng transaction đi cổng): P3 mở kênh ở Ngoại vi, đồng đội P2 được xếp vào đó, P1 (không tổ đội) sang kênh 2.
  const NV="tinh_dau_ngoai_vi";
  P3.travel=null; await T(P3,"warp",{mapId:NV,x:0,y:0}); await waitFor(()=>P3.travel,3000);
  ok(P3.travel?.mapId===NV&&P3.travel.roomId===null,`P3 đi cổng tới ${NV}: chưa có kênh nào (roomId null, client mở kênh mới)`);
  await follow(P3);
  P2.travel=null; await T(P2,"warp",{mapId:NV,x:0,y:0}); await waitFor(()=>P2.travel,3000);
  ok(P2.travel?.roomId===P3.room.roomId,"đồng đội P2 đi cổng: server chọn đúng kênh của P3");
  await follow(P2);
  P1.travel=null; await T(P1,"warp",{mapId:NV,x:0,y:0}); await waitFor(()=>P1.travel,3000); await follow(P1);
  ok(chOf(P3)===1&&chOf(P2)===1&&chOf(P1)===2,`Ngoại vi: P3, P2 kênh ${chOf(P3)}; P1 kênh ${chOf(P1)} (kênh 1 đầy)`);

  // ---- Thú vương: mỗi kênh một con (suất theo bản đồ), báo toàn server mọi kênh, mỗi khung giờ một rương dù đổi kênh ----
  const king=b=>[...b.room.state.beasts.values()].find(x=>x.rank===2), chestN=b=>qtyOf(b,chestCode("huyet_nguyet_lang_vuong"));
  await T(P1,"king",{kop:"spawn"});
  ok(await waitFor(()=>king(P1)&&king(P3),2000),"thú vương xuất hiện ở cả hai kênh của Ngoại vi (mỗi kênh một con)");
  /** Đứng cạnh thú vương trong hang rồi hạ ngay (hook kdmg). */
  async function slayKing(b){ const ki=await T(b,"king"), L=ki.lair; const inL=(x,y)=>x>=L.x&&x<=L.x+L.w&&y>=L.y&&y<=L.y+L.h;
    for(const [dx,dy] of [[30,0],[-30,0],[0,30],[0,-30],[40,40],[-40,-40]]){ const x=Math.round(ki.x+dx), y=Math.round(ki.y+dy); if(!inL(x,y)) continue;
      await T(b,"goto",{x,y}); if(Math.hypot(meC(b).x-x,meC(b).y-y)<1) break; }
    await T(b,"kdmg",{v:1e8}); }
  P3.chats=[]; P1.logs=[]; await slayKing(P1);
  ok(await waitFor(()=>!king(P1)&&chestN(P1)===1,3000),`P1 hạ thú vương kênh 2: nhận rương (${P1.logs.find(t=>/lượt/.test(t))??P1.logs.slice(-2).join(" | ")})`);
  ok(await waitFor(()=>P3.chats.some(m=>/đã bị hạ/.test(m.text)),1500)&&king(P3),`kênh 1 nhận thông báo toàn server ("${P3.chats.find(m=>/bị hạ/.test(m.text))?.text}"), thú vương kênh 1 vẫn còn`);
  await P2.room.leave(); await sleep(300); // kênh 1 còn chỗ
  await T(P1,"rest",{s:TEAM_COMBAT_SECS+1}); await T(P1,"chan",{reset:1});
  P1.travel=null; await say(P1,"channel",{ch:1}); await waitFor(()=>P1.travel,3000); await follow(P1);
  ok(chOf(P1)===1&&king(P1),"P1 đổi sang kênh 1 (vẫn trong khung giờ đó, thú vương kênh 1 còn sống)");
  P1.logs=[]; await slayKing(P1); await waitFor(()=>!king(P1),3000); await sleep(400);
  ok(!king(P1)&&chestN(P1)===1&&/đã nhận rương của khung giờ này ở kênh khác/.test(P1.logs.join("\n")),
    `hạ thú vương kênh 1 trong cùng khung giờ: không nhận thêm rương ("${P1.logs.find(t=>/kênh khác/.test(t))??P1.logs.slice(-3).join(" | ")}")`);

  // ---- BĐ6a: Thiên Đấu Thành chia kênh như mọi bản đồ (P3 mở kênh 1, P1 vào cùng, P2 vào kênh 2 khi kênh 1 đầy) ----
  const TD=AT;
  for(const b of [P1,P3]) await T(b,"rest",{s:TEAM_COMBAT_SECS+1});
  P3.travel=null; await T(P3,"warp",{mapId:TD,x:40*16,y:49.5*16}); await waitFor(()=>P3.travel,3000);
  ok(P3.travel?.mapId===TD&&P3.travel.roomId===null,`P3 tới ${MAPS[TD].name}: chưa có kênh nào (roomId null)`);
  await follow(P3);
  P1.travel=null; await T(P1,"warp",{mapId:TD,x:41*16,y:49.5*16}); await waitFor(()=>P1.travel,3000);
  ok(P1.travel?.roomId===P3.room.roomId,"P1 tới Thiên Đấu Thành: vào kênh 1 còn chỗ của P3"); await follow(P1);
  { const pick=await post("/api/channel",{token:P2.token}); await enter(P2,pick.roomId??undefined); await fresh(P2); }
  P2.travel=null; await T(P2,"warp",{mapId:TD,x:39*16,y:49.5*16}); await waitFor(()=>P2.travel,3000); await follow(P2);
  ok(P2.room.state.mapId===TD&&chOf(P3)===1&&chOf(P1)===1&&chOf(P2)===2&&P2.room.roomId!==P3.room.roomId,
    `Thiên Đấu Thành: P3, P1 kênh ${chOf(P3)}; P2 kênh ${chOf(P2)} (kênh 1 đầy, đồng đội P3 không còn chỗ)`);
  cl=await chans(P2); ok(JSON.stringify(cl?.list.map(c=>[c.ch,c.n]))==="[[1,2],[2,1]]",`danh sách kênh Thiên Đấu Thành: ${JSON.stringify(cl?.list)}`);
  for(const b of [P1,P2,P3]) await b.room.leave();
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
  ok(A.looks.skin===2&&aSeen?.skin===2,`9.9: A tạo nhân vật tông da 2 (${SKIN_TONES[2].name}), B thấy chỉ số ${aSeen?.skin}`);
  ok(B.looks.skin===0&&bSeen?.skin===0,`9.9: B không chọn tông da (như tài khoản cũ) vẫn tông 0, A thấy chỉ số ${bSeen?.skin}`);
  ok(SKIN_TONES.length===3&&SKIN_TONES.every(t=>t.ramp.length===3&&t.ramp.every(c=>/^#[0-9a-f]{6}$/.test(c)))&&SKIN_TONES[0].ramp[1]==="#f1c7a0",
    `9.9: SKIN_TONES 3 tông, mỗi tông 3 sắc, tông 0 quanh #f1c7a0: ${SKIN_TONES.map(t=>t.name).join(", ")}`);
  const gpl=readFileSync(new URL("../../art/palette.gpl",import.meta.url),"utf8").toLowerCase();
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
/** Mọi hồn thú trong phòng của bot `b` có tuổi nằm trong khoảng `years` của một vùng gần đó (bảng 5.3), bậc và máu suy từ số năm. */
function checkBeastYears(b){
  const s=b.room.state, map=JSON.parse(readFileSync(mapUrl(s.mapId),"utf8"));
  const prop=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  const zs=map.layers.flatMap(l=>l.objects??[]).filter(o=>(o.type??o.class)==="zone").map(o=>({...o,yr:parseLevelRange(prop(o,"years")),
    sp:String(prop(o,"beasts")??"").split(",").map(x=>x.split(":")[0].trim()).filter(Boolean)}));
  const bad=[], ys=[]; let n=0;
  s.beasts.forEach(x=>{ if(x.rank===2) return; // thú vương (BĐ5) kiểm riêng: niên hạn kingYears, có thể khác mức trên của vùng (BĐ6d)
    n++; ys.push(x.years);
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
// Trong làng (vùng safe) không có hồn thú: theo đường làng đông–tây (hàng ô 27–28, tools/gen-map.mjs) ra Bãi tập rồi mới săn.
const safe=JSON.parse(readFileSync(mapUrl(st.mapId),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="safe");
const inSafeOf=b=>{ const q=b.room.state.players.get(b.room.sessionId); return !!safe&&q.x>=safe.x&&q.x<=safe.x+safe.width&&q.y>=safe.y&&q.y<=safe.y+safe.height; };
const inSafe=()=>inSafeOf(A);
/**
 * Đi thẳng tới (tx, ty), mỗi 50 ms chỉnh lại hướng; trả về true khi tới cách dưới 3 pixel. Từ 11.1 ngoài giao chiến chạy tới
 * spd / TICK_RATE ≈ 7,6 pixel mỗi nhịp, dài hơn khoảng ±3 pixel: đi hết cỡ thì có thể bước qua đích rồi lắc qua lại. Gần đích
 * thì đẩy cần nhẹ (server nhân tốc độ theo độ dài input), mỗi nhịp đi khoảng nửa quãng còn lại nên hội tụ dù input tới trễ một nhịp.
 */
async function goTo(b,tx,ty,ms=8000){
  const q=b.room.state.players.get(b.room.sessionId);
  const ok=await waitFor(()=>{ const dx=tx-q.x, dy=ty-q.y, d=Math.hypot(dx,dy); if(d<3) return true;
    const k=Math.min(1,d/(2*Math.max(q.spd,1)/TICK_RATE));
    b.room.send("input",{x:+(k*dx/d).toFixed(2),y:+(k*dy/d).toFixed(2)}); return false; },ms);
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
// Di chuyển (11.1): ngoài giao chiến tự chạy × RUN_MULT, input `w` (giữ Shift) đi bộ, giao chiến thì đi bộ; hồn thú đuổi nhanh hơn
// lang thang rồi bỏ đuổi về chỗ sinh và hồi máu; bấm chuột tìm đường A* (client/src/path.ts) đi vòng vật cản trên lưới va chạm của server.
if((await test(A,"ping"))?.enabled){
  const home=[p.x,p.y], act0=A.owned.active; // vừa ra khỏi làng: phần săn hồn thú sau khối này bắt đầu từ đây
  const grid=solidGrid(JSON.parse(readFileSync(new URL(`../../shared/assets/${st.mapId}.json`,import.meta.url),"utf8")));
  const walkSpd=PLAYER_SPEED*VOHON[p.vh].spd, near=(a,b)=>Math.abs(a-b)<0.05*b;
  const gait=async(msg,want)=>{ A.room.send("input",msg); return waitFor(()=>p.moving&&want(),1500); };
  await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
  ok(await gait({x:1,y:0},()=>p.calm&&!p.walk&&near(p.spd,walkSpd*RUN_MULT)),`ngoài giao chiến: tự chạy ${p.spd.toFixed(1)} ≈ ${(walkSpd*RUN_MULT).toFixed(1)} px/giây (calm ${p.calm})`);
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
/**
 * Hook kiểm thử: gửi `test {op}`, chờ tin trả rồi chờ bản vá state đầu tiên tới sau tin đó (mọi thay đổi state của hook nằm trong bản
 * vá ấy; tin nhắn và bản vá đi riêng nên đọc state ngay khi tin trả tới có lúc còn số cũ, vd sinh lực trước `hurt`).
 */
async function test(b,op,extra={}){ b.test=null; const n=b.ownedMsgs; b.room.send("test",{op,...extra}); await waitFor(()=>b.test&&b.ownedMsgs>n);
  const t=b.test; if(t) await waitFor(()=>b.patchN>b.testPatch,600); await sleep(30); return t; }
/**
 * Tung hồn kỹ ô `i` rồi chờ `wait` ms tính từ lúc server đã xử lý (fx soulring của chính mình, hoặc dòng log từ chối), không từ lúc
 * gửi: máy bận thì lệnh tới server muộn cả trăm ms, đọc sát thương sau một khoảng cố định tính từ lúc gửi có lúc chưa có nhát nào.
 */
async function skillCast(b,i,wait){ b.dmgs=[]; b.fxs=[]; const l=b.logs.length; b.room.send("skill",{i});
  await waitFor(()=>b.fxs.some(f=>f.k==="soulring"&&f.id===b.room.sessionId)||b.logs.length>l,1500); await sleep(wait); }
/**
 * Giờ của lịch boss phía server (hook `king` trả `clock`, `clockMode`): với GAME_TEST=1 server mặc định cho lịch đứng yên ngoài mọi
 * khung (BOSS_CLOCK ở server/src/schedule.ts), nên lịch thật 20:00 / 21:00 / 22:00 không chen vào bài thử boss. Server cũ thì giờ thật.
 */
async function bossClock(b){ const k=await test(b,"king"); return {now:k?.clock??Date.now(),mode:k?.clockMode??"real"}; }
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
if(!(await test(A,"ping"))?.enabled) console.log("  ⚠ bỏ qua kiểm tra 2.3b (gục, hồi sinh, chia kinh nghiệm): bật server bằng GAME_TEST=1");
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
  const E=await bot("Tester E","u_minh_linh_mieu",{sex:0,hair:2,hairCol:2,outfitCol:3});
  await waitFor(()=>E.owned&&E.squad&&meOf(E)); const me=meOf(E);
  for(const vohon of ["hao_thien_chuy","cuu_bao_luu_ly_thap","bich_lan_xa_hoang","tu_vong_chu_hoang"]) await test(E,"grant",{vohon});
  ok(FIVE.every(id=>E.owned.list.some(v=>v.vohon===id)),`E sở hữu 5 võ hồn mẫu (hook grant): ${E.owned.list.map(v=>v.vohon).join(", ")}`);
  const rowE=id=>E.owned.list.find(v=>v.vohon===id).rowId, YRS=[423,764,1760,5000], P=i=>skillPower(YRS[i]), BP=i=>buffPower(YRS[i]);
  const atkE=id=>calcStats(vohonIndex(id),40,YRS.map(tierOfYears),1,{},{},E.res?.bonus).atk; // E đủ mốc cộng minh Võ hồn / Hồn hoàn (8.2)
  for(const id of [...FIVE,"tu_vong_chu_hoang"]) await test(E,"set",{rowId:rowE(id),level:40,xp:0,rings:YRS});
  ok(await leaveSafe(E),"E: ra khỏi làng");
  {
    // Vùng an toàn (BĐ2): không tung hồn kỹ; sát thương theo thời gian của người đứng trong làng tạm dừng, ra ngoài thì tiếp tục;
    // sinh lực / hồn lực trong làng hồi nhanh hơn ngoài rừng (#112).
    const ry=27.5*16, out=safe.x+safe.width+30, bid=await spawnNear(E,3,40), pc=STATUS.poison.col, ticks=()=>E.dmgs.filter(d=>d.bid===bid&&d.c===pc);
    await test(E,"status",{s:"stun",secs:30}); await test(E,"status",{s:"poison",n:2,secs:30});
    E.dmgs=[]; ok(await waitFor(()=>ticks().length,1500),`Trúng độc ngoài làng: mất ${ticks()[0]?.v} mỗi giây`);
    await goTo(E,safe.x+safe.width-24,ry); ok(inSafeOf(E),"E vào làng");
    E.dmgs=[]; await test(E,"ready"); E.room.send("skill",{i:0}); ok(await lastLog(E,/Vùng an toàn/),"trong làng: không tung hồn kỹ");
    await sleep(2200); ok(!ticks().length,"trong làng: độc do mình gây tạm dừng, không gây sát thương");
    // #112: hồi sinh lực / hồn lực 1 giây (hook pregen chạy đúng regenPlayer): khớp hpRegen / mpRegen, trong làng nhanh gấp SAFE_REGEN_MULT.
    const regen=async(inside,hit)=>{ const r=await test(E,"pregen",{s:1,hp:20,mp:0,hit});
      if(typeof r?.hp!=="number"){ ok(false,`${inside?"trong":"ngoài"} làng: hook pregen không chạy (E gục / đang đi cổng?)`); return {hp:NaN,mp:NaN}; }
      const hp=Math.min(r.maxHp-r.hp0,hpRegen(r.maxHp,hit?0:99,inside)), mp=Math.min(r.maxMp-r.mp0,mpRegen(r.level,VOHON[r.vh].mp,inside));
      ok(r.safe===inside&&Math.abs(r.hp-hp)<1e-6&&Math.abs(r.mp-mp)<1e-6,
        `${inside?"trong":"ngoài"} làng${hit?", vừa bị đánh":""}: hồi ${r.hp.toFixed(2)} sinh lực (cần ${hp.toFixed(2)}), ${r.mp.toFixed(2)} hồn lực (cần ${mp.toFixed(2)}) mỗi giây`);
      return r; };
    const full=()=>test(E,"pregen",{s:0,hp:100,mp:100}); // trả lại đầy sinh lực / hồn lực, coi như đã lâu không bị đánh
    const sIn=await regen(true,false), sInHit=await regen(true,true); await full(); // ra khỏi làng với đầy sinh lực như trước
    await goTo(E,out,ry); E.dmgs=[]; ok(!inSafeOf(E)&&await waitFor(()=>ticks().length,1500),"ra khỏi làng: độc gây sát thương tiếp");
    const sOut=await regen(false,false), sOutHit=await regen(false,true); await full();
    const rt=(x,y)=>Math.abs(x/y-SAFE_REGEN_MULT)<1e-6;
    ok(rt(sIn.hp,sOut.hp)&&rt(sInHit.hp,sOutHit.hp)&&rt(sIn.mp,sOut.mp),`vùng an toàn hồi nhanh gấp ${SAFE_REGEN_MULT}: sinh lực ${sIn.hp.toFixed(1)} / ${sOut.hp.toFixed(1)}, vừa bị đánh ${sInHit.hp.toFixed(1)} / ${sOutHit.hp.toFixed(1)}, hồn lực ${sIn.mp.toFixed(1)} / ${sOut.mp.toFixed(1)}`);
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
      // Tê liệt trên hồn thú vạn năm (khống chế × 0,75): Choáng (đã chốt 2026-10-20, thay Trói) nên không đi, không đánh; hết Choáng
      // trước, Câm lặng còn lâu hơn.
      const tl=sk[1].status, tS=tl.find(a=>a.s==="stun")?.secs, tQ=tl.find(a=>a.s==="silence")?.secs;
      ok(tS>0&&tQ>tS&&!tl.some(a=>a.s==="root"),`${sk[1].name}: tê liệt = Choáng ${tS} giây + Câm lặng ${tQ} giây (không còn Trói)`);
      const tb=await basic(id,1,{tier:3,d:40,stun:false}), t0=posOf(tb); E.hurts=[]; await sleep(tS*CC_TIER_MULT[3]*1000-500);
      ok(beastOf(E,tb)&&same(posOf(tb),t0)&&!E.hurts.length&&hasSt(beastOf(E,tb),"stun")&&hasSt(beastOf(E,tb),"silence"),"tê liệt: hồn thú kề bên đứng yên, không đánh (Choáng + Câm lặng)");
      // Thời gian trạng thái chạy theo nhịp server (dt mỗi nhịp kẹp 100 ms, server bận thì chậm hơn đồng hồ thật): chờ hết Choáng
      // rồi mới xem Câm lặng (còn thêm 2,25 giây), không đo bằng một khoảng ngủ cố định.
      const unstun=await waitFor(()=>!hasSt(beastOf(E,tb),"stun"),tS*CC_TIER_MULT[3]*1000), silent=hasSt(beastOf(E,tb),"silence");
      ok(unstun&&silent,`hết Choáng sau ${tS*CC_TIER_MULT[3]} giây, Câm lặng còn (${tQ*CC_TIER_MULT[3]} giây)`+
        (unstun&&silent?"":` [hồn thú ${beastOf(E,tb)?"còn":"mất"}, Choáng ${hasSt(beastOf(E,tb),"stun")}, Câm lặng ${silent}]`));
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
      // Đã chốt 2026-10-20: bị đòn trực tiếp đánh trúng (hook `hurt` đi qua hurtPlayer như đòn của hồn thú) cũng hiện hình.
      await test(E,"ready"); await cast(E,1,0); ok(await waitFor(()=>hasBuff(me,"hide"),800),`${sk[1].name}: tàng hình lại`);
      await test(E,"hurt",{pct:5}); ok(await waitFor(()=>!hasBuff(me,"hide"),600)&&!hasBuff(B.room.state.players.get(E.room.sessionId),"hide"),"bị đánh trúng: hiện hình (người khác cũng thấy)");
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
    // Cửu Tinh Thất Sát Kiếm: Liệt thương (Phá giáp) cộng dồn, Vô Ngã Kiếm Trận liên tục, Thất Sát Trảm (bản nhỏ của Kiếm Trảm Sơn Hà) mạnh theo tầng Phá giáp.
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
      // Tin dmg tới trước bản vá state: Choáng phải chờ theo state (trượt khi máy tải cao, PR #92). Choáng chỉ 0,6 × CC_TIER_MULT[4] =
      // 0,3 giây nên chờ ngay từ lúc server xử lý chiêu (cast không ngủ thêm): ngủ 200 ms rồi mới đọc thì máy tải cao có lúc đã hết Choáng.
      // Sinh lực hút về nằm cùng bản vá với Choáng, tin dmg tới trước bản vá ấy.
      await test(E,"ready"); await cast(E,0,0);
      const stun=await waitFor(()=>hasSt(beastOf(E,bid),"stun"),1000); await waitFor(()=>hitsOn(bid).length>0,1000);
      let got=hitsOn(bid)[0]?.v, w=exp(atk*P(0)*sk[0].dmg), hw=Math.min(me.maxHp,h0+Math.floor((got??0)*sk[0].lifesteal));
      ok(w.includes(got)&&moved(x0,y0)>=10&&stun,`${sk[0].name}: lướt ${moved(x0,y0).toFixed(0)} pixel, sát thương ${got} (cần ${w.join(" hoặc ")}), quật ngã (Choáng)`);
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
    // Quỷ Mị: hút máu, hút huyết cả đội (đổi võ hồn vẫn còn), tăng sát thương đội, Quỷ Ảnh Tiềm Hành tàng hình cả đội.
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
    // 9.4: ràng buộc đầy đủ. Hook `bond` trả tổng mỗi loại; sát thương / hồi máu / khiên đổi đúng tỉ lệ khi đội có cặp; võ hồn trong cặp
    // đang gục vẫn tính; bỏ khỏi đội thì hết.
    {
      for(const vohon of ["a_ngan","bang_phuong_hoang","hoa_long"]) if(!E.owned.list.some(v=>v.vohon===vohon)) await test(E,"grant",{vohon});
      await test(E,"rest",{s:15}); await reset();
      const CT="cuu_tinh_that_sat_kiem", HT="hao_thien_chuy", LN="lam_ngan_thao", CB="cuu_bao_luu_ly_thap", TC="thien_can_bach_ngoc_dinh";
      const bk=name=>BONDS.find(b=>b.name===name), SS=bk("Song Sinh Võ Hồn"), LH=bk("Lam Ngân Hoàng"), BH=bk("Băng Hỏa Lưỡng Nghi"), TB=bk("Thất Bảo Lưu Ly Tông");
      const all=VOHON.map(v=>v.id), same=(a,b)=>Math.abs(a-b)<1e-9;
      ok(BONDS.length===6&&SS?.skill===0.08&&LH?.heal===0.15&&BH?.stunBurn===0.12&&TB?.atk===0.08&&bondSum([LN,HT],"skill")===0.08&&bondSum([HT],"skill")===0
        &&BOND_KEYS.every(k=>same(bondSum(all,k),BONDS.reduce((a,b)=>a+(b[k]??0),0))),
        `9.4: ${BONDS.length} ràng buộc (${BONDS.map(b=>b.name).join(", ")}); bondSum cộng mọi cặp cùng loại`);
      await lineup(HT,["nhu_cot_tho",LN,"a_ngan"]); let bo=await test(E,"bond");
      const want={crit:0.1,burn:0,skill:SS.skill,heal:LH.heal,stunBurn:0,atk:0};
      ok(BOND_KEYS.every(k=>same(bo[k],want[k])),`hook bond đội Hạo Thiên Chùy + Nhu Cốt Thố + Lam Ngân Thảo + A Ngân: ${JSON.stringify(bo)}`);
      // Nhát đầu Thất Sát Kiếm Khí của Cửu Tinh Thất Sát Kiếm (ra trận) lên hồn thú mới, theo đội.
      const sk=skillsOf(CT)[0], base=atkE(CT)*P(0)*sk.dmg;
      const hit0=async(team,pre=["stun"])=>{ await lineup(CT,team); const bid=await target(4,28,pre); await test(E,"ready"); await cast(E,0);
        await waitFor(()=>hitsOn(bid).length>0,1200); return hitsOn(bid)[0]?.v; };
      const chk=async(team,mult,what,pre)=>{ const got=await hit0(team,pre), w=exp(base*mult);
        ok(w.includes(got),`${what}: ${sk.name} ${got} (cần ${w.join(" hoặc ")}, × ${+mult.toFixed(4)})`); };
      await chk([],1,"không ràng buộc");
      await chk([HT,LN],1+SS.skill,`ràng buộc ${SS.name} (sức mạnh hồn kỹ +${SS.skill*100}%)`);
      await chk([CB],1+TB.atk,`ràng buộc ${TB.name} (công +${TB.atk*100}%)`);
      await chk([HT,LN,CB],(1+SS.skill)*(1+TB.atk),`${SS.name} + ${TB.name} cùng lúc`);
      await chk(["bang_phuong_hoang","hoa_long"],1+BH.stunBurn,`ràng buộc ${BH.name}, hồn thú Choáng`);
      await chk(["bang_phuong_hoang","hoa_long"],1,`ràng buộc ${BH.name}, hồn thú chỉ bị Trói`,["root"]);
      await chk(["bang_phuong_hoang","hoa_long"],1+BH.stunBurn,`ràng buộc ${BH.name}, hồn thú Trói + Thiêu đốt`,["root",{s:"burn",n:1}]);
      // Lam Ngân Hoàng: hồi máu và khiên của Thiên Càn Bạch Ngọc Đỉnh (ra trận) mạnh thêm 15%.
      const tsk=skillsOf(TC), heal=async team=>{ await lineup(TC,team); await test(E,"rest",{s:15}); const h0=await hurtTo(60);
        await test(E,"ready"); await cast(E,0,300); return {h0,gain:me.hp-h0,max:me.maxHp}; };
      for(const [team,m] of [[[],1],[["a_ngan",LN],1+LH.heal]]){
        const r=await heal(team), w=r.max*tsk[0].self.heal*BP(0)*m;
        ok(r.h0+w<r.max&&Math.abs(r.gain-w)<=2,`${tsk[0].name}${m>1?` + ${LH.name}`:""}: hồi ${r.gain} (cần ~${w.toFixed(1)})`);
        await test(E,"ready"); await cast(E,1,0); const sw=()=>Math.round(me.maxHp*tsk[1].self.shield*BP(1)*m);
        ok(await waitFor(()=>me.shield===sw(),800),`${tsk[1].name}${m>1?` + ${LH.name}`:""}: khiên ${me.shield} (cần ${sw()})`);
      }
      // Võ hồn trong cặp đang gục vẫn tính; bỏ khỏi đội thì hết.
      await lineup(CB,[CT]); await test(E,"down"); await waitFor(()=>E.owned.active===rowE(CT)&&me.vh===vohonIndex(CT),2000);
      bo=await test(E,"bond"); const st=(await test(E,"stats")).live;
      ok(E.owned.active===rowE(CT)&&same(bo.atk,TB.atk)&&Math.abs(st.atkNow-st.atk*(1+TB.atk))<1e-6,
        `${vname(CB)} gục, ${vname(CT)} ra trận: vẫn ${TB.name}, công ${st.atkNow.toFixed(1)} = ${st.atk.toFixed(1)} × ${1+TB.atk}`);
      // Kết thúc với Thiên Càn Bạch Ngọc Đỉnh ra trận: bài tiên cơ riêng kế tiếp cần đổi tay vào Cửu Tinh Thất Sát Kiếm.
      await test(E,"rest",{s:REVIVE_SECS+1}); await lineup(TC); bo=await test(E,"bond");
      ok(BOND_KEYS.every(k=>bo[k]===0),`đội chỉ còn ${vname(TC)}: hết ràng buộc`);
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
    // Võ hồn chưa có dữ liệu vòng 5–10 (từ 8.1b Hỏa Long đã có; lấy võ hồn đầu tiên còn thiếu, trừ Xúc Xích dùng ở dưới). Khi 8.1c và
    // 8.1d đều xong thì không còn võ hồn nào thiếu: bỏ qua các bước dùng ND (luật "chỉ tăng chỉ số" vẫn giữ cho võ hồn thêm sau).
    const ND=VOHON.map(v=>v.id).find(id=>!chanThanOf(id)&&!ringSkill(id,4)&&id!=="xuc_xich"), ndName=ND?vname(ND):"";
    if(ND) ok(!ringSkill(ND,4)&&!chanThanOf(ND)&&same(skillChoices(ND,10),[0,1,2,3])&&same(skillChoices("hao_thien_chuy",10),[0,1,2,3,4,5,7,8,9]),
      `võ hồn chưa có dữ liệu (${ndName}): vòng 5–10 không có hồn kỹ (chỉ tăng chỉ số)`);
    else ok(VOHON.every(v=>chanThanOf(v.id)&&HIGH_RINGS.every(n=>ringSkill(v.id,n-1)))&&same(skillChoices("hao_thien_chuy",10),[0,1,2,3,4,5,7,8,9]),
      `cả ${VOHON.length} võ hồn đã có hồn kỹ vòng 5–10 và Chân Thân (không còn võ hồn chỉ tăng chỉ số)`);
    ok(same(loadoutOf("lam_ngan_thao",[]),[...DEFAULT_LOADOUT])&&same(loadoutOf("lam_ngan_thao",[4,9,-1,0]),[4,9,-1,0])&&(!ND||same(loadoutOf(ND,[4,1,2,3]),[...DEFAULT_LOADOUT]))
      &&!parseLoadout([0,0,1,2])&&!parseLoadout([0,1,2])&&!parseLoadout([0,1,2,10])&&same(parseLoadout([-1,-1,3,2]),[-1,-1,3,2]),
      "4 ô mang theo: mặc định vòng 1–4, ô trống -1, từ chối trùng / thiếu ô / vòng lạ");
    const K=await bot("Tester CT","hoa_long",{sex:1,hair:1,hairCol:4,outfitCol:2});
    await waitFor(()=>K.owned&&K.squad&&meOf(K)); const kp=meOf(K);
    for(const vohon of ["hao_thien_chuy","u_minh_linh_mieu","bich_lan_xa_hoang","cuu_bao_luu_ly_thap",ND].filter(Boolean)) await test(K,"grant",{vohon});
    const rowK=id=>K.owned.list.find(v=>v.vohon===id).rowId, vK=id=>K.owned.list.find(v=>v.vohon===id);
    ok(FIVE.every(id=>K.owned.list.some(v=>v.vohon===id))&&K.owned.list.every(v=>same(v.skills,[...DEFAULT_LOADOUT])),"K có 5 võ hồn mẫu + Hỏa Long, 4 ô mặc định vòng 1–4");
    const Y10=[423,764,1760,5000,12000,20000,50000,100000,100000,100000], P10=i=>skillPower(Y10[i]);
    // Từ 8.2 công của mọi võ hồn có cộng minh của tài khoản (K nhiều võ hồn cấp 100, nhiều hồn hoàn là đạt mốc): lấy % từ hook stats.
    let kres={}; const atkK=(id,n=10)=>calcStats(vohonIndex(id),n*10,Y10.slice(0,n).map(tierOfYears),1,{},{},kres).atk;
    for(const id of [...FIVE,ND].filter(Boolean)) await test(K,"set",{rowId:rowK(id),level:100,xp:0,rings:Y10});
    await test(K,"set",{rowId:rowK("u_minh_linh_mieu"),level:60,xp:0,rings:Y10.slice(0,6)});
    kres=(await test(K,"stats")).res?.bonus??{}; console.log(`  K cộng minh: ${JSON.stringify(kres)}`);
    async function lineupK(id){ await test(K,"clear"); await test(K,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(K,[rowK(id),0,0,0]);
      // Lấp đội bằng võ hồn mẫu không tạo ràng buộc (9.4: Lam Ngân Thảo + Hạo Thiên Chùy là Song Sinh Võ Hồn, đổi sát thương hồn kỹ).
      const fill=[]; for(const x of FIVE) if(x!==id&&fill.length<3&&!bondsOf([id,...fill,x]).length) fill.push(x);
      await sendTeam(K,[rowK(id),...fill.map(rowK)]); return K.owned.active===rowK(id)&&await waitFor(()=>kp.vh===vohonIndex(id)); }
    async function loadout(id,skills){ const n=K.ownedMsgs, l=K.logs.length; K.room.send("loadout",{rowId:rowK(id),skills}); await waitFor(()=>K.ownedMsgs>n&&K.logs.length>l,1500); await sleep(80); return K.logs.at(-1)??""; }
    const castK=(i,wait=200)=>skillCast(K,i,wait);
    async function chanThan(){ const l=K.logs.length; K.fxs=[]; K.dmgs=[]; K.room.send("chanthan"); await waitFor(()=>K.logs.length>l,1500); await sleep(80); return K.logs.at(-1)??""; }
    const stats=async()=>(await test(K,"stats")).live;
    // Hồn thú từ 1.000 năm có chiêu báo trước (3.5) có thể choáng K giữa chừng: Câm lặng cả vùng để chúng chỉ đứng chịu đòn.
    const hush=()=>test(K,"status",{s:"silence",secs:20,all:true});
    // Võ Hồn Chân Thân trong làng (vùng an toàn) bị chặn.
    ok(await lineupK("hao_thien_chuy"),"K: Hạo Thiên Chùy ra trận (cấp 100, 10 hồn hoàn)");
    ok(inSafeOf(K)&&/Vùng an toàn/.test(await chanThan())&&kp.ava===0,"trong làng: không biến Chân Thân");
    // Xếp ô: sai thì bị từ chối, server gửi lại ô đang lưu.
    ok(/phím riêng/.test(await loadout("hao_thien_chuy",[6,1,2,3]))&&same(vK("hao_thien_chuy").skills,[...DEFAULT_LOADOUT]),"xếp vòng 7 (Chân Thân) vào ô: từ chối");
    if(ND) ok(/chưa có hồn kỹ vòng 5/.test(await loadout(ND,[4,1,2,3])),`${ndName} (chưa có dữ liệu) xếp vòng 5: từ chối`);
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
      // Từ 9.4 đội lấp của Hạo Thiên Chùy không có Lam Ngân Thảo (Song Sinh Võ Hồn): đổi sang Bích Lân Xà Hoàng.
      const SW="bich_lan_xa_hoang";
      K.room.send("switch",{slot:K.owned.team.indexOf(rowK(SW))});
      ok(await waitFor(()=>K.owned.active===rowK(SW)&&kp.ava===0&&kp.avaCd===0,1500),`đổi sang ${VOHON[vohonIndex(SW)].name}: Chân Thân của Hạo Thiên hết, ${VOHON[vohonIndex(SW)].name} chưa hồi chiêu [ra trận ${K.owned.active===rowK(SW)}, ava ${kp.ava}, hồi ${kp.avaCd}]`);
      const s4=await stats(); ok(Math.abs(s4.atkNow-atkK(SW))<0.01,`${VOHON[vohonIndex(SW)].name} không mang chỉ số Chân Thân của Hạo Thiên: công ${s4.atkNow.toFixed(1)}`);
    }
    // Lam Ngân Thảo: vòng 5 lướt Trói, vòng 6 lãnh vực 6 nhát, tuyệt kỹ kéo cả vùng lại và giam; Chân Thân Lam Ngân Hoàng.
    {
      const id="lam_ngan_thao", atk=atkK(id), s5=ringSkill(id,4), s6=ringSkill(id,5), ult=ringSkill(id,9);
      ok(await lineupK(id),"K: Lam Ngân Thảo ra trận"); await test(K,"clear"); await test(K,"rest",{s:TEAM_COMBAT_SECS+1}); await loadout(id,[4,5,9,-1]);
      ok(same(vK(id).skills,[4,5,9,-1]),"Lam Ngân Thảo mang vòng 5, 6, 10, ô P trống");
      K.room.send("skill",{i:3}); ok(await lastLog(K,/chưa mang hồn kỹ/),"ô trống: báo chọn ở bảng đội hình");
      await test(K,"ready"); await faceK(); const b5=await spawnNear(K,4,...kat(50),20); await hush(); await castK(0);
      let want=exp(atk*P10(4)*s5.dmg);
      ok(want.includes(dmgsOn(K,b5)[0]?.v)&&await waitFor(()=>hasSt(beastOf(K,b5),"root"),800),`vòng 5 ${s5.name}: lướt ${dmgsOn(K,b5)[0]?.v} (cần ${want.join(" hoặc ")}), Trói [hướng ${kx},${ky}]`);
      await test(K,"clear"); const b6=await spawnNear(K,4,...kat(30),20); await test(K,"status",{s:"stun",secs:10}); await castK(1,0);
      ok(await waitFor(()=>dmgsOn(K,b6).length>=s6.n,s6.n*s6.every*1000+1500)&&await waitFor(()=>hasSt(beastOf(K,b6),"root"),800),`vòng 6 ${s6.name}: ${dmgsOn(K,b6).length}/${s6.n} nhát, nhát cuối Trói`);
      want=exp(atk*P10(5)*s6.dmg); ok(want.includes(dmgsOn(K,b6)[0]?.v),`lãnh vực nhát đầu ${dmgsOn(K,b6)[0]?.v} (cần ${want.join(" hoặc ")})`);
      // Vòng 5 vừa lướt đi: tính lại hướng thông thoáng từ chỗ đứng mới, không thì hồn thú cách 110 pixel có thể sinh sau vật cản, kéo không về.
      [kx,ky]=clearDir(kp.x,kp.y,130);
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
    // U Minh Linh Miêu 6 hồn hoàn: vòng 5–6 dùng được, Chân Thân cần vòng 7. Võ hồn chưa có dữ liệu (ND): vòng 5+ chỉ tăng chỉ số.
    {
      ok(await lineupK("u_minh_linh_mieu"),"K: U Minh Linh Miêu ra trận (6 hồn hoàn)");
      await loadout("u_minh_linh_mieu",[4,5,0,1]); const id="u_minh_linh_mieu", s6=ringSkill(id,5);
      ok(same(vK(id).skills,[4,5,0,1]),"U Minh Linh Miêu mang vòng 5, 6, 1, 2");
      ok(/cần hồn hoàn thứ 7/.test(await chanThan())&&kp.ava===0,"6 hồn hoàn: chưa biến Chân Thân");
      await test(K,"ready"); const weak=await spawnNear(K,4,...kat(100),20); await test(K,"bhp",{pct:20}); const full=await spawnNear(K,4,...kat(30),20); await hush();
      await castK(1,600); ok(dmgsOn(K,weak).length>=1&&!dmgsOn(K,full).length,`vòng 6 ${s6.name}: khóa hồn thú yếu máu ở xa (${dmgsOn(K,weak).length} nhát), bỏ qua con gần đủ máu`);
      if(ND){
        ok(await lineupK(ND),`K: ${ndName} ra trận (10 hồn hoàn, chưa có dữ liệu vòng 5–10)`);
        ok(/chưa có Võ Hồn Chân Thân/.test(await chanThan()),`${ndName}: chưa có Chân Thân`);
        const s0=await stats(), base=calcStats(vohonIndex(ND),100,Y10.map(tierOfYears),1,{},{},kres);
        ok(s0.maxHp===base.maxHp&&Math.abs(s0.atk-base.atk)<0.01&&same(vK(ND).skills,[...DEFAULT_LOADOUT]),`${ndName} vòng 5–10 chỉ tăng chỉ số: sinh lực ${s0.maxHp}, công ${s0.atk.toFixed(1)}; ô mặc định vòng 1–4`);
        await test(K,"ready"); await faceK(); await spawnNear(K,4,...kat(30)); await castK(1);
        ok(K.dmgs.length>0&&K.fxs.some(f=>f.k==="soulring"&&f.i===1),`${ndName} ô I vẫn là ${skillsOf(ND)[1].name}`);
      }
    }
    // Cửu Bảo Lưu Ly Tháp: tuyệt kỹ thật Vô Địch Thần Quang (miễn sát thương cả đội), Chân Thân giảm tiêu hao.
    {
      const id="cuu_bao_luu_ly_thap", ult=ringSkill(id,9), def=chanThanOf(id);
      // Đã chốt 2026-10-20: tiên cơ riêng (bản nhỏ) đổi tên Lưu Ly Hộ Thể; vòng 4 Thiên Càn Bạch Ngọc Đỉnh đổi tên để không gần trùng.
      const TC="thien_can_bach_ngoc_dinh";
      ok(ult.name==="Vô Địch Thần Quang"&&TIEN_CO_RIENG[id].name==="Lưu Ly Hộ Thể"&&skillsOf(TC)[3].name==="Ngọc Đỉnh Hộ Thế",
        `tên: tuyệt kỹ ${ult.name}, tiên cơ ${TIEN_CO_RIENG[id].name}, vòng 4 ${VOHON[vohonIndex(TC)].name} ${skillsOf(TC)[3].name}`);
      ok(await lineupK(id),"K: Cửu Bảo Lưu Ly Tháp ra trận");
      await loadout(id,[9,7,8,4]); await test(K,"ready"); await test(K,"hurt",{pct:50});
      const hp0=kp.hp; await castK(0,300);
      ok(K.fxs.some(f=>f.k==="ult")&&hasBuff(kp,"inv")&&hasBuff(kp,"atk")&&kp.hp>hp0,`tuyệt kỹ ${ult.name}: miễn sát thương, tăng công, hồi sinh lực ${hp0} -> ${kp.hp}`);
      await test(K,"rest",{s:ult.self.secs}); ok(!hasBuff(kp,"inv"),`hết ${ult.self.secs} giây: hết miễn sát thương`);
      // Phục Chế của Xúc Xích không sao chép tuyệt kỹ: hồn kỹ gần nhất trước đó là của võ hồn ND (không có ND thì
      // của U Minh Linh Miêu), không còn trong đội, nên không có gì để chép.
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
  // ---------- 8.1b: hồn kỹ vòng 5–10 và Võ Hồn Chân Thân lưu phái Thiêu đốt ----------
  {
    const FIRE=["ta_hoa_phuong_hoang","hoa_long","hoa_anh","ky_nhung_thong_thien_cuc","nguyet_nhan"];
    ok(FIRE.every(id=>HIGH_RINGS.every(n=>ringSkill(id,n-1))&&!ringSkill(id,CHAN_THAN_RING-1)&&chanThanOf(id)?.burst&&ringSkill(id,9).ult&&/^Tuyệt kỹ:/.test(ringSkill(id,9).desc)),
      "5 võ hồn Thiêu đốt có hồn kỹ vòng 5, 6, 8, 9, 10 (vòng 10 là tuyệt kỹ) và Võ Hồn Chân Thân vòng 7");
    ok(phoenixFieldR("ta_hoa_phuong_hoang",false)===PHOENIX_FIELD_R&&phoenixFieldR("ta_hoa_phuong_hoang",true)===chanThanOf("ta_hoa_phuong_hoang").field
      &&chanThanOf("ta_hoa_phuong_hoang").field>PHOENIX_FIELD_R&&phoenixFieldR("hoa_long",true)===PHOENIX_FIELD_R,
      `lãnh vực phượng hoàng: bán kính ${PHOENIX_FIELD_R}, Tà Hỏa Phượng Hoàng Chân Thân ${chanThanOf("ta_hoa_phuong_hoang").field}`);
    const T=await bot("Tester TD","hoa_long",{sex:0,hair:2,hairCol:3,outfitCol:1});
    await waitFor(()=>T.owned&&T.squad&&meOf(T)); const tp=meOf(T);
    for(const vohon of FIRE.filter(x=>x!=="hoa_long")) await test(T,"grant",{vohon});
    const rowT=id=>T.owned.list.find(v=>v.vohon===id).rowId, vT=id=>T.owned.list.find(v=>v.vohon===id);
    const Y10=[423,764,1760,5000,12000,20000,50000,100000,100000,100000], P10=i=>skillPower(Y10[i]), bc=STATUS.burn.col;
    for(const id of FIRE) await test(T,"set",{rowId:rowT(id),level:100,xp:0,rings:Y10});
    const tres=(await test(T,"stats")).res?.bonus??{};
    const stats=async()=>(await test(T,"stats")).live;
    const hush=()=>test(T,"status",{s:"silence",secs:20,all:true});
    // Đội: võ hồn thử ra trận + 3 võ hồn Thiêu đốt khác (có ràng buộc Tà Hỏa – Hỏa Ảnh nếu đủ cặp, nên công lấy từ hook stats).
    async function lineupT(id){ await test(T,"clear"); await test(T,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(T,[rowT(id),0,0,0]);
      await sendTeam(T,[rowT(id),...FIRE.filter(x=>x!==id).slice(0,3).map(rowT)]); return T.owned.active===rowT(id)&&await waitFor(()=>tp.vh===vohonIndex(id)); }
    async function loadoutT(id,skills){ const n=T.ownedMsgs, l=T.logs.length; T.room.send("loadout",{rowId:rowT(id),skills}); await waitFor(()=>T.ownedMsgs>n&&T.logs.length>l,1500); await sleep(80); }
    const castT=(i,wait=250)=>skillCast(T,i,wait);
    async function chanThanT(){ const l=T.logs.length; T.fxs=[]; T.dmgs=[]; T.room.send("chanthan"); await waitFor(()=>T.logs.length>l,1500); await sleep(120); return T.logs.at(-1)??""; }
    const hitsT=bid=>dmgsOn(T,bid).filter(x=>x.c!==bc); // bỏ sát thương Thiêu đốt mỗi giây / kích nổ
    // Trạng thái của hồn kỹ có trên hồn thú (tầng Thiêu đốt / Phá giáp đếm từ đồng bộ, trạng thái khác theo bit).
    const stHas=(b,list)=>!!b&&(list??[]).every(a=>a.s==="burn"?b.burn>=Math.min(a.n??1,5):a.s==="armor"?b.armor>=(a.n??1):hasSt(b,a.s));
    const stTxt=list=>(list??[]).map(a=>`${STATUS[a.s].name}${a.n?` ${a.n} tầng`:""}`).join(", ");
    ok(await leaveSafe(T),"T: ra khỏi làng");
    let [tx,ty]=clearDir(tp.x,tp.y,150); const tat=d=>[Math.round(tx*d),Math.round(ty*d)];
    async function faceT(){ [tx,ty]=clearDir(tp.x,tp.y,150); await step(T,tx,ty); }
    /**
     * Hồn kỹ vòng `ring` (chỉ số) ở ô `i`: hồn thú bậc 4 cách `d` theo hướng nhìn, kiểm nhát đầu và trạng thái. `hold`: giữ hồn thú đứng yên
     * bằng Choáng (true) hoặc Trói ("root"; vẫn bị Choáng được), false = không giữ (để đẩy lùi); trạng thái dùng để giữ thì không kiểm.
     */
    async function ringT(id,ring,i,{d=30,hold=true,wait=450,mult=1}={}){
      const sk=ringSkill(id,ring), atk=(await stats()).atkNow;
      await test(T,"clear"); await faceT(); const bid=await spawnNear(T,4,...tat(d),20); await hush();
      const hs=hold===true?"stun":hold||""; if(hs) await test(T,"status",{s:hs,secs:10});
      await test(T,"ready"); await castT(i,wait);
      const n=sk.area==="around"&&sk.n>1?sk.n:1;
      const sts=[...(sk.status??[]),...(sk.finisher??[])].filter(a=>a.s!==hs);
      await waitFor(()=>hitsT(bid).length>=n&&stHas(beastOf(T,bid),sts),n>1?n*(sk.every??0.15)*1000+1500:1500);
      const want=exp(atk*P10(ring)*sk.dmg*mult), got=hitsT(bid).map(x=>x.v), b=beastOf(T,bid);
      ok(want.includes(got[0])&&T.fxs.some(f=>f.k==="soulring"&&f.i===ring),`${vname(id)} vòng ${ring+1} ${sk.name}: ${got.length} nhát, nhát đầu ${got[0]} (cần ${want.join(" hoặc ")})`);
      if(sts.length) ok(stHas(b,sts),`${sk.name}: ${stTxt(sts)} [Thiêu đốt ${b?.burn}, Phá giáp ${b?.armor}]`);
      return bid;
    }
    /** Chân Thân: chỉ số theo hồn hoàn vòng 7, đòn biến hình đúng công đã tăng (hồn thú cách `d`). */
    async function chanT(id,{d=30}={}){
      const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]);
      await test(T,"clear"); await test(T,"ready"); await faceT(); const s0=await stats();
      const bid=await spawnNear(T,4,...tat(d),20); await hush(); await test(T,"status",{s:"stun",secs:10});
      const msg=await chanThanT(), s1=await stats();
      ok(tp.ava>def.secs-1&&msg.includes(def.name)&&T.fxs.some(f=>f.k==="avatar"&&f.on),`${def.name}: ${tp.ava.toFixed(1)} giây`);
      const okStat=(!cs.atk||Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.02)&&(!cs.spd||Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.02)
        &&(!cs.def||Math.abs(s1.def-s0.def-cs.def)<1e-3)&&(!cs.crit||Math.abs(s1.critB-s0.critB-cs.crit)<1e-3)&&(!cs.hp||s1.maxHp===Math.round(s0.maxHp*(1+cs.hp)));
      ok(okStat,`${def.name} × buffPower(50.000 năm): ${Object.entries(cs).map(([k,v])=>`${k} +${Math.round(v*100)}%`).join(", ")} [công ${s0.atkNow.toFixed(1)} -> ${s1.atkNow.toFixed(1)}, tốc ${s0.spd.toFixed(1)} -> ${s1.spd.toFixed(1)}]`);
      const bst=def.burst, want=exp(s1.atkNow*P10(6)*bst.dmg), got=hitsT(bid)[0]?.v;
      await waitFor(()=>stHas(beastOf(T,bid),(bst.status??[]).filter(a=>a.s!=="stun")),1000);
      ok(want.includes(got)&&stHas(beastOf(T,bid),(bst.status??[]).filter(a=>a.s!=="stun")),`biến hình: ${got} (cần ${want.join(" hoặc ")}), ${stTxt(bst.status)||"không trạng thái"}`);
      return {def,cs,bid,s0,s1};
    }
    const endT=async()=>{ await test(T,"clear"); await test(T,"rest",{s:30}); await waitFor(()=>tp.ava===0&&!hasBuff(tp,"phoenix"),1500); };

    // Tà Hỏa Phượng Hoàng: vòng 5 mũi quạt, vòng 6 bay lướt; tuyệt kỹ đốt đủ 5 tầng cả vùng; Chân Thân lãnh vực mạnh và rộng hơn.
    {
      const id="ta_hoa_phuong_hoang", ult=ringSkill(id,9);
      ok(await lineupT(id),`T: ${vname(id)} ra trận (cấp 100, 10 hồn hoàn)`);
      await loadoutT(id,[4,5,9,-1]); ok(same(vT(id).skills,[4,5,9,-1]),"Tà Hỏa Phượng Hoàng mang vòng 5, 6, 10");
      await ringT(id,4,0);
      const x0=tp.x, y0=tp.y; await ringT(id,5,1,{d:50});
      ok(Math.hypot(tp.x-x0,tp.y-y0)>=60&&T.fxs.some(f=>f.k==="fly"),`${ringSkill(id,5).name}: bay ${Math.hypot(tp.x-x0,tp.y-y0).toFixed(0)} pixel (fx fly)`);
      await test(T,"clear"); await faceT(); const atk=(await stats()).atkNow;
      const u1=await spawnNear(T,4,...tat(40),20), u2=await spawnNear(T,4,...tat(140),20); await hush(); await test(T,"status",{s:"stun",secs:10,all:true});
      const bf=B.fxs.length; await test(T,"ready"); await castT(2,400);
      ok(await waitFor(()=>[u1,u2].every(u=>beastOf(T,u)?.burn===5),800)&&exp(atk*P10(9)*ult.dmg).includes(hitsT(u1)[0]?.v)&&hasBuff(tp,"phoenix"),
        `tuyệt kỹ ${ult.name}: ${hitsT(u1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), Thiêu đốt 5 tầng cả hồn thú cách 140, mở lãnh vực`);
      ok(T.fxs.some(f=>f.k==="ult"&&f.name===ult.name)&&(B.room.roomId!==T.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===T.room.sessionId),800)),"fx tuyệt kỹ: người cùng phòng cũng thấy");
      await endT();
      // Chân Thân: lãnh vực phượng hoàng (buff 15 giây) bán kính `field` khi đang Chân Thân, đổi võ hồn thì về PHOENIX_FIELD_R.
      const {def}=await chanT(id), amp=def.burst.self.buff.phoenix*buffPower(Y10[6]), R=def.field;
      ok(await waitFor(()=>hasBuff(tp,"phoenix"),500),`${def.name}: mở lãnh vực phượng hoàng +${Math.round(amp*100)}%`);
      await test(T,"clear"); const mid=Math.round((PHOENIX_FIELD_R+R)/2), s1=await stats();
      const fb=await spawnNear(T,4,...tat(mid),20); await hush(); await test(T,"status",{s:"stun",secs:10}); await test(T,"ready"); await castT(0,900);
      let want=exp(s1.atkNow*P10(4)*ringSkill(id,4).dmg*(1+amp));
      ok(want.includes(hitsT(fb)[0]?.v),`đang Chân Thân, hồn thú cách ${mid} (> ${PHOENIX_FIELD_R}, < ${R}): ${hitsT(fb)[0]?.v} (cần ${want.join(" hoặc ")}, +${Math.round(amp*100)}%)`);
      await waitFor(()=>tp.swCd===0,3500); T.room.send("switch",{slot:T.owned.team.indexOf(rowT("hoa_long"))});
      ok(await waitFor(()=>T.owned.active===rowT("hoa_long")&&tp.ava===0,1500)&&hasBuff(tp,"phoenix"),"đổi sang Hỏa Long: hết Chân Thân, lãnh vực (thuộc hồn sư) vẫn còn");
      const hl=ringSkill("hoa_long",1), ah=(await stats()).atkNow; await test(T,"ready"); await castT(1,350);
      want=exp(ah*skillPower(Y10[1])*hl.dmg);
      ok(want.includes(hitsT(fb)[0]?.v),`hết Chân Thân: hồn thú cách ${mid} ngoài lãnh vực, ${hl.name} ${hitsT(fb)[0]?.v} (cần ${want.join(" hoặc ")})`);
      await endT();
    }
    // Hỏa Long: vòng 5 mũi quạt tầm xa, vòng 6 3 đạn không trượt; tuyệt kỹ Viêm bạo toàn vùng; Chân Thân Viêm bạo.
    {
      const id="hoa_long", ult=ringSkill(id,9);
      ok(await lineupT(id),`T: ${vname(id)} ra trận`); await loadoutT(id,[4,5,9,-1]);
      await ringT(id,4,0); const b6=await ringT(id,5,1,{d:120,wait:900});
      ok(hitsT(b6).length>=ringSkill(id,5).n,`${ringSkill(id,5).name}: ${hitsT(b6).length}/${ringSkill(id,5).n} đạn trúng hồn thú cách 120`);
      // Tuyệt kỹ: hồn thú cách 150 (ngoài Viêm Bạo vòng 4 bán kính 110) có sẵn 2 tầng; 2 đợt đầu chồng lên 5 tầng, đợt cuối kích nổ × (1 + mult).
      await test(T,"clear"); await faceT(); const atk=(await stats()).atkNow;
      const fb=await spawnNear(T,4,...tat(150),20); await hush(); await test(T,"status",{s:"stun",secs:10}); await test(T,"status",{s:"burn",n:2});
      // Các đợt chạy theo nhịp server (later, dt kẹp 100 ms): server bận thì đợt 2 tới muộn hơn 0,5 giây thật. Chờ theo state; 5 tầng
      // giữ tới đợt cuối (thêm 0,5 giây nhịp server) nên poll 50 ms không lỡ.
      await test(T,"ready"); await castT(2,0);
      ok(await waitFor(()=>beastOf(T,fb)?.burn===5,2500),`tuyệt kỹ ${ult.name}: 2 đợt đầu chồng Thiêu đốt ${beastOf(T,fb)?.burn} tầng (hồn thú cách 150)`);
      // Đọc Thiêu đốt trước đợt cuối; mỗi giây Thiêu đốt chỉ gây v × n, kích nổ gây v × n × giây còn lại × 1,5 × (1 + mult).
      const bs=(await test(T,"bst")).st?.burn, big=x=>x.c===bc&&bs&&x.v>bs.v*bs.n*2;
      await waitFor(()=>dmgsOn(T,fb).some(big),1500); await sleep(150);
      const boom=Math.max(0,...dmgsOn(T,fb).filter(big).map(x=>x.v));
      const wantB=bs?bs.v*bs.n*Math.max(0.5,bs.t-0.3)*STATUS.burn.boom*(1+ult.boom.mult):0;
      ok(bs&&boom>0&&Math.abs(boom/wantB-1)<0.15&&beastOf(T,fb)?.burn===ult.status[0].n,
        `đợt cuối Viêm bạo toàn vùng: kích nổ ${boom} ≈ ${wantB.toFixed(0)} (× ${1+ult.boom.mult}), còn ${beastOf(T,fb)?.burn} tầng [bst ${JSON.stringify(bs)}]`);
      ok(exp(atk*P10(9)*ult.dmg).includes(hitsT(fb)[0]?.v)&&hitsT(fb).length>=ult.n,`tuyệt kỹ: ${hitsT(fb).length}/${ult.n} đợt, đợt đầu ${hitsT(fb)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")})`);
      await endT();
      // Chân Thân: đòn biến hình là Viêm bạo (kích nổ 4 tầng có sẵn rồi đặt lại 1 tầng).
      const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]);
      await test(T,"clear"); await test(T,"ready"); await faceT(); const s0=await stats();
      const cb=await spawnNear(T,4,...tat(30),20); await hush(); await test(T,"status",{s:"stun",secs:10}); await test(T,"status",{s:"burn",n:4});
      await chanThanT(); const s1=await stats();
      ok(tp.ava>0&&Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.02&&Math.abs(s1.critB-s0.critB-cs.crit)<1e-3,`${def.name}: công +${Math.round(cs.atk*100)}%, chí mạng +${Math.round(cs.crit*100)}%`);
      ok(await waitFor(()=>dmgsOn(T,cb).some(x=>x.c===bc&&x.v>s0.atkNow)&&beastOf(T,cb)?.burn===def.burst.boom.keep,800),`biến hình Viêm bạo: kích nổ ${Math.max(0,...dmgsOn(T,cb).filter(x=>x.c===bc).map(x=>x.v))}, còn ${beastOf(T,cb)?.burn} tầng`);
      await endT();
    }
    // Hỏa Ảnh: vòng 5 chưởng đẩy lùi + Dễ thương, vòng 6 lồng lửa nhát cuối Choáng; tuyệt kỹ Choáng cả vùng; Chân Thân giảm sát thương.
    {
      const id="hoa_anh", ult=ringSkill(id,9);
      ok(await lineupT(id),`T: ${vname(id)} ra trận`); await loadoutT(id,[4,5,9,-1]);
      await ringT(id,4,0,{hold:false});
      await ringT(id,5,1,{d:60,hold:"root",wait:0});
      await test(T,"clear"); await faceT(); const atk=(await stats()).atkNow;
      const u1=await spawnNear(T,4,...tat(40),20), u2=await spawnNear(T,4,...tat(140),20); await hush(); await test(T,"ready"); await castT(2,400);
      ok(await waitFor(()=>[u1,u2].every(u=>stHas(beastOf(T,u),ult.status)),800)&&exp(atk*P10(9)*ult.dmg).includes(hitsT(u1)[0]?.v)&&T.fxs.some(f=>f.k==="ult"),
        `tuyệt kỹ ${ult.name}: ${hitsT(u1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), ${stTxt(ult.status)} cả hồn thú cách 140`);
      await endT(); await chanT(id); await endT();
    }
    // Kỳ Nhung Thông Thiên Cúc: vòng 5 cánh hoa quạt, vòng 6 Trói + Phá giáp; tuyệt kỹ 12 nhát, nhát cuối Trói; Chân Thân bão cánh hoa.
    {
      const id="ky_nhung_thong_thien_cuc", ult=ringSkill(id,9);
      ok(await lineupT(id),`T: ${vname(id)} ra trận`); await loadoutT(id,[4,5,9,-1]);
      await ringT(id,4,0); await ringT(id,5,1);
      ok(ringSkill(id,4).cd<ringSkill("ta_hoa_phuong_hoang",4).cd&&ringSkill(id,7).cd<ringSkill("ta_hoa_phuong_hoang",7).cd,"Kỳ Nhung hồi chiêu ngắn hơn võ hồn bùng nổ (lấp khoảng)");
      await test(T,"clear"); await faceT(); const atk=(await stats()).atkNow;
      const u=await spawnNear(T,4,...tat(60),40); await hush(); await test(T,"status",{s:"stun",secs:10}); await test(T,"ready"); await castT(2,0);
      ok(await waitFor(()=>hitsT(u).length>=ult.n&&hasSt(beastOf(T,u),"root"),ult.n*ult.every*1000+1500)&&beastOf(T,u)?.burn===5&&exp(atk*P10(9)*ult.dmg).includes(hitsT(u)[0]?.v),
        `tuyệt kỹ ${ult.name}: ${hitsT(u).length}/${ult.n} nhát, nhát đầu ${hitsT(u)[0]?.v}, Thiêu đốt ${beastOf(T,u)?.burn} tầng, Phá giáp ${beastOf(T,u)?.armor}, nhát cuối Trói`);
      await endT(); await chanT(id); await endT();
    }
    // Nguyệt Nhận: vòng 5 lướt xuyên, vòng 6 khóa hồn thú yếu máu; tuyệt kỹ 8 nhát vào hồn thú yếu máu nhất cả vùng; Chân Thân.
    {
      const id="nguyet_nhan", ult=ringSkill(id,9);
      ok(await lineupT(id),`T: ${vname(id)} ra trận`); await loadoutT(id,[4,5,9,-1]);
      await ringT(id,4,0,{d:50});
      await test(T,"clear"); await faceT(); await test(T,"ready");
      const weak=await spawnNear(T,4,...tat(140),20); await test(T,"bhp",{pct:20}); const full=await spawnNear(T,4,...tat(30),20); await hush();
      await castT(1,700); const s6=ringSkill(id,5);
      ok(hitsT(weak).length>=1&&!hitsT(full).length,`vòng 6 ${s6.name}: khóa hồn thú yếu máu cách 140 (${hitsT(weak).length} nhát), bỏ qua con đủ máu cách 30`);
      await test(T,"clear"); await faceT(); await test(T,"ready");
      const w2=await spawnNear(T,4,...tat(150),200); await test(T,"bhp",{pct:30}); const f2=await spawnNear(T,4,...tat(30),20); await hush();
      await castT(2,0);
      ok(await waitFor(()=>hitsT(w2).length>=ult.n,ult.n*ult.every*1000+1500)&&!hitsT(f2).length&&T.fxs.some(f=>f.k==="ult"),
        `tuyệt kỹ ${ult.name}: ${hitsT(w2).length}/${ult.n} nhát vào hồn thú yếu máu cách 150, không đánh con đủ máu`);
      await endT(); await chanT(id); await endT();
    }
    // Ô đã chọn lưu DB: thoát rồi vào lại.
    {
      const want=Object.fromEntries(T.owned.list.map(v=>[v.vohon,v.skills]));
      await T.room.leave(); await sleep(500); await enter(T); await waitFor(()=>T.owned);
      const got=Object.fromEntries(T.owned.list.map(v=>[v.vohon,v.skills]));
      ok(same(got,want)&&FIRE.every(id=>same(got[id],[4,5,9,-1])),"thoát vào lại: 5 võ hồn Thiêu đốt vẫn mang vòng 5, 6, 10");
      await T.room.leave();
    }
  }
  // ---------- 8.1c: hồn kỹ vòng 5–10 và Võ Hồn Chân Thân lưu phái Cảm điện ----------
  {
    const LD="lam_dien_ba_vuong_long", KV="kim_vu_mieu_ung", CK="can_khon_hon_nguyen_toa", YH="yeu_ho", XX="xuc_xich", SHOCK=[LD,KV,CK,YH,XX];
    ok(SHOCK.every(id=>HIGH_RINGS.every(n=>ringSkill(id,n-1))&&!ringSkill(id,CHAN_THAN_RING-1)&&chanThanOf(id)?.burst&&ringSkill(id,9).ult&&/^Tuyệt kỹ:/.test(ringSkill(id,9).desc)),
      "5 võ hồn Cảm điện có hồn kỹ vòng 5, 6, 8, 9, 10 (vòng 10 là tuyệt kỹ) và Võ Hồn Chân Thân vòng 7");
    ok(ringSkill(LD,9).shockR>ringSkill(LD,9).r&&chanThanOf(LD).lei>1&&ringSkill(XX,8).copy===1&&!ringSkill(XX,9).copy,
      `tuyệt kỹ Lam Điện sét tìm Cảm điện tới ${ringSkill(LD,9).shockR} (vùng ${ringSkill(LD,9).r}); Chân Thân Lam Điện Phong Lôi ×${chanThanOf(LD).lei}; Xúc Xích vòng 9 Phục Chế không giảm`);
    const Q=await bot("Tester CD",LD,{sex:1,hair:3,hairCol:2,outfitCol:3});
    await waitFor(()=>Q.owned&&Q.squad&&meOf(Q)); const qp=meOf(Q);
    for(const vohon of SHOCK.filter(x=>x!==LD)) await test(Q,"grant",{vohon});
    const rowQ=id=>Q.owned.list.find(v=>v.vohon===id).rowId, vQ=id=>Q.owned.list.find(v=>v.vohon===id);
    const Y10=[423,764,1760,5000,12000,20000,50000,100000,100000,100000], P10=i=>skillPower(Y10[i]), sc=STATUS.shock.col;
    for(const id of SHOCK) await test(Q,"set",{rowId:rowQ(id),level:100,xp:0,rings:Y10});
    const stats=async()=>(await test(Q,"stats")).live;
    async function lineupQ(id,rest=SHOCK.filter(x=>x!==id).slice(0,3)){ await test(Q,"clear"); await test(Q,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(Q,[rowQ(id),0,0,0]);
      await sendTeam(Q,[rowQ(id),...rest.map(rowQ)]); return Q.owned.active===rowQ(id)&&await waitFor(()=>qp.vh===vohonIndex(id)); }
    async function loadoutQ(id,skills){ const n=Q.ownedMsgs, l=Q.logs.length; Q.room.send("loadout",{rowId:rowQ(id),skills}); await waitFor(()=>Q.ownedMsgs>n&&Q.logs.length>l,1500); await sleep(80); return same(vQ(id).skills,skills); }
    const castQ=(i,wait=250)=>skillCast(Q,i,wait);
    async function chanThanQ(){ const l=Q.logs.length; Q.fxs=[]; Q.dmgs=[]; Q.room.send("chanthan"); await waitFor(()=>Q.logs.length>l,1500); await sleep(120); return Q.logs.at(-1)??""; }
    const hitsQ=bid=>dmgsOn(Q,bid).filter(x=>x.c!==sc); // bỏ sát thương lan Cảm điện
    const hush=()=>test(Q,"status",{s:"silence",secs:20,all:true}), hold=(s="stun")=>test(Q,"status",{s,secs:10,all:true});
    // Trạng thái trên hồn thú: Mị hoặc / Phong ấn đếm tầng; đủ 3 tầng thì đã bùng phát (Mê hoặc / Dễ thương) nên tầng có thể về 0.
    const stHas=(b,list)=>!!b&&(list??[]).every(a=>a.s==="lock"?b.lock>=(a.n??1)||hasSt(b,"vuln"):a.s==="allure"?b.allure>=(a.n??1)||hasSt(b,"charm"):hasSt(b,a.s));
    const stTxt=list=>(list??[]).map(a=>`${STATUS[a.s].name}${a.n?` ${a.n} tầng`:""}`).join(", ");
    ok(await leaveSafe(Q),"Q: ra khỏi làng");
    let [qx,qy]=clearDir(qp.x,qp.y,210); const qat=d=>[Math.round(qx*d),Math.round(qy*d)];
    async function faceQ(len=210){ [qx,qy]=clearDir(qp.x,qp.y,len); await step(Q,qx,qy); }
    /**
     * Hồn kỹ vòng `ring` ở ô `i`: hồn thú bậc 4 cách `d`, giữ bằng `hs` (Choáng / Trói, không kiểm), `pre`: trạng thái gây trước (để thử
     * thêm sát thương theo tầng); kiểm nhát đầu (dmg + perStack nếu có sẵn trạng thái) và trạng thái của hồn kỹ.
     */
    async function ringQ(id,ring,i,{d=30,hs="stun",pre=[],wait=450,n}={}){
      const sk=ringSkill(id,ring), atk=(await stats()).atkNow;
      await test(Q,"clear"); await faceQ(); const bid=await spawnNear(Q,4,...qat(d),20); await hush();
      if(hs) await test(Q,"status",{s:hs,secs:10}); for(const s of pre) await test(Q,"status",{s,secs:10});
      await test(Q,"ready"); await castQ(i,wait);
      const hits=n??(sk.n>1&&sk.area!=="proj"?sk.n:1), sts=[...(sk.status??[]),...(sk.finisher??[])].filter(a=>a.s!==hs);
      await waitFor(()=>hitsQ(bid).length>=hits&&stHas(beastOf(Q,bid),sts),hits>1?hits*(sk.every??0.15)*1000+1500:1500);
      // Dễ thương có sẵn: mọi sát thương lên hồn thú thêm STATUS.vuln.amp (damageBeast).
      const m=sk.dmg+(sk.perStack&&pre.includes(sk.perStack.s)?sk.perStack.dmg:0), amp=pre.includes("vuln")?1+STATUS.vuln.amp:1;
      const want=exp(atk*P10(ring)*m*amp), got=hitsQ(bid).map(x=>x.v), b=beastOf(Q,bid);
      ok(want.includes(got[0])&&got.length>=hits&&Q.fxs.some(f=>f.k==="soulring"&&f.i===ring),
        `${vname(id)} vòng ${ring+1} ${sk.name}: ${got.length}/${hits} nhát, nhát đầu ${got[0]} (cần ${want.join(" hoặc ")}${m!==sk.dmg?`, có sẵn ${STATUS[sk.perStack.s].name}`:""})`);
      if(sts.length) ok(stHas(b,sts),`${sk.name}: ${stTxt(sts)} [Mị hoặc ${b?.allure}, Phong ấn ${b?.lock}]`);
      return bid;
    }
    /** Chân Thân: chỉ số × buffPower vòng 7, đòn biến hình theo công đã tăng (hồn thú cách `d`, `pre`: trạng thái có sẵn). */
    async function chanQ(id,{d=30,pre=[]}={}){
      const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]), bst=def.burst;
      await test(Q,"clear"); await test(Q,"ready"); await faceQ(); const s0=await stats();
      const bid=await spawnNear(Q,4,...qat(d),20); await hush(); await test(Q,"status",{s:"stun",secs:10}); for(const s of pre) await test(Q,"status",{s,secs:10});
      const msg=await chanThanQ(), s1=await stats();
      ok(qp.ava>def.secs-1&&msg.includes(def.name)&&Q.fxs.some(f=>f.k==="avatar"&&f.on),`${def.name}: ${qp.ava.toFixed(1)} giây`);
      const okStat=(!cs.atk||Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.02)&&(!cs.spd||Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.02)
        &&(!cs.def||Math.abs(s1.def-s0.def-cs.def)<1e-3)&&(!cs.crit||Math.abs(s1.critB-s0.critB-cs.crit)<1e-3)&&(!cs.hp||s1.maxHp===Math.round(s0.maxHp*(1+cs.hp)));
      ok(okStat,`${def.name} × buffPower(50.000 năm): ${Object.entries(cs).map(([k,v])=>`${k} +${Math.round(v*100)}%`).join(", ")} [công ${s0.atkNow.toFixed(1)} -> ${s1.atkNow.toFixed(1)}, tốc ${s0.spd.toFixed(1)} -> ${s1.spd.toFixed(1)}]`);
      const sts=(bst.status??[]).filter(a=>a.s!=="stun"), m=bst.dmg+(bst.perStack&&pre.includes(bst.perStack.s)?bst.perStack.dmg:0);
      await waitFor(()=>stHas(beastOf(Q,bid),sts),1000);
      const want=exp(s1.atkNow*P10(6)*m), got=hitsQ(bid)[0]?.v;
      ok(want.includes(got)&&stHas(beastOf(Q,bid),sts),`biến hình: ${got} (cần ${want.join(" hoặc ")}), ${stTxt(sts)||"không trạng thái"}`);
      return {def,cs,bid,s0,s1};
    }
    const endQ=async()=>{ await test(Q,"clear"); await test(Q,"rest",{s:30}); await waitFor(()=>qp.ava===0,1500); };

    // Lam Điện Bá Vương Long: vòng 5 đánh hồn thú Cảm điện đau hơn, vòng 6 5 tia; tuyệt kỹ sét tìm mọi hồn thú Cảm điện ngoài vùng;
    // Chân Thân: đòn biến hình kích Cảm điện, Phong Lôi Chi Lực tích gấp đôi.
    {
      const id=LD, ult=ringSkill(id,9);
      ok(await lineupQ(id),`Q: ${vname(id)} ra trận (cấp 100, 10 hồn hoàn)`);
      ok(await loadoutQ(id,[4,5,9,-1]),"Lam Điện mang vòng 5, 6, 10");
      await ringQ(id,4,0,{pre:["shock"]});
      await ringQ(id,5,1,{d:120,wait:1300});
      // Tuyệt kỹ: u1 trong vùng (60), u2 Cảm điện ở ~205 (ngoài 160, trong shockR), u3 không Cảm điện ở ~185: sét chỉ tìm u2.
      // Hook status chỉ nhắm hồn thú trong 160: gây trạng thái cho u2 / u3 lúc còn gần (150 / 130) rồi lùi Q ra 55 pixel.
      // Q vừa ra khỏi làng: tới đường làng phía đông trước (như F ở 3.5) để bước lùi không vào vùng an toàn.
      await test(Q,"goto",{x:safe.x+safe.width+140,y:27.5*16}); await test(Q,"clear"); [qx,qy]=clearDir(qp.x,qp.y,210,60); await step(Q,qx,qy); const atk=(await stats()).atkNow;
      const u2=await spawnNear(Q,4,...qat(150),20); await test(Q,"status",{s:"shock",secs:20}); await test(Q,"status",{s:"stun",secs:10});
      const u3=await spawnNear(Q,4,...qat(130),20); await test(Q,"status",{s:"stun",secs:10});
      const bx=Math.round(qp.x-qx*55), by=Math.round(qp.y-qy*55); await test(Q,"goto",{x:bx,y:by}); await waitFor(()=>Math.hypot(qp.x-bx,qp.y-by)<1,800);
      const u1=await spawnNear(Q,4,...qat(60),20); await hush(); await hold();
      const far=bid=>{ const q=beastOf(Q,bid); return q?Math.hypot(q.x-qp.x,q.y-qp.y):-1; }, d2=far(u2), d3=far(u3);
      await test(Q,"ready"); await castQ(2,0);
      ok(await waitFor(()=>hitsQ(u1).length>=ult.n&&hitsQ(u2).length>=ult.n&&hasSt(beastOf(Q,u2),"stun"),ult.n*ult.every*1000+1500)&&!dmgsOn(Q,u3).length,
        `tuyệt kỹ ${ult.name}: u1 (60) ${hitsQ(u1).length} đợt, u2 Cảm điện cách ${d2.toFixed(0)} ${hitsQ(u2).length} đợt + Choáng, u3 không Cảm điện cách ${d3.toFixed(0)} không trúng (${dmgsOn(Q,u3).length}) [trong làng ${inSafeOf(Q)}, hướng ${qx},${qy}, log ${Q.logs.at(-1)}]`);
      ok(exp(atk*P10(9)*(ult.dmg+ult.perStack.dmg)).includes(hitsQ(u2)[0]?.v)&&Q.fxs.some(f=>f.k==="zap"&&f.to?.length>=1)&&Q.fxs.some(f=>f.k==="ult"&&f.name===ult.name),
        `sét tìm u2: ${hitsQ(u2)[0]?.v} (cần ${exp(atk*P10(9)*(ult.dmg+ult.perStack.dmg)).join(" hoặc ")}: +${ult.perStack.dmg*100}% vì Cảm điện), fx zap + ult`);
      await endQ();
      const {def}=await chanQ(id,{pre:["shock"]});
      // Phong Lôi Chi Lực khi Chân Thân: vòng 5 trúng hồn thú Cảm điện +gain × shockMult × lei; hết Chân Thân thì về × shockMult.
      const gainCT=PHONG_LOI.gain.skill*PHONG_LOI.shockMult*def.lei, gain0=PHONG_LOI.gain.skill*PHONG_LOI.shockMult;
      await test(Q,"lei",{v:0}); await test(Q,"status",{s:"shock",secs:10}); await test(Q,"ready"); await castQ(0,300);
      ok(qp.ava>0&&await waitFor(()=>qp.lei===gainCT,600),`đang Chân Thân: Phong Lôi Chi Lực +${qp.lei} (cần ${gainCT} = ${PHONG_LOI.gain.skill} × ${PHONG_LOI.shockMult} × ${def.lei})`);
      await endQ(); await faceQ(); await spawnNear(Q,4,...qat(30),20); await hush(); await test(Q,"status",{s:"stun",secs:10}); await test(Q,"status",{s:"shock",secs:10});
      await test(Q,"lei",{v:0}); await test(Q,"ready"); await castQ(0,300);
      ok(qp.ava===0&&await waitFor(()=>qp.lei===gain0,600),`hết Chân Thân: Phong Lôi Chi Lực +${qp.lei} (cần ${gain0})`);
      await test(Q,"lei",{v:0}); await endQ();
    }
    // Kim Vũ Miêu Ưng: vòng 5 vuốt 4 nhát, vòng 6 bay lướt Câm lặng; tuyệt kỹ Cảm điện 10 giây cả vùng 200; Chân Thân.
    {
      const id=KV, ult=ringSkill(id,9);
      ok(await lineupQ(id),`Q: ${vname(id)} ra trận`); await loadoutQ(id,[4,5,9,-1]);
      await ringQ(id,4,0,{d:50,wait:900});
      const x0=qp.x, y0=qp.y; await ringQ(id,5,1,{d:60,hs:"root"});
      ok(Math.hypot(qp.x-x0,qp.y-y0)>=80&&Q.fxs.some(f=>f.k==="fly"),`${ringSkill(id,5).name}: bay ${Math.hypot(qp.x-x0,qp.y-y0).toFixed(0)} pixel (fx fly)`);
      await test(Q,"clear"); await faceQ(); const atk=(await stats()).atkNow;
      const u2=await spawnNear(Q,4,...qat(180),20); await test(Q,"status",{s:"stun",secs:10});
      const u1=await spawnNear(Q,4,...qat(40),20); await hold(); await test(Q,"ready"); await castQ(2,0);
      ok(await waitFor(()=>[u1,u2].every(u=>hitsQ(u).length>=ult.n&&hasSt(beastOf(Q,u),"shock")&&hasSt(beastOf(Q,u),"silence")),ult.n*ult.every*1000+1500)
        &&exp(atk*P10(9)*ult.dmg).includes(hitsQ(u1)[0]?.v),`tuyệt kỹ ${ult.name}: ${hitsQ(u1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), Cảm điện + Câm lặng cả hồn thú cách 180`);
      const bs=(await test(Q,"bst")).st?.shock; ok(bs&&bs.t>STATUS.shock.secs+2,`Cảm điện của tuyệt kỹ còn ${bs?.t.toFixed(1)} giây (> ${STATUS.shock.secs + 2}, mặc định ${STATUS.shock.secs})`);
      await endQ(); await chanQ(id); await endQ();
    }
    // Càn Khôn Hỗn Nguyên Tỏa: vòng 5 3 xích (Phong ấn đủ 3 tầng → Dễ thương), vòng 6 bay tới đặt ngục, vòng 9 đánh mạnh mục tiêu Dễ thương;
    // tuyệt kỹ vùng phong tỏa 150; Chân Thân kéo về, Phong ấn đủ tầng.
    {
      const id=CK, ult=ringSkill(id,9);
      ok(await lineupQ(id),`Q: ${vname(id)} ra trận`); await loadoutQ(id,[4,5,9,8]);
      const b5=await ringQ(id,4,0,{d:100,wait:900,n:3});
      ok(hasSt(beastOf(Q,b5),"vuln")&&!beastOf(Q,b5)?.lock,`3 xích Phong ấn đủ 3 tầng: bùng phát Dễ thương (Phong ấn còn ${beastOf(Q,b5)?.lock})`);
      const b6=await ringQ(id,5,1,{d:120,hs:"root",wait:0}), q6=beastOf(Q,b6);
      ok(q6&&Math.hypot(q6.x-qp.x,q6.y-qp.y)<40&&hasSt(q6,"vuln"),`${ringSkill(id,5).name}: bay tới hồn thú (còn cách ${q6?Math.hypot(q6.x-qp.x,q6.y-qp.y).toFixed(0):"?"}), Dễ thương`);
      await ringQ(id,8,3,{d:40,pre:["vuln"]});
      await test(Q,"clear"); await faceQ();
      const u2=await spawnNear(Q,4,...qat(200),20); await test(Q,"status",{s:"stun",secs:10});
      const u1=await spawnNear(Q,4,...qat(150),20); await test(Q,"status",{s:"stun",secs:10}); const x0=qp.x, y0=qp.y;
      await test(Q,"ready"); await castQ(2,0);
      // Tin dmg tới trước bản vá state: chờ cả số tầng Phong ấn.
      ok(await waitFor(()=>[u1,u2].every(u=>hitsQ(u).length>=ult.n&&stHas(beastOf(Q,u),[{s:"shock"},{s:"vuln"},{s:"root"}])&&beastOf(Q,u)?.lock===ult.n%3),ult.n*ult.every*1000+2000)
        &&Math.hypot(qp.x-x0,qp.y-y0)>=100&&Q.fxs.some(f=>f.k==="ult"),
        `tuyệt kỹ ${ult.name}: bay ${Math.hypot(qp.x-x0,qp.y-y0).toFixed(0)} pixel, ${hitsQ(u1).length}/${hitsQ(u2).length} nhát vào 2 hồn thú, Dễ thương, Phong ấn còn ${beastOf(Q,u2)?.lock} tầng, Trói, Cảm điện`);
      await endQ(); await chanQ(id); await endQ();
    }
    // Yêu Hồ: vòng 5 Mị hoặc 2 tầng, vòng 6 tàng hình; tuyệt kỹ Mê hoặc diện rộng (hồn thú bỏ mục tiêu); Chân Thân.
    {
      const id=YH, ult=ringSkill(id,9);
      ok(await lineupQ(id),`Q: ${vname(id)} ra trận`); await loadoutQ(id,[4,5,9,-1]);
      await ringQ(id,4,0);
      await ringQ(id,5,1,{d:40}); ok(hasBuff(qp,"hide"),`${ringSkill(id,5).name}: hồn sư tàng hình`);
      await test(Q,"clear"); await faceQ(); const atk=(await stats()).atkNow;
      const u2=await spawnNear(Q,4,...qat(165),20); await test(Q,"status",{s:"root",secs:10});
      const u1=await spawnNear(Q,4,...qat(40),20); await hold("root"); await test(Q,"ready"); await castQ(2,300);
      ok(await waitFor(()=>[u1,u2].every(u=>stHas(beastOf(Q,u),ult.status)&&!beastOf(Q,u).aggro),800)&&exp(atk*P10(9)*ult.dmg).includes(hitsQ(u1)[0]?.v)&&hasBuff(qp,"hide"),
        `tuyệt kỹ ${ult.name}: ${hitsQ(u1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), ${stTxt(ult.status)} cả hồn thú cách 165, bỏ mục tiêu; tàng hình`);
      await endQ(); await chanQ(id); await endQ();
    }
    // Xúc Xích: vòng 5 hồi sinh lực + khiên, vòng 6 xúc xích bay Cảm điện; vòng 9 Phục Chế không giảm (chép hồn kỹ vòng 5 của Lam Điện);
    // tuyệt kỹ hồi máu, hồn lực, tăng công / tốc; Chân Thân giảm tiêu hao, hồi hồn lực.
    {
      const id=XX, ult=ringSkill(id,9), s5=ringSkill(id,4);
      ok(await lineupQ(id,[LD,KV,YH]),`Q: ${vname(id)} ra trận, Lam Điện trong đội`); await loadoutQ(id,[4,5,8,9]);
      await test(Q,"ready"); await test(Q,"hurt",{pct:60}); await waitFor(()=>qp.hp<qp.maxHp); const h0=qp.hp; await castQ(0,300);
      const heal=Math.round(qp.maxHp*s5.self.heal*buffPower(Y10[4]));
      ok(Math.abs(qp.hp-h0-heal)<=2&&qp.shield>0,`vòng 5 ${s5.name}: hồi ${qp.hp-h0} (cần ≈ ${heal}), khiên ${qp.shield}`);
      await ringQ(id,5,1,{wait:600});
      // Phục Chế vòng 9: Lam Điện tung vòng 5 (ô U) rồi đổi sang Xúc Xích tung ô O; sát thương theo công Xúc Xích × sức mạnh vòng 9 × 1.
      await test(Q,"clear"); await faceQ();
      const bc=await spawnNear(Q,4,...qat(30),20); await hush(); await test(Q,"status",{s:"stun",secs:10});
      await waitFor(()=>qp.swCd===0,3500); Q.room.send("switch",{slot:Q.owned.team.indexOf(rowQ(LD))}); ok(await waitFor(()=>Q.owned.active===rowQ(LD),1500),"đổi sang Lam Điện");
      await test(Q,"ready"); await castQ(0,300); ok(hitsQ(bc).length>0,`Lam Điện tung ${ringSkill(LD,4).name}`);
      await waitFor(()=>qp.swCd===0,3500); Q.room.send("switch",{slot:Q.owned.team.indexOf(rowQ(id))}); ok(await waitFor(()=>Q.owned.active===rowQ(id),1500),"đổi về Xúc Xích");
      await test(Q,"status",{s:"shock",secs:10}); const ax=(await stats()).atkNow, src=ringSkill(LD,4); await test(Q,"ready"); const l=Q.logs.length; await castQ(2,300);
      const want=exp(ax*P10(8)*ringSkill(id,8).copy*(src.dmg+src.perStack.dmg));
      ok(Q.logs.slice(l).some(t=>t.includes(`sao chép ${src.name}`))&&want.includes(hitsQ(bc)[0]?.v),
        `vòng 9 ${ringSkill(id,8).name}: sao chép ${src.name} ${hitsQ(bc)[0]?.v} (cần ${want.join(" hoặc ")}: công Xúc Xích × hồn hoàn vòng 9 × ${ringSkill(id,8).copy})`);
      await test(Q,"clear"); await test(Q,"ready"); await test(Q,"hurt",{pct:60}); await waitFor(()=>qp.hp<qp.maxHp); const h1=qp.hp, m1=qp.mp; await castQ(3,300);
      ok(Q.fxs.some(f=>f.k==="ult"&&f.name===ult.name)&&qp.hp>h1&&qp.shield>0&&hasBuff(qp,"atk")&&hasBuff(qp,"spd"),
        `tuyệt kỹ ${ult.name}: hồi ${h1} -> ${qp.hp}, hồn lực ${m1} -> ${qp.mp} (trừ ${ult.cost} rồi hồi), khiên ${qp.shield}, tăng công và tốc độ`);
      // Chân Thân: không đánh, chỉ hồi; giảm tiêu hao hồn kỹ.
      await test(Q,"rest",{s:30}); await test(Q,"ready",{mp:100}); const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]), s0=await stats();
      await test(Q,"hurt",{pct:60}); await waitFor(()=>qp.hp<qp.maxHp); const h2=qp.hp; const msg=await chanThanQ(); const s1=await stats();
      ok(qp.ava>0&&msg.includes(def.name)&&qp.hp>h2&&Math.abs(s1.def-s0.def-cs.def)<1e-3&&Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.02&&s1.maxHp===Math.round(s0.maxHp*(1+cs.hp)),
        `${def.name}: hồi ${h2} -> ${qp.hp}, giảm sát thương +${Math.round(cs.def*100)}%, tốc độ +${Math.round(cs.spd*100)}%, sinh lực tối đa ${s0.maxHp} -> ${s1.maxHp}`);
      await endQ();
    }
    // Ô đã chọn lưu DB: thoát rồi vào lại.
    {
      await test(Q,"rest",{s:TEAM_COMBAT_SECS+1});
      const want=Object.fromEntries(Q.owned.list.map(v=>[v.vohon,v.skills]));
      await Q.room.leave(); await sleep(500); await enter(Q); await waitFor(()=>Q.owned);
      const got=Object.fromEntries(Q.owned.list.map(v=>[v.vohon,v.skills]));
      ok(same(got,want)&&same(got[CK],[4,5,9,8])&&same(got[XX],[4,5,8,9]),"thoát vào lại: 5 võ hồn Cảm điện giữ ô mang theo");
      await Q.room.leave();
    }
  }
  // ---------- 8.1d: hồn kỹ vòng 5–10 và Võ Hồn Chân Thân 5 võ hồn còn lại ----------
  {
    const REST=["cuu_tinh_that_sat_kiem","nhu_cot_tho","tu_vong_chu_hoang","quy_mi","thien_can_bach_ngoc_dinh"];
    ok(REST.every(id=>HIGH_RINGS.every(n=>ringSkill(id,n-1))&&!ringSkill(id,CHAN_THAN_RING-1)&&chanThanOf(id)?.burst&&ringSkill(id,9).ult&&/^Tuyệt kỹ:/.test(ringSkill(id,9).desc)),
      "5 võ hồn còn lại có hồn kỹ vòng 5, 6, 8, 9, 10 (vòng 10 là tuyệt kỹ) và Võ Hồn Chân Thân vòng 7");
    // Tuyệt kỹ thật mang đúng tên trong bảng 5.1; bản nhỏ ở vòng 4 đổi tên để 4 ô mang theo không có hai hồn kỹ trùng tên.
    const ULT={cuu_tinh_that_sat_kiem:"Kiếm Trảm Sơn Hà",quy_mi:"Quỷ Ảnh Trùng Trùng",thien_can_bach_ngoc_dinh:"Tịnh Thế Lưu Ly"};
    ok(Object.entries(ULT).every(([id,n])=>ringSkill(id,9).name===n&&skillChoices(id,10).filter(r=>ringSkill(id,r).name===n).length===1),
      `tuyệt kỹ thật: ${Object.values(ULT).join(", ")}; vòng 4 là bản nhỏ (${Object.keys(ULT).map(id=>ringSkill(id,3).name).join(", ")})`);
    const done=VOHON.filter(v=>chanThanOf(v.id)&&HIGH_RINGS.every(n=>ringSkill(v.id,n-1))).length;
    console.log(`  võ hồn đã đủ vòng 5–10: ${done}/${VOHON.length}`);
    const U=await bot("Tester CL","cuu_tinh_that_sat_kiem",{sex:1,hair:0,hairCol:2,outfitCol:4});
    await waitFor(()=>U.owned&&U.squad&&meOf(U)); const up=meOf(U);
    for(const vohon of REST.slice(1)) await test(U,"grant",{vohon});
    const rowU=id=>U.owned.list.find(v=>v.vohon===id).rowId, vU=id=>U.owned.list.find(v=>v.vohon===id);
    const Y10=[423,764,1760,5000,12000,20000,50000,100000,100000,100000], P10=i=>skillPower(Y10[i]);
    for(const id of REST) await test(U,"set",{rowId:rowU(id),level:100,xp:0,rings:Y10});
    const stats=async()=>(await test(U,"stats")).live;
    const hush=()=>test(U,"status",{s:"silence",secs:20,all:true});
    async function lineupU(id){ await test(U,"clear"); await test(U,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(U,[rowU(id),0,0,0]);
      await sendTeam(U,[rowU(id),...REST.filter(x=>x!==id).slice(0,3).map(rowU)]); return U.owned.active===rowU(id)&&await waitFor(()=>up.vh===vohonIndex(id)); }
    async function loadoutU(id,skills){ const n=U.ownedMsgs, l=U.logs.length; U.room.send("loadout",{rowId:rowU(id),skills}); await waitFor(()=>U.ownedMsgs>n&&U.logs.length>l,1500); await sleep(80); }
    const castU=(i,wait=250)=>skillCast(U,i,wait);
    async function chanThanU(){ const l=U.logs.length; U.fxs=[]; U.dmgs=[]; U.room.send("chanthan"); await waitFor(()=>U.logs.length>l,1500); await sleep(120); return U.logs.at(-1)??""; }
    // Bỏ sát thương Trúng độc mỗi giây (màu độc) khi đếm nhát của hồn kỹ.
    const pc=STATUS.poison.col, hitsU=bid=>dmgsOn(U,bid).filter(x=>x.c!==pc);
    const stHas=(b,list)=>!!b&&(list??[]).every(a=>a.s==="poison"?b.poison>=Math.min(a.n??1,5):a.s==="armor"?b.armor>=Math.min(a.n??1,3):a.s==="allure"?b.allure>=(a.n??1):hasSt(b,a.s));
    const stTxt=list=>(list??[]).map(a=>`${STATUS[a.s].name}${a.n?` ${a.n} tầng`:""}`).join(", ");
    const buffTxt=e=>Object.keys(e?.buff??{}).map(k=>BUFFS[k].name).join(", ");
    ok(await leaveSafe(U),"U: ra khỏi làng");
    let [ux,uy]=clearDir(up.x,up.y,170); const uat=d=>[Math.round(ux*d),Math.round(uy*d)];
    async function faceU(){ [ux,uy]=clearDir(up.x,up.y,170); await step(U,ux,uy); }
    /** Hồn kỹ đánh vòng `ring` ở ô `i`: hồn thú bậc 4 cách `d` theo hướng nhìn, đứng yên bằng Choáng; nhát đầu theo năm và trạng thái. */
    async function ringU(id,ring,i,{d=30,wait=450}={}){
      const sk=ringSkill(id,ring), atk=(await stats()).atkNow;
      await test(U,"clear"); await faceU(); const bid=await spawnNear(U,4,...uat(d),20); await hush(); await test(U,"status",{s:"stun",secs:10});
      await test(U,"ready"); await castU(i,wait);
      const n=(sk.area==="around"||sk.area==="target")&&sk.n>1?sk.n:1, sts=[...(sk.status??[]),...(sk.finisher??[])].filter(a=>a.s!=="stun");
      await waitFor(()=>hitsU(bid).length>=n&&stHas(beastOf(U,bid),sts),n>1?n*(sk.every??0.15)*1000+1500:1500);
      const want=exp(atk*P10(ring)*sk.dmg), got=hitsU(bid).map(x=>x.v), b=beastOf(U,bid);
      ok(want.includes(got[0])&&got.length>=n&&U.fxs.some(f=>f.k==="soulring"&&f.i===ring),`${vname(id)} vòng ${ring+1} ${sk.name}: ${got.length}/${n} nhát, nhát đầu ${got[0]} (cần ${want.join(" hoặc ")})`);
      if(sts.length) ok(stHas(b,sts),`${sk.name}: ${stTxt(sts)} [Trúng độc ${b?.poison}, Phá giáp ${b?.armor}, Mị hoặc ${b?.allure}]`);
      return bid;
    }
    /** Hồn kỹ lên bản thân vòng `ring` ở ô `i`: hiệu ứng có lợi, hồi sinh lực cả đội, khiên (đang mất nửa sinh lực). */
    async function selfU(id,ring,i){
      const sk=ringSkill(id,ring), e=sk.self;
      await test(U,"clear"); await test(U,"rest",{s:30}); await test(U,"ready"); await test(U,"hurt",{pct:50}); const hp0=up.hp; await castU(i,300);
      ok(Object.keys(e.buff??{}).every(k=>hasBuff(up,k))&&(!e.heal||up.hp>hp0)&&(!e.shield||up.shield>0)&&U.fxs.some(f=>f.k==="soulring"&&f.i===ring),
        `${vname(id)} vòng ${ring+1} ${sk.name}: ${buffTxt(e)||"không hiệu ứng có lợi"}${e.heal?`, hồi ${hp0} -> ${up.hp}`:""}${e.shield?`, khiên ${up.shield}`:""}`);
    }
    /** Chân Thân: chỉ số × buffPower vòng 7, đòn biến hình theo công đã tăng (hồn thú cách `d`). */
    async function chanU(id,{d=30}={}){
      const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]);
      await test(U,"clear"); await test(U,"rest",{s:30}); await test(U,"ready"); await faceU(); const s0=await stats();
      const bid=await spawnNear(U,4,...uat(d),20); await hush(); await test(U,"status",{s:"stun",secs:10});
      const msg=await chanThanU(), s1=await stats();
      ok(up.ava>def.secs-1&&msg.includes(def.name)&&U.fxs.some(f=>f.k==="avatar"&&f.on),`${def.name}: ${up.ava.toFixed(1)} giây`);
      const okStat=(!cs.atk||Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.02)&&(!cs.spd||Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.02)
        &&(!cs.def||Math.abs(s1.def-s0.def-cs.def)<1e-3)&&(!cs.crit||Math.abs(s1.critB-s0.critB-cs.crit)<1e-3)&&(!cs.hp||s1.maxHp===Math.round(s0.maxHp*(1+cs.hp)));
      ok(okStat,`${def.name} × buffPower(50.000 năm): ${Object.entries(cs).map(([k,v])=>`${k} +${Math.round(v*100)}%`).join(", ")} [công ${s0.atkNow.toFixed(1)} -> ${s1.atkNow.toFixed(1)}]`);
      const bst=def.burst, sts=(bst.status??[]).filter(a=>a.s!=="stun"), want=exp(s1.atkNow*P10(6)*bst.dmg);
      await waitFor(()=>hitsU(bid).length&&stHas(beastOf(U,bid),sts),1000);
      ok(want.includes(hitsU(bid)[0]?.v)&&stHas(beastOf(U,bid),sts),`biến hình: ${hitsU(bid)[0]?.v} (cần ${want.join(" hoặc ")}), ${stTxt(bst.status)||"không trạng thái"}`);
      return {def,cs,bid,s0,s1};
    }
    const endU=async()=>{ await test(U,"clear"); await test(U,"rest",{s:30}); await waitFor(()=>up.ava===0,1500); };

    // Cửu Tinh Thất Sát Kiếm: vòng 5 kiếm mang Phá giáp 2 tầng, vòng 6 kiếm trận 8 nhát; tuyệt kỹ Kiếm Trảm Sơn Hà thật theo tầng Phá giáp.
    {
      const id="cuu_tinh_that_sat_kiem", ult=ringSkill(id,9);
      ok(await lineupU(id),`U: ${vname(id)} ra trận (cấp 100, 10 hồn hoàn)`);
      await loadoutU(id,[4,5,9,-1]); ok(same(vU(id).skills,[4,5,9,-1]),`${vname(id)} mang vòng 5, 6, 10`);
      await ringU(id,4,0); const b6=await ringU(id,5,1,{wait:0});
      ok(beastOf(U,b6)?.armor===3,`${ringSkill(id,5).name}: 8 nhát cộng Phá giáp tới ${beastOf(U,b6)?.armor} tầng (tối đa)`);
      // Hồn thú cách 120 (ngoài nửa trước mặt 64 của bản nhỏ vòng 4) có sẵn Phá giáp 3 tầng: mỗi tầng thêm perStack.
      await test(U,"clear"); await faceU(); const atk=(await stats()).atkNow;
      const fb=await spawnNear(U,4,...uat(120),20); await hush(); await test(U,"status",{s:"stun",secs:10}); await test(U,"status",{s:"armor",n:3});
      const bf=B.fxs.length; await test(U,"ready"); await castU(2,400);
      const want=exp(atk*P10(9)*(ult.dmg+ult.perStack.dmg*3)*(1+3*STATUS.armor.amp)); // Phá giáp còn làm nhận thêm sát thương đòn trực tiếp
      ok(want.includes(hitsU(fb)[0]?.v)&&U.fxs.some(f=>f.k==="ult"&&f.name===ult.name),
        `tuyệt kỹ ${ult.name}: hồn thú cách 120 có 3 tầng Phá giáp ${hitsU(fb)[0]?.v} (cần ${want.join(" hoặc ")}: (${ult.dmg*100}% + 3 × ${ult.perStack.dmg*100}%) × Phá giáp)`);
      ok(B.room.roomId!==U.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===U.room.sessionId),800),"fx tuyệt kỹ: người cùng phòng cũng thấy");
      await endU(); await chanU(id); await endU();
    }
    // Nhu Cốt Thố: vòng 5 Mị Hoặc, vòng 6 thuấn di xa; tuyệt kỹ Bát Đoạn Suất 8 đoạn, hút máu, đoạn cuối Choáng; Chân Thân chí mạng.
    {
      const id="nhu_cot_tho", ult=ringSkill(id,9);
      ok(await lineupU(id),`U: ${vname(id)} ra trận`); await loadoutU(id,[4,5,9,-1]);
      await ringU(id,4,0);
      const x0=up.x, y0=up.y; await ringU(id,5,1,{d:50});
      ok(Math.hypot(up.x-x0,up.y-y0)>=80,`${ringSkill(id,5).name}: thuấn di ${Math.hypot(up.x-x0,up.y-y0).toFixed(0)} pixel`);
      await test(U,"clear"); await faceU(); const atk=(await stats()).atkNow;
      const u=await spawnNear(U,4,...uat(80),20); await hush(); await test(U,"ready"); await test(U,"hurt",{pct:60}); const hp0=up.hp; await castU(2,0);
      ok(await waitFor(()=>hitsU(u).length>=ult.n&&hasSt(beastOf(U,u),"stun"),ult.n*ult.every*1000+1500)&&exp(atk*P10(9)*ult.dmg).includes(hitsU(u)[0]?.v)&&up.hp>hp0,
        `tuyệt kỹ ${ult.name}: ${hitsU(u).length}/${ult.n} đoạn, đoạn đầu ${hitsU(u)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), đoạn cuối Choáng, hút máu ${hp0} -> ${up.hp}`);
      await endU(); await chanU(id); await endU();
    }
    // Tử Vong Chu Hoàng: vòng 5 tơ độc quạt, vòng 6 lưới chụp lên hồn thú ở xa; tuyệt kỹ thiên võng kéo cả vùng; Chân Thân gom quái.
    {
      const id="tu_vong_chu_hoang", ult=ringSkill(id,9);
      ok(await lineupU(id),`U: ${vname(id)} ra trận`); await loadoutU(id,[4,5,9,-1]);
      await ringU(id,4,0);
      const b6=await ringU(id,5,1,{d:110,wait:0}), q6=beastOf(U,b6), d6=q6?Math.hypot(q6.x-up.x,q6.y-up.y):-1;
      ok(d6>ringSkill(id,5).r&&hitsU(b6).length>=ringSkill(id,5).n,`${ringSkill(id,5).name}: lưới đặt vào hồn thú cách ${d6.toFixed(0)} (> bán kính ${ringSkill(id,5).r}, hồn sư không bay tới), ${hitsU(b6).length} nhát`);
      await test(U,"clear"); await faceU(); const atk=(await stats()).atkNow;
      const g1=await spawnNear(U,4,...uat(70),20), g2=await spawnNear(U,4,...uat(130),20); await test(U,"status",{s:"stun",secs:10,all:true});
      await test(U,"ready"); await castU(2,300);
      const dist=bid=>{ const q=beastOf(U,bid); return q?Math.hypot(q.x-up.x,q.y-up.y):-1; }, sts=ult.status;
      ok(await waitFor(()=>[g1,g2].every(g=>dist(g)>=0&&dist(g)<TIERS[4].size/2+16&&stHas(beastOf(U,g),sts)),800)&&exp(atk*P10(9)*ult.dmg).includes(hitsU(g1)[0]?.v),
        `tuyệt kỹ ${ult.name}: ${hitsU(g1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), kéo 2 hồn thú về ${dist(g1).toFixed(0)} / ${dist(g2).toFixed(0)} pixel, ${stTxt(sts)}`);
      await endU(); await chanU(id); await endU();
    }
    // Quỷ Mị: vòng 5 quỷ ảnh hút máu, vòng 6 gia trì cả đội; tuyệt kỹ Quỷ Ảnh Trùng Trùng thật: nổ quanh thân rồi cả đội tàng hình.
    {
      const id="quy_mi", ult=ringSkill(id,9);
      ok(await lineupU(id),`U: ${vname(id)} ra trận`); await loadoutU(id,[4,5,9,-1]);
      await test(U,"hurt",{pct:50}); const hp5=up.hp; await ringU(id,4,0);
      ok(up.hp>hp5,`${ringSkill(id,4).name}: hút máu ${hp5} -> ${up.hp}`);
      await selfU(id,5,1);
      await endU(); await faceU(); const atk=(await stats()).atkNow;
      const q=await spawnNear(U,4,...uat(60),20); await hush(); await test(U,"ready"); const bf=B.fxs.length; await castU(2,300);
      ok(exp(atk*P10(9)*ult.dmg).includes(hitsU(q)[0]?.v)&&stHas(beastOf(U,q),ult.status)&&["hide","atk","leech"].every(k=>hasBuff(up,k))&&U.fxs.some(f=>f.k==="ult"),
        `tuyệt kỹ ${ult.name}: ${hitsU(q)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), Dễ thương, rồi ${buffTxt(ult.self)}`);
      ok(await waitFor(()=>!beastOf(U,q)?.aggro,1500),"tàng hình: hồn thú vừa bị đánh không nhắm tới hồn sư");
      ok(B.room.roomId!==U.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===U.room.sessionId)&&(B.room.state.players.get(U.room.sessionId)?.buff&buffBit("hide")),800),
        "người cùng phòng thấy tuyệt kỹ và hồn sư tàng hình");
      // Tàng hình thuộc hồn sư: đổi võ hồn vẫn còn; đánh thường thì hiện hình.
      await waitFor(()=>up.swCd===0,3500); U.room.send("switch",{slot:U.owned.team.indexOf(rowU("nhu_cot_tho"))});
      ok(await waitFor(()=>U.owned.active===rowU("nhu_cot_tho"),1500)&&hasBuff(up,"hide")&&hasBuff(up,"leech"),"đổi sang Nhu Cốt Thố: vẫn tàng hình, hút huyết");
      U.room.send("attack"); ok(await waitFor(()=>!hasBuff(up,"hide"),1000)&&hasBuff(up,"atk"),"đánh thường: hiện hình, tăng công còn");
      ok(await lineupU(id),`U: ${vname(id)} ra trận lại`); await endU();
      const {def}=await chanU(id); ok(hasBuff(up,"leech"),`${def.name}: hút huyết ${Math.round(def.burst.self.buff.leech*buffPower(Y10[6])*100)}% (cả đội)`);
      await endU();
    }
    // Thiên Càn Bạch Ngọc Đỉnh: vòng 5 trấn hồn Dễ thương + Phá giáp, vòng 6 hồi máu + khiên; tuyệt kỹ Tịnh Thế Lưu Ly thật; Chân Thân.
    {
      const id="thien_can_bach_ngoc_dinh", ult=ringSkill(id,9);
      ok(await lineupU(id),`U: ${vname(id)} ra trận`); await loadoutU(id,[4,5,9,-1]);
      await ringU(id,4,0); await selfU(id,5,1);
      await endU(); await faceU(); const atk=(await stats()).atkNow;
      const t1=await spawnNear(U,4,...uat(40),20), t2=await spawnNear(U,4,...uat(140),20); await hush(); await test(U,"status",{s:"stun",secs:10,all:true});
      await test(U,"ready"); await test(U,"hurt",{pct:60}); const hp0=up.hp; await castU(2,400);
      ok(exp(atk*P10(9)*ult.dmg).includes(hitsU(t1)[0]?.v)&&[t1,t2].every(t=>stHas(beastOf(U,t),ult.status))&&up.hp>hp0&&up.shield>0&&hasBuff(up,"def")&&U.fxs.some(f=>f.k==="ult"),
        `tuyệt kỹ ${ult.name}: ${hitsU(t1)[0]?.v} (cần ${exp(atk*P10(9)*ult.dmg).join(" hoặc ")}), ${stTxt(ult.status)} cả hồn thú cách 140; hồi ${hp0} -> ${up.hp}, khiên ${up.shield}, tăng thủ`);
      await endU(); await test(U,"hurt",{pct:50});
      const {def}=await chanU(id); ok(up.shield>0,`${def.name}: khiên ${up.shield}`);
      await endU();
    }
    // Ô đã chọn lưu DB: thoát rồi vào lại.
    {
      await U.room.leave(); await sleep(500); await enter(U); await waitFor(()=>U.owned);
      ok(REST.every(id=>same(vU(id).skills,[4,5,9,-1])),"thoát vào lại: 5 võ hồn còn lại vẫn mang vòng 5, 6, 10");
      await U.room.leave();
    }
  }
  // ---------- 8.3: 4 võ hồn mới (Phá Hồn Thương, A Ngân, Liệt Hỏa Thương Lang, Băng Phượng Hoàng) ----------
  {
    const NEW=EXTRA_VOHON, n0=VOHON.length-NEW.length;
    ok(NEW.length===4&&NEW.every((id,k)=>vohonIndex(id)===n0+k)&&vohonIndex("cuu_bao_luu_ly_thap")===n0-1,
      `8.3: 4 võ hồn mới ở cuối VOHON (chỉ số ${n0}–${VOHON.length-1}), võ hồn cũ giữ chỉ số: ${NEW.map(id=>`${vname(id)} (${VOHON[vohonIndex(id)].rarity}, ${HE[VOHON[vohonIndex(id)].he].name})`).join(", ")}`);
    ok(AWAKEN_CHOICES.length===17&&AWAKEN_CHOICES.every(v=>v.rarity==="SSR"&&!NEW.includes(v.id)),"lựa chọn thức tỉnh vẫn là 17 SSR cơ bản, không có võ hồn mới");
    ok(NEW.every(id=>skillsOf(id)!==SKILLS&&skillsOf(id).length===4&&TIEN_CO_RIENG[id]&&HIGH_RINGS.every(n=>ringSkill(id,n-1))&&!ringSkill(id,CHAN_THAN_RING-1)
      &&ringSkill(id,9).ult&&/^Tuyệt kỹ:/.test(ringSkill(id,9).desc)&&chanThanOf(id)?.burst&&new Set(skillChoices(id,10).map(r=>ringSkill(id,r).name)).size===9),
      "4 võ hồn mới có hồn kỹ vòng 1–4, 5, 6, 8, 9, tuyệt kỹ vòng 10 (tên không trùng), tiên cơ riêng và Chân Thân vòng 7");
    const ctNames=Object.values(VOHON).map(v=>chanThanOf(v.id)?.name).filter(Boolean);
    ok(new Set(ctNames).size===ctNames.length&&ctNames.length===VOHON.length,`cả ${VOHON.length} võ hồn có Chân Thân, không trùng tên`);
    // Nguồn: mảnh rơi theo bản đồ, rương thú vương, Đại Đấu Hồn Trường.
    const where=id=>Object.values(MAPS).filter(m=>m.shards.includes(id)).map(m=>m.id);
    // Đã chốt 2026-10-20: Phá Hồn Thương chuyển về rơi ở Hải Thần Đảo (trước đó chỉ ở rương mọi thú vương, KING_CHEST.every).
    ok(same(where("a_ngan"),["thanh_hon_thon"])&&same(where("liet_hoa_thuong_lang"),["lac_nhat_sam_lam"])&&same(where("bang_phuong_hoang"),["cuc_bac_chi_dia"])&&same(where("pha_hon_thuong"),["hai_than_dao"]),
      "mảnh: A Ngân ở Thánh Hồn Thôn, Liệt Hỏa Thương Lang ở Lạc Nhật Sâm Lâm, Băng Phượng Hoàng ở Cực Bắc Chi Địa, Phá Hồn Thương ở Hải Thần Đảo");
    const kings=Object.values(MAPS).filter(m=>m.king).map(m=>m.id);
    ok(kings.length>=4&&!KING_CHEST.every.length&&kings.every(m=>kingShardPool(m).filter(x=>x.vohon==="pha_hon_thuong").length===(m==="hai_than_dao"?1:0))
      &&kingShardPool("hai_than_dao").some(x=>x.vohon==="pha_hon_thuong"&&x.w===3)&&kingShardPool("lac_nhat_sam_lam").some(x=>x.vohon==="liet_hoa_thuong_lang"&&x.w===3)
      &&kingShardPool("cuc_bac_chi_dia").some(x=>x.vohon==="bang_phuong_hoang"&&x.w===3)&&kingShardPool("tinh_dau_ngoai_vi")[3].vohon===KING_CHEST.fire,
      `rương thú vương (${kings.length} bản đồ): mảnh bản đồ trọng số 3; Phá Hồn Thương chỉ ở rương Hải Thần Đảo (trọng số 3), không còn ở rương khác`);
    ok(NEW.every(id=>ARENA_SHARDS.includes(id)&&itemDef(shardCode(id))?.kind==="manh_vo_hon"),"mảnh 4 võ hồn mới là vật phẩm và nằm trong thưởng Đại Đấu Hồn Trường");

    const N=await bot("Tester VH","yeu_ho",{sex:0,hair:2,hairCol:4,outfitCol:2});
    await waitFor(()=>N.owned&&N.squad&&N.bag&&meOf(N)); const np=meOf(N);
    // Mở bằng 50 mảnh (hook give): 49 mảnh bị từ chối, đủ 50 thì mở ở cấp 1, 1★, không tự vào đội, hết mảnh.
    async function shardN(type,vohon){ const l=N.logs.length; N.room.send(type,{vohon}); await waitFor(()=>N.logs.length>l,2000); await sleep(150); return N.logs.at(-1)??""; }
    for(const id of NEW){
      const code=shardCode(id); await test(N,"give",{code,qty:SHARD_UNLOCK-1});
      const t1=await shardN("unlock",id);
      ok(!N.owned.list.some(v=>v.vohon===id)&&qtyOf(N,code)===SHARD_UNLOCK-1,`${vname(id)}: ${SHARD_UNLOCK-1} mảnh chưa mở được (${t1})`);
      await test(N,"give",{code,qty:1}); const t2=await shardN("unlock",id), v=N.owned.list.find(v=>v.vohon===id);
      ok(v&&v.level===1&&v.stars===1&&!N.owned.team.includes(v.rowId)&&qtyOf(N,code)===0,`${vname(id)}: đủ ${SHARD_UNLOCK} mảnh thì mở, cấp 1, 1★, chưa vào đội (${t2})`);
    }
    const rowN=id=>N.owned.list.find(v=>v.vohon===id).rowId, vN=id=>N.owned.list.find(v=>v.vohon===id);
    // Xếp đội 4 võ hồn mới (ngoài giao chiến).
    await test(N,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(N,NEW.map(rowN));
    ok(same(N.owned.team,NEW.map(rowN))&&await waitFor(()=>np.vh===vohonIndex(NEW[0])),`xếp đội 4 võ hồn mới: ${NEW.map(vname).join(", ")}`);
    const Y10=[423,764,1760,5000,12000,20000,50000,100000,100000,100000], P10=i=>skillPower(Y10[i]);
    for(const id of NEW) await test(N,"set",{rowId:rowN(id),level:100,xp:0,rings:Y10});
    const stats=async()=>(await test(N,"stats")).live, hush=()=>test(N,"status",{s:"silence",secs:20,all:true});
    // Đội mới vẫn chứa võ hồn đang ra trận thì võ hồn đó giữ nguyên: gửi [id,0,0,0] trước rồi mới đội đủ 4.
    async function lineupN(id){ await test(N,"clear"); await test(N,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(N,[rowN(id),0,0,0]);
      await sendTeam(N,[rowN(id),...NEW.filter(x=>x!==id).map(rowN)]); return N.owned.active===rowN(id)&&await waitFor(()=>np.vh===vohonIndex(id)); }
    async function loadoutN(id,skills){ const n=N.ownedMsgs, l=N.logs.length; N.room.send("loadout",{rowId:rowN(id),skills}); await waitFor(()=>N.ownedMsgs>n&&N.logs.length>l,1500); await sleep(80); }
    const castN=(i,wait=250)=>skillCast(N,i,wait);
    const pc=STATUS.poison.col, hitsN=bid=>dmgsOn(N,bid).filter(x=>x.c!==pc&&x.c!==STATUS.burn.col);
    const stHas=(b,list)=>!!b&&(list??[]).every(a=>a.s==="armor"?b.armor>=Math.min(a.n??1,3):a.s==="burn"?b.burn>=1:hasSt(b,a.s));
    const stTxt=list=>(list??[]).map(a=>`${STATUS[a.s].name}${a.n?` ${a.n} tầng`:""}`).join(", ");
    const buffTxt=e=>Object.keys(e?.buff??{}).map(k=>BUFFS[k].name).join(", ");
    ok(await leaveSafe(N),"N: ra khỏi làng");
    let [nx,ny]=clearDir(np.x,np.y,170); const nat=d=>[Math.round(nx*d),Math.round(ny*d)];
    async function faceN(){ [nx,ny]=clearDir(np.x,np.y,170); await step(N,nx,ny); }
    /** Hồn kỹ đánh vòng `ring` ở ô `i`: hồn thú bậc 4 cách `d` theo hướng nhìn, đứng yên bằng Choáng; nhát đầu theo năm và trạng thái. */
    async function ringN(id,ring,i,{d=30,wait=450}={}){
      const sk=ringSkill(id,ring), atk=(await stats()).atkNow;
      await test(N,"clear"); await faceN(); const bid=await spawnNear(N,4,...nat(d),20); await hush(); await test(N,"status",{s:"stun",secs:10});
      await test(N,"ready"); await castN(i,wait);
      const n=(sk.area==="around"||sk.area==="target")&&sk.n>1?sk.n:1, sts=[...(sk.status??[]),...(sk.finisher??[])].filter(a=>a.s!=="stun");
      await waitFor(()=>hitsN(bid).length>=n&&stHas(beastOf(N,bid),sts),n>1?n*(sk.every??0.15)*1000+1500:1500);
      const want=exp(atk*P10(ring)*sk.dmg), got=hitsN(bid).map(x=>x.v), b=beastOf(N,bid);
      ok(want.includes(got[0])&&got.length>=n&&N.fxs.some(f=>f.k==="soulring"&&f.i===ring),`${vname(id)} vòng ${ring+1} ${sk.name}: ${got.length}/${n} nhát, nhát đầu ${got[0]} (cần ${want.join(" hoặc ")})`);
      if(sts.length) ok(stHas(b,sts),`${sk.name}: ${stTxt(sts)} [Phá giáp ${b?.armor}, Thiêu đốt ${b?.burn}]`);
      return bid;
    }
    /** Hồn kỹ lên bản thân vòng `ring` ở ô `i`: hiệu ứng có lợi, hồi sinh lực cả đội, khiên (đang mất nửa sinh lực). */
    async function selfN(id,ring,i){
      const sk=ringSkill(id,ring), e=sk.self;
      await test(N,"clear"); await test(N,"rest",{s:30}); await test(N,"ready"); await test(N,"hurt",{pct:50}); const hp0=np.hp; await castN(i,300);
      ok(Object.keys(e.buff??{}).every(k=>hasBuff(np,k))&&(!e.heal||np.hp>hp0)&&(!e.shield||np.shield>0)&&N.fxs.some(f=>f.k==="soulring"&&f.i===ring),
        `${vname(id)} vòng ${ring+1} ${sk.name}: ${buffTxt(e)||"không hiệu ứng có lợi"}${e.heal?`, hồi ${hp0} -> ${np.hp}`:""}${e.shield?`, khiên ${np.shield}`:""}`);
    }
    const endN=async()=>{ await test(N,"clear"); await test(N,"rest",{s:30}); await waitFor(()=>np.ava===0,1500); };
    for(const id of NEW){
      ok(await lineupN(id),`N: ${vname(id)} ra trận (cấp 100, 10 hồn hoàn)`);
      ok(same(vN(id).skills??[...DEFAULT_LOADOUT],[...DEFAULT_LOADOUT])||same(loadoutOf(id,vN(id).skills),[...DEFAULT_LOADOUT]),`${vname(id)}: 4 ô mặc định vòng 1–4`);
      // Vòng 1–4 (U / I / O / P).
      for(let r=0;r<4;r++){
        const sk=ringSkill(id,r);
        if(sk.area==="self") await selfN(id,r,r);
        else {
          if(sk.self) { await test(N,"hurt",{pct:50}); }
          const hp0=np.hp; await ringN(id,r,r,{wait:sk.n>1?0:450});
          if(sk.self) ok(Object.keys(sk.self.buff??{}).every(k=>hasBuff(np,k))&&(!sk.self.heal||np.hp>hp0),`${sk.name}: lên bản thân ${buffTxt(sk.self)}${sk.self.heal?` hồi ${hp0} -> ${np.hp}`:""}`);
        }
        await test(N,"rest",{s:30});
      }
      // Tiên cơ riêng: đổi tay vào với năng lượng đầy.
      {
        const own=TIEN_CO_RIENG[id], atk=(await stats()).atkNow, other=NEW[(NEW.indexOf(id)+1)%NEW.length];
        ok(await lineupN(other),`N: ${vname(other)} ra trận, ${vname(id)} chờ`); await faceN(); await test(N,"clear");
        if(own.self?.heal){ await test(N,"hurt",{pct:50}); await sleep(150); }
        const r=await tienCo(N,rowN(id),{tier:4,dx:nat(own.area==="dash"?40:20)[0],dy:nat(own.area==="dash"?40:20)[1]});
        const w=exp(atk*own.dmg), first=hitsN(r.bid)[0]?.v, list=[...(own.status??[]),...(own.finisher??[])].filter(a=>a.s!=="stun");
        ok(r.fx?.own&&r.fx.vh===vohonIndex(id)&&w.includes(first),`tiên cơ riêng ${vname(id)} ${own.name}: sát thương ${first} (cần ${w.join(" hoặc ")})`);
        if(list.length) ok(await waitFor(()=>stHas(beastOf(N,r.bid),list),1500),`${own.name}: gây ${stTxt(list)}`);
        await test(N,"rest",{s:30});
      }
      // Vòng 5, 6, tuyệt kỹ vòng 10; Chân Thân vòng 7 (phím R).
      ok(await lineupN(id),`N: ${vname(id)} ra trận lại`); await loadoutN(id,[4,5,9,-1]); ok(same(vN(id).skills,[4,5,9,-1]),`${vname(id)} mang vòng 5, 6, 10`);
      for(const [r,i] of [[4,0],[5,1],[9,2]]){
        const sk=ringSkill(id,r);
        if(sk.area==="self") await selfN(id,r,i);
        else {
          const bf=B.fxs.length; if(sk.self) await test(N,"hurt",{pct:50}); const hp0=np.hp;
          await ringN(id,r,i,{d:sk.at?110:30,wait:sk.n>1?0:450});
          if(sk.self) ok(Object.keys(sk.self.buff??{}).every(k=>hasBuff(np,k))&&(!sk.self.heal||np.hp>hp0)&&(!sk.self.shield||np.shield>0),
            `${sk.name}: lên bản thân ${buffTxt(sk.self)}${sk.self.heal?` hồi ${hp0} -> ${np.hp}`:""}${sk.self.shield?`, khiên ${np.shield}`:""}`);
          if(sk.ult) ok(N.fxs.some(f=>f.k==="ult"&&f.name===sk.name)&&(B.room.roomId!==N.room.roomId||await waitFor(()=>B.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===N.room.sessionId),800)),
            `tuyệt kỹ ${sk.name}: fx ult (người cùng phòng cũng thấy)`);
        }
        await test(N,"rest",{s:60});
      }
      {
        await endN(); const def=chanThanOf(id), cs=chanThanStats(def,Y10[6]);
        await test(N,"ready"); await faceN(); const s0=await stats();
        const bid=await spawnNear(N,4,...nat(30),20); await hush(); await test(N,"status",{s:"stun",secs:10});
        const l=N.logs.length; N.fxs=[]; N.dmgs=[]; N.room.send("chanthan"); await waitFor(()=>N.logs.length>l,1500); await sleep(120);
        const msg=N.logs.at(-1)??"", s1=await stats();
        ok(np.ava>def.secs-1&&msg.includes(def.name)&&N.fxs.some(f=>f.k==="avatar"&&f.on),`${def.name}: ${np.ava.toFixed(1)} giây`);
        const okStat=(!cs.atk||Math.abs(s1.atkNow-s0.atkNow*(1+cs.atk))<0.02)&&(!cs.spd||Math.abs(s1.spd-s0.spd*(1+cs.spd))<0.02)
          &&(!cs.def||Math.abs(s1.def-s0.def-cs.def)<1e-3)&&(!cs.crit||Math.abs(s1.critB-s0.critB-cs.crit)<1e-3)&&(!cs.hp||s1.maxHp===Math.round(s0.maxHp*(1+cs.hp)));
        ok(okStat,`${def.name} × buffPower(50.000 năm): ${Object.entries(cs).map(([k,v])=>`${k} +${Math.round(v*100)}%`).join(", ")} [công ${s0.atkNow.toFixed(1)} -> ${s1.atkNow.toFixed(1)}]`);
        const bst=def.burst, sts=(bst.status??[]).filter(a=>a.s!=="stun"), want=exp(s1.atkNow*P10(6)*bst.dmg);
        await waitFor(()=>hitsN(bid).length&&stHas(beastOf(N,bid),sts),1000);
        ok(want.includes(hitsN(bid)[0]?.v)&&stHas(beastOf(N,bid),sts),`biến hình: ${hitsN(bid)[0]?.v} (cần ${want.join(" hoặc ")}), ${stTxt(bst.status)||"không trạng thái"}`);
        await endN();
      }
    }
    // Mảnh rơi đúng bản đồ: hạ hồn thú ở Thánh Hồn Thôn (hook shard cố định võ hồn A Ngân) thì +1 mảnh A Ngân vào túi người hạ.
    // Lạc Nhật / Cực Bắc: phần BĐ6b / BĐ6c hạ hồn thú với từng võ hồn của bản đồ (gồm Liệt Hỏa Thương Lang, Băng Phượng Hoàng).
    {
      const list=MAPS[N.room.state.mapId].shards, i=list.indexOf("a_ngan"), code=shardCode("a_ngan"), q0=qtyOf(N,code);
      await test(N,"clear"); await test(N,"shard",{r:0,i}); await test(N,"beast",{dx:14,dy:0,years:200}); await test(N,"slay");
      ok(N.room.state.mapId==="thanh_hon_thon"&&i>=0&&await waitFor(()=>qtyOf(N,code)===q0+1,1500),`Thánh Hồn Thôn: hạ hồn thú 200 năm rơi 1 Mảnh A Ngân (${q0} -> ${qtyOf(N,code)})`);
      await test(N,"shard",{r:-1}); await test(N,"clear");
    }
    // Thoát vào lại: 4 võ hồn mới vẫn sở hữu, đội và ô mang theo giữ nguyên.
    await N.room.leave(); await sleep(500); await enter(N); await waitFor(()=>N.owned);
    ok(NEW.every(id=>vN(id)?.level===100&&same(vN(id).skills,[4,5,9,-1]))&&N.owned.team.every(r=>NEW.some(id=>rowN(id)===r)),"thoát vào lại: 4 võ hồn mới, đội và ô mang theo còn nguyên");
    await N.room.leave();
  }
  // ---------- 9.5: hiệu ứng hồn kỹ theo sao võ hồn (STAR_SKILL, 4★ hồi chiêu, 6★ tiên cơ riêng) ----------
  {
    const near=(a,b)=>Math.abs(a-b)<1e-9;
    ok(near(starSkillMult(1),1)&&near(starSkillMult(2),1+STAR_SKILL)&&near(starSkillMult(MAX_STARS),1.15)&&near(starSkillMult(0),1)&&near(starSkillMult(99),1.15)
      &&starCdMult(STAR_CD_STARS-1)===1&&starCdMult(STAR_CD_STARS)===STAR_CD&&starCdMult(MAX_STARS)===STAR_CD
      &&near(starTienCoMult(STAR_TIEN_CO_STARS-1),starSkillMult(STAR_TIEN_CO_STARS-1))&&near(starTienCoMult(MAX_STARS),1.15+STAR_TIEN_CO)
      &&starRing(0)&&starRing(STAR_SKILL_RINGS-1)&&!starRing(STAR_SKILL_RINGS),
      `hàm thuần: hồn kỹ vòng 1–${STAR_SKILL_RINGS} +${Math.round(STAR_SKILL*100)}%/sao (6★ ×${starSkillMult(6)}), từ ${STAR_CD_STARS}★ hồi chiêu ×${STAR_CD}, tiên cơ riêng 6★ ×${starTienCoMult(6).toFixed(2)}`);
    const S=await bot("Tester Sao","yeu_ho",{sex:1,hair:2,hairCol:3,outfitCol:1});
    await waitFor(()=>S.owned&&S.squad&&meOf(S)); const sp=meOf(S), V="cuu_tinh_that_sat_kiem";
    await test(S,"grant",{vohon:V});
    const rowS=id=>S.owned.list.find(v=>v.vohon===id).rowId, vS=id=>S.owned.list.find(v=>v.vohon===id);
    const Y=[423,764,1760], sk=skillsOf(V)[0], own=TIEN_CO_RIENG[V], P=skillPower(Y[0]);
    await test(S,"set",{rowId:rowS(V),level:30,xp:0,rings:Y,stars:1});
    await sendTeam(S,[rowS(V),0,0,0]); await sendTeam(S,[rowS(V),rowS("yeu_ho"),0,0]);
    ok(S.owned.active===rowS(V)&&await waitFor(()=>sp.vh===vohonIndex(V))&&vS(V).stars===1,`S: ${vname(V)} ra trận (cấp 30, 3 hồn hoàn, 1★), ${vname("yeu_ho")} dự bị`);
    ok(await leaveSafe(S),"S: ra khỏi làng");
    const stats=async()=>(await test(S,"stats")).live;
    const hits=bid=>dmgsOn(S,bid);
    async function setStars(stars){ await test(S,"set",{rowId:rowS(V),stars}); return waitFor(()=>vS(V)?.stars===stars,1500); }
    // Cùng hồn kỹ vòng 1 (Thất Sát Kiếm Khí, nửa trước mặt) ở mỗi mức sao: nhát đầu lên hồn thú đứng yên, hồi chiêu ngay sau khi tung.
    async function cast(stars){
      await setStars(stars); await test(S,"clear"); await test(S,"ready");
      const [dx,dy]=clearDir(sp.x,sp.y,110); await step(S,dx,dy);
      const bid=await spawnNear(S,1,Math.round(dx*30),Math.round(dy*30),20); await test(S,"status",{s:"stun",secs:10,all:true});
      // Hồi chiêu đọc ở bản vá state đầu tiên có hồi chiêu (tin dmg có thể tới trước; đọc sau một khoảng cố định thì đã trôi bớt).
      const atk=(await stats()).atkNow; S.dmgs=[]; S.room.send("skill",{i:0}); let cd=0;
      await waitFor(()=>{ cd=Math.max(cd,sp.cds[0]??0); return hits(bid).length&&cd>0; },1500);
      return {v:hits(bid)[0]?.v,atk,cd,want:exp(atk*P*starSkillMult(stars)*sk.dmg)};
    }
    const r1=await cast(1), r4=await cast(4), r6=await cast(6);
    ok(r1.want.includes(r1.v)&&Math.abs(r1.cd-sk.cd)<0.25,`1★ ${sk.name}: ${r1.v} (cần ${r1.want.join(" hoặc ")}), hồi ${r1.cd.toFixed(2)} giây (cần ${sk.cd})`);
    ok(r4.want.includes(r4.v)&&Math.abs(r4.cd-sk.cd*STAR_CD)<0.25&&r4.cd<r1.cd-0.2,
      `4★: ${r4.v} (cần ${r4.want.join(" hoặc ")}, hồn kỹ ×${starSkillMult(4)}), hồi chiêu ngắn hơn ${r4.cd.toFixed(2)} giây (cần ${(sk.cd*STAR_CD).toFixed(2)})`);
    ok(r6.want.includes(r6.v)&&Math.abs(r6.cd-sk.cd*STAR_CD)<0.25,`6★: ${r6.v} (cần ${r6.want.join(" hoặc ")}, hồn kỹ ×${starSkillMult(6)} và công ×${starMult(6)} của STAR_STAT)`);
    // Tỉ lệ nhát đầu 6★ / 1★ = công (STAR_STAT, cộng minh) × starSkillMult(6); cả hai không chí mạng thì so thẳng.
    if(r1.v===r1.want[0]&&r6.v===r6.want[0]){ const k=(r6.atk/r1.atk)*starSkillMult(6);
      ok(Math.abs(r6.v/r1.v-k)<2/r1.v+0.01,`tỉ lệ 6★ / 1★: ${(r6.v/r1.v).toFixed(3)} (cần ${k.toFixed(3)} = công ${(r6.atk/r1.atk).toFixed(3)} × ${starSkillMult(6)})`); }
    // Mọi hồn kỹ vòng 1–4 đều nhận: ô I (vòng 2) cũng hồi chiêu ngắn hơn ở 6★.
    { await test(S,"ready"); const s2=skillsOf(V)[1]; const bid=await spawnNear(S,1,20,0,20); await test(S,"status",{s:"stun",secs:10,all:true});
      S.room.send("skill",{i:1}); await waitFor(()=>sp.cds[1]>0,1500);
      ok(Math.abs(sp.cds[1]-s2.cd*STAR_CD)<0.25,`6★ ${s2.name} (vòng 2): hồi ${sp.cds[1].toFixed(2)} giây (cần ${(s2.cd*STAR_CD).toFixed(2)})`); if(bid) await test(S,"clear"); }
    // Tiên cơ riêng (Thất Sát Kiếm Vực, quanh thân): 1★ ×1, 6★ ×starTienCoMult(6) = 1,15 + 0,2.
    async function tc(stars){
      await setStars(stars); await test(S,"clear"); await test(S,"energy",{v:0});
      await waitFor(()=>sp.swCd===0,4000); S.room.send("switch",{slot:1}); await waitFor(()=>S.owned.active===rowS("yeu_ho"),2000);
      await test(S,"rest",{s:1}); await waitFor(()=>sp.swCd===0,4000);
      await test(S,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sqOf(S,rowS(V))?.en===TIEN_CO_MAX,1500);
      await test(S,"clear"); const bid=await spawnNear(S,1,20,0,20); S.dmgs=[];
      S.room.send("switch",{slot:0}); await waitFor(()=>S.owned.active===rowS(V)&&hits(bid).length,2000); await sleep(80);
      const atk=(await stats()).atkNow;
      return {v:hits(bid)[0]?.v,want:exp(atk*own.dmg*starTienCoMult(stars))};
    }
    const t1=await tc(1), t6=await tc(6);
    ok(t1.want.includes(t1.v),`tiên cơ riêng 1★ ${own.name}: ${t1.v} (cần ${t1.want.join(" hoặc ")})`);
    ok(t6.want.includes(t6.v),`tiên cơ riêng 6★: ${t6.v} (cần ${t6.want.join(" hoặc ")}, ×${starTienCoMult(6).toFixed(2)} = hồn kỹ +15% và 6★ +${Math.round(STAR_TIEN_CO*100)}%)`);
    // Sao lưu DB (vohons.stars, có từ 3.4): thoát vào lại vẫn 6★.
    await S.room.leave(); await sleep(500); await enter(S); await waitFor(()=>S.owned);
    ok(vS(V)?.stars===6,`thoát vào lại: ${vname(V)} vẫn ${vS(V)?.stars}★`);
    await S.room.leave();
  }
  // ---------- 9.6: hồn kỹ Chân Thân (ChanThanDef.skill: ô P đổi thành hồn kỹ này trong lúc biến hình, hồi chiêu riêng) ----------
  {
    // Hàm thuần: đủ 24 võ hồn, 40 hồn lực, hồi 8 giây; mạnh hơn vòng 9 khoảng 20% (tổng hệ số sát thương), cùng lối đánh.
    const tot=s=>s.dmg*(s.n??1);
    const bad=VOHON.filter(v=>{ const ct=chanThanOf(v.id)?.skill, r9=ringSkill(v.id,8); if(!ct||ct.cost!==CHAN_THAN_SKILL_COST||ct.cd!==CHAN_THAN_SKILL_CD||!r9) return true;
      if(tot(r9)>0&&Math.abs(tot(ct)/tot(r9)-1.2)>0.05) return true;
      if(v.he==="phu_tro"&&!(ct.self&&(ct.self.heal||ct.self.shield||ct.self.buff))) return true;
      if(v.he==="khong_che"&&!((ct.area==="around"||(ct.area==="proj"&&ct.spread>=360))&&[...(ct.status??[]),...(ct.finisher??[])].some(a=>["stun","root","silence","lock","allure","slow"].includes(a.s)))) return true;
      return false; });
    ok(VOHON.length===24&&!bad.length&&CHAN_THAN_SKILL_SLOT===3,
      `cả ${VOHON.length} võ hồn có hồn kỹ Chân Thân (${CHAN_THAN_SKILL_COST} hồn lực, hồi ${CHAN_THAN_SKILL_CD} giây, ×1,2 vòng 9, đúng lối đánh)${bad.length?` – lỗi: ${bad.map(v=>v.id).join(", ")}`:""}`);
    const C=await bot("Tester CTS","yeu_ho",{sex:0,hair:3,hairCol:2,outfitCol:4});
    await waitFor(()=>C.owned&&C.squad&&meOf(C)); const cp=meOf(C), V="bang_phuong_hoang", def=chanThanOf(V), ct=def.skill, sP=skillsOf(V)[3];
    await test(C,"grant",{vohon:V});
    const rowC=id=>C.owned.list.find(v=>v.vohon===id).rowId;
    const Y=[423,764,1760,5000,12000,20000,50000,100000,100000,100000];
    await test(C,"set",{rowId:rowC(V),level:100,xp:0,rings:Y});
    await sendTeam(C,[rowC(V),0,0,0]); await sendTeam(C,[rowC(V),rowC("yeu_ho"),0,0]);
    ok(C.owned.active===rowC(V)&&await waitFor(()=>cp.vh===vohonIndex(V))&&!bondsOf([V,"yeu_ho"]).length,`C: ${vname(V)} ra trận (cấp 100, 10 hồn hoàn), ô P mặc định ${sP.name}`);
    ok(await leaveSafe(C),"C: ra khỏi làng");
    const stats=async()=>(await test(C,"stats")).live, hush=()=>test(C,"status",{s:"silence",secs:20,all:true});
    // Chờ fx soulring (hồn kỹ đã tung) rồi chờ nhát đầu lên hồn thú `bid` và bản vá state (tin tới trước bản vá state).
    async function castP(bid){ C.dmgs=[]; C.fxs=[]; C.room.send("skill",{i:CHAN_THAN_SKILL_SLOT});
      if(!bid){ await sleep(300); return; }
      await waitFor(()=>C.fxs.some(f=>f.k==="soulring"),1500); await waitFor(()=>dmgsOn(C,bid).length,1000); await sleep(150); }
    async function arena(){ await test(C,"clear"); const [dx,dy]=clearDir(cp.x,cp.y,110); await step(C,dx,dy);
      const bid=await spawnNear(C,4,Math.round(dx*30),Math.round(dy*30),20); await hush(); return bid; }
    // Chưa Chân Thân: ô P là hồn kỹ vòng 4 đang mang.
    await test(C,"ready"); let bid=await arena(); let atk=(await stats()).atkNow; await castP(bid);
    let want=exp(atk*skillPower(Y[3])*sP.dmg);
    ok(want.includes(dmgsOn(C,bid)[0]?.v)&&C.fxs.some(f=>f.k==="soulring"&&f.i===3&&!f.ct)&&Math.abs(cp.cds[3]-sP.cd)<0.5&&cp.ctCd===0,
      `chưa Chân Thân: ô P tung ${sP.name} ${dmgsOn(C,bid)[0]?.v} (cần ${want.join(" hoặc ")}), hồi ô P ${cp.cds[3].toFixed(1)} giây`);
    // Chân Thân: ô P thành hồn kỹ Chân Thân, dù hồn kỹ ô P cũ đang hồi chiêu; hồi chiêu riêng, không đụng hồi chiêu ô P cũ.
    bid=await arena(); const l=C.logs.length; C.room.send("chanthan"); await waitFor(()=>C.logs.length>l&&cp.ava>0,1500); await sleep(600);
    atk=(await stats()).atkNow; const mp0=cp.mp, cd0=cp.cds[3]; await castP(bid); await waitFor(()=>cp.ctCd>0,800);
    want=exp(atk*skillPower(Y[CHAN_THAN_RING-1])*ct.dmg);
    ok(cp.ava>0&&want.includes(dmgsOn(C,bid)[0]?.v)&&C.fxs.some(f=>f.k==="soulring"&&f.ct&&f.i===CHAN_THAN_RING-1),
      `đang Chân Thân: ô P tung ${ct.name} ${dmgsOn(C,bid)[0]?.v} (cần ${want.join(" hoặc ")}: công đã tăng × sức mạnh hồn hoàn vòng 7 ×${skillPower(Y[6])})`);
    ok(Math.abs(cp.ctCd-ct.cd)<0.5&&cp.cds[3]>0&&cp.cds[3]<=cd0&&mp0-cp.mp>ct.cost-30&&mp0-cp.mp<=ct.cost+1, // hồn lực tự hồi tới ~28/giây ở cấp 100 trong lúc chờ
      `hồi chiêu riêng ${cp.ctCd.toFixed(1)} giây (cần ${ct.cd}), ô P cũ vẫn ${cp.cds[3].toFixed(1)} giây (trước ${cd0.toFixed(1)}), hồn lực ${mp0} -> ${cp.mp} (tốn ${ct.cost}, trừ phần tự hồi)`);
    ok(await waitFor(()=>hasSt(beastOf(C,bid),"vuln")&&hasSt(beastOf(C,bid),"slow"),800),`${ct.name}: khống chế diện rộng (Choáng, Làm chậm, Dễ thương)`);
    await castP(); ok(!C.fxs.some(f=>f.k==="soulring")&&cp.ava>0,"hồn kỹ Chân Thân đang hồi chiêu: ô P không tung");
    // Hết Chân Thân: ô P trở lại hồn kỹ vòng 4.
    await test(C,"rest",{s:Math.ceil(cp.ava)+1}); ok(await waitFor(()=>cp.ava===0,3000),"hết Chân Thân");
    await test(C,"ready"); bid=await arena(); atk=(await stats()).atkNow; await castP(bid);
    want=exp(atk*skillPower(Y[3])*sP.dmg);
    ok(want.includes(dmgsOn(C,bid)[0]?.v)&&C.fxs.some(f=>f.k==="soulring"&&f.i===3&&!f.ct)&&cp.ctCd===0,
      `hết Chân Thân: ô P về ${sP.name} ${dmgsOn(C,bid)[0]?.v} (cần ${want.join(" hoặc ")})`);
    await C.room.leave();
  }
  // ---------- 3.5: chiêu có báo trước của hồn thú từ 1.000 năm ----------
  {
    // Hàm thuần: mọi loài của vùng có hồn thú từ 1.000 năm ở Ngoại vi / Nội địa đều có chiêu; hình vùng tính trúng đúng.
    const zonesOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[])
      .filter(o=>(o.type??o.class)==="zone").map(o=>{ const pr=n=>(o.properties??[]).find(q=>q.name===n)?.value;
        return {yr:parseLevelRange(pr("years")),sp:String(pr("beasts")??"").split(",").map(x=>x.split(":")[0].trim()).filter(Boolean)}; });
    const need=new Set(), miss=[];
    for(const m of ["tinh_dau_ngoai_vi","tinh_dau_noi_dia","cuc_bac_chi_dia"]) for(const z of zonesOf(m)) if(z.yr[1]>=BEAST_SKILL_YEARS)
      for(const sp of z.sp){ need.add(sp); if(!beastSkillOf(sp,Math.max(BEAST_SKILL_YEARS,z.yr[0]))) miss.push(sp); }
    ok(need.size>=27&&!miss.length,`mọi loài từ 1.000 năm ở Ngoại vi / Nội địa / Cực Bắc có chiêu báo trước (${need.size} loài)`+(miss.length?`: thiếu ${miss.join(", ")}`:""));
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
      const r=await test(F,"spawn",{tier:tierOfYears(years),years,species:sp,dx,dy});
      await waitFor(()=>{ if(r?.bid) return F.room.state.beasts.has(r.bid)&&(id=r.bid);
        F.room.state.beasts.forEach((o,k)=>{ if(!before.has(k)&&Math.hypot(o.x-x,o.y-y)<30&&BEASTS[o.species]?.id===sp) id=k; }); return id; });
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
    // Dữ liệu: mỗi tầng niên hạn (các vùng cùng `years`; bản đồ cũ mỗi vùng một tầng, bản đồ lớn tools/maps chia tầng thành vài vùng có
    // tên, 11.3) của các bản đồ săn có đúng 1 object `elite`; mã trong BOSSES, 2 chiêu, loài gốc có trong BEASTS.
    const objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
    const inR=(r,x,y)=>x>=r.x&&x<=r.x+(r.width??r.w)&&y>=r.y&&y<=r.y+(r.height??r.h);
    const bad=[];
    for(const m of ["thanh_hon_thon","tinh_dau_ngoai_vi","tinh_dau_noi_dia","lac_nhat_sam_lam","cuc_bac_chi_dia","hai_than_dao"]){ // BĐ6b thêm Lạc Nhật, BĐ6c Cực Bắc, BĐ6d Hải Thần Đảo
      const os=objsOf(m), zs=os.filter(o=>o.type==="zone"), es=os.filter(o=>o.type==="elite");
      const yr=z=>z.properties.find(q=>q.name==="years")?.value;
      for(const y of new Set(zs.map(yr))){ const k=es.filter(e=>zs.some(z=>yr(z)===y&&inR(z,e.x+e.width/2,e.y+e.height/2))).length; if(k!==1) bad.push(`${m}/${y} năm: ${k}`); }
      for(const e of es){ const id=e.properties.find(q=>q.name==="boss")?.value, d=BOSSES[bossIndex(id)]; if(!d||d.rank!==1||d.skills.length!==2||beastIndex(d.species)<0) bad.push(`${m}/${id}`); }
    }
    ok(!bad.length,`mỗi tầng niên hạn của 6 bản đồ săn có đúng 1 tinh anh (BOSSES, 2 chiêu, loài gốc có thật)`+(bad.length?`: ${bad.join("; ")}`:""));
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
    G.fxs=[]; await test(G,"bhp",{pct:40,bid:tnid()}); // theo bid: bầy tinh anh gọi ra có thể đứng gần hơn
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
    // Trúng độc của H còn trên tinh anh thì máu tụt giữa lúc đọc tỉ lệ và lúc hook etick (mỗi nhát ~2% máu tối đa): chờ hết độc trước.
    await away(G); await waitFor(()=>!((tn()?.st??0)&statusBit("poison")),(STATUS.poison.secs+2)*1000);
    const r1=tn().hp/tn().maxHp; await test(G,"etick",{s:ELITE.outSecs+1}); I=await info(TN);
    ok(I.engaged&&I.parts.join()===hid&&I.n===1&&I.maxHp===I.base&&Math.abs(I.hp/I.maxHp-r1)<0.02,`G ở ngoài ${ELITE.radius} pixel ${ELITE.outSecs} giây: bị loại, 1 người, máu ${I.hp}/${I.maxHp} (giữ tỉ lệ)`);
    await near(G,TN,30); await test(G,"bhp",{pct:100,bid:tnid()}); await tranAp(); I=await info(TN); ok(I.n===2&&I.parts.length===2,`G quay lại đánh: lại 2 người, máu ${I.hp}/${I.maxHp}`);
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
    await test(G,"bhp",{pct:1,bid:oldId}); G.elite=[]; const before=new Set(st.drops.keys());
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
    // Lịch boss của server (20:00 / 22:00 giờ Việt Nam) chen vào các kiểm tra dùng hook `king` nếu đồng hồ lịch đang trong lúc báo trước
    // hay lúc thú vương ở bản đồ. GAME_TEST mặc định cho lịch đứng yên ngoài mọi khung; server chạy đồng hồ thật (BOSS_CLOCK=real) thì báo.
    { const {now,mode}=await bossClock(A), nx=kingNext(now);
      if(mode.startsWith("frozen")){ await sleep(300); ok((await bossClock(A)).now===now&&kingActive(now)===null&&nx-now>(KING.warnSecs+1800)*1000,
        `GAME_TEST: lịch boss đứng yên ở ${vnHHMM(now)} giờ Việt Nam (${mode}), không theo giờ thật: lịch thật không chen vào bài thử`); }
      if(kingActive(now)!==null||nx-now<(KING.warnSecs+180)*1000)
        console.log(`  ⚠ Đồng hồ lịch boss (${mode}) gần / trong khung thú vương (${vnHHMM(kingActive(now)??nx)} giờ Việt Nam): kiểm tra BĐ5 có thể trượt vì lịch, chạy lại sau ${KING.lifeSecs/60} phút.`); }
    // Dữ liệu: thú vương của Ngoại vi và Nội địa (bảng 5.3), Thánh Hồn Thôn không có; hang (object `boss`) ở vùng sâu nhất.
    const kings=BOSSES.filter(b=>b.rank===2), objsK=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
    const kbad=[];
    for(const [m,id,hp] of [["tinh_dau_ngoai_vi","huyet_nguyet_lang_vuong",6],["tinh_dau_noi_dia","thien_doc_chu_hoang",7],["lac_nhat_sam_lam","luong_nghi_thu_ho_xa",7],["cuc_bac_chi_dia","huyen_minh_bang_giao",8],["hai_than_dao","tham_hai_ma_kinh_vuong",8]]){
      // Vùng sâu nhất = vùng có niên hạn cao nhất (Cực Bắc BĐ6c chia vùng theo hàng, càng lên bắc càng sâu).
      const zy=z=>parseLevelRange(z.properties.find(q=>q.name==="years")?.value)?.[1]??0;
      // Bản đồ lớn (11.3): vùng sâu nhất có thể là nhiều chữ nhật; hang phải nằm trong các mảnh cùng niên hạn cao nhất.
      const d=BOSSES[bossIndex(id)], os=objsK(m), lr=os.filter(o=>o.type==="boss"), zs=os.filter(o=>o.type==="zone"), top=Math.max(...zs.map(zy));
      const inDeep=(x,y)=>zs.some(z=>zy(z)===top&&x>=z.x&&x<=z.x+z.width&&y>=z.y&&y<=z.y+z.height);
      if(MAPS[m].king!==id||d?.rank!==2||d.hp!==hp||beastIndex(d.species)<0) kbad.push(`${m}: ${id}`);
      if(d&&(d.skills.length<2||d.skills.length>3||!d.phase2?.skills.length||[...d.skills,...d.phase2.skills].some(s=>s.warn<1))) kbad.push(`${id}: chiêu`);
      if(lr.length!==1||lr[0].properties.find(q=>q.name==="boss")?.value!==id||![[0,0],[1,0],[0,1],[1,1]].every(([a,b])=>inDeep(lr[0].x+a*lr[0].width,lr[0].y+b*lr[0].height))) kbad.push(`${m}: hang`);
    }
    if(MAPS.thanh_hon_thon.king||objsK("thanh_hon_thon").some(o=>o.type==="boss")) kbad.push("thanh_hon_thon có thú vương");
    ok(!kbad.length&&kings.length===5,`5 thú vương (BĐ6b thêm Lạc Nhật, BĐ6c Cực Bắc, BĐ6d Hải Thần Đảo; ${kings.map(k=>`${k.name} x${k.hp}: ${k.skills.map(s=>s.name).join(", ")} + GĐ2 ${k.phase2.name}`).join("; ")}), hang ở vùng sâu nhất, Thánh Hồn Thôn không có`+(kbad.length?`: ${kbad.join("; ")}`:""));
    // Lịch theo giờ Việt Nam (UTC+7, Asia/Ho_Chi_Minh): 20:00 và 22:00; ngày nhận thưởng đổi lúc 00:00.
    const U=(h,mi=0,d=19)=>Date.UTC(2026,9,d,h,mi);
    ok(vnDay(U(16,59)+59000)==="2026-10-19"&&vnDay(U(17,0))==="2026-10-20"&&kingNext(U(12,0))===U(13,0)&&kingNext(U(13,30))===U(15,0)&&kingNext(U(16,0))===U(13,0,20)
      &&kingActive(U(13,10))===U(13,0)&&kingActive(U(13,0)+KING.lifeSecs*1000)===null&&kingActive(U(12,59))===null&&vnHHMM(kingNext(U(14,0)))==="22:00",
      `lịch ${KING_TIMES.join(" / ")} giờ Việt Nam, rút đi sau ${KING.lifeSecs/60} phút, ngày mới lúc 00:00 (23:59 UTC+7 = ${vnDay(U(16,59))}, 00:00 = ${vnDay(U(17,0))})`);
    ok(KING_CHEST.ur===0&&KING.share===0.03&&KING.daily===3&&[1,2,4,10].every(n=>Math.abs(bossHpMult(n)-(1+0.6*(n-1)))<1e-9),"đã chốt: ngưỡng rương 3%, 3 lần/ngày, máu x(1 + 0,6 × (N − 1)); từ BĐ6 (BĐ6e) rương thú vương không còn mảnh UR (5% trước BĐ6)");

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
    ok(chestK(K)===2&&bonesOf(K).length===b0+1&&nb&&qtyOf(K,shardCode(pool[0].vohon))===s0+4&&KING_CHEST.urShards.reduce((a,v)=>a+qtyOf(K,shardCode(v)),0)===ur0,`mở rương (từ BĐ6 không còn mảnh UR dù số ngẫu nhiên 0): ${lg}`);
    const nc=kCores().slice(c0);
    ok(nc.length===1&&nc[0].stars===cHi&&coreSetIndex(nc[0].stats?.set)>=0&&nc[0].stats?.subs?.length===CORE_SUBS[cHi-1],`rương có 1 hồn hạch sao cao nhất theo ${Y} năm: ${nc[0]?.stars}★ bộ ${nc[0]?.stats?.set}, ${nc[0]?.stats?.subs?.length} dòng phụ`);
    const s3=qtyOf(K,shardCode(pool[3].vohon)), b1=bonesOf(K).length;
    await test(K,"chest",{bone:100,ur:100,i:3}); lg=await open(); const got=qtyOf(K,shardCode(pool[3].vohon))-s3;
    ok(pool[3].vohon===KING_CHEST.fire&&got>=KING_CHEST.shards[0]&&got<=KING_CHEST.shards[1]&&bonesOf(K).length===b1&&chestK(K)===1,`mở rương lần 2 (không hồn cốt, không UR): ${lg}`);
    // Nhóm "bản đồ chưa mở" rỗng dần: BĐ6b bỏ Bích Lân Xà Hoàng (Lạc Nhật), BĐ6c Yêu Hồ (Cực Bắc), BĐ6d Quỷ Mị (Hải Thần Đảo); từ BĐ6d
    // mọi võ hồn trong KING_CHEST.later đều đã có bản đồ rơi mảnh nên nhóm này không còn ai (trọng số 1).
    ok(!pool.some(x=>x.w===1)&&KING_CHEST.later.every(v=>Object.values(MAPS).some(m=>m.shards.includes(v)))&&!pool.some(x=>x.vohon==="quy_mi")&&!pool.some(x=>x.vohon==="yeu_ho")&&!pool.some(x=>x.vohon==="bich_lan_xa_hoang")&&pool.filter(x=>MAPS.tinh_dau_ngoai_vi.shards.includes(x.vohon)).length===3,`mảnh trong rương: của bản đồ, Tà Hỏa Phượng Hoàng, võ hồn bản đồ chưa mở (${pool.map(x=>x.vohon).join(", ")})`);
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
    // Giữ phím tới khi server báo hủy: server bận thì một tick có thể nhận cả lệnh đi lẫn lệnh dừng, hồn sư không bước nào.
    A.absorbing=null; A.room.send("input",{x:1,y:0}); await waitFor(()=>A.absorbing?.result,2000); A.room.send("input",{x:0,y:0});
    // Tin absorbing / log tới trước bản vá state (p.absorb): chờ cả điều kiện.
    ok(await waitFor(()=>A.absorbing?.result==="cancel"&&/hủy hấp thụ/.test(A.logs.at(-1))&&p.absorb===0&&p.rings.length===2&&has(A,r1700)),
      "di chuyển: hủy, hồn hoàn vẫn trong túi"+(A.absorbing?.result==="cancel"&&p.absorb===0?"":` [absorbing ${JSON.stringify(A.absorbing)}, absorb ${p.absorb}, log ${A.logs.at(-1)}]`));
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
    ok(Object.values(MAPS).every(m=>m.kind!=="hunt"||(m.shards.length>=2&&m.shards.length<=4))&&Object.values(MAPS).every(m=>m.shards.every(id=>vohonIndex(id)>=0&&itemDef(shardCode(id))?.kind==="manh_vo_hon")),
      "mỗi bản đồ săn rơi mảnh của 2–4 võ hồn có thật (từ 8.3)");
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
/**
 * Đi tới cột x (pixel) theo phương ngang. Từ 11.1 ngoài giao chiến tự chạy ~7,6 pixel mỗi nhịp, nhảy qua được khoảng ±3 pixel rồi đi quá
 * đà; đi bộ ~4,75 pixel mỗi nhịp vẫn trượt nếu bot lỡ đúng nhịp nằm trong khoảng. goTo chỉnh hướng mỗi lần và chậm lại khi gần đích.
 */
const walkToX=async(tx)=>goTo(C,tx,me().y,12000);
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
// Điểm xuất hiện đọc từ file Tiled đang dùng (bản cũ hoặc bản ×8 khi MAP_V2, 11.3).
const arriveOf=(m,n)=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="arrive"&&o.name===n);
const nvW=arriveOf("tinh_dau_ngoai_vi","tu_nac_dinh_thanh"), nvE=arriveOf("tinh_dau_ngoai_vi","tu_tinh_dau_noi_dia"), ndW=arriveOf("tinh_dau_noi_dia","tu_tinh_dau_ngoai_vi");
ok(Math.hypot(me().x-nvW.x,me().y-nvW.y)<1,`xuất hiện ở trại cổng Ngoại vi: ${me().x},${me().y}`);
checkGateClear(C,checkBeastYears(C)); // vùng Ngoại vi theo bảng 5.3: 300–700 … 1.400–2.000 năm
if((await test(C,"ping"))?.enabled){
  // BĐ3: Ngoại vi -> Nội địa (cổng mép đông, đề xuất 30–60) -> về Ngoại vi. Đi bộ xuyên rừng cấp thấp thì gục: nhảy tới trạm gác
  // phía đông (hook goto), dọn hồn thú quanh mình rồi mới bước vào cổng.
  await test(C,"goto",{x:nvE.x,y:nvE.y}); await test(C,"clear");
  ok(await walk(1,0,()=>C.portal?.name,4000),`tới cổng đông Ngoại vi: ${JSON.stringify(C.portal)}`);
  ok(C.portal?.to==="tinh_dau_noi_dia"&&C.portal.toName===MAPS.tinh_dau_noi_dia.name&&JSON.stringify(C.portal.level)==="[30,60]"&&C.portal.warn===(me().level<30),
    `cổng vào Nội địa: cấp đề xuất 30–60, cấp ${me().level} -> cảnh báo ${C.portal?.warn}`);
  await travelBy("Vào Tinh Đấu Nội địa","tinh_dau_noi_dia");
  ok(Math.hypot(me().x-ndW.x,me().y-ndW.y)<1,`xuất hiện ở trại cổng Nội địa: ${me().x},${me().y}`);
  checkGateClear(C,checkBeastYears(C)); // vùng Nội địa: 1.500–5.000 … 15.000–25.000 năm
  ok(!JSON.parse(readFileSync(mapUrl("tinh_dau_noi_dia"),"utf8")).layers.flatMap(l=>l.objects??[]).some(o=>o.type==="portal"&&!MAPS[(o.properties??[]).find(q=>q.name==="to")?.value]),
    "Nội địa chưa có cổng tới bản đồ chưa mở (Lõi Tinh Đấu để BĐ6)");
  await test(C,"clear");
  ok(await walk(-1,0,()=>C.portal?.name,4000),`tới cổng về Ngoại vi: ${JSON.stringify(C.portal)}`);
  ok(C.portal?.to==="tinh_dau_ngoai_vi"&&JSON.stringify(C.portal.level)==="[10,30]"&&C.portal.warn===(me().level<10),`cổng về Ngoại vi: đề xuất 10–30, cảnh báo ${C.portal?.warn}`);
  await travelBy("Về Tinh Đấu Ngoại vi","tinh_dau_ngoai_vi");
  ok(Math.hypot(me().x-nvE.x,me().y-nvE.y)<1&&!C.portal?.name,`về Ngoại vi: xuất hiện ở trạm gác phía đông ${me().x},${me().y}, ngoài cổng`);
  await test(C,"goto",{x:nvW.x,y:nvW.y});
} else console.log("  ⚠ bỏ qua Ngoại vi -> Nội địa (cần hook goto): bật server bằng GAME_TEST=1");
// Thoát và vào lại: đúng bản đồ, đúng vị trí đã lưu khi rời phòng.
await walk(1,0,()=>me().x>nvW.x+40,3000); const pos=[me().x,me().y];
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
  const nb=await test(C,"beast",{dx:90,dy:TIERS[0].size/2-8}); // hook trả id; server cũ: con mới đầu tiên
  const fresh=()=>nb?.bid?(C.room.state.beasts.has(nb.bid)&&nb.bid):[...C.room.state.beasts.keys()].find(k=>!ids.has(k));
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
await shopBuybackTest();
await waypointTest();
await bigMapTest();
await syncViewTest();
await thienDauTest();
await lacNhatTest();
await haiThanTest();
await loiTinhDauTest();
await questTest();
await arenaTest();
await dailyTest();
// BĐ3: tài khoản cũ còn map_id `tinh_dau` (bản đồ đã tách) -> vào Ngoại vi ở trại cổng, bỏ vị trí cũ. Hook legacy ghi mã cũ
// qua đúng transaction đi cổng, như tài khoản đăng xuất ở Tinh Đấu trước BĐ3.
if((await test(C,"ping"))?.enabled){
  const lg=await test(C,"legacy",{mapId:"tinh_dau",x:700,y:480});
  ok(lg?.saved,`ghi map_id cũ tinh_dau (vị trí 700,480): ${JSON.stringify(lg)}`);
  await C.room.leave(); await sleep(300);
  const ml=await post("/api/me",{token:C.token}), ll=await post("/api/login",{name:C.name,password:PASS});
  ok(ml.mapId==="tinh_dau_ngoai_vi"&&ll.mapId==="tinh_dau_ngoai_vi",`tài khoản ở tinh_dau: /api/me và /api/login trả ${ml.mapId} / ${ll.mapId}`);
  C.token=ll.token; C.mapId=ml.mapId; await enter(C); await waitFor(()=>me());
  const sp=JSON.parse(readFileSync(mapUrl("tinh_dau_ngoai_vi"),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="spawn");
  ok(C.room.state.mapId==="tinh_dau_ngoai_vi"&&me().x>=sp.x&&me().x<=sp.x+sp.width&&me().y>=sp.y&&me().y<=sp.y+sp.height,
    `vào Ngoại vi ở ${sp.name} (${me().x.toFixed(0)},${me().y.toFixed(0)}), không giữ vị trí cũ 700,480`);
  // Lớp chặn WHERE map_id theo bản đồ đã ánh xạ: rời phòng Ngoại vi thì ghi được vị trí mới.
  const np=[nvW.x+32,nvW.y]; // bản cũ: ô (7,31) cạnh điểm xuất hiện
  await test(C,"goto",{x:np[0],y:np[1]}); await C.room.leave(); await sleep(300);
  C.mapId=(await post("/api/me",{token:C.token})).mapId; await enter(C); await waitFor(()=>me());
  ok(Math.abs(me().x-np[0])<1&&Math.abs(me().y-np[1])<1,`rời rồi vào lại: vị trí mới ở Ngoại vi đã lưu (${me().x},${me().y})`);
}
if((await test(C,"ping"))?.enabled) await partyTest(C);
if((await test(C,"ping"))?.enabled) await partyBuffTest();
if((await test(C,"ping"))?.enabled) await supportContribTest();
if((await test(C,"ping"))?.enabled) await copyPartyTest();
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
  const all=["thanh_hon_thon","nac_dinh_thanh",AT].flatMap(m=>JSON.parse(readFileSync(mapUrl(m),"utf8"))
    .layers.flatMap(l=>l.objects??[]).filter(o=>o.type==="npc").map(o=>(o.properties??[]).find(q=>q.name==="npc")?.value));
  ok(all.every(id=>npcDef(id))&&NPCS.every(n=>all.filter(x=>x===n.id).length===1),`mỗi NPC trong NPCS đặt đúng một chỗ ở Thánh Hồn Thôn / Nặc Đinh Thành / Thiên Đấu Thành: ${all.join(", ")}`);
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
  ok(SHOP.every(r=>["dan","phu"].includes(itemDef(r.code)?.kind)&&r.price>0)&&SHOP.some(r=>r.code==="hoi_huyet_dan")&&SHOP.some(r=>r.code==="hoi_hon_dan"),`thương nhân bán ${SHOP.map(r=>`${itemDef(r.code).name} ${formatHonTe(r.price)}`).join(", ")}`);
  const tn=npcSpot("nac_dinh_thanh","thuong_nhan"), lr=npcSpot("nac_dinh_thanh","lo_ren"), ds=npcSpot("nac_dinh_thanh","dai_su"), sg=npcSpot("nac_dinh_thanh","su_gia_dau_hon");
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
  // Đại Sư và sứ giả Đại Đấu Hồn Trường (BĐ6a, chỗ của lối vào tạm 7.2): chỉ có lời thoại (nhiệm vụ ở 6.2); đứng cạnh Thợ rèn thì Đại Sư ở xa.
  ok(await talk(C,"dai_su")===null&&/lại gần Ngọc Tiểu Cương/.test(C.logs.at(-1)),"đứng ở lò rèn: Đại Sư ở xa, chưa nói chuyện");
  await test(C,"goto",{x:ds.x,y:ds.y+16}); ok(await talk(C,"dai_su")==="dai_su","đứng cạnh Ngọc Tiểu Cương (Đại Sư): mở hộp thoại");
  ok(npcDef("dai_su").lines.some(t=>t.includes(formatYears(ringLimit(1)))&&t.includes(formatYears(ringLimit(4)))),"Đại Sư giải thích giới hạn hồn hoàn theo vòng (RING_LIMIT)");
  await test(C,"goto",{x:sg.x,y:sg.y+16}); ok(await talk(C,"su_gia_dau_hon")==="su_gia_dau_hon"&&npcDef("su_gia_dau_hon").role==="talk","sứ giả Đại Đấu Hồn Trường: chỉ đường lên Thiên Đấu Thành");
  ok(await talk(C,"dau_hon_truong")===null&&/Không có NPC này/.test(C.logs.at(-1)),"Đại Đấu Hồn Trường không còn ở Nặc Đinh Thành (BĐ6a)");
  { const l=C.logs.length; C.room.send("arena",{op:"queue"}); await waitFor(()=>C.logs.length>l,1500);
    ok(/lại gần Đại Đấu Hồn Trường/.test(C.logs.at(-1)),`đứng cạnh sứ giả: không xếp hàng đấu hồn được (${C.logs.at(-1)})`); }
  // Vào lại: Hồn Tệ và túi sau mua / bán / cường hóa đã lưu.
  const bk=bagKey(C); await C.room.leave(); await sleep(400);
  await enter(C); await waitFor(()=>me()&&C.bag);
  ok(bagKey(C)===bk,`vào lại: túi và Hồn Tệ sau mua / bán đã lưu (${formatHonTe(C.bag?.honTe??0)}, ${looseOf(C).length} ô)`);
}

/**
 * 9.8 thương nhân (bot riêng E, tài khoản mới nên túi khởi đầu BAG_SLOTS ô): hàm thuần (đan lớn, giá mở rộng túi, bagSlotsOf); với
 * hook: mở rộng túi (đứng xa / thiếu Hồn Tệ bị từ chối, 40 → 50 ô nhận thêm đúng 10 ô, vào lại vẫn 50 ô, giá lần sau, tới 80 ô thì
 * hết), đan lớn (mua 120 đồng, hồi đúng 60% sinh lực / hồn lực, chung hồi chiêu đan, thương nhân không mua lại), mua lại (hồn cốt cường
 * hóa về đúng chỉ số và cấp, Hồn Tệ trả đúng; thiếu tiền / túi đầy / mã lạ / đứng xa bị từ chối; chỉ giữ BUYBACK_MAX món; mảnh bán
 * một phần mua lại gộp ô; đi cổng sang Thiên Đấu Thành vẫn còn và mua lại được ở thương nhân Thiên Đấu; rời game thì mất).
 */
/**
 * 11.4: hai bot bật lọc đồng bộ ở hai đầu Tinh Đấu Ngoại vi (trận Trại cổng / Trạm gác). State chỉ có hồn sư, hồn thú, đồ rơi trong
 * SYNC_VIEW.r (tinh anh luôn có), `online` đếm cả phòng; lại gần thì thấy nhau; tin fx của người ở xa không gửi; tin mini có hồn sư và
 * đồ rơi ở xa; hồn thú cách mọi hồn sư quá SYNC_VIEW.wake ngủ (đứng yên) rồi thức khi có người lại gần; hook view tắt / bật lọc.
 */
async function syncViewTest(){
  console.log("[11.4] Đồng bộ theo vùng gần, hồn thú ngủ, bản đồ nhỏ");
  ok(SYNC_VIEW.r<SYNC_VIEW.out&&SYNC_VIEW.out<SYNC_VIEW.fx&&SYNC_VIEW.wake>=SYNC_VIEW.out,`SYNC_VIEW: vào ${SYNC_VIEW.r} < ra ${SYNC_VIEW.out} < fx ${SYNC_VIEW.fx}, ngủ ngoài ${SYNC_VIEW.wake} pixel`);
  const V=await bot("Gần","lam_dien_ba_vuong_long",{sex:0,hair:1,hairCol:2,outfitCol:1},true);
  const W=await bot("Xa","lam_dien_ba_vuong_long",{sex:1,hair:1,hairCol:1,outfitCol:3},true);
  if(!(await test(V,"ping"))?.enabled){ console.log("  ⚠ bỏ qua 11.4 (cần hook view, warp, goto): bật server bằng GAME_TEST=1"); await V.room.leave(); await W.room.leave(); return; }
  const MAP="tinh_dau_ngoai_vi", objs=JSON.parse(readFileSync(new URL(`../../shared/assets/${MAP}.json`,import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[]);
  const wpAt=n=>{ const o=objs.find(o=>o.type==="waypoint"&&o.name===n); return {x:o.x+o.width/2,y:o.y+o.height/2}; };
  const west=wpAt("trai_cong"), east=wpAt("tram_gac");
  const me=b=>b.room.state.players.get(b.room.sessionId), dist=(a,c)=>Math.hypot(a.x-c.x,a.y-c.y);
  async function warp(b,p){
    b.travel=null; b.room.send("test",{op:"warp",mapId:MAP,x:p.x,y:p.y});
    ok(await waitFor(()=>b.travel?.mapId===MAP,4000),`${b.name}: warp -> ${MAPS[MAP].name}`);
    const roomId=b.travel?.roomId??undefined; await b.room.leave(); await sleep(300); b.mapId=MAP; await enter(b,roomId); await waitFor(()=>me(b),3000);
  }
  /** Đứng ở (x, y) hoặc chỗ đứng được gần đó (hook goto chỉ nhận ô đứng được). */
  async function place(b,p){
    for(const [dx,dy] of [[0,0],[16,0],[0,16],[-16,0],[0,-16],[32,32],[-32,32],[32,-32],[-32,-32],[48,0],[0,48]]){
      const q={x:p.x+dx,y:p.y+dy}; await test(b,"goto",q); if(me(b)&&dist(me(b),q)<2) return true;
    }
    return false;
  }
  await warp(V,west); await warp(W,east);
  await place(V,west); await place(W,east);
  const sid=W.room.sessionId, vsid=V.room.sessionId;
  await waitFor(()=>!V.room.state.players.has(sid),1500);
  let v=await test(V,"view");
  ok(me(V)&&!V.room.state.players.has(sid)&&!W.room.state.players.has(vsid)&&V.room.state.online===v?.total?.players&&v.total.players>=2,
    `hồn sư cách ${Math.round(dist(me(V),me(W)))} pixel không có trong state của nhau; state.online = ${V.room.state.online} (cả phòng ${v?.total?.players})`);
  const bs=[...V.room.state.beasts.values()], farB=bs.filter(b=>!b.rank&&dist(b,me(V))>SYNC_VIEW.out+40), ranked=bs.filter(b=>b.rank).length;
  ok(!farB.length&&V.room.state.beasts.size<=v.total.beasts&&ranked===v.total.ranked,
    `state có ${V.room.state.beasts.size}/${v.total.beasts} hồn thú, không con thường nào xa quá ${SYNC_VIEW.out} pixel (${farB.length}), đủ ${ranked}/${v.total.ranked} tinh anh / thú vương`);
  V.mini=null; ok(await waitFor(()=>V.mini?.p?.includes(sid),2500),"tin mini (bản đồ nhỏ) có hồn sư ở xa");
  const k=V.mini?.p?.indexOf(sid)??-1;
  ok(k>=0&&Math.abs(V.mini.p[k+1]-Math.floor(me(W).x/16))<=2&&Math.abs(V.mini.p[k+2]-Math.floor(me(W).y/16))<=2,`tin mini: vị trí theo ô ${V.mini?.p?.slice(k+1,k+3)}`);
  // Lại gần dưới SYNC_VIEW.r: thấy nhau.
  await place(W,{x:west.x+48,y:west.y+16});
  ok(await waitFor(()=>V.room.state.players.has(sid)&&W.room.state.players.has(vsid),1500),`lại gần (${Math.round(dist(me(W),me(V)))} pixel): hai bên thấy nhau`);
  // Tin fx: người ở xa đánh thường thì không gửi tới; ở gần thì có.
  await place(W,east); ok(await waitFor(()=>!V.room.state.players.has(sid),1500),"đi xa quá out: hồn sư rời state");
  V.fxs=[]; W.fxs=[]; W.room.send("attack"); await waitFor(()=>W.fxs.some(f=>f.k==="slash"&&f.id===sid),1500); await sleep(300);
  ok(W.fxs.some(f=>f.k==="slash"&&f.id===sid)&&!V.fxs.some(f=>f.id===sid),"tin fx (đánh thường) của hồn sư ở xa không gửi tới");
  await place(W,{x:west.x+48,y:west.y+16}); await waitFor(()=>V.room.state.players.has(sid),1500); await sleep(1200);
  V.fxs=[]; W.room.send("attack"); ok(await waitFor(()=>V.fxs.some(f=>f.k==="slash"&&f.id===sid),1500),"ở gần thì nhận tin fx của nhau");
  // Hồn thú: rời state khi mình đi xa, ngủ khi không ai trong SYNC_VIEW.wake, có lại và thức khi quay về.
  await place(W,east); await test(V,"clear");
  const bid=(await test(V,"spawn",{tier:0,dx:60,dy:0}))?.bid;
  ok(!!bid&&await waitFor(()=>V.room.state.beasts.has(bid),1500),"hồn thú vừa sinh cạnh mình có trong state");
  await place(V,{x:east.x,y:east.y+48});
  ok(await waitFor(()=>!V.room.state.beasts.has(bid),1500),"đi xa quá out: hồn thú rời state");
  let x=await test(V,"view",{bid});
  ok(!!x?.beast&&!x.beast.seen,`server vẫn còn hồn thú đó (${Math.round(x?.beast?.x)},${Math.round(x?.beast?.y)}), chỉ không đồng bộ`);
  if(x?.total?.players===2){
    ok(x.beast&&!x.beast.awake,"không hồn sư nào trong tầm thức: hồn thú ngủ");
    const p0=x.beast&&{x:x.beast.x,y:x.beast.y}; await sleep(2500); x=await test(V,"view",{bid});
    ok(x?.beast&&p0&&x.beast.x===p0.x&&x.beast.y===p0.y&&!x.beast.moving,"hồn thú ngủ không lang thang (2,5 giây)");
  } else console.log(`  ⚠ bỏ qua kiểm tra hồn thú ngủ: phòng có ${x?.total?.players} hồn sư`);
  await place(V,west);
  ok(await waitFor(()=>V.room.state.beasts.has(bid),1500),"quay lại: hồn thú vào lại state");
  x=await test(V,"view",{bid}); ok(x?.beast?.awake&&x.beast.seen,"hồn thú thức lại");
  // Đồ rơi: hạ hồn thú cạnh V thì V thấy đồ rơi, W ở xa không thấy nhưng bản đồ nhỏ của W có.
  const d0=(await test(V,"beast",{dx:30,dy:0}))?.bid; const drops0=V.room.state.drops.size;
  await test(V,"slay",{bid:d0});
  ok(await waitFor(()=>V.room.state.drops.size>drops0,1500),"đồ rơi cạnh mình có trong state");
  const near=d=>dist(d,me(V))<80; await sleep(300);
  ok(![...W.room.state.drops.values()].some(near),"hồn sư ở xa không nhận đồ rơi đó");
  W.mini=null; ok(await waitFor(()=>(W.mini?.d?.length??0)>=3,2500)&&W.mini.d.some((t,i)=>i%3===0&&Math.abs(t*16-me(V).x)<96),"bản đồ nhỏ của người ở xa vẫn có đồ rơi");
  // Hook view: tắt lọc thì thấy cả hồn sư ở xa, bật lại thì mất.
  ok((await test(V,"view",{all:true}))?.all===true,"hook view all: tắt lọc");
  ok(await waitFor(()=>V.room.state.players.has(sid),1500),"tắt lọc: thấy cả hồn sư ở xa");
  await test(V,"view",{all:false}); ok(await waitFor(()=>!V.room.state.players.has(sid),1500),"bật lại lọc: hồn sư ở xa rời state");
  await V.room.leave(); await W.room.leave();
}
/**
 * 11.2 Truyền tống trận và bản đồ thế giới: dữ liệu (mọi bản đồ trừ sân đấu có 1–3 object `waypoint`, tâm đứng được, phí theo số lần
 * đi cổng, Hồi Thành Phù bán ở thương nhân, không mua lại). Với hook: bot T (tài khoản mới) mở khóa trận khi bước lên (tin `wp`, bản
 * đồ thế giới ghi đã mở), không đứng trên trận thì chỉ xem, trận chưa mở / thiếu Hồn Tệ / đang giao chiến bị từ chối; niệm WAYPOINT_CAST
 * giây rồi dịch chuyển trong cùng bản đồ (trừ phí) và sang bản đồ khác (transaction đi cổng, phí lưu qua đi cổng); bị đánh hoặc di
 * chuyển thì hủy, không mất gì; Hồi Thành Phù về thành gần nhất, mất một phù, bị đánh thì hủy và giữ phù; thoát vào lại vẫn nhớ trận đã mở.
 */
async function waypointTest(){
  console.log("[11.2] Truyền tống trận, bản đồ thế giới, Hồi Thành Phù");
  const objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const wps={};
  for(const id of Object.keys(MAPS)){
    const list=objsOf(id).filter(o=>o.type==="waypoint").map(o=>({key:`${id}:${o.name}`,map:id,label:(o.properties??[]).find(q=>q.name==="label")?.value,x:o.x+o.width/2,y:o.y+o.height/2}));
    if(MAPS[id].kind==="arena") ok(!list.length,`${MAPS[id].name}: sân đấu không có truyền tống trận`);
    else ok(list.length>=1&&list.length<=3&&list.every(w=>w.label),`${MAPS[id].name}: ${list.length} truyền tống trận (${list.map(w=>w.label).join(", ")})`);
    for(const w of list) wps[w.key]=w;
  }
  ok(WAYPOINT_CAST===3&&waypointFee(0)===WAYPOINT_FEE.base&&waypointFee(2)===WAYPOINT_FEE.base+2*WAYPOINT_FEE.perHop,`phí truyền tống: ${[0,1,2,3].map(h=>formatHonTe(waypointFee(h))).join(" / ")} theo số lần đi cổng, niệm ${WAYPOINT_CAST} giây`);
  const phu=itemDef("hoi_thanh_phu"), phuPrice=SHOP.find(r=>r.code==="hoi_thanh_phu")?.price;
  ok(phu?.recall&&phu.kind==="phu"&&phuPrice>0&&sellPrice({code:"hoi_thanh_phu",years:null,stars:null,enhance:0})===null,`Hồi Thành Phù: thương nhân bán ${formatHonTe(phuPrice??0)}, không mua lại`);
  const T=await bot("Du hành","kim_vu_mieu_ung",{sex:1,hair:0,hairCol:3,outfitCol:2});
  if(!(await test(T,"ping"))?.enabled){ console.log("  ⚠ bỏ qua truyền tống (cần hook warp, goto, coin, hurt): bật server bằng GAME_TEST=1"); await T.room.leave(); return; }
  const tme=()=>T.room.state.players?.get(T.room.sessionId);
  await waitFor(()=>tme()&&T.bag,3000);
  const world=async()=>{ T.world=null; T.room.send("wp",{op:"list"}); await waitFor(()=>T.world,1500); return T.world; };
  const at=(w)=>Math.hypot(tme().x-w.x,tme().y-w.y)<1;
  async function rejoin(){ await T.room.leave(); await sleep(300); T.mapId=(await post("/api/me",{token:T.token})).mapId; await enter(T); await waitFor(()=>tme()&&T.bag,3000); }
  async function warp(mapId,x,y){
    T.travel=null; T.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>T.travel?.mapId===mapId,4000),`warp -> ${MAPS[mapId].name}`);
    await rejoin();
  }
  /** Đứng lên trận `key` (hook goto) và chờ tin `wp {k: "here"}`. */
  async function stand(key){ const w=wps[key]; T.wpHere=null; await test(T,"goto",{x:w.x,y:w.y}); await waitFor(()=>T.wpHere?.key===key,1500); return w; }
  /** Xin truyền tống tới `key`, chờ log trả lời (bắt đầu niệm hoặc từ chối). */
  async function go(key){ const l=T.logs.length; T.recall=null; T.room.send("wp",{op:"go",key}); await waitFor(()=>T.logs.length>l,1500); return T.logs.at(-1)??""; }
  const coin=async n=>{ await test(T,"coin",{n}); await waitFor(()=>T.bag?.honTe===n,1500); };

  // Thánh Hồn Thôn: bản đồ thế giới khi không đứng trên trận chỉ để xem.
  const lang="thanh_hon_thon:lang", nd="nac_dinh_thanh:quang_truong", tc="tinh_dau_ngoai_vi:trai_cong", rt="tinh_dau_ngoai_vi:rung_thua";
  const tv=npcSpot("thanh_hon_thon","to_van_dao"); await test(T,"goto",{x:tv.x,y:tv.y+16});
  let w=await world();
  ok(w&&w.cur===""&&w.list.length===Object.keys(wps).length&&w.list.every(x=>wps[x.key]),`bản đồ thế giới: ${w?.list.length} trận, không đứng trên trận nào`);
  ok(w&&w.links.some(([a,b])=>[a,b].sort().join()==="nac_dinh_thanh,thanh_hon_thon"),"bản đồ thế giới có nét nối Thánh Hồn Thôn – Nặc Đinh Thành");
  ok(w?.list.find(x=>x.key===nd)?.fee===waypointFee(1)&&w.list.find(x=>x.key===lang)?.fee===waypointFee(0),"phí theo số lần đi cổng từ bản đồ đang ở");
  ok(/đứng trên một truyền tống trận/.test(await go(lang)),"không đứng trên trận: chỉ xem, không dịch chuyển được");
  // Bước lên trận làng: mở khóa.
  T.wpUnlock=[]; await stand(lang);
  ok(await waitFor(()=>T.wpUnlock.includes(lang)||T.world?.list.find(x=>x.key===lang)?.open,1500),"bước lên trận Quảng trường làng: mở khóa (tin wp unlock)");
  w=await world(); ok(w?.cur===lang&&w.list.find(x=>x.key===lang)?.open&&!w.list.find(x=>x.key===nd)?.open,"bản đồ thế giới: đang đứng trên trận làng, trận làng đã mở, Nặc Đinh chưa mở");
  ok(/Chưa mở khóa/.test(await go(nd)),"trận chưa mở: từ chối");
  ok(/chính trận này/.test(await go(lang)),"chọn chính trận đang đứng: từ chối");
  // Mở thêm trận ở Nặc Đinh Thành và Tinh Đấu Ngoại vi.
  await warp("nac_dinh_thanh",wps[nd].x,wps[nd].y);
  ok(await waitFor(()=>T.wpUnlock.includes(nd),2000),"xuất hiện ngay trên trận Nặc Đinh: mở khóa");
  await warp("tinh_dau_ngoai_vi",wps[tc].x,wps[tc].y);
  ok(await waitFor(()=>T.wpUnlock.includes(tc),2000),"trận Trại cổng Ngoại vi: mở khóa");
  await test(T,"clear",{all:true});
  await stand(rt); ok(await waitFor(()=>T.wpUnlock.includes(rt),2000),"trận Rừng thưa (giữa bản đồ săn): mở khóa");
  // Thiếu Hồn Tệ.
  await coin(0); ok(/Không đủ Hồn Tệ/.test(await go(tc)),"không đủ Hồn Tệ: từ chối");
  // Cùng bản đồ: niệm rồi dịch chuyển, trừ phí.
  await coin(100); const fee0=waypointFee(0);
  ok(/Đang niệm truyền tống/.test(await go(tc))&&await waitFor(()=>T.recall?.on,800)&&T.recall.secs===WAYPOINT_CAST,`niệm truyền tống ${WAYPOINT_CAST} giây (thanh niệm)`);
  await sleep(1500); ok(at(wps[rt])&&T.bag.honTe===100,"đang niệm: chưa dịch chuyển, chưa trừ phí");
  ok(await waitFor(()=>at(wps[tc]),3000)&&await waitFor(()=>T.bag.honTe===100-fee0,1500),`niệm xong: tới Trại cổng Ngoại vi, trừ ${formatHonTe(fee0)} (còn ${formatHonTe(T.bag.honTe)})`);
  ok(T.room.state.mapId==="tinh_dau_ngoai_vi"&&T.recall?.on===false,"cùng bản đồ: không đổi phòng, tắt thanh niệm");
  // Đang giao chiến: từ chối.
  await test(T,"hurt",{pct:1}); ok(/Đang giao chiến/.test(await go(rt)),"đang giao chiến (vừa bị đánh): từ chối truyền tống");
  await sleep(TEAM_COMBAT_SECS*1000+300);
  // Bị đánh khi đang niệm: hủy, không mất gì.
  { const h=T.bag.honTe; ok(/Đang niệm/.test(await go(rt)),"hết giao chiến: niệm được");
    await sleep(600); const l=T.logs.length; await test(T,"hurt",{pct:1});
    ok(await waitFor(()=>T.logs.slice(l).some(t=>/Bị tấn công: đã hủy truyền tống/.test(t)),1500)&&T.recall?.on===false,"bị đánh khi đang niệm: hủy truyền tống");
    await sleep(WAYPOINT_CAST*1000); ok(at(wps[tc])&&T.bag.honTe===h,"đã hủy: không dịch chuyển, không trừ phí"); }
  await sleep(TEAM_COMBAT_SECS*1000+300);
  // Di chuyển khi đang niệm: hủy.
  { const h=T.bag.honTe; ok(/Đang niệm/.test(await go(rt)),"niệm lần nữa"); await sleep(500);
    const l=T.logs.length; T.room.send("input",{x:1,y:0}); await sleep(250); T.room.send("input",{x:0,y:0});
    ok(await waitFor(()=>T.logs.slice(l).some(t=>/Di chuyển: đã hủy truyền tống/.test(t)),1500),"di chuyển khi đang niệm: hủy");
    await sleep(WAYPOINT_CAST*1000); ok(!at(wps[rt])&&T.bag.honTe===h,"đã hủy: không tới Rừng thưa, không trừ phí"); }
  // Sang bản đồ khác: transaction đi cổng, phí theo số lần đi cổng, lưu qua đi cổng.
  { await stand(tc); const h=T.bag.honTe, fee=waypointFee(1); T.travel=null;
    ok(/Đang niệm/.test(await go(nd)),`niệm truyền tống tới Nặc Đinh Thành (${formatHonTe(fee)})`);
    ok(await waitFor(()=>T.travel?.mapId==="nac_dinh_thanh",WAYPOINT_CAST*1000+2500),"niệm xong: server cho chuyển bản đồ (travel)");
    await rejoin();
    ok(T.room.state.mapId==="nac_dinh_thanh"&&at(wps[nd]),`tới trận Quảng trường Nặc Đinh (${tme().x},${tme().y})`);
    ok(T.bag.honTe===h-fee,`phí đã trừ và lưu qua đi cổng: ${formatHonTe(h)} → ${formatHonTe(T.bag.honTe)}`); }
  // Hồi Thành Phù: mua ở thương nhân, dùng ở Tinh Đấu Nội địa (bản đồ săn) thì về thành gần nhất (Nặc Đinh Thành).
  { const sp=npcSpot("nac_dinh_thanh","thuong_nhan"); await test(T,"goto",{x:sp.x,y:sp.y+16}); await coin(500);
    const t=await trade(T,"buy",{code:"hoi_thanh_phu",qty:3}); ok(qtyOf(T,"hoi_thanh_phu")===3&&T.bag.honTe===500-3*phuPrice,`mua 3 Hồi Thành Phù (${t})`); }
  const ndi=objsOf("tinh_dau_noi_dia").find(o=>o.type==="spawn");
  await warp("tinh_dau_noi_dia",ndi.x+ndi.width/2,ndi.y+ndi.height-20); await test(T,"clear",{all:true});
  const phuId=()=>T.bag.items.find(i=>i.code==="hoi_thanh_phu")?.id;
  await test(T,"hurt",{pct:1}); { const l=T.logs.length; T.room.send("use",{id:phuId()}); await waitFor(()=>T.logs.length>l,1500); }
  ok(/Đang giao chiến/.test(T.logs.at(-1))&&qtyOf(T,"hoi_thanh_phu")===3,"Hồi Thành Phù khi đang giao chiến: từ chối, không mất phù");
  await sleep(TEAM_COMBAT_SECS*1000+300);
  { const l=T.logs.length; T.recall=null; T.room.send("use",{id:phuId()}); await waitFor(()=>T.recall?.on,1500);
    ok(/Hồi Thành Phù về Nặc Đinh Thành/.test(T.logs.slice(l).join("|")),`dùng Hồi Thành Phù: niệm về thành gần nhất (${T.logs.at(-1)})`);
    await sleep(500); await test(T,"hurt",{pct:1});
    ok(await waitFor(()=>T.recall?.on===false,1500)&&qtyOf(T,"hoi_thanh_phu")===3&&T.room.state.mapId==="tinh_dau_noi_dia","bị đánh khi niệm Hồi Thành Phù: hủy, giữ phù"); }
  await sleep(TEAM_COMBAT_SECS*1000+300);
  { T.travel=null; T.recall=null; T.room.send("use",{id:phuId()}); await waitFor(()=>T.recall?.on,1500);
    ok(await waitFor(()=>T.travel?.mapId==="nac_dinh_thanh",WAYPOINT_CAST*1000+2500),"niệm xong: về Nặc Đinh Thành");
    await rejoin();
    ok(T.room.state.mapId==="nac_dinh_thanh"&&at(wps[nd])&&qtyOf(T,"hoi_thanh_phu")===2,`về trận Quảng trường Nặc Đinh, còn ${qtyOf(T,"hoi_thanh_phu")} phù`); }
  // Thoát vào lại: vẫn nhớ trận đã mở.
  await rejoin(); w=await world();
  ok([lang,nd,tc,rt].every(k=>w?.list.find(x=>x.key===k)?.open)&&w.list.filter(x=>x.open).length===4,`thoát vào lại: còn ${w?.list.filter(x=>x.open).length} trận đã mở`);
  await T.room.leave();
}

/**
 * 11.3: Tinh Đấu Ngoại vi ×8 dựng bằng tools/maps (`tinh_dau_ngoai_vi.v2.json`), chỉ khi server và bot cùng bật MAP_V2=tinh_dau_ngoai_vi:
 * diện tích, vùng có tên giữ niên hạn của bản đồ và mật độ BEAST_DENSITY, cổng hai chiều về Nặc Đinh Thành / vào Nội địa xuất hiện đúng
 * điểm `arrive` của file mới, ba truyền tống trận mở khóa, hồn thú đúng loài / niên hạn vùng và không sát cổng.
 */
async function bigMapTest(){
  console.log("[11.3] Bản đồ lớn dựng bằng tools/maps: Tinh Đấu Ngoại vi ×8");
  const NV="tinh_dau_ngoai_vi", file=mapFileOf(NV);
  if(file===NV){ console.log("  ⚠ bỏ qua bản đồ ×8: bật server và bot cùng MAP_V2=tinh_dau_ngoai_vi"); return; }
  const raw=JSON.parse(readFileSync(mapUrl(NV),"utf8")), old=JSON.parse(readFileSync(new URL(`../../shared/assets/${NV}.json`,import.meta.url),"utf8"));
  const objsOf=m=>m.layers.flatMap(l=>l.objects??[]), objs=objsOf(raw), pr=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  const inR=(o,x,y)=>x>=o.x&&x<=o.x+o.width&&y>=o.y&&y<=o.y+o.height, k=raw.width*raw.height/(old.width*old.height);
  ok(k>=7.5&&k<=8.5,`diện tích ×${k.toFixed(2)}: ${raw.width}×${raw.height} ô (bản cũ ${old.width}×${old.height})`);
  const zs=objs.filter(o=>o.type==="zone"), names=[...new Set(zs.map(z=>z.name))], sum=a=>a.reduce((s,z)=>s+pr(z,"count"),0);
  const total=sum(zs), oldTotal=sum(objsOf(old).filter(o=>o.type==="zone")), [ylo,yhi]=MAPS[NV].years;
  ok(zs.every(z=>{ const y=parseLevelRange(pr(z,"years")); return y&&y[0]>=ylo&&y[1]<=yhi; })&&["Bìa rừng","Rừng thưa","Khe suối","Rìa nội địa"].every(n=>names.includes(n))&&names.length>4,
    `${names.length} vùng có tên (${names.join(", ")}) trong ${zs.length} mảnh chữ nhật, niên hạn trong ${ylo}–${yhi} năm`);
  ok(total>=6*oldTotal&&total<=11*oldTotal,`${total} hồn thú thường theo BEAST_DENSITY (bản cũ ${oldTotal}, ×${(total/oldTotal).toFixed(1)})`);
  const lair=objs.find(o=>o.type==="boss"), es=objs.filter(o=>o.type==="elite");
  ok(es.length===4&&es.every(e=>zs.some(z=>inR(z,e.x+e.width/2,e.y+e.height/2)))&&pr(lair,"boss")===MAPS[NV].king&&zs.some(z=>inR(z,lair.x+lair.width/2,lair.y+lair.height/2)),
    `4 tinh anh và hang ${lair?.name} nằm trong vùng`);
  ok(same(objs.filter(o=>o.type==="waypoint").map(o=>o.name).sort(),["rung_thua","trai_cong","tram_gac"]),"giữ 3 truyền tống trận (mã lưu DB không đổi)");
  const B=await bot("Rừng lớn","kim_vu_mieu_ung",{sex:0,hair:2,hairCol:1,outfitCol:3});
  if(!(await test(B,"ping"))?.enabled){ console.log("  ⚠ bỏ qua phần đi trên bản đồ ×8 (cần hook warp, goto): bật server bằng GAME_TEST=1"); await B.room.leave(); return; }
  const bme=()=>B.room.state.players?.get(B.room.sessionId);
  async function rejoin(){ await B.room.leave(); await sleep(300); B.mapId=(await post("/api/me",{token:B.token})).mapId; await enter(B); await waitFor(()=>bme()&&B.bag,3000); }
  async function warp(mapId,x,y){ B.travel=null; B.room.send("test",{op:"warp",mapId,x,y}); await waitFor(()=>B.travel?.mapId===mapId,4000); await rejoin(); }
  /** Đứng giữa cổng `name` của bản đồ đang ở rồi đi cổng; phải tới `to` ở đúng điểm `arrive` của file Tiled bản đồ đích. */
  async function hop(objsHere,name,to){
    const p=objsHere.find(o=>o.type==="portal"&&o.name===name), ar=objsOf(JSON.parse(readFileSync(mapUrl(to),"utf8"))).find(o=>o.type==="arrive"&&o.name===pr(p,"arrive"));
    await test(B,"goto",{x:p.x+p.width/2,y:p.y+p.height/2}); await sleep(200);
    B.travel=null; B.room.send("travel",{portal:name});
    const went=await waitFor(()=>B.travel?.mapId===to,TRAVEL_CAST*1000+3000); if(went) await rejoin();
    ok(went&&B.room.state.mapId===to&&Math.hypot(bme().x-ar.x,bme().y-ar.y)<1,`cổng "${name}" -> ${MAPS[to].name}, xuất hiện ở ${ar?.name} (${bme()?.x},${bme()?.y})`);
  }
  const arr=n=>objs.find(o=>o.type==="arrive"&&o.name===n);
  await warp(NV,arr("tu_nac_dinh_thanh").x,arr("tu_nac_dinh_thanh").y);
  ok(B.room.state.mapId===NV&&B.room.state.mapFile===file,`phòng báo file bản đồ ${B.room.state.mapFile} (client tải đúng file này)`);
  ok(await waitFor(()=>[...B.room.state.beasts.values()].filter(x=>!x.rank).length>=total*0.9,6000),`đã sinh ${[...B.room.state.beasts.values()].filter(x=>!x.rank).length}/${total} hồn thú thường`);
  checkGateClear(B,checkBeastYears(B));
  const ndObjs=objsOf(JSON.parse(readFileSync(mapUrl("nac_dinh_thanh"),"utf8"))), ndiObjs=objsOf(JSON.parse(readFileSync(mapUrl("tinh_dau_noi_dia"),"utf8")));
  const back=(list,to)=>list.find(o=>o.type==="portal"&&pr(o,"to")===to)?.name;
  await hop(objs,"Về Nặc Đinh Thành","nac_dinh_thanh");
  await hop(ndObjs,back(ndObjs,NV),NV);
  await hop(objs,"Vào Tinh Đấu Nội địa","tinh_dau_noi_dia");
  await hop(ndiObjs,back(ndiObjs,NV),NV);
  // Ba truyền tống trận: bước lên thì mở khóa (trại cổng tây, giữa bản đồ cạnh Cổ Thụ, trạm gác đông).
  for(const w of objs.filter(o=>o.type==="waypoint")){
    const key=`${NV}:${w.name}`; B.wpHere=null; await test(B,"goto",{x:w.x+w.width/2,y:w.y+w.height/2});
    ok(await waitFor(()=>B.wpUnlock.includes(key),2000),`truyền tống trận ${pr(w,"label")}: mở khóa khi bước lên`);
  }
  await B.room.leave();
}

async function shopBuybackTest(){
  console.log("[9.8] Thương nhân: đan lớn, mở rộng túi, mua lại đồ bán nhầm");
  const big=["dai_hoi_huyet_dan","dai_hoi_hon_dan"].map(c=>itemDef(c)), small=itemDef("hoi_huyet_dan");
  ok(big.every(d=>d?.kind==="dan"&&d.cd==="dan"&&d.stack===small.stack)&&big[0].hp===0.6&&big[1].mp===0.6,"Đại Hồi Huyết Đan / Đại Hồi Hồn Đan: đan hồi 60%, chung hồi chiêu đan");
  ok(big.every(d=>SHOP.find(r=>r.code===d.id)?.price===120)&&big.every(d=>sellPrice({code:d.id,years:null,stars:null,enhance:0})===null),
    `thương nhân bán đan lớn ${formatHonTe(120)}, không mua lại đan`);
  ok(BAG_SLOTS===40&&BAG_EXPAND===10&&BAG_MAX_SLOTS===80&&same([40,50,60,70,80].map(bagExpandCost),[2000,5000,10000,20000,null]),
    `mở rộng túi: ${[40,50,60,70].map(n=>`${n}→${n+BAG_EXPAND} ô ${formatHonTe(bagExpandCost(n))}`).join(", ")}, tối đa ${BAG_MAX_SLOTS} ô`);
  ok(bagSlotsOf(null)===BAG_SLOTS&&bagSlotsOf(undefined)===BAG_SLOTS&&bagSlotsOf("x")===BAG_SLOTS&&bagSlotsOf(55)===55&&bagSlotsOf(999)===BAG_MAX_SLOTS&&bagSlotsOf(3)===BAG_SLOTS,
    "bagSlotsOf: dữ liệu trống / hỏng là mức khởi đầu, kẹp trong khoảng");
  if(!(await test(C,"ping"))?.enabled){ console.log("  ⚠ bỏ qua mua / bán / mở rộng (cần hook warp, goto, coin, give…): bật server bằng GAME_TEST=1"); return; }
  const E=await bot("Lái buôn","u_minh_linh_mieu",{sex:0,hair:2,hairCol:0,outfitCol:1});
  const eme=()=>E.room.state.players?.get(E.room.sessionId), loose=()=>looseOf(E);
  /** Hook warp: sang `mapId` tại (x, y) qua transaction đi cổng rồi vào phòng mới như đi cổng thật. */
  async function warp(mapId,x,y){
    E.travel=null; E.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>E.travel?.mapId===mapId,4000),`warp -> ${MAPS[mapId].name}`);
    await E.room.leave(); await sleep(300); E.mapId=(await post("/api/me",{token:E.token})).mapId; await enter(E);
    await waitFor(()=>eme()&&E.bag,3000);
  }
  /** Rời game rồi vào lại (không qua đi cổng). */
  async function relog(){ await E.room.leave(); await sleep(400); E.mapId=(await post("/api/me",{token:E.token})).mapId; await enter(E); await waitFor(()=>eme()&&E.bag,3000); }
  const tn=npcSpot("nac_dinh_thanh","thuong_nhan");
  await warp("nac_dinh_thanh",tn.x+60,tn.y+16);
  ok(E.bag?.slots===BAG_SLOTS&&E.bag.buyback?.length===0,`tài khoản mới: túi ${E.bag?.slots} ô, chưa có đồ mua lại`);
  await test(E,"coin",{n:1e6});
  let t=await trade(E,"expand",{}); ok(/đứng cạnh thương nhân/.test(t)&&E.bag.slots===BAG_SLOTS&&E.bag.honTe===1e6,`đứng xa thương nhân: mở rộng túi bị từ chối (${t})`);
  await test(E,"goto",{x:tn.x,y:tn.y+16});
  // ---- Mở rộng túi ----
  const c0=bagExpandCost(BAG_SLOTS);
  await test(E,"coin",{n:c0-1});
  t=await trade(E,"expand",{}); ok(/Không đủ Hồn Tệ/.test(t)&&E.bag.slots===BAG_SLOTS&&E.bag.honTe===c0-1,`thiếu 1 đồng: không mở rộng được, không mất tiền (${t})`);
  await test(E,"coin",{n:c0});
  t=await trade(E,"expand",{}); ok(E.bag.slots===BAG_SLOTS+BAG_EXPAND&&E.bag.honTe===0&&/40 → 50 ô/.test(t),`mở rộng túi: ${BAG_SLOTS} → ${E.bag.slots} ô, −${formatHonTe(c0)} (${t})`);
  // Túi 50 ô nhận đúng 50 ô (hồn hoàn mỗi chiếc một ô), chiếc thứ 51 không nhận.
  await test(E,"give",{code:RING_ITEM,qty:E.bag.slots-loose().length+1,years:10});
  ok(loose().length===BAG_SLOTS+BAG_EXPAND&&/Túi đồ đã đầy \(50 ô\)/.test(E.logs.at(-1)),`túi đầy ở ${loose().length}/${E.bag.slots} ô: chiếc thứ 51 không nhận (${E.logs.at(-1)})`);
  for(const it of loose().filter(i=>i.code===RING_ITEM)) E.room.send("discard",{id:it.id});
  ok(await waitFor(()=>!loose().some(i=>i.code===RING_ITEM),3000),"bỏ hết hồn hoàn thử");
  await relog();
  ok(E.bag.slots===BAG_SLOTS+BAG_EXPAND&&E.bag.honTe===0,`thoát vào lại: túi vẫn ${E.bag.slots} ô (đã lưu)`);
  // Giá lần sau tăng dần; tới BAG_MAX_SLOTS thì hết.
  await test(E,"coin",{n:BAG_EXPAND_COST.slice(1).reduce((a,v)=>a+v,0)});
  for(let k=1;k<BAG_EXPAND_COST.length;k++){
    const s0=E.bag.slots, h0=E.bag.honTe; t=await trade(E,"expand",{});
    ok(E.bag.slots===s0+BAG_EXPAND&&E.bag.honTe===h0-BAG_EXPAND_COST[k],`mở rộng lần ${k+1}: ${s0} → ${E.bag.slots} ô, −${formatHonTe(BAG_EXPAND_COST[k])}`);
  }
  await test(E,"coin",{n:1e6});
  t=await trade(E,"expand",{}); ok(E.bag.slots===BAG_MAX_SLOTS&&E.bag.honTe===1e6&&/tối đa/.test(t),`đã ${BAG_MAX_SLOTS} ô: không mở rộng thêm, không mất tiền (${t})`);
  // ---- Đan lớn ----
  const [dh,dn]=big.map(d=>SHOP.find(r=>r.code===d.id));
  t=await trade(E,"buy",{code:dh.code,qty:2}); ok(qtyOf(E,dh.code)===2&&E.bag.honTe===1e6-2*dh.price,`mua 2 Đại Hồi Huyết Đan: −${formatHonTe(2*dh.price)} (${t})`);
  t=await trade(E,"buy",{code:dn.code,qty:1}); ok(qtyOf(E,dn.code)===1&&E.bag.honTe===1e6-2*dh.price-dn.price,`mua 1 Đại Hồi Hồn Đan (${t})`);
  // Tin trả lời hook / dòng log đến trước bản vá state và tin "bag": chờ sinh lực đã giảm, chờ túi đã bớt đan rồi mới đo.
  await test(E,"rest",{s:DAN_CD}); await test(E,"hurt",{pct:90}); await waitFor(()=>eme().hp<=eme().maxHp*0.2);
  const p=eme(), hp0=p.hp;
  await useItem(E,E.bag.items.find(i=>i.code===dh.code).id);
  const hg=Number(/Dùng Đại Hồi Huyết Đan: \+(\d+) sinh lực/.exec(E.logs.at(-1))?.[1]);
  ok(await waitFor(()=>qtyOf(E,dh.code)===1)&&Math.abs(hg-p.maxHp*0.6)<=1&&await waitFor(()=>eme().hp>=hp0+hg-1),`Đại Hồi Huyết Đan hồi đúng 60%: +${hg}/${p.maxHp} sinh lực, ${hp0} -> ${eme().hp} (${E.logs.at(-1)})`);
  { const q=qtyOf(E,"hoi_hon_dan"); await useItem(E,E.bag.items.find(i=>i.code==="hoi_hon_dan").id);
    ok(qtyOf(E,"hoi_hon_dan")===q&&/Đan dược đang hồi/.test(E.logs.at(-1))&&E.bag.cd>DAN_CD-2,`chung hồi chiêu đan: ngay sau đan lớn không dùng được Hồi Hồn Đan (${E.logs.at(-1)})`); }
  await test(E,"rest",{s:DAN_CD}); await test(E,"drain",{pct:90});
  await useItem(E,E.bag.items.find(i=>i.code===dn.code).id);
  const mg=Number(/Dùng Đại Hồi Hồn Đan: \+(\d+) hồn lực/.exec(E.logs.at(-1))?.[1]);
  ok(await waitFor(()=>qtyOf(E,dn.code)===0)&&Math.abs(mg-eme().maxMp*0.6)<=1,`Đại Hồi Hồn Đan hồi đúng 60%: +${mg}/${eme().maxMp} hồn lực (${E.logs.at(-1)})`);
  { const bk=bagKey(E); t=await trade(E,"sell",{id:E.bag.items.find(i=>i.code===dh.code).id}); ok(bagKey(E)===bk&&/không mua/.test(t),`thương nhân không mua Đại Hồi Huyết Đan (${t})`); }
  // ---- Mua lại ----
  await test(E,"give",{code:BONE_ITEM,years:12000,beast:"thiet_giap_te_nguu",slot:"than",enhance:5});
  const bn=loose().find(i=>i.code===BONE_ITEM&&i.enhance===5), bp=sellPrice(bn);
  let ht=E.bag.honTe; t=await trade(E,"sell",{id:bn.id});
  const bb=E.bag.buyback?.[0];
  ok(!E.bag.items.some(i=>i.id===bn.id)&&E.bag.honTe===ht+bp&&bb?.code===BONE_ITEM&&bb.years===12000&&bb.enhance===5&&sj(bb.stats)===sj(bn.stats)&&bb.price===bp,
    `bán hồn cốt Thân 12.000 năm +5: +${formatHonTe(bp)}, thương nhân giữ để mua lại (${t})`);
  await test(E,"coin",{n:bp-1});
  t=await trade(E,"buyback",{key:bb.key}); ok(/Không đủ Hồn Tệ/.test(t)&&E.bag.honTe===bp-1&&E.bag.buyback.length===1,`thiếu 1 đồng: không mua lại được (${t})`);
  await test(E,"coin",{n:bp+500});
  // Túi đầy (BAG_MAX_SLOTS ô): mua lại hồn cốt bị từ chối, không mất tiền.
  await test(E,"give",{code:RING_ITEM,qty:E.bag.slots-loose().length,years:10});
  t=await trade(E,"buyback",{key:bb.key}); ok(loose().length===E.bag.slots&&/không đủ chỗ/.test(t)&&E.bag.honTe===bp+500&&E.bag.buyback.length===1,`túi đầy ${loose().length}/${E.bag.slots} ô: mua lại bị từ chối (${t})`);
  E.room.send("discard",{id:loose().find(i=>i.code===RING_ITEM).id}); await waitFor(()=>loose().length===E.bag.slots-1,2000);
  for(const [m,why] of [[{key:"khong-co"},"mã lạ"],[{key:7},"mã dạng số"],[{},"thiếu mã"]]){
    const bk=bagKey(E); t=await trade(E,"buyback",m); ok(bagKey(E)===bk&&/không còn giữ/.test(t),`mua lại ${why}: bị từ chối (${t})`);
  }
  t=await trade(E,"buyback",{key:bb.key});
  const back=loose().find(i=>i.code===BONE_ITEM&&i.years===12000);
  ok(back&&back.id!==bn.id&&back.enhance===5&&sj(back.stats)===sj(bn.stats)&&E.bag.honTe===500&&E.bag.buyback.length===0,
    `mua lại đúng món: hồn cốt ${back?.years} năm +${back?.enhance}, cùng chỉ số, −${formatHonTe(bp)} (${t})`);
  t=await trade(E,"buyback",{key:bb.key}); ok(/không còn giữ/.test(t)&&E.bag.honTe===500,`mua lại lần hai cùng món: bị từ chối (${t})`);
  // Mảnh bán một phần: mua lại đúng số đã bán, gộp về ô cũ.
  for(const it of loose().filter(i=>i.code===RING_ITEM).slice(0,10)) E.room.send("discard",{id:it.id});
  await waitFor(()=>loose().length<=E.bag.slots-10,2000);
  const sc=shardCode("hao_thien_chuy"); await test(E,"give",{code:sc,qty:5});
  ht=E.bag.honTe; t=await trade(E,"sell",{id:loose().find(i=>i.code===sc).id,qty:2});
  ok(qtyOf(E,sc)===3&&E.bag.buyback[0]?.qty===2&&E.bag.honTe===ht+2*SHARD_SELL.UR,`bán 2 / 5 mảnh Hạo Thiên Chùy (${t})`);
  t=await trade(E,"buyback",{key:E.bag.buyback[0].key});
  ok(qtyOf(E,sc)===5&&loose().filter(i=>i.code===sc).length===1&&E.bag.honTe===ht,`mua lại 2 mảnh: gộp về 5 mảnh một ô, Hồn Tệ về như cũ (${t})`);
  // Chỉ giữ BUYBACK_MAX lần bán gần nhất (mới nhất trước).
  const ys=[110,120,130,140,150,160];
  for(const y of ys) await test(E,"give",{code:RING_ITEM,years:y});
  for(const y of ys) await trade(E,"sell",{id:loose().find(i=>i.code===RING_ITEM&&i.years===y).id});
  ok(same(E.bag.buyback.map(b=>b.years),ys.slice(-BUYBACK_MAX).reverse()),`bán ${ys.length} hồn hoàn: thương nhân chỉ giữ ${BUYBACK_MAX} chiếc gần nhất (${E.bag.buyback.map(b=>b.years).join(", ")} năm)`);
  // Đứng xa thì không mua lại được; đi cổng sang Thiên Đấu Thành danh sách vẫn còn, mua lại ở thương nhân Thiên Đấu.
  await test(E,"goto",{x:30*16,y:20*16});
  { const bk=bagKey(E); t=await trade(E,"buyback",{key:E.bag.buyback[0].key}); ok(bagKey(E)===bk&&/đứng cạnh thương nhân/.test(t),`đứng xa thương nhân: mua lại bị từ chối (${t})`); }
  const tt=npcSpot(AT,"thuong_nhan_thien_dau"); await warp(AT,tt.x,tt.y+16);
  ok(same(E.bag.buyback.map(b=>b.years),ys.slice(-BUYBACK_MAX).reverse())&&E.bag.slots===BAG_MAX_SLOTS,"đi cổng sang Thiên Đấu Thành: danh sách mua lại và số ô túi còn nguyên");
  ht=E.bag.honTe; t=await trade(E,"buyback",{key:E.bag.buyback[0].key});
  ok(loose().some(i=>i.code===RING_ITEM&&i.years===160)&&E.bag.honTe===ht-ringSellPrice(160)&&E.bag.buyback.length===BUYBACK_MAX-1,`thương nhân Thiên Đấu mua lại hồn hoàn 160 năm (${t})`);
  t=await trade(E,"buy",{code:dh.code,qty:1}); ok(/Mua 1 Đại Hồi Huyết Đan/.test(t),`thương nhân Thiên Đấu bán đan lớn cùng giá (${t})`);
  // Rời game: thương nhân quên đồ đã bán; túi, số ô, Hồn Tệ vẫn lưu.
  const bk=bagKey(E); await relog();
  ok(E.bag.buyback?.length===0&&bagKey(E)===bk&&E.bag.slots===BAG_MAX_SLOTS,`rời game rồi vào lại: danh sách mua lại trống, túi ${E.bag.slots} ô và Hồn Tệ còn nguyên`);
  await E.room.leave();
}

/**
 * BĐ6a Thiên Đấu Thành: bot C đi bộ qua cổng bắc Nặc Đinh Thành (thành an toàn, không cảnh báo cấp), xuất hiện đúng điểm `arrive`; thành
 * không có hồn thú, không giao chiến; NPC thành (Phất Lan Đức, thương nhân mua được đan, lò rèn, Đại Đấu Hồn Trường) nói chuyện được;
 * không còn biển "sắp mở" (cổng tây Lạc Nhật mở từ BĐ6b, lacNhatTest; cổng bắc Cực Bắc từ BĐ6c, cucBacTest; bến thuyền Hải Thần Đảo từ BĐ6d, haiThanTest); thoát vào lại đúng bản đồ
 * và vị trí; đi bộ về Nặc Đinh Thành, xuất hiện ở cổng bắc.
 */
async function thienDauTest(){
  console.log("[BĐ6a] Thiên Đấu Thành: cổng Nặc Đinh Thành <-> Thiên Đấu Thành, NPC thành, cổng chưa mở");
  const raw=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const objs=raw(AT), portals=objs.filter(o=>o.type==="portal").map(o=>o.name);
  ok(MAPS[AT]?.kind==="town"&&MAPS[AT].level===null&&MAPS[AT].name==="Thiên Đấu Thành","MAPS: Thiên Đấu Thành là thành an toàn (town), không cấp đề xuất");
  // BĐ6b mở cổng tây (Lạc Nhật Sâm Lâm), BĐ6c cổng bắc (Cực Bắc Chi Địa), BĐ6d bến thuyền (Hải Thần Đảo): portal thay biển `cong_lac_nhat` /
  // `cong_cuc_bac` / `ben_thuyen_hai_than`.
  ok(same([...portals].sort(),["Về Nặc Đinh Thành","Đi Lạc Nhật Sâm Lâm","Đi Cực Bắc Chi Địa","Thuyền đi Hải Thần Đảo"].sort()),`Thiên Đấu Thành có cổng về Nặc Đinh Thành, cổng tây đi Lạc Nhật, cổng bắc đi Cực Bắc và bến thuyền đi Hải Thần Đảo: ${portals.join(", ")}`);
  ok(["cong_lac_nhat","cong_cuc_bac","ben_thuyen_hai_than"].every(id=>!npcDef(id)&&!npcSpot(AT,id)),"không còn biển \"sắp mở\" nào (BĐ6b–d)");
  const signs=[];
  if(!(await test(C,"ping"))?.enabled){ console.log("  ⚠ bỏ qua đi Thiên Đấu Thành (cần hook goto, coin): bật server bằng GAME_TEST=1"); return; }
  C.room.send("travel",{portal:"Đi Thiên Đấu Thành"}); ok(await lastLog(C,/đứng trong cổng/),"Nặc Đinh Thành: chưa đứng trong cổng bắc thì không đi được");
  // Đi bộ thật từ điểm xuất hiện của cổng bắc lên cổng.
  const back=raw("nac_dinh_thanh").find(o=>o.type==="arrive"&&o.name==="tu_thien_dau_thanh");
  await test(C,"goto",{x:back.x,y:back.y});
  ok(await walk(0,-1,()=>C.portal?.name,4000)&&C.portal.name==="Đi Thiên Đấu Thành",`tới cổng bắc: ${JSON.stringify(C.portal)}`);
  ok(C.portal?.to===AT&&C.portal.toName==="Thiên Đấu Thành"&&!C.portal.warn&&!C.portal.level,"hộp cổng: đích Thiên Đấu Thành, không cấp đề xuất, không cảnh báo");
  await travelBy("Đi Thiên Đấu Thành",AT);
  const ar=objs.find(o=>o.type==="arrive"&&o.name==="tu_nac_dinh_thanh");
  ok(Math.hypot(me().x-ar.x,me().y-ar.y)<1,`xuất hiện ở cổng nam Thiên Đấu Thành: ${me().x},${me().y}`);
  ok(C.room.state.beasts.size===0,"Thiên Đấu Thành không có hồn thú");
  C.room.send("attack"); ok(await lastLog(C,/Vùng an toàn/),"thành an toàn: không đánh được");
  C.room.send("skill",{i:0}); ok(await lastLog(C,/Vùng an toàn/),"thành an toàn: không dùng hồn kỹ được");
  await sleep(1500); ok(C.room.state.beasts.size===0,"vẫn không sinh hồn thú sau một lúc");
  // NPC thành.
  for(const id of ["phat_lan_duc","thuong_nhan_thien_dau","lo_ren_thien_dau","dau_hon_truong",...signs]){
    const sp=npcSpot(AT,id); await test(C,"goto",{x:sp.x,y:sp.y+16});
    ok(await talk(C,id)===id,`${npcDef(id).name} (${npcDef(id).title}): mở hộp thoại`);
  }
  ok(await talk(C,"thuong_nhan")===null&&/Không có NPC này/.test(C.logs.at(-1)),"Thương nhân Nặc Đinh không ở Thiên Đấu Thành");
  { const sp=npcSpot(AT,"thuong_nhan_thien_dau"); await test(C,"goto",{x:sp.x,y:sp.y+16}); await test(C,"coin",{n:1000});
    const hh=SHOP.find(r=>r.code==="hoi_huyet_dan"), q0=qtyOf(C,hh.code), h0=C.bag.honTe, t=await trade(C,"buy",{code:hh.code,qty:1});
    ok(qtyOf(C,hh.code)===q0+1&&C.bag.honTe===h0-hh.price,`thương nhân Thiên Đấu bán đan cùng giá (${t})`); }
  // Cổng chưa mở: xin đi bị từ chối, đi tiếp ra ngoài bị tường / sông chặn, không hiện hộp cổng.
  for(const [id,dx,dy] of []){ // từ BĐ6d không còn cổng chưa mở (giữ khung để thử cổng mới về sau)
    C.room.send("travel",{portal:npcDef(id).name}); ok(await lastLog(C,/không tồn tại/),`${npcDef(id).name}: không phải cổng`);
    const sp=npcSpot(AT,id); await test(C,"goto",{x:sp.x,y:sp.y+16}); C.portal=null;
    await walk(dx,dy,()=>false,1500); const q=me();
    // tường thành ở cột / hàng 0 (tools/gen-map.mjs)
    ok(q.x>16&&q.y>16&&q.x<77*16&&!C.portal?.name&&C.room.state.mapId===AT,`${npcDef(id).name}: đi tiếp bị chặn ở (${q.x.toFixed(0)},${q.y.toFixed(0)}), vẫn ở Thiên Đấu Thành`);
  }
  await cucBacTest();
  // Thoát vào lại: đúng bản đồ, đúng chỗ.
  { const sp=npcSpot(AT,"phat_lan_duc"); await test(C,"goto",{x:sp.x,y:sp.y+16}); await C.room.leave(); await sleep(400);
    const m=await post("/api/me",{token:C.token}); ok(m.mapId===AT,`thoát rồi /api/me: ${m.mapId}`);
    C.mapId=m.mapId; await enter(C); await waitFor(()=>me()&&C.bag);
    ok(C.room.state.mapId===AT&&Math.hypot(me().x-sp.x,me().y-sp.y-16)<1,`vào lại: Thiên Đấu Thành đúng chỗ cũ (${me().x},${me().y})`); }
  // Đi bộ về Nặc Đinh Thành theo đại lộ xuống cổng nam.
  await test(C,"goto",{x:ar.x,y:ar.y});
  ok(await walk(0,1,()=>C.portal?.name,4000)&&C.portal.to==="nac_dinh_thanh"&&!C.portal.warn,`tới cổng nam: ${C.portal?.name}`);
  await travelBy("Về Nặc Đinh Thành","nac_dinh_thanh");
  ok(Math.hypot(me().x-back.x,me().y-back.y)<1,`về Nặc Đinh Thành ở cổng bắc: ${me().x},${me().y}`);
}

/**
 * BĐ6b Lạc Nhật Sâm Lâm: dữ liệu (MAPS, 4 vùng đúng bảng 5.3, loài từ 1.000 năm có chiêu báo trước và kỹ năng hồn cốt, tinh anh mỗi
 * vùng, thú vương và hang ở vùng sâu nhất, rơi đặc trưng, tiên thảo chỉ ở đây và vùng sâu tỉ lệ cao). Với hook: bot L (tài khoản mới,
 * cấp thấp) tới cổng tây Thiên Đấu Thành (hộp cổng có cấp đề xuất 40–70 và cảnh báo đỏ, vẫn đi được), xuất hiện ở trại cổng Lạc Nhật;
 * hồn thú đúng loài / năm theo vùng, không sát cổng; 4 tinh anh có mặt; tiên thảo rơi theo vùng (nông không rơi, sâu rơi với cùng số
 * ngẫu nhiên; tinh anh x HERB_ELITE); mảnh 3 võ hồn và hồn hạch của bản đồ; dùng tiên thảo cho võ hồn dự bị / ra trận tăng đúng %
 * chỉ số, tối đa HERB_MAX cây, từ chối võ hồn lạ; thoát vào lại vẫn giữ; Hút Sinh của Khô Đằng Thụ Vương hồi máu khi trúng người đang
 * bị Trói; thú vương xuất hiện theo lịch (hook king).
 */
async function lacNhatTest(){
  console.log("[BĐ6b] Lạc Nhật Sâm Lâm: cổng tây Thiên Đấu Thành, vùng, tinh anh, thú vương, tiên thảo, rơi đặc trưng");
  const LN="lac_nhat_sam_lam", M=MAPS[LN];
  const objs=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const prop=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  ok(M?.kind==="hunt"&&M.name==="Lạc Nhật Sâm Lâm"&&same(M.level,[40,70])&&same(M.years,[5000,30000]),"MAPS: Lạc Nhật Sâm Lâm là bản đồ săn cấp 40–70, 5.000–30.000 năm");
  ok(same(M.shards,["bich_lan_xa_hoang","ky_nhung_thong_thien_cuc","hoa_long","liet_hoa_thuong_lang"])&&same(M.cores,["xa_hoang","phuong_hoang"])&&M.king==="luong_nghi_thu_ho_xa",
    `rơi đặc trưng: mảnh ${M.shards.map(v=>VOHON[vohonIndex(v)]?.name).join(", ")}; bộ hồn hạch ${M.cores.join(", ")}`);
  // Vùng (bảng 5.3): tên, niên hạn, loài, tinh anh; theo chiều đông.
  const ZT=[["Rừng hoa độc","5000-10000",["thuc_nhan_hoa","cuc_yeu_hoa_linh","doc_cuc_dang"],"huyet_man_thuc_nhan_hoa"],
    ["Đầm Bích Lân","10000-18000",["bich_lan_xa","doc_vu_thiem","hac_thuy_mang"],"song_dau_bich_lan_xa"],
    ["Băng Hỏa Tuyền","16000-25000",["liet_hoa_tich_dich","huyen_bang_thiem","hoa_linh_diep"],"bang_hoa_song_sac_mang"],
    ["Lưỡng Nghi Nhãn","22000-30000",["co_moc_thu_nhan","y_la_hoa_yeu","thanh_lan_doc_co"],"kho_dang_thu_vuong"]];
  const os=objs(LN), zs=os.filter(o=>o.type==="zone").sort((a,b)=>a.x-b.x), es=os.filter(o=>o.type==="elite"), zbad=[];
  ZT.forEach(([n,y,sp,el],i)=>{
    const z=zs[i]; if(!z||z.name!==n||prop(z,"years")!==y||!same(String(prop(z,"beasts")).split(",").map(x=>x.split(":")[0]),sp)) zbad.push(n);
    if(sp.some(x=>beastIndex(x)<0||!beastSkillOf(x,parseLevelRange(y)[0])||!BONE_SKILLS[x])) zbad.push(`${n}: loài`);
    const e=z?es.filter(e=>e.x+e.width/2>=z.x&&e.x+e.width/2<z.x+z.width):[], d=BOSSES[bossIndex(el)];
    if(e.length!==1||prop(e[0],"boss")!==el||d?.rank!==1||d.skills.length!==2||beastIndex(d.species)<0) zbad.push(`${n}: tinh anh`);
  });
  ok(zs.length===4&&!zbad.length,`4 vùng theo chiều đông đúng bảng 5.3 (loài từ 1.000 năm có chiêu báo trước và kỹ năng hồn cốt, mỗi vùng 1 tinh anh): ${zs.map(z=>`${z.name} ${prop(z,"years")}`).join("; ")}`+(zbad.length?` sai: ${zbad.join(", ")}`:""));
  const K=BOSSES[bossIndex(M.king)], lr=os.filter(o=>o.type==="boss"), deep=zs[3];
  ok(K?.rank===2&&K.hp===7&&K.skills.length>=2&&K.skills.length<=3&&K.phase2?.skills.length&&[...K.skills,...K.phase2.skills].every(s=>s.warn>=1)
    &&lr.length===1&&prop(lr[0],"boss")===M.king&&lr[0].x>=deep.x&&lr[0].x+lr[0].width<=deep.x+deep.width,
    `thú vương ${K?.name} x${K?.hp}: ${K?.skills.map(s=>s.name).join(", ")} + GĐ2 ${K?.phase2?.name} (${K?.phase2?.skills.map(s=>s.name).join(", ")}), hang ở ${deep.name}`);
  const west=objs(AT).find(o=>o.type==="portal"&&prop(o,"to")===LN), back=os.filter(o=>o.type==="portal");
  ok(west?.name==="Đi Lạc Nhật Sâm Lâm"&&prop(west,"level")==="40-70"&&!npcDef("cong_lac_nhat")&&back.length===1&&prop(back[0],"to")===AT&&!prop(back[0],"level"),
    "cổng tây Thiên Đấu Thành -> Lạc Nhật (đề xuất 40–70, thay biển \"sắp mở\"); Lạc Nhật chỉ có cổng về Thiên Đấu Thành (thành: không cấp đề xuất)");
  // Tiên thảo: hàm thuần.
  const hc=ZT.map(([n])=>herbChance(LN,n)), pc=x=>`${(x*100).toLocaleString("vi-VN")}%`;
  ok(HERBS.length>=3&&HERBS.every(h=>itemDef(h.id)?.kind==="tien_thao"&&itemDef(h.id).stack>1)&&hc.every((c,i)=>c>0&&(!i||c>hc[i-1]))
    &&herbChance(LN,ZT[3][0],true)===Math.min(1,hc[3]*HERB_ELITE)&&herbChance(LN,"Không có")===0&&Object.values(MAPS).every(m=>m.id===LN||!m.herbs),
    `tiên thảo (${HERBS.map(h=>h.name).join(", ")}) chỉ rơi ở Lạc Nhật, vùng càng sâu càng cao: ${hc.map(pc).join(" / ")}, tinh anh x${HERB_ELITE}`);
  ok(same(herbBonus({[HERBS[0].id]:3,[HERBS[2].id]:99,la:5}),{[HERBS[0].stat]:3*HERB_PCT,[HERBS[1].stat]:0,[HERBS[2].stat]:HERB_MAX*HERB_PCT})
    &&same(parseHerbs({[HERBS[0].id]:"2",la:4,[HERBS[1].id]:-3,[HERBS[2].id]:99}),{[HERBS[0].id]:2,[HERBS[2].id]:HERB_MAX})
    &&calcStats(0,30,[1,1],1,{},{},{},{hp:5}).maxHp===calcStats(0,30,[1,1],1,{},{},{hp:5}).maxHp&&calcStats(0,30,[1,1],1,{},{},{},{hp:5}).maxHp>calcStats(0,30,[1,1]).maxHp,
    "herbBonus / parseHerbs (bỏ mã lạ, kẹp tối đa) và calcStats cộng % tiên thảo như cộng minh");
  const pool=kingShardPool(LN), rc=rollCore(20000,M.cores,()=>0);
  ok(M.shards.every(v=>pool.some(x=>x.vohon===v&&x.w===3))&&!pool.some(x=>x.w===1&&M.shards.includes(x.vohon))&&M.cores.includes(rc.data.set),
    `rương thú vương Lạc Nhật: mảnh của bản đồ trọng số 3; hồn hạch bộ đặc trưng (${rc.data.set})`);
  if(!(await test(C,"ping"))?.enabled){ console.log("  ⚠ bỏ qua đi Lạc Nhật (cần hook warp, herb, king): bật server bằng GAME_TEST=1"); return; }

  const L=await bot("Lạc Nhật","bich_lan_xa_hoang",{sex:1,hair:2,hairCol:3,outfitCol:4}), C0=C;
  C=L; // dùng chung các hàm đi bộ / đi cổng của bot C (me, walk, travelBy)
  try{
    await waitFor(()=>me()&&L.owned&&L.bag);
    const ar=objs(AT).find(o=>o.type==="arrive"&&o.name==="tu_lac_nhat_sam_lam");
    L.travel=null; await test(L,"warp",{mapId:AT,x:ar.x,y:ar.y}); await waitFor(()=>L.travel,3000);
    await L.room.leave(); await sleep(300); L.mapId=AT; await enter(L); await waitFor(()=>me()&&L.owned&&L.bag);
    ok(L.room.state.mapId===AT&&Math.hypot(me().x-ar.x,me().y-ar.y)<1,`Thiên Đấu Thành: đứng ở điểm xuất hiện của cổng tây (${me().x},${me().y})`);
    ok(await walk(-1,0,()=>L.portal?.name,4000)&&L.portal.name==="Đi Lạc Nhật Sâm Lâm",`đi bộ tới cổng tây: ${JSON.stringify(L.portal)}`);
    ok(L.portal?.to===LN&&L.portal.toName==="Lạc Nhật Sâm Lâm"&&same(L.portal.level,[40,70])&&L.portal.warn&&me().level<40,
      `hộp cổng: đề xuất cấp 40–70, cấp ${me().level} có cảnh báo đỏ (chặn mềm)`);
    await travelBy("Đi Lạc Nhật Sâm Lâm",LN);
    const arr=os.find(o=>o.type==="arrive"&&o.name==="tu_thien_dau_thanh");
    ok(Math.hypot(me().x-arr.x,me().y-arr.y)<1,`dưới cấp vẫn vào được, xuất hiện ở trại cổng Lạc Nhật: ${me().x},${me().y}`);
    await waitFor(()=>L.room.state.beasts.size>20,3000);
    const map=checkBeastYears(L); checkGateClear(L,map);
    // Tinh anh: mỗi vùng một con, niên hạn bằng mức trên của vùng.
    const el=await test(L,"elite");
    ok(el.list?.length===4&&ZT.every(([n,y,,id])=>el.list.some(e=>e.boss===id&&e.zone===n&&e.bid&&e.years===parseLevelRange(y)[1])),
      `4 tinh anh có mặt: ${(el.list??[]).map(e=>`${e.name} (${e.zone}, ${e.years} năm)`).join("; ")}`);

    // Ô đứng được của Lạc Nhật (tile chặn như server/src/map.ts), để đặt bot vào từng vùng.
    const ts=JSON.parse(readFileSync(mapUrl(LN),"utf8"));
    const sg=new Set(ts.tilesets.flatMap(t=>(t.tiles??[]).filter(x=>(x.properties??[]).some(q=>q.name==="collides"&&q.value)).map(x=>t.firstgid+x.id)));
    const sol=new Set(ts.layers.filter(l=>l.type==="tilelayer").flatMap(l=>l.data.flatMap((g,i)=>sg.has(g)?[i]:[])));
    const free=(x,y)=>{ for(let ty=Math.floor((y-12)/16);ty<=Math.floor((y+12)/16);ty++) for(let tx=Math.floor((x-24)/16);tx<=Math.floor((x+24)/16);tx++)
      if(tx<0||ty<0||tx>=ts.width||ty>=ts.height||sol.has(ty*ts.width+tx)) return false; return true; };
    /** Đưa L tới một chỗ trống trong vùng `z` (xa tinh anh và hang), dọn hồn thú quanh đó. */
    async function inZone(z){
      for(let y=z.y+40;y<z.y+z.height-40;y+=24) for(let x=z.x+40;x<z.x+z.width-40;x+=24){
        if(!free(x,y)||es.some(e=>Math.abs(x-e.x-e.width/2)<200&&Math.abs(y-e.y-e.height/2)<200)||lr.some(e=>Math.abs(x-e.x-e.width/2)<260&&Math.abs(y-e.y-e.height/2)<220)) continue;
        await test(L,"goto",{x,y}); if(Math.hypot(me().x-x,me().y-y)<1){ await test(L,"clear",{keep:1}); await test(L,"rest",{s:TEAM_COMBAT_SECS+1}); return true; }
      }
      return false;
    }
    /** Sinh hồn thú 1 máu cạnh L (loài `species`, `years`, hoặc tinh anh `boss`) rồi hạ nó qua killBeast. Trả các dòng log mới. */
    async function slay(extra){ const l=L.logs.length; await test(L,"beast",{dx:14,dy:0,...extra}); await test(L,"slay"); await sleep(150); return L.logs.slice(l).join(" | "); }
    await test(L,"shard",{r:100}); await test(L,"bone",{r:100}); await test(L,"core",{r:100});
    // Tiên thảo: cùng số ngẫu nhiên 3% thì vùng nông (1%) không rơi, vùng sâu nhất (5%) rơi; 6% thì thường không, tinh anh (x3) rơi.
    const H0=HERBS[0], h=()=>HERBS.reduce((a,x)=>a+qtyOf(L,x.id),0);
    ok(await inZone(zs[0]),"tới Rừng hoa độc");
    await test(L,"herb",{r:3,i:0}); let n0=h(), lg=await slay({species:"thuc_nhan_hoa",years:8000});
    ok(h()===n0&&!/tiên thảo/.test(lg),`Rừng hoa độc, số ngẫu nhiên 3% (tỉ lệ ${pc(hc[0])}): không rơi tiên thảo`);
    ok(await inZone(zs[3]),"tới Lưỡng Nghi Nhãn");
    await test(L,"herb",{r:3,i:0}); n0=h(); lg=await slay({species:"co_moc_thu_nhan",years:26000});
    ok(qtyOf(L,H0.id)===1&&h()===n0+1&&/Tìm được tiên thảo/.test(lg),`Lưỡng Nghi Nhãn, cùng số ngẫu nhiên (tỉ lệ ${pc(hc[3])}): rơi ${H0.name} vào túi (${lg})`);
    await test(L,"herb",{r:6,i:2}); n0=h(); lg=await slay({species:"co_moc_thu_nhan",years:26000});
    ok(h()===n0,"số ngẫu nhiên 6%: hồn thú thường vùng sâu nhất không rơi");
    await test(L,"herb",{r:6,i:2}); n0=h(); lg=await slay({boss:"kho_dang_thu_vuong",years:30000});
    ok(qtyOf(L,HERBS[2].id)===1&&h()===n0+1,`tinh anh (x${HERB_ELITE} = ${pc(herbChance(LN,ZT[3][0],true))}) rơi ${HERBS[2].name}`);
    await test(L,"herb",{r:-1}); await test(L,"clear",{keep:1});
    // Rơi đặc trưng: mảnh 4 võ hồn của bản đồ (từ 8.3 có Liệt Hỏa Thương Lang); hồn hạch rơi xuống đất.
    for(let i=0;i<M.shards.length;i++){
      const code=shardCode(M.shards[i]), q0=qtyOf(L,code); await test(L,"shard",{r:0,i}); lg=await slay({species:"y_la_hoa_yeu",years:24000});
      ok(qtyOf(L,code)===q0+1,`mảnh rơi đặc trưng: ${itemDef(code).name} (${lg.split(" | ").find(t=>/Mảnh/.test(t))??lg})`);
    }
    await test(L,"shard",{r:100});
    { await test(L,"core",{r:0,stars:0,set:-1}); const d0=new Set(L.room.state.drops.keys()); await slay({species:"thanh_lan_doc_co",years:24000});
      const nd=[...L.room.state.drops.entries()].filter(([k,x])=>!d0.has(k)&&x.item===CORE_ITEM).map(([,x])=>x), band=coreStarBand(24000);
      ok(nd.length===1&&nd[0].stars>=band[0]&&nd[0].stars<=band[1],`hồn hạch rơi ở Lạc Nhật: ${nd[0]?.stars}★ bộ ${CORE_SETS[nd[0]?.cset]?.name} (sao ${band.join("–")} theo 24.000 năm)`);
      await test(L,"core",{r:100});
      let hits=0; for(let k=0;k<400;k++) if(M.cores.includes(rollCore(24000,M.cores,Math.random).data.set)) hits++;
      ok(hits>=400*(CORE_MAP_SET-0.12),`hồn hạch rơi ở Lạc Nhật phần lớn thuộc bộ Xà Hoàng / Phượng Hoàng: ${hits}/400`); }

    // Dùng tiên thảo cho võ hồn dự bị (Lam Ngân Thảo) và võ hồn ra trận.
    const act=L.owned.active, bench=L.owned.list.find(v=>v.rowId!==act).rowId;
    await test(L,"set",{rowId:bench,level:50,xp:0,rings:[]});
    await test(L,"give",{code:H0.id,qty:HERB_MAX+1}); await test(L,"give",{code:HERBS[2].id,qty:1});
    const herbIt=c=>L.bag.items.find(i=>i.code===c);
    const useOn=async(code,vohonId)=>{ const n=L.ownedMsgs, l=L.logs.length; L.room.send("use",{id:herbIt(code)?.id,vohonId}); await waitFor(()=>L.ownedMsgs>n||L.logs.length>l,1500); await sleep(120); return L.logs.slice(l).join(" | "); };
    const vh=v=>vohonIndex(v.vohon);
    let s0=await test(L,"stats",{rowId:bench}), q0=qtyOf(L,H0.id);
    lg=await useOn(H0.id,bench); let s1=await test(L,"stats",{rowId:bench}), bv=L.owned.list.find(v=>v.rowId===bench);
    ok(qtyOf(L,H0.id)===q0-1&&bv.herbs?.[H0.id]===1&&s1.herbs?.[H0.id]===1&&s1.base.maxHp>s0.base.maxHp
      &&s1.base.maxHp===calcStats(vh(bv),bv.level,bv.rings.map(tierOfYears),bv.stars,{},{},L.res?.bonus,herbBonus(bv.herbs)).maxHp,
      `dùng ${H0.name} cho võ hồn dự bị: sinh lực tối đa ${s0.base.maxHp} -> ${s1.base.maxHp} (+${HERB_PCT}%), mất 1 cây (${lg})`);
    const a0=await test(L,"stats",{rowId:act}); lg=await useOn(HERBS[2].id,act); const a1=await test(L,"stats",{rowId:act}), av=L.owned.list.find(v=>v.rowId===act);
    ok(av.herbs?.[HERBS[2].id]===1&&a1.live.atk>a0.live.atk&&Math.abs(a1.live.atk-calcStats(vh(av),av.level,av.rings.map(tierOfYears),av.stars,a1.bones,a1.cores,L.res?.bonus,herbBonus(av.herbs)).atk)<1e-6,
      `dùng ${HERBS[2].name} cho võ hồn ra trận: công đang dùng ${a0.live.atk.toFixed(2)} -> ${a1.live.atk.toFixed(2)}`);
    // Trong túi còn cây Ỷ La rơi ở trên (q0 tính cả cây đó): so số cây tương đối.
    const q1=qtyOf(L,H0.id);
    lg=await useOn(H0.id,999999); ok(/Chọn võ hồn/.test(lg)&&qtyOf(L,H0.id)===q1,`võ hồn không phải của mình: từ chối, không mất cây (${lg})`);
    lg=await useOn(H0.id,undefined); ok(/Chọn võ hồn/.test(lg)&&qtyOf(L,H0.id)===q1,"thiếu võ hồn: từ chối");
    for(let k=1;k<HERB_MAX;k++) await useOn(H0.id,bench);
    lg=await useOn(H0.id,bench); bv=L.owned.list.find(v=>v.rowId===bench);
    ok(bv.herbs?.[H0.id]===HERB_MAX&&qtyOf(L,H0.id)===q1-(HERB_MAX-1)&&/đã dùng đủ/.test(lg),`tối đa ${HERB_MAX} cây mỗi loại mỗi võ hồn: cây thứ ${HERB_MAX+1} bị từ chối (${lg})`);
    // Thoát vào lại: số cây và chỉ số đã lưu.
    const keep=JSON.stringify(L.owned.list.map(v=>[v.rowId,sj(v.herbs)])), sb=(await test(L,"stats",{rowId:bench})).base.maxHp, hp0=me().maxHp, q2=qtyOf(L,H0.id);
    await L.room.leave(); await sleep(400); await enter(L); await waitFor(()=>me()&&L.owned&&L.bag);
    const s2=await test(L,"stats",{rowId:bench});
    ok(L.room.state.mapId===LN&&JSON.stringify(L.owned.list.map(v=>[v.rowId,sj(v.herbs)]))===keep&&s2.base.maxHp===sb&&me().maxHp===hp0&&qtyOf(L,H0.id)===q2,
      `thoát vào lại: tiên thảo đã dùng còn nguyên (${keep}), sinh lực tối đa võ hồn dự bị ${s2.base.maxHp}, túi còn ${q2} ${H0.name}`);

    // Hút Sinh (Khô Đằng Thụ Vương): trúng người đang bị Trói thì hồi máu.
    { const e=el.list.find(x=>x.boss==="kho_dang_thu_vuong");
      await test(L,"set",{rowId:act,level:100,xp:0,rings:[]}); await test(L,"rest",{s:TEAM_COMBAT_SECS+1});
      // Tinh anh hồi sinh ở tick sau hook erespawn: chờ tới khi ô có bid và vị trí (đọc sớm thì bid null, hook tele / bhp nhắm hồn thú
      // gần nhất khác hoặc không có ai: "tele {}").
      await test(L,"erespawn",{s:0}); let cur=null;
      for(let k=0;k<20&&!(cur?.bid&&L.room.state.beasts.has(cur.bid)&&Number.isFinite(cur.x));k++){ await sleep(150); cur=(await test(L,"elite")).list.find(x=>x.boss==="kho_dang_thu_vuong"); }
      cur??=e;
      // Tinh anh sinh ở điểm ngẫu nhiên trong ô của nó: thử vài chỗ đứng quanh (chỗ bị cây / nước chặn thì goto không đổi vị trí).
      let at=null; for(const [dx,dy] of [[20,0],[0,20],[-20,0],[0,-20],[28,10],[-28,10],[10,28],[10,-28]]){
        await test(L,"goto",{x:cur.x+dx,y:cur.y+dy}); if(Math.hypot(me().x-cur.x-dx,me().y-cur.y-dy)<1){ at=[dx,dy]; break; } }
      // Nhắm đúng tinh anh theo bid (tùy tùng / hồn thú khác có thể đứng gần hơn), bỏ chiêu nó đang tự báo trước.
      const eb={bid:cur.bid};
      // Máu đặt bằng hook bhp đọc từ state: chờ bản vá tới (đọc sớm thì hp1 còn máu cũ, cao hơn máu sau khi hồi).
      const half=async()=>{ await test(L,"bhp",{pct:50,...eb}); await waitFor(()=>{ const q=L.room.state.beasts.get(cur.bid); return !q||q.hp<=Math.round(q.maxHp*0.5); },1500); };
      // Đòn không tính trúng khi hồn sư còn khung bất tử (vừa vào lại phòng 1,5 giây, vừa bị hồn thú khác / tùy tùng đánh 0,45 giây):
      // dọn hồn thú thường quanh L (giữ tinh anh) trước mỗi lần, tung lại tối đa 3 lần cách 1,6 giây (BĐ6e). Tinh anh đang báo trước thì
      // không đánh thường.
      let t={}, b=null, hp1=0, why="";
      for(let k=0;k<3&&!(b&&b.hp>hp1);k++){
        if(k) await sleep(1600);
        await test(L,"clear",{keep:1}); await half(); await test(L,"pst",{s:"root",secs:5}); L.fxs=[];
        t=await test(L,"tele",{i:1,cancel:1,...eb}); b=L.room.state.beasts.get(t.bid); hp1=b?.hp; await waitFor(()=>!b||b.hp>hp1,2500);
        const th=L.fxs.find(f=>f.k==="teleHit"&&f.bid===t.bid);
        why+=` [lần ${k+1}: teleHit ${th?(th.hit.includes(L.room.sessionId)?"trúng L":"không trúng L"):"chưa có"}, Trói ${(me().st&statusBit("root"))!==0}]`;
      }
      ok(t.name==="Hút Sinh"&&b&&b.hp>hp1,`Hút Sinh trúng người đang bị Trói: ${b?beastName(b.rank,b.species):"?"} hồi ${b?b.hp-hp1:0} máu (${hp1} -> ${b?.hp}; đứng cạnh ${JSON.stringify(at)}, tinh anh ở ${cur.x?.toFixed(0)},${cur.y?.toFixed(0)}, tele ${JSON.stringify(t)})`+(b&&b.hp>hp1?"":why));
    }
    // Thú vương theo lịch (hook king): xuất hiện trong hang, đúng niên hạn mức trên của bản đồ.
    { await test(L,"goto",{x:arr.x,y:arr.y}); await test(L,"king",{kop:"spawn",mapId:LN}); let ki=null;
      for(let k=0;k<20&&!ki?.bid;k++){ await sleep(150); ki=await test(L,"king"); }
      const lair=lr[0], inL=ki?.bid&&ki.x>=lair.x&&ki.x<=lair.x+lair.width&&ki.y>=lair.y&&ki.y<=lair.y+lair.height;
      ok(ki?.bid&&inL&&ki.years===M.years[1]&&same(ki.skills,K.skills.map(s=>s.name))&&L.boss.some(m=>m.k==="spawn"),
        `Tà hóa ${K.name} xuất hiện trong hang (${ki?.years} năm, ${ki?.hp}/${ki?.maxHp} máu, chiêu ${ki?.skills?.join(", ")})`); }
  } finally { C=C0; await L.room.leave().catch(()=>{}); }
}

/**
 * BĐ6d Hải Thần Đảo / Ma Quỷ Hải Vực: dữ liệu (MAPS, 4 vùng đúng bảng 5.3, loài từ 1.000 năm có chiêu báo trước và kỹ năng hồn cốt,
 * tinh anh mỗi vùng, thú vương 95.000 năm và hang ở vùng sâu nhất, rơi đặc trưng, chỉ Hải Thần Uyên lên tới 100.000 năm, bến thuyền hai
 * chiều). Với hook: bot H (tài khoản mới, cấp thấp) tới bến thuyền Thiên Đấu Thành (hộp "Đi thuyền tới", đề xuất 80–100, cảnh báo đỏ,
 * BOAT_CAST giây), bước ra khỏi bến thì hủy, đi thuyền thật thì tới bến Hải Thần; hồn thú đúng loài / năm theo vùng, không sát bến;
 * 4 tinh anh có mặt; luật tối đa 1 hồn thú thường 100.000 năm mỗi kênh (tinh anh 100.000 năm không tính, vùng khác không sinh, hạ con
 * đỏ thì sinh lại được) và đồ rơi của nó; mảnh 3 võ hồn và hồn hạch của bản đồ; thú vương xuất hiện trong hang (hook king); đi thuyền về.
 */
async function haiThanTest(){
  console.log("[BĐ6d] Hải Thần Đảo: bến thuyền Thiên Đấu Thành, vùng, tinh anh, thú vương, luật 1 hồn thú 100.000 năm, rơi đặc trưng");
  const HT="hai_than_dao", M=MAPS[HT];
  const objs=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const prop=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  ok(M?.kind==="hunt"&&M.name==="Hải Thần Đảo"&&same(M.level,[80,100])&&same(M.years,[50000,MAX_YEARS]),"MAPS: Hải Thần Đảo là bản đồ săn cấp 80–100, 50.000–100.000 năm");
  ok(same(M.shards,["quy_mi","thien_can_bach_ngoc_dinh","hoa_anh","pha_hon_thuong"])&&same(M.cores,["ba_vuong_long","tien_co"])&&M.king==="tham_hai_ma_kinh_vuong", // Phá Hồn Thương từ 2026-10-20
    `rơi đặc trưng: mảnh ${M.shards.map(v=>VOHON[vohonIndex(v)]?.name).join(", ")}; bộ hồn hạch ${M.cores.join(", ")}`);
  const ZT=[["Bãi san hô","50000-65000",["thiet_giap_cu_giai","lam_lan_hai_xa","kiem_ngu"],"hac_giap_cu_giai_vuong"],
    ["Ma Quỷ Hải Vực","60000-80000",["quy_dien_hai_yeu","tham_hai_ma_chuong","loi_quang_hai_dieu"],"ma_chuong_vuong"],
    ["Vách Hải Thần","75000-90000",["kim_lan_long_quy","huyet_nha_cu_sa","loi_van_hai_ung"],"huyet_sa_bao_quan"],
    ["Hải Thần Uyên","85000-100000",["tham_hai_ma_kinh","u_linh_hai_mau"],"hac_uyen_ma_kinh"]];
  const os=objs(HT), zs=os.filter(o=>o.type==="zone").sort((a,b)=>a.x-b.x), es=os.filter(o=>o.type==="elite"), zbad=[];
  ZT.forEach(([n,y,sp,el],i)=>{
    const z=zs[i]; if(!z||z.name!==n||prop(z,"years")!==y||!same(String(prop(z,"beasts")).split(",").map(x=>x.split(":")[0]),sp)) zbad.push(n);
    if(sp.some(x=>beastIndex(x)<0||!beastSkillOf(x,parseLevelRange(y)[0])||!BONE_SKILLS[x])) zbad.push(`${n}: loài`);
    const e=z?es.filter(e=>e.x+e.width/2>=z.x&&e.x+e.width/2<z.x+z.width):[], d=BOSSES[bossIndex(el)];
    if(e.length!==1||prop(e[0],"boss")!==el||d?.rank!==1||d.skills.length!==2||beastIndex(d.species)<0) zbad.push(`${n}: tinh anh`);
  });
  ok(zs.length===4&&!zbad.length,`4 vùng theo chiều đông đúng bảng 5.3 (loài có chiêu báo trước và kỹ năng hồn cốt, mỗi vùng 1 tinh anh): ${zs.map(z=>`${z.name} ${prop(z,"years")}`).join("; ")}`+(zbad.length?` sai: ${zbad.join(", ")}`:""));
  // Chỉ Hải Thần Uyên sinh được hồn thú thường 100.000 năm (mục 5.3): mọi vùng của mọi bản đồ săn khác có mức trên dưới MAX_YEARS.
  const tops=Object.values(MAPS).filter(m=>m.kind==="hunt").flatMap(m=>objs(m.id).filter(o=>o.type==="zone"&&parseLevelRange(prop(o,"years"))?.[1]>=MAX_YEARS).map(o=>`${m.id}/${o.name}`));
  ok(same(tops,[`${HT}/Hải Thần Uyên`])&&RED_BEAST_CHANCE>0&&RED_BEAST_CHANCE<1,`chỉ ${tops.join(", ")} lên tới ${MAX_YEARS} năm (tỉ lệ ra đúng ${MAX_YEARS} năm mỗi lần sinh ${RED_BEAST_CHANCE*100}%)`);
  const K=BOSSES[bossIndex(M.king)], lr=os.filter(o=>o.type==="boss"), deep=zs[3];
  ok(K?.rank===2&&K.hp===8&&kingYears(HT)===95000&&K.skills.length>=2&&K.skills.length<=3&&K.phase2?.skills.length&&[...K.skills,...K.phase2.skills].every(s=>s.warn>=1)
    &&lr.length===1&&prop(lr[0],"boss")===M.king&&lr[0].x>=deep.x&&lr[0].x+lr[0].width<=deep.x+deep.width,
    `thú vương ${K?.name} x${K?.hp} ${kingYears(HT)} năm: ${K?.skills.map(s=>s.name).join(", ")} + GĐ2 ${K?.phase2?.name} (${K?.phase2?.skills.map(s=>s.name).join(", ")}), hang ở ${deep.name}`);
  ok(BOSSES[bossIndex("huyet_sa_bao_quan")]?.skills.some(s=>s.weak&&s.at==="target"),"Huyết Khí của Huyết Sa Bạo Quân nhắm người ít máu nhất (weak)");
  const dock=objs(AT).find(o=>o.type==="portal"&&prop(o,"to")===HT), back=os.filter(o=>o.type==="portal");
  ok(dock?.name==="Thuyền đi Hải Thần Đảo"&&prop(dock,"level")==="80-100"&&prop(dock,"boat")===true&&!npcDef("ben_thuyen_hai_than")
    &&back.length===1&&prop(back[0],"to")===AT&&!prop(back[0],"level")&&prop(back[0],"boat")===true&&BOAT_CAST>TRAVEL_CAST,
    `bến thuyền Thiên Đấu Thành -> Hải Thần Đảo (đề xuất 80–100, đi thuyền ${BOAT_CAST} giây, thay biển "sắp mở"); Hải Thần Đảo chỉ có thuyền về Thiên Đấu Thành (không cấp đề xuất)`);
  const pool=kingShardPool(HT), rc=rollCore(90000,M.cores,()=>0);
  ok(M.shards.every(v=>pool.some(x=>x.vohon===v&&x.w===3))&&!kingShardPool("tinh_dau_ngoai_vi").some(x=>M.shards.includes(x.vohon))&&M.cores.includes(rc.data.set),
    `rương thú vương Hải Thần Đảo: mảnh của bản đồ trọng số 3 (${M.shards.length} võ hồn, có Phá Hồn Thương), các võ hồn này thôi nằm trong nhóm "bản đồ chưa mở"; hồn hạch bộ đặc trưng (${rc.data.set})`);
  if(!(await test(C,"ping"))?.enabled){ console.log("  ⚠ bỏ qua đi Hải Thần Đảo (cần hook warp, red, king): bật server bằng GAME_TEST=1"); return; }

  const H=await bot("Hải Thần","quy_mi",{sex:0,hair:1,hairCol:2,outfitCol:3}), C0=C;
  C=H; // dùng chung các hàm đi bộ / đi cổng của bot C (me, walk, travelBy)
  try{
    await waitFor(()=>me()&&H.owned&&H.bag);
    const ar=objs(AT).find(o=>o.type==="arrive"&&o.name==="tu_hai_than_dao");
    H.travel=null; await test(H,"warp",{mapId:AT,x:ar.x,y:ar.y}); await waitFor(()=>H.travel,3000);
    await H.room.leave(); await sleep(300); H.mapId=AT; await enter(H); await waitFor(()=>me()&&H.owned&&H.bag);
    ok(H.room.state.mapId===AT&&Math.hypot(me().x-ar.x,me().y-ar.y)<1,`Thiên Đấu Thành: đứng trên cầu tàu (${me().x},${me().y})`);
    ok(await walk(1,0,()=>H.portal?.name,4000)&&H.portal.name==="Thuyền đi Hải Thần Đảo",`đi bộ ra đầu cầu tàu: ${JSON.stringify(H.portal)}`);
    ok(H.portal?.to===HT&&H.portal.toName==="Hải Thần Đảo"&&same(H.portal.level,[80,100])&&H.portal.warn&&H.portal.boat===BOAT_CAST&&me().level<80,
      `hộp bến thuyền: đề xuất cấp 80–100, đi thuyền ${H.portal?.boat} giây, cấp ${me().level} có cảnh báo đỏ (chặn mềm)`);
    // Bước ra khỏi bến khi đang đi thuyền: hủy.
    { const l=H.logs.length; H.room.send("travel",{portal:H.portal.name}); await sleep(400); await walk(-1,0,()=>!H.portal?.name,1500); await sleep(300);
      const lg=H.logs.slice(l).join(" | ");
      ok(/Lên thuyền/.test(lg)&&/hủy đi qua cổng/.test(lg)&&!H.travel&&H.room.state.mapId===AT,`đang đi thuyền mà rời bến thì hủy: ${lg}`); }
    ok(await walk(1,0,()=>H.portal?.name,3000),"quay lại đầu cầu tàu");
    let t0=0;
    await travelBy("Thuyền đi Hải Thần Đảo",HT,async()=>{ t0=Date.now(); await sleep((TRAVEL_CAST+0.8)*1000);
      ok(!H.travel&&H.room.state.mapId===AT,`sau ${TRAVEL_CAST+0.8} giây vẫn đang đi thuyền (cổng thường chỉ niệm ${TRAVEL_CAST} giây)`); },
      async()=>ok(Date.now()-t0>=BOAT_CAST*1000-250,`đi thuyền mất ${((Date.now()-t0)/1000).toFixed(1)} giây (BOAT_CAST ${BOAT_CAST})`));
    const arr=os.find(o=>o.type==="arrive"&&o.name==="tu_thien_dau_thanh");
    ok(Math.hypot(me().x-arr.x,me().y-arr.y)<1,`dưới cấp vẫn tới được, xuất hiện ở bến Hải Thần: ${me().x},${me().y}`);
    await waitFor(()=>H.room.state.beasts.size>25,3000);
    const map=checkBeastYears(H); checkGateClear(H,map);
    const el=await test(H,"elite");
    ok(el.list?.length===4&&ZT.every(([n,y,,id])=>el.list.some(e=>e.boss===id&&e.zone===n&&e.bid&&e.years===parseLevelRange(y)[1])),
      `4 tinh anh có mặt: ${(el.list??[]).map(e=>`${e.name} (${e.zone}, ${e.years} năm)`).join("; ")}`);

    // Luật 1 hồn thú thường 100.000 năm mỗi kênh. Hook `red` cố định số ngẫu nhiên (0 = luôn ra đỏ nếu được) và sinh ngay trong vùng.
    const reds=()=>[...H.room.state.beasts.entries()].filter(([,b])=>!b.rank&&b.years>=MAX_YEARS);
    ok(reds().length<=1,`lúc vào: ${reds().length} hồn thú thường ${MAX_YEARS} năm (tối đa 1)`);
    let r=await test(H,"red",{r:0,zone:"Hải Thần Uyên",n:1});
    ok(r.reds===1&&r.elites>=1,`sinh ở Hải Thần Uyên với số ngẫu nhiên 0: kênh có đúng 1 hồn thú thường ${MAX_YEARS} năm, tinh anh ${MAX_YEARS} năm (${r.elites}) không tính`);
    r=await test(H,"red",{r:0,zone:"Hải Thần Uyên",n:6});
    ok(r.reds===1&&r.years.length>=1&&r.years.every(y=>y>=85000&&y<MAX_YEARS),`đã có 1 con: sinh thêm ${r.years.length} con ở Hải Thần Uyên đều dưới ${MAX_YEARS} năm (${r.years.join(", ")})`);
    r=await test(H,"red",{r:0,zone:"Vách Hải Thần",n:6});
    ok(r.reds===1&&r.years.length>=1&&r.years.every(y=>y>=75000&&y<=90000),`vùng khác không bao giờ ra ${MAX_YEARS} năm: Vách Hải Thần ${r.years.join(", ")}`);
    await sleep(1500); ok(reds().length===1,`sau vài lượt sinh tự nhiên vẫn đúng 1 con ${MAX_YEARS} năm`);
    // Hạ con đỏ: đồ rơi theo bảng 100.000 năm (mảnh võ hồn 100%, hồn hạch 5–6★), rồi kênh sinh lại được con đỏ mới.
    { const [rid,rb]=reds()[0]; let at=null;
      for(const [dx,dy] of [[18,0],[-18,0],[0,18],[0,-18],[26,8],[-26,8],[8,26],[8,-26]]){ await test(H,"goto",{x:rb.x+dx,y:rb.y+dy}); if(Math.hypot(me().x-rb.x-dx,me().y-rb.y-dy)<1){ at=[dx,dy]; break; } }
      await test(H,"shard",{r:-1}); await test(H,"core",{r:-1,stars:0,set:-1});
      const sh0=M.shards.reduce((a,v)=>a+qtyOf(H,shardCode(v)),0), d0=new Set(H.room.state.drops.keys()), l=H.logs.length;
      const k=await test(H,"slay",{bid:rid}); await sleep(250);
      const nd=[...H.room.state.drops.entries()].filter(([q,x])=>!d0.has(q)&&x.item===CORE_ITEM).map(([,x])=>x), sh1=M.shards.reduce((a,v)=>a+qtyOf(H,shardCode(v)),0);
      ok(k.bid===rid&&k.years===MAX_YEARS&&sh1>sh0&&nd.length===1&&nd[0].stars>=coreStarBand(MAX_YEARS)[0],
        `hạ hồn thú ${MAX_YEARS} năm: mảnh võ hồn của bản đồ +${sh1-sh0}, hồn hạch ${nd[0]?.stars}★ bộ ${CORE_SETS[nd[0]?.cset]?.name} (${H.logs.slice(l).find(t=>/Mảnh/.test(t))??""}; đứng cạnh ${JSON.stringify(at)}, hạ ${k.bid===rid?"đúng con đỏ":k.bid} ${k.years} năm)`);
      await test(H,"shard",{r:100}); await test(H,"core",{r:100});
      r=await test(H,"red",{r:0,zone:"Hải Thần Uyên",n:1});
      ok(!reds().some(([q])=>q===rid)&&r.reds===1&&r.years.includes(MAX_YEARS),`con đỏ đã bị hạ: kênh sinh lại được 1 con ${MAX_YEARS} năm mới (${r.years.join(", ")}, ${r.reds} con đỏ)`);
      await test(H,"red",{r:-1}); }

    // Rơi đặc trưng: mảnh 3 võ hồn của bản đồ; hồn hạch phần lớn thuộc bộ Bá Vương Long / Tiên Cơ.
    await test(H,"goto",{x:arr.x,y:arr.y}); await test(H,"clear",{keep:1});
    async function slay(extra){ const l=H.logs.length; await test(H,"beast",{dx:14,dy:0,...extra}); await test(H,"slay"); await sleep(150); return H.logs.slice(l).join(" | "); }
    for(let i=0;i<M.shards.length;i++){
      const code=shardCode(M.shards[i]), q0=qtyOf(H,code); await test(H,"shard",{r:0,i}); const lg=await slay({species:"kiem_ngu",years:60000});
      ok(qtyOf(H,code)>q0,`mảnh rơi đặc trưng: ${itemDef(code).name} (${lg.split(" | ").find(t=>/Mảnh/.test(t))??lg})`);
    }
    await test(H,"shard",{r:100});
    { let hits=0; for(let k=0;k<400;k++) if(M.cores.includes(rollCore(70000,M.cores,Math.random).data.set)) hits++;
      ok(hits>=400*(CORE_MAP_SET-0.12),`hồn hạch rơi ở Hải Thần Đảo phần lớn thuộc bộ Bá Vương Long / Tiên Cơ: ${hits}/400`); }

    // Thú vương theo lịch (hook king): xuất hiện trong hang, niên hạn 95.000 năm (kingYears), máu x8.
    { await test(H,"king",{kop:"spawn",mapId:HT}); let ki=null;
      for(let k=0;k<20&&!ki?.bid;k++){ await sleep(150); ki=await test(H,"king"); }
      const lair=lr[0], inL=ki?.bid&&ki.x>=lair.x&&ki.x<=lair.x+lair.width&&ki.y>=lair.y&&ki.y<=lair.y+lair.height;
      ok(ki?.bid&&inL&&ki.years===kingYears(HT)&&ki.base===Math.round(beastStats(ki.years).hp*K.hp)&&same(ki.skills,K.skills.map(s=>s.name))&&H.boss.some(m=>m.k==="spawn"),
        `Tà hóa ${K.name} xuất hiện trong hang (${ki?.years} năm, máu gốc ${ki?.base}, chiêu ${ki?.skills?.join(", ")})`); }

    // Đi thuyền về Thiên Đấu Thành: không cấp đề xuất, không cảnh báo. Hồn thú bị kéo theo ở các bước trên (đang đuổi H) thì dọn cả
    // bản đồ trước, để không con nào đuổi tới bến đánh hủy đi thuyền.
    await test(H,"goto",{x:arr.x,y:arr.y}); await test(H,"clear",{keep:1,all:1}); await test(H,"rest",{s:TEAM_COMBAT_SECS+1}); H.portal=null;
    ok(await walk(-1,0,()=>H.portal?.name,4000)&&H.portal.name==="Thuyền về Thiên Đấu Thành"&&H.portal.boat===BOAT_CAST&&!H.portal.warn&&!H.portal.level,
      `bến Hải Thần: ${JSON.stringify(H.portal)}`);
    await travelBy("Thuyền về Thiên Đấu Thành",AT);
    ok(Math.hypot(me().x-ar.x,me().y-ar.y)<1,`về Thiên Đấu Thành trên cầu tàu: ${me().x},${me().y}`);
  } finally { C=C0; await H.room.leave().catch(()=>{}); }
}

/**
 * BĐ6c Cực Bắc Chi Địa (gọi trong thienDauTest, bot C đang ở Thiên Đấu Thành): dữ liệu bảng 5.3 (4 vùng, loài, niên hạn, chiêu từ
 * 1.000 năm, tinh anh, thú vương, hồn cốt theo loài, rơi đặc trưng); đi bộ lên cổng bắc Thiên Đấu Thành (cấp đề xuất 60–85, chặn mềm),
 * xuất hiện ở trại cổng; hồn thú đúng khoảng năm theo vùng, không sát cổng; chiêu báo trước thật của hồn thú băng (đóng băng = Choáng,
 * Mê hoặc lên hồn sư = Choáng ngắn, Làm chậm); 4 tinh anh có mặt (hook `elite`); thú vương theo lịch (hook `king`), giai đoạn 2 Cực
 * Hàn, hạ thì có rương; mảnh võ hồn và hồn hạch rơi theo bảng "Rơi đặc trưng"; đi cổng về Thiên Đấu Thành.
 */
async function cucBacTest(){
  console.log("[BĐ6c] Cực Bắc Chi Địa: cổng bắc Thiên Đấu Thành, vùng, hồn thú băng, tinh anh, thú vương, rơi đặc trưng");
  const CBM="cuc_bac_chi_dia", M=MAPS[CBM];
  const objs=JSON.parse(readFileSync(mapUrl(CBM),"utf8")).layers.flatMap(l=>l.objects??[]);
  const pr=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value, inR=(r,x,y)=>x>=r.x&&x<=r.x+(r.width??r.w)&&y>=r.y&&y<=r.y+(r.height??r.h);
  ok(M?.kind==="hunt"&&same(M.level,[60,85])&&same(M.years,[20000,80000])&&same(M.shards,["yeu_ho","can_khon_hon_nguyen_toa","nguyet_nhan","bang_phuong_hoang"])
    &&same(M.cores,["lam_ngan","that_sat"])&&M.king==="huyen_minh_bang_giao","MAPS: Cực Bắc Chi Địa săn cấp 60–85, 20.000–80.000 năm, mảnh Yêu Hồ / Càn Khôn Hỗn Nguyên Tỏa / Nguyệt Nhận, bộ Lam Ngân / Thất Sát");
  // Bảng 5.3: tên vùng, niên hạn, loài thường, tinh anh (từ nam lên bắc).
  const TB=[["Tuyết nguyên","20000-35000",["tuyet_lang","bang_nguyen_cu_tuong","bang_vu_ung"],"ngan_nguyet_tuyet_lang_vuong"],
    ["Băng hà nứt","30000-50000",["bang_giap_cu_quy","tuyet_vi_yeu_ho","bang_tinh_hat"],"luc_vi_bang_ho"],
    ["Băng Phong Cốc","45000-65000",["han_bang_dia_long","bang_phong_bach_hung","han_nguyet_ung"],"huyen_bang_toa_lien_mang"],
    ["Cực Bắc Băng Uyên","60000-80000",["bang_bich_hat","huyen_minh_bang_tam","tuyet_ma_vien"],"bang_bich_hat_vuong"]];
  const zs=objs.filter(o=>o.type==="zone"), es=objs.filter(o=>o.type==="elite"), zbad=[];
  for(const [n,yr,sp,el] of TB){ const z=zs.find(o=>o.name===n), y=parseLevelRange(yr), e=es.find(o=>pr(o,"boss")===el);
    const zsp=String(pr(z??{},"beasts")??"").split(",").map(x=>x.split(":")[0]);
    if(!z||!same(parseLevelRange(pr(z,"years")),y)||!same([...zsp].sort(),[...sp].sort())) zbad.push(`${n}: vùng`);
    if(sp.some(s=>beastIndex(s)<0||!beastSkillOf(s,y[0])||!BONE_SKILLS[s])) zbad.push(`${n}: loài / chiêu / hồn cốt`);
    if(!e||!z||!inR(z,e.x+e.width/2,e.y+e.height/2)||BOSSES[bossIndex(el)]?.skills.length!==2) zbad.push(`${n}: tinh anh`); }
  // Vùng chồng nhau 10 cấp theo chiều sâu: càng lên bắc (y nhỏ) càng già.
  const order=TB.map(([n])=>zs.find(o=>o.name===n)?.y??-1);
  ok(!zbad.length&&zs.length===4&&order.every((y,i)=>!i||y<order[i-1]),`4 vùng đúng bảng 5.3, từ nam lên bắc: ${TB.map(([n,yr])=>`${n} ${yr}`).join(" → ")}`+(zbad.length?`: ${zbad.join("; ")}`:""));
  const kd=BOSSES[bossIndex(M.king)], lair=objs.find(o=>o.type==="boss"), deep=zs.find(o=>o.name===TB[3][0]);
  ok(kd?.rank===2&&kd.hp===8&&kd.skills.length===2&&kd.phase2?.name==="Cực Hàn"&&kd.phase2.skills.length===2&&lair&&pr(lair,"boss")===M.king&&inR(deep,lair.x,lair.y)&&inR(deep,lair.x+lair.width,lair.y+lair.height)
    &&itemDef(chestCode(M.king))?.kind==="ruong",`thú vương ${kd?.name} x${kd?.hp}: ${kd?.skills.map(s=>s.name).join(", ")} + GĐ2 ${kd?.phase2?.name} (${kd?.phase2?.skills.map(s=>s.name).join(", ")}), hang trong ${deep?.name}`);
  // Rơi đặc trưng: mảnh của Cực Bắc vào rương các bản đồ khác không còn là "bản đồ chưa mở"; hồn hạch phần lớn thuộc bộ của bản đồ.
  const pool=kingShardPool(CBM), poolNV=kingShardPool("tinh_dau_ngoai_vi").map(x=>x.vohon);
  ok(M.shards.every(v=>pool.find(x=>x.vohon===v)?.w===3&&!poolNV.includes(v)),`rương thú vương: mảnh Cực Bắc trọng số 3 ở Cực Bắc, không còn trong nhóm "bản đồ chưa mở" (${poolNV.join(", ")})`);
  ok(rollCoreStats(5,M.cores,()=>0).set==="lam_ngan"&&rollCoreStats(5,M.cores,()=>0.5).set==="that_sat"&&CORE_MAP_SET>=0.5,`hồn hạch rơi ở Cực Bắc: ${CORE_MAP_SET*100}% thuộc bộ ${M.cores.map(s=>CORE_SETS[coreSetIndex(s)].name).join(" / ")}`);
  if(!(await test(C,"ping"))?.enabled){ console.log("  ⚠ bỏ qua đi Cực Bắc (cần hook goto, warp, spawn, tele, elite, king): bật server bằng GAME_TEST=1"); return; }

  // Đi bộ lên cổng bắc Thiên Đấu Thành.
  const tdObjs=JSON.parse(readFileSync(mapUrl(AT),"utf8")).layers.flatMap(l=>l.objects??[]);
  const back=tdObjs.find(o=>o.type==="arrive"&&o.name==="tu_cuc_bac_chi_dia");
  await test(C,"goto",{x:back.x,y:back.y}); C.portal=null;
  ok(await walk(0,-1,()=>C.portal?.name,4000)&&C.portal.name==="Đi Cực Bắc Chi Địa",`tới cổng bắc Thiên Đấu Thành: ${JSON.stringify(C.portal)}`);
  ok(C.portal?.to===CBM&&C.portal.toName===M.name&&same(C.portal.level,[60,85])&&C.portal.warn===(me().level<60),`hộp cổng: đề xuất cấp 60–85, cấp ${me().level} -> cảnh báo ${C.portal?.warn} (chặn mềm: vẫn đi được)`);
  await travelBy("Đi Cực Bắc Chi Địa",CBM);
  const ar=objs.find(o=>o.type==="arrive"&&o.name==="tu_thien_dau_thanh"), camp=objs.find(o=>o.type==="spawn");
  ok(Math.hypot(me().x-ar.x,me().y-ar.y)<1&&inR(camp,me().x,me().y),`xuất hiện ở trại cổng Cực Bắc: ${me().x},${me().y}`);
  await waitFor(()=>C.room.state.beasts.size>=10,3000);
  checkGateClear(C,checkBeastYears(C)); // vùng Cực Bắc: 20.000–35.000 … 60.000–80.000 năm

  // Võ hồn ra trận cấp 80, 8 vòng (đủ sinh lực chịu chiêu hồn thú vạn năm); trả lại như cũ ở cuối.
  const act=C.owned.active, v0=C.owned.list.find(v=>v.rowId===act);
  await test(C,"set",{rowId:act,level:80,xp:0,rings:[423,764,1760,5000,12000,20000,50000,90000]});
  await sleep(1600); // vừa vào bản đồ thì bất tử 1,5 giây (chiêu trúng nhưng không mất máu, không gây trạng thái)
  // Chiêu báo trước thật: đóng băng (Choáng), Mê hoặc lên hồn sư (Choáng ngắn), Làm chậm; đứng trong vùng thì trúng.
  for(const [sp,years,dx,dy,s] of [["han_bang_dia_long",50000,26,0,"stun"],["tuyet_vi_yeu_ho",40000,60,0,"stun"],["bang_nguyen_cu_tuong",25000,24,0,"slow"]]){
    await test(C,"clear"); await test(C,"ready"); const before=new Set(C.room.state.beasts.keys());
    const sr=await test(C,"spawn",{tier:tierOfYears(years),years,species:sp,dx,dy});
    let bid=null; await waitFor(()=>{ if(sr?.bid) return C.room.state.beasts.has(sr.bid)&&(bid=sr.bid);
      C.room.state.beasts.forEach((o,k)=>{ if(!before.has(k)&&BEASTS[o.species]?.id===sp) bid=k; }); return bid; });
    await test(C,"status",{s:"root",secs:30}); C.fxs=[];
    const r=await test(C,"tele",{i:0}), def=beastSkillOf(sp,years), tl=C.fxs.find(f=>f.k==="tele"&&f.bid===bid)??(await waitFor(()=>C.fxs.some(f=>f.k==="tele"&&f.bid===bid),800),C.fxs.find(f=>f.k==="tele"&&f.bid===bid));
    await waitFor(()=>C.fxs.some(f=>(f.k==="teleHit"||f.k==="teleEnd")&&f.bid===bid),2500);
    // Tin fx đến trước bản vá state: chờ trạng thái hiện trên PlayerState.st.
    const hit=C.fxs.find(f=>f.k==="teleHit"&&f.bid===bid), got=await waitFor(()=>(me().st&statusBit(s))!==0,800);
    ok(r?.name===def.name&&tl?.shape===def.shape&&hit?.hit.includes(C.room.sessionId)&&got,
      `${BEASTS[beastIndex(sp)].name} ${formatYears(years)}: ${def.name} (${def.shape} ${def.r}) trúng, gây ${STATUS[s].name}${def.status?.[0]?.secs?` ${def.status[0].secs} giây`:""}`
      +(got&&hit?.hit.includes(C.room.sessionId)?"":` [bid ${bid}, tele ${JSON.stringify(r)}, fx ${C.fxs.filter(f=>/^tele/.test(f.k)).map(f=>`${f.k}:${f.bid}:${f.hit??""}`).join(" ")}, st ${me().st}, sinh lực ${me().hp}/${me().maxHp}, chết ${me().dead}]`));
    await sleep(1300);
  }
  await test(C,"clear");

  // Tinh anh: mỗi vùng 1 con, niên hạn bằng mức trên của vùng (hook elite; vừa bị xóa thì rút giờ chờ hồi sinh).
  await test(C,"erespawn",{s:0});
  let L=(await test(C,"elite")).list; for(let k=0;k<20&&L.some(e=>!e.bid);k++){ await sleep(400); L=(await test(C,"elite")).list; }
  const ebad=L.filter(e=>{ const t=TB.find(x=>x[3]===e.boss), b=e.bid&&C.room.state.beasts.get(e.bid);
    return !t||e.zone!==t[0]||e.years!==parseLevelRange(t[1])[1]||!b||b.rank!==1||e.skills.join()!==BOSSES[bossIndex(e.boss)].skills.map(x=>x.name).join(); });
  ok(L.length===4&&!ebad.length,`4 tinh anh có mặt: ${L.map(e=>`${e.name} (${e.zone}, ${e.years} năm: ${e.skills?.join(" / ")})`).join("; ")}`+(ebad.length?` ✗ ${ebad.map(e=>e.boss).join(",")}`:""));

  // Thú vương theo lịch (hook king phát sự kiện như schedule.ts): trong hang, 80.000 năm, máu x8; giai đoạn 2 Cực Hàn; hạ thì có rương.
  C.boss=[]; await test(C,"king",{kop:"spawn"});
  const kingB=()=>[...C.room.state.beasts.values()].find(b=>b.rank===2);
  ok(await waitFor(()=>kingB()&&C.boss.some(m=>m.k==="spawn"),2500),`xuất hiện: "${C.boss.find(m=>m.k==="spawn")?.name}" ở ${C.boss.find(m=>m.k==="spawn")?.mapName}`);
  let ki=await test(C,"king"); const Y=M.years[1], kbase=Math.round(beastStats(Y).hp*kd.hp);
  ok(ki.bid&&inR(ki.lair,ki.x,ki.y)&&ki.years===Y&&ki.base===kbase&&ki.phase===1&&same(ki.skills,kd.skills.map(s=>s.name)),
    `thú vương trong hang (${ki.x?.toFixed(0)},${ki.y?.toFixed(0)}), ${ki.years} năm, máu ${ki.maxHp} (x${kd.hp}), chiêu ${ki.skills?.join(", ")}`);
  // Gây sát thương là thành người tham gia (mục 5.4), nên C đứng ở trại cổng, ngoài tầm thú vương.
  await test(C,"kdmg",{v:1}); ki=await test(C,"king"); C.boss=[];
  await test(C,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*KING.phaseHp)+1});
  ok(await waitFor(()=>kingB()?.phase===2,1500)&&C.boss.some(m=>m.k==="phase"&&m.title==="Cực Hàn"),`giai đoạn 2 – ${C.boss.find(m=>m.k==="phase")?.title} (${C.boss.find(m=>m.k==="phase")?.desc})`);
  ki=await test(C,"king");
  ok(same(ki.skills,[...kd.skills,...kd.phase2.skills].map(s=>s.name))&&Math.abs(ki.spd-kd.phase2.spd)<1e-9,`chiêu giai đoạn 2: ${ki.skills.join(", ")}; tốc độ x${ki.spd}`);
  const ch0=qtyOf(C,chestCode(M.king)); C.boss=[]; await test(C,"kdmg",{v:1e8});
  ok(await waitFor(()=>!kingB()&&C.boss.some(m=>m.k==="down"),2500)&&await waitFor(()=>qtyOf(C,chestCode(M.king))===ch0+1,2000),
    `hạ thú vương: nhận ${itemDef(chestCode(M.king))?.name} (${C.logs.slice(-2).join(" | ")})`);
  await test(C,"goto",{x:ar.x,y:ar.y});

  // Rơi đặc trưng: mảnh của 4 võ hồn Cực Bắc (từ 8.3 có Băng Phượng Hoàng) vào túi người hạ (hook shard cố định võ hồn), hồn hạch sao theo niên hạn.
  await test(C,"core",{r:0});
  for(let i=0;i<M.shards.length;i++){
    const [n,yr,sp]=TB[i], y=parseLevelRange(yr)[0], code=shardCode(M.shards[i]), q0=qtyOf(C,code);
    await test(C,"clear"); await test(C,"shard",{r:0,i}); const before=new Set(C.room.state.drops.keys());
    await test(C,"spawn",{tier:tierOfYears(y),years:y,species:sp[0],dx:20}); await sleep(150);
    const sl=await test(C,"slay"); await waitFor(()=>qtyOf(C,code)>q0,1500);
    const nd=[...C.room.state.drops.entries()].filter(([k])=>!before.has(k)).map(([,d])=>d), core=nd.find(d=>d.item===CORE_ITEM), ring=nd.find(d=>!d.item);
    const [lo,hi]=coreStarBand(y);
    ok(sl?.years===y&&qtyOf(C,code)===q0+1&&ring?.years===y&&core&&core.stars>=lo&&core.stars<=hi,
      `hạ ${BEASTS[beastIndex(sp[0])].name} ${formatYears(y)} (${n}): +1 mảnh ${VOHON[vohonIndex(M.shards[i])].name}, hồn hoàn ${formatYears(ring?.years??0)}, hồn hạch ${core?.stars}★ ${CORE_SETS[core?.cset]?.name}`);
  }
  await test(C,"shard",{r:-1}); await test(C,"core",{r:100}); await test(C,"clear");
  await test(C,"set",{rowId:act,level:v0.level,xp:v0.xp,rings:v0.rings});

  // Về Thiên Đấu Thành bằng cổng ở mép nam, xuất hiện ở cổng bắc.
  await test(C,"goto",{x:ar.x,y:ar.y}); C.portal=null;
  ok(await walk(0,1,()=>C.portal?.name,4000)&&C.portal.to===AT&&!C.portal.warn&&!C.portal.level,`tới cổng về Thiên Đấu Thành: ${C.portal?.name}`);
  await travelBy("Về Thiên Đấu Thành",AT);
  ok(Math.hypot(me().x-back.x,me().y-back.y)<1,`về Thiên Đấu Thành ở cổng bắc: ${me().x},${me().y}`);
}

/**
 * BĐ6e: Lõi Tinh Đấu và boss thế giới 100.000 năm (mục 5.3, 5.4). Hàm thuần (lịch 21:00 giờ Việt Nam, luân phiên theo ngày), dữ liệu
 * (MAPS, BOSSES, Tiled: sàn đấu, cổng bờ hồ Nội địa); với hook: bot W1 cấp thấp đi bộ vào cổng bờ hồ (đề xuất 90–100, cảnh báo đỏ,
 * vẫn đi được), báo trước / xuất hiện toàn server, 3 bot cùng đánh (máu x(1 + 0,6 × (N − 1)), bị loại khi ra khỏi sàn), điểm yếu hệ
 * (đổi võ hồn đúng hệ thì x2,5), Bá Thể (cường công phá nhanh gấp 3, không phá kịp thì boss hồi máu), tích lực Đại Địa Chấn (chỉ khống
 * chế của võ hồn Khống chế mới ngắt, đủ 3 lần thì ngắt; không ngắt thì cả sàn dính Vết thương sâu, đổi sang võ hồn phụ trợ thanh tẩy
 * được), nổi giận (x3, chiêu toàn sàn), Du Thủy (lặn không nhận sát thương, nổi lên lộ điểm yếu mẫn công), Thanh Lân Độc Vụ, chia
 * thưởng (hồn hoàn đỏ cho người nhiều nhất, rương từ 3%), 1 lần/ngày (sang ngày mới đặt lại), mở rương (hồn cốt, mảnh UR, hồn hạch
 * 5–6★), lặn xuống hồ sau 15 phút, đăng xuất ở Lõi thì lần sau về bờ hồ Nội địa.
 */
async function loiTinhDauTest(){
  console.log("[BĐ6e] Lõi Tinh Đấu: boss thế giới, cơ chế đổi võ hồn, chia thưởng, 1 lần/ngày, đăng xuất về Nội địa");
  const LT="loi_tinh_dau", ND="tinh_dau_noi_dia", M=MAPS[LT], VIEN="thai_than_cu_vien", MANG="thien_thanh_nguu_mang";
  const objs=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const prop=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  const DV=BOSSES[bossIndex(VIEN)], DM=BOSSES[bossIndex(MANG)];
  ok(M?.kind==="boss"&&M.name==="Lõi Tinh Đấu"&&same(M.level,[90,100])&&same(M.years,[100000,100000])&&same(M.world,[VIEN,MANG])&&M.exit===ND&&!M.king,
    "MAPS: Lõi Tinh Đấu là bản đồ boss, cấp 90–100, boss thế giới 100.000 năm luân phiên, đăng xuất về Nội địa");
  ok([DV,DM].every(d=>d?.rank===3&&beastIndex(d.species)>=0&&BONE_SKILLS[d.species]&&d.skills.length&&d.skills.every(s=>s.warn>=1))
    &&DV.world?.charge?.need===3&&DV.world.charge.skill.floor&&DV.world.armor?.he==="cuong_cong"&&DM.world?.miasma?.skill.floor&&DM.world.dive?.he==="man_cong"
    &&WORLD_SLAM.floor&&beastName(3,bossIndex(VIEN))==="Boss thế giới Thái Thản Cự Viên",
    `2 boss thế giới: ${DV?.name} (${DV?.skills.map(s=>s.name).join(", ")}; Bá Thể, Đại Địa Chấn) và ${DM?.name} (${DM?.skills.map(s=>s.name).join(", ")}; Thanh Lân Độc Vụ, Du Thủy)`);
  ok(WORLD.hp===30&&WORLD.daily===1&&WORLD.share===0.03&&WORLD_TIME==="21:00"&&WORLD.enrageSecs===600&&WORLD.lifeSecs===900&&WORLD.warnSecs===300&&KING_CHEST.ur===0
    &&[1,3,10].every(n=>Math.abs(bossHpMult(n)-(1+0.6*(n-1)))<1e-9),
    "đã chốt: máu x30, 21:00 mỗi ngày, báo trước 5 phút, nổi giận sau 10 phút, 1 lần/ngày, từ 3% có thưởng; từ BĐ6 rương thú vương không còn mảnh UR");
  const U=(h,mi=0,d=19)=>Date.UTC(2026,9,d,h,mi);
  ok(worldNext(U(13,0))===U(14,0)&&worldNext(U(14,0))===U(14,0,20)&&worldActive(U(14,5))===U(14,0)&&worldActive(U(14,0)+WORLD.lifeSecs*1000)===null
    &&worldActive(U(13,59))===null&&vnHHMM(worldNext(U(1,0)))==="21:00"&&!KING_TIMES.includes(WORLD_TIME)
    &&worldBossOn(LT,U(14,0))!==worldBossOn(LT,U(14,0,20))&&worldBossOn(LT,U(14,0))===worldBossOn(LT,U(14,0,21))&&worldBossOn("tinh_dau_noi_dia",U(14,0))===null,
    `lịch boss thế giới ${WORLD_TIME} giờ Việt Nam (không trùng ${KING_TIMES.join(" / ")}), luân phiên theo ngày: 19/10 ${worldBossOn(LT,U(14,0))}, 20/10 ${worldBossOn(LT,U(14,0,20))}`);
  const os=objs(LT), lr=os.filter(o=>o.type==="boss"), zs=os.filter(o=>o.type==="zone"), back=os.filter(o=>o.type==="portal");
  const nd=objs(ND), gate=nd.find(o=>o.type==="portal"&&prop(o,"to")===LT), arrND=nd.find(o=>o.type==="arrive"&&o.name==="tu_loi_tinh_dau"), arrLT=os.find(o=>o.type==="arrive"&&o.name==="tu_tinh_dau_noi_dia");
  const hac=nd.filter(o=>o.type==="zone").reduce((a,z)=>z.x>a.x?z:a);
  ok(lr.length===1&&M.world.includes(prop(lr[0],"boss"))&&zs.length===1&&prop(zs[0],"count")===0&&back.length===1&&prop(back[0],"to")===ND&&prop(back[0],"arrive")==="tu_loi_tinh_dau"
    &&gate&&!prop(gate,"level")&&prop(gate,"arrive")==="tu_tinh_dau_noi_dia"&&arrND&&arrLT&&gate.x>=hac.x,
    `Tiled: sàn đấu "${lr[0]?.name}" ${lr[0]?.width/16}×${lr[0]?.height/16} ô, không hồn thú thường, cổng về Nội địa; Nội địa có cổng "${gate?.name}" ở ${hac.name} (cấp đề xuất lấy MAPS: 90–100)`);
  if(!(await test(C,"ping"))?.enabled){ console.log("  ⚠ bỏ qua boss thế giới (cần hook warp, king, wmech, kdmg): bật server bằng GAME_TEST=1"); return; }
  { const {now,mode}=await bossClock(C), nx=worldNext(now); if(worldActive(now)!==null||nx-now<(WORLD.warnSecs+300)*1000)
    console.log(`  ⚠ Đồng hồ lịch boss (${mode}) gần / trong khung boss thế giới (${WORLD_TIME} giờ Việt Nam): kiểm tra BĐ6e có thể trượt vì lịch, chạy lại sau ${WORLD.lifeSecs/60} phút.`); }

  const C0=C, W1=await bot("Thái Thản","cuu_tinh_that_sat_kiem",{sex:0,hair:2,hairCol:1,outfitCol:0}),
    W2=await bot("Ngưu Mãng","u_minh_linh_mieu",{sex:1,hair:1,hairCol:4,outfitCol:2}), W3=await bot("Thanh Tẩy","xuc_xich",{sex:0,hair:3,hairCol:0,outfitCol:5});
  const W=[W1,W2,W3], mo=b=>b.room.state.players?.get(b.room.sessionId), sid=b=>b.room.sessionId;
  const rowOf=(b,v)=>b.owned.list.find(x=>x.vohon===v)?.rowId;
  /** Đổi võ hồn ra trận của `b` sang võ hồn mã `v` (switch theo ô đội hình). */
  async function swTo(b,v){ const r=rowOf(b,v), slot=b.owned.team.indexOf(r); if(b.owned.active===r) return true; await waitFor(()=>!(mo(b)?.swCd>0),SWITCH_CD*1000+500);
    b.room.send("switch",{slot}); return await waitFor(()=>b.owned.active===r&&VOHON[mo(b).vh]?.id===v,2000); }
  /** Vào Lõi Tinh Đấu bằng hook warp (đi cổng ẩn), đứng ở trại cổng. */
  async function warpIn(b){ b.travel=null; await test(b,"warp",{mapId:LT,x:arrLT.x,y:arrLT.y}); await waitFor(()=>b.travel,3000);
    await b.room.leave(); await sleep(300); b.mapId=LT; await enter(b); await waitFor(()=>mo(b)&&b.owned&&b.bag); return b.room.state.mapId===LT; }
  C=W1;
  try{
    await waitFor(()=>W.every(b=>mo(b)&&b.owned&&b.bag));
    // W1 (cấp thấp) đi bộ vào cổng bờ hồ ở Nội địa.
    W1.travel=null; await test(W1,"warp",{mapId:ND,x:arrND.x,y:arrND.y}); await waitFor(()=>W1.travel,3000);
    await W1.room.leave(); await sleep(300); W1.mapId=ND; await enter(W1); await waitFor(()=>mo(W1)&&W1.owned&&W1.bag);
    ok(W1.room.state.mapId===ND&&Math.hypot(me().x-arrND.x,me().y-arrND.y)<1,`Nội địa: đứng ở bến bờ hồ (${me().x},${me().y})`);
    ok(await walk(1,0,()=>W1.portal?.name,5000)&&W1.portal.name==="Đi Lõi Tinh Đấu",`đi bộ tới cổng bờ hồ: ${JSON.stringify(W1.portal)}`);
    ok(W1.portal?.to===LT&&W1.portal.toName==="Lõi Tinh Đấu"&&same(W1.portal.level,[90,100])&&W1.portal.warn&&me().level<90,
      `hộp cổng: đề xuất cấp 90–100, cấp ${me().level} có cảnh báo đỏ (chặn mềm)`);
    await travelBy("Đi Lõi Tinh Đấu",LT);
    ok(Math.hypot(me().x-arrLT.x,me().y-arrLT.y)<1,`dưới cấp vẫn vào được, xuất hiện ở trại cổng Lõi Tinh Đấu: ${me().x},${me().y}`);
    await sleep(1500); ok([...W1.room.state.beasts.values()].every(b=>b.rank===3),"Lõi Tinh Đấu không có hồn thú thường (chỉ boss thế giới)");

    // Báo trước toàn server: C0 ở bản đồ khác nhận đếm ngược "Boss thế giới …".
    C0.boss=[]; W1.boss=[];
    await test(W1,"king",{kop:"warn",s:120,mapId:LT,boss:VIEN});
    ok(await waitFor(()=>C0.boss.some(m=>m.k==="warn"&&m.world)&&W1.boss.some(m=>m.k==="warn"),1500),
      `báo trước toàn server: C (${C0.room.state.mapId}) nhận "${C0.boss.find(m=>m.k==="warn")?.name} sau ${C0.boss.find(m=>m.k==="warn")?.in} giây ở ${C0.boss.find(m=>m.k==="warn")?.mapName}"`);
    ok(C0.boss.find(m=>m.k==="warn")?.here===false&&W1.boss.find(m=>m.k==="warn")?.here===true&&W1.boss.find(m=>m.k==="warn")?.name==="Boss thế giới Thái Thản Cự Viên","đếm ngược: C ở bản đồ khác, W1 ở đúng bản đồ");
    ok(await warpIn(W2)&&await waitFor(()=>W2.boss.some(m=>m.k==="warn"&&m.in<=120&&m.in>90),1500),`W2 vào Lõi giữa lúc chờ: nhận đếm ngược còn lại (${W2.boss.find(m=>m.k==="warn")?.in} giây)`);
    const bossB=()=>[...W1.room.state.beasts.values()].find(b=>b.rank===3);
    C0.boss=[];
    await test(W1,"king",{kop:"spawn",mapId:LT,boss:VIEN});
    ok(await waitFor(()=>bossB()&&C0.boss.some(m=>m.k==="spawn"&&m.world),2000),`xuất hiện: báo toàn server (C nhận "${C0.boss.find(m=>m.k==="spawn")?.name} … ${C0.boss.find(m=>m.k==="spawn")?.mapName}")`);
    let ki=await test(W1,"king"); const LR=ki.lair, inL=(x,y)=>x>=LR.x&&x<=LR.x+LR.w&&y>=LR.y&&y<=LR.y+LR.h, Y=100000;
    const base=Math.round(beastStats(Y).hp*WORLD.hp);
    ok(ki.bid&&ki.rank===3&&ki.boss===VIEN&&inL(ki.x,ki.y)&&ki.years===Y&&ki.base===base&&ki.maxHp===base&&Math.abs(ki.dmg-beastStats(Y).dmg*WORLD.dmg)<1e-6&&ki.phase===1&&ki.life>WORLD.lifeSecs-5,
      `${beastName(3,bossIndex(VIEN))} trên sàn đấu, ${ki.years} năm, máu x30 = ${ki.maxHp}, sát thương x${WORLD.dmg}, lặn xuống hồ sau ${Math.round(ki.life)} giây`);
    ok(await warpIn(W3)&&await waitFor(()=>W3.boss.some(m=>m.k==="here"&&m.world&&m.rageIn>WORLD.enrageSecs-60),1500),`W3 vào khi boss đang ở: nhận thời gian còn lại và đồng hồ nổi giận (${Math.round(W3.boss.find(m=>m.k==="here")?.rageIn??0)} giây)`);
    // Cấp 100 cho mọi võ hồn của 3 bot (chịu được sát thương boss 100.000 năm), giữ boss đứng yên, hoãn mọi cơ chế để thử từng cái.
    const R9=[400,700,1700,5000,12000,20000,50000,100000,100000];
    for(const b of W) for(const v of b.owned.list) await test(b,"set",{rowId:v.rowId,level:100,xp:0,rings:R9});
    await test(W1,"wmech",{m:"hold",secs:300}); await test(W1,"wmech",{m:"timers"});
    /** Đưa `b` vào sàn cạnh boss (thử nhiều chỗ quanh boss). */
    async function intoLair(b,dx,dy){ const t=bossB(); for(let k=0;k<24;k++){ const a=k*Math.PI/6, r=k<12?1:1.6, x=Math.round(t.x+dx*r*Math.cos(a)-dy*Math.sin(a)), y=Math.round(t.y+dx*r*Math.sin(a)+dy*Math.cos(a));
      if(!inL(x,y)) continue; await test(b,"goto",{x,y}); const q=mo(b); if(Math.hypot(q.x-x,q.y-y)<1) return true; } return false; }
    const outLair=async b=>{ await test(b,"goto",{x:arrLT.x,y:arrLT.y}); return !inL(mo(b).x,mo(b).y); };
    ok(await intoLair(W1,40,0)&&await intoLair(W2,-40,0)&&await intoLair(W3,0,30),"3 bot vào sàn đấu cạnh boss");
    await test(W1,"kdmg",{v:1}); ki=await test(W1,"king");
    ok(ki.engaged&&ki.n===3&&ki.parts.length===3&&ki.maxHp===Math.round(base*bossHpMult(3))&&bossB().parts===3,`W1 đánh: cả 3 người trong sàn thành người tham gia, máu tối đa ${base} -> ${ki.maxHp} (x${bossHpMult(3)})`);
    ok(await outLair(W3),"W3 ra khỏi sàn"); const r0=ki.hp/ki.maxHp; await test(W1,"etick",{s:WORLD.outSecs+1}); ki=await test(W1,"king");
    ok(ki.n===2&&!ki.parts.includes(sid(W3))&&ki.maxHp===Math.round(base*bossHpMult(2))&&Math.abs(ki.hp/ki.maxHp-r0)<0.01,`W3 ngoài sàn ${WORLD.outSecs} giây: bị loại, còn 2 người, máu ${ki.hp}/${ki.maxHp} (giữ tỉ lệ)`);
    ok(await intoLair(W3,0,30),"W3 quay lại sàn"); await test(W3,"kdmg",{v:1}); ki=await test(W1,"king"); ok(ki.n===3,`W3 đánh: lại ${ki.n} người`);

    // Điểm yếu hệ: võ hồn đúng hệ x2,5, hệ khác x0,5; W2 đổi sang võ hồn đúng hệ thì gây x2,5.
    const dealt=async(b,v)=>(await test(b,"kdmg",{v}))?.dealt;
    W1.boss=[]; await test(W1,"wmech",{m:"weak",he:"cuong_cong",secs:30});
    ok(await waitFor(()=>bossB().weak===1+HE_IDS.indexOf("cuong_cong")&&W1.boss.some(m=>m.k==="weak"&&m.he==="cuong_cong"),1000),"điểm yếu hệ Cường công hiện trên boss (BeastState.weak) và báo cả sàn");
    let d1=await dealt(W1,1000), d2=await dealt(W2,1000);
    ok(d1===1000*WORLD.weakMult&&d2===1000*WORLD.offMult,`điểm yếu Cường công: W1 (${VOHON[mo(W1).vh].name}, cường công) gây ${d1}, W2 (${VOHON[mo(W2).vh].name}, mẫn công) gây ${d2}`);
    await test(W1,"wmech",{m:"weak",he:"khong_che",secs:30}); d2=await dealt(W2,1000);
    ok(await swTo(W2,"lam_ngan_thao"),"W2 đổi sang Lam Ngân Thảo (khống chế)"); const d3=await dealt(W2,1000);
    ok(d2===1000*WORLD.offMult&&d3===1000*WORLD.weakMult,`điểm yếu Khống chế: W2 trước khi đổi gây ${d2}, sau khi đổi sang võ hồn đúng hệ gây ${d3}`);
    W1.boss=[]; await test(W1,"wmech",{m:"weak",he:"khong_che",secs:1});
    ok(await waitFor(()=>bossB().weak===0&&W1.boss.some(m=>m.k==="weakEnd"),2500)&&await dealt(W2,1000)===1000,"hết giờ điểm yếu: sát thương về bình thường");
    // Mốc máu 75%: tự hiện điểm yếu một hệ ngẫu nhiên.
    ki=await test(W1,"king"); W1.boss=[]; await test(W1,"wmech",{m:"timers",weakNext:0});
    await test(W1,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*WORLD.weakAt[0])+10}); await test(W1,"etick",{s:0.05});
    ok(await waitFor(()=>bossB().weak>0&&W1.boss.some(m=>m.k==="weak"),1500),`máu xuống dưới ${WORLD.weakAt[0]*100}%: lộ điểm yếu hệ ${W1.boss.find(m=>m.k==="weak")?.he} ${WORLD.weakSecs} giây`);
    await test(W1,"wmech",{m:"weak",secs:1}); await test(W1,"wmech",{m:"timers"}); ok(await waitFor(()=>bossB().weak===0,2500),"điểm yếu hết giờ trước khi thử Bá Thể");

    // Bá Thể: khiên 6% máu tối đa; cường công phá nhanh gấp 3; vỡ khiên thì phần dư vào máu; hết giờ chưa vỡ thì boss hồi máu.
    ki=await test(W1,"king"); W1.boss=[]; await test(W1,"wmech",{m:"armor"}); let ka=await test(W1,"king"); const sh0=ka.world.shield;
    ok(sh0===Math.round(ka.maxHp*DV.world.armor.pct)&&bossB().shield===sh0&&W1.boss.some(m=>m.k==="armor"),`Bá Thể: khiên ${sh0} (${DV.world.armor.pct*100}% máu tối đa ${ka.maxHp})`);
    await test(W2,"kdmg",{v:100}); let kb=await test(W1,"king"); await test(W1,"kdmg",{v:100}); let kc=await test(W1,"king");
    ok(kb.world.shield===sh0-100&&kc.world.shield===sh0-100-100*DV.world.armor.mult&&kc.hp===ka.hp,`W2 (khống chế) đánh 100 -> khiên −100; W1 (cường công) đánh 100 -> khiên −${100*DV.world.armor.mult}; máu không đổi (${kc.hp})`);
    const rest=kc.world.shield; W1.boss=[]; await test(W1,"kdmg",{v:Math.ceil(rest/DV.world.armor.mult)+500}); kc=await test(W1,"king");
    ok(kc.world.shield===0&&bossB().shield===0&&W1.boss.some(m=>m.k==="armorBreak")&&kc.hp<ka.hp&&ka.hp-kc.hp<=500+1,`W1 phá vỡ Bá Thể: phần dư vào máu (${ka.hp} -> ${kc.hp})`);
    await test(W1,"wmech",{m:"armor"}); ka=await test(W1,"king"); W1.boss=[]; await test(W1,"etick",{s:DV.world.armor.secs+0.5}); kc=await test(W1,"king");
    ok(kc.world.shield===0&&kc.hp===Math.min(kc.maxHp,ka.hp+ka.world.shield)&&W1.boss.some(m=>m.k==="armorEnd"),`Bá Thể hết ${DV.world.armor.secs} giây chưa vỡ: boss hồi ${kc.hp-ka.hp} máu`);

    // Tích lực Đại Địa Chấn: boss miễn khống chế; chỉ khống chế của võ hồn Khống chế mới tính, đủ 3 lần thì ngắt, boss Choáng.
    await test(W3,"status",{s:"root",secs:3}); ki=await test(W1,"king");
    ok(VOHON[mo(W3).vh].id==="xuc_xich"&&!ki.st.includes("root"),"boss thế giới không nhận khống chế (W3 Xúc Xích gây Trói: bị bỏ)");
    ok(await swTo(W1,"lam_ngan_thao"),"W1 đổi sang Lam Ngân Thảo (khống chế)");
    await test(W1,"wmech",{m:"hold",secs:0}); W1.boss=[]; await test(W1,"wmech",{m:"charge"}); ki=await test(W1,"king");
    ok(ki.charge&&ki.cast==="Đại Địa Chấn"&&W1.boss.some(m=>m.k==="charge"&&m.need===3)&&await waitFor(()=>bossB().chg,1000),
      `boss tích lực ${ki.cast} (${DV.world.charge.skill.warn} giây, cần ${DV.world.charge.need} lần khống chế; BeastState.chg bật)`);
    await test(W3,"status",{s:"stun"}); ki=await test(W1,"king"); const b0=ki.world.brk;
    await test(W1,"status",{s:"stun"}); await sleep(350); await test(W1,"status",{s:"root"}); await sleep(350); await test(W2,"status",{s:"silence"});
    ki=await test(W1,"king");
    ok(b0===0&&!ki.charge&&ki.st.includes("stun")&&W1.boss.some(m=>m.k==="broken")&&W1.boss.filter(m=>m.k==="brk").length===3&&await waitFor(()=>!bossB().chg,1000),
      `W3 (phụ trợ) khống chế không tính (${b0}/3); W1, W1, W2 (khống chế) 3 lần: ngắt, boss Choáng ${DV.world.charge.stun} giây`);
    // Không ngắt: cả sàn trúng Vết thương sâu (Phá giáp 3 tầng 30 giây); W3 đổi sang võ hồn phụ trợ đầy năng lượng tiên cơ thì thanh tẩy.
    await swTo(W3,"lam_ngan_thao");
    for(const b of W) await test(b,"set",{rowId:b.owned.active,level:100,xp:0,rings:R9});
    await test(W1,"wmech",{m:"hold",secs:0}); W1.boss=[]; W1.hurts=[]; await test(W1,"wmech",{m:"charge"});
    ok(await waitFor(()=>W1.boss.some(m=>m.k==="chargeHit"),DV.world.charge.skill.warn*1000+1500)&&await waitFor(()=>!bossB().chg,1000),"không ngắt kịp: Đại Địa Chấn trúng cả sàn (hết cờ tích lực)");
    await test(W1,"wmech",{m:"hold",secs:300}); await sleep(200);
    const armorBit=statusBit("armor");
    ok(W.every(b=>mo(b).st&armorBit)&&W1.hurts.length>0,`3 người trong sàn dính Vết thương sâu (${STATUS.armor.name} 3 tầng), W1 mất máu`);
    await sleep(1100); await test(W3,"energy",{v:TIEN_CO_MAX}); const sl=W3.owned.team.indexOf(rowOf(W3,"xuc_xich")); await waitFor(()=>!(mo(W3)?.swCd>0),SWITCH_CD*1000+500);
    W3.room.send("switch",{slot:sl}); await waitFor(()=>!(mo(W3).st&armorBit),2000);
    ok(!(mo(W3).st&armorBit)&&mo(W1).st&armorBit,`W3 đổi sang Xúc Xích (phụ trợ) đầy năng lượng: tiên cơ thanh tẩy Vết thương sâu; W1 chưa thanh tẩy vẫn còn`);

    // Nổi giận sau 10 phút: sát thương x3, nhanh hơn, chiêu toàn sàn Bạo Nộ. Nổi giận đúng lúc đang tích lực thì hủy tích lực (hết cờ chg,
    // client thôi nhắc ngắt).
    await test(W1,"wmech",{m:"hold",secs:0}); await test(W1,"wmech",{m:"charge"}); const chg0=await waitFor(()=>bossB().chg,1000);
    W1.boss=[]; W1.fxs=[]; await test(W1,"wmech",{m:"rage"}); await waitFor(()=>bossB().phase===2,1500); ki=await test(W1,"king");
    ok(chg0&&!ki.charge&&!bossB().chg,"nổi giận giữa lúc tích lực: hủy tích lực, BeastState.chg tắt");
    ok(ki.phase===2&&ki.world.rage&&Math.abs(ki.now-ki.dmg*WORLD.rageDmg)<1e-6&&Math.abs(ki.spd-WORLD.rageSpd)<1e-9&&W1.boss.some(m=>m.k==="rage")&&W1.fxs.some(f=>f.k==="roar"),
      `nổi giận (${Math.round(ki.life)} giây còn lại): sát thương ${ki.dmg.toFixed(0)} -> ${ki.now.toFixed(0)} (x${WORLD.rageDmg}), tốc độ x${ki.spd}`);
    await test(W1,"wmech",{m:"hold",secs:0}); W1.fxs=[]; await test(W1,"wmech",{m:"slam"});
    ok(await waitFor(()=>W1.fxs.some(f=>f.k==="teleHit"&&f.name==="Bạo Nộ"),(KING.roarSecs+WORLD_SLAM.warn)*1000+1500),"Bạo Nộ tung (sau tiếng gầm nổi giận)");
    await test(W1,"wmech",{m:"hold",secs:300});
    const tf=W1.fxs.find(f=>f.k==="tele"&&f.name==="Bạo Nộ"), th=W1.fxs.find(f=>f.k==="teleHit"&&f.name==="Bạo Nộ");
    ok(tf&&tf.shape==="line"&&tf.r===LR.w&&tf.w===LR.h&&tf.x===LR.x&&W.every(b=>th.hit.includes(sid(b))),`chiêu toàn sàn: vùng phủ đúng sàn đấu ${LR.w}×${LR.h}, cả 3 người trúng`);

    // Chia thưởng: W1 nhiều nhất (hồn hoàn đỏ 100.000 năm + rương), W2 từ 3% (hồn hoàn + rương), W3 dưới 3% (không thưởng).
    const chestOf=(b,id)=>qtyOf(b,chestCode(id)), ringsY=b=>(b.bag?.items??[]).filter(i=>i.code===RING_ITEM).map(i=>i.years);
    for(const b of W) await test(b,"set",{rowId:b.owned.active,level:100,xp:0,rings:R9});
    ki=await test(W1,"king"); const prev2=(ki.list.find(x=>x.id===sid(W2))?.pct??0)/100*ki.total, want2=Math.floor(0.1*(ki.total+ki.hp)-prev2);
    if(want2>0) await test(W2,"kdmg",{v:want2});
    const drops0=W1.room.state.drops.size; W1.boss=[]; C0.chats=[]; for(const b of W) b.logs=[];
    await test(W1,"kdmg",{v:1e9});
    ok(await waitFor(()=>!bossB()&&W1.boss.some(m=>m.k==="down"),2000),"hạ boss thế giới");
    const dn=W1.boss.find(m=>m.k==="down"), p1=dn?.list.find(x=>x.id===sid(W1))?.pct, p2=dn?.list.find(x=>x.id===sid(W2))?.pct, p3=dn?.list.find(x=>x.id===sid(W3))?.pct;
    ok(dn?.top===mo(W1).name&&p1>p2&&p2>=3&&p3<3,`đóng góp: W1 ${p1}%, W2 ${p2}%, W3 ${p3}%`);
    ok(await waitFor(()=>chestOf(W1,VIEN)===1&&chestOf(W2,VIEN)===1,2500)&&ringsY(W1).includes(WORLD_RING.top)
      &&ringsY(W2).some(y=>y===WORLD_RING.top||(y>=WORLD_RING.black[0]&&y<=WORLD_RING.black[1])),
      `W1 nhận hồn hoàn đỏ ${formatYears(WORLD_RING.top)} và rương; W2 nhận hồn hoàn ${formatYears(ringsY(W2).at(-1)??0)} và rương (${W1.logs.find(t=>/Nhận hồn hoàn/.test(t))})`);
    ok(chestOf(W3,VIEN)===0&&!ringsY(W3).length&&/cần từ 3% mới nhận thưởng/.test(W3.logs.join("\n")),`W3 dưới 3%: không nhận hồn hoàn, rương ("${W3.logs.find(t=>/cần từ/.test(t))}")`);
    ok(W1.room.state.drops.size===drops0,"boss thế giới không rơi hồn hoàn xuống đất (vào thẳng túi)");
    ok(await waitFor(()=>C0.chats.some(m=>/Boss thế giới Thái Thản Cự Viên ở Lõi Tinh Đấu đã bị hạ/.test(m.text)),1500),`toàn server được báo: "${C0.chats.find(m=>/bị hạ/.test(m.text))?.text}"`);
    let cl=await test(W1,"claims"); ok(cl.w===1&&cl.wdb===1&&cl.n===0&&cl.db===0,`lượt boss thế giới hôm nay ${cl.w}/${WORLD.daily} (DB ${cl.wdb}), lượt thú vương không đổi (${cl.n})`);

    // Mở rương: hồn cốt 100.000 năm loài gốc, mảnh UR, hồn hạch 5–6★ bộ bất kỳ.
    { const it=()=>W1.bag.items.find(i=>i.code===chestCode(VIEN)), bn=bonesOf(W1).length, ur0=qtyOf(W1,shardCode("hao_thien_chuy")), cc0=(W1.bag.items.filter(i=>i.code===CORE_ITEM)).length;
      await test(W1,"chest",{bone:0,i:0,n:2,s:1}); const l=W1.logs.length; W1.room.send("open",{id:it().id}); await waitFor(()=>W1.logs.length>l&&chestOf(W1,VIEN)===0,1500); await sleep(150);
      const nb=bonesOf(W1).find(i=>i.years===Y&&i.stats?.beast===VIEN&&i.stats?.slot===BONE_SLOTS[1].id), nc=W1.bag.items.filter(i=>i.code===CORE_ITEM).slice(cc0);
      ok(chestOf(W1,VIEN)===0&&bonesOf(W1).length===bn+1&&nb&&qtyOf(W1,shardCode("hao_thien_chuy"))===ur0+2&&nc.length===1&&nc[0].stars>=WORLD_CHEST.stars[0]&&nc[0].stars<=WORLD_CHEST.stars[1],
        `mở rương boss thế giới: ${W1.logs.at(-1)}`);
      await test(W1,"chest",{off:1}); }

    // Boss của ngày hôm sau (luân phiên): Thiên Thanh Ngưu Mãng; hôm nay đã nhận thưởng thì W1 vẫn đánh được nhưng không nhận gì.
    W1.logs=[]; await test(W1,"king",{kop:"spawn",mapId:LT,boss:MANG}); await waitFor(()=>bossB(),1500); ki=await test(W1,"king");
    ok(ki.boss===MANG&&ki.rank===3&&ki.maxHp===base,`boss thế giới thứ hai: ${beastName(3,bossIndex(MANG))} (${ki.skills?.join(", ")})`);
    await test(W1,"wmech",{m:"hold",secs:300}); await test(W1,"wmech",{m:"timers"});
    await intoLair(W1,40,0); await intoLair(W2,-40,0); await test(W1,"kdmg",{v:1});
    ok(/Hôm nay đã hết lượt nhận thưởng boss thế giới/.test(W1.logs.join("\n")),`vào giao chiến khi đã nhận thưởng hôm nay: nhắc "${W1.logs.find(t=>/hết lượt/.test(t))}"`);
    // Du Thủy: lặn không nhận sát thương; nổi lên chỗ khác, lộ điểm yếu Mẫn công.
    const pos0=[bossB().x,bossB().y]; W1.boss=[]; await test(W1,"wmech",{m:"dive"});
    ok(await waitFor(()=>bossB().dive,1000)&&await dealt(W1,1000)===0&&W1.boss.some(m=>m.k==="dive"),"Du Thủy: boss lặn xuống hồ, đánh không mất máu");
    await test(W1,"wmech",{m:"surface"});
    ok(await waitFor(()=>!bossB().dive&&bossB().weak===1+HE_IDS.indexOf("man_cong"),1000)&&Math.hypot(bossB().x-pos0[0],bossB().y-pos0[1])>=40&&inL(bossB().x,bossB().y),
      `nổi lên chỗ khác trong sàn (${pos0.map(Math.round)} -> ${Math.round(bossB().x)},${Math.round(bossB().y)}), lộ điểm yếu Mẫn công ${DM.world.dive.weakSecs} giây`);
    ok(await swTo(W2,"u_minh_linh_mieu")&&await dealt(W2,1000)===1000*WORLD.weakMult,"W2 đổi lại U Minh Linh Miêu (mẫn công): gây x2,5 lúc boss vừa nổi lên");
    // Thanh Lân Độc Vụ: độc toàn sàn (Trúng độc nhiều tầng 30 giây).
    for(const b of [W1,W2]) await intoLair(b,b===W1?40:-40,0);
    await test(W1,"wmech",{m:"hold",secs:0}); W1.boss=[]; await test(W1,"wmech",{m:"miasma"});
    ok(await waitFor(()=>W1.fxs.some(f=>f.k==="teleHit"&&f.name==="Thanh Lân Độc Vụ"),DM.world.miasma.skill.warn*1000+1500),"Thanh Lân Độc Vụ tung");
    await test(W1,"wmech",{m:"hold",secs:300}); await sleep(150);
    ok([W1,W2].every(b=>mo(b).st&statusBit("poison")),"người trong sàn trúng độc toàn sàn (Vết thương sâu)");
    W1.logs=[]; const c1=chestOf(W1,MANG); await test(W1,"kdmg",{v:1e9}); await waitFor(()=>!bossB(),1500); await sleep(500);
    ok(chestOf(W1,MANG)===c1&&!W1.logs.some(t=>/Nhận hồn hoàn/.test(t))&&/hết lượt nhận thưởng boss thế giới/.test(W1.logs.join("\n")),`đã nhận thưởng hôm nay: hạ boss thứ hai không nhận thêm (${WORLD.daily} lần/ngày)`);
    // Sang ngày mới (00:00 giờ Việt Nam): lượt đặt lại.
    const dy=await test(W1,"day",{shift:1}); cl=await test(W1,"claims"); W1.logs=[];
    await test(W1,"king",{kop:"spawn",mapId:LT,boss:VIEN}); await waitFor(()=>bossB(),1500); await test(W1,"wmech",{m:"hold",secs:300}); await test(W1,"wmech",{m:"timers"});
    await intoLair(W1,40,0); await test(W1,"kdmg",{v:1}); await test(W1,"kdmg",{v:1e9});
    ok(cl.w===0&&await waitFor(()=>chestOf(W1,VIEN)===1,2500)&&/lượt 1\/1/.test(W1.logs.join("\n")),`ngày ${dy.day}: lượt về 0, hạ boss lại nhận thưởng (1/1)`);
    await test(W1,"day",{shift:0});

    // 15 phút không ai hạ: lặn xuống hồ, toàn server được báo.
    await test(W1,"king",{kop:"spawn",mapId:LT,boss:VIEN}); await waitFor(()=>bossB(),1500);
    C0.chats=[]; W1.boss=[]; await test(W1,"etick",{s:WORLD.lifeSecs});
    ok(await waitFor(()=>!bossB()&&W1.boss.some(m=>m.k==="leave"&&m.world)&&C0.chats.some(m=>/lặn xuống hồ/.test(m.text)),1500),`hết ${WORLD.lifeSecs/60} phút: boss lặn xuống hồ ("${C0.chats.find(m=>/lặn xuống hồ/.test(m.text))?.text}")`);

    // Đăng xuất ở Lõi Tinh Đấu: lần sau vào ở bờ hồ Nội địa (điểm arrive của cổng về), túi đồ còn nguyên.
    const bk=bagKey(W2); await W2.room.leave(); await sleep(500);
    const m2=await post("/api/me",{token:W2.token}); W2.mapId=m2.mapId; await enter(W2); await waitFor(()=>mo(W2)&&W2.bag);
    ok(m2.mapId===ND&&W2.room.state.mapId===ND&&Math.hypot(mo(W2).x-arrND.x,mo(W2).y-arrND.y)<1&&bagKey(W2)===bk,
      `đăng xuất ở Lõi Tinh Đấu: vào lại ở bờ hồ Nội địa (${mo(W2).x},${mo(W2).y}), túi còn nguyên (rương ${chestOf(W2,VIEN)}, hồn hoàn ${ringsY(W2).join(", ")} năm)`);
  } finally { C=C0; for(const b of W) await b.room.leave().catch(()=>{}); }
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
  const ch=questChain(QUEST_STARTER), mapObjs=id=>JSON.parse(readFileSync(mapUrl(id),"utf8")).layers.flatMap(l=>l.objects??[]);
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
    // Hook beast trả id (con mới đầu tiên chưa chắc là nó: hồn thú hoang ở Bãi tập sinh lại cùng lúc thì vòng đánh chờ nhầm con).
    const r=await test(D,"beast",{dx:0,dy:0}); const fresh=()=>r?.bid&&st.beasts.has(r.bid)?r.bid:[...st.beasts.keys()].find(k=>!ids.has(k)); await waitFor(fresh,1000); const bid=fresh();
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
  await sleep(SWITCH_CD*1000+200); await test(D,"clear"); const killed=await killOne(), tk=Date.now();
  await switchSlot(other()); ok(await waitFor(()=>D.quest.prog[0]===1),`đổi võ hồn khi đang giao chiến: ${progOf()} (${D.logs.slice(-3).join(" | ")})`+
    (D.quest.prog[0]===1?"":` [hạ được ${killed}, đổi sau ${Date.now()-tk} ms, swCd ${D.room.state.players.get(D.room.sessionId)?.swCd}]`));
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
  const ar7=mapObjs("tinh_dau_ngoai_vi").find(o=>o.type==="arrive"&&o.name==="tu_nac_dinh_thanh"); await warp("tinh_dau_ngoai_vi",ar7.x,ar7.y); ok(D.quest.prog[0]===1,`vào Tinh Đấu Ngoại vi: ${progOf()}`);
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
  // Hồi chiêu đổi đếm theo nhịp server (server bận thì chậm hơn đồng hồ thật): chờ swCd về 0 trong state rồi mới đổi, không thì bị từ chối.
  async function switchSlot(slot){ await waitFor(()=>!(D.room.state.players.get(D.room.sessionId)?.swCd>0),SWITCH_CD*1000+1500);
    const n=D.ownedMsgs; D.room.send("switch",{slot}); await waitFor(()=>D.ownedMsgs>n,1500); await sleep(80); }
}

/**
 * Nhiệm vụ hằng ngày (khảo hạch Sử Lai Khắc của Phất Lan Đức, mục 5.8): hàm thuần (mã chuỗi `daily:<yyyymmdd>:<i>`, bộ bài ổn định
 * theo ngày, bài 1 săn, các bài sau không trùng, mẫu hợp lệ, parseQuest, hồn thú / bản đồ hợp cấp, chỉ đường giữa các bản đồ); tài
 * khoản mới: 3 bài chưa nhận, ở bản đồ khác không nhận được. Ở Thiên Đấu Thành (hook `daily {shift}` chọn ngày có bài đấu hồn và bài
 * nộp đồ): đứng xa bị từ chối, nhận cả 3 bài; nộp đồ đếm theo túi (đồ đang gắn không tính); một trận Đại Đấu Hồn Trường thật với bot
 * thứ hai (tiến độ ghi trong phòng sân đấu, mang về bản đồ); hồn thú không hợp cấp không tính, hợp cấp thì tính; thoát vào lại giữ
 * tiến độ; trả bài: thưởng đúng, đồ nộp bị trừ, túi đầy thì từ chối và giữ nguyên túi, trả lần hai bị từ chối; sang ngày mới (hook
 * `day`) thì đổi bộ bài, bài ngày cũ không trả được.
 */
async function dailyTest(){
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
  if(!(await test(D,"ping"))?.enabled){ console.log("  ⚠ bỏ qua phần khảo hạch (cần hook warp, daily, beast, give, afast…): bật server bằng GAME_TEST=1"); await D.room.leave(); return; }
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

/**
 * 7.2 Đại Đấu Hồn Trường: hàm thuần (Elo, cửa sổ ghép nới dần, ghép Elo gần nhất); 3 tài khoản mới ở Thiên Đấu Thành (từ BĐ6a; 7.2 là
 * Nặc Đinh Thành): xếp hàng ở NPC
 * (đứng xa / đang giao chiến bị từ chối, hủy; đang niệm đi cổng thì không bị ghép, đi cổng xong thì ra khỏi hàng chờ), ghép theo Elo gần
 * nhất, vào sân (cả đội đầy, chưa đánh được lúc đếm ngược, message ngoài trận bị chặn); trận 1 rời sân = thua; trận 2 đạn hồn kỹ và đánh
 * thường trúng đối thủ (Trúng độc), hạ hết đội (hook down) -> thắng; trận 3 không vào sân = thua; trận 4 hết giờ so % sinh lực. Mỗi trận:
 * Elo đúng eloAfter, thưởng người thắng vào túi (lưu DB), kinh nghiệm / đồ / đội hình không đổi, hết giờ kết quả thì về đúng bản đồ và vị
 * trí cũ. Bảng xếp hạng đúng thứ tự (kể cả bằng Elo thì nhiều trận thắng trước), lượt thưởng còn lại.
 * 9.7 chống dàn xếp: hàm thuần (tránh ghép lại đối thủ vừa đấu); hai tài khoản mới đấu nhau 4 trận liền (không còn ai khác nên vẫn
 * ghép lại): 3 trận đầu tính Elo và thưởng, trận 4 giao hữu (báo trước ở ArenaState.friendly; không đổi Elo / thành tích, không
 * thưởng, không mất lượt thắng có thưởng); sang ngày mới (hook day trong sân) lại tính Elo; có người thứ ba trong cửa sổ thì không ghép
 * lại đối thủ vừa đấu.
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
  ok(MAPS[ARENA_MAP]?.kind==="arena"&&npcDef("dau_hon_truong")?.role==="arena"&&!!npcSpot(AT,"dau_hon_truong")&&!npcSpot("nac_dinh_thanh","dau_hon_truong"),
    `sân đấu riêng (kind arena), NPC Đại Đấu Hồn Trường ở ${MAPS[AT].name} (BĐ6a), không còn ở Nặc Đinh Thành`);
  let err=""; try{ const r=await new Client(WS).joinOrCreate("map",{mapId:ARENA_MAP}); await r.leave(); }catch(e){ err=String(e?.message??e); }
  ok(/không tồn tại/.test(err),`không mở được phòng bản đồ trên sân đấu (${err})`);
  err=""; try{ const r=await new Client(WS).create("arena",{matchId:"khong_co"}); await r.leave(); }catch(e){ err=String(e?.message??e); }
  ok(/không tồn tại/.test(err),`client không tự mở được trận đấu (${err})`);

  const E=await bot("Đấu sĩ","bich_lan_xa_hoang",{sex:1,hair:1,hairCol:2,outfitCol:0});
  const F=await bot("Võ sĩ","u_minh_linh_mieu",{sex:0,hair:2,hairCol:4,outfitCol:5});
  const G=await bot("Kiếm khách","hoa_anh",{sex:0,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(E,"ping"))?.enabled){ console.log("  ⚠ bỏ qua trận đấu (cần hook warp, aelo, down, afast): bật server bằng GAME_TEST=1"); for(const b of [E,F,G]) await b.room.leave(); return; }
  const ns=npcSpot(AT,"dau_hon_truong"), meOf=b=>b.room.state.players?.get(b.room.sessionId);
  const at=(b,dx=0)=>test(b,"goto",{x:ns.x+dx,y:ns.y+16});
  /** Hook warp sang Thiên Đấu Thành cạnh NPC (transaction đi cổng), rồi vào phòng mới như đi cổng thật. */
  async function warpTown(b){
    b.travel=null; b.room.send("test",{op:"warp",mapId:AT,x:ns.x,y:ns.y+16});
    ok(await waitFor(()=>b.travel?.mapId===AT,4000),`${b.name}: tới ${MAPS[AT].name}`);
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
  await test(E,"goto",{x:34*16,y:24*16}); let t=await aop(E,"queue"); ok(/lại gần/.test(t)&&!E.aq.on,`đứng xa NPC: không xếp hàng được (${t})`);
  await at(E); await test(E,"hurt",{pct:5}); t=await aop(E,"queue"); ok(/giao chiến/.test(t)&&!E.aq.on,`vừa bị đánh: không xếp hàng được (${t})`);
  // Đang trong tổ đội (7.1): không xếp hàng được; rời tổ đội thì được.
  E.room.send("party",{op:"invite",name:F.name}); await sleep(300); F.room.send("party",{op:"accept",name:E.name}); await sleep(400);
  await test(E,"rest"); t=await aop(E,"queue"); ok(/tổ đội/.test(t)&&!E.aq.on,`đang trong tổ đội: không xếp hàng được (${t})`);
  E.room.send("party",{op:"leave"}); await sleep(400);
  t=await aop(E,"queue"); ok(E.aq.on&&E.aq.elo===ARENA.startElo,`cạnh NPC: đang tìm trận, Elo khởi đầu ${E.aq.elo} (${t})`);
  t=await aop(E,"queue"); ok(/rồi/.test(t)&&E.aq.on,`xếp hàng lần hai: báo đang tìm (${t})`);
  t=await aop(E,"cancel"); ok(!E.aq.on&&/hủy/.test(t),`hủy xếp hàng (${t})`);
  // Đang niệm đi cổng: không bị ghép; đi cổng xong thì ra khỏi hàng chờ.
  await at(F); await aop(F,"queue"); await test(F,"goto",{x:40*16,y:54.5*16});
  F.travel=null; F.room.send("travel",{portal:"Về Nặc Đinh Thành"}); await sleep(100); await aop(E,"queue");
  ok(await waitFor(()=>F.travel?.mapId,4000),"F đi qua cổng trong lúc đang xếp hàng");
  ok(!found(E)&&!found(F),"đang niệm đi cổng: không bị ghép trận");
  await F.room.leave(); await sleep(300); await back(F);
  t=await aop(F,"cancel"); ok(F.mapId==="nac_dinh_thanh"&&!/hủy/.test(t)&&!F.aq.on,`F sang ${MAPS[F.mapId].name}: đã ra khỏi hàng chờ khi đi cổng`);
  t=await aop(E,"cancel"); ok(/hủy/.test(t),"E vẫn trong hàng chờ một mình, hủy");
  await warpTown(F);

  // ---- Trận 1: ghép theo Elo gần nhất (E 1000 gặp G 1040, không gặp F 1500); G rời sân lúc đếm ngược = thua ----
  // G (Hỏa Ảnh, lưu phái Thiêu đốt 8.1b) có đủ 7 hồn hoàn để thử Võ Hồn Chân Thân trong sân.
  await test(G,"set",{rowId:G.owned.active,level:70,xp:0,rings:Array(CHAN_THAN_RING).fill(100)});
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
  // Chân Thân lưu phái Thiêu đốt (8.1b) khi giao đấu: Hỏa Ảnh Chân Thân nổ quanh thân trúng E (Thiêu đốt, Choáng, Dễ thương).
  await test(E,"afast",{s:0}); await waitFor(()=>E.room.state.phase==="fight",2000);
  const eP=()=>G.room.state.players.get(E.room.sessionId); await test(G,"goto",{x:eP().x+30,y:eP().y}); const hpE=eP().hp;
  G.room.send("chanthan");
  ok(await waitFor(()=>meOf(G).ava>0&&eP().hp<hpE&&(eP().st&statusBit("burn"))&&(eP().st&statusBit("stun")),2000),
    `${chanThanOf("hoa_anh").name} trong sân: biến hình, trúng E ${hpE} → ${eP().hp}, Thiêu đốt + Choáng`);
  await G.room.leave();
  ok(await waitFor(()=>endOf(E),3000),"G rời sân giữa trận: trận có kết quả ngay");
  let m=checkEnd(E,1,"leave",1000,1040,"Trận 1");
  await checkReward(E,m,bagE,ARENA.dailyWins-1);
  const eloG1=eloAfter(1040,1000,0);
  await sleep(300); await back(G);
  ok(G.room.state.mapId===AT&&Math.hypot(meOf(G).x-posG[0],meOf(G).y-posG[1])<1,`G rời sân: về ${MAPS[AT].name} đúng chỗ cũ`);
  const bagE1=bagKey(E);
  await kickBack(E);
  ok(E.room.state.mapId===AT&&Math.hypot(meOf(E).x-posE[0],meOf(E).y-posE[1])<1,`E về ${MAPS[AT].name} đúng chỗ cũ (${meOf(E).x.toFixed(0)},${meOf(E).y.toFixed(0)})`);
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
  // Dự đoán chuyển động (#50) trong sân: phòng mới nên số thứ tự input bắt đầu lại từ 0 (ở bản đồ E đã bị hook goto tăng); input kèm `s` được áp.
  ok(meOf(E).seq===0,`vào sân: số thứ tự input đặt lại (seq ${meOf(E).seq})`);
  const x0=meOf(E).x; E.room.send("input",{x:dir,y:0,s:1});
  ok(await waitFor(()=>meOf(E).seq===1&&meOf(E).seqT>0&&Math.abs(meOf(E).x-x0)>2,1500),`input {s:1} trong sân: server ghi seq 1, seqT ${meOf(E).seqT.toFixed(2)} giây, đi ${Math.abs(meOf(E).x-x0).toFixed(0)} pixel`);
  E.room.send("input",{x:0,y:0,s:2}); await waitFor(()=>meOf(E).seq===2,1500);
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
  ok(G.room.state.mapId===AT,`G (đã ghép mà không vào sân) vẫn ở ${MAPS[AT].name}`);
  await kickBack(F);
  const eloF3=m.elo1, eloG4=eloAfter(eloG3,eloF2,0);

  // 8.1c (lưu phái Cảm điện): E đưa Lam Điện Bá Vương Long và Yêu Hồ đủ 10 hồn hoàn vào đội, mang tuyệt kỹ ở ô U.
  const LD="lam_dien_ba_vuong_long", YH="yeu_ho";
  for(const vo of [LD,YH]) await test(E,"grant",{vohon:vo});
  const rowOf=vo=>E.owned.list.find(v=>v.vohon===vo).rowId, rowLD=rowOf(LD), rowYH=rowOf(YH);
  // Cấp thấp, hồn hoàn 10 năm: chỉ cần tuyệt kỹ trúng; sau tuyệt kỹ Chu Hoàng (8.1d) đội F không được gục hết (trận 4 thắng theo %).
  for(const r of [rowLD,rowYH]) await test(E,"set",{rowId:r,level:40,xp:0,rings:Array(MAX_RINGS).fill(10)});
  await test(E,"rest",{s:TEAM_COMBAT_SECS+1});
  for(const r of [rowLD,rowYH]){ n0=E.ownedMsgs; E.room.send("loadout",{rowId:r,skills:[9,4,5,-1]}); await waitFor(()=>E.ownedMsgs>n0,1500); await sleep(80); }
  ok([rowLD,rowYH].every(r=>same(E.owned.list.find(v=>v.rowId===r)?.skills,[9,4,5,-1])),"ở thành: Lam Điện Bá Vương Long, Yêu Hồ mang tuyệt kỹ ở ô U");

  // ---- Trận 4: E gặp F, hết giờ: E còn đủ sinh lực, F mất một nửa -> E thắng theo % ----
  // 8.1d trong sân: E ra trận Tử Vong Chu Hoàng (10 hồn hoàn) mang tuyệt kỹ Tử Vong Thiên Võng ở ô U.
  await test(E,"grant",{vohon:"tu_vong_chu_hoang"}); const rowC=E.owned.list.find(v=>v.vohon==="tu_vong_chu_hoang").rowId, ultC=ringSkill("tu_vong_chu_hoang",9);
  await test(E,"set",{rowId:rowC,level:100,xp:0,rings:Array(10).fill(100)}); await test(E,"rest",{s:TEAM_COMBAT_SECS+1});
  await sendTeam(E,[rowC,0,0,0]); await sendTeam(E,[rowC,rowLD,rowYH,0]); n0=E.ownedMsgs; E.room.send("loadout",{rowId:rowC,skills:[9,0,1,2]}); await waitFor(()=>E.ownedMsgs>n0,1500); await sleep(80);
  ok(E.owned.active===rowC&&same(E.owned.list.find(v=>v.rowId===rowC)?.skills,[9,0,1,2]),`ở thành: E ra trận Tử Vong Chu Hoàng, ${ultC.name} ở ô U`);
  await aop(E,"queue"); await aop(F,"queue");
  ok(await waitFor(()=>found(E)&&found(F)&&found(E).roomId===found(F).roomId,3000),`ghép E (${E.aq.elo}) với F (${F.aq.elo})`);
  await enterArena(E); await enterArena(F); await waitFor(()=>E.room.state.phase==="ready",3000);
  await test(E,"afast",{s:0}); await waitFor(()=>E.room.state.phase==="fight",2000);
  // Tuyệt kỹ trúng đối thủ: sát thương và trạng thái có trên hồn sư (Trói, Trúng độc, Câm lặng, Cảm điện); kéo chỉ áp lên hồn thú.
  {
    const d4=sides(E).findIndex(s=>s.sid===sid(E))===0?1:-1; await test(E,"goto",{x:fv().x-d4*90,y:fv().y}); await sleep(150); const hpF=fv().hp, fx0=fv().x, bf=F.fxs.length; E.room.send("skill",{i:0});
    const has=s=>(fv().st&statusBit(s))!==0;
    ok(await waitFor(()=>fv().hp<hpF&&["root","poison","silence","shock"].every(has),2000)&&Math.abs(fv().x-fx0)<2
      &&await waitFor(()=>F.fxs.slice(bf).some(f=>f.k==="ult"&&f.id===sid(E)),800),
      `${ultC.name} (8.1d) trong sân: trúng F ${hpF} → ${fv().hp}, Trói + Trúng độc + Câm lặng + Cảm điện, F không bị kéo, F thấy fx tuyệt kỹ`);
  }
  // 8.1c trong sân: đổi sang Lam Điện Bá Vương Long (ô U còn hồi chiêu chung của tuyệt kỹ vừa tung: đặt lại bằng hook ready).
  await waitFor(()=>meOf(E).swCd===0,3500); E.room.send("switch",{slot:E.owned.team.indexOf(rowLD)});
  ok(await waitFor(()=>E.owned.active===rowLD,1500),"E đổi sang Lam Điện Bá Vương Long trong sân"); await test(E,"ready");
  // 8.1c trong sân: tuyệt kỹ Lam Điện (sét tìm mục tiêu Cảm điện ngoài vùng) trúng F đang Cảm điện ở xa; tuyệt kỹ Yêu Hồ gây Câm lặng,
  // Làm chậm lên F, còn Mê hoặc / Mị hoặc chỉ áp lên hồn thú (5.9).
  {
    const f4=()=>E.room.state.players.get(F.room.sessionId), ldU=ringSkill(LD,9), yhU=ringSkill(YH,9), dx=meOf(E).x<f4().x?-1:1;
    await test(F,"pst",{s:"shock",secs:20}); await waitFor(()=>f4().st&statusBit("shock"),1000);
    // Đếm đòn trúng F bằng tin dmg (F.hurts): võ hồn của F có thể gục và tự đổi nên không so sinh lực.
    await test(E,"goto",{x:f4().x+dx*(ldU.r+50),y:f4().y}); const dd=Math.hypot(meOf(E).x-f4().x,meOf(E).y-f4().y); E.fxs=[]; F.hurts=[]; E.room.send("skill",{i:0});
    ok(await waitFor(()=>F.hurts.filter(m=>m.v<0).length>=ldU.n&&(f4().st&statusBit("stun")),3000)&&E.fxs.some(f=>f.k==="zap"),
      `${ldU.name} trong sân: F Cảm điện cách ${dd.toFixed(0)} (ngoài vùng ${ldU.r}, trong ${ldU.shockR}) vẫn trúng sét ${F.hurts.filter(m=>m.v<0).length}/${ldU.n} đợt (${F.hurts.map(m=>-m.v).join("/")}), Choáng, fx zap`);
    await waitFor(()=>meOf(E).swCd===0,3500); E.room.send("switch",{slot:E.owned.team.indexOf(rowYH)});
    ok(await waitFor(()=>E.owned.active===rowYH,1500),"E đổi sang Yêu Hồ trong sân");
    // Ô U còn hồi chiêu chung của tuyệt kỹ Lam Điện (hồi chiêu theo ô khi đổi võ hồn, 8.1a): đặt lại bằng hook ready.
    await test(E,"ready"); await test(E,"goto",{x:f4().x+dx*40,y:f4().y}); F.hurts=[]; E.room.send("skill",{i:0});
    ok(await waitFor(()=>F.hurts.some(m=>m.v<0)&&(f4().st&statusBit("silence"))&&(f4().st&statusBit("slow")),2000)&&!(f4().st&(statusBit("charm")|statusBit("allure"))),
      `${yhU.name} trong sân: trúng F ${F.hurts.map(m=>-m.v).join("/")}, Câm lặng + Làm chậm; Mê hoặc chỉ áp lên hồn thú`);
  }
  await test(F,"hurt",{pct:50}); await test(E,"afast",{s:0});
  ok(await waitFor(()=>endOf(E)&&endOf(F),3000),"hết giờ: trận có kết quả");
  m=checkEnd(E,1,"time",eloE3,eloF3,"Trận 4"); checkEnd(F,0,"time",eloF3,eloE3,"Trận 4");
  // Tin "arena end" đi riêng với bản vá state (winner, pct): chờ state thay vì đọc ngay.
  const pctOf=b=>sides(E).find(s=>s.sid===sid(b))?.pct;
  ok(await waitFor(()=>E.room.state.winner===sides(E).findIndex(s=>s.sid===sid(E))&&pctOf(E)===1&&pctOf(F)<1,1500),
    `so sinh lực cả đội: E ${Math.round(pctOf(E)*100)}%, F ${Math.round(pctOf(F)*100)}% [winner ${E.room.state.winner}, pct E ${pctOf(E)}, F ${pctOf(F)}]`);
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

  // ---- 9.7 Chống dàn xếp ----
  console.log("[9.7] Chống dàn xếp Đại Đấu Hồn Trường: trận tính Elo theo cặp mỗi ngày, tránh ghép lại đối thủ vừa đấu");
  const R=ARENA.rematchSecs, Q=l=>JSON.stringify(arenaPairs(l.map(([id,elo,wait=0,last])=>({id,elo,wait,last}))));
  ok(ARENA.pairDaily===3&&R===60&&arenaRanked(ARENA.pairDaily)&&!arenaRanked(ARENA.pairDaily+1),
    `ARENA.pairDaily = ${ARENA.pairDaily} trận tính Elo mỗi cặp mỗi ngày, trận thứ ${ARENA.pairDaily+1} giao hữu; tránh ghép lại trong ${R} giây chờ đầu`);
  ok(Q([["a",1000,0,"b"],["b",1000,0,"a"],["c",1050]])==='[["a","c"]]',"a, b vừa đấu nhau: a gặp c (Elo xa hơn nhưng trong cửa sổ) thay vì b");
  ok(Q([["a",1000,0],["b",1000,0,"a"],["c",1050]])==='[["a","c"]]',"chỉ một bên ghi đối thủ trước cũng tránh");
  ok(Q([["a",1000,0,"b"],["b",1000,0,"a"]])==='[["a","b"]]'&&Q([["a",1000,0,"b"],["b",1000,0,"a"],["c",1500]])==='[["a","b"]]',
    "không còn ai khác trong cửa sổ: ghép lại");
  ok(Q([["a",1000,R,"b"],["b",1000,R,"a"],["c",1050]])==='[["a","b"]]'&&Q([["a",1000,R,"b"],["b",1000,R-1,"a"],["c",1050]])==='[["a","c"]]',
    `cả hai đã chờ đủ ${R} giây: ghép lại được; một bên chưa đủ thì vẫn tránh`);
  ok(Q([["a",1000,0,"b"],["b",1000,0,"a"],["c",1050,0,"d"],["d",1050,0,"c"]])==='[["a","c"],["b","d"]]',"hai cặp vừa đấu: đổi chéo đối thủ");

  const H=await bot("Song đấu A","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:3,outfitCol:1});
  const I=await bot("Song đấu B","hoa_anh",{sex:1,hair:2,hairCol:1,outfitCol:3});
  for(const b of [H,I]) await warpTown(b);
  const fresh=(b,n,k)=>b.arena.slice(n).filter(m=>m.k===k).at(-1);
  /** H và I xếp hàng (không còn ai khác), vào sân, I gục cả đội: H thắng. Trả tin "end" mới của H và I. `day` = hook day trong sân. */
  async function duel(k,day=0){
    const nH=H.arena.length, nI=I.arena.length;
    await at(H,-12); await at(I,12); await aop(H,"queue"); await aop(I,"queue");
    ok(await waitFor(()=>fresh(H,nH,"found")&&fresh(I,nI,"found")&&fresh(H,nH,"found").roomId===fresh(I,nI,"found").roomId,3000)&&fresh(H,nH,"found").foe===I.name,
      `trận ${k}: vừa đấu nhau mà không còn ai khác xếp hàng thì vẫn ghép H với I`);
    await enterArena(H); await enterArena(I); await waitFor(()=>H.room.state.phase==="ready",3000); await sleep(200);
    const pre=H.room.state.friendly;
    if(day) await test(H,"day",{shift:day});
    await test(H,"afast",{s:0}); await waitFor(()=>H.room.state.phase==="fight",2000);
    for(let j=0;j<TEAM_SIZE&&!meOf(I).dead;j++) await test(I,"down");
    ok(await waitFor(()=>fresh(H,nH,"end")&&fresh(I,nI,"end"),3000),`trận ${k}: I gục cả đội, trận kết thúc`);
    return { h:fresh(H,nH,"end"), i:fresh(I,nI,"end"), pre };
  }
  let eH=ARENA.startElo, eI=ARENA.startElo;
  for(let k=1;k<=ARENA.pairDaily;k++){
    const bag0=snap(H), r=await duel(k);
    ok(!r.pre&&!r.h.friendly&&!r.i.friendly&&r.h.elo0===eH&&r.h.elo1===eloAfter(eH,eI,1)&&r.i.elo1===eloAfter(eI,eH,0)&&r.h.rec.wins===k,
      `trận ${k}/${ARENA.pairDaily}: tính Elo, H ${r.h.elo0} → ${r.h.elo1}, I ${r.i.elo0} → ${r.i.elo1}, H ${r.h.rec.wins} thắng`);
    await checkReward(H,r.h,bag0,ARENA.dailyWins-k);
    eH=r.h.elo1; eI=r.i.elo1;
    await kickBack(H); await kickBack(I);
  }
  {
    const bag0=bagKey(H), bagI=bagKey(I), k=ARENA.pairDaily+1, r=await duel(k);
    ok(r.pre&&H.room.state.friendly,`trận ${k}: sân báo trước giao hữu (ArenaState.friendly) từ lúc đếm ngược`);
    ok(r.h.score===1&&r.h.friendly&&r.i.friendly&&r.h.elo0===eH&&r.h.elo1===eH&&r.i.elo1===eI&&!r.h.reward&&!r.h.capped,
      `trận ${k} giao hữu: H vẫn thắng nhưng Elo giữ nguyên (H ${r.h.elo1}, I ${r.i.elo1}), không thưởng`);
    ok(r.h.rec.wins===ARENA.pairDaily&&r.i.rec.losses===ARENA.pairDaily&&r.h.left===ARENA.dailyWins-ARENA.pairDaily,
      `trận ${k}: không tính thành tích (H ${r.h.rec.wins} thắng, I ${r.i.rec.losses} thua), không mất lượt thắng có thưởng (còn ${r.h.left}/${ARENA.dailyWins})`);
    await sleep(300); ok(bagKey(H)===bag0&&bagKey(I)===bagI,"trận giao hữu: túi và Hồn Tệ hai bên không đổi");
    await kickBack(H); await kickBack(I);
  }
  {
    // Sang ngày mới (hook day trong sân: phòng sân đấu tính ngày theo giờ Việt Nam lúc hết trận): cặp lại có ARENA.pairDaily trận tính Elo.
    const k=ARENA.pairDaily+2, r=await duel(k,1);
    ok(!r.h.friendly&&r.h.elo1===eloAfter(eH,eI,1)&&r.i.elo1===eloAfter(eI,eH,0)&&!!r.h.reward,
      `trận ${k} sang ngày hôm sau: tính Elo lại (H ${r.h.elo0} → ${r.h.elo1}), có thưởng`);
    await kickBack(H); await kickBack(I);
  }
  {
    // Có người thứ ba trong cửa sổ: H (xếp hàng trước) không gặp lại I dù Elo gần hơn, gặp J.
    const J=await bot("Song đấu C","u_minh_linh_mieu",{sex:0,hair:0,hairCol:2,outfitCol:4}); await warpTown(J);
    await test(H,"aelo",{elo:1000}); await test(I,"aelo",{elo:1000}); await test(J,"aelo",{elo:1060});
    const nH=H.arena.length, nI=I.arena.length;
    await at(H,-12); await at(I,12); await at(J,0);
    await aop(H,"queue"); await aop(I,"queue"); await aop(J,"queue");
    ok(await waitFor(()=>fresh(H,nH,"found"),3000)&&fresh(H,nH,"found").foe===J.name&&!fresh(I,nI,"found"),
      `H (1000) vừa đấu I (1000), J (1060) trong cửa sổ: H gặp ${fresh(H,nH,"found")?.foe}, I chờ tiếp`);
    t=await aop(I,"cancel"); ok(/hủy/.test(t),"I vẫn chờ, hủy");
    await enterArena(H); await test(H,"afast",{s:0}); await waitFor(()=>fresh(H,nH,"end"),3000);
    await J.room.leave(); await sleep(300); await back(J);
    await kickBack(H);
    for(const b of [H,I,J]) await b.room.leave();
  }
}
/**
 * 8.2 Cộng minh: bảng RESONANCE đúng mốc 5.10 (hàm thuần), rồi một tài khoản mới đạt từng mốc của 5 trụ cột bằng hook (grant / set
 * võ hồn, hấp thụ thật, give hồn cốt +10 / hồn hạch 5★ rồi gắn bằng message thật): chỉ số mọi võ hồn (ra trận, trong đội, ngoài
 * đội, đổi vào sau) tăng đúng %, thông báo mốc mới (log + `ev`), tháo đồ thì mất mốc, thoát vào lại vẫn giữ.
 */
async function resonanceTest(){
  console.log("[8.2] Cộng minh: 5 trụ cột, cộng chỉ số cho mọi võ hồn");
  const NEED={vohon:[4,6,8],ring:[10,25,50],bone:[6,12,24],core:[8,16,24],star:[4,10,18]};
  ok(RESONANCE.length===5&&RESONANCE.every(r=>JSON.stringify(r.steps.map(s=>s.need))===JSON.stringify(NEED[r.id])&&r.steps.every(s=>Object.values(s.bonus).every(v=>v>0))),
    "RESONANCE: Võ hồn 4/6/8, Hồn hoàn 10/25/50, Hồn cốt 6/12/24, Hồn hạch 8/16/24, Sao 4/10/18 (mục 5.10)");
  const pv=resonanceProgress({vohons:[{level:RES_VOHON_LEVEL,rings:3,stars:3},{level:RES_VOHON_LEVEL-1,rings:7,stars:1},{level:100,rings:10,stars:2}],
    bones:[{enhance:RES_BONE_ENHANCE},{enhance:RES_BONE_ENHANCE-1}],cores:[{stars:RES_CORE_STARS},{stars:RES_CORE_STARS-1},{stars:6}]});
  ok(JSON.stringify(pv)===JSON.stringify([2,20,1,2,3])&&JSON.stringify(resonanceLevels([4,24,6,23,10]))===JSON.stringify([1,1,1,2,2])
    &&JSON.stringify(resonanceLevels([99,99,99,99,99]))===JSON.stringify([3,3,3,3,3])&&JSON.stringify(resonanceBonus([0,0,0,0,0]))===JSON.stringify({hp:0,mp:0,atk:0,crit:0,def:0,spd:0}),
    `resonanceProgress / resonanceLevels: cấp ${RES_VOHON_LEVEL}+, hồn cốt +${RES_BONE_ENHANCE}, hồn hạch ${RES_CORE_STARS}★, sao võ hồn (${JSON.stringify(pv)})`);
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
  // ---- Sao võ hồn: tổng sao cộng thêm 4 / 10 / 18; hiệu ứng crit / giảm sát thương / tốc chạy cộng dồn và có cap ----
  await test(R,"set",{rowId:ids[0],stars:3}); await test(R,"set",{rowId:ids[1],stars:2}); await test(R,"set",{rowId:ids[2],stars:1}); await test(R,"set",{rowId:ids[3],stars:2});
  ok(R.res.prog[4]===4&&R.res.lv[4]===1&&R.res.bonus.crit===1&&R.res.bonus.def===0&&R.res.bonus.spd===0,
    `4 sao cộng thêm: chí mạng +${R.res.bonus.crit} điểm %, chưa mở giảm sát thương / tốc chạy`);
  await test(R,"set",{rowId:ids[4],stars:6}); await test(R,"set",{rowId:ids[5],stars:2});
  ok(R.res.prog[4]===10&&R.res.lv[4]===2&&R.res.bonus.crit===1&&R.res.bonus.def===1,
    `10 sao cộng thêm: giảm sát thương +${R.res.bonus.def}% (chí mạng giữ +${R.res.bonus.crit} điểm %)`);
  await test(R,"set",{rowId:ids[6],stars:5}); await test(R,"set",{rowId:ids[7],stars:5});
  ok(R.res.prog[4]===18&&R.res.lv[4]===3&&R.res.bonus.crit===1&&R.res.bonus.def===1&&R.res.bonus.spd===2,
    `18 sao cộng thêm: tốc chạy +${R.res.bonus.spd}%`);
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
  ok(R.res.prog[3]===24&&JSON.stringify(R.res.lv)===JSON.stringify([3,3,3,3,3]),`24 hồn hạch: đủ 15 mốc (${lvOf()}, ${JSON.stringify(R.res.bonus)})`);
  const all=resonanceBonus([3,3,3,3,3]);
  ok(R.res.bonus.hp===all.hp&&R.res.bonus.mp===all.mp&&R.res.bonus.atk===all.atk&&R.res.bonus.crit===1&&R.res.bonus.def===1&&R.res.bonus.spd===2&&R.resEv.filter(e=>e.up).length>=15,
    `tổng cộng minh ${JSON.stringify(all)}, cap crit 3 / def 5 / spd 5; hiện tại crit ${R.res.bonus.crit}, def ${R.res.bonus.def}, spd ${R.res.bonus.spd}, đã báo ${R.resEv.filter(e=>e.up).length} mốc`);
  await checkAll([3,3,3,3,3],"đủ 15 mốc");
  // Võ hồn trong đội nhưng không ra trận: sinh lực tối đa trong tin squad cũng có cộng minh; đổi vào sau thì chỉ số đang dùng có ngay.
  await test(R,"rest"); await sendTeam(R,[act,ids.find(r=>r!==act&&r!==ids[0])??ids[1],0,0]);
  const bench=R.owned.team[1], bv=R.owned.list.find(v=>v.rowId===bench), bs=await test(R,"stats",{rowId:bench});
  ok(await waitFor(()=>R.squad?.list.find(x=>x.rowId===bench)?.maxHp===bs.stats.maxHp),`võ hồn ngoài sân ${bv.vohon}: sinh lực tối đa trong đội ${bs.stats.maxHp} có cộng minh`);
  R.room.send("switch",{slot:1}); await waitFor(()=>R.owned.active===bench||rme()?.vh===vohonIndex(bv.vohon)); await sleep(150);
  const sw=await test(R,"stats");
  ok(sw.rowId===bench&&sw.live.maxHp===calcStats(vohonIndex(bv.vohon),bv.level,bv.rings.map(tierOfYears),bv.stars,sw.bones,sw.cores,all).maxHp&&rme().maxHp===sw.live.maxHp,
    `đổi ${VOHON[vohonIndex(bv.vohon)].name} vào: sinh lực tối đa ${sw.live.maxHp} có cộng minh`);
  // ---- Thoát vào lại: tiến độ tính lại từ dữ liệu đã lưu, không báo lại mốc ----
  R.resTop=null; R.room.send("resonance",{op:"top",page:1,pageSize:99}); await waitFor(()=>R.resTop,2000);
  ok(R.resTop?.page===1&&R.resTop.pageSize===20&&R.resTop.total>=1&&R.resTop.me?.rank>=1&&R.resTop.list.every(r=>!("accountId" in r)&&typeof r.name==="string"&&Number.isInteger(r.score)),
    `bảng xếp hạng: trang ${R.resTop?.page}/${R.resTop?.pageSize}, ${R.resTop?.total} tài khoản, dòng công khai không lộ accountId`);
  const keep=JSON.stringify([R.res.prog,R.res.lv,R.res.bonus]);
  await test(R,"goto",{x:rme().x,y:rme().y}); await R.room.leave(); await sleep(400);
  R.mapId=(await post("/api/me",{token:R.token})).mapId; await enter(R); await waitFor(()=>R.res&&R.owned&&rme(),3000);
  ok(JSON.stringify([R.res.prog,R.res.lv,R.res.bonus])===keep&&!R.resEv.length,`thoát vào lại: cộng minh giữ nguyên ${keep}, không báo lại mốc`);
  await checkAll([3,3,3,3,3],"vào lại");
  await R.room.leave();
}

/**
 * 9.1: hiệu ứng phụ trợ lan cho đồng đội tổ đội. 3 bot mới ở Thánh Hồn Thôn: A (Cửu Bảo Lưu Ly Tháp ra trận) và B cùng tổ đội, O ở
 * ngoài. Lực Chi Lưu Ly: B đứng 100 pixel nhận tăng công × PARTY_BUFF_MULT (A vẫn ×1), O đứng gần không nhận; B đứng 300 pixel, B
 * trong vùng an toàn không nhận. Hồn Chi Lưu Ly hồi hồn lực, Phòng Chi Lưu Ly tạo khiên + tăng thủ cho B đúng tỉ lệ; tiên cơ Lưu Ly
 * Hộ Thể hồi sinh lực B đúng tỉ lệ (theo sinh lực tối đa của võ hồn ra trận của B), miễn sát thương; có số "+" và dòng "<tên> … cho bạn".
 */
async function partyBuffTest(){
  console.log("[9.1] hiệu ứng phụ trợ lan cho đồng đội tổ đội đứng gần");
  ok(PARTY_BUFF_R===160&&PARTY_BUFF_MULT===0.7&&PARTY_BUFF_SKIP.includes("phoenix"),`PARTY_BUFF_R ${PARTY_BUFF_R}, PARTY_BUFF_MULT ${PARTY_BUFF_MULT}, không lan: ${PARTY_BUFF_SKIP.join(", ")}`);
  const A=await bot("Lưu Ly A","bich_lan_xa_hoang",{sex:1,hair:1,hairCol:2,outfitCol:3});
  const B=await bot("Lưu Ly B","bich_lan_xa_hoang",{sex:0,hair:2,hairCol:4,outfitCol:1});
  const O=await bot("Lưu Ly O","bich_lan_xa_hoang",{sex:0,hair:3,hairCol:1,outfitCol:5});
  const meP=b=>b.room.state.players.get(b.room.sessionId), live=async b=>(await test(b,"stats")).live;
  await waitFor(()=>[A,B,O].every(b=>b.owned&&b.party&&meP(b)),3000);
  try{
    // A: Cửu Bảo Lưu Ly Tháp 4 hồn hoàn ra trận, võ hồn khởi đầu ở ô 2 (để đổi tay tung tiên cơ).
    const CB="cuu_bao_luu_ly_thap", sk=skillsOf(CB), tc=TIEN_CO_RIENG[CB], Y=[423,764,1760,5000], BP=i=>buffPower(Y[i]);
    await test(A,"grant",{vohon:CB}); const rowOf=id=>A.owned.list.find(v=>v.vohon===id)?.rowId, cb=rowOf(CB), st=rowOf("bich_lan_xa_hoang");
    await test(A,"set",{rowId:cb,level:40,xp:0,rings:Y});
    await sendTeam(A,[cb,0,0,0]); await sendTeam(A,[cb,st,0,0]);
    ok(A.owned.active===cb&&await waitFor(()=>meP(A).vh===vohonIndex(CB)),"A: Cửu Bảo Lưu Ly Tháp ra trận (4 hồn hoàn)");
    // Tổ đội A + B.
    await test(A,"party",{pop:"rlreset"});
    const n=B.partyMsgs; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>B.partyMsgs>n);
    B.room.send("party",{op:"accept",name:A.name}); await waitFor(()=>A.party?.members?.length===2&&B.party?.id===A.party.id,2000);
    ok(A.party?.members.length===2&&B.party?.id===A.party.id&&!O.party?.id,"A và B cùng tổ đội, O không trong đội");
    // Ra khỏi làng; mọi người đặt quanh A bằng hook goto (thử từng hướng tới khi đứng được, đúng trong / ngoài làng).
    await leaveSafe(A); const pa=meP(A), ax=pa.x, ay=pa.y;
    async function place(b,dist,{inside=false}={}){
      for(const [ux,uy] of [[1,0],[0,1],[0,-1],[-1,0],[0.7071,0.7071],[0.7071,-0.7071],[-0.7071,0.7071],[-0.7071,-0.7071]]){
        const x=+(ax+ux*dist).toFixed(1), y=+(ay+uy*dist).toFixed(1); await test(b,"goto",{x,y});
        if(await waitFor(()=>Math.hypot(meP(b).x-x,meP(b).y-y)<0.5,600)&&inSafeOf(b)===inside) return true;
      }
      console.log(`  ⚠ không đặt được ${b.name} cách A ${dist} pixel${inside?" trong làng":""}`); return false;
    }
    const clean=async()=>{ await test(A,"clear"); await test(B,"clear"); }; // hồn thú quanh đó không xen vào
    const dist=b=>Math.round(Math.hypot(meP(b).x-meP(A).x,meP(b).y-meP(A).y));
    ok(await place(B,100)&&await place(O,90),`B cách A ${dist(B)} pixel, O (ngoài đội) cách ${dist(O)} pixel, ngoài làng`);
    // ---- Lực Chi Lưu Ly: B nhận công × 0,7, A ×1, O không ----
    await clean(); await test(A,"ready"); let lb=B.logs.length; A.room.send("skill",{i:0});
    // Tin log và bản vá state đi riêng: chờ cả hào quang trong state (đọc ngay khi log tới thì có lúc state chưa vá).
    await waitFor(()=>B.logs.length>lb,1500); await waitFor(()=>(meP(B).buff&buffBit("atk"))!==0,1000);
    let la=await live(A), lB=await live(B), want=sk[0].self.buff.atk*BP(0);
    const lO=await live(O);
    ok(Math.abs((la.buffs.atk?.v??0)-want)<1e-9&&Math.abs((lB.buffs.atk?.v??0)-want*PARTY_BUFF_MULT)<1e-9&&Math.abs((lB.buffs.atk?.t??0)-sk[0].self.secs)<1,
      `${sk[0].name}: A công +${(want*100).toFixed(1)}%, B (100 pixel) +${((lB.buffs.atk?.v??0)*100).toFixed(1)}% (cần ×${PARTY_BUFF_MULT}), ${lB.buffs.atk?.t?.toFixed(1)} giây`);
    ok(Math.abs(lB.atkNow-lB.atk*(1+want*PARTY_BUFF_MULT))<1e-6&&(meP(B).buff&buffBit("atk"))!==0,`B: công đang dùng ${lB.atkNow.toFixed(1)} (gốc ${lB.atk.toFixed(1)}), mọi người thấy hào quang`);
    ok(B.logs.slice(lb).some(t=>t.includes(`${A.name} tăng công cho bạn`)),`B nhận dòng: ${B.logs.slice(lb).join(" | ")}`);
    ok(!lO.buffs.atk&&!O.logs.some(t=>t.includes(A.name)),"O (ngoài tổ đội, đứng gần) không nhận");
    // ---- Đứng 300 pixel / trong vùng an toàn: không nhận ----
    await test(B,"rest",{s:30}); await place(B,300);
    await clean(); await test(A,"ready"); lb=B.logs.length; A.room.send("skill",{i:0}); await sleep(400);
    lB=await live(B); ok(dist(B)>PARTY_BUFF_R&&!lB.buffs.atk&&B.logs.length===lb,`B đứng ${dist(B)} pixel: không nhận`);
    if(await place(B,60,{inside:true})){
      await test(A,"ready"); lb=B.logs.length; A.room.send("skill",{i:0}); await sleep(400);
      lB=await live(B); ok(inSafeOf(B)&&!lB.buffs.atk&&B.logs.length===lb,`B đứng ${dist(B)} pixel nhưng trong làng (vùng an toàn): không nhận`);
    }
    await place(B,100);
    // ---- Hồn Chi Lưu Ly: hồi hồn lực × 0,7, giảm tiêu hao ----
    await test(B,"ready",{mp:20}); await waitFor(()=>Math.abs(meP(B).mp-meP(B).maxMp*0.2)<=2); const m0=meP(B).mp;
    await clean(); await test(A,"ready"); lb=B.logs.length; A.room.send("skill",{i:2}); await waitFor(()=>B.logs.length>lb,1500);
    // Hồn lực tự hồi vài điểm mỗi giây nên đo phần hồi qua dòng log, sinh lực / hồn lực trong state chỉ cần không ít hơn.
    want=Math.round(meP(B).maxMp*sk[2].self.mp*BP(2)*PARTY_BUFF_MULT); lB=await live(B);
    const gotMp=+(B.logs.slice(lb).join(" ").match(/hồi (\d+) hồn lực cho bạn/)?.[1]??-1);
    ok(Math.abs(gotMp-want)<=1&&meP(B).mp>=m0+want-1&&Math.abs((lB.buffs.mp?.v??0)-sk[2].self.buff.mp*BP(2)*PARTY_BUFF_MULT)<1e-9,
      `${sk[2].name}: B hồi ${gotMp} hồn lực (cần ${want} = ${sk[2].self.mp*100}% × buffPower × ${PARTY_BUFF_MULT}), ${m0} -> ${meP(B).mp}, giảm tiêu hao ${((lB.buffs.mp?.v??0)*100).toFixed(1)}%`);
    // ---- Phòng Chi Lưu Ly: khiên theo sinh lực tối đa của B × 0,7, tăng thủ ----
    await clean(); await test(A,"ready"); B.gifts=[]; lb=B.logs.length; A.room.send("skill",{i:3}); await waitFor(()=>B.logs.length>lb,1500);
    await waitFor(()=>meP(B).shield>0&&B.gifts.some(g=>g.shield),1000); lB=await live(B); la=await live(A); want=Math.round(lB.maxHp*sk[3].self.shield*BP(3)*PARTY_BUFF_MULT);
    ok(lB.shield===want&&meP(B).shield===want&&la.shield===Math.round(la.maxHp*sk[3].self.shield*BP(3))&&Math.abs((lB.buffs.def?.v??0)-sk[3].self.buff.def*BP(3)*PARTY_BUFF_MULT)<1e-9,
      `${sk[3].name}: khiên B ${lB.shield} (cần ${want}), A ${la.shield}; thủ B +${((lB.buffs.def?.v??0)*100).toFixed(1)}%`);
    ok(B.gifts.some(g=>g.shield&&g.v===want)&&/tăng thủ, tạo khiên \d+ cho bạn/.test(B.logs.slice(lb).join(" | ")),`B thấy số khiên +${B.gifts.find(g=>g.shield)?.v}: ${B.logs.slice(lb).join(" | ")}`);
    // ---- Tiên cơ Lưu Ly Hộ Thể: hồi sinh lực B × 0,7 (võ hồn ra trận của B), miễn sát thương; O bị thương không được hồi ----
    await test(B,"rest",{s:30}); await test(O,"rest",{s:30});
    await sleep(150); await waitFor(()=>meP(A).swCd===0,3500); A.room.send("switch",{slot:1}); await waitFor(()=>A.owned.active===st);
    await sleep(150); await waitFor(()=>meP(A).swCd===0,3500);
    await test(B,"hurt",{pct:50}); await test(O,"hurt",{pct:50}); await sleep(150);
    const h0=meP(B).hp, o0=meP(O).hp, mB=meP(B).maxHp, heal=Math.round(mB*tc.self.heal*PARTY_BUFF_MULT);
    await test(A,"energy",{v:TIEN_CO_MAX}); await clean(); B.gifts=[]; lb=B.logs.length;
    A.room.send("switch",{slot:0}); await waitFor(()=>B.logs.length>lb,1500);
    want=Math.min(mB,h0+heal);
    // Dòng log tới trước bản vá state (sinh lực, cờ miễn sát thương) và tin "dmg": chờ đủ cả ba rồi mới đọc.
    await waitFor(()=>A.owned.active===cb&&Math.abs(meP(B).hp-want)<=1&&(meP(B).buff&buffBit("inv"))!==0&&B.gifts.some(g=>g.heal),1500);
    ok(A.owned.active===cb&&Math.abs(meP(B).hp-want)<=1&&B.gifts.some(g=>g.heal&&Math.abs(g.v-heal)<=1),
      `tiên cơ ${tc.name}: sinh lực B ${h0} -> ${meP(B).hp}/${mB} (cần ~${want}, ${tc.self.heal*100}% × ${PARTY_BUFF_MULT}), số +${B.gifts.find(g=>g.heal)?.v}`);
    ok((meP(B).buff&buffBit("inv"))!==0&&B.logs.slice(lb).some(t=>t.startsWith(`${A.name} miễn sát thương, hồi `)&&t.endsWith(" sinh lực cho bạn.")),
      `B miễn sát thương: ${B.logs.slice(lb).join(" | ")}`);
    // O vẫn tự hồi sinh lực chậm theo thời gian: chỉ cần không nhận phần hồi của tiên cơ, không miễn sát thương, không có dòng của A.
    ok(meP(O).hp<o0+heal/2&&!(meP(O).buff&buffBit("inv"))&&!O.logs.some(t=>t.includes(A.name)),`O (ngoài đội) không được hồi: ${o0} -> ${meP(O).hp}`);
  } finally { for(const b of [A,B,O]) await b.room.leave().catch(()=>{}); }
}

/**
 * 9.2: hồi máu / khiên cho người khác tính vào đóng góp boss. 2 bot mới cùng tổ đội ở Tinh Đấu Ngoại vi: H (Cửu Bảo Lưu Ly Tháp, chỉ
 * hồi máu, không gây sát thương) và A (đánh thú vương). H tự hồi cho mình (A đầy máu): đóng góp không đổi. A mất máu, tiên cơ Lưu Ly
 * Hộ Thể của H hồi A: phần hồi thực (× PARTY_BUFF_MULT) vào `supBy` của H, bảng xếp hạng có cột hỗ trợ; hạ thú vương thì H đủ 3% nhận
 * rương và kinh nghiệm x KING.xp.
 */
async function supportContribTest(){
  console.log("[9.2] hồi máu / khiên cho người tham gia khác tính đóng góp thú vương");
  ok(SUPPORT_CONTRIB===1&&KING.share===0.03,`SUPPORT_CONTRIB ${SUPPORT_CONTRIB} (1 sinh lực = 1 sát thương), ngưỡng rương ${KING.share*100}%`);
  const NV="tinh_dau_ngoai_vi", CB="cuu_bao_luu_ly_thap", tc=TIEN_CO_RIENG[CB], Y=[423,764,1760,5000], KB=MAPS[NV].king;
  const H=await bot("Hỗ Trợ H","bich_lan_xa_hoang",{sex:1,hair:2,hairCol:3,outfitCol:4});
  const A=await bot("Công Kích A","u_minh_linh_mieu",{sex:0,hair:1,hairCol:5,outfitCol:2});
  const mo=b=>b.room.state.players?.get(b.room.sessionId), sid=b=>b.room.sessionId;
  await waitFor(()=>[H,A].every(b=>b.owned&&b.party&&mo(b)),3000);
  try{
    // H: Cửu Bảo Lưu Ly Tháp ô 1 (cấp 35, 4 hồn hoàn: chưa bình cảnh nên còn nhận kinh nghiệm), võ hồn khởi đầu ô 2 để đổi tay tung tiên cơ.
    await test(H,"grant",{vohon:CB}); const rowOf=id=>H.owned.list.find(v=>v.vohon===id)?.rowId, cb=rowOf(CB), st=rowOf("bich_lan_xa_hoang");
    await test(H,"set",{rowId:cb,level:35,xp:0,rings:Y}); await sendTeam(H,[cb,0,0,0]); await sendTeam(H,[cb,st,0,0]);
    const ra=A.owned.active; await test(A,"set",{rowId:ra,level:35,xp:0,rings:Y});
    ok(H.owned.active===cb&&await waitFor(()=>mo(H).vh===vohonIndex(CB)),"H: Cửu Bảo Lưu Ly Tháp ra trận");
    await test(H,"party",{pop:"rlreset"});
    const n=A.partyMsgs; H.room.send("party",{op:"invite",name:A.name}); await waitFor(()=>A.partyMsgs>n);
    A.room.send("party",{op:"accept",name:H.name}); await waitFor(()=>H.party?.members?.length===2&&A.party?.id===H.party.id,2000);
    ok(A.party?.id&&A.party.id===H.party?.id,"H và A cùng tổ đội");
    // Sang Ngoại vi bằng hook warp (đi cổng ẩn); đồng đội được xếp cùng kênh.
    async function warpNV(b){ b.travel=null; await test(b,"warp",{mapId:NV,x:0,y:0}); await waitFor(()=>b.travel,3000); const t=b.travel;
      await b.room.leave(); await sleep(300); b.mapId=t.mapId; await enter(b,t.roomId??undefined); await waitFor(()=>mo(b)&&b.owned&&b.bag,3000); return b.room.state.mapId===NV; }
    ok(await warpNV(A)&&await warpNV(H)&&A.room.roomId===H.room.roomId,"A, H cùng kênh Tinh Đấu Ngoại vi");
    const kingB=()=>[...A.room.state.beasts.values()].find(b=>b.rank===2);
    await test(A,"king",{kop:"spawn"}); ok(await waitFor(()=>kingB(),2000),"thú vương xuất hiện");
    let ki=await test(A,"king"); const LR=ki.lair, inL=(x,y)=>x>=LR.x&&x<=LR.x+LR.w&&y>=LR.y&&y<=LR.y+LR.h;
    async function intoLair(b,dx,dy){ const t=kingB(); for(let k=0;k<24;k++){ const a=k*Math.PI/6, r=k<12?1:1.6, x=Math.round(t.x+dx*r*Math.cos(a)-dy*Math.sin(a)), y=Math.round(t.y+dx*r*Math.sin(a)+dy*Math.cos(a));
      if(!inL(x,y)) continue; await test(b,"goto",{x,y}); const q=mo(b); if(Math.hypot(q.x-x,q.y-y)<1) return true; } return false; }
    const dAH=()=>Math.round(Math.hypot(mo(A).x-mo(H).x,mo(A).y-mo(H).y));
    ok(await intoLair(A,40,0)&&await intoLair(H,-40,0)&&dAH()<PARTY_BUFF_R,`A, H vào hang, cách nhau ${dAH()} pixel (< ${PARTY_BUFF_R})`);
    await test(A,"clear",{keep:1}); await test(A,"kdmg",{v:1}); await test(A,"status",{s:"stun",secs:60}); ki=await test(A,"king");
    ok(ki.engaged&&ki.parts.includes(sid(A))&&ki.parts.includes(sid(H))&&!ki.list.some(x=>x.id===sid(H)),`A đánh: A, H là người tham gia; H chưa có đóng góp (${JSON.stringify(ki.list)})`);
    /**
     * H đổi sang võ hồn khởi đầu rồi đổi về Cửu Bảo Lưu Ly Tháp với năng lượng đầy: tung tiên cơ Lưu Ly Hộ Thể. Năng lượng về 0 trước
     * khi đổi sang võ hồn khởi đầu, để tiên cơ của nó (gây sát thương) không tung: H chỉ hồi máu.
     */
    async function huThe(){ await waitFor(()=>mo(H).swCd===0,SWITCH_CD*1000+1000); await test(H,"energy",{v:0}); H.room.send("switch",{slot:1}); await waitFor(()=>H.owned.active===st);
      await sleep(150); await waitFor(()=>mo(H).swCd===0,SWITCH_CD*1000+1000); await test(H,"energy",{v:TIEN_CO_MAX});
      const f=H.fxs.length; H.room.send("switch",{slot:0}); return await waitFor(()=>H.owned.active===cb&&H.fxs.slice(f).some(x=>x.k==="tienco"&&x.id===sid(H)),2000); }
    // ---- Tự hồi cho mình: A đầy máu (hook set hồi đầy), H mất máu; tiên cơ chỉ hồi H, đóng góp của H không đổi ----
    await test(A,"set",{rowId:ra}); await test(H,"hurt",{pct:50}); await sleep(150);
    const h0=mo(H).hp; A.gifts=[];
    ok(await huThe(),`H tung tiên cơ ${tc.name}`); await sleep(200); ki=await test(A,"king");
    ok(mo(H).hp>h0&&mo(A).hp===mo(A).maxHp&&!A.gifts.some(g=>g.heal)&&!ki.supBy[sid(H)]&&!ki.list.some(x=>x.id===sid(H)),
      `tự hồi: H ${h0} -> ${mo(H).hp}, A đầy máu không nhận phần hồi; đóng góp H vẫn 0 (supBy ${JSON.stringify(ki.supBy)})`);
    // ---- Hồi cho A (người tham gia): phần hồi thực vào đóng góp của H ----
    await test(A,"rest",{s:30}); await test(A,"hurt",{pct:50}); await sleep(150);
    const a0=mo(A).hp, mA=mo(A).maxHp, heal=Math.min(mA-a0,Math.round(mA*tc.self.heal*PARTY_BUFF_MULT)); A.gifts=[]; H.boss=[];
    ok(await huThe(),`H tung tiên cơ ${tc.name} lần 2`); await waitFor(()=>A.gifts.some(g=>g.heal),1500); ki=await test(A,"king");
    const got=A.gifts.find(g=>g.heal)?.v??0, sup=ki.supBy[sid(H)]??0, me=ki.list.find(x=>x.id===sid(H));
    ok(Math.abs(got-heal)<=1&&Math.abs(sup-got)<=1&&!ki.dmgBy[sid(H)]&&me&&me.sup===me.pct&&Math.abs(me.pct-+(sup*SUPPORT_CONTRIB/ki.total*100).toFixed(1))<0.15,
      `hồi A ${a0} -> ${mo(A).hp}/${mA} (+${got}, cần ${heal}): hỗ trợ H ${sup.toFixed(1)} = ${me?.pct}% đóng góp (cột hỗ trợ ${me?.sup}%), sát thương 0`);
    ok(await waitFor(()=>H.boss.some(m=>m.k==="rank"&&m.list.some(x=>x.id===sid(H)&&x.sup>0)),2500),"H nhận bảng xếp hạng có dòng của mình và cột hỗ trợ");
    // ---- Hạ thú vương: máu còn 1% (hook bhp) để phần hỗ trợ của H trên 3%; H nhận rương và kinh nghiệm ----
    // bhp theo bid: không có bid thì hook nhắm hồn thú gần nhất (sói thú vương gọi ra / hồn thú hoang) và thú vương còn nguyên máu.
    await test(A,"bhp",{pct:1,bid:ki.bid}); ki=await test(A,"king");
    const want=sup/(ki.total+ki.hp), cH=qtyOf(H,chestCode(KB)), xp0=JSON.stringify([mo(H).level,mo(H).xp]);
    H.logs=[]; A.boss=[]; await test(A,"kdmg",{v:1e8});
    ok(await waitFor(()=>A.boss.some(m=>m.k==="down"),2000),"hạ thú vương");
    const dn=A.boss.find(m=>m.k==="down"), hp=dn?.list.find(x=>x.id===sid(H))?.pct??0;
    ok(hp>=KING.share*100&&Math.abs(hp-want*100)<0.2,`kết quả: H đóng góp ${hp}% (chỉ hồi máu, cần ~${(want*100).toFixed(1)}%, từ ${KING.share*100}%)`);
    ok(await waitFor(()=>qtyOf(H,chestCode(KB))===cH+1,2500)&&H.logs.some(t=>/lượt 1\/3/.test(t)),`H nhận rương ${chestCode(KB)}: ${H.logs.filter(t=>/Đóng góp|lượt/.test(t)).join(" | ")}`);
    ok(JSON.stringify([mo(H).level,mo(H).xp])!==xp0,`H nhận kinh nghiệm thú vương x${KING.xp}: [cấp, kinh nghiệm] ${xp0} -> ${JSON.stringify([mo(H).level,mo(H).xp])}`);
  } finally { for(const b of [H,A]) await b.room.leave().catch(()=>{}); }
}

/**
 * 9.3: Phục Chế Hương Tràng chép hồn kỹ của đồng đội tổ đội. A (Cửu Bảo Lưu Ly Tháp) và B (Xúc Xích ra trận, Cửu Bảo Lưu Ly Tháp
 * trong đội) cùng tổ đội, O (Cửu Bảo Lưu Ly Tháp) ngoài đội. A tung Phòng Chi Lưu Ly, B đứng 180 pixel (ngoài PARTY_BUFF_R nên
 * không nhận khiên lan) chép đúng hồn kỹ đó: khiên = sinh lực tối đa của B × tỉ lệ × buffPower vòng 4 của B × 0,8. Quá COPY_WINDOW
 * giây thì không còn gì để chép. A đứng xa (300 pixel) hoặc O (khác tổ đội, đứng 60 pixel) tung sau cùng thì B chép hồn kỹ của
 * đội mình (Lực Chi Lưu Ly do Cửu Bảo Lưu Ly Tháp của B tung).
 */
async function copyPartyTest(){
  console.log("[9.3] Phục Chế chép hồn kỹ của đồng đội tổ đội đứng gần");
  ok(COPY_R===200&&COPY_WINDOW===8&&COPY_R>PARTY_BUFF_R,`COPY_R ${COPY_R} pixel, COPY_WINDOW ${COPY_WINDOW} giây`);
  const A=await bot("Phục Chế A","bich_lan_xa_hoang",{sex:1,hair:0,hairCol:1,outfitCol:2});
  const B=await bot("Phục Chế B","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:3,outfitCol:4});
  const O=await bot("Phục Chế O","bich_lan_xa_hoang",{sex:1,hair:2,hairCol:5,outfitCol:0});
  const meP=b=>b.room.state.players.get(b.room.sessionId), live=async b=>(await test(b,"stats")).live;
  await waitFor(()=>[A,B,O].every(b=>b.owned&&b.party&&meP(b)),3000);
  try{
    const CB="cuu_bao_luu_ly_thap", XX="xuc_xich", sk=skillsOf(CB), pc=skillsOf(XX)[3], Y=[423,764,1760,5000];
    const rowOf=(b,id)=>b.owned.list.find(v=>v.vohon===id)?.rowId;
    for(const [b,ids] of [[A,[CB]],[B,[XX,CB]],[O,[CB]]]){
      for(const id of ids){ await test(b,"grant",{vohon:id}); await test(b,"set",{rowId:rowOf(b,id),level:40,xp:0,rings:Y}); }
      await sendTeam(b,[rowOf(b,ids[0]),0,0,0]); await sendTeam(b,[rowOf(b,ids[0]),rowOf(b,ids[1]??"bich_lan_xa_hoang"),0,0]);
    }
    ok(meP(A).vh===vohonIndex(CB)&&meP(B).vh===vohonIndex(XX)&&meP(O).vh===vohonIndex(CB),"A, O: Cửu Bảo Lưu Ly Tháp ra trận; B: Xúc Xích ra trận, Cửu Bảo Lưu Ly Tháp chờ");
    await test(A,"party",{pop:"rlreset"});
    const n=B.partyMsgs; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>B.partyMsgs>n);
    B.room.send("party",{op:"accept",name:A.name}); await waitFor(()=>A.party?.members?.length===2&&B.party?.id===A.party.id,2000);
    ok(A.party?.members.length===2&&B.party?.id===A.party.id&&!O.party?.id,"A và B cùng tổ đội, O không trong đội");
    await leaveSafe(A);
    // Đặt `b` cách `ref` đúng `dist` pixel ngoài làng (thử từng hướng tới khi đứng được).
    async function place(b,ref,dist){
      const cx=meP(ref).x, cy=meP(ref).y;
      for(const [ux,uy] of [[1,0],[0,1],[0,-1],[-1,0],[0.7071,0.7071],[0.7071,-0.7071],[-0.7071,0.7071],[-0.7071,-0.7071]]){
        const x=+(cx+ux*dist).toFixed(1), y=+(cy+uy*dist).toFixed(1); await test(b,"goto",{x,y});
        if(await waitFor(()=>Math.hypot(meP(b).x-x,meP(b).y-y)<0.5,600)&&!inSafeOf(b)) return true;
      }
      console.log(`  ⚠ không đặt được ${b.name} cách ${ref.name} ${dist} pixel`); return false;
    }
    const dist=(a,b)=>Math.round(Math.hypot(meP(a).x-meP(b).x,meP(a).y-meP(b).y));
    const clean=async()=>{ for(const b of [A,B,O]) await test(b,"clear"); };
    // B tung Phục Chế (ô P), trả các dòng log mới (đợi tới khi có dòng của Phục Chế).
    async function copy(){
      await test(B,"ready"); const l=B.logs.length; B.room.send("skill",{i:3});
      await waitFor(()=>B.logs.slice(l).some(t=>t.startsWith(`${pc.name}:`)),1500); return B.logs.slice(l).filter(t=>t.startsWith(`${pc.name}:`));
    }
    async function cast(b,i){ await test(b,"ready"); await skillCast(b,i,300); } // đếm từ lúc server đã xử lý (Phục Chế chép hồn kỹ mới nhất theo giờ)
    async function switchTo(b,row){ await sleep(150); await waitFor(()=>meP(b).swCd===0,3500); b.room.send("switch",{slot:b.owned.team.indexOf(row)}); return waitFor(()=>b.owned.active===row,1500); }
    ok(await place(B,A,180),`B cách A ${dist(A,B)} pixel (trong ${COPY_R}, ngoài ${PARTY_BUFF_R}), ngoài làng`);
    await clean();
    let lg=await copy();
    ok(/chưa có hồn kỹ/.test(lg.join(" "))&&meP(B).cds[3]===0,`chưa ai tung hồn kỹ: ${lg.join(" | ")}, không hồi chiêu`);
    // ---- A tung Phòng Chi Lưu Ly, B chép đúng hồn kỹ đó × 0,8 ----
    await cast(A,3); await test(B,"hurt",{pct:5}); await waitFor(()=>meP(B).shield===0);
    const s0=meP(B).shield; lg=await copy();
    const want=Math.round(meP(B).maxHp*sk[3].self.shield*buffPower(Y[3])*pc.copy);
    ok(s0===0&&lg.some(t=>t===`${pc.name}: sao chép ${sk[3].name} của ${A.name}.`)&&await waitFor(()=>meP(B).shield===want,800),
      `B chép ${sk[3].name} của A: khiên ${meP(B).shield} (cần ${want} = sinh lực B × ${sk[3].self.shield} × buffPower × ${pc.copy}); ${lg.join(" | ")}`);
    const lB=await live(B);
    ok(Math.abs((lB.buffs.def?.v??0)-sk[3].self.buff.def*buffPower(Y[3])*pc.copy)<1e-9&&meP(B).vh===vohonIndex(XX)&&meP(B).cds[3]>0,
      `B tăng thủ +${((lB.buffs.def?.v??0)*100).toFixed(1)}% (× ${pc.copy}), Xúc Xích vẫn ra trận, ô P hồi chiêu`);
    // ---- Quá COPY_WINDOW giây: không còn gì để chép ----
    await cast(A,0); await test(A,"rest",{s:COPY_WINDOW+1}); lg=await copy();
    ok(/chưa có hồn kỹ/.test(lg.join(" "))&&meP(B).cds[3]===0,`A tung ${sk[0].name} quá ${COPY_WINDOW} giây trước: ${lg.join(" | ")}`);
    // ---- Đứng xa / khác tổ đội: chép hồn kỹ của đội mình ----
    ok(await place(B,A,300)&&await place(O,B,60),`B cách A ${dist(A,B)} pixel, O (ngoài đội) cách B ${dist(O,B)} pixel`);
    await clean();
    ok(await switchTo(B,rowOf(B,CB)),"B đổi sang Cửu Bảo Lưu Ly Tháp"); await cast(B,0);
    ok(await switchTo(B,rowOf(B,XX)),`B tung ${sk[0].name} rồi đổi về Xúc Xích`);
    await cast(A,3); lg=await copy();
    ok(lg.some(t=>t===`${pc.name}: sao chép ${sk[0].name}.`),`A (${dist(A,B)} pixel) tung ${sk[3].name} sau cùng nhưng đứng xa: B chép hồn kỹ đội mình (${lg.join(" | ")})`);
    await cast(O,3); lg=await copy();
    ok(lg.some(t=>t===`${pc.name}: sao chép ${sk[0].name}.`),`O (khác tổ đội, ${dist(O,B)} pixel) tung ${sk[3].name} sau cùng: B chép hồn kỹ đội mình (${lg.join(" | ")})`);
    // ---- Đồng đội lại gần, tung sau hồn kỹ của đội mình: chép của đồng đội ----
    ok(await place(B,A,120),`B lại gần A (${dist(A,B)} pixel)`); await cast(A,2); lg=await copy();
    ok(lg.some(t=>t===`${pc.name}: sao chép ${sk[2].name} của ${A.name}.`),`A tung ${sk[2].name} gần nhất: B chép của A (${lg.join(" | ")})`);
  } finally { for(const b of [A,B,O]) await b.room.leave().catch(()=>{}); }
}
