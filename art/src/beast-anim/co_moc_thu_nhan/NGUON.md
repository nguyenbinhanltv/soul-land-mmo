# Cổ Mộc Thụ Nhân — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species co_moc_thu_nhan`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `co_moc_thu_nhan` (Cổ Mộc Thụ Nhân), họ `plant`, khung game 128×128. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 2236389 byte, SHA256 `47c865bedcd9ff3a75dd0a9784e1882feb0facfb41f65db1e8967020c8904707`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `turnaround.prompt.txt` (SHA256 `d842be141476375a880e7693ce92b5d5ed5d8994332cdbc4ebc75a63d3cbba88`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 3 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **1536×1024**, 2570789 byte, SHA256 `6be543239fc97e85cdd2c2c63a7bbb36589ac76291fbb1fe422ea885aec948b1`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `toA.prompt.txt` (SHA256 `3048ffff028ef7d42d78e53d209cf7f68bd77a917c0a73e2b218b549f73bfd15`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1536×1024**, 2536002 byte, SHA256 `b988e28114df3bd3563fe293dca99b0ecdc8debebbba4f6d2f00619eccf99073`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `6daec3f95ff19bd7048313366bed9b33f9c9a4bfa9b1432277097348a6281979`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: se pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toC

- File: `toC.png`, **1536×1024**, 2507058 byte, SHA256 `75e5f5f209091c376deeda5de51be0c0edd9326c25358e9ec92bf0396cbd924b`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `toC.prompt.txt` (SHA256 `3820f31fbdc32010861c5387ec929697cd80b6bb183d85455324e1cea0c6acd0`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toE

- File: `toE.png`, **1536×1024**, 2523851 byte, SHA256 `b85b0c7b160cf8a1c0fd75908b5ee0b9487388f63ef1a2819bfea9eb3b838085`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toE.prompt.txt` (SHA256 `0bcc2b5ac8b24dfb8cc6563e1ad2357a848423feef7cf093ccd4d9941df5d34a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 138% so với ảnh tĩnh (lệch 38%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### toD (candidates)

- File chọn: `candidates/toD-attempt3.png`, **1536×1024**, SHA256 `a94d51add89dd179788fe1134aeb7a347fa9db245d77976b9304e484e854caa4`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: **chưa duyệt bằng mắt**.

## Lỗi

```text
LỖI: turnaround — die chưa đổ thấp hoàn toàn; lượt 3 tốt nhất làm ref kỹ thuật (mắt)
LỖI: turnaround — toD/ne CHẶN sau 3 lượt: chọn candidates/toD-attempt3.png; H1 C6 và H3 C1,C4 lộ mặt; không đặt toD.png trong thư mục chính. Lượt 1 thiếu một khung die; lượt 2 lộ mặt nhiều hơn. (mắt)
LỖI: turnaround — Phiên 765: ne dùng đủ 3 lượt mới; lượt 1/2 H1 C5-C6 lộ mặt, lượt3 H1 chỉ 5 hình và hurt lộ mặt. Chọn candidates/to-ne-765-attempt2.png tốt nhất, vẫn chặn mắt; không dùng làm tham chiếu, không nhập ne. Hướng đã nhập s,se,e,n giữ nguyên. (mắt)
LỖI: toA — s — chọn lượt 3: hurt giữ mặt trước tốt hơn; die C4 hơi xoay phải nhưng vẫn rũ theo trục (mắt)
LỖI: toB — se — attack C6 gần chính diện; hurt ngả mạnh (mắt)
LỖI: toC — e — một số khung hơi chếch trước, hurt ngả mạnh; chọn lượt 3 tốt nhất (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/co_moc_thu_nhan/` | - | image_gen | RAW hoạt ảnh Cổ Mộc Thụ Nhân: turnaround 1536×1024, toA 1536×1024, toB 1536×1024, toC 1536×1024, toE 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
