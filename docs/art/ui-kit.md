# UI gốc (kit Mực + Giấy): luật chất liệu, token, luật vẽ AI

Style guide của giao diện HTML (HUD, bảng, hộp thoại). **UI gốc** là giao diện duy nhất của game (chủ repo chốt 2026-10-26 ở #877, UI mặc định từ 29/10): **hai chất liệu có luật** (Mực, Giấy); chỉ PC (Q40); vùng bấm 44 px cho nút hành động chính; kit **2×** (mục "Kit 1× hay 2×"); phông Galmuri 10 / 12 / 24; icon hybrid. Luật nằm ở đây, **không** nằm trong issue: issue chỉ chứa việc. Theo dõi: #877, #885, #886.

Liên quan: `docs/design/giao-dien.md` (bố cục, hành vi bảng), skill `client-ui` (cách code), `docs/art/nguon-giay-phep.md` (nguồn / giấy phép ảnh).

## Hai chất liệu

| | **Mực** | **Giấy** |
|---|---|---|
| Là gì | nền tối (mực nho / gỗ đen), viền đồng nhạt, lót vân mực | giấy dó ngà, viền son mảnh, gỗ trục |
| Dùng cho | **mọi bảng thao tác**: HUD, hotbar, Nhân vật, Túi, Đội hình, Cộng minh, Bạn bè, Tự động, Cài đặt, bản đồ, tooltip, toast thường | **nội dung đọc**: hội thoại NPC, cửa hàng, thợ rèn, nhiệm vụ, hướng dẫn, thư, đăng nhập |
| Chữ | giấy ngà trên nền tối (`--ink-text`, `--plate-text`) | mực trên giấy (`--text`, `--muted`) |
| Nền chung | `--bg`, `--ink-panel`, `--plate`, `--track` | `--paper`, `--paper2`, `--panel` |

Luật dùng:
1. Một màn một chất liệu chính. Không đặt bảng Giấy cạnh bảng Mực cùng vai trò. Ngoại lệ có chủ đích: hộp thoại / hướng dẫn (Giấy) nổi trên HUD (Mực).
2. **Dùng chung** hai chất liệu: bộ góc, độ dày viền, bảng màu, đồng nhạt. Khác nhau chỉ ở nền và màu chữ.
3. Vật liệu phụ: **ngọc** (`--accent`, `--good`) cho trạng thái tốt / đang bật; **vàng** (`--xp`, chữ trên giấy `--xp-t`) cho kinh nghiệm / tiền; **son** (`--son*`) cho hành động chính và cảnh báo. Mỗi vật liệu chỉ một vai trò.
4. **Độ hiếm / niên hạn không chỉ bằng màu**: `--tier-N` (do `uiArt.ts` đặt từ `TIERS`, không chép số) đi cùng dạng góc hoặc dấu. Trạng thái cũng vậy (mục "Trạng thái").
5. Giữ nguyên làm chuẩn tham chiếu: thẻ võ hồn (`cards.ts`), logo / nền đăng nhập C6, con trỏ C12, vòng radar, 7 mảnh C2 đã duyệt (#811, "ĐẠT"): C2 là chuẩn của **Mực**, `ui_hop_thoai` / `ui_cuon_giay` là chuẩn tạm của **Giấy** tới khi có kit mới.

## Bảng vai trò → chất liệu

| Thành phần | Chất liệu | Ghi chú |
|---|---|---|
| HUD trái (chỉ số, menu), radar, chip lệnh, hotbar, đội hình dưới | Mực | luôn hiện, cạnh thế giới sáng → cần nền tối |
| Nhân vật, Túi, Đội hình (V), Cộng minh (K), Bạn bè (L), Tự động, Cài đặt, Thế giới (M), bản đồ khu vực (N) | Mực | bảng thao tác; ô vật phẩm tối đã có |
| Hộp thoại NPC + chân dung, Cửa hàng, Thợ rèn (trừ ba trang đã dùng C2) | Giấy | nội dung đọc; mua / bán là nút son |
| Hộp nhiệm vụ, hướng dẫn lần đầu, thẻ gợi ý | Giấy | |
| Toast thường (log) | Mực mảnh | |
| Toast lên cấp / hồn hoàn hiếm | khung C2 (giữ) | |
| Thẻ võ hồn | giữ nguyên (`cards.ts`) | |
| Đăng nhập / thẻ vào bản đồ | Giấy + khung vàng hiện tại | đã đạt, chỉ sửa nút |
| Tooltip | Mực | |

Chuyển từng màn theo thứ tự ở #877 (HUD + hotbar → Nhân vật + Túi → Đội hình / Cộng minh / Bạn bè → Tự động / Cài đặt → NPC / Cửa hàng / Thợ rèn → chat / toast / tooltip → bản đồ → đăng nhập). Màn nào chưa chuyển thì **không đổi chất liệu lẻ**.

## Token màu theo vai trò

Một danh sách duy nhất, khai ở `:root` của `client/src/style.css`. Màu ngoài danh sách (mã `#hex` / `rgba()` viết thẳng trong luật CSS) là nợ: P0 chỉ **đếm** (`npm run ui:inventory`), P8 (#886) mới chặn.

| Vai trò | Token hiện có | Ghi chú |
|---|---|---|
| nền toàn game | `--bg` | |
| mặt Mực | `--ink-panel` (mờ), `--plate` (đặc), `--track` (nền thanh / ô chìm) | chữ trên `--track`: 9,3 : 1 |
| mặt Giấy | `--paper`, `--paper2`, `--paper3`, `--panel` | |
| mực chữ / viền Giấy | `--ink`, `--ink2`, `--inkl`, `--text`, `--muted`, `--line`, `--line2` | `--muted` trên giấy đạt ≥ 4,5 : 1 |
| chữ trên Mực | `--ink-text`, `--plate-text` | |
| hành động chính, cảnh báo nặng | `--son`, `--son-d`, `--son-l`, `--bad` | |
| tốt / bật | `--accent`, `--good` | |
| cảnh báo | `--warn` | |
| sinh lực / hồn lực / kinh nghiệm | `--hp`, `--mp`, `--xp`, `--xp-t` | `--xp` chỉ cho thanh / viền, chữ dùng `--xp-t` |
| độ hiếm / niên hạn | `--tier-N`, `--tier-N-glow`, `--rare-N` | từ `TIERS`, không chép số |
| viền chữ | `--stroke` | |

Đề xuất thêm khi kit mẫu được duyệt (#883, **cần chủ repo duyệt**): đồng nhạt cho viền Mực (gợi ý `#b08a4a`), `--surface-ink-raised` cho ô nổi trên nền Mực, `--info` (hiện dùng lẻ `#5aa8c0`, `#8ec5ff`). Mỗi màu lẻ trong CSS cũ khi gặp thì thay bằng token gần nhất, **không** thêm màu mới ngoài bảng.

Tương phản chữ ≥ 4,5 : 1 (chữ thân), ≥ 3 : 1 (chữ ≥ 24 px, biểu tượng). Bảng đo cũ: báo cáo U0 #753.

## Thang chữ theo vai trò

Phông Galmuri, chỉ ba cỡ (bội của lưới font): **10 / 12 / 24** (`--fs-s` / `--fs-m` / `--fs-l`).

| Vai trò | Cỡ | Quy tắc |
|---|---|---|
| title | 24 (`--fs-l`) | tiêu đề bảng / màn; dùng với vạch bút (`ui_vach_but`) |
| heading | 12 (`--fs-m`) | tiêu đề nhóm; phân cấp bằng màu + vạch mực, **không** chữ đậm (Galmuri không có chữ Việt đậm) |
| body | 12 | nội dung, nút |
| meta | 10 (`--fs-s`) | nhãn phụ, phím tắt, số nhỏ; **không** dùng cho đoạn văn |

- Không dùng 11 / 13 / 14 / 16 / 18 px (hiện còn rải rác, xem báo cáo `ui:inventory`).
- **Đoạn giải thích > 2 dòng** không nằm ở đáy bảng: chuyển vào tooltip hoặc nút "?" (lỗi hiện tại: Nhân vật / Túi / Tự động).
- Không đặt chữ trong ảnh (xem luật vẽ). Chữ Việt đủ dấu: chiều cao nút dư chỗ cho dấu (đệm trên ≥ 2 px ở 12 px); nhãn dài ("Hồn hoàn", "Cộng minh") kiểm ở bề rộng nhỏ nhất.
- Landing (`/`) dùng phông riêng (skill `landing-page`), không thuộc luật này.

## Lưới, khoảng cách, vùng bấm

- Đơn vị cơ sở 4 px (`--sp-1…6`), viền `--bd` 2 px / `--bd-fine` 1 px, ô vật phẩm / kỹ năng `--cell` 44 px.
- Vùng bấm: **44 px cho nút hành động chính** (Vào game, Bật tự động, Tiếp, Mua…); **32 px** cho phần tử dày đặc (chip lọc, tab, nút nhỏ trong bảng); ô túi 44 px giữ.
- Giao diện phóng bằng `--u` (zoom CSS, `uiArt.ts`). Tự động theo bậc (#887): 1366 → 1×; 1600–1919 → 1,25×; 1920–2559 → 1,5×; 2560+ → 2× (`AUTO_TIERS`, theo min(rộng / 1280, cao / 600)); Cài đặt cho chọn tay 75–200%.

## Trạng thái bắt buộc cho mọi điều khiển

*thường, hover, nhấn, chọn, tắt (disabled), focus-visible, lỗi.* Biểu thị bằng **hình + sáng tối + dấu**, không chỉ màu (hồn kỹ khóa / sẵn sàng hiện gần giống nhau: lỗi cần sửa ở kit). Nút có 4 ảnh khung (`ui_nut_thuong` / `_ro` / `_nhan` / `_tat`) dùng chung một vạch cắt.

## Quy tắc 9-slice (bài học của lỗi nút Google / Đổi tài khoản)

1. **Vạch cắt đo từ ảnh**, không đoán: mép gỗ của `ui_nut_*` dày 7 px (điểm ảnh chuyển màu tính vào mép), manifest ghi 6 nên cột chuyển màu rơi vào phần giữa và bị kéo giãn thành hai dải nâu rộng bên ruột giấy. Sửa: `nine: 7` (`shared/assets/sprites/manifest.json`). Các ảnh có hai mép bằng nhau (kit sau này do công cụ dựng gương) thì vạch bằng nhau.
2. `border-image-width` = vạch cắt / hệ số kit (1 hoặc 2); `border-width` là chỗ chừa cho nội dung, **không** quyết định ảnh.
3. Luôn `image-rendering: pixelated` cho phần tử có `border-image` (mục sau).
4. Cạnh khung là dải phẳng 1–2 sắc để kéo giãn không lộ; phần giữa đồng nhất.
5. Mỗi `border-image` mới đi qua token `--frame-*`, không tự đặt `slice` rải rác (hiện 23 chỗ, P5 gom).

## Kit 1× hay 2×: kết quả thử nghiệm

Thử bằng `tools/ui-border-image-probe.mjs` (mảnh C2 `ui_nv6_nen_bup_be`, 240×192, vạch cắt 16; Chrome 156 và Edge 156 cho **kết quả giống hệt từng ô**; **Firefox chưa cài trên máy đo nên chưa kiểm**). Đo góc trên-trái của khung vẽ ra so với ảnh nguồn phóng nearest-neighbour đúng tỉ lệ ("khớp") và đếm màu ngoài bảng màu mảnh (nội suy làm mờ → màu lạ). Ba bậc zoom CSS (1, 1,5, 2) × DPR 1 và 2 × kit 1× (`border-image-width` = vạch) và 2× (= vạch / 2) × `image-rendering` auto / pixelated / crisp-edges.

| Điều kiện (điểm thiết bị cho mỗi điểm ảnh kit) | `auto` | `pixelated` |
|---|---|---|
| tỉ lệ nguyên ≥ 1 (1, 2, 3, 4) | chỉ đúng khi đúng 1; từ 2 trở lên **nhòe** (hàng trăm màu lạ, khớp 3–4%) | **khớp 100%**, 0 màu lạ |
| tỉ lệ 1,5 (zoom 1,5 ở DPR 1; hoặc kit 2× ở DPR 2 + zoom 1,5) | nhòe (khớp 4,5%, 307 màu lạ) | lệch 1 điểm ở một số hàng / cột (khớp 95,5%), **vẫn trong bảng màu** |
| kit 2× ở DPR 1, zoom 1 (tỉ lệ 0,5) | **nhòe** (36 màu lạ, 0% khớp) | trong bảng màu nhưng chỉ khớp 58%: bỏ xen kẽ điểm ảnh, mất chi tiết 1 px |
| kit 2× ở DPR 1, zoom 2 hoặc ở DPR 2, zoom 1 (tỉ lệ 1) | khớp 100% | khớp 100% |

Kết luận đo được:
- **`image-rendering: pixelated` có tác dụng với `border-image`** ở Chrome / Edge (kiểm Firefox ở P1 trước khi coi là luật cuối). `crisp-edges` kém hơn (có ô 94% khớp, 7 màu lạ): **không dùng**. Không dùng `auto` cho ảnh khung.
- Kit 2× chỉ **đúng điểm** khi `--u` × DPR = 2 (màn DPR 2 ở zoom 1, hoặc `--u` = 2 ở DPR 1). Ở màn DPR 1 với `--u` 1 (1366×768, 1280×720) ảnh 2× bị hạ nửa bằng nearest: chi tiết 1 px của kit rơi một nửa.
- Zoom CSS nguyên (`--u` 1, 2) giữ bảng màu và lưới; bậc 1,5 chấp nhận được với pixelated nhưng lệch 1 điểm.

**Khuyến nghị cỡ kit** (đề xuất cho chủ repo chốt ở cổng 2; quyết định "kit 2×" của #877 giữ, thêm điều kiện):
1. **Vẽ / duyệt master ở 2×** (góc 16–24 px có chỗ cho chi tiết), vì Codex xuất tờ lớn và công cụ hạ về lưới.
2. **Xuất hai bản từ cùng master**: bản 2× (`border-image-width` = vạch / 2) và bản 1× do `ui-sheet-cut` hạ xuống bằng lấy mẫu theo vùng rồi lượng tử về bảng màu (không hạ nearest trần), kiểm mắt trên preview. Client chọn bản 2× khi `--u` × DPR ≥ 2, ngược lại bản 1×; luôn `pixelated`.
3. Ngân sách tải: kit khung + nút + ô + thanh ≤ 250 KB cho **một** bản đang dùng (bản kia tải lười theo DPR / `--u`); đo lại ở P4.
4. Giữ `--u` ở bậc nguyên cho ảnh khung nếu được (#887 quyết bậc).
Nếu chủ repo muốn đơn giản hơn: một bản 2× thôi và chấp nhận mất chi tiết ở màn DPR 1 `--u` 1; không khuyến nghị vì đó là cỡ phổ biến nhất.

## Luật vẽ AI

Áp cho mọi tờ sinh bằng Codex `image_gen` (BOARD, khung, nút, ô, thanh, icon, trang trí). Bài học từ hồn thú (#861–#870): spec phải khớp công cụ, bài học nằm ở tài liệu chứ không ở issue.

1. **Không chữ, số, logo, ký tự** trong ảnh (chữ do phông game vẽ; model làm hỏng chữ Việt). Chữ / ký tự đọc được trong ảnh là lỗi chặn. Chỗ cần "nhãn" thì vẽ thanh trống.
2. **Trang trí chỉ ở bốn góc và điểm giữa cạnh**; **thân cạnh là dải phẳng 1–2 sắc** (kéo giãn không lộ hoa văn). Bốn góc cùng cỡ, cùng độ dày viền; model chỉ cần vẽ **một** góc đẹp, công cụ dựng gương cho đối xứng.
3. **Cỡ theo tỉ lệ Codex xuất được, không đòi "đúng N px"**: 2:3 → 1024×1536; 1:1 → 1254×1254; 3:2 → 1536×1024. Công cụ nhận mọi cỡ đúng tỉ lệ ±1% rồi tự quy về lưới kit.
4. Một bảng màu ≤ 32 màu cho cả kit + viền mực `#1a1020` (`OUTLINE`); không đổ bóng ra nền, không gradient lớn.
5. Nền khoá `#FF00FF` phẳng (model không xuất trong suốt thật); mảnh cách nhau ≥ 5% cạnh tờ, không sát mép.
6. **Tờ nhỏ, theo họ**: 1 tờ ≤ 9–12 mảnh cùng họ (6 khung / 12 nút / 9–12 ô / 9 thanh / 16 icon). Lỗi một mảnh chỉ vẽ lại tờ đó. Tối đa **3 lượt mỗi tờ**; hết lượt chọn lượt tốt nhất rồi ghép tay một mảnh.
7. **Ảnh tham chiếu tốt hơn lời**: BOARD đã duyệt (phong cách, chất liệu) + ảnh bảng màu + tờ đã đạt cùng họ. **Không dùng tờ lỗi làm tham chiếu.**
8. Prompt **không tự mâu thuẫn** (vd "không chữ" cùng "nhãn trên nút").
9. Loại tờ: **BOARD** 2:3 hoặc 3:2 (1 ảnh, chỉ để duyệt và làm tham chiếu, không cắt); **F** khung 3:2 (6); **N** nút 3:2 (12: 2 loại × thường / hover / nhấn / tắt / chọn + tab); **O** ô 1:1 (9–12); **T** thanh và phụ kiện 3:2 (9); **I** icon 1:1 (16, mỗi tờ một họ); **D** trang trí 2:3 (6–9).
10. Nguồn và giấy phép ghi ở `docs/art/nguon-giay-phep.md`; không ghi key / bí mật vào prompt hay log.

### Prompt BOARD (cho #881)

Tờ BOARD: **một ảnh 3:2 (1536×1024)** cho UI gốc, chỉ để chủ repo duyệt phong cách và làm ảnh tham chiếu cho các tờ sau. Ảnh tham chiếu gửi kèm: (a) ảnh chụp hiện trạng `1366x768` của HUD, Nhân vật, Túi, hộp thoại NPC (trang xem trước của #878); (b) ba mảnh C2 đã duyệt (`nv6_nen_bup_be`, `thong_bao_len_cap`, `khung_tab_nhan_vat`) làm chuẩn **Mực**; (c) swatch bảng màu thủy mặc. Thử tối đa 3 lượt; mỗi lượt đổi **một** thứ.

```
Ảnh minh hoạ giao diện game MMO pixel art, kiểu isometric Ultima Online pha thủy mặc tiên hiệp (chủ đề Đấu La Đại Lục).
Một màn hình mẫu 3:2 gồm: (1) cột HUD bên trái với khung chỉ số và sáu nút menu; (2) bảng "Nhân vật" và bảng "Túi" đặt cạnh nhau,
nền MỰC TỐI (gỗ đen, lót vân mực nho, viền đồng nhạt); (3) một hộp thoại GIẤY (giấy dó ngà, viền son mảnh, trục gỗ) ở giữa dưới;
(4) một nút hành động chính màu son, một nút phụ; (5) dải ô kỹ năng ở đáy.
BẮT BUỘC: tuyệt đối không có chữ, số, ký tự, logo hay dấu nào trong ảnh; chỗ cần nhãn thì vẽ thanh trống hoặc khối màu phẳng.
Khung viền: hoa văn chỉ ở bốn góc và chính giữa mỗi cạnh; thân cạnh là dải phẳng một hoặc hai sắc, không hoa văn dọc cạnh.
Hai chất liệu Mực và Giấy dùng chung bộ góc, độ dày viền và đồng nhạt. Bảng màu hạn chế (tối đa 32 màu), viền mực #1a1020,
pixel sắc nét, không làm mờ, không đổ bóng ra nền, không gradient lớn. Nền ngoài màn hình phẳng một màu.
Nhất quán ánh sáng và độ dày nét giữa mọi khung. Phía sau bảng là cảnh làng cổ tối, chỉ gợi, không chi tiết.
```

Duyệt BOARD (mức B, trang xem trước): chủ repo duyệt phong cách; đổi phong cách thì chỉ đổi BOARD và prompt, pipeline giữ nguyên.

## Kiểm kê và chụp ảnh (công cụ của P0)

- `npm run ui:inventory` (`tools/ui-css-inventory.mjs`): đếm mã màu, `rgba()`, cỡ chữ, `border-image` trong `client/src/*.css` (trừ `landing.css`; `--json`, `--md <tệp>`, `--all`). **Chỉ báo cáo**, luôn thoát 0. Số lúc viết bản 1 (`origin/main` 2c2365af): 81 mã `#hex` khác nhau ngoài `:root` (6 trùng token), 43 `rgba()`, 19 cỡ chữ (14 ngoài thang 10 / 12 / 24), 23 chỗ `border-image`. Cách đếm khác báo cáo gốc (84 màu / 17 cỡ chỉ `style.css`) nên không so trực tiếp.
- `client/scripts/ui-shots.mjs`: chụp game ở nhiều cỡ (mặc định 1366×768, 1280×720, 960×540, 1920×1080) cho ảnh trước / sau của PR giao diện. Cần server `GAME_TEST=1` riêng cổng riêng, một Chrome headless `--mute-audio`, chụp tuần tự (`--help` ở đầu tệp). `--outer` chụp theo cỡ cửa sổ có khung trình duyệt (vùng hiển thị 944×445 cho "960×540": lỗi hộp nhiệm vụ nằm ở cỡ này).
- `tools/ui-border-image-probe.mjs`: thử nghiệm kit 1× / 2× ở trên (`--browser chrome|edge`).

Mỗi PR chuyển màn đính ảnh trước / sau ở 3–4 cỡ bằng `ui-shots.mjs`.

## Công cụ tờ UI (P1, #879)

Cùng khung với `beast:check` / cutter hồn thú: **kiểm trước, cắt sau**, mọi phép đo ở máy, không cần Chrome / server. Spec (tỉ lệ, bố cục, tên mảnh, trạng thái, ngân sách KB) ở `art/src/ui-kit/ui-kit.json` (luật: người sửa; `pieces` / `groups` do công cụ ghi, đừng sửa tay).

| Lệnh | Việc |
|---|---|
| `npm run ui:check -- <tờ.png> [--kind F/N/O/T/I/D/BOARD] [--out <thư mục>] [--palette <gpl>]` | kiểm tờ RAW; ghi `<tờ>-ui-check.json` / `.md`, tờ liên hệ có nhãn, dòng `LỖI:` nháp; thoát mã 1 khi có mức **chặn** |
| `npm run ui:cut -- <tờ.png> --out <thư mục> [--no-mirror] [--names a,b] [--prefix p_] [--write-manifest]` | tách mảnh, dựng gương, hạ lưới, lượng tử; ghi `2x/`, `1x/`, `manifest-entry.json`; tờ có mục chặn thì **không cắt** |
| `npm run ui:cut -- --budget` | tổng KB mảnh đã ghi trong manifest so với ngân sách (kit khung + nút + ô + thanh ≤ 250 KB, icon ≤ 150 KB, tính **riêng từng bản 2× / 1×**) |

Loại tờ suy từ tên file (`toF.png`, `N-2.png`) hoặc `--kind`. Mỗi tờ một họ: **F** khung 3:2 (6 mảnh, 3 + 3), **N** nút 3:2 (12: 5 chính + 5 phụ + 2 tab), **O** ô 1:1 (12: 3 + 5 độ hiếm + 4 kỹ năng), **T** thanh 3:2 (9), **I** icon 1:1 (16), **D** trang trí 2:3 (6 hoặc 9), **BOARD** (chỉ kiểm cỡ). Tên mảnh theo thứ tự đọc, khoá xuất `ui2_<tên>` (tờ icon: đặt `--prefix` theo họ để khoá không trùng).

**Kiểm** (`ui-sheet-check.mjs`; dò lưới / khoá nền tái dùng `beast-sheet-grid` và `beast-sheet-cut`):

| Mức | Mã | Điều kiện |
|---|---|---|
| chặn | `kich-thuoc` | tỉ lệ ngoài tập Codex (2:3, 1:1, 3:2, ±1%) hoặc sai tỉ lệ so với loại tờ; cỡ lạ mà đúng tỉ lệ chỉ **nhẹ** (cutter chuẩn hoá) |
| chặn | `nen` | màu nền cách `#FF00FF` hoặc bốn góc lệch quá dung sai 60 |
| chặn | `luoi`, `so-hinh`, `hinh-dinh`, `trang-thai` | không dò được dải theo bố cục; thiếu / thừa mảnh; mảnh dính; thiếu trạng thái (liệt kê tên mảnh thiếu) |
| chặn | `vien-hong` | > 3% điểm viền còn ám hồng sau khi khoá nền (nhẹ nếu > 1%) |
| chặn | `canh-phang` | > 35% điểm dải mép lệch khỏi thân cạnh khi kéo ×3 (nhẹ nếu > 15%): hoa văn dọc cạnh sẽ lộ khi kéo |
| chặn | `mau` | > 40 màu đáng kể (≥ 0,5% điểm, ô 3 bit); nhẹ nếu > 32; `ngoai-bang` khi có `--palette` |
| nhẹ | `cham-mep`, `khoang-cach`, `do-day`, `doi-xung`, `trang-thai-giong`, `chia-9` | chạm mép; cách nhau < 5% cạnh tờ; độ dày viền lệch > 2 điểm master; bốn góc khác nhau (cutter dựng gương nên bỏ qua được); hover ≈ thường; ruột không đồng nhất |
| cảnh báo | `chu-lac` | nghi chữ / ký tự trong ruột (≥ 3 nét thẳng hàng): **chỉ cảnh báo**, xem tờ liên hệ rồi quyết |

Ghi chú đo: vạch 9-slice đề xuất = max(độ dày viền, tầm với hoa văn góc) đo trên ảnh master (trên nút UI-5 ra 7, hộp thoại ra 14 hoặc 15, trùng manifest cũ). Mảnh trang trí không phải khung thì đặt `"stretch": false` ở spec mảnh: 7 mảnh C2 là tranh vẽ tay, cạnh có hoa văn, coi là khung 9-slice thì bị chặn `canh-phang`, đúng như thiết kế.

**Cắt** (`ui-sheet-cut.mjs`): tách mảnh (khoảng trống + khoá nền + gỡ viền) → hạ lưới theo vùng về **master 2×** (`div` theo loại tờ, nhân thêm tỉ lệ cỡ tờ nên 1024² và 1254² ra cùng cỡ) → khung / nút dựng **đối xứng bằng gương** từ phần tư trên-trái (model chỉ cần vẽ một góc đẹp) → lượng tử ≤ 32 màu + viền `#1a1020`, alpha nhị phân → xuất **2×** và **1×** (1× hạ theo vùng từ 2× rồi lượng tử lại, không nearest trần; khớp khuyến nghị ở mục "Kit 1× hay 2×") → vạch 9-slice đo từ ảnh, **chung trong một bộ trạng thái** (`nine.x2`, `nine.x1` = ⌈x2 / 2⌉). Manifest mỗi mảnh ghi `nine`, `set` + `state` (và `groups`: bộ → trạng thái → khoá), `grid` (master, hệ số hạ, cỡ tờ), `size`, `bytes`, `hash`. **Tất định**: cùng tờ + cùng tuỳ chọn → cùng byte; cắt lại mảnh đã cắt (bảng màu có sẵn) cũng ra đúng byte (kiểm trong `npm run test:assets`).

**Cắt mềm** (`--soft` ở `ui:check` / `ui:cut`, bước #882 đợt 3; mặc định tắt): với tờ AI vẽ còn lỗi **sửa được bằng công cụ**, bù trước khi đo rồi chỉ **hạ CHẶN → nhẹ** khi mảnh đạt kiểm hình; quá ngưỡng thì vẫn CHẶN (phải vẽ lại). Mục hạ vẫn ghi vào phiếu (`nhẹ`, ghi "đã bù" / "đã ép phẳng") để không che lỗi.

| Lỗi | Xử lý | Điều kiện hạ xuống nhẹ (hằng `SOFT_*` ở `ui-sheet-check.mjs`) |
|---|---|---|
| `vien-hong` | `defringe`: điểm ngả hồng nối với rìa (sâu ≤ 3) mà tối thì đổi về mực `#1a1020` (giữ hình), sáng thì bỏ | còn ≤ `SOFT_PINK_LEFT` (1%) điểm viền ám hồng **và** không mảnh nào mất > `SOFT_LOSS_MAX` (5%) điểm |
| `canh-phang` (hoa văn / sọc dọc thân cạnh) | `flattenEdges`: điểm thân cạnh về màu trung vị hàng; góc và giữa cạnh giữ | lệch ≤ `SOFT_FLAT_MAX` (60%), đổi ≤ `SOFT_FLAT_CHANGE_MAX` (8%) diện tích mảnh, đo lại ≤ 15% |
| mảnh còn chặn riêng | `ui:cut --skip a,b` bỏ mảnh đó, cắt phần đạt (ghi `skipped` ở `_report.json`); chặn chung của tờ vẫn chặn | không |

Không công cụ nào sửa được (phải vẽ lại): chữ, hoa văn thật dọc cạnh quá 8% diện tích, hai chất liệu lẫn, mảnh dính nhau, cạnh ngắn bị vạch góc nuốt hết (ảnh gốc phẳng, chỉ lệch khi kéo ×3, báo trong mô tả chặn). Spec mảnh có thêm `"mirror": false` cho mảnh không đối xứng (tab hở đáy: dựng gương sẽ khép đáy). Sửa phép đo `edgeFlatness`: hàng thân cạnh trong suốt đồng nhất (≤ 5% điểm đặc: ngọc giữa cạnh nhô ra, tab hở đáy) không còn bị đếm là lệch; viền lởm chởm của tranh vẽ tay vẫn bị chặn (test C2).

Fixture thử: 7 mảnh C2 + khung UI-5 thật phóng lên tờ giả, khung tổng hợp có lỗi cố ý (`tools/assets/ui-sheet-fixture.mjs`).

## Skill, prompt, trang bộ component, CI nhẹ (P2, #880)

Thao tác hằng ngày nằm ở skill `ui-kit` (`.claude/skills/ui-kit/SKILL.md`, hai phần SINH và DUYỆT / NHẬP, cùng khung `beast-anim`); mục này là đặc tả công cụ.

| Lệnh | Việc |
|---|---|
| `npm run ui:prompt -- --kind BOARD\|F\|N\|O\|T\|I\|D [--material muc\|giay] [--style ngoc-kim\|thuy-mac] [--family …] [--layout 6\|9] --out <thư mục>` | sinh `<loại>.md` (bảng thông tin, thứ tự ảnh tham chiếu, prompt tiếng Anh, chú thích); tờ F, N, T, O vẽ **mọi** mảnh theo `--material` (F: cả 6 khung cùng một chất liệu; tên `khung_muc_*` / `khung_giay_*` chỉ là chỗ đứng, tờ F Mực rồi tờ F Giấy là hai lượt riêng); bố cục và tên mảnh đọc từ `ui-kit.json`, bài học đọc từ `art/src/ui-kit/lessons.md` (cú pháp ở đầu file; phạm vi theo loại tờ). Không viết / sửa prompt tay |
| `npm run ui:preview -- --dir <thư mục ui:cut> [--dir …] --out <thư mục>` (hoặc `--fixture c2,ui5`) | trang bộ component `index.html` tự chứa: **A** bảng mảnh (cỡ, vạch, KB, ngân sách) · **B** mọi mảnh × 3 nền (sáng `#e8dcc0`, tối `#14101c`, trắng) × DPR 1 / 2 · **C** mọi mảnh co giãn ở 200×60, 360×120, 520×320 · **D** bộ trạng thái bằng `<button>` thật (hover, nhấn, focus-visible, chọn, tắt) cạnh hàng trạng thái tĩnh · **E** chuỗi tiếng Việt đủ dấu ở 10 / 12 / 24 px × 3 nền × DPR 1 / 2. Không cần Chrome / server |

DPR trên trang: không ép được DPR của máy; "DPR 1" dùng ảnh 1× đúng cỡ, "DPR 2" dùng ảnh 2× hiển thị bằng một nửa cỡ (`border-image-width` = vạch / 2), nên đúng điểm khi máy là DPR 2 và là trường hợp "2× bị hạ nửa" đã đo ở mục "Kit 1× hay 2×" khi máy là DPR 1. Số DPR thật hiện ở đầu trang. Fixture `c2` / `ui5` là tờ giả lập dựng từ 7 mảnh C2 và 6 khung UI-5 có sẵn (`ui-sheet-fixture.mjs`), **không** phải ảnh model.

CI nhẹ: job `ui-sheet-check` (`docs/ops/ci.md` mục "CI nhẹ cho tờ UI"). Mẫu issue một tờ: `.github/ISSUE_TEMPLATE/to-ui.md`.

## Hướng nghệ thuật tu tiên (nháp chờ duyệt)

**Trạng thái: NHÁP, chủ repo chưa duyệt (#877).** Lý do: UI gốc (kit Mực / Giấy) chưa "chất"; muốn thiên hướng tu tiên đỉnh cao, hài hòa, đồng bộ với hướng võ hồn bá đạo. Chưa đổi kit, token, màn nào; chỉ công cụ sinh prompt có thêm cờ để thử.

Cảm giác đích: một cuộn pháp bảo hiện giữa hư không: nền tối sâu, linh khí chảy dọc viền, vàng kim và ngọc chỉ ở chỗ cần chú ý, giấy cổ cho phần đọc; mỗi màn **một điểm sáng** (hồn lực).

Nguyên tắc (chung cho cả hai hướng):
1. Ít mà sang: chừa **lưu bạch**; trang trí chỉ ở góc, giữa cạnh, nút chốt; thân cạnh phẳng.
2. Một điểm sáng mỗi màn (nút chính / vật chọn / hồn lực); phần còn lại lùi xuống tối.
3. Linh khí: vệt khí mảnh ở viền, tường vân mờ ở nền, không đè chữ.
4. Bảng màu giới hạn, tối đa 3 màu nhấn mỗi màn; **chu sa** chỉ cho dấu ấn, cảnh báo, hạng cao.
5. Chất liệu thật: Mực = đá đen / lưu ly có vân; Giấy = giấy dó cổ mép rách + dấu chu sa; nút = ngọc bội / kim bài, không phải viên thuốc nhựa.
6. Thư pháp và dấu ấn: tiêu đề như bảng hiệu; "đã xong / đã diệt" bằng con dấu đỏ; số cấp bằng chữ vuông kim.
7. Hạng bằng ánh sáng: thường (xám đá) → hiếm (lục bích) → quý (lam băng) → cực phẩm (tím vân kim) → tuyệt thế (vàng + khí chu sa).
8. Chuyển động thở: mở màn cuộn / tan sương 200-300 ms, hover khí sáng lan; không nhấp nháy rẻ tiền; tôn trọng giảm chuyển động.
9. Đối xứng phá cách: một vật (cành mai, đao kiếm, mây) lấn khỏi khung.

Hai hướng thử (chủ repo chọn sau khi xem BOARD của từng hướng):
- **`ngoc-kim`** (Ngọc – Kim): tím than + lưu ly, khung vàng đồng cổ chạm vân ở góc, nút ngọc bích; "tiên môn hoàng gia".
- **`thuy-mac`** (Thủy mặc – Chu sa): mực đen loang, nét cọ, giấy dó, dấu chu sa; tối giản, "ẩn thế cao nhân".

Điều cần tránh: chữ nghệ thuật dài khó đọc, đổ bóng gradient nhựa, nhiều viền kép, màu bão hòa chói, icon kiểu hoạt hình, chép hình / biểu tượng game khác. Ràng buộc kỹ thuật không đổi (2× pixel-friendly, 9-slice, token `--ui2-*`, vùng bấm 32 / 44 px, phông Galmuri, ảnh sinh bằng Codex qua `ui-sheet-*`).

Công cụ: `npm run ui:prompt -- --kind <loại> --style ngoc-kim|thuy-mac ...` thay khối STYLE bằng khối của hướng (bảng màu, chất liệu, lưu bạch, một điểm sáng) và thêm khối `AVOID`; áp cho mọi loại tờ (BOARD, F, N, O, T, I, D). Không có `--style` thì dùng phong cách UI gốc. Nội dung hai khối nằm ở `STYLES` trong `tools/assets/ui-sheet-prompt.mjs`. Bước kế (sau khi duyệt): Codex sinh BOARD cho từng hướng (3 lượt mỗi hướng), chủ repo chọn, rồi mới làm lại kit F / N / O / T và áp dụng cho màn đầu.

### Hồn Quang Tiên Môn — BOARD v3 (thử hướng lai, #1260)

Chủ repo yêu cầu kết hợp tu tiên và Đấu La (29/10/2026). `--style hon-quang` là hướng thử riêng; BOARD chờ chủ repo chọn trước khi làm lại kit. UI gốc và kit đang chạy giữ nguyên.

| Lớp | Phân vai |
|---|---|
| Khung, nền, bố cục, chữ | Thủy mặc làm gốc: mực lam đen, giấy dó cho phần đọc, lưu bạch, cạnh phẳng; tiêu đề dạng bảng hiệu nhưng ảnh để trống, chữ do Galmuri vẽ |
| Kim loại, nút chốt | Ngọc–Kim tiết chế: đồng cổ mờ, ngọc bội / kim bài |
| Điểm sáng | Đấu La: một vùng hồn quang duy nhất mỗi màn; BOARD đặt ở thanh hồn lực, nút và ô chọn không phát sáng |
| Phân hạng | Hồn hoàn trắng → vàng → tím → đen → đỏ (niên hạn theo `TIERS`); chỉ là vòng nhỏ góc ô / thẻ, không tô nền; kèm góc khuyết tăng dần để đọc ở thang xám, vòng đen có nét ngà |
| Dấu ấn, chủ đề | Chu sa cho hoàn tất / đã diệt; ấn võ hồn tự vẽ ở góc, tường vân mờ tránh nội dung; dấu trong ảnh không chứa ký tự |
| Chuyển động dự kiến | Tan sương 200–300 ms, hồn hoàn xoay chậm khi hover, tôn trọng giảm chuyển động |

Tối đa ba màu nhấn ngoài dấu hạng; năm màu hồn hoàn chỉ nằm tại nơi có hạng. Không dùng thang xám–ngọc–lam–tím–vàng của hai hướng thử trước cho preset này. Không sao chép biểu tượng / hình tác phẩm gốc. Giữ 2×, 9-slice, token `ui2`, Galmuri 10 / 12 / 24, vùng bấm 32 / 44 px.

Sinh bằng `npm run ui:prompt -- --kind BOARD --style hon-quang --out <thư mục ngoài repo>`; cờ áp dụng cho đủ BOARD / F / N / O / T / I / D. BOARD v3 dùng lưới logic 4 px: HUD sáu nút; bảng Mực 3×2 ô; Xếp Hạng ba tab, năm hàng và hạng bản thân; hộp Giấy; hotbar tám ô; một mẫu ô vật phẩm lặp năm lần để so đủ năm hạng hồn hoàn. Không chữ / số; tiêu đề và dữ liệu là thanh trống.

Tối đa ba lượt, mỗi lượt sửa một ý trong công cụ rồi sinh lại prompt, không dùng ảnh lỗi làm tham chiếu. `ui:check --kind BOARD` chỉ kiểm cỡ / tỉ lệ; lưới, số ô, cạnh phẳng, một hồn quang, chất liệu, chữ lạc và tính nhất quán phải tự duyệt bằng mắt. Lưu ảnh gốc cùng prompt vào `art/src/ui-kit/candidates/`, ghi nguồn ở `art/CREDITS.md`; không cắt / nhập hoặc thay BOARD đã duyệt. Chủ repo chọn BOARD trước khi tiếp tục F/N/O/T.

## Lớp token kit (`--ui2-*`, #883)

Lớp `body.ui2` luôn có (tên lớp và tiền tố `ui2-*` ở mã / CSS còn giữ tên cũ; gỡ cờ và đổi tên ở đợt 5b / 5c, `ROADMAP.md`). Test: `ui2-test` kiểm lớp và token; test trình duyệt (`flow-`, `panel-`, `actionbar-browser`) và `client/scripts/ui-shots.mjs` chạy trên UI gốc, thêm cảnh `hub`, `npc`, `cua-hang`, `tho-ren`.

- `client/src/uiKit.ts`: đọc mảnh `ui2_<tên>` trong manifest ảnh (mảnh do `ui:cut` xuất; `nine` = `{ x2, x1 }`; ảnh ở `sprites/iso/ui2/2x/` và `1x/`) thành `--ui2-<tên>` (ảnh), `--ui2-<tên>-nine` (vạch cắt của bản đang dùng), `--ui2-<tên>-bw` (độ dày viền CSS = vạch / hệ số kit). Bản 2× khi `--u` × DPR ≥ 2, ngược lại 1× (tính lại khi đổi cỡ). Có mảnh nào thì body có lớp `ui2-k-<tên>`.
- `client/src/ui2.css`: helper khung theo vai trò, gắn lớp vào phần tử: Mực `f2-muc-lon` / `f2-muc-nho`, Giấy `f2-giay-lon` / `f2-giay-nho`, `f2-tooltip`, `f2-toast`, ô `f2-o`, tab `f2-tab`, nút `f2-nut-chinh` / `f2-nut-phu` (trạng thái theo `:hover` / `:active` / `.sel` / `:disabled`). Đây là chỗ **duy nhất** đặt `border-width`, `border-image-slice`, `border-image-width` của kit (qua `--frame-img`, `--frame-nine`, `--frame-bw`); luôn `pixelated`. Màn mới gắn lớp `f2-*`, không viết luật khung riêng.
- URL ảnh kit đặt vào biến CSS là **URL tuyệt đối** (`applyUi2`): url() tương đối trong biến bị phân giải theo tệp CSS đã build nên ở bản build khung kit mất ảnh .
- Kit đã nhập (mục "Nhập kit vào game"): lớp `ui2-k-*` có thật, helper áp. Mảnh nhập mới không cần sửa helper.
- Test: `npm run test:ui2 --prefix client` (lớp, bản kit, token, vạch 9-slice ≤ nửa cạnh và độ dày = vạch / hệ số kit trên manifest kit, `ui2.css` chỉ đi qua token và chỉ dùng mảnh có trong spec).

## Nhập kit vào game (`ui:import`, #885)

`npm run ui:import` cắt lại từ ảnh RAW trong `art/src/ui-kit` theo `PLAN` ở `tools/assets/ui-import.mjs` (cắt mềm `--soft`, chỉ giữ mảnh đúng chất liệu: tờ F Mực lấy `khung_muc_lon / nho / tooltip`, toast từ lượt F Mực attempt5, tờ F Giấy lấy `khung_giay_lon / nho`; N / O / T Mực lấy cả tờ), rồi ghi:
- ảnh `shared/assets/sprites/iso/ui2/2x/` và `1x/` (`ui2_<tên>.png`);
- mục `{ "key": "ui2_<tên>", "iso": true, "nine": { "x2", "x1" } }` vào `shared/assets/sprites/manifest.json` (chỉ thay các dòng `ui2_*`, mục khác giữ nguyên từng byte; không sửa tay);
- `pieces` / `groups` ở `art/src/ui-kit/ui-kit.json`.
`npm run ui:import -- --check` (có trong `test:assets`) báo lỗi nếu ảnh hoặc manifest lệch với kết quả cắt (cắt tất định). Tờ mới hoặc mảnh vẽ lại: sửa `PLAN` rồi chạy lại. `validate.mjs` nhận khoá `ui2_*` (kiểu `ui2`: bảng màu do cutter giữ, cần cả bản 1×). Phaser bỏ qua khoá này; ảnh do CSS tải. Vạch 9-slice được giới hạn để 2 × vạch 1× vẫn nhỏ hơn cạnh ngắn (tab thấp 20 điểm ở 1×). Chưa nhập: nút / ô / thanh Giấy và 2 tab Giấy (chưa có chỗ dùng ở `ui2.css`), tờ icon pilot (#884).

## Khung màn chuẩn và thành phần nhỏ (#885)

`client/src/uiParts.ts` + `client/src/ui2-parts.css` (mọi luật dưới `body.ui2`, màu qua token, chữ 10 / 12 / 24). Chỉ trình bày: số liệu, trạng thái và giờ do server quyết.
- **Khung màn** `screenFrame({ material: "muc" | "giay", title, badge, info, currency, nav, primary, onNav, onPrimary })`: huy hiệu + tên + nút `i` (trái-trên), vùng tiền tệ ngữ cảnh (phải-trên), cột điều hướng trái, **một** nút chính phải-dưới (44 px, `f2-nut-chinh`; khoá thì hiện lý do cạnh nút). (Mã còn nhánh trả `null` khi thiếu lớp `ui2`; gỡ ở đợt 5b / 5c.) Nội dung màn đặt vào `frame.body`; khung ăn kit qua `f2-muc-lon` / `f2-giay-lon`.
- **Thẻ có nhãn trạng thái** `statusCard({ title, sub, state, reason, rank, limit, onClick })`: `new` chấm đỏ, `up` mũi tên xanh, `done` tick + gạch tên, `lock` xám + lý do (không có lý do thì hiện "Chưa mở"; thẻ khoá không phát `onClick`), `rank` 0…4 là màu nền theo `--rare-N` kèm vạch góc dài dần, `limit` là nhãn đầu thẻ. Mỗi dấu một hình riêng (không chỉ màu).
- **Công tắc** `toggle({ label, on, disabled, onChange })` (`role=switch`; màn gửi server rồi gọi `set` nếu bị từ chối), **đồng hồ đếm ngược** `countdown({ target, now, label, onEnd })` (`role=timer`; `now` là đồng hồ máy chủ; dưới `COUNTDOWN_SOON_MS` đổi viền đứt nét; hết giờ viền chấm, "Đã hết"; tự dừng khi rời cây DOM), `abbrevNumber` (1,2K / 12,5M).
- **Bộ thành phần dùng chung** (chỉ trình bày, không đổi logic; cây dựng thuần + hàm DOM cùng tên bỏ "Node"): `stateBox({ kind: "loading" | "empty" | "error", text, hint, onRetry })` (tải = bộ xương `aria-busy`, rỗng = câu + gợi ý việc làm, lỗi = `role=alert` + nút Thử lại), `select({ label, options, value, onChange })` (hộp xổ: ↑ ↓ Home End Enter, Esc đóng danh sách và không lan lên ngăn xếp bảng, mục khoá bị bỏ qua), `qty({ label, max, min, step, value, onChange })` (thanh trượt + nút - / + / Tối đa; `clampQty` ép số, `setMax` khi kho đổi), `tabs({ label, tabs, vertical, onSelect })` (ngang hình thang, chọn = cao hơn một bậc; dọc = ô icon 44 px, vạch trái, chữ chỉ cho trình đọc; tab khoá có lý do; có mảnh kit `tab_thuong` thì kit thay khung), `itemSlot({ name, icon, qty, state, reason, rank, selected, empty, onClick })` (ô 48 px: viền + góc cắt theo hạng, `x1,2K` đáy phải, nhãn mới / nâng / khoá ở góc, khoá không phát `onClick`). Icon là ký tự có trong Galmuri (icon ảnh gắn ở đợt 0c). Trang xem trước thêm khối "đợt 0b" (mở bằng `#parts` để chỉ xem khối này).
- Cây dựng là hàm thuần (`frameNode`, `cardNode`, `toggleNode`, `countdownNode`, `toHtml`) để test bằng node và dựng trang xem trước: `node --experimental-strip-types tools/assets/ui-parts-preview.mjs --out <thư mục ngoài repo>` (mọi trạng thái × 3 nền × 3 cỡ × Mực / Giấy, nút đổi kit 1× / 2×). Test: `npm run test:uiparts --prefix client`.
- Đã dùng ở: menu hub (#1208), HUD chính (`client/src/ui2-hud.css` — khung nhân vật / tổ đội / minimap = `f2-muc-nho`, nút tắt = `f2-nut-phu`, ô hồn kỹ / hồn cốt / vật phẩm / đội hình = `f2-o`, toast = `f2-toast`; luật `#id` cũ của HUD được lặp lại đúng bộ viền kit trong `#hud`, chỉ dưới `body.ui2`), HUD phụ (`client/src/ui2-hud-side.css` — thanh boss, xếp hạng sát thương, mục tiêu, cổng, waypoint, dung hợp kỹ, menu người chơi = `f2-muc-nho`, `hudBoss.ts` gắn lớp; tổ đội / nhiệm vụ chỉnh theo token), đấu trường + màn gục (`client/src/ui2-arena.css`: hàng đợi, thanh trận, bảng kết quả, màn đếm ngược gục do `deathShow` / `deathTick` ở `hudArena.ts`; server tự hồi sinh sau `RESPAWN_SECS` nên màn gục không có nút lựa chọn), bảng Bạn bè (`client/src/ui2-social.css`: trạng thái trực tuyến bằng chấm hình + chữ); phản hồi giao diện (#599 / #755: `client/src/ui2-feedback.css` — chú thích `#tip` = `f2-tooltip`, chip lệnh `#cmdChip` và banner `#banner` = `f2-muc-nho`, chip "×n" của toast; lớp gắn ở `tooltip.ts` / `cmdChip.ts` / `feedback.ts`).

## Lỗi đã sửa ở P0 (ghi để không lặp)

- Nút `Đăng nhập bằng Google` / `Đổi tài khoản` bung thành hai dải nâu: vạch cắt `ui_nut_*` sai 1 điểm (xem "Quy tắc 9-slice").
- Cửa sổ 960×540 (vùng hiển thị 944×445): cột phải (bản đồ nhỏ cao ~305 px) đẩy hộp nhiệm vụ xuống dải đội hình / hồn kỹ, chữ nhiệm vụ lọt qua ô trong suốt. Vùng cao ≤ 460 không còn chỗ nên hộp nhiệm vụ ẩn (xem ở hộp thoại NPC); điện thoại có chỗ riêng. Nếu muốn hiện lại ở cỡ này cần đổi bố cục cột phải (không thuộc P0).

## Việc còn lại

- Icon pilot 16 menu (AI) so với game-icons (#884); checkbox / slider / scrollbar từ gói CC0, tuỳ chọn (#888).
- Gỡ cờ `ui2`, `?ui=` và luật cũ khỏi `style.css` (đợt 5b / 5c, #886): `ROADMAP.md`.

Trạng thái thật ở các issue.
