# Bích Lân Xà — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bich_lan_xa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bich_lan_xa` (Bích Lân Xà), họ `snake`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **944×1667**, 1820498 byte, SHA256 `0d42a628ac4ad315b41e4734c56eab587b80571301a4bfc650ecfed7f60b446d`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-616; hồ sơ dọn bởi 630; chọn A2/3; bỏ candidate A2 trùng byte, A1/A3 không còn prompt thật.
- Prompt: `toA.prompt.txt` (SHA256 `9b8b212294c04fa4eba338768f58bf91aaf157aab5ad0d3daa0a3e3e3d133df7`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 81% so với ảnh tĩnh (lệch 19%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 124% so với ảnh tĩnh (lệch 24%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 3 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1940124 byte, SHA256 `5c7f121364422441ea81b8260a8d14d227edf03faa22d2164e8d6f38f4db2c65`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-616; hồ sơ dọn bởi 630; chọn A2/3; bỏ candidate A2 trùng byte, A1/A3 không còn prompt thật.
- Prompt: `toB.prompt.txt` (SHA256 `6b21777ee7c145e945e2853404834913f694339e7c07cbdb95f7f6e029d51730`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hướng — s H2–H4 — walk và attack đổi hướng, die nằm ngang; se gần e (mắt)
LỖI: toA — pose — H1 H5 H9 C5–6 — hurt quay đầu và lộ bụng (mắt)
LỖI: toA — Vẽ lại soul_land_game-651: đủ 3 lượt ở candidates/toA-redraw651-attempt1–3.*; lượt 1 không chặn kỹ thuật nhưng s attack quay phải, die nằm ngang; lượt 2 thiếu khung attack cả ba hướng; lượt 3 s attack còn đổi hướng, die nằm ngang. Giữ toA cũ cho se/e, không có s mới đạt; bản trước vẽ lại ở candidates/toA-before-redraw651.*. Model/seed unknown; sinh bằng Codex built-in image_gen.imagegen, prompt công cụ nguyên văn. (mắt)
LỖI: toB — hướng — ne H1–H4, n H7–H8 — lộ mặt; die nằm ngang, hurt xoay đầu (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bich_lan_xa/` | - | unknown (công cụ sinh ảnh không công bố) | RAW hoạt ảnh Bích Lân Xà: toA 944×1667, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
