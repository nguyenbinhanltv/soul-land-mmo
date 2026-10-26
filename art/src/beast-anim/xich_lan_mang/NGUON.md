# Xích Lân Mãng — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species xich_lan_mang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `xich_lan_mang` (Xích Lân Mãng), họ `snake`, khung game 96×96. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1659**, 1841914 byte, SHA256 `d1e8c8455f6b2bbdf960ac56a2b42917436639bcadfa0bee4c0d218aad02aaa1`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `9dc205c6ed2f26ff3dd7b8f7923b16d75ce2250543bcc5b767c95c49f4f79310`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ?).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1879248 byte, SHA256 `c15ddce0dd95e64fc6d11674eae1810497a6604b8aef016760f8b6602bb5b675`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `48310fac1f5f6359625dbc2dc0c19d9e1ee3090c6d0b8686c54df647aafeae36`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## Lỗi

```text
LỖI: toA — sai kích thước — toàn tờ — 948×1659 không đúng tỉ lệ nào trong tập cho phép (A 2:3, B 1:1, một hướng 3:2).
LỖI: toB — chân lệch — H8 (n) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%).
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/xich_lan_mang/` | - | ChatGPT / Codex image_gen.imagegen (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Xích Lân Mãng (H4 #774; Part of #774 và #766): A1 `art/src/beast-anim/xich_lan_mang/toA.png` (948×1659, SHA-256 `d1e8c8455f6b2bbdf960ac56a2b42917436639bcadfa0bee4c0d218aad02aaa1`) và B1 `toB.png` (1254×1254, SHA-256 `c15ddce0dd95e64fc6d11674eae1810497a6604b8aef016760f8b6602bb5b675`), tthoadev sinh 2026-10-26 bằng built-in `image_gen.imagegen`; mỗi sheet một call, tổng 2 call (31,1 giây + 39,9 giây), model/seed unknown. A chỉ dùng static `shared/assets/sprites/beast/xich_lan_mang.png`; B dùng static rồi A1 RAW candidate thật làm ảnh tham chiếu 2; A chưa owner art-approved, addendum prompt B làm rõ giả định sai trong mẫu. RAW nguyên byte, không hậu kỳ/cắt/resize. `beast:check`: A bị chặn kỹ thuật do sai tỉ lệ 2:3; B 1254² hợp lệ, có finding chân lệch H8 (n) C4 13%. Soát mắt: A S H2 và SE H6 walk quay ngang sang phải, S H4 và SE H8 die nằm ngang; B NE H1 hurt/H2 walk/H3 attack lộ mặt, NE H4 die nằm ngang; N H6 walk/H7 attack lộ mặt, N H8 die nằm ngang. Sau merge `origin/main` tại `f0583771b9991518f832b481883bb3a04500c130`, `npm run check` exit 0 (5 cảnh báo sheet trống có sẵn, 0 lỗi) và `npm run build` exit 0. Prompt thực thi/hash/roles, provenance, NGUON tự sinh: `art/src/beast-anim/xich_lan_mang/`. Chưa artaccepted/imported. | - | Chuyển một lần từ art/CREDITS.md (#973) |
