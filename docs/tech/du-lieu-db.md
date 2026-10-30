# Dữ liệu: shared/data.ts và PostgreSQL

## Dữ liệu trong `shared/data.ts`
- Server, client và bot cùng import. Mọi số cân bằng nằm ở đây, tài liệu chỉ trỏ tên hằng.
- Mã cố định không bao giờ đổi; phần tử mới thêm vào **cuối mảng** vì chỉ số dùng để đồng bộ.
- Bảng dữ liệu chính: `MAPS`, `BEASTS`, `BEAST_SKILLS`, `BOSSES`, `VOHON`, `VOHON_SKILLS`, `VOHON_SKILLS_HIGH`, `TIEN_CO_RIENG`, `CHAN_THAN`, `BONDS`, `FUSIONS`, `STATUS`, `BUFFS`, `ITEMS`, `HERBS`, `CORE_SETS`, `BONE_SKILLS`, `NPCS`, `QUESTS`, `DAILY`, `DAILY_POOL`, `RESONANCE`, `ARENA`.
- Cấp tương đương tính bằng hàm từ `RING_LIMIT`, không lưu bảng riêng.

## Dữ liệu lâu dài trong PostgreSQL
- File `server/sql/00N_….sql`, mỗi file `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` và bật RLS (không tạo policy). `PgStore.init()` (`server/src/db.ts`) chạy mọi file theo tên mỗi lần khởi động, nên câu lệnh phải chạy lại an toàn. Cả vòng được bọc bằng khoá tư vấn cấp phiên (`MIGRATION_LOCK_KEY`, kết nối riêng) lấy bằng `pg_try_advisory_lock` thăm dò mỗi 250 ms (không dùng `pg_advisory_lock` chặn, vì nó dính `statement_timeout` / `query_timeout` của pool): nhiều tiến trình khởi động cùng lúc thì chạy lần lượt, không chồng; chờ quá `MIGRATION_LOCK_WAIT_MS` thì lỗi mã `55P03`, kết nối chết thì Postgres tự nhả khoá. Không sửa file đã chạy.
- Không có `DATABASE_URL` thì dùng `MemoryStore` (RAM). Mọi thay đổi lưu trữ cập nhật cả `PgStore` lẫn `MemoryStore`.
- Môi trường: dev dùng PostgreSQL ở máy (Docker) hoặc `MemoryStore`; Supabase là **DB thử** (quay ảnh, đo FPS), không phải prod; prod là PostgreSQL trong cụm (`docs/ops/db-redis-sao-luu.md`). Bot chạy bằng `npm run bot:local -- --pg` trên PostgreSQL riêng của lượt chạy, không trỏ vào DB prod.
- Ghi dữ liệu của một người chơi luôn qua chuỗi lưu `this.chain(d, fn)`.

## Bảng chính
- `accounts`: tài khoản, ngoại hình (`looks`), võ hồn ra trận, `map_id` + `pos_x` / `pos_y` + `map_file` (file Tiled của tọa độ), `bag_slots`, Hồn Tệ, bộ lọc tự bán `auto_sell` và đồ tự bán gần nhất `auto_sold`, cờ `is_test`. `sessions`. Phiên sống 30 ngày; `033_sessions_don.sql` thêm chỉ mục, mở phiên xóa phiên quá hạn và giữ tối đa 10 phiên mới nhất của tài khoản, `pruneSessions` quét mỗi giờ (#736). `036_sessions_token_hash.sql` (#1011): DB chỉ giữ `token_hash` = sha256(token) hex, phiên cũ được băm tại chỗ rồi xóa token rõ (không ai bị văng); `accountFromToken` còn nâng cấp dòng token rõ do bản server cũ chèn lúc triển khai.
- `account_identities`: định danh Google (`sub`), xem `giao-thuc-server.md`.
- `vohons` (võ hồn sở hữu: cấp, kinh nghiệm, sao, hồn hoàn theo số năm, `skills` 4 ô mang theo, `herbs`), `teams` (mỗi ô đội hình một dòng).
- `items`: mỗi món một id: loại, mã, số lượng, số năm, sao, cấp cường hóa, `stats` JSONB, `vohon_id` đang gắn, `locked` người chơi khoá, `equip_slot` (trang bị hồn sư đang mặc, NULL = trong túi), `ver` (tăng mỗi lần ghi đè một món).
- `waypoints`: truyền tống trận tài khoản đã mở, mã `<mapId>:<tên>`; chỉ thêm.
- `map_fog`: sương mù khám phá, mỗi tài khoản × bản đồ một dòng (`map_file`, `cells` bitset ô thô; mục 5.17).
- `auto_hunt`: tự săn (mục 5.13), cài đặt JSONB, ngày giờ Việt Nam và số giây đã treo trong ngày, quỹ giờ cộng thêm từ Ủy Thác Lệnh `bonus_secs`; mỗi tài khoản một dòng.
- `auto_offline`: ủy thác offline (mục 5.13), bản đồ, tên vùng, thời điểm bắt đầu, ngày và giây đã treo lúc thoát; tối đa một dòng mỗi tài khoản, xóa khi nhận.
- `friends`, `blocks`: bạn bè / chặn; mỗi tài khoản chỉ ghi dòng của chính mình, hai bên là bạn khi có cả hai dòng.
- `tong_points`: điểm tông môn theo tuần (mục 5.14); chỉ mục `tong_points_week_tong (week, tong)` cho bảng xếp hạng (`034_tong_points_week_index.sql`).
- `boss_claims`: lượt nhận thưởng mỗi ngày (loại: thú vương, boss thế giới, thắng đấu trường `dau_hon_truong`, mảnh đổi ở Thương hội; số lần).
- Bí Cảnh (mục 5.22) **không có bảng riêng**: lượt dùng lại `boss_claims` với `day` là khóa ngày Bí Cảnh `bicanhDay` (đổi 05:00) và `kind` = `bicanhRunKind(id)` (lượt đã vào) / `bicanhBuyKind(id)` (lượt đã mua thêm, trần `buyMax` kiểm ngay trong câu ghi `claimBoss`). Thưởng quyển dùng `kind` = `bicanhTomeKind` (số quyển đã nhận trong ngày, trần `BICANH.tomeDailyCap`; `claimBoss` với `n` = số quyển ghi cùng túi MỘT transaction). `Store.releaseBoss(accountId, day, kind, n)` hoàn nguyên tử (`GREATEST(0, n − …)`, không đụng túi) khi server lỗi: phòng không mở được, đóng khi chưa chốt, ghi thưởng lỗi (`bicanh.ts` `refundRun` / `releaseRun`); không cần SQL mới.
- `quests`: tiến độ nhiệm vụ, ghi cùng transaction với túi; khảo hạch hằng ngày là chuỗi `daily:<yyyymmdd>:<i>`, chỉ giữ ngày đang chơi.
- `arena_ratings` (Elo, thắng / thua / hòa), `arena_pairs` (số trận mỗi cặp mỗi ngày), `arena_elo_day` (tổng Elo cộng thêm mỗi tài khoản mỗi ngày, trần `ARENA.eloDaily`, `035_arena_elo_day.sql`).
- `rank_scores` (Bảng Xếp Hạng, mục 5.19, `037_xep_hang.sql`): điểm theo (hạng mục `board`, kỳ `period`, tài khoản): `score`, `tie`, `extra` (đội hình hiển thị: mã võ hồn, cấp, sao), `updated_at` chỉ đổi khi `score` đổi ("đạt mốc trước"). Server ghi Cấp / Sưu tầm (`rank.ts` `rankSync`, `Store.rankPut`) lúc vào phòng, sau lần lưu thành công (nhịp `RANK_SYNC_CD`, không giữa trận) và lúc rời phòng; đọc `Store.rankTop` / `rankMe` (trang dùng chung cache `RANK_BOARD_CACHE`, ghi đổi điểm xoá riêng các trang này; hạng của mình luôn tính riêng theo chỉ mục `rank_scores_order`). Tài khoản `is_test` ẩn.
- `checkin_state` (Phúc Lợi / Sổ Điểm Danh, mục 5.21, `038_phuc_loi.sql`): một dòng mỗi tài khoản, chu kỳ đang chạy: `cycle`, `start_day` (vnDayNum của ô 1), `mask` (bit i = ô i đã ký), `makeup_used`, `last_at` (đồng hồ server lần ký gần nhất, chống lùi giờ), `ver` (ghi có điều kiện). `Store.checkinGet` đọc mới mỗi lần; `Store.checkinClaim` ghi sổ + túi (quà, phí ký bù) một transaction với điều kiện ngay trong câu `UPDATE` (đúng `ver`, ô chưa ký hoặc sang chu kỳ mới, `makeup_used` ≤ `CHECKIN.makeupMax`, `last_at` không lùi); `welfare.ts` giữ chỗ trong RAM (`claimBusy`) và hoàn lại khi DB báo lỗi / từ chối. Xoá cùng tài khoản test (`removeTestAccount`).
- `mail` (Thư hệ thống, mục 5.24, `040_thu.sql`): một dòng mỗi thư: `account_id`, `kind` (nguồn trong `MAIL_KINDS`), `dedup` (khóa chống tạo trùng, `unique (account_id, dedup)`), `title`, `body`, `hon_te`, `items` (JSONB `[{code, qty}]`), `created_at`, `expires_at` (`MAIL.ttlDays`), `read_at`, `claimed_at`, `deleted_at` (xóa mềm, giữ `dedup` tới hết hạn). `Store.mailSend` chèn `ON CONFLICT DO NOTHING`; `Store.mailClaim` trong một transaction: `UPDATE … WHERE claimed_at IS NULL AND deleted_at IS NULL AND expires_at > now()` kèm túi và Hồn Tệ (không có cột phiên bản); `Store.mailList` dọn thư hết hạn của chủ rồi đọc. `removeTestAccount` xoá dòng.
- `achv_state` (Thành Tựu, mục 5.23, `039_thanh_tuu.sql`): một dòng mỗi tài khoản (tạo khi có bộ đếm hoặc khi nhận): `claimed` (mã thành tựu đã nhận, `ACHV[].id`), `counters` (bộ đếm sự kiện chỉ tăng: `elite`, `king`, `world`, `bicanh`). `Store.achvGet` đọc mới mỗi lần; `Store.achvBump` upsert một câu (tài khoản chưa có dòng vẫn đếm); `Store.achvClaim` trong một transaction: đảm bảo có dòng, đọc `counters` có khóa dòng rồi kiểm lại điều kiện, `UPDATE … WHERE NOT (claimed @> ARRAY[id])` (không có cột phiên bản) kèm túi và Hồn Tệ; trả `ok` / `dup` / `low`. `removeTestAccount` xoá dòng.
- **Cache bảng xếp hạng (#738):** `arenaTop` (danh sách đầu bảng) và `tongBoard` (cả hai tuần) được giữ chung trong tiến trình `RANK_BOARD_CACHE` giây, yêu cầu đến lúc đang tính dùng chung một lần truy vấn; ghi Elo / điểm tông trong cùng tiến trình xoá cache ngay (`rankBoardClear`), nên **độ trễ hiển thị tối đa `RANK_BOARD_CACHE` giây và chỉ khi ghi đến từ tiến trình khác**. Dòng `me` / hạng của mình luôn tính riêng (một truy vấn đếm theo chỉ mục `arena_ratings_rank`). Bảng cộng minh vẫn theo `RESONANCE_RANK_CACHE`, nay chỉ nạp số vòng hồn hoàn (`cardinality(rings)`) thay vì cả mảng. Đo trên PostgreSQL cục bộ 5000 tài khoản, 60 người mở bảng mỗi giây: 321 → 55 truy vấn/s, trễ p95 35 → 5 ms.
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
