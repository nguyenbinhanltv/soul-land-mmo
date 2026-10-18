# Rừng Săn Hồn Online

MMO săn hồn thế giới mở, pixel 2D, chơi trên trình duyệt.
Phaser 3 + Tiled (client), Node.js + Colyseus (server), PostgreSQL hoặc Supabase (dữ liệu).

```
rung-san-hon-online/
├─ shared/
│  ├─ data.ts              # số liệu cân bằng dùng chung (niên hạn, võ hồn, hồn kỹ, công thức)
│  └─ assets/
│     ├─ forest.json       # bản đồ Tiled – mở bằng Tiled để vẽ
│     └─ tiles.png         # tileset 16×16 tạm thời
├─ server/
│  ├─ src/index.ts         # Express API (đăng nhập, thức tỉnh) + Colyseus
│  ├─ src/rooms/ForestRoom.ts  # toàn bộ luật chơi, chạy 20 lần/giây
│  ├─ src/rooms/schema.ts  # trạng thái đồng bộ xuống client
│  ├─ src/map.ts           # đọc va chạm và vùng từ file Tiled
│  ├─ src/db.ts            # PostgreSQL / bộ nhớ RAM
│  └─ sql/001_init.sql     # bảng accounts, sessions, characters, inventory
├─ client/
│  ├─ src/main.ts          # đăng nhập, thức tỉnh, vào phòng
│  ├─ src/scenes/GameScene.ts  # vẽ bản đồ, nhân vật, hồn thú, hiệu ứng
│  ├─ src/hud.ts           # giao diện HTML (máu, hồn hoàn, kỹ năng, chat)
│  ├─ src/textures.ts      # sprite pixel vẽ bằng code (thay được bằng ảnh)
│  └─ scripts/bot-test.mjs # 2 bot tự kiểm thử server
├─ tools/gen-map.mjs       # sinh bản đồ khởi đầu
├─ tools/gen-tiles.py      # sinh tileset tạm
├─ GAME_DESIGN.md          # luật chơi + lộ trình (cho người và AI đọc)
├─ CLAUDE.md               # quy tắc cho AI agent khi sửa code
├─ .claude/                # cấu hình Claude Code dùng chung: plugin, hook, skill
├─ Dockerfile              # deploy một container = một link
└─ docker-compose.yml      # PostgreSQL local
```

## Chạy trên máy (5 phút)

Cần Node.js 22 trở lên.

```bash
npm run install:all       # cài thư viện cho server và client
npm run dev:server        # terminal 1 – server ở http://localhost:2567
npm run dev:client        # terminal 2 – game ở http://localhost:5173
```

Mở `http://localhost:5173`, nhập tên và mật khẩu bất kỳ (tên mới sẽ tự tạo tài khoản).
Mở thêm một tab ẩn danh với tên khác để thấy hai người chơi cùng lúc.
Điện thoại cùng mạng Wi-Fi: mở `http://<IP-máy-tính>:5173`.

Chưa cấu hình database thì dữ liệu chỉ lưu trong RAM, tắt server là mất. Để lưu thật, chọn một trong hai cách dưới.

### Cách 1: PostgreSQL bằng Docker

```bash
docker compose up -d
cp .env.example server/.env      # đã có sẵn DATABASE_URL cho Postgres local
npm run dev:server
```

Server tự tạo bảng khi khởi động.

### Cách 2: Supabase

1. Tạo project trên [supabase.com](https://supabase.com), ghi nhớ mật khẩu database. Chọn region gần người chơi (vd Singapore).
2. Trong dashboard bấm **Connect** → **Connection String** → Type `URI` → Method **Session pooler**, sao chép chuỗi.
   - Đừng dùng "Direct connection" (`db.<ref>.supabase.co`): chỉ chạy qua IPv6, nhiều mạng và nền tảng hosting không có.
   - Không cần "Transaction pooler" (cổng 6543): server giữ kết nối lâu dài nên Session pooler hợp hơn.
3. Ghi vào `server/.env`: `DATABASE_URL=postgresql://postgres.<ref>:<mật-khẩu>@aws-0-<region>.pooler.supabase.com:5432/postgres`.
   Mật khẩu có ký tự đặc biệt thì mã hóa URL (`@` → `%40`, `#` → `%23`, `/` → `%2F`). SSL tự bật khi URL chứa "supabase".
4. Chạy lại `npm run dev:server`. Thấy `✓ Đã kết nối PostgreSQL` là xong. Bảng tự tạo, xem ở mục **Table Editor**.

Server tự bật Row Level Security cho các bảng, nên Data API công khai của Supabase không đọc được mật khẩu băm hay token.
Server vẫn đọc/ghi bình thường vì kết nối bằng user `postgres`. Không cần dùng khóa `anon` / `service_role`.
Gói miễn phí sẽ tạm dừng project sau khoảng 1 tuần không có truy cập; vào dashboard bấm Restore để chạy lại.

## Điều khiển

WASD hoặc phím mũi tên để đi, J hoặc Space để đánh, 1–4 để dùng hồn kỹ, E để hấp thụ hồn hoàn, Enter để chat.
Trên điện thoại có joystick ảo và nút bấm.

## Sửa bản đồ bằng Tiled

1. Cài [Tiled](https://www.mapeditor.org), mở `shared/assets/forest.json`.
2. Layer `ground` là nền, `trees` là vật cản (cây, lều, lửa trại), `canopy` là tán cây phủ lên nhân vật.
3. Layer đối tượng `zones` chứa các vùng săn (class `zone`) với thuộc tính `hint`, `weights` (tỉ lệ 5 niên hạn) và `count` (số hồn thú). Đối tượng class `spawn` là doanh trại.
4. Muốn ô nào chặn đường: chọn ô đó trong tileset và thêm thuộc tính bool `collides = true`.
5. Lưu lại (giữ định dạng JSON). Khởi động lại server để nó đọc va chạm mới.

`npm run map` sẽ sinh lại bản đồ ngẫu nhiên và **ghi đè** bản bạn đã vẽ, chỉ chạy khi muốn bắt đầu lại.

## Đưa lên mạng, gửi link cho bạn bè

Server đã được viết để phục vụ luôn bản build của client, nên chỉ cần **một dịch vụ, một link**.

Với bất kỳ nền tảng nào chạy được Docker (Render, Railway, Fly.io, VPS…):

1. Đẩy code lên GitHub.
2. Tạo dịch vụ mới từ repo, chọn build bằng `Dockerfile`.
3. Thêm biến môi trường `DATABASE_URL` (chuỗi Supabase hoặc Postgres của nền tảng).
4. Deploy xong, gửi link cho bạn bè.

Nền tảng cần hỗ trợ WebSocket và nên giữ server chạy liên tục (gói miễn phí thường "ngủ" khi không có người, lần vào đầu sẽ chậm). Hãy kiểm tra giá và giới hạn hiện tại của từng nơi.

Muốn để client ở chỗ khác (Vercel, Netlify…): build client với `VITE_SERVER_URL=https://server-cua-ban` và đặt `CLIENT_ORIGIN` trên server bằng domain của client.

## Kiểm thử nhanh

```bash
npm run typecheck --prefix server
npx tsc --noEmit -p client
npm run bot --prefix client     # khi server đang chạy: 2 bot vào phòng, đi săn, thử hấp thụ
```

## Vibe code tiếp

Mở thư mục này bằng Claude Code hoặc Cursor. AI sẽ đọc `CLAUDE.md` và `GAME_DESIGN.md`.
Giao từng việc nhỏ, ví dụ:

> Thêm túi đồ: hồn thú có 20% rơi "Hồn Thú Hạch" (item). Lưu vào bảng inventory, đồng bộ số lượng
> qua schema, hiện một ô túi đồ nhỏ trên HUD. Server quyết định rơi đồ, client chỉ hiển thị.

Sau mỗi bước, chạy kiểm thử ở trên rồi mới làm bước tiếp theo.

### Cài đặt cho dev dùng Claude Code

Repo có sẵn cấu hình chung trong `.claude/settings.json` (cùng áp dụng cho mọi người clone repo và mọi worktree):

- **Plugin** từ marketplace `claude-plugins-official`: `typescript-lsp`, `context7`, `security-guidance`, `feature-dev`,
  `pr-review-toolkit`, `code-simplifier`.
  Lần đầu mở repo, Claude Code hỏi có tin thư mục này và cài marketplace/plugin không: chọn đồng ý.
- **Hook**: sau mỗi lần AI sửa file, `node tools/check.mjs --hook` tự typecheck phần bị ảnh hưởng (server, client hoặc cả hai) và báo lỗi cho AI tự sửa.
- **Skill dự án** trong `.claude/skills/`: `roadmap-step`, `server-feature`, `client-ui`, `db-migration`, `balance-data`.

Việc mỗi người cần làm một lần trên máy mình:

```bash
npm i -g typescript-language-server typescript   # để plugin typescript-lsp chạy được
npm run hooks                                    # bật git pre-commit hook
```

- `context7` (tra tài liệu thư viện mới nhất) cần đăng nhập Context7 khi Claude Code hỏi lần đầu; làm theo hướng dẫn hiện ra (hoặc dùng `/mcp`).
- Cài đặt riêng của từng máy để ở `.claude/settings.local.json` (không commit).

## Phiên bản thư viện

Đã ghim: Phaser 3.90.0, Colyseus 0.16.5 (+ colyseus.js 0.16.22, @colyseus/schema 3.0.76), Vite 6.4.3, TypeScript 5.9.3.
Colyseus 0.18 và Phaser 4 đã ra nhưng có thay đổi API; nên nâng cấp sau khi game ổn định.
