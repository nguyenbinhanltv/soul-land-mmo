# Thanh Lân Ngạc — RAW hoạt ảnh (#1425)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thanh_lan_ngac`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thanh_lan_ngac` (Thanh Lân Ngạc), họ `quad`, khung game 96×96. Mức kiểm chung: **chặn**.

## guide

- File: `guide.png`, **1536×1024**, 1296693 byte, SHA256 `fcd2b174958d8f1816ab603656208c4cb227216e2c5476b3d8dcfbff6c8b20a6`.
- Công cụ: image_gen.imagegen (ảnh dẫn một tư thế, không phải tờ hoạt ảnh); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-884.
- Prompt: `guide.prompt.txt` (SHA256 `13fc755483e4ac7d43b34b699484c9f56204cfb9c4ed5b581e9beb1a7e87ddff`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ne chặn).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: guide — Chặn ảnh dẫn: phóng lớn vẫn thấy chấm sáng trong hốc tối ở cạnh đầu, không dùng cho tờ ne. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thanh_lan_ngac/` | - | image_gen.imagegen (ảnh dẫn một tư thế, không phải tờ hoạt ảnh) | RAW hoạt ảnh Thanh Lân Ngạc: guide 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
