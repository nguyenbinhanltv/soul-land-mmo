# Hướng dẫn cho AI làm việc trong repo này

Đọc `GAME_DESIGN.md` trước khi sửa bất cứ thứ gì.

- Ngôn ngữ giao diện và chú thích: tiếng Việt.
- Server-authoritative: logic game chỉ nằm trong `server/src/rooms/ForestRoom.ts`. Client (`client/src`) chỉ hiển thị và gửi input.
- Số liệu cân bằng dùng chung ở `shared/data.ts`; không chép số ra chỗ khác.
- Thêm trường đồng bộ: khai báo trong `server/src/rooms/schema.ts`, rồi đọc ở `client/src/scenes/GameScene.ts`.
- Thêm bảng dữ liệu: viết `CREATE TABLE IF NOT EXISTS` trong `server/sql/001_init.sql` (hoặc file 002_… mới và nạp trong `db.ts`).
- Sau mỗi thay đổi: `npm run check` (typecheck cả server lẫn client), rồi chạy `npm run bot --prefix client` khi server đang bật.
  Git pre-commit hook (`.githooks/`) tự chạy typecheck; clone mới cần `npm run hooks` một lần.
- Làm từng tính năng nhỏ một, cập nhật mục Lộ trình trong `GAME_DESIGN.md` khi xong.
