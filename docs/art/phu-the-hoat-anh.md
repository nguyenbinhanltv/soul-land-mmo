# Mỹ thuật: phụ thể võ hồn v2, vẽ mới + hoạt ảnh 5 hướng (P0, #1021, epic #1020)

Phụ thể hiện là ảnh tĩnh 5 hướng ghép theo điểm neo, chuyển động phụ do code (`client/src/spiritMotion.ts`; `nhan-vat-hon-thu.md`, `tools/assets/README.md` mục "Phụ thể võ hồn"). Đường v2 **vẽ mới hoàn toàn** từng phụ thể thành **hoạt ảnh vẽ thật 5 hướng** theo đường đi của hồn thú H4 v2 (`hon-thu-hoat-anh.md`, skill `beast-anim`): tthoadev sinh ảnh bằng ChatGPT / Codex, máy Mac nhập + merge ảnh, máy bàn viết công cụ và code. **Phạm vi file này (P0): đặc tả + audit + bảng mô tả ngoại hình mới; không đổi code, không đổi server, không đổi số cân bằng.** Công cụ `phuthe-sheet-*` là P1, client phát clip + neo là P2, thử 3 võ hồn là P3, rollout P4, dọn `spiritMotion` P5.

**Ảnh phụ thể cũ (`art/src/gemini/phuthe_5huong/…`, `vh_{id}_b/_f`) chỉ để tham khảo ý, KHÔNG dùng làm nguồn hay ảnh tham chiếu** cho prompt, nộm hay tờ mới. Nhận diện võ hồn lấy từ mô tả chữ ở bảng cuối; ảnh mới sinh từ chữ.

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
| `attack` | 6 | 4 | đánh thường | gồng, vung, chạm, thu về; vũ khí / vuốt / đuôi vẽ đúng pha vung của thân (`attack` của thân cũng 6 khung) |
| `cast` | 4 | 2 | thi triển hồn kỹ (thân dùng `spellcast`) | dang / nâng / phình cao hơn `attack`; khung cuối giữ được |
| `hurt` | 2 | 1 | trúng đòn | lùi ngắn theo hướng đang quay + phục hồi; code thêm nháy trắng và lắc |

- **Vật cứng (nhóm A)** ít pose vì không có chi thể uốn: các khung trung gian do `spiritMotion` (xoay / dịch nhẹ quanh `SPIRIT_PIVOT`) nội suy; vẽ ít pose nhưng **pose phải khác thật** (vung kiếm đổi góc, búa nâng lên nện xuống), không sao chép khung.
- Tổng: B / C **22 khung / hướng**, 110 khung / võ hồn; A **13 khung / hướng**, 65 khung / võ hồn. Số khung thật của từng clip ghi ở `anim` trong manifest (client đọc, không đoán).
- `die` và `absorb` không có clip phụ thể (phụ thể ẩn / mờ 60% như hiện nay).

## Hình nộm LPC tham chiếu
Phụ thể không vẽ lơ lửng: người vẽ cần thấy **thân hồn sư** để biết cánh mọc ở đâu, tay cầm ở đâu, phần nào bị thân che. Nên mỗi tờ kèm một **hình nộm** đúng khung thân mà game sẽ hiển thị:

1. **Dựng nộm** (P1, `phuthe-sheet-dummy.mjs`): lấy thân LPC mẫu mỗi giới (`m_0`, `f_0`, như phụ thể cũ), tô **một màu khoá phẳng**, không sáng tối, không viền, đúng khung của clip (`idle` 4, `walk` 6, `attack` 6, `cast` 4, `hurt` 2 theo `LPC_SHEET.anims`, cùng quy tắc ánh xạ khung thân của client) rồi đặt vào **ô của tờ** ở đúng chỗ chân (gốc `(48, 74)` khung 96 hoặc `(64, 90)` khung 128, phóng cùng hệ số với ô vẽ).
2. **Hướng của nộm:** `s` dùng hàng `s`, `n` dùng hàng `n`, **`se`, `e`, `ne` đều dùng hàng `e`** (thân chỉ có 3 hàng). Với `se` / `ne` phụ thể được vẽ chếch 3/4 còn nộm là dáng ngang: yêu cầu duy nhất là **điểm gắn** (lưng, vai, tay, đầu, chân) trùng nộm; không vẽ lại thân cho hợp góc.
3. **Màu khoá nộm** khác nền: nền vẫn `#FF00FF` dung sai 60 như hồn thú; nộm mặc định cyan phẳng `#00D0D0`. Võ hồn có màu chủ đạo gần cyan (Băng Phượng Hoàng, Lam Ngân Thảo, A Ngân, Cửu Bảo Lưu Ly Tháp, Lam Điện Bá Vương Long, Phá Hồn Thương) đổi nộm sang xanh lá `#30D030` hoặc vàng chanh `#D0D000` (`--dummy-key`), ghi màu thật dùng vào `NGUON.md`.
4. **Cutter trừ nộm:** điểm ảnh gần màu khoá trong dung sai (`--dummy-tol`, mặc định nhỏ hơn dung sai nền để không ăn sang phụ thể) bị xoá; viền ngả màu khoá gỡ ba lớp như viền ngả nền. Phần còn lại là phụ thể. Chỗ phụ thể che nộm thì còn nguyên, chỗ nộm che phụ thể thì phụ thể mất (đúng ý: đó là phần bị thân che).
5. **Nộm không vào game:** nộm chỉ có ở ảnh tham chiếu đính kèm và tờ RAW; sheet đầu ra không chứa điểm ảnh nào của nộm (`validate.mjs` kiểm: không còn màu khoá).

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
- **Turnaround trước** (như hồn thú): một ảnh 3:2, 5 cột hướng × 3 hàng (`idle`, `attack` đỉnh, `hurt`) = 15 hình, kèm nộm, để duyệt thiết kế và nét. Chỉ duyệt bằng mắt; làm ảnh mẫu cho 5 tờ.
- **Thứ tự ảnh tham chiếu cố định:** (1) bảng nộm của tờ đó (do P1 dựng); (2) turnaround đã duyệt; (3, tùy chọn) một tờ hướng của chính võ hồn đã qua kiểm không chặn. **Không đính ảnh phụ thể cũ.**
- **Dung sai lưới, nền, cỡ ảnh theo tỉ lệ** (tờ 3:2 một hướng): như `hon-thu-hoat-anh.md` mục "Bố cục tờ ảnh"; đếm hàng và số hình mỗi hàng, không đòi ô đều.
- Công cụ dự kiến (P1): `phuthe-sheet-dummy.mjs` (dựng nộm), `phuthe-sheet-prompt.mjs` (sinh prompt + hướng dẫn tiếng Việt từ bảng cuối), `phuthe-sheet-check.mjs` (kiểm tờ RAW), `phuthe-sheet-cut.mjs` (trừ nộm, mặt nạ, căn neo, ghi sheet), `phuthe-sheet-preview.mjs` (xem trước), tái dùng `beast-sheet-grid.mjs`. **Prompt tự sinh, không viết tay** (cùng luật `beast-anim`).

## Khung 96 / 128 và neo theo khung thân
- **Khung vuông 96** mặc định: khung thân mở rộng 16 mỗi phía, gốc `(48, 74)` như sheet phụ thể hiện tại, nên bóng, vòng hồn hoàn và lớp ghép không đổi. **Khung 128** cho vật lớn / cánh sải rộng (thân vẫn 64, mở rộng 32 mỗi phía): gốc `(64, 90)` (cùng khoảng cách gót tới mép dưới 22 điểm như khung 96, gốc dời 16 ngang và 16 dọc). Mỗi võ hồn chọn **một** khung cho cả sheet, ghi trong manifest (`frame`). Ứng viên 128: Hạo Thiên Chùy (thử ở P3), Cửu Bảo Lưu Ly Tháp, Phá Hồn Thương, Kỳ Nhung Thông Thiên Cúc, Tử Vong Chu Hoàng; quyết định theo kết quả P3 và đo FPS (sheet 128 lớn gấp 1,78 lần diện tích).
- **Kích thước sheet game:** mỗi giới một nửa như hiện tại (`ISO_VH_SEXES`, ghép theo `m_0` / `f_0`; client chọn nửa theo giới `vohonHalf`), 22 cột × (5 hướng × 2 giới) hàng: khung 96 → 2112 × 960, khung 128 → 2816 × 1280, dưới giới hạn texture 4096. Vật cứng (13 cột) nhỏ hơn. Hai giới dùng **chung ảnh vẽ** (một nộm, một tờ); cutter chỉ dời **neo** theo từng giới (`frameAnchors`), nên **không vẽ hai lần**.
- **Neo theo khung thân:** mỗi khung clip ứng với một khung thân (cột, hàng); client đặt phụ thể theo **cùng (hàng thân, cột)** như áo / tóc (`nhan-vat-hon-thu.md`, `LPC_SHEET.anims`). Tức clip `walk` 6 khung chạy cùng nhịp với `walk` của thân; không có animation riêng cho phụ thể (cùng cách `syncLayers` hiện làm).
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

## Tiêu chí duyệt: chặn / nhẹ / đẹp (theo khối hướng)
Duyệt theo **khối hướng** (`s`, `se`, `e`, `ne`, `n`), như hồn thú. Khác hồn thú: thân hồn sư luôn có đủ hướng nên **một võ hồn có khối chặn thì không nhập cả võ hồn** (vẽ lại **chỉ khối chặn**, tối đa 3 lượt); quá lượt thì võ hồn giữ nhánh cũ (xem "Fallback").

| Loại | Tiêu chí |
|---|---|
| **Chặn** | cỡ ảnh ngoài tập hợp lệ; nền không tách được; **còn điểm ảnh nộm** sau cutter (nộm lẫn vào phụ thể, hoặc mất cả phụ thể vì trùng màu khoá); thiếu khung / hình dính / không dò được hàng; **điểm gắn trôi** (cánh / vũ khí không dính vào nộm ở khung đứng, hoặc lệch quá ngưỡng neo giữa các khung của clip); sai nhận diện võ hồn so với bảng mô tả; **vẽ lại thân hoặc vẽ khuôn mặt, tay chân người** thay vì chỉ phụ thể; nộm bị vẽ thêm mặt ở `n` / `ne`; khung rỗng ở clip không phải `hurt`; cỡ phụ thể lệch quá ±25% so với khung `s` cùng clip |
| **Nhẹ** | `hurt` biên độ nhỏ; mặt nạ cần vá vài vùng (`lop.json` chỉnh tay); vài khung vượt ô nhưng cắt được; cỡ lệch 10–25%; nền gradient, cỡ ảnh theo tỉ lệ khác 1536×1024 (đã chuẩn hóa); pose vật cứng hơi giống nhau giữa các khung |
| **Đạt đẹp** | `idle` / `walk` lặp mượt, `attack` vung đúng pha thân, `cast` rõ hơn `attack`, hai nửa sau / trước ghép khít không thấy đường cắt, `se` khác `e`, `ne` khác `e` |

- **Kiểm bằng code (P1):** cỡ, nền, lưới, màu nộm còn sót, neo lệch, khung rỗng, cỡ so với `s`; ngưỡng ở đầu `phuthe-sheet-check.mjs`, đo trên các tờ thử rồi chỉnh.
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

## Bảng mô tả ngoại hình MỚI (để làm prompt)
**Chữ, vẽ mới, không bám ảnh cũ.** Giữ đúng **nhận diện** đã chốt (tên, màu `col` / `robe` ở `VOHON`, dạng phụ thể ở `docs/art/phap-tuong.md` (bảng 4.1) và bảng `tools/assets/README.md`) nhưng **thiết kế lại hình**: nhỏ gọn đủ vừa khung 96 (hoặc 128 nếu ghi), phối **bảng màu ≤ 24 màu** trong họ màu `col` / `robe` + `#1a1020` viền. Mọi hình đều là **phụ thể gắn trên người**, không phải sinh vật hay vật đứng riêng; **không** mắt phát sáng, không hào quang, không bóng, không hiệu ứng nền (client / chiêu vẽ). Cột "Mặt nạ" là gợi ý mặc định cho `lop.json` (hướng `s` / `se` / `e`; quay lưng `ne` / `n` đổi sau ↔ trước như đã nêu). Mô tả viết cho **người** vẽ prompt tiếng Anh; công cụ sinh prompt (P1) dịch theo khuôn.

| # | Võ hồn (`id`) | Nhóm | Khung | Ngoại hình mới (chữ để làm prompt) | Điểm gắn / mặt nạ | Ghi chú clip |
|---|---|---|---|---|---|---|
| 1 | Cửu Tinh Thất Sát Kiếm (`cuu_tinh_that_sat_kiem`) | A | 96 | Trường kiếm hai lưỡi dài chừng một cánh tay rưỡi, thân bạc lạnh, sống kiếm khắc **bảy chấm sao** thẳng hàng (chấm sáng nhạt hơn thân), chuôi quấn dây xanh thẫm, đốc hình cánh chim thu hẹp | cầm tay phải; kiếm `truoc` khi thấy tay, `sau` khi quay lưng; mũi kiếm chúc chếch xuống khi `idle` | `attack` chém chéo từ vai xuống hông; `cast` giơ kiếm lên ngang đầu, bảy chấm sao lệch pha |
| 2 | Lam Điện Bá Vương Long (`lam_dien_ba_vuong_long`) | B | 96 | **Giáp vảy rồng** lam đậm phủ hai cẳng tay đến khuỷu, vảy nhọn dạng ngói chồng, năm móng vuốt dài ở mỗi bàn tay; sau lưng nhô lên **một đầu rồng ngẩng** (sừng chẻ đôi, bờm gai ngược) nối bằng cổ vảy thấp; vài gân điện hình chữ chi chạy trên vảy | tay: `truoc`; đầu rồng + cổ: `sau` (`truoc` khi quay lưng) | `attack`: cẳng tay vươn ra, đầu rồng chồm theo; `cast`: đầu rồng ngửa gầm |
| 3 | Kỳ Nhung Thông Thiên Cúc (`ky_nhung_thong_thien_cuc`) | C | 128 (ứng viên) | **Một đóa cúc lớn** nở làm vầng sau lưng: nhiều lớp cánh dài mảnh vàng cam, nhụy tròn nâu đỏ ở tâm; vài cánh rời **xoay quanh người** thành vòng mỏng; cuống ngắn xanh sẫm nối vào giữa lưng | đóa hoa: `sau` (`truoc` khi quay lưng, mờ bớt); cánh rời: theo vùng (qua người = `truoc`) | `idle` cánh khép mở nhẹ; `attack` cánh bắn ra xoay; `cast` đóa nở tối đa |
| 4 | Tà Hỏa Phượng Hoàng (`ta_hoa_phuong_hoang`) | B | 96 (thử P3) | **Đôi cánh phượng** sải rộng quá vai, lông vũ xếp tầng đỏ cam, mép cánh bốc chữ chi lửa nhỏ; ba lông đuôi lửa dài rủ xuống sau lưng; không có đầu phượng | cánh + đuôi: `sau` ở `s`/`se`/`e`, `truoc` ở `ne`/`n` | `walk` vỗ theo nhịp bước (6 khung = một chu kỳ vỗ); `cast` dang cánh cao tối đa; `hurt` cánh co lại |
| 5 | U Minh Linh Miêu (`u_minh_linh_mieu`) | B | 96 | **Tai mèo** tím nhọn dựng trên đỉnh đầu (mặt trong sẫm), **đuôi mèo** dài vắt cong sau lưng chóp nhạt, **móng vuốt** cong ba ngón nối dài ở mỗi bàn tay; không hư ảnh báo | tai: `truoc`; đuôi: `sau`; vuốt: `truoc` (theo tay) | `walk` đuôi đưa qua lại; `attack` vuốt cào chéo, đuôi quất |
| 6 | Nguyệt Nhận (`nguyet_nhan`) | A | 96 | **Hai lưỡi trăng khuyết** bạc, mỗi lưỡi một đầu nhọn cong, lưng lưỡi dày, cầm bằng chuôi ngắn bọc vải xám tím; cầm ngược lưỡi hướng ra ngoài | cầm **hai tay**; mỗi lưỡi theo tay: `truoc` / `sau` theo thân che | `attack` hai lưỡi cắt chéo nhau; ít pose, góc lưỡi đổi rõ giữa các khung |
| 7 | Hỏa Long (`hoa_long`) | C | 96 | **Thân rồng lửa nhỏ** uốn quấn một vòng quanh cẳng tay rồi vắt chéo qua ngực ra sau lưng; đầu rồng đỏ có hai sừng cong ngóc trên vai; thân là dải lửa đỏ cam có vảy cháy và mép lửa tua | quấn tay + ngực: `truoc`; đuôi sau lưng: `sau`; đầu: `truoc` | `idle` đầu lắc nhẹ; `attack` đầu phóng tới; thân tua lửa lung linh |
| 8 | Nhu Cốt Thố (`nhu_cot_tho`) | B | 96 | **Tai thỏ** dài hồng nhạt dựng cao (một tai gập nhẹ), **đuôi bông** tròn trắng hồng sau thắt lưng, **bàn chân** thỏ lớn phủ lông ở dưới cổ chân | tai: `truoc`; đuôi: `sau`; chân: theo bước, `truoc` | `walk` tai đưa theo nhịp nhảy; `attack` chân đá cung tròn |
| 9 | Kim Vũ Miêu Ưng (`kim_vu_mieu_ung`) | B | 96 | **Đôi cánh lông vàng kim** gọn, lông chủ dài xếp quạt, mép cánh có vài lông xoăn như tai cú, đầu cánh vuốt cong; **vuốt ưng** vàng đậm ở cả hai bàn tay; vài sợi sét vàng nhỏ ở đầu lông | cánh: `sau` (`truoc` khi quay lưng); vuốt: `truoc` | `walk` cánh gập vỗ nhẹ; `cast` cánh xòe cao, lông cuốn |
| 10 | Tử Vong Chu Hoàng (`tu_vong_chu_hoang`) | B | 128 (ứng viên) | **Bốn chân nhện** dài tím đen mọc từ sau vai, mỗi chân hai đốt nhọn chống chếch hai bên, đầu chân có móc; đốt chân có đốm tím nhạt; một vài **sợi tơ** mảnh buông | chân nhện: `sau` (`truoc` khi quay lưng); tơ theo chân | `walk` bốn chân bước luân phiên; `attack` hai chân trước đâm tới |
| 11 | Bích Lân Xà Hoàng (`bich_lan_xa_hoang`) | B | 96 | **Rắn lục biếc** quấn xoắn hai vòng quanh cẳng tay (thân vảy hình thoi sáng tối), **đầu rắn** ngóc trên vai (mào nhỏ, lưỡi đỏ nhỏ, hàm hé), đuôi rủ xuống cạnh hông | quấn tay: `truoc`; đầu + cổ: theo vai (qua vai = `truoc`); đuôi: `sau` | `idle` đầu rắn lắc; `attack` đầu mổ ra phía trước; chỗ rắn che tay cần mặt nạ kỹ (có thể cần hai tờ) |
| 12 | Càn Khôn Hỗn Nguyên Tỏa (`can_khon_hon_nguyen_toa`) | A | 96 | **Vòng xích vàng** cứng gồm mắt xích lục giác, treo **một ổ khóa tròn** khắc phù văn ở trước ngực; xích **lơ lửng quanh người** như quỹ đạo nghiêng, không chạm đất | xích sau lưng = `sau`, xích qua trước người = `truoc`; ổ khóa `truoc` | `idle` xích đung đưa nhẹ; `cast` ổ khóa quay sáng; ít pose |
| 13 | Hỏa Ảnh (`hoa_anh`) | C | 96 | **Bóng lửa hình người** đỏ thẫm đứng sát sau lưng, vai rộng hơn hồn sư một chút, không rõ chân (chìm vào lửa), **hai nắm tay bọc lửa** ở hai tay hồn sư; viền ngoài bóng tua lửa | bóng sau lưng: `sau` (`truoc` khi quay lưng); nắm tay lửa: `truoc` | `walk` bóng trễ nhịp nửa khung; `attack` nắm tay lửa vươn |
| 14 | Yêu Hồ (`yeu_ho`) | B | 96 | **Tai cáo** nhọn hồng (mặt trong trắng), **ba đuôi cáo** to xòe quạt sau lưng (chóp trắng, lông xù), vài **đốm sáng giọt nước** hồng nhỏ vẽ trong khung (không phát sáng nền) | tai: `truoc`; đuôi: `sau` (`truoc` khi quay lưng) | `walk` ba đuôi đưa lệch pha; `cast` đuôi xòe tối đa |
| 15 | Xúc Xích (`xuc_xich`) | A | 96 | **Một cây xúc xích nướng to** vàng nâu, vạch cháy xéo, que gỗ xuyên giữa, cầm tay như dùi cui; **hai ba xúc xích nhỏ** quanh người ở các độ cao khác nhau; vài giọt mỡ bóng, nét hài hước | cây to: cầm tay phải (`truoc`); xúc xích nhỏ: quanh người, theo vùng | `attack` vung như dùi; xúc xích nhỏ nảy pose lệch; giữ chất hài |
| 16 | Quỷ Mị (`quy_mi`) | C | 96 | **Hư ảnh quỷ** tím xanh bán trong suốt sau lưng, phần thân dưới tan thành khói, **hai tay dài** như dải bóng buông xuống hai bên, mặt quỷ mờ có hai hốc mắt tối; vài vệt khói tím đen bao quanh người | hư ảnh: `sau` (`truoc` khi quay lưng); khói quanh người: theo vùng | `idle` hư ảnh phập phồng; `walk` bóng nhân đôi lệch 1–2 điểm ảnh; độ trong suốt do code (client) nếu cần |
| 17 | Thiên Càn Bạch Ngọc Đỉnh (`thien_can_bach_ngoc_dinh`) | A | 96 | **Đỉnh ba chân** bạch ngọc nhỏ lơ lửng **trên lòng bàn tay trái**, thân đỉnh phình, hai quai tai đỉnh, miệng đỉnh nghiêng nhẹ về hồn sư, vân mây khắc chìm; **một sợi khói ngọc** mảnh bốc từ miệng | trên tay: `truoc`; khói theo miệng đỉnh | `idle` đỉnh bồng bềnh lên xuống; `cast` đỉnh nâng cao, miệng nghiêng |
| 18 | Lam Ngân Thảo (`lam_ngan_thao`) | C | 96 (thử P3) | **Bụi cỏ lam** mọc quanh chân (lá dài xanh lam nhạt, đầu lá cong), **nhiều dây leo** xanh lam dài bò lên cẳng tay và rủ xuống hai bên; đốm sáng xanh li ti vẽ như hạt phấn nhỏ | bụi dưới chân: `sau` / `truoc` theo cung quanh chân (cung trên sau, cung dưới trước); dây quấn tay: `truoc` | `idle` lá chao theo gió; `walk` dây cỏ kéo theo bước; `attack` dây quất ra |
| 19 | Hạo Thiên Chùy (`hao_thien_chuy`) | A | 128 (thử P3) | **Búa lớn** đen sắt, **đầu búa** hình khối chữ nhật bo góc to gần bằng cả thân hồn sư, mặt đầu búa có vân xám bạc chạy ngang, **cán dài** quấn dây da, đầu cán có vòng gân; vác trên vai khi `idle` | cầm tay phải; búa vác vai = `sau`, vung xuống = `truoc` | `attack` nâng lên nện xuống (pose đổi rõ, ít khung); `walk` búa nảy trên vai |
| 20 | Cửu Bảo Lưu Ly Tháp (`cuu_bao_luu_ly_thap`) | A | 128 (ứng viên) | **Tháp chín tầng** lưu ly nhỏ lơ lửng **trên tay**, mỗi tầng một màu nhạt (lục, lam, tím… trong họ `col` / `robe`), mái cong từng tầng, đỉnh nhọn có ngọc | trên tay: `truoc`; tháp lơ lửng không xoay pose lớn | `idle` tháp bồng bềnh; `cast` tháp nâng và tầng sáng lần lượt (do code) |
| 21 | Phá Hồn Thương (`pha_hon_thuong`) | A | 128 (ứng viên) | **Trường thương** cán dài hơn hồn sư, mũi **hình thoi** xanh ngọc có sống nổi, **tua đỏ** dưới mũi, cán sẫm quấn đai vàng nhạt, đuôi thương có đầu nhọn bọc đồng | cầm tay phải; thương `truoc` khi cầm ngang, `sau` khi quay lưng | `attack` đâm thẳng ra theo hướng; `walk` thương nghiêng chống nhẹ; ít pose |
| 22 | A Ngân (`a_ngan`) | C | 96 | **Dây Lam Ngân vân vàng** quấn hai tay, **vương miện cỏ** nhỏ trên đầu, **đóa Lam Ngân Hoàng** xanh vàng nở sau lưng trên cuống mảnh; dây vàng buông xuống hông | dây quấn tay: `truoc`; vương miện: `truoc`; đóa hoa: `sau` | `idle` đóa hoa lắc, dây nhấp nhô; `attack` dây vàng quất |
| 23 | Liệt Hỏa Thương Lang (`liet_hoa_thuong_lang`) | B | 96 | **Tai sói** xám dựng, viền lông, **đuôi sói** to xù chóp lửa cam, **vuốt sói** xám đậm dài ở hai tay; lông cổ gọn | tai: `truoc`; đuôi: `sau`; vuốt: `truoc` | `walk` đuôi quét; `attack` vuốt cào, tàn lửa nhỏ ở chóp đuôi |
| 24 | Băng Phượng Hoàng (`bang_phuong_hoang`) | B | 96 | **Đôi cánh băng** gồm các tinh thể dài xếp lớp (lam nhạt đến trắng), mép cánh răng cưa như pha lê; **mào băng** ba mũi nhọn trên đầu; đuôi dải băng mảnh dài rủ sau lưng | cánh + đuôi: `sau` (`truoc` khi quay lưng); mào: `truoc` | `walk` cánh vỗ cứng hơn Tà Hỏa (tinh thể); `hurt` vài tinh thể rung |
| 25 | Bạch Hổ (`bach_ho`) | B | 96 | **Tai hổ** tròn trắng viền đen, **đuôi hổ** dày vằn đen vắt cong sau lưng, **vuốt hổ** trắng vằn đen, ba ngón vuốt dài ở mỗi bàn tay; vằn đen thành mảng sắc nét | tai: `truoc`; đuôi: `sau`; vuốt: `truoc` | `walk` đuôi đưa nặng; `attack` vuốt cào xuống |

**Quy ước khi viết prompt** (P1 sinh tự động từ bảng này): nêu rõ "chỉ vẽ phụ thể, không vẽ thân người / mặt / tay chân người; thân người là hình nộm màu phẳng đã đính kèm, giữ nguyên"; "nộm cyan phẳng, không tô, không đổi cỡ, không dịch"; "nền `#FF00FF`"; nêu họ màu `col` / `robe`; nêu **nhóm** (A: ít pose, khác thật giữa các khung; B / C: chi thể mềm theo nhịp). Bài học vẽ hỏng ghi một dòng vào `art/src/phuthe-anim/lessons.md` (cùng cú pháp `beast-anim`), không đặt ở issue.

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

## Việc tiếp
| Việc | Pha | Trạng thái |
|---|---|---|
| Đặc tả + audit + bảng mô tả (file này) | P0 #1021 | PR này |
| Công cụ `phuthe-sheet-*` (nộm, prompt, check, cut, preview) | P1 | mở |
| Client phát clip + neo theo khung thân, fallback, `spiritMotion` hệ số giảm | P2 | mở |
| Thử 3 võ hồn (Tà Hỏa Phượng Hoàng, Hạo Thiên Chùy, Lam Ngân Thảo) | P3 | mở |
| Rollout 22 võ hồn còn lại theo đợt | P4 | mở |
| Dọn `spiritMotion`, gỡ nhánh cũ khi 25 / 25 | P5 | mở |

Trạng thái từng võ hồn (tờ, mức theo khối hướng, đã nhập game chưa) sau này nằm ở sổ tự sinh giống hồn thú; **không chép bảng trạng thái vào đây**.
