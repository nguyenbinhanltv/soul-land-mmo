# Tông môn

Tông môn: bốn phe theo truyện, tông vụ hằng ngày, điểm tuần, thưởng tuần. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`). Số issue ở cuối file.


## 5.14 Tông môn

### Nguyên tắc
Bốn **phe có sẵn theo truyện** (`TONG_MON`: mã, tên, màu, sứ giả), không phải bang tự lập. Mỗi người thuộc tối đa một tông. **Không buff chỉ số theo tông**: lợi ích là nhận diện, **chat tông** `/tm` (mục 4 "Kênh chat"), tông vụ hằng ngày, điểm tông tuần và thưởng tuần; cạnh tranh giữa các tông chỉ bằng điểm, không giao dịch, không PvP ngoài Đại Đấu Hồn Trường. Sử Lai Khắc là học viện chung của mọi người (mục 5.8), không phải tông. Không có kho chung, chiến tông, chức vụ, giao dịch giữa thành viên.

### Sứ giả, gia nhập, rời tông
- **Sứ giả:** bốn NPC vai trò `tong` ở hàng phía bắc quảng trường Thiên Đấu Thành (mục 5.8; mỗi tông một NPC, mã ở `TONG_MON[].npc`). Mở hộp thoại thì server gửi tin riêng `tong {tong, wait, day, tasks}` (tông đang thuộc, giây còn phải chờ, tông vụ hôm nay); hộp thoại có nút gia nhập / đổi sang tông của sứ giả đó, nút rời tông, ở sứ giả tông mình thêm nút tông vụ, và nút bảng tông tuần / thưởng tuần.
- **Gia nhập / đổi** (tin `tong {op: "join", tong}`): đứng trong `NPC_RANGE` của sứ giả tông đó, đã xong chuỗi tân thủ, võ hồn cấp cao nhất trong số đang sở hữu từ `TONG_MIN_LEVEL`, và từ lần gia nhập gần nhất đã qua `TONG_SWITCH_DAYS` ngày (lần đầu không phải chờ). Đổi tông **bỏ điểm tuần hiện tại** (bảng `tong_points`, tuần theo `tongWeek`: thứ Hai giờ Việt Nam; điểm do tông vụ ghi). Không giới hạn số người mỗi tông. Gia nhập / rời ghi DB trước, chỉ khi ghi xong mới đổi tông trong bộ nhớ và báo (ghi lỗi: báo "Không lưu được", giữ tông cũ; lệnh tông thứ hai trong lúc chờ bị từ chối), #796.
- **Rời tông** (`op: "leave"`): đứng gần một sứ giả bất kỳ, **bỏ điểm tuần hiện tại** (như đổi tông: người rời không còn tính hoạt động hay nhận thưởng tuần cho tông cũ), không mất gì khác. Thời điểm gia nhập vẫn giữ, nên rời rồi vào tông khác ngay vẫn phải chờ đủ `TONG_SWITCH_DAYS` ngày.
### Tông vụ, điểm tuần, thưởng
- **Tông vụ hằng ngày** (`TONG_DAILY`, mẫu `TONG_POOL`): `TONG_DAILY.count` bài mỗi ngày (đổi lúc 00:00 giờ Việt Nam như khảo hạch), chỉ nhận / trả ở sứ giả **tông mình** (`tong {op: "accept" | "turnin", chain}`), dùng lại bộ máy khảo hạch hằng ngày (mục 5.8): mã chuỗi `tong:<yyyymmdd>:<i>` trong bảng `quests`, nội dung suy từ mã, bốc ổn định theo ngày (mọi tông cùng bộ bài). Mẫu bài: săn hồn thú hợp cấp, tham gia hạ tinh anh, đánh một trận Đại Đấu Hồn Trường, nộp hồn hoàn. Trả bài nhận Hồn Tệ nhỏ của mẫu và `TONG_POINTS` điểm tông; điểm chỉ được cộng (vào tuần hiện tại của tông đang thuộc) sau khi lần ghi túi có bài đã trả thành công, cùng chuỗi lưu.
- **Điểm tuần và bảng xếp hạng** (`tong {op: "board"}`, tin riêng `tongBoard`, nhịp `TONG_BOARD_CD`): tuần theo `tongWeek` (đổi lúc 00:00 thứ Hai giờ Việt Nam). Thành viên **hoạt động** của tuần là người có ít nhất `TONG_WEEK_MIN` điểm. Tông xếp theo **điểm trung bình của thành viên hoạt động** (tông ít người không thiệt; tông không ai hoạt động không xếp), kèm top `TONG_TOP_N` cá nhân mỗi tông; bảng gửi cả tuần trước (tông hạng nhất `tongTop`, phần thưởng của mình, đã nhận chưa).
- **Thưởng tuần** (`tong {op: "claim"}`): trong tuần kế tiếp, ở một sứ giả bất kỳ, thành viên hoạt động của tuần trước nhận **đúng một lần** `TONG_WEEK_REWARD.top` nếu tông khi đó hạng nhất tuần trước (bằng điểm trung bình thì cùng hạng nhất), không thì `TONG_WEEK_REWARD.rest` (Hồn Tệ và mảnh một võ hồn trong `ARENA_SHARDS`). Người không hoạt động không nhận. Lượt ghi ở bảng `boss_claims` (loại `TONG_WEEK_KIND`, ngày = thứ Hai của tuần được thưởng, `tongWeekDay`) cùng transaction với túi (như đổi mảnh ở Thương hội); túi không đủ chỗ cho mảnh thì từ chối, không mất lượt.
### Lưu và nhận diện
- **Lưu:** cột `accounts.tong` (mã tông, NULL = không) và `accounts.tong_at` (ms gia nhập gần nhất); ghi qua chuỗi lưu của người chơi (`setTong`, cùng transaction với xoá điểm tuần). Điểm tuần ở bảng `tong_points (account_id, week, tong, points)` (cột `claimed` không dùng: lượt thưởng tuần ở `boss_claims`); tiến độ tông vụ ở bảng `quests` cùng túi. Trả tông vụ thì điểm đi theo lần ghi túi (`Bag.tongPts`, cùng transaction): chưa ghi được thì giữ ở hàng chờ của phòng và ghi kèm lần lưu kế tiếp, nên bài đã xong luôn có điểm.
- **Nhận diện:** trường công khai `PlayerState.tong` (chỉ số trong `TONG_MON` + 1, 0 = không); client vẽ tên tông màu riêng dưới tên hồn sư cho mọi người ở gần (tên và danh hiệu dịch lên một dòng).

## Lịch sử / issue liên quan
- Chat tông `/tm` #198.
- Nhật ký từng bước: `docs/lich-su.md`.
