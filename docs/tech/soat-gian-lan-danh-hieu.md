# Soát chống gian lận: Danh Hiệu (#1766, bước P1)

Soát theo skill `anti-cheat-audit`. Phạm vi: tin `title {op: "get" | "equip", id?}` (`server/src/rooms/title.ts`, `MapRoom` chuyển tiếp), `grantTitle` (chỉ server gọi), `titleGet` / `titleGrant` / `titleEquip` của `PgStore` và `MemoryStore`, `server/sql/042_danh_hieu.sql`, trường công khai `PlayerState.titleId`, bài `server/scripts/title-test.ts`. Bước P1 chỉ có danh hiệu cấp; **P5 (#1778) soát thêm ba nguồn mở khoá** (thành tựu, chốt tuần xếp hạng, boss lần đầu) ở mục "Soát P5" cuối tài liệu: `server/src/titleWeek.ts`, `titleCloseWeek` / `bossFirst` của hai kho, `server/sql/043_danh_hieu_nguon.sql`.

## Tóm tắt

| # | Giả thuyết | Kết quả | Mức |
|---|---|---|---|
| 1 | Client tự cấp danh hiệu (gửi `op: "grant"`, mã, hạn, cấp) | **Không khai thác được**: chỉ có `op` `get` / `equip`; `grantTitle` chỉ do server gọi từ sự kiện server; mọi `op` khác bị bỏ | — |
| 2 | Đeo danh hiệu chưa mở / của người khác / đã hết hạn | **Chặn đúng**: `titleEquip` kiểm sở hữu + `expires_at` NGAY TRONG câu `INSERT … SELECT … WHERE EXISTS` (không có khoảng hở kiểm rồi ghi); tài khoản khác không có dòng `title_owned` của mình. Test: giả mạo `equip` mã chưa mở, mã lạ, số, object | — |
| 3 | Mã lạ / kiểu lạ (`__proto__`, object, số) | **Chặn đúng**: `strIn` + `titleDef` so với danh mục đóng `TITLE_DEFS`; store ném với mã lạ | — |
| 4 | Kéo dài hạn / hạ vĩnh viễn thành có hạn bằng cách cấp lại | **Chặn đúng**: `titleGrant` chỉ ghi đè dòng ĐÃ hết hạn (`WHERE expires_at IS NOT NULL AND expires_at <= now()`); còn hạn hoặc vĩnh viễn thì "dup", không đổi gì | — |
| 5 | Hạn dùng theo đồng hồ client / đổi giờ máy | **Không khai thác được**: hạn do server tính (`titleExpiry`, giờ Việt Nam) và DB so với `now()`; `titleGet` lọc hạn mỗi lần đọc; bộ hẹn giờ ở phòng chỉ để về mặc định đúng lúc, không tin client | — |
| 6 | Đang đeo danh hiệu hết hạn mà vẫn hiện | **Đúng**: `titleGet` trả `equipped = null` khi dòng đã hết hạn; `refresh` đặt `titleId = ""` và hẹn giờ theo hạn; test kéo hạn về quá khứ rồi `get` | — |
| 7 | Rò thông tin ngoài tầm nhìn / danh sách đã mở | **Không rò**: `titleId` là chuỗi mã công khai (vốn để khoe), nằm trong `PlayerState` nên theo đúng `interest.ts`; danh sách đã mở + hạn chỉ qua tin riêng `title` cho chính chủ | — |
| 8 | Spam `get` / `equip` làm tốn DB | **Giới hạn đúng**: `get` nhóm `read` + `room.ask` (nhịp `ASK_CD`); `equip` thêm nhịp nhóm `trade`, ghi qua chuỗi lưu `room.chain`; mỗi lần đọc là hai câu SELECT theo khoá chính | Thấp (cùng mức Thành Tựu) |
| 6b | Danh hiệu có hạn hết hạn rồi được cấp lại tự đeo lại, lệch `titleId` | **Đã sửa** (review #1772): `titleGrant` "new" đưa `title_equipped` mã đó về NULL (mặc định thật); test đeo → hết hạn → cấp lại | Vừa → đã sửa |
| 9 | Hai tab / hai tiến trình cùng cấp một danh hiệu | **Đúng**: khoá chính `(account_id, title_id)` + `ON CONFLICT`; một nơi thắng, nơi kia "dup" | — |
| 10 | Đổi danh hiệu trong sân đấu / Bí Cảnh | **Chặn**: `title` trong `BLOCKED` của `ArenaRoom`, `BiCanhRoom` kế thừa | — |
| 11 | Danh hiệu thành nguồn kinh tế (mua / bán / chuyển) | **Không có**: không Hồn Tệ, không vật phẩm, không tin chuyển; chỉ trưng bày, không cộng chỉ số | — |
| 12 | Lên cấp rồi đeo cấp mới khi chưa mở | **Đúng**: `equip` mở bù danh hiệu cấp theo cấp cao nhất các võ hồn ĐÃ nạp ở server (`syncLevelTitles`), không theo chỉ số client | — |
| 13 | Bộ hẹn giờ rò bộ nhớ khi người chơi rời | **Đã xử lý**: `titleLeave` dọn khi rời phòng; hẹn giờ `unref`, kiểm `pdata.get(id) === d` trước khi làm | Thông tin |

Không có lỗi Nghiêm trọng / Cao / Vừa còn tồn.

## Danh sách bề mặt đã soát

| Tin / route | Kết quả |
|---|---|
| `title {op:"get"}` | Đã đọc, ổn: nhóm `read` + `room.ask`, chỉ trả dữ liệu của chính chủ; mở bù danh hiệu cấp |
| `title {op:"equip", id}` | Đã đọc, ổn (mục 2–4, 8, 12); `id` rỗng / thiếu = về mặc định |
| Tin `title` server → client | Chỉ chính chủ, không vào `schema.ts`; `fresh` (mã mới mở) chỉ lần đầu |
| `PlayerState.titleId` | Chuỗi mã công khai, theo `interest.ts`; "" = mặc định theo cấp |
| `grantTitle` | Chỉ server gọi; idempotent; mã lạ ném (lỗi lập trình); thiếu mốc hạn sự kiện ném |
| SQL `042_danh_hieu.sql` | `CREATE TABLE IF NOT EXISTS`, bật RLS không policy; `removeTestAccount` xoá cả hai bảng; bot `--pg` bật server hai lần |

## Soát P5: nguồn mở khoá (#1778)

Phạm vi: `titleAchvClaimed` (achv.ts), `titleBossKilled` (boss.ts `killKing`), `closeTitleWeek` / `startTitleWeek` (`server/src/titleWeek.ts`, gọi từ `schedule.ts`), `titleCloseWeek` + `bossFirst` của `PgStore` và `MemoryStore`, SQL `043_danh_hieu_nguon.sql` (`title_week_close`, `title_first_kill`). Không thêm tin client nào: mọi nguồn chạy từ sự kiện server.

| # | Giả thuyết | Kết quả | Mức |
|---|---|---|---|
| 14 | Client tự đòi danh hiệu thành tựu / boss / xếp hạng | **Không có đường**: không tin mới; `title` vẫn chỉ `get` / `equip`; `grantTitle` / `titleBossKilled` / `closeTitleWeek` chỉ server gọi | — |
| 15 | Mở danh hiệu thành tựu khi chưa nhận | **Chặn**: chỉ gọi sau khi `store.achvClaim` trả "ok" (điều kiện kiểm lại trong transaction); mở bù lúc vào phòng chỉ đọc `achv_state.claimed` đã ghi ở server | — |
| 16 | Chốt tuần chạy hai lần (khởi động lại, hai pod, hai lần hẹn giờ) cấp trùng | **Chặn**: dấu `title_week_close (week_day, board)` ghi cùng transaction với các dòng `title_owned`; lần hai `ON CONFLICT DO NOTHING` không trả dòng → ROLLBACK, trả null. Mã lạ trong `tiers` ném trước khi ghi dấu. Không dựa vào lease lịch để chống trùng (lease chỉ để đỡ tốn) | — |
| 17 | Danh hiệu tuần cộng dồn / kéo dài qua nhiều tuần | **Chặn**: mỗi bảng một mức (mức nhỏ nhất mà hạng thỏa, không cộng dồn); hạn cố định `weekStartVn(now, 1)` = hết tuần kế; `titleGrant` chỉ ghi đè dòng ĐÃ hết hạn; chỉ chốt tuần VỪA kết thúc (server tắt cả tuần thì bỏ tuần đó, không cấp muộn) | — |
| 18 | Tài khoản test / nhiều tài khoản phụ chiếm bảng để nhận danh hiệu | **Test: loại** (`NOT a.is_test` ở Pg, `rankSorted` ở Memory). Tài khoản phụ thật: danh hiệu chỉ trưng bày, không giá trị kinh tế; điểm bảng vẫn do server suy ra (soát X5) | Thấp |
| 19 | Chạy đua server-first giữa kênh / pod | **Chặn**: khoá chính `title_first_kill.boss_id`; `kill_key` = `roomId|khung|bid` duy nhất mỗi lần hạ; chỉ lần ghi dòng thắng, mọi người đóng góp CÙNG lần hạ cùng thắng, lần hạ khác thua. Test chạy đua 4 khoá song song: đúng một thắng | — |
| 20 | Người không đóng góp (đứng xem) nhận danh hiệu boss | **Chặn**: gọi trong nhánh đã đủ ngưỡng đóng góp `K.share` và chưa nhận thưởng khung giờ đó ở kênh khác (cùng nhánh cấp rương) | — |
| 21 | Danh hiệu thành nguồn kinh tế | **Không**: vẫn chỉ trưng bày, không Hồn Tệ / vật phẩm | — |

Ghi chú vận hành: server-first tính từ lúc `043` chạy (lần hạ đầu tiên SAU khi triển khai thắng; không truy hồi lịch sử). Lần chốt tuần đầu sau triển khai cấp theo bảng điểm lúc đó. Người đang online không thấy danh hiệu tuần mới tới khi gửi `title {op:"get"}` / vào lại phòng (không đẩy riêng).

Không có lỗi Nghiêm trọng / Cao / Vừa còn tồn.

## Soát cuối P6: bot + đối chiếu ba điểm chốt (#1789)

Phạm vi: bài bot `client/scripts/bot/title.mjs` (`BOT_ONLY=danhhieu`, nhóm 2 của `BOT_PART`; chạy `bot:local` cả RAM và `--pg`, 82 / 82 kiểm tra đạt), hook kiểm thử `test {op:"title"}` mới ở `rooms/gm.ts` (CHỈ `GAME_TEST=1`; ngoài đó `testHook` trả `enabled:false` từ dòng đầu), đọc lại toàn bộ chỗ gọi `titleGrant` / `grantTitle` / `titleCloseWeek` / `bossFirst` / `titleEquip`.

| # | Điểm chốt | Kết quả | Mức |
|---|---|---|---|
| 22 | Chốt tuần idempotent | **Đạt**: `titleCloseWeek` ghi dấu `(week_day, board)` cùng transaction với các dòng `title_owned`; lần hai không ghi được dấu → không cấp, trả null (Pg: `ON CONFLICT DO NOTHING` + ROLLBACK; Memory: tập `titleWeeks`). `titleGrant` vốn idempotent (dup khi còn hạn) nên cả hai tầng cùng chặn cấp trùng; test `title-test` chạy chốt hai lần | — |
| 23 | Server-first không chạy đua | **Đạt**: `bossFirst` là một lệnh ghi có điều kiện theo khoá chính `boss_id` (Pg `INSERT … ON CONFLICT DO NOTHING` rồi so `kill_key`; Memory `Map` đồng bộ); chỉ lần hạ ghi được dòng thắng, mọi người đóng góp CÙNG lần hạ cùng thắng. Không có bước "đọc rồi ghi" tách rời | — |
| 24 | Không có đường client ghi danh hiệu | **Đạt**: tin client duy nhất `title` chỉ nhận `op` `get` / `equip`; bài bot gửi `op:"grant"`, `"set"`, id lạ / object / mảng / `__proto__` / số / null và 200 `equip` dồn: không mở gì, không rời kết nối. Chỗ gọi `titleGrant` ngoài đó chỉ có `title.ts` (cấp theo cấp / thành tựu đã nhận / hạng tuần / boss, đều từ trạng thái server), `db.ts` (`titleCloseWeek`) và hook `gm.ts` (chỉ GAME_TEST) | — |
| 25 | Hook `test {op:"title"}` mở đường cấp cho client ở production | **Không**: cùng cổng `GAME_TEST` với mọi hook kiểm thử khác (production không bật, `enabled:false`); chỉ cấp cho chính người gọi, mã phải có trong `TITLE_DEFS` | Thông tin |
| 26 | Người khác thấy `titleId` ngoài tầm nhìn | **Không rò**: bot đưa người quan sát ra xa hơn 900 pixel thì người đeo không còn trong state của họ; quay lại thì thấy lại | — |
| 27 | Danh hiệu có hạn đang đeo tự về mặc định | **Đạt** ở cả RAM và PostgreSQL: bộ hẹn giờ hạ `titleId` về rỗng, tin riêng báo lại, đeo lại danh hiệu đã hết hạn bị từ chối | — |

Không có lỗi Nghiêm trọng / Cao / Vừa còn tồn; soát lần cuối không đổi luật chống gian lận nào (chỉ thêm bài bot và hook GAME_TEST).

