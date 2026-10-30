# Yêu Hồ — vũ khí nhóm cứng đợt3

Issue #1397, epic #1020. Chủ repo đã duyệt mỹ thuật vũ khí; chờ AO review và CI xanh, worker không tựmerge.

## Nguồn
Codex/OpenAI image_gen tích hợp; không trả model hoặc seed. Đầu ra OpenAI, không gán CC0, không dùng ảnh ngoài. Mỗi hướng một atlas riêng4×2 không nộm, một lượt sinh. RAW giữ nguyên byte; prompt thật và hash tại từng hướng/attempt1 và source.json.

## Tạo hình
Quạt ba đuôi một tay: ba lưỡi sắc hình đuôi hồ ly, cán ngắn, ấn đỏ ở trục. Tím hồng sẫm #7a2a5a làm khối chính; #ff9ad5 chỉ ở viền sắc, nhấn vàng tối. Nghỉ gập thu gọn; attack phẩy/xòe, cast mở tối đa; mặt sau bỏ hoa văn mặt trước và dùng gân kết cấu tối. Không bake hỏa hồ, trận đồ, hạt/đốm sáng, sao hoặc trái tim.

## Ghép và tái tạo
Recipe compose.mjs cấu hình từ mẫu một tay đã gộp; không sửa tools, ngưỡng hoặc whitelist. Marker xanh gắn cán; ghép nguyên pose tới anim.grip đo trực tiếp hai giới, giữ nguyên LPC. Một tỷ lệ chung0.14 giữa năm hướng và mọi khung; không phóng riêng impact. Ánh sáng/hạt/vệt để code.

```sh
node art/src/phuthe-anim/yeu_ho/vukhi/compose.mjs --sources art/src/phuthe-anim/yeu_ho/vukhi/sources.json --out <temp>/yeu-ho
node tools/assets/phuthe-import.mjs --id yeu_ho --kind vukhi --dir <temp>/yeu-ho/import
node tools/assets/credits.mjs
```

Sau importer, giữ dòng credits mô tả đúng atlas riêng không nộm và nguồn Codex/image_gen, không để mẫu tờ nộm tự sinh ghi sai nguồn.

## Kỹ thuật
130khung,32màu; A sau cắt≤0.7071px,0chặn/0mép.60khung attack/cast đo đúng bước, kể cả10cast/1 dùng step2/fallback:false. Mỗi giới5ghi chú hurt mượn bước0 vì bước1 bị áo che;0cảnh báo/chặn cutter. Cán đo tối đa18.059px / thân tham chiếu47px≈0.384lần (<khoảng1,4). Cận bao toàn vũ khí kể cả đầu/lưỡi49.450px, không phải chiều dài cán. Giữ đầy đủ cảnh báo nhẹ nếu có trong source.json và report.json; đạt kỹ thuật không thay tự xem game.

[Báo cáo canonical](final/report.json) · [Cutter](import/_report.json) · [Nguồn/hash](source.json) · [Atlas/sprite](index.html).

## GameScene
Đã chụp78ảnh nguyên byte1600×900,0pageerror. Tự xem đủ10GameScene cast360ms hai giới5hướng, soát thêm bốn bước attack và trang thử: bám tay, không tay phụ/không xén. Gallery `yeu-ho/index.html` ở artifact phiên859 được gắn tại PR. Tám trang thử được chụp lại sau main có Bạch Hổ, dùng Băng Phượng Hoàng chưa có sheet làm đối chứng;70ảnh GameScene giữ nguyên vì asset Yêu Hồ/mã render không đổi. Chrome --mute-audio,master0/muted=true;pfx=0 tắt gói riêng vắng mặt. Server RAM riêng; API ngoại hình/thức tỉnh hiện có, hook grant và tin team. Harness tạm giữ tuổi hoạt ảnh qua animatePlayer thật, không sửa repo. Ảnh ở artifact phiên859, không đưa screenshot thô vào Git. Kiểm renderer ở các mốc cố định, không chứng nhận mọi ngoại hình/toàn bộ trận giao chiến.
