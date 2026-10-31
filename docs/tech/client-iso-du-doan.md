# Client: hiển thị isometric và dự đoán chuyển động

**Hiển thị isometric phía client** (quy tắc hình ở mục 5.11)
- Server và file Tiled giữ tọa độ thế giới Descartes; client chỉ chiếu khi vẽ. `client/src/iso.ts`: `worldToScreen` / `screenToWorld` (cỡ thoi đổi bằng một hằng `TILE_W`, `TILE_H = TILE_W / 2`), độ sâu vẽ `depthAt` (tỉ lệ x + y của điểm chân), elip mặt đất `fillGround` (`RX` / `RY`), đa giác chiếu `ptsToScreen`, hướng 8 phía `dir8` và hướng gần nhất của sprite 4 hướng cũ `legacyDir`. Hằng hiển thị, không phải số cân bằng.
- `client/src/isoMap.ts` vẽ lớp `ground` thành ô thoi và lớp `trees` thành vật đứng theo `shared/assets/iso/tiles.json` (nhà / tường thành dựng bằng `isoBuild.ts`), sắp lớp theo độ sâu; ảnh dựng / cất theo khối 8 × 8 ô, chỉ khối trong tầm camera (cộng lề vật cao) có ảnh; mặt đất và lớp phủ mép của mỗi khối nung thành một ảnh canvas (kèm normal map khi có ánh sáng, giữ thêm vài chục khối vừa đi qua), vật đứng vẫn là ảnh riêng; làm mờ vật che chính mình chỉ xét vật của các khối quanh thực thể cần thấy (11.4); `preloadIso` chỉ tải ảnh bản đồ đang vào dùng tới. Gid / ảnh còn thiếu thì vẽ tạm bằng code từ `tiles.png`. Lớp `canopy` chỉ dùng ở chế độ nhìn thẳng.
- Mọi vị trí (hồn sư, hồn thú, NPC, đồ rơi, cổng, tin `fx` / `dmg`) nội suy trong tọa độ thế giới rồi chiếu. Điểm `fx` server đã trừ vài pixel ở y để nâng hiệu ứng thì bám vào chân hồn sư / hồn thú ngay dưới (`GameScene.lifted`).
- Camera phóng số nguyên quanh `VIEW_W` × `VIEW_H`; khi phóng 1 thì chữ trong thế giới phóng 2. HUD là HTML, phóng riêng `--u` (mặc định 100%, đổi ở Cài đặt; có lựa chọn Tự động) (CSS `zoom` trên `#hud`, `#overlay`; `uiScale` trong `client/src/uiArt.ts`, mục 5.11 C). Sprite cũ phóng `SPR`.
- Phím / cần / chuột theo hướng màn hình, chiếu ngược thành hướng thế giới trong `input {x, y, s}`; bấm nền đất thì client chỉ lái hướng đi theo vị trí dự đoán (mục 5.11 "Điều khiển"). Hướng nhìn 8 phía do client tự suy (mục 5.11 "8 hướng"); đứng yên thì theo `dir` / `face` của server.
- Hồn sư: animation `{sheet}:{animation}_{s|se|e|ne|n}` (`honsuAnimKey`; thân LPC hiện 4 hướng gần nhất qua `lpcFace`), gốc và cỡ lớp theo texture (`fitHonsuLayer`), khung phụ thể `vohonFrame`, nửa sheet theo giới `vohonHalf`. NPC dùng sheet LPC `lpc_<mã>` nếu có, không thì thân LPC ghép từ `looks`; dân thường trang trí (`client/src/crowd.ts`) chỉ ở client, không gửi gì lên server, không có trong state (mục 5.11 "NPC phụ và dân thường").
- `?view=topdown`: vẽ nhìn thẳng (cùng đường code, ma trận chiếu khác) để so sánh / khắc phục.

Vật đứng có `clip` trong `iso/tiles.json` dùng dải khung ghép cùng thân tĩnh, cỡ khung và điểm chân giữ nguyên. `IsoMap` chia sẻ các khung texture/atlas giữa các thực thể, đổi khung theo đồng hồ scene; không thêm Sprite hoặc timer riêng. Mức hiệu ứng Thấp (kể cả tự hạ mức) và Giảm chuyển động dừng ở khung đầu, thay đổi cài đặt có hiệu lực ngay. Cất khối thì bỏ đăng ký clip; thiếu clip vẫn dùng ảnh tĩnh. Hai clip thí điểm `lua_trai` và `dai_phun_nuoc` đã được chủ repo duyệt ở #1501; không đổi va chạm hoặc luật server.

Sau khi chủ repo duyệt thí điểm, `lo_ren_lang` dùng cùng đường clip, không tăng số Image/Sprite cho công trình; chỉ vùng lửa miệng lò thay đổi, kết cấu trong và ngoài vùng được khóa theo ảnh gốc. Nguồn và kiểm bất biến ở `art/src/prop-clip/lo_ren_lang/`, `tools/assets/prop-clip.test.mjs`.

`lo_lua_dong` dùng cùng cơ chế; chỉ lửa phía trên bát chuyển động, thân và chân đế giữ nguyên qua từng khung. Lớp thân xóa cả viền lửa cũ và giữ nền than đục ở miệng bát để không có viền đứng yên hoặc lỗ nhìn xuyên nền. Dải 768×64 dùng chung trong atlas; các instance mới không thêm texture hoặc Sprite riêng.

**Dự đoán chuyển động phía client**
- Va chạm ô và bước đi dùng chung `shared/move.ts` (`solidGrid`, `hits`, `moveEnt`) ở cả `server/src/map.ts` và client. Bước đi của hồn sư có lách góc (`MOVE_NUDGE`, tham số `nudge` của `moveEnt`): vướng góc ô chỉ vài pixel thì tự đẩy sang phía trống, server và dự đoán cùng gọi nên không lệch. Client vẫn chỉ gửi hướng; server tự tính vị trí trong `tick()`.
- Client đánh số input `input {x, y, s, w}` (`w`: giữ Shift, đi bộ); server ghi `PlayerState.seq` (số cuối đã nhận), `seqT` (số giây hướng đó đã được áp), `spd` (tốc độ thật lúc này, đã nhân `RUN_MULT` khi đang chạy), `calm` (ngoài giao chiến) và `walk` (cờ `w` của input cuối). Server tự dừng hướng đi thì tăng `seq`.
- Mỗi bước dự đoán nhớ cờ đi bộ của nó; tốc độ bước tính lại từ `spd`, `calm`, `walk` (`stepSpeed`), nên giữ / nhả Shift không làm hình giật. Vào giao chiến khi đang chạy (server quyết định) thì đang đi chỉ thu độ lệch chậm (`SMOOTH_MOVING`), hình chậm lại cho server đuổi kịp, không giật lùi.
- **Bản vá state gửi ngay sau mỗi nhịp `tick()`** (`patchRate = 0`, `broadcastPatch()` cuối mỗi nhịp `TICK_RATE`), không theo hẹn giờ riêng: input tới client chậm nhất một nhịp và mỗi bản vá mang đúng một bước mô phỏng.
- Animation đi của hồn sư chạy nhanh / chậm theo tốc độ (chính mình theo tốc độ dự đoán, người khác theo `spd`); hồn thú có sheet đi nhanh hơn khi đuổi. Animation đánh / hồn kỹ giữ nhịp vẽ.
- `client/src/predict.ts` (`Predictor`): mỗi khung tự đi trước, mỗi lần state về thì lấy vị trí server, bỏ phần input server đã áp rồi phát lại phần còn lại; lệch nhỏ thì trượt dần, lệch lớn (bị kéo, đi cổng, hồi sinh) thì đặt thẳng. Người chơi khác và hồn thú nội suy về vị trí server.
- `?nopredict` tắt dự đoán; `?lag=<ms>` giả trễ mỗi chiều (thêm `?debug` thì góc màn hình ghi chế độ; khung đỏ là vị trí server). Kiểm thử không cần server (dự đoán, chạy / đi bộ, tìm đường A*): `npm run test:predict --prefix client`.

## Khóa localStorage của client
Mọi khóa đều là tùy chọn riêng của trình duyệt, không phải dữ liệu game (không gửi server, mất đi thì về mặc định). Đọc / ghi luôn bọc `try` vì trình duyệt có thể khóa lưu trữ.

| Khóa | Nội dung | Nơi đọc / ghi |
|---|---|---|
| `soul-land-fx-v1` | Tùy chọn hiệu ứng (JSON: `level`, `reduce`, `shake`, `cine`, `cutin`, `halo`, `hideHat`, `auto`) | `client/src/fxSettings.ts` (`readFxPrefs` / `writeFxPrefs`, mặc định `defaultFxPrefs`); `combatFx.ts` giữ đối tượng sống `fxPrefs`, `arenaShow.ts` và `sprites.ts` chỉ đọc |
| `soul-land-audio-v1` | Âm lượng / bật tắt âm thanh | `client/src/audio/settings.ts` |
| `shh-ui-scale` | Cỡ giao diện (`auto` hoặc hệ số; chưa lưu = 100%) | `client/src/uiArt.ts` |
| `soul-bag-order` | Thứ tự sắp xếp túi đồ | `client/src/bag.ts` |
| `soul.radar.mode`, `soul.radar.zoom` | Chế độ và mức thu phóng radar | `client/src/radar.ts` |
| `shh-token`, `shh-name` | Token đăng nhập và tên điền sẵn | `client/src/main.ts` (qua `storage` ở `net.ts`) |
| `shh-hat` | Bật / tắt hạt thời tiết bằng lệnh `/hat` (`0` = tắt) | `client/src/weather.ts` (qua `storage` ở `net.ts`) |
| `shh-gtest` | Mã đăng nhập Google giả (chỉ khi server `GAME_TEST`) | `client/src/google.ts` |

Thêm khóa mới: đặt hằng khóa cạnh mô-đun sở hữu nó và thêm một dòng vào bảng này; tùy chọn dùng chung nhiều chỗ thì gom đọc / ghi vào một mô-đun như `fxSettings.ts`.
