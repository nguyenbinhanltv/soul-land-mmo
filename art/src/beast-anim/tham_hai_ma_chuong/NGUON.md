# Thâm Hải Ma Chương — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species tham_hai_ma_chuong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `tham_hai_ma_chuong` (Thâm Hải Ma Chương), họ `float`, khung game 96×96. Mức kiểm chung: **pass**.

## toA

- File: `toA.png`, **948×1659**, 2062318 byte, SHA256 `70e297906c0f143dda3768a163af5e0b9c0a9b34bf802e7163dfd15edd477fc0`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-640.
- Prompt: `toA.prompt.txt` (SHA256 `7a88de9f547abb3f9e4505bccb545f03c5fa618b8c076521c99f2b54812b1b03`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass, se pass, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — e — H9-H12, rõ nhất H11 C1 — một số khung còn thiên góc ba phần tư, chưa ngang tuyệt đối; chọn A3 đạt kỹ thuật làm tham chiếu B; A1/A2 và bản cũ giữ ở candidates (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/tham_hai_ma_chuong/` | - | image_gen.imagegen | RAW hoạt ảnh Thâm Hải Ma Chương: toA 948×1659; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
