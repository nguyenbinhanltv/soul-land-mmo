# Mỹ thuật: quy cách isometric

### 5.11 Mỹ thuật: đồ họa isometric, hồn sư, võ hồn, hồn thú
Pixel art **isometric** (ô thoi 2:1, 8 hướng, nhìn chéo từ trên xuống). **Server không đổi:** vị trí, va chạm, tầm chiêu tính trên tọa độ thế giới Descartes (`TILE` = 16, `shared/move.ts`); chỉ client chiếu khi vẽ (mục 6 "Hiển thị isometric phía client"). Key chưa có ảnh thật được vẽ bằng code cùng key và bố cục khung. Mục này chỉ ghi quy tắc. Bố cục sheet, bảng animation, ánh xạ khung phụ thể, điểm neo, dạng phụ thể từng võ hồn, quy ước key và thư mục ở `tools/assets/README.md`; tham số công cụ và quy trình làm ảnh ở skill `asset-gen`.

**Phép chiếu và màn hình**
- **Một ô logic 16×16 pixel thế giới vẽ thành một thoi 32×16 pixel màn hình:** `sx = x − y`, `sy = (x + y) / 2`; chiều ngược `x = sy + sx / 2`, `y = sy − sx / 2` (`client/src/iso.ts`, hằng hiển thị, không phải số cân bằng). Không dùng thoi 64×32 cho một ô: ở 640×360 chỉ thấy khoảng 7 ô mỗi bên, ít hơn tầm chiêu xa nhất. Vùng rộng cùng địa hình dùng **ô lớn 64×32** phủ 2×2 ô logic; lưới logic không đổi.
- **Độ phân giải nội bộ 640×360** (`VIEW_W` × `VIEW_H`), phóng số nguyên lớn nhất vừa cửa sổ (×2 ở 720p, ×3 ở 1080p, ×4 ở 1440p), không phóng lẻ; Phaser `pixelArt`, `roundPixels`.
- Đi thẳng lên màn hình trông chậm hơn đi ngang (đặc tính phép chiếu 2:1); không bù bằng tốc độ ở server.

**Sắp lớp theo độ sâu**
- Thứ tự vẽ: nền đất → vùng báo trước, vòng dưới chân, bóng → vật đứng (hồn sư, hồn thú, NPC, đồ rơi, cây, nhà) theo **độ sâu `x + y` của điểm chân** → chữ, thanh máu → HUD. Vật cao nhiều ô được cắt thành **lát dọc rộng 16 pixel**, mỗi lát mang độ sâu của mép trước chân vật tại cột đó.
- Vật cao che hồn sư của chính mình thì khoét **lỗ elip quanh thân** và mờ nhẹ (chỉ có Canvas thì chỉ mờ); hồn thú trong tầm nhìn cũng được khoét lỗ theo cỡ thân để rừng rậm không che mất. Hồn sư khác vẫn thấy bình thường. **Bóng** là elip 2:1 màu `#1a1020` khoảng 35% dưới chân, client vẽ.

**Ánh sáng và chiều sâu** (`client/src/lighting.ts`; cách làm ở `tools/assets/README.md` mục "Ánh sáng và thời tiết")
- **Light2D + normal map** (WebGL). Mỗi bản đồ có màu môi trường (`ambient`) ngày / đêm theo bảng các vùng (phong cách B), thay lớp `vignette` cũ (thuộc tính `vignette` trong file Tiled không còn dùng). Nguồn sáng theo phong cách A: vòng hồn hoàn dưới chân hồn sư, mắt hồn thú, hồn kỹ, hồn hoàn rơi trên đất là chính; lửa trại, đèn lồng, nấm phát quang, băng tinh, ánh cửa nhà ban đêm, mặt nước phát sáng yếu hơn; tối đa khoảng 10 nguồn cùng lúc gần camera (máy cảm ứng ít hơn), ưu tiên hồn lực rồi gần camera, xa thì bỏ.
- Trên nền và vật đứng ánh sáng tắt dần theo elip 2:1 (đúng phép chiếu). Thực thể (hồn sư, hồn thú, NPC) được kéo màu môi trường về phía trắng để ban đêm vẫn nổi. Ban ngày đèn yếu hơn ban đêm.
- Không nguồn sáng nào làm mặt đất trắng xóa (tổng ánh sáng có trần); nhiều vòng hồn hoàn cùng chỗ thì cộng dồn có trần; tuyết, cát giảm cường độ đèn khoảng một nửa (hệ số từng vùng).
- Ánh sáng nền vẽ sẵn trong sprite vẫn **từ trên bên trái**; Light2D chỉ thêm sáng tối cục bộ, không đổi hướng sáng chính.
- **Normal map tự sinh** bằng `tools/assets/normal.mjs` cho mọi sprite và ô (file cạnh ảnh gốc, thêm `_n`); mọi ô nền và vật đứng mới đều phải có `_n.png`. Normal map do công cụ AI vẽ chỉ dùng cho vài vật đặc biệt khi bản tự sinh không đạt.
- **Tắt sạch** khi chỉ có Canvas, khi WebGL chạy bằng CPU (trình duyệt chặn GPU) hoặc `?light=0`; đang chơi mà khung hình thấp kéo dài thì tự tắt và báo trong khung tin (`?light=1` để luôn bật). Tắt ánh sáng vẫn chơi được bình thường.

**Phong cách**
- **A. Hồn Hoàn Chiếu Sáng:** nền, cây, nhà **trầm, hơi khử màu** (bão hòa khoảng một nửa). Màu và ánh sáng mạnh đến từ **hồn lực**: vòng hồn hoàn dưới chân (`glow` của `TIERS`), **mắt hồn thú sáng đúng màu niên hạn**, hồn kỹ và vùng chiêu theo màu võ hồn (`col`); lửa trại, đèn lồng, nấm phát quang yếu hơn và ít hơn.
- **B. Mỗi Vùng Một Sắc:** mỗi bản đồ một màu chủ đạo, ánh sáng ngày / đêm, thời tiết, hạt bay (bảng dưới; màu nhấn ở `art/palettes/<mapId>.gpl`). Ngày / đêm chỉ ở client, theo giờ Việt Nam (06:00–18:00 là ngày), không ảnh hưởng luật.
- **C. Thủy Mặc Pixel** cho giao diện (token màu niên hạn / độ hiếm lấy từ `TIERS` ở `uiArt.ts`, thang chữ 10 / 12 / 24, ô / tab / thanh / chú thích dùng chung ở `style.css` và `tooltip.ts`): cuộn giấy ngà mép mực loang, nút chính là ấn triện đỏ son, chữ mực trên giấy (chữ màu sáng có viền mực 1 điểm), bảng màu `art/palettes/_thuy_mac.gpl`. Trong lúc đánh giao diện chỉ nằm ở mép màn hình; hộp thoại NPC chỉ mở ngoài giao chiến và làm tối cảnh nhẹ. **Font phải đủ dấu tiếng Việt:** Galmuri (OFL, Galmuri 11 nét 12 px / Galmuri 9 nét 10 px, thay Ark Pixel ở bước UI-0) nhúng trong client (12 biểu tượng Galmuri thiếu lấy từ subset Ark Pixel, OFL), chỉ dùng cỡ bội số nguyên, phân cấp bằng cỡ / màu / viền chữ, không chữ đậm giả; chữ trong cảnh Phaser là Be Vietnam Pro; trang thử `?thu=font`. Giao diện HTML phóng theo `--u` (bước UI-6): bảng **Cài đặt** có mục **Cỡ giao diện** (Tự động / 75 / 100 / 125 / 150%, lưu `localStorage`); Tự động = cỡ cửa sổ so với 1280×720 chia 1,5 làm tròn tới 0,5, tối thiểu 1 (1080p → 1×, 1440p → 1,5×, 4K → 2×, không nhảy gấp đôi). Bố cục chọn theo kích thước logic (cửa sổ chia `--u`) bằng lớp `ui-w640` / `ui-w420` / `ui-h500` / `ui-portrait` trên `body` thay `@media`; cột trái / cột phải / dải dưới xếp theo dòng chảy nên panel không chồng nhau; điện thoại dọc xếp chat, đội hình, hồn kỹ chồng lên nhau. Chạm: mọi nút ≥ 40×40, chú thích giữ 7 giây. Chữ ≥ 4,5 : 1; độ hiếm / niên hạn có số chấm (ô) hoặc số La Mã (chip), buff + / debuff –, không chỉ dựa vào màu. **Thanh kỹ năng** (hồn kỹ U I O P, hồn cốt Z X C, Chân Thân R, Dung Hợp G) và thanh đội hình 1–4 dùng `.ui-cell`: viền màu hồn hoàn của vòng gắn (hồn cốt theo số năm), hồi chiêu quét tròn kèm số giây (dưới 3 giây có 1 chữ số thập phân), nháy một lần khi vừa hồi xong, ô mờ kèm dấu `!` khi hồn lực dưới tiêu hao (số tính ở client để báo, server vẫn kiểm lại), ô khóa ghi "Vòng N"; lý do (thiếu hồn lực, chưa mở vòng) ở dòng cuối chú thích. Khung mục tiêu hồn thú: chân dung, tên, chip niên hạn, cấp, thanh máu có số, trạng thái.
- **D. Lưu Ly Bảo Quang** cho chỗ sang trọng (khung thẻ võ hồn, học viện, cung điện, khán đài vua, hiệu ứng tuyệt kỹ / Chân Thân): kính màu ghép mảnh, đường chì và viền vàng kim, bảng `art/palettes/_luu_ly.gpl`. Không dùng cho vật thường.

**Bảng các vùng** (bản gọn; bảng đầy đủ với `mapId`, thời tiết và hạt bay tách cột, chi tiết ngày / đêm, nguồn của `lighting.ts` / `weather.ts`, ở `tools/assets/README.md` mục "Bảng các vùng đầy đủ")

| Bản đồ | Màu chủ đạo | Ngày / đêm | Thời tiết, hạt bay | Vật đặc trưng |
|---|---|---|---|---|
| Thánh Hồn Thôn | Nắng mật, lục non | Nắng ấm / cam ánh bếp | Quang; khói bếp, bồ công anh | Ruộng lúa, mái rạ, rào tre, Lam Ngân Thảo |
| Nặc Đinh Thành | Gạch đỏ đất, ngói xám | Trung tính / đèn lồng đỏ | Quang; khói, lá rơi thưa | Tường thành, chợ, học viện sơ cấp |
| Tinh Đấu Ngoại vi | Lục rêu sâu | Nắng lốm đốm / lam thẫm | Sương sớm; đom đóm, lá rơi | Cổ thụ, suối rừng, nấm phát quang thưa |
| Tinh Đấu Nội địa | Xanh thẳm lam lục | Tối như chiều / lam đen | Sương độc tím, sấm ở Lôi Cốc; bào tử phát quang | Nấm phát quang lớn, dây leo, đầm độc |
| Thiên Đấu Thành | Trắng ngà, lam ngọc, vàng kim | Sáng / đèn vàng | Quang; cánh hoa, cờ bay | Cung điện, học viện (lưu ly), chợ, bến thuyền |
| Lạc Nhật Sâm Lâm | Đỏ cam hoàng hôn, tím than | Luôn hoàng hôn | Gió nhẹ; lá đỏ / cam rụng | Cây lá đỏ, hoa độc, đầm Bích Lân, suối Băng Hỏa |
| Cực Bắc Chi Địa | Băng lam, trắng lạnh | Trắng chói / lam đen, cực quang | Tuyết, bão dày dần về bắc | Thông tuyết, băng tinh, khe băng, hồ băng |
| Hải Thần Đảo | Ngọc lam, vàng | Nắng biển / sóng phát quang | Gió biển, mưa ở Ma Quỷ Hải Vực; bọt sóng | San hô, đá ngầm, cát vàng, đền Hải Thần |
| Lõi Tinh Đấu | Tím than, lam hồ thần | Luôn đêm, hồ phát sáng | Sương mù; hạt hồn lực trôi lên | Hồ trung tâm, đá cổ, rễ khổng lồ |
| Đại Đấu Hồn Trường | Đá xám, vàng kim, đỏ son | Luôn sáng đuốc | Quang; bụi cát, giấy hoa khi thắng | Sàn đấu, khán đài, khán đài vua (lưu ly) |
| Luyện Hồn Cảnh | Xám lam, vàng nhạt | Sảnh đá kín | Quang; linh khí, tàn sáng rất thưa (tắt khi Thấp / Giảm chuyển động) | Sảnh đá, dấu sóng và tinh anh |

**Độ tương phản**
- **Nền:** độ sáng trung bình 25–55% (tuyết, cát tới 75%), bão hòa thấp; không điểm trắng hay màu bão hòa cao trên ô nền (dành cho hồn lực).
- **Thực thể:** viền ngoài `#1a1020`; trên nền tối, hồn thú / hồn sư thêm **viền sáng 1 pixel** (màu niên hạn / `glow` của vòng cao nhất) khi độ sáng thân chênh nền dưới 25%.
- **Vùng báo trước của hồn thú** luôn đỏ (`TELE_COL` trong `GameScene.ts`), viền nhấp nháy, nền tối đa 30% (Lạc Nhật thêm vạch trắng); **vùng chiêu của người chơi** theo màu võ hồn, không đỏ thuần.
- Hạt bay, thời tiết mờ tối đa 50%, vẽ dưới chữ và thanh máu, khoảng 150 hạt; giảm một nửa khi đánh thú vương / boss (máy cảm ứng giảm thêm); lệnh chat `/hat` bật / tắt (lưu trên máy). Cách làm (`client/src/weather.ts`) ở `tools/assets/README.md`.

**Bảng màu**
- Bảng chung `art/palette.gpl`, bảng nhấn từng vùng `art/palettes/<mapId>.gpl` (asset của một vùng chỉ dùng bảng chung + bảng vùng đó), bảng giao diện `_thuy_mac.gpl`, `_luu_ly.gpl`. Màu hồn hoàn lấy `col` / `glow` của `TIERS`, không chép mã màu. Được thêm màu chủ đạo võ hồn (`col`, `robe` trong `VOHON`) cùng tối đa 1 sắc tối, 1 sắc sáng suy ra. Ô nền theo bảng chung rồi nhân màu môi trường của vùng lúc vẽ, nên một bộ ô dùng cho nhiều vùng.

**Quy tắc vẽ**
- Mỗi vùng màu 3 sắc độ (tối, gốc, sáng); sắc thứ 4 chỉ cho kim loại và phát sáng.
- **Viền ngoài `#1a1020`** (không đen tuyền) cho nhân vật, hồn thú, vật đứng, không khử răng cưa; **ô nền không viền**. Võ hồn, hồn thú màu tối phải có viền sáng hoặc hào quang.
- Bóng, vòng hồn hoàn, aura, mắt phát sáng của hồn thú, hiệu ứng lớn (kiếm trận, lãnh vực) do client vẽ, không vẽ vào sprite.

**8 hướng**
- Hướng màn hình `s`, `se`, `e`, `ne`, `n`, `nw`, `w`, `sw`: **vẽ 5 hướng `s`, `se`, `e`, `ne`, `n`; `sw`, `w`, `nw` lật ngang** `se`, `e`, `ne` cho mọi lớp cùng lúc (vũ khí đổi tay khi lật, chấp nhận).
- Client tự suy hướng 8, không cần server: chính mình theo phím, người khác và hồn thú theo chuyển động nội suy, tin `fx` có `dx, dy` khi đánh.

**Cỡ khung** (gốc là điểm chân)

| Asset | Khung | Ghi chú |
|---|---|---|
| Hồn sư, NPC phụ | 64×64, gốc (32, 58) | Người cao khoảng 50–54, thân rộng khoảng 1 thoi |
| Phụ thể võ hồn | 96×96, gốc (48, 74) | Khung thân mở rộng 16 mỗi phía |
| Hồn thú Trắng, Vàng / Tím, Đen / Đỏ | 64 / 96 / 128 | Gốc giữa đáy; tinh anh phóng sprite loài gốc |
| Tà hóa thú vương / boss thế giới | 160 / 192 | Vẽ ở cỡ thật (client không phóng thêm theo bậc khi khung cao ≥ 160: `spriteRankScale`); chưa có thì phóng loài gốc |
| Chân dung võ hồn / NPC | 64×64 / 112×112 | Tối đa `PORTRAIT_MAX_COLORS` màu |
| Chân dung hồn thú (khung mục tiêu) | 64×64 | Nền trong suốt, tối đa `PORTRAIT_MAX_COLORS` màu |
| Thẻ võ hồn | 96×152 | |
| Huy hiệu hệ, trạng thái / vật phẩm | 24×24 / 32×32 | |
| Ô nền / ô lớn | Thoi 32×16 / 64×32 | |

## Issue liên quan
#350 (UI-0, font Galmuri), #356 (UI-6, cỡ giao diện).
