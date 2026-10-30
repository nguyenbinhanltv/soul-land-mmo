# Băng Phượng Hoàng — cung băng cầm tay (#1404)

Dòng 24 bảng 25 dạng, nhóm cứng. Chủ repo đã duyệt mỹ thuật vũ khí. Chỉ art và dữ liệu do importer sinh; canonical #1407 đã gộp trước khi sinh ảnh. Không tự merge.

## Nguồn và lịch sử

Codex / OpenAI image_gen tích hợp, model/seed không được công bố; đầu ra theo điều khoản công cụ, không gán CC0. Không dùng ảnh thương mại, phụ thể cũ hoặc gói ngoài làm ảnh dẫn. LPC trong QA/runtime giữ giấy phép từng lớp ở art/CREDITS.md; sheet vũ khí không chứa pixel LPC.

Bảy job tuần tự, mỗi atlas tám pose riêng không nộm. Chọn e1, s1, se2, ne2, n1. e1 và ne2 sinh từ chữ; s1/se1/ne1 tham chiếu e1 đã qua kiểm, se2 tham chiếu s1 đã qua kiểm, n1 tham chiếu ne2 đã qua kiểm. se1 bị loại vì quá giống góc đông; ne1 bị loại vì còn lộ mặt lông sáng và lõi phía trước. Không dùng hai lượt loại làm ảnh dẫn. RAW nguyên byte, prompt thật, SHA-256 và lịch sử ở `<hướng>/attemptN/source.json`; giữ đủ cả bảy lượt. 24 hash ảnh/prompt/tham chiếu/compositor đã đối chiếu khớp.

Hai cánh tinh thể lam băng, khung lam thẫm, nhấn trắng và lõi tím nhỏ ở mặt trước; mặt sau tối hơn. Tám pose: nghỉ, mang cung, bắt đầu đánh, kéo nửa, kéo đầy, buông, cast nửa và cast đầy. Dây thuộc ảnh pose, không có mũi tên hoặc FX nướng vào sheet. Nam/bắc hẹp hơn, se có cạnh dày, ne/n dùng mặt lưng; độ mở cánh và góc có biến thiên giữa pose.

## Ghép canonical và tái tạo

Khung 128, nhóm A 13 cột × 10 hàng, tỷ lệ 0,085 cố định mọi hướng/pose, 32 màu chung. Compositor art chỉ tách nền/marker RAW lục, nearest ở tâm và lấy mẫu phủ 4×4 trong footprint ô đích nếu tâm rỗng để giữ nét dây đã có, rồi dịch chuôi tới A, không xoay theo đường nối A→B, không sửa LPC. Trục nguồn đo từ tâm hai dải 5% ở đầu trên/dưới silhouette; điểm đo và góc từng pose giữ trong result/compose-report.json. Attack/cast ngoài dải dọc đã duyệt bị recipe chặn, không tự bỏ kiểm B.

Dùng nguyên gripPoints, dummy, checker/cutter trên main sau #1407. Idle/walk/hurt một tay; attack/cast yêu cầu hai tay khi đo được. Riêng n/attack/1,2 nam/nữ giữ một tay A hiện hữu đúng bước 1/2, không lấy cặp tay bước 0/3. Truyền góc đúng giới/hướng/khung cho canonical; giữ ngưỡng A≤2px, góc dọc≤15°, không đổi whitelist/ngưỡng trong PR art. Các khung dọc dùng ngoại lệ A đã được chủ repo duyệt, B không bắt buộc chạm dây. Báo cáo vẫn giữ secondaryRasterDistance: khoảng cách tới pixel bất kỳ của cung chỉ là số đo kiểm tra, không chứng minh tay B đang ở nock/dây.

Hai lớp trước/sau: ne/n mặc định sau, vùng chuôi quanh A ở trước. Dùng bảng nam/nữ riêng, giữ đúng hàng nữ sau cutter thay cho hàng ước lượng. Importer ghi manifest, không sửa tay anim.grip.

```sh
node art/src/phuthe-anim/bang_phuong_hoang/vukhi/compose.mjs --sources art/src/phuthe-anim/bang_phuong_hoang/vukhi/sources.json --out <tmp>
node tools/assets/phuthe-import.mjs --id bang_phuong_hoang --kind vukhi --dir <tmp>/import
node tools/assets/credits.mjs
```

## Kết quả và giới hạn

130 khung, A sau cutter tối đa 0,65px, không chạm lề 2px. 74 khung một grip (70 idle/walk/hurt và bốn n/attack), 56 khung hai grip. Cả 60 attack/cast đúng bước, không fallback. Hurt có 10 khung mượn bước 0 khi bước 1 bị áo che; khoảng cách tới grip đó không chứng minh đúng pose.

Canonical không chặn; mỗi giới còn bốn cảnh báo nhẹ co-phu-the do khác cỡ hình chiếu giữa hướng, nữ thêm một hurt-idle vì hình hurt gần idle. Cutter cả hai giới không chặn/cảnh báo, mỗi giới năm ghi chú hurt. Giữ nguyên chi tiết báo cáo, không xóa cảnh báo. Đường chéo hộp RAW sau thu nhỏ, trước cutter, ≤48,05px, dưới khoảng 1,4 lần thân tham chiếu thấp nhất 47px; đây không phải độ dài cán. Đường chéo hộp ảnh trên sheet sau cutter tối đa 51,87px, vẫn dưới mức tham chiếu trên.

**B có thể cách hình cung tới 40,6px ở khung dọc**, được miễn theo chính sách đã duyệt. Bộ này bám A canonical, chưa có pose thân riêng cầm cung tay trái/kéo dây tay phải; vẫn slash/spellcast LPC. Atlas có dây kéo/buông nhưng không bảo đảm hai tay đang kéo đúng dây/nock ở mọi khung. Chi tiết mặt cánh, dây và lõi có thể nhập cụm ở cỡ game; chưa chứng nhận mọi ngoại hình LPC. PR này không thêm tên băng, sương đông hoặc FX mới.

## Tự xem và kiểm thử

Đã tự xem RAW, QA, GameScene nam/nữ và trang thử trước khi mở PR. [Gallery 58 ảnh](ingame/index.html), [frame/texture và lỗi từng ảnh](ingame/capture.json): 50 GameScene (hai giới × năm hướng × attack 0/100/190/260ms và cast 360ms), 8 trang thử idle/walk/attack/cast. Bộ cuối đã chụp lại sau lấy mẫu phủ; dây kéo/buông liền nét hơn. Bắc 100/190ms nam dùng weapon frame59/60, nữ124/125, body107/108; đúng các bước1/2 tương ứng. Một phần cung ở ne/n bị thân che theo lớp sau.

Chrome --mute-audio và localStorage muted/master0 trước tải, 0 pageerror. Server RAM GAME_TEST=1; API/hook test có sẵn để tạo nhân vật/thức tỉnh/grant và chọn đội, gọi animatePlayer thật với mốc/bước thân cố định để kiểm renderer, không sửa client/server. Cờ pfx=0 vì kho gói riêng vắng mặt. Ảnh không cắt/resize/ghép, không sửa dây bằng hậu kỳ trên ảnh game. Tái chụp bằng capture.mjs.

Check/build và CI được ghi trong PR sau khi hoàn tất. Credits tests 4/4 đạt; không chạy bot riêng cho art thuần theo làn nhanh CONTRIBUTING.
