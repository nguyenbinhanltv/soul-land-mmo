# U Minh Linh Miêu — mẫu thí điểm găng-vuốt (#1358)

**Chưa duyệt mỹ thuật, chưa dùng làm khuôn rollout.** Dòng 5 của bảng 25 dạng trong `docs/art/phu-the-vu-khi.md`. Không đổi code client/server, luật chơi hoặc số cân bằng.

## Nguồn và tái tạo

- Công cụ: Codex / OpenAI `image_gen` tích hợp, không biết model cụ thể hoặc seed. Đầu ra theo điều khoản OpenAI, không gán CC0. Không dùng hình thương mại hay asset ngoài làm ảnh dẫn.
- Năm atlas riêng không nộm, sáu pose/atlas; `isolated/<hướng>/attempt1/poses.raw.png` giữ nguyên byte. `attempt1` là tên ô nguồn được compositor đọc, **không phải số lần sinh thực tế**: e/n dùng lượt 1; s/se/ne dùng lượt 2. Tổng tám job tuần tự; ba RAW lượt 1 bị loại vì bám góc đông ở `isolated/rejected/`, kèm prompt/hash/ảnh dẫn.
- Từng RAW được xem trước khi ghép. Đông đạt kiểm nam/nữ trước khi mở rộng. Prompt nguyên văn và SHA-256 ở file cạnh RAW; prompt dùng STYLE/NEGATIVE chung, phần kỹ thuật ghi đè nền thành #FF00FF và yêu cầu chỉ vũ khí.
- Sáu pose: nghỉ, lấy đà, cào vươn, thu đòn, cast khép, cast xòe. Giữ thân LPC gốc; code chỉ tách nền/marker, thu nearest một tỷ lệ 0,036, xoay/dịch; không vẽ lại vuốt hoặc sửa RAW. Bảng màu chung 32 màu. Khung 96, nhóm B 22 cột × 10 hàng, đủ năm hướng s/se/e/ne/n; phía tây dùng lật của client.
- Hai găng được đặt theo `gripPoints` trên thân LPC, ghi `anim.grip` nam và `anim.gripSex.f` nữ. Tọa độ nữ đã bake vào năm hàng nữ; runtime không cần đọc `gripSex`. Không áp neo lưng. Tay gần ở lớp trước, tay xa ở lớp sau ở se/e/ne, s trước, n sau; vùng cổ tay trong bán kính 4 px quanh grip lên lớp trước để không lộ tay trần khi thân che vuốt. Hai sprite như runtime hiện có.
- LPC trong ảnh kiểm giữ giấy phép các lớp hiện có tại `art/CREDITS.md`; không coi thân LPC là ảnh model.

Từ gốc repo:

```sh
node art/src/phuthe-anim/u_minh_linh_mieu/vukhi/isolated/compose.mjs all
node tools/assets/phuthe-import.mjs --id u_minh_linh_mieu --kind vukhi --dir art/src/phuthe-anim/u_minh_linh_mieu/vukhi/isolated/result
node tools/assets/credits.mjs
node tools/assets/credits.mjs --check
```

Compositor sinh `manifest-entry.json` cho importer, thay bước cutter cho atlas riêng (không đưa atlas 3×2 pose vào cutter lưới nộm 6×4). Không sửa tay manifest. Không dùng `--anchor`. Dòng ghi công importer phải mô tả đúng atlas riêng, không mô tả model vẽ lên nộm.

## Kiểm máy và kiểm trong game

- Mười lượt kiểm tờ ghép (5 hướng × nam/nữ): **PASS, 0 chặn, 0 nhẹ**. Báo cáo ở `isolated/<hướng>/attempt1/composed/review-{m|f}/`. Tờ có nộm là **ảnh ghép code**, không phải RAW model.
- Hình học ở `isolated/result/report.json`: 220 khung, khoảng cách pixel vũ khí đến grip tối đa khoảng 1,01 px, không điểm ảnh chạm lề 2 px. Đây là khoảng cách tới grip đã chọn, **không chứng nhận grip dự phòng trùng tay ở mọi bước LPC**.
- `validate.mjs`: 1795 key, 0 lỗi, 0 cảnh báo sau khi sửa định dạng clip thành `{col,n}`. Lần đầu dùng tuple đã thất bại, không lấy ảnh của lần đó làm bằng chứng đạt.
- [Ảnh runtime và trạng thái từng lần chụp](ingame/source.json): `?thu=vukhi`, năm hướng + w, idle/walk/attack/cast/hurt, nam/nữ, các mốc 0/100/250/400 ms, tổng 40 ảnh. `mode=that`, LPC ready, Bạch Hổ đối chiếu không vũ khí; hai ảnh Chân Thân có shown=0. Không có lỗi browser. Mốc ngoài thời lượng clip có thể đã về idle.
- Âm thanh tắt: Chrome `--mute-audio`, thiết lập âm thanh muted và trang thử có Phaser `noAudio:true`. Không cần bot server/DB cho làn art.
- Tái chụp với Vite cổng 5198: `node art/src/phuthe-anim/u_minh_linh_mieu/vukhi/isolated/capture.mjs`. Ảnh ghi trực tiếp từ trình duyệt, không chỉnh hình găng trong ảnh chụp.

## Điểm lệch so với bảng 25 dạng — cần chủ repo quyết định

| Yêu cầu dòng 5 | Kết quả mẫu / giới hạn |
|---|---|
| Găng vuốt báo, bốn vuốt dài tím sẫm | Có bốn vuốt trên RAW, nền tím than và rìa tím sáng; khi thu còn khoảng 14–18 px, một số vuốt nhập cụm pixel. Giáp thiên về kim loại có khớp; dấu hiệu riêng của **báo U Minh** còn yếu, dễ đọc thành găng ma chung. |
| Găng ở cả hai bàn, vuốt vượt đầu ngón | 158/220 khung có hai grip; 62/220 chỉ có một grip đo được, găng tay kia **không vẽ**. Chi tiết từng khung nằm trong report. Chủ yếu nữ idle hướng ngang, tay khuất khi đánh và hurt; không lấy tay giới khác hoặc bịa tay. |
| Gắn đúng bàn tay ở mọi khung | Khi bộ đo hai tay dùng bước lân cận, thử lại một tay ở đúng bước. Riêng 10 khung hurt/1 (5 hướng × 2 giới) vẫn dùng grip dự phòng của hurt/0; có thể trượt khi hồn sư co người. Đây là giới hạn còn lại, chưa được miễn tiêu chí. |
| Attack cào chéo hai vuốt liền | Có pose lấy đà/vươn/thu; theo clip attack LPC hiện có, **chưa có chuyển động cào chéo hai tay riêng**. Không đổi client trong làn này. |
| Cast vuốt xòe, khói tuôn; khói tan ở cổ tay | Có pose xòe. **Chưa có khói riêng** ở cổ tay hoặc lúc cast; không bake khói vào sheet. Vệt vuốt/khói đặc trưng cần công việc code sau nếu được duyệt. |
| Năm hướng của cùng một vũ khí | Có năm atlas riêng; n/ne thấy mặt dưới khác e/se. Hoa văn, giáp cổ tay và độ mở vuốt giữa atlas chưa hoàn toàn đồng nhất; có rune dạng mắt ở s thay vì cùng một vết cào ở e. Không coi là đã duyệt đồng nhất. |
| Lớp theo thân/tay | Đã tách trước/sau theo tay và hướng; khi hai tay đổi vị trí trong clip, lớp tay xa vẫn theo thứ tự bộ đo. Cần duyệt chuyển lớp động bằng ảnh, nhất là n/cast. |

Chưa có chấp thuận ngoại lệ từ chủ repo. Mẫu này **không kế thừa** ngoại lệ của Lam Ngân Thảo/Hạo Thiên Chùy và không phê duyệt các dòng găng-vuốt còn lại.

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
