# Nguyệt Nhận — phụ thể hoạt ảnh lô 6

Part of #1025. Sinh bằng builtin image_gen.imagegen (Codex, Q44), model/seed unknown, 2026-10-28. RAW nguyên byte, không hậu kỳ. Prompt nguyên khối text từ phuthe-sheet-prompt.mjs --stage direction --concept-ref. Source JSON ghi SHA256 ảnh, prompt, từng tham chiếu và báo cáo kiểm.

Tham chiếu theo thứ tự: bảng tư thế đúng hướng, concept đã chốt, tùy lượt có thêm tờ A đã qua kiểm. Đường dẫn và hash chính xác trong source JSON. Lượt lỗi chỉ ở candidates/, không dùng làm tham chiếu. Khung 96; màu thân/vạch theo bảng công cụ, nền magenta.

| Tờ | Lượt: chặn / nhẹ | Kết quả |
|---|---|---|
| A | 1: 0 / 20 | Nhập |
| B | 1: 2 / 0; 2: 2 / 0; 3: 0 / 14 | Nhập |
| C | cũ 1: 1 / 2; 2: 3 / 4; 3: 1 / 15; mới 4: 2 / 0; 5: 0 / 28 | Đã nhập bổ sung e/w |
| D | 1: 0 / 14 | Nhập |
| E | 1: 0 / 15 | Nhập |

Cắt, neo tự động và preview bằng đúng phuthe-sheet-cut / phuthe-anchor --source anim / phuthe-sheet-preview; chỉ đưa hướng 0 chặn vào cutter. Báo cáo cutter sau bổ sung: 65 khung, 0 block / 57 warn / 0 info, đủ năm hướng. Nhập bằng phuthe-import với anchor tự sinh; chủ repo/worker khác chỉnh neo sau. Giữ ảnh tĩnh cũ để dự phòng.

Preview nam/nữ: C:/Users/PC/.ao/data/artifacts/soul_land_game-720/nguyet_nhan/preview/index.html.

LỖI: Thân chuẩn nhỏ/đổi dáng; cặp lưỡi lớn quanh đầu/lưng thay vì bám chắc hai tay; mảnh trang trí rời, có mép bị xén; các hướng se/e/ne gần nhau, cast quay trước. Chỉ khai lỗi hướng, không sinh riêng để sửa mặt. Chưa chứng nhận căn đẹp khi ghép LPC.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| to{A,B,C,D,E}.png | vhanim_nguyet_nhan_b, vhanim_nguyet_nhan_f | builtin image_gen.imagegen, model unknown | Prompt nguyên văn kèm RAW; concept tự tạo Q44 | 2026-10-28 | Nhập các hướng đạt; neo cần chỉnh sau |

<!-- phuthe-import:huong -->
### Hướng đã nhập (tự ghi bởi `phuthe-import.mjs`, `anim.dirsOk` trong manifest)

Đủ 5 hướng.

| Hướng | Trạng thái |
|---|---|
| s (tờ A) | đã nhập hoạt ảnh vẽ thật |
| se (tờ B) | đã nhập hoạt ảnh vẽ thật |
| e (tờ C) | đã nhập hoạt ảnh vẽ thật |
| ne (tờ D) | đã nhập hoạt ảnh vẽ thật |
| n (tờ E) | đã nhập hoạt ảnh vẽ thật |
<!-- /phuthe-import:huong -->

Ba lượt C cũ giữ trong candidates/. C5 đạt và đã đưa vào cutter/importer.

## Bổ sung phiên 738

Chủ repo cho thêm tối đa ba lượt ngoài ba lượt cũ. C4 (mới 1/3): 2 chặn / 0 nhẹ, so-hinh hàng walk và attack thừa mảnh rời (5 hình thay vì 4); lưu candidates/toC-attempt4.*. Gộp bài học mảnh trang trí vào dòng chung lessons.md. C5 (mới 2/3): 0 chặn / 28 nhẹ, nhập e/w và dừng sinh. Prompt nguyên văn --concept-ref; bảng C rồi concept-attempt1.

LỖI mắt C5: lưỡi lớn quanh đầu/lưng thay vì bám tay, một số mảnh vẫn rời; thân chuẩn biến dạng và nhỏ, attack/cast có xén mép; góc e chưa thuần ngang. Chủ repo cho nhập mọi hướng 0 chặn kỹ thuật, chỉnh sau. Neo tự tính bằng công cụ, importer giữ mục manual hiện có; không chỉnh tay sau nhập.
