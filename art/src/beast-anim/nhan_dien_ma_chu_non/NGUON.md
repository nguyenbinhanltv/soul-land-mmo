# Nhân Diện Ma Chu non — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species nhan_dien_ma_chu_non`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `nhan_dien_ma_chu_non` (Nhân Diện Ma Chu non), họ `insect`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **941×1672**, 1824749 byte, SHA256 `8f598d5be90f11116483f7c418067af39620c86b720b7a47bc15e3cbcba43f76`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: ao-desktop-621.
- Prompt: `toA.prompt.txt` (SHA256 `9f9745cc8383778c3319ed11279889d147d27d21c45732853f3e221b5aa0da48`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1863075 byte, SHA256 `bb2b22367dbfa158b4dd97aba5b8ea1af4c37a360caae8c017b76a388691d3a1`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: ao-desktop-621.
- Prompt: `toB.prompt.txt` (SHA256 `56d418f5d1571de2e92308aa172781e16e7ab6062434c29f59214d9cde3103f2`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — chân lệch — H3 (s) C3–4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 16%).
LỖI: toA — s hurt H1 C5 đổi hướng; e còn chếch, attack H11 C1–4 và die H12 quay mặt về người xem (mắt)
LỖI: toB — ne gần e, attack/die lộ mặt; n hurt/attack/die quay mặt, chưa đạt nhập các khối này (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/nhan_dien_ma_chu_non/` | - | image_gen | RAW hoạt ảnh Nhân Diện Ma Chu non: toA 941×1672, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
