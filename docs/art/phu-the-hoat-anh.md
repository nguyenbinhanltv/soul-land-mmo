# Mỹ thuật: phụ thể võ hồn v2, vẽ mới + hoạt ảnh 5 hướng (P0, #1021, epic #1020)

Phụ thể hiện là ảnh tĩnh 5 hướng ghép theo điểm neo, chuyển động phụ do code (`client/src/spiritMotion.ts`; `nhan-vat-hon-thu.md`, `tools/assets/README.md` mục "Phụ thể võ hồn"). Đường v2 **vẽ mới hoàn toàn** từng phụ thể thành **hoạt ảnh vẽ thật 5 hướng** theo đường đi của hồn thú H4 v2 (`hon-thu-hoat-anh.md`, skill `beast-anim`): tthoadev sinh ảnh bằng ChatGPT / Codex, máy Mac nhập + merge ảnh, máy bàn viết công cụ và code. **Phạm vi file này (P0): đặc tả + audit + bảng phần riêng của phụ thể (nhóm, khung, điểm gắn, ghi chú clip); ngoại hình do `vo-hon-phong-cach.md` phần 4; không đổi code, không đổi server, không đổi số cân bằng.** Công cụ `phuthe-sheet-*` là P1, client phát clip + neo là P2, thử 3 võ hồn là P3, rollout P4, dọn `spiritMotion` P5.

**Ảnh phụ thể cũ (`art/src/gemini/phuthe_5huong/…`, `vh_{id}_b/_f`) chỉ để tham khảo ý, KHÔNG dùng làm nguồn hay ảnh tham chiếu** cho prompt, nộm hay tờ mới. Ngoại hình, màu, motif của từng võ hồn lấy từ **`vo-hon-phong-cach.md` phần 4** (nguồn duy nhất, xem mục "Ngoại hình: nguồn duy nhất"); ảnh mới sinh từ chữ.

## Đã chốt (chủ repo, 2026-10-27, mô tả epic #1020)
- **5 hướng vẽ thật:** `s`, `se`, `e`, `ne`, `n`; tây-nam / tây / tây-bắc là lật ngang `se` / `e` / `ne`; mọi hướng nghiêng nhìn sang **phải**.
- **Thân LPC chỉ có 3 hàng** (`s`, `e`, `n`; `LPC_SHEET`). Phụ thể `se` / `ne` **đặt theo neo của hàng `e`** của thân (xem "Neo").
- **Sheet mới `vhanim_{id}`:** `idle` 4, `walk` 6, `attack` 6, `cast` 4, `hurt` 2 khung; vật cứng ít pose hơn; **hai nửa sau / trước**.
- **Tách lớp:** một tờ + hình nộm LPC tham chiếu (cutter trừ màu nộm, mặt nạ theo vùng); dự phòng hai tờ riêng.
- **Thử 3 võ hồn:** Tà Hỏa Phượng Hoàng (cánh), Hạo Thiên Chùy (vật lớn), Lam Ngân Thảo (aura). Khung 128 được thử cho vật lớn.
- **Giữ `spiritMotion` mức lắc nhẹ** phủ lên clip vẽ thật. Võ hồn chưa có sheet mới chạy **nhánh cũ**.
- Thứ tự rollout: nhóm B → A → C (mục "Rollout").

## Số khung mỗi clip
Cùng thứ tự clip và cùng số khung với hồn thú (trừ `die`: phụ thể ẩn khi hồn sư gục, thêm `cast` vì hồn kỹ có hoạt ảnh thi triển riêng). Hằng nằm ở công cụ `tools/assets/phuthe-sheet-lib.mjs` (`ANIMS`, P1), không phải số cân bằng.

| Clip | Khung (B, C: sinh vật, thực vật, hư ảnh) | Khung (A: vật cứng) | Dùng khi | Ghi chú vẽ |
|---|---|---|---|---|
| `idle` | 4 | 2 | đứng yên | thở / chao nhẹ, vòng lặp ngắn; khung đầu = tư thế gốc, khớp khung đứng của thân |
| `walk` | 6 | 4 | đi / chạy | một chu kỳ theo nhịp bước của thân (cánh vỗ, đuôi vẫy, vật nảy); khung 0 và cuối nối mượt |
| `attack` | 6 | 4 | đánh thường | gồng, vung, chạm, thu về; vũ khí / vuốt / đuôi vẽ đúng pha vung của thân (thân chỉ **4** khung `attack`, 350 ms: clip phụ thể 6 khung chạy theo thời gian, xem "Ánh xạ clip phụ thể sang khung thân") |
| `cast` | 4 | 2 | thi triển hồn kỹ (thân dùng `spellcast`, **3** khung, 440 ms) | dang / nâng / phình cao hơn `attack`; khung cuối giữ được |
| `hurt` | 2 | 1 | trúng đòn | lùi ngắn theo hướng đang quay + phục hồi; code thêm nháy trắng và lắc |

- **Vật cứng (nhóm A)** ít pose vì không có chi thể uốn: các khung trung gian do `spiritMotion` (xoay / dịch nhẹ quanh `SPIRIT_PIVOT`) nội suy; vẽ ít pose nhưng **pose phải khác thật** (vung kiếm đổi góc, búa nâng lên nện xuống), không sao chép khung.
- Tổng: B / C **22 khung / hướng**, 110 khung / võ hồn; A **13 khung / hướng**, 65 khung / võ hồn. Số khung thật của từng clip ghi ở `anim` trong manifest (client đọc, không đoán).
- `die` và `absorb` không có clip phụ thể (phụ thể ẩn / mờ 60% như hiện nay).

## Hình nộm LPC tham chiếu
Phụ thể không vẽ lơ lửng: người vẽ cần thấy **thân hồn sư** để biết cánh mọc ở đâu, tay cầm ở đâu, phần nào bị thân che. Nên mỗi tờ kèm một **hình nộm** đúng khung thân mà game sẽ hiển thị:

1. **Dựng nộm** (P1, `phuthe-sheet-dummy.mjs`): lấy thân LPC mẫu mỗi giới (`m_0`, `f_0`, như phụ thể cũ), tô **một màu khoá phẳng**, không sáng tối, không viền, đúng khung thân mà bảng "Ánh xạ clip phụ thể sang khung thân" (mục dưới) chỉ cho từng khung của clip (thân chỉ có `idle` 4 bước, `walk` 6, `attack` 4, `cast` 3, `hurt` 2 theo `LPC_SHEET.anims`; số khung clip phụ thể **không** bằng số khung thân ở `attack` / `cast`) rồi đặt vào **ô của tờ** ở đúng chỗ chân (gốc `(48, 74)` khung 96 hoặc `(64, 90)` khung 128, phóng cùng hệ số với ô vẽ).
2. **Hướng của nộm:** `s` dùng hàng `s`, `n` dùng hàng `n`, **`se`, `e`, `ne` đều dùng hàng `e`** (thân chỉ có 3 hàng). Với `se` / `ne` phụ thể được vẽ chếch 3/4 còn nộm là dáng ngang: yêu cầu duy nhất là **điểm gắn** (lưng, vai, tay, đầu, chân) trùng nộm; không vẽ lại thân cho hợp góc.
3. **Màu khoá nộm** khác nền: nền vẫn `#FF00FF` dung sai 60 như hồn thú; nộm mặc định cyan phẳng `#00D0D0`. Võ hồn có màu chủ đạo gần cyan (Băng Phượng Hoàng, Lam Ngân Thảo, A Ngân, Cửu Bảo Lưu Ly Tháp, Lam Điện Bá Vương Long, Phá Hồn Thương) đổi nộm sang xanh lá `#30D030` hoặc vàng chanh `#D0D000` (`--dummy-key`), ghi màu thật dùng vào `NGUON.md`.
4. **Cutter trừ nộm:** điểm ảnh gần màu khoá trong dung sai (`--dummy-tol`, mặc định nhỏ hơn dung sai nền để không ăn sang phụ thể) bị xoá; viền ngả màu khoá gỡ ba lớp như viền ngả nền. Phần còn lại là phụ thể. Chỗ phụ thể che nộm thì còn nguyên, chỗ nộm che phụ thể thì phụ thể mất (đúng ý: đó là phần bị thân che).
5. **Nộm không vào game:** nộm chỉ có ở ảnh tham chiếu đính kèm và tờ RAW; sheet đầu ra không chứa điểm ảnh nào của nộm (`validate.mjs` kiểm: không còn màu khoá).

### Vạch tham chiếu và số đo nộm (#1171)
**Kiểm kê (2026-10-27):** nộm đã đúng khung ngay từ P1: thân `m_0` / `f_0` đúng khung thân của từng bước (idle 4, walk 6, attack 4, cast 3, hurt 2; mỗi khung phụ thể lấy bước thân ở tâm thời gian, theo bảng "Ánh xạ"), gốc chân đúng `frameOrigin` (96: `(48, 74)` → ô `(128, 197)`; 128: `(64, 90)` → ô `(128, 180)`), hệ số thu `CELL / khung` (96: 2,667; 128: 2,0), hàng hướng `s`, `e` (cho `se`, `e`, `ne`), `n`, hurt hướng xuống. Thân hồn sư cao ≈ 48 điểm trong khung thân 64 nên chiếm **≈ 51 % chiều cao ô** (khung 96) và ≈ 31 % chiều rộng; đường chân ở **77 %** chiều cao ô từ trên xuống. Lỗi "phụ thể lệch phải-sau, lớn gấp 2,5 lần nhân vật" **không** do nộm sai chỗ mà do ảnh tham chiếu chỉ có một hình cyan nhỏ trên nền hồng: model không thấy đường chân, trục, tâm gắn hay mép khung, nên vẽ phụ thể cỡ tranh lệch khỏi trục.

Vì vậy bảng nộm (`phuthe-sheet-dummy.mjs`, mặc định bật; `--no-guides` để tắt) vẽ thêm **vạch tham chiếu** cùng **một màu khóa riêng** (`GUIDE_KEY` `#7A5CFF`; võ hồn có màu gần màu vạch tự đổi sang `#FF8C00` hoặc `#80C000` theo `guideKeyOf`, ghi vào `NGUON.md`; ghi đè bằng `--guide-key`), theo đúng hệ số thu của nộm: **đường chân** (đứt nét ngang qua gốc chân), **trục dọc** qua gốc chân (đè lên nộm), **dấu cộng tâm ngực** (điểm neo `back` của thân, đè lên nộm), **thước chiều cao thân** bên trái (từ chân tới đỉnh đầu của chính khung đó), **bốn góc khung** phụ thể (ô = khung game; vẽ vượt mép khung bị cắt). Nộm vẫn tô một màu cyan phẳng, theo đúng bước thân của từng khung clip (không tĩnh).
- **Prompt** (`phuthe-sheet-prompt.mjs`) có khối `GUIDE LINES` do công cụ sinh: tên từng vạch, màu khóa, tỉ lệ thân / ô tính từ nộm, yêu cầu phụ thể ở trong góc khung và quanh trục ngực. Thứ tự ảnh tham chiếu không đổi (vạch nằm ngay trong ảnh số 1 là bảng nộm).
- **Cutter / kiểm tờ:** vạch bị trừ như nộm (`sheetMasks`, gỡ viền ngả màu vạch 3 lớp, bỏ khỏi mặt nạ nền để dò lưới không bị vạch chạy suốt ô làm hỏng); `eraseGuides` xóa vạch trước khi dò lưới ở `phuthe:check`. Còn điểm gần màu vạch trong sheet đầu ra thì báo `con-nom` (chặn), như màu nộm. Tờ cũ không có vạch vẫn chạy bình thường.

### Mặt nạ nửa sau / nửa trước theo vùng
Một tờ chỉ có **một** ảnh phụ thể mỗi khung (vẽ như nhìn thấy cùng thân), nên cutter chia **nửa sau** (`_b`, vẽ phía sau thân) và **nửa trước** (`_f`, vẽ phía trước thân; tên theo sheet cũ `vh_{id}_b` / `_f`) bằng **mặt nạ theo vùng**:
- Mỗi võ hồn có tệp mô tả `art/src/phuthe-anim/<id>/lop.json` (P1): với từng hướng, danh sách **vùng** (hộp hoặc đa giác trong toạ độ ô, tính theo gốc chân) kèm nhãn `sau` hoặc `truoc`, và nhãn mặc định cho điểm ngoài mọi vùng. Mặc định lấy theo quy tắc: phần **chồng lên nộm** (phụ thể vẽ đè thân: tay cầm, tai, vuốt trước ngực, dây leo trước người) là `truoc`; phần **nằm ngoài hình bao nộm** hoặc nằm sau trục lưng (cánh, đuôi, hư ảnh, chân nhện) là `sau`.
- Hướng quay lưng (`ne`, `n`): cánh, hư ảnh, đuôi **đổi sang `truoc`** (che thân), vũ khí tay đổi sang `sau` khi bị thân che, như quy tắc đã dùng ở phụ thể tĩnh (`vohon-static5.mjs`, bảng `LAYERS`).
- Vùng khai **một lần cho cả clip** (cùng hướng) dựa trên khung `idle` 0; khung có chi thể ra ngoài vùng (cánh dang, vung kiếm) vẫn theo nhãn mặc định của hướng; chỗ đặc biệt khai thêm vùng riêng theo khung trong `lop.json`.
- Một nửa không có điểm ảnh nào thì không đưa vào game (`"blank": true`, như `vh_{id}_b/_f`, #974).
- **Khi mặt nạ không đủ** (cánh cuộn quanh thân, dây leo quấn tay, rắn quấn cánh tay, vật vừa trước vừa sau): xin tthoadev **tờ hai lớp**.

### Dự phòng: hai tờ riêng
Khi mặt nạ theo vùng cho kết quả xấu (cắt rách cánh, nửa trước lọt ra sau) thì vẽ **hai tờ**: tờ `sau` ("chỉ vẽ phần phía SAU nộm; nộm che phần của nó") và tờ `truoc` ("chỉ vẽ phần phía TRƯỚC nộm; phần sau lưng bỏ trống"), cùng một nộm, cùng lưới, **không mặt nạ**. Hai tờ ghép khít vì cùng nộm và cùng neo. Tốn gấp đôi lượt ảnh nên chỉ dùng cho võ hồn mặt nạ không đạt; ghi lý do ở `NGUON.md`. Quy tắc lượt như hồn thú: tối đa 3 lượt mỗi khối, không dùng tờ lỗi làm tham chiếu.

## Bố cục tờ 5 hướng
Dùng lại bố cục **mỗi hướng một tờ** của hồn thú (`sheetPlan(frame, "direction")`, nền `#FF00FF`, lưới theo hàng / cột, **không chữ trong ảnh**, cỡ theo tỉ lệ):

| Tờ | Hướng | Ảnh | Lưới B / C (22 khung) | Lưới A (13 khung) |
|---|---|---|---|---|
| A | `s` | 1536×1024 (3:2) | 6 × 4: hàng 1 = `idle` 1–4 + `hurt` 1–2, hàng 2 = `walk` 1–6, hàng 3 = `attack` 1–6, hàng 4 = `cast` 1–4 (hai ô cuối trống) | hàng 1 = `idle` 1–2 + `hurt` 1, hàng 2 = `walk` 1–4, hàng 3 = `attack` 1–4, hàng 4 = `cast` 1–2 |
| B | `se` | như trên | như trên | như trên |
| C | `e` | như trên | như trên | như trên |
| D | `ne` | như trên | như trên | như trên |
| E | `n` | như trên | như trên | như trên |

- **Ô vẽ ≈ 256 × 256** (1536 / 6, 1024 / 4) lớn hơn khung 96 / 128 nên thu về lưới pixel không phóng to. Mỗi ô: nộm đúng chỗ + phụ thể; **nộm đứng yên ở ô đã đặt sẵn trong ảnh tham chiếu** (người sinh ảnh được đính nộm đã dựng, không tự vẽ thân).
- **Bài học #1083:** model không làm được lưới pixel (RAW luôn mềm, nhiều chi tiết li ti), nên prompt phụ thể cũng **không** đòi "lưới pixel / số màu"; hãy đòi hình lớn, đơn giản, điểm sáng to, và để cutter lập lưới. Tờ RAW chấm theo mức chặn / nhẹ như `phuthe:check`, đừng chặn vì "không pixel cứng". Chân dung, icon, pháp tướng của võ hồn dùng đường riêng: `docs/art/vo-hon-phong-cach.md` phần 6.1 (`vohon-prompt` / `vohon-pixelize` / `vohon:check`).
- **Turnaround trước** (như hồn thú): một ảnh 3:2, 5 cột hướng × 3 hàng (`idle`, `attack` đỉnh, `hurt`) = 15 hình, kèm nộm, để duyệt thiết kế và nét. Chỉ duyệt bằng mắt; làm ảnh mẫu cho 5 tờ.
- **Thứ tự ảnh tham chiếu cố định:** (1) bảng nộm của tờ đó (do P1 dựng); (2) turnaround đã duyệt; (3, tùy chọn) một tờ hướng của chính võ hồn đã qua kiểm không chặn. **Không đính ảnh phụ thể cũ.**
- **Dung sai lưới, nền, cỡ ảnh theo tỉ lệ** (tờ 3:2 một hướng): như `hon-thu-hoat-anh.md` mục "Bố cục tờ ảnh"; đếm hàng và số hình mỗi hàng, không đòi ô đều.
- Công cụ (P1, #1022, mục "Công cụ `phuthe-sheet-*`" bên dưới): `phuthe-sheet-dummy.mjs` (dựng nộm), `phuthe-sheet-prompt.mjs` (sinh prompt + hướng dẫn tiếng Việt; mô tả ngoại hình lấy từ `vo-hon-phong-cach.md` phần 4, phần kỹ thuật (nộm, lưới, nhóm, khung) từ file này), `phuthe-sheet-check.mjs` (`npm run phuthe:check`), `phuthe-sheet-cut.mjs` (trừ nộm, mặt nạ, căn neo, ghi sheet), `phuthe-sheet-preview.mjs` (xem trước), `phuthe-sheet-status.mjs` (`npm run phuthe:status`), tái dùng `beast-sheet-grid.mjs`. **Prompt tự sinh, không viết tay** (cùng luật `beast-anim`).

## Khung 96 / 128 và neo theo khung thân
- **Khung vuông 96** mặc định: khung thân mở rộng 16 mỗi phía, gốc `(48, 74)` như sheet phụ thể hiện tại, nên bóng, vòng hồn hoàn và lớp ghép không đổi. **Khung 128** cho vật lớn / cánh sải rộng (thân vẫn 64, mở rộng đều 32 mỗi phía): gốc `(64, 90)` (= gốc thân `(32, 58)` + 32 mỗi trục), cách mép dưới `128 − 90 = 38` điểm; khung 96 thì `(48, 74)`, cách mép dưới `96 − 74 = 22` (khoảng này **không** giữ nguyên giữa hai khung). Mỗi võ hồn chọn **một** khung cho cả sheet, ghi trong manifest (`frame`). Ứng viên 128: Hạo Thiên Chùy (thử ở P3), Cửu Bảo Lưu Ly Tháp, Phá Hồn Thương, Kỳ Nhung Thông Thiên Cúc, Tử Vong Chu Hoàng; quyết định theo kết quả P3 và đo FPS (sheet 128 lớn gấp 1,78 lần diện tích).
- **Kích thước sheet game:** mỗi giới một nửa như hiện tại (`ISO_VH_SEXES`, ghép theo `m_0` / `f_0`; client chọn nửa theo giới `vohonHalf`), 22 cột × (5 hướng × 2 giới) hàng: khung 96 → 2112 × 960, khung 128 → 2816 × 1280, dưới giới hạn texture 4096. Vật cứng (13 cột) nhỏ hơn. Hai giới dùng **chung ảnh vẽ** (một nộm, một tờ); cutter chỉ dời **neo** theo từng giới (`frameAnchors`), nên **không vẽ hai lần**.
- **Neo theo khung thân:** client đặt phụ thể theo **khung thân đang hiển thị** (hàng thân, cột) như áo / tóc (`nhan-vat-hon-thu.md`, `LPC_SHEET.anims`), nhưng **chọn khung của clip phụ thể theo tiến độ thời gian** của hoạt ảnh thân chứ không theo chỉ số khung thân, vì số khung khác nhau (xem mục dưới). Không có đồng hồ riêng cho phụ thể.

### Ánh xạ clip phụ thể sang khung thân
Thân (`LPC_SHEET.anims`, `ms` từng bước): `idle` 4 bước × 200 ms (`idx` 0,0,1,1) = 800 ms; `walk` 6 × 100 ms = 600 ms; `attack` 4 bước (70 / 70 / 90 / 120 ms) = 350 ms; `cast` 3 bước (100 / 200 / 140 ms) = 440 ms; `hurt` 2 bước (80 / 120 ms) = 200 ms. **Quy tắc:** clip phụ thể có `n` khung chia **đều** thời lượng của hoạt ảnh thân; khung phụ thể `i` (0…n−1) hiển thị trong đoạn `[i/n, (i+1)/n)` của tiến độ thân. **Neo** của khung `i` lấy từ **bước thân đang hiển thị ở giữa đoạn đó** (tâm thời gian `(i + 0,5)/n × tổng ms`); hình **nộm** của khung `i` ở tờ vẽ cũng dựng từ chính bước thân đó. Client dùng đúng quy tắc này khi chạy (đổi hướng giữa chừng chỉ đổi hàng, không nhảy khung); không cần ms riêng trong manifest. Bảng bước thân (chỉ số bước `idx` của hoạt ảnh) ứng với từng khung clip, tính từ `ms` ở trên:

| Clip | Khung phụ thể (B, C) | Bước thân của từng khung | Khung phụ thể (A) | Bước thân (A) |
|---|---|---|---|---|
| `idle` | 4 | 0, 1, 2, 3 (khớp 1-1; `idx` 0, 0, 1, 1 nên hai khung đầu cùng hình thân) | 2 | 1, 3 (tâm 200 ms và 600 ms rơi đúng ranh giới nên lấy bước sau; `idx` 0 và 1) |
| `walk` | 6 | 0, 1, 2, 3, 4, 5 (khớp 1-1) | 4 | 0, 2, 3, 5 |
| `attack` | 6 | 0, 1, 2, 2, 3, 3 | 4 | 0, 1, 2, 3 |
| `cast` | 4 | 0, 1, 1, 2 | 2 | 1, 2 |
| `hurt` | 2 | 0, 1 (khớp 1-1) | 1 | 1 |

(Bước thân là vị trí trong danh sách `anims.<clip>.ms` (0…); khi tâm rơi đúng ranh giới hai bước thì lấy bước sau; cột khung thật của thân lấy qua `idx` như `compose` ở `lpcRig.ts`.) P1 ghi bảng này thành hằng ở `phuthe-sheet-lib.mjs`, P2 dùng lại đúng hằng đó; có test so với `LPC_SHEET.anims` để đổi `idx` / `ms` của thân thì bắt được.

### Nộm và neo của clip `hurt` ở các hướng
Thân chỉ vẽ `hurt` (và `die`, `absorb`) ở hướng xuống (`LPC_SHEET.anims.hurt.dirs = "s"`, hàng `rows.hurt`), nhưng client **vẫn đổi tư thế thân khi trúng đòn ở mọi hướng**: `lpcRig.ts` (`build`, `FIRST_DOWN_ONLY_COL`) ánh xạ mọi hàng logic (`s`, `se`, `e`, `ne`, `n`) ở cột `hurt` / `die` về hàng vật lý 0, nên hồn sư quay `e` bị đánh vẫn hiện khung `hurt` hướng xuống. Chọn **(a), khớp thân hiện nay** (không đổi thân, không đổi hành vi `die`):
- **Mọi hướng (`s`, `se`, `e`, `ne`, `n`):** nộm và neo của **cả hai khung `hurt`** lấy từ khung thân `hurt` thật (hướng xuống, bước 0 và 1 theo bảng trên), **giống nhau ở cả 5 hướng**. Tờ vẽ `hurt` của hướng `e` (hay `se`, `ne`, `n`) vẫn vẽ phụ thể **theo hướng đó** (cánh, vũ khí nhìn từ hướng đó, lùi ngắn dọc hướng đang quay) nhưng đặt trên **nộm dáng bị đánh quay xuống**, để điểm gắn trùng thân đang hiển thị.
- Client (P2): trúng đòn thì phụ thể phát clip `hurt` của **hướng thân logic hiện tại** nhưng neo theo khung thân `hurt` (hàng vật lý 0), cùng cách như áo / tóc; hết `hurt` quay về `idle` / đi.
- Lựa chọn (b) (đổi thân giữ hướng khi `hurt`, dùng khung `idle` cùng hàng) là **thay đổi hành vi thân**, ngoài phạm vi phụ thể; nếu sau này làm, phải đổi lại mục này (nộm `hurt` theo `idle` cùng hàng) và cân nhắc `die` / `absorb` (đang hướng xuống cho mọi hướng).
- `die` và `absorb`: không có clip phụ thể (ẩn / mờ), nên không ảnh hưởng.

- **Hàng thân ↔ hướng phụ thể:**

| Hướng phụ thể | Hàng thân dùng làm neo | Ghi chú |
|---|---|---|
| `s` | `s` | |
| `se` | **`e`** | thân ngang, phụ thể chếch xuống: neo theo điểm gắn, không theo hình thân |
| `e` | `e` | |
| `ne` | **`e`** | thân ngang, phụ thể chếch lên (lưng nhiều hơn): neo như `se` |
| `n` | `n` | |
| `sw`, `w`, `nw` | lật ngang `se`, `e`, `ne` | `flipX` cả thân lẫn phụ thể |

- **Điểm neo** lấy từ khung thân bằng `frameAnchors` (tay cầm, giữa lưng, đỉnh đầu, chân) như phụ thể tĩnh hiện tại; hình nộm được dựng từ **đúng khung thân đó** nên điểm neo trên nộm = điểm neo cutter đo. Phụ thể dưới chân đứng yên theo gốc. Chi tiết dời neo và test (nhịp, lật) là việc P1 / P2.
- Hướng hiện của hồn sư LPC vẫn qua `GameScene.lpcFace` (8 → 4); phụ thể đọc hướng hiện đó (hướng `se`, `ne` do hướng thật `v.face`: `se` / `ne` chọn hàng phụ thể 5 hướng, hàng thân vẫn `e`). Việc chọn hàng 5 hướng ở client là P2.

## Client phát clip (P2, #1023)
- **Key và manifest:** hai nửa là `vhanim_{id}_b` / `vhanim_{id}_f` (file `shared/assets/sprites/vohonanim/{id}_{b|f}.png`), mục manifest `{ "key", "iso": true, "frame": [96, 96] | [128, 128], "anim": { "clips": { "idle": { "col", "n" }, ... }, "offset": { "<clip>": [dx, dy] } }, "blank": true? }`. Thiếu `clips` thì dùng bố cục mặc định 22 cột (`PHU_DEFAULT_CLIPS`); `offset` là độ dời cố định của clip (pixel khung, +x theo hướng nhìn, tây lật dấu), mặc định 0. `anim` / `frame` hỏng thì võ hồn chạy nhánh cũ. Tải lười cùng `vh_*` (`vohonLazy.wantVohon`), không có normal map; tải lỗi thì nhánh cũ.
- **Chọn khung (`client/src/phutheAnim.ts`, thuần, kiểm bằng `npm run test:phutheanim --prefix client`):** hàng = hướng (`phuDirRow`: s, se, e, ne, n; tây lật, `phuFaceOf` cho se / ne theo hướng thật khi thân đang hiện hàng `e`), cột = clip. Vòng lặp (`idle`, `walk`) theo **bước thân đang hiển thị**; một lần (`attack`, `cast`, `hurt`) theo **tuổi hoạt ảnh thân** chia đều thời lượng (đúng bảng "Ánh xạ clip phụ thể sang khung thân", test đối chiếu với `LPC_SHEET.anims`). `die` ẩn, `absorb` = `idle` mờ 60%. Không dùng animation của Phaser, không đồng hồ riêng, không tạo object mỗi khung; vẫn hai sprite phụ thể mỗi hồn sư.
- **Khung 96 / 128:** `fitPhuLayer` đặt gốc `(48, 74)` / `(64, 90)`; nửa giới theo `phuHalf` (thân nữ + sheet đủ hai nửa).
- **Neo:** ảnh trong sheet đã mang neo của bước thân chọn lúc cắt (P1); client đặt lớp tại gốc thân (`LPC_VIEW.vohon`) + độ dời clip. Chưa có dữ liệu bù chênh neo giữa bước thân thật đang hiển thị và bước thân dựng khung (chờ P1 / P3 đo; nếu cần thì thêm vào `anim.offset`).
- **`spiritMotion`:** khi có clip, dao động liên tục nhân `SPIRIT_CLIP_OSC_K` (`clipOscK`: vật cứng `weapon` / `float` giữ cao hơn); cú đánh / thi triển / hurt giữ nguyên; Giảm chuyển động vẫn phát clip.
- **Trang thử `?thu=phuthe`:** chọn hướng 8 phía, trạng thái gồm `hurt`, ô "Phụ thể" (`anim=` `auto` / `fake` / `0`): `fake` dựng sheet **giả** lúc chạy từ ảnh tĩnh (`phutheFake.ts`, không phải ảnh model, không vào game), `khung=128` thử khung 128.

## Tiêu chí duyệt: chặn / nhẹ / đẹp (theo khối hướng)
Duyệt theo **khối hướng** (`s`, `se`, `e`, `ne`, `n`), như hồn thú. Khác hồn thú: thân hồn sư luôn có đủ hướng nên **một võ hồn có khối chặn thì không nhập cả võ hồn** (vẽ lại **chỉ khối chặn**, tối đa 3 lượt); quá lượt thì võ hồn giữ nhánh cũ (xem "Fallback").

| Loại | Tiêu chí |
|---|---|
| **Chặn** | cỡ ảnh ngoài tập hợp lệ; nền không tách được; **còn điểm ảnh nộm** sau cutter (nộm lẫn vào phụ thể, hoặc mất cả phụ thể vì trùng màu khoá); thiếu khung / hình dính / không dò được hàng; **điểm gắn trôi** (cánh / vũ khí không dính vào nộm ở khung đứng, hoặc lệch quá ngưỡng neo giữa các khung của clip); sai nhận diện võ hồn so với bảng mô tả; **vẽ lại thân hoặc vẽ khuôn mặt, tay chân người** thay vì chỉ phụ thể; nộm bị vẽ thêm mặt ở `n` / `ne`; khung rỗng ở clip không phải `hurt` |
| **Nhẹ** | cỡ phụ thể lệch so với khối `s` cùng clip (mọi mức, **không chặn**: theo quyết định chủ repo 2026-10-26 mục 4 áp cho phụ thể như hồn thú; công cụ chỉ in số %, cutter không chỉnh cỡ theo khối, chuẩn hóa chỉ theo tỉ lệ tờ); `hurt` biên độ nhỏ; mặt nạ cần vá vài vùng (`lop.json` chỉnh tay); vài khung vượt ô nhưng cắt được; khung lệch diện tích so với trung vị cùng clip; nền gradient, cỡ ảnh theo tỉ lệ khác 1536×1024 (đã chuẩn hóa); pose vật cứng hơi giống nhau giữa các khung |
| **Đạt đẹp** | `idle` / `walk` lặp mượt, `attack` vung đúng pha thân, `cast` rõ hơn `attack`, hai nửa sau / trước ghép khít không thấy đường cắt, `se` khác `e`, `ne` khác `e` |

- **Kiểm bằng code (P1):** cỡ, nền, lưới, nộm còn tìm thấy / bị dời, màu nộm còn sót sau cutter, khung rỗng, điểm gắn (khoảng cách phụ thể tới nộm ở khung đứng), khung chết, hurt = idle, cỡ so với `s` (nhẹ); ngưỡng ở đầu `phuthe-sheet-check.mjs`, **mới đo trên tờ tổng hợp** (`phuthe-sheet-fake.mjs`), chỉnh lại khi P3 có tờ model thật.
- **Bằng mắt (tờ liên hệ + trang xoay vòng hướng + GIF ghép lên thân thật):** nhận diện võ hồn, `se` / `ne` khác `e`, khớp neo khi ghép lên thân LPC đang đi / đánh, hai nửa sau / trước, `hurt` lùi đúng hướng, không lộ viền nộm. Orchestrator tự duyệt theo phiếu; chủ repo chỉ duyệt mẫu từng nhóm (A / B / C) và tranh chấp.
- Mẫu comment một dòng mỗi khối: `s: đạt` · `se: nhẹ — hurt nhỏ` · `ne: chặn — cánh trôi khỏi vai ở walk 4`.

## Fallback nhánh cũ
- **Điều kiện dùng sheet mới:** texture `vhanim_{id}` có trong manifest (cho nửa nào không `blank`) → client phát clip; **không có** → chạy nguyên nhánh cũ (phụ thể tĩnh `vh_{id}_b/_f` + `spiritMotion` mức hiện tại): hành vi, bot, ảnh chụp cũ không đổi.
- Nhập **từng võ hồn một**, không nhập nửa vời: võ hồn nhập đủ 5 hướng không chặn thì dùng sheet mới cho cả 5 hướng; khối chặn thì giữ nhánh cũ cả võ hồn. (Dự phòng theo hướng `dirsOk` như `#869` của hồn thú chỉ làm nếu P4 thấy cần.)
- Loài nhánh cũ **không bị gỡ** cho đến khi mọi võ hồn đã nhập; P5 dọn sau khi 25 / 25 xong. Không đổi server, `VOHON`, số cân bằng.

## `spiritMotion` mức lắc nhẹ
- Clip vẽ thật đã chứa thở, vỗ cánh, vẫy đuôi, nảy; `spiritMotion` (đang cho cả 7 họ: `wing`, `tail`, `weapon`, `float`, `ghost`, `plant`, `limb`) **vẫn phủ lên** nhưng chỉ **lắc nhẹ** để tránh nhân đôi chuyển động: dao động liên tục (idle / walk) nhân hệ số giảm riêng, cú đánh / thi triển (`attack` / `cast`) giữ để giật theo cú vung, `hurt` giữ nguyên (lùi + nháy trắng, vì clip `hurt` chỉ 1–2 khung).
- Hệ số giảm là **một hằng riêng** ở `spiritMotion.ts` (P2 thêm, P5 chỉnh sau khi xem GIF; đề xuất khởi điểm khoảng một phần ba biên độ hiện tại), không chép số vào tài liệu. **Vật cứng (A) giữ mức cao hơn** vì ít pose (phần nội suy giữa các pose do code). Người khác vẫn thấy nhẹ hơn chính mình (`SPIRIT_OTHER_K`); Giảm chuyển động (`reduce`) vẫn tắt phần lắc của code nhưng **vẫn phát clip vẽ thật** (clip là hình, không phải hiệu ứng).
- Võ hồn còn ở nhánh cũ giữ `spiritMotion` mức hiện tại cho tới P5. Tên họ `SPIRIT_FAMILY` giữ; thêm võ hồn thì thêm dòng (bot kiểm đủ).

## Audit 25 võ hồn
**Đếm theo `VOHON` (`shared/data.ts`): 25 võ hồn** (21 SSR, 2 SR, 2 UR; hệ: cường công 7, mẫn công 6, khống chế 7, phụ trợ 5). Kiểm bằng cách đối chiếu `VOHON` với khoá `SPIRIT_FAMILY` ở `client/src/spiritMotion.ts`: **cùng 25 mã, không thiếu không thừa**. Con số **24** ở tiêu đề mục "Dạng phụ thể" của `tools/assets/README.md` là **sai** (bảng ngay dưới có 25 dòng); đã sửa thành 25 ở PR này. Các tài liệu khác (`phap-tuong.md`, `ky-nang/README.md`…) đã ghi 25.

### Phân nhóm
Theo **bản chất của phụ thể** (quyết định số khung, pose, mặt nạ, độ khó), không theo hệ hay họ `SPIRIT_FAMILY` (họ chỉ cho `spiritMotion`):

| Nhóm | Là gì | Pose | Khó ở đâu | Võ hồn (số) |
|---|---|---|---|---|
| **A: vật cứng** | binh khí, bảo vật, khí cụ: hình không biến dạng, chỉ xoay / dịch / lơ lửng | ít (idle 2, walk 4, attack 4, cast 2, hurt 1) | vị trí cầm theo tay, góc vung, kích thước lớn (khung 128) | Cửu Tinh Thất Sát Kiếm, Nguyệt Nhận, Hạo Thiên Chùy, Phá Hồn Thương, Xúc Xích, Thiên Càn Bạch Ngọc Đỉnh, Cửu Bảo Lưu Ly Tháp, Càn Khôn Hỗn Nguyên Tỏa (**8**) |
| **B: chi thể sinh vật** | cánh, đuôi, tai, vuốt, chân nhện, thân rắn / rồng gắn vào người: biến dạng theo nhịp thân | đủ (22 khung) | chi thể phải dính vào điểm gắn ở mọi khung; cánh / đuôi cuộn quanh thân cần mặt nạ tốt hoặc hai tờ | Tà Hỏa Phượng Hoàng, Kim Vũ Miêu Ưng, Băng Phượng Hoàng, U Minh Linh Miêu, Nhu Cốt Thố, Yêu Hồ, Liệt Hỏa Thương Lang, Bạch Hổ, Tử Vong Chu Hoàng, Bích Lân Xà Hoàng, Lam Điện Bá Vương Long (**11**) |
| **C: thực vật / hư ảnh** | cây cỏ, hoa, lửa, bóng, khói: hình mềm, ranh giới mờ, phát sáng | đủ (22 khung) | không có đường viền rõ nên nộm / nền dễ lẫn; mặt nạ theo vùng khó nhất; lắc / bay mềm | Kỳ Nhung Thông Thiên Cúc, Lam Ngân Thảo, A Ngân, Hỏa Long, Hỏa Ảnh, Quỷ Mị (**6**) |

Tổng 8 + 11 + 6 = **25**. Đối chiếu họ `SPIRIT_FAMILY`: A = `weapon` (5) + `float` (3); B = `wing` (3) + `tail` (5) + `limb` (2) + Lam Điện Bá Vương Long (`ghost`); C = `plant` (3) + `ghost` (3: Hỏa Long, Hỏa Ảnh, Quỷ Mị). Lam Điện Bá Vương Long xếp B vì phụ thể có vảy, vuốt, đầu rồng gắn vào tay và lưng; Càn Khôn Hỗn Nguyên Tỏa xếp A (vòng xích cứng, họ `float`).

## Ngoại hình: nguồn duy nhất là `vo-hon-phong-cach.md` phần 4
File này **không mô tả ngoại hình**. Hình, màu, motif, vật đi kèm của từng võ hồn lấy từ **[vo-hon-phong-cach.md](vo-hon-phong-cach.md) phần 4** (bảng thiết kế mới cho 25 võ hồn, #1034), cùng khối prompt phong cách ở phần 6 và luật vẽ ảnh / để code ở phần 3.4. `phuthe-sheet-prompt.mjs` (P1) ghép: mô tả riêng của võ hồn ở phần 4 + phần kỹ thuật của file này (nộm, lưới 5 hướng, nhóm, khung, số clip, quy ước dưới). Khi hai file lệch nhau về hình / màu / motif thì **`vo-hon-phong-cach.md` thắng**; file này không tự chốt ngoại hình song song. `vo-hon-phong-cach.md` đang ở trạng thái đề xuất chờ chủ repo: phụ thể chỉ vẽ sau khi phần 4 được duyệt (P3 trở đi).

Luật của file kia về phần nào vẽ vào ảnh, phần nào do code (hào quang, pháp trận, hư ảnh lớn, glow thuộc code hoặc pháp tướng, không nướng vào sheet) **áp nguyên văn cho sheet `vhanim_{id}`**; file này không thêm hay bớt luật ngoại hình.

### Bảng phần riêng của phụ thể
Chỉ có dữ liệu riêng của phụ thể hoạt ảnh. Cột "Khung" mặc định 96, ghi 128 là ứng viên (quyết định sau P3). "Điểm gắn / mặt nạ" là **gợi ý mặc định cho `lop.json`**, viết trước khi phần 4 chốt: khi ngoại hình ở phần 4 lệch (ví dụ thân rồng dài thay vì đầu rồng gắn vai) thì chỉnh theo phần 4 ở P1 / P3, không ngược lại. Ghi chú clip là gợi ý chuyển động cho nhóm.

| # | Võ hồn (`id`) | Nhóm | Khung | Điểm gắn / mặt nạ (mặc định) | Ghi chú clip |
|---|---|---|---|---|---|
| 1 | Cửu Tinh Thất Sát Kiếm (`cuu_tinh_that_sat_kiem`) | A | 96 | cầm tay phải; kiếm `truoc` khi thấy tay, `sau` khi quay lưng; mũi kiếm chúc chếch xuống khi `idle` | `attack` chém chéo từ vai xuống hông; `cast` giơ kiếm lên ngang đầu, bảy chấm sao lệch pha |
| 2 | Lam Điện Bá Vương Long (`lam_dien_ba_vuong_long`) | B | 96 | tay: `truoc`; đầu rồng + cổ: `sau` (`truoc` khi quay lưng) | `attack`: cẳng tay vươn ra, đầu rồng chồm theo; `cast`: đầu rồng ngửa gầm |
| 3 | Kỳ Nhung Thông Thiên Cúc (`ky_nhung_thong_thien_cuc`) | C | 128 (ứng viên) | đóa hoa: `sau` (`truoc` khi quay lưng, mờ bớt); cánh rời: theo vùng (qua người = `truoc`) | `idle` cánh khép mở nhẹ; `attack` cánh bắn ra xoay; `cast` đóa nở tối đa |
| 4 | Tà Hỏa Phượng Hoàng (`ta_hoa_phuong_hoang`) | B | 96 (thử P3) | cánh + đuôi: `sau` ở `s`/`se`/`e`, `truoc` ở `ne`/`n` | `walk` vỗ theo nhịp bước (6 khung = một chu kỳ vỗ); `cast` dang cánh cao tối đa; `hurt` cánh co lại |
| 5 | U Minh Linh Miêu (`u_minh_linh_mieu`) | B | 96 | tai: `truoc`; đuôi: `sau`; vuốt: `truoc` (theo tay) | `walk` đuôi đưa qua lại; `attack` vuốt cào chéo, đuôi quất |
| 6 | Nguyệt Nhận (`nguyet_nhan`) | A | 96 | cầm **hai tay**; mỗi lưỡi theo tay: `truoc` / `sau` theo thân che | `attack` hai lưỡi cắt chéo nhau; ít pose, góc lưỡi đổi rõ giữa các khung |
| 7 | Hỏa Long (`hoa_long`) | C | 96 | quấn tay + ngực: `truoc`; đuôi sau lưng: `sau`; đầu: `truoc` | `idle` đầu lắc nhẹ; `attack` đầu phóng tới; thân tua lửa lung linh |
| 8 | Nhu Cốt Thố (`nhu_cot_tho`) | B | 96 | tai: `truoc`; đuôi: `sau`; chân: theo bước, `truoc` | `walk` tai đưa theo nhịp nhảy; `attack` chân đá cung tròn |
| 9 | Kim Vũ Miêu Ưng (`kim_vu_mieu_ung`) | B | 96 | cánh: `sau` (`truoc` khi quay lưng); vuốt: `truoc` | `walk` cánh gập vỗ nhẹ; `cast` cánh xòe cao, lông cuốn |
| 10 | Tử Vong Chu Hoàng (`tu_vong_chu_hoang`) | B | 128 (ứng viên) | chân nhện: `sau` (`truoc` khi quay lưng); tơ theo chân | `walk` bốn chân bước luân phiên; `attack` hai chân trước đâm tới |
| 11 | Bích Lân Xà Hoàng (`bich_lan_xa_hoang`) | B | 96 | quấn tay: `truoc`; đầu + cổ: theo vai (qua vai = `truoc`); đuôi: `sau` | `idle` đầu rắn lắc; `attack` đầu mổ ra phía trước; chỗ rắn che tay cần mặt nạ kỹ (có thể cần hai tờ) |
| 12 | Càn Khôn Hỗn Nguyên Tỏa (`can_khon_hon_nguyen_toa`) | A | 96 | xích sau lưng = `sau`, xích qua trước người = `truoc`; ổ khóa `truoc` | `idle` xích đung đưa nhẹ; `cast` ổ khóa quay sáng; ít pose |
| 13 | Hỏa Ảnh (`hoa_anh`) | C | 96 | bóng sau lưng: `sau` (`truoc` khi quay lưng); nắm tay lửa: `truoc` | `walk` bóng trễ nhịp nửa khung; `attack` nắm tay lửa vươn |
| 14 | Yêu Hồ (`yeu_ho`) | B | 96 | tai: `truoc`; đuôi: `sau` (`truoc` khi quay lưng) | `walk` ba đuôi đưa lệch pha; `cast` đuôi xòe tối đa |
| 15 | Xúc Xích (`xuc_xich`) | A | 96 | cây to: cầm tay phải (`truoc`); xúc xích nhỏ: quanh người, theo vùng | `attack` vung như dùi; xúc xích nhỏ nảy pose lệch; giữ chất hài |
| 16 | Quỷ Mị (`quy_mi`) | C | 96 | hư ảnh: `sau` (`truoc` khi quay lưng); khói quanh người: theo vùng | `idle` hư ảnh phập phồng; `walk` bóng nhân đôi lệch 1–2 điểm ảnh; độ trong suốt do code (client) nếu cần |
| 17 | Thiên Càn Bạch Ngọc Đỉnh (`thien_can_bach_ngoc_dinh`) | A | 96 | trên tay: `truoc`; khói theo miệng đỉnh | `idle` đỉnh bồng bềnh lên xuống; `cast` đỉnh nâng cao, miệng nghiêng |
| 18 | Lam Ngân Thảo (`lam_ngan_thao`) | C | 96 (thử P3) | bụi dưới chân: `sau` / `truoc` theo cung quanh chân (cung trên sau, cung dưới trước); dây quấn tay: `truoc` | `idle` lá chao theo gió; `walk` dây cỏ kéo theo bước; `attack` dây quất ra |
| 19 | Hạo Thiên Chùy (`hao_thien_chuy`) | A | 128 (thử P3) | cầm tay phải; búa vác vai = `sau`, vung xuống = `truoc` | `attack` nâng lên nện xuống (pose đổi rõ, ít khung); `walk` búa nảy trên vai |
| 20 | Cửu Bảo Lưu Ly Tháp (`cuu_bao_luu_ly_thap`) | A | 128 (ứng viên) | trên tay: `truoc`; tháp lơ lửng không xoay pose lớn | `idle` tháp bồng bềnh; `cast` tháp nâng và tầng sáng lần lượt (do code) |
| 21 | Phá Hồn Thương (`pha_hon_thuong`) | A | 128 (ứng viên) | cầm tay phải; thương `truoc` khi cầm ngang, `sau` khi quay lưng | `attack` đâm thẳng ra theo hướng; `walk` thương nghiêng chống nhẹ; ít pose |
| 22 | A Ngân (`a_ngan`) | C | 96 | dây quấn tay: `truoc`; vương miện: `truoc`; đóa hoa: `sau` | `idle` đóa hoa lắc, dây nhấp nhô; `attack` dây vàng quất |
| 23 | Liệt Hỏa Thương Lang (`liet_hoa_thuong_lang`) | B | 96 | tai: `truoc`; đuôi: `sau`; vuốt: `truoc` | `walk` đuôi quét; `attack` vuốt cào, tàn lửa nhỏ ở chóp đuôi |
| 24 | Băng Phượng Hoàng (`bang_phuong_hoang`) | B | 96 | cánh + đuôi: `sau` (`truoc` khi quay lưng); mào: `truoc` | `walk` cánh vỗ cứng hơn Tà Hỏa (tinh thể); `hurt` vài tinh thể rung |
| 25 | Bạch Hổ (`bach_ho`) | B | 96 | tai: `truoc`; đuôi: `sau`; vuốt: `truoc` | `walk` đuôi đưa nặng; `attack` vuốt cào xuống |

**Quy ước khi viết prompt** (P1 sinh tự động): nêu rõ "chỉ vẽ phụ thể, không vẽ thân người / mặt / tay chân người; thân người là hình nộm màu phẳng đã đính kèm, giữ nguyên"; "nộm cyan phẳng, không tô, không đổi cỡ, không dịch"; "nền `#FF00FF`"; nêu **nhóm** (A: ít pose, khác thật giữa các khung; B / C: chi thể mềm theo nhịp). Mô tả hình, màu, motif lấy từ phần 4 của `vo-hon-phong-cach.md`. Bài học vẽ hỏng ghi một dòng vào `art/src/phuthe-anim/lessons.md` (cùng cú pháp `beast-anim`), không đặt ở issue.

## Rollout (đề xuất): nhóm B → A → C
Lý do thứ tự: **B trước** vì là nhóm đông nhất (11 / 25), chi thể sinh vật là lợi thế lớn nhất của clip vẽ thật (cánh vỗ, đuôi vẫy khó giả bằng code) và gần với kinh nghiệm hồn thú nhất (dùng lại nguyên cách duyệt); **A sau** vì vật cứng ít pose, ít lợi nên giá trị thấp hơn, nhưng mặt nạ dễ, nhập nhanh, lấp chỗ trống giữa các đợt ảnh; **C cuối** vì hình mềm không viền khó cho cutter (dễ lẫn nộm / nền) và mặt nạ khó nhất, nên làm khi công cụ và bài học đã chín.

| Đợt | Võ hồn | Nhóm | Ghi chú |
|---|---|---|---|
| P3 (thử) | Tà Hỏa Phượng Hoàng, Hạo Thiên Chùy, Lam Ngân Thảo | B, A, C | một mẫu mỗi nhóm; thử khung 128 ở Hạo Thiên Chùy; chủ repo duyệt mẫu; rút bài học |
| P4 đợt 1 | Băng Phượng Hoàng, Kim Vũ Miêu Ưng | B (cánh) | cùng họ với Tà Hỏa nên dùng lại bài học cánh |
| P4 đợt 2 | U Minh Linh Miêu, Yêu Hồ, Liệt Hỏa Thương Lang, Bạch Hổ, Nhu Cốt Thố | B (tai / đuôi / vuốt) | năm võ hồn cùng khuôn tai + đuôi + vuốt |
| P4 đợt 3 | Tử Vong Chu Hoàng, Bích Lân Xà Hoàng, Lam Điện Bá Vương Long | B (khó) | chân nhện, rắn quấn tay, đầu rồng: có thể cần hai tờ; làm sau khi mặt nạ đã chín |
| P4 đợt 4 | Cửu Tinh Thất Sát Kiếm, Nguyệt Nhận, Phá Hồn Thương | A (cầm tay) | vũ khí theo tay, góc vung |
| P4 đợt 5 | Thiên Càn Bạch Ngọc Đỉnh, Cửu Bảo Lưu Ly Tháp, Càn Khôn Hỗn Nguyên Tỏa, Xúc Xích | A (lơ lửng) | vật bồng bềnh quanh người |
| P4 đợt 6 | Kỳ Nhung Thông Thiên Cúc, A Ngân | C (hoa) | cùng họ `plant` với Lam Ngân Thảo |
| P4 đợt 7 | Hỏa Long, Hỏa Ảnh, Quỷ Mị | C (hư ảnh) | ranh giới mềm nhất; làm cuối |

Tổng 3 (P3) + 2 + 5 + 3 + 3 + 4 + 2 + 3 = **25**. Mỗi đợt xong thì nhập từng võ hồn (cắt, xem trước, ghép lên thân thật, `npm run check`) rồi mới sang đợt sau; thấy mặt nạ / neo hỏng ở đợt nào thì sửa công cụ (P1) trước khi tiếp. Số đợt, thứ tự trong nhóm và ứng viên khung 128 đều có thể đổi sau P3; chủ repo duyệt mẫu từng nhóm, phần còn lại orchestrator tự duyệt theo phiếu.

## Công cụ `phuthe-sheet-*` (P1, #1022)
Fork của `beast-sheet-*` (cùng luật: RAW nguyên byte, prompt tự sinh, tối đa 3 lượt mỗi khối; skill `beast-anim`). Không đổi client, server, số cân bằng; sheet đầu ra chưa vào `shared/assets` (P2 nối client, P3 nhập).

| Việc | Lệnh |
|---|---|
| Dựng bảng nộm (ảnh tham chiếu số 1) | `node tools/assets/phuthe-sheet-dummy.mjs --id <võ hồn> --out <thư mục> [--frame 96|128] [--dummy-key #00D0D0]` |
| Prompt + hướng dẫn + bảng nộm | `node tools/assets/phuthe-sheet-prompt.mjs --id <võ hồn> --stage turnaround|direction [--dir s,se,…] --out <thư mục>` (`--all`: 25 võ hồn, nhóm, khung, màu nộm) |
| Bài học (một nguồn) | `art/src/phuthe-anim/lessons.md` (nhóm `@A` / `@B` / `@C`; parser `phuthe-sheet-lessons.mjs`) |
| Kiểm tờ RAW | `npm run phuthe:check -- <võ hồn> [--out <thư mục>]` (tờ ở `art/src/phuthe-anim/<id>/to{A..E}.png`, `turnaround.png`; `--all`) |
| Cắt | `node tools/assets/phuthe-sheet-cut.mjs --id <võ hồn> --sheet A=… --sheet E=… --out <thư mục> [--lop <lop.json>] [--dummy-key …] [--dummy-sex m|f]` |
| Xem trước | `node tools/assets/phuthe-sheet-preview.mjs --id <võ hồn> --dir <thư mục cắt>` (GIF ghép lên thân LPC nam / nữ, trang xoay 5 hướng) |
| Sổ trạng thái | `npm run phuthe:status` (`art/src/phuthe-anim/_status.*`, không commit) |
| Tờ giả để thử | `node tools/assets/phuthe-sheet-fake.mjs --id <võ hồn> --out <thư mục> [--bad]` (không phải ảnh model) |

- **Prompt:** khối STYLE + NEGATIVE chèn **nguyên văn** từ `vo-hon-phong-cach.md` mục 6 (có test); mô tả riêng lấy từ **mục 4 của chính file đó** (giữ tiếng Việt, nhãn dịch sang tiếng Anh, mã màu giữ nguyên) cộng `robe` / `col` trong `VOHON`; phần kỹ thuật từ bảng phần riêng ở trên (nhóm, khung, ghi chú điểm gắn / clip). Dòng "Transparent background" của STYLE bị ghi đè bằng nền #FF00FF. Không dùng ảnh phụ thể cũ làm ảnh dẫn hay nguồn mô tả. Ảnh tham chiếu theo thứ tự cố định: bảng nộm → turnaround đã duyệt → (tùy chọn) một tờ hướng đã qua kiểm.
- **Nộm:** dựng từ lớp thân LPC `m_0` / `f_0` (`lpcparts`), tô một màu khóa phẳng, đặt ở gốc chân của khung phụ thể phóng `256 / khung` trong ô; khung thân theo bảng ánh xạ ở trên (hằng `bodySteps` / `clipFrameAt` trong `phuthe-sheet-lib.mjs` có test đối chiếu bảng này và `LPC_SHEET`; P2 dùng lại). Ô thừa của tờ không có nộm. Tờ vẽ trên nộm **nam**; nửa nữ chỉ dời theo chênh điểm neo `back` (`frameAnchors`) của thân nữ.
- **Cutter:** chuẩn hóa tờ cỡ bất kỳ 3:2 về 1536×1024; khóa nền, trừ nộm (dung sai `--dummy-tol` 40 so với nền 60), **đăng ký nộm từng ô** (tương quan hình bóng với nộm danh nghĩa) để biết model dời nộm bao nhiêu rồi lấy cửa sổ khung 256×256 theo nộm; mảnh vụn nhỏ bỏ, mảnh rời lớn **giữ** (cánh bị thân cắt đôi vẫn là một khung); một bảng màu (mặc định 32) cho cả võ hồn, thu 256 → khung 96 / 128 bằng bỏ phiếu, viền ngoài `#1a1020`. Báo `block` khi khung rỗng (trừ hurt), thiếu tờ, còn điểm ảnh màu nộm trong đầu ra.
- **Sheet đầu ra:** `vhanim_{id}_b.png` (sau thân) và `vhanim_{id}_f.png` (trước thân), mỗi nửa `gameCols × 10` ô: cột theo thứ tự clip (`idle`, `walk`, `attack`, `cast`, `hurt`; B / C 22 cột, A 13 cột), hàng = giới trước hướng sau (`m`: `s, se, e, ne, n` = hàng 0–4; `f`: hàng 5–9). Nửa không có điểm ảnh thì **không ghi** (`blank`). `manifest-entry.json` là mảng một mục cho mỗi nửa không rỗng: `{ key: "vhanim_{id}_b|f", frame: [F, F], iso: true, anim: { group, layer, dirs, sexes, cols, rows: 10, rowsPerSex: 5, anims: { <clip>: { col, n } }, origin: [F/2, F/2 + 26] } }`; P2 có thể đổi dạng khi nối client (ghi ở đây).
- **`lop.json`** (tùy chọn, `art/src/phuthe-anim/<id>/lop.json`, đọc bằng `parseLop`): `{ "huong": { "<hướng>": { "mac_dinh": "sau"|"truoc", "vung": [ { "nhan": "truoc", "hop": [x0, y0, x1, y1] } | { "nhan": "sau", "da_giac": [[x, y], …] } ] } }, "khung": { "e/attack/3": [ vùng… ] } }`. Toạ độ là điểm ảnh **khung phụ thể tính từ gốc chân** (x sang phải, y xuống). Thứ tự: vùng riêng theo khung > vùng của hướng (vùng `sau` thắng `truoc`) > `mac_dinh` của hướng > quy tắc có sẵn: hướng quay lưng (`ne`, `n`) mọi điểm `truoc`; hướng còn lại mỗi **mảnh liền** đè lên nộm (≥ 8 điểm hoặc 5% mảnh, nộm nở 1 điểm) là `truoc` nguyên mảnh, mảnh còn lại `sau`.
- **Kiểm tờ:** tờ hướng phải có đúng 4 dải hàng với 6 / 6 / 6 / 4 hình (nhóm A: 3 / 4 / 4 / 2) vì nộm có trong mọi ô dùng và không có ở ô thừa; hình rời (phụ thể tách khỏi nộm ngang ≥ 4 điểm) tính là hình thừa nên lưới hỏng, phụ thể tách theo chiều dọc mà vẫn cùng dải thì bị `diem-gan` (cách nộm > 12% ô ở khung đứng: chặn B / C, nhẹ A). Các mã: `kich-thuoc`, `nen`, `luoi`, `so-hinh` / `hinh-dinh`, `o-trong`, `nom-mat` (điểm khớp < 0,25 chặn, < 0,5 nhẹ), `nom-lech` (so với trung vị tờ, > 16 nhẹ, > 40 chặn), `khung-rong`, `hurt-rong`, `diem-gan`, `khung-lech`, `khung-chet`, `hurt-idle`, `co-phu-the` (cỡ, chỉ nhẹ). `splitStuckFigures` (PR #1063, tách hình dính theo thung lũng chiếu cột) đã dùng ở `gapLayout` của cutter và ở check (ghi `tach-hinh` mức lưu ý), nên phụ thể vươn sang ô bên một chút không còn làm hỏng lưới; tách không được thì vẫn là lỗi lưới.

### Thử vẽ trực tiếp từ concept: `--no-dummy` (#1024)
Thử nghiệm của chủ repo: bỏ hình nộm, vẽ phụ thể thẳng từ concept võ hồn. `node tools/assets/phuthe-sheet-prompt.mjs --id <võ hồn> --stage turnaround|direction --no-dummy` (mặc định **không** có cờ này, hành vi cũ giữ nguyên):
- Ảnh tham chiếu số 1 là **concept võ hồn đã chốt** (lượt `concept-attemptN.png` lớn nhất trong `art/src/vohon-v2/<id>/`), không còn bảng nộm; các ảnh sau (turnaround, tờ đã qua kiểm) giữ nguyên thứ tự.
- Prompt bỏ đoạn MANNEQUIN, thay bằng yêu cầu giữ **màu, motif, nét và hình dạng của các phần gắn nêu trong brief** (không chép bố cục / giải phẫu toàn thân của concept, không vẽ cả con thú) và vị trí / điểm gắn theo **khuôn lưới ô** như cũ (gốc chân giống nhau ở mọi ô). Bài học: chỉ bỏ các bài thuần về giữ nguyên nộm; bài còn lại (se / ne, "NOT a complete animal companion"…) vẫn chèn, chữ "mannequin" viết lại thành "unseen hero" / gốc chân ô.
- Tài liệu `.md` sinh ra cũng rẽ nhánh: không còn "nộm còn nguyên / bảng nộm", soát bằng "không có thân người, điểm gắn cố định so với gốc chân ô, màu / motif khớp concept".
- Không ghi bảng nộm ra `--out`. Tờ vẫn qua `phuthe:check` / cutter như thường, nhưng các mã dựa vào nộm (`nom-mat`, `nom-lech`, đăng ký nộm của cutter) không có chỗ bám: dùng thử cẩn thận, ghi kết quả vào #1024.

## Việc tiếp
| Việc | Pha | Trạng thái |
|---|---|---|
| Đặc tả + audit + bảng mô tả (file này) | P0 #1021 | xong |
| Công cụ `phuthe-sheet-*` (nộm, prompt, check, cut, preview, status) | P1 #1022 | PR này |
| Client phát clip + neo theo khung thân, fallback, `spiritMotion` hệ số giảm | P2 #1023 | xong (mục "Client phát clip (P2)") |
| Thử 3 võ hồn (Tà Hỏa Phượng Hoàng, Hạo Thiên Chùy, Lam Ngân Thảo) | P3 | mở |
| Rollout 22 võ hồn còn lại theo đợt | P4 | mở |
| Dọn `spiritMotion`, gỡ nhánh cũ khi 25 / 25 | P5 | mở |

Trạng thái từng võ hồn (tờ, mức theo khối hướng, đã nhập game chưa) sau này nằm ở sổ tự sinh giống hồn thú; **không chép bảng trạng thái vào đây**.
