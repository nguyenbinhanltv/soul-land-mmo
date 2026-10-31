# Thanh Lân Ngạc — RAW hoạt ảnh (#1425)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thanh_lan_ngac`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thanh_lan_ngac` (Thanh Lân Ngạc), họ `quad`, khung game 96×96. Mức kiểm chung: **chặn**.

## guide

- File: `guide.png`, **1536×1024**, 1305907 byte, SHA256 `a7df30e2a84716fca3dd1ec69d62ff8a993438b9d43ccf6cb401552945ead920`.
- Công cụ: image_gen.imagegen (ảnh dẫn một tư thế, không phải tờ hoạt ảnh); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-884.
- Prompt: `guide.prompt.txt` (SHA256 `35bc9dc9aadfcf7f79934e4af3356d6842674c014cecce35d5dd8f89e48d3bb6`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ne chặn).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: guide — Chặn ảnh dẫn: đỉnh sọ đã thu nhỏ nhưng chấm sáng trong hốc tối cạnh đầu-vai vẫn hiện khi phóng lớn; dừng, không dùng để sinh tờ ne. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thanh_lan_ngac/` | - | image_gen.imagegen (ảnh dẫn một tư thế, không phải tờ hoạt ảnh) | RAW hoạt ảnh Thanh Lân Ngạc: guide 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
