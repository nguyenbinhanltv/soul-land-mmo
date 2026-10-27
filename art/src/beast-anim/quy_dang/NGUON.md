# Quỷ Đằng — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species quy_dang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `quy_dang` (Quỷ Đằng), họ `vine`, khung game 128×128. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1969385 byte, SHA256 `7c3a4f2bd416735ba0837aed1715d787bca7791159fce794314f047e8ffa2712`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-625.
- Prompt: `turnaround.prompt.txt` (SHA256 `fb862b560205f3252cb8399b6ddd3b57556e79d3daa12fa68dd6dd9aa01954c2`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **1536×1024**, 2265078 byte, SHA256 `d710e0eda3b54c60ab489b958f93147cdc8bc792d4c0d100070403cd0c585d41`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-625.
- Prompt: `toA.prompt.txt` (SHA256 `3362fb5a08bcaa3c0cbb7a2a2474ed82bb58f403bb07508402fa61fb45b93ca5`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1536×1024**, 2259048 byte, SHA256 `41b7351b8f514a09d39496c208c11ec4787637d3e1db75f3d39f6492debb1044`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-625.
- Prompt: `toB.prompt.txt` (SHA256 `3443b94862e385820ad44caee69803fea4c6704709b0e5f7293d2a94317201ac`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: se pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toC

- File: `toC.png`, **1536×1024**, 2202902 byte, SHA256 `356fa86ae10c8b38c73cf5374cce712c41d59d37443eb4b3873e630b65c343d6`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-625.
- Prompt: `toC.prompt.txt` (SHA256 `43269982254f445b64de56bff65b3127145fbb3f81825f604c6989d8c97b9cb1`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toD

- File: `toD.png`, **1536×1024**, 2154233 byte, SHA256 `b1319da937f11c578e11bc611c68b2edb0346848ded0cd6088ed5b8420881ccb`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-625.
- Prompt: `toD.prompt.txt` (SHA256 `fceb82b7ad944bc852c30175ac32a38801c5ce4eaa6d7ff894db0b69fce9d092`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 116% so với ảnh tĩnh (lệch 16%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Lỗi

```text
LỖI: toA — hướng — H1 C5–6 hurt và H3 C3–4 attack nghiêng sang phải thay vì giữ s; chọn lượt 3 sau ba lượt (mắt)
LỖI: toC — hướng — nhiều khung e còn chếch mặt về người xem, gần se; chọn lượt 2 sau ba lượt vì 0 lỗi kỹ thuật (mắt)
LỖI: toD — hình ở ô trống — H4 (ne) C5 — ô trống có hình (0.51% diện tích ô): hình tràn từ ô bên.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/quy_dang/` | - | Codex image_gen.imagegen | RAW hoạt ảnh Quỷ Đằng: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
