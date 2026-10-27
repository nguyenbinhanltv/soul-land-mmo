# lam_ngan_thao — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1 làm tham chiếu ngoại hình. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id lam_ngan_thao --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: khoảng 3; thân gần đối xứng, s/n gần nhau. Năm hình tách được; se/e/ne đổi góc nhưng chưa rõ, s/n gần nhau; dây ngoài chạm và bị cắt ở mép trái/phải. Khối dây lam đậm, ngọn trắng và đạo văn nhận ra; còn nhiều chi tiết nhỏ (nhẹ). Không có mặt để đánh giá lộ mắt.

Chọn `concept-attempt1.png`; hồ sơ prompt và source JSON kèm cùng tên. Không phải sheet hoạt ảnh dùng trực tiếp. Các hướng cần sửa được xử lý ở khâu phụ thể bằng hình nộm.

SHA256 ảnh: `831f842c891248dc79d9e23d973969eb8b5608f0efe1e705e56b574526c74c35`. SHA256 prompt: `c41f548c87c78dcf51de46d80bd452df5db21d0b3d73e3a36008b7f94ceef34d`.

## Kiểm RAW

```text
raw concept-attempt1.png pháp tướng (lam_ngan_thao): NHẸ
  [NHẸ] mem: texture mềm: 85% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.09 ở chu kỳ 27 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.01,"softness":0.856,"bigColors":130,"grid":{"period":27,"ratio":1.09},"paletteMatch":0.89}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo theo khuôn, không thay kết quả máy:

```text
--eye "concept-attempt1=hướng / hình — Năm hình tách được; se/e/ne đổi góc nhưng chưa rõ, s/n gần nhau; dây ngoài chạm và bị cắt ở mép trái/phải. Khối dây lam đậm, ngọn trắng và đạo văn nhận ra; còn nhiều chi tiết nhỏ (nhẹ). Không có mặt để đánh giá lộ mắt."
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/lam_ngan_thao/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. |2026-10-27; chân dung lô 2 RAW/P1c2 #1158, 1/3 lượt. | Chưa duyệt, không nhập game. |

Prompt trong repo chuẩn hóa xuống dòng LF đúng byte Git; SHA trước chuẩn hóa CRLF giữ trong source JSON. Nội dung prompt tự sinh không sửa.


## Chân dung lô 2 — #1158, P1c2

Ngày 2026-10-27; 1/3 lượt chân dung. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte: `candidates/portrait-attempt1.png`; SHA256 `2a21f12aeac0615c2ae8610eef118bcd330641471e2398547d8dfcf21e793c25`. Prompt CLI nguyên văn, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`; SHA256 `64ddd0aa5276f5e046dd937c97e1d8ed4dbcf65d92b2b62f1322ef932c3e064e`. Neo ngoại hình `concept-attempt1.png`, SHA256 `831f842c891248dc79d9e23d973969eb8b5608f0efe1e705e56b574526c74c35`. Lệnh và kết quả máy ở `candidates/portrait-attempt1.source.json`.

Pixel hoá bằng `--preset portrait2` (P1c2 đã duyệt 27/10), giữ mặc định 16 màu của preset; brief RAW 6–8 mảng màu không phải giới hạn bảng màu P1c2. Bản 64×64: `candidates/portrait-attempt1-P1c2/lam_ngan_thao-portrait.png`; xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Chỉ ứng viên trình duyệt, chưa nhập game; không chọn thay concept. Không dùng lại ảnh lỗi làm neo.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI võ hồn chưa nhận cờ này; lưu khai báo tường minh, không sửa công cụ hoặc RAW.

```text
--eye "portrait-attempt1=nhận diện — dây leo bị nhân hoá thành mặt có hai mắt, ngoài concept thực vật; bố cục chính diện, đầu ngọn bị cắt mép trên; dây mảnh và màu lạnh dính nền; candidate chưa đạt"
```

```text
--eye "portrait-attempt1=P1c2 — mảng dây leo tối giảm rõ và còn hình giống mặt; chưa đạt nhận diện thực vật."
```

Prompt lưu UTF-8 LF theo Git; SHA256 chuỗi gửi nguyên bản `c7486dc7f86bb15cf6c64d9851f208ba50e4cd3382d902be882e8f814a09de14` và `sent_prompt` ở source JSON. Chỉ chuẩn hóa xuống dòng, nội dung trùng CLI.
