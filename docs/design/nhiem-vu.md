# Nhiệm vụ

Nhiệm vụ theo chuỗi cố định (tân thủ, chương 2, chương 3) và khảo hạch hằng ngày. Mục tiêu, số lượng, phần thưởng ở dữ liệu `QUESTS`, `DAILY` trong `shared/data.ts`; tài liệu chỉ mô tả luật. Số issue ở cuối file.

## Nhiệm vụ tân thủ

Chuỗi "Bài học của Đại Sư" (`QUESTS`, mã `QUEST_STARTER`): bài nhận và trả từng bài với Ngọc Tiểu Cương ở Nặc Đinh Thành, mỗi bài dạy một hệ thống:

| Bài | Tên | Mục tiêu |
|---|---|---|
| 1 | Hậu cần của hồn sư | Nói chuyện với Thương nhân Nặc Đinh |
| 2 | Luyện tay ở Bãi tập | Hạ hồn thú ở Bãi tập hồn sư (Thánh Hồn Thôn) |
| 3 | Đổi tay giữa trận | Đổi võ hồn khi đang giao chiến; tung tiên cơ |
| 4 | Hồn hoàn đầu tiên | Hấp thụ thành công một hồn hoàn **không vượt giới hạn** |
| 5 | Hồn cốt, hồn hạch hộ thân | Gắn một hồn cốt hoặc hồn hạch |
| 6 | Lò rèn Nặc Đinh | Nói chuyện với Thợ rèn Nặc Đinh |
| 7 | Tinh Đấu Đại Sâm Lâm | Tới Tinh Đấu Ngoại vi và hạ hồn thú ở đó |

### Dấu và hộp thoại
- Dấu trên đầu Đại Sư: **"!"** có bài mới, **"?" vàng** đủ mục tiêu chờ trả, "?" xám đang làm; mở hộp thoại khi có dấu thì vào thẳng trang nhiệm vụ.
### Mục tiêu và trả bài
- Mục tiêu **chỉ đếm sau khi nhận**, theo sự kiện thật server ghi nhận (`questEvent`); đồng đội tổ đội được chia kinh nghiệm cũng được tính hạ hồn thú. Mục tiêu dạng "đang có / đang gắn / đang ở" mà đạt sẵn lúc nhận thì xong ngay. Hấp thụ vượt giới hạn mà vẫn thành công thì không tính.
- Trả bài cần đủ mục tiêu và túi đủ chỗ cho **cả** phần thưởng (thiếu thì từ chối, giữ tiến độ). Phần thưởng là Hồn Tệ, vật phẩm theo mã và có thể có **hồn cốt** (`QuestReward.bones`: loài, số năm; server tung vị trí đều trong 6 vị trí, +0, chưa có dòng phụ như hồn cốt rơi ở 5.5, mỗi hồn cốt một ô túi; hộp thoại ghi "vị trí ngẫu nhiên", tô màu theo niên hạn). Khung theo dõi cạnh radar (thu gọn được), thông báo lớn khi nhận / đủ / trả.
### Lưu
- Tiến độ lưu ở bảng `quests`, ghi cùng transaction với túi đồ. Mọi tài khoản bắt đầu ở bài 1.

## Nhiệm vụ chương 2
Chuỗi "Sử Lai Khắc Thất Quái" (`QUESTS`, `QUEST_CH2`): nhận và trả từng bài với **Triệu Vô Cực** ở Thiên Đấu Thành (NPC riêng, đứng cạnh Phất Lan Đức; Phất Lan Đức vẫn giữ khảo hạch hằng ngày).
### Luật chương 2
- **Mở sau chuỗi tân thủ** (`QUEST_AFTER`: chuỗi `QUEST_CH2_AFTER` phải xong), không chặn theo cấp; chặn mềm bằng mục tiêu và cổng như các bài khác. Cùng luật nhận / trả, đứng gần, gục, túi đủ chỗ như nhiệm vụ tân thủ.
- **Server giữ tiến độ nhiều chuỗi cố định** (tân thủ ở `quest`, các chuỗi sau ở `chains`; mỗi chuỗi một dòng bảng `quests`, không cần SQL); tin riêng `quest` kèm mã chuỗi, `questAction` nhận `chain`.
- **Mục tiêu theo bản đồ, không theo vùng.** Kiểu mới: `elite` (tham gia hạ một tinh anh), `king` (có đóng góp khi một thú vương bị hạ), cờ `party` trên `kill` (chỉ tính lần hạ có từ 2 người tổ đội cùng chia kinh nghiệm). Đấu trường tính cả trận thua và giao hữu như khảo hạch hằng ngày.
- Không thưởng mảnh UR (mảnh UR chỉ trong rương boss thế giới, mục 5.3).
- **Server phát sự kiện** (`killBeast`, `killKing`; chỉ đếm sau khi nhận bài): `elite` cho người hạ tinh anh và đồng đội trong `partyNear` (những người được chia kinh nghiệm); `king` cho mọi người có đóng góp (`contributors`) còn trong phòng lúc thú vương bị hạ; `party` là cờ trên sự kiện `kill` khi `partyNear` có từ 2 người.
- Hộp thoại nhận / trả có ở Triệu Vô Cực.

## Hiển thị chuỗi cố định
Chung cho mọi chuỗi trong `QUESTS`, theo `giver` / `map` của chuỗi; chương sau không phải làm lại phía client. Chỉ từ tin riêng `quest` của từng chuỗi, không thêm tin mới.

### Khung theo dõi và dấu NPC
- **Bảng Nhiệm Vụ ở Menu (#1605):** thẻ Hub "Nhiệm Vụ" mở bảng `#quests` (`questScreen.ts`, không còn toast): mỗi chuỗi đang theo dõi một dòng và **mỗi bài khảo hạch hằng ngày chưa xong một dòng** (kể cả chưa nhận, khung theo dõi có thể đang ẩn mục Hằng ngày), kèm trạng thái bằng chữ, mục tiêu x/N, mô tả, phần thưởng và nút "Đến". Số ở dòng đếm = số dòng liệt kê; cuộn được, Esc / × đóng. Chỉ hiển thị, đọc đúng dữ liệu của khung theo dõi; nhận / trả vẫn ở NPC. Bài hồi quy: `client/scripts/quest-panel-browser.mjs` (CI job flow-browser).
- Một chuỗi được **theo dõi** khi đã mở (chuỗi `QUEST_AFTER` của nó đã xong) và chưa xong cả chuỗi. Khung theo dõi có mỗi chuỗi đang theo dõi một mục theo thứ tự `QUESTS` (tên bài, bài x/N, mục tiêu x/N; chưa nhận thì "Gặp <NPC> ở <bản đồ>", đủ thì "quay về gặp…"), rồi mục "Hằng ngày"; bấm / chạm tiêu đề từng mục để thu gọn riêng mục đó (nhận cả chạm trên điện thoại). Điện thoại ngang (màn thấp) thì khung nằm sát bên trái radar, không đè thanh đội hình / nút hồn kỹ.
- Dấu **"!" / "?"** trên đầu NPC `giver` của chuỗi đang theo dõi như Đại Sư (Triệu Vô Cực chỉ có dấu khi chương 2 đã mở; dấu của Phất Lan Đức chỉ theo khảo hạch hằng ngày).
### Chỉ đường trên radar
- **Chỉ đường trên radar** như nhiệm vụ tân thủ và khảo hạch (chấm NPC, khung vùng săn, tô cổng đi tiếp theo `route` của tin `daily`): bài chưa nhận / chờ trả chỉ về NPC giao bài; mục tiêu có `near` chỉ về NPC đó (đấu trường: Đại Đấu Hồn Trường); `elite` chấm chỗ sinh tinh anh của bản đồ đang đứng, không có thì về bản đồ săn hợp cấp; `king` / `world` khung hang thú vương / sàn boss thế giới của bản đồ đang đứng, không có thì về các bản đồ có thú vương / bản đồ boss (ưu tiên hợp cấp); `tong` chấm các sứ giả tông ở Thiên Đấu Thành (`TONG_DAILY.map`); `fusion` không chỉ đường (làm ở đâu cũng được); mục tiêu ghi `map` (chỉ tính ở bản đồ đó, như chương 3 ở Hải Thần Đảo) thì ở bản đồ khác chỉ đường tới đúng bản đồ đó.

## Nhiệm vụ chương 3
Chuỗi "Hải Thần Đảo" (`QUESTS`, `QUEST_CH3`): nhận và trả từng bài với **Hải Mã Đấu La** ở Bến Hải Thần; hành trình Bến Hải Thần → Ma Quỷ Hải Vực → tinh anh trên đảo → săn cùng tổ đội → biển sâu → Thâm Hải Ma Kình Vương → hai thủ hộ của Tiểu Vũ (boss thế giới ở Lõi Tinh Đấu) → gặp Ba Tái Tây ở Thánh địa Hải Thần → hai lời dặn của Đại Cung Phụng (dung hợp kỹ, tông môn).
### Luật chương 3
- **Mở sau chương 2** (`QUEST_AFTER`: chuỗi `QUEST_CH3_AFTER` phải xong), không chặn theo cấp; chặn mềm bằng cổng Hải Thần Đảo (cấp đề xuất ở `MAPS`) và mục tiêu. Cùng luật nhận / trả, lưu ở bảng `quests` như hai chuỗi trước (không cần SQL). Lời kết chương 2 chỉ đường bến thuyền.
- **Mục tiêu theo bản đồ.** Sự kiện `talk`, `elite`, `king` mang bản đồ của phòng nên lọc được theo `map` (thương nhân lưu động ở Bến Hải Thần, tinh anh / thú vương của Hải Thần Đảo). Kiểu mới `world`: mọi người có đóng góp còn trong phòng lúc một boss thế giới bị hạ (`killKing`, như `king`, không cần còn lượt rương); boss thế giới vẫn tính cả `king` như chương 2.
- **Phỏng theo truyện:** truyện là chuỗi khảo hạch "Hải Thần Cửu Khảo"; game rút gọn và không dùng con số. Thứ tự khảo hạch, việc săn Thâm Hải Ma Kình Vương, bài hai thủ hộ của Tiểu Vũ (Thái Thản Cự Viên, Thiên Thanh Ngưu Mãng), lời thoại là phỏng theo.
- Thưởng Hồn Tệ, đan lớn, Ủy Thác Lệnh, mảnh Nhu Cốt Thố (cả chuỗi đủ `SHARD_UNLOCK` mảnh) và mảnh Phá Hồn Thương; không mảnh UR. Bài 8 ("Hải Thần Tam Xoa Kích") thưởng thêm **một hồn cốt Thâm Hải Ma Kình**, niên hạn bằng Thâm Hải Ma Kình Vương (`BossDef.years`, thấp hơn hồn cốt 100.000 năm của rương boss thế giới), vị trí ngẫu nhiên; một lần mỗi tài khoản (bài đã trả không trả lại). Thưởng hồn cốt cho người vượt khảo hạch là phỏng theo truyện.
### Bài nối thêm
- **Bài nối thêm** (#286) chỉ thêm vào **cuối** chuỗi, không chèn giữa (tiến độ lưu theo chỉ số bước; người đã xong 8 bài thấy bài 9 ở Hải Mã Đấu La). Bài 9 "Song hồn dung hợp" (phỏng theo dung hợp kỹ của Đường Tam và Tiểu Vũ): kiểu `fusion`, tung thành công một Võ Hồn Dung Hợp Kỹ (mục 5.9); server phát sự kiện lúc chiêu nổ cho **cả** người mời và người hưởng ứng, ai đã nhận bài thì được tính. Bài 10 "Thượng Tam Tông" (phỏng theo): kiểu `tong`, đang thuộc một tông môn (mục 5.14); sự kiện phát khi gia nhập hoặc đổi tông, `have`: đã có tông lúc nhận thì xong ngay. Thưởng Hồn Tệ và mảnh võ hồn SSR (U Minh Linh Miêu, Lam Điện Bá Vương Long); không hồn cốt, không mảnh UR, không buff theo tông.

## Nhiệm vụ hằng ngày
"Khảo hạch Sử Lai Khắc" (`DAILY`, `DAILY_POOL`): mỗi ngày `DAILY.count` bài, nhận và trả từng bài với Phất Lan Đức ở Thiên Đấu Thành (cùng luật đứng gần, gục, túi đủ chỗ như nhiệm vụ tân thủ), không cần xong chuỗi tân thủ.
### Đặt lại và chọn bài
- **Đặt lại lúc 00:00 giờ Việt Nam** (như lượt thưởng boss, `vnDay`): bộ bài mới chưa nhận, bài hôm qua dở dang bỏ luôn, không trả được. Người đang chơi được báo ngay lúc qua ngày.
- **Bộ bài chọn ổn định theo ngày** (mọi người cùng bộ, `dailyPicks`): bài 1 luôn là bài săn (nhóm `hunt`), các bài sau lấy không trùng trong nhóm `misc`; mỗi bài thưởng Hồn Tệ của mẫu và mảnh một võ hồn SR / SSR (`ARENA_SHARDS`) bốc theo ngày.
### Mẫu bài và nộp vật phẩm
- **Mẫu bài:** hạ N hồn thú **hợp cấp** (`fitBeast`: không bị giảm kinh nghiệm theo chênh cấp với võ hồn ra trận, mục 5.3; đồng đội tổ đội chia kinh nghiệm cũng được tính theo cấp của mình); đánh xong một trận Đại Đấu Hồn Trường (thắng / thua / hòa; bỏ trận hoặc đối thủ không vào sân thì không tính); đổi tay trong trận và tung tiên cơ; nộp vật phẩm (hồn hạch, hồn hoàn, Hồi Huyết Đan). Không có bài "hấp thụ hồn hoàn": chỉ làm được khi võ hồn chạm bình cảnh, nên thay bằng nộp hồn hoàn.
- **Nộp vật phẩm:** số đếm là số món đang có trong túi (không tính đồ đang gắn, đồ đã cường hóa / nâng cấp, hồn hoàn đang hấp thụ), tính lại mỗi khi túi đổi hoặc bắt đầu / thôi hấp thụ; trả bài thì bớt đồ (rẻ nhất trước) rồi mới kiểm tra túi đủ chỗ cho phần thưởng.
### Lưu và giao diện
- **Lưu:** mỗi bài một dòng bảng `quests` với mã chuỗi `daily:<yyyymmdd>:<i>`; nội dung bài suy ra từ mã nên không cần bảng hay cột mới. Lần ghi túi nào có bài khảo hạch cũng xóa dòng khảo hạch của các ngày khác.
- **Giao diện:** khung theo dõi có mục **"Hằng ngày"** (bài đã nhận với mục tiêu x/N, số bài chưa nhận / chờ trả, thu gọn được) hiện khi đã xong chuỗi tân thủ, đã nhận bài hôm nay hoặc đang ở Thiên Đấu Thành; hộp thoại Phất Lan Đức có trang khảo hạch (mỗi bài một khung, nút nhận / trả riêng); dấu "!" / "?" trên đầu như NPC giao nhiệm vụ.
- **Chỉ đường trên radar** (cả nhiệm vụ tân thủ): mục tiêu ở bản đồ đang đứng thì chấm vàng nhấp nháy ở NPC cần gặp / khung vùng săn (bài săn hợp cấp: vùng có hồn thú hợp cấp); ở bản đồ khác thì tô vàng cổng đi tới bản đồ kề trên đường ngắn nhất (server tính theo cổng của các file Tiled, gửi kèm tin `daily`). Bài săn và nộp hồn hạch / hồn hoàn chỉ về bãi săn có cấp đề xuất chứa cấp võ hồn ra trận (`fitMaps`); bài chờ trả hoặc chưa nhận chỉ về NPC giao bài.

## Lịch sử / issue liên quan
- Hiển thị chuỗi cố định #190; bài nối chương 3 (Song hồn dung hợp, Thượng Tam Tông) #286.
- Nhật ký từng bước: `docs/lich-su.md`.
