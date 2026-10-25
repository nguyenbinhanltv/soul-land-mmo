# Địa điểm và NPC

Địa điểm, trại cổng, thương nhân lưu động, NPC theo bản đồ và luật NPC. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`); `NPCS` là nguồn danh sách NPC. Số issue ở cuối file.


## 5.8 Địa điểm và NPC

### Trại cổng và an toàn
Thành và làng Thánh Hồn Thôn là nơi an toàn (mục 4). Mỗi bản đồ săn có **trại nhỏ ở cổng vào** (object `spawn`) làm điểm hồi sinh; trại cổng **không phải vùng an toàn** (vẫn giao chiến được), nhưng trong `SPAWN_CLEAR` pixel quanh trại, quanh mọi cổng và điểm `arrive` không sinh hồn thú (lớn hơn tầm lang thang + tầm phát hiện), để người vừa tới / vừa hồi sinh / đang niệm cổng không bị đánh.

### Thương nhân lưu động
- **Thương nhân lưu động** (mọi bản đồ săn có trại cổng; Thánh Hồn Thôn không có vì `spawn` là quảng trường làng trong vùng `safe`): mua / bán cơ bản không cần về thành (mục 5.7). Không đặt bằng object `npc` trong Tiled: chỗ đứng tính từ file Tiled bằng hàm dùng chung `campMerchantSpot` (`shared/camp.ts`, server và client cùng gọi): điểm đứng được, cách cổng / truyền tống trận `CAMP_GAP` và cách điểm `arrive` / NPC khác `CAMP_PT_GAP`; ưu tiên điểm cách một điểm `arrive` không quá `NPC_RANGE` − `CAMP_STEP` (người vừa tới nói chuyện được ngay, lệch vài bước vẫn trong tầm), rồi điểm gần tâm trại nhất. Bản đồ săn có trại cổng mà không đặt được thương nhân thì server cảnh báo khi nạp bản đồ. Vẽ như NPC khác (dựng thân LPC từ `looks`).

### NPC theo bản đồ
- **Thánh Hồn Thôn:** **Tố Vân Đào** (chấp sự Vũ Hồn Điện; lễ thức tỉnh chạy qua `POST /api/awaken` trước khi vào phòng, trong làng là NPC giải thích võ hồn, bình cảnh, đội hình), **Lão Kiệt Khắc** (trưởng thôn, chỉ đường bãi săn và cổng đi Nặc Đinh Thành).
- **Nặc Đinh Thành:** **Ngọc Tiểu Cương (Đại Sư)** ở Học viện Nặc Đinh (giải thích giới hạn hồn hoàn theo vòng, cấp đề xuất từng bản đồ; giao nhiệm vụ tân thủ), **Thương nhân**, **Thợ rèn** (bảng cường hóa hồn cốt, nâng cấp và đổi bộ hồn hạch), **Thợ may Nặc Đinh** (đổi ngoại hình, mục 5.11), **Sứ giả Đại Đấu Hồn Trường** (chỉ đường lên Thiên Đấu Thành), cổng bắc đi Thiên Đấu Thành.
- **Thiên Đấu Thành** (thủ đô, tường thành, sông phía đông, quảng trường đài phun nước là điểm hồi sinh): biển **Đại Đấu Hồn Trường** trước cửa đấu trường ở góc đông nam (vai trò `arena`, mục 5.9), **Phất Lan Đức** (viện trưởng Sử Lai Khắc Học Viện; ra khảo hạch hằng ngày), **Chưởng quỹ · Thương hội Thiên Đấu** và **Thợ rèn Thiên Đấu** (cùng cửa hàng / lò rèn như Nặc Đinh; riêng Chưởng quỹ còn đổi mảnh võ hồn, mục 5.7), **Thợ may Thiên Đấu** (cùng luật đổi ngoại hình như Nặc Đinh, mục 5.11), **bốn sứ giả tông môn** (mục 5.14), Hoàng cung (trang trí). Cổng nam về Nặc Đinh Thành, cổng tây đi Lạc Nhật Sâm Lâm, cổng bắc đi Cực Bắc Chi Địa, bến thuyền đi Hải Thần Đảo.
- **Hải Thần Đảo:** **Hải Mã Đấu La** (Thánh Trụ Đấu La; giao nhiệm vụ chương 3) ở trại Bến Hải Thần cạnh thương nhân lưu động, trong vùng `safe` nhỏ "Bến Hải Thần" chỉ quanh chỗ đứng của NPC (phần còn lại của trại vẫn giao chiến được, mục 5.8; NPC đứng trong vùng an toàn như luật NPC), **Ba Tái Tây** (Đại Cung Phụng) trong Thánh địa Hải Thần trước đền Hải Thần.
### Luật NPC
- **Luật NPC:** NPC là object `npc` trong Tiled, thuộc tính `npc` là mã trong `NPCS` (tên, chức danh, vai trò `talk` / `shop` / `forge` / `arena` / `tong` / `looks`, ngoại hình, lời thoại; mã lạ hoặc trùng thì server cảnh báo và bỏ). Vẽ bằng sheet NPC LPC `lpc_<mã>` (mục 5.11 "NPC phụ và dân thường"), chưa có sheet thì dựng thân LPC từ `looks`; đứng yên nhìn xuống, tên và chức danh trên đầu. Đứng trong `NPC_RANGE` thì hiện "Nói chuyện [F]"; bấm F, bấm / chạm NPC hoặc nút để mở hộp thoại (lời thoại từng câu "Tiếp ›", đi xa thì tự đóng, Esc đóng). Server kiểm tra khoảng cách mỗi lần (`talk`, `buy`, `sell`, `quest`, `arena`…).

## Lịch sử / issue liên quan
- Nhật ký từng bước: `docs/lich-su.md`.
