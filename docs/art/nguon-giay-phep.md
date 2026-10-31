# Nguồn ảnh và giấy phép

Nguồn theo họ asset ở bảng dưới; thao tác từng công cụ ở skill `asset-gen` (mục 2) và `tools/assets/README.md`. Quy tắc chung ở mục 5.11.

**Nguồn và giấy phép**

## Nguồn ảnh được phép (hiện hành)

Thí điểm lửa trại và đài phun nước: lớp lửa/tia nước tạo bằng Codex builtin OpenAI `image_gen.imagegen` (31/10/2026), theo điều khoản đầu ra OpenAI, không gán CC0. Prompt thật, nguồn thân gốc và SHA256 RAW/ảnh gốc/clip tại `art/src/prop-clip/{lua_trai,dai_phun_nuoc}/NGUON.md` và `nguon.json`. Chỉ dùng hai ảnh game sẵn có làm đầu vào; không dùng AI hoạt ảnh khác. Lò rèn chưa làm; clip chờ chủ repo duyệt trong PR nháp.

| Asset | Nguồn | Ghi chú |
|---|---|---|
| Nền bản đồ thế giới M (`art/src/world-map/`) | Codex builtin OpenAI `image_gen.imagegen` (Q53), 31/10/2026; không dùng asset bên thứ ba làm đầu vào | Không CC0; prompt, RAW nguyên byte và SHA-256 ở `art/src/world-map/`; quy cách ở [ban-do-the-gioi.md](ban-do-the-gioi.md); chưa nhập client, chờ duyệt PR art |
| Họ asset C1–C16 (cảm giác đánh, khung / nền giao diện, trang phục LPC phương Đông, âm thanh tuyệt kỹ CC0, công cụ chất lượng, màn đăng nhập / tải, HUD, nhãn, thanh kỹ năng, hộp thoại, nhiệm vụ, biểu tượng UI, phản hồi UI, khả năng tiếp cận, màn chết / đấu trường…) | **Codex (tthoadev)**: vẽ bằng code + sinh ảnh model (ChatGPT / Codex, Q44) + hậu kỳ pixel | `art/CREDITS.md` ghi model + prompt |
| Hồn sư người chơi, NPC phụ, dân thường, lính gác | **LPC** (Universal LPC Spritesheet Character Generator), 4 hướng | Hồn sư có hai cách tạo: Mẫu dựng sẵn (`LPC_PRESETS`) và Tự tạo (`LPC_PARTS`); xem `hon-su-lpc.md` |
| Phụ thể võ hồn, hồn thú | Đã xong: ảnh tĩnh (phụ thể 5 hướng, hồn thú kiểu lai 3 hướng) + chuyển động bằng code | Ảnh cũ từ PixelLab / ComfyUI vẫn trong game, giữ ghi nguồn ở `art/CREDITS.md` |
| Hoạt ảnh / sheet hiệu ứng kỹ năng, pháp tướng, xoay hướng | **PixelLab** (gói Tier 1 mua lại 2026-10-24) | **Chỉ** các việc này: hoạt ảnh hồn sư, pháp tướng Võ Hồn Chân Thân (mục 5.18), sheet hiệu ứng hồn kỹ / tuyệt kỹ / dung hợp (`ky-nang/README.md`). Không tạo hình nhân vật hay ảnh tĩnh; **ảnh concept pháp tướng không thuộc ngoại lệ** (Q43). PixelLab đã bỏ 2026-10-23 rồi dùng lại có giới hạn từ 2026-10-24 |
| Ảnh tĩnh: ô nền, vật đứng, công trình, chân dung, khung thẻ, biểu tượng, mảnh giao diện, ảnh tham chiếu | **Ảnh sinh bằng model: ChatGPT và Codex** (Q44); **ComfyUI** tự host trên Mac chủ repo (SDXL base 1.0 + LoRA pixel-art-xl) là công cụ ảnh tĩnh của orchestrator khi cần; ảnh **Gemini** cũ đã duyệt giữ nguyên ghi nguồn | Mỗi ảnh đưa vào game phải được chủ repo duyệt. Hoạt ảnh 8 hướng bằng ComfyUI / ControlNet đã dừng (#335, #387) |
| Vật phẩm / hiệu ứng LPC, gói asset ngoài | OpenGameArt và các nguồn miễn phí (`tools/assets/lpc-item.mjs`, `import-pack.mjs`) | Chỉ asset miễn phí; chủ repo duyệt từng ảnh |
| Biểu tượng mảnh võ hồn từng võ hồn (`item_manh_<mã>`, #1305) | **Codex image_gen**, 30/10/2026: tờ gốc `art/src/ui-kit/toI-manh.png`, prompt thật `toI-manh.prompt.txt`; tham chiếu BOARD UI gốc Mực + Giấy của repo, không dùng ảnh bên thứ ba mới. Ghép bằng `tools/assets/manh-compose.mjs` với `icon_<mã>_24` có sẵn (nguồn icon giữ nguyên) | Ảnh AI tạo cho dự án, theo điều khoản OpenAI; không gán CC0. Chọn lượt 3/3, cắt mềm theo luật UI (viền hồng 56,2% → 0%, còn ghi chú nhẹ khoảng cách). `manh-sheet.mjs cut` hạ về ba mẫu 32×32 ở `art/src/ui-kit/khung-manh/`, giữ hình và mảng giấy, đổi sắc đồng theo `col`, ghép 25 icon; thiếu ảnh vẫn rơi về `item_manh_vo_hon` |
| Huy hiệu hệ, chỉnh pixel | Vẽ tay (Aseprite hoặc từng điểm bằng code) | |
| Gói giới hạn giấy phép (Gigapack, Forest, Free Pixel Effects, Battle Effects…) | **Kho asset riêng** (#627, `docs/asset-rieng.md`) | Ảnh đã xử lý chỉ ở repo private; repo game giữ mô tả, manifest, CREDITS. Không có kho thì game dùng hình cũ |
| Âm thanh | **Chỉ CC0 / miễn phí bản quyền**, không AI, không tiếng hô | `tools/audio`, ghi đủ ở `art/CREDITS.md` (`am-thanh.md`); tiếng giao diện đợt 1c (#599: `ui-click`, `ui-error`, `ui-reward`, `ui-notify`) lấy từ Kenney Interface Sounds (CC0, đã có trong catalog); nhạc nền do dự án sáng tác bằng code |

- **Thú LPC** (hình tạm cũ cho hồn thú thường) đã thay hết; công cụ `lpc-beast.mjs` ngừng.
- Công cụ AI chỉ dùng khi điều khoản cho phép dùng kết quả (Gemini: điều khoản Gemini Apps của Google; ComfyUI: CreativeML Open RAIL++-M của SDXL, CreativeML OpenRAIL-M của pixel-art-xl, MIT của VAE). Mỗi key một dòng trong `art/CREDITS.md` (file, key, công cụ, prompt, ngày). Không ghi tên họa sĩ còn sống hay tên game thương mại vào prompt.
- **Không dùng** sprite, ảnh cắt hoặc hình vẽ lại sát nét từ game thương mại (kể cả *Thế Giới Săn Hồn* và các game isometric dùng làm chuẩn phong cách), phim hoạt hình hay truyện tranh chính thức; chỉ tham khảo ý tưởng, không làm ảnh tham chiếu.

## Asset bên ngoài (font, tileset, âm thanh, lớp / gói LPC)
- Chỉ dùng asset **miễn phí** (không đề xuất hay mua gói trả phí). Được dùng **mọi loại giấy phép** miễn phí (CC0, CC-BY, CC-BY-SA, OGA-BY, CC-BY-NC, GPL, OFL…) vì đây là fan game phi thương mại cho bạn bè. **Không** dùng asset không có giấy phép rõ ràng hoặc ghi "all rights reserved"; ND (cấm sửa) chỉ dùng được nguyên bản.
- Asset từ gói ngoài phải **đặt lại tên theo quy ước game** (`fx_*`, `gi_*`, `vat_*`…); tên gốc chỉ nằm ở `art/CREDITS.md` và `licenses`.
- Nghĩa vụ:
  - **Mọi** asset ngoài có một dòng trong `art/CREDITS.md`: tác giả, nguồn (URL), giấy phép, file trong repo, có sửa gì không.
  - **CC-BY / CC-BY-SA / OGA-BY**: hiện tên tác giả ở màn **Ghi công** (mở từ màn đăng nhập và Cài đặt). Dữ liệu `shared/assets/credits/credits.json` sinh từ `art/CREDITS.md` + `tools/assets/private-packs.json` bằng `node tools/assets/credits.mjs`; `npm run check` báo lỗi nếu file cũ, mục mới chưa khai ở `SECTIONS`, hoặc dòng ghi công bắt buộc của gói kho riêng thiếu (ví dụ Gigapack: "Super Pixel Effects Gigapack - Will Tice / unTied Games").
  - **CC-BY-SA / GPL**: file đã sửa (đổi màu, cắt, ghép) cũng theo đúng giấy phép đó; ghi rõ trong `CREDITS.md` và giữ ảnh / âm thanh trong repo công khai. Không gộp chung vào một file atlas (sheet, audio sprite) với asset của mình nếu không cần; gộp thì ghi chú cả file atlas theo giấy phép SA / GPL.
  - **NC** (phi thương mại): chỉ dùng khi game vẫn phi thương mại; gắn cờ NC trong `CREDITS.md` để dễ thay nếu sau này thương mại hóa.
  - Asset có nhiều giấy phép thì dùng theo giấy phép ít ràng buộc nhất (CC0 / CC-BY / OGA-BY, rồi CC-BY-SA, GPL, NC).
- `lpc-compose.mjs`, `lpc-item.mjs` và `tools/audio` nhận mọi giấy phép đã biết, tự ghi giấy phép kèm cờ SA / GPL / NC vào `CREDITS.md`, và dừng nếu không đọc được giấy phép.
- Gigapack và Forest (kho riêng) **cấm đưa vào AI**: không dùng làm ảnh tham chiếu, không đưa vào PixelLab / model.

## Đồng bộ ghi công khi gộp nhánh

`art/CREDITS.md` là hồ sơ nguồn (không phải file sinh); ghi công hồn thú hoạt ảnh nằm riêng trong bảng `## Ghi công` của `art/src/beast-anim/<loài>/NGUON.md`. `shared/assets/credits/credits.json` là dữ liệu gộp do công cụ sinh từ các hồ sơ này và `tools/assets/private-packs.json`; **không sửa tay**, không chọn nguyên bản của một nhánh để giải quyết xung đột JSON.

Trước khi xin gộp PR có đổi hồ sơ ghi công, và sau khi giải quyết xung đột:

```bash
git fetch origin main
git merge origin/main
node tools/assets/credits.mjs
node --test tools/assets/credits.test.mjs
npm run check
```

Giữ đủ dòng nguồn của cả hai nhánh trong CREDITS.md / NGUON.md, rồi sinh lại JSON và commit cùng hồ sơ nguồn. Merge sạch không bảo đảm dữ liệu sinh còn đúng: hai PR có thể thêm dòng riêng mà JSON một dòng vẫn giữ số đếm từ nhánh cũ. Nếu main đổi tiếp trước khi squash, cập nhật nhánh và chạy lại quy trình trên. Người gộp lô cũng chạy sinh lại và kiểm tra trên kết quả gộp cuối trước khi đẩy main.

## Issue liên quan
Pilot menu 16 icon (29/10/2026, Part of #877, #884): Codex / OpenAI `image_gen` tích hợp, BOARD đã duyệt + swatch `art/palette.gpl`, không dùng ảnh thương mại. RAW nguyên byte và prompt: `art/src/ui-kit/toI-2.*`; nguồn/hash/ánh xạ từng cặp ở `menu-pilot.source.json`; sử dụng theo điều khoản đầu ra OpenAI, không gán CC0. Trang duyệt `art/src/ui-kit/pilot-menu/index.html` so với ảnh game-icons đang có (giữ nguyên byte, CC BY 3.0, tác giả từng file ở `art/CREDITS.md`); chủ repo đã chọn bộ AI (30/10/2026, #884): nhập vào game thay 16 `gi_menu_*` game-icons bằng `tools/assets/menu-icon-import.mjs` (cắt lại từ `toI-2.png`; `gi_menu_<key>` 32 × 32 + `gi_menu_<key>_1x` 24 × 24); 16 mục game-icons tương ứng đã gỡ khỏi `art/src/game-icons/icons.json` và `art/CREDITS.md`, ảnh tham chiếu giữ ở `pilot-menu/reference/` (CC BY 3.0).
Kit Giấy N/O/T (29/10/2026, Part of #877): sinh bằng Codex / OpenAI `image_gen` tích hợp, dùng BOARD đã duyệt và swatch `art/palette.gpl`, không dùng ảnh thương mại. RAW nguyên byte và prompt ở `art/src/ui-kit/to{N,O,T}-giay.*`; hash, lượt và nguồn gốc ở `giay.source.json`. Sử dụng theo điều khoản đầu ra OpenAI, không gán CC0; model ID/seed không được công cụ trả về. Cắt mềm, lượng tử 32 màu, nhập khóa `ui2_giay_*`; giữ bộ Mực và không đổi màn sử dụng.

BOARD v3 Hồn Quang Tiên Môn (#1260, Part of #877): Codex / OpenAI `image_gen`, ảnh tự sinh không dùng ảnh ngoài; nguồn, điều khoản đầu ra và prompt đầy đủ ở `art/CREDITS.md`, candidate tại `art/src/ui-kit/candidates/hon-quang-v3/`. Chưa nhập vào game, chưa thay BOARD đã duyệt.

#477 (hoạt ảnh hồn sư), #482 / #541 (pháp tướng, sheet hiệu ứng), #564 (hồn sư = LPC), #627 (kho asset riêng).
