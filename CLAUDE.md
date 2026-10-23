# Hướng dẫn cho AI làm việc trong repo này

Đọc `GAME_DESIGN.md` trước khi sửa bất cứ thứ gì (mục 6 Kiến trúc là bắt buộc giữ).

## Quy tắc code
- Ngôn ngữ giao diện, chú thích, commit và PR: tiếng Việt. Dùng đúng tên gốc Đấu La.
- **Server-authoritative:** logic game chỉ nằm trong các phòng ở `server/src/rooms/`: `MapRoom.ts` (một loại phòng cho mọi bản đồ, nhận `mapId`; mỗi phòng là một kênh) và `ArenaRoom.ts` (trận Đại Đấu Hồn Trường, lớp con của `MapRoom`; hàng chờ ở `arenaQueue.ts`). Client (`client/src`) chỉ hiển thị và gửi ý định.
- **Số liệu cân bằng** chỉ ở `shared/data.ts` (server, client, bot cùng import); không chép số ra chỗ khác, kể cả `GAME_DESIGN.md` (tài liệu trỏ tới tên hằng).
- **Trường đồng bộ mới:** khai báo trong `server/src/rooms/schema.ts`, đọc ở `client/src/scenes/GameScene.ts`. Dữ liệu riêng của chính chủ gửi bằng tin riêng, không đưa vào state công khai. Hồn sư / hồn thú / đồ rơi chỉ đồng bộ khi ở gần (11.4, `interest.ts`): client không được giả định state có thực thể ở xa (cần cả bản đồ thì dùng tin riêng như `mini`); truy vấn hồn thú theo vị trí ở server dùng `beastsNear`.
- **Bảng / cột mới:** file `server/sql/00N_<tên>.sql` với N là số kế tiếp (xem `ls server/sql` trên `origin/main` mới nhất để không trùng số với nhánh khác), câu lệnh chạy lại an toàn (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) và bật RLS (không tạo policy). `PgStore.init()` (`server/src/db.ts`) chạy mọi file `.sql` theo tên mỗi lần khởi động. Luôn cập nhật cả `PgStore` lẫn `MemoryStore`. Không sửa file SQL cũ đã chạy.
- **Ghi DB về một người chơi** luôn qua chuỗi lưu `this.chain(d, fn)` (mục 6 "Lưu của mỗi người chơi chạy nối tiếp").
- **Ảnh / sprite:** quy tắc ở `GAME_DESIGN.md` mục 5.11, quy cách chi tiết ở `tools/assets/README.md`, thao tác ở skill `asset-gen`. Mọi ảnh mới làm bằng ComfyUI (PixelLab đã bỏ từ 2026-10-23, không gọi, không làm ảnh mới). Không ghi key hay bí mật nào vào repo, log, PR.
- Làm từng việc nhỏ một. Luật chơi đổi thì sửa đúng mục trong `GAME_DESIGN.md` (mô tả luật hiện hành, không viết nhật ký tiến độ); xong bước Lộ trình thì đánh dấu ở mục 7.

## Lệnh
```bash
npm run install:all            # cài thư viện server + client (clone mới)
npm run hooks                  # bật git pre-commit hook (.githooks/, typecheck file đã stage) – một lần
npm run check                  # typecheck server + client, validate sprite, kiểm tiles.json – bắt buộc sau mỗi thay đổi
npm run build                  # build client (tsc + vite)
npm run dev:server             # server http://localhost:2567 (không có DATABASE_URL thì lưu RAM)
npm run dev:client             # client http://localhost:5173
npm run bot:local -- --only <nhóm> [--pg]   # bot ở máy: tự bật server GAME_TEST=1 cổng trống, chạy một nhóm, tự dọn
npm run bot --prefix client    # bot thô, chạy khi server đang bật (SERVER_URL=… nếu khác cổng); agent dùng bot:local
```
- **Agent chạy bot ở máy bằng `npm run bot:local`** (`tools/bot-local.mjs`, #228), **không** tự bật server rời hay embedded-postgres riêng: công cụ build server một lần (esbuild, cache theo hash nguồn) rồi chạy `node` với trần heap 768 MB, `GAME_TEST=1`, cổng trống, state sạch; chạy đúng một nhóm (`--only <nhóm>` BOT_ONLY, `--part 1..4` BOT_PART, `--channels` lượt nhiều kênh `CHANNEL_MAX=2`, `--fatal [--pg]` lỗi nghiêm trọng ngoài phòng làm server lưu rồi thoát (#270, đổi `index.ts` / cách tắt server thì chạy); `--help` liệt kê nhóm); chỉ tắt tiến trình con của mình (kể cả Ctrl+C / lỗi) và in RAM đỉnh. **Tối đa 2 lượt bot cùng lúc trên cả máy** (khoá ở `%TEMP%/soul-bot-slots`), lượt thứ 3 tự chờ. Bot đầy đủ (`--full`, ~25 phút) để job CI `bot-ram` chạy. Với `GAME_TEST=1`, lịch boss đứng yên ở 12:00 giờ Việt Nam trừ khi đặt `--env BOSS_CLOCK=HH:MM` (hoặc `real`).
- Đổi presence / trạng thái dùng chung nhiều tiến trình (#120): thêm `--procs 2 --pg --env REDIS_URL=redis://127.0.0.1:<cổng riêng>` (Redis cục bộ do mình bật, chỉ tắt đúng PID mình bật; `REDIS_URL` của shell bị bỏ); `npm run test:presence-kill --prefix server` thử kill PID / TTL với Redis thật.
- Bot cần server bật `GAME_TEST=1` (hook `test`; thiếu thì bot báo bỏ qua phần lớn kiểm tra) và **server mới bật**. Người chạy tay (gỡ lỗi kèm trình duyệt): `GAME_TEST=1 PORT=2600 npm run dev:server` rồi `SERVER_URL=http://localhost:2600 npm run bot --prefix client`.
- CI (`.github/workflows/check.yml`, chỉ tham khảo) có job `bot-ram`: bài nhanh + bot RAM + lượt nhiều kênh trên mỗi push vào PR. Review đọc kết quả CI (`gh pr checks`, `gh run view <id>` in số ✓ / ✗ / ⚠ từng nhóm và các dòng ✗) thay vì tự chạy bot RAM; lượt PostgreSQL vẫn tự chạy.
- Bot không assert mọi thứ: đọc output (dòng ✗ là lỗi, ⚠ là bị bỏ qua) và log server. Luồng mới thì thêm vào `client/scripts/bot-test.mjs`.
- Kiểm thử khác: `npm run test:predict --prefix client` (dự đoán chuyển động), `npm run test:audio --prefix client` (SFX, nhạc nền), `npm run test:radar --prefix server` (hàm thuần radar), `npm run test:ratelimit --prefix server`, `npm run test:accounts --prefix server`.
- **Đổi SQL / `db.ts` thì thử thêm với PostgreSQL**, sau lượt bot ở chế độ RAM: `npm run bot:local -- --only <nhóm> --pg`. Công cụ dùng **một PostgreSQL chung cho cả máy** (binary `embedded-postgres` trong `node_modules`, cổng `BOT_PG_PORT` 5433, dữ liệu `BOT_PG_DIR` mặc định `D:/soul-pg-shared`; chưa chạy thì tự bật, đang chạy thì dùng lại), mỗi lượt một database riêng UTF8 (`soulbot_<phiên>_<pid>`, có dấu `COMMENT ON DATABASE`; công cụ chỉ dọn database có dấu đó), bật server **hai lần liên tiếp** (migration phải chạy lại an toàn) rồi chạy bot, xoá database khi xong. Có PostgreSQL cài sẵn thì đặt `BOT_PG_URL`. Xem / tắt instance chung: `npm run bot:local -- --pg-status` / `--pg-stop`. Người chạy server dev với PostgreSQL: `docker compose up -d` và `cp .env.example server/.env`.
- Chạy song song nhiều phiên: `bot:local` tự chọn cổng và giới hạn số lượt; tự bật tiến trình khác (server dev, Chrome) thì dùng cổng riêng và chỉ tắt đúng PID mình bật, không tắt theo cổng hay theo tên.

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
- `asset-gen`: làm ảnh (ComfyUI là chính; Gemini, LPC, vẽ tay cho phần còn lại) và dây chuyền `tools/assets`.
- `balance-review`: soát cân bằng, kinh tế Hồn Tệ, tỉ lệ rơi, Elo (phân tích; đặt số vẫn theo `balance-data`).
- `anti-cheat-audit`: soát server-authoritative theo cách gian lận (message, API, nhân bản đồ, hook test).
- `soak-perf`: chạy dài nhiều bot trên bản đồ ×8, đo tick / bản vá / băng thông / bộ nhớ, tìm rò.
- `bot-flakiness`: xử lý bài bot chập chờn (tái hiện N lượt, đối chứng main, chờ theo state).
- `playtest-triage`: phân loại phản hồi chơi thử thành issue đúng mẫu, nhãn, Project 3.
- Năm skill trên phỏng theo [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (MIT), viết lại cho repo này.
