# Độc Cức Đằng — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species doc_cuc_dang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `doc_cuc_dang` (Độc Cức Đằng), họ `plant`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **1024×1536**, 2118893 byte, SHA256 `dbb6abec5daa89cfc40acee8f510dcca545922cc835dbf58332391ba3a4819f1`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-639.
- Prompt: `toA.prompt.txt` (SHA256 `c8bcd7b825b280dbe13765ca8ac924842d4192de7f3a7d337e000b4b26717e06`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 83% so với ảnh tĩnh (lệch 17%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống — H4 (s) C5, H4 (s) C6, H8 (se) C5, H8 (se) C6 — ô trống có hình (4.06% diện tích ô): hình tràn từ ô bên; ô trống có hình (2.02% diện tích ô): hình tràn từ ô bên; ô trống có hình (18.92% diện tích ô): hình tràn từ ô bên; ô trống có hình (17.92% diện tích ô): hình tràn từ ô bên.
LỖI: toA — s se e — die khung cuối cùng co thành đám dây gần giống nhau, hướng đổ chưa rõ; se và e vẫn phân biệt ở idle/walk/attack (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/doc_cuc_dang/` | - | image_gen.imagegen | RAW hoạt ảnh Độc Cức Đằng: toA 1024×1536; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
