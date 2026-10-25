# Hướng dẫn cho AI (mọi công cụ)

Đọc `GAME_DESIGN.md` (mục lục: số mục như "mục 5.3" nằm ở file nào + luật chung), rồi **chỉ** file của hệ thống mình sửa (bảng cuối). Quyết định chủ repo: `docs/quyet-dinh.md` (không viết ngược). Nhận việc / PR: `CONTRIBUTING.md`.

## Luật cốt lõi
- Giao diện, chú thích, commit, PR bằng tiếng Việt; dùng đúng tên gốc Đấu La.
- **Server-authoritative:** logic game chỉ ở `server/src/rooms/` (`MapRoom`, `ArenaRoom`); client (`client/src`) chỉ hiển thị và gửi ý định.
- **Số cân bằng** chỉ ở `shared/data.ts`; tài liệu trỏ tên hằng, không chép số.
- **Trường đồng bộ mới:** khai ở `rooms/schema.ts`, đọc ở `GameScene.ts`; dữ liệu riêng gửi tin riêng; thực thể ở xa không có trong state (`interest.ts`, `beastsNear`).
- **SQL mới:** `server/sql/00N_<tên>.sql` (N kế tiếp trên `origin/main`), chạy lại an toàn, bật RLS; sửa cả `PgStore` lẫn `MemoryStore`; ghi DB một người chơi qua `this.chain(d, fn)`.
- **Ảnh / âm thanh:** nguồn, giấy phép ở `docs/art/nguon-giay-phep.md`, thao tác ở skill `asset-gen`; âm thanh chỉ CC0. Không ghi key / bí mật vào repo, log, PR.
- Luật chơi đổi thì sửa đúng file thiết kế; làm từng việc nhỏ; xong bước thì đánh dấu `ROADMAP.md`.
- Mỗi việc một nhánh từ `origin/main`, một PR vào `main`; không commit `main`, không force push, không `--no-verify`; PR đã gửi review thì đóng băng.

## Lệnh
`npm run install:all` · `npm run hooks` (một lần) · `npm run check` (**bắt buộc** sau mỗi thay đổi) · `npm run build` · `npm run dev:server` / `dev:client` · `npm run bot:local -- --only <nhóm> [--pg]` (bot ở máy: **chỉ** cách này, tối đa 2 lượt). Chi tiết, PostgreSQL, tài khoản test, lệnh GM: `docs/ops/chay-local.md`. Supabase là DB test; prod không bao giờ trỏ.

## Sửa hệ thống X thì đọc Y (`docs/`)
| Hệ thống | Đọc |
|---|---|
| Võ hồn, đội hình, buff | `design/vo-hon-doi-hinh`, `trang-thai-buff` |
| Hồn hoàn / cốt / hạch, trang bị | `design/hon-hoan`, `hon-cot`, `hon-hach`, `trang-bi`, `tech/trang-bi-cai-dat` |
| Bản đồ, hồn thú, boss | `design/the-gioi-ban-do`, `hon-thu-boss`, `tech/phong-ban-do` |
| Túi, tiền, giao diện, radar | `design/kinh-te-tui-do`, `giao-dien`, `ban-do-khu-vuc` |
| NPC, nhiệm vụ | `design/npc-dia-diem`, `nhiem-vu` |
| Tổ đội, PvP, đấu trường | `design/to-doi-pvp-dau-truong`, `tech/kenh-arena` |
| Cộng minh, tông môn, tự săn | `design/cong-minh`, `tong-mon`, `tu-san-uy-thac` |
| Cảm giác đánh, pháp tướng | `design/ky-nang-combat-phap-tuong`, `art/phap-tuong` |
| Mạng, state, phiên, Redis | `tech/giao-thuc-server`, `dong-bo-state`, `luu-tru-cong-phien`, `presence-redis` |
| DB / SQL | `tech/du-lieu-db` |
| Client, isometric, dự đoán | `tech/client-iso-du-doan`, `art/quy-cach-isometric` |
| Hiệu năng | `tech/hieu-nang-hieu-ung`, `hieu-nang-soak` |
| Ảnh, âm thanh | `art/nguon-giay-phep`, `nhan-vat-hon-thu`, `hon-su-lpc`, `am-thanh` |
| Chạy local, CI, deploy | `ops/` |

## Skill (`.claude/skills/`)
`roadmap-step`, `server-feature`, `client-ui`, `landing-page` (trang giới thiệu `/`; kèm `frontend-design`, `webapp-testing`), `db-migration`, `balance-data`, `asset-gen`, `balance-review`, `anti-cheat-audit`, `soak-perf`, `bot-flakiness`, `playtest-triage`. Hook PostToolUse chạy `tools/check.mjs --hook` sau mỗi Edit/Write: báo lỗi TypeScript thì sửa ngay.
