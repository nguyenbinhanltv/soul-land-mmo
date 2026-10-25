# Lịch sử lộ trình (đã xong)

<!-- Tách cơ học từ GAME_DESIGN.md (D1, #619): nguyên văn, chưa viết lại; số mục và tên mục con giữ nguyên. -->

**Giai đoạn 10: Đồ họa isometric** (quy cách mục 5.11; server không đổi; mỗi bước một PR). PixelLab không còn dùng tạo hình nhân vật từ 2026-10-23 (ngoại lệ 2026-10-24: xoay hướng, hoạt ảnh nhiều hướng, sheet hiệu ứng kỹ năng / pháp tướng, mục 5.11). Hoạt ảnh 8 hướng bằng ComfyUI / ControlNet đã dừng (#335 đóng, #387 đóng); hồn sư thay bằng LPC 4 hướng (#564), phụ thể là ảnh tĩnh 5 hướng ghép theo điểm neo, hồn thú là kiểu lai (ảnh tĩnh 3 hướng + chuyển động bằng code). Các bước 10.4b / 10.5 / 10.6 bên dưới đã xong hoặc được thay như ghi.

**Đã có:** quy cách isometric và phong cách A–D, bảng 10 vùng, bảng màu (10.0, 10.0b); client isometric: chiếu / chiếu ngược, camera 640×360 phóng số nguyên, sắp lớp theo độ sâu, khoét lỗ vật che, bóng và vòng hồn hoàn elip, điều khiển theo màn hình và chuột, `?view=topdown` (10.1); bộ ô và vật đứng của cả 10 bản đồ (ô nền Gemini, vật PixelLab cũ / Gemini / ComfyUI, nhà và tường thành dựng bằng code, cung uyển với công trình Gemini, lớp phủ mép; `tiles.json` kiểm trong `npm run check`) (10.2, 10.2b); dây chuyền `tools/assets` 8 hướng (10.3); hồn sư 64×64 bộ `m_0`, `f_0` (10.4a); phụ thể isometric Hạo Thiên Chùy, Cửu Tinh Thất Sát Kiếm, U Minh Linh Miêu, Lam Ngân Thảo (10.5a); giao diện thủy mặc, font pixel (Ark Pixel, từ UI-0 là Galmuri), thẻ võ hồn lưu ly, biểu tượng vật phẩm / trạng thái / hệ, chân dung NPC (10.8); ánh sáng Light2D và `ambient` ngày / đêm từng vùng, nguồn sáng hồn lực, thời tiết và hạt bay, normal map tự sinh, vòng hồn hoàn đồng tâm dưới chân, tự tắt khi không có GPU (10.7); NPC phụ, dân thường, lính gác bằng LPC; hồn thú kiểu lai (ảnh tĩnh 3 hướng + chuyển động bằng code) cho 67 / 67 loài, 2 boss thế giới 192×192 (10.6).

- [x] 10.4b 6 bộ hồn sư còn lại (#100, đóng): **thay bằng** hồn sư LPC 4 hướng, mọi bộ preset / sprite `hs_*` đã gỡ (HL1–HL4, #564: #570, #574, #588, #578); ControlNet 8 hướng dừng (#387).
- [x] 10.5 Phụ thể võ hồn còn lại: phụ thể tĩnh 5 hướng ghép theo điểm neo (#102); 25 / 25 võ hồn đã có ảnh thật (#342 / #383 vũ khí, #442, #447, #480, #481, #484 hư ảnh thú và thực vật, `vohon-static5.mjs`; Hỏa Long và Liệt Hỏa Thương Lang vẽ bằng code theo thân LPC: `lpc-mannequin.mjs`, `vohon-chi-tiet.mjs`, `vohon-multi.mjs`, ghép nhiều nhóm neo tay / đầu / lưng).
  - [x] 10.5b Bích Lân Xà Hoàng (#481), Cửu Bảo Lưu Ly Tháp (#383) có ảnh thật (#101). Phần "dây Lam Ngân quấn tay" và hướng riêng cho hư ảnh thú (nhìn nghiêng / quay lưng) **bỏ**: cần nhiều góc cùng một vật, ControlNet đã dừng; chuyển động phụ làm bằng code ở H7 (#490).
- [x] 10.6 Hồn thú và boss theo thứ tự bản đồ (Thánh Hồn Thôn, Tinh Đấu Ngoại vi, Nội địa, Lạc Nhật…); loài con dùng chung sprite loài lớn với hoán màu; thú vương 160×160, 2 boss thế giới 192×192 (#103). **Giải pháp lai (#386, người dùng chốt 2026-10-23):** ảnh tĩnh 3 hướng ComfyUI + chuyển động bằng code (mục 5.11 "Hồn thú lai"); xong Thánh Hồn Thôn (#386), Tinh Đấu Ngoại vi, Nội địa, Lạc Nhật Sâm Lâm, Cực Bắc Chi Địa và Hải Thần Đảo (#395); Xong cả 7 bản đồ có hồn thú: 67 / 67 loài là ảnh tĩnh hồn thú lai, 2 boss thế giới 192×192 làm tay (#451), không còn hình tạm LPC (#436, #444, #463, #466, #476); sheet 8 hướng + `walk` / `attack` thật **không làm** (thay bằng kiểu lai).
- [x] Thú LPC làm hình tạm cho các loài hồn thú chưa có sprite isometric (#105; 19 loài đầu, thêm 13 loài ở #201). Xong: mọi hình tạm LPC đã thay bằng hồn thú lai của 10.6 (Thánh Hồn Thôn #386, Hải Thần Đảo #395: Lôi Quang Hải Diêu và U Linh Hải Mẫu là hai hình tạm cuối); manifest không còn hồn thú nào có cờ `lpc` và vùng `lpc-beast` ở `art/CREDITS.md` rỗng.
- Ảnh tĩnh bằng ComfyUI (công cụ của orchestrator; skill `asset-gen` mục 10, #331), không tốn lượt PixelLab:
  - [x] Đặt 42 vật đã có ảnh nhưng chưa dùng vào bản đồ (#333, đóng 2026-10-22).
  - [x] Vật đặc trưng vùng còn thiếu, lô 1 (#337).
  - [x] Công trình Nặc Đinh Thành: nhà chính học viện sơ cấp, đấu hồn trường, tửu lâu (#336).
  - [x] Công trình điểm nhấn các vùng (#385): đền băng, lều thợ săn băng (Cực Bắc), miếu cổ, nhà hái thuốc (Lạc Nhật), trạm gác Vũ Hồn Điện (Tinh Đấu Ngoại vi), trại thợ săn (Nội địa), nhà ngư dân, tháp canh biển (Hải Thần Đảo); ảnh dẫn nhiều khối `comfy-shape.mjs`.
  - [x] Trọn bộ ô nền Lõi Tinh Đấu (#338): 7 ô riêng (cỏ, cỏ hoa, đất, sàn đá phiến có phù văn mờ, nước hồ gợn sáng, rêu phát quang, sỏi).
  - [x] Phụ thể tĩnh vũ khí / vật đối xứng (#342): Phá Hồn Thương, Thiên Càn Bạch Ngọc Đỉnh, Nguyệt Nhận, Xúc Xích, Càn Khôn Hỗn Nguyên Tỏa, Cửu Bảo Lưu Ly Tháp (ComfyUI, một ảnh tĩnh cho 5 hướng).
  - [x] Chân dung hồn thú ở khung mục tiêu: lô 1 Thánh Hồn Thôn, Tinh Đấu Ngoại vi kèm phần hiển thị (#339, xong), lô 2 Nội địa, Lạc Nhật (#340, xong), lô 3 Cực Bắc, Hải Thần, boss Lõi Tinh Đấu (#341, xong).
  - [x] Thử nghiệm hoạt ảnh 8 hướng bằng ComfyUI cho hồn sư, hồn thú, phụ thể hư ảnh thú (#335, đóng: không đạt; ControlNet dừng ở #387, **thay bằng** LPC cho hồn sư và kiểu lai cho hồn thú).

**Giai đoạn 11: Di chuyển, bản đồ lớn, truyền tống trận** (chủ repo chốt 2026-10-21; chi tiết và tiêu chí xong ở từng issue; số liệu đặt ở `shared/data.ts` khi làm).

**Đã có:** chạy / đi bộ theo giao chiến, hồn thú đuổi nhanh và bỏ về, bấm chuột tìm đường A*, bản vá state ngay sau mỗi nhịp, animation đi theo vận tốc (11.1); truyền tống trận (object `waypoint`, bảng `waypoints`), bản đồ thế giới thủy mặc, phí và niệm, Hồi Thành Phù (11.2); đồng bộ theo vùng gần, lưới không gian, hồn thú ngủ, bản đồ nhỏ qua tin `mini`, vẽ bản đồ theo khối (11.4); công cụ dựng bản đồ lớn `tools/maps` (bố cục, hạt giống, lớp chỉnh tay, ảnh toàn cảnh) và bản thử Tinh Đấu Ngoại vi ×8 (11.3); bản ×8 dựng bằng `tools/maps` là mặc định (đường lùi `MAP_V1`), Tinh Đấu Ngoại vi, Nội địa, Lạc Nhật Sâm Lâm, Cực Bắc Chi Địa, Hải Thần Đảo ×8 (11.5, phần 1); Thánh Hồn Thôn, Nặc Đinh Thành, Thiên Đấu Thành ×8 với nhà, tường thành, khu phố, công trình dựng bằng `tools/maps` (11.5, phần 2); Lõi Tinh Đấu và Đại Đấu Hồn Trường giữ cỡ, làm đẹp (11.5, phần 3); vị trí lưu kèm tên file bản đồ (`accounts.map_file`).

- [x] 11.1 Di chuyển: đo độ trễ, tốc độ đi / chạy mới, tốc độ lang thang / đuổi và giới hạn đuổi của hồn thú, bấm chuột tìm đường A*, animation khớp vận tốc (#106; mục 4 "Di chuyển", 5.3, 6 "Dự đoán chuyển động").
- [x] 11.2 Truyền tống trận (`waypoint` trong Tiled, mở khoá lưu DB, phí, niệm có thể bị ngắt, cấm khi giao chiến), bản đồ thế giới thủy mặc, Hồi Thành Phù (#107; mục 5.3 "Truyền tống trận").
- [x] 11.3 Công cụ dựng bản đồ lớn `tools/maps` và bản mẫu Tinh Đấu Ngoại vi gấp 8 lần diện tích để duyệt (#108; mục 5.3, 6 "Bản đồ lớn dựng bằng `tools/maps`").
- [x] 11.4 Hiệu năng bản đồ lớn: đồng bộ theo vùng gần, lưới không gian, hồn thú ngủ, vẽ theo khối (#109; mục 6 "Đồng bộ xuống client", "Hiển thị isometric phía client").
- [x] 11.5 Mở rộng và làm đẹp các bản đồ còn lại theo bản mẫu đã duyệt (#110; mục 5.3, 6 "Bản đồ lớn dựng bằng `tools/maps`").
- [x] Biểu tượng Hồi Thành Phù, rương, tiên thảo (`item_hoi_thanh_phu`, `item_ruong`, `item_tien_thao`; vật phẩm LPC, `tools/assets/lpc-item.mjs`) và quả nổ của tiên cơ Cường Công (`fx_no`) (#170, #201).

**Giai đoạn 12: Âm thanh**
- [x] 12.1 Nền tảng WebAudio client, bảng Âm thanh, 40 SFX ZzFX tự tạo, spatial audio theo khoảng cách, demo nghe thử và quy tắc phát theo event/state (#132).
- [x] 12.3 Nhạc nền tự sáng tác cho mọi bản đồ, bài giao chiến boss / thú vương, khúc ngắn theo sự kiện; tải lười, mờ chéo, hạ nhạc nền khi phát khúc ngắn (#134; mục 5.12 "Nhạc nền").
- [x] 12.5 Nhạc động + âm thanh lô 2 (G5): lớp giao chiến cùng nhịp cho mỗi bản đồ đánh nhau, boss pha 2 lên một nấc, stinger chí mạng lớn / hạ boss, môi trường lớp chồng, tiếng giao diện, tiếng + hàm phát cho PK (#396; mục 5.12).
- [x] 12.4 Âm thanh lô 1 (G2): kênh trộn (thêm Giao diện, Môi trường), biến thể cao độ / âm lượng, giới hạn và ưu tiên tiếng, hạ nhạc khi tiếng lớn, 105 clip CC0 (vũ khí, va chạm, 8 hệ, hồn hoàn, thú 8 họ, bước chân), trang `?thu=am` (#393).
- [x] 12.6 Hiệu ứng hồn kỹ theo hệ (G3): 8 hệ × 5 kiểu, bảng hiển thị mọi hồn kỹ, cảnh vòng 7+ / Chân Thân, trang `?thu=fx` (#394).

**Tự săn** (chủ repo chốt 2026-10-22: hiệu suất 100%, tối đa 12 giờ treo mỗi ngày; mục 5.13)
- [x] Auto 1: lõi tự săn online phía server, nút / phím bật tắt, chữ "Tự động" trên đầu, bảng `auto_hunt` (#155).
- [x] Auto 2: bảng Tự động, tổng kết khi dừng, Ủy Thác Lệnh, cột `auto_hunt.bonus_secs` (#156).
- [x] Auto 3: ủy thác offline nhận thưởng khi vào lại, chung quỹ giờ treo, bảng nhận thưởng, bảng `auto_offline` (#157).
- [x] Tự săn toàn bản đồ (mặc định), đường dài có điểm trung gian, lựa chọn "Chỉ quanh chỗ đứng" (#213).
- [x] Tự săn đánh cả tinh anh, thú vương, boss thế giới (mục tiêu chung, chỉ khi còn nhận được thưởng), né vùng báo trước / vùng độc, đổi võ hồn theo cơ chế boss, lùi khi ít máu, Cực Hàn tới Hỏa Đàn / thanh tẩy; bật được ở Lõi Tinh Đấu (#218).

**Việc để sau** (chưa có bước cụ thể; nhận việc thì tách thành bước nhỏ)
- [x] Nhiệm vụ hằng ngày ở Sử Lai Khắc Học Viện (Phất Lan Đức; dùng lại bảng `quests` với mã chuỗi mới, đặt lại theo ngày); chỉ đường / chấm nhiệm vụ trên bản đồ nhỏ (mục 5.8 "Nhiệm vụ hằng ngày").
- [x] #189 Chương 2 "Sử Lai Khắc Thất Quái": dữ liệu 9 bài, NPC Triệu Vô Cực, server nhiều chuỗi cố định, nhận / trả bài, sự kiện `elite` / `king` / `party`, bài bot đủ 9 bài; khung theo dõi, dấu "!" / "?", chỉ đường chung cho mọi chuỗi cố định (#190; mục 5.8).
- [x] #191 Chương 3 "Hải Thần Đảo": **phần 1 đã có** (#284: dữ liệu 8 bài, Hải Mã Đấu La ở Bến Hải Thần, Ba Tái Tây ở vùng an toàn Thánh địa Hải Thần, sự kiện lọc theo bản đồ, kiểu `world`, bài bot đủ 8 bài; mục 5.8); **phần 2 đã có** (#285: phần thưởng nhiệm vụ là hồn cốt, bài 8 thưởng hồn cốt Thâm Hải Ma Kình); **phần 3 đã có** (#286: bài 9 dung hợp kỹ, bài 10 tông môn nối vào cuối chuỗi, kiểu `fusion`, `tong`).
- [x] Thương nhân lưu động ở trại cổng bản đồ săn (#111; mục 5.7, 5.8).
- [x] Túi đồ chia trang, mở rộng theo trang, nút sắp xếp, gửi túi theo thay đổi; tài khoản cũ giữ số lần đã mở rộng (#215; mục 5.7, 6).
- [x] Tự bán từ xa khi túi gần đầy theo bộ lọc (100% giá trong thành, mặc định tắt), khoá món, mua lại `AUTO_SELL_BUYBACK` món tự bán ở thương nhân, tự săn bán thay vì dừng; cột `items.locked`, `accounts.auto_sell` / `auto_sold` (#216; mục 5.7, 5.13).
- [x] Vùng an toàn hồi sinh lực / hồn lực nhanh hơn ngoài rừng; chuyển các số hồi sinh lực đang viết thẳng trong `MapRoom.tick` vào `shared/data.ts` (#112; mục 4 "Hồi sinh lực và hồn lực").
- [x] #113 Đại Đấu Hồn Trường: **phase 1 đã có** hàng chờ tổ đội đúng 2 người, trận 2v2, Elo / thưởng riêng từng tài khoản và bốn cặp chống dàn xếp. **Phase 2a đã có** (#277): hệ số sát thương theo hệ, giảm hồi / khiên và khống chế, hiệu ứng bộ hồn hạch lên hồn sư. **Phase 2b đã có** (#279): hiệu ứng phụ trợ lan cho đồng đội cùng bên ở 2v2. **Phase 3a đã có** (#278): xem trực tiếp (server, phòng sân chỉ đọc). **Phase 3b đã có** (#280): giao diện xem trận.
- [x] Võ Hồn Dung Hợp Kỹ giữa hai hồn sư cùng tổ đội (#178): luật server, 5 cặp `FUSIONS` (4 cặp đầu #192, U Minh Bạch Hổ #194), bài bot đã có (#192); phím G, nút chạm, lời nhắc, hiệu ứng, ô hồi chiêu đã có (#193; mục 5.9). Võ hồn Bạch Hổ và cặp U Minh Bạch Hổ đã có (#194, phần gameplay; hình phụ thể tạm vẽ bằng code, ảnh thật ở #425).
- [x] Tổ đội: hiệu ứng bộ hồn hạch, kỹ năng hồn cốt và thanh tẩy cho đồng đội (#114): thanh tẩy không nhân hệ số; self-effect hồn cốt và Lưu Ly hỗ trợ theo bán kính / hệ số tổ đội, sát thương và trạng thái hồn thú không lan.
- [x] Chat tổ đội, tin riêng và kênh thế giới qua presence (#188): `/d`, `/t`, `/r`, `/tg`, tab ô chat; lọc chặn ở #195.
- [x] Chat tông `/tm` qua presence (#198): mọi thành viên cùng tông đang online, tab "Tông", chống spam riêng kênh.
- [x] Bạn bè và chặn (#195; mục 5.9 "Bạn bè", bảng `friends` / `blocks`): thêm một chiều, thấy online / vị trí khi hai bên đã thêm nhau, chặn lọc tin mọi kênh, lời mời tổ đội, lời thêm bạn.
- [x] Cộng minh: hiệu ứng chí mạng / giảm sát thương / tốc chạy, mốc theo sao võ hồn, bảng xếp hạng cộng minh không migration (#115).
- [x] Hồn thú: chỉ số thủ (Phá giáp / xuyên thủ giảm thủ thật); trạng thái Mê hoặc / Đóng băng riêng trên hồn sư; "đứng yên" cho Thực Nhân Hoa, Quỷ Đằng, Cổ Mộc Thụ Nhân (#116; mục 5.1, 5.3, 5.6).
- [x] Cơ chế đầy đủ của thú vương / tinh anh thay bản tối thiểu (#117): Lưỡng Nghi Luân Chuyển (#173), Thủy Triều Dâng (#174), Phun Mực (#175).
- [x] Hang chia phần luân phiên: nửa băng / nửa lửa (Lưỡng Nghi Luân Chuyển), tơ phủ 1/3 hang (Vạn Chu Phệ); tinh anh Song Sắc Mãng đổi băng / hỏa (#173; mục 5.3, 5.4).
- [x] Tinh anh Ma Chương Vương: Phun Mực che tầm nhìn, trạng thái hồn sư Che tầm nhìn (#175; mục 5.1, 5.3).
- [x] Hồn thú: vùng lưu lại trên mặt đất (vũng độc, sương độc), cơ chế dùng chung cho Lưỡng Nghi / Thủy Triều Dâng (#161; mục 5.3, 6).
- [x] Thú vương Thiên Độc Chu Hoàng: bọc trứng Vạn Chu Phệ phá được, không phá kịp thì nở nhện con (#162; mục 5.3, 5.4).
- [x] Thú vương Huyền Minh Băng Giao: tầng Hàn và Hỏa Đàn (Cực Hàn), trạng thái Hàn trên hồn sư (#163; mục 5.1, 5.3, 5.4).
- [x] Thú vương Thâm Hải Ma Kình Vương: vùng ngập luân phiên làm chậm (Ngập nước) và xoáy nước kéo người (Thủy Triều Dâng) (#174; mục 5.1, 5.3, 5.4).
- [x] Boss thế giới: chiêu toàn sàn né được, vị trí nổi lên của Du Thủy có báo trước, lặn ra giữa hồ (#118; mục 5.4 "Boss thế giới 100.000 năm").
- [x] Đóng góp boss theo tài khoản thay vì theo phiên (thoát vào lại / đổi kênh không mất đóng góp); giới hạn săn tinh anh nhiều kênh (#119; mục 5.4).
- [x] Chạy nhiều tiến trình: `RedisPresence`, chuyển số kênh, `kingSeats`, `kingWarns`, `eliteLocks`, hồi chiêu dung hợp kỹ `fusionReady`, hàng chờ đấu trường, sổ xem trận `arenaLive` (#278), tổ đội (kể cả tra tên cho tin riêng), hồi kênh thế giới, khóa đổi kênh, bạn bè / chặn sang presence; dọn phiên giữ tài khoản và mục của tiến trình chết; thử Redis thật: `test:presence-kill` (kill PID, TTL) và bot hai tiến trình `bot:local -- --procs 2` (#120); CI chạy cả hai ở job tùy chọn `presence-redis` với service Redis (#497).
- [x] Bot thử thêm: bán hồn hoàn đang hấp thụ, trận hòa và hết lượt thưởng đấu trường, ngắt kết nối khi đã ghép mà không rời bản đồ; thử giao diện bằng tay trên điện thoại thật (#121, đóng 2026-10-23; BOT_ONLY=issue121).
- [x] CI GitHub Actions chạy `npm run check` và `npm run build` cho mọi PR (#122).

**Giai đoạn 13: Trang bị hồn sư** (mục 5.15; theo dõi #410; **E0 chờ người dùng duyệt bảng số trước khi làm E1**; mỗi bước một PR, qua AO review và CI `bot-ram`).
- [x] E0 Chốt thiết kế: mục 5.15, bảng số và hàm thuần ở `shared/data.ts`, soát kinh tế `docs/trang-bi-kinh-te.md`, test `npm run test:equip --prefix server` (#411).
- [x] E1 Dữ liệu và mặc / tháo: SQL `server/sql/027_trang_bi.sql` (cột `equip_slot`, `ver`, chỉ mục duy nhất), `db.ts` (PgStore + MemoryStore), hook test `gear`, tin `equipgear` / `unequipgear` / `gear`, chỉ số vào `calcStats` + tin `stats`, may mắn và giảm sát thương vào chiến đấu, giao diện tối thiểu trong túi (nút Mặc, dải Đang mặc; đẹp ở E5 / #458); bài bot nhóm `bag` (#412).
- [x] E2 Rơi đồ 4 pha theo bậc hồn thú (thường / tinh anh rơi đất, thú vương / boss vào rương lúc mở), Đá Cường Hóa rơi, Monte Carlo (#413): `rollEquipGround` / `chestEquip` / `addEquip` (`MapRoom.ts`), hook test `edrop`, bài bot `equipDropTest` (nhóm `bag`), Monte Carlo so với `docs/trang-bi-kinh-te.md` mục 2 trong `npm run test:equip --prefix server`.
- [x] E3 Thợ rèn cường hóa +15 theo bảng rủi ro, Bùa Hộ Mệnh, chuỗi lưu / transaction / `ver`, bài bot dồn 20 lệnh một lúc (#414).
- [x] E4 Hợp thành 3 → 1, phân giải hàng loạt, Tự bán / tự phân giải tùy chọn (#415).
- [x] E5 Giao diện: tab trang bị ở bảng nhân vật (NV4 #458), nhóm lọc trong túi, ba trang Thợ rèn có biểu tượng, hiệu ứng và âm thanh (#416).
- [x] E6 Biểu tượng trang bị, khung theo bậc (#417): đủ 76/76 khóa `equipIconKeys()` (60 mẫu, 10 hình ô, 6 khung), làm tay bằng ChatGPT, nhập bằng `tools/assets/equip-import.mjs` (bậc Chí Bảo: ảnh nền trắng, `--key #ffffff`).
- [x] E7 Cân bằng (#418): giả lập theo thời gian `npm run sim:equip --prefix server` (`server/scripts/equip-sim.ts`: rơi → mặc → hợp thành → cường hóa → phân giải, Hồn Tệ vào / ra, sức mạnh đấu trường), chạy dài `npm run bot:local -- --only equipsoak --env PERF_LOG=1` (bài `equipSoak`, không chạy trong bot đầy đủ); kết quả và núm chỉnh ở `docs/trang-bi-kinh-te.md` mục E7; **không đổi số**.
- [x] Khóa Redis `lock:item:<id>` khi bật nhiều tiến trình (cùng việc #120): #559.

**Giai đoạn 14: Giao diện Nhân vật + Túi** (mục 5.16; theo dõi #453; chỉ client; mỗi bước một PR; **NV0 cần chủ repo duyệt bố cục trước khi làm NV1**).
- [x] NV0 Thiết kế chi tiết: mục 5.16, bản phác HTML `docs/art/ban-phac-nhan-vat-tui/`, hợp đồng `client/src/charBagContract.ts` + `npm run test:charbag --prefix client` (#454).
- [x] NV1 `DualWindowManager`: mở cả hai, phím B / C, nút ⇆, lớp, bố cục đáp ứng; bỏ đóng chéo Nhân vật / Túi (#455).
- [x] NV2 Búp bê 4 tab; gắn / tháo hồn cốt, hồn hạch ngay trong bảng; tab Võ hồn (đội, ra trận, vòng) (#456).
- [x] NV3 Kéo thả, bấm đúp mặc thông minh, thẻ thao tác nhanh, so sánh hai cột (#457).
- [x] NV4 Tab Trang bị 10 ô dùng `equipgear` / `unequipgear` (thay phần giao diện bảng nhân vật của E5 #416; cần E1 #412, đã xong) (#458).
- [x] NV5 Hoàn thiện: điện thoại thật / màn hẹp, phím tắt, bot kiểm lệnh gắn / tháo, ảnh trước / sau, đo FPS khi kéo (#459).
**Nhóm Bản đồ khu vực: radar, bản đồ và sương mù** (mục 5.17; theo dõi #426; mỗi bước một PR).
- [x] R0 Hằng `RADAR` / `MAPVIEW` / `FOG` / `RADAR_ART`, hàm thuần `shared/radar.ts`, test `npm run test:radar --prefix server` (#427).
- [x] R7 Ảnh khung / la bàn / nền giấy (#434, PR #472).
- [x] R2 Radar tròn góc màn hình thay bản đồ nhỏ (`client/src/radar.ts`, #429; nút Vùng N chờ R3, #430).
- [x] R1 Ảnh nền thủy mặc sinh bằng `tools/maps` (#428, PR #473).
- [x] R3 Bản đồ khu vực phím N, nhãn, bộ lọc, kéo / phóng / chụm (`client/src/mapview.ts`, #430; đặt cờ để R4).
- [x] R4 Tự đi tới cờ xuyên bản đồ qua cổng thật, dừng khi bị đánh / tự di chuyển / kẹt (`client/src/autowalk.ts`, `shared/autowalk.ts`, #431).
- [x] R5 Lọc tin `mini` theo bán kính (#432).
- [x] R6 Đánh dấu tổ đội "Tập trung ở đây": chuột phải / chạm giữ, server kiểm và chuyển tiếp qua presence, radar + bản đồ khu vực + mặt đất, bấm dấu để tự đi (#433).
- [x] R8 Sương mù khám phá, SQL `031_map_fog.sql` (#435).

**Nhóm Hình thái Võ Hồn Chân Thân: pháp tướng** (mục 5.18; theo dõi #482; mỗi bước một PR).
- [x] H0 Bảng đặc tả 25 võ hồn và prompt PixelLab (#483, PR #492, `docs/art/phap-tuong.md`).
- [x] H1 Ảnh pháp tướng Lam Điện Bá Vương Long + Hạo Thiên Chùy, công thức chuẩn (#485, PR #499, `docs/art/phap-tuong-cong-thuc.md`).
- [x] H2 Khung code dùng chung (#486, PR #505, mục 5.18): bảng `PHAP_TUONG`, lớp sau / trước thân, vòng thở và động tác đánh có dừng hình, chuỗi biến hình và tan, tiến hóa theo vòng, cut-in, hai pháp tướng, mức hiệu ứng; đã nối ảnh thật H1, 23 võ hồn còn lại dùng hình tạm bằng code tới khi ảnh vào manifest. H3 (#487): lô P4 xong (7 khí võ hồn, PR #513); lô P1 xong (4 sinh vật Hỏa Long, Tà Hỏa Phượng Hoàng, Băng Phượng Hoàng, Kim Vũ Miêu Ưng, PR #528); lô P2 xong (5 thú U Minh Linh Miêu, Nhu Cốt Thỏ, Yêu Hồ, Liệt Hỏa Thương Lang, Bạch Hổ, PR #531); lô P3 xong (Tử Vong Chu Hoàng, Bích Lân Xà Hoàng, Quỷ Mị, Hỏa Ảnh): đủ 25 / 25 ảnh pháp tướng; còn lại là hiệu ứng riêng tuyệt kỹ / hồn kỹ Chân Thân, hoàn thiện (xem #482).

**Nhóm Hình ảnh kỹ năng combat** (theo dõi #541; chỉ hình ảnh và cảm giác đánh, giữ số và cơ chế; mỗi bước một PR).
- **Chủ sở hữu họ asset C1–C16:** **Codex (tthoadev)**; C1 pilot gồm tia / mảnh va chạm, trạng thái bám thân, bụi / vệt / sóng đất và số sát thương; các bước C2–C6 chỉ mở sau khi chủ repo duyệt preview C1.
- [x] S0 Bảng đặc tả 25 võ hồn × 11 chiêu, ô Võ Hồn Chân Thân ở vòng 7 (#541, `docs/art/ky-nang-combat-dac-ta.md`).
- [x] S1 Khung code `SKILL_VISUAL` + cảm giác đánh (#542, PR #546, mục 5.11).
- [x] S2 Thử trọn bộ 11 chiêu Lam Điện Bá Vương Long + Hạo Thiên Chùy, công thức chuẩn (#548, `docs/art/ky-nang-cong-thuc.md`, mục 5.11).
- [x] S3 lô A: 7 khí võ hồn (Cửu Tinh Thất Sát Kiếm, Nguyệt Nhận, Càn Khôn Hỗn Nguyên Tỏa, Xúc Xích, Thiên Càn Bạch Ngọc Đỉnh, Cửu Bảo Lưu Ly Tháp, Phá Hồn Thương) + dung hợp Yêu Nguyệt (#566, PR #583).
- [x] S3 lô B 6 thú võ hồn (U Minh Linh Miêu, Nhu Cốt Thố, Kim Vũ Miêu Ưng, Yêu Hồ, Liệt Hỏa Thương Lang, Bạch Hổ) × 11 chiêu + dung hợp Hạo Thiên Nhu Cốt, U Minh Bạch Hổ: 68 sheet (#567, `tools/assets/skill-vfx/lo-b.json`, `FUSION_VISUAL`).
- [x] S3 lô C 5 võ hồn (Tà Hỏa Phượng Hoàng, Hỏa Long, Hỏa Ảnh, Quỷ Mị, Băng Phượng Hoàng) × 11 chiêu + dung hợp Băng Hỏa Lưỡng Nghi: 56 sheet (#568, `tools/assets/skill-vfx/lo-c.json`, `FUSION_VISUAL`).
- [x] S3 lô D: 5 võ hồn thực vật / độc (Kỳ Nhung Thông Thiên Cúc, Tử Vong Chu Hoàng, Bích Lân Xà Hoàng, Lam Ngân Thảo, A Ngân) × 11 chiêu + dung hợp Lôi Độc Song Sát: 56 sheet (#569, `tools/assets/skill-vfx/lo-d.json`, `FUSION_VISUAL`).
- [x] S5 Hoàn thiện (H8 #491, mục 5.11): FPS 40–60 người, tự hạ mức hiệu ứng, Giảm chuyển động / điện thoại ngang, âm thanh T3, kiểm tung mọi chiêu (`docs/tech/hieu-nang-hieu-ung.md`).
- [x] H7 Chuyển động phụ của phụ thể bằng code (#490, mục 5.11): cánh vỗ, đuôi vẫy, vũ khí lắc / vung, vật bay bồng bềnh, hư ảnh thở, giật khi đánh; 7 họ × 4 trạng thái, theo mức hiệu ứng + Giảm chuyển động, đo 40 người.
- [x] S3–S5 các võ hồn còn lại: **không còn võ hồn nào**, S2 + lô A–D phủ đủ 25 / 25; hoàn thiện là S5 ở trên (#541 đóng).

**Nhóm Hồn sư tự tạo bằng LPC** (mục 5.11; theo dõi #507; chạy song song chế độ Mẫu dựng sẵn; mỗi bước một PR).
- [x] L0 Mẫu thử và danh mục 115 món, chủ repo duyệt 4 hướng (không sửa repo).
- [x] L1 Danh mục `LPC_PARTS` + công cụ đóng gói sheet + ghi công (`tools/assets/lpc-parts.mjs`, #508).
- [x] L2 Server: `Looks.mode` (`preset` mặc định / `lpc`), `parseLooks` kiểm theo danh mục, SQL, đồng bộ gọn, bot hợp lệ / bất hợp lệ (#509, kế hoạch #507).
- [x] L3 Client: bộ ghép lớp lúc chạy, tô màu, đệm texture, ánh xạ hoạt ảnh / hướng, phụ thể theo hướng mới (#510, kế hoạch #507).
- [x] L4 Màn tạo nhân vật hai chế độ (Mẫu dựng sẵn / Tự tạo): chọn món / màu, ngẫu nhiên, xoay 4 hướng, xem đi / đánh / thi triển, điện thoại ngang; luật đổi ngoại hình qua thợ may (lần đầu miễn phí, sau đó tốn Hồn Tệ) (#511, kế hoạch #507).
- [x] HL1 Mẫu dựng sẵn bằng LPC: `LPC_PRESETS` + màn lưới bộ / chỉnh màu + nút "Bắt đầu từ mẫu" (#565, nhóm #564; HL2 chuyển tài khoản preset cũ, HL3 gỡ đường vẽ preset, HL4 áo / mũ theo trang bị còn lại).
- [x] HL2 Chuyển tài khoản preset cũ sang LPC lúc nạp: `presetToLpc`, ghi `looks_lpc` có điều kiện, không tính lượt thợ may; `/api/looks` và thợ may đổi preset từ client cũ sang LPC (#571, nhóm #564).
- [x] HL3 Hồn sư chỉ còn LPC: NPC chưa có sheet dựng LPC từ `looks`, dữ liệu preset sót đổi bằng `presetToLpc`, gỡ sprite / lớp áo-tóc / đường vẽ preset và 24 key `hs_*` khỏi client (#572, nhóm #564; client giảm 720 KB ảnh trong `client/dist`; 41 người cùng màn Nặc Đinh Thành trên Chrome GPU vẫn ~102 khung / giây như trước).
- [x] HL4 Áo / mũ trang bị hiện lên lớp LPC: `LPC_GEAR`, `gearAo` / `gearMu` công khai, Ẩn mũ (#573, nhóm #564; đồng phục theo phe / lớp phương Đông C3 #554).
- [x] L5 Trang bị hiện lên người: **thay bằng** HL4 (áo / mũ trang bị lên lớp LPC, #573, PR #578); các ô khác chưa hiện lên người.
- [x] L6 Hoàn thiện: đo FPS 41 người trên Chrome GPU ở HL3 (#572, PR #588) và FPS 40–60 người ở H8 (#590); bot LPC đủ ở L2 / HL2; #507 đóng.

