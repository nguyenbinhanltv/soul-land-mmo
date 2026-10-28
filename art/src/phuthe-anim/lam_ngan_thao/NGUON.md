# Lam Ngân Thảo — phụ thể hoạt ảnh lô 4

Part of #1025. Sinh bằng builtin `image_gen.imagegen` (Codex, Q44), model/seed unknown, 2026-10-28. RAW nguyên byte, không resize/chỉnh màu. Prompt nguyên khối `text` từ `phuthe-sheet-prompt.mjs --stage direction --concept-ref`; không sửa hay thêm prompt tay. Mỗi RAW kèm prompt/source JSON chứa SHA256 ảnh, prompt, từng tham chiếu và toàn bộ mục kiểm.

Tham chiếu theo thứ tự: bảng tư thế `references/lam_ngan_thao-nom-toX.png`, rồi concept đã duyệt ở `art/src/vohon-v2/lam_ngan_thao/`. Đường dẫn và hash chính xác trong source JSON. Không dùng ảnh lỗi, ảnh phụ thể cũ hay ảnh thứ ba. Khung 96; màu khóa thân `#30D030`, vạch `#7A5CFF`, nền `#FF00FF`.

| Tờ / hướng | Lượt: chặn / nhẹ | Chọn |
|---|---|---|
| A / s | 1: 0 / 40 | toA.png (lượt 1) |
| B / se | 1: 0 / 19 | toB.png (lượt 1) |
| C / e | 1: 0 / 31 | toC.png (lượt 1) |
| D / ne | 1: 0 / 21 | toD.png (lượt 1) |
| E / n | 1: 1 / 0; 2: 1 / 0; 3: 0 / 20 | toE.png (lượt 3) |

Lượt loại lưu trong `candidates/`; tối đa ba lượt/tờ. Bài học chung ở `../lessons.md`, không viết theo từng võ hồn.

## Cắt, neo, xem trước, nhập

Công cụ `phuthe-sheet-cut.mjs` tạo đủ 110 khung; **0 block / 117 warn**, chủ yếu chạm mép/vượt khung. Đã chạy `phuthe-anchor.mjs --source anim`, `phuthe-sheet-preview.mjs`, rồi `phuthe-import.mjs` với anchor sinh tự động, không sửa tay manifest. Nhập cả năm hướng theo quyền chủ repo cho mọi hướng 0 chặn kỹ thuật; chủ repo chỉnh neo sau. Giữ ảnh tĩnh cũ làm dự phòng.

Preview nam/nữ đủ 5 clip và 8 hướng (ba hướng tây lật): `C:/Users/PC/.ao/data/artifacts/soul_land_game-713/lam_ngan_thao/preview/index.html`.

## Soát mắt / phần cần chỉnh

Thân chuẩn nhỏ/dời xuống, một số pose đi và đánh khác tỉ lệ; đầu dây bị xén mép trong ảnh ráp. Khối dây lớn quanh vai/lưng; neo tự động khác nhau giữa các hướng. B/C gần nhau, D có vài pose gần chính diện; E vẫn có pha quay ngang. Chỉ khai vấn đề hướng, không sinh riêng để sửa mặt. Chưa chứng nhận căn đẹp, chủ repo chỉnh neo sau.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| to*.png, candidates/to*-attempt*.png | - | builtin image_gen.imagegen (Codex) | Prompt phuthe-sheet-prompt --concept-ref; hồ sơ SHA256 đi kèm | 2026-10-28 | RAW, model/seed unknown |
| shared/assets/sprites/vohonanim/lam_ngan_thao_{b,f}.png | vhanim_lam_ngan_thao_b, vhanim_lam_ngan_thao_f | phuthe-sheet-cut, phuthe-anchor, phuthe-import | Cắt RAW A–E và neo tự động | 2026-10-28 | 5 hướng, 5 clip; chủ chỉnh neo sau |
| references/lam_ngan_thao-nom-to*.png | - | phuthe-sheet-dummy, LPC hiện có | Bảng tư thế có vạch; chỉ tham chiếu | 2026-10-28 | Nguồn LPC theo hồ sơ hiện có |
