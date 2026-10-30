# Kim Vũ Miêu Ưng — găng vuốt ưng (#1378)

Rollout găng-vuốt đợt 1, dòng 9 bảng 25 dạng; mẫu quy trình U Minh Linh Miêu PR #1361 đã được chủ repo duyệt. Chỉ art, không đổi client/server, luật chơi hoặc số cân bằng.

## Nguồn và tái tạo

- Codex / OpenAI `image_gen` tích hợp, không được cung cấp model cụ thể/seed. Theo điều khoản đầu ra OpenAI, không gán CC0. LPC giữ giấy phép lớp hiện có trong `art/CREDITS.md`; không dùng ảnh thương mại, ảnh phụ thể cũ hoặc asset ngoài làm ảnh dẫn.
- Năm job tuần tự, mỗi hướng một atlas sáu pose không nộm, sinh từ chữ, không ảnh dẫn. RAW nguyên byte, prompt thật và SHA-256 ở `isolated/<hướng>/attempt1/poses.*`. Đông ghép đạt nam/nữ rồi mở rộng s/se/ne/n.
- Sáu pose: nghỉ, lấy đà, quét vươn, thu, cast khép, cast xòe. Giáp nâu vàng sẫm, lông vàng kim có chóp gần đen, vuốt lớn; nhấn ivory-trắng nhỏ. Lông có pose xòe, không bake sét, khói, hào quang, hạt hoặc vệt cào.
- **Marker RAW lục sáng `#00FF60`**, không dùng vàng vì trùng kim loại. Compositor art riêng tách marker theo màu lục; giữ nguyên công cụ dùng chung. Nộm kiểm vẫn dùng marker vàng của bộ kiểm, khác marker RAW; nộm không phải ảnh model và không vào game.
- Compositor giữ nguyên LPC, chỉ tách nền/marker, thu nearest tỷ lệ chung 0,036, xoay/dịch tới grip nam/nữ; bảng chung 32 màu, khung 96, nhóm B 22 cột, năm hướng × hai giới. Hai lớp trước/sau theo tay, vùng cổ tay bán kính 4 px che da ở lớp trước; tây lật bởi runtime, không neo lưng.
- Compositor sinh `manifest-entry.json` thay cutter lưới nộm cho atlas riêng; importer ghi manifest, không sửa tay manifest.

```sh
node art/src/phuthe-anim/kim_vu_mieu_ung/vukhi/isolated/compose.mjs all
node tools/assets/phuthe-import.mjs --id kim_vu_mieu_ung --kind vukhi --dir art/src/phuthe-anim/kim_vu_mieu_ung/vukhi/isolated/result
node tools/assets/credits.mjs
```

## Giới hạn cần xem khi duyệt

- Tay khuất không đủ grip thì ẩn găng, không bịa tay hoặc lấy tọa độ giới khác; giữ giới hạn mẫu. Grip hurt dự phòng có nguy cơ trượt khi thân co xuống. Khoảng cách tới grip đã chọn không chứng minh grip dự phòng đúng tay.
- **Chưa có chuyển động quét xé/cào chéo hai tay riêng**: vẫn slash/spellcast LPC. Lông thay pose nhưng chưa có rung lông riêng hoặc sét động, khói cổ tay, vệt cào riêng bằng code. Không thêm client trong PR art này.
- Vuốt ở góc nghiêng có che nhau; số vuốt nhìn thấy và độ mở khác giữa pose. Hàng lông/giáp chưa hoàn toàn cùng chi tiết giữa hướng, đạo văn lôi và lông nhỏ nhập cụm ở cỡ game. Không coi kiểm máy là duyệt mỹ thuật.

## Kiểm tờ và runtime

- Mười kiểm tờ nam/nữ: PASS, 0 chặn, 0 nhẹ. Báo cáo `isolated/result/report.json`: 220 khung, **158 hai grip / 62 một grip**, **10 hurt/1 dùng bước hurt/0**; pixel tới grip đã chọn tối đa 1 px, không chạm lề 2 px. Chưa cải thiện được giới hạn grip mẫu trong phạm vi art. Cập nhật main #1375 chỉ mở ngoại lệ nhóm cứng dọc, không áp cho găng này.
- [Gallery game](ingame/index.html), [trạng thái từng ảnh](ingame/source.json): ảnh thật, LPC ready, năm hướng + w, idle/walk/attack/cast/hurt × nam/nữ × 0/100/250/400 ms, tổng 40 ảnh; hai ảnh Chân Thân shown=0, Bạch Hổ đối chứng không vũ khí, 0 lỗi browser. Mốc ngoài clip có thể đã về idle. Đã tự xem ảnh trước mở PR.
- Chrome `--mute-audio`, thiết lập muted và Phaser `noAudio:true`; chờ cả API ready và nhãn UI sẵn sàng. Tái chụp bằng `node art/src/phuthe-anim/kim_vu_mieu_ung/vukhi/isolated/capture.mjs` với Vite cổng 5198. Không tự merge.

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
