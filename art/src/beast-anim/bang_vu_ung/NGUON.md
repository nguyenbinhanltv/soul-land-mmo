# Băng Vũ Ưng — RAW hoạt ảnh

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bang_vu_ung`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bang_vu_ung` (Băng Vũ Ưng), họ `bird`, khung game 96×96. Mức kiểm chung: **nhẹ**.

## turnaround

- File: `turnaround.png`, **1536×1024**, 1757194 byte, SHA256 `36947ef5fb200343db9a1ad316635a03c12b6d06c85d6378cb66b2f632af42e8`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `turnaround.prompt.txt` (SHA256 `e187091ade3a4dc2dd6cb74da84213a5ef8f7804c07f7d7681bddfa48c60b509`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **948×1659**, 2056114 byte, SHA256 `bda09f5d879cb8d51810e9c78085530db86c6e7a1c8c7c79db28ad6a176be30b`.
- Công cụ: ChatGPT / Codex image_gen.imagegen (soul_land_game-619, 2026-10-27, #1030); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `388083a6ce4f3fe85aa7c2405eb62ba5dfef5d6ce01b212d863e8b99875a1597`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se nhẹ, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 2064551 byte, SHA256 `28b99af58f84ab37a177e570bc875949547fe20b1846c5436187dcf033b0a730`.
- Công cụ: ChatGPT / Codex image_gen.imagegen (soul_land_game-619, 2026-10-27, #1030); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toB.prompt.txt` (SHA256 `3e5791d0300c37fc15042de636814512a6815180a4356155965dbcafbb98b236`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass, n pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Lỗi

```text
LỖI: turnaround — Phiên 765: turnaround dùng đủ 3 lượt mới; lượt1 ne/die lộ mỏ; lượt2 n có mảng ngực ở lưng; lượt3 ne H1-H3 C4 còn mỏ/mặt bên. Chọn candidates/turnaround-765-attempt3.png tốt nhất nhưng vẫn chặn; không dùng làm tham chiếu; giữ fallback ne,n. (mắt)
LỖI: toA — hình ở ô trống — H8 (se) C6 — ô trống có hình (0.83% diện tích ô): hình tràn từ ô bên.
LỖI: toA — s — H4 die C1–4 — quay thân ngang sang phải; se — H5–8 — gần e; hurt bung cánh lớn, recoil nhỏ (mắt)
LỖI: toB — ne — H3 attack C3–5 và H4 die C2–4 — lộ mắt/mặt, die quay ngang; n — H8 die C4 — lộ mặt, đổi hướng ngang; H5–7 còn cần soát nhận diện lưng/ngực (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bang_vu_ung/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Băng Vũ Ưng: turnaround 1536×1024, toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
