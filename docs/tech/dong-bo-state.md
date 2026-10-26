# Đồng bộ state xuống client

Server là nguồn duy nhất của luật chơi; client chỉ nhận state để hiển thị. Ba loại dữ liệu đi xuống client theo ba đường khác nhau.

**Đồng bộ xuống client**

## Trạng thái công khai
- Qua Colyseus Schema ở `server/src/rooms/schema.ts`: `MapState`, `PlayerState`, `BeastState`, `DropState`, `GroundState`; phòng sân có thêm `ArenaState` / `ArenaSide`. Client đọc ở `client/src/scenes/GameScene.ts`.
- Chọn kiểu nhỏ nhất đủ dùng. Trường bit (`BeastState.st` theo `STATUS_IDS`, `PlayerState.buff` theo `BUFF_IDS`) chỉ thêm vào cuối.
- Trường mới khai báo trong `schema.ts`, không đưa dữ liệu riêng của một người vào đây.

## Bảng trường `schema.ts`
Thêm / đổi trường ở `schema.ts` thì sửa bảng này (kiểm (h) của `tools/docs-check.mjs` báo trường thiếu). Mặc định client đọc ở `client/src/scenes/GameScene.ts`; cột "Đọc thêm" ghi nơi khác.

**`PlayerState`**

| Trường | Kiểu | Ý nghĩa | Đọc thêm |
|---|---|---|---|
| `name` | string | tên hồn sư | |
| `vh` | uint8 | chỉ số võ hồn đang ra trận | |
| `sex`, `hair`, `hairCol`, `outfitCol`, `skin` | uint8 | ngoại hình chế độ Mẫu dựng sẵn (mục 5.11) | `sprites.ts` |
| `lpc` | string | ngoại hình chế độ Tự tạo (`encodeLpc`); rỗng = chế độ Mẫu | `lpcRig.ts`, `looksMaker.ts` |
| `gearAo`, `gearMu` | uint8 | bậc áo / mũ trang bị + 1 (0 = không mặc), chỉ để vẽ lớp LPC | |
| `x`, `y` | float32 | vị trí | |
| `dir` | uint8 | hướng nhìn 4 phía (`DIRS4`) | |
| `moving`, `walk`, `calm` | boolean | đang đi; giữ Shift (đi bộ); ngoài giao chiến (được chạy) | `predict.ts` |
| `seq`, `seqT`, `spd` | uint32 / float32 | số thứ tự `input` cuối đã nhận, giây hướng đi đã áp, tốc độ thật (dự đoán chuyển động) | `predict.ts` |
| `level`, `xp`, `xpNeed` | uint8 / uint32 | cấp, kinh nghiệm, kinh nghiệm cần | `hud.ts` |
| `hp`, `maxHp`, `mp`, `maxMp` | uint32 | sinh lực, năng lượng (tiên cơ) | `hud.ts` |
| `rings` | uint8[] | hồn hoàn đang có (bậc theo thứ tự) | |
| `cds`, `bcds`, `swCd` | float32[] / float32 | hồi chiêu hồn kỹ; hồi chiêu kỹ năng hồn cốt chủ động; hồi đổi võ hồn | `hud.ts` |
| `shield` | uint32 | khiên còn lại | |
| `buff` | uint16 | hiệu ứng có lợi (bit theo `BUFF_IDS`) | |
| `st` | uint16 | trạng thái xấu do chiêu hồn thú gây (bit theo `STATUS_IDS`) | |
| `han` | uint8 | số tầng Hàn (Cực Hàn) | `hud.ts` |
| `lei` | uint8 | Phong Lôi Chi Lực của Lam Điện Bá Vương Long | `hud.ts` |
| `ava`, `avaCd`, `ctCd` | float32 | giây Chân Thân còn lại; hồi chiêu Chân Thân (nút R); hồi chiêu hồn kỹ Chân Thân | `hud.ts` (`avaCd`, `ctCd`) |
| `absorb`, `absorbTier` | float32 / uint8 | tiến độ hấp thụ 0..1; bậc hồn hoàn đang hấp thụ | |
| `dead` | boolean | đã gục | |
| `kills` | uint32 | số lần hạ (bảng kết quả sân đấu) | `arenaShow.ts` |
| `auto` | boolean | đang tự săn (chữ "Tự động" trên đầu) | |
| `tong` | uint8 | tông môn + 1 (0 = không) | |

**`BeastState`**

| Trường | Kiểu | Ý nghĩa | Đọc thêm |
|---|---|---|---|
| `x`, `y`, `face`, `moving` | float32 / int8 / boolean | vị trí, hướng, đang di chuyển | |
| `tier`, `years`, `species`, `rank` | uint8 / uint32 | bậc theo số năm, tuổi, loài, hạng (0 thường … 3 boss thế giới) | |
| `hp`, `maxHp` | uint32 | sinh lực | |
| `aggro` | boolean | đang có mục tiêu | `music.ts` |
| `st`, `burn`, `poison`, `armor`, `allure`, `lock` | uint16 / uint8 | trạng thái dùng chung và số tầng cộng dồn | |
| `cast` | boolean | đang báo trước chiêu (đứng yên) | |
| `buff` | uint8 | hiệu ứng có lợi của hồn thú (`BEAST_BUFF_IDS`) | |
| `phase`, `parts` | uint8 | giai đoạn thú vương / boss; số người tham gia đang áp vào máu | `hud.ts` |
| `weak`, `shield`, `chg`, `brk`, `dive` | uint8 / uint32 / boolean | boss thế giới: điểm yếu hệ, khiên Bá Thể, tích lực, số lần ngắt, đang lặn | `hud.ts` |
| `egg` | uint8 | bọc trứng: phần mười giây còn lại trước khi nở | |
| `form`, `formWarn` | uint8 / boolean | dạng đang có (+1) và đang báo đổi dạng | |

**`DropState`**

| Trường | Kiểu | Ý nghĩa | Đọc thêm |
|---|---|---|---|
| `x`, `y`, `tier`, `years` | float32 / uint8 / uint32 | vị trí, bậc và số năm của hồn hoàn | |
| `item`, `qty` | string / uint16 | mã vật phẩm khác hồn hoàn và số món; rỗng = hồn hoàn | |
| `species`, `slot` | uint8 | hồn cốt: loài, vị trí | |
| `stars`, `cset` | uint8 | hồn hạch: sao, bộ; trang bị: bậc + 1, chỉ số mẫu | |
| `owner`, `party`, `ownerTtl` | string / uint32 / float32 | người / tổ đội được ưu tiên nhặt và giây còn lại | `contextCursor.ts` (`ownerTtl`) |
| `ttl` | float32 | giây còn lại trước khi biến mất | |

**`GroundState`** (vùng lưu lại trên mặt đất, #161)

| Trường | Kiểu | Ý nghĩa | Đọc thêm |
|---|---|---|---|
| `kind`, `shape` | uint8 | loại (`GROUND_KINDS`), hình (`TELE_SHAPES`) | `hitFeel.ts` |
| `x`, `y`, `ang`, `r`, `w`, `arc` | float32 / uint16 | vị trí, góc, bán kính, bề rộng, cung | |
| `ttl`, `wait` | uint16 / uint8 | giây còn lại; giây báo trước còn lại | |

**`MapState`** và sân đấu

| Trường | Kiểu | Ý nghĩa | Đọc thêm |
|---|---|---|---|
| `mapId`, `mapFile`, `channel` | string / uint16 | mã bản đồ, tên file Tiled khác `<mapId>`, số kênh | |
| `players`, `beasts`, `drops`, `grounds` | map | thực thể, gắn `@view()` (chỉ gần client) | |
| `online` | uint16 | số hồn sư cả phòng | |
| `phase`, `time`, `sides` | string / float32 / mảng | `ArenaState`: pha trận, giây còn lại, hai bên | `arenaShow.ts`, `hud.ts` |
| `winner`, `watchers`, `friendly` | int8 / uint8 / boolean | `ArenaState`: bên thắng (-1 chưa xong, 2 hòa), số người xem, trận giao hữu | `hud.ts` |
| `sid`, `elo`, `pct`, `alive`, `total` | string / uint16 / float32 / uint8 | `ArenaSide`: phiên, Elo, sinh lực đội %, võ hồn còn / tổng (kèm `name`) | `hud.ts` |

## Dữ liệu riêng (tin riêng cho chính chủ)
- Túi đồ, bộ sưu tập, đội hình, năng lượng tiên cơ, nhiệm vụ, tổ đội, cộng minh, đấu trường… chỉ gửi cho chính chủ bằng tin riêng. Tên tin xem `MapRoom.ts` (`vohons`, `squad`, `bag` / `bagd`, `gear`, `quest`, `tong`, `party`, `resonance`, `arena`, `npc`, `travel`, `channels`, `daily`, `wp`, `auto`, `offline`, `friends`, `mini`, `fog`, `rally`, `stats`…).
- Bảng cộng minh công khai chỉ che giấu `account_id`, cấp / đồ / tiến độ chi tiết của người khác. Người khác chỉ thấy ngoại hình hồn sư, võ hồn đang ra trận, cấp và hồn hoàn của nó.

## Túi đồ gửi theo thay đổi (`shared/bagSync.ts`)
- Tin `bag` (cả túi) chỉ gửi khi client xin hoặc phiên chưa có bản gốc.
- Mỗi lần túi đổi, server so với bản đã gửi cho phiên đó và gửi `bagd`: số ô, Hồn Tệ, hồi chiêu, ô đổi / mới, id ô mất, thứ tự khi sắp xếp, danh sách mua lại, bộ lọc tự bán và đồ tự bán (`sell`, `sold`); ô khoá có `lock`.
- Client và bot áp bằng `applyBagDelta`. Túi vài trăm ô nhặt một món chỉ tốn vài trăm byte.
- Món đang mặc không nằm trong túi (xem `trang-bi-cai-dat.md`); chúng đi bằng tin riêng `gear`.

## Hiệu ứng hình ảnh
- Không ảnh hưởng luật: `broadcast("fx", {k, …})` và `"dmg"`. Tin công khai `elite`, `boss`.

## Đồng bộ theo vùng gần (`server/src/rooms/interest.ts`, hằng `SYNC_VIEW`)
- `MapState.players` / `beasts` / `drops` gắn `@view()`, mỗi client một `StateView`. Cuối mỗi nhịp, trước bản vá, client nhận thêm thực thể cách mình dưới `SYNC_VIEW.r` và bỏ thực thể xa quá `SYNC_VIEW.out`.
- Chính mình và hồn thú có `rank` (tinh anh, thú vương, boss thế giới: thanh máu, radar) luôn có. Thực thể ra khỏi view thì client xóa hình như khi thực thể bị xóa khỏi state; hiệu ứng chết / nhặt đến bằng tin `fx`.
- **Client không được giả định state có thực thể ở xa.** Cần cả bản đồ thì dùng tin riêng như `mini`.
- `MapState.online` đếm hồn sư cả phòng.
- Tin `fx` / `dmg` chỉ gửi cho client cách điểm hiệu ứng (`x, y`, cuối vệt lướt, hồn sư `id` / `to`, hồn thú `bid`) dưới `SYNC_VIEW.fx`.
- Tin `mini` mỗi `SYNC_VIEW.mini` giây phục vụ radar (mục 5.17): vị trí theo ô của hồn sư trong `RADAR.far` ô quanh client đó cộng đồng đội tổ đội và người cùng tông môn (tính riêng từng client), cùng hồn thú thường từ nghìn năm và đồ rơi cả bản đồ (chung một bản).
- Vùng lưu lại trên mặt đất (`MapState.grounds`) cũng gắn `@view()`: client nhận vùng có mép trong `SYNC_VIEW.r` và bỏ khi mép xa quá `SYNC_VIEW.out`, nên người vào tầm sau vẫn thấy vùng đang có.
- Sân Đại Đấu Hồn Trường không lọc. Hook kiểm thử `test {op: "view", all}` tắt lọc cho một client (bot đọc thực thể ở xa).

## Lưới không gian
- Cùng file, ô `SYNC_VIEW.cell`: hồn thú, đồ rơi, hồn sư đặt lại lưới mỗi nhịp.
- Truy vấn hồn thú theo vị trí (đánh thường, mọi vùng hồn kỹ, đạn, tiên cơ, lan Cảm điện) dùng `MapRoom.beastsNear`, và tìm mục tiêu của hồn thú chỉ xét ứng viên quanh điểm thay vì cả bản đồ.
- **Hồn thú ngủ:** hồn thú thường không mục tiêu, không đang về chỗ sinh / niệm chiêu / bị đẩy, ở ô lưới cách mọi hồn sư trong phòng quá `SYNC_VIEW.wake` thì không lang thang, không tìm mục tiêu, vẫn hồi máu, đếm hồi chiêu và chịu trạng thái. `wake` ≥ `out` nên hồn thú client đang thấy luôn thức; tinh anh, thú vương không ngủ.

## Đo thời gian tick / bản vá (`server/src/perf.ts`)
- `PERF_LOG=1` ghi thời gian tick / bản vá mỗi 10 giây, dòng `[perf]`: trung bình, `max`, `slow` (số nhịp chậm trong 10 giây).
- Nhịp chậm (từ đầu tick tới hết bản vá quá `PERF_SLOW_MS`, hoặc bắt đầu trễ quá `PERF_GAP_MS` sau nhịp trước) in thêm dòng `[perf-slow]`: giờ UTC, thời gian từng đoạn của tick (đầu, người chơi, hồn thú, thế giới, cuối, lọc view, bản vá), CPU của luồng chính trong nhịp, GC chồng lên nhịp, CPU / GC ngoài tick giữa hai nhịp.
- Đọc: CPU gần bằng thời gian thật = server bận; nhỏ hơn nhiều = hệ điều hành cắt luồng. Số đo thực tế ở `hieu-nang-soak.md`.
