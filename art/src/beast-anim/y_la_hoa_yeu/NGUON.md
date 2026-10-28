# Ỷ La Hoa Yêu — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species y_la_hoa_yeu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `y_la_hoa_yeu` (Ỷ La Hoa Yêu), họ `plant`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1819829 byte, SHA256 `1ae8fbabbe6a9c7df02f63ef7e67ce84f144184bd92da5800c05913412b2c3d9`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `turnaround.prompt.txt` (SHA256 `a51c347f51b981b0d39eb3ca23f87c4c37a4c78316ccc5dd573b27a864dcc516`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **1024×1536**, 2046376 byte, SHA256 `3da5e0944f464a72c5cecddef8b9a86ca82f3e4c6fa4d6f99313341c6759701e`.
- Công cụ: image_gen.imagegen (built-in); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toA.prompt.txt` (SHA256 `9d746d65a64d7ac6ea6aed43a64ccb0b8e31bb77154474d05a48c8317b1bfc30`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass, se pass, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1994547 byte, SHA256 `ebf7ab2d00254bf15898b2927bb6454214da4d99b87361550bea6c7ff30d5fdc`.
- Công cụ: image_gen.imagegen (built-in); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toB.prompt.txt` (SHA256 `64c64a51f5ea4429b27f522900eb95a5c76b6cfb3aeef4e64fa5cd462ddd7681`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne nhẹ, n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## to-ne

- File: `to-ne.png`, **1536×1024**, 2000470 byte, SHA256 `fc752a20195269ebc6c7c63fbf0e71614cf4ae63644017a8927f9b2ea64ee150`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `to-ne.prompt.txt` (SHA256 `ba3b139782d9dff9f86a1c634e35545707e4ec9076c0ecdb137c72578a9317ee`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 194% so với ảnh tĩnh (lệch 94%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — die lệch trục — H4(s) D3 và H8(se) D3 nằm ngang; giữ hướng đã nhập trước. (mắt)
LỖI: toB — legacy: die lệch trục ne/n; ne attack thấy chấm mắt, n hurt xoay thân; ne dùng tờ to-ne mới. (mắt)
LỖI: to-ne — Đã nhập ne sau matchSize: trước 67.9 px, đích legacy 57.6 px, factor 0.848, residual 0; sheet game ne=58 px so với cũ s=59,se=58,e=56,n=57; giữ nguyên RGBA hướng cũ và normal map. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/y_la_hoa_yeu/` | - | image_gen.imagegen | RAW hoạt ảnh Ỷ La Hoa Yêu: turnaround 1536×1024, toA 1024×1536, toB 1254×1254, to-ne 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
