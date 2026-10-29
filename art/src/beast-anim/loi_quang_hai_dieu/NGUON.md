# Lôi Quang Hải Diêu — RAW hoạt ảnh (#1277)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species loi_quang_hai_dieu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `loi_quang_hai_dieu` (Lôi Quang Hải Diêu), họ `swim`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 1802902 byte, SHA256 `8a9d91f96fd89adbb31e3d7c45391c5a2302ed2e381558f68264e62058be7e04`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-797.
- Prompt: `toA.prompt.txt` (SHA256 `d7ab5eb5f5fb1925883c06958168ec6b1bc5a02fd5e0b65d9c0487c066ce0b7f`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se nhẹ, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (se): cỡ thân idle 62% so với ảnh tĩnh (lệch 38%, quá 25%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 35% so với ảnh tĩnh (lệch 65%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1784625 byte, SHA256 `4d56375c1e7a06bc3bb34b82a700e92188df921d1d3d49653fb9578faa6e18e4`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 1; phiên: soul_land_game-797.
- Prompt: `toB.prompt.txt` (SHA256 `5843072d10f1039c99689decfcbd04596bddca93766df4f9afdb80d751408c47`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 60% so với ảnh tĩnh (lệch 40%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## to-ne

- File: `to-ne.png`, **1536×1024**, 1696635 byte, SHA256 `c7e042567219ac99f1ca55dbebfb395d4844ee6b0368930c6ef31211d74eec69`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 3; phiên: soul_land_game-797.
- Prompt: `to-ne.prompt.txt` (SHA256 `bcf7b86df07112bdae599774997b428687867244f12afc9dd7672cadce33c9c3`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 127% so với ảnh tĩnh (lệch 27%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 4 mục lỗi (dòng `LỖI:` bên dưới).

## to-n

- File: `to-n.png`, **1536×1024**, 1591061 byte, SHA256 `b49777056e24f8192d7b344f278aae582ccbfc09f3f5d0055381d89f1ed63f05`.
- Công cụ: image_gen.imagegen; model: unknown; seed: unknown; số lượt: 3; phiên: soul_land_game-797.
- Prompt: `to-n.prompt.txt` (SHA256 `e0804723deda8a0a293ffff5f0a5c3ae55c075da3ac751cbab574550efb536cb`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 159% so với ảnh tĩnh (lệch 59%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 4 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — chân lệch — H10 (e) C3–6 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 20%).
LỖI: toA — Lịch sử trước vòng 2 phiên797: chân lệch — H10 (e) C3–6 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 20%). (mắt)
LỖI: to-ne — Lịch sử trước vòng 2 phiên797: Phiên 778: CHẶN nhập: 3 lượt; lượt 3 mắt ít hơn nhưng cutter vẫn vượt khung toàn loài, sau khớp ne lệch -23,1%; không dùng --scale, giữ fallback. (mắt) (mắt)
LỖI: to-ne — CHƯA ĐẠT — Vòng2 phiên797 lượt 1/3: nhóm yêu cầu đầu lỗi bộ lọc, không thu được RAW hướng này (mắt)
LỖI: to-ne — CHƯA ĐẠT — Vòng2 phiên797 lượt 2/3: đạt mắt nhưng đuôi dài: vượt khung, lệch sau khớp -35%; không --scale; RAW candidates/to-ne-797-attempt2.png; SHA256 963e730b1881ad24de2f2eefbef6b79617b1d332da85644dcfcadd0ce3413426 (mắt)
LỖI: to-ne — CHƯA ĐẠT — Vòng2 phiên797 lượt 3/3: đuôi ngắn hơn nhưng lộ mắt cạnh đầu; không nhập; RAW candidates/to-ne-797-attempt3.png; SHA256 b5e11433f7d801d01812d0ccbf5439964bbe7925b1243901e57848a65950bf64 (mắt)
LỖI: to-n — Lịch sử trước vòng 2 phiên797: Phiên 778: CHẶN nhập: lượt 1 nhìn sau sạch mặt nhưng cutter vượt khung toàn loài và sau khớp n lệch -20,5%; không dùng --scale, giữ fallback. (mắt) (mắt)
LỖI: to-n — CHƯA ĐẠT — Vòng2 phiên797 lượt 1/3: nhóm yêu cầu đầu lỗi bộ lọc, không thu được RAW hướng này (mắt)
LỖI: to-n — CHƯA ĐẠT — Vòng2 phiên797 lượt 2/3: đạt mắt nhưng đuôi dài: vượt khung, lệch sau khớp -46,2%; không --scale; RAW candidates/to-n-797-attempt2.png; SHA256 2cabe84ace6a0da6f4facef6330ef682dbce9e903d7f6fa516ff5f9f1956d0bb (mắt)
LỖI: to-n — CHƯA ĐẠT — Vòng2 phiên797 lượt 3/3: đạt mắt; nhập riêng n vẫn bị chặn vượt khung ở cấu hình trộn; không dùng --scale nên giữ dự phòng; RAW candidates/to-n-797-attempt3.png; SHA256 360257820619160c11c7c26d2eca9f8252f6e861eb577e466f334906ea77a131 (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/loi_quang_hai_dieu/` | - | image_gen.imagegen | RAW hoạt ảnh Lôi Quang Hải Diêu: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
