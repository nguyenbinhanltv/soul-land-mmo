# Liệt Hỏa Thương Lang — găng vuốt sói (#1390)

Võ hồn thứ hai đợt 2 găng-vuốt, dòng 23 bảng 25 dạng. Theo mẫu #1361 và Hỏa Ảnh #1387 đã gộp; chỉ art, không đổi client/server/tools hoặc số cân bằng.

## Nguồn và tái tạo

- Codex / OpenAI `image_gen` tích hợp; không được cung cấp model cụ thể/seed. Theo điều khoản đầu ra OpenAI, không gán CC0. Không dùng ảnh thương mại, ảnh phụ thể cũ hoặc asset ngoài làm ảnh dẫn. LPC trong QA/runtime giữ giấy phép lớp hiện có ở `art/CREDITS.md`.
- Năm job tuần tự, mỗi hướng một atlas sáu pose riêng không nộm, sinh từ chữ, không ảnh dẫn. RAW nguyên byte, prompt thật và SHA-256 ở `isolated/<hướng>/attempt1/poses.*`. Đông ghép đạt nam/nữ rồi mở rộng s/se/ne/n.
- Sáu pose: nghỉ, lấy đà, vươn, cào xuống, cast khép, cast xòe. Giáp xám nâu than, bờm gai cổ tay tối, vuốt dài chóp cam đỏ cháy sém; chỉ khe nứt và chóp có màu nung. Không bake tàn lửa, khói, hào quang hoặc vệt cào.
- Marker RAW lục `#00FF60`, nộm kiểm dùng marker vàng chuẩn. Giữ nguyên LPC; compositor chỉ tách nền/marker, thu nearest tỷ lệ 0,036, xoay/dịch tới grip, bảng chung 32 màu. Khung 96, nhóm B 22 cột, năm hướng × hai giới, tây lật bởi runtime, không neo lưng.
- Hai lớp trước/sau theo tay, vùng cổ tay bán kính 4 px che da ở lớp trước. Compositor sinh `manifest-entry.json` thay cutter lưới nộm cho atlas riêng, importer ghi manifest; không sửa tay manifest.

```sh
node art/src/phuthe-anim/liet_hoa_thuong_lang/vukhi/isolated/compose.mjs all
node tools/assets/phuthe-import.mjs --id liet_hoa_thuong_lang --kind vukhi --dir art/src/phuthe-anim/liet_hoa_thuong_lang/vukhi/isolated/result
node tools/assets/credits.mjs
```

## Grip nhỏ kế thừa Hỏa Ảnh

- Chỉ bổ sung khi có đúng một mảng da **4–9 pixel ở đúng bước LPC**, dưới lưng hơn 4 px, cách trục ngang ít nhất 6 px, ở phía đối diện và cách tay đã đo hơn 5 px. Không hạ ngưỡng chung, không bịa tay khuất hoặc mượn bước/giới khác.
- [QA bảy pose LPC](grip-small-patches.png) và [17 khung ứng viên](grip-small-patches.json) tái dùng phép đo Hỏa Ảnh trên cùng LPC; cyan là grip cũ, cam là mảng bổ sung. Đây không phải ảnh dẫn cho model hoặc ảnh game. Báo cáo cuối `isolated/result/report.json` ghi `smallGrip` từng khung để kiểm lại trên bộ mới.
- Kết quả bộ này: **175/220 khung hai grip, 45 khung một grip**, khôi phục 17 khung so với mẫu 62; còn **10 hurt/1 dùng bước hurt/0**. Đã xem lại idle/walk nữ và attack/n trong runtime, không lấy số liệu mẫu làm bằng chứng thay thế.

## Giới hạn

- Tay khuất vẫn ẩn; hurt dùng grip dự phòng có nguy cơ trượt khi co người. Khoảng cách tới grip đã chọn không chứng minh grip dự phòng đúng tay.
- Vẫn slash/spellcast LPC, **chưa có cào xuống/chạm đất như tru bằng hai tay riêng**. Bờm có pose nhưng chưa rung riêng, không tàn lửa, khói cổ tay hoặc hai vệt vuốt lửa riêng bằng code; không bake FX để che giới hạn.
- Gai bờm/giáp và độ mở vuốt khác nhẹ giữa atlas; ở góc nghiêng vuốt che nhau, chi tiết nhỏ nhập cụm ở cỡ game. Không coi kiểm máy là duyệt mỹ thuật.
- Runtime `?thu=vukhi`: Chrome `--mute-audio`, thiết lập muted, Phaser `noAudio:true`, chờ API ready và nhãn UI sẵn sàng. Tái chụp bằng `node art/src/phuthe-anim/liet_hoa_thuong_lang/vukhi/isolated/capture.mjs` với Vite cổng 5198. Không tự merge.

## Kiểm tờ và runtime

- Mười kiểm tờ nam/nữ: PASS, 0 chặn, 0 nhẹ. 220 khung, pixel tới grip đã chọn tối đa 1 px, không chạm lề 2 px; 15 hash nguồn khớp; không còn marker lục ở cả hai nửa sheet.
- [Gallery game](ingame/index.html), [trạng thái từng ảnh](ingame/source.json): ảnh thật, LPC ready, năm hướng + w; idle/walk/attack/cast/hurt × nam/nữ × 0/100/250/400 ms, 40 ảnh; hai ảnh Chân Thân shown=0, Bạch Hổ đối chứng không vũ khí, 0 lỗi browser. Mốc ngoài clip có thể về idle. Đã tự xem ảnh trước mở PR, ảnh game không sửa găng bằng hậu kỳ.

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
