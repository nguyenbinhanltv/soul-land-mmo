# Hắc Thủy Mãng — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species hac_thuy_mang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `hac_thuy_mang` (Hắc Thủy Mãng), họ `snake`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 1823600 byte, SHA256 `3ea403f8c1cb0e6875ef3eefdeccbf5dcc39b775429778196d4622c1839d6376`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-616; chọn toA lượt 1/1, toB lượt 1/1.
- Prompt: `toA.prompt.txt` (SHA256 `577924715ea2058ffb4ce8a428947aa16ffa5f86ec03c047665047f36c318aee`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 86% so với ảnh tĩnh (lệch 14%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (se): cỡ thân idle 89% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 118% so với ảnh tĩnh (lệch 18%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1892816 byte, SHA256 `63e8af09f673be76780bc74a484367df1b70171f4c15efa4e2b97fbf2c0b2be3`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-616; chọn toA lượt 1/1, toB lượt 1/1.
- Prompt: `toB.prompt.txt` (SHA256 `a4bc3600eca70ef03e3871013c9de33f6e0913b10e6162414e36b8f2eafd066d`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 113% so với ảnh tĩnh (lệch 13%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống — H8 (se) C5, H12 (e) C5 — ô trống có hình (1.08% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.03% diện tích ô): hình tràn từ ô bên.
LỖI: toA — hướng — s H2–H4 — walk và attack nghiêng phải, die nằm ngang; se gần e (mắt)
LỖI: toA — pose — H1 H5 H9 C5–6 — hurt xoay đầu (mắt)
LỖI: toB — hướng — ne H1–H4, n H7–H8 — lộ mặt; die nằm ngang; hurt nghiêng đầu (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/hac_thuy_mang/` | - | image_gen.imagegen | RAW hoạt ảnh Hắc Thủy Mãng: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
