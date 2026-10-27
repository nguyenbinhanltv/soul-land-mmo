# Thực Nhân Hoa — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thuc_nhan_hoa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thuc_nhan_hoa` (Thực Nhân Hoa), họ `plant`, khung game 96×96. Mức kiểm chung: **pass**.

## toA

- File: `toA.png`, **1024×1536**, 2378915 byte, SHA256 `2aebc43fbcc9e690441a731f9fcd018dd01878bc0c3ed0427783542168c5b055`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-634.
- Prompt: `toA.prompt.txt` (SHA256 `ada889f5b3ea6f7e8262117d7a365893436b23cdbb670c3f54ae8be938d7d46c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass, se pass, e pass).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hướng — s attack H3 quay phải; se gần e; attack H7/H11 C6 và die quay về phía người xem, hurt nâng miệng; chọn A2 kỹ thuật đạt, A1 chặn lưới ở candidates/toA-attempt1.png; prompt A1 gzip không mất dữ liệu, tên ở source (mắt)
LỖI: toA — hồ sơ tờ B — CHẶN MỸ THUẬT ne/n sau đủ 3 lượt; B1 ne H3 C3 há miệng và n H6-H8 nhìn ngang; B2 ne H3 C4 há miệng, n hurt/attack/die lộ miệng; B3 ne vẫn nhìn ngang, n H5 C5-C6 và H7 C2-C4, H8 C2-C4 lộ miệng; chọn B3 tốt nhất nhưng không nhập. Tất cả RAW giữ ở candidates/toB-attempt1.png, toB-attempt2.png, toB-attempt3.png; mỗi lượt đủ source và prompt, B1/B2 prompt gzip không mất dữ liệu, B3 prompt.txt. Không có toB.png ở thư mục chính. Cả B1/B2/B3 không chặn kỹ thuật, có cảnh báo nhẹ tràn ô H4 C5-C6; B3 1254x1254. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thuc_nhan_hoa/` | - | Codex image_gen.imagegen | RAW hoạt ảnh Thực Nhân Hoa: toA 1024×1536; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
