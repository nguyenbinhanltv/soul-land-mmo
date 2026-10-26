# Cúc Yêu Hoa Linh — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species cuc_yeu_hoa_linh`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `cuc_yeu_hoa_linh` (Cúc Yêu Hoa Linh), họ `plant`, khung game 96×96. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **1024×1536**, 2036897 byte, SHA256 `c9b68033e6994c1aa7abaaeeb09a1454b086d612da5ac04b255b8ea0e453771c`.
- Công cụ: builtin Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `3f7d34c2707a4ac9a926a33f3deeaf95256990cce26b6fa2e1fdfcf12f0198c4`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: s chặn, se chặn, e chặn).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 1975951 byte, SHA256 `0d2a9f123de901bf7b0e1356b399aeed9c31f5c694055b5346258d0e34902f92`.
- Công cụ: builtin Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `92d0442662bba0287d0e3f3061c53d2d07262591d3a4eb57ad4919edd3dd9a7c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## Lỗi

```text
LỖI: toA — sai số hình — H1 (s), H2 (s), H3 (s), H5 (se), H6 (se), H7 (se), H9 (e), H10 (e), H11 (e) — dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/cuc_yeu_hoa_linh/` | - | ChatGPT / Codex image_gen.imagegen (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Cúc Yêu Hoa Linh (H4 #776; Part of #776 và #766): A1 `art/src/beast-anim/cuc_yeu_hoa_linh/toA.png` (1024×1536, SHA-256 `c9b68033e6994c1aa7abaaeeb09a1454b086d612da5ac04b255b8ea0e453771c`) và B1 `toB.png` (1254×1254 hợp lệ, SHA-256 `0d2a9f123de901bf7b0e1356b399aeed9c31f5c694055b5346258d0e34902f92`), tthoadev sinh ngày 2026-10-26 bằng builtin Codex `image_gen.imagegen`, mỗi sheet 1 call (32,3s + 39,0s), model/seed unknown. A chỉ dùng static cùng loài `shared/assets/sprites/beast/cuc_yeu_hoa_linh.png`; B dùng static rồi A1 candidate thật làm ref 2, chưa owner art-approved và addendum prompt B đính chính chữ “approved” của mẫu. RAW nguyên byte, không hậu kỳ/cắt/resize. `beast:check` A chặn (9 hàng có 7 hình thay vì 6), B đạt; soát contact sheet xác nhận S H4 D3 và SE H8 D3 của A, NE H4 D3 và N H8 D3 của B đổ nằm ngang, lệch trục hướng. Tờ A/B không bị báo sai tỉ lệ. `beast:nguon --species` và `beast:status` exit 0; `npm run check` và `npm run build` sau merge main exit 0. Kỹ thuật chưa đạt do A bị chặn; PR #980 giữ draft. Prompt thực thi/hash/ref role và provenance ở `art/src/beast-anim/cuc_yeu_hoa_linh/`. Chưa artaccepted/imported. | - | Chuyển một lần từ art/CREDITS.md (#973) |
