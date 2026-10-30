# Lam Điện Bá Vương Long — găng long trảo (#1372)

Rollout găng-vuốt đợt 1, dòng 2 bảng 25 dạng; mẫu quy trình U Minh Linh Miêu ở PR #1361 đã được chủ repo duyệt. Chỉ art, không đổi client/server hoặc số cân bằng.

## Nguồn và tái tạo

- Codex / OpenAI `image_gen` tích hợp; model và seed không được cung cấp. Đầu ra theo điều khoản OpenAI, không gán CC0. Không dùng ảnh thương mại. LPC giữ giấy phép lớp hiện có trong `art/CREDITS.md`.
- Năm atlas sáu pose riêng, không nộm: nghỉ, lấy đà, vươn, thu, cast khép, cast xòe. RAW nguyên byte, prompt nguyên văn và SHA-256 ở `isolated/<hướng>/attempt1/poses.*`. Tên `attempt1` là ô nguồn compositor; se dùng lượt 2, các hướng khác lượt 1: tổng sáu job tuần tự. Lượt se đầu giống đông nên loại, không nhập. s tham chiếu atlas e; se lượt 2 tham chiếu s; e/ne/n sinh từ chữ.
- Giữ nguyên LPC. Compositor chỉ tách nền/marker vàng, thu nearest tỷ lệ chung 0,036, xoay/dịch tới grip; bảng 32 màu chung. Không vẽ lại vũ khí bằng code. Hai lớp trước/sau theo tay; vùng cổ tay bán kính 4 px che da ở lớp trước. Khung 96, nhóm B 22 cột, năm hướng × hai giới; tây lật bởi client. Không dùng neo lưng.
- `manifest-entry.json` do compositor sinh, importer ghi manifest; không sửa tay manifest. Compositor thay cutter lưới nộm cho atlas riêng.

```sh
node art/src/phuthe-anim/lam_dien_ba_vuong_long/vukhi/isolated/compose.mjs all
node tools/assets/phuthe-import.mjs --id lam_dien_ba_vuong_long --kind vukhi --dir art/src/phuthe-anim/lam_dien_ba_vuong_long/vukhi/isolated/result
node tools/assets/credits.mjs
```

## Kiểm và giới hạn

- Mười kiểm tờ ghép (năm hướng × nam/nữ): PASS, 0 chặn, 0 nhẹ. `isolated/result/report.json` ghi 220 khung; pixel tới grip đã chọn tối đa 1,005 px, không chạm lề 2 px. Khoảng cách này không chứng minh grip dự phòng đúng tay.
- **158/220 khung hai grip; 62/220 chỉ một grip**, giữ cách mẫu: không vẽ găng tay khuất, không bịa tay hay lấy tay giới khác. **10 khung hurt/1 dùng bước hurt/0**, còn nguy cơ trượt khi co người. Chưa cải thiện được trong phạm vi art này.
- Vảy lam/azure, vuốt rồng và nhấn tím-trắng giúp khác U Minh. Sừng nhỏ chưa chẻ rõ ở mọi pose; các atlas có độ mở vuốt và chi tiết vảy khác nhau, s/se phân biệt góc còn nhẹ. Ở cỡ game chi tiết sừng/vảy bị nhập cụm; không tuyên bố đồng nhất hoàn toàn.
- Có pose chộp/xòe, nhưng chuyển động vẫn theo slash/spellcast LPC; **chưa có cào chéo hai tay hoặc chắp hai tay riêng**. **Không có sét động, khói cổ tay hay vệt cào riêng**; không bake hiệu ứng vào sheet. Muốn thêm cần PR client riêng.
- [Ảnh game](ingame/index.html), [trạng thái từng ảnh](ingame/source.json): `?thu=vukhi`, ảnh thật, LPC ready, năm hướng + w, idle/walk/attack/cast/hurt × nam/nữ × 0/100/250/400 ms (40 ảnh), hai ảnh Chân Thân shown=0, Bạch Hổ đối chứng không vũ khí, 0 lỗi browser. Mốc ngoài clip có thể đã về idle. Đã tự xem ảnh trước mở PR.
- Chrome headless `--mute-audio`, localStorage muted, Phaser `noAudio:true`. AO Browser tải điều khiển nhưng không tiến tới LPC ready ở panel nền; không lấy ảnh trống của panel làm bằng chứng. Tái chụp bằng `node art/src/phuthe-anim/lam_dien_ba_vuong_long/vukhi/isolated/capture.mjs` khi Vite cổng 5198 chạy.

Kiểm kỹ thuật không thay quyết định mỹ thuật; không tự merge.
