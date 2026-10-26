# Lôi Dực Ưng — RAW hoạt ảnh (#772)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species loi_duc_ung`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `loi_duc_ung` (Lôi Dực Ưng), họ `bird`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## toA

- File: `toA.png`, **948×1659**, 2003281 byte, SHA256 `730d7bfd27da7ee33b5d04565ba50f529cd752e43f957a5f57894afa792f0586`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `1d29763bad7e222a6cb645b5f6951c2fb2ae5e2db563f8cd1083f29822374ef1`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1992399 byte, SHA256 `f32a4d79d697682700baff856d34e496a82b7b06f0c2a3fcac3a602c4193fc5d`.
- Công cụ: Codex image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toB.prompt.txt` (SHA256 `f0389cb0609cb228906eea8676818ea4130bce800327b6dd51b72d9a762e7c41`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — hình ở ô trống / cỡ thân lệch — H8 (se) C5, H8 (se) C6, H1–4 (s) — ô trống có hình (7.67% diện tích ô): hình tràn từ ô bên; ô trống có hình (4.28% diện tích ô): hình tràn từ ô bên; cỡ thân idle 89% so với ảnh tĩnh (lệch 11%).
LỖI: toA — pose — S H4 D3 — die nằm ngang, lệch trục hướng (mắt)
LỖI: toB — pose — NE H4 D3 — die nằm ngang, lệch trục hướng (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/loi_duc_ung/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Lôi Dực Ưng (H4 #772): `art/src/beast-anim/loi_duc_ung/toA.png` (948×1659, A1) và `toB.png` (1254×1254, B2); B1 giữ candidate trong `candidates/`. Sinh ngày 2026-10-26 bằng Codex `image_gen.imagegen`, tổng 3 lượt (A1+B1+B2), model/seed unknown. Static đúng loài làm ref A; B dùng static rồi A1 candidate chưa owner-approved. RAW nguyên byte, không resize/crop/hậu kỳ. Checker chặn A vì tỉ lệ; theo rule owner đây là cảnh báo kỹ thuật, không phải `LỖI`. Soát mắt: A S H4 D4 và B NE H4 D4 chết nằm ngang lệch trục. Prompt, SHA, refs, lượt và findings: [NGUON.md](src/beast-anim/loi_duc_ung/NGUON.md), `toA/toB.prompt.txt`, `toA/toB.source.json` và candidate B1; chưa artaccepted/imported. | - | Chuyển nguyên văn từ `art/CREDITS.md` (#973) |
| `shared/assets/sprites/beast/loi_duc_ung_anim.png` | `beast_loi_duc_ung_anim` | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4 #1053) + tools/assets/beast-sheet-cut.mjs | Tờ thô `toA.png` và `toB.png` cùng thư mục; tham chiếu ảnh tĩnh `beast/loi_duc_ung.png`; công cụ không cung cấp model ID hay seed | 2026-10-27 | beast-sheet-cut.mjs (cutter v2, chuẩn hóa kích thước mặc định; hệ số 0.586 tự động khớp ảnh tĩnh); 24 màu, sheet 6×20 khung 96×96; normal.mjs --frame 96x96; orchestrator tự duyệt (ca đêm): nhẹ — `ne` thấy mặt nghiêng (thân chếch, chưa chính diện), die một số khung nằm hơi ngang |
