# Quỷ Đằng non — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species quy_dang_non`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `quy_dang_non` (Quỷ Đằng non), họ `vine`, khung game 64×64. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 1889095 byte, SHA256 `b98270cbda021e7bb81b6668eeb2d290eca195e61bdb280fe3398b3efe5c5b32`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: ao-desktop-621.
- Prompt: `toA.prompt.txt` (SHA256 `18808885ca4f072f6c646c3ebfc889aab564858606a0791b53382a2132dbb01c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass, se pass, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1960674 byte, SHA256 `9ab4dd423f1e6549bca3dcb01cbbd9dfc4988fffbbc9423eefc80070d81810ed`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: ao-desktop-621.
- Prompt: `toB.prompt.txt` (SHA256 `a73409416717fde103e24c0bd24242f9f54986b4921995bbcf6bd23b79917b66`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 111% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 118% so với ảnh tĩnh (lệch 18%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — s hurt H1 C5–6 quay chếch; s die H4 C3–4 đổ ngang; se hurt đổi sang e, die còn ngang (mắt)
LỖI: toB — ne và n đều lộ mắt/mặt trong idle/walk/attack/hurt/die, không phải góc lưng; hai khối chưa đạt mỹ thuật (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/quy_dang_non/` | - | image_gen | RAW hoạt ảnh Quỷ Đằng non: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
