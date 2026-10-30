# Kỳ Nhung Thông Thiên Cúc — trượng nhóm cứng, đợt 2

Issue #1385, epic #1020; sau Phá Hồn Thương #1368 và Quỷ Mị #1381. Chủ repo đã duyệt mỹ thuật vũ khí; chỉ gộp sau AO review đạt và CI xanh. Worker không tự merge.

## Nguồn

Codex / OpenAI `image_gen` tích hợp; công cụ không trả mã model hoặc seed. Đầu ra theo điều khoản OpenAI, không gán CC0. Không dùng ảnh ngoài.
RAW nguyên byte và prompt ở `<hướng>/attemptN/`; `source.json` ghi hash, tham chiếu/lịch sử và ảnh được chọn; `sources.json` dùng để tái tạo từ gốc repo.

Trượng cán nâu cam theo `robe` #8a4a12, cúc nhiều lớp cánh dài nhọn với ánh #ffb347, khe đỏ sẫm, nhụy vàng kim khắc vòng đạo văn. Rễ xoắn gắn chuôi; mặt sau hoa là đài/cánh tối hơn. Cánh rời, hào quang và vệt quét để code, không bake vào atlas.

## Ghép và tái tạo

- Atlas riêng4×2 tám pose, không người/nộm, nền magenta; marker xanh gắn chuôi. Giữ nguyên LPC, ghép nguyên hình tới anim.grip.
- **Một tay theo bảng thiết kế, nằm ngoài danh sách miễn B.** Recipe dùng cấu hình một tay từ mẫu Tà Hỏa đã gộp, giữ nguyên checker/dummy/cutter canonical. Không thêm ngoại lệ hay nới ngưỡng. Mỗi khung một grip, A≤2px; không có B vì đây là vũ khí một tay, không phải miễn tay thứ hai.
- Khung128/cap0,10, tỷ lệ chung năm hướng; idle0, walk1, attack2/3/6/7, cast6/7, hurt0. Giữ trục pose, không kéo góc về cặp tay. Điểm nắm vào cán ít nhất3px; chọn tám marker xanh diện tích≥100px. RAW không sửa bằng code.
- Công cụ canonical #1375 đã gộp được dùng nguyên API; recipe có kiểm chuỗi cấu hình để báo mẫu đổi. Màu nộm cyan và vạch tím theo phutheInfo.

```sh
node art/src/phuthe-anim/ky_nhung_thong_thien_cuc/vukhi/compose.mjs --sources art/src/phuthe-anim/ky_nhung_thong_thien_cuc/vukhi/sources.json --out <temp>/cuc
node tools/assets/phuthe-import.mjs --id ky_nhung_thong_thien_cuc --kind vukhi --dir <temp>/cuc/import
node tools/assets/credits.mjs
```

Hash công cụ chuẩn hóa xuống dòng LF; RAW/sprite/ảnh chụp dùng byte nguyên bản. Đạt kỹ thuật không thay duyệt mỹ thuật.

## Kết quả sau canonical #1391

Tái tạo từ nguyên RAW năm hướng bằng canonical trên main sau #1391, không vá recipe/checker/whitelist.130khung,32màu; A sau cắt tối đa0,7072px,0chặn/0mép/0cảnh báo cutter.60khung attack/cast đều đo đúng bước, không fallback; đủ10ca cast/1 hai giới/năm hướng dùng bước2 thay bước1. Mỗi giới chỉ còn5ghi chú hurt lấy bước0 khi bước1 bị áo che.

Cán tối đa45,665px / thân tham chiếu47px≈0,972lần, dưới khoảng1,4lần thân. Cận bao cả đầu hoa/rễ/pose không dùng68,934px≈1,467lần thân; đây không phải chiều dài cán. Một tỷ lệ cố định0,10 cho năm hướng và mọi khung.

Checker giữ10cảnh báo nhẹ chan-lech mỗi giới (attack và cast), không có chặn. Đây là đo cận bao trượng đổi pose; giữ đầy đủ trong report.json/source.json, không kế thừa mức chấp nhận của bộ khác. Chủ repo đã duyệt mỹ thuật vũ khí theo bàn giao điều phối #1385; AO review và CI vẫn là cổng trước khi gộp.

[Báo cáo canonical](final/report.json) · [Báo cáo cutter](import/_report.json) · [Nguồn/hash](source.json) · [Atlas và sprite](index.html).

## Tự xem GameScene

48ảnh chụp lại sau #1391 được lưu ngoài Git trong artifact phiên859 (`ky-nhung-cast/index.html`), kèm hash/mốc/frame và gallery để review. Đã tự xem đủ10ảnh GameScene cast360ms hai giới/năm hướng: cán chạm tay giơ, hết neo thấp. Bộ cuối0pageerror; dùng cờ có sẵn `pfx=0` để tắt gói asset riêng vắng mặt (lượt chẩn đoán trước đó gặp `/private/present.json` trả HTML ở Vite). Chrome --mute-audio và audio master0/muted=true trước tải trang. Server RAM GAME_TEST=1 riêng, hai tài khoản nam/nữ; tạo ngoại hình/thức tỉnh bằng API hiện có, cấp Kỳ Nhung qua hook test grant, đội hình qua tin team.

Harness tạm chỉ lấy tham chiếu GameScene và giữ tuổi hoạt ảnh khi gọi animatePlayer thật; thân và vũ khí vẫn qua LpcRig/syncPhuLayers/spiritMotion thật. Kiểm cast0/100/360ms, attack190ms đủ năm hướng/cả hai giới; trang thử thêm idle/walk/attack/cast với Bạch Hổ đối chứng. Đây là kiểm renderer ở mốc cố định, không chứng nhận toàn bộ trận giao chiến hoặc mọi ngoại hình. Không đưa ảnh chụp thô vào repo; xem bằng chứng gắn tại PR.
