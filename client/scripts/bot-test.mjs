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
// (4.3: chủ động trúng, tốn hồn lực, hồi chiêu riêng, bị chặn khi Câm lặng / vùng an toàn, dùng được khi đang niệm đi cổng (#270); bị động
// áp khi gắn, mất khi tháo), cường hóa hồn
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
// Đại Đấu Hồn Trường (arenaTest; BOT_ONLY=arena chỉ chạy phần này. 7.2: xếp hàng ở NPC, ghép theo Elo gần nhất, không ghép khi đang đi cổng / trong tổ đội, đấu đội võ hồn trong
// phòng riêng, đánh trúng đối thủ, hạ hết đội / rời sân / không vào sân / hết giờ, Elo, thưởng, về đúng bản đồ và vị trí cũ, bảng xếp
// hạng, cộng minh, Chân Thân (cả lưu phái Thiêu đốt), tuyệt kỹ Tử Vong Chu Hoàng (8.1d), tuyệt kỹ Cảm điện (8.1c: sét tìm đối thủ Cảm điện, Mê hoặc chỉ lên hồn thú) và dự đoán chuyển động trong sân) cần server bật hook kiểm thử: GAME_TEST=1 npm run dev:server.
// Đồng bộ theo vùng gần (11.4, syncViewTest; BOT_ONLY=view chỉ chạy phần này): hồn sư / hồn thú / đồ rơi ở xa không có trong state,
// tinh anh luôn có, lại gần thì có, tin fx ở xa không gửi, bản đồ nhỏ (tin mini), hồn thú xa mọi hồn sư thì ngủ, hook view tắt lọc.
// Các bot khác tắt lọc (hook view all) vì đọc thực thể ở xa.
// Truyền tống trận (11.2, waypointTest; BOT_ONLY=waypoint chỉ chạy phần này): mở khóa khi bước lên, bản đồ thế giới, phí theo số lần đi cổng,
// niệm rồi dịch chuyển cùng / khác bản đồ, cấm khi giao chiến, hủy khi bị đánh / di chuyển, thiếu Hồn Tệ, Hồi Thành Phù, vào lại vẫn nhớ.
// Thương nhân lưu động ở trại cổng bản đồ săn (#111, campTest; BOT_ONLY=camp chỉ chạy phần này): chỗ đứng ở mọi bản đồ săn, mua theo
// bảng hàng trại, không bán đan lớn, không mở rộng túi, bán đồ dư như trong thành, đứng xa bị từ chối, vào lại còn nguyên.
// Bản đồ lớn (11.3 / 11.5, bigMapTest; BOT_ONLY=bigmap): kiểm mọi bản ×8 dựng bằng tools/maps (vùng, mật độ, cổng hai chiều, truyền
// tống trận, vị trí lưu ở phiên bản bản đồ khác thì vào ở trại cổng); mọi bài khác đọc file Tiled đang dùng (mapUrl, theo MAP_V1 như
// server) nên chạy được trên bản ×8 lẫn bản cũ.
// Cực Hàn của Huyền Minh Băng Giao (#163, coldTest; BOT_ONLY=cold): tầng Hàn tích theo nhịp, đủ tầng thì Đóng băng,
// Hỏa Đàn / thanh tẩy / rời hang / hạ thú vương thì mất tầng.
// Khoá mục tiêu (M3 #750, lockTest; BOT_ONLY=lock): gửi target {id} thì server giữ khoá, tự quay mặt + đánh thường trong tầm, bị đánh / Choáng
// vẫn giữ, quái chết thì huỷ khoá; id sai bị bỏ; Space chưa khoá tự quay về quái gần nhất trong tầm.
// Che tầm nhìn (#175, inkTest; BOT_ONLY=ink): Phun Mực của tinh anh Ma Chương Vương gây Che tầm nhìn (không Câm lặng / Làm
// chậm, vẫn dùng hồn kỹ), thanh tẩy giải, hết giờ thì hết.
// Vùng lưu lại trên mặt đất (#161, groundTest; BOT_ONLY=ground): vũng / sương độc gây Trúng độc theo nhịp khi đứng
// trong vùng, ra khỏi vùng / vào vùng an toàn thì thôi, người vào tầm sau vẫn thấy vùng, vùng mất khi hết giờ / hồn thú gây ra bị hạ.
// Kiểm thử bổ sung #121 (issue121Test; BOT_ONLY=issue121, nhóm 6 của BOT_PART): bán hồn hoàn đang hấp thụ, trận hòa / hết lượt thưởng
// Đại Đấu Hồn Trường và server tự ngắt client đã ghép nhưng còn ở bản đồ.
// Boss thế giới ở Lõi Tinh Đấu (BĐ6e, #118, loiTinhDauTest; BOT_ONLY=world): chạy sau phần tạo bot C (vài phút đầu vẫn chạy) rồi
// chỉ chạy phần boss thế giới: vòng an toàn của chiêu toàn sàn, Du Thủy lặn ra giữa hồ và nổi lên đúng chỗ đã báo.
// Tự săn online phía server (Auto 1, mục 5.13; autoTest, BOT_ONLY=auto): bật / tắt, hạ hồn thú, nhặt, tay ưu tiên, không cướp quái,
// đan, tiên cơ, dừng khi PvP / gục / hết giờ / túi đầy, giới hạn mỗi ô lưới, lưu cài đặt và giờ treo.
// Ủy thác offline (Auto 3, mục 5.13; offlineTest, BOT_ONLY=offline): thoát trong vùng săn, giả lập thời gian trôi (hook offline), vào lại
// nhận thưởng đúng số giây / Hồn Tệ / hồn hoàn tối đa, quỹ giờ treo chung với tự săn, chia theo ngày, quá sức, túi đầy, vùng an toàn.
// Chống gian lận 2 (#165; cheatBagTest, BOT_ONLY=cheat2): tin xin lại bag / vohons / quest theo nhịp ASK_CD, hồn hoàn đang hấp thụ không
// tính cho khảo hạch nộp hồn hoàn, đang ghi phần thưởng boss (hook claimhold) thì không bán / bỏ / hấp thụ.
// Tông môn (#196, tongTest; BOT_ONLY=tong): điều kiện gia nhập (xong tân thủ, cấp, đứng gần sứ giả), đổi tông chờ TONG_SWITCH_DAYS
// ngày (hook tong lùi giờ), rời tông không lách được thời gian chờ, tên tông hiện cho người ở gần, lưu DB qua lần vào lại.
// Tự bán từ xa (#216, sellTest; BOT_ONLY=sell): bộ lọc, khoá món, bán khi túi gần đầy, lưu qua lần vào lại, mua lại ở thương nhân, tự săn bán thay vì dừng.
// Chống gian lận 1 (#164, cheatTest; BOT_ONLY=cheat): message di chuyển / chiến đấu / cổng / kênh mang giá trị lạ bị bỏ qua
// (không đổi vị trí / hồi chiêu / đội), gửi dồn chỉ ra một lần, client không tự mở phòng, xếp ô / đội gửi dồn lưu đúng lần cuối.
// Nhiều kênh (mục 6): server bật CHANNEL_MAX=2 GAME_TEST=1 thì bot chỉ chạy phần kênh (channelTest) rồi thoát: bot thứ 3 vào kênh 2,
// danh sách và đổi kênh giữ tiến độ, đồng đội tổ đội được xếp chung kênh khi vào game / đi cổng, thú vương mỗi kênh một con, thưởng tinh
// anh khóa theo tài khoản ở mọi kênh và đổi kênh rồi quay về vẫn giữ đóng góp (#119).
import { Client } from "colyseus.js";
import { arenaAuditTest } from "./arena-audit-test.mjs"; // #741
import { solidGrid, hits, isSolidTile, PLAYER_HW, PLAYER_HH } from "../../shared/move.ts";
import { findPath, findLongPath, buildNav, navNode, clearLine, pathLength } from "../../shared/path.ts";
import { autoLeg } from "../../shared/autowalk.ts"; // tự đi tới cờ (R4, #431)
import { bagDiff, applyBagDelta } from "../../shared/bagSync.ts";
import { pack } from "@colyseus/msgpackr"; // đo byte tin túi đồ như trên dây (Colyseus mã hóa tin bằng msgpack)
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { API, WS, post, sleep, waitFor, PASS, RUN, ok, failCount, mapFileOf, mapUrl, zonesByName, bot, enter, qtyOf, bagKey, bonesOf, sj, useItem, lastLog, AT, objOf, npcSpot, talk, trade, looseOf, sendTeam, same, test, step } from "./bot/lib.mjs"; // tiện ích chung + bot / enter / test … (#703)
import { googleTest } from "./bot/google.mjs"; // #612
import { looks2Test } from "./bot/looks2.mjs";
import { looks3Test } from "./bot/looks3.mjs";
import { sellTest } from "./bot/sell.mjs";
import { gmTest } from "./bot/gm.mjs";
import { shardBuyTest } from "./bot/shardBuy.mjs";
import { tongTest } from "./bot/tong.mjs";
import { questTest } from "./bot/quest.mjs";
import { dailyTest } from "./bot/daily.mjs";
import { resonanceTest } from "./bot/resonance.mjs";
import { eggTest } from "./bot/egg.mjs";
import { fusionTest } from "./bot/fusion.mjs";
import { tideTest } from "./bot/tide.mjs";
import { groundTest } from "./bot/ground.mjs";
import { arenaAuditRun, arenaTest } from "./bot/arena.mjs";
import { cheatTest, cheatBagTest } from "./bot/cheat.mjs";
import { chapter2Test } from "./bot/chuong2.mjs";
import { chapter3Test } from "./bot/chuong3.mjs";
import { autoTest } from "./bot/auto.mjs";
import { bagTest, bagSyncPure, shopBuybackTest, charBagCmdTest, gearTest, gearEnhanceTest, gearSynthTest, equipDropTest } from "./bot/bag.mjs";
import { gearLuckTest, forgePreviewTest, luckRaceTest, saveFailTest, buybackProcTest, socialAuditTest, equipSoak } from "./bot/gear.mjs";
import { TIERS, TRAVEL_CAST, CHANNEL_CD, TEAM_SIZE, XP_SHARE_ACTIVE, XP_SHARE_BENCH, REVIVE_SECS, RESPAWN_SECS, xpNeed, beastLevel, xpLevelScale,
  BEASTS, MAP_MOVED, XP_LEVEL_CAP,
  VOHON, HE, vohonIndex, calcStats, tierOfYears, TIEN_CO, TIEN_CO_MAX, TIEN_CO_GAIN, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY,
  BAG_SLOTS, BAG_PAGE, DAN_CD, STARTER_ITEMS, itemDef, formatHonTe, formatYears,
  TIER_MULT, SKILLS, skillsOf, skillPower, buffPower, BUFF_SCALE, TIEN_CO_RIENG, tienCoOf, STATUS, STATUS_IDS, statusBit, buffBit, BUFFS, CRIT, PCT_HP_CAP,
  BONDS, bondsOf, BOND_KEYS, bondSum,
  CC_TIER_MULT, BEAST_REGEN, TEAM_COMBAT_SECS, PHOENIX_FIELD_R, PHONG_LOI, BEAST_AGGRO_R, BEAST_WANDER, SPAWN_CLEAR,
  MAPS, MAX_YEARS, beastStats, rollYears, tierBand, parseLevelRange, RING_ITEM, DROP_OWNER_SECS, absorbSecs, absorbChance, ringLimit,
  MAX_RINGS, MAX_LEVEL, SHARD_UNLOCK, STAR_COST, MAX_STARS, starCost, shardChance, shardCode, starMult,
  STAR_SKILL, STAR_SKILL_RINGS, STAR_CD_STARS, STAR_CD, STAR_TIEN_CO_STARS, STAR_TIEN_CO, starSkillMult, starCdMult, starTienCoMult, starRing,
  BONE_ITEM, BONE_SLOTS, boneChance, boneStats, boneName, boneBonus, PICKUP_RANGE,
  BEAST_SKILL_YEARS, beastSkillOf, teleHits, TELE_PAD, TELE_WARN, TELE_FIRST,
  BOSSES, bossIndex, beastIndex, ELITE, ELITE_RAGE, bossHpMult, teleZones, beastBuffBit, BEAST_BUFFS, beastName,
  KING, KING_CHEST, KING_TIMES, kingNext, kingActive, vnDay, vnHHMM, kingShardPool, chestCode, kingYears, BOAT_CAST, RED_BEAST_CHANCE,
  WORLD, WORLD_TIME, WORLD_SLAM, WORLD_RING, WORLD_CHEST, worldNext, worldActive, worldBossOn, HE_IDS, FLOOR_SAFE, teleSafe,
  HERBS, HERB_MAX, HERB_PCT, HERB_ELITE, herbChance, herbBonus, parseHerbs,
  BONE_SKILLS, BONE_ACTIVE_SLOTS, BONE_PASSIVE_CAP, boneSkillOf, bonePassive,
  BONE_MAX_ENHANCE, BONE_FEED_PER_YEAR, BONE_FEED_SAME_SLOT, BONE_FEED_CARRY, boneFeedXp, boneEnhanceLevel, boneEnhanceNeed, boneSkillMult, BONE_ENHANCE_FEE, CORE_ENHANCE_FEE, enhanceFee,
  boneEnhancePreview, BONE_MAX_SUBS, BONE_SUB_K, BONE_SUB_POOL, BONE_ENHANCE_MILESTONES, boneSubMax, boneSubsDue, parseBoneSubs, boneAddSubs,
  CORE_ITEM, CORE_SETS, CORE_SUBS, CORE_SUB_ROLL, CORE_STATS, CORE_STAT_IDS, CORE_STAR_K, CORE_MAP_SET, MAX_CORE_STARS, coreResetFee, coreChance, coreStarBand, rollCore, rollCoreStats,
  coreSubMax, coreSetIndex, coreName, coreStatText, coreMainValue, CORE_SLOTS, CORE_SET_FX, coreBonus, coreFx,
  CORE_MAX_ENHANCE, CORE_FEED_STAR, CORE_FEED_SAME_SET, CORE_FEED_CARRY, CORE_ENHANCE_MAIN, CORE_MAX_SUBS, coreFeedXp, coreEnhanceLevel, coreEnhanceNeed,
  coreEnhancePreview, coreUpgradeSubs, coreSubRolls,
  ITEMS, ITEM_KINDS, NPCS, npcDef, NPC_RANGE, SHOP, SHOP_MAX_QTY, sellPrice, ringSellPrice, RING_SELL, BONE_SELL, BONE_SELL_ENH, CORE_SELL, SHARD_SELL,
  BAG_EXPAND, BAG_MAX_SLOTS, BAG_EXPAND_COST, bagExpandCost, bagSlotsOf, BUYBACK_MAX,
  QUEST_STARTER, QUEST_CH2, QUEST_CH3, QUEST_AFTER, questChain, questStart, parseQuest, questStatus, questGoalHit, questRewardText, SWITCH_CD, TONG_MON, TONG_MIN_LEVEL, TONG_SWITCH_DAYS, tongDef, tongWeek,
  DAILY, DAILY_POOL, dailyIds, dailyKey, dailyPicks, isDaily, fitBeast, fitMaps,
  HIGH_RINGS, CHAN_THAN_RING, DEFAULT_LOADOUT, ringSkill, skillChoices, loadoutOf, parseLoadout, chanThanOf, chanThanStats, phoenixFieldR, CHAN_THAN_SKILL_SLOT, CHAN_THAN_SKILL_COST, CHAN_THAN_SKILL_CD,
  PARTY_MAX, PARTY_XP_RANGE, PARTY_INVITE_SECS, PARTY_OFFLINE_SECS, partyXpShare, PARTY_BUFF_R, PARTY_BUFF_MULT, PARTY_BUFF_SKIP, SUPPORT_CONTRIB, COPY_R, COPY_WINDOW,
  RESONANCE, RES_VOHON_LEVEL, RESONANCE_RANK_CD, RESONANCE_RANK_PAGE_MAX, RES_BONE_ENHANCE, RES_CORE_STARS, RESONANCE_EFFECT_CAP, resonanceProgress, resonanceLevels, resonanceBonus,
  ARENA, ARENA_MAP, ARENA_SHARDS, SHARD_BUY, shardBuyPrice, shardBuyCost, eloAfter, arenaTeamElo, arenaCrossPairs, arenaWindow, arenaPairs, arenaRanked, EXTRA_VOHON, AWAKEN_CHOICES, SKIN_TONES, parseLooks, presetToLpc,
  PLAYER_SPEED, RUN_MULT, BEAST_GAIT, BEAST_LEASH, TICK_RATE,
  WAYPOINT_CAST, WAYPOINT_FEE, waypointFee, SYNC_VIEW, CAMP_MERCHANT, CAMP_SHOP, CAMP_STEP, CAMP_PT_GAP, shopOf, shopExpands,
  AUTO_SELL_FREE, AUTO_SELL_BUYBACK, AUTO_SELL_GUARD, SELL_DEFAULTS, parseSell, autoSellable } from "../../shared/data.ts";
import { LOOKS_CHANGE, looksChangeCost, BAG_MSG_BURST, BAG_MSG_RATE, MSG_GROUP, MSG_HARD, MSG_FLOOD_CODE } from "../../shared/data.ts"; // L4 #511
import { RADAR, RALLY, MAPS as RALLY_MAPS } from "../../shared/data.ts"; // R5 (#432): bán kính lọc tin mini; R6 (#433): dấu tập trung
import { rallyUpsert, rallyPrune } from "../../shared/rally.ts";
import { FOG } from "../../shared/data.ts"; import { fogDims, fogCount, fogGet, fogCellOf, fogBytes, fogValid } from "../../shared/fog.ts"; import { loadMap } from "../../server/src/map.ts"; // R8 (#435): sương mù khám phá
import { parseLpc, encodeLpc, decodeLpc, LPC_PARTS, LPC_RAMPS, LPC_PRESETS } from "../../shared/data.ts"; // Looks v2 (#509)
import { PHAP_TUONG } from "../../shared/data.ts"; // pháp tướng Chân Thân (#486): bảng hiển thị client
import { EQUIP_ITEM, EQUIP_SLOTS, EQUIP_MAX_ENHANCE, EQUIP_LUCK_MAX, EQUIP_ROLL, EQUIP_ILVL_K, parseEquip, equipStats, equipDefTotal, equipTemplate, equipSlotIndex, EQUIP_ENHANCE, EQUIP_STONES, EQUIP_CHARM, equipEnhanceStep, equipEnhanceResult, EQUIP_SYNTH, EQUIP_SYNTH_KEEP, EQUIP_ESSENCE, EQUIP_SALVAGE, EQUIP_SOUL, EQUIP_LUCK_UP, equipLuckStep, equipSynthStep, equipSynthOutcome, equipSalvage, equipAutoSalvageable } from "../../shared/data.ts"; // trang bị hồn sư (E1, E3)
import * as SD from "../../shared/data.ts"; // E2: rollEquipDrop, rollEquipCharm... (equipDropTest)
import { campMerchantSpot } from "../../shared/camp.ts";
import { hoaDanSpot } from "../../shared/hoaDan.ts"; // Hỏa Đàn (#163)
import { PLAYER_STATUS } from "../../shared/data.ts";
import { SAFE_REGEN_MULT, hpRegen, mpRegen } from "../../shared/data.ts"; // hồi sinh lực / hồn lực, vùng an toàn (#112)
import { AUTO_AOE_MIN, AUTO_CLUSTER, AUTO_REST, AUTO_LOOT_WAIT, AUTO_BOSS_DETOUR, AUTO_DAILY_SECS, AUTO_RADIUS, AUTO_MAX_PER_CELL, AUTO_DEFAULTS, AUTO_MOVE, AUTO_PACE, AUTO_STATUS, AUTO_PARTY, AUTO_STUCK, AUTO_HINT, autoHint, parseAuto, autoLeft, autoTimeText } from "../../shared/data.ts"; // tự săn (Auto 1, #213)
import { AUTO_RADIUS_MIN, AUTO_LOOT_KINDS, AUTO_TOKEN, AUTO_TOKEN_SECS, AUTO_TOKEN_PRICE, AUTO_BONUS_MAX } from "../../shared/data.ts"; // Auto 2
import { OFFLINE, offlineSplit, offlineFight } from "../../shared/data.ts"; // ủy thác offline (Auto 3)
import { ASK_CD } from "../../shared/data.ts"; // nhịp tin xin lại dữ liệu riêng (#165)
import { BEAST_ROOTED, beastMelee, BEAST_DEF, BEAST_DEF_MULT, beastDef, defMult, PLAYER_CHARM } from "../../shared/data.ts"; // hồn thú: thú thực vật đứng yên, thủ, trạng thái riêng trên hồn sư (#116)
import { GROUND_KINDS, GROUND_TICK, TELE_SHAPES } from "../../shared/data.ts"; // vùng lưu lại trên mặt đất: vũng độc, sương độc (#161)
import { SLOW_CAP } from "../../shared/data.ts"; // Thủy Triều Dâng (#174): Ngập nước cộng Làm chậm khác tối đa SLOW_CAP
import { AUTO_BOSS } from "../../shared/data.ts"; // tự săn đánh tinh anh, thú vương, boss thế giới (#218)
import { ATTACK_CD } from "../../shared/data.ts"; // chống gian lận 1 (#164): gửi dồn đánh thường
import { WORLD_CHAT } from "../../shared/data.ts"; // kênh thế giới (#188)
import { AUTOWALK, TILE } from "../../shared/data.ts"; // tự đi tới cờ (R4, #431)
import { FRIEND_MAX, BLOCK_MAX } from "../../shared/data.ts"; // bạn bè và chặn (#195)
import { FUSION, FUSIONS, fusionIndex } from "../../shared/data.ts"; // Võ Hồn Dung Hợp Kỹ (#192)
import { TONG_DAILY, TONG_POINTS, TONG_WEEK_MIN, TONG_WEEK_REWARD, TONG_POOL, TONG_BOARD_CD, tongTaskIds, tongTaskPicks, isTongTask, tongWeekDay, tongTop } from "../../shared/data.ts"; // tông môn 2 (#197)
import { ARENA_HE_DMG, CORE_FX_RULE } from "../../shared/data.ts"; // cân bằng PvP trong sân (#277)
import { ATK_SPREAD, xpBlocked } from "../../shared/data.ts"; // #238: dải ngẫu nhiên đòn đánh thường (cận trên đòn đánh bọc trứng), bình cảnh




// ---- Nhiều kênh (mục 6): cần server hạ số người mỗi kênh, CHANNEL_MAX=2 GAME_TEST=1 npm run dev:server. Khi đó bot chỉ chạy phần
// này rồi thoát (các phần khác cần nhiều bot chung một phòng); server bình thường (60 người / kênh) thì bỏ qua phần này. ----
const health=await fetch(API+"/health").then(r=>r.json()).catch(()=>({}));
if(health.chMax===2){ await channelTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
// ---- Chia nhóm BOT_PART=1..BOT_PARTS (job bot-ram của CI chạy song song, .github/workflows/check.yml; #236). Mọi nhóm chạy phần chung
// (A, B, 2.3b, 2.4, vào lại của A, ~80 giây trên runner CI); mỗi phần còn lại thuộc đúng một nhóm, khai báo một chỗ ở INLINE và STANDALONE
// dưới đây. Không đặt BOT_PART thì chạy hết. Cuối mỗi lượt in dòng "⏱" (thời gian từng phần) để chia lại cho cân: mỗi nhóm ~7 phút
// trên runner thường (đích ≤ ~8 phút, trần bước bot 12 phút; #684). Bài mới tự tạo bot thì thêm vào STANDALONE, gắn nhóm đang nhẹ nhất theo dòng ⏱. ----
const BOT_PARTS=6;
// Khối nằm trong luồng A / B hay bot C (dùng state của các bot đó nên không tách ra được): khóa -> nhóm.
const INLINE={
  ab1:1,  // ~325 giây: 2.5a–2.5d (bot E), BĐ5, 3.2
  ab2:2,  // ~275 giây: 8.1a–8.1d, 8.3, 9.5, 9.6, 3.5, BĐ4
  botC:3, // ~160 giây: bot C đi cổng BĐ2, NPC 6.1, BĐ6a–BĐ6e, BĐ3, tổ đội 7.1
};
// Bài độc lập (tự tạo bot, gọi được ở bất kỳ đâu): [khóa, nhóm, hàm, cần hook test]. Thứ tự là thứ tự chạy; số giây đo trên runner CI.
const STANDALONE=[
  ["cold",1,coldTest],                        //  18 #163 Cực Hàn
  ["lock",1,lockTest],                        //  ~12 M3 #750 khoá mục tiêu
  ["ink",1,inkTest],                          //   6 #175 Phun Mực che tầm nhìn
  ["boneSub",1,boneSubTest],                  //   3 #187 dòng phụ hồn cốt
  ["split",5,splitTest],                      // ~42 #173 hang chia phần luân phiên (đo ở máy)
  ["arena",3,arenaTest],                      //  96 7.2, 9.7 Đại Đấu Hồn Trường
  ["arenaAudit",5,arenaAuditRun,true],        // ~50 #741 soát chống gian lận đấu trường (arena-audit-test.mjs; đo ở máy)
  ["friend",5,friendTest,true],               // ~40 #195 bạn bè và chặn (đo ở máy)
  ["chuong3",5,chapter3Test],                 // ~18 #284 chương 3 Hải Thần Đảo (đo ở máy)
  ["bag",4,bagTest], // 127 #215, 9.8; E1 trang bị hồn sư; E2 rơi đồ; E3 cường hóa; E4 hợp thành / phân giải
  ["luckRace",6,luckRaceTest],                //  ~6 #740 khắc may mắn: tháo / mặc giữa lúc chờ DB (tài khoản riêng)
  ["saveFail",6,saveFailTest],                //  ~12 #797 hook savefail: hoàn lại khi ghi DB lỗi (luck / enhance / coreset / tông)
  ["luck",6,gearLuckTest],                    //  ~12 #662 khắc may mắn bằng Thần Hồn (tách khỏi nhóm bag, #684)
  ["forgePreview",5,forgePreviewTest,true],    //  ~25 #699 xem trước cường hóa + coreset (ước, chưa đo)
  ["sell",5,sellTest],                        //   5 #216
  ["gm",5,gmTest,true],                       //  ~15 #518 lệnh GM: người không quyền bị từ chối, admin (hook gmadmin) chạy đúng, lệnh sai, preset (#663 vào bot khói)
  ["google",5,googleTest],                    //  ~1 #612 đăng nhập Google (bộ kiểm giả GAME_TEST): chọn tên, liên kết, trùng tên, vé giả
  ["looks2",5,looks2Test],                    //   2 #509 Looks v2 (preset / lpc)
  ["looks3",5,looks3Test],                    //  ~8 #511 đổi ngoại hình ở thợ may: miễn phí lần đầu, tốn Hồn Tệ lần sau
  ["shardBuy",5,shardBuyTest],                //  ~8 #282 Thương hội đổi mảnh võ hồn (đo ở máy)
  ["tong",6,tongTest],                        //   9 #196 tông môn
  ["fog",2,fogTest,true],                     //  ~40 R8 #435 sương mù khám phá: đánh dấu, lưu, theo bản đồ, dữ liệu lạ, lệnh GM (đo ở máy)
  ["rally",2,rallyTest],                      //  ~40 R6 #433 dấu "Tập trung ở đây" của tổ đội: đặt, đồng đội nhận, người ngoài không, spam, hết hạn
  ["flag",2,flagTest],                        //  ~60 R4 #431 tự đi tới cờ: cùng bản đồ, xuyên cổng, bị chặn (đo ở máy)
  ["waypoint",5,waypointTest],                //  45 11.2
  ["camp",3,campTest],                        //   9 #111
  ["bigmap",5,bigMapTest],                    //  78 11.3 / 11.5
  ["view",5,syncViewTest],                    //   8 11.4
  ["quest",6,()=>questTest({blocked})],          //  31 6.2
  ["chuong2",6,chapter2Test],                // 106 #189, #256 chương 2 Sử Lai Khắc Thất Quái
  ["daily",6,dailyTest],                      //  18 khảo hạch hằng ngày
  ["resonance",6,resonanceTest],              //  20 8.2
  ["issue121",6,issue121Test],                //  55 #121 hồn hoàn đang hấp thụ, hòa / hết lượt thưởng, ngắt kết nối sau ghép
  ["chat",5,chatTest,true],                   //  ~8 #188 chat tổ đội / riêng / thế giới (đo ở máy)
  ["auto",4,autoTest],                        // 145–190 Auto 1
  ["autoBoss",5,autoBossTest],                //  55 #218
  ["egg",6,eggTest],                          //  12 #162 bọc trứng Vạn Chu Phệ
  ["fusion",6,fusionTest],                    //  13 #192 Võ Hồn Dung Hợp Kỹ
  ["tide",6,tideTest],                        //  10 #174 Thủy Triều Dâng
  ["cheat",6,cheatTest],                      //  11 #164 chống gian lận 1
  ["offline",6,offlineTest],                  //  12 Auto 3
  ["ground",6,groundTest],                    //  12 #161
  ["cheat2",6,cheatBagTest],                  //  12 #165 chống gian lận 2
  ["partyBuff",6,partyBuffTest,true],         //  10 9.1
  ["partyEffect",6,partyEffectExpansionTest,true], // 11 #114
  ["supportContrib",6,supportContribTest,true],    // 13 9.2
  ["copyParty",6,copyPartyTest,true],         //  11 9.3
];
// BOT_PART=smoke (mức "smoke" của CI, job `changes`): chỉ phần chung (đăng nhập, vào bản đồ, di chuyển, đánh quái, túi / nhân vật, tin giao diện cơ bản)
// cộng các bài độc lập nhẹ ở SMOKE dưới đây, ~2 phút trên runner CI. Không khối INLINE nào chạy ở chế độ này.
const SMOKE=new Set(["cold","ink","boneSub","sell","looks2","gm"]);
const PART=process.env.BOT_PART??"", T0=Date.now(), timing=[];
const inPart=k=>{ if(!(k in INLINE)) throw new Error(`inPart: khóa ${k} chưa có trong INLINE`); return !PART||PART===String(INLINE[k]); };
for(const [k,n] of [...Object.entries(INLINE),...STANDALONE.map(([k,n])=>[k,n])])
  if(!(Number.isInteger(n)&&n>=1&&n<=BOT_PARTS)){ console.log(`✗ phần ${k} gắn nhóm ${n}: chỉ nhận 1..${BOT_PARTS}`); process.exit(1); }
if(PART&&PART!=="smoke"&&!(/^\d+$/.test(PART)&&+PART>=1&&+PART<=BOT_PARTS)){ console.log(`✗ BOT_PART=${PART}: chỉ nhận 1..${BOT_PARTS} hoặc smoke`); process.exit(1); }
if(PART==="smoke"&&[...SMOKE].some(k=>!STANDALONE.some(x=>x[0]===k))){ console.log("✗ SMOKE có khóa không có trong STANDALONE"); process.exit(1); }
// CI truyền số job trong matrix (strategy.job-total): lệch BOT_PARTS thì có nhóm không job nào chạy.
if(PART&&process.env.BOT_PARTS_CI&&+process.env.BOT_PARTS_CI!==BOT_PARTS){ console.log(`✗ matrix CI có ${process.env.BOT_PARTS_CI} nhóm, BOT_PARTS=${BOT_PARTS}: sửa .github/workflows/check.yml`); process.exit(1); }
if(PART==="smoke") console.log("BOT_PART=smoke: chỉ chạy phần chung và các bài khói");
else if(PART) console.log(`BOT_PART=${PART}/${BOT_PARTS}: chỉ chạy phần chung và nhóm ${PART}`);
/** Chạy `fn`, ghi thời gian vào dòng ⏱ cuối lượt. */
async function timed(k,fn){ const t=Date.now(); await fn(); timing.push(`${k} ${Math.round((Date.now()-t)/1000)}`); }
/** Chạy các bài độc lập của nhóm đang chạy (mọi bài nếu không đặt BOT_PART); bài cần hook test thì bỏ qua khi server không bật GAME_TEST=1. */
async function runStandalone(hook){
  for(const [k,n,fn,needHook] of STANDALONE){
    if(PART==="smoke"?!SMOKE.has(k):PART&&PART!==String(n)) continue;
    if(needHook&&!hook){ console.log(`  ⚠ bỏ qua ${k} (cần hook test): bật server bằng GAME_TEST=1`); continue; }
    await timed(k,fn);
  }
}
/** In thời gian từng phần và kết quả rồi thoát. */
function finish(){
  console.log(`⏱ thời gian (giây) nhóm ${PART||"đầy đủ"}: tổng ${Math.round((Date.now()-T0)/1000)}; ${timing.join(", ")}`);
  console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0);
}
// Tự săn đánh tinh anh, thú vương, boss thế giới (#218, autoBossTest; BOT_ONLY=autoboss): né chiêu báo trước / vũng độc,
// đóng góp, khóa ELITE.lock, hết lượt KING.daily, lùi khi ít máu, ngắt tích lực, né chiêu toàn sàn, thanh tẩy, Cực Hàn tới Hỏa Đàn xả
// tầng (#163). BOT_ONLY=autobossperf (không
// chạy trong bot đầy đủ): đo tick khi nhiều bot tự săn cùng đánh một boss thế giới (server PERF_LOG=1).
// Bọc trứng Vạn Chu Phệ (#162, eggTest; BOT_ONLY=egg chỉ chạy phần này): đẻ đủ bọc, phá thì không nở, để nguyên thì
// nở đúng số nhện con, giới hạn nhện con còn sống, thú vương bị hạ thì bọc tan.
// Chương 2 Sử Lai Khắc Thất Quái (#189, chapter2Test, nhóm 6 của BOT_PART; BOT_ONLY=chuong2): dữ liệu chuỗi, mở sau tân thủ, nhận / trả bài 1, lưu qua lần vào lại.
// Chương 3 Hải Thần Đảo (#284, chapter3Test, nhóm 5 của BOT_PART; BOT_ONLY=chuong3): dữ liệu chuỗi, NPC / Thánh địa, mở sau chương 2, sự kiện theo bản đồ, world, đi hết 8 bài.
// Võ Hồn Dung Hợp Kỹ (#192, fusionTest; BOT_ONLY=fusion chỉ chạy phần này): hai bot cùng tổ đội tung, nổ ở điểm
// giữa, tốn hồn lực, hồi chiêu; từng lý do từ chối; hết giờ hủy không tốn; đóng góp tinh anh chia đôi.
// Thủy Triều Dâng của Thâm Hải Ma Kình Vương (#174, tideTest; BOT_ONLY=tide): vùng ngập luân phiên đổi chỗ mỗi đợt,
// đứng trong nước thì Ngập nước (Làm chậm 50%, cộng tối đa SLOW_CAP), ra khỏi nước thì hết, đứng trong xoáy thì bị kéo về tâm.
// Hang chia phần luân phiên (#173, splitTest; BOT_ONLY=split): nửa băng / nửa lửa của Lưỡng Nghi Luân Chuyển, tơ
// phủ 1/3 hang của Vạn Chu Phệ (đứng đúng / nhầm phần, gây một lần, tự săn né), Song Sắc Mãng đổi băng / hỏa.
// BOT_ONLY=daily: chỉ chạy phần khảo hạch hằng ngày (thử nhanh khi sửa phần đó; lần chạy đầy đủ vẫn gồm phần này).
// Liên kích Hạo Thiên 4 món (#249, comboTest; BOT_ONLY=combo, không chạy trong bot đầy đủ): lặp bài "liên kích ở đòn thứ 3" của
// nhóm 1 nhiều lượt trên một bot riêng để thử chập chờn.
if(process.env.BOT_ONLY==="google"){ await googleTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="looks3"){ await looks3Test(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="looks2"){ await looks2Test(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="flag"){ await flagTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="waypoint"){ await waypointTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="camp"){ await campTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="bigmap"){ await bigMapTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="view"){ await syncViewTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="lock"){ await lockTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="ink"){ await inkTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="cold"){ await coldTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="ground"){ await groundTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="auto"){ await autoTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="tong"){ await tongTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="buybackproc"){ await buybackProcTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="socialaudit"){ await socialAuditTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="savefail"){ await saveFailTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="luckrace"){ await luckRaceTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="luck"){ await gearLuckTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="shardbuy"){ await shardBuyTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="sell"){ await sellTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="fog"){ await fogTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="rally"){ await rallyTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="gm"){ await gmTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="testacc"){ await testAccTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="forgepreview"){ await forgePreviewTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="bag"){ await bagTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="offline"){ await offlineTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="chuong3"){ await chapter3Test(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="chuong2"){ await chapter2Test(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="split"){ await splitTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="tide"){ await tideTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="bonesub"){ await boneSubTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="fusion"){ await fusionTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="combo"){ await comboTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="egg"){ await eggTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="autoboss"){ await autoBossTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="autobossperf"){ await autoBossPerf(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="charbag"){ await charBagCmdTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="equipsoak"){ await equipSoak(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="cheat2"){ await cheatBagTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="arena"){ await arenaTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="arenaAudit"){ await arenaAuditRun(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="daily"){ await dailyTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="friend"){ await friendTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="chat"){ await chatTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="cheat"){ await cheatTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="issue121"){ await issue121Test(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
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
  const follow=async b=>{ const t=b.travel; if(!t) return; await b.room.leave(); await sleep(200); b.mapId=t.mapId; await enter(b,t.roomId??undefined); await fresh(b); };
  /** Xin đổi kênh `ch` rồi đi theo `travel`. Hồn thú hoang có thể đánh trúng giữa `rest` và lệnh (fight về 0): server từ chối "Đang giao chiến"
   * đúng luật nên dọn quanh bot, nghỉ, gửi lại (tối đa 4 lần). Server chỉ gửi `travel` sau khi lưu xong nên chờ tới 10 giây; hết giờ thì ✗ kèm log. */
  const gotoChannel=async(b,ch,what)=>{
    let got=false;
    for(let i=0;i<4&&!got;i++){
      await T(b,"clear",{keep:1}); await T(b,"rest",{s:TEAM_COMBAT_SECS+1}); await T(b,"chan",{reset:1});
      b.travel=null; const l=await say(b,"channel",{ch});
      got=await waitFor(()=>b.travel,/giao chiến/.test(l)?300:10000);
    }
    ok(got,`${what}: nhận travel (log: ${b.logs.slice(-3).join(" | ")})`); if(got) await follow(b); return got; };
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
  { // #164: client không tự chọn kênh đích: rời phòng rồi joinById kênh khác kênh server chọn bị từ chối (CHANNEL_CD giây)
    const t=P2.travel; await P2.room.leave(); await sleep(200);
    let other=""; try{ const r=await new Client(WS).joinById(P1.room.roomId,{token:P2.token,mapId:P2.mapId}); await r.leave(); other="vào được"; }catch(e){ other=String(e?.message??e); }
    ok(/kênh 2/.test(other)&&other!=="vào được",`đổi sang kênh 2 nhưng tự joinById kênh 1: bị từ chối ("${other}")`);
    await enter(P2,t.roomId); await fresh(P2);
  }
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
  { // #188: chat tổ đội / tin riêng xuyên kênh cùng bản đồ (qua presence); chat bản đồ chỉ trong kênh của người gửi
    for(const b of [P1,P2]) await T(b,"chat",{cop:"rlreset"});
    P1.chats=[]; P3.chats=[]; const tp=`đội kênh ${RUN}`, tw=`riêng kênh ${RUN}`, tm=`bđ kênh ${RUN}`;
    P2.room.send("chat",{text:tp,ch:"party"}); P1.room.send("chat",{text:tw,ch:"whisper",to:P3.name}); P2.room.send("chat",{text:tm});
    ok(await waitFor(()=>P3.chats.some(m=>m.ch==="party"&&m.text===tp&&m.name===P2.name)&&P3.chats.some(m=>m.ch==="whisper"&&m.text===tw&&m.name===P1.name),2000),
      "P3 (kênh 2) nhận chat tổ đội của P2 và tin riêng của P1 (kênh 1)");
    ok(await waitFor(()=>P1.chats.some(m=>m.text===tm),2000)&&(await sleep(300),!P3.chats.some(m=>m.text===tm)),"chat bản đồ của P2 tới P1 (kênh 1), không sang kênh 2");
    // #198: chat tông xuyên kênh (P1, P3 không cùng tổ đội, chỉ cùng tông; hook tong {set} đặt thẳng tông rồi trả lại).
    for(const b of [P1,P3]) await T(b,"tong",{set:TONG_MON[0].id});
    const tt=`tông kênh ${RUN}`; P1.room.send("chat",{text:tt,ch:"tong"});
    ok(await waitFor(()=>P3.chats.some(m=>m.ch==="tong"&&m.text===tt&&m.name===P1.name),2000),`P3 (kênh 2) nhận chat tông ${TONG_MON[0].name} của P1 (kênh 1)`);
    for(const b of [P1,P3]) await T(b,"tong",{set:null});
  }
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
  P1.travel=null; await T(P1,"warp",{mapId:NV,x:0,y:0}); await waitFor(()=>P1.travel,10000); await follow(P1);
  ok(chOf(P3)===1&&chOf(P2)===1&&chOf(P1)===2,`Ngoại vi: P3, P2 kênh ${chOf(P3)}; P1 kênh ${chOf(P1)} (kênh 1 đầy)`);
  { // #819: khóa kênh đích sau đổi kênh nằm ở presence dùng chung (chạy --procs 2: phòng đích khác tiến trình vẫn thấy khóa, không chặn nhầm)
    await T(P2,"chan",{reset:1}); P2.travel=null; await say(P2,"channel",{ch:2}); await waitFor(()=>P2.travel,3000);
    const t=P2.travel; await P2.room.leave(); await sleep(200);
    let other=""; try{ const r=await new Client(WS).joinById(P3.room.roomId,{token:P2.token,mapId:NV}); await r.leave(); other="vào được"; }catch(e){ other=String(e?.message??e); }
    ok(/kênh 2/.test(other)&&other!=="vào được",`#819 Ngoại vi: đổi sang kênh 2 nhưng joinById kênh 1: bị từ chối ("${other}")`);
    await enter(P2,t.roomId); await fresh(P2);
    ok(chOf(P2)===2,"#819: vào đúng kênh server chọn: khóa không chặn nhầm");
    await gotoChannel(P2,1,"P2 đổi sang kênh 1");
    ok(chOf(P2)===1&&chOf(P1)===2,"#819: P2 về kênh 1 như cũ (khóa cũ đã gỡ, không chặn lần vào hợp lệ kế tiếp)");
  }

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
  await gotoChannel(P1,1,"P1 đổi sang kênh 1");
  ok(chOf(P1)===1&&king(P1),"P1 đổi sang kênh 1 (vẫn trong khung giờ đó, thú vương kênh 1 còn sống)");
  P1.logs=[]; await slayKing(P1); await waitFor(()=>!king(P1),3000); await sleep(400);
  ok(!king(P1)&&chestN(P1)===1&&/đã nhận rương của khung giờ này ở kênh khác/.test(P1.logs.join("\n")),
    `hạ thú vương kênh 1 trong cùng khung giờ: không nhận thêm rương ("${P1.logs.find(t=>/kênh khác/.test(t))??P1.logs.slice(-3).join(" | ")}")`);

  // ---- #119: tinh anh mỗi kênh hồi sinh riêng, nhưng thưởng tinh anh khóa theo tài khoản ELITE.lock giây ở mọi kênh; đổi kênh rồi
  // quay về thì đóng góp lên tinh anh còn giao chiến vẫn còn (gắn theo tài khoản) ----
  {
    const EB=(await T(P1,"elite")).list[0]?.boss, ek=`${NV}|${EB}`, newDrops=(b,bf)=>[...b.room.state.drops.entries()].filter(([k])=>!bf.has(k)).map(([,x])=>x);
    const one=async(b,bid)=>(await T(b,"elite",{bid})).one;
    /** `b` hạ ngay tinh anh `bid` (hook slay, như ra đòn cuối); trả đồ rơi mới và các dòng log. */
    const slayE=async(b,bid)=>{ const bf=new Set(b.room.state.drops.keys()), l=b.logs.length; await T(b,"slay",{bid}); await sleep(250); return {nd:newDrops(b,bf),log:b.logs.slice(l).join(" | ")}; };
    /**
     * Đổi kênh như người chơi (rời giao chiến, bỏ chờ CHANNEL_CD bằng hook); hồn thú hoang có thể vừa đánh: thử lại tối đa 3 lần.
     * Tinh anh còn giao chiến đứng gần và bầy sói Hú Bầy của nó đánh liên tục thì `rest` vừa xong đã lại giao chiến (cả 3 lần trượt,
     * chập chờn trên CI): trước mỗi lần xóa hồn thú thường quanh `b` (giữ tinh anh) và cho hồn thú quanh `b` Choáng vài giây.
     */
    const swap=async(b,ch)=>{ for(let k=0;k<3;k++){ await T(b,"clear",{keep:1}); await T(b,"status",{s:"stun",secs:5,all:1});
      await T(b,"rest",{s:TEAM_COMBAT_SECS+1}); await T(b,"chan",{reset:1});
      b.travel=null; const w=await say(b,"channel",{ch}); if(await waitFor(()=>b.travel,3000)) return follow(b);
      console.log(`    ${b.name} chưa đổi được sang kênh ${ch} (đang ở kênh ${chOf(b)}): "${w}"`); } };
    ok(!!EB,`tinh anh của ${MAPS[NV].name}: ${EB}`);
    // Kênh 1: P1 hạ tinh anh (hook sinh 1 máu, cùng mã): chắc chắn rơi hồn hạch (số ngẫu nhiên 0,5), bị khóa ELITE.lock giây.
    await T(P1,"elock",{s:0}); await T(P1,"core",{r:50});
    let r=await slayE(P1,(await T(P1,"beast",{boss:EB,dx:14,dy:0})).bid), lc=(await T(P1,"elock")).locks;
    ok(chOf(P1)===1&&r.nd.some(x=>x.item===CORE_ITEM&&x.owner===P1.room.sessionId)&&lc[ek]>ELITE.lock-60,`kênh 1: P1 hạ ${beastName(1,bossIndex(EB))}: hồn hạch chắc chắn, khóa ${lc[ek]?.toFixed(0)} giây`);
    // Tinh anh còn giao chiến ở kênh 1: P3 đứng cạnh (giữ giao chiến), P1 ở xa gây 7, P3 gây 5 sát thương.
    const E1=(await T(P3,"beast",{boss:EB,dx:14,dy:0})).bid; await T(P3,"bhp",{pct:100,bid:E1});
    await T(P3,"kdmg",{v:5,bid:E1}); await T(P1,"kdmg",{v:7,bid:E1});
    let o=await one(P3,E1); const s1=P1.room.sessionId;
    ok(o?.engaged&&o.dmgBy[s1]===7&&o.dmgBy[P3.room.sessionId]===5,`kênh 1: P1, P3 cùng đánh tinh anh (đóng góp ${JSON.stringify(o?.dmgBy)})`);
    // P1 sang kênh 2 (P2 vào game mở kênh 2): hạ tinh anh cùng mã ở kênh 2 trong lúc còn khóa thì chỉ như hồn thú thường.
    { const pick=await post("/api/channel",{token:P2.token}); await enter(P2,pick.roomId??undefined); await fresh(P2); }
    await swap(P1,2);
    ok(chOf(P2)===2&&chOf(P1)===2,`P2 vào kênh ${chOf(P2)}, P1 đổi sang kênh ${chOf(P1)}`);
    await T(P1,"core",{r:50}); r=await slayE(P1,(await T(P1,"beast",{boss:EB,dx:14,dy:0})).bid);
    ok(r.nd.length&&!r.nd.some(x=>x.item===CORE_ITEM)&&/chưa lâu \(kênh nào cũng tính\)/.test(r.log),`kênh 2 trong lúc còn khóa: không hồn hạch chắc chắn ("${r.log}")`);
    // P1 quay về kênh 1: đóng góp 7 chuyển sang phiên mới; hạ tinh anh khi còn khóa thì quyền ưu tiên sang P3 (chưa khóa) dù P1 đóng góp nhiều hơn.
    await swap(P1,1);
    o=await one(P3,E1); const s2=P1.room.sessionId;
    ok(chOf(P1)===1&&s2!==s1&&o?.engaged&&o.dmgBy[s2]===7&&!(s1 in o.dmgBy),`đổi kênh rồi quay về kênh 1: đóng góp của P1 vẫn ${o?.dmgBy[s2]} (phiên mới), phiên cũ không còn`);
    await T(P3,"elock",{s:0}); await T(P1,"core",{r:50}); r=await slayE(P1,E1); const sid3=P3.room.sessionId;
    // Chỉ xét đồ rơi tinh anh (hồn hoàn, hồn cốt, hồn hạch): mảnh / tiên thảo của người hạ rơi xuống đất khi túi P1 đầy thì vẫn thuộc P1.
    const eliteDr=r.nd.filter(x=>x.item===""||x.item===BONE_ITEM||x.item===CORE_ITEM);
    ok(eliteDr.some(x=>x.item===CORE_ITEM&&x.owner===sid3)&&eliteDr.every(x=>x.owner===sid3)&&/chưa bị khóa thưởng tinh anh/.test(r.log)&&(await T(P3,"elock")).locks[ek]>0,
      `P1 (còn khóa, đóng góp 7) hạ tinh anh: đồ rơi tinh anh ưu tiên P3 (đóng góp 5, chưa khóa), P3 bị khóa`);
    for(const b of [P1,P3]){ await T(b,"core",{r:100}); await T(b,"elock",{s:0}); }
    await P2.room.leave(); await sleep(300);
  }

  // ---- BĐ6a: Thiên Đấu Thành chia kênh như mọi bản đồ (P3 mở kênh 1, P1 vào cùng, P2 vào kênh 2 khi kênh 1 đầy) ----
  const TD=AT;
  for(const b of [P1,P3]) await T(b,"rest",{s:TEAM_COMBAT_SECS+1});
  const tdS=objOf(TD,"arrive","tu_nac_dinh_thanh");
  P3.travel=null; await T(P3,"warp",{mapId:TD,x:tdS.x,y:tdS.y}); await waitFor(()=>P3.travel,3000);
  ok(P3.travel?.mapId===TD&&P3.travel.roomId===null,`P3 tới ${MAPS[TD].name}: chưa có kênh nào (roomId null)`);
  await follow(P3);
  P1.travel=null; await T(P1,"warp",{mapId:TD,x:tdS.x+16,y:tdS.y}); await waitFor(()=>P1.travel,10000);
  ok(P1.travel?.roomId===P3.room.roomId,"P1 tới Thiên Đấu Thành: vào kênh 1 còn chỗ của P3"); await follow(P1);
  { const pick=await post("/api/channel",{token:P2.token}); await enter(P2,pick.roomId??undefined); await fresh(P2); }
  P2.travel=null; await T(P2,"warp",{mapId:TD,x:tdS.x-16,y:tdS.y}); await waitFor(()=>P2.travel,10000); await follow(P2);
  ok(P2.room.state.mapId===TD&&chOf(P3)===1&&chOf(P1)===1&&chOf(P2)===2&&P2.room.roomId!==P3.room.roomId,
    `Thiên Đấu Thành: P3, P1 kênh ${chOf(P3)}; P2 kênh ${chOf(P2)} (kênh 1 đầy, đồng đội P3 không còn chỗ)`);
  cl=await chans(P2); ok(JSON.stringify(cl?.list.map(c=>[c.ch,c.n]))==="[[1,2],[2,1]]",`danh sách kênh Thiên Đấu Thành: ${JSON.stringify(cl?.list)}`);
  for(const b of [P1,P2,P3]) await b.room.leave();
}

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
/** Điểm (x, y) nằm trong một mảnh của vùng `z` (zonesByName). */
const inZone=(z,x,y)=>!!z&&z.rects.some(r=>x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height);
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
/** Bộ Hạo Thiên 4 món (5.2): `b` đánh thường 3 đòn liên tiếp vào hồn thú `bid` (đã trói, `b` quay mặt về nó); trả số fx `combo`
 *  của từng đòn và chẩn đoán. Chờ theo tin, không sleep cố định (#249): đòn tới khi còn hồi chiêu đánh thường (ATTACK_CD trừ theo
 *  nhịp server, `dt` bị kẹp khi server bận) bị bỏ im lặng, không chém và không đổi bộ đếm liên kích, nên chưa thấy fx `slash` thì
 *  gửi lại; đã chém thì chờ tin `dmg` của `bid` (server gửi `slash`, `combo`, `dmg` liền nhau trong cùng lượt xử lý) rồi mới đếm. */
async function comboHits(b,bid){
  const sid=b.room.sessionId, q=b.room.state.players.get(sid), combos=[], why=[];
  for(let k=0;k<3;k++){
    b.fxs=[]; b.dmgs=[]; let sent=0;
    while(sent<8&&!b.fxs.some(f=>f.k==="slash"&&f.id===sid)){ b.room.send("attack"); sent++; await waitFor(()=>b.fxs.some(f=>f.k==="slash"&&f.id===sid),400); }
    const hit=await waitFor(()=>b.dmgs.some(m=>m.bid===bid),1500), bb=b.room.state.beasts.get(bid);
    combos.push(b.fxs.filter(f=>f.k==="combo"&&f.id===sid).length);
    why.push(`đòn ${k+1}: gửi ${sent}, chém ${b.fxs.filter(f=>f.k==="slash"&&f.id===sid).length}, ${hit?`trúng ${b.dmgs.filter(m=>m.bid===bid).map(m=>m.v).join("+")}`:"không trúng"}`
      +`, A ${q.x.toFixed(0)},${q.y.toFixed(0)} ${q.hp}/${q.maxHp} ${VOHON[q.vh]?.name}, hồn thú ${bb?`${bb.x.toFixed(0)},${bb.y.toFixed(0)} ${bb.hp}`:"mất"}`);
  }
  return {combos,why:why.join("; ")};
}
/** Hàng đường làng đông–tây qua giữa làng (tâm vùng an toàn; bản cũ hàng ô 27–28, bản ×8 hàng 76–79). */
const VILLAGE_RY=safe.y+safe.height/2+8;
/** Đi từ làng (vùng an toàn) ra Bãi tập theo đường làng; ngoài làng thì đi về phía đông một đoạn. */
async function leaveSafe(b){
  const q=b.room.state.players.get(b.room.sessionId), ry=VILLAGE_RY;
  const trace=[], tr=()=>trace.push(`${q.x.toFixed(0)},${q.y.toFixed(0)} moving ${q.moving} spd ${q.spd?.toFixed?.(0)} hp ${q.hp}/${q.maxHp} st ${q.st}`), t0=Date.now(), tick=setInterval(tr,1000);
  if(inSafeOf(b)){
    await goTo(b,q.x,ry,4000);
    // Thời gian đi chạy theo nhịp server (dt kẹp), máy bận thì chậm hơn đồng hồ thật: hết hạn mà còn đang tiến thì đi tiếp (#368),
    // chỉ bỏ cuộc khi một lượt không nhích thêm được 10 pixel.
    for(let n=0;n<6&&inSafeOf(b);n++){ const x0=q.x; await goTo(b,safe.x+safe.width+30,ry); if(Math.abs(q.x-x0)<10) break; }
  }
  else { b.room.send("input",{x:1,y:0}); await sleep(1500); b.room.send("input",{x:0,y:0}); await sleep(150); }
  clearInterval(tick); tr();
  if(inSafeOf(b)) console.log(`  (${b.name} kẹt ở ${q.x.toFixed(0)},${q.y.toFixed(0)} sau ${Date.now()-t0} ms; vết mỗi giây: ${trace.join(" | ")}; log ${b.logs.slice(-3).join(" | ")})`);
  return !inSafeOf(b);
}
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
// Năng lượng tiên cơ (2.4): đánh thường trúng thì võ hồn khác trong đội tích năng lượng, võ hồn ra trận không tự tích.
if(p.kills){
  const benchRow=A.owned.team.find(r=>r&&r!==A.owned.active), en=A.squad?.list.find(s=>s.rowId===benchRow)?.en??0;
  const vh=r=>A.owned.list.find(v=>v.rowId===r)?.vohon;
  ok(en>0&&(en===TIEN_CO_MAX||en%TIEN_CO_GAIN.attack===0),`đánh hồn thú: võ hồn ngoài sân tích ${en}/${TIEN_CO_MAX} năng lượng tiên cơ`+(en>0?"":
    ` [ra trận ${vh(A.owned.active)}${A.owned.active===huntAct?"":` (lúc bắt đầu ${vh(huntAct)})`}, sinh lực ${p.hp}/${p.maxHp}, hồn thú thử ${huntBid??"không có"}, log ${JSON.stringify(A.logs.slice(-3))}]`));
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
// Chỉ hồn hoàn (item === ""): túi đã đầy thì mảnh / tiên thảo / trang bị rơi cạnh hồn hoàn cũng của A, cái rơi sau mang years 0.
let dr=null; st.drops.forEach(d=>{ if(d.owner===A.room.sessionId&&!d.item) dr=d; });
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
  if(inPart("ab1")){
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
    const ry=VILLAGE_RY, out=safe.x+safe.width+30, bid=await spawnNear(E,3,40), pc=STATUS.poison.col, ticks=()=>E.dmgs.filter(d=>d.bid===bid&&d.c===pc);
    await test(E,"status",{s:"stun",secs:30}); await test(E,"status",{s:"poison",n:2,secs:30});
    E.dmgs=[]; ok(await waitFor(()=>ticks().length,1500),`Trúng độc ngoài làng: mất ${ticks()[0]?.v} mỗi giây`);
    ok(ticks().every(d=>d.dot===true&&d.by===E.room.sessionId),`Tin dmg của độc có cờ dot và by = người gây (${JSON.stringify(ticks()[0]?.by)}, dot ${ticks()[0]?.dot})`);
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
  // Chỉ số thủ của hồn thú (#116, BEAST_DEF): theo loài (BEAST_DEF_MULT) và niên hạn; đòn trực tiếp nhân defMult, Phá giáp giảm thủ thật
  // (STATUS.armor.shred mỗi tầng, đủ tầng thì hết thủ). Hồn thú bị Trói sẵn để đứng yên (Choáng thì ràng buộc Băng Hỏa có thể cộng thêm).
  {
    const hard=Object.keys(BEAST_DEF_MULT).find(k=>BEAST_DEF_MULT[k]>1), soft=Object.keys(BEAST_DEF_MULT).find(k=>BEAST_DEF_MULT[k]<1);
    const thu=async(species,tier,real=true)=>{ await test(E,"clear"); await face();
      const bid=(await test(E,"spawn",{tier,dx:at(60)[0],dy:at(60)[1],species,...(real?{realDef:1}:{})}))?.bid; await waitFor(()=>beastOf(E,bid),1000);
      await test(E,"status",{bid,s:"root",secs:30}); return {bid,def:(await test(E,"bst",{bid}))?.def}; };
    const deal=async bid=>(await test(E,"bdmg",{bid,v:1000}))?.dealt;
    const h4=await thu(hard,4), s4=await thu(soft,4), h0=await thu(hard,0);
    ok(Math.abs(h4.def-beastDef(hard,TIERS[4].years))<1e-9&&h4.def>BEAST_DEF.ref&&s4.def<BEAST_DEF.ref&&h0.def<h4.def,
      `thủ theo loài / niên hạn: ${BEASTS[beastIndex(hard)].name} ${TIERS[4].age} ${h4.def?.toFixed(3)}, cùng loài ${TIERS[0].age} ${h0.def?.toFixed(3)}, `+
      `${BEASTS[beastIndex(soft)].name} ${TIERS[4].age} ${s4.def?.toFixed(3)} (thủ chuẩn ${BEAST_DEF.ref.toFixed(3)})`);
    const h=await thu(hard,4), d0=await deal(h.bid), want=n=>Math.max(1,Math.round(1000*defMult(h.def,n*STATUS.armor.shred)));
    await test(E,"status",{bid:h.bid,s:"armor",n:1,secs:30}); const d1=await deal(h.bid);
    await test(E,"status",{bid:h.bid,s:"armor",n:2,secs:30}); const d3=await deal(h.bid);
    ok(d0===want(0)&&d0<1000&&d1===want(1)&&d3===want(STATUS.armor.max)&&d3===Math.round(1000/(1-BEAST_DEF.ref)),
      `đòn trực tiếp 1000 lên hồn thú thủ cao: ${d0} (cần ${want(0)}), Phá giáp 1 tầng ${d1} (cần ${want(1)}), ${STATUS.armor.max} tầng hết thủ ${d3} (cần ${want(STATUS.armor.max)})`);
    const r=await thu(hard,4,false), r0=await deal(r.bid); await test(E,"status",{bid:r.bid,s:"armor",n:STATUS.armor.max,secs:30}); const r3=await deal(r.bid);
    const r3w=Math.round(1000*defMult(BEAST_DEF.ref,1));
    ok(r.def===BEAST_DEF.ref&&r0===1000&&r3===r3w,`hồn thú thủ chuẩn nhận đúng như trước khi có thủ: ${r0}, Phá giáp ${STATUS.armor.max} tầng ${r3} (cần ${r3w})`);
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
        await test(E,"clear"); [ux,uy]=clearDir(me.x,me.y,zd+20); await step(E,ux,uy); const zb=await spawnAt(4,zd); await test(E,"status",{s:"stun",secs:10,bid:zb});
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
          (away>sk[i].r?"":` [đứng ${me.x.toFixed(0)},${me.y.toFixed(0)}, hướng lùi ${-ux},${-uy}, choáng ${hasSt(b,"stun")}, hồn thú khác gần: ${others().join("/")||"không"}, sinh lực ${me.hp}]`));
        ok(hasSt(b,"vuln")&&(b?.lock??9)<STATUS.lock.max&&(!sk[i].status.some(a=>a.s==="shock")||hasSt(b,"shock")),`${sk[i].name}: Phong ấn cộng dồn thành Dễ thương (còn ${b?.lock} tầng)`+(sk[i].status.some(a=>a.s==="shock")?", Cảm điện":""));
      }
      // Càn Khôn Đảo Chuyển: kéo hai hồn thú về sát thân, Phong ấn, Cảm điện (gom lại để lan Cảm điện).
      await test(E,"clear"); await face(); const g1=await spawnAt(3,60), g2=await spawnAt(3,74);
      await test(E,"status",{s:"stun",secs:10,all:true}); await test(E,"ready"); const gd=[dist(g1),dist(g2)]; await cast(E,2,0);
      const pulled=()=>[g1,g2].every(g=>dist(g)>=0&&dist(g)<TIERS[3].size/2+16&&hasSt(beastOf(E,g),"shock")&&beastOf(E,g).lock===1);
      await waitFor(pulled,1500);
      ok(pulled(),`${sk[2].name}: kéo 2 hồn thú về cách ${dist(g1).toFixed(0)} / ${dist(g2).toFixed(0)} pixel, Phong ấn, Cảm điện`+
        (pulled()?"":` [trước khi tung ${gd.map(x=>x.toFixed(0)).join("/")}, hồn sư ${me.x.toFixed(0)},${me.y.toFixed(0)}, sinh lực ${me.hp}, hồn lực ${me.mp}/${me.maxMp}, st ${me.st}, log ${E.logs.slice(-2).join(" | ")}]`));
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
  } // hết nhóm 1: 2.5a–2.5d
  // ---------- 8.1a: hồn kỹ vòng 5–10, chọn 4 ô mang theo, Võ Hồn Chân Thân (5 võ hồn mẫu) ----------
  if(inPart("ab2")){
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
      { const av=K.fxs.find(f=>f.k==="avatar"&&f.on); ok(!!av&&typeof av.name==="string"&&/^#[0-9a-f]{6}$/i.test(av.col)&&!!PHAP_TUONG[id]&&PHAP_TUONG[id].sheet==="pt_"+id,
        `tin Chân Thân đủ tên + màu, võ hồn ${id} có pháp tướng ở PHAP_TUONG (${PHAP_TUONG[id]?.formula})`); }
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
      // H8 (#491): pha nổ của tiếng T3 chọn theo id người tung, nên tin wave / burst của tuyệt kỹ phải mang id (trước đây server không gửi).
      ok(ult.area==="around"&&K.fxs.some(f=>f.k==="wave"&&f.id===K.room.sessionId),`${ult.name}: fx nổ (wave) mang id người tung (tiếng T3 pha boom)`);
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
  if(inPart("ab2")){
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
  if(inPart("ab2")){
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
      await test(Q,"goto",{x:safe.x+safe.width+140,y:VILLAGE_RY}); await test(Q,"clear"); [qx,qy]=clearDir(qp.x,qp.y,210,60); await step(Q,qx,qy); const atk=(await stats()).atkNow;
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
  if(inPart("ab2")){
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
  if(inPart("ab2")){
    const NEW=EXTRA_VOHON, n0=vohonIndex(NEW[0]); // Bạch Hổ (#194) thêm sau 4 võ hồn này, ở cuối VOHON
    ok(NEW.length===4&&NEW.every((id,k)=>vohonIndex(id)===n0+k)&&vohonIndex("cuu_bao_luu_ly_thap")===n0-1&&vohonIndex("bach_ho")===n0+NEW.length&&VOHON.length===n0+NEW.length+1,
      `8.3: 4 võ hồn mới nối nhau (chỉ số ${n0}–${n0+NEW.length-1}), Bạch Hổ (#194) sau đó, võ hồn cũ giữ chỉ số: ${NEW.map(id=>`${vname(id)} (${VOHON[vohonIndex(id)].rarity}, ${HE[VOHON[vohonIndex(id)].he].name})`).join(", ")}`);
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
  if(inPart("ab2")){
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
  if(inPart("ab2")){
    // Hàm thuần: đủ 25 võ hồn, 40 hồn lực, hồi 8 giây; mạnh hơn vòng 9 khoảng 20% (tổng hệ số sát thương), cùng lối đánh.
    const tot=s=>s.dmg*(s.n??1);
    const bad=VOHON.filter(v=>{ const ct=chanThanOf(v.id)?.skill, r9=ringSkill(v.id,8); if(!ct||ct.cost!==CHAN_THAN_SKILL_COST||ct.cd!==CHAN_THAN_SKILL_CD||!r9) return true;
      if(tot(r9)>0&&Math.abs(tot(ct)/tot(r9)-1.2)>0.05) return true;
      if(v.he==="phu_tro"&&!(ct.self&&(ct.self.heal||ct.self.shield||ct.self.buff))) return true;
      if(v.he==="khong_che"&&!((ct.area==="around"||(ct.area==="proj"&&ct.spread>=360))&&[...(ct.status??[]),...(ct.finisher??[])].some(a=>["stun","root","silence","lock","allure","slow"].includes(a.s)))) return true;
      return false; });
    ok(VOHON.length===25&&!bad.length&&CHAN_THAN_SKILL_SLOT===3,
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
    ok(C.fxs.some(f=>(f.k==="wave"||f.k==="burst")&&f.id===C.room.sessionId),`${ct.name}: fx nổ (wave / burst) mang id người tung (tiếng T3 pha boom)`);
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
  if(inPart("ab2")){
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
    const ry=VILLAGE_RY, X0=safe.x+safe.width+140; ok(await goTo(F,X0,ry),`F tới đường làng phía đông (${fm.x.toFixed(0)},${fm.y.toFixed(0)})`);
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
    // Mê hoặc / Đóng băng riêng trên hồn sư (#116). Thực Nhân Hoa (đứng yên) · Phấn Mê trúng thì Mê hoặc, không còn là Choáng.
    const PM=beastSkillOf("thuc_nhan_hoa",10000);
    bid=await spawnSp("thuc_nhan_hoa",10000,30); await test(F,"status",{s:"root",secs:30});
    x=await teleRun(bid);
    ok(PM.status[0].s==="charm"&&x.hit?.hit.includes(fid)&&hasP("charm")&&!hasP("stun"),`${PM.name}: trúng thì Mê hoặc trên hồn sư (st ${fm.st})`);
    await test(F,"clear"); await goTo(F,X0,ry); await waitFor(()=>!hasP("charm"),1500);
    // Mê hoặc: phím bị bỏ qua, server tự đi lung tung quanh chỗ bị Mê hoặc (PLAYER_CHARM), PlayerState.spd = 0 (client không dự đoán);
    // không dùng được hồn kỹ. Hết Mê hoặc thì đi theo phím lại.
    { await test(F,"pst",{s:"charm",secs:3}); const c0={x:fm.x,y:fm.y}; let far=0, spd0=true;
      F.room.send("input",{x:-1,y:0}); await test(F,"ready"); F.room.send("skill",{i:0});
      ok(await lastLog(F,/Mê hoặc: không dùng được hồn kỹ/)&&fm.cds[0]===0,"Mê hoặc trên hồn sư: không dùng được hồn kỹ");
      await waitFor(()=>{ far=Math.max(far,Math.hypot(fm.x-c0.x,fm.y-c0.y)); spd0&&=!hasP("charm")||fm.spd===0; return !hasP("charm"); },4000);
      const x2=fm.x; ok(await waitFor(()=>fm.x<x2-4,1500),"hết Mê hoặc: đi theo phím lại"); F.room.send("input",{x:0,y:0});
      ok(far>2&&far<=PLAYER_CHARM.r*Math.SQRT2+3&&spd0,`Mê hoặc: tự đi lung tung quanh chỗ đứng (xa nhất ${far.toFixed(1)} pixel, tối đa ${(PLAYER_CHARM.r*Math.SQRT2).toFixed(0)}), bỏ qua phím, spd đồng bộ 0`); }
    await goTo(F,X0,ry);
    // Đóng băng (Hàn Băng Địa Long · Phun Băng là Đóng băng): không đi, không dùng hồn kỹ; hết giờ thì đi được.
    { const FB=beastSkillOf("han_bang_dia_long",30000); await test(F,"pst",{s:"freeze",secs:1.5}); const z0=fm.x;
      F.room.send("input",{x:-1,y:0}); await sleep(500); await test(F,"ready"); F.room.send("skill",{i:0});
      ok(FB.status[0].s==="freeze"&&hasP("freeze")&&!hasP("stun")&&Math.abs(fm.x-z0)<1&&fm.spd===0&&await lastLog(F,/Đóng băng: không dùng được hồn kỹ/)&&fm.cds[0]===0,
        `Đóng băng (${FB.name}): đứng yên (dịch ${Math.abs(fm.x-z0).toFixed(1)} pixel), không dùng được hồn kỹ`);
      ok(await waitFor(()=>!hasP("freeze")&&Math.abs(fm.x-z0)>4,2500),"hết Đóng băng thì đi được"); F.room.send("input",{x:0,y:0}); }
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
    await test(F,"pst",{s:"freeze",secs:20}); // #116: thanh tẩy giải cả Đóng băng
    const tc=await tienCo(F,xr,{tier:-1});
    ok(tc.fx&&await waitFor(()=>fm.st===0,800),`tiên cơ ${TIEN_CO_RIENG.xuc_xich.name}: giải Trói, Câm lặng và Đóng băng (st ${fm.st})`);
    // Thiên Càn Bạch Ngọc Đỉnh (2.5d): tiên cơ thanh tẩy đội.
    await test(F,"grant",{vohon:"thien_can_bach_ngoc_dinh"}); const tr=F.owned.list.find(v=>v.vohon==="thien_can_bach_ngoc_dinh")?.rowId;
    await test(F,"set",{rowId:tr,level:40,xp:0,rings:[423]}); await test(F,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(F,[xr,tr,0,0]);
    await test(F,"pst",{s:"poison",n:2,secs:20}); await test(F,"pst",{s:"slow",secs:20}); await test(F,"pst",{s:"charm",secs:20}); // #116: cả Mê hoặc
    const tt=await tienCo(F,tr,{tier:-1});
    ok(tt.fx&&await waitFor(()=>fm.st===0,800),`tiên cơ ${TIEN_CO_RIENG.thien_can_bach_ngoc_dinh.name}: thanh tẩy Trúng độc, Làm chậm và Mê hoặc (st ${fm.st})`);
    await F.room.leave();
  }
  // ---------- BĐ4: tinh anh (biến dị) ----------
  if(inPart("ab2")){
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
    const away=async b=>{ await test(b,"goto",{x:safe.x+safe.width/2,y:VILLAGE_RY}); };
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

    // ---------- #119: đóng góp theo tài khoản (thoát vào lại không mất); thưởng tinh anh khóa ELITE.lock giây theo tài khoản ----------
    const lk=`${st.mapId}|${TN}`, TNn=eOf(TN).name; let lc=(await test(G,"elock")).locks;
    ok(lc[lk]>ELITE.lock-60&&lc[lk]<=ELITE.lock,`#119: G vừa nhận thưởng ${TNn}: khóa ${lk} còn ${lc[lk]?.toFixed(0)} giây (ELITE.lock ${ELITE.lock})`);
    L=await els();
    await near(G,TN,24); await test(G,"clear",{keep:1}); await tranAp(); await sleep(150);
    I=await info(TN); const g0=G.room.sessionId, v0=I.dmgBy?.[g0]??0;
    ok(I.engaged&&v0>0,`#119: G đánh ${TNn} mới: đóng góp ${v0}`);
    const rid=G.room.roomId; await G.room.leave(); await sleep(300); await enter(G,rid); await waitFor(()=>meOf(G)&&G.owned,3000);
    I=await info(TN); const g1=G.room.sessionId;
    ok(g1!==g0&&I.engaged&&(I.dmgBy[g1]??0)>=v0&&!(g0 in I.dmgBy)&&!I.parts.includes(g1),
      `#119: G thoát rồi vào lại (phiên mới): đóng góp ${I.dmgBy[g1]} chuyển sang phiên mới, phiên cũ không còn; chưa là người tham gia tới khi đánh lại`);
    // Còn khóa: hạ tinh anh chỉ thưởng như hồn thú thường (hồn hạch theo coreChance, không chắc chắn), có nhắc.
    await test(G,"core",{r:50}); let ln=G.logs.length, bf=new Set(st.drops.keys());
    await test(G,"slay",{bid:I.bid}); await sleep(250);
    let nd=[...st.drops.entries()].filter(([k])=>!bf.has(k)).map(([,x])=>x);
    ok(nd.length&&!nd.some(x=>x.item===CORE_ITEM)&&nd.every(x=>x.owner===g1)&&/Đã nhận thưởng .* chưa lâu/.test(G.logs.slice(ln).join("\n")),
      `#119: G còn khóa hạ ${TNn}: như hồn thú thường (số ngẫu nhiên 0,5: không hồn hạch), "${G.logs.slice(ln).find(t=>/chưa lâu/.test(t))}"`);
    lc=(await test(G,"elock",{s:0})).locks; ok(!(lk in lc),"#119: hook elock s=0 bỏ khóa");
    const tb=(await test(G,"beast",{boss:TN,dx:14,dy:0})).bid; bf=new Set(st.drops.keys());
    await test(G,"slay",{bid:tb}); await sleep(250); nd=[...st.drops.entries()].filter(([k])=>!bf.has(k)).map(([,x])=>x); lc=(await test(G,"elock")).locks;
    ok(nd.some(x=>x.item===CORE_ITEM&&x.owner===g1)&&lc[lk]>ELITE.lock-60,`#119: hết khóa: hạ ${TNn} lại chắc chắn rơi hồn hạch, khóa lại ${lc[lk]?.toFixed(0)} giây`);
    await test(G,"core",{r:100});
    await G.room.leave();
  }
  // ---------- BĐ5: tà hóa thú vương theo lịch, máu theo số người, giai đoạn 2, chia thưởng, 3 lần/ngày, rương ----------
  if(inPart("ab1")){
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
    for(const [m,id,hp] of [["tinh_dau_ngoai_vi","huyet_nguyet_lang_vuong",72],["tinh_dau_noi_dia","thien_doc_chu_hoang",84],["lac_nhat_sam_lam","luong_nghi_thu_ho_xa",84],["cuc_bac_chi_dia","huyen_minh_bang_giao",96],["hai_than_dao","tham_hai_ma_kinh_vuong",96]]){
      // Vùng sâu nhất = vùng có niên hạn cao nhất (Cực Bắc BĐ6c chia vùng theo hàng, càng lên bắc càng sâu).
      const zy=z=>parseLevelRange(z.properties.find(q=>q.name==="years")?.value)?.[1]??0;
      // Bản đồ lớn (11.3): vùng sâu nhất có thể là nhiều chữ nhật; hang phải nằm trong các mảnh cùng niên hạn cao nhất.
      const d=BOSSES[bossIndex(id)], os=objsK(m), lr=os.filter(o=>o.type==="boss"), zs=os.filter(o=>o.type==="zone"), top=Math.max(...zs.map(zy));
      const inDeep=(x,y)=>zs.some(z=>zy(z)===top&&x>=z.x&&x<=z.x+z.width&&y>=z.y&&y<=z.y+z.height);
      if(MAPS[m].king!==id||d?.rank!==2||d.hp!==hp||beastIndex(d.species)<0) kbad.push(`${m}: ${id}`);
      if(d&&(d.skills.length<2||d.skills.length>3||!(d.phase2?.skills.length||d.phase2?.split)||[...d.skills,...d.phase2.skills].some(s=>s.warn<1))) kbad.push(`${id}: chiêu`);
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
      `thú vương trong hang (${ki.x?.toFixed(0)},${ki.y?.toFixed(0)}), ${ki.years} năm, máu x${BOSSES[bossIndex("huyet_nguyet_lang_vuong")].hp} = ${ki.maxHp}, sát thương x${KING.dmg}, giai đoạn 1, 2 chiêu (${ki.skills?.join(", ")}), rút đi sau ${Math.round(ki.life)} giây`);
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
  if(inPart("ab1")){
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
      await test(B,"edrop",{seed:7});
      const kb=await killFor(10,undefined,undefined,B); B.room.send("pickup");
      ok(kb&&await waitFor(()=>!st.drops.has(kb.id))&&st.drops.has(k1.id)&&ringsOf(B).some(i=>i.years===10),`đồ rơi chồng nhau: B nhặt hồn hoàn của mình nằm dưới hồn hoàn của A (${B.logs.at(-1)})`);
      ok([...st.drops.values()].some(d=>d.item===SD.EQUIP_ITEM&&d.owner===B.room.sessionId),"hồi quy: trang bị của B còn dưới đất sau khi nhặt hồn hoàn chồng nhau");
      await test(B,"edrop",{off:true});
      for(const i of ringsOf(B).filter(i=>i.years===10)) B.room.send("discard",{id:i.id});
      await waitFor(()=>!ringsOf(B).some(i=>i.years===10));
      const a0=ringsOf(A).length; A.room.send("pickup");
      ok(await waitFor(()=>ringsOf(A).length===a0+1)&&await waitFor(()=>!st.drops.has(k1.id)),"A nhặt hồn hoàn của mình");
      ok(ringsOf(A).some(i=>i.years===437&&i.qty===1&&i.kind==="hon_hoan"),"túi A có hồn hoàn đúng 437 năm (mỗi chiếc một ô)");
      ok(!ringsOf(B).some(i=>i.years===437),"túi B không có hồn hoàn của A");
    }
    // Dọn đồ rơi kèm của ca chồng nhau: pickup ưu tiên trang bị B được nhặt trước hồn hoàn đang khóa của A.
    await test(A,"drops",{s:SD.DROP_TTL_SECS});
    ok(await waitFor(()=>st.drops.size===0),"dọn đồ rơi còn sót trước khi thử hết thời gian ưu tiên");
    // Hết thời gian ưu tiên thì ai cũng nhặt được.
    const k2=await killFor(1234);
    if(k2){
      const l=B.logs.length, b0=bagKey(B);
      B.room.send("pickup");
      ok(await waitFor(()=>B.logs.slice(l).some(t=>t.startsWith(`Hồn hoàn ${formatYears(1234)} thuộc về người hạ`)),800)
        &&st.drops.has(k2.id)&&k2.dr.owner===A.room.sessionId&&k2.dr.ownerTtl>0&&bagKey(B)===b0&&!ringsOf(B).some(i=>i.years===1234),
        `B chưa nhặt được hồn hoàn 1.234 năm: ${B.logs.slice(l).join(" | ")}`);
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
        ok(await waitFor(()=>A.logs.length>l0)&&A.logs.slice(l0).some(t=>t.startsWith(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt`))&&st.drops.has(sid),`A túi đầy: ${A.logs.at(-1)}`);
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
      await test(A,"bone",{r:4}); await test(A,"elock",{s:0}); // #119: bỏ khóa thưởng tinh anh để thử đúng tỉ lệ x ELITE.bone
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
        // #119: hạ cùng loài tinh anh liên tiếp thì bị khóa thưởng ELITE.lock giây; bài này thử luật rơi của từng lần hạ nên bỏ khóa trước.
        await test(A,"elock",{s:0}); A.elite=[]; const ke=await killCore(1500,undefined,HN);
        ok(ke&&ke.dr.stars>=2&&ke.dr.stars<=4&&ke.dr.owner===A.room.sessionId&&await waitFor(()=>A.elite.some(m=>m.k==="down"),1000),
          `cùng số ngẫu nhiên: hạ ${beastName(1,bossIndex(HN))} 1.500 năm chắc chắn rơi ${ke?coreName(CORE_SETS[ke.dr.cset].id,ke.dr.stars):"không có hồn hạch"} (2–4★), thuộc A`);
        await test(A,"core",{r:-1}); // số ngẫu nhiên thật: tinh anh vẫn luôn rơi
        let all=0; for(let k=0;k<3;k++){ await test(A,"drops",{s:3600}); await test(A,"elock",{s:0}); await sleep(120); if(await killCore(437,undefined,HN)) all++; }
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
      const bb=boneBonus([{slot:"tay_phai",years:32000},{slot:"dau",years:12000},{slot:"than",years:1000}]);
      ok(same([bb.hp,bb.mp,bb.atk],[boneStats("than",1000).hp,addMp,addAtk])&&CORE_STAT_IDS.every(k=>["hp","mp","atk"].includes(k)||bb[k]===0),
        "boneBonus cộng đúng chỉ số chính từng vị trí");
      ok(tp&&hd,"A có hồn cốt Tay phải 32.000 năm và Đầu 12.000 năm để gắn");
      await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const s0=await test(A,"stats");
      ok(CORE_STAT_IDS.every(k=>s0.bones[k]===0)&&s0.live.maxHp===s0.base.maxHp&&s0.live.maxMp===s0.base.maxMp,"chưa gắn: chỉ số võ hồn ra trận = chỉ số gốc");
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
      await test(A,"clear"); const safeAt={x:Math.round(safe.x+safe.width/2),y:VILLAGE_RY};
      await test(A,"goto",safeAt); await waitFor(()=>inSafe(),1000); await test(A,"ready"); const mp3=p.mp;
      r=await bsk(2); ok(inSafe()&&/Vùng an toàn/.test(r)&&!A.fxs.some(f=>f.k==="bone")&&p.bcds[2]===0&&p.mp>=mp3,`vùng an toàn: bị chặn (${r})`);
      // #270 (mục 5.3 "đang niệm vẫn đánh được"): đang niệm đi cổng vẫn dùng được kỹ năng hồn cốt như hồn kỹ, không hủy niệm.
      // Cổng làng (ngoài vùng an toàn); hồn thú cạnh bên không đánh trả (hook beast), bước ra khỏi cổng thì mới hủy niệm.
      const gate=JSON.parse(readFileSync(mapUrl(st.mapId),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="portal");
      if(gate){
        await test(A,"goto",{x:gate.x+gate.width/2,y:gate.y+gate.height/2}); await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
        await test(A,"beast",{dx:16,dy:0,years:MAX_YEARS}); await test(A,"bhp",{pct:100}); await test(A,"ready");
        await waitFor(()=>A.portal?.name===gate.name,1000); const lt=A.logs.length, m0=st.mapId;
        // Niệm chỉ TRAVEL_CAST giây: gửi liền tin đi cổng, kỹ năng hồn cốt, rời cổng (hook goto). Server xử lý tin theo thứ tự nên kỹ năng
        // dùng lúc đang niệm và niệm bị hủy vì rời cổng, không phụ thuộc máy chậm hay nhanh.
        A.dmgs=[]; A.fxs=[]; A.room.send("travel",{portal:gate.name}); A.room.send("boneskill",{i:2}); await test(A,"goto",spot);
        await waitFor(()=>A.fxs.some(f=>f.k==="bone")&&A.logs.slice(lt).some(t=>/hủy đi qua cổng/.test(t)),1500);
        const cast=A.logs.slice(lt).filter(t=>!/Đã rời cổng: hủy đi qua cổng/.test(t)).join(" | ");
        ok(/Đang đi tới/.test(cast)&&A.fxs.some(f=>f.k==="bone"&&f.i===2)&&p.bcds[2]>0&&!/hủy|không dùng được/.test(cast)
          &&A.logs.slice(lt).some(t=>/Đã rời cổng: hủy đi qua cổng/.test(t))&&st.mapId===m0,
          `đang niệm đi cổng: dùng được kỹ năng hồn cốt, vẫn niệm tới khi rời cổng (${A.logs.slice(lt).join(" | ")})`);
        await test(A,"clear");
      } else ok(false,`#270: ${st.mapId} không có cổng để thử kỹ năng hồn cốt khi đang niệm`);
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
      // #281: phí Hồn Tệ theo cấp vượt qua (hàm thuần): cấp thấp miễn phí, chia nhỏ hay nhảy một lần cùng tổng, chưa lên cấp không mất phí.
      { const stepSum=(T,a,b)=>Array.from({length:b-a},(_,k)=>enhanceFee(T,a+k,a+k+1)).reduce((x,y)=>x+y,0);
        ok(BONE_ENHANCE_FEE.length===BONE_MAX_ENHANCE&&CORE_ENHANCE_FEE.length===CORE_MAX_ENHANCE&&enhanceFee(BONE_ENHANCE_FEE,0,5)===0&&enhanceFee(CORE_ENHANCE_FEE,0,3)===0
          &&enhanceFee(BONE_ENHANCE_FEE,0,10)===5000&&enhanceFee(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE)===60000&&enhanceFee(CORE_ENHANCE_FEE,0,CORE_MAX_ENHANCE)===55500
          &&enhanceFee(BONE_ENHANCE_FEE,4,7)===BONE_ENHANCE_FEE[4]+BONE_ENHANCE_FEE[5]+BONE_ENHANCE_FEE[6]&&enhanceFee(BONE_ENHANCE_FEE,8,8)===0
          &&stepSum(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE)===enhanceFee(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE)&&stepSum(CORE_ENHANCE_FEE,2,13)===enhanceFee(CORE_ENHANCE_FEE,2,13),
          `phí cường hóa: +1..+5 miễn phí, tới +10 ${formatHonTe(enhanceFee(BONE_ENHANCE_FEE,0,10))}, +20 ${formatHonTe(enhanceFee(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE))}; hồn hạch +15 ${formatHonTe(enhanceFee(CORE_ENHANCE_FEE,0,CORE_MAX_ENHANCE))}; chia nhỏ cùng tổng`); }
      // Hồn cốt đích: Tay phải 32.000 năm đang gắn trên võ hồn ra trận (từ 4.2).
      const act=A.owned.active, tpw=bonesOf(A).find(i=>i.vohon===act&&i.stats?.slot==="tay_phai"&&i.years===32000);
      ok(tpw&&tpw.enhance===0,"đích: hồn cốt Tay phải 32.000 năm đang gắn, +0");
      await test(A,"goto",spot); await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
      const coin0=A.bag.honTe, coin=async n=>{ await test(A,"coin",{n}); return waitFor(()=>A.bag.honTe===n,1500); }; // #281: số dư biết trước, trả lại cuối bài
      await coin(1000);
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
      ok(A.bag.honTe===1000&&A.enh?.fee===0&&!/phí/.test(t),`#281: +0 → +1 → +5 miễn phí (Hồn Tệ giữ ${formatHonTe(A.bag.honTe)})`);
      ok(A.logs.at(-1)?.includes(boneName(AK,"tay_phai",32000,5)),"log ghi tên hồn cốt kèm +5");
      // Mốc nâng kỹ năng: bị động Thân Thiết Giáp Tê Ngưu 12.000 năm lên +20 bằng 5 hồn cốt 100.000 năm cùng vị trí (điểm dư bị bỏ).
      const tg=await give(12000,"than",TG); await boneOp("equip",{itemId:tg.id,vohonId:act});
      const sp0=await test(A,"stats"), def0=sp0.live.passive.buff.def, hp0=p.maxHp, mats=[];
      for(let k=0;k<5;k++) mats.push((await give(MAX_YEARS,"than",TG)).id);
      // #281: +0 → +20 một lần cần phí của cả 20 cấp; thiếu 1 đồng thì từ chối, không mất nguyên liệu / điểm / tiền.
      const fee20=enhanceFee(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE), fee6=enhanceFee(BONE_ENHANCE_FEE,5,6);
      await coin(fee20-1); t=await enh(tg.id,mats);
      ok(/Không đủ Hồn Tệ/.test(t)&&t.includes(formatHonTe(fee20))&&mats.every(id=>itemOf(id))&&itemOf(tg.id).enhance===0&&!itemOf(tg.id).stats?.xp&&A.bag.honTe===fee20-1&&!A.enh,
        `thiếu Hồn Tệ (${formatHonTe(fee20-1)} < ${formatHonTe(fee20)}): từ chối cả lần, không mất gì (${t})`);
      await coin(fee20+fee6+321);
      t=await enh(tg.id,mats); await waitFor(()=>parseBoneSubs(itemOf(tg.id)?.stats).length===BONE_MAX_SUBS); const tgi=itemOf(tg.id), s20=await test(A,"stats");
      ok(A.enh?.fee===fee20&&A.bag.honTe===fee6+321&&t.includes(`phí −${formatHonTe(fee20)}`),`+0 → +20: trừ đúng ${formatHonTe(fee20)} cùng lần, còn ${formatHonTe(A.bag.honTe)}`);
      const def20=bonePassive([{beast:TG,slot:"than",years:12000,enhance:20}]).buff.def, dHp=boneStats("than",12000,20).hp-boneStats("than",12000).hp;
      ok(tgi.enhance===BONE_MAX_ENHANCE&&tgi.stats.xp===boneEnhanceNeed(BONE_MAX_ENHANCE)&&/dư .* điểm bị bỏ/.test(t)&&mats.every(id=>!itemOf(id)),`5 nguyên liệu 100.000 năm: +${tgi.enhance} tối đa, điểm dư bị bỏ (${t})`);
      ok(Math.abs(s20.live.passive.buff.def-def20)<1e-4&&Math.abs(def20-Math.min(BONE_PASSIVE_CAP.def,def0*boneSkillMult(20)))<1e-3&&def20>def0,
        `mốc +20 nâng bị động ${BONE_SKILLS[TG].passive.name}: giảm sát thương ${def0} -> ${s20.live.passive.buff.def} (×${boneSkillMult(20)})`);
      // Từ #187 mốc còn thêm dòng phụ ngẫu nhiên: Thân có thể ra % sinh lực, Tay phải +5 đang gắn có thể ra sinh lực cố định. Phần
      // hồn cốt khớp boneBonus mọi hồn cốt đang gắn (dòng phụ đọc từ túi), sinh lực tối đa tăng ít nhất phần chỉ số chính.
      const wantB=boneBonus(bonesOf(A).filter(i=>i.vohon===act).map(i=>({slot:i.stats.slot,years:i.years,enhance:i.enhance,subs:parseBoneSubs(i.stats)})));
      ok(CORE_STAT_IDS.every(k=>Math.abs(s20.bones[k]-wantB[k])<1e-9)&&parseBoneSubs(tgi.stats).length===boneSubsDue(BONE_MAX_ENHANCE)
        &&await waitFor(()=>p.maxHp===s20.live.maxHp)&&s20.live.maxHp===s20.stats.maxHp&&p.maxHp>=hp0+dHp,
        `sinh lực tối đa ${hp0} -> ${p.maxHp} (chỉ số chính +${dHp}${s20.bones.hp_pct?`, dòng phụ +${s20.bones.hp_pct}%`:""}${s20.bones.hp>boneStats("than",12000,20).hp?`, dòng phụ +${s20.bones.hp-boneStats("than",12000,20).hp} sinh lực`:""}) ngay khi đang gắn`);
      const m5=await give(1000,"than",TG); t=await enh(tg.id,[m5.id]); ok(/tối đa \+20/.test(t)&&itemOf(m5.id),`đã +20: từ chối, nguyên liệu còn nguyên (${t})`);
      // Hồn cốt trong túi (không gắn) cũng cường hóa được; hồn cốt đã cường hóa làm nguyên liệu trả lại 80% điểm.
      const m6=await give(2000,"than",TG); t=await enh(m5.id,[m6.id]);
      const m5i=itemOf(m5.id), g6=fx(2000,"than","than");
      ok(m5i?.vohon===null&&m5i.stats.xp===g6&&m5i.enhance===boneEnhanceLevel(g6)&&!itemOf(m6.id),`cường hóa hồn cốt trong túi: +${m5i?.enhance} (${g6} điểm)`);
      const g7=g5+fx(1000,"than","tay_phai",g6); t=await enh(tpw.id,[m5.id]); tw=itemOf(tpw.id);
      ok(tw.stats.xp===g7&&tw.enhance===boneEnhanceLevel(g7)&&!itemOf(m5.id)&&/vẫn \+5|lên \+/.test(t),`nguyên liệu +${m5i?.enhance}: ${fx(1000,"than","tay_phai")} + ${Math.floor(g6*BONE_FEED_CARRY)} điểm trả lại = ${g7-g5} (${t})`);
      { const f=enhanceFee(BONE_ENHANCE_FEE,5,tw.enhance);
        ok(tw.enhance===6&&f===fee6&&A.enh?.fee===f&&A.bag.honTe===321,`#281: +5 → +${tw.enhance} trả phí ${formatHonTe(f)} (m5 +0 → +${m5i?.enhance} miễn phí), còn ${formatHonTe(A.bag.honTe)}`); }
      await coin(coin0);
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
      const resCrit0=(s0.res?.bonus?.crit??0)/100;
      // Từ #187 hồn cốt đang gắn có thể có dòng phụ chí mạng (tung ngẫu nhiên): chí mạng = gốc + cộng minh + phần hồn cốt (`bones`).
      ok(Object.values(s0.cores).every(x=>x===0)&&same(s0.fx,{})&&Math.abs(s0.live.crit-(CRIT.chance+resCrit0+s0.bones.crit/100))<1e-9&&Math.abs(s0.live.critMult-(CRIT.mult+s0.bones.crit_dmg/100))<1e-9,
        `chưa gắn hồn hạch: không cộng gì, chí mạng gốc + cộng minh ${(resCrit0*100).toFixed(1)}%${s0.bones.crit||s0.bones.crit_dmg?` + hồn cốt (${s0.bones.crit}% / ${s0.bones.crit_dmg}%)`:""}`);
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
      await test(A,"goto",spot); await step(A,1,0); const htB=await dummy(MAX_YEARS); await test(A,"status",{s:"root",secs:10,bid:htB}); await test(A,"ready");
      const {combos,why}=await comboHits(A,htB);
      ok(same(combos,[0,0,1]),`Hạo Thiên 4 món: liên kích ở đòn thứ 3 (${combos.join(", ")})`+(same(combos,[0,0,1])?"":` [${why}]`));
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

      // Tiên Cơ (docs/design/hon-hach.md): 2 món trên võ hồn ngoài sân tích năng lượng +20%; 4 món: tiên cơ của võ hồn đó +35% sát thương.
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
      const resCrit1=(s1.res?.bonus?.crit??0)/100;
      ok(s1.cores.crit>=12&&Math.abs(s1.live.crit-(CRIT.chance+resCrit1+(s1.cores.crit+s1.bones.crit)/100))<1e-9&&Math.abs(s1.live.critMult-(CRIT.mult+(s1.cores.crit_dmg+s1.bones.crit_dmg)/100))<1e-9,
        `Linh Miêu 2 món: tỉ lệ chí mạng ${(s1.live.crit*100).toFixed(1)}% (gốc ${CRIT.chance*100}% + cộng minh ${(resCrit1*100).toFixed(1)}% + hồn hạch ${s1.cores.crit}%${s1.bones.crit?` + hồn cốt ${s1.bones.crit}%`:""}), hệ số ${s1.live.critMult.toFixed(2)}`);
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
        // #281: +0 → +3 miễn phí; +3 → +15 cần phí của 12 cấp, thiếu thì từ chối cả lần.
        const coin0=A.bag.honTe, coin=async n=>{ await test(A,"coin",{n}); return waitFor(()=>A.bag.honTe===n,1500); };
        const M6=await giveCores("linh_mieu",5,6), before=new Map(tw.stats.subs.map(([k,v])=>[k,v])), fee15=enhanceFee(CORE_ENHANCE_FEE,3,CORE_MAX_ENHANCE);
        ok(A.coreUp?.fee===0,"#281: hồn hạch +0 → +2 → +3 miễn phí");
        await coin(fee15-1); r=await up(T.id,M6.map(i=>i.id));
        ok(/Không đủ Hồn Tệ/.test(r)&&r.includes(formatHonTe(fee15))&&M6.every(i=>itOf(i.id))&&itOf(T.id).enhance===3&&A.bag.honTe===fee15-1&&!A.coreUp,
          `thiếu Hồn Tệ (${formatHonTe(fee15-1)} < ${formatHonTe(fee15)}): từ chối, không mất nguyên liệu / cấp / tiền (${r})`);
        await coin(fee15+55);
        r=await up(T.id,M6.map(i=>i.id)); tw=itOf(T.id);
        ok(A.coreUp?.fee===fee15&&A.bag.honTe===55&&r.includes(`phí −${formatHonTe(fee15)}`),`+3 → +15: trừ đúng ${formatHonTe(fee15)}, còn ${formatHonTe(A.bag.honTe)}`);
        await coin(coin0); const s3=await test(A,"stats"), ups=A.coreUp?.subs??[];
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
const HOOK=!!(await test(A,"ping"))?.enabled; // bài độc lập cần hook test (STANDALONE) bỏ qua khi server không bật GAME_TEST=1
await A.room.leave();
timing.push(`chung+khối A/B ${Math.round((Date.now()-T0)/1000)}`);

// Nhóm không có luồng bot C (INLINE.botC) chạy các bài độc lập của mình rồi dừng.
if(PART&&!inPart("botC")){ await runStandalone(HOOK); finish(); }

// ---------- BĐ2: cổng, chặn mềm, lưu bản đồ và vị trí ----------
const tC=Date.now();
console.log("[cổng] tài khoản mới đi Thánh Hồn Thôn -> Nặc Đinh Thành -> Ngoại vi -> Nội địa -> Ngoại vi -> Nặc Đinh Thành");
let C=await bot("Lữ "+Date.now().toString(36).slice(-6),"bich_lan_xa_hoang",{sex:0,hair:1,hairCol:2,outfitCol:3});
const me=()=>C.room.state.players?.get(C.room.sessionId);
let joinErr=""; try{ const r=await new Client(WS).joinOrCreate("map",{token:C.token,mapId:"nac_dinh_thanh"}); await r.leave(); }catch(e){ joinErr=String(e?.message??e); }
ok(/Sai bản đồ/.test(joinErr),`vào bản đồ khác bản đồ đã lưu bị từ chối: ${joinErr}`);
ok(C.room.state.mapId==="thanh_hon_thon","C ở Thánh Hồn Thôn");
// BOT_ONLY=world: sau khi có bot C (ở Thánh Hồn Thôn), chỉ chạy phần boss thế giới ở Lõi Tinh Đấu (BĐ6e, #118).
if(process.env.BOT_ONLY==="world"){ await loiTinhDauTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
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
{ const g=objOf("thanh_hon_thon","portal","Đi Nặc Đinh Thành"); await walkToX(g.x+g.width/2); }
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
  const cFee=enhanceFee(BONE_ENHANCE_FEE,0,cLv); await test(C,"coin",{n:cFee+50}); await waitFor(()=>C.bag.honTe===cFee+50,1500); // #281: phí từ +6
  { const n=C.bagMsgs??0; C.room.send("enhance",{targetId:cb.id,materialIds:cm}); await waitFor(()=>(C.bagMsgs??0)>n&&bonesOf(C).find(i=>i.id===cb.id)?.enhance===cLv,2000); }
  ok(bonesOf(C).find(i=>i.id===cb.id)?.enhance===cLv&&!bonesOf(C).some(i=>cm.includes(i.id))&&cFee>0&&await waitFor(()=>C.bag.honTe===50,1500),
    `C cường hóa hồn cốt đang gắn lên +${cLv} trong làng, 2 nguyên liệu đã mất, phí ${formatHonTe(cFee)}`);
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
{ const a=objOf("nac_dinh_thanh","arrive","tu_thanh_hon_thon"); ok(Math.hypot(me().x-a.x,me().y-a.y)<1,`xuất hiện ở điểm tu_thanh_hon_thon: ${me().x},${me().y}`); }
ok(!C.portal?.name,"điểm xuất hiện nằm ngoài cổng");
ok(C.room.state.beasts.size===0,"Nặc Đinh Thành không có hồn thú");
C.room.send("attack"); ok(await lastLog(C,/Vùng an toàn/),"trong thành không đánh được");
// Nặc Đinh Thành: theo đại lộ sang cổng đông đi Tinh Đấu Ngoại vi (chặn mềm: cảnh báo khi dưới cấp đề xuất nhưng vẫn đi được).
ok(!MAPS.tinh_dau&&MAPS[MAP_MOVED.tinh_dau]&&MAPS.tinh_dau_noi_dia,"MAPS bỏ tinh_dau, có Ngoại vi và Nội địa");
ok(await walk(1,0,()=>C.portal?.name,30000),`tới cổng đông: ${JSON.stringify(C.portal)}`);
const lvC=me().level;
ok(C.portal?.to==="tinh_dau_ngoai_vi"&&JSON.stringify(C.portal.level)==="[10,30]"&&C.portal.warn===(lvC<10),`cổng đi Ngoại vi: cấp đề xuất 10–30, cấp ${lvC} -> cảnh báo ${C.portal?.warn}`);
await travelBy("Đi Tinh Đấu Ngoại vi","tinh_dau_ngoai_vi");
// Điểm xuất hiện đọc từ file Tiled đang dùng (bản ×8 hoặc bản cũ khi MAP_V1, 11.3 / 11.5).
const arriveOf=(m,n)=>objOf(m,"arrive",n);
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
{ const a=objOf("nac_dinh_thanh","arrive","tu_tinh_dau_ngoai_vi"); ok(Math.hypot(me().x-a.x,me().y-a.y)<1,`xuất hiện ở cổng đông Nặc Đinh Thành: ${me().x},${me().y}`); }
await npcTown();
await thienDauTest();
await lacNhatTest();
await haiThanTest();
await loiTinhDauTest();
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
await C.room.leave();
timing.push(`botC ${Math.round((Date.now()-tC)/1000)}`);
await runStandalone(HOOK); // nhóm của bot C (hoặc mọi bài khi không đặt BOT_PART)
finish();

/**
 * 6.1 ở Nặc Đinh Thành: bảng giá (hàm thuần), mọi NPC của NPCS đặt đúng một chỗ trong Tiled, đứng xa bị từ chối; với hook: thương
 * nhân (mua đủ / thiếu Hồn Tệ, số lượng sai, túi đầy kể cả chỉ vừa một phần, bán hồn hoàn / hồn cốt / hồn hạch / mảnh đúng giá, không
 * bán đan / đồ đang gắn / id lạ, đứng xa), lò rèn (mở hộp thoại, cường hóa hồn cốt), Đại Sư, Đại Đấu Hồn Trường; vào lại còn nguyên.
 */
async function npcTown(){
  console.log("[6.1] NPC ở Nặc Đinh Thành: thương nhân, lò rèn, Đại Sư");
  const all=["thanh_hon_thon","nac_dinh_thanh",AT,"hai_than_dao"].flatMap(m=>JSON.parse(readFileSync(mapUrl(m),"utf8"))
    .layers.flatMap(l=>l.objects??[]).filter(o=>o.type==="npc").map(o=>(o.properties??[]).find(q=>q.name==="npc")?.value));
  ok(all.every(id=>npcDef(id))&&NPCS.every(n=>all.filter(x=>x===n.id).length===(n.id===CAMP_MERCHANT?0:1)),`mỗi NPC trong NPCS (trừ thương nhân lưu động, campTest) đặt đúng một chỗ ở Thánh Hồn Thôn / Nặc Đinh Thành / Thiên Đấu Thành / Hải Thần Đảo (#284): ${all.join(", ")}`);
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
  ok(SHOP.every(r=>["dan","phu","lenh"].includes(itemDef(r.code)?.kind)&&r.price>0)&&SHOP.some(r=>r.code==="hoi_huyet_dan")&&SHOP.some(r=>r.code==="hoi_hon_dan"),`thương nhân bán ${SHOP.map(r=>`${itemDef(r.code).name} ${formatHonTe(r.price)}`).join(", ")}`);
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
  { const sq=objOf("nac_dinh_thanh","spawn"); await test(C,"goto",{x:sq.x+sq.width/2,y:sq.y+sq.height/2}); }
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
  // #283: đổi bộ hồn hạch ở Thợ rèn (message coreset): giữ sao / cấp / chỉ số / dòng phụ, phí theo sao, bị từ chối thì không trừ gì.
  { const had=new Set(C.bag.items.map(i=>i.id)), coin=async n=>{ await test(C,"coin",{n}); return waitFor(()=>C.bag.honTe===n,1500); };
    await test(C,"give",{code:CORE_ITEM,stars:2,set:"lam_ngan"}); await test(C,"give",{code:CORE_ITEM,stars:5,set:"hao_thien"});
    const fresh=C.bag.items.filter(i=>!had.has(i.id)), c2=fresh.find(i=>i.stars===2), c5=fresh.find(i=>i.stars===5), before=JSON.stringify(c2?.stats);
    const set=async(id,to,npc="lo_ren")=>{ const l=C.logs.length, n=C.bagMsgs??0; C.room.send("coreset",{id,set:to,npc}); await waitFor(()=>(C.bagMsgs??0)>n&&C.logs.length>l,1500); return C.logs.at(-1); };
    const cur=id=>C.bag.items.find(i=>i.id===id);
    ok(!!c2&&!!c5,"đổi bộ: có hồn hạch 2★ Lam Ngân và 5★ Hạo Thiên để thử"); await coin(coreResetFee(2)-1);
    let t=await set(c2.id,"hao_thien"); ok(/Không đủ Hồn Tệ/.test(t)&&cur(c2.id).stats.set==="lam_ngan"&&C.bag.honTe===coreResetFee(2)-1,`đổi bộ thiếu Hồn Tệ bị từ chối, không trừ gì: ${t}`);
    await coin(coreResetFee(2)+coreResetFee(5)+7);
    t=await set(c2.id,"lam_ngan"); ok(/đã thuộc/.test(t)&&C.bag.honTe===coreResetFee(2)+coreResetFee(5)+7,`đổi sang đúng bộ hiện tại bị từ chối: ${t}`);
    t=await set(c2.id,"khong_co_bo"); ok(/không hợp lệ/.test(t)&&cur(c2.id).stats.set==="lam_ngan","bộ lạ bị từ chối");
    t=await set("khong-co","hao_thien"); ok(/Không có hồn hạch/.test(t),"món lạ (của người khác) bị từ chối");
    t=await set(c2.id,"hao_thien","dai_su"); ok(/Thợ rèn/.test(t)&&cur(c2.id).stats.set==="lam_ngan","NPC không phải Thợ rèn bị từ chối");
    await test(C,"goto",{x:ds.x,y:ds.y+16}); t=await set(c2.id,"hao_thien"); ok(/lại gần Thợ rèn/.test(t)&&cur(c2.id).stats.set==="lam_ngan","đứng xa Thợ rèn: bị từ chối");
    await test(C,"goto",{x:lr.x,y:lr.y+16});
    t=await set(c2.id,"hao_thien"); const u=cur(c2.id), o=JSON.parse(before);
    ok(u.stats.set==="hao_thien"&&u.stars===2&&u.stats.main===o.main&&JSON.stringify(u.stats.subs)===JSON.stringify(o.subs)&&C.bag.honTe===coreResetFee(5)+7,`đổi bộ 2★ Lam Ngân → Hạo Thiên: phí ${coreResetFee(2)} đồng, giữ sao / chỉ số chính / dòng phụ (${t})`);
    await waitFor(()=>C.owned,2000); const vid=C.owned?.active;
    C.room.send("equipcore",{itemId:c5.id,vohonId:vid}); await waitFor(()=>cur(c5.id)?.vohon===vid,2000);
    t=await set(c5.id,"lam_ngan"); ok(cur(c5.id).stats.set==="lam_ngan"&&cur(c5.id).vohon===vid&&cur(c5.id).stars===5&&C.bag.honTe===7,`đổi bộ món đang gắn (5★, ${coreResetFee(5)} đồng): vẫn gắn, đã sang Lam Ngân (${t})`);
    globalThis.__coreSetIds=[c2.id,c5.id]; }
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
  { const [i2,i5]=globalThis.__coreSetIds, g=id=>C.bag.items.find(i=>i.id===id);
    ok(g(i2)?.stats.set==="hao_thien"&&g(i5)?.stats.set==="lam_ngan"&&g(i5)?.vohon!==null,"vào lại: bộ hồn hạch đã đổi (trong túi và đang gắn) vẫn đúng")
    C.room.send("unequipcore",{itemId:i5}); await waitFor(()=>g(i5)?.vohon===null,2000);
    for(const id of [i2,i5]) C.room.send("discard",{id}); await waitFor(()=>!g(i2)&&!g(i5),2000); } // dọn: bài sau cần túi còn chỗ
}

/**
 * Ủy thác offline (Auto 3, mục 5.13; BOT_ONLY=offline chỉ chạy phần này): hàm thuần offlineSplit / offlineFight; thoát trong vùng săn rồi
 * giả lập thời gian trôi bằng hook `offline {ago}`, vào lại nhận thưởng đúng số giây, Hồn Tệ, hồn hoàn tối đa OFFLINE.rings; quỹ giờ treo
 * chung với tự săn (còn 10 phút / hết giờ); chia quỹ theo ngày (đồng hồ lịch đứng yên của GAME_TEST); vùng quá sức; túi đầy thì dừng;
 * vắng quá ngắn và thoát trong vùng an toàn thì không có thưởng.
 */
async function offlineTest(){
  console.log("[Auto 3] Ủy thác offline");
  const D=AUTO_DAILY_SECS, H=3600, noon=Date.UTC(2026,9,22,5,0), tot=a=>a.reduce((s,x)=>s+x.secs,0); // noon: 12:00 giờ Việt Nam
  let sp=offlineSplit(noon,1800,"2026-10-22",D-600);
  ok(sp.length===1&&sp[0].secs===600,`offlineSplit: còn 10 phút quỹ hôm nay thì vắng 30 phút chỉ tính 600 giây (${JSON.stringify(sp)})`);
  sp=offlineSplit(noon,13*H,"2026-10-22",0);
  ok(same(sp,[{day:"2026-10-21",secs:H},{day:"2026-10-22",secs:12*H}]),`offlineSplit: vắng 13 giờ qua 00:00 thì chia hai ngày, mỗi ngày một quỹ (${JSON.stringify(sp)})`);
  sp=offlineSplit(noon,40*H,"2026-10-20",D);
  ok(tot(sp)===OFFLINE.maxSecs&&sp[0].day==="2026-10-21",`offlineSplit: vắng 40 giờ, ngày đầu đã hết quỹ, tối đa ${OFFLINE.maxSecs/H} giờ một lần (${JSON.stringify(sp)})`);
  // Auto 2: hết quỹ miễn phí của ngày thì lấy tiếp quỹ giờ cộng thêm (Ủy Thác Lệnh), vẫn trong trần OFFLINE.maxSecs.
  sp=offlineSplit(noon,3*H,"2026-10-22",D,2*H);
  ok(same(sp,[{day:"2026-10-22",secs:2*H,bonus:true}]),`offlineSplit: hết giờ miễn phí, quỹ Ủy Thác Lệnh 2 giờ, vắng 3 giờ thì tính 2 giờ từ quỹ (${JSON.stringify(sp)})`);
  sp=offlineSplit(noon,2*H,"2026-10-22",D-600,H);
  ok(same(sp,[{day:"2026-10-22",secs:600},{day:"2026-10-22",secs:H,bonus:true}]),`offlineSplit: còn 10 phút miễn phí rồi 1 giờ từ quỹ (${JSON.stringify(sp)})`);
  sp=offlineSplit(noon,40*H,"2026-10-20",0,24*H);
  ok(tot(sp)===OFFLINE.maxSecs,`offlineSplit: có quỹ cộng thêm vẫn tối đa ${OFFLINE.maxSecs/H} giờ một lần (${tot(sp)/H} giờ)`);
  const f1=offlineFight({atk:200,crit:0.12,critMult:1.8,maxHp:2000,def:1},100,"phong_lang"), f2=offlineFight({atk:5,crit:0.12,critMult:1.8,maxHp:60,def:1},50000,"phong_lang");
  ok(f1.ok&&f1.secs>OFFLINE.seek&&!f2.ok&&f2.secs===OFFLINE.seek,`offlineFight: mạnh hạ được (${f1.secs.toFixed(1)} giây/con), yếu thì quá sức (${f2.secs} giây bỏ qua)`);

  const A=await bot("Ủy thác","u_minh_linh_mieu",{sex:1,hair:0,hairCol:3,outfitCol:2});
  if(!(await test(A,"ping"))?.enabled){ console.log("  ⚠ bỏ qua ủy thác offline (cần hook offline, goto, set, auto): bật server bằng GAME_TEST=1"); await A.room.leave(); return; }
  try{
  const NV="tinh_dau_ngoai_vi", me=b=>b.room.state.players?.get(b.room.sessionId);
  const objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const autoOp=async(b,op,more={})=>{ b.autoMsg=null; b.room.send("auto",{op,...more}); await waitFor(()=>b.autoMsg,1500); return b.autoMsg; };
  async function rejoin(b){ await b.room.leave(); await sleep(300); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>me(b)&&b.bag&&b.owned,3000); }
  async function warp(b,mapId,x,y){ b.travel=null; b.room.send("test",{op:"warp",mapId,x,y}); await waitFor(()=>b.travel?.mapId===mapId,4000); await rejoin(b); }
  /** Thoát (hồn thú quanh đó đã dọn để không bị hạ lúc chờ) với lần ủy thác lùi `ago` giây, vào lại, chờ tin `offline` (null nếu không có). */
  async function away(ago,ms=4000){ await test(A,"clear"); await test(A,"offline",{ago}); await rejoin(A); return await waitFor(()=>A.offMsg,ms)?A.offMsg:null; }
  await waitFor(()=>me(A)&&A.bag&&A.owned,3000);

  // ---- Thoát trong làng Thánh Hồn Thôn (vùng an toàn): không ủy thác ----
  const tv=npcSpot("thanh_hon_thon","to_van_dao"); await test(A,"goto",{x:tv.x,y:tv.y+16});
  let h=await test(A,"offline");
  let m=await away(H,1500);
  ok(h&&h.zone===null&&!m,`thoát trong làng (vùng an toàn): không ủy thác (vùng ${h?.zone}, tin ${JSON.stringify(m)})`);

  // ---- Tinh Đấu Ngoại vi: vùng nông nhất, võ hồn cấp 21, 2 hồn hoàn ----
  const ar=objsOf(NV).find(o=>o.type==="arrive"&&o.name==="tu_nac_dinh_thanh");
  await warp(A,NV,ar.x,ar.y);
  const zy=z=>parseLevelRange(z.properties?.find(q=>q.name==="years")?.value)??[0,0];
  const zs=objsOf(NV).filter(o=>o.type==="zone").sort((a,b)=>zy(a)[1]-zy(b)[1]), shallow=zs[0], deep=zs.at(-1);
  /** Đứng ở một điểm đi được trong vùng `z` mà hook xác nhận là vùng ủy thác (trả kết quả hook, null nếu không tìm được). */
  async function stand(z){
    for(const fy of [0.5,0.35,0.65,0.2,0.8]) for(const fx of [0.5,0.35,0.65,0.2,0.8]){
      const x=Math.round(z.x+z.width*fx), y=Math.round(z.y+z.height*fy); await test(A,"goto",{x,y});
      if(Math.hypot(me(A).x-x,me(A).y-y)<1){ const o=await test(A,"offline"); if(o?.zone===z.name) return o; }
    }
    return null;
  }
  const act=A.owned.active; await test(A,"set",{rowId:act,level:21,rings:[423,812]});
  h=await stand(shallow);
  ok(h,`đứng trong vùng ${shallow.name} (${zy(shallow).join("–")} năm): thoát ở đây được ủy thác (đồng hồ lịch ${h?.clock})`);
  const frozen=/^frozen/.test(h?.clock??"");
  // Không nhặt hồn cốt / hồn hạch (mỗi món một ô) để một giờ không đầy túi; hồn hoàn vẫn nhặt (tối đa OFFLINE.rings).
  await autoOp(A,"set",{cfg:{bone:false,core:false}});
  await test(A,"auto",{used:0});
  const coin0=A.bag.honTe, ring0=qtyOf(A,RING_ITEM);
  m=await away(H);
  ok(m&&m.secs===H&&m.away>=H&&m.zone===shallow.name&&m.used<=m.secs&&m.used>m.secs-120,`vắng 1 giờ: tính ${m?.secs} giây, đã săn ${m?.used} giây ở ${m?.zone}`);
  ok(m&&m.kills>0&&m.xp>0&&!m.stop,`hạ ${m?.kills} hồn thú (${m?.weak} con quá sức), ${m?.xp} kinh nghiệm gốc${m?.stop?`, dừng: ${m.stop}, ${JSON.stringify(m.items)}`:""}`);
  await waitFor(()=>A.bag.honTe===coin0+(m?.coins??0),2000);
  ok(m&&m.coins>0&&A.bag.honTe-coin0===m.coins,`Hồn Tệ vào túi đúng bảng thưởng (${formatHonTe(m?.coins??0)})`);
  const rq=m?.items.find(i=>/^Hồn hoàn/.test(i.name))?.qty??0;
  ok(rq>0&&rq<=OFFLINE.rings&&qtyOf(A,RING_ITEM)-ring0===rq,`hồn hoàn vào túi: ${rq} chiếc (tối đa ${OFFLINE.rings}), túi ${ring0} → ${qtyOf(A,RING_ITEM)}`);
  ok(m&&Math.abs(m.left-(D-m.used))<=1&&Math.abs((A.autoMsg?.left??-9)-m.left)<1,`quỹ giờ treo hôm nay trừ đúng phần đã săn (còn ${autoTimeText(m?.left??0)})`);

  // ---- Vắng quá ngắn: không tính ----
  m=await away(OFFLINE.minSecs-60,1500);
  ok(!m,`vắng dưới ${OFFLINE.minSecs} giây: không có bảng thưởng`);

  // ---- Quỹ chung với tự săn: còn 10 phút / hết giờ ----
  await test(A,"auto",{used:D-600});
  m=await away(1800);
  ok(m&&(frozen?m.secs===600:m.secs<=600)&&m.used<=m.secs&&m.left<=600-m.used+1,`còn 10 phút giờ treo hôm nay, vắng 30 phút: chỉ tính ${m?.secs} giây, còn ${m?.left?.toFixed(0)} giây`);
  await test(A,"auto",{used:D});
  m=await away(1800);
  ok(m&&m.secs===0&&m.kills===0&&m.stop==="hết giờ treo",`hết giờ treo hôm nay: không tính giây nào (${m?.stop})`);
  // Auto 2: hết giờ miễn phí nhưng còn quỹ Ủy Thác Lệnh 30 phút, vắng 1 giờ: tính 30 phút từ quỹ, quỹ trừ đúng phần đã săn.
  await test(A,"auto",{used:D,bonus:1800});
  m=await away(H); await waitFor(()=>A.autoMsg&&Math.abs(A.autoMsg.bonus-(m?.bonus??-9))<=1,2000);
  const info=await test(A,"auto");
  ok(m&&(frozen?m.secs===1800:m.secs<=1800)&&m.kills>0&&Math.abs(m.bonusUsed-m.used)<=1&&Math.abs(info?.bonus-(1800-m.used))<=1&&info?.used>=D&&Math.abs(m.left-info.bonus)<=1,
    `hết giờ miễn phí, quỹ Ủy Thác Lệnh 30 phút, vắng 1 giờ: tính ${m?.secs} giây, dùng ${m?.bonusUsed} giây từ quỹ, quỹ còn ${info?.bonus?.toFixed(0)} giây`);
  await test(A,"auto",{bonus:0});

  // ---- Qua 00:00 (đồng hồ lịch đứng yên 12:00 của GAME_TEST): mỗi ngày một quỹ; không nhặt hồn hoàn / hồn cốt / hồn hạch ----
  if(frozen){
    await autoOp(A,"set",{cfg:{ring:-1,bone:false,core:false}});
    await test(A,"auto",{used:0});
    const r1=qtyOf(A,RING_ITEM);
    m=await away(13*H);
    ok(m&&m.secs===13*H&&Math.abs(m.left-(D-Math.max(0,m.used-H)))<=1,`vắng 13 giờ qua 00:00: tính ${m?.secs/H} giờ (1 giờ hôm qua + 12 giờ hôm nay), hôm nay còn ${autoTimeText(m?.left??0)}`);
    ok(m&&qtyOf(A,RING_ITEM)===r1&&!m.items.some(i=>/^Hồn hoàn/.test(i.name)),"bộ lọc nhặt của tự săn (ring = −1): không nhận hồn hoàn");
    await autoOp(A,"set",{cfg:{}});
  } else console.log(`  ⚠ bỏ qua phần chia quỹ qua 00:00: đồng hồ lịch ${h?.clock} (cần GAME_TEST không đặt BOSS_CLOCK)`);

  // ---- Vùng quá sức: võ hồn cấp 1 ở vùng sâu nhất ----
  h=await stand(deep); await test(A,"set",{rowId:act,level:1,rings:[]});
  await test(A,"auto",{used:0});
  m=await away(H);
  ok(h&&m&&m.kills===0&&m.weak>0&&m.stop==="vùng quá sức",`cấp 1 ở ${deep.name} (${zy(deep).join("–")} năm): không hạ được con nào (${m?.weak} con quá sức, ${m?.stop})`);

  // ---- E2 (#413): túi đầy chỉ vì trang bị rơi thì bỏ món đó, vẫn săn tiếp (không dừng "túi đầy"), báo số món bỏ ----
  await test(A,"set",{rowId:act,level:21,rings:[423,812]}); h=await stand(shallow);
  await autoOp(A,"set",{cfg:{ring:-1,bone:false,core:false}});
  const free=()=>A.bag.slots-looseOf(A).length;
  for(const i of looseOf(A).filter(i=>i.code===RING_ITEM).slice(0,Math.max(0,6-free()))) A.room.send("discard",{id:i.id});
  await waitFor(()=>free()>=6,2000);
  const fill=Math.max(0,free()-6);
  for(let i=0;i<fill;i++) await test(A,"gear",{tpl:"vu_khi_chi_bao"});
  ok(await waitFor(()=>free()===6,3000),`làm đầy túi bằng ${fill} món trang bị: còn ${free()} ô trống (cần đúng 6)`);
  await test(A,"auto",{used:0});
  m=await away(H);
  ok(m&&m.stop!=="túi đầy"&&m.kills>0&&m.used>m.secs-120&&m.equipLost>0,`túi đầy vì trang bị: vẫn săn đủ ${m?.used}/${m?.secs} giây (${m?.kills} con), bỏ ${m?.equipLost} món (dừng: ${m?.stop})`);
  await test(A,"gear",{clear:true}); await autoOp(A,"set",{cfg:{}}); await waitFor(()=>free()>6,2000);

  // ---- Túi đầy: dừng sớm, chỉ trừ quỹ phần đã săn ----
  await test(A,"set",{rowId:act,level:21,rings:[423,812]}); h=await stand(shallow);
  await test(A,"give",{code:RING_ITEM,qty:Math.max(0,free()-1),years:20}); await waitFor(()=>free()===1,2000);
  await test(A,"auto",{used:0});
  m=await away(H);
  ok(m&&m.stop==="túi đầy"&&m.used<m.secs&&free()===0&&Math.abs(m.left-(D-m.used))<=1,`túi đầy: dừng sau ${m?.used}/${m?.secs} giây, quỹ chỉ trừ phần đã săn`);
  } finally { await A.room.leave().catch(()=>{}); }
}

async function syncViewTest(){
  console.log("[11.4] Đồng bộ theo vùng gần, hồn thú ngủ, bản đồ nhỏ");
  ok(SYNC_VIEW.r<SYNC_VIEW.out&&SYNC_VIEW.out<SYNC_VIEW.fx&&SYNC_VIEW.wake>=SYNC_VIEW.out,`SYNC_VIEW: vào ${SYNC_VIEW.r} < ra ${SYNC_VIEW.out} < fx ${SYNC_VIEW.fx}, ngủ ngoài ${SYNC_VIEW.wake} pixel`);
  const V=await bot("Gần","lam_dien_ba_vuong_long",{sex:0,hair:1,hairCol:2,outfitCol:1},true);
  const W=await bot("Xa","lam_dien_ba_vuong_long",{sex:1,hair:1,hairCol:1,outfitCol:3},true);
  if(!(await test(V,"ping"))?.enabled){ console.log("  ⚠ bỏ qua 11.4 (cần hook view, warp, goto): bật server bằng GAME_TEST=1"); await V.room.leave(); await W.room.leave(); return; }
  const MAP="tinh_dau_ngoai_vi", objs=JSON.parse(readFileSync(new URL(`../../shared/assets/${mapFileOf(MAP)}.json`,import.meta.url),"utf8")).layers.flatMap(l=>l.objects??[]);
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
  // R5 (#432): tin mini lọc theo RADAR.far. Người lạ ngoài bán kính KHÔNG có trong tin (không lộ vị trí), chính mình luôn có.
  const farPx=dist(me(V),me(W)), miniHas=(b,id)=>b.mini?.p?.some((v,i)=>i%3===0&&v===id);
  V.mini=null; await waitFor(()=>V.mini?.p?.length,2500); await sleep(1200);
  ok(farPx>RADAR.far*16,`hai bot cách ${Math.round(farPx/16)} ô, xa hơn RADAR.far = ${RADAR.far} ô`);
  ok(miniHas(V,vsid)&&!miniHas(V,sid)&&!miniHas(W,vsid),"tin mini: người lạ ngoài RADAR.far không có trong tin của nhau, chính mình có");
  // Đồng đội tổ đội ở xa vẫn có (luật R5).
  W.room.send("party",{op:"invite",name:V.name}); await sleep(300); V.room.send("party",{op:"accept",name:W.name});
  await waitFor(()=>V.party?.members?.length===2,2500);
  V.mini=null; ok(await waitFor(()=>miniHas(V,sid),3000),"tin mini: đồng đội tổ đội ở xa có trong tin");
  const k=V.mini?.p?.indexOf(sid)??-1;
  ok(k>=0&&Math.abs(V.mini.p[k+1]-Math.floor(me(W).x/16))<=2&&Math.abs(V.mini.p[k+2]-Math.floor(me(W).y/16))<=2,`tin mini: vị trí theo ô ${V.mini?.p?.slice(k+1,k+3)}`);
  V.room.send("party",{op:"leave"}); await waitFor(()=>!V.party||V.party.members?.length<2,2500);
  V.mini=null; await waitFor(()=>V.mini?.p?.length,2500); await sleep(1200);
  ok(!miniHas(V,sid),"rời tổ đội: người ở xa lại biến khỏi tin mini");
  // Chống gian lận (#166): sid ở xa (lấy từ tin mini) không đổi được ra tên qua lời mời tổ đội.
  /** Khung tổ đội mới nhất của `b` (xin `party {op:"get"}`, chờ tin về): đọc sau khi server đã xử lý tin của người kia. */
  const partyNow=async b=>{ const n=b.partyMsgs; b.room.send("party",{op:"get"}); await waitFor(()=>b.partyMsgs>n,2000); return b.party; };
  const inviteSid=async()=>{ const l=V.logs.length; V.room.send("party",{op:"invite",sid}); await waitFor(()=>V.logs.length>l,2000); return V.logs.slice(l).join(" | "); };
  { const t=await inviteSid(), wp=await partyNow(W);
    ok(/không còn ở đây/.test(t)&&!t.includes(W.name)&&!!wp&&!wp.invites.length,`mời tổ đội bằng sid của hồn sư ở xa: bị từ chối, không lộ tên (${t})`); }
  // Lại gần dưới SYNC_VIEW.r: thấy nhau.
  await place(W,{x:west.x+48,y:west.y+16});
  ok(await waitFor(()=>V.room.state.players.has(sid)&&W.room.state.players.has(vsid),1500),`lại gần (${Math.round(dist(me(W),me(V)))} pixel): hai bên thấy nhau`);
  V.mini=null; ok(await waitFor(()=>miniHas(V,sid),3000),"tin mini: người lạ trong RADAR.far (đang gần) có trong tin");
  // Bấm vào hồn sư đang thấy (sid): lời mời tới đúng người, có tên người mời; từ chối để dọn.
  { const t=await inviteSid(), wp=await partyNow(W);
    ok(wp?.invites?.some(i=>i.name===V.name)&&t.includes(W.name),`mời tổ đội bằng sid của hồn sư đang thấy: W nhận lời mời của V (${t})`);
    W.room.send("party",{op:"decline",name:V.name}); const wq=await partyNow(W); ok(!!wq&&!wq.invites.length,"W từ chối: hết lời mời"); }
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
 * Tự đi tới cờ (R4 #431; BOT_ONLY=flag): cùng bản đồ, xuyên một cổng, bị chặn. Client (GameScene.flagTick) chỉ lái hướng đi bằng `input` và gửi
 * `travel` khi server báo đang đứng trên cổng; bot lặp lại đúng vòng đó với cùng hàm dùng chung (autoLeg, findLongPath) và `route` thật
 * của tin "daily", để kiểm đường dữ liệu trên bản đồ ×8 thật: đường đi dài, cổng có thật, server không có lệnh dịch chuyển.
 */
async function flagTest(){
  console.log("[R4 #431] Tự đi tới cờ: cùng bản đồ, xuyên cổng, bị chặn");
  const HT="thanh_hon_thon", ND="nac_dinh_thanh";
  const T=await bot("Đi cờ","kim_vu_mieu_ung",{sex:1,hair:0,hairCol:3,outfitCol:2});
  const me=()=>T.room.state.players?.get(T.room.sessionId);
  await waitFor(()=>me()&&T.daily,3000);
  const gridOf=m=>solidGrid(JSON.parse(readFileSync(mapUrl(m),"utf8")));
  const navOf=new Map(), nav=(m,g)=>{ if(!navOf.has(m)) navOf.set(m,buildNav(g,AUTO_MOVE.nav.block)); return navOf.get(m); };
  const objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const near=()=>Math.max(3,me().spd*(1/TICK_RATE+0.05));
  const here=()=>T.room.state.mapId;
  async function rejoin(){
    const t=T.travel; await T.room.leave(); await sleep(250); T.mapId=t.mapId; await enter(T,t.roomId??undefined);
    await waitFor(()=>me(),3000); T.room.send("quest",{op:"get"}); // không chờ tin daily: autoWalk chờ khi cần route, như GameScene.flagTick
  }
  /**
   * Một lần "tự đi" như GameScene.flagTick: chặng cờ / cổng theo autoLeg, đường findLongPath, lái hướng bằng `input`, kẹt 5 giây thì dừng,
   * đứng trên cổng thì `travel` rồi vào bản đồ mới. Trả "arrived" | "none" | "stuck" | "gate" | "timeout".
   */
  async function autoWalk(goal,maxMs=120000){
    const t0=Date.now(); let best=Infinity, bestT=Date.now(), mapAt=here();
    while(Date.now()-t0<maxMs){
      if(here()!==goal.map&&!T.daily&&!(await waitFor(()=>T.daily,AUTOWALK.gateSecs*1000))) return "none"; // vừa qua cổng: chờ tin daily có route
      const leg=autoLeg(here(),{map:goal.map,tile:goal.tx!=null},T.daily?.route??{});
      if(leg.k==="arrived") return "arrived";
      if(leg.k==="none") return "none";
      const g=gridOf(here()), p=me(), raw=objsOf(here());
      let tx, ty;
      if(leg.k==="flag"){ tx=goal.tx*TILE; ty=goal.ty*TILE; }
      else { const o=raw.find(q=>q.type==="portal"&&(q.properties??[]).find(z=>z.name==="to")?.value===leg.to); if(!o) return "none"; tx=o.x+o.width/2; ty=o.y+o.height/2; }
      if(mapAt!==here()){ mapAt=here(); best=Infinity; bestT=Date.now(); }
      if(leg.k==="gate"&&T.portal?.name&&T.portal.to===leg.to){
        T.room.send("input",{x:0,y:0}); T.travel=null; T.room.send("travel",{portal:T.portal.name});
        if(!(await waitFor(()=>T.travel?.mapId===leg.to,AUTOWALK.gateSecs*1000))) return "gate";
        await rejoin(); continue;
      }
      const d=Math.hypot(tx-p.x,ty-p.y)/TILE;
      if(leg.k==="flag"&&d<AUTOWALK.arrive){ T.room.send("input",{x:0,y:0}); return "arrived"; }
      if(d<best-AUTOWALK.progress){ best=d; bestT=Date.now(); } else if(Date.now()-bestT>AUTOWALK.stuckSecs*1000){ T.room.send("input",{x:0,y:0}); return "stuck"; }
      const path=findLongPath(g,nav(here(),g),p,{x:tx,y:ty},AUTO_MOVE.nav.look), end=path.at(-1);
      if(!end||Math.hypot(end.x-tx,end.y-ty)>TILE*2){ T.room.send("input",{x:0,y:0}); return "none"; }
      // Đi hết đoạn này (như goal của GameScene): tới từng điểm, bỏ khi kẹt 0,5 giây không gần thêm.
      let i=0, dBest=Infinity, dT=Date.now();
      while(i<path.length&&Date.now()-t0<maxMs){
        const q=me(); let w=path[i], L=Math.hypot(w.x-q.x,w.y-q.y);
        while(L<near()&&i<path.length-1){ w=path[++i]; L=Math.hypot(w.x-q.x,w.y-q.y); dBest=Infinity; dT=Date.now(); }
        if(L<near()) break;
        if(Date.now()-dT>500){ if(L>dBest-2) break; dBest=L; dT=Date.now(); }
        if(leg.k==="gate"&&T.portal?.name) break; // server báo đã đứng trên cổng
        T.room.send("input",{x:+((w.x-q.x)/L).toFixed(2),y:+((w.y-q.y)/L).toFixed(2)}); await sleep(50);
      }
      T.room.send("input",{x:0,y:0}); await sleep(80);
    }
    T.room.send("input",{x:0,y:0}); return "timeout";
  }
  /** Ô thoáng cách (cx, cy) chừng `r` ô theo hướng a, đi bộ tới được từ vị trí đang đứng (cùng vùng liên thông, không phải ô chặn). */
  const reachable=(g,nv,from,p)=>{ const a=navNode(nv,from.x,from.y), b=navNode(nv,p.x,p.y); return a>=0&&b>=0&&nv.region[a]===nv.region[b]; };

  if(!(await test(T,"ping"))?.enabled){ console.log("  ⚠ bỏ qua tự đi tới cờ (cần hook goto, down): bật server bằng GAME_TEST=1"); await T.room.leave(); return; }
  // 1. Cùng bản đồ: cờ xa (≥ 50 ô), phải đi vòng vật cản bằng đường dài.
  await test(T,"clear",{all:true}); T.room.send("input",{x:0,y:0});
  { const g=gridOf(HT), nv=nav(HT,g), p0={x:me().x,y:me().y}; let flag=null;
    for(let r=60;r<=140&&!flag;r+=10) for(let a=0;a<24&&!flag;a++){
      const tx=Math.floor(p0.x/TILE+Math.cos(a*Math.PI/12)*r), ty=Math.floor(p0.y/TILE+Math.sin(a*Math.PI/12)*r), x=(tx+.5)*TILE, y=(ty+.5)*TILE;
      if(tx<2||ty<2||tx>=g.MW-2||ty>=g.MH-2||isSolidTile(g,tx,ty)||hits(g,x,y,PLAYER_HW+1,PLAYER_HH+1)||!reachable(g,nv,p0,{x,y})) continue;
      const path=findLongPath(g,nv,p0,{x,y},AUTO_MOVE.nav.look), end=path.at(-1);
      if(end&&Math.hypot(end.x-x,end.y-y)<TILE&&!clearLine(g,p0,{x,y})) flag={tx:tx+.5,ty:ty+.5,len:pathLength(p0,path)};
    }
    if(!flag) console.log("  ⚠ bỏ qua cờ cùng bản đồ: không có ô xa bị chắn quanh",p0.x.toFixed(0),p0.y.toFixed(0));
    else {
      const res=await autoWalk({map:HT,tx:flag.tx,ty:flag.ty}), q=me(), d=Math.hypot(q.x-flag.tx*TILE,q.y-flag.ty*TILE)/TILE;
      ok(res==="arrived"&&d<AUTOWALK.arrive+1,`cờ cùng bản đồ: đường ${(flag.len/TILE).toFixed(0)} ô vòng vật cản, ${res}, còn cách cờ ${d.toFixed(1)} ô (server tính vị trí, không dịch chuyển)`);
      ok(here()===HT,"cùng bản đồ: không đổi phòng");
    }
  }
  // 2. Xuyên một cổng: tới Nặc Đinh Thành rồi đi tiếp tới một ô trong bản đồ mới.
  { ok(T.daily.route?.[ND]===ND,`route từ ${MAPS[HT].name}: tới ${MAPS[ND].name} qua cổng trực tiếp (${JSON.stringify(T.daily.route)})`);
    const res1=await autoWalk({map:ND,tx:null,ty:null});
    ok(res1==="arrived"&&here()===ND,`đi tới bản đồ ${MAPS[ND].name} qua cổng thật: ${res1}, đang ở ${MAPS[here()]?.name}`);
    const g=gridOf(ND), nv=nav(ND,g), p0={x:me().x,y:me().y}; let flag=null;
    for(let r=30;r<=90&&!flag;r+=10) for(let a=0;a<24&&!flag;a++){
      const tx=Math.floor(p0.x/TILE+Math.cos(a*Math.PI/12)*r), ty=Math.floor(p0.y/TILE+Math.sin(a*Math.PI/12)*r), x=(tx+.5)*TILE, y=(ty+.5)*TILE;
      if(tx<2||ty<2||tx>=g.MW-2||ty>=g.MH-2||isSolidTile(g,tx,ty)||hits(g,x,y,PLAYER_HW+1,PLAYER_HH+1)||!reachable(g,nv,p0,{x,y})) continue;
      const end=findLongPath(g,nv,p0,{x,y},AUTO_MOVE.nav.look).at(-1); if(end&&Math.hypot(end.x-x,end.y-y)<TILE) flag={tx:tx+.5,ty:ty+.5};
    }
    ok(!!flag,"có ô cờ đi được trong bản đồ mới");
    if(flag){ const res2=await autoWalk({map:ND,tx:flag.tx,ty:flag.ty}), q=me(), d=Math.hypot(q.x-flag.tx*TILE,q.y-flag.ty*TILE)/TILE;
      ok(res2==="arrived"&&d<AUTOWALK.arrive+1,`tiếp tục tới cờ trong ${MAPS[ND].name}: ${res2}, còn cách ${d.toFixed(1)} ô`); }
    // Đi ngược về: cờ ở bản đồ cũ, chặng đầu là cổng (route từ bản đồ mới).
    ok(T.daily.route?.[HT]===HT,`route từ ${MAPS[ND].name} về ${MAPS[HT].name} là cổng trực tiếp`);
    const res3=await autoWalk({map:HT,tx:null,ty:null}); ok(res3==="arrived"&&here()===HT,`đi ngược lại ${MAPS[HT].name} qua cổng: ${res3}`);
  }
  // 3b. Server không nhận lệnh dịch chuyển: input lạ (toạ độ đích) bị bỏ qua, chỉ hướng đi.
  { const p=me(), x0=p.x, y0=p.y;
    T.room.send("input",{x:1,y:0,tx:x0+500,ty:y0+500}); await sleep(300); T.room.send("input",{x:0,y:0}); await sleep(150);
    ok(Math.hypot(me().x-x0,me().y-y0)<PLAYER_SPEED,`input kèm toạ độ đích không dịch chuyển (đi ${Math.hypot(me().x-x0,me().y-y0).toFixed(0)} px, tối đa ${PLAYER_SPEED} px/giây)`); }
  // 3. Bị chặn: ô chặn không đặt được cờ, ô không cùng vùng liên thông không có đường, bản đồ không có cổng tới (sân đấu), cổng bị từ chối.
  { const g=gridOf(HT), nv=nav(HT,g); let solid=null;
    for(let y=0;y<g.MH&&!solid;y++) for(let x=0;x<g.MW&&!solid;x++) if(isSolidTile(g,x,y)) solid={x,y};
    ok(!!solid&&isSolidTile(g,solid.x,solid.y),"ô chặn: client từ chối đặt cờ (isSolidTile)");
    let isle=null; const p0={x:me().x,y:me().y};
    for(let y=2;y<g.MH-2&&!isle;y+=3) for(let x=2;x<g.MW-2&&!isle;x+=3){ const px=(x+.5)*TILE, py=(y+.5)*TILE;
      if(!isSolidTile(g,x,y)&&navNode(nv,px,py)>=0&&!reachable(g,nv,p0,{x:px,y:py})) isle={x:x+.5,y:y+.5}; }
    if(isle){ const res=await autoWalk({map:HT,tx:isle.x,ty:isle.y},8000); ok(res==="none"&&Math.hypot(me().x-p0.x,me().y-p0.y)<TILE,`ô ở vùng tách biệt (${isle.x},${isle.y}): "không có đường", đứng yên`); }
    else console.log("  ⚠ bỏ qua vùng tách biệt: bản đồ chỉ có một vùng liên thông");
    ok(autoLeg(HT,{map:"dai_dau_hon_truong",tile:false},T.daily.route).k==="none"&&T.daily.route?.dai_dau_hon_truong===undefined,"bản đồ không có cổng đi bộ tới (sân đấu): không có đường, không tự dùng truyền tống / Hồi Thành Phù");
    // Cổng bị từ chối: xin qua cổng khi không đứng trong cổng (client sửa / lỗi thời gian) thì server từ chối, không dịch chuyển.
    const portal=objsOf(HT).find(o=>o.type==="portal"&&(o.properties??[]).find(z=>z.name==="to")?.value===ND);
    await test(T,"goto",{x:p0.x,y:p0.y}); T.travel=null; const l=T.logs.length; T.room.send("travel",{portal:portal.name}); await sleep(700);
    ok(!T.travel&&T.logs.slice(l).some(t=>/đứng trong cổng/.test(t))&&here()===HT,`xin qua cổng khi không đứng trong cổng: server từ chối ("${T.logs.at(-1)}"), không dịch chuyển`);
  }
  // 5. Hai cổng liên tiếp (#516): Thánh Hồn Thôn → Nặc Đinh Thành → Tinh Đấu Ngoại vi. Vào Nặc Đinh Thành chưa có tin daily mà vẫn phải đi tiếp.
  { const far="tinh_dau_ngoai_vi";
    ok(T.daily?.route?.[far]===ND&&autoLeg(HT,{map:far,tile:false},T.daily.route).k==="gate",`route: ${MAPS[far].name} cách hai cổng, chặng đầu là ${MAPS[ND].name}`);
    let hops=0; T.room.onMessage("travel",()=>{hops++;}); const first=T.room.sessionId;
    const res=await autoWalk({map:far,tx:null,ty:null},240000);
    ok(res==="arrived"&&here()===far&&first!==T.room.sessionId,`đi hai cổng liền: ${res}, đang ở ${MAPS[here()]?.name}`); }
  await T.room.leave();
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
 * #111 Thương nhân lưu động ở trại cổng: dữ liệu (mọi bản đồ săn trừ Thánh Hồn Thôn có đúng một chỗ trong trại `spawn`, đứng được,
 * ngoài cổng / truyền tống trận; thành, Lõi Tinh Đấu, sân đấu không có; bảng hàng CAMP_SHOP không rẻ hơn SHOP, không mở rộng túi). Với hook:
 * bot M (tài khoản mới) tới trại Tinh Đấu Ngoại vi, đứng xa thì nói chuyện / mua / bán bị từ chối; lại gần thì mở hộp thoại, mua đan và
 * Hồi Thành Phù đúng giá trại, đan lớn bị từ chối, mở rộng túi bị từ chối, bán hồn hoàn đúng giá trong thành và mua lại được; thoát
 * vào lại thì túi và Hồn Tệ giữ nguyên. Sang trại Cực Bắc (bản đồ khác) vẫn mua được.
 */
async function campTest(){
  console.log("[#111] Thương nhân lưu động ở trại cổng bản đồ săn");
  const rawOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")); // 11.3 / 11.5: đúng file server đang dùng (MAP_V1)
  const spots={};
  for(const id of Object.keys(MAPS)){
    const raw=rawOf(id), objs=raw.layers.flatMap(l=>l.objects??[]), sp=campMerchantSpot(raw,id); spots[id]=sp;
    const want=MAPS[id].kind==="hunt"&&id!=="thanh_hon_thon";
    if(!want){ ok(!sp,`${MAPS[id].name}: không có thương nhân lưu động`); continue; }
    const s=objs.find(o=>o.type==="spawn"), g=solidGrid(raw);
    const inR=(o,x,y)=>x>=o.x&&x<o.x+o.width&&y>=o.y&&y<o.y+o.height;
    const arr=objs.filter(o=>o.type==="arrive").map(o=>Math.hypot(o.x-sp?.x,o.y-sp?.y)), near=Math.min(...arr);
    ok(sp&&inR(s,sp.x,sp.y)&&!hits(g,sp.x,sp.y,PLAYER_HW,PLAYER_HH)&&!objs.some(o=>(o.type==="portal"||o.type==="waypoint")&&inR(o,sp.x,sp.y))
      &&near<=NPC_RANGE-CAMP_STEP&&!hits(g,sp.x,sp.y+16,PLAYER_HW,PLAYER_HH),
      `${MAPS[id].name}: thương nhân lưu động đứng ở ${s?.name} (${sp?.x},${sp?.y}), đứng được, ngoài cổng / truyền tống trận, cách điểm tới ${near.toFixed(0)} px (≤ ${NPC_RANGE-CAMP_STEP}: lệch vài bước vẫn nói chuyện được)`);
  }
  const def=npcDef(CAMP_MERCHANT), price=c=>CAMP_SHOP.find(r=>r.code===c)?.price, town=c=>SHOP.find(r=>r.code===c)?.price;
  ok(def?.role==="shop"&&shopOf(CAMP_MERCHANT)===CAMP_SHOP&&shopOf("thuong_nhan")===SHOP&&!shopExpands(CAMP_MERCHANT)&&shopExpands("thuong_nhan"),
    "thương nhân lưu động: vai trò shop, bảng hàng riêng, không mở rộng túi");
  ok(CAMP_SHOP.every(r=>town(r.code)&&r.price>=town(r.code))&&!price("dai_hoi_huyet_dan")&&price("hoi_thanh_phu"),
    `bảng hàng trại: ${CAMP_SHOP.map(r=>`${itemDef(r.code).name} ${formatHonTe(r.price)}`).join(", ")} (không rẻ hơn trong thành, không có đan lớn)`);
  const M=await bot("Lữ khách","kim_vu_mieu_ung",{sex:0,hair:1,hairCol:2,outfitCol:3});
  if(!(await test(M,"ping"))?.enabled){ console.log("  ⚠ bỏ qua thương nhân lưu động (cần hook warp, goto, coin, give): bật server bằng GAME_TEST=1"); await M.room.leave(); return; }
  const mme=()=>M.room.state.players?.get(M.room.sessionId);
  await waitFor(()=>mme()&&M.bag,3000);
  async function rejoin(){ await M.room.leave(); await sleep(300); M.mapId=(await post("/api/me",{token:M.token})).mapId; await enter(M); await waitFor(()=>mme()&&M.bag,3000); }
  async function warp(mapId,x,y){
    M.travel=null; M.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>M.travel?.mapId===mapId,4000),`warp -> ${MAPS[mapId].name}`);
    await rejoin();
  }
  const coin=async n=>{ await test(M,"coin",{n}); await waitFor(()=>M.bag?.honTe===n,1500); };
  const map="tinh_dau_ngoai_vi", sp=spots[map];
  if(!sp||!spots.cuc_bac_chi_dia){ ok(false,"thiếu chỗ đứng của thương nhân lưu động: bỏ phần thử với hook"); await M.room.leave(); return; }
  // Đứng xa (trong trại, ngoài NPC_RANGE): từ chối.
  const raw=rawOf(map), g=solidGrid(raw), s0=raw.layers.flatMap(l=>l.objects??[]).find(o=>o.type==="spawn");
  const far=[[0,0],[1,0],[0,1],[1,1]].map(([i,j])=>({x:s0.x+8+i*(s0.width-16),y:s0.y+8+j*(s0.height-16)}))
    .filter(q=>!hits(g,q.x,q.y,PLAYER_HW,PLAYER_HH)).sort((a,b)=>Math.hypot(b.x-sp.x,b.y-sp.y)-Math.hypot(a.x-sp.x,a.y-sp.y))[0];
  if(!far){ ok(false,"trại không có góc đứng được để thử đứng xa"); await M.room.leave(); return; }
  await warp(map,far.x,far.y); await test(M,"clear",{all:true}); await coin(1000);
  ok(Math.hypot(mme().x-sp.x,mme().y-sp.y)>NPC_RANGE&&await talk(M,CAMP_MERCHANT)===null&&/lại gần Thương nhân lưu động/.test(M.logs.at(-1)),
    `đứng cách ${Math.hypot(mme().x-sp.x,mme().y-sp.y).toFixed(0)} px: chưa nói chuyện được`);
  { const bk=bagKey(M); ok(/đứng cạnh thương nhân/.test(await trade(M,"buy",{code:"hoi_huyet_dan",qty:1}))&&bagKey(M)===bk,"đứng xa: mua bị từ chối, túi và Hồn Tệ không đổi"); }
  // Lại gần: mở hộp thoại, mua theo giá trại.
  await test(M,"goto",{x:sp.x,y:sp.y+16});
  ok(await talk(M,CAMP_MERCHANT)===CAMP_MERCHANT,"đứng cạnh thương nhân lưu động: mở hộp thoại");
  const hh=qtyOf(M,"hoi_huyet_dan"); let t=await trade(M,"buy",{code:"hoi_huyet_dan",qty:2,npc:CAMP_MERCHANT});
  ok(qtyOf(M,"hoi_huyet_dan")===hh+2&&M.bag.honTe===1000-2*price("hoi_huyet_dan"),`mua 2 Hồi Huyết Đan giá trại ${formatHonTe(2*price("hoi_huyet_dan"))} (${t})`);
  let ht=M.bag.honTe; t=await trade(M,"buy",{code:"hoi_thanh_phu",qty:1});
  ok(qtyOf(M,"hoi_thanh_phu")===1&&M.bag.honTe===ht-price("hoi_thanh_phu"),`mua Hồi Thành Phù giá trại ${formatHonTe(price("hoi_thanh_phu"))} (${t})`);
  { const bk=bagKey(M); t=await trade(M,"buy",{code:"dai_hoi_huyet_dan",qty:1}); ok(bagKey(M)===bk&&/không bán món này/.test(t),`đan lớn: thương nhân lưu động không bán (${t})`); }
  { const bk=bagKey(M), s=M.bag.slots; t=await trade(M,"expand",{npc:CAMP_MERCHANT}); ok(bagKey(M)===bk&&M.bag.slots===s&&/không mở rộng túi/.test(t),`mở rộng túi ở trại: từ chối (${t})`); }
  // Client gửi mã thương nhân đang mở hộp thoại: thương nhân trong thành không ở đây thì từ chối (không tính giá theo bảng khác).
  { const bk=bagKey(M); t=await trade(M,"buy",{code:"dai_hoi_huyet_dan",qty:1,npc:"thuong_nhan"}); ok(bagKey(M)===bk&&/đứng cạnh thương nhân/.test(t),`mua với mã thương nhân trong thành ở trại: từ chối (${t})`); }
  { const bk=bagKey(M); t=await trade(M,"buy",{code:"hoi_huyet_dan",qty:1,npc:"lao_kiet_khac"}); ok(bagKey(M)===bk&&/đứng cạnh thương nhân/.test(t),`mã NPC không phải thương nhân: từ chối (${t})`); }
  // Trại không phải vùng an toàn: đang giao chiến thì không mua bán.
  await test(M,"hurt",{pct:1});
  { const bk=bagKey(M); t=await trade(M,"buy",{code:"hoi_huyet_dan",qty:1,npc:CAMP_MERCHANT}); ok(bagKey(M)===bk&&/Đang giao chiến/.test(t),`đang giao chiến ở trại: mua bị từ chối (${t})`); }
  await sleep(TEAM_COMBAT_SECS*1000+300);
  await coin(10); { const bk=bagKey(M); t=await trade(M,"buy",{code:"hoi_hon_dan",qty:1}); ok(bagKey(M)===bk&&/Không đủ Hồn Tệ/.test(t),`thiếu Hồn Tệ: từ chối (${t})`); }
  // Bán hồn hoàn dư: giá như thương nhân trong thành (sellPrice); mua lại được ở trại.
  await test(M,"give",{code:RING_ITEM,qty:1,years:1000}); await waitFor(()=>M.bag.items.some(i=>i.code===RING_ITEM&&i.years===1000),1500);
  const ring=M.bag.items.find(i=>i.code===RING_ITEM&&i.years===1000), rp=sellPrice(ring);
  ht=M.bag.honTe; t=await trade(M,"sell",{id:ring.id});
  ok(!M.bag.items.some(i=>i.id===ring.id)&&M.bag.honTe===ht+rp,`bán hồn hoàn 1000 năm: +${formatHonTe(rp)} như trong thành (${t})`);
  ok(M.bag.buyback?.length===1,"thương nhân lưu động giữ món vừa bán để mua lại");
  t=await trade(M,"buyback",{key:M.bag.buyback[0].key});
  ok(M.bag.items.some(i=>i.code===RING_ITEM&&i.years===1000)&&M.bag.honTe===ht,`mua lại hồn hoàn ở trại đúng giá đã bán (${t})`);
  // Vào lại: túi và Hồn Tệ đã lưu.
  const keep=bagKey(M); await sleep(300); await rejoin();
  ok(M.room.state.mapId===map&&bagKey(M)===keep,"thoát vào lại: túi và Hồn Tệ giữ nguyên sau khi mua / bán ở trại");
  // Trại của bản đồ săn khác (Cực Bắc) cũng có.
  const cb=spots.cuc_bac_chi_dia; await warp("cuc_bac_chi_dia",cb.x,cb.y+16); await coin(1000);
  t=await trade(M,"buy",{code:"hoi_hon_dan",qty:1}); ok(M.bag.honTe===1000-price("hoi_hon_dan"),`trại Cực Bắc: mua Hồi Hồn Đan (${t})`);
  await M.room.leave();
}

/**
 * 11.3 / 11.5: bản đồ ×8 dựng bằng tools/maps (`<mapId>.v2.json`, mặc định; bản nào bật đường lùi MAP_V1 thì bỏ qua): diện tích, vùng
 * có tên giữ tên và niên hạn các vùng cũ, mật độ BEAST_DENSITY, giữ đúng cổng / điểm đến / mã truyền tống trận của bản cũ, tinh anh và
 * hang trong vùng; rồi đi trên từng bản: hồn thú đúng loài / niên hạn và không sát cổng, đi mọi cổng hai chiều xuất hiện đúng điểm
 * `arrive`, mở khóa mọi truyền tống trận. Cuối cùng (hook locfile): vị trí lưu ở file Tiled khác file đang dùng (hoặc dòng trước 11.5
 * khi bản đồ đã có bản ×8) thì vào ở trại cổng, cùng file thì giữ chỗ.
 */
async function bigMapTest(){
  const BIG=Object.keys(MAPS).filter(m=>mapFileOf(m)!==m);
  console.log(`[11.3 / 11.5] Bản đồ ×8 dựng bằng tools/maps: ${BIG.map(m=>MAPS[m].name).join(", ")||"không có"}`);
  if(!BIG.length){ console.log("  ⚠ bỏ qua bản đồ ×8: đang bật MAP_V1 cho mọi bản đồ"); return; }
  const objsOf=m=>m.layers.flatMap(l=>l.objects??[]), pr=(o,n)=>(o.properties??[]).find(q=>q.name===n)?.value;
  const fileOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")), oldOf=m=>JSON.parse(readFileSync(new URL(`../../shared/assets/${m}.json`,import.meta.url),"utf8"));
  const inR=(o,x,y)=>x>=o.x&&x<=o.x+o.width&&y>=o.y&&y<=o.y+o.height, sum=a=>a.reduce((s,z)=>s+pr(z,"count"),0);
  const gateKey=o=>[o.type,o.name,pr(o,"to")??"",pr(o,"arrive")??"",pr(o,"level")??"",pr(o,"boat")??""].join("|");
  for(const NV of BIG){
    const raw=fileOf(NV), old=oldOf(NV), objs=objsOf(raw), oldObjs=objsOf(old), k=raw.width*raw.height/(old.width*old.height), nm=MAPS[NV].name;
    // Lõi Tinh Đấu, Đại Đấu Hồn Trường giữ cỡ hợp lối chơi (chỉ làm đẹp, 11.5); bản đồ săn và thành trấn ×8.
    if(["boss","arena"].includes(MAPS[NV].kind)) ok(raw.width===old.width&&raw.height===old.height,`${nm}: giữ cỡ ${raw.width}×${raw.height} ô như bản cũ`);
    else ok(k>=7.5&&k<=8.5,`${nm}: diện tích ×${k.toFixed(2)}: ${raw.width}×${raw.height} ô (bản cũ ${old.width}×${old.height})`);
    const zs=objs.filter(o=>o.type==="zone"), zn=zonesByName(objs), oldZn=zonesByName(oldObjs), [ylo,yhi]=MAPS[NV].years??[0,0]; // thành trấn: không vùng hồn thú
    const total=sum(zs), oldTotal=sum(oldObjs.filter(o=>o.type==="zone")), tiersOf=m=>new Set([...m.values()].map(z=>z.years)).size;
    ok(zs.every(z=>{ const y=parseLevelRange(pr(z,"years")); return y&&y[0]>=ylo&&y[1]<=yhi; })&&[...oldZn.values()].every(o=>zn.get(o.name)?.years===o.years)
      &&zn.size>=oldZn.size&&tiersOf(zn)===tiersOf(oldZn),
      `${nm}: ${zn.size} vùng có tên (${[...zn.keys()].join(", ")}) trong ${zs.length} mảnh, giữ tên và niên hạn ${oldZn.size} vùng cũ, niên hạn trong ${ylo}–${yhi} năm`);
    ok(total>=6*oldTotal&&total<=11*oldTotal,`${nm}: ${total} hồn thú thường theo BEAST_DENSITY (bản cũ ${oldTotal}, ×${(total/oldTotal).toFixed(1)})`);
    const lair=objs.find(o=>o.type==="boss"), es=objs.filter(o=>o.type==="elite"), oldEs=oldObjs.filter(o=>o.type==="elite");
    ok(same(es.map(e=>pr(e,"boss")).sort(),oldEs.map(e=>pr(e,"boss")).sort())&&es.every(e=>zs.some(z=>inR(z,e.x+e.width/2,e.y+e.height/2)))
      &&(!MAPS[NV].king||pr(lair,"boss")===MAPS[NV].king&&zs.some(z=>inR(z,lair.x+lair.width/2,lair.y+lair.height/2))),
      `${nm}: ${es.length} tinh anh như bản cũ${lair?` và hang ${lair.name}`:""} nằm trong vùng`);
    const wp=objs.filter(o=>o.type==="waypoint").map(o=>o.name), oldWp=oldObjs.filter(o=>o.type==="waypoint").map(o=>o.name);
    ok(oldWp.every(n=>wp.includes(n))&&(MAPS[NV].kind==="arena"?!wp.length:wp.length>=1&&wp.length<=3),`${nm}: truyền tống trận ${wp.join(", ")} (giữ mã cũ ${oldWp.join(", ")}, mã lưu DB không đổi)`);
    const gates=objs.filter(o=>o.type==="portal"||o.type==="arrive").map(gateKey).sort(), oldGates=oldObjs.filter(o=>o.type==="portal"||o.type==="arrive").map(gateKey).sort();
    ok(same(gates,oldGates),`${nm}: giữ đúng cổng và điểm đến của bản cũ (${objs.filter(o=>o.type==="portal").map(o=>o.name).join(", ")})`);
    // Điểm giữa hồ (`lake`, #118): Du Thủy của boss thế giới lặn ra đây; bản ×8 phải giữ, nằm trên nền nước.
    { const ol=oldObjs.find(o=>o.type==="lake"), lk=objs.find(o=>o.type==="lake"), gd=raw.layers.find(l=>l.name==="ground")?.data, wet=new Set([9,34,35]);
      if(ol) ok(lk&&wet.has(gd?.[Math.floor(lk.y/16)*raw.width+Math.floor(lk.x/16)]),`${nm}: giữ điểm giữa hồ "${ol.name}" (${lk?`${lk.x/16}, ${lk.y/16}, nền gid ${gd?.[Math.floor(lk.y/16)*raw.width+Math.floor(lk.x/16)]}`:"thiếu"})`); }
  }
  const B=await bot("Rừng lớn","kim_vu_mieu_ung",{sex:0,hair:2,hairCol:1,outfitCol:3});
  if(!(await test(B,"ping"))?.enabled){ console.log("  ⚠ bỏ qua phần đi trên bản đồ ×8 (cần hook warp, goto): bật server bằng GAME_TEST=1"); await B.room.leave(); return; }
  const bme=()=>B.room.state.players?.get(B.room.sessionId);
  async function rejoin(){ await B.room.leave(); await sleep(300); B.mapId=(await post("/api/me",{token:B.token})).mapId; await enter(B); await waitFor(()=>bme()&&B.bag,3000); }
  async function warp(mapId,x,y){ B.travel=null; B.room.send("test",{op:"warp",mapId,x,y}); await waitFor(()=>B.travel?.mapId===mapId,4000); await rejoin(); }
  /** Đứng giữa cổng `name` của bản đồ đang ở rồi đi cổng; phải tới `to` ở đúng điểm `arrive` của file Tiled bản đồ đích. */
  async function hop(objsHere,name,to){
    const p=objsHere.find(o=>o.type==="portal"&&o.name===name), ar=objsOf(fileOf(to)).find(o=>o.type==="arrive"&&o.name===pr(p,"arrive"));
    await test(B,"goto",{x:p.x+p.width/2,y:p.y+p.height/2}); await sleep(200);
    B.travel=null; B.room.send("travel",{portal:name});
    const went=await waitFor(()=>B.travel?.mapId===to,(pr(p,"boat")?BOAT_CAST:TRAVEL_CAST)*1000+3000); if(went) await rejoin();
    ok(went&&B.room.state.mapId===to&&Math.hypot(bme().x-ar.x,bme().y-ar.y)<1,`cổng "${name}" -> ${MAPS[to].name}, xuất hiện ở ${ar?.name} (${bme()?.x},${bme()?.y})`);
  }
  for(const NV of BIG){
    if(MAPS[NV].kind==="arena") continue; // sân đấu chỉ ArenaRoom mở (bài arenaTest), không cổng / điểm đến
    const objs=objsOf(fileOf(NV)), nm=MAPS[NV].name, total=sum(objs.filter(o=>o.type==="zone")), a0=objs.find(o=>o.type==="arrive");
    await warp(NV,a0.x,a0.y);
    ok(B.room.state.mapId===NV&&B.room.state.mapFile===mapFileOf(NV),`${nm}: phòng báo file bản đồ ${B.room.state.mapFile} (client tải đúng file này)`);
    if(total) ok(await waitFor(()=>[...B.room.state.beasts.values()].filter(x=>!x.rank).length>=total*0.9,8000),`${nm}: đã sinh ${[...B.room.state.beasts.values()].filter(x=>!x.rank).length}/${total} hồn thú thường`);
    if(total) checkGateClear(B,checkBeastYears(B)); // thành trấn: không hồn thú
    // Mọi cổng hai chiều: sang bản đồ kề rồi về bằng cổng của bản đó trỏ về đây.
    for(const p of objs.filter(o=>o.type==="portal")){
      const to=pr(p,"to"), there=objsOf(fileOf(to)), back=there.find(o=>o.type==="portal"&&pr(o,"to")===NV);
      await hop(objs,p.name,to); if(back) await hop(there,back.name,NV);
    }
    // Truyền tống trận: bước lên thì mở khóa.
    for(const w of objs.filter(o=>o.type==="waypoint")){
      const key=`${NV}:${w.name}`; B.wpHere=null; await test(B,"goto",{x:w.x+w.width/2,y:w.y+w.height/2});
      ok(await waitFor(()=>B.wpUnlock.includes(key),2000),`${nm}: truyền tống trận ${pr(w,"label")} mở khóa khi bước lên`);
    }
  }
  // 11.5: vị trí đã lưu chỉ có nghĩa trên đúng file Tiled lúc ghi (accounts.map_file). Hook locfile giả vị trí lưu ở phiên bản khác
  // (bản cũ khi ×8 là mặc định, hoặc bản ×8 khi bật MAP_V1) hoặc dòng trước 11.5 (NULL = bản cũ): vào lại thì ở trại cổng `spawn`.
  { const NV=BIG.includes("cuc_bac_chi_dia")?"cuc_bac_chi_dia":BIG[0], raw=fileOf(NV), objs=objsOf(raw), g=solidGrid(raw), nm=MAPS[NV].name;
    const sp=objs.filter(o=>o.type==="spawn").at(-1), os=objsOf(oldOf(NV)).filter(o=>o.type==="spawn").at(-1), cur=mapFileOf(NV), other=cur===NV?`${NV}.v2`:NV;
    // Chỗ đứng ngoài trại: tâm trại của bản cũ (trường hợp review: trại Cực Bắc cũ nằm giữa Băng Phong Cốc của bản ×8), không được thì trận / điểm tới.
    const P=[{x:os.x+os.width/2,y:os.y+os.height/2},...objs.filter(o=>o.type==="waypoint").map(o=>({x:o.x+o.width/2,y:o.y+o.height/2})),...objs.filter(o=>o.type==="arrive")]
      .map(q=>({x:Math.round(q.x),y:Math.round(q.y)})).find(q=>!hits(g,q.x,q.y,PLAYER_HW,PLAYER_HH)&&!inR(sp,q.x,q.y));
    const at=q=>Math.hypot(bme().x-q.x,bme().y-q.y)<1, inCamp=()=>inR(sp,bme().x,bme().y);
    await warp(NV,P.x,P.y);
    ok(B.room.state.mapId===NV&&at(P),`${nm}: tới (${P.x},${P.y}) ngoài trại cổng`);
    await rejoin(); ok(B.room.state.mapId===NV&&at(P),`${nm}: vị trí lưu cùng file ${cur} thì vào lại đúng chỗ (${bme()?.x},${bme()?.y})`);
    await test(B,"locfile",{file:other}); await rejoin();
    ok(B.room.state.mapId===NV&&inCamp(),`${nm}: vị trí lưu ở file ${other} (phiên bản khác) thì vào ở trại cổng (${bme()?.x.toFixed(0)},${bme()?.y.toFixed(0)})`);
    await test(B,"goto",{x:P.x,y:P.y}); await test(B,"locfile",{file:""}); await rejoin();
    ok(B.room.state.mapId===NV&&(cur===NV?at(P):inCamp()),`${nm}: vị trí lưu trước 11.5 (map_file NULL = bản cũ) ${cur===NV?"giữ nguyên":"vào ở trại cổng"} (${bme()?.x.toFixed(0)},${bme()?.y.toFixed(0)})`);
    // Bản đồ chưa có bản ×8: dòng trước 11.5 vẫn giữ vị trí (không đưa mọi người về trại). Bỏ bản đồ có `exit` (Lõi Tinh Đấu: đăng
    // xuất thì về bờ hồ Nội địa, BĐ6e); không còn bản đồ nào như vậy thì bỏ qua, phần lưu trữ đã có ở test:accounts.
    const V1M=Object.keys(MAPS).find(m=>MAPS[m].kind!=="arena"&&!MAPS[m].exit&&mapFileOf(m)===m&&m!==NV);
    if(V1M){ const a=objsOf(fileOf(V1M)).find(o=>o.type==="arrive"); await warp(V1M,a.x,a.y); await test(B,"locfile",{file:""}); await rejoin();
      ok(B.room.state.mapId===V1M&&at(a),`${MAPS[V1M].name} (chưa có bản ×8): vị trí lưu trước 11.5 giữ nguyên (${bme()?.x},${bme()?.y})`); }
  }
  await B.room.leave();
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
    ok(q.x>16&&q.y>16&&q.x<(JSON.parse(readFileSync(mapUrl(AT),"utf8")).width-3)*16&&!C.portal?.name&&C.room.state.mapId===AT,`${npcDef(id).name}: đi tiếp bị chặn ở (${q.x.toFixed(0)},${q.y.toFixed(0)}), vẫn ở Thiên Đấu Thành`);
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
  // Bản ×8 (11.5): mỗi tầng niên hạn có vùng mang tên bảng 5.3 (có thể thêm vùng có tên khác cùng niên hạn), vùng chia nhiều mảnh.
  const os=objs(LN), zn=zonesByName(os), es=os.filter(o=>o.type==="elite"), zbad=[], low=y=>parseLevelRange(y)?.[0]??0;
  const tiers=[...new Set([...zn.values()].map(z=>z.years))].sort((a,b)=>low(a)-low(b));
  ZT.forEach(([n,y,sp,el],i)=>{
    const z=zn.get(n); if(!z||z.years!==y||tiers[i]!==y||!same(z.beasts,sp)) zbad.push(n);
    if(sp.some(x=>beastIndex(x)<0||!beastSkillOf(x,parseLevelRange(y)[0])||!BONE_SKILLS[x])) zbad.push(`${n}: loài`);
    const e=es.filter(e=>inZone(z,e.x+e.width/2,e.y+e.height/2)), d=BOSSES[bossIndex(el)];
    if(e.length!==1||prop(e[0],"boss")!==el||d?.rank!==1||d.skills.length!==2||beastIndex(d.species)<0) zbad.push(`${n}: tinh anh`);
  });
  ok(tiers.length===4&&!zbad.length,`4 tầng niên hạn đúng bảng 5.3 (loài từ 1.000 năm có chiêu báo trước và kỹ năng hồn cốt, mỗi tầng 1 tinh anh): ${tiers.map(y=>`${[...zn.values()].filter(z=>z.years===y).map(z=>z.name).join(" / ")} ${y}`).join("; ")}`+(zbad.length?` sai: ${zbad.join(", ")}`:""));
  const K=BOSSES[bossIndex(M.king)], lr=os.filter(o=>o.type==="boss"), deep={name:ZT[3][0],rects:[...zn.values()].filter(z=>z.years===ZT[3][1]).flatMap(z=>z.rects)};
  ok(K?.rank===2&&K.hp===84&&K.skills.length>=2&&K.skills.length<=3&&(K.phase2?.skills.length||K.phase2?.split)&&[...K.skills,...K.phase2.skills].every(s=>s.warn>=1)
    &&lr.length===1&&prop(lr[0],"boss")===M.king&&inZone(deep,lr[0].x+lr[0].width/2,lr[0].y+lr[0].height/2),
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
    /** Đưa L tới một chỗ trống trong vùng tên `name` (thử từng mảnh chữ nhật; xa tinh anh và hang), dọn hồn thú quanh đó. */
    async function toZone(name){
      for(const z of zn.get(name)?.rects??[]) for(let y=z.y+40;y<z.y+z.height-40;y+=24) for(let x=z.x+40;x<z.x+z.width-40;x+=24){
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
    ok(await toZone(ZT[0][0]),"tới Rừng hoa độc");
    await test(L,"herb",{r:3,i:0}); let n0=h(), lg=await slay({species:"thuc_nhan_hoa",years:8000});
    ok(h()===n0&&!/tiên thảo/.test(lg),`Rừng hoa độc, số ngẫu nhiên 3% (tỉ lệ ${pc(hc[0])}): không rơi tiên thảo`);
    ok(await toZone(ZT[3][0]),"tới Lưỡng Nghi Nhãn");
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
  // Bản ×8 (11.5): mỗi tầng niên hạn có vùng mang tên bảng 5.3 (có thể thêm vùng có tên khác cùng niên hạn), vùng chia nhiều mảnh.
  const os=objs(HT), zn=zonesByName(os), es=os.filter(o=>o.type==="elite"), zbad=[], low=y=>parseLevelRange(y)?.[0]??0;
  const tiers=[...new Set([...zn.values()].map(z=>z.years))].sort((a,b)=>low(a)-low(b));
  ZT.forEach(([n,y,sp,el],i)=>{
    const z=zn.get(n); if(!z||z.years!==y||tiers[i]!==y||!same(z.beasts,sp)) zbad.push(n);
    if(sp.some(x=>beastIndex(x)<0||!beastSkillOf(x,parseLevelRange(y)[0])||!BONE_SKILLS[x])) zbad.push(`${n}: loài`);
    const e=es.filter(e=>inZone(z,e.x+e.width/2,e.y+e.height/2)), d=BOSSES[bossIndex(el)];
    if(e.length!==1||prop(e[0],"boss")!==el||d?.rank!==1||d.skills.length!==2||beastIndex(d.species)<0) zbad.push(`${n}: tinh anh`);
  });
  ok(tiers.length===4&&!zbad.length,`4 tầng niên hạn đúng bảng 5.3 (loài có chiêu báo trước và kỹ năng hồn cốt, mỗi tầng 1 tinh anh): ${tiers.map(y=>`${[...zn.values()].filter(z=>z.years===y).map(z=>z.name).join(" / ")} ${y}`).join("; ")}`+(zbad.length?` sai: ${zbad.join(", ")}`:""));
  // Chỉ Hải Thần Uyên sinh được hồn thú thường 100.000 năm (mục 5.3): mọi vùng của mọi bản đồ săn khác có mức trên dưới MAX_YEARS.
  const tops=Object.values(MAPS).filter(m=>m.kind==="hunt").flatMap(m=>objs(m.id).filter(o=>o.type==="zone"&&parseLevelRange(prop(o,"years"))?.[1]>=MAX_YEARS).map(o=>`${m.id}/${o.name}`)).filter((x,i,a)=>a.indexOf(x)===i);
  ok(same(tops,[`${HT}/Hải Thần Uyên`])&&RED_BEAST_CHANCE>0&&RED_BEAST_CHANCE<1,`chỉ ${tops.join(", ")} lên tới ${MAX_YEARS} năm (tỉ lệ ra đúng ${MAX_YEARS} năm mỗi lần sinh ${RED_BEAST_CHANCE*100}%)`);
  const K=BOSSES[bossIndex(M.king)], lr=os.filter(o=>o.type==="boss"), deep=zn.get(ZT[3][0]);
  ok(K?.rank===2&&K.hp===96&&kingYears(HT)===95000&&K.skills.length>=2&&K.skills.length<=3&&K.phase2?.skills.length&&[...K.skills,...K.phase2.skills].every(s=>s.warn>=1)
    &&lr.length===1&&prop(lr[0],"boss")===M.king&&inZone(deep,lr[0].x+lr[0].width/2,lr[0].y+lr[0].height/2),
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

    // Thú vương theo lịch (hook king): xuất hiện trong hang, niên hạn 95.000 năm (kingYears), máu x96 (#264).
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
  // Bản ×8 (11.5): vùng chia nhiều mảnh, mỗi tầng niên hạn có thể thêm vùng có tên khác (cùng niên hạn).
  const zn=zonesByName(objs), es=objs.filter(o=>o.type==="elite"), zbad=[];
  for(const [n,yr,sp,el] of TB){ const z=zn.get(n), y=parseLevelRange(yr), e=es.find(o=>pr(o,"boss")===el);
    if(!z||!same(parseLevelRange(z.years),y)||!same([...z.beasts].sort(),[...sp].sort())) zbad.push(`${n}: vùng`);
    if(sp.some(s=>beastIndex(s)<0||!beastSkillOf(s,y[0])||!BONE_SKILLS[s])) zbad.push(`${n}: loài / chiêu / hồn cốt`);
    if(!e||!inZone(z,e.x+e.width/2,e.y+e.height/2)||BOSSES[bossIndex(el)]?.skills.length!==2) zbad.push(`${n}: tinh anh`); }
  // Vùng chồng nhau 10 cấp theo chiều sâu: càng lên bắc (y nhỏ) càng già (so mép trên các mảnh của mọi vùng cùng tầng).
  const tierTop=yr=>Math.min(...[...zn.values()].filter(z=>z.years===yr).flatMap(z=>z.rects.map(r=>r.y)));
  const order=TB.map(([,yr])=>tierTop(yr)), nTier=new Set([...zn.values()].map(z=>z.years)).size;
  ok(!zbad.length&&nTier===4&&order.every((y,i)=>!i||y<order[i-1]),`4 tầng đúng bảng 5.3, từ nam lên bắc: ${TB.map(([n,yr])=>`${n} ${yr}`).join(" → ")}`+(zbad.length?`: ${zbad.join("; ")}`:""));
  const kd=BOSSES[bossIndex(M.king)], lair=objs.find(o=>o.type==="boss"), deep={name:TB[3][0],rects:[...zn.values()].filter(z=>z.years===TB[3][1]).flatMap(z=>z.rects)};
  ok(kd?.rank===2&&kd.hp===96&&kd.skills.length===2&&kd.phase2?.name==="Cực Hàn"&&kd.phase2.skills.length===1&&kd.phase2.cold&&lair&&pr(lair,"boss")===M.king&&inZone(deep,lair.x,lair.y)&&inZone(deep,lair.x+lair.width,lair.y+lair.height)
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
  // Chiêu báo trước thật: Đóng băng, Mê hoặc lên hồn sư (từ #116 là trạng thái riêng, trước đó là Choáng), Làm chậm; đứng trong vùng thì trúng.
  for(const [sp,years,dx,dy,s] of [["han_bang_dia_long",50000,26,0,"freeze"],["tuyet_vi_yeu_ho",40000,60,0,"charm"],["bang_nguyen_cu_tuong",25000,24,0,"slow"]]){
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

  // Thú vương theo lịch (hook king phát sự kiện như schedule.ts): trong hang, 80.000 năm, máu x96 (#264); giai đoạn 2 Cực Hàn; hạ thì có rương.
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
  // Hồi quy #730: seed này rơi thêm hai chồng đá khác loại trước mảnh thứ tư.
  const stone4=qtyOf(C,"da_cuong_hoa_4"), stone3=qtyOf(C,"da_cuong_hoa_3");
  await test(C,"edrop",{seed:166});
  // Bài trước nhét đầy túi bằng Hồi Hồn Đan. Chừa chỗ cho cả mảnh lẫn các loại đá rơi thẳng vào túi.
  { const free=M.shards.length+SD.EQUIP_MAPS[CBM].stones.filter(w=>w>0).length+1;
    const loose=()=>C.bag.items.filter(i=>i.vohon===null), junk=loose().filter(i=>i.code==="hoi_hon_dan").slice(0,Math.max(0,loose().length-(BAG_SLOTS-free)));
    for(const i of junk) C.room.send("discard",{id:i.id});
    ok(await waitFor(()=>loose().length<=BAG_SLOTS-free,3000),`túi C chừa chỗ cho mảnh rơi đặc trưng: ${loose().length}/${BAG_SLOTS} ô (bỏ ${junk.length} ô Hồi Hồn Đan; còn ${Object.entries(loose().reduce((m,i)=>(m[i.code]=(m[i.code]??0)+1,m),{})).map(([k,v])=>`${k}:${v}`).join(" ")})`); }
  for(let i=0;i<M.shards.length;i++){
    const [n,yr,sp]=TB[i], y=parseLevelRange(yr)[0], code=shardCode(M.shards[i]), q0=qtyOf(C,code);
    await test(C,"clear"); await test(C,"shard",{r:0,i}); const before=new Set(C.room.state.drops.keys());
    await test(C,"spawn",{tier:tierOfYears(y),years:y,species:sp[0],dx:20}); await sleep(150);
    const sl=await test(C,"slay"); await waitFor(()=>qtyOf(C,code)>q0,1500);
    const nd=[...C.room.state.drops.entries()].filter(([k])=>!before.has(k)).map(([,d])=>d), core=nd.find(d=>d.item===CORE_ITEM), ring=nd.find(d=>!d.item);
    const [lo,hi]=coreStarBand(y);
    ok(sl?.years===y&&qtyOf(C,code)===q0+1&&ring?.years===y&&core&&core.stars>=lo&&core.stars<=hi,
      `hạ ${BEASTS[beastIndex(sp[0])].name} ${formatYears(y)} (${n}): +1 mảnh ${VOHON[vohonIndex(M.shards[i])].name}, hồn hoàn ${formatYears(ring?.years??0)}, hồn hạch ${core?.stars}★ ${CORE_SETS[core?.cset]?.name}`+
      (sl?.years===y&&qtyOf(C,code)===q0+1&&ring?.years===y&&core&&core.stars>=lo&&core.stars<=hi?"":` [slay ${sl?.years}, mảnh ${qtyOf(C,code)-q0}, sao ${lo}-${hi}, đồ rơi mới ${nd.map(d=>`${d.item||"hoàn"}:${d.years}:${d.stars}`).join(" ")}]`));
  }
  ok(qtyOf(C,"da_cuong_hoa_4")===stone4+1&&qtyOf(C,"da_cuong_hoa_3")===stone3+2,
    "hồi quy túi Cực Bắc: nhận đủ 1 Đá Cường Hóa IV và 2 Đá Cường Hóa III");
  await test(C,"edrop",{off:true});
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
 * #118: chiêu toàn sàn (Bạo Nộ, Thanh Lân Độc Vụ, Đại Địa Chấn) có vòng an toàn (đứng trong vòng thì không trúng); Du Thủy lặn ra giữa
 * hồ (điểm `lake`), báo trước chỗ nổi lên (tin dive sx/sy) và nổi lên đúng chỗ đó khi hết giờ lặn.
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
  // #118: mọi chiêu toàn sàn có vòng an toàn, đủ thời gian đi bộ tới vòng gần nhất; teleSafe là hàm thuần.
  { const fl=[WORLD_SLAM,DV.world.charge.skill,DM.world.miasma.skill], c={shape:"circle",x:100,y:100,ang:0,r:40,w:0,arc:0};
    ok(fl.every(d=>d.floor&&d.safe?.n>0&&d.safe.r>0&&d.warn>=2.5)&&WORLD_SLAM.safe===FLOOR_SAFE.floor&&DV.world.charge.skill.safe===FLOOR_SAFE.charge
      &&teleSafe(c,100,140+TELE_PAD)&&!teleSafe(c,100,141+TELE_PAD)&&DM.world.dive.away>0,
      `chiêu toàn sàn né được: ${fl.map(d=>`${d.name} ${d.safe?.n} vòng r${d.safe?.r}, báo trước ${d.warn} giây`).join("; ")}`); }
  ok(WORLD.hp===150&&WORLD.daily===1&&WORLD.share===0.03&&WORLD_TIME==="21:00"&&WORLD.enrageSecs===600&&WORLD.lifeSecs===900&&WORLD.warnSecs===300&&KING_CHEST.ur===0
    &&[1,3,10].every(n=>Math.abs(bossHpMult(n)-(1+0.6*(n-1)))<1e-9),
    "đã chốt: máu x150 (#265), 21:00 mỗi ngày, báo trước 5 phút, nổi giận sau 10 phút, 1 lần/ngày, từ 3% có thưởng; từ BĐ6 rương thú vương không còn mảnh UR");
  const U=(h,mi=0,d=19)=>Date.UTC(2026,9,d,h,mi);
  ok(worldNext(U(13,0))===U(14,0)&&worldNext(U(14,0))===U(14,0,20)&&worldActive(U(14,5))===U(14,0)&&worldActive(U(14,0)+WORLD.lifeSecs*1000)===null
    &&worldActive(U(13,59))===null&&vnHHMM(worldNext(U(1,0)))==="21:00"&&!KING_TIMES.includes(WORLD_TIME)
    &&worldBossOn(LT,U(14,0))!==worldBossOn(LT,U(14,0,20))&&worldBossOn(LT,U(14,0))===worldBossOn(LT,U(14,0,21))&&worldBossOn("tinh_dau_noi_dia",U(14,0))===null,
    `lịch boss thế giới ${WORLD_TIME} giờ Việt Nam (không trùng ${KING_TIMES.join(" / ")}), luân phiên theo ngày: 19/10 ${worldBossOn(LT,U(14,0))}, 20/10 ${worldBossOn(LT,U(14,0,20))}`);
  const os=objs(LT), lr=os.filter(o=>o.type==="boss"), zs=os.filter(o=>o.type==="zone"), back=os.filter(o=>o.type==="portal");
  const nd=objs(ND), gate=nd.find(o=>o.type==="portal"&&prop(o,"to")===LT), arrND=nd.find(o=>o.type==="arrive"&&o.name==="tu_loi_tinh_dau"), arrLT=os.find(o=>o.type==="arrive"&&o.name==="tu_tinh_dau_noi_dia");
  // Cổng nằm trong tầng sâu nhất của Nội địa (Hắc Ám Lâm; bản ×8 chia nhiều mảnh và thêm vùng có tên cùng niên hạn, 11.5).
  const ndz=[...zonesByName(nd).values()], hacY=ndz.map(z=>z.years).sort((a,b)=>parseLevelRange(b)[0]-parseLevelRange(a)[0])[0];
  const hac={name:ndz.filter(z=>z.years===hacY).map(z=>z.name).join(" / "),rects:ndz.filter(z=>z.years===hacY).flatMap(z=>z.rects)};
  const lake=os.filter(o=>o.type==="lake");
  { const L=lr[0]; ok(lake.length===1&&lake[0].point&&L&&lake[0].x>L.x+L.width,`Tiled: điểm giữa hồ "${lake[0]?.name}" (${lake[0]?.x},${lake[0]?.y}) phía đông sàn đấu (#118: Du Thủy lặn ra đây)`); }
  ok(lr.length===1&&M.world.includes(prop(lr[0],"boss"))&&zs.length===1&&prop(zs[0],"count")===0&&back.length===1&&prop(back[0],"to")===ND&&prop(back[0],"arrive")==="tu_loi_tinh_dau"
    &&gate&&!prop(gate,"level")&&prop(gate,"arrive")==="tu_tinh_dau_noi_dia"&&arrND&&arrLT&&inZone(hac,gate.x+gate.width/2,gate.y+gate.height/2),
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
      `${beastName(3,bossIndex(VIEN))} trên sàn đấu, ${ki.years} năm, máu x${WORLD.hp} = ${ki.maxHp}, sát thương x${WORLD.dmg}, lặn xuống hồ sau ${Math.round(ki.life)} giây`);
    ok(await warpIn(W3)&&await waitFor(()=>W3.boss.some(m=>m.k==="here"&&m.here&&m.world&&m.rageIn>WORLD.enrageSecs-60),1500),`W3 vào khi boss đang ở: nhận thời gian còn lại và đồng hồ nổi giận (${Math.round(W3.boss.find(m=>m.k==="here")?.rageIn??0)} giây)`);
    // Cấp 100 cho mọi võ hồn của 3 bot (chịu được sát thương boss 100.000 năm), giữ boss đứng yên, hoãn mọi cơ chế để thử từng cái.
    const R9=[400,700,1700,5000,12000,20000,50000,100000,100000];
    for(const b of W) for(const v of b.owned.list) await test(b,"set",{rowId:v.rowId,level:100,xp:0,rings:R9});
    await test(W1,"wmech",{m:"hold",secs:300}); await test(W1,"wmech",{m:"timers"});
    /** Đưa `b` vào sàn cạnh boss (thử nhiều chỗ quanh boss). */
    async function intoLair(b,dx,dy){ const t=bossB(); for(let k=0;k<24;k++){ const a=k*Math.PI/6, r=k<12?1:1.6, x=Math.round(t.x+dx*r*Math.cos(a)-dy*Math.sin(a)), y=Math.round(t.y+dx*r*Math.sin(a)+dy*Math.cos(a));
      if(!inL(x,y)) continue; await test(b,"goto",{x,y}); const q=mo(b); if(Math.hypot(q.x-x,q.y-y)<1) return true; } return false; }
    const outLair=async b=>{ await test(b,"goto",{x:arrLT.x,y:arrLT.y}); return !inL(mo(b).x,mo(b).y); };
    /** Chiêu toàn sàn (#118): `s` là một vòng an toàn thì đưa `b` vào tâm vòng; null thì đưa `b` tới chỗ trong sàn ngoài mọi vòng `safe`. */
    const inSafe=(safe,x,y)=>safe.some(q=>teleSafe(q,x,y));
    async function placeFloor(b,safe,s){
      if(s){ await test(b,"goto",{x:s.x,y:s.y}); return Math.hypot(mo(b).x-s.x,mo(b).y-s.y)<1; }
      if(inL(mo(b).x,mo(b).y)&&!inSafe(safe,mo(b).x,mo(b).y)) return true;
      const t=bossB(); for(let k=0;k<48;k++){ const a=k*Math.PI/8, r=40+20*Math.floor(k/16), x=Math.round(t.x+r*Math.cos(a)), y=Math.round(t.y+r*Math.sin(a));
        if(!inL(x,y)||inSafe(safe,x,y)) continue; await test(b,"goto",{x,y}); if(Math.hypot(mo(b).x-x,mo(b).y-y)<1) return true; }
      return false; }
    /** Vòng an toàn của chiêu toàn sàn `name` vừa báo trước (fx tele của W1). */
    const safeOf=async name=>{ await waitFor(()=>W1.fxs.some(f=>f.k==="tele"&&f.name===name),1500); return W1.fxs.findLast(f=>f.k==="tele"&&f.name===name)?.safe??[]; };
    /** Vòng an toàn hợp lệ: đủ `n` vòng bán kính `r`, tâm trong sàn, không chồng nhau. */
    const safeOk=(safe,def)=>safe.length===def.safe.n&&safe.every((q,i)=>q.r===def.safe.r&&inL(q.x,q.y)&&safe.every((o,j)=>j===i||Math.hypot(o.x-q.x,o.y-q.y)>=2*q.r));
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
    await test(W1,"wmech",{m:"hold",secs:0}); W1.boss=[]; W1.hurts=[]; W1.fxs=[]; await test(W1,"wmech",{m:"charge"});
    { const sf=await safeOf("Đại Địa Chấn"); let pl=true; for(const b of W) pl=await placeFloor(b,sf,null)&&pl;
      ok(safeOk(sf,DV.world.charge.skill)&&pl,`Đại Địa Chấn có ${sf.length} vòng an toàn trong sàn (${sf.map(q=>`${q.x},${q.y}`).join("; ")}); 3 bot đứng ngoài vòng`);
      // Tin `boss` (client xin lại lúc vào phòng): nhận lại `here` và vùng chiêu toàn sàn đang báo trước (thời gian còn lại).
      W3.boss=[]; W3.fxs=[]; W3.room.send("boss");
      ok(await waitFor(()=>W3.boss.some(m=>m.k==="here"&&m.here&&m.world)&&W3.fxs.some(f=>f.k==="tele"&&f.name==="Đại Địa Chấn"&&same(f.safe,sf)&&f.t<DV.world.charge.skill.warn&&f.warn===DV.world.charge.skill.warn),1500),
        `xin lại tin boss (người vừa vào): nhận "here" và vùng ${DV.world.charge.skill.name} đang báo trước kèm vòng an toàn (còn ${W3.fxs.find(f=>f.k==="tele")?.t?.toFixed(1)} giây)`);
      W3.boss=[]; W3.room.send("boss"); await sleep(400);
      ok(!W3.boss.some(m=>m.k==="here"),"xin lại tin boss lần nữa trong 1 giây: server bỏ (chặn lặp)"); }
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
    // #118: W2 đứng vào một vòng an toàn, W1 và W3 đứng ngoài mọi vòng (vẫn trong sàn).
    const sfS=await safeOf("Bạo Nộ"), plS=await placeFloor(W2,sfS,sfS[0])&&await placeFloor(W1,sfS,null)&&await placeFloor(W3,sfS,null);
    ok(safeOk(sfS,WORLD_SLAM)&&plS,`Bạo Nộ có ${sfS.length} vòng an toàn bán kính ${WORLD_SLAM.safe.r} trong sàn, rải theo bề ngang (${sfS.map(q=>`${q.x},${q.y}`).join("; ")}); W2 vào vòng đầu`);
    ok(await waitFor(()=>W1.fxs.some(f=>f.k==="teleHit"&&f.name==="Bạo Nộ"),(KING.roarSecs+WORLD_SLAM.warn)*1000+1500),"Bạo Nộ tung (sau tiếng gầm nổi giận)");
    await test(W1,"wmech",{m:"hold",secs:300});
    const tf=W1.fxs.find(f=>f.k==="tele"&&f.name==="Bạo Nộ"), th=W1.fxs.find(f=>f.k==="teleHit"&&f.name==="Bạo Nộ");
    ok(tf&&tf.shape==="line"&&tf.r===LR.w&&tf.w===LR.h&&tf.x===LR.x&&th.hit.includes(sid(W1))&&th.hit.includes(sid(W3))&&same(th.safe,sfS),`chiêu toàn sàn: vùng phủ đúng sàn đấu ${LR.w}×${LR.h}, W1 và W3 ngoài vòng an toàn trúng`);
    ok(!th.hit.includes(sid(W2)),`W2 đứng trong vòng an toàn lúc Bạo Nộ nổ: không trúng (trúng: ${th.hit.length} người)`);

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
    const pos0=[bossB().x,bossB().y]; W1.boss=[]; const wd=await test(W1,"wmech",{m:"dive"});
    ok(await waitFor(()=>bossB().dive,1000)&&await dealt(W1,1000)===0&&W1.boss.some(m=>m.k==="dive"),"Du Thủy: boss lặn xuống hồ, đánh không mất máu");
    // #118: lặn ra giữa hồ (điểm `lake`), chỗ nổi lên báo trước cho cả phòng ngay lúc lặn.
    await waitFor(()=>W1.boss.some(m=>m.k==="dive")&&W2.boss.some(m=>m.k==="dive"),1500);
    const dv=W1.boss.find(m=>m.k==="dive"), dv2=W2.boss.findLast(m=>m.k==="dive");
    ok(await waitFor(()=>Math.hypot(bossB().x-lake[0].x,bossB().y-lake[0].y)<1,1000)&&wd.x===lake[0].x&&wd.y===lake[0].y,`Du Thủy: boss lặn ra giữa hồ (${Math.round(bossB().x)},${Math.round(bossB().y)})`);
    ok(dv&&dv.sx!==undefined&&dv2?.sx===dv.sx&&dv2?.sy===dv.sy&&inL(dv.sx,dv.sy)&&Math.hypot(dv.sx-pos0[0],dv.sy-pos0[1])>=DM.world.dive.away&&wd.surf?.x===dv.sx&&wd.surf?.y===dv.sy,
      `báo trước chỗ nổi lên cho cả phòng: ${dv?.sx},${dv?.sy} (trong sàn, cách chỗ lặn ≥ ${DM.world.dive.away})`);
    await test(W1,"etick",{s:DM.world.dive.secs+0.1});
    ok(await waitFor(()=>!bossB().dive&&bossB().weak===1+HE_IDS.indexOf("man_cong"),1000)&&bossB().x===dv?.sx&&bossB().y===dv?.sy&&W1.boss.some(m=>m.k==="surface"),
      `hết ${DM.world.dive.secs} giây lặn: nổi lên đúng chỗ đã báo (${pos0.map(Math.round)} -> ${Math.round(bossB().x)},${Math.round(bossB().y)}), lộ điểm yếu Mẫn công ${DM.world.dive.weakSecs} giây`);
    ok(await swTo(W2,"u_minh_linh_mieu")&&await dealt(W2,1000)===1000*WORLD.weakMult,"W2 đổi lại U Minh Linh Miêu (mẫn công): gây x2,5 lúc boss vừa nổi lên");
    // Thanh Lân Độc Vụ: độc toàn sàn (Trúng độc nhiều tầng 30 giây).
    for(const b of [W1,W2]) await intoLair(b,b===W1?40:-40,0);
    await test(W1,"wmech",{m:"hold",secs:0}); W1.boss=[]; W1.fxs=[]; await test(W1,"wmech",{m:"miasma"});
    const sfM=await safeOf("Thanh Lân Độc Vụ"), plM=await placeFloor(W2,sfM,sfM.at(-1))&&await placeFloor(W1,sfM,null);
    ok(safeOk(sfM,DM.world.miasma.skill)&&plM,`Thanh Lân Độc Vụ có ${sfM.length} vòng an toàn; W2 vào vòng cuối, W1 ngoài vòng`);
    ok(await waitFor(()=>W1.fxs.some(f=>f.k==="teleHit"&&f.name==="Thanh Lân Độc Vụ"),DM.world.miasma.skill.warn*1000+1500),"Thanh Lân Độc Vụ tung");
    await test(W1,"wmech",{m:"hold",secs:300}); await sleep(150);
    ok(mo(W1).st&statusBit("poison")&&!(mo(W2).st&statusBit("poison")),"W1 ngoài vòng trúng độc toàn sàn (Vết thương sâu), W2 trong vòng an toàn không trúng");
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
 * #121: các tình huống bổ sung cho hồn hoàn và Đại Đấu Hồn Trường. Chạy riêng bằng BOT_ONLY=issue121 để có server mới, state sạch.
 */
async function issue121Test(){
  console.log("[121] hồn hoàn đang hấp thụ, hòa / hết lượt thưởng và ngắt kết nối sau khi ghép");
  await absorbSellTest();
  await arenaEdgeTest();
}

async function absorbSellTest(){
  const C=await bot("B121Sell","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:1,outfitCol:1});
  const tn=npcSpot("nac_dinh_thanh","thuong_nhan");
  try{
    if(!(await test(C,"ping"))?.enabled){ console.log("  ⚠ bỏ qua bán hồn hoàn đang hấp thụ (cần GAME_TEST=1)"); return; }
    C.travel=null; await test(C,"warp",{mapId:"nac_dinh_thanh",x:tn.x,y:tn.y+16});
    ok(await waitFor(()=>C.travel?.mapId==="nac_dinh_thanh",4000),"#121: đi tới Nặc Đinh Thành để thử bán");
    const travel=C.travel; await C.room.leave(); await sleep(300); C.mapId=travel.mapId; await enter(C,travel.roomId??undefined);
    await waitFor(()=>C.room.state.players?.get(C.room.sessionId)&&C.owned&&C.bag,3000);
    await test(C,"goto",{x:tn.x,y:tn.y+16}); await test(C,"rest",{s:TEAM_COMBAT_SECS+1});
    const rowId=C.owned.active;
    await test(C,"set",{rowId,level:10,xp:0,rings:[]});
    for(const it of C.bag.items.filter(i=>i.code===RING_ITEM)) C.room.send("discard",{id:it.id});
    await waitFor(()=>!C.bag.items.some(i=>i.code===RING_ITEM),2000);
    await test(C,"give",{code:RING_ITEM,qty:1,years:10});
    const ring=C.bag.items.find(i=>i.code===RING_ITEM&&i.years===10);
    C.absorbing=null; C.room.send("absorb",{itemId:ring?.id,vohonId:rowId});
    ok(await waitFor(()=>C.absorbing?.on,1500),"#121: bắt đầu hấp thụ hồn hoàn 10 năm");
    const before=bagKey(C), log=await trade(C,"sell",{id:ring?.id});
    ok(/Đang hấp thụ hồn hoàn này, không bán được/.test(log)&&bagKey(C)===before&&C.bag.items.some(i=>i.id===ring?.id),
      "#121: đang hấp thụ thì không bán được hồn hoàn ("+log+")");
    await test(C,"rush"); await waitFor(()=>C.absorbing&&!C.absorbing.on,1500);
  } finally { await C.room?.leave().catch(()=>{}); }
}

async function arenaEdgeTest(){
  const warpTown=async b=>{
    const ns=npcSpot(AT,"dau_hon_truong"); b.travel=null;
    await test(b,"warp",{mapId:AT,x:ns.x,y:ns.y+16}); await waitFor(()=>b.travel?.mapId===AT,4000);
    const t=b.travel; await b.room.leave(); await sleep(300); b.mapId=t.mapId; await enter(b,t.roomId??undefined);
    await waitFor(()=>b.room.state.players?.get(b.room.sessionId)&&b.owned&&b.bag,3000);
  };
  const back=async b=>{ b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>b.room.state.players?.get(b.room.sessionId)&&b.owned&&b.bag,3000); };
  const ns=npcSpot(AT,"dau_hon_truong");
  const queue=async b=>{ const l=b.logs.length, n=b.aqN; b.room.send("arena",{op:"queue"}); await waitFor(()=>b.aqN>n&&b.logs.length>l,2000); };
  const found=b=>b.arena.filter(m=>m.k==="found").at(-1), ended=b=>b.arena.filter(m=>m.k==="end").at(-1);
  const enterArena=async b=>{ const id=found(b)?.roomId; await b.room.leave(); await enter(b,id); await waitFor(()=>b.room.state.players?.get(b.room.sessionId)&&b.owned&&b.bag,3000); };
  const leaveArena=async b=>{ const r=b.room; if(r) await Promise.race([r.leave().catch(()=>{}),sleep(1000)]); await sleep(300); await back(b); };
  const close=async b=>{ const r=b.room; if(!r) return; await Promise.race([r.leave().catch(()=>{}),sleep(300)]); };
  const at=async b=>test(b,"goto",{x:ns.x,y:ns.y+16});

  const D=await bot("B121DrawA","bich_lan_xa_hoang",{sex:1,hair:0,hairCol:2,outfitCol:2});
  const E=await bot("B121DrawB","u_minh_linh_mieu",{sex:0,hair:2,hairCol:3,outfitCol:3});
  const W=await bot("B121Win","bich_lan_xa_hoang",{sex:1,hair:1,hairCol:4,outfitCol:4});
  const opponents=[];
  try{
    if(!(await test(D,"ping"))?.enabled){ console.log("  ⚠ bỏ qua đấu trường bổ sung (cần GAME_TEST=1)"); return; }
    for(const b of [D,E,W]) await warpTown(b);

    // Hai bên đầy sinh lực, không ai tác động trong trận: hết giờ phải là hòa, không thưởng, Elo / thành tích ghi hòa.
    await at(D); await at(E); await queue(D); await queue(E);
    ok(await waitFor(()=>found(D)&&found(E)&&found(D).roomId===found(E).roomId,3000),"#121: ghép cặp để thử trận hòa");
    await enterArena(D); await enterArena(E); await waitFor(()=>D.room.state.phase==="ready",3000);
    await test(D,"afast",{s:0}); await waitFor(()=>D.room.state.phase==="fight",1500); await test(D,"afast",{s:0});
    ok(await waitFor(()=>ended(D)&&ended(E),3000),"#121: trận hòa kết thúc");
    const drawD=ended(D), drawE=ended(E);
    ok(drawD?.score===0.5&&drawE?.score===0.5&&drawD.reason==="time"&&!drawD.reward&&!drawE.reward&&drawD.rec.draws===1&&drawE.rec.draws===1,
      "#121: hòa theo hết giờ, không thưởng (D "+drawD?.elo0+" → "+drawD?.elo1+", E "+drawE?.elo0+" → "+drawE?.elo1+")");
    await leaveArena(D); await leaveArena(E);

    // Mỗi đối thủ chỉ dùng tối đa 3 lần để không rơi vào trận giao hữu; 4 đối thủ đủ 11 trận thắng xếp hạng cho một tài khoản.
    for(let i=0;i<4;i++){ const b=await bot("B121O"+(i+1),i%2?"u_minh_linh_mieu":"hoa_anh",{sex:i%2,hair:i%3,hairCol:i%5,outfitCol:(i+1)%6}); await warpTown(b); opponents.push(b); }
    // Trận đầu là noshow (#790: không Elo, không thưởng, không đếm cặp); các trận sau tính một lượt thưởng mỗi trận.
    for(let i=0;i<ARENA.dailyWins+2;i++){
      const O=opponents[i%opponents.length];
      if(O.leftCode!==null) await back(O);
      await at(W); await at(O);
      W.arena=[]; O.arena=[]; await queue(W); await queue(O);
      ok(await waitFor(()=>found(W)&&found(O)&&found(W).roomId===found(O).roomId,3000),"#121: ghép trận thưởng "+(i+1)+"/"+(ARENA.dailyWins+1));
      // Trận đầu: O vẫn giữ phòng bản đồ, W vào sân trước để giữ ArenaRoom sống trong lúc chờ MapRoom tự ngắt O (20 s).
      // Các trận sau: cả hai vào sân rồi O rời, kết thúc ngay (reason "leave"), không chờ 20 s mỗi trận.
      const slow=i===0;
      await enterArena(W);
      if(slow) ok(await waitFor(()=>O.leftCode===4006,ARENA.joinSecs*1000+2000),"#121: server ngắt kết nối người chưa vào sân (mã "+O.leftCode+")");
      else { await enterArena(O); await close(O); }
      ok(await waitFor(()=>ended(W),5000),"#121: trận thưởng "+(i+1)+" kết thúc ("+(slow?"noshow":"đối thủ rời sân")+")");
      const m=ended(W), k=i-1, paid=!slow&&k<ARENA.dailyWins;
      if(slow) ok(m?.score===1&&m.reason==="noshow"&&m.friendly&&!m.reward&&m.elo1===m.elo0&&m.left===ARENA.dailyWins,
        "#790: trận bỏ cuộc: bên còn lại không đổi Elo ("+m?.elo0+" → "+m?.elo1+"), không thưởng, không mất lượt (left "+m?.left+")");
      else ok(!m?.friendly&&!m.eloCapped&&m?.score===1&&m.reason==="leave"&&(paid ? !!m.reward&&!m.capped : !m.reward&&m.left===0)&&m.left===Math.max(0,ARENA.dailyWins-k-1),
        "#121: trận "+(i+1)+" "+(paid?"còn lượt thưởng":"hết lượt thưởng, không thưởng")+" (left "+m?.left+", capped "+m?.capped+")");
      await leaveArena(W);
    }
  } finally {
    for(const b of [D,E,W,...opponents]) await close(b);
  }
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
 * 9.4: hiệu ứng tổ đội của #114. A là Phụ trợ, B cùng tổ đội, O đứng gần nhưng ngoài đội: thanh tẩy chỉ tới B; khiên hồn cốt
 * chỉ tới B; bộ Lưu Ly 4 món chỉ phát công cho B theo PARTY_BUFF_MULT.
 */
async function partyEffectExpansionTest(){
  console.log("[#114] thanh tẩy, hồn cốt và hồn hạch hỗ trợ lan cho đồng đội");
  const A=await bot("Mở rộng A","xuc_xich",{sex:1,hair:1,hairCol:2,outfitCol:3});
  const B=await bot("Mở rộng B","bich_lan_xa_hoang",{sex:0,hair:2,hairCol:4,outfitCol:1});
  const O=await bot("Mở rộng O","bich_lan_xa_hoang",{sex:0,hair:3,hairCol:1,outfitCol:5});
  const meP=b=>b.room.state.players.get(b.room.sessionId), live=async b=>(await test(b,"stats")).live;
  await waitFor(()=>[A,B,O].every(b=>b.owned&&b.party&&meP(b)),3000);
  try{
    const xuc="xuc_xich", xrow=A.owned.active, Y=[423,764,1760,5000,12000,20000,35000,50000];
    await test(A,"set",{rowId:xrow,level:60,xp:0,rings:Y});
    await test(A,"grant",{vohon:"bich_lan_xa_hoang"});
    const stRow=A.owned.list.find(v=>v.vohon==="bich_lan_xa_hoang")?.rowId;
    await sendTeam(A,[xrow,stRow,0,0]); await sendTeam(A,[xrow,stRow,0,0]);
    const loadN=A.ownedMsgs;
    A.room.send("loadout",{rowId:xrow,skills:[7,1,2,3]});
    await waitFor(()=>A.ownedMsgs>loadN&&same(A.owned.list.find(v=>v.rowId===xrow)?.skills,[7,1,2,3]),1500);
    ok(same(A.owned.list.find(v=>v.rowId===xrow)?.skills,[7,1,2,3]),"Xúc Xích mang thanh tẩy vòng 8 ở ô U");
    await test(A,"party",{pop:"rlreset"}); const n=B.partyMsgs; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>B.partyMsgs>n);
    B.room.send("party",{op:"accept",name:A.name}); await waitFor(()=>A.party?.members?.length===2&&B.party?.id===A.party.id,2000);
    await leaveSafe(A); const pa=meP(A), ax=pa.x, ay=pa.y;
    async function place(b,dist){ for(const [ux,uy] of [[1,0],[0,1],[0,-1],[-1,0],[0.7071,0.7071],[-0.7071,0.7071]]){
      const x=+(ax+ux*dist).toFixed(1), y=+(ay+uy*dist).toFixed(1); await test(b,"goto",{x,y});
      if(await waitFor(()=>Math.hypot(meP(b).x-x,meP(b).y-y)<0.5,600)&&!inSafeOf(b)) return true;
    } return false; }
    ok(await place(B,100)&&await place(O,90),`B trong đội, O ngoài đội, khoảng cách < ${PARTY_BUFF_R}`);
    await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});

    // Thanh tẩy: kỹ năng vòng 8 của Xúc Xích không gây sát thương, chỉ giải trạng thái cho đồng đội hợp lệ.
    await test(B,"pst",{s:"stun",secs:60}); await test(O,"pst",{s:"stun",secs:60}); await test(A,"ready");
    A.room.send("skill",{i:0}); await waitFor(()=>((meP(B).st??0)&statusBit("stun"))===0,1500);
    ok(((meP(B).st??0)&statusBit("stun"))===0&&((meP(O).st??0)&statusBit("stun"))!==0,"thanh tẩy lan tới B, không lan tới O");

    // Hồn cốt khiên tự thân: chỉ self được phép lan; sát thương / trạng thái hồn thú vẫn xử lý ở A.
    await test(B,"hurt",{pct:1}); await test(B,"rest",{s:30});
    const n0=A.bagMsgs??0, l0=A.logs.length; await test(A,"give",{code:BONE_ITEM,years:5000,beast:"thiet_giap_xuyen_son_giap",slot:"tay_trai"});
    await waitFor(()=>A.bagMsgs>n0&&A.logs.length>l0,2000); const bone=A.bag.items.find(i=>i.code===BONE_ITEM&&i.stats?.beast==="thiet_giap_xuyen_son_giap"&&i.stats?.slot==="tay_trai"&&i.vohon===null);
    ok(!!bone,"nhận được hồn cốt Thiết Giáp Xuyên Sơn Giáp");
    const equipN=A.bagMsgs??0;
    A.room.send("equip",{itemId:bone?.id,vohonId:xrow});
    await waitFor(()=>A.bagMsgs>equipN&&A.bag.items.find(i=>i.id===bone?.id)?.vohon===xrow,1500);
    ok(A.bag.items.find(i=>i.id===bone?.id)?.vohon===xrow,"gắn hồn cốt vào Xúc Xích");
    await test(A,"clear"); await test(A,"beast",{dx:16,dy:0,years:5000}); await test(A,"ready"); await test(B,"clear"); await test(O,"clear");
    await test(B,"rest",{s:30}); await test(O,"rest",{s:30}); A.room.send("boneskill",{i:1}); await waitFor(()=>(meP(B).shield??0)>0,1500);
    const bLive=await live(B), oLive=await live(O), boneShield=Math.round(bLive.maxHp*BONE_SKILLS.thiet_giap_xuyen_son_giap.active.self.shield*buffPower(5000)*PARTY_BUFF_MULT);
    ok(bLive.shield===boneShield&&oLive.shield===0,`khiên hồn cốt của B ${bLive.shield} (cần ${boneShield}), O không nhận`);

    // Lưu Ly 4 món: chỉ hiệu ứng hỗ trợ atk lan, không có trạng thái / sát thương hồn thú từ CoreFx.
    await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
    const cores=[]; for(let i=0;i<4;i++){ const giveN=A.bagMsgs??0; await test(A,"give",{code:CORE_ITEM,stars:6,set:"luu_ly"}); await waitFor(()=>A.bagMsgs>giveN,1500); cores.push(A.bag.items.find(v=>v.code===CORE_ITEM&&v.stats?.set==="luu_ly"&&v.vohon===null&&!cores.some(c=>c.id===v.id))); }
    ok(cores.length===4&&cores.every(Boolean),"nhận đủ 4 hồn hạch Lưu Ly");
    for(const [i,c] of cores.entries()){
      const equipCoreN=A.bagMsgs??0;
      A.room.send("equipcore",{itemId:c?.id,vohonId:xrow,slot:i});
      await waitFor(()=>A.bagMsgs>equipCoreN&&A.bag.items.find(v=>v.id===c?.id)?.vohon===xrow,1500);
    }
    ok(cores.every(c=>A.bag.items.find(v=>v.id===c?.id)?.vohon===xrow),"gắn đủ 4 hồn hạch Lưu Ly");
    // Đổi tay theo state (#185). Tin "vohons" (A.owned) tới trước bản vá có swCd = SWITCH_CD: đọc swCd ngay sau tin thì còn số 0 cũ,
    // lần đổi sau gửi khi server còn hồi chiêu nên bị bỏ qua im lặng. Chờ cả tin lẫn võ hồn mới trong state (vh đổi cùng bản vá với
    // swCd). swCd giảm theo nhịp server (dt kẹp 100 ms), máy tải thì lâu hơn SWITCH_CD giây thật: giới hạn chờ rộng, trả ngay khi về 0.
    const swapA=async(slot,row)=>{ const free=await waitFor(()=>meP(A).swCd===0,SWITCH_CD*3000), vh=vohonIndex(A.owned.list.find(v=>v.rowId===row)?.vohon);
      A.room.send("switch",{slot}); return free&&await waitFor(()=>A.owned.active===row&&meP(A).vh===vh,3000); };
    await test(A,"rest",{s:30}); const sw1=await swapA(1,stRow);
    const lb=B.logs.length, sw2=await swapA(0,xrow);
    await waitFor(()=>B.logs.length>lb&&(meP(B).buff&buffBit("atk"))!==0,3000); // dòng log và hào quang trong state của B
    const coreB=await live(B), coreO=await live(O), coreWant=CORE_SET_FX.luu_ly.four.swapAtk*PARTY_BUFF_MULT;
    ok(Math.abs((coreB.buffs.atk?.v??0)-coreWant)<1e-9&&!coreO.buffs.atk,`Lưu Ly 4 món: B nhận công ${(coreB.buffs.atk?.v??0)*100}% (cần ${coreWant*100}%), O không nhận [đổi tay ${sw1}/${sw2}, B: ${B.logs.slice(lb).join(" | ")}]`);
  } finally { for(const b of [A,B,O]) await b.room.leave().catch(()=>{}); }
}

/**
 * Chat tổ đội, tin riêng, kênh thế giới (#188), chat tông (#198; BOT_ONLY=chat, nhóm 5 của BOT_PART): `chat {text, ch?, to?}`, thiếu
 * `ch` là chat bản đồ như cũ; tổ đội / riêng / thế giới / tông tới người ở bản đồ khác (qua presence); người nhận phải đang trong game;
 * thế giới chặn dưới WORLD_CHAT.minLevel và 1 tin / WORLD_CHAT.cdSecs giây; tông chỉ tới người cùng tông, chưa có tông thì báo; chống
 * spam riêng từng kênh; giá trị lạ bị bỏ qua. Phần xuyên kênh cùng bản đồ ở channelTest (CHANNEL_MAX=2).
 */
async function chatTest(){
  console.log("[#188, #198] Chat tổ đội, tin riêng, kênh thế giới, tông môn (xuyên bản đồ)");
  const T=async(b,op,extra={})=>{ b.test=null; b.room.send("test",{op,...extra}); await waitFor(()=>b.test,2000); await sleep(80); return b.test; };
  /** Gửi `chat` rồi chờ một dòng log từ chối (trả các dòng mới; "" nếu không có). */
  const said=async(b,msg)=>{ const l=b.logs.length; b.room.send("chat",msg); await waitFor(()=>b.logs.length>l,1500); await sleep(50); return b.logs.slice(l).join(" | "); };
  const has=(b,txt,ch)=>b.chats.find(m=>m.text===txt&&(ch?m.ch===ch:!m.ch));
  const got=(b,txt,ch)=>waitFor(()=>has(b,txt,ch),2000);
  const X=await bot("Chat X","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:1,outfitCol:2}), Y=await bot("Chat Y","nhu_cot_tho",{sex:1,hair:2,hairCol:0,outfitCol:1});
  const Z=await bot("Chat Z","u_minh_linh_mieu",{sex:0,hair:0,hairCol:3,outfitCol:4});
  try {
    // Z sang Nặc Đinh Thành (hook warp, như đi cổng): khác bản đồ, khác phòng với X, Y.
    Z.travel=null; await T(Z,"warp",{mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>Z.travel,3000);
    if(Z.travel){ const t=Z.travel; await Z.room.leave(); await sleep(200); Z.mapId=t.mapId; await enter(Z,t.roomId??undefined); }
    await waitFor(()=>Z.room.state.mapId==="nac_dinh_thanh",2000);
    ok(X.room.roomId===Y.room.roomId&&Z.room.state.mapId==="nac_dinh_thanh"&&Z.room.roomId!==X.room.roomId,`X, Y cùng phòng ${X.room.state.mapId}; Z ở ${Z.room.state.mapId}`);
    for(const b of [X,Y,Z]) await T(b,"chat",{cop:"rlreset"});

    // ---- Bản đồ (như cũ): chỉ phòng của người gửi ----
    const tMap=`bđ ${RUN}`; X.room.send("chat",{text:tMap});
    ok(await got(Y,tMap)&&has(Y,tMap).name===X.name,"chat bản đồ (thiếu ch): Y cùng phòng nhận, không có ch");
    await sleep(300); ok(!Z.chats.some(m=>m.text===tMap),"chat bản đồ không tới Z ở bản đồ khác");

    // ---- Tổ đội: chưa vào đội thì báo; vào đội rồi thì mọi thành viên nhận dù khác bản đồ ----
    ok(/không ở trong tổ đội/.test(await said(X,{text:"có ai không",ch:"party"})),"chat tổ đội khi chưa vào đội: báo lỗi riêng");
    { const n=Z.partyMsgs; X.room.send("party",{op:"invite",name:Z.name}); await waitFor(()=>Z.partyMsgs>n&&Z.party?.invites?.length,2000);
      Z.room.send("party",{op:"accept",name:X.name}); await waitFor(()=>X.party?.members?.length===2,2000); }
    ok(X.party?.members?.length===2,`X mời Z (bản đồ khác) vào tổ đội: ${X.party?.members?.map(m=>m.name).join(", ")}`);
    const tParty=`đội ${RUN}`; X.room.send("chat",{text:tParty,ch:"party"});
    ok(await got(Z,tParty,"party")&&has(Z,tParty,"party").name===X.name,"chat tổ đội: Z ở bản đồ khác nhận (ch party, tên người gửi)");
    ok(await got(X,tParty,"party"),"người gửi cũng nhận tin tổ đội của mình");
    await sleep(300); ok(!Y.chats.some(m=>m.text===tParty),"Y không trong tổ đội: không nhận");

    // ---- Tin riêng: tên không phân biệt hoa thường, người gửi nhận bản sao, người khác không thấy ----
    const tW=`riêng ${RUN}`; Y.room.send("chat",{text:tW,ch:"whisper",to:Z.name.toUpperCase()});
    ok(await got(Z,tW,"whisper")&&has(Z,tW,"whisper").name===Y.name&&has(Z,tW,"whisper").to===Z.name,"tin riêng Y → Z (bản đồ khác, tên viết hoa): Z nhận, kèm tên người gửi / nhận");
    ok(await got(Y,tW,"whisper")&&has(Y,tW,"whisper").to===Z.name,"người gửi nhận bản sao (to = tên đúng cách viết)");
    await sleep(300); ok(!X.chats.some(m=>m.text===tW),"X không thấy tin riêng của người khác");
    const tR=`trả lời ${RUN}`; Z.room.send("chat",{text:tR,ch:"whisper",to:Y.name}); // /r ở client = tin riêng tới người vừa nhắn
    ok(await got(Y,tR,"whisper"),"Z trả lời Y (bản đồ khác)");
    ok(/không trong game/.test(await said(Y,{text:"alo",ch:"whisper",to:`Không Ai ${RUN}`})),"tin riêng tới tên không có: báo không trong game");
    ok(/chính mình/.test(await said(Y,{text:"alo",ch:"whisper",to:Y.name})),"tự nhắn riêng cho mình bị từ chối");
    ok(/\/t/.test(await said(Y,{text:"alo",ch:"whisper"})),"tin riêng thiếu người nhận: nhắc cú pháp /t");

    // ---- Thế giới: dưới cấp WORLD_CHAT.minLevel bị chặn; 1 tin / WORLD_CHAT.cdSecs giây; mọi bản đồ nhận ----
    // Cấp nhân vật mới không cố định: đặt hẳn dưới ngưỡng bằng hook rồi mới thử.
    await T(X,"set",{rowId:X.owned.active,level:WORLD_CHAT.minLevel-1});
    await waitFor(()=>X.room.state.players.get(X.room.sessionId)?.level===WORLD_CHAT.minLevel-1,2000);
    ok(/từ cấp/.test(await said(X,{text:"thế giới",ch:"world"})),`kênh thế giới ở cấp ${WORLD_CHAT.minLevel-1}: bị chặn`);
    await T(X,"set",{rowId:X.owned.active,level:WORLD_CHAT.minLevel});
    await waitFor(()=>X.room.state.players.get(X.room.sessionId)?.level>=WORLD_CHAT.minLevel,2000);
    const tG=`thế giới ${RUN}`; X.room.send("chat",{text:tG,ch:"world"});
    ok(await got(Y,tG,"world")&&await got(Z,tG,"world")&&has(Z,tG,"world").name===X.name,`cấp ${WORLD_CHAT.minLevel}: tin thế giới tới Y (cùng phòng) và Z (bản đồ khác)`);
    ok(new RegExp(`${WORLD_CHAT.cdSecs} giây`).test(await said(X,{text:"lần hai",ch:"world"})),`gửi lại ngay: phải chờ ${WORLD_CHAT.cdSecs} giây`);
    await T(X,"chat",{cop:"rlreset"}); const tG2=`thế giới 2 ${RUN}`; X.room.send("chat",{text:tG2,ch:"world"});
    ok(await got(Z,tG2,"world"),"hết hồi (hook rlreset): gửi được tin thế giới tiếp");

    // ---- Tông môn (#198): chưa thuộc tông thì báo; cùng tông nhận dù khác bản đồ; tông khác không nhận; rời tông là thôi nhận ----
    // Hook tong {set} đặt thẳng tông (bỏ qua sứ giả / cấp / chờ đổi, luật gia nhập thử ở tongTest).
    const [TA,TB]=TONG_MON;
    for(const b of [X,Y,Z]) await T(b,"tong",{set:null});
    ok(/chưa thuộc tông/.test(await said(X,{text:"tông ơi",ch:"tong"})),"chat tông khi chưa thuộc tông: báo lỗi riêng");
    await T(X,"tong",{set:TA.id}); await T(Z,"tong",{set:TA.id}); await T(Y,"tong",{set:TB.id});
    const tT=`tông ${RUN}`; X.room.send("chat",{text:tT,ch:"tong"});
    ok(await got(Z,tT,"tong")&&has(Z,tT,"tong").name===X.name,`chat tông ${TA.name}: Z ở bản đồ khác nhận (ch tong, tên người gửi)`);
    ok(await got(X,tT,"tong"),"người gửi cũng nhận tin tông của mình");
    await sleep(300); ok(!Y.chats.some(m=>m.text===tT),`Y thuộc ${TB.name} (cùng phòng với X): không nhận tin tông khác`);
    const tY=`tông khác ${RUN}`; Y.room.send("chat",{text:tY,ch:"tong"});
    ok(await got(Y,tY,"tong")&&(await sleep(300),!X.chats.some(m=>m.text===tY)&&!Z.chats.some(m=>m.text===tY)),`tin tông của Y chỉ tới ${TB.name}`);
    await T(Z,"tong",{set:null}); const tT2=`rời tông ${RUN}`; X.room.send("chat",{text:tT2,ch:"tong"});
    ok(await got(X,tT2,"tong")&&(await sleep(300),!Z.chats.some(m=>m.text===tT2)),"Z rời tông: thôi nhận chat tông ngay");

    // ---- Chống spam riêng từng kênh, độ dài, giá trị lạ ----
    await T(X,"chat",{cop:"rlreset"});
    for(let i=0;i<5;i++) X.room.send("chat",{text:`spam ${i} ${RUN}`,ch:"party"});
    await waitFor(()=>has(Z,`spam 4 ${RUN}`,"party"),2000);
    ok(/quá nhanh/.test(await said(X,{text:`spam 5 ${RUN}`,ch:"party"})),"tổ đội: tin thứ 6 liền nhau bị chặn (5 tin, hồi 1 tin / 2 giây)");
    const tMap2=`bđ vẫn được ${RUN}`; X.room.send("chat",{text:tMap2});
    ok(await got(Y,tMap2),"hết lượt tổ đội nhưng chat bản đồ vẫn gửi được (bucket riêng)");
    const tT3=`tông vẫn được ${RUN}`; X.room.send("chat",{text:tT3,ch:"tong"});
    ok(await got(X,tT3,"tong"),"hết lượt tổ đội nhưng chat tông vẫn gửi được (bucket riêng)");
    ok(/quá dài/.test(await said(Y,{text:"a".repeat(121),ch:"whisper",to:Z.name})),"tin quá CHAT_MAX_LEN ký tự bị từ chối");
    for(const m of [{text:"x",ch:"abc"},{text:"x",ch:5},{text:{toString:0},ch:"party"},{text:"x",ch:"whisper",to:{a:1}},{text:"x",ch:"world",to:7},{text:{a:1},ch:"tong"},{text:"x",ch:["tong"]},{text:["x"]},null,"x"]) X.room.send("chat",m);
    const tAfter=`còn kết nối ${RUN}`; await sleep(300); X.room.send("chat",{text:tAfter});
    ok(await got(Y,tAfter)&&X.leftCode===null,"chat mang kênh / người nhận / nội dung lạ: bỏ qua, không ngắt kết nối");

    // ---- Người nhận rời game: báo, không lưu ----
    await Z.room.leave(); await sleep(400);
    ok(/không trong game/.test(await said(Y,{text:"còn đó không",ch:"whisper",to:Z.name})),"Z rời game: tin riêng tới Z báo không trong game");
    await T(X,"chat",{cop:"rlreset"}); const tSolo=`đội vắng ${RUN}`; X.room.send("chat",{text:tSolo,ch:"party"});
    ok(await got(X,tSolo,"party"),"đồng đội rời game: chat tổ đội vẫn gửi cho người còn trong game");
  } finally { for(const b of [X,Y,Z]) if(b.room.connection?.isOpen) await b.room.leave().catch(()=>{}); } // rời phòng 2 lần thì leave() treo
}

/**
 * #195: bạn bè và chặn. Thêm một chiều / hai chiều (chỉ hai bên đã thêm nhau mới thấy online và bản đồ / kênh), lời "đã thêm bạn"
 * kèm "Thêm lại", người ở bản đồ khác, rời game; chặn lọc tin riêng, lời mời tổ đội, lời thêm bạn, chat bản đồ / tổ đội / thế giới và
 * tự bỏ khỏi danh sách bạn bè; trần FRIEND_MAX / BLOCK_MAX (tài khoản ngoại tuyến tạo bằng /api); dữ liệu còn sau khi thoát vào lại
 * (lượt PostgreSQL kiểm qua DB thật).
 */
async function friendTest(){
  console.log("[#195] Bạn bè và chặn");
  const T=async(b,op,extra={})=>{ b.test=null; b.room.send("test",{op,...extra}); await waitFor(()=>b.test,2000); await sleep(80); return b.test; };
  /** Gửi `friend {op, name}`: chờ dòng log (kết quả hoặc lý do); thao tác thành công ("Đã …") thì chờ thêm bảng bạn bè mới. Trả các dòng log mới. */
  const F=async(b,op,name)=>{ const n=b.friendsN, l=b.logs.length; b.room.send("friend",{op,name});
    await waitFor(()=>b.logs.length>l,2000); if(/^Đã /.test(b.logs[l]??"")) await waitFor(()=>b.friendsN>n,2000); await sleep(50); return b.logs.slice(l).join(" | "); };
  const list=async b=>{ const n=b.friendsN; b.room.send("friend",{op:"list"}); await waitFor(()=>b.friendsN>n,2000); return b.friends; };
  const entry=(b,o)=>b.friends?.list?.find(e=>e.name===o.name);
  const said=async(b,msg)=>{ const l=b.logs.length; b.room.send("chat",msg); await waitFor(()=>b.logs.length>l,1500); await sleep(50); return b.logs.slice(l).join(" | "); };
  const has=(b,txt,ch)=>b.chats.some(m=>m.text===txt&&(ch?m.ch===ch:!m.ch));
  const A=await bot("Hữu A","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:1,outfitCol:2}), B=await bot("Hữu B","nhu_cot_tho",{sex:1,hair:2,hairCol:0,outfitCol:1});
  const D=await bot("Hữu D","u_minh_linh_mieu",{sex:0,hair:0,hairCol:3,outfitCol:4}), C=await bot("Hữu C","nhu_cot_tho",{sex:1,hair:1,hairCol:2,outfitCol:3});
  const all=[A,B,C,D];
  try {
    if(!(await T(A,"ping"))?.enabled){ console.log("  ⚠ bỏ qua bạn bè (cần hook test): bật server bằng GAME_TEST=1"); return; }
    // C sang Nặc Đinh Thành (hook warp, như đi cổng): khác bản đồ với A, B, D.
    C.travel=null; await T(C,"warp",{mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>C.travel,3000);
    if(C.travel){ const t=C.travel; await C.room.leave(); await sleep(200); C.mapId=t.mapId; await enter(C,t.roomId??undefined); }
    await waitFor(()=>C.room.state.mapId==="nac_dinh_thanh",2000);
    ok(A.room.roomId===B.room.roomId&&B.room.roomId===D.room.roomId&&C.room.state.mapId==="nac_dinh_thanh",`A, B, D cùng phòng ${A.room.state.mapId}; C ở ${C.room.state.mapId}`);
    for(const b of all){ await T(b,"friend",{fop:"rlreset"}); await T(b,"chat",{cop:"rlreset"}); }
    const l0=await list(A); ok(l0&&l0.list.length===0&&l0.blocks.length===0,"bảng bạn bè ban đầu trống");

    // ---- Thêm một chiều: A thấy B nhưng chưa thấy online / vị trí; B nhận lời "đã thêm bạn" kèm Thêm lại ----
    const nB=B.friendsN; ok(/Đã thêm/.test(await F(A,"add",B.name.toUpperCase())),"A thêm B (tên viết hoa)");
    ok(entry(A,B)&&entry(A,B).mutual===false&&entry(A,B).map===undefined&&entry(A,B).ch===undefined,`một chiều: A có B nhưng không thấy online / bản đồ ${JSON.stringify(entry(A,B))}`);
    await waitFor(()=>B.friendsN>nB&&B.friends?.added,2000);
    ok(B.friends?.added?.name===A.name&&B.friends.added.back===false&&B.friends.list.length===0,`B nhận "A đã thêm bạn" (nút Thêm lại): ${JSON.stringify(B.friends?.added)}`);
    ok(/đã có/.test(await F(A,"add",B.name)),"thêm lại người đã có: từ chối");
    ok(/chính mình/.test(await F(A,"add",A.name)),"tự thêm chính mình: từ chối");
    ok(/Không có hồn sư/.test(await F(A,"add",`Không Ai ${RUN}`)),"thêm tên không có: từ chối");

    // ---- Hai chiều: B thêm lại A, cả hai thấy nhau online, bản đồ / kênh ----
    const nA=A.friendsN; ok(/Đã thêm/.test(await F(B,"add",A.name)),"B thêm lại A");
    await waitFor(()=>A.friendsN>nA&&entry(A,B)?.mutual,2000);
    ok(entry(B,A)?.mutual&&entry(B,A).map===A.room.state.mapId&&entry(B,A).ch===A.room.state.channel,`B thấy A: ${JSON.stringify(entry(B,A))}`);
    ok(entry(A,B)?.mutual&&entry(A,B).map===B.room.state.mapId&&A.friends.added?.back===true,`A được báo B thêm lại (back), thấy B: ${JSON.stringify(entry(A,B))}`);
    // C ở bản đồ khác: thêm nhau thì thấy bản đồ của C.
    await F(A,"add",C.name); await F(C,"add",A.name); await list(A);
    ok(entry(A,C)?.mutual&&entry(A,C).map==="nac_dinh_thanh",`A thấy C ở bản đồ khác: ${JSON.stringify(entry(A,C))}`);
    // D chỉ được A thêm: D không có A nên D không thấy gì, A không thấy D online.
    await F(A,"add",D.name); await list(D);
    ok(entry(A,D)?.mutual===false&&entry(A,D).map===undefined&&D.friends.list.length===0,"A thêm D một chiều: A không thấy D online, D không có A");
    // Xóa rồi thêm lại liên tục: lời "đã thêm bạn" tới cùng người chỉ gửi lại sau một lúc.
    { await F(A,"remove",D.name); const n=D.friendsN, a0=D.friends?.added; D.friends.added=undefined;
      ok(/Đã thêm/.test(await F(A,"add",D.name)),"A xóa D rồi thêm lại ngay"); await sleep(400);
      ok(!D.friends?.added,`D không nhận lại lời "đã thêm bạn" ngay (chống làm phiền): ${D.friendsN-n} bảng mới`); D.friends.added=a0; }

    // ---- C rời game: A thấy C không còn online (vẫn là bạn hai chiều) ----
    { const n=A.friendsN; await C.room.leave(); await waitFor(()=>A.friendsN>n&&entry(A,C)&&entry(A,C).map===undefined,2000); }
    ok(entry(A,C)?.mutual===true&&entry(A,C).map===undefined,`C rời game: A thấy C ngoại tuyến ${JSON.stringify(entry(A,C))}`);

    // ---- Chặn: B chặn A; A tự bị bỏ khỏi danh sách bạn bè của B, A không còn thấy B online ----
    { const n=B.partyMsgs; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>B.partyMsgs>n&&B.party?.invites?.some(i=>i.name===A.name),2000); }
    { const n=A.partyMsgs; B.room.send("party",{op:"invite",name:A.name}); await waitFor(()=>A.partyMsgs>n&&A.party?.invites?.some(i=>i.name===B.name),2000); }
    ok(B.party?.invites?.some(i=>i.name===A.name)&&A.party?.invites?.some(i=>i.name===B.name),"A và B mời nhau vào tổ đội (trước khi chặn)");
    { const n=A.friendsN, pn=B.partyMsgs; ok(/Đã chặn/.test(await F(B,"block",A.name)),"B chặn A"); await waitFor(()=>A.friendsN>n,2000);
      await waitFor(()=>B.partyMsgs>pn,2000); await waitFor(()=>!A.party?.invites?.some(i=>i.name===B.name),2000);
      ok(!B.party?.invites?.some(i=>i.name===A.name)&&!A.party?.invites?.some(i=>i.name===B.name),"chặn thì lời mời tổ đội đang chờ giữa hai người bị bỏ (cả hai chiều)");
      const l=A.logs.length; A.room.send("party",{op:"accept",name:B.name}); await waitFor(()=>A.logs.length>l,1500);
      ok(!A.party?.id&&/hiệu lực|không nhận/.test(A.logs.slice(l).join(" | ")),`A không vào được tổ đội của B (người đã chặn A): ${A.logs.slice(l).join(" | ")}`); }
    await T(A,"party",{pop:"rlreset"});
    ok(!entry(B,A)&&B.friends.blocks.includes(A.name),`chặn thì tự xóa A khỏi bạn bè của B, A vào danh sách chặn: ${JSON.stringify(B.friends)}`);
    ok(entry(A,B)?.mutual===false&&entry(A,B).map===undefined,"A vẫn có B (một chiều) nhưng không còn thấy B online");
    ok(/đã ở trong danh sách chặn/.test(await F(B,"block",A.name)),"chặn lại người đã chặn: từ chối");
    ok(/bỏ chặn trước/.test(await F(B,"add",A.name)),"thêm bạn người đang chặn: phải bỏ chặn trước");
    // Lời thêm bạn của A không tới B.
    await F(A,"remove",B.name); ok(!entry(A,B),"A xóa B khỏi danh sách của mình"); await T(A,"friend",{fop:"rlreset"});
    { const n=B.friendsN; ok(/Đã thêm/.test(await F(A,"add",B.name)),"A thêm B (A không biết bị chặn, danh sách của mình)");
      await sleep(400); ok(!(B.friendsN>n&&B.friends?.added),"B đã chặn A: không nhận lời thêm bạn của A"); }
    // Tin riêng.
    const tW=`riêng ${RUN}`; ok(/không nhận tin riêng/.test(await said(A,{text:tW,ch:"whisper",to:B.name})),"A nhắn riêng B (đã chặn A): báo không gửi được");
    await sleep(200); ok(!has(B,tW,"whisper"),"B không nhận tin riêng của A");
    ok(/đang chặn/.test(await said(B,{text:"alo",ch:"whisper",to:A.name})),"B nhắn riêng người mình chặn: phải bỏ chặn trước");
    // Lời mời tổ đội.
    { const l=A.logs.length; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>A.logs.length>l,1500);
      ok(/không nhận lời mời tổ đội/.test(A.logs.slice(l).join(" | ")),"A mời B vào tổ đội: bị chặn"); }
    B.room.send("party",{op:"get"}); await sleep(300); ok(!(B.party?.invites??[]).some(i=>i.name===A.name),"B không có lời mời của A");
    // Chat bản đồ: D (cùng phòng) nhận, B không.
    const tM=`bản đồ ${RUN}`; A.room.send("chat",{text:tM});
    ok(await waitFor(()=>has(D,tM),2000),"chat bản đồ của A: D nhận"); await sleep(300); ok(!has(B,tM),"chat bản đồ của A: B (đã chặn A) không nhận");
    const tMB=`bản đồ B ${RUN}`; B.room.send("chat",{text:tMB}); ok(await waitFor(()=>has(A,tMB),2000),"chặn một chiều: A vẫn nhận chat bản đồ của B");
    // Chat thế giới: D nhận, B không.
    await T(A,"set",{rowId:A.owned.active,level:WORLD_CHAT.minLevel}); await waitFor(()=>A.room.state.players.get(A.room.sessionId)?.level>=WORLD_CHAT.minLevel,2000);
    const tG=`thế giới ${RUN}`; A.room.send("chat",{text:tG,ch:"world"});
    ok(await waitFor(()=>has(D,tG,"world"),2000),"chat thế giới của A: D nhận"); await sleep(300); ok(!has(B,tG,"world"),"chat thế giới của A: B không nhận");
    // Chat tổ đội: D mời A và B (D không bị chặn); tin tổ đội của A tới D, không tới B.
    for(const x of [A,B]){ const n=x.partyMsgs; D.room.send("party",{op:"invite",name:x.name}); await waitFor(()=>x.partyMsgs>n&&x.party?.invites?.length,2000); x.room.send("party",{op:"accept",name:D.name}); await sleep(300); }
    await waitFor(()=>D.party?.members?.length===3,2000); ok(D.party?.members?.length===3,"D, A, B cùng tổ đội");
    const tP=`đội ${RUN}`; A.room.send("chat",{text:tP,ch:"party"});
    ok(await waitFor(()=>has(D,tP,"party"),2000),"chat tổ đội của A: D nhận"); await sleep(300); ok(!has(B,tP,"party"),"chat tổ đội của A: B không nhận");
    ok(await waitFor(()=>has(A,tP,"party"),2000),"A vẫn nhận bản sao tin tổ đội của mình");
    // Chat tông (#198): A, B, D cùng tông; tin tông của A tới D, không tới B.
    for(const x of [A,B,D]) await T(x,"tong",{set:TONG_MON[0].id});
    const tT=`tông ${RUN}`; A.room.send("chat",{text:tT,ch:"tong"});
    ok(await waitFor(()=>has(D,tT,"tong"),2000),"chat tông của A: D nhận"); await sleep(300); ok(!has(B,tT,"tong"),"chat tông của A: B không nhận");
    for(const x of [A,B,D]) await T(x,"tong",{set:null});
    for(const x of [A,B,D]) x.room.send("party",{op:"leave"}); await sleep(300);
    // Bỏ chặn: tin riêng tới được.
    ok(/Đã bỏ chặn/.test(await F(B,"unblock",A.name.toLowerCase()))&&!B.friends.blocks.includes(A.name),"B bỏ chặn A (tên viết thường)");
    ok(/không có trong danh sách chặn/.test(await F(B,"unblock",A.name)),"bỏ chặn người không bị chặn: từ chối");
    await T(A,"chat",{cop:"rlreset"}); const tW2=`riêng 2 ${RUN}`; A.room.send("chat",{text:tW2,ch:"whisper",to:B.name});
    ok(await waitFor(()=>has(B,tW2,"whisper"),2000),"bỏ chặn rồi: B nhận tin riêng của A");

    // ---- Message lạ: bỏ qua, không ngắt kết nối ----
    for(const m of [{op:{}},{op:"add",name:{toString:0}},{op:"add",name:5},{op:"block",name:["x"]},{op:"zzz",name:"a"},null,"add",{op:"add",name:"   "}]) A.room.send("friend",m);
    await sleep(300); ok(A.leftCode===null&&(await list(A))?.list,"friend mang giá trị lạ: bỏ qua, không ngắt kết nối");

    // ---- Thoát vào lại: danh sách còn (DB), bạn hai chiều ngoại tuyến vẫn là hai chiều ----
    await A.room.leave(); await sleep(400); A.mapId=(await post("/api/me",{token:A.token})).mapId; await enter(A); await waitFor(()=>A.owned,3000);
    await list(A);
    ok(entry(A,B)&&entry(A,C)?.mutual===true&&entry(A,C).map===undefined&&entry(A,D)?.mutual===false,`vào lại: A vẫn có B, C (hai chiều, ngoại tuyến), D ${JSON.stringify(A.friends?.list)}`);
    await list(B); ok(B.friends.list.length===0&&B.friends.blocks.length===0,"B: danh sách bạn bè / chặn trống sau khi chặn rồi bỏ chặn");
    await F(B,"add",A.name); await list(A); ok(entry(A,B)?.mutual&&entry(A,B).map===B.room.state.mapId,"B thêm lại A sau khi bỏ chặn: hai bên lại thấy nhau");

    // ---- Trần FRIEND_MAX / BLOCK_MAX: tài khoản ngoại tuyến (đã thức tỉnh) tạo bằng /api ----
    const E=await bot("Hữu E","bich_lan_xa_hoang",{sex:0,hair:2,hairCol:1,outfitCol:0}); all.push(E);
    const names=[];
    for(let i=0;i<=BLOCK_MAX;i+=10) names.push(...(await Promise.all(Array.from({length:Math.min(10,BLOCK_MAX+1-i)},async(_,k)=>{
      const j=i+k, name=`Hữu ${j} ${RUN}`, l=await post("/api/login",{name,password:PASS});
      await post("/api/looks",{token:l.token,sex:j%2,hair:j%4,hairCol:j%5,outfitCol:j%6});
      return (await post("/api/awaken",{token:l.token,vohon:AWAKEN_CHOICES[j%AWAKEN_CHOICES.length].id})).status===200?name:null; }))));
    ok(names.length===BLOCK_MAX+1&&names.every(Boolean),`tạo ${names.length} tài khoản ngoại tuyến`);
    let fOk=0; for(let i=0;i<FRIEND_MAX;i++){ if(i%9===0) await T(E,"friend",{fop:"rlreset"}); if(/Đã thêm/.test(await F(E,"add",names[i]))) fOk++; }
    await T(E,"friend",{fop:"rlreset"});
    ok(fOk===FRIEND_MAX&&E.friends.list.length===FRIEND_MAX&&E.friends.list.every(e=>!e.mutual&&e.map===undefined),`thêm ${fOk} bạn ngoại tuyến (một chiều)`);
    ok(new RegExp(`đủ ${FRIEND_MAX}`).test(await F(E,"add",names[FRIEND_MAX])),`bạn thứ ${FRIEND_MAX+1}: từ chối (FRIEND_MAX)`);
    let bOk=0; for(let i=0;i<BLOCK_MAX;i++){ if(i%9===0) await T(E,"friend",{fop:"rlreset"}); if(/Đã chặn/.test(await F(E,"block",names[i]))) bOk++; }
    await T(E,"friend",{fop:"rlreset"});
    ok(bOk===BLOCK_MAX&&E.friends.blocks.length===BLOCK_MAX&&E.friends.list.length===0,`chặn ${bOk} người (${FRIEND_MAX} bạn tự bị xóa khỏi danh sách bạn bè)`);
    ok(new RegExp(`đủ ${BLOCK_MAX}`).test(await F(E,"block",names[BLOCK_MAX])),`chặn người thứ ${BLOCK_MAX+1}: từ chối (BLOCK_MAX)`);
    // Chống spam: quá 10 thao tác liền thì bị chặn lượt.
    let rl=""; for(let i=0;i<12&&!rl;i++){ const r=await F(E,"unblock",names[i]); if(/quá nhanh/.test(r)) rl=r; }
    ok(/quá nhanh/.test(rl),`thao tác bạn bè dồn dập: báo quá nhanh (${rl})`);
    await E.room.leave(); await sleep(400); E.mapId=(await post("/api/me",{token:E.token})).mapId; await enter(E); await waitFor(()=>E.owned,3000);
    await list(E); ok(E.friends.list.length===0&&E.friends.blocks.length===BLOCK_MAX-10&&!E.friends.blocks.includes(names[0])&&E.friends.blocks.includes(names[BLOCK_MAX-1]),
      `vào lại: danh sách chặn còn ${E.friends.blocks.length} người (đã bỏ chặn 10)`);
  } finally { for(const b of all) if(b.room.connection?.isOpen) await b.room.leave().catch(()=>{}); }
}

/**
 * #187: dòng phụ hồn cốt. Hàm thuần (bộ theo vị trí, mức theo bậc, đủ dòng ở mốc cuối), rồi S cường hóa hồn cốt đang gắn qua từng
 * mốc (mỗi mốc 1 dòng, không trùng, cộng ngay vào chỉ số); hồn cốt +N tạo bằng hook `give` (chưa có dòng) được tung bù khi vào lại,
 * vào lần nữa không tung thêm (đã lưu; lượt PostgreSQL kiểm qua DB thật).
 */
async function boneSubTest(){
  console.log("[#187] Hồn cốt: dòng phụ ngẫu nhiên ở mốc cường hóa, tung bù cho hồn cốt cũ");
  // Hàm thuần (shared/data.ts): bộ theo vị trí, mức theo bậc niên hạn, đủ dòng ở mốc cuối.
  const rd=(k,x)=>CORE_STATS[k].pct?Math.max(0.1,Math.round(x*10)/10):Math.max(1,Math.round(x));
  const inRoll=(k,v,years)=>v>=rd(k,boneSubMax(k,years)*CORE_SUB_ROLL[0])-1e-9&&v<=rd(k,boneSubMax(k,years)*CORE_SUB_ROLL[1])+1e-9;
  const poolOk=(slot,subs)=>subs.every(([k])=>BONE_SUB_POOL[slot].includes(k))&&new Set(subs.map(([k])=>k)).size===subs.length
    &&!subs.some(([k])=>k===BONE_SLOTS.find(s=>s.id===slot).stat);
  ok(BONE_SLOTS.every(s=>BONE_SUB_POOL[s.id].length>=BONE_MAX_SUBS&&BONE_SUB_POOL[s.id].every(k=>CORE_STATS[k]&&k!==s.stat))
    &&BONE_SUB_K.length===TIERS.length&&BONE_SUB_K.every((x,i)=>i===0||x>BONE_SUB_K[i-1])&&BONE_SUB_K.at(-1)===1,
    `bộ dòng phụ theo vị trí (mã CORE_STATS, không trùng chỉ số chính), hệ số theo bậc ${BONE_SUB_K.join(" / ")}`);
  ok([0,4,5,9,10,15,19,20].map(boneSubsDue).join(" ")==="0 0 1 1 2 3 3 4"&&BONE_ENHANCE_MILESTONES.length===BONE_MAX_SUBS,"số dòng phải có: một dòng mỗi mốc +5 / +10 / +15 / +20");
  ok(boneSubMax("crit",MAX_YEARS)===CORE_STATS.crit.sub&&Math.abs(boneSubMax("hp",1000)-CORE_STATS.hp.sub*BONE_SUB_K[2])<1e-9,"mức dòng phụ = CORE_STATS.sub × BONE_SUB_K theo bậc");
  { const r=boneAddSubs("tay_phai",MAX_YEARS,20,[],Math.random), r2=boneAddSubs("tay_phai",32000,10,[["crit",2]],Math.random), r3=boneAddSubs("than",5000,15,r2.subs.slice(0,1),Math.random);
    ok(r.subs.length===BONE_MAX_SUBS&&r.added.length===BONE_MAX_SUBS&&poolOk("tay_phai",r.subs)&&r.subs.every(([k,v])=>inRoll(k,v,MAX_YEARS)),`+20 từ 0 dòng: đủ ${BONE_MAX_SUBS} dòng ${JSON.stringify(r.subs)}`);
    ok(r2.added.length===1&&r2.subs[0][0]==="crit"&&r2.subs[0][1]===2&&poolOk("tay_phai",r2.subs)&&inRoll(r2.added[0][0],r2.added[0][1],32000),`+10 có 1 dòng: thêm đúng 1 dòng không trùng ${JSON.stringify(r2.subs)}`);
    ok(boneAddSubs("tay_phai",32000,9,[["crit",2]],Math.random).added.length===0&&boneAddSubs("dau",1000,4,[],Math.random).subs.length===0,"chưa qua mốc mới thì không thêm dòng");
    ok(r3.subs.length===3&&r3.added.length===2,"tung bù: thêm đúng phần còn thiếu"); }
  ok(same(parseBoneSubs({subs:[["crit",2],["crit",3],["xx",1],["hp","1"],["hp",30],["atk_pct",1],["mp",9],["mp_pct",1]]}),[["crit",2],["hp",30],["atk_pct",1],["mp",9]])&&same(parseBoneSubs({}),[]),
    "parseBoneSubs bỏ mục hỏng / trùng, tối đa 4 dòng");
  const bb=boneBonus([{slot:"tay_phai",years:32000,enhance:10,subs:[["atk_pct",3],["hp",40]]},{slot:"dau",years:1000,subs:[["atk_pct",1.5]]}]);
  ok(bb.atk===boneStats("tay_phai",32000,10).atk&&bb.atk_pct===4.5&&bb.hp===40&&bb.mp===boneStats("dau",1000).mp,"boneBonus cộng dòng phụ (cùng mã thì dồn)");
  ok(Math.abs(calcStats(0,30,[1,1],1,{atk_pct:10,crit:5,crit_dmg:10}).atk-calcStats(0,30,[1,1],1,{},{atk_pct:10}).atk)<1e-9
    &&calcStats(0,30,[1,1],1,{crit:5,crit_dmg:10}).crit===CRIT.chance+0.05&&calcStats(0,30,[1,1],1,{crit_dmg:10}).critMult===CRIT.mult+0.1,
    "calcStats: dòng % / chí mạng của hồn cốt tính như hồn hạch");
  // Trong game: S cường hóa hồn cốt đang gắn qua các mốc; hồn cốt +N tạo bằng hook (không dòng phụ) được tung bù một lần khi vào lại.
  const S=await bot("Cốt Phụ","u_minh_linh_mieu",{sex:1,hair:0,hairCol:2,outfitCol:1});
  const me=()=>S.room.state.players?.get(S.room.sessionId);
  await waitFor(()=>S.owned&&S.bag&&me(),3000);
  if(!(await test(S,"ping"))?.enabled){ console.log("  ⚠ bỏ qua dòng phụ hồn cốt trong game (cần hook give, stats): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  try{
    const AK="am_kim_khung_trao_hung", act=S.owned.active, itemOf=id=>S.bag.items.find(i=>i.id===id);
    async function op(type,msg){ const n=S.bagMsgs??0, l=S.logs.length; S.room.send(type,msg); await waitFor(()=>(S.bagMsgs??0)>n&&S.logs.length>l,2000); await sleep(80); return S.logs.at(-1)??""; }
    async function give(years,slot,enhance=0){ const had=new Set(bonesOf(S).map(i=>i.id)); await test(S,"give",{code:BONE_ITEM,years,beast:AK,slot,enhance}); return bonesOf(S).find(i=>!had.has(i.id)); }
    const enh=(t,m)=>{ S.enh=null; return op("enhance",{targetId:t,materialIds:m}); };
    const liveOk=s=>s.live&&s.live.maxHp===s.stats.maxHp&&s.live.maxMp===s.stats.maxMp&&Math.abs(s.live.atk-s.stats.atk)<1e-6&&Math.abs(s.live.crit-s.stats.crit)<1e-9&&Math.abs(s.live.critMult-s.stats.critMult)<1e-9;
    const subsOf=id=>parseBoneSubs(itemOf(id)?.stats);
    await test(S,"rest",{s:TEAM_COMBAT_SECS+1});
    // #281: đủ phí đưa một hồn cốt +0 → +20 qua nhiều lần (tổng bằng một lần), dư 777 đồng; mỗi lần trừ đúng phí các cấp vừa qua.
    const feeAll=enhanceFee(BONE_ENHANCE_FEE,0,BONE_MAX_ENHANCE); await test(S,"coin",{n:feeAll+777}); await waitFor(()=>S.bag.honTe===feeAll+777,1500);
    let paid=0; const feeOk=()=>{ const e=S.enh; if(!e) return false; paid+=e.fee; return e.fee===enhanceFee(BONE_ENHANCE_FEE,e.from,e.to)&&S.bag.honTe===feeAll+777-paid; };
    const tp=await give(32000,"tay_phai"); await op("equip",{itemId:tp.id,vohonId:act});
    ok(itemOf(tp.id)?.vohon===act&&subsOf(tp.id).length===0,"đích: Tay phải 32.000 năm đang gắn, chưa có dòng phụ");
    // +0 -> +8 (qua mốc +5): một dòng.
    let m=await give(32000,"tay_phai"), t=await enh(tp.id,[m.id]), s1=await test(S,"stats"), sub=subsOf(tp.id), fees=[feeOk()];
    ok(itemOf(tp.id).enhance>=5&&itemOf(tp.id).enhance<10&&sub.length===1&&poolOk("tay_phai",sub)&&inRoll(sub[0][0],sub[0][1],32000),
      `qua mốc +5 (lên +${itemOf(tp.id).enhance}): thêm 1 dòng ${coreStatText(...(sub[0]??["hp",0]))}`);
    ok(same(S.enh?.subs,sub.map(([k,v])=>({k,v})))&&t.includes(`thêm dòng phụ ${coreStatText(...(sub[0]??["hp",0]))}`),`tin "enhanced" và log báo dòng vừa thêm: ${t}`);
    ok(s1.bones[sub[0]?.[0]]>=sub[0]?.[1]&&liveOk(s1),"dòng phụ cộng ngay vào võ hồn ra trận (boneBonus, calcStats)");
    // Không qua mốc mới: không thêm dòng.
    const lv1=itemOf(tp.id).enhance; m=await give(1000,"tay_phai"); await enh(tp.id,[m.id]); fees.push(feeOk());
    ok(itemOf(tp.id).enhance<10&&same(subsOf(tp.id),sub)&&(S.enh?.subs??[]).length===0,`+${lv1} -> +${itemOf(tp.id).enhance} chưa tới mốc +10: dòng phụ giữ nguyên`);
    // Qua +10 và +15 một lần: thêm 2 dòng; rồi +20: đủ 4 dòng, không trùng, không trùng chỉ số chính.
    const ms=[await give(MAX_YEARS,"tay_phai"),await give(MAX_YEARS,"tay_phai")]; t=await enh(tp.id,ms.map(x=>x.id)); fees.push(feeOk()); const lv2=itemOf(tp.id).enhance, sub2=subsOf(tp.id);
    ok(lv2>=15&&lv2<20&&sub2.length===3&&same(sub2[0],sub[0])&&poolOk("tay_phai",sub2)&&sub2.every(([k,v])=>inRoll(k,v,32000))&&(S.enh?.subs??[]).length===2,
      `qua mốc +10, +15 cùng lúc (lên +${lv2}): thêm 2 dòng ${JSON.stringify(sub2.slice(1))}`);
    const m20=[]; for(let k=0;k<4;k++) m20.push((await give(MAX_YEARS,"tay_phai")).id);
    await enh(tp.id,m20); fees.push(feeOk()); const sub4=subsOf(tp.id), s4=await test(S,"stats");
    ok(fees.every(Boolean)&&paid===feeAll&&S.bag.honTe===777,`#281: 4 lần cường hóa +0 → +${BONE_MAX_ENHANCE} trả phí từng lần đúng các cấp vừa qua, tổng ${formatHonTe(paid)} (= một lần), còn ${formatHonTe(S.bag.honTe)}`);
    ok(itemOf(tp.id).enhance===BONE_MAX_ENHANCE&&sub4.length===BONE_MAX_SUBS&&poolOk("tay_phai",sub4)&&same(sub4.slice(0,3),sub2),
      `+${BONE_MAX_ENHANCE}: đủ ${BONE_MAX_SUBS} dòng ${sub4.map(x=>coreStatText(...x)).join(", ")}`);
    const want=boneBonus([{slot:"tay_phai",years:32000,enhance:BONE_MAX_ENHANCE,subs:sub4}]);
    ok(CORE_STAT_IDS.every(k=>Math.abs(s4.bones[k]-want[k])<1e-9)&&liveOk(s4),"chỉ số trong trận khớp boneBonus kèm 4 dòng phụ");
    // UI-2 (#352): tin riêng "stats" của bảng nhân vật = đúng chỉ số server dùng khi đánh (calcStats, kèm hồn cốt đang gắn), `base` là khi không gắn gì.
    { const n0=S.charStatsMsgs??0; S.room.send("stats",{rowId:act}); await waitFor(()=>(S.charStatsMsgs??0)>n0,3000);
      const cs=S.charStats, sameStat=(x,y)=>["maxHp","maxMp","speed","crit","critMult"].every(k=>Math.abs(x[k]-y[k])<1e-9)&&Math.abs(x.atk-y.atk)<1e-6;
      ok(cs&&cs.rowId===act&&sameStat(cs.total,s4.stats)&&sameStat(cs.base,s4.base),"tin stats: chỉ số tổng hợp và gốc khớp số server tính (calcStats)");
      ok(cs&&cs.total.maxHp===s4.live.maxHp&&cs.total.maxMp===s4.live.maxMp&&Math.abs(cs.total.atk-s4.live.atk)<1e-6&&Math.abs(cs.total.crit-s4.live.crit)<1e-9&&Math.abs(cs.total.critMult-s4.live.critMult)<1e-9,
        "tin stats khớp chỉ số đang dùng khi đánh (live: sinh lực, hồn lực, công, chí mạng)");
      ok(cs&&cs.total.atk>cs.base.atk&&cs.total.atk-cs.base.atk>=s4.bones.atk-1e-6,"tin stats: phần hồn cốt đang gắn cộng vào công (tổng > gốc)");
      const n1=S.charStatsMsgs; S.room.send("stats",{rowId:-5}); S.room.send("stats",{rowId:"x"}); await waitFor(()=>(S.charStatsMsgs??0)>n1,3000);
      ok(S.charStats.rowId===act,"tin stats với rowId lạ: trả võ hồn ra trận, không lỗi");
      // Xin dồn trong một nhịp ASK_CD (bấm nhanh qua các thẻ): tin hẹn cuối phải là võ hồn xin sau cùng, không phải lần xin đầu.
      await sleep(400); const other=S.owned.list.find(v=>v.rowId!==act)?.rowId, ids=other?[act,act,other]:[act,act,act], n2=S.charStatsMsgs??0;
      for(const r of ids) S.room.send("stats",{rowId:r}); await sleep(900);
      ok((S.charStatsMsgs??0)>n2&&S.charStats.rowId===ids[2],`xin stats dồn ${ids.join(", ")}: tin cuối là võ hồn xin sau cùng (${S.charStats.rowId})`); }
    // Tung bù: hồn cốt +N tạo bằng hook (như hồn cốt cường hóa trước #187) chưa có dòng phụ.
    const old=[[await give(12000,"than",12),2],[await give(MAX_YEARS,"dau",20),4],[await give(5000,"chan_trai",4),0]];
    await op("equip",{itemId:old[1][0].id,vohonId:act});
    ok(old.every(([it])=>subsOf(it.id).length===0),"hồn cốt +12 / +20 / +4 tạo bằng hook: chưa có dòng phụ");
    const rejoin=async()=>{ await S.room.leave(); await sleep(400); S.mapId=(await post("/api/me",{token:S.token})).mapId; S.bag=null; await enter(S); S.room.send("bag"); await waitFor(()=>me()&&S.bag&&S.owned,3000); };
    await rejoin();
    const got=old.map(([it])=>subsOf(it.id)), s5=await test(S,"stats");
    ok(S.bag.honTe===777,`#281: vào lại, Hồn Tệ sau phí cường hóa đã lưu (${formatHonTe(S.bag.honTe)})`);
    ok(old.every(([it,n],i)=>got[i].length===n&&poolOk(it.stats.slot,got[i])&&got[i].every(([k,v])=>inRoll(k,v,it.years))),
      `vào lại: tung bù đúng số dòng còn thiếu (+12: ${got[0].length}, +20: ${got[1].length}, +4: ${got[2].length})`);
    ok(same(subsOf(tp.id),sub4),"hồn cốt đã đủ dòng không bị tung thêm");
    ok(itemOf(old[1][0].id)?.vohon===act&&CORE_STAT_IDS.every(k=>Math.abs(s5.bones[k]-boneBonus([{slot:"tay_phai",years:32000,enhance:20,subs:sub4},{slot:"dau",years:MAX_YEARS,enhance:20,subs:got[1]}])[k])<1e-9)&&liveOk(s5),
      "dòng tung bù của hồn cốt đang gắn cộng vào chỉ số ngay khi vào");
    await rejoin();
    ok(old.every(([it],i)=>same(subsOf(it.id),got[i]))&&same(subsOf(tp.id),sub4),"vào lại lần nữa: không tung thêm, dòng phụ giữ nguyên (đã lưu)");
  } finally { await S.room.leave(); }
}

/** #249: bài "liên kích ở đòn thứ 3" của nhóm 1 (comboHits) lặp COMBO_ROUNDS lượt trên một bot riêng gắn 4 hồn hạch Hạo Thiên. */
async function comboTest(){
  console.log("[#249] Hạo Thiên 4 món: liên kích ở đòn thứ 3, lặp nhiều lượt");
  const H=await bot("Liên Kích","u_minh_linh_mieu",{sex:0,hair:1,hairCol:3,outfitCol:2}), me=()=>H.room.state.players?.get(H.room.sessionId);
  await waitFor(()=>H.owned&&H.bag&&me(),3000);
  if(!(await test(H,"ping"))?.enabled){ console.log("  ⚠ bỏ qua liên kích (cần hook give, beast, status): bật server bằng GAME_TEST=1"); await H.room.leave(); return; }
  try{
    const act=H.owned.active, cores=()=>(H.bag?.items??[]).filter(i=>i.code===CORE_ITEM);
    await test(H,"set",{rowId:act,level:100,xp:0,rings:[400,700,1700,5000,12000,20000,50000,100000,100000]});
    for(let k=0;k<4;k++) await test(H,"give",{code:CORE_ITEM,stars:6,set:"hao_thien"});
    for(const it of cores()){ const n=H.bagMsgs??0; H.room.send("equipcore",{itemId:it.id,vohonId:act}); await waitFor(()=>(H.bagMsgs??0)>n,2000); }
    const fx=(await test(H,"stats")).fx;
    ok(same(fx,{atk:0.15,combo:0.4}),`gắn 4 hồn hạch Hạo Thiên: ${JSON.stringify(fx)}`);
    // Chỗ đứng ngay ngoài mép đông làng (đánh được), quay mặt về đông.
    const sv=JSON.parse(readFileSync(mapUrl("thanh_hon_thon"),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="safe");
    let at=null; for(let dy=0;dy<=sv.height/2&&!at;dy+=8) for(const sg of [1,-1]){ const x=sv.x+sv.width+40, y=Math.round(sv.y+sv.height/2+sg*dy);
      await test(H,"goto",{x,y}); if(Math.hypot(me().x-x,me().y-y)<1){ at={x,y}; break; } }
    ok(!!at,`đứng ngoài mép đông làng (${at?.x},${at?.y})`);
    if(!at||!fx?.combo) return;
    const N=Number(process.env.COMBO_ROUNDS??10); let good=0;
    for(let r=0;r<N;r++){
      await test(H,"goto",at); await step(H,1,0); await test(H,"clear");
      const bid=(await test(H,"beast",{dx:12,dy:0,years:MAX_YEARS}))?.bid; await test(H,"bhp",{bid,pct:100}); await test(H,"status",{s:"root",secs:10,bid}); await test(H,"ready");
      const {combos,why}=await comboHits(H,bid);
      if(!same(combos,[0,0,1])){ ok(false,`lượt ${r+1}/${N}: liên kích ở đòn thứ 3 (${combos.join(", ")}) [${why}]`); break; }
      good++;
    }
    if(good===N) ok(true,`${N}/${N} lượt: liên kích đúng ở đòn thứ 3`);
  } finally { await H.room.leave(); }
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

/**
 * Vùng lưu lại trên mặt đất (#161, mục 5.3; BOT_ONLY=ground chỉ chạy phần này): 4 chiêu vũng / sương độc có `ground` (tinh anh theo
 * bảng gốc: Nổ Túi Độc 6 giây, Lân Độc Vụ 8 giây). Trên Thánh Hồn Thôn, ngay ngoài làng: Độc Vụ Thiềm tung Sương Độc dưới chân bot thì
 * để lại sương (state.grounds), đứng trong sương thì Trúng độc cộng tầng theo nhịp, ra khỏi sương thì thôi nhận, sương mất khi hết
 * giờ; người ở xa không có vùng trong state, lại gần (vào tầm sau khi vùng đã có) thì thấy; vũng ở mép làng: bước vào làng (vùng an
 * toàn, vẫn trong vũng) thì hết độc và không nhận thêm; hồn thú gây ra bị hạ thì vũng mất ngay.
 */
async function autoBossTest(){
  console.log("[#218] Tự săn đánh tinh anh, thú vương, boss thế giới: né chiêu báo trước / vùng độc, đóng góp, giới hạn thưởng");
  ok(AUTO_DEFAULTS.elite&&AUTO_DEFAULTS.king&&AUTO_DEFAULTS.world&&["elite","king","world"].every(k=>parseAuto({})[k]===true)
    &&!parseAuto({elite:false}).elite&&parseAuto({elite:false}).king&&parseAuto({king:0}).king===true&&!parseAuto({world:false}).world,
    "3 công tắc tinh anh / thú vương / boss thế giới mặc định bật, bản lưu cũ / sai kiểu thì bật");
  const A=await bot("Săn Boss","cuu_tinh_that_sat_kiem",{sex:0,hair:1,hairCol:3,outfitCol:2});
  if(!(await test(A,"ping"))?.enabled){ console.log("  ⚠ bỏ qua tự săn đánh boss (cần hook warp, goto, spawn, tele, elite, king, wmech, auto): bật server bằng GAME_TEST=1"); await A.room.leave(); return; }
  const NV="tinh_dau_ngoai_vi", LT="loi_tinh_dau", VIEN="thai_than_cu_vien";
  let sid=A.room.sessionId; // đổi mỗi lần vào phòng mới (warp)
  const me=()=>A.room.state.players?.get(A.room.sessionId), objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const autoOp=async(op,more={})=>{ A.autoMsg=null; A.room.send("auto",{op,...more}); await waitFor(()=>A.autoMsg,1500); return A.autoMsg; };
  const info=async(more={})=>(await test(A,"auto",more))??{};
  /** Chờ điều kiện bất đồng bộ (đọc hook test) tới `ms` mili giây. */
  const until=async(fn,ms=5000)=>{ for(let t=0;t<=ms;t+=200){ if(await fn()) return true; await sleep(200); } return false; };
  async function warp(mapId,x,y){ A.travel=null; await test(A,"warp",{mapId,x,y}); await waitFor(()=>A.travel,4000); const tv=A.travel;
    await A.room.leave(); await sleep(300); A.mapId=mapId; await enter(A,tv?.roomId??undefined); await waitFor(()=>me()&&A.bag&&A.owned,3000);
    sid=A.room.sessionId; await test(A,"view",{all:true}); return A.room.state.mapId===mapId; }
  /** Đứng ở chỗ đứng được đầu tiên quanh (x, y), bán kính `r0`.. theo 8 hướng, thỏa `cond`. */
  async function near(x,y,r0=60,cond=()=>true){ for(let r=r0;r<=r0+120;r+=20) for(let k=0;k<8;k++){ const a=k*Math.PI/4, px=Math.round(x+r*Math.cos(a)), py=Math.round(y+r*Math.sin(a));
    if(!cond(px,py)) continue; await test(A,"goto",{x:px,y:py}); if(Math.hypot(me().x-px,me().y-py)<1) return true; } return false; }
  const cfg=(o={})=>autoOp("set",{cfg:{...AUTO_DEFAULTS,...o}});
  /**
   * Đổi đội hình (ngoài giao chiến mới đổi được: nghỉ TEAM_COMBAT_SECS giây bằng hook rest trước). Dọn hồn thú thường quanh mình trước (giữ
   * tinh anh / thú vương / boss): hồn kỹ nhiều nhát tự săn vừa tung (Vô Ngã Kiếm Trận: 6 nhát trong 3 giây) vẫn đánh hồn thú quanh A sau
   * khi tắt tự săn, mỗi nhát trúng là giao chiến lại; nhát rơi giữa hook rest và tin team thì server từ chối đổi đội hình (#268).
   */
  const team=async slots=>{ for(let k=0;k<4&&!same(A.owned.team,slots);k++){ await test(A,"clear",{keep:true}); await test(A,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(A,slots); if(!same(A.owned.team,slots)) await sleep(500); } return same(A.owned.team,slots); };
  /**
   * Võ hồn chính của lượt tự săn là võ hồn ra trận lúc bật (tiên cơ / cơ chế đổi tay lượt trước có thể để lại võ hồn khác): đổi về `row`.
   * Tin vohons tới trước bản vá state: chờ võ hồn trong state (vh, cùng bản vá với swCd) khớp võ hồn ra trận của tin vohons rồi mới đọc swCd
   * (tự săn vừa đổi tay thì swCd đọc được có lúc còn 0) và trước khi trả về; server vẫn bỏ qua tin switch (không trả lời) thì gửi lại.
   */
  const vhSynced=()=>waitFor(()=>me().vh===vohonIndex(A.owned.list.find(v=>v.rowId===A.owned.active)?.vohon??""),1500);
  const swReady=async()=>{ await vhSynced(); await waitFor(()=>!(me().swCd>0),SWITCH_CD*1000+500); };
  const toRow=async row=>{ if(!A.owned.team.includes(row)) return false; await swReady();
    for(let k=0;k<3&&A.owned.active!==row;k++){ A.room.send("switch",{slot:A.owned.team.indexOf(row)});
      if(!await waitFor(()=>A.owned.active===row,1500)&&k<2) await swReady(); }
    await vhSynced(); return A.owned.active===row; };
  try{
    await waitFor(()=>me()&&A.bag&&A.owned,3000);
    // Đội: võ hồn chính (cường công), Lam Ngân Thảo (khống chế), Xúc Xích (phụ trợ, hồn kỹ thanh tẩy ở ô U); mọi võ hồn cấp 100, 9 hồn hoàn.
    await test(A,"grant",{vohon:"xuc_xich"}); await waitFor(()=>A.owned.list.some(v=>v.vohon==="xuc_xich"),3000);
    const rowOf=v=>A.owned.list.find(x=>x.vohon===v)?.rowId, main=A.owned.active, LAM=rowOf("lam_ngan_thao"), XUC=rowOf("xuc_xich");
    await sendTeam(A,[main,LAM,XUC,0]);
    const R9=[400,700,1700,5000,12000,20000,50000,100000,100000];
    for(const v of A.owned.list) await test(A,"set",{rowId:v.rowId,level:100,xp:0,rings:R9});
    const cr=[...Array(R9.length).keys()].find(r=>r!==CHAN_THAN_RING-1&&ringSkill("xuc_xich",r)?.self?.cleanse);
    { const n=A.ownedMsgs; A.room.send("loadout",{rowId:XUC,skills:[cr,0,1,2]}); await waitFor(()=>A.ownedMsgs>n,1500); }
    ok(A.owned.team[1]===LAM&&A.owned.team[2]===XUC&&cr>=0,`đội: ${VOHON[me().vh].name} + Lam Ngân Thảo (khống chế) + Xúc Xích (phụ trợ, ô U: ${ringSkill("xuc_xich",cr)?.name})`);

    // ---- Tinh Đấu Ngoại vi: né chiêu báo trước và vũng độc (mọi lúc tự săn) ----
    const ar=objsOf(NV).find(o=>o.type==="arrive"&&o.name==="tu_nac_dinh_thanh"), safe=objsOf(NV).filter(o=>o.type==="safe"||o.type==="spawn");
    const farSafe=(x,y)=>safe.every(o=>x<o.x-80||x>o.x+o.width+80||y<o.y-80||y>o.y+o.height+80);
    ok(await warp(NV,ar.x,ar.y),`tới ${MAPS[NV].name}`);
    let placed=false; for(let r=200;r<=1200&&!placed;r+=100) placed=await near(ar.x,ar.y,r,farSafe);
    ok(placed,`đứng ngoài trại cổng (${me().x},${me().y})`);
    await test(A,"clear",{keep:true});
    const tt=beastSkillOf("that_tinh_doc_thiem",5000);
    const P=(await test(A,"spawn",{species:"that_tinh_doc_thiem",years:5000,tier:2,dx:50,dy:0,hpx:1000}))?.bid, pb=()=>A.room.state.beasts.get(P);
    await cfg({elite:false,king:false,world:false}); let m=await autoOp("on");
    ok(m?.on&&await until(async()=>(await info()).target===P,4000),`tự săn nhắm ${BEASTS[beastIndex("that_tinh_doc_thiem")].name} (${tt.name}: vòng bán kính ${tt.r} dưới chân, báo trước ${tt.warn} giây, để lại vũng độc)`);
    await waitFor(()=>pb()&&Math.hypot(pb().x-me().x,pb().y-me().y)<40,6000);
    const d0=(await info()).dodges; A.fxs=[];
    const tl=await test(A,"tele",{i:0,bid:P,cancel:true});
    const fired=await waitFor(()=>A.fxs.some(f=>f.k==="teleHit"&&f.bid===P),tt.warn*1000+1500), th=A.fxs.find(f=>f.k==="teleHit"&&f.bid===P), at=me();
    let ai=await info();
    ok(tl?.bid===P&&fired&&!th.hit.includes(sid)&&ai.dodges>d0,`${tt.name} nhắm A: tự săn né ra khỏi vùng trước khi nổ (không trúng; ${ai.dodges-d0} lần né; `
      +`tâm vùng ${th?.x?.toFixed(0)},${th?.y?.toFixed(0)}, A lúc nổ ${at.x.toFixed(0)},${at.y.toFixed(0)}, trúng ${JSON.stringify(th?.hit)})`);
    const pool=(await test(A,"ground",{ttl:30}))?.grounds?.find(z=>z.src===P);
    // Chẩn đoán (#328): lề nhỏ nhất (khoảng cách tới tâm trừ r + TELE_PAD) và chỗ A / P lúc đó.
    let inPool=0, low=null; for(let k=0;k<15;k++){ if(pool){ const g=Math.hypot(me().x-pool.x,me().y-pool.y)-pool.r-TELE_PAD; if(g<=0) inPool++;
      if(!low||g<low.g) low={g,a:[me().x.toFixed(1),me().y.toFixed(1)],p:pb()?[pb().x.toFixed(0),pb().y.toFixed(0)]:null,k}; } await sleep(200); }
    ok(pool&&inPool===0&&me().auto,`vũng độc còn ${pool?.ttl?.toFixed(0)} giây: tự săn đánh tiếp mà không bước vào vũng (3 giây)`
      +(pool&&inPool===0&&me().auto?"":` [vũng ${pool?`${pool.x.toFixed(0)},${pool.y.toFixed(0)} r${pool.r}`:"không có"}, ${inPool}/15 lần trong vũng, lề nhỏ nhất ${low?.g?.toFixed(2)} ở lần ${low?.k} (A ${low?.a}, P ${low?.p}), tự săn ${me().auto?"bật":`dừng: ${A.autoMsg?.why}`}, ${JSON.stringify(await info().then(x=>({target:x.target,dodge:x.dodge,dodges:x.dodges})))}]`));
    // Bật tự săn khi đang đứng trong vũng: ra khỏi vũng ngay.
    await autoOp("off"); await test(A,"goto",{x:Math.round(pool.x),y:Math.round(pool.y)});
    const d1=(await info()).dodges; m=await autoOp("on");
    ok(m?.on&&await waitFor(()=>Math.hypot(me().x-pool.x,me().y-pool.y)>pool.r+TELE_PAD,2500)&&(await info()).dodges>d1,`đứng giữa vũng rồi bật: ra khỏi vũng (cách tâm ${Math.hypot(me().x-pool.x,me().y-pool.y).toFixed(0)} pixel)`);
    await autoOp("off"); await test(A,"slay",{bid:P});

    // ---- Tinh anh: mục tiêu chung, đóng góp, khóa ELITE.lock, công tắc ----
    let el=(await test(A,"elite")).list; if(!el.some(e=>e.bid)){ await test(A,"erespawn",{s:0}); await until(async()=>(el=(await test(A,"elite")).list).some(e=>e.bid),3000); }
    const E1=el.find(e=>e.bid), lockKey=`${NV}|${E1?.boss}`;
    ok(E1&&await near(E1.x,E1.y,70,farSafe),`${E1?.name} ở ${E1?.zone}: đứng cách ${Math.hypot(E1.x-me().x,E1.y-me().y).toFixed(0)} pixel`);
    // Đang khóa thưởng loài tinh anh này (đặt khóa thẳng bằng hook elock {key}): tự săn không nhắm (vào đánh chỉ làm tinh anh nhiều máu hơn
    // cho người khác); hết khóa thì nhắm.
    await test(A,"bmax",{bid:E1.bid,x:1000}); await test(A,"elock",{key:lockKey,s:120}); await test(A,"clear",{keep:true});
    await cfg({years:[0,0],king:false,world:false}); m=await autoOp("on");
    let took=!m?.on; for(let k=0;k<12;k++){ ai=await info(); if(ai.target===E1.bid) took=true; await sleep(250); }
    ok(!took,`đang khóa thưởng ${lockKey}: tự săn không nhắm tinh anh (mục tiêu ${ai.target})`);
    await test(A,"elock",{s:0});
    ok(await until(async()=>{ ai=await info(); return ai.target===E1.bid&&ai.boss; },4000),`hết khóa: tự săn (khoảng niên hạn trống) tới đánh tinh anh trước cả hồn thú đang đánh mình (mục tiêu ${ai.target})`);
    let one=null;
    ok(await until(async()=>{ one=(await test(A,"elite",{bid:E1.bid})).one; return one?.engaged&&one.parts.includes(sid)&&one.dmgBy[sid]>0; },10000),
      `thành người tham gia, đóng góp ${one?.dmgBy?.[sid]} sát thương`);
    await cfg({years:[0,0],elite:false,king:false,world:false});
    ok(await until(async()=>(await info()).target!==E1.bid,2000)&&me().auto,"tắt công tắc Tinh anh: thôi nhắm tinh anh, vẫn tự săn");
    await cfg({years:[0,0],king:false,world:false});
    ok(await until(async()=>(await info()).target===E1.bid,4000),"bật lại: nhắm lại tinh anh");
    const k0=me().kills, lowHp=async bid=>{ const b=A.room.state.beasts.get(bid); if(b) await test(A,"kdmg",{bid,v:Math.max(1,b.hp-200)}); };
    await lowHp(E1.bid);
    ok(await waitFor(()=>!A.room.state.beasts.has(E1.bid)&&me().kills>k0,30000),
      `tự săn hạ tinh anh [tự săn ${JSON.stringify(await info().then(x=>({target:x.target,boss:x.boss,away:x.away})))}, A ${me().x?.toFixed(0)},${me().y?.toFixed(0)} ${me().hp}/${me().maxHp}, tinh anh ${A.room.state.beasts.get(E1.bid)?.hp}]`);
    const lk=(await test(A,"elock")).locks; ok(lk[lockKey]>ELITE.lock-30,`nhận thưởng tinh anh: khóa ${lockKey} ${Math.round(lk[lockKey]??0)} giây`);
    await autoOp("off");

    // ---- Thú vương: mục tiêu chung, giới hạn KING.daily, lùi khi ít máu, hạ thì nhận rương ----
    // Bỏ Xúc Xích khỏi đội trong phần này: trạng thái xấu lâu của thú vương làm tự săn đổi sang Xúc Xích thanh tẩy (đầy máu), lẫn với bước lùi.
    ok(await toRow(main)&&await team([main,LAM,0,0]),"thú vương: đội chỉ võ hồn chính + Lam Ngân Thảo");
    await test(A,"king",{kop:"spawn"}); await waitFor(()=>[...A.room.state.beasts.values()].some(b=>b.rank===2),2000);
    let ki=await test(A,"king"); const LR=ki.lair, KB=ki.bid, kb=()=>A.room.state.beasts.get(KB);
    await test(A,"bmax",{bid:KB,x:1000});
    const inL=(x,y)=>x>=LR.x&&x<=LR.x+LR.w&&y>=LR.y&&y<=LR.y+LR.h;
    ok(KB&&await near(LR.x+LR.w/2,LR.y+LR.h/2,Math.max(LR.w,LR.h)/2+30,(x,y)=>!inL(x,y)&&farSafe(x,y)),`thú vương ${beastName(2,kb()?.species)} trong hang; A đứng ngoài hang`);
    await cfg({years:[0,0],elite:false,world:false}); m=await autoOp("on");
    ok(m?.on&&await until(async()=>{ ai=await info(); return ai.target===KB&&ai.boss; },10000),"tự săn tới đánh thú vương");
    ok(await until(async()=>{ ki=await test(A,"king"); return ki.parts?.includes(sid)&&ki.dmgBy?.[sid]>0; },30000),`đóng góp được ghi: ${ki.dmgBy?.[sid]} sát thương`);
    await info({kn:KING.daily});
    ok(await until(async()=>(await info()).target!==KB,8000),`hết lượt rương hôm nay (${KING.daily}/${KING.daily}): thôi nhắm thú vương`);
    await info({kn:0});
    // Chờ theo state (không theo giờ cố định): server chạy chậm trên runner CI thì nhịp quyết định (AUTO_HZ) và đi bộ đều chậm theo,
    // 3 giây thật không đủ; điều kiện vẫn như cũ, chỉ có trần chờ rộng hơn. Kèm vết mục tiêu / sinh lực để lần trượt sau còn chẩn đoán.
    const tg=[]; ok(await until(async()=>{ const x=await info(); tg.push(`${me().hp}/${me().maxHp}${x.away?" lùi":""} ${x.target===KB?"nhắm":x.target??"-"}`); return x.target===KB; },15000),
      `còn lượt: nhắm lại thú vương [${tg.slice(-8).join(" | ")}]`);
    // Ít máu (không uống đan): lùi ra cách thú vương ít nhất AUTO_BOSS.dist, hồi đủ thì quay lại.
    // Không đổi tay tiên cơ, không tung hồn kỹ trong bước này (đổi sang võ hồn còn đầy máu, hồn kỹ hút máu / hồi máu cũng là cách thoát,
    // nhưng ở đây thử lùi).
    // Thú vương đứng Choáng trong bước này: đánh tiếp lúc còn 20% sinh lực thì võ hồn ra trận gục trước khi kịp lùi (võ hồn khác vào thay).
    await cfg({years:[0,0],elite:false,world:false,hp:0,tienCo:false,skills:[]}); await waitFor(()=>!(me().swCd>0),SWITCH_CD*1000+500);
    // Đứng ngoài tầm đánh thường lúc mất máu: một đòn trúng có hút huyết trước nhịp quyết định kế tiếp đã đủ hồi lại (khi đó không cần lùi).
    await test(A,"status",{s:"stun",secs:10,bid:KB}); await near(kb().x,kb().y,72,(x,y)=>farSafe(x,y));
    await test(A,"hurt",{pct:80}); const rt=[`${me().hp}/${me().maxHp}`];
    // Chờ bản vá state mang sinh lực mới tới bot (hook trả trước bản vá), rồi chờ cờ lùi và quãng đi ra theo state, không theo giờ cố định.
    await waitFor(()=>me().hp<me().maxHp*AUTO_BOSS.retreat,5000);
    const sample=async()=>{ ai=await info(); rt.push(`${me().hp}/${me().maxHp} ${VOHON[me().vh].id.slice(0,5)}${ai.away?" lùi":""} ${Math.hypot(me().x-kb().x,me().y-kb().y).toFixed(0)}px`); return ai; };
    ok(await until(async()=>(await sample()).away,10000)
      &&await waitFor(()=>Math.hypot(me().x-kb().x,me().y-kb().y)>=AUTO_BOSS.dist-8,15000),
      `sinh lực ${me().hp}/${me().maxHp} dưới ${AUTO_BOSS.retreat*100}%: lùi ra cách thú vương ${Math.hypot(me().x-kb().x,me().y-kb().y).toFixed(0)} pixel [${rt.slice(-12).join(" | ")}]`);
    await test(A,"pregen",{s:0,hp:100,mp:100});
    ok(await until(async()=>{ ai=await info(); return !ai.away&&ai.target===KB; },10000),"hồi đủ sinh lực: quay lại đánh");
    await cfg({years:[0,0],elite:false,world:false});
    await lowHp(KB);
    ok(await waitFor(()=>!kb(),30000),"tự săn hạ thú vương");
    const cl=await test(A,"claims");
    ok(cl?.n===1&&cl.db===1&&A.logs.some(t=>/^Nhận .*Rương/i.test(t)||/Nhận .*rương/i.test(t)),`đóng góp đủ: nhận rương, lượt ${cl?.n}/${KING.daily} hôm nay (DB ${cl?.db})`);
    await autoOp("off");

    // ---- Lõi Tinh Đấu: boss thế giới (tự săn bật được ở bản đồ boss), ngắt tích lực, né chiêu toàn sàn, thanh tẩy ----
    ok(await team([main,LAM,XUC,0]),"boss thế giới: đội có lại Xúc Xích (phụ trợ)");
    const arLT=objsOf(LT).find(o=>o.type==="arrive"&&o.name==="tu_tinh_dau_noi_dia");
    ok(await warp(LT,arLT.x,arLT.y),`tới ${MAPS[LT].name}`);
    await test(A,"king",{kop:"spawn",mapId:LT,boss:VIEN}); await waitFor(()=>[...A.room.state.beasts.values()].some(b=>b.rank===3),2000);
    await test(A,"wmech",{m:"hold",secs:300}); await test(A,"wmech",{m:"timers"});
    ki=await test(A,"king"); const WB=ki.bid, wb=()=>A.room.state.beasts.get(WB), WL=ki.lair, inW=(x,y)=>x>=WL.x&&x<=WL.x+WL.w&&y>=WL.y&&y<=WL.y+WL.h;
    await test(A,"bmax",{bid:WB,x:100});
    ok(WB&&await near(wb().x,wb().y,40,inW),"A vào sàn đấu cạnh boss thế giới");
    // Không đổi tay tiên cơ ở phần này: chỉ đổi võ hồn theo cơ chế boss (khống chế, phụ trợ). Võ hồn chính của lượt tự săn là võ hồn ra
    // trận lúc bật: đổi về võ hồn chính trước.
    await toRow(main);
    await cfg({years:[0,0],elite:false,king:false,tienCo:false}); m=await autoOp("on");
    ok(m?.on&&await until(async()=>{ ai=await info(); return ai.target===WB&&ai.boss; },3000),`bật tự săn ở ${MAPS[LT].name} (bản đồ boss): đánh boss thế giới`);
    ok(await until(async()=>(ki=await test(A,"king")).dmgBy?.[sid]>0,8000),`đóng góp ${ki.dmgBy?.[sid]} sát thương`);
    const DV=BOSSES[bossIndex(VIEN)], CH=DV.world.charge.skill;
    // Tiên cơ có thể vừa đổi tay: chờ hết hồi chiêu đổi, hồn kỹ sẵn sàng rồi mới cho tích lực.
    await waitFor(()=>!(me().swCd>0),SWITCH_CD*1000+500); await test(A,"ready");
    A.boss=[]; A.fxs=[]; await test(A,"wmech",{m:"hold",secs:0}); await test(A,"wmech",{m:"charge"});
    // Lần ngắt chỉ tính khi võ hồn Khống chế đang ra trận (worldBreak): có tin `brk` của A là đã đổi sang Lam Ngân Thảo.
    const vhs=new Set(); await waitFor(()=>{ vhs.add(VOHON[me().vh].id); return A.boss.some(x=>x.k==="brk"&&x.by===me().name); },CH.warn*1000);
    // Tin `brk` có thể tới trước bản vá state mang võ hồn vừa đổi (#362: lần ngắt đã tính, tức server thấy Khống chế ra trận, mà bot chưa
    // thấy Lam Ngân Thảo); đổi lại phải chờ SWITCH_CD giây nên bản vá kế tiếp luôn còn Lam Ngân Thảo: chờ thấy nó.
    if(A.boss.some(x=>x.k==="brk"&&x.by===me().name)) await waitFor(()=>{ vhs.add(VOHON[me().vh].id); return vhs.has("lam_ngan_thao"); },1000);
    ok(A.boss.some(x=>x.k==="brk"&&x.by===me().name)&&vhs.has("lam_ngan_thao"),`boss tích lực ${CH.name}: đổi sang Lam Ngân Thảo (khống chế) và ngắt (${A.boss.filter(x=>x.k==="brk").length} lần; võ hồn ra trận ${[...vhs].join(" → ")})`);
    await waitFor(()=>!wb()||!wb().chg||A.boss.some(x=>x.k==="broken"),CH.warn*1000+1500);
    await waitFor(()=>A.boss.some(x=>x.k==="broken")||A.fxs.some(f=>f.k==="teleHit"&&f.name===CH.name),10000);
    const ch=A.fxs.find(f=>f.k==="teleHit"&&f.name===CH.name);
    ok(A.boss.some(x=>x.k==="broken")||(ch&&!ch.hit.includes(sid)),A.boss.some(x=>x.k==="broken")?"tích lực bị ngắt (boss Choáng)":`không ngắt kịp: A đứng vào vòng an toàn / ra khỏi sàn, không trúng ${CH.name}`);
    await test(A,"wmech",{m:"hold",secs:300}); await sleep(600);
    await near(wb().x,wb().y,30,inW); await sleep(300);
    A.fxs=[]; const dS=(await info()).dodges; await test(A,"wmech",{m:"hold",secs:0}); await test(A,"wmech",{m:"slam"});
    // Lúc bắt đầu báo trước: A đứng trong sàn, ngoài mọi vòng an toàn thì phải né (vòng rải ngẫu nhiên, có thể trùng chỗ A đang đứng).
    await waitFor(()=>A.fxs.some(f=>f.k==="tele"&&f.name===WORLD_SLAM.name),1500);
    const p0=me(), sf0=A.fxs.find(f=>f.k==="tele"&&f.name===WORLD_SLAM.name)?.safe??[], must=inW(p0.x,p0.y)&&!sf0.some(q=>teleSafe(q,p0.x,p0.y));
    ok(await waitFor(()=>A.fxs.some(f=>f.k==="teleHit"&&f.name===WORLD_SLAM.name),WORLD_SLAM.warn*1000+2000),`${WORLD_SLAM.name} (chiêu toàn sàn) tung`);
    const sl=A.fxs.find(f=>f.k==="teleHit"&&f.name===WORLD_SLAM.name), mp=me();
    ai=await info();
    ok(sl&&!sl.hit.includes(sid)&&(!must||ai.dodges>dS),`${must?"":"(lúc báo trước đã đứng ở chỗ an toàn) "}né ${WORLD_SLAM.name}: không trúng (${(sl?.safe??[]).some(q=>teleSafe(q,mp.x,mp.y))?"đứng trong vòng an toàn":inW(mp.x,mp.y)?"trong sàn":"ra khỏi sàn"}; `
      +`${ai.dodges-dS} lần chọn chỗ né, trúng ${JSON.stringify(sl?.hit)})`);
    await test(A,"wmech",{m:"hold",secs:300});
    // Vết thương sâu (trạng thái xấu còn lâu): đổi sang Xúc Xích (phụ trợ), tung hồn kỹ thanh tẩy, rồi về võ hồn chính.
    const armorBit=statusBit("armor"), onMain=await waitFor(()=>A.owned.active===main&&!(me().swCd>0),SWITCH_CD*2000+3000); await test(A,"ready");
    await test(A,"pst",{s:"armor",n:3,secs:30});
    // Đổi tay và thanh tẩy có thể xong trong cùng một nhịp server (bản vá không kịp mang trạng thái): xét kết quả, không xét lúc có trạng thái.
    const vh2=new Set(), cleaned=await waitFor(()=>{ vh2.add(VOHON[me().vh].id); return vh2.has("xuc_xich")&&!(me().st&armorBit); },8000);
    // Chẩn đoán (#328): trượt kèm đội không có Xúc Xích là dây chuyền của dòng "boss thế giới: đội có lại Xúc Xích" ở trên.
    if(!cleaned){ const g=await test(A,"ground"), i3=await info(); console.log(`  (thanh tẩy: st ${JSON.stringify(g?.st)}, cleanse ${i3.cleanse}, đội ${JSON.stringify(A.owned.team)} ${JSON.stringify(A.squad?.list?.map(x=>[x.rowId,x.hp,x.down]))}, ra trận ${A.owned.active}, Xúc Xích ${XUC}, `
      +`đã về võ hồn chính trước khi gây ${onMain}, hồi đổi ${me().swCd}, hồn lực ${me().mp}/${me().maxMp}, mục tiêu ${i3.target} (boss ${i3.boss}), lùi ${i3.away}, vai ${i3.role})`); }
    ok(cleaned,`${A.owned.team.includes(XUC)?"":"(đội không có Xúc Xích) "}${STATUS.armor.name} 30 giây: đổi sang Xúc Xích, thanh tẩy (${ringSkill("xuc_xich",cr)?.name}; võ hồn ra trận ${[...vh2].join(" → ")}, `
      +`còn ${Object.keys(STATUS).filter(s=>me().st&statusBit(s)).join(", ")||"không trạng thái"}; tự săn ${JSON.stringify(await info().then(x=>({role:x.role,target:x.target,away:x.away})))})`);
    const mainDown=()=>A.squad?.list?.find(x=>x.rowId===main)?.down>0;
    const back=await waitFor(()=>A.owned.active===main||mainDown(),SWITCH_CD*1000+3000); ai=await info();
    ok(back,mainDown()?"xong việc: võ hồn chính đã gục, ở lại võ hồn đang ra trận":`xong việc: về võ hồn chính (đang ${VOHON[me().vh].name}; `
      +`${JSON.stringify({home:ai.home,main,role:ai.role,target:ai.target,boss:ai.boss,swCd:me().swCd,squad:A.squad?.list?.map(x=>[x.rowId,x.hp,x.down])})})`);
    await autoOp("off"); await test(A,"slay",{bid:WB});

    // ---- Cực Bắc Chi Địa: Cực Hàn (#163) của Huyền Minh Băng Giao: đủ AUTO_BOSS.chill tầng Hàn, không có thanh tẩy thì tới Hỏa Đàn xả ----
    const CB="cuc_bac_chi_dia", CD=BOSSES[bossIndex(MAPS[CB].king)]?.phase2?.cold, han=()=>me()?.han??0;
    if(CD){
      ok(await toRow(main)&&await team([main,LAM,0,0]),"Cực Hàn: đội không có võ hồn phụ trợ (phải tới Hỏa Đàn)");
      ok(await warp(CB,0,0),`tới ${MAPS[CB].name}`);
      await test(A,"clear",{all:true,keep:1});
      await test(A,"king",{kop:"spawn"}); await waitFor(()=>[...A.room.state.beasts.values()].some(b=>b.rank===2),2000);
      let kc=await test(A,"king"); const CKB=kc.bid, CL=kc.lair, ck=()=>A.room.state.beasts.get(CKB), inC=(x,y)=>x>=CL.x&&x<CL.x+CL.w&&y>=CL.y&&y<CL.y+CL.h;
      await test(A,"bmax",{bid:CKB,x:100});
      const fire=(await test(A,"cold"))?.fire, hold=()=>test(A,"status",{s:"stun",secs:60,bid:CKB}), dF=()=>Math.hypot(me().x-fire.x,me().y-fire.y);
      await hold();
      ok(fire&&CKB&&await near(ck().x,ck().y,40,(x,y)=>inC(x,y)&&Math.hypot(x-fire.x,y-fire.y)>CD.fire.r+40),`A trong hang cạnh ${beastName(2,ck()?.species)}, cách Hỏa Đàn ${fire?dF().toFixed(0):"?"} pixel`);
      await test(A,"kdmg",{bid:CKB,v:1}); kc=await test(A,"king"); await test(A,"kdmg",{bid:CKB,v:Math.ceil(kc.hp-kc.maxHp*KING.phaseHp)+1});
      ok(await waitFor(()=>ck()?.phase===2,2000),"thú vương sang giai đoạn 2 (Cực Hàn)");
      await sleep(KING.roarSecs*1000+150); await hold(); // tiếng gầm bỏ khống chế: hết gầm thì Choáng lại (không đánh A)
      // Võ hồn ra trận là võ hồn chính (không phụ trợ): không có hồn kỹ thanh tẩy nào để giải tầng Hàn.
      ok(await toRow(main)&&VOHON[me().vh].he!=="phu_tro",`ra trận ${VOHON[me().vh].name}, đội không có võ hồn phụ trợ`);
      await cfg({years:[0,0],elite:false,world:false,tienCo:false}); m=await autoOp("on");
      ok(m?.on&&await until(async()=>(await info()).target===CKB,3000),"tự săn đánh thú vương giai đoạn 2");
      // Tích nhanh tầng Hàn (hook cold {acc}: như đã đứng gần đủ một nhịp).
      for(let k=0;k<AUTO_BOSS.chill;k++){ await test(A,"cold",{acc:CD.every-0.05}); await waitFor(()=>han()>k,1500); }
      const h0=han(); let warm=false, minF=Infinity, left=false; const tr=[];
      const cleared=await until(async()=>{ const i=await info(); if(i.warm) warm=true; minF=Math.min(minF,dF()); if(!inC(me().x,me().y)) left=true;
        tr.push(`${dF().toFixed(0)}${i.warm?" tới Hỏa Đàn":""} ${han()} tầng ${VOHON[me().vh].id}`); return han()===0; },8000);
      // Đọc vị trí theo bản vá, mỗi lần đọc cách nhau vài nhịp (đi được ~20 pixel): lề 16 pixel.
      ok(h0>=AUTO_BOSS.chill&&cleared&&warm&&!left&&minF<=CD.fire.r+16,`${h0} tầng Hàn, không có thanh tẩy: tới Hỏa Đàn (cách ${minF.toFixed(0)} pixel, bán kính ${CD.fire.r}), xả hết tầng${left?" (có lúc ra khỏi hang)":""} [${tr.join(" ")}]`);
      ok(await until(async()=>{ ai=await info(); return !ai.warm&&ai.target===CKB&&dF()>CD.fire.r; },6000)&&me().auto,"hết tầng Hàn: quay lại đánh thú vương");
      await autoOp("off"); await test(A,"slay",{bid:CKB});
    }
  }finally{ await A.room.leave(); }
}

/**
 * Đo hiệu năng (#218; BOT_ONLY=autobossperf, không chạy trong bot đầy đủ): AB_N bot (mặc định 12) cấp 100 tự săn cùng đánh boss thế giới ở
 * Lõi Tinh Đấu AB_SECS giây (mặc định 40), có Bạo Nộ / tích lực chen giữa để mọi người cùng né. Cần server PERF_LOG=1:
 *   npm run bot:local -- --only autobossperf --env PERF_LOG=1
 * In thời gian tick / bản vá trung bình, lớn nhất của phòng lúc đứng yên và lúc cùng đánh, số lần né, máu boss đã mất.
 */
async function autoBossPerf(){
  const N=Math.max(2,Number(process.env.AB_N)||12), SECS=Math.max(10,Number(process.env.AB_SECS)||40), LT="loi_tinh_dau", VIEN="thai_than_cu_vien";
  console.log(`[#218] Đo hiệu năng: ${N} bot tự săn cùng đánh boss thế giới ${SECS} giây`);
  const B=[]; for(let i=0;i<N;i++) B.push(await bot(`Đánh Boss ${i}`,AWAKEN_CHOICES[i%AWAKEN_CHOICES.length].id,{sex:i%2,hair:i%4,hairCol:i%5,outfitCol:i%6}));
  const mo=b=>b.room.state.players?.get(b.room.sessionId), H=B[0];
  try{
    if(!(await test(H,"ping"))?.enabled){ console.log("  ⚠ bỏ qua: bật server bằng GAME_TEST=1"); return; }
    const arLT=JSON.parse(readFileSync(mapUrl(LT),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="arrive"&&o.name==="tu_tinh_dau_noi_dia");
    const R9=[400,700,1700,5000,12000,20000,50000,100000,100000];
    for(const b of B){
      await waitFor(()=>mo(b)&&b.owned,3000);
      for(const v of b.owned.list) await test(b,"set",{rowId:v.rowId,level:100,xp:0,rings:R9});
      b.travel=null; await test(b,"warp",{mapId:LT,x:arLT.x,y:arLT.y}); await waitFor(()=>b.travel,4000); const tv=b.travel;
      await b.room.leave(); await sleep(200); b.mapId=LT; await enter(b,tv?.roomId??undefined); await waitFor(()=>mo(b)&&b.owned&&b.bag,3000);
    }
    const rooms=new Set(B.map(b=>b.room.roomId));
    ok(rooms.size===1,`${N} bot cùng một kênh ${MAPS[LT].name}`);
    await test(H,"king",{kop:"spawn",mapId:LT,boss:VIEN,life:1800}); await waitFor(()=>[...H.room.state.beasts.values()].some(x=>x.rank===3),2000);
    // Máu boss x AB_HPX (mặc định 10) để cả lượt đo là trận đánh thật (12 hồn sư cấp 100 hạ boss máu gốc WORLD.hp trong khoảng 2,5 phút;
    // 10 x WORLD.hp 150 bằng máu của lượt đo cũ 50 x 30 trước #265).
    let ki=await test(H,"king"); await test(H,"bmax",{bid:ki.bid,x:Math.max(1,Number(process.env.AB_HPX)||10)}); ki=await test(H,"king");
    const L=ki.lair, cell=SYNC_VIEW.cell, used=new Map();
    // Rải mỗi bot một chỗ trong sàn đấu (mỗi ô lưới đồng bộ tối đa AUTO_MAX_PER_CELL điểm neo); sàn đầy thì ra quanh sàn (lề tăng dần).
    for(const b of B) for(let k=0;k<400;k++){
      const pad=k<200?-16:16*Math.ceil((k-199)/50), x=Math.round(L.x-pad+Math.random()*(L.w+2*pad)), y=Math.round(L.y-pad+Math.random()*(L.h+2*pad));
      const key=`${Math.floor(x/cell)},${Math.floor(y/cell)}`;
      if((used.get(key)??0)>=AUTO_MAX_PER_CELL) continue; await test(b,"goto",{x,y}); if(Math.hypot(mo(b).x-x,mo(b).y-y)<1){ used.set(key,(used.get(key)??0)+1); break; }
    }
    const perf=async(reset)=>test(H,"perf",{reset});
    const p0=await perf(true); if(!p0?.on) console.log("  ⚠ server chưa bật PERF_LOG=1: không đo được thời gian tick (npm run bot:local -- --only autobossperf --env PERF_LOG=1)");
    await sleep(10000); const idle=await perf(true);
    const ons=[]; for(const b of B){ b.autoMsg=null; b.room.send("auto",{op:"set",cfg:{...AUTO_DEFAULTS,elite:false,king:false}}); await waitFor(()=>b.autoMsg,1500);
      b.autoMsg=null; b.room.send("auto",{op:"on"}); await waitFor(()=>b.autoMsg,1500); ons.push(!!b.autoMsg?.on); }
    ok(ons.every(Boolean),`${ons.filter(Boolean).length}/${N} bot bật tự săn`);
    await perf(true); const hp0=ki.hp/ki.maxHp, t0=Date.now();
    await sleep(SECS*1000/4); await test(H,"wmech",{m:"slam"});
    await sleep(SECS*1000/4); await test(H,"wmech",{m:"charge"});
    await sleep(SECS*1000/2);
    const fight=await perf(true), k2=await test(H,"king"), infos=[]; for(const b of B) infos.push(await test(b,"auto"));
    const dodges=infos.reduce((s,x)=>s+(x?.dodges??0),0), onBoss=infos.filter(x=>x?.target===ki.bid).length, still=B.filter(b=>mo(b)?.auto).length;
    const f=(x)=>x?.n?`tick ${x.tick.toFixed(3)} ms (tự săn ${x.auto.toFixed(3)} ms), bản vá ${x.patch.toFixed(3)} ms, lớn nhất ${x.max.toFixed(2)} ms (${x.n} nhịp)`:"không đo";
    console.log(`  · đứng yên ${N} bot: ${f(idle)}`);
    const off=B.map((b,i)=>[b,infos[i]]).filter(([,x])=>x?.target!==ki.bid).map(([b,x])=>`${b.name.split(" ").slice(0,3).join(" ")}: ${mo(b)?.auto?`nhắm ${x?.target}`:"đã dừng"} (${mo(b)?.x?.toFixed(0)},${mo(b)?.y?.toFixed(0)})`);
    if(off.length) console.log(`  · không nhắm boss: ${off.join("; ")}`);
    console.log(`  · ${still} bot tự săn đánh boss ${((Date.now()-t0)/1000).toFixed(0)} giây: ${f(fight)}; ${onBoss} bot đang nhắm boss, ${dodges} lần né, máu boss ${(hp0*100).toFixed(0)}% → ${k2.bid?(k2.hp/k2.maxHp*100).toFixed(0)+"%":"đã bị hạ"}`);
    ok(still>=N-1&&(onBoss>=N-1||!k2.bid)&&dodges>0,`${N} bot cùng đánh một boss, cùng né chiêu toàn sàn`);
    if(fight?.n) ok(fight.tick<1000/TICK_RATE/2,`tick trung bình ${fight.tick.toFixed(3)} ms < nửa chu kỳ ${(1000/TICK_RATE/2).toFixed(0)} ms`);
    if(k2.bid) await test(H,"slay",{bid:k2.bid});
  }finally{ for(const b of B) await b.room.leave().catch(()=>{}); }
}

/**
 * #175: tinh anh Ma Chương Vương (Hải Thần Đảo, ô tinh anh thật) tung Phun Mực nhắm F: F có Che tầm nhìn (bit `ink` trong state công
 * khai, người khác vẽ biểu tượng trên đầu) đúng thời gian STATUS.ink, không Câm lặng / Làm chậm như bản tối thiểu cũ và vẫn dùng được
 * hồn kỹ; tiên cơ Xúc Xích thanh tẩy giải; gây lại thì hết giờ tự hết.
 */
/**
 * M3 #750: khoá mục tiêu (rooms/lock.ts). Bot không có Phaser nên chỉ gửi ý định `target {id}` như client; kiểm phần server: giữ khoá,
 * tự đánh trong tầm không cần tin `attack`, bị đánh / Choáng không huỷ, quái chết thì huỷ (tin `lock` rỗng), id sai bị bỏ, Space chưa khoá
 * tự quay mặt về quái gần nhất trong tầm.
 */
async function lockTest(){
  console.log("[M3 #750] Khoá mục tiêu: tự đánh, giữ khoá khi bị đánh / Choáng, Space tự quay mặt");
  const F=await bot("Khoá mục tiêu","xuc_xich",{sex:0,hair:2,hairCol:3,outfitCol:2});
  const mo=()=>F.room.state.players?.get(F.room.sessionId), bs=bid=>F.room.state.beasts.get(bid);
  let lockMsg=null, lockWhy=null, n=0; F.room.onMessage("lock",m=>{ lockMsg=m.id; lockWhy=m.why??null; n++; });
  await waitFor(()=>F.owned&&mo(),3000);
  try{
    if(!(await test(F,"ping"))?.enabled){ console.log("  ⚠ bỏ qua khoá mục tiêu (cần hook goto, spawn, clear, pst): bật server bằng GAME_TEST=1"); return; }
    // Ra ngoài vùng an toàn của làng (không đánh được trong làng).
    const sv=JSON.parse(readFileSync(mapUrl("thanh_hon_thon"),"utf8")).layers.flatMap(l=>l.objects??[]).find(o=>o.type==="safe"), tv=npcSpot("thanh_hon_thon","to_van_dao");
    let out=false;
    for(const [dx,dy] of [[40,0],[60,0],[40,24],[40,-24],[80,0],[60,48],[60,-48]]){
      const x=sv.x+sv.width+dx, y=Math.max(sv.y+8,Math.min(sv.y+sv.height-8,tv.y))+dy; await test(F,"goto",{x,y});
      if(Math.hypot(mo().x-x,mo().y-y)<1){ out=true; break; } }
    ok(out,`ra ngoài làng (${mo().x.toFixed(0)}, ${mo().y.toFixed(0)})`);
    await test(F,"clear"); await test(F,"rest",{s:TEAM_COMBAT_SECS+1});
    // 1) Khoá một con ở xa (ngoài tầm đánh): server giữ khoá, báo lại bằng tin riêng `lock`.
    const bid=(await test(F,"spawn",{tier:0,dx:70,hpx:6}))?.bid; await waitFor(()=>bs(bid),1000);
    F.room.send("target",{id:bid});
    ok(await waitFor(()=>lockMsg===bid,1500),`bấm quái: server khoá ${bid} (tin lock)`);
    // 2) Ngoài tầm thì không đánh; hồn sư tới sát (client lái A* như bấm đi, ở đây dịch chuyển bằng hook) thì tự đánh, không gửi tin attack nào.
    const hf=bs(bid)?.hp; await sleep(500);
    ok(Math.hypot(bs(bid).x-mo().x,bs(bid).y-mo().y)>40?bs(bid).hp===hf:true,`ngoài tầm đánh: chưa ra đòn (sinh lực quái ${hf} -> ${bs(bid)?.hp})`);
    await test(F,"goto",{x:bs(bid).x-18,y:bs(bid).y});
    const h0=bs(bid)?.hp, m0=mo().maxHp;
    ok(await waitFor(()=>bs(bid)&&bs(bid).hp<h0,6000),`trong tầm thì tự đánh thường, không bấm đánh (sinh lực quái ${h0} -> ${bs(bid)?.hp})`);
    // 3) Bị đánh: vẫn giữ khoá.
    await test(F,"hurt",{pct:15}); const hit=mo().hp<m0, kept=lockMsg===bid&&n>0; // hook hurt = bị đánh một đòn (như hồn thú trúng)
    ok(hit&&kept,`bị đánh (sinh lực ${mo().hp}/${m0}): vẫn giữ khoá`);
    await sleep(600); ok(lockMsg===bid&&!!bs(bid),"bị đánh xong vẫn giữ khoá sau 0,6 giây");
    // 4) Choáng: không đánh được (noAtk) nhưng không mất khoá; hết Choáng thì đánh tiếp.
    await test(F,"pst",{s:"stun",secs:1.5}); await waitFor(()=>((mo().st??0)&statusBit("stun"))!==0,1000);
    const hs=bs(bid)?.hp; await sleep(900);
    ok(lockMsg===bid&&(bs(bid)?.hp??0)>=(hs??0),`đang Choáng: không đánh, vẫn giữ khoá (sinh lực quái ${hs} -> ${bs(bid)?.hp})`);
    ok(await waitFor(()=>bs(bid)&&bs(bid).hp<hs,5000),"hết Choáng: tự đánh tiếp");
    // 5) Quái chết thì server huỷ khoá.
    await test(F,"bhp",{pct:1,bid});
    ok(await waitFor(()=>!bs(bid)&&lockMsg==="",8000),`quái chết: huỷ khoá (lock "${lockMsg}")`);
    ok(lockWhy==="gone",`quái chết: tin lock mang lý do "gone" (${lockWhy}) để chip báo lý do (M5 #751)`);
    // 6) Chống gian lận: id không có thật / sai kiểu bị bỏ, khoá cũ cũng bỏ.
    await test(F,"clear");
    const b2=(await test(F,"spawn",{tier:0,dx:70}))?.bid; await waitFor(()=>bs(b2),1000);
    F.room.send("target",{id:b2}); await waitFor(()=>lockMsg===b2,1500);
    for(const bad of ["khong-co-id",{x:1},7,null]){
      F.room.send("target",{id:b2}); await waitFor(()=>lockMsg===b2,1500);
      F.room.send("target",{id:bad}); const cleared=await waitFor(()=>lockMsg==="",1000);
      ok(cleared,`id sai ${JSON.stringify(bad)}: bỏ khoá, không khoá lung tung`); }
    // 6b) Chưa khoá mà bị từ chối: vẫn nhận tin `lock ""` (client đã đặt khoá tạm, không có tin này sẽ vẽ vòng khoá giả).
    await sleep(200); const n0=n; F.room.send("target",{id:"khong-co-id"});
    ok(await waitFor(()=>n>n0&&lockMsg==="",1000),"chưa khoá, bấm id sai: server vẫn trả lock rỗng để client bỏ khoá tạm");
    // 7) Space chưa khoá: quay mặt về quái gần nhất trong tầm (hồn sư đang quay lưng) rồi đánh.
    await test(F,"clear"); F.room.send("input",{x:-1,y:0}); await sleep(250); F.room.send("input",{x:0,y:0}); await sleep(150);
    await test(F,"goto",{x:mo().x,y:mo().y});
    const b3=(await test(F,"spawn",{tier:0,dx:22,hpx:6}))?.bid; await waitFor(()=>bs(b3),1000);
    const k0=bs(b3)?.hp; F.room.send("attack");
    ok(await waitFor(()=>bs(b3)&&bs(b3).hp<k0,1200)&&lockMsg==="",`Space chưa khoá, quái ở sau lưng trong tầm: tự quay mặt, đánh trúng (${k0} -> ${bs(b3)?.hp}), không khoá`);
    // 8) Thứ tự ưu tiên lệnh (M5 #751): khoá > tự săn. Đang khoá thì bật tự săn bị từ chối (nêu lý do); bấm quái khi đang tự săn thì tự săn tắt, khoá thắng.
    await test(F,"clear"); const b4=(await test(F,"spawn",{tier:0,dx:70}))?.bid; await waitFor(()=>bs(b4),1000);
    F.room.send("target",{id:b4}); await waitFor(()=>lockMsg===b4,1500);
    F.autoMsg=null; F.room.send("auto",{op:"on"}); await waitFor(()=>F.autoMsg,1500);
    ok(F.autoMsg&&!F.autoMsg.on&&/khoá mục tiêu/.test(F.autoMsg.why??"")&&!mo().auto&&lockMsg===b4,`đang khoá: bật tự săn bị từ chối (${F.autoMsg?.why}), khoá vẫn giữ`);
    F.room.send("target",{id:""}); await waitFor(()=>lockMsg==="",1000);
    F.autoMsg=null; F.room.send("auto",{op:"on"}); await waitFor(()=>F.autoMsg,1500);
    ok(F.autoMsg?.on&&await waitFor(()=>mo().auto,1000),"hết khoá: bật được tự săn");
    F.room.send("target",{id:b4}); await waitFor(()=>lockMsg===b4,1500);
    ok(await waitFor(()=>!mo().auto&&F.autoMsg&&!F.autoMsg.on,2000)&&lockMsg===b4,"đang tự săn rồi bấm quái: tự săn tắt, khoá thắng");
    await test(F,"clear");
  } finally { await F.room.leave().catch(()=>{}); }
}

async function inkTest(){
  console.log("[#175] Phun Mực: Che tầm nhìn, thanh tẩy, hết giờ");
  const HT="hai_than_dao", EB="ma_chuong_vuong", ED=BOSSES[bossIndex(EB)], PM=ED?.skills.findIndex(s=>s.name==="Phun Mực")??-1, IK=STATUS.ink;
  const pm=ED?.skills[PM];
  ok(PM>=0&&pm.shape==="circle"&&same(pm.status?.map(a=>a.s),["ink"])&&IK&&!IK.noMove&&!IK.noAtk&&!IK.noSkill&&!IK.slow&&!IK.wander
    &&PLAYER_STATUS.includes("ink")&&STATUS_IDS.indexOf("ink")>STATUS_IDS.indexOf("chill")&&statusBit("ink")<1<<16,
    `${ED?.name} – ${pm?.name}: vòng, gây ${IK?.name} ${IK?.secs} giây (không khống chế; thêm sau Hàn, bit ${Math.log2(statusBit("ink"))} vừa trường uint16)`);
  if(PM<0) return;
  const F=await bot("Phun Mực F","xuc_xich",{sex:0,hair:2,hairCol:3,outfitCol:2});
  const mo=()=>F.room.state.players?.get(F.room.sessionId), has=s=>((mo()?.st??0)&statusBit(s))!==0, sq=r=>F.squad?.list.find(s=>s.rowId===r);
  const pst=async()=>(await test(F,"cold")).st; // hook cold trả trạng thái trên người gọi (thời gian còn lại)
  await waitFor(()=>F.owned&&mo(),3000);
  try{
    if(!(await test(F,"ping"))?.enabled){ console.log("  ⚠ bỏ qua Phun Mực (cần hook warp, erespawn, tele): bật server bằng GAME_TEST=1"); return; }
    const xr=F.owned.list.find(v=>v.vohon==="xuc_xich")?.rowId, lr=F.owned.list.find(v=>v.vohon==="lam_ngan_thao")?.rowId;
    for(const r of [xr,lr]) await test(F,"set",{rowId:r,level:100,xp:0,rings:[423,764,1760,5000,12000]});
    F.travel=null; await test(F,"warp",{mapId:HT,x:0,y:0}); await waitFor(()=>F.travel,3000); const tv=F.travel;
    await F.room.leave(); await sleep(300); F.mapId=tv.mapId; await enter(F,tv.roomId??undefined); await waitFor(()=>mo()&&F.owned&&F.bag&&F.squad,3000);
    ok(F.room.state.mapId===HT,"F tới Hải Thần Đảo");
    // Xúc Xích ngồi ghế dự bị để lát nữa đổi tay vào tung tiên cơ thanh tẩy.
    await test(F,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(F,[lr,xr,0,0]);
    if(F.owned.active!==lr){ await waitFor(()=>mo().swCd===0,3500); F.room.send("switch",{slot:0}); await waitFor(()=>F.owned.active===lr,2000); }
    ok(F.owned.active===lr&&F.owned.team.includes(xr),"đội: Lam Ngân Thảo ra trận, Xúc Xích dự bị");
    // Tinh anh hồi sinh ở tick sau hook erespawn: chờ ô có bid và vị trí.
    await test(F,"erespawn",{s:0}); let cur=null;
    for(let k=0;k<20&&!(cur?.bid&&Number.isFinite(cur.x));k++){ await sleep(150); cur=(await test(F,"elite")).list.find(x=>x.boss===EB); }
    ok(cur?.bid&&Number.isFinite(cur.x),`${ED.name} có mặt ở ${cur?.zone} (${cur?.x?.toFixed(0)},${cur?.y?.toFixed(0)})`);
    if(!cur?.bid) return;
    const eb={bid:cur.bid};
    // Tinh anh sinh ở điểm ngẫu nhiên trong ô: thử vài chỗ đứng quanh (chỗ bị nước / đá chặn thì goto không đổi vị trí).
    let at=null; for(const [dx,dy] of [[24,0],[0,24],[-24,0],[0,-24],[30,12],[-30,12],[12,30],[12,-30]]){
      await test(F,"goto",{x:cur.x+dx,y:cur.y+dy}); if(Math.hypot(mo().x-cur.x-dx,mo().y-cur.y-dy)<1){ at=[dx,dy]; break; } }
    ok(!!at,`F đứng cạnh ${ED.name} ${JSON.stringify(at)}`);
    // Đòn không tính trúng khi còn khung bất tử (vừa vào phòng, vừa bị đánh): dọn hồn thú thường, tung lại tối đa 3 lần cách 1,6 giây.
    let th=null, why="";
    for(let k=0;k<3&&!has("ink");k++){
      if(k) await sleep(1600);
      await test(F,"clear",{keep:1}); await test(F,"ready"); F.fxs=[];
      const t=await test(F,"tele",{i:PM,cancel:1,...eb});
      await waitFor(()=>F.fxs.some(f=>f.k==="teleHit"&&f.bid===cur.bid),3000);
      th=F.fxs.find(f=>f.k==="teleHit"&&f.bid===cur.bid); await waitFor(()=>has("ink"),800);
      why+=` [lần ${k+1}: ${t?.name}, teleHit ${th?(th.hit.includes(F.room.sessionId)?"trúng F":"không trúng F"):"chưa có"}]`;
    }
    await test(F,"status",{s:"stun",secs:60,...eb}); // tinh anh đứng Choáng, không tung tiếp
    let st=await pst();
    ok(has("ink")&&!has("silence")&&!has("slow")&&st.ink&&st.ink.t<=IK.secs&&st.ink.t>IK.secs-2&&!st.silence&&!st.slow,
      `trúng ${pm.name}: ${IK.name} còn ${st.ink?.t?.toFixed(2)} giây (đặt ${IK.secs}), không Câm lặng / Làm chậm;${why}`);
    // Không đổi luật đánh: vẫn dùng hồn kỹ (Câm lặng cũ thì bị từ chối).
    { await test(F,"ready"); const l=F.logs.length; F.room.send("skill",{i:0});
      ok(await waitFor(()=>mo().cds[0]>0,1500)&&!F.logs.slice(l).some(t=>/không dùng được hồn kỹ/.test(t))&&has("ink"),
        `đang ${IK.name} vẫn dùng hồn kỹ (hồi chiêu ô 1: ${mo().cds[0]?.toFixed?.(2)})`);
      await test(F,"bhp",{pct:100,...eb}); } // trả máu tinh anh (bài Hải Thần Đảo dùng lại)
    // Thanh tẩy: đổi tay vào Xúc Xích đầy năng lượng, tiên cơ giải Che tầm nhìn.
    await waitFor(()=>mo().swCd===0,3500); await test(F,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sq(xr)?.en===TIEN_CO_MAX,1500);
    await test(F,"pst",{s:"ink",secs:20}); await waitFor(()=>has("ink"),1000); // máy chậm: Che tầm nhìn của Phun Mực có thể đã gần hết
    const h0=has("ink"); F.room.send("switch",{slot:F.owned.team.indexOf(xr)});
    ok(h0&&await waitFor(()=>F.owned.active===xr&&!has("ink"),2500),`tiên cơ ${TIEN_CO_RIENG.xuc_xich.name} thanh tẩy: hết ${IK.name}`);
    // Hết giờ thì tự hết.
    await test(F,"pst",{s:"ink",secs:1}); const t0=Date.now();
    ok(await waitFor(()=>has("ink"),1000)&&await waitFor(()=>!has("ink"),2500),`${IK.name} 1 giây: hết sau ${((Date.now()-t0)/1000).toFixed(1)} giây`);
  } finally {
    // Không hạ tinh anh (bài Hải Thần Đảo đếm đủ 4 tinh anh); Choáng tự hết, phòng trống thì tự hủy.
    await F.room.leave().catch(()=>{});
  }
}

/**
 * #163: Cực Hàn (giai đoạn 2 của Tà hóa Huyền Minh Băng Giao, Cực Bắc Chi Địa; ColdDef, STATUS.chill). F (Xúc Xích + Lam Ngân Thảo)
 * đứng trong hang, xa Hỏa Đàn; thú vương bị Choáng bằng hook để không đánh. Giai đoạn 1 không tích. Giai đoạn 2: đủ nhịp thật thì có
 * 1 tầng Hàn; hook `cold {acc}` rút ngắn nhịp tới đủ tầng thì Đóng băng (tầng về 0, ngừng tích khi đang Đóng băng). Đứng cạnh Hỏa Đàn
 * (chỗ server tính khớp hàm dùng chung của client) thì xả hết tầng và không tích; tiên cơ Xúc Xích thanh tẩy cũng xả; rời hang thì mất
 * tầng; hạ thú vương thì mất tầng.
 */
async function coldTest(){
  console.log("[#163] Cực Hàn: tầng Hàn, Đóng băng, Hỏa Đàn, thanh tẩy");
  const CB="cuc_bac_chi_dia", KB=MAPS[CB].king, KD=BOSSES[bossIndex(KB)], CD=KD?.phase2?.cold, CH=STATUS.chill, FZ=CH?.burst;
  ok(KB==="huyen_minh_bang_giao"&&CD&&CH?.max===4&&FZ?.s==="freeze"&&FZ.secs===3&&PLAYER_STATUS.includes("chill"),
    `${KD?.name} – ${KD?.phase2?.name}: mỗi ${CD?.every} giây một ${CH?.name}, đủ ${CH?.max} tầng thì ${STATUS[FZ?.s]?.name} ${FZ?.secs} giây (thiết kế gốc 4 tầng / 3 giây), Hỏa Đàn bán kính ${CD?.fire.r}`);
  if(!CD) return;
  const spot=hoaDanSpot(JSON.parse(readFileSync(mapUrl(CB),"utf8")),CB);
  const F=await bot("Cực Hàn F","xuc_xich",{sex:1,hair:1,hairCol:2,outfitCol:1});
  const mo=()=>F.room.state.players?.get(F.room.sessionId), kingB=()=>[...F.room.state.beasts.values()].find(b=>b.rank===2);
  const has=s=>((mo()?.st??0)&statusBit(s))!==0, han=()=>mo()?.han??0, sq=r=>F.squad?.list.find(s=>s.rowId===r);
  await waitFor(()=>F.owned&&mo(),3000);
  try{
    const xr=F.owned.list.find(v=>v.vohon==="xuc_xich")?.rowId, lr=F.owned.list.find(v=>v.vohon==="lam_ngan_thao")?.rowId;
    for(const r of [xr,lr]) await test(F,"set",{rowId:r,level:50,xp:0,rings:[423,764,1760,5000,12000]});
    F.travel=null; await test(F,"warp",{mapId:CB,x:0,y:0}); await waitFor(()=>F.travel,3000); const tv=F.travel;
    await F.room.leave(); await sleep(300); F.mapId=tv.mapId; await enter(F,tv.roomId??undefined); await waitFor(()=>mo()&&F.owned&&F.bag&&F.squad,3000);
    ok(F.room.state.mapId===CB,"F tới Cực Bắc Chi Địa");
    // Xúc Xích ngồi ghế dự bị để lát nữa đổi tay vào tung tiên cơ thanh tẩy.
    await test(F,"rest",{s:TEAM_COMBAT_SECS+1}); await sendTeam(F,[lr,xr,0,0]);
    if(F.owned.active!==lr){ await waitFor(()=>mo().swCd===0,3500); F.room.send("switch",{slot:0}); await waitFor(()=>F.owned.active===lr,2000); }
    ok(F.owned.active===lr&&F.owned.team.includes(xr),"đội: Lam Ngân Thảo ra trận, Xúc Xích dự bị");
    await test(F,"view",{all:true}); await test(F,"clear",{all:true,keep:1});
    let c=await test(F,"cold");
    await test(F,"king",{kop:"spawn"}); ok(await waitFor(()=>kingB(),2000),"thú vương xuất hiện");
    let ki=await test(F,"king"); const LR=ki.lair, kb=ki.bid, inL=(x,y)=>x>=LR.x&&x<LR.x+LR.w&&y>=LR.y&&y<LR.y+LR.h;
    ok(spot&&c.fire&&c.fire.x===spot.x&&c.fire.y===spot.y&&inL(spot.x,spot.y),
      `Hỏa Đàn (${c.fire?.x},${c.fire?.y}) trong hang (${LR.x},${LR.y} ${LR.w}×${LR.h}): server và hàm dùng chung (client) cùng chỗ`);
    const hold=()=>test(F,"status",{s:"stun",secs:60,bid:kb}); // thú vương đứng Choáng, không đánh F
    const far=[[LR.x+LR.w/2,LR.y+LR.h*0.3],[LR.x+LR.w*0.3,LR.y+LR.h/2],[LR.x+LR.w*0.7,LR.y+LR.h/2],[LR.x+LR.w*0.25,LR.y+LR.h*0.35]].map(([x,y])=>[Math.round(x),Math.round(y)]);
    const goFar=async()=>{ for(const [x,y] of far){ if(Math.hypot(x-spot.x,y-spot.y)<=CD.fire.r+16) continue; await test(F,"goto",{x,y}); if(Math.hypot(mo().x-x,mo().y-y)<1) return true; } return false; };
    await hold(); ok(await goFar()&&inL(mo().x,mo().y),`F đứng trong hang, xa Hỏa Đàn (${mo().x.toFixed(0)},${mo().y.toFixed(0)}; cách ${Math.hypot(mo().x-spot.x,mo().y-spot.y).toFixed(0)})`);
    // Giai đoạn 1: là người tham gia trong hang nhưng chưa có Cực Hàn.
    await test(F,"kdmg",{v:1}); await sleep(300); c=await test(F,"cold");
    ok(!c.on&&c.acc===null&&!has("chill"),"giai đoạn 1: không tích tầng Hàn");
    ki=await test(F,"king"); await test(F,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*KING.phaseHp)+1});
    ok(await waitFor(()=>kingB()?.phase===2,2000),`giai đoạn 2 ${KD.phase2.name}`);
    await sleep(KING.roarSecs*1000+150); await hold(); // tiếng gầm bỏ khống chế: hết gầm thì Choáng lại
    c=await test(F,"cold"); ok(c.on&&c.acc!==null,"Cực Hàn đang chạy, F (người tham gia trong hang) đang tích");
    // Nhịp thật: đứng xa Hỏa Đàn một nhịp thì có 1 tầng (bản vá: bit `chill` và số tầng `han`).
    const t0=Date.now();
    ok(await waitFor(()=>has("chill")&&han()===1,(CD.every+1.5)*1000),`đứng xa Hỏa Đàn: sau ${((Date.now()-t0)/1000).toFixed(1)} giây có ${han()} tầng Hàn (nhịp ${CD.every} giây)`);
    const step=async n=>{ await test(F,"cold",{acc:CD.every-0.05}); return waitFor(()=>han()===n,1500); };
    const st2=[]; for(let n=2;n<CH.max;n++) st2.push(await step(n)?n:`✗${han()}`);
    ok(st2.every(x=>typeof x==="number"),`tích tiếp: ${st2.join(" → ")} tầng`);
    const l0=F.logs.length; await test(F,"cold",{acc:CD.every-0.05});
    ok(await waitFor(()=>has(FZ.s)&&!has("chill")&&han()===0,1500)&&await waitFor(()=>F.logs.slice(l0).some(t=>/tầng Hàn/.test(t)),800),
      `đủ ${CH.max} tầng: ${STATUS[FZ.s].name}, tầng về 0 ("${F.logs.slice(l0).find(t=>/tầng Hàn/.test(t))}")`);
    c=await test(F,"cold"); ok(c.st[FZ.s]&&c.st[FZ.s].t<=FZ.secs&&c.st[FZ.s].t>FZ.secs-1,`${STATUS[FZ.s].name} còn ${c.st[FZ.s]?.t.toFixed(2)} giây (đặt ${FZ.secs})`);
    await test(F,"cold",{acc:CD.every-0.05}); await sleep(400);
    ok(has(FZ.s)&&!has("chill")&&han()===0,`đang ${STATUS[FZ.s].name}: không tích thêm tầng`);
    ok(await waitFor(()=>!has(FZ.s),(FZ.secs+1)*1000),`hết ${STATUS[FZ.s].name}`);
    // Hỏa Đàn: đứng cạnh (trong bán kính, phía tâm hang) thì xả hết tầng, đứng đó không tích.
    await hold(); await step(1); await step(2);
    const nx=spot.x, ny=spot.y-(CD.fire.r-6); F.logs.length=0; await test(F,"goto",{x:nx,y:ny});
    ok(Math.hypot(mo().x-nx,mo().y-ny)<1&&await waitFor(()=>!has("chill")&&han()===0,1000)&&await waitFor(()=>F.logs.some(t=>/Hỏa Đàn/.test(t)),800),
      `2 tầng, đứng cạnh Hỏa Đàn (cách ${Math.hypot(mo().x-spot.x,mo().y-spot.y).toFixed(0)} ≤ ${CD.fire.r}): xả hết tầng ("${F.logs.find(t=>/Hỏa Đàn/.test(t))}")`);
    await test(F,"cold",{acc:CD.every-0.05}); await sleep(500); c=await test(F,"cold");
    ok(!has("chill")&&han()===0&&c.acc===0,"đứng cạnh Hỏa Đàn: không tích tầng");
    // Thanh tẩy: đổi tay vào Xúc Xích đầy năng lượng, tiên cơ giải hết tầng Hàn.
    await goFar(); await step(1); await step(2);
    await waitFor(()=>mo().swCd===0,3500); await test(F,"energy",{v:TIEN_CO_MAX}); await waitFor(()=>sq(xr)?.en===TIEN_CO_MAX,1500);
    await test(F,"cold",{acc:CD.every-1.5}); // sắp tới tầng kế tiếp: thanh tẩy xả cả số giây đã tích như Hỏa Đàn
    const h0=han(); F.room.send("switch",{slot:F.owned.team.indexOf(xr)});
    ok(h0===2&&await waitFor(()=>F.owned.active===xr&&!has("chill")&&han()===0,2000),`${h0} tầng, tiên cơ ${TIEN_CO_RIENG.xuc_xich.name} thanh tẩy: tầng Hàn về 0`);
    c=await test(F,"cold"); ok(c.acc!==null&&c.acc<1,`thanh tẩy: tích lại từ đầu (đã tích ${c.acc?.toFixed(2)} giây, trước đó ${CD.every-1.5})`);
    ok(await step(1),"sau thanh tẩy vẫn ở trong hang thì tích lại từ đầu");
    // Rời hang thì mất tầng.
    const ox=Math.round(LR.x+LR.w/2); let out=false;
    for(const y of [LR.y+LR.h+30,LR.y+LR.h+60,LR.y-30]){ await test(F,"goto",{x:ox,y:Math.round(y)}); if(!inL(mo().x,mo().y)&&Math.abs(mo().y-y)<1){ out=true; break; } }
    ok(out&&await waitFor(()=>!has("chill")&&han()===0,1000),`ra khỏi hang (${mo().x.toFixed(0)},${mo().y.toFixed(0)}): mất tầng Hàn`);
    // Hạ thú vương thì mất tầng.
    await hold(); await goFar(); ok(await step(1),"vào lại hang, tích 1 tầng");
    await test(F,"kdmg",{v:1e8});
    ok(await waitFor(()=>!kingB()&&!has("chill")&&han()===0,2500),"hạ thú vương: mất tầng Hàn");
    c=await test(F,"cold"); ok(!c.on&&c.acc===null,"không còn Cực Hàn");
  } finally {
    if(kingB()) await test(F,"kdmg",{v:1e8}).catch(()=>{}); // bài lỗi giữa chừng: không để thú vương sống sang cucBacTest
    await F.room.leave().catch(()=>{});
  }
}



/**
 * #173: hang chia phần luân phiên. Lưỡng Nghi Luân Chuyển (GĐ2 Lưỡng Nghi Thủ Hộ Xà, Lạc Nhật): hang chia nửa băng, nửa lửa (SplitDef),
 * mỗi lần chỉ một nửa hóa, báo trước rồi mới có tác dụng; đứng đúng nửa (nửa kia) thì không bị gì, đứng nhầm nửa băng thì Đóng băng một
 * lần rồi Làm chậm (không bị đóng băng lại khi còn đứng), nửa lửa thì Thiêu đốt cộng tầng; đổi phần thì nửa cũ tan ngay. Tự săn đang
 * đứng trong nửa đang hóa thì ra khỏi đó và không bước lại vào. Tơ Vạn Chu Phệ (GĐ2 Thiên Độc Chu Hoàng, Nội địa): tơ phủ 1/3 hang lần
 * lượt từng phần, bước vào bị Trói một lần rồi Làm chậm. Song Sắc Mãng (tinh anh) đổi băng / hỏa: chiêu gây trạng thái theo dạng lúc bắt
 * đầu báo trước, báo trước đổi dạng (formWarn). Thú vương đứng Choáng bằng hook để không đánh; F được hồi đầy bằng hook giữa các bước.
 */
async function splitTest(){
  console.log("[#173] Hang chia phần luân phiên: Lưỡng Nghi Luân Chuyển, tơ Vạn Chu Phệ, Song Sắc Mãng đổi băng / hỏa");
  const LN="lac_nhat_sam_lam", ND="tinh_dau_noi_dia", LK=BOSSES[bossIndex(MAPS[LN].king)], VK=BOSSES[bossIndex(MAPS[ND].king)], SS=BOSSES[bossIndex("bang_hoa_song_sac_mang")];
  const LS=LK?.phase2?.split, VS=VK?.phase2?.split, FD=SS?.forms, ICE=LS?.grounds[0], FIRE=LS?.grounds[1], WEB=VS?.grounds[0], kinds=s=>s?.grounds.map(g=>g.kind).join(" / ");
  ok(LS?.parts===2&&LS.warn>0&&LS.every>LS.warn&&ICE?.kind==="ice"&&ICE.once?.some(a=>a.s==="freeze")&&ICE.status.some(a=>a.s==="slow")&&!ICE.status.some(a=>a.s==="freeze")
    &&FIRE?.kind==="fire"&&FIRE.status.some(a=>a.s==="burn")&&LS.grounds.every(g=>g.secs>=LS.every-LS.warn&&g.warn===undefined),
    `${LK?.name} – ${LK?.phase2?.name}: hang chia ${LS?.parts} phần (${kinds(LS)}), đổi mỗi ${LS?.every} giây, báo trước ${LS?.warn} giây`);
  ok(VS?.parts===3&&VS.warn>0&&WEB?.kind==="web"&&WEB.once?.some(a=>a.s==="root")&&WEB.status.some(a=>a.s==="slow")&&!WEB.status.some(a=>a.s==="root")&&WEB.secs>=VS.every-VS.warn
    &&VK.phase2.skills.some(s=>s.eggs)&&!VK.phase2.skills.some(s=>s.name==="Chu Ti Phong Tỏa"),
    `${VK?.name} – ${VK?.phase2?.name}: tơ phủ 1/${VS?.parts} hang lần lượt, đổi mỗi ${VS?.every} giây, báo trước ${VS?.warn} giây; vẫn đẻ bọc trứng`);
  ok(FD?.forms.length===2&&FD.every>FD.warn&&SS.skills.every(s=>!s.status&&s.forms?.length===2&&s.forms[0].every(a=>a.s==="slow")&&s.forms[1].every(a=>a.s==="burn")),
    `${SS?.name}: đổi ${FD?.forms.map(f=>f.name).join(" / ")} mỗi ${FD?.every} giây (báo trước ${FD?.warn} giây); dạng băng chiêu Làm chậm, dạng hỏa Thiêu đốt`);
  ok(["ice","fire","web"].every(k=>GROUND_KINDS.some(g=>g.id===k)),"kiểu vùng băng / lửa / tơ có trong GROUND_KINDS (client vẽ)");
  if(!LS||!VS||!FD) return;
  const F=await bot("Lưỡng Nghi F","xuc_xich",{sex:1,hair:1,hairCol:2,outfitCol:4});
  if(!(await test(F,"ping"))?.enabled){ console.log("  ⚠ bỏ qua hang chia phần (cần hook warp, king, split, form): bật server bằng GAME_TEST=1"); await F.room.leave(); return; }
  const mo=()=>F.room.state.players?.get(F.room.sessionId), kingB=()=>[...F.room.state.beasts.values()].find(b=>b.rank===2);
  const has=s=>((mo()?.st??0)&statusBit(s))!==0, heal=()=>test(F,"pregen",{hp:100,mp:100,s:0});
  const autoOp=async(op,more={})=>{ F.autoMsg=null; F.room.send("auto",{op,...more}); await waitFor(()=>F.autoMsg,1500); return F.autoMsg; };
  /** Điểm (x, y) nằm trong dải `t` cách mép ít nhất `m` pixel (m < 0: tính cả lề ngoài mép). */
  const onPart=(t,x,y,m=0)=>{ const dx=x-t.x, dy=y-t.y, u=dx*Math.cos(t.ang)+dy*Math.sin(t.ang), v=-dx*Math.sin(t.ang)+dy*Math.cos(t.ang); return u>=m&&u<=t.r-m&&Math.abs(v)<=t.w/2-m; };
  /** Đứng ở một chỗ đi được trong dải `t`, cách mép ít nhất 14 pixel. */
  const goPart=async t=>{ for(const u of [0.5,0.35,0.65,0.25,0.75]) for(const v of [0,-0.2,0.2,-0.35,0.35]){
    const x=Math.round(t.x+Math.cos(t.ang)*u*t.r-Math.sin(t.ang)*v*t.w), y=Math.round(t.y+Math.sin(t.ang)*u*t.r+Math.cos(t.ang)*v*t.w);
    if(!onPart(t,x,y,14)) continue; await test(F,"goto",{x,y}); if(Math.hypot(mo().x-x,mo().y-y)<1) return true; } return false; };
  /** `fn` đúng suốt `ms` mili giây (kiểm mỗi 100). */
  const holds=async(fn,ms)=>{ for(let t=0;t<ms;t+=100){ if(!fn()) return false; await sleep(100); } return fn(); };
  /** Tới bản đồ `mapId`, gọi thú vương, đứng trong hang, đưa thú vương sang giai đoạn 2 (đứng Choáng, hết tiếng gầm). */
  async function phase2(mapId,K){
    F.travel=null; await test(F,"warp",{mapId,x:0,y:0}); await waitFor(()=>F.travel,3000); const tv=F.travel;
    await F.room.leave(); await sleep(300); F.mapId=mapId; await enter(F,tv.roomId??undefined); await waitFor(()=>mo()&&F.owned,3000);
    ok(F.room.state.mapId===mapId,`F tới ${MAPS[mapId].name}`);
    await test(F,"view",{all:true}); await test(F,"clear",{all:true,keep:1});
    await test(F,"king",{kop:"spawn"}); ok(await waitFor(()=>kingB(),2000),`${K.name} xuất hiện`);
    let ki=await test(F,"king"); const LR=ki.lair, kb=ki.bid, hold=()=>test(F,"status",{s:"stun",secs:60,bid:kb});
    await hold();
    ok(await goPart({shape:"line",x:LR.x,y:LR.y+LR.h/2,ang:0,r:LR.w,w:LR.h}),`F đứng trong hang (${mo().x},${mo().y})`);
    await test(F,"kdmg",{v:1}); await sleep(300);
    const s1=await test(F,"split"); ok(!s1.on&&!s1.zone.length&&!s1.grounds.some(z=>z.src===kb),"giai đoạn 1: hang chưa chia phần");
    ki=await test(F,"king"); await test(F,"kdmg",{v:Math.ceil(ki.hp-ki.maxHp*KING.phaseHp)+1});
    ok(await waitFor(()=>kingB()?.phase===2,2000),`giai đoạn 2 ${K.phase2.name}`);
    await sleep(KING.roarSecs*1000+150); await hold(); await heal(); // tiếng gầm bỏ khống chế: hết gầm thì Choáng lại
    return { LR, kb };
  }
  try{
    await waitFor(()=>F.owned&&mo(),3000);
    const xr=F.owned.list.find(v=>v.vohon==="xuc_xich")?.rowId; await test(F,"set",{rowId:xr,level:100,xp:0,rings:[400,700,1700,5000,12000,20000,50000,100000,100000]});

    // ---- Lưỡng Nghi Luân Chuyển ----
    let { LR, kb } = await phase2(LN,LK);
    let t=await test(F,"split",{next:600}); // giữ phần hiện tại, bot tự gọi đổi phần
    const P=t.parts, z0=t.grounds.find(z=>t.zone.includes(z.id)), long=Math.max(LR.w,LR.h);
    ok(t.on&&P.length===2&&Math.abs(P[0].r+P[1].r-long)<1e-6&&P.every(p=>p.shape==="line"&&Math.abs(p.w-Math.min(LR.w,LR.h))<1e-6)&&t.zone.length===1&&z0?.src===kb
      &&z0.shape==="line"&&t.kind===LS.grounds[t.part%2].kind&&z0.kind===t.kind&&Math.abs(z0.x-P[t.part].x)<1e-6&&Math.abs(z0.y-P[t.part].y)<1e-6,
      `hết gầm: hang chia ${P.length} nửa (mỗi nửa ${P[0]?.r}×${P[0]?.w}), nửa ${t.part} hóa ${t.kind}`);
    if(t.kind!=="ice"){ t=await test(F,"split",{next:0}); await test(F,"split",{next:600}); }
    const ip=t.part, iceP=P[ip], fireP=P[1-ip], iceId=t.zone[0];
    ok(t.kind==="ice"&&(await test(F,"split")).grounds.find(z=>z.id===iceId)?.wait>0,`nửa băng đang báo trước (${LS.warn} giây)`);
    // Đứng đúng nửa (nửa kia): không bị gì.
    ok(await goPart(fireP),`F đứng ở nửa không hóa (${mo().x},${mo().y})`);
    ok(await waitFor(()=>F.room.state.grounds.get(iceId)?.wait===0,(LS.warn+1)*1000),"nửa băng hết báo trước, có tác dụng");
    ok(await holds(()=>!has("freeze")&&!has("slow")&&!has("burn"),1600),"đứng đúng nửa: không Đóng băng, không Làm chậm, không Thiêu đốt");
    // Đứng nhầm nửa băng: Đóng băng một lần, rồi Làm chậm; không bị đóng băng lại khi còn đứng.
    ok(await goPart(iceP),`F bước vào nửa băng (${mo().x},${mo().y})`);
    ok(await waitFor(()=>has("freeze"),1600)&&has("slow"),`đứng nhầm nửa băng: ${STATUS.freeze.name} + ${STATUS.slow.name}`);
    ok(await waitFor(()=>!has("freeze"),3000),`${STATUS.freeze.name} hết giờ`);
    ok(await holds(()=>!has("freeze"),2200)&&has("slow")&&onPart(iceP,mo().x,mo().y),`còn đứng trong nửa băng 2 giây: không bị ${STATUS.freeze.name} lại, vẫn ${STATUS.slow.name}`);
    // Đổi phần: nửa băng tan ngay, nửa lửa báo trước rồi Thiêu đốt cộng tầng.
    t=await test(F,"split",{next:0}); await test(F,"split",{next:600}); const fireId=t.zone[0];
    ok(t.kind==="fire"&&t.part===1-ip&&!t.grounds.some(z=>z.id===iceId)&&t.grounds.find(z=>z.id===fireId)?.wait>0,"đổi phần: nửa băng tan ngay, nửa lửa đang báo trước");
    await heal(); ok(await goPart(fireP),"F sang nửa lửa lúc còn báo trước");
    ok(await holds(()=>!has("burn"),300),"nửa lửa đang báo trước: chưa Thiêu đốt");
    ok(await waitFor(()=>has("burn"),(LS.warn+1.5)*1000),`hết báo trước: ${STATUS.burn.name}`);
    const b1=(await test(F,"split")).st.burn?.n??0; await sleep(2100); const b2=(await test(F,"split")).st.burn?.n??0;
    ok(b1>=1&&b2>b1,`đứng trong nửa lửa: ${STATUS.burn.name} cộng tầng ${b1} → ${b2}`);
    await heal(); ok(await goPart(iceP),"F sang nửa băng (đã tan)");
    await sleep(300); const b3=(await test(F,"split")).st.burn?.n??0; await sleep(1600); const b4=(await test(F,"split")).st.burn?.n??0;
    ok(b4<=b3&&!has("freeze"),`ra khỏi nửa lửa: ${STATUS.burn.name} không cộng thêm (${b3} → ${b4}), nửa băng đã tan không Đóng băng`);
    // Tự săn: đứng trong nửa đang hóa (lửa) thì ra khỏi đó và không bước lại vào.
    await heal(); await test(F,"ground",{ttl:30}); await goPart(fireP);
    await autoOp("set",{cfg:{...AUTO_DEFAULTS}}); const am=await autoOp("on");
    if(!am?.on) console.log(`  ⚠ không bật được tự săn (${JSON.stringify(am)}): bỏ qua phần tự săn`);
    else {
      ok(await waitFor(()=>!onPart(fireP,mo().x,mo().y,-TELE_PAD),3000),`tự săn: ra khỏi nửa lửa (${mo().x.toFixed(0)},${mo().y.toFixed(0)})`);
      ok(await holds(()=>!onPart(fireP,mo().x,mo().y,-TELE_PAD)&&mo().auto,2500),"tự săn đánh tiếp mà không bước lại vào nửa lửa (2,5 giây)");
      await autoOp("off");
    }
    await test(F,"kdmg",{v:1e8});
    ok(await waitFor(()=>!kingB()&&F.room.state.grounds.size===0,2500),"hạ thú vương: hang thôi chia phần (vùng mất khỏi state)");
    t=await test(F,"split"); ok(!t.on&&!t.grounds.length,"không còn Lưỡng Nghi Luân Chuyển");

    // ---- Tơ Vạn Chu Phệ ----
    ({ LR, kb } = await phase2(ND,VK));
    t=await test(F,"split",{next:600});
    const Q=t.parts, w0=t.zone[0], wz=t.grounds.find(z=>z.id===w0);
    ok(t.on&&Q.length===3&&Math.abs(Q.reduce((a,p)=>a+p.r,0)-Math.max(LR.w,LR.h))<1e-6&&t.kind==="web"&&wz?.kind==="web"&&wz.src===kb&&wz.wait>0,
      `hết gầm: tơ phủ phần ${t.part} trong ${Q.length} phần của hang (mỗi phần ${Q[0]?.r?.toFixed(0)}×${Q[0]?.w}), đang báo trước`);
    const webP=Q[t.part], p0=t.part; await heal();
    ok(await goPart(webP),"F đứng trong phần sắp phủ tơ");
    ok(await waitFor(()=>has("root"),(VS.warn+1.5)*1000)&&has("slow"),`tơ phủ: ${STATUS.root.name} + ${STATUS.slow.name}`);
    ok(await waitFor(()=>!has("root"),3000)&&await holds(()=>!has("root"),2200)&&has("slow"),`hết ${STATUS.root.name}: còn đứng trong tơ không bị ${STATUS.root.name} lại, vẫn ${STATUS.slow.name}`);
    t=await test(F,"split",{next:0}); await test(F,"split",{next:600});
    ok(t.part===(p0+1)%3&&!t.grounds.some(z=>z.id===w0)&&t.grounds.filter(z=>z.src===kb).length===1,`luân phiên: tơ sang phần ${t.part}, phần cũ tan ngay`);
    await test(F,"kdmg",{v:1e8});
    ok(await waitFor(()=>!kingB()&&F.room.state.grounds.size===0,2500),"hạ thú vương: tơ mất");

    // ---- Song Sắc Mãng đổi băng / hỏa ----
    await heal(); await goPart({shape:"line",x:LR.x,y:LR.y+LR.h/2,ang:0,r:LR.w,w:LR.h});
    const sb=(await test(F,"beast",{boss:SS.id,dx:24,dy:0,skills:true}))?.bid, sB=()=>F.room.state.beasts.get(sb);
    ok(sb&&await waitFor(()=>sB()?.form>0,1500),`${SS.name} sinh ra ở dạng ${FD.forms[(sB()?.form??1)-1]?.name}`);
    let f=await test(F,"form",{bid:sb});
    if(f.form!==0){ F.fxs=[]; f=await test(F,"form",{bid:sb,next:0}); ok(await waitFor(()=>F.fxs.some(x=>x.k==="form"&&x.bid===sb),1000),"đổi dạng: có fx form"); }
    ok(f.form===0&&await waitFor(()=>sB()?.form===1&&!sB().formWarn,1000),`dạng ${FD.forms[0].name}, chưa báo trước đổi`);
    await test(F,"form",{bid:sb,next:FD.warn-0.5});
    ok(await waitFor(()=>sB()?.formWarn,1000),`còn dưới ${FD.warn} giây: báo trước đổi dạng`);
    await test(F,"form",{bid:sb,next:600});
    /**
     * Trước mỗi lần tung: hết trạng thái của lần trước (thời gian trạng thái chạy theo nhịp server nên chờ theo state, không theo giờ
     * thật), dọn hồn thú thường (giữ tinh anh như `phase2`: ô tinh anh xa hang, dọn thì 8–12 phút mới sinh lại), hồi đầy. Hồn thú Nội địa
     * sinh lại ngay ngoài tầm cấm sinh quanh hồn sư (spawnBeast) rồi lang thang tới: một đòn của nó ngay trước khi chiêu tung đặt khung
     * bất tử nên chiêu vẫn trúng F mà không gây trạng thái (#289).
     */
    const ready=async()=>{ const gone=await waitFor(()=>!has("slow")&&!has("burn"),8000); await test(F,"clear",{all:true,keep:1}); await heal();
      ok(gone&&!has("slow")&&!has("burn"),`F hết ${STATUS.slow.name} / ${STATUS.burn.name} trước lần tung kế`); F.fxs=[]; F.hurts=[]; };
    const hitOf=()=>F.fxs.find(x=>x.k==="teleHit"&&x.bid===sb), waitHit=()=>waitFor(()=>hitOf(),(SS.skills[1].warn+1.5)*1000);
    /** Chẩn đoán khi trượt: chiêu có trúng F không, trạng thái đang có, các đòn lên F trong lần tung, dạng hiện tại. */
    const why=()=>{ const h=hitOf(), st=STATUS_IDS.filter(s=>has(s)).map(s=>STATUS[s].name).join(" + ")||"không";
      return ` [${h?(h.hit.includes(F.room.sessionId)?"trúng F":`trúng ${h.hit.length} người, không có F`):"không có teleHit"}, trạng thái ${st}, đòn lên F ${F.hurts.map(x=>x.immune?"miễn":x.v).join(", ")||"không"}, dạng ${sB()?.form}]`; };
    await ready(); const t1=await test(F,"tele",{i:1,bid:sb,cancel:true});
    let hitOk=t1?.bid===sb&&await waitHit()&&hitOf().hit.includes(F.room.sessionId)&&await waitFor(()=>has("slow"),500)&&!has("burn");
    ok(hitOk,`dạng ${FD.forms[0].name}: ${SS.skills[1].name} trúng gây ${STATUS.slow.name}, không ${STATUS.burn.name}${hitOk?"":why()}`);
    f=await test(F,"form",{bid:sb,next:0}); await test(F,"form",{bid:sb,next:600});
    ok(f.form===1&&await waitFor(()=>sB()?.form===2&&!sB().formWarn,1000),`đổi sang dạng ${FD.forms[1].name}`);
    // Bắt đầu báo trước ở dạng hỏa, đổi sang băng giữa chừng: chiêu vẫn theo dạng lúc bắt đầu (Thiêu đốt).
    // `tele` và `form next:0` gửi liền nhau (server xử lý theo thứ tự): dạng đổi ngay sau khi chiêu bắt đầu báo trước, không phụ thuộc
    // một vòng hỏi đáp có nhanh hơn TELE_WARN không. Hai câu trả lời nhận bằng listener riêng (`test()` chỉ giữ một câu trả lời).
    await ready(); const form0=sB()?.form, rs=[], off=F.room.onMessage("test",m=>rs.push(m));
    F.room.send("test",{op:"tele",i:1,bid:sb,cancel:true}); F.room.send("test",{op:"form",bid:sb,next:0});
    // Đủ hai câu trả lời rồi mới gỡ listener: câu tới muộn không lọt sang test() sau.
    await waitFor(()=>rs.length>=2,5000); off(); const tl=rs.find(m=>m.op==="tele"), fs=rs.find(m=>m.op==="form");
    ok(form0===2&&tl?.bid===sb&&fs?.form===0,`dạng ${FD.forms[1].name}: bắt đầu báo trước ${SS.skills[1].name}, rồi đổi ${FD.forms[0].name} ngay`);
    await test(F,"form",{bid:sb,next:600});
    const fxAt=k=>F.fxs.findIndex(x=>x.k===k&&x.bid===sb), hit=await waitHit();
    ok(hit&&fxAt("form")>=0&&fxAt("form")<fxAt("teleHit")&&sB()?.form===1,`đổi ${FD.forms[0].name} khi chiêu còn đang báo trước`);
    hitOk=hit&&hitOf().hit.includes(F.room.sessionId)&&await waitFor(()=>has("burn"),500)&&!has("slow");
    ok(hitOk,`bắt đầu ở dạng ${FD.forms[1].name}, đổi ${FD.forms[0].name} giữa lúc báo trước: chiêu vẫn gây ${STATUS.burn.name}, không ${STATUS.slow.name}${hitOk?"":why()}`);
    await test(F,"slay",{bid:sb});
  } finally {
    if(kingB()) await test(F,"kdmg",{v:1e8}).catch(()=>{}); // bài lỗi giữa chừng: không để thú vương sống sang bài khác
    await F.room.leave().catch(()=>{});
  }
}

/**
 * Tài khoản TEST dựng sẵn (#517, BOT_ONLY=testacc): đăng nhập tài khoản đã dựng bằng `npm run seed:test` (bot:local --pg --seed-test max --only testacc dựng
 * sẵn trước khi bật server; biến BOT_TEST_NAME / BOT_TEST_PASS / BOT_TEST_PRESET). Kiểm vào game, mở túi, đổi võ hồn, đánh hồn thú, ẩn khỏi xếp hạng, vào lại.
 */
async function testAccTest(){
  const name=process.env.BOT_TEST_NAME, pass=process.env.BOT_TEST_PASS, preset=process.env.BOT_TEST_PRESET??"max";
  console.log(`[#517] Tài khoản test dựng sẵn (mức ${preset})`);
  if(!name||!pass){ console.log("  ⚠ bỏ qua: cần tài khoản dựng sẵn (npm run bot:local -- --pg --seed-test max --only testacc)"); return; }
  const l=await post("/api/login",{name,password:pass});
  ok(l.token&&l.character&&l.looks?.chosen,`đăng nhập tài khoản test: đã thức tỉnh, đã tạo nhân vật (cấp ${l.character?.level})`);
  if(!l.token) return;
  const me0=await post("/api/me",{token:l.token});
  const b={name,token:l.token,logs:[],owned:null,ownedMsgs:0,looks:me0.looks,isNew:false,mapId:me0.mapId,near:false};
  await enter(b);
  const p=()=>b.room.state.players?.get(b.room.sessionId);
  ok(await waitFor(()=>p()&&b.owned&&b.bag&&b.gear,4000),"vào phòng: nhận danh sách võ hồn, túi đồ, trang bị");
  const max=preset==="max";
  if(max){
    ok(b.owned.list.length===VOHON.length&&b.owned.list.every(v=>v.level===MAX_LEVEL&&v.stars===MAX_STARS&&v.rings.length===MAX_RINGS),`mọi ${VOHON.length} võ hồn cấp ${MAX_LEVEL}, ${MAX_STARS} sao, ${MAX_RINGS} hồn hoàn`);
    ok(b.owned.list.every(v=>v.skills?.length===4&&v.skills.every(r=>r>=0)),"mỗi võ hồn mang đủ 4 hồn kỹ");
    ok(b.owned.team.filter(Boolean).length===TEAM_SIZE&&p().level===MAX_LEVEL,`đội ${TEAM_SIZE} võ hồn, hồn sư cấp ${p().level}`);
    const worn=(b.bag.items??[]).filter(i=>i.vohon!==null);
    ok(worn.filter(i=>i.code===BONE_ITEM).length===VOHON.length*BONE_SLOTS.length&&worn.filter(i=>i.code===CORE_ITEM).length===VOHON.length*CORE_SLOTS,"túi: hồn cốt 6 / hồn hạch 6 gắn cho từng võ hồn");
    ok(b.gear.items?.length===EQUIP_SLOTS.length&&b.gear.items.every(i=>i.enhance===EQUIP_MAX_ENHANCE&&i.slot>=0),`${EQUIP_SLOTS.length} trang bị đang mặc, cùng +${EQUIP_MAX_ENHANCE}`);
    ok(b.bag.honTe>=1e6,`Hồn Tệ ${formatHonTe(b.bag.honTe)}`);
  }
  // Mở túi lại, đổi võ hồn trong đội.
  b.bag=null; b.room.send("bag"); ok(await waitFor(()=>b.bag,2000),"mở túi đồ (xin lại tin bag)");
  const slot=b.owned.team.findIndex((r,i)=>r&&r!==b.owned.active&&i>0);
  if(slot>=0){ const want=b.owned.team[slot]; b.room.send("switch",{slot}); ok(await waitFor(()=>b.owned?.active===want,3000),`đổi võ hồn sang ô ${slot+1}`); }
  // Đánh hồn thú ở bản đồ săn (hook warp, beast, slay).
  if(!(await test(b,"ping"))?.enabled){ console.log("  ⚠ bỏ qua đánh hồn thú (cần hook warp, beast, slay): bật server bằng GAME_TEST=1"); }
  else{
    b.travel=null; b.room.send("test",{op:"warp",mapId:"tinh_dau_ngoai_vi",x:0,y:0});
    ok(await waitFor(()=>b.travel?.mapId==="tinh_dau_ngoai_vi",4000),"warp -> Tinh Đấu Ngoại vi");
    await b.room.leave(); await sleep(300); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>p()&&b.bag,3000);
    const t=await test(b,"beast"), before=b.bag.honTe;
    await test(b,"slay",{bid:t?.bid});
    ok(await waitFor(()=>b.bag.honTe>before,3000),`hạ hồn thú: Hồn Tệ ${formatHonTe(before)} -> ${formatHonTe(b.bag.honTe)}`);
  }
  // Ẩn khỏi bảng xếp hạng đấu trường và cộng minh.
  b.top=null; b.room.send("arena",{op:"top"}); ok(await waitFor(()=>b.top,2000),"xin bảng xếp hạng đấu trường");
  ok(!b.top?.list?.some(r=>r.name===name)&&!b.top?.list?.some(r=>r.me),"tài khoản test không có trong bảng xếp hạng đấu trường, không có hạng");
  b.resTop=null; b.room.send("resonance",{op:"top",page:1,pageSize:50}); ok(await waitFor(()=>b.resTop,2000),"xin bảng xếp hạng cộng minh");
  ok(!b.resTop?.list?.some(r=>r.name===name),"tài khoản test không có trong bảng xếp hạng cộng minh");
  // Thoát rồi vào lại: dữ liệu giữ nguyên.
  const lv=b.owned.list.length, items=b.bag.items.length;
  await b.room.leave(); await sleep(500); await enter(b); await waitFor(()=>p()&&b.bag&&b.owned,4000);
  ok(b.owned.list.length===lv&&b.bag.items.length>=items,"thoát vào lại: đủ võ hồn và đồ như trước");
  await b.room.leave();
}


/**
 * Sương mù khám phá (R8 #435, BOT_ONLY=fog): bản đồ mở sẵn không có sương; vào bản đồ săn thì server mở ô quanh chỗ đứng (tin `fog` cả bitset, `fogd` phần mới);
 * đi tới chỗ mới thì ô đó được đánh dấu, thoát vào lại vẫn còn (cần `--pg` để thử PostgreSQL), mỗi bản đồ một bitset riêng, tài khoản khác không thấy,
 * tin lạ từ client không làm đổi gì, lệnh GM `fog open|reset` (admin) mở cả bản đồ / xoá, tài khoản thường bị từ chối.
 */
/**
 * Dấu "Tập trung ở đây" của tổ đội (R6 #433, BOT_ONLY=rally): người ngoài tổ đội không đặt được và không nhận; thành viên (kể cả ở bản đồ khác)
 * nhận tin `rally` kèm chat hệ thống; ô không hợp lệ bị bỏ; spam bị chặn theo RALLY.burst; rời tổ đội thì thôi nhận; hết hạn theo RALLY.secs.
 */
async function rallyTest(){
  console.log("[R6 #433] Dấu Tập trung ở đây của tổ đội");
  const A=await bot("Tập A","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3}), B=await bot("Tập B","kim_vu_mieu_ung",{sex:1,hair:0,hairCol:1,outfitCol:1}),
    E=await bot("Tập E","bich_lan_xa_hoang",{sex:0,hair:2,hairCol:3,outfitCol:2}), C=await bot("Tập C","yeu_ho",{sex:1,hair:3,hairCol:1,outfitCol:4});
  if(!(await test(A,"ping"))?.enabled){ console.log("  ⚠ bỏ qua dấu tập trung (cần hook test): bật server bằng GAME_TEST=1"); for(const b of [A,B,E,C]) await b.room.leave(); return; }
  const me=b=>b.room.state.players?.get(b.room.sessionId), map=loadMap(A.mapId), M2="tinh_dau_ngoai_vi";
  await waitFor(()=>[A,B,E,C].every(b=>me(b)&&b.bag&&b.party),4000);
  const rl=async b=>{ await test(b,"rally",{rop:"rlreset"}); };
  const logsOf=(b,n)=>b.logs.slice(n).join(" | "), sysChat=(b,n)=>b.chats.slice(n).filter(c=>c.name==="Hệ thống"&&c.ch==="party"&&/Tập trung ở đây/.test(c.text));
  // Hai ô quanh A: một ô đi được (cách A vài ô), một ô vật cản.
  const ax=Math.floor(me(A).x/TILE), ay=Math.floor(me(A).y/TILE); let good=null, wall=null;
  for(let r=2;r<30&&!(good&&wall);r++) for(let dx=-r;dx<=r;dx++) for(const dy of [-r,r]){ const x=ax+dx, y=ay+dy; if(x<1||y<1||x>=map.MW-1||y>=map.MH-1) continue;
    if(!good&&map.standable((x+0.5)*TILE,(y+0.5)*TILE)) good={x,y}; if(!wall&&!map.standable((x+0.5)*TILE,(y+0.5)*TILE)) wall={x,y}; }
  ok(!!good,"có ô đi được gần chỗ đứng");
  // 1. Chưa vào tổ đội: không đặt được, chỉ nhận lời nhắc.
  await rl(A); let n=A.logs.length; A.room.send("rally",{tx:good.x+0.3,ty:good.y+0.7}); await sleep(600);
  ok(/trong tổ đội/.test(logsOf(A,n))&&!A.rallies.length&&!B.rallies.length,`chưa có tổ đội: không đặt được (${logsOf(A,n)})`);
  // 2. Lập tổ đội A (trưởng) + B + E; E sang bản đồ khác.
  for(const m of [B,E]){ A.room.send("party",{op:"invite",name:m.name}); await sleep(300); m.room.send("party",{op:"accept",name:A.name}); await waitFor(()=>m.party?.id>0,2000); }
  ok(A.party?.id>0&&B.party?.id===A.party.id&&E.party?.id===A.party.id,"A, B, E cùng một tổ đội");
  E.travel=null; await test(E,"warp",{mapId:M2,x:0,y:0}); ok(await waitFor(()=>E.travel?.mapId===M2,4000),`E sang ${M2}`);
  await E.room.leave(); await sleep(300); E.mapId=(await post("/api/me",{token:E.token})).mapId; await enter(E); await waitFor(()=>me(E)&&E.bag,4000);
  // 3. A đặt dấu: A, B, E nhận (E ở bản đồ khác); C (ngoài tổ đội) không nhận gì.
  const nb=[A,B,E,C].map(b=>b.chats.length); await rl(A); A.room.send("rally",{tx:good.x+0.3,ty:good.y+0.7});
  ok(await waitFor(()=>A.rallies.length&&B.rallies.length&&E.rallies.length,3000),"A, B, E đều nhận tin rally");
  const m=B.rallies[0];
  ok(m.from===A.name&&m.map===A.mapId&&m.tx===good.x+0.5&&m.ty===good.y+0.5&&m.secs===RALLY.secs&&Number.isInteger(m.ch),`tin rally đúng: người đặt, bản đồ ${m.map}, ô về tâm (${m.tx}, ${m.ty}), ${m.secs}s`);
  ok(E.rallies[0].map===A.mapId&&E.rallies[0].map!==M2,"E ở bản đồ khác vẫn nhận, dấu ghi bản đồ của người đặt");
  await sleep(500);
  ok(sysChat(B,nb[1]).length===1&&sysChat(E,nb[2]).length===1&&sysChat(E,nb[2])[0].text.includes(RALLY_MAPS[A.mapId].name),"chat hệ thống tổ đội: B 1 dòng, E 1 dòng kèm tên bản đồ");
  ok(!C.rallies.length&&!sysChat(C,nb[3]).length,"người ngoài tổ đội không nhận tin rally, không có dòng chat");
  ok(Object.keys(m).sort().join()==="ch,from,map,secs,tx,ty","tin rally chỉ có người đặt (tên), bản đồ, kênh, ô đích, số giây: không lộ id tài khoản, phiên hay vị trí người đặt");
  // 4. Ô không hợp lệ: vật cản, ngoài bản đồ, kiểu lạ: bị bỏ, không tốn lượt, không rơi kết nối.
  const before=B.rallies.length; await rl(A); n=A.logs.length;
  for(const v of [{tx:wall.x+0.5,ty:wall.y+0.5},{tx:-3,ty:4},{tx:map.MW+5,ty:4},{tx:NaN,ty:1},{tx:"3",ty:"4"},{tx:null,ty:{}},{},null,"x",[1,2]]) A.room.send("rally",v);
  await sleep(800);
  ok(B.rallies.length===before&&A.leftCode===null&&/không đi được/.test(logsOf(A,n)),`ô lạ / vật cản / ngoài bản đồ bị bỏ, vẫn kết nối (${logsOf(A,n).slice(0,60)})`);
  A.room.send("rally",{tx:good.x+0.5,ty:good.y+0.5}); ok(await waitFor(()=>B.rallies.length===before+1,2000),"ô lạ không tốn lượt: dấu hợp lệ ngay sau đó vẫn gửi được");
  // 5. Spam: gửi dồn 12 lần, người nhận chỉ nhận tối đa burst (+1 nếu hồi kịp), người gửi nhận lời nhắc "quá nhanh".
  await rl(A); const b0=B.rallies.length; n=A.logs.length;
  for(let i=0;i<12;i++) A.room.send("rally",{tx:good.x+0.5,ty:good.y+0.5});
  await sleep(1200); const got=B.rallies.length-b0;
  ok(got>=RALLY.burst&&got<=RALLY.burst+1&&/quá nhanh/.test(logsOf(A,n)),`spam 12 lần: B nhận ${got} (burst ${RALLY.burst}), A bị nhắc "quá nhanh"`);
  await sleep(Math.ceil(RALLY.refillMs*1.2)); A.room.send("rally",{tx:good.x+0.5,ty:good.y+0.5});
  ok(await waitFor(()=>B.rallies.length===b0+got+1,2000),"chờ hồi một lượt thì đặt lại được");
  // 6. Hết hạn: client giữ mỗi người một dấu và bỏ khi hết RALLY.secs (cùng hàm thuần shared/rally.ts).
  let list=[]; const t0=1e6; list=rallyUpsert(list,B.rallies.at(-1),t0); list=rallyUpsert(list,B.rallies.at(-1),t0+1000);
  ok(list.length===1&&rallyPrune(list,t0+1000+RALLY.secs*1000-1,null).length===1&&rallyPrune(list,t0+1000+RALLY.secs*1000,null).length===0,`mỗi người một dấu; hết hạn đúng sau ${RALLY.secs}s`);
  // 7. B rời tổ đội: không nhận dấu mới nữa, không đặt được; A vẫn đặt được và E vẫn nhận.
  await rl(A); B.room.send("party",{op:"leave"}); await waitFor(()=>B.party?.id===0,2000); const bb=B.rallies.length, eb=E.rallies.length; n=B.logs.length;
  A.room.send("rally",{tx:good.x+0.5,ty:good.y+0.5}); ok(await waitFor(()=>E.rallies.length>eb,2000),"B đã rời: E vẫn nhận dấu mới của A"); await sleep(500);
  ok(B.rallies.length===bb,"B đã rời tổ đội: không nhận dấu mới"); B.room.send("rally",{tx:good.x+0.5,ty:good.y+0.5}); await sleep(600);
  ok(/trong tổ đội/.test(logsOf(B,n))&&B.rallies.length===bb,"B đã rời: không đặt được dấu");
  for(const b of [A,B,E,C]) await b.room.leave().catch(()=>{});
}

async function fogTest(){
  console.log("[#435] Sương mù khám phá");
  const A=await bot("Fog A","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3}), B=await bot("Fog B","kim_vu_mieu_ung",{sex:1,hair:0,hairCol:1,outfitCol:1});
  if(!(await test(A,"ping"))?.enabled){ console.log("  ⚠ bỏ qua sương mù (cần hook goto, warp, gmadmin): bật server bằng GAME_TEST=1"); await A.room.leave(); await B.room.leave(); return; }
  const me=b=>b.room.state.players?.get(b.room.sessionId), M1="tinh_dau_ngoai_vi", M2="tinh_dau_noi_dia";
  const dimsOf=id=>{ const m=loadMap(id); return fogDims(m.MW,m.MH); };
  const askFog=async b=>{ await sleep(300); b.fogBits=null; b.room.send("fog"); await waitFor(()=>b.fogBits,3000); return b.fogBits; };
  const warpTo=async(b,mapId)=>{ b.travel=null; await test(b,"warp",{mapId,x:0,y:0}); ok(await waitFor(()=>b.travel?.mapId===mapId,4000),`warp -> ${mapId}`);
    await b.room.leave(); await sleep(300); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>me(b)&&b.bag,4000); };
  const rejoin=async b=>{ await b.room.leave(); await sleep(500); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>me(b)&&b.bag,4000); };
  // Chỗ đứng được xa chỗ vào ít nhất ~45 ô (ngoài tầm nhìn FOG.sight), quét theo vòng quanh chỗ đứng hiện tại.
  const farSpot=(mapId,from)=>{ const m=loadMap(mapId), cx=from.x/TILE, cy=from.y/TILE, d=dimsOf(mapId);
    for(const r of [60,50,70,45,80]) for(let a=0;a<48;a++){ const x=cx+Math.cos(a/48*Math.PI*2)*r, y=cy+Math.sin(a/48*Math.PI*2)*r;
      if(x>2&&y>2&&x<m.MW-2&&y<m.MH-2&&m.standable(x*TILE,y*TILE)&&fogCellOf(d,x,y)>=0) return {px:x*TILE,py:y*TILE,tx:x,ty:y}; }
    return null; };
  const cellAt=(mapId,tx,ty)=>fogCellOf(dimsOf(mapId),tx,ty);
  await waitFor(()=>me(A)&&A.bag&&me(B)&&B.bag,4000);
  // 1. Bản đồ mở sẵn (Thánh Hồn Thôn): không có sương mù, server không gửi bitset.
  ok(FOG.open.includes(A.mapId),`tài khoản mới ở bản đồ mở sẵn (${A.mapId})`);
  A.room.send("fog"); await sleep(1500);
  ok(A.fogMsgs===0&&A.fogd.length===0,"bản đồ mở sẵn: không gửi tin fog / fogd");
  // 2. Vào bản đồ săn: ô quanh chỗ đứng đã mở, phần còn lại chưa.
  await warpTo(A,M1); await askFog(A);
  const d1=dimsOf(M1), spawnCell=cellAt(M1,me(A).x/TILE,me(A).y/TILE);
  ok(A.fogBits&&fogValid(A.fogBits,d1),`vào ${M1}: bitset đúng cỡ (${A.fogBits?.length} byte, lưới ${d1.cw}×${d1.ch})`);
  const c0=fogCount(A.fogBits);
  ok(c0>0&&c0<d1.cells/4&&fogGet(A.fogBits,spawnCell),`ô quanh chỗ vào được mở (${c0}/${d1.cells}), ô đang đứng có mở`);
  // 3. Đi tới chỗ mới: ô đó được đánh dấu; tin fogd có số ô đó, mỗi tin không quá FOG.maxAdd ô.
  const far=farSpot(M1,me(A)); ok(!!far,"có chỗ đứng được cách xa chỗ vào");
  const cell=cellAt(M1,far.tx,far.ty); ok(!fogGet(A.fogBits,cell),"chỗ xa chưa được mở trước khi tới");
  A.fogd=[]; await test(A,"goto",{x:far.px,y:far.py});
  ok(await waitFor(()=>A.fogd.some(m=>m.add?.includes(cell)),8000),`tới ô mới ${cell}: tin fogd báo mở ô đó`);
  ok(A.fogd.every(m=>Array.isArray(m.add)&&m.add.length>0&&m.add.length<=FOG.maxAdd&&m.add.every(i=>Number.isInteger(i)&&i>=0&&i<d1.cells)),`fogd: số ô hợp lệ, mỗi tin ≤ ${FOG.maxAdd} ô (${A.fogd.length} tin)`);
  await askFog(A); const c1=fogCount(A.fogBits);
  ok(fogGet(A.fogBits,cell)&&fogGet(A.fogBits,spawnCell)&&c1>c0,`bitset đầy đủ: có ô mới và ô cũ (${c0} -> ${c1})`);
  // 4. Tin lạ từ client không đổi gì (server tự quyết ô nào đã khám phá).
  const before=Uint8Array.from(A.fogBits);
  A.room.send("fog",{bits:new Array(d1.bytes).fill(255)}); A.room.send("fog",{bits:"x".repeat(3000),add:[1,2,3]}); A.room.send("fog",null); A.room.send("fog",{add:[0,1,2,3,4,5],bits:{a:1}});
  await sleep(500); await askFog(A);
  ok(A.leftCode===null&&before.length===A.fogBits.length&&before.every((v,i)=>v===A.fogBits[i]),"tin fog lạ từ client (bitset giả, số ô, kiểu sai) bị bỏ: bitset không đổi, vẫn kết nối");
  // 5. Thoát vào lại: còn nguyên (ghi lúc rời phòng), kể cả ô đã tới.
  await rejoin(A); await askFog(A);
  ok(A.mapId===M1&&A.fogBits&&fogValid(A.fogBits,d1)&&fogGet(A.fogBits,cell)&&fogGet(A.fogBits,spawnCell)&&fogCount(A.fogBits)>=c1,`thoát vào lại: bitset còn nguyên (${A.fogBits?fogCount(A.fogBits):0} ô, có ô đã tới)`);
  // 6. Tài khoản khác ở cùng bản đồ không thấy phần của A.
  await warpTo(B,M1); await askFog(B);
  ok(B.fogBits&&fogValid(B.fogBits,d1)&&!fogGet(B.fogBits,cell)&&fogCount(B.fogBits)<c1,`tài khoản khác: không thấy ô của A (B có ${B.fogBits?fogCount(B.fogBits):0} ô, A ${c1})`);
  // 7. Mỗi bản đồ một bitset: sang bản đồ khác chỉ có phần quanh chỗ vào; quay lại vẫn đủ.
  await warpTo(A,M2); await askFog(A); const d2=dimsOf(M2);
  ok(A.fogBits&&fogValid(A.fogBits,d2)&&fogCount(A.fogBits)>0&&fogCount(A.fogBits)<d2.cells/4,`đổi bản đồ ${M2}: bitset riêng đúng cỡ (${A.fogBits?fogCount(A.fogBits):0}/${d2.cells} ô)`);
  await warpTo(A,M1); await askFog(A);
  ok(A.fogBits&&fogValid(A.fogBits,d1)&&fogGet(A.fogBits,cell),"quay lại bản đồ cũ: ô đã khám phá vẫn còn");
  // 8. Lệnh GM (admin): fog open mở cả bản đồ và được lưu; fog reset xoá; tài khoản thường bị từ chối.
  const gm=async(b,cmd)=>{ const l=b.logs.length; b.room.send("gm",{cmd}); await waitFor(()=>b.logs.length>l,2000); await sleep(150); return b.logs.slice(l).join(" | "); };
  ok(/Không có quyền/.test(await gm(B,"fog open")),"tài khoản thường: lệnh GM fog bị từ chối");
  await askFog(B); ok(fogCount(B.fogBits)<d1.cells/2,"tài khoản thường: bản đồ vẫn chưa mở");
  await test(A,"gmadmin",{on:true});
  A.fogBits=null; let t=await gm(A,"fog open"); await waitFor(()=>A.fogBits&&fogCount(A.fogBits)===d1.cells,3000);
  ok(A.fogBits&&fogCount(A.fogBits)===d1.cells&&fogValid(A.fogBits,d1),`GM fog open: mở cả bản đồ (${t})`);
  await rejoin(A); await askFog(A); ok(A.fogBits&&fogCount(A.fogBits)===d1.cells,"GM fog open: còn nguyên sau khi vào lại (đã lưu)");
  A.fogBits=null; t=await gm(A,"fog reset"); await waitFor(()=>A.fogBits&&fogCount(A.fogBits)<d1.cells/4,3000);
  ok(A.fogBits&&fogCount(A.fogBits)>0&&fogCount(A.fogBits)<d1.cells/4,`GM fog reset: về gần trống, chỉ mở quanh chỗ đứng (${A.fogBits?fogCount(A.fogBits):0} ô; ${t})`);
  ok(/open|reset/i.test(await gm(A,"fog xyz")),"GM fog xyz: báo lỗi cú pháp");
  await warpTo(A,"thanh_hon_thon"); A.room.send("fog"); await sleep(800);
  ok(/mở sẵn/.test(await gm(A,"fog open")),"GM fog ở bản đồ mở sẵn: báo không có sương mù");
  await test(A,"gmadmin",{on:false});
  await A.room.leave(); await B.room.leave();
}
