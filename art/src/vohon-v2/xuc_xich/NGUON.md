# xuc_xich — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1 làm tham chiếu ngoại hình. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id xuc_xich --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: khoảng 3; vật gần đối xứng. Năm hình cùng khối xúc xích phong ấn, thân nâu đỏ và lõi vàng rõ; se/e/ne còn gần nhau, n vẫn hiện đai và lõi như phía trước. Khí vàng hơi mềm, chi tiết đai dày (nhẹ); không có mặt hay mắt. Chọn tham chiếu ngoại hình.

Chọn `concept-attempt1.png`; hồ sơ prompt và source JSON kèm cùng tên. Không phải sheet hoạt ảnh dùng trực tiếp. Các hướng cần sửa được xử lý ở khâu phụ thể bằng hình nộm.

SHA256 ảnh: `0310c598ef01a1970f7c85cd401ba65e0aade78a8974291ecb15a9cdb4a369d3`. SHA256 prompt: `a2c1cbcd89867aff270f943ba6d1f12193e6ed434008272e02e2027b3036126e`.

## Kiểm RAW

```text
raw concept-attempt1.png pháp tướng (xuc_xich): NHẸ
  [NHẸ] mem: texture mềm: 82% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] nhieu-mau: 218 màu đáng kể (nên ≤ 160 để ép về ≤ 48 mà không bệt)
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.1 ở chu kỳ 38 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  số đo: {"w":2172,"h":724,"ratio":3,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.03,"softness":0.823,"bigColors":218,"grid":{"period":38,"ratio":1.1},"paletteMatch":0.99}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo theo khuôn, không thay kết quả máy:

```text
--eye "concept-attempt1=hướng / hình — Năm hình cùng khối xúc xích phong ấn, thân nâu đỏ và lõi vàng rõ; se/e/ne còn gần nhau, n vẫn hiện đai và lõi như phía trước. Khí vàng hơi mềm, chi tiết đai dày (nhẹ); không có mặt hay mắt. Chọn tham chiếu ngoại hình."
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/xuc_xich/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |
| `art/src/vohon-v2/xuc_xich/candidates/portrait-attempt1.*` và `portrait-attempt1-P1c2/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Chân dung lô 3 #1158; prompt CLI nguyên văn, RAW + pixel preset portrait2; model/seed unknown. | 2026-10-27 | 1/3 lượt, ứng viên chưa duyệt, không nhập game; SHA256 và --eye bên dưới. |

Prompt trong repo chuẩn hóa xuống dòng LF đúng byte Git; SHA trước chuẩn hóa CRLF giữ trong source JSON. Nội dung prompt tự sinh không sửa.


## Chân dung lô 3 — #1158, P1c2

Ngày 2026-10-27; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `819487c392253dc64a6f99717a19eee350e2759fb59d7deea12d5303a626fd8c`. Prompt nguyên văn từ CLI, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`, SHA256 `ea2de97f885b0de1d7f163ba657fe1fd949fd7402e60b3982ac1a3dc40e5cdb9`. Prompt lưu UTF-8 LF; chuỗi gửi gốc và SHA256 giữ trong `candidates/portrait-attempt1.source.json`, chỉ chuẩn hoá xuống dòng.

Ảnh neo: `art/src/vohon-v2/xuc_xich/concept-attempt1.png`, SHA256 `0310c598ef01a1970f7c85cd401ba65e0aade78a8974291ecb15a9cdb4a369d3`. 

Pixel hoá `--preset portrait2` đã duyệt, giữ mặc định 16 màu (brief RAW 6–8 mảng màu); bản `candidates/portrait-attempt1-P1c2/xuc_xich-portrait.png`. Xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Kết quả máy RAW/P1c2 và lệnh tái tạo trong source JSON, báo cáo pixel kèm thư mục. Chỉ ứng viên trình duyệt, **chưa duyệt, không nhập game**; không chọn thay concept.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI chưa nhận cờ `--eye`; lưu khai báo tường minh, giữ nguyên kết quả máy và RAW.

```text
--eye "portrait-attempt1=RAW/P1c2 — Trụ hương tràng nứt vỏ, đai đỏ và hương tràng nhỏ nhận ra, không nhân hoá. Hơi nóng vàng sáng lớn cùng gam thân cam, nhiều vật phụ, trụ cắt mép trên/dưới. P1c2 giữ vết nứt nhưng hơi nóng cạnh tranh chủ thể, đai đỏ gần thân; cần chủ repo duyệt riêng theo mục 4."
```


## Icon lô 3 — #1159, RAW nearest 24/32 px

Ngày 2026-10-28; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `icon-attempt1.png`, SHA256 `731755297a9c585d67211f4e5f2046d8a16539bc784be0e526cf713f16d28778`. Prompt CLI nguyên nội dung, không viết tay / addendum: `icon-attempt1.prompt.txt`, SHA256 `fa0f799e6f332cace9a4f945a6687ee496770b9c688772ab26495773749b64ab` (UTF-8 LF, file có xuống dòng cuối; chuỗi gửi bỏ xuống dòng cuối lưu trong source JSON).

Ảnh neo theo chỉ định lô 3: `art/src/vohon-v2/xuc_xich/concept-attempt1.png`, SHA256 `0310c598ef01a1970f7c85cd401ba65e0aade78a8974291ecb15a9cdb4a369d3`; chỉ tham chiếu ngoại hình, không xác nhận concept đã đạt năm hướng. Hồ sơ đầy đủ và kết quả máy: `icon-attempt1.source.json`. Chuyển bằng preset `icon-nearest`: bỏ nền, cắt hộp bao, nearest-neighbor, viền mặc định; giữ màu RAW, không ép 8 màu. Bản 24/32 và báo cáo tại `icon-attempt1-nearest/`; xem [trang so sánh](icon-attempt1-nearest/preview/index.html).

Ứng viên trình duyệt, chưa duyệt nhập game. Lỗi còn lại chỉ khai dưới đây, không sửa RAW.

### Khai báo duyệt mắt icon (`--eye`)

CLI chưa nhận cờ `--eye`; giữ nguyên kết quả máy và lưu khai báo tường minh:

```text
--eye "icon-attempt1=24 — cham-mep — hình chạm mép ảnh (2 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24 — nhieu-chi-tiet — mật độ biên 0.923 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32 — cham-mep — hình chạm mép ảnh (4 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32 — nhieu-chi-tiet — mật độ biên 0.935 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=raw — mem — texture mềm: 88% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=raw — nhieu-mau — 182 màu đáng kể (nên ≤ 160 để ép về ≤ 32 mà không bệt)"
--eye "icon-attempt1=raw — luoi — chưa đúng lưới khối: tỉ số biên 1.23 ở chu kỳ 34 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=duyệt mắt — Một Xúc Xích chính màu đỏ đất, vết nứt vàng; còn bốn chiếc nhỏ và nhiều khí xoắn, không đạt biểu tượng đơn; ở 24 px khí sáng lẫn thân đỏ, ưu tiên khối chính yếu, giữ làm candidate chưa chọn."
```

### Ghi công icon

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/xuc_xich/icon-attempt1.*` và `icon-attempt1-nearest/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) + vohon-pixelize icon-nearest | Icon lô 3 #1159; prompt CLI nguyên văn, concept riêng làm neo; model/seed unknown. | 2026-10-28 | 1/3 lượt; ứng viên chưa duyệt, không nhập game; SHA256 ở trên. |
