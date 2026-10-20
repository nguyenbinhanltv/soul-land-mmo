# Hướng dẫn cho AI làm việc trong repo này

Đọc `GAME_DESIGN.md` trước khi sửa bất cứ thứ gì (mục 6 Kiến trúc là bắt buộc giữ).

## Quy tắc code
- Ngôn ngữ giao diện, chú thích, commit và PR: tiếng Việt. Dùng đúng tên gốc Đấu La.
- **Server-authoritative:** logic game chỉ nằm trong các phòng ở `server/src/rooms/`: `MapRoom.ts` (một loại phòng cho mọi bản đồ, nhận `mapId`; mỗi phòng là một kênh) và `ArenaRoom.ts` (trận Đại Đấu Hồn Trường, lớp con của `MapRoom`; hàng chờ ở `arenaQueue.ts`). Client (`client/src`) chỉ hiển thị và gửi ý định.
- **Số liệu cân bằng** chỉ ở `shared/data.ts` (server, client, bot cùng import); không chép số ra chỗ khác, kể cả `GAME_DESIGN.md` (tài liệu trỏ tới tên hằng).
- **Trường đồng bộ mới:** khai báo trong `server/src/rooms/schema.ts`, đọc ở `client/src/scenes/GameScene.ts`. Dữ liệu riêng của chính chủ gửi bằng tin riêng, không đưa vào state công khai.
- **Bảng / cột mới:** tạo file `server/sql/00N_<tên>.sql` với N là số kế tiếp (xem `ls server/sql` trên `origin/main` mới nhất để không trùng số với nhánh khác), câu lệnh chạy lại an toàn (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) và bật RLS (không tạo policy). `PgStore.init()` trong `server/src/db.ts` tự chạy mọi file `.sql` theo tên mỗi lần khởi động. Luôn cập nhật cả `PgStore` lẫn `MemoryStore`. Không sửa file SQL cũ đã chạy.
- **Ghi DB về một người chơi** luôn qua chuỗi lưu `this.chain(d, fn)` (mục 6 "Lưu của mỗi người chơi chạy nối tiếp").
- Làm từng việc nhỏ một; luật chơi đổi thì sửa đúng mục trong `GAME_DESIGN.md` (không viết nhật ký tiến độ), xong bước Lộ trình thì đánh dấu ở mục 7.

## Lệnh
```bash
npm run install:all            # cài thư viện server + client (clone mới)
npm run hooks                  # bật git pre-commit hook (.githooks/, typecheck file đã stage) – một lần
npm run check                  # typecheck server + client và validate sprite – bắt buộc sau mỗi thay đổi
npm run build                  # build client (tsc + vite)
npm run dev:server             # server http://localhost:2567 (không có DATABASE_URL thì lưu RAM)
npm run dev:client             # client http://localhost:5173
npm run bot --prefix client    # bot kiểm thử, chạy khi server đang bật (SERVER_URL=… nếu khác cổng)
```
- **Bot cần server bật `GAME_TEST=1`** để dùng hook `test` (thiếu thì bot báo bỏ qua phần lớn kiểm tra). Với `GAME_TEST=1`, lịch boss đứng yên ở 12:00 giờ Việt Nam trừ khi đặt `BOSS_CLOCK=HH:MM` hoặc `real`. Phần nhiều kênh chạy riêng với server `CHANNEL_MAX=2 GAME_TEST=1`.
  Ví dụ (Git Bash): `GAME_TEST=1 PORT=2600 npm run dev:server` rồi `SERVER_URL=http://localhost:2600 npm run bot --prefix client`.
- Bot không có assert cho mọi thứ: đọc output (dòng ✗ / ⚠, lỗi ở log server). Thêm luồng mới thì thêm vào `client/scripts/bot-test.mjs`.
- Kiểm thử khác: `npm run test:predict --prefix client` (dự đoán chuyển động), `npm run test:ratelimit --prefix server`, `npm run test:accounts --prefix server`.
- **Thử với PostgreSQL** khi đổi SQL / `db.ts`: có Docker thì `docker compose up -d` và `cp .env.example server/.env`. Không có Docker thì dùng gói `embedded-postgres` cài trong thư mục tạm **ngoài repo**, chạy ở cổng riêng, tạo DB bằng `CREATE DATABASE … ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'` (cluster mặc định trên Windows không phải UTF8), rồi `DATABASE_URL=postgres://…@localhost:<cổng>/<db> PGSSL=false npm run dev:server`. Chạy server **hai lần liên tiếp** (migration phải chạy lại an toàn) rồi chạy bot.
- Chạy song song nhiều phiên: dùng cổng server / PostgreSQL riêng và chỉ tắt đúng tiến trình mình bật.

## Nhánh và PR
- Mỗi việc một nhánh mới từ `origin/main`, một PR vào `main`. Không commit thẳng lên `main`, không force push.
- Commit nhỏ, thông điệp tiếng Việt (ví dụ `Bước 9.6: …`). Pre-commit hook typecheck lại; không bỏ qua bằng `--no-verify`.
- Mô tả PR: tóm tắt, cách kiểm thử (check, bot, PostgreSQL nếu có), rủi ro / phần để sau. Đang có review thì chỉ push khi sửa theo review.

## Skill và plugin của dự án
Cấu hình chung trong `.claude/settings.json` (commit vào git; `.claude/settings.local.json` là file riêng từng máy, không sửa).
Hook PostToolUse tự chạy `node tools/check.mjs --hook` sau mỗi lần Edit/Write: báo lỗi TypeScript thì sửa ngay.
Skill trong `.claude/skills/`:
- `roadmap-step`: làm trọn một bước Lộ trình (đọc thiết kế → code → check → bot → cập nhật thiết kế).
- `server-feature`: luật chơi, message từ client, đồng bộ schema, dữ liệu riêng của chính chủ, lưu DB.
- `client-ui`: hiển thị state, HUD, phím / chuột, điều khiển chạm.
- `db-migration`: file SQL mới và lớp lưu trữ `db.ts`.
- `balance-data`: mọi con số cân bằng trong `shared/data.ts`.
- `asset-gen`: sprite và dây chuyền `tools/assets` (quy cách `GAME_DESIGN.md` mục 5.11).
