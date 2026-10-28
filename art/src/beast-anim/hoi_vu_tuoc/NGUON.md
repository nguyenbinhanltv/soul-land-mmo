# Hôi Vũ Tước — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species hoi_vu_tuoc`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `hoi_vu_tuoc` (Hôi Vũ Tước), họ `bird`, khung game 64×64. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1512268 byte, SHA256 `32f5d3768784489b5cba21c538cc86583cba7a430a1708f4b2417baa0e64a33a`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-745.
- Prompt: `turnaround.prompt.txt` (SHA256 `22bba6a066e1b66706a75bd5ce0a54ccc130068e296d9f0a20f4bfa7aeada7a0`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **948×1660**, 1779427 byte, SHA256 `e265549dd7374c2b1d61ca0d3ba01f76a0253223fc70d41a0c9e96f016869465`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-745.
- Prompt: `toA.prompt.txt` (SHA256 `ffad568a9941c07256b9aaf096dc26204343d2aa69ff1648060ca3b00531ad02`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 87% so với ảnh tĩnh (lệch 13%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1771258 byte, SHA256 `bbfb540aa83a195a8ca5e63b4b11cd89310a9af8631f831bed20e0ef15434b06`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-745.
- Prompt: `toB.prompt.txt` (SHA256 `8e7091ab03194b5085b4762f03f366553191a14ddbf258f4633adf8d39ea157b`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 128% so với ảnh tĩnh (lệch 28%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## to-n

- File: `to-n.png`, **1536×1024**, 1665751 byte, SHA256 `24d3f2f35f6bda9e15b9eb2c26dc1b38fcfc8456af9428450cc1b30f4bc365d8`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-745.
- Prompt: `to-n.prompt.txt` (SHA256 `a092978124b2f1458cb0958acf04ac8230e0921be05b39d61978a1038ccb4a05`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 224% so với ảnh tĩnh (lệch 124%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### to-ne (candidates)

- File chọn: `candidates/to-ne-attempt3.png`, **1536×1024**, SHA256 `03f5cd2759582d73967b5f6f7e66c04a3b36babadf7aa105146789d410071e3d`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — pose — H4 D4 (s) — die nằm ngang, lệch trục hướng (mắt)
LỖI: toB — hướng/pose — NE H1–H4 — lộ mắt/mỏ (mắt)
LỖI: toB — pose — N H8 D4 — die nằm ngang, lệch trục hướng (mắt)
LỖI: to-ne — ne — hết 3 lượt; đánh C3–C4 và die C3–C4 lộ mắt, giữ fallback. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/hoi_vu_tuoc/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Hôi Vũ Tước (H4 #772): `art/src/beast-anim/hoi_vu_tuoc/toA.png` (948×1660, A1) và `toB.png` (1254×1254, B2); B1 giữ candidate trong `candidates/`. Sinh ngày 2026-10-26 bằng builtin `image_gen.imagegen`, tổng 3 lượt (A1+B1+B2), model/seed unknown. Static đúng loài làm ref A; B dùng static rồi A1 làm candidate ref, chưa owner-approved. RAW nguyên byte, không resize/crop/hậu kỳ. A tỉ lệ sai; B có lỗi NE lộ mặt/mỏ và N D4 chết nằm ngang lệch trục. Checker cũng báo cỡ thân lệch 11%, nhưng theo rule owner đây là cảnh báo kỹ thuật, không phải `LỖI`. Prompt, SHA, refs, lượt và findings: [NGUON.md](src/beast-anim/hoi_vu_tuoc/NGUON.md) cùng `toA/toB.prompt.txt` và `toA/toB.source.json`; chưa artaccepted/imported. | - | Chuyển nguyên văn từ `art/CREDITS.md` (#973) |
