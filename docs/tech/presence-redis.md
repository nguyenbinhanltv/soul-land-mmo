# Thông báo toàn server, presence, Redis, lịch boss

**Thông báo toàn server và lịch boss**

## Presence và Redis
- Presence của Colyseus: phòng `publish("announce", {text, col})`, mọi `MapRoom` subscribe trong `onCreate` rồi `broadcast("chat")`.
- Một tiến trình dùng `LocalPresence` và bộ nhớ. Có `REDIS_URL` thì dùng `RedisPresence` cùng `RedisDriver` để pub/sub và registry phòng.
- Đã bật Redis mà Redis lỗi thì **fail-closed**, không tự rơi về RAM vì sẽ tạo split-brain.
- **Prod hiện chạy một tiến trình, không đặt `REDIS_URL`** (`docs/ops/trien-khai.md`, `docs/ops/db-redis-sao-luu.md`). Nhiều tiến trình / Redis chỉ dùng khi thử (`bot:local --procs 2 --pg`).
- Hợp đồng dữ liệu presence: trạng thái tạm thời chỉ chứa `accountId`, `roomId`, `sessionId` / fencing token, mã bản đồ / kênh, thời gian hết hạn và dữ liệu hiển thị tối thiểu; không chứa token đăng nhập, mật khẩu, túi đồ hay bí mật. Lua `SET NX PX`, compare-renew và compare-delete làm các claim / release lặp lại an toàn.

## Redis mất giữa chừng: không phục vụ, không thoát
- `RedisBackend` (`presence.ts`) theo dõi kết nối (`healthy()`). Mất thì:
  - `GET /health` trả 503 `{ok:false, redis:"down"}` (`/live` vẫn 200 cho liveness probe);
  - `seatAccount` từ chối phiên mới (503, trước khi giữ chỗ);
  - phiên đang chơi không gia hạn được lease thì bị đóng (1011);
  - lệnh presence lỗi nhanh (`maxRetriesPerRequest` 2).
- Kết nối ioredis tự nối lại vô hạn. Redis có lại thì `/health` về 200, heartbeat (worker bạn bè, đấu trường, lease lịch boss) tự lấy lại và ghi lại trạng thái, tài khoản vào lại bình thường (lease cũ hết TTL hoặc `waitOldSession`). Không ghi hai nơi vì mọi đường ghi vẫn fail-closed khi Redis lỗi.
- Lệnh presence chạy nền (`void …`) phải qua `bg(op, what)` hoặc có `.catch`. `Presence.publish / subscribe / unsubscribe` của Colyseus đã bọc sẵn (`safePresence`): lỗi chỉ ghi log (giới hạn 10 giây một dòng mỗi loại); tin pub/sub mất lúc Redis mất vốn không đảm bảo giao.
- Handler `unhandledRejection` ngoài phòng: lỗi kết nối Redis (`isRedisFailure`, chỉ dấu hiệu riêng của ioredis, không nhận mã socket chung của pg / fetch) thì ghi log rồi chạy tiếp; mọi lỗi khác vẫn thoát có kiểm soát (`fatal`).
- Lần ghi cuối khi rời phòng / tắt server không phụ thuộc Redis (`releaseAccount` chỉ ghi log khi nhả lease lỗi, `write(final)` ghi không khóa món nếu Redis lỗi).
- Thử: `npm run test:presence-outage --prefix server` (2 server + Redis riêng, tắt / bật Redis, `OUTAGE_SECS`). CI chạy bài này trong job `presence-redis` (`docs/ops/ci.md`).

## Chat xuyên phòng
- Tổ đội, tin riêng, thế giới, tông môn (mục 4 "Kênh chat"): phòng của người gửi kiểm luật rồi `publish("chatx", {to?, tong?, msg: {ch, name, text, to?}})`.
- Mọi `MapRoom` (cả sân đấu) gửi tin `chat` cho người của mình có tài khoản trong `to`, hoặc đang thuộc tông `tong` (đọc `PData.tong` lúc nhận; người xem trận theo tông lúc vào phòng); không có cả hai thì gửi mọi người (kênh thế giới). Không cần danh sách thành viên tông toàn server.
- Tra tên → tài khoản đang trong game qua `party.onlineByName` (bảng `Live` của `party.ts`). Hồi kênh thế giới giữ ở `ratelimit.ts` theo tài khoản và ghi vào presence `world-chat:<tài khoản>`, nạp lúc vào phòng.
- Tuyến có `from` (tài khoản người gửi): phòng nhận bỏ người đã chặn người gửi (`friends.blocked`); chat bản đồ gửi `broadcast` trừ những người đó.

## Bạn bè (mục 5.9)
- `friends.ts` giữ danh sách bạn bè / chặn và `fans` (ai đã thêm mình) của người đang trong game, mức tiến trình theo tài khoản: nạp ở `onAuth` (`store.getSocial`, sau lần ghi cuối của phiên cũ), giữ ở `onJoin`, bỏ ở `onLeave`.
- Thao tác `friend` đổi danh sách trong RAM rồi ghi phần của chính người gửi qua `this.chain(d, …)` (`setFriend`, `setBlock`: chặn cùng transaction bỏ bạn).
- Phòng phát `FriendNote` lên presence `friend`; phòng giữ người nhận gửi lại tin riêng `friends {list, blocks, added?}` (bản đồ / kênh lấy từ `party.whereIs`, chỉ khi hai bên đã thêm nhau). Vào / rời phòng thì báo những người đã thêm nhau đang trong game (ở mọi tiến trình).

**Nhiều tiến trình (`REDIS_URL`)**
- Mỗi lần danh sách của người đang trong game đổi (vào, rời, thêm, xóa, chặn, bỏ chặn), tiến trình giữ người đó phát `friend:state {acc, sid, v, friends, blocks, enter?, gone?}` (chỉ số tài khoản) trước các `FriendNote` của cùng thao tác, và ghi tài liệu presence `friend:state` (tài khoản → phiên → danh sách) dưới lock để tiến trình mở sau nạp lúc khởi động. Mỗi lần ghi chỉ xóa phiên đã biết là kết thúc, không xóa phiên lạ có thể mới hơn.
- Thứ tự không dựa vào đồng hồ: `v` là bộ đếm của tiến trình, chỉ so trong cùng phiên. `enter` của phiên mới kết thúc mọi phiên cũ của tài khoản (phiên mới chỉ mở sau khi phiên cũ nhả tài khoản); `gone` chỉ kết thúc đúng phiên đó; tin của phiên đã kết thúc tới sau bị bỏ. Vào phòng ở một tiến trình cũng kết thúc bản sao cũ của chính tài khoản ở tiến trình đó (tiến trình cũ chết không có `gone`).
- Bản sao tạm có nhiều phiên (tin lệch thứ tự) thì gộp chặt: chặn của phiên nào cũng tính, là bạn chỉ khi mọi phiên đều có.
- Kiểm phía người gửi (`friends.blocked`: lời mời tổ đội, báo lỗi tin riêng), "đã thêm nhau" và vị trí trong bảng bạn bè đọc danh sách của người kia ở bất kỳ tiến trình nào, nên bị xóa / chặn là thôi thấy bản đồ / kênh ngay.
- Mục tài liệu mang tiến trình ghi (`w`); mỗi `FriendHub` gia hạn lease `friend:worker:<id>` (TTL `PRESENCE_TTL_MS`). Mục của tiến trình hết lease (bị kill / chết) không được nạp lúc khởi động và bị xóa ở lần ghi kế tiếp.
- Không khóa được tài liệu thì ghi lại tối đa 3 lần liên tiếp rồi bỏ lượt (lần đổi sau ghi bản mới nhất). Không có `REDIS_URL` thì không phát, không ghi (`FriendHub` không có presence).

## Lịch thú vương và boss thế giới (`server/src/schedule.ts`, `startSchedule`)
- Chỉ đếm giờ Việt Nam và `publish("boss", {mapId, king, phase: "warn" | "spawn", slot, in, life})`. Sinh boss, máu, chiêu, thưởng nằm trong phòng: `bossEvent.ts` (`onBossEvent`, `MapRoom` chuyển tiếp) và `MapRoom` (`spawnKing`).
- Phòng mở ra trong khung boss cũng sinh (`kingActive`, `worldActive`); phòng mở ra trong lúc báo trước vẫn có đếm ngược (`kingWarns` ở `procState.ts`).

**Trạng thái thú vương giữ theo bản đồ, dùng chung mọi tiến trình** (`kingSeats`)
- Key `king:<mapId>` chứa JSON các khung; suất có `id/owner/state/leaveAt`, `claimed[]`; lock Lua + TTL dọn suất của tiến trình chết.
- Mỗi khung đã sinh có danh sách suất, mỗi kênh giữ tối đa một suất (còn sống / đã hạ / đã rút). Phòng bị hủy trả suất; phòng mở lại trong khung nhận lại suất trống trước.
- Suất đã hạ / rút thì không sinh lại; còn sống thì sinh lại đầy máu ở giai đoạn 1 với thời gian còn lại.

**Khóa thưởng tinh anh theo bản đồ** (`eliteLocks`)
- Key `elite:<mapId>|<mã tinh anh>` → tài khoản → thời điểm hết khóa; cập nhật dưới lock và phát snapshot qua presence.
- Không theo phòng nên đổi kênh hay phòng bị hủy rồi mở lại đều không nhân thưởng; TTL dọn bản ghi cũ.

**Kênh, khóa đổi kênh, đấu trường, tổ đội**
- `channels:<mapId>` cấp số kênh nguyên tử, heartbeat 5 giây và TTL 60 giây. `channel-left:<accountId>` và `channel-switch:<accountId>` có TTL `CHANNEL_CD`, nên đóng tab / tiến trình chết không giữ khóa vĩnh viễn.
- `arena:queue` là hàng chờ JSON dưới lock; cặp được claim một lần rồi phát `arena:found` về tiến trình sở hữu tài khoản (xem `kenh-arena.md`).
- `party:state` chứa thành viên / lời mời / live, cập nhật dưới lock; live heartbeat có TTL 60 giây. Message client (`party`, `arena`) không gửi dữ liệu riêng sang người khác.

## Đồng hồ khi kiểm thử
- Mọi chỗ đọc lịch và ngày nhận thưởng đi qua `bossNow` / `bossOffset`. Không bật `GAME_TEST` thì là đồng hồ thật.
- `GAME_TEST=1` theo `BOSS_CLOCK`: chưa đặt = đứng yên ở 12:00 giờ Việt Nam của ngày bật server (lịch thật không chen vào bài thử của bot); `HH:MM` = chạy từ giờ đó; `real` = đồng hồ thật.
- Lượt nhận thưởng mỗi ngày lưu ở `boss_claims` (`du-lieu-db.md`).

## Issue liên quan
#195 / #326 (bạn bè, nhiều tiến trình), #561 (Redis mất giữa chừng), #496 (soak Redis, `hieu-nang-soak.md`).
