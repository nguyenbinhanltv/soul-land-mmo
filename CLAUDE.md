# Hướng dẫn cho AI làm việc trong repo này

Đọc `GAME_DESIGN.md` trước khi sửa bất cứ thứ gì (mục 6 Kiến trúc là bắt buộc giữ).

## Quy tắc code
- Ngôn ngữ giao diện, chú thích, commit và PR: tiếng Việt. Dùng đúng tên gốc Đấu La.
- **Server-authoritative:** logic game chỉ nằm trong các phòng ở `server/src/rooms/`: `MapRoom.ts` (một loại phòng cho mọi bản đồ, nhận `mapId`; mỗi phòng là một kênh) và `ArenaRoom.ts` (trận Đại Đấu Hồn Trường, lớp con của `MapRoom`; hàng chờ ở `arenaQueue.ts`). Client (`client/src`) chỉ hiển thị và gửi ý định.
- **Số liệu cân bằng** chỉ ở `shared/data.ts` (server, client, bot cùng import); không chép số ra chỗ khác, kể cả `GAME_DESIGN.md` (tài liệu trỏ tới tên hằng).
- **Trường đồng bộ mới:** khai báo trong `server/src/rooms/schema.ts`, đọc ở `client/src/scenes/GameScene.ts`. Dữ liệu riêng của chính chủ gửi bằng tin riêng, không đưa vào state công khai. Hồn sư / hồn thú / đồ rơi chỉ đồng bộ khi ở gần (11.4, `interest.ts`): client không được giả định state có thực thể ở xa (cần cả bản đồ thì dùng tin riêng như `mini`); truy vấn hồn thú theo vị trí ở server dùng `beastsNear`.
- **Bảng / cột mới:** file `server/sql/00N_<tên>.sql` với N là số kế tiếp (xem `ls server/sql` trên `origin/main` mới nhất để không trùng số với nhánh khác), câu lệnh chạy lại an toàn (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) và bật RLS (không tạo policy). `PgStore.init()` (`server/src/db.ts`) chạy mọi file `.sql` theo tên mỗi lần khởi động. Luôn cập nhật cả `PgStore` lẫn `MemoryStore`. Không sửa file SQL cũ đã chạy.
- **Ghi DB về một người chơi** luôn qua chuỗi lưu `this.chain(d, fn)` (mục 6 "Lưu của mỗi người chơi chạy nối tiếp").
- **Ảnh / sprite:** quy tắc ở `GAME_DESIGN.md` mục 5.11, quy cách chi tiết ở `tools/assets/README.md`, thao tác ở skill `asset-gen`. Không ghi key PixelLab hay bí mật nào vào repo, log, PR.
- Làm từng việc nhỏ một. Luật chơi đổi thì sửa đúng mục trong `GAME_DESIGN.md` (mô tả luật hiện hành, không viết nhật ký tiến độ); xong bước Lộ trình thì đánh dấu ở mục 7.

## Lệnh
```bash
npm run install:all            # cài thư viện server + client (clone mới)
npm run hooks                  # bật git pre-commit hook (.githooks/, typecheck file đã stage) – một lần
npm run check                  # typecheck server + client, validate sprite, kiểm tiles.json – bắt buộc sau mỗi thay đổi
npm run build                  # build client (tsc + vite)
npm run dev:server             # server http://localhost:2567 (không có DATABASE_URL thì lưu RAM)
npm run dev:client             # client http://localhost:5173
npm run bot --prefix client    # bot kiểm thử, chạy khi server đang bật (SERVER_URL=… nếu khác cổng)
```
- **Bot cần server bật `GAME_TEST=1`** (hook `test`; thiếu thì bot báo bỏ qua phần lớn kiểm tra). Chạy trên **server mới bật** (state sạch), từng lượt một: `GAME_TEST=1 PORT=2600 npm run dev:server` rồi `SERVER_URL=http://localhost:2600 npm run bot --prefix client`. Với `GAME_TEST=1`, lịch boss đứng yên ở 12:00 giờ Việt Nam trừ khi đặt `BOSS_CLOCK=HH:MM` hoặc `real`. Phần nhiều kênh chạy riêng với server `CHANNEL_MAX=2 GAME_TEST=1`.
- Bot không assert mọi thứ: đọc output (dòng ✗ là lỗi, ⚠ là bị bỏ qua) và log server. Luồng mới thì thêm vào `client/scripts/bot-test.mjs`.
- Kiểm thử khác: `npm run test:predict --prefix client` (dự đoán chuyển động), `npm run test:audio --prefix client` (SFX, nhạc nền), `npm run test:ratelimit --prefix server`, `npm run test:accounts --prefix server`.
- **Đổi SQL / `db.ts` thì thử thêm với PostgreSQL**, sau lượt bot ở chế độ RAM: có Docker thì `docker compose up -d` và `cp .env.example server/.env`. Không có Docker thì dùng gói `embedded-postgres` cài trong thư mục tạm **ngoài repo**, cổng riêng, tạo DB `CREATE DATABASE … ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'` (cluster mặc định trên Windows không phải UTF8), rồi `DATABASE_URL=postgres://…@localhost:<cổng>/<db> PGSSL=false GAME_TEST=1 npm run dev:server`. Chạy server **hai lần liên tiếp** (migration phải chạy lại an toàn) rồi chạy bot.
- Chạy song song nhiều phiên: dùng cổng server / PostgreSQL riêng và chỉ tắt đúng tiến trình mình bật.

## Quy trình nhận việc (nhiều người)
Repo có nhiều người và agent cùng làm; mọi việc đi qua issue GitHub, chi tiết ở `CONTRIBUTING.md`.
- Chỉ nhận issue có `san-sang`, chưa giao, không có `dang-lam` / `chan`; kiểm lại ngay trước khi làm, đã có người nhận thì không làm.
- Nhận: tự gán + `dang-lam` + `agent:<tên>`, mở PR nháp ngay với `Closes #N` và cùng nhãn `agent:<tên>` (nhãn trên cả issue lẫn PR); cần file SQL mới thì ghi số vào issue. Bỏ dở thì trả nhãn (cả issue lẫn PR) và bỏ giao.
- Bảng Project 3 khớp nhãn issue (`dang-lam` → Đang làm + Chủ, `cho-review` → Đang review, bỏ dở → Sẵn sàng + Chưa giao); thiếu quyền thì ghi vào comment `Tiến độ`.
- Comment `Review: đạt` có dòng ``**Head đã review:** `<SHA 40 ký tự>` ``; sửa code sau đó thì cập nhật SHA.
- Dòng chưa làm ở `GAME_DESIGN.md` mục 7 trỏ tới số issue.

## Nhánh và PR
- Mỗi việc một nhánh mới từ `origin/main`, một PR vào `main`. Không commit thẳng lên `main`, **không force push**; cập nhật nhánh bằng merge `origin/main` (không rebase nhánh đã push).
- Commit nhỏ, thông điệp tiếng Việt (ví dụ `Bước 9.6: …`). Pre-commit hook typecheck lại; không bỏ qua bằng `--no-verify`.
- Mô tả PR: tóm tắt, cách kiểm thử (check, bot, PostgreSQL nếu có), rủi ro / phần để sau.
- **Đóng băng khi đang review:** PR đã gửi review thì không push thêm (kể cả merge `main`, sửa nhỏ) trừ khi sửa theo lỗi review hoặc được yêu cầu, vì mỗi commit làm review chạy lại.

## Skill và plugin của dự án
Cấu hình chung trong `.claude/settings.json` (commit vào git; `.claude/settings.local.json` là file riêng từng máy, không sửa).
Hook PostToolUse tự chạy `node tools/check.mjs --hook` sau mỗi lần Edit/Write: báo lỗi TypeScript thì sửa ngay.
Skill trong `.claude/skills/`:
- `roadmap-step`: làm trọn một bước Lộ trình (đọc thiết kế → code → check → bot → cập nhật thiết kế).
- `server-feature`: luật chơi, message từ client, đồng bộ schema, dữ liệu riêng của chính chủ, lưu DB.
- `client-ui`: hiển thị state, HUD thủy mặc, phím / chuột, điều khiển chạm, isometric phía client.
- `db-migration`: file SQL mới và lớp lưu trữ `db.ts`.
- `balance-data`: mọi con số cân bằng trong `shared/data.ts`.
- `asset-gen`: làm ảnh (PixelLab, Gemini, LPC, vẽ tay) và dây chuyền `tools/assets`.
