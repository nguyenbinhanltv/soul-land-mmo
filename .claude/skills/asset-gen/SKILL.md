---
name: asset-gen
description: Đưa sprite và ô isometric vào game theo quy cách GAME_DESIGN.md mục 5.11 (phong cách A hồn hoàn chiếu sáng / B mỗi vùng một sắc / C thủy mặc / D lưu ly; thoi 32×16 mỗi ô logic, ô lớn 64×32 phủ 2×2, 8 hướng vẽ 5 lật 3; hồn sư 64×64 ghép lớp theo bộ giới × kiểu tóc, phụ thể 96×96, hồn thú theo bậc 64–192) qua PixelLab (ô nền PixelLab hoặc Gemini) và dây chuyền tools/assets, kể cả nhập ảnh Gemini (ô isometric, sprite) bằng gemini-import.mjs. Dùng khi được yêu cầu "tạo <asset>" (hồn sư, kiểu tóc, phụ thể võ hồn, hồn thú, ô nền, cây, nhà…), hoặc khi sửa tools/assets, shared/assets/sprites, shared/assets/iso, manifest.json, art/CREDITS.md.
---

# Đưa asset vào game

## Nguồn ảnh
- **PixelLab MCP**, 5 key trial × 40 lượt + lượt thưởng ngày (+5 mỗi đêm, tối đa 20, chỉ tiêu khi hết lượt chính). Key chỉ nằm trong cấu hình MCP: **không** ghi key vào repo, log, PR hay tin nhắn. **Hết lượt thì dừng và báo** (orchestrator đổi key), không tự đổi key.
- **Gọi `get_balance` trước mỗi lần tạo**; báo số lượt đã dùng trong PR. Ước tính lượt mỗi bước ở Lộ trình Giai đoạn 10 (mục 7).
- Gói trial chỉ chạy **1 việc một lúc** và đôi khi từ chối vì quá tải ("high demand" / lỗi 429): lần từ chối lúc gọi `create_character` không trừ lượt, nhưng job `animate_character` đã nhận rồi mới hỏng 429 (2026-10-21) **vẫn bị trừ 1 lượt**. Chờ việc trước xong rồi mới gửi việc sau, `get_balance` sau mỗi việc hỏng để biết đã mất lượt chưa.
- Công cụ miễn phí: `search_help`, `search_knowledge`, `get_pro_flash_capabilities`, `get_balance`, `get_*` / `list_*`.
- Key chưa có ảnh vẽ bằng code (`client/src/honsuArt.ts`, `textures.ts`); sửa pixel bằng tay (Aseprite, `pixelart_workbench`) khi cần.
- **Ô Gemini** (người dùng tạo bằng Gemini, nhập bằng `gemini-import.mjs --kind tile`, mục "Nhập ảnh Gemini" bên dưới): mặt trên thoi 64×32 trầm, liền mép, **hợp làm ô lớn 64×32** (nền chính). **Mỗi bản đồ chỉ dùng một nguồn ô nền**, không trộn Gemini với PixelLab; nhân vật / hồn thú vẫn từ PixelLab. **Vật đứng** lấy từ PixelLab hoặc Gemini; **chân dung võ hồn** lấy từ Gemini và vẽ chính võ hồn, không vẽ chủ nhân (mục 5.11). Bản đồ dùng Gemini vẫn cần ô thường 32×16 (chỗ 2×2 không cùng loại địa hình, mép địa hình): lấy ô 32×16 do `gemini-import` xuất (`<out>/32`), từ ảnh Gemini riêng với prompt vân to, thưa cho ô nhỏ (mục "Prompt theo phong cách"). Câu "thu về 32×16 thì mất nét và lộ mẫu lặp" chỉ nói việc lấy ô thu nhỏ đó làm **nền chính** cho vùng rộng.
- Không dùng hay tham chiếu ảnh từ game thương mại, phim, truyện tranh chính thức; không ghi tên họa sĩ còn sống hay tên game thương mại vào prompt.

## Gọi PixelLab (đã thử ở bước 10.0, 10.0b)
| Asset | Lệnh | Tham số | Lượt |
|---|---|---|---|
| Hồn sư 8 hướng | `create_character` | `mode: "standard"`, `size: 52` (khung thô 76×76, người cao 52–55), `view: "high top-down"`, `n_directions: 8`, `outline: "single color outline"`, `detail: "high detail"`, `proportions` preset `stylized` | 1 |
| Animation hồn sư | `animate_character` mẫu | `breathing-idle`, `walking-6-frames`, `cross-punch` / `lead-jab`, `fireball`, `taking-punch`, `falling-back-death`; **chỉ xin 5 hướng** `south`, `south-east`, `east`, `north-east`, `north` | 1 mỗi hướng |
| Hồn thú bốn chân | `create_character` | `body_type: "quadruped"`, `template` gần nhất (`dog`, `cat`, `lion`, `bear`, `horse`), `size` 48 / 64 / 92 cho khung 64 / 96 / 128 (khung thô lớn hơn khoảng 40%) | 1 |
| Animation hồn thú | `animate_character` mẫu | chỉ có `idle`, `walk-*`, `running-*`, `sneaking`, `fast-walk`, `bark` (không có đánh / bị đánh / gục: làm bằng code hoặc animation tự mô tả v3, tốn hơn) | 1 mỗi hướng |
| Ô nền | `create_isometric_tile` | `size: 32` (ô lớn 2×2: 64), `tile_shape: "thin tile"`, `outline: "lineless"`; nền chính dùng `detail: "medium detail"`, `shading: "basic shading"` (bản "highly detailed" quá nhiễu khi lát) | 1 |
| Vật đứng | `create_map_object` | `width` / `height` theo vật (cây 96×128, lửa trại 48×48), `view: "high top-down"`, nền trong suốt | 1 |
| Vật / hồn thú thực vật (Thực Nhân Hoa, Cổ Mộc Thụ Nhân…) | `create_map_object` | 96×96, `view: "high top-down"`; không có mẫu animation, động tác làm bằng code | 1 |
| Normal map | `create_normal_map` | chỉ khi bản tự sinh (`normal.mjs`) không đạt | 0,5 |

- Ô size 32: mặt trên là **thoi 32×16, tâm (16, 19)** trong ảnh 32×32, đáy dày khoảng 5 pixel. Ô lớn size 64: **thoi 64×32, tâm khoảng (32, 37)** trong ảnh 64×64, đáy dày khoảng 12 pixel. Lật ngang được để có thêm biến thể.
## Prompt theo phong cách (mục 5.11)
- **Thế giới (A + B):** mô tả vật bằng màu **trầm, hơi khử màu** của vùng ("muted", "desaturated earthy", "dark teal night forest", "sunset crimson and burnt orange", "icy blue and white"…) và chỉ để **phần phát sáng thật** sáng (nấm phát quang, băng tinh, lửa). Bản thử 10.0b dùng:
  - nấm: `cluster of bioluminescent forest mushrooms, tall thin stems, caps glowing soft teal and pale cyan…, on a small dark mossy ground patch, night fantasy forest, isometric view` (48×48);
  - cây Lạc Nhật: `single autumn forest tree at sunset, twisted dark trunk, dense canopy of crimson red and burnt orange leaves…, muted shadows with warm rim light…` (96×128);
  - thông tuyết: `tall snow-covered pine tree…, dark blue-green needles heavily laden with white snow, icy blue shadows, small snow mound at the base…` (64×128);
  - băng tinh: `cluster of jagged ice crystals…, translucent pale cyan and deep blue facets…, faint inner glow…` (48×64).
- **Không vẽ mắt phát sáng hay hào quang vào hồn thú**: client tô mắt theo màu niên hạn (`TIERS[bậc].glow`) và thêm viền sáng; PixelLab tự vẽ mắt sáng thì tô lại về màu mắt thường. Hồn sư cũng không vẽ vòng hồn hoàn.
- Ô nền vẽ theo bảng chung (trầm), không theo màu vùng: client nhân màu môi trường của vùng lúc vẽ, nên một bộ ô dùng cho nhiều vùng.
- **Gemini (ô nền):** "flat isometric floor tile, top face only, no side walls, no outline, no vignette; exact 2:1 dimetric diamond, width exactly twice the height; muted desaturated earthy colors; seamless texture that tiles with itself in both diagonal directions, no feature touching the edges; about 64 art pixels across; plain #FF00FF background, even grid, no text". Mỗi ảnh một chất liệu × 4 biến thể cùng bảng màu. Ô 32×16 (ô đơn ở chỗ 2×2 không cùng địa hình, mép): ảnh riêng, thay "about 64 art pixels across" bằng "about 32 art pixels across; large sparse texture features, few small details" để thu về 32×16 không thành nhiễu.
- **Giao diện (C, D)** vẽ bằng code hoặc `pixelart_workbench` (không tốn lượt) theo bảng `art/palettes/_thuy_mac.gpl`, `_luu_ly.gpl`; font phải đủ dấu tiếng Việt.

- Tải ảnh: `get_character` (URL `rotations/<hướng>.png`), `get_isometric_tile` / `get_map_object` (URL `download`). Ảnh thô lưu ở `art/src/pixellab/<bộ>/`; thư mục tạm để ngoài repo.

## Quy cách bắt buộc (chi tiết ở mục 5.11)
- Một ô logic 16 px thế giới = **thoi 32×16**; client chiếu `sx = x − y`, `sy = (x + y) / 2`. Vùng rộng cùng địa hình dùng ô lớn 64×32 phủ 2×2 ô. Server không đổi. Vật nhiều ô cắt lát dọc rộng 16 pixel.
- **8 hướng, vẽ 5 (`s`, `se`, `e`, `ne`, `n`), lật 3** (`sw` = lật `se`, `w` = lật `e`, `nw` = lật `ne`) cho mọi lớp cùng lúc.
- Hồn sư khung **64×64, gốc (32, 58)**; phụ thể **96×96, gốc (48, 74)**; hồn thú 64 (Trắng, Vàng) / 96 (Tím, Đen) / 128 (Đỏ) / 160 (thú vương) / 192 (boss thế giới), gốc giữa đáy cách mép dưới khoảng 8 pixel.
- Sheet hồn sư 24 cột × 6 hàng (hàng 0–4 là 5 hướng vẽ, hàng 5 `absorb`; cột 0–3 `idle`, 4–9 `walk`, 10–13 `attack`, 14–16 `cast`, 17–18 `hurt`, 19–22 `die`). Sheet hồn thú 20 cột × 5 hàng (cột 0–3 `idle`, 4–9 `walk`, 10–13 `attack`, 14–15 `hurt`, 16–19 `die`).
- **Ghép lớp theo bộ giới × kiểu tóc (phương án (b)):** mỗi bộ vẽ liền thân + áo + tóc rồi tách tự động thành 3 lớp trên từng khung, từng hướng; key `hs_{body,outfit,hair}_{m,f}_{0–3}`; một bộ đủ 3 lớp trong manifest hoặc không có lớp nào. Phụ thể võ hồn là lớp riêng `vh_{id}_b` / `vh_{id}_f`, vẽ tĩnh 5 hướng rồi ghép theo điểm neo của từng khung thân.
- **Viền ngoài `#1a1020`** cho nhân vật / hồn thú / vật đứng (không đen tuyền), giữ nguyên khi hoán màu: lớp tóc / áo chỉ gồm dải 4 xám chuẩn + `#1a1020`. Ô nền không viền.
- Màu lấy từ `art/palette.gpl` (bảng chung) cộng bảng nhấn của vùng `art/palettes/<mapId>.gpl` (giao diện: `_thuy_mac.gpl`, chỗ sang trọng: `_luu_ly.gpl`), `col` / `robe` của võ hồn (`VOHON`) và 1 sắc tối, 1 sắc sáng suy ra, màu hồn hoàn của `TIERS`.
- Bóng, vòng hồn hoàn, aura do client vẽ, không vẽ trong sprite.

## Dây chuyền `tools/assets/` (Node thuần)
**ảnh thô → `normalize` → `pack` → `normal` → `validate --register` → xem thử → PR**

Mọi lệnh theo khung isometric (hằng `ISO_*`, `isoLayout` trong `lib.mjs`); bộ 32×32 cũ chỉ còn để `validate` kiểm các key chưa có `"iso": true`.

| Lệnh | Việc |
|---|---|
| `normalize.mjs --kind honsu\|vohon\|beast<bậc> --out <dir> <ảnh…>` | Xóa nền, cắt khung thô PixelLab (76×76, 92×92…) về khung chuẩn **không phóng**: giữa khung thô → x của gốc (PixelLab đặt nhân vật cố định trong khung thô, nên đổi hướng / animation / lật không xê dịch), dòng chân theo hướng lấy từ khung đứng. Hồn thú (`beast0`–`4` = 64, 64, 96, 96, 128; `--kind beast --size 160\|192`) dùng một dòng chân chung cho mọi hướng. Tên PixelLab đổi sang hướng ngắn (`south-east_walk_0.png` → `se_walk_0`, `south.png` → `s_idle_0`). Dòng cuối in `--foot s=62,se=65,…`: chạy animation riêng (không kèm khung đứng) thì truyền lại giá trị đó. `--place bbox` cho ảnh không phải khung thô PixelLab. Đưa màu về bảng, viền ngoài `#1a1020`. `--split` tách thân / tóc / áo theo màu khóa, tự sửa mắt lam và điểm lạc; `--vohon <id>` chỉ dùng màu võ hồn đó; `--halves <y>` tách phụ thể sau / trước. |
| `pack.mjs --kind honsu\|beast<bậc> --out <sheet.png> <dir>` | Ghép khung `{hướng}_{anim}_{i}.png` (hướng `s`, `se`, `e`, `ne`, `n`; `absorb_{i}.png`) vào sheet 24 × 6 (hồn sư) / 20 × 5 (hồn thú); số khung PixelLab khác bố cục thì chọn đều (giữ khung đầu, cuối). `--breathe <y>` tạo 4 khung `idle` từ khung đứng (khung 64: y khoảng 30, ngay dưới vai); `--fill` chép tạm `idle` vào ô còn thiếu. Hồn sư: `--set <giới>_<kiểu tóc>` ghi cả 3 lớp vào `shared/assets/sprites/honsu/`. |
| `pack.mjs --kind vohon --id <id> --part <dir> --body <thân.png>,<áo.png>,<tóc.png> --attach hand\|head\|back\|feet [--swing]` | Phụ thể tĩnh 5 hướng (`{hướng}_b.png`, `{hướng}_f.png`, khung 96×96 đặt khớp khung đứng của thân) dời theo **điểm neo** tìm trên từng khung thân (`frameAnchors`: tay = đầu mút mảng da xa giữa lưng nhất, cùng phía với tay cầm ở khung đứng; đầu; giữa lưng; chân); `--swing` xoay vũ khí theo `ISO_ATTACK_SWING` ở 4 khung `attack`. Ghi `vohon/<id>_b.png`, `<id>_f.png`. |
| `normal.mjs <ảnh…> [--union] [--edge 0]` | Tự sinh normal map `_n.png` (mép tròn từ alpha + độ sáng, quy ước OpenGL như Phaser), tính riêng từng khung của sheet. `--union` cho 3 lớp một bộ hồn sư (mép theo hình gộp, không nếp giả ở chỗ giáp lớp); `--edge 0` cho ô nền. Chỉ dùng `create_normal_map` khi bản tự sinh không đạt. |
| `validate.mjs` | Kiểm mọi key trong manifest (chạy trong `npm run check`, pre-commit); key `"iso": true` theo bố cục isometric (ô bắt buộc, ô ngoài bố cục, khung chép tạm, `idle` đứng yên, chân chạm gốc, normal map cùng cỡ). `--register <key> [--iso] [--frame 96x96] [--map <mapId>] --prompt "…" --tool "…" --note "…"` thêm / ghi đè key trong `manifest.json` và một dòng `art/CREDITS.md`; `--map` cho phép thêm bảng nhấn `art/palettes/<mapId>.gpl`. Một bộ hồn sư không được trộn lớp `iso` với lớp 32×32. |
| `preview.mjs <ra.png> <sheet…> --dirs8 [--anim idle,walk] [--raw <dir normalize>] [--ground]` | Xếp sheet thành 8 hàng hướng (s, sw, w, nw, n, ne, e, se; 3 hướng lật nền ánh lam), chồng lớp khớp gốc chân (phụ thể 96 với thân 64); `--raw` thêm cột ảnh PixelLab thật của cả 8 hướng để so với hướng lật; `--ground` vẽ thoi dưới chân. Không `--dirs8`: phóng to, chồng lớp, `--grid 64x64`, `--crop`. |
| `palette.mjs <ra.gpl> [--map <mapId>]` | Bảng Aseprite / GIMP gồm mọi màu được phép (bảng chung, màu `TIERS`, `VOHON` kèm sắc suy ra, bảng nhấn vùng); bản sinh, không đưa vào repo. |

Ví dụ một bộ hồn sư (ảnh thô `south.png`… và `south_walk_0..5.png` trong `art/src/pixellab/m_0/`):
```bash
node tools/assets/normalize.mjs --kind honsu --split --out <tmp>/m_0 art/src/pixellab/m_0/*.png
node tools/assets/pack.mjs --kind honsu --set m_0 --breathe 30 --fill <tmp>/m_0
node tools/assets/normal.mjs --union shared/assets/sprites/honsu/{body,outfit,hair}_m_0.png
node tools/assets/preview.mjs <tmp>/m_0_8.png shared/assets/sprites/honsu/{body,outfit,hair}_m_0.png --dirs8 --anim idle,walk --raw <tmp>/m_0 --ground
for l in body outfit hair; do node tools/assets/validate.mjs --register hs_${l}_m_0 --iso --prompt "…"; done
```

**Màu khóa khi tách lớp hồn sư:** tóc lam, áo / quần / váy xám, giày nâu, da bình thường. `normalize --split`: lam → tóc, xám → áo, còn lại → thân; tóc và áo đưa về dải 4 xám theo độ sáng của từng lớp. **Lỗi màu PixelLab đã gặp:** `--split` tự sửa mắt lam (điểm lam trong vùng đầu có tròng trắng ngay bên trái / phải và không quá 2 điểm tóc quanh nó → màu "Mắt" của bảng; tròng trắng giữ ở lớp thân dù cùng màu với xám sáng của áo; dòng log báo số điểm đã sửa, hướng `n` / `ne` không có mắt) và 1–3 điểm lạc màu khóa mỗi hướng (dưới 2 điểm cùng lớp quanh nó mà lớp khác có từ 3 điểm → theo lớp đó). Còn phải tự soát: áo ánh tím, đai màu, tóc xám. Các màu gần đen (độ sáng < 12%) đưa về `#1a1020`. Gặp lỗi màu mới thì đếm màu nguồn rồi chỉnh `layerOf` / `mapColor` trong `normalize.mjs`.

## Nhập ảnh Gemini (isometric)
Gemini vẽ nhiều vật trên một ảnh lớn ở dạng "giả pixel" (mỗi pixel nghệ thuật là khối ~5–7 px không đều, có logo sao ở góc dưới phải). `gemini-import.mjs` đưa ảnh đó về pixel thật đúng khung isometric; `iso-preview.mjs` dựng mảnh bản đồ để soát mép ghép. Ảnh thô để ở thư mục artifact (inbox), kết quả ra thư mục tạm ngoài repo; chỉ đưa vào `shared/assets` sau khi người dùng duyệt.

| Lệnh | Việc |
|---|---|
| `gemini-import.mjs --kind tile --out <dir> --names a,b,… <ảnh>` | Ô nền: lấy mặt trên thoi (`--inset auto` tự bỏ dải mép khác màu như viền đen, thành "hộp kính" của nước), ép về đúng 2:1, làm liền mép (`--seamless on`), đặt vào ảnh ô `isoTileImage(W)`: mặc định ghi cả ô logic và ô lớn 2×2, suy từ **một hằng `ISO_TILE_W`** trong `lib.mjs` (bề ngang thoi một ô logic, khớp `client/src/iso.ts`; hiện 32 → `<dir>/32/` ảnh 32×32 thoi 32×16 tâm (16,19) đáy 5, và `<dir>/64/` ảnh 64×64 thoi 64×32 tâm (32,37) đáy 11, giống ô PixelLab size 32 / 64). Đổi cỡ thoi thì chỉ đổi hằng đó. Đáy lấy từ mặt bên khối gốc; `--size 32,64` chọn cỡ; `--face-only` chỉ ghi mặt trên. |
| `gemini-import.mjs --kind tile-block …` | Như trên nhưng giữ viền (tối về `#1a1020`), không làm liền mép (mép vách, bờ nước). |
| `gemini-import.mjs --kind honsu\|vohon\|beast\|object …` | Sprite theo hằng isometric trong `lib.mjs`: hồn sư `ISO_HS_FRAME` / `ISO_HS_ORIGIN` (64×64, gốc (32,58)), phụ thể `ISO_VH_FRAME` / `ISO_VH_ORIGIN` (96×96, gốc (48,74)); hồn thú bắt buộc `--size` một cỡ trong `ISO_BEAST_SIZES` (boss 160–192), vật bắt buộc `--size`. Cùng hệ số thu cho cả lô (`--scale S` đặt hẳn, để các lần chạy khác khung vẫn cùng cỡ điểm ảnh), chân cùng đường đáy, thêm viền `#1a1020` nếu thiếu; mặc định `--palette gpl`. |
| `gemini-import.mjs --kind portrait …` | Chân dung 64×64 (mặc định `--size 64`). Ô là khung nền tối có ánh màu: lấy phần đặc của khung (bỏ tia sét / lửa nhô ra nền) từ ảnh gốc nên ánh hồng tím trong khung không bị xóa; pixel thật đủ cỡ thì cắt giữa 1:1 (không nội suy), không viền ngoài; mặc định `--palette auto-item --colors 32`. Ô nền trong suốt hoặc góc khung trong suốt (biểu tượng tròn, ví dụ biểu tượng hệ) thì căn giữa như sprite, thêm viền `#1a1020`. |
| `iso-preview.mjs <ra.png> --tiles grass=a.png,grass=b.png,path=c.png,water=d.png,deep=e.png,stone=f.png [--big grass=A.png,…] --size 16 --scale 3` | Mảnh bản đồ N×N ô logic (cỏ nhiều biến thể, đường, ao, sân đá) để soát mép ghép, màu, độ lặp; `--big` đặt ô lớn ở mọi khối 2×2 cùng địa hình. Đọc được cả ô PixelLab. |

- Tách vật theo thành phần liên thông (thứ tự hàng trên → dưới, trái → phải, khớp `--names`), hoặc `--grid CxR` khi các vật dính nhau. Số tên khác số vật thì công cụ dừng và in hộp bao từng vật.
- Cỡ ô giả dò tự động chung cho cả ảnh (in ra `ô giả … px → gốc W×H`); sai thì ghi đè `--cell N` (`--cell 1` cho ảnh đã là pixel thật, ví dụ ô PixelLab).
- Bảng màu: ô (`tile`, `tile-block`) mặc định `--palette auto-item` (mỗi vật một bảng `--colors` 10 màu; ghi `_palette.gpl` gộp), giữ như vậy cho tới khi `art/palette.gpl` có dải đất / đá / rêu / tuyết / cát / nước. `--palette auto --colors 32` (một bảng chung cả lô) để vật nhiều màu chiếm hết bảng, ô đều màu chỉ còn 1–3 màu; `--palette gpl` với bảng hiện nay làm ô ngả tím / lam / đỏ; `--palette none` để xem màu gốc.
- Logo: `--logo auto` (mặc định) dựng lại ngôi sao và gỡ lớp trắng mờ kể cả phần đè lên vật; sao nằm trọn trên vật / khung tối (chân dung) thì dùng vị trí chuẩn của Gemini (ảnh 2752×1536: tâm cách góc dưới phải (112, 112), bán kính 48, alpha 0,51) khi khớp lớp trắng mờ. Vị trí khác thường thì `--logo star:cx,cy,R[,alpha]`, `--logo x,y,w,h` (vá bằng màu lân cận) hoặc `--logo off`.
- Gemini hay vẽ mỗi ô thành **tấm nền riêng** khác `#FF00FF` (ví dụ `#b424a8` ở ảnh vật Tinh Đấu): đọc màu tấm rồi `--key #rrggbb`; cả tấm lẫn nền ngoài đều bị xóa. Vật có quầng sáng vẽ đè lên nền (nấm, cây phát quang) để lại viền tím nhạt: thêm `--fringe 12` (số lượt gỡ viền nhiễm màu nền, mặc định 2; lượt gỡ dừng ở viền tối của vật).
- **Đế đất:** vật Gemini hay đứng trên khối đất thoi dày. `--cut-base a,b|all` cắt đế của các vật có tên này:
  - dò đế từ đáy hình bóng (hai cạnh dốc 1:2) và bậc sáng giữa mặt bên với mặt trên;
  - bỏ mặt bên, loang bỏ cỏ đất mặt trên trong ngưỡng `--base-tol` (mặc định 1500), dừng ở nét viền tối.
  - Báo cáo in `cắt đế rộng W dày t`, hoặc `KHÔNG dò được đế` (vật để nguyên).
  - Xem lại bằng mắt: vật cùng màu với đế (bụi cỏ, lau sậy trên mặt nước) cắt xấu thì không đưa vào game, ghi vào danh sách vẽ lại.
- Một vùng dùng **chung `--scale`** cho mọi vật (Tinh Đấu: 0,6). Khung mỗi vật là bội `ISO_PROP_STEP` vừa hình: chạy một lần với khung lớn và `--debug`, đo hộp bao trong `_native/`, rồi chạy lại với khung đã tính. Bảng màu: `art/palette.gpl` gộp `art/palettes/<vùng>.gpl` thành một file, truyền bằng `--palette <file>`.
- **Đăng ký vào game** (sau khi người dùng duyệt):
  - Chép vào `shared/assets/sprites/iso/portrait/<mã võ hồn>.png` hoặc `iso/props/<vật>.png`.
  - Chạy `validate.mjs --register portrait_<mã>|prop_<vật> --tool "Gemini (gemini.google.com) + tools/assets/gemini-import.mjs" --prompt "<ảnh, ô, prompt ô>" --note "<lệnh nhập>"`.
  - Manifest ghi `"iso": true` (client chưa tải). CREDITS ghi vào mục "Asset tạo bằng AI (Gemini)".
  - Validate kiểm: chân dung 64×64, tối đa `PORTRAIT_MAX_COLORS` màu; vật đứng cạnh chia hết cho `ISO_PROP_STEP`, màu thuộc bảng chung + `art/palettes/*.gpl`.
- Mỗi lần chạy ghi `_preview.png` (×4), `_report.json` (cỡ ô giả, độ phân giải gốc, tỉ lệ mặt trên, bề dày, điểm lệch mép ghép trước / sau khi làm liền: khoảng 1 là liền như bên trong ô); `--debug` ghi thêm ảnh pixel thật trước khi ép khung vào `_native/`.

**Quy tắc prompt Gemini:**
- Nền một màu phẳng `#FF00FF` (không bóng đổ, không chuyển màu, không viền trắng quanh vật); vật không được dùng màu hồng / tím gần màu nền ở mép.
- Lưới đều C cột × R hàng, mỗi ô một vật, các vật cách nhau rõ (không chạm nhau, không tràn sang ô khác); cùng cỡ, cùng góc nhìn.
- Không chữ, không số, không nhãn, không khung; logo Gemini để công cụ gỡ.
- Ô nền: "flat isometric floor tile, top face only, exact 2:1 diamond (width = 2 × height), no side thickness, no black outline, no edge highlight or bevel, uniform lighting, seamless texture that tiles with itself"; ô logic 32×16 thì xin vân thưa, ít chi tiết nhỏ.
  - **Bố cục lưới quyết định tỉ lệ thoi:** Gemini vẽ thoi kín ô lưới. Ảnh 16:9 chia 3×2 thì ô lưới 1,19:1, thoi chỉ 1,2:1 (lô 2), bị ép về 2:1 thì mất khoảng 40% chi tiết dọc. Dùng 3×3 hoặc 2×2 (ô lưới 1,79:1) và xin "empty magenta above and below each diamond, diamonds never touch".
  - Đừng ghi số pixel nghệ thuật ("about 64 art pixels across"): Gemini vẽ ô giả khoảng 11 px, thô gấp đôi.
- Sprite / vật: một hướng mỗi ô, chân chạm cùng đường đáy, viền ngoài tối. Vật đứng thêm "no ground base, no soil slab under the prop" để khỏi phải cắt đế, và "no glow halo bleeding onto the background".
- Chân dung: vẽ chính võ hồn trên nền tối có quầng màu của võ hồn; giữ nguyên prompt lô 1 (`gemini-prompts-vohon-tinhdau.md` của orchestrator).
- Mỗi ảnh vẽ trong **một cuộc trò chuyện Gemini mới**: trong cùng cuộc trò chuyện, Gemini hay vẽ lại ảnh lượt trước (lô 2: 5/10 ảnh sai bản đồ). Kiểm nội dung từng ảnh trước khi nhập.

Ví dụ:
```bash
node tools/assets/gemini-import.mjs --kind tile --names grass,dirt,water --out <tmp>/flat <inbox>/tiles/gemini-tiles-02.png
node tools/assets/iso-preview.mjs <tmp>/map.png --tiles grass=<tmp>/flat/32/grass.png,path=<tmp>/flat/32/dirt.png,water=<tmp>/flat/32/water.png --big grass=<tmp>/flat/64/grass.png --scale 3
```

## Quy trình "tạo <asset>"
1. Đọc mục 5.11 và xác định key: `hs_{body,outfit,hair}_{m/f}_{0–3}`, `vh_{id}_b` / `_f`, `beast_{loài}`, `portrait_{id}`, `prop_{vật}`, ô / vật trong `shared/assets/iso/tiles.json`.
2. `get_balance`; tạo khung tĩnh 8 hướng trước, duyệt bằng mắt (phóng ×3, đặt trên nền isometric), rồi mới làm animation cho 5 hướng vẽ. Nhân vật mới lấy nhân vật đã duyệt làm mẫu phong cách.
3. normalize → pack → normal → `preview.mjs` soát lệch chân, màu lạ, điểm vụn, hướng lật → `validate.mjs --register` → `npm run check`.
4. Xem trong game ở ×2 và ×3 (bật server và client; `ao preview` / `ao browser`, hoặc Chrome headless qua CDP nếu panel bị ẩn): đủ 8 hướng, ghép thử ít nhất 2 màu tóc và 2 màu áo, đứng trước / sau cây và nhà, cạnh lửa trại và nền rừng sâu.
5. `npm run build --prefix client`, bot khi server bật; mở PR kèm ảnh chụp, nguồn ảnh và số lượt PixelLab đã dùng. Đánh dấu bước Giai đoạn 10 ở mục 7.

## Client
- `client/src/sprites.ts` (`preloadSprites`) tải mọi key trong manifest; `textures.ts` chỉ vẽ bằng code những key **chưa có** ảnh, nên thêm key vào manifest là đủ, không cần sửa code client.
- Key hồn sư lấy bằng `honsuKey(lớp, giới, kiểu tóc)`; hoán màu bằng `recolor` (key `hs_hair_f_2@3`, thân tông da khác `hs_body_f_2@2`); ánh xạ khung phụ thể `vohonFrame`. Không trộn lớp ảnh thật với lớp vẽ code trong một bộ.
- Không sửa luật chơi khi thêm asset. Màu tóc / áo / da chỉ nằm ở `shared/data.ts`.
