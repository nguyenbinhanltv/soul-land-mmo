---
name: asset-gen
description: Đưa sprite và ô isometric vào game theo quy cách GAME_DESIGN.md mục 5.11 (thoi 32×16 mỗi ô logic, ô lớn 64×32 phủ 2×2, 8 hướng vẽ 5 lật 3; hồn sư 64×64 ghép lớp theo bộ giới × kiểu tóc, phụ thể 96×96, hồn thú theo bậc 64–192) qua PixelLab và dây chuyền tools/assets. Dùng khi được yêu cầu "tạo <asset>" (hồn sư, kiểu tóc, phụ thể võ hồn, hồn thú, ô nền, cây, nhà…), hoặc khi sửa tools/assets, shared/assets/sprites, shared/assets/iso, manifest.json, art/CREDITS.md.
---

# Đưa asset vào game

## Nguồn ảnh
- **PixelLab MCP**, 5 key trial × 40 lượt + lượt thưởng ngày (+5 mỗi đêm, tối đa 20, chỉ tiêu khi hết lượt chính). Key chỉ nằm trong cấu hình MCP: **không** ghi key vào repo, log, PR hay tin nhắn. **Hết lượt thì dừng và báo** (orchestrator đổi key), không tự đổi key.
- **Gọi `get_balance` trước mỗi lần tạo**; báo số lượt đã dùng trong PR. Ước tính lượt mỗi bước ở Lộ trình Giai đoạn 10 (mục 7).
- Gói trial chỉ chạy **1 việc một lúc** và đôi khi từ chối vì quá tải ("high demand", không trừ lượt): chờ việc trước xong rồi gửi lại.
- Công cụ miễn phí: `search_help`, `search_knowledge`, `get_pro_flash_capabilities`, `get_balance`, `get_*` / `list_*`.
- Key chưa có ảnh vẽ bằng code (`client/src/honsuArt.ts`, `textures.ts`); sửa pixel bằng tay (Aseprite, `pixelart_workbench`) khi cần.
- Không dùng hay tham chiếu ảnh từ game thương mại, phim, truyện tranh chính thức; không ghi tên họa sĩ còn sống hay tên game thương mại vào prompt.

## Gọi PixelLab (đã thử ở bước 10.0)
| Asset | Lệnh | Tham số | Lượt |
|---|---|---|---|
| Hồn sư 8 hướng | `create_character` | `mode: "standard"`, `size: 52` (khung thô 76×76, người cao 52–55), `view: "high top-down"`, `n_directions: 8`, `outline: "single color outline"`, `detail: "high detail"`, `proportions` preset `stylized` | 1 |
| Animation hồn sư | `animate_character` mẫu | `breathing-idle`, `walking-6-frames`, `cross-punch` / `lead-jab`, `fireball`, `taking-punch`, `falling-back-death`; **chỉ xin 5 hướng** `south`, `south-east`, `east`, `north-east`, `north` | 1 mỗi hướng |
| Hồn thú bốn chân | `create_character` | `body_type: "quadruped"`, `template` gần nhất (`dog`, `cat`, `lion`, `bear`, `horse`), `size` 48 / 64 / 92 cho khung 64 / 96 / 128 (khung thô lớn hơn khoảng 40%) | 1 |
| Animation hồn thú | `animate_character` mẫu | chỉ có `idle`, `walk-*`, `running-*`, `sneaking`, `fast-walk`, `bark` (không có đánh / bị đánh / gục: làm bằng code hoặc animation tự mô tả v3, tốn hơn) | 1 mỗi hướng |
| Ô nền | `create_isometric_tile` | `size: 32` (ô lớn 2×2: 64), `tile_shape: "thin tile"`, `outline: "lineless"`; nền chính dùng `detail: "medium detail"`, `shading: "basic shading"` (bản "highly detailed" quá nhiễu khi lát) | 1 |
| Vật đứng | `create_map_object` | `width` / `height` theo vật (cây 96×128, lửa trại 48×48), `view: "high top-down"`, nền trong suốt | 1 |
| Normal map | `create_normal_map` | chỉ khi bản tự sinh (`normal.mjs`) không đạt | 0,5 |

- Ô size 32: mặt trên là **thoi 32×16, tâm (16, 19)** trong ảnh 32×32, đáy dày khoảng 5 pixel. Ô lớn size 64: **thoi 64×32, tâm khoảng (32, 37)** trong ảnh 64×64, đáy dày khoảng 12 pixel. Lật ngang được để có thêm biến thể.
- Tải ảnh: `get_character` (URL `rotations/<hướng>.png`), `get_isometric_tile` / `get_map_object` (URL `download`). Ảnh thô lưu ở `art/src/pixellab/<bộ>/`; thư mục tạm để ngoài repo.

## Quy cách bắt buộc (chi tiết ở mục 5.11)
- Một ô logic 16 px thế giới = **thoi 32×16**; client chiếu `sx = x − y`, `sy = (x + y) / 2`. Vùng rộng cùng địa hình dùng ô lớn 64×32 phủ 2×2 ô. Server không đổi. Vật nhiều ô cắt lát dọc rộng 16 pixel.
- **8 hướng, vẽ 5 (`s`, `se`, `e`, `ne`, `n`), lật 3** (`sw` = lật `se`, `w` = lật `e`, `nw` = lật `ne`) cho mọi lớp cùng lúc.
- Hồn sư khung **64×64, gốc (32, 58)**; phụ thể **96×96, gốc (48, 74)**; hồn thú 64 (Trắng, Vàng) / 96 (Tím, Đen) / 128 (Đỏ) / 160 (thú vương) / 192 (boss thế giới), gốc giữa đáy cách mép dưới khoảng 8 pixel.
- Sheet hồn sư 24 cột × 6 hàng (hàng 0–4 là 5 hướng vẽ, hàng 5 `absorb`; cột 0–3 `idle`, 4–9 `walk`, 10–13 `attack`, 14–16 `cast`, 17–18 `hurt`, 19–22 `die`). Sheet hồn thú 20 cột × 5 hàng (cột 0–3 `idle`, 4–9 `walk`, 10–13 `attack`, 14–15 `hurt`, 16–19 `die`).
- **Ghép lớp theo bộ giới × kiểu tóc (phương án (b)):** mỗi bộ vẽ liền thân + áo + tóc rồi tách tự động thành 3 lớp trên từng khung, từng hướng; key `hs_{body,outfit,hair}_{m,f}_{0–3}`; một bộ đủ 3 lớp trong manifest hoặc không có lớp nào. Phụ thể võ hồn là lớp riêng `vh_{id}_b` / `vh_{id}_f`, vẽ tĩnh 5 hướng rồi ghép theo điểm neo của từng khung thân.
- **Viền ngoài `#1a1020`** cho nhân vật / hồn thú / vật đứng (không đen tuyền), giữ nguyên khi hoán màu: lớp tóc / áo chỉ gồm dải 4 xám chuẩn + `#1a1020`. Ô nền không viền.
- Màu chỉ lấy từ `art/palette.gpl`, cộng `col` / `robe` của võ hồn (`VOHON`) và 1 sắc tối, 1 sắc sáng suy ra. **Phong cách chờ chốt** (mục 5.11): không tạo ảnh hàng loạt trước khi chốt.
- Bóng, vòng hồn hoàn, aura do client vẽ, không vẽ trong sprite.

## Dây chuyền `tools/assets/` (Node thuần)
**ảnh thô → `normalize` → `pack` → `normal` → `validate --register` → xem thử → PR**

Bước 10.3 chuyển các lệnh dưới sang quy cách isometric; tới lúc đó lệnh vẫn theo khung 32×32 cũ.

| Lệnh | Việc |
|---|---|
| `normalize.mjs --kind honsu\|vohon\|beast<bậc> --out <dir> <ảnh…>` | Xóa nền, cắt khung thô về khung chuẩn và đặt chân vào gốc (không phóng ảnh pixel trừ khi quá khung), đưa màu về bảng, viền ngoài `#1a1020`. `--split` tách thân / tóc / áo theo màu khóa; `--vohon <id>` tách phụ thể. |
| `pack.mjs --kind honsu\|vohon\|beast<bậc> --out <sheet.png> <dir>` | Ghép khung tên `{hướng}_{anim}_{i}.png` (hướng `s`, `se`, `e`, `ne`, `n`; và `absorb_{i}.png`) vào bố cục cố định. `--breathe` tạo `idle` từ khung đứng; `--fill` chép tạm `idle` vào ô còn thiếu. Hồn sư: `--set <giới>_<kiểu tóc>` ghi cả 3 lớp vào `shared/assets/sprites/honsu/{body,outfit,hair}_<giới>_<kiểu tóc>.png`. |
| `normal.mjs <ảnh…>` | Tự sinh normal map `_n.png` (từ alpha và độ sáng) cho Light2D. |
| `validate.mjs` | Kiểm mọi key trong manifest (chạy trong `npm run check`, pre-commit). `--register <key> --prompt "…" --tool "…" --note "…"` thêm key vào `manifest.json` (key isometric ghi `"iso": true`) và một dòng vào `art/CREDITS.md`. |
| `preview.mjs <ra.png> <lớp…> --scale 3 --grid 64x64 [--crop x,y,w,h]` | Phóng to, chồng lớp để xem bằng mắt (kể cả 3 hướng lật). |

**Màu khóa khi tách lớp hồn sư:** tóc lam, áo / quần / váy xám, giày nâu, da bình thường. `normalize --split`: lam → tóc, xám → áo, còn lại → thân; tóc và áo đưa về dải 4 xám theo độ sáng của từng lớp. **Lỗi màu PixelLab đã gặp, sửa trước khi tách:** mắt lam (điểm lam cạnh tròng trắng → nâu tối; tròng trắng giữ ở lớp thân dù cùng màu với xám sáng của áo), 1–3 điểm lạc màu khóa mỗi hướng (gán theo lớp chiếm đa số quanh điểm), áo ánh tím, đai màu, tóc xám. Các màu gần đen (độ sáng < 12%) đưa về `#1a1020`. Gặp lỗi màu mới thì đếm màu nguồn rồi chỉnh `layerOf` / `mapColor` trong `normalize.mjs`.

## Quy trình "tạo <asset>"
1. Đọc mục 5.11 và xác định key: `hs_{body,outfit,hair}_{m/f}_{0–3}`, `vh_{id}_b` / `_f`, `beast_{loài}`, ô / vật trong `shared/assets/iso/tiles.json`.
2. `get_balance`; tạo khung tĩnh 8 hướng trước, duyệt bằng mắt (phóng ×3, đặt trên nền isometric), rồi mới làm animation cho 5 hướng vẽ. Nhân vật mới lấy nhân vật đã duyệt làm mẫu phong cách.
3. normalize → pack → normal → `preview.mjs` soát lệch chân, màu lạ, điểm vụn, hướng lật → `validate.mjs --register` → `npm run check`.
4. Xem trong game ở ×2 và ×3 (bật server và client; `ao preview` / `ao browser`, hoặc Chrome headless qua CDP nếu panel bị ẩn): đủ 8 hướng, ghép thử ít nhất 2 màu tóc và 2 màu áo, đứng trước / sau cây và nhà, cạnh lửa trại và nền rừng sâu.
5. `npm run build --prefix client`, bot khi server bật; mở PR kèm ảnh chụp, nguồn ảnh và số lượt PixelLab đã dùng. Đánh dấu bước Giai đoạn 10 ở mục 7.

## Client
- `client/src/sprites.ts` (`preloadSprites`) tải mọi key trong manifest; `textures.ts` chỉ vẽ bằng code những key **chưa có** ảnh, nên thêm key vào manifest là đủ, không cần sửa code client.
- Key hồn sư lấy bằng `honsuKey(lớp, giới, kiểu tóc)`; hoán màu bằng `recolor` (key `hs_hair_f_2@3`, thân tông da khác `hs_body_f_2@2`); ánh xạ khung phụ thể `vohonFrame`. Không trộn lớp ảnh thật với lớp vẽ code trong một bộ.
- Không sửa luật chơi khi thêm asset. Màu tóc / áo / da chỉ nằm ở `shared/data.ts`.
