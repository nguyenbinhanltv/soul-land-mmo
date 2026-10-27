# U Linh Hải Mẫu — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species u_linh_hai_mau`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `u_linh_hai_mau` (U Linh Hải Mẫu), họ `float`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 1832402 byte, SHA256 `6910e0a8c4ca0bd56b1b2164829a26d428f0b977fb7d0a66cead8a2eff842e4d`.
- Công cụ: image_gen.imagegen tích hợp Codex; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: tthoadev.
- Prompt: `toA.prompt.txt` (SHA256 `3ed3721b874fb01d440741294dfba19cbdd56e17d78a65879da4feab6b6d4055`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se nhẹ, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1824181 byte, SHA256 `17b7b3d222dbf7a7f261de73b01056024467ef6f3679865ed0e20a9f4da20e67`.
- Công cụ: image_gen.imagegen tích hợp Codex; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: tthoadev.
- Prompt: `toB.prompt.txt` (SHA256 `00974333a6df783f205f6b496d15b59c7dfff4f8e575885606bd8a34c66e7282`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống — H8 (se) C5, H8 (se) C6 — ô trống có hình (3.2% diện tích ô): hình tràn từ ô bên; ô trống có hình (2.68% diện tích ô): hình tràn từ ô bên.
LỖI: toA — die — S H4 D2–3; SE H8 D2–3; E H12 D2–3 — khung cuối ngả ngang, trục không giữ như khung đầu (mắt)
LỖI: toB — die — NE H4 D2–3; N H8 D2–3 — khung cuối ngả ngang, trục không giữ như khung đầu (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/u_linh_hai_mau/` | - | image_gen.imagegen tích hợp Codex | RAW hoạt ảnh U Linh Hải Mẫu: toA 948×1659; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
