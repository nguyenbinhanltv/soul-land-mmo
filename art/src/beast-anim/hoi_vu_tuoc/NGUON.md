# Hôi Vũ Tước — RAW hoạt ảnh (#772)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species hoi_vu_tuoc`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `hoi_vu_tuoc` (Hôi Vũ Tước), họ `bird`, khung game 64×64. Mức kiểm chung: **chặn**.

## toA

- File: `toA.png`, **948×1660**, 1779427 byte, SHA256 `e265549dd7374c2b1d61ca0d3ba01f76a0253223fc70d41a0c9e96f016869465`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `2ad3ce5d8a38da91395e8bafeacee85c7f393a0e8fd941dfb7fc6670f3d1d7ff`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se pass, e nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1771258 byte, SHA256 `bbfb540aa83a195a8ca5e63b4b11cd89310a9af8631f831bed20e0ef15434b06`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toB.prompt.txt` (SHA256 `571c24ed037e31d7e0603c847323be22575cb6c8485549cb841fbb52ecb890f4`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ne pass, n chặn).
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — cỡ thân lệch — H9–12 (e) — cỡ thân idle 90% so với ảnh tĩnh (lệch 10%).
LỖI: toA — pose — H4 D4 (s) — die nằm ngang, lệch trục hướng (mắt)
LỖI: toB — cỡ thân lệch — H5–8 (n) — cỡ thân idle 132% so với ảnh tĩnh (lệch > 25%).
LỖI: toB — hướng/pose — NE H1–H4 — lộ mắt/mỏ (mắt)
LỖI: toB — pose — N H8 D4 — die nằm ngang, lệch trục hướng (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/hoi_vu_tuoc/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Hôi Vũ Tước (H4 #772): `art/src/beast-anim/hoi_vu_tuoc/toA.png` (948×1660, A1) và `toB.png` (1254×1254, B2); B1 giữ candidate trong `candidates/`. Sinh ngày 2026-10-26 bằng builtin `image_gen.imagegen`, tổng 3 lượt (A1+B1+B2), model/seed unknown. Static đúng loài làm ref A; B dùng static rồi A1 làm candidate ref, chưa owner-approved. RAW nguyên byte, không resize/crop/hậu kỳ. A tỉ lệ sai; B có lỗi NE lộ mặt/mỏ và N D4 chết nằm ngang lệch trục. Checker cũng báo cỡ thân lệch 11%, nhưng theo rule owner đây là cảnh báo kỹ thuật, không phải `LỖI`. Prompt, SHA, refs, lượt và findings: [NGUON.md](src/beast-anim/hoi_vu_tuoc/NGUON.md) cùng `toA/toB.prompt.txt` và `toA/toB.source.json`; chưa artaccepted/imported. | - | Chuyển nguyên văn từ `art/CREDITS.md` (#973) |
