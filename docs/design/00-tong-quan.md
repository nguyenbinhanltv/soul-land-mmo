# Tổng quan: ý tưởng, nguyên tắc, mô hình chơi

Ý tưởng, nguyên tắc thiết kế và mô hình chơi. Số liệu ở `shared/data.ts`; luật cụ thể ở các file `docs/design/*` (mục lục ở `GAME_DESIGN.md`).

## 1. Ý tưởng và phạm vi
MMO thế giới mở pixel 2D trên trình duyệt, lấy bối cảnh **Đấu La Đại Lục**, cơ chế tham khảo game *Đấu La Đại Lục: Thế Giới Săn Hồn*.
Người chơi **sưu tầm võ hồn**, lập đội võ hồn, vào rừng săn hồn thú để farm hồn hoàn, hồn cốt và hồn hạch, rồi nuôi đội mạnh dần.

- Dự án phi thương mại, chỉ chơi cùng bạn bè. **Được dùng đúng tên nhân vật, võ hồn, hồn thú và địa danh trong truyện.**
- Không có nạp tiền hay thể lực: mọi thứ kiếm được bằng cách chơi.

## 2. Nguyên tắc thiết kế
- **Vòng chơi chính:** farm hồn thú → nhặt hồn hoàn, hồn cốt, hồn hạch → võ hồn lên cấp và chạm bình cảnh → hấp thụ hồn hoàn hợp giới hạn → mạnh hơn → vào vùng sâu hơn.
- **Hồn hoàn là nguyên liệu quý:** hấp thụ vượt giới hạn thì có thể mất trắng. Người chơi phải cân nhắc dùng ngay hay farm tiếp hồn hoàn tốt hơn.
- **Đội hình quan trọng hơn một võ hồn mạnh:** phối 4 hệ (cường công, mẫn công, khống chế, phụ trợ), theo một lưu phái (thiêu đốt, cảm điện, chấn động…) và đổi võ hồn đúng lúc.
- **Thế giới mở, nhiều người cùng thấy nhau** trên từng bản đồ; các bản đồ nối với nhau bằng cổng (mục 5.3).
- **Thua không mất đồ:** không bao giờ mất võ hồn, hồn hoàn đã hấp thụ, hồn cốt hay hồn hạch đang gắn. (Trang bị hồn sư: ngoại lệ ở nấc cường hóa +13–15, chỉ khi chính người chơi chọn cố mà không dùng bùa, mục 5.15.)
- **Không giao dịch giữa người chơi, không PvP ngoài rừng:** một người farm hộ cả nhóm sẽ làm hỏng vòng chơi chính; chơi cùng nhau qua tổ đội và Đại Đấu Hồn Trường (mục 5.9).
- **Ưu tiên máy tính**, nhưng mọi giao diện mới phải dùng được bằng cả chuột lẫn chạm.

## 3. Mô hình chơi
- **Người chơi là một hồn sư có nhân vật riêng.** Khi tạo tài khoản chọn giới tính, kiểu tóc, màu tóc, màu áo, tông da (mục 5.11). Hồn sư chỉ là hình ảnh đại diện: cấp, chỉ số và hồn hoàn đều thuộc về từng võ hồn.
- **Võ hồn là đơn vị nuôi riêng, sưu tầm được.** Trên bản đồ, người khác thấy hồn sư cùng **võ hồn đang ra trận ở dạng phóng thích** (vũ khí, thú hồn phụ thể, hư ảnh, hào quang) và **các vòng hồn hoàn của võ hồn đó** dưới chân. Đổi võ hồn thì đổi lớp phụ thể và bộ vòng; thân hồn sư giữ nguyên.
- **Không vẽ nhân vật truyện:** chân dung và thẻ võ hồn vẽ chính võ hồn (mục 5.11); chủ nhân trong truyện chỉ là dữ liệu `owner` của `VOHON`, không dùng làm nhân vật trên bản đồ.
- **Đội hình 4 võ hồn** (`TEAM_SIZE`). Trên bản đồ chỉ hiện võ hồn đang ra trận; đổi sang võ hồn khác trong đội ngay khi đang đánh.
- **Mỗi võ hồn có 10 hồn hoàn** (`MAX_RINGS`), cấp 1–100 (`MAX_LEVEL`): bình cảnh ở cấp 10, 20, …, 100.
- **Niên hạn tối đa 10 vạn năm** (`MAX_YEARS`).
- Thế giới mở thời gian thực gồm nhiều bản đồ (thành, bản đồ săn, bản đồ boss). Người chơi cùng bản đồ và cùng kênh thì thấy nhau, chat, cùng săn, tranh đồ rơi.

