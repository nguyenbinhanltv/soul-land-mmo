# Hôi Vũ Tước — RAW hoạt ảnh (#772)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species hoi_vu_tuoc`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `hoi_vu_tuoc` (Hôi Vũ Tước), họ `bird`, khung game 64×64. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1660**, 1779427 byte, SHA256 `e265549dd7374c2b1d61ca0d3ba01f76a0253223fc70d41a0c9e96f016869465`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `2ad3ce5d8a38da91395e8bafeacee85c7f393a0e8fd941dfb7fc6670f3d1d7ff`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ?).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1771258 byte, SHA256 `bbfb540aa83a195a8ca5e63b4b11cd89310a9af8631f831bed20e0ef15434b06`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toB.prompt.txt` (SHA256 `571c24ed037e31d7e0603c847323be22575cb6c8485549cb841fbb52ecb890f4`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — sai kích thước — toàn tờ — 948×1660 không đúng tỉ lệ nào trong tập cho phép (A 2:3, B 1:1, một hướng 3:2).
LỖI: toA — pose — H4 D4 (s) — die nằm ngang, lệch trục hướng (mắt)
LỖI: toB — cỡ thân lệch — H1–4 (ne), H5–8 (n) — cỡ thân idle 89% so với ảnh tĩnh (lệch 11%); cỡ thân idle 111% so với ảnh tĩnh (lệch 11%).
LỖI: toB — hướng/pose — NE H1–H4; N H8 D4 — NE lộ mắt/mỏ; D4 die nằm ngang, lệch trục hướng (mắt)
```
