---
name: soak-perf
description: Chạy dài nhiều bot trên bản đồ lớn (bản ×8 mặc định; đối chứng bản cũ bằng MAP_V1) để đo hiệu năng server và tìm rò bộ nhớ: thời gian tick / bản vá (PERF_LOG=1), băng thông mỗi client, RSS / heap của tiến trình Node, số phòng còn sống sau khi bot rời. So với số đo của bước 11.4 (PR #129). Dùng khi thêm vòng lặp / truy vấn theo vị trí / Map mức tiến trình vào server, đổi đồng bộ (schema.ts, interest.ts, SYNC_VIEW), trước khi mở server cho nhiều người, hoặc khi nghi server chậm dần / phình bộ nhớ.
---

# Chạy dài và đo hiệu năng

Mục tiêu: chứng minh bằng **số đo** rằng server giữ nhịp `TICK_RATE` (20 nhịp/giây, 50 ms mỗi nhịp) với nhiều người trên bản đồ lớn, và bộ nhớ không tăng mãi. Không có số đo thì báo cáo ghi **Chưa đo**, không ước lượng rồi kết luận "ổn".

Ý tưởng phỏng theo skill `soak-test`, `perf-profile` và agent `performance-analyst` của [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (MIT), viết lại cho Colyseus + repo này.

## 1. Mốc so sánh (11.4, PR #129)
Bản đồ ×8, server `GAME_TEST=1 PERF_LOG=1`, bot đi lang thang:
| Cấu hình | tick + bản vá (ms/nhịp) | bản vá mỗi client |
|---|---|---|
| 12 bot rải đều | ~2–5 | ~7–8 KB/s |
| 40 bot rải đều | ~7 | ~8 KB/s |

Số đo mới hơn (tự săn, thú vương, tông môn, vào ra; 20 / 40 / 60 bot; heap, CPU): `docs/tech/hieu-nang-soak.md` (#167).

Ngưỡng báo động: trung bình tick + bản vá vượt ~10 ms, `max` thường xuyên vượt 50 ms (trễ nhịp), băng thông mỗi client tăng theo tổng số thực thể cả bản đồ (lọc view hỏng).

## 2. Chuẩn bị (mọi thứ ngoài repo)
- Server riêng, cổng riêng, không watch: `GAME_TEST=1 PERF_LOG=1 PORT=2650 npm start --prefix server` (chạy nền, ghi log ra file trong thư mục artifact). Đo heap thì thêm `NODE_OPTIONS=--inspect=127.0.0.1:9250` (không dùng 9333 là CDP Chrome của phiên khác).
- Bản đồ ×8 (11.3 / 11.5) là mặc định; đo bản cũ để so thì server và bot cùng `MAP_V1=<mapId>,…|all`. Kiểm nhanh bản ×8 bằng `BOT_ONLY=bigmap SERVER_URL=http://localhost:2650 npm run bot --prefix client`.
- **Bot tải** là script riêng ở thư mục artifact (không đưa vào repo), import `colyseus.js` từ `client/node_modules`, làm theo luồng của `bot()` / `enter()` trong `client/scripts/bot-test.mjs`: `POST /api/login {name, password}` → `/api/looks` → `/api/awaken` → `new Client(WS).joinOrCreate("map", {token, mapId})`. Đưa tới bản đồ ×8 bằng hook `test {op: "warp", mapId, x, y}`, rải vị trí. Mỗi bot gửi `input` hướng ngẫu nhiên mỗi 0,5–2 giây, thỉnh thoảng `attack` / `skill`.
- Bot tải **không** gửi `test {op: "view", all: true}` (tắt lọc view của bot kiểm thử), nếu không sẽ đo sai băng thông.
- Ghi lại: commit, số bot, cách rải (đều / theo nhóm), máy, có Chrome / bot khác chạy cùng không (nhiễu lớn).

## 3. Kịch bản
| Loại | Thời lượng | Tìm gì |
|---|---|---|
| Ngắn | 15–30 phút, 12 rồi 40 bot | tick / bản vá so mốc 11.4 |
| Dài | 1–2 giờ, 40 bot | tick chậm dần, RSS tăng đều |
| Vào ra | 30 phút, bot vào / rời / đổi kênh (`channel`) / đi cổng (`warp`) liên tục | rò theo phiên, phòng không bị hủy |

Mỗi 5–10 phút ghi một dòng: phút, dòng `[perf]` gần nhất (`tick`, `patch`, `max`, `beasts (awake)`, `players`), RSS, số byte bot nhận trong 10 giây chia số bot, lỗi trong log server.
- RSS: Windows `Get-Process -Id <pid> | Select WorkingSet64` (PID của tiến trình `node` đang nghe cổng: `netstat -ano | findstr :2650`); Linux / macOS `ps -o rss= -p <pid>`.
- Băng thông: bot tải đếm byte của mọi tin WebSocket nhận được.

## 4. Tìm rò bộ nhớ
1. Sau khi mọi bot rời: phòng trống tự hủy (`onDispose`), RSS / heap phải về gần mức sau khởi động (cho GC chạy vài phút). Không về thì có rò.
2. Heap snapshot qua `--inspect` (Chrome `chrome://inspect` → Memory): chụp lúc ổn định, sau 30 phút, sau 60 phút; so "Objects allocated between snapshots", lọc theo constructor tăng đều (`Map`, `PData`, `Client`, closure).
3. Nghi phạm theo kiến trúc repo:
   - `Map` mức tiến trình sống lâu hơn phòng: `kingSeats`, `kingWarns`, `channelsInUse`, `channelSwitchAt`, `leftRoom`, `buybacks` (`MapRoom.ts`); `live`, `byName`, `parties`, `invites` (`party.ts`); `queue`, `arenaMatches`, `lastFoe` (`arenaQueue.ts`); bộ đếm `ratelimit.ts` (dọn mỗi `SWEEP_MS`). Mục có xóa khi hết hạn / rời không?
   - Trong phòng: `pdata` / `bdata` / `coreDrops` xóa khi rời / hồn thú chết; hàng đợi `later()` (`timers`) không giữ closure của người đã rời; `StateView` của client rời được bỏ.
   - Bộ đệm mã hóa `Encoder.BUFFER_SIZE` 1 MB **mỗi phòng** (11.4) là có chủ đích: nhiều kênh mở thì RSS tăng theo số phòng, không phải rò.
4. Tìm thấy rò: tái hiện bằng kịch bản Vào ra ngắn nhất có thể, sửa (skill `server-feature`), chạy lại cùng kịch bản để so trước / sau.

## 5. Tìm điểm nóng tick
- Nhịp chậm (`max` > 50 ms, trường `slow` của dòng `[perf]`): đọc dòng `[perf-slow]` cùng lúc. CPU luồng chính nhỏ hơn nhiều so với `wall` là máy đo bị chiếm CPU (nhiễu, không phải server); `gc` lớn là GC; CPU gần bằng `wall` thì xem đoạn nào lớn nhất (người = tự săn / người chơi, thú, thế giới, cuối = sinh lại / bản đồ nhỏ / lưu định kỳ, view, vá). `gap` lớn mà nhịp nhanh là việc ngoài tick (tin nhắn, chuỗi lưu, phòng khác) chặn vòng lặp sự kiện. Ghi kèm CPU / RAM toàn máy lúc đo.
- So `tick` với `patch`: `patch` cao là đồng bộ (trường mới trong `schema.ts`, lọc view `interest.ts`); `tick` cao là luật chơi.
- Profile CPU qua `--inspect` (Chrome → Performance / Profiler) trong 30 giây có tải. Nghi trước: vòng lặp duyệt mọi hồn thú / hồn sư thay vì `beastsNear` / lưới không gian; hồn thú không ngủ (`awake` gần bằng `beasts` khi người chơi tụ một chỗ là bất thường); cấp phát mảng / object mới mỗi nhịp; `JSON.stringify` / `structuredClone` trong `tick`.

## 6. Báo cáo
Bảng số theo thời gian (mục 3), so với mốc mục 1, kết luận **Đạt / Không đạt / Chưa đo (thiếu gì)**, nghi phạm kèm file:dòng. Ghi vào mô tả PR (mục Kiểm thử) hoặc comment issue; log thô và script bot tải để ở thư mục artifact, không commit. Tắt đúng các tiến trình mình đã bật.
