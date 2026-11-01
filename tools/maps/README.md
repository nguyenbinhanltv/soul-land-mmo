# Công cụ dựng bản đồ lớn (`tools/maps`, bước 11.3)

Sinh file Tiled `shared/assets/<out>` từ **mô tả bố cục** `tools/maps/layouts/<mapId>.json` và **lớp chỉnh tay** `tools/maps/hand/<mapId>.json` (nếu có). Cùng bố cục, cùng hạt giống, cùng lớp tay thì ra **đúng cùng một file** (chỉ dùng phép nguyên và băm, không `Math.random`); `npm run check` sinh lại trong bộ nhớ và báo lỗi nếu file trong repo khác. File ra cùng định dạng với `tools/gen-map.mjs` (lớp `ground`, `trees`, `zones`, `canopy`), server và client đọc như cũ. Luật object (vùng, cổng, tinh anh, hang, truyền tống trận) ở `GAME_DESIGN.md` mục 6 "File Tiled mỗi bản đồ".

Chỉ dùng gid có trong `shared/assets/iso/tiles.json` (bộ `"*"` và bộ của `mapId`); vật / ô mới chỉ là dòng ánh xạ tới ảnh đã có, không cần ảnh mới.

## Lệnh

```bash
npm run map:build -- tinh_dau_ngoai_vi                     # sinh file Tiled (không ghi mapId: mọi bố cục)
npm run map:build -- tinh_dau_ngoai_vi --preview top.png   # kèm ảnh nhìn thẳng: màu theo gid, viền mảnh vùng theo tầng, cổng / trận / tinh anh / hang
npm run map:build -- tinh_dau_ngoai_vi --seed 7            # thử hạt giống khác (ghi đè file; muốn giữ thì sửa "seed" trong bố cục)
npm run map:build -- --check                               # so file trong repo với bản sinh (npm run check, pre-commit)
npm run map:build -- tinh_dau_ngoai_vi --hand-init         # tạo lớp chỉnh tay rỗng
npm run map:preview -- shared/assets/tinh_dau_ngoai_vi.v2.json toan-canh.png --scale 0.25 --tint "#eef4dc"
                                                           # ảnh toàn cảnh isometric bằng ảnh ô / vật thật (không có mép, nhà, ánh sáng)
```

**Ảnh nền bản đồ nhỏ** (R1 #428): mỗi lần sinh file Tiled, công cụ ghi thêm `shared/assets/mini/<mapId>.png` (`MINI_BASE` ở `shared/data.ts`: 2 điểm ảnh mỗi ô, nên rộng = số ô × 2). Màu đất / rừng lấy trung bình ảnh ô isometric trong `tiles.json` (đúng bảng màu từng vùng), pha sắc giấy, nhiễu loang, sắc nhẹ theo tầng niên hạn (làm nhòe giữa các tầng); đường nâu sáng, suối lam nhạt viền mực mảnh, vách mực đậm, nhà / tường thành / tàn tích viền mực 1 điểm. Code ở `lib/mini.mjs`; `--check` so từng điểm ảnh (không so byte PNG vì zlib khác phiên bản). Lớp chỉnh tay cũng vào ảnh.

Bản dựng lại của một bản đồ đang có ghi ra `<mapId>.v2.json` và là bản **mặc định** khi có file (11.5); đường lùi: server bật `MAP_V1=<mapId>` (danh sách cách nhau dấu phẩy, `all` = mọi bản đồ) thì dùng lại bản cũ `<mapId>.json`. Server báo tên file cho client qua `MapState.mapFile`. Bot chạy cùng `MAP_V1` với server để đọc đúng file (`BOT_ONLY=bigmap` chỉ chạy phần bản đồ lớn: mọi bản ×8).

## Quét vật vẽ lệch ô chặn (#747)

`node tools/maps/quet-chan.mjs [mapId…]` (có trong `npm run check`): so vật VẼ ở từng file Tiled với lưới ô chặn `collides` (`shared/move.ts`), in danh sách lệch `file [loại] ghi chú: tx,ty` và thoát mã 1 nếu có. Loại: `nhà` (chân nhà / tường cung uyển vẽ mà ô không chặn), `vật` (gid lớp `trees` có vật vẽ nhưng không chặn, và không thuộc `gids.walk` / `plant` của bố cục), `ma` (ô chặn mà vật không có ảnh công khai). Bộ dựng gỡ nhà bị `clearRect` (cổng, điểm đến, waypoint) khoét thành hình chữ L; sửa lệch bằng bố cục, tileset `collides` (qua bộ dựng) hoặc `gids.walk` nếu cố ý đi xuyên.

## Đo luồng di chuyển (L0 #1658)

`npm run map:luong [-- mapId… --tuyen --sinh --png <thư mục> --json]` (chỉ đọc): in bảng chỉ số phần 0.2 của bản thiết kế cải tổ luồng di chuyển bản đồ (PR #1656) cho 11 bản đồ: tỷ lệ chặn, bề ngang ô trung bình (cắt ở 14), % ô đi được trong khe ≤ 2 ô và trong khoảng trống ≥ 5×5, kẹt chéo và ngõ cụt /1000 ô, số ô sau khe 1 ô, và (từ trại hồi sinh tới từng cổng / truyền tống trận / tinh anh / hang, bỏ mốc dưới 20 ô) số đoạn cổ chai, bề ngang tuyến rộng nhất, giây đi bộ. `--tuyen` in từng tuyến; `--sinh` soát chỗ sinh hồn thú theo đúng luật `spawn.ts` (hộp 12×8 px, ngoài vùng an toàn và `SPAWN_CLEAR`) nằm ở ô khe 1 ô / sau khe; `--png` xuất ảnh bề ngang ô (đỏ hẹp → xanh rộng); `--json` để so trước / sau. `--canh-bao [--strict]` chỉ in bản đồ vượt chỉ tiêu bố cục mục 1.1 theo loại map (`MapKind`: hunt = dã ngoại, town = tông môn / thành, boss / arena = PvP / phụ bản; ngưỡng ở `lib/nguong.mjs`, hành lang chính / đường nhánh chưa kiểm): `npm run check` gọi lệnh này (~0,4 giây), chỉ cảnh báo, thoát 0; `--strict` hoặc `LUONG_STRICT=1` thì thoát 1 (bật sau L5). Hàm đo thuần ở `lib/luong.mjs`, kiểm thử `npm run test:luong`. Các cột về lưới khớp bảng 0.2 trong ±0,1; các cột theo tuyến chỉ cùng thứ tự độ lớn (bộ tuyến của script gốc không còn).

## Chỉnh tay

1. `npm run map:build -- <mapId> --hand-init` tạo `tools/maps/hand/<mapId>.json`: hai lớp tham khảo đã khóa (`tham_khao_nen`, `tham_khao_vat`, bản đang sinh) và hai lớp rỗng `tay_nen`, `tay_vat`.
2. Mở bằng Tiled, chỉ vẽ vào `tay_nen` (đè ô nền) và `tay_vat` (đè vật: cây, đá, vách…). Ở `tay_vat`, vẽ một **gid nền** (ví dụ gid 1, cỏ) nghĩa là **xóa vật** ở ô đó.
3. Chạy lại `npm run map:build -- <mapId>`. Lớp tay áp sau cùng, trước bước nối thông, nên đổi hạt giống / bố cục vẫn giữ chỗ đã sửa. Không sửa thẳng file trong `shared/assets` (bị ghi đè, `--check` báo lỗi).

Object (vùng, cổng, trận, tinh anh, hang) sửa trong bố cục JSON.

## Bố cục (`layouts/<mapId>.json`)

Tọa độ theo **ô logic** (16 pixel). Mẫu đầy đủ: `layouts/tinh_dau_ngoai_vi.json` (rừng, suối, vách, tàn tích); đầm và hồ: `tinh_dau_noi_dia.json`, `lac_nhat_sam_lam.json` (hồ băng / hồ lửa bằng `area` có `gid`); băng tuyết, bản đồ dọc: `cuc_bac_chi_dia.json`; đảo giữa biển, cầu tàu, đền: `hai_than_dao.json`; thành trấn (tường thành, khu nhà, công trình `build.compounds`): `nac_dinh_thanh.json`, `thien_dau_thanh.json`; làng an toàn giữa bản đồ săn, ruộng: `thanh_hon_thon.json`; bản đồ giữ cỡ (sàn boss thế giới `worldBoss` với mã trong `MAPS.world`, sân đấu): `loi_tinh_dau.json`, `dai_dau_hon_truong.json`.

| Khóa | Nghĩa |
|---|---|
| `map`, `out`, `size`, `seed` | `mapId` (phải có trong `MAPS`), tên file ra trong `shared/assets`, `[rộng, cao]`, hạt giống |
| `blend` | Mép tầng loang: rừng, nền, loài cây theo tầng của ô lệch tối đa `blend` ô theo nhiễu (vùng hồn thú vẫn đúng hình); mặc định 0 |
| `border` | Viền bản đồ là loại nền ướt này (ví dụ `"deep"` cho đảo giữa biển) thay vì cây |
| `zoneCell` | Cỡ lưới thô (ô) khi tách hình vùng thành chữ nhật (server chỉ đọc vùng chữ nhật); mặc định 10 |
| `gids.ground` | Loại nền → gid: `grass` ([sắc 1, sắc 2]), `leaf` (thảm lá), `moss` (rêu), `path`, `pathDark`, `camp`, `pave` / `crack` (sân đá tàn tích), `water` (suối, chặn), `ford` (chỗ lội, đi được), `bank` (bờ), `deep` (lòng ao, chặn), `stony` (nền đá mặt vách), `glow` (rêu quanh điểm nhấn), `bridge` |
| `gids.objects` | Loại vật → gid (hoặc danh sách / `{gid: trọng số}`): `rock`, `cliff`, `ruin`, `stele`, `arch`, `log`, `ancient`, `tent`, `fire`, `plant` (đi xuyên được), `sign`, `skull`, `roof` / `wall` (nhà, gid 14 / 15); mọi vật trừ `plant` là ô chặn; chỉ cần khai loại bố cục có dùng. Nghĩa ảnh của gid theo bộ của `mapId` trong `tiles.json` (ví dụ `stele` là bia đá ở Ngoại vi, tinh thể tím ở Nội địa, tượng đinh ba ở Hải Thần Đảo). Khóa khác là **loại vật riêng** của bản đồ (ví dụ `"well": 45` giếng, `"lighthouse": 42` hải đăng), dùng trong `objects` / `row` / `scatter` như loại chung; tên loại không khai thì công cụ báo lỗi |
| `gids.walk` | Loại vật riêng đi xuyên được như `plant` (cỏ, cầu gỗ, cầu tàu), ví dụ `["lamngan", "plank_bridge"]` |
| `tileRows` | Số hàng ô của tileset Tiled (8 ô mỗi hàng, mặc định 5 = gid 1–40); vật riêng dùng gid 41 trở đi thì đặt 6 (gid tới 48) |
| `gids.canopy` | Gid cây → gid tán (lớp `canopy`, chỉ dùng ở `?view=topdown`) |
| `tiers` | Tầng niên hạn, nông → sâu: `years`, `hint`, `beasts` mặc định của vùng; rừng `trees` / `denseTrees` (`{gid: trọng số}`), `density` (xác suất cây nền), `cluster` (ngưỡng nhiễu cụm rậm), `clusterDensity`, `clusterScale`; biến thể nền `leaf`, `moss` (ngưỡng nhiễu); rải `rock`, `log`, `plant` (xác suất mỗi ô); `path` (khóa `gids.ground` cho đường ở tầng này); `ground` (đè `gids.ground` của tầng, ví dụ `{"grass": [33, 7]}` bãi cát; không đè `water` / `deep`) |
| `zones` | Vùng hồn thú có tên (thành trấn: `[]`, không cần mật độ; vẫn cần một tầng trong `tiers` cho cây, nền): `name`, `tier`, hình `poly` [[x, y]…] / `rect` [x, y, w, h] / `circle` [cx, cy, r]; tùy chọn `hint`, `beasts`, `years` (mặc định của tầng). Ô thuộc vùng đầu tiên chứa nó. Số con mỗi mảnh = `BEAST_DENSITY[mapId][tier]` (shared/data.ts) × ô đi được / 1.000 |
| `points` | Điểm có tên cho đường nối |
| `features` | Chạy theo thứ tự, sau rừng nền: `river` (`pts` spline, `width`, `wobble`, `bank`, `fords` [[x, y, r]]), `pond` (`at`, `r`), `cliff` (`pts`, `rows` tầng, `spacing`, `gap` / `gapLen` lối lên, `side`), `clearing` (`at`, `r`, `ground`, `lock`), `camp` (`rect`, `tents`, `fires`, `logs`, `signs`), `ruins` (`rect`, `gates`, `steles`, `arches`, `walls`, `broken`, `rubble`), `ancient` (`at`, `r`, `roots`, `plants`), `lair` (`at`, `rx`, `ry`, `entrance` n/s/e/w, `door`, `wall`, `skulls`), `objects` (`kind`, `at`), `area` (vùng nền: `ground` phủ lên hình `rect` / `poly` / `circle`, `invert` phần ngoài hình, `edge` mép loang, `on` chỉ phủ lên các loại nền này, `clear` bỏ vật, `lock`, `gid` gid nền riêng, nền ướt thì gid đó chặn như nước), `house` (nhà / đền `rect`, hàng dưới là tường, `margin`, `ground`; công trình ảnh theo `build.compounds` của tiles.json khóa "x,y" góc trên trái), `scatter` (rải `kind` trong hình với xác suất `p`, `on`; `kind` "tree" là cây theo tầng), `fence` (tường thành dọc chu vi `rect`, chừa `gates` rộng `gate` ô), `district` (khu nhà: nhà xếp hàng trong `rect`, rộng `w` / cao `h` [min, max], ngõ `gap`, hàng cách `alley`, bỏ trống lô `skip`, sân có `yard`), `row` (hàng vật `kind` từ `from` tới `to` mỗi `step` ô) |
| `roads` | Đường A* qua các điểm `via` (tên trong `points` hoặc [x, y]), `width`, `wiggle`, `waterCost`: qua nước thành cầu, qua vách thì mở lối, tránh vật của tàn tích / trại |
| `spawn`, `portals`, `arrives`, `waypoints`, `safe`, `elites`, `lair`, `worldBoss`, `lake`, `npcs` | Object Tiled như mục 6; chỗ quanh cổng / điểm đến / trận được dọn trống. Công cụ kiểm loài, mã tinh anh, thú vương (`MAPS.king`) như server |

Sau cùng: viền bản đồ là cây; ô đi được mà không tới được từ trại hồi sinh thì trồng cây (không sinh hồn thú ở chỗ kẹt), điểm có tên không tới được thì cảnh báo.
