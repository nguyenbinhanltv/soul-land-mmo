---
name: roadmap-step
description: Quy trình làm trọn một bước trong mục Lộ trình của GAME_DESIGN.md hoặc một tính năng gameplay hoàn chỉnh: đọc thiết kế, code, typecheck, chạy bot test với server, cập nhật thiết kế rồi đánh dấu xong. Dùng khi được giao một bước Lộ trình hoặc một việc trong "Việc để sau".
---

# Làm một bước Lộ trình

Mỗi gạch đầu dòng ở `GAME_DESIGN.md` mục 7 là **một** lần giao việc. Làm nhỏ, xong hẳn rồi mới sang việc tiếp; việc lớn trong "Việc để sau" thì tách thành bước nhỏ trước.

## 1. Đọc thiết kế
- Đọc `CLAUDE.md`, rồi `GAME_DESIGN.md`: mục 4 (luật chung), mục 6 (Kiến trúc, bắt buộc giữ), mục 7 (việc đang làm), cùng các mục 5.x liên quan.
- Đọc code liên quan trước khi sửa. Viết kế hoạch ngắn: file nào đổi, message / trường đồng bộ / bảng mới nào.
- Thiết kế chưa nói rõ: chọn phương án đơn giản nhất khớp mục 2 (thua không mất đồ, đội hình quan trọng, chơi cùng bạn bè, không nạp tiền) và nêu rõ trong báo cáo / PR; chỉ hỏi lại khi quyết định đó thật sự thuộc về người dùng. Câu hỏi còn mở ở mục 8.

## 2. Code (dùng skill tương ứng)
- Luật chơi, message, đồng bộ, lưu: `server-feature`.
- Hiển thị, phím, chạm: `client-ui`.
- Bảng / cột mới: `db-migration`.
- Con số: `balance-data`.
- Sprite: `asset-gen`.
- Chỉ sửa trong phạm vi bước; không refactor lan ra ngoài.

## 3. Kiểm tra
1. `npm run check` (hook PostToolUse cũng tự chạy `tools/check.mjs --hook` sau mỗi lần sửa; lỗi thì sửa ngay).
2. Bot ở máy bằng `npm run bot:local -- --only <nhóm>` hoặc `--part 1|2|3` (server mới bật `GAME_TEST=1`, cổng trống, tự dọn; tối đa 2 lượt cùng lúc trên máy). Bot đầy đủ để job CI `bot-ram` chạy mỗi push. Đổi SQL / `db.ts` thì thêm `--pg`.
3. Đọc output: dòng ✗ là lỗi thật, ⚠ là phần bị bỏ qua; xem log server (`ci-logs/local-*-server.log`) không có lỗi. Đổi luật kênh thì chạy thêm `npm run bot:local -- --channels`.
4. Luồng / message mới: thêm kiểm tra vào `client/scripts/bot-test.mjs`; luồng khó dựng bằng bot thì thêm `op` cho hook `test` gọi đúng hàm luật chơi (chỉ chạy khi `GAME_TEST=1`), không viết luật riêng cho bot.
5. Đổi giao diện: `npm run dev:client`, mở `http://localhost:5173` thử bằng tay (chuột, phím, chạm).
6. Đổi SQL / `db.ts`: thử với PostgreSQL như skill `db-migration`.
7. Tắt đúng các tiến trình mình đã bật.

## 4. Cập nhật thiết kế và mở PR
- Sửa mục 4 / 5 / 6 của `GAME_DESIGN.md` để mô tả **luật hiện hành** sau thay đổi (cơ chế + tên hằng, không chép bảng số, không viết nhật ký "đã làm ở bước…"). Giữ nguyên số mục và mọi câu mà code đang trích dẫn (`grep -rn "mục [0-9]" server/src shared client/src tools`).
- Mục 7: bước xong thì bỏ dòng `[ ]` và thêm vài chữ vào đoạn "Đã có" của giai đoạn đó (kèm số bước); còn phần dở thì giữ dòng, ghi ngắn "Còn: …". Câu hỏi đã chốt thì bỏ khỏi mục 8.
- Commit nhỏ, thông điệp tiếng Việt kiểu `Bước 9.6: …`; pre-commit hook typecheck lại. Một PR vào `main` cho mỗi bước, mô tả gồm tóm tắt, cách kiểm thử, quyết định khác thiết kế, phần để sau.
- Trước khi push: `git fetch` rồi merge `origin/main` (không rebase, không force push), chạy lại `npm run check`. PR đang review thì không push thêm trừ khi sửa theo lỗi review.
