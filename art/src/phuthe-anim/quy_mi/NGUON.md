# Quỷ Mị — phụ thể hoạt ảnh lô 6

Part of #1025. Sinh bằng builtin `image_gen.imagegen` (Codex, Q44), model/seed unknown, 2026-10-28. RAW nguyên byte; prompt nguyên khối do `phuthe-sheet-prompt.mjs --stage direction --concept-ref` sinh; SHA256 ảnh, prompt, từng tham chiếu và báo cáo kiểm trong source JSON.

Tham chiếu: bảng tư thế đúng hướng, concept-attempt1 đã chốt, rồi tờ A không chặn cho B–E. Khung 96, màu/vạch theo bảng tự sinh. Không dùng lượt hỏng làm tham chiếu.

| Tờ | Lượt: chặn / nhẹ | Kết quả |
|---|---|---|
| A / s | 1: 0 / 43 | Nhập |
| B / se | 1: 0 / 43 | Nhập |
| C / e | 1: 1 / 1; 2: 1 / 1; 3: 1 / 0 | Không nhập: hình dính sau 3 lượt |
| D / ne | 1: 0 / 43 | Nhập |
| E / n | 1: 0 / 42 | Nhập |

Lượt C bị chặn lưu nguyên trong candidates/. Bản gốc C giữ lượt cuối để đối chiếu, không đưa vào cutter. Bài học chung gộp ở ../lessons.md.

Cắt --partial A/B/D/E: 88 khung, 0 block / 167 warn / 1 info. Neo tự động bằng phuthe-anchor --source anim; chủ repo/worker khác chỉnh neo sau. Importer ghi dirsOk; e/w dùng ảnh tĩnh cũ. Preview nam/nữ tại C:/Users/PC/.ao/data/artifacts/soul_land_game-720/quy_mi/preview/index.html.

LỖI: thân chuẩn nhỏ/dời xuống; hư ảnh cao, xén mép; se gần chính diện, e gần góc ba phần tư, ne/n vẫn lộ mặt và cast quay trước. Chỉ khai lỗi hướng; không sinh riêng để sửa mặt. Chưa chứng nhận căn đẹp khi ghép LPC.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `to{A,B,D,E}.png` | `vhanim_quy_mi_b`, `vhanim_quy_mi_f` | builtin image_gen.imagegen, model unknown | Prompt nguyên văn kèm từng RAW, concept tự tạo Q44 | 2026-10-28 | Nhập bốn hướng; hướng e dự phòng |

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
