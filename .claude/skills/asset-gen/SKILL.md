---
name: asset-gen
description: Hướng dẫn thao tác làm ảnh và đưa vào game theo quy cách isometric ở GAME_DESIGN.md mục 5.11 (hồn sư 64×64 ghép lớp, phụ thể võ hồn 96×96, hồn thú theo bậc 64–192, ô nền thoi 32×16 / ô lớn 64×32, vật đứng, chân dung, thẻ, biểu tượng, mảnh giao diện thủy mặc, NPC phụ LPC): tạo ảnh bằng ComfyUI tự host (công cụ chính) (MCP comfyui-pixel, SDXL + pixel-art-xl; prompt, ảnh dẫn isometric comfy-guide.mjs, tách nền trắng / chiếu thoi comfy-key.mjs), ghi chú PixelLab đã bỏ, nhập ảnh Gemini bằng gemini-import.mjs, ghép NPC phụ từ LPC bằng lpc-compose.mjs, vẽ tay (he-icons.mjs, Aseprite) và dây chuyền tools/assets normalize → pack → normal → preview → validate. Dùng khi được yêu cầu "tạo <asset>" (hồn sư, kiểu tóc, phụ thể võ hồn, hồn thú, ô nền, cây, nhà, biểu tượng…), hoặc khi sửa tools/assets, shared/assets/sprites, shared/assets/iso, manifest.json, art/CREDITS.md.
---

# Làm ảnh và đưa vào game

Quy tắc (phép chiếu, cỡ khung, phong cách, bảng màu, nguồn được phép) là `GAME_DESIGN.md` mục 5.11; quy cách chi tiết (bố cục sheet, bảng animation, điểm neo, dạng phụ thể từng võ hồn, key và thư mục) là `tools/assets/README.md`; skill này hướng dẫn thao tác. Không sửa luật chơi khi thêm asset; màu tóc / áo / da chỉ nằm ở `shared/data.ts`.

## 1. Quy cách tóm tắt (quy tắc: mục 5.11; chi tiết: `tools/assets/README.md`)
| Asset | Khung, sheet | Gốc | Key |
|---|---|---|---|
| Hồn sư | 64×64, sheet 24 cột × 6 hàng | (32, 58) | `hs_{body,outfit,hair}_{m,f}_{0–3}`: một bộ giới × kiểu tóc đủ 3 lớp hoặc không lớp nào |
| Phụ thể võ hồn | 96×96, sheet 24 × 12 (nam hàng 0–4, nữ hàng 6–10) | (48, 74) | `vh_{id}_b` / `vh_{id}_f` |
| Hồn thú | 64 (Trắng, Vàng) / 96 (Tím, Đen) / 128 (Đỏ) / 160 (thú vương) / 192 (boss thế giới), sheet 20 × 5 | giữa đáy, cách mép dưới khoảng 8 | `beast_{loài}` |
| NPC phụ, dân thường | 64×64, sheet 24 × 6, một lớp đã tô màu | (32, 58) | `lpc_{tên}` |
| Ô nền | ảnh 32×32 (thoi 32×16, tâm (16, 19), đáy khoảng 5); ô lớn 64×64 (thoi 64×32, tâm khoảng (32, 37), đáy khoảng 11–12) | | tên ô trong `shared/assets/iso/tiles.json` |
| Vật đứng | cạnh bội `ISO_PROP_STEP` | giữa đáy, cách mép dưới `ISO_PROP_FOOT` | `prop_{vật}` |
| Chân dung võ hồn / NPC | 64×64 / 112×112, tối đa `PORTRAIT_MAX_COLORS` màu | | `portrait_{id}` / `npc_{mã NPCS}` |
| Chân dung hồn thú (khung mục tiêu) | 64×64, nền trong suốt, tối đa `PORTRAIT_MAX_COLORS` màu | | `thu_{mã BEASTS}` |
| Biểu tượng hồn kỹ | 32×32, khung tròn màu võ hồn, nền ngoài khung trong suốt | | `skill_{mã VOHON_SKILLS \| chung}_{vòng 0–9}` |
| Thẻ võ hồn | 96×152, cửa sổ chân dung trong suốt | | `card_{sr,ssr,ur}` |
| Huy hiệu hệ / trạng thái | 24×24 | | `he_{mã HE_IDS}` / `status_{mã STATUS_IDS, BUFF_IDS}` |
| Vật phẩm | 32×32 (hồn cốt bản xám) | | `item_{mã ITEMS, nhóm ITEM_KINDS, hon_cot_<vị trí>}` |
| Mảnh giao diện | điểm ảnh thật, không thu | | `ui_{tên}` (`"nine": N` nếu kéo giãn 9 lát) |

- 8 hướng: vẽ `s`, `se`, `e`, `ne`, `n`; `sw` / `w` / `nw` là lật ngang `se` / `e` / `ne` cho mọi lớp cùng lúc.
- Viền ngoài `#1a1020` (không đen tuyền) cho nhân vật, hồn thú, vật đứng; ô nền không viền. Lớp tóc / áo chỉ gồm dải 4 xám chuẩn + `#1a1020`.
- Màu: `art/palette.gpl` + bảng nhấn vùng `art/palettes/<mapId>.gpl` (giao diện `_thuy_mac.gpl`, chỗ sang trọng `_luu_ly.gpl`) + `col` / `robe` của võ hồn (1 sắc tối, 1 sắc sáng suy ra) + màu `TIERS`.
- Bóng, vòng hồn hoàn, aura, mắt phát sáng của hồn thú do client vẽ: không vẽ vào sprite.
- Phong cách: A nền trầm, sáng từ hồn lực; B mỗi vùng một sắc; C thủy mặc cho giao diện; D lưu ly cho chỗ sang trọng.

## 2. Chọn nguồn
| Asset | Nguồn |
|---|---|
| Hồn sư người chơi và animation | ComfyUI (chờ cách làm 8 hướng, #335; không dùng LPC); ảnh đang có làm bằng PixelLab cũ |
| Phụ thể võ hồn | Ảnh Gemini hướng nam (`art/src/gemini/phuthe_s/<mã>_s.png`) làm tham chiếu, vẽ lại đúng cỡ bằng ComfyUI (img2img, chờ #335); vũ khí phẳng, vật đối xứng dùng chung một ảnh cho 5 hướng |
| Hồn thú | ComfyUI (chờ #335); ảnh Gemini nghiêng 3/4 (`art/src/gemini/beast_se/<loài>_se_<cỡ>.png`) chỉ làm tham chiếu hướng `se` / `e`; thú LPC làm hình tạm cho hồn thú thường tới khi ComfyUI vẽ thay (mục 5) |
| Ô nền | Gemini (10 bản đồ hiện dùng), ComfyUI (mục 10); **một bản đồ một nguồn ô nền** |
| Vật đứng, công trình | **ComfyUI** (mục 10) hoặc Gemini |
| Chân dung, khung thẻ, biểu tượng vật phẩm / trạng thái, mảnh giao diện | Gemini; biểu tượng vật phẩm cũng làm được bằng ComfyUI (mục 10) |
| Huy hiệu hệ, chỉnh pixel | Vẽ tay (mục 6) |
| NPC phụ, dân thường, lính gác | LPC (mục 5) |

- **Từ 2026-10-23 không dùng PixelLab** (mục 3): mọi ảnh mới làm bằng ComfyUI (mục 10, không tốn lượt); LPC và Gemini vẫn dùng cho biểu tượng vật phẩm, NPC phụ, chân dung, giao diện như bảng trên.
- Không dùng hay tham chiếu ảnh từ game thương mại, phim, truyện tranh chính thức; không ghi tên họa sĩ còn sống hay tên game thương mại vào prompt.
- Ảnh thô và thư mục làm việc để ngoài repo (thư mục artifact của phiên hoặc thư mục tạm); chỉ chép vào `shared/assets` sau khi người dùng duyệt.

## 3. PixelLab (đã bỏ từ 2026-10-23)
Người dùng chốt **không dùng PixelLab nữa**, không làm ảnh mới bằng PixelLab, không gọi MCP PixelLab, không ghi key vào đâu. Ảnh PixelLab cũ vẫn còn trong game (hồn sư, hồn thú, vài vật đứng) và vẫn đi qua `normalize` / `pack` / `normal` / `validate` như trước (mục 7); nguồn ở `art/src/pixellab/` giữ để chạy lại; `art/CREDITS.md` giữ ghi nguồn.
- Hồn sư, phụ thể, hồn thú nhiều hướng và animation **chờ cách làm hoạt ảnh 8 hướng bằng ComfyUI** (thử ở #335, nhãn `cho-hoat-anh-8-huong`); chưa có cách thì dừng, không đổi sang dịch vụ khác. Giữa chừng hồn sư / hồn thú dùng ảnh đang có hoặc hình tạm LPC (mục 5).
- Bài học còn đúng với mọi công cụ: duyệt khung tĩnh 8 hướng bằng mắt (phóng ×3, đặt trên nền isometric) trước khi làm animation; thu nhỏ ảnh 96×96 bằng code làm hỏng chi tiết nhỏ; ảnh ghép nhiều nhân vật không animate được; hồn thú không vẽ mắt phát sáng hay hào quang (client tô mắt theo `TIERS[bậc].glow`), hồn sư không vẽ vòng hồn hoàn.
- Lỗi màu hay gặp ở hồn sư (ảnh cũ và mọi nguồn có tóc lam / áo xám khóa): mắt lam + lòng trắng, áo ánh tím lam, đai đỏ / vàng: `normalize --split` tự sửa mắt lam và 1–3 điểm lạc màu khóa, còn lại tô tay trước khi tách; mẫu vẽ cả hiệu ứng vào khung: `normalize --strip-fx cast`.
- Màu thế giới (A + B): vật mô tả bằng màu **trầm, hơi khử màu** của vùng, chỉ phần phát sáng thật (nấm, băng tinh, lửa) mới sáng. Ô nền theo bảng chung (trầm), không theo màu vùng: client nhân màu môi trường. Công thức prompt ComfyUI ở mục 10.

## 4. Gemini
Người dùng tạo ảnh ở gemini.google.com; mình viết prompt, nhập và soát. Gemini vẽ nhiều vật trên một ảnh lớn dạng "giả pixel" (mỗi pixel nghệ thuật là khối ~5–7 px không đều, logo sao ở góc dưới phải); `gemini-import.mjs` đưa về pixel thật đúng khung isometric. Ảnh thô ở thư mục artifact (inbox), kết quả ra thư mục tạm ngoài repo.

**Cách tạo ảnh và prompt**
- **Mỗi ảnh một cuộc trò chuyện Gemini mới**: cùng cuộc trò chuyện thì Gemini hay vẽ lại nội dung lượt trước (đã gặp 5/10 ảnh sai bản đồ). Kiểm nội dung từng ảnh trước khi nhập.
- Nền một màu phẳng **`#FF00FF`** (không bóng đổ, không chuyển màu, không viền trắng quanh vật); vật không dùng hồng / tím gần màu nền ở mép. Lưới đều C cột × R hàng, mỗi ô một vật, các vật cách nhau rõ, cùng cỡ, cùng góc nhìn. Không chữ, số, nhãn, khung; logo để công cụ gỡ.
- **Ô nền:** đính kèm **khuôn 2:1 `khuon-o-2x1.png`** (6 thoi xám 800×400 trên nền `#FF00FF`; orchestrator giữ ở thư mục artifact, ngoài repo); không có khuôn thì thoi chỉ ra 1,2–1,6:1. Prompt: "flat isometric floor tile, top face only, exact 2:1 diamond (width = 2 × height), no side thickness, no black outline, no edge highlight or bevel, uniform lighting, muted desaturated colors, seamless texture that tiles with itself". Lưới 3×3 hoặc 2×2 và "empty magenta above and below each diamond, diamonds never touch" (lưới 3×2 trên ảnh 16:9 cho thoi 1,2:1, ép về 2:1 mất khoảng 40% chi tiết dọc). Không ghi số pixel nghệ thuật (Gemini vẽ ô giả khoảng 11 px, thô gấp đôi). Ô 32×16 (chỗ 2×2 không cùng loại, mép) là ảnh riêng: "large sparse texture features, few small details".
- **Vật đứng:** thêm "**NO ground base**, no soil slab under the prop" (khỏi phải cắt đế) và "no glow halo bleeding onto the background"; chân chạm cùng đường đáy, viền ngoài tối.
- **Chân dung:** vẽ chính võ hồn trên nền tối có quầng màu của võ hồn, không vẽ chủ nhân; giữ nguyên prompt lô 1 (`gemini-prompts-vohon-tinhdau.md` của orchestrator).
- Hồn thú Gemini ra nghiêng 3/4 sang phải, không đúng hướng nam: chỉ làm tham chiếu.
- Gemini hay kẻ lưới tối giữa các ô (giao diện, thẻ, trạng thái): xóa lưới (thay bằng màu nền) trước khi nhập, không thì cả lưới thành một vật.

**`gemini-import.mjs`**
| Lệnh | Việc |
|---|---|
| `--kind tile --out <dir> --names a,b,… <ảnh>` | Ô nền: lấy mặt trên thoi (`--inset auto` bỏ dải mép khác màu), ép đúng 2:1, làm liền mép (`--seamless on`), ghi `<dir>/32/` (ảnh 32×32) và `<dir>/64/` (ô lớn), suy từ một hằng `ISO_TILE_W` trong `lib.mjs` (khớp `client/src/iso.ts`). `--size 32,64` chọn cỡ, `--face-only` chỉ mặt trên. |
| `--kind tile-block …` | Như trên nhưng giữ viền (tối về `#1a1020`), không làm liền mép (mép vách, bờ nước). |
| `--kind honsu\|vohon\|beast\|object …` | Sprite theo hằng `ISO_*` trong `lib.mjs`; hồn thú bắt buộc `--size` trong `ISO_BEAST_SIZES`, vật bắt buộc `--size`. Một vùng / một lô dùng **chung `--scale`** (Tinh Đấu: 0,6) để cỡ điểm ảnh đều; viền `#1a1020` nếu thiếu; mặc định `--palette gpl`. |
| `--kind item --names … [--gray a,b] <ảnh>` | Vật phẩm 32×32: bỏ khung nền tối, nền trong suốt (`--bg-tol`), `--gray` ghi bản xám (hồn cốt). |
| `--kind item --icon [--frame] --grid CxR --names … <ảnh>` | Biểu tượng vẽ trên nền màu khóa **hoặc nền trong suốt thật** (ChatGPT: điểm alpha ≥ 128 là vật, alpha thấp là nhiễu; ảnh còn lại không cần `--key`): mỗi món vừa khung 32×32 riêng, căn giữa, phóng tối đa 1,5×. `--frame`: khung viền phủ kín ô, đưa về 32×32 bằng cách bớt cột / hàng giữa (không lấy mẫu lại viền). Tự dò cỡ khối hay ra nửa chu kỳ (biểu tượng nát, khung mất độ dày): đặt `--cell` theo cỡ khối thật. |
| `--kind vohon --key2 #808080 [--key2-tol 18] [--man-h 52] --grid 5x1 --names s,se,e,ne,n <ảnh>` | Phụ thể võ hồn vẽ quanh khuôn 5 ma-nơ-canh xám (`khuon-5-hon-su.png`, #808080 trên #FF00FF): xóa ma-nơ-canh, căn chân và tâm ngang theo ma-nơ-canh (không phải hộp bao phụ thể), hệ số thu chung = `--man-h` (52 điểm, chiều cao người chơi) / chiều cao ma-nơ-canh. Dùng `--palette auto-item --colors 24` (bảng `art/palette.gpl` chỉ còn 6–16 màu). Kết quả là khung 96×96 gộp; tách nửa sau / trước bằng `vohon-part.mjs` ở bước sau. Gemini hay nhòe khung 2 (se): loại ảnh có vệt mờ hồng-tím. |
| `node tools/assets/equip-import.mjs --in <hộp thư> --out <tmp> [--cell k=10.4]` | Trang bị hồn sư (#417): ảnh `trangbi-b0…b5` (lưới 5×2), `trangbi-o` (ô trống), `trangbi-k` (khung bậc, lưới 3×2) → `item_equip_<mẫu>` / `item_equip_slot_<ô>` / `item_equip_frame_<bậc>` theo `equipIconKeys()`, in khóa còn thiếu; chép vào `shared/assets/sprites/iso/item/` (bỏ tiền tố `item_`) rồi `validate --register <khóa> --iso --tool "ChatGPT … "` (mục CREDITS riêng cho ChatGPT). |
| `--kind portrait [--size 64\|112\|24] …` | Chân dung võ hồn 64, NPC 112, trạng thái 24: cắt giữa 1:1 từ pixel thật, không viền ngoài, `--palette auto-item --colors 32`; ô nền trong suốt (biểu tượng tròn) thì căn giữa như sprite, thêm viền. |
| `iso-preview.mjs <ra.png> --tiles grass=a.png,… [--big grass=A.png] --size 16 --scale 3` | Dựng mảnh bản đồ để soát mép ghép, màu, độ lặp (đọc được cả ô PixelLab). |

- Tách vật theo thành phần liên thông (trên → dưới, trái → phải, khớp `--names`) hoặc `--grid CxR` khi vật dính nhau; số tên khác số vật thì dừng và in hộp bao. Cỡ ô giả dò tự động; sai thì `--cell N` (`--cell 1` cho ảnh đã là pixel thật).
- Bảng màu: ô mặc định `--palette auto-item` (mỗi vật 10 màu); `--palette <file>` với `art/palette.gpl` gộp bảng nhấn vùng cho vật đứng; `--palette none` để xem màu gốc.
- Logo: `--logo auto` (mặc định); vị trí lạ thì `--logo star:cx,cy,R[,alpha]`, `--logo x,y,w,h` hoặc `--logo off`.
- Ô vẽ trên tấm nền riêng khác `#FF00FF`: `--key #rrggbb`. Viền tím nhạt quanh quầng sáng: `--fringe 12`.
- **Đế đất:** `--cut-base a,b|all` bỏ mặt bên và cỏ đất mặt trên (`--base-tol`); báo `cắt đế rộng W dày t` hoặc `KHÔNG dò được đế`. Vật cùng màu với đế (bụi cỏ, lau sậy) cắt xấu thì không đưa vào game, xin vẽ lại không đế.
- Khung vật đứng: chạy một lần với khung lớn và `--debug`, đo hộp bao trong `_native/`, rồi chạy lại với khung bội `ISO_PROP_STEP`. Mỗi lần chạy ghi `_preview.png` (×4) và `_report.json` (cỡ ô giả, tỉ lệ mặt trên, độ lệch mép ghép).

```bash
node tools/assets/gemini-import.mjs --kind tile --names grass,dirt,water --out <tmp>/flat <inbox>/tiles/gemini-tiles-02.png
node tools/assets/iso-preview.mjs <tmp>/map.png --tiles grass=<tmp>/flat/32/grass.png,path=<tmp>/flat/32/dirt.png,water=<tmp>/flat/32/water.png --big grass=<tmp>/flat/64/grass.png --scale 3
```

**Đưa vào game (sau khi người dùng duyệt)**
- Ô nền: `iso-build.mjs ground <tên> <32.png> [<64.png>]` rồi thêm vào `tiles.json` (mục 7). Vật đứng: `iso-build.mjs prop`.
- Chân dung / NPC / vật phẩm / trạng thái / giao diện / thẻ: chép vào `shared/assets/sprites/iso/{portrait,npc,item,status,ui}/…`, rồi `validate.mjs --register <key> --iso --tool "Gemini (gemini.google.com) + tools/assets/gemini-import.mjs" --prompt "<ảnh, ô, prompt>" --note "<lệnh nhập>"` (mảnh giao diện kéo giãn thêm `--nine N`). CREDITS vào mục "Asset tạo bằng AI (Gemini)"; validate kiểm mã có trong `NPCS` / `ITEMS` / `STATUS_IDS`…

## 5. LPC (NPC phụ; hình tạm hồn thú thường)
Universal LPC Spritesheet Character Generator (<https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator>). `tools/assets/lpc-compose.mjs` đọc PNG lớp của repo đó, xuất theo bố cục sheet hồn sư 24 × 6.
- **Phạm vi (người dùng đã quyết):** chỉ **NPC phụ** (11 NPC trong `NPCS`: `lpc_<mã NPC>`), dân thường `lpc_dan_*`, lính gác `lpc_linh_gac`. **Không** dùng cho hồn sư người chơi (LPC chibi kiểu tây, chỉ 4 hướng).
- **Giấy phép** (`GAME_DESIGN.md` 5.11 "Asset bên ngoài"): nhận **mọi giấy phép đã biết** (CC0, CC-BY, CC-BY-SA, OGA-BY, CC-BY-NC, GPL); giấy phép lạ / trống thì công cụ dừng: chọn lớp khác. Lớp nhiều giấy phép thì dùng theo nhóm ít ràng buộc nhất (CC0 / CC-BY / OGA-BY trước SA, GPL, NC). Lớp chỉ có CC-BY-SA / GPL (ví dụ `hair/messy1`, `hair/swoop`, `hair/ponytail`, nhiều `bangs*` / `spiked*`, `weapon/polearm/*`, kính `nerd` / `round`, đầu `male_plump`, râu `basic`) dùng được nhưng cả sheet `lpc_<tên>` ghép từ nó theo giấy phép SA / GPL: công cụ gắn cờ ở cột "Game dùng theo" và ghi chú dưới bảng; còn lớp khác tương đương thì ưu tiên lớp không cờ. Lớp NC gắn cờ NC (thay nếu thương mại hóa).
- **Ghi công:** công cụ tra **đúng mục** của từng file đã đọc trong `CREDITS.csv` (không có thì dừng, không đoán theo thư mục) và ghi vào mục LPC của `art/CREDITS.md` giữa `<!-- lpc:start -->` / `<!-- lpc:end -->` (mỗi NPC một mục, chạy lại thì thay). Không sửa tay vùng này.
- **Tải repo LPC ngoài repo game** (`git clone --depth 1`, khoảng 450 MB, vào thư mục artifact); chỉ đọc `spritesheets/`, `sheet_definitions/`, `CREDITS.csv`, không chạy code của repo đó.
- **Công thức** `art/src/lpc/<tên>.json` (`--recipe`, cú pháp ở đầu file công cụ; `"base": true` thêm sẵn thân, đầu, giày); thử nhanh `--npc truong_thon | thuong_nhan | tho_ren | linh_gac`. Trang phục phương Đông gần nhất: nam `longsleeve2_vneck` + `legs/skirts/plain` + `torso/waist/obi`, búi tóc `parted_side_bangs` + `extensions/ponytails/topknot_short`; nữ `dress/kimono` + `kimono/sleeves` + obi (kimono / robe / tunic chỉ có cho thân nữ).
- **Màu:** NPC phụ không nổi hơn hồn sư. `--game` dùng `hairRamp` / `outfitRamp` của công thức (4 màu trầm của `art/palette.gpl`), không có thì `HAIR_COLORS` / `OUTFIT_COLORS` giảm bão hòa; lớp `keep` (giáp, tạp dề) giảm bão hòa theo `--desat` (mặc định `DESAT_DEFAULT`). `--hair-col`, `--outfit-col`, `--skin` là chỉ số trong `shared/data.ts`.
- Công cụ tự lo: ánh xạ 4 hướng LPC → 5 hướng vẽ (`tools/assets/README.md`), chọn khung (walk 6, attack từ slash, cast từ spellcast, `idle` bằng `pack --breathe`, `hurt` / `die` hướng `s` từ hurt LPC, phần còn lại `pack --code`), dời chân về gốc (32, 58), đưa màu về bảng, mép và màu gần đen thành `#1a1020`.

```bash
node tools/assets/lpc-compose.mjs --lpc <repo LPC> --out <tmp>/lpc --npc linh_gac --outfit-col 0      # thử, ra <tmp>/lpc/<tên>_mau.png
node tools/assets/preview.mjs <tmp>/xem.png <tmp>/lpc/linh_gac_mau.png --dirs8 --ground
for f in art/src/lpc/*.json; do node tools/assets/lpc-compose.mjs --lpc <repo LPC> --game --recipe $f; done   # đưa vào game
```
`--game` ghi `shared/assets/sprites/iso/lpc/<tên>.png` + `_n.png`, thêm key `lpc_<tên>` (`"iso": true`) vào manifest và ghi công. Client tự dùng `lpc_<mã NPC>`; dân thường mới thì thêm tên vào `CROWD` (`client/src/crowd.ts`). Đã có (#201): lính gác cầm giáo `linh_gac_giao` (cổng Thiên Đấu), `dan_lao_nhan` (râu bạc), `dan_nho_sinh` (tóc dài, kính tròn), `dan_nong_phu_cuoc`, `dan_thon_nu_toc_tet`, `dan_nu_duoi_ngua`, thương nhân lưu động `thuong_nhan_luu_dong` (đầu béo, ria, khăn trùm). Vũ khí / dụng cụ LPC chỉ có walk / thrust / hurt nên khung attack / cast không có giáo, cuốc. Soát bằng mắt (khung đứng 5 hướng, so với chân dung `npc_<mã>`) rồi `npm run check`.

**Thú LPC làm hình tạm cho hồn thú thường (người dùng đã duyệt; dùng tới khi ComfyUI vẽ thay, #335):** `tools/assets/lpc-beast.mjs` đọc sprite thú LPC / LPC-style tải từ OpenGameArt (sói, nhện, gấu, cáo, sư tử cái, chuột, thỏ, lợn rừng, chim, dơi, hổ Stendhal, rắn và hoa ăn thịt [LPC] Monsters, Plant Ent, cá đuối, sứa; bảng loài ↔ mẫu, gói, giấy phép ở `SPECIES` / `PACKS` đầu file, `--list` in ra) và xuất sheet hồn thú 20 × 5 theo khung bậc. Không dùng cho thú vương / boss thế giới (khung ≤ 128) hay hồn sư.
- Gói nào có giấy phép đã biết đều dùng được, kể cả gói chỉ CC-BY-SA / GPL (rắn LPC, LPC Monsters, bò LPC, cá LPC…): công cụ ghi công kèm cờ SA / GPL / NC (sheet đã sửa theo đúng giấy phép đó); giấy phép lạ / trống thì dừng. Thêm gói thì đọc trang OGA lấy đúng tác giả, giấy phép, lời ghi công rồi ghi vào `PACKS`; loài mới vẫn phải được chủ repo duyệt (dòng dưới).
- Tải gói **ngoài repo game** (thư mục artifact), mỗi gói một thư mục con đúng đường dẫn `file` trong `SPECIES`; chỉ đọc PNG.
- Sheet nguồn lạ: lưới có `file` riêng (attack / die ở file khác), ô là danh sách cặp [hàng, cột] (khung nối tiếp qua nhiều hàng), biến đổi `vflip` / `rot90` (sprite nhìn thẳng từ trên chỉ một hướng), `key` (màu nền phẳng cần bỏ); cú pháp ở chú thích `SPECIES`.
- Công cụ tự lo: 4 hướng LPC → 5 hướng vẽ như NPC phụ; animation có trong gói thì chọn khung, thiếu thì vẽ bằng code (idle thở, attack lùi rồi lao, hurt lùi, die ép dẹt); đổi sắc theo loài, giảm bão hòa (`--desat`), đưa màu về bảng chung + bảng vùng `map`; phóng nguyên ×1 / ×2; chân chạm gốc khung bậc; viền `#1a1020`; ghi điểm mắt từng hướng (`eyes`, màu mắt nguồn đổi thành màu "Mắt") vào `<loài>.json`; ghi công vào `<out>/CREDITS-LPC-BEASTS.md` hoặc mục `<!-- lpc-beast:start -->` / `<!-- lpc-beast:end -->` của `--credits`.
- **Đang dùng trong game (19 loài):** Liệt Trảo Hùng (gấu), Nhân Diện Ma Chu non (nhện), Phong Lang (sói), Hắc Bối Dã Trư (lợn rừng), Nhu Cốt Thỏ hoang (thỏ), Điền Thử (chuột); thêm theo #201: Quỷ Đằng (Plant Ent, khung 128 lệch bậc đã duyệt), Quỷ Hổ (hổ Stendhal), Kim Linh Ưng (đại bàng), U Minh Lang, Tuyết Lang (sói), Ám Kim Khủng Trảo Hùng (gấu đen), Băng Phong Bạch Hùng (gấu Bắc Cực), Tuyết Vĩ Yêu Hồ (cáo Bắc Cực), Thanh Lân Xà, Thực Nhân Hoa ([LPC] Monsters), Hắc Vụ Biên Bức (dơi), Lôi Quang Hải Diêu (cá đuối), U Linh Hải Mẫu (sứa). Các ứng viên "tạm được" khác của catalog (hổ mang, cá sấu, khỉ, bò…) chủ repo **không** duyệt. **Không** dùng sư tử cái cho Tử Văn Báo; loài khác thêm vào game phải được chủ repo duyệt từng loài.
- Đưa vào game: chép `<out>/<loài>.png` vào `shared/assets/sprites/beast/`, `normal.mjs` sinh `_n.png`, thêm vào manifest `{ "key": "beast_<loài>", "frame": [cỡ, cỡ], "iso": true, "map": "<vùng>", "lpc": true }` (cỡ, vùng lấy ở `<loài>.json`); `"lpc": true` để client không dùng cho thú vương / boss. Ghi công bằng `--credits art/CREDITS.md`. ComfyUI vẽ xong loài nào thì thay ảnh, bỏ `"lpc"` và dòng ghi công của loài đó.

```bash
node tools/assets/lpc-beast.mjs --src <thư mục gói thú> --out <tmp>/thu [--species phong_lang,liet_trao_hung]
node tools/assets/preview.mjs <tmp>/xem.png <tmp>/thu/phong_lang.png --dirs8 --ground
node tools/assets/lpc-beast.mjs --src <thư mục gói thú> --out <tmp>/thu --species <loài,…> --credits art/CREDITS.md   # đưa vào game
cp <tmp>/thu/<loài>.png shared/assets/sprites/beast/ && node tools/assets/normal.mjs shared/assets/sprites/beast/<loài>.png
```

**Biểu tượng vật phẩm và hiệu ứng LPC (chủ repo duyệt từng ảnh, #201):** `tools/assets/lpc-item.mjs` theo công thức `art/src/lpc-item.json` (`packs`: tiêu đề, URL, thư mục, giấy phép như trang OGA; `items`: ô [cột, hàng] của sheet 32×32, `gray`; `fx`: dải khung một hàng). Biểu tượng cắt nguyên ô (không phóng), căn giữa, viền `#1a1020`, giảm còn 24 màu; `gray` (rương, tiên thảo) giãn sáng để client tô theo `col` của món (`TINTED` trong `uiArt.ts`). Hiệu ứng `fx_<tên>` giữ màu gốc, client chạy một lần bằng `playFx` (`sprites.ts`). Tải gói ngoài repo như thú LPC; công cụ ghi manifest và mục `<!-- lpc-item:start -->` của `art/CREDITS.md` kèm cờ SA / GPL.
- **Đang dùng:** `item_hoi_thanh_phu` (cuộn giấy), `item_ruong`, `item_tien_thao` (LPC Items and game effects, Reemax ⚑ SA), `fx_no` (LPC Explosions, CC0) ở quả nổ tiên cơ Cường Công.

```bash
node tools/assets/lpc-item.mjs --src <thư mục gói> --preview <tmp>/item [--only item_ruong]   # ghi ảnh, manifest, ghi công
```

## 6. Vẽ tay
- **Huy hiệu hệ** `he_<mã HE_IDS>` 24×24: `node tools/assets/he-icons.mjs [--out <dir>]` vẽ từng điểm từ mảng ký tự trong file (tròn màu hệ, viền vàng kim, biểu tượng trắng) vào `shared/assets/sprites/iso/he/`; sửa hình thì sửa mảng rồi chạy lại; dừng nếu `HE_IDS` đổi. CREDITS ghi ở mục "Asset tự vẽ" bằng tay (`--register` chỉ ghi mục PixelLab / Gemini).
- **Chỉnh pixel:** Aseprite với bảng sinh bằng `node tools/assets/palette.mjs <ra.gpl> [--map <mapId>]` (không đưa vào repo). Xuất sheet từ Aseprite: `aseprite -b file.aseprite --sheet out.png --sheet-type rows --sheet-columns 24`. Sửa xong chạy lại `validate`.
- Giao diện (C, D) vẽ bằng code hoặc Aseprite theo `art/palettes/_thuy_mac.gpl`, `_luu_ly.gpl`.

## 7. Dây chuyền `tools/assets` (Node thuần)
**ảnh thô → `normalize` → `pack` → `normal` → `preview` → `validate --register` → xem trong game → PR**. Mọi lệnh theo hằng `ISO_*`, `isoLayout` trong `lib.mjs`.

| Lệnh | Việc |
|---|---|
| `normalize.mjs --kind honsu\|vohon\|beast<bậc> --out <dir> <ảnh…>` | Xóa nền, cắt khung thô (ảnh PixelLab cũ 76×76, 92×92…; nguồn mới là ảnh vuông bất kỳ với `--place bbox`) về khung chuẩn **không phóng**: giữa khung thô → x của gốc, dòng chân theo hướng lấy từ khung đứng (hồn thú: một dòng chân chung; `beast0`–`4` = 64, 64, 96, 96, 128; `--kind beast --size 160\|192`). Đổi tên PixelLab sang hướng ngắn (`south-east_walk_0.png` → `se_walk_0`). Dòng cuối in `--foot s=62,se=65,…`: chạy animation riêng thì truyền lại. `--place bbox` cho ảnh không phải khung thô PixelLab. Màu về bảng, viền `#1a1020`. `--split` tách thân / tóc / áo theo màu khóa; `--vohon <id>` chỉ dùng màu võ hồn đó; `--halves <y>` tách phụ thể sau / trước; `--strip-fx <anim>` gỡ hiệu ứng mẫu vẽ vào khung. |
| `pack.mjs --kind honsu\|beast<bậc> --out <sheet.png> <dir>` | Ghép `{hướng}_{anim}_{i}.png` vào sheet 24 × 6 / 20 × 5; số khung khác bố cục thì chọn đều. `--breathe <y>` tạo 4 khung `idle` từ khung đứng (khung 64: y khoảng 30, dưới vai); `--code hurt,die,absorb` vẽ tạm các ô đó (dòng hông `--hip`, mặc định `ISO_HIP`); `--fill` chép tạm `idle`. Hồn sư: `--set <giới>_<kiểu tóc>` ghi cả 3 lớp vào `shared/assets/sprites/honsu/`. |
| `vohon-part.mjs <mô tả.json> --body m:<thân>,<áo>,<tóc> --body f:<…> --out <dir>` | Dựng phụ thể tĩnh 5 hướng theo file mô tả `art/src/pixellab/vh_iso/<id>.json` (mỗi hướng danh sách mảnh `img`, `pivot` điểm cầm, `hand`, `off`, `flip`, `rot`, `rim` viền sáng, `layer` b / f / `{"split": y}`, ghi đè theo giới `"f": {…}`); ghi `<dir>/<giới>/{hướng}_{b,f}.png` + `grip.json`. |
| `pack.mjs --kind vohon --id <id> --part <dir> --body … --attach hand\|head\|back\|feet [--swing \| --angles a,b,c,d]` | Ghép phụ thể vào nửa sheet theo giới (`ISO_VH_SEXES`), dời theo điểm neo từng khung thân (`frameAnchors`); `--swing` xoay vũ khí theo `ISO_ATTACK_SWING`, `--angles` góc riêng (vũ khí dài vung ít hơn); xoay kiểu RotSprite. Ghi `vohon/<id>_b.png`, `<id>_f.png`. |
| `normal.mjs <ảnh…> [--union] [--edge 0]` | Tự sinh normal map `_n.png` từng khung. `--union` cho 3 lớp một bộ hồn sư; `--edge 0` cho ô nền. **Mọi ô nền và vật đứng mới đều phải có `_n.png`**: client tải chúng khi bật ánh sáng (10.7), thiếu thì 404 và vật coi như phẳng. |
| `preview.mjs <ra.png> <sheet…> --dirs8 [--anim idle,walk] [--raw <dir normalize>] [--ground]` | Xếp 8 hàng hướng (3 hướng lật nền ánh lam), chồng lớp khớp gốc chân; `--raw` thêm ảnh gốc (chưa lật) để so với hướng lật; `--ground` vẽ thoi dưới chân. Không `--dirs8`: phóng to, `--grid`, `--crop`. |
| `validate.mjs [--register <key> [--iso] [--frame 96x96] [--map <mapId>] [--nine N] --prompt … --tool … --note …]` | Kiểm mọi key trong manifest (chạy trong `npm run check`, pre-commit): kích thước, màu ngoài bảng, ô bắt buộc, khung chép tạm, chân chạm gốc, normal map, bộ hồn sư không trộn lớp `iso` với lớp 32×32. `--register` thêm / ghi đè key trong `manifest.json` và một dòng `art/CREDITS.md`; `--map` cho phép bảng nhấn của vùng. |
| `iso-build.mjs ground <tên> <32.png> [<64.png>]` / `prop <tên> <ảnh.png> --map a,b [--drop-base N\|--drop-water] [--lift 3]` / `check` | `ground`: chép ô vào `shared/assets/iso/ground/<tên>_{0,1}[_lon].png` (biến thể `_1` dời nửa chu kỳ). `prop`: vật → `sprites/iso/props/<tên>.png` (viền, màu về bảng chung + bảng vùng, khung bội 16, chân giữa đáy; `--drop-base` bỏ đế cỏ, `--drop-water` bỏ đế nước), rồi `validate --register prop_<tên> --iso`. Ghi ô / vật vào `tiles.json` (bộ `"*"` hoặc bộ bản đồ, `tên~#rrggbb` để nhân màu). `check`: mọi gid của 10 bản đồ có ô / vật / kiểu nhà. Nhà và tường thành không cần ảnh. |

**Màu khóa khi tách lớp hồn sư:** tóc lam, áo / quần / váy xám, giày nâu, da bình thường. `--split`: lam → tóc, xám → áo, còn lại → thân; tóc và áo về dải 4 xám theo độ sáng từng lớp. Tự sửa mắt lam (điểm lam vùng đầu có tròng trắng bên cạnh → màu "Mắt"; log báo số điểm) và điểm lạc màu khóa (theo lớp đa số quanh nó); màu gần đen (độ sáng < 12%) → `#1a1020`. Còn phải tự soát: áo ánh tím, đai màu, tóc xám. Lỗi màu mới thì đếm màu nguồn rồi chỉnh `layerOf` / `mapColor` trong `normalize.mjs`.

Một bộ hồn sư (ảnh thô `south.png`… và `south_walk_0..5.png` trong `<ảnh thô>/m_0/`):
```bash
node tools/assets/normalize.mjs --kind honsu --split --out <tmp>/m_0 <ảnh thô>/m_0/*.png
node tools/assets/pack.mjs --kind honsu --set m_0 --breathe 30 --code hurt,die,absorb <tmp>/m_0
node tools/assets/normal.mjs --union shared/assets/sprites/honsu/{body,outfit,hair}_m_0.png
node tools/assets/preview.mjs <tmp>/m_0_8.png shared/assets/sprites/honsu/{body,outfit,hair}_m_0.png --dirs8 --anim idle,walk --raw <tmp>/m_0 --ground
for l in body outfit hair; do node tools/assets/validate.mjs --register hs_${l}_m_0 --iso --prompt "…"; done
```

Một phụ thể (`B=shared/assets/sprites/honsu`):
```bash
BM=m:$B/body_m_0.png,$B/outfit_m_0.png,$B/hair_m_0.png; BF=f:$B/body_f_0.png,$B/outfit_f_0.png,$B/hair_f_0.png
node tools/assets/vohon-part.mjs art/src/pixellab/vh_iso/hao_thien_chuy.json --body $BM --body $BF --out <tmp>/raw
for s in m f; do node tools/assets/normalize.mjs --kind vohon --vohon hao_thien_chuy --gray none --foot 74 --out <tmp>/part/$s <tmp>/raw/$s/*.png; cp <tmp>/raw/$s/grip.json <tmp>/part/$s/; done
node tools/assets/pack.mjs --kind vohon --id hao_thien_chuy --part <tmp>/part --body $BM --body $BF --attach hand --angles -20,-40,30,10
node tools/assets/preview.mjs <tmp>/xem.png shared/assets/sprites/vohon/hao_thien_chuy_b.png $B/{body,outfit,hair}_f_0.png shared/assets/sprites/vohon/hao_thien_chuy_f.png --dirs8
```
Vũ khí cầm tay để đầu chĩa lên phải, tay `right`; hư ảnh thú sau lưng neo `back`; bụi dưới chân neo `feet`.

## 8. Quy trình "tạo <asset>"
1. Đọc mục 5.11 và `tools/assets/README.md`, xác định key (bảng mục 1) và nguồn (mục 2).
2. ComfyUI (ảnh tĩnh, mục 10): chờ hàng đợi Mac trống, 2–4 seed, `comfy-key` → `gemini-import`. Hồn sư / hồn thú nhiều hướng: chờ #335. Gemini: viết prompt, người dùng tạo, nhập bằng `gemini-import`. LPC: công thức `art/src/lpc/`.
3. normalize → pack → normal → `preview.mjs` soát lệch chân, màu lạ, điểm vụn, hướng lật → `validate.mjs --register` → `npm run check`.
4. Xem trong game ở ×2 và ×3 (bật server và client; `ao preview` / `ao browser`, hoặc Chrome headless qua CDP nếu panel bị ẩn): đủ 8 hướng, ít nhất 2 màu tóc và 2 màu áo, đứng trước / sau cây và nhà, nền rừng sâu.
5. `npm run build --prefix client`, bot khi server bật; PR kèm ảnh chụp, nguồn ảnh (và seed ComfyUI); đánh dấu bước Giai đoạn 10 ở mục 7.

## 9. Phía client
- `client/src/sprites.ts` (`preloadSprites`) tải key trong manifest (bố cục nhận theo bề ngang sheet, `fitHonsuLayer` đặt gốc / cỡ theo texture; `lpc_*` chỉ tải của bản đồ đang vào qua `lpcPreloader`); `textures.ts` / `honsuArt.ts` chỉ vẽ bằng code key **chưa có** ảnh, nên thêm key vào manifest là đủ. Giao diện HTML đọc ảnh qua `client/src/uiArt.ts`; ô và vật đứng qua `isoMap.ts` theo `tiles.json`.
- Key hồn sư lấy bằng `honsuKey(lớp, giới, kiểu tóc)`; hoán màu bằng `recolor` (key `hs_hair_f_2@3`, thân tông da khác `hs_body_f_2@2`); ánh xạ khung phụ thể `vohonFrame`, nửa sheet theo giới `vohonHalf`.

## 10. ComfyUI (tự host, công cụ chính; PixelLab đã bỏ)
ComfyUI chạy trên MacBook M4 Pro của chủ repo trong LAN, cổng 8188. **IP Mac xem `MACBOOK_IP` trong `server.py`** (có thể đổi khi mạng cấp lại; đặt `MAC=$(sed -n 's/^MACBOOK_IP = "\([^"]*\)".*/\1/p' C:/mcp-servers/comfyui-pixel/server.py)` rồi dùng `http://$MAC:8188`). Gọi qua MCP `comfyui-pixel` (`server.py` và workflow `pixel_sprite_api.json` nằm ở máy người dùng, **ngoài repo**; cách dùng ở thư mục artifact của phiên dựng quy trình #330). Workflow: SDXL base 1.0 + LoRA pixel-art-xl (độ mạnh 1,1) + VAE sdxl-vae-fp16-fix, sinh 1024×1024, 28 bước `dpmpp_2m` / `karras`, rồi `ImageScale` nearest-exact về 128 px (×8: mỗi ô 8×8 của LoRA thành 1 điểm ảnh) và `ImageQuantize` không dither. Không tốn lượt hay tiền; giới hạn là máy.
- **Mỗi lần một job.** Mac 16 GB: khoảng 5 giây / bước, 3 phút / ảnh ở 28 bước; **`mode="lcm"` (mặc định, LCM 8 bước) khoảng 85 giây / ảnh**, chất lượng gần ngang (so ở #339; `mode="full"` cho 28 bước) (lần đầu nạp model lâu hơn). Trước khi gửi, `curl -s http://$MAC:8188/queue` phải trống (`queue_running`, `queue_pending` rỗng: có thể phiên khác đang dùng); không gửi song song. Mac tắt hoặc ComfyUI lỗi thì báo orchestrator, không đổi sang dịch vụ khác.
- **Hợp:** vật đứng, công trình, biểu tượng vật phẩm, ô nền (ảnh tĩnh một khung). **Hồn thú lai (#386):** mỗi loài 3 ảnh tĩnh nam / đông / bắc (cùng seed, cùng mô tả; `one single … only, quadruped on all four legs, horizontal body, full body`; nền xám thì `comfy-key --tol 14` không `--shadow`), hướng bắc img2img (`init_image`, denoise 0,7–0,85) từ ảnh dẫn nhìn từ sau vẽ bằng code (khối lưng, đầu, đuôi theo dáng loài); không ra lưng thì dùng lại ảnh đông. Mỗi hướng `gemini-import --kind beast --size <cỡ> --scale <chung> --cell 1 --logo off --grid 1x1 --palette auto-item --colors 24`, ghép 3 khung thành sheet rộng gấp 3 cao, `normal.mjs --frame <cỡ>x<cỡ>`, `validate --register beast_<loài> --frame <cỡ>x<cỡ> --iso --static --map <vùng>`; gỡ cờ `lpc` và dòng ghi công LPC của loài. **Ảnh đông phải nhìn sang phải** (ảnh gốc nhìn sang trái thì lật ngang trước khi nhập; xem hướng bằng trang xem trước, không đoán); ảnh dẫn img2img mang màu của nó (rắn ảnh dẫn xanh ra rắn xanh), nên tô ảnh dẫn đúng màu loài; loài trắng trên nền trắng (hổ) ra xám tro để `comfy-key` không ăn mất thân; hướng nam / bắc ra tư thế hỏng thì dùng lại ảnh đông. Chuyển động ở client (`staticBeastPose`, họ `beastFamily` mục "Hồn thú lai" ở GAME_DESIGN 5.11). **Chưa hợp:** hồn sư, phụ thể, hồn thú nhiều hướng và animation (không giữ được cùng một vật giữa các hướng / khung); hồn thú chỉ thử khung tĩnh làm tham chiếu; cách làm hoạt ảnh 8 hướng đang thử ở #335.
- Mọi ảnh ComfyUI vào game phải được chủ repo duyệt (mẫu đã duyệt làm chuẩn phong cách cho lô sau). Một bản đồ một nguồn ô nền: không trộn ô ComfyUI với ô Gemini / ô cũ trên cùng bản đồ.

**Tham số `generate_pixel_art`** (chỉ `prompt`, `output_path` là bắt buộc; lệnh cũ hai tham số vẫn chạy)
| Tham số | Mặc định | Ghi chú |
|---|---|---|
| `prompt` | | Server tự thêm `pixel art, ` ở đầu (từ khóa LoRA); prompt không có chữ `background` thì thêm `isolated on plain white background`. |
| `output_path` | | PNG đã thu nhỏ + giảm màu (đường dẫn tuyệt đối, thư mục artifact). |
| `width`, `height` | 128 | Cỡ đích; giữ đúng `gen_width / 8`, `gen_height / 8` (thu số lẻ làm vỡ ô điểm ảnh). |
| `colors` | 24 | 1–256; 0 = không giảm. `gemini-import` còn đưa màu về bảng lần nữa. |
| `seed` | -1 (ngẫu nhiên) | Kết quả trả về seed đã dùng: ghi vào CREDITS để vẽ lại đúng ảnh. |
| `negative` | | Thêm vào prompt âm mặc định (blurry, 3d render, photo, anti-aliasing, text, frame…). |
| `gen_width`, `gen_height` | 1024 | Bội 64, 512–2048; SDXL đẹp nhất quanh 1 megapixel (1024×1024, 1152×896, 896×1152). |
| `steps`, `lora_strength` | 28, 1,1 | 10–60, 0–2 (mẫu #330 đều chạy với mặc định). |
| `raw_path` | | Lưu thêm ảnh gốc 1024 (để so hoặc nhập bằng `--cell auto` khi bản 128 mất chi tiết). |
| `init_image`, `denoise` | , 0,75 | img2img: PNG trên Windows làm ảnh dẫn (kéo về `gen_*`), `denoise` 0,05–1 (thấp giữ sát ảnh dẫn). Dùng cho công trình (bên dưới). |
| `mode` | "lcm" | "lcm": thêm LoRA `lcm-lora-sdxl` (có trên Mac) nối sau pixel-art-xl, 8 bước, sampler `lcm` / `sgm_uniform`, cfg 1,5, pixel-art-xl 1,0 (bỏ qua `steps`). "full": workflow gốc `steps` bước. `fast=True` là bí danh cũ của "lcm". |

**Công thức prompt:** `[chủ thể: tả hình bằng tiếng Anh] + [góc nhìn] + [màu theo vùng] + [nét] + [nền]`.
- **Tên Đấu La không có nghĩa với SDXL:** tả hình thay vì gọi tên ("Hồi Thành Phù" → `one vertical strip of yellow paper with red ink rune symbols and a red seal stamp`; "Phong Lang" → `grey wind wolf, slate grey fur with pale blue-white wind-swept tufts`). Kiến trúc, đồ vật theo kiểu cổ phong phương Đông (`ancient chinese village house, curved grey clay tile roof with upturned eave corners`).
- **Góc nhìn (đã thử 2026-10-22):** chỉ bằng chữ, SDXL + pixel-art-xl vẽ công trình **nhìn thẳng** hoặc ra tấm linh kiện, dù có `isometric`, `seen from a high corner angle`, negative `front view`.
  - **Công trình có dáng riêng (tháp nhiều tầng, đền có bệ bậc và hàng cột, nhà sàn, lều, cổng gác, giàn phơi, hàng rào; #385):** một hộp mái chỉ ra "nhà nhỏ một gian" nên dùng ảnh dẫn nhiều khối `node tools/assets/comfy-shape.mjs <spec.json> <dẫn.png> [--size 1280]` (spec là mảng khối `box` / `cone` / `cyl` / `poly`, khai từ xa tới gần; mẫu 8 công trình ở `tools/assets/comfy-guides/`), tô màu tường / mái theo tông vùng ngay trong spec (model bám màu ảnh dẫn: hộp be + mái xám thì ra nhà be mái xám dù prompt tả băng); `comfy-guide.mjs` cũng có `--wallc` / `--roofc` cho hộp đơn. Tháp / đền cao: `--size 1280` rồi `gen_width = gen_height = 1280`, `width = height = 160`; denoise 0,65–0,70 giữ dáng. Nhập: `comfy-key` → `gemini-import --kind object --size <bbox làm tròn 16>` → `iso-build prop --foot-x <nửa bề ngang ảnh nhập>` (vật lệch như trại, nhà sàn kèm giàn không đặt `--foot-x` thì khung bị nới gấp đôi) → `normal.mjs`.
  - **Công trình (nhà, cổng, tháp):** img2img từ ảnh dẫn: `node tools/assets/comfy-guide.mjs <dẫn.png> --w 3 --d 2.2 --h 1.25 --roof 1.6` (khối thô đúng phép chiếu 2:1: tường trái sáng, phải tối, mái bốn mái, cửa; `--roof 0` cho hộp mái bằng), rồi `init_image=<dẫn.png>`, `denoise=0.75`; prompt tả vật liệu, mái, cửa như thường. Model giữ góc isometric và hình khối, vẽ lại chi tiết; denoise cao hơn sáng tạo hơn nhưng dễ lệch góc.
  - **Vật nhỏ đối xứng** (đèn, cột, bia): nhìn thẳng hơi từ trên chấp nhận được (như vật Gemini đang có); prompt `isometric view … seen from above, single object, whole object in frame`. Cần góc chéo rõ thì cũng dùng ảnh dẫn (`--roof 0` cho bệ, rương).
  - **Ô nền:** SDXL không vẽ được thoi 2:1 đúng (ra texture phủ kín khung): xin **texture vuông nhìn thẳng từ trên, liền mép** (`seamless tileable texture, top-down view straight from above, …, low contrast, uniform lighting, no perspective, full frame texture with no background`; negative `objects, border, white background, perspective, high contrast, saturated`) rồi `comfy-key --diamond 128` chiếu thành thoi.
  - **Biểu tượng:** `game item icon, front view, centered, compact square composition filling the icon, simple readable silhouette`; vật dài (bùa dải giấy) để chéo hoặc gấp cho vừa ô vuông, không thì vào khung 32 chỉ còn một vạch.
  - **Hồn thú (chỉ tham chiếu tĩnh):** `three-quarter view from above, full body`; model quay trái / phải tùy seed: lật ngang cho hướng `se`.
  - **Chân dung hồn thú `thu_<loài>` (#339, chủ repo duyệt):** bán thân cho mặt to ở 64 px: `close-up bust portrait, head and front shoulders only, head turned three-quarters to the right, the head fills most of the frame`; negative thêm `full body, legs, feet, tail, tiny head, far away, grey background, gradient background, vignette`. Model vẫn hay quay sang trái: lật ngang cho nhìn sang phải (về phía chữ). 3 seed `mode="lcm"` mỗi loài (đôi khi ra nền xám: `comfy-key` cảnh báo, bỏ ảnh đó). Xử lý từ ảnh **1024**: `comfy-key <1024.png> <tach.png> --shadow --fit 60` → `gemini-import --kind beast --size 64 --anchor 32,62 --scale 1 --cell 1 --logo off --grid 1x1 --palette auto-item --colors 24` (viền `#1a1020`, chân sát đáy) → `iso/thu/<loài>.png` → `validate --register thu_<loài> --iso`. Thu tiếp bản 128 về 64 thì mất nét mặt.
- **Màu (phong cách A + B, mục 1):** `muted desaturated earthy colors` + màu chủ đạo vùng (`deep mossy green`, `sunset crimson and burnt orange`, `icy blue and white`…), `soft sunlight from top left`; chỉ phần phát sáng thật mới sáng. **Thủy mặc** (`chinese ink wash, ivory paper, red cinnabar seal`) chỉ cho mảnh giao diện, không cho vật trong thế giới.
- **Nét:** `crisp pixel clusters, dark outline` (viền về `#1a1020` ở bước nhập); ô nền không viền.
- **Nền:** `no ground, no base, isolated on plain white background`; negative thêm `ground, grass base, terrain, floor, shadow, drop shadow, multiple objects, people`. SDXL vẫn hay vẽ nền xám nhạt (có khi xám hẳn) kèm bóng đổ: `comfy-key --shadow` gỡ.
- Không vẽ mắt phát sáng, hào quang, vòng hồn hoàn, bóng (client vẽ). Không tên họa sĩ, tên game thương mại.

**Các bước** (ảnh làm việc ở thư mục artifact, ngoài repo)
1. Tạo 2–4 seed mỗi vật (`raw_path` giữ ảnh 1024), xem cả bản 128 phóng ×4 lẫn ảnh gốc; chọn bản đúng góc nhìn, ít vụn.
2. Tách nền: `node tools/assets/comfy-key.mjs <128.png> <tach.png> --shadow --holes 20` (loang từ mép ảnh qua nền và bóng xám ≥ `--shadow-min` 0,55 × độ sáng nền; viền tối của vật chặn đường loang nên phần trắng / xám trong vật còn nguyên; `--holes 20` xóa khe nền kín giữa cột, giữa chân thú; in hộp bao vật). Ô nền: `--diamond 128` thay cho tách nền. Không dùng thẳng `gemini-import` cho nền trắng: nó xóa nền theo màu trên cả ảnh nên mất phần sáng của vật.
3. Nhập về khung như ảnh Gemini (mục 4), thêm `--cell 1 --logo off --grid 1x1` (một vật một ảnh, mảnh rời không làm lệch số tên): vật đứng `--kind object --size WxH` (một vùng một `--scale`), biểu tượng `--kind item`, hồn thú `--kind beast --size <cỡ bậc>`, ô nền `--kind tile`. Ảnh 1024 (`--cell auto`, dò được ô 8) giữ nhiều màu hơn nhưng hay còn vệt bóng; mặc định dùng bản 128.
4. Soát bằng `preview.mjs` / `iso-preview.mjs` cạnh asset cùng vùng (cùng tỉ lệ), rồi gửi chủ repo duyệt.
5. Đưa vào game như Gemini: `iso-build.mjs ground|prop`, chép biểu tượng vào `shared/assets/sprites/iso/item/`; `validate.mjs --register <key> --iso --tool "ComfyUI (SDXL base 1.0 + pixel-art-xl) + comfy-key.mjs + gemini-import.mjs" --prompt "<prompt>; negative <…>; seed <N>" --note "<lệnh nhập>"` ghi vào mục "Asset tạo bằng AI (ComfyUI)" của `art/CREDITS.md`. Ô nền (iso-build không ghi công) thì thêm tay một dòng vào bảng mục đó.

```bash
node tools/assets/comfy-guide.mjs <art>/dan_nha.png --w 3 --d 2.2   # rồi generate_pixel_art(..., init_image=<art>/dan_nha.png, denoise=0.75)
node tools/assets/comfy-key.mjs <art>/den_long_101.png <tmp>/den_long.png --shadow --holes 20
node tools/assets/comfy-key.mjs <art>/o_co_101.png <tmp>/o_co.png --diamond 128
node tools/assets/gemini-import.mjs --kind tile --cell 1 --logo off --grid 1x1 --names co_rung_moi --out <tmp>/tile <tmp>/o_co.png
node tools/assets/gemini-import.mjs --kind object --size 48x96 --cell 1 --logo off --grid 1x1 --names den_long_da --out <tmp>/obj <tmp>/den_long.png
node tools/assets/gemini-import.mjs --kind item --cell 1 --logo off --grid 1x1 --names hoi_thanh_phu --out <tmp>/item <tmp>/phu.png
```

