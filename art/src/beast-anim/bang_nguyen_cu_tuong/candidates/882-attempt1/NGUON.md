# Băng Nguyên Cự Tượng — RAW hoạt ảnh (#1423)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bang_nguyen_cu_tuong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bang_nguyen_cu_tuong` (Băng Nguyên Cự Tượng), họ `quad`, khung game 128×128. Mức kiểm chung: **chặn**.

## to-e

- File: `to-e.png`, **1536×1024**, 2322857 byte, SHA256 `061547e761ce095c476cd9c285579675a35396949e0d07e9e8d85e1f3e2d822a`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-882.
- Prompt: `to-e.prompt.txt` (SHA256 `68baef55d721119719397f5210fbbcfdb8d6931f205f40ad26c81790bfc27a5a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: e chặn).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: to-e — hình dính / hình ở ô trống — H3 (e), H4 (e) C5 — dải có 1 hình, cần 6: hình dính nhau; ô trống có hình (0.53% diện tích ô): hình tràn từ ô bên.
LỖI: to-e — hướng e — đầu và ngực chếch trước như se; hurt H1 C6 nhấc chân; chặn, không nhập (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bang_nguyen_cu_tuong/` | - | image_gen.imagegen | RAW hoạt ảnh Băng Nguyên Cự Tượng: to-e 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
