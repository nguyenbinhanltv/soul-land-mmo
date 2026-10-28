# Huyền Minh Băng Tằm — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species huyen_minh_bang_tam`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `huyen_minh_bang_tam` (Huyền Minh Băng Tằm), họ `worm`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1469221 byte, SHA256 `f7c1dfd2418624ea29dbd021b0efda43de716f9d2c22fccab000576b8845605e`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `turnaround.prompt.txt` (SHA256 `587aa57bb3baee53d9a028c9029e88d67aaec2363a9c5c053cfe6a1bc40dae58`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **948×1659**, 1794384 byte, SHA256 `be8648504dc81c429f47b2fe329681fa181479126ac891991e8b3f05ffca0693`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `cb0068ee0259d9038e4a3b762bc205ca077abf5ab286fd6901c7570f9e40fa21`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 115% so với ảnh tĩnh (lệch 15%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1791407 byte, SHA256 `48e30f0681ed5a8e21bfd4a0a9471b40411b950c482a698837c7754d8018ca13`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `b4801810e996287e7275609bdd28528c9bc720f839ced6da1a0ee68c081f79f9`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 77% so với ảnh tĩnh (lệch 23%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## to-ne

- File: `to-ne.png`, **1536×1024**, 1684848 byte, SHA256 `c6006a971bcc968901f35da9015e8498eb7ec1d1402ed08db6e413ce26354d5a`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `to-ne.prompt.txt` (SHA256 `06bb5f752386296bb50df9f55365fab53859d5431c20b459c02cf7b567d4f0bc`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 159% so với ảnh tĩnh (lệch 59%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — Legacy s quay phải/die xoay ngang; se/e đã nhập giữ nguyên. Phiên765: s dùng đủ3 lượt mới, lượt1/2 có hai đầu; lượt3 H1 C6 quay lưng, H4 die xoay ngang. Chọn candidates/to-s-765-attempt3.png tốt nhất nhưng vẫn chặn; giữ fallback s. (mắt)
LỖI: toB — hurt trùng idle — H5 (n) C5–6 — hurt trùng idle (xor/hợp 0.058 / 0.053): không thấy phản ứng trúng đòn.
LỖI: toB — Legacy ne/n sai hướng; ne đã thay bằng to-ne. Phiên765: n đủ3 lượt mới vẫn lộ mắt/mặt ở die (lượt1 H4 C3-C4 xoay ngang, lượt2 H4 C2-C4 hai đầu/lộ mặt, lượt3 H4 C4 lộ mắt). Chọn candidates/to-n-765-attempt3.png tốt nhất nhưng vẫn chặn; giữ fallback n. (mắt)
LỖI: to-ne — Phiên765: lượt1 die H4 C3-C4 lộ mặt; lượt2 đạt mọi hàng và đã nhập. MatchSize ×0.794, residual0, trước49.8 px về đích39.5, sheet thực tế40 px so với cũ se43.5/e42 (TB42.75), lệch -6.43%; giữ nguyên RGBA các hướng cũ và normal. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/huyen_minh_bang_tam/` | - | image_gen.imagegen | RAW hoạt ảnh Huyền Minh Băng Tằm: turnaround 1536×1024, toA 948×1659, toB 1254×1254, to-ne 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
