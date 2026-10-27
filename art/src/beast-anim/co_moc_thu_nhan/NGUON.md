# Cổ Mộc Thụ Nhân — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species co_moc_thu_nhan`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `co_moc_thu_nhan` (Cổ Mộc Thụ Nhân), họ `plant`, khung game 128×128. Mức kiểm chung: **pass**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 2236389 byte, SHA256 `47c865bedcd9ff3a75dd0a9784e1882feb0facfb41f65db1e8967020c8904707`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: ao-desktop.
- Prompt: `turnaround.prompt.txt` (SHA256 `2d8ab733ebf758758f4cf815946eeacd0fe6946f3668a9fa3098729528094f75`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **1536×1024**, 2539980 byte, SHA256 `fa6f6a8f0fa9ed67a51e4e038241792cf0546e061331c46df7f305951e6c8985`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: ao-desktop.
- Prompt: `toA.prompt.txt` (SHA256 `2c99d3874cc2bb19521cf95897b80c48ca51e78b4b0c343da61f69ed1e3c4721`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1536×1024**, 2536002 byte, SHA256 `b988e28114df3bd3563fe293dca99b0ecdc8debebbba4f6d2f00619eccf99073`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: ao-desktop.
- Prompt: `toB.prompt.txt` (SHA256 `dfd5b8fa8234ea03800ca9299e9db53d7db5dfa93f113b65a3cfd66b456578aa`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: se pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toC

- File: `toC.png`, **1536×1024**, 2507058 byte, SHA256 `75e5f5f209091c376deeda5de51be0c0edd9326c25358e9ec92bf0396cbd924b`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: ao-desktop.
- Prompt: `toC.prompt.txt` (SHA256 `ad207ef97773a166ff78cc2c751da30ba2b607ef95d4fc8bc32d65d9e1ad93e0`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — die chưa đổ thấp hoàn toàn; lượt 3 tốt nhất làm ref kỹ thuật (mắt)
LỖI: toA — s — hurt hơi xoay thân sang phải (mắt)
LỖI: toB — se — attack C6 gần chính diện; hurt ngả mạnh (mắt)
LỖI: toC — e — một số khung hơi chếch trước, hurt ngả mạnh; chọn lượt 3 tốt nhất (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/co_moc_thu_nhan/` | - | image_gen | RAW hoạt ảnh Cổ Mộc Thụ Nhân: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
