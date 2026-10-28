# Thâm Hải Ma Kình — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species tham_hai_ma_kinh`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `tham_hai_ma_kinh` (Thâm Hải Ma Kình), họ `swim`, khung game 128×128. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1632477 byte, SHA256 `a8e3b2c6e2ad097696b60f178fcedb1c519180d6e62e6a3169c9b25818e4375d`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-764.
- Prompt: `turnaround.prompt.txt` (SHA256 `b2fddbaa29b466737b754160e2001f2d1259ee1a95ed9cc80bc252988d32a7c1`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **1536×1024**, 1801334 byte, SHA256 `b77e3817a3a7a890e7e5c97a2df84b38e2bd6233869cbb9459eccaf15a1dde89`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-764.
- Prompt: `toA.prompt.txt` (SHA256 `69ed3dceac5177bb1ae23d5384f25349217af9f344c6eb0996eb681f96e40b6c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 118% so với ảnh tĩnh (lệch 18%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1536×1024**, 1755524 byte, SHA256 `d3b91943d9c876a1b2f73115a8aac7dfa1a254d2927851e12d54b65f3ae520d4`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-764.
- Prompt: `toB.prompt.txt` (SHA256 `a45727dc2ec838cdc2c7a709553a7aad23c27d8593cfaea4fe1460f5217d67e2`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: se pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toC

- File: `toC.png`, **1536×1024**, 1736938 byte, SHA256 `4dff2166f15c4fa3fb2c2d19aeace2eac989462c1c96a412b501dcf317163dd3`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-764.
- Prompt: `toC.prompt.txt` (SHA256 `c9dc54ed8f5259e184912b366774a8481c7271e18c18928988f60bcc79783be0`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### toD (candidates)

- File chọn: `candidates/toD-attempt3.png`, **1536×1024**, SHA256 `7949c22e734dc98fdd77e8a14229b0d92061cc613b5a361b561387676cdb514c`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: **chưa duyệt bằng mắt**.

### toE (candidates)

- File chọn: `candidates/toE-attempt3.png`, **1536×1024**, SHA256 `30ec350697d6ef23b24ece0ea1209bad96b159e5df7a1dc62f8ac782fff192b0`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: **chưa duyệt bằng mắt**.

## Lỗi

```text
LỖI: turnaround — CHẶN: turnaround cũ vẫn không được duyệt; thêm đủ 3 lượt mới trong candidates/turnaround-lo4-attemptN: lượt1 n hai đuôi; lượt2 ne có mắt; lượt3 ne đảo đầu/đuôi. Chưa sinh ne/n, giữ fallback (mắt)
LỖI: toA — s: die còn mở mắt, biên độ chìm nhẹ (ghi chú cũ) (mắt)
LỖI: toB — se: die hơi xoay, hurt biên độ nhỏ (ghi chú cũ) (mắt)
LỖI: toC — e: attack ngẩng đầu mạnh, die còn mở mắt (ghi chú cũ) (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/tham_hai_ma_kinh/` | - | image_gen | RAW hoạt ảnh Thâm Hải Ma Kình: turnaround 1536×1024, toA 1536×1024, toB 1536×1024, toC 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
