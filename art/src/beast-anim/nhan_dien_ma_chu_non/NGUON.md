# Nhân Diện Ma Chu non — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species nhan_dien_ma_chu_non`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `nhan_dien_ma_chu_non` (Nhân Diện Ma Chu non), họ `insect`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1520176 byte, SHA256 `771c0708633bcc3cbab0522521e73ce26870785c3c8da79a79d69be280081dde`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `turnaround.prompt.txt` (SHA256 `9202ea66a63b59df4da276c49d3c99105af467128ee6b4b43c31ce15587fc08d`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **941×1672**, 1824749 byte, SHA256 `8f598d5be90f11116483f7c418067af39620c86b720b7a47bc15e3cbcba43f76`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toA.prompt.txt` (SHA256 `81ec02444bd7dbffcda8df8e90a651956199ad105090604752ca736fcf7eca21`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e pass).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1863075 byte, SHA256 `bb2b22367dbfa158b4dd97aba5b8ea1af4c37a360caae8c017b76a388691d3a1`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toB.prompt.txt` (SHA256 `1b8829943e294bcd7f95e41b5e2654f23f4c6858ee0dbcd14439a5004be87a96`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## Lỗi

```text
LỖI: turnaround — giải phẫu — mọi cột — chỉ thấy ba cặp chân và mặt nổi; hết 2 lượt, không dùng làm tham chiếu, chưa sinh ne/n (mắt)
LỖI: toA — chân lệch — H3 (s) C3–4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 16%).
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/nhan_dien_ma_chu_non/` | - | Codex image_gen.imagegen | RAW hoạt ảnh Nhân Diện Ma Chu non: turnaround 1536×1024, toA 941×1672, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
