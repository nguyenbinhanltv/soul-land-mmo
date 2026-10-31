# Pháp tướng Tử Vong Chu Hoàng (#1457)

Đã nhập `pt_tu_vong_chu_hoang` và glow tại PR #1459, chưa merge.

Nguồn: OpenAI / Codex image_gen tích hợp, ngày 31/10/2026. Dùng theo điều khoản đầu ra OpenAI, không gán CC0. Công cụ không trả model ID hay seed.

Tham chiếu hình, màu và motif: `shared/assets/sprites/vohonanim/tu_vong_chu_hoang_{b,f}.png` và `shared/assets/sprites/vukhianim/tu_vong_chu_hoang_f.png`; không chép khoảng rỗng hình người.

## Nhật ký lượt

| Hướng | Lượt | Kết quả |
| --- | ---: | --- |
| s | 1 | RAW nguyên byte `s-v1.png`, 1254×1254 thay vì 1024×1024; đã chọn theo quyết định điều phối, giữ hạn chế đỉnh đòn muộn. |
| s | 2 | RAW nguyên byte `s-v2.png`, vẫn 1254×1254 dù yêu cầu rõ kích thước mã hóa; chân đánh sát mép ô. Chưa chọn. |
| s | 3 | RAW nguyên byte `s-v3.png`, 1269×1240, không vuông và sai lưới (6 hình ở hàng đầu, 8 ở hàng đánh). Loại. Đã hết ba lượt. |

Điều phối đã chấp nhận RAW vuông native 1254×1254, giữ nguyên byte, cắt bằng cutter chuẩn. Sau ba lượt, điều phối chốt chọn lượt 1 cho hướng s: `s.png` giống nguyên byte `s-v1.png`, prompt tương ứng ở `s.prompt.txt`. Hạn chế được chấp nhận như mẫu #1326: **đỉnh đòn muộn hơn ô 12–13**. Không sinh lượt 4. Lượt 2 và 3 không chọn. Đã nhập đủ năm hướng cùng glow; xem mục kiểm trong game bên dưới.

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

## Padding hướng s và nhập

Cutter chuẩn từ chối `s.png` ở khung 9 và 13: 29 và 21 điểm hình thật tại y937–941 sát ranh hàng y940,5. Điều phối đã duyệt bản trung gian chỉ dịch/đệm, không co giãn hoặc vẽ thêm. Kiểm thành phần liên thông cho đúng 16 cụm nhện lớn tách rời: đỉnh giáp hàng cuối đi qua đường chia ô tưởng tượng nhưng **hình nguyên vẹn, không bị cắt mất ở RAW**, không chạm mép canvas, không nối sang con khác.

Lệnh tái tạo: `node art/src/phap-tuong/tu_vong_chu_hoang/padding-s.mjs <thư-mục-trung-gian>`. Script chỉ dịch nguyên cụm và các điểm rìa đi kèm; ô đích 384, lề 32, không co giãn, không vẽ thêm, kiểm không chồng điểm và giữ đủ **540844/540844 điểm hình**. Bốn hướng còn lại chép nguyên byte. RAW `s.png` vẫn 1254×1254 với hash ở trên. Bản trung gian lưu `s-padded.png` 1536×1536, SHA256 `1a72ae5b5fbfafc552722fc842d566d1ced3dd8750b4d90726e5818430826cc2`; chi tiết ở `padding-report.json`.

Ghép bằng cutter chuẩn, không sửa/ngoại lệ checker: `node tools/assets/phaptuong-sheet-cut.mjs <thư-mục-trung-gian> shared/assets/sprites/phaptuong/tu_vong_chu_hoang.png --no-despill`. Đã ghép đủ 80 khung, 48 màu, hệ số 0,8743. Glow dựng từ sheet mới bằng `buildGlow` của `phuthe-to-phaptuong-lib.mjs`, màu #9a4aff. `validate --register` sinh manifest/credits, rồi `credits.mjs` sinh dữ liệu credits. Recipe và hash thành phẩm ở `recipe.json`.

## Kiểm trong game và kiểm kỹ thuật

- `npm run check`: xanh đầy đủ sau nhập; server/client TypeScript, 1830 key validate không lỗi, quality không lỗi.
- `npm run test:phaptuong --prefix client`: đạt.
- Chrome thật headless, `--mute-audio`, trang `/choi/?thu=phaptuong&vh=tu_vong_chu_hoang`, `noAudio:true`, năm hướng s/se/e/ne/n, thở và sáu ảnh liên tiếp mỗi đòn đánh. Không lỗi trang.
- Đã xem ảnh game: không cột tối hình người, thân nhện liền, không lóe trắng trong các pha đánh đã chụp; ne/n còn đọc được ở alpha trước thân 0,7. Giữ hiển thị scale=1, dx=0, dy=0, không đổi shared/data.ts.
- `game-preview.png`: năm cột s/se/e/ne/n, hàng thở rồi đánh. `attack-preview.png`: ảnh cận năm hướng, hàng đầu thở, sáu hàng sau các pha đánh liên tiếp.
- Hạn chế đã được điều phối chấp nhận: s lượt1 đỉnh đòn muộn hơn ô12–13. Không sinh lượt4.

Tổng lượt đã dùng s/se/e/ne/n = 3/3/3/1/1. Không hướng nào quá ba lượt. Ba võ hồn sau chưa bắt đầu; làm tuần tự sau khi nhập Tử Vong Chu Hoàng.
