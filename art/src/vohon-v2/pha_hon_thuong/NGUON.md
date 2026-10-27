# pha_hon_thuong — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1. RAW nguyên byte, không hậu kỳ, chưa nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong --id pha_hon_thuong --style-ref <ảnh neo>`; chỉ dùng ảnh neo Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083, không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

**Tham chiếu ngoại hình; chưa duyệt làm phụ thể năm hướng.** Cán dài, mũi thoi rãnh ngọc sáng, thân ngọc tối và hai tua đỏ rõ; đủ năm khối riêng, chiều cao đều. RAW NHẸ do mềm và chưa đúng lưới, không sinh lại vì hai mục này. Khoảng ba góc phân biệt rõ vì vật đối xứng; ne nghiêng trái, n nhìn mặt sau. Cán hơi ngắn so với đầu thương, trang trí gai hơi dày; khai mắt, chưa nhập game.

Số góc thật: khoảng 3 (vật cứng đối xứng). Năm vị trí trình bày theo s, se, e, ne, n; không coi năm vị trí là năm góc thật khi hình đối xứng hoặc hướng sai.

- Ảnh: `concept-attempt1.png`; SHA256 `ceeb9594af98b6111ffa15ad52fdd361fd5dfe37b0ce57da7508dbae45bdfa63`.
- Prompt thật đã gửi: `concept-attempt1.prompt.txt`; SHA256 `242bf66cba5186b25a18ffd61cf1b1cb502a17adca956d5d2d72c05d7d6f5397`.
- Hồ sơ và kết quả kiểm RAW đầy đủ: `concept-attempt1.source.json`.

## Kiểm RAW

```text
raw concept-attempt1.png pháp tướng (pha_hon_thuong): NHẸ
  [NHẸ] mem: texture mềm: 78% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.23 ở chu kỳ 37 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.01,"softness":0.783,"bigColors":156,"grid":{"period":37,"ratio":1.23},"paletteMatch":0.69}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo cùng khuôn dưới đây. Lỗi ne/n lộ mặt chỉ khai, không sinh thêm theo chỉ định; hướng xử lý ở khâu phụ thể với hình nộm.

```text
--eye "concept-attempt1=hướng — ne — trục thương nghiêng trái, góc đối xứng khó phân biệt"
--eye "concept-attempt1=hình mẫu — cán — hơi ngắn so với đầu thương, gai trang trí hơi dày"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/pha_hon_thuong/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |
| `art/src/vohon-v2/pha_hon_thuong/candidates/portrait-attempt1.*` và `portrait-attempt1-P1c2/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Chân dung lô 3 #1158; prompt CLI nguyên văn, RAW + pixel preset portrait2; model/seed unknown. | 2026-10-27 | 1/3 lượt, ứng viên chưa duyệt, không nhập game; SHA256 và --eye bên dưới. |


## Chân dung lô 3 — #1158, P1c2

Ngày 2026-10-27; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `9d9631ab15092b86aa29d7412ed48d8f7a28939e3b9362deb20935b80182e6d7`. Prompt nguyên văn từ CLI, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`, SHA256 `8143f96a5bfe89040eb2f300ed37fd1aa57078a5e1effe2507517146a5b7fcf4`. Prompt lưu UTF-8 LF; chuỗi gửi gốc và SHA256 giữ trong `candidates/portrait-attempt1.source.json`, chỉ chuẩn hoá xuống dòng.

Ảnh neo: `art/src/vohon-v2/pha_hon_thuong/concept-attempt1.png`, SHA256 `ceeb9594af98b6111ffa15ad52fdd361fd5dfe37b0ce57da7508dbae45bdfa63`. 

Pixel hoá `--preset portrait2` đã duyệt, giữ mặc định 16 màu (brief RAW 6–8 mảng màu); bản `candidates/portrait-attempt1-P1c2/pha_hon_thuong-portrait.png`. Xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Kết quả máy RAW/P1c2 và lệnh tái tạo trong source JSON, báo cáo pixel kèm thư mục. Chỉ ứng viên trình duyệt, **chưa duyệt, không nhập game**; không chọn thay concept.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI chưa nhận cờ `--eye`; lưu khai báo tường minh, giữ nguyên kết quả máy và RAW.

```text
--eye "portrait-attempt1=RAW/P1c2 — Mũi thương thoi xanh ngọc, rãnh lõi và hai tua đỏ đọc rõ; mũi sát và bị cắt mép trên. P1c2 vẫn nhận ra thương và hai tua; hồn quang xanh phía sau lớn, cùng gam thân nên cạnh tối chưa tách hẳn; còn nét vụn ở cán."
```


## Icon lô 3 — #1159, RAW nearest 24/32 px

Ngày 2026-10-28; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `icon-attempt1.png`, SHA256 `b8dda27f5f19be10fb6dedecb80518815ff385aa60783787f90881b18dfa9ea6`. Prompt CLI nguyên nội dung, không viết tay / addendum: `icon-attempt1.prompt.txt`, SHA256 `4a37bf9731e284d85ca657bd93dcf157ef50d01968e3c75403e36b46dc21d381` (file UTF-8 đã chuẩn hóa LF, có xuống dòng cuối). `sent_prompt` trong source JSON giữ nguyên stdout CLI thực tế sau khi bỏ xuống dòng cuối: **22 CRLF trong khối STYLE, LF ở phần còn lại** do checkout Windows. `sent_prompt_sha256` tính trên chuỗi gốc hỗn hợp đó, không phải file prompt LF. So sánh nội dung sau chuẩn hóa CRLF → LF: trùng nguyên văn, không addendum.

Ảnh neo theo chỉ định lô 3: `art/src/vohon-v2/pha_hon_thuong/concept-attempt1.png`, SHA256 `ceeb9594af98b6111ffa15ad52fdd361fd5dfe37b0ce57da7508dbae45bdfa63`; chỉ tham chiếu ngoại hình, không xác nhận concept đã đạt năm hướng. Hồ sơ đầy đủ và kết quả máy: `icon-attempt1.source.json`. Chuyển bằng preset `icon-nearest`: bỏ nền, cắt hộp bao, nearest-neighbor, viền mặc định; giữ màu RAW, không ép 8 màu. Bản 24/32 và báo cáo tại `icon-attempt1-nearest/`; xem [trang so sánh](icon-attempt1-nearest/preview/index.html).

Ứng viên trình duyệt, chưa duyệt nhập game. Lỗi còn lại chỉ khai dưới đây, không sửa RAW.

### Khai báo duyệt mắt icon (`--eye`)

CLI chưa nhận cờ `--eye`; giữ nguyên kết quả máy và lưu khai báo tường minh:

```text
--eye "icon-attempt1=24 — nhieu-chi-tiet — mật độ biên 0.854 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32 — cham-mep — hình chạm mép ảnh (2 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32 — nhieu-chi-tiet — mật độ biên 0.88 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=raw — mem — texture mềm: 89% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=raw — luoi — chưa đúng lưới khối: tỉ số biên 1.32 ở chu kỳ 29 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=duyệt mắt — Một thương chéo, mũi lam trắng tách thân lam tối; hai dải đỏ chiếm nhiều khung, cán vẫn dài làm mũi nhỏ ở 24 px; cần duyệt mức ưu tiên mũi thương và độ rực đỏ."
```

### Ghi công icon

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/pha_hon_thuong/icon-attempt1.*` và `icon-attempt1-nearest/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) + vohon-pixelize icon-nearest | Icon lô 3 #1159; prompt CLI nguyên văn, concept riêng làm neo; model/seed unknown. | 2026-10-28 | 1/3 lượt; ứng viên chưa duyệt, không nhập game; SHA256 ở trên. |
