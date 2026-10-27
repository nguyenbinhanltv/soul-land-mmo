# thien_can_bach_ngoc_dinh — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1 làm tham chiếu ngoại hình. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id thien_can_bach_ngoc_dinh --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: khoảng 3; vật cứng gần đối xứng. Đỉnh ba chân, hai quai, nắp núm và khói ngọc rõ; s/se gần nhau, e/ne chưa nghiêng đủ, n đổi sang vòng bát quái. Khối thân thiên đồng tối hơn ngọc ngà mong muốn; khắc nhiều chi tiết, quai ngoài sát mép. Mặt thao thiết là hoa văn thân đỉnh, không phải lỗi mắt sinh vật. Chọn tham chiếu ngoại hình.

Chọn `concept-attempt1.png`; hồ sơ prompt và source JSON kèm cùng tên. Không phải sheet hoạt ảnh dùng trực tiếp. Các hướng cần sửa được xử lý ở khâu phụ thể bằng hình nộm.

SHA256 ảnh: `ee78be8f3d9a0f7d1124704380adf4755f44d146aec0bb50998ff2e5812b011d`. SHA256 prompt: `490fd731b4d1bd4771dae58873f1c9bdc1d3e1ec2d45eb53c96cd858175d22c5`.

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
