# Nhân Diện Ma Chu — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species nhan_dien_ma_chu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `nhan_dien_ma_chu` (Nhân Diện Ma Chu), họ `insect`, khung game 128×128. Mức kiểm chung: **pass**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1572387 byte, SHA256 `51d9e1d695e8fe673611d0e49a5d22208352306eeade6052269bb2fc313c25b6`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-623.
- Prompt: `turnaround.prompt.txt` (SHA256 `daca5ff6fbd7523e50d40908bff71550ffb22830643b4e9230892d6832fd3e04`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — Chặn mắt — chưa đọc rõ tám chân; lượt 1 tốt nhất lưu candidates/turnaround-attempt1.png (hash trùng mục file bên trên), không có turnaround.png ở thư mục chính; lượt 2 mặt người nổi khối, lượt 3 ne lộ họa tiết mặt. Dừng sau 3 lượt; chưa có tham chiếu đạt nên chưa sinh A–E. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/nhan_dien_ma_chu/` | - | image_gen | RAW hoạt ảnh Nhân Diện Ma Chu: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
