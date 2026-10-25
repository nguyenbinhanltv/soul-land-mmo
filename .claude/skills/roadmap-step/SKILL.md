---
name: roadmap-step
description: Quy trình làm trọn một bước trong `ROADMAP.md` hoặc một tính năng gameplay hoàn chỉnh: đọc thiết kế, code, typecheck, chạy bot test với server, cập nhật thiết kế rồi đánh dấu xong. Dùng khi được giao một bước Lộ trình hoặc một việc trong "Việc để sau".
---

# Làm một bước Lộ trình

Mỗi gạch đầu dòng ở `ROADMAP.md` (mục 7) là **một** lần giao việc. Làm nhỏ, xong hẳn rồi mới sang việc tiếp; việc lớn trong "Việc để sau" thì tách thành bước nhỏ trước.

## 1. Đọc thiết kế
- Đọc `CLAUDE.md`, rồi `GAME_DESIGN.md` (mục lục + luật chung), `docs/design/01-luat-chung.md`, `docs/tech/` liên quan (kiến trúc, bắt buộc giữ), `ROADMAP.md` (việc đang làm), cùng file `docs/design/` của hệ thống sửa (bảng trong `CLAUDE.md`) và `docs/quyet-dinh.md`.
- Đọc code liên quan trước khi sửa. Viết kế hoạch ngắn: file nào đổi, message / trường đồng bộ / bảng mới nào.
- Thiết kế chưa nói rõ: chọn phương án đơn giản nhất khớp `docs/design/00-tong-quan.md` (thua không mất đồ, đội hình quan trọng, chơi cùng bạn bè, không nạp tiền) và nêu rõ trong báo cáo / PR; chỉ hỏi lại khi quyết định đó thật sự thuộc về người dùng. Câu hỏi còn mở ở `ROADMAP.md` mục 8 và mục "Việc đang chờ" của `docs/quyet-dinh.md`.

## 2. Code (dùng skill tương ứng)
- Luật chơi, message, đồng bộ, lưu: `server-feature`.
- Hiển thị, phím, chạm: `client-ui`.
- Bảng / cột mới: `db-migration`.
- Con số: `balance-data`.
- Sprite: `asset-gen`.
- Chỉ sửa trong phạm vi bước; không refactor lan ra ngoài.

## 3. Kiểm tra
1. `npm run check` (hook PostToolUse cũng tự chạy `tools/check.mjs --hook` sau mỗi lần sửa; lỗi thì sửa ngay).
2. Bot ở máy bằng `npm run bot:local -- --only <nhóm>` hoặc `--part 1..4` (server mới bật `GAME_TEST=1`, cổng trống, tự dọn; tối đa 2 lượt cùng lúc trên máy). Bot đầy đủ để job CI `bot-ram` chạy mỗi push. Đổi SQL / `db.ts` thì thêm `--pg`.
3. Đọc output: dòng ✗ là lỗi thật, ⚠ là phần bị bỏ qua; xem log server (`ci-logs/local-*-server.log`) không có lỗi. Đổi luật kênh thì chạy thêm `npm run bot:local -- --channels`.
4. Luồng / message mới: thêm kiểm tra vào `client/scripts/bot-test.mjs`; luồng khó dựng bằng bot thì thêm `op` cho hook `test` gọi đúng hàm luật chơi (chỉ chạy khi `GAME_TEST=1`), không viết luật riêng cho bot.
5. Đổi giao diện: `npm run dev:client`, mở `http://localhost:5173/choi/` (game; `/` là landing) thử bằng tay (chuột, phím, chạm).
6. Đổi SQL / `db.ts`: thử với PostgreSQL như skill `db-migration`.
7. Tắt đúng các tiến trình mình đã bật.

## 4. Cập nhật thiết kế và mở PR
- Sửa file thiết kế / kiến trúc tương ứng ở `docs/design/`, `docs/tech/` (mục lục ở `GAME_DESIGN.md`) để mô tả **luật hiện hành** sau thay đổi (cơ chế + tên hằng, không chép bảng số, không viết nhật ký "đã làm ở bước…"). Giữ nguyên số mục và mọi câu mà code đang trích dẫn (`grep -rn "mục [0-9]" server/src shared client/src tools`).
- `ROADMAP.md`: bước xong thì bỏ dòng `[ ]` và thêm mốc vào `docs/lich-su.md` (số issue gom cuối file); còn phần dở thì giữ dòng, ghi ngắn "Còn: …". Câu hỏi đã chốt thì bỏ khỏi mục 8 và ghi một dòng `Q` vào `docs/quyet-dinh.md`.
- Commit nhỏ, thông điệp tiếng Việt kiểu `Bước 9.6: …`; pre-commit hook typecheck lại. Một PR vào `main` cho mỗi bước, mô tả gồm tóm tắt, cách kiểm thử, quyết định khác thiết kế, phần để sau.
- Trước khi push: `git fetch` rồi merge `origin/main` (không rebase, không force push), chạy lại `npm run check`. PR đang review thì không push thêm trừ khi sửa theo lỗi review.
