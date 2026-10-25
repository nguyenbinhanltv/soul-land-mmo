# Hồn cốt

Hồn cốt: vị trí, rơi, gắn, kỹ năng chủ động / bị động, cường hóa, dòng phụ. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`). Số issue ở cuối file.


## 5.5 Hồn cốt

### Vị trí, rơi, chỉ số
- **6 vị trí trên mỗi võ hồn** (`BONE_SLOTS`): đầu, thân, tay trái, tay phải, chân trái, chân phải. Đầu và hai tay cho kỹ năng **chủ động**, thân và hai chân cho kỹ năng **bị động**.
- **Rơi:** theo `BONE_DROP` (mục 5.3); hồn cốt **cùng loài, cùng số năm** với hồn thú, vị trí ngẫu nhiên đều. Rơi xuống đất cạnh hồn hoàn, cùng luật nhặt (mục 4). Ngoài rơi và rương thú vương / boss thế giới, hồn cốt còn là **phần thưởng nhiệm vụ** (mục 5.8, bài 8 chương 3). Trong túi mỗi hồn cốt một ô, tên kiểu *+5 Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm*, màu theo niên hạn.
- **Chỉ số gốc** (`boneStats`): niên hạn càng cao thì chỉ số gốc càng mạnh; một chỉ số chính theo vị trí (đầu hồn lực, thân và chân sinh lực, tay công), tỉ lệ với mức cộng của hồn hoàn cùng số năm; tính lại từ số năm khi cần (không lưu DB). Cộng phẳng vào võ hồn đang gắn (`boneBonus`), áp ngay cả khi đang ra trận.
### Gắn
- **Gắn** (mục "Hồn cốt" của bảng đội hình hoặc nút "Gắn…" ở túi; chuột kéo thả được): chỉ vào ô cùng vị trí; ô đã có thì đổi chỗ, món cũ về túi; tháo về túi khi túi đầy bị từ chối. Chỉ khi ngoài giao chiến (mục 4). Hồn cốt đang gắn không chiếm ô túi, không bỏ / bán được, **không bao giờ mất** khi gục hay thua; muốn chuyển sang võ hồn khác thì tháo trước.
### Kỹ năng
- **Kỹ năng** (`BONE_SKILLS`): theo **loài hồn thú gốc**, mỗi loài 1 kỹ năng chủ động (dùng chung cho đầu, hai tay; thường lấy từ chiêu báo trước của chính loài đó) và 1 bị động (dùng chung cho thân, hai chân; theo đặc tính con vật). Thêm loài vào `BEASTS` thì thêm mục ở đây.
  - **Chủ động:** phím Z / X / C (đầu, tay trái, tay phải; trên điện thoại 3 nút nhỏ bên trái thanh hồn kỹ). Chạy bằng bộ máy hồn kỹ, mạnh theo số năm hồn cốt (`skillPower` / `buffPower`), tốn hồn lực, mỗi nút một hồi chiêu riêng **thuộc hồn sư** (đổi võ hồn không làm mới, để không xả kỹ năng bằng đổi tay). Chỉ võ hồn đang ra trận dùng kỹ năng của hồn cốt gắn trên nó. Phần hiệu ứng có lợi lên bản thân (`self`) lan tới đồng đội hợp lệ trong `PARTY_BUFF_R` theo `PARTY_BUFF_MULT`; thanh tẩy lan nhưng không nhân hệ số. Sát thương và trạng thái lên hồn thú không lan. Bị chặn như hồn kỹ.
  - **Bị động:** cộng thường trực tốc chạy, công, chí mạng, giảm sát thương nhận, giảm tiêu hao, hút máu hoặc kháng một trạng thái (thời gian ngắn đi), × `buffPower` theo số năm; nhiều hồn cốt cộng dồn tới trần `BONE_PASSIVE_CAP`. Áp ngay khi gắn trên võ hồn ra trận, mất khi tháo hoặc đổi võ hồn.
### Cường hóa
- **Cường hóa** (nút "Cường hóa…" ở túi đồ / ô hồn cốt đang gắn, hoặc Thợ rèn; ở đâu cũng được, chỉ khi ngoài giao chiến): chọn hồn cốt đích và tối đa `BONE_FEED_MAX` hồn cốt trong túi làm **nguyên liệu**. Điểm mỗi nguyên liệu tỉ lệ với niên hạn (`BONE_FEED_PER_YEAR`), **cùng vị trí được thêm 50%** (`BONE_FEED_SAME_SLOT`), cộng một phần điểm đã nạp vào nguyên liệu (`BONE_FEED_CARRY`) (`boneFeedXp`). Điểm cộng dồn lên cấp +0 … +`BONE_MAX_ENHANCE` theo `BONE_ENHANCE_COST`; điểm vượt cấp tối đa bị bỏ (bảng xem trước báo trước).
  - **Phí Hồn Tệ** (`BONE_ENHANCE_FEE`, `enhanceFee`; nguồn ra Hồn Tệ, mục 5.7): tính theo **cấp đạt được**, không theo nguyên liệu. Mỗi lần cường hóa trả tổng phí của **mọi cấp vừa vượt qua** (lên +7 từ +4 thì trả phí +5, +6, +7); nạp điểm mà chưa lên cấp thì không mất phí; mỗi cấp chỉ trả một lần nên chia nhỏ hay một lần nhảy nhiều cấp đều cùng tổng. Các cấp thấp miễn phí. Không đủ Hồn Tệ thì **từ chối cả lần** (không mất nguyên liệu, điểm hay tiền); phí trừ cùng lúc với nguyên liệu, túi và Hồn Tệ ghi chung một transaction qua chuỗi lưu.
  - Mỗi cấp tăng chỉ số chính theo % chỉ số gốc (`BONE_ENHANCE_STAT`). Mỗi mốc `BONE_ENHANCE_MILESTONES` vừa **nâng kỹ năng** của hồn cốt (`boneSkillMult`: chủ động là sức mạnh và hiệu ứng lên bản thân, bị động là mức cộng, vẫn kẹp trần) vừa **thêm 1 dòng chỉ số phụ ngẫu nhiên** (#187), tối đa `BONE_MAX_SUBS` dòng (đủ ở mốc cuối).
  - **Dòng phụ:** tung đều trong bộ của vị trí (`BONE_SUB_POOL`, mã `CORE_STATS` như dòng phụ hồn hạch nên cộng vào chỉ số giống hệt: dòng % nhân phần gốc, dòng phẳng cộng thẳng, chí mạng vào `CRIT`; `boneBonus`), không trùng dòng đã có và không trùng chỉ số chính. Mức một dòng = `CORE_STATS[mã].sub` × `BONE_SUB_K` theo bậc niên hạn × hệ số tung trong `CORE_SUB_ROLL` (`boneSubMax`, `boneAddSubs`, tung ở server). Không tăng thêm dòng có sẵn (khác hồn hạch), để hồn cốt giữ vai "kỹ năng là chính". Dòng phụ là cơ chế game (phỏng theo *Thế Giới Săn Hồn*), không có trong truyện.
  - **Tung bù:** hồn cốt +N có ít dòng hơn số mốc đã đạt (`boneSubsDue`; cường hóa trước khi có dòng phụ) được server tung phần còn thiếu **một lần** khi nạp túi đồ lúc vào game, rồi ghi ngay qua chuỗi lưu; lần vào sau không tung thêm.
  - **Nguyên liệu bị tiêu hao, không bao giờ thất bại.** Bảng xem trước điểm, cấp sẽ đạt kèm "Phí: …", chỉ số trước / sau, dòng phụ đang có, mốc kế tiếp ("nâng kỹ năng và 1 dòng phụ ngẫu nhiên") và số dòng sẽ thêm; nút xác nhận đỏ ghi số hồn cốt sẽ mất và phí (thiếu Hồn Tệ thì nút mờ, ghi số cần / số đang có); ghi chú cuối bảng liệt kê phí theo cấp; banner báo dòng phụ vừa thêm và phí đã trả. Đang gắn thì đổi ngay; tháo ra vẫn giữ cấp, điểm và dòng phụ. Ô có "+N" ở góc; chi tiết ô túi ghi từng dòng phụ.
### Lưu
- **Lưu:** mỗi hồn cốt một dòng `items` (`kind` = `code` = `hon_cot`, `years`, `stats` = `{beast, slot, xp, subs}`, `enhance` = cấp, `vohon_id` = võ hồn đang gắn hoặc NULL). Dòng phụ lưu giá trị đã tung ở `stats.subs` như hồn hạch (`parseBoneSubs`).

## Lịch sử / issue liên quan
- Dòng phụ hồn cốt #187.
- Nhật ký từng bước: `docs/lich-su.md`.
