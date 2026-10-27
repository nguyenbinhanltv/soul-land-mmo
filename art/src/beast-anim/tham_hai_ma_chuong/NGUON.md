# Thâm Hải Ma Chương — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species tham_hai_ma_chuong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `tham_hai_ma_chuong` (Thâm Hải Ma Chương), họ `float`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **1024×1536**, 2079382 byte, SHA256 `30cbcb1da4f7cd9c403098cce2006e1c428539c325ab17efc50e8de18ac5d9fd`.
- Công cụ: Codex built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul-land-mmo-143.
- Prompt: `toA.prompt.txt` (SHA256 `8b86467d1c2a147985092e84ef9fee6737d83faac3c5f6231f56e4b8bfefed6a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se nhẹ, e nhẹ).
- Duyệt bằng mắt: 3 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 2126440 byte, SHA256 `26f78a7ade4f2d3b6338e3565010afa16c6855f349aec36c5542d36dede006dc`.
- Công cụ: Codex built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul-land-mmo-143.
- Prompt: `toB.prompt.txt` (SHA256 `14636ae5db8611c48b76409c2fef6a8dc878ae4e1dbab1920c71a1074e6124ff`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 112% so với ảnh tĩnh (lệch 12%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 112% so với ảnh tĩnh (lệch 12%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 3 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — chân lệch — H7 (se) C3–4, H11 (e) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 14%); chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 15%).
LỖI: toA — HURT recoil yếu — H1 (s) C5-C6, H5 (se) C5-C6, H9 (e) C5-C6; phản ứng gần idle (mắt)
LỖI: toA — SE gần E — idle H5 (se) so với H9 (e), silhouette IoU 0.824; hướng khác nhau chưa rõ (mắt)
LỖI: toA — ghi chú mismatch validator — H7 (se) C3-C4 và H11 (e) C4 bị gọi chân lệch nhưng loài float không có chân/rễ/nền; giữ finding tool, không sửa validator (mắt)
LỖI: toB — mặt/mắt lộ — NE H1-H4 và N H5-H8, gồm cả hurt/die; prompt yêu cầu không thấy mặt ở hai hướng sau (mắt)
LỖI: toB — HURT recoil yếu — H1 (NE) C5-C6 và H5 (n) C5-C6; phản ứng gần idle (mắt)
LỖI: toB — DIE D3 bị ép ngang — H4 (NE) C4 và H8 (n) C4; hướng sink theo trục nhìn chưa rõ (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/tham_hai_ma_chuong/` | - | Codex built-in image_gen.imagegen | RAW hoạt ảnh Thâm Hải Ma Chương: toA 1024×1536, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
