# Nhiều kênh và phòng trường đấu

## Nhiều kênh
- Mỗi phòng của một bản đồ là một kênh, tối đa `CHANNEL_MAX` người (`maxClients`; biến môi trường `CHANNEL_MAX` chỉ có tác dụng khi `GAME_TEST=1`, để thử).
- `onCreate` lấy số kênh nhỏ nhất còn trống của bản đồ (`onDispose` trả lại), ghi `MapState.channel` và metadata `channel`. Danh sách kênh đọc qua `matchMaker.query({ name: "map", mapId })` (`listChannels`).

**Chọn kênh khi vào bản đồ** (`pickChannel`)
- Kênh còn chỗ có nhiều đồng đội tổ đội nhất; không có thì kênh còn chỗ ít người nhất (bằng nhau thì số nhỏ hơn); mọi kênh đầy thì Colyseus mở kênh mới.
- Vào game: client hỏi `POST /api/channel` (trả `mapId` đang lưu và `roomId`). Đi cổng: server gửi `travel {mapId, roomId}` sau khi transaction đã commit (`luu-tru-cong-phien.md`).
- Client `joinById(roomId, {token, mapId})`; phòng vừa đầy / vừa đóng thì `joinOrCreate`. `onAuth` vẫn đối chiếu `map_id` trong DB với bản đồ của phòng.

**Đổi kênh** (`channel {ch}`, `switchChannel`)
- Điều kiện: không gục / hấp thụ / đi cổng, ngoài giao chiến, kênh khác kênh đang ở, đang mở và còn chỗ, cách lần trước `CHANNEL_CD` giây.
- Đi đúng đường đi cổng (`beginTravel` với đích là chính bản đồ này tại vị trí đang đứng), nên tiến độ chưa lưu không mất. Danh sách `channels` gửi tối đa một lần mỗi giây.

**Không né luật đổi kênh bằng cách tự rời rồi vào kênh khác**
- Rời phòng không qua đường server duyệt thì tài khoản bị giữ ở kênh đó `CHANNEL_CD` giây (`leftRoom`): `onAuth` từ chối kênh khác của cùng bản đồ khi kênh cũ còn mở và còn chỗ, còn `pickChannel` đưa về đúng kênh cũ.
- Đi cổng / đổi kênh / truyền tống sang bản đồ khác commit xong cũng giữ như vậy ở **kênh server đã chọn** của bản đồ đích (`leftRoom` cờ `travel`): client không tự `joinById` kênh khác.

## Phòng trường đấu
- `ArenaRoom extends MapRoom`, `define("arena", ArenaRoom)`, phòng riêng (`setPrivate`) trên sân `ARENA_MAP`. `MapRoom.onCreate` từ chối kind `arena`; `ArenaRoom` gọi thẳng `setup(mapId)`.
- Chỉ tài khoản trong hai bên đã ghép vào được (`checkJoin`), vào bằng mã phòng.
- Dùng lại nguyên vòng lặp, chiến đấu, đổi võ hồn, gục của `MapRoom`. Luật riêng: các pha (`wait` / `ready` / `fight` / `end`), thắng thua, Elo, thưởng, rời sân = cả bên thua.

**Móc PvP trong `MapRoom`**
- `foesOf` (ở `MapRoom`: không ai), `foesNear` / `nearestFoe`, `damageFoe` (nhân `ARENA.dmgMult` rồi `hurtPlayer` với `pvp`). Đánh thường, mọi vùng của `runSkill`, đạn, tiên cơ đều xét thêm đối thủ.
- Message chỉ dùng ngoài trận được đăng ký lại thành từ chối (`BLOCKED`); hành động giao chiến chỉ chạy khi `phase === "fight"`.
- Trong sân `write` chỉ lưu túi đồ, `persistTeam` không ghi, võ hồn gục không hồi, nên bản đồ, vị trí, đội hình, võ hồn ra trận trong DB giữ như trước khi vào sân.

**Hàng chờ** (`arenaQueue.ts`, tài liệu presence `arena:queue` dưới khóa; mục của tiến trình hết lease worker bị dọn)
- Một mục là người chơi đơn hoặc một tổ đội 2 người. `MapRoom` đọc Elo từng tài khoản, khóa tổ đội, thêm bên (`arenaAction`), bỏ bên khi rời phòng / đi cổng.
- Vòng ghép định kỳ chọn hai bên bằng Elo trung bình qua hàm thuần `arenaPairs`, mở phòng `matchMaker.createRoom("arena", {matchId})`, báo phòng bản đồ của từng thành viên.
- Phòng bản đồ `freeze` người chơi như lúc đi cổng và gửi `arena {k: found, roomId}`; client rời bản đồ (`onLeave` lưu vị trí như thường) rồi vào sân. `onAuth` của sân chờ phiên ở bản đồ nhả tài khoản (`waitOldSession`) rồi mới nạp DB.
- Hết trận sân đóng kết nối mã 4005, client vào lại bản đồ theo `/api/me`.

**Người xem**
- `MapRoom.arenaAction` `live` đọc sổ `arenaLive` (`arenaQueue.ts`, presence `arena:live`): mã phòng → pha, giờ hết pha, `holds`, `watching`. `ArenaRoom` ghi lúc mở phòng và mỗi lần đổi pha, xóa lúc hủy.
- Mọi lần ghi / đọc bỏ trận của tiến trình hết lease worker, nên tiến trình bị kill không để lại trận ma; mục quá hạn pha cuối `ARENA.endSecs` + 30 giây cũng bị bỏ, sổ tự lành khi lần xóa / đổi pha lỗi.
- `watch {roomId}` giữ chỗ cho tài khoản `joinSecs` giây trong một lần khóa (`arenaLiveHold`): trận còn đếm ngược / giao đấu, tài khoản chưa xem trận nào, `holds` + `watching` dưới `watchMax`. Sau đó `freeze` và gửi `arena {k: watch, roomId}` như ghép trận.
- Sân: `maxClients` = 4 + `watchMax`. `seatAllowed` nhận thành viên hoặc người có chỗ giữ xem; `onAuth` nhánh xem chỉ kiểm token và `waitOldSession`, không nạp võ hồn / túi (`WatchAuth`).
- `onJoin` nhánh xem giữ tài khoản (`holdAccount`), không tạo `PlayerState` / `PData`, view thấy cả sân (`Interest.spectate`), cập nhật `ArenaState.watchers`.
- `ArenaRoom.onMessage` bọc mọi handler: phiên người xem bị bỏ qua trừ `arena {op: unwatch}` (đóng kết nối mã 4005 như hết trận). `onLeave` của người xem chỉ bỏ khỏi danh sách và nhả tài khoản.
- Tin riêng / tổ đội xuyên phòng gửi theo tài khoản của phiên (`client.auth`), nên người xem vẫn nhận.

**Ghi kết quả**
- Mỗi tài khoản một transaction trong chuỗi lưu của chính người đó (`store.saveArena`): Elo, thành tích, lượt thắng có thưởng ở `boss_claims` loại `dau_hon_truong`, túi có phần thưởng. Không có Elo tổ đội.
- Trận 2v2 đếm đủ bốn cặp chéo trong `arena_pairs` trước lần ghi Elo; nếu một cặp hết lượt thì cả trận là giao hữu.
- Tài khoản test chỉ ghép với tài khoản test (`du-lieu-db.md`).

## Issue liên quan
#278 (người xem Đại Đấu Hồn Trường).
