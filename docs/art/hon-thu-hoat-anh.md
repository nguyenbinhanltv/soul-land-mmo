# Mỹ thuật: hoạt ảnh vẽ thật của hồn thú (H1, #688)

Hồn thú lai hiện chỉ có 3 ảnh tĩnh (nam, đông, bắc) + chuyển động vẽ bằng code (`nhan-vat-hon-thu.md`, `STATIC_MOTION`). Đường này **thêm** hoạt ảnh vẽ thật cho từng loài: tthoadev sinh ảnh bằng ChatGPT / Codex (Q44), orchestrator cắt + hậu kỳ bằng công cụ ở `tools/assets/beast-sheet-*.mjs` rồi nối client. **Phạm vi PR này: đặc tả + công cụ + trang xem trước; chưa đổi client, chưa có ảnh model thật** (công cụ chỉ thử trên tờ giả dựng từ ảnh tĩnh). Ảnh vào game vẫn qua duyệt PR; nguồn, model, prompt ghi ở `art/CREDITS.md`.

## Đã chốt (chủ repo)
- **5 hướng vẽ thật:** nam `s`, đông-nam `se`, đông `e`, đông-bắc `ne`, bắc `n`; tây-nam / tây / tây-bắc là lật ngang `se` / `e` / `ne` (như `docs/art/quy-cach-isometric.md`). Mọi hướng nghiêng phải nhìn sang **phải**.
- **5 hoạt ảnh vẽ thật:** đứng `idle`, đi `walk`, đánh `attack`, trúng đòn `hurt`, chết `die`. Báo trước (`windup`), nháy trắng, lao tới, chìm / mờ khi chết vẫn do code (client) chồng lên.
- **Thử 3 loài trước** (bảng cuối).

## Số khung mỗi hoạt ảnh
| Hoạt ảnh | Khung | Lý do |
|---|---|---|
| đứng `idle` | 4 | thở, vòng lặp ngắn |
| đi `walk` | 6 | một chu kỳ bước (chạm đất / nhấc / đổi chân) |
| đánh `attack` | 6 | gồng, lao, chạm, thu về (tư thế báo trước giữ bằng code) |
| trúng đòn `hurt` | 2 | giật lùi + phục hồi, code thêm nháy trắng và lắc |
| chết `die` | 4 | loạng choạng, ngã, nằm; khung cuối được giữ |

Giữ đúng đề xuất: 22 khung / hướng, 110 khung / loài; nhiều hơn thì không vừa ảnh ChatGPT (xem dưới), ít hơn thì chu kỳ đi giật. Hằng nằm ở `tools/assets/beast-sheet-lib.mjs` (`ANIMS`); không phải số cân bằng.

## Bố cục tờ ảnh
- **Lưới cố định, không chữ trong ảnh:** model vẽ nhãn chữ không đáng tin và chữ lẫn vào hình, nên hàng / cột là nhãn (vị trí quyết định hướng, hoạt ảnh, khung). Mỗi hướng một **khối 4 hàng × 6 cột**: hàng 1 = đứng (cột 1–4) + trúng đòn (cột 5–6), hàng 2 = đi (6), hàng 3 = đánh (6), hàng 4 = chết (cột 1–4, hai ô cuối để trống). Ghép đứng + trúng đòn một hàng để ô gần vuông.
- **Nền** `#FF00FF` phẳng (như `gemini-import`) hoặc trong suốt thật; công cụ nhận cả hai (nền lấy từ 4 góc, điểm alpha < 128 là nền).
- **Giới hạn ChatGPT:** chỉ 1024×1024, 1536×1024, 1024×1536. Ô vẽ phải lớn hơn khung game (`ISO_BEAST_SIZES`: 64 / 96 / 128 / 160 / 192) để thu về lưới pixel không phải phóng to, nên số hướng mỗi tờ phụ thuộc bậc:

| Bậc (khung) | Tờ | Hướng | Ảnh | Lưới | Ô |
|---|---|---|---|---|---|
| Trắng / Vàng (64), Tím / Đen (96) | A | `s`, `se`, `e` | 1024×1536 | 6 × 12 | ≈ 170×128 |
| | B | `ne`, `n` | 1024×1024 | 6 × 8 | ≈ 170×128 |
| Đỏ (128), thú vương (160), boss (192) | A–E | một hướng mỗi tờ, theo thứ tự `s`, `se`, `e`, `ne`, `n` | 1536×1024 | 6 × 4 | 256×256 |

  Tờ B, C… của cùng loài đính thêm tờ A đã duyệt làm tham chiếu phong cách. Khung 128 cũng dùng 5 tờ một hướng (ô 256 thu về không phóng to); nếu thử thấy ô 170×128 đủ cho khung 128 thì gộp lại sau.
- **Điểm neo chân:** chân (đáy hộp bao) đặt giữa khung ngang, cách mép dưới `ISO_BEAST_FOOT` (giống sheet tĩnh, để bóng và vòng hồn hoàn của client khớp). Prompt yêu cầu mọi khung đứng trên một đường nền ẩn cao khoảng 12% ô; công cụ căn lại theo đáy hình từng khung (khung nhảy / bay mất độ cao, chấp nhận; code vẫn nhấc sprite khi cần).
- **Góc nhìn và phong cách:** isometric 2:1 nhìn từ trên xuống khoảng 30°, thủy mặc trầm (A / B ở `quy-cach-isometric.md`), 3 sắc độ mỗi vùng, viền `#1a1020`; **không** mắt sáng, hào quang, bóng, hiệu ứng (client vẽ).
- **Khung game (đầu ra):** vuông theo bậc, sheet **6 cột × 20 hàng** (5 hướng × 4 dải, cùng thứ tự dải với tờ), file `<loài>_anim.png`, key `beast_<loài>_anim`; `manifest-entry.json` ghi `anim` (hướng, dải và cột đầu từng hoạt ảnh, số khung, gốc chân). Chép vào `shared/assets/sprites/beast/`, manifest và đổi client là việc của PR nối client (H2), **chưa làm ở đây**. Normal map `_n` sinh bằng `normal.mjs` lúc nhập.

## Mẫu prompt (tự sinh từ BEASTS)
`node tools/assets/beast-sheet-prompt.mjs --species <loài> --out <thư mục>` ghi mỗi tờ một file `<loài>-to<A|B…>.md`: bảng tóm tắt, **cách làm** cho tthoadev, **khối prompt tiếng Anh**, chú thích tiếng Việt, lệnh cắt. Tên, họ hoạt ảnh (`beastFamily`), bậc / khung lấy tự động từ `BEASTS`, manifest và `client/src/sprites.ts`; mô tả ngoại hình lấy từ prompt ảnh tĩnh ở `art/CREDITS.md` (`--desc` ghi đè; loài chưa có prompt dùng bảng `DESC_OVERRIDE` trong `beast-sheet-lib.mjs`). `--all` liệt kê mọi loài đã có ảnh tĩnh. Prompt gồm: ảnh tĩnh loài đính kèm làm tham chiếu nhân vật (giữ y nguyên thiết kế, tỉ lệ, màu, cỡ); lưới và bố cục từng hàng; gợi ý chuyển động theo họ (bốn chân / chim / rắn / côn trùng / cây); câu **nhất quán** (cùng cỡ, bảng màu, nét viền, chỉ đổi tư thế, vòng lặp mượt, hướng nghiêng nhìn phải); danh sách không vẽ. Mỗi tờ một cuộc trò chuyện ChatGPT mới; hỏng thì vẽ lại cả tờ.

## Công cụ cắt `beast-sheet-cut.mjs`
`node tools/assets/beast-sheet-cut.mjs --species <loài> --sheet A=<ảnh> [--sheet B=…] --out <thư mục> [--colors 24] [--palette auto|gpl|<gpl>] [--fill 0.8 | --scale S] [--key #ff00ff] [--tol 60] [--frame N]`
1. **Tách:** bỏ nền, gỡ 3 lớp viền ngả màu nền, thành phần liên thông 8 hướng; mỗi thành phần về ô lưới chứa trọng tâm; **hình dính nhiều ô** thì chia theo ô và cảnh báo; mảnh nhỏ sát thân gộp vào thân, mảnh vụn và ô chỉ có đốm bị bỏ (đếm ở báo cáo; mảnh rời lớn bị bỏ thì cảnh báo).
2. **Căn chân:** đáy hộp bao về hàng neo, tâm chân (trung bình x các hàng đáy) về giữa khung; hình lệch mép được dời vào trong, cảnh báo nếu dời xa.
3. **Đồng cỡ:** **một** hệ số thu cho cả loài, mặc định khớp chiều cao thân khung đông của ảnh tĩnh hiện có (không có thì `--fill` × khung); vượt khung thì hạ tối đa 20%, còn vượt nữa thì cảnh báo cắt mép.
4. **Màu và pixel:** lượng tử về bảng màu (median cut `--colors`, hoặc `art/palette.gpl` / file `.gpl`), thu về lưới pixel bằng bỏ phiếu màu nhiều nhất (4×4 mẫu mỗi điểm, không nội suy), viền ngoài `#1a1020` (tô lại nếu viền hình vốn tối, không thì thêm một vòng).
5. **Cảnh báo** (không dừng, trừ thiếu khung thì thoát mã 1): thiếu khung / tờ; hình ở ô trống; khung lệch diện tích / cao / rộng so với trung vị cùng hoạt ảnh và hướng; chân lệch quá 15% chiều cao ô; vượt hoặc chạm mép khung; hình dính; mảnh rời lớn bị bỏ.
6. **Ghi:** `<loài>_anim.png`, `manifest-entry.json`, `_report.json`.

Tên theo quy ước game (`beast_<loài>_anim`); không dùng tên gói ngoài.

## Trang xem trước
`node tools/assets/beast-sheet-preview.mjs --species <loài> --dir <thư mục đã cắt>` ghi `preview/index.html`: lưới **hoạt ảnh × 8 hướng** (5 vẽ thật + 3 tây lật ngang bằng CSS), mỗi ô một GIF lặp (phóng nguyên lần), hàng trên cùng là **ảnh tĩnh hiện tại** đúng hướng (`STATIC_DIR_MAP`) để so cỡ, màu, nét. Chết giữ khung cuối gần 1 giây. Duyệt trang này rồi mới nối client.

## Thử không cần ảnh thật
`node tools/assets/beast-sheet-fake.mjs --species <loài> --out <thư mục> [--seed N] [--bad]` dựng tờ giả từ ảnh tĩnh: phóng, nhún / xoay / lao / ngã theo hoạt ảnh, lệch ngẫu nhiên trong ô, nhiễu màu, viền ngả màu nền, đốm vụn; `--bad` thêm khung biến mất, khung phóng gấp 2,6, hình tràn ô, hình ở ô trống. `node --test tools/assets/beast-sheet.test.mjs` (nằm trong `npm run test:assets`) chứng minh: đủ 110 khung, chân đúng neo, bỏ vụn, viền, ≤ 25 màu, đồng cỡ trong một hoạt ảnh, cảnh báo đúng với tờ lỗi, nhận nền trong suốt, GIF hợp lệ, prompt đủ ý. Tờ giả **không** thay được thử thật: ảnh model còn lỗi mà tờ giả không dựng (tay chân đổi, chữ lạ, ô vẽ lệch hàng); sau tờ thật đầu tiên chỉnh `--tol` và ngưỡng cảnh báo cho khớp.

## Ba loài thử
| Loài | Mã | Họ (`beastFamily`) | Bậc | Khung | Tờ | Vì sao |
|---|---|---|---|---|---|---|
| Phong Lang | `phong_lang` | bốn chân | Tím / Đen | 96 | 2 | loài phổ biến của Ngoại vi, dáng chuẩn thú bốn chân (chu kỳ đi, vồ) |
| Kim Linh Ưng | `kim_linh_ung` | chim | Tím / Đen | 96 | 2 | họ chim: nhảy cò, cánh, bổ nhào; ca khó (cánh khi đánh và ngã) |
| Thái Thản Cự Viên | `thai_than_cu_vien` | bốn chân | boss thế giới | 192 | 5 | cỡ lớn nhất, ô 256, thử đường một hướng mỗi tờ và độ nét ở khung 192 |

Tổng 9 tờ (2 + 2 + 5). Làm theo thứ tự Phong Lang, Kim Linh Ưng, Thái Thản Cự Viên; mỗi loài xong thì cắt và xem trang trước rồi mới vẽ loài kế để rút kinh nghiệm cho prompt. Chưa có thú vương (khung 160) trong 3 loài vì boss đã thử đường một hướng mỗi tờ.

## Client phát hoạt ảnh (H3, đã làm)
Code ở `client/src/beastAnim.ts` (chọn khung, không phụ thuộc Phaser, có bài kiểm `npm run test:beastanim --prefix client`) và `sprites.ts` (`syncBeastSprite`, `animBeastPose`).
- **Điều kiện dùng:** loài có texture `beast_<loài>_anim` (manifest `anim`; thiếu `anim` thì dùng bố cục mặc định của đặc tả) **ưu tiên hơn** ảnh tĩnh. Loài chưa có sheet đi nguyên nhánh cũ (ảnh tĩnh + `staticBeastPose`): hành vi, bot, ảnh chụp cũ không đổi.
- **Chọn khung theo giờ, không dùng animation của Phaser:** hướng 8 → hàng của 5 hướng vẽ (tây lật ngang `se` / `e` / `ne`); trạng thái theo ưu tiên báo trước (`cast`, giữ khung 0 dải đánh) > ra đòn (khung 1–5 sau khi `cast` tắt) > trúng đòn (máu giảm, 2 khung) > đi (`moving`, giữ thêm `walkHold` để không nháy) > đứng. Số khung tính từ giờ trong trạng thái nên đổi hướng giữa chừng chỉ đổi hàng, không nhảy về khung đầu; nhịp đi nhân `walkScale` (đuổi nhanh hơn lang thang như `BEAST_ANIM_SCALE`) và cộng dồn pha nên đổi tốc độ không giật. Nhịp khung ở `ART_MS`.
- **Còn do code chồng:** báo trước (co giãn, ngả, lùi), nửa quãng lao khi ra đòn, lắc và nháy trắng khi trúng đòn; phần thở / nhún / nghiêng khi đứng và đi **bỏ** (đã vẽ trong khung). Bóng, vòng hồn hoàn, glow bậc, "!" của hồn thú hung hăng, nháy cuồng nộ giữ nguyên (cùng gốc chân `ISO_BEAST_FOOT`, thân đo ở khung idle đầu của 5 hướng).
- **Chết:** hồn thú bị kết liễu để lại bóng chạy dải `die` (giữ khung cuối) rồi mờ dần; loài chưa có sheet vẫn ngã bằng code.
- **Thử bằng sheet giả:** `beast-sheet-fake.mjs` + `beast-sheet-cut.mjs` rồi cài tạm vào `shared/assets` (không commit); xem ảnh chụp và số FPS ở mô tả PR.

## Việc tiếp
H2 (đã làm cho Phong Lang, #691): sheet `beast_phong_lang_anim` đã nhập vào `shared/assets` (cắt `--scale 0.55`); Kim Linh Ưng cũng đã nhập (`beast_kim_linh_ung_anim`); Thái Thản Cự Viên cũng đã nhập (`beast_thai_than_cu_vien_anim`), cả 3 loài thử xong. H4 (#766): đợt 1 #767 nhập Ám Kim Khủng Trảo Hùng (`beast_am_kim_khung_trao_hung_anim`, cắt `--scale 0.55` tự hạ về 0,440).
