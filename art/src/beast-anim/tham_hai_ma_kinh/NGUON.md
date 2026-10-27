# Thâm Hải Ma Kình — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species tham_hai_ma_kinh`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `tham_hai_ma_kinh` (Thâm Hải Ma Kình), họ `swim`, khung game 128×128. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1632477 byte, SHA256 `a8e3b2c6e2ad097696b60f178fcedb1c519180d6e62e6a3169c9b25818e4375d`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: ao-desktop.
- Prompt: `turnaround.prompt.txt` (SHA256 `34881c53b3c659deaef5aa4bf5229499294f7b6e61008bd8678ce08059d0fd0c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 3 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **1536×1024**, 1801334 byte, SHA256 `b77e3817a3a7a890e7e5c97a2df84b38e2bd6233869cbb9459eccaf15a1dde89`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: ao-desktop.
- Prompt: `toA.prompt.txt` (SHA256 `0523a424576818a274d1a1a473e8afa05f4ceadb2109b99cbebf161dfa18fb0b`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 118% so với ảnh tĩnh (lệch 18%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1536×1024**, 1755524 byte, SHA256 `d3b91943d9c876a1b2f73115a8aac7dfa1a254d2927851e12d54b65f3ae520d4`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: ao-desktop.
- Prompt: `toB.prompt.txt` (SHA256 `7a5dc16862d5259f15be46b0c95693f4da114023e14414aa3c90126b993625ef`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: se pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toC

- File: `toC.png`, **1536×1024**, 1736938 byte, SHA256 `4dff2166f15c4fa3fb2c2d19aeace2eac989462c1c96a412b501dcf317163dd3`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: ao-desktop.
- Prompt: `toC.prompt.txt` (SHA256 `ddcb32b121783f4ce13b255c8c3813c08beb3381fb151d1288986bc57d765f3e`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — ne còn thấy chi tiết mặt; n đầu dưới đuôi trên, hướng bắc chưa rõ; chọn lượt 3 tốt nhất làm tham chiếu kỹ thuật sau ba lượt (mắt)
LỖI: turnaround — toD ne CHẶN MẮT sau 3 lượt: mắt hiện nhiều khung, attack H3 C3–4 lộ miệng/răng; chọn candidates/toD-attempt3.png tốt nhất (kỹ thuật 0/0), không đặt toD.png thư mục chính; cả ba lượt có prompt/source (mắt)
LỖI: turnaround — toE n CHẶN MẮT sau 3 lượt: đầu dưới đuôi trên, chưa đọc được hướng bắc; chọn candidates/toE-attempt2.png tốt nhất (thân/die ổn định hơn lượt 1,3), không đặt toE.png thư mục chính; cả ba lượt có prompt/source (mắt)
LỖI: toA — s: die còn mở mắt, biên độ chìm nhẹ (mắt)
LỖI: toB — se: die cuối hơi xoay gần ngang; hurt biên độ nhỏ (mắt)
LỖI: toC — e: attack khung 1,3,4 ngẩng đầu mạnh; die còn mở mắt (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/tham_hai_ma_kinh/` | - | image_gen | RAW hoạt ảnh Thâm Hải Ma Kình: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
