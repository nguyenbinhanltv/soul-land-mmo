# Giao thức server: HTTP và message

## HTTP (`server/src/index.ts`)
- `GET /health` (readiness), `GET /live` (liveness, luôn 200 khi tiến trình còn chạy).
- `/api/config`, `/api/login` (tên + mật khẩu; tự tạo tài khoản khi tên chưa có), `/api/login/google`, `/api/login/google/create`, `/api/link/google`, `/api/me`, `/api/channel` (chọn kênh khi vào game), `/api/looks`, `/api/awaken`, `/api/logout` (đăng xuất: xóa đúng phiên của token đó ở server, luôn 200; #999).
- Client không gọi được `create` của matchmaker: phòng bản đồ mới chỉ mở qua `joinOrCreate` khi mọi kênh đầy, sân đấu chỉ do server mở.

## Message từ client
Đăng ký trong `MapRoom.onCreate`. Message chưa đăng ký làm Colyseus ngắt client, nên **bỏ hoặc thêm message thì sửa client và bot cùng lúc**, và cập nhật bảng này.

| Nhóm | Message |
|---|---|
| Di chuyển, đánh | `input {x, y, s, w?}`, `attack`, `skill {i}`, `boneskill {i}`, `chanthan`, `switch {slot}`, `fusion {op}` (Võ Hồn Dung Hợp Kỹ: `start`, `join`; mục 5.9) |
| Võ hồn | `vohons`, `team {slots}`, `loadout {rowId, skills}`, `unlock {vohon}`, `starup {vohon}`, `stats {rowId?}` (chỉ số tổng hợp cho bảng Nhân vật, trả tin riêng `stats`) |
| Túi đồ | `bag`, `use {id, vohonId?}`, `pickup`, `discard {id}`, `open {id}`, `absorb {itemId, vohonId}`, `sortbag`, `lock {id}` (khoá / mở khoá), `autosell {cfg}` (bộ lọc tự bán `SellSettings`) |
| Hồn cốt, hồn hạch, trang bị | `equip` / `unequip`, `equipcore` / `unequipcore`, `equipgear {id}` / `unequipgear {slot}` (trang bị hồn sư, mục 5.15), `equipenh {id, charm}` / `equipenhpreview {id}` (cường hóa ở Thợ rèn), `equipsynth {main, sacrifice}` (hợp thành 3 → 1), `equipsalvage {ids}` (phân giải), `enhance {targetId, materialIds}`, `enhancecore {targetId, materialIds}`, `coreset {id, set, npc}` (Thợ rèn đổi bộ hồn hạch) |
| NPC | `talk {npc}`, `buy {code, qty, npc?}`, `sell {id, qty?, npc?}`, `expand {npc?}`, `buyback {key, npc?}` (`npc`: thương nhân đang mở hộp thoại, thiếu thì thương nhân gần nhất), `quest {op, chain?}` (`chain`: bài khảo hạch hằng ngày), `tong {op, tong?}` (gia nhập / đổi / rời tông môn, mục 5.14), `shardbuy {vohon, qty, npc}` / `shardinfo` (Thương hội đổi mảnh võ hồn, trả `shardinfo {n, daily}`, mục 5.7), `looks {looks, npc?}` (đổi ngoại hình ở thợ may; trả `looksinfo {n, err?}`, mục 5.11) |
| Bản đồ, kênh | `travel {portal}`, `wp {op, key?}` (truyền tống trận: `list`, `go`, `cancel`), `channels`, `channel {ch}`, `boss` (xin lại tin boss lúc vào phòng), `fog` (xin lại bitset sương mù, mục 5.17), `rally` (đánh dấu "Tập trung ở đây" cho tổ đội, mục 5.17) |
| Tự săn | `auto {op, cfg?}` (`on`, `off`, `set` cài đặt `AutoSettings`, `get`; mục 5.13), `offline` (xin lại kết quả ủy thác offline) |
| Xã hội | `chat {text, ch?, to?}` (`ch`: thiếu = bản đồ, `party`, `whisper` với `to` = tên, `world`, `tong`; mục 4 "Kênh chat"), `party {op, name?, sid?}`, `friend {op, name?}` (`list`, `add`, `remove`, `block`, `unblock`; mục 5.9 "Bạn bè"), `arena {op, roomId?}` (`queue`, `cancel`, `top`, `live`, `watch` với `roomId`; trong sân người xem gửi `unwatch`), `resonance` |
| Quản trị, kiểm thử | `gm {cmd}` (lệnh `/gm …`, chỉ tài khoản trong `ADMIN_ACCOUNTS`, xem `du-lieu-db.md`), `test {op}` (chỉ khi server bật `GAME_TEST=1`) |

## Danh mục tin client → server (đăng ký chuỗi cố định)
Mọi tin đăng ký trong `MapRoom.onCreate` (`onMessage` / `onLimitedMsg(nhóm, tên)` / `onBagMsg`); `ArenaRoom` chặn phần lớn (`BLOCKED`) và chỉ nhận thêm `quest {op:"get"}`, `arena {op:"top"|"unwatch"}`. **Client gửi từ `client/src/scenes/GameScene.ts`** (trừ ghi chú). Cột "Nhóm" là nhóm giới hạn `MSG_GROUP` (`-` = không giới hạn theo nhóm). Hàm xử lý nằm trong `MapRoom.ts` trừ khi ghi file khác (`rooms/<file>.ts`, #702). `tools/docs-check.mjs` (kiểm h) so danh mục này với code: thêm tin mới thì thêm hàng ở đây.

| Tin | Khi nào client gửi | Nhóm | Xử lý |
|---|---|---|---|
| `input` | mỗi nhịp có hướng đi / nhả phím (kèm `s` số thứ tự để dự đoán) | - | `applyInput` |
| `attack`, `skill`, `chanthan`, `boneskill` | phím đánh thường, hồn kỹ, Chân Thân (R), kỹ năng hồn cốt | - | `manualAttack`, `skill`, `chanThan`, `boneSkill` |
| `target` | khoá / bỏ khoá mục tiêu (#750) | - | `lock.ts` `targetMsg` |
| `fusion` | mời / hưởng ứng Dung Hợp Kỹ | - | `fusionAction` |
| `auto`, `offline` | mở bảng Tự động, bật / tắt / đổi cấu hình tự săn; xin báo cáo ủy thác | - / read | `autoHunt.ts` `autoAction`, `sendOffline` |
| `vohons`, `team`, `switch`, `loadout` | mở bảng võ hồn; đổi đội hình, võ hồn ra trận, hồn kỹ | read / social | `team.ts`, `setLoadout` |
| `stats`, `fog`, `boss`, `talk`, `resonance`, `shardinfo` | xin dữ liệu riêng (bảng Nhân vật, sương mù, boss lúc vào phòng, NPC, cộng minh, mảnh đã đổi) | read | `sendStats`, `sendFog`, `sendBossJoin`, `talkNpc`, `team.ts` `sendRes` / `resonanceTop`, `shop.ts` `sendShardInfo` |
| `bag` | xin cả túi (theo `ASK_CD`) | - | `bag.ts` `sendBag` |
| `pickup`, `discard`, `sortbag`, `lock`, `autosell`, `use`, `open`, `unlock`, `starup` | thao tác túi, mở khóa / thăng sao võ hồn | bag | `pickup`, `discardItem`, `sortBag`, `lockItem`, `setAutoSell`, `useItem`, `openChest`, `unlockVohon`, `starUp` |
| `absorb` | hấp thụ hồn hoàn | bag | `absorb.ts` `tryAbsorb` |
| `equip`, `unequip`, `equipcore`, `unequipcore`, `enhance`, `enhancecore`, `coreset` | hồn cốt, hồn hạch | bag | `bones.ts` |
| `equipgear`, `unequipgear`, `equipenh`, `equipenhpreview`, `equipsynth`, `equipsalvage`, `equipluck`, `equipluckpreview` | trang bị hồn sư, Thợ rèn | bag | `equip.ts` |
| `buy`, `sell`, `shardbuy`, `buyback`, `expand`, `looks` | cửa hàng, mảnh võ hồn, mua lại, mở rộng túi, đổi ngoại hình ở thợ may | trade | `shop.ts`, `changeLooks` |
| `travel`, `wp`, `channels`, `channel` | đi cổng, điểm dịch chuyển (`op`), xin / đổi kênh | social | `travel.ts`, `join.ts` |
| `quest`, `tong`, `arena` | nhiệm vụ / khảo hạch, tông môn, Đại Đấu Hồn Trường (xem / hàng chờ / `unwatch`) | social | `quest.ts`, `tong.ts`, `arena.ts` |
| `party`, `rally`, `chat`, `friend` | tổ đội, dấu Tập trung, chat, bạn bè | social / - | `social.ts`, `rallyAction` |
| `gm`, `test` | lệnh `/gm`, hook kiểm thử | - | `gm.ts` |

## Danh mục tin server → client (chuỗi cố định)
Client nghe ở `GameScene.ts` (`room.onMessage`, buffer lúc vào ở `roomBuffer.ts`). Cột "Đối tượng": **riêng** = một client (`clients.getById(id)?.send`), **phòng** = `broadcast` cả phòng, **gần** = `broadcast` nhưng lọc theo `SYNC_VIEW.fx` (xem `dong-bo-state.md`). Tin lẻ theo `k` / `op` là một tin nhiều loại.

| Tin | Đối tượng | Khi nào gửi | File gửi |
|---|---|---|---|
| `log`, `chat` | riêng / phòng | lý do từ chối, thông báo; chat các kênh, tin hệ thống `sys: true` | `MapRoom.ts`, `social.ts`, `join.ts`, `absorb.ts`, `ArenaRoom.ts` |
| `fx`, `dmg` | gần | hiệu ứng hình ảnh (`k`) và số sát thương / hồi máu, không ảnh hưởng luật | `MapRoom.ts`, `absorb.ts`, `eggs.ts`, `team.ts`, `travel.ts` |
| `elite`, `boss` | phòng / riêng | tinh anh xuất hiện / hạ; thú vương, boss thế giới (đếm ngược, nổi giận, điểm yếu, người vào giữa chừng) | `MapRoom.ts` |
| `bag`, `bagd` | riêng | cả túi khi xin; thay đổi túi (`bagSync.ts`) | `bag.ts` |
| `gear` | riêng | các món đang mặc + chỉ số tổng | `equip.ts` |
| `equipenhp`, `equipenhd`, `equipluckp`, `equipluckd`, `equipsynd`, `equipsalvd` | riêng | xem trước / kết quả cường hóa, khắc may mắn, hợp thành, phân giải trang bị | `equip.ts` |
| `enhanced`, `enhancedcore` | riêng | kết quả cường hóa hồn cốt / hồn hạch | `bones.ts` |
| `autosold` | riêng | tổng kết bán tự động | `shop.ts` |
| `shardinfo`, `looksinfo` | riêng | mảnh võ hồn đã đổi hôm nay; số lần đổi ngoại hình / lỗi | `shop.ts`, `MapRoom.ts` |
| `vohons`, `squad`, `ko` | riêng | võ hồn sở hữu + đội hình; trạng thái đội; võ hồn gục và võ hồn kế | `team.ts`, `MapRoom.ts` |
| `stats` | riêng | chỉ số tổng hợp bảng Nhân vật | `MapRoom.ts` |
| `resonance`, `resonanceTop` | riêng | tiến độ cộng minh; bảng xếp hạng | `team.ts` |
| `absorbing` | riêng | bắt đầu / hủy / kết quả hấp thụ hồn hoàn | `absorb.ts` |
| `auto`, `autost`, `offline` | riêng | bảng Tự động; việc tự săn đang làm + thống kê; báo cáo ủy thác khi vào | `MapRoom.ts`, `autoStatus.ts` |
| `fusion` | riêng | `k`: `ask`, `wait`, `cancel`, `done` của Dung Hợp Kỹ | `MapRoom.ts` |
| `lock` | riêng | mục tiêu khoá bị gỡ / từ chối; `why` (`LockWhy`: `gone`, `far`, `safe`, `dead`, `hunt`, `egg`) để client báo lý do; bấm chọn bị từ chối mà cùng lý do lặp trong `DENY_GAP_MS` thì tin `lock` không kèm `why` (lúc server tự gỡ khoá thì luôn kèm) | `lock.ts` |
| `quest`, `daily`, `npc` | riêng | nhiệm vụ chuỗi, khảo hạch hằng ngày, mở hộp thoại NPC | `MapRoom.ts`, `quest.ts` |
| `tong`, `tongBoard` | riêng | thông tin tông môn; bảng điểm tuần | `MapRoom.ts`, `tong.ts` |
| `party`, `friends`, `rally` | riêng | tổ đội, bạn bè / chặn, dấu Tập trung | `MapRoom.ts` |
| `arena`, `arenaTop` | phòng / riêng | trận (`k`: `ready`, `fight`, kết quả `end` kèm `reason` + `why` tiếng Việt, hàng chờ; thao tác bị từ chối trong sân báo lý do bằng tin `log`, đánh thường / tin bị chặn (`BLOCKED`) chỉ báo lại sau `DENY_GAP_MS` cho mỗi loại thao tác của từng người); bảng xếp hạng | `arena.ts`, `ArenaRoom.ts` |
| `channels`, `travel`, `portal`, `wp`, `world`, `recall` | riêng | danh sách kênh; lệnh đổi phòng; cổng đang đứng gần; điểm dịch chuyển; bản đồ thế giới; đếm ngược Hồi thành | `join.ts`, `travel.ts`, `MapRoom.ts` |
| `vit` | riêng | kinh nghiệm, hồn lực, hồi chiêu của chính chủ (#949): gửi khi đổi, hồn lực hồi dần gộp theo `SYNC_VIEW.vitGap` giây, hồi chiêu client tự đếm lùi (xem `dong-bo-state.md`) | `vitals.ts` |
| `mini`, `fog`, `fogd` | riêng | radar mỗi `SYNC_VIEW.mini` giây; bitset sương mù; ô mới khám phá | `MapRoom.ts` |
| `test` | riêng | trả lời hook kiểm thử (chỉ khi `GAME_TEST=1`) | `gm.ts`, `ArenaRoom.ts` |

## Quy tắc xử lý mỗi message
- Mỗi message: ép kiểu và kẹp giá trị bằng kiểm `typeof` (`numIn` / `intIn` / `strIn` trong `MapRoom.ts`), không `Number()` / `String()` / so sánh trên giá trị thô (đổi kiểu một object tùy ý có thể ném lỗi).
- Kiểm id có thật và thuộc chính người gửi; kiểm trạng thái (gục, hấp thụ, đi cổng, giao chiến, vùng an toàn); hồi chiêu do server đếm.
- Từ chối thì gửi lý do bằng tin `log` tiếng Việt, không ném lỗi.
- Tin `chat` server → client: `{name, text, ch?, to?, sys?}`. `sys: true` CHỈ có ở tin hệ thống thật do server phát (thông báo tới / rời bản đồ, hấp thụ, mở rương, kết quả trận, dấu Tập trung của tổ đội…); tin người chơi không bao giờ mang cờ này. Client chỉ tô xanh / định dạng tin hệ thống khi `sys === true`, không dựa vào `name` (tài khoản cũ trùng tên cấm "Hệ thống" vẫn hiện như người chơi thường; #827). Thêm chỗ phát tin hệ thống mới thì phải kèm `sys: true`.
- Tin xin lại dữ liệu riêng (`bag`, `vohons`, `quest {op: "get"}`, `stats`, `fog`) theo nhịp `ASK_CD`: xin dồn thì gộp thành một lần gửi khi hết nhịp.
- Giới hạn tin theo bộ đếm token từng kết nối (`takeToken`, `ratelimit.ts`; số ở `shared/data.ts`), hết token thì bỏ tin, không ngắt. Nhóm `MSG_GROUP`: `bag` (ghi túi: `sortbag`, `equip*`, `unequip*`, `discard`, `lock`, `use`, `open`, `pickup`, `enhance*`, `absorb`, `autosell`…; `onBagMsg`, số `BAG_MSG_BURST` / `BAG_MSG_RATE`), `trade` (`buy`, `sell`, `shardbuy`, `looks`, `buyback`, `expand`: mỗi tin ghi DB / Redis), `social` (`tong`, `party`, `arena`, `rally`, `channel(s)`, `travel`, `wp`, `team`, `loadout`, `switch`, `quest`), `read` (`talk`, `shardinfo`, `offline`, `vohons`, `fog`, `stats`, `boss`, `resonance`); đăng ký qua `onLimitedMsg(nhóm, tin, cb)` ở `MapRoom`. `chat`, `friend`, `input`, `attack`, `skill`, `target`… không thuộc nhóm nào (có bộ đếm riêng hoặc là tin nhịp). Colyseus 0.16 không có `Room.maxMessagesPerSecond`, nên `MapRoom.onMessage` (ArenaRoom đi qua cùng lớp) đếm TRẦN TUYỆT ĐỐI `MSG_HARD` cho mọi tin của kết nối (trừ `test`): `burst` 240, `rate` 120 / giây chừa chỗ cho `input` 20–60 Hz cùng `attack` / `target` giữ phím. Vượt thì bỏ tin, TRỪ `input` (client không gửi lại tin bị bỏ; kéo chuột ở màn 144–240 Hz có thể vượt `rate`, bỏ nhầm tin dừng thì nhân vật đi mãi) vẫn được xử lý nhưng tính là tin vượt; vượt quá `maxOver` tin trong một giây thì ngắt với mã `MSG_FLOOD_CODE` (4008), dù gửi đều tay hay dồn một gói. Cỡ tin: `maxPayload` = `MSG_MAX_PAYLOAD` (4 KiB, đúng mặc định của `@colyseus/ws-transport` 0.16.5, đặt tường minh ở `index.ts`); tin quá cỡ thì `ws` đóng kết nối. Bài bot: nhóm `cheat` (dồn 200 `sortbag`, `sell`, `shardinfo`; dồn `input` vượt trần, cả dồn một gói lẫn gửi đều tay theo loạt, thì ngắt); khi `GAME_TEST=1` giới hạn mặc định tắt (`msgLimit`) (bot dọn túi hàng trăm ô) và bài này bật bằng hook `test {op: "baglimit", on: 1}`.
- Trong lúc phần thưởng boss chờ DB xác nhận lượt (`claimBusy`) thì không bán / bỏ / hấp thụ / nộp đồ.

## Lỗi bất ngờ
- Trong handler, hẹn giờ, tick: `MapRoom.onUncaughtException` chỉ ghi log (giới hạn tần suất), phòng chạy tiếp.
- Ngoài mọi phòng (`uncaughtException` / `unhandledRejection` của tiến trình, `index.ts`): không chạy tiếp. Ghi log kèm stack, lưu người chơi đang online như khi tắt server (rời mọi phòng, chuỗi lưu từng người, hạn `SHUTDOWN_SAVE_MS`), đóng PostgreSQL (`SHUTDOWN_DB_MS`) rồi thoát mã 1 để trình quản lý tiến trình khởi động lại.
- SIGINT / SIGTERM cũng lưu như vậy rồi thoát mã 0 (chưa lưu xong thì mã 1).

## Vào phòng (`static onAuth`)
Matchmake (`joinOrCreate`, `joinById`) giữ chỗ và mở kênh ở bước HTTP, trước khi mở WebSocket, nên `static onAuth` của `MapRoom` kiểm trước:
- token hợp lệ;
- tài khoản giữ chưa quá `SEAT_PENDING_MAX` chỗ chưa dùng;
- bản đồ xin vào có thật và đúng bản đồ đang lưu;
- đã có hồn sư (sân đấu: chỉ thành viên trận, `seatAllowed`).
`onAuth` của phòng kiểm lại và nạp DB lúc mở WebSocket.

## Bảo mật
- Giới hạn đăng nhập sai, số tài khoản mới mỗi IP, chat (riêng từng kênh) và lời mời tổ đội ở `server/src/ratelimit.ts` (RAM). `/api/login` tự tạo tài khoản nhưng chỉ đếm lần thật sự tạo; hết lượt thì 429, tài khoản cũ vẫn vào được. Ngưỡng là hằng `SIGNUP_IP_*`, nới khi `GAME_TEST=1`.
- Khoá IP chuẩn hoá bằng `ipKey` (IPv6 gom theo /64, `::ffff:a.b.c.d` về IPv4), dùng chung cho đăng nhập sai và tạo tài khoản.
- REST có token (`/api/me`, `/api/channel`, `/api/looks`, `/api/awaken`, `/api/logout`) có token bucket theo IP `apiCheck` (hằng `API_BURST`, `API_REFILL_MS`); mọi lần `/api/login` qua `loginBegin` (kể cả đúng, vì chạy scrypt) tốn một lượt của bucket (tên, IP) `loginRate` (`LOGIN_OK_*`); mật khẩu tối đa `PASSWORD_MAX_LEN`. Hết lượt thì 429 + `Retry-After`; `GAME_TEST=1` nhân ngưỡng như tạo tài khoản.
- Deploy sau proxy thì đặt `TRUST_PROXY=1` (thiếu thì mọi người chung IP của proxy, chạm giới hạn tạo tài khoản rất nhanh).
- Kiểm thử: `npm run test:ratelimit --prefix server`.

## Đăng nhập Google
- ID token của Google Identity Services được `google-auth-library` xác minh ở server (chữ ký, `iss`, `aud` = `GOOGLE_CLIENT_ID`, `exp`, `email_verified`). Định danh là `sub`, lưu ở bảng `account_identities` (`UNIQUE(provider, subject)` và `UNIQUE(account_id, provider)`: một Google một tài khoản, một tài khoản tối đa một Google; RLS bật, không policy).
- Không lưu email / tên / token Google và không ghi chúng vào log.
- Vé chọn tên ký HMAC (`GOOGLE_TICKET_SECRET`; thiếu thì ngẫu nhiên mỗi lần khởi động, nhiều tiến trình phải đặt chung), chỉ chứa `sub` và hạn 10 phút.
- Ba route Google dùng chung giới hạn theo IP `ssoCheck` (`ratelimit.ts`); tạo tài khoản còn tính vào giới hạn tạo tài khoản mới.
- `GOOGLE_CLIENT_ID` là cấu hình công khai, trống thì tắt đăng nhập Google. Bộ kiểm giả (credential `test:<sub>[:tên]`) chỉ bật khi `GAME_TEST=1` và `NODE_ENV` khác `production`.
- Kiểm thử: `npm run test:google --prefix server`, `npm run bot:local -- --only google [--pg]`. Thiết lập OAuth client: `docs/ops/sso-google.md`.

## Issue liên quan
#561 (Redis mất giữa chừng), #612 (đăng nhập Google).
