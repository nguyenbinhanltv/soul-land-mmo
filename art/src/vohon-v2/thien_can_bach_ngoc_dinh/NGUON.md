# thien_can_bach_ngoc_dinh — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1 làm tham chiếu ngoại hình. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id thien_can_bach_ngoc_dinh --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: khoảng 3; vật cứng gần đối xứng. Đỉnh ba chân, hai quai, nắp núm và khói ngọc rõ; s/se gần nhau, e/ne chưa nghiêng đủ, n đổi sang vòng bát quái. Khối thân thiên đồng tối hơn ngọc ngà mong muốn; khắc nhiều chi tiết, quai ngoài sát mép. Mặt thao thiết là hoa văn thân đỉnh, không phải lỗi mắt sinh vật. Chọn tham chiếu ngoại hình.

Chọn `concept-attempt1.png`; hồ sơ prompt và source JSON kèm cùng tên. Không phải sheet hoạt ảnh dùng trực tiếp. Các hướng cần sửa được xử lý ở khâu phụ thể bằng hình nộm.

SHA256 ảnh: `ee78be8f3d9a0f7d1124704380adf4755f44d146aec0bb50998ff2e5812b011d`. SHA256 prompt: `a4f940791b8d8fce5d1851cce13b1cd1a6e3925f8258cf879ba8d44e92bcb263`.

## Kiểm RAW

```text
raw concept-attempt1.png pháp tướng (thien_can_bach_ngoc_dinh): NHẸ
  [NHẸ] mem: texture mềm: 83% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] nhieu-mau: 176 màu đáng kể (nên ≤ 160 để ép về ≤ 48 mà không bệt)
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.14 ở chu kỳ 33 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  số đo: {"w":2172,"h":724,"ratio":3,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.04,"softness":0.834,"bigColors":176,"grid":{"period":33,"ratio":1.14},"paletteMatch":0.87}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo theo khuôn, không thay kết quả máy:

```text
--eye "concept-attempt1=hướng / hình — Đỉnh ba chân, hai quai, nắp núm và khói ngọc rõ; s/se gần nhau, e/ne chưa nghiêng đủ, n đổi sang vòng bát quái. Khối thân thiên đồng tối hơn ngọc ngà mong muốn; khắc nhiều chi tiết, quai ngoài sát mép. Mặt thao thiết là hoa văn thân đỉnh, không phải lỗi mắt sinh vật. Chọn tham chiếu ngoại hình."
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/thien_can_bach_ngoc_dinh/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |
| `art/src/vohon-v2/thien_can_bach_ngoc_dinh/candidates/portrait-attempt1.*` và `portrait-attempt1-P1c2/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Chân dung lô 3 #1158; prompt CLI nguyên văn, RAW + pixel preset portrait2; model/seed unknown. | 2026-10-27 | 1/3 lượt, ứng viên chưa duyệt, không nhập game; SHA256 và --eye bên dưới. |

Prompt trong repo chuẩn hóa xuống dòng LF đúng byte Git; SHA trước chuẩn hóa CRLF giữ trong source JSON. Nội dung prompt tự sinh không sửa.


## Chân dung lô 3 — #1158, P1c2

Ngày 2026-10-27; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `5c987b8def841fd01e9f79079396e1dc50e5171b8885b9571ef6df6cf33f7fd6`. Prompt nguyên văn từ CLI, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`, SHA256 `95bfae034ed57773889a39a5f1e373c9e017885c60d1ea50cb6cd67561045e16`. Prompt lưu UTF-8 LF; chuỗi gửi gốc và SHA256 giữ trong `candidates/portrait-attempt1.source.json`, chỉ chuẩn hoá xuống dòng.

Ảnh neo: `art/src/vohon-v2/thien_can_bach_ngoc_dinh/concept-attempt1.png`, SHA256 `ee78be8f3d9a0f7d1124704380adf4755f44d146aec0bb50998ff2e5812b011d`. 

Pixel hoá `--preset portrait2` đã duyệt, giữ mặc định 16 màu (brief RAW 6–8 mảng màu); bản `candidates/portrait-attempt1-P1c2/thien_can_bach_ngoc_dinh-portrait.png`. Xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Kết quả máy RAW/P1c2 và lệnh tái tạo trong source JSON, báo cáo pixel kèm thư mục. Chỉ ứng viên trình duyệt, **chưa duyệt, không nhập game**; không chọn thay concept.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI chưa nhận cờ `--eye`; lưu khai báo tường minh, giữ nguyên kết quả máy và RAW.

```text
--eye "portrait-attempt1=RAW/P1c2 — Cận miệng đỉnh, hai quai và hoa văn thao thiết; khối ngọc xanh sẫm/ngà, thiên vàng đồng hơn bạch ngọc. Chân không đủ trong khung cận cảnh; khói sáng lớn và hoa văn dày. P1c2 vẫn nhận ra đỉnh nhưng khói/miệng/quai sáng tràn 37%, nét chạm khắc thành cụm nhỏ; không có chữ đọc được."
```


## Icon lô 3 — #1159, RAW nearest 24/32 px

Ngày 2026-10-28; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `icon-attempt1.png`, SHA256 `71b5024e860bd0580a12cc7220a38cc8d08332031d5cd4fb1c6d53bdf4332520`. Prompt CLI nguyên nội dung, không viết tay / addendum: `icon-attempt1.prompt.txt`, SHA256 `8144ed7365af0606be3848eb9b369b3f0afc8fcfce2d32111e89a07c83aa825d` (file UTF-8 đã chuẩn hóa LF, có xuống dòng cuối). `sent_prompt` trong source JSON giữ nguyên stdout CLI thực tế sau khi bỏ xuống dòng cuối: **22 CRLF trong khối STYLE, LF ở phần còn lại** do checkout Windows. `sent_prompt_sha256` tính trên chuỗi gốc hỗn hợp đó, không phải file prompt LF. So sánh nội dung sau chuẩn hóa CRLF → LF: trùng nguyên văn, không addendum.

Ảnh neo theo chỉ định lô 3: `art/src/vohon-v2/thien_can_bach_ngoc_dinh/concept-attempt1.png`, SHA256 `ee78be8f3d9a0f7d1124704380adf4755f44d146aec0bb50998ff2e5812b011d`; chỉ tham chiếu ngoại hình, không xác nhận concept đã đạt năm hướng. Hồ sơ đầy đủ và kết quả máy: `icon-attempt1.source.json`. Chuyển bằng preset `icon-nearest`: bỏ nền, cắt hộp bao, nearest-neighbor, viền mặc định; giữ màu RAW, không ép 8 màu. Bản 24/32 và báo cáo tại `icon-attempt1-nearest/`; xem [trang so sánh](icon-attempt1-nearest/preview/index.html).

Ứng viên trình duyệt, chưa duyệt nhập game. Lỗi còn lại chỉ khai dưới đây, không sửa RAW.

### Khai báo duyệt mắt icon (`--eye`)

CLI chưa nhận cờ `--eye`; giữ nguyên kết quả máy và lưu khai báo tường minh:

```text
--eye "icon-attempt1=24 — cham-mep — hình chạm mép ảnh (6 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24 — nhieu-chi-tiet — mật độ biên 0.929 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32 — cham-mep — hình chạm mép ảnh (8 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32 — nhieu-chi-tiet — mật độ biên 0.944 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=raw — mem — texture mềm: 90% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=raw — nhieu-mau — 174 màu đáng kể (nên ≤ 160 để ép về ≤ 32 mà không bệt)"
--eye "icon-attempt1=raw — luoi — chưa đúng lưới khối: tỉ số biên 1.3 ở chu kỳ 40 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=duyệt mắt — Đỉnh ba chân ngọc tối với miệng vàng và mắt sáng; khói sáng lớn, hoa văn dày và vàng đồng nhiều hơn cảm giác bạch ngọc; ở 24 px miệng lò còn thấy nhưng mặt thú và đạo văn mất chi tiết, cần duyệt tông vật liệu."
```

### Ghi công icon

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/thien_can_bach_ngoc_dinh/icon-attempt1.*` và `icon-attempt1-nearest/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) + vohon-pixelize icon-nearest | Icon lô 3 #1159; prompt CLI nguyên văn, concept riêng làm neo; model/seed unknown. | 2026-10-28 | 1/3 lượt; ứng viên chưa duyệt, không nhập game; SHA256 ở trên. |
