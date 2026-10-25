# Mỹ thuật: hồn sư LPC

**Hồn sư = LPC.** Ngoại hình của hồn sư là LPC, có hai cách tạo: **Mẫu dựng sẵn** (`LPC_PRESETS`) và **Tự tạo** (`LPC_PARTS`). Cả hai lưu `Looks.mode = lpc`.
- Dữ liệu cũ (`Looks.mode = preset`, năm số `sex`..`skin`, sprite PixelLab cũ) không còn được tạo. `/api/looks` và thợ may nhận preset từ client cũ nhưng đổi ngay sang LPC gần nhất (`parseNewLooks`).
- Tài khoản đã chọn preset **tự chuyển sang LPC lúc nạp** (`presetToLpc`, bên dưới). Server vẫn đọc được dữ liệu preset cũ (`parseLooks`); client không còn đường vẽ preset.
- Trang bị áo / mũ hiện lên lớp LPC.

## Danh mục và đóng gói
**Hồn sư chế độ Tự tạo** dùng danh mục `LPC_PARTS`:
- Danh mục `LPC_PARTS` (`shared/data.ts`, kèm `LPC_SLOTS`; `LPC_RAMPS` là dải màu cho tô màu lúc chạy; `LPC_SHEET` là quy cách sheet). Mỗi món có `style`: `dong` = đồ phương Đông, `trung` = trung tính, `tay` = nghiêng Tây. Tiêu chí chọn món: đủ hoạt ảnh walk / slash / spellcast / hurt, idle 2 khung nếu có, hợp phong cách cổ trang, đọc được giấy phép; không có vũ khí, giáp tấm, mũ sắt, cánh, đuôi.
- `tools/assets/lpc-parts.mjs` đóng gói mỗi lớp / thể hình / màu vẽ sẵn thành MỘT sheet `shared/assets/lpcparts/lpcp_*.png` (hướng s / e / n, hàng hurt chỉ hướng xuống, chỉ các khung game dùng, gốc dời về chân (32, 58), PNG-8 khi được) cùng `manifest.json`.
- Ảnh không đổi màu, không viền. Tô màu, viền `#1a1020`, bảng màu chung và 4 hướng → 8 hướng (tây lật) làm lúc chạy ở client khi ghép các lớp theo zPos.
- Ghi công từng món ở `art/CREDITS.md` (mục `### lpc-parts`, cờ SA); công cụ dừng nếu không đọc được giấy phép. `npm run check` kiểm mọi món có sheet, manifest khớp, giấy phép đã ghi và báo dung lượng tổng (mục tiêu `LPC_SHEET.budgetBytes`).
- Lớp trang phục phương Đông (C3) thêm vào cùng danh mục, style `dong`.

## Dữ liệu ngoại hình
- `Looks.mode`: `lpc` (mọi ngoại hình mới) hoặc `preset` (dữ liệu cũ năm số, chỉ đọc). Thiếu `mode` (client cũ, tài khoản cũ) = `preset`.
- Chế độ `lpc` mang thêm `Looks.lpc` (`LpcLooks`, `v: 1`):
  - `body`: thể hình, chỉ số trong `SEXES`;
  - `parts`: ô → mã món trong `LPC_PARTS` (bắt buộc có `body` và `head`);
  - `colors`: `skin` / `eye` trong `allow` của `LPC_RAMPS.body` / `eye`; màu từng ô trong `allow` của chất liệu đổi màu của món, hoặc trong `colors` của món vẽ sẵn; thiếu = màu gốc.
- `parseLooks` / `parseLpc` chỉ nhận mã và màu có trong danh mục, đúng ô, đúng thể hình (`sex` của món), mỗi ô một món, không quá số ô của `LPC_SLOTS`, không khóa thừa; sai chỗ nào thì null (HTTP 400, không tạo nhân vật). `mode` lạ cũng bị từ chối. Ở `lpc`, `sex` = `lpc.body`, bốn số preset còn lại là 0 và không dùng.
- Lưu và đồng bộ bằng chuỗi gọn `encodeLpc` (`1|<thể hình>|<da>|<mắt>|<mã>[=<màu>],…`; `decodeLpc` đọc lại và kiểm lại theo danh mục): cột `accounts.looks_lpc` (TEXT, trống = preset; `server/sql/029_account_lpc.sql`) và trường công khai `PlayerState.lpc` (trống = preset; người khác thấy qua vùng gần như các trường ngoại hình khác). Client chỉ đọc chuỗi.

## Chuyển tài khoản preset cũ sang LPC (`presetToLpc`)
- Hàm thuần ánh xạ năm số sang tổ hợp LPC hợp lệ: giới → thể hình; tông da → màu da LPC gần nhất; kiểu tóc / màu tóc → món tóc + màu tóc gần nhất; màu áo → bộ `LPC_PRESETS` cùng giới hợp nhất + màu áo. Bảng ánh xạ ngay trên hàm; số ngoài khoảng coi như 0, luôn qua `parseLpc`.
- `getLooks` của `PgStore` / `MemoryStore` (mọi nơi nạp tài khoản: đăng nhập, `/api/me`, vào phòng) gặp tài khoản **đã chọn ngoại hình mà chưa phải LPC** thì ghi `accounts.looks_lpc` có điều kiện (`looks_chosen` và `looks_lpc` còn đúng giá trị vừa đọc). Nhiều tiến trình: ai ghi trước thắng, kết quả như nhau vì hàm thuần; ghi lại không đổi gì (idempotent).
- **Không đụng `looks_changes`** (không tính lượt thợ may) và giữ nguyên năm cột preset cũ (chỉ `looks_lpc` quyết định chế độ). Tài khoản chưa chọn ngoại hình vào màn tạo như cũ.

## Vẽ hồn sư LPC (client `lpcRig.ts`)
- Thân hồn sư là texture ghép lúc chạy từ chuỗi `PlayerState.lpc` (đã đè áo / mũ trang bị) `lpcc_<m|f>_<n>`, bố cục đúng sheet hồn sư isometric (24 cột × 6 hàng, khung 64) nên `honsuAnimKey`, `createHonsuAnims`, `syncLayers` và `ISO_HS_ANIMS` dùng nguyên.
- Mỗi tổ hợp (chuỗi `lpc`) một texture, người cùng tổ hợp dùng chung. Sheet từng món (`lpcparts/<khóa>.png`) chỉ tải khi có người trong tầm đồng bộ mặc món đó, tô màu một lần theo `LPC_RAMPS` (sắc dải gốc `mats` → sắc cùng chỉ số của dải chọn; da / mắt theo `colors.skin` / `colors.eye`, tóc / mày / râu theo màu ô, thiếu thì theo màu tóc) rồi dùng chung giữa các tổ hợp.
- Hoạt ảnh ghép khi có người cần theo (tổ hợp, hoạt ảnh): đứng, đi, đánh, thi triển, bị đánh ngay; gục, hấp thụ khi cần; chưa xong thì đứng bằng idle. Viền ngoài `LPC_VIEW.outline`. Bảng ánh xạ khung theo `LPC_SHEET.anims` (hàng vật lý s / e / n; se / e / ne cùng hàng phải, tây lật ngang; hurt, die, absorb chỉ hướng xuống).
- Bộ có món thiếu idle: cả bộ đứng bằng khung đi đầu, phần trên nhích 1 điểm ở nửa sau chu kỳ (`LPC_VIEW.breatheY`).
- Ngân sách: mỗi khung hình chỉ tô / ghép tới `LPC_VIEW.budgetMs`; không tạo texture mỗi khung; tổ hợp hết người dùng giữ thêm `LPC_VIEW.graceMs` rồi giải phóng (texture, animation, sheet). Đo trên Chrome GPU: 31 người LPC khác nhau cùng màn giữ 118 khung / giây (trần vsync 120), ghép trung bình 1,8 ms mỗi (tổ hợp, hoạt ảnh).
- **Hướng 8 → 4** (`GameScene.lpcFace`): hướng hiện của hồn sư LPC (`v.lpcFace.shown`; `v.face` vẫn là hướng 8 thật cho hướng bay hiệu ứng hồn kỹ) chỉ nhận s, n, e (se / e / ne), w (sw / w / nw); hướng mới phải giữ `LPC_VIEW.dirHoldMs` mới đổi (đang đánh / gục đổi ngay). Phụ thể và pháp tướng đọc hướng hiện đó nên khung hướng khớp thân; phụ thể lệch theo `LPC_VIEW.vohon`. Nửa sheet phụ thể theo giới của `lpcc_f_…`.
- NPC có `looks` mà chưa có sheet `lpc_<mã>` cũng dựng bằng bộ ghép này (một tổ hợp giữ suốt bản đồ).

## Màn tạo nhân vật và đổi ngoại hình (client `looksMaker.ts`, `lpcPreview.ts`; server `changeLooks` ở `MapRoom.ts`)
- **Tạo lần đầu** (màn sau đăng nhập, `looks_chosen = false`; tài khoản cũ đang mang ngoại hình mặc định chọn lại một lần): bước đầu chọn **[Mẫu dựng sẵn]** hoặc **[Tự tạo (LPC)]**, rồi xác nhận qua `POST /api/looks`. Miễn phí, chỉ một lần; sau đó `/api/looks` trả 409.
- **Mẫu dựng sẵn:** `LPC_PRESETS` là các bộ LpcLooks dựng sẵn, mỗi bộ hợp lệ theo `parseLpc` (tên Việt, nhóm, thể hình, món từng ô, màu), nam / nữ cân bằng, kiểu cổ phong Đấu La (học viện, thôn dã, quý tộc, lang thang, giang hồ, cung đình), màu trầm đọc rõ trên nền isometric.
  - Màn là lưới các bộ (ảnh nhỏ, xem trước lớn xoay bốn hướng và đứng / đi / đánh / thi triển như Tự tạo); chọn bộ rồi chỉnh **màu tóc, màu da, màu áo** trong dải cho phép (`LPC_RAMPS`); không ô nào ngoài ba màu đó chỉnh được ở đây.
  - Nút **Bắt đầu từ mẫu** trong Tự tạo nạp một bộ làm điểm xuất phát rồi chỉnh tiếp từng món.
- **Màn Tự tạo:** thẻ theo ô của `LPC_SLOTS` (Thân · giới kèm màu da và màu mắt, rồi mặt, mày, mũi, râu, tóc, tóc thêm, áo, quần / váy, giày, áo choàng, đai, mũ, cổ, phụ kiện mặt, tay), mỗi thẻ là lưới món + màu của món đang chọn (tóc, mày, râu dùng chung một màu tóc).
  - Món không hợp thể hình bị ẩn; đổi giới thì món sai thể hình bị bỏ, ô bắt buộc (thân, mặt) được thay bằng món đầu hợp thể hình.
  - Nút **Ngẫu nhiên** tung tổ hợp hợp lệ nghiêng về cổ phong (món `dong` gấp đôi trọng số `trung`, bỏ món `tay`, mặt lão hiếm, râu chỉ nam, áo choàng / mũ / cổ / phụ kiện thỉnh thoảng mới có, màu vải và màu tóc lấy từ bảng trầm).
  - Xem trước 64×64 tự xoay bốn hướng (hoặc chọn một hướng) với đứng / đi / đánh / thi triển, dùng cùng hàm ghép khung và viền như trong game (`tintImage`, `flattenFrame` của `lpcRig.ts`) nhưng không cần Phaser.
  - Điện thoại ngang: bố cục gọn (`@media (max-height: 520px)`), danh mục món cuộn trong khung, thẻ ô cuộn ngang, chạm được. Client chỉ gửi lựa chọn; server vẫn kiểm bằng `parseLooks`.
- **Đổi ngoại hình sau khi đã tạo:** chỉ qua **thợ may** (NPC vai trò `looks`: Thợ may Nặc Đinh và Thợ may Thiên Đấu, cùng một luật), kể cả đổi giữa Mẫu dựng sẵn và Tự tạo. Nói chuyện với thợ may thì server gửi tin riêng `looksinfo {n}` (số lần đã đổi); nút "Đổi ngoại hình (giá)" mở lại cùng màn tạo nhân vật phủ lên game.
  - `LOOKS_CHANGE.free` lần đổi đầu miễn phí, các lần sau tốn `LOOKS_CHANGE.cost` Hồn Tệ mỗi lần (`looksChangeCost(đã đổi)`); lần tạo đầu không tính. Số lần đã đổi lưu ở `accounts.looks_changes` (`server/sql/030_looks_changes.sql`), dùng chung cho mọi thợ may của tài khoản.
- **Server (tin `looks {looks, npc?}`):** từ chối (gửi `looksinfo {n, err}`, không mất gì) khi:
  - người chơi gục / đang đi cổng;
  - không đứng trong `NPC_RANGE` của thợ may (`npc` là mã thợ may đang mở hộp thoại, thiếu thì thợ may gần nhất; mã NPC khác vai trò thì từ chối);
  - `looks` không qua `parseLooks`;
  - giống hệt ngoại hình hiện tại; đang có một lần đổi chờ ghi; không đủ Hồn Tệ.
  - Hợp lệ thì giữ chỗ (`looksBusy`), tới lượt trong chuỗi lưu (`this.chain`) mới kiểm lại số lần đổi và Hồn Tệ, trừ tiền, rồi `store.changeLooks` ghi **ngoại hình mới + tăng `looks_changes` + túi (Hồn Tệ) trong một transaction**, có điều kiện `looks_changes` đúng bằng số lần đã đọc: hai lệnh đổi cùng lúc (hoặc hai tab) chỉ một lệnh được tính, lệnh kia bị hoàn tiền. DB lỗi thì hoàn tiền và không đổi.
  - Chỉ sau khi DB xác nhận mới đổi `PlayerState` (người xung quanh thấy ngay, không cần vào lại).

## Áo / mũ trang bị lên lớp LPC
- Mặc áo (ô `ao`) / mũ (ô `mu`) của trang bị hồn sư (mục 5.15) thì đè ô `torso` / `hat` của ngoại hình LPC; vũ khí do phụ thể võ hồn, các ô trang bị khác không có hình.
- Bảng `LPC_GEAR` (`shared/data.ts`) ánh xạ (loại ô, bậc) → [mã món, màu] (có `f` riêng cho nữ nếu cần; món không hợp thể hình / màu thì `lpcGearLooks` giữ ô gốc). Thêm lớp áo / mũ mới chỉ sửa bảng này.
- Đồng bộ công khai tối thiểu: `PlayerState.gearAo` / `gearMu` = bậc + 1 (`lpcGearCode`, 0 = không mặc); server cập nhật lúc vào game và mỗi lần mặc / tháo (`gearLook`); chỉ số không lộ.
- Client (`gearLpc` ở `GameScene.ts`) dựng chuỗi LPC đã đè rồi giao `LpcRig` như cũ: người cùng ngoại hình + cùng bậc dùng chung một texture, cache theo chuỗi.
- Tùy chọn **Ẩn mũ** (bảng Cài đặt, `fxPrefs.hideHat`, lưu ở máy, áp cho mọi hồn sư trên màn mình): bỏ mũ trang bị, mũ của ngoại hình gốc và áo vẫn hiện. Chưa có đồng phục theo phe.
- Đo (GPU thật, 40 hồn sư LPC ngoại hình ngẫu nhiên cùng màn): 120 FPS (trần vsync) cả không mặc lẫn mặc áo + mũ đủ 6 bậc; bỏ hết người thì giải phóng texture.

## Issue liên quan
#507 (kế hoạch), #508–#511 (L1–L4), #564 (hồn sư = LPC), #565 (HL1, Mẫu dựng sẵn), #571 (HL2, chuyển preset), #572 (HL3, gỡ đường vẽ preset), #573 (HL4, áo / mũ), #554 / #576 (C3, trang phục phương Đông).
