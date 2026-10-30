# Quỷ Mị — hái nhóm cứng, đợt 2

Issue #1381, epic #1020; tiếp sau Phá Hồn Thương #1368. Chưa duyệt mỹ thuật.

## Nguồn

Codex / OpenAI `image_gen` tích hợp; công cụ không trả mã model hoặc seed. Đầu ra theo điều khoản OpenAI, không gán CC0. Không dùng ảnh ngoài.
RAW nguyên byte và prompt ở `<hướng>/attemptN/`; `source.json` ghi hash, tham chiếu giữa các lượt và ảnh được chọn; `sources.json` dùng để tái tạo từ gốc repo.

Lưỡi hái tím lam đậm `#22224a`, viền sáng theo `#8a8aff`; mặt nạ quỷ kim loại gắn gốc lưỡi, khe mắt trắng lam. Mặt sau là tấm kim loại khắc ấn. Khói/vệt quét/bóng quỷ để code, không bake vào atlas.

## Ghép và tái tạo

- Atlas riêng 4×2, tám pose, không người/nộm, nền magenta; marker xanh ở đuôi cán. Giữ nguyên LPC và hình cứng; xoay/dịch nguyên pose tới grip.
- Khung128, cap raster0,10, tỷ lệ chung năm hướng; không phóng riêng impact. idle0, walk1, attack2/3/6/7, cast6/7, hurt0. Điểm nắm vào cán ít nhất3px, chọn marker xanh diện tích≥100px; không sửa RAW.
- **Ngoại lệ một tay A ở attack/cast dọc≤15° nhóm cứng đã được chủ repo xác nhận.** Dùng canonical #1375 đã gộp; đo đúng bước thân hiện tại nếu chỉ một tay hiện hữu. A≤2px; ngoài ngoại lệ B≤20px. Không mở rộng danh sách hay ngưỡng checker.
- Recipe chỉ cấu hình mã, màu vạch cam `#FF8C00` theo `phutheInfo`, khung và tỷ lệ/tách atlas; không tạo checker/dummy riêng. Các công cụ canonical nhận cùng metadata pose.

```sh
node art/src/phuthe-anim/quy_mi/vukhi/compose.mjs --sources art/src/phuthe-anim/quy_mi/vukhi/sources.json --out <temp>/quy-mi
node tools/assets/phuthe-import.mjs --id quy_mi --kind vukhi --dir <temp>/quy-mi/import
node tools/assets/credits.mjs
```

Hash công cụ trong source.json chuẩn hóa xuống dòng LF; hash RAW/sprite/ảnh chụp dùng byte nguyên bản. Đạt kỹ thuật không thay duyệt mỹ thuật.

Bảy job tuần tự: e1, s1, se1, ne1/ne2/ne3, n1. ne1/ne2 bị loại vì nhánh lưỡi thừa, ne3 sửa thành một lưỡi; giữ đủ RAW/prompt/lịch sử. Không hướng nào vượt ba lượt.

130khung sau cắt: A tối đa1,8249px, 0chặn/0mép,32màu. Cán tối đa40,799px / thân tham chiếu47px≈0,868lần. Cận đường chéo bao toàn vũ khí, kể cả gốc marker và pose không dùng:61,287px /47≈1,304lần; cán dưới khoảng1,4lần thân.

[Báo cáo canonical](final/report.json) · [Báo cáo cutter](import/_report.json) · [Nguồn/hash](source.json) · [Ảnh kiểm](index.html).

## Cảnh báo và giới hạn

Mỗi giới còn năm `chan-lech` và một `co-phu-the` mức nhẹ; cutter không có cảnh báo/chặn, có năm ghi chú mỗi giới vì hurt dùng tay bước0 lân cận khi bước1 bị che. Đây là giới hạn đã ghi, không kế thừa chấp nhận mỹ thuật của bộ khác.

## Tự xem GameScene trước PR

48ảnh native1600×900:40GameScene nam/nữ ×s/se/e/ne/n ×attack0/100/190/260ms;8ảnh trang thử idle/walk/attack/cast190ms kèm Bạch Hổ chưa có vũ khí đối chiếu. Đã tự xem năm hướng và cả hai giới, đặc biệt n/attack1,2 bám đúng tay bước thân (`fallback:false`); xem thêm trang thử nữ attack. Hai phiên không có pageerror.

Chrome luôn `--mute-audio`, audio master0/muted=true trước tải trang, ảnh không cắt/resize/ghép. Server RAM GAME_TEST=1; tạo nhân vật/thức tỉnh/xếp đội/chọn ra trận qua UI, cấp võ hồn qua hook test có sẵn. Dừng GameScene, gọi animatePlayer thật và đặt khung thân tại mốc; đây là kiểm renderer, không phải toàn bộ trận giao chiến. Khung debug/hướng dẫn còn trong ảnh.
