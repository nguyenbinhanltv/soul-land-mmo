# Võ Hồn Chân Thân: pháp tướng (đặc tả 25 võ hồn, theo dõi #482, bước H0 #483)

Tài liệu đặc tả hình ảnh. Luật chơi của Chân Thân (hồn lực, hồi chiêu, chỉ số) ở `GAME_DESIGN.md` mục 5.1 và `CHAN_THAN` trong `shared/data.ts`; mục 5.18 của `GAME_DESIGN.md` tóm tắt quy ước. Tên hồn kỹ lấy từ `shared/data.ts` (đổi tên ở đó thì cập nhật bảng này).

## 1. Quy ước (chủ repo đã chốt 2026-10-24)

- **Cả 25 võ hồn dùng pháp tướng.** Hồn sư giữ nguyên (không đổi thân, không đổi sprite); khi Chân Thân, sau lưng hiện **hư ảnh võ hồn khổng lồ**. Thú võ hồn cũng là pháp tướng (rồng sét cuộn sau lưng, phượng hoàng lửa xòe cánh), không biến thành sinh vật.
- **Khung 160×160**, nền trong suốt. **Một lớp cho cả khung ở mỗi hướng** (H1 #485 chốt): `s`, `se`, `e` vẽ **SAU** thân hồn sư; `ne`, `n` vẽ **TRƯỚC** thân hồn sư, mờ 70%. Không tách phần sau / phần ló trước trong một khung.
- **5 hướng vẽ thật** `s`, `se`, `e`, `ne`, `n`; ba hướng còn lại (`sw`, `w`, `nw`) **lật gương** từ `se`, `e`, `ne` (như hồn sư và hồn thú).
- **Hai hoạt ảnh**: (1) **vòng lặp "thở"** dùng chung cho đứng và đi (lơ lửng, sáng nhịp); (2) **một động tác đánh / niệm** (rồng gầm, búa vung...) dùng cho đánh thường và tung hồn kỹ. Trúng đòn, gục: không thêm khung (pháp tướng mờ theo thân, tan khi hết Chân Thân).
- **Concept ảnh tĩnh không dùng PixelLab** (Q43 ở `docs/quyet-dinh.md`; concept của 25 võ hồn đã làm bằng PixelLab giữ nguyên ghi nguồn, prompt ở mục 5); concept mới làm bằng công cụ ảnh tĩnh (ChatGPT / Codex, ComfyUI; Q44), PixelLab chỉ xoay hướng và hoạt ảnh từ concept đó; chủ repo duyệt kết quả ở trang xem trước trước khi làm cả bộ.
- **Nguồn mới từ 2026-10-29 (chủ repo, epic #1020):** phụ thể v2 là **vũ khí cầm tay** của võ hồn đang ra trận; **phụ thể CŨ (`vh_<id>_b/_f`, `vhanim_<id>_b/_f`) thành pháp tướng** bay sau lưng, chỉ hiện khi Chân Thân; trang bị `vu_khi` chỉ tác dụng chỉ số. Sheet `pt_<id>` được đóng gói từ phụ thể cũ bằng công cụ ở mục 7, không sinh ảnh bằng model; các mục 4–5 (hình cũ, prompt PixelLab) chỉ còn là tham khảo cho những võ hồn chưa đóng gói.
- Hình thái xuất hiện / tan theo chuỗi biến hình 5 bước trong kế hoạch #482 (vòng hồn hoàn 7 sáng, cột sáng màu võ hồn, cảnh cận, nở từ tâm + vỡ mảnh kính màu, tan thành bụi sáng). Phần chuyển động đó làm bằng code (Phaser), không tốn lượt ảnh.

## 2. Điểm gắn và lớp

Hồn sư 64×64 có gốc (chân) ở `(32, 58)` trong khung. Khung pháp tướng 160×160 đặt gốc của nó ở **`(80, 124)`** trong khung (tức hai gốc trùng khi ghép: dời khung 160 sao cho `(80,124)` rơi đúng `(32,58)` của thân), chừa 124 px phía trên gốc cho hình cao và 36 px phía dưới cho bóng, đất nứt, rễ, vòng. Khi Chân Thân, thân hồn sư phóng theo tỉ lệ Chân Thân (hằng này chưa có trong `CHAN_THAN`, thêm ở H1); khung pháp tướng **phóng theo cùng tỉ lệ quanh gốc** (đổi nếu thử ở H1 thấy hình quá lớn). Thân hồn sư cao khoảng 40 px nên pháp tướng cao 60–120 px, đầu pháp tướng cao hơn đầu hồn sư.

Điểm gắn gợi ý theo nhóm bố cục (cột "Nhóm" ở bảng chuyển động). **Lớp không theo nhóm**: mọi nhóm dùng một luật lớp ở mục 1 (H1 chốt), nhóm chỉ cho biết đặt hình ở đâu quanh gốc (`display.dx`, `dy`, `scale` trong `recipe.json`).

| Nhóm | Loại | Vị trí gợi ý |
|---|---|---|
| V | Vũ khí / vật đứng | Chéo sau vai phải (H1: Hạo Thiên Chùy tỉ lệ 0,85, dời +12, −4) |
| S | Rồng / rắn cuộn | Cuộn sau lưng, đầu qua một bên vai (H1: Lam Điện tỉ lệ 1, không dời) |
| P | Hoa / cây | Mọc từ gốc ở sau lưng |
| B | Chim xòe cánh | Hai cánh xòe từ lưng |
| T | Thú đứng / ngồi / phục | Sát sau lưng, đầu cao hơn hồn sư |
| O | Vật lơ lửng | Lơ lửng ngang sau đầu, cách đầu ~6 px |
| D | Bóng người / quỷ | Sát sau lưng, to gấp ~2 lần hồn sư |

Quy tắc lớp (H1 chốt): hướng `s` (hồn sư nhìn về phía người xem), `se`, `e` pháp tướng nằm hẳn **sau** thân; `ne`, `n` (hồn sư quay lưng) pháp tướng đứng **trước** thân, **mờ 70%** để không che hồn sư và hồn thú. Hướng lật gương (sw, w, nw) lật cả khung và giữ lớp của hướng gốc.

## 3. Cảm giác chuyển động (chung)

- **Thở**: chu kỳ 1,6–2 giây, 6–8 khung; biên độ nhỏ (1–2 px nhấp nhô, độ sáng ±10%), không đổi dáng lớn để không rối mắt khi đi. Nhịp đi không làm pháp tướng lắc theo thân, chỉ trễ nhẹ (1–2 px, như bóng).
- **Đánh / niệm**: 5–6 khung, ~0,4 giây: chuẩn bị (1–2 khung, lùi hoặc nén lại), ra đòn (1 khung mạnh nhất, hình bung xa nhất), thu về (2–3 khung). Hướng đòn theo hướng hồn sư; hiệu ứng sáng lóe 1 khung ở khung ra đòn.
- Màu hào quang theo `col`; viền `#1a1020`; độ trong suốt 80–90% ở thân pháp tướng, đặc ở lõi sáng. Cộng sáng nằm ở lớp riêng để hạ theo mức hiệu ứng (người khác thấy nhẹ hơn chính mình, `GAME_DESIGN` 5.11).
- Ngân sách ảnh: 5 hướng × 2 hoạt ảnh; chốt theo kết quả thử H1 (#485).

## 4. Bảng 25 võ hồn

> **v2:** bộ hình làm lại (bá đạo, tu tiên) theo `docs/art/vo-hon-phong-cach.md`; cột hình / màu ở 4.1 chỉ là bản cũ để tham khảo, không dùng để vẽ v2. Phần 4.2 (chuyển động) vẫn giữ.

### 4.1 Hình, màu

| # | Võ hồn (`id`) | Hệ | Màu `col` / `robe` | Hình pháp tướng |
|---|---|---|---|---|
| 1 | Cửu Tinh Thất Sát Kiếm (`cuu_tinh_that_sat_kiem`) | Cường công | `#cfe3ff` / `#3c4f70` | Thanh trường kiếm bạc khổng lồ (cao ~1,5 lần hồn sư) treo chếch sau lưng, mũi chúc xuống; 7 đốm sao quanh thân kiếm. |
| 2 | Lam Điện Bá Vương Long (`lam_dien_ba_vuong_long`) | Cường công | `#5ab8ff` / `#1f3f8f` | Rồng sét lam cuộn sau lưng, thân vòng qua hai bên, đầu rồng ngẩng cao hơn đầu hồn sư, sừng và bờm điện. |
| 3 | Kỳ Nhung Thông Thiên Cúc (`ky_nhung_thong_thien_cuc`) | Cường công | `#ffb347` / `#8a4a12` | Đóa cúc vàng cam khổng lồ nở như vầng hào quang sau lưng, nhiều lớp cánh dài. |
| 4 | Tà Hỏa Phượng Hoàng (`ta_hoa_phuong_hoang`) | Cường công | `#ff6a2a` / `#8f2a14` | Phượng hoàng lửa xòe đôi cánh khổng lồ sau lưng, đầu ngẩng, đuôi lửa dài rủ xuống. |
| 5 | U Minh Linh Miêu (`u_minh_linh_mieu`) | Mẫn công | `#b06bff` / `#3e2266` | Hư ảnh báo tím đen cao to phục sau lưng, hai mắt tím sáng, đuôi dài. |
| 6 | Nguyệt Nhận (`nguyet_nhan`) | Mẫn công | `#e6e6f0` / `#4a4a5e` | Vòng trăng khuyết bạc khổng lồ dựng đứng sau lưng như vầng hào quang, hai đầu nhọn như lưỡi liềm. |
| 7 | Hỏa Long (`hoa_long`) | Mẫn công | `#ff4a2a` / `#7a1c10` | Rồng lửa đỏ quấn sau lưng, đầu rồng đỏ rực trên một bên vai, thân vảy cháy. |
| 8 | Nhu Cốt Thố (`nhu_cot_tho`) | Mẫn công | `#ffc2e2` / `#c86a9a` | Thỏ trắng hồng khổng lồ ngồi thẳng sau lưng, tai dài dựng cao, mắt đỏ hồng, đuôi bông. |
| 9 | Kim Vũ Miêu Ưng (`kim_vu_mieu_ung`) | Mẫn công | `#ffd54a` / `#7a5a12` | Ưng cú mèo lông vàng kim xòe cánh sau lưng, mặt giống mèo, tai lông vểnh, sét vàng ở mép cánh. |
| 10 | Tử Vong Chu Hoàng (`tu_vong_chu_hoang`) | Khống chế | `#9a4aff` / `#2a1240` | Nhện tím đen khổng lồ bám sau lưng, tám chân dài chống hai bên, mắt tím sáng, mạng tơ mờ. |
| 11 | Bích Lân Xà Hoàng (`bich_lan_xa_hoang`) | Khống chế | `#3ad98a` / `#145a38` | Rắn lục biếc khổng lồ cuộn nhiều vòng sau lưng, đầu rắn ngóc cao có mào, mắt lân quang. |
| 12 | Càn Khôn Hỗn Nguyên Tỏa (`can_khon_hon_nguyen_toa`) | Khống chế | `#e0b04a` / `#5e4a18` | Vòng xích vàng và ổ khóa phù văn lớn lơ lửng sau lưng như một bánh xe, xích rủ xuống. |
| 13 | Hỏa Ảnh (`hoa_anh`) | Khống chế | `#ff3a4a` / `#701822` | Bóng lửa đỏ thẫm hình người khổng lồ đứng sau lưng, vai rộng, hai tay bọc lửa, mắt sáng. |
| 14 | Yêu Hồ (`yeu_ho`) | Khống chế | `#ff9ad5` / `#7a2a5a` | Hồ ly hồng khổng lồ ngồi sau lưng, ba đuôi dài xòe như quạt, mắt hồng quyến rũ, đốm sáng giọt nước. |
| 15 | Xúc Xích (`xuc_xich`) | Phụ trợ | `#e8875a` / `#6a3a22` | Xúc xích nướng khổng lồ vàng nâu lơ lửng chéo sau lưng, hơi nóng bốc lên, vài xúc xích nhỏ quay quanh (giữ chất hài). |
| 16 | Quỷ Mị (`quy_mi`) | Phụ trợ | `#8a8aff` / `#22224a` | Hư ảnh quỷ tím xanh khổng lồ lơ lửng sau lưng, không chân, hai tay dài như bóng, mặt quỷ mờ. |
| 17 | Thiên Càn Bạch Ngọc Đỉnh (`thien_can_bach_ngoc_dinh`) | Phụ trợ | `#f0e0a0` / `#6a5a2a` | Đỉnh ba chân bằng bạch ngọc khổng lồ lơ lửng sau lưng, miệng đỉnh nghiêng về phía hồn sư, khói ngọc bốc lên. |
| 18 | Lam Ngân Thảo (`lam_ngan_thao`) | Khống chế | `#4ab0ff` / `#1f4a6b` | Cây Lam Ngân Thảo khổng lồ mọc sau lưng, thân cỏ xanh lam xoắn, nhiều dây dài tỏa ra rủ xuống hai bên. |
| 19 | Hạo Thiên Chùy (`hao_thien_chuy`) | Cường công | `#9aa0b4` / `#22222c` | Cây búa đen khổng lồ (đầu búa gần bằng thân hồn sư) vác chếch sau vai, cán dài; đất nứt ánh xám. |
| 20 | Cửu Bảo Lưu Ly Tháp (`cuu_bao_luu_ly_thap`) | Phụ trợ | `#7ef0ff` / `#2a6a7a` | Tháp lưu ly chín tầng khổng lồ dựng sau lưng, mỗi tầng một màu, hào quang bảy sắc. |
| 21 | Phá Hồn Thương (`pha_hon_thuong`) | Cường công | `#7fe0d0` / `#1f4a48` | Trường thương cán dài khổng lồ dựng đứng chếch sau lưng, mũi thoi xanh ngọc, tua đỏ. |
| 22 | A Ngân (`a_ngan`) | Phụ trợ | `#7fd8ff` / `#24527a` | Đóa hoa Lam Ngân Hoàng vàng xanh khổng lồ nở sau lưng trên thân cỏ xanh, dây vàng buông xuống, vương miện cỏ. |
| 23 | Liệt Hỏa Thương Lang (`liet_hoa_thuong_lang`) | Mẫn công | `#ff7a3a` / `#4a3a3a` | Sói xám chóp lửa khổng lồ đứng sau lưng, đuôi to chóp lửa, mắt cam sáng, vuốt lửa. |
| 24 | Băng Phượng Hoàng (`bang_phuong_hoang`) | Khống chế | `#a8e8ff` / `#2a5a8a` | Phượng hoàng băng xòe cánh tinh thể sau lưng, mào băng trên đầu, đuôi dài như dải băng. |
| 25 | Bạch Hổ (`bach_ho`) | Cường công | `#f2f2f6` / `#3a3a4c` | Hổ trắng vằn đen khổng lồ ngồi uy nghi sau lưng, đầu hổ cao hơn hồn sư, mắt vàng. |

### 4.2 Chuyển động và kỹ năng liên quan

Cột "Hồn kỹ Chân Thân" là hồn kỹ ô P khi đang Chân Thân (`CHAN_THAN[...].skill`); "Tuyệt kỹ" là hồn kỹ vòng 10 (`VOHON_SKILLS_HIGH`, cờ `ult`); "Tiên cơ" là `TIEN_CO_RIENG`. Hình thái dùng để chọn hiệu ứng riêng cho các chiêu này ở bước H5–H6 (ví dụ Hạo Thiên Chùy: pháp tướng búa nện xuống cùng nhịp tuyệt kỹ; Lam Điện Bá Vương Long: đầu rồng gầm cùng Lôi Động Minh Thiên).

| # | Võ hồn | Nhóm | Vòng "thở" (đứng / đi) | Động tác đánh / niệm | Hồn kỹ Chân Thân (ô P) | Tuyệt kỹ vòng 10 | Tiên cơ riêng |
|---|---|---|---|---|---|---|---|
| 1 | Cửu Tinh Thất Sát Kiếm | V | Kiếm lơ lửng nhấp nhô 1–2 px, 7 sao xoay chậm, ánh bạc chạy dọc sống kiếm. | Kiếm nhích lên rồi chém xuống một nhát, 7 sao bắn sáng. | Thất Sát Phá Thiên Kiếm | Kiếm Trảm Sơn Hà | Thất Sát Kiếm Vực |
| 2 | Lam Điện Bá Vương Long | S | Thân rồng uốn lượn nhẹ, tia sét chạy dọc vảy theo nhịp thở. | Đầu rồng vươn ra phía trước, há miệng gầm, tia sét lóe toàn thân. | Bá Vương Lôi Thần Nộ | Lôi Động Minh Thiên · Toàn Vực | Lam Điện Lôi Bạo |
| 3 | Kỳ Nhung Thông Thiên Cúc | P | Cánh hoa xòe khép nhẹ, nhụy sáng nhịp thở. | Cánh hoa xòe hết cỡ, vài cánh bắn ra rồi trở về. | Thông Thiên Cúc Vũ | Vạn Cúc Thông Thiên | Cúc Hoa Phong Bạo |
| 4 | Tà Hỏa Phượng Hoàng | B | Cánh khép mở nhẹ, tàn lửa bay lên, lửa đuôi gợn. | Cánh vỗ mạnh một nhịp, phượng ngẩng đầu hót, bùng lửa. | Phượng Hoàng Hỏa Vũ | Phượng Hoàng Niết Bàn | Phượng Hoàng Tiếu Thiên Kích |
| 5 | U Minh Linh Miêu | T | Thân báo nhấp nhô theo nhịp thở, đuôi vẫy chậm, mắt chớp sáng. | Báo vồ chồm tới, móng vuốt cào ra, để lại vệt tím. | U Minh Thần Trảo | U Minh Bách Trảo · Vô Ảnh | U Minh Thiểm Trảo |
| 6 | Nguyệt Nhận | V | Vầng trăng xoay chậm quanh tâm, ánh bạc gợn theo nhịp. | Trăng khuyết tách thành hai lưỡi, xoay chém chéo qua trước rồi hợp lại. | Huyết Nguyệt Đoạt Hồn | Tà Nguyệt Đoạt Mệnh · Huyết Nguyệt | Nguyệt Nhận Đoạt Mệnh |
| 7 | Hỏa Long | S | Thân quấn nhấp nhô, hơi nóng gợn, tia lửa nổ lách tách. | Đầu rồng phun một luồng lửa ra trước, thân bùng sáng. | Hỏa Long Thôn Thiên | Hỏa Long Diệt Thế | Long Viêm Bạo |
| 8 | Nhu Cốt Thố | T | Tai vẫy nhẹ, mũi và râu giật, thân phập phồng. | Thỏ bật nhảy đạp chân sau, tai quật như roi, vệt hồng. | Thỏ Hoàng Bạo Sát | Bát Đoạn Suất · Thập Vạn Niên | Nhu Cốt Thuấn Suất |
| 9 | Kim Vũ Miêu Ưng | B | Cánh khép mở, lông vũ rơi lả tả, sét vàng chớp ở mép cánh. | Cánh vỗ mạnh, ưng lao một đoạn về trước, lông vũ sét bắn. | Kim Vũ Thiên Lôi | Kim Ưng Thiên Lôi Vực | Kim Ưng Giáng Lôi |
| 10 | Tử Vong Chu Hoàng | T | Chân nhện co duỗi lần lượt, tơ gợn, mắt chớp. | Hai chân trước đâm tới, nhả tơ ra phía trước. | Chu Hoàng Thiên La Võng | Tử Vong Thiên Võng | Chu Hoàng Thiên Võng |
| 11 | Bích Lân Xà Hoàng | S | Thân cuộn dịch chuyển, lưỡi rắn thè, vảy lấp lánh chạy sóng. | Đầu rắn lao tới há nanh phun sương độc. | Xà Hoàng Vạn Độc Phệ | Vạn Độc Bích Lân Vực | Xà Hoàng Độc Vực |
| 12 | Càn Khôn Hỗn Nguyên Tỏa | O | Vòng xích xoay chậm, phù văn sáng theo nhịp. | Xích bắn ra phía trước rồi khóa lại thành vòng, phù văn bùng sáng. | Càn Khôn Phong Thiên | Càn Khôn Hỗn Nguyên · Thiên Địa Tỏa | Càn Khôn Đại Phong Tỏa |
| 13 | Hỏa Ảnh | D | Bóng lửa đi trễ nhịp so với thân, rìa lửa lay động. | Hai tay bóng nện ra phía trước, lửa bùng. | Hỏa Ảnh Thiên Phạt | Hỏa Ảnh Thiên Trọng | Hỏa Ảnh Trùng Trùng |
| 14 | Yêu Hồ | T | Ba đuôi đung đưa lệch nhịp, đốm sáng nhấp nháy. | Hồ ly nghiêng đầu, ba đuôi quét ra phía trước, hào quang hồng lan. | Thiên Hồ Mị Thế | Vạn Hồ Triều Bái | Hồ Mị Thiên Hạ |
| 15 | Xúc Xích | O | Xúc xích lắc lư, hơi bốc lên, xúc xích nhỏ nảy. | Xúc xích khổng lồ lao tới như gậy rồi bật về, hơi thánh quang tỏa. | Thánh Quang Đại Hương Tràng | Hương Tràng Thịnh Yến | Thanh Tâm Hương Tràng |
| 16 | Quỷ Mị | D | Bóng chập chờn, rìa khói tan nhập, nhấp nháy. | Quỷ ào tới há miệng hút, khói tím đen cuộn. | Bách Quỷ Phệ Hồn | Quỷ Ảnh Trùng Trùng | Quỷ Ảnh Mê Tung |
| 17 | Thiên Càn Bạch Ngọc Đỉnh | O | Đỉnh lơ lửng nhấp nhô, khói ngọc cuộn, quầng sáng nhịp thở. | Đỉnh nghiêng miệng, tỏa quầng sáng ngọc rồi úp xuống. | Càn Khôn Ngọc Đỉnh Hộ Thế | Tịnh Thế Lưu Ly | Bạch Ngọc Thánh Quang |
| 18 | Lam Ngân Thảo | P | Dây cỏ đung đưa, đốm sáng xanh bay lên. | Dây cỏ vươn ra phía trước quất và quấn. | Lam Ngân Hoàng Triền Thiên | Lam Ngân Thiên Hạ | Lam Ngân Phong Tỏa |
| 19 | Hạo Thiên Chùy | V | Búa nhấp nhô nặng nề, vân đen chạy, bụi rơi. | Búa nhấc lên cao rồi nện xuống, đất nứt, bụi bốc. | Hạo Thiên Diệt Thế Chùy | Loạn Phi Phong Chùy Pháp · Đại Thành | Hạo Thiên Giáng Thế |
| 20 | Cửu Bảo Lưu Ly Tháp | V | Tháp lơ lửng nhấp nhô, hào quang xoay, tầng sáng nối nhau. | Chín tầng sáng lên lần lượt từ dưới lên, tia bảy màu bắn ra. | Thất Bảo Tề Quang | Vô Địch Thần Quang | Lưu Ly Hộ Thể |
| 21 | Phá Hồn Thương | V | Thương nhẹ rung, hồn quang lấp lánh ở mũi, tua phất. | Thương hạ ngang đâm thẳng ra phía trước, vệt hồn quang. | Phá Hồn Xuyên Thiên | Phá Hồn Diệt Phách · Thiên Thương | Phá Hồn Xuyên Tâm |
| 22 | A Ngân | P | Đóa hoa phập phồng, dây vàng đung đưa, đốm sáng xanh vàng. | Hoa nở bung, sóng sáng xanh lan ra, dây vươn ra. | Lam Ngân Hoàng Thánh Quang | Lam Ngân Hoàng · Sinh Sinh Bất Tức | Lam Ngân Hoàng Ân |
| 23 | Liệt Hỏa Thương Lang | T | Thân sói phập phồng, đuôi lửa vẫy, tàn lửa bay. | Sói chồm vồ, vuốt lửa cào, rống lửa. | Thương Lang Liệt Hỏa Phệ | Liệt Hỏa Thương Lang · Phần Thiên Phệ | Liệt Hỏa Lang Tập |
| 24 | Băng Phượng Hoàng | B | Cánh băng khép mở, tinh thể lấp lánh, sương lạnh gợn. | Cánh quạt ra, bão tinh thể băng thổi ra phía trước. | Băng Phượng Cực Hàn Vực | Băng Phượng Hoàng · Băng Phong Thiên Địa | Băng Phượng Lâm Thế |
| 25 | Bạch Hổ | T | Thân hổ phập phồng, đuôi vằn đập chậm, râu bay. | Hổ chồm tới gầm lớn, chân trước tát ra, vệt trắng. | Bạch Hổ Phá Thiên Trảo | Bạch Hổ · Thiên Hổ Chấn Thế (phỏng theo) | Bạch Hổ Chấn Thiên |

## 5. Prompt PixelLab (concept)

> **v2:** prompt dưới đây là bản cũ (PixelLab). Bản v2 dùng khối STYLE / NEGATIVE ở `docs/art/vo-hon-phong-cach.md` mục 6.

Quy trình PixelLab (REST v2, key đọc từ file cấu hình máy, không ghi vào repo; đo `/v2/balance` trước và sau mỗi lệnh): (1) `create-image-pixflux` 128×128, nền trong suốt, nhìn chéo từ trên xuống hướng nam → concept `s`; (2) `generate-8-rotations-v3` từ concept → lấy 5 hướng `s`, `se`, `e`, `ne`, `n` (thứ tự trả về của 8 ảnh là `sw, s, se, e, ne, n, nw, w`); (3) `animate-with-text-v3` 8 khung cho từng hướng, hai lần: vòng "thở" và động tác đánh; (4) hậu kỳ bằng `tools/assets/phaptuong.mjs` (khung 160×160, nền trong suốt, gốc theo mục 2, một lớp cho cả khung ở mỗi hướng theo mục 1, bảng màu riêng ≤ 48 màu; **không** qua `normalize` / `pack`), rồi `validate.mjs --register pt_<mã>`. Lệnh, tham số, bước làm chi tiết và lượt thực tế (rồng 23, búa 3 + 2 thử hỏng; vật cứng thở / đánh bằng code) ở `docs/art/phap-tuong-cong-thuc.md` (PR #499, H1 #485). Prompt tiếng Anh, không nhắc hồn sư (ảnh đơn lẻ, hướng nhìn quy định ở bước xoay), tả hình chung (không tên nhân vật hay thương hiệu có bản quyền); màu theo `col` / `robe` của từng võ hồn.

**1. Cửu Tinh Thất Sát Kiếm** (`cuu_tinh_that_sat_kiem`)

```
pixel art, isometric RPG sprite, single subject, giant spectral silver greatsword floating diagonally, blade pointing down, seven glowing stars orbiting the blade, pale blue-white glow, translucent ghost-like, main colors #cfe3ff and #3c4f70, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**2. Lam Điện Bá Vương Long** (`lam_dien_ba_vuong_long`)

```
pixel art, isometric RPG sprite, single subject, giant spectral azure thunder dragon coiling, horned head raised high, crackling blue lightning along the scales, translucent ghost-like, deep blue and cyan palette, main colors #5ab8ff and #1f3f8f, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**3. Kỳ Nhung Thông Thiên Cúc** (`ky_nhung_thong_thien_cuc`)

```
pixel art, isometric RPG sprite, single subject, giant spectral golden-orange chrysanthemum bloom, many long layered petals radiating like a halo, glowing amber core, translucent ghost-like, main colors #ffb347 and #8a4a12, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**4. Tà Hỏa Phượng Hoàng** (`ta_hoa_phuong_hoang`)

```
pixel art, isometric RPG sprite, single subject, giant spectral fire phoenix with wide spread wings, long flaming tail feathers, orange red and ember colors, translucent ghost-like, main colors #ff6a2a and #8f2a14, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**5. U Minh Linh Miêu** (`u_minh_linh_mieu`)

```
pixel art, isometric RPG sprite, single subject, giant spectral purple-black panther cat crouching, glowing violet eyes, long tail, sharp claws, translucent ghost-like, dark violet palette, main colors #b06bff and #3e2266, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**6. Nguyệt Nhận** (`nguyet_nhan`)

```
pixel art, isometric RPG sprite, single subject, giant spectral silver crescent moon blade ring standing upright, razor-sharp tips, cold pale light, translucent ghost-like, main colors #e6e6f0 and #4a4a5e, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**7. Hỏa Long** (`hoa_long`)

```
pixel art, isometric RPG sprite, single subject, giant spectral crimson fire dragon coiling, head resting above one shoulder, scales burning with flames, translucent ghost-like, red and orange palette, main colors #ff4a2a and #7a1c10, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**8. Nhu Cốt Thố** (`nhu_cot_tho`)

```
pixel art, isometric RPG sprite, single subject, giant spectral pink-white rabbit sitting, very long ears raised, glowing rose red eyes, fluffy tail, translucent ghost-like, soft pink palette, main colors #ffc2e2 and #c86a9a, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**9. Kim Vũ Miêu Ưng** (`kim_vu_mieu_ung`)

```
pixel art, isometric RPG sprite, single subject, giant spectral golden owl-cat hawk with spread wings, tufted ears, feathers edged with yellow lightning, translucent ghost-like, gold palette, main colors #ffd54a and #7a5a12, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**10. Tử Vong Chu Hoàng** (`tu_vong_chu_hoang`)

```
pixel art, isometric RPG sprite, single subject, giant spectral violet-black spider, eight long legs spread, many glowing purple eyes, faint web strands, translucent ghost-like, main colors #9a4aff and #2a1240, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**11. Bích Lân Xà Hoàng** (`bich_lan_xa_hoang`)

```
pixel art, isometric RPG sprite, single subject, giant spectral emerald-green serpent coiling, crested head raised high, glowing scales, toxic green mist, translucent ghost-like, main colors #3ad98a and #145a38, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**12. Càn Khôn Hỗn Nguyên Tỏa** (`can_khon_hon_nguyen_toa`)

```
pixel art, isometric RPG sprite, single subject, giant spectral golden chain wheel with a huge ornate padlock floating, glowing rune symbols, hanging chain links, translucent ghost-like, gold and bronze palette, main colors #e0b04a and #5e4a18, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**13. Hỏa Ảnh** (`hoa_anh`)

```
pixel art, isometric RPG sprite, single subject, giant spectral crimson fire shadow figure of a hulking humanoid, fists wrapped in flames, glowing eyes, translucent ghost-like, dark red palette, main colors #ff3a4a and #701822, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**14. Yêu Hồ** (`yeu_ho`)

```
pixel art, isometric RPG sprite, single subject, giant spectral pink fox sitting, three fluffy tails fanned out, glowing magenta eyes, drifting sparkles, translucent ghost-like, pink and magenta palette, main colors #ff9ad5 and #7a2a5a, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**15. Xúc Xích** (`xuc_xich`)

```
pixel art, isometric RPG sprite, single subject, giant spectral grilled sausage floating diagonally, steam rising, a few small sausages orbiting, cute humorous, warm orange brown palette, translucent ghost-like, main colors #e8875a and #6a3a22, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**16. Quỷ Mị** (`quy_mi`)

```
pixel art, isometric RPG sprite, single subject, giant spectral indigo wraith ghost with long arms, no legs, hazy demon face, drifting smoke, translucent ghost-like, indigo and purple palette, main colors #8a8aff and #22224a, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**17. Thiên Càn Bạch Ngọc Đỉnh** (`thien_can_bach_ngoc_dinh`)

```
pixel art, isometric RPG sprite, single subject, giant spectral white jade three-legged ding cauldron floating, pale cream glow, jade smoke rising from the mouth, translucent ghost-like, main colors #f0e0a0 and #6a5a2a, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**18. Lam Ngân Thảo** (`lam_ngan_thao`)

```
pixel art, isometric RPG sprite, single subject, giant spectral blue silver-grass plant growing, many long twisting vines, glowing blue particles, translucent ghost-like, blue palette, main colors #4ab0ff and #1f4a6b, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**19. Hạo Thiên Chùy** (`hao_thien_chuy`)

```
pixel art, isometric RPG sprite, single subject, giant spectral black war hammer with huge head leaning diagonally, long handle, dark veins, gray glow, translucent ghost-like, heavy and powerful, main colors #9aa0b4 and #22222c, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**20. Cửu Bảo Lưu Ly Tháp** (`cuu_bao_luu_ly_thap`)

```
pixel art, isometric RPG sprite, single subject, giant spectral nine-tier glazed pagoda tower standing, each tier a different jewel color, rainbow halo, translucent ghost-like, main colors #7ef0ff and #2a6a7a, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**21. Phá Hồn Thương** (`pha_hon_thuong`)

```
pixel art, isometric RPG sprite, single subject, giant spectral long spear standing upright, diamond-shaped teal blade, red tassel, glowing soul light, translucent ghost-like, main colors #7fe0d0 and #1f4a48, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**22. A Ngân** (`a_ngan`)

```
pixel art, isometric RPG sprite, single subject, giant spectral blue and gold flower with long vines, huge glowing bloom on a grass stalk, hanging golden threads, translucent ghost-like, azure and gold, main colors #7fd8ff and #24527a, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**23. Liệt Hỏa Thương Lang** (`liet_hoa_thuong_lang`)

```
pixel art, isometric RPG sprite, single subject, giant spectral gray wolf with fire-tipped fur, large flaming tail tip, glowing amber eyes, translucent ghost-like, main colors #ff7a3a and #4a3a3a, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**24. Băng Phượng Hoàng** (`bang_phuong_hoang`)

```
pixel art, isometric RPG sprite, single subject, giant spectral ice phoenix with crystalline spread wings, ice crest on the head, long ribbon-like tail, pale cyan and white, translucent ghost-like, main colors #a8e8ff and #2a5a8a, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```

**25. Bạch Hổ** (`bach_ho`)

```
pixel art, isometric RPG sprite, single subject, giant spectral white tiger with black stripes sitting majestically, golden eyes, long striped tail, translucent ghost-like, white and gray palette, main colors #f2f2f6 and #3a3a4c, clean dark outline, limited palette with 3-4 tones per color, soft inner glow, transparent background, no soul master character, no text, no watermark
```


## 6. Nguồn LPC kết hợp (bổ sung theo yêu cầu chủ repo, 2026-10-24)

Mục đích: dùng hiệu ứng / hoạt ảnh LPC (Liberated Pixel Cup) và gói OpenGameArt cùng phong cách để **tiết kiệm lượt PixelLab**; chỗ LPC không hợp thì dùng PixelLab hoặc code. Luật giấy phép theo `GAME_DESIGN.md` mục 5.11 "Asset bên ngoài": mọi giấy phép đã biết dùng được (CC0, CC-BY, CC-BY-SA, OGA-BY, GPL, NC); nhiều giấy phép thì dùng theo nhóm ít ràng buộc nhất (`licenseUse` trong `tools/assets/lib.mjs`); SA / GPL / NC ghi cờ ở `art/CREDITS.md`; gói không rõ giấy phép thì không tải. Công cụ: `lpc-item.mjs` (mục `fx`: dải khung vuông một hàng), `lpc-compose.mjs` (hồn sư / NPC), `lpc-beast.mjs` (hồn thú). Mỗi ảnh đưa vào game phải được chủ repo duyệt.

**Đã soát trang gói (2026-10-24):** tác giả, giấy phép, khung / cỡ lấy từ trang OpenGameArt của từng gói. Cột "Chỉnh gì" là việc phải làm trước khi vào game.

### 6.1 Bảng gói hiệu ứng

| Gói (URL) | Tác giả | Giấy phép (game dùng) | Khung / cỡ | Dùng cho | Chỉnh gì cho hợp pixel art isometric của game |
|---|---|---|---|---|---|
| [Fireball spell](https://opengameart.org/content/fireball-spell) | Clint Bellanger | CC-BY 3.0 | 64×64, 8 khung × 8 hướng, đã isometric 2:1, nền trong suốt | Hệ Hỏa, kiểu "phóng" (Phượng Hoàng Hỏa Vũ, Hỏa Long Thôn Thiên, đạn lửa tiên cơ) | Ảnh dựng bằng Blender (mịn): thu 1:1, giảm còn 12–14 màu, bỏ điểm mờ (alpha 0/255), thêm viền `#1a1020`; nhuộm theo màu niên hạn nếu cần |
| [Icicle spell](https://opengameart.org/content/icicle-spell) | Clint Bellanger | CC-BY 3.0 | 64×64, 8 khung × 8 hướng, isometric | Hệ Băng, kiểu "phóng" (Băng Phượng Hoàng) | như trên |
| [Lightning shock spell](https://opengameart.org/content/lightning-shock-spell) | Clint Bellanger | CC-BY 3.0 | 64×64, 4 khung × 8 hướng | Hệ Lôi, kiểu "phóng" / "tia trúng" (Lam Điện Bá Vương Long, Kim Vũ Miêu Ưng) | như trên; sẫm màu xanh lam theo `col` Lam Điện `#5ab8ff` |
| [Freeze spell](https://opengameart.org/content/freeze-spell) | Clint Bellanger | CC-BY 3.0 | 64×64, 4 khung × 3 biến thể (có bản lửa) | Hệ Băng, kiểu "vùng tròn" (tinh thể mọc lên: Băng Phượng Cực Hàn Vực); bản lửa cho Hỏa | như trên; rải nhiều tinh thể thành vòng bằng code (Phaser) |
| [Quake spell](https://opengameart.org/content/quake-spell) | Clint Bellanger | CC-BY 3.0 | 256×128, 6 khung × 3 biến thể (đất / băng / lửa), isometric | Kiểu "vùng tròn" chấn đất: Hạo Thiên Diệt Thế Chùy, Bạch Hổ Phá Thiên Trảo, Hỏa Ảnh Thiên Phạt, tuyệt kỹ Hạo Thiên Phá Sơn | Thu 50%, bớt màu, viền; khớp vòng elip 2:1 của game nên ít phải chỉnh |
| [Heal spell](https://opengameart.org/content/heal-spell) | Clint Bellanger | CC-BY 3.0 | 64×64, 6 khung | Kiểu "hào quang buff" hệ Mộc / Quang (A Ngân, Xúc Xích, Thiên Càn Bạch Ngọc Đỉnh) | giảm màu, viền; nhuộm vàng cho Quang |
| [Shield spell](https://opengameart.org/content/shield-spell) | Clint Bellanger | CC-BY 3.0 | 128×128, 4 khung | Kiểu "hào quang buff" khiên (Cửu Bảo Lưu Ly Tháp, Càn Khôn, Thiên Càn) | Vòng mảnh, mờ: dùng làm lớp cộng sáng (additive), không thu pixel |
| [Sparks (fire, ice, blood)](https://opengameart.org/content/sparks-fire-ice-blood) | Clint Bellanger | CC-BY 3.0 | 64×64, 4 khung × 3 kiểu × 2 biến thể | Kiểu "tia trúng": tia nảy khi đánh trúng (Hỏa, Băng) | dùng nguyên khung, viền; nhuộm đổi màu cho hệ khác |
| [Extended LPC Magic pack](https://opengameart.org/content/extended-lpc-magic-pack) | daneeklu (Daniel Eddeland) | **CC-BY-SA 3.0**, GPL 3.0 (cờ SA) | 128×128, 16 khung (4×4); spikes 64×64 | `lightningclaw` (vuốt sét: U Minh Bách Trảo kiểu Lôi, Lam Điện vuốt rồng), `fire lion` 4 hướng (Hỏa Long, Liệt Hỏa Thương Lang), `snakebite` 3 hướng (Bích Lân Xà Hoàng, hệ Độc), `tornado` (hệ Phong), `icetacle` / `torrentacle` (Băng / Thủy vùng), `spikes` (Mộc / đất), `iceshield`, `turtleshell` (khiên) | Đã là pixel art, chỉ thu 50% (còn 64) hoặc giữ 128 cho vùng lớn, đổi bảng màu về `palette.gpl` của game, viền `#1a1020`; file đã sửa theo CC-BY-SA, ghi trong `CREDITS.md` |
| [LPC Flames](https://opengameart.org/content/lpc-flames) | Sharm (nguồn LPC Fireplace), đóng gói William.Thompsonj | CC-BY 3.0 (cũng GPL 3.0 / 2.0) | 16×24, vài khung | Chuyển động phụ phụ thể (tàn lửa chóp đuôi Liệt Hỏa Thương Lang, tay Hỏa Ảnh, cánh Tà Hỏa Phượng Hoàng); pháp tướng lửa | Khung nhỏ, giữ nguyên; lặp nhiều bản dọc thân pháp tướng bằng code |
| [LPC Explosions](https://opengameart.org/content/lpc-explosions) | theidiotmachine | CC0 | 32×32, 10 khung (đã dùng làm `fx_no`) | Kiểu "tia trúng" nổ nhỏ, tuyệt kỹ nổ | đã có công thức trong `art/src/lpc-item.json` |
| [LPC Items and game effects](https://opengameart.org/content/lpc-items-and-game-effects) | Tuomo Untinen (Reemax) | **CC-BY-SA 3.0**, GPL 3.0, GPL 2.0 (cờ SA) | 32×32 | Biểu tượng và vài hiệu ứng nhỏ (đã dùng cho vật phẩm) | giữ như `lpc-item.mjs` |
| [Smoke aura](https://opengameart.org/content/smoke-aura) | Beast | CC0 | 256×256, 15 / 30 / 45 khung (vòng lặp liền) | Hào quang hệ Ám / Độc: khói quanh pháp tướng Quỷ Mị, Hỏa Ảnh, Tử Vong Chu Hoàng, Bích Lân Xà Hoàng (đổi màu tím / lục) | Thu về 64–96, pixel hóa, giảm màu; chạy ngược để hút vào (biến hình) |
| [Animated circular air blast](https://opengameart.org/content/animated-circular-air-blast-effect) | Julien (Julien Jorge) | **CC-BY-SA 3.0** (cờ SA) | chưa rõ (cần mở file để đo) | Hệ Phong, kiểu "vùng tròn" (sóng khí) | đo khung khi tải, pixel hóa; ứng viên hạng hai |
| [Elemental absorption](https://opengameart.org/content/elemental-absorbtion-animation) | Sven Stamm (người đăng arakash) | **CC-BY-SA 3.0** (cờ SA) | chưa rõ | Hoạt ảnh hấp thụ (`absorb`) theo nguyên tố: lửa / nước / đất / dung nham | đo khung khi tải; ứng viên cho vòng hồn hoàn hấp thụ |

**Khoảng trống (không tìm thấy gói LPC đủ giấy phép rõ):** hệ **Quang** (cột sáng, tia sáng) và hệ **Ám** (vuốt tối, mắt quỷ) không có gói LPC riêng: Quang dùng Heal / Shield nhuộm vàng và cột sáng vẽ bằng code (hoặc ComfyUI); Ám dùng Smoke aura nhuộm tím đen. Các bộ lớn như "Slash Effect Collection", "RPG Special Move Effects", "25 special effects" nằm trong bộ sưu tập OpenGameArt nhưng **chưa soát giấy phép từng gói** nên chưa liệt vào bảng; muốn dùng thì đọc trang gói trước, không rõ thì không tải.

### 6.2 Ánh xạ sang các bước H5 / H6 / H7

| Bước | Việc | Nguồn LPC đề nghị | Ghi chú |
|---|---|---|---|
| H5 tuyệt kỹ | Búa nện, hố nứt (Hạo Thiên) | Quake (đất) + Spikes | pháp tướng búa nện bằng PixelLab, mặt đất bằng LPC |
| H5 | Rồng sét quét (Lôi Động Minh Thiên) | Lightning shock, `lightningclaw` | LPC chỉ là tia sét nền; thân rồng là pháp tướng |
| H5 | Phượng Hoàng Niết Bàn, Hỏa Long Diệt Thế | Fireball, `fire lion`, Flames | lửa chồng nhiều lớp quanh pháp tướng |
| H5 | Băng Phượng Phong Ấn / Băng Phong Thiên Địa | Icicle, Freeze, `icetacle` | |
| H5 | Vạn Độc Bích Lân Vực, Tử Vong Thiên Võng | `snakebite`, Smoke aura (lục / tím) | |
| H5 | Vô Địch Thần Quang, Tịnh Thế Lưu Ly | Shield, Heal nhuộm 7 màu | cột sáng 7 màu vẽ bằng code |
| H5 | Quỷ Ảnh Trùng Trùng, Hỏa Ảnh Thiên Trọng | Smoke aura (Ám) | |
| H6 hồn kỹ Chân Thân, vòng 8–9, tiên cơ | Biến thể mạnh của kiểu chung | Các gói Bellanger (CC-BY, nhẹ nhất về nghĩa vụ) | ưu tiên CC-BY / CC0 để tránh cờ SA |
| H7 chuyển động phụ phụ thể | Cánh vỗ, đuôi vẫy, vũ khí sáng | Flames (tàn lửa), Sparks, `lightningclaw` (tia điện chạy dọc tay), Smoke aura thu nhỏ | chủ yếu bằng code; LPC chỉ thêm hạt |

### 6.3 Hoạt ảnh hồn sư còn thiếu (từ Universal LPC Spritesheet Generator)

- Bộ LPC có các hàng `spellcast` (7 khung), `slash` (6), `thrust` (8), `shoot` (13), `hurt` (6, chỉ nhìn xuống) và các hàng mở rộng (`idle`, `run`, `jump`, ...) tùy bản. `lpc-compose.mjs` đã ánh xạ `slash` → attack, `spellcast` → cast, `hurt` → hurt / die hướng `s`; các hướng khác của hurt / die và `absorb` vẽ bằng code.
- `thrust` **chưa dùng**: hợp làm đòn đâm cho Phá Hồn Thương và Cửu Tinh Thất Sát Kiếm (nếu có thêm kiểu attack).
- **Ràng buộc đã có:** `GAME_DESIGN.md` mục 5.11 chỉ cho LPC làm NPC phụ, dân thường, lính gác, **không** cho hồn sư người chơi vì phong cách lệch (đầu to, chiều cao 64, khác bộ hồn sư PixelLab). Vì vậy đề xuất: (1) **không** ghép khung LPC vào hồn sư người chơi; (2) dùng hàng LPC làm **tham chiếu tư thế** (số khung, nhịp, góc tay) để đặt khung xương khi PixelLab làm cast / hurt / die còn thiếu (`animate-with-skeleton-v3`); (3) nếu chủ repo muốn đổi luật thì thử một bộ ghép với `lpc-compose.mjs` và so với `m_0` ở trang xem trước trước khi quyết.
- Giấy phép của hàng LPC: theo `CREDITS.csv` của repo generator cho đúng từng lớp (thường OGA-BY 3.0 / CC-BY-SA 3.0 / GPL 3.0); `lpc-compose.mjs` tự ghi và dừng khi không đọc được giấy phép.

### 6.4 Ảnh thử

Ảnh thử ghép (pixel hóa, viền, nhuộm màu) nằm trong trang xem trước H1 (bảng "LPC thử"): Fireball, Icicle, Shock, Heal, Shield, Quake, Freeze, Sparks và `lightningclaw` / `tornado` / `fire lion` / `iceshield` từ Extended LPC Magic pack, đặt cạnh pháp tướng PixelLab để xem có cùng độ phân giải và độ bão hòa không. Kết luận thử: gói pixel thật (Extended LPC Magic, LPC Flames, LPC Explosions) khớp ngay; gói dựng Blender của Bellanger khớp sau khi thu 50% với bảng màu ≤ 14 và viền `#1a1020`, riêng Shield / Shock cần làm lớp cộng sáng thay vì pixel hóa.

## 7. Đóng gói từ phụ thể cũ: `phuthe-to-phaptuong.mjs` (#1306, epic #1020)

Quyết định chủ repo 2026-10-29: phụ thể cũ thành pháp tướng. Công cụ `tools/assets/phuthe-to-phaptuong.mjs` (phần thuần ở `phuthe-to-phaptuong-lib.mjs`, test `phuthe-to-phaptuong.test.mjs` trong `npm run test:assets`) đọc ảnh phụ thể đã có và ghi sheet `shared/assets/sprites/phaptuong/<id>.png` đúng định dạng của mục 2 và `client/src/phapTuong.ts`: khung `PT_FRAME`, `PT_COLS` cột = `PT_IDLE_N` thở + `PT_ATTACK_N` đánh, hàng = hướng `PT_DIRS`, tối đa `PT_MAX_COLORS` màu, alpha 0 / 255.

| Việc | Cách làm |
|---|---|
| Nguồn | ưu tiên `vohonanim/<id>_{b,f}.png` (clip vẽ thật, cột / khung theo `anim` ở manifest, hàng thân nam); không có clip thì `vohon/<id>_{b,f}.png` (ảnh tĩnh, khung đứng cột 0). `--tinh` ép dùng ảnh tĩnh |
| Lớp | nửa sau và nửa trước ghép thành **một** lớp (nửa trước đè nửa sau); luật lớp vẫn của client: `s` / `se` / `e` sau thân, `ne` / `n` trước thân mờ `PT_FRONT_ALPHA` |
| Gốc | gốc chân của phụ thể (khung 96: `(48, 74)`, khung 128: `(64, 90)`) đặt đúng `PT_ORIGIN`, nên hồn sư đứng đúng chỗ rỗng hình người mà cutter đã để lại trong phụ thể |
| Phóng | **nguyên**, láng giềng gần nhất (mỗi điểm nguồn thành khối s×s, giữ lưới pixel). Thử ×2 trước; nếu một khung nào của hộp bao hợp (cả 5 hướng × 16 khung) không lọt khung 160 (chừa 2 điểm mép) thì ×1. Hình phụ thể cũ hầu hết choán gần hết khung 96 (rộng ~95 điểm), nên 3 mẫu đều ra **×1**; ×2 chỉ hợp hình rộng ≤ 76 điểm. Công cụ in hệ số và số điểm bị cắt (khác 0 là lỗi, `--scale` ép hệ số) |
| Thở (8) | clip `idle` n khung → đi tới khung cuối rồi quay về (`idleSeq`: 4 khung → 0 1 2 2 3 2 2 1); khung đầu là tư thế gốc |
| Đánh (8) | clip `attack` n khung chia đều từ đầu đến cuối (`attackSeq`: 6 khung → 0 1 1 2 3 4 4 5), khung ra đòn ở giữa |
| Chỉ có ảnh tĩnh | thở và đánh **nội suy bằng code tất định** (bảng số nguyên, không ngẫu nhiên, không hàm lượng giác): thở dời dọc 1 điểm nguồn + nghiêng 1 điểm theo độ cao; đánh lùi lấy đà rồi lao theo hướng nhìn (sinh vật / thực vật) hoặc nhấc lên rồi nện xuống (vật cứng, nhóm `V` / `O`). Dời theo điểm nguồn nên giữ lưới pixel |
| Chỗ rỗng hình người | `--fill N` lấp khoảng rỗng hẹp sát gốc chân bằng màu viền tối đi (mặc định tắt: gốc trùng chân hồn sư thì thân hồn sư lấp đúng chỗ đó; chỉ bật khi `display.dx` / `dy` đẩy pháp tướng đi xa thân và chỗ rỗng lộ ra) |
| Bảng màu | median cut còn tối đa `PT_MAX_COLORS` màu, giữ viền `#1a1020` |
| 25 võ hồn | `--all` **từ chối** nếu thiếu `--duyet-mau`; chỉ thêm cờ này sau khi chủ repo duyệt 3 mẫu |

**Cách ghép (`display`).** Dạng "bay sau lưng" nằm ở `PHAP_TUONG` của `shared/data.ts` (`scale`, `dx`, `dy`, quanh gốc hồn sư; test `client/scripts/phaptuong-test.mjs` đối chiếu manifest `pt.*`), không ở ảnh. `PT_ORIGIN` giữ `(80, 124)` vì mọi sheet đã nhập và công cụ này cùng dùng. Hoạt ảnh nằm sẵn trong khung (clip hoặc nội suy) nên `motion` chỉ còn nhịp sáng `pulse` (`BAKED`).

**Ba mẫu (chờ chủ repo duyệt, xem ở `?thu=phaptuong&vh=<id>`):**

| Võ hồn | Nguồn | Phóng | `display` (`scale`, `dx`, `dy`) | Ghi chú |
|---|---|---|---|---|
| Tà Hỏa Phượng Hoàng (`ta_hoa_phuong_hoang`) | `vhanim` khung 96, 4 thở + 6 đánh | ×1 | 1, 0, −4 | bay cao hơn 4 điểm để lửa đuôi không chạm đất |
| Hạo Thiên Chùy (`hao_thien_chuy`) | `vhanim` khung 128, vật cứng 2 thở + 4 đánh | ×1 | 1, 12, −10 | búa lơ lửng chếch sau vai phải, nện xuống ở động tác đánh |
| Lam Ngân Thảo (`lam_ngan_thao`) | `vhanim` khung 96, 4 thở + 6 đánh | ×1 | 1, 0, 0 | mọc sau lưng; bỏ lớp sáng cũ `pt_lam_ngan_thao_glow` (suy ra từ sheet PixelLab cũ, không còn khớp) |

Việc tiếp sau khi duyệt mẫu: chạy `--all --duyet-mau`, đăng ký từng `pt_<id>` bằng `validate.mjs --register pt_<id> --iso` (`display` lấy từ `recipe.json`), chỉnh `dx` / `dy` / `scale` từng võ hồn ở `PHAP_TUONG`, bỏ lớp sáng `_glow` còn lại nếu không khớp sheet mới.

