# Lôi Vân Hải Ưng — RAW hoạt ảnh (#772)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species loi_van_hai_ung`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `loi_van_hai_ung` (Lôi Vân Hải Ưng), họ `bird`, khung game 96×96. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1659**, 2046855 byte, SHA256 `48d07b5b0ddf0cd02ad5785dbdf5510513a901158b1636a906edc5f8f53364bf`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `d7d166ce7d217b9c1b63e2fc29d15263c5a123ca076ce233c4025838e4e140e0`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ?).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 2088866 byte, SHA256 `d9cc4dc032028ca3800405d6a73baef2c00489fd593c997daaa2a205b3aedb7e`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toB.prompt.txt` (SHA256 `ecdffedcae24589fb0bc88d408a88b24cbd05e10fdc528acf04e1df3acc11e33`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: 3 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — sai kích thước — toàn tờ — 948×1659 không đúng tỉ lệ nào trong tập cho phép (A 2:3, B 1:1, một hướng 3:2).
LỖI: toA — hướng/pose — S H4 D3 — DIE nằm ngang, lệch trục hướng nam (mắt)
LỖI: toB — hướng — NE H1–H4 — lộ mắt/mỏ, không phải góc lưng ba phần tư (mắt)
LỖI: toB — hướng — N H5–H8 — lộ mặt trước, không phải góc lưng (mắt)
LỖI: toB — pose — N H8 D3 — DIE nằm ngang, lệch trục hướng bắc (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/loi_van_hai_ung/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Lôi Vân Hải Ưng: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
