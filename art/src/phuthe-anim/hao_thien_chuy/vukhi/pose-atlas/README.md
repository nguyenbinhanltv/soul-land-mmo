# Hạo Thiên Chùy — atlas năm hướng, đã nhập để duyệt

Part of #1312, epic #1020, PR #1320. Bộ cắt ở `vukhi/` cha (`vkanim_hao_thien_chuy_b.png`, `_f.png`, manifest và báo cáo). Đã nhập cả hai nửa bằng importer #1323 vào `shared/assets/sprites/vukhianim/hao_thien_chuy_b.png` và `_f.png`; ne/n có lớp sau nên cần cả cặp. [Ảnh trong game](../ingame/index.html), [atlas / GIF](index.html), [hash ảnh và truy vấn](../ingame/capture.source.json).

## Hình và điểm cầm

Bỏ vác vai vì tay LPC thấp. Idle/walk/hurt một tay thuận; nghỉ/đi giữ đầu chùy cao hơn hông, cán chéo. Attack/cast hai tay, không sửa pose LPC. Các khung attack vẫn có cán ngang/chéo theo hai điểm tay; **chưa tự coi là đạt cán dọc**, trình chủ repo xem chuỗi ảnh nện.

Phương pháp theo s837 (`ao/lam-ngan-thao/1312-vu-khi`, SHA `a69b175b7790d9b8563a797543f95982ca701c86`): vẽ vũ khí riêng tám pose, đăng ký gốc rồi ghép theo grip từng giới. Không uốn chùy, vẽ lại thân hoặc sửa RAW. Bộ cán dài mới chọn bốn ảnh attack thực 2/3/4/5 và cast 2/6. N lượt3 thiếu marker ở pose7 không dùng: bỏ tường minh bằng omitUnused[7], không đoán gốc; mọi pose đang dùng phải có marker.

Sửa cỡ e: bộ `clip-hands/cut/` cũ từng báo 66%; bộ này không dùng ảnh đó. Ảnh trong game còn phát hiện chuẩn hóa riêng bề ngang làm e phóng quá. Bản cuối đo cả bề ngang lẫn chiều dọc đầu búa theo trục cán, lấy kích thước lớn hơn, chuẩn hóa nguyên hình về 200 đơn vị nguồn rồi dùng chung tỷ lệ `0.11294905654000065`: kích thước chuẩn đầu búa **22,59 điểm game**, e/s = 1 trước raster (có làm tròn điểm ảnh). Chi tiết tại `../ingame/scale-review.json`.

Cutter chạy riêng hai giới, chỉ lấy đúng năm hàng đo trực tiếp của mỗi giới. ne/n mặc định lớp sau, vùng cầm trước thân. Tay slash e/ne và hai tay cast giơ lên được nhận từ mảng da thật, không dùng fallback thấp. Gốc xanh đăng ký nút cán; điểm nắm A có thể nằm dọc cán, cố định cho mỗi clip/pose và hai giới để vừa khung. Cả hai tay phải trên đoạn cán, không chỉ gần pixel đầu búa. Client chọn theo bước thân khi vũ khí cùng số khung; sửa lệch ở 260 ms (thân bước3 nhưng chia đều thời gian chọn vũ khí bước2). Các clip khác số khung giữ quy tắc cũ.

## Nguồn và số lượt

s3, se2, e2, ne3, n3 = **13 job atlas tuần tự**, mỗi hướng không quá3lượt. Đợt nhập dùng thêm năm job cán dài sau khi ảnh cast lộ lỗi lơ lửng. s lượt1 thiếu marker; ne lượt1 marker tách mảnh; n lượt1 cán ngắn. RAW nguyên byte, prompt thực dùng/hash/tham chiếu ở từng `attempt*/poses.source.json`. Nguồn OpenAI output terms, không gán CC0; model/seed không được trả về nên ghi unknown. Ghi công trong art/CREDITS.md đã mô tả đúng atlas không nộm.

## Kiểm

- Checker: **0 chặn / 2 nhẹ mỗi giới**. s/e/n 0/0; se/ne mỗi hướng 0/1. Chi tiết bounding box so với s ở báo cáo checker; đây không phải cỡ riêng đầu búa.
- Cutter: **0 chặn / 0 nhẹ / 7 thông tin mỗi giới** (fallback còn lại ghi đầy đủ).
- Sheet cuối130khung, mép0, A tối đa1,738px / B1,456px, ngưỡng2px khung128.
- Ảnh native Phaser `?thu=vukhi`:8ảnh chính bao phủ5hướng×4clip×2giới; thêm6ảnh cùng attack260ms thành bốn bước0/100/190/260ms mỗi giới. Không cắt, resize hoặc ghép ảnh chụp. Nhãn “ảnh thật · LPC … sẵn sàng” hiện trên ảnh.
- Duyệt mỹ thuật của chủ repo còn mở; không tự merge PR.

## Tái tạo

```sh
node tools/assets/phuthe-hammer-atlas-finalize.mjs --sources art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-atlas/sources.json --out art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-atlas/result
node tools/assets/phuthe-hammer-atlas-cut.mjs --dir art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-atlas/result --out art/src/phuthe-anim/hao_thien_chuy/vukhi
node tools/assets/phuthe-import.mjs --kind vukhi --id hao_thien_chuy --dir art/src/phuthe-anim/hao_thien_chuy/vukhi
node tools/assets/credits.mjs
```

Hồi quy kiểm RAW bất biến/thiếu marker, cỡ hai chiều cả năm hướng, grip/mép130khung cuối và chọn bước attack tại ranh giới thời gian. Hash công cụ/bộ cắt/ảnh nhập ở source.json; code client và ảnh chụp trong capture.source.json.
