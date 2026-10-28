# Nguồn phụ thể hoạt ảnh: Hỏa Long

Part of #1025 · lô 5 · worker soul_land_game-716.

- Công cụ: Codex builtin image_gen; model/seed: unknown (không công bố). Ngày: 2026-10-28.
- Prompt nguyên văn từ phuthe-sheet-prompt.mjs --stage direction --concept-ref; không addendum tay.
- Nhóm C, khung 96; màu khóa thân #00D0D0, vạch #7A5CFF, nền #FF00FF.
- RAW giữ nguyên byte. Hồ sơ *.source.json chứa SHA256 ảnh, prompt, tham chiếu theo thứ tự và kết quả kiểm từng lượt.
- Lượt hỏng giữ trong candidates/. Tối đa 3 lượt/tờ; lượt tốt nhất còn chặn giữ ở gốc để đối chiếu, không nhập hướng đó.

## Kết quả

| Tờ / hướng | Đã dùng / chọn lượt | Chặn | Nhẹ | Nhập |
|---|---|---:|---:|---|
| A / s | 1 / 1 | 0 | 42 | Được phép theo 0 chặn kỹ thuật |
| B / se | 1 / 1 | 0 | 41 | Được phép theo 0 chặn kỹ thuật |
| C / e | 2 / 2 | 0 | 48 | Được phép theo 0 chặn kỹ thuật |
| D / ne | 1 / 1 | 0 | 53 | Được phép theo 0 chặn kỹ thuật |
| E / n | 1 / 1 | 0 | 52 | Được phép theo 0 chặn kỹ thuật |

Hướng đủ điều kiện: s, se, e, ne, n. Đã cắt 110 khung và nhập bằng phuthe-import.mjs, giữ ảnh tĩnh cũ làm dự phòng.

## Soát mắt và neo

Khối rồng lửa lớn, nhiều chi tiết vượt khung bị xén. Góc ne gần ngang và còn thấy đầu/mặt rồng; n/cast có pose gần chính diện. Thân chuẩn nhỏ hoặc dời ở vài khung. Không chứng nhận căn đẹp.

Chủ repo cho phép nhập mọi hướng có 0 chặn kỹ thuật; neo/tỉ lệ do worker khác chỉnh sau. Không chỉnh công cụ hoặc code game trong lô này.

Preview: C:/Users/PC/.ao/data/artifacts/soul_land_game-716/hoa_long/preview/index.html

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|
| toA.png–toE.png; candidates/ | hoa_long | Codex image_gen | Phụ thể 5 hướng; xem toX.prompt.txt và toX.source.json | 2026-10-28 | Theo điều khoản công cụ; concept gốc đã duyệt, không dùng ảnh thương mại |
