# Băng Vũ Ưng — RAW hoạt ảnh (#867)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bang_vu_ung`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bang_vu_ung` (Băng Vũ Ưng), họ `bird`, khung game 96×96. Mức kiểm chung: **chưa có tờ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1757194 byte, SHA256 `36947ef5fb200343db9a1ad316635a03c12b6d06c85d6378cb66b2f632af42e8`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `turnaround.prompt.txt` (SHA256 `c734f97055ac215e9422eab08b5a0a02d5d7b92ce4b0c3257e7b472076791173`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: không kiểm tự động (ảnh mẫu 5 hướng, chỉ xem bằng mắt).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Lỗi

Không có dòng `LỖI:`.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bang_vu_ung/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Băng Vũ Ưng (H4 #772, turnaround; Part of #867 và #772): RAW `art/src/beast-anim/bang_vu_ung/turnaround.png` (1536×1024, lượt 1/1, sinh ngày 2026-10-26 bằng builtin Codex `image_gen.imagegen`; model và seed unknown). Chỉ tham chiếu ảnh tĩnh cùng loài `shared/assets/sprites/beast/bang_vu_ung.png`. RAW nguyên byte, không resize / cắt / chỉnh; prompt và provenance nằm cùng thư mục ở `turnaround.prompt.txt`, `turnaround.source.json`, `NGUON.md`. Chờ chủ repo duyệt art; chưa cắt hoặc nhập game. | - | Chuyển một lần từ art/CREDITS.md (#973) |
