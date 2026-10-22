---
name: anti-cheat-audit
description: Soát server-authoritative theo cách người chơi gian lận: sửa client / gửi message tay để đi nhanh, dịch chuyển, nhặt đồ xa hoặc của người khác, nhân bản đồ / Hồn Tệ khi mua bán, đi cổng, đổi kênh, bỏ qua hồi chiêu, spam, đọc dữ liệu riêng của người khác, lạm dụng hook test hay API REST. Dùng trước khi mở server cho người ngoài, khi review PR thêm message / API / phần thưởng mới, hoặc khi có báo cáo nghi gian lận. Checklist theo file server/src/rooms/*, server/src/index.ts, ratelimit.ts.
---

# Soát chống gian lận

Luật nền: `CLAUDE.md` (server-authoritative) và skill `server-feature` mục "Checklist cho mỗi message từ client". Skill này đọc ngược lại: **đóng vai kẻ gian lận** cầm client sửa được (DevTools, colyseus.js tự viết) và tìm chỗ server tin client.

Ý tưởng phỏng theo skill `security-audit` và agent `security-engineer` của [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (MIT), viết lại cho Colyseus + repo này.

## 0. Cách làm
1. Liệt kê bề mặt: `grep -n 'onMessage("' server/src/rooms/MapRoom.ts server/src/rooms/ArenaRoom.ts` và `grep -n 'app\.\(get\|post\)' server/src/index.ts`. Mỗi message / route là một dòng trong báo cáo, **kể cả dòng không có lỗi** (ghi "đã đọc, ổn"), để người sau biết cái gì đã soát.
2. Với mỗi handler: đọc tới tận chỗ đổi state / ghi DB, hỏi "gửi giá trị lạ thì sao?" (`NaN`, `Infinity`, số âm, số thực, chuỗi, mảng, object lồng, object tùy ý (đổi kiểu bằng `Number()` / `String()` có thể ném lỗi), thiếu trường, id của người khác, gửi 50 lần trong một nhịp, gửi lúc đang đi cổng / gục / hấp thụ / trong vùng an toàn).
3. Nghi ngờ thì **thử thật** bằng bot: thêm kiểm tra vào `client/scripts/bot-test.mjs` gửi message xấu và kỳ vọng bị từ chối (mẫu: các dòng `ngoại hình sai … -> 400`). Không kết luận "an toàn" chỉ vì grep không thấy gì.

## 1. Checklist theo cách gian lận
**Di chuyển, dịch chuyển** (`input` trong `MapRoom.onCreate`, `tick`, `shared/move.ts`)
- [ ] Client chỉ gửi hướng; `clampDir` kẹp độ dài ≤ 1; vị trí do `tick()` tính từ `PLAYER_SPEED` / `RUN_MULT`. Không message nào nhận `x, y` của hồn sư từ client (ngoài hook test).
- [ ] `seq` chỉ để đối chiếu dự đoán, không ảnh hưởng vị trí. Va chạm (`hits`) và vùng an toàn kiểm ở server.
- [ ] Đi cổng / truyền tống (`travel`, `wp`): kiểm đứng trong cổng / gần trận, đủ phí, hết niệm (`TRAVEL_CAST`, `WAYPOINT_CAST`); bị đánh thì hủy niệm.

**Chiến đấu, hồi chiêu** (`attack`, `skill`, `chanthan`, `boneskill`, `switch`)
- [ ] `ATTACK_CD`, hồi chiêu hồn kỹ, `SWITCH_CD`, hồn lực đều đếm ở server; gửi dồn nhiều lần trong một nhịp chỉ ra một đòn.
- [ ] Chỉ số `i` / `rowId` được kẹp và tra trong dữ liệu của chính người gửi (`pdata`), không tin chỉ số mảng thô.
- [ ] Sát thương, trúng, chí mạng, rơi đồ chỉ tính ở server (`Math.random()` server); không nhận mục tiêu "đã trúng" từ client.

**Nhặt đồ, phần thưởng** (`pickup`, `killBeast`, `newDrop`, `canLoot`, `grantChest`, `quest`, khảo hạch `DAILY`)
- [ ] `pickup` kiểm `PICKUP_RANGE` theo vị trí server, quyền nhặt `canLoot` (thời gian ưu tiên `DROP_OWNER_SECS`, tổ đội), túi còn chỗ.
- [ ] Phần thưởng có lượt (boss `store.claimBoss`, `DAILY`, nhiệm vụ) ghi lượt **trong chuỗi lưu** `this.chain(d, fn)` trước khi cộng đồ; hai tab / hai phòng không nhận hai lần.

**Mua bán, nhân bản** (`buy`, `sell`, `buyback`, `expand`, `enhance`, `enhancecore`, `starup`, `discard`, `use`, `equip*`)
- [ ] `qty` là số nguyên dương, kẹp `SHOP_MAX_QTY` / số đang có; `code` / `id` có thật và thuộc người gửi; trừ tiền / đồ **trước** khi cộng, cùng một nhịp đồng bộ.
- [ ] Không có giá mua < giá bán (vòng lặp in tiền; xem skill `balance-review`). Cộng tiền kẹp `Number.MAX_SAFE_INTEGER`.
- [ ] Đồ đang gắn / đang hấp thụ / đang dùng làm nguyên liệu không bán, bỏ hay cường hóa được đồng thời.
- [ ] **Nhân bản qua chuyển phòng:** dữ liệu chưa lưu nằm trong cả `save` lẫn `saveTravel` (`bagDirty`, `bagSnapshot`); `onAuth` chờ `waitOldSession` trước khi đọc DB; `onLeave` gọi `freeze` trước lần ghi cuối. Thử: bán / nhặt ngay trước khi đi cổng hoặc đổi kênh, đăng nhập lại ở tab khác giữa chừng.
- [ ] Giao dịch người với người: hiện **chưa có**. Khi thêm, cả hai bên khóa đồ, xác nhận hai lần, đổi chủ trong một transaction DB.

**Tần suất, spam** (`server/src/ratelimit.ts`, `npm run test:ratelimit --prefix server`)
- [ ] Đăng nhập khóa theo cặp tên + IP, theo tên, theo IP; `TRUST_PROXY` chỉ bật sau proxy thật.
- [ ] Matchmake HTTP (`joinOrCreate`, `joinById`) giữ chỗ / mở kênh trước WebSocket: chỉ khi `static onAuth` (`seatAccount`) đã kiểm token, số chỗ đang giữ của tài khoản và bản đồ (#235). Phòng mới cần kiểm tương tự trước khi giữ chỗ.
- [ ] Chat, lời mời tổ đội có token bucket; `channels`, bảng xếp hạng, lệnh tốn DB có nhịp riêng. Message rẻ (`input`) gửi dồn chỉ ghi đè ý định, không tốn thêm việc.

**Lộ dữ liệu**
- [ ] Dữ liệu riêng (túi, Hồn Tệ, đội hình, nhiệm vụ…) chỉ gửi bằng tin riêng, không nằm trong `schema.ts`. Hồn sư / hồn thú / đồ rơi ở xa không lọt qua state (`interest.ts`, `SYNC_VIEW`); tin `mini` chỉ có vị trí theo ô.
- [ ] Tin `fx` / `dmg` / `log` không kèm dữ liệu riêng của người khác.
- [ ] API REST cần `token` (trừ `/api/login`, `/health`); `express.json` giới hạn cỡ; không trả `password` / hash / token người khác; lỗi không lộ stack.
- [ ] Không có key, mật khẩu, chuỗi `DATABASE_URL` trong repo, log, PR (`git grep -nIiE 'postgres(ql)?://[^ ]*:[^ ]*@|api[_-]?key|secret'`, đọc từng kết quả).

**Hook kiểm thử**
- [ ] `testHook` trả `enabled: false` khi không `GAME_TEST=1`; mọi đường tắt khác cho bot (`CHANNEL_MAX` hạ, `BOSS_CLOCK`, `testRoll`, lệch ngày) cũng chỉ có hiệu lực khi `GAME_TEST=1`. Server thật không bật `GAME_TEST`.

**Phòng đấu trường** (`ArenaRoom.ts`)
- [ ] Message không dùng trong trận nằm trong `BLOCKED`; hành động giao chiến chỉ chạy khi `phase === "fight"`; không tự xếp cặp với bạn để cày Elo / thưởng (`arenaQueue.ts`).

## 2. Báo cáo
Mỗi phát hiện: mức (**Nghiêm trọng**: nhân bản đồ / tiền, sửa vị trí, đọc dữ liệu riêng người khác, lộ bí mật; **Cao**: bỏ qua hồi chiêu / phí / lượt; **Vừa**: thiếu kẹp giá trị có tác động giới hạn, spam làm chậm phòng; **Thấp**: phòng thủ thêm), file:dòng, cách tấn công cụ thể, cách sửa. Kèm danh sách message / route đã soát.

## 3. Sau báo cáo
- Lỗi khai thác được: tạo issue (skill `playtest-triage`, mẫu "Lỗi", nhãn `gameplay`). **Không ghi cách khai thác chi tiết trong issue công khai** nếu server đang mở cho người ngoài; báo chủ repo / orchestrator trước.
- Sửa theo skill `server-feature`; thêm kiểm tra bot gửi message xấu để lỗi không quay lại; `npm run check` + bot `GAME_TEST=1`.
