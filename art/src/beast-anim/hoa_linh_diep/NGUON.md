# Hỏa Linh Điệp — RAW hoạt ảnh (#1277)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species hoa_linh_diep`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `hoa_linh_diep` (Hỏa Linh Điệp), họ `fly`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1546013 byte, SHA256 `027ce6b09fb8d9984e3f33a9f66962a8f4811e0c6e9553c4fcece2a564d74a75`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 2; phiên: soul_land_game-797.
- Prompt: `turnaround.prompt.txt` (SHA256 `c9210b3f7b774426b228b56218206c5e92e8c070dd620d3fd211e55f2eac5cbf`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toA

- File: `toA.png`, **948×1659**, 1817770 byte, SHA256 `3b60db782152ddf21b8cf5ddc6118036076d3621d717815cbcb7a4bc4766b7b3`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-797.
- Prompt: `toA.prompt.txt` (SHA256 `809ebdc078f99fd53c5f7f0a7e2e77eafdbb3e04f9fbc33fdf66914076a7536a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 75% so với ảnh tĩnh (lệch 25%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1823213 byte, SHA256 `bdc53cf7d257d771e3a9045dd506c711165b9f949ef8357e7e5045d5e42a4dab`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-797.
- Prompt: `toB.prompt.txt` (SHA256 `549566dada9be080e89563a2a0287425ab57dc2f80931ebd6416d575d32f5903`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne nhẹ, n pass).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## to-ne

- File: `to-ne.png`, **1536×1024**, 1651145 byte, SHA256 `384a502f066db92e93691f27ae9667a5988bcc35c15729c612f7e70c2cabe246`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-797.
- Prompt: `to-ne.prompt.txt` (SHA256 `9eb56ceca3dd31de86284629a5d32f0eb569810ed3391cacfdc5f327112e0364`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 157% so với ảnh tĩnh (lệch 57%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — chân lệch / hình ở ô trống — H1 (s) C2, H8 (se) C5, H8 (se) C6, H11 (e) C3 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%); ô trống có hình (1.68% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.2% diện tích ô): hình tràn từ ô bên; chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 21%).
LỖI: toA — Lịch sử trước vòng 2 phiên797: chân lệch / hình ở ô trống — H1 (s) C2, H8 (se) C5, H8 (se) C6, H11 (e) C3 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%); ô trống có hình (1.68% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.2% diện tích ô): hình tràn từ ô bên; chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 21%). (mắt)
LỖI: toA — Lịch sử trước vòng 2 phiên797: Lịch sử trước phiên 778 (hướng mới theo tờ to-<hướng>): Legacy giữ nguyên: e còn gần se; s die chưa rõ trục; hurt biên độ nhỏ. (mắt) (mắt)
LỖI: toB — Lịch sử trước vòng 2 phiên797: Lịch sử trước phiên 778 (hướng mới theo tờ to-<hướng>): Legacy ne attack/die lộ mặt; n đã nhập theo manifest và giữ nguyên. (mắt) (mắt)
LỖI: toB — Lịch sử trước vòng 2 phiên797: Lịch sử trước phiên 778 (hướng mới theo tờ to-<hướng>): Phiên765: turnaround mới đạt ở lượt2 (lượt1 ne/die lộ mắt). ne dùng đủ3 lượt mới; cả3 vẫn có mắt/mặt ở attack/die, lượt3 còn quay mặt nhiều hơn. Chọn candidates/to-ne-765-attempt2.png ít lỗi nhất; vẫn chặn mắt, không nhập ne; giữ dirsOk s,se,e,n. Không dùng tờ hướng lỗi làm tham chiếu. (mắt) (mắt)
LỖI: to-ne — Lịch sử trước vòng 2 phiên797: Phiên 778: thêm 3 lượt, chọn RAW lượt 1 ít lỗi nhất; lượt 1 attack C3-C4 vẫn có chấm mắt, lượt 2 và 3 lộ mắt/mặt nhiều hơn; giữ fallback ne. (mắt) (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/hoa_linh_diep/` | - | image_gen.imagegen | RAW hoạt ảnh Hỏa Linh Điệp: turnaround 1536×1024, toA 948×1659, toB 1254×1254, to-ne 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
