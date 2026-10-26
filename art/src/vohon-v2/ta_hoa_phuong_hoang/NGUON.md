# Tà Hỏa Phượng Hoàng — RAW chân dung / thẻ / icon (#1024)

Mọi ảnh dưới đây là RAW gốc, giữ nguyên byte từ builtin `image_gen.imagegen`, chưa crop, resize, palette-reduce, nhập game hoặc được chủ repo duyệt. STYLE + NEGATIVE trong từng prompt lấy nguyên văn `docs/art/vo-hon-phong-cach.md` mục 6; không dùng ảnh cũ làm ảnh dẫn.

## Chân dung

- `portrait-attempt1.png`: 1254×1254, 2,538,219 byte, SHA256 `a10d6b7aa8bbea168e81289603e68ad6cbe61bba5fff9d37db184eae9349d180`; prompt `portrait-attempt1.prompt.txt`, prompt SHA256 `b51df97176a5f6d3a5d38802aa5b3b7b2dc4d4c64f9f20b776abd08e55135eba`. **FAIL**: còn texture/chi tiết li ti, không đạt hard pixel edges ở cỡ chân dung 64×64.
- `portrait-attempt2.png`: 1254×1254, 2,358,606 byte, SHA256 `dd0fdb1cfeb6042cc1a2ed6f0a6c7a254005120e1eaab3fb575ca917ec7ad85f`; prompt `portrait-attempt2.prompt.txt`, prompt SHA256 `388098da53684f73bc5ec42c768dfdc97e192234e82c4ba3179fb5a30076d89d`. **FAIL**: texture mềm/chi tiết nhỏ vẫn còn sau một lượt chỉnh prompt. Dừng ở lượt 2/3.
- Không tạo icon từ các chân dung FAIL. Thẻ dùng khung chung hiện có `card_ssr`/`card_ur`; ảnh chân dung chưa đạt nên chưa có preview thẻ dùng asset mới.

## Tham chiếu

Không đính kèm ảnh nguồn hoặc ảnh phụ thể / pháp tướng cũ. Chỉ dùng mô tả đã duyệt trong `docs/art/vo-hon-phong-cach.md` mục 4.4 và khối STYLE + NEGATIVE mục 6.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/ta_hoa_phuong_hoang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Hai RAW chân dung Tà Hỏa Phượng Hoàng, lần lượt 1254×1254; model/seed unknown. Prompt, SHA, output path và lỗi trong NGUON.md + `*.prompt.txt` + `*.source.json`. Không import / chưa được duyệt. | 2026-10-27 | Chỉ ghi nguồn, không sửa `art/CREDITS.md`. |
