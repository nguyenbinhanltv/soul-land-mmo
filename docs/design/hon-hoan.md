# Hồn hoàn

Hồn hoàn, hấp thụ, hồn kỹ theo vòng, Phục Chế, Võ Hồn Chân Thân. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`); đặc tả từng hồn kỹ: `docs/art/ky-nang-combat-dac-ta.md`. Số issue ở cuối file.


## 5.2 Hồn hoàn

### Niên hạn và bậc màu
Mỗi hồn thú có tuổi ngẫu nhiên trong khoảng `years` của vùng (`rollYears`: phân bố log, càng già càng hiếm), hồn hoàn rơi ra mang đúng số năm đó. Màu (bậc) suy ra từ số năm theo `TIERS`: **trắng, vàng, tím, đen, đỏ** (đỏ = đúng 10 vạn năm). Chỉ số hồn thú tăng liên tục theo số năm (`beastStats`, nội suy giữa các mốc `TIERS`).

### Hồn hoàn là vật phẩm
Rơi xuống đất khi hạ hồn thú (luật nhặt ở mục 4), nằm trong túi mỗi chiếc một ô ghi số năm, bỏ hoặc bán được. Chọn hồn hoàn trong túi ("Hấp thụ…") rồi chọn võ hồn để hấp thụ.

### Hấp thụ
- Chọn **võ hồn bất kỳ trong bộ sưu tập** đang ở bình cảnh (cấp 10, 20, …; kinh nghiệm dừng ở đó tới khi hấp thụ). Chỉ khi ngoài giao chiến; trong vùng an toàn được.
- **Giới hạn theo vòng** (`RING_LIMIT`, theo lý thuyết của Đại Sư trong truyện). Trong giới hạn luôn thành công; vượt giới hạn có tỉ lệ thất bại theo % vượt (`ABSORB_FAIL`, `absorbChance`; % làm tròn lên); vượt quá mức cuối thì không cho hấp thụ. Bảng chọn hiện giới hạn vòng kế tiếp, % vượt và tỉ lệ thất bại trước khi xác nhận; client và server dùng chung `absorbChance`.
- **Thất bại thì chỉ mất hồn hoàn đó**, không phạt gì thêm.
- Thời gian tăng theo niên hạn (`ABSORB_SECS`, `absorbSecs`, nội suy theo log số năm). Di chuyển hoặc bị đánh thì hủy, hồn hoàn vẫn còn trong túi.
- Thành công: võ hồn lên 1 cấp, vòng lưu đúng số năm, mở hồn kỹ của vòng đó. Vòng 10 hấp thụ ở cấp 100 nên không lên thêm cấp. Võ hồn chưa có dữ liệu hồn kỹ của vòng thì vòng đó chỉ tăng chỉ số (có báo).

### Hồn kỹ theo vòng
- Vòng 1–6: mỗi vòng một hồn kỹ riêng. Vòng 7: **Võ Hồn Chân Thân**. Vòng 8–9: hồn kỹ mạnh. Vòng 10: **tuyệt kỹ** (`SkillDef.ult`: tên lớn bay lên, vòng sáng, chớp màn hình cho người ở gần).
- Dữ liệu: vòng 1–4 `VOHON_SKILLS`, vòng 5/6/8/9/10 `VOHON_SKILLS_HIGH` (`HIGH_RINGS`), tiên cơ `TIEN_CO_RIENG`, Chân Thân `CHAN_THAN`; tra hồn kỹ của vòng bằng `ringSkill`. Bảng chi tiết hồn kỹ từng võ hồn (tên, vùng tác dụng, số liệu) chính là các bảng này trong `shared/data.ts`. Mọi võ hồn trong `VOHON` đều đủ dữ liệu. `SKILLS` (Hồn Bạo, Thiểm Kích, Hồn Tiễn, Hồn Vực) là hồn kỹ chung dự phòng cho võ hồn thêm sau.
### Ô mang theo và hồi chiêu
- **4 ô mang theo** (U / I / O / P, `LOADOUT_SIZE`, `loadoutOf`): mỗi võ hồn tự nhớ 4 ô, mỗi ô là một vòng có hồn kỹ đã mở hoặc để trống; chưa chọn thì mặc định vòng 1–4 (`DEFAULT_LOADOUT`). Xếp ở bảng đội hình, mục "Hồn kỹ mang theo" (đang ở ô khác thì đổi chỗ, nút "Bỏ"), chỉ khi ngoài giao chiến. Tuyệt kỹ cũng xếp vào ô như hồn kỹ thường, không có phím riêng.
- **Hồi chiêu theo ô của hồn sư**, nhưng server nhớ hồi chiêu còn lại của từng hồn kỹ: xếp lại ô thì hồi chiêu **đi theo hồn kỹ**; đổi võ hồn vào thì ô giữ hồi chiêu chung nhưng ít nhất bằng phần còn lại của hồn kỹ đó. Vì vậy đổi chỗ, bỏ ra rồi xếp lại không làm mới hồi chiêu.
### Sức mạnh và vùng tác dụng
- **Sức mạnh theo số năm hồn hoàn của đúng vòng đó:** `skillPower(năm)` nhân sát thương (nội suy log giữa các mốc `TIER_MULT`); hiệu ứng có lợi, hồi sinh lực, khiên, hồn lực tăng chậm hơn: `buffPower` (`BUFF_SCALE`). Thời gian khống chế không đổi theo năm. Sát thương theo % sinh lực tối đa mỗi nhát bị kẹp (`PCT_HP_CAP`) để boss không bị bào quá nhanh.
- Mỗi lần tung chỉ tạo năng lượng tiên cơ một lần dù nhiều nhát. Hồn kỹ phụ trợ không gây sát thương nên không tạo năng lượng.
- **Vùng tác dụng** (`SkillDef`): quanh thân, nửa trước mặt, lướt thẳng (trúng mọi mục tiêu trên đường), mục tiêu gần nhất (có thể lướt tới, nhiều nhát), bắn mũi (quạt hoặc vòng tròn), bản thân, vùng cố định (`at` đặt lên mục tiêu, `fixed` ở chỗ đứng; không đi theo hồn sư). Hồn kỹ cần mục tiêu mà không có hồn thú / đối thủ trong tầm thì không tung, không tốn hồn lực, không hồi chiêu.
### Cơ chế hồn kỹ
- **Cơ chế hồn kỹ** dùng chung: nhiều nhát quanh thân (nhát cuối gây `finisher`); Viêm bạo (`boom`: kích nổ Thiêu đốt rồi đặt lại tầng; `boom.last` / `boom.mult` cho tuyệt kỹ Hỏa Long kích nổ ở đợt cuối); đẩy lùi (`push`), kéo về (`pull`); khóa mục tiêu yếu máu (`pick: "low"`) và thêm sát thương theo máu đã mất (`lowHp`); thêm sát thương theo tầng trạng thái trên mục tiêu (`perStack`); thêm sát thương khi mục tiêu đang có một trạng thái (`vsSt`, Băng Hỏa Lưỡng Nghi của dung hợp kỹ); sét tìm mọi mục tiêu Cảm điện ngoài vùng (`shockR`); bay (`fly`, chỉ hình ảnh, bất tử ngắn bằng `inv`); hút máu (`lifesteal`); xóa hiệu ứng có lợi của hồn thú (`dispel`); thanh tẩy.
- **Phục Chế** (`SkillDef.copy`, Xúc Xích): tung lại **hồn kỹ gần nhất về thời gian** của một võ hồn khác còn trong đội mình (chưa gục) hoặc của đồng đội tổ đội cùng phòng đứng trong `COPY_R` pixel, tung trong `COPY_WINDOW` giây; dùng công của Xúc Xích và sức mạnh theo hồn hoàn của vòng Phục Chế (bản thường giảm hệ số, bản đại thành vòng 9 không giảm). Không chép tuyệt kỹ, hồn kỹ Chân Thân, tiên cơ, kỹ năng hồn cốt, hồn kỹ của võ hồn có Phục Chế. Không có gì để chép thì không tung, không tốn gì.
### Võ Hồn Chân Thân
- **Võ Hồn Chân Thân** (vòng 7, phím R / nút "Chân Thân"): biến hình vài chục giây, chỉ số cộng thêm (`ChanThanDef`, × `buffPower` theo hồn hoàn vòng 7: công, giảm sát thương nhận, tốc độ, chí mạng, giảm tiêu hao, sinh lực tối đa; phần sinh lực tối đa tăng được hồi luôn), kèm một đòn biến hình lúc biến. Tốn hồn lực, **hồi chiêu riêng từng võ hồn**. Chân Thân **thuộc võ hồn**: đổi võ hồn (kể cả tự đổi khi gục), cả đội gục, đi cổng thì hết. Chặn như hồn kỹ (vùng an toàn, gục, hấp thụ, Choáng / Câm lặng). Không lưu DB. Hình: hồn sư giữ nguyên cỡ, sau lưng hiện pháp tướng của võ hồn (mục 5.18).
- **Hồn kỹ Chân Thân** (`ChanThanDef.skill`): trong lúc Chân Thân, ô P (`CHAN_THAN_SKILL_SLOT`) tung hồn kỹ Chân Thân riêng của võ hồn thay hồn kỹ đang mang ở ô P (kể cả khi ô trống); hết Chân Thân thì ô P trở lại. Tốn `CHAN_THAN_SKILL_COST` hồn lực, hồi chiêu riêng `CHAN_THAN_SKILL_CD` (`PlayerState.ctCd`; hồn kỹ ô P cũ vẫn hồi chiêu tiếp). Mạnh theo hồn hoàn vòng 7, cùng lối đánh với hồn kỹ vòng 9 của võ hồn đó; nhận ràng buộc Song Sinh Võ Hồn, không nhận sao, Phục Chế không chép. Nút P viền vàng, đổi tên và biểu tượng.
### Tên hồn kỹ
- **Tên hồn kỹ:** lấy theo truyện khi biết (Lam Ngân Bá Vương Thương, Hạo Thiên Cửu Tuyệt, Loạn Phi Phong Chùy Pháp, U Minh Bách Trảo, Vô Địch Thần Quang, Lôi Động Minh Thiên, Yêu Cung / Thuấn Di / Vô Địch Kim Thân / Bát Đoạn Suất / Mị Hoặc của Tiểu Vũ, Khôi Phục Đại Hương Tràng / Phục Chế Hương Tràng của Áo Tư Tạp…), còn lại đặt theo phong cách Đấu La. Không để hai hồn kỹ của cùng võ hồn trùng hoặc gần trùng tên (bản nhỏ ở vòng 3–4 mang tên khác tuyệt kỹ thật ở vòng 10). Chỉ đổi tên khi có tên truyện chắc chắn.

## Lịch sử / issue liên quan
- Hồn kỹ Chân Thân và pháp tướng: #482 (xem `docs/design/ky-nang-combat-phap-tuong.md`). Phục Chế: bộ máy hồn kỹ chung.
- Nhật ký từng bước: `docs/lich-su.md`.
