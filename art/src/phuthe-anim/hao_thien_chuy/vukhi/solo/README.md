# Thử chùy riêng hướng nam — #1320

Theo điều phối của orchestrator: không bàn giao mẫu chưa đạt, giữ PR nháp; thử ảnh vũ khí riêng trước ở `s`, chỉ mở rộng bốn hướng sau khi đạt. Đợt thử này dùng **1/3 lượt** sinh ảnh, không sinh thêm để né lỗi tư thế vốn nằm ở nộm / điểm cầm.

## Nguồn và phương pháp

`weapon-s-attempt1.png` là RAW nguyên byte từ Codex / OpenAI `image_gen`, không tham chiếu ảnh ngoài. Prompt thực dùng ở `weapon-s-attempt1.prompt.txt`; model ID / seed không được công cụ trả về (`unknown`), điều khoản đầu ra OpenAI, không gán CC0. Màu / motif / hình từ dòng 19 bảng vũ khí và thiết kế Hạo Thiên Chùy; đây là ảnh thử hướng nam, chưa duyệt độ đúng góc nhìn ở kích thước game.

`two-hands/toA.png` và `shoulder/toA.png` là **tờ ghép bằng code**, không phải RAW model. Nền được khóa theo khoảng cách màu magenta; raster xoay / dịch / phóng bằng nearest-neighbor, giữ nguyên nộm và vạch LPC do công cụ dựng. Hai điểm đo trên cán RAW: A `[1260,860]`, B `[920,634]`; tâm đầu búa dùng để đo `[325,260]`. Các điểm này chỉ áp dụng ảnh thử này.

```sh
node tools/assets/phuthe-rigid-pilot.mjs --raw art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/weapon-s-attempt1.png --out art/src/phuthe-anim/hao_thien_chuy/vukhi/solo
npm run phuthe:check -- hao_thien_chuy --kind vukhi --dir art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/two-hands --out <temp-two>
npm run phuthe:check -- hao_thien_chuy --kind vukhi --dir art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/shoulder --out <temp-shoulder>
```

`placement.json` mỗi phương án ghi các điểm tay lấy từ `gripPoints`, bước thân theo `bodyStepOf`, tọa độ danh nghĩa dạng `anim.grip` từ gốc chân và phép biến đổi từng khung. Đây là hồ sơ thử, **không phải manifest nhập game**. Tọa độ grip danh nghĩa không có nghĩa mọi tay đã chạm ảnh sau ghép; xem `secondGripError` và kết quả check riêng.

## Kết quả

| Phương án | Chặn / nhẹ | Vấn đề bằng mắt / đo riêng |
|---|---|---|
| Fit hai landmark cố định vào hai tay | 0 / 10 | Sai số hai landmark 0; đầu búa ngang hông, không vác vai; hệ số phóng 0,043–0,180 theo khoảng cách tay, vượt khung và thay đổi cỡ |
| Giữ tay A, hướng cán lên vai, giữ cỡ | 0 / 2 | Tay B idle cách vật 36 điểm (check); landmark B lệch gần 50 điểm; attack vẫn giơ chùy chứ chưa nện |

Cả hai check exit 0 do nhóm cứng chỉ cảnh báo lỗi điểm cầm; **chưa đạt bằng mắt**. Hai phép ghép cho thấy ảnh riêng giải quyết model đổi nộm, chưa giải quyết pose LPC hai tay / vai. Không kết luận mọi cách ghép đều bất khả thi: cần thử điểm tay được phép trượt dọc cán và pose được duyệt, cùng vài ảnh attack khác góc thật. Chưa có tư thế idle đạt nên chưa dùng thêm lượt sinh attack hoặc bốn hướng.

Không chạy cutter / nhập `shared/assets`, không sinh `vkanim`. Bài học nhóm thử `@VUKHI-CUNG` và đề xuất chế độ prompt ảnh đơn nằm ở `art/src/phuthe-anim/lessons.md`; không tự thay prompt hiện hành hoặc chốt ngoại lệ thiết kế. CI `test-unit` của head trước `c5e1c659` đã xanh; thông báo lỗi cũ thuộc SHA `6f6e7d99`.
