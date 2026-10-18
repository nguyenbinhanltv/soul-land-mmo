# Hướng dẫn cho AI làm việc trong repo này

Đọc `GAME_DESIGN.md` trước khi sửa bất cứ thứ gì.

- Ngôn ngữ giao diện và chú thích: tiếng Việt.
- Server-authoritative: logic game chỉ nằm trong `server/src/rooms/MapRoom.ts` (một loại phòng cho mọi bản đồ, nhận `mapId`). Client (`client/src`) chỉ hiển thị và gửi input.
- Số liệu cân bằng dùng chung ở `shared/data.ts`; không chép số ra chỗ khác.
- Thêm trường đồng bộ: khai báo trong `server/src/rooms/schema.ts`, rồi đọc ở `client/src/scenes/GameScene.ts`.
- Thêm bảng dữ liệu: tạo file `server/sql/00N_….sql` mới với `CREATE TABLE IF NOT EXISTS` và bật RLS; `PgStore.init()` trong `db.ts` tự nạp mọi file `.sql` theo tên. Cập nhật cả `PgStore` lẫn `MemoryStore`.
- Sau mỗi thay đổi: `npm run check` (typecheck cả server lẫn client), rồi chạy `npm run bot --prefix client` khi server đang bật.
  Git pre-commit hook (`.githooks/`) tự chạy typecheck; clone mới cần `npm run hooks` một lần.
- Làm từng tính năng nhỏ một, cập nhật mục Lộ trình trong `GAME_DESIGN.md` khi xong.

## Skill và plugin của dự án
Cấu hình chung trong `.claude/settings.json` (commit vào git; `.claude/settings.local.json` là file riêng từng máy, không sửa).
Hook PostToolUse tự chạy `node tools/check.mjs --hook` sau mỗi lần Edit/Write: báo lỗi TypeScript thì sửa ngay.
Dùng skill trong `.claude/skills/` đúng lúc:
- `roadmap-step`: làm trọn một bước Lộ trình (đọc thiết kế → code → check → bot → đánh dấu xong).
- `server-feature`: luật chơi, message từ client, đồng bộ schema, dữ liệu riêng của chính chủ.
- `client-ui`: hiển thị state, HUD, phím/chuột, điều khiển chạm.
- `db-migration`: file SQL mới và lớp lưu trữ `db.ts`.
- `balance-data`: mọi con số cân bằng trong `shared/data.ts`.
