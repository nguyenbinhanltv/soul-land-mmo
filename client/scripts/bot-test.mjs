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
import { API, failCount, needHookSkip } from "./bot/lib.mjs"; // tiện ích chung (#703)
import { abFlow } from "./bot/ab.mjs"; // phần chung + luồng A / B (#703 bước 7)
import { googleTest } from "./bot/google.mjs"; // #612
import { botCFlow } from "./bot/botC.mjs"; // khối botC của INLINE
import { offlineTest } from "./bot/offline.mjs";
import { syncViewTest, flagTest, waypointTest, campTest, bigMapTest, fogTest, rallyTest } from "./bot/mapview.mjs";
import { issue121Test } from "./bot/issue121.mjs";
import { partyBuffTest, partyEffectExpansionTest, supportContribTest, copyPartyTest } from "./bot/party.mjs";
import { chatTest, friendTest } from "./bot/social.mjs";
import { lockTest, inkTest, coldTest, splitTest, boneSubTest, comboTest } from "./bot/combat.mjs";
import { autoBossTest, autoBossPerf } from "./bot/autoBoss.mjs";
import { channelTest, testAccTest } from "./bot/channel.mjs";
import { looks2Test } from "./bot/looks2.mjs";
import { looks3Test } from "./bot/looks3.mjs";
import { sellTest } from "./bot/sell.mjs";
import { gmTest } from "./bot/gm.mjs";
import { shardBuyTest } from "./bot/shardBuy.mjs";
import { tongTest } from "./bot/tong.mjs";
import { questTest } from "./bot/quest.mjs";
import { dailyTest } from "./bot/daily.mjs";
import { resonanceTest } from "./bot/resonance.mjs";
import { rankTest } from "./bot/rank.mjs";
import { calendarTest } from "./bot/calendar.mjs";
import { welfareTest } from "./bot/welfare.mjs";
import { achvTest } from "./bot/achv.mjs";
import { mailTest } from "./bot/mail.mjs";
import { bicanhTest } from "./bot/bicanh.mjs";
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
// vil (làng) và blocked (ô chặn) do luồng A / B dựng (bot/ab.mjs), gán sau khi abFlow chạy xong; các bài bên dưới chỉ đọc khi chạy.
let vil, blocked;
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
  ["calendar",2,calendarTest,true],           //  ~8 L2 #877 Lịch Hoạt Động: tuần trước / này / sau, week lạ bị kẹp, đẩy ngày (hook day) đổi tên boss, xin dồn bị gộp
  ["welfare",2,welfareTest,true],             //  ~40 P3 #877 Phúc Lợi: ký hôm nay / đúp / dồn 200, ký bù miễn phí + trả phí + hết lượt, hết chu kỳ, đồng hồ lùi, túi đầy, savefail, vào lại, qua 00:00, sân đấu chặn (chưa đo)
  ["achv",2,achvTest,true],                   //  ~25 #1317 Thành Tựu: nhận khi chưa đạt / đã đạt / đúp / dồn 200 / năm tin cùng lúc, cấp, savefail hoàn lại, túi đầy, vào lại phòng
  ["mail",2,mailTest,true],                   //  ~30 #1336 Thư hệ thống: hộp trống, tin lạ / id lạ, gửi + dedup, đọc / xóa, nhận đúng một lần / đúp / dồn 200 / năm tin cùng lúc, nhận tất cả, hết hạn, savefail hoàn lại, túi đầy, vào lại phòng
  ["bicanh",2,bicanhTest,true],               //  ~140 P2+P3+P4 #877 Bí Cảnh: get, id lạ, mua lượt (xác nhận, giá lũy tiến, trần, dồn 200), savefail, qua ngày, Hồn Kinh Quyển cho võ hồn dự bị (kẹp bình cảnh) + phòng BiCanhRoom (enter, sóng, thưởng, hoàn lượt, trần quyển, đồng hồ lùi; bicanhRoom.mjs) (~110 giây)
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
  ["rank",6,rankTest],                        //  ~25 X2 Bảng Xếp Hạng: Cấp / Sưu tầm (hạng, mốc ghi, đội hình công khai; chưa đo)
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
    if(needHook&&!hook){ needHookSkip(`bỏ qua ${k} (cần hook test): bật server bằng GAME_TEST=1`); continue; }
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
if(process.env.BOT_ONLY==="bicanh"){ await bicanhTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="mail"){ await mailTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="achv"){ await achvTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="welfare"){ await welfareTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
if(process.env.BOT_ONLY==="rank"){ await rankTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
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
if(process.env.BOT_ONLY==="calendar"){ await calendarTest(); console.log(failCount()?`✗ ${failCount()} kiểm tra thất bại`:"✓ Mọi kiểm tra đều qua"); process.exit(failCount()?1:0); }
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

// Phần chung + luồng A / B (đăng nhập, di chuyển, túi, 2.3b, 2.4, các khối ab1 / ab2, vào lại): bot/ab.mjs.
const flow=await abFlow({ inPart }), { HOOK, tiled, st }=flow; // HOOK: bài độc lập cần hook test (STANDALONE) bỏ qua khi server không bật GAME_TEST=1
({ vil, blocked }=flow);
timing.push(`chung+khối A/B ${Math.round((Date.now()-T0)/1000)}`);

// Nhóm không có luồng bot C (INLINE.botC) chạy các bài độc lập của mình rồi dừng.
if(PART&&!inPart("botC")){ await runStandalone(HOOK); finish(); }

// ---------- BĐ2: cổng, chặn mềm, lưu bản đồ và vị trí ----------
await botCFlow({ HOOK, timing, world: process.env.BOT_ONLY==="world", tiled, st, blocked }); // BOT_ONLY=world: botC chỉ chạy tới phần boss thế giới (BĐ6e)
await runStandalone(HOOK); // nhóm của bot C (hoặc mọi bài khi không đặt BOT_PART)
finish();
