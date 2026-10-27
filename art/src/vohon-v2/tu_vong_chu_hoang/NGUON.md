# Tử Vong Chu Hoàng — concept 5 hướng (#1096)

RAW nguyên byte từ builtin `image_gen.imagegen`; chưa crop, đổi cỡ, chuyển bảng màu hoặc nhập game. Model/seed: unknown.

## Nguồn và prompt

Prompt tự sinh bằng `node tools/assets/vohon-prompt.mjs --type phaptuong --id tu_vong_chu_hoang --style-ref <ảnh neo đã duyệt>`; không thêm addendum. Ảnh dẫn duy nhất: concept Hạo Thiên Chùy lượt 2, PR #1083. Không dùng ảnh cũ hay lượt lỗi làm dẫn. Mỗi lượt một lần sinh độc lập với ảnh neo duy nhất.

- `concept-attempt1.png`: 1547271 byte; SHA256 `b9cdc21f23c580792231cf131a6b4a91ac0676d2e080f7f5a9e21e6786fab656`; prompt SHA256 `bf854a6f9ae1fdda47cc030d9f8508c01ea236346d5a8e9e8ee8ac9161c28626`.

## Tự soát RAW

- Số lượt: 1/3; lượt tốt nhất: 1.
- Mức: **nhẹ**. Đề xuất lượt 1: nhện tím đen, khớp trắng ngà, mắt tím, sọ đỏ trên bụng và tơ có bùa đúng brief; năm hình không người / chữ / khung. Nhẹ: chân chồng nhau nên khó đếm đủ tám ở góc nghiêng; tơ và đạo văn nhỏ, sọ đỏ hơi lớn so với nhấn đỏ rất ít; chưa đơn giản như neo Hạo Thiên. Không thấy mắt / mặt ở ne và n. Chờ orchestrator duyệt tạo hình, không tự coi là nguồn đã duyệt.
- Có 5 góc nhìn thật s, se, e, ne, n; ne và n nhìn lưng không lộ mặt. Góc e còn hơi chếch trước.
- Không người, chữ, khung; nền alpha. Không sửa RAW để che lỗi. Chỉ concept, chưa duyệt làm nguồn cho các loại hình khác.

- Kiểm RAW tự động: NHẸ, 5 cụm; texture mềm (73%), 203 màu đáng kể, lưới chưa cứng, 43% điểm sáng gần bảng màu game. Các cảnh báo này không thay thế duyệt hướng bằng mắt.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/tu_vong_chu_hoang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | 1 RAW concept Tử Vong Chu Hoàng; model/seed unknown; prompt, SHA256 và nguồn trong các tệp đi kèm. | 2026-10-27 | Chưa nhập game; nhẹ. |
