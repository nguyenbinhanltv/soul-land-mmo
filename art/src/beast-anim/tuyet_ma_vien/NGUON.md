# Tuyết Ma Viên — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species tuyet_ma_vien`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `tuyet_ma_vien` (Tuyết Ma Viên), họ `quad`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1895356 byte, SHA256 `d7648b8e3ab614be335a188611307d353740a00c4de789e4d48ebe323c588097`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-764.
- Prompt: `turnaround.prompt.txt` (SHA256 `6022990d0eb7fb85fe91c6197054acd5e5ae41578c4907f17bb8008116789c46`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **1024×1536**, 2389382 byte, SHA256 `ed127a739e06fe5826343960244fb32eb38eae931c4e80b7c0523935c46bde82`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: soul_land_game-764.
- Prompt: `toA.prompt.txt` (SHA256 `c83e7ab7dcd0896fece480f91ee6e7048badd8428e324a0d44ad6250051f0b79`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 90% so với ảnh tĩnh (lệch 10%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 2281629 byte, SHA256 `4389ecefb5c6517efd9c442bdacf1c0ab4a05943d9ea47a697a4ef8507d66d98`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: soul_land_game-764.
- Prompt: `toB.prompt.txt` (SHA256 `a506b32fae7f6136a028fbb3c7d4fafba48a91edd19b5bc9b21241b3480427a0`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 117% so với ảnh tĩnh (lệch 17%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## to-n

- File: `to-n.png`, **1536×1024**, 2171793 byte, SHA256 `32e779462d0934a4d0dc83333347f42230bb043c6e0e5f69f883d14ea6f2e6ca`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-764.
- Prompt: `to-n.prompt.txt` (SHA256 `eadc4533f25f20608afefd67448b5bb5f12d5f47b6567401a2fc97be37759266`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 230% so với ảnh tĩnh (lệch 130%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Lỗi

```text
LỖI: to-n — hình ở ô trống — H4 (n) C5, H4 (n) C6 — ô trống có hình (2.16% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.92% diện tích ô): hình tràn từ ô bên.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/tuyet_ma_vien/` | - | image_gen.imagegen | RAW hoạt ảnh Tuyết Ma Viên: turnaround 1536×1024, toA 1024×1536, toB 1254×1254, to-n 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
