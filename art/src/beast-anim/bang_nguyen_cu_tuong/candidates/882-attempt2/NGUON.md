# Băng Nguyên Cự Tượng — RAW hoạt ảnh (#1423)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bang_nguyen_cu_tuong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bang_nguyen_cu_tuong` (Băng Nguyên Cự Tượng), họ `quad`, khung game 128×128. Mức kiểm chung: **nhẹ**.

## to-e

- File: `to-e.png`, **1536×1024**, 2090196 byte, SHA256 `524734c8192225185eac08ff9a4bff0dc99b025bf6d262a9ae80ada318e4439e`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-882.
- Prompt: `to-e.prompt.txt` (SHA256 `9dc5f7882d42bdd01f68223ac738aa7ac0c84b840f93c2d788dde208974a8b95`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: e nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: to-e — hình ở ô trống — H4 (e) C5 — ô trống có hình (0.66% diện tích ô): hình tràn từ ô bên.
LỖI: to-e — hướng e — trán và ngực còn chếch trước ở idle và die, chưa rõ góc ngang; chặn, không nhập (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bang_nguyen_cu_tuong/` | - | image_gen.imagegen | RAW hoạt ảnh Băng Nguyên Cự Tượng: to-e 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
