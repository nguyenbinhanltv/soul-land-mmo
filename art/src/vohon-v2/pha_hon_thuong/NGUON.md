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


## Chân dung lô 3 — #1158, P1c2

Ngày 2026-10-27; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `9d9631ab15092b86aa29d7412ed48d8f7a28939e3b9362deb20935b80182e6d7`. Prompt nguyên văn từ CLI, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`, SHA256 `8143f96a5bfe89040eb2f300ed37fd1aa57078a5e1effe2507517146a5b7fcf4`. Prompt lưu UTF-8 LF; chuỗi gửi gốc và SHA256 giữ trong `candidates/portrait-attempt1.source.json`, chỉ chuẩn hoá xuống dòng.

Ảnh neo: `art/src/vohon-v2/pha_hon_thuong/concept-attempt1.png`, SHA256 `ceeb9594af98b6111ffa15ad52fdd361fd5dfe37b0ce57da7508dbae45bdfa63`. 

Pixel hoá `--preset portrait2` đã duyệt, giữ mặc định 16 màu (brief RAW 6–8 mảng màu); bản `candidates/portrait-attempt1-P1c2/pha_hon_thuong-portrait.png`. Xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Kết quả máy RAW/P1c2 và lệnh tái tạo trong source JSON, báo cáo pixel kèm thư mục. Chỉ ứng viên trình duyệt, **chưa duyệt, không nhập game**; không chọn thay concept.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI chưa nhận cờ `--eye`; lưu khai báo tường minh, giữ nguyên kết quả máy và RAW.

```text
--eye "portrait-attempt1=RAW/P1c2 — Mũi thương thoi xanh ngọc, rãnh lõi và hai tua đỏ đọc rõ; mũi sát và bị cắt mép trên. P1c2 vẫn nhận ra thương và hai tua; hồn quang xanh phía sau lớn, cùng gam thân nên cạnh tối chưa tách hẳn; còn nét vụn ở cán."
```
