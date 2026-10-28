# Nguyệt Nhận — phụ thể hoạt ảnh lô 6

Part of #1025. Sinh bằng builtin image_gen.imagegen (Codex, Q44), model/seed unknown, 2026-10-28. RAW nguyên byte, không hậu kỳ. Prompt nguyên khối text từ phuthe-sheet-prompt.mjs --stage direction --concept-ref. Source JSON ghi SHA256 ảnh, prompt, từng tham chiếu và báo cáo kiểm.

Tham chiếu theo thứ tự: bảng tư thế đúng hướng, concept đã chốt, tùy lượt có thêm tờ A đã qua kiểm. Đường dẫn và hash chính xác trong source JSON. Lượt lỗi chỉ ở candidates/, không dùng làm tham chiếu. Khung 96; màu thân/vạch theo bảng công cụ, nền magenta.

| Tờ | Lượt: chặn / nhẹ | Kết quả |
|---|---|---|
| A | 1: 0 / 20 | Nhập |
| B | 1: 2 / 0; 2: 2 / 0; 3: 0 / 14 | Nhập |
| C | 1: 1 / 2; 2: 3 / 4; 3: 1 / 15 | Không nhập |
| D | 1: 0 / 14 | Nhập |
| E | 1: 0 / 15 | Nhập |

Cắt, neo tự động và preview bằng đúng phuthe-sheet-cut / phuthe-anchor --source anim / phuthe-sheet-preview; chỉ đưa hướng 0 chặn vào cutter. Báo cáo cutter: {"info":1,"warn":40,"block":0,"total":41,"byCode":{"nom-mat":4,"vuot-khung":15,"cham-mep":21,"thieu-huong":1}}. Nhập bằng phuthe-import với anchor tự sinh; chủ repo/worker khác chỉnh neo sau. Giữ ảnh tĩnh cũ để dự phòng.

Preview nam/nữ: C:/Users/PC/.ao/data/artifacts/soul_land_game-720/nguyet_nhan/preview/index.html.

LỖI: Thân chuẩn nhỏ/đổi dáng; cặp lưỡi lớn quanh đầu/lưng thay vì bám chắc hai tay; mảnh trang trí rời, có mép bị xén; các hướng se/e/ne gần nhau, cast quay trước. Chỉ khai lỗi hướng, không sinh riêng để sửa mặt. Chưa chứng nhận căn đẹp khi ghép LPC.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| to{A,B,C,D,E}.png | vhanim_nguyet_nhan_b, vhanim_nguyet_nhan_f | builtin image_gen.imagegen, model unknown | Prompt nguyên văn kèm RAW; concept tự tạo Q44 | 2026-10-28 | Nhập các hướng đạt; neo cần chỉnh sau |

<!-- phuthe-import:huong -->
### Hướng đã nhập (tự ghi bởi `phuthe-import.mjs`, `anim.dirsOk` trong manifest)

Nhập từng hướng: s, se, ne, n.

| Hướng | Trạng thái |
|---|---|
| s (tờ A) | đã nhập hoạt ảnh vẽ thật |
| se (tờ B) | đã nhập hoạt ảnh vẽ thật |
| e (tờ C) | CHƯA nhập: client dùng phụ thể tĩnh cũ |
| ne (tờ D) | đã nhập hoạt ảnh vẽ thật |
| n (tờ E) | đã nhập hoạt ảnh vẽ thật |
<!-- /phuthe-import:huong -->

Tờ C đã đủ ba lượt; giữ lượt 1 ở gốc để đối chiếu vì cùng một chặn nhưng ít cảnh báo hơn lượt 3. Không đưa C vào cutter/importer.
