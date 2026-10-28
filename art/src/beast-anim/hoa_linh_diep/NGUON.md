# Hỏa Linh Điệp — RAW hoạt ảnh (#861)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species hoa_linh_diep`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `hoa_linh_diep` (Hỏa Linh Điệp), họ `fly`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 1817770 byte, SHA256 `3b60db782152ddf21b8cf5ddc6118036076d3621d717815cbcb7a4bc4766b7b3`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `a2371cb98842814097950d78d73a90967b60e8d8324c2104c6a870ee3ac5f421`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 75% so với ảnh tĩnh (lệch 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1823213 byte, SHA256 `bdc53cf7d257d771e3a9045dd506c711165b9f949ef8357e7e5045d5e42a4dab`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `4ea40f06dea0e9d5c26bbcfbc62ed4fab0b88651d52e14a16f9a11223b383d34`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — chân lệch / hình ở ô trống — H1 (s) C2, H8 (se) C5, H8 (se) C6, H11 (e) C3 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%); ô trống có hình (1.68% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.2% diện tích ô): hình tràn từ ô bên; chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 21%).
LỖI: toA — e H9-H12 còn chếch gần se; s die H4 C3-C4 đổi tư thế gập cánh chưa giữ rõ trục; hurt biên độ nhỏ (mắt)
LỖI: toB — ne H3-H4 attack/die lộ mặt, hướng gần e; n H8 C3-C4 die chưa thể hiện rõ lưng, gần s; hurt biên độ nhỏ (mắt)
LỖI: toB — Lô 3: ne chưa nhập; turnaround hết 2 lượt vẫn lộ mắt ở ne/die và n. Xem candidates/turnaround-attempt1.png và turnaround-attempt2.png; không dùng làm tham chiếu. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/hoa_linh_diep/` | - | image_gen.imagegen | RAW hoạt ảnh Hỏa Linh Điệp: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
