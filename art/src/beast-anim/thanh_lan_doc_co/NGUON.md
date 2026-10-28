# Thanh Lân Độc Cổ — RAW hoạt ảnh (#861)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thanh_lan_doc_co`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thanh_lan_doc_co` (Thanh Lân Độc Cổ), họ `snake`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **941×1672**, 1852705 byte, SHA256 `4dc379a50cf25dca270120142da264e9250b5f695b9454bf421f18b682a48658`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `4a58cb9b873c896ebe14816aa5ccedd731f477e790c1fc3e0feaa6de2b62df75`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 77% so với ảnh tĩnh (lệch 23%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 135% so với ảnh tĩnh (lệch 35%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1876513 byte, SHA256 `c88ee1aba0332b3f92389bdf197be66fca3a79f74380532dcf96af3eacdf0b5d`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `623b7f340826b7d98ca8376df3f352b6d9530881576ade4b987f3befde2ccaea`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Duyệt bằng mắt: 5 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — chân lệch — H3 (s) C3–4, H7 (se) C3–4, H11 (e) C3–4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 20%); chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 22%); chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 20%).
LỖI: toA — hướng — s H3 C3–4 quay sang phải, không giữ hướng s (mắt)
LỖI: toA — pose — s H4 C1–4 nằm ngang ảnh, không giữ trục hướng s (mắt)
LỖI: toB — chân lệch / hình ở ô trống — H3 (ne) C3–4, H4 (ne) C5, H4 (ne) C6, H7 (n) C3–4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 18%); ô trống có hình (1.07% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.55% diện tích ô): hình tràn từ ô bên; chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 17%).
LỖI: toB — hướng — ne H3 C3–4 lộ mặt/mõm (mắt)
LỖI: toB — hướng — n H6 C1–6 quay ngang sang phải, không giữ hướng n (mắt)
LỖI: toB — hướng — n H7 C3–4 lộ mặt/mõm (mắt)
LỖI: toB — pose — n H8 C1–4 nằm ngang ảnh, không giữ trục hướng n (mắt)
LỖI: toB — Lô 3: se,ne,n chưa sinh hướng vì turnaround hết 2 lượt chưa đạt; lượt 1 hai đầu ở s, ne/die lộ mắt; lượt 2 sai mặt trước/s. Xem candidates/turnaround-lo3-attempt1..2.png; giữ fallback. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thanh_lan_doc_co/` | - | builtin Codex `image_gen.imagegen` | Thanh Lân Độc Cổ (H4 #774): RAW `art/src/beast-anim/thanh_lan_doc_co/toA.png` (941×1672, A1/1; sai tỉ lệ A 2:3) và `toB.png` (1254×1254, B1/1; cỡ B hợp lệ), sinh ngày 2026-10-26 bằng builtin Codex `image_gen.imagegen`. A chỉ tham chiếu static `shared/assets/sprites/beast/thanh_lan_doc_co.png`; B tham chiếu static rồi A1 candidate chưa được owner duyệt. Model/seed không được công cụ công bố. RAW nguyên byte, không hậu kỳ/cắt/resize. Prompt và provenance ở `toA.prompt.txt`, `toB.prompt.txt`, `toA.source.json`, `toB.source.json`; lỗi quan sát được ghi trong provenance/NGUON khi công cụ sinh. Chờ review; chưa artaccepted/imported. Part of #774. | 2026-10-26 | Cập nhật #1007: A 941×1672 hợp lệ, không redraw vì size. Vẫn còn finding checker và mỹ thuật như mục Lỗi; chưa artaccepted/imported. |
