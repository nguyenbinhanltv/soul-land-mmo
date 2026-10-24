# Quy cách chi tiết asset isometric

Tài liệu tra cứu cho người làm ảnh và người sửa `tools/assets` / `client/src/sprites.ts`. Quy tắc mỹ thuật (phép chiếu, cỡ khung, phong cách, màu, nguồn được phép) là `GAME_DESIGN.md` mục 5.11; thao tác (ComfyUI, Gemini, LPC, lệnh dây chuyền; PixelLab đã bỏ từ 2026-10-23, ảnh cũ vẫn đi qua dây chuyền) là skill `.claude/skills/asset-gen/SKILL.md`. Hằng số khung ở `tools/assets/lib.mjs` (`ISO_*`, `isoLayout`) và `client/src/sprites.ts`; hai nơi phải khớp nhau.

## Hồn sư

**Lớp, thứ tự vẽ từ sau ra trước**

| Thứ tự | Lớp | Nguồn | Ghi chú |
|---|---|---|---|
| 1 | Bóng | Code | Elip 2:1 dưới chân, `#1a1020` khoảng 35% (hồn sư 24×12) |
| 2 | Vòng hồn hoàn, nửa sau | Code (`sring…`) | Cung trên của elip |
| 3 | Phụ thể võ hồn, nửa sau | `vh_{id}_b` | Cánh, đuôi, chân nhện, hư ảnh sau lưng, vũ khí khi bị thân che |
| 4 | Thân | `hs_body_{m/f}_{0–3}` | Da, mặt, quần hoặc váy lót, giày |
| 5 | Áo | `hs_outfit_{m/f}_{0–3}` | Dải 4 xám, hoán màu |
| 6 | Tóc | `hs_hair_{m/f}_{0–3}` | Dải 4 xám, hoán màu |
| 7 | Phụ thể võ hồn, nửa trước | `vh_{id}_f` | Vũ khí trên tay, tai thú, dây leo trước người, hào quang phía trước |
| 8 | Vòng hồn hoàn, nửa trước | Code (`sring…`) | Cung dưới của elip |
| 9 | Hiệu ứng | Code (`fx` từ server) | Vệt chém, sóng, chữ sát thương |

- **Key:** `hs_{lớp}_{giới}_{kiểu tóc}` (lớp `body` / `outfit` / `hair`, giới `m` / `f`, kiểu tóc 0–3), file `honsu/{lớp}_{giới}_{kiểu tóc}.png`; client lấy bằng `honsuKey(lớp, giới, kiểu tóc)`. Key đã hoán màu là key gốc + `@` + chỉ số màu (`hs_hair_f_2@3`, thân tông da khác `hs_body_f_2@2`), chỉ tạo khi có người dùng.
- **Màu khóa khi vẽ liền một bộ:** tóc lam sáng, áo / quần / váy xám, giày nâu, da bình thường; `normalize --split` tách 3 lớp trên từng khung, từng hướng.
- Key isometric ghi `"iso": true` trong manifest. Bộ chưa có ảnh `iso` dùng bộ 32×32 cũ (hướng gần nhất trong 4 hướng, phóng `SPR`) tới khi 10.4b xong; client nhận bố cục theo bề ngang sheet (24 cột) nên hai loại bộ dùng chung một đường code, lớp 64×64 trong hình chứa phóng `SPR` thì phóng 1 / `SPR`.

**Animation** (thời gian là hằng hiển thị ở `client/src/sprites.ts`)

| Animation | Số khung | Thời gian mỗi khung | Lặp | Ghi chú |
|---|---|---|---|---|
| `idle` | 4 | 200 ms | Có | Thở: đầu và vai nhích 1 pixel (`pack --breathe`) |
| `walk` | 6 | 100 ms | Có | |
| `attack` | 4 | 70 / 70 / 90 / 120 ms | Không | Lấy đà, vung, trúng, thu về; vũ khí do lớp phụ thể vung theo |
| `cast` | 3 | 100 / 200 / 140 ms | Không | Giơ tay, giữ, thả |
| `hurt` | 2 | 80 / 120 ms | Không | Ngửa người; client nháy trắng thêm 2 lần |
| `die` | 4 | 120 / 120 / 120 / giữ | Không | Khuỵu, ngã, nằm. Ẩn phụ thể |
| `absorb` | 2 | 500 ms | Có | Ngồi thiền, chỉ hướng `s`. Phụ thể mờ 60% |

- Nguồn trả số khung khác thì `pack.mjs` chọn đều khung. Chưa có ảnh thật thì `pack --code hurt,die,absorb` vẽ các ô đó từ khung đứng cùng hàng bằng một phép biến đổi chung cho 3 lớp: `hurt` vai rồi hông lệch 1–2 pixel về sau; `die` ngửa, khuỵu (thân trên hạ `ISO_KNEEL`), nằm (xoay 90°, đầu sang trái); `absorb` thân trên hạ `ISO_SIT`. Thiếu animation khác thì `--fill` chép tạm `idle` (validate cảnh báo).

**Bố cục sheet** (mọi lớp cùng bố cục cột): 24 cột × 6 hàng, khung 64×64 (sheet 1536×384).
- Hàng 0–4 là hướng `s`, `se`, `e`, `ne`, `n`. Trong mỗi hàng: cột 0–3 `idle`, 4–9 `walk`, 10–13 `attack`, 14–16 `cast`, 17–18 `hurt`, 19–22 `die`, cột 23 trống.
- Hàng 5: cột 0–1 `absorb` (hướng `s`); còn lại trống.
- Client tạo animation từ chỉ số khung cố định (`load.spritesheet` + `anims.generateFrameNumbers`, không dùng tag Aseprite). Key animation `{sheet}:{animation}_{hướng}` (`hs_body_f_0:walk_se`); `sw` / `w` / `nw` dùng hướng lật và `flipX`. Chỉ lớp thân có animation; khung thân đổi thì client đặt khung cùng (hàng, cột) cho áo, tóc, phụ thể.

## Phụ thể võ hồn
- Khung 96×96 (khung thân mở rộng 16 mỗi phía), gốc (48, 74). Sheet 24 × 12 (2304×1152): **mỗi giới một nửa** (`ISO_VH_SEXES`), ghép theo thân mẫu `m_0` (hàng 0–4) và `f_0` (hàng 6–10), hàng 5 và 11 trống; client chọn nửa theo giới của lớp thân (`vohonHalf`), các kiểu tóc cùng giới dùng chung nửa sheet.
- **Điểm neo:** phụ thể vẽ tĩnh 5 hướng (`vohon-part.mjs` đặt ảnh vào khung đứng theo file mô tả: điểm cầm, nửa sau / trước, viền sáng), rồi `pack.mjs --kind vohon` tìm điểm neo trên từng khung thân (`frameAnchors`: tay cầm là đầu mút mảng da cùng phía với tay trong `grip.json`, giữa lưng, đỉnh đầu; phụ thể dưới chân đứng yên theo gốc) và ghép vào sheet `vh_{id}_b` / `vh_{id}_f`. Vũ khí xoay theo góc vung của `attack` (`ISO_ATTACK_SWING`; vũ khí dài góc nhỏ hơn). Người vẽ tự quyết pixel nào nửa sau, nửa trước theo hướng (quay lưng `n`, `ne` thì cánh ở nửa trước, vũ khí ở nửa sau).
- **Phụ thể vẽ tĩnh 5 hướng đã đặt quanh thân khung đứng** (ảnh Gemini ở `art/src/gemini/phuthe_5huong/<id>/{s,se,e,ne,n}.png`): `node tools/assets/vohon-static5.mjs spec <id>` ghi file mô tả `art/src/gemini/vh_iso/<id>.json` (neo `back`, pivot mỗi giới = điểm neo thân `m_0` / `f_0` ở khung đứng nên ảnh giữ nguyên vị trí ở `idle` khung 0; nửa sau / trước theo hướng ở bảng `LAYERS` trong script: cánh, hoa, chân nhện, hư ảnh ở nửa sau khi quay mặt `s`, `se`, `e` và nửa trước khi quay lưng `ne`, `n`; tai, rắn, vuốt luôn nửa trước), `build <id…>` chạy `vohon-part` → `normalize --kind vohon --foot 74` → `pack --kind vohon --attach back` → `normal` cho cả hai giới. Phần gắn tay (vuốt, tay vảy) theo giữa lưng chứ không theo từng bàn tay; muốn bám tay thì viết mô tả riêng `attach: hand`.
- Phụ thể chỉ vẽ `idle`, `walk`, `attack`, `cast` (cột 0–16). Ánh xạ khung (`vohonFrame`, cùng cho hai nửa):

| Lớp thân đang ở | Khung phụ thể |
|---|---|
| `idle`, `walk`, `attack`, `cast` (cột 0–16) | Cùng hàng, cùng cột |
| `hurt` (cột 17–18) | Cùng hàng, cột 0 |
| `die` (cột 19–22) | Không vẽ |
| `absorb` (hàng 5, cột 0–1) | Hàng 0, cột 0–1, mờ 60% |

**Dạng phụ thể của 24 võ hồn** (màu chủ đạo `col` / `robe` trong `VOHON`; thêm võ hồn thì thêm dòng)

| Võ hồn (`id`) | Dạng phụ thể khi phóng thích | Vị trí | Hiệu ứng đặc trưng |
|---|---|---|---|
| Cửu Tinh Thất Sát Kiếm (`cuu_tinh_that_sat_kiem`) | Trường kiếm bạc, thân kiếm có hàng sao sáng | Tay phải | Kiếm khí mảnh; khi tung hồn kỹ có 3–4 thanh kiếm nhỏ bay quanh người |
| Lam Điện Bá Vương Long (`lam_dien_ba_vuong_long`) | Vảy rồng xanh phủ hai cẳng tay, vuốt rồng; hư ảnh đầu rồng sau lưng | Tay + lưng | Tia điện chạy dọc tay, chớp lóe 1 khung khi đánh trúng |
| Kỳ Nhung Thông Thiên Cúc (`ky_nhung_thong_thien_cuc`) | Đóa cúc vàng lớn nở sau lưng, cánh hoa xoay quanh người | Lưng + bao quanh | Cánh hoa bay theo vòng, rơi lả tả khi di chuyển |
| Tà Hỏa Phượng Hoàng (`ta_hoa_phuong_hoang`) | Đôi cánh lửa phượng hoàng | Lưng | Cánh vỗ theo nhịp đi; tàn lửa bay lên |
| U Minh Linh Miêu (`u_minh_linh_mieu`) | Hư ảnh báo U Minh tím phục sau lưng; tai mèo, đuôi, móng vuốt trên tay để sau | Lưng (sau: đầu + tay) | Vệt cào tím; bóng mờ đuổi theo khi lướt |
| Nguyệt Nhận (`nguyet_nhan`) | Đôi lưỡi trăng khuyết bạc cầm hai tay | Hai tay | Vệt chém hình trăng khuyết, ánh trăng lạnh |
| Hỏa Long (`hoa_long`) | Hư ảnh rồng lửa nhỏ quấn quanh thân, đầu rồng trên vai | Bao quanh | Hơi nóng gợn quanh người, tia lửa bắn ra khi đánh |
| Nhu Cốt Thố (`nhu_cot_tho`) | Tai thỏ dài, đuôi bông; hai chân phát sáng | Đầu + lưng + dưới chân | Vệt sáng hồng hình cung khi lướt và đá |
| Kim Vũ Miêu Ưng (`kim_vu_mieu_ung`) | Đôi cánh lông vàng kim, vuốt ưng ở tay | Lưng + tay | Lông vũ rơi; tia điện vàng lóe trên mép cánh |
| Tử Vong Chu Hoàng (`tu_vong_chu_hoang`) | 4 chân nhện tím đen mọc sau lưng | Lưng | Sợi tơ tím; hơi độc mờ bay quanh chân |
| Bích Lân Xà Hoàng (`bich_lan_xa_hoang`) | Rắn lục biếc quấn cánh tay, đầu rắn ngóc trên vai | Tay + vai | Vảy lân quang lấp lánh, sương độc xanh dưới chân |
| Càn Khôn Hỗn Nguyên Tỏa (`can_khon_hon_nguyen_toa`) | Vòng xích vàng có ổ khóa lơ lửng quanh người | Bao quanh | Xích xoay chậm; phù văn sáng khi tung hồn kỹ |
| Hỏa Ảnh (`hoa_anh`) | Bóng lửa đỏ hình người đứng sau, hai tay bọc lửa | Lưng + tay | Bóng lửa đi trễ nhịp so với thân |
| Yêu Hồ (`yeu_ho`) | Tai cáo, 3 đuôi cáo xòe sau lưng | Đầu + lưng | Ảo ảnh hồng nhấp nháy, đốm sáng hình giọt nước |
| Xúc Xích (`xuc_xich`) | Xúc xích nướng to trên tay, 2–3 xúc xích nhỏ bay quanh | Tay + bao quanh | Hơi nóng bốc lên, xúc xích nhỏ nảy lên xuống |
| Quỷ Mị (`quy_mi`) | Hư ảnh quỷ mờ sau lưng, khói tím đen bao người | Lưng + bao quanh | Bóng nhân đôi lệch 1–2 pixel; nhấp nháy khi tàng hình |
| Thiên Càn Bạch Ngọc Đỉnh (`thien_can_bach_ngoc_dinh`) | Đỉnh ba chân bằng bạch ngọc lơ lửng trên lòng bàn tay | Tay (lơ lửng) | Khói ngọc trắng bốc từ miệng đỉnh; quầng sáng khi hồi máu |
| Lam Ngân Thảo (`lam_ngan_thao`) | Bụi Lam Ngân Thảo mọc quanh chân; dây cỏ quấn hai tay để sau | Dưới chân (sau: tay) | Dây leo bò trên đất, đốm sáng xanh li ti |
| Hạo Thiên Chùy (`hao_thien_chuy`) | Búa đen khổng lồ (đầu búa to gần bằng người) | Tay | Vân đen chạy trên búa; bụi và vết nứt đất khi nện |
| Cửu Bảo Lưu Ly Tháp (`cuu_bao_luu_ly_thap`) | Tháp lưu ly 9 tầng nhỏ lơ lửng trên tay | Tay (lơ lửng) | Hào quang 7 màu xoay quanh tháp, chiếu tia sáng lên đồng đội |
| Phá Hồn Thương (`pha_hon_thuong`) | Trường thương cán dài, mũi hình thoi, tua đỏ dưới mũi | Tay phải | Hồn quang lấp lánh ở mũi thương; vệt đâm thẳng khi đánh |
| A Ngân (`a_ngan`) | Dây Lam Ngân vân vàng quấn hai tay, vương miện cỏ, đóa Lam Ngân Hoàng nở sau lưng | Tay + đầu + lưng | Đốm sáng xanh và vàng li ti |
| Liệt Hỏa Thương Lang (`liet_hoa_thuong_lang`) | Tai sói xám, đuôi sói to chóp lửa, vuốt lửa hai tay | Đầu + lưng + tay | Tàn lửa bay từ chóp đuôi; vệt cào lửa khi đánh |
| Băng Phượng Hoàng (`bang_phuong_hoang`) | Đôi cánh băng phượng hoàng, mào băng trên đầu | Lưng + đầu | Tinh thể băng hình chữ thập lấp lánh quanh người |
| Bạch Hổ (`bach_ho`) | Tai hổ trắng, đuôi hổ vằn đen, vuốt hai tay (ảnh Gemini 5 hướng, ghép ở #425) | Đầu + lưng + tay | Vằn sáng và vệt cào trắng khi đánh |

## Pháp tướng Võ Hồn Chân Thân
- Sheet `phaptuong/<mã võ hồn>.png`, key `pt_<mã>` (`"iso": true` kèm `pt` trong manifest), khung 160×160, gốc (80, 124) trùng chân hồn sư (32, 58); 5 hàng hướng `s`, `se`, `e`, `ne`, `n` (sw / w / nw lật), 16 cột: `idle` 8 (cột 0–7), `attack` 8 (cột 8–15); 2560×800. Chỉ alpha 0 / 255, ≤ `PT_MAX_COLORS` (48) màu, khung không chạm mép trên / trái / phải. Hằng `PT_*` và `isoLayout("phaptuong")` ở `lib.mjs`.
- Nguồn ảnh và `recipe.json` (prompt, seed, lượt, cách ghép) ở `art/src/pixellab/phap_tuong/<mã>/`; công cụ `pixellab-pt.mjs` (concept, xoay, hoạt ảnh bằng PixelLab) và `phaptuong.mjs` (hậu kỳ + sheet, thở / đánh bằng code cho vật cứng). Công thức chuẩn, lượt thực tế, bẫy: `docs/phap-tuong-cong-thuc.md`; đặc tả 25 võ hồn: `docs/phap-tuong.md`.
- Client chưa tải sheet này (H2); độ đục hư ảnh, lớp sau / trước theo hướng, tỉ lệ và độ dời đọc từ `pt` của manifest.

## Hồn thú
- Khung theo bậc: Trắng, Vàng 64×64 (thú nhỏ, cao 20–40); Tím, Đen 96×96 (dài khoảng 2–3 thoi); Đỏ 128×128; tà hóa thú vương 160×160; boss thế giới 192×192. Gốc giữa đáy, cách mép dưới khoảng 8 (`ISO_BEAST_FOOT`). Tinh anh không có khung riêng: client phóng sprite loài gốc theo `ELITE.scale` (`rankScale` trong `GameScene.ts`); thú vương / boss chưa có sprite riêng thì phóng theo `KING.scale` / `WORLD.scale`.
- Animation: `idle` 4, `walk` 6, `attack` 4 (khung đầu là tư thế báo trước, client giữ khung này khi `BeastState.cast` bật rồi chạy 3 khung ra đòn), `hurt` 2, `die` 4. Sheet 20 cột × 5 hàng (hàng là `s`, `se`, `e`, `ne`, `n`; cột 0–3 `idle`, 4–9 `walk`, 10–13 `attack`, 14–15 `hurt`, 16–19 `die`); sheet lớn nhất 3840×960, dưới giới hạn texture 4096 của điện thoại.
- Mắt phát sáng (dự kiến): client vẽ chấm mắt màu `TIERS[bậc].glow` theo điểm mắt khai báo cho từng loài và hướng trong manifest; hiện mới có nguồn sáng ở đầu hồn thú (`lightSources`). Key `beast_{loài}`; loài chưa có ảnh vẽ theo bậc `b{tier}_…` bằng code.
- Client (`client/src/sprites.ts`): key `beast_{loài}` có `"iso": true` và `"frame": [cỡ, cỡ]` tải như sheet 20 × 5 (`isIsoBeast` nhận theo tỉ lệ 4:1), animation `beast_{loài}:{animation}_{hướng}`; hướng 8 phía theo hướng trượt, khi tung chiêu theo vùng báo trước, đứng yên thì giữ (`bface` trong `GameScene.ts`); sw / w / nw lật se / e / ne. Sheet isometric không phóng `SPR`, chỉ `rankScale`; thanh máu, bóng, lỗ khoét theo thân đo trong khung idle đầu (`beastBody`). Sheet một hàng 32×32 cũ vẫn chạy như trước.
- **Hình tạm từ thú LPC** (`tools/assets/lpc-beast.mjs`, skill `asset-gen` mục 5): manifest ghi thêm `"lpc": true` và `"map"`; client không dùng cho thú vương / boss (`beastSheetSpecies`), tinh anh vẫn phóng sprite loài gốc. Ghi công ở mục `<!-- lpc-beast:start -->` của `art/CREDITS.md` (giấy phép như NPC phụ LPC dưới đây).

## Vòng hồn hoàn
- Dưới chân vẽ bằng code (`client/src/textures.ts`), ở pixel nội bộ (lớp hồn sư phóng 1 / `SPR` trong khung chứa): `sring{tier}_{0–9}` là vòng nằm đất theo thứ tự (elip 2:1 bán trục ngang `RING_RX0` + `RING_STEP` × thứ tự; vòng 1 rộng 30, vòng 10 rộng 84; nét 1 pixel `col` cộng 1 pixel `glow` mờ phía trong), `sring{tier}_up` là vòng nổi dẹt 34×10 (thân 2 pixel `col` viền `glow`) khi tung hồn kỹ / Chân Thân; thêm `L` là bản sáng (col → glow, glow → trắng). Khung 0 cung trên (vẽ sau thân), khung 1 cung dưới (vẽ trước thân).
- Tung hồn kỹ vòng i: vòng đó bay lên ngang ngực rồi hạ về trong `RING_LIT_MS` (`GameScene.ts`). Chân Thân: mọi vòng nổi xếp đều từ chân tới đỉnh đầu, nhấp nhô lệch pha.
- Rơi trên đất: `ring{tier}` 32×20 (elip 2:1 nằm nghiêng phát sáng), file `ring/ring{tier}.png`; cũng là nguồn sáng nhỏ màu `glow`. (`halo{tier}` là key ảnh cũ của bản vòng chồng dọc, `sprites.ts` vẫn nhận nhưng không còn vẽ.)

## Ánh sáng và thời tiết (cách làm)
- **`client/src/lighting.ts`:** pipeline Light2D riêng, khoảng cách tới đèn tính theo pixel nội bộ; trên nền và vật đứng ánh sáng tắt dần theo elip 2:1, trên thực thể theo hình tròn và màu môi trường kéo về trắng khoảng 40% (`ENTITY_LIFT`). Tổng ánh sáng có trần; ban ngày đèn giảm một nửa; tuyết, cát, sân đấu giảm theo `dim` của vùng (`REGIONS`: màu ngày / đêm, `always`, `dim`, ánh cửa nhà `house`, mặt nước phát sáng `water`). Vật phát sáng theo tên vật trong `tiles.json` ở `GLOW_PROPS`. Hồn kỹ (vòng lan, vùng chiêu, tung hồn kỹ của vòng) soi mặt đất màu chiêu rồi tắt dần.
- Số đèn: Phaser `maxLights` khoảng 10, máy cảm ứng 6 (`?den=N` để thử); chọn hồn lực trước rồi gần tâm camera.
- **Atlas:** ô nền, lớp phủ mép, vật đứng, nhà của một bản đồ gom vào một atlas (cùng atlas normal map, `client/src/isoAtlas.ts`) vì pipeline ánh sáng chỉ gom các ảnh cùng texture vào một lần vẽ (đo ở Tinh Đấu Nội địa: khoảng 1.100 lần vẽ mỗi khung nếu không gom, 80 khi gom, 29 khi tắt ánh sáng).
- **Tắt sạch:** chỉ có Canvas, WebGL phần mềm (SwiftShader, llvmpipe…) hoặc `?light=0` thì không bật; khung hình dưới `AUTO_OFF_FPS` suốt `AUTO_OFF_MS` thì tự tắt và báo (`?light=1` luôn bật). `?gio=HH:MM` đứng yên đồng hồ ngày / đêm (chụp ảnh, thử).
- Normal map: client tải `_n.png` của mọi ô nền và vật đứng khi bật ánh sáng; thiếu thì 404 và vật coi như phẳng.
- **`client/src/weather.ts`:** khói bếp bay từ mái nhà và lửa trại, bọt sóng / đom đóm biển chỉ sinh trên ô nước, tuyết Cực Bắc dày dần về phía bắc, sương / mưa / sét theo vùng (Đầm sương độc, Lôi Cốc, Ma Quỷ Hải Vực, Cực Bắc Băng Uyên), sương sớm Ngoại vi theo giờ, cực quang ban đêm ở mép trên màn hình, giấy hoa khi có người thắng ở Đại Đấu Hồn Trường. Lệnh `/hat` bật / tắt (lưu trên máy).

## Bảng các vùng đầy đủ (ánh sáng, thời tiết, hạt bay)
Quy tắc chung ở `GAME_DESIGN.md` mục 5.11 (phong cách B, "Ánh sáng và chiều sâu", "Độ tương phản"). Màu nhấn đầy đủ ở `art/palettes/<mapId>.gpl`. Ngày / đêm chỉ ở client, theo giờ Việt Nam (06:00–18:00 là ngày); vùng ghi "luôn" thì không đổi theo giờ.

| Bản đồ (`MAPS`) | Màu chủ đạo | Ngày / đêm | Thời tiết | Hạt bay | Địa hình, vật đặc trưng |
|---|---|---|---|---|---|
| Thánh Hồn Thôn (`thanh_hon_thon`) | Nắng mật, lục non | Ngày nắng ấm vàng; đêm cam ánh bếp | Quang | Khói bếp, bồ công anh | Ruộng lúa, mái rạ, hàng rào tre, Lam Ngân Thảo ven đường |
| Nặc Đinh Thành (`nac_dinh_thanh`) | Gạch nung đỏ đất, ngói xám | Ngày trung tính; đêm đèn lồng đỏ | Quang | Khói, lá rơi thưa | Tường thành, chợ, đèn lồng, học viện sơ cấp (lưu ly ở cổng) |
| Tinh Đấu Ngoại vi (`tinh_dau_ngoai_vi`) | Lục rêu sâu | Ngày nắng lốm đốm xuyên tán; đêm lam thẫm | Sương mỏng buổi sớm | Đom đóm thưa, lá rơi | Cổ thụ, suối rừng, nấm phát quang thưa |
| Tinh Đấu Nội địa (`tinh_dau_noi_dia`) | Xanh thẳm lam lục | Ngày tối như chiều; đêm lam đen | Sương độc tím ở Đầm sương độc, sấm chớp ở Lôi Cốc | Đom đóm, bào tử phát quang | Nấm phát quang lớn, dây leo, đầm độc |
| Thiên Đấu Thành (`thien_dau_thanh`) | Trắng ngà, lam ngọc, vàng kim | Ngày sáng; đêm đèn vàng | Quang | Cánh hoa, cờ bay | Cung điện, Thiên Đấu Hoàng Gia Học Viện (lưu ly), chợ, bến thuyền |
| Lạc Nhật Sâm Lâm (`lac_nhat_sam_lam`) | Hoàng hôn đỏ cam, bóng tím than | Luôn hoàng hôn; "đêm" đỏ sẫm | Gió nhẹ, nắng chiều chéo | Lá rụng đỏ / cam / vàng, cánh hoa độc | Cây lá đỏ, hoa độc, đầm Bích Lân lục độc, suối Băng Hỏa nửa lam nửa đỏ |
| Cực Bắc Chi Địa (`cuc_bac_chi_dia`) | Băng lam, trắng lạnh | Ngày trắng lạnh chói; đêm lam đen có cực quang lục tím | Tuyết rơi, bão tuyết dày dần về phía bắc | Bông tuyết | Thông tuyết, băng tinh phát sáng, khe băng, hồ băng |
| Hải Thần Đảo (`hai_than_dao`) | Ngọc lam, vàng | Ngày nắng biển rực; đêm lam ngọc, sóng phát quang | Gió biển; mưa ở Ma Quỷ Hải Vực | Bọt sóng, đom đóm biển | San hô, đá ngầm, cát vàng, đền Hải Thần (lưu ly) |
| Lõi Tinh Đấu (`loi_tinh_dau`) | Tím than, lam hồ thần | Luôn đêm, hồ phát sáng | Sương mù | Hạt hồn lực trôi lên | Hồ trung tâm, đá cổ, rễ khổng lồ |
| Đại Đấu Hồn Trường (`dai_dau_hon_truong`) | Đá xám, vàng kim, đỏ son | Luôn sáng đuốc | Quang | Bụi cát; giấy hoa khi có người thắng | Sàn đấu, khán đài, cờ, khán đài vua (lưu ly) |

## Vùng chiêu
Client chiếu từng điểm của hình server gửi (`client/src/iso.ts`): vòng tròn bán kính r thành elip bán trục `√2·r` × `r/√2` (`fillGround` / `strokeGround`, `RX` / `RY`); vệt, nón, cung chém (`arcPts`) thành đa giác chiếu (`ptsToScreen`). Cùng các hàm cho vùng báo trước, vùng chiêu, sóng, vùng an toàn, cổng.

## Bản đồ isometric
- File Tiled `shared/assets/<mapId>.json` không đổi (orthogonal, ô 16). Client đọc lớp `ground`, `trees`, `canopy`: gid nền → ô thoi, gid vật cản cao → vật đứng ở tâm ô; `canopy` không vẽ riêng (tán là một phần sprite cây); `roof` / `wall` liền nhau gom thành một khối nhà.
- **`shared/assets/iso/tiles.json`** (định dạng ghi ở khóa `"_"` đầu file): `ground` (ảnh 32×32, ô lớn 64×64, tâm mặt trên, thứ bậc `edge` của lớp phủ mép), `props` (key `prop_{vật}`, điểm chân; vật lật ngang ngẫu nhiên theo băm vị trí, `"flip": false` cho vật có hướng như cầu, bậc, rào, tường, cổng, vì lật ảnh isometric là đổi trục x ↔ y), `maps` (bộ `"*"` mặc định và bộ riêng từng `mapId`: gid → `"tên"`, `"tên~#rrggbb"` nhân màu, `"tên~x1.3"` sáng lên, danh sách vật chọn theo băm vị trí; `build` kiểu nhà của vùng). `iso-build.mjs check` (trong `npm run check`) kiểm mọi gid của 10 bản đồ (kể cả bản dựng lại `<mapId>.v2.json` của `tools/maps`, dùng bộ của `mapId`).
- **Ảnh ô:** ô 32 là ảnh 32×32, mặt trên thoi 32×16 tâm (16, 19), đáy dày khoảng 5; ô lớn là ảnh 64×64, thoi 64×32 tâm khoảng (32, 37). Mỗi ô 2 biến thể (`_1` dời mặt trên nửa chu kỳ) cộng lật ngang theo băm vị trí; khối 2×2 thẳng hàng chẵn cùng loại ô vẽ một ô lớn. Mép hai địa hình: ô `edge` cao hơn lấn sang ô bên một dải răng cưa lấy từ chính ảnh của nó, kèm viền bóng 1 pixel. Chỉ tạo ảnh cho ô trong tầm camera.
- **Nhà dựng bằng code** (`client/src/isoBuild.ts`): khối `roof` cộng tối đa 2 hàng `wall` phía trước (+y) là một ngôi nhà (hộp tường, cửa giữa mặt +y, cửa sổ, mái bốn mái cao tối đa `roofMax`), màu theo `build`; ô `wall` đứng riêng là tường thành có lỗ châu mai; góc / đầu tường có thể là vật đứng (`build.tower`). **Cung uyển** (`build.compounds`, khóa theo góc trên trái khối nhà): nền sân, tường quanh chân nhà, cổng, công trình vẽ sẵn và trang trí thay nhà dựng code; không khớp khóa thì lùi về nhà dựng code. Cắt lát dọc 16 pixel, độ sâu mỗi lát theo `frontDepth`.
- **Vật đứng:** khung bội `ISO_PROP_STEP`, chân giữa đáy cách mép dưới `ISO_PROP_FOOT`, màu `art/palette.gpl` + bảng nhấn vùng, không đế đất; mọi vật một vùng chung hệ số thu.

## NPC phụ và dân thường (LPC)
- Key `lpc_<tên>`, file `iso/lpc/<tên>.png` (+ `_n.png`): một lớp đã tô màu, bố cục sheet hồn sư 24 × 6, khung 64×64, gốc (32, 58); client tạo animation như lớp thân (`createHonsuAnims`). 10 NPC: `lpc_<mã NPCS>`; dân thường `lpc_dan_*`; lính gác `lpc_linh_gac`. Công thức `art/src/lpc/<tên>.json`.
- **Biểu tượng vật phẩm và hiệu ứng từ gói LPC** (`tools/assets/lpc-item.mjs`, công thức `art/src/lpc-item.json`): cắt ô 32×32 của sheet vật phẩm (không phóng), căn giữa, viền `#1a1020`; `gray` ghi bản xám giãn sáng để client tô theo `col`; giảm còn 24 màu. `fx` chép dải khung một hàng (key `fx_<tên>`, client `playFx`). Ghi manifest và mục `<!-- lpc-item:start -->` của `art/CREDITS.md`.
- Giấy phép (`GAME_DESIGN.md` 5.11 "Asset bên ngoài"): `lpc-compose.mjs` / `lpc-beast.mjs` / `lpc-item.mjs` nhận mọi giấy phép đã biết (`LICENSE_KNOWN` trong `lib.mjs`), dừng khi không đọc được; nhiều giấy phép thì dùng theo nhóm ít ràng buộc nhất (`licenseUse`), SA / GPL / NC ghi kèm cờ trong `art/CREDITS.md` (sheet ghép có lớp SA / GPL thì cả sheet theo giấy phép đó).
- 4 hướng LPC → 5 hướng vẽ: `s` nhìn xuống, `n` nhìn lên, `se` / `e` / `ne` nhìn phải (như `legacyDir`); hàng "trái" của LPC bỏ; chân mỗi hướng dời về gốc riêng. `idle` bằng `pack --breathe`, `walk` 6 khung từ LPC.
- Dân thường (`client/src/crowd.ts`, bảng `CROWD`): chỗ đứng theo hạt giống `mapId`, cách NPC / cổng / nhau (`NPC_GAP`, `GATE_GAP`, `PEOPLE_GAP`), đi chậm (`WALK_SPEED`) trong bán kính `WANDER` theo đường thẳng không vướng `solidGrid`; lính gác hai bên cổng (trừ bến thuyền), lùi vào tới ô không chặn đầu tiên. `lpcPreloader` chỉ tải sheet của NPC trong file Tiled bản đồ đang vào và dân thường trong `CROWD`.

## Giao diện, chân dung, thẻ, biểu tượng
| Key | Cỡ | Ghi chú |
|---|---|---|
| `portrait_{id}` | 64×64 (`ISO_PORTRAIT`) | Chính võ hồn trên nền tối có quầng màu, cắt 1:1, không viền ngoài, ≤ `PORTRAIT_MAX_COLORS` màu |
| `npc_{mã NPCS}` | 112×112 (`ISO_NPC_PORTRAIT`) | Bán thân nhìn thẳng trên nền tối |
| `thu_{mã BEASTS}` | 64×64 (`ISO_BEAST_PORTRAIT`) | Chân dung hồn thú ở khung mục tiêu (#339): bán thân (đầu + vai, mặt to, nhìn sang phải về phía chữ), nền trong suốt, viền `#1a1020`, ≤ `PORTRAIT_MAX_COLORS` màu, không mắt phát sáng / hào quang; tinh anh, thú vương dùng chân dung loài gốc. Thư mục `iso/thu/` |
| `skill_{mã võ hồn \| chung}_{chỉ số 0..9}` | 32×32 (`ISO_SKILL_ICON`) | Biểu tượng hồn kỹ (#384) ở thanh kỹ năng, bảng đội hình, bảng nhân vật: hình chính từ ảnh ComfyUI trong khung TRÒN màu `col` của võ hồn (hồn kỹ chung: xám xanh trung tính), nền ngoài khung trong suốt; `tools/assets/skill-icon.mjs` tách nền, giảm màu và ghép khung (đồng nhất cả ~280 biểu tượng). Số cuối là chỉ số 0..9 (`ringSkill`, = vòng 1..10); không có chỉ số 6 vì vòng 7 là Võ Hồn Chân Thân, không phải hồn kỹ mang theo; mỗi võ hồn trong `VOHON` cần 9 biểu tượng (chỉ số 0–5, 7–9; thêm võ hồn mới thì làm thêm 9 biểu tượng); chưa có ảnh thì client giữ ký tự `icon`. Thư mục `iso/skill/` |
| `card_{sr,ssr,ur}` | 96×152 (`ISO_CARD`) | Khung lưu ly, cửa sổ chân dung trong suốt; tên tối đa 2 dòng font 10 px; tấm biển đáy ghi cấp trên nền tối |
| `he_{mã HE_IDS}` | 24×24 (`ISO_HE_ICON`) | Biểu tượng trắng trên tròn màu hệ, viền vàng kim: Cường công kiếm / đỏ, Mẫn công 3 vết cào / lục, Khống chế mắt xích / tím, Phụ trợ hoa sen / vàng |
| `status_{mã}` | 24×24 (`ISO_STATUS_ICON`) | Theo `STATUS_IDS` / `BUFF_IDS` / `BEAST_BUFF_IDS`; 16 px mất hình nên không dùng |
| `item_{mã}` | 32×32 (`ISO_ITEM_ICON`) | Id `ITEMS`, nhóm `ITEM_KINDS` (`item_hon_hach`, `item_manh_vo_hon`) hoặc `item_hon_cot_<vị trí BONE_SLOTS>`; hồn cốt bản xám (chân phải lật chân trái); `item_ruong`, `item_tien_thao` bản xám tô theo `col` (`lpc-item.mjs`) |
| `item_equip_{mẫu}`, `item_equip_slot_{ô}`, `item_equip_frame_{bậc}` | 32×32 | Trang bị hồn sư (GAME_DESIGN 5.15): 60 ảnh mẫu (`<ô>_<bậc>`, ví dụ `item_equip_mu_tu_kim`), 10 hình ô (bóng ô, cũng làm ô trống của búp bê), 6 khung viền theo bậc (màu `EQUIP_TIERS[].col`); danh sách đủ ở `equipIconKeys()` (shared/data.ts). Đá / bùa / tinh hoa / thần hồn theo `item_{mã}`; thiếu ảnh thì client tra mẫu → hình ô → `item_trang_bi` |
| `fx_{tên}` | dải một hàng khung vuông (manifest ghi `frame`) | Hiệu ứng từ gói LPC (`lpc-item.mjs`), giữ màu gốc ≤ `PORTRAIT_MAX_COLORS`; client chạy một lần bằng `playFx` |
| `ui_{tên}` | điểm ảnh thật | Mảnh thủy mặc; kéo giãn ghi `"nine": N` (giấy dùng `round`) |

Bề mặt giao diện thủy mặc và class CSS tương ứng: skill `client-ui`.

## Key, thư mục, cách tải
`shared/assets` là `publicDir` của Vite. Tên file theo mã võ hồn / mã loài, không theo chỉ số mảng.
```
art/                         file nguồn, không tải trong game
  palette.gpl, palettes/     bảng màu chung, bảng nhấn từng vùng và giao diện
  CREDITS.md                 nguồn gốc và giấy phép mọi asset
  src/pixellab/              ảnh nguồn PixelLab cũ (không làm thêm): iso/ vật đứng, vh_iso/ phụ thể kèm file mô tả, bộ 32×32 cũ
  src/gemini/                ảnh Gemini để dành / tham chiếu (phuthe_s/, beast_se/)
  src/lpc/{tên}.json         công thức ghép NPC phụ / dân thường từ LPC
shared/assets/sprites/
  manifest.json              danh sách key đã có ảnh thật (key isometric ghi "iso": true)
  honsu/{body,outfit,hair}_{m,f}_{0–3}.png   hs_{lớp}_{giới}_{kiểu tóc} (+ _n.png normal map)
  vohon/{id}_b.png, {id}_f.png               vh_{id}_b, vh_{id}_f
  beast/{loài}.png                           beast_{loài}
  ring/ring{tier}.png                        ring{tier} (vòng dưới chân vẽ bằng code: sring…)
  iso/portrait/{id}.png                      portrait_{id}
  iso/props/{vật}.png                        prop_{vật}
  iso/npc/{mã}.png                           npc_{mã}
  iso/lpc/{tên}.png                          lpc_{tên}
  iso/item/{mã}.png                          item_{mã}
  iso/fx/{tên}.png                           fx_{tên}
  iso/status/{mã}.png                        status_{mã}
  iso/he/{hệ}.png                            he_{hệ}
  iso/ui/{tên}.png                           ui_{tên}
  iso/ui/the_{sr,ssr,ur}.png                 card_{sr,ssr,ur}
shared/assets/iso/
  tiles.json                 ánh xạ gid Tiled → ô thoi / vật đứng, kiểu nhà
  ground/{loại}_{i}.png      ô nền 32×32; ô lớn {loại}_{i}_lon.png 64×64
```
- Client đọc `manifest.json` trong `preload()`, chỉ tải key có trong danh sách, `makeTextures()` vẽ bằng code key còn thiếu. Giao diện HTML đọc manifest qua `client/src/uiArt.ts` (key `"iso": true` dùng ảnh, chưa có thì kiểu CSS / SVG). Ô và vật đứng do `isoMap.ts` tải theo `tiles.json`; `lpc_*` chỉ tải của bản đồ đang vào.

## Hồn thú lai: sheet tĩnh 3 hướng (#386)
- Manifest `{ "key": "beast_<loài>", "frame": [64, 64], "iso": true, "static": true, "map": "<vùng>" }`; sheet `beast/<loài>.png` rộng 3 × khung, cao 1 khung: cột 0 nam (`s`), cột 1 đông (`e`), cột 2 bắc (`n`), gốc giữa đáy cách đáy `ISO_BEAST_FOOT`. `validate.mjs --static` (và `sheetSpec(key, frame, true, true)` trong `lib.mjs`) kiểm cỡ, đủ 3 khung, màu tự do như chân dung (mỗi hướng một bảng màu riêng, không giới hạn 32 màu, không so bảng chung); `normal.mjs --frame 64x64` sinh `_n.png`.
- Ghép sheet: `node tools/assets/static-sheet.mjs <nam.png> <dong.png> <bac.png> beast/<loài>.png` (ba khung cùng cỡ vuông ra từ `gemini-import --kind beast --size <khung>`); ảnh Gemini có vạch lưới tối giữa các ô thì thêm `gemini-import --unline` (gỡ vạch trước khi tách vật). Boss thế giới dùng khung 192 (`beast_thai_than_cu_vien`, `beast_thien_thanh_nguu_mang`, `map: loi_tinh_dau`).
- Client (`sprites.ts`): `isStaticBeast`, `STATIC_DIR_MAP` (hướng 8 → khung + lật), `staticBeastPose` / `STATIC_MOTION` (thở, nhún, ngả + vồ, lắc, nháy trắng; bóng ngã khi chết ở `GameScene.fadeBeastGhost`).
- Họ hoạt ảnh (`beastFamily`, bảng `FAMILY_SPECIES`): thêm loài mới vào đúng họ (chim, rắn, côn trùng, cây / hoa; còn lại là thú bốn chân). Ảnh đông trong sheet phải nhìn sang phải.
