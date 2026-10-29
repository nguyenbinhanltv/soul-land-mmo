# Pháp tướng Quỷ Mị (#1333)

Part of #1306, epic #1020. Chủ repo đã duyệt mẫu Lam Ngân Thảo #1326 rồi giao kiểm từng võ hồn trước khi vẽ tiếp. **Mẫu Quỷ Mị này chưa được chủ repo duyệt.**

## Căn cứ vẽ lại

Đã xem sheet pt hiện tại và bản chuyển thể tạm từ vhanim, đối chiếu thở / đỉnh đòn năm hướng và thử trong game. Bản chuyển thể có dải ngang tím ở vùng lấp thân, không thành linh thể thật. Đã khôi phục sheet gốc sau audit; không nhập bản chuyển thể đó.

## Nguồn và lượt sinh

- Codex builtin `image_gen.imagegen`, ngày 2026-10-30; công cụ không công bố model / seed.
- Tham chiếu motif, màu, hình ngoài: `shared/assets/sprites/vohonanim/quy_mi_f.png`. Mẫu mới có mặt nạ sừng, vuốt dài, thân bóng đặc, dải âm vụ liền thân và viền #8a8aff bắt buộc; không nộm / da thịt / khoảng trống hình người.
- STYLE / NEGATIVE / SPIRIT / SHEET theo `docs/art/phap-tuong-codex-ve-lai.md` và `vo-hon-phong-cach.md`. Năm RAW nguyên byte, nền #FF00FF, không chữ, vuông 4×4; prompt cuối từng hướng, prompt gốc và SHA256 đi kèm.
- Một job mỗi lần; s/se/e/ne/n = **2/1/2/2/1**. Nam, đông và đông bắc lượt 2 chỉ thu đều toàn tờ sau khi dáng sát / chạm mép. Năm tờ chọn đều qua kiểm mép ô.
- **Cần duyệt mỹ thuật:** đối chiếu góc đông bắc với đông, độ rộng dáng giữa các hướng và nhịp giữ đỉnh đòn trong game. Cutter chuẩn hóa chiều cao thở theo hướng; không co riêng từng pose đánh. Bắc là mặt lưng, không thấy mắt / dấu ngực. Không coi kết quả kiểm kỹ thuật là chủ repo đã duyệt mẫu.

## Ghép và hiển thị

Cutter dùng chung ở `tools/assets/phaptuong-sheet-cut.mjs` của #1326, blob nội dung `e9189290c797aa640347b7a0229d745ab4f69075`, không ghim commit nhánh bị squash. Cần công cụ trên main và kiểm tái tạo từng byte sheet / glow trước khi coi mẫu sẵn sàng tích hợp.

Lệnh: `node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/quy_mi shared/assets/sprites/phaptuong/quy_mi.png`. Khử ám mặc định trong hai điểm sát nền gốc, giữ bóng tím bên trong thân và viền lam tím; chuẩn hóa viền tối. Áp bài học review ám nền Hỏa Ảnh #1344 trước khi mở PR, không sinh thêm RAW. Sheet 16×5 khung 160, gốc (80,124), 48 màu, alpha 0/255. Glow dựng từ sheet đã khử ám bằng `buildGlow`, màu #8a8aff.

Hiển thị riêng: scale 1,5, dy −20, bob 2, đồng bộ PHAP_TUONG và manifest; không đổi chỉ số chiến đấu.

## Kiểm

Đã kiểm đủ 80 khung có hình, không chạm biên, trần 48 màu. Test pháp tướng client, `npm run check`, `npm run build` và bot RAM combo 34/34 đạt. `ui:check` năm RAW báo ám hồng (đông nam / bắc thêm cảnh báo khoảng cách); `phuthe:check` không có tờ toA–toE vì không hỗ trợ bộ pháp tướng độc lập 4×4. Cutter xử lý nền và lượng tử riêng. Thành phẩm có 32.438 điểm viền #1a1020; ngưỡng r,b >100 và g <0,4×min(r,b) còn 1.046 điểm mép, cùng màu tím 112,24,176. Đã xem trên nền game và chụp năm hướng sau khử ám, viền lam tím còn rõ; cần chủ repo duyệt màu / góc / nhịp đòn. Ảnh ở trang duyệt chung của phiên soul_land_game-840, phần Quỷ Mị.
