# Kiếm Ngư — RAW hoạt ảnh (#1277)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species kiem_ngu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `kiem_ngu` (Kiếm Ngư), họ `swim`, khung game 96×96. Mức kiểm chung: **nhẹ**.


## toA

- File: `toA.png`, **1024×1536**, 1952455 byte, SHA256 `fb28a600888fddb985cb2bad36f2890f6f4eb22d76a2039abbe3d5a357080aed`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: soul_land_game-764.
- Prompt: `toA.prompt.txt` (SHA256 `ce56c1691dd5f6f01bd006864e9a24a60bc8c8b514a167e359c5e9273205c692`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 87% so với ảnh tĩnh (lệch 13%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1813254 byte, SHA256 `556a15f84ec959ec67546bddba5299a9346a0aa8a76a4e1855a12a7db8174c64`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: soul_land_game-764.
- Prompt: `toB.prompt.txt` (SHA256 `954bfd3024bd0a61a674c01ae13cf5f2db8821b393b014492b6b6d8112613a35`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n pass).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 89% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## to-s

- File: `to-s.png`, **1536×1024**, 1673659 byte, SHA256 `68da27cd41d73308323a37da4340f475d1808d7c3272a12a8d73eed90cb60e92`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-778.
- Prompt: `to-s.prompt.txt` (SHA256 `9137dfb0bdf663dc63237f3f99114a73cc501c857ac896984764a2230a3aa532`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 174% so với ảnh tĩnh (lệch 74%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## to-ne

- File: `to-ne.png`, **1536×1024**, 1733612 byte, SHA256 `81b303a948401294fceeb8110da97d8a2ed2b3845bd0ba30fdae723b5eb70965`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-797.
- Prompt: `to-ne.prompt.txt` (SHA256 `221fae1be73c3e537ce9ce9bb04b7b195c88d73355ce6b94254ef4982a5e548a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 156% so với ảnh tĩnh (lệch 56%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## RAW vòng trước đã chuyển vào candidates

Các bộ PNG, prompt và source.json dưới đây giữ nguyên byte blob Git trước vòng 2.

### to-ne-778-final

- File: `candidates/to-ne-778-final.png`, **1536×1024**, 1702470 byte, SHA256 `e3f84c0e36045ff6a506b0375350abc8e37bb429f66e89723980d35388914678`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-778.
- Prompt: `candidates/to-ne-778-final.prompt.txt` (SHA256 `e0265746bee07b06b07007efdca2e97be11cc162e318d5c507464f94fa7f469e`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 163% so với ảnh tĩnh (lệch 63%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Các lượt bổ sung vòng 2 (phiên 797)

Các mục sau sinh bằng beast-nguon trên staging LF của từng ứng viên; tờ lỗi không dùng làm tham chiếu.

### to-ne-797-attempt1

Không thu được RAW: nhóm yêu cầu đầu lỗi bộ lọc, không thu được RAW hướng này. Yêu cầu này vẫn tính trong trần lượt bổ sung.

### to-ne-797-attempt2

- File: `candidates/to-ne-797-attempt2.png`, **1536×1024**, 1756053 byte, SHA256 `ce5f64bce1ab209d1310ddb001f69451434760f00cbd888b1c4f2edfb41eb02c`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt2.prompt.txt` (SHA256 `509c9a9a0442fb7f4fbcb2dee4047293588dc16393cd4cf3d0913607d21dc168`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ne chặn).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: điểm sáng giống mắt ở chân kiếm. **Không chọn cho bản nhập cuối.**

### to-ne-797-attempt3

- File: `candidates/to-ne-797-attempt3.png`, **1536×1024**, 1733612 byte, SHA256 `81b303a948401294fceeb8110da97d8a2ed2b3845bd0ba30fdae723b5eb70965`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt3.prompt.txt` (SHA256 `221fae1be73c3e537ce9ce9bb04b7b195c88d73355ce6b94254ef4982a5e548a`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.
- Ghi chú lượt / nhập: đạt; không thấy mắt, cỡ sau khớp lệch 4,6%. **Được chọn cho hướng đã nhập.**

## Lỗi

```text
LỖI: toB — hình ở ô trống — H4 (ne) C5, H4 (ne) C6 — ô trống có hình (1.1% diện tích ô): hình tràn từ ô bên; ô trống có hình (1.35% diện tích ô): hình tràn từ ô bên.
LỖI: candidates/to-ne-778-final — chân lệch — H3 (ne) C3–4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 18%).
LỖI: candidates/to-ne-778-final — Phiên 778: CHẶN: 3 lượt vẫn có mắt bên đầu ở ne; giữ fallback. (mắt)
LỖI: candidates/to-ne-797-attempt2 — hình dính — H3 (ne) — dải có 3 hình, cần 6: hình dính nhau.
LỖI: candidates/to-ne-797-attempt2 — điểm sáng giống mắt ở chân kiếm (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/kiem_ngu/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Kiếm Ngư: toA 1024×1536, toB 1254×1254, to-s 1536×1024, to-ne 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
