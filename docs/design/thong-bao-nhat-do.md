# Thông báo nhặt đồ

Luật hiển thị riêng của client (#1462), thay phần thông báo nhận đồ trong `giao-dien.md`; không gửi cho người chơi khác và không lưu server.

- Mọi đồ nhận chỉ ghi vào chat, kênh **Hệ thống**, màu lấy từ dữ liệu độ hiếm của món. Bao gồm mảnh, Hồn Tệ, vật phẩm thường, mọi niên hạn hồn hoàn, hồn cốt và hồn hạch.
- Cùng loại món (mã, niên hạn, sao) nhận trong cửa sổ hai giây gộp số lượng thành một dòng: “Nhận Mảnh Phá Hồn Thương ×5”.
- Hồn Tệ gộp tổng số đồng rồi hiển thị qua `formatHonTe`, không dùng dấu ×; log hạ quái giữ thông tin hạ / đóng góp / đồ rơi nhưng bỏ khoản tiền đã có dòng nhận riêng.
- Không tạo toast hay chữ bay nhận đồ, kể cả đồ hiếm; không có ngưỡng niên hạn dành cho toast nhặt đồ.
- Biên nhận nhận đồ / thưởng hạ quái thành công vẫn là dòng thường dù màu trùng cảnh báo; bộ lọc Hệ thống ẩn được các dòng này. Lỗi / từ chối giữ mức quan trọng riêng.
- Bộ lọc **Hệ thống** mặc định bật; bật thì thấy dòng hệ thống thường trong Tất cả và xem lại ở tab Hệ thống. Tắt chỉ ẩn dòng thường, không ẩn lỗi / cảnh báo.
- Chat thu nhỏ vẫn chừa chỗ cho hai dòng cuối, kể cả màn cảm ứng; lịch sử vẫn đọc được khi mở chat.
- Lỗi / từ chối giữ phản hồi nổi hiện có. Lên cấp, nhiệm vụ và boss giữ banner / toast riêng. Dùng chung thành phần toast hiện tại.
