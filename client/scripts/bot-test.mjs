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
import { solidGrid, hits, isSolidTile, PLAYER_HW, PLAYER_HH } from "../../shared/move.ts";
import { findPath, findLongPath, buildNav, navNode, clearLine, pathLength } from "../../shared/path.ts";
import { autoLeg } from "../../shared/autowalk.ts"; // tự đi tới cờ (R4, #431)
import { existsSync, readFileSync } from "node:fs";
import { goTo, checkBeastYears, checkGateClear, bossClock, API, WS, post, sleep, waitFor, PASS, RUN, ok, failCount, mapFileOf, mapUrl, zonesByName, bot, enter, qtyOf, bagKey, bonesOf, sj, useItem, lastLog, AT, objOf, npcSpot, talk, trade, looseOf, sendTeam, same, test, step } from "./bot/lib.mjs"; // tiện ích chung + bot / enter / test … (#703)
import { googleTest } from "./bot/google.mjs"; // #612
import { ab1Block1, ab1Block2, ab1Block3 } from "./bot/ab1.mjs"; // khối ab1 của INLINE (#703 bước 5)
import { ab2Block1, ab2Block2, ab2Block3, ab2Block4, ab2Block5, ab2Block6, ab2Block7, ab2Block8, ab2Block9 } from "./bot/ab2.mjs"; // khối ab2 của INLINE
import { botCFlow } from "./bot/botC.mjs"; // khối botC của INLINE
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
import { bagTest, charBagCmdTest } from "./bot/bag.mjs";
import { gearLuckTest, forgePreviewTest, luckRaceTest, saveFailTest, buybackProcTest, socialAuditTest, equipSoak } from "./bot/gear.mjs";
import { TIERS, TRAVEL_CAST, CHANNEL_CD, TEAM_SIZE, XP_SHARE_ACTIVE, XP_SHARE_BENCH, REVIVE_SECS, RESPAWN_SECS, xpNeed, beastLevel, xpLevelScale, BEASTS, XP_LEVEL_CAP, VOHON, HE, vohonIndex, calcStats, tierOfYears, TIEN_CO, TIEN_CO_MAX, TIEN_CO_GAIN, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY, BAG_SLOTS, DAN_CD, STARTER_ITEMS, itemDef, formatHonTe, TIER_MULT, SKILLS, skillsOf, skillPower, buffPower, BUFF_SCALE, TIEN_CO_RIENG, tienCoOf, STATUS, STATUS_IDS, statusBit, buffBit, CRIT, TEAM_COMBAT_SECS, BEAST_AGGRO_R, MAPS, MAX_YEARS, beastStats, rollYears, tierBand, parseLevelRange, RING_ITEM, ringLimit, MAX_RINGS, MAX_LEVEL, MAX_STARS, BONE_ITEM, BONE_SLOTS, boneStats, boneBonus, beastSkillOf, TELE_PAD, BOSSES, bossIndex, beastIndex, ELITE, beastName, KING, chestCode, BOAT_CAST, WORLD_SLAM, teleSafe, BONE_SKILLS, BONE_MAX_ENHANCE, BONE_ENHANCE_FEE, enhanceFee, BONE_MAX_SUBS, BONE_SUB_K, BONE_SUB_POOL, BONE_ENHANCE_MILESTONES, boneSubMax, boneSubsDue, parseBoneSubs, boneAddSubs, CORE_ITEM, CORE_SUB_ROLL, CORE_STATS, CORE_STAT_IDS, coreStatText, CORE_SLOTS, CORE_SET_FX, npcDef, NPC_RANGE, SHOP, sellPrice, SWITCH_CD, TONG_MON, CHAN_THAN_RING, ringSkill, PARTY_BUFF_R, PARTY_BUFF_MULT, PARTY_BUFF_SKIP, SUPPORT_CONTRIB, COPY_R, COPY_WINDOW, ARENA, AWAKEN_CHOICES, SKIN_TONES, parseLooks, PLAYER_SPEED, RUN_MULT, BEAST_GAIT, BEAST_LEASH, TICK_RATE, WAYPOINT_CAST, WAYPOINT_FEE, waypointFee, SYNC_VIEW, CAMP_MERCHANT, CAMP_SHOP, CAMP_STEP, shopOf, shopExpands } from "../../shared/data.ts";
import { RADAR, RALLY, MAPS as RALLY_MAPS } from "../../shared/data.ts"; // R5 (#432): bán kính lọc tin mini; R6 (#433): dấu tập trung
import { rallyUpsert, rallyPrune } from "../../shared/rally.ts";
import { FOG } from "../../shared/data.ts"; import { fogDims, fogCount, fogGet, fogCellOf, fogValid } from "../../shared/fog.ts"; import { loadMap } from "../../server/src/map.ts"; // R8 (#435): sương mù khám phá
import { encodeLpc } from "../../shared/data.ts"; // Looks v2 (#509)
import { EQUIP_SLOTS, EQUIP_MAX_ENHANCE } from "../../shared/data.ts"; // E2: rollEquipDrop, rollEquipCharm... (equipDropTest)
import { campMerchantSpot } from "../../shared/camp.ts";
import { hoaDanSpot } from "../../shared/hoaDan.ts"; // Hỏa Đàn (#163)
import { PLAYER_STATUS } from "../../shared/data.ts";
import { AUTO_DAILY_SECS, AUTO_MAX_PER_CELL, AUTO_DEFAULTS, AUTO_MOVE, parseAuto, autoTimeText } from "../../shared/data.ts"; // tự săn (Auto 1, #213)
import { OFFLINE, offlineSplit, offlineFight } from "../../shared/data.ts"; // ủy thác offline (Auto 3)
import { BEAST_ROOTED, beastMelee } from "../../shared/data.ts"; // hồn thú: thú thực vật đứng yên, thủ, trạng thái riêng trên hồn sư (#116)
import { GROUND_KINDS } from "../../shared/data.ts"; // vùng lưu lại trên mặt đất: vũng độc, sương độc (#161)
import { AUTO_BOSS } from "../../shared/data.ts"; // tự săn đánh tinh anh, thú vương, boss thế giới (#218)
import { WORLD_CHAT } from "../../shared/data.ts"; // kênh thế giới (#188)
import { AUTOWALK, TILE } from "../../shared/data.ts"; // tự đi tới cờ (R4, #431)
import { FRIEND_MAX, BLOCK_MAX } from "../../shared/data.ts"; // bạn bè và chặn (#195)




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
timing.push(`chung+khối A/B ${Math.round((Date.now()-T0)/1000)}`);

// Nhóm không có luồng bot C (INLINE.botC) chạy các bài độc lập của mình rồi dừng.
if(PART&&!inPart("botC")){ await runStandalone(HOOK); finish(); }

// ---------- BĐ2: cổng, chặn mềm, lưu bản đồ và vị trí ----------
await botCFlow({ HOOK, timing, world: process.env.BOT_ONLY==="world", tiled, st, blocked }); // BOT_ONLY=world: botC chỉ chạy tới phần boss thế giới (BĐ6e)
await runStandalone(HOOK); // nhóm của bot C (hoặc mọi bài khi không đặt BOT_PART)
finish();

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
