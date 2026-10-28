# Lôi Văn Hầu — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species loi_van_hau`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `loi_van_hau` (Lôi Văn Hầu), họ `quad`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1690048 byte, SHA256 `bfdac8087eaa8d7e6d3677e3bf2c3d274c643ef60b8b0da770a7f57978d1ffa2`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-745.
- Prompt: `turnaround.prompt.txt` (SHA256 `4b123fcc53d872e928f5314a467febdd48e2ccc89be7bb997f4d4054d3e0d4a6`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **1024×1536**, 2179981 byte, SHA256 `c4501b0bbfed0c05c27217b307ed6e6534a7d302482754c95a4951850ac53260`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-745.
- Prompt: `toA.prompt.txt` (SHA256 `18ea10efd0becf6ab840f6da5035f0dda85f22ae9f32443e10e5c06fc266fd21`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 86% so với ảnh tĩnh (lệch 14%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1991633 byte, SHA256 `d5dc0a2796b9853423107b905ce9c69bad626d5dbbdb8f6083f3abe3711774ad`.
- Công cụ: builtin image_gen__imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo; phiên: soul_land_game-745.
- Prompt: `toB.prompt.txt` (SHA256 `e30d4fea079350f8829ad0d14ba37a4d3e4a9ef2009bd0f8370fdbea78c570ef`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 117% so với ảnh tĩnh (lệch 17%); cutter neo lại, không chặn.
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## to-n

- File: `to-n.png`, **1536×1024**, 1873295 byte, SHA256 `fb9ee6742c413339e8278a673ee5bbbd91ef836a48829d66be62eaf4946a8cbe`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-745.
- Prompt: `to-n.prompt.txt` (SHA256 `5b3836c47ce4f3f4b55da6f310ffd3a038914a2a8f2f0c58f38a1f465df83d32`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 215% so với ảnh tĩnh (lệch 115%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Lỗi

```text
LỖI: toB — chân lệch / hình ở ô trống — H4 (ne) C1, H8 (n) C5 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%); ô trống có hình (0.46% diện tích ô): hình tràn từ ô bên.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/loi_van_hau/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Lôi Văn Hầu (H4 #769): RAW `art/src/beast-anim/loi_van_hau/toA.png` (1024×1536 IHDR, A1/1, session93) và `toB.png` (1254×1254 IHDR, sai yêu cầu 1024×1024, B1/1, session95), tthoadev sinh ngày 2026-10-26 bằng builtin `image_gen.imagegen`. A chỉ reference static gốc đúng loài; B đính static identity trước, A1 style/cỡ thân sau, không dùng pose sai làm mẫu. Model ảnh/seed unknown; size chỉ yêu cầu trong prompt. Nguyên byte, không hậu kỳ/cắt/resize. [Nguồn và lỗi](src/beast-anim/loi_van_hau/NGUON.md), `toA.prompt.txt`, `toB.prompt.txt`, `toA.source.json`, `toB.source.json`. Q44/điều khoản công cụ, không tự gán CC0. Cặp RAW còn lỗi hướng/pose/hurt/style/nền/cỡ và tràn ô; chưa owner duyệt mỹ thuật/runtime. Submitted 2/10, không đồng nghĩa accepted/merged/imported; Part of #769 và #766. | - | Chuyển một lần từ art/CREDITS.md (#973) |
