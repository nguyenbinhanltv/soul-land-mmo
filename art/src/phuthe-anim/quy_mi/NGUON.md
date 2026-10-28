# Quỷ Mị — phụ thể hoạt ảnh lô 6

Part of #1025. Sinh bằng builtin `image_gen.imagegen` (Codex, Q44), model/seed unknown, 2026-10-28. RAW nguyên byte; prompt nguyên khối do `phuthe-sheet-prompt.mjs --stage direction --concept-ref` sinh; SHA256 ảnh, prompt, từng tham chiếu và báo cáo kiểm trong source JSON.

Tham chiếu: bảng tư thế đúng hướng, concept-attempt1 đã chốt, rồi tờ A không chặn cho B–E. Khung 96, màu/vạch theo bảng tự sinh. Không dùng lượt hỏng làm tham chiếu.

| Tờ | Lượt: chặn / nhẹ | Kết quả |
|---|---|---|
| A / s | 1: 0 / 43 | Nhập |
| B / se | 1: 0 / 43 | Nhập |
| C / e | cũ 1: 1 / 1; 2: 1 / 1; 3: 1 / 0; mới 4: 0 / 41 | Đã nhập bổ sung e/w |
| D / ne | 1: 0 / 43 | Nhập |
| E / n | 1: 0 / 42 | Nhập |

Ba lượt C cũ bị chặn giữ nguyên trong candidates/. C4 đạt, thay bản gốc để nhập. Bài học chung gộp ở ../lessons.md.

Bổ sung C4, cắt đủ A–E: 110 khung, 0 block / 197 warn / 0 info. Neo tự động bằng phuthe-anchor --source anim; chủ repo/worker khác chỉnh neo sau. Importer ghi đủ năm hướng, e/w chạy hoạt ảnh mới. Preview nam/nữ tại C:/Users/PC/.ao/data/artifacts/soul_land_game-720/quy_mi/preview/index.html.

LỖI: thân chuẩn nhỏ/dời xuống; hư ảnh cao, xén mép; se gần chính diện, e gần góc ba phần tư, ne/n vẫn lộ mặt và cast quay trước. Chỉ khai lỗi hướng; không sinh riêng để sửa mặt. Chưa chứng nhận căn đẹp khi ghép LPC.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `to{A,B,D,E}.png` | `vhanim_quy_mi_b`, `vhanim_quy_mi_f` | builtin image_gen.imagegen, model unknown | Prompt nguyên văn kèm từng RAW, concept tự tạo Q44 | 2026-10-28 | Đủ năm hướng, C bổ sung ở lượt 4 |

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

## Bổ sung phiên 738

C4 (lượt mới 1/3 được chủ repo cho phép): 0 chặn / 41 nhẹ, đã nhập e và w lật ngang. Prompt nguyên văn từ công cụ --concept-ref, bảng tư thế C rồi concept-attempt1. Dừng ngay khi 0 chặn. Neo tự tính, importer giữ mục manual hiện có; không sửa neo tay.

LỖI mắt C4: thân chuẩn nhỏ/dời xuống; hư ảnh lớn sau thân, góc nhìn gần ba phần tư và cast quay trước; có chi tiết bị xén. Chủ repo cho phép nhập mọi hướng 0 chặn kỹ thuật, chỉnh sau.
