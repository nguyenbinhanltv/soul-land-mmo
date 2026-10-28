# Cổ Mộc Thụ Nhân — RAW hoạt ảnh (#861)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species co_moc_thu_nhan`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `co_moc_thu_nhan` (Cổ Mộc Thụ Nhân), họ `plant`, khung game 128×128. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 2236389 byte, SHA256 `47c865bedcd9ff3a75dd0a9784e1882feb0facfb41f65db1e8967020c8904707`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `turnaround.prompt.txt` (SHA256 `2d8ab733ebf758758f4cf815946eeacd0fe6946f3668a9fa3098729528094f75`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 3 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **1536×1024**, 2570789 byte, SHA256 `6be543239fc97e85cdd2c2c63a7bbb36589ac76291fbb1fe422ea885aec948b1`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `toA.prompt.txt` (SHA256 `2c99d3874cc2bb19521cf95897b80c48ca51e78b4b0c343da61f69ed1e3c4721`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1536×1024**, 2536002 byte, SHA256 `b988e28114df3bd3563fe293dca99b0ecdc8debebbba4f6d2f00619eccf99073`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `dfd5b8fa8234ea03800ca9299e9db53d7db5dfa93f113b65a3cfd66b456578aa`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: se pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toC

- File: `toC.png`, **1536×1024**, 2507058 byte, SHA256 `75e5f5f209091c376deeda5de51be0c0edd9326c25358e9ec92bf0396cbd924b`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `toC.prompt.txt` (SHA256 `ad207ef97773a166ff78cc2c751da30ba2b607ef95d4fc8bc32d65d9e1ad93e0`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toE

- File: `toE.png`, **1536×1024**, 2523851 byte, SHA256 `b85b0c7b160cf8a1c0fd75908b5ee0b9487388f63ef1a2819bfea9eb3b838085`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toE.prompt.txt` (SHA256 `764ed7a73f6738766f5ac7be3a61f893885a59f125f76b81479fa2381cae8bc8`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 138% so với ảnh tĩnh (lệch 38%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

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
LỖI: turnaround — Lô 3: ne còn chặn sau 3 lượt mới; hurt H1 C5-C6 lộ mặt nghiêng. Xem candidates/to-ne-lo3-attempt1..3.png; giữ dirsOk s,se,e,n. (mắt)
LỖI: toA — s — chọn lượt 3: hurt giữ mặt trước tốt hơn; die C4 hơi xoay phải nhưng vẫn rũ theo trục (mắt)
LỖI: toB — se — attack C6 gần chính diện; hurt ngả mạnh (mắt)
LỖI: toC — e — một số khung hơi chếch trước, hurt ngả mạnh; chọn lượt 3 tốt nhất (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/co_moc_thu_nhan/` | - | image_gen | RAW hoạt ảnh Cổ Mộc Thụ Nhân: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
