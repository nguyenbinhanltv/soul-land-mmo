# A Ngân — phụ thể hoạt ảnh lô 4

Part of #1025. Sinh bằng builtin `image_gen.imagegen` (Codex, Q44), model/seed unknown, 2026-10-28. RAW nguyên byte, không resize/chỉnh màu. Prompt nguyên khối `text` từ `phuthe-sheet-prompt.mjs --stage direction --concept-ref`; không sửa hay thêm prompt tay. Mỗi RAW kèm prompt/source JSON chứa SHA256 ảnh, prompt, từng tham chiếu và toàn bộ mục kiểm.

Tham chiếu theo thứ tự: bảng tư thế `references/a_ngan-nom-toX.png`, rồi concept đã duyệt ở `art/src/vohon-v2/a_ngan/`. Đường dẫn và hash chính xác trong source JSON. Không dùng ảnh lỗi, ảnh phụ thể cũ hay ảnh thứ ba. Khung 96; màu khóa thân `#30D030`, vạch `#7A5CFF`, nền `#FF00FF`.

| Tờ / hướng | Lượt: chặn / nhẹ | Chọn |
|---|---|---|
| A / s | 1: 1 / 0; 2: 4 / 35; 3: 0 / 43 | toA.png (lượt 3) |
| B / se | 1: 0 / 40 | toB.png (lượt 1) |
| C / e | 1: 0 / 34 | toC.png (lượt 1) |
| D / ne | 1: 0 / 23 | toD.png (lượt 1) |
| E / n | 1: 0 / 35 | toE.png (lượt 1) |

Lượt loại lưu trong `candidates/`; tối đa ba lượt/tờ. Bài học chung ở `../lessons.md`, không viết theo từng võ hồn.

## Cắt, neo, xem trước, nhập

Công cụ `phuthe-sheet-cut.mjs` tạo đủ 110 khung; **0 block / 145 warn**, chủ yếu chạm mép/vượt khung. Đã chạy `phuthe-anchor.mjs --source anim`, `phuthe-sheet-preview.mjs`, rồi `phuthe-import.mjs` với anchor sinh tự động, không sửa tay manifest. Nhập cả năm hướng theo quyền chủ repo cho mọi hướng 0 chặn kỹ thuật; chủ repo chỉnh neo sau. Giữ ảnh tĩnh cũ làm dự phòng.

Preview nam/nữ đủ 5 clip và 8 hướng (ba hướng tây lật): `C:/Users/PC/.ao/data/artifacts/soul_land_game-713/a_ngan/preview/index.html`.

## Soát mắt / phần cần chỉnh

Thân chuẩn bị thu nhỏ/dời xuống; khối hoa/cành lớn phía trên đầu và một số tua bị xén mép khi ráp. Một khung hurt của A không khớp đủ thân nên cutter dùng độ dời trung vị. B/C gần nhau, D/E có pha quay gần chính diện; chỉ khai hướng, không sinh riêng để sửa mặt. Hạt và giọt trang sức có thể thành mảnh rời; cutter đã bỏ mảnh vụn. Chủ repo chỉnh neo/tỉ lệ sau theo quyền nhập 0 chặn kỹ thuật.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| to*.png, candidates/to*-attempt*.png | - | builtin image_gen.imagegen (Codex) | Prompt phuthe-sheet-prompt --concept-ref; hồ sơ SHA256 đi kèm | 2026-10-28 | RAW, model/seed unknown |
| shared/assets/sprites/vohonanim/a_ngan_{b,f}.png | vhanim_a_ngan_b, vhanim_a_ngan_f | phuthe-sheet-cut, phuthe-anchor, phuthe-import | Cắt RAW A–E và neo tự động | 2026-10-28 | 5 hướng, 5 clip; chủ chỉnh neo sau |
| references/a_ngan-nom-to*.png | - | phuthe-sheet-dummy, LPC hiện có | Bảng tư thế có vạch; chỉ tham chiếu | 2026-10-28 | Nguồn LPC theo hồ sơ hiện có |
