# Thanh Lân Xà — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thanh_lan_xa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thanh_lan_xa` (Thanh Lân Xà), họ `snake`, khung game 64×64. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 1759277 byte, SHA256 `b065e54968f78f0f60d7bcd159bf2e4fd65d31717c475989f5aec68623aef39b`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-630; chọn A2/3: ít cảnh báo và gần thiết kế gốc hơn A3; A1/A3 trong candidates.
- Prompt: `toA.prompt.txt` (SHA256 `dcfc9f5c9e81300440053b8cfa83a993a458a17049dbfc9be1282ca145edbcb8`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 63% so với ảnh tĩnh (lệch 37%, quá 25%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (se): cỡ thân idle 78% so với ảnh tĩnh (lệch 22%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1678124 byte, SHA256 `b9650bb838a1dfe86d0f216212725a8e6502eae0d992f0760376e0b6233236d2`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-630; chọn A2/3: ít cảnh báo và gần thiết kế gốc hơn A3; A1/A3 trong candidates.
- Prompt: `toB.prompt.txt` (SHA256 `bf7587f5aa0aa27dc3588405599a7eef7febc8145b30afcf7263e69f68f29b43`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hướng — s H2–H4 — walk hơi nghiêng phải, attack quay phải, die nằm ngang; se gần e (mắt)
LỖI: toA — pose — H1 H5 H9 C5–6 — hurt quay đầu (mắt)
LỖI: toB — chân lệch — H3 (ne) C4, H7 (n) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 14%); chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 14%).
LỖI: toB — hướng — ne H1–H4, n H5–H8 — lộ mặt; attack đổi hướng, die nằm ngang; hurt quay đầu (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thanh_lan_xa/` | - | image_gen.imagegen | RAW hoạt ảnh Thanh Lân Xà: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
