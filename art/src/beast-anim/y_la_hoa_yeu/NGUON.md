# Ỷ La Hoa Yêu — RAW hoạt ảnh (#861)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species y_la_hoa_yeu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `y_la_hoa_yeu` (Ỷ La Hoa Yêu), họ `plant`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1819829 byte, SHA256 `1ae8fbabbe6a9c7df02f63ef7e67ce84f144184bd92da5800c05913412b2c3d9`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `turnaround.prompt.txt` (SHA256 `cf17261ed9f467a3345015f3370289a787237f1a61dd362238b8a47335e79ea6`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **1024×1536**, 2046376 byte, SHA256 `3da5e0944f464a72c5cecddef8b9a86ca82f3e4c6fa4d6f99313341c6759701e`.
- Công cụ: image_gen.imagegen (built-in); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toA.prompt.txt` (SHA256 `6c1906f2f7ca82632ff031d2772838e0eac77cfa086fc8cae44849419e2c15e3`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass, se pass, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1994547 byte, SHA256 `ebf7ab2d00254bf15898b2927bb6454214da4d99b87361550bea6c7ff30d5fdc`.
- Công cụ: image_gen.imagegen (built-in); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toB.prompt.txt` (SHA256 `4a907a855c56aa28d9d8f0c4febea94040245178f2d94a3929a7bc2780eae899`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne nhẹ, n pass).
- Duyệt bằng mắt: 3 mục lỗi (dòng `LỖI:` bên dưới).

## to-ne

- File: `to-ne.png`, **1536×1024**, 2000470 byte, SHA256 `fc752a20195269ebc6c7c63fbf0e71614cf4ae63644017a8927f9b2ea64ee150`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `to-ne.prompt.txt` (SHA256 `5e41586220ed109b920afe2ca36e3a92b8af186303eed10665b16285523dd49e`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 194% so với ảnh tĩnh (lệch 94%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — die lệch trục — H4(s) D3 và H8(se) D3 nằm ngang, không theo hướng ngã. (mắt)
LỖI: toB — die lệch trục — H4(ne) D3 và H8(n) D3 nằm ngang, không theo hướng ngã. (mắt)
LỖI: toB — hướng / attack — NE H3 (A0–A2) — thấy chấm mắt nhỏ trên nụ hoa, không phải góc lưng (mắt)
LỖI: toB — hướng / hurt — N H5 (H0–H1) — thân xoay lệch hướng n khi bị đánh (mắt)
LỖI: to-ne — Lô 3: lượt 3 đúng hướng, không lộ mắt; KHÔNG NHẬP vì thân idle mới 68 px so với hướng cũ s=59,se=58,e=56 (lớn hơn 15-21%); giữ fallback ne theo yêu cầu chủ repo. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/y_la_hoa_yeu/` | - | image_gen.imagegen (built-in) | RAW hoạt ảnh Ỷ La Hoa Yêu: toA 1024×1536, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
