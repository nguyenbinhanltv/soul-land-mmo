# Hạo Thiên Chùy — atlas pose riêng theo phương pháp 837

PR #1320 vẫn nháp. Đây là đợt thử riêng, không ghi đè bộ ứng viên cũ hoặc nhập `shared/assets`. Trang duyệt: [index.html](index.html). Kết quả hiện có `s` và `se`; chưa có atlas mới cho `e/ne/n` trong đợt này.

## Phương pháp

Đã đọc lessons và `isolated/compose.mjs` trên nhánh `ao/lam-ngan-thao/1312-vu-khi`, SHA `a69b175b7790d9b8563a797543f95982ca701c86`. Áp dụng: model chỉ vẽ vũ khí riêng, atlas có pose thật, marker gốc để đăng ký, code chọn hình rồi xoay/dịch với một tỷ lệ chung, đo tay nam/nữ từ LPC, kiểm mép và khoảng cách tới grip. Không mang bài học uốn roi sang vật cứng.

Mỗi atlas 4×2 có tám hình: idle, walk, attack nâng/lấy đà/nện/thu, cast nâng/nện. Nhóm A có 13 khung mỗi hướng: idle 2 và walk 4 dùng pose tương ứng cộng nghiêng nhẹ; attack 4 chọn bốn hình khác thật; cast chọn hai hình khác thật; hurt dùng idle. Hai giới là 26 khung/hướng, nên `s/se` tổng 52 khung; không phải 44 khung của nhóm mềm B.

Idle/walk/hurt một tay thuận. Attack/cast hai tay; điểm bị che dùng fallback đã ghi theo quy tắc hiện hành. Không tạo, sửa hoặc thay pose LPC. Gốc nam đặt theo tọa độ `anim.grip` một chữ số thập phân, nữ đo trực tiếp từ khung LPC tương ứng, không chỉ dịch theo lưng nam.

Gốc là trọng tâm marker xanh `#00FF60`; marker được ghép với thành phần vũ khí liền gần nó, không cắt cứng theo ranh giới cột tưởng tượng. Đo trục cán bằng PCA gần gốc để tránh marker hơi lệch tâm làm tay B trôi. Code không bẻ/nội suy hình chùy hoặc đổi cỡ từng khung. Một tỷ lệ chung và một bảng màu 32 màu cho toàn bộ pose và hai giới. Hướng quay lưng dùng lớp sau; các hướng trước dùng lớp trước trong thử nghiệm.

Rà trước cả năm hướng đã phát hiện bộ lọc cũ bỏ tay nện nữ n đang nâng ngang lưng hoặc chỉ lộ mảng da nhỏ. Đã sửa riêng trường hợp cần hai tay ở attack/cast: nhận điểm tay thật ngang lưng; mảng nhỏ phải nằm rõ ra bên trục thân để tránh cổ áo. Test xác nhận điểm nữ n từ chính khung LPC hiện tại, không gương từ nam hoặc vẽ pose mới. Cách lọc lúc nghỉ giữ nguyên. Đây là sửa phép đo, không phải đổi thân/nộm.

## RAW và số lượt

- `s/attempt1`: atlas đủ hình nhưng thiếu marker ở bốn pose, bộ ghép từ chối, không đoán gốc.
- `s/attempt2`: đủ tám hình/marker, được chọn.
- `se/attempt1`: đủ tám hình/marker, được chọn.

Đợt atlas mới đã dùng 3 job (2 cho s, 1 cho se), mỗi lần một job. Cách đếm giới hạn “3 lượt ảnh thêm” cho cả đợt hay mỗi hướng đang được hỏi lại trước khi sinh tiếp e/ne/n. Không gọi model trong lệnh tái tạo.

RAW nguyên byte và prompt thực dùng ở mỗi thư mục lượt. Model/seed không được image_gen trả về, ghi unknown; điều khoản đầu ra OpenAI, không gán CC0. Chỉ dùng ảnh chùy riêng tự sinh trước đó làm tham chiếu thiết kế, không ảnh thương mại hoặc phụ thể cũ. Tờ có nộm trong `result` là ảnh **ghép code**, không phải RAW model. Thân LPC giữ nguồn/giấy phép hiện có ở art/CREDITS.md. Hash và nguồn chi tiết ở `source.json`.

## Kết quả hiện tại

Chạy [sources.json](sources.json) với `s/se`: **52 khung, 0 chạm mép**, cùng tỷ lệ `0.12387969164221649`. Khoảng cách từ điểm tay tới pixel vũ khí gần nhất: A tối đa **1,58 px**, B tối đa **1,20 px** (điểm ảnh game 128, không phải ảnh ô 256). Checker nam/nữ đều **0 chặn / 0 nhẹ**. Đây là khoảng cách raster sau khi bỏ marker, không phải tự dịch tọa độ tay bằng mắt.

`result/report.json` ghi số đo, tỷ lệ, bảng màu và kiểm chung. `result/<hướng>/compose-plan.json` ghi gốc/trục/vùng của từng pose, khung nguồn, tay nam/nữ, fallback và khoảng cách từng khung. Sheet/manifest có `dirsOk` chỉ s/se, không tuyên bố ba hướng còn lại đã có atlas mới. Preview mặc định của công cụ có ô trống cho hướng chưa làm; trang chính chỉ hiển thị hướng đã có.

Kiểm hình học chưa thay thế duyệt thẩm mỹ: cần xem độ rõ nâng → nện, cán dọc, góc nhìn và tay B thực sự nắm cán (phép đo B tới vùng hình chỉ là điều kiện tối thiểu). Không duyệt nhập game trong đợt này.

Xem ảnh tổng hợp nam s đã xác nhận **chưa đạt yêu cầu cán dọc**: căn trục cán theo cặp tay hiện tại làm cán nằm ngang trong attack/cast. Bốn hình đầu chùy khác nhau chưa đủ chứng minh chuyển động nện rõ. Vì vậy s chưa qua cửa duyệt mỹ thuật; se chỉ là phép đo thử mở rộng, không phải bàn giao hướng đã duyệt. Không sinh thêm ảnh để che lỗi hình học này.

## Tái tạo và kiểm

```sh
node tools/assets/phuthe-hammer-atlas-finalize.mjs --sources art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-atlas/sources.json --out art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-atlas/result
node --test tools/assets/phuthe-hammer-atlas.test.mjs
```

Bộ finalize chạy hai lượt code: đo tỷ lệ vừa khung cho mỗi atlas, lấy tỷ lệ nhỏ nhất và bảng màu chung, ghép lại rồi hợp sheet. Không gọi model và không sửa RAW. Test hồi quy dùng atlas thật: từ chối lượt thiếu marker, giữ byte RAW, đủ tám pose/bốn ảnh attack, 26 khung và đúng một/hai tay ở cả hai giới, không chạm mép và khoảng cách tay không quá 2 px.
