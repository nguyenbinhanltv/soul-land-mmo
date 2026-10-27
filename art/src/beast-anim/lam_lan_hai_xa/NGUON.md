# Lam Lân Hải Xà — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species lam_lan_hai_xa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `lam_lan_hai_xa` (Lam Lân Hải Xà), họ `swim`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 2025914 byte, SHA256 `7f04c6390255c1aa23d213895b5619ac4e6d9f787ff82e86675ec3b744cb9a44`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-616; chọn toA lượt 1/1, toB lượt 1/1.
- Prompt: `toA.prompt.txt` (SHA256 `b0ff03b205f31e526c2816118f17e89829c3956273883bfa26969dc327fd47f2`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 85% so với ảnh tĩnh (lệch 15%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 121% so với ảnh tĩnh (lệch 21%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 2038539 byte, SHA256 `a67e397255e3d4d916f1808a82dee67b220e17fe7cc4ca669f642e02f2730c9c`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-616; chọn toA lượt 1/1, toB lượt 1/1.
- Prompt: `toB.prompt.txt` (SHA256 `527eb24d7b2eaaa85ddf94f8f960783f392bbe84c26061ba1836d86c12be9741`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 89% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hướng — s H1–H4 — nghiêng phải gần se và e; die cuộn ngang (mắt)
LỖI: toB — hướng — ne H1–H4, n H6 H8 — lộ mặt; die cuộn ngang, hurt biên độ nhỏ (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/lam_lan_hai_xa/` | - | image_gen.imagegen | RAW hoạt ảnh Lam Lân Hải Xà: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
