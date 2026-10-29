# Thiết Giáp Tê Ngưu — RAW hoạt ảnh (#1277)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thiet_giap_te_nguu`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thiet_giap_te_nguu` (Thiết Giáp Tê Ngưu), họ `quad`, khung game 96×96. Mức kiểm chung: **nhẹ**.


## turnaround

- File: `turnaround.png`, **1536×1024**, 1745509 byte, SHA256 `4497c8f54d428908fa2239898f2470c9bf451d20842acd1b1201cde141d662c7`.
- Công cụ: unknown (công cụ sinh ảnh không công bố); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `turnaround.prompt.txt` (SHA256 `77f839726a4e4b465657717dfb9f2e14fe2dbf63823642ec06e5967a40e53213`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## toA

- File: `toA.png`, **1024×1536**, 2164280 byte, SHA256 `81094ae3e94da1fe50267798df822b3094ee007a378cfe7c80cd6b98c82a71d9`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toA.prompt.txt` (SHA256 `ed6d0148feb0ab7814310477a5823a3df423164834fe920db3ee9586b309bb58`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e pass).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).

## toB

- File: `toB.png`, **1254×1254**, 2104469 byte, SHA256 `4e77c897587f0528141348be2ae49a6c9ad82b6b24e31732f4912db5daba4f28`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: chưa khai báo.
- Prompt: `toB.prompt.txt` (SHA256 `f2489d533cb1b26232d587e8fe1f33d38621abca644257a1676f09e42268017f`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ, n nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## to-n

- File: `to-n.png`, **1536×1024**, 1795880 byte, SHA256 `b18a1fbfb684566b27bd0f7e0e6425e23cce9b12c0ea52250eba4facddea3b4f`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `to-n.prompt.txt` (SHA256 `afad5a4b8644de6fddf1bca5e63a3ca37c38d4fe60bd4c713e59ec3d5bde956f`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 189% so với ảnh tĩnh (lệch 89%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Sổ candidates trước vòng 2 (giữ lịch sử)

Ảnh chụp nguyên sổ trước vòng 2; trạng thái chưa vào thư mục chính dưới đây là trạng thái tại thời điểm cũ, không thay trạng thái tờ mới đã nhập.

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### to-ne (candidates)

- File chọn: `candidates/to-ne-attempt6.png`, **1536×1024**, SHA256 `44cea07d56a184e89f926de03464f75e47f333f43be14ce4f8304f2ab9856137`; lượt tìm thấy: 4, 5, 6.
- Số lượt đã dùng: 3; lượt được chọn: 6.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

### toD (candidates)

- File chọn: `candidates/toD-attempt3.png`, **1536×1024**, SHA256 `a9cb17c957474bebaddb3c7bb86ebf00d0bd4de5537abcb13488e97e72dac0da`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Tờ chưa vào thư mục chính (candidates)

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### to-ne (candidates)

- File chọn: `candidates/to-ne-attempt6.png`, **1536×1024**, SHA256 `44cea07d56a184e89f926de03464f75e47f333f43be14ce4f8304f2ab9856137`; lượt tìm thấy: 4, 5, 6.
- Số lượt đã dùng: 3; lượt được chọn: 6.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

### toD (candidates)

- File chọn: `candidates/toD-attempt3.png`, **1536×1024**, SHA256 `a9cb17c957474bebaddb3c7bb86ebf00d0bd4de5537abcb13488e97e72dac0da`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Các lượt bổ sung vòng 2 (phiên 797)

Các mục sau sinh bằng beast-nguon trên staging LF của từng ứng viên; tờ lỗi không dùng làm tham chiếu.

### to-ne-797-attempt1

- File: `candidates/to-ne-797-attempt1.png`, **1536×1024**, 2046122 byte, SHA256 `06d412a40a8e4eaee9b5a7c7a453c03276e43a9fe5eccbcb75621b5ad5d13549`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt1.prompt.txt` (SHA256 `c045cb8bd990570742ba116b34d22af011347cb31f441d289c357eefa01cf989`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: lộ mắt. **Không chọn cho bản nhập cuối.**

### to-ne-797-attempt2

- File: `candidates/to-ne-797-attempt2.png`, **1536×1024**, 1822768 byte, SHA256 `e7886dcc95d1973d41bf4abff97622dfba3a867ac820362ecdbabae23248a8eb`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt2.prompt.txt` (SHA256 `d971ea56fa969c4f054dd827f03284fd34c001395556eb856274eb928299fb65`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: còn chi tiết mắt cạnh đầu. **Lượt chọn tốt nhất trong vòng 2, vẫn chặn / giữ dự phòng.**

### to-ne-797-attempt3

- File: `candidates/to-ne-797-attempt3.png`, **1536×1024**, 2478260 byte, SHA256 `400b65643a72b2d1ea4ceeb15c1dc20a712739bb31a79f410ccef7ea4be9420f`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt3.prompt.txt` (SHA256 `7603732d905a754d343240dff64d2d8689abd2448ba467c7b61f42b60724121e`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ne chặn).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).
- Ghi chú lượt / nhập: thiếu khung die thứ tư, không nhập. **Không chọn cho bản nhập cuối.**

## Lỗi

```text
LỖI: toA — hình ở ô trống — H4 (s) C5, H4 (s) C6, H8 (se) C5, H8 (se) C6 — ô trống có hình (2.74% diện tích ô): hình tràn từ ô bên; ô trống có hình (3.7% diện tích ô): hình tràn từ ô bên; ô trống có hình (14.24% diện tích ô): hình tràn từ ô bên; ô trống có hình (15.7% diện tích ô): hình tràn từ ô bên.
LỖI: toB — hình ở ô trống — H4 (ne) C5 — ô trống có hình (0.45% diện tích ô): hình tràn từ ô bên.
LỖI: toB — nhập — hướng n — công cụ sinh ảnh từ chối tờ toE, chưa có RAW mới, giữ fallback (mắt)
LỖI: to-n — hurt trùng idle — H1 (n) C5–6 — hurt trùng idle (xor/hợp 0.077 / 0.076): không thấy phản ứng trúng đòn.
LỖI: to-ne — ne — bổ sung lượt 1–2 vẫn lộ mắt, candidates/to-ne-attempt4.png và to-ne-attempt5.png; chưa nhập. (mắt)
LỖI: to-ne — ne — hết 3 lượt bổ sung (tổng 6), mọi lượt lộ mắt nhất là attack; candidates/to-ne-attempt4–6.*; giữ fallback. (mắt)
LỖI: toD — hướng — ne H3 C3–4 — còn lộ mắt sau 3 lượt, giữ fallback (mắt)
LỖI: candidates/to-ne-797-attempt1 — lộ mắt (mắt)
LỖI: candidates/to-ne-797-attempt2 — còn chi tiết mắt cạnh đầu (mắt)
LỖI: candidates/to-ne-797-attempt3 — sai số hình — H4 (ne) — dải có 3 hình, cần 4: thiếu khung.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thiet_giap_te_nguu/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Thiết Giáp Tê Ngưu: turnaround 1536×1024, toA 1024×1536, toB 1254×1254, to-n 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
