# Huyết Nha Cự Sa — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species huyet_nha_cu_sa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `huyet_nha_cu_sa` (Huyết Nha Cự Sa), họ `swim`, khung game 128×128. Mức kiểm chung: **pass**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1557039 byte, SHA256 `520ef6bbe64cf9f6b61fe9ed068ddfbb827c7453d6ffb997bca0dd580a8c8968`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: ao-desktop.
- Prompt: `turnaround.prompt.txt` (SHA256 `2673fad15233753d6820d05a667edeb1c576e830b43ff17c8cf19bd16c7c5ba3`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **1536×1024**, 1660670 byte, SHA256 `0fbadbe812713a85d5863edec0df5ed45d9e0d5b87381e036e0cfd68dc6ea963`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: ao-desktop.
- Prompt: `toA.prompt.txt` (SHA256 `821aa82c4b0bac1801a7cb74ba361a5b92d896137c9ed0011e24a75c1da922a7`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1536×1024**, 1748586 byte, SHA256 `34e86c619b4294e42b3704b529a6fc421fa98aff0e06914878f42d3438491103`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: ao-desktop.
- Prompt: `toB.prompt.txt` (SHA256 `303fe402848feca26a9bcfb5471cf32e671cd5b0d71f28f1341a819246f58024`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: se pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — die khá giống idle, vây rũ biên độ nhỏ (mắt)
LỖI: toA — s — hurt và die biên độ nhỏ (mắt)
LỖI: toB — se — góc chéo nông, attack C2–3 gần nhìn ngang; die biên độ nhỏ (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/huyet_nha_cu_sa/` | - | unknown (công cụ sinh ảnh không công bố) | RAW hoạt ảnh Huyết Nha Cự Sa: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
