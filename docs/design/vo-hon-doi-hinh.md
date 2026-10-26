# Võ hồn và đội hình

Võ hồn, hệ, độ hiếm, ràng buộc, sưu tầm, đội hình và tiên cơ. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`). Số issue ở cuối file.

## 5.1 Võ hồn và đội hình

### Mỗi võ hồn sở hữu
- Cấp (1–100) và kinh nghiệm; sao (1–6).
- 10 ô hồn hoàn, 6 ô hồn cốt, 6 ô hồn hạch.
- 4 ô hồn kỹ mang theo; số tiên thảo đã dùng.

### 4 hệ
Biểu tượng ở góc thẻ võ hồn; hệ số chỉ số theo hệ ở `HE`.
- **Cường công:** sát thương chính, thường diện rộng hoặc bùng nổ.
- **Mẫn công:** nhanh, cơ động, đánh liên tục hoặc lao vào hàng sau.
- **Khống chế:** choáng, trói, gom quái, gây dễ thương hoặc trúng độc.
- **Phụ trợ:** hồi máu, khiên, tăng chỉ số, hồi hồn lực, thanh tẩy.

### Độ hiếm
SR, SSR, UR (`RARITY_MULT`). UR chỉ dành cho Hạo Thiên Chùy và Cửu Bảo Lưu Ly Tháp (mảnh chỉ có ở rương boss thế giới).

### Danh sách võ hồn
`VOHON`: mã cố định, hệ, độ hiếm, chủ nhân, lưu phái, màu; thêm võ hồn mới vào cuối mảng. Chủ nhân để trống khi truyện không ghi rõ (không bịa nhân vật gốc; chân dung vẽ theo hình võ hồn). Bảng dưới tóm tắt lối đánh; dữ liệu thật ở `VOHON`.

| Võ hồn | Hệ | Độ hiếm | Chủ nhân | Lối đánh | Lưu phái |
|---|---|---|---|---|---|
| Cửu Tinh Thất Sát Kiếm | Cường công | SSR | Kiếm Đấu La Trần Tâm | Kiếm trận diện rộng liên tục, chồng Phá giáp rồi chém theo tầng; tuyệt kỹ Kiếm Trảm Sơn Hà | Phá giáp |
| Lam Điện Bá Vương Long | Cường công | SSR | Ngọc Thiên Hằng | Sấm sét diện rộng gây Cảm điện, đánh mục tiêu Cảm điện đau hơn; Phong Lôi Chi Lực, Lôi Động Minh Thiên | Cảm điện (lõi) |
| Kỳ Nhung Thông Thiên Cúc | Cường công | SSR | Cúc Đấu La Nguyệt Quan | Cánh hoa sát thương liên tục, hạn chế di chuyển (Trói ngắn), hồi chiêu ngắn lấp khoảng cho võ hồn bùng nổ | Thiêu đốt / Phá giáp |
| Tà Hỏa Phượng Hoàng | Cường công | SSR | Mã Hồng Tuấn | Bay, Thiêu đốt diện rộng, lãnh vực phượng hoàng | Thiêu đốt (lõi) |
| U Minh Linh Miêu | Mẫn công | SSR | Chu Trúc Thanh | Tốc độ, chí mạng cao, cào liên hoàn; tuyệt kỹ U Minh Bách Trảo | Chấn động |
| Nguyệt Nhận | Mẫn công | SSR | Tà Nguyệt | Lướt xuyên hàng, khóa và hạ mục tiêu yếu máu | Thiêu đốt / Phá giáp |
| Hỏa Long | Mẫn công | SSR | Hỏa Vô Song | Tầm xa phạm vi rộng, khó trượt; Viêm bạo kích nổ Thiêu đốt | Thiêu đốt |
| Nhu Cốt Thố | Mẫn công | SSR | Tiểu Vũ | Lướt, quật ngã, chí mạng, hút máu, Mị hoặc | Chấn động |
| Kim Vũ Miêu Ưng | Mẫn công | SSR | – | Bay, vuốt "tê liệt" (Choáng + Câm lặng), áo nghĩa phủ Cảm điện cả vùng | Cảm điện |
| Tử Vong Chu Hoàng | Khống chế | SSR | Bỉ Bỉ Đông | Giăng tơ gom quái, giam, độc nhện | Trúng độc / Cảm điện |
| Bích Lân Xà Hoàng | Khống chế | SSR | Độc Đấu La Độc Cô Bác | Trúng độc cộng dồn, Câm lặng diện rộng, đòn theo tầng độc, hút máu | Trúng độc (lõi) |
| Càn Khôn Hỗn Nguyên Tỏa | Khống chế | SSR | – | Bay tới tạo vùng phong tỏa, giam; Phong ấn cộng dồn thành Dễ thương | Cảm điện |
| Hỏa Ảnh | Khống chế | SSR | – | Choáng, đẩy lùi, Thiêu đốt, gây Dễ thương cho đồng đội đánh | Thiêu đốt |
| Yêu Hồ | Khống chế | SSR | Hồ Liệt Na | Mị hoặc cộng dồn, ảo ảnh tàng hình, lãnh vực làm chậm, ngắt chiêu | Cảm điện |
| Xúc Xích (Hương Tràng) | Phụ trợ | SSR | Áo Tư Tạp | Hồi sinh lực / hồn lực, thanh tẩy, xúc xích bay; áo nghĩa Phục Chế | Cảm điện |
| Quỷ Mị | Phụ trợ | SSR | Quỷ Đấu La | Hút huyết, tăng công đội, tàng hình cả đội | Bùng nổ |
| Thiên Càn Bạch Ngọc Đỉnh | Phụ trợ | SSR | – | Hồi máu, khiên, giảm sát thương, thanh tẩy; Dễ thương / Phá giáp và xóa buff lên boss | Đánh boss |
| Lam Ngân Thảo | Khống chế | SR | Đường Tam | Trói, gom quái, gây Dễ thương; tặng từ đầu game | Chấn động |
| Hạo Thiên Chùy | Cường công | UR | Đường Hạo | Sát thương theo % máu, Phá giáp, hất tung | Chấn động |
| Cửu Bảo Lưu Ly Tháp | Phụ trợ | UR | Ninh Vinh Vinh | Tăng công / tốc / thủ, giảm tiêu hao; tuyệt kỹ Vô Địch Thần Quang | Thiêu đốt |
| Phá Hồn Thương | Cường công | SSR | – | Thương lướt đâm xuyên hàng, chồng Phá giáp, "phá hồn" Câm lặng | Phá giáp |
| A Ngân | Phụ trợ | SSR | A Ngân (Lam Ngân Hoàng) | Hồi máu, khiên, tăng chỉ số đội, thanh tẩy; dây Lam Ngân trói, gây Dễ thương | Chấn động |
| Liệt Hỏa Thương Lang | Mẫn công | SR | – | Lao vồ, cắn xé chồng Thiêu đốt, tiếng tru tăng tốc, khóa mục tiêu yếu máu | Thiêu đốt |
| Băng Phượng Hoàng | Khống chế | SSR | Thủy Băng Nhi | Bay, băng phong diện rộng (đóng băng = Choáng), Làm chậm, Dễ thương | Băng phong |
| Bạch Hổ | Cường công | SSR | Đái Mộc Bạch | Hộ thân rồi vồ: luồng quang hất lùi, Kim Cương Biến tăng công thủ, chấn đất Choáng + Phá giáp; tuyệt kỹ chấn cả vùng; dung hợp kỹ U Minh Bạch Hổ | Chấn động |

### Võ hồn ngoài danh sách SSR cơ bản (chỉ mở bằng mảnh)
- Lam Ngân Thảo (tặng từ đầu game), Hạo Thiên Chùy, Cửu Bảo Lưu Ly Tháp và các võ hồn thêm sau không có trong lựa chọn thức tỉnh: `AWAKEN_CHOICES` là các SSR cơ bản, trừ `SHARD_ONLY_VOHON` (gồm `EXTRA_VOHON` và Bạch Hổ). Các võ hồn này chỉ mở bằng mảnh.
- Mảnh Bạch Hổ rơi ở Tinh Đấu Nội địa (`MapDef.shards`) và trong thưởng Đại Đấu Hồn Trường như các võ hồn khác.
- **Bạch Hổ:** hồn kỹ vòng 1–3 theo truyện (Hộ Thân Chướng, Liệt Quang Ba, Kim Cương Biến); các hồn kỹ còn lại ghi "phỏng theo" trong tên vì chưa kiểm được thứ tự và tên gốc. Số đặt ngang các SSR cường công khác (tuyệt kỹ ngang Kiếm Trảm Sơn Hà, Chân Thân ×1,2 vòng 9).

### Ràng buộc
`BONDS`, `bondsOf`, `bondSum`: hai võ hồn của một cặp cùng nằm trong đội (ô bất kỳ, kể cả đang gục) thì võ hồn nào ra trận cũng hưởng; cùng loại hiệu ứng từ nhiều cặp thì cộng. Bảng đội hình hiện dòng "Ràng buộc".

| Cặp | Tên | Loại hiệu ứng |
|---|---|---|
| Hạo Thiên Chùy + Nhu Cốt Thố | Hạo Thiên – Nhu Cốt | Chí mạng mọi đòn trực tiếp |
| Tà Hỏa Phượng Hoàng + Hỏa Ảnh | Tà Hỏa – Hỏa Ảnh | Thiêu đốt do hồn sư gây mạnh hơn (tính lúc gây) |
| Lam Ngân Thảo + Hạo Thiên Chùy | Song Sinh Võ Hồn | Sức mạnh hồn kỹ ô U / I / O / P (cả sát thương lẫn mức hiệu ứng) |
| A Ngân + Lam Ngân Thảo | Lam Ngân Hoàng | Hồi máu và khiên do hồn sư tạo (cả phần lan cho tổ đội); hút máu và đan không đổi |
| Băng Phượng Hoàng + Hỏa Long | Băng Hỏa Lưỡng Nghi | Sát thương lên hồn thú đang Choáng hoặc Thiêu đốt; không áp cho đối thủ ở đấu trường |
| Cửu Bảo Lưu Ly Tháp + Cửu Tinh Thất Sát Kiếm | Thất Bảo Lưu Ly Tông | Công (cộng với hiệu ứng tăng công) |

### Lưu phái đội hình mẫu
- **Thiêu đốt:** Tà Hỏa Phượng Hoàng + Hỏa Long + Hỏa Ảnh + Cửu Bảo Lưu Ly Tháp (chồng tầng rồi đổi tay vào Hỏa Long kích nổ).
- **Cảm điện:** Lam Điện Bá Vương Long + Kim Vũ Miêu Ưng + Càn Khôn Hỗn Nguyên Tỏa + Xúc Xích (phủ Cảm điện cả vùng rồi đổi sang Lam Điện).
- **Chấn động:** Hạo Thiên Chùy + Nhu Cốt Thố + Lam Ngân Thảo + Quỷ Mị.
- **Trúng độc:** Bích Lân Xà Hoàng + Tử Vong Chu Hoàng + Nguyệt Nhận + Thiên Càn Bạch Ngọc Đỉnh.

### Sưu tầm võ hồn (không có gacha)
- **Lễ thức tỉnh** (một lần, khi tài khoản chưa có võ hồn; Tố Vân Đào làm lễ): nhận Lam Ngân Thảo (`AWAKEN_GIFT`) và **tự chọn 1 võ hồn** trong `AWAKEN_CHOICES`; server kiểm tra lựa chọn và tung hồn lực bẩm sinh (cấp 1 đến `AWAKEN_LEVEL.max`, xác suất `AWAKEN_LEVEL.maxChance` ra thẳng cấp tối đa, còn lại lệch về cấp thấp theo `AWAKEN_LEVEL.curve`; = cấp khởi đầu của cả hai). Không có thức tỉnh lại, không bao giờ xóa võ hồn.
- Võ hồn khác mở bằng **mảnh võ hồn** (vật phẩm `manh_<mã>`, gộp `SHARD_STACK` một ô): rơi từ hồn thú (mỗi bản đồ săn rơi mảnh của vài võ hồn riêng, mục 5.3 "Rơi đặc trưng"), rương thú vương, rương boss thế giới, thưởng Đại Đấu Hồn Trường, nhiệm vụ, và đổi bằng Hồn Tệ ở Thương hội Thiên Đấu (mảnh SR / SSR, có trần mỗi ngày; mục 5.7).
- Bảng đội hình (V), mục "Mảnh võ hồn": đủ `SHARD_UNLOCK` mảnh của võ hồn chưa có thì **Mở** (võ hồn mới cấp 1, 1★, vào bộ sưu tập, không tự vào đội); võ hồn đã có dùng mảnh để **Lên sao** tới `MAX_STARS` (`STAR_COST`).
- **Sao:** mỗi sao trên 1 cộng % sinh lực, hồn lực, công gốc (`STAR_STAT`, không đổi tốc độ); cộng % sức mạnh hồn kỹ vòng 1–4 và tiên cơ riêng (`STAR_SKILL`, `starSkillMult`); từ `STAR_CD_STARS` sao giảm hồi chiêu hồn kỹ vòng 1–4 (`starCdMult`); ở `STAR_TIEN_CO_STARS` sao tiên cơ riêng mạnh thêm (`starTienCoMult`). Hồn kỹ vòng 5–10, Chân Thân, tiên cơ chung, kỹ năng hồn cốt không đổi theo sao. Thẻ võ hồn từ 2★ ghi phần cộng; chú thích hồn kỹ ghi sức mạnh / hồi chiêu đã tính sao.

### Trong trận
- Phím 1–4 (hoặc chạm ô trên thanh đội hình) đổi ngay sang võ hồn khác trong đội, hồi `SWITCH_CD` giây; cấm khi cả đội gục, đang hấp thụ hoặc võ hồn đích đã gục. Hồn lực thuộc hồn sư nên đổi võ hồn giữ tỉ lệ hồn lực; mỗi võ hồn có sinh lực riêng.
- Xếp đội (thay, đổi chỗ, bỏ ra) chỉ khi ngoài giao chiến (mục 4). Đội có ít nhất 1 võ hồn; võ hồn ra trận luôn nằm trong đội.
- **Năng lượng tiên cơ** (`TIEN_CO_*`): thuộc từng võ hồn trong đội, 0–`TIEN_CO_MAX`. Võ hồn ra trận đánh trúng thì **các võ hồn khác trong đội (chưa gục) tích năng lượng** (`TIEN_CO_GAIN`, một lần mỗi đòn dù trúng nhiều mục tiêu); võ hồn ra trận không tự tích. Gục hoặc rời đội thì mất hết; ngoài giao chiến quá `TIEN_CO_IDLE_SECS` giây thì cả đội giảm dần (`TIEN_CO_DECAY`); không lưu DB.
- **Chiêu tiên cơ:** chỉ **đổi tay** vào võ hồn đầy năng lượng mới tung, ngay lúc xuất hiện; tung xong về 0. Tự đổi khi gục không tung và giữ năng lượng. Tiên cơ không tốn hồn lực, không vướng hồi chiêu, không tạo năng lượng (tránh nối vô hạn). Trong vùng an toàn đổi tay được nhưng không tung và giữ năng lượng. Mỗi võ hồn có **tiên cơ riêng** (`TIEN_CO_RIENG`, chạy bằng bộ máy hồn kỹ); tiên cơ chung theo hệ (`TIEN_CO`: Bạo Liệt, Thiểm Sát, Phong Tỏa, Hộ Thể) chỉ làm dự phòng cho võ hồn thêm sau chưa có dữ liệu. Bộ hồn hạch Tiên Cơ tăng tốc tích và sát thương tiên cơ (mục 5.6).
- Người chơi thấy năng lượng từng võ hồn trên thanh đội hình (ô đầy sáng viền, chữ "Tiên cơ!"); người khác chỉ thấy hiệu ứng tiên cơ.

### Kinh nghiệm
Hạ hồn thú thì kinh nghiệm (đã giảm theo chênh cấp, mục 5.3) chia cho đội võ hồn: võ hồn ra trận `XP_SHARE_ACTIVE`, mỗi võ hồn khác trong đội `XP_SHARE_BENCH`; ô trống và võ hồn đang ở bình cảnh không nhận, phần đó bỏ đi. Võ hồn cấp 100 đủ 10 vòng không nhận kinh nghiệm nữa. Tổ đội người chơi chia trước (mục 5.9).

### Chỉ số võ hồn
`calcStats`: theo hệ, độ hiếm, cấp, hồn hoàn (sinh lực và công theo màu, hồn lực theo số vòng), sao; rồi % của hồn hạch, cộng minh, tiên thảo nhân phần gốc; rồi phần phẳng của hồn cốt và hồn hạch. Chí mạng gốc ở `CRIT`.

### Danh hiệu
Theo cấp võ hồn đang ra trận, hiện trên đầu hồn sư: mỗi 10 cấp một danh hiệu, từ Hồn Sĩ tới Phong Hào Đấu La (`TITLES`, `titleOf`).

## Lịch sử / issue liên quan
- Võ hồn thêm ở bước 8.3 (`EXTRA_VOHON`); Bạch Hổ và dung hợp kỹ U Minh Bạch Hổ #194; ảnh thật phụ thể #425.
- Nhật ký từng bước: `docs/lich-su.md`.
