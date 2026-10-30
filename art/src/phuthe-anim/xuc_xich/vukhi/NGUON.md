# Xúc Xích — vũ khí nhóm cứng đợt3

Issue #1400, epic #1020. Chủ repo đã duyệt mỹ thuật vũ khí; chờ AO review và CI xanh, worker không tựmerge.

## Nguồn
Codex/OpenAI image_gen tích hợp; không trả model hoặc seed. Đầu ra OpenAI, không gán CC0, không dùng ảnh ngoài. Mỗi hướng một atlas riêng 4×2 không nộm. Hướng e có ba lượt: hai pilot bị loại vì không đo được đoạn cán hẹp, chọn lượt 3; bốn hướng còn lại mỗi hướng một lượt. RAW giữ nguyên byte; prompt thật, lịch sử tham chiếu và hash tại từng thư mục attempt và source.json.

## Ghép và tái tạo
Recipe compose.mjs cấu hình từ mẫu một tay đã gộp; không sửa tools, ngưỡng hoặc whitelist. Marker xanh gắn cán; ghép nguyên pose tới anim.grip đo trực tiếp hai giới, giữ nguyên LPC. Một tỷ lệ chung0.14 giữa năm hướng và mọi khung; không phóng riêng impact. Ánh sáng/hạt/vệt để code.

```sh
node art/src/phuthe-anim/xuc_xich/vukhi/compose.mjs --sources art/src/phuthe-anim/xuc_xich/vukhi/sources.json --out <temp>/xuc-xich
node tools/assets/phuthe-import.mjs --id xuc_xich --kind vukhi --dir <temp>/xuc-xich/import
node tools/assets/credits.mjs
```

Sau importer, giữ dòng credits mô tả đúng atlas riêng không nộm và nguồn Codex/image_gen, không để mẫu tờ nộm tự sinh ghi sai nguồn.

## Kỹ thuật
130khung,32màu; A sau cắt≤0.7071px,0chặn/0mép.60khung attack/cast đo đúng bước, kể cả10cast/1 dùng step2/fallback:false. Mỗi giới5ghi chú hurt mượn bước0 vì bước1 bị áo che;0cảnh báo/chặn cutter. Cán đo tối đa14.556px / thân tham chiếu47px≈0.310lần (<khoảng1,4). Cận bao toàn vũ khí kể cả đầu/lưỡi47.650px, không phải chiều dài cán. Giữ đầy đủ cảnh báo nhẹ nếu có trong source.json và report.json; đạt kỹ thuật không thay tự xem game.

[Báo cáo canonical](final/report.json) · [Cutter](import/_report.json) · [Nguồn/hash](source.json) · [Atlas/sprite](index.html).

## GameScene
Đã chụp78ảnh nguyên byte1600×900,0pageerror. Tự xem đủ10GameScene cast360ms hai giới5hướng, soát thêm bốn bước attack và trang thử: bám tay, không tay phụ/không xén. Gallery `xuc-xich/index.html` ở artifact phiên859 được gắn tại PR. Chrome --mute-audio,master0/muted=true;pfx=0 tắt gói riêng vắng mặt. Server RAM riêng; API ngoại hình/thức tỉnh hiện có, hook grant và tin team. Harness tạm giữ tuổi hoạt ảnh qua animatePlayer thật, không sửa repo. Ảnh ở artifact phiên859, không đưa screenshot thô vào Git. Kiểm renderer ở các mốc cố định, không chứng nhận mọi ngoại hình/toàn bộ trận giao chiến.

## Thiết kế
Thánh Quang Hương Tràng: thân trụ cam nướng, vết nứt vàng nằm trong vỏ, đầu tròn có gờ đồng và cán đỏ thẫm một tay. Hai hướng sau có đường ráp lưng thay ấn tròn mặt trước. Chuôi mảnh liền thân để đo và neo đúng tay; không đổi checker/whitelist. Hơi nước, ánh sáng và tiểu hương tràng bay để code. Có một cảnh báo nhẹ hurt-idle nữ hướng n, giữ nguyên trong source.json.
