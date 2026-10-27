# Hỏa Long — concept năm hướng (#1096)

RAW nguyên byte từ builtin image_gen.imagegen, chưa crop, resize, hậu kỳ hay nhập game. Model/seed unknown.

- Số lượt đã dùng: 3/3. Bản chọn: concept-attempt3.png.
- SHA256 ảnh: bad3357f91644763647671b0e7cada9f6a376314b34c528dca829f9965be961a.
- Prompt concept-attempt3.prompt.txt; SHA256: d093e7f0b7ae29695490ff6f67225f16594bdcdc04c02f5d30f12757067a8ae3. Sinh nguyên văn bằng vohon-prompt.mjs, không thêm addendum.
- Neo phong cách: concept Hạo Thiên lượt 2 từ PR #1083; không dùng ảnh cũ hay ảnh lỗi.
- Số góc thật: 5; thứ tự s/se/e/ne/n. Nhận xét duyệt mắt: Lượt 1/2 trong candidates bị CHẶN do ne lộ mặt hoặc quay trái. Lượt 3: ne quay phải che mắt, còn mép miệng sáng; n không mặt. e hơi chếch. Thân than xám, lõi vàng; chi tiết nhỏ. Hết 3 lượt; cần duyệt ne.
- Chưa phải phê duyệt chính thức; không tạo asset game từ concept này.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| art/src/vohon-v2/hoa_long/ | - | builtin image_gen.imagegen (ChatGPT / Codex) | Concept năm hướng Hỏa Long; model/seed unknown; SHA256 và prompt ghi ở trên, từng lượt có source.json. | 2026-10-27 | Chỉ concept, chưa nhập game. |

## Kết quả kiểm RAW tại repo

- Bản chọn: concept-attempt3.png; kích thước 1983×793.
- vohon-check raw: **NHẸ**, tách đủ **5 hình**, chênh cỡ 1.01×, màu khớp **97%**.
- Cảnh báo máy: texture mềm, chưa đúng lưới khối.
- Ảnh neo nằm ở **nhánh PR #1083**, đường dẫn art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png, chưa phải ảnh sẵn có trên main.
- Dùng --type phaptuong theo khuôn concept #1096 để sinh bố cục năm hướng; không tạo pháp tướng thay thế hoặc nhập game.
- Candidates: mỗi lượt có 5 hình nhưng góc ne sai, chỉ 4 hướng đáp ứng; không dùng làm ảnh neo.

## Khai báo --eye theo quyết định ở PR #1147

Không sinh thêm; giữ bản chọn nêu trên. Concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý khi làm phụ thể với hình nộm. Công cụ võ hồn chưa nhận cờ --eye; các khai báo dưới đây được lưu tường minh và đồng bộ trong trường eye của source.json, không phải lệnh đã chạy.

- `--eye "concept-attempt3=hướng — se/e — hai góc gần giống nhau, e còn chếch trước"`
  LỖI: hướng — se/e — hai góc gần giống nhau, e còn chếch trước (mắt).
- `--eye "concept-attempt3=hướng — ne — còn mép miệng sáng, chưa che toàn bộ mặt; n nhìn lưng"`
  LỖI: hướng — ne — còn mép miệng sáng, chưa che toàn bộ mặt; n nhìn lưng (mắt).
