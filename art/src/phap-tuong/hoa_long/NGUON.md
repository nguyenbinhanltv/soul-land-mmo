# Pháp tướng Hỏa Long (#1334)

Part of #1306, epic #1020. Chủ repo đã duyệt mẫu Lam Ngân Thảo #1326 rồi giao kiểm từng võ hồn trước khi vẽ tiếp. **Mẫu Hỏa Long này chưa được chủ repo duyệt.**

## Căn cứ vẽ lại

Đã xem sheet pt hiện tại và bản công cụ chuyển thể tạm từ vhanim, đối chiếu thở / đỉnh đòn năm hướng và thử trong game. Bản chuyển thể có dải ngang ở vùng lấp thân, không tạo đoạn thân rồng nối liền. Đã khôi phục sheet gốc sau audit; không nhập bản chuyển thể đó.

## Nguồn và lượt sinh

- Codex builtin `image_gen.imagegen`, ngày 2026-10-30; công cụ không công bố model / seed.
- Tham chiếu motif, màu và hình ngoài: `shared/assets/sprites/vohonanim/hoa_long_f.png`. Mẫu mới có đầu rồng sừng gai, thân đặc nối liên tục thành chữ S đứng, vảy nứt than lửa; không nộm / khoảng trống hình người. Khoảng trống tự nhiên giữa hai đoạn cong không có hình người.
- STYLE / NEGATIVE / SPIRIT / SHEET theo `docs/art/phap-tuong-codex-ve-lai.md` và `vo-hon-phong-cach.md`. Năm RAW nguyên byte, nền #FF00FF, không chữ, vuông 4×4; prompt cuối từng hướng, prompt gốc và SHA256 đi kèm.
- Một job mỗi lần. **Số lượt đã dùng s/se/e/ne/n = 2/3/1/3/1** (`attemptsUsed`); **lượt chọn = 2/1/1/3/1** (`selectedAttempts`). Nam thu tờ ở lượt 2. Đông nam lượt 2 sửa góc, lượt 3 thu tờ nhưng cả hai vẫn chạm ranh ô; chọn lại lượt 1 đã qua cutter. Đông bắc lượt 1 còn mặt nghiêng; lượt 2 sửa góc lưng nhưng có một pixel tối chạm ranh hàng ở lấy đà; lượt 3 thu đều và qua cutter. Không sinh lượt thứ tư.
- **Cần duyệt mỹ thuật:** đông nam chọn lượt 1 còn gần chính diện, cần chủ repo đối chiếu với nam; hướng này đã hết ba lượt. Cần xem góc đông bắc / bắc và nhịp giữ đỉnh đòn. Không coi kiểm kỹ thuật là đã được chủ repo duyệt mẫu.

## Ghép và hiển thị

Cutter dùng chung ở `tools/assets/phaptuong-sheet-cut.mjs` của #1326, blob nội dung `e9189290c797aa640347b7a0229d745ab4f69075`, không ghim commit nhánh bị squash. Cần công cụ trên main và kiểm tái tạo từng byte sheet / glow trước khi coi mẫu sẵn sàng tích hợp.

Lệnh: `node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/hoa_long shared/assets/sprites/phaptuong/hoa_long.png`. Dùng khử ám mặc định trong hai điểm sát nền gốc, chuẩn hóa viền tối. Sheet 16×5 khung 160, gốc (80,124), 48 màu, alpha 0/255. Glow dựng từ sheet mới bằng `buildGlow`, màu #ff4a2a. Kiểm mép r,b >100 và g <0,4×min(r,b): 0 điểm; viền #1a1020 có 44.411 điểm.

Hiển thị riêng: scale 1,5, dy −20, bob 2, đồng bộ PHAP_TUONG và manifest; không đổi chỉ số chiến đấu.

## Kiểm

Đã kiểm đủ 80 khung có hình, không chạm biên, trần 48 màu. Test pháp tướng client, `npm run check`, `npm run build` và bot RAM combo 34/34 đạt. `ui:check` năm RAW báo ám hồng; `phuthe:check` không có toA–toE vì không hỗ trợ bộ pháp tướng độc lập 4×4. Cutter khử ám / lượng tử riêng, thành phẩm kiểm mép không còn nhóm hồng tím sáng theo ngưỡng ở trên. Ảnh duyệt năm hướng chụp TRONG GAME, cần chủ repo xem góc đông nam còn gần chính diện và nhịp đòn trước khi duyệt mẫu.
