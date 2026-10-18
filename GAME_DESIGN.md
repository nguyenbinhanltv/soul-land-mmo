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
- **Thế giới mở, nhiều người cùng thấy nhau** trên từng bản đồ; các bản đồ nối với nhau bằng cổng (mục 5.3).
- **Thua không mất đồ:** không bao giờ mất võ hồn, hồn hoàn đã hấp thụ, hồn cốt hay hồn hạch đang gắn.

## 3. Mô hình chơi
- **Người chơi là một hồn sư có nhân vật riêng.** Khi tạo tài khoản, người chơi chọn **nam hoặc nữ**, kiểu tóc, màu tóc và màu áo (mục 5.11). Hồn sư chỉ là hình ảnh đại diện: cấp, chỉ số và hồn hoàn đều thuộc về từng võ hồn.
- **Võ hồn là đơn vị nuôi riêng, sưu tầm được.** Trên bản đồ, người khác thấy hồn sư của bạn cùng **võ hồn đang ra trận ở dạng phóng thích**, như trong truyện: vũ khí trên tay, thú hồn phụ thể (tai, đuôi, cánh), hư ảnh hoặc hào quang quanh người, kèm các **vòng hồn hoàn của võ hồn đó** dưới chân. Đổi võ hồn thì đổi lớp phụ thể và bộ vòng hồn hoàn; thân hồn sư giữ nguyên.
- **Nhân vật truyện dùng cho chân dung và thẻ võ hồn** trong giao diện (ví dụ thẻ Lam Ngân Thảo vẽ Đường Tam, thẻ Nhu Cốt Thố vẽ Tiểu Vũ), không dùng làm nhân vật trên bản đồ.
- **Đội hình 4 võ hồn** (đã chốt). Trên bản đồ chỉ hiện võ hồn đang ra trận; đổi sang võ hồn khác trong đội ngay khi đang đánh.
- **Mỗi võ hồn có 10 hồn hoàn**, ứng với cấp 1–100: bình cảnh ở cấp 10, 20, …, 100.
- **Niên hạn tối đa: 10 vạn năm (100.000 năm).**
- Thế giới mở thời gian thực gồm nhiều bản đồ (thành, bản đồ săn, bản đồ boss). Người chơi cùng bản đồ và cùng kênh thì thấy nhau.

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
- **Vùng**: một bản đồ duy nhất (`forest.json`) chia vùng theo chiều đông, càng sâu càng mạnh (layer `zones` của Tiled). ➜ BĐ1–BĐ3: nhiều bản đồ, mỗi vùng khai báo loài và niên hạn (mục 5.3).
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
- Các võ hồn khác mở bằng **mảnh võ hồn**: rơi từ hồn thú (mỗi bản đồ săn rơi mảnh của 2–3 võ hồn riêng, bảng ở mục 5.3), tà hóa thú vương, boss thế giới và nhiệm vụ. Đủ 50 mảnh thì mở võ hồn.
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

### 5.3 Thế giới nhiều bản đồ và hồn thú
Thế giới gồm nhiều bản đồ nối với nhau bằng **cổng**. Mỗi bản đồ là một file Tiled riêng và một phòng riêng trên server (mỗi phòng là một kênh, mục 6). Có 3 loại bản đồ (`kind` trong `MAPS`):
- **Thành (`town`):** cả bản đồ an toàn, không có hồn thú, không giao chiến (mục 5.8). Gồm Nặc Đinh Thành và Thiên Đấu Thành.
- **Bản đồ săn (`hunt`):** 3–4 vùng, càng vào sâu hồn thú càng già và càng mạnh. Bản đồ săn có thể chứa **vùng an toàn** (object `safe`): trong vùng này không sinh hồn thú, hồn thú không đuổi vào và không giao chiến. **Thánh Hồn Thôn là bản đồ săn (`hunt`)**, khu làng ở giữa là vùng `safe`.
- **Bản đồ boss (`boss`):** Lõi Tinh Đấu, chỉ có boss thế giới (mục 5.4).

**Danh sách bản đồ**

| Bản đồ (`mapId`) | Loại | Cấp đề xuất | Niên hạn hồn thú | Nối với | Làm ở |
|---|---|---|---|---|---|
| Thánh Hồn Thôn (`thanh_hon_thon`) | Săn (`hunt`): bãi tập quanh làng, khu làng là vùng `safe` | 1–10 | 10–450 | Nặc Đinh Thành | BĐ2 |
| Nặc Đinh Thành (`nac_dinh_thanh`) | Thành an toàn: Đại Sư, thương nhân, lò rèn | – | – | Thánh Hồn Thôn, Ngoại vi, Thiên Đấu Thành | BĐ2 |
| Tinh Đấu Đại Sâm Lâm – Ngoại vi (`tinh_dau_ngoai_vi`) | Săn | 10–30 | 300–2.000 | Nặc Đinh Thành, Nội địa | BĐ3 |
| Tinh Đấu Đại Sâm Lâm – Nội địa (`tinh_dau_noi_dia`) | Săn | 30–60 | 1.500–25.000 | Ngoại vi, Lõi Tinh Đấu | BĐ3 |
| Lạc Nhật Sâm Lâm (`lac_nhat_sam_lam`) | Săn: thực vật, độc; rơi tiên thảo | 40–70 | 5.000–30.000 | Thiên Đấu Thành | BĐ6 |
| Thiên Đấu Thành (`thien_dau_thanh`) | Thành an toàn: Đại Đấu Hồn Trường | – | – | Nặc Đinh Thành, Lạc Nhật, Cực Bắc, Hải Thần Đảo | BĐ6 |
| Cực Bắc Chi Địa (`cuc_bac_chi_dia`) | Săn: băng | 60–85 | 20.000–80.000 | Thiên Đấu Thành | BĐ6 |
| Hải Thần Đảo / Ma Quỷ Hải Vực (`hai_than_dao`) | Săn: biển | 80–100 | 50.000–100.000 | Thiên Đấu Thành (bến thuyền) | BĐ6 |
| Lõi Tinh Đấu (`loi_tinh_dau`) | Boss thế giới, hồ trung tâm rừng | 80+ | Boss 100.000 năm | Nội địa (cuối Hắc Ám Lâm) | BĐ6 |

- **Bản đầu chỉ có 4 bản đồ:** Thánh Hồn Thôn, Nặc Đinh Thành, Ngoại vi, Nội địa. Các bản đồ còn lại thuộc Giai đoạn 8 (BĐ6). Cổng dẫn tới bản đồ chưa có thì không hiện.
- Tài khoản mới (và tài khoản cũ khi làm BĐ2) bắt đầu ở Thánh Hồn Thôn.

**Quy cấp theo niên hạn**

Cấp tương đương của một hồn thú là **cấp nhỏ nhất mà võ hồn hấp thụ được hồn hoàn của nó trong giới hạn** (bảng giới hạn ở mục 5.2). Vòng thứ k hấp thụ ở bình cảnh cấp 10×k, nên với bảng hiện tại:

| Niên hạn | ≤ 423 | 424–764 | 765–1.760 | 1.761–5.000 | 5.001–12.000 | 12.001–20.000 | 20.001–50.000 | 50.001–100.000 |
|---|---|---|---|---|---|---|---|---|
| Cấp tương đương | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 |

- Code tính cấp tương đương từ bảng giới hạn theo năm trong `data.ts`, không chép bảng trên. Khi đối chiếu lại giới hạn vòng 5+ với truyện (mục 8), cấp tương đương tự đổi theo.
- Vòng 8–10 cùng giới hạn 100.000 năm nên không có hồn thú nào có cấp tương đương trên 80. Khi so cấp, **cấp võ hồn được tính tối đa 80**, để võ hồn cấp 90–100 săn ở Hải Thần Đảo không bị giảm kinh nghiệm.
- Mỗi bản đồ săn nhắm vào khoảng cấp mà niên hạn hồn thú khớp với giới hạn **vòng kế tiếp** của người chơi. Ví dụ Ngoại vi (cấp 10–30) có hồn thú 300–2.000 năm: đủ cho vòng 2 (≤ 764) và vòng 3 (≤ 1.760); vùng sâu nhất vượt giới hạn một chút cho người muốn liều. Khoảng cấp của các bản đồ kế nhau chồng lên nhau khoảng 10 cấp.

**Giảm kinh nghiệm khi săn hồn thú quá yếu**

So cấp của võ hồn đang ra trận (tối đa 80) với cấp tương đương của hồn thú bị hạ:

| Hồn thú thấp hơn võ hồn | Dưới 10 cấp | Từ 10 cấp | Từ 20 cấp |
|---|---|---|---|
| Kinh nghiệm nhận | 100% | 50% | 10% |

- Giảm một lần trước khi chia cho đội 4 võ hồn (bước 2.3) và cho tổ đội người chơi (mục 5.9).
- **Chỉ giảm kinh nghiệm.** Hồn hoàn và các đồ rơi khác vẫn rơi bình thường, để người chơi quay về bản đồ dễ săn đúng hồn hoàn hợp vòng mà không bị thiệt.
- Hồn thú mạnh hơn võ hồn không cho thêm kinh nghiệm.

**Cổng và chặn mềm**
- Cổng là một vùng chữ nhật trong file Tiled (object `portal`, mục 6) gồm: bản đồ đích, điểm xuất hiện ở bản đồ đích, cấp đề xuất.
- Bước vào cổng thì client hiện hộp "Đi tới *Nội địa* (đề xuất cấp 30–60)". Nếu cấp võ hồn đang ra trận thấp hơn cấp đề xuất tối thiểu, hộp có thêm **cảnh báo nguy hiểm** màu đỏ. **Chặn mềm:** không đủ cấp vẫn vào được nếu xác nhận.
- Server vẫn kiểm tra cổng: người chơi đang đứng trong vùng cổng, cổng thuộc bản đồ hiện tại, bản đồ đích có trong `MAPS`, không gục, không đang hấp thụ. Client chỉ gửi tên cổng, **không bao giờ tự chọn bản đồ** hay gửi tọa độ đích. Phòng cũ lưu xong rồi mới cho chuyển (thứ tự ở mục 6).
- Điểm xuất hiện (`arrive`) ở bản đồ đích phải nằm **ngoài mọi vùng `portal`** của bản đồ đó, để vừa tới nơi không bị hiện lại hộp đi cổng.
- Đi qua cổng mất 1 giây niệm, bị đánh thì hủy (chờ chốt).

**Vùng và hồn thú của từng bản đồ săn**

Tên chưa có trong truyện là tên tự đặt theo phong cách Đấu La. Chiêu báo trước có 3 hình: **vệt** (đường thẳng), **nón** (hình quạt trước mặt), **vòng** (hình tròn quanh thân hoặc dưới chân mục tiêu).
- Hồn thú thường: chiêu sau dấu ➜ chỉ có ở cá thể **từ 1.000 năm**; dưới 1.000 năm chỉ đánh thường.
- Tinh anh có 2 chiêu báo trước; thú vương có 2–3 chiêu và giai đoạn 2 khi còn 50% máu (mục 5.4).
- Cột "Cấp" là cấp tương đương của niên hạn trong vùng.

*Thánh Hồn Thôn* (cấp 1–10). Làng ở giữa bản đồ là vùng an toàn; khu săn bao quanh làng. Không có thú vương (bản đồ tân thủ).

| Vùng | Niên hạn | Cấp | Hồn thú thường | Tinh anh |
|---|---|---|---|---|
| Đồng lúa ven làng | 10–100 | 10 | Nhu Cốt Thỏ hoang (húc nhẹ, yếu máu thì bỏ chạy, không chủ động tấn công); Điền Thử (chuột đồng đi đàn 3 con, cắn nhanh); Hôi Vũ Tước (sẻ xám, sà xuống mổ rồi bay lên) | **Bạch Nhung Thỏ Vương**: Đạp Đất (vòng nhỏ), Phóng Nhảy (vệt ngắn) |
| Bãi tập hồn sư | 80–250 | 10 | Phong Lang con (cắn, bị đánh thì gọi bầy); Thiết Giáp Xuyên Sơn Giáp (cuộn tròn lăn húc); Độc Châm Phong (ong, đốt gây Trúng độc nhẹ) | **Ngân Bối Phong Lang Đầu Lĩnh**: Hú Bầy (vòng, gọi 2 sói con), Vồ (vệt) |
| Hậu Sơn (đồi sau làng) | 200–450 | 10–20 | Hắc Bối Dã Trư (heo rừng lao húc); Thanh Lân Xà (rắn cắn độc); Quỷ Đằng non (dây leo đứng yên, quất tầm trung) | **Thiết Nha Dã Trư Vương**: Húc Lao (vệt dài), Dậm Đất (vòng) |

*Tinh Đấu Đại Sâm Lâm – Ngoại vi* (cấp 10–30)

| Vùng | Niên hạn | Cấp | Hồn thú thường | Tinh anh |
|---|---|---|---|---|
| Bìa rừng | 300–700 | 10–20 | Phong Lang (đi bầy 3–4 con, cắn); Mạn Đà La Xà (quấn trói 1 giây); Tử Văn Báo (vồ nhanh rồi lùi) | **Huyết Nhãn Phong Lang**: Hú Bầy (vòng, gọi 3 Phong Lang), Xé Toạc (nón) |
| Rừng thưa | 600–1.200 | 20–30 | Mạn Đà La Xà ➜ Phun Độc (vệt dài, Trúng độc); Quỷ Đằng (đứng yên) ➜ Quật Roi (nón rộng); Lôi Văn Hầu (khỉ ném đá từ xa) ➜ Gọi Sét (vòng dưới chân mục tiêu, Cảm điện) | **Huyết Gai Quỷ Đằng**: Gai Trồi (3 vòng nối thành hàng), Quấn Kéo (vệt, kéo mục tiêu lại gần) |
| Khe suối | 1.000–1.600 | 30 | Quỷ Hổ ➜ Vồ Lao (vệt dài); Thanh Lân Ngạc (cá sấu nằm dưới nước) ➜ Táp Ngang (nón); Kim Linh Ưng ➜ Bổ Nhào (vòng) | **Hắc Sát Quỷ Hổ**: Tam Liên Vồ (3 vệt nối tiếp), Hổ Khiếu (vòng lớn, Choáng 1 giây) |
| Rìa nội địa | 1.400–2.000 | 30–40 | Nhân Diện Ma Chu non ➜ Giăng Tơ (vòng, làm chậm); Liệt Trảo Hùng ➜ Vỗ Đất (vòng); Thiết Giáp Tê Ngưu ➜ Xung Phong (vệt rất dài) | **Ảnh Trảo Linh Miêu**: Ảnh Tập (mờ đi rồi lướt vệt dài ra sau lưng mục tiêu), Liên Hoàn Trảo (nón, 3 nhát) |

Thú vương: **Tà hóa Huyết Nguyệt Lang Vương** (2.000 năm, máu x6). Huyết Nguyệt Hú (vòng lớn, gọi 4 Phong Lang); Liệt Phong Trảo (3 nón liên tiếp, xoay dần). **Giai đoạn 2 – Huyết Cuồng:** tốc độ tăng 40%, cứ 10 giây đánh dấu 1 người rồi lao xuyên tới (vệt dài, báo trước 1,2 giây).

*Tinh Đấu Đại Sâm Lâm – Nội địa* (cấp 30–60)

| Vùng | Niên hạn | Cấp | Hồn thú thường | Tinh anh |
|---|---|---|---|---|
| Rừng cổ thụ | 1.500–5.000 | 30–40 | Nhân Diện Ma Chu ➜ Phun Tơ (vệt, Trói 1,5 giây); U Minh Lang (đi bầy) ➜ Ảnh Vồ (vệt); Quỷ Đằng ngàn năm ➜ Rễ Trói (vòng) | **U Minh Lang Vương**: Hú Bầy (vòng, gọi 3 U Minh Lang), Ảnh Tập (biến mất, hiện ra sau lưng mục tiêu, vòng nhỏ báo trước) |
| Đầm sương độc | 4.000–12.000 | 40–50 | Thất Tinh Độc Thiềm ➜ Phun Độc (vòng, để lại vũng độc); Xích Lân Mãng ➜ Quấn Siết (vòng nhỏ, Trói); Hắc Vụ Biên Bức (dơi đi đàn) ➜ Âm Ba (nón, Câm lặng) | **Kim Bối Thất Tinh Thiềm**: Nổ Túi Độc (vòng lớn, vũng độc 6 giây), Lưỡi Quất (vệt, kéo mục tiêu) |
| Lôi Cốc (thung lũng sấm) | 10.000–18.000 | 50–60 | Lam Lôi Tê Ngưu ➜ Lôi Xung (vệt dài, Cảm điện); Lôi Dực Ưng ➜ Lôi Bạo (vòng dưới chân mục tiêu) | **Lam Điện Lôi Tích**: Lôi Trụ (3 vòng sét nổ lần lượt), Lôi Quang Xung (vệt rất dài) |
| Hắc Ám Lâm (rừng sâu) | 15.000–25.000 | 60–70 | Ám Kim Khủng Trảo Hùng ➜ Vỗ Đất (vòng); Kiếm Vĩ Hạt (bọ cạp đuôi kiếm) ➜ Kiếm Vĩ Đâm (vệt, Liệt thương); Quỷ Ảnh Báo ➜ Ảnh Trảm (nón, lao ra từ bóng tối) | **Huyết Văn Khủng Trảo Hùng**: Ám Kim Liệt Địa (3 vết nứt tỏa hình quạt), Cuồng Bạo Vỗ (vòng lớn 2 lần liền) |

Thú vương: **Tà hóa Thiên Độc Chu Hoàng** (25.000 năm, máu x7). Thiên La Võng (vòng lớn, ai đứng trong bị Trói 2 giây); Độc Châm Vũ (nhiều vòng nhỏ rơi ngẫu nhiên, Trúng độc cộng dồn). **Giai đoạn 2 – Vạn Chu Phệ:** đẻ 3 bọc trứng, không phá trong 8 giây thì mỗi bọc nở 2 nhện con; tơ phủ 1/3 hang luân phiên (vùng cấm báo trước 2 giây).

*Lạc Nhật Sâm Lâm* (cấp 40–70, BĐ6). Rừng thực vật và độc, quanh suối Băng Hỏa Lưỡng Nghi Nhãn. **Tiên thảo** (Bát Giác Huyền Băng Thảo, Liệt Hỏa Hạnh Kiều Sơ, Ỷ La Uất Kim Hương…) chỉ rơi ở đây, vùng càng sâu tỉ lệ càng cao (tỉ lệ chờ chốt, mục 5.7).

| Vùng | Niên hạn | Cấp | Hồn thú thường | Tinh anh |
|---|---|---|---|---|
| Rừng hoa độc | 5.000–10.000 | 40–50 | Thực Nhân Hoa (đứng yên) ➜ Phấn Mê (vòng, Mê hoặc); Cúc Yêu Hoa Linh ➜ Phi Hoa (nón, cánh hoa); Độc Cức Đằng ➜ Gai Trồi (vệt) | **Huyết Mạn Thực Nhân Hoa**: Nuốt Chửng (vòng nhỏ, kéo vào giữa, giữ 2 giây), Đại Phấn Mê (vòng lớn) |
| Đầm Bích Lân | 10.000–18.000 | 50–60 | Bích Lân Xà ➜ Phun Độc (vệt, Trúng độc); Độc Vụ Thiềm ➜ Sương Độc (vòng, để lại sương); Hắc Thủy Mãng ➜ Quật Đuôi (nón) | **Song Đầu Bích Lân Xà**: Song Xà Phun (2 vệt chéo), Lân Độc Vụ (vòng, sương độc 8 giây) |
| Băng Hỏa Tuyền | 16.000–25.000 | 60–70 | Liệt Hỏa Tích Dịch ➜ Phun Lửa (nón, Thiêu đốt); Huyền Băng Thiềm ➜ Băng Khí (vòng, làm chậm); Hỏa Linh Điệp ➜ Tự Bạo (vòng nhỏ) | **Băng Hỏa Song Sắc Mãng** (đổi băng/hỏa mỗi 10 giây): Băng Hỏa Giao Thoa (2 vệt chữ X), Song Sắc Tức (nón, băng làm chậm hoặc lửa Thiêu đốt) |
| Lưỡng Nghi Nhãn | 22.000–30.000 | 70 | Cổ Mộc Thụ Nhân ➜ Dậm Rễ (vòng lớn); Ỷ La Hoa Yêu ➜ Hương Mê (nón, Mê hoặc); Thanh Lân Độc Cổ ➜ Độc Châm (vệt) | **Khô Đằng Thụ Vương**: Rễ Trói (vòng, Trói người gần nhất), Hút Sinh (hồi máu từ người đang bị trói) |

Thú vương: **Tà hóa Lưỡng Nghi Thủ Hộ Xà** (30.000 năm, máu x7). Băng Tức (nón, làm chậm); Hỏa Tức (nón, Thiêu đốt). **Giai đoạn 2 – Lưỡng Nghi Luân Chuyển:** hang chia nửa băng, nửa lửa, đổi chỗ mỗi 12 giây (báo trước 2 giây); đứng nhầm nửa thì bị đóng băng hoặc thiêu đốt nặng.

*Cực Bắc Chi Địa* (cấp 60–85, BĐ6)

| Vùng | Niên hạn | Cấp | Hồn thú thường | Tinh anh |
|---|---|---|---|---|
| Tuyết nguyên | 20.000–35.000 | 60–70 | Tuyết Lang (đi bầy) ➜ Băng Nha (vệt); Băng Nguyên Cự Tượng ➜ Dậm Băng (vòng, làm chậm); Băng Vũ Ưng ➜ Bổ Nhào (vòng) | **Ngân Nguyệt Tuyết Lang Vương**: Bão Tuyết (vòng lớn, làm chậm), Hú Bầy (gọi 3 Tuyết Lang) |
| Băng hà nứt | 30.000–50.000 | 70 | Băng Giáp Cự Quy ➜ Xoay Vỏ (vệt dài); Tuyết Vĩ Yêu Hồ ➜ Mị Ảnh (vòng, Mê hoặc); Băng Tinh Hạt ➜ Băng Châm (vệt) | **Lục Vĩ Băng Hồ**: Phân Thân (3 ảo ảnh, ảo ảnh nổ vòng), Mị Nhãn (nón, Mê hoặc) |
| Băng Phong Cốc | 45.000–65.000 | 70–80 | Hàn Băng Địa Long ➜ Phun Băng (nón, đóng băng 1 giây); Băng Phong Bạch Hùng ➜ Vỗ Đất (vòng); Hàn Nguyệt Ưng ➜ Nguyệt Phong (vệt) | **Huyền Băng Tỏa Liên Mãng**: Băng Liên Phong Tỏa (vòng, giam 2 giây), Băng Trùy Vũ (nhiều vòng nhỏ) |
| Cực Bắc Băng Uyên | 60.000–80.000 | 80 | Băng Bích Hạt ➜ Băng Bích Châm (vệt, đóng băng); Huyền Minh Băng Tằm ➜ Nhả Tơ Băng (vệt, Trói); Tuyết Ma Viên ➜ Ném Băng Khối (vòng ở xa) | **Băng Bích Hạt Vương**: Tam Liên Châm (3 vệt tỏa), Cực Hàn Lĩnh Vực (vòng lớn, làm chậm tăng dần) |

Thú vương: **Tà hóa Huyền Minh Băng Giao** (80.000 năm, máu x8). Băng Phong Thiên Lý (vệt cực dài cắt ngang hang); Băng Trùy Vũ (nhiều vòng). **Giai đoạn 2 – Cực Hàn:** mọi người tích tầng Hàn theo thời gian, đủ 4 tầng thì đóng băng 3 giây; đứng cạnh Hỏa Đàn (đống lửa trong hang) hoặc được phụ trợ thanh tẩy thì xả tầng.

*Hải Thần Đảo / Ma Quỷ Hải Vực* (cấp 80–100, BĐ6)

| Vùng | Niên hạn | Cấp | Hồn thú thường | Tinh anh |
|---|---|---|---|---|
| Bãi san hô | 50.000–65.000 | 70–80 | Thiết Giáp Cự Giải ➜ Kìm Kẹp (nón); Lam Lân Hải Xà ➜ Thủy Tiễn (vệt); Kiếm Ngư ➜ Xuyên Kích (vệt rất dài) | **Hắc Giáp Cự Giải Vương**: Song Kìm (2 nón liên tiếp), Phun Bọt (vòng, làm chậm) |
| Ma Quỷ Hải Vực (rạn nông) | 60.000–80.000 | 80 | Quỷ Diện Hải Yêu ➜ Mê Ca (nón, Mê hoặc); Thâm Hải Ma Chương ➜ Xúc Tu Quật (nhiều vệt); Lôi Quang Hải Diêu ➜ Điện Lưu (vòng, Cảm điện) | **Ma Chương Vương**: Bát Xúc Đập (8 vệt luân phiên), Phun Mực (vòng, che tầm nhìn) |
| Vách Hải Thần | 75.000–90.000 | 80 | Kim Lân Long Quy ➜ Sóng Cuộn (vệt rộng); Huyết Nha Cự Sa ➜ Lao Cắn (vệt); Lôi Vân Hải Ưng ➜ Lôi Bổ (vòng) | **Huyết Sa Bạo Quân**: Tam Liên Xé (3 vệt), Huyết Khí (vòng dưới chân người ít máu nhất) |
| Hải Thần Uyên | 85.000–100.000 | 80 | Thâm Hải Ma Kình ➜ Quật Đuôi (nón rộng); U Linh Hải Mẫu (sứa) ➜ Độc Điện (vòng, Trúng độc và Cảm điện) | **Hắc Uyên Ma Kình**: Hấp Thủy (kéo mọi người lại gần), Thủy Trụ (nhiều vòng) |

Thú vương: **Tà hóa Thâm Hải Ma Kình Vương** (95.000 năm, máu x8). Ma Kình Hống (vòng lớn, Choáng 1,5 giây); Thôn Hải (hút mọi người về giữa rồi nổ vòng). **Giai đoạn 2 – Thủy Triều Dâng:** các vùng ngập luân phiên làm chậm 50%, sinh xoáy nước kéo người vào.

*Lõi Tinh Đấu* (BĐ6): hồ trung tâm Tinh Đấu Đại Sâm Lâm, không có hồn thú thường. Boss thế giới Thái Thản Cự Viên và Thiên Thanh Ngưu Mãng (mục 5.4).

**Rơi đặc trưng theo bản đồ**

Mỗi bản đồ săn rơi mảnh của 2–3 võ hồn riêng (mục 5.1) và hồn hạch thuộc bộ đặc trưng (bảng bộ ở mục 5.6). Sao hồn hạch vẫn theo niên hạn (bảng rơi bên dưới).

| Bản đồ | Mảnh võ hồn | Bộ hồn hạch |
|---|---|---|
| Thánh Hồn Thôn | Lam Ngân Thảo (để lên sao), Nhu Cốt Thố | Lam Ngân, Tiên Cơ |
| Ngoại vi | U Minh Linh Miêu, Kim Vũ Miêu Ưng, Xúc Xích | Linh Miêu, Hạo Thiên, Xà Hoàng |
| Nội địa | Tử Vong Chu Hoàng, Lam Điện Bá Vương Long, Cửu Tinh Thất Sát Kiếm | Bá Vương Long, Thất Sát, Lưu Ly |
| Lạc Nhật Sâm Lâm | Bích Lân Xà Hoàng, Kỳ Nhung Thông Thiên Cúc, Hỏa Long | Xà Hoàng, Phượng Hoàng |
| Cực Bắc Chi Địa | Yêu Hồ, Càn Khôn Hỗn Nguyên Tỏa, Nguyệt Nhận | Lam Ngân, Thất Sát |
| Hải Thần Đảo | Quỷ Mị, Thiên Càn Bạch Ngọc Đỉnh, Hỏa Ảnh | Bá Vương Long, Tiên Cơ |
| Rương tà hóa thú vương (mọi bản đồ) | Mảnh của bản đồ đó, hoặc Tà Hỏa Phượng Hoàng | Bộ của bản đồ đó, hoặc Phượng Hoàng |
| Boss thế giới | Mảnh UR: Hạo Thiên Chùy, Cửu Bảo Lưu Ly Tháp | Mọi bộ |

- Trước BĐ6, rương tà hóa thú vương rơi thêm mảnh của võ hồn thuộc bản đồ chưa mở, để không võ hồn nào bị khóa hẳn.
- **Mảnh UR trước BĐ6:** rương tà hóa thú vương có tỉ lệ thấp rơi 1 mảnh UR (Hạo Thiên Chùy hoặc Cửu Bảo Lưu Ly Tháp; đề xuất 5%, chờ chốt), để hai võ hồn UR không bị khóa hẳn cho tới Giai đoạn 8. Từ BĐ6, mảnh UR **chỉ** rơi từ boss thế giới và rương thú vương thôi rơi mảnh UR.

**Luật chung của hồn thú**
- Chỉ số hồn thú tăng theo số năm, không chỉ theo màu. Loài (bảng `BEASTS`) quyết định kiểu tấn công, chiêu và hệ số chỉ số.
- **Chiêu có báo trước:** hồn thú từ 1.000 năm trở lên có 1 chiêu đặc biệt, hiện vùng cảnh báo khoảng 0,8 giây (bảng ở trên). Tinh anh và boss: mục 5.4.
- **Mỗi bản đồ (mỗi kênh) có tối đa 1 hồn thú thường 100.000 năm cùng lúc**; chỉ vùng Hải Thần Uyên sinh được. Thú vương và boss thế giới không tính vào luật này.
- **Rơi đồ dựa vào farm:** mỗi lần hạ hồn thú, mỗi loại đồ được tung tỉ lệ riêng (bảng `DROPS` trong `data.ts`). Hồn thú năm càng cao thì tỉ lệ rơi đồ tốt càng cao. Tinh anh và boss có thêm hệ số ở mục 5.4.

| Hồn thú | Hồn hoàn | Hồn cốt | Hồn hạch | Mảnh võ hồn |
|---|---|---|---|---|
| < 1.000 năm | 100% | 0% | 15% (1–2★) | 10% |
| 1.000 – 9.999 | 100% | 1% | 25% (2–4★) | 15% |
| 10.000 – 99.999 | 100% | 4% | 40% (3–5★) | 20% |
| 100.000 | 100% | 20% | 100% (5–6★) | 100% |

### 5.4 Bậc hồn thú: thường, tinh anh, thú vương, boss thế giới
Mỗi hồn thú thuộc 1 trong 4 bậc. Hệ số nhân vào chỉ số của hồn thú thường cùng loài và cùng niên hạn.

| | Thường | Tinh anh (biến dị) | Tà hóa thú vương (boss bản đồ) | Boss thế giới 100.000 năm |
|---|---|---|---|---|
| Máu | x1 | x2,5 | x6–8 (theo bản đồ, bảng 5.3) | x30 |
| Sát thương | x1 | x1,5 | x2 (chờ chốt) | x3 (chờ chốt); nổi giận sau 10 phút |
| Máu tăng theo số người | Không | Có | Có | Có |
| Số lượng | Theo `count` của vùng | 1 con mỗi vùng | 1 con mỗi bản đồ săn (trừ Thánh Hồn Thôn), mỗi kênh một con | 1 con mỗi kênh, ở Lõi Tinh Đấu |
| Xuất hiện | Hồi sinh liên tục | Hồi sinh ngẫu nhiên 8–12 phút sau khi bị hạ | Theo lịch, ví dụ 20:00 và 22:00; báo toàn server trước 5 phút | 1 lần/ngày; báo toàn server trước 5 phút |
| Chiêu báo trước | 1 chiêu, từ 1.000 năm | 2 chiêu | 2–3 chiêu, đổi giai đoạn ở 50% máu | Nhiều giai đoạn, buộc đổi võ hồn đúng lúc |
| Nhận diện | – | Aura riêng, hiện trên bản đồ nhỏ | Sprite 96×96, thanh máu lớn ở đầu màn hình | Như thú vương, sprite lớn hơn |
| Thưởng | Bảng rơi ở 5.3 | Hồn cốt x3 tỉ lệ, chắc chắn rơi hồn hạch | Chia theo đóng góp, từ 3% có rương | Hồn hoàn đỏ, hồn cốt niên hạn cao, mảnh UR |
| Giới hạn nhận thưởng | – | – | 3 lần/ngày | 1 lần/ngày |

**Thường:** như mục 5.3. Sinh theo `count` của vùng, chỉ đánh thường; từ 1.000 năm có 1 chiêu báo trước.

**Tinh anh (biến dị)**
- Mỗi vùng đúng **1 con** với tên riêng (cột Tinh anh ở 5.3), niên hạn bằng mức trên của vùng. Vị trí sinh do object `elite` trong file Tiled đánh dấu.
- Bị hạ thì hồi sinh sau **8–12 phút ngẫu nhiên**; server không báo giờ.
- **Aura riêng:** vầng sáng màu riêng quanh thân, sprite loài gốc phóng 1,25 lần (vẽ bằng code). **Hiện trên bản đồ nhỏ** bằng chấm sáng khi còn sống.
- **2 chiêu báo trước.**
- Thưởng: hồn hoàn rơi như thường, 15 giây đầu thuộc người đóng góp nhiều nhất; tỉ lệ hồn cốt **x3** so với bảng rơi; **chắc chắn rơi 1 hồn hạch** (sao theo niên hạn, bộ theo bản đồ); kinh nghiệm x2,5 (chờ chốt).

**Tà hóa thú vương (boss bản đồ)**
- Mỗi bản đồ săn trừ Thánh Hồn Thôn có 1 thú vương riêng (bảng 5.3), xuất hiện trong hang ở vùng sâu nhất (object `boss`). Niên hạn bằng mức trên của bản đồ (Hải Thần Đảo: 95.000 năm). Máu x6–8 tùy bản đồ.
- **Theo lịch**, ví dụ 20:00 và 22:00 giờ Việt Nam. **Báo toàn server trước 5 phút** và lúc xuất hiện. Mỗi kênh đang mở của bản đồ đó có thú vương riêng. Không ai hạ trong 15 phút thì thú vương rút đi.
- **2–3 chiêu** có vùng cảnh báo dài hơn hồn thú thường (1–1,5 giây). **Còn 50% máu thì đổi sang giai đoạn 2:** gầm lên, đứng yên 2 giây (không nhận khống chế), rồi dùng chiêu giai đoạn 2 và nhanh hơn.
- **Chia thưởng theo đóng góp.** Đóng góp = sát thương lên thú vương (đề xuất: tính cả hồi máu và khiên cho người tham gia khác, để phụ trợ không bị thiệt).
  - Người đóng góp nhiều nhất được ưu tiên hồn hoàn (15 giây đầu).
  - Mọi người tham gia **đóng góp từ 3%** và còn trong phòng lúc thú vương bị hạ đều nhận **rương** vào túi đồ: hồn cốt, hồn hạch sao cao, mảnh võ hồn (bảng "Rơi đặc trưng" ở 5.3).
- **Tối đa 3 lần/ngày** mỗi tài khoản, tính chung mọi bản đồ, đặt lại lúc 00:00 giờ Việt Nam (`Asia/Ho_Chi_Minh`, cùng múi giờ với lịch boss). Lượt boss thế giới cũng đặt lại cùng mốc. Hết lượt vẫn được đánh và nhận kinh nghiệm, nhưng không nhận rương; vào giao chiến thì hiện nhắc "Hôm nay đã hết lượt nhận thưởng thú vương".

**Máu tăng theo số người tham gia** (tinh anh, thú vương, boss thế giới)

> Máu tối đa = máu gốc × hệ số bậc × (1 + 0,6 × (N − 1)), với N là số người tham gia.

| N | 1 | 2 | 4 | 10 | 20 |
|---|---|---|---|---|---|
| Hệ số máu | x1 | x1,6 | x2,8 | x6,4 | x12,4 |

- **Người tham gia** là hồn sư đang ở trong phòng và thỏa một trong hai điều kiện:
  1. Đứng trong **bán kính giao chiến** lúc boss bắt đầu giao chiến (lần đầu bị đánh). Bán kính: tinh anh 250 px, thú vương là vùng `boss` (hang), boss thế giới là cả sàn đấu.
  2. Sau đó **gây sát thương** lên boss (hoặc hồi máu, tạo khiên cho một người tham gia khác).
- Người tham gia đang gục vẫn được tính.
- **Người vào giữa trận:** thành người tham gia thì N tăng ngay; máu tối đa tính lại theo N mới và **máu hiện tại giữ nguyên tỉ lệ phần trăm** (boss đang 40% máu thì vẫn 40% của mức mới). Vì vậy vào phút cuối không làm boss dễ hơn mà còn làm trâu hơn.
- **Người rời giữa trận:** rời phòng, mất kết nối, hoặc ở ngoài bán kính giao chiến 30 giây liên tục thì bị loại khỏi danh sách. N giảm, máu cũng giữ nguyên tỉ lệ phần trăm. Mỗi 10 giây N giảm tối đa 1, để máu không nhảy liên tục khi có người ra vào mép bán kính.
- Người bị loại vẫn giữ đóng góp đã gây; muốn nhận thưởng thì phải còn trong phòng lúc boss bị hạ. Hệ số đã giảm không bao giờ làm boss hồi máu.
- **Bỏ giao chiến:** 15 giây không còn người tham gia nào trong bán kính thì boss về chỗ, hồi đầy máu, xóa danh sách và đóng góp.

**Boss thế giới 100.000 năm** (BĐ6)
- Ở **Lõi Tinh Đấu**: **Thái Thản Cự Viên** và **Thiên Thanh Ngưu Mãng**, luân phiên theo ngày. Xuất hiện **1 lần/ngày** (giờ chờ chốt, ví dụ 21:00 để không trùng 20:00 và 22:00), báo toàn server trước 5 phút.
- Máu **x30** (nhân thêm theo số người). Sau **10 phút** thì **nổi giận**: sát thương x3, đánh nhanh hơn, chiêu toàn sàn mỗi 15 giây. Thực tế phải hạ trong 10 phút. Sau 15 phút chưa hạ thì boss lặn xuống hồ, không ai nhận thưởng.
- **Cơ chế buộc đổi võ hồn đúng lúc** (cần đội 4 võ hồn, bước 2.3):
  - **Điểm yếu hệ:** ở 75%, 50%, 25% máu, boss hiện biểu tượng một hệ trên đầu trong 15 giây. Sát thương từ võ hồn hệ đó x2,5, từ hệ khác x0,5.
  - **Ngắt tích lực:** boss tụ lực 4 giây cho đòn toàn sàn. Chỉ khống chế (Choáng, Trói, ngắt chiêu) của võ hồn khống chế mới ngắt được, cần 3 lần khống chế trúng.
  - **Vết thương sâu:** đòn lớn để lại hiệu ứng nặng (Liệt thương hoặc độc cộng dồn) mà chỉ võ hồn phụ trợ thanh tẩy được.
  - *Thái Thản Cự Viên:* Bá Thể (khiên giáp, cường công phá nhanh gấp 3), Đại Địa Chấn (tích lực, phải ngắt), Cự Thạch (ném đá, vòng ở xa).
  - *Thiên Thanh Ngưu Mãng:* Thanh Lân Độc Vụ (độc toàn sàn, phụ trợ thanh tẩy), Du Thủy (lặn xuống hồ, nổi lên chỗ khác; mẫn công lướt kịp thì đánh trúng điểm yếu), Ngưu Giác Xung (vệt cực dài).
- **Thưởng** (đóng góp từ 3%, 1 lần/ngày):
  - **Hồn hoàn đỏ 100.000 năm** cho người đóng góp nhiều nhất; những người khác 10% nhận hồn hoàn đỏ, còn lại nhận hồn hoàn đen 80.000–99.999 năm (chờ chốt).
  - **Hồn cốt niên hạn cao** (tỉ lệ chờ chốt), hồn hạch 5–6★ bộ bất kỳ.
  - **Mảnh UR:** Hạo Thiên Chùy, Cửu Bảo Lưu Ly Tháp.

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
Thành (bản đồ `town`) và khu làng của Thánh Hồn Thôn (vùng `safe` trong một bản đồ săn) là nơi an toàn: không có hồn thú, không giao chiến, hồi máu và hồn lực nhanh. Mỗi bản đồ săn có **trại nhỏ ở cổng vào** (object `spawn`) làm điểm hồi sinh khi gục trên bản đồ đó (doanh trại hiện tại trở thành trại cổng của Tinh Đấu).

- **Thánh Hồn Thôn** (`thanh_hon_thon`, `kind` = `hunt`, BĐ2): làng quê của Đường Tam, nơi tài khoản mới bắt đầu.
  - Phần làng ở giữa là vùng an toàn (object `safe`) và là điểm hồi sinh của bản đồ (object `spawn` đặt trong vùng `safe`). Đồng lúa, bãi tập và đồi sau làng là khu săn cấp 1–10 (bảng 5.3).
  - **Tố Vân Đào** (chấp sự Vũ Hồn Điện): làm lễ thức tỉnh võ hồn đầu tiên. Lễ vẫn chạy qua `POST /api/awaken` trước khi vào phòng; trong làng ông là NPC chào người mới và giải thích võ hồn.
  - **Lão Kiệt Khắc** (trưởng thôn): chỉ đường ra bãi tập và cổng đi Nặc Đinh Thành.
- **Nặc Đinh Thành** (`nac_dinh_thanh`, BĐ2): thành an toàn đầu tiên, nối Thánh Hồn Thôn với Tinh Đấu Ngoại vi.
  - **Ngọc Tiểu Cương (Đại Sư)** ở Học viện Nặc Đinh: nhiệm vụ tân thủ, giải thích giới hạn hồn hoàn và cấp đề xuất của từng bản đồ.
  - **Thương nhân:** bán đan, mua đồ dư.
  - **Lò rèn:** cường hóa hồn cốt và hồn hạch.
  - Lối vào tạm Đại Đấu Hồn Trường (bước 7.2) đặt ở đây cho đến khi có Thiên Đấu Thành.
- **Thiên Đấu Thành** (`thien_dau_thanh`, BĐ6): thủ đô, trung tâm của Giai đoạn 8.
  - **Đại Đấu Hồn Trường:** PvP xếp hạng (mục 5.9).
  - **Sử Lai Khắc Học Viện:** nhiệm vụ hằng ngày (về sau).
  - Cổng tới Lạc Nhật Sâm Lâm và Cực Bắc Chi Địa, bến thuyền đi Hải Thần Đảo, đường lớn về Nặc Đinh Thành.
- **Trại cổng của bản đồ săn:** điểm hồi sinh, chưa có NPC (về sau có thể thêm thương nhân lưu động).

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
- **Bảng màu chung khoảng 48 màu**, lưu ở `art/palette.gpl` (bảng màu Aseprite). Ngoài bảng này chỉ được thêm màu chủ đạo của võ hồn, tức trường `col` và `robe` trong `VOHON` (`shared/data.ts`), cùng **tối đa 1 sắc tối và 1 sắc sáng suy ra từ mỗi màu đó** (để đủ 3 sắc độ), và màu hồn hoàn trong `TIERS`.
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
  Key của texture đã hoán màu là **key gốc + `@` + chỉ số màu**: `hs_hair_f_2@3` là kiểu tóc nữ số 2 tô màu tóc số 3, `hs_outfit_m_0@5` là áo nam tô màu áo số 5. Chỉ tạo khi có người chơi đang dùng tổ hợp đó.

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

| Animation | Số khung | Thời gian mỗi khung | Lặp | Ghi chú |
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
- **Client tự tạo animation từ chỉ số khung cố định**, không dùng tag Aseprite: tải ảnh bằng `this.load.spritesheet(key, png, { frameWidth, frameHeight })`, rồi tạo animation bằng `this.anims.generateFrameNumbers(key, { start, end })` theo bố cục trên. Thời gian khung lấy từ bảng animation ở trên, ghi một lần thành hằng số trong client.
  - Key animation có **tiền tố là key của sheet**: `{sheet}:{animation}_{hướng}`, ví dụ `hs_body_f:idle_down`, `hs_body_m:walk_right`, `hs_body_f:absorb_down`. Hướng là `down`, `right`, `up`; hướng trái dùng animation `_right` và lật ngang. Nhờ tiền tố, các sheet không va chạm nhau trong AnimationManager toàn cục của Phaser.
  - Chỉ lớp thân có animation. Mỗi khi khung của lớp thân đổi, client tính (hàng, cột) của khung đó rồi đặt khung tương ứng cho áo, tóc và phụ thể.
- **Lớp áo và tóc** vẽ đủ mọi khung như lớp thân, kể cả `hurt`, `die`, `absorb`.
- **Lớp phụ thể chỉ vẽ** `idle`, `walk`, `attack`, `cast` (cột 0–11 của hàng 0–2). Cột 12–15 và hàng 3 để trống; client không đọc mà dùng **bảng ánh xạ khung cố định**:

| Lớp thân đang ở | Khung phụ thể dùng | Ghi chú |
|---|---|---|
| `idle`, `walk`, `attack`, `cast` (cột 0–11) | Cùng hàng, cùng cột | |
| `hurt` (cột 12) | Cùng hàng, cột 0 (`idle` khung đầu) | |
| `die` (cột 13–15) | Không vẽ | Ẩn phụ thể |
| `absorb` (hàng 3, cột 0–1) | Hàng 0, cột 0–1 (`idle` hướng xuống) | Mờ 60% |

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
| Hạo Thiên Chùy (`hao_thien_chuy`) | Búa đen khổng lồ (đầu búa to gần bằng người) | Tay | Ánh bạc `#9aa0b4`, đen `#22222c` | Vân đen chạy trên búa; bụi và vết nứt đất khi nện |
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
| Tinh anh | (mục 5.4) | khung của loài gốc, phóng 1,25 lần | thêm aura vẽ bằng code |
| Tà hóa thú vương | (mục 5.4) | 96×96 | khoảng 5 ô |

- Animation: `idle` 2 khung, `walk` 4, `attack` 3 (khung đầu là tư thế báo trước, giữ lâu để khớp vùng cảnh báo 0,8 giây ở mục 5.3), `hurt` 1, `die` 3. Spritesheet một hàng theo đúng thứ tự đó, 13 khung. Key animation cũng có tiền tố sheet, ví dụ `beast_phong_lang:walk`.
- Trạng thái hung hăng (`aggro`) không vẽ khung riêng: client thêm mắt đỏ hoặc dấu "!" bằng code.
- Mỗi loài hồn thú trong mục 5.3 một bộ sprite. Trước khi có loài (bước BĐ1, đã gộp 2.6), giữ key theo bậc `b{tier}_…`.

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
  honsu/body_m.png           hs_body_m
  honsu/hair_f_2.png         hs_hair_f_2 (bản hoán màu: hs_hair_f_2@{màu})
  honsu/outfit_m_0.png       hs_outfit_m_0 (bản hoán màu: hs_outfit_m_0@{màu})
  vohon/{id}_b.png, {id}_f.png   vh_{id}_b, vh_{id}_f
  beast/{loài}.png           beast_{loài} (trước bước BĐ1: b{tier})
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
4. **Animation:** vẽ khung `idle` hướng xuống trước, rồi suy ra các hướng và animation khác. Khung xếp đúng bố cục cố định. Có thể đặt tag Aseprite theo hướng (`idle_down`, `idle_right`, `idle_up`…) để xem trước trong Aseprite; client không đọc tag.
5. **Lớp phụ thể:** mở file thân làm lớp tham khảo (khóa), vẽ phụ thể trên 2 lớp `back` và `front`, xuất thành 2 ảnh.
6. **Xuất:** `aseprite -b file.aseprite --sheet out.png --sheet-type rows --sheet-columns 16`. Phụ thể xuất từng lớp bằng `--layer back` / `--layer front`. Chỉ cần ảnh PNG; client tải bằng `load.spritesheet` và tạo animation theo chỉ số khung (xem phần Animation của hồn sư).
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
  Từ BĐ2 có thêm `travel {portal}` (xin đi qua cổng); server gửi riêng `portal` (đang đứng ở cổng nào, cấp đề xuất, có cảnh báo không) và `travel {mapId}` (đã được phép chuyển bản đồ).
  Không bao giờ để client tự báo máu, sát thương, vị trí, tỉ lệ rơi, kết quả hấp thụ hay bản đồ đích.
- Trạng thái đồng bộ qua Colyseus Schema (`server/src/rooms/schema.ts`). Hiệu ứng hình ảnh gửi qua `broadcast("fx")` và `"dmg"`.
- Túi đồ và võ hồn chỉ gửi cho chính chủ (không đồng bộ cho người khác). Người khác chỉ thấy ngoại hình hồn sư (giới tính, tóc, màu áo), võ hồn đang ra trận, cấp và hồn hoàn của nó.
- Mỗi bản đồ là một file Tiled dùng chung cho server và client: `shared/assets/<mapId>.json` (trước BĐ1 chỉ có `shared/assets/forest.json`). Ô có thuộc tính `collides=true` là vật cản ở cả hai phía.
- Dữ liệu lâu dài lưu trong PostgreSQL / Supabase (`server/sql/`). Bảng mới dùng `CREATE TABLE IF NOT EXISTS` và bật RLS.
- **Bảng dữ liệu dự kiến:** `vohons` (võ hồn sở hữu: cấp, kinh nghiệm, sao, hồn hoàn), `items` (mỗi món đồ có id riêng: loại, số năm, sao, cấp cường hóa, dòng chỉ số, đang gắn vào võ hồn nào), `teams` (đội hình), cột `accounts.map_id` + vị trí (BĐ2), `boss_claims` (lượt nhận thưởng boss mỗi ngày, BĐ5).

### Kiến trúc nhiều bản đồ (từ BĐ1)
**Một loại phòng cho mọi bản đồ**
- `MapRoom` (`server/src/rooms/MapRoom.ts`) nhận `mapId`: `gameServer.define("map", MapRoom).filterBy(["mapId"])`. Colyseus ghép người cùng `mapId` vào chung phòng; phòng đầy (`maxClients`) thì tự mở phòng mới, tức là kênh mới.
- `onCreate({ mapId })` kiểm tra `mapId` có trong `MAPS` (thiếu `mapId` thì dùng bản đồ mặc định trong `MAPS`; ở BĐ1 đó là bản đồ duy nhất), rồi nạp `shared/assets/<mapId>.json` và ghi `mapId` vào state của phòng. `server/src/map.ts` đổi thành `loadMap(mapId)`, trả về đối tượng bản đồ (ô chặn, vùng, cổng, tinh anh, boss, điểm hồi sinh), cache theo `mapId` để các kênh dùng chung. Client tải tilemap theo `mapId` đọc từ state của phòng vừa vào.
- Khác biệt giữa các loại bản đồ nằm trong dữ liệu (`MAPS[mapId].kind`: `town`, `hunt`, `boss`), không tách lớp phòng con. Bản đồ `town` không sinh hồn thú và không tính giao chiến. Bản đồ `hunt` có thể có vùng `safe` (khu làng của Thánh Hồn Thôn): trong vùng đó không sinh hồn thú, hồn thú mất mục tiêu và quay về, người chơi không bị tính giao chiến.
- **Quy tắc "logic game chỉ nằm trong phòng" chuyển từ `ForestRoom.ts` sang `MapRoom.ts` ở bước BĐ1.** Bước đó cập nhật luôn `CLAUDE.md`, các skill trong `.claude/skills/` và mục 6 này; `awakenAccount` chuyển theo.

**Dữ liệu trong `shared/data.ts`**
- `MAPS`: mã, tên, loại, khoảng cấp đề xuất, khoảng niên hạn, mảnh võ hồn, bộ hồn hạch, thú vương, có từ bước nào.
- `BEASTS`: theo **loài**. Mã cố định (`id`, dùng cho sprite `beast_{id}`), tên, kiểu tấn công (cận chiến, tầm xa, đứng yên, đi bầy), chiêu báo trước (hình vệt/nón/vòng, kích thước, thời gian báo, hiệu ứng), hệ số chỉ số so với chuẩn theo năm.
- `BOSSES`: tinh anh, thú vương, boss thế giới. Mã, tên, bậc, loài gốc (dùng lại chỉ số loài), hệ số máu và sát thương, chiêu, chiêu giai đoạn 2.
- Hằng số: hệ số 4 bậc, hệ số máu theo người (`0.6`), thời gian hồi sinh tinh anh, lịch thú vương, mức giảm kinh nghiệm, giới hạn nhận thưởng mỗi ngày. Cấp tương đương tính bằng hàm dùng chung từ bảng giới hạn hồn hoàn theo năm, không lưu bảng riêng.

**File Tiled mỗi bản đồ** (`shared/assets/<mapId>.json`, lớp object)

| Object (`type`) | Hình | Thuộc tính |
|---|---|---|
| `zone` | Chữ nhật | `beasts` (mã loài cách nhau dấu phẩy, có thể kèm trọng số: `phong_lang:3,man_da_la_xa:1`), `years` (`300-700`), `count`, `hint` |
| `portal` | Chữ nhật | `to` (`mapId` đích), `arrive` (tên điểm xuất hiện ở bản đồ đích), `level` (cấp đề xuất, `10-30`) |
| `arrive` | Điểm | Tên duy nhất trong bản đồ; nơi xuất hiện khi đi cổng tới. Phải nằm ngoài mọi vùng `portal` |
| `spawn` | Chữ nhật | Điểm hồi sinh (đã có) |
| `safe` | Chữ nhật | Vùng an toàn trong bản đồ săn (làng của Thánh Hồn Thôn) |
| `elite` | Chữ nhật | `boss` (mã trong `BOSSES`); nằm trong một `zone` |
| `boss` | Chữ nhật | `boss` (mã thú vương hoặc boss thế giới); là hang / sàn đấu và cũng là bán kính giao chiến |
| `npc` | Điểm | `npc` (mã NPC, mục 5.8) |

- Thuộc tính sai (loài không có trong `BEASTS`, cổng tới bản đồ không có trong `MAPS`, `arrive` không tồn tại ở bản đồ đích hoặc nằm trong một vùng `portal`) thì server ghi cảnh báo và bỏ object đó. Nên thêm bước kiểm tra file bản đồ vào `npm run check`.

**Đi qua cổng và lưu vị trí**
- **Thứ tự bắt buộc khi duyệt `travel {portal}`** (tránh đua ghi giữa phòng cũ và phòng mới):
  1. Server kiểm tra như ở 5.3. Không hợp lệ thì báo lỗi, dừng.
  2. Đánh dấu client **đang chuyển bản đồ** (cờ trong dữ liệu riêng của người chơi). Từ lúc này phòng cũ bỏ qua input, đánh, hồn kỹ, hấp thụ, đổi võ hồn và `travel` tiếp theo của client đó; hồn thú bỏ mục tiêu là người này.
  3. Phòng cũ **lưu đầy đủ trong MỘT transaction**: võ hồn ra trận (cấp, kinh nghiệm, hồn hoàn, số hạ; bảng `vohons`) cùng `map_id` = bản đồ đích và tọa độ điểm `arrive` (bảng `accounts`). Từ bước 3.1 transaction này lưu luôn mọi dữ liệu chưa lưu khác của người chơi (túi đồ…). Chờ ghi DB xong (`await`).
     - **Hoặc ghi hết, hoặc không ghi gì.** Không được ghi một nửa: nếu `vohons` lỗi mà `accounts.map_id` đã là bản đồ đích, bước 4 bỏ cờ cho người chơi ở lại nhưng lớp chặn `WHERE map_id = <mapId của phòng>` (bên dưới) sẽ chặn mọi lần lưu vị trí sau đó, và lần vào sau người chơi xuất hiện ở bản đồ đích mà chưa từng đi cổng; ngược lại, `accounts` đã đổi `map_id` mà `vohons` chưa ghi thì mất tiến độ võ hồn.
     - `PgStore`: một kết nối lấy từ pool, `BEGIN` → các câu `UPDATE` → `COMMIT`; lỗi ở bất kỳ câu nào thì `ROLLBACK` rồi ném lỗi ra. Cần một hàm store riêng cho việc này (ví dụ `saveTravel`), không gọi lần lượt các hàm lưu sẵn có.
     - `MemoryStore`: kiểm tra xong mới gán mọi trường cùng lúc trong một hàm đồng bộ, không có `await` xen giữa.
  4. Lưu xong mới gửi riêng `travel {mapId}`. **Lưu lỗi** (transaction đã rollback, DB vẫn như trước bước 3): không gửi `travel`, bỏ cờ đang chuyển bản đồ, báo người chơi "Không chuyển được bản đồ, thử lại"; người chơi ở lại và phòng cũ tiếp tục lưu bình thường.
  5. Client rời phòng và `joinOrCreate("map", { token, mapId })`. Client không rời trong 10 giây thì server ngắt kết nối.
- **Client đang chuyển bản đồ thì `onLeave` và lưu định kỳ của phòng cũ không ghi gì nữa**, kể cả nhân vật lẫn `map_id`/vị trí: dữ liệu đã lưu đủ ở bước 3, mọi hành động đã bị chặn nên không còn tiến độ mới (phần thưởng từ đạn hồn kỹ đang bay sau thời điểm lưu bị bỏ). Nhờ vậy phòng mới chỉ nạp nhân vật sau khi phòng cũ lưu xong, và không có bản cũ hơn ghi đè bản mới.
- Phòng thêm một lớp chặn trong câu lệnh ghi: lưu `map_id`/vị trí theo chu kỳ hoặc khi rời phòng (không phải lúc đi cổng) chỉ ghi khi `map_id` trong DB vẫn là bản đồ của phòng này (`UPDATE … WHERE map_id = <mapId của phòng>`).
- `onAuth` đối chiếu `mapId` trong tham số với `map_id` trong DB; sai thì từ chối, client hỏi lại `/api/me` (trả `mapId` từ BĐ2). Client chỉ chuyển `mapId` để Colyseus ghép phòng, không tự chọn bản đồ.
- Cột `accounts.map_id`, `accounts.pos_x`, `accounts.pos_y` (file `server/sql/00N_….sql` mới ở BĐ2). Vị trí thuộc hồn sư, không thuộc võ hồn. Ghi khi qua cổng (bước 3 ở trên, chung transaction với võ hồn), khi rời phòng và theo chu kỳ lưu định kỳ (trừ client đang chuyển bản đồ). Cập nhật cả `PgStore` lẫn `MemoryStore`.
- Vào game: vị trí kẹt trong ô chặn hoặc ngoài bản đồ thì về `spawn`; đăng xuất ở `loi_tinh_dau` thì lần sau về điểm `arrive` ở Nội địa. `map_id` không còn trong `MAPS` (ví dụ `tinh_dau` sau BĐ3) được ánh xạ sang bản đồ mới.
- **Mỗi tài khoản một phiên trên mọi phòng:** hiện chỉ đá phiên cũ trong cùng phòng. Với nhiều phòng, phát `kick` kèm `accountId` qua presence; phòng nào có client trùng thì đá.

**Thông báo toàn server và lịch boss**
- Dùng **presence của Colyseus**: phòng gửi `this.presence.publish("announce", { text, col })`; mỗi `MapRoom` `subscribe("announce", …)` trong `onCreate`, hủy ở `onDispose`, rồi `broadcast("chat")` cho người trong phòng.
- Lịch thú vương và boss thế giới do `server/src/schedule.ts` (khởi động ở `index.ts`) giữ. File này chỉ đếm giờ (múi giờ `Asia/Ho_Chi_Minh`) và `publish("boss", { mapId, phase: "warn" | "spawn" })`. Sinh boss, máu, chiêu và thưởng vẫn nằm trong `MapRoom`. Phòng đang mở của bản đồ đó sinh boss; phòng mở ra trong 15 phút của khung giờ boss cũng sinh.
- Chạy một tiến trình thì dùng presence mặc định (trong bộ nhớ). Chạy nhiều tiến trình thì đổi sang `RedisPresence`.
- Lượt nhận thưởng boss mỗi ngày lưu ở bảng `boss_claims` (tài khoản, ngày, loại boss, số lần), file SQL mới ở BĐ5. "Ngày" là ngày theo `Asia/Ho_Chi_Minh` (đổi lúc 00:00 giờ Việt Nam), server tự tính, không dùng giờ của client hay múi giờ mặc định của máy chủ.

**Schema**
- `BeastState` thêm `species` (chỉ số trong `BEASTS`, hoặc trong `BOSSES` với tinh anh và boss), `rank` (0 thường, 1 tinh anh, 2 thú vương, 3 boss thế giới) và `years` (từ bước 3.2). State của phòng thêm `mapId` (từ BĐ1; client đọc để tải tilemap). Thanh máu boss đọc thẳng từ `BeastState`.

## 7. Lộ trình
Mỗi gạch đầu dòng là một lần giao việc. Xong một bước thì chạy `npm run check` và bot, rồi đánh dấu [x].

**Nhóm Bản đồ (BĐ1–BĐ6)** nằm xen trong các giai đoạn dưới đây, theo thứ tự đã chốt (thiết kế ở mục 5.3, 5.4, 5.8 và 6). Tiền tố M dành cho nhóm Mỹ thuật.
- **BĐ1 làm ngay sau 2.2**, trước 2.2a, 2.2b và 2.3.
- BĐ2 sau BĐ1 và phải trước BĐ3 (BĐ3 cần cổng). BĐ3 sau 3.2. BĐ4 sau 3.5. BĐ5 sau 3.1. BĐ6 thuộc Giai đoạn 8.
- Bước 2.6, 6.3, 6.4, 8.4 đã gộp vào bước BĐ tương ứng (gạch ngang, giữ lại để tra cứu).

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
- [ ] **BĐ1** Tách `MapRoom`, đọc bản đồ theo `mapId` (làm ngay sau 2.2, trước 2.2a, 2.2b, 2.3). **Chưa đổi luật chơi.**
  - `ForestRoom` thành `MapRoom` nhận `mapId`; `define("map", MapRoom).filterBy(["mapId"])`. Bản đồ hiện tại đổi tên thành `shared/assets/tinh_dau.json`, `mapId` = `tinh_dau` (bản đồ duy nhất cho đến BĐ2). `map.ts` thành `loadMap(mapId)`.
  - **Nguồn `mapId` ở BĐ1:** chỉ có một bản đồ, nên `MAPS` đánh dấu một bản đồ mặc định (`tinh_dau`). Client gọi `joinOrCreate("map", { token })` **không kèm `mapId`**; phòng thiếu `mapId` thì dùng bản đồ mặc định, `mapId` khác bản đồ mặc định thì từ chối. Client **nhận `mapId` từ phòng khi đã vào** (trường `mapId` trong state của phòng) rồi mới tải tilemap; không đọc từ `/api/me`, không tự đặt tên bản đồ. Từ BĐ2, `/api/me` trả `mapId` đọc từ DB và client truyền nó khi join (mục 6).
  - Bảng `MAPS` và `BEASTS` (theo loài) trong `data.ts`; `BeastState` thêm `species`. Vùng trong Tiled khai báo `beasts`; cho đến 3.2 vẫn giữ `weights` theo bậc, mỗi loài có bậc tạm để lấy chỉ số `TIERS`.
  - **Gộp bước 2.6:** danh hiệu trên đầu hồn sư theo cấp võ hồn ra trận (bảng 5.1); tên hồn thú và tên vùng lấy theo bảng Ngoại vi / Nội địa ở 5.3 (chọn loài khớp bậc).
  - Cập nhật `CLAUDE.md`, skill trong `.claude/skills/`, mục 6 và bot: logic game nằm trong `MapRoom.ts`.
- [ ] 2.2a Tạo nhân vật: chọn nam/nữ, 4 kiểu tóc, màu tóc, màu áo (mục 5.11). Lưu `sex`, `hair`, `hairCol`, `outfitCol` cho tài khoản (file SQL mới), đồng bộ qua schema để người khác thấy. Làm ngay trước bước chọn SSR của lễ thức tỉnh; tài khoản cũ nhận ngoại hình mặc định và được chọn lại một lần ở lần vào game tới.
- [ ] 2.2b Hiển thị hồn sư ghép lớp bằng code theo quy cách 5.11: thân, áo, tóc (đổi màu), lớp phụ thể đơn giản cho 20 võ hồn, vòng hồn hoàn dưới chân. Thêm hướng nhìn 4 phía vào schema. Bỏ key cũ `p{i}_{f}`.
- [ ] 2.3 Đội hình 4 võ hồn, đổi võ hồn trong trận, luật gục và hồi sinh mới.
- [ ] 2.4 Năng lượng và chiêu tiên cơ.
- [ ] 2.5 Hồn kỹ riêng cho từng võ hồn (vòng 1–4 trước).
- ~~2.6 Danh hiệu, đổi tên hồn thú và tên vùng theo mục 5.3.~~ ➜ **Đã gộp vào BĐ1.**
- [ ] **BĐ2** Cổng, lưu bản đồ đang đứng, Thánh Hồn Thôn và Nặc Đinh Thành (thay 6.4; sau BĐ1, phải trước BĐ3).
  - Object `portal`, `arrive`, `safe`, `npc`; tin nhắn `portal` / `travel`; chặn mềm có cảnh báo nguy hiểm; server kiểm tra vị trí và đích.
  - Cột `accounts.map_id` + vị trí (file SQL mới, `PgStore` + `MemoryStore`), `/api/me` trả `mapId` và client truyền `mapId` khi join (thay cách join không kèm `mapId` của BĐ1); thứ tự lưu khi đi cổng theo mục 6; đá phiên trùng qua presence.
  - Bản đồ mới: Thánh Hồn Thôn (làng + 3 vùng săn cấp 1–10, tinh anh thêm ở BĐ4; tài khoản mới và cũ bắt đầu ở đây) và Nặc Đinh Thành (thành an toàn, chỗ đứng cho NPC của 6.1). Cổng Thánh Hồn Thôn ↔ Nặc Đinh Thành ↔ `tinh_dau`.

**Giai đoạn 3: Túi đồ và hồn hoàn kiểu mới**
- [ ] 3.1 Bảng `items`, túi đồ đồng bộ riêng cho chính chủ, giao diện túi đồ.
- [ ] 3.2 Hồn thú có tuổi theo số năm; hồn hoàn rơi thành vật phẩm, nhặt vào túi.
- [ ] **BĐ3** Tách Tinh Đấu thành Ngoại vi và Nội địa, quy cấp theo niên hạn, giảm kinh nghiệm (sau 3.2).
  - `tinh_dau_ngoai_vi` và `tinh_dau_noi_dia`, mỗi bản đồ 4 vùng theo bảng 5.3; vùng chuyển từ `weights` sang `years`. `map_id` cũ `tinh_dau` chuyển thành `tinh_dau_ngoai_vi`.
  - Hàm cấp tương đương từ bảng giới hạn theo năm (nếu 3.3 chưa làm thì thêm bảng giới hạn theo năm vào `data.ts` ở bước này); giảm kinh nghiệm 50% / 10%; cổng hiện cấp đề xuất và cảnh báo.
- [ ] 3.3 Hấp thụ từ túi đồ: giới hạn theo truyện, tỉ lệ thất bại, thất bại thì mất hồn hoàn. Mở đủ 10 vòng, cấp tối đa 100.
- [ ] 3.4 Mảnh võ hồn rơi theo bản đồ (bảng "Rơi đặc trưng" ở 5.3), mở võ hồn mới và lên sao.
- [ ] 3.5 Chiêu có báo trước cho hồn thú từ 1.000 năm trở lên (theo loài trong `BEASTS`).
- [ ] **BĐ4** Tinh anh (sau 3.5): mỗi vùng 1 con (object `elite`, bảng `BOSSES`), máu x2,5, sát thương x1,5, 2 chiêu báo trước, aura riêng, hiện trên bản đồ nhỏ, hồi sinh ngẫu nhiên 8–12 phút; máu tăng theo số người tham gia (5.4). Thưởng hồn cốt x3 tỉ lệ và chắc chắn rơi hồn hạch: bật khi đã có hồn cốt (GĐ4) và hồn hạch (GĐ5).

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
- [ ] 6.1 NPC ở Thánh Hồn Thôn và Nặc Đinh Thành (bản đồ có từ BĐ2): Tố Vân Đào, Lão Kiệt Khắc, thương nhân, lò rèn; Hồn Tệ và đan.
- [ ] 6.2 Nhiệm vụ: chuỗi tân thủ của Ngọc Tiểu Cương.
- ~~6.3 Tà hóa thú vương: lịch xuất hiện, chiêu riêng, chia thưởng, giới hạn 3 lần/ngày.~~ ➜ **Đã gộp vào BĐ5.**
- [ ] **BĐ5** Tà hóa thú vương theo lịch và máu theo số người (thay 6.3; sau 3.1 vì rương vào túi đồ).
  - Lịch 20:00 / 22:00 ở `server/src/schedule.ts`, báo toàn server trước 5 phút qua presence; mỗi kênh một thú vương, rút đi sau 15 phút.
  - 2–3 chiêu, giai đoạn 2 ở 50% máu; máu tăng theo người tham gia; chia thưởng theo đóng góp, rương cho người từ 3%; tối đa 3 lần/ngày (bảng `boss_claims`, file SQL mới).
  - Thú vương của Ngoại vi và Nội địa (bảng 5.3).
- ~~6.4 Bản đồ Nặc Đinh Thành, chuyển bản đồ qua cổng.~~ ➜ **Đã gộp vào BĐ2.**

**Giai đoạn 7: Xã hội**
- [ ] 7.1 Tổ đội người chơi tối đa 4, chia kinh nghiệm, ưu tiên hồn hoàn theo đội.
- [ ] 7.2 Đại Đấu Hồn Trường 1v1, Elo, bảng xếp hạng.

**Giai đoạn 8: Dài hạn**
- [ ] 8.1 Hồn kỹ vòng 5–10 và Võ Hồn Chân Thân.
- [ ] 8.2 Cộng minh.
- [ ] 8.3 Thêm võ hồn mới.
- ~~8.4 Bản đồ mới: Lạc Nhật Sâm Lâm, Cực Bắc Chi Địa, Hải Thần Đảo.~~ ➜ **Đã gộp vào BĐ6.**
- [ ] **BĐ6** Bản đồ Giai đoạn 8 và boss thế giới (thay 8.4): Thiên Đấu Thành, Lạc Nhật Sâm Lâm (tiên thảo), Cực Bắc Chi Địa, Hải Thần Đảo / Ma Quỷ Hải Vực, mỗi bản đồ có tinh anh và thú vương theo 5.3; Lõi Tinh Đấu với boss thế giới Thái Thản Cự Viên và Thiên Thanh Ngưu Mãng (5.4, cần đội 4 võ hồn của 2.3). Nên chia mỗi bản đồ một lần giao việc (BĐ6a, BĐ6b…).

**Mỹ thuật: thay sprite vẽ bằng code** (quy cách ở mục 5.11; làm song song, không chặn các giai đoạn khác)
- [x] M1 Nền tảng: `art/palette.gpl`, `art/CREDITS.md`, `sprites/manifest.json`; client tải ảnh theo manifest bằng `load.spritesheet`, tạo animation `{sheet}:{animation}_{hướng}` theo chỉ số khung cố định; key còn thiếu thì vẽ bằng code.
  *Đã làm:* `client/src/sprites.ts`: `preloadSprites` đọc `manifest.json` (mảng `sprites`, đường dẫn và khung suy ra từ key; `beast_{loài}` ghi kèm `frame`), `createSheetAnims`/`createHonsuAnims`/`createBeastAnims`, `honsuAnimKey` (trái = phải + lật), `vohonFrame` (bảng ánh xạ khung phụ thể), `syncLayers`, `recolor` (key `hs_hair_f_2@3`), `addGridFrames` cho sheet vẽ bằng code.
  Manifest đang rỗng nên game chạy như cũ. Hiển thị hồn sư ghép lớp để bước 2.2b, hồn thú dạng sheet để M4. Thời gian khung `attack` của hồn thú tạm ghi 800 ms trong client cho đến bước 3.5.
- [ ] M2 Hồn sư: thân nam và nữ, 4 kiểu tóc mỗi giới, áo hồn sư; đủ 3 hướng và 7 animation.
- [ ] M3 Lớp phụ thể: Lam Ngân Thảo và 4 võ hồn mẫu (mỗi hệ một: Hạo Thiên Chùy, U Minh Linh Miêu, Bích Lân Xà Hoàng, Cửu Bảo Lưu Ly Tháp), rồi các võ hồn còn lại.
- [ ] M4 Hồn thú: 5 bậc theo bảng kích thước; sau bước BĐ1 (đã gộp 2.6) vẽ theo từng loài ở mục 5.3, ưu tiên 4 bản đồ của bản đầu. Tinh anh dùng sprite loài gốc kèm aura; thú vương 96×96.
- [ ] M5 Giao diện thẻ võ hồn: chân dung 64×64 cho 20 võ hồn, khung thẻ SR/SSR/UR, biểu tượng 4 hệ. Cần trước khi làm giao diện đội hình đẹp ở 2.3.

**Kỹ thuật (làm khi cần)**
- [ ] Dự đoán chuyển động phía client (client-side prediction) để đỡ trễ khi ping cao.
- Thay sprite vẽ bằng code bằng sprite Aseprite thật: đã tách thành nhóm **Mỹ thuật** (M1–M5) ở trên.
- [ ] Nhiều kênh khi một phòng quá 60 người. (Từ BĐ1, `filterBy(["mapId"])` tự mở phòng mới khi phòng đầy; còn thiếu hiển thị kênh và cho chọn kênh.)
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
8. **Bản đồ và boss** (phần đã chốt ở dưới; đây là các điểm người viết thiết kế tự đề xuất, cần xác nhận):
   - Giờ boss thế giới (đề xuất 21:00) và luân phiên Thái Thản Cự Viên / Thiên Thanh Ngưu Mãng theo ngày.
   - Hệ số sát thương: thú vương x2, boss thế giới x3. Kinh nghiệm tinh anh x2,5.
   - Có giới hạn số người tham gia tối đa khi tính máu boss không? (đề xuất: không; xem lại nếu boss quá trâu khi phòng đông.)
   - Ngưỡng rương 3% khó đạt khi trên khoảng 30 người cùng đánh: có hạ thành min(3%, 1 / (2 × số người)) không?
   - Hồi máu và khiên cho người tham gia có tính vào đóng góp không? (đề xuất: có, để phụ trợ không bị thiệt.)
   - Thánh Hồn Thôn có tinh anh nhưng không có thú vương; cấp võ hồn tính tối đa 80 khi so với cấp tương đương (vì vòng 8–10 cùng giới hạn 100.000 năm).
   - Thưởng boss thế giới: tỉ lệ hồn hoàn đỏ cho người không đứng đầu (đề xuất 10%) và tỉ lệ hồn cốt.
   - Tỉ lệ rơi mảnh UR từ rương thú vương trước BĐ6 (đề xuất 5%), hay giữ khóa UR cho tới boss thế giới.

**Đã chốt sau review PR #8** (chi tiết ở mục 5.3, 5.8, 6 và BĐ1)
- **Thánh Hồn Thôn có `kind` = `hunt`**; khu làng là vùng `safe` (không sinh hồn thú, không giao chiến). Chỉ Nặc Đinh Thành và Thiên Đấu Thành là `town`.
- **Đi cổng:** phòng cũ đánh dấu client đang chuyển bản đồ, lưu đầy đủ nhân vật cùng `map_id`/vị trí mới và chờ ghi xong rồi mới gửi `travel`. Client đang chuyển thì `onLeave` và lưu định kỳ của phòng cũ không ghi gì nữa.
- **BĐ1:** chỉ có một bản đồ; server dùng bản đồ mặc định trong `MAPS`, client join không kèm `mapId` và nhận `mapId` từ state của phòng, không từ `/api/me`. `/api/me` trả `mapId` từ BĐ2.
- Điểm `arrive` nằm ngoài mọi vùng `portal`. Lượt nhận thưởng boss đặt lại lúc 00:00 giờ `Asia/Ho_Chi_Minh`.

**Đã chốt: mỹ thuật nhân vật** (chi tiết ở mục 3 và 5.11)
- Người chơi có **nhân vật hồn sư riêng**, chọn **nam hoặc nữ** khi tạo tài khoản. Trên bản đồ là hồn sư; võ hồn đang ra trận hiện dạng **phụ thể khi phóng thích** (vũ khí, thú hồn, cánh, hào quang) cùng vòng hồn hoàn dưới chân. Đổi võ hồn thì đổi lớp phụ thể. Nhân vật truyện chỉ dùng cho chân dung và thẻ võ hồn.
- Sprite **32×32, 4 hướng, chibi pixel RPG**, cao khoảng 2 ô bản đồ.
- Nguồn asset: **AI tạo concept, vẽ lại và chỉnh pixel bằng Aseprite**; ảnh AI không đưa thẳng vào game.
- Tùy biến: nam/nữ, 4 kiểu tóc mỗi giới, vài màu tóc và màu áo; asset **ghép theo lớp** (thân, áo, tóc, phụ thể võ hồn).

**Đã chốt: thế giới nhiều bản đồ, quái và boss theo cấp** (chi tiết ở mục 5.3, 5.4, 5.8, 6 và Lộ trình BĐ1–BĐ6)
- **Quy cấp theo niên hạn:** cấp tương đương của hồn thú là cấp nhỏ nhất mà võ hồn hấp thụ hồn hoàn của nó trong giới hạn (bảng mục 5.2). Mỗi bản đồ săn nhắm khoảng cấp mà niên hạn hồn thú khớp giới hạn vòng kế tiếp; khoảng cấp các bản đồ chồng nhau khoảng 10 cấp.
- **Giảm kinh nghiệm** khi hồn thú thấp hơn võ hồn đang ra trận: từ 10 cấp còn 50%, từ 20 cấp còn 10%. Hồn hoàn vẫn rơi bình thường.
- **Chặn mềm ở cổng:** không đủ cấp vẫn vào được, chỉ hiện cảnh báo nguy hiểm. Server vẫn kiểm tra cổng (vị trí, đích hợp lệ); client không tự chọn bản đồ.
- **Bản đồ:** Thánh Hồn Thôn (1–10), Nặc Đinh Thành (thành), Tinh Đấu Ngoại vi (10–30), Tinh Đấu Nội địa (30–60), Lạc Nhật Sâm Lâm (40–70), Thiên Đấu Thành (thành), Cực Bắc Chi Địa (60–85), Hải Thần Đảo / Ma Quỷ Hải Vực (80–100), Lõi Tinh Đấu (boss thế giới). Mỗi bản đồ săn 3–4 vùng, rơi mảnh của 2–3 võ hồn riêng và có bộ hồn hạch đặc trưng. **Bản đầu chỉ có 4 bản đồ** (Thánh Hồn Thôn, Nặc Đinh Thành, Ngoại vi, Nội địa); còn lại thuộc Giai đoạn 8.
- **4 bậc quái:** thường; tinh anh (máu x2,5, sát thương x1,5, mỗi vùng 1 con, hồi sinh 8–12 phút, hiện trên bản đồ nhỏ, 2 chiêu, aura, hồn cốt x3, chắc chắn hồn hạch); tà hóa thú vương (máu x6–8, theo lịch, báo trước 5 phút, 2–3 chiêu, giai đoạn 2 ở 50% máu, chia thưởng theo sát thương, từ 3% có rương, tối đa 3 lần/ngày); boss thế giới 100.000 năm (máu x30, nổi giận sau 10 phút, 1 lần/ngày ở Lõi Tinh Đấu, buộc đổi võ hồn đúng lúc; thưởng hồn hoàn đỏ, hồn cốt cao, mảnh UR).
- **Máu boss tăng theo số người tham gia** (tinh anh trở lên): máu × (1 + 0,6 × (số người − 1)). Định nghĩa người tham gia và cách xử lý người vào/ra giữa trận ở mục 5.4.
- **Tên hồn thú, tinh anh, thú vương** chưa có trong truyện được tự đặt theo phong cách Đấu La.
- **Kiến trúc:** một loại phòng `MapRoom` nhận `mapId` (`define("map", MapRoom).filterBy(["mapId"])`); dữ liệu `MAPS`, `BEASTS`, `BOSSES` trong `shared/data.ts`; mỗi bản đồ một file Tiled `shared/assets/<mapId>.json` với object `zone`, `portal`, `elite`, `boss`; lưu `map_id` và vị trí trong DB; thông báo toàn server qua presence của Colyseus. Quy tắc "logic game nằm trong phòng" chuyển từ `ForestRoom.ts` sang `MapRoom.ts` ở BĐ1.
- **Thứ tự Lộ trình:** BĐ1 ngay sau 2.2, trước 2.2a, 2.2b, 2.3 (gộp 2.6). BĐ2 thay 6.4. BĐ3 sau 3.2. BĐ4 sau 3.5. BĐ5 thay 6.3, sau 3.1. BĐ6 thay 8.4, ở Giai đoạn 8.
