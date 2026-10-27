# Cúc Yêu Hoa Linh — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species cuc_yeu_hoa_linh`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `cuc_yeu_hoa_linh` (Cúc Yêu Hoa Linh), họ `plant`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **1024×1536**, 2021894 byte, SHA256 `239382e5b3f8a6c34459a8d326dc974e14df44e07923548b53f0360b188c851a`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: ao-desktop-621.
- Prompt: `toA.prompt.txt` (SHA256 `ad5fac370e1fafefde1b63b8f0b127832fd5e210f36624ab5051337350d6ea33`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se nhẹ, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1966640 byte, SHA256 `e44a95b74ae14287e4c4b65b16ec8f534779b84c5a488554faf0aa34dd416ac3`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: ao-desktop-621.
- Prompt: `toB.prompt.txt` (SHA256 `0e09f60b477b5328f3677d8e105cc7d659d798bed17c01c2bd55cdbd6a7671db`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống — H8 (se) C5, H8 (se) C6 — ô trống có hình (0.58% diện tích ô): hình tràn từ ô bên; ô trống có hình (0.69% diện tích ô): hình tràn từ ô bên.
LỖI: toA — s/se/e quá giống nhau, chưa đọc rõ góc nghiêng; s die H4 C3–4 nghiêng ngang. Chọn A2, A1 sai 7 hình/hàng giữ trong candidates. (mắt)
LỖI: toB — hình ở ô trống — H4 (ne) C5, H4 (ne) C6 — ô trống có hình (3.77% diện tích ô): hình tràn từ ô bên; ô trống có hình (3.57% diện tích ô): hình tràn từ ô bên.
LỖI: toB — ne/n còn thấy mặt bông hoa như góc trước, chưa đọc rõ đài hoa phía lưng; n die H8 C4 ngã ngang; hurt biên độ nhỏ (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/cuc_yeu_hoa_linh/` | - | Codex image_gen.imagegen | RAW hoạt ảnh Cúc Yêu Hoa Linh: toA 1024×1536, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
