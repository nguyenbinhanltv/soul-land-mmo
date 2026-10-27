# lam_ngan_thao — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1 làm tham chiếu ngoại hình. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id lam_ngan_thao --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: khoảng 3; thân gần đối xứng, s/n gần nhau. Năm hình tách được; se/e/ne đổi góc nhưng chưa rõ, s/n gần nhau; dây ngoài chạm và bị cắt ở mép trái/phải. Khối dây lam đậm, ngọn trắng và đạo văn nhận ra; còn nhiều chi tiết nhỏ (nhẹ). Không có mặt để đánh giá lộ mắt.

Chọn `concept-attempt1.png`; hồ sơ prompt và source JSON kèm cùng tên. Không phải sheet hoạt ảnh dùng trực tiếp. Các hướng cần sửa được xử lý ở khâu phụ thể bằng hình nộm.

SHA256 ảnh: `831f842c891248dc79d9e23d973969eb8b5608f0efe1e705e56b574526c74c35`. SHA256 prompt: `63b388ee2434a47388381fe4f5d12273ce7b623d091b9a6fe7f8e21805b27471`.

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
| `art/src/vohon-v2/lam_ngan_thao/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |
