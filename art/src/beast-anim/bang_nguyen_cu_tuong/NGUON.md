# Băng Nguyên Cự Tượng — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bang_nguyen_cu_tuong`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bang_nguyen_cu_tuong` (Băng Nguyên Cự Tượng), họ `quad`, khung game 128×128. Mức kiểm chung: **pass**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1882684 byte, SHA256 `f858ee9efdbf978fa0290fd2f4d6caef06c896099734490fa62dc02cee5f9465`.
- Công cụ: Codex built-in image_gen.imagegen; HURT / ATTACK chỉnh tay theo quyết định orchestrator #1030 (turnaround.prompt.txt; bản gốc của công cụ không giữ lại; lượt 2 ở candidates/turnaround-attempt2.*); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: tthoadev.
- Prompt: `turnaround.prompt.txt` (SHA256 `b32a57130f0533e10a33ddd4482ef2d543750ca1c92175f41dcd056c46c702cb`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — hurt — NE — chân trước hơi quỳ khi bị đánh (nhẹ); chưa có tờ A–E (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bang_nguyen_cu_tuong/` | - | Codex built-in image_gen.imagegen; HURT / ATTACK chỉnh tay theo quyết định orchestrator #1030 (turnaround.prompt.txt; bản gốc của công cụ không giữ lại; lượt 2 ở candidates/turnaround-attempt2.*) | RAW hoạt ảnh Băng Nguyên Cự Tượng: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
