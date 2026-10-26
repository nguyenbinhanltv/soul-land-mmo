# Soát chống gian lận: mua lại nhiều tiến trình + bạn bè / chat (#742, vòng 4c)

Soát theo skill `anti-cheat-audit`. Phạm vi: giả thuyết 3 (cửa hàng + mua lại nhiều tiến trình) và 5 (bạn bè / chat) của #742. Giả thuyết 1, 4 là #740 (`chong-gian-lan-khac-may-man-tong-mon.md`), 2 là `soat-gian-lan-dai-dau-hon-truong.md`.
Ngày soát 2026-10-26, trên `main` tại `40f342b5`.

## Tóm tắt

| # | Giả thuyết | Kết quả | Mức |
|---|---|---|---|
| 3a | Bán ở tiến trình A, đổi kênh sang B, mua lại nhiều lần từ một phiên → nhân đồ / tiền | **Không khai thác được**, có bài bot nhiều tiến trình | — |
| 3b | Mua lại gửi dồn từ phiên mới trong khi phiên thứ hai của cùng tài khoản vào đá phiên cũ | **Không khai thác được** (3 vòng, trễ 0 / 40 / 150 ms) | — |
| 3c | Khóa kênh đích sau đổi kênh / đi cổng chỉ ở RAM tiến trình gốc | **Lệch thật**: lách luật #164 giữa các tiến trình và chặn nhầm lần vào hợp lệ | Vừa → #819 |
| 3d | Rời game lúc `editBuyback` chưa xong để danh sách mua lại sống sót | Đọc mã, chưa thử | Thấp |
| 5a | `friends.add` dồn tên lạ: mỗi tên một truy vấn DB | **Chặn đúng**: 10 truy vấn rồi ≤ 1 / giây | Thấp |
| 5b | Dò tên tài khoản qua phản hồi thêm bạn | **Dò được** (có chủ ý, thêm theo tên); tin riêng không lộ | Thấp |
| 5c | Tin chat biên (120 ký tự, 60 emoji), xuống dòng / tab | Đúng | — |
| 5d | Ký tự điều khiển / đổi chiều văn bản / độ rộng 0 trong chat | **Qua nguyên vẹn tới người nhận** | Thấp → #817 (đã sửa) |
| 5e | Tài khoản đặt tên "Hệ thống" giả tin hệ thống | **Giả được** (client tô xanh theo tên) | Vừa → #818 (đã sửa) |
| 5f | Chat `tong` khi chưa có tông | Từ chối, không phát cho ai | — |

Lỗi thật đã tách issue sửa riêng, không sửa `MapRoom.ts` trong PR này (#804 / #806 đang merge).

## 3. Mua lại nhiều tiến trình

**Cơ chế đọc từ mã** (`MapRoom.ts`, `editBuyback`, `claimBuyback`, `sellItem`, `buybackItem`): danh sách mua lại đúng ở presence Redis (`buyback:<acc>`, TTL `BUYBACK_TTL_MS`), bản trong RAM (`buybacks`) nạp lúc vào phòng. `sellItem` ghi `editBuyback` không chờ rồi trừ đồ và `saveTrade`. `buybackItem` lấy món ra khỏi presence bằng `claimBuyback` (khóa `withLock`, đọc-sửa-ghi một lần nên chỉ một lệnh nhận được món, kể cả hai tiến trình), rồi kiểm lại sau `await` (còn phiên, không đang đi cổng, đủ tiền, đủ chỗ), không thì trả món về presence.

Vì sao không nhân được: mọi đường dẫn tới món đều qua `claimBuyback` (nguyên tử); tiền trừ (`honTe -= cost`) và đồ cộng cùng một nhịp đồng bộ sau lần kiểm cuối; món mua lại sinh id mới nên chỉ nhân nếu `claim` nhận hai lần, mà không. Mất cơ hội thì có (danh sách chưa sang kịp tiến trình mới: báo "không còn giữ"), chỉ thiệt cho người chơi.

**Bài bot** `BOT_ONLY=buybackproc` (`buybackProcTest`, tài khoản riêng "Mua lai M", bốn "Mua lai F" lấp kênh; hồn hoàn riêng mỗi vòng, không dùng chung túi với bài khác). Chạy: `BOT_REDIS_BIN=<redis-server> npm run bot:local -- --only buybackproc --procs 2 --pg --env CHANNEL_MAX=4` (CHANNEL_MAX khác 2 để không chạy `channelTest`; cần Redis cục bộ: công cụ tự bật Redis riêng và PostgreSQL cục bộ, **không** trỏ Supabase / prod). Mỗi vòng: bán hồn hoàn; (trễ 0 / 40 / 150 ms) rồi đổi sang kênh 2 (phòng ở tiến trình khác); phiên cũ còn mở gửi mua lại hai lần trong lúc đang đi cổng (bị `d.travelling` chặn); phiên mới gửi mua lại ba lần cùng một khóa; ngay sau đó một phiên thứ hai của cùng tài khoản vào phòng đá phiên cũ (lệnh còn đang chờ presence / DB). Bất biến kiểm: số hồn hoàn không vượt lúc đầu, Hồn Tệ không vượt lúc đầu cộng giá đã bán, id không trùng. Kết quả: đạt cả 3 vòng (hồn hoàn 1 → 1, 2 → 2, 3 → 3, Hồn Tệ không đổi, khóa mua lại sang kịp), vào lại: túi khớp bản lưu DB và danh sách mua lại rỗng.

Lưu ý đọc kết quả: Colyseus Redis chia phòng giữa hai tiến trình nhưng bot không biết phòng nào ở tiến trình nào; mục 3c cho thấy hai phòng nằm ở hai tiến trình khác nhau trong lượt chạy (khóa của tiến trình này chặn lần vào ở tiến trình kia). Bài giữ khoảng `CHANNEL_CD + 1` giây giữa các lần đổi kênh để khóa cũ không chặn lần vào kế tiếp (3c).

### 3c. Khóa kênh đích chỉ ở RAM tiến trình gốc (#819)

Khi đi cổng / đổi kênh, `MapRoom.ts` ghi `leftRoom.set(…, { roomId: dest.roomId, travel: true })` vào Map trong RAM, **không** ghi presence như khóa "tự rời kênh" (`channelLeftKey`). `leftLock` đọc presence rồi mới Map cục bộ. Hệ quả khi chạy nhiều tiến trình:

- Vào phòng ở tiến trình khác tiến trình gốc: không thấy khóa, client `joinById` được kênh server không chọn (luật #164). Đọc mã, **chưa dựng bài lách hoàn chỉnh** (cần ba kênh trải hai tiến trình).
- Khóa cũ ở tiến trình đã giữ lần đi cổng trước còn sống tới hết `CHANNEL_CD` và chặn nhầm lần vào hợp lệ kế tiếp: **tái hiện được** (lần chạy đầu của bài: 409 "Hãy vào kênh 1 (kênh server đã chọn)" dù server vừa chỉ kênh 2; ghi log `this` / `back` / bản RAM / bản presence cho thấy khóa kênh 1 cũ trong RAM, presence rỗng).

Đã sửa (#819, PR #824): ghi khóa `travel` vào presence cùng chỗ `leftRoom.set` và xóa ở hook `chan reset`; bài hai tiến trình kênh đích khác tiến trình, `joinById` kênh khác phải 409.

### 3d. Rời game lúc `editBuyback` chưa xong (chưa thử, Thấp)

`onLeave` (không đi cổng) gọi `forgetBuyback` (xóa Map và presence). `sellItem` không chờ `editBuyback`: nếu bán rồi rời ngay, ghi presence có thể xong **sau** lần xóa, danh sách sống thêm tới `BUYBACK_TTL_MS` và nạp lại lúc vào lại. Không nhân đồ / tiền (mua lại đúng giá đã nhận), chỉ lách chữ "mất khi rời game". Không tách issue; nếu sửa thì chờ `editBuyback` trong `sellItem` hoặc xóa theo phiên bản.

## 5. Bạn bè / chat

**Bài bot** `BOT_ONLY=socialaudit` (`socialAuditTest`; tài khoản riêng "Soat A / O / Off / V", không dùng chung với bài khác; chạy `npm run bot:local -- --only socialaudit`). Hai dòng không tách issue riêng cho Thấp có chủ ý (5a, 5b) nằm trong bài như kiểm bắt buộc; hai dòng lỗi thật (5d, 5e) đã sửa nên nay là kiểm bắt buộc (`ok`).

- **5a. `friends.add` dồn.** `friendAction` tính một lượt `friendCheck` (burst `FRIEND_BURST` = 10, hồi 1 / giây) **trước** khi tra tên (`store.findAccount`, một truy vấn có chỉ mục `accounts_name_key_idx` + `EXISTS vohons`). Bài gửi 40 tên lạ liền: 10 lần tra DB trả "không có hồn sư", 30 lần chặn "quá nhanh" trước khi tra. Giới hạn theo **tài khoản**, không theo IP: nhiều tài khoản thì nhân lên, nhưng tạo tài khoản đã bị `signup` giới hạn theo IP. Truy vấn nhẹ nên mức Thấp; nếu cần siết, tính lượt "tên không có" riêng (ví dụ 3 / phút).
- **5b. Dò tên.** Thêm bạn theo tên không có: "Không có hồn sư nào tên …"; có thật (kể cả ngoại tuyến): "Đã thêm … vào danh sách bạn bè". Dò được tên tài khoản (đã thức tỉnh), bị chặn bởi 5a. Có chủ ý (thêm bạn theo tên ngoại tuyến là tính năng #195). Tin riêng **không** lộ: tài khoản ngoại tuyến và tên không tồn tại cùng một câu "không trong game".
- **5c. Chat biên.** Quá 120 ký tự bị từ chối, 60 emoji (120 đơn vị) tới nơi nguyên vẹn, xuống dòng / tab gộp thành dấu cách; loại kênh / người nhận / nội dung lạ (object, mảng, `null`) đã có bài ở `chatTest`.
- **5d. Ký tự điều khiển (#817).** `chatText` chỉ gộp `\s+`. NUL, BEL, ESC, U+202E (đổi chiều văn bản) tới người nhận nguyên vẹn; tin toàn U+200B thành dòng chat trống nhìn thấy được. Client dùng `textContent` (`hud.ts`, `chatEl`) nên không có XSS; hậu quả là chữ đảo chiều, dòng trống. **Đã sửa:** `chatText` bỏ `CHAT_STRIP` (điều khiển C0 trừ tab / xuống dòng, DEL, độ rộng 0, đổi chiều văn bản) trước khi gộp khoảng trắng; tin rỗng sau khi lọc bị bỏ như tin rỗng.
- **5e. "Hệ thống" (#818).** Tên tài khoản chỉ qua `NAME_RE`, không có tên cấm. Tài khoản "Hệ thống" nói trong chat bản đồ thì client tô xanh như tin hệ thống thật. Tái hiện bằng bot (người xem nhận `name: "Hệ thống"`). **Đã sửa:** `RESERVED_NAMES` (`shared/data.ts`) kiểm bằng `isReservedName` (`names.ts`: bỏ dấu, hoa/thường, dấu cách, `_`; so nguyên cụm nên "Admin2" vẫn được) ở `/api/login` (chỉ khi tên chưa có tài khoản) và `/api/login/google/create`, trả 400. **Tài khoản cũ trùng tên cấm vẫn đăng nhập và giữ nguyên tên** (không đổi tên tự động); **đã đóng ở #827**: tin hệ thống thật mang `sys: true` (server phát), client chỉ tô xanh theo cờ đó, nên tài khoản cũ tên "Hệ thống" nói như người chơi thường (tên hiển thị không đổi). Server không có lệnh GM đổi tên; cách làm thật là `UPDATE accounts SET name=... WHERE id=...` bằng tay (như ghi chú ở `backfillNameKeys`, `db.ts`; lần khởi động sau `name_key` tự điền). Việc liệt kê / đổi tên tài khoản cũ tách sang issue tiếp theo. Danh sách chỉ chặn tên MỚI nên không cần migration `name_key`.
- **5f. Chat `tong` khi chưa có tông.** `chatAction` báo "chưa thuộc tông môn" riêng người gửi, không phát tin (đã có thêm ở `chatTest`; bài này kiểm lại người khác không nhận).

## Danh sách đã đọc

Message: `sell`, `buyback` (và `buy`, `expand` ở mức luồng bán / mua lại), `channel`, `travel`, `friend` (`list`, `add`, `remove`, `block`, `unblock`), `chat` (`map`, `party`, `whisper`, `world`, `tong`). Hook test dùng trong bài: `warp`, `goto`, `coin`, `give`, `rest`, `chan {reset}`, `friend {rlreset}`, `chat {rlreset}`, `tong {set}`. Không route REST mới ngoài `/api/login`, `/api/channel`, `/api/me` (đọc lại luồng tạo tài khoản cho 5e).

## Khoảng trống

- 3c mục 1 (lách luật kênh giữa tiến trình) đã có bài ở `client/scripts/bot/channel.mjs` (chạy `--procs 2`), kèm bản sửa #819 (khóa `travel` ghi vào presence).
- 3d chưa thử.
- Bài `buybackproc` không chạy trong CI (cần Redis cục bộ, ~90 giây): chạy tay khi đụng `buybackItem`, `editBuyback`, `leftRoom`, presence.

Tài khoản cũ trùng tên cấm (tạo trước #822) vẫn giả được tin hệ thống: #827 (bài `socialaudit` in `⚠ biết lỗi #827` nếu chạy tới, cần DB đã có tài khoản đó).
