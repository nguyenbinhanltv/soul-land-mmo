# Pháp tướng Kỳ Nhung Thông Thiên Cúc (#1330)

Part of #1306, epic #1020. Chủ repo duyệt mẫu Lam Ngân Thảo #1326 rồi giao kiểm từng võ hồn trước khi vẽ tiếp. **Mẫu Kỳ Nhung này chưa được chủ repo duyệt.**

## Căn cứ vẽ lại

Đã xem `pt_ky_nhung_thong_thien_cuc` hiện tại và chạy công cụ chuyển thể từ vhanim ra thư mục tạm, so sánh thở / đỉnh đòn ở năm hướng, thử trong game. Bản chuyển thể có khối tối dạng bệ và dải ngang dưới đĩa hoa, không thành bộ rễ thật. Không nhập bản chuyển thể đó; đã khôi phục sheet gốc sau audit.

## Nguồn và lượt sinh

- Codex built-in `image_gen.imagegen`, ngày 2026-10-30; model / seed không được công cụ công bố.
- Tham chiếu motif, màu và hình ngoài: `shared/assets/sprites/vohonanim/ky_nhung_thong_thien_cuc_f.png`. Pháp tướng mới độc lập, đĩa hoa đặc, cánh dài như lưỡi kiếm, rễ đen xoắn; không nộm / khoảng rỗng hình người.
- STYLE / NEGATIVE / SPIRIT / SHEET theo `docs/art/phap-tuong-codex-ve-lai.md` và `vo-hon-phong-cach.md`. RAW nguyên byte, nền #FF00FF, không chữ, vuông 4×4; prompt cuối từng hướng, prompt gốc và SHA256 đi kèm.
- Một job mỗi lần. Số lượt s/se/e/ne/n = **1/2/2/2/1**. Đông nam, đông và đông bắc lượt đầu chạm mép; lượt 2 chỉ thu đồng đều toàn tờ, giữ thiết kế. Năm tờ được chọn đều qua kiểm mép ô.
- Hướng trước nhìn thấy nhụy vàng; hướng sau là đài hoa / lưng cánh màu đỏ đồng, không thấy nhụy. Đề nghị chủ repo đối chiếu góc đông nam với nam và nhịp giữ đỉnh đòn trong game.

## Ghép và hiển thị

Cutter dùng chung ở `tools/assets/phaptuong-sheet-cut.mjs` của #1326. Recipe ghim **blob nội dung** `e9189290c797aa640347b7a0229d745ab4f69075`, không ghim commit nhánh bị squash. Công cụ cần có trên main trước khi coi mẫu sẵn sàng tích hợp; sẽ kiểm tái tạo sau khi đồng bộ main.

Lệnh ghép: `node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/ky_nhung_thong_thien_cuc shared/assets/sprites/phaptuong/ky_nhung_thong_thien_cuc.png`.

Sheet 16×5 khung 160, gốc (80,124), 48 màu, alpha 0/255; chuẩn hóa viền tối #1a1020, chỉ gỡ ám nền sát mép, giữ bóng trong thân. Lớp glow dựng lại từ sheet mới bằng `buildGlow`, màu #ffb347. Hiển thị riêng: scale 1,6, dy −24, bob 2, đồng bộ bảng `PHAP_TUONG` và manifest; không đổi chỉ số chiến đấu.

## Kiểm

Đã kiểm đủ 80 khung không rỗng / không chạm mép và trần 48 màu khi ghép. Test pháp tướng client, `npm run check`, `npm run build` và bot RAM combo 34/34 đạt. Đã chụp năm hướng ngay trong `/choi?thu=phaptuong`, có linh thể hiển thị sau vai nhân vật.

Đã chạy `ui:check` trên năm RAW: bộ kiểm UI báo bảng màu RAW / ám hồng theo ngưỡng UI; đây không phải kết quả đạt cho tờ UI. Cutter pháp tướng xử lý khóa nền, ép 48 màu và kiểm toàn bộ 80 ô riêng. `phuthe:check` dành cho bố cục phụ thể có nộm, không hỗ trợ tờ pháp tướng độc lập 4×4 này.
