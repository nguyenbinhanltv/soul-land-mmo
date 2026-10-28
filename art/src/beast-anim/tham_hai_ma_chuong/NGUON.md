# Thâm Hải Ma Chương — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species tham_hai_ma_chuong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `tham_hai_ma_chuong` (Thâm Hải Ma Chương), họ `float`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1809653 byte, SHA256 `f3745d49a728fafe21528179776f05f983126a08f850b8391885d63f65509a8a`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-764.
- Prompt: `turnaround.prompt.txt` (SHA256 `c99d2cc61b405d44cc955299b64207bca1cfd1a5a33589e5e8b794ba89ee459a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## to-e

- File: `to-e.png`, **1536×1024**, 2039090 byte, SHA256 `2503523ac4ab3e8d3f0341c316b8d74083c0ca2f566ff8d75c786e828575a83d`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-764.
- Prompt: `to-e.prompt.txt` (SHA256 `ecf46bcac5937af5e7287938196785214f3f24d2a76c2118bf3f4f4e6a3097a8`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: e nhẹ).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## to-ne

- File: `to-ne.png`, **1536×1024**, 2078792 byte, SHA256 `3b1900023436dbdcea220db198ed371e25c35b9facc51391911583afd0809907`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-764.
- Prompt: `to-ne.prompt.txt` (SHA256 `35f6cfa29f730b10a2ff30033d42fd9d0c4c644de41c2545e94ed6c08b238d51`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## to-n

- File: `to-n.png`, **1536×1024**, 1992422 byte, SHA256 `a1dfbd50fa837effe4289e1d43fda5ab193b7cece3df7c29d657c3d4a546cf74`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-764.
- Prompt: `to-n.prompt.txt` (SHA256 `adf70c4170d03299114aa198f307d8eac8098548397f5e75cbcc3148e21703a3`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: n pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### toA (candidates)

- File chọn: `candidates/toA-attempt2.png`, **1024×1536**, SHA256 `916de39b7837d7b10000087017a6643e897af81294868a4b0bead8b883216b5d`; lượt tìm thấy: 1, 2.
- Số lượt đã dùng: 2; lượt được chọn: 2.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: **chưa duyệt bằng mắt**.

### toB (candidates)

- File chọn: `candidates/toB-attempt2.png`, **1254×1254**, SHA256 `66dcceed3b356f2a4af9f11f7cc0356a4407f71e9bdd4341170c94f759c84861`; lượt tìm thấy: 1, 2.
- Số lượt đã dùng: 2; lượt được chọn: 2.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: **chưa duyệt bằng mắt**.

## Lỗi

```text
LỖI: to-e — hình ở ô trống — H4 (e) C5 — ô trống có hình (0.78% diện tích ô): hình tràn từ ô bên.
LỖI: to-ne — hình ở ô trống — H4 (ne) C5 — ô trống có hình (0.52% diện tích ô): hình tràn từ ô bên.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/tham_hai_ma_chuong/` | - | image_gen.imagegen | RAW hoạt ảnh Thâm Hải Ma Chương: turnaround 1536×1024, to-e 1536×1024, to-ne 1536×1024, to-n 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
