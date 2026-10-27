# Kim Lân Long Quy — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species kim_lan_long_quy`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `kim_lan_long_quy` (Kim Lân Long Quy), họ `quad`, khung game 128×128. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **1536×1024**, 1910092 byte, SHA256 `11d32b19d870f1faa4dbbb17e8d1d5d1f23117287cae1c7e9f4c13ace69240db`.
- Công cụ: builtin Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `35406a0a5261d8bbd0078aab970c07634d74df7ef26f8b587030962e98b16139`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1536×1024**, 1898448 byte, SHA256 `a7a672bf1f71602be624adb7cf76e9a8d823ec57197b199280e2a003fdc3e919`.
- Công cụ: builtin Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `2ab2095b7e6cbcadb73ae45ae5e454200544e9255c3b4582c4f8cb50783e6762`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: se pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toC

- File: `toC.png`, **1536×1024**, 1865833 byte, SHA256 `90b360d4674e9e39a1845e733763deeffed89b11a0e3d9faf25dc72f68ab0a3f`.
- Công cụ: builtin Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toC.prompt.txt` (SHA256 `b0562f6c32e6dab208e0aaf6abc197cea9aaf8d690af019f1ccd655fde066f2a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: e nhẹ).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toD

- File: `toD.png`, **1536×1024**, 1879662 byte, SHA256 `29107406646f481e24d16795771c9946f339a08b7da6e750e14e83928439ef4d`.
- Công cụ: builtin Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toD.prompt.txt` (SHA256 `4fe34467a89415273c908d64bbb96ded96b14d8d5780a37518a9819c2fd5509c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 118% so với ảnh tĩnh (lệch 18%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toE

- File: `toE.png`, **1536×1024**, 1815361 byte, SHA256 `d1ec94550f2544e84412d44fcfae638735bab2fbf3de9576563b99035c087e0e`.
- Công cụ: builtin Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toE.prompt.txt` (SHA256 `8c38cc4291f82077dbcfc3d55a917e53ece94ee8f78df88a27db161313490549`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 133% so với ảnh tĩnh (lệch 33%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — pose — S H4 C4 D3 — die đổ ngang sang bên, trục thân xoay khỏi hướng s. (mắt)
LỖI: toC — khung chết — H1 (e) C1–4 — idle: mọi khung gần như trùng (xor/hợp tối đa 0.03 < 0.03); hoạt ảnh không chuyển động.
LỖI: toD — hướng — NE H1 C1–4 (I0–I3), C5–6 (H0–H1); H2 C1–6 (W0–W5); H3 C1–6 (A0–A5); H4 C1–4 (D0–D3) — lộ mắt/mặt, hình gần ngang thay vì góc lưng 3/4. (mắt)
LỖI: toE — pose — N H4 C4 D3 — die nằm ngang, xoay khỏi hướng n và lộ mặt bên. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/kim_lan_long_quy/` | - | builtin Codex image_gen.imagegen | RAW hoạt ảnh Kim Lân Long Quy: toA 1536×1024, toB 1536×1024, toC 1536×1024, toD 1536×1024, toE 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
