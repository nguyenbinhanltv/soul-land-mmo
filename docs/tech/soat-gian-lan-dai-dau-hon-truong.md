# Soát chống gian lận Đại Đấu Hồn Trường (#741, vòng 4b)

Soát theo skill `anti-cheat-audit`, đóng vai người chơi sửa được client. Luật chơi ở mục 5.9 (`docs/design/to-doi-pvp-dau-truong.md`), kênh và phòng sân ở `docs/tech/kenh-arena.md`.
Bài kiểm: `client/scripts/arena-audit-test.mjs` (gọi từ `bot-test.mjs`: `npm run bot:local -- --only arenaAudit [--pg]`, nhóm CI 5, cần `GAME_TEST=1`).
Bài có hai mức: `ok` là hành vi đúng đang giữ (sai thì thất bại), `known` là **lỗ hổng đã biết**: mặc định chỉ in cảnh báo để CI không đỏ, `AUDIT_STRICT=1` thì thất bại (dùng khi kiểm bản vá, rồi đổi thành `ok`).
PR này chỉ thêm bài kiểm và báo cáo; không sửa `MapRoom.ts` (M3 #783 đang sửa file đó). Mỗi lỗ hổng có issue sửa riêng: L1 #789, L2 #790, L3 #791.

## Bề mặt đã soát

| Message / luồng | Kết quả |
|---|---|
| `arena {op:"queue"}` (`MapRoom.arenaAction`) | Ổn. Kiểm gần NPC, `arenaBusy`, nhịp `queueCd` theo tài khoản (`arenaQueueSlots`), cờ `d.arenaBusy` chống xếp hai lần; sau khi đọc Elo kiểm lại bản thân, tổ đội và `arenaBusy` (`late`) |
| `arena {op:"cancel"}` | Ổn. Hủy lúc đọc Elo chỉ đánh dấu, cờ hạ khi Promise kết thúc; xếp lại ngay bị từ chối |
| `arena {op:"top"}` | Ổn, có nhịp `topCd` (`arenaTopAt`) |
| `arena {op:"live"}` | Ổn, có nhịp `topCd` (`arenaLiveAt`); bài: 25 tin dồn chỉ trả 1 lần |
| `arena {op:"watch"}` | Ổn sau #789: nhịp `topCd` (`arenaWatchAt`), mã phòng rỗng / quá 64 ký tự bị bỏ trước khi chạm sổ presence (L1 đã sửa) |
| `arena` ở phòng sân (`op: unwatch`, `top`) | Ổn: người xem gửi gì khác cũng bị bỏ (`onMessage` bọc); message ngoài trận nằm trong `BLOCKED` |
| Đầu vào lạ (`op`/`roomId` sai kiểu, mảng, object, 3000 ký tự, `null`, số) | Ổn: `strIn` kẹp, phòng không ngắt, không xếp hàng nhầm. Tin quá 4 KB bị `ws` ngắt kết nối (`maxPayload` 4 KB của Colyseus), đúng thiết kế |
| Rời phòng / đi cổng / gục lúc đọc Elo (`arenaReadCancel`, `freeze`) | Ổn: không thành mục ma trong hàng chờ, vào lại xếp hàng được (không kẹt `arenaBusy`), gục thì `late` từ chối |
| Hàng chờ nhiều tiến trình (`arenaQueue.ts`: `claimRemote`, lease worker, `reconcile`) | Đã đọc, ổn: giành cặp trong khóa presence, mục của tiến trình chết bị dọn, đối soát sau 10 giây |
| Elo ghi bằng độ lệch (`saveArena`), không ghi đè | Đã đọc, ổn: hai tiến trình không đè nhau |
| `015_arena_pairs.sql` | Ổn: khóa `(day, a, b)`, `CHECK (a < b)`, khóa ngoại, RLS bật, `ON DELETE CASCADE`; `arenaPairAdd` sắp mã nhỏ trước, `MemoryStore` từ chối cặp `a === b` |

## Phát hiện

### L1 (Vừa, #789, ĐÃ SỬA): `arena {op:"watch"}` không có nhịp
`MapRoom.ts:3261` (`arenaWatch`). Khác `top` (`:3293`, `arenaTopAt`) và `live` (`:3245`, `arenaLiveAt`), `watch` không có mốc thời gian. Mỗi tin đứng gần NPC đều đi tới `arenaLiveHold` -> `liveEdit` -> `presenceBackend.withLock` trên khóa `arena:live` dùng chung mọi tiến trình, kể cả khi `roomId` không có thật.
- **Tái hiện:** bài `arenaAudit`, đứng cạnh NPC Đại Đấu Hồn Trường gửi 25 tin `arena {op:"watch", roomId:"x"}` liên tiếp: server xử lý đủ 25 lượt (25 dòng "Trận đấu không còn diễn ra"), trong khi 25 tin `live` chỉ trả 1 lần.
- **Tác động:** tải khóa Redis và tranh chấp với `arenaLivePhase` / `arenaLiveOpen` của các trận đang chạy (`arenaLivePhase` thử 3 lần rồi bỏ: pha trong sổ xem trận có thể trễ). Không đổi Elo / tiền.
- **Sửa đề xuất:** thêm `arenaWatchAt` vào `PData`, kiểm `Date.now() - d.arenaWatchAt < ARENA.topCd * 1000` như `arenaLiveList`; kiểm `roomId` rỗng / quá dài trước khi gọi sổ.

### L2 (Vừa, #790): thắng "đối thủ không vào sân" vẫn tính Elo, thưởng và lượt cặp
`ArenaRoom.ts:328` (`finish`), nhánh `reason === "noshow"` từ `tick` (`:290`). Bên không vào sân sau `ARENA.joinSecs` giây thua; trận vẫn đếm vào `arena_pairs` (`arenaPairAdd`, `:336`) và bên còn lại nhận đủ Elo, thành tích và thưởng thắng (miễn là trận còn trong hạn `ARENA.pairDaily` của cặp), không phải đánh ai.
- **Tái hiện:** bài `arenaAudit`: hai tài khoản mới xếp hàng, được ghép, A vào sân, B không vào; hết giờ chờ A thắng `noshow`, Elo 1000 -> 1016 và nhận thưởng.
- **Tác động:** tài khoản phụ xếp hàng rồi bỏ đi là cách nuôi Elo / thưởng gần như không tốn công; ngoài ra một người có thể cố tình ghép rồi bỏ để đốt lượt `arena_pairs` của đối thủ trong ngày (bên thắng hưởng, cặp hết lượt).
- **Sửa đề xuất (chủ repo chọn):** (1) `noshow` và `leave` trước giao đấu là giao hữu (không đổi Elo / thưởng, vẫn xử thua), hoặc (2) chỉ tính Elo khi đã có đòn giao đấu hợp lệ (pha `fight` bắt đầu). Kèm đổi bài `known` thành `ok`.

### L3 (Vừa, thiết kế, #791): chưa có trần Elo / thưởng nuôi qua nhiều tài khoản
Chống dàn xếp hiện chỉ theo **cặp** (`ARENA.pairDaily` trận / cặp / ngày, `arena_pairs`) và lượt thưởng theo tài khoản (`ARENA.dailyWins`). Nhiều tài khoản cùng một người tạo nhiều cặp, mỗi cặp một hạn riêng; không có trần Elo tăng theo tài khoản mỗi ngày và không liên kết tài khoản cùng người (không có dữ liệu thiết bị). Mức độ phụ thuộc cách mở đăng ký (tài khoản có miễn phí và không xác minh không).
- **Sửa đề xuất:** trần Elo tăng mỗi tài khoản mỗi ngày (hằng ở `shared/data.ts`, ghi theo `day` như `arena_pairs`) và/hoặc trần số đối thủ khác nhau mỗi ngày; tính cả tổng Elo thu được từ đối thủ Elo thấp hơn nhiều. Cần chủ repo quyết (mục 5.9).

## Giả thuyết đã kiểm, không có lỗ hổng
- **(c) lách `arenaBusy` bằng rời phòng / gục giữa lúc đọc Elo:** rời phòng không để mục ma (B xếp hàng sau đó không bị ghép với A), tài khoản quay lại xếp hàng được; gục lúc đọc thì `late` từ chối. Đổi kênh đi qua `freeze` -> `arenaReadCancel` như đi cổng (bài `arena` của #225/#227 đã phủ hủy / đi cổng; đổi kênh thật cần `CHANNEL_MAX=2`, chưa phủ riêng).
- **(a) hiệu lực `arena_pairs` theo ngày và trần:** bài `arena` (9.7) đã kiểm trận thứ `ARENA.pairDaily + 1` là giao hữu và sang ngày mới (hook `day`) tính lại; bài này thêm kiểm noshow (L2). Chưa đua hai trận cùng cặp song song vì một tài khoản chỉ ở một hàng chờ / một phòng sân (`arenaQueued`, `arenaGone`).

## Chưa kiểm chứng
- Đua `arenaLiveHold` / `arenaLivePhase` dưới tải thật nhiều tiến trình (`--procs 2 --pg`) để đo mức ảnh hưởng của L1: cần bài riêng, chưa làm.
