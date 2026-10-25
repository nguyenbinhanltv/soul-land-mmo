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

**Khoảng trống kiểm thử:** server chưa có hook ép `saveBag` lỗi, nên nhánh này (và nhánh lỗi của `equipenh`, `coreset`, #699) chưa có bài chạy. Cần hook `test` kiểu `savefail` trong `MapRoom.ts` (ngoài phạm vi issue này): issue #797.

## 4. Tông môn: `setTong` lệch DB

- `tongAction` (`MapRoom.ts`, nhánh `leave` và `join`): đổi `d.tong`, `d.tongAt`, `p.tong`, `d.tongPend` **trước**, rồi `this.chain(d, () => store.setTong(...))` không chờ và không hoàn lại. `chain` nuốt lỗi (chỉ `console.error` và `saveStats.failed++`), nên khi ghi lỗi (DB chớp, hết kết nối) người chơi vẫn thấy "đã gia nhập / đã rời", bộ nhớ và DB lệch cho tới khi vào lại.
- Hệ quả: rời tông mà DB lỗi thì vào lại sẽ còn trong tông cũ và điểm tuần chưa xóa (DELETE nằm cùng transaction); gia nhập / đổi tông lỗi thì `tongAt` (mốc chờ `TONG_SWITCH_DAYS`) không được ghi. Trong lúc lệch, điểm tuần (`addTongPoints`) ghi theo tông trong RAM còn `accounts.tong` là tông cũ, bảng xếp hạng thấy điểm của tông người chơi không thuộc về.
- Người chơi không tự gây được lỗi DB, nên mức **Vừa** (nhất quán dữ liệu), không phải khai thác chủ động. Hook GM `tong set` / `back` (`MapRoom.ts`, chỉ `GAME_TEST`) có cùng mẫu.
- Cách sửa (issue #796, vì ở `MapRoom.ts`): `leave` / `join` ghi trong chuỗi lưu trước, **thành công mới** đổi bộ nhớ và báo (như `tongClaim` / tông vụ, vốn đã "chỉ khi đã ghi mới cộng điểm"), hoặc hoàn lại bộ nhớ + báo lỗi khi `setTong` ném.
- Chưa có bài bot vì cùng thiếu hook làm hỏng ghi DB.

## Danh sách đã đọc

Message: `equipluck`, `equipluckpreview`, `equipgear`, `unequipgear`, `discard`, `sell` (chặn `claimBusy`), `equipsalvage`, `equipsynth`, `equipenh` (cùng làn `enhBusy`), `tong` (`join`, `leave`, `accept`, `turnin`, `board`, `claim`, `get`). Không route REST liên quan.
