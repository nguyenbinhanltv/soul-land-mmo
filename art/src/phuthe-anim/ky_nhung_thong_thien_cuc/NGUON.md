# Nguồn phụ thể hoạt ảnh: Kỳ Nhung Thông Thiên Cúc

Part of #1025 · lô 5 · worker soul_land_game-716.

- Công cụ: Codex builtin image_gen; model/seed: unknown (không công bố). Ngày: 2026-10-28.
- Prompt nguyên văn từ phuthe-sheet-prompt.mjs --stage direction --concept-ref; không addendum tay.
- Nhóm C, khung 128; màu khóa thân #00D0D0, vạch #7A5CFF, nền #FF00FF.
- RAW giữ nguyên byte. Hồ sơ *.source.json chứa SHA256 ảnh, prompt, tham chiếu theo thứ tự và kết quả kiểm từng lượt.
- Lượt hỏng giữ trong candidates/. Tối đa 3 lượt/tờ; lượt tốt nhất còn chặn giữ ở gốc để đối chiếu, không nhập hướng đó.

## Kết quả

| Tờ / hướng | Đã dùng / chọn lượt | Chặn | Nhẹ | Nhập |
|---|---|---:|---:|---|
| A / s | 1 / 1 | 0 | 46 | Được phép theo 0 chặn kỹ thuật |
| B / se | 3 / 3 | 0 | 46 | Được phép theo 0 chặn kỹ thuật |
| C / e | 2 / 2 | 0 | 47 | Được phép theo 0 chặn kỹ thuật |
| D / ne | 2 / 2 | 0 | 48 | Được phép theo 0 chặn kỹ thuật |
| E / n | 3 / 2 | 1 | 1 | Không — giữ ảnh cũ |

Hướng đủ điều kiện: s, se, e, ne. Công cụ hiện chưa hỗ trợ nhập riêng hướng; chưa nhập bộ này, giữ toàn bộ ảnh cũ cho tới khi có hỗ trợ fallback.

## Soát mắt và neo

Hoa lớn, một số cánh bị xén ở mép; thân chuẩn nhỏ và dời xuống ở vài pose. Góc se/e gần nhau; ne/n chưa thể hiện quay lưng rõ ở mọi pose. Không chứng nhận căn đẹp.

Chủ repo cho phép nhập mọi hướng có 0 chặn kỹ thuật; neo/tỉ lệ do worker khác chỉnh sau. Không chỉnh công cụ hoặc code game trong lô này.

Preview: C:/Users/PC/.ao/data/artifacts/soul_land_game-716/ky_nhung_thong_thien_cuc/preview/index.html

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| toA.png–toE.png; candidates/ | ky_nhung_thong_thien_cuc | Codex image_gen | Phụ thể 5 hướng; xem toX.prompt.txt và toX.source.json | 2026-10-28 | Theo điều khoản công cụ; concept gốc đã duyệt, không dùng ảnh thương mại |

<!-- phuthe-import:huong -->
### Hướng đã nhập (tự ghi bởi `phuthe-import.mjs`, `anim.dirsOk` trong manifest)

Nhập từng hướng: s, se, e, ne.

| Hướng | Trạng thái |
|---|---|
| s (tờ A) | đã nhập hoạt ảnh vẽ thật |
| se (tờ B) | đã nhập hoạt ảnh vẽ thật |
| e (tờ C) | đã nhập hoạt ảnh vẽ thật |
| ne (tờ D) | đã nhập hoạt ảnh vẽ thật |
| n (tờ E) | CHƯA nhập: client dùng phụ thể tĩnh cũ |
<!-- /phuthe-import:huong -->
