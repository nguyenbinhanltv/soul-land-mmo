# Rừng Săn Hồn (Đấu La Đại Lục) – Tài liệu thiết kế

> File này để con người và AI cùng đọc. Mỗi khi nhờ AI thêm tính năng, hãy bảo nó đọc file này trước
> và cập nhật lại khi luật chơi thay đổi. Mục có nhãn **(chờ chốt)** là phương án mặc định, có thể đổi.

## 1. Ý tưởng và phạm vi
MMO thế giới mở pixel 2D trên trình duyệt, lấy bối cảnh **Đấu La Đại Lục**, cơ chế tham khảo game *Đấu La Đại Lục: Thế Giới Săn Hồn*.
Người chơi **sưu tầm võ hồn**, lập đội võ hồn, vào rừng săn hồn thú để farm hồn hoàn, hồn cốt và hồn hạch, rồi nuôi đội mạnh dần.

- Dự án phi thương mại, chỉ chơi cùng bạn bè. **Được dùng đúng tên nhân vật, võ hồn, hồn thú và địa danh trong truyện.**
- Không có nạp tiền hay thể lực: mọi thứ kiếm được bằng cách chơi.

## 2. Nguyên tắc thiết kế
- **Vòng chơi chính:** farm hồn thú → nhặt hồn hoàn, hồn cốt, hồn hạch → võ hồn lên cấp và chạm bình cảnh → hấp thụ hồn hoàn hợp giới hạn → mạnh hơn → vào vùng sâu hơn.
- **Hồn hoàn là nguyên liệu quý:** hấp thụ vượt giới hạn thì có thể mất trắng. Người chơi phải cân nhắc dùng ngay hay farm tiếp hồn hoàn tốt hơn.
- **Đội hình quan trọng hơn một võ hồn mạnh:** phối 4 hệ (cường công, mẫn công, khống chế, phụ trợ), theo một lưu phái (thiêu đốt, cảm điện, chấn đãng…) và đổi võ hồn đúng lúc.
- **Thế giới mở, nhiều người cùng thấy nhau** trên một bản đồ.
- **Thua không mất đồ:** không bao giờ mất võ hồn, hồn hoàn đã hấp thụ, hồn cốt hay hồn hạch đang gắn.

## 3. Mô hình chơi
- **Người chơi (hồn sư) không có võ hồn riêng.** Người chơi chỉ điều khiển các **võ hồn sưu tầm được**. Mỗi võ hồn là một đơn vị nuôi riêng, có hình dạng nhân vật truyện đại diện (ví dụ Lam Ngân Thảo mang hình Đường Tam).
- **Đội hình 4 võ hồn** (chờ chốt). Trên bản đồ chỉ hiện võ hồn đang ra trận; đổi sang võ hồn khác trong đội ngay khi đang đánh.
- **Mỗi võ hồn có 10 hồn hoàn**, ứng với cấp 1–100: bình cảnh ở cấp 10, 20, …, 100.
- **Niên hạn tối đa: 10 vạn năm (100.000 năm).**
- Thế giới mở thời gian thực, tất cả người chơi cùng một bản đồ.

## 4. Luật cốt lõi đã làm (bản cũ, sẽ thay dần)
Đây là những gì code đang chạy. Mục ghi ➜ sẽ bị thay ở giai đoạn tương ứng.

- **Thức tỉnh**: server chọn ngẫu nhiên 1 võ hồn SSR và hồn lực bẩm sinh 1–10 (= cấp khởi đầu). ➜ GĐ2.2: tặng Lam Ngân Thảo + tự chọn 1 SSR.
- **Bình cảnh**: cứ đến cấp 10, 20, 30… là kinh nghiệm dừng lại, phải hấp thụ hồn hoàn mới lên tiếp. *Giữ nguyên.*
- **Niên hạn**: 5 bậc cố định 10 / 100 / 1.000 / 10.000 / 100.000 năm. ➜ GĐ3: thay bằng số năm cụ thể.
- **Giới hạn hấp thụ**: theo bậc; vượt 1 bậc thì 60% thất bại, mất 70% máu. ➜ GĐ3: thay bằng giới hạn theo truyện, thất bại thì mất hồn hoàn.
- **Hấp thụ**: mất 2,5 + 0,8 × tier giây. Di chuyển hoặc bị đánh là hủy. *Giữ cơ chế bị gián đoạn.*
- **Hồn hoàn rơi**: 15 giây đầu chỉ người hạ hồn thú nhặt được, tồn tại 60 giây. *Giữ luật ưu tiên.*
- **Hồn kỹ**: vòng 1–4 mở 4 hồn kỹ dùng chung. ➜ GĐ2: hồn kỹ riêng cho từng võ hồn.
- **Chết**: mất 30% kinh nghiệm, hồi sinh ở doanh trại sau 2,5 giây. ➜ GĐ2: luật chết mới (mục 5.1).
- **Vùng**: bản đồ chia vùng theo chiều đông, càng sâu càng mạnh (layer `zones` của Tiled). *Giữ nguyên.*
- **Multiplayer**: thấy nhau, chat, cùng săn, tranh hồn hoàn. *Giữ nguyên.*

Mọi con số cân bằng nằm trong `shared/data.ts`. Các con số trong file này là đề xuất, chốt khi code.

## 5. Thiết kế các hệ thống

### 5.1 Võ hồn và đội hình
**Thuộc tính của mỗi võ hồn đang sở hữu:** cấp (1–100), kinh nghiệm, sao (1–6), 10 ô hồn hoàn, 6 ô hồn cốt, 6 ô hồn hạch.

**4 hệ** (biểu tượng ở góc thẻ võ hồn):
- **Cường công:** sát thương chính, thường diện rộng hoặc bùng nổ.
- **Mẫn công:** nhanh, cơ động, đánh liên tục hoặc lao vào hàng sau.
- **Khống chế:** choáng, trói, gom quái, gây dễ thương hoặc trúng độc.
- **Phụ trợ:** hồi máu, khiên, tăng chỉ số, hồi hồn lực, thanh tẩy.

**Trạng thái dùng chung** (các lưu phái xoay quanh chúng):

| Trạng thái | Hiệu ứng |
|---|---|
| Thiêu đốt | Mất máu theo thời gian, cộng dồn tầng. *Viêm bạo* kích nổ toàn bộ tầng cùng lúc. |
| Cảm điện | Đánh trúng mục tiêu cảm điện thì lan sát thương sang kẻ địch cảm điện gần đó. |
| Trúng độc | Mất máu theo thời gian, cộng dồn, giảm hồi máu. |
| Dễ thương | Nhận thêm sát thương từ mọi nguồn. |
| Liệt thương / Phá giáp | Giảm thủ. |
| Choáng / Câm lặng / Mê hoặc / Trói | Khống chế: không đánh, không dùng kỹ năng, đi lung tung, hoặc không di chuyển. |

**Võ hồn SSR cơ bản** (17 võ hồn, theo game tham khảo):

| Võ hồn | Hệ | Chủ nhân trong truyện | Lối đánh và cơ chế chính | Lưu phái |
|---|---|---|---|---|
| Cửu Tinh Thất Sát Kiếm | Cường công | Kiếm Đấu La Trần Tâm | Vô Ngã Kiếm Trận gây sát thương diện rộng liên tục; gây Liệt thương; tuyệt kỹ Kiếm Trảm Sơn Hà | Phá giáp |
| Lam Điện Bá Vương Long | Cường công | Ngọc Thiên Hằng (Lam Điện Bá Vương Long Tông) | Sấm sét diện rộng gây Cảm điện; tích Phong Lôi Chi Lực, đầy thì tung Lôi Động Minh Thiên, ngắt chiêu boss | Cảm điện (lõi) |
| Kỳ Nhung Thông Thiên Cúc | Cường công | Cúc Đấu La Nguyệt Quan | Cánh hoa sát thương liên tục và hạn chế di chuyển; lấp khoảng hồi chiêu cho võ hồn bùng nổ | Thiêu đốt / Phá giáp |
| Tà Hỏa Phượng Hoàng | Cường công | Mã Hồng Tuấn | Bay, thiêu đốt diện rộng; trong lãnh vực phượng hoàng địch nhận thêm 30% sát thương | Thiêu đốt (lõi) |
| U Minh Linh Miêu | Mẫn công | Chu Trúc Thanh | Tốc độ cao, chí mạng cao, cào liên hoàn; tuyệt kỹ U Minh Bách Trảo | Chấn đãng |
| Nguyệt Nhận | Mẫn công | Tà Nguyệt (Hoàng Kim Nhất Đại, Vũ Hồn Điện) | Lướt xuyên hàng trước, khóa và hạ mục tiêu yếu máu ở hàng sau | Thiêu đốt / Phá giáp |
| Hỏa Long | Mẫn công | Hỏa Vô Song | Đánh tầm xa phạm vi rộng, khó trượt; Viêm bạo kích nổ thiêu đốt rồi đặt lại 1 tầng | Thiêu đốt |
| Nhu Cốt Thố | Mẫn công | Tiểu Vũ | Lướt, quật ngã, tăng chí mạng, hút máu; ràng buộc chí mạng với Hạo Thiên Chùy | Chấn đãng |
| Kim Vũ Miêu Ưng | Mẫn công | *(chưa xác định)* | Bay, vuốt gây tê liệt: co giật 3 giây, câm lặng 5 giây; áo nghĩa phủ Cảm điện toàn vùng | Cảm điện |
| Tử Vong Chu Hoàng | Khống chế | Bỉ Bỉ Đông (võ hồn thứ hai) | Giăng tơ gom quái, độc nhện khống chế | Trúng độc / Cảm điện |
| Bích Lân Xà Hoàng | Khống chế | Độc Đấu La Độc Cô Bác | Trúng độc cộng dồn, câm lặng diện rộng; tuyệt kỹ Vạn Xà Phệ Tâm bỏ qua thủ, hút máu | Trúng độc (lõi) |
| Càn Khôn Hỗn Nguyên Tỏa | Khống chế | *(chưa xác định)* | Bay tới tạo vùng phong tỏa, giam và gây sát thương liên tục; cộng dồn gây Dễ thương 6,8 giây | Cảm điện |
| Hỏa Ảnh | Khống chế | *(chưa xác định, có thể là Hỏa Vũ)* | Choáng, thiêu đốt, đẩy lùi; gây Dễ thương cho đồng đội đánh | Thiêu đốt |
| Yêu Hồ | Khống chế | Hồ Liệt Na (Hoàng Kim Nhất Đại, Vũ Hồn Điện) | Mê hoặc cộng dồn, ảo ảnh tàng hình, lãnh vực làm chậm, ngắt chiêu | Cảm điện |
| Xúc Xích (Hương Tràng) | Phụ trợ | Áo Tư Tạp | Hồi hồn lực, giải khống chế, xúc xích bay; áo nghĩa Phục Chế Hương Tràng sao chép kỹ năng đồng đội | Cảm điện |
| Quỷ Mị | Phụ trợ | Quỷ Đấu La (Vũ Hồn Điện) | Biến sát thương gây ra thành hồi máu, tăng sát thương đội; tuyệt kỹ Quỷ Ảnh Trùng Trùng tàng hình cả đội để né đòn | Đội bùng nổ |
| Thiên Càn Bạch Ngọc Đỉnh | Phụ trợ | *(chưa xác định)* | Hồi máu và khiên; xóa buff địch, thanh tẩy đội; kỹ năng Tịnh Thế Lưu Ly | Đánh boss |

**Võ hồn ngoài danh sách SSR cơ bản** (có trong game tham khảo, độ hiếm chờ chốt):
- **Lam Ngân Thảo** (Đường Tam, khống chế): gom quái, tuyệt kỹ kéo cả vùng lại và giam. Tặng từ đầu game.
- **Hạo Thiên Chùy** (Đường Hạo, cường công): sát thương theo % máu, Loạn Phi Phong Chùy Pháp kết thúc bằng hất tung.
- **Cửu Bảo Lưu Ly Tháp** (Ninh Vinh Vinh, phụ trợ): tăng công, thủ, tốc; giảm tiêu hao hồn lực; tuyệt kỹ Vô Địch Thần Quang cho cả đội miễn sát thương.
- Phá Hồn Thương, A Ngân, Liệt Hỏa Thương Lang, Băng Phượng Hoàng.

**Ràng buộc** (chờ chốt): một số cặp võ hồn trong cùng đội có thêm hiệu ứng. Ví dụ Hạo Thiên Chùy + Nhu Cốt Thố tăng chí mạng; Tà Hỏa Phượng Hoàng + Hỏa Ảnh tăng thiêu đốt.

**Lưu phái đội hình mẫu:**
- **Thiêu đốt:** Tà Hỏa Phượng Hoàng + Hỏa Long + Hỏa Ảnh + Cửu Bảo Lưu Ly Tháp.
- **Cảm điện:** Lam Điện Bá Vương Long + Kim Vũ Miêu Ưng + Càn Khôn Hỗn Nguyên Tỏa + Xúc Xích. Phủ Cảm điện toàn vùng rồi đổi sang Lam Điện Bá Vương Long để kích nổ.
- **Chấn đãng (bùng nổ vật lý):** Hạo Thiên Chùy + Nhu Cốt Thố + Lam Ngân Thảo + Quỷ Mị.
- **Trúng độc:** Bích Lân Xà Hoàng + Tử Vong Chu Hoàng + Nguyệt Nhận + Thiên Càn Bạch Ngọc Đỉnh.

**Sưu tầm võ hồn** (chờ chốt, vì không có gacha):
- Khi tạo tài khoản, Tố Vân Đào làm lễ thức tỉnh: nhận Lam Ngân Thảo và **tự chọn 1 võ hồn SSR** trong danh sách.
- Các võ hồn khác mở bằng **mảnh võ hồn**: rơi từ hồn thú (mỗi vùng rơi mảnh của 2–3 võ hồn), tà hóa thú vương và nhiệm vụ. Đủ 50 mảnh thì mở võ hồn.
- Mảnh dư dùng để **lên sao** (1★ → 6★, cần 20 / 40 / 80 / 120 / 200 mảnh). Mỗi sao tăng chỉ số gốc và mở thêm hiệu ứng cho hồn kỹ.

**Trong trận:**
- Phím đổi võ hồn chuyển ngay sang võ hồn khác trong đội, mỗi lần đổi hồi 3 giây.
- **Năng lượng tiên cơ:** đánh trúng thì tích năng lượng. Võ hồn đủ năng lượng khi được đổi vào sẽ tung **chiêu tiên cơ** ngay lúc xuất hiện. Đây là kỹ thuật nối combo chính.
- Võ hồn đang ra trận gục thì tự đổi sang võ hồn còn sống. Võ hồn đã gục chỉ hồi lại ở doanh trại hoặc sau 60 giây ngoài trận.
- Cả đội gục thì về doanh trại, không mất kinh nghiệm hay đồ (chờ chốt).

**Kinh nghiệm:** chia cho cả 4 võ hồn trong đội; võ hồn đang ra trận nhận 40%, mỗi võ hồn còn lại 20% (chờ chốt). Võ hồn đang ở bình cảnh thì không nhận, phần đó không chia lại.

**Danh hiệu** theo cấp của võ hồn đang ra trận, hiện trên đầu nhân vật:

| Cấp | Danh hiệu | | Cấp | Danh hiệu |
|---|---|---|---|---|
| 1–10 | Hồn Sĩ | | 51–60 | Hồn Vương |
| 11–20 | Hồn Sư | | 61–70 | Hồn Đế |
| 21–30 | Đại Hồn Sư | | 71–80 | Hồn Thánh |
| 31–40 | Hồn Tôn | | 81–90 | Hồn Đấu La |
| 41–50 | Hồn Tông | | 91–100 | Phong Hào Đấu La |

### 5.2 Hồn hoàn
**Niên hạn là số năm cụ thể.** Mỗi hồn thú có tuổi ngẫu nhiên trong bậc của nó, và hồn hoàn rơi ra mang đúng số năm đó (ví dụ 437 năm).

| Màu | Khoảng năm |
|---|---|
| Trắng | 10 – 99 |
| Vàng | 100 – 999 |
| Tím | 1.000 – 9.999 |
| Đen | 10.000 – 99.999 |
| Đỏ | 100.000 (tối đa) |

**Hồn hoàn là vật phẩm:** hạ hồn thú thì hồn hoàn rơi xuống đất; 15 giây đầu chỉ người hạ nhặt được. Nhặt vào túi đồ rồi chọn võ hồn để hấp thụ.

**Giới hạn hấp thụ theo truyện** (lý thuyết của Đại Sư; vòng 5+ cần đối chiếu lại với truyện):

| Vòng | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Tối đa (năm) | 423 | 764 | 1.760 | 5.000 | 12.000 | 20.000 | 50.000 | 100.000 | 100.000 | 100.000 |

**Hấp thụ:**
- Chỉ hấp thụ khi võ hồn đang ở bình cảnh, và không đang đánh nhau.
- Thời gian hấp thụ tăng theo niên hạn, từ 3 giây (trắng) đến 15 giây (đỏ). Di chuyển hoặc bị đánh thì hủy, nhưng không mất gì.
- Trong giới hạn: luôn thành công.
- Vượt giới hạn: có tỉ lệ thất bại (chờ chốt):

| Vượt giới hạn | ≤ 25% | ≤ 50% | ≤ 100% | > 100% |
|---|---|---|---|---|
| Tỉ lệ thất bại | 30% | 60% | 90% | Không cho hấp thụ |

- **Thất bại thì mất hồn hoàn đó** (mất nguyên liệu), ngoài ra không bị phạt gì thêm.
- Thành công: võ hồn lên 1 cấp, nhận hồn kỹ của vòng đó. Sức mạnh hồn kỹ tăng theo số năm của hồn hoàn.

**Hồn kỹ theo vòng:**
- Vòng 1–6: mỗi vòng mở 1 hồn kỹ riêng của võ hồn. Mang tối đa 4 hồn kỹ chủ động, chọn từ các hồn kỹ đã mở.
- Vòng 7: **Võ Hồn Chân Thân**, biến hình trong một thời gian, tăng mạnh chỉ số.
- Vòng 8–9: hồn kỹ mạnh, đổi một ô chủ động.
- Vòng 10: tuyệt kỹ cuối của võ hồn (chờ chốt).

### 5.3 Hồn thú và vùng săn
Bản đồ hiện tại là **Tinh Đấu Đại Sâm Lâm**, chia vùng từ tây sang đông:

| Vùng | Niên hạn | Hồn thú tiêu biểu |
|---|---|---|
| Rìa rừng (gần doanh trại) | 10 – 400 năm | Nhu Cốt Thỏ hoang, Phong Lang |
| Rừng ngoài | 300 – 2.000 năm | Mạn Đà La Xà, Quỷ Đằng, Quỷ Hổ |
| Rừng giữa | 1.500 – 20.000 năm | Nhân Diện Ma Chu, U Minh Lang Vương |
| Rừng sâu | 10.000 – 60.000 năm | Ám Kim Khủng Trảo Hùng |
| Lõi rừng (hồ trung tâm) | 50.000 – 100.000 năm | Thái Thản Cự Viên, Thiên Thanh Ngưu Mãng |

- Chỉ số hồn thú tăng theo số năm, không chỉ theo màu.
- **Chiêu có báo trước:** hồn thú từ 1.000 năm trở lên có chiêu đặc biệt, hiện vùng cảnh báo khoảng 0,8 giây. Ví dụ: Mạn Đà La Xà phun độc thành vệt dài, Ám Kim Khủng Trảo Hùng vỗ đất đánh vòng tròn.
- Mỗi lúc chỉ có tối đa 1 hồn thú 100.000 năm trên bản đồ.
- **Rơi đồ dựa vào farm:** mỗi lần hạ hồn thú, mỗi loại đồ được tung tỉ lệ riêng (bảng `DROPS` trong `data.ts`). Hồn thú năm càng cao thì tỉ lệ rơi đồ tốt càng cao.

| Hồn thú | Hồn hoàn | Hồn cốt | Hồn hạch | Mảnh võ hồn |
|---|---|---|---|---|
| < 1.000 năm | 100% | 0% | 15% (1–2★) | 10% |
| 1.000 – 9.999 | 100% | 1% | 25% (2–4★) | 15% |
| 10.000 – 99.999 | 100% | 4% | 40% (3–5★) | 20% |
| 100.000 | 100% | 20% | 100% (5–6★) | 100% |

**Bản đồ mới về sau:** Lạc Nhật Sâm Lâm (hồn thú thực vật, tiên thảo), Cực Bắc Chi Địa (hồn thú băng), Hải Thần Đảo (hồn thú biển).

### 5.4 Tà hóa thú vương (boss)
- Hồn thú biến dị mạnh gấp 5–8 lần hồn thú cùng niên hạn, có 2–3 chiêu riêng kèm vùng cảnh báo.
- Xuất hiện theo lịch, ví dụ 20:00 và 22:00. Thông báo cho toàn server trước 5 phút.
- **Phần thưởng:** người gây nhiều sát thương nhất được ưu tiên hồn hoàn. Mọi người tham gia (gây ít nhất 3% sát thương) đều nhận rương: hồn cốt, hồn hạch sao cao, mảnh võ hồn.
- Mỗi người nhận thưởng boss tối đa **3 lần/ngày**.

### 5.5 Hồn cốt
- **6 vị trí trên mỗi võ hồn:** đầu, thân, tay trái, tay phải, chân trái, chân phải.
- **Đầu và hai tay cho kỹ năng chủ động**, các vị trí còn lại cho kỹ năng bị động.
- Hồn cốt có niên hạn (số năm) theo hồn thú rơi ra nó, ví dụ *Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm*. Niên hạn càng cao thì chỉ số gốc và kỹ năng càng mạnh.
- **Cường hóa** bằng hồn cốt thường dư:
  - Cho hồn cốt khác vào làm nguyên liệu để cộng điểm cường hóa. Điểm cộng tỉ lệ với niên hạn của nguyên liệu, nguyên liệu cùng vị trí được thêm 50%.
  - Cấp +0 đến +20. Mỗi cấp tăng chỉ số chính; các mốc +5, +10, +15, +20 mở thêm một dòng chỉ số phụ hoặc nâng kỹ năng.
  - Nguyên liệu bị tiêu hao, cường hóa không bao giờ thất bại.
- Tháo hồn cốt ra thì vẫn giữ cấp cường hóa.

### 5.6 Hồn hạch
- **6 ô trên mỗi võ hồn.** Mỗi hồn hạch có **sao 1–6**, thuộc một **bộ** và có 1 chỉ số chính cùng tối đa 4 chỉ số phụ.
- **Hiệu ứng bộ:** gắn **2 món cùng bộ** thì nhận hiệu ứng 2 món; gắn **4 món cùng bộ** thì nhận thêm hiệu ứng 4 món. 6 ô cho phép ghép 4 + 2 hoặc 2 + 2 + 2.
- **Sao** quyết định chỉ số chính tối đa và số dòng phụ: 1★ có 0 dòng phụ … 6★ có 4 dòng phụ.
- **Các bộ đề xuất:**

| Bộ | 2 món | 4 món |
|---|---|---|
| Phượng Hoàng (Thiêu đốt) | +12% sát thương thiêu đốt | Thiêu đốt cộng dồn thêm 1 tầng tối đa; Viêm bạo gây thêm 30% sát thương |
| Bá Vương Long (Cảm điện) | +15% sát thương lan của cảm điện | Đánh trúng mục tiêu cảm điện hồi 3% hồn lực, mỗi giây 1 lần |
| Xà Hoàng (Trúng độc) | +15% sát thương độc | Mục tiêu trúng độc từ 5 tầng trở lên bị Dễ thương 10% |
| Hạo Thiên (Chấn đãng) | +15% công | Đòn đánh thứ 3 liên tiếp gây thêm 40% sát thương |
| Thất Sát (Phá giáp) | +10% xuyên thủ | Mục tiêu bị Liệt thương nhận thêm 15% chí mạng từ võ hồn mang bộ |
| Linh Miêu (Mẫn công) | +12% chí mạng | Chí mạng tăng 10% tốc độ đánh trong 4 giây |
| Lam Ngân (Khống chế) | +20% thời gian khống chế | Hồn kỹ khống chế hồi lại 10% hồn lực |
| Lưu Ly (Phụ trợ) | +15% hiệu quả hồi máu và khiên | Đổi võ hồn vào thì tăng 15% công cho cả đội trong 6 giây |
| Tiên Cơ | +20% tốc độ tích năng lượng tiên cơ | Chiêu tiên cơ gây thêm 35% sát thương |

- **Nâng cấp hồn hạch** (chờ chốt): dùng hồn hạch dư làm nguyên liệu, nâng +0 đến +15. Mỗi 3 cấp tăng 1 dòng phụ ngẫu nhiên.

### 5.7 Túi đồ, vật phẩm và tiền
- **Túi đồ** chứa hồn hoàn, hồn cốt, hồn hạch, mảnh võ hồn và vật phẩm. Vật phẩm cùng loại thì gộp. Có giới hạn số ô và có thể mở rộng.
- **Hồn Tệ** (đồng / ngân / kim): lưu trong DB là một số nguyên (đồng), chỉ quy đổi khi hiển thị. Rơi từ hồn thú, nhận khi bán đồ.
- **Vật phẩm cơ bản:** Hồi Huyết Đan, Hồi Hồn Đan (có thời gian hồi chung); tiên thảo (rơi hiếm, tăng vĩnh viễn một chút chỉ số cho một võ hồn).
- Chưa cho giao dịch giữa người chơi (chờ chốt).

### 5.8 Địa điểm và NPC
- **Doanh trại / Thánh Hồn Thôn:** nơi hồi sinh. NPC **Tố Vân Đào** (chấp sự Vũ Hồn Điện) làm lễ thức tỉnh võ hồn đầu tiên.
- **Nặc Đinh Thành** (bản đồ thành):
  - **Ngọc Tiểu Cương (Đại Sư):** nhiệm vụ tân thủ, giải thích giới hạn hồn hoàn.
  - **Thương nhân:** bán đan, mua đồ dư.
  - **Lò rèn:** cường hóa hồn cốt và hồn hạch.
- **Sử Lai Khắc Học Viện:** nhiệm vụ hằng ngày (về sau).
- **Đại Đấu Hồn Trường** (Thiên Đấu Thành): PvP xếp hạng.

### 5.9 Người chơi lập đội và PvP
- **Tổ đội người chơi:** tối đa 4 người. Kinh nghiệm chia cho thành viên trong bán kính khoảng 300px, mỗi người thêm 5%. Hồn hoàn rơi ưu tiên cho cả đội.
- **Đại Đấu Hồn Trường:** phòng riêng, đấu đội võ hồn 1v1, xếp hạng theo Elo. Thắng nhận Hồn Tệ và mảnh võ hồn.
- **PvP ngoài rừng:** không có (chờ chốt).

### 5.10 Cộng minh (giai đoạn cuối)
Đạt mốc theo từng trụ cột thì cộng chỉ số cho **mọi** võ hồn, buộc người chơi nuôi đều thay vì dồn hết cho một.

| Trụ cột | Ví dụ các mốc |
|---|---|
| Võ hồn | Sở hữu 4 / 6 / 8 võ hồn cấp 30+ |
| Hồn hoàn | Tổng số hồn hoàn đã hấp thụ trên mọi võ hồn đạt 10 / 25 / 50 |
| Hồn cốt | 6 / 12 / 24 hồn cốt cường hóa +10 |
| Hồn hạch | 8 / 16 / 24 hồn hạch 5★ trở lên |

## 6. Kiến trúc (bắt buộc giữ)
- **Server quyết định mọi thứ.** Client chỉ gửi ý định: `input {x,y}`, `attack`, `skill {i}`, `switch {slot}`, `absorb {itemId, vohonId}`, `chat {text}`…
  Không bao giờ để client tự báo máu, sát thương, vị trí, tỉ lệ rơi hay kết quả hấp thụ.
- Trạng thái đồng bộ qua Colyseus Schema (`server/src/rooms/schema.ts`). Hiệu ứng hình ảnh gửi qua `broadcast("fx")` và `"dmg"`.
- Túi đồ và võ hồn chỉ gửi cho chính chủ (không đồng bộ cho người khác). Người khác chỉ thấy võ hồn đang ra trận, cấp và hồn hoàn của nó.
- Bản đồ là file Tiled dùng chung (`shared/assets/forest.json`). Ô có thuộc tính `collides=true` là vật cản ở cả hai phía.
- Dữ liệu lâu dài lưu trong PostgreSQL / Supabase (`server/sql/`). Bảng mới dùng `CREATE TABLE IF NOT EXISTS` và bật RLS.
- **Bảng dữ liệu dự kiến:** `vohons` (võ hồn sở hữu: cấp, kinh nghiệm, sao, hồn hoàn), `items` (mỗi món đồ có id riêng: loại, số năm, sao, cấp cường hóa, dòng chỉ số, đang gắn vào võ hồn nào), `teams` (đội hình).

## 7. Lộ trình
Mỗi gạch đầu dòng là một lần giao việc. Xong một bước thì chạy `npm run check` và bot, rồi đánh dấu [x].

- [x] **Giai đoạn 1:** thức tỉnh, săn hồn thú, hấp thụ hồn hoàn, hồn kỹ dùng chung.
- [x] **Multiplayer cơ bản:** thấy nhau, chat, cùng săn, tranh hồn hoàn.
- [x] **Hạ tầng:** Supabase, git, kiểm tra tự động.

**Giai đoạn 2: Mô hình sưu tầm võ hồn** (thay đổi lớn nhất, làm trước)
- [x] 2.1 Dữ liệu: danh sách võ hồn ở mục 5.1 trong `data.ts`. Bảng `vohons`; nhân vật cũ được chuyển thành võ hồn đầu tiên của tài khoản.
  *Đã làm:* 20 võ hồn có mã cố định (`id`), hệ, độ hiếm, chủ nhân, lưu phái. Bảng `vohons` lưu hồn hoàn theo số năm.
  Võ hồn tạm cũ được ánh xạ: Hỏa Long Thương → Hỏa Long, Băng Tuyết Hồ → Yêu Hồ, Lôi Ưng → Kim Vũ Miêu Ưng,
  Thanh Mộc Đằng → Lam Ngân Thảo, Kim Cương Thuẫn → Thiên Càn Bạch Ngọc Đỉnh. Bảng `characters` giữ lại, không còn ghi.
  Thức tỉnh tạm thời ngẫu nhiên 1 SSR; mỗi tài khoản vẫn chỉ dùng 1 võ hồn cho đến bước 2.2.
- [ ] 2.2 Server: tài khoản sở hữu nhiều võ hồn, mỗi võ hồn có cấp, kinh nghiệm và hồn hoàn riêng. Lễ thức tỉnh: chọn 1 trong 3.
- [ ] 2.3 Đội hình 4 võ hồn, đổi võ hồn trong trận, luật gục và hồi sinh mới.
- [ ] 2.4 Năng lượng và chiêu tiên cơ.
- [ ] 2.5 Hồn kỹ riêng cho từng võ hồn (vòng 1–4 trước).
- [ ] 2.6 Danh hiệu, đổi tên hồn thú và tên vùng theo mục 5.3.

**Giai đoạn 3: Túi đồ và hồn hoàn kiểu mới**
- [ ] 3.1 Bảng `items`, túi đồ đồng bộ riêng cho chính chủ, giao diện túi đồ.
- [ ] 3.2 Hồn thú có tuổi theo số năm; hồn hoàn rơi thành vật phẩm, nhặt vào túi.
- [ ] 3.3 Hấp thụ từ túi đồ: giới hạn theo truyện, tỉ lệ thất bại, thất bại thì mất hồn hoàn. Mở đủ 10 vòng, cấp tối đa 100.
- [ ] 3.4 Mảnh võ hồn rơi, mở võ hồn mới và lên sao.
- [ ] 3.5 Chiêu có báo trước cho hồn thú từ 1.000 năm trở lên.

**Giai đoạn 4: Hồn cốt**
- [ ] 4.1 Hồn cốt rơi theo bảng ở mục 5.3, nằm trong túi đồ.
- [ ] 4.2 Gắn hồn cốt vào 6 vị trí của võ hồn, cộng chỉ số.
- [ ] 4.3 Kỹ năng chủ động (đầu, hai tay) và bị động.
- [ ] 4.4 Cường hóa hồn cốt bằng hồn cốt dư.

**Giai đoạn 5: Hồn hạch**
- [ ] 5.1 Hồn hạch rơi với sao 1–6, chỉ số chính và phụ ngẫu nhiên.
- [ ] 5.2 Gắn 6 ô, hiệu ứng bộ 2 món và 4 món.
- [ ] 5.3 Nâng cấp hồn hạch.

**Giai đoạn 6: Thế giới sống**
- [ ] 6.1 NPC trong doanh trại: Tố Vân Đào, thương nhân; Hồn Tệ và đan.
- [ ] 6.2 Nhiệm vụ: chuỗi tân thủ của Ngọc Tiểu Cương.
- [ ] 6.3 Tà hóa thú vương: lịch xuất hiện, chiêu riêng, chia thưởng, giới hạn 3 lần/ngày.
- [ ] 6.4 Bản đồ Nặc Đinh Thành, chuyển bản đồ qua cổng.

**Giai đoạn 7: Xã hội**
- [ ] 7.1 Tổ đội người chơi tối đa 4, chia kinh nghiệm, ưu tiên hồn hoàn theo đội.
- [ ] 7.2 Đại Đấu Hồn Trường 1v1, Elo, bảng xếp hạng.

**Giai đoạn 8: Dài hạn**
- [ ] 8.1 Hồn kỹ vòng 5–10 và Võ Hồn Chân Thân.
- [ ] 8.2 Cộng minh.
- [ ] 8.3 Thêm võ hồn mới.
- [ ] 8.4 Bản đồ mới: Lạc Nhật Sâm Lâm, Cực Bắc Chi Địa, Hải Thần Đảo.

**Kỹ thuật (làm khi cần)**
- [ ] Dự đoán chuyển động phía client (client-side prediction) để đỡ trễ khi ping cao.
- [ ] Thay sprite vẽ bằng code bằng sprite Aseprite thật.
- [ ] Nhiều kênh khi một phòng quá 60 người.
- [ ] Giới hạn số lần đăng nhập sai và tin nhắn chat để chống dò mật khẩu và spam.

## 8. Câu hỏi còn mở
1. **Sưu tầm võ hồn:** mảnh võ hồn, cộng với lễ thức tỉnh tặng Lam Ngân Thảo và cho tự chọn 1 SSR (mục 5.1), có ổn không?
   - Hạo Thiên Chùy, Cửu Bảo Lưu Ly Tháp… xếp độ hiếm gì (UR?) và lấy bằng cách nào?
   - Chủ nhân của Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa, Hỏa Ảnh, Thiên Càn Bạch Ngọc Đỉnh là ai?
2. **Đội hình:** 4 võ hồn và cách chia kinh nghiệm 40/20/20/20 có ổn không?
3. **Hồn kỹ vòng 8–10:** muốn thiết kế thế nào?
4. **Giới hạn hồn hoàn vòng 5–10:** con số trong bảng mục 5.2 cần đối chiếu lại với truyện.
5. **Kinh tế:** có cho giao dịch giữa người chơi và PvP ngoài rừng không?
6. **Nền tảng:** ưu tiên điện thoại hay máy tính? Đội 4 võ hồn và nhiều phím kỹ năng sẽ khó điều khiển trên điện thoại.
