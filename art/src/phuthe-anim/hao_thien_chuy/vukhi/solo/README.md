# Hạo Thiên Chùy — kết quả thử ảnh riêng hướng s

Part of #1319 / #1312 / epic #1020, PR #1320 giữ nháp. Đã tiếp tục theo hướng orchestrator, không chờ quyết định thêm; **đã dùng đủ 3/3 job** sinh ảnh riêng, mỗi lần một job. Không sinh lượt 4, không bàn giao mẫu chưa đạt.

## Ba lượt sinh

| Lượt | RAW | Nội dung |
|---|---|---|
| 1 | weapon-s-attempt1.png | Một chùy riêng, cán dài thẳng, không nộm |
| 2 | weapon-s-attempt2.png | Ba pose nâng / nện / thu, giữ thiết kế từ ảnh 1 |
| 3 | weapon-s-attempt3.png | Mặt búa chính diện, cán thu ngắn cho va chạm |

Codex / OpenAI image_gen tích hợp; model ID / seed không được công cụ trả về, ghi unknown. Điều khoản đầu ra OpenAI, không gán CC0. RAW giữ nguyên byte, prompt thực dùng ở file cùng tên. Không ảnh ngoài; lượt 2–3 chỉ dùng ảnh chùy riêng lượt 1 làm tham chiếu thiết kế. Đây là prompt thử ảnh đơn vì chế độ này chưa có trong phuthe-sheet-prompt; đề xuất bổ sung đã ghi trong lessons.md, chưa thay prompt hiện hành. Metadata cũ ở experiment.source.json, kết quả tiếp theo ở followup.source.json.

## Ghép theo điểm cầm

Công cụ pilot lấy hands từ gripPoints và bước thân từ bodyStepOf; ghi tọa độ danh nghĩa dạng anim.grip từ gốc chân. Raster nearest-neighbor, khóa magenta, giữ nguyên nộm và marker. Đây là hồ sơ thử, không phải manifest nhập game. Không sửa client hoặc shared/assets.

Cải tiến quan trọng: không fit hai điểm nguồn cố định bằng cách đổi cỡ theo khoảng tay. Giữ một hệ số phóng cố định cho mỗi ảnh nguồn, cho tay B trượt dọc đoạn cán đã đo; kiểm mẫu màu tại điểm B và chiều dài đoạn được phép cầm. Các góc nhìn pose có hệ số chuẩn hóa riêng theo cỡ ảnh nguồn, không lấy từ khoảng cách tay. Phần dưới ghi nhận mặt impact vẫn chưa đồng đều cỡ khi xem thực tế.

Công cụ này chỉ áp dụng đúng ba RAW thử 1536×1024, landmarks/vùng cắt đo sẵn trong mã; không phải pipeline tổng quát. Vùng atlas lượt 2 đo riêng để tránh lấy nhầm chuôi pose bên cạnh. Hurt có hướng riêng để cán không rơi dưới chân. RAW không bị sửa.

```sh
# Một ảnh, giữ cỡ + trượt tay B: đầu ra sliding/ (cũng ghi hai phương án cũ).
node tools/assets/phuthe-rigid-pilot.mjs --raw art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/weapon-s-attempt1.png --out <temp-1>
# Thêm pose lượt 2: đầu ra poses/, lưu bản đã kiểm tại poses-side/.
node tools/assets/phuthe-rigid-pilot.mjs --raw art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/weapon-s-attempt1.png --poses art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/weapon-s-attempt2.png --out <temp-2>
# Thêm mặt va chạm lượt 3: đầu ra poses/, lưu tại poses/.
node tools/assets/phuthe-rigid-pilot.mjs --raw art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/weapon-s-attempt1.png --poses art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/weapon-s-attempt2.png --impact art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/weapon-s-attempt3.png --out <temp-3>
npm run phuthe:check -- hao_thien_chuy --kind vukhi --dir art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/sliding --out <temp-check>
```

## Kết quả

| Tờ ghép bằng code, không phải RAW | Chặn / nhẹ | Nhận xét |
|---|---|---|
| two-hands (đợt đầu) | 0 / 10 | Fit landmark cố định làm biến cỡ hơn bốn lần, cắt khung |
| shoulder (đợt đầu) | 0 / 2 | Tay B cách vùng vũ khí 36 điểm, landmark lệch gần 50 điểm |
| sliding | 0 / 0 | Giữ cỡ 0,12, tay B trên cán, sai số số học dưới 0,000001 điểm, không cắt khung |
| poses-side | 0 / 0 | Pose lượt 2 đổi mặt búa thật, không lẫn chuôi pose bên cạnh |
| poses (thêm impact lượt 3) | 0 / 1 | Cảnh báo chân lệch ở attack/2 do mặt búa kéo thấp về trước; không đổi chân nộm |

Tất cả check exit 0. Nhưng **chưa đạt bằng mắt**: idle/walk vẫn cầm thấp, chưa vác vai; attack thay mặt búa nhưng chưa có chuyển động nâng → nện rõ; mặt impact lượt 3 làm đầu búa lớn đột ngột. Không gọi bản 0/0 là mẫu đạt đủ thiết kế. Chưa mở rộng bốn hướng, chưa chạy cutter hoặc tạo vkanim. Không tự đổi pose LPC hoặc tự duyệt ngoại lệ một tay idle/walk.

Đã ghi các bài học dưới nhóm thử @VUKHI-CUNG trong lessons.md: giữ cỡ/trượt tay, kiểm đoạn cán, pose góc nhìn khác thật, chuẩn hóa cỡ và vùng atlas. Đề xuất prompt ảnh đơn vẫn tách khỏi prompt nộm; nhóm thử chưa chèn tự động vì parser hiện chưa nhận nhóm con. CI test-unit c5e1c659 trước thử này đã SUCCESS; lỗi được báo trước thuộc SHA cũ 6f6e7d99.
