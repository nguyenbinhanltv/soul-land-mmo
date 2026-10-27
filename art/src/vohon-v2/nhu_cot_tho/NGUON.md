# Nhu Cốt Thố — concept 5 hướng (#1096)

RAW nguyên byte từ builtin `image_gen.imagegen`; chưa crop, đổi cỡ, chuyển bảng màu hoặc nhập game. Model/seed: unknown.

## Nguồn và prompt

Prompt tự sinh bằng `node tools/assets/vohon-prompt.mjs --type phaptuong --id nhu_cot_tho --style-ref <ảnh neo đã duyệt>`; không thêm addendum. Ảnh dẫn duy nhất: concept Hạo Thiên Chùy lượt 2, PR #1083. Không dùng ảnh cũ hay lượt lỗi làm dẫn. Mỗi lượt một lần sinh độc lập với ảnh neo duy nhất.

- `candidates/concept-attempt1.png`: 2115857 byte; SHA256 `4b3c59a2f815c8638406e72bbdc7da2845dfd725217bf31ec2a0ce74fbf17db9`; prompt SHA256 `298658c86df26ae5e89544b6360c99ae3d1528e9f89fe2f0a9862fbbbc531c68`.
- `candidates/concept-attempt2.png`: 2078875 byte; SHA256 `7f2be5e3022117fb3e59ab29ff7f037e55a0c80f8e194780dbc03ba472ee3893`; prompt SHA256 `298658c86df26ae5e89544b6360c99ae3d1528e9f89fe2f0a9862fbbbc531c68`.
- `concept-attempt3.png`: 1824410 byte; SHA256 `e4d6cfb04c501f29f0bbbe1c24f04040b1c1167ab5ce2739f9e5660d12f90aa3`; prompt SHA256 `298658c86df26ae5e89544b6360c99ae3d1528e9f89fe2f0a9862fbbbc531c68`.

Công cụ dùng tạm `--type phaptuong` để sinh prompt năm hướng theo chỉ định chủ repo ở comment #6436237808 của issue #1096; đây chỉ là concept, không thay pháp tướng hiện có. Theo quyết định comment #6436570268, mẫu tốt nhất đã được chọn làm concept tham chiếu ngoại hình ở thư mục chính; các lượt còn lại giữ trong `candidates/`. Lỗi hướng không loại mẫu ngoại hình, sẽ xử lý ở khâu phụ thể có hình nộm.

## Tự soát RAW

- Số lượt: 3/3; lượt tốt nhất: 3.
- Mức: **chặn**. Tạo hình thỏ hung: tai dài nhọn, chân sau lớn, mắt đỏ hẹp; thân tím hồng sẫm, không dễ thương. Lượt 1: ne quay trái còn lộ mõm, tai / khí sát hoặc cắt mép. Lượt 2: se quay trái, ne còn mắt. Lượt 3 tốt nhất về bố cục, se đúng phải và không cắt tai, nhưng ne vẫn lộ mắt / răng. Không lượt nào đạt đủ góc lưng.
- Lượt 3 có 5 tư thế khác nhau nhưng chỉ 4 góc đáp ứng s, se, e, n; ne lộ mắt. Các lượt 1 và 2 còn sai phía hướng chéo.
- Không người, chữ, khung; nền alpha. Không sửa RAW để che lỗi. Chỉ concept; mẫu đã chọn chờ orchestrator duyệt ngoại hình, chưa nhập game.

- Kiểm RAW tự động: cả ba lượt NHẸ, tách được 5 cụm; lượt 2 có tỉ lệ 3:1, các lượt còn lại khoảng 5:2. Kết luận duyệt mắt vẫn CHẶN vì hướng chéo không đạt.

## Mẫu chọn và khai báo mắt (`--eye`)

Theo [quyết định orchestrator](https://github.com/nguyenbinhanltv/soul-land-mmo/pull/1146#issuecomment-6436570268): chọn `concept-attempt3.png` để tham chiếu ngoại hình, không sinh thêm. Mức chặn RAW phía trên vẫn lưu lịch sử lỗi; không coi lỗi hướng là điều kiện loại concept ngoại hình. Góc ne/n sửa ở khâu phụ thể có hình nộm.

Các khai báo dưới đây cũng lưu trong trường `eye` của source JSON. Công cụ võ hồn hiện chưa hỗ trợ tham số `--eye`; đây là khai báo hồ sơ, không phải lệnh đã thực thi bằng công cụ hồn thú.

```text
--eye "concept-attempt3=hướng — ne — còn lộ mắt / răng"
--eye "concept-attempt3=hướng — se/e — góc chéo và ngang còn gần nhau"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/nhu_cot_tho/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | 3 RAW concept Nhu Cốt Thố; model/seed unknown; prompt, SHA256 và nguồn trong các tệp đi kèm. | 2026-10-27 | Chưa nhập game; chặn. |

## Chân dung lượt 1 — #1158

Ngày 2026-10-27; 1/3 lượt. builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `portrait-attempt1.png`, SHA256 `045d5d8ebfd9c698cce021b7fc32711c7a2640021c6b8e1bfd3be62dfd2288f5`. Prompt CLI nguyên văn `portrait-attempt1.prompt.txt`, SHA256 `148ff68335bdc148d18850da69bbeaa1b3cd1c5e2752e4ebdffcc051a2f66142`; không viết tay, không addendum. Ảnh neo ngoại hình: `concept-attempt3.png`, SHA256 `e4d6cfb04c501f29f0bbbe1c24f04040b1c1167ab5ce2739f9e5660d12f90aa3`. Hồ sơ lệnh và kết quả kiểm: `portrait-attempt1.source.json`.

P1c: `--preset portrait`; bản thử `portrait-attempt1-P1c/nhu_cot_tho-portrait.png`, 64×64, 7 màu, giữ 8/8 điểm sáng. Xem `portrait-attempt1-P1c/preview/index.html` và `so-sanh.png`. Chưa được chủ repo duyệt mỹ thuật, chưa nhập game. Không sửa RAW.

### Khai báo duyệt mắt chân dung (`--eye`)

Công cụ vohon:check chưa có cờ --eye; chỉ khai tại đây, không đổi bộ kiểm.

```text
--eye "portrait-attempt1=góc nhìn — chính diện; đầu tai bị cắt mép trên; dải khí hồng rộng tranh mắt đỏ, lông nhiều nhánh"
```
