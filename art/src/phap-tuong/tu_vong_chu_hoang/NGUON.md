# Pháp tướng Tử Vong Chu Hoàng (#1457)

Đang thực hiện tại PR #1459. Chưa nhập game, chưa kiểm trong game.

Nguồn: OpenAI / Codex image_gen tích hợp, ngày 31/10/2026. Dùng theo điều khoản đầu ra OpenAI, không gán CC0. Công cụ không trả model ID hay seed.

Tham chiếu hình, màu và motif: `shared/assets/sprites/vohonanim/tu_vong_chu_hoang_{b,f}.png` và `shared/assets/sprites/vukhianim/tu_vong_chu_hoang_f.png`; không chép khoảng rỗng hình người.

## Nhật ký lượt

| Hướng | Lượt | Kết quả |
| --- | ---: | --- |
| s | 1 | RAW nguyên byte `s-v1.png`, 1254×1254 thay vì 1024×1024; chưa chọn. Đỉnh đòn muộn hơn yêu cầu. |
| s | 2 | RAW nguyên byte `s-v2.png`, vẫn 1254×1254 dù yêu cầu rõ kích thước mã hóa; chân đánh sát mép ô. Chưa chọn. |

Đang chờ quyết định về kích thước RAW: công cụ tích hợp không có tham số size và hai lần đều trả 1254×1254. Không tự đổi kích thước RAW. Còn một lượt cho hướng s.

Các hướng khác chưa sinh. Mỗi tờ tối đa ba lượt, thực hiện tuần tự.
