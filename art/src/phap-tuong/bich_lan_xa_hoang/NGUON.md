# Pháp tướng Bích Lân Xà Hoàng (#1457)

Đã nhập sheet và glow tại PR #1471; chưa merge. Part of #1457.

Nguồn: OpenAI / Codex image_gen tích hợp, 31/10/2026; công cụ không trả model ID/seed. Dùng theo điều khoản đầu ra OpenAI, không gán CC0. RAW giữ nguyên byte, không resize. Điều phối đã chấp nhận RAW vuông native 1254×1254 thay 1024×1024.

Tham chiếu hình/màu/motif: `shared/assets/sprites/vohonanim/bich_lan_xa_hoang_{b,f}.png` và vũ khí `vukhianim/bich_lan_xa_hoang_{b,f}.png`. Chỉ lấy hình rắn lục biếc, mào ngọc/vàng, vảy khắc độc, không chép chỗ rỗng hình người.

STYLE/NEGATIVE theo `docs/art/vo-hon-phong-cach.md`, quy cách theo `docs/art/phap-tuong-codex-ve-lai.md`. Một job mỗi lần, tối đa ba lượt mỗi tờ.

## Nhật ký lượt

| Hướng | Lượt | Kết quả |
| --- | ---: | --- |
| s | 1 | Loại: ảnh không vuông, hàng đánh có 5 hình. RAW `s-v1.png` và prompt giữ nguyên. |
| s | 2 | Chọn `s.png`: vuông 1254×1254, đúng 4×4, thân rắn liền, cutter đạt 48 màu. |
| se | 1 | Loại vì góc vẫn quá gần chính diện. RAW `se-v1.png` giữ nguyên. |
| se | 2 | Chọn `se.png`: vuông 1254×1254, quay chếch phải, cutter đạt 48 màu. |
| e | 1 | Loại: PNG 1292×1218 không vuông; đủ lưới và đúng góc nhưng chưa đạt quy cách canvas. |
| e | 2 | Chọn `e.png`: vuông 1254×1254, nhìn ngang phải, cutter đạt 48 màu. |
| ne | 1 | Chọn `ne.png`: 1254×1254, mặt lưng cổ và vòng thân lớn, cutter đạt 48 màu. |
| n | 1 | Chọn `n.png`: 1254×1254, quay lưng, không mắt nhìn người xem, cutter đạt 48 màu. |

Lượt dùng/chọn s/se/e/ne/n = 2/2/2/1/1. Năm RAW chọn đều nguyên byte, native 1254×1254. Không sinh quá ba lượt.

## Nhập và tái tạo

`node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/bich_lan_xa_hoang shared/assets/sprites/phaptuong/bich_lan_xa_hoang.png`: đủ80 khung, 48 màu, hệ số0,9748, không padding, không sửa cutter/checker. Glow từ sheet mới bằng `buildGlow` của `tools/assets/phuthe-to-phaptuong-lib.mjs`, màu #3ad98a. `validate --register` sinh manifest/credits, `credits.mjs` sinh dữ liệu credits; chỉ giữ hai mục công cụ sinh của võ hồn, không kéo sắp xếp/tự dò ngoài phạm vi. Recipe/hash thành phẩm ở `recipe.json`. Không đổi shared/data.ts hoặc code game.

## Kiểm trong game

- `npm run check`: xanh đầy đủ sau nhập, TypeScript client/server và validate/quality không lỗi.
- Chrome thật headless với `--mute-audio`, trang `?thu=phaptuong`, `noAudio:true`, đủ5 hướng s/se/e/ne/n, thở và sáu pha đánh liên tiếp mỗi hướng; không lỗi trang.
- Đã xem `game-preview.png` và `attack-preview.png`: thân liền, không cột tối hình người, hướng ne/n đọc được khi alpha0,7. Năm cột theo hướng; ảnh cận có hàng đầu thở và sáu hàng sau pha đánh.
- **Lỗi client chung còn tồn tại:** ảnh cận bắt được lóe trắng hướng e/n lúc khựng đòn. `client/src/phapTuong.ts` dùng `flashHit` và `setTintFill(0xffffff)` ở dòng268–269; không phải màu trắng trong RAW/sheet. Đã báo điều phối xử lý riêng phần code để giữ PR này là làn art. Không ghi nhận kiểm mặc định đạt tiêu chí không lóe trắng; cần xem lại sau sửa client.

## Native và SHA256

| RAW | Native | SHA256 |
| --- | --- | --- |
| e-v1.png | 1292×1218 | 2eb9e2a7e1712e2fa5d55f0c8f789cdfb975dcea5716d741679a9d00b790aeab |
| e.png | 1254×1254 | 698a5852c8bc40aef4763a43995a01d5e6e2c0d272f8f504021ec50d2830e556 |
| n.png | 1254×1254 | b3e76b02f392a81cc266d715e0dc8af2101a37984f2218e61b8c1fc41fa9e104 |
| ne.png | 1254×1254 | 57a3dbefaa34e2638a8f56c5e5f3b5a7a944c433c2c5bdacd611044d6f648fc8 |
| s-v1.png | 1402×1122 | 3e6d7da954fd8081a0fafacf273e13fa13de9f9f448ad7b054052624c65c6640 |
| s.png | 1254×1254 | e90d7f2efc711eff1fa23997ff6ada34eeb58438f40966d1872f4a987b56eab2 |
| se-v1.png | 1254×1254 | ddfa3b256548a0028aa517e03061ab9acbafba34af006ecd6d18a57dd053dd08 |
| se.png | 1254×1254 | 031547a860f31d6581690458a76e338a47c4300881b3accca569bcac175902df |
