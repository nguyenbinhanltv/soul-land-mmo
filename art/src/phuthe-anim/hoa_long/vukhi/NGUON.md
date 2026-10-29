# Hỏa Long — vũ khí mềm

Part of #1312; issue #1338, PR nháp #1339. Theo dòng 7 trong `docs/art/phu-the-vu-khi.md` và phương pháp Lam Ngân Thảo đã duyệt (#1322). Chờ chủ repo duyệt mỹ thuật, không tự merge.

## Nguồn và phương pháp

Codex / OpenAI image_gen tích hợp, ngày 2026-10-30; model và seed không được trả về. Không ảnh tham chiếu bên ngoài. Đầu ra theo điều khoản OpenAI, không gán CC0. RAW nguyên byte, prompt và SHA256 từng lượt ở `isolated/<hướng>/attempt<N>/`. Không nộm trong RAW; sáu pose gồm idle, ba attack và hai cast. Marker cyan `#00FFFF` để tránh ăn nhầm màu than hồng, trừ khỏi sprite trước khi ghép.

Script ghép kế thừa mẫu LNT tại commit `54dae04f86b5b6ad24cab6bf396e148b756efe7e`, giữ thân LPC, đo grip nữ từ LPC và dùng bảng grip nam LNT (cùng thân, cùng clip). Mặt nạ theo `lop.json`; ne/n mặc định sau, vùng cầm trước, cast theo khung. Không uốn dây bằng code, chỉ chọn hình đã vẽ rồi xoay/dịch tới grip. Một tỉ lệ chung 0,09, khung 128, 32 màu chung, 220 khung nam/nữ. LPC theo nguồn và giấy phép sẵn có của repo.

## Lượt và bài học

| Hướng | Lượt dùng | Bản chọn | Kiểm nam/nữ |
|---|---|---|---|
| e | 1/3 | 1 | 0 chặn / 0 nhẹ |
| s | 3/3 | 3 | 0 chặn / 1 nhẹ mỗi giới |
| se | 1/3 | 1 | 0 chặn / 1 nhẹ mỗi giới |
| ne | 1/3 | 1 | 0 chặn / 0 nhẹ |
| n | 1/3 | 1 | 0 chặn / 0 nhẹ |

- S1: cast cao bị đứt thành hai cụm; tìm được bảy cụm thay vì sáu. Không vá dây hoặc nới ngưỡng tách.
- S2: gốc sát ranh giới cột, script báo hai pose cùng ô. S3 yêu cầu tọa độ gốc nằm sâu trong từng ô và vòng cast mở, đã ghép được; không gọi lượt 4.
- SE1: tỉ lệ tự chọn gây pixel gần grip cách 2,0025 px; dùng tỉ lệ chung nhỏ hơn 0,09, khoảng cách lớn nhất toàn bộ 1,887 px. Không thay ngưỡng 2 px, không dời grip.
- Cảnh báo `chan-lech`: s/attack/1 28%, se/attack/1 20%, ở cả hai giới. Đây là cảnh báo của ảnh ghép với nộm LPC nguyên bản; vẫn cần chủ repo xét riêng, không kế thừa mức chấp nhận 14% của LNT.
- Cần duyệt độ dài, độ dày và góc đầu rồng giữa các atlas, cùng đường chuyển lớp cast. 0 chặn không đồng nghĩa đạt mỹ thuật.

## Tái tạo và duyệt

`node art/src/phuthe-anim/hoa_long/vukhi/isolated/finalize.mjs` tái tạo ghép, kiểm và sheet cuối. [Trang xem ghép](isolated/index.html), [báo cáo hình học](isolated/result/report.json). Không chạm mép; 72 khung quay lưng ngoài cast có lớp sau. Nguồn grip nam: `../lam_ngan_thao/vukhi/manifest-entry.json` tính từ thư mục võ hồn (xem đường dẫn chính xác trong script).

Đã nhập bằng `phuthe-import --kind vukhi`; dry-run lặp giữ nguyên ảnh/manifest/credits. [Ảnh trong game](ingame/index.html) gồm ma trận nam/nữ × idle/walk/attack/cast đủ năm hướng, Bạch Hổ không vũ khí và hai cảnh GameScene thật nam/nữ. Chrome `--mute-audio`, âm lượng game 0; ảnh nguyên từ trang, không dựng lại bằng code. GameScene chụp idle sau đăng ký/tạo nhân vật/thức tỉnh thật, Hỏa Long đang ra trận. Không chứng nhận mọi thời điểm/trang phục. Đầu rồng nhỏ ở cỡ game, cần chủ repo duyệt độ đọc rõ và độ dài giữa hướng.

Build và kiểm hồi quy `test:phutheanim` đạt; validate 1780 key, 0 lỗi/0 cảnh báo. Kiểm bot và check cuối ghi trong mô tả PR. Không đổi server, SQL hoặc cân bằng.
