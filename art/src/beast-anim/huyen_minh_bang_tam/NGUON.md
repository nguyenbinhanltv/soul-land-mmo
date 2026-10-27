# Huyền Minh Băng Tằm — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species huyen_minh_bang_tam`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `huyen_minh_bang_tam` (Huyền Minh Băng Tằm), họ `worm`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 1794384 byte, SHA256 `be8648504dc81c429f47b2fe329681fa181479126ac891991e8b3f05ffca0693`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-620.
- Prompt: `toA.prompt.txt` (SHA256 `cb0068ee0259d9038e4a3b762bc205ca077abf5ab286fd6901c7570f9e40fa21`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 124% so với ảnh tĩnh (lệch 24%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (se): cỡ thân idle 116% so với ảnh tĩnh (lệch 16%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1791407 byte, SHA256 `48e30f0681ed5a8e21bfd4a0a9471b40411b950c482a698837c7754d8018ca13`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-620.
- Prompt: `toB.prompt.txt` (SHA256 `b4801810e996287e7275609bdd28528c9bc720f839ced6da1a0ee68c081f79f9`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 83% so với ảnh tĩnh (lệch 17%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — s H2 C2-C4 và H3 C2-C4 quay sang phải; H4 die xoay ngang; se/e attack có khung đổi hướng; hurt biên độ nhỏ (mắt)
LỖI: toA — Vẽ lại soul_land_game-651: dùng đủ 3 lượt, RAW nguyên byte ở candidates/toA-redraw651-attempt1–3.*; cả ba s H3 attack xoay phải, H4 die xoay ngang. Chọn lượt 2 tốt nhất để đối chiếu (0 chặn/2 nhẹ); chưa có s mới đạt. Giữ tờ A cũ cho se/e; bản trước vẽ lại ở candidates/toA-before-redraw651.*. Sinh bằng Codex built-in image_gen.imagegen với prompt công cụ nguyên văn, model/seed unknown. (mắt)
LỖI: toB — hurt trùng idle — H5 (n) C5–6 — hurt trùng idle (xor/hợp 0.058 / 0.053): không thấy phản ứng trúng đòn.
LỖI: toB — ne H1-H3 hướng đầu/đuôi chưa rõ, H3 C3 lộ đầu; H4 die quay ngang lộ đầu; n H5-H8 gần s, đầu tối về người xem, H8 C4 die xoay ngang; hurt n gần idle (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/huyen_minh_bang_tam/` | - | image_gen.imagegen | RAW hoạt ảnh Huyền Minh Băng Tằm: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
