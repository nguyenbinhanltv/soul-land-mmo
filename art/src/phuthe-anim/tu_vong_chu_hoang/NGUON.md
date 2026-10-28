# Tử Vong Chu Hoàng — phụ thể hoạt ảnh lô 4

Part of #1025. Sinh bằng builtin `image_gen.imagegen` (Codex, Q44), model/seed unknown, ngày 2026-10-28. RAW nguyên byte; không resize, không sửa màu. Prompt nguyên khối `text` do `phuthe-sheet-prompt.mjs --stage direction --concept-ref` sinh; không addendum tay. Mỗi RAW có prompt và source JSON kèm SHA256 ảnh, prompt, từng tham chiếu và kết quả kiểm.

Tham chiếu theo thứ tự: `references/tu_vong_chu_hoang-nom-toX.png`, rồi `../../vohon-v2/tu_vong_chu_hoang/concept-attempt1.png`. Không dùng ảnh lỗi, phụ thể cũ hay tờ thứ ba. Khung 128; màu khóa thân `#00D0D0`, vạch `#FF8C00`, nền `#FF00FF`.

| Tờ / hướng | Lượt | Kết quả | Được chọn |
|---|---|---|---|
| A / s | 1: 3 chặn / 1 nhẹ; 2: 0 chặn / 50 nhẹ | Lượt 1 thừa cụm do vạch còn sót | toA.png (lượt 2) |
| B / se | 1: 0 chặn / 23 nhẹ | Qua kỹ thuật | toB.png |
| C / e | 1: 0 chặn / 30 nhẹ | Qua kỹ thuật | toC.png |
| D / ne | 1: 0 chặn / 54 nhẹ | Qua kỹ thuật | toD.png |
| E / n | 1: 1 chặn / 0 nhẹ; 2: 0 chặn / 39 nhẹ | Lượt 1 attack dính | toE.png (lượt 2) |

Lượt loại ở `candidates/`, không dùng làm tham chiếu. Bài học chung gộp trong `../lessons.md`.

## Cắt, neo, nhập

Công cụ `phuthe-sheet-cut.mjs` tạo đủ 110 khung, 32 màu, **0 block / 157 warn**; cảnh báo chủ yếu chạm mép/vượt khung. Đã chạy `phuthe-anchor.mjs --source anim`, `phuthe-sheet-preview.mjs`, rồi `phuthe-import.mjs` với anchor do công cụ sinh. Không sửa tay manifest. Nhập cả năm hướng theo quyền chủ repo cho mọi hướng 0 chặn kỹ thuật; chủ repo chỉnh neo sau. Nhánh ảnh tĩnh cũ vẫn giữ làm dự phòng.

Preview nam/nữ đủ 5 clip và 8 hướng (ba hướng tây lật) ở `C:/Users/PC/.ao/data/artifacts/soul_land_game-713/tu_vong_chu_hoang/preview/index.html`.

## Soát mắt / phần cần chỉnh

Thân chuẩn bị thu nhỏ/dời xuống; khối nhện lớn phía trên lưng, còn nguyên thân/đầu nhện từ concept. B/C gần nhau. D/E vẫn lộ mặt và cast quay gần chính diện; D còn chấm màu vạch ở thân chuẩn. Một số chân/tơ bị xén mép. Chỉ khai lỗi hướng/mặt, không sinh lượt riêng để sửa mặt. Không chứng nhận căn đẹp; nhập theo quyết định 0 chặn kỹ thuật và chủ repo sẽ chỉnh neo.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| to*.png, candidates/to*-attempt*.png | - | builtin image_gen.imagegen (Codex) | Prompt phuthe-sheet-prompt --concept-ref; hồ sơ SHA256 đi kèm | 2026-10-28 | RAW, model/seed unknown |
| shared/assets/sprites/vohonanim/tu_vong_chu_hoang_{b,f}.png | vhanim_tu_vong_chu_hoang_b, vhanim_tu_vong_chu_hoang_f | phuthe-sheet-cut, phuthe-anchor, phuthe-import | Cắt RAW A–E và neo tự động | 2026-10-28 | 5 hướng, 5 clip; chủ chỉnh neo sau |
| references/tu_vong_chu_hoang-nom-to*.png | - | phuthe-sheet-dummy, LPC hiện có | Bảng tư thế có vạch; chỉ tham chiếu | 2026-10-28 | Nguồn LPC theo hồ sơ hiện có |
