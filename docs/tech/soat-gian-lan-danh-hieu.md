# Soát chống gian lận: Danh Hiệu (#1766, bước P1)

Soát theo skill `anti-cheat-audit`. Phạm vi: tin `title {op: "get" | "equip", id?}` (`server/src/rooms/title.ts`, `MapRoom` chuyển tiếp), `grantTitle` (chỉ server gọi), `titleGet` / `titleGrant` / `titleEquip` của `PgStore` và `MemoryStore`, `server/sql/042_danh_hieu.sql`, trường công khai `PlayerState.titleId`, bài `server/scripts/title-test.ts`. Chưa có nguồn mở khoá ngoài danh hiệu cấp (thành tựu, xếp hạng tuần, boss lần đầu là P5, sẽ soát lại ở đó).

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
