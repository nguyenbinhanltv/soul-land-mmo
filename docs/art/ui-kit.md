# UI Kit v2: luật chất liệu, token, luật vẽ AI (bản 1)

Style guide của giao diện HTML (HUD, bảng, hộp thoại). Theo dõi: #877 (UI Kit v2), việc này là #878 (P0). Hướng đã chốt ngày 2026-10-26 (chủ repo, ở #877): **hướng B, hai chất liệu có luật**; chỉ PC (Q40); vùng bấm 44 px cho nút hành động chính; kit **2×** chốt sau thử nghiệm (mục "Kit 1× hay 2×"); phông Galmuri 10 / 12 / 24; icon hybrid; chuyển bằng cờ `ui2`. Luật nằm ở đây, **không** nằm trong issue: issue chỉ chứa việc. Bản 1 ghi luật + token + prompt BOARD; công cụ cắt / kiểm tờ (P1), skill (P2), lớp token và cờ `ui2` (P5) đến sau và sẽ sửa tài liệu này.

Liên quan: `docs/design/giao-dien.md` (bố cục, hành vi bảng), skill `client-ui` (cách code), `docs/art/nguon-giay-phep.md` (nguồn / giấy phép ảnh).

## Hai chất liệu

| | **Mực** | **Giấy** |
|---|---|---|
| Là gì | nền tối (mực nho / gỗ đen), viền đồng nhạt, lót vân mực | giấy dó ngà, viền son mảnh, gỗ trục |
| Dùng cho | **mọi bảng thao tác**: HUD, hotbar, Nhân vật, Túi, Đội hình, Cộng minh, Bạn bè, Tự động, Cài đặt, bản đồ, tooltip, toast thường | **nội dung đọc**: hội thoại NPC, cửa hàng, thợ rèn, nhiệm vụ, hướng dẫn, thư, đăng nhập |
| Chữ | giấy ngà trên nền tối (`--ink-text`, `--plate-text`) | mực trên giấy (`--text`, `--muted`) |
| Nền chung | `--bg`, `--ink-panel`, `--plate`, `--track` | `--paper`, `--paper2`, `--panel` |

Luật dùng:
1. Một màn một chất liệu chính. Không đặt bảng Giấy cạnh bảng Mực cùng vai trò (lỗi hiện tại: Nhân vật tối, Túi be). Ngoại lệ có chủ đích: hộp thoại / hướng dẫn (Giấy) nổi trên HUD (Mực).
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

Đề xuất thêm khi kit mẫu được duyệt (làm ở P5 #883, **cần chủ repo duyệt cùng cổng 1**): đồng nhạt cho viền Mực (gợi ý `#b08a4a`), `--surface-ink-raised` cho ô nổi trên nền Mực, `--info` (hiện dùng lẻ `#5aa8c0`, `#8ec5ff`). Mỗi màu lẻ trong CSS cũ khi gặp thì thay bằng token gần nhất, **không** thêm màu mới ngoài bảng.

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

Tờ BOARD: **một ảnh 3:2 (1536×1024)** cho hướng B, chỉ để chủ repo duyệt phong cách và làm ảnh tham chiếu cho các tờ sau. Ảnh tham chiếu gửi kèm: (a) ảnh chụp hiện trạng `1366x768` của HUD, Nhân vật, Túi, hộp thoại NPC (trang xem trước của #878); (b) ba mảnh C2 đã duyệt (`nv6_nen_bup_be`, `thong_bao_len_cap`, `khung_tab_nhan_vat`) làm chuẩn **Mực**; (c) swatch bảng màu thủy mặc. Thử tối đa 3 lượt; mỗi lượt đổi **một** thứ.

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

Duyệt BOARD (mức B, trang xem trước): chủ repo chọn hướng (A / B / C), pipeline giữ nguyên nếu đổi hướng, chỉ đổi BOARD và prompt.

## Kiểm kê và chụp ảnh (công cụ của P0)

- `npm run ui:inventory` (`tools/ui-css-inventory.mjs`): đếm mã màu, `rgba()`, cỡ chữ, `border-image` trong `client/src/*.css` (trừ `landing.css`; `--json`, `--md <tệp>`, `--all`). **Chỉ báo cáo**, luôn thoát 0. Số lúc viết bản 1 (`origin/main` 2c2365af): 81 mã `#hex` khác nhau ngoài `:root` (6 trùng token), 43 `rgba()`, 19 cỡ chữ (14 ngoài thang 10 / 12 / 24), 23 chỗ `border-image`. Cách đếm khác báo cáo gốc (84 màu / 17 cỡ chỉ `style.css`) nên không so trực tiếp.
- `client/scripts/ui-shots.mjs`: chụp game ở nhiều cỡ (mặc định 1366×768, 1280×720, 960×540, 1920×1080) cho ảnh trước / sau của PR giao diện. Cần server `GAME_TEST=1` riêng cổng riêng, một Chrome headless `--mute-audio`, chụp tuần tự (`--help` ở đầu tệp). `--outer` chụp theo cỡ cửa sổ có khung trình duyệt (vùng hiển thị 944×445 cho "960×540": lỗi hộp nhiệm vụ nằm ở cỡ này).
- `tools/ui-border-image-probe.mjs`: thử nghiệm kit 1× / 2× ở trên (`--browser chrome|edge`).

Mỗi PR chuyển màn đính ảnh trước / sau ở 3–4 cỡ bằng `ui-shots.mjs`.

## Lỗi đã sửa ở P0 (ghi để không lặp)

- Nút `Đăng nhập bằng Google` / `Đổi tài khoản` bung thành hai dải nâu: vạch cắt `ui_nut_*` sai 1 điểm (xem "Quy tắc 9-slice").
- Cửa sổ 960×540 (vùng hiển thị 944×445): cột phải (bản đồ nhỏ cao ~305 px) đẩy hộp nhiệm vụ xuống dải đội hình / hồn kỹ, chữ nhiệm vụ lọt qua ô trong suốt. Vùng cao ≤ 460 không còn chỗ nên hộp nhiệm vụ ẩn (xem ở hộp thoại NPC); điện thoại có chỗ riêng. Nếu muốn hiện lại ở cỡ này cần đổi bố cục cột phải (không thuộc P0).

## Việc kế tiếp (theo #877)

P1 `ui-sheet-check` / `ui-sheet-cut` + manifest (#879) → P2 skill `ui-kit`, trang xem trước bộ component (#880) → P3 BOARD (#881, dùng prompt trên) → P4 kit mẫu (#882, cổng 2) → P5 token + cờ `ui2` (#883) → P6 icon (#884) → P7 từng màn (#885) → P8 dọn (#886). Việc kiểm Firefox và chốt cỡ kit nằm ở P1 / cổng 2.
