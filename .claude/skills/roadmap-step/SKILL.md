---
name: roadmap-step
description: Quy trình làm trọn một bước trong mục Lộ trình của GAME_DESIGN.md (ví dụ "2.2", "3.1"): đọc thiết kế, code, typecheck, chạy bot test với server, rồi đánh dấu xong. Dùng khi được giao một bước Lộ trình hoặc một tính năng gameplay hoàn chỉnh.
---

# Làm một bước Lộ trình

Mỗi gạch đầu dòng ở `GAME_DESIGN.md` mục 7 là **một** lần giao việc. Làm nhỏ, xong hẳn rồi mới sang bước tiếp.

## 1. Đọc thiết kế
- Đọc `CLAUDE.md`, rồi `GAME_DESIGN.md`: mục 6 (Kiến trúc), mục 7 (bước đang làm và ghi chú *Đã làm* của bước trước), cùng các mục 5.x mà bước đó nhắc tới. Mục 4 cho biết luật cũ nào sẽ bị thay (dấu ➜).
- Đọc code liên quan trước khi sửa. Ghi ra kế hoạch ngắn: file nào đổi, message/trường đồng bộ/bảng mới nào.
- Điểm **(chờ chốt)** hay câu hỏi ở mục 8 mà bước này phụ thuộc: dùng phương án mặc định trong thiết kế và nêu rõ trong báo cáo; chỉ hỏi lại khi không có phương án mặc định.

## 2. Code (dùng skill tương ứng)
- Luật chơi, message, đồng bộ: `server-feature`.
- Hiển thị, phím, chạm: `client-ui`.
- Bảng/cột mới: `db-migration`.
- Con số: `balance-data`.
- Chỉ sửa trong phạm vi bước; không refactor lan ra ngoài.

## 3. Kiểm tra
1. `npm run check`: typecheck server và client (hook PostToolUse trong `.claude/settings.json` cũng tự chạy `tools/check.mjs --hook` sau mỗi lần sửa file; lỗi thì sửa ngay).
2. Bật server: `npm run dev:server` (chạy nền, đợi cổng 2567 sẵn sàng).
3. `npm run bot --prefix client` (bật server bằng `GAME_TEST=1` để bot thử cả các luồng cần hook `test`, ví dụ gục từng võ hồn và chia kinh nghiệm; không bật thì bot báo bỏ qua): 2 bot đăng nhập, thức tỉnh, di chuyển, đánh hồn thú, thử hấp thụ, chat. Bot không có assert, nên **đọc output**: `players 2`, B thấy A đổi vị trí, có `drops`/`kills`, dòng `absorb:` hợp lý, không có lỗi ở log server.
4. Bước có message hoặc luồng mới: thêm thao tác tương ứng vào `client/scripts/bot-test.mjs` để lần sau bot thử luôn.
5. Đổi giao diện: mở `http://localhost:5173` (`npm run dev:client`) và thử bằng tay.
6. Đổi SQL: thử thêm với PostgreSQL như trong skill `db-migration`.
7. Tắt server sau khi thử xong.

## 4. Cập nhật Lộ trình
- Trong `GAME_DESIGN.md` mục 7: đổi `- [ ]` thành `- [x]` cho bước vừa xong, thêm dòng *Đã làm:* ngắn (đã làm gì, quyết định nào khác thiết kế, phần nào để bước sau), như ghi chú của bước 2.1.
- Luật chơi thay đổi thì sửa luôn mục 4/5 tương ứng để thiết kế khớp code.
- Commit nhỏ, thông điệp tiếng Việt kiểu `Bước 2.2: ...` như lịch sử git. Pre-commit hook (`.githooks/`, bật bằng `npm run hooks`) sẽ typecheck lại.
