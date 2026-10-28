# Độc Cức Đằng — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species doc_cuc_dang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `doc_cuc_dang` (Độc Cức Đằng), họ `vine`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1728927 byte, SHA256 `5516a9a98c5862c9e0b00e1b1d1040dbfeae6b169d348be6cfb11a0eb0291f28`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `turnaround.prompt.txt` (SHA256 `219205102856d0b4e811a3a78f77a81b74641f902da261ea7ff1e4f431cccaa7`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **1024×1536**, 2118893 byte, SHA256 `dbb6abec5daa89cfc40acee8f510dcca545922cc835dbf58332391ba3a4819f1`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `1bbaaf56a2275f19d6098b05c51494211d453f6bd2d93458c685c8627b08b254`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 76% so với ảnh tĩnh (lệch 24%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toD

- File: `toD.png`, **1536×1024**, 2065001 byte, SHA256 `d377caab5beb79f023171014cb4135c14cebf0955f1761aed9d0813094bb40f0`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toD.prompt.txt` (SHA256 `8a3432de189290df930551d3fde44a00917a9471ef3e4f98c408b9ae9a4a4bd1`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 216% so với ảnh tĩnh (lệch 116%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toE

- File: `toE.png`, **1536×1024**, 2004609 byte, SHA256 `be7adf1484a64e229d3d93067831b046beca7d4dfa18ef56ab7e6edea475cc2c`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toE.prompt.txt` (SHA256 `3cc960bcf75a02369a7bad8685c7aaf8476b10c8bef5df8cf8896abd27d566cc`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 199% so với ảnh tĩnh (lệch 99%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### toB (candidates)

- File chọn: `candidates/toB-attempt6.png`, **1254×1254**, SHA256 `13a8944a4b1f5c8d43a4c59c469cdb2673acc90b8d41865616ac25df3c6a96aa`; lượt tìm thấy: 1, 2, 3, 4, 5, 6.
- Số lượt đã dùng: 6; lượt được chọn: 6.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: **chưa duyệt bằng mắt**.

## Lỗi

```text
LỖI: toA — hình ở ô trống — H4 (s) C5, H4 (s) C6, H8 (se) C5, H8 (se) C6 — ô trống có hình (4.06% diện tích ô): hình tràn từ ô bên; ô trống có hình (2.02% diện tích ô): hình tràn từ ô bên; ô trống có hình (18.92% diện tích ô): hình tràn từ ô bên; ô trống có hình (17.92% diện tích ô): hình tràn từ ô bên.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/doc_cuc_dang/` | - | image_gen.imagegen | RAW hoạt ảnh Độc Cức Đằng: turnaround 1536×1024, toA 1024×1536, toD 1536×1024, toE 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
