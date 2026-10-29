# Càn Khôn Hỗn Nguyên Tỏa — khóa xích

Part of #1312; issue #1349, PR nháp #1350. Dòng 12 `docs/art/phu-the-vu-khi.md`: xích vàng đồng, vòng phù văn nhỏ và ổ khóa ở đầu nặng. Giữ PR nháp chờ chủ repo duyệt mỹ thuật, không tự merge.

Codex / OpenAI image_gen tích hợp ngày 2026-10-30; model/seed không trả về, không ảnh tham chiếu ngoài. Theo điều khoản đầu ra OpenAI, không gán CC0. RAW nguyên byte, prompt/hash trong `isolated/`. Mỗi hướng một atlas sáu pose không nộm, từng job tuần tự; e đạt nam/nữ trước mở rộng. Cả năm hướng dùng **1/3 lượt**, chọn lượt 1. Marker cyan nhỏ bị trừ, không nướng pháp trận/vệt chuyển động vào ảnh.

Ghép theo mẫu LNT #1322, giữ LPC: nam dùng bảng grip LNT cùng thân/clip, nữ đo gripPoints từng khung. Chỉ chọn pose thật rồi xoay/dịch tới grip, không uốn xích bằng code. Mặt nạ `lop.json` đọc bằng parseLop/layerFn: ne/n mặc định sau, vùng cầm trước, cast theo khung. Khung 128, tỉ lệ chung 0,09, 32 màu chung, 220 khung; không chạm mép, pixel gần grip tối đa 1,524 px, 72 khung quay lưng ngoài cast có lớp sau. LPC giữ nguồn/giấy phép repo.

Mười tờ nam/nữ **0 chặn**. Cảnh báo `chan-lech` attack/1: s nam 24%/nữ 26%, se 18% cả hai giới, cần chủ repo duyệt riêng; không kế thừa mức chấp nhận của LNT. Cần xét độ rõ vòng/ổ khóa ở cỡ game, kích thước vòng và chiều dài xích giữa atlas, lớp cast. 0 chặn không thay duyệt mỹ thuật.

Tái tạo: `node art/src/phuthe-anim/can_khon_hon_nguyen_toa/vukhi/isolated/finalize.mjs`. [Trang ghép/RAW](isolated/index.html), [báo cáo hình học](isolated/result/report.json).

[Ảnh trong game](ingame/index.html): tám ảnh ma trận nam/nữ × idle/walk/attack/cast, năm hướng và Bạch Hổ không vũ khí; hai GameScene thật sau tạo nhân vật/thức tỉnh UI, Càn Khôn Hỗn Nguyên Tỏa đang ra trận. Chrome `--mute-audio`, âm lượng game 0; ảnh nguyên trang không dựng lại bằng code. GameScene chứng minh idle, các clip còn lại ở trang thử dùng cùng phép đặt lớp. Không chứng nhận mọi thời điểm/trang phục; cần duyệt độ rõ vòng/ổ khóa ở cỡ game.

Build, phutheanim, importer dry-run đạt; credits đúng Codex vẽ riêng và dry-run giữ nguyên. Bot RAM combo 34 đạt, 0 lỗi/0 cảnh báo. Validate 1780 key, quality 1775 asset đều 0 lỗi/0 cảnh báo; check cuối ghi trong PR. Không đổi server, SQL hoặc cân bằng.
