# Băng Bích Hạt — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bang_bich_hat`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bang_bich_hat` (Băng Bích Hạt), họ `insect`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 2081450 byte, SHA256 `dc233ba40a30ffd7cc90625f6cadf8177c98b01be29580dcf7709f6249e9da67`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: tthoadev.
- Prompt: `toA.prompt.txt` (SHA256 `c8f89491f216989c415890c514a8d37e260c14f71d4a1374385fc83109bd4bf4`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se nhẹ, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (se): cỡ thân idle 116% so với ảnh tĩnh (lệch 16%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 2152524 byte, SHA256 `8535c53765a2f3d0226d37f8131c8a0bb50aaa74717ad11fd1323060d81b467a`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: tthoadev.
- Prompt: `toB.prompt.txt` (SHA256 `4a6d4cc93b286b9fbae5628550bd2f08633d4d5b2105fe980ad8742c546ed88a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Duyệt bằng mắt: 4 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hướng / hurt — H1,H5,H9 C5–C6 — recoil lùi chưa rõ (mắt)
LỖI: toA — hướng / die — H4 (s) C4 D3; H8 (se) C4 D3 — nằm ngang, lệch trục hướng (mắt)
LỖI: toB — hướng — H1–H4 (NE) — lộ mặt thay vì góc lưng ba phần tư, kể cả hurt H1 C5–C6 (mắt)
LỖI: toB — hướng — H5–H8 (N) — lộ mặt/mắt ở mọi hàng, kể cả hurt H5 C5–C6 (mắt)
LỖI: toB — hurt — H1 (NE) C5–C6; H5 (N) C5–C6 — recoil lùi chưa rõ so với idle (mắt)
LỖI: toB — die / hướng — H4 (NE) C4 D3; H8 (N) C4 D3 — thân nằm ngang, không giữ trục hướng (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bang_bich_hat/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Băng Bích Hạt: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
