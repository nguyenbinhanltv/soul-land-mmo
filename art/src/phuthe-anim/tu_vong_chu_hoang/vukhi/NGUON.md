# Tử Vong Chu Hoàng — vũ khí mềm

Part of #1312; issue #1341, PR nháp #1342. Dòng 10 trong `docs/art/phu-the-vu-khi.md`: cuộn tơ có bùa, đồ án sọ, mũi tơ như đinh nhọn. Chờ chủ repo duyệt mỹ thuật, không tự merge.

Codex / OpenAI image_gen tích hợp ngày 2026-10-30; không trả model/seed, không ảnh tham chiếu ngoài. Đầu ra theo điều khoản OpenAI, không gán CC0. RAW nguyên byte, prompt và hash từng lượt trong `isolated/`. Atlas sáu pose không nộm: idle, ba attack, hai cast; mạng lớn và hiệu ứng là code, không nướng vào ảnh. Marker cyan nhỏ bị trừ trước khi ghép.

## Lượt và kiểm

| Hướng | Lượt dùng | Bản chọn | Kiểm mỗi giới |
|---|---|---|---|
| e | 2/3 | 2 | 0 chặn / 0 nhẹ |
| s | 1/3 | 1 | 0 chặn / 1 nhẹ |
| se | 1/3 | 1 | 0 chặn / 0 nhẹ |
| ne | 1/3 | 1 | 0 chặn / 0 nhẹ |
| n | 1/3 | 1 | 0 chặn / 0 nhẹ |

E1 bị loại vì marker cột ba nằm sang cột hai, script báo hai pose cùng ô. E2 yêu cầu bố cục gọn và gốc nằm sâu trong ô, đã đạt trước khi mở rộng. Không nới ngưỡng hoặc dời grip bằng mắt.

Ghép bằng script kế thừa LNT #1322: chọn pose vẽ thật, xoay/dịch vào grip, không uốn tơ bằng code. Nam dùng bảng grip LNT cùng thân LPC; nữ đo grip LPC theo khung. Mặt nạ `lop.json` qua parseLop/layerFn, ne/n mặc định sau và vùng cầm trước. Khung 128, một tỉ lệ 0,09, 32 màu chung, 220 khung nam/nữ; không chạm mép, pixel gần grip tối đa 1,582 px, 72 khung quay lưng ngoài cast có lớp sau. LPC giữ nguồn/giấy phép repo.

Cảnh báo `chan-lech` s/attack/1 21% cả hai giới cần chủ repo xét riêng, không kế thừa mức chấp nhận của LNT. Cần duyệt độ rõ cuộn tơ/sọ, chiều dài giữa hướng và lớp cast. 0 chặn không đồng nghĩa đạt mỹ thuật.

Tái tạo: `node art/src/phuthe-anim/tu_vong_chu_hoang/vukhi/isolated/finalize.mjs`. [Trang ghép/RAW](isolated/index.html), [báo cáo hình học](isolated/result/report.json).

[Ảnh trong game](ingame/index.html): tám ảnh ma trận nam/nữ × idle/walk/attack/cast, đủ năm hướng và Bạch Hổ không vũ khí; hai ảnh GameScene thật sau tạo nhân vật/thức tỉnh qua UI, Tử Vong Chu Hoàng đang ra trận. Chrome `--mute-audio`, âm lượng game 0; ảnh nguyên trang, không dựng lại bằng code. GameScene chứng minh idle, các clip còn lại ở trang thử dùng cùng phép đặt lớp. Không chứng nhận mọi thời điểm/trang phục; cuộn tơ nhỏ ở cỡ game cần duyệt độ rõ.

Build, phutheanim và importer dry-run đạt; credits đã sửa đúng phương pháp và dry-run giữ nguyên. Bot RAM combo 34 đạt, 0 lỗi/0 cảnh báo. Kết quả check cuối trong PR. Không đổi server, SQL hoặc cân bằng.
