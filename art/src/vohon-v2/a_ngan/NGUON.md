# a_ngan — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1 làm tham chiếu ngoại hình. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id a_ngan --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: 4 rõ; ne còn lộ nhụy hoa. Thân cổ thụ lam xanh xoắn, hoa vàng trắng và dây vàng rủ đúng hình mẫu; ne còn thấy nhụy phía trước, n nhìn lưng đúng. Không có mặt sinh vật, không sinh thêm để sửa ne/n. s/se/e còn gần nhau; dây rủ có chi tiết nhỏ, hình ngoài sát mép. Chọn tham chiếu ngoại hình, chưa coi là sheet năm hướng dùng trực tiếp.

Chọn `concept-attempt1.png`; hồ sơ prompt và source JSON kèm cùng tên. Không phải sheet hoạt ảnh dùng trực tiếp. Các hướng cần sửa được xử lý ở khâu phụ thể bằng hình nộm.

SHA256 ảnh: `e7850d3aa55dc567afa2d8a2a928fc8f7223f0d3b9f08ef64d071f84cf70f86f`. SHA256 prompt: `f4d8835a2e60ed7d3551fdf930610f362c48f05a3666195b1d643f788e214179`.

## Kiểm RAW

```text
raw concept-attempt1.png pháp tướng (a_ngan): CHẶN
  [CHẶN] huong: tách được 3 hướng, cần 5 (s, se, e, ne, n) cách nhau bằng khoảng trống
  [NHẸ] mem: texture mềm: 78% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] nhieu-mau: 186 màu đáng kể (nên ≤ 160 để ép về ≤ 48 mà không bệt)
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.08 ở chu kỳ 35 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  [NHẸ] lech-mau: 47% điểm sáng cùng họ màu robe / col của a_ngan (mục 4 cần ≥ 50%)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":3,"softness":0.787,"bigColors":186,"grid":{"period":35,"ratio":1.08},"paletteMatch":0.47}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo theo khuôn, không thay kết quả máy:

```text
--eye "concept-attempt1=hướng / hình — Thân cổ thụ lam xanh xoắn, hoa vàng trắng và dây vàng rủ đúng hình mẫu; ne còn thấy nhụy phía trước, n nhìn lưng đúng. Không có mặt sinh vật, không sinh thêm để sửa ne/n. s/se/e còn gần nhau; dây rủ có chi tiết nhỏ, hình ngoài sát mép. Chọn tham chiếu ngoại hình, chưa coi là sheet năm hướng dùng trực tiếp."
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/a_ngan/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |
