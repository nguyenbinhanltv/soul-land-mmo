# Danh Hiệu P4b — Clip và hạt (#1777)

Ảnh pixel do Codex tự vẽ bằng code theo hướng lửa của concept #1770 đã duyệt #1771; không gọi model ở lô này, không dùng ảnh ngoài. Ảnh tự tạo của dự án, không gán CC0. Chưa nhập game.

| Tên | Kích thước sheet | Ô | Lưới | Neo trong ô |
|---|---|---|---|---|
| `danh_hieu_clip_5` | 64×24 | 16×24 | 4×1 | (8,23) |
| `danh_hieu_clip_6` | 64×24 | 16×24 | 4×1 | (8,23) |
| `danh_hieu_hat_lua` | 32×8 | 8×8 | 4×1 | (4,4) |
| `danh_hieu_hat_tia` | 32×8 | 8×8 | 4×1 | (4,4) |

Clip đọc trái → phải, lặp 0→1→2→3; gợi ý 8 fps. Bốn pha đổi biên ngọn, lòng lửa và tàn lửa, không dịch cả khung. Mỗi pha có SHA riêng khác nhau. Bậc 5 cam vàng, bậc 6 đỏ vàng ngà; mật độ/hào quang do renderer xử lý sau, không nung nền vào PNG. Đặt clip ngoài vùng chữ, neo đáy thống nhất. Khi giảm chuyển động dùng pha 0, không lặp.

Sheet hạt chứa bốn biến thể để chọn, không bắt buộc chạy như clip. Tia sáng có bốn hình khác nhau; hạt lửa có hai dáng, lặp xen kẽ ở bốn ô để giữ giao ước sheet. Có thể đổi kích thước/độ đục bằng renderer lúc nhập; không nội suy asset gốc.

Tất cả PNG có alpha thật chỉ 0/255, không glow mềm hoặc màu khóa. `nguon.json` ghi palette, thứ tự, kích thước, neo và SHA256. Trang `danh_hieu_doi_chieu.html` trong artifacts phiên AO `soul_land_game-1042` đối chiếu 1×/3× trên nền sáng/tối, có dừng chuyển động. Tự kiểm: PNG, alpha, lưới, từng ô có hình, bốn pha clip khác nhau và neo đáy chung.
