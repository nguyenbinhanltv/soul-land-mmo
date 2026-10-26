# Trang bị hồn sư

Luật trang bị hồn sư: ô, bậc, chỉ số, rơi đồ, cường hóa, hợp thành, phân giải. Dữ liệu ở `shared/data.ts` (mục "Trang bị hồn sư"; tên hằng trong dấu `code`). Kinh tế và số đo: `docs/trang-bi-kinh-te.md` (chạy lại `npm run sim:equip --prefix server` khi đổi bảng số). Cách cài đặt từng bước E1–E7: `docs/tech/trang-bi-cai-dat.md`. Số issue ở cuối file.

## 5.15 Trang bị hồn sư
Hệ trang bị phỏng theo Mir2 / Sabuk (10 ô, 6 bậc, cường hóa +15 có rủi ro, hợp thành 3 → 1, phân giải), **đã co lại cho khớp luật nền** của Rừng Săn Hồn.

### Nguyên tắc
- **Thuộc hồn sư, dùng chung cho cả đội:** mặc một bộ, cộng cho **võ hồn đang ra trận** (đổi võ hồn vẫn giữ).
- Chỉ số **không** lưu: tính lại từ mẫu + cấp vật phẩm + cấp cường hóa (như hồn cốt), cộng vào `calcStats` cùng chỗ với hồn hạch và hồn cốt.
- Không có độ bền, không sửa đồ. Món đang mặc không chiếm ô túi, đổi chỗ như hồn cốt; chỉ mặc / tháo khi ngoài giao chiến. Chính chủ, không giao dịch.

### Ô, bậc, mẫu
- **10 ô** (`EQUIP_SLOTS`): vũ khí (ám khí Đường Môn / binh khí), mũ, áo, đai, giày, dây chuyền, vòng tay trái / phải, nhẫn trái / phải.
  - Mỗi ô một chỉ số chính lấy từ bộ mã `CORE_STATS` (không thêm DC / MC / SC); áo, mũ, đai, giày thêm **giảm sát thương nhận**.
  - Vòng tay / nhẫn trái và phải là **hai mẫu riêng**: không đổi chéo trái ↔ phải (xem giao diện ở `docs/design/giao-dien.md`).
- **6 bậc** (`EQUIP_TIERS`; tên chủ repo đã chốt, giữ cho tới khi đổi): Phàm Khí (trắng), Tinh Thiết (lục), Hàn Ngọc (lam), Tử Kim (tím), Thần Khí (cam), Đường Môn Chí Bảo (đỏ). Bậc càng cao thì chỉ số chính, số dòng phụ (0 → 4) và giảm sát thương càng lớn.
- **Mẫu:** mỗi (ô × bậc) một mẫu (`EQUIP_TEMPLATES`, tên theo Đấu La: Tụ Tiễn, Phật Nộ Đường Liên…).
- **Cấp vật phẩm theo bản đồ** (`EQUIP_MAPS`, `EQUIP_ILVL_K`): cùng bậc, bản đồ sâu ra món mạnh hơn (như niên hạn hồn hoàn). Mỗi bản đồ có bậc tối đa rơi và bảng đá rơi riêng, nên Thánh Hồn Thôn không rơi đồ ngang Lõi Tinh Đấu.

### Chỉ số một món
`equipMainValue`, `equipAffixValue`, `equipStats`.
- Chỉ số chính × hệ số bậc × cấp vật phẩm × hệ số cường hóa (`equipEnhanceMult`), biến động ±`EQUIP_ROLL` lúc rơi.
- Dòng phụ (theo bậc, mã `CORE_STATS` khác nhau, khác chỉ số chính) **không** nhân cường hóa.
- Cả bộ cao nhất cố ý dưới hồn hạch / hồn cốt đã cường hóa đủ: vòng chơi chính vẫn là hồn hoàn, hồn cốt, hồn hạch.
- **Giảm sát thương nhận** (`equipDefTotal`): cộng với bị động hồn cốt `def` dưới **cùng một trần** `BONE_PASSIVE_CAP.def`; không chồng vượt trần.

### Vũ khí và may mắn
- **Vũ khí có công theo từng đòn:** cộng vào công một đòn, tung trong [min, max] quanh công giữa (`EquipSlotDef.weapon`, `equipWeaponRoll`). Sát thương theo thời gian dùng công giữa.
- **May mắn** (chỉ vũ khí và dây chuyền, tổng tối đa `EQUIP_LUCK_MAX`): xác suất ra đúng max = may mắn / `EQUIP_LUCK_MAX`; tổng đạt mức tối đa thì **mọi đòn ra max**. Không có may mắn âm.
- Món rơi có tỉ lệ nhỏ (`EQUIP_DROP.luck`) ra sẵn +1.
- **Khắc may mắn** ở Thợ rèn (chỉ vũ khí và dây chuyền): mỗi lần 1 Thần Hồn (`EQUIP_SOUL`), may mắn n → n + 1 với tỉ lệ `EQUIP_LUCK_UP[n]` (`equipLuckStep`). **Thất bại mất Thần Hồn, giữ may mắn, KHÔNG phá món, không phí Hồn Tệ.** Món trong túi chặn ở `EQUIP_LUCK_MAX`; món đang mặc còn chặn khi tổng hai ô đang mặc đã đạt `EQUIP_LUCK_MAX`.

### Rơi đồ 4 pha
`EQUIP_DROP`, `rollEquipDrop` (server gọi khi hồn thú chết; hàm thuần nhận RNG).
1. Số lượt rơi theo bậc hồn thú, **co lại** so với Mir2: hồn thú thường phần lớn không rơi, tinh anh 1–2, thú vương nhiều hơn, boss thế giới nhiều nhất.
2. Mỗi lượt ra **đồ tạp** (Đá Cường Hóa) hoặc nhóm T0–T1 / T2–T3 / T4–T5.
3. Chọn bậc trong nhóm rồi mẫu theo trọng số (roulette; tổng trọng số 0 thì bỏ lượt, không chia 0). Xác suất trang bị nhân hệ số `1 + rate` kẹp ở `EQUIP_DROP.rateCap` (rate = sự kiện máy chủ + người chơi như tổ đội; **không Rate VIP, không nạp tiền**).
4. Tạo món (`rollEquip`): biến động chỉ số, dòng phụ theo bậc, may mắn +1 hiếm.

- Bậc tung vượt bậc tối đa của bản đồ thì kẹp xuống.
- **Thú vương và boss thế giới đưa đồ vào rương theo đóng góp** (cùng luật nhận thưởng mục 5.4, `KING.share` / `WORLD.share`, lượt ngày), không rải xuống đất. Hồn thú thường và tinh anh rơi đất cùng luật nhặt (mục 4).
- Trang bị rơi **thêm** bên cạnh hồn hoàn / hồn cốt / hồn hạch, không thay.

### Nguyên liệu
`ITEMS`, kind `nguyen_lieu`:
- **Đá Cường Hóa I–V** (`EQUIP_STONES`): hồn thú rơi, phân giải ra; chưa bán được ở thương nhân (chờ chủ repo quyết; `buy` trong `EQUIP_STONES` chưa dùng).
- **Bùa Hộ Mệnh** (`EQUIP_CHARM`): chỉ từ rương thú vương / boss thế giới, không bán.
- **Tinh Hoa Đường Môn** (`EQUIP_ESSENCE`): từ phân giải Thần Khí / Chí Bảo; chi phí hợp thành T4 → T5.
- **Thần Hồn** (`EQUIP_SOUL`): từ phân giải Chí Bảo; dành cho khắc may mắn.

### Cường hóa +1 → +15 ở Thợ rèn
`EQUIP_ENHANCE`, `equipEnhanceStep`, `equipEnhanceResult`.
- 5 nấc theo cấp đích; đá và phí Hồn Tệ càng cao tỉ lệ càng thấp. **Đá và phí trừ cả khi thất bại.**
- Thất bại ở nấc thấp giữ cấp; nấc giữa tụt cấp.
- **+13 → +15 thất bại mà không dùng Bùa Hộ Mệnh thì PHÁ HỦY món** (biến khỏi DB); có bùa thì giữ nguyên cấp, mất 1 bùa.
- **Đây là ngoại lệ có chủ đích** với nguyên tắc cường hóa hồn cốt / hồn hạch **không bao giờ thất bại** (mục 5.5, 5.6) và với "thua không mất đồ" (mục 2): chỉ trang bị, chỉ do chính người chơi bấm cường hóa ở nấc cuối.
- Bảng xem trước hiện tỉ lệ, đá, phí và **hậu quả khi thất bại**; nút xác nhận chuyển **đỏ** khi có thể tụt cấp / phá hủy và phải bấm hai lần.

### Hợp thành 3 → 1
`EQUIP_SYNTH`.
- 1 món chính + 2 món hiến tế **cùng bậc, cùng ô, không khóa, không đang mặc** ra 1 món bậc kế, mẫu ngẫu nhiên cùng ô, giữ `EQUIP_SYNTH_KEEP` phần cấp cường hóa của món chính (làm tròn xuống). Phí Hồn Tệ trừ cả khi thất bại.
- **Thất bại:** luôn mất 2 hiến tế.
  - **T3 → T4:** món chính thêm **mất 1 cấp cường hóa** (không có độ bền).
  - **T4 → T5:** mất cả 3 món và hoàn một phần Tinh Hoa đã dùng.

### Phân giải
`EQUIP_SALVAGE`, `equipSalvage`.
- Nhận Hồn Tệ theo bậc và cấp cường hóa cùng nguyên liệu theo bảng bậc.
- **Không cho kinh nghiệm** (kinh nghiệm thuộc võ hồn, tránh phá nhịp lên cấp).
- Một transaction cho cả lượt. Tự bán / tự phân giải khi túi gần đầy là tùy chọn (mặc định tắt).

### Đại Đấu Hồn Trường
- Trang bị **tính đầy đủ**, không chuẩn hóa. Chênh lệch tối đa vài chục % có trần giảm sát thương.
- Đo (E7): trang bị đủ bộ cộng ít hơn nhiều so với hồn cốt + hồn hạch đủ bộ; chênh lệch giữa người chơi tích cực nhỏ; cùng hệ số cho mọi hệ võ hồn nên giữ `ARENA_HE_DMG`, chưa có số trận đấu thật để chỉnh. Số liệu ở `docs/trang-bi-kinh-te.md` mục E7.
- Trong sân không mặc / tháo (khóa như hồn cốt, mục 5.9).

### Chống nhân đồ và đua lệnh
- Mọi thao tác (mặc / tháo, cường hóa, hợp thành, phân giải) đi qua **chuỗi lưu của tài khoản** (mục 6 "Lưu của mỗi người chơi chạy nối tiếp"). Lệnh tới khi lệnh trước chưa xong thì từ chối ngay ("đang xử lý", như `claimBusy`).
- Mỗi lệnh là **một transaction PostgreSQL**: khóa dòng item theo id tăng dần, kiểm cột `ver` (đếm phiên bản, chống ghi chồng), chủ sở hữu, khóa, đang mặc; tung ngẫu nhiên ở server; commit một lần, lỗi thì hoàn tác và gửi lại `bagd`.
- Khóa Redis theo item khi nhiều tiến trình: xem "Cài đặt khóa Redis" dưới.

## Hiển thị
- Tab Trang bị ở bảng nhân vật: `docs/design/giao-dien.md` (mục 5.16).
- **Túi:**
  - Nhóm lọc "Trang bị hồn sư" (`BAG_GROUPS` id `trang_bi_hs`, kind `trang_bi`; khác nhóm "Trang bị" chỉ gồm hồn cốt / hồn hạch).
  - Ô trang bị phủ khung viền theo bậc (`equipFrameKey`, hai bậc cao nhất có quầng sáng), "+N" cường hóa ở góc trên trái, may mắn `M<n>` ở góc dưới phải khi có.
  - Độ hiếm (`rarityOf`) = bậc trang bị kẹp 0–4, nên "Xếp: độ hiếm" và "Theo loại" đặt bậc cao trước, cùng bậc thì cấp vật phẩm rồi cường hóa cao trước.
  - So sánh với món đang mặc dùng chú thích / thẻ thao tác ở `docs/design/giao-dien.md`.
- **Thợ rèn:** ba trang Cường hóa / Hợp thành / Phân giải có biểu tượng món + khung bậc ở danh sách chọn, bảng xem trước dạng nhãn trái / giá trị phải, và hiệu ứng khi kết quả về.
  - Nhịp sáng khi thành, rung đỏ khi bại, rung mạnh khi món bị phá hủy / mất cả 3; tắt khi người chơi chọn giảm chuyển động.
  - Tiếng `enhanceOk` / `enhanceFail` (phân giải: tiếng thả đồ); chưa có clip riêng cho "vỡ", dùng tiếng thất bại.
- **Hình trên hồn sư:** áo / mũ hiện lên lớp LPC; vũ khí do phụ thể; các ô khác không có hình (xem `docs/art/hon-su-lpc.md`).

## Khóa mẫu và quy ước ảnh
Để thay ảnh không phải sửa code.
- Mã mẫu `<ô>_<bậc>` (ví dụ `mu_tu_kim`, `vu_khi_chi_bao`; id ô ở `EQUIP_SLOTS`, id bậc ở `EQUIP_TIERS`) là **khóa ổn định, lưu DB, không bao giờ đổi hay xóa** (thêm ô / bậc mới thì thêm vào cuối).
- Ảnh 32×32 theo quy ước `item_*` của `tools/assets/README.md`:
  - `item_equip_<mẫu>`: ảnh mẫu;
  - `item_equip_slot_<ô>`: hình ô (bóng ô, cũng là **ô trống** trên búp bê);
  - `item_equip_frame_<bậc>`: khung viền theo bậc (chưa có thì vẽ viền CSS bằng `EQUIP_TIERS[].col`).
- Hàm `equipIconKey`, `equipSlotIconKey`, `equipFrameKey`, `equipIconKeys()` (đủ mọi khóa) và `equipIconChain(mẫu)` ở `shared/data.ts`. Client tra theo `equipIconChain` (ảnh mẫu → hình ô → `item_trang_bi`).
- Đá, bùa, tinh hoa, thần hồn theo `item_<mã>` như mọi vật phẩm; `tools/assets/lib.mjs` (`itemIconIds`) đã nhận các khóa này.

## Cài đặt khóa Redis (tham khảo)
`server/src/itemLock.ts` (#559): chỉ có khi presence là Redis (`REDIS_URL`, nhiều tiến trình, #120).
- `withItemLocks` lấy `lock:item:<id>` (SET NX PX, TTL ngắn `ITEM_LOCK_TTL_MS`, kèm fencing token tăng dần ở `<khóa>:fence`) của mọi món liên quan **theo id tăng dần**, chạy lệnh rồi nhả bằng compare-delete. `held()` (compare-renew) kiểm khóa còn của mình ngay trước khi chụp túi ghi DB.
- Dùng ở cường hóa, hợp thành, phân giải (trước khi đổi gì: món đang bị tiến trình / phiên khác xử lý thì từ chối "đang xử lý", như `claimBusy`) và ở lần ghi sau mặc / tháo / bán / khóa (`PData.lockIds`, `MapRoom.write`; không lấy được khóa thì lần ghi lỗi và thử lại ở lần sau, túi vẫn bẩn).
- Redis lỗi thì **fail-closed** (lệnh không chạy, không đổi gì). Không `REDIS_URL`: không khóa, hành vi như trước (chuỗi lưu + khóa dòng PostgreSQL + `ver`).
- Thử: `npm run test:itemlock --prefix server` (thêm `REDIS_URL` + `REDIS_PREFIX=test…` cho Redis thật); bot `--only bag --procs 2 --pg` (hook test `itemlock`).

## Lịch sử / issue liên quan
- Các bước E0–E7 (Giai đoạn 13): thiết kế và hàm thuần E0; lưu / mặc / tháo E1; rơi đồ E2; cường hóa E3; hợp thành / phân giải E4 (#412–#415); giao diện E5; ảnh E6; đo và cân bằng sân E7 (không đổi số).
- Khóa Redis theo item #559; hình áo / mũ trên lớp LPC HL4 #573 (thay G7 #387).
- Nhật ký từng bước: `docs/lich-su.md`.
