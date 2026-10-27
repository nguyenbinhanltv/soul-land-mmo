# Lôi Quang Hải Diêu — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species loi_quang_hai_dieu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `loi_quang_hai_dieu` (Lôi Quang Hải Diêu), họ `swim`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 1802902 byte, SHA256 `8a9d91f96fd89adbb31e3d7c45391c5a2302ed2e381558f68264e62058be7e04`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-619.
- Prompt: `toA.prompt.txt` (SHA256 `31f7e8b26215685815c65d9df06a0796bb4e062b0ab836b086c50eb91836bdaa`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 162% so với ảnh tĩnh (lệch 62%, quá 25%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 57% so với ảnh tĩnh (lệch 43%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1784625 byte, SHA256 `4d56375c1e7a06bc3bb34b82a700e92188df921d1d3d49653fb9578faa6e18e4`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-619.
- Prompt: `toB.prompt.txt` (SHA256 `adf0ea670bfa415368743a6037566fcd313bb26bdcab95602d5fc88afad0885f`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 164% so với ảnh tĩnh (lệch 64%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — chân lệch — H10 (e) C3–6 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 20%).
LỖI: toA — e — H11 attack C1–3,5–6 và H12 die — trục thân nghiêng gần se; hurt biên độ nhỏ (mắt)
LỖI: toB — ne — H1–4 — gần nhìn ngang e, chưa đọc được lưng; n — H5–8 — giống mặt trước s, chưa quay lưng (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/loi_quang_hai_dieu/` | - | image_gen.imagegen | RAW hoạt ảnh Lôi Quang Hải Diêu: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
