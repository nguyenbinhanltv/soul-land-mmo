# Phòng bản đồ, file Tiled, tools/maps

<!-- Tách cơ học từ GAME_DESIGN.md (D1, #619): nguyên văn, chưa viết lại; số mục và tên mục con giữ nguyên. -->

**Một loại phòng cho mọi bản đồ**
- **Logic game chỉ nằm trong các phòng ở `server/src/rooms/`:** `MapRoom.ts` (mọi bản đồ) và `ArenaRoom.ts` (trận Đại Đấu Hồn Trường); hàng chờ ở `arenaQueue.ts`.
- `gameServer.define("map", MapRoom).filterBy(["mapId"])`: Colyseus ghép người cùng `mapId` vào chung phòng; phòng đầy thì mở phòng mới (kênh mới). `onCreate({mapId})` kiểm tra `mapId` trong `MAPS` (thiếu thì `DEFAULT_MAP`), nạp bản đồ bằng `loadMap(mapId)` (`server/src/map.ts`, cache theo `mapId`), ghi `state.mapId`; client tải tilemap theo `mapId` của phòng.
- Khác biệt giữa các bản đồ nằm trong dữ liệu (`MAPS[mapId].kind`, file Tiled), không tách lớp phòng con. Ngoại lệ duy nhất là `ArenaRoom`.

**File Tiled mỗi bản đồ** (`shared/assets/<mapId>.json`, dùng chung server và client; server nạp sẵn mọi bản đồ khi khởi động để báo lỗi object ngay). Layer `ground` là nền, `trees` vật cản, `canopy` tán cây phủ lên nhân vật; ô có `collides=true` là vật cản ở cả hai phía. Lớp object:

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

Thuộc tính sai (loài không có, cổng tới bản đồ không có, `arrive` không tồn tại hoặc nằm trong `portal`, mã NPC lạ) thì server ghi cảnh báo và bỏ object đó. `npm run map` (`tools/gen-map.mjs`) sinh lại các bản đồ và **ghi đè** bản đã sửa tay.

**Bản đồ lớn dựng bằng `tools/maps`** (11.3, cách dùng ở `tools/maps/README.md`): file Tiled cùng định dạng, sinh từ bố cục `tools/maps/layouts/<mapId>.json` (vùng niên hạn theo đa giác tách thành chữ nhật, điểm chính, đường A*, suối, vách, tàn tích, điểm nhấn) và lớp chỉnh tay `tools/maps/hand/<mapId>.json`; cùng hạt giống ra cùng file, `npm run check` báo lỗi khi file khác bản sinh. Bản dựng lại của bản đồ đang có là `<mapId>.v2.json` và là **bản mặc định** khi có file (11.5); đường lùi: biến môi trường `MAP_V1` (danh sách `mapId` hoặc `all`) dùng lại bản cũ `<mapId>.json`. Server ghi tên file ở `MapState.mapFile`, client tải đúng file đó (cùng lưới va chạm với server). Tọa độ chỉ có nghĩa trên một file: vị trí lưu kèm tên file đang dùng (`accounts.map_file`); vào lại mà file đã lưu khác file server đang dùng (bản ×8 thành mặc định, đổi qua lại bằng `MAP_V1`) thì vào ở `spawn`; dòng ghi trước 11.5 (NULL) coi là bản cũ `<mapId>`.

