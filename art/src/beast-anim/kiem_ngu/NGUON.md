# Kiếm Ngư — RAW hoạt ảnh (#861)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species kiem_ngu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `kiem_ngu` (Kiếm Ngư), họ `swim`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **1024×1536**, 1952455 byte, SHA256 `fb28a600888fddb985cb2bad36f2890f6f4eb22d76a2039abbe3d5a357080aed`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: soul_land_game-764.
- Prompt: `toA.prompt.txt` (SHA256 `6dfe072e8f4ebe234f5f319ec55808bfab57c91a1313aee718cee664f69b7e3c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 87% so với ảnh tĩnh (lệch 13%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1813254 byte, SHA256 `556a15f84ec959ec67546bddba5299a9346a0aa8a76a4e1855a12a7db8174c64`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: soul_land_game-764.
- Prompt: `toB.prompt.txt` (SHA256 `dd5754974be6e4ba9cdb2a9b4a548526b01a76907f20bf531b24eb668201a57a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 89% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## to-s

- File: `to-s.png`, **1536×1024**, 1673659 byte, SHA256 `68da27cd41d73308323a37da4340f475d1808d7c3272a12a8d73eed90cb60e92`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-778.
- Prompt: `to-s.prompt.txt` (SHA256 `9137dfb0bdf663dc63237f3f99114a73cc501c857ac896984764a2230a3aa532`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 174% so với ảnh tĩnh (lệch 74%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## to-ne

- File: `to-ne.png`, **1536×1024**, 1702470 byte, SHA256 `e3f84c0e36045ff6a506b0375350abc8e37bb429f66e89723980d35388914678`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-778.
- Prompt: `to-ne.prompt.txt` (SHA256 `e0265746bee07b06b07007efdca2e97be11cc162e318d5c507464f94fa7f469e`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 163% so với ảnh tĩnh (lệch 63%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toB — hình ở ô trống — H4 (ne) C5, H4 (ne) C6 — ô trống có hình (1.1% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.35% diện tích ô): hình tràn từ ô bên.
LỖI: to-ne — chân lệch — H3 (ne) C3–4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 18%).
LỖI: to-ne — Phiên 778: CHẶN: 3 lượt vẫn có mắt bên đầu ở ne; giữ fallback. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/kiem_ngu/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Kiếm Ngư: toA 1024×1536, toB 1254×1254, to-s 1536×1024, to-ne 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
