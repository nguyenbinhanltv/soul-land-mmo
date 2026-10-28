# Thanh Lân Ngạc — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thanh_lan_ngac`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thanh_lan_ngac` (Thanh Lân Ngạc), họ `quad`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1618158 byte, SHA256 `22d42213b1e05ff8a7f6f98496c79765089379b79a142607f80093311252d6de`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `turnaround.prompt.txt` (SHA256 `bf21a9a53acc2502cff915e5a01f62631708b41c3008260fcfe384a2dbe09b60`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **1024×1536**, 2123584 byte, SHA256 `fa6ee41de8f7bfc5f4c577629b5d24497446d0e0951b6f7c3d561457c9af7742`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toA.prompt.txt` (SHA256 `5f5d087eaab732a0e6fc06527eb4fc017357cd243e269781b9ffaebd03ad0de5`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 152% so với ảnh tĩnh (lệch 52%, quá 25%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (se): cỡ thân idle 121% so với ảnh tĩnh (lệch 21%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 2010045 byte, SHA256 `e24fc47f90d9788261c914b4cee917b00a7399d2a9cb3b30410d304d273a6d1b`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toB.prompt.txt` (SHA256 `a85f6d9e685a8849d24411edda9db114d6a3be70b218976b79054a36bd6d944e`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 86% so với ảnh tĩnh (lệch 14%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 80% so với ảnh tĩnh (lệch 20%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### toD (candidates)

- File chọn: `candidates/toD-attempt3.png`, **1536×1024**, SHA256 `7b0a1ad33a04c0201b3ae535396a3ccd2bd2c848ae25d21f1e93d1603b31544e`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **chặn** (CHẶN: không vào thư mục chính).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

### toE (candidates)

- File chọn: `candidates/toE-attempt3.png`, **1536×1024**, SHA256 `9d2417fc243ea571cd4505ef105d40ebee13e99f26803cc474b99262dd7a33b7`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống — H4 (s) C5, H4 (s) C6, H8 (se) C6 — ô trống có hình (0.52% diện tích ô): hình tràn từ ô bên; ô trống có hình (2.92% diện tích ô): hình tràn từ ô bên; ô trống có hình (4.34% diện tích ô): hình tràn từ ô bên.
LỖI: toB — hình ở ô trống — H4 (ne) C5, H4 (ne) C6, H8 (n) C5 — ô trống có hình (1.19% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.79% diện tích ô): hình tràn từ ô bên; ô trống có hình (0.34% diện tích ô): hình tràn từ ô bên.
LỖI: toD — hình dính — H3 (ne) — dải có 5 hình, cần 6: hình dính nhau.
LỖI: toD — hướng — ne mọi hàng — còn lộ mắt sau 3 lượt, giữ fallback (mắt)
LỖI: toE — hướng — n H3 C3–4 — attack quay đầu lộ mặt sau 3 lượt, giữ fallback (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thanh_lan_ngac/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Thanh Lân Ngạc: turnaround 1536×1024, toA 1024×1536, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
