# Giao thức server: HTTP và message

## HTTP (`server/src/index.ts`)
- `GET /health` (readiness), `GET /live` (liveness, luôn 200 khi tiến trình còn chạy).
- `/api/config`, `/api/login` (tên + mật khẩu; tự tạo tài khoản khi tên chưa có), `/api/login/google`, `/api/login/google/create`, `/api/link/google`, `/api/me`, `/api/channel` (chọn kênh khi vào game), `/api/looks`, `/api/awaken`.
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

## Quy tắc xử lý mỗi message
- Mỗi message: ép kiểu và kẹp giá trị bằng kiểm `typeof` (`numIn` / `intIn` / `strIn` trong `MapRoom.ts`), không `Number()` / `String()` / so sánh trên giá trị thô (đổi kiểu một object tùy ý có thể ném lỗi).
- Kiểm id có thật và thuộc chính người gửi; kiểm trạng thái (gục, hấp thụ, đi cổng, giao chiến, vùng an toàn); hồi chiêu do server đếm.
- Từ chối thì gửi lý do bằng tin `log` tiếng Việt, không ném lỗi.
- Tin xin lại dữ liệu riêng (`bag`, `vohons`, `quest {op: "get"}`, `stats`, `fog`) theo nhịp `ASK_CD`: xin dồn thì gộp thành một lần gửi khi hết nhịp.
- Tin "ghi túi" (`sortbag`, `equip*`, `unequip*`, `discard`, `lock`, `use`, `open`, `pickup`, `enhance*`, `absorb`, `autosell`…; đăng ký qua `onBagMsg`) theo bộ đếm token từng kết nối: tối đa `BAG_MSG_BURST` tin dồn, hồi `BAG_MSG_RATE` tin / giây (`takeToken`, `ratelimit.ts`); hết token thì bỏ tin, không ngắt kết nối. Không đặt `Room.maxMessagesPerSecond` toàn phòng: `input` gửi mỗi khi hướng đổi (giữ chuột kéo qua đường A* có thể mỗi khung hình, tới tần số màn hình 144 Hz+), trần thấp sẽ ngắt người chơi thật, trần cao thì không chặn được gì; khuếch đại băng thông nằm ở nhóm tin ghi túi. Bài bot: nhóm `cheat` (dồn 200 `sortbag`).
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
