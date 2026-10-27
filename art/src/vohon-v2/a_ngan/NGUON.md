# a_ngan — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **2/3 lượt**, chọn lượt 2 làm tham chiếu ngoại hình. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id a_ngan --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: 5 hình, khoảng 4 góc rõ; s/se còn gần nhau. Chọn lượt 2 tốt hơn về khoảng cách và khối hoa/cổ thụ. ne/n nhìn phía sau không lộ nhụy chính; e vẫn hơi ba phần tư trước, s/se gần nhau. Dây vàng và hoa lam nhụy vàng trắng nhận ra; chi tiết vỏ cây còn dày, vài hạt sáng bị vẽ sẵn thay vì để code (nhẹ). Lượt 1 bị CHẶN máy do chỉ tách được 3 khối rễ, lưu ở candidates; không dùng ảnh hỏng làm ảnh dẫn.

Chọn `concept-attempt2.png`; hồ sơ prompt và source JSON kèm cùng tên. Không phải sheet hoạt ảnh dùng trực tiếp. Các hướng cần sửa được xử lý ở khâu phụ thể bằng hình nộm.

SHA256 ảnh: `d510d4409629e9a0e18d02e1872cb9bc5b0b1c5e9ccceacba9e7c8c0984fd8db`. SHA256 prompt: `ce89d72abd8d5205b74b310105c3eebdd8f263f3f3e4e37dd48be68411920f41`.

## Kiểm RAW

```text
raw concept-attempt2.png pháp tướng (a_ngan): NHẸ
  [NHẸ] mem: texture mềm: 81% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] nhieu-mau: 166 màu đáng kể (nên ≤ 160 để ép về ≤ 48 mà không bệt)
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.09 ở chu kỳ 23 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  [NHẸ] lech-mau: 44% điểm sáng cùng họ màu robe / col của a_ngan (mục 4 cần ≥ 50%)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.01,"softness":0.814,"bigColors":166,"grid":{"period":23,"ratio":1.09},"paletteMatch":0.44}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo theo khuôn, không thay kết quả máy:

```text
--eye "concept-attempt2=hướng / hình — Chọn lượt 2 tốt hơn về khoảng cách và khối hoa/cổ thụ. ne/n nhìn phía sau không lộ nhụy chính; e vẫn hơi ba phần tư trước, s/se gần nhau. Dây vàng và hoa lam nhụy vàng trắng nhận ra; chi tiết vỏ cây còn dày, vài hạt sáng bị vẽ sẵn thay vì để code (nhẹ). Lượt 1 bị CHẶN máy do chỉ tách được 3 khối rễ, lưu ở candidates; không dùng ảnh hỏng làm ảnh dẫn."
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/a_ngan/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |

## Lượt không chọn

- Lượt 1: candidates/concept-attempt1.png; SHA256 ảnh e7850d3aa55dc567afa2d8a2a928fc8f7223f0d3b9f08ef64d071f84cf70f86f; SHA256 prompt ce89d72abd8d5205b74b310105c3eebdd8f263f3f3e4e37dd48be68411920f41. CHẶN máy: chỉ tách 3 khối. Thân cổ thụ lam xanh xoắn, hoa vàng trắng và dây vàng rủ đúng hình mẫu; ne còn thấy nhụy phía trước, n nhìn lưng đúng. Không có mặt sinh vật, không sinh thêm để sửa ne/n. s/se/e còn gần nhau; dây rủ có chi tiết nhỏ, hình ngoài sát mép. Chọn tham chiếu ngoại hình, chưa coi là sheet năm hướng dùng trực tiếp.

Prompt trong repo chuẩn hóa xuống dòng LF đúng byte Git; SHA trước chuẩn hóa CRLF giữ trong source JSON. Nội dung prompt tự sinh không sửa.
