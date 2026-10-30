# Cửu Tinh Thất Sát Kiếm — nhóm cứng, đợt1

Issue #1360, epic #1020, mẫu PR #1320. Chưa duyệt mỹ thuật.

## Nguồn

Codex / OpenAI `image_gen` tích hợp; model/seed `unknown` (không được trả về).
Đầu ra theo điều khoản OpenAI, không gán CC0. Không dùng ảnh ngoài; các hướng lấy atlas e làm tham chiếu thiết kế.
RAW nguyên byte và prompt ở `<hướng>/attemptN/`; `sources.json` chọn atlas dùng, `source.json` ghi hash và lịch sử.
Thép xanh đậm, mép bạc xanh, sống khuyết, chuôi dài và ngọc đỏ; bảy sao Bắc Đẩu khắc trên lưỡi. Kiếm khí/vòng trận là code, không nướng vào sheet.

## Chọn pose và tái tạo

- e lượt1 có5sao, lượt2 còn6sao ở pose dọc; e lượt3 có7sao ở pose2/4/6/7, nhưng pose0/1 có8sao nên không dùng chúng. se lượt1 sai số sao, dùng lượt2. Các RAW bị loại vẫn giữ để kiểm lịch sử.
- idle2/2, walk2/2/2/2, attack2/6/4/7 (nâng/nâng cao/chém/impact), cast2/6, hurt2. Các pose không dùng không được coi là đã duyệt.
- Đứng/đi dựng kiếm trên tay thay cho đeo chéo lưng ở bảng đề xuất; cần chủ repo duyệt mỹ thuật. Nếu pose4 nguồn chĩa lên, xoay nguyên hình180° quanh grip để chém xuống; không đổi tỷ lệ hoặc uốn hình.
- Riêng pose4 hướng n xoay nguyên hình thêm15° về phía thân; trục nguồn lệch−0,30° nên độ lệch dọc thực14,70°, vẫn≤15°. Điều này giúp phép dò không tách kiếm mảnh khỏi nộm ở attack khung2 của nữ; cả hai giới phải qua checker, A giữ nguyên.
- Khung128, cap raster0,20, cỡ lưỡi tham chiếu40px; một tỷ lệ trong mỗi atlas và cap chung giữa các hướng. Không phóng riêng impact, không sửa LPC.
- `compose.mjs` cấu hình công thức #1320 trong thư mục tạm; kiểm chuỗi cấu hình trước khi chạy. Không tạo hay vá bản sao checker: import trực tiếp checker chuẩn đã thêm danh sách được duyệt qua PR #1367. Ngưỡng A≤2px, dọc≤15°, B≤20px ngoài ngoại lệ giữ nguyên.

```sh
node art/src/phuthe-anim/cuu_tinh_that_sat_kiem/vukhi/compose.mjs --sources art/src/phuthe-anim/cuu_tinh_that_sat_kiem/vukhi/sources.json --out <temp>/cuu-tinh
node tools/assets/phuthe-import.mjs --id cuu_tinh_that_sat_kiem --kind vukhi --dir <temp>/cuu-tinh/import
node tools/assets/credits.mjs
```

**Dùng một tay A ở khung dọc là điểm lệch so với bảng #19 ban đầu; chủ repo đã xác nhận cho rollout qua điều phối soul_land_game-815, checker chuẩn triển khai ở PR #1367.** Cửu Tinh cũng vốn hai tay theo dòng1; B chỉ được bỏ yêu cầu chạm cán ở attack/cast dọc, vẫn đo và ghi độ lệch thật trong báo cáo. Sau khi đồng bộ main, đã bỏ checker tạm và tái tạo atlas/report bằng checker chuẩn.

## Kiểm

Số đo cuối, hash sheet và ảnh trong `source.json`, `final/report.json`, `import/_report.json`.
130khung: ghép A≤1,70px; sau cutter A≤0,95px,0mép,0chặn/0cảnh báo/7ghi chú mỗi giới. Cán tối đa16,84px / thân47px =0,36lần. B tới điểm ảnh có thể40,44px ở khung dọc; đây là ngoại lệ đã được xác nhận, không mô tả là hai tay cùng nắm.
Checker có cảnh báo chân khi kiếm hạ xuống; mọi cảnh báo mới cần chủ repo duyệt, không kế thừa mẫu khác.
Mặt sau ne/n ở sau thân, vùng nắm ra trước qua mặt nạ cutter; ghép riêng hai giới theo grip đo trực tiếp.
Ảnh native1600×900 trong `ingame/`: nam/nữ ×5hướng ×attack0/100/190/260ms và trang thử idle/walk/attack/cast.
Chrome `--mute-audio`, master0/muted=true trước tải trang. Không cắt/resize/ghép ảnh.
GameScene RAM GAME_TEST=1, tạo nhân vật/thức tỉnh qua UI, dừng scene rồi gọi `animatePlayer` và đặt khung thân thật ở mốc. Đây là kiểm renderer, không phải toàn bộ trận giao chiến.
Giấy phép thân LPC giữ theo nguồn hiện có; sheet vũ khí không chứa pixel thân.
