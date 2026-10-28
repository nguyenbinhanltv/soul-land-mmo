# Thực Nhân Hoa — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thuc_nhan_hoa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thuc_nhan_hoa` (Thực Nhân Hoa), họ `plant`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 2037422 byte, SHA256 `21097d3ed4ff4541d03a5a458b674eb53a860e20a1c34e88d4bcb06ed970e766`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `turnaround.prompt.txt` (SHA256 `9ff8c3332d3df43ce419dbbc67c0bc0ce9116b0c437d813106dcbe6340ba5c43`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **1024×1536**, 2378915 byte, SHA256 `2aebc43fbcc9e690441a731f9fcd018dd01878bc0c3ed0427783542168c5b055`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toA.prompt.txt` (SHA256 `684c640a0d4ca8d11346ff78a3d076eb8db7decfa5039d892287c1814883336a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 86% so với ảnh tĩnh (lệch 14%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toD

- File: `toD.png`, **1536×1024**, 2140314 byte, SHA256 `c69983daf8f86f7e0eb69bc75d290fdd6a56567118225cf1ca8cb611be0891fb`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toD.prompt.txt` (SHA256 `7cd4f792a73f0792f64c463f2ca7390e257a4845c1e98a7c0c0c23a725d37217`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 151% so với ảnh tĩnh (lệch 51%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toE

- File: `toE.png`, **1536×1024**, 2162265 byte, SHA256 `f0de3e546272623785d2c915506234a0b80ba5d48807babbe564b377d5615794`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toE.prompt.txt` (SHA256 `f4c3f68c2399d690bdea6bc4c7dda38c1fa6053531b42946b0f9678e5e53742f`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 149% so với ảnh tĩnh (lệch 49%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### toB (candidates)

- File chọn: `candidates/toB-attempt3.png`, **1254×1254**, SHA256 `bf75971d591f19d7252abaddd60081c39f8e470788870d201219a6a26143adb7`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **nhẹ**.
- Duyệt bằng mắt: **chưa duyệt bằng mắt**.

## Lỗi

```text
LỖI: toD — nhập — sau cắt — RAW không chặn, giữ hướng; cutter mặc định còn vuot-khung-he-so trước neo cỡ, chưa nhập (mắt)
LỖI: toE — nhập — sau cắt — RAW không chặn, giữ hướng; cutter mặc định còn vuot-khung-he-so trước neo cỡ, chưa nhập (mắt)
LỖI: toB — hình ở ô trống — H4 (ne) C5, H4 (ne) C6 — ô trống có hình (5.09% diện tích ô): hình tràn từ ô bên; ô trống có hình (5.09% diện tích ô): hình tràn từ ô bên.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thuc_nhan_hoa/` | - | Codex image_gen.imagegen | RAW hoạt ảnh Thực Nhân Hoa: turnaround 1536×1024, toA 1024×1536, toD 1536×1024, toE 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
