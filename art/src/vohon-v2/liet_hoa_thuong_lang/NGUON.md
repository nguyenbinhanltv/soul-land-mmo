# Liệt Hỏa Thương Lang — concept 5 hướng (#1096)

RAW nguyên byte từ builtin `image_gen.imagegen`; chưa crop, đổi cỡ, chuyển bảng màu hoặc nhập game. Model/seed: unknown.

## Nguồn và prompt

Prompt tự sinh bằng `node tools/assets/vohon-prompt.mjs --type phaptuong --id liet_hoa_thuong_lang --style-ref <ảnh neo đã duyệt>`; không thêm addendum. Ảnh dẫn duy nhất: concept Hạo Thiên Chùy lượt 2, PR #1083. Không dùng ảnh cũ hay lượt lỗi làm dẫn. Mỗi lượt một lần sinh độc lập với ảnh neo duy nhất.

- `candidates/concept-attempt1.png`: 1446887 byte; SHA256 `7a19c441e813a8c6ae05d46d713ef1a185b1f6bc2c210aa87c9cf391a0731d5b`; prompt SHA256 `a8b951c0c2d4cd74bf39248caba17dfe69cdaa74397ac35d3409989629f3ac2f`.
- `candidates/concept-attempt2.png`: 1385926 byte; SHA256 `7a815894d55a45cd936ff83f7d84fbb3f8c9d82a772d04e4b9782fc30d9b7452`; prompt SHA256 `a8b951c0c2d4cd74bf39248caba17dfe69cdaa74397ac35d3409989629f3ac2f`.
- `concept-attempt3.png`: 1475968 byte; SHA256 `3ee22a885eed62d121cde6f32c7e4261d9087b686c6e20c33e0c1f40bfdf3269`; prompt SHA256 `a8b951c0c2d4cd74bf39248caba17dfe69cdaa74397ac35d3409989629f3ac2f`.

Công cụ dùng tạm `--type phaptuong` để sinh prompt năm hướng theo chỉ định chủ repo ở comment #6436237808 của issue #1096; đây chỉ là concept, không thay pháp tướng hiện có. Theo quyết định comment #6436570268, mẫu tốt nhất đã được chọn làm concept tham chiếu ngoại hình ở thư mục chính; các lượt còn lại giữ trong `candidates/`. Lỗi hướng không loại mẫu ngoại hình, sẽ xử lý ở khâu phụ thể có hình nộm.

## Tự soát RAW

- Số lượt: 3/3; lượt tốt nhất: 3.
- Mức: **chặn**. Cả ba lượt còn mắt / mõm ở góc ne. Thân xám nâu than và lửa cam đọc rõ; tạo hình hung, nhưng lửa và vân còn dày, vài hình sát nhau. Lượt 1 có dáng dễ đọc nhưng các hình vẫn sát nhau; kiểm tự động chỉ tách 3 cụm nên chọn lượt 3 có đủ 5 cụm. Không có lượt đạt đủ yêu cầu hướng lưng.
- Có 5 tư thế khác nhau nhưng chỉ 4 góc đáp ứng: s, se, e, n; ne nhìn thân sau nhưng ngoảnh đầu lộ mặt, bị chặn.
- Không người, chữ, khung; nền alpha. Không sửa RAW để che lỗi. Chỉ concept; mẫu đã chọn chờ orchestrator duyệt ngoại hình, chưa nhập game.

- Kiểm RAW tự động: lượt 1 CHẶN (chỉ tách 3 cụm), lượt 2 CHẶN (4 cụm), lượt 3 NHẸ (5 cụm). Chọn lại lượt 3 vì tách đủ 5 hình; cả ba vẫn CHẶN khi duyệt mắt do ne lộ mặt.

## Mẫu chọn và khai báo mắt (`--eye`)

Theo [quyết định orchestrator](https://github.com/nguyenbinhanltv/soul-land-mmo/pull/1146#issuecomment-6436570268): chọn `concept-attempt3.png` để tham chiếu ngoại hình, không sinh thêm. Mức chặn RAW phía trên vẫn lưu lịch sử lỗi; không coi lỗi hướng là điều kiện loại concept ngoại hình. Góc ne/n sửa ở khâu phụ thể có hình nộm.

Các khai báo dưới đây cũng lưu trong trường `eye` của source JSON. Công cụ võ hồn hiện chưa hỗ trợ tham số `--eye`; đây là khai báo hồ sơ, không phải lệnh đã thực thi bằng công cụ hồn thú.

```text
--eye "concept-attempt3=hướng — ne — còn lộ mắt / mõm"
--eye "concept-attempt3=chi tiết — thân và đuôi — lửa và vân dày"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/liet_hoa_thuong_lang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | 3 RAW concept Liệt Hỏa Thương Lang; model/seed unknown; prompt, SHA256 và nguồn trong các tệp đi kèm. | 2026-10-27 | Chưa nhập game; chặn. |
