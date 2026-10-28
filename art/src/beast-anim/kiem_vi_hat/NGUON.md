# Kiếm Vĩ Hạt — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species kiem_vi_hat`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `kiem_vi_hat` (Kiếm Vĩ Hạt), họ `insect`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1672610 byte, SHA256 `55f96992ef5087dfd47d4c4a711f1a2949a81c97729c5861a2984b93e4248c99`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `turnaround.prompt.txt` (SHA256 `67077caabc31b05ad66bc70f1b48548a61538c51335fccb21d22d2b9dac6e9c4`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **948×1659**, 1985681 byte, SHA256 `c72d893d3efe0591c79b2491a67cb075310b22e15f98bc2f475697e75d8629b6`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toA.prompt.txt` (SHA256 `ed10627e34da7b8ed5d6169e17374d285cb8b54db92f960a0551bbd4396e6489`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1983942 byte, SHA256 `e537b8dd806602023c24eb0ccee7c248746c3fd9370fd1315afd8f0225f94c8c`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toB.prompt.txt` (SHA256 `fdb75bba49f9c0ec773620af63a68999504dfc91aa69d53dd22dc25faee4bece`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 78% so với ảnh tĩnh (lệch 22%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 65% so với ảnh tĩnh (lệch 35%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## to-n

- File: `to-n.png`, **1536×1024**, 1921139 byte, SHA256 `b9a64b62c255f40bae7e8bb2d171dac2fb2fcb7f96cd8471d076a46b247cbc96`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `to-n.prompt.txt` (SHA256 `53330aeb71f37a7ad51a582f5cb62aa697f40b99b9d8b24dfb3fd7b3f14f9822`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 121% so với ảnh tĩnh (lệch 21%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### to-ne (candidates)

- File chọn: `candidates/to-ne-attempt6.png`, **1536×1024**, SHA256 `28f4c5f5ca9a38b74b5216889249bc494aa0af875acb6556106125a1505da64b`; lượt tìm thấy: 1, 2, 3, 4, 5, 6.
- Số lượt đã dùng: 6; lượt được chọn: 6.
- Mức kiểm: **chặn** (CHẶN: không vào thư mục chính).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống — H8 (se) C5, H8 (se) C6 — ô trống có hình (0.9% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.14% diện tích ô): hình tràn từ ô bên.
LỖI: toA — pose/hướng — S H1 C5–6, SE H5 C5–6, E H9 C5–6 — hurt chưa thể hiện rõ lùi dọc hướng; S H4 C4 và SE H8 C4 — die nằm ngang, lệch trục hướng (mắt)
LỖI: toB — hướng/pose — NE H1–H4 nghiêng về lower-right và lộ mặt thay vì quay lưng upper-right; N H5–H8 là chính diện/lộ mặt thay vì lưng — hurt NE H1 C5–6 và N H5 C5–6 chưa lùi rõ; die NE H4 C4 và N H8 C4 nằm ngang, lệch hướng (mắt)
LỖI: to-ne — sai số hình / hình ở ô trống — H1 (ne), H3 (ne), H4 (ne) C5 — dải có 5 hình, cần 6: thiếu khung; dải có 5 hình, cần 6: thiếu khung; ô trống có hình (1.27% diện tích ô): hình tràn từ ô bên.
LỖI: to-ne — ne — hết 3 lượt; die C2–C4 quay ngang/lộ mắt; giữ fallback. (mắt)
LỖI: to-ne — ne — hết 3 lượt bổ sung (tổng 6): lượt 4 chết xoay ngang; lượt 5–6 thiếu khung hàng 1/attack và die lộ mặt. candidates/to-ne-attempt4–6.*; giữ fallback. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/kiem_vi_hat/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Kiếm Vĩ Hạt: turnaround 1536×1024, toA 948×1659, toB 1254×1254, to-n 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
