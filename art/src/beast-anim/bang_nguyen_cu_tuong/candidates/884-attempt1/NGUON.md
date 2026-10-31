# Băng Nguyên Cự Tượng — RAW hoạt ảnh (#1423)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bang_nguyen_cu_tuong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bang_nguyen_cu_tuong` (Băng Nguyên Cự Tượng), họ `quad`, khung game 128×128. Mức kiểm chung: **chặn**.

## to-e

- File: `to-e.png`, **1536×1024**, 2324519 byte, SHA256 `07363d6b731aaced3bfe014c0cd2d9767db7ebe4a191a4a3d32c9b9741da0e97`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-884.
- Prompt: `to-e.prompt.txt` (SHA256 `92cc3a7db84a06e3669771026e8dddf8737617e30aa7cf5ed24d970bbf5538db`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: e chặn).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Lỗi

```text
LỖI: to-e — hình dính / hình ở ô trống / sai số hình — H2 (e), H3 (e), H4 (e) C5, H4 (e) — dải có 1 hình, cần 6: hình dính nhau; dải có 3 hình, cần 6: hình dính nhau; ô trống có hình (1.02% diện tích ô): hình tràn từ ô bên; dải có 3 hình, cần 4: thiếu khung.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bang_nguyen_cu_tuong/` | - | image_gen.imagegen | RAW hoạt ảnh Băng Nguyên Cự Tượng: to-e 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
