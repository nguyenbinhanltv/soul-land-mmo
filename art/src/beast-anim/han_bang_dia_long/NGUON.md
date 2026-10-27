# Hàn Băng Địa Long — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species han_bang_dia_long`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `han_bang_dia_long` (Hàn Băng Địa Long), họ `quad`, khung game 128×128. Mức kiểm chung: **pass**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1800175 byte, SHA256 `70eb3a701f6ec510c6a9279b6631334b4f942750e310a3759a470a499be8dd73`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: ao-desktop.
- Prompt: `turnaround.prompt.txt` (SHA256 `40c7e9d8593b355158b0e46350c4c0c8eb371790aed52365f8baf711e273f46d`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — chọn lượt 1 làm ref kỹ thuật; se gần e, HURT ngẩng đầu mạnh; lượt 2–3 ne lộ mặt rõ hơn (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/han_bang_dia_long/` | - | image_gen | RAW hoạt ảnh Hàn Băng Địa Long: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
