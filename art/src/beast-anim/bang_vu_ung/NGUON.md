# Băng Vũ Ưng — RAW hoạt ảnh (#1277)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species bang_vu_ung`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `bang_vu_ung` (Băng Vũ Ưng), họ `bird`, khung game 96×96. Mức kiểm chung: **nhẹ**.


## turnaround

- File: `turnaround.png`, **1536×1024**, 1757194 byte, SHA256 `36947ef5fb200343db9a1ad316635a03c12b6d06c85d6378cb66b2f632af42e8`.
- Công cụ: builtin image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `turnaround.prompt.txt` (SHA256 `c734f97055ac215e9422eab08b5a0a02d5d7b92ce4b0c3257e7b472076791173`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (ảnh mẫu 5 hướng, không có khối hướng).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toA

- File: `toA.png`, **948×1659**, 2056114 byte, SHA256 `bda09f5d879cb8d51810e9c78085530db86c6e7a1c8c7c79db28ad6a176be30b`.
- Công cụ: ChatGPT / Codex image_gen.imagegen (soul_land_game-619, 2026-10-27, #1030); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `81e71501c2810f06c26b7aacf07170e073d1ac6543414ca0831a268d9a146bdc`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s pass, se nhẹ, e pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 2064551 byte, SHA256 `28b99af58f84ab37a177e570bc875949547fe20b1846c5436187dcf033b0a730`.
- Công cụ: ChatGPT / Codex image_gen.imagegen (soul_land_game-619, 2026-10-27, #1030); model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2.
- Prompt: `toB.prompt.txt` (SHA256 `78006ef4bde9aff83e9f720b83696dad383adeda0490898c7224cbab957c70a5`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne nhẹ, n nhẹ).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## to-ne

- File: `to-ne.png`, **1536×1024**, 1857222 byte, SHA256 `728dea9b836747dbcb663bc1e2ae5107e70b358632ddb966b06e4688923627b7`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-797.
- Prompt: `to-ne.prompt.txt` (SHA256 `db8f7d4c26d51d4783062623989a8bae232583ac5665f13d53326c82152cf169`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 170% so với ảnh tĩnh (lệch 70%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## to-n

- File: `to-n.png`, **1536×1024**, 2005740 byte, SHA256 `b36326bdf03253a36c0c093e40053dd40c46e4c7fcb53f5bd13eccc0d29a2acc`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-778.
- Prompt: `to-n.prompt.txt` (SHA256 `dd68a771b49785197b4afdfe966a51d2e397f8baf8420759fbe466e0137f17ea`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 204% so với ảnh tĩnh (lệch 104%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## RAW vòng trước đã chuyển vào candidates

Các bộ PNG, prompt và source.json dưới đây giữ nguyên byte blob Git trước vòng 2.

### to-ne-778-final

- File: `candidates/to-ne-778-final.png`, **1536×1024**, 2040369 byte, SHA256 `7a2ed668d7f4d3d03802932f7de6ba47ac724fab6cae69235ef481bde0c264e1`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-778.
- Prompt: `candidates/to-ne-778-final.prompt.txt` (SHA256 `818627a2ed546112b8033f6537156996f72c5ab8ed2988dbc382473621e5906c`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (ne): cỡ thân idle 209% so với ảnh tĩnh (lệch 109%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Các lượt bổ sung vòng 2 (phiên 797)

Các mục sau sinh bằng beast-nguon trên staging LF của từng ứng viên; tờ lỗi không dùng làm tham chiếu.

### to-ne-797-attempt1

- File: `candidates/to-ne-797-attempt1.png`, **1536×1024**, 1857222 byte, SHA256 `728dea9b836747dbcb663bc1e2ae5107e70b358632ddb966b06e4688923627b7`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt1.prompt.txt` (SHA256 `db8f7d4c26d51d4783062623989a8bae232583ac5665f13d53326c82152cf169`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.
- Ghi chú lượt / nhập: đạt góc lưng, đầu che mặt; die hạ thân. **Được chọn cho hướng đã nhập.**

## Lỗi

```text
LỖI: turnaround — Lịch sử trước phiên 778 (hướng mới theo tờ to-<hướng>): Phiên 765: turnaround dùng đủ 3 lượt mới; lượt1 ne/die lộ mỏ; lượt2 n có mảng ngực ở lưng; lượt3 ne H1-H3 C4 còn mỏ/mặt bên. Chọn candidates/turnaround-765-attempt3.png tốt nhất nhưng vẫn chặn; không dùng làm tham chiếu; giữ fallback ne,n. (mắt)
LỖI: toA — hình ở ô trống — H8 (se) C6 — ô trống có hình (0.83% diện tích ô): hình tràn từ ô bên.
LỖI: toA — Lịch sử trước phiên 778 (hướng mới theo tờ to-<hướng>): s — H4 die C1–4 — quay thân ngang sang phải; se — H5–8 — gần e; hurt bung cánh lớn, recoil nhỏ (mắt)
LỖI: toB — Lịch sử trước phiên 778 (hướng mới theo tờ to-<hướng>): ne — H3 attack C3–5 và H4 die C2–4 — lộ mắt/mặt, die quay ngang; n — H8 die C4 — lộ mặt, đổi hướng ngang; H5–7 còn cần soát nhận diện lưng/ngực (mắt)
LỖI: candidates/to-ne-778-final — Phiên 778: CHẶN: 3 lượt vẫn lộ cạnh mỏ/mặt ở ne, nhất là die; giữ fallback. (mắt)
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/bang_vu_ung/` | - | builtin image_gen.imagegen | RAW hoạt ảnh Băng Vũ Ưng: turnaround 1536×1024, toA 948×1659, toB 1254×1254, to-ne 1536×1024, to-n 1536×1024; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
