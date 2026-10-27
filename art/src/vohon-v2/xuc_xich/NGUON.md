# xuc_xich — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1 làm tham chiếu ngoại hình. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id xuc_xich --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: khoảng 3; vật gần đối xứng. Năm hình cùng khối xúc xích phong ấn, thân nâu đỏ và lõi vàng rõ; se/e/ne còn gần nhau, n vẫn hiện đai và lõi như phía trước. Khí vàng hơi mềm, chi tiết đai dày (nhẹ); không có mặt hay mắt. Chọn tham chiếu ngoại hình.

Chọn `concept-attempt1.png`; hồ sơ prompt và source JSON kèm cùng tên. Không phải sheet hoạt ảnh dùng trực tiếp. Các hướng cần sửa được xử lý ở khâu phụ thể bằng hình nộm.

SHA256 ảnh: `0310c598ef01a1970f7c85cd401ba65e0aade78a8974291ecb15a9cdb4a369d3`. SHA256 prompt: `a0be8a7ccb0cdcb8a2a60a02ab7edb7c263c34531c5697ed6991ac55247a0c6c`.

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
