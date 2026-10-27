# Yêu Hồ — concept 5 hướng (#1096)

RAW nguyên byte từ builtin `image_gen.imagegen`; chưa crop, đổi cỡ, chuyển bảng màu hoặc nhập game. Model/seed: unknown.

## Nguồn và prompt

Prompt tự sinh bằng `node tools/assets/vohon-prompt.mjs --type phaptuong --id yeu_ho --style-ref <ảnh neo đã duyệt>`; không thêm addendum. Ảnh dẫn duy nhất: concept Hạo Thiên Chùy lượt 2, PR #1083. Không dùng ảnh cũ hay lượt lỗi làm dẫn. Mỗi lượt một lần sinh độc lập với ảnh neo duy nhất.

- `concept-attempt1.png`: 1800563 byte; SHA256 `de239894a83bfeeb5b0d099fd2869980fb2c6a6d31ea58bc18cdfe2be15624a8`; prompt SHA256 `c26e20daecdaa57bd836e45444817b4c805fecb09ee45a92301d24c261bcd0d7`.
- `candidates/concept-attempt2.png`: 1715674 byte; SHA256 `e4c6c57ea5ce273f6a3f67cc898f69e1e40b99242fd2ad08986479442b1ee79d`; prompt SHA256 `c26e20daecdaa57bd836e45444817b4c805fecb09ee45a92301d24c261bcd0d7`.
- `candidates/concept-attempt3.png`: 1653576 byte; SHA256 `9065cdbd2de0d0cac8cff277b480b07ad42b7497e5328fbbd2cc096f0096aff6`; prompt SHA256 `c26e20daecdaa57bd836e45444817b4c805fecb09ee45a92301d24c261bcd0d7`.

Công cụ dùng tạm `--type phaptuong` để sinh prompt năm hướng theo chỉ định chủ repo ở comment #6436237808 của issue #1096; đây chỉ là concept, không thay pháp tướng hiện có. Theo quyết định comment #6436570268, mẫu tốt nhất đã được chọn làm concept tham chiếu ngoại hình ở thư mục chính; các lượt còn lại giữ trong `candidates/`. Lỗi hướng không loại mẫu ngoại hình, sẽ xử lý ở khâu phụ thể có hình nộm.

## Tự soát RAW

- Số lượt: 3/3; lượt tốt nhất: 1.
- Mức: **chặn**. Lượt 1: góc ne và n không lộ mặt, nhưng thừa trang sức vàng / tua đỏ ngoài brief và các khối đuôi không nhất quán ba đuôi. Lượt 2: bỏ trang sức nhưng hình s có ít nhất bốn khối đuôi, ne lộ mặt; sát brief hơn về trang sức nhưng ne lộ mặt và hình sát nhau nên không chọn. Lượt 3: thừa trang sức, nhiều hơn ba đuôi và ne quay sai / lộ mặt. Cả ba bị chặn nhận diện.
- Lượt 1 có 5 góc thật; lượt 2 chỉ 4 góc đáp ứng (ne lộ mặt); lượt 3 không đạt ne. Không ảnh nào đạt đồng thời hướng và đúng ba đuôi.
- Không người, chữ, khung; nền alpha. Không sửa RAW để che lỗi. Chỉ concept; mẫu đã chọn chờ orchestrator duyệt ngoại hình, chưa nhập game.

- Kiểm RAW tự động: lượt 1 NHẸ (5 cụm), lượt 2 CHẶN (3 cụm), lượt 3 NHẸ (5 cụm). Chọn lại lượt 1 vì có 5 góc đúng và không lộ mặt ở ne/n; vẫn CHẶN số đuôi / trang sức ngoài brief.

## Mẫu chọn và khai báo mắt (`--eye`)

Theo [quyết định orchestrator](https://github.com/nguyenbinhanltv/soul-land-mmo/pull/1146#issuecomment-6436570268): chọn `concept-attempt1.png` để tham chiếu ngoại hình, không sinh thêm. Mức chặn RAW phía trên vẫn lưu lịch sử lỗi; không coi lỗi hướng là điều kiện loại concept ngoại hình. Góc ne/n sửa ở khâu phụ thể có hình nộm.

Các khai báo dưới đây cũng lưu trong trường `eye` của source JSON. Công cụ võ hồn hiện chưa hỗ trợ tham số `--eye`; đây là khai báo hồ sơ, không phải lệnh đã thực thi bằng công cụ hồn thú.

```text
--eye "concept-attempt1=nhận diện — các hướng — số khối đuôi chưa nhất quán ba đuôi"
--eye "concept-attempt1=motif — các hướng — trang sức vàng và tua đỏ ngoài brief"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/yeu_ho/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | 3 RAW concept Yêu Hồ; model/seed unknown; prompt, SHA256 và nguồn trong các tệp đi kèm. | 2026-10-27 | Chưa nhập game; chặn. |
