# Hạo Thiên Chùy — atlas tám pose, đủ năm hướng

Bộ cuối ở thư mục `vukhi/` cha: `vkanim_hao_thien_chuy_b.png`, `_f.png`, `manifest-entry.json`, `_report.json`. [Trang duyệt](index.html) dùng GIF từ bộ cắt cuối, đủ hai giới × năm hướng × năm clip. Chưa nhập `shared/assets`; importer thực hiện riêng. Part of #1312, epic #1020, PR #1320.

## Quyết định và cách ghép

Điều phối chấp nhận bỏ vác vai vì tay LPC thấp. Idle/walk/hurt một tay thuận; idle/walk đầu chùy cao hơn hông, cán chéo hoặc đứng, không ngang hông. Attack/cast hai tay, chọn pose nện khác thật. Không tạo hoặc sửa pose LPC. Dòng #19 của bảng vũ khí đã cập nhật.

Theo phương pháp s837, nhánh `ao/lam-ngan-thao/1312-vu-khi`, SHA `a69b175b7790d9b8563a797543f95982ca701c86`: model chỉ vẽ vũ khí riêng, code đăng ký gốc từng pose rồi ghép grip nam/nữ đo trực tiếp. Tám hình gồm idle, walk, bốn attack và hai cast. Nhóm A có 13 khung mỗi hướng mỗi giới, tổng 130 khung. Không dùng deform/uốn chùy hoặc vẽ lại thân.

Bộ ghép đo trục cán bằng PCA, chuẩn hóa **toàn bộ** mỗi pose về bề ngang vuông góc cán 200 đơn vị nguồn, rồi dùng chung tỷ lệ vừa khung `0.08679199491071118` và bảng 32 màu. Cỡ bề ngang này ở game khoảng 17,36 điểm; giữ tỷ lệ đầu/cán của từng hình, không bóp riêng đầu hoặc cán. s/se bỏ hình impact chính diện số 4; n bỏ pose attack cán ngắn số 4. Chuỗi chọn có bốn hình khác thật, không bắt buộc dùng mọi hình của RAW. Chi tiết root, trục, hệ số chuẩn hóa, lựa chọn và khoảng cách ở `result/<hướng>/compose-plan.json`.

Cutter chung chạy riêng nam/nữ. Chỉ lấy năm hàng đúng giới ở mỗi lần cắt, bỏ hàng giới kia được ước lượng bằng neo lưng. ne/n mặc định lớp sau, vùng cầm theo grip thuộc lớp trước; cấu hình mặt nạ từng giới ghi trong `_report.json` cha. Sau ghép hai nửa, đo lại tiếp xúc tay và mép trên chính sheet cuối.

## RAW, lượt và nguồn

- s: 2 lượt; chọn lượt 2, lượt 1 thiếu marker.
- se: 1 lượt, được giữ từ đợt trước.
- e: 1 lượt.
- ne: 2 lượt; lượt 1 marker cast có mảnh xanh rời nên bộ dò thấy 9 thành phần, chọn lượt 2.
- n: 2 lượt; lượt 1 cán ngắn khi ghép hai tay xa nhau, chọn lượt 2 và bỏ pose cán ngắn khỏi chuỗi attack.

Tổng atlas mới 8 job (3 ở đợt s/se, thêm 5 sau quyết định mở rộng), từng job tuần tự, mỗi hướng không quá 3 lượt. Không gọi model trong lệnh tái tạo. RAW nguyên byte, prompt chính xác và SHA256 ở từng `attempt*/poses.source.json`; `source.json` tổng hợp hash công cụ và sheet cuối. Ảnh ghép có nộm là đầu ra code, không gọi là RAW model. Nguồn ảnh OpenAI output terms, không gán CC0; model/seed không được công cụ trả về nên ghi unknown. Thân LPC giữ ghi công hiện hành tại art/CREDITS.md.

## Kết quả

- Checker cả nam/nữ: **0 chặn / 3 nhẹ mỗi giới**. s/se 0/0; e/ne/n mỗi hướng 0/1.
- Cảnh báo là bounding box so với s, không phải cỡ riêng đầu búa: e idle 164%, walk 131%, hurt 161%; ne idle 115%, hurt 112%; n idle 128%, walk 118%, hurt 126%.
- Cutter mỗi giới: **0 chặn / 5 nhẹ / 15 thông tin**. Thông tin gồm tay bị che dùng fallback, ghi đầy đủ trong báo cáo; không giấu cảnh báo.
- Sheet cuối **130 khung, không chạm mép**, A tối đa **1,524 điểm**, B **1,910 điểm**, ngưỡng 2 điểm khung game 128. Phép đo là từ tay tới pixel vũ khí gần nhất, vẫn cần xem mặt cầm/đòn nện bằng mắt.
- Đã xem tổng hợp s nam và n nữ; idle/walk giữ đầu cao/cán chéo, attack/cast hai tay, không dùng đầu impact chính diện phóng lớn. Trang lịch sử cũ được giữ để đối chiếu, không thay thế bộ hiện hành.

## Tái tạo

```sh
node tools/assets/phuthe-hammer-atlas-finalize.mjs --sources art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-atlas/sources.json --out art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-atlas/result
node tools/assets/phuthe-hammer-atlas-cut.mjs --dir art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-atlas/result --out art/src/phuthe-anim/hao_thien_chuy/vukhi
npm run test:assets
```

Hồi quy kiểm atlas thiếu marker, giữ byte RAW, từ chối ghi đè RAW, bề ngang chuẩn hóa, bốn pose attack, số tay theo clip và khoảng cách/mép ở 130 khung của sheet cuối.
