# Lam Điện Bá Vương Long — phụ thể hoạt ảnh lô 3

Part of #1025. Ngày 2026-10-28. **Hoàn tất bước 1–6, CHẶN mắt, giữ nhánh game cũ; không nhập game.**

Công cụ duy nhất builtin `image_gen.imagegen` (Codex), model/seed unknown. RAW nguyên byte, không hậu kỳ. Prompt nguyên khối text do `phuthe-sheet-prompt.mjs --concept-ref` sinh, không viết tay/addendum. Khung 96; nền #FF00FF. Nộm và vạch đúng màu của công cụ; SHA256 tham chiếu nằm trong source từng RAW. Ảnh dẫn theo đúng thứ tự: (1) bảng nộm tương ứng trong references/, (2) concept lượt lớn nhất ở vohon-v2. Không dùng ảnh cũ hay tờ lỗi làm tham chiếu; các tờ chọn còn chặn mắt nên không dùng làm ảnh dẫn.

| RAW | Lượt | Chặn / nhẹ riêng tờ | SHA256 ảnh | SHA256 prompt |
|---|---:|---|---|---|
| `candidates/toB-attempt1.png` | 1 | 1 / 1 | `5d701e96517c225e3a89565adc25c75812a64a79c1d90ecf92be7fa35e1e4b80` | `63280832339e7f9efaa05f1ce665464b8e98a711b5e746bee7d6d1f6064ae8ac` |
| `candidates/toB-attempt2.png` | 2 | 1 / 0 | `570d77e5a88a93cbc8369d0cd5ac6946db4ba025b24f9dc9c1b5c5a484336bbe` | `91ecde90324f5f56e6dfe7384647326eae3b7e8e152d66c93a7b8e79534a3d0b` |
| `candidates/toC-attempt1.png` | 1 | 1 / 0 | `ee112be5ba59c3e99b75030f4ff70de3ec556454ba93e9a9237b7514adb7d7ef` | `a4c8a50b2940abfdecfffef3b657be59179ecf6669d4f61b1aafd3325d4069eb` |
| `candidates/toC-attempt2.png` | 2 | 1 / 1 | `d8c51a8e6b15da4e3dccf7fa4bd38c8b5b0263483c61cc91e845d446b7b2ad8e` | `cfa029ccf03a72f4de789a8332e4722e566751af5ba6c604048ce1677ee08f18` |
| `toA.png` | 1 | 0 / 47 | `0a6a1258a080bb18557dd58fa0e5ef452b411c74563803cf67029f560f2b9ddd` | `78ad698d787601631cbf726f45c1ccc062c7a2f08a65970d9ae8a4eb1717099f` |
| `toB.png` | 3 | 0 / 37 | `7a00f4489a8153c1910f116a49d8acae74afa5f6e461c7928a0bcbad6e7f78f8` | `b3f9c4e83b75d443fee82c264fb33929ec240407bd98e4e1826bb06bc772a4de` |
| `toC.png` | 3 | 0 / 25 | `a22a0b28ce0b48edb410fd8428600122231edbf7da501d2a92dd6aeadfd6408b` | `a0eb3c0dce53141d26d627ee588ce5674407096d5b8bdf5b4ee5b2e46a54ffa6` |
| `toD.png` | 1 | 0 / 42 | `9c5aa80c66d7702dc2bf93aa5ed7a1a3495e70d9d2c5e8b620a3308be777e4f3` | `bc36f63e7ccc46f4b8f076e5c34d11b73551107d7c2f35fd7d5ebb69220707b4` |
| `toE.png` | 1 | 0 / 41 | `ad15400cf87592ba092ce0a3c905f0e671810580b6485e5b692846afbbb174c5` | `478223704847e675991644d710bf81a5319e754bce0aa8d910c042b854f2d3fe` |

Mọi source có SHA256 prompt/ảnh/từng tham chiếu, nhận xét mắt và toàn bộ báo cáo kiểm. Lượt loại nằm ở candidates, không nhân bản RAW.

## Khai mắt

```text
--eye "A–E=nộm/phụ thể — toàn bộ — nộm nhỏ/dời xuống; cổ và vòng rắn lớn phía sau, chưa đúng quấn tay; xén mép, chặn nhập"
--eye "toD=hướng — ne — gần e/lộ mặt; chỉ khai, không sinh riêng sửa mặt"
--eye "toE=hướng — n — lộ mặt/quay ngang; chỉ khai, không sinh riêng sửa mặt"
```

## Cắt, neo và preview

Artifact: `C:/Users/PC/.ao/data/artifacts/soul_land_game-707/lam_dien_ba_vuong_long/preview/index.html`, `xoay-vong.html`, GIF nam/nữ đủ 5 clip và 8 hướng. Neo tự tính tại `anchor.json`, scale 1, chỉ đo idle. Preview chuẩn chưa áp neo. `lop.json` đặt vòng ngang tay/vài trước thân, cổ/đuôi sau, ne/n trước; cần chỉnh tay hoặc hai lớp nếu vòng quấn chưa khớp. Không chứng nhận đẹp.
Cắt 110 khung, 32 màu; 0 block / 160 warn. Lưới cuối theo _report.json. Soát idle nam/nữ: cổ cao xén ở s/n, vòng quấn chưa khớp tay. Không thay manifest/neo game.

Lệnh tái tạo (OUT = artifact trên):

```text
npm run phuthe:check -- lam_dien_ba_vuong_long --out <temp>
node tools/assets/phuthe-sheet-cut.mjs --id lam_dien_ba_vuong_long --sheet A=art/src/phuthe-anim/lam_dien_ba_vuong_long/toA.png --sheet B=art/src/phuthe-anim/lam_dien_ba_vuong_long/toB.png --sheet C=art/src/phuthe-anim/lam_dien_ba_vuong_long/toC.png --sheet D=art/src/phuthe-anim/lam_dien_ba_vuong_long/toD.png --sheet E=art/src/phuthe-anim/lam_dien_ba_vuong_long/toE.png --out <OUT>
node tools/assets/phuthe-anchor.mjs --id lam_dien_ba_vuong_long --source anim --dir <OUT> --out <OUT>/anchor.json
node tools/assets/phuthe-sheet-preview.mjs --id lam_dien_ba_vuong_long --dir <OUT>
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `to{A..E}.png`, `candidates/to*-attempt*.png` | - | builtin image_gen.imagegen (Codex) | Prompt direction tự sinh, source SHA256 đi kèm | 2026-10-28 | Cắt chẩn đoán, không nhập game |
| `references/*-nom-to*.png` | - | phuthe-sheet-dummy.mjs, LPC hiện có | Bảng nộm/vạch theo đúng bước thân | 2026-10-28 | Giấy phép LPC theo hồ sơ hiện có |

## So s?nh sau neo v? ki?m chung

Trang `C:/Users/PC/.ao/data/artifacts/soul_land_game-707/lam_dien_ba_vuong_long/so-sanh-neo.html` so tr??c/sau, ?? nam/n?, 5 clip, 5 h??ng g?c. Sheet artifact `neo/` bi?n ??i nearest-neighbor t?ng khung quanh g?c ch?n (48,74), scale r?i dx/dy t? anchor.json; kh?ng s?a RAW. Sau neo v?n che th?n/x?n m?p, ?i?m g?n ch?a ??t; kh?ng nh?p game.

Ki?m chung l?: `npm run check` v? `npm run build` ??t; bot RAM `npm run bot:local -- --only view` ??t 91/91, RSS ??nh server 144 MB / bot 124 MB. Kh?ng ??i server/SQL n?n kh?ng ch?y PostgreSQL.
