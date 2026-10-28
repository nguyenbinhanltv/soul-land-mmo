# Soát chống gian lận: Phúc Lợi, Sổ Điểm Danh (#877, bước P5)

Soát theo skill `anti-cheat-audit`. Phạm vi: tin `welfare {op: "get" | "sign" | "makeup", day?, pay?}` đã gộp ở #1207 (`server/src/rooms/welfare.ts`, `MapRoom` chuyển tiếp, `checkinGet` / `checkinClaim` của `PgStore` và `MemoryStore`, `server/sql/038_phuc_loi.sql`). Thiết kế: `docs/design/phuc-loi.md` mục 5.21.
Ngày soát 2026-10-28, trên `main` tại `f76f6441`.

## Tóm tắt

| # | Giả thuyết | Kết quả | Mức |
|---|---|---|---|
| 1 | Đổi giờ máy / múi giờ để có thêm ô hoặc ký ô tương lai | **Không khai thác được**: client không gửi giờ; ngày từ `bossNow()` + `dayShift` (chỉ `GAME_TEST=1`), `vnDayNum` cố định giờ Việt Nam | — |
| 2 | Đồng hồ server lùi (sự cố / chỉnh tay) để mở lại ô | **Chặn đúng**: `now < lastAt` từ chối cả `sign` lẫn `makeup`; DB cũng chặn trong câu `UPDATE` (`last_at <= mới`) | — |
| 3 | Dồn hai tin cùng lúc / hai tab / hai tiến trình để ký đúp, nhân quà | **Không khai thác được**: tin xếp trong `this.chain(d, …)`, `claimBusy` chặn lần sau, DB ghi có điều kiện `ver` + `(mask & bit) = 0` cùng transaction với túi | — |
| 4 | Ký bù ô tương lai / hôm nay / đã ký / ngoài chu kỳ / số lạ (`NaN`, âm, thực, chuỗi, `null`, 1e9) | **Chặn đúng** (`intIn`, `i >= today - startDay`, `checkinOpen`, cần chu kỳ đang chạy) | — |
| 5 | Vượt `makeupMax` / lượt miễn phí, trả phí không đủ tiền, bỏ `pay` | **Chặn đúng** (`checkinFee`, kiểm `pay === true`, `honTe` kiểm và trừ cùng một nhịp đồng bộ; DB kiểm `makeup_used <= makeupMax`) | — |
| 6 | Hoàn tiền khi ghi DB lỗi: âm tiền, nhân tiền | **Đúng**: hoàn theo hiệu, kẹp ≥ 0, mask không đổi; bot `savefail` kiểm | — |
| 7 | Lớp DB chỉ giữ `ver`, `mask`, `makeup_used`: thiếu kiểm `start_day` (đổi giữa chu kỳ = kéo dài / dời chu kỳ, mở chu kỳ mới sớm), `bit` ngoài lưới `days` | **Lỗ phòng thủ** (chỉ khai thác được nếu tầng phòng có lỗi, hiện không) | Thấp → **đã sửa** |
| 8 | Spam `sign` / `makeup` làm tốn DB | **Giới hạn đúng** (nhóm `trade`: `MSG_GROUP.trade`); mỗi tin bị từ chối vẫn tốn một lần đọc dòng DB cộng một lần đọc để trả trạng thái, nên tối đa cỡ `rate` × 2 lần đọc mỗi giây mỗi tài khoản | Thấp (chấp nhận) |
| 9 | Bài bot bỏ sót kiểm giới hạn tần suất thật | `msgLimit` mặc định tắt khi `GAME_TEST=1` nên bài dồn 200 `sign` cũ không thử giới hạn | Thấp → **đã bổ sung** |
| 10 | Tài khoản mới / nuôi nhiều tài khoản | Quà nhỏ, không chuyển được, mỗi tài khoản đúng bằng một người chơi thật | — |
| 11 | Hồn Tệ / mảnh / Ủy Thác Lệnh / đan vượt trần quan hệ một chu kỳ | **Đúng** (bảng dưới; `server/scripts/welfare-test.ts` kiểm) | — |

Không có lỗi Nghiêm trọng / Cao / Vừa. Hai mục "đã sửa / bổ sung" nằm trong cùng PR với tài liệu này.

## Danh sách bề mặt đã soát

| Tin / route | Kết quả |
|---|---|
| `welfare {op:"get"}` | Đã đọc, ổn: nhóm `read` + `room.ask` (nhịp `ASK_CD`, gộp), chỉ trả dữ liệu của chính chủ |
| `welfare {op:"sign"}` | Đã đọc, ổn (mục 1–3, 8); bot thử: ký đúp, dồn 200, tin lạ, đồng hồ lùi, túi đầy |
| `welfare {op:"makeup"}` | Đã đọc, ổn (mục 4–6); bot thử: ô lạ, miễn phí / trả phí / hết lượt, chưa `pay`, thiếu tiền |
| Tin `welfare` server → client | Chỉ chính chủ (`room.clients.getById(id).send`); không vào `schema.ts`; không bảng xếp hạng điểm danh |
| `ArenaRoom` | `welfare` nằm trong `BLOCKED`; bot thử trong sân |
| Hook `day {shift}`, `baglimit` | Chỉ có hiệu lực khi `GAME_TEST=1` (`gm.ts`); `bossNow()` là đồng hồ thật khi không `GAME_TEST` (`schedule.ts`) |
| SQL `038_phuc_loi.sql` | Chạy lại an toàn, bật RLS, ràng buộc `mask` / `makeup_used`; `removeTestAccount` xoá dòng |

## Chi tiết các mục chính

**1–2. Giờ.** `nowOf(room) = bossNow() + room.dayShift * DAY_MS`; `dayShift` chỉ đổi qua hook `day` của GM / test (`gm.ts`, sau kiểm `GAME_TEST`). `vnDayNum` qua `vnClock` cố định UTC+7, không phụ thuộc múi giờ máy. Chu kỳ riêng mỗi tài khoản nên không có "ngày chung" để lợi dụng. Đồng hồ lùi: từ chối + log `[phúc lợi]`. Hai tiến trình lệch đồng hồ vài mili-giây quanh lúc vừa ký chỉ gây từ chối nhầm hiếm, thử lại là được (thiệt cho người chơi, không có lợi cho kẻ gian).

**3. Race.** Trình tự trong `welfareAction`: `claimHeld` (từ chối khi đang giữ) → `claimBusy++` → `chain` đọc dòng mới trong chuỗi lưu → kiểm đủ điều kiện → cộng quà trong RAM → `store.checkinClaim` (một transaction túi + sổ, `ver`). `chain` nuốt lỗi và `.then` vẫn giảm `claimBusy` nên lỗi DB không khoá người chơi. Hai tiến trình / hai phiên: `onAuth` đá phiên cũ; nếu vẫn tranh chấp thì `ver` / `(mask & bit) = 0` cho đúng một bên thắng, bên kia nhận `ver === null` và hoàn quà (`takeBack`).

**6. Hoàn.** `takeBack` trả phí và trừ lại quà Hồn Tệ theo hiệu, `max(0, …)`. Tồn đọng (Thấp, không khai thác được vì cần ghi DB lỗi mà người chơi không gây được): nếu trong lúc chờ DB người chơi tiêu hết phần Hồn Tệ vừa nhận thì số hoàn bị kẹp về 0, họ giữ phần đã tiêu; `claimBusy` chặn bán / bỏ đồ nên túi không thoát được.

**7. Đã sửa: ràng buộc DB.** Trước: `checkinClaim` kiểm `ver`, `mask`, `makeup_used`, `last_at`, nhưng việc "`start_day` chỉ đổi lúc mở chu kỳ mới và chỉ khi chu kỳ cũ đã hết" (thiết kế, mục Chống gian lận) chỉ do `welfare.ts` bảo đảm. Sau (`CheckinPatch.days`): cùng chu kỳ thì `start_day` phải y nguyên; chu kỳ mới chỉ mở khi `startDay >= start_day cũ + days`; `bit` phải `< 1 << days`. Cả `MemoryStore` lẫn `PgStore`; test "soát P5" ở `server/scripts/welfare-test.ts` và bot `--pg`.

**9. Đã bổ sung bài bot.** `client/scripts/bot/welfare.mjs` mục 3b: bật `baglimit {on:true}`, dồn 200 `sign`, kỳ vọng chỉ xử lý cỡ `MSG_GROUP.trade.burst` tin (đo được 20), `mask` và Hồn Tệ không đổi, vẫn kết nối.

## Bảng trần quà một chu kỳ (số thật lúc soát)

Hằng ở `shared/data.ts` (`CHECKIN`, `TONG_WEEK_REWARD`, `SHARD_BUY`, `AUTO_DAILY_SECS`, `AUTO_BONUS_MAX`, `SHOP`); `welfare-test.ts` kiểm các quan hệ, code không chép số.

| Thứ | Tổng 21 ô | Trần | Quan hệ |
|---|---|---|---|
| Hồn Tệ | 570 | 600 (= 3 × `TONG_WEEK_REWARD.rest.honTe`) | ≤, còn 30 dư |
| Mảnh võ hồn (SR / SSR) | 10 | 10 (= `SHARD_BUY.daily`) | ≤, sát trần |
| Ủy Thác Lệnh | 3 lệnh = 21 600 giây | `AUTO_DAILY_SECS` 43 200, `AUTO_BONUS_MAX` 86 400 | ≤ cả hai |
| Đan / phù theo giá `SHOP` | 260 | 300 (= trần Hồn Tệ × `shopShare` 0,5) | ≤ |
| Hồn hoàn, cốt, hạch, trang bị, tiên thảo, rương | 0 | không có | đúng |
| Ký bù | phí 12 000 / 18 000 / 27 000 (tổng 57 000) | quà ô đắt nhất 11 120, cả chu kỳ 22 330 | phí đầu ≥ ô đắt nhất; tổng phí > tổng quà cả chu kỳ: không thành vòng in tiền |

Tối đa nhận được là ký đủ 21 ô (kể cả ký bù, 2 lượt miễn phí cộng 3 lượt trả phí): không có đường nhận vượt bảng; chu kỳ mới chỉ mở sau khi chu kỳ cũ hết nên không chồng hai chu kỳ trong 21 ngày.

## Cách kiểm lại

`npm run test:welfare --prefix server`; `npm run bot:local -- --only welfare` (thêm `--pg` khi đụng SQL / `checkinClaim`); `npm run check`.
