# Đồng bộ state xuống client

Server là nguồn duy nhất của luật chơi; client chỉ nhận state để hiển thị. Ba loại dữ liệu đi xuống client theo ba đường khác nhau.

**Đồng bộ xuống client**

## Trạng thái công khai
- Qua Colyseus Schema ở `server/src/rooms/schema.ts`: `MapState`, `PlayerState`, `BeastState`, `DropState`, `GroundState`; phòng sân có thêm `ArenaState` / `ArenaSide`. Client đọc ở `client/src/scenes/GameScene.ts`.
- Chọn kiểu nhỏ nhất đủ dùng. Trường bit (`BeastState.st` theo `STATUS_IDS`, `PlayerState.buff` theo `BUFF_IDS`) chỉ thêm vào cuối.
- Trường mới khai báo trong `schema.ts`, không đưa dữ liệu riêng của một người vào đây.

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
