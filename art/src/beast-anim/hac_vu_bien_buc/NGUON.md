# Hắc Vụ Biên Bức — RAW hoạt ảnh (#772)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species hac_vu_bien_buc`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `hac_vu_bien_buc` (Hắc Vụ Biên Bức), họ `bird`, khung game 96×96. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1659**, 1709325 byte, SHA256 `a1a2cf57d2b0c11bc9f5d94880b29a48b81060ece3dbe54427459aba4279d858`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `toA.prompt.txt` (SHA256 `4a9b461e1a73ba839fb5acc43d19fc39111cc13b884ad16e8618ba876b6d118c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1731511 byte, SHA256 `5fce4c2c768a96fe764ad3f65c3ac2dfac81a261a2dc4211a14929dfc63a12e3`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `cd9a97e4d10a318dfd2bd9376d10712243e685d1996af2c15e084766686a0ee5`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ne nhẹ, n chặn).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống / cỡ thân lệch — H4 (s) C5, H8 (se) C5, H8 (se) C6, H1–4 (s) — ô trống có hình (0.34% diện tích ô): hình tràn từ ô bên; ô trống có hình (4.78% diện tích ô): hình tràn từ ô bên; ô trống có hình (3.52% diện tích ô): hình tràn từ ô bên; cỡ thân idle 89% so với ảnh tĩnh (lệch 11%).
LỖI: toB — cỡ thân lệch — H1–4 (ne), H5–8 (n) — cỡ thân idle 118% so với ảnh tĩnh (lệch 18%); cỡ thân idle 130% so với ảnh tĩnh (lệch > 25%).
LỖI: toB — hướng — NE H1–H4; N H5–H8 — NE gần ngang; NE và N lộ mặt trong các khung đã quan sát (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/hac_vu_bien_buc/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Hắc Vụ Biên Bức: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Hắc Vụ Biên Bức (H4 đợt 6, Part of #772/#766): RAW `art/src/beast-anim/hac_vu_bien_buc/toA.png` (A3/3, 948×1659, sai tỉ lệ 2:3; cả ba lượt đều sai tỉ lệ) và `toB.png` (B1/1, 1254×1254 hợp lệ). tthoadev sinh ngày 2026-10-26 bằng builtin `image_gen.imagegen`; A chỉ tham chiếu ảnh tĩnh loài, B tham chiếu ảnh tĩnh rồi A3. Model ảnh/seed unknown; ảnh nguyên byte, không resize/cắt/hậu kỳ. A lỗi kích thước; B lỗi NE gần nhìn ngang và NE/N lộ mặt. Prompt, source, NGUON và lịch sử lượt trong `art/src/beast-anim/hac_vu_bien_buc/`; chưa art accepted hoặc nhập game. |
