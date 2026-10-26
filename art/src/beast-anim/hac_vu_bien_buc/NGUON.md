# Hắc Vụ Biên Bức — RAW hoạt ảnh (#772)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species hac_vu_bien_buc`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `hac_vu_bien_buc` (Hắc Vụ Biên Bức), họ `bird`, khung game 96×96. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1659**, 1709325 byte, SHA256 `a1a2cf57d2b0c11bc9f5d94880b29a48b81060ece3dbe54427459aba4279d858`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `toA.prompt.txt` (SHA256 `4a9b461e1a73ba839fb5acc43d19fc39111cc13b884ad16e8618ba876b6d118c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ?).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toB

- File: `toB.png`, **1254×1254**, 1731511 byte, SHA256 `5fce4c2c768a96fe764ad3f65c3ac2dfac81a261a2dc4211a14929dfc63a12e3`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `cd9a97e4d10a318dfd2bd9376d10712243e685d1996af2c15e084766686a0ee5`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — sai kích thước — toàn tờ — 948×1659 không đúng tỉ lệ nào trong tập cho phép (A 2:3, B 1:1, một hướng 3:2).
LỖI: toB — hướng — NE H1–H4 và N H5–H8 — NE gần nhìn ngang, NE/N lộ mặt ở mọi khung (mắt)
```
