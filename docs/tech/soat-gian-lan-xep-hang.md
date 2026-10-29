# Soát chống gian lận: Bảng Xếp Hạng (#877, bước X5)

Soát theo skill `anti-cheat-audit`. Phạm vi: tin `rank {op: "boards" | "top", board?, page?, pageSize?}` và các hạng mục Cấp, Sưu tầm, Sức mạnh (X2 + X3): `server/src/rooms/rank.ts` (`rankSync`, `rankAction`), `MapRoom.teamPowerOf`, `rankScores` / `powerScore` / `teamPowerScore` ở `shared/data.ts`, `rankPut / rankTop / rankMe` của `PgStore` và `MemoryStore`, `server/sql/037_xep_hang.sql`, tin `stats` (`power`, `teamPower`). Thiết kế: `docs/design/xep-hang.md` mục 5.19. Hạng mục Thợ săn tuần / Boss thế giới (X6) chưa có code nên chưa soát.
Ngày soát 2026-10-29, trên `main` tại `3f418909` cộng PR X3.

## Tóm tắt

| # | Giả thuyết | Kết quả | Mức |
|---|---|---|---|
| 1 | Client gửi điểm / hạng (`rank {op:"put"/"set", score}`, thêm trường `score`, `me`) để lên bảng | **Không khai thác được**: `rankAction` chỉ nhận `boards` / `top`, tin khác bị từ chối bằng `log`; không có đường ghi nào từ tin client; điểm chỉ do `rankSync` suy từ `d.owned` / `d.team` của server. Bot thử bốn tin giả, điểm Sức mạnh không đổi | — |
| 2 | Thổi điểm Sức mạnh bằng chỉ số tạm (buff, thức ăn, đan, Chân Thân) | **Không khai thác được**: `teamPowerOf` chỉ gọi `calcStats` với hồn hoàn / hồn cốt / hồn hạch + trang bị / cộng minh / tiên thảo đang lưu; buff tạm không có trong `calcStats`, Chân Thân (`d.ava`) bị loại (`sendStats` tính `power` trước khi nhân sinh lực) | — |
| 3 | Mặc đồ mạnh, chờ điểm được chụp, rồi tháo / bán / cho đồ | **Không khai thác được ở mức đáng kể**: không có giao dịch người với người (đồ mượn không có); điểm chỉ chụp ở mốc đã ghi DB, nên "đồ mượn" thành đồ thật. Tháo đồ thì lần lưu định kỳ kế (`SAVE_EVERY_SECS`) và lúc rời phòng chụp lại, nên điểm cao tồn tại tối đa một chu kỳ lưu (hoặc tới hết giao chiến, mục 4) | Thấp (chấp nhận) |
| 4 | Giữ điểm cao bằng cách ở mãi trong giao chiến (chặn lần chụp xuống) | **Không khai thác được**: `rankSync` bỏ qua khi `d.fight < TEAM_COMBAT_SECS` nhưng lần rời phòng (`final`) không xét giao chiến và luôn ghi điểm đúng trạng thái lúc rời | — |
| 5 | Đổi đội hình rồi đổi lại để "nhảy hạng" | **Không có lợi**: điểm luôn là trạng thái đang lưu; nhịp `RANK_SYNC_CD` chống ghi dồn; `updated_at` chỉ đổi khi `score` đổi nên không giành vị trí "đạt trước" bằng cách ghi lại cùng điểm | — |
| 6 | Cùng điểm: ghi đi ghi lại để chiếm "đạt mốc trước" | **Không khai thác được**: câu `INSERT … ON CONFLICT` giữ `updated_at` khi `score` không đổi (bot + `rank-test.ts` kiểm); tie-break cuối là `account_id` nên thứ tự xác định | — |
| 7 | Đọc dữ liệu riêng của người khác qua bảng | **Không lộ**: dòng công khai chỉ có hạng, tên, điểm, tông, đội hình (mã võ hồn + cấp + sao); bot `rowsOk` kiểm đúng bộ khoá; không Hồn Tệ, túi, bản đồ, vị trí; `me` chỉ gửi chính chủ; tin `stats` chỉ trả võ hồn của chính mình | — |
| 8 | Tài khoản `is_test` / đã bật cờ lệnh GM lên bảng hoặc thấy hạng của mình | **Chặn đúng** ở mọi hạng mục (`NOT is_test` ở `rankTop`, `rankMe`; test mới lặp qua cả `RANK_BOARDS`). **Lỗ nhỏ, đã sửa**: bật cờ bằng `markTest` không xoá cache nên tài khoản vẫn hiện tối đa `RANK_BOARD_CACHE` giây | Thấp → **đã sửa** |
| 9 | Spam tin `rank`, dồn 200 tin | **Giới hạn đúng**: nhóm `read` + nhịp `RANK_CD` mỗi người; bot bật `baglimit` dồn 200 tin chỉ nhận 1 bảng và vẫn kết nối | — |
| 10 | Làm tốn DB: xin trang / cỡ trang ngẫu nhiên để thoát cache, đọc trang sâu; mở bảng dồn | **Có lỗ tải, đã sửa** (mục 10 dưới): hạng của mình (`rankMe`) không qua cache nên mỗi lần mở bảng tốn một truy vấn đếm; trang sâu đọc thẳng DB, không có trần | Vừa → **đã sửa** |
| 11 | Mở bảng khi đang trong sân đấu để lách luật "không chụp giữa trận" | **Không khai thác được**: `rank` nằm trong `BLOCKED` của `ArenaRoom`. Ghi chú: `ArenaRoom.onJoin` gọi `super.onJoin` nên `rankSync` vẫn chạy lúc vào / rời sân; vì sân chặn đổi đội hình / đồ nên điểm ghi ra bằng đúng điểm đã lưu (không đổi) | Thấp (sửa tài liệu) |
| 12 | Nuôi nhiều tài khoản để dồn điểm / lên hạng | Không có chuyển giá trị giữa tài khoản; v1 không có thưởng vật phẩm cho hạng (Q52), chỉ danh hiệu hiển thị | — |
| 13 | Ghi điểm lúc DB lỗi / hai tiến trình: hỏng dữ liệu | **Đúng**: `rankSync` chạy trong `this.chain(d, …)`, lỗi chỉ ghi log và giữ dấu vết cũ (lần sau ghi lại); `rankPut` ghi nhiều dòng trong một transaction, idempotent | — |
| 14 | SQL | `037_xep_hang.sql` chạy lại an toàn, bật RLS không tạo policy; `ON DELETE CASCADE` + có trong `REMOVE_TABLES` (`removeTestAccount` xoá); không có trường người chơi gửi vào câu SQL (mọi tham số `$n`) | — |

Không có lỗi Nghiêm trọng / Cao. Hai mục "đã sửa" (8, 10) nằm trong cùng PR với tài liệu này.

## Danh sách bề mặt đã soát

| Tin / route | Kết quả |
|---|---|
| `rank {op:"boards"}` | Đã đọc, ổn: nhóm `read` + `RANK_CD`, danh mục cố định, không dữ liệu riêng |
| `rank {op:"top", board, page, pageSize}` | Đã đọc, ổn sau sửa (mục 8–10): `board` kẹp theo `RANK_BOARDS` (lạ: log, không truy vấn), `page` / `pageSize` qua `intIn` + kẹp; bot thử mã lạ, kiểu lạ (`{}`, `"x"`), cỡ 9999, trang quá xa |
| `rank` với `op` lạ / trường điểm giả | Đã đọc, ổn: từ chối bằng `log`, không đổi điểm; bot thử |
| Tin `rank` / `rankTop` server → client | Chỉ người xin (`room.clients.getById(id).send`); không vào `schema.ts` |
| `stats {rowId?}` (thêm `power`, `teamPower`) | Đã đọc, ổn: chỉ võ hồn của chính chủ (tra trong `d.owned`), cùng nhịp `ask` / nhóm `read` như trước |
| `rankSync` (không phải tin; mốc ghi) | Đã đọc, ổn (mục 2–6, 13) |
| `ArenaRoom` | `rank` trong `BLOCKED` (mục 11) |
| Hook test (`set`, `grant`, `baglimit`) | Chỉ có hiệu lực khi `GAME_TEST=1`; điểm bot đổi cấp bằng hook vẫn đi qua `rankSync` (không có đường tắt ghi điểm) |
| Lệnh GM (`preset`, `markTest`) | `preset` đặt `d.gmReset` (bỏ mọi lần ghi sau, gồm `rankSync`); `markTest` ẩn khỏi bảng (mục 8) |
| SQL `037_xep_hang.sql` | Mục 14 |
| REST | Không có route mới |

## Chi tiết các mục chính

**1. Không có đường đặt điểm.** Điểm Cấp / Sưu tầm / Sức mạnh đều tính ở `rankScores(d.owned, d.team, room.teamPowerOf(d))` từ dữ liệu server giữ (đã nạp từ DB, đổi qua các tin đã có luật riêng). `powerScore` là hàm thuần ở `shared/data.ts`; bảng Nhân vật chỉ hiện số server gửi trong tin `stats` (client không tính), và bot so `teamPower` với `me.score` trên bảng.

**2. Buff tạm.** `calcStats` không nhận buff trận. Trang bị hồn sư vào qua `coreBonusOf` → `withGear`: dữ liệu đang gắn của chính người chơi (đồ tự có). Cộng minh (`d.res.bonus`) và tiên thảo là thứ lưu vĩnh viễn trên tài khoản / võ hồn.

**3–4. Mốc chụp.** `rankSync` chạy: lúc vào phòng, sau lần ghi DB thành công, lúc rời phòng. Giữa trận (`d.fight < TEAM_COMBAT_SECS`) và trong nhịp `RANK_SYNC_CD` thì bỏ qua (trừ `final`). Điểm có thể cũ tối đa vài chục giây so với túi đang gắn, theo hướng cả lên lẫn xuống; không có giao dịch nên không dùng được để "cho mượn đồ".

**8. Cache và ẩn tài khoản.** `markTest` của `PgStore` giờ gọi `rankScoresClear()` (như các ghi điểm), nên tài khoản bị bật cờ biến mất khỏi mọi trang ngay.

**10. Tải: số đo.** Bài đo trên Supabase TEST (dữ liệu 44 dòng mỗi hạng mục, 100 người cùng mở bảng ở nhịp `RANK_CD` = 2 giây trong 20 giây, `PG_POOL_MAX` mặc định 10; mỗi lượt xin một trang + hạng của mình; script tạm, chỉ đọc):

| Kịch bản | Trước sửa | Sau sửa |
|---|---|---|
| Người chơi thường (trang 1, cỡ 10) | 35 truy vấn/giây, trễ p50 687 ms, p95 2,6 giây (mỗi lượt xin = 1 truy vấn `rankMe` không cache) | **6,9 truy vấn/giây**, p50 0 ms, p95 1,6 giây (chỉ lúc khởi động) |
| Kẻ cố tình đổi trang (1–50) và cỡ (1–20) ngẫu nhiên | 42 truy vấn/giây, p50 5,4 giây (bể kết nối 10 bị chiếm, kéo chậm cả lần lưu của người khác) | 40 truy vấn/giây trong 20 giây đầu (khoá lạnh: tối đa 20 cỡ × 50 trang × hạng mục khoá, mỗi khoá một lần mỗi `RANK_BOARD_CACHE` giây); trần mỗi kết nối vẫn là một lượt xin mỗi `RANK_CD` |

Sửa: `rankMe` giữ `RANK_BOARD_CACHE` giây theo tài khoản (khoá `rank|me|…`, xoá cùng các trang khi điểm ai đó đổi); trang kẹp vào `RANK_PAGE_DEPTH` (trang xa nhất, `hasNext = false`) và **mọi** trang qua cache nên số khoá có trần; cache dọn khoá hết hạn khi vượt `RANK_CACHE_MAX`. Tồn đọng (Thấp, chấp nhận): kẻ phá cache vẫn tốn tối đa khoảng 3 truy vấn mỗi 2 giây mỗi kết nối cố tình trong lúc khoá lạnh (cùng cỡ với việc gửi tin `team` / `starup` đã được nhóm giới hạn chấp nhận); truy vấn đếm của `rankMe` quét chỉ mục theo vị trí nên cần đo lại khi một hạng mục vượt vài chục nghìn dòng. Nếu cần chặt hơn, thêm hệ số cỡ trang cố định (chỉ `RANK_PAGE_SIZE`) hoặc giới hạn số truy vấn bảng mỗi tiến trình mỗi giây.

## Cách kiểm lại

`npm run test:rank --prefix server`; `npm run bot:local -- --only rank` (thêm `--pg` khi đụng `PgStore` / SQL); `npm run check`.
