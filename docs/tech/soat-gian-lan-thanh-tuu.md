# Soát chống gian lận: Thành Tựu (#1317, bước P4)

Soát theo skill `anti-cheat-audit`. Phạm vi: tin `achv {op: "get" | "claim", id?}` (`server/src/rooms/achv.ts`, `MapRoom` chuyển tiếp), bộ đếm sự kiện (`achvCount` ở `kill.ts`, `boss.ts`, `BiCanhRoom.ts`), `achvGet` / `achvBump` / `achvClaim` của `PgStore` và `MemoryStore`, `server/sql/039_thanh_tuu.sql`, bài `server/scripts/achv-test.ts` và bot nhóm `achv`.

## Tóm tắt

| # | Giả thuyết | Kết quả | Mức |
|---|---|---|---|
| 1 | Client báo "đã đạt" / gửi chỉ số hoặc phần thưởng | **Không khai thác được**: tin chỉ có `op` và `id`; `id` so với danh mục đóng `ACHV` (`achvDef`, chuỗi / số / object / `__proto__` bị từ chối); chỉ số tính ở server | — |
| 2 | Nhận hai lần: dồn tin, hai tab, hai tiến trình | **Không khai thác được**: `claimBusy` + chuỗi lưu, và DB ghi `UPDATE … WHERE NOT (claimed @> ARRAY[id])` sau khi khóa dòng (`FOR UPDATE`) cùng transaction với túi / Hồn Tệ; thua thì `ROLLBACK`, không ghi túi. Bot: dồn 200 `claim`, năm `claim` cùng lúc: đúng một lần | — |
| 3 | Nhận khi chưa đạt (đạt giả bằng cờ cũ) | **Chặn đúng**: kiểm lại ở hai lớp, chỉ số lúc đó ở phòng, rồi bộ đếm đọc **trong** transaction (`reached` trong `achvClaim`) | — |
| 4 | Bộ đếm bị cộng giả / âm / mã lạ | **Chặn đúng**: không có tin client nào cộng; `achvBump` kiểm mã trong `ACHV_COUNTERS` và `n` nguyên 1..1e6; bộ đếm chỉ tăng. Hook `achv` chỉ chạy khi `GAME_TEST=1` | — |
| 5 | Cày bộ đếm bằng sự kiện lặp | **Giới hạn bởi luật chơi có sẵn**: tinh anh chỉ đếm người nhận thưởng (khóa `ELITE.lock` theo loài + bản đồ, mọi kênh); thú vương / boss thế giới chỉ đếm người đóng góp từ `K.share` và chưa nhận rương khung giờ đó; Bí Cảnh chỉ đếm lượt thắng đủ sóng, lượt đã trừ nguyên tử (`BICANH.runs` + mua có trần mỗi ngày) | — |
| 6 | Hoàn tiền khi ghi DB lỗi: âm tiền, nhân tiền, mất thành tựu | **Đúng**: `takeBack` trả lại Hồn Tệ và vật phẩm, thành tựu chưa đánh dấu; bot `savefail` kiểm, nhận lại được ngay | — |
| 7 | Túi đầy: mất thành tựu hoặc quà vượt ô | **Đúng**: `bagFits` kiểm cả danh sách quà trước, từ chối không đánh dấu đã nhận; bot thử túi đầy rồi bỏ đồ nhận được | — |
| 8 | Spam `claim` / `get` làm tốn DB | **Giới hạn đúng**: `get` nhóm `read` + `room.ask` (nhịp `ASK_CD`); `claim` thêm nhịp nhóm `trade`; mỗi tin bị từ chối tốn một lần đọc `achv_state` + một lần `arena_ratings` | Thấp (cùng mức Phúc Lợi) |
| 9 | Nuôi nhiều tài khoản | Thưởng nhỏ, không chuyển được, nhận một lần mỗi tài khoản; trần tổng cả danh mục ở bảng dưới | — |
| 10 | Nhận trong sân đấu / Bí Cảnh | **Chặn**: `achv` trong `BLOCKED` của `ArenaRoom`, `BiCanhRoom` kế thừa | — |
| 11 | Mất một lần đếm khi phòng sập giữa chừng | Chấp nhận: bộ đếm ghi qua chuỗi lưu, lỗi chỉ log; không có đường cộng bù (không khai thác được, chỉ thiệt cho người chơi) | Thông tin |
| 12 | Lượt Bí Cảnh được hoàn do lỗi lưu mà vẫn tính một lần thắng | Có thể đếm dư một lần khi server lỗi (người chơi không gây được); thưởng nhỏ, không khai thác | Thông tin |
| 13 | Mã thành tựu suy từ ngưỡng: đổi ngưỡng / thêm võ hồn mở lại lượt nhận, vượt trần tổng | **Đã sửa** (review #1329): mã bậc tường minh (`level_t1`, `owned_all`, …), test giữ danh sách mã đã phát hành | Vừa → đã sửa |

Không có lỗi Nghiêm trọng / Cao còn tồn; một lỗi Vừa (dòng 13 của bảng) đã sửa trong cùng PR.

## Danh sách bề mặt đã soát

| Tin / route | Kết quả |
|---|---|
| `achv {op:"get"}` | Đã đọc, ổn: nhóm `read` + `room.ask`, chỉ trả dữ liệu của chính chủ |
| `achv {op:"claim", id}` | Đã đọc, ổn (mục 1–3, 6–8); bot thử: chưa đạt, đúp, dồn 200, năm cùng lúc, id lạ, savefail, túi đầy, vào lại phòng |
| Tin `achv` server → client | Chỉ chính chủ; không vào `schema.ts`; không bảng xếp hạng thành tựu |
| Bộ đếm `achvCount` | Gọi ở nơi server quyết định sự kiện: `kill.ts` (tinh anh), `boss.ts` (thú vương / boss thế giới), `BiCanhRoom.finish` (thắng) |
| Hook test `achv` | Chỉ có hiệu lực khi `GAME_TEST=1` (`gm.ts`) |
| SQL `039_thanh_tuu.sql` | Chạy lại an toàn (bot `--pg` bật server hai lần), bật RLS không policy; `removeTestAccount` xoá dòng |

## Bảng trần thưởng cả danh mục (số thật lúc soát)

Hằng ở `shared/data.ts` (`ACHV`, `ACHV_CAP`, `CHECKIN.cycleCap`, `SHARD_BUY`, `AUTO_DAILY_SECS`, `AUTO_BONUS_MAX`); `server/scripts/achv-test.ts` kiểm các quan hệ, code không chép số.

| Thứ | Tổng cả danh mục | Trần | Quan hệ |
|---|---|---|---|
| Hồn Tệ | 2 280 | 2 400 (= `ACHV_CAP.honTeK` 4 × `CHECKIN.cycleCap.honTe` 600) | ≤, còn 120 dư |
| Mảnh võ hồn (SR / SSR) | 16 | 20 (= `ACHV_CAP.shardsK` 2 × `SHARD_BUY.daily` 10) | ≤ |
| Ủy Thác Lệnh | 2 lệnh = 14 400 giây | `ACHV_CAP.autoK` 1 × `AUTO_DAILY_SECS` 43 200; `AUTO_BONUS_MAX` 86 400 | ≤ cả hai |
| Hồn hoàn, cốt, hạch, trang bị, tiên thảo, rương, đan | 0 | không có | đúng |

Thưởng chỉ nhận một lần cả đời mỗi tài khoản (không lặp theo chu kỳ), nên trần so sánh với nhiều chu kỳ điểm danh, không phải một.
