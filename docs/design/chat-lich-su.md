# Đọc lịch sử chat

Quy tắc hiển thị phía client, bổ sung phần chat trong `giao-dien.md` (#1509).

- Đang ở gần cuối thì tin mới tự cuộn xuống cuối.
- Đang đọc phía trên thì giữ dòng đang đọc và vị trí trong khung khi có hội thoại, tin hệ thống hoặc loot gộp. Dòng hết giới hạn lịch sử thì dùng dòng còn lại kế tiếp.
- Nút **Tin mới** xuất hiện khi có cập nhật thuộc tab đang đọc; bấm để về cuối và xóa dấu chưa đọc của tab đó. Tự cuộn về cuối cũng xóa dấu này.
- Mỗi tab nhớ vị trí riêng trong phiên; đổi tab và đóng/mở chat giữ vị trí đọc. Chat thu nhỏ vẫn hiện các dòng mới nhất như trước.
- Loot không thuộc tab đang xem không dựng lại log hội thoại. Không thay giao thức hay dữ liệu server.
