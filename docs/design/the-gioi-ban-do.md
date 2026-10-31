# Thế giới nhiều bản đồ

Bản đồ, cổng, truyền tống, quy cấp theo niên hạn, vùng và hồn thú từng bản đồ săn. Luật hồn thú, tinh anh, thú vương, boss: `docs/design/hon-thu-boss.md`. Phòng và kênh phía server: `docs/tech/phong-ban-do.md`. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`).

## 5.3 Thế giới nhiều bản đồ và hồn thú

### Bản đồ và loại bản đồ
Thế giới gồm nhiều bản đồ nối bằng **cổng**.
- Mỗi bản đồ là một file Tiled riêng (`shared/assets/<mapId>.json`, sinh bằng `tools/gen-map.mjs`). Bản đồ lớn dựng bằng `tools/maps` từ bố cục `tools/maps/layouts/<mapId>.json` ra `<mapId>.v2.json`, là bản mặc định.
- Mỗi bản đồ là một loại phòng trên server; mỗi phòng là một kênh (mục 6).
- Loại bản đồ (`MapDef.kind`):
  - **Thành (`town`):** cả bản đồ an toàn, không hồn thú (Nặc Đinh Thành, Thiên Đấu Thành).
  - **Bản đồ săn (`hunt`):** 3–4 vùng, càng sâu hồn thú càng già và mạnh; có thể chứa vùng an toàn `safe` (làng Thánh Hồn Thôn).
  - **Bản đồ boss (`boss`):** Lõi Tinh Đấu, chỉ có boss thế giới.
  - **Sân đấu (`arena`):** sân Đại Đấu Hồn Trường, chỉ `ArenaRoom` mở, không cổng nào dẫn tới.

### Danh sách bản đồ
`MAPS`: cấp đề xuất `level`, khoảng niên hạn `years`, mảnh võ hồn `shards`, bộ hồn hạch `cores`, thú vương `king`. Tài khoản mới bắt đầu ở Thánh Hồn Thôn (`DEFAULT_MAP`).

**Cỡ bản đồ:** bản đồ săn và thành trấn lớn (cỡ ở file bố cục / `MAPS`, không chép số ở đây). Số hồn thú thường theo mật độ `BEAST_DENSITY` nhân diện tích đi được. Mỗi tầng niên hạn chia vài vùng có tên; mỗi bản đồ một sắc riêng (mục 5.11 B) và một điểm nhấn. Đại Đấu Hồn Trường và Lõi Tinh Đấu giữ cỡ hợp lối chơi.

| Bản đồ (`mapId`) | Loại | Đặc điểm | Nối với |
|---|---|---|---|
| Thánh Hồn Thôn (`thanh_hon_thon`) | Săn | Quê Đường Tam; làng giữa bản đồ là vùng `safe` (hàng rào gỗ, nhà mái rạ, quảng trường); ruộng lúa có bờ ở Đồng lúa, sân đất và giá binh khí ở Bãi tập, rừng rậm, vách đá, cổ thụ, miếu đổ ở Hậu Sơn; không có thú vương | Nặc Đinh Thành |
| Nặc Đinh Thành (`nac_dinh_thanh`) | Thành | Tường thành gạch ba cổng, đại lộ chữ thập, quảng trường đài phun nước; Đại Sư ở Học viện Nặc Đinh, chợ lều (thương nhân), lò rèn, trạm sứ giả; khu nhà dân | Thánh Hồn Thôn, Ngoại vi, Thiên Đấu Thành |
| Tinh Đấu Ngoại vi (`tinh_dau_ngoai_vi`) | Săn | Bìa Tinh Đấu Đại Sâm Lâm | Nặc Đinh Thành, Nội địa |
| Tinh Đấu Nội địa (`tinh_dau_noi_dia`) | Săn | Rừng sâu, đầm độc (Thất Tinh Đàm), hẻm Lôi Cốc vách đôi với Lôi Đài tinh thể tím, Hắc Ám Lâm; hồ trung tâm ở mép đông | Ngoại vi, Lõi Tinh Đấu (bến bờ hồ cuối Hắc Ám Lâm) |
| Thiên Đấu Thành (`thien_dau_thanh`) | Thành | Thủ đô: tường thành đá trắng, sông phía đông có bến thuyền, đại lộ lưu ly, quảng trường đài phun nước; Hoàng cung Thiên Đấu và vườn, Đại Đấu Hồn Trường, Sử Lai Khắc Học Viện và sân tập, thương hội, lò rèn; vườn anh đào, khu nhà | Nặc Đinh Thành (cổng nam), Lạc Nhật (cổng tây), Cực Bắc (cổng bắc), Hải Thần Đảo (bến thuyền) |
| Lạc Nhật Sâm Lâm (`lac_nhat_sam_lam`) | Săn | Thực vật, độc, đầm Bích Lân; băng nguyên và nham cháy ở Băng Hỏa Tuyền; suối đôi Băng Hỏa Lưỡng Nghi Nhãn (hồ băng cạnh hồ lửa); rơi tiên thảo | Thiên Đấu Thành |
| Cực Bắc Chi Địa (`cuc_bac_chi_dia`) | Săn | Băng tuyết; trại cổng ở mép nam, càng lên bắc càng sâu: hồ băng, khe băng có cầu băng, thung lũng vách băng, băng điện cổ, vực băng và Băng Tủy Thụ | Thiên Đấu Thành |
| Hải Thần Đảo / Ma Quỷ Hải Vực (`hai_than_dao`) | Săn | Đảo giữa biển sâu, cầu tàu ở bờ tây; rạn nông có đường đá nối các bãi; đền Hải Thần với tượng đinh ba trên Vách Hải Thần, sân trước đền là vùng `safe` **Thánh địa Hải Thần** (không hồn thú, không giao chiến; tự săn đi vòng); trại Bến Hải Thần có vùng `safe` nhỏ quanh Hải Mã Đấu La; hồn thú biển; nơi duy nhất có hồn thú thường 10 vạn năm | Thiên Đấu Thành (bến thuyền) |
| Lõi Tinh Đấu (`loi_tinh_dau`) | Boss | Hồ trung tâm Tinh Đấu Đại Sâm Lâm: Hồ Sinh Mệnh phát sáng (rìa nước nông có sen, rêu phát quang quanh bờ), sàn đấu boss thế giới lát đá giữa vòng cột tinh thể, cổ thụ phát quang | Nội địa |
| Đại Đấu Hồn Trường (`dai_dau_hon_truong`) | Sân đấu | Sân nhỏ cho một trận 1v1 hoặc 2v2 (`ARENA_MAP`): khán đài hai phía, sàn đá có huy hiệu giữa sân cát, cột cờ, lò lửa, sư tử vàng | – |
| Luyện Hồn Cảnh (`luyen_hon_canh`) | Phòng riêng (`arena`) | Bí Cảnh theo kịch bản sóng; không đi cổng, không lưu vị trí như bản đồ thế giới | – |

Tranh nền và tọa độ lớp phủ của bản đồ thế giới M: [bàn giao mỹ thuật](../art/ban-do-the-gioi.md). Danh sách / mã trận và cổng trong JSON được đối chiếu từ `MAPS` và Tiled mặc định, không suy tuyến từ tranh.

## Cổng và truyền tống

### Cổng và chặn mềm
- Cổng là object `portal` trong Tiled: bản đồ đích, điểm xuất hiện `arrive` ở bản đồ đích, cấp đề xuất `level`. Điểm `arrive` phải nằm ngoài mọi vùng `portal` của bản đồ đích.
- Bước vào cổng thì hiện hộp "Đi tới *…* (đề xuất cấp …)". Cấp võ hồn ra trận dưới mức tối thiểu thì thêm **cảnh báo đỏ** nhưng vẫn đi được (**chặn mềm**). Cổng giữa hai thành không có cấp đề xuất.
- Đi cổng niệm `TRAVEL_CAST` giây. **Bến thuyền** (cổng có thuộc tính `boat`, Thiên Đấu Thành ↔ Hải Thần Đảo) "đi thuyền" `BOAT_CAST` giây, hộp ghi "Đi thuyền tới …" và nút "Lên thuyền".
- Bị đánh hoặc bước ra khỏi cổng thì hủy. Đang niệm vẫn đánh được (đánh thường, hồn kỹ, Chân Thân, kỹ năng hồn cốt; không hủy niệm) nhưng không bắt đầu hấp thụ được.
- **Server kiểm tra:** đang đứng trong cổng, cổng thuộc bản đồ hiện tại, bản đồ đích có trong `MAPS`, không gục, không hấp thụ. Client chỉ gửi tên cổng, **không bao giờ tự chọn bản đồ** hay tọa độ đích. Thứ tự lưu khi đi cổng: `docs/tech/luu-tru-cong-phien.md` (mục 6).

### Truyền tống trận
Object `waypoint`, mỗi bản đồ trừ sân đấu có 1–3 trận (thành, trại cổng, giữa bản đồ săn); cổng nối bản đồ kề nhau vẫn giữ.
- **Mở khóa:** bước lên trận lần đầu thì mở khóa cho tài khoản (lưu DB), có thông báo. Trận vẽ bằng code (vòng phù văn phát sáng lam ngọc theo phong cách A, chưa mở thì xám), chấm lam trên radar.
- **Bản đồ thế giới** (chế độ Thế giới của bản đồ lớn: phím M, nút Bản đồ, hoặc F khi đứng trên trận; hiển thị ở `docs/design/ban-do-khu-vuc.md` mục "Bản đồ thế giới"): tranh thủy mặc có nút bản đồ / trận vẽ đè và nét nối theo cổng; chọn bản đồ hoặc trận thì thấy cấp đề xuất, trận đã mở / chưa mở và phí. Không đứng trên trận thì vẫn chọn được trận đã mở để dịch chuyển từ xa (ghi phụ phí và thời gian hồi còn lại).
- **Dịch chuyển:** chọn trận đích **đã mở khóa** của tài khoản (khác trận đang đứng): niệm `WAYPOINT_CAST` giây (thanh niệm, cột sáng ai cũng thấy). Di chuyển hoặc bị đánh thì hủy, không mất gì. Dùng được **từ bất kỳ đâu** (chủ repo duyệt 2026-10-31), hai chế độ:
  - **Đứng trên một trận:** phí `waypointFee` theo số lần đi cổng ít nhất giữa hai bản đồ (cùng bản đồ: mức `WAYPOINT_FEE.base`), trừ lúc dịch chuyển; **không bị hồi**.
  - **Không đứng trên trận (từ xa):** phí như trên **cộng phụ phí** `WAYPOINT_FEE.remote` (`waypointFee(hops, true)`), và **hồi** `WAYPOINT_COOLDOWN_S` giây giữa hai lần từ xa (tính từ lúc dịch chuyển xong; hủy niệm không tính hồi; giữ theo tài khoản, không mất khi đổi bản đồ hay thoát vào lại). Đứng lên trận thì dùng ngay, không bị hồi. Phụ phí đặt cao hơn Hồi Thành Phù (30 đồng, chỉ về thành) để không làm phù vô dụng, nhưng chỉ ngang vài lần hạ hồn thú bậc giữa (`BEAST_COIN`) nên không chặn người chơi cần di chuyển nhanh.
  - Không dùng khi đang giao chiến, gục, đang hấp thụ, đang đi cổng, bị khống chế; trong Đại Đấu Hồn Trường, Bí Cảnh / Luyện Hồn Cảnh và phòng riêng bị chặn. Riêng từ xa còn bị chặn khi **đang tự săn / ủy thác treo** (tắt tự săn trước).
  - **Lõi Tinh Đấu (bản đồ `kind: "boss"`) cấm dịch chuyển** (chủ repo 2026-10-31): đứng trên trận hay từ xa đều bị chặn, cả lúc bắt đầu niệm lẫn lúc niệm xong, báo "cấm truyền tống: muốn rời đi hãy tới cổng"; rời Lõi chỉ bằng cổng. Chỉ cấm **ở trong**: trận Trại cổng Lõi Tinh Đấu vẫn là đích hợp lệ khi đã mở khóa (mở bằng cách bước lên trận, như mọi trận).
  - Trận đích chưa mở khóa thì từ chối (phải tới bước lên trận một lần). Server kiểm mọi điều kiện, client chỉ gửi trận muốn tới.
  - Cùng bản đồ thì đặt thẳng vị trí; bản đồ khác thì đi đúng transaction đi cổng (mục 6), nên an toàn khi trong tổ đội và lưu đúng thứ tự. Lưu lỗi thì trả lại phí và xóa thời gian hồi. Giao thức: `docs/tech/giao-thuc-server.md`.
- **Hồi Thành Phù** (vật phẩm, thương nhân bán): dùng trong túi thì niệm như truyền tống (cùng luật cấm / hủy, kể cả cấm ở Lõi Tinh Đấu vì chung cơ chế niệm `recallDeny`; hủy thì giữ phù) rồi về **thành gần nhất** (thành ít lần đi cổng nhất, xuất hiện ở truyền tống trận của thành), mất một phù.
- Quanh trận không sinh hồn thú (`SPAWN_CLEAR`, như quanh cổng).

### Vị trí khi đăng xuất và vào lại
- Vị trí và bản đồ đang đứng được lưu kèm tên file Tiled lúc lưu; vào lại ở đúng chỗ cũ.
- Về `spawn` nếu kẹt trong ô chặn, ngoài bản đồ, hoặc file đang dùng khác file lúc lưu (ví dụ lưu ở bản cũ rồi bản ×8 thành mặc định).
- Mã bản đồ cũ đã bỏ được ánh xạ sang bản đồ thay thế qua `MAP_MOVED`.
- **Lõi Tinh Đấu:** đăng xuất ở đây (rời phòng không qua cổng / đổi kênh) thì lần sau vào ở bến bờ hồ Nội địa (`MapDef.exit`).

## Quy cấp theo niên hạn
- **Cấp tương đương** của hồn thú là cấp nhỏ nhất mà võ hồn hấp thụ được hồn hoàn của nó trong giới hạn (`beastLevel`, tính từ `RING_LIMIT`; vòng k hấp thụ ở cấp 10×k).
- Mỗi bản đồ săn nhắm khoảng cấp mà niên hạn hồn thú khớp giới hạn **vòng kế tiếp**; vùng sâu nhất vượt giới hạn một chút cho người muốn liều. Khoảng cấp các bản đồ kế nhau chồng lên nhau.
- **Giảm kinh nghiệm khi săn hồn thú quá yếu** (`XP_LEVEL_STEPS`, `xpLevelScale`):
  - So cấp võ hồn ra trận (tính tối đa `XP_LEVEL_CAP`, vì vòng 8–10 cùng giới hạn nên không hồn thú nào có cấp tương đương cao hơn) với cấp tương đương; thấp hơn càng nhiều thì kinh nghiệm càng ít.
  - Giảm một lần trước khi chia cho đội võ hồn; tổ đội thì mỗi người tự giảm theo cấp của mình.
  - **Chỉ giảm kinh nghiệm**, đồ vẫn rơi bình thường. Hồn thú mạnh hơn không cho thêm kinh nghiệm.

## Vùng và hồn thú của từng bản đồ săn

### Vùng
- Vùng là object `zone` trong Tiled: loài (`beasts`, kèm trọng số), niên hạn (`years`), số con (`count`), gợi ý (`hint`).
- Mỗi vùng săn có đúng 1 tinh anh (object `elite`, mã trong `BOSSES`).
- Bản đồ lớn dựng bằng `tools/maps`: mỗi tầng niên hạn chia thành vài vùng có tên (cùng niên hạn, trọng số loài riêng), mỗi tầng 1 tinh anh, số con theo mật độ `BEAST_DENSITY` × ô đi được.
- Mỗi bản đồ săn trừ Thánh Hồn Thôn có 1 tà hóa thú vương trong hang (object `boss`) ở vùng sâu nhất.
- Tên hồn thú chưa có trong truyện được đặt theo phong cách Đấu La.
- Tinh anh, thú vương, boss thế giới không có loài riêng thì **mượn loài gốc** trong `BEASTS` (chỉ số, sprite, hồn cốt).
- Lõi Tinh Đấu có một vùng "Hồ trung tâm" không sinh hồn thú thường.

### Vùng và thú vương theo bản đồ
Vùng liệt kê từ nông tới sâu. Bản ×8 (bản đồ lớn) thêm các vùng ghi "bản ×8".

| Bản đồ | Vùng (nông → sâu) | Tà hóa thú vương |
|---|---|---|
| Thánh Hồn Thôn | Đồng lúa ven làng, Bãi tập hồn sư, Hậu Sơn | – |
| Tinh Đấu Ngoại vi | Bìa rừng, Rừng thưa, Khe suối, Rìa nội địa (bản ×8 thêm Đồi Phong Lang, Phế Tích Hồn Sư, Vách Đá Rêu, Lang Cốc) | Huyết Nguyệt Lang Vương (gọi bầy sói; GĐ2 Huyết Cuồng: đánh dấu một người rồi lao xuyên) |
| Tinh Đấu Nội địa | Rừng cổ thụ, Đầm sương độc, Lôi Cốc, Hắc Ám Lâm (bản ×8 thêm Lang Lâm U Minh, Thất Tinh Đàm, Lôi Đài Thạch, Thiên Độc Cốc) | Thiên Độc Chu Hoàng (lưới tơ Trói, mưa kim độc; GĐ2 Vạn Chu Phệ: đẻ bọc trứng phá được, không phá kịp thì nở nhện con; tơ phủ lần lượt 1/3 hang) |
| Lạc Nhật Sâm Lâm | Rừng hoa độc, Đầm Bích Lân, Băng Hỏa Tuyền, Lưỡng Nghi Nhãn (bản ×8 thêm Hoa Cốc Mạn Đà, Lân Quang Trạch, Hỏa Diễm Nham, Cổ Đằng Lâm) | Lưỡng Nghi Thủ Hộ Xà (hơi thở băng / lửa; GĐ2 Lưỡng Nghi Luân Chuyển: hang chia nửa băng, nửa lửa, luân phiên một nửa hóa; đứng nhầm nửa băng thì Đóng băng, nửa lửa thì Thiêu đốt nặng) |
| Cực Bắc Chi Địa | Tuyết nguyên, Băng hà nứt, Băng Phong Cốc, Cực Bắc Băng Uyên (bản ×8 thêm Tuyết Lang Nguyên, Vạn Liệt Băng Hà, Hàn Nguyệt Nhai, Huyền Minh Băng Động) | Huyền Minh Băng Giao (vệt băng cắt ngang hang, mưa băng; GĐ2 Cực Hàn: người tham gia trong hang tích tầng Hàn, đủ tầng thì đóng băng, Hỏa Đàn / thanh tẩy xả tầng; bão băng làm chậm) |
| Hải Thần Đảo | Bãi san hô, Ma Quỷ Hải Vực, Vách Hải Thần, Hải Thần Uyên (bản ×8 thêm Ghềnh Cự Giải, Rạn Lôi Quang, Hải Thần Điện) | Thâm Hải Ma Kình Vương (gầm Choáng, hút người về giữa; GĐ2 Thủy Triều Dâng: vùng ngập luân phiên trong hang làm chậm (Ngập nước), xoáy nước giữa vùng ngập kéo người về tâm) |

### Hồn thú 10 vạn năm
- Mỗi kênh của một bản đồ có tối đa 1 hồn thú **thường** đúng `MAX_YEARS` năm cùng lúc.
- Chỉ vùng có mức trên `years` = `MAX_YEARS` (Hải Thần Uyên) sinh được; mỗi lần sinh có `RED_BEAST_CHANCE` ra đúng 10 vạn năm nếu kênh chưa có con nào.
- Tinh anh, thú vương, boss thế giới và hồn thú do chúng gọi ra không tính.

## Rơi đặc trưng theo bản đồ
- Mỗi bản đồ săn rơi mảnh của 2–4 võ hồn riêng (`MapDef.shards`, mỗi lần chọn đều một võ hồn trong danh sách) và hồn hạch phần lớn thuộc bộ đặc trưng (`MapDef.cores`, `CORE_MAP_SET`).
- **Tiên thảo** (chỉ Lạc Nhật Sâm Lâm, mục 5.7): mỗi con hồn thú hạ ở đây có tỉ lệ theo **tên vùng** (`MapDef.herbs`, vùng càng sâu càng cao; vùng có tên thêm ở bản ×8 cùng tỉ lệ với tầng của nó), tinh anh nhân `HERB_ELITE`, thú vương không rơi (chỉ có rương). Một cây ngẫu nhiên trong 3 loại vào thẳng túi người hạ.
- **Rương tà hóa thú vương** (`KING_CHEST`, `kingShardPool`): mảnh của bản đồ đó (trọng số cao nhất) hoặc Tà Hỏa Phượng Hoàng; một hồn hạch sao cao nhất theo niên hạn thú vương, bộ theo bản đồ; có thể có hồn cốt loài gốc. Danh sách `every` (võ hồn chỉ có ở rương) để trống, giữ cơ chế cho võ hồn sau.
- **Mảnh UR** chỉ có trong rương boss thế giới (`WORLD_CHEST`); rương thú vương không rơi mảnh UR (`KING_CHEST.ur` = 0).
- Thưởng thắng Đại Đấu Hồn Trường có mảnh mọi võ hồn SR / SSR trừ Lam Ngân Thảo (`ARENA_SHARDS`).

## Lịch sử / issue liên quan
- Bản đồ cỡ lớn (bản ×8, dựng bằng `tools/maps`): giai đoạn 11.5. Mã `tinh_dau` cũ chuyển sang `tinh_dau_ngoai_vi` từ BĐ3. Mảnh UR chuyển sang rương boss thế giới từ BĐ6.
- Nhật ký từng bước: `docs/lich-su.md`.
