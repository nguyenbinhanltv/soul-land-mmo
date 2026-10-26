# Đi qua cổng, mỗi tài khoản một phiên

**Đi qua cổng và lưu vị trí** (thứ tự bắt buộc khi duyệt `travel {portal}`, tránh đua ghi giữa phòng cũ và phòng mới)
1. Server kiểm tra như mục 5.3. Không hợp lệ thì báo lỗi, dừng.
2. Đánh dấu client **đang chuyển bản đồ** (`travelling`, `freeze`): phòng cũ bỏ qua input, đánh, hồn kỹ, hấp thụ, đổi võ hồn và `travel` tiếp theo; hồn thú bỏ mục tiêu; đạn đang bay bị xóa; `damageBeast` bỏ qua người này. Lưu định kỳ cũng bỏ qua người này.
3. **`await` lần lưu đang chạy** (chuỗi `saving`), rồi lưu đầy đủ trong **MỘT transaction** (`saveTravel`): võ hồn, túi đồ và mọi dữ liệu chưa lưu, cùng `map_id` = bản đồ đích và tọa độ `arrive`. **Hoặc ghi hết, hoặc không ghi gì** (`PgStore`: một kết nối, `BEGIN` → `UPDATE` → `COMMIT`, lỗi thì `ROLLBACK`; `MemoryStore`: kiểm tra xong mới gán mọi trường trong một hàm đồng bộ).
4. Commit xong mới gửi riêng `travel {mapId, roomId}`. **Lưu lỗi** thì không gửi `travel`, bỏ cờ, báo "Không chuyển được bản đồ, thử lại"; người chơi ở lại và phòng cũ lưu bình thường.
5. Client rời phòng và vào phòng mới; không rời trong `TRAVEL_LEAVE_SECS` giây thì server ngắt kết nối.
- `onLeave` của client đang chuyển bản đồ **nối vào chuỗi `saving`** và đọc kết quả transaction (`travelled`), không đọc cờ: đã commit thì không ghi gì; lưu lỗi thì lưu như `onLeave` thường (có lớp chặn `WHERE map_id`).
- Phòng mới chỉ nạp nhân vật sau commit (`onAuth` chỉ nhận khi `map_id` trong DB đã là bản đồ đích; sai thì từ chối, client hỏi lại `/api/me`), nên không có bản cũ ghi đè bản mới.
- Truyền tống trận và Hồi Thành Phù sang bản đồ khác dùng đúng các bước này (cổng ẩn tới tâm trận đích); phí / phù đã trừ được trả lại khi transaction lỗi.
- Bản đồ có `MapDef.exit` (Lõi Tinh Đấu): lần ghi cuối khi rời phòng (`write(id, true)`) dùng `saveTravel` về `arrive` của cổng tới `exit`.

**Đăng xuất** (`POST /api/logout`, #999): `store.endSession(token)` xóa đúng phiên của token đó ở server (phiên thiết bị khác giữ nguyên), trả 200 dù token sai / hết hạn (trừ khi vượt giới hạn tần suất `apiGate`); client gọi rồi xóa token cục bộ.

**Mỗi tài khoản một phiên** trên mọi phòng
- `onJoin` phát `kick {accountId, sessionId}` qua presence; mọi phòng đá client trùng tài khoản khác phiên đó (mã 4001).
- **Phiên mới chỉ nạp DB sau lần ghi cuối của phiên cũ:** lease `accountHold:<accountId>` có fencing token `<roomId>:<sessionId>`, TTL 15 giây và heartbeat 5 giây; `onLeave` / `onDispose` chỉ xóa sau khi lần ghi cuối trong chuỗi `saving` xong. `onAuth`, trước mọi lần đọc DB, thấy tài khoản đang có lease thì phát `kick` rồi chờ phiên đó nhả (`waitOldSession`, có hạn; quá thì từ chối, không nạp bản cũ). Tiến trình chết không cần cleanup riêng: TTL tự nhả lease.
- **Client rời phòng thì dừng tiến độ ngay** (`onLeave` gọi `freeze` và hủy hấp thụ dở trước khi nối lần ghi cuối), để hấp thụ xong hay đạn hạ hồn thú không cộng vào sau khi đã chụp dữ liệu.

