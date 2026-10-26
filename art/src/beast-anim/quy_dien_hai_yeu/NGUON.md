# Quỷ Diện Hải Yêu — RAW hoạt ảnh (#774)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species quy_dien_hai_yeu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `quy_dien_hai_yeu` (Quỷ Diện Hải Yêu), họ `snake`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **1024×1536**, 2072033 byte, SHA256 `3b8b1ef72228b4c2e1360db3004a23abef35f1382d7e6be6fec59c4b018b440f`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `909c61dfe447e493e08cb9403b9650ac103312095f52f6b8b73bfdb4be8e6ad6`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1996837 byte, SHA256 `0050e1125d35c608334b2c488acc1311536bbb90bb0597b951dae7f8b822718d`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `e66675d053a64988b746cf57cc4cfdb58e8ac39352521447bcad4ed4e9f1dd97`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — cỡ thân lệch — H1–4 (s), H5–8 (se) — cỡ thân idle 120% so với ảnh tĩnh (lệch 20%); cỡ thân idle 110% so với ảnh tĩnh (lệch 10%).
LỖI: toA — sai hướng — S H3 C3–4 — khung 3–4 quay sang phải thay vì hướng s (mắt)
LỖI: toB — sai pose — N H8 C3–4 — DIE khung 3–4 nằm ngang ảnh, không giữ trục n (mắt)
```
