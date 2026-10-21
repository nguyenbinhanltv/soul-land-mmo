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

Bản dựng lại của một bản đồ đang có ghi ra `<mapId>.v2.json` và chỉ được dùng khi server bật `MAP_V2=<mapId>` (danh sách cách nhau dấu phẩy, `all` = mọi bản có `.v2`); server báo tên file cho client qua `MapState.mapFile`. Bot chạy cùng `MAP_V2` để đọc đúng file (`BOT_ONLY=bigmap` chỉ chạy phần bản đồ lớn).

## Chỉnh tay

1. `npm run map:build -- <mapId> --hand-init` tạo `tools/maps/hand/<mapId>.json`: hai lớp tham khảo đã khóa (`tham_khao_nen`, `tham_khao_vat`, bản đang sinh) và hai lớp rỗng `tay_nen`, `tay_vat`.
2. Mở bằng Tiled, chỉ vẽ vào `tay_nen` (đè ô nền) và `tay_vat` (đè vật: cây, đá, vách…). Ở `tay_vat`, vẽ một **gid nền** (ví dụ gid 1, cỏ) nghĩa là **xóa vật** ở ô đó.
3. Chạy lại `npm run map:build -- <mapId>`. Lớp tay áp sau cùng, trước bước nối thông, nên đổi hạt giống / bố cục vẫn giữ chỗ đã sửa. Không sửa thẳng file trong `shared/assets` (bị ghi đè, `--check` báo lỗi).

Object (vùng, cổng, trận, tinh anh, hang) sửa trong bố cục JSON.

## Bố cục (`layouts/<mapId>.json`)

Tọa độ theo **ô logic** (16 pixel). Mẫu đầy đủ: `layouts/tinh_dau_ngoai_vi.json`.

| Khóa | Nghĩa |
|---|---|
| `map`, `out`, `size`, `seed` | `mapId` (phải có trong `MAPS`), tên file ra trong `shared/assets`, `[rộng, cao]`, hạt giống |
| `zoneCell` | Cỡ lưới thô (ô) khi tách hình vùng thành chữ nhật (server chỉ đọc vùng chữ nhật); mặc định 10 |
| `gids.ground` | Loại nền → gid: `grass` ([sắc 1, sắc 2]), `leaf` (thảm lá), `moss` (rêu), `path`, `pathDark`, `camp`, `pave` / `crack` (sân đá tàn tích), `water` (suối, chặn), `ford` (chỗ lội, đi được), `bank` (bờ), `deep` (lòng ao, chặn), `stony` (nền đá mặt vách), `glow` (rêu quanh điểm nhấn), `bridge` |
| `gids.objects` | Loại vật → gid (hoặc danh sách / `{gid: trọng số}`): `rock`, `cliff`, `ruin`, `stele`, `arch`, `log`, `ancient`, `tent`, `fire`, `plant` (đi xuyên được), `sign`, `skull`; mọi vật trừ `plant` là ô chặn |
| `gids.canopy` | Gid cây → gid tán (lớp `canopy`, chỉ dùng ở `?view=topdown`) |
| `tiers` | Tầng niên hạn, nông → sâu: `years`, `hint`, `beasts` mặc định của vùng; rừng `trees` / `denseTrees` (`{gid: trọng số}`), `density` (xác suất cây nền), `cluster` (ngưỡng nhiễu cụm rậm), `clusterDensity`, `clusterScale`; biến thể nền `leaf`, `moss` (ngưỡng nhiễu); rải `rock`, `log`, `plant` (xác suất mỗi ô); `path` (khóa `gids.ground` cho đường ở tầng này) |
| `zones` | Vùng hồn thú có tên: `name`, `tier`, hình `poly` [[x, y]…] / `rect` [x, y, w, h] / `circle` [cx, cy, r]; tùy chọn `hint`, `beasts`, `years` (mặc định của tầng). Ô thuộc vùng đầu tiên chứa nó. Số con mỗi mảnh = `BEAST_DENSITY[mapId][tier]` (shared/data.ts) × ô đi được / 1.000 |
| `points` | Điểm có tên cho đường nối |
| `features` | Chạy theo thứ tự, sau rừng nền: `river` (`pts` spline, `width`, `wobble`, `bank`, `fords` [[x, y, r]]), `pond` (`at`, `r`), `cliff` (`pts`, `rows` tầng, `spacing`, `gap` / `gapLen` lối lên, `side`), `clearing` (`at`, `r`, `ground`, `lock`), `camp` (`rect`, `tents`, `fires`, `logs`, `signs`), `ruins` (`rect`, `gates`, `steles`, `arches`, `walls`, `broken`, `rubble`), `ancient` (`at`, `r`, `roots`, `plants`), `lair` (`at`, `rx`, `ry`, `entrance` n/s/e/w, `door`, `wall`, `skulls`), `objects` (`kind`, `at`) |
| `roads` | Đường A* qua các điểm `via` (tên trong `points` hoặc [x, y]), `width`, `wiggle`, `waterCost`: qua nước thành cầu, qua vách thì mở lối, tránh vật của tàn tích / trại |
| `spawn`, `portals`, `arrives`, `waypoints`, `safe`, `elites`, `lair`, `npcs` | Object Tiled như mục 6; chỗ quanh cổng / điểm đến / trận được dọn trống. Công cụ kiểm loài, mã tinh anh, thú vương (`MAPS.king`) như server |

Sau cùng: viền bản đồ là cây; ô đi được mà không tới được từ trại hồi sinh thì trồng cây (không sinh hồn thú ở chỗ kẹt), điểm có tên không tới được thì cảnh báo.
