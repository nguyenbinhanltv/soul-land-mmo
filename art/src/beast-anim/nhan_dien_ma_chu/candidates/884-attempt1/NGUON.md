# Nhân Diện Ma Chu — RAW hoạt ảnh (#1424)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species nhan_dien_ma_chu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `nhan_dien_ma_chu` (Nhân Diện Ma Chu), họ `insect`, khung game 128×128. Mức kiểm chung: **pass**.

## to-ne

- File: `to-ne.png`, **1536×1024**, 2065662 byte, SHA256 `ea850fc36d3b1d8ff19f5780e231aae817b527e69cfd1802e06285410e8d008b`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-884.
- Prompt: `to-ne.prompt.txt` (SHA256 `576fe5e6557a4baf1dd6ba2c2e824f48ef2cd323ddaad271c6d5429659b84507`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Lỗi

Không có dòng `LỖI:`.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/nhan_dien_ma_chu/` | - | image_gen.imagegen | RAW hoạt ảnh Nhân Diện Ma Chu: to-ne 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
