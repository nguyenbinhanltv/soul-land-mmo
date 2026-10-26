# Độc Châm Phong — RAW hoạt ảnh (#775)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species doc_cham_phong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `doc_cham_phong` (Độc Châm Phong), họ `insect`, khung game 64×64. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1659**, 1838198 byte, SHA256 `e51c299e40803ae3e3ddfe71f9fcca2a6bd437e0b2d1c807ed36e93728f57ebf`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `546e8248060e15db5eff2708fdc0b2421a048b60ff9e54f156cfa268dec1ca61`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ?).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1879248 byte, SHA256 `c15ddce0dd95e64fc6d11674eae1810497a6604b8aef016760f8b6602bb5b675`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `763d4e3860061e877c3af935a0fb7167ca48ecb230ec63605da025f223e4377d`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — sai kích thước — toàn tờ — 948×1659 không đúng tỉ lệ nào trong tập cho phép (A 2:3, B 1:1, một hướng 3:2).
LỖI: toA — pose — s H4 C3–4 — DIE nằm ngang ảnh, không giữ trục hướng s (mắt)
LỖI: toB — chân lệch / cỡ thân lệch — H8 (n) C4, H1–4 (ne), H5–8 (n) — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%); cỡ thân idle 89% so với ảnh tĩnh (lệch 11%); cỡ thân idle 111% so với ảnh tĩnh (lệch 11%).
LỖI: toB — loài — H1–8 — toàn tờ thể hiện rắn thay vì Độc Châm Phong (mắt)
```
