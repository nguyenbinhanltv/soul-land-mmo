# Nhu Cốt Thố — concept 5 hướng (#1096)

RAW nguyên byte từ builtin `image_gen.imagegen`; chưa crop, đổi cỡ, chuyển bảng màu hoặc nhập game. Model/seed: unknown.

## Nguồn và prompt

Prompt tự sinh bằng `node tools/assets/vohon-prompt.mjs --type phaptuong --id nhu_cot_tho --style-ref <ảnh neo đã duyệt>`; không thêm addendum. Ảnh dẫn duy nhất: concept Hạo Thiên Chùy lượt 2, PR #1083. Không dùng ảnh cũ hay lượt lỗi làm dẫn. Mỗi lượt một lần sinh độc lập với ảnh neo duy nhất.

- `candidates/concept-attempt1.png`: 2115857 byte; SHA256 `4b3c59a2f815c8638406e72bbdc7da2845dfd725217bf31ec2a0ce74fbf17db9`; prompt SHA256 `298658c86df26ae5e89544b6360c99ae3d1528e9f89fe2f0a9862fbbbc531c68`.
- `candidates/concept-attempt2.png`: 2078875 byte; SHA256 `7f2be5e3022117fb3e59ab29ff7f037e55a0c80f8e194780dbc03ba472ee3893`; prompt SHA256 `298658c86df26ae5e89544b6360c99ae3d1528e9f89fe2f0a9862fbbbc531c68`.
- `candidates/concept-attempt3.png`: 1824410 byte; SHA256 `e4d6cfb04c501f29f0bbbe1c24f04040b1c1167ab5ce2739f9e5660d12f90aa3`; prompt SHA256 `298658c86df26ae5e89544b6360c99ae3d1528e9f89fe2f0a9862fbbbc531c68`.

## Tự soát RAW

- Số lượt: 3/3; lượt tốt nhất: 3.
- Mức: **chặn**. Tạo hình thỏ hung: tai dài nhọn, chân sau lớn, mắt đỏ hẹp; thân tím hồng sẫm, không dễ thương. Lượt 1: ne quay trái còn lộ mõm, tai / khí sát hoặc cắt mép. Lượt 2: se quay trái, ne còn mắt. Lượt 3 tốt nhất về bố cục, se đúng phải và không cắt tai, nhưng ne vẫn lộ mắt / răng. Không lượt nào đạt đủ góc lưng.
- Lượt 3 có 5 tư thế khác nhau nhưng chỉ 4 góc đáp ứng s, se, e, n; ne lộ mắt. Các lượt 1 và 2 còn sai phía hướng chéo.
- Không người, chữ, khung; nền alpha. Không sửa RAW để che lỗi. Chỉ concept, chưa duyệt làm nguồn cho các loại hình khác.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/nhu_cot_tho/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | 3 RAW concept Nhu Cốt Thố; model/seed unknown; prompt, SHA256 và nguồn trong các tệp đi kèm. | 2026-10-27 | Chưa nhập game; chặn. |
