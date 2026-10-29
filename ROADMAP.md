# Lộ trình

<!-- Tách cơ học từ GAME_DESIGN.md (D1, #619): nguyên văn, chưa viết lại; số mục và tên mục con giữ nguyên. -->

## 7. Lộ trình
Mỗi gạch đầu dòng là một lần giao việc; dòng chưa làm trỏ tới issue GitHub (`#số`), nhận việc theo `CONTRIBUTING.md`. Xong một bước thì chạy `npm run check` và bot, cập nhật mục thiết kế tương ứng rồi bỏ dòng `[ ]` và thêm vài chữ vào đoạn "Đã có" của giai đoạn (còn phần dở thì giữ dòng, ghi "Còn: …").

**Đã có** (Giai đoạn 2–9, nhóm Bản đồ BĐ1–BĐ6, ảnh nền búp bê NV6 gắn vào giao diện ở C16 #595, nhãn trên đầu C9 #593, biểu tượng + con trỏ C12 #598): mọi luật mô tả ở mục 4–5 và kiến trúc mục 6, trừ các việc còn ghi dưới đây.

- [x] C8 Thanh kỹ năng tách nhóm, hồi chiêu dạng quạt, trạng thái rõ; thẻ đội hình rút gọn tên theo từ và tooltip đầy đủ (#594).
- [ ] Giao diện và cảm giác dùng họ asset C1–C16 do Codex (tthoadev) làm, còn mở: C10 hộp thoại NPC + cửa hàng lưới (#596), C11 nhiệm vụ (#597), C13 phản hồi giao diện (#599; đã làm theo UI gốc: toast / chip lệnh / banner / tooltip, chữ bay khi nhận, tiếng giao diện CC0), C14 khả năng tiếp cận (#600), C15 màn chết / bảng kết quả / Bạn bè (#601).
- [ ] Asset ngoài: kho riêng tư, nhập gói itch, MCP `asset-scout`, biểu tượng game-icons (#622, theo dõi).
- [ ] Tối ưu tài liệu (#619, theo dõi D0–D8).
- [ ] Tách `MapRoom.ts` theo miền, từng PR nhỏ, hàm thuần trước (#702, theo dõi; đã xong nhiều bước, xem issue).
- [ ] Tách `bot-test.mjs` thành module theo nhóm (#703, theo dõi; đã tách `bot/lib.mjs`, `bot/google.mjs`).
- [ ] UI gốc (kit Mực + Giấy; #877, #885, #886; luật ở `docs/art/ui-kit.md`, `docs/design/giao-dien.md`): đợt 5c-a đã gỡ cờ `ui2` / `?ui=` khỏi mã; còn **`body.ui2` thành nền (5c-b) và gỡ luật cũ khỏi `style.css` (5b)**, đổi tên `ui2-*` nếu cần; icon pilot #884; chuyển nốt màn còn lại (Tự động / Ủy thác offline, cột chỉ số trái, thanh kỹ năng, mục hub "Chưa có").
- [ ] Bảng Xếp Hạng nhiều hạng mục (#877, `docs/design/xep-hang.md`): X0 thiết kế xong; X1–X2 server Cấp / Sưu tầm + tin `rank` xong; còn X3 Sức mạnh, X4 màn client xong (`rankScreen.ts`), X5 soát chống gian lận, X6 Thợ săn tuần / Boss thế giới.
- [ ] Phúc Lợi / Sổ Điểm Danh 21 ngày (#877, `docs/design/phuc-loi.md`): P0 thiết kế xong; P1–P3 server (`CHECKIN`, `038_phuc_loi.sql`, tin `welfare`, bot nhóm `welfare`) xong; P4 màn client xong (`welfareScreen.ts`); P5 soát chống gian lận + bảng trần quà xong (`docs/tech/soat-gian-lan-phuc-loi.md`); chấm đỏ hub tính thêm mốc ký bù được.
- [ ] Bí Cảnh, phương án B, MVP Luyện Hồn Cảnh solo (#877, `docs/design/bi-canh.md`): P0 thiết kế xong; P1 `BICANH` + `bicanhDay` (làm mới 05:00), P2 tin `bicanh` `get` / `buy` + lượt (không cần SQL mới) và P4 Hồn Kinh Quyển (dùng cho võ hồn dự bị, kẹp bình cảnh) xong, P3 `BiCanhRoom` (server: `enter`, ba sóng + tinh anh, thưởng quyển theo sóng, trần quyển ngày, hoàn lượt khi lỗi; dùng tạm sân đấu làm bản đồ) xong, bot nhóm `bicanh`; P5 màn client xong (`bicanhScreen.ts`: danh sách + mua lượt, HUD sóng, bảng kết quả); còn bản đồ Tiled riêng + ảnh poster, P6 soát chống gian lận + `balance-review` + `soak-perf`; các phụ bản sau (Cực Hạn, Đột Phá, Luyện Khí, tổ đội, Tư Chất) xếp sau MVP.
- [ ] Hoạt ảnh hồn thú v2 (#861, theo dõi) và H4 vẽ thật 64 loài (#766); sổ tự sinh ở comment ghim #766 (`npm run beast:status`, không commit).
- [ ] Phụ thể võ hồn v2: vẽ mới + hoạt ảnh 5 hướng (#1020, epic; bảng ở `docs/art/phu-the-hoat-anh.md`). P0 đặc tả #1021 xong; P1 công cụ `phuthe-sheet-*` #1022 xong (PR #1067); còn P2 client phát clip, P3 thử 3 võ hồn, P4 gộp, P5 dọn `spiritMotion`.
- [ ] Nghiên cứu UI/UX giao diện thích ứng (#732, U0–U5; U2 #755 tách chat khỏi log loot / XP, gộp toast xong ở đợt 1c; U6 điện thoại không làm, giữ Q40).
- [ ] Cân bằng chờ chủ repo (mức C): #907, #908, #909 (xem `docs/quyet-dinh.md`, "Việc đang chờ").

Áo hồn sư kiểu khác (đồng phục Sử Lai Khắc, áo Vũ Hồn Điện) đã xong: lớp trang phục phương Đông C3 (#554, PR #576); lịch sử ở `docs/lich-su.md`.

## 8. Câu hỏi còn mở
1. **Ngân sách mỹ thuật isometric:** hồn sư, hồn thú và phần lớn phụ thể đã chốt (LPC, kiểu lai, ảnh tĩnh 5 hướng); không còn việc tạo hình nhân vật nào mở; xoay hướng và hoạt ảnh nhiều hướng được dùng PixelLab (mục 5.11 và 5.18).
2. **Trần số người khi tính máu boss:** hiện không có trần (nhóm bạn bè ít người); xem lại nếu phòng đông làm boss quá trâu.
3. **Chủ nhân và tên hồn kỹ trong truyện** của Kim Vũ Miêu Ưng, Càn Khôn Hỗn Nguyên Tỏa, Hỏa Ảnh, Thiên Càn Bạch Ngọc Đỉnh, Phá Hồn Thương, Liệt Hỏa Thương Lang: để trống / đặt tạm cho tới khi có nguồn chắc chắn.
