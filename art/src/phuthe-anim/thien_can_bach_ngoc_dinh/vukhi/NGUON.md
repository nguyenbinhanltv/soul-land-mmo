# Thiên Càn Bạch Ngọc Đỉnh — vũ khí nhóm cứng đợt 3

Issue #1408, epic #1020. Chủ repo/điều phối đã duyệt mỹ thuật vũ khí. Chờ AO duyệt và CI xanh; worker không tự merge.

## Nguồn và thiết kế

Codex / OpenAI `image_gen` tích hợp; công cụ không trả model hoặc seed. Đầu ra OpenAI, không gán CC0. Không dùng ảnh ngoài. Năm atlas riêng 4×2, mỗi hướng một lượt, không người/nộm/tay. Giữ RAW nguyên byte, prompt thật và hash tại `<hướng>/attempt1/` và `source.json`. Chuỗi tham chiếu: s từ e, se từ s, ne từ e, n từ ne.

Đỉnh ngọc ngà sáng, khắc xanh ngọc đậm, hai quai viền vàng, ba chân ngắn và nắp có núm liền thân. Mặt trước thao thiết, mặt sau mây khắc và đường ráp ngọc. Đỉnh nhỏ bưng trên tay thuận; attack nghiêng/hất rồi thu lại, cast nâng cao và nghiêng miệng. Khói ngọc/linh hỏa để code, không bake vào sprite.

## Ghép và tái tạo

`compose.mjs` dùng công thức neo đáy trực tiếp đã gộp ở Tháp #1403, cấu hình id và tỷ lệ 0,08 cho Đỉnh. Marker xanh ở chân giữa được bỏ khi ghép; giữ nguyên pose và neo đáy tới điểm tay canonical. Một tỷ lệ cho cả năm hướng, hai giới, mọi khung. Không sửa tools, checker, whitelist hay ngưỡng. Một tay count1/castRaised đo đúng bước, không cần ngoại lệ mới. Không có cán dài; tỷ lệ cán/thân bằng 0, giới hạn cán khoảng 1,4 thân không phát sinh.

```sh
node art/src/phuthe-anim/thien_can_bach_ngoc_dinh/vukhi/compose.mjs --sources art/src/phuthe-anim/thien_can_bach_ngoc_dinh/vukhi/sources.json --out <temp>/dinh
node tools/assets/phuthe-import.mjs --id thien_can_bach_ngoc_dinh --kind vukhi --dir <temp>/dinh/import
node tools/assets/credits.mjs
```

Sau importer, giữ credits mô tả đúng atlas riêng không nộm và nguồn Codex/OpenAI image_gen, không dùng mô tả tờ vẽ trên nộm tự sinh. Sheet chỉ chứa pixel vật thể, giữ nguyên LPC ngoài sheet.

## Kiểm kỹ thuật và giới hạn

130 khung, tối đa 32 màu; sau cutter A≤0,936 px, không chạm mép, không chặn. Trước cutter A≤1,678 px. 60 khung attack/cast đúng bước, gồm 10 cast/1 dùng step2, fallback:false. Checker có 6 cảnh báo nhẹ nam và 4 nữ: che nộm nhiều ở một số khung, thêm hurt-idle nữ hướng n. Cutter mỗi giới có 3 cảnh báo che nộm và 5 ghi chú hurt mượn bước0 vì bước1 bị áo che. Giữ nguyên mọi cảnh báo trong `source.json`, `final/compose-report.json` và `import/_report.json`; không tắt kiểm tra để nhận ảnh. Tự xem game phải kiểm phần thân/tay để tránh sót pixel nộm khi vật bưng rộng che thân.

[Nguồn/hash](source.json) · [Báo cáo ghép/checker](final/compose-report.json) · [Cutter](import/_report.json) · [Atlas/hoạt ảnh](index.html).

## GameScene

Đã chụp78ảnh nguyên byte1600×900,0pageerror. Tự xem đủ10GameScene cast360ms hai giới5hướng, soát thêm bốn bước attack và trang thử: bám tay, không tay phụ/không xén. Gallery `dinh/index.html` ở artifact phiên859 được gắn tại PR. Chrome --mute-audio, master0/muted=true, pfx0; server RAM riêng. Dùng API ngoại hình/thức tỉnh hiện có, test grant/team; harness tạm giữ tuổi hoạt ảnh qua animatePlayer thật, không sửa repo. Chụp cast0/100/360ms và attack0/100/190/260ms, hai giới năm hướng, thêm trang thử idle/walk/attack/cast có đối chứng không vũ khí. Kiểm renderer tại mốc cố định, không chứng nhận mọi ngoại hình hoặc toàn bộ trận giao chiến. Screenshot thô nằm ở artifact phiên859, không đưa vào Git.
