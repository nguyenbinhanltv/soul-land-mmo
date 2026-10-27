# Thiên Thanh Ngưu Mãng — RAW hoạt ảnh (#1030)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species thien_thanh_nguu_mang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `thien_thanh_nguu_mang` (Thiên Thanh Ngưu Mãng), họ `snake`, khung game 192×192. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1942055 byte, SHA256 `2fd5d785740cdf3ef8c8219e0c3143e6d494cf1a0f36cfd3ccd22873fe8c272b`.
- Công cụ: image_gen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-635.
- Prompt: `turnaround.prompt.txt` (SHA256 `eec740973d510ab84ae0ca41774155edaa42dbfd48c2f324515f35c1bc885525`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **1536×1024**, 2208138 byte, SHA256 `c38329307ea9d85264ef2fff02f7581e9f21c35e825f2d11b43cd7185fc83e83`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-635.
- Prompt: `toA.prompt.txt` (SHA256 `ad2867a1e77ac54e47c939e2f8512acf285531dd46b029e28878f426b1172f26`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: s pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toC

- File: `toC.png`, **1536×1024**, 2059599 byte, SHA256 `dfc6095aeb252bfc1c45b17efcef72af526134844aefb3eebf8b29d10f001980`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-635.
- Prompt: `toC.prompt.txt` (SHA256 `d5f38066d58a98579ec0ec87bdf53ae5771c51285c07157e85cf25450e3a9376`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: e nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — ne còn hơi lộ mõm; die còn cong S; chọn lượt 2/3 làm ref kỹ thuật. toB: sau 3 lượt vẫn CHẶN H4/se hình dính (1: 3/4 hình và tràn C5, walk thêm đầu; 2: 3/4 hình; 3: dò được 1/4). B tốt nhất lượt 3, lưu candidates/toB-attempt3.png, không có toB chính. toD: ba lượt đều CHẶN H4/ne chỉ dò 3/4 hình; lượt 2 còn tràn C5. Chọn candidates/toD-attempt3.png tốt nhất; không đặt toD chính. Lượt 1–2 attack lộ mặt, lượt 3 còn mõm nghiêng và die nằm ngang. (mắt)
LỖI: toA — s — idle H1 C4, attack H3 C2,C5 quay phải; die H4 C2–4 quay chếch phải và còn cong, chưa giữ hướng s (mắt)
LỖI: toC — hình ở ô trống — H4 (e) C5 — ô trống có hình (0.84% diện tích ô): hình tràn từ ô bên.
LỖI: toC — e — die cuối còn hơi cong S; hurt biên độ nhỏ (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thien_thanh_nguu_mang/` | - | image_gen | RAW hoạt ảnh Thiên Thanh Ngưu Mãng: turnaround 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
