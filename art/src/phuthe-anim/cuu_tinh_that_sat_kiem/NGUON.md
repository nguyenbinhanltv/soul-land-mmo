# Cửu Tinh Thất Sát Kiếm — phụ thể hoạt ảnh lô 6

Part of #1025. Sinh bằng builtin image_gen.imagegen (Codex, Q44), model/seed unknown, 2026-10-28. RAW nguyên byte, không hậu kỳ. Prompt nguyên khối text từ phuthe-sheet-prompt.mjs --stage direction --concept-ref. Source JSON ghi SHA256 ảnh, prompt, từng tham chiếu và báo cáo kiểm.

Tham chiếu theo thứ tự: bảng tư thế đúng hướng, concept đã chốt, tùy lượt có thêm tờ A đã qua kiểm. Đường dẫn và hash chính xác trong source JSON. Lượt lỗi chỉ ở candidates/, không dùng làm tham chiếu. Khung 96; màu thân/vạch theo bảng công cụ, nền magenta.

| Tờ | Lượt: chặn / nhẹ | Kết quả |
|---|---|---|
| A | 1: 2 / 25; 2: 0 / 31 | Nhập |
| B | 1: 0 / 29 | Nhập |
| C | 1: 0 / 23 | Nhập |
| D | 1: 1 / 0; 2: 13 / 0; 3: 0 / 23 | Nhập |
| E | 1: 0 / 29 | Nhập |

Cắt, neo tự động và preview bằng đúng phuthe-sheet-cut / phuthe-anchor --source anim / phuthe-sheet-preview; chỉ đưa hướng 0 chặn vào cutter. Báo cáo cutter: {"info":0,"warn":109,"block":0,"total":109,"byCode":{"nom-mat":2,"vuot-khung":53,"cham-mep":54}}. Nhập bằng phuthe-import với anchor tự sinh; chủ repo/worker khác chỉnh neo sau. Giữ ảnh tĩnh cũ để dự phòng.

Preview nam/nữ: C:/Users/PC/.ao/data/artifacts/soul_land_game-720/cuu_tinh_that_sat_kiem/preview/index.html.

LỖI: Thân chuẩn nhỏ/dời xuống và khác dáng tham chiếu; kiếm có khung lơ lửng trên vai, chưa khớp tay cầm; đầu kiếm bị xén, góc se/e/ne gần nhau, bắc có pha quay ngang. Chỉ khai vấn đề hướng; chưa chứng nhận căn đẹp khi ghép LPC.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| to{A,B,C,D,E}.png | vhanim_cuu_tinh_that_sat_kiem_b, vhanim_cuu_tinh_that_sat_kiem_f | builtin image_gen.imagegen, model unknown | Prompt nguyên văn kèm RAW; concept tự tạo Q44 | 2026-10-28 | Nhập các hướng đạt; neo cần chỉnh sau |
