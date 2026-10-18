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
- **Người chơi là một hồn sư có nhân vật riêng.** Khi tạo tài khoản, người chơi chọn **nam hoặc nữ**, kiểu tóc, màu tóc và màu áo (mục 5.11). Hồn sư chỉ là hình ảnh đại diện: cấp, chỉ số và hồn hoàn đều thuộc về từng võ hồn.
- **Võ hồn là đơn vị nuôi riêng, sưu tầm được.** Trên bản đồ, người khác thấy hồn sư của bạn cùng **võ hồn đang ra trận ở dạng phóng thích**, như trong truyện: vũ khí trên tay, thú hồn phụ thể (tai, đuôi, cánh), hư ảnh hoặc hào quang quanh người, kèm các **vòng hồn hoàn của võ hồn đó** dưới chân. Đổi võ hồn thì đổi lớp phụ thể và bộ vòng hồn hoàn; thân hồn sư giữ nguyên.
- **Nhân vật truyện dùng cho chân dung và thẻ võ hồn** trong giao diện (ví dụ thẻ Lam Ngân Thảo vẽ Đường Tam, thẻ Nhu Cốt Thố vẽ Tiểu Vũ), không dùng làm nhân vật trên bản đồ.
- **Đội hình 4 võ hồn** (đã chốt). Trên bản đồ chỉ hiện võ hồn đang ra trận; đổi sang võ hồn khác trong đội ngay khi đang đánh.
- **Mỗi võ hồn có 10 hồn hoàn**, ứng với cấp 1–100: bình cảnh ở cấp 10, 20, …, 100.
- **Niên hạn tối đa: 10 vạn năm (100.000 năm).**
- Thế giới mở thời gian thực, tất cả người chơi cùng một bản đồ.

## 4. Luật cốt lõi đã làm (bản cũ, sẽ thay dần)
Đây là những gì code đang chạy. Mục ghi ➜ sẽ bị thay ở giai đoạn tương ứng.

- **Thức tỉnh** (một lần, chỉ khi tài khoản chưa có võ hồn): tặng Lam Ngân Thảo + người chơi tự chọn 1 võ hồn SSR bất kỳ; server kiểm tra lựa chọn và roll hồn lực bẩm sinh 1–10 (= cấp khởi đầu của cả hai võ hồn). Không còn thức tỉnh lại, không bao giờ xóa võ hồn. *Giữ nguyên.*
- **Võ hồn sở hữu**: mỗi võ hồn có cấp, kinh nghiệm, hồn hoàn riêng. Chọn 1 võ hồn ra trận (phím V), chỉ đổi được khi không giao chiến 5 giây và không hấp thụ. ➜ GĐ2.3: đội hình 4 võ hồn, đổi ngay trong trận.
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

**Sưu tầm võ hồn** (không có gacha; lễ thức tỉnh đã chốt, phần mảnh võ hồn chờ chốt):
- Khi tạo tài khoản, Tố Vân Đào làm lễ thức tỉnh: nhận Lam Ngân Thảo và **tự chọn 1 võ hồn SSR bất kỳ** trong danh sách 17 SSR cơ bản.
- Các võ hồn khác mở bằng **mảnh võ hồn**: rơi từ hồn thú (mỗi vùng rơi mảnh của 2–3 võ hồn), tà hóa thú vương và nhiệm vụ. Đủ 50 mảnh thì mở võ hồn.
- Mảnh dư dùng để **lên sao** (1★ → 6★, cần 20 / 40 / 80 / 120 / 200 mảnh). Mỗi sao tăng chỉ số gốc và mở thêm hiệu ứng cho hồn kỹ.

**Trong trận:**
- Phím đổi võ hồn chuyển ngay sang võ hồn khác trong đội, mỗi lần đổi hồi 3 giây.
- **Năng lượng tiên cơ:** đánh trúng thì tích năng lượng. Võ hồn đủ năng lượng khi được đổi vào sẽ tung **chiêu tiên cơ** ngay lúc xuất hiện. Đây là kỹ thuật nối combo chính.
- Võ hồn đang ra trận gục thì tự đổi sang võ hồn còn sống. Võ hồn đã gục chỉ hồi lại ở doanh trại hoặc sau 60 giây ngoài trận.
- Cả đội gục thì về doanh trại, không mất kinh nghiệm hay đồ (chờ chốt).

**Kinh nghiệm:** chia cho cả 4 võ hồn trong đội; võ hồn đang ra trận nhận 40%, mỗi võ hồn còn lại 20% (đã chốt, làm ở bước 2.3). Võ hồn đang ở bình cảnh thì không nhận, phần đó không chia lại.

**Danh hiệu** theo cấp của võ hồn đang ra trận, hiện trên đầu hồn sư:

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

### 5.11 Mỹ thuật: hồn sư, võ hồn, hồn thú
Sprite hiện tại được vẽ bằng code trong `client/src/textures.ts`. Mục này là quy cách để thay dần bằng sprite vẽ tay mà không phải sửa luật chơi.

**Phong cách và bảng màu chung**
- **Chibi pixel RPG** nhìn từ trên xuống, hơi nghiêng (kiểu RPG 16-bit). Đầu to bằng khoảng 2/5 chiều cao, mắt 1–2 pixel, tay chân ngắn.
- **Ánh sáng từ trên bên trái.** Mỗi vùng màu dùng 3 sắc độ (tối, gốc, sáng); thêm sắc độ thứ 4 chỉ cho kim loại và hiệu ứng phát sáng.
- **Viền tối có màu**, không dùng đen tuyền: viền ngoài `#1a1020`, viền trong cùng tông, tối hơn màu gốc. Không khử răng cưa (anti-alias) ở viền ngoài để sprite đọc rõ khi phóng to 2–6 lần.
- **Bảng màu chung khoảng 48 màu**, lưu ở `art/palette.gpl` (bảng màu Aseprite). Ngoài bảng này chỉ được thêm màu chủ đạo của võ hồn, tức trường `col` và `robe` trong `VOHON` (`shared/data.ts`), và màu hồn hoàn trong `TIERS`.
- **Da:** 3 sắc độ quanh `#f1c7a0` (màu da sprite hiện tại). Một tông da cho bản đầu (thêm tông khác chờ chốt).
- **Nền tối dần theo độ sâu của rừng** (lớp `vignette`), nên mọi màu tối của võ hồn và hồn thú phải có viền sáng hoặc hào quang để không chìm. Ví dụ hồn hoàn đen dùng `glow` tím `#8a6bff` làm viền.

**Quy cách sprite hồn sư**
- **Khung 32×32 pixel**, gốc tại chân, điểm (16, 30), tức `origin = (0.5, 30/32)`. Thân cao khoảng 24–26 pixel; phần trên dành cho tóc buộc cao và mũ. Một ô bản đồ (`TILE` = 16) nên hồn sư cao khoảng 2 ô, rộng 1 ô.
- **Bóng dưới chân** không vẽ trong sprite: client vẽ hình elip mờ 12×4 bằng code.
- **4 hướng: xuống, phải, lên, trái.** Chỉ vẽ 3 hướng (xuống, phải, lên). Hướng trái lấy bằng cách lật ngang hướng phải trong client, áp cho mọi lớp cùng lúc. Server cần đồng bộ thêm hướng nhìn 4 phía (hiện chỉ có `face` = ±1).
- **Ghép theo lớp.** Mỗi lớp là một spritesheet riêng có **cùng bố cục khung**. Thứ tự vẽ từ sau ra trước:

| Thứ tự | Lớp | Nguồn | Ghi chú |
|---|---|---|---|
| 1 | Bóng | Code | Elip mờ dưới chân |
| 2 | Vòng hồn hoàn, nửa sau | Code (hoặc ảnh `halo`) | Phần elip nằm sau thân |
| 3 | Phụ thể võ hồn, nửa sau | `vh_{id}_b` | Cánh, đuôi, chân nhện, hư ảnh sau lưng, vũ khí khi bị thân che |
| 4 | Thân | `hs_body_{m/f}` | Da, mặt, quần hoặc váy lót, giày |
| 5 | Áo | `hs_outfit_{m/f}_0` | Đổi màu bằng hoán màu (xem dưới) |
| 6 | Tóc | `hs_hair_{m/f}_{0–3}` | Đổi màu bằng hoán màu |
| 7 | Phụ thể võ hồn, nửa trước | `vh_{id}_f` | Vũ khí trên tay, tai thú, dây leo trước người, hào quang phía trước |
| 8 | Vòng hồn hoàn, nửa trước | Code (hoặc ảnh `halo`) | Phần elip nằm trước thân |
| 9 | Hiệu ứng | Code (`fx` từ server) | Vệt chém, sóng, chữ sát thương |

- **Phụ thể tách hai nửa (sau thân và trước thân) cho từng khung.** Người vẽ tự quyết pixel nào nằm sau, pixel nào nằm trước theo từng hướng: quay lưng (hướng lên) thì cánh nằm ở nửa trước, vũ khí nằm ở nửa sau. Nhờ vậy client không cần đổi thứ tự lớp theo hướng.
- **Khung phụ thể 48×48**, là khung thân mở rộng 8 pixel mỗi phía, gốc tại (24, 38). Cánh, búa lớn và dây leo dưới đất được phép tràn ra ngoài khung 32×32.
- **Hoán màu (palette swap):** tóc và áo vẽ bằng **dải 4 xám chuẩn** `#3a3a3a`, `#6a6a6a`, `#9a9a9a`, `#cacaca` (tối → sáng). Lúc tải, client tạo bản đã tô màu cho từng tổ hợp đang dùng bằng cách thay đúng 4 màu này bằng dải màu chọn. Không dùng `setTint` vì phép nhân màu làm mất sắc độ.

**Tùy biến khi tạo nhân vật** (chờ chốt số lượng)

| Mục | Nam | Nữ |
|---|---|---|
| Kiểu tóc 0 | Ngắn rối | Dài thả thẳng |
| Kiểu tóc 1 | Dài buộc thấp sau gáy | Đuôi ngựa cao |
| Kiểu tóc 2 | Dựng nhọn | Bím dài một bên |
| Kiểu tóc 3 | Mái dài che một bên mắt | Ngắn ngang vai, có mái |
| Màu tóc (dùng chung) | Đen, nâu, vàng kim, bạc, lam, hồng | |
| Màu áo (dùng chung) | Lam, đỏ, lục, tím, trắng, đen | |

- Áo bản đầu là **áo hồn sư** đơn giản: áo vải có đai lưng, nam mặc quần, nữ mặc váy ngắn trên quần bó. Kiểu áo khác (đồng phục Sử Lai Khắc, áo Vũ Hồn Điện) để sau.
- Lưu 4 số nhỏ cho mỗi tài khoản: `sex` (0 nam, 1 nữ), `hair` (0–3), `hairCol` (0–5), `outfitCol` (0–5). Danh sách màu nằm trong `shared/data.ts` để client và server cùng kiểm tra.

**Animation của hồn sư**

| Tên (tag Aseprite) | Số khung | Thời gian mỗi khung | Lặp | Ghi chú |
|---|---|---|---|---|
| `idle` (đứng) | 2 | 400 ms | Có | Thở: đầu và vai nhích 1 pixel |
| `walk` (đi) | 4 | 120 ms | Có | Chân trái, đứng, chân phải, đứng |
| `attack` (đánh thường) | 3 | 80 / 80 / 140 ms | Không | Lấy đà, vung, thu về. Phụ thể vũ khí vung theo |
| `cast` (tung hồn kỹ) | 3 | 100 / 200 / 140 ms | Không | Giơ tay, giữ (vòng hồn hoàn của hồn kỹ sáng lên), thả |
| `hurt` (bị đánh) | 1 | 150 ms | Không | Ngửa người; client nháy trắng thêm 2 lần |
| `die` (gục) | 3 | 120 / 120 / giữ | Không | Khuỵu, ngã, nằm. Ẩn phụ thể |
| `absorb` (hấp thụ hồn hoàn) | 2 | 500 ms | Có | Ngồi xếp bằng thiền, **chỉ hướng xuống**. Phụ thể mờ 60% |

- **Bố cục spritesheet cố định, mọi lớp giống nhau**, 16 cột × 4 hàng = 512×128 (lớp phụ thể: 768×192 vì khung 48×48):
  - Hàng 0 hướng xuống, hàng 1 hướng phải, hàng 2 hướng lên. Trong mỗi hàng: cột 0–1 `idle`, 2–5 `walk`, 6–8 `attack`, 9–11 `cast`, 12 `hurt`, 13–15 `die`.
  - Hàng 3: cột 0–1 `absorb` (hướng xuống); các cột còn lại để trống, dành cho animation thêm về sau.
- Lớp phụ thể **bắt buộc có** `idle`, `walk`, `attack`, `cast`; `hurt` dùng lại khung `idle` nếu chưa vẽ; `die` để trống.
- Client chỉ chạy animation trên lớp thân; các lớp khác đặt cùng chỉ số khung với lớp thân mỗi lần khung đổi.

**Phụ thể của 20 võ hồn** (theo `VOHON`; màu chủ đạo là `col` / `robe` trong `data.ts`)

| Võ hồn (`id`) | Dạng phụ thể khi phóng thích | Vị trí lớp | Màu chủ đạo | Hiệu ứng đặc trưng |
|---|---|---|---|---|
| Cửu Tinh Thất Sát Kiếm (`cuu_tinh_that_sat_kiem`) | Trường kiếm bạc, thân kiếm có hàng sao sáng | Tay phải | Bạc trắng `#cfe3ff`, chuôi `#3c4f70` | Kiếm khí mảnh; khi tung hồn kỹ có 3–4 thanh kiếm nhỏ bay quanh người (Vô Ngã Kiếm Trận) |
| Lam Điện Bá Vương Long (`lam_dien_ba_vuong_long`) | Vảy rồng xanh phủ hai cẳng tay, vuốt rồng; hư ảnh đầu rồng sau lưng | Tay + lưng | Lam điện `#5ab8ff`, vảy `#1f3f8f` | Tia điện chạy dọc tay, chớp lóe 1 khung khi đánh trúng |
| Kỳ Nhung Thông Thiên Cúc (`ky_nhung_thong_thien_cuc`) | Đóa cúc vàng lớn nở sau lưng, cánh hoa xoay quanh người | Lưng + bao quanh | Cam vàng `#ffb347`, nhụy `#8a4a12` | Cánh hoa bay theo vòng, rơi lả tả khi di chuyển |
| Tà Hỏa Phượng Hoàng (`ta_hoa_phuong_hoang`) | Đôi cánh lửa phượng hoàng | Lưng | Lửa cam `#ff6a2a`, lõi `#8f2a14` | Cánh vỗ theo nhịp đi; tàn lửa bay lên |
| U Minh Linh Miêu (`u_minh_linh_mieu`) | Tai mèo, đuôi mèo, móng vuốt dài trên hai tay | Đầu + tay + lưng | Tím u minh `#b06bff`, đen tím `#3e2266` | Vệt cào tím; bóng mờ đuổi theo khi lướt |
| Nguyệt Nhận (`nguyet_nhan`) | Đôi lưỡi trăng khuyết bạc cầm hai tay | Hai tay | Bạc `#e6e6f0`, xám `#4a4a5e` | Vệt chém hình trăng khuyết, ánh trăng lạnh |
| Hỏa Long (`hoa_long`) | Hư ảnh rồng lửa nhỏ quấn quanh thân, đầu rồng trên vai | Bao quanh | Đỏ lửa `#ff4a2a`, `#7a1c10` | Hơi nóng gợn quanh người, tia lửa bắn ra khi đánh |
| Nhu Cốt Thố (`nhu_cot_tho`) | Tai thỏ dài, đuôi bông; hai chân phát sáng | Đầu + lưng + dưới chân | Hồng phấn `#ffc2e2`, `#c86a9a` | Vệt sáng hồng hình cung khi lướt và đá |
| Kim Vũ Miêu Ưng (`kim_vu_mieu_ung`) | Đôi cánh lông vàng kim, vuốt ưng ở tay | Lưng + tay | Vàng kim `#ffd54a`, `#7a5a12` | Lông vũ rơi; tia điện vàng lóe trên mép cánh |
| Tử Vong Chu Hoàng (`tu_vong_chu_hoang`) | 4 chân nhện tím đen mọc sau lưng (hai bên vai) | Lưng | Tím độc `#9a4aff`, `#2a1240` | Sợi tơ tím; hơi độc mờ bay quanh chân |
| Bích Lân Xà Hoàng (`bich_lan_xa_hoang`) | Rắn lục biếc quấn cánh tay, đầu rắn ngóc trên vai | Tay + vai | Lục biếc `#3ad98a`, `#145a38` | Vảy lân quang lấp lánh, sương độc xanh dưới chân |
| Càn Khôn Hỗn Nguyên Tỏa (`can_khon_hon_nguyen_toa`) | Vòng xích vàng có ổ khóa lơ lửng quanh người | Bao quanh | Vàng đồng `#e0b04a`, `#5e4a18` | Xích xoay chậm; phù văn sáng khi tung hồn kỹ |
| Hỏa Ảnh (`hoa_anh`) | Bóng lửa đỏ hình người đứng sau, hai tay bọc lửa | Lưng + tay | Đỏ thẫm `#ff3a4a`, `#701822` | Bóng lửa đi trễ nhịp so với thân |
| Yêu Hồ (`yeu_ho`) | Tai cáo, 3 đuôi cáo xòe sau lưng | Đầu + lưng | Hồng yêu `#ff9ad5`, `#7a2a5a` | Ảo ảnh hồng nhấp nháy, đốm sáng hình giọt nước |
| Xúc Xích (`xuc_xich`) | Xúc xích nướng to trên tay, 2–3 xúc xích nhỏ bay quanh | Tay + bao quanh | Nâu cam `#e8875a`, `#6a3a22` | Hơi nóng bốc lên, xúc xích nhỏ nảy lên xuống |
| Quỷ Mị (`quy_mi`) | Hư ảnh quỷ mờ sau lưng, khói tím đen bao người | Lưng + bao quanh | Tím quỷ `#8a8aff`, `#22224a` | Bóng nhân đôi lệch 1–2 pixel; nhấp nháy khi tàng hình |
| Thiên Càn Bạch Ngọc Đỉnh (`thien_can_bach_ngoc_dinh`) | Đỉnh ba chân bằng bạch ngọc lơ lửng trên lòng bàn tay | Tay (lơ lửng) | Ngọc ngà `#f0e0a0`, `#6a5a2a` | Khói ngọc trắng bốc từ miệng đỉnh; quầng sáng khi hồi máu |
| Lam Ngân Thảo (`lam_ngan_thao`) | Dây cỏ lam ngân quấn hai tay, lan thành thảm dưới chân | Tay + dưới chân | Lam ngân `#4ab0ff`, `#1f4a6b` | Dây leo bò trên đất, đốm sáng xanh li ti |
| Hạo Thiên Chùy (`hao_thien_chuy`) | Búa đen khổng lồ (đầu búa to gần bằng người) | Tay | Đen `#22222c`, ánh bạc `#9aa0b4` | Vân đen chạy trên búa; bụi và vết nứt đất khi nện |
| Cửu Bảo Lưu Ly Tháp (`cuu_bao_luu_ly_thap`) | Tháp lưu ly 9 tầng nhỏ lơ lửng trên tay | Tay (lơ lửng) | Lưu ly `#7ef0ff`, `#2a6a7a` | Hào quang 7 màu xoay quanh tháp, chiếu tia sáng lên đồng đội |

- Hiệu ứng lớn (kiếm trận, lãnh vực, sóng sét) vẽ bằng code hoặc sprite hiệu ứng riêng, **không** nhét vào lớp phụ thể.
- **Võ Hồn Chân Thân** (vòng 7, mục 5.2) là bộ sprite riêng sau này; chưa vẽ ở giai đoạn này.

**Vòng hồn hoàn**
- Màu theo 5 bậc niên hạn, lấy `col` (thân vòng) và `glow` (viền sáng) trong `TIERS`: trắng, vàng, tím, đen, đỏ. Không chép mã màu sang chỗ khác.
- **Dưới chân hồn sư:** mỗi hồn hoàn của võ hồn đang ra trận là một elip 20×6, viền 2 pixel màu `col` cộng 1 pixel `glow`. Vòng 1 sát chân, vòng sau cao hơn 2 pixel; 10 vòng cao khoảng 18 pixel, tới ngang ngực. Các vòng nhấp nhô chậm lệch pha nhau.
- **Nửa sau và nửa trước:** cung trên của elip vẽ sau thân, cung dưới vẽ trước thân, để vòng trông như bao quanh người.
- **Khi tung hồn kỹ vòng thứ i:** vòng i sáng gấp đôi và phình ra 2 pixel trong 300 ms.
- **Hồn hoàn rơi trên đất:** giữ key `ring{tier}` 24×14 như hiện tại.
- Bản đầu vẽ vòng bằng code (đã có `soulRingFx`). Nếu sau này vẽ tay thì dùng key `halo{tier}` 24×10, hai khung: cung trên và cung dưới.

**Hồn thú**
- Chỉ vẽ **2 hướng** (sang phải, trái là lật ngang) vì server chỉ gửi `face` = ±1. Gốc tại giữa đáy, cách mép dưới 2–4 pixel.
- Kích thước khung theo bậc:

| Bậc | Niên hạn | Khung | Kích thước trên bản đồ |
|---|---|---|---|
| 0 | 10 năm | 16×16 | 1 ô |
| 1 | 100 năm | 32×32 | khoảng 1,5 ô |
| 2 | 1.000 năm | 48×32 | khoảng 2 ô dài |
| 3 | 10.000 năm | 48×48 | khoảng 2,5 ô |
| 4 | 100.000 năm | 64×64 | khoảng 3,5 ô |
| Tà hóa thú vương | (mục 5.4) | 96×96 | khoảng 5 ô |

- Animation: `idle` 2 khung, `walk` 4, `attack` 3 (khung đầu là tư thế báo trước, giữ lâu để khớp vùng cảnh báo 0,8 giây ở mục 5.3), `hurt` 1, `die` 3. Spritesheet một hàng theo đúng thứ tự đó, 13 khung.
- Trạng thái hung hăng (`aggro`) không vẽ khung riêng: client thêm mắt đỏ hoặc dấu "!" bằng code.
- Mỗi loài hồn thú trong mục 5.3 một bộ sprite. Trước khi có loài (bước 2.6), giữ key theo bậc `b{tier}_…`.

**Chân dung và thẻ võ hồn** (giao diện HTML, không phải Phaser)
- **Chân dung 64×64**, nhân vật truyện đại diện là trường `owner` trong `VOHON` (Đường Tam cho Lam Ngân Thảo, Tiểu Vũ cho Nhu Cốt Thố, Đường Hạo cho Hạo Thiên Chùy…). Hiển thị phóng 2 hoặc 3 lần với `image-rendering: pixelated`.
- Võ hồn chưa rõ chủ nhân (Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa, Hỏa Ảnh, Thiên Càn Bạch Ngọc Đỉnh, mục 8) thì chân dung vẽ chính võ hồn thay vì người.
- **Thẻ võ hồn 96×128**: chân dung ở trên, tên võ hồn, khung viền theo độ hiếm (SR bạc, SSR vàng, UR đỏ tím), biểu tượng hệ 12×12 ở góc trên trái, sao ở dưới, hồn hoàn là các chấm màu theo bậc.
- Biểu tượng 4 hệ: 12×12, một màu trên nền trong suốt, để CSS tô màu.

**Tên file, key Phaser và thư mục**
- Thư mục `shared/assets` là `publicDir` của Vite, nên ảnh đặt ở đây được client tải thẳng. Mã võ hồn (`id`) dùng trong tên file, **không dùng chỉ số mảng** (chỉ số có thể đổi khi thêm võ hồn).

```
art/                         file nguồn, không tải trong game
  palette.gpl                bảng màu chung
  CREDITS.md                 nguồn gốc và giấy phép mọi asset
  honsu/ vohon/ beast/ ui/   file .aseprite
shared/assets/sprites/
  manifest.json              danh sách key đã có ảnh thật
  honsu/body_m.png + .json   hs_body_m
  honsu/hair_f_2.png + .json hs_hair_f_2
  honsu/outfit_m_0.png + .json
  vohon/{id}_b.png, {id}_f.png + {id}.json   vh_{id}_b, vh_{id}_f
  beast/{loài}.png + .json   beast_{loài} (trước bước 2.6: b{tier})
  ring/ring{tier}.png        ring{tier} (hồn hoàn rơi), halo{tier}
shared/assets/ui/
  portrait/{id}.png          chân dung 64×64
  card/frame_{sr,ssr,ur}.png khung thẻ 96×128
  icon/he_{he}.png           biểu tượng hệ 12×12
```

- **Cách thay dần:** `textures.ts` bỏ qua key đã tồn tại. Client đọc `manifest.json` trong `preload()`, chỉ tải các key có trong danh sách (tránh lỗi 404), rồi `makeTextures()` vẽ bằng code những key còn thiếu. Vì vậy mỗi lần chỉ cần thêm ảnh và một dòng manifest; key nào chưa có ảnh vẫn chạy bằng sprite vẽ code.
- Sprite vẽ bằng code cho mô hình mới phải dùng **đúng key mới** (`hs_body_m`, `vh_{id}_f`…) và cùng bố cục khung, để ảnh thật thay vào được ngay.
- Key cũ `p{i}_{f}` (một hình mỗi võ hồn) bị bỏ khi làm bước 2.2b.

**Quy trình AI concept → Aseprite → spritesheet**
1. **Concept:** dùng AI tạo ảnh tham khảo theo bộ prompt chung (phong cách, góc nhìn, tỉ lệ chibi, nền trơn). Chọn 1 ảnh, ghi prompt và công cụ vào `art/CREDITS.md`. Ảnh concept không đưa vào game.
2. **Hạ độ phân giải:** thu ảnh về khung 32×32 (hoặc 48×48 cho phụ thể) theo cách lấy điểm gần nhất, chỉ để làm nền tham khảo, mờ 30%, trên một lớp riêng trong Aseprite.
3. **Vẽ lại bằng tay** trên lớp mới, chỉ dùng màu trong `art/palette.gpl`: bóng khối, viền, rồi sắc độ. Xóa lớp tham khảo trước khi xuất. **Không nộp ảnh AI thu nhỏ trực tiếp** (nhiễu màu, viền nhòe, không khớp khung).
4. **Animation:** vẽ khung `idle` hướng xuống trước, rồi suy ra các hướng và animation khác. Tag Aseprite đặt đúng tên ở bảng animation, khung xếp theo bố cục cố định.
5. **Lớp phụ thể:** mở file thân làm lớp tham khảo (khóa), vẽ phụ thể trên 2 lớp `back` và `front`, xuất thành 2 ảnh.
6. **Xuất:** `aseprite -b file.aseprite --sheet out.png --sheet-type rows --sheet-columns 16 --data out.json --format json-array --list-tags`. Phụ thể xuất từng lớp bằng `--layer back` / `--layer front`. Client tải bằng `this.load.aseprite(key, png, json)` và tạo animation bằng `this.anims.createFromAseprite(key)`.
7. **Kiểm tra:** thêm key vào `manifest.json`, chạy game, xem đủ 3 hướng và mọi animation ở mức phóng 2× và 4×, rồi ghi nguồn vào `art/CREDITS.md`.

**Nguồn và giấy phép**
- Dự án phi thương mại, chơi cùng bạn bè; được dùng tên và hình tượng nhân vật trong truyện (mục 1). Hình phải **do nhóm tự vẽ**.
- **Không dùng** sprite, ảnh cắt hoặc hình vẽ lại sát nét từ game thương mại (kể cả *Thế Giới Săn Hồn*), phim hoạt hình hay truyện tranh chính thức. Chỉ được xem để tham khảo ý tưởng.
- **Ảnh AI chỉ là concept.** Chỉ dùng công cụ AI mà điều khoản cho phép dùng kết quả. Không ghi tên họa sĩ còn sống trong prompt.
- **Asset bên ngoài** (font, tileset, âm thanh) chỉ nhận giấy phép CC0, CC-BY hoặc OFL. Mỗi asset một dòng trong `art/CREDITS.md`: tên file, tác giả, link gốc, giấy phép, đã chỉnh sửa gì. CC-BY phải hiện tên tác giả trong màn hình giới thiệu của game.

## 6. Kiến trúc (bắt buộc giữ)
- **Server quyết định mọi thứ.** Client chỉ gửi ý định: `input {x,y}`, `attack`, `skill {i}`, `switch {slot}`, `absorb {itemId, vohonId}`, `chat {text}`…
  Đang có thêm: `vohons` (xin danh sách võ hồn sở hữu, server trả tin nhắn riêng `vohons`), `pick {rowId}` (chọn võ hồn ra trận, đến bước 2.3),
  và HTTP `POST /api/awaken {token, vohon}` cho lễ thức tỉnh (luật nằm trong `awakenAccount` ở `ForestRoom.ts`).
  Không bao giờ để client tự báo máu, sát thương, vị trí, tỉ lệ rơi hay kết quả hấp thụ.
- Trạng thái đồng bộ qua Colyseus Schema (`server/src/rooms/schema.ts`). Hiệu ứng hình ảnh gửi qua `broadcast("fx")` và `"dmg"`.
- Túi đồ và võ hồn chỉ gửi cho chính chủ (không đồng bộ cho người khác). Người khác chỉ thấy ngoại hình hồn sư (giới tính, tóc, màu áo), võ hồn đang ra trận, cấp và hồn hoàn của nó.
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
- [x] 2.2 Server: tài khoản sở hữu nhiều võ hồn, mỗi võ hồn có cấp, kinh nghiệm và hồn hoàn riêng. Lễ thức tỉnh: tặng Lam Ngân Thảo + tự chọn 1 SSR.
  *Đã làm:* Store có `listVohons`, `addVohon`, `getCharacter` (võ hồn ra trận), `setActive`; cột `accounts.active_vohon` (`003_owned_vohons.sql`).
  `awaken` không còn xóa gì: chỉ chạy khi tài khoản chưa có võ hồn (409 nếu đã có), tạo Lam Ngân Thảo + SSR đã chọn cùng cấp bẩm sinh, SSR ra trận.
  Tài khoản cũ giữ nguyên võ hồn đang có (vẫn ra trận) và được tặng Lam Ngân Thảo nếu chưa có, cấp = hồn lực bẩm sinh cũ (`characters.innate`) hoặc 1.
  Client: màn hình chọn SSR theo 4 hệ (chuột, chạm, bàn phím); trong rừng nút "Võ hồn" / phím V mở danh sách để chọn võ hồn ra trận.
  Đổi võ hồn giữ tỉ lệ sinh lực / hồn lực, hồi 2 giây (`PICK_CD`), cấm khi gục, đang hấp thụ hoặc giao chiến trong 5 giây (`PICK_COMBAT_SECS`).
- [ ] 2.2a Tạo nhân vật: chọn nam/nữ, 4 kiểu tóc, màu tóc, màu áo (mục 5.11). Lưu `sex`, `hair`, `hairCol`, `outfitCol` cho tài khoản (file SQL mới), đồng bộ qua schema để người khác thấy. Làm ngay trước bước chọn SSR của lễ thức tỉnh; tài khoản cũ nhận ngoại hình mặc định và được chọn lại một lần ở lần vào game tới.
- [ ] 2.2b Hiển thị hồn sư ghép lớp bằng code theo quy cách 5.11: thân, áo, tóc (đổi màu), lớp phụ thể đơn giản cho 20 võ hồn, vòng hồn hoàn dưới chân. Thêm hướng nhìn 4 phía vào schema. Bỏ key cũ `p{i}_{f}`.
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

**Mỹ thuật: thay sprite vẽ bằng code** (quy cách ở mục 5.11; làm song song, không chặn các giai đoạn khác)
- [ ] M1 Nền tảng: `art/palette.gpl`, `art/CREDITS.md`, `sprites/manifest.json`; client tải ảnh theo manifest bằng `load.aseprite`, key còn thiếu thì vẽ bằng code.
- [ ] M2 Hồn sư: thân nam và nữ, 4 kiểu tóc mỗi giới, áo hồn sư; đủ 3 hướng và 7 animation.
- [ ] M3 Lớp phụ thể: Lam Ngân Thảo và 4 võ hồn mẫu (mỗi hệ một: Hạo Thiên Chùy, U Minh Linh Miêu, Bích Lân Xà Hoàng, Cửu Bảo Lưu Ly Tháp), rồi các võ hồn còn lại.
- [ ] M4 Hồn thú: 5 bậc theo bảng kích thước; sau bước 2.6 vẽ theo từng loài ở mục 5.3.
- [ ] M5 Giao diện thẻ võ hồn: chân dung 64×64 cho 20 võ hồn, khung thẻ SR/SSR/UR, biểu tượng 4 hệ. Cần trước khi làm giao diện đội hình đẹp ở 2.3.

**Kỹ thuật (làm khi cần)**
- [ ] Dự đoán chuyển động phía client (client-side prediction) để đỡ trễ khi ping cao.
- Thay sprite vẽ bằng code bằng sprite Aseprite thật: đã tách thành nhóm **Mỹ thuật** (M1–M5) ở trên.
- [ ] Nhiều kênh khi một phòng quá 60 người.
- [x] Giới hạn số lần đăng nhập sai và tin nhắn chat để chống dò mật khẩu và spam. (`server/src/ratelimit.ts`, lưu RAM: sai 5 lần cùng (tên, IP), 30 lần/tên từ mọi IP hoặc 20 lần/IP thì khóa 1 phút, gấp đôi mỗi lần tới tối đa 30 phút; chat 5 tin liền rồi 1 tin/2 giây, tối đa 120 ký tự, chặn lặp cùng nội dung trong 30 giây. Deploy sau proxy thì đặt `TRUST_PROXY=1`. Kiểm thử: `npm run test:ratelimit --prefix server`.)

## 8. Câu hỏi còn mở
1. **Sưu tầm võ hồn:** mảnh võ hồn, cộng với lễ thức tỉnh tặng Lam Ngân Thảo và cho tự chọn 1 SSR (mục 5.1), có ổn không?
   - **Trả lời:** thức tỉnh tự do: tặng Lam Ngân Thảo và tự chọn 1 võ hồn SSR bất kỳ trong danh sách SSR (không phải "chọn 1 trong 3"). Đã làm ở bước 2.2.
   - Hạo Thiên Chùy, Cửu Bảo Lưu Ly Tháp… xếp độ hiếm gì (UR?) và lấy bằng cách nào?
   - Chủ nhân của Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa, Hỏa Ảnh, Thiên Càn Bạch Ngọc Đỉnh là ai? (Ảnh hưởng chân dung thẻ võ hồn, mục 5.11.)
2. **Đội hình:** 4 võ hồn và cách chia kinh nghiệm 40/20/20/20 có ổn không?
   - **Trả lời:** đồng ý: đội 4 võ hồn, chia kinh nghiệm 40/20/20/20. Làm ở bước 2.3.
3. **Hồn kỹ vòng 8–10:** muốn thiết kế thế nào?
4. **Giới hạn hồn hoàn vòng 5–10:** con số trong bảng mục 5.2 cần đối chiếu lại với truyện.
5. **Kinh tế:** có cho giao dịch giữa người chơi và PvP ngoài rừng không?
6. **Nền tảng:** ưu tiên điện thoại hay máy tính? Đội 4 võ hồn và nhiều phím kỹ năng sẽ khó điều khiển trên điện thoại.
   - **Trả lời:** ưu tiên máy tính; có bản điện thoại thì càng tốt. Giao diện mới phải dùng được bằng cả chuột lẫn chạm.
7. **Mỹ thuật:** 6 màu tóc và 6 màu áo có đủ không? Có thêm tông da, kiểu áo khác (đồng phục Sử Lai Khắc, áo Vũ Hồn Điện) không? Ai vẽ phần nào?

**Đã chốt: mỹ thuật nhân vật** (chi tiết ở mục 3 và 5.11)
- Người chơi có **nhân vật hồn sư riêng**, chọn **nam hoặc nữ** khi tạo tài khoản. Trên bản đồ là hồn sư; võ hồn đang ra trận hiện dạng **phụ thể khi phóng thích** (vũ khí, thú hồn, cánh, hào quang) cùng vòng hồn hoàn dưới chân. Đổi võ hồn thì đổi lớp phụ thể. Nhân vật truyện chỉ dùng cho chân dung và thẻ võ hồn.
- Sprite **32×32, 4 hướng, chibi pixel RPG**, cao khoảng 2 ô bản đồ.
- Nguồn asset: **AI tạo concept, vẽ lại và chỉnh pixel bằng Aseprite**; ảnh AI không đưa thẳng vào game.
- Tùy biến: nam/nữ, 4 kiểu tóc mỗi giới, vài màu tóc và màu áo; asset **ghép theo lớp** (thân, áo, tóc, phụ thể võ hồn).
