# Độc Châm Phong — RAW hoạt ảnh (#1277)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species doc_cham_phong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `doc_cham_phong` (Độc Châm Phong), họ `insect`, khung game 64×64. Mức kiểm chung: **nhẹ**.


## turnaround

- File: `turnaround.png`, **1536×1024**, 1632975 byte, SHA256 `3dc4cd1f3414d9f2493467343cd8f2957926107cf29e250c1d052f960ee83fd8`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `turnaround.prompt.txt` (SHA256 `72324cb21083dd37ddb06b6730851dbbed1487fa55c6913ceca18d9ec9fba055`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **948×1659**, 1838198 byte, SHA256 `e51c299e40803ae3e3ddfe71f9fcca2a6bd437e0b2d1c807ed36e93728f57ebf`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `546e8248060e15db5eff2708fdc0b2421a048b60ff9e54f156cfa268dec1ca61`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 76% so với ảnh tĩnh (lệch 24%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1955118 byte, SHA256 `2041ef92afcd021026909d2e0f37705322407ec90df0f822fa1f9cfa42bb2607`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toB.prompt.txt` (SHA256 `90288eb6c8af28f499db485e7e2863eae2304f7cb859fedb961fd8f332672d92`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 138% so với ảnh tĩnh (lệch 38%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Sổ candidates trước vòng 2 (giữ lịch sử)

Ảnh chụp nguyên sổ trước vòng 2; trạng thái chưa vào thư mục chính dưới đây là trạng thái tại thời điểm cũ, không thay trạng thái tờ mới đã nhập.

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### to-ne (candidates)

- File chọn: `candidates/to-ne-attempt6.png`, **1536×1024**, SHA256 `52da94507fd489b57facdce799d98b039cb115db2fcb11e1e261274331310035`; lượt tìm thấy: 1, 2, 3, 4, 5, 6.
- Số lượt đã dùng: 6; lượt được chọn: 6.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## Các lượt bổ sung vòng 2 (phiên 797)

Các mục sau sinh bằng beast-nguon trên staging LF của từng ứng viên; tờ lỗi không dùng làm tham chiếu.

### to-ne-797-attempt1

- File: `candidates/to-ne-797-attempt1.png`, **1536×1024**, 1651544 byte, SHA256 `bd3409457b48cf7ae37037f42afebd19a05ae49f2031d55b1ee35aa1e11dc6ce`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt1.prompt.txt` (SHA256 `7f67cc9ed593d08525f9e9fe5b6eb831044bb5b8409ada2ecb54de49b69da297`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: oval tím giống mắt bên đầu. **Không chọn cho bản nhập cuối.**

### to-ne-797-attempt2

- File: `candidates/to-ne-797-attempt2.png`, **1536×1024**, 1646529 byte, SHA256 `c61da7102813701a01453a8012e74b7d3d836350ba7da9e144372d6fb01156ba`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt2.prompt.txt` (SHA256 `332a8dab9bdd0e80b17682532f31a0e74b5003c569a15bdd6ee11dc9598a8f61`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: attack còn mắt rõ. **Không chọn cho bản nhập cuối.**

### to-ne-797-attempt3

- File: `candidates/to-ne-797-attempt3.png`, **1536×1024**, 1668310 byte, SHA256 `9b2005f6cd25a274f2092b9e8f83c7ee4c8e9eaf2ada5b67226c4779ee6584c8`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt3.prompt.txt` (SHA256 `7f98e6b6c3d902391c318dc04091e23c319f6f6afd7c7f0e71943dfd0405c09d`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: attack quay mặt và biến dạng đầu. **Không chọn cho bản nhập cuối.**

## Lỗi

```text
LỖI: toA — hình ở ô trống / chân lệch — H4 (s) C5, H4 (s) C6, H7 (se) C1–6, H8 (se) C5, H8 (se) C6 — ô trống có hình (2.17% diện tích ô): hình tràn từ ô bên; ô trống có hình (3.1% diện tích ô): hình tràn từ ô bên; chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%); ô trống có hình (11.54% diện tích ô): hình tràn từ ô bên; ô trống có hình (10.64% diện tích ô): hình tràn từ ô bên.
LỖI: toA — pose — s H4 C3–4 — DIE nằm ngang ảnh, không giữ trục hướng s (mắt)
LỖI: toB — chân lệch — H8 (n) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 20%).
LỖI: toB — hướng — khối ne — nhiều frame lộ mắt/mặt, sai góc 3/4 sau (mắt)
LỖI: to-ne — ne — hết 3 lượt; đánh C2–C3 lộ mắt; giữ fallback. (mắt)
LỖI: to-ne — ne — hết 3 lượt bổ sung (tổng 6); vẫn thấy mắt ở idle/attack; lượt 5 thiếu cột; candidates/to-ne-attempt4–6.*; giữ fallback. (mắt)
LỖI: candidates/to-ne-797-attempt1 — chân lệch — H3 (ne) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 25%).
LỖI: candidates/to-ne-797-attempt1 — oval tím giống mắt bên đầu (mắt)
LỖI: candidates/to-ne-797-attempt2 — attack còn mắt rõ (mắt)
LỖI: candidates/to-ne-797-attempt3 — attack quay mặt và biến dạng đầu (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/doc_cham_phong/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Độc Châm Phong: turnaround 1536×1024, toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
