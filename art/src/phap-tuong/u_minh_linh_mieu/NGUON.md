# Pháp tướng U Minh Linh Miêu — đang thực hiện (#1435)

Part of #1435. PR nháp #1436; chưa nhập game, chưa đủ điều kiện review / gộp.

## Nguồn

Codex builtin `image_gen.imagegen`, ngày 31/10/2026. Công cụ không trả model ID / seed. Ảnh sinh cho dự án theo điều khoản đầu ra OpenAI, không gán CC0. RAW giữ nguyên byte; SHA256 ở `SHA256.json`, prompt đầy đủ cạnh mỗi tờ.

Tham chiếu hình, màu, motif: `shared/assets/sprites/vohonanim/u_minh_linh_mieu_{b,f}.png` và `shared/assets/sprites/vukhianim/u_minh_linh_mieu_{b,f}.png` trên main `3ae2cbb8427ec7535fedc8f1fb3262ab6e0c7bb3`. Đã xem cả bốn sheet, khi sinh đính kèm lớp f; các tờ từ đông nam trở đi thêm mẫu nam lượt 2. Không chép chỗ rỗng hình người. Báo tím đen đặc, vai nhô, vuốt dài, viền tím, không nộm.

## Nhật ký lượt

| Hướng | Số lượt đã dùng | File | Kết quả |
|---|---|---|---|
| s | 2 | `s-luot1.png`, `s.png` | Lượt 1 trả ảnh ngang 1448×1086, loại. Lượt 2 vuông 1254×1254, qua kiểm mép ô. |
| se | 2 | `se-luot1.png`, `se.png` | Lượt 1 chạm mép ô. Lượt 2 chỉ sửa khoảng cách, qua kiểm mép ô. |
| e | 2 | `e-luot1.png`, `e.png` | Lượt 1 chạm mép ô. Lượt 2 chỉ sửa khoảng cách, qua kiểm mép ô. |
| ne | 1 | `ne.png` | Đúng lưng chếch phải; còn chạm mép ô, chưa chọn. |
| n | 1 | `n.png` | Đúng mặt lưng; còn chạm mép ô, chưa chọn. |

Mỗi lần một job, chưa hướng nào vượt ba lượt. Các RAW vuông đều 1254×1254 mặc dù prompt yêu cầu 1024×1024. **Đang chờ quyết định có cho phép kích thước RAW này hay bắt buộc đúng 1024×1024.** Không tự đổi cỡ RAW hoặc coi đó là ảnh gốc 1024. Chưa sinh Lam Điện Bá Vương Long / Liệt Hỏa Thương Lang vì làm tuần tự từng võ hồn.

## Còn phải làm

Chốt kích thước RAW; sửa khoảng cách ne/n trong giới hạn lượt; ghép năm tờ bằng cutter, dựng glow từ sheet Codex, nhập bằng công cụ và sinh credits; kiểm đủ năm hướng thở / đánh TRONG GAME, không lóe trắng / cột tối, ne/n rõ ở lớp mờ; chạy check, CI và AO review. Chưa tuyên bố mỹ thuật thành phẩm đạt.
