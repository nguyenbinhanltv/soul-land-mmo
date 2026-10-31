# Pháp tướng Tử Vong Chu Hoàng (#1457)

Đang thực hiện tại PR #1459. Chưa nhập game, chưa kiểm trong game.

Nguồn: OpenAI / Codex image_gen tích hợp, ngày 31/10/2026. Dùng theo điều khoản đầu ra OpenAI, không gán CC0. Công cụ không trả model ID hay seed.

Tham chiếu hình, màu và motif: `shared/assets/sprites/vohonanim/tu_vong_chu_hoang_{b,f}.png` và `shared/assets/sprites/vukhianim/tu_vong_chu_hoang_f.png`; không chép khoảng rỗng hình người.

## Nhật ký lượt

| Hướng | Lượt | Kết quả |
| --- | ---: | --- |
| s | 1 | RAW nguyên byte `s-v1.png`, 1254×1254 thay vì 1024×1024; chưa chọn. Đỉnh đòn muộn hơn yêu cầu. |
| s | 2 | RAW nguyên byte `s-v2.png`, vẫn 1254×1254 dù yêu cầu rõ kích thước mã hóa; chân đánh sát mép ô. Chưa chọn. |

| s | 3 | RAW nguyên byte `s-v3.png`, 1269×1240, không vuông và sai lưới (6 hình ở hàng đầu, 8 ở hàng đánh). Loại. Đã hết ba lượt. |

Điều phối đã chấp nhận RAW vuông native 1254×1254, giữ nguyên byte, cắt bằng cutter chuẩn. Quyết định này không miễn kiểm bố cục và động tác. Lượt 3 không đạt. Lượt 1 đúng lưới nhưng đỉnh đòn muộn, lượt 2 có chân sát mép. Dừng tờ hướng s theo giới hạn ba lượt, báo điều phối quyết định bước tiếp theo. Chưa chọn RAW, chưa nhập game.

## Kích thước native và SHA256

| RAW | Kích thước | SHA256 |
| --- | --- | --- |
| `s-v1.png` | 1254×1254 | `603c156ed11507b23b1eb11e3621d9206cd963737d0aa6a740c16b74466a8484` |
| `s-v2.png` | 1254×1254 | `acf2bc4e0fde64f81f4e5082846bb558f721a90f75fbb547fbc6badc8bbe9a0a` |
| `s-v3.png` | 1269×1240 | `9f8dd2fa92c3dc319fbe02ebc2edbf7c2758b0d4777200937a7ad4958a4ab408` |

`npm run check` xanh đầy đủ trước lượt 3. Bốn prompt hướng còn lại chỉ là chuẩn bị, chưa gọi sinh ảnh.

Các hướng khác chưa sinh. Mỗi tờ tối đa ba lượt, thực hiện tuần tự.
