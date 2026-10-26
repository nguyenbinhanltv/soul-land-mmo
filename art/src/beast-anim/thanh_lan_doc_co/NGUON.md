# Thanh Lân Độc Cổ — RAW hoạt ảnh (#774)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thanh_lan_doc_co`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thanh_lan_doc_co` (Thanh Lân Độc Cổ), họ `snake`, khung game 96×96. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **941×1672**, 1852705 byte, SHA256 `4dc379a50cf25dca270120142da264e9250b5f695b9454bf421f18b682a48658`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `4a58cb9b873c896ebe14816aa5ccedd731f477e790c1fc3e0feaa6de2b62df75`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ?).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1876513 byte, SHA256 `c88ee1aba0332b3f92389bdf197be66fca3a79f74380532dcf96af3eacdf0b5d`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `623b7f340826b7d98ca8376df3f352b6d9530881576ade4b987f3befde2ccaea`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Duyệt bằng mắt: 4 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — sai kích thước — toàn tờ — 941×1672 không đúng tỉ lệ nào trong tập cho phép (A 2:3, B 1:1, một hướng 3:2).
LỖI: toA — sai hướng — s — ATTACK H3 C3–4 quay sang phải, không giữ hướng s (mắt)
LỖI: toA — sai pose — s — DIE H4 C1–4 nằm ngang ảnh, không giữ trục hướng s (mắt)
LỖI: toB — chân lệch / hình ở ô trống — H3 (ne) C3–4, H4 (ne) C5, H4 (ne) C6, H7 (n) C3–4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 18%); ô trống có hình (1.07% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.55% diện tích ô): hình tràn từ ô bên; chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 17%).
LỖI: toB — sai hướng — ne — ATTACK H3 C3–4 lộ mặt/mõm (mắt)
LỖI: toB — sai hướng — n — WALK H6 C1–6 quay ngang sang phải, không giữ hướng n (mắt)
LỖI: toB — sai hướng — n — ATTACK H7 C3–4 lộ mặt/mõm (mắt)
LỖI: toB — sai pose — n — DIE H8 C1–4 nằm ngang ảnh, không giữ trục hướng n (mắt)
```
