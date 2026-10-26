# Xích Lân Mãng — RAW hoạt ảnh (#774)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species xich_lan_mang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `xich_lan_mang` (Xích Lân Mãng), họ `snake`, khung game 96×96. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1659**, 1841914 byte, SHA256 `d1e8c8455f6b2bbdf960ac56a2b42917436639bcadfa0bee4c0d218aad02aaa1`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul-land-mmo-135.
- Prompt: `toA.prompt.txt` (SHA256 `9dc205c6ed2f26ff3dd7b8f7923b16d75ce2250543bcc5b767c95c49f4f79310`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ?).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1879248 byte, SHA256 `c15ddce0dd95e64fc6d11674eae1810497a6604b8aef016760f8b6602bb5b675`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul-land-mmo-135.
- Prompt: `toB.prompt.txt` (SHA256 `48310fac1f5f6359625dbc2dc0c19d9e1ee3090c6d0b8686c54df647aafeae36`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Duyệt bằng mắt: 4 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — sai kích thước — toàn tờ — 948×1659 không đúng tỉ lệ nào trong tập cho phép (A 2:3, B 1:1, một hướng 3:2).
LỖI: toA — hướng — S H2 W0–W5; SE H6 W0–W5 — walk quay ngang sang phải, lệch hướng khối (mắt)
LỖI: toA — pose — S H4 D2–D3; SE H8 D2–D3 — die nằm ngang, lệch trục hướng (mắt)
LỖI: toB — chân lệch — H8 (n) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%).
LỖI: toB — hướng — NE H1 H0–H1, H2 W0–W5, H3 A0–A5 — hurt/walk/attack lộ mặt (mắt)
LỖI: toB — pose — NE H4 D2–D3 — die nằm ngang, lệch trục hướng đông-bắc (mắt)
LỖI: toB — hướng — N H6 W0–W5; H7 A0–A5 — walk/attack lộ mặt (mắt)
LỖI: toB — pose — N H8 D2–D3 — die nằm ngang, lệch trục hướng bắc (mắt)
```
