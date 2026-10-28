# Xích Lân Mãng — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species xich_lan_mang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `xich_lan_mang` (Xích Lân Mãng), họ `snake`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 1841914 byte, SHA256 `d1e8c8455f6b2bbdf960ac56a2b42917436639bcadfa0bee4c0d218aad02aaa1`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `8a805f9d8c7a9146db0ac102ff2a7ede70e3699a04cde8353b124fbe26fe249f`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 88% so với ảnh tĩnh (lệch 12%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 121% so với ảnh tĩnh (lệch 21%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1879248 byte, SHA256 `c15ddce0dd95e64fc6d11674eae1810497a6604b8aef016760f8b6602bb5b675`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `5a630ea325f9d2c0c5508261e2997f6d3713fffdf23331663167cf6e3c8699c7`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 89% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 3 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — chân lệch / hình ở ô trống — H4 (s) C1, H8 (se) C5, H8 (se) C6, H8 (se) C1, H12 (e) C1 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 18%); ô trống có hình (7.1% diện tích ô): hình tràn từ ô bên; ô trống có hình (7.11% diện tích ô): hình tràn từ ô bên; chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 14%); chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 20%).
LỖI: toA — walk lệch hướng — S H2 và SE H6 — quay ngang sang phải (mắt)
LỖI: toA — die nằm ngang — S H4 và SE H8 — lệch trục hướng (mắt)
LỖI: toB — chân lệch — H8 (n) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%).
LỖI: toB — lộ mặt — NE H1 hurt, H2 walk, H3 attack; N H6 walk, H7 attack — vi phạm quy tắc n/ne không thấy mặt (mắt)
LỖI: toB — die nằm ngang — NE H4 và N H8 — lệch trục hướng (mắt)
LỖI: toB — Turnaround sửa lô 1: 2 lượt riêng chưa đạt; lượt 1 die ne lộ mắt, lượt 2 s/se có hai đầu; giữ fallback hướng yêu cầu. RAW và prompt thật/provenance kèm tại art\src\beast-anim\xich_lan_mang\candidates/turnaround-attempt1.png SHA256 e11fddc5b9105b602696e11ecabf8660c7d2f6e8104b68cd944f13060999acfd; art\src\beast-anim\xich_lan_mang\candidates/turnaround-attempt2.png SHA256 38939594a46aab6819938060aaea63ca427012357272a89c5d5110148317f23d (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/xich_lan_mang/` | - | built-in image_gen.imagegen | RAW hoạt ảnh Xích Lân Mãng: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
