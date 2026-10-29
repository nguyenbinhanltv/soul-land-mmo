# Pháp tướng Hỏa Ảnh (#1332)

Part of #1306, epic #1020. Chủ repo đã duyệt mẫu Lam Ngân Thảo #1326 rồi giao kiểm từng võ hồn trước khi vẽ tiếp. **Mẫu Hỏa Ảnh này chưa được chủ repo duyệt.**

## Căn cứ vẽ lại

Đã xem sheet pt hiện tại và bản công cụ chuyển thể tạm từ vhanim, đối chiếu thở / đỉnh đòn năm hướng và thử trong game. Bản chuyển thể còn vùng ngực / bụng lấp thành dải, không tạo thân linh thể thật. Đã khôi phục sheet cũ sau audit; không nhập bản chuyển thể đó.

## Nguồn và lượt sinh

- Codex builtin `image_gen.imagegen`, ngày 2026-10-30; công cụ không công bố model / seed.
- Tham chiếu `shared/assets/sprites/vohonanim/hoa_anh_f.png` lấy hình mẫu, màu, motif; không chép chỗ rỗng hình người. Mẫu mới là linh thể than lửa có sừng, thân đặc, dấu lửa trên tay, dải bóng tím liền thân; không người / nộm / da thịt.
- STYLE / NEGATIVE / SPIRIT / SHEET theo `docs/art/phap-tuong-codex-ve-lai.md` và `vo-hon-phong-cach.md`. Năm RAW nguyên byte, nền #FF00FF, không chữ, vuông 4×4. Prompt cuối từng hướng, prompt gốc và SHA256 đi kèm.
- Một job mỗi lần. Số lượt s/se/e/ne/n = **2/2/2/3/1**. Nam thu tờ ở lượt 2; đông nam và đông sửa góc quay ở lượt 2; đông bắc lượt 1 sai mặt trước, lượt 2 đúng lưng nhưng chạm mép, lượt 3 thu đều toàn tờ. Năm tờ chọn đều qua kiểm mép ô.
- **Cần duyệt mỹ thuật:** đông bắc còn một khe sáng nhỏ ở mặt nghiêng; đã hết ba lượt. Bắc nhìn lưng hoàn toàn nhưng đòn vung lệch phải. Cần xem góc nhìn, độ nhất quán kích thước và nhịp giữ đỉnh đòn trong game; không coi đây là mẫu đã được duyệt.

## Ghép và hiển thị

Cutter dùng chung từ #1326, đường dẫn `tools/assets/phaptuong-sheet-cut.mjs`, blob nội dung `e9189290c797aa640347b7a0229d745ab4f69075`. Không ghim commit nhánh bị squash. Cần công cụ trên main và kiểm tái tạo từng byte trước khi coi mẫu sẵn sàng tích hợp.

Lệnh: `node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/hoa_anh shared/assets/sprites/phaptuong/hoa_anh.png --no-despill`. Giữ dải tím hợp lệ bằng `--no-despill`; vẫn khóa nền magenta và chuẩn hóa viền tối. Sheet 16×5 khung 160, gốc (80,124), 48 màu, alpha 0/255. Glow dựng từ sheet mới bằng `buildGlow`, màu #ff3a4a.

Hiển thị riêng: scale 1,5, dy −20, bob 2, đồng bộ PHAP_TUONG và manifest; không đổi chỉ số chiến đấu. Đã giảm từ 1,8 / −24 sau khi thấy sừng chạm vùng điều khiển trong cảnh thử zoom 2.

## Kiểm

Đã kiểm đủ 80 khung có hình, không chạm biên, trần 48 màu. Test pháp tướng client, `npm run check`, `npm run build` và bot RAM combo 34/34 đạt. `ui:check` trên năm RAW báo ám hồng; `phuthe:check` không có tờ toA–toE vì bộ kiểm đó dành cho phụ thể quanh nộm, không hỗ trợ tờ pháp tướng độc lập 4×4. Cutter khóa nền và lượng tử riêng, thành phẩm được xem trên nền game. Đã chụp lại đủ năm hướng TRONG GAME theo tham số hiển thị cuối; ảnh ở trang duyệt chung của phiên soul_land_game-840, phần Hỏa Ảnh.
