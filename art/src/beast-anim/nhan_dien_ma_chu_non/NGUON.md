# Nhân Diện Ma Chu non — RAW hoạt ảnh (#1277)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species nhan_dien_ma_chu_non`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `nhan_dien_ma_chu_non` (Nhân Diện Ma Chu non), họ `insect`, khung game 96×96. Mức kiểm chung: **nhẹ**.


## turnaround

- File: `turnaround.png`, **1536×1024**, 1520176 byte, SHA256 `771c0708633bcc3cbab0522521e73ce26870785c3c8da79a79d69be280081dde`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `turnaround.prompt.txt` (SHA256 `11cca4a4016794959e55a3411fd709aa091f6391f18eb951e2142c94b2181ded`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **941×1672**, 1824749 byte, SHA256 `8f598d5be90f11116483f7c418067af39620c86b720b7a47bc15e3cbcba43f76`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toA.prompt.txt` (SHA256 `9f9745cc8383778c3319ed11279889d147d27d21c45732853f3e221b5aa0da48`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e pass).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1863075 byte, SHA256 `bb2b22367dbfa158b4dd97aba5b8ea1af4c37a360caae8c017b76a388691d3a1`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toB.prompt.txt` (SHA256 `56d418f5d1571de2e92308aa172781e16e7ab6062434c29f59214d9cde3103f2`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## to-ne

- File: `to-ne.png`, **1536×1024**, 1808179 byte, SHA256 `cbad4c3c31d92f102cce5e8fd06f8d38659a098f9508142a5c736e5e76285b02`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-797.
- Prompt: `to-ne.prompt.txt` (SHA256 `37d11b89fff8649fa6bcfd6645fb2f1650de1c9a7cca9892f3138f8e8cd0aec1`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 235% so với ảnh tĩnh (lệch 135%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## to-n

- File: `to-n.png`, **1536×1024**, 1987913 byte, SHA256 `6d0f311048aaaea985f045681fb85a7369745b88a8da191b973491f2bdb0dc3c`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-797.
- Prompt: `to-n.prompt.txt` (SHA256 `d81bc43b7789af1ec6281c3749f2ffe22c510815c7ac1462070d709a13441a78`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 276% so với ảnh tĩnh (lệch 176%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Các lượt bổ sung vòng 2 (phiên 797)

Các mục sau sinh bằng beast-nguon trên staging LF của từng ứng viên; tờ lỗi không dùng làm tham chiếu.

### to-ne-797-attempt1

- File: `candidates/to-ne-797-attempt1.png`, **1536×1024**, 1596015 byte, SHA256 `ee901f9668a02cdf1fa4fadb7479ea94321ca2a90c0f1e08a5faa54084678b9c`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt1.prompt.txt` (SHA256 `e474bbc8a434fe5e19ea09a67eccab28c573e016a2cc1d951bd630090ef62bf9`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: thiếu cặp chân thứ tư. **Không chọn cho bản nhập cuối.**

### to-ne-797-attempt2

- File: `candidates/to-ne-797-attempt2.png`, **1536×1024**, 1666407 byte, SHA256 `838afb4fe0569075d05be0142948549065c341eec6d4be56071b4e1f3a802f2f`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt2.prompt.txt` (SHA256 `a056962e1cfeacadbe5aa14cafd03567f36fe5087ab4567bec834c5425d4bad3`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: vẫn thiếu cặp chân thứ tư. **Không chọn cho bản nhập cuối.**

### to-ne-797-attempt3

- File: `candidates/to-ne-797-attempt3.png`, **1536×1024**, 1808179 byte, SHA256 `cbad4c3c31d92f102cce5e8fd06f8d38659a098f9508142a5c736e5e76285b02`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt3.prompt.txt` (SHA256 `37d11b89fff8649fa6bcfd6645fb2f1650de1c9a7cca9892f3138f8e8cd0aec1`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.
- Ghi chú lượt / nhập: đạt 4 cặp chân, mặt che khuất. **Được chọn cho hướng đã nhập.**

### to-n-797-attempt1

- File: `candidates/to-n-797-attempt1.png`, **1536×1024**, 1653955 byte, SHA256 `d0acc7de371cfe156434efd46f51778d92d7f53909d18c70340a8d31639081a7`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-797.
- Prompt: `candidates/to-n-797-attempt1.prompt.txt` (SHA256 `9d9ec26c9e688fe8577a9e50ec39545fc9e98e5c3cb9e78c7ba593645f0538b2`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: thiếu cặp chân thứ tư. **Không chọn cho bản nhập cuối.**

### to-n-797-attempt2

- File: `candidates/to-n-797-attempt2.png`, **1536×1024**, 1708414 byte, SHA256 `ebd991b8068ed75445def1701d2b7ab8ad6410050411f4fcc1fc69c2642a8d7a`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-797.
- Prompt: `candidates/to-n-797-attempt2.prompt.txt` (SHA256 `cee5f79773cac5eb028433ce5b86f66259e27cb8dc852461796962b47ef56258`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: vẫn thiếu cặp chân thứ tư. **Không chọn cho bản nhập cuối.**

### to-n-797-attempt3

- File: `candidates/to-n-797-attempt3.png`, **1536×1024**, 1987913 byte, SHA256 `6d0f311048aaaea985f045681fb85a7369745b88a8da191b973491f2bdb0dc3c`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-797.
- Prompt: `candidates/to-n-797-attempt3.prompt.txt` (SHA256 `d81bc43b7789af1ec6281c3749f2ffe22c510815c7ac1462070d709a13441a78`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: n pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.
- Ghi chú lượt / nhập: đạt 4 cặp chân; die hạ thân giữ trục. **Được chọn cho hướng đã nhập.**

## Lỗi

```text
LỖI: turnaround — giải phẫu — mọi cột — chỉ thấy ba cặp chân và mặt nổi; hết 2 lượt, không dùng làm tham chiếu, chưa sinh ne/n (mắt)
LỖI: toA — chân lệch — H3 (s) C3–4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 16%).
LỖI: candidates/to-ne-797-attempt1 — thiếu cặp chân thứ tư (mắt)
LỖI: candidates/to-ne-797-attempt2 — vẫn thiếu cặp chân thứ tư (mắt)
LỖI: candidates/to-n-797-attempt1 — thiếu cặp chân thứ tư (mắt)
LỖI: candidates/to-n-797-attempt2 — vẫn thiếu cặp chân thứ tư (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/nhan_dien_ma_chu_non/` | - | Codex image_gen.imagegen | RAW hoạt ảnh Nhân Diện Ma Chu non: turnaround 1536×1024, toA 941×1672, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
