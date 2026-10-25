# Luật chung

Điều khiển, chat, di chuyển, giao chiến, vùng an toàn, hồi, gục, đồ rơi, ngày giờ, kênh. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`). Đây là **bảng phím duy nhất**: README và hướng dẫn chơi trỏ về đây.

## 4. Luật chung
### Điều khiển
Chuột / phím là chính; điện thoại có joystick ảo và nút chạm cho mọi thao tác.

| Phím | Việc |
|---|---|
| WASD / mũi tên | Đi (ngoài giao chiến tự chạy) |
| Shift (giữ) | Đi bộ thay vì chạy |
| J / Space | Đánh thường |
| U / I / O / P | 4 ô hồn kỹ mang theo (mục 5.2) |
| R | Võ Hồn Chân Thân (vòng 7) |
| Z / X / C | Kỹ năng hồn cốt chủ động: đầu, tay trái, tay phải (mục 5.5) |
| G | Võ Hồn Dung Hợp Kỹ với đồng đội tổ đội: mời, hoặc hưởng ứng khi được mời (mục 5.9; nút "Dung hợp" trên thanh hồn kỹ, chạm được cả nút trong lời nhắc) |
| 1–4 | Đổi sang võ hồn ở ô tương ứng của đội (chạm ô trên thanh đội hình) |
| E | Nhặt đồ rơi gần nhất |
| F | Đi qua cổng đang đứng; đứng trên truyền tống trận thì mở bản đồ thế giới; không thì nói chuyện với NPC gần nhất |
| V / B / K / H | Bảng đội hình / túi đồ / Cộng minh / Hồn sư (nhân vật); B và H mở cạnh nhau được (mục 5.16). C **không** mở bảng (C là kỹ năng hồn cốt tay phải) |
| [ / ] | Khi bảng Hồn sư đang mở: chuyển tab búp bê trước / sau (Trang bị, Hồn cốt, Hồn hạch, Võ hồn; vòng tròn); không làm gì khi bảng đóng hoặc đang kéo thả |
| L | Bảng Bạn bè (nút "Bạn bè" ở khung tổ đội, mục 5.9) |
| M | Bản đồ thế giới (chỉ xem khi không đứng trên truyền tống trận; nút "Thế giới" dưới radar) |
| N | Bản đồ khu vực của bản đồ đang đứng (nút "Vùng" dưới radar hoặc bấm radar; mục 5.17) |
| Y | Đi / dừng tự đi tới cờ đã đặt (mục 5.17) |
| T | Bật / tắt tự săn ngay (nút "Tự động" ở khung chỉ số mở bảng Tự động, mục 5.13) |
| Enter / Esc | Chat / đóng bảng, hộp thoại (Esc huỷ lần kéo thả hoặc thẻ thao tác trước, rồi mới đóng bảng) |

### Lệnh chat
`/b <tin>` bản đồ, `/d <tin>` tổ đội, `/t <tên> <tin>` tin riêng (tên có dấu cách thì để trong ngoặc kép, hoặc client khớp tên đang thấy / đồng đội), `/r <tin>` trả lời người vừa nhắn riêng, `/tm <tin>` tông môn, `/tg <tin>` kênh thế giới, `/moi <tên>` mời vào tổ đội, `/roi` rời tổ đội, `/hat` bật / tắt hạt bay. Bấm / chạm vào hồn sư khác mở menu người chơi (mời tổ đội, nhắn riêng, kết bạn, chặn / bỏ chặn).

### Kênh chat
`chat {text, ch?, to?}`: server kiểm mọi tin; không lưu DB, client chỉ giữ lịch sử trong phiên; không gửi kèm đồ hay Hồn Tệ.
- **Bản đồ** (thiếu `ch`): mọi người trong phòng (cùng bản đồ, cùng kênh); thông báo "Hệ thống" giữ như cũ.
- **Tổ đội** (`party`): mọi thành viên đang trong game dù ở bản đồ / kênh khác; chưa vào đội thì báo lỗi.
- **Tin riêng** (`whisper`, `to` = tên, không phân biệt hoa thường): người nhận phải đang trong game, không thì báo "không trong game", không lưu thư; người gửi nhận một bản ("Tới …").
- **Thế giới** (`world`): mọi bản đồ, mọi kênh; chỉ hồn sư từ cấp `WORLD_CHAT.minLevel`, mỗi tài khoản 1 tin / `WORLD_CHAT.cdSecs` giây.
- **Tông môn** (`tong`, `/tm`, #198): mọi thành viên cùng tông (mục 5.14) đang trong game, ở bản đồ / kênh nào cũng nhận; chưa thuộc tông thì báo lỗi. Tông xét lúc nhận: vừa rời / đổi tông là thôi nhận tin của tông cũ.
- **Chặn** (mục 5.9 "Bạn bè"): server không gửi tin của người bị chặn ở mọi kênh (bản đồ, tổ đội, tông môn, thế giới) tới người chặn; tin riêng giữa hai người báo lỗi cho người gửi.
- Độ dài tối đa `CHAT_MAX_LEN`; chống spam riêng từng kênh (`server/src/ratelimit.ts`, spam một kênh không làm hết lượt kênh khác).

**Ô chat** (máy tính và điện thoại):
- Tab Tất cả / Bản đồ / Tổ đội / Riêng / Tông / Thế giới (bấm / chạm; tab có tin mới hiện chấm).
- Chọn tab hoặc đang gõ thì khung mở rộng (lịch sử không mờ, cuộn được); bấm lại tab hoặc Esc thì đóng.
- Tin thường gửi theo tab đang chọn (tab Riêng gửi cho người trò chuyện riêng gần nhất).
- Mỗi kênh một màu: tổ đội xanh lá như chấm đồng đội, tin riêng tím, thế giới vàng, tông môn lam ngọc; ở tab Tất cả có nhãn kênh.
- Thông báo riêng cho mình (lỗi, đồ rơi…) hiện ở mọi tab.

### Di chuyển
Số ở `shared/data.ts`, mục "Di chuyển".
- Hồn sư đi bộ `PLAYER_SPEED` pixel/giây nhân hệ số `spd` theo hệ (`HE`, Mẫn công nhanh hơn).
- **Ngoài giao chiến tự chạy**, nhanh gấp `RUN_MULT`; giữ Shift thì đi bộ. **Đang giao chiến luôn đi bộ** (đánh trúng hoặc bị đánh là về đi bộ ngay, hết giao chiến thì chạy lại). Tăng tốc, Làm chậm (`SLOW_CAP`), Choáng / Trói áp lên tốc độ đang dùng như cũ. Điện thoại không có Shift: kéo cần điều khiển một phần thì đi chậm theo độ lệch.
- Hồn thú lang thang chậm và đuổi nhanh (mục 5.3 "Luật chung của hồn thú").

### Giao chiến
Hồn sư "đang giao chiến" khi đánh trúng hoặc bị đánh trong `TEAM_COMBAT_SECS` giây gần nhất. Các việc sắp xếp (xếp đội, chọn hồn kỹ mang theo, gắn / tháo / cường hóa / nâng cấp đồ, hấp thụ, đổi kênh, xếp hàng đấu trường) chỉ làm được khi **không giao chiến, không gục, không đang hấp thụ, không đang đi cổng**. Dùng đan, tiên thảo, mở võ hồn, lên sao thì làm được cả khi giao chiến.

### Vùng an toàn
Cả bản đồ thành (`town`) và vùng `safe` trong bản đồ săn (làng Thánh Hồn Thôn). Ở đó không sinh hồn thú, hồn thú bỏ mục tiêu và không vào, không ai gây sát thương hay trạng thái, không tung hồn kỹ / tiên cơ / Chân Thân / kỹ năng hồn cốt. Người đang đi cổng cũng không gây gì (kể cả đạn đang bay, nhát hẹn giờ, độc và lửa đang cháy).

### Hồi sinh lực và hồn lực
`PLAYER_REGEN`, `SAFE_REGEN_MULT`, `hpRegen`, `mpRegen`: hồi liên tục. Hồn lực hồi theo cấp, võ hồn nhiều hồn lực hồi nhanh hơn. Sinh lực hồi theo phần trăm sinh lực tối đa khi không bị đánh quá `PLAYER_REGEN.calmSecs` giây, không thì chỉ hồi chậm một số điểm cố định; võ hồn không ra trận trong đội (chưa gục) hồi cùng nhịp. Trong vùng an toàn (thành, vùng `safe`) cả sinh lực lẫn hồn lực hồi nhanh gấp `SAFE_REGEN_MULT` lần ngoài rừng.

### Gục
Võ hồn ra trận gục thì tự đổi sang võ hồn chưa gục kế tiếp trong đội (không tính hồi chiêu đổi, không tung tiên cơ). Võ hồn đã gục không đổi vào được; hồi đầy khi về trại hoặc sau `REVIVE_SECS` giây ngoài giao chiến (đồng hồ dừng khi giao chiến). Cả đội gục thì sau `RESPAWN_SECS` giây về điểm hồi sinh (`spawn`) của bản đồ, cả đội hồi đầy, **không mất kinh nghiệm hay đồ**. Sinh lực từng võ hồn không lưu DB: vào lại game thì cả đội đầy.

### Đồ rơi và quyền nhặt
Hồn hoàn, hồn cốt, hồn hạch và đồ rơi đất khác nằm `DROP_TTL_SECS` giây; `DROP_OWNER_SECS` giây đầu chỉ người được ưu tiên (người hạ, hoặc người đóng góp nhiều nhất với tinh anh / thú vương) và **cả tổ đội của người đó lúc rơi** nhặt được. Nhấn E (nút "Nhặt") trong `PICKUP_RANGE` để nhặt món gần nhất mà mình được nhặt; túi đầy thì báo và món đó ở lại. Hồn Tệ, mảnh võ hồn và tiên thảo vào thẳng túi người hạ (túi đầy thì mảnh / tiên thảo rơi xuống đất với cùng luật ưu tiên).

### Ngày và giờ
Mọi lịch boss và lượt "mỗi ngày" theo giờ Việt Nam (`BOSS_TZ`), đổi ngày lúc 00:00; server tự tính, không dùng giờ client hay máy chủ.

### Kênh
Mỗi bản đồ có nhiều kênh, mỗi kênh tối đa `CHANNEL_MAX` người; người cùng bản đồ và cùng kênh mới thấy nhau. Nút "Kênh N" dưới radar mở danh sách kênh; đổi kênh khi ngoài giao chiến, cách nhau ít nhất `CHANNEL_CD` giây, giữ vị trí và tiến độ. Vào game / đi cổng tự vào kênh có đồng đội tổ đội (nếu còn chỗ), không thì kênh ít người nhất. Cách làm ở mục 6 "Nhiều kênh".

### Thông báo toàn server
Lịch boss, boss xuất hiện / bị hạ / rút đi được báo cho mọi bản đồ, mọi kênh.

## Lịch sử / issue liên quan
- Chat nhiều kênh #188; kênh tông môn #198.
- Nhật ký từng bước: `docs/lich-su.md`.
