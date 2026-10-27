# BOARD v2 — Ngọc–Kim (nháp chờ duyệt)

Part of #877. Ảnh duy nhất từ Codex builtin `image_gen.imagegen`, lượt 1/3; model ID và seed không được cung cấp. Prompt nguyên khối do `ui:prompt --kind BOARD --style ngoc-kim` sinh, không viết tay/addendum. Yêu cầu Xếp Hạng được đưa vào nguồn bài học rồi sinh lại prompt trước lượt đầu. Không đính tham chiếu (BOARD cho phép bỏ ảnh hiện trạng).

RAW sao nguyên byte, không resize, không hậu kỳ; hash và đường dẫn gốc trong `source.json`. BOARD cũ (#940) không đổi. Nguồn/quyền sử dụng: ảnh tạo bằng OpenAI theo yêu cầu chủ repo, không gán CC0, không dùng asset bên thứ ba.

`ui:check BOARD`: PASS, 1536×1024, 0 chặn / 0 nhẹ / 0 cảnh báo. Công cụ chỉ kiểm cỡ/tỉ lệ BOARD; không phải duyệt mỹ thuật. Không sinh tờ liên hệ cho BOARD. Không có dòng LỖI tự sinh.

LỖI MẮT: vàng hơi sáng, nhiều điểm ngọc cùng hút mắt; vân cảnh trong bảng Nhân vật/Xếp Hạng khá rõ; một số viền kép; khe và mép hẹp hơn 5%. Chưa chứng minh khả năng 9-slice; chỉ là BOARD tham chiếu, không cắt/nhập game. Không thấy chữ/số đọc được. Đủ HUD sáu nút, bảng Mực, hộp Giấy, hotbar và Xếp Hạng với bục/hàng trống. Giữ lượt 1 làm nháp chủ repo chọn hướng; không tự công nhận đạt đẹp.

Sau lượt đã đọc ui:check và thêm đúng một bài học ngắn về giảm điểm sáng ngọc/vàng vào `lessons.md`. Không có lượt hỏng nên không phát sinh candidates.
