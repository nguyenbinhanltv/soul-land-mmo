# Hỏa Ảnh — găng liệt hỏa (#1382)

Đợt 2 găng-vuốt, dòng 13 bảng 25 dạng; tiếp quy trình mẫu U Minh Linh Miêu #1361 và đợt 1 #1373/#1377/#1379. Chỉ art, không đổi client/server/tools hoặc số cân bằng.

## Nguồn và tái tạo

- Codex / OpenAI `image_gen` tích hợp, không được cung cấp model cụ thể/seed. Đầu ra theo điều khoản OpenAI, không gán CC0. Không dùng ảnh thương mại, ảnh phụ thể cũ hoặc asset ngoài làm ảnh dẫn. LPC trong ảnh QA/runtime giữ giấy phép lớp hiện có ở `art/CREDITS.md`.
- Năm job tuần tự, mỗi hướng một atlas sáu pose không nộm, sinh từ chữ, không ảnh dẫn. RAW nguyên byte, prompt thật và SHA-256 ở `isolated/<hướng>/attempt1/poses.*`. Đông ghép đạt nam/nữ rồi mở rộng s/se/ne/n.
- Sáu pose: nghỉ, lấy đà, đấm thẳng, thu, cast nâng, cast xoay vào trong. Giáp đỏ than gần đen, gờ hình lửa đặc và đạo văn đỏ nung, ấn lửa lòng tay, nhấn amber nhỏ. Không bake khói, hào quang, hạt hoặc vệt đòn.
- Marker RAW lục `#00FF60`, tách riêng khỏi giáp đỏ/amber; nộm kiểm dùng marker vàng chuẩn. Compositor giữ nguyên LPC, chỉ tách nền/marker, thu nearest tỷ lệ 0,036, xoay/dịch tới grip; bảng chung 32 màu, khung 96, nhóm B 22 cột, năm hướng × hai giới. Tây lật bởi runtime; không neo lưng.
- Hai lớp trước/sau theo tay, vùng cổ tay bán kính 4 px che da ở lớp trước. Compositor sinh `manifest-entry.json` thay cutter lưới nộm cho atlas riêng; importer ghi manifest, không sửa tay manifest.

```sh
node art/src/phuthe-anim/hoa_anh/vukhi/isolated/compose.mjs all
node tools/assets/phuthe-import.mjs --id hoa_anh --kind vukhi --dir art/src/phuthe-anim/hoa_anh/vukhi/isolated/result
node tools/assets/credits.mjs
```

## Thử rẻ giảm khung một grip

- Mẫu cũ bỏ mảng da nhỏ hơn 10 pixel. Compositor art này chỉ bổ sung khi có đúng một mảng **4–9 pixel da nhìn thấy ở chính bước LPC**, dưới lưng hơn 4 px, cách trục ngang ít nhất 6 px, ở phía đối diện tay đã đo và cách tay đó hơn 5 px. Không đổi bộ đo chung, không bịa tay khuất, không mượn tay giới khác hoặc bước khác.
- [Ảnh QA bảy pose LPC duy nhất](grip-small-patches.png): cyan là grip cũ, cam là mảng tay nhỏ bổ sung. [Danh sách 17 khung](grip-small-patches.json) có điểm/mảng da đo được. Bốn idle nữ × ba hướng nghiêng, walk/4 nữ × ba hướng nghiêng, attack/1 hướng n × hai giới. Ảnh QA có chấm là minh họa đo, không thay LPC hoặc ảnh game.
- Kết quả từ 62 xuống **45/220 khung một grip**, còn **175 khung hai grip**; 17 khung bổ sung được kiểm lại trong game, nhất là idle/walk nữ và attack/1 hướng n. Còn 10 hurt/1 dùng bước hurt/0. Khoảng cách tới grip đã chọn không chứng minh grip dự phòng đúng tay. Số liệu cuối nằm trong `isolated/result/report.json`, mỗi khung bổ sung có `smallGrip` để kiểm lại.

## Giới hạn

- Chuyển động vẫn slash/spellcast LPC, **chưa có đấm thẳng/hai nắm tay chạm ngực riêng**. Không khói cổ tay, lửa bùng/vệt đòn riêng bằng code; không bake FX để che giới hạn.
- Hình gờ giáp/đạo văn có khác giữa atlas; chi tiết nhỏ nhập cụm ở cỡ game. Không coi kiểm máy là duyệt mỹ thuật.
- Chụp runtime `?thu=vukhi` bằng Chrome `--mute-audio`, thiết lập muted, Phaser `noAudio:true`, chờ API ready và nhãn UI sẵn sàng. Tái chụp `node art/src/phuthe-anim/hoa_anh/vukhi/isolated/capture.mjs` với Vite cổng 5198. Không tự merge.

## Kiểm tờ và runtime

- Mười kiểm tờ nam/nữ: PASS, 0 chặn, 0 nhẹ. 220 khung, pixel tới grip đã chọn tối đa 1 px, không chạm lề 2 px; 15 hash RAW/prompt/compositor khớp.
- [Gallery game](ingame/index.html), [trạng thái từng ảnh](ingame/source.json): ảnh thật, LPC ready, năm hướng + w; idle/walk/attack/cast/hurt × nam/nữ × 0/100/250/400 ms, 40 ảnh; hai ảnh Chân Thân shown=0, Bạch Hổ đối chứng không vũ khí, 0 lỗi browser. Mốc ngoài clip có thể về idle. Đã tự xem ảnh trước mở PR, ảnh game không chỉnh găng bằng hậu kỳ.

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
