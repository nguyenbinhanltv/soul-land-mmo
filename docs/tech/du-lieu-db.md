# Dữ liệu: shared/data.ts và PostgreSQL

## Dữ liệu trong `shared/data.ts`
- Server, client và bot cùng import. Mọi số cân bằng nằm ở đây, tài liệu chỉ trỏ tên hằng.
- Mã cố định không bao giờ đổi; phần tử mới thêm vào **cuối mảng** vì chỉ số dùng để đồng bộ.
- Bảng dữ liệu chính: `MAPS`, `BEASTS`, `BEAST_SKILLS`, `BOSSES`, `VOHON`, `VOHON_SKILLS`, `VOHON_SKILLS_HIGH`, `TIEN_CO_RIENG`, `CHAN_THAN`, `BONDS`, `FUSIONS`, `STATUS`, `BUFFS`, `ITEMS`, `HERBS`, `CORE_SETS`, `BONE_SKILLS`, `NPCS`, `QUESTS`, `DAILY`, `DAILY_POOL`, `RESONANCE`, `ARENA`.
- Cấp tương đương tính bằng hàm từ `RING_LIMIT`, không lưu bảng riêng.

## Dữ liệu lâu dài trong PostgreSQL
- File `server/sql/00N_….sql`, mỗi file `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` và bật RLS (không tạo policy). `PgStore.init()` (`server/src/db.ts`) chạy mọi file theo tên mỗi lần khởi động, nên câu lệnh phải chạy lại an toàn. Không sửa file đã chạy.
- Không có `DATABASE_URL` thì dùng `MemoryStore` (RAM). Mọi thay đổi lưu trữ cập nhật cả `PgStore` lẫn `MemoryStore`.
- Môi trường: dev dùng PostgreSQL ở máy (Docker) hoặc `MemoryStore`; Supabase là **DB thử** (quay ảnh, đo FPS), không phải prod; prod là PostgreSQL trong cụm (`docs/ops/db-redis-sao-luu.md`). Bot chạy bằng `npm run bot:local -- --pg` trên PostgreSQL riêng của lượt chạy, không trỏ vào DB prod.
- Ghi dữ liệu của một người chơi luôn qua chuỗi lưu `this.chain(d, fn)`.

## Bảng chính
- `accounts`: tài khoản, ngoại hình (`looks`), võ hồn ra trận, `map_id` + `pos_x` / `pos_y` + `map_file` (file Tiled của tọa độ), `bag_slots`, Hồn Tệ, bộ lọc tự bán `auto_sell` và đồ tự bán gần nhất `auto_sold`, cờ `is_test`. `sessions`. Phiên sống 30 ngày; `033_sessions_don.sql` thêm chỉ mục, mở phiên xóa phiên quá hạn và giữ tối đa 10 phiên mới nhất của tài khoản, `pruneSessions` quét mỗi giờ (#736).
- `account_identities`: định danh Google (`sub`), xem `giao-thuc-server.md`.
- `vohons` (võ hồn sở hữu: cấp, kinh nghiệm, sao, hồn hoàn theo số năm, `skills` 4 ô mang theo, `herbs`), `teams` (mỗi ô đội hình một dòng).
- `items`: mỗi món một id: loại, mã, số lượng, số năm, sao, cấp cường hóa, `stats` JSONB, `vohon_id` đang gắn, `locked` người chơi khoá, `equip_slot` (trang bị hồn sư đang mặc, NULL = trong túi), `ver` (tăng mỗi lần ghi đè một món).
- `waypoints`: truyền tống trận tài khoản đã mở, mã `<mapId>:<tên>`; chỉ thêm.
- `map_fog`: sương mù khám phá, mỗi tài khoản × bản đồ một dòng (`map_file`, `cells` bitset ô thô; mục 5.17).
- `auto_hunt`: tự săn (mục 5.13), cài đặt JSONB, ngày giờ Việt Nam và số giây đã treo trong ngày, quỹ giờ cộng thêm từ Ủy Thác Lệnh `bonus_secs`; mỗi tài khoản một dòng.
- `auto_offline`: ủy thác offline (mục 5.13), bản đồ, tên vùng, thời điểm bắt đầu, ngày và giây đã treo lúc thoát; tối đa một dòng mỗi tài khoản, xóa khi nhận.
- `friends`, `blocks`: bạn bè / chặn; mỗi tài khoản chỉ ghi dòng của chính mình, hai bên là bạn khi có cả hai dòng.
- `tong_points`: điểm tông môn theo tuần (mục 5.14).
- `boss_claims`: lượt nhận thưởng mỗi ngày (loại: thú vương, boss thế giới, thắng đấu trường `dau_hon_truong`, mảnh đổi ở Thương hội; số lần).
- `quests`: tiến độ nhiệm vụ, ghi cùng transaction với túi; khảo hạch hằng ngày là chuỗi `daily:<yyyymmdd>:<i>`, chỉ giữ ngày đang chơi.
- `arena_ratings` (Elo, thắng / thua / hòa), `arena_pairs` (số trận mỗi cặp mỗi ngày).
- `characters`, `inventory` (từ `001_init.sql`): bảng cũ, giữ để chuyển dữ liệu, không còn ghi.

## Lưu túi chỉ ghi dòng `items` có đổi (#737)
`PgStore.upsertItems` (gọi từ `writeBag`) có `DO UPDATE ... WHERE ... IS DISTINCT FROM` trên mọi cột được ghi: món không đổi không tạo phiên bản dòng mới (không WAL, không dead tuple). Câu `INSERT` không trả `rowCount` bằng số món nữa, nên id thuộc tài khoản khác được kiểm riêng bằng một truy vấn khóa chính. Đo bằng `BOT_PG_STATS=1 npm run bot:local -- --only <nhóm> --pg --once` (in `n_tup_upd` / `n_dead_tup` của `items` trước khi xóa database; PG chung của máy tắt autovacuum nên dead tuple cộng dồn):

| Nhóm bot (--pg) | `items` upd trước → sau | `items` dead trước → sau |
|---|---|---|
| `bag` | 6502 → 34 | 6015 → 580 |
| `equipsoak` | 83435 → 5030 | 3891 → 2637 |

Số `ins` / `del` giữ nguyên (bag 1547 / 553). Số dead của `equipsoak` còn lại phần lớn do `DELETE` và `ver` của món đổi thật. Cấu hình pool xem `docs/ops/db-redis-sao-luu.md`.

## Tài khoản test
- Cột `accounts.is_test`. Chủ repo dựng bằng `npm run seed:test --prefix server` (mức `max` / `giua-game` / `moi` ở `server/src/testPreset.ts`, số lấy từ `shared/data.ts`; hướng dẫn ở `docs/test-accounts.md`).
- Chơi như tài khoản thường nhưng **ẩn khỏi mọi bảng xếp hạng** (đấu trường, cộng minh, tông tuần: cả hạng của chính nó) và **chỉ ghép Đại Đấu Hồn Trường với tài khoản test** (`ArenaMember.test`; `arenaQueue.ts` chia nhóm theo cỡ và loại).
- Tổ đội lẫn tài khoản test và người thật không xếp hàng Đại Đấu Hồn Trường được (báo từ chối), để người thật không bị đổi Elo bởi trận với tài khoản test.
- Script chỉ ghi / xoá tài khoản có cờ này, trong một transaction (`Store.seedTestAccount` / `removeTestAccount`), từ chối khi tài khoản đang online. Agent không bao giờ trỏ nó vào DB thật.

## Lệnh GM (`server/src/gm.ts`, `MapRoom.gmAction`)
- Gõ `/gm <lệnh>` trong ô chat, gửi tin `gm {cmd}`. Chỉ tài khoản có `accounts.id` trong biến môi trường `ADMIN_ACCOUNTS` (dấu phẩy; **trống = tắt hẳn**) được thực thi, kiểm ở server mỗi lệnh; người khác chỉ nhận một dòng từ chối.
- Lệnh: `level`, `give`, `ring`, `bone`, `core`, `gear`, `vohon`, `coin`, `tp`, `preset` (dùng chung `testPreset.ts` với script; ghi đè DB rồi ngắt kết nối, phiên đó không ghi gì thêm).
- Mọi giá trị kẹp theo `shared/data.ts`; giới hạn `GM_BURST` lệnh mỗi `GM_WINDOW_MS`; mỗi lệnh (kể cả bị từ chối) ghi một dòng `[GM]` vào log server; admin dùng lệnh lần đầu thì tài khoản tự bật `is_test`. Không dùng được trong sân đấu.
- Không đặt `ADMIN_ACCOUNTS` cho DB / server chạy bot hoặc đo tải ngoài máy mình.

## Issue liên quan
#195 (bạn bè), #435 (sương mù), #517 (tài khoản test), #518 (lệnh GM), #612 (Google).
