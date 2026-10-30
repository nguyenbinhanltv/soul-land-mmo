# Phá Hồn Thương — nhóm cứng, đợt 2

Issue #1368, epic #1020; mẫu #1320 và đợt 1 #1359/#1364/#1365. Chưa duyệt mỹ thuật.

## Nguồn

Codex / OpenAI `image_gen` tích hợp; công cụ không trả mã model hoặc seed. Đầu ra theo điều khoản OpenAI, không gán CC0. Không dùng ảnh ngoài.
RAW nguyên byte và prompt ở `<hướng>/attemptN/`; `source.json` ghi hash, tham chiếu giữa các lượt và ảnh được chọn; `sources.json` dùng để tái tạo từ gốc repo.
Tám job tuần tự: e1, s1/s2, se1, ne1, n1/n2/n3. Không hướng nào vượt ba lượt.

Cán xanh ngọc tối có đạo văn, mũi thoi xanh ngọc có rãnh/chóp trắng, hai tua đỏ. Mặt sau ne/n tối hơn mặt trước; hồn quang và vệt đâm để code.

## Ghép và tái tạo

- Atlas riêng 4×2, tám pose, không người/nộm, nền magenta; marker xanh ở đuôi cán. Giữ nguyên LPC và hình cứng; xoay/dịch nguyên pose tới grip.
- Khung128, cap raster0,10, một tỷ lệ trong mỗi atlas và cap chung năm hướng; không phóng riêng impact. idle0, walk1, attack2/3/6/7, cast6/7, hurt0. idle/walk cầm thương dựng chếch theo gripA.
- Điểm nắm dịch vào cán ít nhất3px để tránh vòng nối marker. s2 sửa marker ngọc thành chấm; n2/n3 sửa vùng xanh rời. RAW nguyên vẹn; cấu hình tách atlas chọn tám marker có diện tích≥100px, mỗi ô một marker gắn vũ khí; đốm xanh8px ở cán n3 không phải marker.
- **Ngoại lệ một tay A ở attack/cast dọc≤15° nhóm cứng đã được chủ repo xác nhận.** Canonical #1375 đã gộp: n/attack1,2 chỉ có một tay hiện hữu, đo đúng bước thân1/2 ở cả nam/nữ (`fallback:false`). Bốn khung này ghi một grip; không lấy cặp tay từ bước khác. Các khung đo đủ hai tay giữ cả hai. A≤2px, ngoài ngoại lệ B≤20px.
- Recipe chỉ cấu hình mã, màu nộm vàng `#D0D000`, khung và tỷ lệ/tách atlas của bộ này; không tạo/vá checker hoặc dummy riêng. Compiler, dummy, checker, cutter dùng API canonical đã gộp và cùng metadata pose.
- 130khung; sau cắt A tối đa0,7072px, 0chặn/0mép,32màu. Cán đo tối đa32,514px / thân mẫu thấp nhất47px≈0,692lần. Cận trên đường chéo bao toàn vũ khí (kể cả gốc marker, đo cả pose không dùng)56,432px /47≈1,201lần; riêng cán vẫn dưới khoảng1,4lần thân.

```sh
node art/src/phuthe-anim/pha_hon_thuong/vukhi/compose.mjs --sources art/src/phuthe-anim/pha_hon_thuong/vukhi/sources.json --out <temp>/pha-hon
node tools/assets/phuthe-import.mjs --id pha_hon_thuong --kind vukhi --dir <temp>/pha-hon/import
node tools/assets/credits.mjs
```

[Báo cáo canonical](final/report.json) · [Báo cáo sau cắt](import/_report.json) · [Nguồn/hash](source.json) · [Ảnh kiểm](index.html).
Hash mã công cụ trong source.json chuẩn hóa xuống dòng LF để tái kiểm đa nền tảng; hash RAW/sprite/ảnh chụp dùng byte nguyên bản.

## Cảnh báo và giới hạn

Mỗi giới có năm `chan-lech` và một `co-phu-the` mức nhẹ trong checker; chi tiết giữ trong báo cáo canonical/source.json. Cutter không có cảnh báo hoặc chặn, còn năm ghi chú mỗi giới: hurt chỉ đo được tay ở bước thân0 lân cận do cẳng tay bị che ở bước1. Ghi rõ để chủ repo duyệt; không kế thừa mức chấp nhận của bộ khác.

## Tự xem trong game trước PR

48ảnh native1600×900:40GameScene (nam/nữ ×s/se/e/ne/n ×attack0/100/190/260ms),8trang thử idle/walk/attack/cast ở190ms, có Bạch Hổ chưa có vũ khí đối chiếu. Đã tự xem GameScene đủ năm hướng qua các ảnh pha nâng/hạ, đặc biệt n/attack1,2 của nam/nữ đã bám tay sau canonical #1375; trang thử nữ attack cũng khớp. Hai phiên chụp không có pageerror.

Chrome luôn `--mute-audio`, master0/muted=true trước tải trang; ảnh không cắt/resize/ghép. Server RAM GAME_TEST=1; tạo nhân vật/thức tỉnh/xếp đội/chọn ra trận qua UI, cấp võ hồn ngoài danh sách cơ bản bằng hook test có sẵn. Dừng GameScene, gọi animatePlayer thật và đặt khung thân tại mốc; đây là kiểm renderer, không phải toàn bộ trận giao chiến. Khung đỏ debug và hướng dẫn còn trong ảnh.
