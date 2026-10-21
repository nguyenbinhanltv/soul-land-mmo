# Rừng Săn Hồn (Đấu La Đại Lục) – Tài liệu thiết kế

> Tài liệu thiết kế **hiện hành** cho người và AI cùng đọc: mô tả luật chơi đang chạy và các quy ước bắt buộc giữ.
> Mọi con số cân bằng nằm ở `shared/data.ts`; tài liệu chỉ mô tả cơ chế và trỏ tới tên hằng / bảng ở đó.
> Luật chơi đổi thì sửa đúng mục tương ứng (không viết nhật ký thay đổi ở đây; lịch sử nằm trong git và các PR).
> Code trích dẫn tài liệu bằng số mục ("mục 5.3", "mục 6 "Nhiều kênh"") nên giữ nguyên số và tên các mục.

## 1. Ý tưởng và phạm vi
MMO thế giới mở pixel 2D trên trình duyệt, lấy bối cảnh **Đấu La Đại Lục**, cơ chế tham khảo game *Đấu La Đại Lục: Thế Giới Săn Hồn*.
Người chơi **sưu tầm võ hồn**, lập đội võ hồn, vào rừng săn hồn thú để farm hồn hoàn, hồn cốt và hồn hạch, rồi nuôi đội mạnh dần.

- Dự án phi thương mại, chỉ chơi cùng bạn bè. **Được dùng đúng tên nhân vật, võ hồn, hồn thú và địa danh trong truyện.**
- Không có nạp tiền hay thể lực: mọi thứ kiếm được bằng cách chơi.

## 2. Nguyên tắc thiết kế
- **Vòng chơi chính:** farm hồn thú → nhặt hồn hoàn, hồn cốt, hồn hạch → võ hồn lên cấp và chạm bình cảnh → hấp thụ hồn hoàn hợp giới hạn → mạnh hơn → vào vùng sâu hơn.
- **Hồn hoàn là nguyên liệu quý:** hấp thụ vượt giới hạn thì có thể mất trắng. Người chơi phải cân nhắc dùng ngay hay farm tiếp hồn hoàn tốt hơn.
- **Đội hình quan trọng hơn một võ hồn mạnh:** phối 4 hệ (cường công, mẫn công, khống chế, phụ trợ), theo một lưu phái (thiêu đốt, cảm điện, chấn đãng…) và đổi võ hồn đúng lúc.
- **Thế giới mở, nhiều người cùng thấy nhau** trên từng bản đồ; các bản đồ nối với nhau bằng cổng (mục 5.3).
- **Thua không mất đồ:** không bao giờ mất võ hồn, hồn hoàn đã hấp thụ, hồn cốt hay hồn hạch đang gắn.
- **Không giao dịch giữa người chơi, không PvP ngoài rừng:** một người farm hộ cả nhóm sẽ làm hỏng vòng chơi chính; chơi cùng nhau qua tổ đội và Đại Đấu Hồn Trường (mục 5.9).
- **Ưu tiên máy tính**, nhưng mọi giao diện mới phải dùng được bằng cả chuột lẫn chạm.

## 3. Mô hình chơi
- **Người chơi là một hồn sư có nhân vật riêng.** Khi tạo tài khoản chọn giới tính, kiểu tóc, màu tóc, màu áo, tông da (mục 5.11). Hồn sư chỉ là hình ảnh đại diện: cấp, chỉ số và hồn hoàn đều thuộc về từng võ hồn.
- **Võ hồn là đơn vị nuôi riêng, sưu tầm được.** Trên bản đồ, người khác thấy hồn sư cùng **võ hồn đang ra trận ở dạng phóng thích** (vũ khí, thú hồn phụ thể, hư ảnh, hào quang) và **các vòng hồn hoàn của võ hồn đó** dưới chân. Đổi võ hồn thì đổi lớp phụ thể và bộ vòng; thân hồn sư giữ nguyên.
- **Nhân vật truyện chỉ dùng cho chân dung và thẻ võ hồn** trong giao diện (thẻ Lam Ngân Thảo vẽ Đường Tam…), không dùng làm nhân vật trên bản đồ.
- **Đội hình 4 võ hồn** (`TEAM_SIZE`). Trên bản đồ chỉ hiện võ hồn đang ra trận; đổi sang võ hồn khác trong đội ngay khi đang đánh.
- **Mỗi võ hồn có 10 hồn hoàn** (`MAX_RINGS`), cấp 1–100 (`MAX_LEVEL`): bình cảnh ở cấp 10, 20, …, 100.
- **Niên hạn tối đa 10 vạn năm** (`MAX_YEARS`).
- Thế giới mở thời gian thực gồm nhiều bản đồ (thành, bản đồ săn, bản đồ boss). Người chơi cùng bản đồ và cùng kênh thì thấy nhau, chat, cùng săn, tranh đồ rơi.

## 4. Luật chung
**Điều khiển** (chuột / phím là chính; điện thoại có joystick ảo và nút chạm cho mọi thao tác):

| Phím | Việc |
|---|---|
| WASD / mũi tên | Đi |
| J / Space | Đánh thường |
| U / I / O / P | 4 ô hồn kỹ mang theo (mục 5.2) |
| R | Võ Hồn Chân Thân (vòng 7) |
| Z / X / C | Kỹ năng hồn cốt chủ động: đầu, tay trái, tay phải (mục 5.5) |
| 1–4 | Đổi sang võ hồn ở ô tương ứng của đội (chạm ô trên thanh đội hình) |
| E | Nhặt đồ rơi gần nhất |
| F | Đi qua cổng đang đứng; không ở cổng thì nói chuyện với NPC gần nhất |
| V / B / K | Bảng đội hình / túi đồ / Cộng minh |
| Enter / Esc | Chat / đóng bảng, hộp thoại |

Lệnh chat: `/moi <tên>` mời vào tổ đội, `/roi` rời tổ đội. Bấm / chạm vào hồn sư khác mở menu người chơi.

**Giao chiến:** hồn sư "đang giao chiến" khi đánh trúng hoặc bị đánh trong `TEAM_COMBAT_SECS` giây gần nhất. Các việc sắp xếp (xếp đội, chọn hồn kỹ mang theo, gắn / tháo / cường hóa / nâng cấp đồ, hấp thụ, đổi kênh, xếp hàng đấu trường) chỉ làm được khi **không giao chiến, không gục, không đang hấp thụ, không đang đi cổng**. Dùng đan, tiên thảo, mở võ hồn, lên sao thì làm được cả khi giao chiến.

**Vùng an toàn:** cả bản đồ thành (`town`) và vùng `safe` trong bản đồ săn (làng Thánh Hồn Thôn). Ở đó không sinh hồn thú, hồn thú bỏ mục tiêu và không vào, không ai gây sát thương hay trạng thái, không tung hồn kỹ / tiên cơ / Chân Thân / kỹ năng hồn cốt. Người đang đi cổng cũng không gây gì (kể cả đạn đang bay, nhát hẹn giờ, độc và lửa đang cháy).

**Hồi sinh lực và hồn lực:** hồi liên tục, sinh lực hồi nhanh hơn khi không bị đánh vài giây; võ hồn không ra trận trong đội hồi cùng nhịp. Vùng an toàn chưa hồi nhanh hơn ngoài rừng. (Các số này còn viết thẳng trong `MapRoom.tick`, chưa chuyển vào `data.ts`.)

**Gục:** võ hồn ra trận gục thì tự đổi sang võ hồn chưa gục kế tiếp trong đội (không tính hồi chiêu đổi, không tung tiên cơ). Võ hồn đã gục không đổi vào được; hồi đầy khi về trại hoặc sau `REVIVE_SECS` giây ngoài giao chiến (đồng hồ dừng khi giao chiến). Cả đội gục thì sau `RESPAWN_SECS` giây về điểm hồi sinh (`spawn`) của bản đồ, cả đội hồi đầy, **không mất kinh nghiệm hay đồ**. Sinh lực từng võ hồn không lưu DB: vào lại game thì cả đội đầy.

**Đồ rơi và quyền nhặt:** hồn hoàn, hồn cốt, hồn hạch và đồ rơi đất khác nằm `DROP_TTL_SECS` giây; `DROP_OWNER_SECS` giây đầu chỉ người được ưu tiên (người hạ, hoặc người đóng góp nhiều nhất với tinh anh / thú vương) và **cả tổ đội của người đó lúc rơi** nhặt được. Nhấn E (nút "Nhặt") trong `PICKUP_RANGE` để nhặt món gần nhất mà mình được nhặt; túi đầy thì báo và món đó ở lại. Hồn Tệ, mảnh võ hồn và tiên thảo vào thẳng túi người hạ (túi đầy thì mảnh / tiên thảo rơi xuống đất với cùng luật ưu tiên).

**Ngày và giờ:** mọi lịch boss và lượt "mỗi ngày" theo giờ Việt Nam (`BOSS_TZ`), đổi ngày lúc 00:00; server tự tính, không dùng giờ client hay máy chủ.

**Kênh:** mỗi bản đồ có nhiều kênh, mỗi kênh tối đa `CHANNEL_MAX` người; người cùng bản đồ và cùng kênh mới thấy nhau. Nút "Kênh N" ở góc bản đồ nhỏ mở danh sách kênh; đổi kênh khi ngoài giao chiến, cách nhau ít nhất `CHANNEL_CD` giây, giữ vị trí và tiến độ. Vào game / đi cổng tự vào kênh có đồng đội tổ đội (nếu còn chỗ), không thì kênh ít người nhất. Cách làm ở mục 6 "Nhiều kênh".

**Thông báo toàn server:** lịch boss, boss xuất hiện / bị hạ / rút đi được báo cho mọi bản đồ, mọi kênh.

## 5. Thiết kế các hệ thống

### 5.1 Võ hồn và đội hình
**Mỗi võ hồn sở hữu có:** cấp (1–100), kinh nghiệm, sao (1–6), 10 ô hồn hoàn, 6 ô hồn cốt, 6 ô hồn hạch, 4 ô hồn kỹ mang theo, số tiên thảo đã dùng.

**4 hệ** (`HE`, biểu tượng ở góc thẻ võ hồn; hệ số chỉ số theo hệ ở `HE`):
- **Cường công:** sát thương chính, thường diện rộng hoặc bùng nổ.
- **Mẫn công:** nhanh, cơ động, đánh liên tục hoặc lao vào hàng sau.
- **Khống chế:** choáng, trói, gom quái, gây dễ thương hoặc trúng độc.
- **Phụ trợ:** hồi máu, khiên, tăng chỉ số, hồi hồn lực, thanh tẩy.

**Độ hiếm:** SR, SSR, UR (`RARITY_MULT`). UR chỉ dành cho Hạo Thiên Chùy và Cửu Bảo Lưu Ly Tháp (mảnh chỉ có ở rương boss thế giới).

**Trạng thái dùng chung** (bảng `STATUS`: thời gian, số tầng tối đa, độ lớn; các lưu phái xoay quanh chúng):

| Trạng thái | Hiệu ứng |
|---|---|
| Thiêu đốt | Mất máu mỗi giây theo tầng. *Viêm bạo* kích nổ một lần phần sát thương còn lại (nhân hệ số) rồi xóa (hoặc đặt lại vài tầng). |
| Cảm điện | Đòn trực tiếp trúng mục tiêu Cảm điện thì lan một phần sát thương sang mục tiêu Cảm điện khác ở gần (một bước, không lan tiếp). |
| Trúng độc | Mất máu mỗi giây theo tầng; hồn thú bị độc hồi máu chậm hơn. |
| Dễ thương | Nhận thêm sát thương từ mọi nguồn (cả sát thương theo thời gian). |
| Phá giáp (Liệt thương) | Nhận thêm sát thương đòn trực tiếp theo tầng (hồn thú chưa có chỉ số thủ nên "giảm thủ" quy thành nhận thêm sát thương). |
| Choáng | Không đi, không đánh, không dùng hồn kỹ, không bị đẩy lùi. "Đóng băng", "hất tung", "quật ngã", "tê liệt" đều là Choáng. |
| Câm lặng | Không dùng hồn kỹ / chiêu; vẫn đánh thường. |
| Trói | Không đi, không bị đẩy lùi; vẫn đánh khi kề bên. "Giam" là Trói. |
| Làm chậm | Giảm tốc; mọi nguồn làm chậm cộng lại tối đa `SLOW_CAP`. |
| Mị hoặc | Làm chậm theo tầng; đủ tầng thì bùng phát thành Mê hoặc. Đang Mê hoặc thì không nhận thêm Mị hoặc. |
| Mê hoặc | Bỏ mục tiêu, đi lung tung quanh chỗ đứng, không đánh. Không bị phá khi trúng đòn. |
| Phong ấn | Không tự gây gì; đủ tầng thì bùng phát thành Dễ thương dài hơn mặc định. |

- Sát thương theo thời gian tính một lần lúc gây (công người gây, kể cả tăng công, × sức mạnh hồn kỹ); không chí mạng, không tạo năng lượng tiên cơ, không giữ hồn sư trong giao chiến. Người gây rời phòng thì trạng thái đó mất.
- Gây lại cùng trạng thái: cộng tầng tới tối đa, lấy thời gian còn lại dài hơn và độ lớn mạnh hơn.
- Khống chế (Choáng, Trói, Câm lặng, Mê hoặc, đẩy lùi) ngắn hơn với hồn thú bậc cao (`CC_TIER_MULT`).
- Choáng, Câm lặng, Mê hoặc trên hồn thú **ngắt chiêu báo trước** đang hiện.
- **Trạng thái trên hồn sư** (`PLAYER_STATUS`, cùng luật cộng tầng): chỉ chiêu của hồn thú và đòn của đối thủ ở Đại Đấu Hồn Trường gây. Mị hoặc, Mê hoặc, Phong ấn không có trên hồn sư: chiêu "mê hoặc" hay "đóng băng" của hồn thú lên hồn sư là Choáng ngắn. Thời gian khống chế trên hồn sư không nhân theo bậc. Trạng thái thuộc hồn sư (đổi võ hồn vẫn còn); vào vùng an toàn hoặc cả đội gục thì hết; **thanh tẩy** (tiên cơ / hồn kỹ phụ trợ) giải hết. Ai cũng thấy dây trói, sao choáng và biểu tượng trên đầu; chính mình thấy ô viền đỏ cạnh hiệu ứng có lợi.
- Hồn thú không có mục tiêu và không bị đánh một lúc thì tự hồi máu (`BEAST_REGEN`), để Trúng độc có tác dụng.

**Hiệu ứng có lợi trên hồn sư** (`BUFFS`: tăng công, tăng tốc, tăng thủ (giảm sát thương nhận), tăng chí mạng, giảm tiêu hao hồn lực, miễn sát thương, lãnh vực phượng hoàng, tàng hình, hút huyết). Như khiên, hiệu ứng **thuộc hồn sư** nên đổi võ hồn vẫn còn (tung ở võ hồn phụ trợ rồi đổi về võ hồn đánh chính); cả đội gục thì mất. Hiệu ứng của võ hồn Phụ trợ lan cho đồng đội tổ đội đứng gần (mục 5.9).
- **Lãnh vực phượng hoàng** (Tà Hỏa Phượng Hoàng): vòng lửa bán kính `PHOENIX_FIELD_R` đi theo hồn sư (rộng hơn khi Tà Hỏa Phượng Hoàng đang Chân Thân, `phoenixFieldR`); hồn thú trong vòng nhận thêm sát thương từ mọi nguồn, kể cả của người khác và sát thương theo thời gian (nhiều lãnh vực chồng nhau chỉ lấy cái mạnh nhất). Tạm vô hiệu khi hồn sư đứng trong vùng an toàn hoặc đang đi cổng.
- **Tàng hình:** hồn thú bỏ mục tiêu và không nhắm tới hồn sư; đối thủ không khóa mục tiêu được (đòn diện rộng vẫn trúng). Đánh thường, tung hồn kỹ / tiên cơ khác, hoặc **bị đòn trực tiếp đánh trúng** (kể cả khi khiên đỡ hết) thì hiện hình; sát thương theo thời gian và đòn bị miễn thì không. Người khác thấy mờ hẳn, chính mình thấy nửa trong suốt.
- **Hút huyết** (Quỷ Mị): một phần mọi sát thương hồn sư gây lên hồn thú (đòn trực tiếp, theo thời gian, lan Cảm điện) hồi thành sinh lực cho võ hồn đang ra trận; cộng với hút máu riêng của từng hồn kỹ.
- **Phong Lôi Chi Lực** (Lam Điện Bá Vương Long, `PHONG_LOI`): thanh của hồn sư, chỉ tích khi Lam Điện ra trận đánh trúng (đòn thường, hồn kỹ; nhiều hơn khi trúng hồn thú Cảm điện; gấp đôi khi đang Chân Thân, `ChanThanDef.lei`). Đầy thì **tự tung Lôi Động Minh Thiên** (vùng quanh thân, thêm sát thương lên mục tiêu Cảm điện, Choáng ngắn), thanh về 0; đòn này không tạo năng lượng tiên cơ và không tích lại thanh. Ngoài giao chiến lâu thì giảm dần; Lam Điện gục thì mất hết; không lưu DB. Ai cũng thấy tia sét quanh thân; chính mình thấy thanh dưới thanh kinh nghiệm.

**Danh sách võ hồn** (`VOHON`: mã cố định, hệ, độ hiếm, chủ nhân, lưu phái, màu; thêm võ hồn mới vào cuối mảng). Chủ nhân để trống khi truyện không ghi rõ (không bịa nhân vật gốc; chân dung vẽ theo hình võ hồn).

| Võ hồn | Hệ | Độ hiếm | Chủ nhân | Lối đánh | Lưu phái |
|---|---|---|---|---|---|
| Cửu Tinh Thất Sát Kiếm | Cường công | SSR | Kiếm Đấu La Trần Tâm | Kiếm trận diện rộng liên tục, chồng Phá giáp rồi chém theo tầng; tuyệt kỹ Kiếm Trảm Sơn Hà | Phá giáp |
| Lam Điện Bá Vương Long | Cường công | SSR | Ngọc Thiên Hằng | Sấm sét diện rộng gây Cảm điện, đánh mục tiêu Cảm điện đau hơn; Phong Lôi Chi Lực, Lôi Động Minh Thiên | Cảm điện (lõi) |
| Kỳ Nhung Thông Thiên Cúc | Cường công | SSR | Cúc Đấu La Nguyệt Quan | Cánh hoa sát thương liên tục, hạn chế di chuyển (Trói ngắn), hồi chiêu ngắn lấp khoảng cho võ hồn bùng nổ | Thiêu đốt / Phá giáp |
| Tà Hỏa Phượng Hoàng | Cường công | SSR | Mã Hồng Tuấn | Bay, Thiêu đốt diện rộng, lãnh vực phượng hoàng | Thiêu đốt (lõi) |
| U Minh Linh Miêu | Mẫn công | SSR | Chu Trúc Thanh | Tốc độ, chí mạng cao, cào liên hoàn; tuyệt kỹ U Minh Bách Trảo | Chấn đãng |
| Nguyệt Nhận | Mẫn công | SSR | Tà Nguyệt | Lướt xuyên hàng, khóa và hạ mục tiêu yếu máu | Thiêu đốt / Phá giáp |
| Hỏa Long | Mẫn công | SSR | Hỏa Vô Song | Tầm xa phạm vi rộng, khó trượt; Viêm bạo kích nổ Thiêu đốt | Thiêu đốt |
| Nhu Cốt Thố | Mẫn công | SSR | Tiểu Vũ | Lướt, quật ngã, chí mạng, hút máu, Mị hoặc | Chấn đãng |
| Kim Vũ Miêu Ưng | Mẫn công | SSR | – | Bay, vuốt "tê liệt" (Choáng + Câm lặng), áo nghĩa phủ Cảm điện cả vùng | Cảm điện |
| Tử Vong Chu Hoàng | Khống chế | SSR | Bỉ Bỉ Đông | Giăng tơ gom quái, giam, độc nhện | Trúng độc / Cảm điện |
| Bích Lân Xà Hoàng | Khống chế | SSR | Độc Đấu La Độc Cô Bác | Trúng độc cộng dồn, Câm lặng diện rộng, đòn theo tầng độc, hút máu | Trúng độc (lõi) |
| Càn Khôn Hỗn Nguyên Tỏa | Khống chế | SSR | – | Bay tới tạo vùng phong tỏa, giam; Phong ấn cộng dồn thành Dễ thương | Cảm điện |
| Hỏa Ảnh | Khống chế | SSR | – | Choáng, đẩy lùi, Thiêu đốt, gây Dễ thương cho đồng đội đánh | Thiêu đốt |
| Yêu Hồ | Khống chế | SSR | Hồ Liệt Na | Mị hoặc cộng dồn, ảo ảnh tàng hình, lãnh vực làm chậm, ngắt chiêu | Cảm điện |
| Xúc Xích (Hương Tràng) | Phụ trợ | SSR | Áo Tư Tạp | Hồi sinh lực / hồn lực, thanh tẩy, xúc xích bay; áo nghĩa Phục Chế | Cảm điện |
| Quỷ Mị | Phụ trợ | SSR | Quỷ Đấu La | Hút huyết, tăng công đội, tàng hình cả đội | Bùng nổ |
| Thiên Càn Bạch Ngọc Đỉnh | Phụ trợ | SSR | – | Hồi máu, khiên, giảm sát thương, thanh tẩy; Dễ thương / Phá giáp và xóa buff lên boss | Đánh boss |
| Lam Ngân Thảo | Khống chế | SR | Đường Tam | Trói, gom quái, gây Dễ thương; tặng từ đầu game | Chấn đãng |
| Hạo Thiên Chùy | Cường công | UR | Đường Hạo | Sát thương theo % máu, Phá giáp, hất tung | Chấn đãng |
| Cửu Bảo Lưu Ly Tháp | Phụ trợ | UR | Ninh Vinh Vinh | Tăng công / tốc / thủ, giảm tiêu hao; tuyệt kỹ Vô Địch Thần Quang | Thiêu đốt |
| Phá Hồn Thương | Cường công | SSR | – | Thương lướt đâm xuyên hàng, chồng Phá giáp, "phá hồn" Câm lặng | Phá giáp |
| A Ngân | Phụ trợ | SSR | A Ngân (Lam Ngân Hoàng) | Hồi máu, khiên, tăng chỉ số đội, thanh tẩy; dây Lam Ngân trói, gây Dễ thương | Chấn đãng |
| Liệt Hỏa Thương Lang | Mẫn công | SR | – | Lao vồ, cắn xé chồng Thiêu đốt, tiếng tru tăng tốc, khóa mục tiêu yếu máu | Thiêu đốt |
| Băng Phượng Hoàng | Khống chế | SSR | Thủy Băng Nhi | Bay, băng phong diện rộng (đóng băng = Choáng), Làm chậm, Dễ thương | Băng phong |

**Võ hồn ngoài danh sách SSR cơ bản:** Lam Ngân Thảo, Hạo Thiên Chùy, Cửu Bảo Lưu Ly Tháp và 4 võ hồn cuối bảng không có trong lựa chọn thức tỉnh (`AWAKEN_CHOICES` là 17 SSR cơ bản; `EXTRA_VOHON` là 4 võ hồn thêm sau). Chỉ mở bằng mảnh.

**Ràng buộc** (`BONDS`, `bondsOf`, `bondSum`): hai võ hồn của một cặp cùng nằm trong đội (ô bất kỳ, kể cả đang gục) thì võ hồn nào ra trận cũng hưởng; cùng loại hiệu ứng từ nhiều cặp thì cộng. Bảng đội hình hiện dòng "Ràng buộc".

| Cặp | Tên | Loại hiệu ứng |
|---|---|---|
| Hạo Thiên Chùy + Nhu Cốt Thố | Hạo Thiên – Nhu Cốt | Chí mạng mọi đòn trực tiếp |
| Tà Hỏa Phượng Hoàng + Hỏa Ảnh | Tà Hỏa – Hỏa Ảnh | Thiêu đốt do hồn sư gây mạnh hơn (tính lúc gây) |
| Lam Ngân Thảo + Hạo Thiên Chùy | Song Sinh Võ Hồn | Sức mạnh hồn kỹ ô U / I / O / P (cả sát thương lẫn mức hiệu ứng) |
| A Ngân + Lam Ngân Thảo | Lam Ngân Hoàng | Hồi máu và khiên do hồn sư tạo (cả phần lan cho tổ đội); hút máu và đan không đổi |
| Băng Phượng Hoàng + Hỏa Long | Băng Hỏa Lưỡng Nghi | Sát thương lên hồn thú đang Choáng hoặc Thiêu đốt; không áp cho đối thủ ở đấu trường |
| Cửu Bảo Lưu Ly Tháp + Cửu Tinh Thất Sát Kiếm | Thất Bảo Lưu Ly Tông | Công (cộng với hiệu ứng tăng công) |

**Lưu phái đội hình mẫu:**
- **Thiêu đốt:** Tà Hỏa Phượng Hoàng + Hỏa Long + Hỏa Ảnh + Cửu Bảo Lưu Ly Tháp (chồng tầng rồi đổi tay vào Hỏa Long kích nổ).
- **Cảm điện:** Lam Điện Bá Vương Long + Kim Vũ Miêu Ưng + Càn Khôn Hỗn Nguyên Tỏa + Xúc Xích (phủ Cảm điện cả vùng rồi đổi sang Lam Điện).
- **Chấn đãng:** Hạo Thiên Chùy + Nhu Cốt Thố + Lam Ngân Thảo + Quỷ Mị.
- **Trúng độc:** Bích Lân Xà Hoàng + Tử Vong Chu Hoàng + Nguyệt Nhận + Thiên Càn Bạch Ngọc Đỉnh.

**Sưu tầm võ hồn** (không có gacha):
- **Lễ thức tỉnh** (một lần, khi tài khoản chưa có võ hồn; Tố Vân Đào làm lễ): nhận Lam Ngân Thảo (`AWAKEN_GIFT`) và **tự chọn 1 võ hồn** trong `AWAKEN_CHOICES`; server kiểm tra lựa chọn và tung hồn lực bẩm sinh 1–10 (= cấp khởi đầu của cả hai). Không có thức tỉnh lại, không bao giờ xóa võ hồn.
- Võ hồn khác mở bằng **mảnh võ hồn** (vật phẩm `manh_<mã>`, gộp `SHARD_STACK` một ô): rơi từ hồn thú (mỗi bản đồ săn rơi mảnh của vài võ hồn riêng, mục 5.3 "Rơi đặc trưng"), rương thú vương, rương boss thế giới, thưởng Đại Đấu Hồn Trường, nhiệm vụ.
- Bảng đội hình (V), mục "Mảnh võ hồn": đủ `SHARD_UNLOCK` mảnh của võ hồn chưa có thì **Mở** (võ hồn mới cấp 1, 1★, vào bộ sưu tập, không tự vào đội); võ hồn đã có dùng mảnh để **Lên sao** tới `MAX_STARS` (`STAR_COST`).
- **Sao:** mỗi sao trên 1 cộng % sinh lực, hồn lực, công gốc (`STAR_STAT`, không đổi tốc độ); cộng % sức mạnh hồn kỹ vòng 1–4 và tiên cơ riêng (`STAR_SKILL`, `starSkillMult`); từ `STAR_CD_STARS` sao giảm hồi chiêu hồn kỹ vòng 1–4 (`starCdMult`); ở `STAR_TIEN_CO_STARS` sao tiên cơ riêng mạnh thêm (`starTienCoMult`). Hồn kỹ vòng 5–10, Chân Thân, tiên cơ chung, kỹ năng hồn cốt không đổi theo sao. Thẻ võ hồn từ 2★ ghi phần cộng; chú thích hồn kỹ ghi sức mạnh / hồi chiêu đã tính sao.

**Trong trận:**
- Phím 1–4 (hoặc chạm ô trên thanh đội hình) đổi ngay sang võ hồn khác trong đội, hồi `SWITCH_CD` giây; cấm khi cả đội gục, đang hấp thụ hoặc võ hồn đích đã gục. Hồn lực thuộc hồn sư nên đổi võ hồn giữ tỉ lệ hồn lực; mỗi võ hồn có sinh lực riêng.
- Xếp đội (thay, đổi chỗ, bỏ ra) chỉ khi ngoài giao chiến (mục 4). Đội có ít nhất 1 võ hồn; võ hồn ra trận luôn nằm trong đội.
- **Năng lượng tiên cơ** (`TIEN_CO_*`): thuộc từng võ hồn trong đội, 0–`TIEN_CO_MAX`. Võ hồn ra trận đánh trúng thì **các võ hồn khác trong đội (chưa gục) tích năng lượng** (`TIEN_CO_GAIN`, một lần mỗi đòn dù trúng nhiều mục tiêu); võ hồn ra trận không tự tích. Gục hoặc rời đội thì mất hết; ngoài giao chiến quá `TIEN_CO_IDLE_SECS` giây thì cả đội giảm dần (`TIEN_CO_DECAY`); không lưu DB.
- **Chiêu tiên cơ:** chỉ **đổi tay** vào võ hồn đầy năng lượng mới tung, ngay lúc xuất hiện; tung xong về 0. Tự đổi khi gục không tung và giữ năng lượng. Tiên cơ không tốn hồn lực, không vướng hồi chiêu, không tạo năng lượng (tránh nối vô hạn). Trong vùng an toàn đổi tay được nhưng không tung và giữ năng lượng. Mỗi võ hồn có **tiên cơ riêng** (`TIEN_CO_RIENG`, chạy bằng bộ máy hồn kỹ); tiên cơ chung theo hệ (`TIEN_CO`: Bạo Liệt, Thiểm Sát, Phong Tỏa, Hộ Thể) chỉ làm dự phòng cho võ hồn thêm sau chưa có dữ liệu. Bộ hồn hạch Tiên Cơ tăng tốc tích và sát thương tiên cơ (mục 5.6).
- Người chơi thấy năng lượng từng võ hồn trên thanh đội hình (ô đầy sáng viền, chữ "Tiên cơ!"); người khác chỉ thấy hiệu ứng tiên cơ.

**Kinh nghiệm:** hạ hồn thú thì kinh nghiệm (đã giảm theo chênh cấp, mục 5.3) chia cho đội võ hồn: võ hồn ra trận `XP_SHARE_ACTIVE`, mỗi võ hồn khác trong đội `XP_SHARE_BENCH`; ô trống và võ hồn đang ở bình cảnh không nhận, phần đó bỏ đi. Võ hồn cấp 100 đủ 10 vòng không nhận kinh nghiệm nữa. Tổ đội người chơi chia trước (mục 5.9).

**Chỉ số võ hồn** (`calcStats`): theo hệ, độ hiếm, cấp, hồn hoàn (sinh lực và công theo màu, hồn lực theo số vòng), sao; rồi % của hồn hạch, cộng minh, tiên thảo nhân phần gốc; rồi phần phẳng của hồn cốt và hồn hạch. Chí mạng gốc ở `CRIT`.

**Danh hiệu** theo cấp võ hồn đang ra trận, hiện trên đầu hồn sư: mỗi 10 cấp một danh hiệu, từ Hồn Sĩ tới Phong Hào Đấu La (`TITLES`, `titleOf`).

### 5.2 Hồn hoàn
**Niên hạn là số năm cụ thể.** Mỗi hồn thú có tuổi ngẫu nhiên trong khoảng `years` của vùng (`rollYears`: phân bố log, càng già càng hiếm), hồn hoàn rơi ra mang đúng số năm đó. Màu (bậc) suy ra từ số năm theo `TIERS`: **trắng, vàng, tím, đen, đỏ** (đỏ = đúng 10 vạn năm). Chỉ số hồn thú tăng liên tục theo số năm (`beastStats`, nội suy giữa các mốc `TIERS`).

**Hồn hoàn là vật phẩm:** rơi xuống đất khi hạ hồn thú (luật nhặt ở mục 4), nằm trong túi mỗi chiếc một ô ghi số năm, bỏ hoặc bán được. Chọn hồn hoàn trong túi ("Hấp thụ…") rồi chọn võ hồn để hấp thụ.

**Hấp thụ:**
- Chọn **võ hồn bất kỳ trong bộ sưu tập** đang ở bình cảnh (cấp 10, 20, …; kinh nghiệm dừng ở đó tới khi hấp thụ). Chỉ khi ngoài giao chiến; trong vùng an toàn được.
- **Giới hạn theo vòng** (`RING_LIMIT`, theo lý thuyết của Đại Sư trong truyện). Trong giới hạn luôn thành công; vượt giới hạn có tỉ lệ thất bại theo % vượt (`ABSORB_FAIL`, `absorbChance`; % làm tròn lên); vượt quá mức cuối thì không cho hấp thụ. Bảng chọn hiện giới hạn vòng kế tiếp, % vượt và tỉ lệ thất bại trước khi xác nhận; client và server dùng chung `absorbChance`.
- **Thất bại thì chỉ mất hồn hoàn đó**, không phạt gì thêm.
- Thời gian tăng theo niên hạn (`ABSORB_SECS`, `absorbSecs`, nội suy theo log số năm). Di chuyển hoặc bị đánh thì hủy, hồn hoàn vẫn còn trong túi.
- Thành công: võ hồn lên 1 cấp, vòng lưu đúng số năm, mở hồn kỹ của vòng đó. Vòng 10 hấp thụ ở cấp 100 nên không lên thêm cấp. Võ hồn chưa có dữ liệu hồn kỹ của vòng thì vòng đó chỉ tăng chỉ số (có báo).

**Hồn kỹ theo vòng:**
- Vòng 1–6: mỗi vòng một hồn kỹ riêng. Vòng 7: **Võ Hồn Chân Thân**. Vòng 8–9: hồn kỹ mạnh. Vòng 10: **tuyệt kỹ** (`SkillDef.ult`: tên lớn bay lên, vòng sáng, chớp màn hình cho người ở gần).
- Dữ liệu: vòng 1–4 `VOHON_SKILLS`, vòng 5/6/8/9/10 `VOHON_SKILLS_HIGH` (`HIGH_RINGS`), tiên cơ `TIEN_CO_RIENG`, Chân Thân `CHAN_THAN`; tra hồn kỹ của vòng bằng `ringSkill`. Bảng chi tiết hồn kỹ từng võ hồn (tên, vùng tác dụng, số liệu) chính là các bảng này trong `shared/data.ts`. Cả 24 võ hồn đủ dữ liệu. `SKILLS` (Hồn Bạo, Thiểm Kích, Hồn Tiễn, Hồn Vực) là hồn kỹ chung dự phòng cho võ hồn thêm sau.
- **4 ô mang theo** (U / I / O / P, `LOADOUT_SIZE`, `loadoutOf`): mỗi võ hồn tự nhớ 4 ô, mỗi ô là một vòng có hồn kỹ đã mở hoặc để trống; chưa chọn thì mặc định vòng 1–4 (`DEFAULT_LOADOUT`). Xếp ở bảng đội hình, mục "Hồn kỹ mang theo" (đang ở ô khác thì đổi chỗ, nút "Bỏ"), chỉ khi ngoài giao chiến. Tuyệt kỹ cũng xếp vào ô như hồn kỹ thường, không có phím riêng.
- **Hồi chiêu theo ô của hồn sư**, nhưng server nhớ hồi chiêu còn lại của từng hồn kỹ: xếp lại ô thì hồi chiêu **đi theo hồn kỹ**; đổi võ hồn vào thì ô giữ hồi chiêu chung nhưng ít nhất bằng phần còn lại của hồn kỹ đó. Vì vậy đổi chỗ, bỏ ra rồi xếp lại không làm mới hồi chiêu.
- **Sức mạnh theo số năm hồn hoàn của đúng vòng đó:** `skillPower(năm)` nhân sát thương (nội suy log giữa các mốc `TIER_MULT`); hiệu ứng có lợi, hồi sinh lực, khiên, hồn lực tăng chậm hơn: `buffPower` (`BUFF_SCALE`). Thời gian khống chế không đổi theo năm. Sát thương theo % sinh lực tối đa mỗi nhát bị kẹp (`PCT_HP_CAP`) để boss không bị bào quá nhanh.
- Mỗi lần tung chỉ tạo năng lượng tiên cơ một lần dù nhiều nhát. Hồn kỹ phụ trợ không gây sát thương nên không tạo năng lượng.
- **Vùng tác dụng** (`SkillDef`): quanh thân, nửa trước mặt, lướt thẳng (trúng mọi mục tiêu trên đường), mục tiêu gần nhất (có thể lướt tới, nhiều nhát), bắn mũi (quạt hoặc vòng tròn), bản thân, vùng cố định (`at` đặt lên mục tiêu, `fixed` ở chỗ đứng; không đi theo hồn sư). Hồn kỹ cần mục tiêu mà không có hồn thú / đối thủ trong tầm thì không tung, không tốn hồn lực, không hồi chiêu.
- **Cơ chế hồn kỹ** dùng chung: nhiều nhát quanh thân (nhát cuối gây `finisher`); Viêm bạo (`boom`: kích nổ Thiêu đốt rồi đặt lại tầng; `boom.last` / `boom.mult` cho tuyệt kỹ Hỏa Long kích nổ ở đợt cuối); đẩy lùi (`push`), kéo về (`pull`); khóa mục tiêu yếu máu (`pick: "low"`) và thêm sát thương theo máu đã mất (`lowHp`); thêm sát thương theo tầng trạng thái trên mục tiêu (`perStack`); sét tìm mọi mục tiêu Cảm điện ngoài vùng (`shockR`); bay (`fly`, chỉ hình ảnh, bất tử ngắn bằng `inv`); hút máu (`lifesteal`); xóa hiệu ứng có lợi của hồn thú (`dispel`); thanh tẩy.
- **Phục Chế** (`SkillDef.copy`, Xúc Xích): tung lại **hồn kỹ gần nhất về thời gian** của một võ hồn khác còn trong đội mình (chưa gục) hoặc của đồng đội tổ đội cùng phòng đứng trong `COPY_R` pixel, tung trong `COPY_WINDOW` giây; dùng công của Xúc Xích và sức mạnh theo hồn hoàn của vòng Phục Chế (bản thường giảm hệ số, bản đại thành vòng 9 không giảm). Không chép tuyệt kỹ, hồn kỹ Chân Thân, tiên cơ, kỹ năng hồn cốt, hồn kỹ của võ hồn có Phục Chế. Không có gì để chép thì không tung, không tốn gì.
- **Võ Hồn Chân Thân** (vòng 7, phím R / nút "Chân Thân"): biến hình vài chục giây, chỉ số cộng thêm (`ChanThanDef`, × `buffPower` theo hồn hoàn vòng 7: công, giảm sát thương nhận, tốc độ, chí mạng, giảm tiêu hao, sinh lực tối đa; phần sinh lực tối đa tăng được hồi luôn), kèm một đòn biến hình lúc biến. Tốn hồn lực, **hồi chiêu riêng từng võ hồn**. Chân Thân **thuộc võ hồn**: đổi võ hồn (kể cả tự đổi khi gục), cả đội gục, đi cổng thì hết. Chặn như hồn kỹ (vùng an toàn, gục, hấp thụ, Choáng / Câm lặng). Không lưu DB. Hình: hồn sư phóng to (`CHAN_THAN_SCALE`), quầng sáng màu võ hồn (mục 5.11).
- **Hồn kỹ Chân Thân** (`ChanThanDef.skill`): trong lúc Chân Thân, ô P (`CHAN_THAN_SKILL_SLOT`) tung hồn kỹ Chân Thân riêng của võ hồn thay hồn kỹ đang mang ở ô P (kể cả khi ô trống); hết Chân Thân thì ô P trở lại. Tốn `CHAN_THAN_SKILL_COST` hồn lực, hồi chiêu riêng `CHAN_THAN_SKILL_CD` (`PlayerState.ctCd`; hồn kỹ ô P cũ vẫn hồi chiêu tiếp). Mạnh theo hồn hoàn vòng 7, cùng lối đánh với hồn kỹ vòng 9 của võ hồn đó; nhận ràng buộc Song Sinh Võ Hồn, không nhận sao, Phục Chế không chép. Nút P viền vàng, đổi tên và biểu tượng.
- **Tên hồn kỹ:** lấy theo truyện khi biết (Lam Ngân Bá Vương Thương, Hạo Thiên Cửu Tuyệt, Loạn Phi Phong Chùy Pháp, U Minh Bách Trảo, Vô Địch Thần Quang, Lôi Động Minh Thiên, Yêu Cung / Thuấn Di / Vô Địch Kim Thân / Bát Đoạn Suất / Mị Hoặc của Tiểu Vũ, Khôi Phục Đại Hương Tràng / Phục Chế Hương Tràng của Áo Tư Tạp…), còn lại đặt theo phong cách Đấu La. Không để hai hồn kỹ của cùng võ hồn trùng hoặc gần trùng tên (bản nhỏ ở vòng 3–4 mang tên khác tuyệt kỹ thật ở vòng 10). Chỉ đổi tên khi có tên truyện chắc chắn.

### 5.3 Thế giới nhiều bản đồ và hồn thú
Thế giới gồm nhiều bản đồ nối bằng **cổng**. Mỗi bản đồ là một file Tiled riêng (`shared/assets/<mapId>.json`, sinh bằng `tools/gen-map.mjs`) và một loại phòng trên server (mỗi phòng là một kênh, mục 6). Loại bản đồ (`MapDef.kind`):
- **Thành (`town`):** cả bản đồ an toàn, không hồn thú (Nặc Đinh Thành, Thiên Đấu Thành).
- **Bản đồ săn (`hunt`):** 3–4 vùng, càng sâu hồn thú càng già và mạnh; có thể chứa vùng an toàn `safe` (làng Thánh Hồn Thôn).
- **Bản đồ boss (`boss`):** Lõi Tinh Đấu, chỉ có boss thế giới.
- **Sân đấu (`arena`):** sân Đại Đấu Hồn Trường, chỉ `ArenaRoom` mở, không cổng nào dẫn tới.

**Danh sách bản đồ** (`MAPS`: cấp đề xuất `level`, khoảng niên hạn `years`, mảnh võ hồn `shards`, bộ hồn hạch `cores`, thú vương `king`). Tài khoản mới bắt đầu ở Thánh Hồn Thôn (`DEFAULT_MAP`).

| Bản đồ (`mapId`) | Loại | Đặc điểm | Nối với |
|---|---|---|---|
| Thánh Hồn Thôn (`thanh_hon_thon`) | Săn | Quê Đường Tam; làng giữa bản đồ là vùng `safe`; không có thú vương | Nặc Đinh Thành |
| Nặc Đinh Thành (`nac_dinh_thanh`) | Thành | Đại Sư, thương nhân, lò rèn | Thánh Hồn Thôn, Ngoại vi, Thiên Đấu Thành |
| Tinh Đấu Ngoại vi (`tinh_dau_ngoai_vi`) | Săn | Bìa Tinh Đấu Đại Sâm Lâm | Nặc Đinh Thành, Nội địa |
| Tinh Đấu Nội địa (`tinh_dau_noi_dia`) | Săn | Rừng sâu, đầm độc, thung lũng sấm | Ngoại vi, Lõi Tinh Đấu (bến bờ hồ cuối Hắc Ám Lâm) |
| Thiên Đấu Thành (`thien_dau_thanh`) | Thành | Thủ đô: Đại Đấu Hồn Trường, Sử Lai Khắc Học Viện, thương hội, lò rèn | Nặc Đinh Thành (cổng nam), Lạc Nhật (cổng tây), Cực Bắc (cổng bắc), Hải Thần Đảo (bến thuyền) |
| Lạc Nhật Sâm Lâm (`lac_nhat_sam_lam`) | Săn | Thực vật, độc, suối Băng Hỏa Lưỡng Nghi Nhãn; rơi tiên thảo | Thiên Đấu Thành |
| Cực Bắc Chi Địa (`cuc_bac_chi_dia`) | Săn | Băng tuyết; trại cổng ở mép nam, càng lên bắc càng sâu | Thiên Đấu Thành |
| Hải Thần Đảo / Ma Quỷ Hải Vực (`hai_than_dao`) | Săn | Đảo giữa biển; hồn thú biển; nơi duy nhất có hồn thú thường 10 vạn năm | Thiên Đấu Thành (bến thuyền) |
| Lõi Tinh Đấu (`loi_tinh_dau`) | Boss | Hồ trung tâm Tinh Đấu Đại Sâm Lâm, sàn đấu boss thế giới | Nội địa |
| Đại Đấu Hồn Trường (`dai_dau_hon_truong`) | Sân đấu | Sân nhỏ cho một trận 1v1 (`ARENA_MAP`) | – |

**Cổng và chặn mềm**
- Cổng là object `portal` trong Tiled: bản đồ đích, điểm xuất hiện `arrive` ở bản đồ đích, cấp đề xuất `level`. Điểm `arrive` phải nằm ngoài mọi vùng `portal` của bản đồ đích.
- Bước vào cổng thì hiện hộp "Đi tới *…* (đề xuất cấp …)"; cấp võ hồn ra trận dưới mức tối thiểu thì thêm **cảnh báo đỏ** nhưng vẫn đi được (**chặn mềm**). Cổng giữa hai thành không có cấp đề xuất.
- Đi cổng niệm `TRAVEL_CAST` giây; **bến thuyền** (cổng có thuộc tính `boat`, Thiên Đấu Thành ↔ Hải Thần Đảo) "đi thuyền" `BOAT_CAST` giây, hộp ghi "Đi thuyền tới …" và nút "Lên thuyền". Bị đánh hoặc bước ra khỏi cổng thì hủy. Đang niệm vẫn đánh được nhưng không bắt đầu hấp thụ được.
- Server kiểm tra: đang đứng trong cổng, cổng thuộc bản đồ hiện tại, bản đồ đích có trong `MAPS`, không gục, không hấp thụ. Client chỉ gửi tên cổng, **không bao giờ tự chọn bản đồ** hay tọa độ đích. Thứ tự lưu khi đi cổng ở mục 6.
- **Lõi Tinh Đấu:** đăng xuất ở đây (rời phòng không qua cổng / đổi kênh) thì lần sau vào ở bến bờ hồ Nội địa (`MapDef.exit`).
- Vị trí và bản đồ đang đứng được lưu; vào lại ở đúng chỗ cũ (kẹt trong ô chặn hoặc ngoài bản đồ thì về `spawn`). Mã bản đồ cũ đã bỏ ánh xạ qua `MAP_MOVED`.

**Quy cấp theo niên hạn**
- **Cấp tương đương** của hồn thú là cấp nhỏ nhất mà võ hồn hấp thụ được hồn hoàn của nó trong giới hạn (`beastLevel`, tính từ `RING_LIMIT`; vòng k hấp thụ ở cấp 10×k). Mỗi bản đồ săn nhắm khoảng cấp mà niên hạn hồn thú khớp giới hạn **vòng kế tiếp**, vùng sâu nhất vượt giới hạn một chút cho người muốn liều; khoảng cấp các bản đồ kế nhau chồng lên nhau.
- **Giảm kinh nghiệm khi săn hồn thú quá yếu** (`XP_LEVEL_STEPS`, `xpLevelScale`): so cấp võ hồn ra trận (tính tối đa `XP_LEVEL_CAP`, vì vòng 8–10 cùng giới hạn nên không hồn thú nào có cấp tương đương cao hơn) với cấp tương đương; thấp hơn càng nhiều thì kinh nghiệm càng ít. Giảm một lần trước khi chia cho đội võ hồn; tổ đội thì mỗi người tự giảm theo cấp của mình. **Chỉ giảm kinh nghiệm**, đồ vẫn rơi bình thường. Hồn thú mạnh hơn không cho thêm kinh nghiệm.

**Vùng và hồn thú của từng bản đồ săn**

Vùng là object `zone` trong Tiled: loài (`beasts`, kèm trọng số), niên hạn (`years`), số con (`count`), gợi ý (`hint`). Mỗi vùng săn có đúng 1 tinh anh (object `elite`, mã trong `BOSSES`); mỗi bản đồ săn trừ Thánh Hồn Thôn có 1 tà hóa thú vương trong hang (object `boss`) ở vùng sâu nhất. Tên hồn thú chưa có trong truyện được đặt theo phong cách Đấu La.

| Bản đồ | Vùng (nông → sâu) | Tà hóa thú vương |
|---|---|---|
| Thánh Hồn Thôn | Đồng lúa ven làng, Bãi tập hồn sư, Hậu Sơn | – |
| Tinh Đấu Ngoại vi | Bìa rừng, Rừng thưa, Khe suối, Rìa nội địa | Huyết Nguyệt Lang Vương (gọi bầy sói; GĐ2 Huyết Cuồng: đánh dấu một người rồi lao xuyên) |
| Tinh Đấu Nội địa | Rừng cổ thụ, Đầm sương độc, Lôi Cốc, Hắc Ám Lâm | Thiên Độc Chu Hoàng (lưới tơ Trói, mưa kim độc; GĐ2 Vạn Chu Phệ: gọi nhện con, dải tơ rộng) |
| Lạc Nhật Sâm Lâm | Rừng hoa độc, Đầm Bích Lân, Băng Hỏa Tuyền, Lưỡng Nghi Nhãn | Lưỡng Nghi Thủ Hộ Xà (hơi thở băng / lửa; GĐ2 Lưỡng Nghi: dải băng gây Choáng, dải lửa gây Thiêu đốt) |
| Cực Bắc Chi Địa | Tuyết nguyên, Băng hà nứt, Băng Phong Cốc, Cực Bắc Băng Uyên | Huyền Minh Băng Giao (vệt băng cắt ngang hang, mưa băng; GĐ2 Cực Hàn: bão băng làm chậm, đánh dấu một người rồi đóng băng) |
| Hải Thần Đảo | Bãi san hô, Ma Quỷ Hải Vực, Vách Hải Thần, Hải Thần Uyên | Thâm Hải Ma Kình Vương (gầm Choáng, hút người về giữa; GĐ2: dải thủy triều làm chậm, xoáy nước kéo người) |

- Tinh anh, thú vương, boss thế giới không có loài riêng thì **mượn loài gốc** trong `BEASTS` (chỉ số, sprite, hồn cốt).
- Lõi Tinh Đấu có một vùng "Hồ trung tâm" không sinh hồn thú thường.

**Lạc Nhật Sâm Lâm:** nơi duy nhất rơi **tiên thảo** (mục 5.7). Mỗi con hồn thú hạ ở đây có tỉ lệ theo **tên vùng** (`MapDef.herbs`, vùng càng sâu càng cao), tinh anh nhân `HERB_ELITE`, thú vương không rơi (chỉ có rương). Một cây ngẫu nhiên trong 3 loại vào thẳng túi người hạ.

**Hồn thú 10 vạn năm:** mỗi kênh của một bản đồ có tối đa 1 hồn thú **thường** đúng `MAX_YEARS` năm cùng lúc; chỉ vùng có mức trên `years` = `MAX_YEARS` (Hải Thần Uyên) sinh được, mỗi lần sinh có `RED_BEAST_CHANCE` ra đúng 10 vạn năm nếu kênh chưa có con nào. Tinh anh, thú vương, boss thế giới và hồn thú do chúng gọi ra không tính.

**Rơi đặc trưng theo bản đồ**
- Mỗi bản đồ săn rơi mảnh của 2–4 võ hồn riêng (`MapDef.shards`, mỗi lần chọn đều một võ hồn trong danh sách) và hồn hạch phần lớn thuộc bộ đặc trưng (`MapDef.cores`, `CORE_MAP_SET`).
- **Rương tà hóa thú vương** (`KING_CHEST`, `kingShardPool`): mảnh của bản đồ đó (trọng số cao nhất) hoặc Tà Hỏa Phượng Hoàng; một hồn hạch sao cao nhất theo niên hạn thú vương, bộ theo bản đồ; có thể có hồn cốt loài gốc. Danh sách `every` (võ hồn chỉ có ở rương) để trống, giữ cơ chế cho võ hồn sau.
- **Mảnh UR trước BĐ6:** rương thú vương từng rơi 1 mảnh UR (Hạo Thiên Chùy hoặc Cửu Bảo Lưu Ly Tháp, 5%) để hai võ hồn UR không bị khóa hẳn. Từ BĐ6 mảnh UR chỉ có trong rương boss thế giới (`WORLD_CHEST`); rương thú vương không rơi mảnh UR (`KING_CHEST.ur` = 0).
- Thưởng thắng Đại Đấu Hồn Trường có mảnh mọi võ hồn SR / SSR trừ Lam Ngân Thảo (`ARENA_SHARDS`).

**Luật chung của hồn thú**
- **Chỉ số hồn thú tăng theo số năm** (`beastStats`), không nhảy theo màu. Loài (`BEASTS`, mã cố định dùng cho sprite `beast_{id}`) quyết định kiểu tấn công, chiêu và hệ số chỉ số; kích thước, tốc độ và Hồn Tệ rơi (`BEAST_COIN`) theo bậc màu.
- Phát hiện người trong `BEAST_AGGRO_R`, lang thang quanh chỗ sinh (`BEAST_WANDER`). Quanh trại cổng, mọi cổng và điểm `arrive` không sinh hồn thú (`SPAWN_CLEAR`, mục 5.8).
- **Chiêu có báo trước** (`BEAST_SKILLS`, chọn theo loài và năm bằng `beastSkillOf`): hồn thú thường **từ `BEAST_SKILL_YEARS` năm** có 1 chiêu theo loài; dưới mức đó chỉ đánh thường. Có mục tiêu `TELE_FIRST` giây thì tung khi mục tiêu trong tầm, rồi hồi chiêu (dao động để bầy không tung cùng lúc). Hồn thú đứng yên `TELE_WARN` giây, hiện vùng đỏ đầy dần (hình **vệt**, **nón** hoặc **vòng** quanh thân / dưới chân mục tiêu; hướng và tâm khóa lúc bắt đầu); hết giờ mới tính trúng theo **vị trí thật** lúc đó: chạy ra khỏi vùng là né được. Không trúng người trong vùng an toàn, đang đi cổng, đã gục. Chiêu "lao" thì hồn thú lao tới cuối vệt / tâm vòng. Sát thương là bội số đòn thường của hồn thú; chiêu có thể gây trạng thái lên hồn sư.
- Chiêu tinh anh / thú vương dùng cùng bộ máy, thêm: nhiều vùng một lần tung (`count` / `spread` / `step`), vòng rơi ngẫu nhiên quanh mục tiêu (`scatter`), gọi bầy (`summon`), kéo người (`pull`), đánh dấu một người tham gia (`mark`), nhắm người ít máu nhất (`weak`), hút máu từ người đang bị Trói (`drain`), chiêu toàn sàn (`floor`). Chiêu "nhiều nhát nối tiếp" tung các vùng cùng lúc hoặc gộp bội số.
- **Rơi đồ dựa vào farm:** mỗi lần hạ hồn thú, mỗi loại đồ tung tỉ lệ riêng theo niên hạn: hồn hoàn luôn rơi; mảnh võ hồn `SHARD_DROP`; hồn cốt `BONE_DROP`; hồn hạch `CORE_DROP` (kèm khoảng sao). Hồn thú càng già tỉ lệ càng cao; tinh anh và boss có hệ số riêng (mục 5.4).

### 5.4 Bậc hồn thú: thường, tinh anh, thú vương, boss thế giới
Mỗi hồn thú thuộc 1 trong 4 bậc (`BeastState.rank` 0–3). Hệ số nhân vào chỉ số của hồn thú thường cùng loài, cùng niên hạn.

| | Thường | Tinh anh (biến dị) | Tà hóa thú vương | Boss thế giới |
|---|---|---|---|---|
| Hệ số | – | `ELITE` | `BossDef.hp` theo bản đồ, `KING` | `WORLD` |
| Máu tăng theo số người | Không | Có | Có | Có |
| Số lượng | Theo `count` của vùng | 1 con mỗi vùng săn | 1 con mỗi bản đồ săn (trừ Thánh Hồn Thôn), mỗi kênh một con | 1 con mỗi kênh của Lõi Tinh Đấu |
| Xuất hiện | Hồi sinh liên tục | Hồi sinh ngẫu nhiên sau khi bị hạ (`ELITE.respawn`) | Theo lịch `KING_TIMES` | 1 lần/ngày lúc `WORLD_TIME`, hai boss luân phiên theo ngày |
| Chiêu báo trước | 1 chiêu (từ ngàn năm) | 2 chiêu | 2 chiêu + chiêu giai đoạn 2 | Chiêu thường + cơ chế riêng, nổi giận |
| Thưởng | Bảng rơi mục 5.3 | Hồn cốt tỉ lệ cao hơn, chắc chắn 1 hồn hạch | Rương theo đóng góp | Hồn hoàn đỏ / đen và rương theo đóng góp |
| Giới hạn nhận thưởng | – | – | `KING.daily` lần/ngày | `WORLD.daily` lần/ngày |

**Nhận diện:** tinh anh có tên "Tinh anh …" màu riêng, aura, sprite loài gốc phóng `ELITE.scale`, chấm sáng trên bản đồ nhỏ; thú vương và boss thế giới phóng `KING.scale` / `WORLD.scale`, thanh máu lớn ở đầu màn hình, bảng xếp hạng đóng góp, chấm đỏ lớn và khung hang / sàn trên bản đồ nhỏ.

**Tinh anh (biến dị)**
- Niên hạn bằng mức trên của vùng; sinh ở điểm ngẫu nhiên trong chữ nhật `elite` (không trong vùng an toàn, không trong `SPAWN_CLEAR`, không sát người chơi), không tính vào `count`. Bị hạ / hồi sinh thì cả bản đồ được báo.
- Bán kính giao chiến `ELITE.radius`; máu theo số người tham gia (dưới). Tinh anh đang giao chiến không tự hồi máu.
- **Cuồng nộ** (`ELITE_RAGE`, hiệu ứng có lợi của hồn thú `BEAST_BUFFS`): máu dưới ngưỡng thì nổi một lúc (sát thương và tốc độ tăng); hết giờ hoặc bị xóa (hồn kỹ có `dispel`, ví dụ Thiên Càn Trấn Áp) thì phải chờ mới nổi lại.
- Thưởng: hồn hoàn, hồn cốt ưu tiên **người đóng góp nhiều nhất** còn trong phòng (không thì người hạ); tỉ lệ hồn cốt × `ELITE.bone` (hồn cốt mang loài gốc); **chắc chắn rơi 1 hồn hạch** (sao theo niên hạn, bộ theo bản đồ); kinh nghiệm × `ELITE.xp` cho người hạ (chia tổ đội như hồn thú thường).

**Tà hóa thú vương (boss bản đồ)**
- Ở trong **hang** (object `boss`, cũng là bán kính giao chiến), không ra khỏi hang, không bị đẩy lùi, đuổi bất kỳ ai trong hang. Niên hạn bằng mức trên của bản đồ (hoặc `BossDef.years`, `kingYears`).
- **Theo lịch** `KING_TIMES` giờ Việt Nam; **cả server** được báo trước `KING.warnSecs` giây (đếm ngược trên màn hình, người vào sau vẫn thấy thời gian còn lại) và lúc xuất hiện. Không ai hạ trong `KING.lifeSecs` giây thì rút đi (báo toàn server).
- **Giai đoạn 2** khi còn `KING.phaseHp` máu: gầm (đứng yên, mất và không nhận khống chế), rồi thêm chiêu giai đoạn 2 (`BossDef.phase2`) và nhanh hơn.
- **Chia thưởng theo đóng góp.** Đóng góp = sát thương + hồi máu / khiên thực cho người tham gia khác (× `SUPPORT_CONTRIB`; tự hồi cho mình không tính). Mọi người đóng góp còn trong phòng nhận kinh nghiệm × `KING.xp`; người nhiều nhất được ưu tiên hồn hoàn; người hạ nhận Hồn Tệ; ai đóng góp **từ `KING.share`** và còn trong phòng nhận **rương** vào túi (túi đầy vẫn vào, ô tạm vượt mức). Hồn cốt và mảnh chỉ nằm trong rương.
- Tối đa `KING.daily` rương mỗi ngày mỗi tài khoản, chung mọi bản đồ; mỗi khung giờ chỉ một rương dù hạ ở kênh nào. Hết lượt vẫn đánh và nhận kinh nghiệm, có nhắc khi vào giao chiến.
- **Mở rương** trong túi (cần `KING_CHEST.slots` ô trống): nội dung ở mục 5.3 "Rơi đặc trưng".

**Máu tăng theo số người tham gia** (tinh anh, thú vương, boss thế giới)

> Máu tối đa = máu gốc × hệ số bậc × `bossHpMult(N)` = × (1 + `BOSS_HP_PER_PLAYER` × (N − 1)), N là số người tham gia. Không có trần N.

- **Người tham gia** là hồn sư trong phòng và: đứng trong bán kính giao chiến lúc boss bắt đầu giao chiến (lần đầu bị đánh), hoặc sau đó gây sát thương lên boss / hồi máu, tạo khiên cho một người tham gia khác. Người đang gục vẫn được tính.
- **Vào giữa trận:** N tăng ngay, máu tối đa tính lại và **máu hiện tại giữ nguyên tỉ lệ** (vào phút cuối không làm boss dễ hơn).
- **Rời giữa trận:** rời phòng hoặc ở ngoài bán kính `outSecs` giây liên tục thì bị loại; N giảm tối đa 1 mỗi `dropEvery` giây, máu giữ tỉ lệ. Người bị loại giữ đóng góp đã gây nhưng phải còn trong phòng lúc boss bị hạ mới nhận thưởng. Hệ số đã giảm không làm boss hồi máu.
- **Bỏ giao chiến:** `idleSecs` giây không còn người tham gia trong bán kính thì boss về chỗ, hồi đầy, xóa danh sách và đóng góp.
- Đóng góp tính theo phiên (sessionId): thoát rồi vào lại, hoặc đổi kênh, thì đóng góp cũ không còn.

**Boss thế giới 100.000 năm**
- Ở **Lõi Tinh Đấu**, sàn đấu bên hồ trung tâm (object `boss` phủ sàn). *Thái Thản Cự Viên* và *Thiên Thanh Ngưu Mãng* **luân phiên theo ngày** (`worldBossOn`, để biết trước hôm nay đánh con nào), xuất hiện `WORLD_TIME` giờ Việt Nam; báo toàn server trước và lúc xuất hiện.
- Sau `WORLD.enrageSecs` giây thì **nổi giận** (sát thương, tốc độ, hồi chiêu mạnh hơn; chiêu toàn sàn mỗi 15 giây: *Bạo Nộ* `WORLD_SLAM`, chu kỳ `WORLD.slamEvery`, không né được). Hết `WORLD.lifeSecs` mà chưa hạ thì **lặn xuống hồ**, không ai nhận thưởng.
- **Không nhận khống chế** (Choáng, Trói, Câm lặng, Mê hoặc; Mị hoặc đủ tầng không thành Mê hoặc); Làm chậm và trạng thái sát thương (Thiêu đốt, Trúng độc, Phá giáp, Dễ thương…) vẫn nhận.
- **Cơ chế buộc đổi võ hồn đúng lúc** (cần đội 4 võ hồn):
  - **Điểm yếu hệ:** mỗi mốc máu `WORLD.weakAt` lộ một hệ ngẫu nhiên một lúc: võ hồn ra trận đúng hệ gây × `weakMult`, hệ khác × `offMult`. Thanh máu lớn báo võ hồn mình có đúng hệ không.
  - *Thái Thản Cự Viên:* **Bá Thể** (khiên theo % máu tối đa trong một lúc; võ hồn Cường công phá nhanh hơn; phần đánh vào khiên vẫn tính đóng góp; không phá kịp thì boss hồi máu bằng phần khiên còn lại), **Đại Địa Chấn** (tích lực; chỉ khống chế của võ hồn **Khống chế** đang ra trận mới tính lần ngắt, cần đủ số lần; ngắt được thì boss bị Choáng; không ngắt thì cả sàn dính *Vết thương sâu*: Phá giáp nặng, lâu và Choáng ngắn), cùng Cự Thạch, Địa Liệt Quyền.
  - *Thiên Thanh Ngưu Mãng:* **Thanh Lân Độc Vụ** (độc toàn sàn có báo trước: Trúng độc nặng, lâu), **Du Thủy** (lặn, không nhận sát thương, nổi lên chỗ khác trong sàn, lộ điểm yếu **Mẫn công**), cùng Ngưu Giác Xung, Mãng Vĩ Tảo.
  - *Vết thương sâu* là trạng thái thường (Phá giáp / Trúng độc) nhưng nặng và lâu; Lõi không có vùng an toàn nên chỉ **thanh tẩy** của võ hồn phụ trợ giải được.
- **Thưởng** (đóng góp từ `WORLD.share`, còn trong phòng, `WORLD.daily` lần/ngày, lượt riêng với thú vương, mỗi khung một lần dù hạ ở kênh nào): người gây **sát thương** nhiều nhất trong kênh đó nhận **hồn hoàn đỏ**; những người khác có tỉ lệ nhận hồn hoàn đỏ, còn lại hồn hoàn đen (`WORLD_RING`); hồn hoàn vào thẳng túi cùng **rương** (`WORLD_CHEST`: mảnh UR, hồn hạch sao cao bộ bất kỳ, có thể có hồn cốt 10 vạn năm của loài boss) trong cùng transaction tăng lượt. Mọi người đóng góp nhận kinh nghiệm × `WORLD.xp`; người hạ nhận Hồn Tệ.
- Màn hình: thanh máu lớn (đồng hồ nổi giận, thời gian còn lại, khiên, điểm yếu hệ, số lần ngắt tích lực, đang lặn), bảng xếp hạng, banner từng cơ chế.

### 5.5 Hồn cốt
- **6 vị trí trên mỗi võ hồn** (`BONE_SLOTS`): đầu, thân, tay trái, tay phải, chân trái, chân phải. Đầu và hai tay cho kỹ năng **chủ động**, thân và hai chân cho kỹ năng **bị động**.
- **Rơi:** theo `BONE_DROP` (mục 5.3); hồn cốt **cùng loài, cùng số năm** với hồn thú, vị trí ngẫu nhiên đều. Rơi xuống đất cạnh hồn hoàn, cùng luật nhặt (mục 4). Trong túi mỗi hồn cốt một ô, tên kiểu *+5 Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm*, màu theo niên hạn.
- **Chỉ số gốc** (`boneStats`): niên hạn càng cao thì chỉ số gốc càng mạnh; một chỉ số chính theo vị trí (đầu hồn lực, thân và chân sinh lực, tay công), tỉ lệ với mức cộng của hồn hoàn cùng số năm; tính lại từ số năm khi cần (không lưu DB). Cộng phẳng vào võ hồn đang gắn (`boneBonus`), áp ngay cả khi đang ra trận.
- **Gắn** (mục "Hồn cốt" của bảng đội hình hoặc nút "Gắn…" ở túi; chuột kéo thả được): chỉ vào ô cùng vị trí; ô đã có thì đổi chỗ, món cũ về túi; tháo về túi khi túi đầy bị từ chối. Chỉ khi ngoài giao chiến (mục 4). Hồn cốt đang gắn không chiếm ô túi, không bỏ / bán được, **không bao giờ mất** khi gục hay thua; muốn chuyển sang võ hồn khác thì tháo trước.
- **Kỹ năng** (`BONE_SKILLS`): theo **loài hồn thú gốc**, mỗi loài 1 kỹ năng chủ động (dùng chung cho đầu, hai tay; thường lấy từ chiêu báo trước của chính loài đó) và 1 bị động (dùng chung cho thân, hai chân; theo đặc tính con vật). Thêm loài vào `BEASTS` thì thêm mục ở đây.
  - **Chủ động:** phím Z / X / C (đầu, tay trái, tay phải; trên điện thoại 3 nút nhỏ bên trái thanh hồn kỹ). Chạy bằng bộ máy hồn kỹ, mạnh theo số năm hồn cốt (`skillPower` / `buffPower`), tốn hồn lực, mỗi nút một hồi chiêu riêng **thuộc hồn sư** (đổi võ hồn không làm mới, để không xả kỹ năng bằng đổi tay). Chỉ võ hồn đang ra trận dùng kỹ năng của hồn cốt gắn trên nó. Bị chặn như hồn kỹ.
  - **Bị động:** cộng thường trực tốc chạy, công, chí mạng, giảm sát thương nhận, giảm tiêu hao, hút máu hoặc kháng một trạng thái (thời gian ngắn đi), × `buffPower` theo số năm; nhiều hồn cốt cộng dồn tới trần `BONE_PASSIVE_CAP`. Áp ngay khi gắn trên võ hồn ra trận, mất khi tháo hoặc đổi võ hồn.
- **Cường hóa** (nút "Cường hóa…" ở túi đồ / ô hồn cốt đang gắn, hoặc Thợ rèn; miễn phí, ở đâu cũng được, chỉ khi ngoài giao chiến): chọn hồn cốt đích và tối đa `BONE_FEED_MAX` hồn cốt trong túi làm **nguyên liệu**. Điểm mỗi nguyên liệu tỉ lệ với niên hạn (`BONE_FEED_PER_YEAR`), **cùng vị trí được thêm 50%** (`BONE_FEED_SAME_SLOT`), cộng một phần điểm đã nạp vào nguyên liệu (`BONE_FEED_CARRY`) (`boneFeedXp`). Điểm cộng dồn lên cấp +0 … +`BONE_MAX_ENHANCE` theo `BONE_ENHANCE_COST`; điểm vượt cấp tối đa bị bỏ (bảng xem trước báo trước).
  - Mỗi cấp tăng chỉ số chính theo % chỉ số gốc (`BONE_ENHANCE_STAT`); các mốc `BONE_ENHANCE_MILESTONES` (+5, +10, +15, +20) mở thêm một dòng chỉ số phụ hoặc nâng kỹ năng. Đã chốt **nâng kỹ năng** của hồn cốt (`boneSkillMult`: chủ động là sức mạnh và hiệu ứng lên bản thân, bị động là mức cộng, vẫn kẹp trần); dòng chỉ số phụ ngẫu nhiên để sau.
  - **Nguyên liệu bị tiêu hao, không bao giờ thất bại.** Bảng xem trước điểm, cấp sẽ đạt, chỉ số trước / sau, mốc kỹ năng; nút xác nhận đỏ ghi số hồn cốt sẽ mất. Đang gắn thì đổi ngay; tháo ra vẫn giữ cấp và điểm. Ô có "+N" ở góc.
- **Lưu:** mỗi hồn cốt một dòng `items` (`kind` = `code` = `hon_cot`, `years`, `stats` = `{beast, slot, xp}`, `enhance` = cấp, `vohon_id` = võ hồn đang gắn hoặc NULL).

### 5.6 Hồn hạch
- **6 ô trên mỗi võ hồn** (`CORE_SLOTS`), **ô nào cũng nhận mọi hồn hạch**. Mỗi hồn hạch có **sao 1–6** (`MAX_CORE_STARS`), thuộc một **bộ** (`CORE_SETS`), có 1 chỉ số chính (theo sao) và số dòng phụ ngẫu nhiên theo sao (`CORE_SUBS`, tối đa `CORE_MAX_SUBS`; không trùng nhau và không trùng chỉ số chính; mỗi dòng tung trong `CORE_SUB_ROLL` mức tối đa của sao). Chỉ số và mức ở `CORE_STATS`, `CORE_STAR_K`, `coreMainValue`, `coreSubMax`.
- **Rơi:** theo `CORE_DROP` (khoảng sao theo niên hạn, sao thấp hay ra hơn: `CORE_STAR_W`); bộ phần lớn theo bản đồ (`CORE_MAP_SET`), còn lại bộ bất kỳ. Tinh anh chắc chắn rơi 1 hồn hạch. Rơi đất cùng luật nhặt (mục 4). Trong túi biểu tượng viên hạch màu bộ, sao ở góc, tên kiểu *+6 Hồn hạch Hạo Thiên 4★*; chi tiết ô ghi bộ, chỉ số chính, dòng phụ, hiệu ứng bộ.
- **Gắn** (mục "Hồn hạch" của bảng đội hình hoặc nút "Gắn…" ở túi; kéo thả, kéo giữa hai ô thì đổi chỗ): không chọn ô thì vào ô trống đầu tiên; đủ 6 ô mà không chọn ô thì từ chối. Cùng luật ngoài giao chiến, không chiếm ô túi, không bao giờ mất như hồn cốt.
- **Chỉ số:** dòng % (sinh lực / công / hồn lực) nhân phần gốc của võ hồn, dòng phẳng cộng thẳng, tỉ lệ / sát thương chí mạng cộng vào `CRIT` (`coreBonus`). Võ hồn không ra trận cũng có sinh lực tối đa theo hồn hạch của nó.
- **Hiệu ứng bộ** (`CORE_SET_FX`, `CORE_FX_RULE`, `coreFx`): 2 món cùng bộ nhận hiệu ứng 2 món, 4 món nhận thêm hiệu ứng 4 món (ghép 4 + 2 hoặc 2 + 2 + 2). Chỉ tính trên võ hồn **đang ra trận**, chỉ lên hồn thú và chính hồn sư (không lan tổ đội, không áp lên đối thủ ở đấu trường); riêng Tiên Cơ 2 món tính trên võ hồn mang bộ khi ở ngoài sân.

| Bộ | 2 món | 4 món |
|---|---|---|
| Phượng Hoàng (Thiêu đốt) | Thiêu đốt do hồn sư gây mạnh hơn | Thiêu đốt của hồn sư thêm 1 tầng tối đa; Viêm bạo mạnh hơn |
| Bá Vương Long (Cảm điện) | Sát thương lan Cảm điện mạnh hơn | Đòn trực tiếp trúng hồn thú Cảm điện hồi hồn lực (có hồi chiêu) |
| Xà Hoàng (Trúng độc) | Trúng độc do hồn sư gây mạnh hơn | Hồn thú Trúng độc đủ nhiều tầng (người gây cuối mang bộ) nhận thêm sát thương từ mọi nguồn |
| Hạo Thiên (Chấn đãng) | Công (vào chỉ số) | Đòn đánh thường **trúng** thứ 3 liên tiếp (cách nhau không quá vài giây) gây thêm sát thương, chữ "Hạo Thiên liên kích!" |
| Thất Sát (Phá giáp) | "Xuyên thủ": thêm sát thương đòn trực tiếp (hồn thú chưa có thủ) | Thêm tỉ lệ chí mạng lên hồn thú đang Phá giáp |
| Linh Miêu (Mẫn công) | Tỉ lệ chí mạng (vào chỉ số) | Chí mạng thì tăng tốc độ đánh thường một lúc |
| Lam Ngân (Khống chế) | Khống chế do hồn sư gây lên hồn thú dài hơn | Hồn kỹ có khống chế trúng ít nhất một hồn thú thì hồi hồn lực (một lần mỗi lần tung) |
| Lưu Ly (Phụ trợ) | Hồi máu và khiên mạnh hơn | Đổi tay võ hồn mang bộ vào thì cả đội tăng công một lúc (hiệu ứng có lợi của hồn sư) |
| Tiên Cơ | Võ hồn mang bộ tích năng lượng tiên cơ nhanh hơn (`TIEN_CO_SET`) | Tiên cơ của võ hồn mang bộ mạnh hơn |

- **Nâng cấp** (nút "Nâng cấp…" ở túi / ô hồn hạch đang gắn, hoặc Thợ rèn "Nâng cấp hồn hạch"; miễn phí, ở đâu cũng được, chỉ khi ngoài giao chiến): tối đa `CORE_FEED_MAX` hồn hạch trong túi làm nguyên liệu. Điểm theo sao (`CORE_FEED_STAR`), cùng bộ được thêm (`CORE_FEED_SAME_SET`), cộng một phần điểm đã nạp (`CORE_FEED_CARRY`). Cấp +0 … +`CORE_MAX_ENHANCE` theo `CORE_ENHANCE_COST` (**một bảng ngưỡng cho mọi sao**: sao thấp nên làm nguyên liệu).
  - Mỗi cấp tăng chỉ số chính (`CORE_ENHANCE_MAIN`); **mỗi `CORE_SUB_EVERY` cấp tăng 1 dòng phụ ngẫu nhiên**: chưa đủ dòng thì thêm dòng mới, đủ rồi thì một dòng có sẵn cộng thêm một lần tung (`coreUpgradeSubs`, tung ở server).
  - Nguyên liệu bị tiêu hao, không bao giờ thất bại; bảng xem trước, nút xác nhận đỏ, banner ghi dòng phụ vừa thêm / tăng. Tháo ra vẫn giữ cấp, điểm, dòng phụ.
- **Lưu:** mỗi hồn hạch một dòng `items` (`kind` = `code` = `hon_hach`, `stars`, `enhance`, `stats` = `{set, main, subs, slot, xp}`, `years` NULL, `vohon_id`). Chỉ số chính tính lại từ sao và cấp; dòng phụ lưu giá trị.

### 5.7 Túi đồ, vật phẩm và tiền
- **Túi đồ** chứa hồn hoàn, hồn cốt, hồn hạch, mảnh võ hồn, đan, tiên thảo, rương; chỉ chính chủ thấy (B / nút "Túi đồ"). Khởi đầu `BAG_SLOTS` ô, mở rộng ở thương nhân tới `BAG_MAX_SLOTS`. Vật phẩm cùng loại gộp theo `ItemDef.stack`; hồn hoàn, hồn cốt, hồn hạch mỗi món một ô. Bỏ được vật phẩm để nhường chỗ (nút "Bỏ").
- **Hồn Tệ** (đồng / ngân / kim: `HON_TE_NGAN`, `HON_TE_KIM`): lưu một số nguyên (đồng), chỉ quy đổi khi hiển thị. Rơi khi hạ hồn thú (`BEAST_COIN` theo bậc, người hạ nhận thẳng), bán đồ dư, thưởng nhiệm vụ / đấu trường; tiêu khi mua đan và mở rộng túi.
- **Đan** (`ITEMS`): Hồi Huyết Đan / Hồi Hồn Đan và bản lớn Đại Hồi Huyết Đan / Đại Hồi Hồn Đan hồi % sinh lực võ hồn ra trận / hồn lực, chung hồi chiêu `DAN_CD`, dùng được khi giao chiến; đã đầy thì không cho dùng. Mỗi tài khoản nhận quà khởi đầu một lần (`STARTER_ITEMS`).
- **Tiên thảo** (`HERBS`): Ỷ La Uất Kim Hương (sinh lực), Bát Giác Huyền Băng Thảo (hồn lực), Liệt Hỏa Hạnh Kiều Sơ (công); chỉ rơi ở Lạc Nhật Sâm Lâm (mục 5.3). Trong túi bấm **"Dùng cho…"**, chọn một võ hồn sở hữu: võ hồn đó cộng % chỉ số gốc vĩnh viễn (`HERB_PCT`), tối đa `HERB_MAX` cây mỗi loại mỗi võ hồn (đủ thì từ chối, không mất cây). Dùng được khi giao chiến, không dùng khi đang đi cổng và trong sân đấu. Thương nhân không mua bán tiên thảo.
- **Rương** thú vương / boss thế giới: mở trong túi (cần đủ ô trống), mục 5.3 và 5.4.
- **Thương nhân** (Nặc Đinh Thành, Thiên Đấu Thành; cùng bảng hàng): bán đan (`SHOP`; mua 1 / 5 / 10, mỗi lần tối đa `SHOP_MAX_QTY`); thiếu Hồn Tệ hoặc túi không đủ chỗ cho **cả** số món thì từ chối hết, không trừ tiền.
  - **Mua lại đồ dư** (`sellPrice`): hồn hoàn theo số năm (`RING_SELL`, nội suy theo log), hồn cốt gấp `BONE_SELL` lần hồn hoàn cùng số năm và đắt hơn theo cấp cường hóa (`BONE_SELL_ENH`), hồn hạch theo sao (`CORE_SELL`), mảnh theo độ hiếm (`SHARD_SELL`, bán 1 hoặc cả chồng). **Không mua** đồ đang gắn, hồn hoàn đang hấp thụ, đan dược, rương. Món giá cao hoặc đã cường hóa phải bấm "Bán" hai lần.
  - **Mở rộng túi** (dịch vụ, có hiệu lực ngay): +`BAG_EXPAND` ô mỗi lần tới `BAG_MAX_SLOTS`, giá tăng dần (`BAG_EXPAND_COST`), bấm hai lần. Số ô chỉ tăng.
  - **Mua lại đồ đã bán:** giữ `BUYBACK_MAX` món bán gần nhất của mỗi tài khoản (bản sao đúng món, mới nhất trước), mua lại đúng giá đã nhận, cần đủ Hồn Tệ và chỗ trống. Giữ ở RAM mức tiến trình: còn khi đi cổng / đổi kênh / vào sân đấu, mất khi rời game. Chung cho mọi thương nhân.
  - Giao dịch ghi DB qua chuỗi lưu, túi và Hồn Tệ trong một transaction.
- **Không có giao dịch giữa người chơi.**

### 5.8 Địa điểm và NPC
Thành và làng Thánh Hồn Thôn là nơi an toàn (mục 4). Mỗi bản đồ săn có **trại nhỏ ở cổng vào** (object `spawn`) làm điểm hồi sinh; trại cổng **không phải vùng an toàn** (vẫn giao chiến được), nhưng trong `SPAWN_CLEAR` pixel quanh trại, quanh mọi cổng và điểm `arrive` không sinh hồn thú (lớn hơn tầm lang thang + tầm phát hiện), để người vừa tới / vừa hồi sinh / đang niệm cổng không bị đánh.

- **Thánh Hồn Thôn:** **Tố Vân Đào** (chấp sự Vũ Hồn Điện; lễ thức tỉnh chạy qua `POST /api/awaken` trước khi vào phòng, trong làng là NPC giải thích võ hồn, bình cảnh, đội hình), **Lão Kiệt Khắc** (trưởng thôn, chỉ đường bãi săn và cổng đi Nặc Đinh Thành).
- **Nặc Đinh Thành:** **Ngọc Tiểu Cương (Đại Sư)** ở Học viện Nặc Đinh (giải thích giới hạn hồn hoàn theo vòng, cấp đề xuất từng bản đồ; giao nhiệm vụ tân thủ), **Thương nhân**, **Thợ rèn** (bảng cường hóa hồn cốt và nâng cấp hồn hạch), **Sứ giả Đại Đấu Hồn Trường** (chỉ đường lên Thiên Đấu Thành), cổng bắc đi Thiên Đấu Thành.
- **Thiên Đấu Thành** (thủ đô, tường thành, sông phía đông, quảng trường đài phun nước là điểm hồi sinh): biển **Đại Đấu Hồn Trường** trước cửa đấu trường ở góc đông nam (vai trò `arena`, mục 5.9), **Phất Lan Đức** (viện trưởng Sử Lai Khắc Học Viện; hiện chỉ có lời thoại), **Chưởng quỹ · Thương hội Thiên Đấu** và **Thợ rèn Thiên Đấu** (cùng cửa hàng / lò rèn như Nặc Đinh), Hoàng cung (trang trí). Cổng nam về Nặc Đinh Thành, cổng tây đi Lạc Nhật Sâm Lâm, cổng bắc đi Cực Bắc Chi Địa, bến thuyền đi Hải Thần Đảo.
- **Luật NPC:** NPC là object `npc` trong Tiled, thuộc tính `npc` là mã trong `NPCS` (tên, chức danh, vai trò `talk` / `shop` / `forge` / `arena`, ngoại hình, lời thoại; mã lạ hoặc trùng thì server cảnh báo và bỏ). Vẽ bằng sprite hồn sư đứng yên, tên và chức danh trên đầu. Đứng trong `NPC_RANGE` thì hiện "Nói chuyện [F]"; bấm F, bấm / chạm NPC hoặc nút để mở hộp thoại (lời thoại từng câu "Tiếp ›", đi xa thì tự đóng, Esc đóng). Server kiểm tra khoảng cách mỗi lần (`talk`, `buy`, `sell`, `quest`, `arena`…).

**Nhiệm vụ tân thủ** (`QUESTS`, chuỗi "Bài học của Đại Sư"; mục tiêu, số lượng, phần thưởng ở dữ liệu): 7 bài nhận và trả từng bài với Ngọc Tiểu Cương ở Nặc Đinh Thành, mỗi bài dạy một hệ thống:

| Bài | Tên | Mục tiêu |
|---|---|---|
| 1 | Hậu cần của hồn sư | Nói chuyện với Thương nhân Nặc Đinh |
| 2 | Luyện tay ở Bãi tập | Hạ hồn thú ở Bãi tập hồn sư (Thánh Hồn Thôn) |
| 3 | Đổi tay giữa trận | Đổi võ hồn khi đang giao chiến; tung tiên cơ |
| 4 | Hồn hoàn đầu tiên | Hấp thụ thành công một hồn hoàn **không vượt giới hạn** |
| 5 | Hồn cốt, hồn hạch hộ thân | Gắn một hồn cốt hoặc hồn hạch |
| 6 | Lò rèn Nặc Đinh | Nói chuyện với Thợ rèn Nặc Đinh |
| 7 | Tinh Đấu Đại Sâm Lâm | Tới Tinh Đấu Ngoại vi và hạ hồn thú ở đó |

- Dấu trên đầu Đại Sư: **"!"** có bài mới, **"?" vàng** đủ mục tiêu chờ trả, "?" xám đang làm; mở hộp thoại khi có dấu thì vào thẳng trang nhiệm vụ.
- Mục tiêu **chỉ đếm sau khi nhận**, theo sự kiện thật server ghi nhận (`questEvent`); đồng đội tổ đội được chia kinh nghiệm cũng được tính hạ hồn thú. Mục tiêu dạng "đang có / đang gắn / đang ở" mà đạt sẵn lúc nhận thì xong ngay. Hấp thụ vượt giới hạn mà vẫn thành công thì không tính.
- Trả bài cần đủ mục tiêu và túi đủ chỗ cho **cả** phần thưởng (thiếu thì từ chối, giữ tiến độ). Khung theo dõi dưới bản đồ nhỏ (thu gọn được), thông báo lớn khi nhận / đủ / trả.
- Tiến độ lưu ở bảng `quests`, ghi cùng transaction với túi đồ. Mọi tài khoản bắt đầu ở bài 1.

### 5.9 Người chơi lập đội và PvP
**Tổ đội người chơi** (tối đa `PARTY_MAX` người; luật ở `server/src/party.ts`, mức tiến trình, không lưu DB):
- Mời bằng cách bấm / chạm hồn sư khác, `/moi <tên>` hoặc nút "Mời…" ở khung tổ đội (mời được người ở bản đồ khác); người được mời "Vào đội" / "Từ chối" trong `PARTY_INVITE_SECS` giây. Ai trong đội cũng mời được; chống spam lời mời ở `server/src/ratelimit.ts`.
- Người mời làm trưởng nhóm; trưởng nhóm mời thành viên ra hoặc nhường trưởng nhóm; trưởng nhóm rời thì người vào sớm nhất làm trưởng; còn 1 người thì giải tán. Giữ nguyên khi đi cổng / đổi kênh; rời game quá `PARTY_OFFLINE_SECS` giây thì tự ra khỏi đội.
- **Chia kinh nghiệm:** thành viên cùng phòng (cùng bản đồ, cùng kênh), chưa gục, cách chỗ hồn thú gục dưới `PARTY_XP_RANGE` pixel (khoảng 300px) cùng chia (người hạ luôn được chia): tổng kinh nghiệm gốc thêm `PARTY_XP_BONUS` cho mỗi người thêm (mỗi người thêm 5%) rồi chia đều (`partyXpShare`); sau đó mỗi người tự giảm theo chênh cấp của mình và chia cho đội võ hồn. Tinh anh chia cùng cách; thú vương / boss thế giới chia theo đóng góp. Hồn Tệ và mảnh vào túi vẫn chỉ của người hạ.
- **Đồ rơi** ưu tiên cả tổ đội của người được ưu tiên (mục 4).
- Khung tổ đội dưới khung chỉ số: tên, cấp, võ hồn ra trận và sinh lực, bản đồ / kênh (nếu khác), đã rời game; đồng đội cùng phòng có tên và chấm xanh lá trên bản đồ nhỏ.
- **Hiệu ứng phụ trợ lan cho đồng đội:** hồn kỹ, tiên cơ, Chân Thân tung khi võ hồn hệ **Phụ trợ** ra trận có hiệu ứng lên bản thân (hiệu ứng có lợi, hồi sinh lực, khiên, hồi hồn lực) thì đồng đội cùng phòng, chưa gục cả đội, không đang đi cổng, ngoài vùng an toàn, đứng trong `PARTY_BUFF_R` pixel cũng nhận, mức × `PARTY_BUFF_MULT` (người tung ×1); hồi / khiên tính theo sinh lực tối đa võ hồn ra trận của người nhận; trùng thì lấy mức mạnh hơn và thời gian dài hơn. **Không lan:** thanh tẩy, lãnh vực phượng hoàng (`PARTY_BUFF_SKIP`), tàng hình của võ hồn không phải Phụ trợ (kể cả chép bằng Phục Chế), bất tử khi bay, Phong Lôi Chi Lực. Đồng đội thấy "+N" hồi / khiên và dòng "<tên> tăng công cho bạn".
- **Đóng góp hỗ trợ:** hồi máu / khiên thực cho đồng đội đang tham gia tinh anh / thú vương / boss thế giới tính vào đóng góp của người hồi (`SUPPORT_CONTRIB`); bảng xếp hạng có cột "Hỗ trợ". Hồn hoàn đỏ của boss thế giới vẫn xếp theo sát thương.
- Phục Chế chép được hồn kỹ của đồng đội (mục 5.2).

**Đại Đấu Hồn Trường** (đấu đội võ hồn 1v1 xếp hạng Elo; số ở `ARENA`):
- **Xếp hàng:** đứng cạnh biển Đại Đấu Hồn Trường ở Thiên Đấu Thành, mở hộp thoại, "Xếp hàng đấu hồn". Không xếp được khi đứng xa, đã gục, đang hấp thụ, đang giao chiến, đang đi cổng hay **đang trong tổ đội**; đang xếp hàng mà rơi vào các trạng thái đó thì tạm không được ghép (giữ chỗ); đi bản đồ khác hay thoát game thì ra khỏi hàng. Hàng chờ chung mọi kênh. Ô "Đang tìm đối thủ…" (Elo, thời gian chờ, nút Hủy).
- **Ghép theo Elo gần nhất** (`arenaPairs`): người chờ lâu nhất gặp người có Elo gần nhất trong cửa sổ nới dần theo thời gian chờ (`arenaWindow`).
- **Trận:** mỗi trận một phòng riêng trên sân `dai_dau_hon_truong`; ghép xong cả hai rời bản đồ vào sân (không vào trong `ARENA.joinSecs` giây là thua), đứng hai phía, **cả đội hồi đầy**, đếm ngược `readySecs`, giao đấu `fightSecs`. Đánh thường, hồn kỹ (cả vòng 5–10, tuyệt kỹ), Chân Thân, kỹ năng hồn cốt, tiên cơ, đổi võ hồn như ngoài rừng; cộng minh, sao, hồn cốt, hồn hạch đều áp. Sát thương lên hồn sư = công thức lên hồn thú × `ARENA.dmgMult` (qua thủ theo hệ, tăng thủ, khiên, miễn sát thương), không có khung bất tử sau đòn của đối thủ. Sinh lực hồi như ngoài rừng; võ hồn gục tự đổi và không hồi trong trận.
- **Chỉ áp lên hồn thú, không lên đối thủ:** Mị hoặc / Mê hoặc / Phong ấn, đẩy lùi, kéo, xóa buff, kích nổ Thiêu đốt / Viêm bạo, lãnh vực phượng hoàng, ràng buộc Băng Hỏa Lưỡng Nghi, hiệu ứng bộ hồn hạch nhắm mục tiêu. Tàng hình làm đối thủ không khóa mục tiêu được; sét tìm Cảm điện (`shockR`) trúng cả đối thủ Cảm điện.
- **Kết quả:** hạ hết đội đối thủ thì thắng; hết giờ thì bên còn nhiều % sinh lực cả đội (võ hồn gục tính 0) thắng, chênh không quá `drawPct` là hòa; rời sân (đóng tab, mất mạng, "Rời sân") hoặc không vào sân là thua.
- Trong sân không xếp đội, đổi ô hồn kỹ, hấp thụ, gắn / tháo / cường hóa / nâng cấp đồ, dùng vật phẩm, nhặt / bỏ đồ, mở rương, mở võ hồn / lên sao, nói chuyện NPC, mua bán, mời / nhận tổ đội, đi cổng (`ArenaRoom` `BLOCKED`; chỉ số hai bên cố định suốt trận). Biến hình và hồi chiêu là dữ liệu riêng của phòng sân.
- **Elo:** khởi đầu `startElo`, K = `k` mọi trận (thắng 1, hòa 0,5, thua 0; `eloAfter`), không dưới 0; lưu ở `arena_ratings` (Elo, thắng, thua, hòa).
- **Thưởng thắng:** Hồn Tệ `winHonTe` + `winShards` mảnh của một võ hồn ngẫu nhiên trong `ARENA_SHARDS` (túi đầy thì mảnh đổi ra Hồn Tệ theo giá thương nhân); tối đa `dailyWins` trận thắng có thưởng mỗi ngày (hết lượt vẫn đấu và tính Elo). **Thua / hòa không thưởng, không mất gì**; trận không đổi kinh nghiệm, đồ, đội hình hay võ hồn ra trận. Không có mùa giải.
- **Chống dàn xếp:** cùng một cặp tài khoản chỉ `pairDaily` trận mỗi ngày tính Elo và thưởng (`arenaRanked`, đếm ở bảng `arena_pairs`); từ trận kế tiếp là **giao hữu**: vẫn đấu, không đổi Elo / thành tích, không thưởng, không mất lượt thắng có thưởng; thanh trận đấu và bảng kết quả ghi rõ. Trận bỏ / không vào sân cũng đếm vào cặp, trận hủy (không ai vào sân) thì không. Trong `rematchSecs` giây chờ đầu, không ghép lại đối thủ của trận ngay trước nếu còn người khác trong cửa sổ (đối thủ trước giữ ở RAM).
- **Màn hình:** thanh trận đấu (hai bên: tên, Elo, % sinh lực cả đội, số võ hồn còn đứng; đồng hồ), thanh máu nhỏ trên đầu hai hồn sư. Hết trận hiện bảng kết quả (thắng / thua / hòa, lý do, Elo trước → sau, phần thưởng); sau `endSecs` giây hoặc bấm "Về bản đồ cũ" thì **về đúng bản đồ và vị trí trước khi vào sân**.
- **Bảng xếp hạng** (nút ở hộp thoại): top `topN` theo Elo, bằng Elo thì nhiều trận thắng hơn rồi ai đạt trước; chỉ tài khoản đã đấu; kèm hạng, thành tích của mình và lượt thưởng còn lại hôm nay.

**PvP ngoài rừng:** không có. Phòng bản đồ luôn trả "không có đối thủ" (`MapRoom.foesOf`); chỉ phòng Đại Đấu Hồn Trường bật.

### 5.10 Cộng minh (giai đoạn cuối)
Đạt mốc theo từng trụ cột thì cộng % chỉ số gốc cho **mọi** võ hồn của tài khoản (ra trận, trong đội, ngoài đội, mở sau), buộc nuôi đều thay vì dồn cho một võ hồn. Bảng `RESONANCE`: 4 trụ cột, mỗi trụ cột 3 mốc, mỗi mốc cộng % sinh lực / hồn lực / công.

| Trụ cột | Đếm gì |
|---|---|
| Võ hồn | Số võ hồn sở hữu có cấp từ `RES_VOHON_LEVEL` |
| Hồn hoàn | Tổng số hồn hoàn đã hấp thụ trên mọi võ hồn |
| Hồn cốt | Số hồn cốt **đang gắn** có cấp cường hóa từ `RES_BONE_ENHANCE` |
| Hồn hạch | Số hồn hạch **đang gắn** từ `RES_CORE_STARS` sao |

- Chỉ đếm đồ đang gắn (đồ trong túi không tính), để buộc trang bị đều cho nhiều võ hồn. % cộng chung với dòng % của hồn hạch trong `calcStats`.
- Tiến độ tính lại từ dữ liệu sẵn có (`resonanceProgress` / `resonanceLevels` / `resonanceBonus`, không lưu DB) mỗi khi lên cấp, hấp thụ, mở võ hồn, gắn / tháo / cường hóa / nâng cấp đồ đang gắn; đạt mốc mới thì báo lớn, tháo đồ làm tụt mốc thì báo mất phần cộng.
- Bảng **Cộng minh** (phím K, nút "Cộng minh" trong khung chỉ số và ở đầu bảng đội hình): tổng % đang cộng, mỗi trụ cột tiến độ x / mốc kế tiếp kèm thanh, các mốc đã đạt sáng màu.

### 5.11 Mỹ thuật: hồn sư, võ hồn, hồn thú
Sprite chưa có ảnh thật được vẽ bằng code (`client/src/textures.ts`, `honsuArt.ts`). Mục này là quy cách để thay dần bằng ảnh thật mà không phải sửa luật chơi. Nguồn ảnh: gói trial PixelLab đã dùng hết (ghi nguồn từng key ở `art/CREDITS.md`); **phần mỹ thuật còn lại làm bằng một dịch vụ self-host (chưa chọn công cụ)**, theo đúng quy cách này và vẫn đi qua dây chuyền `tools/assets`. Trong lúc chờ, key chưa có ảnh vẫn vẽ bằng code, chỉnh tay khi cần (Aseprite, `pixelart_workbench`). Lệnh và tham số của dây chuyền: skill `.claude/skills/asset-gen`.

**Phong cách và bảng màu chung**
- **Chibi pixel RPG** nhìn từ trên xuống, hơi nghiêng (kiểu RPG 16-bit). Đầu to bằng khoảng 2/5 chiều cao, mắt 1–2 pixel, tay chân ngắn.
- **Ánh sáng từ trên bên trái.** Mỗi vùng màu dùng 3 sắc độ (tối, gốc, sáng); sắc độ thứ 4 chỉ cho kim loại và hiệu ứng phát sáng.
- **Viền tối có màu**, không dùng đen tuyền: viền ngoài `#1a1020`, viền trong cùng tông, tối hơn màu gốc. Không khử răng cưa ở viền ngoài để sprite đọc rõ khi phóng to 2–6 lần.
- **Bảng màu chung** ở `art/palette.gpl` (bảng màu Aseprite). Ngoài bảng này chỉ được thêm màu chủ đạo của võ hồn (`col`, `robe` trong `VOHON`) cùng tối đa 1 sắc tối và 1 sắc sáng suy ra từ mỗi màu đó, và màu hồn hoàn trong `TIERS`.
- **Da:** sprite vẽ bằng 3 sắc da của tông 0; client hoán 3 sắc đó sang dải của tông khác (`SKIN_TONES`, key `hs_body_f_2@2`).
- **Nền tối dần theo độ sâu của rừng** (lớp `vignette`), nên màu tối của võ hồn và hồn thú phải có viền sáng hoặc hào quang (ví dụ hồn hoàn đen dùng `glow` tím làm viền).

**Quy cách sprite hồn sư**
- **Khung 32×32 pixel**, gốc tại chân, điểm (16, 30), tức `origin = (0.5, 30/32)`. Thân cao khoảng 24–26 pixel. Một ô bản đồ (`TILE`) là 16 pixel nên hồn sư cao khoảng 2 ô, rộng 1 ô.
- **Bóng dưới chân** không vẽ trong sprite: client vẽ elip mờ 12×4.
- **4 hướng: xuống, phải, lên, trái.** Chỉ vẽ 3 hướng; hướng trái lật ngang hướng phải, áp cho mọi lớp cùng lúc. Server đồng bộ hướng qua `PlayerState.dir` (`DIRS4`, `dir4()`).
- **Ghép theo lớp.** Mỗi lớp là một spritesheet riêng có **cùng bố cục khung**. Thứ tự vẽ từ sau ra trước:

| Thứ tự | Lớp | Nguồn | Ghi chú |
|---|---|---|---|
| 1 | Bóng | Code | Elip mờ dưới chân |
| 2 | Vòng hồn hoàn, nửa sau | Code (hoặc ảnh `halo`) | Phần elip nằm sau thân |
| 3 | Phụ thể võ hồn, nửa sau | `vh_{id}_b` | Cánh, đuôi, chân nhện, hư ảnh sau lưng, vũ khí khi bị thân che |
| 4 | Thân | `hs_body_{m/f}_{0–3}` | Da, mặt, quần hoặc váy lót, giày |
| 5 | Áo | `hs_outfit_{m/f}_{0–3}` | Đổi màu bằng hoán màu |
| 6 | Tóc | `hs_hair_{m/f}_{0–3}` | Đổi màu bằng hoán màu |
| 7 | Phụ thể võ hồn, nửa trước | `vh_{id}_f` | Vũ khí trên tay, tai thú, dây leo trước người, hào quang phía trước |
| 8 | Vòng hồn hoàn, nửa trước | Code (hoặc ảnh `halo`) | Phần elip nằm trước thân |
| 9 | Hiệu ứng | Code (`fx` từ server) | Vệt chém, sóng, chữ sát thương |

- **Ghép lớp theo bộ giới × kiểu tóc (phương án (b)).** Mỗi tổ hợp giới × kiểu tóc (2 × 4 = 8 bộ) vẽ **liền** thân + áo + tóc trong cùng một hình, rồi `tools/assets` tách tự động thành 3 lớp từ chính hình đó, nên 3 lớp luôn khớp nét và không lộ lỗ ở chỗ tóc che. Không dùng chung một lớp thân cho nhiều kiểu tóc.
  - **Quy ước key:** `hs_{lớp}_{giới}_{kiểu tóc}` (lớp `body` / `outfit` / `hair`, giới `m` / `f`, kiểu tóc 0–3); file `honsu/{lớp}_{giới}_{kiểu tóc}.png`. Client lấy key bằng `honsuKey(lớp, giới, kiểu tóc)` (`client/src/sprites.ts`).
  - **Mỗi bộ đủ 3 lớp hoặc không có lớp nào** trong `manifest.json` (`validate.mjs` báo lỗi bộ thiếu lớp). Bộ chưa có ảnh thật thì client vẽ cả 3 lớp bằng code; không trộn lớp ảnh thật với lớp vẽ code trong một bộ.
  - **Phụ thể võ hồn vẫn là lớp riêng**, không vẽ liền với hồn sư. Kiểu áo khác về sau (đồng phục Sử Lai Khắc, áo Vũ Hồn Điện) sẽ cần thêm chỉ số kiểu áo vào key.
- **Phụ thể tách hai nửa (sau thân và trước thân) cho từng khung.** Người vẽ tự quyết pixel nào nằm sau, nằm trước theo từng hướng (quay lưng thì cánh ở nửa trước, vũ khí ở nửa sau), nên client không cần đổi thứ tự lớp theo hướng.
- **Khung phụ thể 48×48**, là khung thân mở rộng 8 pixel mỗi phía, gốc tại (24, 38). Cánh, búa lớn, dây leo dưới đất được tràn ra ngoài khung 32×32.
- **Hoán màu (palette swap):** tóc và áo vẽ bằng **dải 4 xám chuẩn** `#3a3a3a`, `#6a6a6a`, `#9a9a9a`, `#cacaca` (tối → sáng). Lúc tải, client tạo bản đã tô cho từng tổ hợp đang dùng bằng cách thay đúng 4 màu này bằng dải màu chọn (`HAIR_COLORS`, `OUTFIT_COLORS`). Không dùng `setTint` vì phép nhân màu làm mất sắc độ.
  - **Viền ngoài `#1a1020` giữ nguyên khi hoán màu.** Trong lớp tóc và áo, `#1a1020` là **màu thứ 5 được phép** và không bị hoán; chỉ viền trong (xám tối nhất) đổi theo màu chọn. `validate.mjs` chỉ nhận 4 xám + `#1a1020` trong lớp tóc / áo.
  - Key texture đã hoán màu là **key gốc + `@` + chỉ số màu** (`hs_hair_f_2@3`, `hs_outfit_m_2@5`; lớp thân tông da khác `hs_body_f_2@2`). Chỉ tạo khi có người chơi dùng tổ hợp đó.

**Tùy biến khi tạo nhân vật** (`SEXES`, `HAIR_STYLES`, `HAIR_COLORS`, `OUTFIT_COLORS`, `SKIN_TONES`, kiểm tra bằng `parseLooks()`; mọi màu lấy từ `art/palette.gpl`, thêm màu mới vào cuối mảng vì DB lưu chỉ số)

| Mục | Nam | Nữ |
|---|---|---|
| Kiểu tóc 0 | Ngắn rối | Dài thả thẳng |
| Kiểu tóc 1 | Dài buộc thấp sau gáy | Đuôi ngựa cao |
| Kiểu tóc 2 | Dựng nhọn | Bím dài một bên |
| Kiểu tóc 3 | Mái dài che một bên mắt | Ngắn ngang vai, có mái |
| Màu tóc (dùng chung) | Đen, nâu, vàng kim, bạc, lam, hồng | |
| Màu áo (dùng chung) | Lam, đỏ, lục, tím, trắng, đen | |
| Tông da (dùng chung) | Trắng hồng, bánh mật, ngăm | |

- Áo bản đầu là **áo hồn sư** đơn giản: áo vải có đai lưng, nam mặc quần, nữ váy ngắn trên quần bó.
- Mỗi tài khoản lưu `sex`, `hair`, `hairCol`, `outfitCol`, `skin` (chỉ số nhỏ).

**Animation của hồn sư**

| Animation | Số khung | Thời gian mỗi khung | Lặp | Ghi chú |
|---|---|---|---|---|
| `idle` (đứng) | 2 | 400 ms | Có | Thở: đầu và vai nhích 1 pixel |
| `walk` (đi) | 4 | 120 ms | Có | Chân trái, đứng, chân phải, đứng |
| `attack` (đánh thường) | 3 | 80 / 80 / 140 ms | Không | Lấy đà, vung, thu về. Phụ thể vũ khí vung theo |
| `cast` (tung hồn kỹ) | 3 | 100 / 200 / 140 ms | Không | Giơ tay, giữ (vòng hồn hoàn của hồn kỹ sáng lên), thả |
| `hurt` (bị đánh) | 1 | 150 ms | Không | Ngửa người; client nháy trắng thêm 2 lần |
| `die` (gục) | 3 | 120 / 120 / giữ | Không | Khuỵu, ngã, nằm. Ẩn phụ thể |
| `absorb` (hấp thụ) | 2 | 500 ms | Có | Ngồi xếp bằng thiền, **chỉ hướng xuống**. Phụ thể mờ 60% |

- **Bố cục spritesheet cố định, mọi lớp giống nhau**, 16 cột × 4 hàng = 512×128 (lớp phụ thể 768×192 vì khung 48×48):
  - Hàng 0 hướng xuống, hàng 1 hướng phải, hàng 2 hướng lên. Trong mỗi hàng: cột 0–1 `idle`, 2–5 `walk`, 6–8 `attack`, 9–11 `cast`, 12 `hurt`, 13–15 `die`.
  - Hàng 3: cột 0–1 `absorb` (hướng xuống); các cột còn lại để trống.
- **Client tự tạo animation từ chỉ số khung cố định**, không dùng tag Aseprite: `this.load.spritesheet(key, png, { frameWidth, frameHeight })`, rồi `this.anims.generateFrameNumbers(key, { start, end })` theo bố cục trên; thời gian khung là hằng số trong client.
  - Key animation có **tiền tố là key của sheet**: `{sheet}:{animation}_{hướng}` (`hs_body_f_0:idle_down`; hướng `down`, `right`, `up`; trái dùng `_right` và lật ngang), để các sheet không va chạm trong AnimationManager toàn cục của Phaser.
  - Chỉ lớp thân có animation. Mỗi khi khung của lớp thân đổi, client tính (hàng, cột) rồi đặt khung tương ứng cho áo, tóc và phụ thể.
- **Lớp áo và tóc** vẽ đủ mọi khung như lớp thân.
- **Lớp phụ thể chỉ vẽ** `idle`, `walk`, `attack`, `cast` (cột 0–11 của hàng 0–2); client dùng **bảng ánh xạ khung cố định**:

| Lớp thân đang ở | Khung phụ thể dùng | Ghi chú |
|---|---|---|
| `idle`, `walk`, `attack`, `cast` (cột 0–11) | Cùng hàng, cùng cột | |
| `hurt` (cột 12) | Cùng hàng, cột 0 | |
| `die` (cột 13–15) | Không vẽ | Ẩn phụ thể |
| `absorb` (hàng 3, cột 0–1) | Hàng 0, cột 0–1 | Mờ 60% |

**Phụ thể của 24 võ hồn** (màu chủ đạo là `col` / `robe` trong `VOHON`)

| Võ hồn (`id`) | Dạng phụ thể khi phóng thích | Vị trí lớp | Hiệu ứng đặc trưng |
|---|---|---|---|
| Cửu Tinh Thất Sát Kiếm (`cuu_tinh_that_sat_kiem`) | Trường kiếm bạc, thân kiếm có hàng sao sáng | Tay phải | Kiếm khí mảnh; khi tung hồn kỹ có 3–4 thanh kiếm nhỏ bay quanh người |
| Lam Điện Bá Vương Long (`lam_dien_ba_vuong_long`) | Vảy rồng xanh phủ hai cẳng tay, vuốt rồng; hư ảnh đầu rồng sau lưng | Tay + lưng | Tia điện chạy dọc tay, chớp lóe 1 khung khi đánh trúng |
| Kỳ Nhung Thông Thiên Cúc (`ky_nhung_thong_thien_cuc`) | Đóa cúc vàng lớn nở sau lưng, cánh hoa xoay quanh người | Lưng + bao quanh | Cánh hoa bay theo vòng, rơi lả tả khi di chuyển |
| Tà Hỏa Phượng Hoàng (`ta_hoa_phuong_hoang`) | Đôi cánh lửa phượng hoàng | Lưng | Cánh vỗ theo nhịp đi; tàn lửa bay lên |
| U Minh Linh Miêu (`u_minh_linh_mieu`) | Tai mèo, đuôi mèo, móng vuốt dài trên hai tay | Đầu + tay + lưng | Vệt cào tím; bóng mờ đuổi theo khi lướt |
| Nguyệt Nhận (`nguyet_nhan`) | Đôi lưỡi trăng khuyết bạc cầm hai tay | Hai tay | Vệt chém hình trăng khuyết, ánh trăng lạnh |
| Hỏa Long (`hoa_long`) | Hư ảnh rồng lửa nhỏ quấn quanh thân, đầu rồng trên vai | Bao quanh | Hơi nóng gợn quanh người, tia lửa bắn ra khi đánh |
| Nhu Cốt Thố (`nhu_cot_tho`) | Tai thỏ dài, đuôi bông; hai chân phát sáng | Đầu + lưng + dưới chân | Vệt sáng hồng hình cung khi lướt và đá |
| Kim Vũ Miêu Ưng (`kim_vu_mieu_ung`) | Đôi cánh lông vàng kim, vuốt ưng ở tay | Lưng + tay | Lông vũ rơi; tia điện vàng lóe trên mép cánh |
| Tử Vong Chu Hoàng (`tu_vong_chu_hoang`) | 4 chân nhện tím đen mọc sau lưng | Lưng | Sợi tơ tím; hơi độc mờ bay quanh chân |
| Bích Lân Xà Hoàng (`bich_lan_xa_hoang`) | Rắn lục biếc quấn cánh tay, đầu rắn ngóc trên vai | Tay + vai | Vảy lân quang lấp lánh, sương độc xanh dưới chân |
| Càn Khôn Hỗn Nguyên Tỏa (`can_khon_hon_nguyen_toa`) | Vòng xích vàng có ổ khóa lơ lửng quanh người | Bao quanh | Xích xoay chậm; phù văn sáng khi tung hồn kỹ |
| Hỏa Ảnh (`hoa_anh`) | Bóng lửa đỏ hình người đứng sau, hai tay bọc lửa | Lưng + tay | Bóng lửa đi trễ nhịp so với thân |
| Yêu Hồ (`yeu_ho`) | Tai cáo, 3 đuôi cáo xòe sau lưng | Đầu + lưng | Ảo ảnh hồng nhấp nháy, đốm sáng hình giọt nước |
| Xúc Xích (`xuc_xich`) | Xúc xích nướng to trên tay, 2–3 xúc xích nhỏ bay quanh | Tay + bao quanh | Hơi nóng bốc lên, xúc xích nhỏ nảy lên xuống |
| Quỷ Mị (`quy_mi`) | Hư ảnh quỷ mờ sau lưng, khói tím đen bao người | Lưng + bao quanh | Bóng nhân đôi lệch 1–2 pixel; nhấp nháy khi tàng hình |
| Thiên Càn Bạch Ngọc Đỉnh (`thien_can_bach_ngoc_dinh`) | Đỉnh ba chân bằng bạch ngọc lơ lửng trên lòng bàn tay | Tay (lơ lửng) | Khói ngọc trắng bốc từ miệng đỉnh; quầng sáng khi hồi máu |
| Lam Ngân Thảo (`lam_ngan_thao`) | Dây cỏ lam ngân quấn hai tay, lan thành thảm dưới chân | Tay + dưới chân | Dây leo bò trên đất, đốm sáng xanh li ti |
| Hạo Thiên Chùy (`hao_thien_chuy`) | Búa đen khổng lồ (đầu búa to gần bằng người) | Tay | Vân đen chạy trên búa; bụi và vết nứt đất khi nện |
| Cửu Bảo Lưu Ly Tháp (`cuu_bao_luu_ly_thap`) | Tháp lưu ly 9 tầng nhỏ lơ lửng trên tay | Tay (lơ lửng) | Hào quang 7 màu xoay quanh tháp, chiếu tia sáng lên đồng đội |
| Phá Hồn Thương (`pha_hon_thuong`) | Trường thương cán dài, mũi hình thoi, tua đỏ dưới mũi | Tay phải | Hồn quang lấp lánh ở mũi thương; vệt đâm thẳng khi đánh |
| A Ngân (`a_ngan`) | Dây Lam Ngân vân vàng quấn hai tay, vương miện cỏ, đóa Lam Ngân Hoàng nở sau lưng | Tay + đầu + lưng | Đốm sáng xanh và vàng li ti |
| Liệt Hỏa Thương Lang (`liet_hoa_thuong_lang`) | Tai sói xám, đuôi sói to chóp lửa, vuốt lửa hai tay | Đầu + lưng + tay | Tàn lửa bay từ chóp đuôi; vệt cào lửa khi đánh |
| Băng Phượng Hoàng (`bang_phuong_hoang`) | Đôi cánh băng phượng hoàng, mào băng trên đầu | Lưng + đầu | Tinh thể băng hình chữ thập lấp lánh quanh người |

- Hiệu ứng lớn (kiếm trận, lãnh vực, sóng sét) vẽ bằng code hoặc sprite hiệu ứng riêng, **không** nhét vào lớp phụ thể.
- **Võ Hồn Chân Thân** là bộ sprite riêng sau này; hiện vẽ bằng code: hồn sư phóng to `CHAN_THAN_SCALE`, quầng sáng màu võ hồn, vòng sáng dưới chân, hạt sáng bay lên; ai cũng thấy (`PlayerState.ava`).

**Vòng hồn hoàn**
- Màu theo 5 bậc niên hạn, lấy `col` (thân vòng) và `glow` (viền sáng) trong `TIERS`. Không chép mã màu sang chỗ khác.
- **Dưới chân hồn sư:** mỗi hồn hoàn của võ hồn đang ra trận là một elip 20×6, viền 2 pixel màu `col` cộng 1 pixel `glow`. Vòng 1 sát chân, vòng sau cao hơn 2 pixel; 10 vòng cao khoảng 18 pixel. Các vòng nhấp nhô chậm lệch pha nhau.
- Cung trên của elip vẽ sau thân, cung dưới vẽ trước thân, để vòng trông như bao quanh người.
- **Khi tung hồn kỹ vòng thứ i:** vòng i sáng gấp đôi và phình ra 2 pixel trong 300 ms.
- **Hồn hoàn rơi trên đất:** key `ring{tier}` 24×14. Vòng dưới chân vẽ bằng code: `halo{tier}` (khung 24×10, khung 0 cung trên, khung 1 cung dưới) và `halo{tier}_lit` (28×12, vòng đang sáng); vẽ tay sau này thì thay bằng ảnh cùng quy cách.

**Hồn thú**
- Chỉ vẽ **2 hướng** (sang phải; trái là lật ngang) vì server chỉ gửi `face` = ±1. Gốc tại giữa đáy, cách mép dưới 2–4 pixel.
- Kích thước khung theo bậc:

| Bậc | Khung | Kích thước trên bản đồ |
|---|---|---|
| Trắng | 16×16 | 1 ô |
| Vàng | 32×32 | khoảng 1,5 ô |
| Tím | 48×32 | khoảng 2 ô dài |
| Đen | 48×48 | khoảng 2,5 ô |
| Đỏ | 64×64 | khoảng 3,5 ô |
| Tinh anh | khung của loài gốc, phóng `ELITE.scale` | thêm aura vẽ bằng code |
| Tà hóa thú vương | khoảng 96×96 (loài gốc phóng `KING.scale`) | khoảng 5 ô |

- Animation: `idle` 2 khung, `walk` 4, `attack` 3 (khung đầu là tư thế báo trước, client giữ khung này khi `BeastState.cast` bật rồi chạy 2 khung ra đòn lúc tung), `hurt` 1, `die` 3. Spritesheet một hàng theo đúng thứ tự đó, 13 khung. Key animation có tiền tố sheet (`beast_phong_lang:walk`).
- Trạng thái hung hăng không vẽ khung riêng: client thêm mắt đỏ / dấu "!" bằng code.
- Mỗi loài một bộ sprite `beast_{loài}`; loài chưa có ảnh vẽ theo bậc `b{tier}_…` bằng code.

**Chân dung và thẻ võ hồn** (giao diện HTML, không phải Phaser)
- **Chân dung 64×64**, vẽ nhân vật truyện là chủ nhân (`owner` trong `VOHON`); võ hồn chưa rõ chủ nhân thì vẽ chính võ hồn. Hiển thị phóng 2–3 lần với `image-rendering: pixelated`.
- **Thẻ võ hồn 96×128**: chân dung ở trên, tên, khung viền theo độ hiếm (SR bạc, SSR vàng, UR đỏ tím), biểu tượng hệ 12×12 ở góc trên trái, sao ở dưới, hồn hoàn là các chấm màu theo bậc.
- Biểu tượng 4 hệ: 12×12, một màu trên nền trong suốt, để CSS tô màu.

**Tên file, key Phaser và thư mục**
- `shared/assets` là `publicDir` của Vite, nên ảnh ở đây được client tải thẳng. Tên file dùng mã võ hồn (`id`), **không dùng chỉ số mảng**.

```
art/                         file nguồn, không tải trong game
  palette.gpl                bảng màu chung
  CREDITS.md                 nguồn gốc và giấy phép mọi asset
  src/pixellab/{bộ}/         ảnh thô, đầu vào của tools/assets ({hướng}_{animation}_{i}.png)
  honsu/ vohon/ beast/ ui/   file .aseprite (khi chỉnh tay)
shared/assets/sprites/
  manifest.json              danh sách key đã có ảnh thật
  honsu/{body,outfit,hair}_{m,f}_{0–3}.png   hs_{lớp}_{giới}_{kiểu tóc} (bản hoán màu: …@{màu})
  vohon/{id}_b.png, {id}_f.png               vh_{id}_b, vh_{id}_f
  beast/{loài}.png                           beast_{loài}
  ring/ring{tier}.png                        ring{tier}, halo{tier}
shared/assets/ui/
  portrait/{id}.png          chân dung 64×64
  card/frame_{sr,ssr,ur}.png khung thẻ 96×128
  icon/he_{he}.png           biểu tượng hệ 12×12
```

- **Cách thay dần:** client đọc `manifest.json` trong `preload()`, chỉ tải các key có trong danh sách, rồi `makeTextures()` vẽ bằng code những key còn thiếu (`textures.ts` bỏ qua key đã có). Mỗi lần chỉ cần thêm ảnh và một dòng manifest.
- Sprite vẽ bằng code phải dùng **đúng key** (`honsuKey`, `vh_{id}_f`…) và cùng bố cục khung, để ảnh thật thay vào được ngay.

**Dây chuyền `tools/assets` → spritesheet** (lệnh chi tiết: skill `asset-gen`)
1. **Tạo ảnh** (dịch vụ self-host khi đã chọn; trước đây là PixelLab): khung hướng xuống trước (hồn sư 32×32, phụ thể 48×48, nền trong suốt, góc nhìn từ trên hơi nghiêng), duyệt bằng mắt rồi mới xoay hướng và làm animation. Nhân vật sau dùng khung gốc của nhân vật đã duyệt làm ảnh khởi đầu để giữ phong cách. Không ghi tên họa sĩ còn sống hay tên game thương mại vào prompt.
2. **Màu khóa để tách lớp hồn sư:** mỗi bộ giới × kiểu tóc vẽ liền cả người; tóc màu lam sáng, áo / quần / váy màu xám. Ảnh thô lưu ở `art/src/pixellab/{bộ}/`.
3. **Chuẩn hóa** bằng `normalize.mjs`: xóa nền, đặt chân vào gốc, thu nearest-neighbor nếu quá khung, đưa màu về bảng, viền ngoài `#1a1020`. `--split` tách thân / áo / tóc theo màu khóa và đưa tóc, áo về dải 4 xám; `--vohon <id> --halves <y>` tách phụ thể thành nửa sau / nửa trước.
4. **Ghép sheet** bằng `pack.mjs` theo bố cục cố định; hồn sư `--set <giới>_<kiểu tóc>` ghi cả 3 lớp của bộ. `--breathe` tạo khung idle thứ 2; `--fill` chép tạm idle vào ô chưa có animation (validate cảnh báo).
5. **Kiểm tra và đăng ký:** `validate.mjs --register <key>` kiểm kích thước, màu ngoài bảng, khung bắt buộc, rồi thêm key vào `manifest.json` và một dòng vào `art/CREDITS.md`. `npm run check` và pre-commit chạy lại validate cho mọi key.
6. **Xem trong game** ở mức phóng 2× và 4×: đủ 4 hướng, ghép thử ít nhất 2 màu tóc và 2 màu áo, đặt cạnh nền rừng sâu.
7. **Chỉnh tay khi cần** trong Aseprite (bảng màu `art/palette.gpl`), rồi chạy lại bước 5. Xuất: `aseprite -b file.aseprite --sheet out.png --sheet-type rows --sheet-columns 16`.

**Nguồn và giấy phép**
- Hình do nhóm tạo bằng công cụ AI qua dây chuyền `tools/assets` hoặc vẽ tay. Công cụ AI chỉ dùng khi điều khoản cho phép dùng kết quả (PixelLab: https://pixellab.ai/termsofservice); mỗi key ghi một dòng trong `art/CREDITS.md`: file, key, công cụ, prompt, ngày.
- **Không dùng** sprite, ảnh cắt hoặc hình vẽ lại sát nét từ game thương mại (kể cả *Thế Giới Săn Hồn*), phim hoạt hình hay truyện tranh chính thức; chỉ xem để tham khảo ý tưởng, không đưa làm ảnh tham chiếu.
- **Asset bên ngoài** (font, tileset, âm thanh) chỉ nhận CC0, CC-BY hoặc OFL; mỗi asset một dòng trong `art/CREDITS.md` (tên file, tác giả, link gốc, giấy phép, đã chỉnh gì). CC-BY phải hiện tên tác giả trong màn hình giới thiệu.

## 6. Kiến trúc (bắt buộc giữ)
**Server quyết định mọi thứ.** Client chỉ gửi ý định và hiển thị. Không bao giờ để client tự báo máu, sát thương, vị trí, tỉ lệ rơi, kết quả hấp thụ, bản đồ hay kênh đích. Ngẫu nhiên (`Math.random()`) chỉ ở server; hàm trong `shared/data.ts` là hàm thuần để client dùng khi hiển thị.

**HTTP** (`server/src/index.ts`): `POST /api/login`, `/api/me` (bản đồ đang lưu, ngoại hình), `/api/looks` (tạo nhân vật, luật `chooseLooks`), `/api/awaken` (lễ thức tỉnh, luật `awakenAccount`; cả hai ở `MapRoom.ts`), `/api/channel` (chọn kênh lúc vào game), `GET /health`.

**Message từ client** (đăng ký trong `MapRoom.onCreate`; message chưa đăng ký làm Colyseus ngắt client, nên bỏ message thì sửa client và bot cùng lúc):

| Nhóm | Message |
|---|---|
| Di chuyển, đánh | `input {x, y, s}`, `attack`, `skill {i}`, `boneskill {i}`, `chanthan`, `switch {slot}` |
| Võ hồn | `vohons`, `team {slots}`, `loadout {rowId, skills}`, `unlock {vohon}`, `starup {vohon}` |
| Túi đồ | `bag`, `use {id, vohonId?}`, `pickup`, `discard {id}`, `open {id}`, `absorb {itemId, vohonId}` |
| Hồn cốt, hồn hạch | `equip` / `unequip`, `equipcore` / `unequipcore`, `enhance {targetId, materialIds}`, `enhancecore {targetId, materialIds}` |
| NPC | `talk {npc}`, `buy {code, qty}`, `sell {id, qty?}`, `expand`, `buyback {key}`, `quest {op}` |
| Bản đồ, kênh | `travel {portal}`, `channels`, `channel {ch}` |
| Xã hội | `chat {text}`, `party {op, name?, sid?}`, `arena {op}`, `resonance` |
| Kiểm thử | `test {op}` (chỉ khi server bật `GAME_TEST=1`) |

Mỗi message: ép kiểu và kẹp giá trị, kiểm tra id có thật và thuộc chính người gửi, kiểm tra trạng thái (gục, hấp thụ, đi cổng, giao chiến, vùng an toàn), hồi chiêu do server đếm; từ chối thì gửi lý do bằng tin `log` tiếng Việt, không ném lỗi.

**Đồng bộ xuống client**
- **Trạng thái công khai** qua Colyseus Schema (`server/src/rooms/schema.ts`: `MapState`, `PlayerState`, `BeastState`, `DropState`; phòng sân `ArenaState` / `ArenaSide`). Chọn kiểu nhỏ nhất đủ dùng; trường bit (`BeastState.st` theo `STATUS_IDS`, `PlayerState.buff` theo `BUFF_IDS`) chỉ thêm vào cuối. Client đọc ở `client/src/scenes/GameScene.ts`.
- **Dữ liệu riêng** (túi đồ, bộ sưu tập, đội hình, năng lượng tiên cơ, nhiệm vụ, tổ đội, cộng minh, đấu trường…) chỉ gửi cho chính chủ bằng tin riêng (`vohons`, `squad`, `bag`, `absorbing`, `enhanced`, `enhancedcore`, `quest`, `party`, `resonance`, `arena`, `arenaTop`, `npc`, `portal`, `travel`, `channels`…). Người khác chỉ thấy ngoại hình hồn sư, võ hồn đang ra trận, cấp và hồn hoàn của nó.
- **Hiệu ứng hình ảnh** (không ảnh hưởng luật) qua `broadcast("fx", {k, …})` và `"dmg"`; tin công khai `elite`, `boss`.

**Một loại phòng cho mọi bản đồ**
- **Logic game chỉ nằm trong các phòng ở `server/src/rooms/`:** `MapRoom.ts` (mọi bản đồ) và `ArenaRoom.ts` (trận Đại Đấu Hồn Trường); hàng chờ ở `arenaQueue.ts`.
- `gameServer.define("map", MapRoom).filterBy(["mapId"])`: Colyseus ghép người cùng `mapId` vào chung phòng; phòng đầy thì mở phòng mới (kênh mới). `onCreate({mapId})` kiểm tra `mapId` trong `MAPS` (thiếu thì `DEFAULT_MAP`), nạp bản đồ bằng `loadMap(mapId)` (`server/src/map.ts`, cache theo `mapId`), ghi `state.mapId`; client tải tilemap theo `mapId` của phòng.
- Khác biệt giữa các bản đồ nằm trong dữ liệu (`MAPS[mapId].kind`, file Tiled), không tách lớp phòng con. Ngoại lệ duy nhất là `ArenaRoom`.

**File Tiled mỗi bản đồ** (`shared/assets/<mapId>.json`, dùng chung server và client; server nạp sẵn mọi bản đồ khi khởi động để báo lỗi object ngay). Layer `ground` là nền, `trees` vật cản, `canopy` tán cây phủ lên nhân vật; ô có `collides=true` là vật cản ở cả hai phía. Lớp object:

| Object (`type`) | Hình | Thuộc tính |
|---|---|---|
| `zone` | Chữ nhật | `beasts` (mã loài, có thể kèm trọng số: `phong_lang:3,man_da_la_xa:1`), `years` (`300-700`; thiếu thì tung bậc theo `weights`, cách cũ), `count`, `hint`; tên vùng dùng cho tiên thảo và mục tiêu nhiệm vụ |
| `portal` | Chữ nhật | `to` (`mapId` đích), `arrive` (tên điểm ở bản đồ đích), `level` (`10-30`), `boat` (bool, bến thuyền) |
| `arrive` | Điểm | Tên duy nhất trong bản đồ; phải nằm ngoài mọi vùng `portal` |
| `spawn` | Chữ nhật | Điểm hồi sinh / trại cổng |
| `safe` | Chữ nhật | Vùng an toàn trong bản đồ săn |
| `elite` | Chữ nhật | `boss` (mã tinh anh trong `BOSSES`); nằm trong một `zone` |
| `boss` | Chữ nhật | `boss` (mã thú vương hoặc boss thế giới); là hang / sàn đấu và cũng là bán kính giao chiến |
| `npc` | Điểm | `npc` (mã trong `NPCS`) |

Thuộc tính sai (loài không có, cổng tới bản đồ không có, `arrive` không tồn tại hoặc nằm trong `portal`, mã NPC lạ) thì server ghi cảnh báo và bỏ object đó. `npm run map` (`tools/gen-map.mjs`) sinh lại các bản đồ và **ghi đè** bản đã sửa tay.

**Hiển thị isometric phía client** (bước 10.1)
- Server và file Tiled giữ tọa độ thế giới Descartes; client chỉ chiếu khi vẽ. `client/src/iso.ts`: `worldToScreen` / `screenToWorld` (ô logic `TILE` thành thoi `TILE_W` × `TILE_H`), độ sâu vẽ = tung độ màn hình của điểm chân (`depthAt`, tỉ lệ x + y), vòng tròn trên mặt đất thành elip (`fillGround`, `RX` / `RY`), hướng 8 phía trên màn hình (`dir8`) và hướng gần nhất của sprite 4 hướng cũ (`legacyDir`). Hằng hiển thị ở đây, không phải số cân bằng.
- `client/src/isoMap.ts` vẽ lớp `ground` thành ô thoi (ảnh ô của `tiles.png` trải lên thoi) và lớp `trees` thành khối có chiều cao vẽ bằng code (cây, thông tuyết, mái / tường nhà, lều, lửa trại, băng tinh, đá ngầm), sắp lớp theo độ sâu; chỉ tạo ảnh cho ô trong tầm camera; khối đang che chính mình thì mờ đi. Lớp `canopy` chỉ dùng ở chế độ nhìn thẳng.
- Mọi vị trí (hồn sư, hồn thú, NPC, đồ rơi, cổng, tin `fx` / `dmg`) nội suy trong tọa độ thế giới rồi chiếu; vùng báo trước, vùng chiêu, sóng, cung chém là hình thế giới chiếu ra (elip, hình bình hành). Điểm `fx` server đã trừ vài pixel ở y để nâng hiệu ứng (cách vẽ cũ) thì bám vào chân hồn sư / hồn thú ngay dưới (`GameScene.lifted`). Bản đồ nhỏ vẫn nhìn thẳng.
- Camera phóng số nguyên quanh độ phân giải nội bộ `VIEW_W` × `VIEW_H` (`pixelArt`, `roundPixels`); khi phóng 1 thì chữ trong thế giới phóng 2 cho dễ đọc; HUD là HTML nên không đổi cỡ. Sprite cũ phóng `SPR`.
- Phím / cần điều khiển theo hướng màn hình (lên = lên trên màn hình), chiếu ngược thành hướng thế giới tự do gửi trong `input {x, y, s}` (server không đổi). Bấm chọn hồn sư khác / NPC so trên tọa độ màn hình.
- `?view=topdown`: vẽ nhìn thẳng như trước (cùng đường code, ma trận chiếu khác) để so sánh / khắc phục.

**Dự đoán chuyển động phía client**
- Va chạm ô và bước đi dùng chung `shared/move.ts` (`solidGrid`, `hits`, `moveEnt`) ở cả `server/src/map.ts` và client. Client vẫn chỉ gửi hướng; server tự tính vị trí trong `tick()`.
- Client đánh số input `input {x, y, s}`; server ghi `PlayerState.seq` (số cuối đã nhận), `seqT` (số giây hướng đó đã được áp) và `spd` (tốc độ thật lúc này). Server tự dừng hướng đi thì tăng `seq`.
- `client/src/predict.ts` (`Predictor`): mỗi khung tự đi trước, mỗi lần state về thì lấy vị trí server, bỏ phần input server đã áp rồi phát lại phần còn lại; lệch nhỏ thì trượt dần, lệch lớn (bị kéo, đi cổng, hồi sinh) thì đặt thẳng. Người chơi khác và hồn thú nội suy về vị trí server.
- `?nopredict` tắt dự đoán; `?lag=<ms>` giả trễ mỗi chiều (góc màn hình ghi chế độ, khung đỏ là vị trí server). Kiểm thử không cần server: `npm run test:predict --prefix client`.

**Nhiều kênh**
- Mỗi phòng của một bản đồ là một kênh, tối đa `CHANNEL_MAX` người (`maxClients`; biến môi trường `CHANNEL_MAX` chỉ có tác dụng khi `GAME_TEST=1`, để thử). `onCreate` lấy số kênh nhỏ nhất còn trống của bản đồ (`onDispose` trả lại), ghi `MapState.channel` và metadata `channel`. Danh sách kênh đọc qua `matchMaker.query({ name: "map", mapId })` (`listChannels`).
- **Chọn kênh khi vào bản đồ** (`pickChannel`): kênh còn chỗ có nhiều đồng đội tổ đội nhất, không có thì kênh còn chỗ ít người nhất (bằng nhau thì số nhỏ hơn); mọi kênh đầy thì Colyseus mở kênh mới. Vào game: client hỏi `POST /api/channel` (trả `mapId` đang lưu và `roomId`). Đi cổng: server gửi `travel {mapId, roomId}` sau khi transaction đã commit. Client `joinById(roomId, {token, mapId})`; phòng vừa đầy / vừa đóng thì `joinOrCreate`. `onAuth` vẫn đối chiếu `map_id` trong DB với bản đồ của phòng.
- **Đổi kênh** (`channel {ch}`, `switchChannel`): kiểm tra không gục / hấp thụ / đi cổng, ngoài giao chiến, kênh khác kênh đang ở, đang mở và còn chỗ, cách lần trước `CHANNEL_CD` giây; rồi đi đúng đường đi cổng (`beginTravel` với đích là chính bản đồ này tại vị trí đang đứng), nên tiến độ chưa lưu không mất. Danh sách `channels` gửi tối đa một lần mỗi giây.
- **Không né luật đổi kênh bằng cách tự rời rồi vào kênh khác:** rời phòng không qua đường server duyệt thì tài khoản bị giữ ở kênh đó `CHANNEL_CD` giây (`leftRoom`): `onAuth` từ chối kênh khác của cùng bản đồ khi kênh cũ còn mở và còn chỗ, còn `pickChannel` đưa về đúng kênh cũ.
- Không theo kênh: tổ đội, thông báo toàn server, lịch boss. Kinh nghiệm tổ đội, ưu tiên đồ rơi, đóng góp boss chỉ trong phòng (cùng kênh).
- **Thú vương và boss thế giới:** mỗi kênh đang mở có con riêng (suất theo bản đồ ở `kingSeats`; đổi kênh không mở thêm kênh nên không sinh thêm con), nhưng mỗi khung giờ mỗi tài khoản chỉ nhận một lần (`KingSlot.claimed`) cùng giới hạn mỗi ngày ở `boss_claims`; hạ ở kênh khác trong cùng khung vẫn có kinh nghiệm, Hồn Tệ, ưu tiên hồn hoàn nhưng báo "đã nhận ở kênh khác". Tinh anh mỗi kênh hồi sinh riêng.
- **Sân Đại Đấu Hồn Trường không chia kênh:** `ArenaRoom` là phòng riêng 2 người cho mỗi trận, không nằm trong danh sách kênh, `MapState.channel` = 0 (tin `channel` bị từ chối, `channels` trả rỗng, client ẩn nhãn kênh). Rời sân thì vào lại bản đồ cũ qua `/api/channel` như vào game.

**Phòng trường đấu**
- `ArenaRoom extends MapRoom`, `define("arena", ArenaRoom)`, phòng riêng (`setPrivate`) trên sân `ARENA_MAP` (`MapRoom.onCreate` từ chối kind `arena`; `ArenaRoom` gọi thẳng `setup(mapId)`); chỉ hai tài khoản đã ghép vào được (`checkJoin`), vào bằng mã phòng. Dùng lại nguyên vòng lặp, chiến đấu, đổi võ hồn, gục của `MapRoom`; luật riêng là các pha (`wait` / `ready` / `fight` / `end`), thắng thua, Elo, thưởng, rời sân = thua.
- Móc PvP trong `MapRoom`: `foesOf` (MapRoom: không ai), `foesNear` / `nearestFoe`, `damageFoe` (nhân `ARENA.dmgMult` rồi `hurtPlayer` với `pvp`); đánh thường, mọi vùng của `runSkill`, đạn, tiên cơ đều xét thêm đối thủ.
- Message chỉ dùng ngoài trận được đăng ký lại thành từ chối (`BLOCKED`); hành động giao chiến chỉ chạy khi `phase === "fight"`. Trong sân `write` chỉ lưu túi đồ, `persistTeam` không ghi, võ hồn gục không hồi, nên bản đồ, vị trí, đội hình, võ hồn ra trận trong DB giữ như trước khi vào sân.
- **Hàng chờ** (`arenaQueue.ts`, mức tiến trình): `MapRoom` thêm người (`arenaAction`), bỏ người khi rời phòng / đi cổng; vòng ghép định kỳ chọn cặp bằng hàm thuần `arenaPairs`, mở phòng `matchMaker.createRoom("arena", {matchId})`, báo phòng bản đồ của từng người: phòng đó `freeze` người chơi như lúc đi cổng và gửi `arena {k: found, roomId}`; client rời bản đồ (`onLeave` lưu vị trí như thường) rồi vào sân; `onAuth` của sân chờ phiên ở bản đồ nhả tài khoản (`waitOldSession`) rồi mới nạp DB. Hết trận sân đóng kết nối mã 4005, client vào lại bản đồ theo `/api/me`.
- **Ghi kết quả:** mỗi người một transaction trong chuỗi lưu của chính người đó (`store.saveArena`: Elo, thành tích, lượt thắng có thưởng ở `boss_claims` loại `dau_hon_truong`, túi có phần thưởng). Trận đếm vào cặp (`arena_pairs`) một lần lúc có kết quả, trước lần ghi Elo.

**Lưu của mỗi người chơi chạy nối tiếp**
- Mỗi người chơi giữ một promise `saving`; **mọi lần ghi DB về người đó** (lưu định kỳ, `onLeave`, `onDispose`, lưu ngay sau sự kiện quan trọng, transaction đi cổng / đổi kênh, mua bán, nhận thưởng boss) đều nối vào sau promise này (`this.chain(d, fn)`), lỗi được bắt và ghi log để không gãy chuỗi. Không gọi `store.save…` trực tiếp ngoài chuỗi. Nhờ vậy mỗi thời điểm chỉ có tối đa một lần ghi và các lần ghi commit đúng thứ tự đã chụp.
- Dữ liệu chưa lưu mới phải nằm trong cả `save` **và** `saveTravel` (túi đồ: cờ `bagDirty`).
- Lớp chặn trong câu ghi: lưu `map_id` / vị trí theo chu kỳ hoặc khi rời phòng chỉ ghi khi `map_id` trong DB vẫn là bản đồ của phòng này (`UPDATE … WHERE map_id = <mapId của phòng>`).

**Đi qua cổng và lưu vị trí** (thứ tự bắt buộc khi duyệt `travel {portal}`, tránh đua ghi giữa phòng cũ và phòng mới)
1. Server kiểm tra như mục 5.3. Không hợp lệ thì báo lỗi, dừng.
2. Đánh dấu client **đang chuyển bản đồ** (`travelling`, `freeze`): phòng cũ bỏ qua input, đánh, hồn kỹ, hấp thụ, đổi võ hồn và `travel` tiếp theo; hồn thú bỏ mục tiêu; đạn đang bay bị xóa; `damageBeast` bỏ qua người này. Lưu định kỳ cũng bỏ qua người này.
3. **`await` lần lưu đang chạy** (chuỗi `saving`), rồi lưu đầy đủ trong **MỘT transaction** (`saveTravel`): võ hồn, túi đồ và mọi dữ liệu chưa lưu, cùng `map_id` = bản đồ đích và tọa độ `arrive`. **Hoặc ghi hết, hoặc không ghi gì** (`PgStore`: một kết nối, `BEGIN` → `UPDATE` → `COMMIT`, lỗi thì `ROLLBACK`; `MemoryStore`: kiểm tra xong mới gán mọi trường trong một hàm đồng bộ).
4. Commit xong mới gửi riêng `travel {mapId, roomId}`. **Lưu lỗi** thì không gửi `travel`, bỏ cờ, báo "Không chuyển được bản đồ, thử lại"; người chơi ở lại và phòng cũ lưu bình thường.
5. Client rời phòng và vào phòng mới; không rời trong `TRAVEL_LEAVE_SECS` giây thì server ngắt kết nối.
- `onLeave` của client đang chuyển bản đồ **nối vào chuỗi `saving`** và đọc kết quả transaction (`travelled`), không đọc cờ: đã commit thì không ghi gì; lưu lỗi thì lưu như `onLeave` thường (có lớp chặn `WHERE map_id`).
- Phòng mới chỉ nạp nhân vật sau commit (`onAuth` chỉ nhận khi `map_id` trong DB đã là bản đồ đích; sai thì từ chối, client hỏi lại `/api/me`), nên không có bản cũ ghi đè bản mới.
- Bản đồ có `MapDef.exit` (Lõi Tinh Đấu): lần ghi cuối khi rời phòng (`write(id, true)`) dùng `saveTravel` về `arrive` của cổng tới `exit`.

**Mỗi tài khoản một phiên** trên mọi phòng
- `onJoin` phát `kick {accountId, sessionId}` qua presence; mọi phòng đá client trùng tài khoản khác phiên đó (mã 4001).
- **Phiên mới chỉ nạp DB sau lần ghi cuối của phiên cũ:** phiên giữ tài khoản ghi trong hash presence `accountHold`; `onLeave` / `onDispose` chỉ xóa sau khi lần ghi cuối trong chuỗi `saving` xong. `onAuth`, trước mọi lần đọc DB, thấy tài khoản đang có phiên giữ thì phát `kick` rồi chờ phiên đó nhả (`waitOldSession`, có hạn; quá thì từ chối, không nạp bản cũ).
- **Client rời phòng thì dừng tiến độ ngay** (`onLeave` gọi `freeze` và hủy hấp thụ dở trước khi nối lần ghi cuối), để hấp thụ xong hay đạn hạ hồn thú không cộng vào sau khi đã chụp dữ liệu.

**Thông báo toàn server và lịch boss**
- Presence của Colyseus: phòng `publish("announce", {text, col})`, mọi `MapRoom` subscribe trong `onCreate` rồi `broadcast("chat")`. Một tiến trình dùng presence trong bộ nhớ; nhiều tiến trình thì đổi sang `RedisPresence` (khi đó các trạng thái mức tiến trình bên dưới cũng phải chuyển sang presence).
- Lịch thú vương và boss thế giới ở `server/src/schedule.ts` (`startSchedule`): chỉ đếm giờ Việt Nam và `publish("boss", {mapId, king, phase: "warn" | "spawn", slot, in, life})`. Sinh boss, máu, chiêu, thưởng nằm trong `MapRoom` (`onBossEvent`, `spawnKing`). Phòng mở ra trong khung boss cũng sinh (`kingActive`, `worldActive`); phòng mở ra trong lúc báo trước vẫn có đếm ngược (`kingWarns`).
- **Trạng thái thú vương giữ theo bản đồ ở mức tiến trình** (`kingSeats`), không theo phòng: mỗi khung đã sinh có danh sách suất, mỗi kênh giữ tối đa một suất (còn sống / đã hạ / đã rút). Phòng bị hủy trả suất; phòng mở lại trong khung nhận lại suất trống trước. Suất đã hạ / rút thì không sinh lại; còn sống thì sinh lại đầy máu ở giai đoạn 1 với thời gian còn lại. Nhờ vậy rời bản đồ cho phòng hủy rồi quay lại không có con mới.
- **Đồng hồ khi kiểm thử:** mọi chỗ đọc lịch và ngày nhận thưởng đi qua `bossNow` / `bossOffset`. Không bật `GAME_TEST` thì là đồng hồ thật; bật `GAME_TEST=1` thì theo `BOSS_CLOCK`: chưa đặt = đứng yên ở 12:00 giờ Việt Nam của ngày bật server (lịch thật không chen vào bài thử của bot), `HH:MM` = chạy từ giờ đó, `real` = đồng hồ thật.
- Lượt nhận thưởng mỗi ngày lưu ở `boss_claims` (tài khoản, ngày Việt Nam, loại: thú vương, boss thế giới, thắng đấu trường; số lần).

**Dữ liệu trong `shared/data.ts`** (server và client cùng import; mã cố định không bao giờ đổi, thêm phần tử mới vào cuối mảng vì chỉ số dùng để đồng bộ): `MAPS`, `BEASTS`, `BEAST_SKILLS`, `BOSSES`, `VOHON`, `VOHON_SKILLS`, `VOHON_SKILLS_HIGH`, `TIEN_CO_RIENG`, `CHAN_THAN`, `BONDS`, `STATUS`, `BUFFS`, `ITEMS`, `HERBS`, `CORE_SETS`, `BONE_SKILLS`, `NPCS`, `QUESTS`, `RESONANCE`, `ARENA` và mọi hằng số cân bằng. Cấp tương đương tính bằng hàm từ `RING_LIMIT`, không lưu bảng riêng.

**Dữ liệu lâu dài** trong PostgreSQL / Supabase (`server/sql/`, mỗi file `00N_….sql` với `CREATE TABLE IF NOT EXISTS` và bật RLS; `PgStore.init()` chạy mọi file theo tên mỗi lần khởi động). Không có `DATABASE_URL` thì dùng `MemoryStore` (RAM). Bảng chính:
- `accounts` (tài khoản, ngoại hình, võ hồn ra trận, `map_id` + `pos_x` / `pos_y`, `bag_slots`, Hồn Tệ), `sessions`.
- `vohons` (võ hồn sở hữu: cấp, kinh nghiệm, sao, hồn hoàn theo số năm, `skills` 4 ô mang theo, `herbs`), `teams` (mỗi ô đội hình một dòng).
- `items` (mỗi món một id: loại, mã, số lượng, số năm, sao, cấp cường hóa, `stats` JSONB, `vohon_id` đang gắn).
- `boss_claims` (lượt nhận thưởng mỗi ngày), `quests` (tiến độ nhiệm vụ, ghi cùng transaction với túi), `arena_ratings` (Elo, thắng / thua / hòa), `arena_pairs` (số trận mỗi cặp mỗi ngày).
- `characters`, `inventory` (từ `001_init.sql`) là bảng cũ, giữ lại để chuyển dữ liệu, không còn ghi.

**Bảo mật:** giới hạn đăng nhập sai, chat và lời mời tổ đội ở `server/src/ratelimit.ts` (RAM). Deploy sau proxy thì đặt `TRUST_PROXY=1`. Kiểm thử: `npm run test:ratelimit --prefix server`.

## 7. Lộ trình
Mỗi gạch đầu dòng là một lần giao việc. Xong một bước thì chạy `npm run check` và bot, cập nhật mục thiết kế tương ứng rồi đánh dấu [x] (hoặc bỏ dòng nếu đã gộp vào luật ở mục 5).

**Đã có** (Giai đoạn 2–9 và nhóm Bản đồ BĐ1–BĐ6 đã merge): mô hình sưu tầm 24 võ hồn với đội hình 4 ô, đổi tay, năng lượng và tiên cơ riêng, hồn kỹ riêng vòng 1–10, Võ Hồn Chân Thân và hồn kỹ Chân Thân, ràng buộc, sao; túi đồ, Hồn Tệ, hồn hoàn theo số năm và hấp thụ theo giới hạn truyện; hồn cốt (rơi, gắn, kỹ năng, cường hóa) và hồn hạch (rơi, gắn, bộ, nâng cấp); 10 bản đồ nối cổng / bến thuyền với tinh anh, tà hóa thú vương theo lịch, boss thế giới ở Lõi Tinh Đấu; NPC, thương nhân (đan lớn, mở rộng túi, mua lại), lò rèn, nhiệm vụ tân thủ; tổ đội (chia kinh nghiệm, lan hiệu ứng phụ trợ, đóng góp hỗ trợ, Phục Chế chép đồng đội); Đại Đấu Hồn Trường xếp hạng Elo có chống dàn xếp; cộng minh; tiên thảo; tạo nhân vật với 3 tông da; nhiều kênh; dự đoán chuyển động; giới hạn đăng nhập sai và chat; dây chuyền asset và ảnh PixelLab cho 8 bộ hồn sư, 3 phụ thể, 3 loài hồn thú.

**Mỹ thuật: thay sprite vẽ bằng code** (quy cách ở mục 5.11; làm song song, không chặn việc khác). Lượt PixelLab đã hết: phần còn lại làm bằng dịch vụ self-host (chưa chọn).
- [x] M1 Nền tảng: `art/palette.gpl`, `art/CREDITS.md`, `sprites/manifest.json`; client tải ảnh theo manifest, tạo animation theo chỉ số khung cố định; key còn thiếu vẽ bằng code.
- [ ] M2 Hồn sư: thân nam và nữ, 4 kiểu tóc mỗi giới, áo hồn sư; đủ 3 hướng và 7 animation.
  *Đã có:* 8 bộ `hs_{body,outfit,hair}_{m,f}_{0–3}` ảnh PixelLab, 3 hướng, `idle` + `walk` (walk của kiểu tóc 1–3 ghép bằng code từ bộ 0). *Còn:* `attack` / `cast` / `hurt` / `die` / `absorb` của mọi bộ (đang chép tạm idle), walk vẽ riêng cho kiểu tóc 1–3, vẽ lại nữ kiểu 2 (nhìn sau giống tóc thả), nam kiểu 1 mái che gần hết mặt ở hướng phải.
- [ ] M3 Lớp phụ thể: Lam Ngân Thảo và 4 võ hồn mẫu (mỗi hệ một: Hạo Thiên Chùy, U Minh Linh Miêu, Bích Lân Xà Hoàng, Cửu Bảo Lưu Ly Tháp), rồi các võ hồn còn lại.
  *Đã có:* `vh_lam_ngan_thao` (bản thử: thảm dây dưới chân, chưa có dây quấn tay), `vh_hao_thien_chuy` (búa theo bảng góc `HAMMER` của `honsuArt.ts`), `vh_cuu_bao_luu_ly_thap` (chưa có vòng sáng 7 màu). *Còn:* U Minh Linh Miêu, Bích Lân Xà Hoàng và các võ hồn còn lại.
- [ ] M4 Hồn thú: vẽ theo từng loài ở mục 5.3 (bảng kích thước theo bậc ở 5.11); tinh anh dùng sprite loài gốc kèm aura; thú vương khoảng 96×96; sprite riêng cho 2 boss thế giới.
  *Đã có:* `beast_phong_lang`, `beast_man_da_la_xa`, `beast_tu_van_bao` (vùng Bìa rừng, đủ 13 khung; Mạn Đà La Xà nên vẽ lại `walk` / `attack` / `die`). GameScene mới dùng `idle` / `walk` vì server chưa gửi trạng thái đánh / bị đánh / gục của hồn thú. *Còn:* mọi loài khác (Lạc Nhật, Cực Bắc, Hải Thần Đảo…), tinh anh, thú vương, boss thế giới.
- [ ] M5 Giao diện thẻ võ hồn: chân dung 64×64 cho 24 võ hồn, khung thẻ SR / SSR / UR, biểu tượng 4 hệ.
- [ ] Áo hồn sư kiểu khác (đồng phục Sử Lai Khắc, áo Vũ Hồn Điện): cần thêm chỉ số kiểu áo vào key lớp áo (mục 5.11).

**Giai đoạn 10: Đồ họa isometric** (server không đổi)
- [x] 10.1 Nền client isometric: chiếu / chiếu ngược, camera phóng số nguyên quanh 640×360, bản đồ thoi và khối vẽ tạm bằng code, sắp lớp theo độ sâu, bóng elip, vùng chiêu elip, input theo màn hình, `?view=topdown` (mục 6 "Hiển thị isometric phía client").

**Việc để sau** (chưa có bước cụ thể; nhận việc thì tách thành bước nhỏ)
- [ ] Nhiệm vụ hằng ngày ở Sử Lai Khắc Học Viện (Phất Lan Đức; dùng lại bảng `quests` với mã chuỗi mới, đặt lại theo ngày); chỉ đường / chấm nhiệm vụ trên bản đồ nhỏ.
- [ ] Thương nhân lưu động ở trại cổng bản đồ săn.
- [ ] Vùng an toàn hồi sinh lực / hồn lực nhanh hơn ngoài rừng; chuyển các số hồi sinh lực đang viết thẳng trong `MapRoom.tick` vào `shared/data.ts`.
- [ ] Xếp hàng Đại Đấu Hồn Trường cả tổ đội (2v2…); cân bằng PvP riêng (hệ số theo hệ, hiệu ứng bộ hồn hạch lên hồn sư); xem trận.
- [ ] Tổ đội: hiệu ứng bộ hồn hạch, kỹ năng hồn cốt và thanh tẩy cho đồng đội.
- [ ] Cộng minh: cộng hiệu ứng khác ngoài sinh lực / hồn lực / công; mốc theo sao võ hồn; bảng xếp hạng cộng minh.
- [ ] Hồn thú: chỉ số thủ (để Phá giáp / xuyên thủ thành giảm thủ thật); trạng thái Mê hoặc / đóng băng riêng trên hồn sư; "đứng yên" cho Thực Nhân Hoa, Quỷ Đằng, Cổ Mộc Thụ Nhân.
- [ ] Cơ chế đầy đủ của thú vương thay bản tối thiểu: hang chia nửa băng / lửa đổi chỗ (Lưỡng Nghi), tầng Hàn và Hỏa Đàn (Cực Hàn), vùng ngập luân phiên (Thủy Triều Dâng), bọc trứng nở nhện con (Vạn Chu Phệ); vũng độc / sương độc lưu lại; che tầm nhìn (Phun Mực).
- [ ] Boss thế giới: chiêu toàn sàn né được, vị trí nổi lên của Du Thủy có báo trước, lặn ra giữa hồ.
- [ ] Đóng góp boss theo tài khoản thay vì theo phiên (thoát vào lại / đổi kênh không mất đóng góp); giới hạn săn tinh anh nhiều kênh.
- [ ] Chạy nhiều tiến trình: `RedisPresence`, chuyển số kênh, `kingSeats`, `kingWarns`, hàng chờ đấu trường, tổ đội, khóa đổi kênh sang presence; dọn phiên giữ tài khoản của tiến trình chết.
- [ ] Bot thử thêm: bán hồn hoàn đang hấp thụ, trận hòa và hết lượt thưởng đấu trường, ngắt kết nối khi đã ghép mà không rời bản đồ; thử giao diện bằng tay trên điện thoại thật.

## 8. Câu hỏi còn mở
Các câu hỏi thiết kế trước đây đều đã chốt và đưa vào mục 5. Còn mở:
1. **Dịch vụ self-host cho mỹ thuật còn lại** (M2–M5): chọn công cụ nào, chất lượng có giữ được phong cách của ảnh PixelLab đã có không.
2. **Trần số người khi tính máu boss:** hiện không có trần (nhóm bạn bè ít người); xem lại nếu phòng đông làm boss quá trâu.
3. **Chủ nhân và tên hồn kỹ trong truyện** của Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa, Hỏa Ảnh, Thiên Càn Bạch Ngọc Đỉnh, Phá Hồn Thương, Liệt Hỏa Thương Lang: để trống / đặt tạm cho tới khi có nguồn chắc chắn.
