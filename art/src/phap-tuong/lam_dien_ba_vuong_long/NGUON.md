# Pháp tướng Lam Điện Bá Vương Long — ứng viên (#1435)

Part of #1435. PR nháp #1458. Chưa chốt nhập game / gộp.

## Nguồn và RAW

Codex builtin `image_gen.imagegen`, ngày 31/10/2026; công cụ không trả model ID hoặc seed. Đầu ra AI cho dự án theo điều khoản OpenAI, không gán CC0. Giữ nguyên byte RAW và prompt thật, SHA256 trong `SHA256.json`.

Tham chiếu hình, màu, motif: `shared/assets/sprites/vohonanim/lam_dien_ba_vuong_long_{b,f}.png` và `shared/assets/sprites/vukhianim/lam_dien_ba_vuong_long_{b,f}.png`, main `844ebeb1f41df0ecbb8f04f48fddd44a08a795d3`. Đã xem cả bốn sheet, đính kèm lớp f khi sinh; một số lượt thêm mẫu s hoặc se lượt 2 đã qua cutter. Không dùng ảnh hỏng làm ảnh dẫn. Rồng chữ S thân đặc, sừng nhánh, vảy lôi văn, lam #1f3f8f / #5ab8ff; không chép khoảng rỗng hình người.

**Ngoại lệ chưa được chốt:** prompt đòi 1024×1024 nhưng builtin trả RAW vuông 1254×1254. Không đổi cỡ RAW. Đã hỏi chủ repo / orchestrator có cho phép RAW native vuông này hay không.

## Lượt sinh

| Hướng | Đã dùng | Tờ ứng viên | Các lượt còn lại | Nhận xét |
|---|---|---|---|---|
| s | 1 | `s.png` | — | Qua cutter. |
| se | 2 | `se.png` (lượt 2) | `se-luot1.png` | Lượt 1 chạm mép, lượt 2 chỉ sửa khoảng cách, qua cutter. |
| e | 3 | `e.png` (lượt 2) | `e-luot1.png`, `e-luot2.png`, `e-luot3.png` | Lượt 1 chạm ô; lượt 2 qua cutter nhưng còn gần góc se; lượt 3 chỉ sửa góc, đúng mặt bên nhưng khung 10/11 chạm ô. `e-luot2.png` giữ thêm bản cùng byte để lưu lịch sử. **Hết ba lượt, chưa chấp nhận góc e.** |
| ne | 3 | `ne.png` (lượt 3) | `ne-luot1.png`, `ne-luot2.png` | Lượt 1 lộ mặt trước; lượt 2 sửa góc nhưng chạm ô; lượt 3 sửa khoảng cách, qua cutter. Góc còn thiên về mặt bên sau; đỉnh có ở ô 11–12, ô 13 đã thu về, chưa đúng nhịp giữ theo yêu cầu. Không sinh thêm. |
| n | 1 | `n.png` | — | Mặt lưng không mắt / bụng trắng, qua cutter. |

Mỗi lần một job, không hướng nào vượt ba lượt. Tên `<dir>.png` là ứng viên đọc bởi cutter, không đồng nghĩa đã được chấp nhận mỹ thuật.

## Bản thử và kiểm tra

Ghép thử bằng `node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/lam_dien_ba_vuong_long <sheet-thử.png>`: 80 khung 160, 48 màu, hệ số 0,8582. RAW nguyên byte, nền được cutter khóa mặc định. Lớp glow thử dùng hàm `buildGlow` của `phuthe-to-phaptuong-lib.mjs` với màu #5ab8ff và chính sheet Codex, không lấy lại thân chuyển thể cũ.

Đã thay sheet tạm và xem TRONG GAME `/choi/?thu=phaptuong&vh=lam_dien_ba_vuong_long&auto=1&danh=1`, đủ s/se/e/ne/n, cảnh thử dùng `audio.noAudio: true`. Có ảnh trong gallery phiên AO885. Thân liền, không cột lấp tối; ne/n còn đọc được ở lớp mờ. Góc e quá gần se và nhịp ne chưa đạt như bảng. Client có `flashHit` tô trắng thân ở nhịp trúng đòn khi không bật Giảm chuyển động; không phải lỗi trắng trong sheet, chưa sửa code trong PR art. Không tuyên bố đã đạt yêu cầu không lóe trắng của luồng mặc định.

`npm.cmd run check` xanh đầy đủ server/client sau cài dependencies. Bản thử trong game không được đăng ký thành phẩm hay ghi credits; khôi phục sheet gốc sau chụp. Chờ quyết định về RAW native, góc e / nhịp ne và hiệu ứng trắng trước khi hoàn tất nhập, chạy kiểm trên thành phẩm và xin AO review.
