# hoa_anh — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **2/3 lượt**, chọn lượt 2. RAW nguyên byte, không hậu kỳ, chưa nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong --id hoa_anh --style-ref <ảnh neo>`; chỉ dùng ảnh neo Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083, không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

**Tham chiếu ngoại hình; chưa duyệt làm phụ thể năm hướng.** Chọn lượt 2: sừng đã nằm trong khung, tay ít sát mép hơn lượt 1; đủ năm khối riêng, vai rộng, hai tay lửa, khói tím than, mắt vàng và đạo văn ngực đúng. RAW NHẸ do texture mềm và lưới. ne vẫn ngoái trái lộ mắt vàng, n nhìn lưng giấu mắt; khoảng bốn góc đúng. Chỉ khai eye, không sinh thêm vì lỗi ne. Lửa tay n còn rất sát mép phải, sáng dọc thân hơi nhiều; chỉ tham chiếu ngoại hình, chưa dùng làm sheet.

Số góc thật: khoảng 4; ne sai. Năm vị trí trình bày theo s, se, e, ne, n; không coi năm vị trí là năm góc thật khi hình đối xứng hoặc hướng sai.

- Ảnh: `concept-attempt2.png`; SHA256 `827431d0d8fb7d4500f694c617bd573dbc2e36ba82dcce69705ca8c90beb8308`.
- Prompt thật đã gửi: `concept-attempt2.prompt.txt`; SHA256 `1378ffa29bc20ac6918fb29a1c092542f8594a999582bbec7d2506b7c69c2b7e`.
- Hồ sơ và kết quả kiểm RAW đầy đủ: `concept-attempt2.source.json`.

## Kiểm RAW

```text
raw concept-attempt2.png pháp tướng (hoa_anh): NHẸ
  [NHẸ] mem: texture mềm: 88% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.1 ở chu kỳ 29 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.02,"softness":0.884,"bigColors":107,"grid":{"period":29,"ratio":1.1},"paletteMatch":0.93}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo cùng khuôn dưới đây. Lỗi ne/n lộ mặt chỉ khai, không sinh thêm theo chỉ định; hướng xử lý ở khâu phụ thể với hình nộm.

```text
--eye "concept-attempt2=hướng — ne — ngoái trái, còn lộ mắt vàng"
--eye "concept-attempt2=bố cục — n — lửa tay sát mép phải; sáng trên thân hơi nhiều"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/hoa_anh/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. |2026-10-27; chân dung lô 2 RAW/P1c2 #1158, 1/3 lượt. | Chưa duyệt, không nhập game. |

Lượt loại 1: `candidates/concept-attempt1.png`; SHA256 ảnh `a55bdfc5d130fa8ed8f2670c05cf1dff890aa28f41346b028ccc582e664a52c2`, prompt `1378ffa29bc20ac6918fb29a1c092542f8594a999582bbec7d2506b7c69c2b7e`. Loại lượt 1 do cắt sừng ở mép trên và tay ngoài mép trái/phải. RAW tự động NHẸ nhưng lỗi cắt mép chặn bằng mắt. Dáng hộ pháp vai rộng, mắt vàng, hai tay lửa và khói tím đúng; ne ngoái trái lộ mắt, chỉ khai eye. Lượt mới nhằm bố cục, không nhằm lỗi ne.


## Chân dung lô 2 — #1158, P1c2

Ngày 2026-10-27; 1/3 lượt chân dung. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte: `candidates/portrait-attempt1.png`; SHA256 `fd1f2f6695815ec75d2810c75d00f1f198d93b14e3859304818daee7e1827577`. Prompt CLI nguyên văn, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`; SHA256 `2111c6d265adc728ac60b2402b8ca98de002d71a8204c0f0beacab720ab88032`. Neo ngoại hình `concept-attempt2.png`, SHA256 `827431d0d8fb7d4500f694c617bd573dbc2e36ba82dcce69705ca8c90beb8308`. Lệnh và kết quả máy ở `candidates/portrait-attempt1.source.json`.

Pixel hoá bằng `--preset portrait2` (P1c2 đã duyệt 27/10), giữ mặc định 16 màu của preset; brief RAW 6–8 mảng màu không phải giới hạn bảng màu P1c2. Bản 64×64: `candidates/portrait-attempt1-P1c2/hoa_anh-portrait.png`; xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Chỉ ứng viên trình duyệt, chưa nhập game; không chọn thay concept. Không dùng lại ảnh lỗi làm neo.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI võ hồn chưa nhận cờ này; lưu khai báo tường minh, không sửa công cụ hoặc RAW.

```text
--eye "portrait-attempt1=góc chính diện thay vì 3/4; lửa sừng bị cắt mép trên, lửa vai và ấn ngực sáng rộng tranh mắt; nhiều đỏ trên thân đỏ thẫm; cần duyệt ở 64×64"
```

```text
--eye "portrait-attempt1=P1c2 — mắt nhỏ và ấn ngực vỡ thành đốm, lửa sừng sáng rộng hơn mắt."
```

Prompt lưu UTF-8 LF theo Git; SHA256 chuỗi gửi nguyên bản `3efb1277d8400d1b4435bf522b42d25b91992e9d86876384657f310ab3c8fa58` và `sent_prompt` ở source JSON. Chỉ chuẩn hóa xuống dòng, nội dung trùng CLI.


## Icon lô 2 — RAW nearest (#1159)

Ngày 2026-10-28; builtin `image_gen.imagegen`, model/seed `unknown`. Số lượt icon **1/3**, chọn lượt 1 trình duyệt; chưa nhập game. RAW giữ nguyên byte từ công cụ.

- RAW: `icon-attempt1.png`, SHA256 `ee492904823353e563495fddaf8865fbc35c2918bcbc24186fb17d01a18fccb5`.
- Prompt: `icon-attempt1.prompt.txt`, SHA256 `38c79f162cf50d0c41f19a550745a88062d06e664f9da8bc199b551af61f0898`; nguyên nội dung CLI `node tools/assets/vohon-prompt.mjs --type icon --id hoa_anh --style-ref art/src/vohon-v2/hoa_anh/concept-attempt2.png` (bỏ newline cuối stdout); không viết tay, không addendum.
- Ảnh neo: `concept-attempt2.png`, SHA256 `827431d0d8fb7d4500f694c617bd573dbc2e36ba82dcce69705ca8c90beb8308`; không dùng ảnh cũ hay lượt hỏng.
- Nguồn chi tiết: `icon-attempt1.source.json`. Icon một góc, không áp dụng yêu cầu năm hướng của concept.
- Xuất: `node tools/assets/vohon-pixelize.mjs --type icon --id hoa_anh --in art/src/vohon-v2/hoa_anh/icon-attempt1.png --out art/src/vohon-v2/hoa_anh/icon-attempt1-nearest --preset icon-nearest --crop 440,0,460,450`; giữ màu RAW, không ép 8 màu.
- Cặp 24/32 px và report/check JSON: `icon-attempt1-nearest/`; [xem trước](icon-attempt1-nearest/preview/index.html).

### Khai báo lỗi còn lại (`--eye`)

CLI chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên báo cáo máy. Không tự tuyên bố đạt đẹp.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 91% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.27 ở chu kỳ 40 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (55 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.903 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (41 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.896 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=duyệt mắt — RAW có cả thân; nearest cắt vùng đầu lửa, rìa dưới cắt ngang cổ. Mắt gần cùng màu lửa; cần duyệt độ rõ ở 24 px."
```
