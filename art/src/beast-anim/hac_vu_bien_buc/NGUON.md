# Hắc Vụ Biên Bức — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species hac_vu_bien_buc`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `hac_vu_bien_buc` (Hắc Vụ Biên Bức), họ `bird`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1542655 byte, SHA256 `8d4591b69c053ca804db9783417269e27583d83123d5ef4e3dc90460b8a9a53a`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `turnaround.prompt.txt` (SHA256 `d05417a7bb98ab427445b95440cd268e3a79b95c77ac394806f8044c2e461481`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **948×1659**, 1709325 byte, SHA256 `a1a2cf57d2b0c11bc9f5d94880b29a48b81060ece3dbe54427459aba4279d858`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `toA.prompt.txt` (SHA256 `73aed6337b5b240d58942350bcedefb85ffe653bf07f51e669c3698a1c565249`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 82% so với ảnh tĩnh (lệch 18%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (se): cỡ thân idle 88% so với ảnh tĩnh (lệch 12%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1731511 byte, SHA256 `5fce4c2c768a96fe764ad3f65c3ac2dfac81a261a2dc4211a14929dfc63a12e3`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `59ad94ccdcc2e84ea01ec0ee5c42d10114c05f78aa9d4325cef9a65c86fe42d2`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 120% so với ảnh tĩnh (lệch 20%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toE

- File: `toE.png`, **1536×1024**, 1708557 byte, SHA256 `c44badb82d4e8036169983f2b5c6c5d3acadf5d09c034b6ed7b63fc69c451f58`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toE.prompt.txt` (SHA256 `152f54e5eb817f6de15e002792de7b2addc73f73d4d3f07fead37884a05dda7a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 284% so với ảnh tĩnh (lệch 184%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### toD (candidates)

- File chọn: `candidates/toD-attempt3.png`, **1536×1024**, SHA256 `831db5d1581f2c37f60adfe057bdb32eea439163f886e8e1d5982ade4d05919d`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **chặn** (CHẶN: không vào thư mục chính).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống — H4 (s) C5, H8 (se) C5, H8 (se) C6 — ô trống có hình (0.34% diện tích ô): hình tràn từ ô bên; ô trống có hình (4.78% diện tích ô): hình tràn từ ô bên; ô trống có hình (3.52% diện tích ô): hình tràn từ ô bên.
LỖI: toD — hình dính — H3 (ne) — dải có 5 hình, cần 6: hình dính nhau.
LỖI: toD — hướng — ne H4 C3–4 — chết cuối lộ mặt sau 3 lượt, giữ fallback (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/hac_vu_bien_buc/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Hắc Vụ Biên Bức: turnaround 1536×1024, toA 948×1659, toB 1254×1254, toE 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
