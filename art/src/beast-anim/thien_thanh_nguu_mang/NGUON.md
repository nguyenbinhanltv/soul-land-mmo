# Thiên Thanh Ngưu Mãng — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thien_thanh_nguu_mang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thien_thanh_nguu_mang` (Thiên Thanh Ngưu Mãng), họ `snake`, khung game 192×192. Mức kiểm chung: **pass**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1942055 byte, SHA256 `2fd5d785740cdf3ef8c8219e0c3143e6d494cf1a0f36cfd3ccd22873fe8c272b`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-635.
- Prompt: `turnaround.prompt.txt` (SHA256 `eec740973d510ab84ae0ca41774155edaa42dbfd48c2f324515f35c1bc885525`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — ne còn hơi lộ mõm; die còn đường cong S; chọn lượt 2/3 tốt nhất làm tham chiếu kỹ thuật theo yêu cầu (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thien_thanh_nguu_mang/` | - | image_gen | RAW hoạt ảnh Thiên Thanh Ngưu Mãng: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
