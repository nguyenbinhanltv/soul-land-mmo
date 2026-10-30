# Nguyệt Nhận — song liềm nhóm cứng, đợt1

Issue #1363, epic #1020, mẫu PR #1320. Chưa duyệt mỹ thuật.

## Nguồn và ghép đôi

Codex / OpenAI `image_gen` tích hợp; model/seed `unknown` (không được trả về).
Đầu ra theo điều khoản OpenAI, không gán CC0. Không dùng ảnh ngoài.
Mỗi hướng một atlas tám pose của **một lưỡi**; lưỡi song sinh dùng cùng ảnh, lật ngang quanh grip riêng của tay B.
Thép xám tím, mép bạc, mặt trong răng cưa đỏ thẫm, hai đầu trăng nhọn, phù văn nguyệt. Không nướng mảnh trăng bay, vệt sáng hay hiệu ứng vào ảnh.
Marker xanh nằm giữa thanh nắm ngắn trong lõm trăng. Hai tay giữ hai vật riêng, không nối chúng bằng một cán.
RAW nguyên byte và prompt tại `<hướng>/attemptN/`; `sources.json` chọn RAW, `source.json` ghi hash và số đo.

## Công thức tái tạo

```sh
node art/src/phuthe-anim/nguyet_nhan/vukhi/compose.mjs --sources art/src/phuthe-anim/nguyet_nhan/vukhi/sources.json --out <temp>/nguyet
node tools/assets/phuthe-import.mjs --id nguyet_nhan --kind vukhi --dir <temp>/nguyet/import
node tools/assets/credits.mjs
```

- Khung128, cap0,18; một tỷ lệ raster mỗi atlas, cap chung giữa các hướng. Đo điểm nắm nam/nữ trực tiếp, không sửa LPC, không kéo méo lưỡi hoặc đổi cỡ từng pose.
- s dùng lượt2 để có mặt cạnh hẹp rõ. n dùng lượt2 sửa riêng pose6 nghiêng; cap0,13/0,15 còn làm phép dò tách lưỡi khỏi nộm ở nữ/n attack2, cap chung0,18 phải qua cả hai giới. Giữ RAW và prompt các lượt trước, không sửa ngưỡng checker.
- idle0/0, walk1/1/1/1, attack2/3/6/7, cast6/7, hurt0. Mỗi lưỡi ghép vào một tay; khoảng dời grip trên ảnh bằng0. Kiểm lề cho cả bản gốc và bản lật.
- Với hai tay đo được, trước cắt đo mặt nạ từng lưỡi riêng, cả A/B≤2px; sau cắt đo tới điểm ảnh sheet ghép cuối, cả A/B≤2px. Trường cũ `secondaryShaftDistance` dùng khoảng cách tới lưỡi B, không tới cán A; `secondaryGripRasterDistance` là phép đo B rõ nghĩa.
- **Giới hạn tay bị che:** một số khung LPC chỉ trả một điểm tay, ví dụ nữ/e idle và hurt. Chỉ vẽ một lưỡi tại tay đo được, không tự đoán hoặc tạo thêm tay B. `requestedHands`/`visibleHands`, mảng `hands`/`near` ghi đúng số điểm; B không đo được có `secondaryGripRasterDistance: null`, không khẳng định đã đo B. Cần chủ repo duyệt cách xử lý này.
- ne/n nằm sau thân, chỉ vùng nắm quanh từng tay riêng đưa ra trước. Không dùng một hộp lớn phủ cả khoảng giữa hai tay.
- Công thức art tái dùng compiler/cutter của mẫu trong thư mục tạm; import checker chuẩn trực tiếp, không tạo hay vá bản sao. Sau khi merge main có PR #1367, tái tạo đủ năm hướng/cutter và kiểm bổ sung bằng checker chuẩn không truyền `poseFrames`, lưu `canonical-report.json`.

**Dùng một tay A ở khung dọc theo quy trình mẫu là điểm lệch so với bảng #19 ban đầu; chủ repo đã xác nhận áp dụng cho rollout qua điều phối soul_land_game-815, checker chuẩn triển khai ở PR #1367.** Checker chung có thể miễn B ở attack/cast dọc của bộ này, nhưng recipe/cutter vẫn kiểm độc lập `near.some(v => v > 2)` để chặn từng lưỡi lệch tay. Bộ này vẫn neo cả hai lưỡi khi đo được hai tay; ngoại lệ không bỏ phép kiểm riêng B đang nhìn thấy. Giới hạn 16 khung chỉ đo được một tay vẫn cần duyệt mỹ thuật.

## Kiểm ảnh game

Số đo cuối trong `source.json`, `final/report.json`, `import/_report.json`; cảnh báo cần duyệt riêng, không kế thừa mẫu khác.
130khung: A/B từng lưỡi trước cắt≤1,59px; sau cắt≤0,90px,0mép/0chặn. Cutter có10cảnh báo mỗi giới (nam3che nộm+7cỡ, nữ4che nộm+6cỡ) và13/19ghi chú. Checker chuẩn không sửa đều mức nhẹ, không có chặn.
114khung đo được hai tay,16khung chỉ một tay (10hurt và6idle nữ ở se/e/ne). Đường chéo bao toàn vũ khí gồm grip tối đa54,06px / thân47px =1,15lần, dưới1,4; đây là chặn trên bảo thủ cho chiều dài grip, không gọi54,06px là độ dài cán. Trường `shaftLength` kế thừa compiler đầu búa không dùng làm phép đo cán liềm có grip giữa.
Ảnh native1600×900: nam/nữ ×5hướng ×attack0/100/190/260ms và trang thử idle/walk/attack/cast.
Chrome `--mute-audio`, master0/muted=true trước tải trang; không cắt/resize/ghép ảnh.
GameScene RAM GAME_TEST=1, tạo nhân vật/thức tỉnh qua UI, dừng scene và gọi `animatePlayer` với khung thân thật ở mốc; kiểm renderer, không phải toàn bộ trận giao chiến.
Giấy phép thân LPC giữ theo nguồn hiện có; sheet vũ khí chỉ chứa ảnh sinh, không chứa pixel thân.
