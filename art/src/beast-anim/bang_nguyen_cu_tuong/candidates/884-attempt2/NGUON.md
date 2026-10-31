# Băng Nguyên Cự Tượng — RAW hoạt ảnh (#1423)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bang_nguyen_cu_tuong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bang_nguyen_cu_tuong` (Băng Nguyên Cự Tượng), họ `quad`, khung game 128×128. Mức kiểm chung: **chặn**.

## to-e

- File: `to-e.png`, **1536×1024**, 2282967 byte, SHA256 `98a7e0b8530d426a3d40cc613c1c694991214f0af6798c4257aeb94232c3be17`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-884.
- Prompt: `to-e.prompt.txt` (SHA256 `c0202fcf81445398920560fdc95057148023995b3c0cc31f85e474bb32c3c145`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: e chặn).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Lỗi

```text
LỖI: to-e — hình dính — H4 (e) — dải có 3 hình, cần 4: hình dính nhau.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bang_nguyen_cu_tuong/` | - | image_gen.imagegen | RAW hoạt ảnh Băng Nguyên Cự Tượng: to-e 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
