# Giao diện Nhân vật + Túi

**Chỉ phía client**: server quyết định mọi thứ, không đổi luật chơi và số cân bằng; client chỉ gửi lệnh có sẵn. Tên hằng / hàm trong dấu `code`; số cân bằng ở `shared/data.ts`. Luật túi và vật phẩm: mục 5.7 (`docs/design/kinh-te-tui-do.md`); trang bị: mục 5.15 (`docs/design/trang-bi.md`). Phím tắt: bảng phím ở `docs/design/01-luat-chung.md`.

## Túi đồ dạng lưới (phần giao diện của mục 5.7)
`client/src/bag.ts`.

- **Ô** đồng cỡ, viền theo độ hiếm (hồn hoàn / hồn cốt theo bậc niên hạn, hồn hạch theo sao; token `--tier-N` / `--rare-N`), số lượng / số năm ở góc, chấm "mới" cho món vừa nhận tới khi bấm xem.
- **Chip lọc theo nhóm:**
  - Trang bị (hồn cốt + hồn hạch), Trang bị hồn sư (mục 5.15), Hồn hoàn, Hồn cốt, Hồn hạch.
  - Vật liệu (mảnh võ hồn + tiên thảo); Tiêu hao (đan, phù, lệnh bài, rương).
- **Cách xếp:** hộp chọn hiển thị (mặc định / theo loại / độ hiếm / mới nhận). Kéo thả đổi chỗ ô (thứ tự nhớ ở trình duyệt; chỉ khi không lọc nhóm). Nút "Sắp xếp" thì server gộp / xếp thật và xóa thứ tự tự kéo.
- **Gắn nhanh:** dải "Gắn nhanh" (6 ô hồn cốt + ô hồn hạch của võ hồn ra trận). Kéo hồn cốt / hồn hạch lên dải, hoặc bấm "Gắn nhanh" ở chi tiết ô, gửi đúng lệnh `equip` / `equipcore` (server kiểm tra vị trí, giao chiến).
- **So sánh với món đang gắn** cùng vị trí, ở chú thích (rê chuột / chạm giữ) và khung chi tiết: từng chỉ số "cũ → mới" kèm ▲ xanh / ▼ đỏ. Hồn hạch so với món yếu nhất khi đủ ô; còn ô trống thì coi như gắn thêm.
- Không thêm tin server nào.

## 5.16 Giao diện Nhân vật + Túi (hai cửa sổ, búp bê 4 tab)
Bản phác bố cục: `docs/art/ban-phac-nhan-vat-tui/index.html` (kèm ảnh ở `anh/`). Hợp đồng kiểu và hàm thuần: `client/src/charBagContract.ts` (kiểm thử `npm run test:charbag --prefix client`).

### Hai cửa sổ Nhân vật + Túi
`client/src/dualWindow.ts`; trạng thái suy ra từ `hidden` của `#char` / `#bag`.
- `WindowState` = `bag` (B) / `char` (H) / `dual`. Nút ⇆ trên mỗi bảng: một bảng thì mở thêm bảng kia; đang `dual` thì về chỉ bảng đó.
- **Bố cục** theo lớp trên `<body>` (`dual-win`, `ui-wide` ≥ 960 px logic, `ui-w640`, `ui-h460`), không dùng `@media`:
  - Màn ngang ≥ 960 px: nhân vật bên trái (5–48%), túi bên phải (52–95%), khe giữa là vùng thả trống.
  - Điện thoại ngang thấp: hai bảng thu gọn cạnh nhau (ô ~36 px, túi 6 cột).
  - Màn hẹp (logic ≤ 640 px, gồm điện thoại ngang 568×320 và điện thoại dọc): một bảng một lúc, thẻ chuyển Nhân vật / Túi (`#dualTabs`) ở đầu màn hình.
- Bảng bấm vào thì nổi lên; không bảng nào chặn chuột của bảng kia; đóng bằng ×, Esc hoặc phím tắt.
- Luật "mở bảng này đóng bảng kia" bỏ **chỉ cho cặp Nhân vật / Túi**; Đội hình, Bạn bè, Thế giới… vẫn đóng như cũ.

### Búp bê 4 tab
Đầu bảng: dải chọn võ hồn trong đội (mặc định võ hồn ra trận) và nút "Ra trận". Cột chỉ số do server gửi nằm bên cạnh, có chênh lệch khi xem trước đồ.

- **Trang bị:** 10 ô (`EQUIP_SLOTS`) kiểu Mir2 quanh hình hồn sư (Áo đè lên thân).
  - Thuộc hồn sư nên không phụ thuộc võ hồn đang xem. Đọc từ tin riêng `gear`; mặc / tháo bằng `equipgear {id}` / `unequipgear {slot}`.
  - Chi tiết ở "Tab Trang bị" dưới.
- **Hồn cốt:** 6 ô (`BONE_SLOTS`) quanh hình võ hồn đang xem. Bấm ô trống thì túi tô vàng các món hợp ô.
- **Hồn hạch:** vòng đan điền 6 ô (`CORE_SLOTS`) quanh tâm; bộ 2 / 4 món sáng theo màu bộ.
- **Võ hồn:** đội `TEAM_SIZE` ô là thẻ võ hồn (bấm để xem; kéo đổi chỗ), ra trận, `MAX_RINGS` vòng hồn hoàn màu niên hạn kèm hồn kỹ, sao, cấp. Vòng chưa mở vẽ nét đứt kèm cấp bình cảnh.
- **Chia việc với bảng Đội hình (V):** chọn đội, ra trận, gắn / tháo / đổi đồ làm ngay ở búp bê. Bảng Đội hình chỉ giữ việc nâng cao (xếp đội chi tiết, thức tỉnh, dung hợp, danh sách võ hồn).

### Chỉ số do server tính
- Client gửi `stats {rowId?}` theo nhịp `ASK_CD` (như `bag` / `vohons`); xin lại khi mở bảng và mỗi khi nhận `vohons` / `bag` / `resonance`.
- Server trả tin riêng `stats {rowId, total, base}` bằng đúng `calcStats` như `recalc` (hồn cốt, hồn hạch, cộng minh, tiên thảo; võ hồn đang hóa Chân Thân nhân thêm sinh lực). `base` là khi không gắn hồn cốt / hồn hạch. Client không tính lại.
- Chỉ số tách nhóm Chính (sinh lực, hồn lực, công) / Phụ (tốc độ, chí mạng, sát thương chí mạng), kèm phần cộng từ hồn cốt / hồn hạch.
- Cột chỉ số có khối "Từ trang bị hồn sư" (công mỗi đòn, giảm sát thương nhận, may mắn), cũng lấy từ tin `stats`.

### Gắn / tháo ngay trên bảng
`client/src/charPanel.ts`. Dải chọn võ hồn quyết định võ hồn nhận hồn cốt / hồn hạch (đổi võ hồn thì bỏ ô đang chọn).
- Bấm một ô hồn cốt / hồn hạch: Túi tự mở nếu đang đóng (màn hẹp thì Túi nổi lên), chuyển sang nhóm Hồn cốt / Hồn hạch. Món hợp ô lên đầu và viền vàng, món khác mờ, kèm thanh "Thôi" (`hud.setBagFocus`).
- Bấm món sáng thì gửi đúng lệnh có sẵn (`equip` / `equipcore` kèm võ hồn và ô).
- Ô đã có món: thẻ dưới búp bê hiện món đang gắn kèm nút "Tháo về túi" (`unequip` / `unequipcore`). Túi vẫn sáng món hợp để thay (món cũ về túi do server làm).
- Nút "Ra trận" gửi `switch` theo ô đội (tắt khi võ hồn đang ra trận hoặc chưa trong đội).
- **Client không đổi tạm:** ô chỉ đổi khi tin `bag` / `vohons` mới về. Lệnh vừa gửi từ bảng nhận tin `log` của server trong vài giây (kể cả lý do từ chối: đang giao chiến, túi đầy, sai ô) hiện thành dòng trên bảng (`charLog`).

### Kéo thả và thao tác nhanh
`client/src/dragDrop.ts`, `actionCard.ts`, nối ở `hud.ts` / `charPanel.ts`.

**Engine kéo bằng con trỏ** (không dùng kéo-thả HTML5):
- Chuột kéo sau khi dịch `MOUSE_SLOP`. Chạm giữ `HOLD_MS` mà không dịch quá `TOUCH_SLOP` mới nhấc (vuốt trước đó là cuộn danh sách).
- Bóng mờ `GHOST_ALPHA` theo con trỏ. Ô nhận thả (`Zone`: ô búp bê, dải "Gắn nhanh", ô túi, cả vùng Túi) tô viền xanh (hợp lệ) / đỏ (không hợp, kèm lý do cạnh bóng: sai loại, chưa có võ hồn…) ngay khi bắt đầu kéo, theo `acceptsItem`.
- Esc hủy. Thả sai chỗ hoặc ra ngoài hai bảng thì bóng bay về ô cũ (bán / phân giải chỉ bằng nút). Bảng vẽ lại giữa chừng (tin mới) không làm đứt lần kéo.

**Server quyết định:**
- Thả vào ô hợp lệ chỉ gửi lệnh qua `mountCommand` / `unmountCommand` (`equip`, `equipcore`, `equipgear`, `unequip`, `unequipcore`, `unequipgear`). Ô chỉ đổi khi tin `bag` / `gear` về; lý do từ chối hiện ở dòng thông báo của bảng.
- Kéo ô búp bê → Túi = tháo. Hồn hạch ô này → ô kia = đổi ô (server đổi chỗ trong cùng võ hồn). Kéo giữa hai ô túi đổi thứ tự hiển thị.

**Bấm một lần** ô túi: thẻ thao tác (`cardActions`) theo loại món: [Mặc / Gắn / Dùng] [So sánh] [Khóa / Mở khóa] [Phân giải] (trang bị; server yêu cầu đứng cạnh Thợ rèn).
- "Bán" không có trên thẻ vì bán cần đứng cạnh thương nhân (hộp thoại NPC).
- Ô đang mặc / gắn trên búp bê: thẻ [Tháo] (tab Trang bị) hoặc thẻ dưới búp bê như mục trên.

**Bấm đúp** (hai lần bấm cùng món trong 350 ms; không dùng sự kiện `dblclick` vì lần bấm đầu vẽ lại bảng):
- Ô túi → `quickCommand` = `smartTarget` rồi `mountCommand`. Luôn vào **võ hồn đang xem trên búp bê** (không phải võ hồn ra trận).
  - Hồn cốt vào đúng vị trí; hồn hạch vào ô trống thấp nhất, đủ ô thì thay món yếu nhất; trang bị vào ô của mẫu.
  - Đan hồi sinh lực / hồn lực thì dùng luôn.
- Ô búp bê đang có món → tháo.

**So sánh hai cột** [Đang mặc] | [Món mới]: mỗi chỉ số một hàng, cột mới có ▲ xanh / ▼ đỏ / = kèm chữ.
- Số từ `compareRows` (`bag.ts`, dùng chung với chú thích và khung chi tiết): hồn cốt, hồn hạch theo `statsOf`, trang bị theo `equipStats` ở `shared/data.ts`.
- Món đang mặc lấy bằng `currentFor` (trang bị theo ô của mẫu, hồn cốt / hồn hạch theo `wornFor`).

**Bàn phím:** Tab đi qua các ô (đều là nút); Enter mở thẻ (nút đầu được focus, Enter lần nữa chạy nút chính); Shift+Enter trên ô túi = mặc nhanh, trên ô đang gắn / mặc = tháo; Esc đóng thẻ / bảng so sánh.

### Tab Trang bị
`client/src/charPanel.ts`.
- **Bố cục** theo `EQUIP_SLOTS`: cột trái Vũ khí, Vòng trái, Nhẫn trái, Đai; cột phải Mũ, Dây chuyền, Vòng phải, Nhẫn phải, Giày; giữa hình hồn sư, ô Áo đè lên thân.
- **Hiển thị ô:**
  - Ô có món: ảnh mẫu (`equipIconChain`), khung viền theo bậc (`equipFrameKey`; hai bậc cao nhất, Thần Khí và Chí Bảo, có quầng sáng), "+N" cường hóa ở góc.
  - Ô trống: hình bóng mờ của ô (`equipSlotIconKey`).
  - Số ô đang mặc hiện ở tiêu đề và nhãn tab. Chú thích ô: bậc, cấp vật phẩm và từng chỉ số lấy từ `compareRows` (không tính lại).
- **Thao tác:** bấm ô trống thì ô sáng viền vàng, Túi lọc và sáng các món hợp ô; bấm món sáng là gửi `equipgear`. Ô có món theo "Kéo thả và thao tác nhanh" (thẻ thao tác, bấm đúp / kéo ra Túi = `unequipgear`). Ô nhận thả và nhấc ra được.
- **Ranh giới ô:** vòng tay / nhẫn trái và phải là **hai mẫu riêng** (chỉ số chính khác nhau, `equipgear` không có tham số ô).
  - Không đổi chéo trái ↔ phải; "ô đôi" không thay món theo chỉ số.
  - Món vào đúng ô của mẫu; ô đã có món thì server đổi chỗ, món cũ về túi. Ô đội không nhận đồ.

### Hợp đồng dữ liệu
`client/src/charBagContract.ts`: không DOM, không đọc state toàn cục.
- Kiểu: `SlotRef {tab, slot, rowId}` (`rowId` là võ hồn nhận hồn cốt / hồn hạch, null ở trang bị và ô đội), `DropTarget`, `DragSession`, `WindowState`.
- Hàm thuần: `acceptsItem` (ô có nhận món không), `smartTarget(item, view)` (ô đúng của món, một chỗ duy nhất), `mountCommand` / `unmountCommand` (ánh xạ sang lệnh server).

### Điện thoại, phím tắt, hiệu năng
- **HUD laptop (#722):** cột trái chừa chỗ cho khung chat (`--chat-res`), chat đóng chỉ giữ vài dòng mới nhất (`--log-max`); đầu bảng Tổ đội xuống dòng thay vì cắt nút. Màn logic ≤ 560 px cao (`ui-h560`, vd 960×540): chat 2 dòng, bảng Tổ đội dời sang bên phải khung chỉ số, toast tối đa 3 dòng và che tạm ô nhiệm vụ; không đổi logic toast.
- **Chat, log hệ thống và toast (#755, #599):** dòng hệ thống (`chat.log` / tin `log`) được phân luồng ở client theo tín hiệu có cấu trúc, không đọc chữ (`client/src/chatRoute.ts`): dòng **quan trọng** (màu cảnh báo / lỗi cam đỏ, hoặc có nút hành động như "Thêm lại") hiện ở mọi tab; tin boss / tinh anh (màu theo dữ liệu boss) đánh dấu tường minh bằng `hud.logImp`; dòng **thường** (nhặt đồ, kinh nghiệm, Hồn Tệ…) chỉ vào tab **Tin** (hệ thống, tab thứ 7, `CHAT_TABS`) để không chen vào hội thoại ở tab Tất cả. Hai dòng giống hệt trong `SYS_MERGE_MS` gộp thành "×n"; dòng thường giữ tối đa `SYS_KEEP` để không đẩy mất lịch sử chat. Chip lệnh (`#cmdChip`) thu hẹp để không bao giờ chạm cột toast ở phải (M5 #794); màn thấp (`ui-h560`) nâng chip lên khỏi hàng đội hình. **Chữ bay khi nhận** (`pickupFx.ts`, `GameScene.pickupFloat`): đồ nhận thêm (tin `bag` / `bagd`), Hồn Tệ tăng, kinh nghiệm tăng (gom `XP_FLUSH_MS`) bay trên đầu mình; số dòng theo mức hiệu ứng (`MAX_LINES`), Giảm chuyển động thì đứng yên rồi mờ. Chỉ hiển thị, không đổi luật.
- **Màn thấp (`ui-h460`, điện thoại ngang 844×390 trở xuống):**
  - Đầu bảng gọn; dải chọn võ hồn và nhóm lọc của Túi một hàng cuộn ngang (không xuống dòng).
  - Bốn tab búp bê chia đều một hàng (tên trên, số ô dưới); nút chạm ≥ 36 px.
  - Dải "Gắn nhanh" tự xuống dòng nên Túi không tràn ngang ở 667 / 568 px.
  - Từ 640 px logic trở xuống một bảng một lúc.
- **Chạm:** kéo thả (giữ `HOLD_MS` rồi kéo), bấm đúp, thẻ thao tác, và gắn bằng "bấm ô rồi bấm món sáng" (Túi tự nổi lên, gắn xong về bảng Nhân vật) đều chạy bằng sự kiện chạm ở 844×390 và 360×640.
- **Phím:** H mở / đóng Nhân vật, B mở / đóng Túi, `[` / `]` chuyển tab búp bê, Esc đóng. Phím C không mở bảng Nhân vật vì đè mất kỹ năng hồn cốt tay phải (Z / X / C).
- **FPS khi kéo** (Chrome headless, GPU thật, đo lúc làm): con trỏ chỉ dời bóng bằng `transform`, bảng không vẽ lại giữa chừng, nên kéo bằng chuột 1280×720 và bằng chạm 844×390 giữ ≥ 100 khung/giây, khung dài nhất ≤ 21 ms.

### Điều khiển: thứ tự ưu tiên lệnh và chip trạng thái (M5 #751)
Luật ở `shared/control.ts` (hàm thuần `startCmd`, `topCmd`; kiểm thử `server/scripts/control-test.ts`), client phân xử ở `GameScene.begin`, server giữ khoá mục tiêu (`rooms/lock.ts`) và tự săn. Nguồn lệnh lái nhân vật, **ưu tiên giảm dần**:

1. **Phím / cần điều khiển** (giữ phím): thắng mọi lệnh đang chạy (huỷ bấm đi, khoá, cờ, tự săn).
2. **Bấm nền** (bấm đi tới điểm, M4): huỷ khoá, cờ, tự săn. Bấm hồn thú (khoá) thay điểm bấm cũ; bấm nền và khoá thay nhau, cả hai là thao tác trực tiếp của tay.
3. **Khoá mục tiêu** (bấm hồn thú / Tab, M3): huỷ cờ và tự săn.
4. **Cờ tự đi** (phím Y, bản đồ khu vực, dấu Tập trung): huỷ tự săn; **không bật được** khi đang bấm đi hay đang khoá (báo lý do, gỡ lệnh kia rồi thử lại).
5. **Tự săn** (phím T, bảng Tự động): **không bật được** khi có lệnh nào cao hơn đang chạy. Server cũng từ chối khi đang khoá (`d.target`), vì khoá do server giữ.

Lệnh bị huỷ hoặc không bật được luôn có lý do: dòng log và câu trên chip. Server tự huỷ khoá (hồn thú chết / mất, quá xa, vùng an toàn, hồn sư gục; mã `hunt` chỉ là lưới an toàn, vì bật tự săn khi đang khoá đã bị từ chối) thì tin `lock {id: "", why}` mang mã lý do (`LockWhy`). Bấm / Tab bị từ chối ngay lúc bấm (gục, vùng an toàn, quá xa, hồn thú mất, trứng `egg`) cũng trả `lock {id: "", why}`; cùng lý do lặp trong 1 giây chỉ báo 1 lần (vẫn trả `lock ""` để bỏ khoá ảo).

**Chip trạng thái** (`client/src/cmdChip.ts`, `#cmdChip`, giữa dưới màn hình, trên nhắc nhặt đồ): hiện lệnh ưu tiên cao nhất đang chạy, nền son: "Đang đánh: <tên> ×", "Đang đi tới… ×", "Tự đi cờ ×", "Tự săn ×". Bấm × huỷ đúng lệnh đó (khoá: bỏ khoá; bấm đi: dừng; cờ: dừng tự đi, cờ còn; tự săn: gửi tắt). Khi một lệnh bị huỷ chip đổi sang nền giấy ghi lý do vài giây (`WHY_MS`) rồi ẩn. Chỉ hiển thị, không thêm số cân bằng.

### Quản lý bảng và Esc (U1 #754)
Lớp mỏng `client/src/panelStack.ts` (không khung mới, không đọc state game): theo dõi `hidden` của các bảng (Nhân vật, Túi, Đội hình, Cộng minh, Bạn bè, Thế giới, hội thoại NPC, Tự động, Cài đặt; thêm cửa nhỏ: menu người chơi, danh sách kênh, tổng kết tự săn) và giữ thứ tự **dưới → trên**: bảng vừa mở hoặc vừa bấm vào (kể cả bấm viền / khe) ở trên cùng và có lớp (`z-index`) cao nhất; `dualWindow.ts` chuyển thẻ Nhân vật / Túi cũng nâng bảng trong ngăn xếp.
- **Esc** (`GameScene.setupInput`), thứ tự: màn đổi ngoại hình → bản đồ vùng (N) → khung chat đang mở → **bảng trên cùng (chỉ một bảng mỗi lần nhấn)** → bỏ khoá mục tiêu (M3). Có bảng mở thì Esc không đụng khoá; hết bảng thì Esc bỏ khoá như cũ. Ô nhập đang focus: Esc rời ô rồi mới đến bước trên.
- **Bấm xuyên:** Phaser còn nghe `mousedown` ở cấp window nên `pointerdown` của scene chỉ xử lý khi `downElement` là canvas; bấm vào bảng / nút HUD không `walkTo`, không khoá hồn thú, không chọn người chơi, kể cả khi trạng thái "chuột trên canvas" của Phaser còn cũ.
- **Phím:** mở một bảng (không tính cửa nhỏ) thì nhả phím đang giữ và dừng cần điều khiển; phím đang giữ gửi `keydown` lặp bị bỏ tới khi nhả rồi bấm lại. Tiêu điểm đang ở trong bảng: **Tab** xoay vòng trong bảng (không đổi mục tiêu), **Space / Enter** thuộc nút đó khi tiêu điểm do bàn phím (`:focus-visible`); nút vừa bấm chuột không tính nên Space vẫn đánh.
- **Cài đặt / Tự động mở trên bảng khác (#1044):** hai bảng này gọi `closeCentrePanels` (`panelStack.ts`) để đóng các bảng đang mở bằng đúng hàm đóng của từng bảng (không đặt `hidden` thô), nên `dualWindow`, `aria-expanded`, thẻ so sánh, trang đầu NPC đều được dọn.
- **Bản đồ khu vực và phím mở bảng (#1045):** bản đồ vùng (`#mapview`, lớp phủ z-index 5) che các bảng, nên phím H / V / B / K / L / M và nút Nhân vật / Đội hình / Túi / Cộng minh / Thế giới / Cài đặt / Tự động đóng bản đồ trước (`GameScene.clearForPanel`) rồi mới mở bảng.
- Không đổi thứ tự ưu tiên lệnh M5 và thẻ hướng dẫn M6; kiểm thử `npm run test:panel-browser --prefix client` (bấm 6 điểm trên bảng, bấm dưới con trỏ đứng yên, `mousedown` rơi vào bảng, bấm nền vẫn đi, Esc nhiều lớp có khoá, nhả phím, Cài đặt / Tự động đè lên bảng khác, N rồi phím mở bảng, 960×540).

### Kiểm thử
- Bot nhóm `bag` (gồm `charbag`: lệnh `equip` / `unequip`, `equipcore` / `unequipcore`, `equipgear` / `unequipgear`, `team` / `switch` dựng từ `charBagContract`, server nhận đủ), `team`, `bone`, `core` vẫn phải qua.
- Đổi giao diện thì chụp trước / sau (Chrome headless `--mute-audio`), thử màn ngang ≥ 960 px và điện thoại ngang.

### Khung C2 trong Nhân vật, Thợ rèn và thông báo (C16)
- Nhân vật dùng một khung ngoài C2, dải tab trang trí, lục giác cho ô hồn cốt và vòng đan điền cho hồn hạch; nút và ô giữ viền mảnh. Không đổi bố cục, dữ liệu, bàn phím hay kéo thả.
- Chỉ ba trang Thợ rèn dùng khung C2: Cường hóa hồn cốt, Nâng cấp hồn hạch, Hợp thành trang bị. Các trang cường hóa trang bị, khắc may mắn, phân giải và đổi bộ giữ nguyên.
- Toast lên cấp và toast **nhận hồn hoàn** đạt `rarityOf >= RARE_LOOT_MIN` dùng khung C2. Banner hấp thụ giữ nguyên; không đổi ngưỡng hiếm, âm thanh, thời gian sống hay gộp toast. Marker lấy từ loại món và độ hiếm, không dò tên hoặc màu.
- Chữ sáng trên nền mực đặc; đo tương phản ít nhất 4,5:1. Góc ảnh giữ bằng nine-slice, không kéo méo ảnh lục giác / đan điền. Giữ vùng toast, thanh thao tác, chip trạng thái và thẻ hướng dẫn hiện có; không mở rộng thiết kế điện thoại (Q40).

## Hướng dẫn điều khiển lần đầu (M6 #752)
- Thẻ giấy ở giữa dưới màn hình (`client/src/guide.ts`, `guide.css`; trên thanh kỹ năng, không đè toast / khung nhiệm vụ / khung mục tiêu), hiện khi vào game lần đầu (gắn chuỗi tân thủ của Ngọc Tiểu Cương: tài khoản đã xong chuỗi thì không tự hiện). 4 bước theo việc người chơi vừa làm: đi (WASD / mũi tên / bấm nền), bấm hồn thú để khoá và tự đánh (Tab, Esc, Space), hồn kỹ (U I O P / thanh kỹ năng), nhặt (E) và hấp thụ hồn hoàn (bắt đầu hấp thụ thì xong). Nút "Tiếp" bỏ qua một bước, **"Bỏ qua" tắt cả hướng dẫn** (bắt buộc hiện nhưng không bắt buộc làm, chủ repo duyệt 2026-10-26); nút "Hướng dẫn" (?) ở menu HUD xem lại từ bước 1 mà không đổi trạng thái đã xem.
- Gợi ý một lần theo tình huống (lần đầu bị đánh, lần đầu có hồn hoàn của mình rơi, lần đầu túi còn không quá `GUIDE_BAG_FREE` ô trống), tự tắt sau ít giây, không hiện khi đang chạy hướng dẫn.
- "Đã xem" lưu ở localStorage (`soul-guide-v1:<tên hồn sư>`), không có cột DB / migration; đổi trình duyệt thì hướng dẫn hiện lại một lần (có Bỏ qua). Chữ phím phải khớp `GameScene.setupInput` và `hud.SKILL_KEYS`; đổi điều khiển thì sửa `STEPS` / `HINTS`. Kiểm: `npm run test:flow-browser --prefix client`.

## Lịch sử / issue liên quan
- C12 (#598): `uiIcons.ts` dùng lại bộ `gi_menu_*` có sẵn cho các nút menu/radar, giữ nhãn, phím và ký tự cũ khi thiếu ảnh. Trạng thái cạnh dòng thông tin Kênh chỉ hiện icon, có tooltip và tên truy cập “Đã kết nối” / “Mất kết nối”, không làm rộng khung radar. Overlay rời phòng hiện câu “Mất kết nối với server.”, riêng phiên bị thay thế có thông báo tương ứng; icon HUD phía sau overlay không được coi là nhãn mất kết nối đang nhìn thấy. Không đo ping/chất lượng mạng hoặc đổi hành vi vào lại. Bộ icon bổ sung từ #812 / PR #816 được dùng khi key sẵn có; các key gi_notice_* chưa chèn vào toast C16.
- Cursor C12 (`contextCursor.ts`): PNG pixel 32/64 do Codex vẽ bằng `tools/assets/ui-cursors.mjs`, CSS cursor có fallback. Năm ngữ cảnh: thường, quái, NPC, đồ nhặt hợp lệ từ state đã nhận, nền chặn. Thiếu dữ liệu quyền nhặt thì dùng thường. Chỉ đổi hình, không đổi click/target/hitbox/tin mạng; bấm quái vẫn khóa mục tiêu theo M3. Touch giữ điều khiển hiện có; rời canvas/blur/đổi scene trả cursor cũ.
- Túi dạng lưới UI-1 #351; bảng Nhân vật UI-2 #352 (nay gộp vào 5.16, gắn / tháo ngay trên búp bê, không mở bảng Đội hình).
- Hai cửa sổ, búp bê 4 tab: #453; thiết kế chốt bởi chủ repo 2026-10-24. Các bước: NV1 hai cửa sổ, NV2 gắn / tháo tại bảng, NV3 kéo thả và thao tác nhanh, NV4 tab Trang bị, NV5 điện thoại / phím / đo (#459); NV6 ảnh nền búp bê thay bằng C2 #553, C16 #595 (việc còn lại ở `ROADMAP.md`).
- Hướng dẫn lần đầu M6 #752 (việc con của #746).
- Tích hợp khung C2 C16 #595; mapping được chủ repo chốt trong issue.
- Nhật ký từng bước: `docs/lich-su.md`.

## Thanh kỹ năng và đội hình trong trận (C8)
- Ba nhóm riêng: Hồn cốt (Z / X / C), Hồn kỹ (J, U / I / O / P, R, G nếu có), Vật phẩm (E nhặt; B mở túi, nút Tiêu hao mở nhóm tiêu hao).
- Phím nằm trong góc ô, tên dưới biểu tượng; hồi chiêu quét dạng quạt và số giây chỉ phủ vùng biểu tượng. Ô khóa ghi “Khóa”, thiếu hồn lực ghi “Thiếu lực”; tooltip giải thích điều kiện, tên đầy đủ và tiêu hao. Server vẫn quyết định khả năng dùng và hồi chiêu.
- Trên desktop, tên hồn kỹ xuống dòng đầy đủ; ô tự tăng chiều cao, không cắt bằng dấu ba chấm và không giảm cỡ chữ để ép vừa ô. Bố cục điện thoại giữ theo Q40. Ở desktop hẹp, giữ chiều rộng chat và thu riêng nhóm hồn cốt/vật phẩm; guide nằm phía trên vùng nhân vật để nhường đội hình và vòng báo trước.
- Thẻ đội hình có tên hai dòng; tên dài rút gọn theo từ ở giữa, giữ đầu và cuối để phân biệt. Tooltip luôn có tên đầy đủ, cấp, trạng thái ra trận / gục / tiên cơ và phím đổi. Thanh sinh lực, năng lượng tiên cơ và hồi chiêu đổi lấy từ dữ liệu server.
- Điện thoại ngang thấp: đội hình nằm bên trái nhóm kỹ năng sát mép dưới; ô chạm tối thiểu 44 px, tâm màn hình để trống cho cảnh báo chiêu. Thông báo nổi nằm phía trên thanh hành động.
- Kiểm tra game thật: `npm run test:actionbar-browser --prefix client`; ảnh ghi ngoài repo qua `C8_OUTPUT`. CI `actionbar-preview` chạy hồi quy AFTER và đính kèm ảnh ở 960×540, 1280×720, 1920×1080, không phụ thuộc baseline của nhánh PR. Ở desktop hẹp, chat giữ đủ sáu tab; kiểm đội hình không bị guide che ngay khi guide còn mở và trước khi đổi võ hồn. Giữ lượt cảm ứng 844×390 tùy chọn bằng `C8_TOUCH=1` theo Q40. Tên dài được đo từng ký tự bằng vùng render, overflow và clamp, không chỉ kiểm tra textContent. Dùng lại ảnh có trong manifest; không đổi key, frame, origin.

## Menu hub và màn hệ thống mới (UI v2, cờ `ui2`; #877)

**Mặc định (đợt 5a, 29/10/2026):** cờ `ui2` BẬT mặc định; `?ui=0` là lối thoát (lưu `shh-ui2=0`), `?ui=2` bật lại. Các mục bên dưới ghi "chỉ khi bật ui2" nay là hành vi mặc định. Màn còn giao diện cũ (chưa có ui2): Tự động + tổng kết + Ủy thác offline (`autoPanel.ts`, `offline.ts`, mới chỉ nhận nền giấy), cột chỉ số trái và thanh kỹ năng (chỉ nhận màu qua `ui2-hud.css`, chưa dùng khung kit), chữ phím tắt thanh kỹ năng còn chồng lên bảng (có từ giao diện cũ), mục hub "Chưa có" (Tông Môn, Cửa Hàng, Thành Tựu, Ghép / Rèn).
- **Hub** (`hubMenu.ts`): ngăn kéo bên phải, mở bằng huy hiệu (giữa trên) hoặc Esc khi không còn bảng nào để đóng; Esc lần nữa đóng. Cây menu theo bộ spec UI mục 2: 2 thẻ lớn (Võ Hồn, Nhân Vật), 2 thẻ vừa (Tông Môn, Cộng Minh), lưới 4 cột, rail dọc (Thư, Thông báo, Cài đặt, Chụp ảnh). Mục nào chưa có chức năng thì thẻ / mục rail mờ kèm "Chưa có" (Thư: chờ server + DB); mục đã có chỉ gọi đúng hàm mở của bảng cũ (hub không giữ trạng thái game).
  - **Chấm đỏ / mũi tên xanh toàn hệ** (đợt 4b, Part of #885; `badges.ts`): một kho client, suy ra từ tin có sẵn, không tin server mới. Chấm đỏ (tròn, `new`): Túi có món mới khi Túi đóng (tắt khi mở Túi), Nhiệm Vụ có bài nhận được / chờ trả (chuỗi đang theo dõi + khảo hạch hằng ngày), Phúc Lợi chưa điểm danh. Mũi tên xanh (tam giác, `up`): Võ Hồn đủ mảnh mở / lên sao (`SHARD_UNLOCK`, `starCost`) hoặc có hồn hoàn trong túi hấp thụ được cho võ hồn ra trận (còn ô vòng, niên hạn trong `ringLimit` ô kế tiếp; server vẫn kiểm). Hub (thẻ, rail, huy hiệu menu) và các nút HUD cũ (Túi, Đội hình, Hồn sư, Cộng minh: `data-badge`) cùng đọc kho; chấm là hình, không chỉ màu.
  - Thẻ **Nhiệm Vụ** của hub (`revealQuestTracker`) chỉ mở rộng khung theo dõi nhiệm vụ ở góc phải và báo số nhiệm vụ đang làm; nhận / trả vẫn ở NPC (chưa có sổ nhiệm vụ độc lập). Cỡ chữ lớn (`a11y-fs-1` / `-2`): ngăn kéo rộng 480 / 560 px, lưới 3 cột, thừa chiều cao thì cuộn trong ngăn kéo.
  - **Thông báo** (`noticeScreen.ts`, nhật ký trong `noticeLog.ts`): hộp Giấy giữ `LOG_MAX` (50) toast gần nhất của phiên (toast gộp ×n cộng vào dòng cũ), mới nhất ở trên, có nút Xoá hết; tải lại trang thì mất. **Chụp ảnh**: lưu khung hình game (không gồm HUD DOM) thành PNG qua trình duyệt, không gửi đi đâu.
  - Esc không còn bảng nào mở thì mở hub; test trình duyệt (`actionbar-browser`) phải đóng hub đó trước khi bấm tiếp (`escClose`). `actionbar-browser` / `panel-browser` / `flow-browser` chạy mặc định ở chế độ ui2 (từ đợt 5a; `C8_UI0=1` để chạy giao diện cũ).
- **Xếp Hạng** (`rankScreen.ts`): đọc tin `rank` / `rankTop`, hai tầng (nhóm rồi chip hạng mục), bục top 3, bảng điểm, dòng "của tôi" ghim đáy, trạng thái tải / rỗng / chưa có hạng / lỗi + thử lại. Chưa có: thẻ nhỏ khi bấm một dòng, bộ nối Elo / cộng minh / tông tuần.
- **Lịch Hoạt Động** (`calendarScreen.ts`): đọc tin `calendar`, bảng tuần 7 cột, thẻ đang mở / sắp mở / đã qua kèm dấu hình, đếm lùi theo giờ server. Chưa có nút "Đến" (cần tin dẫn đường riêng).
- **Phúc Lợi** (`welfareScreen.ts`): đọc tin `welfare`, lưới 7 × 3 theo `CHECKIN`, ký bù xác nhận 2 bước khi tốn phí. Giờ, phí, quà do server quyết; client chỉ gửi chỉ số ô.
- Cả bốn chỉ dựng khi cờ `ui2` bật (tắt thì giao diện cũ không đổi); đồng hồ máy chủ ở `svClock.ts` chỉ để đếm lùi hiển thị. Test: `npm run test:uiscreens --prefix client`.
- **Cài đặt + trợ năng** (`audio/settingsPanel.ts`, `a11y.ts`, `ui2-settings.css`; #600): 5 tab (Âm thanh, Hiệu ứng, Giao diện, Trợ năng, Phím tắt), tab dọc bên trái và hàng nhãn / điều khiển đồng nhất khi bật ui2, một dải nút khi tắt. Trợ năng lưu `localStorage` `shh-a11y-v1`, có tác dụng cả khi tắt ui2: **cỡ chữ** 3 mức (Chuẩn / Lớn 1,25× / Rất lớn 1,5×, đổi thang `--fs-*` qua lớp `a11y-fs-*`; chữ Phaser trên đầu nhân vật không đổi), **mù màu** (lớp `a11y-cb`: niên hạn / độ hiếm có hình ○ △ □ ◇ ★ ở chip, ô, tab; tên võ hồn ở HUD có nhãn hệ `[Lôi]`; tên hồn thú có ký hiệu bậc), **giảm chuyển động** (lớp `reduce-motion` có sẵn của `combatFx`, mở rộng ra mọi hoạt ảnh CSS). **Bảng phím tắt** chỉ xem (`KEY_GROUPS` ở `a11y.ts`, test đối chiếu với `GameScene.ts` / `hudBar.ts`); đổi phím chưa làm. Test: `npm run test:a11y --prefix client`.
- **Bảng Nhân vật theo kit Mực** (`charPanel.ts`, `actionCard.ts`, `ui2-charpanel.css`; đợt 2a-1, Part of #885): chỉ khi bật ui2. Khung Mực (`f2-muc-lon`), tab kit, nút chính / phụ kit; **ô theo hạng**: mảnh ô kit không có vạch 9-slice nên vẽ bằng `background` (o_trong, khung o_hiem_1..5 theo `rarityOf`, o_chon khi chọn) kèm vạch dưới chân dày dần theo hạng; thẻ thao tác là Mực nhỏ, bảng so sánh hai cột là Giấy (▲ / ▼ vẫn có chữ + vạch trái); trạng thái chờ chỉ số dùng `stateBox`. Vẫn 4 tab búp bê (Trang bị, Hồn cốt, Hồn hạch, Võ hồn): kiểm kê 2a ghi "6 tab" nhưng chưa có dữ liệu cho tab thứ 5, 6 nên chưa thêm. Màn nhỏ nhất 960×540, ba cỡ chữ `a11y-fs-*`. Chưa làm: Túi (PR sau), tooltip giữ Shift so sánh, hộp xác nhận (chưa có `askDialog`; tháo đồ đảo ngược được nên không cần).
- **Bảng Nhân vật theo kit Mực** (`charPanel.ts`, `actionCard.ts`, `ui2-charpanel.css`; đợt 2a-1, Part of #885): chỉ khi bật ui2. Khung Mực (`f2-muc-lon`), tab kit, nút chính / phụ kit; **ô theo hạng**: mảnh ô kit không có vạch 9-slice nên vẽ bằng `background` (o_trong, khung o_hiem_1..5 theo `rarityOf`, o_chon khi chọn) kèm vạch dưới chân dày dần theo hạng; thẻ thao tác là Mực nhỏ, bảng so sánh hai cột là Giấy (▲ / ▼ vẫn có chữ + vạch trái); trạng thái chờ chỉ số dùng `stateBox`. Vẫn 4 tab búp bê (Trang bị, Hồn cốt, Hồn hạch, Võ hồn): kiểm kê 2a ghi "6 tab" nhưng chưa có dữ liệu cho tab thứ 5, 6 nên chưa thêm. Màn nhỏ nhất 960×540, ba cỡ chữ `a11y-fs-*`. Chưa làm: Túi (PR sau), tooltip giữ Shift so sánh, hộp xác nhận (chưa có `confirmDialog`; tháo đồ đảo ngược được nên không cần).
- **Bảng Túi theo kit Mực** (`hudBag.ts`, `ui2-bag.css`; đợt 2a-2, Part of #885): chỉ khi bật ui2, cùng cách làm với bảng Nhân vật. Khung Mực, tab lọc nhóm / nút kit, lưới ô theo hạng (`data-rare` từ `rarityOf` chọn khung o_hiem_1..5 + vạch dưới chân dày dần), ô hợp / mờ khi đang chọn món cho búp bê, trạng thái túi trống dùng `stateBox`. Thẻ thao tác và bảng so sánh dùng chung `actionCard.ts` (đã ui2 hoá ở 2a-1). Không đổi lệnh, kéo thả, bàn phím. Phân giải từ thẻ thao tác đi qua `confirmDialog` (xem dòng dưới).
- **Hộp xác nhận chung + khóa chống bấm đôi** (`confirmDialog.ts`, `confirm.css`; Part of #885): `confirmDialog({ title, body, confirm, danger }, onYes)` mở hộp modal (`role=alertdialog`), mặc định focus nút Hủy, nút nguy hiểm đỏ và tách riêng, Esc / bấm nền = hủy, Tab xoay giữa hai nút, phím khác không lọt xuống game; chữ `body` phải nêu hậu quả cụ thể. `lockButton` vô hiệu nút ngay sau bấm (nút Xác nhận tự dùng), `guardOnce` bọc lệnh không có nút. Đã áp cho: Phân giải (thẻ thao tác ở Túi, lò rèn nhiều món), bán món từ `SELL_CONFIRM_DONG` hoặc đã cường hóa, Rời đội. Hộp thay kiểu "bấm hai lần" cũ ở ba chỗ đó (mở rộng túi vẫn bấm hai lần). Hoạt động cả khi tắt ui2. Test: `npm run test:confirm --prefix client`.
- **Bảng Võ Hồn / Đội hình theo kit Mực** (`hudRoster.ts`, `ui2-vohon.css`; đợt 2b-1, Part of #885): chỉ khi bật ui2. Khung Mực (`f2-muc-lon`), **5 tab dưới** (Đội hình, Hồn kỹ, Hồn cốt, Hồn hạch, Mảnh; tab dính đáy vùng cuộn, đang chọn có vạch dưới chân, một hàng ở 3 cỡ chữ). Tab Đội hình giữ thẻ `cards.ts` và luật chọn ô / đổi chỗ như cũ; tab Hồn kỹ có **bánh xe**: 4 ô tròn U / I / O / P quanh chân dung võ hồn, ô Chân Thân (R) nhỏ cố định, dòng chi tiết ô đang chọn kèm nút Bỏ, danh sách hồn kỹ phía dưới (cùng `skSlot`, cùng tin `loadout`, server vẫn quyết định). Hồn cốt / Hồn hạch / Mảnh chỉ đổi tông Mực và chuyển vào tab; bố cục riêng (6 ô tròn, vật trung tâm) ở PR sau. `openBones` / `openCores` tự chuyển sang tab tương ứng. Tắt cờ thì bảng một cột cuộn như cũ.
- **Đợt 2d: Cộng minh, menu người chơi, Kênh, Thế giới, bảng tông** (`hudMisc.ts`, `hud.ts` `showPlayerMenu`, `hudQuest.ts` `renderTongRank`, `ui2-social.css`; Part of #885): chỉ khi bật ui2, Bạn bè / màn gục dùng lại từ #1256. Cộng minh khung Mực lớn, tab trụ cột và mốc có vạch / viền dày (hình, không chỉ màu), bảng xếp hạng có trạng thái tải (bộ xương) / rỗng / lỗi + Thử lại (quá `RESO_TOP_WAIT_MS` không có tin thì báo lỗi, chỉ ở hiển thị); menu người chơi và danh sách Kênh khung Mực nhỏ (kênh có thanh đầy-vơi + chữ "Đầy"); Thế giới khung Giấy; bảng tông tuần có thanh so điểm. Xóa bạn, Chặn, Mời ra khỏi đội dùng hộp xác nhận chung **`confirmDialog`** (`confirmDialog.ts`, #1270; nút an toàn lấy tiêu điểm, Esc huỷ); tắt cờ ui2 thì chạy ngay như cũ, server không đổi (`askThen` ở `hudMisc.ts`).
- **Hộp thoại NPC + sổ nhiệm vụ theo kit Giấy** (`hudNpc.ts`, `hudQuest.ts`, `ui2-npc.css`; đợt 3a, Part of #885, #596 #597): chỉ khi bật ui2 (`?ui=2`). Khung Giấy (`f2-giay-lon`), chân dung 96 px + tên + chức danh, lời thoại là bong bóng giấy, lựa chọn là danh sách dọc (nút phụ, dấu ▸, "Tạm biệt" tách riêng). Trang nhiệm vụ có **3 tab** Đang làm / Hằng ngày / Tông (đọc từ tin `quest` / `daily` / `tong` có sẵn, chấm khi có bài mới / chờ trả; dưới 2 tab thì không vẽ thanh); NPC không giao bài có thêm lựa chọn "Sổ nhiệm vụ" (tóm tắt các chuỗi đang làm). Nhận / trả chỉ bấm được ở đúng NPC, chỗ khác nút khoá và ghi "Gặp <NPC>". **Nút Đến** (`questTarget` suy đích từ `QuestGoal.map` / `.npc` và `QuestChain.map`, không tin server mới) đóng hộp thoại rồi đi bằng `calendarGo` / cờ "Đi tới" có sẵn (`bindNpcGo`). Kit chưa có nút / ô / thanh Giấy và 2 tab Giấy: dùng mảnh nút / tab dùng chung và token CSS (`--paper*`, `--son`). Hộp thoại thợ rèn (`data-c16-page`) giữ khung cũ tới đợt 3c; cửa hàng đợt 3b. Hướng dẫn tìm đường: nút Đến + dấu bản đồ nhỏ có sẵn.
- **Đăng nhập / chọn nhân vật / màn lỗi / mất kết nối theo kit Giấy** (`main.ts`, `ui2-login.css`; đợt 4a, Part of #885): chỉ khi bật ui2. Thẻ `#card` nhận khung `f2-giay-lon` (lớp `l2`), mỗi màn đúng **một nút chính** (mảnh nút chính của kit), nút khác là nút phụ chỉ viền; lỗi có dấu ▸ + `role="alert"`. Luồng đăng nhập / token / Google không đổi. **Banner "Mất kết nối. Đang nối lại… (n/5)"** (`autoReconnect`, `#net2`): khi `onLeave` (trừ mã 4001), thử `/api/me` bằng token hiện có tối đa 5 lần cách nhau 1–5 giây và khoá nhập; server trả lời thì vào lại phòng như đổi bản đồ, phiên hết hạn hoặc hết lượt thì về màn "Đã rời" như cũ. Còn thiếu: chấm ping / mất gói trên HUD (kiểm kê #9), onboarding (#10).
- **Hồn cốt / Hồn hạch / Mảnh theo kit Mực** (`hudRoster.ts`, `ui2-hon-cot.css`; đợt 2b-2, Part of #885): chỉ khi bật ui2, nằm trong ba tab dưới của bảng Võ Hồn. Hồn cốt: 6 ô quanh võ hồn dùng ô theo hạng như bảng Nhân vật (khung `o_hiem_1..5`, vạch dưới chân dày dần). **Hồn hạch: 6 ô tròn** quanh võ hồn (số ô góc dưới phải, sao góc trên, vòng trong dày dần theo sao, chọn = vòng ngoài + vầng sáng; tên bộ ở nhãn đọc màn hình và danh sách bộ), tab này có ô chọn võ hồn riêng (trước chỉ đổi được ở tab Hồn cốt). Chỉ số, thẻ món, bộ hồn hạch, bảng cường hóa / nâng cấp và Mảnh đổi sang chữ `--fs-*` (theo cỡ chữ trợ năng), nút 32 px, ô 44 px; Mảnh rỗng dùng `stateBox`. Cường hóa / nâng cấp có nguyên liệu quý (đã cường hóa, từ 10.000 năm / 4★) hỏi lại bằng `confirmDialog` (cả khi tắt ui2); không đổi tin server hay số. Ảnh: `node client/scripts/ui-shots.mjs --only hon-cot --ui2 [--fs 1|2]`; `PANEL_QS="?ui=2"` cho `test:panel-browser`.
- **Làm quen, chấm ping, mũi tên mục tiêu** (`onboard.ts`, `pingMeter.ts`, `questArrow.ts`, `ui2-onboard.css`; Part of #885, kiểm kê UI #9 #10 #11): chỉ khi bật ui2, không thêm tin server.
  - **Làm quen** nối tiếp chuỗi hướng dẫn điều khiển (`guide.ts` gọi `onboardBegin` khi người chơi xong / bỏ qua 4 bước): 6 bước chọn võ hồn (V) → nhiệm vụ đầu → mở Túi (B) → hấp thụ hồn hoàn → xem bản đồ (N / M) → mở menu. Mỗi bước tô đúng nút (vòng viền nhấp nháy + mũi nhấn ▼; giảm chuyển động thì đứng yên), bước xong khi bảng tương ứng mở (đọc `hidden` của DOM) hoặc khi `onboardEvent("absorb")`; "Bỏ bước" / "Làm sau" sang bước kế, "Bỏ qua" tắt hẳn. Tiến độ ở localStorage `soul-onboard-v1:<tên hồn sư>`; tài khoản cũ (chuỗi tân thủ xong từ trước) không có bản ghi nên không bị hỏi. Thẻ ở giữa màn, nằm trên bảng lớn, chừa thanh kỹ năng; hộp NPC mở thì ẩn, xem lại hướng dẫn điều khiển thì tạm ẩn.
  - **Chấm ping** dưới thông tin radar: RTT đo từ số `seq` của input (`PlayerState.seq` server đã trả sẵn cho dự đoán chuyển động), làm mượt EMA; mẫu chỉ có khi người chơi vừa đổi hướng đi, quá `PING_STALE_MS` thì hiện "Chưa đo". Bốn mức mỗi mức một hình + một chữ (● Tốt / ▲ Chậm / ■ Kém / ○ Chưa đo, ngưỡng `PING_WARN_MS` / `PING_BAD_MS`), phòng đóng thì "Mất kết nối".
  - **Mũi tên mục tiêu nhiệm vụ**: `GameScene.uiTick` dùng điểm `questTargets` đã tính cho bản đồ nhỏ (NPC, vùng săn, cổng đi tiếp); mục tiêu nào đang trong màn thì không vẽ; ngoài màn thì mũi tên nằm trên rìa khung chừa cột HUD, kèm nhãn và khoảng cách (ô). Chưa có đường chấm trên radar.
  - Test: `npm run test:onboard --prefix client`.
