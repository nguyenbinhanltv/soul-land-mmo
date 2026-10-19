---
name: server-feature
description: Checklist server-authoritative khi thêm hoặc sửa luật chơi, message từ client, trạng thái đồng bộ hay API ở server (server/src/rooms/MapRoom.ts, schema.ts, map.ts, index.ts). Dùng khi làm bất cứ tính năng gameplay nào: chiến đấu, hồn kỹ, hấp thụ, rơi đồ, túi đồ, võ hồn, đội hình, chat.
---

# Tính năng phía server

Nguồn luật: `CLAUDE.md` và `GAME_DESIGN.md` mục 6 (Kiến trúc, bắt buộc giữ). Server quyết định mọi thứ, client chỉ gửi ý định.

## Logic đặt ở đâu
- Luật chơi trong trận: `server/src/rooms/MapRoom.ts`, lớp `MapRoom`. Vòng lặp chạy `tick(dt)` với `TICK_RATE` lần/giây (`shared/data.ts`).
- Một loại phòng cho mọi bản đồ: `gameServer.define("map", MapRoom).filterBy(["mapId"])` ở `index.ts`; mỗi phòng là một kênh. `onCreate` kiểm `mapId` có trong `MAPS` (mặc định `DEFAULT_MAP`), nạp bản đồ bằng `loadMap(mapId)` (`server/src/map.ts`, cache theo `mapId`) vào `this.map`, ghi `state.mapId`. Va chạm, vùng, điểm hồi sinh đọc qua `this.map` (`hits`, `moveEnt`, `zones`, `spawn`, `inSpawn`), không đọc file bản đồ cố định.
- Khác biệt giữa các bản đồ nằm trong dữ liệu (`MAPS`, file Tiled), không tách lớp phòng con. Client không bao giờ tự chọn bản đồ đích.
- API REST (đăng nhập, tạo nhân vật, thức tỉnh): `server/src/index.ts` (`/api/login`, `/api/me`, `/api/looks`, `/api/awaken`). Luật tạo nhân vật nằm trong `chooseLooks`, luật thức tỉnh trong `awakenAccount`, cả hai ở `MapRoom.ts`; server tự roll, client không chọn kết quả.
- Dữ liệu riêng của người chơi chỉ server biết: `pdata: Map<sessionId, PData>` (ví dụ `ringYears`, `absorbing`, `atkCd`, sinh lực võ hồn không ra trận `benchHp`, võ hồn đã gục `down`). Trạng thái hồn thú riêng: `bdata`.
- Số cân bằng lấy từ `shared/data.ts` (xem skill `balance-data`), không viết số mới trực tiếp vào room.

## Checklist cho mỗi message từ client
Đăng ký trong `onCreate()` bằng `this.onMessage(...)`. Message hiện có: `input`, `attack`, `skill`, `absorb`, `chat`, `vohons`, `team {slots}` (xếp đội, ngoài giao chiến), `switch {slot}` (đổi võ hồn trong đội, cả khi đang đánh; cấm vào võ hồn đã gục), `test {op}` (hook kiểm thử cho bot, chỉ chạy khi server bật `GAME_TEST=1`; luồng mới khó thử bằng bot thì thêm `op` gọi đúng hàm luật chơi, không viết luật riêng), `travel {portal}` (xin đi cổng theo tên; server trả riêng `portal` khi bước vào/ra cổng và `travel {mapId}` khi đã lưu xong, mục 6).
Hành động mới phải bị chặn khi `d.travelling` (đang chuyển bản đồ) và, nếu là giao chiến, khi đứng trong vùng an toàn (`this.map.inSafe`). Thiết kế dự kiến thêm `absorb {itemId, vohonId}`.
Message chưa đăng ký thì Colyseus ngắt kết nối client gửi nó (`onMessage for "…" not registered`): bỏ message cũ thì cập nhật client và bot cùng lúc.

1. **Ép kiểu và kẹp giá trị**: `Number(m?.x) || 0`, `String(m?.text ?? "")`. Xem mẫu `input` (chuẩn hóa vector về độ dài ≤ 1) và `chat` (`trim().slice(0, 120)`).
2. **Kiểm tra chỉ số/id có thật**: ví dụ `skill` kiểm `i >= 0 && i < 4` và `i < p.rings.length`. Với `itemId`/`vohonId` phải kiểm tra món đồ/võ hồn đó thuộc tài khoản của `c.sessionId` (`pdata.get(id).accountId`).
3. **Kiểm tra trạng thái**: người chơi tồn tại, không `dead`, không đang `absorbing`, hết hồi chiêu (`atkCd`, `p.cds[i]`), đủ hồn lực (`mpF`). Xem `attack()`, `skill()`, `tryAbsorb()`.
4. **Giới hạn tần suất**: message gửi dồn dập không được tạo lợi thế (hồi chiêu do server đếm) và không được làm nghẽn server (chat, lệnh tốn tài nguyên).
5. **Không tin số client gửi**: client không bao giờ gửi máu, sát thương, vị trí, tỉ lệ rơi, kết quả hấp thụ. Vị trí do server tính trong `tick()` từ `d.input`. Sát thương tính trong `damageBeast()` / `hurtPlayer()`. Ngẫu nhiên (`Math.random()`) chỉ gọi ở server.
6. Từ chối thì gửi lý do bằng `this.log(id, text, col)` (chữ tiếng Việt), đừng ném lỗi làm sập room.

## Đồng bộ xuống client
- **Trạng thái công khai** (ai cũng thấy): thêm trường trong `server/src/rooms/schema.ts` (`PlayerState`, `BeastState`, `DropState`, `MapState`) với `@type(...)`, rồi đọc ở `client/src/scenes/GameScene.ts` (skill `client-ui`). Chọn kiểu nhỏ nhất đủ dùng (`uint8`, `float32`…).
- **Dữ liệu riêng** (túi đồ, danh sách võ hồn, hồn cốt, hồn hạch): chỉ gửi cho chính chủ, ví dụ `this.clients.getById(id)?.send(...)` như hàm `log()`. Đang có: `vohons` (bộ sưu tập, đội hình), `squad` (sinh lực từng võ hồn trong đội, võ hồn đã gục; `sendSquad` chỉ gửi khi đổi), `ko` (võ hồn vừa gục). Không đưa vào `MapSchema` công khai. Người khác chỉ thấy võ hồn đang ra trận, cấp và hồn hoàn của nó. Nếu muốn dùng tính năng lọc theo người xem của `@colyseus/schema` thì tra tài liệu đúng phiên bản đã ghim (3.0.76) qua context7 trước, không đoán API.
- **Hiệu ứng hình ảnh** (không ảnh hưởng luật): `this.broadcast("fx", { k: ... })` và `this.broadcast("dmg", {...})`. Thêm loại `k` mới thì xử lý tương ứng ở `GameScene.fx()`.

## Lưu dữ liệu
- Lưu qua `store` trong `server/src/db.ts`. Cần bảng/cột mới: dùng skill `db-migration`.
- **Mọi lần ghi DB về một người chơi đi qua chuỗi lưu `this.chain(d, fn)`** (mục 6 "Lưu của mỗi người chơi chạy nối tiếp"): `save(id)` (võ hồn có tiến độ chưa lưu + vị trí có lớp chặn `WHERE map_id`), `persistTeam(d)`, transaction đi cổng. Không gọi `store.save…` trực tiếp ngoài chuỗi, nếu không lần ghi cũ có thể commit sau và đè bản mới.
- Lưu ở `onLeave`, `onDispose` và sau sự kiện quan trọng (xem `finishAbsorb()`); chuỗi lưu tự bắt lỗi để không sập room. Dữ liệu chưa lưu mới (túi đồ từ 3.1…) phải nằm trong `save` **và** `saveTravel` (transaction đi cổng là lần ghi cuối của phòng cũ).

## Xong thì
`npm run check`, bật server rồi `npm run bot --prefix client` (skill `roadmap-step`).
