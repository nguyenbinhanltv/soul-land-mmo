# Mạn Đà La Xà — RAW hoạt ảnh (#773)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species man_da_la_xa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `man_da_la_xa` (Mạn Đà La Xà), họ `snake`, khung game 96×96. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1659**, 1849972 byte, SHA256 `f5e1233f246cdfc7e8b52288f23fc24ecd8f29261c60745e84a354d4cc5825a3`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul-land-mmo-135.
- Prompt: `toA.prompt.txt` (SHA256 `bc408d937c904e56be51b7f142fa8bf8a49441c4a6a14613226b4f547b1c8f74`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ?).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1828701 byte, SHA256 `7dbc21ef9fb44b8a8258a6ba65e257b09dfe84da9fcf86cf3e1f782c6cf50545`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul-land-mmo-135.
- Prompt: `toB.prompt.txt` (SHA256 `557fe41cc9ddc26e496ba17e7c19dbfb0484e5a979c1c1ad4df8944776e346e5`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: 4 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — sai kích thước — toàn tờ — 948×1659 không đúng tỉ lệ nào trong tập cho phép (A 2:3, B 1:1, một hướng 3:2).
LỖI: toA — hướng/pose — S H4 D3–D4 — die nằm ngang, lệch trục hướng nam (mắt)
LỖI: toA — hướng/pose — SE H8 D3–D4 — die nằm ngang, lệch trục hướng đông-nam (mắt)
LỖI: toB — hướng — NE H1 I0–I3,H0–H1; H2 W0–W5; H3 A0–A5 — lộ mặt ở idle, hurt, walk, attack (mắt)
LỖI: toB — hướng/pose — NE H4 D0–D3 — die nằm ngang, lệch trục hướng đông-bắc (mắt)
LỖI: toB — hướng — N H7 A0–A5 — lộ mặt trong hàng attack (mắt)
LỖI: toB — hướng/pose — N H8 D2–D3 — die nằm ngang, lệch trục hướng bắc (mắt)
```
