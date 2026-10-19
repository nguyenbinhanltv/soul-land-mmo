---
name: client-ui
description: Quy tắc khi sửa giao diện và điều khiển phía client (client/src: GameScene.ts, hud.ts, main.ts, textures.ts, index.html, style.css). Dùng khi hiển thị trường đồng bộ mới, thêm nút/phím, HUD, hiệu ứng fx, màn hình đăng nhập/thức tỉnh hoặc điều khiển chạm.
---

# Giao diện phía client

Client **chỉ hiển thị và gửi input**. Không tính máu, sát thương, rơi đồ, kết quả hấp thụ hay vị trí thật ở client; mọi luật nằm ở server (skill `server-feature`).

## Bản đồ file
- `client/src/main.ts`: đăng nhập, tạo nhân vật, thức tỉnh (gọi `/api/...` qua `post()` trong `net.ts`), `joinOrCreate("map", { token, mapId })` với `mapId` lấy từ `/api/login` / `/api/me` (server lưu bản đồ đang đứng; client không tự chọn bản đồ), chờ state đầu tiên rồi mở `GameScene` qua `play()`. Nhận `travel {mapId}` thì `play()` rời phòng, hủy Phaser và `join()` lại phòng mới. Bộ nghe gắn vào `window`/DOM trong `GameScene` phải truyền `{ signal: this.ac.signal }` để được gỡ khi đổi bản đồ. Gắn class `touch` lên `body` khi `matchMedia("(pointer: coarse)")`.
- `client/src/scenes/GameScene.ts`:
  - `preload()` tải file Tiled `shared/assets/<mapId>.json` theo `mapId` (vite phục vụ `shared/assets` làm thư mục public). Tên vùng lấy từ layer `zones` của file đó.
  - `update()` đọc `this.room.state` mỗi khung hình (`st.players`, `st.beasts`, `st.drops`) rồi nội suy sprite. Trường mới thêm ở `server/src/rooms/schema.ts` thì đọc ở đây.
  - `setupMessages()` nhận `log`, `chat`, `dmg`, `fx`; `fx(m)` vẽ hiệu ứng theo `m.k`. Message riêng mới từ server cũng đăng ký ở đây.
  - `setupInput()` (bàn phím + joystick), `act()` gửi `attack` / `pickup` / `skill {i}` / `switch {slot}`, `sendInput()` gửi `input {x,y}` chỉ khi hướng đổi. Túi đồ gửi `use {id}`, `absorb {itemId}`, `discard {id}` qua `renderBag()`.
  - `setupMessages()` nhận thêm tin riêng `vohons` (bộ sưu tập, đội hình, võ hồn ra trận) để vẽ bảng đội hình và thanh đội hình, `squad` (sinh lực từng võ hồn, võ hồn đã gục, năng lượng tiên cơ), `ko` (banner khi võ hồn gục / cả đội gục), `portal` (hộp đi cổng) và `travel` (server cho chuyển bản đồ).
- `client/src/hud.ts`: HUD bằng HTML: `updateStats`, `buildSkills` (phím `SKILL_KEYS`), `buildTeam` / `setSquad` / `updateTeam` (thanh đội hình 4 ô: sinh lực và năng lượng tiên cơ từng ô, ô đầy năng lượng sáng viền, ô đã gục kèm giây hồi, hồi chiêu đổi), `renderRoster` / `toggleRoster` (bảng xếp đội), `renderBag` / `toggleBag` / `updateBag` (túi đồ, Hồn Tệ, hồi chiêu chung đan; từ 3.1), `log`, `banner`, `showTarget`, `showPrompt`, `showPortal` (hộp đi cổng), `ringColor`.
- `client/index.html` + `client/src/style.css`: khung HUD (`#hud`, `#skills`, `#chatbox`, `#joy`/`#knob`, `#overlay`). Kiểu riêng cho chạm dùng `body.touch ...`.
- `client/src/textures.ts`: sprite pixel vẽ bằng code (`makeTextures`, `looksTextures`, `vohonTextures`); hình hồn sư và phụ thể vẽ trong `client/src/honsuArt.ts`, nền tảng sheet/animation/hoán màu ở `client/src/sprites.ts` (mục 5.11).

## Quy tắc
1. **Gửi ý định, không gửi kết quả**: chỉ `this.room.send("<loại>", { ...tham số nhỏ })` như hướng đi, chỉ số ô kỹ năng, id món đồ. Server tự kiểm tra lại.
2. **Hiển thị từ state/message của server**. Hiệu ứng chỉ để đẹp (tween, rung camera) thì được làm ở client, nhưng không được đổi trạng thái game.
3. **Số liệu hiển thị** (màu niên hạn, tên võ hồn, giới hạn vòng) import từ `shared/data.ts` (ví dụ `TIERS`, `ringLimit`, `VOHON`). Không chép số sang client.
4. **Ưu tiên máy tính**: chuột và phím là chính. Phím hiện có: WASD/mũi tên đi, J/Space đánh, U/I/O/P hồn kỹ 1–4, 1–4 đổi võ hồn trong đội, V bảng đội hình, B túi đồ, E nhặt hồn hoàn (từ 3.2; hấp thụ bằng nút trong túi đồ), F đi qua cổng đang đứng, Enter chat. Phím mới không được trùng và phải bỏ qua khi đang gõ chat (xem cách `chat` focus xóa `this.keys`).
5. **Chạm cho mobile khi hợp lý**: nút dùng `pointerdown` + `e.preventDefault()` (như `buildSkills`), bố cục chạm qua `body.touch`. Tính năng chỉ cần trên máy tính thì ghi rõ trong mô tả việc.
6. **Chữ trên giao diện bằng tiếng Việt** có dấu đầy đủ, font `"Be Vietnam Pro"` như các text hiện có. Dùng đúng tên gốc Đấu La (võ hồn, hồn thú, địa danh) theo `GAME_DESIGN.md`.
7. Dữ liệu riêng của chính chủ (túi đồ, danh sách võ hồn) chỉ đến qua message riêng; không giả định đọc được túi đồ người khác.

## Xong thì
`npm run check` (typecheck client), bật `npm run dev:server` + `npm run dev:client` rồi mở `http://localhost:5173` thử bằng chuột/phím, và giả lập chạm nếu có sửa điều khiển mobile. Sau đó `npm run bot --prefix client`.
