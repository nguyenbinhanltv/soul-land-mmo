# Hạo Thiên Chùy — ứng viên số tay theo clip

Quyết định điều phối trong #1320: không tạo pose LPC mới. `idle` / `walk` / `hurt` một tay thuận, xách/chống hoặc vác một tay nếu khớp marker. `attack` / `cast` hai điểm tay của slash/spellcast. Dòng #19 và quy tắc cho Cửu Tinh Thất Sát Kiếm, Quỷ Mị, Phá Hồn Thương, Băng Phượng Hoàng đã cập nhật trong `docs/art/phu-the-vu-khi.md`.

**PR vẫn nháp; đây là bộ cắt ứng viên, chưa duyệt nhập game.** Không sửa `shared/assets`, không tạo pose LPC. Trang chính: [index.html](index.html); [preview ghép cả hai giới](cut/preview/xoay-vong.html).

## Nguồn

Codex / OpenAI image_gen, model ID/seed không được công cụ trả về (unknown); điều khoản đầu ra OpenAI, không gán CC0. RAW nguyên byte và prompt thật nằm ở `../solo/`. Ba job thử s trước đó đã dùng đủ 3/3; bộ hiện tại dùng ảnh 1 và pose ảnh 2, không dùng mặt impact ảnh 3 lệch cỡ. Sau khi s qua kiểm mới mở rộng bốn hướng bằng **một job atlas riêng** `weapon-directions-attempt1.png` (mỗi hướng hai pose). Không dùng ảnh thương mại hoặc phụ thể cũ làm nguồn. Ảnh atlas mở rộng chỉ tham chiếu ảnh chùy riêng lượt 1 để khớp thiết kế.

`toA.png` … `toE.png` ở đây là **tờ ghép bằng code**, không phải RAW model. Nộm/vạch/marker từ LPC hiện có, tuân theo giấy phép thân gốc trong art/CREDITS.md; preview dùng thân LPC thật. Khóa nền #FF00FF, nộm #00D0D0, vạch #7A5CFF, marker #00FF60. Hash RAW/prompt, tờ ghép, sheet cắt và manifest ở [source.json](source.json).

## Kết quả kiểm và cắt

| Hướng | Chặn / nhẹ khi kiểm chung | Ghi chú |
|---|---|---|
| s | 0 / 0 | Một tay nghỉ/đi/hurt; hai tay đánh/thi triển |
| se | 0 / 1 | Cảnh báo so cỡ giữa hướng |
| e | 0 / 1 | Cảnh báo so cỡ; cutter đo attack/cast khoảng 66% so với s |
| ne | 0 / 1 | Cảnh báo so cỡ; cần duyệt khác góc bằng mắt |
| n | 0 / 1 | Cảnh báo so cỡ |

Cutter: **0 block / 2 warn / 16 info**, 65 khung, khung 128, bảng 32 màu. Đầu ra `cut/vkanim_hao_thien_chuy_f.png`; nửa sau rỗng nên không ghi `_b.png`. `manifest-entry.json` ghi 65 khóa grip: hai tọa độ ở idle/walk/hurt và bốn ở attack/cast, đã kiểm toàn bộ. Khi khung đo thiếu hai tay vì bị che, dùng khung lân cận đủ tay và báo fallback; không sửa thân. Các placement.json ghi bước lấy điểm cụ thể; không coi fallback là đo trực tiếp tay đang lộ của khung đó.

Cần duyệt bằng mắt độ rõ nâng/nện và cán dọc, chênh cỡ e, hướng ne và ghép lên nữ. Kiểm không chặn là điều kiện để cắt/preview, không phải duyệt thẩm mỹ hoặc cho phép importer tự nhập.

## Tái tạo

```sh
node tools/assets/phuthe-rigid-pilot.mjs --raw art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/weapon-s-attempt1.png --poses art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/weapon-s-attempt2.png --by-clip --out <temp-s>
# Mỗi hướng se/e/ne/n: đổi --dir; sau mỗi lượt lưu placement.json theo tên hướng.
node tools/assets/phuthe-rigid-pilot.mjs --raw art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/weapon-directions-attempt1.png --source-config art/src/phuthe-anim/hao_thien_chuy/vukhi/solo/direction-sources.json --by-clip --dir se --out <temp-dir>
npm run phuthe:check -- hao_thien_chuy --kind vukhi --dir art/src/phuthe-anim/hao_thien_chuy/vukhi/clip-hands --out <temp-check>
node tools/assets/phuthe-sheet-cut.mjs --id hao_thien_chuy --kind vukhi --sheet A=<toA> --sheet B=<toB> --sheet C=<toC> --sheet D=<toD> --sheet E=<toE> --out <cut>
node tools/assets/phuthe-sheet-preview.mjs --id hao_thien_chuy --dir <cut> --scale 2
```

Các thay đổi công cụ đi kèm: số tay cố định hoặc bảng theo clip dùng chung ở nộm/prepare/check/cut; fallback tìm đủ số tay được yêu cầu; prompt diễn đạt theo clip; preview đọc đúng tiền tố vkanim từ manifest. Bộ hồi quy phụ thể 59/59 đạt, gồm test marker theo clip, số tọa độ manifest và preview tải vkanim. Không đổi logic game hay client.
