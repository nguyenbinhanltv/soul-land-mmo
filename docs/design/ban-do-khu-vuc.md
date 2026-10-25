# Radar và bản đồ khu vực

Radar góc màn hình, bản đồ khu vực toàn màn hình, tự đi tới cờ, sương mù khám phá và dấu "Tập trung ở đây" của tổ đội. Server vẫn quyết định mọi thứ; client chỉ hiển thị. Số liệu ở `shared/data.ts` (`RADAR`, `RADAR_ART`, `MAPVIEW`, `FOG`, `AUTOWALK`, `RALLY`), hàm thuần ở `shared/radar.ts`, kiểm thử `npm run test:radar --prefix server`. Số issue ở cuối file.

## 5.17 Radar và bản đồ khu vực
Thay bản đồ nhỏ cũ (vẽ cả bản đồ ×8 dưới 1 px mỗi ô, nhìn thẳng trong khi màn chơi là isometric).

### Radar góc màn hình
- Tròn, khung gỗ sơn mài và la bàn, đường kính `RADAR.size`, **tâm là mình**.
- Tầm mặc định `RADAR.r` ô; ba mức thu phóng `RADAR.zooms` (nút +/- hoặc lăn chuột; `radarZoomStep`). Vẽ lại `RADAR.hz` lần mỗi giây, không vẽ mỗi khung hình.
- Nút ở góc radar: đổi hướng (◈ / ⬆), +, −. Hướng và mức phóng nhớ ở localStorage (`soul.radar.mode`, `soul.radar.zoom`).
- Dưới radar: tên vùng, dòng "tên bản đồ · tọa độ ô · Kênh N", nút Kênh / Vùng (N) / Thế giới (M). Bấm vào radar (chuột, hoặc chạm chỗ không có chấm) mở bản đồ khu vực.
- **Nền radar** là ảnh `shared/assets/mini/<mapId>.png` (`MINI_BASE`), quay + phóng, cắt tròn. Chưa có ảnh thì dùng nền vẽ bằng `MINI_COLORS`. Khung vùng hang thú vương và vùng săn nhiệm vụ vẽ trên nền.

### Hướng và la bàn
- **Hướng mặc định xoay theo isometric** (`radarRotate(…, "iso")`): xoay 45°, không ép dọc, nên vòng tròn trên mặt đất vẫn tròn và đi lên màn hình thì chấm đi lên radar.
- Tùy chọn **"Nhìn thẳng"** (`"flat"`): theo lưới Tiled, Bắc lên. `radarUnrotate` đổi điểm bấm trên radar / bản đồ thành vector thế giới (đặt cờ).
- **La bàn:** ảnh `RADAR_ART.compass` có bốn mũi gần bằng nhau, không có chữ. **Hướng Bắc đánh dấu bằng code:** tô đỏ đầu mũi Bắc và vẽ chữ "B". Ảnh xoay `radarCompassRotation` (iso: 45°, mũi Bắc lên-phải; thẳng: 0) và đánh dấu bám theo `radarNorthAngle`, không cố định ở đỉnh ảnh.

### Chấm theo 8 mức ưu tiên
`RADAR.levels`, vẽ thấp → cao (`radarSortDots`); biểu tượng pixel 5–9 px vẽ bằng code.

| Mức | Chấm |
|---|---|
| 1 | Hồn thú (màu theo niên hạn) |
| 2 | Hồn sư khác |
| 3 | NPC / cổng / truyền tống trận |
| 4 | Mục tiêu nhiệm vụ và đồ rơi quý |
| 5 | Đồng đội tổ đội / cùng tông môn (viền `RADAR.tongCol`) |
| 6 | Tinh anh (nhấp nháy, màu aura loài) |
| 7 | Thú vương / boss thế giới (đầu lâu đỏ nhấp nháy) |
| 8 | Dấu "Tập trung ở đây" của tổ đội (cờ vàng trong vòng sáng, nhấp nháy, có mũi tên ở mép) |

- Cờ người chơi đặt vẽ như mức 4 (`flagCol`).
- **Mũi tên ở mép:** mức có `arrow` (nhiệm vụ, đồng đội, boss / thú vương) nằm ngoài tầm thì có mũi tên trên viền kèm khoảng cách theo ô (`radarPlace`: `outside`, `tiles`, `angle`, kẹp vào mép lùi `RADAR.arrowInset`).
- Rê chuột / chạm vào chấm hiện tên (`radarPick`: mức cao nhất, rồi gần nhất).

### Bản đồ khu vực
`client/src/mapview.ts`. Mở bằng phím N, nút Vùng hoặc bấm radar; đóng bằng N / Esc / nút ✕ lớn.

- Lớp phủ toàn màn hình của bản đồ đang đứng, cùng ảnh nền và cùng hướng chiếu với radar (nút "Nhìn thẳng" đổi chung với radar). Che màn hình nhưng không dừng game; nút cảm ứng chạy ngay lúc chạm. Vẽ lại `RADAR.hz` lần mỗi giây khi đang mở.
- **Thao tác:** kéo để di chuyển; lăn chuột hoặc chụm hai ngón để phóng trong `MAPVIEW.zoomMin`…`zoomMax` (phép chiếu, phóng quanh con trỏ, kéo: `mapviewToScreen` / `mapviewToTile` / `mapviewZoomAt` / `mapviewPan` ở `shared/radar.ts`); "Về tôi" đưa khung về chỗ đứng. Chạm / bấm vào chấm hoặc nhãn hiện tên.
- **Nhãn:**
  - Vùng săn kèm niên hạn và cấp đề xuất (dòng đầy đủ khi phóng tới `MAPVIEW.labelZoom.zoneSub`, dưới đó chỉ cấp).
  - Vùng an toàn, hang thú vương, NPC; cổng ghi bản đồ đích; truyền tống trận (đã mở / chưa mở).
  - Nhãn nhỏ chỉ hiện từ mức phóng `MAPVIEW.labelZoom`; nhãn có nền mực, đè nhau thì nhường chỗ theo ưu tiên (cổng > truyền tống > NPC > hang > vùng); mở ra thì vừa khung, nút «⟲ Vừa khung» đặt lại.
- **Bộ lọc lớp** `MAPVIEW.layers` (hồn thú, đồ rơi, NPC / cổng, người chơi, nhiệm vụ; nhớ ở localStorage `soul.mapview.hidden`).
- **Dữ liệu:** chấm là đúng bộ chấm của radar (GameScene gom một lần cho cả hai, giao diện `DotSink`), nên chỉ có thứ server đã đồng bộ (state trong tầm + tin `mini`), không lộ thêm vị trí.
- **Chỗ chèn thêm:** `mapview().onTap` nhận ô được bấm kèm chấm / nhãn dưới ngón tay; `setMarker(id, {tx, ty, name, col})` vẽ cờ / dấu trên cùng, luôn hiện; `addOverlay("fog" | "top", fn)` chèn lớp vẽ theo tọa độ ô (sương mù đã vẽ thẳng bằng `client/src/fog.ts`, không qua đây).

### Tự đi tới cờ
`client/src/autowalk.ts`, `shared/autowalk.ts`, `GameScene.flagTick`. Server không có lệnh dịch chuyển; client chỉ lái hướng đi bằng `input` như khi bấm chuột, nên server vẫn tính vị trí, va chạm, cổng.

**Đặt cờ**
- Bấm chuột lên bản đồ khu vực (điện thoại: chạm giữ `AUTOWALK.holdMs` ms, chạm ngắn chỉ hiện tên). Ô chặn không đặt được.
- Bấm một cổng thì đích là bản đồ bên kia cổng. Bảng bản đồ thế giới (M) có nút "Tự đi tới" ở mỗi bản đồ khác.
- Cờ có thanh dưới radar (Đi / Dừng / ✕, phím Y; bản đồ khu vực cũng có nút Đi tới cờ / Dừng / Xóa cờ), vòng cam trên mặt đất, chấm nhiệm vụ màu `RADAR.flagCol` có mũi tên ở mép radar và đường đi nét đứt trên radar lẫn bản đồ khu vực.

**Đường đi**
- Cùng bản đồ: `findLongPath` (A* trên đồ thị dẫn đường `AUTO_MOVE.nav`, như tự săn) từ chỗ đứng tới cờ.
- Khác bản đồ: `autoLeg` (hàm thuần) lấy bản đồ kề nên đi tới trước từ `route` của tin riêng `daily` (server tính theo số cổng ít nhất, chỉ qua cổng `portal` thật trong file Tiled, không qua sân đấu).
  - Đi tới cổng đó; khi server báo đang đứng trên cổng thì gửi `travel` như bấm F; vào bản đồ mới thì chuyến đi tiếp tục (module `autowalk.ts` sống qua đổi bản đồ; mất kết nối / thoát ra thì không tự đi lại).
  - Không bao giờ tự dùng truyền tống trận hay Hồi Thành Phù (tốn Hồn Tệ). Không có đường bộ thì báo và gợi ý truyền tống.
  - Cờ chỉ có bản đồ (từ bản đồ thế giới) thì dừng khi vào tới bản đồ đó.

**Dừng** (kèm một dòng lý do trong khung tin, `AUTO_STOP`):
- Người chơi bấm phím / cần điều khiển / bấm nền đất; bị tấn công (tin `dmg` trúng mình); gục; mở hộp thoại NPC; bật tự săn.
- Tới nơi (xóa cờ); không có đường.
- Kẹt quá `AUTOWALK.stuckSecs` giây không gần đích thêm `AUTOWALK.progress` ô.
- Đứng trên cổng mà quá `AUTOWALK.gateSecs` giây vẫn ở bản đồ cũ (server từ chối).

Số liệu ở `AUTOWALK`; bài bot `BOT_ONLY=flag`.

## Dữ liệu cho radar và bản đồ

### Nền ảnh
- `tools/maps` sinh `shared/assets/mini/<mapId>.png` (`MINI_BASE.px` điểm mỗi ô, rộng = số ô × px, mọi điểm đục) từ lớp ô và lớp vật của bản dựng: đất / rừng theo màu ô isometric của từng vùng, chuyển màu nhẹ giữa các tầng niên hạn, đường, suối, vách, nhà / tường thành viền mực.
- `npm run check` sinh lại và so từng điểm ảnh.
- Chưa tải được hoặc bản đồ chưa có ảnh thì dùng nền vẽ từ ô bằng `MINI_COLORS`.

### Khóa ảnh giao diện
`ui_radar_frame` (khung tròn), `ui_radar_compass`, `ui_mapview_paper` (nền giấy, kéo giãn 9 lát). Cỡ đích và `nine` ở `RADAR_ART.frame` / `.compass` / `.paper`. Chưa có ảnh trong manifest thì client dùng CSS tạm; có ảnh thì thay không phải sửa code.

### Tin `mini`
- Hồn sư lạ chỉ gửi trong `RADAR.far` ô quanh từng người. Đồng đội tổ đội cùng kênh và người cùng tông môn luôn gửi; chính mình luôn có; boss / tinh anh / thú vương vốn luôn nằm trong state.
- Server tính riêng cho từng client (`sendMini`, lưới `interest.players`), nên người lạ ở xa không lộ vị trí và client không có dữ liệu thừa để lần ra. Radar và bản đồ khu vực chỉ vẽ thứ có trong tin.

## Sương mù khám phá
Chỗ chưa tới thì mờ trên bản đồ khu vực và radar. Bảng `map_fog` (`server/sql/031_map_fog.sql`). Số liệu ở `FOG`, hàm thuần ở `shared/fog.ts`.

### Lưu
- Mỗi tài khoản × bản đồ một dòng. `cells` là bitset ô thô `FOG.cell`×`FOG.cell` ô lưới (bit thấp trước) kèm `map_file` (file Tiled của tọa độ: đổi file bản đồ thì bitset cũ bị bỏ, như `accounts.map_file`).
- Tài khoản cũ bắt đầu trống và chỉ mở quanh chỗ đứng khi vào.
- Dòng sai kích thước, có bit thừa hoặc lưới quá `FOG.maxCells` là dữ liệu lạ: server bỏ và bắt đầu lại.
- Bản đồ trong `FOG.open` (thành, Thánh Hồn Thôn, sân đấu) mở sẵn: không có dòng, không gửi tin.

### Server quyết định
`MapRoom.fogLoad` / `fogMark`. Nạp bitset của bản đồ đang đứng khi vào phòng (trong chuỗi lưu), rồi mỗi `FOG.markSecs` giây mở mọi ô thô chạm đĩa bán kính `FOG.sight` ô quanh **vị trí thật** của từng người (`fogReveal`). Client không gửi gì về sương mù: tin `fog` / `fogd` từ client bị bỏ.

### Ghi gộp
- RAM đổi thì đặt cờ `fogDirty`; chỉ ghi DB cùng lần lưu định kỳ của người chơi, khi đi cổng và khi rời phòng (`fogFlush`, trong chuỗi lưu), không ghi mỗi bước.
- Ghi lỗi thì đánh dấu lại, lần lưu sau ghi tiếp.

### Gửi xuống
- Tin riêng `fog {bits}` (cả bitset của bản đồ đang đứng; client xin bằng `fog`, theo nhịp `ASK_CD`, và server gửi khi nạp xong), rồi `fogd {add: [số ô]}` mỗi `FOG.sendSecs` giây, tối đa `FOG.maxAdd` ô mỗi tin (dư gửi ở nhịp sau).
- Chỉ bản đồ đang đứng, không có dữ liệu bản đồ khác; cỡ tin tối đa là cỡ bitset.

### Hiển thị
`client/src/fog.ts`.
- Một lớp mờ mực, mỗi ô thô một điểm ảnh phóng bằng làm mịn nên mép mềm, vẽ ngay trên nền radar và bản đồ khu vực, dưới khung vùng / đường đi / chấm.
- Ô vừa mở sáng dần trong `FOG.fadeMs` ms. **Tắt khi "Giảm chuyển động" hoặc hiệu ứng Thấp** (đổi ngay). Chưa nhận bitset thì không che gì.
- Ở chỗ chưa khám phá: hồn thú thường, đồ rơi và hồn sư lạ không hiện; nhãn vùng săn / vùng an toàn / hang thú vương và khung vùng bị ẩn.
- Cổng, truyền tống trận, NPC, mục tiêu nhiệm vụ, đồng đội, tinh anh, boss vẫn hiện qua sương mù.

### Lệnh GM và kiểm thử
- Lệnh GM: `/gm fog open` mở cả bản đồ đang đứng, `/gm fog reset` xóa về trống (mở lại quanh chỗ đứng); ở bản đồ mở sẵn báo không có sương mù.
- Kiểm thử: `npm run test:radar --prefix server` (hàm thuần, kể cả dữ liệu lạ); bot `npm run bot:local -- --only fog --pg` (đi tới thì mở, vào lại còn, đổi bản đồ đúng phần, tài khoản khác không thấy, tin lạ bị bỏ, lệnh GM).

## Đánh dấu tổ đội "Tập trung ở đây"
`RALLY`, `shared/rally.ts`, `client/src/rally.ts`, `MapRoom.rallyAction`. Thành viên tổ đội đặt một dấu trên bản đồ đang đứng để gọi đồng đội tới.

### Đặt dấu
- **Chuột phải** trên radar hoặc bản đồ khu vực.
- Điện thoại: **chạm giữ** trên bản đồ khu vực (`AUTOWALK.holdMs`). Khi đang trong tổ đội thì hiện thẻ chọn "Đặt cờ" / "Tập trung ở đây" (ngoài tổ đội chạm giữ vẫn đặt cờ ngay). Radar không có chạm giữ (chạm radar mở bản đồ khu vực).
- Chưa có đồng đội thì báo cần vào tổ đội.

### Server quyết định
Tin `rally {tx, ty}`:
- Phải ở trong tổ đội từ 2 người, không ở Đại Đấu Hồn Trường, không đang đổi bản đồ; ô nằm trong bản đồ và đi được (`map.standable`, làm tròn về tâm ô).
- Kiểm luật xong mới tính giới hạn tốc độ của tài khoản (`ratelimit.rallyCheck`: token bucket `RALLY.burst` lượt, hồi 1 lượt mỗi `RALLY.refillMs`). Bản đồ và kênh lấy từ chính phòng, client không gửi.
- Hợp lệ thì phát presence `party:rally` tới các tài khoản trong tổ đội lúc đặt (kể cả tiến trình khác). Phòng giữ người nhận kiểm lại người đó còn đúng tổ đội, không chặn người đặt, rồi gửi:
  - **tin riêng** `rally {from, map, ch, tx, ty, secs}` (chỉ tên người đặt, bản đồ, kênh, ô đích; không có id tài khoản, phiên hay vị trí người đặt);
  - một dòng chat hệ thống kênh tổ đội ("<tên> đánh dấu Tập trung ở đây", kèm tên bản đồ và kênh nếu người nhận đang ở chỗ khác).
- **Người ngoài tổ đội không nhận gì** (không lộ vị trí).

### Một dấu mỗi người, tự tắt
- Dấu mới của cùng người thay dấu cũ. Client đếm `RALLY.secs` giây từ lúc nhận rồi bỏ; người rời tổ đội thì dấu của họ mất ngay (theo tin `party`).
- Server **không giữ** dấu: đồng đội vào game sau (hoặc tải lại trang) không thấy dấu cũ. Đi cổng thì dấu còn trong trang tới khi hết hạn.

### Hiển thị và tự đi tới
- Chỉ dấu ở đúng bản đồ và kênh của người xem. Chấm mức 8 trên radar (mũi tên ở mép kèm khoảng cách khi ngoài tầm) và bản đồ khu vực (luôn hiện, không theo bộ lọc), vòng sáng vàng ba lớp trên mặt đất. Rê / chạm hiện "Tập trung ở đây: <tên> (còn n giây)".
- Bấm vào dấu (chuột trái trên radar hoặc bản đồ khu vực, hoặc chạm) thì đặt cờ đúng chỗ dấu và tự đi tới ("Tập trung: <tên>").

### Kiểm thử
`npm run test:radar --prefix server` (ô hợp lệ, đọc tin lạ, mỗi người một dấu, hết hạn, giới hạn tốc độ); bot `npm run bot:local -- --only rally` (người ngoài tổ đội không đặt / không nhận, thành viên ở bản đồ khác nhận, ô lạ bị bỏ, spam bị chặn, rời tổ đội thì thôi nhận). Hook thử `test {op: "rally", rop: "rlreset"}` xóa bộ đếm.

## Lịch sử / issue liên quan
- Kế hoạch và quyết định chung: #426. Các bước: R1 ảnh nền, R2 radar, R3 bản đồ khu vực, R4 tự đi tới cờ #431, R5 tin `mini`, R6 tập trung tổ đội #433, R7 khóa ảnh #434, R8 sương mù #435; lệnh GM `/gm fog` #518. Chặn người đặt dấu theo #195.
- Nhật ký từng bước: `docs/lich-su.md`.
