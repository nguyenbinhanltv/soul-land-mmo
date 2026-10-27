# Phúc Lợi: điểm danh 21 ngày

Màn **Phúc Lợi** gom các quà đều đặn không cần nạp tiền. Giai đoạn đầu chỉ có một mục: **Sổ Điểm Danh** theo chu kỳ 21 ngày, có mốc đặc biệt và **lệnh ký bù** cho ngày lỡ. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`; tên *(đề xuất)* chưa tồn tại). Số issue ở cuối file. **Server (P1–P3) đã có code** (#877: `CHECKIN` ở `shared/data.ts`, `038_phuc_loi.sql`, `welfare.ts`, bot nhóm `welfare`); còn P4 màn client và P5 soát chống gian lận.

Tham chiếu bố cục: ảnh 10 (phúc lợi) trong bộ tham chiếu UI của #877; chỉ học bố cục (cột mục bên trái, lưới 7 × 3, mốc nổi bật, ô quá khứ xám), không chép tên / chữ / ảnh.

## 5.21 Phúc Lợi và điểm danh

### Mục tiêu
- Thưởng cho người chơi **quay lại đều**, không phạt nặng người bận: ngày lỡ có thể ký bù có giới hạn, chu kỳ không bị đặt lại vì một ngày vắng.
- **Giờ chỉ do server quyết:** đổi giờ máy hay múi giờ ở client không thêm / bớt được lượt.
- **Không phá cân bằng:** phần thưởng chỉ gồm vật phẩm **đã có trong game**, tổng một chu kỳ bị trần theo các nguồn hiện hành (mục "Kinh tế"); không có thứ gì mua bằng tiền thật.

### Luật điểm danh
- **Chu kỳ** `CHECKIN.days` ngày (đề xuất 21, giữ hằng; lưới 7 × 3). Ngày tính theo **giờ Việt Nam** (`vnDay` / `vnDayNum`, `BOSS_TZ`), đổi lúc 00:00 như khảo hạch hằng ngày (mục 5.8).
- **Chu kỳ riêng mỗi tài khoản**, **bắt đầu từ lần điểm danh đầu tiên** của chu kỳ (không phải lúc tạo tài khoản): **quy ước chỉ số ô:** `i` chạy `0 .. CHECKIN.days − 1` ở mọi chỗ (giao thức, `mask`, hàm thuần); ô `i` ứng với ngày `vnDayNum(lúc bắt đầu) + i`; UI chỉ hiển thị `i + 1` (01..21). Chu kỳ **kết thúc** sau `CHECKIN.days` ngày theo lịch kể từ lúc bắt đầu; ngày chưa ký và không ký bù được thì mất. Lần điểm danh đầu tiên sau khi chu kỳ cũ kết thúc mở chu kỳ mới (người nghỉ lâu **không** bị trừ gì, quay lại là ô 1).
- **Điểm danh hôm nay** (`welfare {op:"sign"}`): chỉ ô của **hôm nay** (theo giờ server); một lần mỗi ngày; nhận quà ô đó ngay.
- **Ký bù** (`welfare {op:"makeup", day}`): chỉ cho một ô **đã qua, chưa ký, thuộc chu kỳ đang chạy**, tiêu một **lượt ký bù**. Ô tương lai không ký được. Quà ký bù **giống hệt** quà ô đó (không thiệt), nhưng:
  - Số ô ký bù tối đa mỗi chu kỳ `CHECKIN.makeupMax` (kể cả lượt miễn phí lẫn trả phí).
  - **Lượt ký bù** ghi ở trạng thái tài khoản (không phải vật phẩm trong túi, không bán / bỏ / chuyển được). Nguồn: một số lượt **miễn phí** mỗi chu kỳ `CHECKIN.makeupFree`; thêm lượt ngoài mức miễn phí tốn Hồn Tệ lũy tiến `CHECKIN.makeupFee[i]` (nguồn ra Hồn Tệ, mục 5.7). Chọn thêm nguồn nào là câu hỏi mở 4.
  - Mốc đặc biệt đã qua ký bù được như ô khác.
- **Mốc đặc biệt** `CHECKIN.milestones` (đề xuất ô thứ 7, 14, 21 theo hiển thị, tức chỉ số 6, 13, 20): quà lớn hơn, vẽ nổi (nền vàng + nhãn). **Mốc theo tổng số ô đã ký** hay **theo số thứ tự ô** là câu hỏi mở 3; mặc định đề xuất: theo số thứ tự ô, để ký bù ô 7 vẫn nhận mốc 7.
- **Hoàn tất chu kỳ:** ký đủ mọi ô → ngày kế tiếp mở chu kỳ mới. Có thể thêm quà "đủ chu kỳ" bằng chính mốc cuối (không thêm nguồn thưởng).

### Dữ liệu và nơi tính
- `CHECKIN` *(đề xuất)* ở `shared/data.ts`: `days`, `milestones`, `rewards[]` (mỗi ô một danh sách `{code, qty}` **chỉ gồm mã có trong `ITEMS`** hoặc `honTe`, `shards`), `makeupFree`, `makeupMax`, `makeupFee[]`, trần `cycleCap` (mục "Kinh tế"). Hàm thuần `checkinDay(startDay, now)` (chỉ số ô hôm nay, hết chu kỳ chưa), `checkinOpen(mask, i)`: client dùng để hiển thị, server tính thật.
- Server giữ **mọi** phép tính trong một file riêng (đề xuất `server/src/rooms/welfare.ts`, như `tong.ts`, #702). Client chỉ gửi `op` và `day`; `day` kẹp bằng `intIn` rồi kiểm `0 ≤ day < ô hôm nay`, ô chưa ký, trong chu kỳ (`day` là chỉ số ô 0-based).
- Đồng hồ: `bossNow()` (đồng hồ thật khi không `GAME_TEST`), nên bot đẩy ngày bằng `BOSS_CLOCK` / `bossOffset` như lịch boss. **Không bao giờ** dùng giờ client, và không dùng giờ DB cho ngày (nhiều tiến trình chung một đồng hồ hệ thống; xem "Chống gian lận" cho trường hợp lùi giờ).

### Lưu trữ
**SQL đề xuất** `server/sql/00N_phuc_loi.sql` (N kế tiếp trên `origin/main` lúc làm; hiện bản mới nhất là 036), chạy lại an toàn, bật RLS không tạo policy:

```
checkin_state (
  account_id    integer PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  cycle         integer NOT NULL DEFAULT 0,   -- số thứ tự chu kỳ (đếm từ 1)
  start_day     integer NOT NULL,             -- vnDayNum ngày ô 1 của chu kỳ đang chạy
  mask          integer NOT NULL DEFAULT 0,   -- bit i = ô i đã ký (i = 0..CHECKIN.days−1, days <= 30)
  makeup_used   integer NOT NULL DEFAULT 0,   -- số ô ký bù đã dùng trong chu kỳ
  last_at       timestamptz,                  -- lần ký gần nhất (dùng phát hiện lùi giờ)
  ver           integer NOT NULL DEFAULT 0    -- tăng mỗi lần ghi, để ghi có điều kiện
);
```

- Một dòng mỗi tài khoản (mask 21 bit, không bảng con): nhỏ, đọc một lần lúc vào phòng. Không cần Redis: dữ liệu theo tài khoản, ghi hiếm.
- **Ghi có điều kiện, nguyên tử:** `UPDATE checkin_state SET mask = mask | $bit, …, ver = ver + 1 WHERE account_id = $a AND ver = $ver AND (mask & $bit) = 0` kèm túi và Hồn Tệ **trong cùng một transaction** (như `claimBoss`, đổi mảnh ở Thương hội, thưởng tuần tông). Hai tab / hai tiến trình / bấm dồn: chỉ một lần thắng, lần còn lại nhận "đã điểm danh". Túi không đủ chỗ cho **cả** phần quà thì từ chối, **không** mất ô (như đổi mảnh).
- Cách ghi: giữ chỗ ngay trong RAM (cờ như `claimBusy`: không bán / bỏ / hấp thụ trong lúc chờ), rồi xếp vào chuỗi lưu `this.chain(d, fn)`; DB báo thất bại thì hoàn lại (không cộng quà, không đổi mask). Lỗi ghi không được làm bộ nhớ và DB lệch (bài học #796).
- `Store.checkinGet(accountId)` và `Store.checkinClaim(accountId, patch, bag)` thêm vào **cả** `PgStore` lẫn `MemoryStore`. `Store.removeTestAccount` thêm bảng này. Không `DROP` hay đổi kiểu cột cũ; đổi `CHECKIN.days` sau này không ảnh hưởng dữ liệu cũ vì chu kỳ đang chạy giữ `start_day` (đổi cỡ lưới chỉ áp cho chu kỳ mới: lưu `days` kèm nếu muốn an toàn hơn).

### Giao thức
Bổ sung vào bảng ở `docs/tech/giao-thuc-server.md` khi làm (kiểm `tools/docs-check.mjs`).

| Hướng | Tin | Nội dung | Nhóm / giới hạn |
|---|---|---|---|
| client → server | `welfare {op: "get" \| "sign" \| "makeup", day?, pay?}` | `get`: xin trạng thái; `sign`: điểm danh hôm nay; `makeup`: ký bù ô `day` (chỉ số ô 0-based), lượt trả Hồn Tệ chỉ chạy khi `pay: true` (client xác nhận 2 bước) | `get`: `read`; `sign` / `makeup`: `trade` (ghi DB) |
| server → client | `welfare {cycle, day, mask, now, endsAt, makeupLeft, free, signed?, err?}` | `day`: chỉ số ô hôm nay (0-based; **−1** nếu chưa có chu kỳ đang chạy, `cycle: 0` khi chưa từng ký); `mask`; `now`: giờ server (ms) để đếm lùi; `endsAt`: hết chu kỳ; `makeupLeft`: lượt còn lại; `signed`: kết quả lần vừa làm (`{day, items}`), `err`: lý do tiếng Việt | riêng |

- Server gửi `welfare` lúc vào phòng (cho chấm đỏ "chưa điểm danh") và lúc **qua 00:00** khi đang chơi (như tin `daily`), không tự nhận hộ.
- Từ chối bằng tin `log` / `err` tiếng Việt: chưa tới ô, đã ký, hết lượt ký bù, thiếu Hồn Tệ, túi đầy, đang trong sân đấu, đang đi cổng, đang giao chiến (ngoài hiển thị, điểm danh được ở mọi trạng thái an toàn; đề xuất **không** chặn khi giao chiến nhưng chặn khi `claimBusy`).
- `ArenaRoom` chặn `welfare`; kiểm thử thêm tin này vào bài `cheat` (dồn `sign` 200 lần, `makeup` ô lạ).

### Chống gian lận
Soát theo skill `anti-cheat-audit` trước khi gộp PR server (ghi thành tệp soat-gian-lan-phuc-loi trong docs/tech).
- **Chống đổi giờ máy:** ngày do server tính từ `bossNow()`; client không gửi giờ / ngày, chỉ gửi chỉ số ô và server tự kiểm. Đồng hồ máy chủ **lùi** (sự cố, chỉnh tay): nếu `now < last_at` thì từ chối `sign` / `makeup` và ghi log `[phúc lợi]` (không cộng bất kỳ ô nào theo thời gian lùi). **Bot:** đẩy ngày bằng `BOSS_CLOCK` / `bossOffset` ghi `last_at` ở tương lai; bài bot phải xóa dòng `checkin_state` của tài khoản test khi dọn (hoặc bỏ kiểm lùi giờ khi `GAME_TEST`) để lượt sau dùng đồng hồ thật không bị khóa; trạng thái `ver` + `last_at` khiến ghi chậm trễ không thể thêm ô.
- **Không điểm danh hai lần:** điều kiện `(mask & bit) = 0` và `ver` trong câu `UPDATE` (nguyên tử), chịu được hai tab, hai tiến trình, bấm dồn, mất mạng giữa chừng; không có đường "nhận" ngoài transaction.
- **Ký bù có giới hạn:** `makeup_used < CHECKIN.makeupMax` kiểm **trong cùng câu ghi**, không chỉ ở RAM; phí Hồn Tệ trừ cùng transaction (hoàn lại nếu lỗi). Ô phải đã qua **và** thuộc chu kỳ đang chạy: kẹp `day` (số nguyên) tránh âm / quá lớn / NaN.
- **Chu kỳ không bị khai thác:** `start_day` chỉ ghi lúc mở chu kỳ mới và chỉ khi chu kỳ cũ đã hết (server kiểm); client không đề xuất ngày bắt đầu. Không có đường làm chu kỳ "kéo dài".
- **Nhiều tài khoản:** quà nhỏ, không chuyển được (không giao dịch giữa người chơi, mục 5.7), mảnh võ hồn chỉ SR / SSR và bị trần; nuôi nhiều tài khoản chỉ nhận quà mỗi tài khoản đúng bằng một tài khoản chơi thật, nên không có đòn bẩy. Tài khoản `is_test` điểm danh bình thường (dữ liệu dựng sẵn); tắt qua preset nếu bài bot cần.
- **Tải:** `get` thuộc nhóm `read`, `sign` / `makeup` thuộc `trade`; mỗi người một dòng; không quét toàn bảng.
- **Riêng tư:** chỉ chính chủ thấy trạng thái; không có bảng xếp hạng điểm danh.

### Kinh tế
Nguyên tắc: **quà lấy từ vật phẩm đã có, tổng một chu kỳ ≤ nguồn tương đương hiện có, không thêm nguồn vào mới đáng kể.** Phần thưởng mỗi ô khai trong `CHECKIN.rewards`; test cân bằng (thêm vào bài `balance` / `test:*`) kiểm các **quan hệ** sau, không chép số:

| Thứ | Quan hệ trần (mỗi chu kỳ, cộng mọi ô kể cả mốc) |
|---|---|
| Hồn Tệ | ≤ 3 × `TONG_WEEK_REWARD.rest.honTe` (một chu kỳ ≈ ba tuần, bằng nhiều nhất phần thưởng "không hạng nhất" của tông mỗi tuần) |
| Mảnh võ hồn | chỉ trong `ARENA_SHARDS` (SR / SSR; **không** UR, **không** Lam Ngân Thảo); tổng ≤ `SHARD_BUY.daily` mảnh (một ngày hạn mức mua ở Thương hội) |
| Ủy Thác Lệnh (`AUTO_TOKEN`) | tổng giờ cộng ≤ `AUTO_DAILY_SECS`; không vượt `AUTO_BONUS_MAX` khi cộng dồn |
| Đan, phù (Hồi Huyết / Hồi Hồn Đan, Hồi Thành Phù) | chỉ loại nhỏ trong `SHOP`; giá trị theo `SHOP` ≤ một phần của Hồn Tệ trần trên |
| Hồn hoàn, hồn cốt, hồn hạch, trang bị, tiên thảo, rương | **không có** trong quà điểm danh (đã có nguồn rơi riêng; tránh phá mục tiêu săn) |

- Mốc đặc biệt lớn hơn ô thường nhưng vẫn trong các trần trên; ô cuối chu kỳ là quà lớn nhất để giữ chân, không phải để thay săn.
- **Ký bù**: lượt miễn phí đủ để người chơi thỉnh thoảng lỡ vẫn nhận đủ; lượt trả phí là một nguồn **ra** Hồn Tệ nhỏ (giá tăng dần như `BAG_EXPAND_COST`) để ký bù không rẻ hơn chơi đều. Test cân bằng buộc: phí lượt trả phí ≥ giá trị Hồn Tệ của quà ô đắt nhất, nên ký bù bằng tiền **không có lời** (không thành vòng in tiền).
- **Không nạp tiền, không bán lượt / vật phẩm**; không có lệnh ký bù mua được ở thương nhân.
- Giá trị thật của từng ô cân qua skill `balance-data` / `balance-review`; bài soát ghi lại bảng quan hệ ở trên với số thật lúc đó.

### Giao diện
Chất liệu **Mực** đầy khung (màn Phúc Lợi) có tấm **Giấy** cho lưới ngày; token theo `docs/art/ui-kit.md`; chữ 10 / 12 / 24; vùng bấm 44 px cho nút chính "Điểm danh", 32 px cho ô ngày. Một nút chính ở góc dưới phải (luật 1, 8 của bộ spec UI). Điểm vào: nút menu "Phúc Lợi" (khi hub có) và chấm đỏ trên icon khi **hôm nay chưa điểm danh**.

```
┌ Phúc Lợi ─────────────────────────────────────────── [X] ┐
│ ▸ Điểm danh     │  Sổ Điểm Danh · chu kỳ 21 ngày          │
│   (mục sau này) │  Kết thúc sau 15 ngày 2 giờ 59 phút     │
│                 │  Đã ký 7 / 21      Lượt ký bù còn: 5 [?]│
│                 │ ┌01┬02┬03┬04┬05┬06┬07★┐                │
│                 │ │✓ │✓ │✓ │✓ │✓ │✓ │✓ │  (quá khứ xám) │
│                 │ ├08┼09┼10┼11┼12┼13┼14★┤                │
│                 │ │▶hôm nay │  chưa ký (có thể ký bù)     │
│                 │ ├15┼16┼17┼18┼19┼20┼21★┤  (tương lai)    │
│                 │ └──┴──┴──┴──┴──┴──┴──┘                 │
│                 │            [ Điểm danh hôm nay ]        │
└────────────────────────────────────────────────────────────┘
```

- **Lưới 7 × 3:** mỗi ô: số ngày, biểu tượng quà (icon vật phẩm hiện có), `x N`. Mốc đặc biệt nền vàng + nhãn "Mốc" (dạng + chữ, không chỉ màu).
- **Trạng thái ô** (hình + dấu): *đã ký* (xám + tick), *ký bù được* (viền nét đứt, tooltip "Ký bù: tốn 1 lượt"), *hôm nay* (nổi, mũi tên, đếm lùi tới 00:00), *tương lai* (bình thường, không bấm), *mốc*; *vừa ký bù* (nhãn "bù" nhỏ). Ô quá khứ chưa ký và hết lượt ký bù: *khóa* (xám + lý do trong tooltip).
- **Đếm ngược:** thời gian còn lại của chu kỳ và tới 00:00 lấy từ `endsAt` / `now` của server (đã bù lệch giờ), chỉ để hiển thị.
- **Trạng thái bắt buộc của màn:** *chưa có chu kỳ* (hiện lưới trống kèm "Điểm danh để bắt đầu chu kỳ mới"), *đang tải*, *đang gửi* (nút tắt + vòng quay; không cho bấm đôi), *thành công* (toast + ô đổi trạng thái + quà bay vào túi), *lỗi* (lý do tiếng Việt, ô không đổi; túi đầy ghi rõ "Túi không đủ chỗ"), *mất kết nối*, *hết chu kỳ chờ mở chu kỳ mới*. Xác nhận 2 bước khi ký bù tốn Hồn Tệ (luật 8).
- Cột mục bên trái chỉ có **một mục** ở v1; thêm mục cần quyết định riêng (quà theo mốc cấp, v.v.).
- Esc đóng theo ngăn xếp (`panelStack.ts`); PC (Q40).

### Lộ trình triển khai (mỗi bước một PR nhỏ)
| Bước | Việc | Kiểm thử |
|---|---|---|
| P0 | Tài liệu này (+ dòng mục lục `GAME_DESIGN.md`) | `npm run check`, `tools/docs-check.mjs` |
| P1 | `shared/data.ts`: `CHECKIN`, `checkinDay`, `checkinOpen`; test thuần (ranh giới ngày 00:00, ô tương lai, hết chu kỳ) + **test quan hệ trần quà** | `npm run check` |
| P2 | SQL `checkin_state` + `Store.checkinGet` / `checkinClaim` (cả `PgStore` lẫn `MemoryStore`) | bot `--pg`: migration chạy lại hai lần; ghi có điều kiện không nhân quà khi hai tiến trình tranh |
| P3 | Server: tin `welfare` (`get`, `sign`, `makeup`), `welfare.ts`, trừ phí, hoàn khi lỗi, tin lúc qua 00:00 | bot nhóm mới `welfare`: ký hôm nay, ký đúp, ký bù đủ / hết lượt, ô lạ, túi đầy, tin lạ, dồn 200 `sign`; đẩy ngày bằng `bossOffset`; hook `savefail` kiểm hoàn lại |
| P4 | Client: màn Phúc Lợi (lưới, mốc, đếm lùi, trạng thái) + chấm đỏ | `client-ui` + ảnh chụp Chrome headless (`--mute-audio`) đủ trạng thái |
| P5 | Soát chống gian lận (`anti-cheat-audit`) + `balance-review` bảng trần quà | tài liệu soát + bảng quan hệ với số thật |

### Câu hỏi mở
Gom ở mô tả PR; riêng phúc lợi: (3) chu kỳ riêng từ lần ký đầu hay chu kỳ chung theo lịch, mốc theo thứ tự ô hay tổng số ô đã ký; (4) nguồn lượt ký bù.

## Lịch sử / issue liên quan
- Khung màn: bộ spec UI (#877, mục 3 dòng 13).
- Khuôn thưởng nhận đúng một lần có túi và DB một transaction: đổi mảnh ở Thương hội (mục 5.7), thưởng tuần tông (mục 5.14).
- Nhật ký từng bước: `docs/lich-su.md`.
