---
name: server-feature
description: Checklist server-authoritative khi thêm hoặc sửa luật chơi, message từ client, trạng thái đồng bộ, lưu DB hay API ở server (server/src/rooms/MapRoom.ts, ArenaRoom.ts, arenaQueue.ts, schema.ts, map.ts, party.ts, schedule.ts, index.ts). Dùng khi làm bất cứ tính năng gameplay nào: chiến đấu, hồn kỹ, hấp thụ, rơi đồ, túi đồ, võ hồn, đội hình, boss, tổ đội, NPC, Đại Đấu Hồn Trường.
---

# Tính năng phía server

Nguồn luật: `CLAUDE.md` và `GAME_DESIGN.md` mục 6 (Kiến trúc, bắt buộc giữ). Server quyết định mọi thứ, client chỉ gửi ý định.

## Logic đặt ở đâu
- **Luật chơi:** `server/src/rooms/MapRoom.ts`, lớp `MapRoom`; vòng lặp `tick(dt)` chạy `TICK_RATE` lần mỗi giây. Một loại phòng cho mọi bản đồ (`define("map", MapRoom).filterBy(["mapId"])` ở `index.ts`), mỗi phòng là một kênh; bản đồ nạp bằng `loadMap(mapId)` (`server/src/map.ts`) vào `this.map` (`hits`, `zones`, `spawn`, `inSafe`, `portalAt`, `npcs`, `lair`…). Khác biệt giữa các bản đồ nằm trong dữ liệu (`MAPS`, file Tiled), không tách lớp phòng con.
- **Ngoại lệ duy nhất:** `ArenaRoom.ts` (`ArenaRoom extends MapRoom`, `define("arena", ArenaRoom)`): pha trận, thắng thua, Elo, thưởng. Luật chiến đấu vẫn của `MapRoom`, không chép sang. PvP đi qua móc `foesOf` (MapRoom luôn `[]`) / `foesNear` / `nearestFoe` / `damageFoe`: thêm vùng hay hiệu ứng hồn kỹ mới thì nghĩ luôn nó có trúng đối thủ không. Message không dùng trong trận thêm vào `BLOCKED`; hành động giao chiến mới ghi đè trong `ArenaRoom` để chỉ chạy khi `phase === "fight"`. Hàng chờ ở `arenaQueue.ts`; điều kiện không cho xếp hàng ở `MapRoom.arenaBusy`.
- **API REST** (`index.ts`): `/api/login`, `/api/me`, `/api/looks` (`chooseLooks`), `/api/awaken` (`awakenAccount`), `/api/channel` (`pickChannel`). Server tự tung kết quả, client không chọn.
- **Dữ liệu riêng của người chơi** chỉ server biết: `pdata: Map<sessionId, PData>` (túi đồ, võ hồn sở hữu `owned`, sinh lực võ hồn ngoài sân `benchHp`, võ hồn gục `down`, năng lượng `energy`, khiên, hiệu ứng `buffs`, trạng thái `st`, hấp thụ dở, Chân Thân `ava` / `avaCd`, nhiệm vụ `quest`, cộng minh `res`…). Hồn thú: `bdata` (`BData`: trạng thái, chiêu, dữ liệu tinh anh / thú vương `elite`).
- **Trạng thái sống lâu hơn một phòng** (Colyseus tự hủy phòng trống) giữ ở mức tiến trình theo `mapId` hoặc tài khoản, không trong field của phòng: suất thú vương `kingSeats`, báo trước `kingWarns`, khóa đổi kênh `leftRoom`, danh sách mua lại `buybacks`, tổ đội (`party.ts`), hàng chờ đấu trường.
- Số cân bằng lấy từ `shared/data.ts` (skill `balance-data`); không viết số mới thẳng vào room.

## Bộ máy chung (dùng lại, đừng viết song song)
- **Sát thương / trạng thái lên hồn thú** chỉ qua `damageBeast` / `applyStatus` (tự bỏ qua người đang đi cổng hoặc đứng trong vùng an toàn; xử lý điểm yếu hệ, khiên, lặn của boss thế giới, miễn khống chế). **Lên hồn sư** chỉ qua `hurtPlayer` (trả về có trúng không; `{ dot }`, `{ pvp }`) / `applyPStatus` (`PLAYER_STATUS`); khống chế trên hồn sư đọc bằng `pctl(d)`.
- **Hồn kỹ, tiên cơ, Chân Thân, kỹ năng hồn cốt** chạy qua `runSkill(id, SkillDef, power, bpow, col, hit)`; hồn kỹ mới chỉ cần dữ liệu, vùng / hiệu ứng mới thì thêm trường `SkillDef` và xử lý trong `runSkill`. Hiệu ứng lên bản thân qua `selfEffect`; lan tổ đội qua `partyShare` (× `PARTY_BUFF_MULT`, bỏ `PARTY_BUFF_SKIP`), hồi / khiên cho người khác gọi `supportCredit` để tính đóng góp boss. Phục Chế đọc `PData.lastSkill`. Nhát trễ dùng `later(giây, fn)`, không `setTimeout`.
- **Chiêu báo trước của hồn thú:** `beginCast` → `tickCast` (ngắt bằng `cancelCast`) → `fireCast` (tính trúng bằng `teleHits` theo vị trí thật lúc tung).
- **Tinh anh / thú vương / boss thế giới:** máu theo người tham gia `eliteJoin`, luật thời gian `tickElite` / `tickKing` / `tickWorld`, đóng góp đọc qua `contribOf` / `contributors` / `topContrib` (không đọc thẳng `dmgBy`), thưởng `killKing` → `grantChest` (lượt qua `store.claimBoss` trong chuỗi lưu). Lịch ở `server/src/schedule.ts` (`startSchedule`, presence kênh "boss"); đọc giờ qua `bossNow()` / `bossOffset()`, ngày nhận thưởng qua `this.today()`, không `Date.now()` thẳng.
- **Đồ rơi:** mọi món qua `newDrop` (chụp tổ đội được ưu tiên), quyền nhặt `canLoot`; thêm đồ vào túi qua `addItem` (gộp, giới hạn ô theo `PData.bagSlots`).
- **Kinh nghiệm:** `killBeast` → `partyNear` + `partyXpShare` → `rewardKill` (giảm chênh cấp, chia 40/20).
- **Nhiệm vụ:** hành động mới muốn tính cho nhiệm vụ thì thêm `QuestGoalKind` và một lần gọi `questEvent(id, {k, …})` đúng chỗ luật chơi xảy ra.
- **Cộng minh:** dữ liệu ảnh hưởng trụ cột (cấp, số hồn hoàn, đồ đang gắn) đổi thì gọi `resCheck`.
- **Chỉ số:** tính lại bằng `recalc` / `maxHpOf` (`calcStats` với hồn cốt, hồn hạch, cộng minh, tiên thảo, sao).

## Checklist cho mỗi message từ client
Đăng ký trong `onCreate()` bằng `this.onMessage(...)`; danh sách hiện có ở `GAME_DESIGN.md` mục 6. Message chưa đăng ký làm Colyseus ngắt client: bỏ message cũ thì sửa client và bot cùng lúc.
1. **Ép kiểu và kẹp giá trị**: `Number(m?.x) || 0`, `String(m?.text ?? "")` (mẫu `input`, `chat`).
2. **Kiểm tra id có thật và thuộc chính người gửi** (`itemId`, `vohonId`, `rowId` so với `pdata.get(id)`).
3. **Kiểm tra trạng thái**: người chơi tồn tại, không gục, không hấp thụ, không `d.travelling` (đang chuyển bản đồ: mọi hành động mới phải bị chặn, kể cả hiệu ứng trễ), ngoài vùng an toàn nếu là giao chiến (`this.map.inSafe`), ngoài giao chiến nếu là việc sắp xếp (luật chung như `boneLock`), NPC trong tầm nếu cần (`npcNear`), hết hồi chiêu, đủ hồn lực.
4. **Giới hạn tần suất**: hồi chiêu do server đếm; lệnh tốn tài nguyên hoặc spam được (chat, lời mời, danh sách kênh, bảng xếp hạng) có nhịp riêng (`server/src/ratelimit.ts`).
5. **Không tin số client gửi**: client không gửi máu, sát thương, vị trí, tỉ lệ rơi, kết quả. `Math.random()` chỉ ở server.
6. Từ chối thì gửi lý do bằng `this.log(id, text, col)` (tiếng Việt), không ném lỗi làm sập room.
7. Luồng khó thử bằng bot: thêm `op` cho hook `test` (chỉ chạy khi `GAME_TEST=1`) gọi đúng hàm luật chơi.

## Đồng bộ xuống client
- **Công khai:** thêm trường trong `server/src/rooms/schema.ts` (`PlayerState`, `BeastState`, `DropState`, `MapState`, `ArenaState`) với kiểu nhỏ nhất đủ dùng; trường bit chỉ thêm vào cuối danh sách id. Đọc ở `client/src/scenes/GameScene.ts` (skill `client-ui`).
- **Riêng:** `this.clients.getById(id)?.send(...)` (như `log`, `sendBag`, `sendSquad`); gửi khi đổi, không gửi mỗi tick. Không đưa dữ liệu riêng vào state công khai. Muốn lọc schema theo người xem thì tra tài liệu `@colyseus/schema` 3.0.76 qua context7 trước, không đoán API.
- **Hiệu ứng hình ảnh:** `this.broadcast("fx", { k: ... })`, `"dmg"`; loại `k` mới thì xử lý ở `GameScene.fx()`.

## Lưu dữ liệu
- Qua `store` trong `server/src/db.ts`; bảng / cột mới dùng skill `db-migration`.
- **Mọi lần ghi DB về một người chơi đi qua chuỗi lưu `this.chain(d, fn)`** (mục 6 "Lưu của mỗi người chơi chạy nối tiếp"). Không gọi `store.save…` trực tiếp ngoài chuỗi.
- Dữ liệu chưa lưu mới phải nằm trong cả `save` **và** `saveTravel` (túi đồ: cờ `bagDirty`, ảnh chụp `bagSnapshot`), vì transaction đi cổng / đổi kênh là lần ghi cuối của phòng cũ.
- Phiên giữ tài khoản (mục 6 "Mỗi tài khoản một phiên"): `onAuth` gọi `waitOldSession` **trước** mọi lần đọc DB nhân vật; `onLeave` gọi `freeze` trước khi nối lần ghi cuối, rồi `releaseAccount`. Tiến độ chạy theo thời gian (như hấp thụ) phải dừng khi `d.travelling`.

## Xong thì
`npm run check`, bật server `GAME_TEST=1` rồi `npm run bot --prefix client` (skill `roadmap-step`).
