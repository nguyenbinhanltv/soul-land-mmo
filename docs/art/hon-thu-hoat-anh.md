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
- **Lưới theo hàng / cột, không chữ trong ảnh:** model vẽ nhãn chữ không đáng tin và chữ lẫn vào hình, nên hàng / cột là nhãn (vị trí quyết định hướng, hoạt ảnh, khung). Mỗi hướng một **khối 4 hàng × 6 cột**: hàng 1 = đứng (cột 1–4) + trúng đòn (cột 5–6), hàng 2 = đi (6), hàng 3 = đánh (6), hàng 4 = chết (cột 1–4, hai ô cuối để trống). Ghép đứng + trúng đòn một hàng để ô gần vuông.
- **Nền (dung sai):** prompt xin `#FF00FF` phẳng nhưng model không làm được đúng (đo: mốc `(252,4,252)`, dốc dọc nhẹ); **gradient nhẹ được phép**. Chỉ cần mọi điểm nền nằm trong khoảng cách ≤ `--tol` (mặc định 60) so với màu khóa đọc ở 4 góc, hoặc nền trong suốt thật (alpha < 128): công cụ tự tách. Nền lệch quá dung sai (không tách sạch) mới là lỗi.
- **Cỡ ảnh theo TỈ LỆ (v2, #861 / #862):** công cụ sinh ảnh (Codex `image_gen`) không có tham số cỡ, chỉ có tỉ lệ khung, nên người nộp **không** chọn cỡ và không resize. Cỡ hợp lệ (±1%): **A 1024×1536** (2:3), **B 1254×1254 hoặc 1024×1024** (1:1), **boss 1536×1024** (3:2). Cỡ lệch trong tập này **không phải lỗi**; cutter chuẩn hóa về đơn vị của `sheetPlan` (mục dưới). Ô vẽ phải lớn hơn khung game (`ISO_BEAST_SIZES`: 64 / 96 / 128 / 160 / 192) để thu về lưới pixel không phải phóng to, nên số hướng mỗi tờ phụ thuộc bậc:

| Bậc (khung) | Tờ | Hướng | Ảnh (chuẩn; cỡ hợp lệ) | Lưới | Ô |
|---|---|---|---|---|---|
| Trắng / Vàng (64), Tím / Đen (96) | A | `s`, `se`, `e` | 1024×1536 | 6 × 12 | ≈ 170×128 |
| | B | `ne`, `n` | 1024×1024 (1254×1254 cũng hợp lệ) | 6 × 8 | ≈ 170×128 |
| Đỏ (128), thú vương (160), boss (192) | A–E | một hướng mỗi tờ, theo thứ tự `s`, `se`, `e`, `ne`, `n` | 1536×1024 | 6 × 4 | 256×256 |

  Tờ B, C… của cùng loài đính thêm tờ A đã duyệt làm tham chiếu phong cách. Khung 128 cũng dùng 5 tờ một hướng (ô 256 thu về không phóng to); nếu thử thấy ô 170×128 đủ cho khung 128 thì gộp lại sau.
- **Dung sai lưới:** ô chỉ là nhãn danh nghĩa chia theo cỡ thực của ảnh. Hình **được phép** lệch hoặc tràn ra ngoài ô vài điểm (không đòi "không chạm mép ô"); cái cần đúng là **số hàng và số hình mỗi hàng** (hình thuộc hàng / cột nào thì là khung đó). Hình dính nhiều ô, ô trống có hình, hoặc thiếu hình mới là lỗi. Dò lưới theo khoảng trống thay lưới chia đều: việc của #864, chưa làm ở đây.
- **Điểm neo chân:** chân (đáy hộp bao) đặt giữa khung ngang, cách mép dưới `ISO_BEAST_FOOT` (giống sheet tĩnh, để bóng và vòng hồn hoàn của client khớp). Prompt yêu cầu mọi khung đứng trên một đường nền ẩn cao khoảng 12% ô; công cụ căn lại theo đáy hình từng khung (khung nhảy / bay mất độ cao, chấp nhận; code vẫn nhấc sprite khi cần).
- **Góc nhìn và phong cách:** isometric 2:1 nhìn từ trên xuống khoảng 30°, thủy mặc trầm (A / B ở `quy-cach-isometric.md`), 3 sắc độ mỗi vùng, viền `#1a1020`; **không** mắt sáng, hào quang, bóng, hiệu ứng (client vẽ).
- **Khung game (đầu ra):** vuông theo bậc, sheet **6 cột × 20 hàng** (5 hướng × 4 dải, cùng thứ tự dải với tờ), file `<loài>_anim.png`, key `beast_<loài>_anim`; `manifest-entry.json` ghi `anim` (hướng, dải và cột đầu từng hoạt ảnh, số khung, gốc chân). Chép vào `shared/assets/sprites/beast/`, manifest và đổi client là việc của PR nối client (H2), **chưa làm ở đây**. Normal map `_n` sinh bằng `normal.mjs` lúc nhập.

## Tiêu chí đạt v2: chặn / nhẹ (theo khối hướng)
Duyệt theo **khối hướng** (`s`, `se`, `e`, `ne`, `n`), không theo cả tờ: khối chặn thì không nhập khối đó, khối nhẹ nhập và ghi sổ. Nguồn: báo cáo H4 mục 5.3 C (công cụ kiểm tự động là #863, chưa có; hiện duyệt bằng mắt + `_report.json`).

| Loại | Tiêu chí |
|---|---|
| **Chặn** | cỡ ảnh ngoài tập hợp lệ ở trên; nền không tách được; thiếu khung / không dò được hàng; hình dính; `n` / `ne` thấy mặt ở idle / walk / attack (hurt, die cũng không được); `se` không khác `e`; sai nhận diện loài; cỡ thân lệch quá ±25% so với ảnh tĩnh cùng hướng |
| **Nhẹ** | hurt biên độ nhỏ; die hơi xoay nhưng còn đọc được; vài khung vượt ô nhưng cắt được; cỡ thân lệch 10–25%; nền gradient, cỡ 1254² (đã chuẩn hóa) |
| **Đạt đẹp** | idle / walk lặp mượt, hurt lùi rõ theo hướng, die đổ dọc theo hướng |

**Hurt và die (đã chốt 2026-10-26):** vẫn vẽ đủ hoạt ảnh (2 và 4 khung), nhưng hurt chỉ **lùi một đoạn ngắn theo hướng đang quay**, thân và chân giữ trục, **không** ngửa bụng, **không** quay mặt về người xem; die **đổ dọc theo hướng đang quay** và nằm xương sống song song hướng đó, **không** xoay thân 90°. Ở `n` / `ne` không thấy mắt / mặt trong bất kỳ khung nào, kể cả hurt. Mẫu prompt đã có các câu này (`beast-sheet-prompt.mjs`).

## Mẫu prompt (tự sinh từ BEASTS)
`node tools/assets/beast-sheet-prompt.mjs --species <loài> --out <thư mục>` ghi mỗi tờ một file `<loài>-to<A|B…>.md`: bảng tóm tắt, **cách làm** cho tthoadev, **khối prompt tiếng Anh**, chú thích tiếng Việt, lệnh cắt. Tên, họ hoạt ảnh (`beastFamily`), bậc / khung lấy tự động từ `BEASTS`, manifest và `client/src/sprites.ts`; mô tả ngoại hình lấy từ prompt ảnh tĩnh ở `art/CREDITS.md` (`--desc` ghi đè; loài chưa có prompt dùng bảng `DESC_OVERRIDE` trong `beast-sheet-lib.mjs`). `--all` liệt kê mọi loài đã có ảnh tĩnh. Prompt gồm: ảnh tĩnh loài đính kèm làm tham chiếu nhân vật (giữ y nguyên thiết kế, tỉ lệ, màu, cỡ); lưới và bố cục từng hàng; gợi ý chuyển động theo họ (bốn chân / chim / rắn / côn trùng / cây); câu **nhất quán** (cùng cỡ, bảng màu, nét viền, chỉ đổi tư thế, vòng lặp mượt, hướng nghiêng nhìn phải); danh sách không vẽ. Prompt xin tỉ lệ khung (không đòi số pixel). Mỗi tờ một cuộc trò chuyện mới; hỏng thì vẽ lại cả tờ.

## Công cụ cắt `beast-sheet-cut.mjs`
`node tools/assets/beast-sheet-cut.mjs --species <loài> --sheet A=<ảnh> [--sheet B=…] --out <thư mục> [--no-normalize-size] [--colors 24] [--palette auto|gpl|<gpl>] [--fill 0.8 | --scale S] [--key #ff00ff] [--tol 60] [--frame N]`
1. **Tách:** bỏ nền, gỡ 3 lớp viền ngả màu nền, thành phần liên thông 8 hướng; mỗi thành phần về ô lưới chứa trọng tâm; **hình dính nhiều ô** thì chia theo ô và cảnh báo; mảnh nhỏ sát thân gộp vào thân, mảnh vụn và ô chỉ có đốm bị bỏ (đếm ở báo cáo; mảnh rời lớn bị bỏ thì cảnh báo).
2. **Căn chân:** đáy hộp bao về hàng neo, tâm chân (trung bình x các hàng đáy) về giữa khung; hình lệch mép được dời vào trong, cảnh báo nếu dời xa.
3. **Đồng cỡ:** **một** hệ số thu cho cả loài, mặc định khớp chiều cao thân khung đông của ảnh tĩnh hiện có (không có thì `--fill` × khung); vượt khung thì hạ tối đa 20%, còn vượt nữa thì cảnh báo cắt mép.
4. **Màu và pixel:** lượng tử về bảng màu (median cut `--colors`, hoặc `art/palette.gpl` / file `.gpl`), thu về lưới pixel bằng bỏ phiếu màu nhiều nhất (4×4 mẫu mỗi điểm, không nội suy), viền ngoài `#1a1020` (tô lại nếu viền hình vốn tối, không thì thêm một vòng).
5. **Cảnh báo** (không dừng, trừ thiếu khung thì thoát mã 1): thiếu khung / tờ; hình ở ô trống; khung lệch diện tích / cao / rộng so với trung vị cùng hoạt ảnh và hướng; chân lệch quá 15% chiều cao ô; vượt hoặc chạm mép khung; hình dính; mảnh rời lớn bị bỏ.
6. **Ghi:** `<loài>_anim.png`, `manifest-entry.json`, `_report.json`.

### Chuẩn hóa kích thước (MẶC ĐỊNH BẬT)

Từ v2 (#862) cutter **luôn** chuẩn hóa kích thước (API `cutSpecies({ ..., normalizeSize })` mặc định `true`); `--no-normalize-size` (hoặc `normalizeSize: false`) tắt, chỉ để so trước / sau hoặc tái hiện hành vi cũ. Không còn khái niệm "ngoại lệ": mọi tờ đúng tỉ lệ của `sheetPlan` đều hợp lệ (B 1254×1254 hay 1024×1024), tờ sai tỉ lệ thì dừng với mã 2.

Mỗi tờ dùng **đơn vị canonical của chính `sheetPlan(frame)`**: hệ số `expectedWidth / actualWidth`, đồng thời tỉ lệ rộng / cao của ảnh phải khớp `sheetPlan` trong ±1% (lệch hơn thì dừng). Ví dụ B 1254×1254 dùng `1024/1254`, A 1024×1536 dùng 1. Tờ lớn A–E 1536×1024 vẫn dùng ô 256×256; không đổi sang đơn vị ô của tờ nhỏ. Sai tỉ lệ thì dừng với mã 2, không kéo riêng hai trục.

Cutter vẫn tách vật trên RAW; hộp bao, diện tích, chân và phép kiểm vừa khung đổi sang đơn vị canonical trước **một hệ số chung cả loài**. Khi xuất, hệ số từng tờ được gộp vào lần lấy mẫu bỏ phiếu 4×4 hiện có: không tạo ảnh resize trung gian, không nội suy màu, không tự phóng từng khung cho đầy ô. `--scale` và `--min-area` khi bật cờ dùng đơn vị canonical (diện tích là bình phương đơn vị).

`_report.json` giữ `size` thật và thêm `originalSize`, `expectedSize`, `factor`, `normalizedMode: "canonical-units"` theo từng tờ; CLI thêm `sourceSha256` từ byte file RAW. Công cụ chỉ đọc nguồn, không resize hay ghi lại RAW trong `art/src`. Cờ không sửa hướng, pose, số khung hoặc lưới: thiếu khung / ô trống / hình dính vẫn báo; thêm cảnh báo hình vượt ô và chạm mép ảnh nguồn. Ảnh cỡ chuẩn (factor 1) cho byte ảnh đầu ra y hệt khi tắt cờ (có test); cảnh báo bổ sung `vượt ô` / `chạm mép ảnh nguồn` giờ xuất hiện với mọi tờ, vì cờ mặc định bật.

```bash
node tools/assets/beast-sheet-cut.mjs --species bang_giap_cu_quy --sheet A=<RAW-A.png> --sheet B=<RAW-B.png> --out <thư-mục-dẫn-xuất>
```

Để tái tạo bằng chứng size-only: `node tools/assets/beast-sheet-normalization-preview.mjs --out <thư-mục-ngoài-repo>`. Helper tải hai PNG Băng Giáp Cự Quy từ commit nguồn cố định, kiểm SHA256; dùng đủ 5 RAW Thái Thản Cự Viên đã có trong repo và kiểm hash. Mã thực thi cutter/preview luôn là mã checkout hiện tại, không lấy code từ PR ảnh. Đầu ra gồm `index.html`, `evidence.json`, PNG, GIF và report trước/sau; các đường dẫn tương đối mở được offline. Không chứng nhận hướng hoặc pose.

CI `check-build` Ubuntu sinh bundle khi diff PR chạm cutter/helper/test/tài liệu liên quan; Windows không sinh lặp. Tải artifact `beast-normalization-preview-<PR head SHA>` từ GitHub Actions, giải nén rồi mở `index.html` (không phải website công khai). Artifact giữ 30 ngày. Evidence phân biệt `checkoutSha` (có thể là merge thử của CI), `prHeadSha`, `baseSha` và commit/hash RAW nguồn. `normalizedMode`/`factor` theo từng tờ ở report và evidence. Không commit bundle sinh ra vào Git.

**Nhập H4: không cần cờ** (chuẩn hóa mặc định bật; tờ B của Codex `image_gen` ra 1254×1254, không chuẩn hóa thì `ne` / `n` to hơn `s` / `se` / `e` khoảng 15–20%). Hệ số chung cả loài vẫn tự hạ nếu có khung chạm mép; so bảng cỡ thân idle 5 hướng trước / sau khi nhập. Ba loài đã nhập trước khi có cờ (Ám Kim Khủng Trảo Hùng, Hắc Bối Dã Trư, Huyền Băng Thiềm) đã cắt lại (Part of #767, #768).

**Đính chính #826:** #826 ghi Phong Lang, Kim Linh Ưng "đúng spec nên giữ nguyên" là **sai**: cả hai có tờ B 1254×1254 (công cụ sinh ảnh luôn ra cỡ này cho tỉ lệ 1:1), `ne` / `n` to 1,18–1,49× so với `s` / `e`. Hai loài đã cắt lại bằng cutter v2 mặc định (#862): dùng `--scale` giữ nguyên cỡ s / se / e trong game (Phong Lang 0.462, Kim Linh Ưng 0.453; chỉ kéo `ne` / `n` về cỡ của chúng): cao `ne` / `e` Phong Lang 1,39 → 1,13, Kim Linh Ưng 1,43 → 1,17 (`n` Kim Linh Ưng còn 1,31: neo cỡ theo ảnh tĩnh là #864).

Tên theo quy ước game (`beast_<loài>_anim`); không dùng tên gói ngoài.

### Cutter v2 (#864): lưới theo khoảng trống, neo cỡ khối hướng, cảnh báo phân mức
Tùy chọn thêm: `[--grid auto|uniform] [--patch A:c,r=c,r | A:c,r=- ]... [--no-anchor-blocks] [--block-tol 0.12] [--strict] [--verbose]`.
- **Lưới:** mặc định dò theo khoảng trống bằng `detectGrid` của `beast-sheet-grid.mjs` (cùng hàm với `beast-sheet-check`): ranh hàng / cột = điểm giữa hai dải / hai hình liền kề. Dải nào có số hình ≠ số khung thì cột của dải đó chia đều (ghi ở report); không dò được đúng số dải hàng thì cả tờ dùng lưới đều như v1 (`--grid uniform` ép dùng lưới đều). `_report.json` ghi `sheets.<tờ>.grid`. Ca Thiết Giáp Tê Ngưu tờ A (lệch bước hàng 9–12) cắt đủ 110 khung.
- **Neo cỡ:** hệ số chung cả loài giữ như v1 (khớp ảnh tĩnh khung đông). Thêm: khi **không** đặt `--scale` / `--fill` và loài có ảnh tĩnh, cao thân idle (trung vị) từng hướng so với ảnh tĩnh (`s` / `e` / `n` đo thẳng, `se` / `ne` nội suy nên ngưỡng 0,2); khối lệch quá `--block-tol` (0,12) thì được kéo về neo (kẹp 0,6–1,6, vẫn vừa khung). `_report.json`: `blocks` (cao thân, neo, tỉ lệ trước / sau) và `scaleInfo` (`auto` = hệ số tự động, `used` = hệ số dùng, `fit` = lớn nhất vừa khung, `suggested` = đề xuất `--scale` khi khung vượt). Đặt `--scale` tay thì không hiệu chỉnh khối (giữ byte #870).
- **Phân mức:** `info` (ồn / dự phòng, chỉ đếm theo mã), `warn` (nên xem: khung lệch, ô trống, hình dính, mảnh rời lớn, chạm mép), `block` (phải sửa: thiếu khung / tờ, khung vượt khung ở hệ số đang dùng). CLI in tóm tắt `block · warn · info` rồi từng dòng block / warn (tối đa 8 mỗi mức; `--verbose` in hết); `_report.json` thêm `issues` (`level`, `code`, `msg`) và `summary`; `warnings` (chuỗi) giữ nguyên. Mã thoát 1 chỉ khi thiếu khung (`--strict`: cả khi có block).
- **`--patch A:5,3=4,3`:** dời hình đang ở ô (cột 5, hàng 3 của tờ A, đếm từ 0) sang ô (4, 3); `A:5,3=-` bỏ hình đó. Dùng khi vài ô bị gán sai mà không đáng vẽ lại tờ; ghi vào report.
- **Cắt lại hàng loạt (chỉ chạy thử):** `node tools/assets/beast-recut-all.mjs --out <thư mục ngoài repo> [--only a,b] [--scale loài=S] [--compare]` cắt mọi loài trong `art/src/beast-anim`, ghi sheet + report từng loài và `_tom-tat.md` (hệ số tự động vs dùng, lưới, số cảnh báo theo mức; `--compare` thêm cột lưới đều + một hệ số). Không ghi vào `shared/` hay `art/src`; nhập lại vào game vẫn làm từng loài qua trang xem trước.

## Kiểm tờ trước khi nộp / cắt (`beast-sheet-check.mjs`, #863)
`npm run beast:check -- <loài> [--out <thư mục>] [--no-image]` (loài = thư mục trong `art/src/beast-anim`; `--all` in bảng tóm tắt mọi loài). Chỉ đọc tờ RAW, không cắt, không ghi vào repo (mặc định ghi ở thư mục tạm của máy). Ghi `<loài>-check.json`, `<loài>-check.md`, `<loài>-to<X>-lien-he.png` (tờ gốc + nhãn hàng `H`, cột `C`, hướng, nhãn khung `I/W/A/H/D` + số; hộp xanh = đạt, vàng = nhẹ, đỏ = chặn) và in dòng `LỖI:` nháp theo mẫu `NGUON.md`. Thoát mã 1 khi có tờ chặn.
- **Cỡ theo tỉ lệ** (quyết định #861): A 2:3 (1024×1536), B 1:1 (**1254² hoặc 1024²**, không còn là lỗi), một hướng 3:2 (1536×1024). Đúng tỉ lệ mà cỡ lạ → nhẹ; sai tỉ lệ → chặn. **Nền** khoá dung sai 60 quanh `#FF00FF` (gradient / vignette trong dung sai không phải lỗi).
- **Lưới dò theo khoảng trống** (`beast-sheet-grid.mjs`, dùng lại cho cutter): chiếu vật lên trục y ra dải hàng, lên trục x ra hình. **Chặn:** số dải hàng sai, số hình mỗi dải sai (hình dính / thiếu khung / mảnh rời), nền ngoài dung sai, cỡ thân idle lệch > 25% so với ảnh tĩnh (hệ số chung cả loài, `se` / `ne` nội suy từ `s` / `e` / `n`). **Nhẹ:** hình vào ô trống, chân lệch > 12% so với trung vị dải, cỡ thân lệch 10–25%, khung chết (idle / walk gần trùng), hurt trùng idle, chạm mép tờ. **Lưu ý (không tính mức):** `se` ≈ `e` (hình bóng, chỉ gần đúng).
- **Không kiểm bằng code, xem tờ liên hệ bằng mắt:** `n` / `ne` lộ mặt, hurt ngửa bụng / quay mặt, die xoay, nhận diện loài. Ngưỡng ở đầu `beast-sheet-check.mjs`, đo trên các tờ đã merge (lưới đúng mọi tờ; 5 dải hình dính: Lôi Văn Hầu A, Quỷ Ảnh Báo A, Tuyết Ma Viên A, Thái Thản C và D).

## Trang xem trước
`node tools/assets/beast-sheet-preview.mjs --species <loài> --dir <thư mục đã cắt>` ghi `preview/index.html`: lưới **hoạt ảnh × 8 hướng** (5 vẽ thật + 3 tây lật ngang bằng CSS), mỗi ô một GIF lặp (phóng nguyên lần), hàng trên cùng là **ảnh tĩnh hiện tại** đúng hướng (`STATIC_DIR_MAP`) để so cỡ, màu, nét. Chết giữ khung cuối gần 1 giây. Duyệt trang này rồi mới nối client.

**Trang xoay vòng hướng (#866)** `preview/xoay-vong.html` (ghi cùng `index.html`, có liên kết hai chiều): mỗi hoạt ảnh một GIF xoay `s→se→e→ne→n` (khung đại diện, giữ lâu mỗi hướng) viền vàng, đặt cạnh ảnh tĩnh `s` / `e` / `n` của loài và cạnh 5 ô GIF từng hướng có la bàn. Xem 5 giây là thấy: `se` ≈ `e` (hình đứng yên giữa hai nhịp), `n` / `ne` lộ mặt, hurt ngửa bụng hoặc quay mặt, die xoay. **CI:** PR đổi tờ chạy `beast:check` tự động, chỉ chặn bốn nhóm (cỡ ngoài tập, nền ngoài dung sai, thiếu khung, không dò được lưới), còn lại cảnh báo; xem `docs/ops/ci.md`.

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
H2 (đã làm cho Phong Lang, #691): sheet `beast_phong_lang_anim` đã nhập vào `shared/assets` (cắt `--scale 0.55`); Kim Linh Ưng cũng đã nhập (`beast_kim_linh_ung_anim`); Thái Thản Cự Viên cũng đã nhập (`beast_thai_than_cu_vien_anim`), cả 3 loài thử xong. H4 (#766): đợt 1 #767 nhập Ám Kim Khủng Trảo Hùng (`beast_am_kim_khung_trao_hung_anim`, cắt `--scale 0.55` tự hạ về 0,440); đợt 2 #768 nhập Hắc Bối Dã Trư (`beast_hac_boi_da_tru_anim`, khung 64, cắt `--scale 0.38` tự hạ về 0,306); Huyền Băng Thiềm (`beast_huyen_bang_thiem_anim`, khung 96, hệ số tự động 0,467); cả ba cắt lại bằng chuẩn hóa kích thước (Ám Kim `--scale 0.55` tự hạ 0,539; Hắc Bối `--scale 0.38` tự hạ 0,361).
