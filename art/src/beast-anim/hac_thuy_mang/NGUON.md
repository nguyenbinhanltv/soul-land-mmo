# Hắc Thủy Mãng — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species hac_thuy_mang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `hac_thuy_mang` (Hắc Thủy Mãng), họ `snake`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1612626 byte, SHA256 `e9683fcf19eedc1e11604ef3f9d58989cd3b242d857972755c3295029de1a1d4`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 5.
- Prompt: `turnaround.prompt.txt` (SHA256 `536c56f6d9afd9c17aaf1005491365d3688a72f9aad0ca9f5d75de33663df955`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **944×1665**, 1682539 byte, SHA256 `60265684d9f2e8d84b1d6daa384d508d64f9d6056c05c769bbbe498d18c018ab`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toA.prompt.txt` (SHA256 `247d5a8e8665101decdc35cb1e74a3a46f81b4a62bf38dab5746d37678b83e68`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 74% so với ảnh tĩnh (lệch 26%, quá 25%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 113% so với ảnh tĩnh (lệch 13%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1892816 byte, SHA256 `63e8af09f673be76780bc74a484367df1b70171f4c15efa4e2b97fbf2c0b2be3`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toB.prompt.txt` (SHA256 `6764ebd4c3a5e0c895784ce9ac5172c27e52c506a9ec8bd264e8e4f8e1242290`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 89% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## to-ne

- File: `to-ne.png`, **1536×1024**, 1776452 byte, SHA256 `c3dcd25122665207282375853df8a329c6bdc340ada036261cb58adce8405b49`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `to-ne.prompt.txt` (SHA256 `d68dc89037b44b8b9791258512f07842371aab5309e347c62de96f43dbb8aa0d`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 208% so với ảnh tĩnh (lệch 108%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## to-n

- File: `to-n.png`, **1536×1024**, 1713903 byte, SHA256 `342c9951d2646a8c9acd18e841b7eba3ff126d212f53951d15e86db1e09658ef`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `to-n.prompt.txt` (SHA256 `824068c1cd3a93ea26acd3001da3efb686c9ccf1cb67399fc7a78bdc75a55ea7`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 152% so với ảnh tĩnh (lệch 52%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Lỗi

Không có dòng `LỖI:`.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/hac_thuy_mang/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Hắc Thủy Mãng: turnaround 1536×1024, toA 944×1665, toB 1254×1254, to-ne 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
