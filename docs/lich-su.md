# Lịch sử lộ trình (đã xong)

<!-- D3 (#619): rút gọn từ bản đầy đủ; giữ mốc chính, số issue / PR gom ở cuối file. Chi tiết từng bước xem `git log` và issue. Luật hiện hành nằm ở GAME_DESIGN.md và docs/design/; việc còn mở ở ROADMAP.md; quyết định của chủ repo ở docs/quyet-dinh.md. -->

**Giai đoạn 10: Đồ họa isometric** (quy cách mục 5.11).

**Đã có:** quy cách isometric, bảng 10 vùng, bảng màu (10.0); client isometric: chiếu / chiếu ngược, camera 640×360, sắp lớp theo độ sâu, khoét lỗ vật che, bóng, `?view=topdown` (10.1); bộ ô và vật đứng của cả 10 bản đồ, nhà và tường thành dựng bằng code (10.2); dây chuyền `tools/assets` (10.3); giao diện thủy mặc, font pixel, thẻ võ hồn, biểu tượng, chân dung NPC (10.8); ánh sáng Light2D, `ambient` ngày / đêm, thời tiết, normal map tự sinh, tự tắt khi không có GPU (10.7); NPC phụ, dân thường, lính gác bằng LPC.

- [x] 10.4b Hồn sư: **thay bằng** hồn sư LPC 4 hướng, mọi bộ preset `hs_*` đã gỡ; hoạt ảnh 8 hướng bằng ControlNet dừng.
- [x] 10.5 Phụ thể võ hồn: ảnh tĩnh 5 hướng ghép theo điểm neo, 25 / 25 võ hồn có ảnh thật; chuyển động phụ làm bằng code (H7). Phần "dây Lam Ngân quấn tay" và hướng riêng cho hư ảnh thú bỏ.
- [x] 10.6 Hồn thú và boss: **kiểu lai** (ảnh tĩnh 3 hướng bằng ComfyUI + chuyển động bằng code), 67 / 67 loài, thú vương 160×160, 2 boss thế giới 192×192; sheet 8 hướng không làm. Mọi hình tạm LPC đã thay hết.
- [x] Ảnh tĩnh bằng ComfyUI: đặt vật chưa dùng vào bản đồ, vật đặc trưng vùng, công trình Nặc Đinh Thành và điểm nhấn các vùng, trọn bộ ô nền Lõi Tinh Đấu, phụ thể tĩnh vũ khí, chân dung hồn thú ở khung mục tiêu (ba lô); thử hoạt ảnh 8 hướng không đạt.

**Giai đoạn 11: Di chuyển, bản đồ lớn, truyền tống trận** (chủ repo chốt 2026-10-21).

**Đã có:** chạy / đi bộ theo giao chiến, hồn thú đuổi nhanh và bỏ về, bấm chuột tìm đường A*, bản vá state ngay sau mỗi nhịp (11.1); truyền tống trận, bản đồ thế giới thủy mặc, Hồi Thành Phù (11.2); công cụ dựng bản đồ lớn `tools/maps` và bản thử ×8 (11.3); đồng bộ theo vùng gần, lưới không gian, hồn thú ngủ, vẽ theo khối (11.4); mọi bản đồ ×8 dựng bằng `tools/maps` là mặc định, Lõi Tinh Đấu và Đại Đấu Hồn Trường giữ cỡ (11.5); vị trí lưu kèm tên file bản đồ.

- [x] 11.1 đến 11.5 như trên; biểu tượng Hồi Thành Phù, rương, tiên thảo và quả nổ `fx_no`.

**Giai đoạn 12: Âm thanh**
- [x] 12.1 Nền tảng WebAudio, bảng Âm thanh, 40 SFX ZzFX tự tạo, spatial audio.
- [x] 12.3 Nhạc nền tự sáng tác cho mọi bản đồ, bài giao chiến boss / thú vương, khúc ngắn theo sự kiện (mục 5.12).
- [x] 12.4 Âm thanh lô 1: kênh trộn, biến thể cao độ, giới hạn và ưu tiên tiếng, 105 clip CC0, trang `?thu=am`.
- [x] 12.5 Nhạc động lô 2: lớp giao chiến cùng nhịp, boss pha 2, stinger, môi trường, tiếng giao diện và PK.
- [x] 12.6 Hiệu ứng hồn kỹ theo hệ: 8 hệ × 5 kiểu, trang `?thu=fx`.

**Tự săn** (chủ repo chốt 2026-10-22; mục 5.13)
- [x] Auto 1 đến 3: lõi tự săn phía server, bảng Tự động, Ủy Thác Lệnh, ủy thác offline nhận thưởng khi vào lại, chung quỹ giờ treo.
- [x] Phạm vi toàn bản đồ (mặc định) hoặc "Chỉ quanh chỗ đứng"; đánh cả tinh anh, thú vương, boss thế giới; né vùng báo trước, đổi võ hồn theo cơ chế boss, lùi khi ít máu.

**Việc để sau** (đã xong hết)
- [x] Nhiệm vụ: hằng ngày ở Sử Lai Khắc Học Viện (Phất Lan Đức), chương 2 "Sử Lai Khắc Thất Quái" (9 bài), chương 3 "Hải Thần Đảo" (10 bài, thưởng hồn cốt, dung hợp kỹ, tông môn); khung theo dõi, dấu "!" / "?", chỉ đường (mục 5.8).
- [x] Túi đồ chia trang, mở rộng theo trang, sắp xếp; thương nhân lưu động; tự bán từ xa khi túi gần đầy, khoá món, mua lại (mục 5.7, 5.13).
- [x] Vùng an toàn hồi sinh lực nhanh hơn, số hồi sinh chuyển vào `shared/data.ts`.
- [x] Đại Đấu Hồn Trường: hàng chờ tổ đội 2 người, 2v2, Elo và thưởng riêng, chống dàn xếp; hệ số sát thương theo hệ, hiệu ứng bộ hồn hạch, phụ trợ lan cho đồng đội; xem trực tiếp (server và giao diện).
- [x] Dung hợp kỹ giữa hai hồn sư cùng tổ đội: 5 cặp `FUSIONS`, phím G, nút chạm, hiệu ứng (mục 5.9); tổ đội dùng hiệu ứng bộ hồn hạch, hồn cốt và thanh tẩy cho đồng đội.
- [x] Chat tổ đội, tin riêng, kênh thế giới, chat tông qua presence; bạn bè và chặn; cộng minh và bảng xếp hạng cộng minh.
- [x] Hồn thú: chỉ số thủ, trạng thái Mê hoặc / Đóng băng, "đứng yên"; cơ chế đầy đủ của thú vương / tinh anh (Lưỡng Nghi Luân Chuyển, Thủy Triều Dâng, Phun Mực, Vạn Chu Phệ, tầng Hàn và Hỏa Đàn, vùng lưu lại trên mặt đất); chiêu toàn sàn né được của boss thế giới; đóng góp boss theo tài khoản.
- [x] Chạy nhiều tiến trình: `RedisPresence`, chuyển kênh, khoá và hàng chờ dùng chung, dọn phiên của tiến trình chết; `test:presence-kill` và bot hai tiến trình; CI job `presence-redis`.
- [x] Bot thử thêm các ca biên của đấu trường và ngắt kết nối; CI chạy `npm run check` và `npm run build` cho mọi PR.

**Giai đoạn 13: Trang bị hồn sư** (mục 5.15).
- [x] E0 Chốt thiết kế, bảng số và hàm thuần ở `shared/data.ts`, soát kinh tế `docs/trang-bi-kinh-te.md`.
- [x] E1 Dữ liệu và mặc / tháo (SQL `027_trang_bi.sql`, tin `equipgear` / `unequipgear`, chỉ số vào `calcStats`).
- [x] E2 Rơi đồ 4 pha theo bậc hồn thú, Đá Cường Hóa, Monte Carlo.
- [x] E3 Thợ rèn cường hóa +15 theo bảng rủi ro, Bùa Hộ Mệnh, lưu theo chuỗi / `ver`.
- [x] E4 Hợp thành 3 → 1, phân giải hàng loạt, tự bán / tự phân giải tùy chọn.
- [x] E5 Giao diện: tab trang bị, nhóm lọc trong túi, ba trang Thợ rèn.
- [x] E6 Biểu tượng trang bị 76 / 76 khoá, khung theo bậc, nhập bằng `tools/assets/equip-import.mjs`.
- [x] E7 Cân bằng: giả lập `sim:equip`, chạy dài `equipsoak`; không đổi số.
- [x] Khoá Redis `lock:item:<id>` khi bật nhiều tiến trình.

**Giai đoạn 14: Giao diện Nhân vật + Túi** (mục 5.16; chỉ client).
- [x] NV0 Thiết kế chi tiết, bản phác HTML, hợp đồng `charBagContract.ts`.
- [x] NV1 `DualWindowManager`: hai cửa sổ cùng mở, phím B / C, nút ⇆.
- [x] NV2 Búp bê 4 tab, gắn / tháo hồn cốt, hồn hạch ngay trong bảng, tab Võ hồn.
- [x] NV3 Kéo thả, bấm đúp mặc thông minh, thẻ thao tác nhanh, so sánh hai cột.
- [x] NV4 Tab Trang bị 10 ô.
- [x] NV5 Hoàn thiện: màn hẹp, phím tắt, bot kiểm lệnh, đo FPS khi kéo.

**Nhóm Bản đồ khu vực: radar, bản đồ và sương mù** (mục 5.17).
- [x] R0 hằng và hàm thuần `shared/radar.ts`; R1 ảnh nền thủy mặc sinh bằng `tools/maps`; R2 radar tròn góc màn hình; R3 bản đồ khu vực phím N; R4 tự đi tới cờ xuyên bản đồ; R5 lọc tin `mini` theo bán kính; R6 đánh dấu tổ đội "Tập trung ở đây"; R7 ảnh khung / la bàn / nền giấy; R8 sương mù khám phá (SQL `031_map_fog.sql`).

**Nhóm Hình thái Võ Hồn Chân Thân: pháp tướng** (mục 5.18).
- [x] H0 Bảng đặc tả 25 võ hồn; H1 công thức chuẩn (Lam Điện Bá Vương Long + Hạo Thiên Chùy); H2 khung code dùng chung (`PHAP_TUONG`, vòng thở, động tác đánh, biến hình, cut-in); H3 đủ 25 / 25 ảnh pháp tướng qua bốn lô P1 đến P4.

**Nhóm Hình ảnh kỹ năng combat** (chỉ hình ảnh và cảm giác đánh, giữ số và cơ chế; mục 5.11).
- Chủ sở hữu họ asset C1–C16: **Codex (tthoadev)**.
- [x] S0 Bảng đặc tả 25 võ hồn × 11 chiêu; S1 khung `SKILL_VISUAL` + cảm giác đánh; S2 trọn bộ 11 chiêu Lam Điện Bá Vương Long + Hạo Thiên Chùy, công thức chuẩn.
- [x] S3 bốn lô A đến D phủ đủ 25 / 25 võ hồn và các dung hợp kỹ (`FUSION_VISUAL`).
- [x] S5 Hoàn thiện: FPS 40–60 người, tự hạ mức hiệu ứng, Giảm chuyển động, âm thanh, kiểm tung mọi chiêu; H7 chuyển động phụ của phụ thể bằng code.

**Nhóm Hồn sư tự tạo bằng LPC** (mục 5.11).
- [x] L0 Mẫu thử, bộ 115 món LPC, chủ repo duyệt 4 hướng; L1 danh mục `LPC_PARTS` + công cụ đóng gói; L2 server `Looks.mode`; L3 client ghép lớp lúc chạy; L4 màn tạo nhân vật hai chế độ, đổi ngoại hình qua thợ may.
- [x] HL1 Mẫu dựng sẵn bằng LPC; HL2 chuyển tài khoản preset cũ lúc nạp; HL3 hồn sư chỉ còn LPC, gỡ sprite preset (client nhẹ 720 KB); HL4 áo / mũ trang bị hiện lên lớp LPC; C3 lớp trang phục phương Đông cho Tự tạo (đồng phục Sử Lai Khắc, áo Vũ Hồn Điện); L5 thay bằng HL4; L6 đo FPS 41 người trên Chrome GPU.

**Nhóm Hồn thú v2** (công cụ + quy trình hoạt ảnh vẽ thật; `docs/art/hon-thu-hoat-anh.md`).
- [x] H2 ba loài thử (Phong Lang, Kim Linh Ưng, Thái Thản Cự Viên) đã nhập; H4 đã nhập thêm Ám Kim Khủng Trảo Hùng, Hắc Bối Dã Trư, Huyền Băng Thiềm.
- [x] P0 đặc tả cỡ theo tỉ lệ + cutter chuẩn hóa mặc định; P1 `beast:check` và cutter v2; P2 skill `beast-anim` + sổ trạng thái tự sinh; P3 trang xoay vòng hướng + CI nhẹ.

**Nhóm UI gốc (kit Mực + Giấy)** (`docs/art/ui-kit.md`).
- [x] P0 style guide, kiểm kê token, sửa 9-slice, lớp 960×540; P1 công cụ `ui-sheet-check` / `ui-sheet-cut` + manifest; P2 skill `ui-kit`, prompt mẫu, trang xem trước, CI nhẹ; cỡ giao diện tự động theo bậc màn (≥ 1600 / ≥ 1920). Kit nhập vào game, màn hệ thống / HUD / bảng lõi / đăng nhập chuyển sang kit (#885); 29/10/2026: UI gốc là UI mặc định duy nhất (chủ repo chốt), tài liệu bỏ mọi UI khác.

**Nhóm Di chuyển & giao chiến** (phản hồi chơi thử 2026-10-26).
- [x] M1 quét xuyên rào, M2 lách góc, M4 bấm-để-đi không bỏ dở, M3 khoá mục tiêu, M5 thứ tự ưu tiên lệnh + chip trạng thái, M6 hướng dẫn điều khiển lần đầu.

**Nhóm Chống gian lận và hiệu năng** (vòng bảo mật / tải).
- [x] Giới hạn tần suất mọi tin `onMessage` và REST có token; dọn bảng `sessions`; ghi túi chỉ dòng đổi; cache bảng xếp hạng; dọn Map toàn cục + soak 2 giờ; giảm request lúc vào bản đồ (#716). Soát gian lận: `docs/tech/*gian-lan*`.

**Nhóm Tối ưu tài liệu** (#619).
- [x] D0–D8: tách `GAME_DESIGN.md` thành `docs/design` / `art` / `tech` / `ops`, `quyet-dinh.md`, `lich-su.md`, rút gọn CLAUDE.md / AGENTS.md / CONTRIBUTING, `tools/docs-check.mjs` trong `npm run check`, dọn file xem trước sót, tóm tắt tiếng Anh `docs/en/OVERVIEW.md`.

**Nhóm Giao diện và cảm giác họ asset C1–C16 (Codex)**.
- [x] C10 hộp thoại NPC + cửa hàng lưới (#596), C11 nhiệm vụ (#597), C13 phản hồi giao diện (#599), C14 khả năng tiếp cận (#600), C15 màn chết / bảng kết quả / Bạn bè (#601) xong; luật hiện hành ở `docs/design/giao-dien.md`.

## Số issue / PR

- Giai đoạn 10: #96, #100–#103, #105, #331, #333, #335, #336–#342, #383, #385–#387, #395, #436, #444, #447, #451, #463, #466, #476, #480–#484, #564.
- Giai đoạn 11: #106–#110, #170, #201.
- Giai đoạn 12: #132, #134, #393, #394, #396.
- Tự săn: #155–#158, #213, #218.
- Việc để sau: #111–#121, #122, #161–#163, #173–#175, #178, #188–#195, #198, #215, #216, #277–#280, #284–#286, #497, #559.
- Giai đoạn 13: #410–#418, #458.
- Giai đoạn 14: #453–#459.
- Bản đồ khu vực: #426–#435, #472, #473.
- Pháp tướng: #482–#487, #490, #491, #492, #499, #505, #513, #528, #531.
- Hình ảnh kỹ năng: #541, #542, #546, #548, #566–#569, #583, #590.
- Hồn sư LPC: #507–#511, #564, #565, #570–#574, #578, #588; họ asset Codex C1–C16: #596, #597, #599–#601, #541, #553, #554, #576, #577.
- Tối ưu tài liệu: #619, #636, #637, #640. Hồn thú v2: #862–#866, #870, #766–#768. UI gốc (kit Mực + Giấy): #878–#880, #887. Di chuyển & giao chiến: #746–#752. Chống gian lận và hiệu năng: #716, #734–#739.
