# Nhân Diện Ma Chu non — RAW hoạt ảnh (#1277)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species nhan_dien_ma_chu_non`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `nhan_dien_ma_chu_non` (Nhân Diện Ma Chu non), họ `insect`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1520176 byte, SHA256 `771c0708633bcc3cbab0522521e73ce26870785c3c8da79a79d69be280081dde`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: chưa khai báo; phiên: soul_land_game-797.
- Prompt: `turnaround.prompt.txt` (SHA256 `9202ea66a63b59df4da276c49d3c99105af467128ee6b4b43c31ce15587fc08d`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **941×1672**, 1824749 byte, SHA256 `8f598d5be90f11116483f7c418067af39620c86b720b7a47bc15e3cbcba43f76`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: chưa khai báo; phiên: soul_land_game-797.
- Prompt: `toA.prompt.txt` (SHA256 `81ec02444bd7dbffcda8df8e90a651956199ad105090604752ca736fcf7eca21`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1863075 byte, SHA256 `bb2b22367dbfa158b4dd97aba5b8ea1af4c37a360caae8c017b76a388691d3a1`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: chưa khai báo; phiên: soul_land_game-797.
- Prompt: `toB.prompt.txt` (SHA256 `1b8829943e294bcd7f95e41b5e2654f23f4c6858ee0dbcd14439a5004be87a96`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne nhẹ, n nhẹ).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## to-ne

- File: `to-ne.png`, **1536×1024**, 1808179 byte, SHA256 `cbad4c3c31d92f102cce5e8fd06f8d38659a098f9508142a5c736e5e76285b02`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 3; phiên: soul_land_game-797.
- Prompt: `to-ne.prompt.txt` (SHA256 `37d11b89fff8649fa6bcfd6645fb2f1650de1c9a7cca9892f3138f8e8cd0aec1`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 235% so với ảnh tĩnh (lệch 135%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## to-n

- File: `to-n.png`, **1536×1024**, 1987913 byte, SHA256 `6d0f311048aaaea985f045681fb85a7369745b88a8da191b973491f2bdb0dc3c`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 3; phiên: soul_land_game-797.
- Prompt: `to-n.prompt.txt` (SHA256 `d81bc43b7789af1ec6281c3749f2ffe22c510815c7ac1462070d709a13441a78`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 276% so với ảnh tĩnh (lệch 176%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — Lịch sử trước vòng 2 phiên797: giải phẫu — mọi cột — chỉ thấy ba cặp chân và mặt nổi; hết 2 lượt, không dùng làm tham chiếu, chưa sinh ne/n (mắt) (mắt)
LỖI: toA — chân lệch — H3 (s) C3–4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 16%).
LỖI: toA — Lịch sử trước vòng 2 phiên797: chân lệch — H3 (s) C3–4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 16%). (mắt)
LỖI: to-ne — LỊCH SỬ LƯỢT (bản cuối ĐẠT) — Vòng2 phiên797 lượt 1/3: thiếu cặp chân thứ tư; RAW candidates/to-ne-797-attempt1.png; SHA256 ee901f9668a02cdf1fa4fadb7479ea94321ca2a90c0f1e08a5faa54084678b9c (mắt)
LỖI: to-ne — LỊCH SỬ LƯỢT (bản cuối ĐẠT) — Vòng2 phiên797 lượt 2/3: vẫn thiếu cặp chân thứ tư; RAW candidates/to-ne-797-attempt2.png; SHA256 838afb4fe0569075d05be0142948549065c341eec6d4be56071b4e1f3a802f2f (mắt)
LỖI: to-n — LỊCH SỬ LƯỢT (bản cuối ĐẠT) — Vòng2 phiên797 lượt 1/3: thiếu cặp chân thứ tư; RAW candidates/to-n-797-attempt1.png; SHA256 d0acc7de371cfe156434efd46f51778d92d7f53909d18c70340a8d31639081a7 (mắt)
LỖI: to-n — LỊCH SỬ LƯỢT (bản cuối ĐẠT) — Vòng2 phiên797 lượt 2/3: vẫn thiếu cặp chân thứ tư; RAW candidates/to-n-797-attempt2.png; SHA256 ebd991b8068ed75445def1701d2b7ab8ad6410050411f4fcc1fc69c2642a8d7a (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/nhan_dien_ma_chu_non/` | - | image_gen.imagegen | RAW hoạt ảnh Nhân Diện Ma Chu non: turnaround 1536×1024, toA 941×1672, toB 1254×1254, to-ne 1536×1024, to-n 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
