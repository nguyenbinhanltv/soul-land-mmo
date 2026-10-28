# Cúc Yêu Hoa Linh — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species cuc_yeu_hoa_linh`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `cuc_yeu_hoa_linh` (Cúc Yêu Hoa Linh), họ `plant`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1657004 byte, SHA256 `d7efb2bbc4957aad73550c605be5eea89da270392e98e728f53dd2458cf2fbb6`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `turnaround.prompt.txt` (SHA256 `8be60ffe40235792907c8811974effd582ea5df2d1647d12218bffa169e3aedc`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **1024×1536**, 2021894 byte, SHA256 `239382e5b3f8a6c34459a8d326dc974e14df44e07923548b53f0360b188c851a`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toA.prompt.txt` (SHA256 `391d1c8f47f170afa10f395396bec28329dde3c5afec847cb1327a7eadf8616e`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se nhẹ, e pass).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1966640 byte, SHA256 `e44a95b74ae14287e4c4b65b16ec8f534779b84c5a488554faf0aa34dd416ac3`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toB.prompt.txt` (SHA256 `a694f0f9b2cf15b22e6dfa4e2fa548bcbcb48e9546acf8b8d95b15181e7d1947`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toD

- File: `toD.png`, **1536×1024**, 1843382 byte, SHA256 `cfe5fafa14ff0a8f550a8f3caea3373e7b0814d7ca95571c968cab607c102098`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toD.prompt.txt` (SHA256 `0b7c2c26a8eb59cdb11dee0bd167d7cd58ef473b4acccd4efc10c439516655e0`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 183% so với ảnh tĩnh (lệch 83%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toE

- File: `toE.png`, **1536×1024**, 1858592 byte, SHA256 `63075bbc63cc497ec396fd7a1d0495babb9eb39959a3e285fa5f59fa42393b85`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toE.prompt.txt` (SHA256 `8487e8d5fc493026eb57ee0379ceeae0046cbc01fbbf057f3f396de00aaecdd0`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 188% so với ảnh tĩnh (lệch 88%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống — H8 (se) C5, H8 (se) C6 — ô trống có hình (0.58% diện tích ô): hình tràn từ ô bên; ô trống có hình (0.69% diện tích ô): hình tràn từ ô bên.
LỖI: toB — hình ở ô trống — H4 (ne) C5, H4 (ne) C6 — ô trống có hình (3.77% diện tích ô): hình tràn từ ô bên; ô trống có hình (3.57% diện tích ô): hình tràn từ ô bên.
LỖI: toD — nhập — sau cắt — RAW không chặn, giữ hướng; cutter mặc định còn vuot-khung-he-so trước neo cỡ, chưa nhập (mắt)
LỖI: toE — nhập — sau cắt — RAW không chặn, giữ hướng; cutter mặc định còn vuot-khung-he-so trước neo cỡ, chưa nhập (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/cuc_yeu_hoa_linh/` | - | Codex image_gen.imagegen | RAW hoạt ảnh Cúc Yêu Hoa Linh: turnaround 1536×1024, toA 1024×1536, toB 1254×1254, toD 1536×1024, toE 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
