# Soát chống gian lận, cân bằng, hiệu năng: Bí Cảnh Luyện Hồn Cảnh (#877, bước P6)

Soát theo skill `anti-cheat-audit`, `balance-review`, `soak-perf`. Phạm vi: MVP Luyện Hồn Cảnh solo đã gộp ở P1–P5: `server/src/rooms/bicanh.ts` (tin `bicanh` `get` / `enter` / `buy`, ngày Bí Cảnh 05:00, vé giữ chỗ), `server/src/rooms/BiCanhRoom.ts` (phòng, sóng, chốt kết quả, thưởng quyển, hoàn lượt), `store.claimBoss` / `releaseBoss` của `PgStore` và `MemoryStore`. Thiết kế: `docs/design/bi-canh.md` mục 5.22. Ngày soát 2026-10-29, trên `main` tại `e994e908`. Không có SQL mới (lượt và quyển nằm ở `boss_claims`).

## Tóm tắt

Không có lỗi **Nghiêm trọng** hay **Cao**: không nhân được thưởng, không vào phòng hai lần, không lấy lại lượt, không lách được trần ngày hay đồng hồ. Có một lỗi **Vừa** (cân bằng / thiệt cho người chơi) và hai phòng thủ thêm, **đã sửa trong cùng PR**; còn lại là các điểm **Thấp** chấp nhận hoặc chờ chủ repo.

| # | Mức | Phát hiện | Trạng thái |
|---|---|---|---|
| 1 | Vừa | Mua thêm lượt bằng Hồn Tệ khi **quyển ngày đã chạm trần** là trả tiền cho lượt không có thưởng. Với số hiện tại ba lượt miễn phí thắng hết đã đủ trần (`BICANH.scenes[].runs` × `bicanhRunTomes` = `BICANH.tomeDailyCap`), nên **ba lượt mua** (tổng 14 300 Hồn Tệ) chỉ có giá trị khi các lượt trước thua / rời sớm | **Đã sửa**: `buy` từ chối, không thu phí, khi quyển ngày đã đủ trần (`bicanh.ts`, bot `bicanhRoom.mjs`). Cân lại trần: xem bảng đề xuất, chờ chủ repo |
| 2 | Thấp | Tin `tong`, `looks`, `coreset`, `channel` không nằm trong danh sách chặn của `BiCanhRoom`. Vô hại hiện nay (sân không có NPC nên cần-gần-NPC đều từ chối; `state.channel` rỗng nên đổi kênh từ chối), nhưng nếu sau này sân có NPC hay kênh thì đổi túi / Hồn Tệ giữa lúc chốt thưởng | **Đã sửa** (phòng thủ thêm): thêm vào `ROOM_BLOCKED`; bot `bicanhSoat.mjs` gửi cả nhóm tin này trong phòng |
| 3 | Thấp | `lastEnterDay` (chặn `enter` khi đồng hồ máy chủ lùi) chỉ nằm trong RAM tiến trình: tắt / bật lại server thì mất mốc. Không khai thác được ở mức người chơi (cần đồng hồ máy chủ lùi cả ngày **và** khởi động lại; lượt vẫn có trần theo `boss_claims` của ngày đó, chỉ ngày chưa chơi mới có lượt tươi) | Chưa sửa, chấp nhận (khác Phúc Lợi vốn có `last_at` trong DB; nếu muốn đồng nhất cần SQL, xem câu hỏi mở) |
| 4 | Thấp | Túi đầy lúc chốt (`full` ở `finish`) thì mất lượt và quyển. `enter` đã kiểm chỗ trước khi trừ lượt và trong phòng túi không đổi (đóng băng + tin túi bị chặn), nên chỉ xảy ra khi túi bị đổi bởi phiên khác của cùng tài khoản | Chưa sửa; là câu hỏi mở 3 của `bi-canh.md` |
| 5 | Thấp | Lỗi DB sau khi giao dịch đã COMMIT nhưng báo lỗi về (mất kết nối đúng lúc đó) thì `releaseRun` hoàn lượt dù quyển đã ghi: được cả hai một lần. Cần sự cố DB đúng khoảnh khắc, người chơi không gây ra được | Chưa sửa, chấp nhận (cùng loại với các đường `claimBoss` khác) |
| 6 | Thấp | `joinOrCreate("bicanh")` không vé vẫn dựng một `Room` rồi ném 400 ở `onCreate` (mỗi lần chỉ tốn một lần dựng, token hợp lệ vẫn bắt buộc, `seatAccount` giới hạn chỗ giữ). Cùng mức với `arena` | Chưa sửa, chấp nhận |

Phần còn lại là giả thuyết **không khai thác được** (bảng dưới), đều có bài bot.

## Giả thuyết đã thử

| Giả thuyết | Kết quả | Chứng cứ |
|---|---|---|
| Dồn `enter` 200 lần / hai tab để nhân lượt hoặc mở nhiều phòng | **Chặn đúng**: `claimHeld` + `claimBusy`, vé `bicanhTickets` mỗi tài khoản một, `claimBoss` nguyên tử có trần = lượt miễn phí + đã mua | `bicanhRoom.mjs` (một tin `found` trong 200 `enter`); `bicanhSoat.mjs` (`enter` + `buy` + `enter` nối nhau: đúng một phòng, Hồn Tệ khớp số lượt mua) |
| Tranh `buy` với `enter` | **Chặn đúng**: cả hai kiểm `claimHeld` đồng bộ rồi tăng `claimBusy` trước khi vào `chain`; tin sau bị từ chối | `bicanhSoat.mjs` |
| Mua lượt vượt trần `buyMax`, race hai tiến trình | **Chặn đúng**: `buyMax` kiểm trong câu ghi (`claimBoss`); hoàn tiền khi DB từ chối / lỗi | `bicanh.mjs`, `bicanh-test.ts` (dồn 20 `claimBoss`) |
| Người khác vào phòng của chủ vé (`joinById` mã phòng) | **Chặn đúng**: `seatAllowed` / `checkJoin` so `accountId` với vé | `bicanhSoat.mjs` |
| `joinOrCreate` / `create("bicanh")` không vé, vé giả, token lạ | **Chặn đúng**: `onCreate` ném 400 khi vé không có / đã dùng; `create` không nằm trong `exposedMethods`; phòng `setPrivate` | `bicanhSoat.mjs` |
| Chủ vé vào hai lần (hai tab) | **Chặn đúng**: `seatAllowed` đòi `!ticket.joined`; phiên đầu giữ nguyên | `bicanhSoat.mjs` |
| Vào lại phòng đã chốt bằng mã phòng cũ | **Chặn đúng**: `done` / `ticket.settled` | `bicanhSoat.mjs` |
| Rời giữa chừng để nhận thưởng hai lần hoặc lấy lại lượt | **Chặn đúng**: `finish` chạy một lần (`done`, `settled`); rời giữa chừng giữ đúng phần sóng đã hạ, lượt không hoàn; rời lúc đếm ngược: không quyển, lượt không hoàn | `bicanhRoom.mjs` mục 4, `bicanhSoat.mjs` mục 4 |
| Không vào phòng để mất lượt rồi nhận lại | Lượt được hoàn **một lần** (`refundRun` đánh dấu `settled`), người chơi chưa nhận gì | `bicanhRoom.mjs` mục 6b |
| Vượt trần quyển ngày bằng nhiều lượt thắng | **Chặn đúng**: `finish` kẹp `Math.min(tomes, cap − đã nhận)` rồi `claimBoss` kiểm trần trong câu ghi (hai phòng hai tiến trình cũng không vượt) | `bicanhRoom.mjs` mục 6 |
| Lỗi ghi DB lúc chốt để vừa có quyển vừa hoàn lượt | **Đúng**: ghi trên bản sao túi, chỉ gán lại sau khi DB xác nhận; lỗi thì không quyển và hoàn lượt đúng một lần | hook `savefail` ở `bicanhRoom.mjs` |
| Đổi giờ máy / múi giờ | **Không khai thác được**: client không gửi giờ; ngày từ `bossNow()` + `dayShift` (chỉ `GAME_TEST=1`) qua `bicanhDay` | `bicanh.mjs`, `bicanh-test.ts` |
| Đồng hồ server lùi | **Chặn đúng** trong một lần chạy tiến trình (`lastEnterDay`, mục 3 bảng trên) | `bicanhRoom.mjs` mục 7 |
| Bỏ qua kiểm tra điều kiện vào (giao chiến, gục, hấp thụ, đi cổng, xếp hàng đấu trường, túi đầy, hết lượt, phòng đông) | **Chặn đúng, trước khi trừ lượt** | `bicanhRoom.mjs` mục 1, 2, 5 |
| Gửi tin ngoài trận trong phòng (mua, bán, đi cổng, túi, đấu trường, `bicanh` lồng) | **Chặn đúng** (`BLOCKED` + `ROOM_BLOCKED`) | `bicanhRoom.mjs`, `bicanhSoat.mjs` (cả `channel`, `tong`, `looks`, `coreset`, `party`, `friend`, `chat`: túi, Hồn Tệ, vị trí không đổi) |
| Hạ hồn thú trong phòng để lấy kinh nghiệm / Hồn Tệ / đồ rơi | **Không có**: `killBeast` chỉ tính sóng | `bicanhRoom.mjs` mục 2 |
| Đổi võ hồn giữa sóng để hạ độ khó | **Không có**: `ringsLocked` chốt một lần lúc vào | `bicanhRoom.mjs` mục 2 |
| Hook `bcfast` / `day` / `slay` trên server thật | Chỉ có hiệu lực khi `GAME_TEST=1` (`testHook` của `BiCanhRoom`, `gm.ts`) | đọc mã |
| Nuôi nhiều tài khoản | Quyển không giao dịch, trần theo tài khoản: nhiều tài khoản chỉ bằng nhiều người chơi thật | thiết kế mục 5.22 |

## Danh sách bề mặt đã soát

| Tin / route | Kết quả |
|---|---|
| `bicanh {op:"get"}` | Đã đọc, ổn: nhóm `read` + `room.ask` (gộp theo `ASK_CD`), chỉ trả dữ liệu của chính chủ |
| `bicanh {op:"enter", id}` | Đã đọc, ổn (bảng trên); phát hiện: mục 3, 4 |
| `bicanh {op:"buy", id, pay}` | Đã đọc; phát hiện mục 1 (**đã sửa**) |
| Tin lạ / `id` lạ (`null`, `{}`, `"__proto__"`, số) | Ổn: `bicanhScene` tra whitelist, chỉ trả `err` |
| Tin server → client `bicanh {k:"found"|"ready"|"fight"|"wave"|"clear"|"end"}` | Ổn: gửi riêng cho chủ phòng, không kèm dữ liệu người khác |
| `BiCanhRoom` (`onCreate`, `checkJoin`, `seatAllowed`, `onJoin`, `onLeave`, `onDispose`, `finish`, `cancel`, `tick`) | Đã đọc, ổn (bảng giả thuyết); mục 4, 5 |
| `testHook` `bcfast` | Chỉ `GAME_TEST=1` |
| Tin `quest`, `partyAction` trong phòng | Ổn: `quest` chỉ `get`; `party` chặn mời / nhận |
| Route REST | Không có route mới |
| SQL | Không có (không đổi bảng) |

## Cân bằng (`balance-review`)

Đã đọc: `BICANH`, `bicanhRunPrice`, `bicanhRunTomes`, `xpNeed`, `RING_LIMIT`, `beastStats`, `BEAST_COIN`, `BAG_EXPAND_COST`, `SHARD_BUY`, `AUTO_DAILY_SECS`, `XP_SHARE_BENCH`; thiết kế mục "Kinh tế" của `bi-canh.md`. Số lấy lúc soát; `server/scripts/bicanh-test.ts` kiểm các **quan hệ**, không chép số.

Kết luận: **Cần chỉnh** một mục (trần quyển so với lượt mua); phần còn lại **Ổn**. Chủ repo duyệt thang số trước khi mở đại trà; PR này **không đổi số cân bằng**.

| Hằng | Mong muốn (nguồn) | Thực tế | Vấn đề | Đề xuất |
|---|---|---|---|---|
| `tomeXp` × `tomeDailyCap` | ≤ một phần kinh nghiệm một giờ săn cùng cấp (mục "Kinh tế") | 300 × 6 = 1 800 kinh nghiệm / ngày = 0,20 giờ săn dự bị ở bậc hồn thú thấp nhất (9 200), 0,09 ở bậc 3 (20 200), 0,03 ở bậc 5 (56 800); bài `bicanh-test` đòi ≤ 1/4 | Ổn | Giữ |
| `tomeDailyCap` so với lượt | thiết kế: trần "cộng cả lượt mua thêm" | 3 lượt miễn phí × 2 quyển = 6 = trần; 6 lượt (cả mua) × 2 = 12 | Ba lượt mua (14 300 Hồn Tệ) không có thưởng nếu các lượt miễn phí thắng hết; chỉ có ích khi thua / rời sớm | Chọn một: (A) giữ trần 6, bỏ / giảm lượt mua (`buyMax`) hoặc coi lượt mua là "thử lại sau khi thua"; (B) nâng trần lên 12 = 3 600 kinh nghiệm / ngày = 0,39 giờ săn bậc thấp nhất, **vượt** ngưỡng 1/4 của bài kiểm nên phải đổi cả ngưỡng; (C) giữ nguyên số, dựa vào việc `buy` đã bị chặn khi hết trần (mục 1) và nói rõ trên poster. Đề xuất: (C) trước, quyết (A) / (B) khi chủ repo duyệt |
| `bicanhRunPrice` | lượt đầu ≥ giá trị Hồn Tệ quy đổi của thưởng một lượt; tăng đơn điệu; cùng cỡ nơi tiêu Hồn Tệ khác | 3 000 / 4 500 / 6 800; quyển không bán được; một giờ săn bậc thấp nhất cho ~1 000 Hồn Tệ, bậc 3 cho ~13 750 | Không có vòng in tiền (quyển không bán / không mua lại); lượt đầu ≤ `BAG_EXPAND_COST[0]` (5 000) | Giữ. Giá cố định không co giãn theo cấp: người cấp cao mua gần như không đau, nhưng vì có trần quyển nên tác hại bằng không |
| Tổng phí mua đủ `buyMax` | không đắt hơn mua đủ mảnh Thương hội mỗi ngày | 14 300 so với 226 800 (`SHARD_BUY`) | Ổn | Giữ |
| Tổng lượt / ngày | ≤ 1/4 quỹ `AUTO_DAILY_SECS` | 6 lượt × `equivMin` = 60 phút (≤ 180) | Ổn | Giữ |
| Thưởng theo sóng | thua giữa chừng vẫn nhận phần sóng đã xong, không "mất trắng" | sóng 1: 1 quyển (4 con, 50 % giới hạn vòng kế), sóng 2: 0, sóng 3 (tinh anh): 1 | Sóng 2 (6 con, mạnh hơn sóng 1) không thưởng: rời sau sóng 2 chỉ nhận 1 quyển như rời sau sóng 1, nên không có lý do ở lại đánh sóng 2 nếu chỉ muốn quyển (vẫn phải đánh để tới sóng 3) | Cân nhắc cho sóng 2 một quyển; kéo theo tổng một lượt thắng thành 3 quyển, 3 lượt = 9 > trần 6, nên gộp vào quyết định A / B |
| Mỗi lượt: kinh nghiệm theo cấp | quyển không làm săn mất giá trị, không vượt bình cảnh | 1 800 kinh nghiệm = 13,8 cấp ở cấp 10, 1,65 ở cấp 30, 0,60 ở cấp 50, 0,43 ở cấp 59 (`xpNeed`); luôn kẹp bình cảnh | Ở cấp thấp võ hồn dự bị nhảy nhiều cấp trong một ngày, nhưng dừng ở bình cảnh (mất ý nghĩa sau 1 vòng hồn hoàn) và đúng mục đích bắt kịp của dự bị | Giữ |

Chiến thuật thoái hóa tìm thấy: mua lượt khi đã đủ quyển (mục 1) — đã chặn. Không thấy chiến thuật cày lợi hơn săn: quyển không bán, `buy` lũy tiến, thắng một lượt ≈ 2 quyển = 600 kinh nghiệm cho dự bị.

## Hiệu năng (`soak-perf`)

Bot tải ngoài repo (`bc-soak.mjs`, không commit): server riêng `GAME_TEST=1 PERF_LOG=1`, MemoryStore, máy dev Windows 11, không Chrome chạy kèm; chín tài khoản mới; mỗi người chơi vào phòng bằng `enter` thật, bắt đầu giao đấu (`bcfast`), gửi `input` ngẫu nhiên, `attack`, `skill` mỗi 250 ms trong 30 giây; đo bằng hook `perf` (tick + bản vá trung bình, lớn nhất, RSS) sau khi bỏ 2,5 giây đầu.

| Cấu hình | Phòng mở | Tick TB (ms) | Bản vá TB (ms) | Max (ms) | Hồn thú / phòng | RSS server |
|---|---|---|---|---|---|---|
| 1 phòng | 1 / 1 | 0,29 | 0,19 | 4,6 | 4 | 145 MB |
| 8 phòng song song (`BICANH.maxRooms`) + 1 người thừa | 8 / 9 | 0,11 | 0,07 | 4,6 | 3,8 | 182 MB |

- Người thứ chín bị từ chối **trước khi trừ lượt** ("Bí Cảnh đang đông…").
- Sau khi mọi phòng chốt và đóng, RSS về 181 MB (trước khi chạy 184 MB): không thấy rò phòng.
- Mốc so sánh: 11.4 (12 bot ~2–5 ms, 40 bot ~7 ms mỗi nhịp bản đồ ×8) và ngưỡng 10 ms của skill: **Đạt** với biên rất rộng. Mỗi phòng là sân nhỏ một người, không `interest` lọc (`interest.all`), nên chi phí tuyến tính theo số phòng và nhỏ.
- **Chưa đo**: phòng ở giai đoạn có tinh anh + hồn thú tuổi cao (sóng 3) kéo dài, và chạy dài 1–2 giờ nhiều lượt vào ra. Số hồn thú ≤ 16 / phòng theo kịch bản nên không phải điểm nóng; cần đo lại khi thêm phụ bản hay tổ đội.

## Bài bot mới và cách kiểm lại

- `client/scripts/bot/bicanhSoat.mjs` (gọi cuối `bicanhTest`, nhóm CI 2): vé phòng (người khác, không vé, vé giả, token lạ, vào hai lần, vào lại phòng đã chốt), tranh `enter` / `buy`, rời lúc đếm ngược, thua rồi chốt, tin ngoài danh sách chặn trong phòng.
- `client/scripts/bot/bicanhRoom.mjs`: thêm kiểm `buy` bị từ chối (không thu phí) khi quyển ngày đã đủ trần.
- `npm run bot:local -- --only bicanh` (thêm `--pg` khi đụng SQL / `claimBoss`); `npm run test:bicanh --prefix server`; `npm run check`.

## Câu hỏi mở cho chủ repo

1. Trần quyển ngày so với lượt mua (bảng cân bằng, chọn A / B / C).
2. Có lưu mốc ngày Bí Cảnh lớn nhất vào DB (như `last_at` của Phúc Lợi) để chặn đồng hồ lùi qua khởi động lại không (cần SQL mới).
3. Túi đầy lúc chốt: giữ chờ nhận hay đi đường rơi đồ thường (câu hỏi mở 3 của `bi-canh.md`).
