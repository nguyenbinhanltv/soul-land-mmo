# Mạn Đà La Xà — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species man_da_la_xa`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `man_da_la_xa` (Mạn Đà La Xà), họ `snake`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1667717 byte, SHA256 `07d61cfde19889b03070e62bce56ecaf3d9a0ace70ebd02504adc362ec30e3f9`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-745.
- Prompt: `turnaround.prompt.txt` (SHA256 `fe580a4f60256d4b0890f67b6acec2a168ab794282265443a95af1ea2ab2d12d`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **948×1659**, 1849972 byte, SHA256 `f5e1233f246cdfc7e8b52288f23fc24ecd8f29261c60745e84a354d4cc5825a3`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-745.
- Prompt: `toA.prompt.txt` (SHA256 `d03921965d3a6dc1f904e1a9acb8be44f6a0eaf6183915b51c707e7e074b7073`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se pass, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 85% so với ảnh tĩnh (lệch 15%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 131% so với ảnh tĩnh (lệch 31%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1828701 byte, SHA256 `7dbc21ef9fb44b8a8258a6ba65e257b09dfe84da9fcf86cf3e1f782c6cf50545`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-745.
- Prompt: `toB.prompt.txt` (SHA256 `20b861ac87d7acec9bc10867873efe495baa6d7639e12bea2a0e6accf3ce54df`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 89% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## to-n

- File: `to-n.png`, **1536×1024**, 1828949 byte, SHA256 `8fdaae9b408f8bc7a40254e741b2b9faf4cfbc5c932619baae5585a22a20115c`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-745.
- Prompt: `to-n.prompt.txt` (SHA256 `1ae385eee3880ed8cc35a05e8dd0869e9d1457bccc8c55c4b295cff0b3ceffde`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 171% so với ảnh tĩnh (lệch 71%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### to-ne (candidates)

- File chọn: `candidates/to-ne-attempt3.png`, **1536×1024**, SHA256 `6d27d82dd0d2251b1fb5131f7a0661f0e9e74d787e995efb4509d28c3557bbb8`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **chặn** (CHẶN: không vào thư mục chính).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: toA — die nằm ngang — S H4 D3–D4 và SE H8 D3–D4 — lệch trục hướng (mắt)
LỖI: toB — lộ mặt — NE H1 idle/hurt, H2 walk, H3 attack; N H7 attack — vi phạm quy tắc n/ne không thấy mặt (mắt)
LỖI: toB — die nằm ngang — NE H4 D0–D3 và N H8 D2–D3 — lệch trục hướng (mắt)
LỖI: to-ne — hình ở ô trống / hình dính — H4 (ne) C5, H4 (ne) — ô trống có hình (0.39% diện tích ô): hình tràn từ ô bên; dải có 3 hình, cần 4: hình dính nhau.
LỖI: to-ne — ne — hết 3 lượt; die còn chồng khoảng dò cột; chọn lượt 3, giữ fallback. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/man_da_la_xa/` | - | ChatGPT / Codex image_gen.imagegen (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Mạn Đà La Xà (H4 #773): RAW `art/src/beast-anim/man_da_la_xa/toA.png` (948×1659, A1/1) và `toB.png` (1254×1254, B1/1), tthoadev sinh ngày 2026-10-26 bằng builtin `image_gen.imagegen`, mỗi lượt một call (38,2 giây và 42,8 giây); model/seed unknown. A chỉ dùng static `shared/assets/sprites/beast/man_da_la_xa.png`; B dùng static rồi A1 RAW candidate làm tham chiếu thật, chưa owner art-approved. RAW nguyên byte, không hậu kỳ/cắt/resize. `beast:check` (công cụ hiện tại): không có lỗi chặn; A1 948×1659 hợp lệ (tờ A 0,55–0,70), B1 1254×1254 hợp lệ. Mắt thấy A: S H4 D3–D4 và SE H8 D3–D4 die nằm ngang, lệch trục hướng. B: NE H1 idle/hurt, H2 walk, H3 attack lộ mặt; NE H4 D0–D3 die nằm ngang, lệch trục; N H7 attack lộ mặt; N H8 D2–D3 die nằm ngang, lệch trục. `npm run check` và `npm run build` exit 0; check có 5 cảnh báo sheet trống sẵn có. Prompt thật, SHA-256, reference roles và provenance: `art/src/beast-anim/man_da_la_xa/toA.prompt.txt`, `toB.prompt.txt`, `toA.source.json`, `toB.source.json`. Part of #773 và #766; submission chưa phải artaccepted/imported. | - | Chuyển một lần từ art/CREDITS.md (#973) |
