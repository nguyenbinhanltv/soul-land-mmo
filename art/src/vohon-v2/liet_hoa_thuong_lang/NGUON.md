# Liệt Hỏa Thương Lang — concept 5 hướng (#1096)

RAW nguyên byte từ builtin `image_gen.imagegen`; chưa crop, đổi cỡ, chuyển bảng màu hoặc nhập game. Model/seed: unknown.

## Nguồn và prompt

Prompt tự sinh bằng `node tools/assets/vohon-prompt.mjs --type phaptuong --id liet_hoa_thuong_lang --style-ref <ảnh neo đã duyệt>`; không thêm addendum. Ảnh dẫn duy nhất: concept Hạo Thiên Chùy lượt 2, PR #1083. Không dùng ảnh cũ hay lượt lỗi làm dẫn. Mỗi lượt một lần sinh độc lập với ảnh neo duy nhất.

- `candidates/concept-attempt1.png`: 1446887 byte; SHA256 `7a19c441e813a8c6ae05d46d713ef1a185b1f6bc2c210aa87c9cf391a0731d5b`; prompt SHA256 `a8b951c0c2d4cd74bf39248caba17dfe69cdaa74397ac35d3409989629f3ac2f`.
- `candidates/concept-attempt2.png`: 1385926 byte; SHA256 `7a815894d55a45cd936ff83f7d84fbb3f8c9d82a772d04e4b9782fc30d9b7452`; prompt SHA256 `a8b951c0c2d4cd74bf39248caba17dfe69cdaa74397ac35d3409989629f3ac2f`.
- `candidates/concept-attempt3.png`: 1475968 byte; SHA256 `3ee22a885eed62d121cde6f32c7e4261d9087b686c6e20c33e0c1f40bfdf3269`; prompt SHA256 `a8b951c0c2d4cd74bf39248caba17dfe69cdaa74397ac35d3409989629f3ac2f`.

## Tự soát RAW

- Số lượt: 3/3; lượt tốt nhất: 1.
- Mức: **chặn**. Cả ba lượt còn mắt / mõm ở góc ne. Thân xám nâu than và lửa cam đọc rõ; tạo hình hung, nhưng lửa và vân còn dày, vài hình sát nhau. Lượt 1 có khoảng tách hình rõ hơn. Không có lượt đạt đủ yêu cầu hướng lưng.
- Có 5 tư thế khác nhau nhưng chỉ 4 góc đáp ứng: s, se, e, n; ne nhìn thân sau nhưng ngoảnh đầu lộ mặt, bị chặn.
- Không người, chữ, khung; nền alpha. Không sửa RAW để che lỗi. Chỉ concept, chưa duyệt làm nguồn cho các loại hình khác.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/liet_hoa_thuong_lang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | 3 RAW concept Liệt Hỏa Thương Lang; model/seed unknown; prompt, SHA256 và nguồn trong các tệp đi kèm. | 2026-10-27 | Chưa nhập game; chặn. |
