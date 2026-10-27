# Hàn Băng Địa Long — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species han_bang_dia_long`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `han_bang_dia_long` (Hàn Băng Địa Long), họ `quad`, khung game 128×128. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1800175 byte, SHA256 `70eb3a701f6ec510c6a9279b6631334b4f942750e310a3759a470a499be8dd73`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: ao-desktop.
- Prompt: `turnaround.prompt.txt` (SHA256 `40c7e9d8593b355158b0e46350c4c0c8eb371790aed52365f8baf711e273f46d`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 3 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **1536×1024**, 1970250 byte, SHA256 `b35627f164bbb89d0f678dd8e4af5764a7e76df34bded245f720d46df0e49dcf`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: ao-desktop.
- Prompt: `toA.prompt.txt` (SHA256 `3b5a2f73916229adebfb596877feca42f88e48d7453e8e3fa285f2f8a37e9552`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toC

- File: `toC.png`, **1536×1024**, 2042228 byte, SHA256 `2a78308646e4c2b62b8d09803a1b84fbe7cea2c363ee653812dc65706e9d6d0c`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: ao-desktop.
- Prompt: `toC.prompt.txt` (SHA256 `dee79dc65052b42cb07ef24ca19a6a2c25755ad74916d42e7fd1a9bc0a7bca1c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (e): cỡ thân idle 88% so với ảnh tĩnh (lệch 12%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toE

- File: `toE.png`, **1536×1024**, 1884563 byte, SHA256 `5508fbba6ea2180edac1542341c713ee0cdb5163c02184763af9c9ebfc41b5d0`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: ao-desktop.
- Prompt: `toE.prompt.txt` (SHA256 `965a4f880186da339113cbbed820dd7c021d6f79a8f59ee6af7800bc2d885f59`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — chọn lượt 1; se gần e, HURT ngẩng đầu mạnh (mắt)
LỖI: turnaround — toB — CHẶN MẮT: se không khác e (cả 3 lượt); đã hết 3 lượt, chọn candidates/toB-attempt2.png; cả 3 lượt đủ prompt/source, không có toB.png chính; không nhập hướng se (mắt)
LỖI: turnaround — toD — CHẶN MẮT: ne HURT C5, ATTACK C3–C4, DIE C4 lộ mắt/mõm và xoay ngang; đã hết 3 lượt, chọn candidates/toD-attempt2.png; cả 3 lượt đủ prompt/source, không có toD.png chính; không nhập hướng ne (mắt)
LỖI: toA — s — chọn A2; die D2–D4 xoay chéo phải, attack C1/C5 nghiêng đầu, HURT C5 ngẩng đầu mạnh (mắt)
LỖI: toC — e — HURT H1 C6 hơi quay đầu về người xem, biên độ idle nhỏ (mắt)
LỖI: toE — n — không lộ mặt; attack C3 nghiêng thân nhẹ, HURT biên độ nhỏ (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/han_bang_dia_long/` | - | image_gen | RAW hoạt ảnh Hàn Băng Địa Long: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
