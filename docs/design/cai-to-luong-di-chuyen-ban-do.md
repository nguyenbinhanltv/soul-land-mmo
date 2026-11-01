# Cải tổ luồng di chuyển bản đồ (Level Flow, Pathing, Art Direction)

> **Kế hoạch đã được chủ repo duyệt (Q55); giữ làm căn cứ và lịch sử.** Chỉ tiêu bố cục (phần 1.1 của bài này) nay là luật hiện hành ở `docs/design/the-gioi-ban-do.md` (mục "Chỉ tiêu bố cục bản đồ"); cách đo và dựng ở `docs/tech/phong-ban-do.md`. Phần cơ chế động (1.3), asset (phần 4) và việc loại B / C (L6 trở đi) **chưa phải luật hiện hành**, chỉ thành luật khi từng việc được duyệt và làm xong. Không sửa code, `shared/data.ts`, bản đồ hay `docs/quyet-dinh.md` bằng tài liệu này. Luật bản đồ: `docs/design/the-gioi-ban-do.md` (mục 5.3), file Tiled và công cụ dựng: `docs/tech/phong-ban-do.md`, quy cách ảnh: `docs/art/quy-cach-isometric.md` (mục 5.11), bảng màu giao diện: `docs/art/ui-kit.md`.
> Số đo lấy từ `origin/main` (`ec680cbc`, 2026-11-02) bằng script ngoài repo (phương pháp ở phần 0.1). Tên hằng viết nghiêng, kèm "(đề xuất)", là hằng chưa có, sẽ thêm ở `shared/data.ts` khi làm thật; không chép số cân bằng vào tài liệu này.

## 0. Số đo thật làm căn cứ

### 0.1 Phương pháp (đọc `shared/move.ts`, `server/src/map.ts`, `shared/path.ts`)
- Ô logic `TILE` = 16 px. Ô chặn = gid có `collides` ở **mọi lớp** của file Tiled (`solidGrid`); server và client dùng chung lưới. Hộp va chạm hồn sư `PLAYER_HW` × `PLAYER_HH` = 10×8 px (chưa tới 1 ô): khe 1 ô vẫn lọt nếu căn đúng; góc ô được `MOVE_NUDGE` lách giúp, **riêng tự săn tắt lách** (`moveNudge(true)` = 0) nên tự săn kẹt ở cổ chai dễ hơn người bấm phím.
- **Bề ngang ô** = w lớn nhất mà ô nằm trong một hình vuông w×w toàn ô đi được (chính xác trên lưới). Hộp va chạm hồn thú thường có nửa rộng `max(3, size / 3)` px (`server/src/rooms/tick.ts`, `TIERS`): thú Đỏ rộng ≈ 14,7 px (< `TILE`) nên **lọt khe 1 ô**, cỡ thân thú **không** là lý do đòi khe ≥ 2 ô. Chỉ tiêu khe ≥ 2 ô không nhằm cho "lọt" mà nhằm **giảm ma sát / dồn cục**: khe 1 ô buộc các thực thể đi hàng một, hộp 10×8 px dễ vướng góc, và tự săn tắt lách góc nên khựng nhiều hơn người bấm phím. (Hộp của thú vương / boss chưa kiểm.)
- **Cổ chai (choke):** đoạn liên tiếp ≥ 3 ô có bề ngang ≤ 2 trên đường ngắn nhất (A* 8 hướng) giữa điểm mốc: trại hồi sinh, cổng, truyền tống trận, tinh anh, hang thú vương (đúng object trong file Tiled). **Đường rộng nhất** = bề ngang lớn nhất mà vẫn đi được từ mốc này tới mốc kia (nếu chỉ 2 thì không có tuyến nào rộng hơn 2 ô).
- **Kẹt chéo (pinch):** hai ô chặn chéo nhau, hai ô còn lại trống (hộp 10×8 px không lách chéo được). **Ngõ cụt:** ô trống có ≥ 3 ô kề chặn. **Sau cổ chai:** ô chỉ vào được qua khe 1 ô (vùng ma sát / dồn cục, không phải vùng không vào được).
- Thời gian đi = quãng đường (ô) × `TILE` ÷ (`PLAYER_SPEED` = 95 px/s đi bộ; × `RUN_MULT` khi chạy ngoài giao chiến). Không đo được "nơi người chơi hay kẹt" từ log thật (không có log chạy chung); dùng ba chỉ báo thay thế: kẹt chéo, ngõ cụt, cổ chai; bằng chứng lịch sử ở 0.4.

### 0.2 Bảng đo 11 bản đồ (file đang dùng, mặc định `.v2`)

| Bản đồ | Cỡ ô | Chặn cứng % | Ngang TB (ô) | Ô đi được ≤ 2 ô ngang % | Ô trong khoảng trống ≥ 5×5 % | Kẹt chéo /1000 ô | Ngõ cụt /1000 ô đi được | Ô sau cổ chai | Cổ chai trên tuyến mốc | Ngang tuyến rộng nhất TB (ô) | Đi bộ TB giữa mốc (giây) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Tinh Đấu Ngoại vi** | 255×170 | 27,5 | **3,55** | **33,4** | **25,1** | **30,7** | **31,5** | **2181** | **36** / 12 tuyến | **2,7** | 31,3 |
| Tinh Đấu Nội địa | 255×170 | 28,0 | 4,13 | 22,2 | 37,5 | 22,3 | 20,2 | 695 | 17 / 12 | 2,8 | 29,2 |
| Lạc Nhật Sâm Lâm | 255×170 | 21,1 | 4,16 | 23,1 | 37,7 | 23,3 | 20,1 | 771 | 13 / 10 | 3,0 | 27,7 |
| Cực Bắc Chi Địa | 204×272 | 17,4 | 5,41 | 13,9 | 59,8 | 15,0 | 12,3 | 640 | 9 / 10 | 4,0 | 24,2 |
| Hải Thần Đảo | 255×170 | 21,4 | 6,48 | 8,1 | 73,3 | 9,0 | 6,3 | 54 | 9 / 10 | 4,6 | 22,0 |
| Thánh Hồn Thôn | 204×153 | 12,8 | 7,47 | 8,3 | 74,8 | 9,6 | 6,1 | 180 | 3 / 9 | 4,7 | 11,0 |
| Nặc Đinh Thành | 170×113 | 20,1 | 8,11 | 4,6 | 73,7 | 1,3 | 0,7 | 4 | 0 / 11 | 7,9 | 16,1 |
| Thiên Đấu Thành | 226×158 | 35,3 | 9,16 | 4,7 | 78,4 | 0,6 | 0,7 | 0 | 11 / 16 | 5,6 | 20,1 |
| Lõi Tinh Đấu | 64×44 | 43,9 | 7,19 | 14,0 | 64,4 | 9,9 | 20,9 | 0 | 0 / 1 | 3,0 | 3,7 |
| Đại Đấu Hồn Trường | 40×24 | 38,8 (viền) | 13,65 | 2,7 | 97,3 | 0 | 23,8 | 0 | – | – | – |
| Luyện Hồn Cảnh (Bí Cảnh) | 40×24 | 13,5 (viền) | 13,12 | 0,7 | 96,4 | 0 | 0 | 0 | – | – | – |

(Mọi bản đồ đều 1 thành phần liên thông; tỷ lệ chặn "trong" bỏ viền 3 ô: Ngoại vi 26,0, Nội địa 25,9, Lạc Nhật 19,7. Hai sân đấu: phần chặn gần như chỉ là viền, sân chơi 36×15 và 38×22 ô trống.)

### 0.3 Phát hiện (đọc đúng số, không phóng đại)
1. **Tỷ lệ chặn thô không phải thủ phạm.** Thiên Đấu Thành chặn 35,3% mà chảy thông (ngang TB 9,16, kẹt chéo 0,6) vì chặn thành **khối lớn** (nhà, tường: 97% ô chặn thuộc cụm ≥ 10 ô). Ngoại vi chặn 27,5% mà nghẽn nhất vì chặn **rải lẻ**.
2. **Thủ phạm là cây lẻ.** Ở Ngoại vi cây là 83% ô chặn; trong phần chặn bên trong, **21% là cụm 1 ô, 15% là cụm 2–3 ô** (36% là cây đứng lẻ / đôi), nên cứ ~33 ô lại có một kẹt chéo và 1/3 ô đi được nằm trong khe ≤ 2 ô. Nội địa 20% + 12%, Lạc Nhật 27% + 18%, Thánh Hồn Thôn 35% + 12% (nhưng Thôn có 75% khoảng trống nên vẫn thoáng); thành trấn ≤ 8%.
3. **Ngoại vi không có hành lang chính nào rộng:** tuyến rộng nhất giữa các mốc trung bình chỉ 2,7 ô, có tuyến chỉ 2 ô (tới Hắc Sát Quỷ Hổ, Ảnh Trảo Linh Miêu, Hang Huyết Nguyệt); 36 đoạn cổ chai trên 12 tuyến, tập trung dọc trục đông–tây `y ≈ 85–90` (các cụm quanh x ≈ 35, 69, 96, 115, 124, 194). Đây là chính con đường mọi người chơi đi (trại cổng → Rừng thưa → trạm gác → Nội địa), mất 42–44 giây đi bộ.
4. **Thời gian không phải vấn đề, ma sát mới là.** Sau khi mô phỏng gỡ cây lẻ, thời gian đi trung bình chỉ giảm ~3,5% (24,8 → 24,0 giây ở tuyến từ trại hồi sinh), vì A* đã đi gần thẳng (độ cong tuyến ~1,1). Cái được là: ô cổ chai 1 ô trên tuyến 48 → 5, ngang tuyến hẹp nhất 2,8 → 4,6, kẹt chéo 30,7 → 1,3 /1000 ô. Mục tiêu cải tổ là **hết khựng / kẹt / dồn cục ở khe**, không phải rút ngắn đường.
5. **2181 ô (6,9% ô đi được) của Ngoại vi chỉ vào được qua khe 1 ô.** Hồn sư (10×8 px) và hồn thú thường đều lọt khe 1 ô, nên đây **không** phải vùng không vào được; đó là vùng ma sát / dồn cục (đi hàng một, vướng góc), nặng nhất với tự săn không lách góc. Chưa kiểm xem `server/src/rooms/spawn.ts` có sinh thú trong các ô này (cần soát, việc L0).
6. **Vật cản đã có cách mềm hóa nhưng ít dùng:** `plant` và danh sách `gids.walk` trong bố cục (cỏ, bụi hoa, cầu, vật trang trí, nấm) đi xuyên được; client đã khoét lỗ elip + mờ khi vật cao che hồn sư (mục 5.11 "Sắp lớp theo độ sâu"). Tức làm mềm **không cần cơ chế mới**, chỉ cần dùng nhiều hơn.

### 0.4 Bằng chứng lịch sử về kẹt (từ `git log`)
#748 / #764 lách góc khi đi phím; #749 / #763 bấm để đi bị chặn tạm thì tính lại A*; #785 / #799 tự săn không lách góc (nên kẹt cổ chai nặng hơn); #368 / #373 bot `leaveSafe` kẹt; #611 / #628 chống kẹt tự săn. Mọi lần đều vá bằng triệu chứng (lách, tính lại đường); chưa lần nào sửa **hình bản đồ**.

### 0.5 Ảnh minh họa
Ảnh isometric dựng lại được bằng `node tools/maps/preview.mjs shared/assets/tinh_dau_ngoai_vi.v2.json ngoai-vi.png --scale 0.16 --tint "#eef4dc"` (đối chứng: `thanh_hon_thon.v2.json`); sơ đồ tô theo bề ngang và vòng cổ chai sinh từ script đo (việc L0 đưa script vào `tools/maps`). Dưới đây là sơ đồ Ngoại vi (mỗi ký tự = 6×6 ô; `·` chặn <12%, `░` <25%, `▒` <40%, `█` ≥ 40%): nhìn thấy gần như không có vùng `·` liên tục nối tây → đông:

```
███▒▒▒░▒░█▒▒▒▒░▒▒▒▒▒▒▒▒▒▒▒█▒██▒▒▒▒█████████
▒▒░▒▒··░░▒░···░···▒▒▒█·░░▒▒·░·▒▒░▒███████▒█
▒█░▒░·░░░▒░·░·░░░▒██··░▒██░▒▒▒█░·░░▒█▒██▒░█
▒▒▒▒···░░▒░░··░░░██░░░██▒█▒█▒▒▒▒░··░▒███▒░█
█░▒···░██░▒·░░·█▒▒█▒··▒░·▒░░···░░█░▒█▒█▒▒▒▒
█░·░░▒███░·░·░·░▒▒▒▒▒··░·█·····░·▒▒░░▒██░░█
▒·░░███▒█▒░··▒░···░░·░·░░██···░█▒▒░░·███▒░█
▒░·░█▒·░·░░··░░░··░·░░▒▒▒▒█▒▒███████▒██▒▒░█
░░·░░░···░░·░░··░░··░▒░·▒░░░██████████▒██░▒
░···░··░░░░▒░·░░··░··░░·░·█▒░·░░███████▒░·█
▒····░··▒░░···░····░·░░·░░██░░··░░█████·░░█
```
(11 hàng đầu của 28; trục chính nằm quanh hàng 14.)

## 1. Tái cấu trúc luồng di chuyển

### 1.1 Phân cấp chướng ngại (ba lớp, khai ở bố cục `tools/maps/layouts`)

| Lớp | Tên | Chặn bước? | Dùng cho | Quy tắc |
|---|---|---|---|---|
| **H** | Hard collision (chặn cứng) | Có (`collides`) | Biên bản đồ, vách, nước sâu, tường nhà / thành, cây cổ thụ lớn, trụ đá, tường hang | Chỉ **khối ≥ 4 ô liên thông** hoặc đường biên liên tục; cấm cụm 1–3 ô trừ trụ / mốc có tên |
| **S** | Soft / Visual (mềm) | Không (như `plant`, `gids.walk`) | Bụi rậm, cây non, tán thấp, dây leo, nấm, cỏ cao, bia mốc, cột phù văn thấp, bãi lội (`ford`) | Phủ **chiều sâu hình ảnh**; vẽ chân vật ở cùng lớp đứng, client tự khoét lỗ / mờ khi che hồn sư |
| **D** | Dynamic / Traversal (động) | Đổi theo trạng thái | Cầu mây, trụ phong ấn, dây leo đu, cọc dịch chuyển | **Mới**, phần 1.3; cần server quyết định |

**Chỉ tiêu bố cục theo loại map** (đo bằng đúng các chỉ số ở 0.2; **đã thành luật hiện hành** ở `docs/design/the-gioi-ban-do.md`, bảng này giữ cột "Hiện tại tệ nhất" làm căn cứ; không phải số cân bằng nên không vào `shared/data.ts`):

| Chỉ tiêu | Dã ngoại / săn | Tông môn / thành | PvP / phụ bản | Hiện tại tệ nhất (Ngoại vi) |
|---|---|---|---|---|
| Chặn cứng toàn bản đồ | ≤ 20% | ≤ 35% (khối lớn) | ≤ 15% sân chơi (không tính viền) | 27,5% |
| Cụm chặn 1–3 ô / tổng ô chặn (bỏ viền) | ≤ 5% | ≤ 3% | 0 (trừ trụ có tên) | 36% |
| Ô đi được nằm trong hành lang ≤ 2 ô | ≤ 10% | ≤ 6% | ≤ 3% | 33,4% |
| Ô trong khoảng trống ≥ 5×5 | ≥ 60% | ≥ 70% | ≥ 80% | 25,1% |
| Kẹt chéo /1000 ô | ≤ 2 | ≤ 1 | 0 | 30,7 |
| Ngõ cụt /1000 ô đi được | ≤ 8 (chỉ do lair / túi thú có chủ đích) | ≤ 2 | 0 | 31,5 |
| Ô sau cổ chai (vùng chỉ vào qua khe 1 ô) | 0 (không để vùng săn nằm sau khe 1 ô: giảm ma sát / dồn cục) | 0 | 0 | 2181 |
| **Hành lang chính** (trại hồi sinh → cổng / trận / tinh anh / hang) rộng tối thiểu | **5 ô**, TB ≥ 7 | 6 ô, TB ≥ 9 | không áp | 2 ô, TB 2,7 |
| Đường nhánh tới bãi săn / ngõ phụ | ≥ 3 ô | ≥ 3 ô | ≥ 3 ô | 1–2 ô |
| Cổ chai trên tuyến mốc (đoạn ≤ 2 ô dài ≥ 3) | 0 trên đường chính | 0 | – | 36 |

Lý do chọn **5 ô**: chứa 2 hồn sư đi song song + 1 hồn thú truy đuổi mà không chặn nhau; khớp cách đo "ô trong khoảng trống ≥ 5×5" ở trên. Mô phỏng ở 5.3 cho thấy đạt được mà chỉ gỡ ~215 ô cây (0,5% diện tích).

### 1.2 Làm bản đồ dày chiều sâu mà không cản (lớp S)
- **Thay vì xóa rừng, đổi "cây lẻ" thành vật mềm:** mọi cụm cây 1–3 ô (36% ô chặn ở Ngoại vi) đổi gid sang vật cùng gam màu nhưng thuộc `gids.walk` (bụi rậm, cây non, nấm lớn: ngoại vi đã có `vat_deco`, `vat_nam` đi xuyên được, nên **vòng thí điểm không cần ảnh mới**). Rừng vẫn rậm trong mắt, nhưng chỉ còn cổ thụ **thành cụm lớn** làm vách.
- **Tầng che phủ (canopy) hóa:** tán cây lớn của cây hard nằm ở hàng mép hành lang vẽ **cao hơn đầu** (đã có cơ chế lát dọc 16 px + khoét lỗ elip khi che hồn sư): hành lang chính rộng 5 ô nhưng nhìn như đi dưới tán, không thấy "đường trống trơn".
- **Che mờ khi đứng sau:** giữ nguyên cơ chế hiện có (`FADE`, `HOLE_ALPHA` ở `client/src/isoMap.ts`); soft cao > 2 ô cũng đi qua cơ chế này. Không thêm logic server.
- **Sương / hạt:** lớp sương thấp (client, theo thời tiết từng bản đồ ở mục 5.11) làm "đông" cảnh phía xa; đã có trần 50% độ mờ và giảm khi đánh boss, **không** thêm hạt mới ngoài trần ~150 hạt.
- **Chiều sâu thị giác bằng nền:** pha ô nền xen 2–3 sắc (`leaf`, `moss`, `path`) theo tầng niên hạn (`blend` đã có), không dùng vật cản để "đánh dấu vùng".

### 1.3 Dynamic / Traversal: đối chiếu cơ chế thật

| Ý tưởng | Hiện có trong game? | Bằng chứng | Cần làm mới |
|---|---|---|---|
| **Khinh công** (lướt chớp nhoáng) | **Có, nhưng chỉ lướt trên đất đi được** | 19 mục `area: "dash"` ở `shared/data.ts` + tiên cơ Thiểm Sát; `dashPath` dừng ngay khi `map.hits` (`server/src/rooms/calc.ts`, `motion.ts`) | Không (giữ). Có thể thêm "lướt qua khe nước ≤ 3 ô" nhưng đó là cơ chế mới (D2) |
| **Ngự kiếm / bay** | **Chỉ hình ảnh:** `fly` là hiệu ứng bay lên, **không** qua địa hình | Chú thích `fly` ở `shared/data.ts` ("chỉ là hiệu ứng hình ảnh"); dùng ở nhiều hồn kỹ lướt / tuyệt kỹ | **Mới:** kỹ năng di chuyển bay, hoặc vật phẩm tạm; khóa theo trạng thái ở server (D3) |
| **Hồn cốt phi hành** | Chưa có kỹ năng vượt địa hình (đã đọc `dashPath`; chưa soát từng kỹ năng hồn cốt) | `boneSkill` | **Mới**, loại C |
| **Dịch chuyển trận pháp** | **Có:** truyền tống trận (`WAYPOINT_CAST` giây, phí `WAYPOINT_FEE`, từ xa có hồi), cổng (`TRAVEL_CAST`), thuyền (`BOAT_CAST`), Hồi Thành Phù | Mục 5.3 "Truyền tống trận" | Mới ở **cự ly ngắn trong bản đồ** (cọc dịch chuyển nối hai bờ khe, D4) |
| **Chạy nhanh** | **Có:** `RUN_MULT` ngoài giao chiến | Mục 4 "Di chuyển" | Không |
| **Lách góc** | **Có** cho người bấm phím (`MOVE_NUDGE`); tự săn **tắt** | `moveNudge` | Cân nhắc bật lại cho tự săn sau khi bản đồ hết kẹt chéo (việc nhỏ) |
| **Vượt địa hình bằng vật** (cầu mây, đu dây, trụ phá được) | Chưa có; **lưới chặn hiện tĩnh** (`solidGrid` đọc một lần) | `shared/move.ts` | **Mới, rủi ro cao:** cần "lớp cản động" ở server **và** dự đoán client (`predict.ts` dùng chung `moveEnt`); loại C, cần AO review (đụng `MapRoom` / giao thức) |

Nguyên tắc cho D: (1) client chỉ gửi ý định (đứng ở vật, bấm F), server kiểm khoảng cách / trạng thái / hồi chiêu rồi đặt vị trí (như `travel.ts`); (2) **luôn có đường bộ thay thế** (D chỉ làm đường tắt, không khóa tiến trình); (3) không cho cầu / trụ mở ở nơi thú vương, boss; (4) không hoạt động trong sân đấu và Bí Cảnh.

## 2. Khung quy hoạch layout theo 3 dạng map

### 2.1 Dạng 1: Dã ngoại / săn quái (Tinh Đấu Đại Ngàn + Vạn Kiếp Cổ Mộc)
**Mô hình "xương cá":** một **trục chính** tây → đông (hành lang ≥ 5 ô, trải đá / lát ngói vụn, đèn hồn hoàn dọc đường), từ trục tỏa các **nhánh** (≥ 3 ô) vào **bãi săn mở** (khoảng trống ≥ 12×12 ô, 1 bãi ≈ 1 vùng `zone`); mỗi bãi có **2 lối vào** (không ngõ cụt) và 1 **lối tắt D** (tùy chọn). Cổ thụ Vạn Kiếp Cổ Mộc là **mốc dọc** (hard, 3×3 ô trở lên, tán che) đặt ở mép bãi, không đặt giữa đường.

```
 Trại cổng ═══ trục chính ≥5 ô ════════════════════════════►  Trạm gác / cổng sâu
   [T]        │        │          │          │        │      [G]
   (hồi sinh) ▼        ▼          ▼          ▼        ▼
          ┌──────┐ ┌──────┐   ┌──────┐   ┌──────┐ ┌──────┐
          │ BÃI  │ │ BÃI  │   │ BÃI  │   │ BÃI  │ │ BÃI  │   BÃI = mở ≥12×12, 2 lối vào
          │ T0   │ │ T1   │   │ T2   │   │ T3   │ │ Hang │   Hang thú vương: lối vào 1, rộng ≥5
          └──┬───┘ └──┬───┘   └──┬───┘   └──┬───┘ └──────┘
             └─ nhánh ≥3 ─┘ ░ rừng mềm (S) ░ └─ lối tắt D (cầu mây) ─┘
   ▓▓▓ vách / nước / cổ thụ khối ≥4 ô (H) làm biên giữa các tầng, chừa 'cổng tầng' rộng ≥5
```

| Thành phần | Tỷ lệ diện tích | Ghi chú |
|---|---:|---|
| Trục chính + nhánh | 10% | rộng ≥ 5 / ≥ 3 ô |
| **Bãi săn mở (Open Arena)** | **35%** | khoảng trống ≥ 12×12; săn, kiểu "hãy tránh chiêu báo trước" cần chỗ lùi |
| Rừng mềm (S) | 25% | đi xuyên, dày chiều sâu |
| Chặn cứng (H): vách, nước, cổ thụ khối | 20% | biên tầng, hang |
| Điểm nhấn / trại / tàn tích / mốc | 10% | chứa landmark, an toàn một phần |

- **Nút thắt chuyển cảnh (cổng tầng / cổng bản đồ):** mỗi nút rộng ≥ 5 ô, dài ≤ 8 ô, ngay sau là bãi mở (không bắt người chơi đứng chen trong khe khi đang niệm cổng `TRAVEL_CAST`); cổng và trận đã có `SPAWN_CLEAR` không sinh thú xung quanh.
- **Landmark dẫn đường (mỗi ≈ 40 ô trên trục chính có một mốc nhìn thấy từ mốc trước):** cổ thụ phát sáng theo bản đồ, bia đá chỉ lộ, đèn hồn hoàn cùng màu niên hạn của tầng tiếp theo (`TIERS`: Trắng → Vàng → Tím …).
- **Ánh xạ:** Tinh Đấu Ngoại vi (**thí điểm**), Tinh Đấu Nội địa, Lạc Nhật Sâm Lâm; sau đó Cực Bắc Chi Địa (đã tốt, chỉ soát 640 ô sau cổ chai), Hải Thần Đảo, Thánh Hồn Thôn (chỉ chỉnh nhẹ). **Vạn Kiếp Cổ Mộc** chưa có trong game: dùng làm tên cho cổ thụ khối / vùng sâu của Nội địa, **không** thêm bản đồ mới.

### 2.2 Dạng 2: Tông môn / Học viện + Tiên Môn lơ lửng
**Mô hình "ba lớp":** (1) **Đại lộ + quảng trường** chữ thập, rộng ≥ 6 ô, nơi đông người, lát đá; (2) **Khuôn viên** (sân học viện, vườn, hồ) là khoảng trống ≥ 8×8 ô nối đại lộ qua 2–3 cổng; (3) **Công trình** (nhà, tháp, điện) là khối lớn hard, cửa vào là cổng / NPC (không đi xuyên). **Tiên Môn lơ lửng** là lớp trang trí + cầu: "đảo mây" (hard khối lớn ở rìa, vẽ phía sau và phía trên) nối khuôn viên bằng bậc đá / cầu (S hoặc D), nền dưới biên là mây (client).

```
     ┌─────────── tường thành / vách mây (H) ────────────┐
     │  [ĐẢO MÂY]≈≈cầu≈≈[ĐIỆN CHÍNH]≈≈cầu≈≈[ĐẢO MÂY]    │   ≈ cầu: S đi được, vẽ cao hơn nền
     │       ┊              ║                  ┊         │
     │ [KHUÔN VIÊN]═══ĐẠI LỘ ≥6 ô═══[QUẢNG TRƯỜNG ĐÀI PHUN NƯỚC]
     │   (sân tập,        ║ chữ thập        (chợ, trận truyền tống, NPC)
     │    vườn, hồ)       ║
     └──[CỔNG BẮC]────[CỔNG NAM]────[CỔNG ĐÔNG / BẾN]────┘
```

| Thành phần | Tỷ lệ | Ghi chú |
|---|---:|---|
| Đại lộ + quảng trường | 25% | ≥ 6 ô; đã có ở Nặc Đinh / Thiên Đấu |
| Khuôn viên mở | 25% | sân học viện, hồ, vườn anh đào |
| Công trình (H, khối lớn) | 30% | mọi cụm ≥ 10 ô; hai thành hiện đã đạt |
| Vườn, ao, mái hiên, cầu (S) | 15% | tăng chiều sâu, không cản |
| Nút chuyển cảnh (cổng, bến, trận) | 5% | cổng rộng ≥ 6 ô |

- Hai thành hiện đã đạt chỉ tiêu (cụm 1–3 ô ≤ 8%, kẹt chéo ≤ 1,3, ngang TB 8–9 ô): **không cải tổ hình**, chỉ làm lớp Tiên Môn (nhìn) ở nhịp art; Thiên Đấu Thành có 11 đoạn cổ chai dài trên 16 tuyến đáng soát riêng (quanh Hoàng cung / tường).
- Landmark: tháp Sử Lai Khắc / đài hồn hoàn theo niên hạn, đèn lồng đỏ son, cờ tông môn; trận truyền tống ở quảng trường là mốc quen thuộc.
- **Ánh xạ:** Nặc Đinh Thành (Học viện Nặc Đinh), Thiên Đấu Thành (Sử Lai Khắc, Hoàng cung; chỗ hợp nhất để thêm Tiên Môn lơ lửng). Bản đồ tông môn mới là **loại C**, chưa đề xuất.

### 2.3 Dạng 3: PvP / Phụ bản (Đấu Hồn Trường Bát Quái Trận)
Sân hiện tại là hình chữ nhật 36×15 ô **trống 97%**: không chỗ ẩn, đánh dài kéo cận chiến một chiều. **Bát Quái Trận:** 8 trụ đá 2×2 (hard) đặt quanh elip tại 8 phương, **Thái Cực Đài** (đá thấp 4×3, đi được, trang trí, không buff) ở tâm, 2 cổng đội ở hai đầu (A bên trái, B bên phải). Ở mọi chỗ, khoảng cách giữa hai trụ ≥ 3 ô (không bẫy), không cạnh ngõ cụt.

```
 ####################################   hàng biên (ngoài sân, khán đài)
 ....................................
 ..................##................   Càn (bắc)
 ..................##................
 .........##................##.......   Tốn / Chấn
 .A.......##................##.....B.
 .A..............oooo..............B.   o = Thái Cực Đài (đi được)
 .A...##.........oooo...........##.B.   Ly / Khảm (tây, đông)
 .A...##.........oooo...........##.B.
 .A................................B.
 .........##................##.......
 .........##................##.......
 ..................##................   Khôn (nam)
 ..................##................
 ....................................
```

| Thành phần | Tỷ lệ sân chơi | Ghi chú |
|---|---:|---|
| **Khoảng mở (Open Arena)** | ≥ 85% | khoảng trống ≥ 5×5 phủ gần hết |
| 8 trụ + tâm | ≈ 8% (32 ô trụ cứng; tâm mềm) | trụ cứng chiếm ≈ 6%, tâm đi được |
| Hành lang vòng ngoài | ≈ 7% | ≥ 3 ô, vừa lách vừa kẹp |

- **Không đổi luật** (số hồn sư, thưởng, hạn giờ): chỉ đổi hình sân, nên cùng `ArenaRoom`; cần chạy lại bot đấu trường và đo xem tỷ lệ thắng 2v2 theo bên A / B không lệch (chủ repo duyệt vì động tới PvP).
- **Landmark dẫn đường:** 8 trụ khắc 8 quẻ phát sáng khi **bên có hồn lực gần nhất** (client, màu `glow` của võ hồn), cột cờ hai đội, sàn có huy hiệu (đã có ở sân hiện tại).
- **Phụ bản Bí Cảnh** (`luyen_hon_canh`, 38×22 ô trống, mục 5.22): dùng cùng mô hình "sảnh + 4 trụ phù văn" cho sóng hồn thú; tinh anh ra ở **Thái Cực Đài**; giữ 3 `arrive` sóng như hiện tại.
- **Ánh xạ:** Đại Đấu Hồn Trường (chính), Luyện Hồn Cảnh (nhẹ), Lõi Tinh Đấu (sân boss thế giới, chặn 43,9% nhưng 91% là cụm lớn; **chỉ** soát lối đi quanh hồ, có 20,9 ngõ cụt /1000 ô).

## 3. Ngôn ngữ thị giác và hòa trộn concept (Art Direction)

### 3.1 Nguyên tắc nền, không phá quyết định đã có
- Giữ **phép chiếu isometric**: ô thoi 32×16 px, nền trầm khử màu (phong cách A), mỗi vùng một sắc (B), viền ngoài `#1a1020`, 3 sắc độ + 1 sắc phát sáng, vật cao cắt lát 16 px (`docs/art/quy-cach-isometric.md`). Giao diện vẫn là Mực + Giấy (phong cách C, `docs/art/ui-kit.md`); chỗ sang trọng vẫn dùng Lưu Ly (D).
- Nhạc đã là "nhạc tu tiên" (Q36), nên Tu Tiên là **lớp nhấn đã được chấp nhận**, không phải thế giới mới.
- **Không** dùng gói công trình Japanese / Chinese roof / Isometric houses (Q37), **không** dùng "vòng trận pháp, lửa lam" của gói đợt 2A (Q41). Phù văn, trận pháp ở tài liệu này là **vẽ mới** (code / Codex), không lấy lại ảnh đã bị gỡ; Q04: không chép sát nét game / truyện thương mại.
- Tỷ lệ Đấu La : Tu Tiên dưới đây tính trên **ngân sách điểm nhấn** (diện tích màu nhấn + số vật đặc trưng), **không** đổi màu nền; nền luôn theo bảng vùng ở mục 5.11.

### 3.2 Tỷ lệ pha trộn và bảng màu theo dạng map

| Dạng | Đấu La : Tu Tiên | Màu nền (có sẵn, `art/palettes/<mapId>.gpl`) | Màu Đấu La (nhấn) | Màu Tu Tiên (nhấn) |
|---|---|---|---|---|
| Dã ngoại (Tinh Đấu) | **80 : 20** | Rêu sâu `#1e3a2e` `#2f5a40` `#4a7a50`; Nội địa `#0e1e2e` `#16324a` `#1e4a5e` | Hồn hoàn theo `TIERS` (Trắng `#f3f3f3`, Vàng `#f2c84b`, Tím `#a253e0`, Đen `#8a6bff`, Đỏ `#e0303a`); đom đóm `#c8f07a`; mắt thú phát sáng; Nội địa `#5ae0d0` `#b0fff0` `#d0ff8a` | Ngọc bích `#2a9a7a` `#6ad0b0` (đã có ở Lưu Ly), tím linh `#7a4ab0` `#9a7ad0` cho phù văn / mạch khí |
| Tông môn (Học viện + Tiên Môn) | **45 : 55** | Nặc Đinh: gạch `#8a4a32` `#b0654a`, ngói xám `#4a5060` `#6a7080`; Thiên Đấu: ngà `#e8e0cc`, lam ngọc `#2a8a9a` `#5ac0c8` | Hồn hoàn trên trận truyền tống, ánh hồn lực trong cửa sổ đêm | Ngói lam `#2a4a7a`, đỏ son `#b0302a`, vàng kim `#e0b04a`, giấy ngà `#ece2c8`, lam lưu ly `#2a5ab0` (D, chỉ cho điện / học viện) |
| PvP / phụ bản | **60 : 40** | Đá xám `#5a5a62` `#8a8a92`, cát `#c8b08a`; Bí Cảnh xám lam | Đỏ son `#a02a20` `#d04a30` (đã có), hào quang võ hồn theo màu `col` | Phù văn quẻ vàng kim `#e0b04a`, ngọc `#6ad0b0` trên trụ |

### 3.3 Yếu tố hình ảnh

| | Đấu La (cốt lõi) | Tu Tiên (lớp nhấn) |
|---|---|---|
| Ánh sáng | **Hồn lực là nguồn sáng chính**: vòng hồn hoàn dưới chân, mắt hồn thú; tối đa ~10 nguồn gần camera | Khí vận / linh khí = **hạt trôi lên** cùng quy tắc hạt (≤ 50% mờ, ~150 hạt), **không** thêm nguồn sáng thứ hai |
| Năng lượng | Hồn Hoàn, hồn kỹ theo màu võ hồn | Phù văn khắc trên đá / trụ, vòng trận phát sáng ngọc (kiểu trận truyền tống đã có) |
| Sinh học / hoang dã | Đại ngàn, rễ khổng lồ, nấm phát quang, tầm gửi hồn lực, xương thú; kim loại kỳ huyễn (băng tinh, tinh thể tím, kim loại Nặc Đinh) | Mây linh khí thấp, suối ngọc, cầu mây |
| Kiến trúc | Học viện, đấu trường, tường thành đá | Ngói cong, đầu đao, chạm khắc cổ phong, đèn lồng (tự vẽ, không dùng gói Q37) |

### 3.4 Quy tắc giao thoa liền mạch (không chắp vá)
1. **Một nguồn sáng, một ngôn ngữ:** mọi thứ phát sáng đều là hồn lực / linh khí cùng màu họ (ngọc `#6ad0b0` cho linh khí tự nhiên; màu niên hạn cho hồn hoàn); cấm thêm màu phát sáng thứ ba (không đỏ lửa lam, Q41).
2. **Phù văn là chữ viết của hồn lực:** nét khắc dùng đúng 3 sắc độ ngọc; cùng một họa tiết trận truyền tống ở mọi bản đồ; khác bản đồ chỉ khác sắc nền, không khác kiểu nét.
3. **Chuyển tiếp theo vùng:** đi từ rừng (80:20) vào tông môn (45:55) qua **một bước trung gian** (cổng + trạm gác: gỗ, ngói thấp, đèn ngọc), không nhảy thẳng từ cây cổ thụ sang ngói vàng kim.
4. **Chi tiết Tu Tiên ở dưới mức đầu người, Đấu La ở tầm mắt:** phù văn / mây ở nền và chân vật; cổ thụ, thú, hồn hoàn ở trên: hồn sư luôn thấy hồn lực là chính.
5. **Mỗi vật mới chỉ có một "câu chuyện màu":** viết ở ghi chú nhập (`art/CREDITS.md`) màu nền, màu nhấn, nguồn sáng; không đạt thì không nhập. Mọi ảnh vẫn qua duyệt của chủ repo (Q17), ghi nguồn giấy phép ở `docs/art/nguon-giay-phep.md`.

## 4. Danh mục Assets độc đáo (Unique Asset Matrix)

Độ khó: **A** = chỉ client / bố cục, không đụng server; **B** = thêm logic server nhỏ, tái dùng tin có sẵn; **C** = cơ chế mới (lớp cản động / giao thức / cân bằng), cần AO review hoặc chủ repo quyết. Tên hằng *nghiêng* là đề xuất, thêm ở `shared/data.ts`.

| # | Tên | Chức năng gameplay | Đặc điểm thị giác | Tương tác người chơi | Ảnh hưởng server-authoritative | Khó | Nguồn ảnh |
|---|---|---|---|---|---|:-:|---|
| 1 | **Tán Linh Thụ** (cây mềm) | Chặn thị giác không chặn bước; thay cây lẻ | Tán rậm 3 sắc rêu, hạt linh khí ngọc thấp, mờ khi che hồn sư | Đi xuyên | Không (`gids.walk`, client khoét lỗ) | A | Nhập miễn phí (cây / bụi CC0) đổi tên theo quy ước, hoặc Codex vẽ |
| 2 | **Sương Mê Vụ** | Dày chiều sâu, che nhẹ tầm nhìn xa | Lớp sương xanh ngọc ≤ 50% mờ, trôi chậm | Không tương tác | Không | A | Vẽ bằng code (hạt) + 1 bản vẽ Codex |
| 3 | **Linh Bi Chỉ Lộ** (bia dẫn đường) | Mốc dọc dẫn tới cổng / vùng; hồn thú không đứng gần | Bia đá khắc phù văn, sáng theo màu niên hạn tầng tiếp | Đọc chú thích (hộp mô tả nhỏ) | Không (chỉ object Tiled `sign`) | A | Codex vẽ |
| 4 | **Hồn Hoàn Đăng** (đèn dẫn) | Mốc sáng dọc trục chính, ban đêm nổi | Đèn đá + vòng hồn hoàn xoay màu `TIERS` | Không | Không | A | Codex vẽ (vật) + code (vòng sáng) |
| 5 | **Hồn Lực Tầm Gửi** | Vùng hấp thụ chân khí: ngoài giao chiến, đứng gần tăng hồi hồn lực nhẹ | Tầm gửi phát sáng ngọc bám cổ thụ, hạt hút vào | Đứng cạnh (không bấm) | Server tick: cộng hồi **chỉ ngoài giao chiến**, trần mỗi phút; tên hằng *LINH_TAM_GUI* (đề xuất) | B | Codex vẽ |
| 6 | **Linh Tuyền Điểm** (suối ngọc) | Điểm nghỉ trên trục chính: hồi máu / hồn lực ngoài giao chiến nhanh hơn (không hơn vùng `safe`) | Hồ nhỏ ngọc, mây thấp, đá phù văn | Đứng trong vùng | Dùng đường hồi sẵn (`regenPlayer`) với hệ số vùng; *LINH_TUYEN* (đề xuất); không rơi đồ, không XP | B | Codex vẽ |
| 7 | **Phù Vân Kiều** (cầu mây) | Đường tắt qua khe / vực; bật khi dùng một hồn kỹ lướt vào bệ ("kiếm ý") | Cầu mây mờ ngọc hiện từng bậc trong vài giây | Lướt vào bệ → cầu mở N giây cho cả tổ đội gần | **Lớp cản động** ở server + dự đoán client; server kiểm khoảng cách, hồi, không bật khi có boss; *CAU_VAN_SECS* (đề xuất); luôn có đường vòng | C | Codex vẽ + code (hạt) |
| 8 | **Thạch Trụ Phong Ấn Hồn Cốt** | Trụ phá được để mở đường tắt vào bãi săn sâu | Trụ đá khắc xương phát sáng, nứt dần theo sát thương | Đánh thường / hồn kỹ vào trụ | Server giữ HP trụ, đóng góp như `credit`; tái sinh sau N giây; **không** rơi đồ; *TRU_PHONG_AN* (đề xuất); lớp cản động như #7 | C | Codex vẽ |
| 9 | **Cổ Đằng Đu** (dây leo vượt khe) | Vượt khe ≤ 4 ô nhanh hơn đi vòng | Dây leo sáng ngọc từ cổ thụ | Bấm F khi đứng cạnh | Server đặt vị trí theo đường cố định như `travel.ts`, không bất tử, hồi chiêu; chặn khi đang giao chiến | C | Codex vẽ |
| 10 | **Cọc Dịch Chuyển Ngắn** | Nối hai bờ khe / hai ngọn đồi trong cùng bản đồ | Hai cọc phù văn ngọc, cột sáng khi niệm | Đứng lên cọc, niệm ngắn | Tái dùng cơ chế niệm của `waypoint` (cùng luật hủy); không phí / phí rất nhỏ *CHOT_PHI* (đề xuất); không dùng được từ xa | C | Code (vòng trận như trận truyền tống) |
| 11 | **Bát Quái Trụ** (trụ quẻ) | Che chắn có chủ đích trong Đấu Hồn Trường | Trụ 2×2 khắc quẻ, sáng theo màu võ hồn gần nhất | Né / ẩn sau trụ | Chỉ ô chặn tĩnh trong file Tiled (không logic mới) | B (vì động PvP) | Codex vẽ |
| 12 | **Thái Cực Đài** | Tâm sân, tinh anh Bí Cảnh ra ở đây; trang trí | Đá thấp âm dương, vòng phù văn | Đi lên (không buff) | Không | A | Codex vẽ |
| 13 | **Bãi Lội Linh Tuyền** (nước nông) | Làm chậm nhẹ khi băng qua, thay nước sâu chặn cứng ở suối | Nước nông trong, đá lát | Đi qua | Có thể dùng trạng thái làm chậm có sẵn (`slow`); *BAI_LOI_CHAM* (đề xuất); chủ repo quyết có làm chậm hay không | C | Nhập miễn phí ô nước nông |
| 14 | **Cổng Động Phủ** | Cổng tới Bí Cảnh có bố cục rõ, nhận ra ngay | Cổng đá khắc phù, mây thấp | Bước vào (như `portal`) | Không đổi: dùng `portal` / vé như mục 5.22 | A | Codex vẽ |

Ghi chú: asset có "Nhập miễn phí" phải qua duyệt ảnh (Q17) và đổi tên theo quy ước (`fx_*`, `vat_*`...). Tránh phá cân bằng: #5, #6, #13 chỉ hồi / làm chậm **ngoài giao chiến**, không rơi đồ, không XP, không đứng treo tự săn để lợi; thử bằng `npm run bot:local` và soát `balance-review` trước khi bật.

## 5. Lộ trình triển khai

### 5.1 Nguyên tắc
- **Thí điểm trên MỘT bản đồ:** **Tinh Đấu Ngoại vi** (nghẽn nhất ở mọi chỉ số 0.2: ngang TB 3,55; 33,4% hành lang ≤ 2 ô; 25,1% khoảng mở; 36 cổ chai; 2181 ô sau cổ chai). Cũng là bản đồ thứ hai người chơi gặp, và cuối trục dẫn vào Nội địa, nên cải thiện nhìn thấy ngay.
- Mỗi việc một nhánh / PR. Issue đã tạo sau khi chủ repo duyệt bản thiết kế (mã việc Lx và số issue ở cột đầu). L0 và L1 (loại A, tiền đề của thí điểm) đã mở sẵn cho worker; L2 trở đi chờ chủ repo. **A:** tự merge khi CI xanh; **B:** chủ repo xem trước ảnh / số đo; **C:** chủ repo quyết (thiết kế hoặc cân bằng); việc rủi ro (SQL, chống gian lận, `MapRoom`, giao thức) thêm `ao review`.

### 5.2 Danh sách issue đề xuất (theo thứ tự ưu tiên tác động / rủi ro)

| # | Việc (một PR) | Làn | Loại | Phụ thuộc | Ghi chú |
|---|---|---|:-:|---|---|
| L0 (#1658) | Đưa script đo vào `tools/maps/do-luong.mjs` (in bảng 0.2, xuất PNG bề ngang); soát `spawn.ts` có sinh thú trong ô sau cổ chai không | code | A | – | Không đổi dữ liệu; chưa vào `npm run check` |
| L1 (#1659) | Bài bot đường đi `pathflow` (bot đi trại hồi sinh → từng mốc, đo giây + số lần đứng lại > 1 giây + kẹt) cho mọi bản đồ săn | code | A | L0 | Làm baseline trước / sau |
| L2 (#1660) | Bộ dựng `tools/maps`: tùy chọn "cây lẻ → vật mềm" (cụm ≤ 3 ô đổi sang gid trong `gids.walk`) + sửa kẹt chéo; **chỉ bật cho Ngoại vi** | code | B | L0 | Không cần ảnh mới (dùng `vat_deco`, `vat_nam`). Xem trước ảnh trước / sau |
| L3 (#1661) | Bộ dựng: "hành lang chính" (nới đường mốc → ≥ 5 ô, gỡ cây / đá nhỏ quanh đường) cho Ngoại vi | code | B | L2 | Mô phỏng ở 5.3: ~215 ô cây |
| L4 (#1662) | Cảnh báo ngưỡng chỉ tiêu 1.1 trong `npm run check` (chỉ cảnh báo, không đỏ) | code | A | L0 | Sau L2/L3 có số thực |
| L5 (#1663) | Nhân rộng L2 + L3 sang Nội địa, Lạc Nhật; soát Cực Bắc (640 ô sau cổ chai), Hải Thần Đảo, Thiên Đấu Thành (cổ chai tường) | code | A | duyệt L2/L3 | Mỗi bản đồ một PR |
| L6 (#1664) | Asset client-only: Tán Linh Thụ, Sương Mê Vụ, Linh Bi, Hồn Hoàn Đăng, Thái Cực Đài, Cổng Động Phủ | art + code | A / B | L2 | Nhập miễn phí hoặc Codex vẽ; duyệt từng ảnh (Q17) |
| L7 (#1665) | Bát Quái Trận cho Đại Đấu Hồn Trường (+ trụ phù văn Luyện Hồn Cảnh) | code | B | L1 | Chạy bot đấu trường, kiểm cân bằng bên A / B |
| L8 (#1666) | Lớp Tiên Môn lơ lửng cho Nặc Đinh Thành / Thiên Đấu Thành (nền mây, cầu, đảo mây: trang trí + `gids.walk`) | art + code | B | L6 | Chỉ nhìn, không đổi lối đi |
| L9 (#1667) | Vùng hồi: Hồn Lực Tầm Gửi, Linh Tuyền, Bãi Lội (có làm chậm hay không) | code | C | L5 | Thêm hằng ở `shared/data.ts`; soát cân bằng và tự săn |
| L10 (#1668) | Lớp cản động + Phù Vân Kiều, Thạch Trụ Phong Ấn | code | C | L9 | Server + dự đoán client + giao thức; `ao review`, bot `bigmap` |
| L11 (#1669) | Cổ Đằng Đu, Cọc Dịch Chuyển Ngắn (vượt khe) | code | C | L10 | Dùng cơ chế niệm / vị trí của `travel.ts` |
| L12 (#1670) | Luật đã chuyển; còn cập nhật tình trạng sau L2–L5 (`docs/design/the-gioi-ban-do.md`, `docs/tech/phong-ban-do.md`) | docs | A | L2–L5 | Chuyển chỉ tiêu 1.1 thành luật hiện hành; sửa chỗ bài này trỏ |

### 5.3 Mô phỏng quy tắc trên bản đồ thật (kết quả đo, chưa sửa file nào)

| Bản đồ / bước | Chặn cứng % | Ô ≤ 2 ngang % | Khoảng mở ≥ 5×5 % | Kẹt chéo /1000 | Ngõ cụt /1000 | Ô cổ chai 1 ô trên tuyến | Ngang hẹp nhất tuyến TB | Đi bộ TB (giây) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **Ngoại vi: hiện tại** | 27,5 | 33,4 | 25,1 | 30,7 | 31,5 | 48 | 2,8 | 24,8 |
| + R1 cây lẻ → mềm (3449 ô) | 19,5 | 8,2 | 81,7 | 4,1 | 12,2 | 9 | 4,3 | 24,3 |
| + R2 hết kẹt chéo (144 ô) | 19,2 | 7,9 | 81,5 | 1,1 | 8,6 | 13 | 4,3 | 24,3 |
| + R3 hành lang chính ≥ 5 (215 ô) | **18,7** | **7,5** | **82,5** | **1,3** | **8,1** | **5** | **4,6** | **24,0** |
| Nội địa: hiện tại → R3 | 28,0 → 20,7 | 22,2 → 4,5 | 37,5 → 89,4 | 22,3 → 1,4 | 20,2 → 4,9 | 36 → 0 | 3,0 → 4,9 | 23,5 → 22,9 |
| Lạc Nhật: hiện tại → R3 | 21,1 → 13,1 | 23,0 → 4,6 | 37,7 → 89,5 | 23,3 → 0,5 | 20,1 → 4,8 | 19 → 2 | 3,0 → 5,1 | 23,2 → 22,7 |

(Ghi chú đọc: R1 chỉ gỡ cây thuộc cụm ≤ 3 ô cách biên ≥ 4 ô; R2 gỡ một ô của cặp chéo; R3 gỡ cây trong bán kính 2 ô quanh tuyến từ trại hồi sinh tới mọi mốc. "Gỡ" nghĩa là chuyển sang **vật mềm**: vẫn vẽ ra, chỉ không chặn; chưa đo bằng ảnh nên chưa biết rừng còn "rậm" tới đâu, vì vậy cần xem trước ở L2.) R3 chưa đủ ngang 5 ô ở mọi nơi vì chỉ dọn quanh đường ngắn nhất; L3 sẽ dựng hành lang có chủ đích, không chỉ nới đường A*.

### 5.4 Cách kiểm đo trước / sau
- **Bảng chỉ số 0.2** chạy lại trên bản dựng mới (cùng script, cùng định nghĩa); chốt đạt khi Ngoại vi vượt **mọi** chỉ tiêu 1.1 cột Dã ngoại, và các bản đồ khác không xấu đi.
- **Bài bot `pathflow` (L1):** bot đi trại hồi sinh → từng mốc; ghi thời gian, số giây đứng yên, số lần tính lại đường; so trước / sau trong cùng seed. Tiêu chí đạt: 0 lần kẹt thật, không mốc nào thời gian tăng > 5%, số lần đứng yên > 1 giây giảm ≥ 80%.
- **Tự săn:** `autopath-test` + bài bot tự săn trên Ngoại vi; số lần "chống kẹt" (#628) phải giảm.
- **Ảnh xem trước:** ảnh isometric `map:preview` trước / sau cùng góc; chủ repo duyệt độ "rậm" (loại B).
- **Quét chặn:** `quet-chan.mjs` phải sạch (vật mềm vẽ nhưng không chặn phải khai ở `gids.walk`, nếu không bị báo lỗi `vật`).

### 5.5 Rủi ro và việc chủ repo cần quyết
1. **Cảm giác rừng:** gỡ 1/3 ô chặn có thể làm rừng "thưa" trong mắt; cần ảnh trước / sau (L2). Phương án nhẹ: chỉ gỡ cây lẻ **cạnh hành lang chính** trước, giữ cây lẻ giữa bãi.
2. **Hồn thú:** mật độ `BEAST_DENSITY` nhân diện tích đi được; mở diện tích đi được sẽ **tăng số thú**; cần giữ tổng số con (chỉnh hệ số bố cục, không sửa mật độ) hoặc chấp nhận tăng. Chủ repo quyết.
3. **Bot cũ / vị trí đã lưu:** vị trí lưu kèm tên file Tiled (mục 5.3 "Vị trí khi đăng xuất"); đổi bố cục đổi file → người đang đứng ở ô nay mềm vẫn hợp lệ, nhưng bản đồ ×8 đổi hạt giống / bố cục phải kiểm `standable`.
4. **Lớp cản động (L10):** đụng dự đoán client và `MapRoom`; không làm trước khi L2–L5 xong và có số đo.
5. **Giới hạn của số đo này:** chỉ số hình học, chưa có log kẹt thật hay bản ghi vị trí người chơi; bề ngang đo theo hộp vuông (hơi nghiêm hơn đường chéo); mốc `npc` bỏ khỏi tuyến.
