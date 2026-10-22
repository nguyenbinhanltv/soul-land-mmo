# Rừng Săn Hồn Online

> **Người mới vào chơi:** đọc [Hướng dẫn chơi](docs/huong-dan-choi.md) (điều khiển, đội hình, hồn hoàn, bản đồ, boss, đấu trường).

MMO săn hồn thế giới mở chơi trên trình duyệt, lấy bối cảnh **Đấu La Đại Lục**: sưu tầm võ hồn, lập đội 4 võ hồn,
săn hồn thú lấy hồn hoàn, hồn cốt, hồn hạch, đánh boss cùng bạn bè và đấu xếp hạng ở Đại Đấu Hồn Trường.
Đồ họa pixel art **isometric** kiểu Ultima Online (ô thoi 2:1, nhân vật 8 hướng), giao diện thủy mặc.
Dự án phi thương mại, chơi cùng bạn bè. Luật chơi và kiến trúc: [`GAME_DESIGN.md`](GAME_DESIGN.md).

Công nghệ: Phaser 3 + Tiled (client), Node.js + Colyseus (server), PostgreSQL hoặc Supabase (dữ liệu), TypeScript ở cả hai phía.

## Cài đặt và chạy trên máy

Cần Node.js 22 trở lên.

```bash
npm run install:all       # cài thư viện cho server và client
npm run dev:server        # terminal 1 – server ở http://localhost:2567
npm run dev:client        # terminal 2 – game ở http://localhost:5173
```

Mở `http://localhost:5173`, nhập tên và mật khẩu bất kỳ (tên mới tự tạo tài khoản), tạo nhân vật rồi qua lễ thức tỉnh.
Mở thêm một tab ẩn danh với tên khác để thấy hai người chơi cùng lúc. Điện thoại cùng Wi-Fi: mở `http://<IP-máy-tính>:5173`.

Điều khiển chính: WASD / mũi tên đi, J / Space đánh, U / I / O / P hồn kỹ, 1–4 đổi võ hồn, V đội hình, B túi đồ, E nhặt, F đi cổng / nói chuyện, Enter chat.
Bảng phím đầy đủ ở `GAME_DESIGN.md` mục 4. Điện thoại có joystick ảo và nút chạm.

### Lưu dữ liệu

Không cấu hình database thì dữ liệu chỉ lưu trong RAM, tắt server là mất. Biến môi trường mẫu ở [`.env.example`](.env.example) (chép thành `server/.env`).

**PostgreSQL bằng Docker**

```bash
docker compose up -d
cp .env.example server/.env      # đã có sẵn DATABASE_URL cho Postgres local
npm run dev:server
```

**Nhiều tiến trình với RedisPresence**

Chỉ bật khi chạy hai tiến trình cùng lúc. Dùng cùng `REDIS_URL` cho các tiến trình trong cùng một cụm; mỗi cụm / môi trường phải dùng Redis riêng, không dùng chung Redis của dịch vụ khác.

```bash
# terminal 1
PORT=2567 REDIS_URL=redis://127.0.0.1:6379 npm run dev:server
# terminal 2
PORT=2568 REDIS_URL=redis://127.0.0.1:6379 npm run dev:server
```

Mỗi tiến trình cần `PUBLIC_ADDRESS` là địa chỉ client mở WebSocket tới đúng tiến trình đó (ví dụ `PUBLIC_ADDRESS=localhost:2567` và `PUBLIC_ADDRESS=localhost:2568`, hoặc đường dẫn riêng sau proxy). Không đặt thì client chỉ vào được phòng nằm ở tiến trình đã nhận yêu cầu HTTP. Sân đấu luôn mở ở tiến trình ghép trận.

`RedisPresence` dùng pub/sub và RedisDriver để chia sẻ phòng, số kênh, khóa đổi kênh, phiên tài khoản, thú vương, khóa tinh anh, hàng chờ đấu trường và tổ đội. Lease có TTL 15 giây, heartbeat 5 giây; tiến trình chết không giữ tài khoản hoặc suất vô hạn. `REDIS_PREFIX` chỉ áp cho khóa ioredis của game; kênh pub/sub của `RedisPresence` và registry phòng của `RedisDriver` không có prefix, nên mỗi cụm vẫn cần Redis riêng. Khi không đặt `REDIS_URL`, server tự dùng LocalPresence và RAM như cũ, không cần chạy dịch vụ ngoài. Khi đã bật Redis mà Redis lỗi, server đóng phiên liên quan để tránh hai tiến trình cùng ghi dữ liệu.

**Supabase**

1. Tạo project trên [supabase.com](https://supabase.com), ghi nhớ mật khẩu database, chọn region gần người chơi.
2. Dashboard → **Connect** → **Connection String** → Type `URI` → Method **Session pooler**, sao chép chuỗi.
   Đừng dùng "Direct connection" (chỉ chạy qua IPv6) hay "Transaction pooler" (server giữ kết nối lâu dài).
3. Ghi vào `server/.env`: `DATABASE_URL=postgresql://postgres.<ref>:<mật-khẩu>@aws-0-<region>.pooler.supabase.com:5432/postgres`.
   Mật khẩu có ký tự đặc biệt thì mã hóa URL (`@` → `%40`, `#` → `%23`, `/` → `%2F`). SSL tự bật khi URL chứa "supabase" (hoặc đặt `PGSSL=true`).
4. Chạy lại `npm run dev:server`, thấy `✓ Đã kết nối PostgreSQL và cập nhật bảng.` là xong.

Server tự tạo / cập nhật bảng mỗi lần khởi động (chạy mọi file `server/sql/*.sql` theo tên) và bật Row Level Security cho mọi bảng,
nên Data API công khai của Supabase không đọc được dữ liệu; server kết nối bằng user `postgres` nên vẫn đọc ghi bình thường.
Gói miễn phí của Supabase tạm dừng project sau khoảng 1 tuần không truy cập; vào dashboard bấm Restore để chạy lại.

## Kiểm thử

```bash
npm run check                         # typecheck server + client, kiểm tra sprite (bắt buộc trước khi commit)
GAME_TEST=1 npm run dev:server        # server bật hook kiểm thử (Git Bash / Linux / macOS)
npm run bot --prefix client           # terminal khác: bot tự chơi và kiểm tra hầu hết luật chơi
npm run bot:local -- --only bag       # hoặc: một lượt bot trọn gói (tự bật server, chạy một nhóm, tự dọn), xem dưới
npm run test:predict --prefix client  # dự đoán chuyển động, không cần server
npm run test:ratelimit --prefix server
npm run test:accounts --prefix server
```

- Bot cần server bật `GAME_TEST=1`; thiếu thì nhiều phần bị bỏ qua (có dòng ⚠). Server ở cổng khác thì đặt `SERVER_URL=http://localhost:<cổng>` cho bot.
- Phần nhiều kênh chạy riêng: server `CHANNEL_MAX=2 GAME_TEST=1 npm run dev:server`, rồi chạy bot lần nữa.
- Với `GAME_TEST=1`, lịch boss đứng yên ở 12:00 giờ Việt Nam; `BOSS_CLOCK=HH:MM` chạy từ giờ đó, `BOSS_CLOCK=real` dùng giờ thật.
- CI (`.github/workflows/check.yml`, chỉ để tham khảo) chạy `check-build` và `bot-ram` (các bài trên cùng bot RAM chia 3 nhóm song song theo `BOT_PART`, nhiều kênh) trên mọi PR vào `main`; xem `CONTRIBUTING.md` mục Merge.
- Bật git pre-commit hook một lần sau khi clone: `npm run hooks` (typecheck các file đã stage).
- Bot chạy trên server mới bật (state sạch). Đổi SQL / `server/src/db.ts` thì chạy thêm bot với PostgreSQL, server bật hai lần liên tiếp để chắc migration chạy lại an toàn.

**Bot ở máy: `npm run bot:local`** (`tools/bot-local.mjs`, cách agent chạy bot ở máy)

```bash
npm run bot:local -- --help                 # danh sách nhóm và tham số
npm run bot:local -- --only bag             # một nhóm BOT_ONLY, chế độ RAM
npm run bot:local -- --part 2               # một nhóm BOT_PART như CI
npm run bot:local -- --channels             # lượt nhiều kênh (CHANNEL_MAX=2)
npm run bot:local -- --fatal --pg           # lỗi nghiêm trọng ngoài phòng (#270): server lưu, đóng DB, thoát mã ≠ 0; bật lại kiểm dữ liệu
npm run bot:local -- --only bag --pg        # lưu PostgreSQL: database riêng, server bật hai lần, xoá database khi xong
```

- Server build một lần bằng esbuild (`server/dist/bot-<hash>.mjs`, build lại khi nguồn đổi) rồi chạy `node` (không qua npm / tsx), trần heap 768 MB (`--heap`), cổng trống, `GAME_TEST=1`; không đọc `server/.env`. Biến thêm cho server: `--env BOSS_CLOCK=20:00`.
- Tối đa 2 lượt cùng lúc trên cả máy (`BOT_LOCAL_MAX`), lượt thừa chờ. Chỉ tắt tiến trình con của chính nó; bị tắt cứng thì server / bot tự thoát, lượt sau gỡ khoá và database còn sót. Cuối lượt in số ✓ / ✗ / ⚠, thời gian, RAM đỉnh; log ở `ci-logs/local-*`.
- `--pg` dùng **một PostgreSQL chung cho cả máy**: binary `embedded-postgres` trong `node_modules` (devDependency ở thư mục gốc, không cần cài thêm hay quyền admin), cổng `BOT_PG_PORT` (mặc định 5433), dữ liệu `BOT_PG_DIR` (mặc định `D:/soul-pg-shared` nếu có ổ D, không thì thư mục tạm). Lần đầu tự `initdb` (UTF8), sau đó dùng lại; instance chạy tiếp sau khi lượt bot xong. Có PostgreSQL cài sẵn thì trỏ vào bằng `BOT_PG_URL=postgres://user:pass@localhost:5432/postgres`.
- **Tắt PostgreSQL chung:** `npm run bot:local -- --pg-stop` (từ chối khi còn lượt bot đang chạy; `--force` để tắt luôn). Xem trạng thái: `--pg-status`. Xoá hẳn: tắt rồi xoá thư mục `BOT_PG_DIR`.

## Cấu trúc thư mục

```
├─ shared/
│  ├─ data.ts              # mọi số liệu cân bằng và bảng dữ liệu dùng chung (bản đồ, võ hồn, hồn kỹ, hồn thú, vật phẩm…)
│  ├─ move.ts              # va chạm ô và bước đi dùng chung cho server và dự đoán chuyển động
│  └─ assets/              # publicDir của Vite: bản đồ Tiled <mapId>.json, tiles.png
│     ├─ sprites/          # ảnh sprite / giao diện, manifest.json (key đã có ảnh thật)
│     └─ iso/              # tiles.json (gid Tiled → ô thoi / vật đứng) và ô nền isometric ground/
├─ server/
│  ├─ src/index.ts         # Express API (đăng nhập, tạo nhân vật, thức tỉnh, chọn kênh) + Colyseus, phục vụ bản build client
│  ├─ src/rooms/MapRoom.ts # toàn bộ luật chơi: một phòng mỗi bản đồ / kênh, chạy TICK_RATE lần mỗi giây
│  ├─ src/rooms/ArenaRoom.ts, arenaQueue.ts  # trận Đại Đấu Hồn Trường và hàng chờ ghép trận
│  ├─ src/rooms/schema.ts  # trạng thái đồng bộ xuống client (Colyseus Schema)
│  ├─ src/map.ts           # loadMap(mapId): đọc ô chặn, vùng, cổng, NPC, tinh anh, boss từ file Tiled
│  ├─ src/db.ts            # lưu trữ: PgStore (PostgreSQL) và MemoryStore (RAM)
│  ├─ src/party.ts, schedule.ts, ratelimit.ts, names.ts  # tổ đội, lịch boss, chống spam, chuẩn hóa tên
│  └─ sql/                 # 001_init.sql … : migration chạy lại an toàn, đánh số tăng dần
├─ client/
│  ├─ src/main.ts          # đăng nhập, tạo nhân vật, thức tỉnh, vào phòng / đổi bản đồ / vào sân đấu
│  ├─ src/scenes/GameScene.ts  # vẽ hồn sư, hồn thú, hiệu ứng; nhận state và message
│  ├─ src/iso.ts, isoMap.ts, isoBuild.ts  # phép chiếu isometric, vẽ bản đồ thành ô thoi, nhà / tường thành dựng bằng code
│  ├─ src/hud.ts           # giao diện HTML (chỉ số, hồn kỹ, đội hình, túi đồ, NPC, tổ đội, đấu trường…)
│  ├─ src/uiArt.ts, cards.ts, fonts/  # ảnh giao diện thủy mặc, thẻ võ hồn, font Ark Pixel
│  ├─ src/crowd.ts         # dân thường, lính gác trang trí (chỉ phía client)
│  ├─ src/predict.ts, net.ts   # dự đoán chuyển động, kiểu message
│  ├─ src/sprites.ts, textures.ts, honsuArt.ts  # nạp sprite theo manifest, vẽ bằng code phần chưa có ảnh
│  └─ scripts/             # bot-test.mjs, predict-test.mjs
├─ tools/
│  ├─ check.mjs            # typecheck theo phần bị ảnh hưởng (npm run check, pre-commit, hook Claude Code)
│  ├─ gen-map.mjs          # sinh các bản đồ Tiled (npm run map – GHI ĐÈ bản đã sửa tay)
│  ├─ gen-tiles.py         # sinh tileset
│  └─ assets/              # dây chuyền ảnh (README.md: quy cách chi tiết): normalize, pack, normal, preview, validate, iso-build,
│                          #   gemini-import (nhập ảnh Gemini), lpc-compose (NPC phụ LPC), he-icons
├─ art/                    # file nguồn không tải trong game: palette.gpl, palettes/ (bảng nhấn từng vùng),
│                          #   src/ (ảnh thô ComfyUI / Gemini / PixelLab cũ, công thức LPC), CREDITS.md
├─ GAME_DESIGN.md          # thiết kế luật chơi, mỹ thuật, kiến trúc, lộ trình (cho người và AI đọc)
├─ CLAUDE.md               # quy tắc cho AI agent khi sửa code
├─ .claude/                # cấu hình Claude Code dùng chung: plugin, hook, skill
├─ .githooks/              # pre-commit
├─ Dockerfile              # deploy một container = một link
└─ docker-compose.yml      # PostgreSQL local
```

## Mỹ thuật và giấy phép

Quy tắc hình (isometric, cỡ khung, phong cách, bảng màu) ở `GAME_DESIGN.md` mục 5.11, quy cách chi tiết (sheet, key, thư mục) ở `tools/assets/README.md`, cách làm ảnh ở skill `.claude/skills/asset-gen`.
Nguồn ảnh: **ComfyUI** tự host và **Gemini** (công cụ AI, dùng theo điều khoản của từng dịch vụ), **LPC** (Universal LPC Spritesheet Character Generator,
chỉ cho NPC phụ và dân thường; thú LPC làm hình tạm cho hồn thú thường) và ảnh vẽ tay. Font: Ark Pixel và Be Vietnam Pro (OFL).
Asset bên ngoài được dùng mọi giấy phép rõ ràng (CC0, CC-BY, CC-BY-SA, OGA-BY, CC-BY-NC, GPL, OFL…) kèm nghĩa vụ ghi công / share-alike ở `GAME_DESIGN.md` mục 5.11. Không dùng ảnh từ game thương mại, phim hay truyện tranh chính thức. Tác giả, giấy phép và nguồn của từng file ở [`art/CREDITS.md`](art/CREDITS.md).

## Sửa bản đồ bằng Tiled

1. Cài [Tiled](https://www.mapeditor.org), mở `shared/assets/<mapId>.json` (mã bản đồ khai báo trong `MAPS` ở `shared/data.ts`).
2. Layer `ground` là nền, `trees` là vật cản, `canopy` là tán cây phủ lên nhân vật. Ô chặn đường có thuộc tính bool `collides = true` trong tileset.
3. Layer đối tượng chứa `zone` (vùng săn), `portal`, `arrive`, `spawn`, `safe`, `elite`, `boss`, `npc`; thuộc tính từng loại ở `GAME_DESIGN.md` mục 6.
4. Lưu lại (giữ định dạng JSON), khởi động lại server. Object sai thuộc tính thì server ghi cảnh báo và bỏ qua.

Các bản đồ hiện được sinh bằng `tools/gen-map.mjs`; `npm run map` sinh lại và **ghi đè** bản đã vẽ tay.

## Đưa lên mạng

Server phục vụ luôn bản build của client, nên chỉ cần **một dịch vụ, một link**. Với nền tảng chạy được Docker (Render, Railway, Fly.io, VPS…):

1. Tạo dịch vụ từ repo, build bằng `Dockerfile`.
2. Thêm biến môi trường `DATABASE_URL` (Supabase hoặc Postgres của nền tảng) và `TRUST_PROXY=1` (chạy sau proxy, để giới hạn đăng nhập sai theo đúng IP).
3. Deploy xong, gửi link cho bạn bè.

Nền tảng cần hỗ trợ WebSocket và nên giữ server chạy liên tục (gói miễn phí thường "ngủ", lần vào đầu chậm).
Muốn để client ở chỗ khác (Vercel, Netlify…): build client với `VITE_SERVER_URL=https://server-cua-ban` và đặt `CLIENT_ORIGIN` trên server bằng domain của client.

## Phát triển cùng Claude Code

Repo có cấu hình chung trong `.claude/settings.json`: plugin từ marketplace `claude-plugins-official` (`typescript-lsp`, `context7`,
`security-guidance`, `feature-dev`, `pr-review-toolkit`, `code-simplifier`), hook tự typecheck sau mỗi lần AI sửa file (`node tools/check.mjs --hook`)
và skill dự án trong `.claude/skills/` (`roadmap-step`, `server-feature`, `client-ui`, `db-migration`, `balance-data`, `asset-gen`;
soát chất lượng: `balance-review`, `anti-cheat-audit`, `soak-perf`, `bot-flakiness`, `playtest-triage`, phỏng theo
[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios), MIT).
AI đọc `CLAUDE.md` và `GAME_DESIGN.md`; giao từng việc nhỏ theo mục Lộ trình.
Nhiều người / agent cùng làm: nhận việc qua issue GitHub theo `CONTRIBUTING.md` (agent khác Claude đọc `AGENTS.md`).

Mỗi máy làm một lần:

```bash
npm i -g typescript-language-server typescript   # để plugin typescript-lsp chạy được
npm run hooks                                    # bật git pre-commit hook
```

`context7` cần đăng nhập Context7 khi Claude Code hỏi lần đầu (hoặc dùng `/mcp`). Cài đặt riêng từng máy để ở `.claude/settings.local.json` (không commit).

## Phiên bản thư viện

Đã ghim: Phaser 3.90.0, Colyseus 0.16.5 (+ colyseus.js 0.16.22, @colyseus/schema 3.0.76), Vite 6.4.3, TypeScript 5.9.3.
Colyseus 0.18 và Phaser 4 đã ra nhưng có thay đổi API; nâng cấp khi cần.
