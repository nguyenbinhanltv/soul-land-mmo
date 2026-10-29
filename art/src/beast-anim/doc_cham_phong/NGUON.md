# Độc Châm Phong — RAW hoạt ảnh (#1277)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species doc_cham_phong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `doc_cham_phong` (Độc Châm Phong), họ `insect`, khung game 64×64. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1632975 byte, SHA256 `3dc4cd1f3414d9f2493467343cd8f2957926107cf29e250c1d052f960ee83fd8`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-797.
- Prompt: `turnaround.prompt.txt` (SHA256 `88cd407ac1638fa0c7cc54d4a29c6e37c99cf90249678e59ebf6250b752d83bb`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toA

- File: `toA.png`, **948×1659**, 1838198 byte, SHA256 `e51c299e40803ae3e3ddfe71f9fcca2a6bd437e0b2d1c807ed36e93728f57ebf`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-797.
- Prompt: `toA.prompt.txt` (SHA256 `deed7a1e9333032d80d0a04653fb0b5a08f9b9e1fc3c1ca23cec8710324c757f`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 76% so với ảnh tĩnh (lệch 24%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1955118 byte, SHA256 `2041ef92afcd021026909d2e0f37705322407ec90df0f822fa1f9cfa42bb2607`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 2; phiên: soul_land_game-797.
- Prompt: `toB.prompt.txt` (SHA256 `769ee360912ea00b9107e64f8cbe779d9f562a15e8aada38413468ba42e1abd8`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 138% so với ảnh tĩnh (lệch 38%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### to-ne (candidates)

- File chọn: `candidates/to-ne-attempt3.png`, **1536×1024**, SHA256 `04364bdbba194c06e7e4ad6999d6359977d5e49d61e973cfe5d82d528a3be18b`; lượt tìm thấy: 1, 2, 3, 4, 5, 6.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 5 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống / chân lệch — H4 (s) C5, H4 (s) C6, H7 (se) C1–6, H8 (se) C5, H8 (se) C6 — ô trống có hình (2.17% diện tích ô): hình tràn từ ô bên; ô trống có hình (3.1% diện tích ô): hình tràn từ ô bên; chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%); ô trống có hình (11.54% diện tích ô): hình tràn từ ô bên; ô trống có hình (10.64% diện tích ô): hình tràn từ ô bên.
LỖI: toA — Lịch sử trước vòng 2 phiên797: hình ở ô trống / chân lệch — H4 (s) C5, H4 (s) C6, H7 (se) C1–6, H8 (se) C5, H8 (se) C6 — ô trống có hình (2.17% diện tích ô): hình tràn từ ô bên; ô trống có hình (3.1% diện tích ô): hình tràn từ ô bên; chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%); ô trống có hình (11.54% diện tích ô): hình tràn từ ô bên; ô trống có hình (10.64% diện tích ô): hình tràn từ ô bên. (mắt)
LỖI: toA — Lịch sử trước vòng 2 phiên797: pose — s H4 C3–4 — DIE nằm ngang ảnh, không giữ trục hướng s (mắt) (mắt)
LỖI: toB — chân lệch — H8 (n) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 20%).
LỖI: toB — Lịch sử trước vòng 2 phiên797: chân lệch — H8 (n) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 20%). (mắt)
LỖI: toB — Lịch sử trước vòng 2 phiên797: hướng — khối ne — nhiều frame lộ mắt/mặt, sai góc 3/4 sau (mắt) (mắt)
LỖI: to-ne — Lịch sử trước vòng 2 phiên797: ne — hết 3 lượt; đánh C2–C3 lộ mắt; giữ fallback. (mắt) (mắt)
LỖI: to-ne — Lịch sử trước vòng 2 phiên797: ne — hết 3 lượt bổ sung (tổng 6); vẫn thấy mắt ở idle/attack; lượt 5 thiếu cột; candidates/to-ne-attempt4–6.*; giữ fallback. (mắt) (mắt)
LỖI: to-ne — CHƯA ĐẠT — Vòng2 phiên797 lượt 1/3: oval tím giống mắt bên đầu; RAW candidates/to-ne-797-attempt1.png; SHA256 bd3409457b48cf7ae37037f42afebd19a05ae49f2031d55b1ee35aa1e11dc6ce (mắt)
LỖI: to-ne — CHƯA ĐẠT — Vòng2 phiên797 lượt 2/3: attack còn mắt rõ; RAW candidates/to-ne-797-attempt2.png; SHA256 c61da7102813701a01453a8012e74b7d3d836350ba7da9e144372d6fb01156ba (mắt)
LỖI: to-ne — CHƯA ĐẠT — Vòng2 phiên797 lượt 3/3: attack quay mặt và biến dạng đầu; RAW candidates/to-ne-797-attempt3.png; SHA256 9b2005f6cd25a274f2092b9e8f83c7ee4c8e9eaf2ada5b67226c4779ee6584c8 (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/doc_cham_phong/` | - | image_gen.imagegen | RAW hoạt ảnh Độc Châm Phong: turnaround 1536×1024, toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
