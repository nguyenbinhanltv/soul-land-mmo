# Kiếm Vĩ Hạt — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species kiem_vi_hat`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `kiem_vi_hat` (Kiếm Vĩ Hạt), họ `insect`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 1985681 byte, SHA256 `c72d893d3efe0591c79b2491a67cb075310b22e15f98bc2f475697e75d8629b6`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: tthoadev.
- Prompt: `toA.prompt.txt` (SHA256 `7fb43cd1004c9ef6e2e2569d507a35708ff233480d5de22955cc5bd1f0fa9385`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (se): cỡ thân idle 119% so với ảnh tĩnh (lệch 19%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 119% so với ảnh tĩnh (lệch 19%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1983942 byte, SHA256 `e537b8dd806602023c24eb0ccee7c248746c3fd9370fd1315afd8f0225f94c8c`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: tthoadev.
- Prompt: `toB.prompt.txt` (SHA256 `03f95bbd218de5fc60b2dad45f8c8aa91fdd7ef94c789ebbc6aa10036f4a7563`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 86% so với ảnh tĩnh (lệch 14%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 71% so với ảnh tĩnh (lệch 29%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống — H8 (se) C5, H8 (se) C6 — ô trống có hình (0.9% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.14% diện tích ô): hình tràn từ ô bên.
LỖI: toA — pose/hướng — S H1 C5–6, SE H5 C5–6, E H9 C5–6 — hurt chưa thể hiện rõ lùi dọc hướng; S H4 C4 và SE H8 C4 — die nằm ngang, lệch trục hướng (mắt)
LỖI: toB — hướng/pose — NE H1–H4 nghiêng về lower-right và lộ mặt thay vì quay lưng upper-right; N H5–H8 là chính diện/lộ mặt thay vì lưng — hurt NE H1 C5–6 và N H5 C5–6 chưa lùi rõ; die NE H4 C4 và N H8 C4 nằm ngang, lệch hướng (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/kiem_vi_hat/` | - | image_gen.imagegen | RAW hoạt ảnh Kiếm Vĩ Hạt: toA 948×1659; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
