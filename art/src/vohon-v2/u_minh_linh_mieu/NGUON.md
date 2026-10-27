# U Minh Linh Miêu — concept năm hướng (#1096)

RAW nguyên byte từ builtin image_gen.imagegen, chưa crop, resize, hậu kỳ hay nhập game. Model/seed unknown.

- Số lượt đã dùng: 1/3. Bản chọn: concept-attempt1.png.
- SHA256 ảnh: 15c2147ec62e9e1bdbe8752161bf3f31863e4ce5b46e93b4ad1c2c081dbb2e36.
- Prompt concept-attempt1.prompt.txt; SHA256: 487036f69ae0f8786a0d69d5fabb6af71dc9481f32494d58187b62ddf3a3f84b. Sinh nguyên văn bằng vohon-prompt.mjs, không thêm addendum.
- Neo phong cách: concept Hạo Thiên lượt 2 từ PR #1083; không dùng ảnh cũ hay ảnh lỗi.
- Số góc thật: 5; thứ tự s/se/e/ne/n. Nhận xét duyệt mắt: ne/n nhìn lưng, không mặt. e rộng và hơi chếch; mắt tím sáng, móng rõ; khí tím rộng, cạnh mềm. Không chữ, người, khung.
- Chưa phải phê duyệt chính thức; không tạo asset game từ concept này.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| art/src/vohon-v2/u_minh_linh_mieu/ | - | builtin image_gen.imagegen (ChatGPT / Codex) | Concept năm hướng U Minh Linh Miêu; model/seed unknown; SHA256 và prompt ghi ở trên, từng lượt có source.json. | 2026-10-27 | Chỉ concept, chưa nhập game. |

## Kết quả kiểm RAW tại repo

- Bản chọn: concept-attempt1.png; kích thước 2172×724.
- vohon-check raw: **NHẸ**, tách đủ **5 hình**, chênh cỡ 1.12×, màu khớp **98%**.
- Cảnh báo máy: texture mềm, chưa đúng lưới khối.
- Ảnh neo nằm ở **nhánh PR #1083**, đường dẫn art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png, chưa phải ảnh sẵn có trên main.
- Dùng --type phaptuong theo khuôn concept #1096 để sinh bố cục năm hướng; không tạo pháp tướng thay thế hoặc nhập game.

## Khai báo --eye theo quyết định ở PR #1147

Không sinh thêm; giữ bản chọn nêu trên. Concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý khi làm phụ thể với hình nộm. Công cụ võ hồn chưa nhận cờ --eye; các khai báo dưới đây được lưu tường minh và đồng bộ trong trường eye của source.json, không phải lệnh đã chạy.

- `--eye "concept-attempt1=hướng — e — còn hơi chếch, hình ngang rộng hơn các góc khác; ne/n không lộ mặt"`
  LỖI: hướng — e — còn hơi chếch, hình ngang rộng hơn các góc khác; ne/n không lộ mặt (mắt).
