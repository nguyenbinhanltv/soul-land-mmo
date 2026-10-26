# Cúc Yêu Hoa Linh — RAW hoạt ảnh (#776)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species cuc_yeu_hoa_linh`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `cuc_yeu_hoa_linh` (Cúc Yêu Hoa Linh), họ `plant`, khung game 96×96. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **1024×1536**, 2036897 byte, SHA256 `c9b68033e6994c1aa7abaaeeb09a1454b086d612da5ac04b255b8ea0e453771c`.
- Công cụ: builtin Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul-land-mmo-135.
- Prompt: `toA.prompt.txt` (SHA256 `3f7d34c2707a4ac9a926a33f3deeaf95256990cce26b6fa2e1fdfcf12f0198c4`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: s chặn, se chặn, e chặn).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1975951 byte, SHA256 `0d2a9f123de901bf7b0e1356b399aeed9c31f5c694055b5346258d0e34902f92`.
- Công cụ: builtin Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul-land-mmo-135.
- Prompt: `toB.prompt.txt` (SHA256 `92d0442662bba0287d0e3f3061c53d2d07262591d3a4eb57ad4919edd3dd9a7c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — sai số hình — H1 (s), H2 (s), H3 (s), H5 (se), H6 (se), H7 (se), H9 (e), H10 (e), H11 (e) — dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời; dải có 7 hình, cần 6: thừa hình / mảnh rời.
LỖI: toA — s — S H4 D3 — die nằm ngang, đổi trục khỏi hướng s (mắt)
LỖI: toA — se — SE H8 D3 — die nằm ngang, đổi trục khỏi hướng se (mắt)
LỖI: toB — ne — NE H4 D3 — die nằm ngang, đổi trục khỏi hướng ne (mắt)
LỖI: toB — n — N H8 D3 — die nằm ngang, đổi trục khỏi hướng n (mắt)
```
