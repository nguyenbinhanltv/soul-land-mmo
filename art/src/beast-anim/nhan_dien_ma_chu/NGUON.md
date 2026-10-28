# Nhân Diện Ma Chu — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species nhan_dien_ma_chu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `nhan_dien_ma_chu` (Nhân Diện Ma Chu), họ `insect`, khung game 128×128. Mức kiểm chung: **pass**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1572387 byte, SHA256 `51d9e1d695e8fe673611d0e49a5d22208352306eeade6052269bb2fc313c25b6`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `turnaround.prompt.txt` (SHA256 `2f0fe58c0d9b3b307ac30e8caf8b0d3a97ef6a22d2a15addadd83a5ec97a1291`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **1536×1024**, 1869474 byte, SHA256 `b1ed2d4e8344c4f3577c3af19e76ca7e9fce72f2f68bd36e06123a8ebdb943bf`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `toA.prompt.txt` (SHA256 `ee613218bac10857a1c13443428832d2b966f0ab4ca128cc897b5c02bdd2a10a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1536×1024**, 1819114 byte, SHA256 `c6766ac86327c9102c2cc98331acbe271596df5876dc6ef14667cb21e3dd38ee`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `2337d6d88449af5562a7e09653a75f3c6461dbb8a844daa66686a23a1c4370a9`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: se pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toC

- File: `toC.png`, **1536×1024**, 1763712 byte, SHA256 `d31c783e7c6b12ce8ef34b8d33d172c3d6ad05746cf084c859ea51de973b7d55`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toC.prompt.txt` (SHA256 `d335853674652ce5d1af36ee071999bdc3faad0befd8a9570d4c4f34c0888ec5`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toE

- File: `toE.png`, **1536×1024**, 1734475 byte, SHA256 `bbc878cd8c5636155ed539debf55dfca3f6e813268f206a6487d516844da0ecc`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toE.prompt.txt` (SHA256 `1d09f60e24652a7eb116157c38449745d01ddb951913b7999630baa4624a5ca5`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### to-ne (candidates)

- File chọn: `candidates/to-ne-attempt1.png`, **1536×1024**, SHA256 `f81c6baf0ed1da0260ef498d946932db10b1856b13cd250897a30f76b0cd3f4e`; lượt tìm thấy: 1.
- Số lượt đã dùng: 1; lượt được chọn: 1.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

### toD (candidates)

- File chọn: `candidates/toD-attempt3.png`, **1536×1024**, SHA256 `fd4859292a5626b07d262ca54d2745069df1bdb9595c8ecce58af212fc0926c1`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: **chưa duyệt bằng mắt**.

## Lỗi

```text
LỖI: turnaround — Chưa đọc rõ tám chân; ngoại lệ orchestrator 27/10: sửa prompt bằng bài học, lượt 4 vẫn chưa đạt. Chọn lượt 1 làm ref kỹ thuật theo quyết định PR 1114; không phải ảnh nhập game. Khối chỉ lưu candidates: toD: chọn candidates/toD-attempt3.png, sau 3 lượt vẫn chặn — ne — còn lộ mảng hoa văn mặt ở phần đầu hướng xa trong idle/walk/attack/hurt/die; chưa đọc rõ bốn cặp chân. D3 tốt nhất, kỹ thuật nhẹ 0 chặn/1 cảnh báo; không đặt toD.png thư mục chính. (mắt)
LỖI: turnaround — Turnaround sửa lô 1: 2 lượt riêng chưa đạt; chưa rõ tám chân; giữ fallback hướng yêu cầu. RAW và prompt thật/provenance kèm tại art\src\beast-anim\nhan_dien_ma_chu\candidates/turnaround-sua-lo1-attempt1.png SHA256 44537eb3cf159e0bb0b67f551150fd4b23ea1953901398c9117cdd1bc0e15fd3; art\src\beast-anim\nhan_dien_ma_chu\candidates/turnaround-sua-lo1-attempt2.png SHA256 3814a8e1b446c4953b4c1a6613bb74b4da181121c96c480442ed85fb39c5c8c8 (mắt)
LỖI: toA — s — chưa đọc rõ bốn cặp chân; hurt biên độ nhỏ, die cuối hơi lệch trục nhưng còn đọc hướng s. Chọn lượt 3 tốt nhất; các lượt 1–2 die quay ngang. (mắt)
LỖI: toB — se — chưa đọc rõ bốn cặp chân; hurt biên độ nhỏ, attack C4 hơi gần hướng e; die còn giữ hướng chéo. (mắt)
LỖI: toC — e — chưa đọc rõ bốn cặp chân; idle C2–3, walk C3/C5 và attack C5 nghiêng gần se; hurt và die giữ hướng phải, không ngửa bụng. (mắt)
LỖI: toE — n — chưa đọc rõ bốn cặp chân; hurt biên độ nhỏ, giữ hướng lưng trong mọi khung và die hạ thân không xoay ngang. (mắt)
LỖI: to-ne — ne — lượt sửa 1 vẫn chưa rõ tám chân, còn hoa văn mặt ở góc lưng; chưa nhập. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/nhan_dien_ma_chu/` | - | image_gen | RAW hoạt ảnh Nhân Diện Ma Chu: turnaround 1536×1024, toA 1536×1024, toB 1536×1024, toC 1536×1024, toE 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
