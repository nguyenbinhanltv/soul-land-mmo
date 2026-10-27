# Băng Tinh Hạt — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bang_tinh_hat`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bang_tinh_hat` (Băng Tinh Hạt), họ `insect`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **1024×1536**, 2002868 byte, SHA256 `097698a8f11e4d5eaf3f0a6660b932e9e52cb206a84c49b6f9929d0a10ee3510`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: tthoadev.
- Prompt: `toA.prompt.txt` (SHA256 `5751f677678d99fea58c3b3a5a094b82bd5edd1613e4c8b55c7be1f96779f5bc`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 2080923 byte, SHA256 `5ebdb0b3599901ec99dcbb290ae63d90a3ddf7f813eb2131c666abc300dd15a7`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: tthoadev.
- Prompt: `toB.prompt.txt` (SHA256 `36cbf70cb45a586b1465cc08e552d91016e87513a2c4f96bb943f6b0701ef4ce`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 111% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 121% so với ảnh tĩnh (lệch 21%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống — H4 (s) C5, H4 (s) C6, H8 (se) C5, H8 (se) C6 — ô trống có hình (2.55% diện tích ô): hình tràn từ ô bên; ô trống có hình (2.06% diện tích ô): hình tràn từ ô bên; ô trống có hình (6.98% diện tích ô): hình tràn từ ô bên; ô trống có hình (6.85% diện tích ô): hình tràn từ ô bên.
LỖI: toA — hướng / hurt / die — H1 (s) C5–C6; H5 (se) C5–C6; H9 (e) C5–C6: recoil lùi chưa rõ; H4 (s) C4 D3 và H8 (se) C4 D3: nằm ngang, lệch trục hướng (mắt)
LỖI: toB — hướng / hurt / die — H1 (ne) C1–C6: lộ mắt/mặt, không phải góc nhìn sau; H1 (ne) C5–C6 và H5 (n) C5–C6: hurt chưa khác idle, recoil lùi chưa rõ; H5 (n) C1–C6: lộ mắt/mặt, không phải góc nhìn sau; H4 (ne) C4 D3 và H8 (n) C4 D3: nằm ngang/lệch trục hướng (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bang_tinh_hat/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Băng Tinh Hạt: toA 1024×1536; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
