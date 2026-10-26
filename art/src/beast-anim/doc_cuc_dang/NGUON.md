# Độc Cức Đằng — RAW hoạt ảnh (#776)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species doc_cuc_dang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `doc_cuc_dang` (Độc Cức Đằng), họ `plant`, khung game 96×96. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1659**, 2087887 byte, SHA256 `4d48509ddea00698808b0f9ffa93ef4fc5f69e5e538d4fb95deb2a91acea2a06`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `a3c59b0c02e035f3cb939f9cdadaed6bdcbf678410bda45a2bae5a2272e07a2c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ?).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 2113569 byte, SHA256 `796cc824e9d20f475c9ceea02a6bea57e9311c6bec7cd21bcd7bff8e7e3dc3ee`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `93eddd398c4d28da587efdd071c1bf2bec856b1f8bf63f90ff645a9f1662910b`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ne chặn, n pass).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — sai kích thước — toàn tờ — 948×1659 không đúng tỉ lệ nào trong tập cho phép (A 2:3, B 1:1, một hướng 3:2).
LỖI: toB — hình dính — H3 (ne) — dải có 4 hình, cần 6: hình dính nhau.
LỖI: toB — pose — hướng ne H4 C3–4 — die nằm ngang, không theo trục hướng ne (mắt)
LỖI: toB — pose — hướng n H8 C3–4 — die nằm ngang, không theo trục hướng n (mắt)
```
