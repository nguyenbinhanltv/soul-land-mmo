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
- **Võ hồn sở hữu và đội hình** (từ 2.3a): mỗi võ hồn có cấp, kinh nghiệm, hồn hoàn riêng. Đội 4 ô xếp từ bộ sưu tập (phím V), chỉ xếp khi không giao chiến 5 giây và không hấp thụ. Trong trận phím 1–4 (hoặc chạm thanh đội hình) đổi ngay sang võ hồn trong đội, hồi 3 giây; cấm khi cả đội gục, đang hấp thụ hoặc võ hồn đích đã gục. Từ 2.3b mỗi võ hồn trong đội có **sinh lực riêng** (võ hồn không ra trận cũng hồi sinh lực cùng nhịp); hồn lực thuộc về hồn sư nên đổi võ hồn vẫn giữ tỉ lệ hồn lực. Kinh nghiệm hạ hồn thú giảm theo chênh cấp (5.3; từ BĐ3 cấp tương đương tính theo số năm hồn thú) một lần rồi chia: võ hồn ra trận 40%, mỗi võ hồn khác trong đội 20%; ô trống và võ hồn ở bình cảnh không nhận, phần đó bỏ đi.
- **Năng lượng và chiêu tiên cơ** (từ 2.4, mục 5.1): võ hồn ra trận đánh trúng thì các võ hồn khác trong đội tích năng lượng (đòn thường +10, hồn kỹ +20, tối đa 100); đổi tay vào võ hồn đầy năng lượng thì tung tiên cơ chung theo hệ (Bạo Liệt / Thiểm Sát / Phong Tỏa / Hộ Thể). Gục mất năng lượng, ngoài giao chiến 10 giây thì giảm dần. Từ 2.5a, 5 võ hồn mẫu có tiên cơ riêng (mục 5.1); từ 2.5b thêm 5 võ hồn lưu phái Thiêu đốt, từ 2.5c thêm 5 võ hồn lưu phái Cảm điện, từ 2.5d thêm 5 võ hồn còn lại: cả 20 võ hồn đều có tiên cơ riêng, tiên cơ chung theo hệ chỉ còn làm dự phòng cho võ hồn thêm sau.
- **Bình cảnh**: cứ đến cấp 10, 20, 30… 100 là kinh nghiệm dừng lại, phải hấp thụ hồn hoàn mới lên tiếp. Từ 3.3 mỗi võ hồn có đủ 10 vòng, cấp tối đa 100: hồn hoàn thứ 10 hấp thụ ở cấp 100 và không lên thêm cấp, sau đó không nhận kinh nghiệm nữa. *Giữ nguyên.*
- **Niên hạn** (từ 3.2, mục 5.2, 5.3): mỗi hồn thú có tuổi là số năm cụ thể, tung ngẫu nhiên trong khoảng `years` của vùng (bảng 5.3); màu / bậc suy ra từ số năm; máu, sát thương và kinh nghiệm tăng liên tục theo số năm. Hồn hoàn mang đúng số năm đó.
- **Giới hạn hấp thụ** (từ 3.3, mục 5.2): theo số năm của truyện, mỗi vòng một mức (423 / 764 / 1.760 / 5.000 / 12.000 / 20.000 / 50.000 / 100.000 / 100.000 / 100.000 năm). Trong giới hạn luôn thành công; vượt ≤ 25% thì 30% thất bại, ≤ 50% thì 60%, ≤ 100% thì 90%, vượt hơn 100% thì không cho hấp thụ. Thất bại thì **chỉ mất hồn hoàn đó**, không phạt gì thêm (bỏ luật cũ còn 30% sinh lực).
- **Hấp thụ** (từ 3.2, 3.3): chọn hồn hoàn **trong túi đồ** (nút "Hấp thụ…"), rồi chọn **võ hồn bất kỳ trong bộ sưu tập** đang ở bình cảnh; chỉ khi không giao chiến (5 giây không đánh / bị đánh). Bảng chọn hiện giới hạn của vòng kế tiếp, % vượt và tỉ lệ thất bại trước khi xác nhận. Thời gian tăng theo niên hạn: 3 giây (10 năm) đến 15 giây (100.000 năm). Di chuyển hoặc bị đánh là hủy, hồn hoàn vẫn còn trong túi. Thành công: võ hồn lên 1 cấp, vòng lưu đúng số năm. *Giữ cơ chế bị gián đoạn.*
- **Hồn hoàn rơi** (từ 3.2): hạ hồn thú thì hồn hoàn rơi xuống đất mang số năm của hồn thú; 15 giây đầu chỉ người hạ nhặt được, tồn tại 60 giây. Đứng gần rồi nhấn **E** (hoặc nút "Nhặt") để cho vào túi; túi đầy thì báo và hồn hoàn ở lại dưới đất. *Giữ luật ưu tiên.*
- **Hồn kỹ** (từ 2.5a, mục 5.2): vòng 1–4 mở 4 hồn kỹ, mạnh theo số năm hồn hoàn của vòng đó. 5 võ hồn mẫu (Lam Ngân Thảo, Hạo Thiên Chùy, U Minh Linh Miêu, Bích Lân Xà Hoàng, Cửu Bảo Lưu Ly Tháp) có hồn kỹ riêng gây trạng thái dùng chung (mục 5.1); từ 2.5b thêm 5 võ hồn lưu phái Thiêu đốt (Tà Hỏa Phượng Hoàng, Hỏa Long, Hỏa Ảnh, Kỳ Nhung Thông Thiên Cúc, Nguyệt Nhận); từ 2.5c thêm 5 võ hồn lưu phái Cảm điện (Lam Điện Bá Vương Long, Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa, Yêu Hồ, Xúc Xích); từ 2.5d thêm 5 võ hồn còn lại (Cửu Tinh Thất Sát Kiếm, Nhu Cốt Thố, Tử Vong Chu Hoàng, Quỷ Mị, Thiên Càn Bạch Ngọc Đỉnh; hiệu ứng có lợi mới Hút huyết): **cả 20 võ hồn đều có hồn kỹ riêng**, 4 hồn kỹ chung (Hồn Bạo, Thiểm Kích, Hồn Tiễn, Hồn Vực) không còn võ hồn nào dùng, giữ trong `data.ts` làm dự phòng cho võ hồn thêm sau. Ràng buộc bản tối thiểu (2.5d, chờ chốt): Hạo Thiên Chùy + Nhu Cốt Thố chí mạng +10%, Tà Hỏa Phượng Hoàng + Hỏa Ảnh Thiêu đốt mạnh thêm 20%. Vòng 5–10 (từ 3.3) chưa mở hồn kỹ, chỉ tăng chỉ số. ➜ 8.1: hồn kỹ vòng 5–10.
- **Gục** (từ 2.3b, mục 5.1): võ hồn ra trận gục thì tự đổi sang võ hồn chưa gục kế tiếp trong đội (không tính hồi chiêu đổi). Võ hồn đã gục không đổi vào được, hồi đầy khi về doanh trại hoặc sau 60 giây ngoài trận (đồng hồ dừng khi giao chiến). Cả đội gục thì sau 2,5 giây về doanh trại, cả đội hồi đầy, **không mất kinh nghiệm hay đồ** (bỏ luật cũ mất 30% kinh nghiệm). Sinh lực từng võ hồn không lưu DB: vào lại game thì cả đội đầy.
- **Bản đồ và vùng** (từ BĐ2, BĐ3): 4 bản đồ nối bằng cổng: Thánh Hồn Thôn (bắt đầu ở đây; làng giữa bản đồ là vùng an toàn, 3 vùng săn 10–450 năm) ↔ Nặc Đinh Thành (thành an toàn, không hồn thú) ↔ Tinh Đấu Ngoại vi (`tinh_dau_ngoai_vi`, cấp 10–30, 4 vùng 300–2.000 năm) ↔ Tinh Đấu Nội địa (`tinh_dau_noi_dia`, cấp 30–60, 4 vùng 1.500–25.000 năm). Vùng đi theo chiều đông, càng sâu càng mạnh; mỗi vùng khai báo loài (`beasts`) và niên hạn (`years`) theo bảng 5.3. Hồn thú không sinh sát cổng và điểm xuất hiện. Bản đồ đang đứng và vị trí được lưu, vào lại thì ở đúng chỗ cũ; tài khoản còn ở `tinh_dau` cũ thì vào Ngoại vi ở trại cổng. Cổng có cấp đề xuất của bản đồ đích, dưới cấp thì cảnh báo đỏ nhưng vẫn đi được (chặn mềm). Từ BĐ4 mỗi vùng săn có 1 tinh anh (mục dưới). ➜ BĐ5–BĐ6: thú vương, Lõi Tinh Đấu.
- **Túi đồ và Hồn Tệ** (từ 3.1, mục 5.7): túi 40 ô chỉ chính chủ thấy (phím B hoặc nút "Túi đồ"), đồ cùng loại gộp tối đa 99 món một ô. Mới có Hồi Huyết Đan / Hồi Hồn Đan (hồi 30% sinh lực võ hồn ra trận / hồn lực, hồi chiêu chung 15 giây, dùng được khi giao chiến); mỗi tài khoản nhận một lần 5 viên mỗi loại. Hạ hồn thú nhận vài đồng Hồn Tệ theo bậc. Từ 3.2 hồn hoàn là vật phẩm trong túi (mỗi chiếc một ô, ghi số năm) và bỏ được vật phẩm để nhường chỗ (nút "Bỏ"). ➜ 6.1: mua bán đan ở thương nhân.
- **Mảnh võ hồn, mở võ hồn, lên sao** (từ 3.4, mục 5.1, 5.3): mỗi bản đồ săn rơi mảnh của 2–3 võ hồn (bảng "Rơi đặc trưng" 5.3; Thánh Hồn Thôn: Lam Ngân Thảo, Nhu Cốt Thố; Ngoại vi: U Minh Linh Miêu, Kim Vũ Miêu Ưng, Xúc Xích; Nội địa: Tử Vong Chu Hoàng, Lam Điện Bá Vương Long, Cửu Tinh Thất Sát Kiếm). Hạ hồn thú có 10% / 15% / 20% / 100% (dưới 1.000 / dưới 10.000 / dưới 100.000 / 100.000 năm) rơi 1 mảnh của một võ hồn ngẫu nhiên trong danh sách, vào thẳng túi người hạ (gộp 999 mảnh một ô); túi đầy thì mảnh rơi xuống đất cạnh hồn hoàn, cùng luật ưu tiên người hạ 15 giây. Bảng đội hình (phím V) có mục "Mảnh võ hồn": đủ 50 mảnh của võ hồn chưa có thì bấm **Mở** (võ hồn mới cấp 1, 1★, vào bộ sưu tập, không tự vào đội); võ hồn đã có dùng 20 / 40 / 80 / 120 / 200 mảnh để **Lên sao** 2★ … 6★, mỗi sao trên 1 cộng 5% sinh lực, hồn lực, công gốc (6★ = +25%). ➜ Sau: hiệu ứng hồn kỹ mở theo sao; mảnh từ rương thú vương (BĐ5), boss thế giới (BĐ6), nhiệm vụ.
- **Chiêu có báo trước** (từ 3.5, mục 5.3): hồn thú thường **từ 1.000 năm** có 1 chiêu riêng theo loài (vệt / nón / vòng quanh thân / vòng dưới chân mục tiêu). Có mục tiêu 1,5–3 giây thì tung khi mục tiêu trong tầm, rồi hồi chiêu 7–9 giây (± 20%). Hồn thú đứng yên **0,8 giây** hiện vùng đỏ đầy dần, hết giờ mới tính trúng theo **vị trí thật** của người chơi lúc đó: chạy ra khỏi vùng là né được. Không trúng người đứng trong vùng an toàn, đang chuyển bản đồ, đã gục hay đang bất tử. Choáng, Câm lặng, Mê hoặc trên hồn thú **ngắt chiêu** đang báo trước. Chiêu có thể gây trạng thái lên hồn sư (Trúng độc, Trói, Làm chậm, Câm lặng, Cảm điện, Phá giáp, Choáng ngắn); Câm lặng trên hồn thú từ đây chỉ chặn chiêu, không chặn đánh thường. Từ BĐ4 tinh anh có 2 chiêu (mục dưới). ➜ BĐ5: thú vương 2–3 chiêu, báo trước dài hơn.
- **Hồn cốt rơi** (từ 4.1, mục 5.3, 5.5): hạ hồn thú thường có 0% / 1% / 4% / 20% (dưới 1.000 / dưới 10.000 / dưới 100.000 / 100.000 năm) rơi 1 hồn cốt **cùng loài, cùng số năm** với hồn thú, vị trí ngẫu nhiên trong 6 vị trí (đầu, thân, tay trái, tay phải, chân trái, chân phải). Hồn cốt rơi xuống đất cạnh hồn hoàn, cùng luật như hồn hoàn: 15 giây đầu chỉ người hạ nhặt được, tồn tại 60 giây, nhấn **E** để nhặt vào túi, túi đầy thì báo và hồn cốt ở lại. Trong túi mỗi hồn cốt một ô, tên kiểu *Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm*, màu theo niên hạn; chọn ô thì xem chỉ số gốc, cấp cường hóa (+0), đang gắn hay chưa; bỏ được bằng nút "Bỏ". Tinh anh (BĐ4) rơi hồn cốt với tỉ lệ x3, mang loài gốc. Từ 4.3 chi tiết ô ghi cả kỹ năng của hồn cốt. ➜ 4.4: cường hóa.
- **Gắn hồn cốt** (từ 4.2, mục 5.1, 5.5): mỗi võ hồn sở hữu có **6 ô hồn cốt** (đầu, thân, tay trái, tay phải, chân trái, chân phải); hồn cốt chỉ gắn vào ô cùng vị trí. Gắn ở mục "Hồn cốt" trong bảng đội hình (phím V; hoặc nút "Gắn…" ở túi đồ): chọn võ hồn, chọn ô hoặc bấm "Gắn" cạnh hồn cốt trong túi, chuột kéo thả vào ô cũng được. Ô đã có thì đổi chỗ, món cũ về túi; tháo về túi khi túi đầy thì bị từ chối. Chỉ gắn / tháo khi **không giao chiến** (5 giây không đánh / bị đánh), không gục, không hấp thụ (cùng luật xếp đội). Hồn cốt đang gắn không chiếm ô túi, không bỏ được, **không bao giờ mất** khi gục hay thua; tháo ra vẫn giữ cấp cường hóa. Chỉ số gốc của các hồn cốt đang gắn cộng thẳng vào chỉ số của võ hồn đó (sau hệ số hệ và sao), áp ngay cả khi võ hồn đang ra trận; đổi võ hồn thì chỉ số theo hồn cốt của võ hồn mới. Từ 4.3 hồn cốt còn mang kỹ năng (mục dưới). ➜ 4.4: cường hóa.
- **Kỹ năng hồn cốt** (từ 4.3, mục 5.5): mỗi hồn cốt mang kỹ năng theo **loài hồn thú gốc** (bảng ở 5.5): hồn cốt đầu / tay trái / tay phải cho 1 kỹ năng **chủ động**, thân / chân trái / chân phải cho 1 kỹ năng **bị động**. Chỉ võ hồn **đang ra trận** dùng kỹ năng của hồn cốt gắn trên nó. Chủ động: phím **Z / X / C** (đầu, tay trái, tay phải; 3 nút bên trái thanh hồn kỹ, chạm được trên điện thoại), mỗi nút một hồi chiêu riêng (thuộc hồn sư: đổi võ hồn không làm mới), tốn hồn lực, mạnh theo số năm hồn cốt như hồn kỹ theo số năm hồn hoàn; bị chặn khi gục, đang hấp thụ, đang đi cổng, trong vùng an toàn, bị Choáng / Câm lặng; kỹ năng đánh một mục tiêu không có hồn thú trong tầm thì không tung (không tốn gì). Bị động: cộng thường trực tốc chạy, công, chí mạng, giảm sát thương nhận, giảm tiêu hao hồn lực, hút máu, hoặc kháng một trạng thái (thời gian ngắn đi), mạnh theo số năm, nhiều hồn cốt thì cộng dồn tới mức trần; áp ngay khi gắn trên võ hồn ra trận, mất ngay khi tháo hoặc đổi sang võ hồn khác. ➜ 4.4: các mốc cường hóa nâng kỹ năng.
- **Tinh anh (biến dị)** (từ BĐ4, mục 5.4): mỗi vùng săn của 3 bản đồ săn có đúng 1 tinh anh tên riêng (bảng 5.3, ví dụ *Tinh anh Huyết Nhãn Phong Lang*), niên hạn bằng mức trên của vùng, máu x2,5 và sát thương x1,5 so với loài gốc cùng năm, 2 chiêu báo trước (có chiêu nhiều vùng một lúc, gọi bầy, kéo người). **Máu tăng theo số người tham gia** × (1 + 0,6 × (N − 1)): người đứng trong 250 pixel lúc tinh anh bắt đầu giao chiến, hoặc gây sát thương sau đó; vào giữa trận thì máu tối đa tăng ngay, máu hiện tại giữ tỉ lệ; rời phòng hoặc ở ngoài bán kính 30 giây liên tục thì bị loại, số người giảm tối đa 1 mỗi 10 giây; 15 giây không còn ai trong bán kính thì tinh anh về chỗ, hồi đầy. Máu dưới 50% thì nổi **Cuồng nộ** 10 giây (sát thương +30%, tốc độ +25%); hồn kỹ Thiên Càn Trấn Áp của Thiên Càn Bạch Ngọc Đỉnh xóa Cuồng nộ. Hạ thì người hạ nhận kinh nghiệm x2,5, hồn hoàn ưu tiên người đóng góp nhiều nhất 15 giây, tỉ lệ rơi hồn cốt **x3** (hồn cốt mang loài gốc, cùng quyền ưu tiên như hồn hoàn), cả bản đồ được báo; hồi sinh ngẫu nhiên sau 8–12 phút (cũng báo cả bản đồ). Trên bản đồ: tên "Tinh anh …" màu riêng, aura, sprite loài gốc phóng 1,25 lần, chấm sáng trên bản đồ nhỏ. Từ 5.1 tinh anh **chắc chắn rơi 1 hồn hạch** (sao theo niên hạn, bộ theo bản đồ, cùng quyền ưu tiên như hồn hoàn).
- **Hồn hạch rơi** (từ 5.1, mục 5.3, 5.6): hạ hồn thú thường có 15% / 25% / 40% / 100% (dưới 1.000 / dưới 10.000 / dưới 100.000 / 100.000 năm) rơi 1 hồn hạch 1–2★ / 2–4★ / 3–5★ / 5–6★ (sao thấp hay ra hơn). Bộ: 80% thuộc bộ đặc trưng của bản đồ (Thánh Hồn Thôn: Lam Ngân, Tiên Cơ; Ngoại vi: Linh Miêu, Hạo Thiên, Xà Hoàng; Nội địa: Bá Vương Long, Thất Sát, Lưu Ly), còn lại một bộ bất kỳ trong 9 bộ. Mỗi hồn hạch có 1 chỉ số chính (theo sao) và số dòng phụ ngẫu nhiên theo sao (1★ 0 dòng, 2★ 1, 3★ 1, 4★ 2, 5★ 3, 6★ 4), nâng cấp +0. Rơi xuống đất cạnh hồn hoàn, cùng luật như hồn hoàn: 15 giây đầu chỉ người hạ nhặt được, tồn tại 60 giây, nhấn **E** để nhặt vào túi, túi đầy thì báo và hồn hạch ở lại. Trong túi mỗi hồn hạch một ô, biểu tượng viên hạch màu bộ kèm hình riêng mỗi bộ, số sao ở góc ô; chọn ô thì xem tên kiểu *Hồn hạch Hạo Thiên 4★*, bộ, chỉ số chính, các dòng phụ, nâng cấp, chưa gắn và hiệu ứng bộ 2 / 4 món; bỏ được bằng nút "Bỏ". ➜ 5.2: gắn 6 ô, hiệu ứng bộ, chỉ số cộng vào võ hồn; 5.3: nâng cấp.
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

**Đã làm ở bước 2.5a** (bảng `STATUS` trong `shared/data.ts`, mọi con số **(chờ chốt)**; hiện chỉ hồn thú mang trạng thái):

| Trạng thái | Thời gian | Tầng | Số liệu |
|---|---|---|---|
| Thiêu đốt | 4 giây | 5 | Mỗi tầng 25% công người gây mỗi giây. *Viêm bạo* nổ một lần phần sát thương còn lại × 1,5 rồi xóa Thiêu đốt; Hỏa Long (2.5b) kích nổ rồi đặt lại 1 tầng. |
| Cảm điện | 6 giây | 1 | Đòn trực tiếp trúng hồn thú Cảm điện thì 40% sát thương lan sang mọi hồn thú Cảm điện khác trong 64 pixel (một bước, không lan tiếp). |
| Trúng độc | 6 giây | 5 | Mỗi tầng 18% công mỗi giây; hồn thú bị độc hồi máu chậm một nửa. |
| Dễ thương | 5 giây | 1 | Nhận thêm 25% mọi sát thương (cả sát thương theo thời gian). |
| Phá giáp (Liệt thương) | 6 giây | 3 | Mỗi tầng nhận thêm 10% sát thương đòn trực tiếp. Hồn thú chưa có chỉ số thủ nên "giảm thủ" tạm quy thành nhận thêm sát thương; đổi lại khi hồn thú có thủ. |
| Choáng | 1,5 giây | 1 | Không đi, không đánh, không bị đẩy lùi. |
| Câm lặng | 3 giây | 1 | Từ bước 3.5: hồn thú không tung và bị **ngắt chiêu báo trước**, vẫn đánh thường (2.5a–2.5c tạm chặn cả đánh thường vì hồn thú chưa có chiêu). |
| Trói | 2 giây | 1 | Không đi, không bị đẩy lùi, vẫn đánh khi kề bên. |
| Mị hoặc (2.5c) | 5 giây | 3 | Mỗi tầng chậm 15%. Đủ 3 tầng thì bùng phát thành **Mê hoặc**, xóa Mị hoặc. Đang Mê hoặc thì không nhận thêm Mị hoặc. |
| Mê hoặc (2.5c) | 2,5 giây | 1 | Bỏ mục tiêu, đi lung tung (đổi hướng mỗi 0,4–0,7 giây quanh chỗ đang đứng), không đánh. Là khống chế nên ngắn hơn với hồn thú bậc cao. |
| Làm chậm (2.5c) | 2 giây | 1 | Tốc độ di chuyển giảm 40%. Mọi trạng thái làm chậm cộng lại tối đa 80% (`SLOW_CAP`). |
| Phong ấn (2.5c) | 6 giây | 3 | Không tự gây gì; đủ 3 tầng thì bùng phát thành **Dễ thương 6,8 giây** (lâu hơn 5 giây mặc định), xóa Phong ấn. Đây là "cộng dồn gây Dễ thương 6,8 giây" của Càn Khôn Hỗn Nguyên Tỏa. |

- Sát thương theo thời gian tính một lần lúc gây: công của người gây (kể cả hiệu ứng tăng công) × sức mạnh hồn kỹ (mục 5.2); gây mỗi giây, không chí mạng, không tạo năng lượng tiên cơ, không giữ hồn sư trong giao chiến. Người gây rời phòng thì trạng thái đó mất.
- Gây lại cùng trạng thái: cộng tầng tới tối đa, lấy thời gian còn lại dài hơn và độ lớn mạnh hơn.
- Khống chế (Choáng, Trói, Câm lặng) ngắn hơn với hồn thú bậc cao: × 1 / 1 / 1 / 0,75 / 0,5 theo bậc 10 năm → 10 vạn năm (`CC_TIER_MULT`).
- **Mới ở 2.5a:** hồn thú không có mục tiêu và không bị đánh 6 giây thì hồi 4% sinh lực tối đa mỗi giây (`BEAST_REGEN`), để Trúng độc có cái mà giảm.
- Người đang đi cổng hoặc đứng trong vùng an toàn không gây sát thương và trạng thái nào (kể cả nhát hẹn giờ của hồn kỹ liên hoàn, mũi đạn đang bay, độc và lửa đang cháy): kills, kinh nghiệm, năng lượng không tăng.
- **Trạng thái trên hồn sư** (từ 3.5, `PLAYER_STATUS`, **chờ chốt**): chỉ chiêu báo trước của hồn thú gây, cùng bảng và luật cộng tầng ở trên. Choáng: không đi, không đánh, không dùng hồn kỹ; Trói: không đi; Câm lặng: không dùng hồn kỹ (vẫn đánh thường); Làm chậm: giảm tốc; Trúng độc / Thiêu đốt: mỗi tầng `dot` × sát thương đòn thường của hồn thú mỗi giây (không có khung bất tử sau đòn); Dễ thương / Phá giáp: nhận thêm sát thương; Cảm điện: đòn hồn thú trúng hồn sư Cảm điện lan 40% sang hồn sư Cảm điện khác trong 64 pixel. Thời gian khống chế trên hồn sư không nhân theo bậc. Trạng thái thuộc hồn sư (đổi võ hồn vẫn còn); vào vùng an toàn hoặc cả đội gục thì hết; tiên cơ Xúc Xích giải hết. Ai cũng thấy dây trói, sao choáng và biểu tượng trên đầu; chính mình thấy ô viền đỏ cạnh hiệu ứng có lợi.
- **Mê hoặc, Làm chậm** làm ở 2.5c (Yêu Hồ). "Tê liệt" của Kim Vũ Miêu Ưng tạm quy thành Trói 3 giây (co giật, không đi) + Câm lặng 5 giây (không đánh), chưa thành trạng thái riêng **(chờ chốt)**.
- **Tàng hình** (từ 2.5c, Yêu Hồ; hiệu ứng có lợi `hide`): hồn thú bỏ mục tiêu và không nhắm tới hồn sư (kể cả khi bị đánh trúng). Đánh thường, tung hồn kỹ khác hoặc tiên cơ thì hiện hình. Người khác thấy hồn sư mờ hẳn, chính mình thấy nửa trong suốt.
- **Phong Lôi Chi Lực** (từ 2.5c, Lam Điện Bá Vương Long; `PHONG_LOI`, **chờ chốt**): thanh 0–100 của hồn sư, chỉ tích khi Lam Điện ra trận đánh trúng: đòn thường +4, hồn kỹ +10 (một lần mỗi đòn như năng lượng tiên cơ), gấp đôi nếu hồn thú trúng đầu tiên đang Cảm điện. Đầy thì **tự tung Lôi Động Minh Thiên** ngay nhịp sau (quanh thân 120: 300% công, hồn thú Cảm điện thêm 100%, Cảm điện, Choáng 1 giây; sức mạnh theo hồn hoàn năm cao nhất của võ hồn), thanh về 0. Lôi Động Minh Thiên không tạo năng lượng tiên cơ và không tích lại Phong Lôi Chi Lực. Ngoài giao chiến quá 10 giây thì giảm 10 mỗi giây; Lam Điện gục thì mất hết; không lưu DB. Ai cũng thấy tia sét quanh thân (dày hơn khi gần đầy); chính mình thấy thanh dưới thanh kinh nghiệm. "Ngắt chiêu boss" hiện là Choáng 1 giây; từ 3.5 Choáng ngắt luôn chiêu báo trước đang hiện của hồn thú.
- **Hiệu ứng có lợi trên hồn sư** (từ hồn kỹ phụ trợ, bảng `BUFFS`): tăng công, tăng tốc, tăng thủ (giảm sát thương nhận), tăng chí mạng, giảm tiêu hao hồn lực, miễn sát thương. Như khiên, hiệu ứng thuộc **hồn sư** nên đổi võ hồn vẫn còn: đổi sang Cửu Bảo Lưu Ly Tháp tung xong rồi đổi về võ hồn đánh chính. Cả đội gục thì mất. **(chờ chốt)** Hiện chỉ có tác dụng lên chính mình; tổ đội người chơi (7.1) sẽ xét cho đồng đội.
- **Lãnh vực phượng hoàng** (từ 2.5b, Tà Hỏa Phượng Hoàng; hiệu ứng có lợi `phoenix`, **chờ chốt**): vòng lửa bán kính 90 (`PHOENIX_FIELD_R`) đi theo hồn sư; hồn thú trong vòng nhận thêm 30% (× `buffPower`) sát thương từ mọi nguồn, kể cả của người chơi khác và sát thương theo thời gian (nhiều lãnh vực chồng nhau chỉ lấy cái mạnh nhất). Như mọi hiệu ứng có lợi, đổi võ hồn vẫn còn: mở lãnh vực rồi đổi sang Hỏa Long đánh tiếp. Hồn sư đứng trong vùng an toàn hoặc đang đi cổng thì lãnh vực tạm vô hiệu.
- **Hút huyết** (từ 2.5d, Quỷ Mị; hiệu ứng có lợi `leech`, **chờ chốt**): một phần mọi sát thương hồn sư gây lên hồn thú (đòn trực tiếp, sát thương theo thời gian, lan Cảm điện) hồi thành sinh lực cho võ hồn đang ra trận, cộng với hút máu riêng của hồn kỹ (Bích Lân Xà Hoàng, Nhu Cốt Thố). Như mọi hiệu ứng có lợi, đổi võ hồn vẫn còn: Quỷ Mị bật rồi đổi sang võ hồn đánh chính. "Tàng hình cả đội" của Quỷ Ảnh Trùng Trùng dùng hiệu ứng `hide` có sẵn (thuộc hồn sư nên võ hồn nào ra trận cũng tàng hình).

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
- **Đã làm bản tối thiểu ở 2.5d** (bảng `BONDS` + `bondsOf` trong `data.ts`, **chờ chốt**): chỉ hai cặp ví dụ trên. Hai võ hồn cùng trong đội (ô bất kỳ, kể cả đang gục) thì võ hồn nào ra trận cũng hưởng: *Hạo Thiên – Nhu Cốt* chí mạng +10% mọi đòn trực tiếp; *Tà Hỏa – Hỏa Ảnh* Thiêu đốt do hồn sư gây mạnh thêm 20% (tính lúc gây). Bảng đội hình (phím V) hiện dòng "Ràng buộc" khi đội có cặp đó. Các cặp khác, mức hiệu ứng, có cần cả hai chưa gục hay đang ra trận không: chờ chốt.

**Lưu phái đội hình mẫu:**
- **Thiêu đốt:** Tà Hỏa Phượng Hoàng + Hỏa Long + Hỏa Ảnh + Cửu Bảo Lưu Ly Tháp.
- **Cảm điện:** Lam Điện Bá Vương Long + Kim Vũ Miêu Ưng + Càn Khôn Hỗn Nguyên Tỏa + Xúc Xích. Phủ Cảm điện toàn vùng rồi đổi sang Lam Điện Bá Vương Long để kích nổ.
- **Chấn đãng (bùng nổ vật lý):** Hạo Thiên Chùy + Nhu Cốt Thố + Lam Ngân Thảo + Quỷ Mị.
- **Trúng độc:** Bích Lân Xà Hoàng + Tử Vong Chu Hoàng + Nguyệt Nhận + Thiên Càn Bạch Ngọc Đỉnh.

**Sưu tầm võ hồn** (không có gacha; lễ thức tỉnh đã chốt, phần mảnh võ hồn chờ chốt):
- Khi tạo tài khoản, Tố Vân Đào làm lễ thức tỉnh: nhận Lam Ngân Thảo và **tự chọn 1 võ hồn SSR bất kỳ** trong danh sách 17 SSR cơ bản.
- Các võ hồn khác mở bằng **mảnh võ hồn**: rơi từ hồn thú (mỗi bản đồ săn rơi mảnh của 2–3 võ hồn riêng, bảng ở mục 5.3), tà hóa thú vương, boss thế giới và nhiệm vụ. Đủ 50 mảnh thì mở võ hồn.
- Mảnh dư dùng để **lên sao** (1★ → 6★, cần 20 / 40 / 80 / 120 / 200 mảnh). Mỗi sao tăng chỉ số gốc và mở thêm hiệu ứng cho hồn kỹ.
- **Đã làm ở bước 3.4** (số trong `shared/data.ts`, **chờ chốt**): mảnh là vật phẩm `manh_<mã võ hồn>` gộp tối đa 999 một ô (`SHARD_STACK`); rơi 1 mảnh mỗi lần (`SHARD_QTY`) theo tỉ lệ niên hạn của bảng rơi 5.3 (`SHARD_DROP`); mở võ hồn 50 mảnh (`SHARD_UNLOCK`), võ hồn mở ra ở cấp 1, 1★; mỗi sao trên 1 cộng 5% sinh lực, hồn lực, công gốc (`STAR_STAT`, không đổi tốc độ). Hiệu ứng hồn kỹ theo sao **chưa làm** (để bước sau).

**Trong trận:**
- Phím đổi võ hồn (1–4 trên máy tính, chạm ô trên thanh đội hình ở điện thoại) chuyển ngay sang võ hồn khác trong đội, mỗi lần đổi hồi 3 giây (`SWITCH_CD`). Hồn kỹ vì vậy chuyển sang phím U / I / O / P (đã làm ở 2.3a). **Đã chốt:** hồn kỹ dùng U / I / O / P, phím 1–4 dành cho đổi võ hồn.
- Xếp đội (thay võ hồn khác vào đội, đổi chỗ, bỏ ra) chỉ khi ngoài giao chiến (`TEAM_COMBAT_SECS`). Đội phải có ít nhất 1 võ hồn; võ hồn đang ra trận luôn nằm trong đội.
- **Năng lượng tiên cơ:** đánh trúng thì tích năng lượng. Võ hồn đủ năng lượng khi được đổi vào sẽ tung **chiêu tiên cơ** ngay lúc xuất hiện. Đây là kỹ thuật nối combo chính. Chi tiết dưới đây đã làm ở bước 2.4, số liệu trong `shared/data.ts` (`TIEN_CO_*`):
  - **(chờ chốt)** Năng lượng **thuộc từng võ hồn** trong đội, 0–100 (`TIEN_CO_MAX`). Võ hồn ra trận đánh trúng thì **các võ hồn khác trong đội (đang ở ngoài, chưa gục) tích năng lượng**; võ hồn ra trận không tự tích. Nhờ vậy cứ đánh một lúc là võ hồn ngoài sân đầy, khuyến khích đổi liên tục.
  - **(chờ chốt)** Mỗi đòn đánh thường trúng +10, mỗi lần tung hồn kỹ trúng +20 (`TIEN_CO_GAIN`); tính một lần cho mỗi đòn dù trúng nhiều hồn thú hay nhiều mũi đạn. Đòn tiên cơ không tạo năng lượng (tránh nối tiên cơ vô hạn). Khoảng 10 đòn thường (4 giây) là đầy, khớp nhịp hồi chiêu đổi 3 giây.
  - **(chờ chốt)** Võ hồn **gục thì mất hết năng lượng**. Ra khỏi giao chiến quá 10 giây (`TIEN_CO_IDLE_SECS`) thì năng lượng cả đội giảm dần 10 mỗi giây (`TIEN_CO_DECAY`): mỗi trận phải tích lại, không mang năng lượng đầy từ trận trước sang. Rời đội thì mất năng lượng. Năng lượng không lưu DB (vào lại game là 0).
  - **(chờ chốt)** Chỉ **đổi tay** (phím 1–4 / chạm) mới tung tiên cơ, tung xong năng lượng về 0. Tự đổi khi võ hồn ra trận gục không tung và giữ nguyên năng lượng của võ hồn tự ra trận. Tiên cơ không tốn hồn lực, không vướng hồi chiêu hồn kỹ. Trong vùng an toàn (mục 5.3) đổi tay vẫn được nhưng không tung tiên cơ và giữ năng lượng.
  - **(chờ chốt) Tiên cơ chung theo hệ** (bảng `TIEN_CO`; sát thương là bội số công của võ hồn vừa đổi vào, không dao động ngẫu nhiên, vẫn có thể chí mạng). Từ 2.5a, 5 võ hồn mẫu dùng tiên cơ riêng (bảng dưới); từ 2.5d cả 20 võ hồn đều có tiên cơ riêng, bảng chung giữ làm dự phòng cho võ hồn thêm sau.

    | Hệ | Tên | Hiệu ứng |
    |---|---|---|
    | Cường công | Bạo Liệt | Nổ quanh thân bán kính 56: 300% công cho mọi hồn thú trúng |
    | Mẫn công | Thiểm Sát | Lướt tối đa 90 tới hồn thú gần nhất trong tầm 110 (không có thì lướt theo hướng nhìn), chém một mục tiêu 500% công, bất tử 0,35 giây |
    | Khống chế | Phong Tỏa | Quanh thân bán kính 64: 120% công và choáng 1,5 giây (không đi, không đánh, không bị đẩy lùi) |
    | Phụ trợ | Hộ Thể | Hồi 25% sinh lực tối đa cho mọi võ hồn chưa gục trong đội; khiên 20% sinh lực tối đa trong 5 giây (khiên thuộc hồn sư, đổi võ hồn vẫn còn) |
  - **(chờ chốt) Tiên cơ riêng** (bước 2.5a, bảng `TIEN_CO_RIENG`): chạy bằng cùng bộ máy với hồn kỹ, sức mạnh 1 (× bộ Tiên Cơ 4 món khi có), không tốn hồn lực, không tạo năng lượng. Sát thương là bội số công.

    | Võ hồn | Tên | Hiệu ứng |
    |---|---|---|
    | Lam Ngân Thảo | Lam Ngân Phong Tỏa | Quanh thân bán kính 64: kéo hồn thú về sát thân, 120% công, Trói 2 giây, Dễ thương 4 giây |
    | Hạo Thiên Chùy | Hạo Thiên Giáng Thế | Quanh thân bán kính 60: 300% công + 4% sinh lực tối đa, hất tung (Choáng 0,8 giây) |
    | U Minh Linh Miêu | U Minh Thiểm Trảo | Lướt tối đa 90 tới hồn thú gần nhất trong tầm 110, cào 5 nhát mỗi nhát 100% công, +30% chí mạng, bất tử 0,35 giây |
    | Bích Lân Xà Hoàng | Xà Hoàng Độc Vực | Quanh thân bán kính 64: 100% công, Trúng độc 3 tầng, Câm lặng 2 giây |
    | Cửu Bảo Lưu Ly Tháp | Vô Địch Thần Quang | Hồn sư miễn mọi sát thương 2,5 giây, hồi 20% sinh lực cho cả đội. Lấy tên tuyệt kỹ của Ninh Vinh Vinh cho bản nhỏ; tuyệt kỹ thật (vòng 10) mạnh hơn, chờ chốt |
    | Tà Hỏa Phượng Hoàng (2.5b) | Phượng Hoàng Tiếu Thiên Kích | Bay lên rồi lao xuống, quanh thân bán kính 72: 220% công, Thiêu đốt 3 tầng; mở lãnh vực phượng hoàng 5 giây |
    | Hỏa Long (2.5b) | Long Viêm Bạo | Quanh thân bán kính 100: 120% công, Viêm bạo kích nổ mọi tầng Thiêu đốt rồi đặt lại 1 tầng. Combo lưu phái: Tà Hỏa Phượng Hoàng chồng tầng, đổi tay vào Hỏa Long |
    | Hỏa Ảnh (2.5b) | Hỏa Ảnh Trùng Trùng | Quanh thân bán kính 72: 120% công, Choáng 1,5 giây, Dễ thương 5 giây, Thiêu đốt 1 tầng |
    | Kỳ Nhung Thông Thiên Cúc (2.5b) | Cúc Hoa Phong Bạo | Quanh thân bán kính 64, 4 nhát cách 0,3 giây: mỗi nhát 80% công, Thiêu đốt 1 tầng; nhát cuối Trói 1,5 giây |
    | Nguyệt Nhận (2.5b) | Nguyệt Nhận Đoạt Mệnh | Khóa hồn thú yếu máu nhất trong 130, lướt tới (tối đa 110), 3 nhát mỗi nhát 130% công, thêm tới +150% theo phần sinh lực mục tiêu đã mất, bất tử 0,35 giây |
    | Lam Điện Bá Vương Long (2.5c) | Lam Điện Lôi Bạo | Quanh thân bán kính 110: 150% công, hồn thú đang Cảm điện thêm 150% (kích nổ Cảm điện), Cảm điện. Combo lưu phái: Kim Vũ Miêu Ưng / Càn Khôn Hỗn Nguyên Tỏa phủ Cảm điện, đổi tay vào Lam Điện; mỗi nhát còn lan 40% sang hồn thú Cảm điện gần đó |
    | Kim Vũ Miêu Ưng (2.5c) | Kim Ưng Giáng Lôi | Bay lên rồi giáng sét, quanh thân bán kính 100: 140% công, Cảm điện 8 giây, Câm lặng 2 giây |
    | Càn Khôn Hỗn Nguyên Tỏa (2.5c) | Càn Khôn Đại Phong Tỏa | Quanh thân bán kính 72: 120% công, Phong ấn đủ 3 tầng (Dễ thương 6,8 giây ngay), Trói 2 giây, Cảm điện |
    | Yêu Hồ (2.5c) | Hồ Mị Thiên Hạ | Quanh thân bán kính 80: 120% công, Mị hoặc đủ 3 tầng (Mê hoặc ngay), Làm chậm 3 giây |
    | Xúc Xích (2.5c) | Thanh Tâm Hương Tràng | Hồi 20% sinh lực cả đội, 25% hồn lực, khiên 12% sinh lực tối đa 5 giây; từ 3.5 giải mọi trạng thái trên hồn sư (giải khống chế) |
    | Cửu Tinh Thất Sát Kiếm (2.5d) | Thất Sát Kiếm Vực | Quanh thân bán kính 72: 220% công, Phá giáp (Liệt thương) đủ 3 tầng |
    | Nhu Cốt Thố (2.5d) | Nhu Cốt Thuấn Suất | Thuấn di tối đa 90 tới hồn thú gần nhất trong 110, quật 3 đoạn mỗi đoạn 140% công, +30% chí mạng, hút 30% sát thương, đoạn cuối Choáng 0,8 giây, bất tử 0,35 giây |
    | Tử Vong Chu Hoàng (2.5d) | Chu Hoàng Thiên Võng | Quanh thân bán kính 80: kéo hồn thú về sát thân, 120% công, Trói 2 giây, Trúng độc 2 tầng, Cảm điện |
    | Quỷ Mị (2.5d) | Quỷ Ảnh Mê Tung | Cả đội tàng hình 4 giây, hút huyết 25% trong 4 giây |
    | Thiên Càn Bạch Ngọc Đỉnh (2.5d) | Bạch Ngọc Thánh Quang | Hồi 20% sinh lực cả đội, khiên 18% sinh lực tối đa 6 giây; từ 3.5 thanh tẩy mọi trạng thái trên hồn sư |
  - Bộ hồn hạch **Tiên Cơ** (5.6) đã có chỗ trong công thức: 2 món nhân tốc độ tích của võ hồn mang bộ thêm 20%, 4 món nhân sát thương tiên cơ thêm 35% (`TIEN_CO_SET`, `energyGain`, `tienCoDmgMult`); bật khi làm hồn hạch ở GĐ5.
  - Người chơi thấy năng lượng từng võ hồn trên thanh đội hình (thanh vàng), ô đầy năng lượng sáng viền kèm chữ "Tiên cơ!" và thông báo một lần. Người khác thấy hiệu ứng tiên cơ, vòng khiên và hồn thú bị choáng, không thấy năng lượng.
- Võ hồn đang ra trận gục thì tự đổi sang võ hồn còn sống. Võ hồn đã gục chỉ hồi lại ở doanh trại hoặc sau 60 giây ngoài trận.
- Cả đội gục thì về doanh trại, không mất kinh nghiệm hay đồ (chờ chốt; đã làm theo phương án này ở 2.3b).

**Kinh nghiệm:** chia cho cả 4 võ hồn trong đội; võ hồn đang ra trận nhận 40%, mỗi võ hồn còn lại 20% (đã chốt, làm ở bước 2.3b). Võ hồn đang ở bình cảnh thì không nhận, phần đó không chia lại.

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

**Số liệu bản đầu (bước 3.2, chờ chốt; nằm trong `shared/data.ts`):** tuổi hồn thú tung theo phân bố log trong khoảng của vùng (`rollYears`: càng già càng hiếm, khoảng hẹp thì gần như đều). Chỉ số theo năm (`beastStats`) nội suy hình học giữa hai mốc của `TIERS` (10, 100, 1.000, 10.000, 100.000 năm), nên đúng mốc thì bằng chỉ số cũ của bậc, ví dụ máu 100 năm 95, 437 năm 198, 999 năm 300; kích thước, tốc độ và Hồn Tệ vẫn theo bậc. Hồn hoàn trong túi không gộp (`stack` 1), nhặt trong bán kính 22 pixel (`PICKUP_RANGE`).

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

**Đã làm ở bước 3.3** (số liệu trong `shared/data.ts`: `RING_LIMIT` / `ringLimit`, `ABSORB_FAIL`, `absorbChance`, `ABSORB_SECS` / `absorbSecs`, `MAX_LEVEL`):
- % vượt giới hạn làm tròn lên số nguyên rồi tra bảng, ví dụ vòng 1 (423 năm): 528 năm vượt 25% (30% thất bại), 529 năm vượt 26% (60%), 846 năm vượt 100% (90%), 847 năm vượt 101% (không cho). Client và server dùng chung `absorbChance`.
- Thời gian hấp thụ nội suy theo log10 số năm: 3 + 12 × (log10(năm) − 1) / 4 giây, tức 10 năm 3 giây, 100 năm 6, 1.000 năm 9, 1 vạn năm 12, 10 vạn năm 15.
- "Không giao chiến" dùng cùng mốc với xếp đội hình (`TEAM_COMBAT_SECS` = 5 giây kể từ lần cuối đánh trúng hoặc bị đánh). Vùng an toàn hấp thụ được.
- Vòng 10 hấp thụ ở cấp 100 nên không lên thêm cấp (cấp tối đa 100). Vòng 5–10 chưa có hồn kỹ (bước 8.1), chỉ tăng chỉ số như các vòng trước (`calcStats`: sinh lực, công theo màu, hồn lực theo số vòng).

**Hồn kỹ theo vòng:**
- Vòng 1–6: mỗi vòng mở 1 hồn kỹ riêng của võ hồn. Mang tối đa 4 hồn kỹ chủ động, chọn từ các hồn kỹ đã mở.
- Vòng 7: **Võ Hồn Chân Thân**, biến hình trong một thời gian, tăng mạnh chỉ số.
- Vòng 8–9: hồn kỹ mạnh, đổi một ô chủ động.
- Vòng 10: tuyệt kỹ cuối của võ hồn (chờ chốt).

**Đã làm ở bước 2.5a** (mọi con số **(chờ chốt)**, bảng dữ liệu `VOHON_SKILLS` theo mã võ hồn trong `shared/data.ts`; đợt sau chỉ thêm dữ liệu):
- **Sức mạnh theo số năm:** `skillPower(năm)` nội suy theo log10 số năm giữa các mốc bậc: 10 năm ×1; 100 năm ×1,35; 1.000 năm ×1,9; 1 vạn năm ×2,8; 10 vạn năm ×4,5 (đúng mốc thì bằng hệ số theo bậc cũ, nên hồn kỹ chung không đổi). Ví dụ 423 năm ×1,69, 764 năm ×1,84, 1.760 năm ×2,12, 5.000 năm ×2,53. Nhân vào sát thương và sát thương theo thời gian của hồn kỹ vòng đó.
- Hiệu ứng có lợi, hồi sinh lực, khiên, hồi hồn lực tăng chậm hơn: `buffPower = 1 + (skillPower − 1) × 0,3`. Thời gian khống chế không đổi theo năm.
- Sát thương theo % sinh lực tối đa của mục tiêu mỗi nhát không quá 3 × công × sức mạnh (`PCT_HP_CAP`), để boss không bị bào quá nhanh.
- Vòng 1–4 mỗi vòng mở đúng 1 hồn kỹ nên đang mang cả 4 (phím U / I / O / P = vòng 1–4). Chọn 4 ô mang theo làm khi có vòng 5+ (bước 8.1).
- Hồn kỹ đánh một mục tiêu (vùng "mục tiêu") cần hồn thú trong tầm; không có thì không tung, không tốn hồn lực, không hồi chiêu.
- Vùng tác dụng: **quanh thân** (bán kính), **nửa trước mặt**, **lướt** thẳng (trúng mọi hồn thú trên đường), **mục tiêu** gần nhất (có thể lướt tới, nhiều nhát cách nhau vài phần giây), **bắn mũi** (tỏa hình quạt hoặc vòng tròn), **bản thân**.
- Mỗi lần tung hồn kỹ chỉ tạo năng lượng tiên cơ một lần dù nhiều nhát, nhiều mũi.

*Hồn kỹ chung* (võ hồn chưa có hồn kỹ riêng, như cũ): Hồn Bạo (12 hồn lực, hồi 3 giây, quanh thân 50: 220%), Thiểm Kích (16, 4,5 giây, lướt 70: 260%), Hồn Tiễn (22, 5 giây, 10 mũi vòng tròn: mỗi mũi 150%), Hồn Vực (40, 12 giây, quanh thân 90: 400%). Từ 2.5d không võ hồn nào dùng nữa; giữ làm dự phòng cho võ hồn thêm sau (Phá Hồn Thương, A Ngân, Liệt Hỏa Thương Lang, Băng Phượng Hoàng).

*Lam Ngân Thảo* (khống chế, chấn đãng: trói, gom quái, gây Dễ thương)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Triền Nhiễu | 12 / 4 giây | Mục tiêu gần nhất trong 80: 160%, Trói 2 giây, Trúng độc 1 tầng |
| 2 | Ký Sinh | 14 / 6 giây | Mục tiêu gần nhất trong 90: 120%, Dễ thương 6 giây |
| 3 | Lam Ngân Tù Lung | 24 / 9 giây | Quanh thân 90: kéo mọi hồn thú về sát thân, 150%, Trói 2,5 giây |
| 4 | Chu Võng Thúc Phược | 40 / 13 giây | Quanh thân 70: 260%, Choáng 2 giây |

*Hạo Thiên Chùy* (cường công, chấn đãng: sát thương theo % sinh lực, phá giáp, hất tung)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Hạo Thiên Trọng Kích | 12 / 3,5 giây | Nửa trước mặt 36: 240% + 3% sinh lực tối đa |
| 2 | Chấn Địa Chùy | 16 / 6 giây | Quanh thân 60: 180%, Phá giáp 2 tầng |
| 3 | Loạn Phi Phong Chùy Pháp | 24 / 8 giây | Lướt tới mục tiêu trong 50 (tối đa 30), 4 nhát cách 0,22 giây, mỗi nhát 90% + 2% sinh lực tối đa; nhát cuối hất tung (Choáng 1 giây) |
| 4 | Hạo Thiên Phá Sơn | 40 / 14 giây | Quanh thân 80: 400% + 6% sinh lực tối đa, hất tung (Choáng 1,2 giây) |

*U Minh Linh Miêu* (mẫn công, chấn đãng: tốc độ, chí mạng cao, cào liên hoàn)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | U Minh Đột Thứ | 12 / 3,5 giây | Lướt 70 xuyên hàng hồn thú: 220%, +25% chí mạng, bất tử 0,3 giây |
| 2 | U Minh Trảo | 16 / 5 giây | Lướt tới mục tiêu trong 40 (tối đa 20), 3 nhát mỗi nhát 90%, +20% chí mạng, mỗi nhát Phá giáp 1 tầng |
| 3 | U Minh Ảnh Bộ | 18 / 14 giây | Bản thân: tốc độ +40%, chí mạng +25% trong 6 giây |
| 4 | U Minh Bách Trảo | 40 / 14 giây | Lướt tới mục tiêu trong 70 (tối đa 60), 8 nhát mỗi nhát 80%, +30% chí mạng, bất tử 0,5 giây |

*Bích Lân Xà Hoàng* (khống chế, trúng độc lõi: độc cộng dồn, câm lặng diện rộng, hút máu)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Bích Lân Độc Tiễn | 12 / 3 giây | 3 mũi độc tỏa 40° về trước (tầm 120): mỗi mũi 100%, Trúng độc 1 tầng |
| 2 | Bích Lân Độc Vụ | 16 / 6 giây | Quanh thân 60: 60%, Trúng độc 2 tầng |
| 3 | Xà Hoàng Uy Áp | 22 / 10 giây | Quanh thân 80: 80%, Câm lặng 3 giây, Dễ thương 4 giây |
| 4 | Vạn Xà Phệ Tâm | 40 / 14 giây | Mục tiêu gần nhất trong 80: 300% + 60% mỗi tầng Trúng độc trên mục tiêu, hút 40% sát thương thành sinh lực. "Bỏ qua thủ" làm khi hồn thú có thủ |

*Cửu Bảo Lưu Ly Tháp* (phụ trợ: tăng công / tốc / thủ, giảm tiêu hao hồn lực; hiệu ứng thuộc hồn sư nên cả đội hưởng)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Lực Chi Lưu Ly | 12 / 14 giây | Công +20% trong 12 giây |
| 2 | Tốc Chi Lưu Ly | 12 / 14 giây | Tốc độ +25% trong 12 giây |
| 3 | Hồn Chi Lưu Ly | 0 / 20 giây | Hồi 25% hồn lực tối đa; hồn kỹ tốn ít hơn 30% trong 12 giây |
| 4 | Phòng Chi Lưu Ly | 30 / 16 giây | Sát thương nhận giảm 25% trong 12 giây, khiên 12% sinh lực tối đa |

Số phần trăm của Cửu Bảo Lưu Ly Tháp là ở sức mạnh ×1; nhân thêm `buffPower` theo số năm hồn hoàn (ví dụ hồn hoàn 423 năm: công +24%).

**Đã làm ở bước 2.5b – lưu phái Thiêu đốt** (mọi con số **(chờ chốt)**, cùng bảng `VOHON_SKILLS` / `TIEN_CO_RIENG`). Cơ chế mới thêm vào bộ máy hồn kỹ (trường `SkillDef`), chỉ dùng khi lối đánh ở 5.1 bắt buộc:
- **Nhiều nhát quanh thân** (`around` có `n` / `every`): cánh hoa xoay, mỗi nhát tính quanh vị trí hiện tại của hồn sư, nhát cuối mới gây `finisher`.
- **Viêm bạo** (`boom.keep`): kích nổ mọi tầng Thiêu đốt trên hồn thú trúng (phần sát thương còn lại × 1,5, theo công người gây lúc gây), rồi đặt lại `keep` tầng; chưa có Thiêu đốt thì chỉ đặt tầng mới.
- **Lãnh vực phượng hoàng** (hiệu ứng có lợi `phoenix`, mục 5.1).
- **Đẩy lùi** (`push`): đẩy hồn thú ra xa hồn sư theo pixel, ngắn hơn với hồn thú bậc cao (`CC_TIER_MULT`); hồn thú đang Choáng / Trói không bị đẩy, nên hồn kỹ vừa đẩy vừa choáng thì đẩy trước rồi mới choáng.
- **Khóa mục tiêu yếu máu** (`pick: "low"`): chọn hồn thú có tỉ lệ sinh lực thấp nhất trong tầm thay vì gần nhất; **hạ mục tiêu yếu máu** (`lowHp`): sát thương nhân thêm tới `lowHp` theo phần sinh lực mục tiêu đã mất.
- **Bay** (`fly`): chỉ là hiệu ứng (fx `fly`: hồn sư nhấc lên khỏi bóng, tàn lửa rơi); bất tử khi bay dùng `inv` có sẵn. Chưa có "đang bay thì hồn thú không đánh tới".
- Làm chậm chưa thêm: "hạn chế di chuyển" của Kỳ Nhung Thông Thiên Cúc tạm dùng Trói ngắn; trạng thái làm chậm làm cùng Yêu Hồ (2.5c).
- Ràng buộc Tà Hỏa Phượng Hoàng + Hỏa Ảnh (tăng thiêu đốt) chưa làm, chờ chốt ràng buộc (2.5d). *Đã làm bản tối thiểu ở 2.5d (mục 5.1).*

*Tà Hỏa Phượng Hoàng* (cường công, thiêu đốt lõi: bay, thiêu đốt diện rộng, lãnh vực phượng hoàng)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Phượng Hoàng Hỏa Tuyến | 12 / 3,5 giây | Nửa trước mặt 44: 200%, Thiêu đốt 1 tầng |
| 2 | Dục Hỏa Phượng Hoàng | 16 / 6 giây | Quanh thân 64: 160%, Thiêu đốt 2 tầng |
| 3 | Phượng Hoàng Phi Thiên | 20 / 9 giây | Bay lướt 90 qua đầu hồn thú: 180% mọi hồn thú trên đường, Thiêu đốt 1 tầng, bất tử 0,6 giây |
| 4 | Phượng Hoàng Lãnh Vực | 40 / 16 giây | Quanh thân 90: 300%, Thiêu đốt 2 tầng; mở lãnh vực phượng hoàng 8 giây (+30% sát thương nhận, × `buffPower`) |

*Hỏa Long* (mẫn công, thiêu đốt: tầm xa phạm vi rộng, khó trượt, Viêm bạo)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Hỏa Long Tức | 12 / 3 giây | 5 mũi lửa tỏa 50° (tầm 140): mỗi mũi 90%, Thiêu đốt 1 tầng |
| 2 | Long Viêm Đạn | 14 / 4,5 giây | Mục tiêu gần nhất trong 150 (trúng ngay, không trượt): 200%, Thiêu đốt 2 tầng |
| 3 | Hỏa Long Phần Thiên | 24 / 9 giây | 12 mũi lửa vòng tròn (tầm 130): mỗi mũi 110%, Thiêu đốt 1 tầng |
| 4 | Viêm Bạo | 40 / 13 giây | Quanh thân 110: 180%, Viêm bạo kích nổ mọi tầng Thiêu đốt rồi đặt lại 1 tầng |

*Hỏa Ảnh* (khống chế, thiêu đốt: choáng, đẩy lùi, gây Dễ thương cho đồng đội đánh)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Hỏa Ảnh Chưởng | 12 / 4 giây | Nửa trước mặt 40: 150%, đẩy lùi 40, Thiêu đốt 1 tầng |
| 2 | Hỏa Ảnh Phược | 16 / 7 giây | Mục tiêu gần nhất trong 90: 140%, Choáng 1,5 giây, Thiêu đốt 1 tầng |
| 3 | Liệt Hỏa Ấn | 22 / 10 giây | Quanh thân 80: 100%, Dễ thương 6 giây, Thiêu đốt 1 tầng |
| 4 | Hỏa Ảnh Bạo Phá | 40 / 14 giây | Quanh thân 80: 260%, đẩy lùi 50, Choáng 1,5 giây, Thiêu đốt 2 tầng |

*Kỳ Nhung Thông Thiên Cúc* (cường công, thiêu đốt / phá giáp: cánh hoa sát thương liên tục, hạn chế di chuyển, hồi chiêu ngắn lấp khoảng cho võ hồn bùng nổ)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Cúc Hoa Phi Vũ | 10 / 2,5 giây | 3 cánh hoa tỏa 30° (tầm 120): mỗi cánh 100%, Phá giáp 1 tầng |
| 2 | Cúc Hoa Toàn Vũ | 18 / 7 giây | Quanh thân 56, 5 nhát cách 0,5 giây: mỗi nhát 70%, Thiêu đốt 1 tầng |
| 3 | Kỳ Nhung Triền | 18 / 8 giây | Quanh thân 70: 120%, Trói 1,5 giây, Phá giáp 1 tầng |
| 4 | Thông Thiên Cúc Vũ | 40 / 14 giây | Quanh thân 84, 8 nhát cách 0,4 giây: mỗi nhát 70%, Thiêu đốt và Phá giáp 1 tầng; nhát cuối Trói 1,5 giây |

*Nguyệt Nhận* (mẫn công, thiêu đốt / phá giáp: lướt xuyên hàng trước, khóa và hạ mục tiêu yếu máu ở hàng sau)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Nguyệt Ảnh Đột | 12 / 3,5 giây | Lướt 80 xuyên hàng hồn thú: 200%, Phá giáp 1 tầng, bất tử 0,3 giây |
| 2 | Huyết Nguyệt Trảm | 16 / 5 giây | Khóa hồn thú yếu máu nhất trong 110, lướt tới (tối đa 90), 2 nhát mỗi nhát 120% + tới 100% theo sinh lực đã mất, Thiêu đốt 1 tầng |
| 3 | Song Nguyệt Hồi Toàn | 20 / 8 giây | Nửa trước mặt 50: 180%, Phá giáp 2 tầng, Thiêu đốt 1 tầng |
| 4 | Tà Nguyệt Trảm | 40 / 14 giây | Khóa hồn thú yếu máu nhất trong 140, lướt tới (tối đa 130), 4 nhát mỗi nhát 110% + tới 150% theo sinh lực đã mất, +20% chí mạng, bất tử 0,5 giây |

**Đã làm ở bước 2.5c – lưu phái Cảm điện** (mọi con số **(chờ chốt)**, cùng bảng `VOHON_SKILLS` / `TIEN_CO_RIENG`). Lối chơi: Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa, Yêu Hồ phủ Cảm điện và giữ hồn thú lại gần nhau; Lam Điện Bá Vương Long đánh vào hồn thú Cảm điện thì thêm sát thương theo tầng (`perStack`), mỗi đòn trực tiếp lan 40% sang hồn thú Cảm điện trong 64 pixel (engine 2.5a) và tích Phong Lôi Chi Lực (mục 5.1); Xúc Xích hồi hồn lực cho đội và sao chép hồn kỹ của Lam Điện. Cơ chế mới (chỉ thêm khi lối đánh ở 5.1 bắt buộc):
- **Trạng thái mới** (mục 5.1): Mị hoặc / Mê hoặc, Làm chậm, Phong ấn; trường `StatusDef` mới `slow` (giảm tốc theo tầng), `wander` (đi lung tung), `burst` (đủ tầng thì bùng phát thành trạng thái khác). Vòng lặp hồn thú đọc cờ khống chế từ bảng `STATUS` thay vì viết tên từng trạng thái.
- **Vùng cố định** (`SkillDef.at`, `fixed`): `at` đặt vùng tại hồn thú gần nhất trong tầm (không có thì không tung, như vùng "mục tiêu"), có `dash` thì hồn sư bay tới trước; `fixed` đặt vùng ở chỗ hồn sư đứng lúc tung. Vùng không đi theo hồn sư (khác cánh hoa của Kỳ Nhung Thông Thiên Cúc). Client vẽ vùng trong suốt thời gian (fx `zone`).
- **Tàng hình** (hiệu ứng có lợi `hide`, mục 5.1) và **Phong Lôi Chi Lực** (`PHONG_LOI`, mục 5.1).
- **Phục Chế** (`SkillDef.copy`, Xúc Xích): đơn giản hóa "sao chép kỹ năng đồng đội" thành tung lại **hồn kỹ gần nhất của một võ hồn khác còn trong đội** (đồng đội = võ hồn trong đội của chính hồn sư, chưa có tổ đội người chơi 7.1), với công của Xúc Xích và sức mạnh theo hồn hoàn vòng 4 × 0,8 (cả sát thương lẫn hiệu ứng lên bản thân: hồi sinh lực, khiên, hồn lực, hiệu ứng có lợi; miễn sát thương và tàng hình giữ nguyên); tốn hồn lực, hồi chiêu của Phục Chế. Chưa có hồn kỹ để chép (hoặc võ hồn đó đã rời đội hay đang gục) thì không tung, không tốn gì. Chỉ chép hồn kỹ của võ hồn không có Phục Chế.
- "Giải khống chế" của Xúc Xích: từ 3.5 tiên cơ Thanh Tâm Hương Tràng giải mọi trạng thái trên hồn sư (do chiêu báo trước của hồn thú gây); hồn kỹ vòng 1 vẫn chỉ hồi sinh lực.
- "Hạn chế di chuyển" của Kỳ Nhung Thông Thiên Cúc (2.5b) vẫn dùng Trói ngắn; đổi sang Làm chậm thì chờ chốt (đổi số của võ hồn đã làm).

*Lam Điện Bá Vương Long* (cường công, cảm điện lõi: sấm sét diện rộng gây Cảm điện, Phong Lôi Chi Lực, Lôi Động Minh Thiên)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Lam Điện Kích | 12 / 3,5 giây | Nửa trước mặt 44: 200%, Cảm điện |
| 2 | Lôi Đình Phích Lịch | 16 / 6 giây | Quanh thân 72: 160%, Cảm điện |
| 3 | Lôi Long Liên Kích | 22 / 8 giây | Mục tiêu gần nhất trong 130, 3 tia cách 0,25 giây: mỗi tia 90%, Cảm điện; mỗi tia lan 40% sang hồn thú Cảm điện gần đó |
| 4 | Lam Điện Long Hống | 40 / 14 giây | Quanh thân 100: 260%, hồn thú đang Cảm điện thêm 120%, Cảm điện |
| (đầy thanh) | Lôi Động Minh Thiên | tự tung | Quanh thân 120: 300%, hồn thú Cảm điện thêm 100%, Cảm điện, Choáng 1 giây (ngắt chiêu) |

*Kim Vũ Miêu Ưng* (mẫn công, cảm điện: bay, vuốt tê liệt, áo nghĩa phủ Cảm điện toàn vùng)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Kim Vũ Trảo | 12 / 3,5 giây | Lướt tới mục tiêu trong 50 (tối đa 40), 2 nhát mỗi nhát 110%, Cảm điện |
| 2 | Lôi Trảo Tê Liệt | 16 / 9 giây | Lướt tới mục tiêu trong 70 (tối đa 60): 160%, tê liệt: Trói 3 giây (co giật) + Câm lặng 5 giây |
| 3 | Kim Vũ Phi Thiên | 20 / 8 giây | Bay lướt 90 qua đầu hồn thú: 180% mọi hồn thú trên đường, Cảm điện, bất tử 0,6 giây |
| 4 | Kim Ưng Lôi Vực | 40 / 16 giây | Áo nghĩa: quanh thân 160 ("toàn vùng"): 120%, Cảm điện 8 giây |

*Càn Khôn Hỗn Nguyên Tỏa* (khống chế, cảm điện: bay tới tạo vùng phong tỏa, giam và gây sát thương liên tục, Phong ấn cộng dồn thành Dễ thương 6,8 giây)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Càn Khôn Tỏa Liên | 12 / 3,5 giây | Mục tiêu gần nhất trong 100: 150%, Phong ấn 1 tầng, Cảm điện |
| 2 | Hỗn Nguyên Phong Tỏa | 18 / 9 giây | Bay tới hồn thú gần nhất trong 110 (tối đa 80), vùng phong tỏa cố định bán kính 56 trong 3 giây: 6 nhát cách 0,5 giây, mỗi nhát 45%, Trói 0,6 giây (giam), Phong ấn 1 tầng |
| 3 | Càn Khôn Đảo Chuyển | 22 / 10 giây | Quanh thân 80: kéo mọi hồn thú về sát thân (gom lại để lan Cảm điện), 120%, Phong ấn 1 tầng, Cảm điện |
| 4 | Hỗn Nguyên Thiên Tỏa | 40 / 15 giây | Bay tới hồn thú gần nhất trong 130 (tối đa 110), vùng cố định bán kính 84 trong 3,2 giây: 8 nhát cách 0,4 giây, mỗi nhát 60%, Trói 0,5 giây, Phong ấn 1 tầng, Cảm điện |

*Yêu Hồ* (khống chế, cảm điện: Mị hoặc cộng dồn, ảo ảnh tàng hình, lãnh vực làm chậm, ngắt chiêu)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Yêu Hồ Mị Nhãn | 12 / 3 giây | Nửa trước mặt 50: 140%, Mị hoặc 1 tầng |
| 2 | Hồ Ảnh Ảo Thuật | 16 / 10 giây | Ảo ảnh nổ quanh thân 60: 100%, Mị hoặc 1 tầng; hồn sư tàng hình 3 giây |
| 3 | Yêu Hồ Lãnh Vực | 22 / 12 giây | Lãnh vực cố định bán kính 90 ở chỗ đứng trong 3 giây: 6 nhát cách 0,5 giây, mỗi nhát 40%, Làm chậm 1 giây; nhát cuối Mị hoặc 1 tầng |
| 4 | Vạn Hồ Mị Ảnh | 40 / 14 giây | Quanh thân 100: 220%, Mị hoặc 2 tầng, Câm lặng 2 giây (ngắt chiêu), Cảm điện |

*Xúc Xích* (phụ trợ, cảm điện: hồi sinh lực, hồi hồn lực, xúc xích bay, áo nghĩa Phục Chế Hương Tràng; hiệu ứng thuộc hồn sư nên cả đội hưởng)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Khôi Phục Đại Hương Tràng | 12 / 10 giây | Hồi 20% sinh lực cả đội |
| 2 | Hồn Lực Hương Tràng | 0 / 16 giây | Hồi 30% hồn lực tối đa |
| 3 | Phi Hành Hương Tràng | 14 / 14 giây | Tốc độ +35% trong 8 giây, bay lên (bất tử 0,6 giây) |
| 4 | Phục Chế Hương Tràng | 30 / 14 giây | Áo nghĩa: tung lại hồn kỹ gần nhất của võ hồn khác còn trong đội, công của Xúc Xích, sát thương và hiệu ứng × 0,8 (võ hồn nguồn chưa gục) |

Số phần trăm hồi của Xúc Xích là ở sức mạnh ×1, nhân thêm `buffPower` theo số năm hồn hoàn (ví dụ 423 năm: hồi 24%).

**Đã làm ở bước 2.5d – 5 võ hồn còn lại** (mọi con số **(chờ chốt)**, cùng bảng `VOHON_SKILLS` / `TIEN_CO_RIENG`). Từ đây cả 20 võ hồn đều có hồn kỹ và tiên cơ riêng. Cơ chế mới (chỉ thêm khi lối đánh ở 5.1 bắt buộc):
- **Hút huyết** (hiệu ứng có lợi `leech`, mục 5.1): "biến sát thương gây ra thành hồi máu" của Quỷ Mị. `PlayerState.buff` đổi từ uint8 sang uint16 vì 8 bit đã dùng hết.
- **Ràng buộc** bản tối thiểu cho hai cặp ví dụ (`BONDS`, mục 5.1).
- Không cần cơ chế mới: "tàng hình cả đội" dùng `hide` (hiệu ứng thuộc hồn sư); hút máu của Nhu Cốt Thố dùng `lifesteal`; "tăng sát thương đội" là tăng công `atk`; Vô Ngã Kiếm Trận là nhiều nhát quanh thân (2.5b); lưới độc là vùng cố định (2.5c); gom quái là `pull` (2.5a).
- **"Xóa buff địch"** (từ BĐ4, chờ chốt): hồn kỹ Thiên Càn Trấn Áp xóa mọi hiệu ứng có lợi của hồn thú trúng (`SkillDef.dispel`; hiện chỉ có Cuồng nộ của tinh anh, mục 5.4). "Thanh tẩy đội" làm ở 3.5: tiên cơ Bạch Ngọc Thánh Quang giải mọi trạng thái trên hồn sư, như Xúc Xích. Hiện Thiên Càn Bạch Ngọc Đỉnh hồi máu, khiên, tăng thủ và gây Dễ thương + Câm lặng để cả đội đánh boss.
- Tên hồn kỹ: Nhu Cốt Thố lấy theo hồn kỹ của Tiểu Vũ (Yêu Cung, Thuấn Di, Vô Địch Kim Thân) và Bát Đoạn Suất; Vô Ngã Kiếm Trận, Kiếm Trảm Sơn Hà, Quỷ Ảnh Trùng Trùng, Tịnh Thế Lưu Ly lấy từ bảng 5.1 làm bản nhỏ ở vòng 3–4 (tuyệt kỹ thật để vòng 10); còn lại đặt tạm.

*Cửu Tinh Thất Sát Kiếm* (cường công, phá giáp: Vô Ngã Kiếm Trận sát thương diện rộng liên tục, Liệt thương, tuyệt kỹ Kiếm Trảm Sơn Hà)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Thất Sát Kiếm Khí | 12 / 3,5 giây | Nửa trước mặt 48: 220%, Phá giáp 1 tầng |
| 2 | Cửu Tinh Kiếm Vũ | 16 / 5,5 giây | 9 kiếm tỏa 80° (tầm 130): mỗi kiếm 70%, Phá giáp 1 tầng |
| 3 | Vô Ngã Kiếm Trận | 24 / 10 giây | Kiếm trận quanh thân 72 (đi theo hồn sư), 6 nhát cách 0,5 giây: mỗi nhát 60%, Phá giáp 1 tầng |
| 4 | Kiếm Trảm Sơn Hà | 40 / 14 giây | Nửa trước mặt 64: 360% + 40% mỗi tầng Phá giáp trên mục tiêu, Phá giáp 2 tầng |

*Nhu Cốt Thố* (mẫn công, chấn đãng: lướt, quật ngã, tăng chí mạng, hút máu; ràng buộc chí mạng với Hạo Thiên Chùy)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Yêu Cung | 12 / 3,5 giây | Lướt tới mục tiêu trong 50 (tối đa 40): 200%, +20% chí mạng, hút 20% sát thương, quật ngã (Choáng 0,6 giây) |
| 2 | Thuấn Di | 14 / 5 giây | Lướt 80 xuyên hàng hồn thú: 180%, +20% chí mạng, bất tử 0,4 giây |
| 3 | Vô Địch Kim Thân | 20 / 16 giây | Bất tử 1,2 giây; chí mạng +30% trong 6 giây |
| 4 | Bát Đoạn Suất | 40 / 14 giây | Lướt tới mục tiêu trong 60 (tối đa 50), 8 đoạn cách 0,14 giây, mỗi đoạn 75%, +25% chí mạng, hút 25% sát thương, bất tử 0,5 giây; đoạn cuối quật ngã (Choáng 1,2 giây) |

*Tử Vong Chu Hoàng* (khống chế, trúng độc / cảm điện: giăng tơ gom quái, độc nhện khống chế)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Chu Hoàng Độc Nha | 12 / 3,5 giây | Mục tiêu gần nhất trong 90: 150%, Trúng độc 2 tầng |
| 2 | Chu Ti Triền Phược | 18 / 9 giây | Quanh thân 90: kéo mọi hồn thú về sát thân (gom quái), 100%, Trói 2 giây, Trúng độc 1 tầng |
| 3 | Tử Vong Độc Võng | 22 / 11 giây | Lưới độc cố định bán kính 80 ở chỗ đứng trong 3 giây: 6 nhát cách 0,5 giây, mỗi nhát 35%, Làm chậm 1 giây, Trúng độc 1 tầng; nhát cuối Trói 1 giây |
| 4 | Tử Vong Thiên La | 40 / 15 giây | Quanh thân 110: kéo về sát thân, 220% + 40% mỗi tầng Trúng độc, Trói 2,5 giây, Trúng độc 2 tầng, Cảm điện |

*Quỷ Mị* (phụ trợ, đội bùng nổ: biến sát thương thành hồi máu, tăng sát thương đội, Quỷ Ảnh Trùng Trùng tàng hình cả đội; hiệu ứng thuộc hồn sư nên cả đội hưởng)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Quỷ Ảnh Trảo | 12 / 4 giây | Lướt tới mục tiêu trong 60 (tối đa 40): 160%, hút 30% sát thương |
| 2 | Quỷ Huyết Ấn | 16 / 16 giây | Hút huyết 20% trong 10 giây (mọi sát thương gây ra hồi thành sinh lực) |
| 3 | Quỷ Lực Gia Trì | 20 / 16 giây | Công +25%, chí mạng +10% trong 10 giây |
| 4 | Quỷ Ảnh Trùng Trùng | 40 / 20 giây | Tuyệt kỹ: cả đội tàng hình 5 giây, công +30% trong 5 giây; đánh, tung hồn kỹ hoặc tiên cơ thì hiện hình |

*Thiên Càn Bạch Ngọc Đỉnh* (phụ trợ, đánh boss: hồi máu, khiên, Dễ thương cho cả đội đánh; "xóa buff địch" từ BĐ4, "thanh tẩy đội" từ 3.5)

| Vòng | Hồn kỹ | Hồn lực / hồi | Hiệu ứng |
|---|---|---|---|
| 1 | Bạch Ngọc Hồi Xuân | 12 / 9 giây | Hồi 18% sinh lực cả đội |
| 2 | Bạch Ngọc Hộ Thuẫn | 16 / 14 giây | Khiên 15% sinh lực tối đa, sát thương nhận giảm 15% trong 6 giây |
| 3 | Thiên Càn Trấn Áp | 20 / 10 giây | Quanh thân 80: 120%, Dễ thương 6 giây, Câm lặng 2 giây; từ BĐ4 xóa hiệu ứng có lợi của hồn thú (Cuồng nộ) |
| 4 | Tịnh Thế Lưu Ly | 40 / 18 giây | Hồi 30% sinh lực cả đội, khiên 20% sinh lực tối đa 6 giây |

Số phần trăm hồi, khiên và hiệu ứng có lợi (Quỷ Mị, Thiên Càn Bạch Ngọc Đỉnh, Vô Địch Kim Thân) là ở sức mạnh ×1, nhân thêm `buffPower` theo số năm hồn hoàn (ví dụ 764 năm: hút huyết 20% thành 25%).

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
- Vòng 8–10 cùng giới hạn 100.000 năm nên không có hồn thú nào có cấp tương đương trên 80. Khi so cấp, **cấp võ hồn được tính tối đa 80** (đã chốt; `XP_LEVEL_CAP` trong `data.ts`), để võ hồn cấp 90–100 săn ở Hải Thần Đảo không bị giảm kinh nghiệm.
- Mỗi bản đồ săn nhắm vào khoảng cấp mà niên hạn hồn thú khớp với giới hạn **vòng kế tiếp** của người chơi. Ví dụ Ngoại vi (cấp 10–30) có hồn thú 300–2.000 năm: đủ cho vòng 2 (≤ 764) và vòng 3 (≤ 1.760); vùng sâu nhất vượt giới hạn một chút cho người muốn liều. Khoảng cấp của các bản đồ kế nhau chồng lên nhau khoảng 10 cấp.

**Giảm kinh nghiệm khi săn hồn thú quá yếu**

So cấp của võ hồn đang ra trận (tối đa 80) với cấp tương đương của hồn thú bị hạ:

| Hồn thú thấp hơn võ hồn | Dưới 10 cấp | Từ 10 cấp | Từ 20 cấp |
|---|---|---|---|
| Kinh nghiệm nhận | 100% | 50% | 10% |

- Giảm một lần trước khi chia cho đội 4 võ hồn (bước 2.3b) và cho tổ đội người chơi (mục 5.9).
- **Chỉ giảm kinh nghiệm.** Hồn hoàn và các đồ rơi khác vẫn rơi bình thường, để người chơi quay về bản đồ dễ săn đúng hồn hoàn hợp vòng mà không bị thiệt.
- Hồn thú mạnh hơn võ hồn không cho thêm kinh nghiệm.

**Cổng và chặn mềm**
- Cổng là một vùng chữ nhật trong file Tiled (object `portal`, mục 6) gồm: bản đồ đích, điểm xuất hiện ở bản đồ đích, cấp đề xuất.
- Bước vào cổng thì client hiện hộp "Đi tới *Nội địa* (đề xuất cấp 30–60)". Nếu cấp võ hồn đang ra trận thấp hơn cấp đề xuất tối thiểu, hộp có thêm **cảnh báo nguy hiểm** màu đỏ. **Chặn mềm:** không đủ cấp vẫn vào được nếu xác nhận.
- Server vẫn kiểm tra cổng: người chơi đang đứng trong vùng cổng, cổng thuộc bản đồ hiện tại, bản đồ đích có trong `MAPS`, không gục, không đang hấp thụ. Client chỉ gửi tên cổng, **không bao giờ tự chọn bản đồ** hay gửi tọa độ đích. Phòng cũ lưu xong rồi mới cho chuyển (thứ tự ở mục 6).
- Điểm xuất hiện (`arrive`) ở bản đồ đích phải nằm **ngoài mọi vùng `portal`** của bản đồ đó, để vừa tới nơi không bị hiện lại hộp đi cổng.
- Đi qua cổng mất 1 giây niệm (`TRAVEL_CAST`), bị đánh hoặc bước ra khỏi cổng thì hủy (chờ chốt; đã làm theo phương án này ở BĐ2). Quanh cổng, điểm xuất hiện và trại cổng không sinh hồn thú (`SPAWN_CLEAR`, mục 5.8) để niệm cổng không bị hồn thú lang thang phá. Đang niệm vẫn đánh và dùng hồn kỹ được, nhưng không bắt đầu hấp thụ được (hấp thụ dở cũng không đi cổng được).

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
- **Mảnh UR trước BĐ6:** rương tà hóa thú vương có tỉ lệ thấp rơi 1 mảnh UR (Hạo Thiên Chùy hoặc Cửu Bảo Lưu Ly Tháp; **5%**, đã chốt), để hai võ hồn UR không bị khóa hẳn cho tới Giai đoạn 8. Từ BĐ6, mảnh UR **chỉ** rơi từ boss thế giới và rương thú vương thôi rơi mảnh UR.

**Luật chung của hồn thú**
- Chỉ số hồn thú tăng theo số năm, không chỉ theo màu. Loài (bảng `BEASTS`) quyết định kiểu tấn công, chiêu và hệ số chỉ số.
- **Chiêu có báo trước:** hồn thú từ 1.000 năm trở lên có 1 chiêu đặc biệt, hiện vùng cảnh báo khoảng 0,8 giây (bảng ở trên). Tinh anh và boss: mục 5.4. Đã làm ở 3.5 (bảng `BEAST_SKILLS` trong `data.ts`, số liệu dưới đây **chờ chốt**):
  - Hồn thú có mục tiêu chờ 1,5–3 giây, rồi tung khi chiêu hết hồi và mục tiêu trong tầm (vòng quanh thân, vệt, nón: 80–90% kích thước; vòng dưới chân: tầm ném). Hồi chiêu ± 20% để bầy không tung cùng lúc. Báo trước thì đứng yên, không đánh thường; hướng vệt / nón và tâm vòng dưới chân **khóa lúc bắt đầu**; hết giờ tính trúng theo vị trí thật (người chơi là hình tròn bán kính 4 pixel). Kích thước theo tốc độ hồn sư (58 pixel/giây, khoảng 46 pixel trong 0,8 giây): vòng dưới chân ≤ 34, vòng quanh thân ≤ 56.
  - Sát thương = bội số × sát thương đòn thường của hồn thú (theo số năm) × (0,9–1,1). Chiêu "lao" thì tung xong hồn thú lao tới cuối vệt / tâm vòng.
  - Loài có nhiều chiêu chọn theo năm (Quỷ Đằng: Quật Roi từ 1.000 năm, Rễ Trói từ 1.500 năm cho Quỷ Đằng ngàn năm của Nội địa). Hồn thú thường dùng 1 chiêu; tinh anh (từ BĐ4) dùng 2 chiêu qua cùng bộ máy (`BData.skills`, bảng tinh anh bên dưới).
  - Chưa làm: vũng độc của Thất Tinh Độc Thiềm (thay bằng Trúng độc 3 tầng), kéo / đẩy người chơi.

  | Loài | Chiêu | Hình | Kích thước | Bội số | Hồi | Hiệu ứng |
  |---|---|---|---|---|---|---|
  | Phong Lang (chỉ hook / tinh anh) | Vồ | vệt, lao | dài 70, rộng 14 | 1,4 | 7 | |
  | Tử Văn Báo (chỉ hook / tinh anh) | Vồ Nhanh | vệt, lao, báo trước 0,7 | dài 80, rộng 12 | 1,5 | 7 | |
  | Mạn Đà La Xà | Phun Độc | vệt | dài 100, rộng 14 | 1,2 | 7 | Trúng độc 2 tầng 4 giây |
  | Quỷ Đằng | Quật Roi | nón | 52, góc 140° | 1,5 | 7 | |
  | Quỷ Đằng (từ 1.500 năm) | Rễ Trói | vòng dưới chân, tầm 120 | 30 | 1,1 | 7 | Trói 1,5 giây |
  | Lôi Văn Hầu | Gọi Sét | vòng dưới chân, tầm 130 | 30 | 1,3 | 7 | Cảm điện |
  | Quỷ Hổ | Vồ Lao | vệt, lao | dài 110, rộng 16 | 1,6 | 7 | |
  | Thanh Lân Ngạc | Táp Ngang | nón | 46, góc 110° | 1,7 | 7 | |
  | Kim Linh Ưng | Bổ Nhào | vòng dưới chân, lao, tầm 110 | 28 | 1,6 | 7 | |
  | Nhân Diện Ma Chu non | Giăng Tơ | vòng dưới chân, tầm 110 | 34 | 0,8 | 7 | Làm chậm 3 giây |
  | Liệt Trảo Hùng | Vỗ Đất | vòng quanh thân | 48 | 1,8 | 7 | |
  | Thiết Giáp Tê Ngưu | Xung Phong | vệt, lao | dài 150, rộng 18 | 1,8 | 9 | |
  | Nhân Diện Ma Chu | Phun Tơ | vệt | dài 110, rộng 14 | 0,9 | 7 | Trói 1,5 giây |
  | U Minh Lang | Ảnh Vồ | vệt, lao | dài 95, rộng 14 | 1,5 | 7 | |
  | Thất Tinh Độc Thiềm | Phun Độc | vòng dưới chân, tầm 120 | 34 | 1 | 7 | Trúng độc 3 tầng 5 giây |
  | Xích Lân Mãng | Quấn Siết | vòng quanh thân | 32 | 1,2 | 7 | Trói 1,5 giây |
  | Hắc Vụ Biên Bức | Âm Ba | nón | 64, góc 70° | 1 | 7 | Câm lặng 2 giây |
  | Lam Lôi Tê Ngưu | Lôi Xung | vệt, lao | dài 140, rộng 18 | 1,7 | 9 | Cảm điện |
  | Lôi Dực Ưng | Lôi Bạo | vòng dưới chân, tầm 130 | 34 | 1,6 | 7 | Cảm điện |
  | Ám Kim Khủng Trảo Hùng | Vỗ Đất | vòng quanh thân | 56 | 2 | 7 | Choáng 0,6 giây |
  | Kiếm Vĩ Hạt | Kiếm Vĩ Đâm | vệt | dài 85, rộng 12 | 1,6 | 7 | Phá giáp (Liệt thương) 2 tầng |
  | Quỷ Ảnh Báo | Ảnh Trảm | nón | 54, góc 90° | 1,8 | 7 | |
- **Chiêu tinh anh** (BĐ4, bảng `BOSSES` trong `data.ts`, số liệu **chờ chốt**): cùng bộ máy 3.5, bội số tính trên sát thương đòn thường đã x1,5; hồi chiêu 7 giây nếu không ghi. Thêm 3 kiểu chiêu: **nhiều vùng một lần tung** (`count`: vệt / nón tỏa quạt trong góc `spread`, vòng dưới chân thành hàng theo hướng tinh anh → mục tiêu cách nhau `step`; trúng vùng nào cũng chỉ tính một lần), **gọi bầy** (`summon`: thêm hồn thú loài thường của vùng quanh thân tới khi đủ n con do tinh anh gọi còn sống; chúng thuộc vùng, tuổi trong `years` của vùng, lao ngay vào mục tiêu), **kéo người** (`pull`: người trúng bị kéo về phía tinh anh, dừng khi vướng, sát tinh anh hoặc sắp vào vùng an toàn).

  | Tinh anh (loài gốc) | Chiêu 1 | Chiêu 2 |
  |---|---|---|
  | Bạch Nhung Thỏ Vương (Nhu Cốt Thỏ hoang) | Đạp Đất: vòng quanh thân 36, 1,4 | Phóng Nhảy: vệt 60, lao, 1,5 |
  | Ngân Bối Phong Lang Đầu Lĩnh (Phong Lang con) | Hú Bầy: vòng quanh thân 40, 0,8, gọi 2 Phong Lang con, hồi 12 | Vồ: vệt 70, lao, 1,5 |
  | Thiết Nha Dã Trư Vương (Hắc Bối Dã Trư) | Húc Lao: vệt 120 rộng 18, lao, 1,7, hồi 9 | Dậm Đất: vòng quanh thân 48, 1,6 |
  | Huyết Nhãn Phong Lang (Phong Lang) | Hú Bầy: vòng 40, 0,8, gọi 3 Phong Lang, hồi 12 | Xé Toạc: nón 54 góc 110°, 1,7 |
  | Huyết Gai Quỷ Đằng (Quỷ Đằng) | Gai Trồi: 3 vòng 24 dưới chân thành hàng cách 44, tầm 130, 1,5 | Quấn Kéo: vệt 110, 1, kéo 60 |
  | Hắc Sát Quỷ Hổ (Quỷ Hổ) | Tam Liên Vồ: 3 vệt 100 tỏa 40°, lao theo vệt giữa, 1,6 | Hổ Khiếu: vòng quanh thân 56, 1,2, Choáng 1 giây |
  | Ảnh Trảo Linh Miêu (mượn Tử Văn Báo) | Ảnh Tập: vệt 130 tầm 90 (lướt xuyên ra sau lưng mục tiêu), báo trước 0,7, 1,7 | Liên Hoàn Trảo: nón 50 góc 100°, 2,1 (3 nhát gộp) |
  | U Minh Lang Vương (U Minh Lang) | Hú Bầy: vòng 44, 0,8, gọi 3 U Minh Lang, hồi 12 | Ảnh Tập: vòng 30 dưới chân mục tiêu, tầm 130, lao tới tâm vòng, 1,8 |
  | Kim Bối Thất Tinh Thiềm (Thất Tinh Độc Thiềm) | Nổ Túi Độc: vòng quanh thân 56, 1,2, Trúng độc 3 tầng 6 giây (thay vũng độc) | Lưỡi Quất: vệt 110, 1,1, kéo 60 |
  | Lam Điện Lôi Tích (mượn Lam Lôi Tê Ngưu) | Lôi Trụ: 3 vòng 26 thành hàng cách 46, tầm 140, 1,6, Cảm điện | Lôi Quang Xung: vệt 170 rộng 18, lao, 1,8, Cảm điện, hồi 9 |
  | Huyết Văn Khủng Trảo Hùng (Ám Kim Khủng Trảo Hùng) | Ám Kim Liệt Địa: 3 vệt 110 tỏa 50°, 1,8 | Cuồng Bạo Vỗ: vòng quanh thân 56, 2,6, Choáng 0,6 giây (2 lần gộp) |

  Khác thiết kế (chờ chốt): chiêu nhiều nhát nối tiếp (Tam Liên Vồ, Lôi Trụ "nổ lần lượt", Liên Hoàn Trảo, Cuồng Bạo Vỗ "2 lần liền") làm bản tối thiểu: các vùng tung cùng lúc hoặc gộp bội số; vũng độc thay bằng Trúng độc; "biến mất" của Ảnh Tập chỉ là lao tới. Linh Miêu và Lôi Tích chưa có loài thường nên mượn chỉ số và sprite của Tử Văn Báo, Lam Lôi Tê Ngưu.
- **Mỗi bản đồ (mỗi kênh) có tối đa 1 hồn thú thường 100.000 năm cùng lúc**; chỉ vùng Hải Thần Uyên sinh được. Thú vương và boss thế giới không tính vào luật này.
- **Rơi đồ dựa vào farm:** mỗi lần hạ hồn thú, mỗi loại đồ được tung tỉ lệ riêng (mỗi loại một bảng trong `data.ts`: `SHARD_DROP` cho mảnh võ hồn, `BONE_DROP` cho hồn cốt, `CORE_DROP` cho hồn hạch từ 5.1). Hồn thú năm càng cao thì tỉ lệ rơi đồ tốt càng cao. Tinh anh và boss có thêm hệ số ở mục 5.4.

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
- **Có ít nhất 1 hiệu ứng có lợi** để "xóa buff địch" (Thiên Càn Bạch Ngọc Đỉnh) có việc: **Cuồng nộ** (chờ chốt): máu dưới 50% thì nổi 10 giây, sát thương +30%, tốc độ +25%; hết giờ hoặc bị xóa thì 20 giây sau mới nổi lại (nếu máu vẫn dưới mức).
- **Đã làm ở BĐ4:** bảng `BOSSES` (11 tinh anh của Thánh Hồn Thôn, Ngoại vi, Nội địa; chiêu ở bảng 5.3), hằng số `ELITE` (máu 2,5, sát thương 1,5, kinh nghiệm 2,5, hồn cốt 3, hồi sinh 480–720 giây, phóng 1,25, bán kính 250, loại sau 30 giây, giảm 1 người mỗi 10 giây, bỏ giao chiến sau 15 giây), `BOSS_HP_PER_PLAYER` / `bossHpMult`, `ELITE_RAGE`, hiệu ứng có lợi của hồn thú `BEAST_BUFFS` (`BeastState.buff`). Object `elite` trong cả 3 file Tiled (mỗi vùng theo tên 1 chữ nhật, xa trại cổng / cổng / điểm xuất hiện; vùng Đồng lúa ven làng gồm 2 chữ nhật cùng tên chỉ có 1 tinh anh). Tinh anh sinh ở điểm ngẫu nhiên trong chữ nhật (không trong vùng an toàn, không trong `SPAWN_CLEAR`, không sát người chơi), không tính vào `count` của vùng; hồn thú gọi bầy thì có tính. Hồn hoàn ưu tiên người đóng góp (sát thương) nhiều nhất còn trong phòng, không thì người hạ; kinh nghiệm x2,5 chỉ cho người hạ (chia cho tổ đội khi có 5.9). Tinh anh đang giao chiến không tự hồi máu. Hồn cốt (sau khi merge 4.1): tỉ lệ `boneChance(năm, ELITE.bone)` (x3, tối đa 100%), hồn cốt mang loài gốc trong `BEASTS` (Ảnh Trảo Linh Miêu, Lam Điện Lôi Tích mượn loài nên rơi hồn cốt Tử Văn Báo, Lam Lôi Tê Ngưu), quyền ưu tiên như hồn hoàn. Hồn hạch (5.1): tinh anh chắc chắn rơi 1 hồn hạch, sao theo niên hạn (bảng rơi 5.3), bộ theo bản đồ, quyền ưu tiên như hồn hoàn.

**Tà hóa thú vương (boss bản đồ)**
- Mỗi bản đồ săn trừ Thánh Hồn Thôn có 1 thú vương riêng (bảng 5.3), xuất hiện trong hang ở vùng sâu nhất (object `boss`). Niên hạn bằng mức trên của bản đồ (Hải Thần Đảo: 95.000 năm). Máu x6–8 tùy bản đồ.
- **Theo lịch**, ví dụ 20:00 và 22:00 giờ Việt Nam. **Báo toàn server trước 5 phút** và lúc xuất hiện. Mỗi kênh đang mở của bản đồ đó có thú vương riêng. Không ai hạ trong 15 phút thì thú vương rút đi.
- **2–3 chiêu** có vùng cảnh báo dài hơn hồn thú thường (1–1,5 giây). **Còn 50% máu thì đổi sang giai đoạn 2:** gầm lên, đứng yên 2 giây (không nhận khống chế), rồi dùng chiêu giai đoạn 2 và nhanh hơn.
- **Chia thưởng theo đóng góp.** Đóng góp = sát thương lên thú vương (đề xuất: tính cả hồi máu và khiên cho người tham gia khác, để phụ trợ không bị thiệt).
  - Người đóng góp nhiều nhất được ưu tiên hồn hoàn (15 giây đầu).
  - Mọi người tham gia **đóng góp từ 3%** (đã chốt: ngưỡng cố định 3%, không hạ theo số người) và còn trong phòng lúc thú vương bị hạ đều nhận **rương** vào túi đồ: hồn cốt, hồn hạch sao cao, mảnh võ hồn (bảng "Rơi đặc trưng" ở 5.3).
- **Tối đa 3 lần/ngày** mỗi tài khoản, tính chung mọi bản đồ, đặt lại lúc 00:00 giờ Việt Nam (`Asia/Ho_Chi_Minh`, cùng múi giờ với lịch boss). Lượt boss thế giới cũng đặt lại cùng mốc. Hết lượt vẫn được đánh và nhận kinh nghiệm, nhưng không nhận rương; vào giao chiến thì hiện nhắc "Hôm nay đã hết lượt nhận thưởng thú vương".

**Máu tăng theo số người tham gia** (tinh anh, thú vương, boss thế giới)

> Máu tối đa = máu gốc × hệ số bậc × (1 + 0,6 × (N − 1)), với N là số người tham gia.

| N | 1 | 2 | 4 | 10 | 20 |
|---|---|---|---|---|---|
| Hệ số máu | x1 | x1,6 | x2,8 | x6,4 | x12,4 |

- **Người tham gia** là hồn sư đang ở trong phòng và thỏa một trong hai điều kiện:
  1. Đứng trong **bán kính giao chiến** lúc boss bắt đầu giao chiến (lần đầu bị đánh). Bán kính: tinh anh 250 px, thú vương là vùng `boss` (hang), boss thế giới là cả sàn đấu.
  2. Sau đó **gây sát thương** lên boss (hoặc hồi máu, tạo khiên cho một người tham gia khác; phần hồi máu / khiên chưa tính ở BĐ4 vì hồi máu và khiên hiện chỉ cho đội võ hồn của chính hồn sư).
- Người tham gia đang gục vẫn được tính.
- **Người vào giữa trận:** thành người tham gia thì N tăng ngay; máu tối đa tính lại theo N mới và **máu hiện tại giữ nguyên tỉ lệ phần trăm** (boss đang 40% máu thì vẫn 40% của mức mới). Vì vậy vào phút cuối không làm boss dễ hơn mà còn làm trâu hơn.
- **Người rời giữa trận:** rời phòng, mất kết nối, hoặc ở ngoài bán kính giao chiến 30 giây liên tục thì bị loại khỏi danh sách. N giảm, máu cũng giữ nguyên tỉ lệ phần trăm. Mỗi 10 giây N giảm tối đa 1, để máu không nhảy liên tục khi có người ra vào mép bán kính.
- Người bị loại vẫn giữ đóng góp đã gây; muốn nhận thưởng thì phải còn trong phòng lúc boss bị hạ. Hệ số đã giảm không bao giờ làm boss hồi máu.
- **Bỏ giao chiến:** 15 giây không còn người tham gia nào trong bán kính thì boss về chỗ, hồi đầy máu, xóa danh sách và đóng góp.

**Boss thế giới 100.000 năm** (BĐ6)
- Ở **Lõi Tinh Đấu**: **Thái Thản Cự Viên** và **Thiên Thanh Ngưu Mãng**, luân phiên theo ngày. Xuất hiện **1 lần/ngày lúc 21:00** giờ Việt Nam (đã chốt; không trùng lịch thú vương 20:00 và 22:00), báo toàn server trước 5 phút.
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
- **Gắn** (bước 4.2): mỗi vị trí một hồn cốt, đúng vị trí của nó; ô đã có thì đổi chỗ (món cũ về túi), tháo khi túi đầy thì từ chối. Chỉ ngoài giao chiến, không gục, không hấp thụ (như xếp đội hình). Hồn cốt đang gắn không chiếm ô túi và không bỏ được; một hồn cốt đang gắn trên võ hồn A muốn chuyển sang võ hồn B thì tháo ra trước. Chỉ số gốc (bảng dưới) cộng phẳng vào sinh lực / hồn lực / công của võ hồn đó (`boneBonus` → tham số `bones` của `calcStats`), không nhân hệ số hệ hay sao.
- **Rơi** (bước 4.1): theo bảng rơi ở 5.3; vị trí ngẫu nhiên đều trong 6 vị trí (5.3 không ghi vị trí theo loài). Mỗi hồn cốt là một món riêng (không gộp), lưu một dòng `items`: `kind` = `code` = `hon_cot`, `years` = số năm, `stats` = `{beast, slot}` (mã loài trong `BEASTS`, mã vị trí), `enhance` = cấp cường hóa, `vohon_id` = võ hồn đang gắn (NULL = trong túi).
- **Chỉ số gốc (chờ chốt)**, tính lại từ số năm khi cần (không lưu DB, đổi công thức thì mọi hồn cốt đã có đổi theo), bằng hệ số × mức cộng của hồn hoàn cùng số năm (nội suy theo số năm như chỉ số hồn thú):

| Vị trí | Kỹ năng (4.3) | Chỉ số chính | Hệ số | 1.000 năm | 32.000 năm | 100.000 năm |
|---|---|---|---|---|---|---|
| Đầu | Chủ động | Hồn lực | 0,3 × mức sinh lực hồn hoàn | +24 | +118 | +210 |
| Thân | Bị động | Sinh lực | 0,8 × mức sinh lực hồn hoàn | +64 | +316 | +560 |
| Tay trái, tay phải | Chủ động | Công | 0,6 × mức công hồn hoàn | +7 | +30 | +51 |
| Chân trái, chân phải | Bị động | Sinh lực | 0,5 × mức sinh lực hồn hoàn | +40 | +197 | +350 |

- **Kỹ năng** (bước 4.3, **chờ chốt**, `BONE_SKILLS` trong `data.ts`): theo **loài** hồn thú gốc, mỗi loài trong `BEASTS` (30 loài) có đúng 1 kỹ năng chủ động (dùng chung cho đầu, tay trái, tay phải) và 1 bị động (dùng chung cho thân, chân trái, chân phải). Cách chọn: chủ động lấy từ chiêu báo trước của chính loài đó (bảng 5.3: Mạn Đà La Xà phun độc, Ám Kim Khủng Trảo Hùng vỗ đất…), loài dưới 1.000 năm ở Thánh Hồn Thôn (chưa rơi hồn cốt, chỉ có qua rương / hook) đặt theo con vật; bị động theo đặc tính con vật (giáp dày giảm sát thương, thú nhanh tăng tốc, loài độc kháng Trúng độc, loài sét kháng Cảm điện…).
  - **Chủ động** chạy bằng cùng bộ máy với hồn kỹ (`SkillDef`, `runSkill`): sức mạnh × `skillPower(số năm hồn cốt)` (1.000 năm ×1,9; 32.000 năm ×3,66; 100.000 năm ×4,5), hiệu ứng lên bản thân × `buffPower`. Mặc định tốn 18 hồn lực, hồi 10 giây. Gắn hai, ba hồn cốt chủ động cùng loài thì mỗi nút một lần tung, hồi chiêu riêng.
  - **Bị động**: mức trong bảng × `buffPower(số năm)` (1.000 năm ×1,27; 32.000 năm ×1,8; 100.000 năm ×2,05), cộng thẳng vào hiệu ứng có lợi cùng tên của hồn sư (không hiện hào quang); nhiều hồn cốt cộng dồn, trần `BONE_PASSIVE_CAP`: công / tốc chạy 25%, giảm sát thương nhận 30%, chí mạng 15%, giảm tiêu hao 30%, hút máu 12%, kháng trạng thái 80%.
  - Phím **Z / X / C (chờ chốt**, phương án khác: H / K / L gần J): Z đầu, X tay trái, C tay phải. Trên điện thoại 3 nút nhỏ xếp dọc bên trái hai hàng hồn kỹ.

| Loài | Chủ động (đầu, hai tay); mức ở bảng là gốc | Bị động (thân, hai chân); mức gốc × buffPower |
|---|---|---|
| Phong Lang | **Phong Lang Vồ**: Lao tới trước, cắn xé hồn thú trên đường (18 hồn lực, 10 giây) | **Phong Bộ**: Tốc chạy +6% |
| Mạn Đà La Xà | **Mạn Đà La Phun Độc**: Phun độc vào hồn thú gần nhất: Trúng độc 2 tầng (18 hồn lực, 10 giây) | **Xà Huyết**: Kháng Trúng độc: thời gian −30% |
| Tử Văn Báo | **Tử Văn Vồ Nhanh**: Lướt chớp nhoáng, +20% chí mạng (18 hồn lực, 8 giây) | **Báo Nhãn**: Chí mạng +4% |
| Quỷ Đằng | **Quỷ Đằng Rễ Trói**: Rễ cây trồi lên dưới hồn thú gần nhất: Trói 1,5 giây (18 hồn lực, 10 giây) | **Hút Nhựa**: Hút máu +3% |
| Lôi Văn Hầu | **Lôi Văn Gọi Sét**: Gọi sét xuống hồn thú gần nhất: Cảm điện (18 hồn lực, 10 giây) | **Lôi Văn Bì**: Kháng Cảm điện: thời gian −35% |
| Quỷ Hổ | **Quỷ Hổ Vồ Lao**: Vồ lao một đoạn dài, xé toạc hồn thú trên đường (18 hồn lực, 11 giây) | **Hổ Uy**: Công +5% |
| Nhân Diện Ma Chu | **Ma Chu Phun Tơ**: Phun tơ vào hồn thú gần nhất: Trói 1,5 giây, Làm chậm (18 hồn lực, 10 giây) | **Ma Chu Túc**: Kháng Trói: thời gian −35% |
| U Minh Lang | **U Minh Ảnh Vồ**: Hóa bóng lao tới, +15% chí mạng (18 hồn lực, 10 giây) | **Ảnh Bộ**: Tốc chạy +5% |
| Ám Kim Khủng Trảo Hùng | **Ám Kim Vỗ Đất**: Vỗ đất quanh thân: choáng 0,8 giây (22 hồn lực, 12 giây) | **Ám Kim Bì**: Giảm sát thương nhận 6% |
| Kiếm Vĩ Hạt | **Kiếm Vĩ Đâm**: Đuôi kiếm đâm hồn thú gần nhất: Phá giáp 2 tầng (18 hồn lực, 10 giây) | **Hạt Giáp**: Chí mạng +5% |
| Quỷ Ảnh Báo | **Quỷ Ảnh Trảm**: Chém nửa trước mặt, +15% chí mạng (18 hồn lực, 10 giây) | **Quỷ Ảnh**: Tốc chạy +6% |
| Xích Lân Mãng | **Xích Lân Quấn Siết**: Quấn siết quanh thân: Trói 1,5 giây (18 hồn lực, 10 giây) | **Xích Lân Giáp**: Kháng Choáng: thời gian −30% |
| Nhu Cốt Thỏ hoang | **Thỏ Nhảy**: Bật nhảy tới trước, bất tử thoáng chốc (12 hồn lực, 8 giây) | **Thỏ Túc**: Tốc chạy +5% |
| Điền Thử | **Điền Thử Gặm**: Gặm hồn thú gần nhất: Phá giáp 1 tầng (12 hồn lực, 10 giây) | **Tích Trữ**: Giảm tiêu hao hồn lực 5% |
| Hôi Vũ Tước | **Vũ Tiễn**: Bắn 3 mũi lông vũ tỏa quạt (14 hồn lực, 10 giây) | **Khinh Vũ**: Tốc chạy +4% |
| Phong Lang con | **Lang Nha**: Cắn hồn thú gần nhất (12 hồn lực, 10 giây) | **Lang Tính**: Chí mạng +3% |
| Độc Châm Phong | **Độc Châm**: Bắn kim độc: Trúng độc 2 tầng (14 hồn lực, 10 giây) | **Phong Độc**: Kháng Trúng độc: thời gian −30% |
| Thiết Giáp Xuyên Sơn Giáp | **Cuộn Giáp**: Cuộn tròn: khiên 15% sinh lực 5 giây, hất văng hồn thú sát thân (18 hồn lực, 10 giây) | **Thiết Giáp**: Giảm sát thương nhận 5% |
| Hắc Bối Dã Trư | **Dã Trư Húc**: Húc tới trước, đẩy lùi hồn thú (18 hồn lực, 10 giây) | **Dã Tính**: Công +4% |
| Thanh Lân Xà | **Thanh Lân Cắn Độc**: Cắn hồn thú gần nhất: Trúng độc (12 hồn lực, 10 giây) | **Thanh Lân**: Kháng Trúng độc: thời gian −25% |
| Quỷ Đằng non | **Roi Mây**: Quất nửa trước mặt: Làm chậm (12 hồn lực, 10 giây) | **Nhựa Non**: Hút máu +2% |
| Thanh Lân Ngạc | **Thanh Lân Táp Ngang**: Táp ngang nửa trước mặt (18 hồn lực, 10 giây) | **Ngạc Giáp**: Giảm sát thương nhận 5% |
| Kim Linh Ưng | **Kim Linh Bổ Nhào**: Bổ nhào xuống hồn thú gần nhất (18 hồn lực, 10 giây) | **Ưng Nhãn**: Chí mạng +4% |
| Nhân Diện Ma Chu non | **Giăng Tơ**: Giăng lưới quanh hồn thú gần nhất: Làm chậm 3 giây (14 hồn lực, 10 giây) | **Tơ Nhện**: Kháng Làm chậm: thời gian −35% |
| Liệt Trảo Hùng | **Liệt Trảo Vỗ Đất**: Vỗ đất quanh thân (18 hồn lực, 10 giây) | **Hùng Lực**: Công +5% |
| Thiết Giáp Tê Ngưu | **Tê Ngưu Xung Phong**: Xung phong một đoạn dài, đẩy lùi hồn thú (18 hồn lực, 12 giây) | **Tê Giáp**: Giảm sát thương nhận 7% |
| Thất Tinh Độc Thiềm | **Thất Tinh Phun Độc**: Phun độc trùm hồn thú gần nhất: Trúng độc 3 tầng (18 hồn lực, 10 giây) | **Độc Thể**: Kháng Trúng độc: thời gian −40% |
| Hắc Vụ Biên Bức | **Âm Ba**: Sóng âm nửa trước mặt: Câm lặng 2 giây (18 hồn lực, 10 giây) | **Hút Huyết**: Hút máu +4% |
| Lam Lôi Tê Ngưu | **Lam Lôi Xung**: Mang sét xung phong: Cảm điện (18 hồn lực, 12 giây) | **Lam Lôi Giáp**: Kháng Cảm điện: thời gian −40% |
| Lôi Dực Ưng | **Lôi Bạo**: Sét nổ trên hồn thú gần nhất: Cảm điện (18 hồn lực, 10 giây) | **Lôi Dực**: Tốc chạy +6% |

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
- **Rơi** (bước 5.1): theo bảng rơi ở 5.3 (sao theo niên hạn) và bảng "Rơi đặc trưng" (bộ theo bản đồ). Mỗi hồn hạch là một món riêng (không gộp), lưu một dòng `items`: `kind` = `code` = `hon_hach`, `stars` = sao, `enhance` = cấp nâng cấp, `stats` = `{set, main, subs: [[mã chỉ số, giá trị], …]}`, `years` = NULL, `vohon_id` = võ hồn đang gắn (5.2). Chỉ số chính không lưu, tính lại từ sao (và cấp nâng cấp ở 5.3); dòng phụ tung lúc rơi nên lưu giá trị.
- **Số liệu bản đầu (chờ chốt, `shared/data.ts`):** sao trong khoảng tung theo trọng số 4 : 2 : 1 từ sao thấp (`CORE_STAR_W`); 80% thuộc bộ đặc trưng của bản đồ (`CORE_MAP_SET`), còn lại bộ bất kỳ; số dòng phụ 1★…6★ = 0 / 1 / 1 / 2 / 3 / 4 (`CORE_SUBS`); hệ số theo sao 1★…6★ = 0,15 / 0,25 / 0,4 / 0,55 / 0,75 / 1 (`CORE_STAR_K`); chỉ số chính theo trọng số (chí mạng, sát thương chí mạng một nửa), dòng phụ đều, không trùng nhau và không trùng chỉ số chính, mỗi dòng 70–100% mức tối đa của sao (`CORE_SUB_ROLL`).

| Chỉ số (`CORE_STATS`) | Chỉ số chính 1★ / 4★ / 6★ | Dòng phụ tối đa ở 6★ |
|---|---|---|
| Sinh lực | +45 / +165 / +300 | +90 |
| Công | +5 / +17 / +30 | +9 |
| Hồn lực | +18 / +66 / +120 | +36 |
| Sinh lực %, Công %, Hồn lực % | +1,8% / +6,6% / +12% | +4% |
| Tỉ lệ chí mạng | +1,2% / +4,4% / +8% | +3% |
| Sát thương chí mạng | +2,4% / +8,8% / +16% | +5% |

### 5.7 Túi đồ, vật phẩm và tiền
- **Túi đồ** chứa hồn hoàn, hồn cốt, hồn hạch, mảnh võ hồn và vật phẩm. Vật phẩm cùng loại thì gộp. Có giới hạn số ô và có thể mở rộng.
- **Hồn Tệ** (đồng / ngân / kim): lưu trong DB là một số nguyên (đồng), chỉ quy đổi khi hiển thị. Rơi từ hồn thú, nhận khi bán đồ.
- **Vật phẩm cơ bản:** Hồi Huyết Đan, Hồi Hồn Đan (có thời gian hồi chung); tiên thảo (rơi hiếm, tăng vĩnh viễn một chút chỉ số cho một võ hồn).
- Chưa cho giao dịch giữa người chơi (chờ chốt).
- **Số liệu bản đầu (bước 3.1, chờ chốt; nằm trong `shared/data.ts`):** túi 40 ô (`BAG_SLOTS`), đan gộp tối đa 99 món một ô. Hồi Huyết Đan hồi 30% sinh lực tối đa của võ hồn ra trận, Hồi Hồn Đan hồi 30% hồn lực tối đa, hồi chiêu chung 15 giây (`DAN_CD`); đã đầy thì không cho dùng (không phí đan). Quy đổi 1 ngân = 100 đồng, 1 kim = 100 ngân. Hồn thú rơi Hồn Tệ theo bậc (`BEAST_COIN`): 1–3 / 4–10 / 15–40 / 60–150 / 300–800 đồng, người hạ nhận thẳng. Quà khởi đầu 5 Hồi Huyết Đan + 5 Hồi Hồn Đan (`STARTER_ITEMS`), mỗi tài khoản một lần (cả tài khoản cũ).

### 5.8 Địa điểm và NPC
Thành (bản đồ `town`) và khu làng của Thánh Hồn Thôn (vùng `safe` trong một bản đồ săn) là nơi an toàn: không có hồn thú, không giao chiến, hồi máu và hồn lực nhanh (hồi nhanh chưa làm ở BĐ2; hiện hồi như ngoài giao chiến). Mỗi bản đồ săn có **trại nhỏ ở cổng vào** (object `spawn`) làm điểm hồi sinh khi gục trên bản đồ đó (doanh trại hiện tại trở thành trại cổng của Tinh Đấu).

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
- **Trại cổng của bản đồ săn:** điểm hồi sinh, chưa có NPC (về sau có thể thêm thương nhân lưu động). Trại cổng **không phải vùng an toàn** (vẫn giao chiến được, người chơi kéo hồn thú về thì nó vẫn đuổi theo), nhưng trong khoảng `SPAWN_CLEAR` = 160 pixel mỗi phía quanh trại, quanh mọi cổng và mọi điểm `arrive` **không sinh hồn thú** (phải ≥ lang thang 60 + tầm phát hiện 70 = 130, `BEAST_WANDER` / `BEAST_AGGRO_R`), nên hồn thú tự lang thang không tới đánh người vừa tới nơi, vừa hồi sinh hay đang niệm cổng. Luật `GATE_CLEAR` của BĐ3 (160 pixel quanh cổng và `arrive`) đã gộp vào đây (`map.nearGate`). Trước đây hồn thú vàng chủ động của Bìa rừng sinh sát mép doanh trại Tinh Đấu, lang thang vào giữa trại và đánh hủy niệm cổng "Về Nặc Đinh Thành".

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
Sprite chưa có ảnh thật được vẽ bằng code trong `client/src/textures.ts` (`honsuArt.ts`). Mục này là quy cách để thay dần bằng ảnh thật (tạo bằng PixelLab qua dây chuyền `tools/assets`, chỉnh tay bằng Aseprite khi cần) mà không phải sửa luật chơi.

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
- **4 hướng: xuống, phải, lên, trái.** Chỉ vẽ 3 hướng (xuống, phải, lên). Hướng trái lấy bằng cách lật ngang hướng phải trong client, áp cho mọi lớp cùng lúc. Server đồng bộ hướng nhìn 4 phía qua `PlayerState.dir` (0 xuống, 1 phải, 2 lên, 3 trái; `DIRS4` / `dir4()` trong `data.ts`, từ bước 2.2b, thay `face` = ±1 của người chơi).
- **Ghép theo lớp.** Mỗi lớp là một spritesheet riêng có **cùng bố cục khung**. Thứ tự vẽ từ sau ra trước:

| Thứ tự | Lớp | Nguồn | Ghi chú |
|---|---|---|---|
| 1 | Bóng | Code | Elip mờ dưới chân |
| 2 | Vòng hồn hoàn, nửa sau | Code (hoặc ảnh `halo`) | Phần elip nằm sau thân |
| 3 | Phụ thể võ hồn, nửa sau | `vh_{id}_b` | Cánh, đuôi, chân nhện, hư ảnh sau lưng, vũ khí khi bị thân che |
| 4 | Thân | `hs_body_{m/f}_{0–3}` | Da, mặt, quần hoặc váy lót, giày |
| 5 | Áo | `hs_outfit_{m/f}_{0–3}` | Đổi màu bằng hoán màu (xem dưới) |
| 6 | Tóc | `hs_hair_{m/f}_{0–3}` | Đổi màu bằng hoán màu |
| 7 | Phụ thể võ hồn, nửa trước | `vh_{id}_f` | Vũ khí trên tay, tai thú, dây leo trước người, hào quang phía trước |
| 8 | Vòng hồn hoàn, nửa trước | Code (hoặc ảnh `halo`) | Phần elip nằm trước thân |
| 9 | Hiệu ứng | Code (`fx` từ server) | Vệt chém, sóng, chữ sát thương |

- **Ghép lớp theo bộ giới × kiểu tóc (đã chốt, mục 8 câu 9 phương án (b)).** Mỗi tổ hợp giới × kiểu tóc (2 × 4 = 8 bộ) vẽ **liền** thân + áo + tóc trong cùng một hình, rồi `tools/assets` tách tự động thành 3 lớp thân / áo / tóc từ chính hình đó, nên 3 lớp luôn khớp nét và không lộ lỗ ở chỗ tóc che (đỉnh đầu, trán, gáy). Không dùng chung một lớp thân cho nhiều kiểu tóc.
  - **Quy ước key:** `hs_{lớp}_{giới}_{kiểu tóc}`, lớp là `body` / `outfit` / `hair`, giới là `m` / `f`, kiểu tóc là chỉ số `hair` (0–3, bảng "Tùy biến" ở dưới). Ví dụ bộ nữ kiểu tóc 2: `hs_body_f_2`, `hs_outfit_f_2`, `hs_hair_f_2`; file `honsu/body_f_2.png`, `honsu/outfit_f_2.png`, `honsu/hair_f_2.png`. Client lấy key bằng `honsuKey(lớp, giới, kiểu tóc)` (`client/src/sprites.ts`).
  - **Mỗi bộ đủ 3 lớp hoặc không có lớp nào** trong `manifest.json` (`validate.mjs` báo lỗi bộ thiếu lớp). Bộ chưa có ảnh thật thì client vẽ cả 3 lớp bằng code (`honsuArt.ts`, thân và áo vẽ bằng code dùng chung cho mọi kiểu tóc); không trộn lớp ảnh thật với lớp vẽ bằng code trong một bộ.
  - Tóc và áo vẫn vẽ bằng dải 4 xám để hoán màu (dưới). **Phụ thể võ hồn vẫn là lớp riêng**, không vẽ liền với hồn sư.
  - Kiểu áo khác về sau (đồng phục Sử Lai Khắc…) sẽ cần thêm chỉ số kiểu áo vào key; chưa làm.
- **Phụ thể tách hai nửa (sau thân và trước thân) cho từng khung.** Người vẽ tự quyết pixel nào nằm sau, pixel nào nằm trước theo từng hướng: quay lưng (hướng lên) thì cánh nằm ở nửa trước, vũ khí nằm ở nửa sau. Nhờ vậy client không cần đổi thứ tự lớp theo hướng.
- **Khung phụ thể 48×48**, là khung thân mở rộng 8 pixel mỗi phía, gốc tại (24, 38). Cánh, búa lớn và dây leo dưới đất được phép tràn ra ngoài khung 32×32.
- **Hoán màu (palette swap):** tóc và áo vẽ bằng **dải 4 xám chuẩn** `#3a3a3a`, `#6a6a6a`, `#9a9a9a`, `#cacaca` (tối → sáng). Lúc tải, client tạo bản đã tô màu cho từng tổ hợp đang dùng bằng cách thay đúng 4 màu này bằng dải màu chọn. Không dùng `setTint` vì phép nhân màu làm mất sắc độ.
  - **Viền ngoài `#1a1020` giữ nguyên khi hoán màu (đã chốt).** Trong lớp tóc và áo, `#1a1020` là **màu thứ 5 được phép** (ngoài 4 xám) và không bị hoán; chỉ viền trong (xám tối nhất `#3a3a3a`) đổi theo màu chọn. `validate.mjs` chỉ nhận 4 xám + `#1a1020` trong lớp tóc/áo.
  - Key của texture đã hoán màu là **key gốc + `@` + chỉ số màu**: `hs_hair_f_2@3` là tóc của bộ nữ kiểu tóc 2 tô màu tóc số 3, `hs_outfit_m_2@5` là áo của bộ nam kiểu tóc 2 tô màu áo số 5. Chỉ tạo khi có người chơi đang dùng tổ hợp đó.

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
  Từ bước 2.2a: `SEXES`, `HAIR_STYLES`, `HAIR_COLORS`, `OUTFIT_COLORS` (mỗi màu là dải 4 sắc tối → sáng thay cho dải xám chuẩn khi hoán màu, mọi sắc lấy từ `art/palette.gpl`), kiểm tra bằng `parseLooks()`. Thêm màu mới vào cuối mảng.

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
  - Key animation có **tiền tố là key của sheet**: `{sheet}:{animation}_{hướng}`, ví dụ `hs_body_f_0:idle_down`, `hs_body_m_2:walk_right`, `hs_body_f_1:absorb_down`. Hướng là `down`, `right`, `up`; hướng trái dùng animation `_right` và lật ngang. Nhờ tiền tố, các sheet không va chạm nhau trong AnimationManager toàn cục của Phaser.
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
- Bản đầu vẽ vòng bằng code: từ bước 2.2b client tự tạo `halo{tier}` (khung 24×10, khung 0 cung trên, khung 1 cung dưới) và `halo{tier}_lit` (28×12, vòng đang sáng). Nếu sau này vẽ tay thì thay `halo{tier}` bằng ảnh cùng quy cách.

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

- Animation: `idle` 2 khung, `walk` 4, `attack` 3 (khung đầu là tư thế báo trước, giữ lâu để khớp vùng cảnh báo 0,8 giây ở mục 5.3; từ 3.5 client giữ khung này khi `BeastState.cast` bật rồi chạy 2 khung ra đòn lúc tung), `hurt` 1, `die` 3. Spritesheet một hàng theo đúng thứ tự đó, 13 khung. Key animation cũng có tiền tố sheet, ví dụ `beast_phong_lang:walk`.
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
  src/pixellab/{bộ}/         ảnh thô PixelLab, đầu vào của tools/assets ({hướng}_{animation}_{i}.png)
  honsu/ vohon/ beast/ ui/   file .aseprite (khi chỉnh tay)
shared/assets/sprites/
  manifest.json              danh sách key đã có ảnh thật
  honsu/body_m_2.png         hs_body_m_2   (bộ nam × kiểu tóc 2: 3 lớp tách từ cùng một hình)
  honsu/outfit_m_2.png       hs_outfit_m_2 (bản hoán màu: hs_outfit_m_2@{màu})
  honsu/hair_m_2.png         hs_hair_m_2   (bản hoán màu: hs_hair_m_2@{màu})
  vohon/{id}_b.png, {id}_f.png   vh_{id}_b, vh_{id}_f
  beast/{loài}.png           beast_{loài} (trước bước BĐ1: b{tier})
  ring/ring{tier}.png        ring{tier} (hồn hoàn rơi), halo{tier}
shared/assets/ui/
  portrait/{id}.png          chân dung 64×64
  card/frame_{sr,ssr,ur}.png khung thẻ 96×128
  icon/he_{he}.png           biểu tượng hệ 12×12
```

- **Cách thay dần:** `textures.ts` bỏ qua key đã tồn tại. Client đọc `manifest.json` trong `preload()`, chỉ tải các key có trong danh sách (tránh lỗi 404), rồi `makeTextures()` vẽ bằng code những key còn thiếu. Vì vậy mỗi lần chỉ cần thêm ảnh và một dòng manifest; key nào chưa có ảnh vẫn chạy bằng sprite vẽ code.
- Sprite vẽ bằng code cho mô hình mới phải dùng **đúng key mới** (`hs_body_m_0` do `honsuKey("body", "m", 0)` tạo, `vh_{id}_f`…) và cùng bố cục khung, để ảnh thật thay vào được ngay.
- Key cũ `p{i}_{f}` (một hình mỗi võ hồn) đã bỏ ở bước 2.2b.

**Quy trình PixelLab → `tools/assets` → spritesheet** (chi tiết lệnh và tham số đã thử: skill `.claude/skills/asset-gen`)
0. **Ngân sách PixelLab (đã chốt 10/2026): không nâng gói.** Gói trial còn khoảng 15 lượt; dùng tiết kiệm cho phần đáng giá nhất (khung gốc hướng xuống và xoay 4 hướng của các bộ hồn sư còn thiếu, rồi phụ thể mẫu), mỗi lần gọi xem kết quả rồi mới gọi tiếp, ghi số lượt đã dùng vào PR. Phần thiếu (animation còn chép tạm, bộ kiểu tóc chưa có ảnh, hồn thú các loài khác) **vẽ bằng code hoặc chỉnh tay** (Aseprite, hoặc `pixelart_workbench` miễn phí của PixelLab) theo đúng quy cách ở mục này.
1. **Tạo ảnh bằng PixelLab** (MCP `pixellab`, token nằm trong cấu hình user, không ghi vào repo). Khung hướng xuống trước: `create_image_pixflux` 32×32 (phụ thể 48×48), nền trong suốt, góc `low top-down`. Duyệt bằng mắt rồi mới làm tiếp: xoay 4 hướng bằng `create_character mode="v3"` với ảnh tham chiếu là khung đó, animation bằng `animate_character` (ví dụ `walking-4-frames`). Nhân vật sau dùng khung gốc của nhân vật đã duyệt làm `init_image` để giữ phong cách. Prompt theo phong cách ở trên; không ghi tên họa sĩ còn sống hay tên game thương mại.
2. **Màu khóa để tách lớp hồn sư:** mỗi bộ giới × kiểu tóc là một nhân vật PixelLab vẽ liền cả người; tóc vẽ màu lam sáng, áo/quần/váy vẽ xám. Ảnh thô lưu ở `art/src/pixellab/{bộ}/{hướng}_{animation}_{i}.png`.
3. **Chuẩn hóa** bằng `tools/assets/normalize.mjs`: xóa nền, đặt chân vào gốc (hồn sư (16, 30), phụ thể (24, 38)) theo từng nhóm animation, thu bằng điểm gần nhất nếu quá khung, đưa màu về `art/palette.gpl` (phụ thể thêm `col`/`robe` của võ hồn đó cùng 1 sắc tối, 1 sắc sáng), viền ngoài `#1a1020`. `--split` tách thân / áo / tóc của một bộ theo màu khóa và đưa tóc, áo về dải 4 xám (viền ngoài giữ `#1a1020`); `--vohon <id> --halves <y>` tách phụ thể thành nửa sau / nửa trước.
4. **Ghép sheet** bằng `tools/assets/pack.mjs` theo bố cục cố định ở trên; hồn sư dùng `--set <giới>_<kiểu tóc>` để ghi cả 3 lớp của bộ (`honsu/{body,outfit,hair}_m_2.png`) một lần. `--breathe` tạo khung idle thứ 2 (đầu, vai nhích 1 pixel); `--fill` chép tạm idle vào ô chưa có animation (validate cảnh báo các ô này).
5. **Kiểm tra và đăng ký:** `tools/assets/validate.mjs --register <key>` kiểm kích thước, màu ngoài bảng, khung bắt buộc, rồi thêm key vào `manifest.json` và một dòng vào `art/CREDITS.md` (công cụ, prompt, ngày). `npm run check` và git pre-commit chạy lại validate cho mọi key.
6. **Xem trong game** ở mức phóng 2× và 4×: đủ 4 hướng, ghép thử ít nhất 2 màu tóc và 2 màu áo, đặt cạnh nền rừng sâu.
7. **Chỉnh tay khi cần:** mở sheet trong Aseprite (bảng màu `art/palette.gpl`) để sửa pixel lỗi, rồi chạy lại bước 5. Xuất từ Aseprite: `aseprite -b file.aseprite --sheet out.png --sheet-type rows --sheet-columns 16`.
- **Vì sao ghép theo bộ:** PixelLab vẽ cả người trong một ảnh. Tách lớp theo màu khóa cho thân, áo, tóc khớp nhau đúng với **kiểu tóc đã vẽ cùng**, nhưng lớp thân có lỗ ở chỗ tóc và áo che (đỉnh đầu, trán, gáy), nên không dùng một lớp thân chung cho cả 4 kiểu tóc được. Đã chốt ghép theo bộ giới × kiểu tóc (mục 8, câu 9). Mỗi bộ idle + walk 3 hướng tốn khoảng 5 lượt PixelLab.

**Nguồn và giấy phép**
- Dự án phi thương mại, chơi cùng bạn bè; được dùng tên và hình tượng nhân vật trong truyện (mục 1). Hình do nhóm tạo: **PixelLab qua dây chuyền `tools/assets`** hoặc vẽ tay trong Aseprite.
- **Không dùng** sprite, ảnh cắt hoặc hình vẽ lại sát nét từ game thương mại (kể cả *Thế Giới Săn Hồn*), phim hoạt hình hay truyện tranh chính thức. Chỉ được xem để tham khảo ý tưởng. Không đưa ảnh của các nguồn đó vào PixelLab làm ảnh tham chiếu.
- **Ảnh PixelLab được dùng thẳng trong game** sau khi qua `normalize` / `pack` / `validate`. Điều khoản PixelLab (https://pixellab.ai/termsofservice) cho phép dùng kết quả; mỗi key ghi một dòng trong `art/CREDITS.md`: file, key, công cụ, prompt, ngày. Công cụ AI khác chỉ dùng khi điều khoản cho phép dùng kết quả. Không ghi tên họa sĩ còn sống trong prompt.
- **Asset bên ngoài** (font, tileset, âm thanh) chỉ nhận giấy phép CC0, CC-BY hoặc OFL. Mỗi asset một dòng trong `art/CREDITS.md`: tên file, tác giả, link gốc, giấy phép, đã chỉnh sửa gì. CC-BY phải hiện tên tác giả trong màn hình giới thiệu của game.

## 6. Kiến trúc (bắt buộc giữ)
- **Server quyết định mọi thứ.** Client chỉ gửi ý định: `input {x,y}`, `attack`, `skill {i}`, `switch {slot}`, `absorb {itemId, vohonId}`, `chat {text}`…
  Đang có thêm: `vohons` (xin danh sách võ hồn sở hữu và đội hình, server trả tin nhắn riêng `vohons {active, team, list}`), `team {slots}` (xếp đội: đủ 4 ô, mỗi ô là `vohons.id` hoặc 0), `switch {slot}` (đổi võ hồn trong đội; thay `pick {rowId}` của bước 2.2),
  và HTTP `POST /api/awaken {token, vohon}` cho lễ thức tỉnh (luật nằm trong `awakenAccount` ở `MapRoom.ts`),
  `POST /api/looks {token, sex, hair, hairCol, outfitCol}` cho tạo nhân vật (một lần, luật trong `chooseLooks` ở `MapRoom.ts`; `/api/login` và `/api/me` trả thêm `looks`).
  Từ BĐ2 có thêm `travel {portal}` (xin đi qua cổng); server gửi riêng `portal` (đang đứng ở cổng nào, cấp đề xuất, có cảnh báo không) và `travel {mapId}` (đã được phép chuyển bản đồ).
  Từ 3.1 có thêm `bag` (xin túi đồ; server trả tin riêng `bag {slots, honTe, cd, items}`, và gửi lại mỗi khi túi đổi) và `use {id}` (dùng món đồ theo id ô; server kiểm tra món đó thuộc túi của chính người gửi).
  Từ 3.2 có thêm `pickup` (nhặt hồn hoàn gần nhất; server chọn theo vị trí, kiểm tra quyền ưu tiên và chỗ trống trong túi; đồ rơi chồng nhau thì ưu tiên món gần nhất mà người đó được nhặt), `absorb {itemId}` (hấp thụ hồn hoàn trong túi; thay `absorb` không tham số của bản cũ) và `discard {id}` (bỏ một ô trong túi).
  Từ 3.3 `absorb {itemId, vohonId}`: `vohonId` là `vohons.id` của võ hồn nhận hồn hoàn (thiếu thì võ hồn đang ra trận), server kiểm tra võ hồn thuộc chính người gửi; server gửi riêng `absorbing` lúc bắt đầu (`on`, `rowId`, `years`, `slot`, `secs`, `over`, `fail`) và khi xong (`result`: `ok` / `fail` / `cancel`).
  Từ 4.3 `boneskill {i}` (kỹ năng hồn cốt chủ động ở nút `i`: 0 đầu, 1 tay trái, 2 tay phải của võ hồn ra trận; client không gửi id hồn cốt, server tự tìm hồn cốt đang gắn, kiểm tra và trừ hồn lực), `PlayerState.bcds` (3 hồi chiêu, công khai như `cds`), fx `bone {id, i, sp, tier}` (client tra tên kỹ năng theo loài `sp` và nút `i`).
  Từ 4.2 `equip {itemId, vohonId, slot?}` (gắn hồn cốt trong túi vào võ hồn `vohons.id`; `slot` là ô client thả vào, khác vị trí của hồn cốt thì từ chối) và `unequip {itemId}` (tháo về túi). Server kiểm tra món đồ và võ hồn thuộc chính người gửi; gửi lại `bag` (trường `vohon` của từng ô là võ hồn đang gắn) và `squad`.
  Không bao giờ để client tự báo máu, sát thương, vị trí, tỉ lệ rơi, kết quả hấp thụ hay bản đồ đích.
- Trạng thái đồng bộ qua Colyseus Schema (`server/src/rooms/schema.ts`). Hiệu ứng hình ảnh gửi qua `broadcast("fx")` và `"dmg"` (từ 2.4 có `fx {k: "tienco", he}` và `PlayerState.shield` để vẽ khiên). Từ 2.5a: `BeastState.st` (bit trạng thái theo `STATUS_IDS`, thay `BeastState.stun`) cùng `burn` / `poison` / `armor` (số tầng), `PlayerState.buff` (bit hiệu ứng có lợi theo `BUFF_IDS`); fx mới `pull`, `arc`, `claw`, `buff`, `burst` thêm `n` / `a0` / `spread` / `r`, `soulring` và `tienco` kèm `vh` (client tự tra tên hồn kỹ / tiên cơ riêng), `tienco` có `own`; `dmg` có `immune` (hiện chữ "Miễn"). Từ 2.5b: bit `phoenix` trong `PlayerState.buff` (client vẽ vòng lãnh vực bán kính `PHOENIX_FIELD_R`), fx `fly {id, t, col}` (bay, chỉ hình ảnh). Từ 2.5c: `PlayerState.lei` (Phong Lôi Chi Lực, công khai để vẽ tia sét), bit `hide` (tàng hình) trong `PlayerState.buff`, `BeastState.allure` / `lock` (số tầng Mị hoặc / Phong ấn), fx `zone {x, y, r, t, col}` (vùng cố định) và `bolt {id, x, y, r, col, name}` (Lôi Động Minh Thiên). Từ 2.5d: `PlayerState.buff` là uint16, thêm bit `leech` (hút huyết). Năng lượng tiên cơ chỉ gửi riêng trong tin `squad` (`en`).
- Túi đồ, võ hồn và đội hình chỉ gửi cho chính chủ (không đồng bộ cho người khác). Người khác chỉ thấy ngoại hình hồn sư (giới tính, tóc, màu áo), võ hồn đang ra trận, cấp và hồn hoàn của nó.
- Mỗi bản đồ là một file Tiled dùng chung cho server và client: `shared/assets/<mapId>.json` (từ BĐ2: `thanh_hon_thon`, `nac_dinh_thanh`; BĐ3 thay `tinh_dau` bằng `tinh_dau_ngoai_vi`, `tinh_dau_noi_dia`; đều sinh bằng `tools/gen-map.mjs`; server nạp sẵn mọi bản đồ khi khởi động để báo lỗi object ngay). Ô có thuộc tính `collides=true` là vật cản ở cả hai phía.
- Dữ liệu lâu dài lưu trong PostgreSQL / Supabase (`server/sql/`). Bảng mới dùng `CREATE TABLE IF NOT EXISTS` và bật RLS.
- **Bảng dữ liệu dự kiến:** `vohons` (võ hồn sở hữu: cấp, kinh nghiệm, sao, hồn hoàn), `items` (mỗi món đồ có id riêng: loại, số năm, sao, cấp cường hóa, dòng chỉ số, đang gắn vào võ hồn nào), `teams` (đội hình, đã có từ 2.3a: mỗi ô một dòng), cột `accounts.map_id` + vị trí (BĐ2), `boss_claims` (lượt nhận thưởng boss mỗi ngày, BĐ5).

### Kiến trúc nhiều bản đồ (từ BĐ1)
**Một loại phòng cho mọi bản đồ**
- `MapRoom` (`server/src/rooms/MapRoom.ts`) nhận `mapId`: `gameServer.define("map", MapRoom).filterBy(["mapId"])`. Colyseus ghép người cùng `mapId` vào chung phòng; phòng đầy (`maxClients`) thì tự mở phòng mới, tức là kênh mới.
- `onCreate({ mapId })` kiểm tra `mapId` có trong `MAPS` (thiếu `mapId` thì dùng bản đồ mặc định trong `MAPS`; ở BĐ1 đó là bản đồ duy nhất), rồi nạp `shared/assets/<mapId>.json` và ghi `mapId` vào state của phòng. `server/src/map.ts` đổi thành `loadMap(mapId)`, trả về đối tượng bản đồ (ô chặn, vùng, cổng, tinh anh, boss, điểm hồi sinh), cache theo `mapId` để các kênh dùng chung. Client tải tilemap theo `mapId` đọc từ state của phòng vừa vào.
- Khác biệt giữa các loại bản đồ nằm trong dữ liệu (`MAPS[mapId].kind`: `town`, `hunt`, `boss`), không tách lớp phòng con. Bản đồ `town` không sinh hồn thú và không tính giao chiến. Bản đồ `hunt` có thể có vùng `safe` (khu làng của Thánh Hồn Thôn): trong vùng đó không sinh hồn thú, hồn thú mất mục tiêu và quay về, người chơi không bị tính giao chiến.
- **Logic game chỉ nằm trong phòng `MapRoom.ts`** (đã chuyển từ `ForestRoom.ts` ở bước BĐ1, cùng `awakenAccount`; `CLAUDE.md` và các skill trong `.claude/skills/` đã trỏ sang `MapRoom.ts`).

**Dữ liệu trong `shared/data.ts`**
- `MAPS`: mã, tên, loại, khoảng cấp đề xuất, khoảng niên hạn, mảnh võ hồn, bộ hồn hạch, thú vương, có từ bước nào.
- `BEASTS`: theo **loài**. Mã cố định (`id`, dùng cho sprite `beast_{id}`), tên, kiểu tấn công (cận chiến, tầm xa, đứng yên, đi bầy), hệ số chỉ số so với chuẩn theo năm. Chiêu báo trước theo loài nằm ở bảng riêng `BEAST_SKILLS` (từ 3.5: hình vệt/nón/vòng, kích thước, tầm, thời gian báo, hồi chiêu, bội số sát thương, trạng thái, lao), chọn bằng `beastSkillOf(loài, năm)`.
- `BOSSES`: tinh anh, thú vương, boss thế giới. Mã, tên, bậc, loài gốc (dùng lại chỉ số loài), hệ số máu và sát thương, chiêu, chiêu giai đoạn 2.
- Hằng số: hệ số 4 bậc, hệ số máu theo người (`0.6`), thời gian hồi sinh tinh anh, lịch thú vương, mức giảm kinh nghiệm, giới hạn nhận thưởng mỗi ngày. Cấp tương đương tính bằng hàm dùng chung từ bảng giới hạn hồn hoàn theo năm, không lưu bảng riêng.

**File Tiled mỗi bản đồ** (`shared/assets/<mapId>.json`, lớp object)

| Object (`type`) | Hình | Thuộc tính |
|---|---|---|
| `zone` | Chữ nhật | `beasts` (mã loài cách nhau dấu phẩy, có thể kèm trọng số: `phong_lang:3,man_da_la_xa:1`), `years` (`300-700`), `count`, `hint` |
| `portal` | Chữ nhật | `to` (`mapId` đích), `arrive` (tên điểm xuất hiện ở bản đồ đích), `level` (cấp đề xuất, `10-30`) |
| `arrive` | Điểm | Tên duy nhất trong bản đồ; nơi xuất hiện khi đi cổng tới. Phải nằm ngoài mọi vùng `portal`. Hồn thú thường không sinh trong `SPAWN_CLEAR` pixel mỗi trục quanh `arrive`, `portal` và `spawn` (mục 5.8) |
| `spawn` | Chữ nhật | Điểm hồi sinh (đã có) |
| `safe` | Chữ nhật | Vùng an toàn trong bản đồ săn (làng của Thánh Hồn Thôn) |
| `elite` | Chữ nhật | `boss` (mã trong `BOSSES`); nằm trong một `zone` |
| `boss` | Chữ nhật | `boss` (mã thú vương hoặc boss thế giới); là hang / sàn đấu và cũng là bán kính giao chiến |
| `npc` | Điểm | `npc` (mã NPC, mục 5.8) |

- Thuộc tính sai (loài không có trong `BEASTS`, cổng tới bản đồ không có trong `MAPS`, `arrive` không tồn tại ở bản đồ đích hoặc nằm trong một vùng `portal`) thì server ghi cảnh báo và bỏ object đó. Nên thêm bước kiểm tra file bản đồ vào `npm run check`.

**Đi qua cổng và lưu vị trí**
- **Lưu của mỗi người chơi chạy nối tiếp.** Lưu định kỳ chạy kiểu fire-and-forget và `save()` chụp dữ liệu nhân vật rồi mới `await` ghi DB, nên hai lần lưu của cùng một người có thể chồng nhau và lần chụp trước commit sau. Vì vậy dữ liệu riêng của mỗi client giữ một promise `saving` (lần lưu đang chạy hoặc đang chờ). Mọi lần ghi DB về nhân vật của người đó đều nối vào sau promise này: lưu định kỳ 30 giây, `onLeave`, `onDispose`, lưu ngay sau khi hấp thụ hồn hoàn, đổi võ hồn (cả `saveCharacter` võ hồn cũ lẫn `saveTeam`, từ 2.3a thay `setActive`) và transaction đi cổng (`saving = saving.then(lưu)`, lỗi được bắt và ghi log để không làm gãy chuỗi), không gọi `save()` trực tiếp. Nhờ vậy tại mỗi thời điểm một người chơi chỉ có tối đa một lần ghi DB, và các lần ghi commit đúng thứ tự đã chụp.
- **Thứ tự bắt buộc khi duyệt `travel {portal}`** (tránh đua ghi giữa phòng cũ và phòng mới):
  1. Server kiểm tra như ở 5.3. Không hợp lệ thì báo lỗi, dừng.
  2. Đánh dấu client **đang chuyển bản đồ** (cờ trong dữ liệu riêng của người chơi). Từ lúc này phòng cũ bỏ qua input, đánh, hồn kỹ, hấp thụ, đổi võ hồn và `travel` tiếp theo của client đó; hồn thú bỏ mục tiêu là người này. Đạn hồn kỹ của người này còn đang bay (bắn lúc niệm) bị xóa, và người đang chuyển không gây sát thương nữa (`damageBeast` bỏ qua), để không có số hạ hay kinh nghiệm nào cộng vào sau lúc bước 3 chụp dữ liệu.
  3. Phòng cũ **lưu đầy đủ trong MỘT transaction**: võ hồn ra trận (cấp, kinh nghiệm, hồn hoàn, số hạ; bảng `vohons`) cùng `map_id` = bản đồ đích và tọa độ điểm `arrive` (bảng `accounts`). Từ bước 3.1 transaction này lưu luôn mọi dữ liệu chưa lưu khác của người chơi (túi đồ…). Chờ ghi DB xong (`await`).
     - **Trước khi mở transaction phải `await` lần lưu đang chạy của người chơi** (promise `saving` ở trên) cho xong, rồi mới chụp dữ liệu và mở transaction; transaction đi cổng cũng nối vào cùng chuỗi `saving`. Không chờ thì một lần lưu định kỳ đã chụp dữ liệu trước bước 2 vẫn có thể commit **sau** transaction và ghi đè `vohons` (cấp, kinh nghiệm, hồn hoàn) bằng bản cũ; lớp chặn `WHERE map_id` bên dưới chỉ bảo vệ `map_id`/vị trí, không bảo vệ `vohons`. Lần lưu cũ đó lỗi thì vẫn đi tiếp, vì transaction ghi lại đầy đủ.
     - **Hoặc ghi hết, hoặc không ghi gì.** Không được ghi một nửa: nếu `vohons` lỗi mà `accounts.map_id` đã là bản đồ đích, bước 4 bỏ cờ cho người chơi ở lại nhưng lớp chặn `WHERE map_id = <mapId của phòng>` (bên dưới) sẽ chặn mọi lần lưu vị trí sau đó, và lần vào sau người chơi xuất hiện ở bản đồ đích mà chưa từng đi cổng; ngược lại, `accounts` đã đổi `map_id` mà `vohons` chưa ghi thì mất tiến độ võ hồn.
     - `PgStore`: một kết nối lấy từ pool, `BEGIN` → các câu `UPDATE` → `COMMIT`; lỗi ở bất kỳ câu nào thì `ROLLBACK` rồi ném lỗi ra. Cần một hàm store riêng cho việc này (ví dụ `saveTravel`), không gọi lần lượt các hàm lưu sẵn có.
     - `MemoryStore`: kiểm tra xong mới gán mọi trường cùng lúc trong một hàm đồng bộ, không có `await` xen giữa.
  4. Lưu xong mới gửi riêng `travel {mapId}`. **Lưu lỗi** (transaction đã rollback, DB vẫn như trước bước 3): không gửi `travel`, bỏ cờ đang chuyển bản đồ, báo người chơi "Không chuyển được bản đồ, thử lại"; người chơi ở lại và phòng cũ tiếp tục lưu bình thường.
     - **Client đã rời phòng trong lúc bước 3 đang chạy** (mất mạng, đóng tab): không gửi gì nữa. Commit thành công thì lần vào sau người chơi xuất hiện ở điểm `arrive` của bản đồ đích như đã đi cổng. Lưu lỗi thì `onLeave` (đang chờ trong chuỗi `saving`, bên dưới) lưu bình thường, vì sau khi client rời không còn lần lưu định kỳ nào.
  5. Client rời phòng và `joinOrCreate("map", { token, mapId })`. Client không rời trong 10 giây thì server ngắt kết nối.
- **Client đang chuyển bản đồ thì lưu định kỳ của phòng cũ bỏ qua người đó.** Mọi hành động đã bị chặn từ bước 2 nên không còn tiến độ mới (đạn hồn kỹ đang bay bị xóa ở bước 2, không hạ được hồn thú sau thời điểm lưu).
- **`onLeave` của client đang chuyển bản đồ không được bỏ qua mà nối vào chuỗi `saving`**, tức là chờ transaction đi cổng xong rồi xét kết quả. Transaction ghi kết quả vào dữ liệu riêng của người chơi (ví dụ `d.travelled = true` khi commit); `onLeave` đọc trường này chứ không đọc cờ đang chuyển (cờ bị bỏ ở bước 4 khi lưu lỗi).
  - **Đã commit:** không ghi gì, kể cả nhân vật lẫn `map_id`/vị trí; dữ liệu đã lưu đủ ở bước 3.
  - **Lưu lỗi:** lưu như `onLeave` thường: nhân vật cùng `map_id`/vị trí của phòng cũ, có lớp chặn `WHERE map_id` (bên dưới).
- Kết hợp với lưu nối tiếp: mọi lần lưu đã chạy hoặc đã xếp hàng trước bước 2 đều xong trước khi transaction mở, và sau bước 2 không có lần lưu mới nào trước khi transaction xong. Transaction commit thì nó là lần ghi cuối cùng của phòng cũ cho người đó. Phòng mới chỉ nạp nhân vật sau commit (`onAuth` chỉ nhận khi `map_id` trong DB đã là bản đồ đích), nên không có bản cũ hơn ghi đè bản mới.
- Phòng thêm một lớp chặn trong câu lệnh ghi: lưu `map_id`/vị trí theo chu kỳ hoặc khi rời phòng (không phải lúc đi cổng) chỉ ghi khi `map_id` trong DB vẫn là bản đồ của phòng này (`UPDATE … WHERE map_id = <mapId của phòng>`).
- `onAuth` đối chiếu `mapId` trong tham số với `map_id` trong DB; sai thì từ chối, client hỏi lại `/api/me` (trả `mapId` từ BĐ2). Client chỉ chuyển `mapId` để Colyseus ghép phòng, không tự chọn bản đồ.
- Cột `accounts.map_id`, `accounts.pos_x`, `accounts.pos_y` (file `server/sql/00N_….sql` mới ở BĐ2). Vị trí thuộc hồn sư, không thuộc võ hồn. Ghi khi qua cổng (bước 3 ở trên, chung transaction với võ hồn), khi rời phòng (trừ khi transaction đi cổng đã commit) và theo chu kỳ lưu định kỳ (trừ client đang chuyển bản đồ). Cập nhật cả `PgStore` lẫn `MemoryStore`.
- Vào game: vị trí kẹt trong ô chặn hoặc ngoài bản đồ thì về `spawn`; đăng xuất ở `loi_tinh_dau` thì lần sau về điểm `arrive` ở Nội địa. `map_id` không còn trong `MAPS` (ví dụ `tinh_dau` sau BĐ3) được ánh xạ sang bản đồ mới theo `MAP_MOVED` trong `data.ts` (`tinh_dau` → `tinh_dau_ngoai_vi`, vào ở `spawn`); mã lạ khác về `DEFAULT_MAP`.
- **Mỗi tài khoản một phiên trên mọi phòng** (từ BĐ2): `onJoin` phát `kick {accountId, sessionId}` qua presence; mọi phòng (kể cả phòng vừa vào) đá client trùng tài khoản khác `sessionId` đó (mã 4001).
  - **Phiên mới chỉ nạp DB sau lần ghi cuối của phiên cũ.** Phiên giữ tài khoản ghi trong hash presence `accountHold` (`accountId -> sessionId`): `onJoin` ghi vào, `onLeave` / `onDispose` chỉ xóa (nếu vẫn là mình) **sau khi** lần ghi cuối trong chuỗi `saving` xong. `onAuth`, sau khi kiểm token và trước mọi lần đọc DB, thấy tài khoản đang có phiên giữ thì phát `kick` rồi chờ phiên đó nhả (`waitOldSession`, tối đa 8 giây; quá thì từ chối 503, không nạp bản cũ). Không chờ thì khi đăng nhập lại lúc phiên cũ còn trong phòng (hoặc vào lại ngay sau khi rời, khi lần ghi của `onLeave` chưa commit), phiên mới nạp bản cũ, phiên cũ ghi bản mới sau đó, rồi lần lưu kế tiếp của phiên mới ghi đè: mất cấp, kinh nghiệm, túi đồ. Đi cổng cũng qua bước chờ này (phòng cũ nhả ngay vì đã commit). Chạy nhiều tiến trình thì hash này nằm trong `RedisPresence` như `kick`; khi đó tiến trình chết đột ngột để lại phiên giữ cũ trong Redis, cần dọn các phiên của tiến trình đó (chưa làm vì hiện chạy một tiến trình, presence trong bộ nhớ).
  - **Client rời phòng thì dừng tiến độ ngay** (`onLeave`, trước khi nối lần ghi cuối vào chuỗi): hủy hấp thụ dở, rồi bật cờ `travelling` như bước 2 đi cổng (`freeze`: tick bỏ qua, hồn thú bỏ mục tiêu, đạn còn bay bị bỏ). Không dừng thì trong lúc chờ ghi DB, hấp thụ xong hay đạn hạ hồn thú vẫn cộng vào nhân vật sau khi `write()` đã chụp dữ liệu, rồi mất khi dữ liệu phòng bị xóa (hồn hoàn đã tiêu mà không lưu).

**Thông báo toàn server và lịch boss**
- Dùng **presence của Colyseus**: phòng gửi `this.presence.publish("announce", { text, col })`; mỗi `MapRoom` `subscribe("announce", …)` trong `onCreate`, hủy ở `onDispose`, rồi `broadcast("chat")` cho người trong phòng.
- Lịch thú vương và boss thế giới do `server/src/schedule.ts` (khởi động ở `index.ts`) giữ. File này chỉ đếm giờ (múi giờ `Asia/Ho_Chi_Minh`) và `publish("boss", { mapId, phase: "warn" | "spawn" })`. Sinh boss, máu, chiêu và thưởng vẫn nằm trong `MapRoom`. Phòng đang mở của bản đồ đó sinh boss; phòng mở ra trong 15 phút của khung giờ boss cũng sinh.
- Chạy một tiến trình thì dùng presence mặc định (trong bộ nhớ). Chạy nhiều tiến trình thì đổi sang `RedisPresence`.
- Lượt nhận thưởng boss mỗi ngày lưu ở bảng `boss_claims` (tài khoản, ngày, loại boss, số lần), file SQL mới ở BĐ5. "Ngày" là ngày theo `Asia/Ho_Chi_Minh` (đổi lúc 00:00 giờ Việt Nam), server tự tính, không dùng giờ của client hay múi giờ mặc định của máy chủ.

**Schema**
- `BeastState` thêm `species` (chỉ số trong `BEASTS`, hoặc trong `BOSSES` với tinh anh và boss), `rank` (0 thường, 1 tinh anh, 2 thú vương, 3 boss thế giới; có từ BĐ4 cùng `buff`: hiệu ứng có lợi của hồn thú) và `years` (đã có từ bước 3.2, cùng `DropState.years`). State của phòng thêm `mapId` (từ BĐ1; client đọc để tải tilemap). Thanh máu boss đọc thẳng từ `BeastState`.

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
- [x] **BĐ1** Tách `MapRoom`, đọc bản đồ theo `mapId` (làm ngay sau 2.2, trước 2.2a, 2.2b, 2.3). **Chưa đổi luật chơi.**
  - `ForestRoom` thành `MapRoom` nhận `mapId`; `define("map", MapRoom).filterBy(["mapId"])`. Bản đồ hiện tại đổi tên thành `shared/assets/tinh_dau.json`, `mapId` = `tinh_dau` (bản đồ duy nhất cho đến BĐ2). `map.ts` thành `loadMap(mapId)`.
  - **Nguồn `mapId` ở BĐ1:** chỉ có một bản đồ, nên `MAPS` đánh dấu một bản đồ mặc định (`tinh_dau`). Client gọi `joinOrCreate("map", { token })` **không kèm `mapId`**; phòng thiếu `mapId` thì dùng bản đồ mặc định, `mapId` khác bản đồ mặc định thì từ chối. Client **nhận `mapId` từ phòng khi đã vào** (trường `mapId` trong state của phòng) rồi mới tải tilemap; không đọc từ `/api/me`, không tự đặt tên bản đồ. Từ BĐ2, `/api/me` trả `mapId` đọc từ DB và client truyền nó khi join (mục 6).
  - Bảng `MAPS` và `BEASTS` (theo loài) trong `data.ts`; `BeastState` thêm `species`. Vùng trong Tiled khai báo `beasts`; cho đến 3.2 vẫn giữ `weights` theo bậc, mỗi loài có bậc tạm để lấy chỉ số `TIERS`.
  - **Gộp bước 2.6:** danh hiệu trên đầu hồn sư theo cấp võ hồn ra trận (bảng 5.1); tên hồn thú và tên vùng lấy theo bảng Ngoại vi / Nội địa ở 5.3 (chọn loài khớp bậc).
  - Cập nhật `CLAUDE.md`, skill trong `.claude/skills/`, mục 6 và bot: logic game nằm trong `MapRoom.ts`.
  *Đã làm:* `MapRoom` (`server/src/rooms/MapRoom.ts`, kèm `awakenAccount`) đăng ký `define("map", MapRoom).filterBy(["mapId"])`. `onCreate` lấy `mapId` từ tham số hoặc `DEFAULT_MAP`, từ chối mã không có trong `MAPS`, nạp `loadMap(mapId)` (cache theo `mapId`) và ghi `mapId` vào listing để phòng mở không kèm `mapId` vẫn ghép đúng khi sau này client gửi `mapId`.
  Nguồn `mapId` ở BĐ1: client chỉ gửi `token`, server dùng bản đồ mặc định; client chờ state đầu tiên để đọc `MapState.mapId` rồi tải `shared/assets/<mapId>.json` (không lấy từ `/api/me`). `forest.json` đổi tên thành `tinh_dau.json`, `tools/gen-map.mjs` sinh ra đúng file này.
  `data.ts`: `MAPS` (chỉ `tinh_dau`; mảnh võ hồn, bộ hồn hạch, thú vương thêm khi làm tới), `DEFAULT_MAP`, `BEASTS` 12 loài với bậc tạm, `TITLES`/`titleOf`. Bỏ tên hồn thú theo bậc trong `TIERS`. `BeastState.species` là chỉ số trong `BEASTS`; sinh hồn thú vẫn tung bậc theo `weights` rồi chọn loài cùng bậc trong `beasts` của vùng (vùng thiếu loài bậc đó thì lấy loài bất kỳ cùng bậc, server cảnh báo lúc nạp).
  Vùng đổi tên: Bìa rừng, Rừng thưa, Rừng cổ thụ (trước là Rừng sâu), Hắc Ám Lâm (trước là Lõi rừng cổ). Vì vùng cũ trộn nhiều bậc nên mỗi vùng mượn thêm loài của vùng kế bên trong bảng 5.3. Bậc 10 vạn năm chưa có loài thường ở Ngoại vi / Nội địa: tạm dùng Xích Lân Mãng đến bước 3.2.
  Client: danh hiệu (bảng 5.1) hiện trên tên hồn sư, tên hồn thú ở khung mục tiêu và thông báo hạ hồn thú lấy theo loài. Sprite hồn thú vẫn theo bậc đến M4. Bot vào phòng `map`, kiểm tra hai bot cùng phòng, `state.mapId`, file Tiled tồn tại và có nhiều loài.
- [x] 2.2a Tạo nhân vật: chọn nam/nữ, 4 kiểu tóc, màu tóc, màu áo (mục 5.11). Lưu `sex`, `hair`, `hairCol`, `outfitCol` cho tài khoản (file SQL mới), đồng bộ qua schema để người khác thấy. Làm ngay trước bước chọn SSR của lễ thức tỉnh; tài khoản cũ nhận ngoại hình mặc định và được chọn lại một lần ở lần vào game tới.
  *Đã làm:* `005_account_looks.sql` thêm vào `accounts` các cột `sex`, `hair`, `hair_col`, `outfit_col` (mặc định 0) và cờ `looks_chosen` (không tạo bảng mới; `accounts` đã bật RLS). Store có `getLooks` / `chooseLooks` ở cả `PgStore` lẫn `MemoryStore`; `chooseLooks` chỉ ghi khi `looks_chosen` còn false nên chỉ chọn được một lần, kể cả khi gửi nhiều yêu cầu cùng lúc.
  `data.ts`: `SEXES`, `HAIR_STYLES` (tên theo bảng 5.11), `HAIR_COLORS`, `OUTFIT_COLORS` (6 màu, dải 4 sắc lấy từ `art/palette.gpl`, dùng thẳng cho `recolor` ở 2.2b), `DEFAULT_LOOKS`, `parseLooks()`. Server từ chối (400) mọi giá trị không phải số nguyên trong khoảng; chọn lần hai trả 409.
  Thứ tự do server giữ: chưa tạo nhân vật thì `/api/awaken` trả 409 và `onAuth` từ chối vào bản đồ (403 "Chưa tạo nhân vật."). Tài khoản cũ có `looks_chosen = false` nên nhận ngoại hình mặc định và phải chọn một lần trước khi vào game.
  `PlayerState` thêm `sex`, `hair`, `hairCol`, `outfitCol` (`uint8`). Client: màn "Tạo nhân vật" (chuột, chạm, bàn phím) có ô xem trước vẽ bằng code, đứng trước màn chọn SSR; tài khoản cũ thấy màn này ở lần vào tới. Trong game hồn sư vẫn vẽ bằng code (16×24, gốc tại chân) theo giới tính, kiểu tóc, màu tóc, màu áo; đai lưng mang màu võ hồn ra trận. Key tạm `p{vh}_{f}_{sex}{hair}{hairCol}{outfitCol}` tạo khi có người dùng, bỏ ở 2.2b.
  Bot đi qua bước tạo nhân vật: thử giá trị sai, thức tỉnh và vào bản đồ trước khi chọn, chọn lần hai, và B thấy đúng ngoại hình của A.
- [x] 2.2b Hiển thị hồn sư ghép lớp bằng code theo quy cách 5.11: thân, áo, tóc (đổi màu), lớp phụ thể đơn giản cho 20 võ hồn, vòng hồn hoàn dưới chân. Thêm hướng nhìn 4 phía vào schema. Bỏ key cũ `p{i}_{f}`.
  *Đã làm:* `client/src/honsuArt.ts` vẽ từng khung vào bộ đệm pixel theo đúng bố cục cố định (16 cột × 4 hàng, đủ 7 animation, 3 hướng): `hs_body_{m,f}`, `hs_outfit_{m,f}_0` và `hs_hair_{m,f}_{0–3}` bằng dải 4 xám (key cũ; từ PR #31 đổi thành bộ `hs_{body,outfit,hair}_{m,f}_{0–3}`, mục 5.11), `vh_{id}_b` / `vh_{id}_f` 48×48 cho 20 võ hồn (chỉ cột 0–11 hàng 0–2). `textures.ts` biến chúng thành texture có khung đánh số (bỏ qua key đã có ảnh thật trong manifest), phụ thể chỉ tạo khi có người dùng; áo và tóc hoán màu bằng `recolor` thành `hs_hair_f_2@3`, `hs_outfit_m_0@5`. Viền ngoài `#1a1020` giữ nguyên khi hoán màu, chỉ viền trong (xám tối nhất) đổi theo màu (đã chốt, mục 5.11).
  `GameScene`: mỗi hồn sư là một container theo thứ tự lớp 1–8 (bóng `hs_shadow`, cung trên vòng hồn hoàn, phụ thể sau, thân, áo, tóc, phụ thể trước, cung dưới vòng); chỉ lớp thân chạy animation `hs_body_{m,f}:{anim}_{hướng}` (từ PR #31: `hs_body_{m,f}_{kiểu tóc}:{anim}_{hướng}`), các lớp khác đặt khung bằng `syncLayers` (bảng ánh xạ phụ thể: hurt → idle cột 0, die ẩn, absorb → idle hướng xuống mờ 60%). Animation chọn theo state: gục → `die`, hấp thụ → `absorb`, fx `slash` → `attack`, fx `soulring` → `cast` (vòng của hồn kỹ sáng và phình trong 300 ms), `dmg` có `id` → `hurt` kèm nháy trắng 2 lần, còn lại `walk` / `idle`. Hướng trái lật ngang mọi lớp. Đai lưng thôi mang màu võ hồn (đai là sắc tối của áo).
  Server: `PlayerState.dir` (uint8) tính bằng `dir4(input)` khi di chuyển, đứng yên giữ hướng cũ; bỏ `PlayerState.face`. Không đổi luật chơi; chỉ thêm `i` vào fx `soulring` và `id` vào `dmg` khi người chơi bị đánh (hiệu ứng hình ảnh). Ô xem trước ở màn tạo nhân vật dùng cùng hình vẽ (khung `idle` hướng xuống, 32×32). Bot kiểm tra 4 hướng nhìn và người khác thấy cùng hướng.
- [x] 2.3a Đội hình 4 võ hồn và đổi võ hồn trong trận.
  *Đã làm:* `006_teams.sql` tạo bảng `teams` (mỗi ô một dòng `account_id, slot, vohon_id`, khóa ngoại kép tới `vohons(account_id, id)` nên võ hồn trong đội phải thuộc đúng tài khoản; bật RLS). Store có `getTeam` / `saveTeam` ở cả `PgStore` lẫn `MemoryStore`, bỏ `setActive`: `saveTeam` ghi đội và `accounts.active_vohon` trong một transaction. Tài khoản chưa có đội (tài khoản cũ, tài khoản vừa thức tỉnh) được `getTeam` tự xếp ở lần vào game: võ hồn ra trận ở ô 1, còn lại theo thứ tự nhận. Việc xếp này làm trong JS chứ không trong SQL để không chép `TEAM_SIZE` ra ngoài `data.ts`.
  `data.ts`: `TEAM_SIZE` (4), `SWITCH_CD` (3 giây), `TEAM_COMBAT_SECS` (5 giây, thay `PICK_COMBAT_SECS`), `parseTeam()`; bỏ `PICK_CD`. Server bỏ message `pick`, thêm `team {slots}` (kiểm tra hình dạng, quyền sở hữu, không gục, không hấp thụ, ngoài giao chiến; từ chối thì gửi lại đội đang lưu) và `switch {slot}` (được cả khi đang đánh; cấm khi gục, đang hấp thụ, ô trống, còn hồi chiêu). Bỏ võ hồn ra trận khỏi đội thì võ hồn ở ô đầu tiên còn lại ra trận. Đổi võ hồn đổi chỉ số, hồn hoàn, phụ thể và giữ tỉ lệ sinh lực / hồn lực như bước 2.2; lưu tiến độ võ hồn vừa rút về. Lưu đội hình không ghi chồng: mỗi người tối đa một lần ghi đang chạy, đổi dồn dập thì ghi một lần bản mới nhất.
  Đội hình chỉ gửi riêng trong tin `vohons`; `PlayerState` chỉ thêm `swCd` (hồi chiêu đổi còn lại). Client: thanh đội hình 4 ô cạnh thanh kỹ năng (tên, cấp, ô ra trận sáng viền, lớp phủ hồi chiêu; phím 1–4 hoặc chạm), bảng "Đội hình" (phím V / nút) gồm 4 ô và bộ sưu tập: chọn ô rồi chọn võ hồn để đặt (đã ở ô khác thì đổi chỗ), không chọn ô thì vào ô trống đầu tiên, nút "Bỏ". **Khác trước:** phím số 1–4 dành cho đổi võ hồn nên hồn kỹ chuyển sang U / I / O / P.
  Bot: xếp đội, chặn đội sai (không sở hữu, trùng, thiếu ô, trống, không phải số), đổi chỗ, bỏ võ hồn ra trận khỏi đội, `switch` và hồi chiêu, ô trống và chỉ số sai, đổi trong trận được nhưng xếp đội trong trận bị chặn, B không nhận đội của A, vào lại thấy đội đã lưu. Đã thử thêm với PostgreSQL: tài khoản tạo bằng bản trước tự được xếp đội, chạy server hai lần liên tiếp.
- [x] 2.3b Luật gục và hồi sinh mới (võ hồn gục tự đổi sang võ hồn còn sống, hồi lại ở doanh trại hoặc sau 60 giây ngoài trận, cả đội gục thì về doanh trại), chia kinh nghiệm 40/20/20/20 cho đội (mục 5.1).
  *Đã làm:* `data.ts`: `REVIVE_SECS` (60), `RESPAWN_SECS` (2,5, trước viết thẳng trong room), `XP_SHARE_ACTIVE` / `XP_SHARE_BENCH` (0,4 / 0,2), `MAX_RINGS`, và giảm kinh nghiệm theo chênh cấp của 5.3: `beastLevel(tier)` (cấp tương đương tính từ `ringLimit`, tạm theo bậc: 10 / 10 / 20 / 40 / 70 cho đến BĐ3), `XP_LEVEL_CAP` (80), `XP_LEVEL_STEPS`, `xpLevelScale()`. Bỏ luật mất 30% kinh nghiệm khi chết.
  Server: dữ liệu riêng giữ sinh lực các võ hồn không ra trận (`benchHp`, không lưu DB) và võ hồn đã gục (`down`: số giây ngoài trận còn lại). Võ hồn ra trận gục thì `knockOut` cho võ hồn chưa gục ở ô kế tiếp (hết thì vòng lại ô 1) ra trận ngay, không đặt và không chờ `swCd`; không còn ai thì gục cả người, sau `RESPAWN_SECS` về doanh trại và cả đội hồi đầy. Đồng hồ hồi chỉ chạy khi ngoài giao chiến (`TEAM_COMBAT_SECS`; giao chiến thì dừng chứ không đếm lại); đứng trong doanh trại thì hồi ngay. Hồi lại là đầy sinh lực. Võ hồn khác trong đội hồi sinh lực cùng nhịp với võ hồn ra trận; lên cấp thì hồi đầy như võ hồn ra trận. `switch` vào võ hồn đã gục bị từ chối (báo số giây còn lại); bỏ võ hồn ra trận khỏi đội thì võ hồn chưa gục ở ô đầu tiên ra trận, không còn ai thì từ chối.
  Kinh nghiệm (`rewardKill`): giảm theo chênh cấp với võ hồn ra trận một lần, rồi 40% cho võ hồn ra trận và 20% cho mỗi võ hồn khác trong đội (kể cả võ hồn đã gục), làm tròn từng phần; ô trống và võ hồn ở bình cảnh không nhận, phần đó bỏ đi (không dồn lại). Tiến độ của võ hồn không ra trận được đánh dấu và lưu cùng lần lưu định kỳ / khi rời phòng. **Hồn lực:** thiết kế không tách theo võ hồn (hồn lực thuộc về hồn sư) nên đổi võ hồn vẫn giữ tỉ lệ hồn lực như 2.2.
  Tin riêng mới: `squad` (sinh lực từng võ hồn trong đội, số giây hồi của võ hồn đã gục, đang giao chiến hay không; gửi khi đổi, kiểm tra 2 lần/giây) và `ko` (võ hồn vừa gục, võ hồn tự ra trận hoặc `null` khi cả đội gục); tin `vohons` thêm `xp`. Client: thanh đội hình có thanh sinh lực từng ô (ô ra trận đọc state), ô đã gục mờ đi kèm "Gục · 37s" (mờ hơn khi đồng hồ đang dừng vì giao chiến), banner khi tự đổi và khi cả đội gục, cùng thông báo trong log.
  Hook kiểm thử `test {op}` (`down`, `kill {tier}`, `rest {s}`, `set {rowId, level, xp, rings}`) chỉ chạy khi server bật `GAME_TEST=1`, mặc định chỉ trả lời "không bật". Bot dùng hook để kiểm tra chia 40/20, bình cảnh không nhận, giảm 50% / 10%, tự đổi khi gục dù đang hồi chiêu, không đổi vào võ hồn đã gục, hồi sau 60 giây ngoài trận, cả đội gục không mất kinh nghiệm và về doanh trại hồi đầy, gục trong doanh trại hồi ngay, tin `squad` chỉ đến chính chủ, vào lại thấy kinh nghiệm từng võ hồn đã lưu; server không bật hook thì bot báo bỏ qua phần này.
- [x] 2.4 Năng lượng và chiêu tiên cơ.
  *Đã làm:* luật ở mục 5.1 "Trong trận", mọi chi tiết thiết kế còn thiếu là đề xuất **(chờ chốt)**. `data.ts`: `TIEN_CO_MAX` (100), `TIEN_CO_GAIN` (đòn thường 10, hồn kỹ 20), `TIEN_CO_IDLE_SECS` / `TIEN_CO_DECAY` (giảm 10/giây sau 10 giây ngoài giao chiến), `TIEN_CO` (tiên cơ chung theo hệ), `TIEN_CO_SET` + `energyGain` / `tienCoDmgMult` (chừa hệ số bộ hồn hạch Tiên Cơ, chưa bật).
  Server: dữ liệu riêng giữ năng lượng từng võ hồn trong đội (`energy`, không lưu DB). Mỗi đòn thường / lần tung hồn kỹ là một đối tượng `Hit` nên chỉ tạo năng lượng một lần dù trúng nhiều hồn thú hay nhiều mũi Hồn Tiễn; đòn tiên cơ không tạo. `switch` vào võ hồn đầy năng lượng thì gọi `tienCo()` sau khi đổi (dùng công của võ hồn mới); tự đổi khi gục không tung. Gục mất năng lượng, rời đội mất năng lượng. Khống chế: `BData.stun` làm hồn thú đứng yên (không đi, không đánh, không bị đẩy lùi), đồng bộ `BeastState.stun`. Phụ trợ: hồi cả đội và khiên của hồn sư (`PlayerState.shield`), khiên đỡ đòn trước sinh lực (số bị đỡ hiện màu lam).
  Tin `squad` thêm `en` cho từng võ hồn (gửi khi đổi). Client: thanh đội hình có thanh năng lượng vàng, ô đầy năng lượng (không ra trận, chưa gục) sáng viền nhấp nháy kèm "Tiên cơ!", log báo một lần "đủ năng lượng tiên cơ: nhấn N"; fx `tienco` vẽ hiệu ứng riêng mỗi hệ (nổ vòng + rung, vệt lướt + dấu chém, vòng thu hẹp + mắt xích, hạt hồi phục) và chữ "Tiên cơ · <tên>"; vòng khiên quanh hồn sư, sao quay trên hồn thú bị choáng.
  Hook `test` thêm `energy {v}` (tính như vừa giao chiến), `spawn {tier, dx, dy}`, `hurt {pct}`, `clear`; `rest` cũng trừ năng lượng. Bot: tích năng lượng khi đánh hồn thú thật, +10 dù trúng 2 hồn thú, Hồn Tiễn chỉ +20, chưa đầy thì không tung, giảm dần ngoài giao chiến, tiên cơ cả 4 hệ (thêm bot C Nguyệt Nhận, D Thiên Càn Bạch Ngọc Đỉnh) với đúng sát thương, lướt, choáng, hồi và khiên, gục mất năng lượng và tự đổi không tung, năng lượng chỉ gửi chính chủ.
- [x] 2.5 Hồn kỹ riêng vòng 1–4 và tiên cơ riêng cho cả 20 võ hồn, chia 4 đợt 2.5a–2.5d (xong ở 2.5d).
- [x] 2.5a Engine trạng thái dùng chung, hồn kỹ riêng vòng 1–4 và tiên cơ riêng cho 5 võ hồn mẫu (mỗi hệ ít nhất một): Lam Ngân Thảo, Hạo Thiên Chùy, U Minh Linh Miêu, Bích Lân Xà Hoàng, Cửu Bảo Lưu Ly Tháp.
  *Đã làm:* luật và bảng số ở mục 5.1 (trạng thái, hiệu ứng có lợi, tiên cơ riêng) và 5.2 (sức mạnh theo số năm, bảng hồn kỹ), mọi con số **(chờ chốt)**. `data.ts`: `STATUS_IDS` / `STATUS` / `statusBit`, `STATUS_TICK`, `CC_TIER_MULT`, `BEAST_REGEN`, `BUFF_IDS` / `BUFFS` / `buffBit`, `CRIT`, `skillPower` / `buffPower` / `BUFF_SCALE`, `PCT_HP_CAP`, `PROJ_SPEED`, kiểu `SkillDef` (vùng tác dụng, sát thương, trạng thái, hiệu ứng lên bản thân), `SKILLS` viết lại theo `SkillDef` (số như cũ), `VOHON_SKILLS` + `skillsOf(mã)`, `TIEN_CO_RIENG` + `tienCoOf(mã)`.
  Server (`MapRoom`): một bộ máy `runSkill` chạy mọi hồn kỹ (chung, riêng) và tiên cơ riêng theo dữ liệu; nhát liên hoàn hẹn giờ trong `tick` (`later`), mũi đạn gọi lại `strike` của hồn kỹ. Trạng thái trên hồn thú (`BData.st`): `applyStatus` (cộng tầng, thời gian, độ lớn), `tickStatus` (hết giờ, sát thương mỗi giây), `damageBeast` tính Dễ thương / Phá giáp / chí mạng cộng thêm / hút máu / lan Cảm điện, `detonateBurn` (Viêm bạo), `regenBeast`; khống chế đọc trong vòng lặp hồn thú (thay `BData.stun`, tiên cơ chung Phong Tỏa cũng gây Choáng qua `applyStatus`). Hiệu ứng có lợi trên hồn sư (`PData.buffs`): công (`atkOf`), tốc, thủ và Miễn sát thương (`hurtPlayer`), chí mạng, giảm tiêu hao. Đi cổng / vùng an toàn (từ BĐ2): `damageBeast` và `applyStatus` bỏ qua người đang chuyển bản đồ hoặc đứng trong vùng an toàn; kéo quái dùng `moveBeast` nên không kéo vào làng.
  **Khác thiết kế / đề xuất (chờ chốt):** Phá giáp tạm là nhận thêm sát thương đòn trực tiếp (hồn thú chưa có thủ); Câm lặng tạm chặn đòn đánh của hồn thú (chưa có chiêu); hiệu ứng có lợi chỉ cho chính mình; thêm hồi máu hồn thú ngoài giao chiến để Trúng độc giảm hồi máu có tác dụng; "hất tung" = Choáng ngắn; tiên cơ riêng của Cửu Bảo Lưu Ly Tháp lấy tên Vô Địch Thần Quang (bản nhỏ).
  Client: thanh U / I / O / P hiện tên và biểu tượng hồn kỹ riêng (chú thích kèm hồn lực, hồi chiêu, sức mạnh theo số năm), tên dài tối đa 2 dòng; tên hồn kỹ / tiên cơ bay lên khi tung; hiệu ứng `pull`, `arc`, `claw`, `buff`, mũi tỏa hình quạt. Hồn thú: hàng biểu tượng trạng thái trên thanh máu (chấm số tầng), màu phủ khi Thiêu đốt / Trúng độc / Cảm điện, dây Trói dưới chân, sao Choáng; khung mục tiêu ghi tên trạng thái. Hồn sư: hạt và vòng hào quang theo hiệu ứng có lợi, vòm sáng khi Miễn sát thương (người khác cũng thấy), ô "Tăng công / Tăng tốc…" dưới vòng hồn hoàn.
  Hook `test` thêm `status {s, n, secs, all}`, `boom`, `bhp {pct}`, `regen {s}` (trả `gain`), `ready {mp}`, `grant {vohon}`; `rest` cũng trôi thời gian hiệu ứng có lợi; `down` / `hurt` bỏ Miễn sát thương. Bot: hàm sức mạnh theo năm, hồn kỹ chung không đổi số, từng hồn kỹ của 5 võ hồn (sát thương đúng công thức, trói đứng yên, độc mỗi giây, Dễ thương +25%, gom quái, Choáng ngắn hơn với 10 vạn năm, nửa trước mặt, Phá giáp cộng dồn, liên hoàn 4 / 3 / 8 nhát, lướt, mũi quạt, Câm lặng không đánh, hút máu, Thiêu đốt cộng dồn và theo công, Viêm bạo, tăng công / tốc / thủ / giảm tiêu hao, hiệu ứng còn sau khi đổi võ hồn, người khác thấy hào quang), Cảm điện lan đúng 40%, hồi máu hồn thú và Trúng độc giảm một nửa, tiên cơ riêng cả 5 và tiên cơ chung khống chế (Yêu Hồ), vùng an toàn chặn hồn kỹ và tạm dừng độc. Sửa thêm vài chỗ đua thời gian trong bot cũ (đọc state ngay sau tin trả lời của hook, chọn nhầm hồn thú vừa sinh).
- [x] 2.5b Hồn kỹ riêng vòng 1–4 và tiên cơ riêng lưu phái **Thiêu đốt**: Tà Hỏa Phượng Hoàng (lãnh vực +30% sát thương), Hỏa Long (Viêm bạo kích nổ rồi đặt lại 1 tầng), Hỏa Ảnh (đẩy lùi, Dễ thương), Kỳ Nhung Thông Thiên Cúc, Nguyệt Nhận (lướt hàng sau, hạ mục tiêu yếu máu).
  *Đã làm:* 20 hồn kỹ và 5 tiên cơ riêng thêm vào `VOHON_SKILLS` / `TIEN_CO_RIENG` (bảng ở mục 5.1 / 5.2, mọi số **chờ chốt**). Bộ máy hồn kỹ thêm vài trường `SkillDef` vì lối đánh bắt buộc: nhiều nhát quanh thân (cánh hoa), `boom` (Viêm bạo rồi đặt lại tầng), `push` (đẩy lùi), `pick: "low"` + `lowHp` (khóa và hạ mục tiêu yếu máu), `fly` (bay, chỉ hiệu ứng); hiệu ứng có lợi mới `phoenix` (lãnh vực phượng hoàng đi theo hồn sư, tăng sát thương mọi nguồn lên hồn thú trong bán kính 90, đổi võ hồn vẫn còn). Client: vòng lãnh vực, hồn sư nhấc lên khi bay. Khác kế hoạch: Cửu Tinh Thất Sát Kiếm (Phá giáp) dời sang 2.5d; "hạn chế di chuyển" của Kỳ Nhung tạm dùng Trói ngắn, làm chậm làm cùng Yêu Hồ ở 2.5c; ràng buộc Tà Hỏa Phượng Hoàng + Hỏa Ảnh chưa làm.
  Bot (`GAME_TEST=1`): từng hồn kỹ của 5 võ hồn (sát thương nhát đầu đúng công thức, trạng thái và số tầng), bay qua hồn thú kèm fx, lãnh vực +30% trong bán kính và không tăng ngoài bán kính, còn sau khi đổi sang Hỏa Long, người khác thấy; Viêm bạo nổ 4 tầng trong khoảng sát thương dự kiến rồi còn 1 tầng; combo Tà Hỏa Phượng Hoàng chồng 4 tầng rồi đổi tay vào Hỏa Long tung tiên cơ Viêm bạo; đẩy lùi, Dễ thương tăng 25% đòn sau, cánh hoa 5 / 8 nhát cộng dồn Thiêu đốt tối đa, Trói ở nhát cuối; Nguyệt Nhận bỏ qua hồn thú gần đủ máu để khóa hồn thú yếu máu ở xa, sát thương tăng theo sinh lực đã mất; tiên cơ riêng cả 5. Bot A đổi võ hồn chọn lúc thức tỉnh sang Lam Điện Bá Vương Long (vẫn dùng hồn kỹ chung tới 2.5c).
- [x] 2.5c Lưu phái **Cảm điện**: Lam Điện Bá Vương Long (Phong Lôi Chi Lực, Lôi Động Minh Thiên), Kim Vũ Miêu Ưng (tê liệt, câm lặng, phủ Cảm điện), Càn Khôn Hỗn Nguyên Tỏa (vùng phong tỏa, Dễ thương cộng dồn), Yêu Hồ (thêm trạng thái Mê hoặc, làm chậm), Xúc Xích (hồi hồn lực, giải khống chế).
  *Đã làm:* 20 hồn kỹ, 5 tiên cơ riêng và Lôi Động Minh Thiên thêm vào `VOHON_SKILLS` / `TIEN_CO_RIENG` / `PHONG_LOI` (bảng ở mục 5.1 / 5.2, mọi số **chờ chốt**). Trạng thái mới: Mị hoặc (cộng dồn 3 tầng thành Mê hoặc: đi lung tung, không đánh), Làm chậm, Phong ấn (cộng dồn 3 tầng thành Dễ thương 6,8 giây); hiệu ứng có lợi `hide` (tàng hình). Bộ máy hồn kỹ thêm vùng cố định (`at` bay tới đặt vùng phong tỏa tại hồn thú, `fixed` lãnh vực đặt xuống chỗ đứng) và `copy` (Phục Chế). Server: thanh Phong Lôi Chi Lực của hồn sư (`PlayerState.lei`), đầy thì tự tung Lôi Động Minh Thiên ở nhịp sau; hồn thú bỏ mục tiêu người tàng hình; Mê hoặc làm hồn thú đi lung tung; Làm chậm giảm tốc theo tầng. Client: thanh Phong Lôi Chi Lực dưới thanh kinh nghiệm (chỉ khi Lam Điện ra trận), tia sét quanh thân, fx `bolt` (Lôi Động Minh Thiên) và `zone` (vùng cố định), biểu tượng Mị hoặc / Phong ấn / Làm chậm (chấm số tầng), tim xoay khi Mê hoặc, hồn sư tàng hình mờ đi.
  **Đơn giản hóa / khác thiết kế (chờ chốt):** "tê liệt" = Trói 3 giây + Câm lặng 5 giây; "ngắt chiêu boss" = Choáng 1 giây (ngắt chiêu báo trước thật ở 3.5); "sao chép kỹ năng đồng đội" = chép hồn kỹ gần nhất của võ hồn khác trong đội của chính hồn sư; "giải khống chế" của Xúc Xích chưa làm vì hồn sư chưa bị khống chế (3.5); Kỳ Nhung Thông Thiên Cúc vẫn dùng Trói ngắn thay Làm chậm.
  Bot (`GAME_TEST=1`, hook mới `lei {v}`): từng hồn kỹ của 5 võ hồn (sát thương nhát đầu, trạng thái, số tầng); Phong Lôi Chi Lực +10 / ×2 khi hồn thú Cảm điện / đòn thường +8, đầy thì tự tung Lôi Động Minh Thiên đúng sát thương và Choáng, thanh về 0, người khác thấy, giảm ngoài giao chiến, gục thì mất; **lan Cảm điện** 3 tia mỗi tia lan đúng 40% sang hồn thú Cảm điện gần, không lan sang hồn thú xa hơn 64 pixel; Long Hống thêm sát thương lên hồn thú Cảm điện; tê liệt (không đi, không đánh, hết co giật trước Câm lặng); bay; áo nghĩa phủ Cảm điện 3 hồn thú, còn sau 6,6 giây; combo Kim Vũ Miêu Ưng phủ Cảm điện rồi đổi tay vào Lam Điện (tiên cơ kích nổ, lan); Phong ấn 2 tầng chưa gì, 3 tầng thành Dễ thương +25%, còn sau 5,8 giây, hết sau 6,8 giây; vùng phong tỏa bay tới, hồn sư lùi ra ngoài bán kính vẫn đủ 6 / 8 nhát; gom quái; Mị hoặc cộng dồn thành Mê hoặc, đang Mê hoặc không cộng thêm, hồn thú bỏ mục tiêu, không đánh, đi lung tung, hết đúng giờ; Làm chậm (đo quãng đi hồn thú giảm khoảng 40%); tàng hình (người khác thấy, hồn thú bỏ mục tiêu, đánh thường thì hiện hình); lãnh vực cố định; Xúc Xích hồi sinh lực, hồn lực, tăng tốc, Phục Chế không có gì để chép thì không tung, chép Lôi Đình Phích Lịch của Lam Điện đúng sát thương, chép Phòng Chi Lưu Ly của Cửu Bảo Lưu Ly Tháp ra khiên đúng 0,8 lần, võ hồn nguồn đang gục thì không chép; tiên cơ riêng cả 5; tung tiên cơ thì hết tàng hình. Bot cũ: hồn kỹ chung và tiên cơ chung khống chế chuyển sang thử với Tử Vong Chu Hoàng (2.5d).
- [x] 2.5d Còn lại: Cửu Tinh Thất Sát Kiếm (Vô Ngã Kiếm Trận, Liệt thương), Nhu Cốt Thố (chấn đãng, hút máu), Tử Vong Chu Hoàng (giăng tơ, trúng độc), Quỷ Mị (biến sát thương thành hồi máu, tàng hình), Thiên Càn Bạch Ngọc Đỉnh (hồi máu, khiên, xóa buff, thanh tẩy); xét ràng buộc (mục 5.1) nếu đã chốt.
  *Đã làm:* 20 hồn kỹ và 5 tiên cơ riêng thêm vào `VOHON_SKILLS` / `TIEN_CO_RIENG` (bảng ở mục 5.1 / 5.2, mọi số **chờ chốt**); cả 20 võ hồn đều có hồn kỹ và tiên cơ riêng, `SKILLS` (4 hồn kỹ chung) và `TIEN_CO` (tiên cơ chung theo hệ) không còn võ hồn nào dùng, giữ làm dự phòng cho võ hồn thêm sau. Cơ chế mới: hiệu ứng có lợi `leech` (hút huyết của Quỷ Mị: mọi sát thương hồn sư gây ra hồi thành sinh lực võ hồn ra trận, đổi võ hồn vẫn còn; `PlayerState.buff` đổi sang uint16); ràng buộc bản tối thiểu (`BONDS` / `bondsOf`, ràng buộc còn **chờ chốt** nên chỉ làm hai cặp ví dụ của 5.1: Hạo Thiên – Nhu Cốt chí mạng +10%, Tà Hỏa – Hỏa Ảnh Thiêu đốt +20%; server `bondV` cộng vào chí mạng trong `damageBeast` và Thiêu đốt trong `applyStatus`; bảng đội hình hiện dòng "Ràng buộc"). Còn lại chỉ thêm dữ liệu (nhiều nhát quanh thân, vùng cố định, kéo quái, hút máu, tàng hình có sẵn).
  **Chưa làm / khác thiết kế (chờ chốt):** "xóa buff địch" và "thanh tẩy đội" của Thiên Càn Bạch Ngọc Đỉnh (hồn thú chưa có hiệu ứng có lợi, hồn sư chưa mang trạng thái xấu; làm cùng hồn thú có chiêu, bước 3.5 / BĐ4; đã làm: thanh tẩy ở 3.5, xóa buff ở BĐ4); tuyệt kỹ (Kiếm Trảm Sơn Hà, Quỷ Ảnh Trùng Trùng, Tịnh Thế Lưu Ly) dùng làm bản nhỏ ở vòng 3–4; tên hồn kỹ chưa rõ trong truyện đặt tạm.
  Bot (`GAME_TEST=1`, hook mới `bond`): cả 20 võ hồn có hồn kỹ / tiên cơ riêng; từng hồn kỹ của 5 võ hồn (sát thương nhát đầu đúng công thức, trạng thái, số tầng): Phá giáp cộng dồn 3 tầng qua 6 nhát kiếm trận, Kiếm Trảm Sơn Hà thêm 40% mỗi tầng Phá giáp; Yêu Cung lướt, quật ngã, hút đúng 20%; Thuấn Di xuyên 80 pixel; Vô Địch Kim Thân tăng chí mạng và hồn thú kề bên không gây sát thương lúc bất tử; Bát Đoạn Suất 8 đoạn, hút 25% tổng sát thương, đoạn cuối Choáng; giăng tơ kéo 2 hồn thú về sát thân; lưới độc 6 nhát, Làm chậm, độc 5 tầng, nhát cuối Trói; Thiên La thêm 40% mỗi tầng độc, kéo về, Trói, Cảm điện; Quỷ Mị hút máu, hút huyết (người khác thấy) còn sau khi đổi võ hồn và hồi đúng phần sát thương của võ hồn khác, tăng công / chí mạng, Quỷ Ảnh Trùng Trùng tàng hình (hồn thú bỏ mục tiêu, đổi võ hồn vẫn tàng hình, đánh thường thì hiện hình); Thiên Càn hồi máu, khiên, tăng thủ, Dễ thương + Câm lặng; ràng buộc Hạo Thiên – Nhu Cốt chí mạng +10% (bỏ một võ hồn thì mất), Tà Hỏa – Hỏa Ảnh Thiêu đốt 3 tầng 90 → 108 mỗi giây; tiên cơ riêng cả 5. Bot cũ: bỏ phần thử hồn kỹ chung và tiên cơ chung khống chế (không còn võ hồn nào dùng); bot D thử tiên cơ riêng của Thiên Càn Bạch Ngọc Đỉnh thay Hộ Thể.
- ~~2.6 Danh hiệu, đổi tên hồn thú và tên vùng theo mục 5.3.~~ ➜ **Đã gộp vào BĐ1.**
- [x] **BĐ2** Cổng, lưu bản đồ đang đứng, Thánh Hồn Thôn và Nặc Đinh Thành (thay 6.4; sau BĐ1, phải trước BĐ3).
  - Object `portal`, `arrive`, `safe`, `npc`; tin nhắn `portal` / `travel`; chặn mềm có cảnh báo nguy hiểm; server kiểm tra vị trí và đích.
  - Cột `accounts.map_id` + vị trí (file SQL mới, `PgStore` + `MemoryStore`), `/api/me` trả `mapId` và client truyền `mapId` khi join (thay cách join không kèm `mapId` của BĐ1); thứ tự lưu khi đi cổng theo mục 6; đá phiên trùng qua presence.
  - Bản đồ mới: Thánh Hồn Thôn (làng + 3 vùng săn cấp 1–10, tinh anh thêm ở BĐ4; tài khoản mới và cũ bắt đầu ở đây) và Nặc Đinh Thành (thành an toàn, chỗ đứng cho NPC của 6.1). Cổng Thánh Hồn Thôn ↔ Nặc Đinh Thành ↔ `tinh_dau`.
  *Đã làm:* `007_account_map.sql` thêm `accounts.map_id`, `pos_x`, `pos_y` (NULL = chưa lưu). Store có `getLocation` (ánh xạ bằng `resolveMap`: NULL hoặc mã không còn trong `MAPS` thì về `DEFAULT_MAP` = `thanh_hon_thon`, bỏ vị trí cũ), `saveLocation` (lớp chặn: chỉ ghi khi bản đồ đang lưu, đã ánh xạ, là bản đồ của phòng; `PgStore` viết điều kiện này trong SQL) và `saveTravel` (một transaction: mọi võ hồn có tiến độ chưa lưu, gồm cả võ hồn dự bị vừa nhận kinh nghiệm chia đội của 2.3b, cùng `map_id`/vị trí `arrive`; sai bản đồ đi hoặc võ hồn không thuộc tài khoản thì rollback). Tài khoản cũ có `map_id` NULL nên bắt đầu ở Thánh Hồn Thôn, không cần chuyển dữ liệu trong SQL.
  `MapRoom`: mọi lần ghi DB của một người chơi nối vào chuỗi `saving` (`chain`): lưu định kỳ (bỏ qua người đang chuyển bản đồ), sau hấp thụ, võ hồn vừa rút về khi đổi, đội hình (`persistTeam` thay cặp `teamSaving`/`teamDirty`, vẫn gộp lần đổi dồn dập), `onLeave`, `onDispose`, transaction đi cổng. `travel {portal}`: kiểm tra (cổng thuộc bản đồ này, đang đứng trong cổng, đích có trong `MAPS`, không gục, không hấp thụ), niệm `TRAVEL_CAST` = 1 giây (bị đánh hoặc ra khỏi cổng thì hủy; đang niệm không bắt đầu hấp thụ được), kiểm tra lại, rồi đúng 4 bước của mục 6: cờ `travelling` (bỏ qua input, đánh, hồn kỹ, hấp thụ, đổi võ hồn, xếp đội, `travel`; xóa đạn hồn kỹ còn bay của người đó và không gây sát thương nữa; hồn thú bỏ mục tiêu; không bị đánh), `saveTravel` trong chuỗi lưu, commit thì đặt `travelled` và gửi riêng `travel {mapId}` (không rời trong `TRAVEL_LEAVE_SECS` = 10 giây thì server ngắt với mã 4003), lỗi thì bỏ cờ và báo "Không chuyển được bản đồ, thử lại". `onLeave` chờ chuỗi lưu rồi xét `travelled`. Tin riêng `portal {name, to, toName, level, warn}` gửi khi bước vào / ra khỏi cổng (`name` rỗng = ra khỏi cổng); `warn` khi cấp võ hồn ra trận dưới cấp đề xuất tối thiểu (chặn mềm: vẫn đi được). `onAuth` từ chối (409 "Sai bản đồ") khi bản đồ trong DB khác bản đồ của phòng; vị trí đã lưu kẹt trong ô chặn hoặc ngoài bản đồ thì về `spawn`. Đá phiên trùng qua presence (mục 6).
  Vùng an toàn (`map.inSafe`: object `safe`, hoặc cả bản đồ `town`): không sinh hồn thú, hồn thú không bước vào và bỏ mục tiêu đứng trong đó, đánh thường và hồn kỹ bị từ chối ("Vùng an toàn: không thể giao chiến."). Chiêu tiên cơ (2.4) cũng không tung trong vùng an toàn (đổi tay vẫn được, giữ năng lượng); Thiểm Sát lướt vào vùng an toàn thì không chém. Người đang chuyển bản đồ không gây sát thương nên cả sát thương tiên cơ lẫn năng lượng đều dừng sau lúc transaction đi cổng chụp dữ liệu. Thành không sinh hồn thú. Chưa làm hồi nhanh trong vùng an toàn (5.8).
  `map.ts` đọc `portal` (đích phải có trong `MAPS`, `arrive` phải có ở bản đồ đích và nằm ngoài mọi cổng ở đó, tên cổng không trùng; sai thì cảnh báo và bỏ), `safe`, thuộc tính `level` của cổng (thiếu thì lấy `MAPS[to].level`). `data.ts`: `MAPS` thêm `thanh_hon_thon` (`hunt`, cấp 1–10, 10–450 năm) và `nac_dinh_thanh` (`town`, `level`/`years` = null); `tinh_dau` đổi cấp đề xuất từ 1–100 thành 10–60 (cổng đi Tinh Đấu báo cảnh báo dưới cấp 10); `DEFAULT_MAP` = `thanh_hon_thon`; `parseLevelRange`, `TRAVEL_CAST`, `TRAVEL_LEAVE_SECS`; `BEASTS` thêm 9 loài của Thánh Hồn Thôn (dưới 100 năm bậc tạm 0, từ 100 năm bậc 1).
  Bản đồ (`tools/gen-map.mjs` sinh cả ba; ô của `tinh_dau` giữ nguyên, chỉ thêm cổng về Nặc Đinh Thành ở mép tây doanh trại và thu hẹp doanh trại cho khỏi chồng lên cổng; tileset thêm 4 ô ở chỗ trống: đá lát, mái ngói, tường nhà, ruộng lúa): Thánh Hồn Thôn 72×54 ô, làng 18×14 ô ở giữa có hàng cây bao quanh, 4 nhà, quảng trường (điểm hồi sinh), đường bắc–nam xuống cổng đi Nặc Đinh Thành ở mép nam; Đồng lúa (tây và nam), Bãi tập (đông), Hậu Sơn (bắc). Nặc Đinh Thành 60×40 ô có tường thành, đại lộ đông–tây nối cổng tây (về Thánh Hồn Thôn, đề xuất 1–10) và cổng đông (đi Tinh Đấu, 10–60), 4 nhà. NPC chỉ là biển tên đứng yên (`npc`): Lão Kiệt Khắc, Tố Vân Đào, Ngọc Tiểu Cương (Đại Sư), Thợ rèn, Thương nhân, Đại Đấu Hồn Trường (sắp mở); hoạt động ở 6.1. Bản đồ có thuộc tính `vignette` thì client tối dần theo độ sâu (chỉ `tinh_dau`).
  Client: join bằng `mapId` từ `/api/login` / `/api/me`; gặp "Sai bản đồ" thì hỏi lại `/api/me` và vào lại một lần. Nhận `travel {mapId}` thì rời phòng, hủy Phaser (bộ nghe phím/chuột gắn qua `AbortController` nên gỡ sạch) rồi vào phòng mới và tải đúng file Tiled. Hộp đi cổng (tên đích, cấp đề xuất, cảnh báo đỏ, nút "Đi" / "Vẫn đi" hoặc phím **F**); cổng vẽ khung sáng kèm tên bản đồ đích, NPC vẽ biển tên; tên vùng theo vùng an toàn > vùng săn > điểm hồi sinh > tên bản đồ; bản đồ nhỏ có màu ô mới và cổng.
  Bot: tài khoản mới mỗi lần chạy đi Thánh Hồn Thôn → Nặc Đinh Thành → Tinh Đấu → Nặc Đinh Thành: cổng không có, không đứng trong cổng, rời cổng khi đang niệm, cảnh báo dưới cấp, input bị bỏ qua khi đang chuyển, `/api/me` đổi bản đồ, vào sai bản đồ bị từ chối, xuất hiện đúng điểm `arrive`, thành không có hồn thú và không đánh được, thoát rồi vào lại đúng bản đồ và vị trí, đăng nhập lại thì phiên cũ bị đá, kinh nghiệm võ hồn dự bị nằm trong transaction đi cổng, không hấp thụ được khi đang niệm, đạn hồn kỹ 3 bắn lúc niệm không hạ được hồn thú sau khi đã lưu (cần `GAME_TEST=1`, hook `test {op: "beast"}` đặt hồn thú 1 máu đứng yên). Bot A/B bắt đầu ở Thánh Hồn Thôn, đi theo đường làng ra Bãi tập rồi mới săn. `npm run test:accounts --prefix server` thêm kiểm thử `getLocation` / `saveLocation` / `saveTravel` cho cả hai store. Đã thử với PostgreSQL: tài khoản tạo bằng bản `main` (chưa có cột mới) vào Thánh Hồn Thôn, chạy server hai lần liên tiếp.

**Giai đoạn 3: Túi đồ và hồn hoàn kiểu mới**
- [x] 3.1 Bảng `items`, túi đồ đồng bộ riêng cho chính chủ, giao diện túi đồ.
  *Đã làm:* `008_items.sql`: bảng `items` (mỗi ô một dòng, id `UUID` do server sinh ngay khi món đồ xuất hiện để phòng dùng được trước khi ghi DB; `kind` nhóm vật phẩm, `code` mã trong `ITEMS`, `qty` cho đồ gộp, `years`, `stars`, `enhance`, `stats` JSONB, `vohon_id` khóa ngoại kép tới `vohons(account_id, id)` nên chỉ gắn được vào võ hồn của chính tài khoản, `created_at` giữ thứ tự ô; bật RLS), cột `accounts.hon_te` (Hồn Tệ, số đồng) và cờ `accounts.starter_items`. Mã không còn trong `ITEMS` vẫn giữ dòng (client hiện "Vật phẩm lạ"). Store có `loadBag` (nạp túi; tài khoản chưa nhận quà khởi đầu thì nhận trong cùng transaction, khóa dòng tài khoản nên hai phiên cùng lúc chỉ nhận một lần) và `saveBag` (ghi ảnh chụp cả túi trong một transaction: thêm/sửa ô, xóa ô không còn, Hồn Tệ; id thuộc tài khoản khác hoặc gắn vào võ hồn người khác thì rollback) ở cả `PgStore` lẫn `MemoryStore`; `saveTravel` nhận thêm túi đồ để ghi chung transaction đi cổng.
  `data.ts`: `ITEM_KINDS` (đan, hồn hoàn, hồn cốt, hồn hạch, mảnh võ hồn, tiên thảo; mới có `ITEMS` cho đan), `ITEMS` / `itemDef`, `BAG_SLOTS`, `DAN_CD`, `STARTER_ITEMS`, `BEAST_COIN`, `honTeParts` / `formatHonTe` (số ở mục 5.7, **chờ chốt**). Server: túi đồ và Hồn Tệ nằm trong dữ liệu riêng của người chơi, chỉ gửi qua tin riêng `bag` (không nằm trong schema công khai). `use {id}`: id phải là ô trong túi của chính người gửi; chặn khi gục, đang hấp thụ, đang chuyển bản đồ, còn hồi chiêu chung đan, hoặc sinh lực / hồn lực đã đầy; dùng được khi giao chiến và trong vùng an toàn. Gộp đồ: thêm vào ô cùng mã chưa đầy trước, rồi mở ô mới khi còn chỗ; túi đầy thì phần dư không nhận. **Nguồn đồ tạm ở bước này:** quà khởi đầu (5 + 5 đan, tài khoản mới và cũ, một lần) và Hồn Tệ khi hạ hồn thú (người hạ nhận thẳng, báo trong dòng "Hạ …"); hồn hoàn vẫn rơi xuống đất như cũ đến 3.2, mua đan ở thương nhân để 6.1.
  Lưu: túi đồ và Hồn Tệ có cờ đổi chưa lưu, được ghi trong lần lưu định kỳ, khi rời phòng, khi phòng đóng (đều qua chuỗi `saving`) và trong transaction đi cổng (mục 6, bước 3); ghi lỗi thì đánh dấu lại để lần sau ghi tiếp. Chưa lưu ngay sau mỗi lần dùng đan (như kinh nghiệm võ hồn): đăng nhập lại ở nơi khác trong lúc phiên cũ chưa kịp lưu thì thay đổi cuối của phiên cũ có thể bị phiên mới ghi đè. Hook `test` thêm `give {code, qty}`, `coin {n}`, `drain {pct}`; `rest` trừ cả hồi chiêu đan.
  Client: bảng "Túi đồ" (phím **B** hoặc nút cạnh "Đội hình"; mở bảng này thì đóng bảng kia, Esc đóng cả hai): Hồn Tệ quy đổi kim / ngân / đồng, lưới 40 ô (biểu tượng theo nhóm, số lượng ở góc), chi tiết ô đang chọn và nút "Dùng" (lớp phủ và chữ hồi chiêu chung đan). Chạm dùng được cùng bảng (ẩn gợi ý phím trên điện thoại). Bot: nhận đan khởi đầu, túi chỉ đến chính chủ, từ chối id sai / id của người khác / đã đầy / khi gục / khi đang chuyển bản đồ, dùng Hồi Huyết Đan và Hồi Hồn Đan, hồi chiêu chung, Hồn Tệ khi hạ hồn thú thật, gộp 99 món một ô, túi đầy 40 ô, đi cổng và thoát vào lại vẫn giữ túi đồ. `npm run test:accounts --prefix server` thêm kiểm thử túi đồ cho cả hai store. Đã thử với PostgreSQL: tài khoản tạo bằng bản `main` (chưa có bảng `items`) nhận quà khởi đầu đúng một lần, chạy server hai lần liên tiếp.
- [x] 3.2 Hồn thú có tuổi theo số năm; hồn hoàn rơi thành vật phẩm, nhặt vào túi.
  *Đã làm:* `data.ts`: `MAX_YEARS`, `tierBand`, `rollYears` (phân bố log), `beastStats(years)` (nội suy giữa các mốc `TIERS`), `formatYears`, tên màu trong `TIERS` (`color`), vật phẩm `hon_hoan` (`RING_ITEM`, mỗi chiếc một ô), `DROP_OWNER_SECS` / `DROP_TTL_SECS` (15 / 60 giây, trước viết thẳng trong room), `PICKUP_RANGE`, `absorbSecs` / `ABSORB_RISK` / `ABSORB_FAIL_HP` (luật cũ chuyển vào `data.ts`). Bỏ bậc tạm `tier` của `BEASTS`: loài chọn theo trọng số của vùng, không theo bậc.
  Vùng trong Tiled đọc thuộc tính `years` (`map.ts`; thiếu hoặc sai thì cảnh báo và tung bậc theo `weights` như cũ). Thánh Hồn Thôn đã có `years` từ BĐ2; **khác kế hoạch:** 4 vùng của `tinh_dau` nhận luôn `years` theo bảng 5.3 (Bìa rừng 300–700, Rừng thưa 600–1.200, Rừng cổ thụ 1.500–5.000, Hắc Ám Lâm 15.000–25.000; `MAPS.tinh_dau.years` = 300–25.000) thay cho trộn bậc bằng `weights`, nên Tinh Đấu không còn hồn thú 10 năm hay 10 vạn năm; ô bản đồ giữ nguyên. BĐ3 vẫn tách bản đồ và đổi `beastLevel` sang số năm.
  Server: hồn thú sinh với `years` (đồng bộ `BeastState.years`, bậc suy từ số năm), máu / sát thương / kinh nghiệm theo `beastStats`; mỗi phòng tối đa 1 hồn thú thường 100.000 năm vẫn giữ (đã có thì tung dưới mức đó). Hạ hồn thú: `DropState.years` = tuổi hồn thú, người hạ ưu tiên 15 giây, tồn tại 60 giây. `pickup`: hồn hoàn gần nhất trong `PICKUP_RANGE`, người khác bị từ chối trong 15 giây đầu, túi đầy thì báo và hồn hoàn ở lại; nhặt được thì vào túi (`items.kind` = `hon_hoan`, `items.years` = số năm; không cần SQL mới). `absorb {itemId}`: chỉ hồn hoàn trong túi của chính người gửi, **tạm giữ luật bậc cũ** (bình cảnh, vượt 1 bậc 60% thất bại, vượt 2 bậc không cho) đến 3.3; hồn hoàn nằm trong túi suốt lúc hấp thụ (di chuyển / bị đánh thì hủy, không mất), xong thì rời túi (thất bại là vỡ), võ hồn lưu đúng số năm của hồn hoàn. `discard {id}` bỏ một ô (không bỏ được hồn hoàn đang hấp thụ). Hook `test` thêm `goto {x, y}`, `drops {s}`; `beast` / `spawn` / `kill` nhận `years`, `give` hồn hoàn nhận `years`.
  Client: phím **E** (và nút "Nhặt" trên thanh kỹ năng) là nhặt thay cho hấp thụ dưới đất; hồn hoàn dưới đất có màu theo số năm và ghi số năm bên dưới, hộp nhắc "Hồn hoàn 437 năm (Vàng): nhấn E để nhặt vào túi" hoặc số giây ưu tiên còn lại của người khác; khung mục tiêu ghi "Phong Lang con · 437 năm". Túi đồ: ô hồn hoàn viền màu theo số năm, góc ghi số năm (≥ 1 vạn viết gọn "2,5v"), chi tiết ghi màu và khoảng năm, câu gợi ý hấp thụ theo võ hồn đang ra trận, nút "Hấp thụ" và "Bỏ" (bấm hai lần). HUD ghi giới hạn vòng kế tiếp bằng số năm (ví dụ "tối đa 999 năm").
  Bot: số năm mọi hồn thú nằm trong khoảng vùng (Thánh Hồn Thôn và Tinh Đấu), bậc và máu suy đúng từ số năm, B thấy cùng số năm; hạ hồn thú thật rồi nhặt (đúng số năm trong túi); hạ hồn thú 437 năm (hook) → hồn hoàn 437 năm thuộc A, B bị từ chối, A nhặt; hết 15 giây thì B nhặt được; túi đầy thì báo, bỏ bớt rồi nhặt; B không bỏ / hấp thụ được đồ của A; không hấp thụ được đan, khi chưa bình cảnh, hồn hoàn quá mạnh; hấp thụ xong võ hồn lưu đúng 437 năm; di chuyển thì hủy và hồn hoàn còn trong túi. Đã thử với PostgreSQL (server chạy hai lần liên tiếp, `items.years` lưu đúng).
- [x] **BĐ3** Tách Tinh Đấu thành Ngoại vi và Nội địa, quy cấp theo niên hạn, giảm kinh nghiệm (sau 3.2).
  - `tinh_dau_ngoai_vi` và `tinh_dau_noi_dia`, mỗi bản đồ 4 vùng theo bảng 5.3; vùng chuyển từ `weights` sang `years`. `map_id` cũ `tinh_dau` chuyển thành `tinh_dau_ngoai_vi`.
  - Hàm cấp tương đương từ bảng giới hạn theo năm (`RING_LIMIT` đã có từ 3.3; `beastLevel` vẫn tính theo bậc 10 / 10 / 20 / 40 / 70 bằng bảng tạm `BEAST_LEVEL_BY_TIER`); cổng hiện cấp đề xuất và cảnh báo. Giảm kinh nghiệm 50% / 10% đã có từ 2.3b (`xpLevelScale`, `beastLevel` tính theo bậc): bước này chỉ đổi `beastLevel` sang số năm (`rewardKill` đã nhận số năm từ 3.2).
  - Từ 3.2 các vùng của `tinh_dau` đã khai báo `years` theo bảng 5.3 (cùng tên vùng); khi tách bản đồ chỉ cần chuyển vùng sang đúng bản đồ.
  *Đã làm:* `data.ts`: `MAPS` bỏ `tinh_dau`, thêm `tinh_dau_ngoai_vi` ("Tinh Đấu Ngoại vi", cấp 10–30, 300–2.000 năm) và `tinh_dau_noi_dia` ("Tinh Đấu Nội địa", 30–60, 1.500–25.000); `MAP_MOVED` (`tinh_dau` → `tinh_dau_ngoai_vi`); `beastLevel(years)` = 10 × (vòng đầu tiên có `RING_LIMIT` ≥ số năm), bỏ bảng tạm `BEAST_LEVEL_BY_TIER`; `GATE_CLEAR` = 160 pixel (sau gộp vào `SPAWN_CLEAR`, mục 5.8); `BEASTS` thêm 9 loài còn thiếu của hai bản đồ (Thanh Lân Ngạc, Kim Linh Ưng, Nhân Diện Ma Chu non, Liệt Trảo Hùng, Thiết Giáp Tê Ngưu, Thất Tinh Độc Thiềm, Hắc Vụ Biên Bức, Lam Lôi Tê Ngưu, Lôi Dực Ưng; Quỷ Đằng ngàn năm dùng lại `quy_dang`). Giảm kinh nghiệm 50% / 10% và cấp võ hồn tính tối đa 80 giữ nguyên từ 2.3b (`xpLevelScale`); `rewardKill` chỉ đổi sang `beastLevel(years)`, vẫn áp một lần trước khi chia đội 40/20.
  Bản đồ (`tools/gen-map.mjs`, hàm chung `forest`; xóa `shared/assets/tinh_dau.json`): cả hai 90×60 ô, 4 vùng theo chiều đông đúng bảng 5.3 (loài + `years`), trại cổng ở mép tây (điểm hồi sinh), đường mòn đông–tây. Ngoại vi: Bìa rừng 300–700, Rừng thưa 600–1.200, Khe suối 1.000–1.600 (suối chảy bắc–nam, đường mòn bắc qua), Rìa nội địa 1.400–2.000; cổng tây về Nặc Đinh Thành, cổng đông "Vào Tinh Đấu Nội địa" (đề xuất 30–60) ở trạm gác trống cây. Nội địa: Rừng cổ thụ 1.500–5.000, Đầm sương độc 4.000–12.000 (nhiều đầm nước), Lôi Cốc 10.000–18.000 (thung lũng giữa hai vách cây), Hắc Ám Lâm 15.000–25.000, bờ hồ trung tâm ở mép đông; cổng tây về Ngoại vi (đề xuất 10–30). **Cổng Nội địa → Lõi Tinh Đấu chưa đặt** (`loi_tinh_dau` chưa có trong `MAPS`, BĐ6). Nặc Đinh Thành: cổng đông đổi thành "Đi Tinh Đấu Ngoại vi" (đề xuất 10–30, trước là 10–60). Thuộc tính bản đồ `vignette` thành số (độ tối ban đầu): Ngoại vi 0, Nội địa 0,35. Chưa có tinh anh (`elite`, BĐ4), hang thú vương (`boss`, BĐ5).
  Server: `map.nearGate` (cách cổng hoặc điểm `arrive` dưới `GATE_CLEAR`; nay là hộp `SPAWN_CLEAR` quanh cả trại cổng, mục 5.8): `spawnBeast` không sinh ở đó. `resolveMap` ánh xạ theo `MAP_MOVED`, `PgStore.mapExpr` viết cùng luật trong SQL (lớp chặn `WHERE map_id` nhận cả mã cũ), vị trí cũ bị bỏ nên tài khoản ở `tinh_dau` vào Ngoại vi ở trại cổng; không cần SQL mới. Hook `test` thêm `legacy {mapId, x, y}` (ghi `map_id` cũ qua transaction đi cổng, như tài khoản của bản trước).
  Client: khung mục tiêu ghi "Phong Lang · 437 năm · cấp 20", thêm "kinh nghiệm 50%" / "10%" khi hồn thú thấp hơn võ hồn ra trận; banner vùng ghi cấp tương đương tính từ `years` của vùng ("Hồn thú 300 – 700 năm · cấp 10–20"); hộp cổng ghi "Nguy hiểm: võ hồn ra trận dưới cấp 30!".
  Bot: bảng cấp tương đương theo năm (423 / 424 / 764 / 765 … 50.001 / 100.000) và cột "Cấp" của 8 vùng; hạ hồn thú 1.761 / 1.760 / 764 năm với võ hồn cấp 45 nhận 100% / 50% / 10%, võ hồn cấp 95 (tính 80) với 100.000 / 50.000 năm nhận 100% / 50%, chia 40/20 đúng; tài khoản mới đi Thánh Hồn Thôn → Nặc Đinh Thành → Ngoại vi → Nội địa → Ngoại vi → Nặc Đinh Thành (cấp đề xuất và cảnh báo từng cổng, xuất hiện đúng điểm `arrive`, loài và số năm mọi hồn thú khớp vùng, không hồn thú nào sát cổng, Nội địa không có cổng tới bản đồ chưa mở; đoạn Ngoại vi → Nội địa dùng hook `goto` tới trạm gác phía đông); tài khoản ghi `map_id` = `tinh_dau` thì `/api/me` / `/api/login` trả Ngoại vi, vào ở trại cổng, rời phòng ghi được vị trí mới. `npm run test:accounts --prefix server` thêm kịch bản `tinh_dau` cho cả hai store. Đã thử với PostgreSQL (kiểm thử store, bot, server chạy hai lần trên cùng DB).
- [x] 3.3 Hấp thụ từ túi đồ: giới hạn theo truyện, tỉ lệ thất bại, thất bại thì mất hồn hoàn. Mở đủ 10 vòng, cấp tối đa 100.
  *Đã làm:* `data.ts`: `RING_LIMIT` / `ringLimit(slot)` (số năm tối đa theo vòng, bảng 5.2; thay luật bậc cũ), `ABSORB_FAIL` + `absorbChance(năm, vòng)` (giới hạn, % vượt làm tròn lên, tỉ lệ thất bại hoặc `null` = không cho), `ABSORB_SECS` + `absorbSecs(năm)` (3–15 giây theo log10 số năm), `MAX_LEVEL` = 100, `xpBlocked` (bình cảnh hoặc cấp tối đa); bỏ `ABSORB_RISK` / `ABSORB_FAIL_HP`. `beastLevel` giữ kết quả theo bậc bằng bảng tạm đến BĐ3. Không cần SQL mới (`vohons.rings` đã là mảng số năm).
  Server: `absorb {itemId, vohonId}` chọn được **võ hồn bất kỳ trong bộ sưu tập** (kể cả không ở trong đội), kiểm tra hồn hoàn thuộc túi và võ hồn thuộc chính người gửi, võ hồn đủ 10 vòng / chưa bình cảnh, đang giao chiến (`TEAM_COMBAT_SECS`), vượt > 100% thì từ chối; kết quả do server tung lúc xong (`finishAbsorb`), thất bại chỉ mất hồn hoàn. Xong (thành công hay thất bại) thì lưu ngay qua chuỗi lưu (`save`), cả khi võ hồn nhận hồn hoàn không ra trận (đánh dấu `dirty`). Tin riêng `absorbing` (bắt đầu / kết quả) cho thanh tiến độ và thông báo. Hồn kỹ vòng 5–10 **chưa làm** (8.1): vòng 5+ chỉ tăng chỉ số. Hook `test` thêm `roll {r}` (cố định số ngẫu nhiên 0–100, −1 bỏ cố định) và `rush` (kết thúc hấp thụ ngay bằng `finishAbsorb`); `set` nhận cấp tới 100.
  Client: nút "Hấp thụ…" trong túi đồ mở bảng chọn võ hồn: mỗi võ hồn một dòng (cấp, vòng kế tiếp và giới hạn, "trong giới hạn · chắc chắn thành công" hoặc "vượt 18% · 30% thất bại", hoặc lý do không chọn được); chọn rồi mới xác nhận, ô xác nhận đỏ "Thất bại thì MẤT hồn hoàn này" khi có rủi ro, nút "Chấp nhận 30% rủi ro, hấp thụ". Thanh tiến độ ghi hồn hoàn, võ hồn, tỉ lệ thất bại và số giây; banner "Hấp thụ thành công" / "Hấp thụ thất bại". HUD ghi "Vòng 3: giới hạn 1.760 năm, cấp 30", đủ 10 vòng thì "Đủ 10 hồn hoàn" và thanh kinh nghiệm "Cấp tối đa 100".
  Bot: bảng giới hạn, ngưỡng % vượt (528 / 529 / 634 / 846 / 847 năm ở vòng 1), thời gian 3 / 9 / 15 giây; chưa bình cảnh, đồ / võ hồn của người khác, đan, đang giao chiến bị từ chối; vượt 101% bị từ chối và hồn hoàn còn trong túi; trong giới hạn thành công cả khi cố định số ngẫu nhiên 0 (chờ đúng 3 giây thật); vượt 18% với số ngẫu nhiên 0,10 thì thất bại, mất hồn hoàn, cấp / vòng / sinh lực không đổi; vượt 100% với 0,99 thì thành công; di chuyển và bị đánh thì hủy không mất; hấp thụ vào võ hồn không ra trận; cấp 100 + 9 vòng hấp thụ 100.000 năm lên đủ 10 vòng, không nhận thêm kinh nghiệm, vòng 11 bị từ chối. Đã thử với PostgreSQL (server chạy hai lần liên tiếp; 10 vòng lưu đúng trong `vohons.rings`).
- [x] 3.4 Mảnh võ hồn rơi theo bản đồ (bảng "Rơi đặc trưng" ở 5.3), mở võ hồn mới và lên sao.
  *Đã làm:* `data.ts`: `MapDef.shards` (mã võ hồn rơi mảnh, theo bảng "Rơi đặc trưng" 5.3; **cả bản đồ dùng chung một danh sách**, vùng không khai báo riêng vì 5.3 ghi theo bản đồ), mảnh là `ITEMS` sinh từ `VOHON` (mã `shardCode(id)` = `manh_<id>`, `kind` = `manh_vo_hon`, `vohon` trỏ về võ hồn), `SHARD_DROP` + `shardChance(năm)` (10% / 15% / 20% / 100% theo bảng rơi 5.3), `SHARD_QTY` (1), `SHARD_STACK` (999), `SHARD_UNLOCK` (50), `MAX_STARS` (6), `STAR_COST` + `starCost(sao)` (20 / 40 / 80 / 120 / 200), `STAR_STAT` + `starMult(sao)` (+5% mỗi sao trên 1, **chờ chốt**), `calcStats` nhận thêm `stars`. Không cần SQL mới (`vohons.stars`, `items` đã có).
  Server: hạ hồn thú thì `rollShard` tung tỉ lệ, mảnh vào thẳng túi người hạ kèm dòng "Nhận 1 Mảnh Nhu Cốt Thố (12/50)"; túi đầy thì phần dư thành `DropState` có `item` / `qty` (trường mới) cạnh hồn hoàn, ưu tiên người hạ 15 giây, `pickup` nhặt được cả mảnh. Message `unlock {vohon}` (võ hồn chưa có, đủ 50 mảnh; trừ mảnh ngay, rồi trong chuỗi lưu `store.unlockVohon` thêm dòng `vohons` cấp 1 và ghi cả túi **trong một transaction**; DB lỗi hoặc đã có thì trả mảnh) và `starup {vohon}` (võ hồn đã có, chưa 6★, đủ mảnh theo `starCost`; đổi trong bộ nhớ, tính lại chỉ số nếu đang ra trận, rồi trong chuỗi lưu `store.saveVohonsBag` ghi võ hồn và túi trong một transaction). Cả hai chặn khi đang chuyển bản đồ; dùng được cả khi giao chiến. Hook `test` thêm `shard {r, i}` (cố định số ngẫu nhiên rơi mảnh 0–100 và võ hồn được chọn).
  Client: bảng đội hình (V) hiện sao trên thẻ võ hồn (★ vàng, ☆ nhạt) và mục "Mảnh võ hồn": mỗi võ hồn đã có hoặc đang có mảnh một dòng (sao, "x/50 mảnh" hoặc "x/ngưỡng mảnh lên n★", thanh tiến độ, nút Mở / Lên sao sáng khi đủ, "Tối đa" ở 6★), cuối là bản đồ nào rơi mảnh của võ hồn nào. Túi đồ: ô mảnh màu võ hồn, nút "Mở / lên sao…" mở bảng đội hình. Mảnh dưới đất vẽ thành viên tinh thể màu võ hồn kèm tên. Bấm chuột và chạm đều được.
  Bot: bảng giá sao, tỉ lệ rơi, mỗi bản đồ săn có 2–3 võ hồn hợp lệ; số ngẫu nhiên 0,99 không rơi, 0,05 rơi đúng 1 mảnh vào túi người hạ; túi đầy thì mảnh rơi xuống đất, người khác không nhặt được trong 15 giây, bỏ bớt rồi nhặt được; mở võ hồn thiếu mảnh (1, 49), võ hồn không tồn tại / đã có, người khác bị từ chối; đủ 50 thì mở (cấp 1, 1★, trừ đúng 50); lên sao thiếu mảnh bị từ chối, 20 mảnh lên 2★, lên tới 6★ rồi dừng không mất mảnh; võ hồn ra trận lên sao thì sinh lực tối đa tăng; vào lại thì sao từng võ hồn (cả võ hồn mới mở) còn nguyên. Đã thử với PostgreSQL (server chạy hai lần liên tiếp).
  **Để sau:** hiệu ứng hồn kỹ mở theo sao; mảnh từ rương tà hóa thú vương (BĐ5, kể cả mảnh UR), boss thế giới (BĐ6) và nhiệm vụ; mảnh của bản đồ GĐ8 (Lạc Nhật, Cực Bắc, Hải Thần Đảo) khi có bản đồ.
- [x] 3.5 Chiêu có báo trước cho hồn thú từ 1.000 năm trở lên (theo loài trong `BEASTS`).
  *Đã làm:* `data.ts`: `BeastSkillDef`, `BEAST_SKILLS` (21 loài: mọi loài của vùng có hồn thú từ 1.000 năm ở Ngoại vi / Nội địa, thêm Phong Lang và Tử Văn Báo để dành cho tinh anh; bảng ở 5.3, **chờ chốt**), `beastSkillOf(loài, năm)`, `BEAST_SKILL_YEARS` (1.000), `TELE_WARN` (0,8), `TELE_FIRST` (1,5–3 giây), `TELE_PAD` (4), `Tele` + `teleHits` (hàm thuần tính trúng vệt / nón / vòng), `PLAYER_STATUS`; `StatusDef.noSkill`: Câm lặng chuyển từ `noAtk` sang `noSkill`; `SkillDef.self.cleanse` (tiên cơ Xúc Xích giải khống chế, tiên cơ Thiên Càn Bạch Ngọc Đỉnh "thanh tẩy đội" của 2.5d).
  Server: `BData.skills` (danh sách chiêu kèm hồi chiêu, hồn thú thường 0–1 chiêu, chỗ để tinh anh BĐ4 có 2), `skT`, `cast`; `beginCast` / `tickCast` / `cancelCast` / `fireCast`: báo trước thì `BeastState.cast` bật, gửi `fx tele` (hình đã khóa, thời lượng), hết giờ gửi `fx teleHit` (danh sách người trúng, vệt lao) rồi gây sát thương qua `hurtPlayer` và trạng thái qua `applyPStatus`; bị Choáng / Câm lặng / Mê hoặc thì `fx teleEnd`. Trạng thái trên hồn sư: `PData.st`, `PlayerState.st` (uint16, bit theo `STATUS_IDS`), `tickPStatus` (Trúng độc / Thiêu đốt mỗi giây, hết khi vào vùng an toàn), `pctl` chặn đi / đánh / hồn kỹ; `hurtPlayer` trả về đòn có trúng không, tính Dễ thương / Phá giáp, lan Cảm điện giữa hồn sư. Hook `test`: `spawn` nhận `species`, mới `tele {i}`, `pst {s, n, secs}`; hồn thú của `beast` không có chiêu.
  Client: vùng cảnh báo trên mặt đất (nền đỏ mờ cả vùng, phần đỏ đậm đầy dần từ gốc / từ tâm, viền nhấp nháy nhanh dần), tên chiêu đỏ trên đầu hồn thú; lúc tung vùng chớp sáng, vệt lao, rung màn hình nếu mình trúng. Sheet PixelLab giữ khung đầu `attack` khi `cast` rồi chạy 2 khung ra đòn (`BEAST_ANIMS.attack` đọc `TELE_WARN`); hồn thú vẽ bằng code thì phồng lên co lại. Hồn sư: dây trói dưới chân, sao choáng, biểu tượng trạng thái trên danh hiệu; HUD thêm ô trạng thái viền đỏ.
  Bot: mọi loài từ 1.000 năm ở Ngoại vi / Nội địa có chiêu, `teleHits`; đứng trong vòng thì trúng sau 0,8 giây với sát thương đúng khoảng; dịch ra (hook `goto`) hoặc chạy bộ ra khỏi vùng trước khi tung thì không trúng; đứng mép trong làng, nằm trong vòng của hồn thú ngoài làng cũng không trúng; vệt Phun Độc gây Trúng độc và mất máu mỗi giây, bước ngang thì né được; Phun Tơ Trói hồn sư không đi được tới khi hết giờ; Câm lặng trên hồn thú ngắt chiêu; 999 năm không có chiêu; hồn thú tự tung chiêu khi có mục tiêu; Câm lặng trên hồn sư chặn hồn kỹ; tiên cơ Xúc Xích giải Trói và Câm lặng, tiên cơ Thiên Càn thanh tẩy Trúng độc và Làm chậm. Kiểm tra 2.5a đổi theo luật Câm lặng mới (hồn thú kề bên vẫn đánh thường); kiểm tra 2.5d giữ hồn thú "đứng yên, không đánh, chưa Choáng" bằng Trói + Mê hoặc thay cho Trói + Câm lặng.
  **Khác thiết kế / để sau:** vũng độc của Thất Tinh Độc Thiềm thay bằng Trúng độc 3 tầng; chưa kéo / đẩy người chơi; thời gian khống chế trên hồn sư không giảm (chưa có kháng); thú vương báo trước dài hơn làm ở BĐ5.
- [x] **BĐ4** Tinh anh (sau 3.5): mỗi vùng 1 con (object `elite`, bảng `BOSSES`), máu x2,5, sát thương x1,5, 2 chiêu báo trước, aura riêng, hiện trên bản đồ nhỏ, hồi sinh ngẫu nhiên 8–12 phút; máu tăng theo số người tham gia (5.4). Thưởng hồn cốt x3 tỉ lệ (đã nối với 4.1) và chắc chắn rơi hồn hạch (đã nối với 5.1).
  *Đã làm:* luật ở mục 4 "Tinh anh" và 5.4, chiêu ở bảng tinh anh 5.3; số chưa ghi trong thiết kế là đề xuất **(chờ chốt)**. `data.ts`: `BOSSES` + `bossIndex`, `RANK_NAMES`, `ELITE`, `BOSS_HP_PER_PLAYER` / `bossHpMult`, `beastBase` / `beastName` (loài gốc và tên theo `rank`), `BEAST_BUFF_IDS` / `BEAST_BUFFS` / `beastBuffBit`, `ELITE_RAGE`; `BeastSkillDef` thêm `count` / `spread` / `step` (nhiều vùng), `summon`, `pull`; `teleZones` (hàm thuần khóa các vùng); `SkillDef.dispel` (Thiên Càn Trấn Áp). `map.ts` đọc object `elite` (mã phải là tinh anh trong `BOSSES`, tâm trong một vùng, mỗi tên vùng 1 con; sai thì cảnh báo và bỏ); `tools/gen-map.mjs` đặt 11 object `elite`.
  Server: ô tinh anh `elites` (sinh khi mở phòng; bị hạ hoặc bị hook xóa thì hồi sinh sau 480–720 giây, báo cả phòng bằng tin `elite {k: "spawn"}`, hạ thì `elite {k: "down"}`), `addBeast(…, rank)`, `BData.elite` (máu gốc, số người áp vào máu, người tham gia, đóng góp, chờ Cuồng nộ), `eliteJoin` (gọi trong `damageBeast` trước khi trừ máu) / `eliteScale` / `tickElite` / `eliteReset` / `dispelBeast`; `beastDmg` (Cuồng nộ) cho đánh thường và chiêu; `BData.cast.teles` (nhiều vùng; fx `tele` / `teleHit` gửi vùng đầu như 3.5, các vùng khác trong `parts`), `pullPlayer`, `summonPack`. `rewardKill` nhận hệ số kinh nghiệm. Hồn cốt: `rollBone(người hạ, người ưu tiên, loài gốc, …, ELITE.bone)` dùng `boneChance(năm, mult)` của 4.1. Hook `test`: `elite` (mọi ô tinh anh: chỗ sinh, chỉ số, người tham gia, Cuồng nộ, giây chờ hồi sinh), `etick {s}` (chạy luật tinh anh như đã trôi s giây), `erespawn {s}` (rút thời gian chờ hồi sinh), `clear {keep}` (giữ tinh anh), `beast {boss}` (tinh anh 1 máu ngoài ô tinh anh, để thử thưởng).
  Client: sprite loài gốc phóng 1,25, tên "Tinh anh …" màu aura trên đầu, aura vẽ bằng code (vầng sáng dưới chân + đốm sáng bay lên, đỏ và đập nhanh khi Cuồng nộ), nháy đỏ khi Cuồng nộ, chấm sáng 3×3 nhấp nháy trên bản đồ nhỏ; khung mục tiêu hiện tên tinh anh và "Cuồng nộ"; vùng cảnh báo nhiều phần; fx `rage` / `dispel`; banner + dòng log khi tinh anh xuất hiện, dòng log khi bị hạ.
  Bot: mỗi vùng của 3 bản đồ săn đúng 1 `elite` hợp lệ; `bossHpMult` đúng bảng; `teleZones` 3 vòng thành hàng / 3 vệt tỏa quạt; 3 tinh anh Thánh Hồn Thôn có chỗ sinh trong chữ nhật, ngoài làng và `SPAWN_CLEAR`, niên hạn = mức trên của vùng, máu x2,5, sát thương x1,5, đủ 2 chiêu; giao chiến 1 người; máu dưới 50% nổi Cuồng nộ; người thứ hai vào giữa trận: máu tối đa x1,6, máu giữ tỉ lệ; Thiên Càn Trấn Áp xóa Cuồng nộ, không nổi lại ngay; ở ngoài bán kính 30 giây bị loại, máu giảm giữ tỉ lệ; rời phòng thì bị loại nhưng số người chỉ giảm sau 10 giây; 15 giây không ai trong bán kính thì bỏ giao chiến, hồi đầy; 2 chiêu báo trước đúng tên / hình, Dậm Đất trúng với sát thương x1,5; Hú Bầy gọi đủ 2 sói con, gọi lại không vượt; hạ thì hồn hoàn đúng số năm thuộc người đóng góp, báo cả phòng, chờ hồi sinh trong 8–12 phút, hook rút ngắn thì hồi sinh ở đúng chỗ, đầy máu, báo cả phòng. `checkBeastYears` hiểu tinh anh. Hồn cốt x3: bảng `boneChance(năm, ELITE.bone)`; cùng số ngẫu nhiên 0,02 thì Phong Lang thường 1.500 năm (1%) không rơi, Tinh anh Huyết Nhãn Phong Lang 1.500 năm (3%) rơi hồn cốt Phong Lang đúng vị trí, số năm, thuộc người hạ; số ngẫu nhiên 0,04 thì tinh anh không rơi.
  **Khác thiết kế / để sau:** chiêu nhiều nhát nối tiếp làm bản tối thiểu (bảng 5.3); hồi máu / khiên cho người khác chưa tính là tham gia; chưa có sprite riêng (dùng loài gốc, M4).

**Giai đoạn 4: Hồn cốt**
- [x] 4.1 Hồn cốt rơi theo bảng ở mục 5.3, nằm trong túi đồ.
  *Đã làm:* `data.ts`: `BONE_ITEM` (`hon_cot`, một mục trong `ITEMS`, `stack` 1), `BONE_SLOTS` (6 vị trí: mã cố định, tên, chủ động / bị động, chỉ số chính và hệ số), `boneSlotIndex`, `BONE_DROP` + `boneChance(năm)` (0% / 1% / 4% / 20% theo bảng rơi 5.3), `boneStats(vị trí, năm)` (chỉ số gốc, bảng ở 5.5, **chờ chốt**), `BONE_STAT_NAMES`, `parseBone(stats)`, `boneName(loài, vị trí, năm)`. **Không cần SQL mới**: bảng `items` (3.1) đã có `years`, `enhance`, `stats` JSONB (`{beast, slot}`), `vohon_id`; túi đồ đã nằm trong chuỗi lưu và transaction đi cổng.
  Server: hạ hồn thú thì `rollBone` tung tỉ lệ (sau hồn hoàn và mảnh võ hồn); trúng thì `DropState` có `item` = `hon_cot`, `years`, `tier` và trường mới `species` / `slot`, rơi cạnh hồn hoàn (lệch 8 pixel nếu đứng được), báo "Hồn cốt … rơi xuống đất!" cho người hạ. **Rơi xuống đất chứ không vào thẳng túi** (khác mảnh võ hồn): theo luật đồ rơi hiện có của hồn hoàn (người hạ ưu tiên 15 giây, tồn tại 60 giây). `pickup` nhặt được hồn cốt (`addBone`: một ô mới, cường hóa +0, chưa gắn), túi đầy thì báo và hồn cốt ở lại. Hồn cốt không dùng như đan, không hấp thụ như hồn hoàn; `discard` bỏ được. Hook `test` thêm `bone {r, s}` (cố định số ngẫu nhiên rơi hồn cốt và vị trí); `beast` nhận `species` (mã loài); `give` hồn cốt nhận `years`, `beast`, `slot`.
  Client: túi đồ hiện hồn cốt bằng biểu tượng 6 vị trí vẽ bằng điểm ảnh (`client/src/boneIcons.ts`: SVG trong ô túi, texture `bone_<vị trí>` dưới đất), màu theo niên hạn, số năm ở góc ô; chi tiết ô: "Loài – Vị trí, N năm", vị trí và kiểu kỹ năng, màu niên hạn, chỉ số gốc, cường hóa, "Chưa gắn". Dưới đất: biểu tượng phóng đôi kèm nhãn "Hồn cốt Tay phải"; đứng gần thì gợi ý nhặt ghi đủ tên.
  Bot: bảng tỉ lệ, 6 vị trí, chỉ số tăng theo số năm, tên hồn cốt; số ngẫu nhiên 0,99 không rơi; dưới 1.000 năm không rơi; hạ Ám Kim Khủng Trảo Hùng 32.000 năm (số ngẫu nhiên 0, vị trí Tay phải) → hồn cốt dưới đất đúng loài / vị trí / số năm / người hạ, B bị từ chối 15 giây, A nhặt → túi có đúng loài, vị trí, số năm, +0, chưa gắn; không dùng / hấp thụ được; vị trí ngẫu nhiên hợp lệ, mỗi món một ô; túi đầy thì báo và ở lại, bỏ bớt rồi nhặt được; vào lại còn nguyên 3 hồn cốt; C mang hồn cốt đi cổng 5 lần, thoát vào lại, đăng nhập lại vẫn còn (so cả loài / vị trí / cường hóa). Đã thử với PostgreSQL (server chạy hai lần liên tiếp; `items.stats` lưu `{"slot", "beast"}`, JSONB đổi thứ tự khóa nên bot so sau khi sắp khóa).
  **Để sau:** kỹ năng (4.3), cường hóa (4.4); hồn cốt trong rương thú vương / boss thế giới (BĐ5, BĐ6). Ưu tiên nhặt theo phiên (sessionId) như hồn hoàn: người hạ thoát rồi vào lại thì mất quyền ưu tiên của đồ đang nằm dưới đất.
- [x] 4.2 Gắn hồn cốt vào 6 vị trí của võ hồn, cộng chỉ số.
  *Đã làm:* **Không cần SQL mới**: cột `items.vohon_id` (008, khóa ngoại tới `vohons(account_id, id)` nên chỉ gắn được võ hồn của chính tài khoản) và chuỗi lưu túi đồ (lưu định kỳ, rời phòng, transaction đi cổng) có từ 3.1; hồn cốt đang gắn vẫn là một dòng `items`, không bao giờ bị xóa khi gục / thua. `data.ts`: `boneBonus(hồn cốt)` cộng chỉ số chính từng vị trí, `calcStats` nhận thêm `bones` (cộng phẳng sau hệ số hệ và sao, **chờ chốt**).
  Server: message `equip {itemId, vohonId, slot?}` / `unequip {itemId}` (`equipBone` / `unequipBone`): kiểm tra hồn cốt và võ hồn thuộc người gửi, đúng vị trí (sai ô thì báo "Hồn cốt Tay phải chỉ gắn vào ô Tay phải…"), cùng luật xếp đội (`boneLock`: không gục, không hấp thụ, ngoài giao chiến `TEAM_COMBAT_SECS`), không đang chuyển bản đồ; ô đã có thì đổi chỗ (món cũ về túi, số ô túi không đổi), tháo khi túi đầy thì từ chối; hồn cốt đang gắn trên võ hồn khác phải tháo trước. `recalc` và `maxHpOf` (sinh lực võ hồn dự bị) cộng `boneBonusOf`; gắn / tháo trên võ hồn ra trận thì chỉ số đổi ngay (sinh lực / hồn lực hiện có giữ nguyên, kẹp theo tối đa mới), đổi võ hồn thì theo hồn cốt của võ hồn mới. Hook `test` thêm `stats {rowId}` (chỉ số gốc, có hồn cốt, phần cộng thêm, chỉ số đang dùng).
  Client: mục "Hồn cốt" trong bảng đội hình (phím V): chọn võ hồn trong danh sách thả xuống, 6 ô quanh hình hồn sư của mình phóng thích võ hồn đó (ghép từ texture trên bản đồ), ô có hồn cốt màu theo niên hạn kèm số năm; dưới là sinh lực / hồn lực / công kèm "(+N hồn cốt)". Chọn ô thì xem hồn cốt đang gắn (nút "Tháo về túi") và lọc hồn cốt cùng vị trí trong túi (nút "Gắn", dùng được cả chuột lẫn chạm); chuột kéo hồn cốt trong túi thả vào ô cũng gắn (sai ô thì server từ chối và báo). Túi đồ có nút "Gắn…" mở thẳng mục này. Đang giao chiến thì có dòng nhắc.
  Bot: `boneBonus`; chưa gắn thì chỉ số = gốc; sai ô, ô lạ, võ hồn không thuộc mình, `vohonId` không phải số, vật phẩm không phải hồn cốt, đang giao chiến đều bị từ chối; gắn Tay phải 32.000 năm (công +30, không chiếm ô túi), Đầu 12.000 năm (hồn lực tối đa tăng ngay khi đang ra trận); đổi chỗ hai lần; không gắn thẳng hồn cốt đang ở võ hồn khác; gắn cho võ hồn không ra trận chỉ cộng võ hồn đó, đổi ra trận thì chỉ số theo võ hồn mới, đổi về như cũ; võ hồn gục vẫn giữ hồn cốt; túi đầy thì tháo bị từ chối; tháo giữ cường hóa, hồn lực về như cũ; hồn cốt đang gắn không bỏ được; vào lại vẫn gắn và vẫn cộng; C gắn hồn cốt rồi đi cổng 5 lần, thoát vào lại, đăng nhập lại vẫn gắn (`bagKey` so cả `vohon`).
  **Để sau:** kỹ năng hồn cốt (4.3), cường hóa (4.4, chỉ số cộng thêm theo cấp); gắn thẳng từ võ hồn này sang võ hồn khác không qua túi; tách chỉ số hồn cốt thành dòng riêng trong HUD chỉ số khi đang chơi.
- [x] 4.3 Kỹ năng chủ động (đầu, hai tay) và bị động.
  *Đã làm:* **Không cần SQL mới** (kỹ năng tính từ loài + vị trí + số năm trong `items.stats` / `items.years`). `data.ts`: `BONE_SKILLS` (30 loài, mỗi loài 1 chủ động + 1 bị động, bảng ở 5.5), `BONE_ACTIVE_SLOTS`, `boneSkillOf(loài, vị trí)`, `bonePassive(hồn cốt)` (nhân `buffPower`, trần `BONE_PASSIVE_CAP`), `passiveText`; mọi số **chờ chốt**.
  Server: message `boneskill {i}` → `boneSkill` (võ hồn ra trận phải có hồn cốt chủ động ở ô đó; chặn khi gục, hấp thụ, đang chuyển bản đồ hoặc niệm cổng, vùng an toàn, Choáng / Câm lặng, hết hồn lực, không có hồn thú trong tầm với kỹ năng một mục tiêu), chạy `runSkill` với `skillPower` / `buffPower` theo số năm hồn cốt, tạo năng lượng tiên cơ như hồn kỹ; hồi chiêu `PlayerState.bcds` (3 ô, thuộc hồn sư). Bị động `PData.passive` tính trong `recalc` (gắn / tháo trên võ hồn ra trận, đổi võ hồn, vào game), cộng qua `buffV` (công, tốc chạy, giảm sát thương nhận, chí mạng, giảm tiêu hao, hút máu) và kháng trạng thái trong `applyPStatus`. Hook `test`: `ready` đặt lại cả `bcds`, `stats` trả `live.passive`.
  Client: 3 nút Z / X / C bên trái thanh hồn kỹ (biểu tượng vị trí hồn cốt vẽ bằng điểm ảnh, màu niên hạn, chữ biểu tượng kỹ năng ở góc, lớp phủ hồi chiêu, tooltip tên hồn cốt + mô tả, hồn lực, hồi chiêu, sức mạnh); ô chưa gắn thì mờ, bấm thì server báo lý do. Bị động hiện thành ô viền nét đứt dưới hiệu ứng có lợi (`#bpas`, tooltip số thật). Bảng hồn cốt (phím V): tên kỹ năng trong mỗi ô, chi tiết ô ghi kỹ năng và phím; danh sách hồn cốt trong túi và chi tiết ô túi đồ ghi tên kỹ năng. Chạm: 3 nút nhỏ xếp dọc. fx `bone`: vòng sáng màu niên hạn và tên kỹ năng bay lên.
  Bot: mọi loài có đủ 2 kỹ năng, vị trí chủ động / bị động, kỹ năng theo loài, bị động tăng theo số năm và chạm trần; gắn Tay trái Mạn Đà La Xà và Thân Thiết Giáp Tê Ngưu cạnh Tay phải Ám Kim Khủng Trảo Hùng (4.2): bị động đúng `bonePassive`, hook `hurt` mất ít hơn đúng phần giảm; C (Ám Kim Vỗ Đất) trúng và Choáng hồn thú cạnh bên, fx `bone`, tốn đúng hồn lực, hồi chiêu riêng (Z / X không đổi), bấm lại khi hồi chiêu không tung; X gây Trúng độc 2 tầng; Z (ô Đầu trống) báo lý do; Câm lặng và vùng an toàn chặn (không tốn hồn lực, không hồi chiêu); tháo Thân thì hết bị động ngay.
  **Để sau:** cường hóa nâng kỹ năng (4.4); kỹ năng hồn cốt của tổ đội / PvP (5.9); chưa thử bằng bot trường hợp đang chuyển bản đồ (dùng chung cờ `travelling` với hồn kỹ).
- [ ] 4.4 Cường hóa hồn cốt bằng hồn cốt dư.

**Giai đoạn 5: Hồn hạch**
- [x] 5.1 Hồn hạch rơi với sao 1–6, chỉ số chính và phụ ngẫu nhiên.
  *Đã làm:* `data.ts`: `CORE_ITEM` (`hon_hach`, một mục trong `ITEMS`, `stack` 1), `CORE_SETS` (9 bộ của bảng 5.6: mã cố định, tên, lưu phái, màu, chữ hiệu ứng 2 / 4 món), `coreSetIndex`, `MapDef.cores` (bộ đặc trưng theo bảng "Rơi đặc trưng" 5.3), `CORE_STATS` / `CORE_STAT_IDS` (8 chỉ số), `CORE_STAR_K`, `CORE_SUBS`, `CORE_SUB_ROLL`, `CORE_DROP` + `coreChance` / `coreStarBand` (bảng rơi 5.3), `CORE_STAR_W`, `CORE_MAP_SET`, `rollCore` / `rollCoreStats` (hàm thuần nhận hàm ngẫu nhiên; tùy chọn `high` lấy sao cao nhất của khoảng cho rương thú vương), `coreMainValue`, `coreSubMax`, `parseCore`, `coreName`, `coreStatText` (số liệu ở 5.6, **chờ chốt**). **Không cần SQL mới**: bảng `items` (3.1) đã có `stars`, `enhance`, `stats` JSONB, `vohon_id`; túi đồ đã nằm trong chuỗi lưu và transaction đi cổng.
  Server: hạ hồn thú thì `rollCoreDrop` tung tỉ lệ (sau hồn cốt); tinh anh chắc chắn rơi. Sao, bộ, chỉ số chính / phụ tung ngay lúc rơi, giữ ở `coreDrops` (theo id đồ rơi, xóa khi nhặt hoặc hết hạn); `DropState` thêm `stars`, `cset` (chỉ số trong `CORE_SETS`) để ai cũng thấy tên và sao dưới đất. Hồn hạch rơi bên phải hồn hoàn (lệch 16 pixel; không đứng được thì ngay dưới, rồi chồng lên hồn hoàn), cùng luật đồ rơi (người hạ / người đóng góp nhiều nhất với tinh anh ưu tiên 15 giây, tồn tại 60 giây), báo "Hồn hạch … rơi xuống đất!". `pickup` nhặt vào túi (`addCore`: một ô mới, +0, chưa gắn), túi đầy thì báo và hồn hạch ở lại. Không dùng như đan, không hấp thụ, không gắn vào ô hồn cốt; `discard` bỏ được. Hook `test` thêm `core {r, stars, set}` (cố định số ngẫu nhiên rơi, sao, bộ); `give` hồn hạch nhận `stars`, `set`.
  Client: biểu tượng viên hạch 11×11 điểm ảnh vẽ bằng code, màu bộ và hình riêng mỗi bộ (`client/src/coreIcons.ts`: SVG trong ô túi, texture `core_<bộ>` dưới đất); ô túi ghi số sao ở góc; chi tiết ô: tên "Hồn hạch Bộ N★", bộ và lưu phái, sao và số dòng phụ, chỉ số chính, từng dòng phụ, nâng cấp +0, "Chưa gắn", hiệu ứng bộ 2 / 4 món (chữ). Dưới đất: viên hạch phóng 1,3 lần kèm nhãn tên; đứng gần thì gợi ý nhặt.
  Bot: bảng tỉ lệ / khoảng sao, 9 bộ, bộ đặc trưng 3 bản đồ, chỉ số chính tăng theo sao, tên và dòng chỉ số; tung 5.000 lần bằng hàm thuần (sao đúng khoảng, đủ mọi sao, số dòng phụ đúng, không trùng, giá trị trong khoảng, tỉ lệ bộ đặc trưng gần kỳ vọng); trong game: số ngẫu nhiên 0,99 không rơi, 437 năm rơi 1–2★ thuộc A, B bị từ chối 15 giây, A nhặt đúng sao / bộ / số dòng phụ, không dùng / hấp thụ / gắn được; 1.500 / 12.000 / 100.000 năm mỗi mức 3 lần đúng khoảng 2–4★ / 3–5★ / 5–6★; `give` 1★…6★ đúng số dòng phụ; túi đầy thì báo và ở lại, bỏ bớt rồi nhặt được; tinh anh cùng số ngẫu nhiên 0,99 vẫn rơi, số ngẫu nhiên thật rơi 3/3; vào lại còn nguyên; C mang hồn hạch 6★ đi cổng 5 lần, thoát vào lại, đăng nhập lại vẫn còn nguyên chỉ số.
  **Để sau:** gắn 6 ô, hiệu ứng bộ và cộng chỉ số vào võ hồn (5.2); nâng cấp (5.3). Rương tà hóa thú vương (BĐ5, chưa có trong main) gọi `rollCore(năm, MAPS[…].cores, Math.random, { high: true })` rồi `addCore` vào túi (chú thích ở `rollCoreDrop`); boss thế giới "mọi bộ" (BĐ6). Ưu tiên nhặt theo phiên như hồn hoàn.
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
  *Một phần (PR #14):* dây chuyền `tools/assets` (normalize, pack, validate trong `npm run check` và pre-commit, preview) và skill `asset-gen`. Ảnh PixelLab trong manifest: bộ kiểu tóc 0 `hs_body_{m,f}_0`, `hs_outfit_{m,f}_0`, `hs_hair_{m,f}_0` (lúc PR #14 thân là `hs_body_{m,f}`), 3 hướng, `idle` + `walk`; `attack`/`cast`/`hurt`/`die`/`absorb` đang chép tạm khung idle. Còn: 3 kiểu tóc mỗi giới, 5 animation còn lại.
  *Chốt ghép lớp (mục 8, câu 9 phương án (b)):* key hồn sư đổi sang bộ giới × kiểu tóc `hs_{body,outfit,hair}_{m,f}_{0–3}` (`honsuKey` trong `sprites.ts`; `textures.ts` vẽ bằng code mọi bộ chưa có ảnh, GameScene chạy animation trên `hs_body_{giới}_{kiểu tóc}`). Ảnh PixelLab hiện có là bộ kiểu tóc 0: `body_{m,f}.png` đổi tên thành `body_{m,f}_0.png`, manifest `hs_body_{m,f}_0`. `pack --set <giới>_<kiểu tóc>` ghi cả 3 lớp của bộ; `validate` báo lỗi bộ thiếu lớp và kiểm chân theo từng bộ. Kiểu tóc 1–3 nay vẽ cả thân, áo, tóc bằng code (trước đây thân và áo là ảnh thật kiểu 0, tóc vẽ bằng code nên lệch nét). Còn 6 bộ kiểu tóc 1–3; ngân sách PixelLab chỉ còn khoảng 15 lượt (không nâng gói, mục 5.11) nên phần thiếu vẽ bằng code hoặc chỉnh tay.
- [ ] M3 Lớp phụ thể: Lam Ngân Thảo và 4 võ hồn mẫu (mỗi hệ một: Hạo Thiên Chùy, U Minh Linh Miêu, Bích Lân Xà Hoàng, Cửu Bảo Lưu Ly Tháp), rồi các võ hồn còn lại.
  *Một phần (PR #14):* `vh_lam_ngan_thao_b` / `_f` bản thử: thảm dây dưới chân, một hình cho mọi hướng và khung; chưa có dây quấn tay.
- [ ] M4 Hồn thú: 5 bậc theo bảng kích thước; sau bước BĐ1 (đã gộp 2.6) vẽ theo từng loài ở mục 5.3, ưu tiên 4 bản đồ của bản đầu. Tinh anh dùng sprite loài gốc kèm aura; thú vương 96×96.
  *Một phần:* ảnh PixelLab cho 3 loài của vùng Bìa rừng (`tinh_dau`): `beast_phong_lang`, `beast_man_da_la_xa`, `beast_tu_van_bao`, khung 32×32 theo niên hạn ở 5.3 (bậc trăm năm, không theo bậc tạm trong `BEASTS`), gốc (16, 28), đủ 13 khung (`idle` khung 2 do `pack --breathe`, nay chạy được cho hồn thú). Mạn Đà La Xà: `walk`/`attack` chuyển động nhỏ, `die` chưa nằm hẳn, nên vẽ lại khi có lượt. **Đã hiện trong game:** GameScene dùng sheet `beast_{loài}` (`syncBeastSprite`, anim `idle`/`walk`, gốc (0,5; 28/32)); trạng thái hung hăng tạm tô đỏ nhẹ; thanh máu và sao choáng đặt theo mép trên khung ảnh thật. Loài chưa có ảnh vẫn vẽ `b{tier}_{khung}` bằng code. Chưa dùng `attack`/`hurt`/`die` vì server chưa gửi các trạng thái đó. Còn: các loài khác của 5.3, tinh anh, thú vương.
- [ ] M5 Giao diện thẻ võ hồn: chân dung 64×64 cho 20 võ hồn, khung thẻ SR/SSR/UR, biểu tượng 4 hệ. Cần trước khi làm giao diện đội hình đẹp ở 2.3.

**Kỹ thuật (làm khi cần)**
- [ ] Dự đoán chuyển động phía client (client-side prediction) để đỡ trễ khi ping cao.
- Thay sprite vẽ bằng code bằng ảnh thật: đã tách thành nhóm **Mỹ thuật** (M1–M5) ở trên.
- [ ] Nhiều kênh khi một phòng quá 60 người. (Từ BĐ1, `filterBy(["mapId"])` tự mở phòng mới khi phòng đầy; còn thiếu hiển thị kênh và cho chọn kênh.)
- [x] Giới hạn số lần đăng nhập sai và tin nhắn chat để chống dò mật khẩu và spam. (`server/src/ratelimit.ts`, lưu RAM: sai 5 lần cùng (tên, IP), 30 lần/tên từ mọi IP hoặc 20 lần/IP thì khóa 1 phút, gấp đôi mỗi lần tới tối đa 30 phút; chat 5 tin liền rồi 1 tin/2 giây, tối đa 120 ký tự, chặn lặp cùng nội dung trong 30 giây. Deploy sau proxy thì đặt `TRUST_PROXY=1`. Kiểm thử: `npm run test:ratelimit --prefix server`.)

## 8. Câu hỏi còn mở
1. **Sưu tầm võ hồn:** mảnh võ hồn, cộng với lễ thức tỉnh tặng Lam Ngân Thảo và cho tự chọn 1 SSR (mục 5.1), có ổn không?
   - **Trả lời:** thức tỉnh tự do: tặng Lam Ngân Thảo và tự chọn 1 võ hồn SSR bất kỳ trong danh sách SSR (không phải "chọn 1 trong 3"). Đã làm ở bước 2.2.
   - Hạo Thiên Chùy, Cửu Bảo Lưu Ly Tháp… xếp độ hiếm gì (UR?) và lấy bằng cách nào?
   - Chủ nhân của Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa, Hỏa Ảnh, Thiên Càn Bạch Ngọc Đỉnh là ai? (Ảnh hưởng chân dung thẻ võ hồn, mục 5.11.)
2. **Đội hình:** 4 võ hồn và cách chia kinh nghiệm 40/20/20/20 có ổn không?
   - **Trả lời:** đồng ý: đội 4 võ hồn, chia kinh nghiệm 40/20/20/20. Đội hình làm ở bước 2.3a, chia kinh nghiệm ở 2.3b.
3. **Hồn kỹ vòng 8–10:** muốn thiết kế thế nào?
4. **Giới hạn hồn hoàn vòng 5–10:** con số trong bảng mục 5.2 cần đối chiếu lại với truyện.
5. **Kinh tế:** có cho giao dịch giữa người chơi và PvP ngoài rừng không?
6. **Nền tảng:** ưu tiên điện thoại hay máy tính? Đội 4 võ hồn và nhiều phím kỹ năng sẽ khó điều khiển trên điện thoại.
   - **Trả lời:** ưu tiên máy tính; có bản điện thoại thì càng tốt. Giao diện mới phải dùng được bằng cả chuột lẫn chạm.
7. **Mỹ thuật:** 6 màu tóc và 6 màu áo có đủ không? Có thêm tông da, kiểu áo khác (đồng phục Sử Lai Khắc, áo Vũ Hồn Điện) không? Ai vẽ phần nào?
   - **Trả lời (nguồn ảnh):** dùng ảnh PixelLab qua dây chuyền `tools/assets` trực tiếp trong game (mục 5.11, Đã chốt: mỹ thuật nhân vật).
8. **Bản đồ và boss** (phần đã chốt ở dưới; đây là các điểm người viết thiết kế tự đề xuất, cần xác nhận):
   - Giờ boss thế giới (đề xuất 21:00) và luân phiên Thái Thản Cự Viên / Thiên Thanh Ngưu Mãng theo ngày.
     - **Đã chốt:** boss thế giới xuất hiện lúc 21:00 giờ Việt Nam (mục 5.4).
   - Hệ số sát thương: thú vương x2, boss thế giới x3. Kinh nghiệm tinh anh x2,5.
   - Có giới hạn số người tham gia tối đa khi tính máu boss không? (đề xuất: không; xem lại nếu boss quá trâu khi phòng đông.)
   - Ngưỡng rương 3% khó đạt khi trên khoảng 30 người cùng đánh: có hạ thành min(3%, 1 / (2 × số người)) không?
     - **Đã chốt:** giữ ngưỡng cố định 3% sát thương để nhận rương, không hạ theo số người.
   - Hồi máu và khiên cho người tham gia có tính vào đóng góp không? (đề xuất: có, để phụ trợ không bị thiệt.)
   - Thánh Hồn Thôn có tinh anh nhưng không có thú vương; cấp võ hồn tính tối đa 80 khi so với cấp tương đương (vì vòng 8–10 cùng giới hạn 100.000 năm).
     - **Đã chốt:** cấp võ hồn tính tối đa 80 khi so cấp để giảm kinh nghiệm (mục 5.3; đã có trong code từ BĐ3, `XP_LEVEL_CAP`).
   - Thưởng boss thế giới: tỉ lệ hồn hoàn đỏ cho người không đứng đầu (đề xuất 10%) và tỉ lệ hồn cốt.
   - Tỉ lệ rơi mảnh UR từ rương thú vương trước BĐ6 (đề xuất 5%), hay giữ khóa UR cho tới boss thế giới.
     - **Đã chốt:** rương thú vương rơi mảnh UR 5% trước BĐ6 (mục 5.3).
9. **Ghép lớp hồn sư với ảnh PixelLab** (bản thử PR #14, mục 5.11). Hai hướng đã xét:
   - (a) Giữ như 5.11: một lớp thân chung mỗi giới, tóc 4 kiểu và áo là lớp riêng. Cần thân không có lỗ (đầu trọc, mặc áo lót), PixelLab khó vẽ khớp từng khung animation.
   - (b) Vẽ liền thân + áo + tóc cho mỗi tổ hợp giới × kiểu tóc (8 bộ), rồi `normalize --split` tách 3 lớp từ cùng một hình; tóc và áo vẫn ở dải xám để đổi màu, phụ thể vẫn tách lớp. Key thân và áo khi đó cần thêm chỉ số kiểu tóc (ví dụ `hs_body_m_2`). Mỗi bộ idle + walk 3 hướng tốn khoảng 5 lượt PixelLab.
   - **Trả lời (đã chốt):** chọn **(b)**. Key theo bộ `hs_{body,outfit,hair}_{m,f}_{kiểu tóc}` (ví dụ `hs_body_f_2`, `hs_outfit_f_2`, `hs_hair_f_2`), quy cách ở mục 5.11. Viền ngoài `#1a1020` giữ nguyên khi hoán màu tóc/áo. Không nâng gói PixelLab: dùng tiết kiệm khoảng 15 lượt trial còn lại, phần thiếu vẽ bằng code hoặc chỉnh tay.
10. **Hồn kỹ riêng (bước 2.5a, mục 5.1 / 5.2):** các đề xuất cần xác nhận:
   - Tên, hiệu ứng và con số của 20 hồn kỹ và 5 tiên cơ riêng; có muốn bám sát hồn kỹ trong truyện hơn không (ví dụ Lam Ngân Thảo: Triền Nhiễu, Ký Sinh, Lam Ngân Tù Lung, Chu Võng Thúc Phược).
   - Câm lặng trên hồn thú: từ 3.5 chỉ chặn và ngắt chiêu báo trước (trước đó chặn cả đánh thường). "Tê liệt" của Kim Vũ Miêu Ưng (Trói + Câm lặng) vì thế không còn chặn đánh thường khi hồn thú kề bên: có đổi thành Choáng không?
   - Chiêu báo trước của hồn thú (3.5): bảng chiêu, kích thước, bội số, hồi chiêu, thời gian chờ chiêu đầu 1,5–3 giây, trạng thái trên hồn sư (thời gian khống chế không giảm theo gì) đều chờ chốt.
   - Phá giáp tạm là nhận thêm sát thương đòn trực tiếp, chờ hồn thú có chỉ số thủ.
   - Hiệu ứng có lợi của hồn kỹ phụ trợ chỉ cho chính mình hay cả người chơi đứng gần (trước khi có tổ đội 7.1)?
   - Hồn thú hồi 4% sinh lực mỗi giây khi bỏ mục tiêu 6 giây (mới thêm để Trúng độc giảm hồi máu có tác dụng).
   - Vô Địch Thần Quang dùng làm tiên cơ riêng (bản nhỏ 2,5 giây) hay để dành cho tuyệt kỹ vòng 10.
   - Cân bằng: Vạn Xà Phệ Tâm với 5 tầng độc mạnh khoảng 1,5 lần Hồn Vực; hồn kỹ phụ trợ không gây sát thương nên không tạo năng lượng tiên cơ.
11. **Hồn kỹ lưu phái Thiêu đốt (bước 2.5b):** cần xác nhận:
   - Tên và con số 20 hồn kỹ, 5 tiên cơ riêng (mục 5.2); tên hồn kỹ trong truyện của Hỏa Long (Hỏa Vô Song), Hỏa Ảnh, Nguyệt Nhận (Tà Nguyệt) chưa rõ nên đang đặt tạm.
   - Lãnh vực phượng hoàng: +30% có nhân `buffPower` theo số năm không (đang nhân, 5.000 năm thành +44%); đi theo hồn sư hay cố định chỗ tung.
   - Viêm bạo nổ phần còn lại × 1,5 với 5 tầng ≈ 7,5 lần công × sức mạnh; Hỏa Long đặt lại 1 tầng ngay sau khi nổ.
   - Bay chỉ là hiệu ứng (kèm bất tử ngắn). Có cần "đang bay thì hồn thú cận chiến không đánh tới" không?
   - Có thêm trạng thái Làm chậm (Kỳ Nhung Thông Thiên Cúc, Yêu Hồ, Huyền Băng Thiềm) thay cho Trói ngắn không.
     - **Đã làm ở 2.5c:** có trạng thái Làm chậm (Yêu Hồ, 40%); Kỳ Nhung Thông Thiên Cúc vẫn dùng Trói ngắn cho tới khi chốt.
12. **Hồn kỹ lưu phái Cảm điện (bước 2.5c):** cần xác nhận:
   - Tên và con số 20 hồn kỹ, 5 tiên cơ riêng (mục 5.2); chủ nhân và hồn kỹ trong truyện của Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa chưa rõ nên đặt tạm; hồn kỹ Xúc Xích lấy theo xúc xích của Áo Tư Tạp (Khôi Phục Đại Hương Tràng, Phi Hành Hương Tràng, Phục Chế Hương Tràng), thứ tự vòng chưa khớp truyện.
   - Phong Lôi Chi Lực: tự tung khi đầy (đang làm) hay để người chơi bấm; mức tích +4 / +10, ×2 khi trúng hồn thú Cảm điện; Lôi Động Minh Thiên 300% + 100% lên hồn thú Cảm điện.
   - Mị hoặc 3 tầng → Mê hoặc 2,5 giây; Phong ấn 3 tầng → Dễ thương 6,8 giây (thiết kế ghi "cộng dồn gây Dễ thương 6,8 giây"); Mê hoặc có bị phá khi hồn thú trúng đòn không (đang không).
   - "Tê liệt" có thành trạng thái riêng (co giật: chập chờn đứng / đi) thay cho Trói + Câm lặng không.
   - Phục Chế: chép hồn kỹ của võ hồn trong đội mình (đang làm) hay của người chơi khác đứng gần (khi có tổ đội 7.1); hệ số 0,8.
   - Tàng hình: hồn thú bỏ mục tiêu kể cả khi bị đánh; có giới hạn không (ví dụ bị đánh trúng thì hiện hình).
13. **Hồn kỹ 5 võ hồn còn lại và ràng buộc (bước 2.5d):** cần xác nhận:
   - Tên và con số 20 hồn kỹ, 5 tiên cơ riêng (mục 5.2); tên hồn kỹ trong truyện của Cửu Tinh Thất Sát Kiếm, Tử Vong Chu Hoàng, Quỷ Mị, Thiên Càn Bạch Ngọc Đỉnh chưa rõ nên đặt tạm.
   - Hút huyết của Quỷ Mị: tính cả sát thương theo thời gian và lan Cảm điện (đang tính), chỉ hồi võ hồn ra trận hay cả đội.
   - "Xóa buff địch" của Thiên Càn Bạch Ngọc Đỉnh: từ BĐ4 hồn kỹ Thiên Càn Trấn Áp xóa mọi hiệu ứng có lợi của hồn thú (hiện chỉ có Cuồng nộ của tinh anh); có nên chuyển sang hồn kỹ / tiên cơ khác không. "Thanh tẩy đội" (từ 3.5) đang là tiên cơ giải mọi trạng thái của hồn sư; có cần thêm vào hồn kỹ không.
   - Ràng buộc: danh sách cặp đầy đủ và mức hiệu ứng; cần cả hai trong đội (đang làm) hay cả hai chưa gục / một trong hai đang ra trận.
14. **Tinh anh (bước BĐ4, mục 5.4, bảng tinh anh ở 5.3):** cần xác nhận:
   - Cuồng nộ: máu dưới 50%, 10 giây, sát thương +30%, tốc độ +25%, chờ 20 giây sau khi hết / bị xóa; kinh nghiệm x2,5 chỉ cho người hạ.
   - Con số 22 chiêu tinh anh; chiêu nhiều nhát nối tiếp đang tung cùng lúc / gộp bội số; Hú Bầy hồi 12 giây, tối đa 2–3 con còn sống.
   - Loài gốc mượn cho Ảnh Trảo Linh Miêu (Tử Văn Báo) và Lam Điện Lôi Tích (Lam Lôi Tê Ngưu), hay thêm loài mới vào `BEASTS`.
   - Hồi máu / tạo khiên cho người khác tính là tham gia: cần hồi máu sang hồn sư khác (tổ đội 5.9) trước.
15. **Kỹ năng hồn cốt (bước 4.3, mục 5.5):** cần xác nhận:
   - Phím Z / X / C (phương án khác H / K / L gần J); một kỹ năng mỗi loài cho cả 3 ô chủ động (gắn 3 hồn cốt cùng loài thì 3 nút cùng kỹ năng) hay đầu và tay khác nhau.
   - Tên, hiệu ứng và số của 30 cặp kỹ năng (bảng 5.5); mặc định 18 hồn lực / 10 giây; sức mạnh chủ động theo `skillPower` như hồn kỹ, bị động theo `buffPower`; các trần cộng dồn `BONE_PASSIVE_CAP`.
   - Hồi chiêu thuộc hồn sư (đổi võ hồn không làm mới) hay thuộc từng võ hồn.

**Đã chốt sau review PR #8** (chi tiết ở mục 5.3, 5.8, 6 và BĐ1)
- **Thánh Hồn Thôn có `kind` = `hunt`**; khu làng là vùng `safe` (không sinh hồn thú, không giao chiến). Chỉ Nặc Đinh Thành và Thiên Đấu Thành là `town`.
- **Đi cổng:** lưu của mỗi người chơi chạy nối tiếp (chuỗi `saving`). Phòng cũ đánh dấu client đang chuyển bản đồ, chờ lần lưu đang chạy xong, lưu đầy đủ nhân vật cùng `map_id`/vị trí mới trong một transaction và chờ ghi xong rồi mới gửi `travel`. Client đang chuyển thì lưu định kỳ của phòng cũ bỏ qua người đó; `onLeave` chờ transaction đi cổng: commit rồi thì không ghi, lưu lỗi thì lưu như thường.
- **BĐ1:** chỉ có một bản đồ; server dùng bản đồ mặc định trong `MAPS`, client join không kèm `mapId` và nhận `mapId` từ state của phòng, không từ `/api/me`. `/api/me` trả `mapId` từ BĐ2.
- Điểm `arrive` nằm ngoài mọi vùng `portal`. Lượt nhận thưởng boss đặt lại lúc 00:00 giờ `Asia/Ho_Chi_Minh`.

**Đã chốt: mỹ thuật nhân vật** (chi tiết ở mục 3 và 5.11)
- Người chơi có **nhân vật hồn sư riêng**, chọn **nam hoặc nữ** khi tạo tài khoản. Trên bản đồ là hồn sư; võ hồn đang ra trận hiện dạng **phụ thể khi phóng thích** (vũ khí, thú hồn, cánh, hào quang) cùng vòng hồn hoàn dưới chân. Đổi võ hồn thì đổi lớp phụ thể. Nhân vật truyện chỉ dùng cho chân dung và thẻ võ hồn.
- Sprite **32×32, 4 hướng, chibi pixel RPG**, cao khoảng 2 ô bản đồ.
- Nguồn asset: **PixelLab (AI) qua dây chuyền `tools/assets` (normalize, pack, validate), dùng thẳng trong game**; Aseprite chỉ để chỉnh tay khi cần. Ghi nguồn từng key trong `art/CREDITS.md`. (Chốt sau bản thử PR #14; trước đó là "AI chỉ làm concept, vẽ lại bằng Aseprite".)
- Tùy biến: nam/nữ, 4 kiểu tóc mỗi giới, vài màu tóc và màu áo; asset **ghép theo lớp** (thân, áo, tóc, phụ thể võ hồn).
- **Ghép lớp theo bộ giới × kiểu tóc** (chốt câu 9, mục 8): mỗi bộ vẽ liền thân + áo + tóc rồi tách tự động thành 3 lớp, key `hs_{body,outfit,hair}_{m,f}_{kiểu tóc}`; tóc và áo dải 4 xám để hoán màu, viền ngoài `#1a1020` không bị hoán; phụ thể võ hồn là lớp riêng.
- **PixelLab không nâng gói** (trial còn khoảng 15 lượt): dùng tiết kiệm, phần thiếu vẽ bằng code hoặc chỉnh tay.

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
