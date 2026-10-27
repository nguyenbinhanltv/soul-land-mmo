# Thâm Hải Ma Chương — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species tham_hai_ma_chuong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `tham_hai_ma_chuong` (Thâm Hải Ma Chương), họ `float`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 2062318 byte, SHA256 `70e297906c0f143dda3768a163af5e0b9c0a9b34bf802e7163dfd15edd477fc0`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-640.
- Prompt: `toA.prompt.txt` (SHA256 `7a88de9f547abb3f9e4505bccb545f03c5fa618b8c076521c99f2b54812b1b03`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 90% so với ảnh tĩnh (lệch 10%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 2180166 byte, SHA256 `fe16ab972d841028b23d48ecbc4919fb301a1ef281af34dd6c5e4e2568a2c63c`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-640.
- Prompt: `toB.prompt.txt` (SHA256 `7a3defdf01c8b80335053f555e849c17ca057db4e5cf617660d58869ce041b44`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 112% so với ảnh tĩnh (lệch 12%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — CHẶN HƯỚNG se/e — H5-H12, rõ nhất H11 C1 — se/e vẫn gần nhau (IoU 0.802), e chưa ngang; đủ 3 lượt chọn A3; mọi File/Prompt trong tài liệu này nằm dưới candidates/, không có RAW chính; A3 đạt kỹ thuật đã dùng làm tham chiếu B theo ngoại lệ #1030; A1/A2 và bộ cũ giữ kèm source/prompt (mắt)
LỖI: toB — CHẶN MẶT ne/n — H1-H8 gồm hurt/die — vẫn lộ mắt, n còn chính diện; đủ 3 lượt chọn B3 chỉ giữ candidates/toB.png; B1/B2 và bộ cũ giữ kèm source/prompt; prompt trùng byte dùng chung theo prompt_file trong source (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/tham_hai_ma_chuong/` | - | image_gen.imagegen | RAW hoạt ảnh Thâm Hải Ma Chương: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
