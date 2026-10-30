# Nhu Cốt Thố — găng quyền gân khí (#1374)

Rollout găng-vuốt đợt 1, dòng 8 bảng 25 dạng; mẫu quy trình U Minh Linh Miêu PR #1361 đã được chủ repo duyệt. Chỉ art, không đổi client/server, luật chơi hay số cân bằng.

## Nguồn và tái tạo

- Codex / OpenAI `image_gen` tích hợp, không được cung cấp model cụ thể hoặc seed. Theo điều khoản đầu ra OpenAI, không gán CC0; LPC giữ giấy phép lớp hiện có trong `art/CREDITS.md`. Không dùng ảnh thương mại hoặc ảnh phụ thể cũ làm tham chiếu.
- Năm job tuần tự, mỗi hướng một atlas sáu pose không nộm, sinh từ chữ, không ảnh dẫn. RAW nguyên byte cùng prompt thật và SHA-256 ở `isolated/<hướng>/attempt1/poses.*`. Đông ghép đạt nam/nữ rồi mới mở rộng s/se/ne/n.
- Sáu pose: nghỉ, lấy đà, đấm vươn, thu, cast nâng, cast xòe hai dải. Găng tím hồng sẫm, nhấn đỏ/ivory, hình nặng góc cạnh; hai dải khí như tai thỏ buộc vào cổ tay, không vẽ con thỏ hoặc hình dễ thương. Dải là phần hình có pose riêng; không bake khói, hào quang, hạt, bụi đá hay vệt đòn.
- Compositor giữ nguyên LPC, chỉ tách nền/marker vàng, thu nearest một tỷ lệ chung 0,036, xoay/dịch tới grip từng khung nam/nữ; bảng chung 32 màu, khung 96, nhóm B 22 cột, năm hướng × hai giới. Hai lớp trước/sau theo tay, vùng cổ tay bán kính 4 px che da ở lớp trước. Tây dùng lật runtime, không áp neo lưng.
- Compositor sinh `manifest-entry.json` thay cutter lưới nộm cho atlas riêng; importer ghi manifest, không sửa tay manifest.

```sh
node art/src/phuthe-anim/nhu_cot_tho/vukhi/isolated/compose.mjs all
node tools/assets/phuthe-import.mjs --id nhu_cot_tho --kind vukhi --dir art/src/phuthe-anim/nhu_cot_tho/vukhi/isolated/result
node tools/assets/credits.mjs
```

## Giới hạn cần xem khi duyệt

- Giữ cách đo của mẫu: tay khuất không đủ grip thì ẩn găng, không bịa tay hoặc lấy tọa độ giới khác. Grip hurt dự phòng vẫn có nguy cơ trượt khi thân co người; khoảng cách tới grip đã chọn không chứng minh grip dự phòng đúng tay.
- Chuyển động vẫn theo slash/spellcast LPC, **chưa có động tác đấm/đạp hoặc hai tay riêng**. Pose dải khí thay đổi giữa lấy đà/đấm/cast, nhưng **chưa có mô phỏng quất dải riêng, khói cổ tay, bụi đá hoặc vệt đòn bằng code**. Không thêm client trong PR art này.
- Hai dải và giáp cổ tay không hoàn toàn cùng hoa văn giữa hướng; ở cỡ game dải mảnh/đạo văn nhập cụm pixel, chất liệu dải có thể đọc như đai vải thay vì khí. Không coi kiểm máy là duyệt mỹ thuật.

## Kiểm tờ và runtime

- Mười kiểm tờ nam/nữ: PASS, 0 chặn, 0 nhẹ. Báo cáo hình học `isolated/result/report.json`: 220 khung, **158 hai grip / 62 một grip**, **10 hurt/1 dùng bước hurt/0**. Pixel tới grip đã chọn tối đa 1,005 px; không chạm lề 2 px. Chưa cải thiện được các giới hạn grip của mẫu trong phạm vi art.
- [Gallery ảnh game](ingame/index.html), [trạng thái từng lần chụp](ingame/source.json): năm hướng + w, idle/walk/attack/cast/hurt × nam/nữ × 0/100/250/400 ms, tổng 40 ảnh; ảnh thật, LPC ready, Bạch Hổ đối chứng không vũ khí. Hai ảnh Chân Thân shown=0; 0 lỗi browser. Mốc ngoài clip có thể đã về idle. Đã tự xem ảnh trước mở PR.
- Chrome `--mute-audio`, thiết lập muted và Phaser `noAudio:true`; chờ cả API ready và nhãn UI sẵn sàng. Lệnh tái chụp `node art/src/phuthe-anim/nhu_cot_tho/vukhi/isolated/capture.mjs` với Vite cổng 5198. Không tự merge.

<!-- phuthe-import:huong -->
### Hướng đã nhập (tự ghi bởi `phuthe-import.mjs`, `anim.dirsOk` trong manifest)

Đủ 5 hướng.

| Hướng | Trạng thái |
|---|---|
| s (tờ A) | đã nhập hoạt ảnh vẽ thật |
| se (tờ B) | đã nhập hoạt ảnh vẽ thật |
| e (tờ C) | đã nhập hoạt ảnh vẽ thật |
| ne (tờ D) | đã nhập hoạt ảnh vẽ thật |
| n (tờ E) | đã nhập hoạt ảnh vẽ thật |
<!-- /phuthe-import:huong -->
