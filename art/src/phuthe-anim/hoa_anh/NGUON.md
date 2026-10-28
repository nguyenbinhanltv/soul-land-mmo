# Nguồn phụ thể hoạt ảnh: Hỏa Ảnh

Part of #1025 · lô 5 · worker soul_land_game-716.

- Công cụ: Codex builtin image_gen; model/seed: unknown (không công bố). Ngày: 2026-10-28.
- Prompt nguyên văn từ phuthe-sheet-prompt.mjs --stage direction --concept-ref; không addendum tay.
- Nhóm C, khung 96; màu khóa thân #00D0D0, vạch #7A5CFF, nền #FF00FF.
- RAW giữ nguyên byte. Hồ sơ *.source.json chứa SHA256 ảnh, prompt, tham chiếu theo thứ tự và kết quả kiểm từng lượt.
- Lượt hỏng giữ trong candidates/. Tối đa 3 lượt/tờ; lượt tốt nhất còn chặn giữ ở gốc để đối chiếu, không nhập hướng đó.

## Kết quả

| Tờ / hướng | Đã dùng / chọn lượt | Chặn | Nhẹ | Nhập |
|---|---|---:|---:|---|
| A / s | 1 / 1 | 0 | 50 | Được phép theo 0 chặn kỹ thuật |
| B / se | 1 / 1 | 0 | 52 | Được phép theo 0 chặn kỹ thuật |
| C / e | 4 / 4 (thêm 1/3 lượt) | 0 | 44 | Đã nhập bổ sung |
| D / ne | 3 / 3 | 0 | 50 | Được phép theo 0 chặn kỹ thuật |
| E / n | 5 / 5 (thêm 2/3 lượt) | 0 | 41 | Đã nhập bổ sung |

Đã bổ sung C/e (và w lật ngang), E/n, đủ 110 khung A–E. Cutter: 0 block, 204 warn. Neo tự tính bằng phuthe-anchor; importer giữ mục manual hiện có, không chỉnh tay sau nhập.

## Soát mắt và neo

Bóng/hư ảnh lớn phía sau thân, có pose tạo thành hình người riêng và che thân chuẩn. Góc se/e gần nhau; ne/n có pose gần chính diện. Một số chi tiết chạm mép, bị xén; không chứng nhận căn đẹp.

Chủ repo cho phép nhập mọi hướng có 0 chặn kỹ thuật; neo/tỉ lệ do worker khác chỉnh sau. Không chỉnh công cụ hoặc code game trong lô này.

Preview: C:/Users/PC/.ao/data/artifacts/soul_land_game-716/hoa_anh/preview/index.html

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| toA.png–toE.png; candidates/ | hoa_anh | Codex image_gen | Phụ thể 5 hướng; xem toX.prompt.txt và toX.source.json | 2026-10-28 | Theo điều khoản công cụ; concept gốc đã duyệt, không dùng ảnh thương mại |

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

Chủ repo cho thêm tối đa ba lượt mỗi tờ ngoài ba lượt cũ. C4: 0 chặn / 44 nhẹ, nhập. E4: 1 chặn / 0 nhẹ (hinh-dinh hàng attack chỉ 5/6 hình), lưu candidates/toE-attempt4.*. E5: 0 chặn / 41 nhẹ, nhập. Dừng sinh ngay khi đạt. Prompt nguyên văn --concept-ref, bảng tư thế C/E + concept-attempt2 theo thứ tự.

LỖI mắt: C vẫn gần ba phần tư, E lộ mặt/chính diện thay vì quay lưng; hư ảnh lớn và thân chuẩn nhỏ/dời xuống, vài pose bị xén. Chủ repo cho nhập mọi hướng 0 chặn kỹ thuật, chỉnh sau; không chỉnh neo tay. Bài học cú đấm dính đã gộp dòng chung trong lessons.md.
