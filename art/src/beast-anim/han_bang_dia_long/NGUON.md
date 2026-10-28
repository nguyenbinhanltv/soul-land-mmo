# Hàn Băng Địa Long — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species han_bang_dia_long`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `han_bang_dia_long` (Hàn Băng Địa Long), họ `quad`, khung game 128×128. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1791405 byte, SHA256 `b6456c123f24630b069a7b8d2beb2912c55cfe159d368358eb671c57ac9fa100`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3.
- Prompt: `turnaround.prompt.txt` (SHA256 `1c7d99c5e3de7c53656225b00ae2531e8dd8806ee8208beacfe09df143478873`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **1536×1024**, 1970250 byte, SHA256 `b35627f164bbb89d0f678dd8e4af5764a7e76df34bded245f720d46df0e49dcf`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toA.prompt.txt` (SHA256 `ae8a30304a0e63d4f5b773582102d7b751a2f6bfb9d23a3cb91d068a05eca173`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toC

- File: `toC.png`, **1536×1024**, 2042228 byte, SHA256 `2a78308646e4c2b62b8d09803a1b84fbe7cea2c363ee653812dc65706e9d6d0c`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toC.prompt.txt` (SHA256 `ca47a0e02abbdcd2f8606fae3c451f5d0d54978595332309b126ee03480c6c39`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (e): cỡ thân idle 87% so với ảnh tĩnh (lệch 13%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toE

- File: `toE.png`, **1536×1024**, 1884563 byte, SHA256 `5508fbba6ea2180edac1542341c713ee0cdb5163c02184763af9c9ebfc41b5d0`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toE.prompt.txt` (SHA256 `3c1287e769978b0475494408b470d7be479178adc00660facc423aaab2267839`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## to-ne

- Ghi chú kỹ thuật nhập lại: matchSize: chuẩn sheet ĐÃ NHẬP s=84, e=72.5, n=87.5; TB 81.333 px. ne ×0.90; sau nhập ne=81 px (−0.41%). se tiếp tục fallback do lỗi mắt/lưới cũ. Hướng cũ RGBA + normal giữ nguyên, kiểm tự động và đối chiếu git đạt.
- File: `to-ne.png`, **1536×1024**, 2044407 byte, SHA256 `bc1a7ea0676978a41a36cbf13c2050acea7040fbcec58b315846c9e6565e7ec8`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `to-ne.prompt.txt` (SHA256 `ce485fabcfb33bc2106769067732f87d6f5cc60cac303a70761c11f04cdd8250`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### toB (candidates)

- File chọn: `candidates/toB-attempt3.png`, **1536×1024**, SHA256 `25932699082c7ac43d25ff90095fe88fd9861e517550ece02bddd6c21c075a1e`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: **chưa duyệt bằng mắt**.

### toD (candidates)

- File chọn: `candidates/toD-attempt3.png`, **1536×1024**, SHA256 `d1ed9bd3628af37ae2cdfc72a6b7ff45d2863834df11a098358175d035b21f95`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: **chưa duyệt bằng mắt**.

## Lỗi

```text
LỖI: turnaround — Phiên765: turnaround mới đạt lượt3, hai lượt trước ne còn thấy mắt. se dùng đủ3 lượt mới; lượt1/2 vẫn gần e; lượt3 H1 chỉ5 hình và H3 C5 quay lưng. Chọn candidates/to-se-765-attempt2.png tốt nhất nhưng vẫn chặn góc; không nhập se. (mắt)
LỖI: toA — Giữ hướng s cũ: die hơi chếch phải, attack nghiêng đầu và hurt ngẩng mạnh như hồ sơ cũ. (mắt)
LỖI: toC — Giữ hướng e cũ: hurt hơi quay đầu, idle biên độ nhỏ. (mắt)
LỖI: toE — Giữ hướng n cũ: không lộ mặt, attack nghiêng nhẹ, hurt nhỏ. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/han_bang_dia_long/` | - | image_gen.imagegen | RAW hoạt ảnh Hàn Băng Địa Long: turnaround 1536×1024, toA 1536×1024, toC 1536×1024, toE 1536×1024, to-ne 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
