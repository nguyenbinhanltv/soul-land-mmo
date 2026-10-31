# Nhân Diện Ma Chu — RAW hoạt ảnh (#1424)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species nhan_dien_ma_chu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `nhan_dien_ma_chu` (Nhân Diện Ma Chu), họ `insect`, khung game 128×128. Mức kiểm chung: **chặn**.

## turnaround

- File: `turnaround.png`, **1620×971**, 1769970 byte, SHA256 `4e49fba7afefe5bdd1eae0c93ad19f7d7a13e64a6bac0d3e80897b3305914fd1`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-882.
- Prompt: `turnaround.prompt.txt` (SHA256 `64fd58507a514400d68c7ff2843de8b4159472dc1106188644740c4006d7dbaf`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — sai kích thước — toàn tờ — 1620×971 không đúng tỉ lệ 3:2 của turnaround (1536×1024).
LỖI: turnaround — giải phẫu/hướng — nhiều hình chỉ đọc rõ ba cặp chân, ne/n còn họa tiết giống mặt; hết hai lượt mẫu, không dùng tham chiếu, giữ ne dự phòng (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/nhan_dien_ma_chu/` | - | image_gen.imagegen | RAW hoạt ảnh Nhân Diện Ma Chu: turnaround 1620×971; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
