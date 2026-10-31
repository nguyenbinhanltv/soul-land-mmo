# Thanh Lân Ngạc — RAW hoạt ảnh (#1425)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thanh_lan_ngac`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thanh_lan_ngac` (Thanh Lân Ngạc), họ `quad`, khung game 96×96. Mức kiểm chung: **pass**.

## guide

- File: `guide.png`, **1536×1024**, 1355297 byte, SHA256 `870bb723f5ee477c3ba3a1ce3526907f6440cdfba83954b348f3e3a897594dce`.
- Công cụ: image_gen.imagegen (ảnh dẫn một tư thế, không phải tờ hoạt ảnh); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-887.
- Prompt: `guide.prompt.txt` (SHA256 `6d54a9b7c55a5a4344a2511fb2d8c3b4f330cb06bdd6398a92bb3b276ed2f884`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Lỗi

Không có dòng `LỖI:`.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thanh_lan_ngac/` | - | image_gen.imagegen (ảnh dẫn một tư thế, không phải tờ hoạt ảnh) | RAW hoạt ảnh Thanh Lân Ngạc: guide 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |

Ảnh dẫn một tư thế: mức trên là kết luận bằng mắt; không tuyên bố đã qua kiểm lưới tờ.
