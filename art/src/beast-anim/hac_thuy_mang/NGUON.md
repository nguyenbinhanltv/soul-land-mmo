# Hắc Thủy Mãng — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species hac_thuy_mang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `hac_thuy_mang` (Hắc Thủy Mãng), họ `snake`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **944×1665**, 1682539 byte, SHA256 `60265684d9f2e8d84b1d6daa384d508d64f9d6056c05c769bbbe498d18c018ab`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-630; chọn A3/3: walk s nhìn thẳng rõ hơn; A1/A2 trong candidates.
- Prompt: `toA.prompt.txt` (SHA256 `2cb1910b191fef075bade6e3c167d9b1c3a5d8bdeadc9f9af467ed4a729078ee`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 80% so với ảnh tĩnh (lệch 20%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 122% so với ảnh tĩnh (lệch 22%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1892816 byte, SHA256 `63e8af09f673be76780bc74a484367df1b70171f4c15efa4e2b97fbf2c0b2be3`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-630; chọn A3/3: walk s nhìn thẳng rõ hơn; A1/A2 trong candidates.
- Prompt: `toB.prompt.txt` (SHA256 `6764ebd4c3a5e0c895784ce9ac5172c27e52c506a9ec8bd264e8e4f8e1242290`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hướng — s H3–H4 — attack quay phải, die nằm ngang; se và e còn gần nhau (mắt)
LỖI: toA — pose — H1 H5 H9 C5–6 — hurt còn nghiêng đầu (mắt)
LỖI: toB — hướng — ne H1–H4, n H7–H8 — lộ mặt; die nằm ngang; hurt nghiêng đầu (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/hac_thuy_mang/` | - | image_gen.imagegen | RAW hoạt ảnh Hắc Thủy Mãng: toA 944×1665, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
