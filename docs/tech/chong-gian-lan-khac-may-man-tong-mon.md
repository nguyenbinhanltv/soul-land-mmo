# Soát chống gian lận: khắc may mắn + tông môn (#740, vòng 4a)

Soát theo skill `anti-cheat-audit`. Phạm vi: giả thuyết 1 (Thợ rèn khắc may mắn) và 4 (tông môn `setTong`) của #740. Giả thuyết 2, 3, 5 để issue khác.
Ngày soát 2026-10-26, trên `main` tại `ac3d6582`.

## Tóm tắt

| # | Giả thuyết | Kết quả | Mức |
|---|---|---|---|
| 1a | Tháo / mặc / đổi món giữa lúc `equipluck` chờ DB để lách trần tổng hai ô (`EQUIP_LUCK_MAX`) | **Không khai thác được**, có bài bot | — |
| 1b | Hoàn lại khi lỗi ghi đặt đúng `it.stats` khi món đã đổi `wear` | **Không khai thác được** (đọc mã); chưa có bài chạy vì chưa có hook làm hỏng ghi DB | — |
| 4 | `setTong` lệch DB khi lỗi giữa chừng | **Lệch thật** (đọc mã), không do người chơi chủ động gây ra | Vừa |

## 1a. Khắc may mắn: tháo / mặc giữa lúc chờ DB

`equipLuck` (`MapRoom.ts`, hàm `equipLuck`) tính `wear` và `step` (trần tổng theo `wornLuck`) **trước** `await store.saveBag`. Nếu trong lúc chờ mà ô mặc đổi được thì kết quả lệch trần. Đã đọc mọi đường đổi `d.gear`:

- `equipGear` / `unequipGear`: cả hai từ chối khi `claimHeld(d)`; `equipLuck` tăng `d.claimBusy` **đồng bộ** ngay khi nhận lệnh (trước cả khi xếp vào chuỗi lưu), nên cửa sổ không có kẽ hở.
- `discardItem`, `sellItem`, hợp thành (`equipSynth`), phân giải (`salvageEquip`, `forgeLane`): `claimBusy` hoặc `enhBusy` chặn. Hợp thành / phân giải chỉ nhận món trong túi (`equipBagItems` loại món đang mặc).
- Hai lệnh `equipluck` dồn: `enhBusy` chặn lệnh sau (đã có bài 20 lệnh dồn ở `gearLuckTest`).
- Nhiều tiến trình: `itemLocked` giữ khóa Redis theo món; Redis lỗi thì từ chối (fail-closed).

**Bài bot** `BOT_ONLY=luckrace` (`luckRaceTest`, tài khoản riêng "Luck race", túi riêng, không đụng trạng thái dùng chung): mặc vũ khí M(`EQUIP_LUCK_MAX`−4) + dây chuyền M3 (tổng = `EQUIP_LUCK_MAX` − 1), bật `enhslow` 700 ms, gửi `equipluck` rồi ngay sau đó `equipgear` hai món M(`EQUIP_LUCK_MAX`−1), `unequipgear` hai ô, `discard`, `equipsalvage`, `equipsynth`. Kỳ vọng và kết quả: ô mặc không đổi trong lúc chờ; xong lệnh vũ khí lên đúng một nấc, đúng 1 Thần Hồn bị trừ, không món nào mất; khắc tiếp bị chặn "Tổng may mắn hai ô đang mặc đã đạt tối đa"; sau khi xong lại mặc món khác được. Đạt (`npm run bot:local -- --only luckrace`).

Lưu ý đọc kết quả: trần tổng chỉ chặn **khắc**; may mắn hiệu lực luôn bị kẹp (`equipStats`, từ `EQUIP_LUCK_MAX` trở lên đòn vũ khí luôn ra công tối đa), nên dù có lách được cũng chỉ tốn Thần Hồn, không thêm sát thương. Kiểm tổng may mắn trong bài bot vì thế yếu (luôn bị kẹp); các kiểm ô mặc (`worn()`) và `luckOf(W)` mới là kiểm thật. `enhslow` chờ trước khi tính `wear`, nên bài chứng minh cờ chặn phủ cả lệnh (giữ suốt chuỗi) chứ không nhắm riêng khoảng `await saveBag`.

## 1b. Hoàn lại khi lỗi ghi

Nhánh `catch` của `equipLuck`: `undoSoul(); it.stats = was`. Vì món không đổi chỗ trong lúc chờ (1a) nên `wear` còn đúng; `it.stats` là tham chiếu cùng một đối tượng nên gán lại `was` đúng cả khi món ở túi hay ô mặc. `undoSoul` trả đúng phần đã trừ trên túi hiện tại (nhặt thêm đồ lúc chờ không bị đè). Không thấy lỗ hổng.

**Đã có bài chạy (#797):** hook `test` `savefail {n, only}` (chỉ `GAME_TEST=1`, bọc `store` ở `db.ts`) ép n lần ghi túi / tông kế tiếp lỗi; bài `BOT_ONLY=savefail` (`saveFailTest`) kiểm `equipluck` (túi và ô mặc), `equipenh` (cả nấc phá hủy trên món đang mặc), `coreset` (#699): Thần Hồn / đá / phí hoàn đúng, `it.stats` / cấp về đúng, thử lại chỉ trừ một lần, không nhân / mất. `coreset` ghi qua `write` nên không hoàn lại trong RAM mà túi bẩn, lần ghi kế persist đúng một lần phí. `setTong`: DB giữ nguyên khi ghi lỗi.

## 4. Tông môn: `setTong` lệch DB

- `tongAction` (`MapRoom.ts`, nhánh `leave` và `join`): đổi `d.tong`, `d.tongAt`, `p.tong`, `d.tongPend` **trước**, rồi `this.chain(d, () => store.setTong(...))` không chờ và không hoàn lại. `chain` nuốt lỗi (chỉ `console.error` và `saveStats.failed++`), nên khi ghi lỗi (DB chớp, hết kết nối) người chơi vẫn thấy "đã gia nhập / đã rời", bộ nhớ và DB lệch cho tới khi vào lại.
- Hệ quả: rời tông mà DB lỗi thì vào lại sẽ còn trong tông cũ và điểm tuần chưa xóa (DELETE nằm cùng transaction); gia nhập / đổi tông lỗi thì `tongAt` (mốc chờ `TONG_SWITCH_DAYS`) không được ghi. Trong lúc lệch, điểm tuần (`addTongPoints`) ghi theo tông trong RAM còn `accounts.tong` là tông cũ, bảng xếp hạng thấy điểm của tông người chơi không thuộc về.
- Người chơi không tự gây được lỗi DB, nên mức **Vừa** (nhất quán dữ liệu), không phải khai thác chủ động. Hook GM `tong set` / `back` (`MapRoom.ts`, chỉ `GAME_TEST`) có cùng mẫu.
- Cách sửa (issue #796, vì ở `MapRoom.ts`): `leave` / `join` ghi trong chuỗi lưu trước, **thành công mới** đổi bộ nhớ và báo (như `tongClaim` / tông vụ, vốn đã "chỉ khi đã ghi mới cộng điểm"), hoặc hoàn lại bộ nhớ + báo lỗi khi `setTong` ném.
- Chưa có bài bot vì cùng thiếu hook làm hỏng ghi DB.

## Danh sách đã đọc

Message: `equipluck`, `equipluckpreview`, `equipgear`, `unequipgear`, `discard`, `sell` (chặn `claimBusy`), `equipsalvage`, `equipsynth`, `equipenh` (cùng làn `enhBusy`), `tong` (`join`, `leave`, `accept`, `turnin`, `board`, `claim`, `get`). Không route REST liên quan.

## Mặc tốt nhất (#1465)
Phạm vi soát bổ sung theo `anti-cheat-audit`: không đổi luật cũ của Thợ rèn / tông môn.

| Bề mặt đã đọc | Kết quả |
|---|---|
| `equipbest` → `chooseBest` → `afterGear` / `save` | Đã đọc, ổn: chỉ nhận ô và token; món / điểm giả bị bỏ qua. Chọn trong túi chính chủ, bỏ món khóa / ô khóa, dùng `teamPowerOf` với bản sao chỉ số trang bị. `boneLock`, `travelling`, `claimHeld` chặn; kiểm lại khi xác nhận. Token riêng theo PData, một lần, phương án cũ bị từ chối. Nhóm `bag` và nhịp `ASK_CD` chặn spam tính điểm. Đổi cả bộ đồng bộ, lưu chung ảnh chụp túi + ô mặc qua đường lưu hiện hữu. |
| `equipgear`, `unequipgear`, `equipluck`, `equipenh`, `equipsynth`, `equipsalvage` | Đã đọc các chốt tương tác, ổn: luồng mới dùng chung `claimHeld` / `boneLock`, không xen đổi đồ trong khi lệnh Thợ rèn đang giữ khóa. |
| `gear`, `equipbestp`, `bag` / `bagd` | Đã đọc, ổn: chỉ gửi chính chủ; `upgrades` do server tính, không thêm state công khai. |
| ArenaRoom / BiCanhRoom | Đã đọc, ổn: `equipbest` nằm trong `BLOCKED` dùng chung. |

Kiểm thực tế: unit cho hòa điểm, thiếu món, món khóa, giao chiến khi xác nhận, đang chờ ghi DB, payload sai kiểu, token cũ và nhịp xem trước. Bot `equipbest` RAM và PostgreSQL đều đạt 39 kiểm tra, gồm món / điểm giả, xác nhận lặp, giao chiến, khóa và vào lại giữ đúng trang bị. Unit bổ sung cache: đổi đồ tiêu hao không chấm lại / gửi lại `gear`, khóa trang bị làm cập nhật, xin cả túi dùng cache điểm nhưng vẫn nhận tin. Không có API REST mới, SQL mới hoặc số cân bằng mới.
