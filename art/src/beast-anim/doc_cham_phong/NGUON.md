# Độc Châm Phong — RAW hoạt ảnh (#775)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species doc_cham_phong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `doc_cham_phong` (Độc Châm Phong), họ `insect`, khung game 64×64. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1659**, 1838198 byte, SHA256 `e51c299e40803ae3e3ddfe71f9fcca2a6bd437e0b2d1c807ed36e93728f57ebf`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `546e8248060e15db5eff2708fdc0b2421a048b60ff9e54f156cfa268dec1ca61`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1955118 byte, SHA256 `2041ef92afcd021026909d2e0f37705322407ec90df0f822fa1f9cfa42bb2607`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toB.prompt.txt` (SHA256 `90288eb6c8af28f499db485e7e2863eae2304f7cb859fedb961fd8f332672d92`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ne pass, n chặn).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống / chân lệch / cỡ thân lệch — H4 (s) C5, H4 (s) C6, H7 (se) C1–6, H8 (se) C5, H8 (se) C6, H9–12 (e) — ô trống có hình (2.17% diện tích ô): hình tràn từ ô bên; ô trống có hình (3.1% diện tích ô): hình tràn từ ô bên; chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%); ô trống có hình (11.54% diện tích ô): hình tràn từ ô bên; ô trống có hình (10.64% diện tích ô): hình tràn từ ô bên; cỡ thân idle 76% so với ảnh tĩnh (lệch 24%).
LỖI: toA — pose — s H4 C3–4 — DIE nằm ngang ảnh, không giữ trục hướng s (mắt)
LỖI: toB — chân lệch / cỡ thân lệch — H8 (n) C4, H5–8 (n) — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 20%); cỡ thân idle 138% so với ảnh tĩnh (lệch > 25%).
LỖI: toB — hướng — khối ne — nhiều frame lộ mắt/mặt, sai góc 3/4 sau (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/doc_cham_phong/` | - | builtin image_gen.imagegen | RAW Độc Châm Phong: A1 948×1659; B2 primary 1254×1254. Prompt, hash và nguồn của ảnh primary ở các mục trên | 2026-10-27 | B1 giữ nguyên trong `candidates/` cùng prompt/source; B1 trùng output #969 (Xích Lân Mãng), không phải ảnh primary. B2 tham chiếu static rồi A1 chỉ để nối thiết kế; A1 chưa owner-approved. Tổng A1/B1/B2 = 3 lượt; model/seed/thời điểm không được công cụ công bố. B2 còn lỗi `ne` lộ mặt; chưa art-accepted/imported. |
