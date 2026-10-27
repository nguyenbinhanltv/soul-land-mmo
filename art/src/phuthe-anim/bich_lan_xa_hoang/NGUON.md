# Bích Lân Xà Hoàng — phụ thể hoạt ảnh lô 3

Part of #1025. Ngày 2026-10-28. **Hoàn tất bước 1–6, CHẶN mắt, giữ nhánh game cũ; không nhập game.**

Công cụ duy nhất builtin `image_gen.imagegen` (Codex), model/seed unknown. RAW nguyên byte, không hậu kỳ. Prompt nguyên khối text do `phuthe-sheet-prompt.mjs --concept-ref` sinh, không viết tay/addendum. Khung 96; nền #FF00FF. Nộm và vạch đúng màu của công cụ; SHA256 tham chiếu nằm trong source từng RAW. Ảnh dẫn theo đúng thứ tự: (1) bảng nộm tương ứng trong references/, (2) concept lượt lớn nhất ở vohon-v2. Không dùng ảnh cũ hay tờ lỗi làm tham chiếu; các tờ chọn còn chặn mắt nên không dùng làm ảnh dẫn.

| RAW | Lượt | Chặn / nhẹ riêng tờ | SHA256 ảnh | SHA256 prompt |
|---|---:|---|---|---|
| `candidates/toA-attempt1.png` | 1 | 4 / 42 | `0c1d3281ef2523b206089b593286ca5132c70245efd8e3d8a2177ef74c205146` | `e2e9274f3ea5e9c4a1d4b885b1a59837a1eb01f3e860a7a27a1ee4cb7962a83b` |
| `candidates/toA-attempt2.png` | 2 | 22 / 1 | `1c5a3b8970ab8fc7d70f4fd4b1dfd9f66cee6ca86958ff1b40e16adc0905566e` | `eb95b961077bf965d4334c20c2054f92b3253fd17e141e0b3e46112b188b3370` |
| `candidates/toE-attempt1.png` | 1 | 1 / 1 | `dcf0f7ee1d83b4c2c5aff0288b69925e8ede498657e2ad5a9b65434b8be3c0f7` | `3b7dca1a55176d05c287602cf0d879324753f0e1486ca6f3bc844241431211ad` |
| `toA.png` | 3 | 0 / 42 | `934ec6819c1f00d2d28d3fd82d928cd4a847770898188950f49eb926ab41db50` | `d1fa8f347842ca26169a75c3a74ce60987e03f85c6257e142acf700443d5bcbd` |
| `toB.png` | 1 | 0 / 42 | `d62de523555bb1b7fb9a925695d35b6388b7d51647912a8e1a0d858b406c1677` | `df69c609937918400ad77a0bdef7f76bc8b5d9320b8deec9731d3fafecaeca81` |
| `toC.png` | 1 | 0 / 49 | `af53551262dc621559aa44b5a9ac65a8a6af33e650e7ea51857cdd0845c55266` | `294d09b59776dd1206745eb8c9629511df76fb960298c6eff749080e5d3c7c4b` |
| `toD.png` | 1 | 0 / 18 | `08a928fe0c74b9ac689d44dbafb900eced5cbef7b4785ce3b3bc10e11b603513` | `34ad4c403a95cdb933f7196214cde1cffa0a400d689a02f6abb8baea6302ba54` |
| `toE.png` | 2 | 0 / 44 | `1a357ef91499d3dbc4bf49c2e5aa23f6f625a786d41dc503f71d552b4d2f134f` | `58a10a0e37846b807c697a7eb1f115245d1e04b1c8361812b353707f055d37e7` |

Mọi source có SHA256 prompt/ảnh/từng tham chiếu, nhận xét mắt và toàn bộ báo cáo kiểm. Lượt loại nằm ở candidates, không nhân bản RAW.

## Khai mắt

```text
--eye "A–E=nộm/phụ thể — toàn bộ — nộm nhỏ/dời xuống; cổ và vòng rắn lớn phía sau, chưa đúng quấn tay; xén mép, chặn nhập"
--eye "toD=hướng — ne — gần e/lộ mặt; chỉ khai, không sinh riêng sửa mặt"
--eye "toE=hướng — n — lộ mặt/quay ngang; chỉ khai, không sinh riêng sửa mặt"
```

## Cắt, neo và preview

Artifact: `C:/Users/PC/.ao/data/artifacts/soul_land_game-707/bich_lan_xa_hoang/preview/index.html`, `xoay-vong.html`, GIF nam/nữ đủ 5 clip và 8 hướng. Neo tự tính tại `anchor.json`, scale 1, chỉ đo idle. Preview chuẩn chưa áp neo. `lop.json` đặt vòng ngang tay/vài trước thân, cổ/đuôi sau, ne/n trước; cần chỉnh tay hoặc hai lớp nếu vòng quấn chưa khớp. Không chứng nhận đẹp.
Cắt 110 khung, 32 màu; 0 block / 150 warn. Lưới cuối theo _report.json. Soát idle nam/nữ: cổ cao xén ở s/n, vòng quấn chưa khớp tay. Không thay manifest/neo game.

Lệnh tái tạo (OUT = artifact trên):

```text
npm run phuthe:check -- bich_lan_xa_hoang --out <temp>
node tools/assets/phuthe-sheet-cut.mjs --id bich_lan_xa_hoang --sheet A=art/src/phuthe-anim/bich_lan_xa_hoang/toA.png --sheet B=art/src/phuthe-anim/bich_lan_xa_hoang/toB.png --sheet C=art/src/phuthe-anim/bich_lan_xa_hoang/toC.png --sheet D=art/src/phuthe-anim/bich_lan_xa_hoang/toD.png --sheet E=art/src/phuthe-anim/bich_lan_xa_hoang/toE.png --out <OUT>
node tools/assets/phuthe-anchor.mjs --id bich_lan_xa_hoang --source anim --dir <OUT> --out <OUT>/anchor.json
node tools/assets/phuthe-sheet-preview.mjs --id bich_lan_xa_hoang --dir <OUT>
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `to{A..E}.png`, `candidates/to*-attempt*.png` | - | builtin image_gen.imagegen (Codex) | Prompt direction tự sinh, source SHA256 đi kèm | 2026-10-28 | Cắt chẩn đoán, không nhập game |
| `references/*-nom-to*.png` | - | phuthe-sheet-dummy.mjs, LPC hiện có | Bảng nộm/vạch theo đúng bước thân | 2026-10-28 | Giấy phép LPC theo hồ sơ hiện có |

## So s?nh sau neo v? ki?m chung

Trang `C:/Users/PC/.ao/data/artifacts/soul_land_game-707/bich_lan_xa_hoang/so-sanh-neo.html` so tr??c/sau, ?? nam/n?, 5 clip, 5 h??ng g?c. Sheet artifact `neo/` bi?n ??i nearest-neighbor t?ng khung quanh g?c ch?n (48,74), scale r?i dx/dy t? anchor.json; kh?ng s?a RAW. Sau neo v?n che th?n/x?n m?p, ?i?m g?n ch?a ??t; kh?ng nh?p game.

Ki?m chung l?: `npm run check` v? `npm run build` ??t; bot RAM `npm run bot:local -- --only view` ??t 91/91, RSS ??nh server 144 MB / bot 124 MB. Kh?ng ??i server/SQL n?n kh?ng ch?y PostgreSQL.
