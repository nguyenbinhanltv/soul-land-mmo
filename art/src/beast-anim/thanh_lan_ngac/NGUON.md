# Thanh Lân Ngạc — RAW hoạt ảnh (#1277)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thanh_lan_ngac`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thanh_lan_ngac` (Thanh Lân Ngạc), họ `quad`, khung game 96×96. Mức kiểm chung: **nhẹ**.


## turnaround

- File: `turnaround.png`, **1536×1024**, 1618158 byte, SHA256 `22d42213b1e05ff8a7f6f98496c79765089379b79a142607f80093311252d6de`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `turnaround.prompt.txt` (SHA256 `bf21a9a53acc2502cff915e5a01f62631708b41c3008260fcfe384a2dbe09b60`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **1024×1536**, 2123584 byte, SHA256 `fa6ee41de8f7bfc5f4c577629b5d24497446d0e0951b6f7c3d561457c9af7742`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toA.prompt.txt` (SHA256 `7d0b25903d41a869a1397b751e4b8cba3a922cfcd780badb43dd2c122ee771e1`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 138% so với ảnh tĩnh (lệch 38%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 2010045 byte, SHA256 `e24fc47f90d9788261c914b4cee917b00a7399d2a9cb3b30410d304d273a6d1b`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toB.prompt.txt` (SHA256 `99236a5aa9f49b1c9a3d246ce68becf938cad002acd4c4b3eb62f76c038f3c20`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 78% so với ảnh tĩnh (lệch 22%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 72% so với ảnh tĩnh (lệch 28%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## to-n

- File: `to-n.png`, **1536×1024**, 1700714 byte, SHA256 `b5ec1255bf8952b865d6a1e508bc8e3c74a63d4accf13cbb6a759656533d3dc8`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 4.
- Prompt: `to-n.prompt.txt` (SHA256 `88ff90736b4fda9ba087370b452a65a8a1ceac19aeacebdf604517157c5141df`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 122% so với ảnh tĩnh (lệch 22%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Sổ candidates trước vòng 2 (giữ lịch sử)

Ảnh chụp nguyên sổ trước vòng 2; trạng thái chưa vào thư mục chính dưới đây là trạng thái tại thời điểm cũ, không thay trạng thái tờ mới đã nhập.

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### to-ne (candidates)

- File chọn: `candidates/to-ne-attempt6.png`, **1536×1024**, SHA256 `f715e6ba881cdb02c2e292d465e453be63128e72b70f414ef0ff20baac776ba9`; lượt tìm thấy: 4, 5, 6.
- Số lượt đã dùng: 3; lượt được chọn: 6.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

### toD (candidates)

- File chọn: `candidates/toD-attempt3.png`, **1536×1024**, SHA256 `7b0a1ad33a04c0201b3ae535396a3ccd2bd2c848ae25d21f1e93d1603b31544e`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **chặn** (CHẶN: không vào thư mục chính).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

### toE (candidates)

- File chọn: `candidates/toE-attempt3.png`, **1536×1024**, SHA256 `9d2417fc243ea571cd4505ef105d40ebee13e99f26803cc474b99262dd7a33b7`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Tờ chưa vào thư mục chính (candidates)

Với nhãn to-<hướng>, số lượt đã dùng dưới đây tính RIÊNG vòng 2 (tối đa 3 lượt bổ sung); số lượt cũ giữ ở sổ trước vòng 2. RAW được chọn là lượt ít lỗi chặn hơn sau soát kỹ thuật và bằng mắt; vẫn giữ ảnh tĩnh trong game.

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### to-ne (candidates)

- File chọn: `candidates/to-ne-797-attempt2.png`, **1536×1024**, SHA256 `47ba6a117d60a404c11879c0c2e75a8981f31568b76d272c4f429c29bbc51d7a`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 2.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

### toD (candidates)

- File chọn: `candidates/toD-attempt3.png`, **1536×1024**, SHA256 `7b0a1ad33a04c0201b3ae535396a3ccd2bd2c848ae25d21f1e93d1603b31544e`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **chặn** (CHẶN: không vào thư mục chính).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

### toE (candidates)

- File chọn: `candidates/toE-attempt3.png`, **1536×1024**, SHA256 `9d2417fc243ea571cd4505ef105d40ebee13e99f26803cc474b99262dd7a33b7`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Các lượt bổ sung vòng 2 (phiên 797)

Các mục sau sinh bằng beast-nguon trên staging LF của từng ứng viên; tờ lỗi không dùng làm tham chiếu.

### to-ne-797-attempt1

- File: `candidates/to-ne-797-attempt1.png`, **1536×1024**, 1804149 byte, SHA256 `50f1a5e00a7a4e4f27f1a4220c2f84ea48205d87f52d6949fdcda03ec67c6dfb`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt1.prompt.txt` (SHA256 `8bb8ad1cd68c7ade09c77bfcc46f4dffd13b1aae6f168f6e53f916873b29b748`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: còn nét mặt bên đầu. **Không chọn cho bản nhập cuối.**

### to-ne-797-attempt2

- File: `candidates/to-ne-797-attempt2.png`, **1536×1024**, 1861110 byte, SHA256 `47ba6a117d60a404c11879c0c2e75a8981f31568b76d272c4f429c29bbc51d7a`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt2.prompt.txt` (SHA256 `3d51cfe9e42ef465841122dfe93edfe7211f0ff37cf7274bb137e4394f48d213`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: vẫn có mắt. **Không chọn cho bản nhập cuối.**

### to-ne-797-attempt3

- File: `candidates/to-ne-797-attempt3.png`, **1536×1024**, 2073829 byte, SHA256 `66d99e0516d2b03ccc0a29d8d7d0b296975ece8e655b17e169be84fce5e5c759`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt3.prompt.txt` (SHA256 `100779629866e7140402462eb95e6da06d465de4f3a823b85ba840b37532d0d9`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: vẫn có mắt ở mép đầu, không nhập. **Không chọn cho bản nhập cuối.**

## Lỗi

```text
LỖI: toA — hình ở ô trống — H4 (s) C5, H4 (s) C6, H8 (se) C6 — ô trống có hình (0.52% diện tích ô): hình tràn từ ô bên; ô trống có hình (2.92% diện tích ô): hình tràn từ ô bên; ô trống có hình (4.34% diện tích ô): hình tràn từ ô bên.
LỖI: toB — hình ở ô trống — H4 (ne) C5, H4 (ne) C6, H8 (n) C5 — ô trống có hình (1.19% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.79% diện tích ô): hình tràn từ ô bên; ô trống có hình (0.34% diện tích ô): hình tràn từ ô bên.
LỖI: to-n — chân lệch — H4 (n) C1 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 12%).
LỖI: to-ne — ne — lượt bổ sung 1 (tổng 4), mọi hàng lộ mắt; candidates/to-ne-attempt4.png; chưa nhập. (mắt)
LỖI: to-ne — ne — hết 3 lượt bổ sung (tổng 6), mọi lượt còn lộ mắt; candidates/to-ne-attempt4–6.*; giữ fallback. (mắt)
LỖI: toD — hình dính — H3 (ne) — dải có 5 hình, cần 6: hình dính nhau.
LỖI: toD — hướng — ne mọi hàng — còn lộ mắt sau 3 lượt, giữ fallback (mắt)
LỖI: toE — hướng — n H3 C3–4 — attack quay đầu lộ mặt sau 3 lượt, giữ fallback (mắt)
LỖI: candidates/to-ne-797-attempt2 — vẫn có mắt (mắt)
LỖI: candidates/to-ne-797-attempt1 — còn nét mặt bên đầu (mắt)
LỖI: candidates/to-ne-797-attempt3 — vẫn có mắt ở mép đầu, không nhập (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thanh_lan_ngac/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Thanh Lân Ngạc: turnaround 1536×1024, toA 1024×1536, toB 1254×1254, to-n 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
