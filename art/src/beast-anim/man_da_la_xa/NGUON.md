# Mạn Đà La Xà — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species man_da_la_xa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `man_da_la_xa` (Mạn Đà La Xà), họ `snake`, khung game 96×96. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1659**, 1849972 byte, SHA256 `f5e1233f246cdfc7e8b52288f23fc24ecd8f29261c60745e84a354d4cc5825a3`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `bc408d937c904e56be51b7f142fa8bf8a49441c4a6a14613226b4f547b1c8f74`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ?).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1828701 byte, SHA256 `7dbc21ef9fb44b8a8258a6ba65e257b09dfe84da9fcf86cf3e1f782c6cf50545`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `557fe41cc9ddc26e496ba17e7c19dbfb0484e5a979c1c1ad4df8944776e346e5`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## Lỗi

```text
LỖI: toA — sai kích thước — toàn tờ — 948×1659 không đúng tỉ lệ nào trong tập cho phép (A 2:3, B 1:1, một hướng 3:2).
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/man_da_la_xa/` | - | ChatGPT / Codex image_gen.imagegen (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Mạn Đà La Xà (H4 #773): RAW `art/src/beast-anim/man_da_la_xa/toA.png` (948×1659, A1/1) và `toB.png` (1254×1254, B1/1), tthoadev sinh ngày 2026-10-26 bằng builtin `image_gen.imagegen`, mỗi lượt một call (38,2 giây và 42,8 giây); model/seed unknown. A chỉ dùng static `shared/assets/sprites/beast/man_da_la_xa.png`; B dùng static rồi A1 RAW candidate làm tham chiếu thật, chưa owner art-approved. RAW nguyên byte, không hậu kỳ/cắt/resize. `beast:check` exit 1: A1 bị chặn kỹ thuật vì 948×1659 không đúng tỉ lệ A 2:3; B1 1254×1254 hợp lệ và pass tự động. Mắt thấy A: S H4 D3–D4 và SE H8 D3–D4 die nằm ngang, lệch trục hướng. B: NE H1 idle/hurt, H2 walk, H3 attack lộ mặt; NE H4 D0–D3 die nằm ngang, lệch trục; N H7 attack lộ mặt; N H8 D2–D3 die nằm ngang, lệch trục. `beast:nguon` và `beast:status` hoàn tất; status đánh dấu thiếu tờ do A bị chặn. `npm run check` và `npm run build` exit 0; check có 5 cảnh báo sheet trống sẵn có. Prompt thật, SHA-256, reference roles và provenance: `art/src/beast-anim/man_da_la_xa/toA.prompt.txt`, `toB.prompt.txt`, `toA.source.json`, `toB.source.json`. Part of #773 và #766; submission chưa phải artaccepted/imported. | - | Chuyển một lần từ art/CREDITS.md (#973) |
