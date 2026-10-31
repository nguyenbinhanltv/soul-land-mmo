# Pháp tướng Liệt Hỏa Thương Lang — ứng viên (#1435)

Part of #1435, PR nháp #1469. Chưa nhập thành phẩm / chưa đóng issue.

## Nguồn

Codex builtin `image_gen.imagegen`, ngày 31/10/2026, không trả model ID / seed. Ảnh AI cho dự án theo điều khoản OpenAI, không gán CC0. RAW nguyên byte, prompt thật cạnh ảnh, hash ở `SHA256.json`.

Đã xem cả `shared/assets/sprites/vohonanim/liet_hoa_thuong_lang_{b,f}.png` và `shared/assets/sprites/vukhianim/liet_hoa_thuong_lang_{b,f}.png` trên main `8981b76784ec09ab4e30c260067c6d638afdb429`. Khi sinh đính kèm lớp f, thêm mẫu s lượt 2 cho se. Chỉ lấy hình, màu, motif; không chép khoảng rỗng / mảnh lam của phụ thể. Sói thân xám nâu than #4a3a3a, nhấn cam #ff7a3a, mắt vàng, bờm gai, vết nứt lửa, đuôi chóp lửa liền thân; không nộm hay người.

## Lượt sinh

| Hướng | Đã dùng | Tờ chọn | Lượt lưu khác | Kết quả |
|---|---|---|---|---|
| s | 3 | `s.png` (lượt 3) | `s-luot1.png`, `s-luot2.png` | Lượt 1 không vuông, loại. Lượt 2 sửa hình học, qua cutter nhưng đỉnh ở ô 11–12. Lượt 3 chỉ sửa nhịp, đỉnh ở ô 12–13, qua cutter. |
| se | 2 | `se.png` (lượt 2) | `se-luot1.png` | Lượt 1 đỉnh sớm ô 11–12. Lượt 2 chỉ sửa nhịp, đỉnh ô 12–13, qua cutter. |
| e | 2 | `e.png` (lượt 2) | `e-luot1.png` | Lượt 1 chạm ô ở khung 10. Lượt 2 chỉ sửa khoảng cách, giữ mặt bên và đỉnh ô 12–13, qua cutter. |
| ne | 1 | `ne.png` | — | Lưng chếch phải, đòn lao ra xa, đỉnh ô 12–13, qua cutter. |
| n | 1 | `n.png` | — | Mặt lưng không mắt, đòn ra xa, đỉnh ô 12–13, qua cutter. |

Một job mỗi lần, không vượt ba lượt mỗi tờ. Tờ chọn đều vuông 1254×1254 dù prompt yêu cầu 1024×1024. **Kích thước RAW native chưa được chốt ngoại lệ**, không đổi cỡ RAW hay ghi nhận là ảnh gốc 1024. Tờ s lượt 1 giữ nguyên kích thước lệch vuông do công cụ trả về.

## Ghép thử và xem trong game

Lệnh thử: `node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/liet_hoa_thuong_lang <sheet-thử.png>`. Kết quả 80 khung 160, 48 màu, hệ số chung 0,5686, khóa nền mặc định. Tất cả tờ chọn qua kiểm mép ô. Không dùng bộ lọc hồng riêng Lam Ngân Thảo.

Đã thay sheet tạm và xem đủ năm hướng TRONG GAME `/choi/?thu=phaptuong&vh=liet_hoa_thuong_lang&auto=1&danh=1`, thở / đánh lặp, `audio.noAudio: true`. Có ảnh năm hướng trong gallery `phaptuong-1435.html` của phiên AO885. Thân liền, không còn mảnh lam hay cột tối. **Cỡ / vị trí hiện tại chưa đạt:** s/se bị hồn sư che nhiều, ne/n còn quá nhỏ ở lớp mờ; cần chỉnh hiển thị và chụp lại trước khi coi đạt. Chưa đổi `shared/data.ts` trong PR RAW art. Client còn `flashHit` tô trắng thân ở cấu hình mặc định, không phải lỗi RAW; chưa sửa client trong PR này.

`npm.cmd run check` xanh đầy đủ server/client sau cài dependencies, cả với sheet thử. Đã khôi phục sheet gốc sau chụp; chưa đăng ký thành phẩm, chưa sinh credits. Cần chốt RAW native, cỡ hiển thị và xử lý lóe trắng của client trước khi nhập thân + glow và xin AO review. PR vẫn dùng Part of vì cả ba võ hồn chưa nhập xong.
