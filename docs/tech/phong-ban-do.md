# Phòng bản đồ, file Tiled, tools/maps

**Một loại phòng cho mọi bản đồ**
- **Logic game chỉ nằm trong các phòng ở `server/src/rooms/`:** `MapRoom.ts` (mọi bản đồ) và `ArenaRoom.ts` (trận Đại Đấu Hồn Trường); hàng chờ ở `arenaQueue.ts`.
- `gameServer.define("map", MapRoom).filterBy(["mapId"])`: Colyseus ghép người cùng `mapId` vào chung phòng; phòng đầy thì mở phòng mới (kênh mới). `onCreate({mapId})` kiểm tra `mapId` trong `MAPS` (thiếu thì `DEFAULT_MAP`), nạp bản đồ bằng `loadMap(mapId)` (`server/src/map.ts`, cache theo `mapId`), ghi `state.mapId`; client tải tilemap theo `mapId` của phòng.
- Khác biệt giữa các bản đồ nằm trong dữ liệu (`MAPS[mapId].kind`, file Tiled), không tách lớp phòng con. Ngoại lệ duy nhất là `ArenaRoom`.

**File Tiled mỗi bản đồ** (`shared/assets/<mapId>.v2.json` là bản mặc định, `<mapId>.json` là bản cũ dùng khi `MAP_V1`; dùng chung server và client; server nạp sẵn mọi bản đồ khi khởi động để báo lỗi object ngay). Layer `ground` là nền, `trees` vật cản, `canopy` tán cây phủ lên nhân vật; ô có `collides=true` là vật cản ở cả hai phía. Lớp object:

| Object (`type`) | Hình | Thuộc tính |
|---|---|---|
| `zone` | Chữ nhật | `beasts` (mã loài, có thể kèm trọng số: `phong_lang:3,man_da_la_xa:1`), `years` (`300-700`; thiếu thì tung bậc theo `weights`, cách cũ), `count`, `hint`; tên vùng dùng cho tiên thảo và mục tiêu nhiệm vụ |
| `portal` | Chữ nhật | `to` (`mapId` đích), `arrive` (tên điểm ở bản đồ đích), `level` (`10-30`), `boat` (bool, bến thuyền) |
| `arrive` | Điểm | Tên duy nhất trong bản đồ; phải nằm ngoài mọi vùng `portal` |
| `spawn` | Chữ nhật | Điểm hồi sinh / trại cổng; bản đồ săn có thương nhân lưu động tự đứng trong trại (`campMerchantSpot`, mục 5.8) |
| `safe` | Chữ nhật | Vùng an toàn trong bản đồ săn |
| `elite` | Chữ nhật | `boss` (mã tinh anh trong `BOSSES`); nằm trong một `zone` |
| `boss` | Chữ nhật | `boss` (mã thú vương hoặc boss thế giới); là hang / sàn đấu và cũng là bán kính giao chiến |
| `lake` | Điểm | Giữa hồ của bản đồ boss thế giới: boss lặn ra đây khi Du Thủy (mục 5.4); không có thì lặn tại chỗ |
| `npc` | Điểm | `npc` (mã trong `NPCS`) |
| `waypoint` | Chữ nhật | Tên là mã không dấu duy nhất trong bản đồ (lưu DB `<mapId>:<tên>`), `label` (tên hiện); tâm đứng được, ngoài mọi cổng |

Thuộc tính sai (loài không có, cổng tới bản đồ không có, `arrive` không tồn tại hoặc nằm trong `portal`, mã NPC lạ) thì server ghi cảnh báo và bỏ object đó.

**Quét vật vẽ lệch ô chặn (#747):** `tools/maps/quet-chan.mjs` (trong `npm run check`) so nhà, tường, cây, prop được vẽ với ô `collides`; lệch là lỗi, in danh sách `file [loại] tx,ty` (cách đọc ở `tools/maps/README.md`). Bộ dựng gỡ nhà bị cổng / điểm đến / waypoint khoét thành hình chữ L.

**Không sửa thẳng file `.v2.json`:** `npm run check` sinh lại từ `tools/maps` và báo lỗi nếu khác. `npm run map` (`tools/gen-map.mjs`) chỉ sinh các bản cũ `<mapId>.json` (đường lùi) và ghi đè bản cũ đã sửa tay.

**Bản đồ dựng bằng `tools/maps`** (11.3, cách dùng và chỉnh tay ở `tools/maps/README.md`; chỉnh tay chỉ qua lớp `tools/maps/hand/<mapId>.json`): file Tiled cùng định dạng, sinh từ bố cục `tools/maps/layouts/<mapId>.json` (vùng niên hạn theo đa giác tách thành chữ nhật, điểm chính, đường A*, suối, vách, tàn tích, điểm nhấn) và lớp chỉnh tay `tools/maps/hand/<mapId>.json`; cùng hạt giống ra cùng file, `npm run check` báo lỗi khi file khác bản sinh. Bản dựng lại của bản đồ đang có là `<mapId>.v2.json` và là **bản mặc định** khi có file (11.5); đường lùi: biến môi trường `MAP_V1` (danh sách `mapId` hoặc `all`) dùng lại bản cũ `<mapId>.json`. Server ghi tên file ở `MapState.mapFile`, client tải đúng file đó (cùng lưới va chạm với server). Tọa độ chỉ có nghĩa trên một file: vị trí lưu kèm tên file đang dùng (`accounts.map_file`); vào lại mà file đã lưu khác file server đang dùng (bản ×8 thành mặc định, đổi qua lại bằng `MAP_V1`) thì vào ở `spawn`; dòng ghi trước 11.5 (NULL) coi là bản cũ `<mapId>`.


**Bản đồ miền của `MapRoom.ts`** (#702: tách dần theo miền, từng PR nhỏ, di chuyển nguyên văn, không đổi hành vi / tên message / thứ tự ghi DB qua `this.chain`; hàm thuần trước). Tìm theo tên hàm, không theo số dòng (số dòng trôi). Cột "Đã tách" là mô-đun cùng thư mục `server/src/rooms/` (kiểu "hàm nhận phòng / `PData`" hoặc hàm thuần):

| Miền | Hàm / nhóm trong `MapRoom.ts` | Đã tách |
|---|---|---|
| Vật phẩm, túi (hàm thuần), đồ đang mặc | `newItem`, `itemStacks`, `bagUsed`, `gearStats`, `gearLook`, thứ tự xếp túi (`KIND_ORDER`) | `items.ts` |
| Vào / rời phòng, phiên, kênh, ghế | `onAuth`, `onJoin`, `onLeave`, `holdAccount`, `switchChannel`, `seat*`, `leftRoom` | chưa |
| Lưu người chơi | `chain`, `chainLatest`, `save`, `write`, `writeNow`, `bagSnapshot` | chưa |
| Đội hình, võ hồn, cộng hưởng | `setTeam`, `switchSlot`, `activate`, `resCheck`, `sendRes`, `resonanceTop` | chưa |
| Tự săn, ủy thác | `autoAction`, `sendAuto`, `claimOffline` | `autoHunt.ts`, `autoStatus.ts` |
| Đi cổng, điểm dịch chuyển | `travel`, `beginTravel`, `waypointAction`, `startWaypoint`, `useRecall`, `finishRecall` | chưa |
| Túi (phần có phòng): nhặt, dùng, bán, mua lại, mở rộng | `addItem`, `pickup`, `sortBag`, `sendBag`, `useItem`, `buyItem`, `sellItem`, `buybackItem`, `expandBag`, `autoSell` | chưa |
| NPC, tông môn, nhiệm vụ | `talkNpc`, `tongAction`, `tongTaskAction`, `questAction`, `questEvent`, `dailyAction` | chưa |
| Đấu trường (phía phòng bản đồ) | `arenaAction`, `arenaFound`, `arenaQueue*`, `arenaWatch` | `arenaQueue.ts`, `ArenaRoom.ts` |
| GM / hook test | `testHook` (chỉ chạy khi `GAME_TEST`), `gmAction`, `gmRun` | chưa |
| Chiến đấu người chơi: kỹ năng, trạng thái, hợp thể | `attack`, `skill`, `runSkill`, `applyStatus`, `applyPStatus`, `fusion*`, `boneSkill` | chưa |
| Hồn thú, tinh anh, thú vương, boss thế giới | `spawnBeast`, `tickElite`, `tickKing`, `world*`, `killKing`, `openChest` | `worldBoss.ts`, `split.ts`, `tide.ts`, `eggs.ts`, `ground.ts`, `cold.ts`, `beastTraits.ts` |
| Hấp thụ hồn hoàn, hồn cốt, hồn hạch | `tryAbsorb`, `finishAbsorb`, `equipBone`, `enhanceBone`, `equipCore`, `enhanceCore`, `resetCoreSet` | `bones.ts` (gắn / tháo / cường hóa hồn cốt, hồn hạch, đổi bộ: hàm nhận `room`, `MapRoom` chỉ chuyển tiếp 7 hàm; `tryAbsorb` / `finishAbsorb` / `afterBones` / `boneLock` / `bonesOn` / `coresOn` còn ở `MapRoom`) |
| Trang bị / Thợ rèn | `equipGear`, `equipEnhance`, `equipLuck`, `equipSynth`, `salvageEquip`, `forgeLane`, `itemLocked` | `equip.ts` (hàm nhận `room`; `MapRoom` chỉ chuyển tiếp 10 hàm cho `onMessage` / `tick`; hàm thuần mặc đồ ở `items.ts`) |
| Xã hội: chat, bạn bè, tổ đội | `chatAction`, `friendAction`, `partyAction`, `blockDeny` | `social.ts` (hàm nhận `room`, `MapRoom` chỉ chuyển tiếp 4 hàm; `ArenaRoom` vẫn override `partyAction`; phần presence `friendNote` / `partyNote` / `sendParty` / `rallyAction` còn ở `MapRoom`) |
| Phạm vi quan tâm, sương mù, radar | `beastsNear`, `fog*`, `sendMini` | `interest.ts` |
| Vòng `tick` | `tick`, `moveBeast`, `perfLog` | chưa |

Thứ tự tách tiếp (mỗi bước một PR, bot nhóm liên quan xanh): (2) xong: trang bị / Thợ rèn thành hàm nhận phòng (`equip.ts`, giữ `forgeLane` / `itemLocked` nguyên; `CLAIM_BUSY` / `claimHeld` xuất từ `MapRoom`); (3) xong: hồn cốt / hồn hạch thành hàm nhận phòng (`bones.ts`, hấp thụ hồn hoàn chưa tách); (4) xong: xã hội (chat, bạn bè, tổ đội thành hàm nhận phòng ở `social.ts`); (5) cửa hàng / mua lại; (6) `testHook` + GM (chỉ chạy khi `GAME_TEST`); (7) nhiệm vụ / tông môn. Luật mỗi bước: thứ tự `onMessage` đăng ký ở `MapRoom` giữ nguyên; phương thức có `private` thì mô-đun mới nhận `room: MapRoom` như `split.ts`.
