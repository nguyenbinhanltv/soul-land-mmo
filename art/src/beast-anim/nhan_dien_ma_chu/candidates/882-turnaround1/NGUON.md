# Nhân Diện Ma Chu — RAW hoạt ảnh (#1424)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species nhan_dien_ma_chu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `nhan_dien_ma_chu` (Nhân Diện Ma Chu), họ `insect`, khung game 128×128. Mức kiểm chung: **pass**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1710399 byte, SHA256 `561e699063925779442cacb697a982513218bc5b886af3f14b78c084584b6162`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-882.
- Prompt: `turnaround.prompt.txt` (SHA256 `c135103672a3cc7e77ea8ea6ac7b32c492c80f6b6acfabdacb66315caa8a21eb`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — giải phẫu — nhiều hình chỉ đọc được ba cặp chân; không dùng tham chiếu (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/nhan_dien_ma_chu/` | - | image_gen.imagegen | RAW hoạt ảnh Nhân Diện Ma Chu: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
