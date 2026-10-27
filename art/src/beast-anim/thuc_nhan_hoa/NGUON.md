# Thực Nhân Hoa — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thuc_nhan_hoa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thuc_nhan_hoa` (Thực Nhân Hoa), họ `plant`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **1024×1536**, 2378915 byte, SHA256 `2aebc43fbcc9e690441a731f9fcd018dd01878bc0c3ed0427783542168c5b055`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-634.
- Prompt: `toA.prompt.txt` (SHA256 `ada889f5b3ea6f7e8262117d7a365893436b23cdbb670c3f54ae8be938d7d46c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 116% so với ảnh tĩnh (lệch 16%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (se): cỡ thân idle 111% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 2228901 byte, SHA256 `db228a8a1653aaec6928d3ab3516819718b76cf3c319b9b456f2522bac43ba88`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-634.
- Prompt: `toB.prompt.txt` (SHA256 `1e349f097e713ee439858d8a8e8ed8445ee60348367227f714809e579debda07`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 84% so với ảnh tĩnh (lệch 16%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hướng — s attack H3 quay phải; se gần e; attack H7/H11 C6 và die quay về phía người xem, hurt nâng miệng thay vì chỉ lùi dọc hướng; chọn A2 đạt kỹ thuật, A1 chặn lưới ở candidates (mắt)
LỖI: toB — hình ở ô trống — H4 (ne) C5, H4 (ne) C6 — ô trống có hình (4.08% diện tích ô): hình tràn từ ô bên; ô trống có hình (3.54% diện tích ô): hình tràn từ ô bên.
LỖI: toB — hướng — ne H1-H4 nhìn ngang và lộ miệng, H3 C3 há miệng rõ; n H6-H8 quay ngang lộ miệng, hurt cũng lệch; không nhập ne/n trước khi duyệt; lượt B1 không chặn kỹ thuật (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thuc_nhan_hoa/` | - | Codex image_gen.imagegen | RAW hoạt ảnh Thực Nhân Hoa: toA 1024×1536; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
