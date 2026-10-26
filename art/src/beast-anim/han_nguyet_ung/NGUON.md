# Hàn Nguyệt Ưng — RAW hoạt ảnh (#772)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species han_nguyet_ung`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `han_nguyet_ung` (Hàn Nguyệt Ưng), họ `bird`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **1024×1536**, 1872555 byte, SHA256 `2f320899f8fe85888442f4963f363dcd848e305923eab41ba850b8d9dae6f733`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `21ee88c2eb792f217e6c896ade0ffa3b845ae9eaf2c450e776aca8e1486d1251`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass, se pass, e pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toB

- File: `toB.png`, **1254×1254**, 1915826 byte, SHA256 `3ac35204366ceba8089440c8f96b59ab65981c446db8c4288d7a0e416d976ac0`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toB.prompt.txt` (SHA256 `a2ef380dbb985aad9f0dac5171dbe7fd395720e572f7e47d7d71e27309bd977a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toB — cỡ thân lệch — H5–8 (n) — cỡ thân idle 111% so với ảnh tĩnh (lệch 11%).
LỖI: toB — hướng — NE H1–H2, H3 A2–A3, H4 D0–D3; N H6 W2–W3, H7 A2–A3, H8 D3 — lộ mặt/mỏ (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/han_nguyet_ung/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Hàn Nguyệt Ưng: toA 1024×1536, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
