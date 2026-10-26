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
import { solidGrid, hits, PLAYER_HW, PLAYER_HH } from "../../shared/move.ts";
import { findPath, clearLine, pathLength } from "../../shared/path.ts";
import { existsSync, readFileSync } from "node:fs";
import { goTo, checkBeastYears, bossClock, API, sleep, waitFor, ok, failCount, mapUrl, zonesByName, bot, enter, qtyOf, bagKey, bonesOf, sj, useItem, lastLog, sendTeam, same, test, step } from "./bot/lib.mjs"; // tiện ích chung + bot / enter / test … (#703)
import { googleTest } from "./bot/google.mjs"; // #612
import { ab1Block1, ab1Block2, ab1Block3 } from "./bot/ab1.mjs"; // khối ab1 của INLINE (#703 bước 5)
import { ab2Block1, ab2Block2, ab2Block3, ab2Block4, ab2Block5, ab2Block6, ab2Block7, ab2Block8, ab2Block9 } from "./bot/ab2.mjs"; // khối ab2 của INLINE
import { botCFlow } from "./bot/botC.mjs"; // khối botC của INLINE
import { offlineTest } from "./bot/offline.mjs";
import { syncViewTest, flagTest, waypointTest, campTest, bigMapTest, fogTest, rallyTest } from "./bot/mapview.mjs";
import { issue121Test } from "./bot/issue121.mjs";
import { partyBuffTest, partyEffectExpansionTest, supportContribTest, copyPartyTest } from "./bot/party.mjs";
import { chatTest, friendTest } from "./bot/social.mjs";
import { lockTest, inkTest, coldTest, splitTest, boneSubTest, comboTest } from "./bot/combat.mjs";
import { autoBossTest, autoBossPerf } from "./bot/autoBoss.mjs";
import { channelTest, testAccTest } from "./bot/channel.mjs";
import { villageKit, skillCast, comboHits } from "./bot/village.mjs"; // hàm phụ làng / hồn kỹ dùng chung với luồng A / B
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
import { TIERS, TEAM_SIZE, XP_SHARE_ACTIVE, XP_SHARE_BENCH, REVIVE_SECS, RESPAWN_SECS, xpNeed, beastLevel, xpLevelScale, BEASTS, XP_LEVEL_CAP, VOHON, HE, vohonIndex, calcStats, tierOfYears, TIEN_CO, TIEN_CO_MAX, TIEN_CO_GAIN, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY, BAG_SLOTS, DAN_CD, STARTER_ITEMS, itemDef, formatHonTe, TIER_MULT, SKILLS, skillsOf, skillPower, buffPower, BUFF_SCALE, TIEN_CO_RIENG, tienCoOf, statusBit, buffBit, CRIT, TEAM_COMBAT_SECS, BEAST_AGGRO_R, MAX_YEARS, beastStats, rollYears, tierBand, parseLevelRange, RING_ITEM, ringLimit, beastSkillOf, CORE_ITEM, SKIN_TONES, parseLooks, PLAYER_SPEED, RUN_MULT, BEAST_GAIT, BEAST_LEASH, TICK_RATE } from "../../shared/data.ts";
import { encodeLpc } from "../../shared/data.ts"; // Looks v2 (#509)
import { BEAST_ROOTED, beastMelee } from "../../shared/data.ts"; // hồn thú: thú thực vật đứng yên, thủ, trạng thái riêng trên hồn sư (#116)




// ---- Nhiều kênh (mục 6): cần server hạ số người mỗi kênh, CHANNEL_MAX=2 GAME_TEST=1 npm run dev:server. Khi đó bot chỉ chạy phần
// này rồi thoát (các phần khác cần nhiều bot chung một phòng); server bình thường (60 người / kênh) thì bỏ qua phần này. ----
const health=await fetch(API+"/health").then(r=>r.json()).catch(()=>({}));
if(health.chMax===2){ await channelTest(health); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
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
  ["partyBuff",6,()=>partyBuffTest(vil),true],         //  10 9.1
  ["partyEffect",6,()=>partyEffectExpansionTest(vil),true], // 11 #114
  ["supportContrib",6,supportContribTest,true],    // 13 9.2
  ["copyParty",6,()=>copyPartyTest(vil),true],         //  11 9.3
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






























