# Pháp tướng Băng Phượng Hoàng (#1457)

PR #1491, võ hồn cuối nhóm B. Đã nhập sprite và glow, chưa merge. Tử Vong Chu Hoàng và Bích Lân Xà Hoàng đã gộp trước đó; Bạch Hổ ở PR #1476.

Nguồn: OpenAI / Codex `image_gen` tích hợp, ngày 31/10/2026. Công cụ không trả model ID hoặc seed. Sử dụng theo điều khoản đầu ra OpenAI, không gán CC0. RAW giữ nguyên byte; mọi ảnh đều native 1254×1254. Kích thước và SHA256 ở `SHA256.json`.

Mỗi hướng một job riêng, lưới 4×4, nền #FF00FF. STYLE/NEGATIVE từ mục 6 của `docs/art/vo-hon-phong-cach.md`; hình mẫu mục 4: cánh tinh thể, mào băng nhọn, đuôi băng cuộn, thân lam thẫm #2a5a8a, sáng #a8e8ff, nhấn trắng và lõi tím. Pháp tướng độc lập có thân chim đầy đủ, không nộm hoặc chỗ rỗng hình người. Đã xem phụ thể cũ để lấy hình/màu, không chép khoảng rỗng. Chỉ hướng se lượt 1 gửi ảnh s làm dẫn; các lượt khác không đính kèm ảnh, không dùng ảnh thương mại.

## Nhật ký lượt

| Hướng | Lượt | Kết quả |
| --- | ---: | --- |
| s | 1 | Chọn, thân liền, nhìn thẳng, cutter đạt. |
| se | 1 | Loại: vẫn nhìn thẳng giống s; RAW và prompt giữ ở se-v1. |
| se | 2 | Chọn: nhấn mạnh quay phải xuống, cutter đạt. |
| e | 1 | Loại: khung đánh chạm ranh ô; RAW và prompt giữ ở e-v1. |
| e | 2 | Chọn: chỉ sửa lề, thu gọn mọi pose, cutter đạt. |
| ne | 1 | Loại: cánh đánh chạm mép canvas; RAW và prompt giữ ở ne-v1. |
| ne | 2 | Chọn: chỉ sửa lề, thu gọn mọi pose; thấy chủ yếu lưng, cutter đạt. |
| n | 1 | Loại: cánh đánh chạm mép canvas; RAW và prompt giữ ở n-v1. |
| n | 2 | Chọn: chỉ sửa lề, cánh gọn cạnh thân; quay lưng, cutter đạt. |

Tổng lượt s/se/e/ne/n = 1/2/2/2/2, không vượt ba lượt mỗi hướng. Prompt được chọn ở `<hướng>.prompt.txt`; lượt bị loại có hậu tố `-v1`. Không co giãn RAW, không padding, không bù ô, không nới checker.

## Nhập và tái tạo

`node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/bang_phuong_hoang shared/assets/sprites/phaptuong/bang_phuong_hoang.png`

Cutter chuẩn ghép đủ 80 khung, 48 màu, hệ số 0,9864. Glow dựng từ sheet mới bằng `buildGlow` của `tools/assets/phuthe-to-phaptuong-lib.mjs`, màu #a8e8ff. Recipe và hash thành phẩm ở `recipe.json`. Merge origin/main trước khi đăng ký thân/glow bằng validate và sinh lại `credits.mjs` theo #1483. Giữ display scale=1, dx=0, dy=0.

## Kiểm trong game

Chrome thật headless với `--mute-audio`, trang thử dùng `noAudio:true`, năm hướng s/se/e/ne/n; mỗi hướng một ảnh thở và sáu pha đánh. `game-preview.png`: năm cột theo hướng, hàng đầu thở, sáu hàng sau đánh. Hướng ne/n dùng alpha trước thân 0,7 theo client.

Hạn chế: đỉnh đánh và nhịp thu cánh chưa giữ đều ở mọi hướng, nhất là n có biên độ nhỏ; thở có dao động nhỏ về cỡ do model. Giữ PR nháp để chủ repo duyệt hình, không tự coi là đã duyệt động tác, không tự merge.
