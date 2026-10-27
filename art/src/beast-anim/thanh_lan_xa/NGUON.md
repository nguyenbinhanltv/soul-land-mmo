# Thanh Lân Xà — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thanh_lan_xa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thanh_lan_xa` (Thanh Lân Xà), họ `snake`, khung game 64×64. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **941×1672**, 1619043 byte, SHA256 `185f045e1304f671f48240ed2a81137ad9d8aaaea7478cebfae475ca3b9358fa`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-616; chọn toA lượt 1/1, toB lượt 1/1.
- Prompt: `toA.prompt.txt` (SHA256 `525ab813d8174b7b9d792f58b917d6498636c98ce0c3b4d09460f395d7b6864e`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 67% so với ảnh tĩnh (lệch 33%, quá 25%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (se): cỡ thân idle 82% so với ảnh tĩnh (lệch 18%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1678124 byte, SHA256 `b9650bb838a1dfe86d0f216212725a8e6502eae0d992f0760376e0b6233236d2`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-616; chọn toA lượt 1/1, toB lượt 1/1.
- Prompt: `toB.prompt.txt` (SHA256 `98722a859d01bf7f83c1a5d21aae8bb709c43b69bb4b373e8f7e0f9f42b9d567`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 123% so với ảnh tĩnh (lệch 23%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 128% so với ảnh tĩnh (lệch 28%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — chân lệch — H3 (s) C4, H7 (se) C4, H11 (e) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 15%); chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 17%); chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 15%).
LỖI: toA — hướng — s H2–H4 — walk và attack nghiêng phải, die nằm ngang; se gần e (mắt)
LỖI: toA — pose — H1 H5 H9 C5–6 — hurt quay đầu (mắt)
LỖI: toB — chân lệch — H3 (ne) C4, H7 (n) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 14%); chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 14%).
LỖI: toB — hướng — ne H1–H4, n H5–H8 — lộ mặt; attack đổi hướng, die nằm ngang; hurt quay đầu (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thanh_lan_xa/` | - | image_gen.imagegen | RAW hoạt ảnh Thanh Lân Xà: toA 941×1672, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
