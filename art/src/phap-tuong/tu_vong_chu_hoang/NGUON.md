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

Điều phối đã chấp nhận RAW vuông native 1254×1254, giữ nguyên byte, cắt bằng cutter chuẩn. Sau ba lượt, điều phối chốt chọn lượt 1 cho hướng s: `s.png` giống nguyên byte `s-v1.png`, prompt tương ứng ở `s.prompt.txt`. Hạn chế được chấp nhận như mẫu #1326: **đỉnh đòn muộn hơn ô 12–13**. Không sinh lượt 4. Lượt 2 và 3 không chọn. Chưa nhập game, các hướng còn lại đang thực hiện.

## Kích thước native và SHA256

| RAW | Kích thước | SHA256 |
| --- | --- | --- |
| `s-v1.png` | 1254×1254 | `603c156ed11507b23b1eb11e3621d9206cd963737d0aa6a740c16b74466a8484` |
| `s-v2.png` | 1254×1254 | `acf2bc4e0fde64f81f4e5082846bb558f721a90f75fbb547fbc6badc8bbe9a0a` |
| `s-v3.png` | 1269×1240 | `9f8dd2fa92c3dc319fbe02ebc2edbf7c2758b0d4777200937a7ad4958a4ab408` |

## Các hướng còn lại

| Hướng | Lượt dùng | Lượt chọn | Kết quả cutter `--no-despill` |
| --- | ---: | ---: | --- |
| se | 3 | 3 | Đạt, 48 màu. Lượt 1/2 chân đánh chạm ranh ô. |
| e | 3 | 3 | Đạt, 48 màu. Lượt 1/2 chân đánh chạm ranh ô. |
| ne | 1 | 1 | Đạt, 48 màu; lưng chếch phải lên, không mặt trước. |
| n | 1 | 1 | Đạt, 48 màu; quay lưng hoàn toàn. |

Các RAW chọn `se.png`, `e.png`, `ne.png`, `n.png` đều native 1254×1254, nguyên byte. Prompt chọn ở `<hướng>.prompt.txt`; prompt từng lượt và RAW loại giữ riêng. SHA256 đầy đủ ở `SHA256.json`.

| RAW chọn | SHA256 |
| --- | --- |
| `se.png` | `f15554f601e0b4c61f3f3aa98845c8a5496fbf5658789cef7dabe5dac1237d47` |
| `e.png` | `8933a0ac388a6928bdb005c7797e08560704bc2aecdb371875dca6be3ce4fdf9` |
| `ne.png` | `408940b9dab88cf0ad5e1b1a4eab7fa9f2f13ddc0a71ca1d2273021e79ed6285` |
| `n.png` | `cf9000daf19fa0067fad1c31619b17ef5341d3d9e0baf2ccab97ececca7d4ba6` |

## Chặn kỹ thuật hướng s

Cutter chuẩn từ chối `s.png` ở khung 9 và 13: 29 và 21 điểm hình thật tại y937–941 sát ranh hàng y940,5. Đã báo điều phối xin quyết định hậu kỳ trung gian căn/padding từng ô, giữ RAW nguyên byte, không sửa cutter, không sinh lượt 4. Chưa nhập toàn bộ sheet, chưa dựng glow, chưa xem thành phẩm trong game.

`npm run check` xanh đầy đủ trước lượt 3 hướng s.

Tổng lượt đã dùng s/se/e/ne/n = 3/3/3/1/1. Không hướng nào quá ba lượt. Ba võ hồn sau chưa bắt đầu; làm tuần tự sau khi nhập Tử Vong Chu Hoàng.
