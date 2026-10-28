# Băng Bích Hạt — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bang_bich_hat`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bang_bich_hat` (Băng Bích Hạt), họ `insect`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1789973 byte, SHA256 `406de252c919acbd1d33f8297aaee31dbe44f29a22a5f93832aaca1d9ffbaf07`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `turnaround.prompt.txt` (SHA256 `8afcb2f44b567764c914b6c1d8fbbee1c83355128b68f278fd0842152bbffafe`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **948×1659**, 2081450 byte, SHA256 `dc233ba40a30ffd7cc90625f6cadf8177c98b01be29580dcf7709f6249e9da67`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toA.prompt.txt` (SHA256 `5867686affdffb4837eb0e8b4c5b2b1d4b1d354e7807b02ba56e15f2c91173e6`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se nhẹ, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (se): cỡ thân idle 112% so với ảnh tĩnh (lệch 12%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 2152524 byte, SHA256 `8535c53765a2f3d0226d37f8131c8a0bb50aaa74717ad11fd1323060d81b467a`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toB.prompt.txt` (SHA256 `0ec692017c562e451c714ce0a90535bcffb373cb1509be3605a8b40584ba4bec`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## to-ne

- File: `to-ne.png`, **1536×1024**, 2012745 byte, SHA256 `8b1fa21a86b104bbccd835545b54cc416f521ab77d89d6a4871d55907e95c844`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `to-ne.prompt.txt` (SHA256 `146a8c4d537fefc5695093b800d7a8dbde80354785436f6016dab38e17961410`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 188% so với ảnh tĩnh (lệch 88%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## to-n

- File: `to-n.png`, **1536×1024**, 2009435 byte, SHA256 `d284ffe8fbf3f99184d154dbb93f3ef27af84917db67a255fc1ea59f07233f0d`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `to-n.prompt.txt` (SHA256 `e08fa2ac6ee9c738598c120278ea15bca51ff2df55df9e9c6991bf97076b605c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 199% so với ảnh tĩnh (lệch 99%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — Giữ nguyên hướng cũ s/se/e: hurt biên độ nhỏ; die s/se lệch trục như hồ sơ cũ. (mắt)
LỖI: toB — Legacy ne/n lộ mặt; hai hướng này đã thay bằng to-ne/to-n mới. (mắt)
LỖI: to-ne — Ghi chú kỹ thuật: đã nhập sau matchSize ×0.869, residual 0, thân mới 51 px so với cũ s=48,se=57,e=49 (TB51.33); lệch -0.65%. Hướng cũ và normal giữ nguyên RGBA. (mắt)
LỖI: to-n — Ghi chú nhẹ: die hạ thân, cụp đuôi, không xoay mặt; matchSize ×0.776, residual 0, thân mới 51 px so với TB cũ51.33; lệch -0.65%; đã nhập. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bang_bich_hat/` | - | image_gen.imagegen | RAW hoạt ảnh Băng Bích Hạt: turnaround 1536×1024, toA 948×1659, toB 1254×1254, to-ne 1536×1024, to-n 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
