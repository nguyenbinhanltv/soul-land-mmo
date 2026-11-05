# Soát chống gian lận: Thư hệ thống (#1336, bước P4)

Soát theo skill `anti-cheat-audit`. Phạm vi: tin `mail {op: "get" | "read" | "claim" | "claimAll" | "del", id?}` (`server/src/rooms/mail.ts`, `MapRoom` chuyển tiếp), `mailList` / `mailSend` / `mailRead` / `mailClaim` / `mailDelete` của `PgStore` và `MemoryStore`, `server/sql/040_thu.sql`, lệnh `/gm mail`, hook test `mail`, `ArenaRoom` / `BiCanhRoom` (`BLOCKED`). Thiết kế: `docs/design/thu.md` (mục 5.24).

## Tóm tắt

| # | Giả thuyết | Kết quả | Mức |
|---|---|---|---|
| 1 | Client tạo thư / sửa đính kèm | **Không khai thác được**: không có tin client nào tạo thư; `mail` chỉ có `op` và `id` số nguyên dương (chuỗi, số âm / lẻ, object, `__proto__` bị từ chối trước khi chạm DB); đính kèm lấy từ DB | — |
| 2 | Nhận hai lần: dồn tin, hai tab, hai tiến trình | **Không khai thác được**: `claimBusy` + chuỗi lưu, và DB ghi `UPDATE mail SET claimed_at … WHERE claimed_at IS NULL AND deleted_at IS NULL AND expires_at > now()` cùng transaction với túi / Hồn Tệ; không trúng dòng thì `ROLLBACK`, không ghi túi. Bot thử: nhận đúp, dồn 200, năm tin cùng lúc | — |
| 3 | Nhận thư của người khác (`id` đoán được: số tăng dần) | **Chặn đúng**: mọi câu SQL ràng `account_id`; thư của người khác = "không còn" (`gone`), không lộ nội dung; `mailList` chỉ trả thư của chính chủ | — |
| 4 | Nhận thư hết hạn (đồng hồ client, tab mở lâu) | **Chặn đúng**: hạn so với `now()` của DB trong chính câu `UPDATE`, không tin giờ client; thư hết hạn bị dọn khi chủ mở hộp | — |
| 5 | Nhận gói đính kèm khi túi đầy (mất đồ / vượt ô) | **Đúng**: `bagFits` kiểm cả gói trước, từ chối không đánh dấu đã nhận, không nhận nửa phần; bot thử túi đầy rồi bỏ đồ nhận được | — |
| 6 | Hoàn khi ghi DB lỗi: âm tiền, nhân tiền | **Đúng**: `takeBack` trả lại Hồn Tệ và vật phẩm, thư chưa đánh dấu; bot `savefail` kiểm, nhận lại được ngay | — |
| 7 | Một sự kiện nguồn ra nhiều thư (nhân thưởng) | **Chặn đúng**: `unique (account_id, dedup)` + `ON CONFLICT DO NOTHING`; xóa mềm giữ `dedup` tới hết hạn. Khóa `dedup` do **nguồn** đặt gắn với sự kiện (hiện: GM sinh mã mới mỗi lệnh); nguồn Phúc Lợi (#1622) và Bí Cảnh (#1584) đã nối đúng khuôn: khóa theo ô / phòng (`welfare:<chu kỳ>:<ô>`, `bicanh:<ngày>:<mã phòng>`), thư ghi cùng transaction với dấu "đã dùng" của nguồn (ô đã ký / bộ đếm quyển ngày) | Đã nối |
| 8 | Dồn `get` / `claim` làm tốn DB | **Giới hạn đúng**: `get` / `read` nhóm `read` + `room.ask` (nhịp `ASK_CD`); `claim` / `claimAll` / `del` thêm nhịp nhóm `trade`; `claimAll` tối đa `MAIL.claimAllMax` thư mỗi lần, hộp tối đa `MAIL.boxMax`, `mailList` cắt ở trần đó | Thấp |
| 9 | Spam đầy hộp của người khác (thư rác) | **Không có đường**: chỉ server / GM tạo thư; không thư người chơi gửi nhau. Hộp đầy thì chỉ dọn thư đã nhận / không đính kèm, thư còn quà không bị ghi đè | — |
| 10 | Đường đổi đồ giữa tài khoản qua thư | **Không có**: một chiều hệ thống → người chơi, không có người gửi là người chơi | — |
| 11 | Nội dung thư độc hại (chuỗi dài, mã lạ) | **Chặn đúng**: `mailOk` kiểm nguồn trong `MAIL_KINDS`, độ dài tiêu đề / nội dung, Hồn Tệ ≤ `MAIL.maxHonTe`, ≤ `MAIL.maxAttach` dòng, mỗi dòng chỉ vật phẩm gộp thường trong `ITEMS` (không hồn hoàn / cốt / hạch / trang bị), số lượng ≤ `MAIL.maxQty`; client hiển thị nội dung dạng chữ thường (không HTML) | — |
| 12 | Lệnh GM / hook test lộ ở bản thật | **Chặn đúng**: `/gm mail` đi qua `gmAllow` + `ADMIN_ACCOUNTS` như mọi lệnh GM; hook `mail` chỉ chạy khi `GAME_TEST=1` | — |
| 13 | Nhận trong sân đấu / Bí Cảnh | **Chặn**: `mail` trong `BLOCKED` của `ArenaRoom`, `BiCanhRoom` kế thừa | — |

Không có lỗi Nghiêm trọng / Cao / Vừa còn tồn.

## Danh sách bề mặt đã soát

| Tin / route | Kết quả |
|---|---|
| `mail {op:"get"}` | Đã đọc, ổn: nhóm `read` + `room.ask`, chỉ trả dữ liệu của chính chủ |
| `mail {op:"read" \| "del", id}` | Đã đọc, ổn: ghi qua chuỗi lưu, ràng `account_id`; `del` chỉ thư đã nhận / không đính kèm |
| `mail {op:"claim" \| "claimAll"}` | Đã đọc, ổn (dòng 2–6 và 8 của bảng trên); bot thử: đúp, dồn 200, năm cùng lúc, id lạ, hết hạn, savefail, túi đầy, nhận tất cả, vào lại phòng |
| Tin `mail` server → client | Chỉ chính chủ; không vào `schema.ts` |
| SQL `040_thu.sql` | Chạy lại an toàn, bật RLS không policy; `removeTestAccount` xoá dòng (`ON DELETE CASCADE` cũng dọn) |
| `/gm mail`, hook `mail` | Dòng 12 của bảng trên |

## Bí Cảnh túi đầy → Thư (#1584)
- *Nhân thưởng:* quyển ra MỘT chỗ. Phần vào túi (`qty`) cộng trên bản sao túi, phần dư (`give − qty`) chỉ có trong thư; bộ đếm ngày tăng đúng `give` (= tổng), nên thư không vượt `BICANH.tomeDailyCap`. Bot: túi đầy hoàn toàn → túi 0 quyển, thư đủ số, nhận xong túi đúng số đó.
- *Nhận trùng / chốt lại:* `ticket.settled` chặn chốt hai lần; thêm `dedup = bicanh:<ngày>:<mã phòng>` + `unique (account_id, dedup)` (mã phòng duy nhất mỗi lượt); `mailClaim` giữ `claimed_at IS NULL`. Bot: nhận lại bị từ chối, túi không đổi.
- *Ngắt kết nối lúc chốt:* `finish` chạy trong chuỗi lưu của người chơi; một transaction hoặc không gì cả. Mất kết nối giữa chừng không mất thư (đã ở DB) hay đếm hai lần.
- *Lỗi ghi DB lúc chốt* (hook `savefail`): rollback cả ba phần (bộ đếm, túi, thư), hoàn lượt, không thưởng. Bot: không thư, lượt hoàn.
- *Hộp thư đầy:* `"mailfull"`, không ghi gì, hoàn lượt (không để mất thưởng; người chơi dọn thư rồi chơi lại). Hoàn lượt không cho thưởng nên không nhân thưởng.
- *Thư hết hạn* (`MAIL.ttlDays`): quyển bỏ nếu quên nhận, chủ ý của `thu.md`.

## Còn lại (đã ghi, không chặn)
- `mailSend` đếm hộp rồi chèn (hai câu): hai thư tới cùng lúc có thể vượt `MAIL.boxMax` một thư; không phá gì (danh sách luôn cắt ở trần, thư dư chờ hết hạn). Nếu cần chặt hơn thì khóa dòng tài khoản.
- Thư hết hạn bị xóa cứng lúc chủ mở hộp: `dedup` cũ dùng lại được sau `MAIL.ttlDays` ngày. Nguồn nối sau phải đặt khóa có ngày / mã sự kiện để không tái tạo.
