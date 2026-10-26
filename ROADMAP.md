# Lộ trình

<!-- Tách cơ học từ GAME_DESIGN.md (D1, #619): nguyên văn, chưa viết lại; số mục và tên mục con giữ nguyên. -->

## 7. Lộ trình
Mỗi gạch đầu dòng là một lần giao việc; dòng chưa làm trỏ tới issue GitHub (`#số`), nhận việc theo `CONTRIBUTING.md`. Xong một bước thì chạy `npm run check` và bot, cập nhật mục thiết kế tương ứng rồi bỏ dòng `[ ]` và thêm vài chữ vào đoạn "Đã có" của giai đoạn (còn phần dở thì giữ dòng, ghi "Còn: …").

**Đã có** (Giai đoạn 2–9 và nhóm Bản đồ BĐ1–BĐ6): mọi luật mô tả ở mục 4–5 và kiến trúc mục 6, trừ các việc còn ghi dưới đây.

- [ ] NV6 Ảnh nền búp bê (hình hồn sư mờ, lục giác hồn cốt, vòng đan điền): ảnh nền đã có (C2 #553, PR #577); còn gắn vào giao diện, thợ rèn, thông báo lên cấp / hồn hoàn hiếm ở C16 #595; giữ bản vẽ bằng code tới lúc đó.
- [ ] Giao diện và cảm giác dùng họ asset C1–C16 do Codex (tthoadev) làm, còn mở: C8 thanh kỹ năng + ô đội hình (#594), C9 nhãn trên đầu + dấu nhiệm vụ (#593), C10 hộp thoại NPC + cửa hàng lưới (#596), C11 nhiệm vụ (#597), C12 bộ biểu tượng + con trỏ (#598), C13 phản hồi giao diện (#599), C14 khả năng tiếp cận (#600), C15 màn chết / bảng kết quả / Bạn bè (#601).
- [ ] Asset ngoài: kho riêng tư, nhập gói itch, MCP `asset-scout`, biểu tượng game-icons (#622, theo dõi).
- [ ] Tối ưu tài liệu (#619, theo dõi D0–D8).
- [ ] Tách `MapRoom.ts` theo miền, từng PR nhỏ, hàm thuần trước (#702, theo dõi; đã xong nhiều bước, xem issue).
- [ ] Tách `bot-test.mjs` thành module theo nhóm (#703, theo dõi; đã tách `bot/lib.mjs`, `bot/google.mjs`).
- [ ] UI Kit v2 hướng B, P0–P8 (#877, theo dõi; P0–P2 xong, còn P3 #881 … P8 #886; bảng ở `docs/art/ui-kit.md`).
- [ ] Hoạt ảnh hồn thú v2 (#861, theo dõi) và H4 vẽ thật 64 loài (#766); sổ tự sinh `art/src/beast-anim/_status.md`.
- [ ] Nghiên cứu UI/UX giao diện thích ứng (#732, U0–U5; U6 điện thoại không làm, giữ Q40).
- [ ] Cân bằng chờ chủ repo (mức C): #907, #908, #909 (xem `docs/quyet-dinh.md`, "Việc đang chờ").

Áo hồn sư kiểu khác (đồng phục Sử Lai Khắc, áo Vũ Hồn Điện) đã xong: lớp trang phục phương Đông C3 (#554, PR #576); lịch sử ở `docs/lich-su.md`.

## 8. Câu hỏi còn mở
1. **Ngân sách mỹ thuật isometric:** hồn sư, hồn thú và phần lớn phụ thể đã chốt (LPC, kiểu lai, ảnh tĩnh 5 hướng); không còn việc tạo hình nhân vật nào mở; xoay hướng và hoạt ảnh nhiều hướng được dùng PixelLab (mục 5.11 và 5.18).
2. **Trần số người khi tính máu boss:** hiện không có trần (nhóm bạn bè ít người); xem lại nếu phòng đông làm boss quá trâu.
3. **Chủ nhân và tên hồn kỹ trong truyện** của Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa, Hỏa Ảnh, Thiên Càn Bạch Ngọc Đỉnh, Phá Hồn Thương, Liệt Hỏa Thương Lang: để trống / đặt tạm cho tới khi có nguồn chắc chắn.
