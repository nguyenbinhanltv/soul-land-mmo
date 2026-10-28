# Phá Hồn Thương — phụ thể hoạt ảnh lô 7

Part of #1025. Sinh bằng builtin image_gen.imagegen, model/seed unknown; RAW giữ nguyên byte, không hậu kỳ. Prompt nguyên văn từ phuthe-sheet-prompt.mjs --concept-ref; SHA256 RAW, prompt và hai ảnh tham chiếu theo thứ tự nằm trong từng source.json. Màu khóa thực tế: #D0D000. Concept đã duyệt: art/src/vohon-v2/pha_hon_thuong/concept-attempt1.png.

| Tờ / hướng | Số lượt | Kết quả |
|---|---|---|
| A / s | 3 | lượt 3: 0 chặn; lượt 1 trôi thân, lượt 2 mất đăng ký thân, lưu candidates |
| B / se | 1 | 0 chặn |
| C / e | 1 | 0 chặn |
| D / ne | 1 | 0 chặn |
| E / n | 1 | 0 chặn |

Cutter: 65 khung, 0 block / 65 warn. Cảnh báo chủ yếu chạm/xén mép và vị trí thân. Chỉ nhập hướng 0 chặn kỹ thuật theo cho phép của chủ repo; neo tự động, worker khác chỉnh sau.

Soát mắt: thương lớn so với thân; một số pha đâm vươn ngang/xén mép; tay cầm và thân nhỏ/dời so với bảng. Góc se/ne và n còn pha gần hướng e; không chứng nhận căn đẹp. Đã xem tờ liên hệ A–E và khung GIF ráp LPC; preview nam/nữ đủ clip trong artifact phiên 722.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| to{A..E}.png; candidates/toA-attempt{1,2}.png | vhanim_pha_hon_thuong_b / vhanim_pha_hon_thuong_f | builtin image_gen.imagegen (Codex, Q44) | Prompt phuthe-sheet-prompt --concept-ref, prompt/source cùng tên | 2026-10-28 | 7 lượt; RAW nguyên byte; model/seed unknown |
