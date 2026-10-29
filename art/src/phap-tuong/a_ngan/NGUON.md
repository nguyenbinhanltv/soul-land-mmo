# Pháp tướng A Ngân vẽ lại (#1328)

Part of #1306, epic #1020. Chủ repo đã duyệt mẫu Lam Ngân Thảo #1326 và giao kiểm từng bản chuyển thể trước khi vẽ tiếp. **A Ngân chưa được chủ repo duyệt.**

## Căn cứ cần vẽ lại

Đã kiểm sheet `pt_a_ngan` hiện tại trên `origin/main` và chạy `phuthe-to-phaptuong.mjs --id a_ngan` ra thư mục tạm, so sánh thở / đỉnh đòn ở đủ năm hướng. Bản chuyển thể từ vhanim có nhiều dải ngang xanh-vàng trong vùng lấp thân, rõ ở hướng đông / bắc; không tạo được thân cổ thụ thật. Đã thử trong `/choi?thu=phaptuong` và khôi phục sheet gốc sau audit. Không nhập bản chuyển thể lỗi này.

## Nguồn và quy cách

- Công cụ: Codex built-in `image_gen.imagegen`; model / seed không được công cụ công bố.
- Ngày: 2026-10-30. Tham chiếu motif / màu: `shared/assets/sprites/vohonanim/a_ngan_f.png`, không sao chép khoảng rỗng hình người. Các hướng sau dùng tờ cùng võ hồn đã kiểm hình làm tham chiếu nhận diện.
- Cây Lam Ngân Hoàng độc lập: thân cổ thụ xoắn đặc, hoa lam-vàng, dây vàng; không nộm / mặt người. STYLE, NEGATIVE, SPIRIT, SHEET theo `docs/art/phap-tuong-codex-ve-lai.md` và `vo-hon-phong-cach.md`.
- RAW giữ nguyên byte; nền #FF00FF, tờ vuông 4×4, không chữ; prompt cuối mỗi hướng ở `*.prompt.txt`, hash RAW ở `SHA256.json`.
- Một job mỗi lần; tối đa ba lượt mỗi tờ. Không dùng ảnh hỏng làm mẫu thiết kế cho võ hồn khác.

## Nhật ký

| Hướng | Lượt | Kết quả |
|---|---:|---|
| s | 1 | Loại: dây ở khung 13 chạm mép ô |
| s | 2 | Chọn: cây thu đồng đều, lề rộng |
| se | 1 | Chọn: lưới đủ, không chạm mép |
| e | 1 | Loại: góc gần chính diện, dây lấn ô |
| e | 2 | Loại: thừa một hình ở hàng đánh |
| e | 3 | Chọn để duyệt: đúng 16 hình, không chạm mép; hoa còn thấy một phần mặt trước |
| ne | 1 | Loại: còn thấy nhụy hoa như hướng trước |
| ne | 2 | Loại: đã thấy đài hoa sau nhưng dây lấn ô |
| ne | 3 | Chọn: đài hoa sau che nhụy, pose gọn trong ô |
| n | 1 | Loại: đỉnh đòn lấn lên hàng trên |
| n | 2 | Chọn: lề rộng, đài hoa sau che nhụy; pose gọn trong ô |

## Ghép và kiểm tra

Cutter dùng chung từ PR #1326 đã có trên main, blob nội dung `e9189290c797aa640347b7a0229d745ab4f69075`, đường dẫn `tools/assets/phaptuong-sheet-cut.mjs`. Đã merge main `4ace05b1fefc0b0af7084681be085b26ef83dae4` vào nhánh này và tái tạo từ năm RAW bằng đúng công cụ đó: sheet và glow đều khớp từng byte. SHA256 xác nhận nằm trong `recipe.json`. Lệnh ghép:

`node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/a_ngan shared/assets/sprites/phaptuong/a_ngan.png`

Ghép 16 cột × 5 hàng, khung 160, gốc (80,124), bảng màu tối đa 48 màu, alpha 0/255; giữ một tỉ lệ trong mỗi hướng và căn chân từng khung. Khử hồng chỉ sát nền, giữ bóng trong thân, viền tối về #1a1020. Lớp `_glow` dựng lại bằng `buildGlow` từ sheet mới, màu #7fd8ff.

Hiển thị A Ngân: scale 1,8, dy −24, bob 2; nâng rễ sau vai thay vì sát chân hồn sư, đồng bộ `PHAP_TUONG` và metadata manifest. Không đổi luật hay chỉ số chiến đấu.

Kiểm mép ô từng hướng bằng cutter trước ghép; sau ghép chạy kiểm asset, `npm run check` và chụp trong game để duyệt. Hướng e đã dùng đủ ba lượt, cần chủ repo xem góc nghiêng và nhịp giữ đỉnh đòn; không tự sinh lượt thứ tư.

Kết quả: năm hướng qua kiểm mép ô, sheet 80 khung / 48 màu; `test:phaptuong`, `npm run check`, `npm run build` đạt; bot RAM `combo` đạt 34/34. `ui:check --kind I` trên RAW báo viền hồng và số màu vượt chuẩn kit UI (32); đây không phải kết quả duyệt pháp tướng. Cutter xử lý nền và lượng tử theo chuẩn pháp tướng 48 màu, đã kiểm thành phẩm trên nền game. `phuthe:check` chỉ hỗ trợ tờ phụ thể 6×4 quanh nộm, không áp trực tiếp cho tờ này. Ảnh năm hướng có ở artifact của phiên soul_land_game-840, trang duyệt chung `duyet-lam-ngan-thao.html`.
