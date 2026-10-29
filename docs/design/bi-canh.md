# Bí Cảnh: phụ bản hằng ngày, MVP Luyện Hồn Cảnh

**Bí Cảnh** là nhóm phụ bản **nâng cấp võ hồn**, chơi có lượt theo ngày, nằm trong menu "Thí Luyện". Tài liệu này chốt **phương án B** (phòng riêng theo sóng, tái dùng `ArenaRoom`) và **MVP = một phụ bản "Luyện Hồn Cảnh", solo**; các phụ bản còn lại chỉ phác hướng, mỗi cái cần thiết kế riêng khi tới lượt. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`; tên *(đề xuất)* chưa tồn tại, đặt khi làm). Số issue ở cuối file. **Trạng thái:** P1 (`BICANH`, `bicanhDay`, `bicanhRunPrice`), P2 (tin `bicanh` `get` / `buy`, lượt qua `boss_claims`, tin lúc qua 05:00) và P4 (Hồn Kinh Quyển dùng cho võ hồn bất kỳ, kẹp bình cảnh) đã có ở server. **P3 đã có ở server** (`BiCanhRoom`, `enter` trừ lượt + vé giữ chỗ, ba sóng và tinh anh theo `BICANH.scenes[].waves`, thưởng quyển theo sóng đã hạ kẹp `tomeDailyCap`, hoàn lượt khi lỗi hệ thống); MVP **dùng tạm sân đấu `ARENA_MAP`** làm bản đồ (chưa có bản đồ Tiled riêng, làm cùng P5). **P5 client đã có** (`client/src/bicanhScreen.ts`: màn danh sách mở từ thẻ Bí Cảnh của hub, HUD sóng / đồng hồ / tinh anh, bảng kết quả; poster tạm là chữ 境 chờ ảnh làm theo `asset-gen`; điểm vào NPC cổng chưa làm). Còn bản đồ Tiled riêng, P6 soát + `balance-review`.

Tham chiếu: chỉ học **cơ chế** (lượt theo ngày, làm mới 05:00, phụ bản theo đầu ra, thang độ khó) từ game Đấu La tham chiếu, không chép tên / chữ / ảnh. Bản nháp ý tưởng ba phương án A / B / C do chủ repo duyệt; chọn B, giữ A làm khung xương (khung lượt + claim) và C là hướng giai đoạn sau.

## 5.22 Bí Cảnh

### Mục tiêu
- Cho người chơi một **mục tiêu chơi tay hằng ngày** có chủ đích, và giải đúng một nỗi đau thật: võ hồn **dự bị** (bench) lên cấp rất chậm, vì kinh nghiệm chỉ rơi khi hạ hồn thú và chia theo `XP_SHARE_ACTIVE` / `XP_SHARE_BENCH` (mục 5.1).
- **Thêm mục tiêu, không thay săn:** giá trị một lượt đo bằng "phút tự săn tương đương" (BICANH.equivMin *(đề xuất)*); tổng lượt trong ngày chỉ bằng một **phần nhỏ** quỹ `AUTO_DAILY_SECS`.
- **Không chạm vòng chơi chính** (săn hồn thú → hồn hoàn → hấp thụ, mục 5.2 / 5.3): Bí Cảnh **không rơi hồn hoàn**; kinh nghiệm quyển **dừng ở bình cảnh** như kinh nghiệm thường.
- **Server-authoritative:** sinh quái, sát thương, thắng thua, rơi đồ, trừ lượt, ngày làm mới đều do server; client chỉ gửi ý định và vẽ.
- **Không nạp tiền, không bán vé / vật phẩm, không giao dịch** (mục 5.7): mọi thưởng là của riêng người chơi. Thua không mất đồ (mục 2).

### Quyết định của chủ repo (đã chốt, không bàn lại ở đây)
| # | Việc | Chốt |
|---|---|---|
| 1 | Phương án / MVP | **B**, làm theo lát cắt dọc; MVP là **Luyện Hồn Cảnh solo** |
| 2 | Giờ làm mới | **05:00 giờ Việt Nam**, chỉ cho Bí Cảnh (hai mốc ngày; xem "Ngày Bí Cảnh") |
| 3 | Sách kinh nghiệm | Dùng được cho **võ hồn dự bị** (mọi võ hồn trong bộ sưu tập), vẫn **dừng ở bình cảnh** |
| 4 | "Cường hóa" | Là **vật liệu** cho hồn cốt / hồn hạch / trang bị; **không** thêm hệ chỉ số vĩnh viễn mới |
| 5 | Đấu trường | **Tái dùng Đại Đấu Hồn Trường** (`ArenaRoom`); không làm tháp riêng (phương án C để sau) |
| 6 | Tổ đội | **Solo trước**, đội sau (giai đoạn B5) |
| 7 | Mua thêm lượt | **Hồn Tệ lũy tiến**, có trần, cùng khuôn `shardBuyPrice` |

### Luật chung của Bí Cảnh
1. **Lượt theo phụ bản:** mỗi phụ bản một bộ đếm riêng (kiểu `0/3`), số lượt ở BICANH.runs *(đề xuất)*. Lượt **trừ lúc vào**; hoàn lại **chỉ khi server lỗi** (phòng sập, hoàn tiền), không hoàn khi người chơi bỏ / thoát / hết giờ.
2. **Mua thêm lượt:** nút "+" ngoài lượt miễn phí, giá tăng dần theo lượt đã mua trong ngày (BICANH.buyBase / BICANH.buyGrow *(đề xuất)*, cùng khuôn `shardBuyPrice`), có **trần** lượt mua mỗi ngày (BICANH.buyMax *(đề xuất)*). Hộp xác nhận ghi giá, bấm hai lần khi giá cao (luật mục 5.7). Là một nguồn **ra** Hồn Tệ; giá một lượt mua thêm phải ≥ giá trị Hồn Tệ quy đổi của thưởng lượt đó, để mua lượt không thành vòng in tiền.
3. **Co giãn theo cấp:** quái sinh theo **vòng kế tiếp** của võ hồn dẫn đầu đội (`RING_LIMIT`, `beastLevel`), nên cấp nào cũng gặp đúng sức và `XP_LEVEL_STEPS` không bao giờ giảm kinh nghiệm.
4. **Điều kiện vào:** ngoài giao chiến, ngoài hấp thụ, không gục, không đang đi cổng, không đang trong sân đấu; không có tác vụ ghi DB chờ (`claimBusy`).
5. **Phòng riêng, một người:** mỗi lượt một phòng nhỏ tồn tại vài phút; thoát giữa chừng = thua nhưng **giữ phần sóng đã xong**.
6. **Không rơi hồn hoàn / hồn cốt / hồn hạch / trang bị** từ quái trong phòng (đã có nguồn riêng; tránh phá mục tiêu săn). Thưởng chỉ theo bảng thưởng của phụ bản.

### Ngày Bí Cảnh (làm mới 05:00)
- Game đổi ngày lúc **00:00** (`BOSS_TZ`, `docs/design/01-luat-chung.md` mục "Ngày và giờ"). Bí Cảnh dùng **một khóa ngày riêng**: ngày Việt Nam của (giờ server **trừ** BICANH.resetHour *(đề xuất, 5)* giờ). Hàm thuần `bicanhDay(ms)` *(đề xuất)* ở `shared/data.ts`, dựa `vnDay`; client dùng để hiển thị đếm ngược, server quyết thật.
- Khóa này là chuỗi `day` truyền cho `claimBoss` / `boss_claims` với `kind` riêng của Bí Cảnh (BICANH.claimKind *(đề xuất)*, mỗi phụ bản một đuôi), nên **không cần SQL mới** và không đụng lượt của boss / đấu trường (vẫn 00:00).
- **Hai mốc ngày** dễ nhầm: poster Bí Cảnh luôn ghi đếm ngược "Làm mới sau hh:mm (05:00)". Luật chung mục "Ngày và giờ" cần thêm một dòng nhắc ngoại lệ này khi làm B0.
- Đồng hồ: `bossNow()` (như `welfare`, `daily`), nên bot đẩy ngày bằng `BOSS_CLOCK` / `bossOffset`. Không dùng giờ client; không dùng giờ DB cho ngày.

### Phụ bản MVP: Luyện Hồn Cảnh (B1)
**Vòng chơi:**
1. Mở menu **Thí Luyện → Bí Cảnh** (hoặc NPC cổng ở Thiên Đấu Thành), thấy poster Luyện Hồn Cảnh: thưởng, `n/m` lượt, đếm ngược 05:00, nút "+".
2. Bấm **Khiêu Chiến** → client gửi `bicanh {op:"enter", id}` → server kiểm điều kiện, **trừ lượt nguyên tử**, giữ chỗ và chuyển vào phòng riêng (cùng khuôn `arena {k:"found"}`: đóng băng người chơi như đi cổng).
3. Trong phòng: đếm ngược → **vài sóng** hồn thú (BICANH.waves *(đề xuất)*), mỗi sóng đông hơn; sóng cuối có một **tinh anh** (luật tinh anh mục 5.4). Dùng nguyên chiến đấu, đổi võ hồn, hồn kỹ, tiên cơ, Chân Thân của `MapRoom`.
4. Kết thúc (**thắng / thua / hết giờ**): bảng kết quả; thưởng vào túi một transaction; phòng đóng; client về bản đồ cũ theo `/api/me` (như sân đấu).

**Thưởng: Hồn Kinh Quyển** *(đề xuất, vật phẩm mới trong `ITEMS`)*:
- Số quyển theo **số sóng đã hạ** (kể cả thua giữa chừng nhận phần các sóng xong, không "mất trắng"); sóng cuối + tinh anh thưởng thêm.
- **Dùng trong túi:** chọn **một võ hồn bất kỳ trong bộ sưu tập** (kể cả dự bị, kể cả không ra trận) → cộng kinh nghiệm cố định BICANH.tomeXp *(đề xuất)*, **cùng đường cộng kinh nghiệm có kẹp bình cảnh** (đến cấp 10k thì phải hấp thụ hồn hoàn). Khuôn xử lý: dùng tiên thảo (chọn võ hồn đích, `HERBS`).
- Kinh nghiệm khi săn rừng giữ nguyên; quyển không làm săn bớt giá trị vì có **trần quyển nhận mỗi ngày** (BICANH.tomeDailyCap *(đề xuất)*, cộng cả lượt mua thêm) và kinh nghiệm cố định thấp hơn so với một giờ săn tương đương.

**Lưu ý nội dung:** MVP **một** bản đồ Tiled nhỏ + một kịch bản dữ liệu (`BICANH.scenes` *(đề xuất)*: sóng, quái, giờ), không nhân bản mỗi cấp một bản đồ.

### Các phụ bản sau MVP (chỉ phác, mỗi cái cần thiết kế riêng)
| Mã | Tên | Hướng | Ràng buộc đã chốt |
|---|---|---|---|
| B2 | Cực Hạn Cảnh | boss + thang **bậc** (BICANH.limitTiers *(đề xuất)*), thưởng lần đầu vượt bậc, kỷ lục thời gian | Tiến độ bậc lưu lâu dài → **cần SQL mới** (xem "Lưu trữ"); xếp hạng nhẹ theo khuôn `RANK_BOARD_CACHE` |
| B3 | Đột Phá Cảnh | boss có cơ chế buộc xử lý; thưởng **Hộ Hoàn Phù** *(đề xuất)* giữ hồn hoàn khi hấp thụ vượt giới hạn mà hỏng | Cùng khuôn `EQUIP_CHARM`; **không** tự phát hồn hoàn, không bảo đảm thành công; nối vào `absorb.ts` cẩn thận với tỉ lệ hỏng |
| B4 | Luyện Khí Cảnh | phòng thu thập nguyên liệu có áp lực | Thưởng là **vật liệu** cho hồn cốt / hồn hạch / trang bị (quyết định 4); cân với `BONE_FEED_MAX`, `CORE_FEED_MAX`, `EQUIP_STONES`; bắt buộc `balance-review` |
| B5 | Tổ đội 2–4 | mở B1 / B2 cho đội | `PARTY_MAX`; quái sinh theo vòng của người **yếu nhất**; máu tăng theo số người (mục 5.4); thưởng **riêng từng người**, không chia / không nhường |
| B6 | Tư Chất Cảnh | mảnh SR / SSR + tiên thảo | Chỉ `ARENA_SHARDS` (không UR); gom vào **một trần chung** với `SHARD_BUY.daily` và đấu trường; tiên thảo bám `HERB_MAX` |
| B7 | Kho Báu Cảnh | chạy đua nhặt Hồn Tệ | Giá trị thấp nhất, trần ngày thấp; **có thể bỏ** nếu Hồn Tệ đã dư |
| B8 | Đại Đấu Hồn Trường | chỉ là **lối tắt** từ menu Bí Cảnh sang đấu trường có sẵn | Không làm lại PvP; luật / Elo giữ ở `docs/design/to-doi-pvp-dau-truong.md` |

### Dữ liệu và nơi tính
- BICANH *(đề xuất)* ở `shared/data.ts`: `runs`, `resetHour`, `claimKind`, `buyBase` / `buyGrow` / `buyMax`, `waves`, `tomeXp`, `tomeDailyCap`, `equivMin`, `maxRooms`. Hàm thuần `bicanhDay(ms)`, `bicanhRunPrice(i)` *(đề xuất)*. **Không chép số vào tài liệu.**
- Server giữ phép tính trong một file riêng (đề xuất `server/src/rooms/bicanh.ts`, như `tong.ts`, #702) và lớp phòng `BiCanhRoom extends MapRoom` *(đề xuất, khuôn `ArenaRoom`)*: phòng riêng (`setPrivate`), `checkJoin` theo vé giữ chỗ. Kịch bản (sóng, giờ) là **dữ liệu thuần**, tái dùng `spawn.ts`, `boss.ts`, `kill.ts`, `loot.ts`; không viết chiến đấu mới.
- Client chỉ gửi `op` và `id`; `id` kiểm theo danh sách phụ bản (`intIn` / whitelist), không tin số lượt, ngày hay phụ bản từ client.

### Lưu trữ
- **MVP không cần SQL mới.** Lượt: `boss_claims` qua `store.claimBoss(accountId, day, kind, limit, bag, n)` với `day` là khóa Bí Cảnh (trên), `kind` mới; thưởng quyển: `items` / túi. Cả hai ghi **một transaction** như đổi mảnh ở Thương hội (mục 5.7).
- Cách ghi: giữ chỗ ngay trong RAM (`claimBusy`: không bán / bỏ / hấp thụ lúc chờ), rồi xếp vào chuỗi lưu `this.chain(d, fn)`; DB báo thất bại thì **hoàn** (không cộng thưởng, không trừ lượt). Lỗi ghi không được làm RAM và DB lệch (bài học #796). Túi không đủ chỗ cho phần thưởng thì **từ chối vào phòng trước khi trừ lượt** (như đổi mảnh); cách xử lý túi đầy lúc cuối phòng ở câu hỏi mở 3.
- **Chỉ B2 (bậc cực hạn) cần bảng mới**: `server/sql/00N_bi_canh.sql` (N kế tiếp trên `origin/main` lúc làm), chạy lại an toàn, bật RLS không tạo policy, sửa **cả** `PgStore` lẫn `MemoryStore`, thêm vào `Store.removeTestAccount`. Không `DROP` hay đổi kiểu cột cũ. Chi tiết khi viết thiết kế B2.
- Không cần Redis: dữ liệu theo tài khoản, ghi hiếm.

### Giao thức
Bổ sung vào bảng ở `docs/tech/giao-thuc-server.md` khi làm (kiểm `tools/docs-check.mjs`).

| Hướng | Tin | Nội dung | Nhóm / giới hạn |
|---|---|---|---|
| client → server | `bicanh {op: "get" \| "enter" \| "buy", id}` | `get`: xin trạng thái; `enter`: trừ lượt + vào phòng; `buy`: mua thêm một lượt (xác nhận 2 bước, `pay: true` khi giá cao) | `get`: `read`; `enter` / `buy`: `trade` (ghi DB) |
| server → client | `bicanh {runs: [{id, left, max, bought}], resetIn, err?}` | `left` / `max`: lượt; `resetIn`: ms tới 05:00 kế tiếp (server tính, client chỉ đếm lùi); `err`: lý do tiếng Việt | riêng |
| server → client | `bicanh {k: "found" \| "wave" \| "end", …}` | tin vòng phòng: vào phòng, sóng hiện tại / tổng, kết quả + thưởng + lý do thua | riêng; khuôn tin `arena` |

- Server gửi `bicanh` lúc vào phòng (chấm đỏ "còn lượt") và **lúc qua 05:00** khi đang chơi; không tự vào hộ.
- Dùng quyển: tin có sẵn của dùng vật phẩm (khuôn tiên thảo) thêm đích võ hồn; không thêm tin mới nếu tái dùng được.
- Phòng Bí Cảnh **chặn** các tin ngoài trận như `BLOCKED` của `ArenaRoom` (xếp đội, cường hóa, mở rương, mua bán, đi cổng, `bicanh` lồng nhau…); `MapRoom` ngoài chặn `bicanh` khi ở sân đấu / trong phòng Bí Cảnh. Bài `cheat` của bot thêm tin này (dồn `enter` 200 lần, `id` lạ, `buy` quá trần).

### Chống gian lận
Soát theo skill `anti-cheat-audit` trước khi gộp PR server; ghi thành tệp soát riêng trong `docs/tech/` (cùng khuôn `docs/tech/soat-gian-lan-dai-dau-hon-truong.md`) ở giai đoạn B4.

| Rủi ro | Cách chặn |
|---|---|
| Nhân thưởng / vượt lượt do bấm dồn, hai tiến trình, hai tab | Trừ lượt bằng **claim nguyên tử** (`claimBoss` với `limit`, như `SHARD_BUY`), thưởng và lượt cùng transaction; lần thứ hai nhận "đang xử lý" / hết lượt (`claimBusy`) |
| Vào phòng rồi thoát để lấy lại lượt | Lượt trừ **lúc vào**; hoàn **chỉ** khi server lỗi; thoát giữa chừng = thua, giữ sóng đã xong (thưởng một lần) |
| Một phòng lĩnh thưởng hai lần (kết thúc lặp, đóng phòng chậm) | Phòng có cờ "đã chốt"; thưởng chỉ ghi một lần cho mỗi vé giữ chỗ; vé dùng một lần |
| Bot lặp phụ bản | Lượt có trần, thưởng theo **sóng đã hạ do server đếm**, trần quyển / ngày; soát `anti-cheat-audit` + `bot-flakiness` |
| Lách làm mới 05:00 (đổi giờ máy) | Ngày tính **ở server** từ `bossNow()`; client không gửi giờ; đồng hồ máy chủ lùi thì từ chối `enter` và ghi log `[bí cảnh]` (như `welfare`) |
| Kinh nghiệm vượt bình cảnh | Quyển dùng **cùng đường** cộng kinh nghiệm có kẹp bình cảnh; kiểm trong bài `balance` |
| Nuôi nhiều tài khoản | Thưởng không chuyển được (không giao dịch), trần theo tài khoản, quyển cố định theo sóng → nhiều tài khoản chỉ nhận đúng bằng nhiều người chơi thật |
| Mua lượt qua mặt trần | `buy` kiểm `buyMax` **trong cùng câu ghi**, không chỉ ở RAM; phí trừ cùng transaction, hoàn khi lỗi |
| Thử lại để dò kịch bản | Kịch bản cố định thì không sao; ngẫu nhiên chỉ ở server |
| Tải: nhiều phòng cùng lúc | Trần số phòng đồng thời (BICANH.maxRooms *(đề xuất)*); hết chỗ thì từ chối **trước khi trừ lượt**; phòng ngắn, đóng khi hết giờ |

### Kinh tế
Nguyên tắc: **một lượt có giá trị ≤ vài phút tự săn tương đương; tổng ngày chỉ một phần nhỏ `AUTO_DAILY_SECS`.** Test cân bằng (bài `balance`, `test:*`) kiểm các **quan hệ**, không chép số:

| Thứ | Quan hệ |
|---|---|
| Quyển kinh nghiệm | kinh nghiệm quy đổi (BICANH.tomeXp × quyển / ngày) ≤ một phần của kinh nghiệm một giờ săn cùng cấp; **trần quyển ngày** bắt buộc (BICANH.tomeDailyCap) |
| Hồn Tệ | Bí Cảnh MVP **không** cho Hồn Tệ; lượt mua thêm là nguồn ra |
| Giá lượt mua | `bicanhRunPrice(i)` tăng đơn điệu, lượt đầu đã ≥ giá trị Hồn Tệ của thưởng một lượt; **không có lời** khi mua lượt rồi bán đồ |
| Hồn hoàn, hồn cốt, hồn hạch, trang bị, tiên thảo, rương | **không có** trong thưởng MVP |
| Mảnh võ hồn (B6) | chỉ `ARENA_SHARDS`, một trần chung với `SHARD_BUY.daily` |
| Phí mua lượt vs `BAG_EXPAND_COST` | cùng cỡ "nơi tiêu Hồn Tệ"; không làm Hồn Tệ cạn hay dư hơn mục tiêu của mục 5.7 |

Giá trị thật của quyển và giá lượt cân qua skill `balance-data` / `balance-review`; bài soát ghi bảng quan hệ với số thật lúc đó. Số ban đầu là số tạm; chủ repo duyệt thang số trước khi mở đại trà (bước P6).

### Giao diện
Chất liệu theo `docs/art/ui-kit.md`; bố cục theo `docs/design/giao-dien.md`; chữ 10 / 12 / 24; vùng bấm 44 px cho nút chính. Một nút chính "Khiêu Chiến" ở góc dưới phải.

```
┌ Bí Cảnh ─────────────────────────────────────────── [X] ┐
│ ▸ Luyện Hồn Cảnh │  [ minh họa lớn ]                     │
│   (Cực Hạn…khóa)  │  Luyện Hồn Cảnh                       │
│                   │  Thưởng: [Hồn Kinh Quyển] ×N          │
│                   │  Làm mới sau 06:12 (05:00)            │
│                   │  Lượt 2/3        [+]  [ Khiêu Chiến ] │
└──────────────────────────────────────────────────────────┘
```

- **Điểm vào:** menu **Thí Luyện** (cột icon dọc: Săn Hồn / **Bí Cảnh** / Đồng Đội / Quyết Đấu); chốt cây menu trước khi vẽ. Chấm đỏ trên icon khi còn lượt miễn phí.
- **Poster mỗi phụ bản:** minh họa, tiêu đề, hàng **Xem thưởng**, trạng thái trong danh sách (*Còn N lượt* / *Đã xong hôm nay* / *Khóa*: dạng + chữ, không chỉ màu), chân poster có đếm ngược, `n/m`, nút "+" (hộp xác nhận ghi giá Hồn Tệ).
- **Chữ phụ đề không bị cắt** (kiểm trên điện thoại).
- **Trong trận:** HUD nhỏ (sóng hiện tại / tổng, đồng hồ, máu tinh anh); màn kết quả liệt kê thưởng và lý do thua.
- **Trạng thái bắt buộc:** *đang tải*, *đang gửi* (nút tắt, không bấm đôi), *thành công*, *hết lượt*, *lỗi* (lý do tiếng Việt), *mất kết nối*, *không đủ Hồn Tệ*, *túi không đủ chỗ*.
- **Ảnh:** MVP **một poster** (Luyện Hồn Cảnh) + icon Hồn Kinh Quyển + một bản đồ Tiled nhỏ. Ảnh làm theo skill `asset-gen`; nguồn / giấy phép ghi `docs/art/nguon-giay-phep.md`.
- Esc đóng theo ngăn xếp (`panelStack.ts`); PC (Q40).

### Hiệu năng
Mỗi lượt một phòng nhỏ sống vài phút, một người; trần phòng đồng thời; đưa vào `soak-perf` trước khi mở đại trà (`docs/tech/hieu-nang-soak.md`). Phòng đóng giải phóng ngay (không để phòng mồ côi).

### Bot / kiểm thử
Bài bot nhóm mới `bicanh` (`npm run bot:local -- --only bicanh [--pg]`): vào phòng, hạ sóng, nhận quyển, dùng cho võ hồn dự bị (kẹp bình cảnh); **dồn `enter`** không nhân lượt; hết lượt, `buy` đúng giá lũy tiến và quá trần; `id` lạ; túi đầy; tin lạ; hook `savefail` kiểm hoàn lại lượt / thưởng; qua 05:00 bằng `bossOffset` (lượt đặt lại, 04:59 vs 05:00); hai tiến trình tranh lượt (`--pg`). Bot **không** dựa vào ngẫu nhiên kịch bản (xem skill `bot-flakiness`).

### Lộ trình triển khai (mỗi bước một PR nhỏ, theo `roadmap-step`)
| Bước | Việc | Kiểm thử |
|---|---|---|
| P0 | Tài liệu này (+ dòng mục lục `GAME_DESIGN.md`, dòng `ROADMAP.md`) | `npm run check`, `tools/docs-check.mjs` |
| P1 | `shared/data.ts`: BICANH, `bicanhDay`, `bicanhRunPrice` + test thuần (ranh giới 05:00, giá lũy tiến, quan hệ trần kinh tế) | `npm run check` |
| P2 | Server khung: tin `bicanh` (`get`, `buy`), lượt qua `claimBoss` (kind mới), tin lúc qua 05:00; chưa có phòng | bot `--pg`: lượt không nhân khi hai tiến trình tranh |
| P3 | `BiCanhRoom` + bản đồ Tiled nhỏ + kịch bản Luyện Hồn Cảnh, `enter`, sóng, tinh anh, kết quả, hoàn lượt khi server lỗi | bot nhóm `bicanh`: vào / thắng / thua / thoát giữa chừng / hết giờ |
| P4 | Vật phẩm Hồn Kinh Quyển + dùng cho võ hồn dự bị (kẹp bình cảnh) + trần ngày | bot: dùng quyển, bình cảnh, trần |
| P5 | Client: poster + menu Thí Luyện + HUD sóng + màn kết quả | `client-ui` + ảnh chụp Chrome headless (`--mute-audio`) đủ trạng thái |
| P6 | Soát chống gian lận (`anti-cheat-audit`) + `balance-review` + `soak-perf`; chủ repo duyệt thang số | tài liệu soát + bảng quan hệ số thật |
| P7+ | Các phụ bản B2…B8 theo thứ tự chủ repo chọn; mỗi cái một tài liệu / mục thiết kế bổ sung | theo từng mục |

### Câu hỏi mở
Gom ở mô tả PR; riêng Bí Cảnh:
1. **Hai mốc ngày** (05:00 Bí Cảnh, 00:00 phần còn lại): đã chốt dùng 05:00; có cần dòng nhắc ở mọi poster ngoài Bí Cảnh có "mỗi ngày" không.
2. **Mức thưởng quyển** và số lượt miễn phí mỗi ngày: số cụ thể chờ `balance-review`.
3. **Túi đầy lúc nhận thưởng:** đề xuất kiểm túi **trước khi trừ lượt** và cảnh báo "túi sắp đầy"; nếu cuối phòng vẫn đầy (đổi đồ trong lúc chờ) thì thưởng đi qua đường rơi đồ thường hay giữ chờ nhận.
4. **Thang bậc cực hạn (B2)** và xếp hạng có vào `docs/design/xep-hang.md` hay riêng.
5. **Cổng vào:** menu Thí Luyện chung hay NPC cổng ở Thiên Đấu Thành (hoặc cả hai) ở v1.

## Lịch sử / issue liên quan
- Khung chung: bộ spec UI và lộ trình game (#877, "Part of").
- Khuôn tái dùng: lượt theo ngày `claimBoss` và đổi mảnh (mục 5.7), phòng riêng kiểu trận `docs/tech/kenh-arena.md`, thưởng nhận đúng một lần (`docs/design/phuc-loi.md`), ủy thác `docs/design/tu-san-uy-thac.md`.
- Số issue Bí Cảnh: sẽ ghi khi tạo (chưa có lúc viết tài liệu).
- Nhật ký từng bước: `docs/lich-su.md`.
