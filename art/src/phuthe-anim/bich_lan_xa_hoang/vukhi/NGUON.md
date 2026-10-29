# Bích Lân Xà Hoàng — xà tiên

Part of #1312; issue #1346, PR nháp #1347. Dòng 11 trong `docs/art/phu-the-vu-khi.md`: roi rắn lục thẫm, vảy ngọc, mào và nanh dài. Chờ chủ repo duyệt mỹ thuật, không tự merge.

Codex / OpenAI image_gen tích hợp ngày 2026-10-30, model/seed không được trả về, không ảnh tham chiếu ngoài. Theo điều khoản đầu ra OpenAI, không gán CC0. RAW nguyên byte, prompt/hash trong `isolated/`. Mỗi atlas sáu pose không nộm: idle, ba attack, hai cast. Không vẽ sương độc/hạt sáng. Marker lam `#0000FF` tránh trùng màu ngọc/mắt vàng, bị trừ trước ghép.

## Lượt và kiểm

| Hướng | Lượt dùng | Bản chọn | Chặn / nhẹ nam; nữ |
|---|---|---|---|
| e | 1/3 | 1 | 0/0; 0/0 |
| s | 1/3 | 1 | 0/1; 0/1 |
| se | 1/3 | 1 | 0/1; 0/1 |
| ne | 1/3 | 1 | 0/0; 0/0 |
| n | 2/3 | 2 | 0/0; 0/0 |

E đạt cả hai giới trước khi mở rộng. N1 bị loại bằng mắt: attack strike lộ miệng/nanh về người xem, dù kiểm máy không chặn. N2 khóa mặt sau cả sáu pose, đã chọn; giữ RAW/prompt/hash N1, không sửa ảnh lỗi để che mặt.

Ghép theo mẫu LNT #1322, giữ LPC: nam dùng grip LNT cùng thân/clip, nữ đo gripPoints từng khung. Chỉ chọn pose thật rồi xoay/dịch, không uốn thân rắn bằng code. Mặt nạ `lop.json` đọc bằng parseLop/layerFn: ne/n mặc định sau, vùng cầm trước, cast theo khung. Khung 128, tỉ lệ chung 0,09, 32 màu chung, 220 khung; không chạm mép, pixel gần grip tối đa 1,553 px; 72 khung quay lưng ngoài cast có lớp sau. LPC theo nguồn/giấy phép repo.

Cảnh báo `chan-lech` attack/1: s nam 29%/nữ 30%, se nam 16%/nữ 14%, cần chủ repo duyệt riêng; không kế thừa mức chấp nhận của LNT. Cần duyệt độ rõ đầu rắn, độ dày/chiều dài giữa atlas và lớp cast. 0 chặn không đồng nghĩa đạt mỹ thuật.

Tái tạo: `node art/src/phuthe-anim/bich_lan_xa_hoang/vukhi/isolated/finalize.mjs`. [Trang ghép/RAW](isolated/index.html), [báo cáo hình học](isolated/result/report.json).

[Ảnh trong game](ingame/index.html) gồm ma trận nam/nữ × idle/walk/attack/cast, năm hướng và Bạch Hổ không vũ khí; hai GameScene thật sau tạo nhân vật/thức tỉnh qua UI, Bích Lân Xà Hoàng đang ra trận. Chrome `--mute-audio`, âm lượng game 0, ảnh nguyên trang không dựng lại bằng code. GameScene chứng minh idle; các clip còn lại ở trang thử dùng cùng phép đặt lớp. Không chứng nhận mọi thời điểm/trang phục; đầu rắn nhỏ ở cỡ game cần duyệt độ rõ.

Build, phutheanim, importer dry-run đạt; credits đúng phương pháp và dry-run giữ nguyên. Bot RAM combo 34 đạt, 0 lỗi/0 cảnh báo. Validate 1780 key, 0 lỗi/0 cảnh báo; check cuối ghi trong PR. Không đổi server, SQL hoặc cân bằng.
