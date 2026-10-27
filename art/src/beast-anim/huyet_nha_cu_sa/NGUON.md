# Huyết Nha Cự Sa — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species huyet_nha_cu_sa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `huyet_nha_cu_sa` (Huyết Nha Cự Sa), họ `swim`, khung game 128×128. Mức kiểm chung: **nhẹ**.

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
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 120% so với ảnh tĩnh (lệch 20%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1536×1024**, 1748586 byte, SHA256 `34e86c619b4294e42b3704b529a6fc421fa98aff0e06914878f42d3438491103`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: ao-desktop.
- Prompt: `toB.prompt.txt` (SHA256 `303fe402848feca26a9bcfb5471cf32e671cd5b0d71f28f1341a819246f58024`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: se pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toC

- File: `toC.png`, **1536×1024**, 1691183 byte, SHA256 `f88845cb17298490fb2f963cbb56c24c53804ce4aadf34a967c5367808fa0492`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: ao-desktop.
- Prompt: `toC.prompt.txt` (SHA256 `98c2f760a718ebb411c9f423ba58ce892534fe1c64817b65d5b8d1d2266ec8d4`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: e nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toD

- File: `toD.png`, **1536×1024**, 1696869 byte, SHA256 `8d3e51b8bb305d57959a1bf1d94ae24a2ca512513c5fac06a9466a041978a349`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: ao-desktop.
- Prompt: `toD.prompt.txt` (SHA256 `f7ba0e60c0f09b62f07224538b70c4d31f67e53817905e96bfa7e3dc7b541d3f`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — die khá giống idle, vây rũ biên độ nhỏ (mắt)
LỖI: toA — s — hurt và die biên độ nhỏ (mắt)
LỖI: toB — se — góc chéo nông, attack C2–3 gần nhìn ngang; die biên độ nhỏ (mắt)
LỖI: toC — chân lệch — H4 (e) C1 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%).
LỖI: toC — e — hurt và attack đỉnh chếch lên; die gần idle (mắt)
LỖI: toD — ne — nghi chấm mắt sát mép đầu ở vài khung; hurt/die nhỏ, die cuối hơi ngang (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/huyet_nha_cu_sa/` | - | unknown (công cụ sinh ảnh không công bố) | RAW hoạt ảnh Huyết Nha Cự Sa: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
