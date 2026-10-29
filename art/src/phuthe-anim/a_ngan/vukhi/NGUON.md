# A Ngân — roi dây vàng xanh

Part of #1312; issue #1352, PR nháp #1353. Dòng 22 `docs/art/phu-the-vu-khi.md`: dây vàng xanh, hoa nhỏ ở đầu nắm, không sao/trái tim. Giữ nháp chờ chủ repo duyệt mỹ thuật, không tự merge.

Codex / OpenAI image_gen tích hợp ngày 2026-10-30, model/seed không trả về, không ảnh tham chiếu ngoài. Theo điều khoản đầu ra OpenAI, không gán CC0. RAW nguyên byte, prompt/hash ở `isolated/`. Mỗi hướng một atlas sáu pose không nộm, từng job tuần tự; e đạt nam/nữ trước mở rộng. Cả năm hướng dùng **1/3 lượt**, chọn lượt 1. Marker đỏ `#FF2040` tránh màu lam/vàng, bị trừ trước ghép; không nướng hào quang/hạt sáng vào ảnh.

Ghép theo LNT #1322, giữ LPC: nam dùng bảng grip LNT cùng thân/clip, nữ đo gripPoints từng khung. Chỉ chọn pose thật rồi xoay/dịch vào grip, không uốn dây bằng code. Mặt nạ `lop.json` đọc bằng parseLop/layerFn: ne/n mặc định sau, vùng cầm trước, cast theo khung. Khung 128, tỉ lệ chung 0,09, 32 màu chung, 220 khung; không chạm mép, pixel gần grip tối đa 1,487 px; 72 khung quay lưng ngoài cast có lớp sau. LPC theo nguồn/giấy phép repo.

Mười tờ nam/nữ **0 chặn**. Cảnh báo `chan-lech` attack/1: s nam 23%/nữ 24%, se 16% cả hai giới, cần chủ repo xét riêng; không kế thừa mức chấp nhận LNT. Cần duyệt độ rõ hoa đầu nắm, chiều dài/độ dày dây và lớp cast. 0 chặn không thay duyệt mỹ thuật.

Tái tạo: `node art/src/phuthe-anim/a_ngan/vukhi/isolated/finalize.mjs`. [Trang ghép/RAW](isolated/index.html), [báo cáo hình học](isolated/result/report.json).

[Ảnh trong game](ingame/index.html): tám ảnh ma trận nam/nữ × idle/walk/attack/cast, năm hướng và Bạch Hổ không vũ khí; hai GameScene thật. A Ngân không thuộc lựa chọn thức tỉnh: tạo nhân vật/thức tỉnh Hỏa Long qua UI, hook GAME_TEST grant sẵn có trên server RAM cấp A Ngân, gửi team chỉ có A Ngân rồi chờ state server xác nhận. Cả hai cảnh ghi serverVohon = expectedVohon = 21. Không sửa code game hay giả sprite/state phía client. Chrome `--mute-audio`, âm lượng game 0; ảnh nguyên trang không dựng lại bằng code. GameScene chứng minh idle; các clip còn lại ở trang thử dùng cùng phép đặt lớp. Không chứng nhận mọi thời điểm/trang phục; cần duyệt độ rõ hoa đầu nắm ở cỡ game.

Build, phutheanim, importer dry-run đạt; credits đúng Codex vẽ riêng và dry-run giữ nguyên. Bot RAM combo 34 đạt, 0 lỗi/0 cảnh báo. Validate 1782 key và quality 1777 asset đều 0 lỗi/0 cảnh báo; check cuối ghi trong PR. Không đổi server, SQL hoặc cân bằng.
