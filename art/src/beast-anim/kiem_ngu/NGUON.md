# Kiếm Ngư — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species kiem_ngu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `kiem_ngu` (Kiếm Ngư), họ `swim`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **1024×1536**, 1952455 byte, SHA256 `fb28a600888fddb985cb2bad36f2890f6f4eb22d76a2039abbe3d5a357080aed`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: soul_land_game-764.
- Prompt: `toA.prompt.txt` (SHA256 `6dfe072e8f4ebe234f5f319ec55808bfab57c91a1313aee718cee664f69b7e3c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 89% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1813254 byte, SHA256 `556a15f84ec959ec67546bddba5299a9346a0aa8a76a4e1855a12a7db8174c64`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: soul_land_game-764.
- Prompt: `toB.prompt.txt` (SHA256 `dd5754974be6e4ba9cdb2a9b4a548526b01a76907f20bf531b24eb668201a57a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n pass).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## Lỗi

```text
LỖI: toB — hình ở ô trống — H4 (ne) C5, H4 (ne) C6 — ô trống có hình (1.1% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.35% diện tích ô): hình tràn từ ô bên.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/kiem_ngu/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Kiếm Ngư: toA 1024×1536, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
