# Thanh Lân Ngạc — RAW hoạt ảnh (#1425)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thanh_lan_ngac`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thanh_lan_ngac` (Thanh Lân Ngạc), họ `quad`, khung game 96×96. Mức kiểm chung: **chặn**.

## guide

- File: `guide.png`, **1536×1024**, 1314369 byte, SHA256 `1df4e9bb1416997836f5aefbfd6e846d3732666c41cfd46a4b2c627eb8ac49ab`.
- Công cụ: image_gen.imagegen (ảnh dẫn một tư thế, không phải tờ hoạt ảnh); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-884.
- Prompt: `guide.prompt.txt` (SHA256 `d99be7ea49d09ebbd9a6a1c792cc57a070796732741713628e19f90e8d3fd034`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ne chặn).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: guide — Bố cục và bốn chân/đuôi đúng; còn chấm sáng giống mắt ở cạnh đầu, sửa riêng ảnh dẫn trước khi dùng. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thanh_lan_ngac/` | - | image_gen.imagegen (ảnh dẫn một tư thế, không phải tờ hoạt ảnh) | RAW hoạt ảnh Thanh Lân Ngạc: guide 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
