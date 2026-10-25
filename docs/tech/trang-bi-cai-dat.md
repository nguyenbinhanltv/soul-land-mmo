# Trang bị hồn sư: cài đặt

Luật chơi và bảng số ở `docs/design/trang-bi.md` (mục 5.15) và `shared/data.ts` (`EQUIP_*`); kinh tế ở `docs/trang-bi-kinh-te.md`. File này mô tả **cách server cài đặt** các bước E1–E7.

## Nguyên tắc chung
- Mọi số cân bằng ở `shared/data.ts`. Đổi số thì chạy lại `npm run econ:equip --prefix server -- --md` và cập nhật `docs/trang-bi-kinh-te.md`.
- Mọi lệnh đổi túi / trang bị chạy trong chuỗi lưu của tài khoản (`this.chain`), đổi túi trong bộ nhớ rồi ghi **một** transaction; lỗi ghi thì hoàn lại đúng phần đã đổi.
- Lệnh tới khi lệnh trước chưa xong thì từ chối ngay (cờ `enhBusy` / `forgeLane`, `claimBusy`): 20 lệnh dồn cùng lúc trên một món chỉ có 1 lệnh được xử lý.
- `ArenaRoom` chặn mọi tin trang bị (`BLOCKED`). Cường hóa, hợp thành, phân giải chỉ gần Thợ rèn và ngoài giao chiến (`boneLock`).

## Lưu một món (E1)
- Hàng `items` sẵn có: `kind` = `trang_bi` (`ITEM_KINDS`), `code` = `EQUIP_ITEM`, `enhance` = cấp cường hóa (0–`EQUIP_MAX_ENHANCE`), `locked`, `stats` = `EquipData` (`tpl`, `ilvl`, `roll`, `affixes`, `luck`), `vohon_id` luôn NULL (trang bị thuộc hồn sư, không thuộc võ hồn).
- `server/sql/027_trang_bi.sql`: `equip_slot SMALLINT` (chỉ số trong `EQUIP_SLOTS`, NULL = trong túi, CHECK 0–9), `ver INTEGER` (tăng mỗi lần ghi đè một món, so cấp đang lưu để chặn ghi chồng), chỉ mục duy nhất từng phần `(account_id, equip_slot) WHERE equip_slot IS NOT NULL` (mỗi ô một món).
- `PgStore` lẫn `MemoryStore` (`db.ts`) cùng cập nhật. Bẫy JSONB: pg trả object, `MemoryStore` trả chuỗi hay object tùy chỗ ghi; kiểm cả hai bằng `npm run bot:local -- --only <nhóm> --pg`.

## Món đang mặc
- `Item.equipSlot` (cột `items.equip_slot`); `PData.gear` giữ riêng món đang mặc, nằm ngoài `d.bag`: không chiếm ô túi, không bán / bỏ / khóa / hiến tế, không vào tin `bag` / `bagd` (`shared/bagSync.ts`).
- `bagSnapshot` ghi cả hai trong **một transaction** (`writeBag`: nhả ô cũ rồi mới upsert, nên hai món đổi chỗ không vướng chỉ mục duy nhất; `ver` tăng khi cấp cường hóa, chỉ số hoặc ô đổi).
- Mặc: `equipgear {id}`. Ô lấy từ mẫu của món (vòng / nhẫn trái và phải là mẫu riêng nên không có tham số ô); ô đã có món thì đổi chỗ, món cũ về túi; túi đầy thì từ chối. Tháo: `unequipgear {slot}`. Cả hai ngoài giao chiến (`boneLock`), không chờ DB thưởng boss.
- Tin riêng `gear {items: [{id, code, enhance, stats, slot}], st}` gửi khi client xin `bag` và sau mỗi lần đổi. Tin `stats` thêm `gear {bonus, weapon, red, luck}` (`total` đã gồm).
- Hình: áo / mũ hiện lên lớp LPC của hồn sư (mục 5.11), vũ khí do phụ thể, các ô khác không có hình trên người.

## Chỉ số vào `calcStats`
- `coreBonusOf` / `recalc` cộng `d.gearSt.bonus` (`withGear`; `equipStats` trả `bonus` cùng đơn vị với `coreBonus`: phẳng và % cùng mã `CORE_STATS`, `crit` / `crit_dmg` như hồn hạch).
- Công vũ khí **không** nằm ở `bonus`: `atkOf(d, bond, weapon)` cộng công vũ khí theo đòn:
  - `"roll"`: đòn trực tiếp (đánh thường, hồn kỹ có sát thương trực tiếp, kỹ năng hồn cốt, Chân Thân), mỗi đòn cộng `equipWeaponRoll(weapon, luck, Math.random)` **trước** hệ số đòn (một lần tung cho cả đòn đánh thường);
  - `"mid"`: sát thương theo thời gian, ủy thác, hiển thị, dùng công giữa của vũ khí;
  - `"none"`: dung hợp.
- Đấu trường đi cùng đường (hệ số `ARENA` áp sau).
- Giảm sát thương nhận: `buffV(d, "def")` dùng `equipDefTotal(bị động hồn cốt def, red)` thay cho giá trị `def` kẹp `BONE_PASSIVE_CAP.def`.

## Rơi (E2)
- Gọi `rollEquipDrop(rank hồn thú, mapId, Math.random, rate)` ở hai chỗ dùng `BEAST_COIN` (`MapRoom.ts`); `rate` luôn 0 cho tới khi có nguồn sự kiện. Chỉ rơi ở bản đồ có trong `EQUIP_MAPS` (bậc tối đa theo bảng đó); vùng không có bản đồ trong bảng thì không rơi.
- **Hồn thú thường / tinh anh:** `killBeast` gọi `rollEquipGround(người hạ, chủ ưu tiên, bậc 0 hoặc 1)` ngay sau hồn hạch.
  - Đá vào thẳng túi người hạ (túi đầy thì phần dư rơi đất như mảnh võ hồn).
  - Mỗi món trang bị là một `DropState` (`item` = `EQUIP_ITEM`, `cset` = chỉ số mẫu trong `EQUIP_TEMPLATES`, `stars` = bậc + 1) cạnh hồn hoàn; chỉ số đã tung giữ ở `equipDrops` (như `coreDrops`, hết hạn cùng `DROP_TTL_SECS`).
  - Nhặt (E) qua `pickup` cùng luật ưu tiên chủ / tổ đội (`DROP_OWNER_SECS`, `PICKUP_RANGE`; tinh anh ưu tiên người đóng góp nhiều nhất); túi đầy thì món ở lại. Đồ rơi đồng bộ theo vùng gần như đồ rơi khác (`interest.ts`).
  - Hình món rơi trên đất hiện vẫn dùng biểu tượng `shard` nhuộm màu bậc (`GameScene.ts`); trong túi và búp bê dùng `equipIconChain`.
- **Thú vương / boss thế giới:** không tung lúc hạ mà lúc **mở rương** (`openChest` / `openWorldChest` gọi `chestEquip`, bậc 2 / 3).
  - Trang bị, đá và Bùa Hộ Mệnh (`rollEquipCharm`) vào thẳng túi lúc mở.
  - `KING_CHEST.slots` / `WORLD_CHEST.slots` đã cộng chỗ cho lượt rơi lớn nhất của bậc đó + bùa (test `test:equip` kiểm); phần vượt ô (chỉ khi `rate` > 0) vẫn vào túi như rương nhận.
- **Ủy thác offline** (`claimOffline`): tung bậc 0 theo bản đồ vùng, cho thẳng vào túi vì không có đất để rơi. Đá xếp chồng túi đầy thì dừng như hồn cốt; trang bị gặp túi đầy thì bị bỏ (không dừng cả lượt; tin `offline` có `equipLost`). Dùng cùng RNG của hook `edrop`.
- Hook test `edrop {seed}` đặt RNG có hạt cho mọi lần tung rơi của người gọi (`{off: true}` trả về ngẫu nhiên); bot tung lại cùng hạt bằng `rollEquipDrop` / `rollEquipCharm` của shared để so từng món.

## Cường hóa (E3)
- `equipEnhance` / `equipEnhancePreview` (`MapRoom.ts`): tin `equipenh {id, charm}` (trả `equipenhd`) và `equipenhpreview {id}` (trả `equipenhp`: `equipEnhanceStep`, đá và phí hiện có, hậu quả thất bại, có bùa hay không). Món trong túi hoặc đang mặc (chỉ số tính lại ngay).
- Kiểm: món thuộc chính chủ, `enhance` < `EQUIP_MAX_ENHANCE`, đủ `EQUIP_STONES[step.stone]` × `step.qty` và Hồn Tệ `step.fee`. Nếu `charm` thì có Bùa Hộ Mệnh (chỉ có ý nghĩa ở nấc phá hủy, **không bắt buộc**; `charm` đúng mà nấc không phá hủy thì không trừ bùa).
- Trừ đá + phí **trước** khi tung (cả khi thất bại); tung `Math.random() < step.p`; `equipEnhanceResult` cho cấp mới / phá hủy / dùng bùa. Phá hủy thì xóa dòng khỏi DB và (nếu đang mặc) khỏi ô.
- Ghi bằng một transaction `saveBag`: khóa dòng tài khoản, rồi dòng món theo id tăng dần và so cấp đang lưu qua `Bag.lock` (lệch thì hủy cả transaction). Lỗi ghi thì hoàn lại đá, phí, bùa, món và gửi lại túi.
- Giao diện: trang "Cường hóa trang bị hồn sư" ở NPC Thợ rèn; nút đỏ bấm hai lần khi `equipEnhanceStep` có `fail.kind` là `destroy`, `down` hay `reset` (đừng bỏ bước xác nhận này).
- Hook test: `enhroll {r}` ép số tung, `enhslow {ms}` giữ lệnh trong chuỗi lưu để bot dồn lệnh. Bài bot ở nhóm `bag` (`gearEnhanceTest`).

## Hợp thành và phân giải (E4)
- `equipSynth` / `salvageEquip` / `autoSalvage` (`MapRoom.ts`): tin `equipsynth {main, sacrifice: [id, id]}` (trả `equipsynd`) và `equipsalvage {ids}` (trả `equipsalvd`). Dùng chung hàng đợi `forgeLane` với cường hóa.
- Chỉ món trong túi (không mặc, không khóa, id trùng bị từ chối).
- **Hợp thành:** cùng bậc, cùng ô (cùng `slot` của mẫu), bậc đầu vào ≤ `EQUIP_MAX_TIER − 1` (`equipSynthStep`), đủ `fee` và `essence` (trừ trước khi tung).
  - Ra món mới: bậc `from + 1`, mẫu ngẫu nhiên trong cùng ô, `ilvl` = ilvl **cao nhất** trong 3 món vào, `rollEquip` cho phần còn lại, `enhance` = `floor(enhance món chính × EQUIP_SYNTH_KEEP)`.
  - Thất bại theo `mainLoss` / `all` / `refund` của `EQUIP_SYNTH[from]` qua `equipSynthOutcome` (hàm thuần).
- **Phân giải:** tối đa `EQUIP_SALVAGE_MAX` món một lệnh, tung bằng `equipSalvage(bậc, enhance, Math.random)` → cộng Hồn Tệ và nguyên liệu vào túi trong **một lượt ghi**; không cho kinh nghiệm; túi không đủ chỗ cho nguyên liệu thì từ chối cả lượt (không mất món).
- Thương nhân **không mua** trang bị (`sellPrice` trả null).
- **Tự phân giải** (tùy chọn, mặc định tắt, độc lập với nút bật tự bán): trường `salv` (bậc dưới N, tối đa Thần Khí, Chí Bảo không bao giờ tự phân giải) và `salvEnh` (cấp cường hóa dưới N) của bộ lọc `SellSettings`, hàm `equipAutoSalvageable`. Khi túi còn dưới `AUTO_SELL_FREE` ô trống thì chạy im lặng, cách nhau ≥ 5 giây, bỏ qua món khóa / đang mặc.
- Giao diện: hai trang "Hợp thành trang bị (3 → 1)" và "Phân giải trang bị" ở Thợ rèn (bấm hai lần); lựa chọn tự phân giải ở khung tự bán của túi.
- Hook test: `synroll {r}` ép số tung hợp thành / phân giải, `enhslow` dùng chung. Bài bot ở nhóm `bag` (`gearSynthTest`).

## Hook test và mô phỏng
- Hook `test {op: "gear", tpl, ilvl?, enhance?, roll?, luck?, affixes?}` thêm một món vào túi (`{clear: true}` dọn hết); hook `stats` thêm `gear` và `live.atkRolls`.
- `equip-sim.ts` (`npm run sim:equip --prefix server`) mô phỏng một người chơi tự động theo ngày (hồ sơ 1 / 3 / 6 giờ) bằng chính hàm của `shared/data.ts` (`rollEquipDrop`, `equipEnhanceStep`, `EQUIP_SYNTH`, `equipSalvage`, `equipStats`, `calcStats`) và so sức mạnh đấu trường theo mô hình thời gian hạ gục.
- Bài bot `equipsoak` (mặc đủ 10 ô, lặp cường hóa / hợp thành / phân giải / đổi đồ / vào lại; `ES_N`, `ES_SECS`, `ES_SAMPLE`) kèm `perf {mem: true}` (thêm RSS và heap) đo tick, RSS, heap theo thời gian (`hieu-nang-soak.md`).

## Chưa làm
- **Khắc may mắn:** hằng `EQUIP_LUCK_UP` ở `shared/data.ts` ghi "đề xuất, chờ duyệt" và chưa có mã server / client nào dùng; thuộc tính `luck` của món hiện chỉ do rơi / `rollEquip` quyết định.
- Số cân bằng trang bị đã được chủ repo duyệt (Q42 ở `docs/quyet-dinh.md`); `docs/trang-bi-kinh-te.md` là ước lượng theo giả định.

## Issue liên quan
#411 (E0, kinh tế), #412–#415 (E1–E4), #418 (E7).
