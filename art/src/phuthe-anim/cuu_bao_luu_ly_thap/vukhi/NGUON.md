# Cửu Bảo Lưu Ly Tháp — vũ khí cầm tay (#1399)

Dòng20 bảng25 dạng, nhóm cứng, vật bưng một tay. Chủ repo đã duyệt mỹ thuật vũ khí; không tự merge.

## Điểm lệch đã được cho phép

**Bộ nhập có tám tầng/mái rõ thay vì chín tầng; bệ và chóp không tính là tầng.** Ba job đông ban đầu cho7/7/8mái rõ. Điều phối soul_land_game-815 cho thêm tối đa3job đông với sơ đồ9tầng tự dựng và chấp nhận8nếu vẫn thiếu. e4/e5/e6 vẫn8mái, chọn e4 vì mái cong/chuông rõ hơn; không ghép/vẽ thêm tầng bằng code hoặc nới checker. Bốn hướng còn lại theo cùng thiết kế tám tầng.

## Nguồn

- Codex/OpenAI image_gen tích hợp, model/seed không được công bố; đầu ra theo điều khoản công cụ, không gán CC0. Không có ảnh thương mại, phụ thể cũ hoặc gói ngoài làm ảnh dẫn.
- `e/attempt1..6`: đủ RAW nguyên byte, prompt thật, source.json với SHA-256 và lý do lượt loại. e1/e2 bảy mái, e3 tám mái; e4 được chọn sau ba lượt bổ sung. `references/guide.mjs` chỉ dựng sơ đồ ảnh dẫn chín mái, không tạo/sửa ảnh vũ khí nhập game; PNG/hash giữ cùng nguồn. e4–e6 dùng sơ đồ này; các hướng sau dùng e4 đã qua checker làm ảnh dẫn.
- Phần ghép giữ nguyên pixel LPC. Nếu có LPC trong QA/runtime, giữ giấy phép lớp nguồn ở art/CREDITS.md. Source.json từng atlas ghi hash RAW/prompt/ảnh dẫn/compositor; không dùng ảnh đã loại làm ảnh dẫn.

## Ghép và tái tạo

NhómA, khung128,8pose/atlas,13cột×10hàng. Tỷ lệ0,06 cố định mọi pose/hướng; bảng32màu. Tách nền/marker RAW lục, nearest và đặt đáy tháp tại grip tay thuận đo bằng count1 đúng giới/bước; cast/1 dùng castRaised canonical. Không dùng thuật toán cán chùy cho vật bưng. Checker/cutter dùng nguyên công cụ chung; không bản sao/vá checker hoặc ngoại lệ mới. Sau cắt đo lại A≤2px, không chạm lề2px. Hướng ne/n mặc định sau, vùng đáy quanh tay trước; nữ ghép từ bảng đo nữ riêng.

```sh
node art/src/phuthe-anim/cuu_bao_luu_ly_thap/vukhi/compose.mjs --sources art/src/phuthe-anim/cuu_bao_luu_ly_thap/vukhi/sources.json --out <tmp>
node tools/assets/phuthe-import.mjs --id cuu_bao_luu_ly_thap --kind vukhi --dir <tmp>/import
node tools/assets/credits.mjs
```

## Giới hạn

Ngoài điểm lệch8thay9tầng, chuông/kinh văn và màu mái nhập cụm ở cỡ game. Pose nghiêng/nâng atlas được ghép trên slash/spellcast LPC, chưa có động tác bàn tay ngửa riêng, đập ấn xuống đất hoặc bảo quang tầng sáng lần lượt bằng code. Không bake tia bảy sắc/aura để che thiếu hiệu ứng. Hurt có thể phải dùng bước lân cận khi áo che tay; báo cáo giữ nguyên thay vì coi gần grip là bằng chứng đúng pose.

## Kiểm

Đủ5hướng,130khung. Canonical PASS cả hai giới; cutter0chặn/0cảnh báo,5ghi chú mỗi giới do hurt dùng bước0 khi bước1 bị che. A sau cắt≤1,24px,0mép; cast/1 đủ10ca đúng bước2/fallback:false. Đúng32màu, không còn marker lục,32hash từ10job nguồn khớp. Mái/chuông và góc cast có biến thiên; cast se/ne có pose gần chính diện hơn, chi tiết nhập cụm ở cỡ game.

Đã tự xem RAW, QA và GameScene thật trước mở PR. [Gallery48ảnh](ingame/index.html), [trạng thái từng ảnh](ingame/capture.json):40GameScene (2giới×5hướng×cast0/100/360ms và attack190ms),8trang thử idle/walk/attack/cast. Chrome --mute-audio, localStorage muted/master0 trước tải;0pageerror. Server RAM GAME_TEST=1, đăng nhập/tạo ngoại hình/thức tỉnh qua API có sẵn, grant võ hồn bằng hook test và chọn đội hình, gọi animatePlayer thật với mốc/bước thân giữ cố định; không sửa repo client/server. Đây là kiểm renderer, không phải toàn bộ trận giao chiến. Cảnh vật có thể che phần tháp; ảnh không cắt/resize/ghép. Tái chụp bằng capture.mjs; dùng cờ pfx=0 vì kho gói riêng không có ở worktree.

Check/build và CI được ghi trong PR sau khi kết thúc kiểm tra; không chạy bot riêng cho art thuần theo làn nhanh CONTRIBUTING.
