# Hồn thú, tinh anh, thú vương và boss

Luật chơi của hồn thú ở bản đồ (mục 5.3 cho bản đồ và hồn thú thường, mục 5.4 cho bốn bậc). Số liệu chỉ ở `shared/data.ts` (tên hằng viết trong dấu `code`); cách đồng bộ, phòng và kênh xem phần "Liên quan" cuối file.

## Luật chung của hồn thú

### Chỉ số, hành vi, di chuyển
- **Chỉ số hồn thú tăng theo số năm** (`beastStats`), không nhảy theo màu. Loài (`BEASTS`, mã cố định dùng cho sprite `beast_{id}`) quyết định kiểu tấn công, chiêu và hệ số chỉ số. Kích thước, tốc độ và Hồn Tệ rơi (`BEAST_COIN`) theo bậc màu.
- **Phát hiện và lang thang:** thấy người trong `BEAST_AGGRO_R`; lang thang quanh chỗ sinh (`BEAST_WANDER`). Quanh trại cổng, mọi cổng và điểm `arrive` không sinh hồn thú (`SPAWN_CLEAR`, mục 5.8).
- **Tốc độ theo dáng đi** (`BEAST_GAIT`, nhân `spd` theo bậc ở `TIERS`): lang thang chậm, đuổi mục tiêu nhanh hơn (`chase`), bị Mê hoặc đi lung tung (`charm`). Cuồng nộ, giai đoạn 2 của thú vương, nổi giận của boss thế giới và Làm chậm nhân thêm. Đòn đánh, tầm và chiêu báo trước không đổi theo tốc độ.
- **Giới hạn đuổi** (`BEAST_LEASH`): hồn thú thường và tinh anh đuổi xa chỗ sinh quá `r` pixel thì bỏ mục tiêu và chạy về chỗ sinh.
  - Trên đường về không nhận mục tiêu mới (bị đánh cũng không quay lại).
  - Hồn thú thường hồi nhanh sinh lực; tinh anh hồi đầy khi bỏ giao chiến (mục 5.4).
  - Về tới nơi, hoặc hết `secs` giây vì vướng, thì lang thang như cũ.
  - Thú vương và boss thế giới không ra khỏi hang nên không có giới hạn này.
- **Thú thực vật đứng yên** (`BEAST_ROOTED`: Thực Nhân Hoa, Quỷ Đằng và Quỷ Đằng non, Cổ Mộc Thụ Nhân, kể cả tinh anh mượn các loài này):
  - Cắm rễ ở chỗ sinh: không lang thang, không đuổi, không bị đẩy lùi / kéo, bị Mê hoặc cũng không đi.
  - Đánh thường quất xa hơn hồn thú khác (`beastMelee`, thêm `BEAST_ROOTED.lash`) để hồn sư không đứng ngoài tầm đánh trả mà vẫn đánh tới được.
  - Tầm với là tầm đánh thường đó hoặc tầm chiêu báo trước xa nhất (cộng `BEAST_ROOTED.margin`); chỉ nhận và giữ mục tiêu trong tầm với (tối đa `BEAST_AGGRO_R` khi nhận), ra ngoài thì bỏ.

### Thủ
`BEAST_DEF`, `BEAST_DEF_MULT`, `beastDef`, `defMult`.
- Thủ là phần sát thương đòn trực tiếp mà hồn thú đỡ. Theo loài (giáp / mai / vỏ cây dày thì cao; côn trùng / chim / hoa thì thấp) và tăng nhẹ theo số năm. Tinh anh, thú vương, boss thế giới theo loài gốc.
- Công hồn sư cân theo hồn thú thủ chuẩn (`BEAST_DEF.ref`): thủ chuẩn nhận đúng sát thương gốc, thủ cao nhận ít hơn, thủ thấp nhận nhiều hơn.
- Phá giáp và xuyên thủ (bộ Thất Sát) giảm thủ thật; cộng lại tối đa hết thủ.
- Sát thương theo thời gian và lan Cảm điện không tính thủ.

### Chiêu có báo trước
`BEAST_SKILLS`, chọn theo loài và năm bằng `beastSkillOf`.
- Hồn thú thường **từ `BEAST_SKILL_YEARS` năm** có 1 chiêu theo loài; dưới mức đó chỉ đánh thường.
- Có mục tiêu `TELE_FIRST` giây thì tung khi mục tiêu trong tầm, rồi hồi chiêu (dao động để bầy không tung cùng lúc).
- Hồn thú đứng yên `TELE_WARN` giây, hiện vùng đỏ đầy dần: hình **vệt**, **nón** hoặc **vòng** quanh thân / dưới chân mục tiêu. Hướng và tâm khóa lúc bắt đầu.
- Hết giờ mới tính trúng theo **vị trí thật** lúc đó: chạy ra khỏi vùng là né được. Không trúng người trong vùng an toàn, đang đi cổng, đã gục.
- Chiêu "lao": hồn thú lao tới cuối vệt / tâm vòng.
- Sát thương là bội số đòn thường của hồn thú; chiêu có thể gây trạng thái lên hồn sư.

**Chiêu của tinh anh / thú vương** dùng cùng bộ máy, thêm các tùy chọn:
- Nhiều vùng một lần tung (`count` / `spread` / `step`); chiêu "nhiều nhát nối tiếp" tung các vùng cùng lúc hoặc gộp bội số.
- Vòng rơi ngẫu nhiên quanh mục tiêu (`scatter`); chiêu toàn sàn (`floor`).
- Gọi bầy (`summon`); kéo người (`pull`).
- Đánh dấu một người tham gia (`mark`); nhắm người ít máu nhất (`weak`).
- Hút máu từ người đang bị Trói (`drain`).

### Vùng lưu lại trên mặt đất
Chiêu có `ground` (`GroundDef`), như vũng độc, sương độc. Dùng cho Phun Độc (Thất Tinh Độc Thiềm), Sương Độc (Độc Vụ Thiềm), Nổ Túi Độc (tinh anh Kim Bối Thất Tinh Thiềm), Lân Độc Vụ (tinh anh Song Đầu Bích Lân Xà); thời gian ở từng chiêu.
- Hết báo trước thì tính trúng như mọi chiêu, rồi để lại vùng đúng hình các vùng báo trước của lần tung đó, tồn tại `secs` giây.
- Mỗi nhịp (`GROUND_TICK`, nhịp đầu ngay lúc tung) hồn sư đứng trong vùng bị gây trạng thái của vùng (vũng / sương độc: Trúng độc cộng tầng). Ra khỏi vùng thì thôi nhận; tầng đã có hết theo thời gian.
- Không tác dụng lên người trong vùng an toàn, đang đi cổng, đã gục, đang miễn sát thương (Vô Địch Thần Quang).
- Vùng mất khi hết giờ, hoặc khi **hồn thú gây ra bị hạ / rời bản đồ** (thú vương rút đi). Hồn thú bỏ giao chiến không làm mất vùng.
- Mỗi phòng tối đa `GROUND_MAX` vùng; quá thì bỏ vùng cũ nhất.
- **Báo trước** (`warn`): hiện ở dạng nước sắp dâng, chưa gây gì; `secs` tính từ lúc hết báo trước.
- **Kéo về tâm** (`pull` pixel mỗi giây, mỗi nhịp server): dừng khi vướng, tới tâm hoặc sắp vào vùng an toàn; cùng điều kiện không tác dụng như trên. Dùng cho vùng ngập và xoáy nước của Thủy Triều Dâng (mục 5.4).
- **Gây trạng thái một lần mỗi người** (`once`: nhịp đầu tiên người đó đứng trong vùng): dùng cho khống chế như Đóng băng, Trói để người dính vẫn đi ra được; xem hang chia phần (mục 5.4).
- Client vẽ trên mặt đất theo phép chiếu, màu theo `GROUND_KINDS` (không đỏ; đỏ dành cho báo trước).

### Che tầm nhìn
Phun Mực của tinh anh Ma Chương Vương (Ma Quỷ Hải Vực): vòng nhắm người; hồn sư trúng nhận trạng thái Che tầm nhìn (mục 5.1, thời gian `STATUS.ink`). Chỉ màn hình của người đó phủ mực; server không đổi luật đánh (không Câm lặng, không Làm chậm).

### Rơi đồ dựa vào farm
Mỗi lần hạ hồn thú, mỗi loại đồ tung tỉ lệ riêng theo niên hạn:
- Hồn hoàn luôn rơi; mảnh võ hồn `SHARD_DROP`; hồn cốt `BONE_DROP`; hồn hạch `CORE_DROP` (kèm khoảng sao).
- Hồn thú càng già tỉ lệ càng cao; tinh anh và boss có hệ số riêng (mục 5.4).

## 5.4 Bậc hồn thú: thường, tinh anh, thú vương, boss thế giới
Mỗi hồn thú thuộc 1 trong 4 bậc (`BeastState.rank` 0–3). Hệ số nhân vào chỉ số của hồn thú thường cùng loài, cùng niên hạn.

| | Thường | Tinh anh (biến dị) | Tà hóa thú vương | Boss thế giới |
|---|---|---|---|---|
| Hệ số | – | `ELITE` | `BossDef.hp` theo bản đồ, `KING` | `WORLD` |
| Máu tăng theo số người | Không | Có | Có | Có |
| Số lượng | Theo `count` của vùng | 1 con mỗi vùng săn | 1 con mỗi bản đồ săn (trừ Thánh Hồn Thôn), mỗi kênh một con | 1 con mỗi kênh của Lõi Tinh Đấu |
| Xuất hiện | Hồi sinh liên tục | Hồi sinh ngẫu nhiên sau khi bị hạ (`ELITE.respawn`) | Theo lịch `KING_TIMES` | 1 lần/ngày lúc `WORLD_TIME`, hai boss luân phiên theo ngày |
| Chiêu báo trước | 1 chiêu (từ ngàn năm) | 2 chiêu | 2 chiêu + chiêu giai đoạn 2 | Chiêu thường + cơ chế riêng, nổi giận |
| Thưởng | Bảng rơi mục 5.3 | Hồn cốt tỉ lệ cao hơn, chắc chắn 1 hồn hạch | Rương theo đóng góp | Hồn hoàn đỏ / đen và rương theo đóng góp |
| Giới hạn nhận thưởng | – | Mỗi loài tinh anh mỗi bản đồ một lần mỗi `ELITE.lock` giây, chung mọi kênh | `KING.daily` lần/ngày | `WORLD.daily` lần/ngày |

**Nhận diện**
- Tinh anh: tên "Tinh anh …" màu riêng, aura, sprite loài gốc phóng `ELITE.scale`, chấm sáng trên radar.
- Thú vương và boss thế giới: phóng `KING.scale` / `WORLD.scale` khi chưa có sprite riêng (mục 5.11; chỉ client đọc, ở `rankScale`). Thanh máu lớn ở đầu màn hình, bảng xếp hạng đóng góp, chấm đỏ lớn và khung hang / sàn trên radar.

## Tinh anh (biến dị)

### Sinh và giao chiến
- Niên hạn bằng mức trên của vùng. Sinh ở điểm ngẫu nhiên trong chữ nhật `elite` (không trong vùng an toàn, không trong `SPAWN_CLEAR`, không sát người chơi), không tính vào `count`. Bị hạ / hồi sinh thì cả bản đồ được báo.
- Bán kính giao chiến `ELITE.radius`; máu theo số người tham gia (mục "Máu tăng theo số người tham gia"). Tinh anh đang giao chiến không tự hồi máu.

### Cơ chế riêng
- **Cuồng nộ** (`ELITE_RAGE`, hiệu ứng có lợi của hồn thú `BEAST_BUFFS`): máu dưới ngưỡng thì nổi một lúc (sát thương và tốc độ tăng). Hết giờ hoặc bị xóa (hồn kỹ có `dispel`, ví dụ Thiên Càn Trấn Áp) thì phải chờ mới nổi lại.
- **Đổi dạng** (`BossDef.forms`, `FormDef`): tinh anh Băng Hỏa Song Sắc Mãng ở Băng Hỏa Tuyền luân phiên dạng băng / hỏa, mỗi dạng `every` giây (dạng đầu ngẫu nhiên khi sinh, chạy cả lúc chưa giao chiến).
  - Chiêu có `forms` gây trạng thái theo dạng **lúc bắt đầu báo trước** (dạng băng Làm chậm, dạng hỏa Thiêu đốt); đổi dạng giữa lúc báo trước không đổi chiêu đang tung.
  - Hiển thị: aura màu dạng đang có (`BeastState.form`, kể cả khi Cuồng nộ); `warn` giây cuối của dạng (`BeastState.formWarn`) aura nhấp nháy màu dạng sắp tới; khi đổi dạng hiện chữ "Hóa …" và vòng màu.

### Thưởng
- Hồn hoàn, hồn cốt ưu tiên **người đóng góp nhiều nhất** còn trong phòng (không thì người hạ).
- Tỉ lệ hồn cốt × `ELITE.bone` (hồn cốt mang loài gốc); **chắc chắn rơi 1 hồn hạch** (sao theo niên hạn, bộ theo bản đồ).
- Kinh nghiệm × `ELITE.xp` cho người hạ (chia tổ đội như hồn thú thường).

### Giới hạn săn nhiều kênh
- Mỗi kênh có tinh anh hồi sinh riêng. Tài khoản đã nhận thưởng tinh anh (kinh nghiệm × `ELITE.xp`, hoặc quyền ưu tiên đồ rơi tinh anh) của một loài trên một bản đồ thì `ELITE.lock` giây sau mới nhận lại thưởng của loài đó trên bản đồ đó, ở bất kỳ kênh nào.
- `ELITE.lock` không lớn hơn mức dưới của `ELITE.respawn`, nên chờ tinh anh hồi sinh trong cùng một phòng không bao giờ bị chặn.
- Phòng bị hủy rồi mở lại thì sinh tinh anh ngay; hạ trong lúc còn khóa chỉ được thưởng như hồn thú thường, nên ra vào bản đồ cũng không nhân thưởng.
- Trong lúc khóa vẫn đánh được và được nhắc thời gian còn lại. Người bị khóa nhận kinh nghiệm như hồn thú thường, không được ưu tiên đồ rơi tinh anh.
- Quyền ưu tiên sang người đóng góp nhiều nhất chưa bị khóa còn trong phòng (cả người hạ cũng không, nếu người hạ bị khóa). Câu báo đồ rơi ghi rõ "đóng góp nhiều nhất trong số người chưa bị khóa thưởng tinh anh".
- Không còn ai đủ điều kiện thì đồ rơi như hồn thú thường (người hạ ưu tiên, tỉ lệ hồn cốt / hồn hạch thường, không chắc chắn hồn hạch).
- Mỗi bản đồ mỗi loài tinh anh chỉ ở một vùng (bản đồ trùng loài thì server bỏ con sau và cảnh báo).

## Tà hóa thú vương (boss bản đồ)

### Hang, lịch và giai đoạn
- Ở trong **hang** (object `boss`, cũng là bán kính giao chiến), không ra khỏi hang, không bị đẩy lùi, đuổi bất kỳ ai trong hang. Niên hạn bằng mức trên của bản đồ (hoặc `BossDef.years`, `kingYears`).
- **Theo lịch** `KING_TIMES` giờ Việt Nam. **Cả server** được báo trước `KING.warnSecs` giây (đếm ngược trên màn hình, người vào sau vẫn thấy thời gian còn lại) và lúc xuất hiện. Không ai hạ trong `KING.lifeSecs` giây thì rút đi (báo toàn server).
- **Giai đoạn 2** khi còn `KING.phaseHp` máu: gầm (đứng yên, mất và không nhận khống chế), rồi thêm chiêu giai đoạn 2 (`BossDef.phase2`) và nhanh hơn.
- Mọi cơ chế giai đoạn 2 dưới đây chỉ chạy khi thú vương đang giao chiến, từ lúc hết tiếng gầm.

### Cực Hàn (Huyền Minh Băng Giao)
`BossPhase.cold`, số liệu ở `ColdDef` và `STATUS.chill`.
- Mỗi người tham gia đứng trong hang (chưa gục, không đi cổng) cứ `every` giây thêm một tầng **Hàn** (trạng thái trên hồn sư, mục 5.1). Đủ `STATUS.chill.max` tầng thì bùng phát thành **Đóng băng** (thời gian `STATUS.chill.burst`), tầng về 0 và có tin báo.
- Đang Đóng băng hoặc miễn sát thương (Vô Địch Thần Quang) thì ngừng tích.
- **Hỏa Đàn** (đống lửa trong hang): đứng cách không quá `fire.r` thì xả hết tầng và không tích (tin "Hơi ấm Hỏa Đàn…"). **Thanh tẩy** (tiên cơ / hồn kỹ phụ trợ) cũng xả hết.
- Tầng không tự hết giờ; mất hết khi rời hang, bị loại khỏi người tham gia, cả đội gục, vào vùng an toàn, hoặc thú vương bị hạ / rút đi / bỏ giao chiến.
- **Cài đặt:** Hỏa Đàn đặt ở điểm đi được trong hang gần điểm tỉ lệ `fire.at` của hình chữ nhật `boss` nhất, quanh nó `fire.clear` pixel mỗi phía đều đi được (`hoaDanSpot`, `shared/hoaDan.ts`; server và client cùng tính, không cần object riêng trong Tiled).
- **Hiển thị:** client vẽ bằng code vòng hơi ấm bán kính `fire.r` trên mặt đất, vòng đá, củi, lửa lay động, tàn lửa, ánh lửa (Light2D) và nhãn "Hỏa Đàn". Chính mình thấy ô "Hàn n/tối đa" cạnh trạng thái khác; ai cũng thấy bông tuyết trên đầu với chấm số tầng (`PlayerState.han`).

### Thủy Triều Dâng (Thâm Hải Ma Kình Vương)
`BossPhase.tide`, số liệu ở `TideDef` và `STATUS.flood`.
- Cứ `every` giây nước dâng một đợt `flood.n` **vùng ngập** tròn bán kính `flood.r` ở chỗ ngẫu nhiên trong hang; `whirl.n` vùng trong đợt có **xoáy nước** đồng tâm bán kính `whirl.r`.
- Mỗi vùng là vùng lưu lại (mục "Vùng lưu lại trên mặt đất"); cả đợt báo trước `warn` giây. Đợt mới hết báo trước thì nước đợt cũ rút, nên chỗ ngập đổi theo từng đợt (luân phiên).
- Đứng trong vùng ngập: trạng thái **Ngập nước** (Làm chậm `STATUS.flood`, cộng Làm chậm khác tối đa `SLOW_CAP`, mục 5.1), gây lại mỗi `flood.ground.every` giây; ra khỏi nước thì hết sau thời gian ngắn của trạng thái.
- Đứng trong xoáy: bị kéo về tâm `whirl.ground.pull` pixel mỗi giây (đi bộ trong nước vẫn thoát được nếu không bị Làm chậm thêm).
- Thú vương bỏ giao chiến / rút đi thì nước rút ngay; bị hạ thì nước mất.
- Chiêu báo trước giai đoạn 2 là Sóng Dữ (vệt sát thương, không Làm chậm).
- **Cài đặt:** chọn chỗ ngập bằng `tideSpots` (`server/src/rooms/tide.ts`): đi thẳng tới được từ chỗ sinh của thú vương, phần lớn vùng đứng được, ngoài vùng an toàn, tâm cách nhau ít nhất `gap` × bán kính, cách mọi tâm của đợt trước ít nhất `shift` × bán kính. Thử cả đợt nhiều lần (`WAVE_TRIES`); vẫn không đủ chỗ thì bỏ điều kiện cách đợt trước (chấp nhận chỗ gần đợt trước).
- **Hiển thị:** client vẽ bằng code (`drawWater`, isometric và `?view=topdown`): mặt nước xanh sâu, gợn sóng lan, ánh lấp lánh; xoáy có các nhánh xoắn quay về tâm và lõi tối. Lúc báo trước (`GroundState.wait`) chỉ viền đứt nhấp nháy và vòng nước dâng từ tâm ra mép. Ngập nước: ô trạng thái và biểu tượng sóng trên đầu.

### Hang chia phần luân phiên (Lưỡng Nghi Thủ Hộ Xà, Thiên Độc Chu Hoàng)
`BossPhase.split`, số liệu ở `SplitDef`; `server/src/rooms/split.ts`.
- Hang (chữ nhật `boss`) chia theo cạnh dài thành `parts` phần bằng nhau. Mỗi lúc **một phần hang hóa** thành vùng lưu lại theo kiểu `grounds[phần]` (mỗi phần luôn cùng một kiểu), báo trước `warn` giây rồi có tác dụng tới lúc đổi.
- Cứ `every` giây phần đang hóa tan và phần kế tiếp bắt đầu báo trước (phần đầu ngẫu nhiên, sau đó lần lượt), nên luôn có chỗ đứng an toàn.
- Thú vương bỏ giao chiến / rút đi thì phần đang hóa tan ngay; bị hạ thì mất.
- **Lưỡng Nghi Luân Chuyển** (Lưỡng Nghi Thủ Hộ Xà): hang chia nửa băng, nửa lửa.
  - Đứng nhầm nửa băng đang hóa: **Đóng băng** một lần (`once`), rồi Làm chậm mỗi nhịp khi còn đứng.
  - Đứng nửa lửa: **Thiêu đốt** cộng tầng mỗi nhịp (thiêu đốt nặng). Đứng ở nửa kia thì không bị gì.
  - Giai đoạn 2 không có chiêu báo trước riêng (hai chiêu hơi thở vẫn dùng).
- **Tơ Vạn Chu Phệ** (Thiên Độc Chu Hoàng): tơ phủ lần lượt 1/3 hang (vùng cấm). Bước vào tơ: **Trói** một lần, rồi Làm chậm mỗi nhịp khi còn đứng. Cùng giai đoạn với bọc trứng.
- **Hiển thị:** client vẽ bằng code (`drawLairPart`, isometric và `?view=topdown`): băng là mặt băng xanh nhạt với tinh thể lấp lánh; lửa là nền cam với tàn lửa bay lên; tơ là các sợi tơ chéo đan nhau. Viền và nền rất nhạt của phần hang vẽ thêm trên lớp phủ (trên tán cây, vì hang ở bản ×8 nhiều cây che mặt đất). Lúc báo trước (`GroundState.wait`) nền rất nhạt, viền nhấp nháy và vệt màu quét dọc phần sắp hóa.

### Bọc trứng (Vạn Chu Phệ, Thiên Độc Chu Hoàng)
Chiêu có `eggs`, số liệu ở `EggDef`.
- Tung xong đẻ `n` bọc trứng quanh thân trong hang. Bọc là hồn thú đứng yên của loài nhện con (không đi, không đánh, không tung chiêu, không bị đẩy / kéo), đánh được bằng đòn thường và mọi hồn kỹ, máu bằng `hp` lần máu nhện con cùng số năm.
- Hiển thị: trên đầu ghi số giây còn lại, dưới chân vòng đồng hồ nở (đỏ khi sắp nở).
- Còn nguyên sau `secs` giây thì nở `per` nhện con cùng số năm, lao vào mục tiêu của thú vương. Bị phá trước đó thì vỡ, không nở.
- Phá bọc **không** có kinh nghiệm, Hồn Tệ, đồ rơi hay đóng góp (không thành nguồn farm). Nhện con nở ra là hồn thú do thú vương gọi ra như gọi bầy (thưởng như hồn thú thường, không tính đóng góp).
- Nhện con còn sống do nó gọi cộng số nhện sẽ nở từ các bọc không vượt `n` × `per`: lần đẻ sau chỉ thêm đủ tới mức đó.
- Thú vương bị hạ / rút đi thì bọc tan, không nở.

### Chia thưởng theo đóng góp
- Đóng góp = sát thương + hồi máu / khiên thực cho người tham gia khác (× `SUPPORT_CONTRIB`; tự hồi cho mình không tính).
- Mọi người đóng góp còn trong phòng nhận kinh nghiệm × `KING.xp`; người nhiều nhất được ưu tiên hồn hoàn; người hạ nhận Hồn Tệ.
- Ai đóng góp **từ `KING.share`** và còn trong phòng nhận **rương** vào túi (túi đầy vẫn vào, ô tạm vượt mức). Hồn cốt và mảnh chỉ nằm trong rương.
- Tối đa `KING.daily` rương mỗi ngày mỗi tài khoản, chung mọi bản đồ; mỗi khung giờ chỉ một rương dù hạ ở kênh nào. Hết lượt vẫn đánh và nhận kinh nghiệm, có nhắc khi vào giao chiến.
- **Mở rương** trong túi cần `KING_CHEST.slots` ô trống; nội dung ở mục 5.3 "Rơi đặc trưng".

## Máu tăng theo số người tham gia
Áp dụng cho tinh anh, thú vương, boss thế giới.

> Máu tối đa = máu gốc × hệ số bậc × `bossHpMult(N)` = × (1 + `BOSS_HP_PER_PLAYER` × (N − 1)), N là số người tham gia. Không có trần N.

- **Người tham gia** là hồn sư trong phòng và: đứng trong bán kính giao chiến lúc boss bắt đầu giao chiến (lần đầu bị đánh), hoặc sau đó gây sát thương lên boss / hồi máu, tạo khiên cho một người tham gia khác. Người đang gục vẫn được tính.
- **Vào giữa trận:** N tăng ngay, máu tối đa tính lại và **máu hiện tại giữ nguyên tỉ lệ** (vào phút cuối không làm boss dễ hơn).
- **Rời giữa trận:** rời phòng hoặc ở ngoài bán kính `outSecs` giây liên tục thì bị loại. N giảm tối đa 1 mỗi `dropEvery` giây, máu giữ tỉ lệ. Người bị loại giữ đóng góp đã gây nhưng phải còn trong phòng lúc boss bị hạ mới nhận thưởng. Hệ số đã giảm không làm boss hồi máu.
- **Bỏ giao chiến:** `idleSecs` giây không còn người tham gia trong bán kính thì boss về chỗ, hồi đầy, xóa danh sách và đóng góp.
- **Đóng góp gắn theo tài khoản và theo kênh:**
  - Thoát rồi vào lại phòng, hoặc đổi kênh rồi quay về, khi boss chưa bỏ giao chiến thì đóng góp cũ vẫn còn (không tự thành người tham gia lại: phải đánh / hỗ trợ lại như người vào giữa trận).
  - Đóng góp thuộc con boss của từng kênh; đóng góp ở kênh này không tính cho con ở kênh khác. Vẫn phải còn trong phòng lúc boss bị hạ mới nhận thưởng.

## Boss thế giới 100.000 năm

### Xuất hiện và nổi giận
- Ở **Lõi Tinh Đấu**, sàn đấu bên hồ trung tâm (object `boss` phủ sàn). *Thái Thản Cự Viên* và *Thiên Thanh Ngưu Mãng* **luân phiên theo ngày** (`worldBossOn`, để biết trước hôm nay đánh con nào), xuất hiện `WORLD_TIME` giờ Việt Nam; báo toàn server trước và lúc xuất hiện.
- Sau `WORLD.enrageSecs` giây thì **nổi giận**: sát thương, tốc độ, hồi chiêu mạnh hơn; thêm chiêu toàn sàn *Bạo Nộ* (`WORLD_SLAM`, chu kỳ `WORLD.slamEvery`).
- Hết `WORLD.lifeSecs` mà chưa hạ thì **lặn xuống hồ**, không ai nhận thưởng.
- **Không nhận khống chế** (Choáng, Trói, Câm lặng, Mê hoặc; Mị hoặc đủ tầng không thành Mê hoặc). Làm chậm và trạng thái sát thương (Thiêu đốt, Trúng độc, Phá giáp, Dễ thương…) vẫn nhận.

### Chiêu toàn sàn né được
Bạo Nộ, Thanh Lân Độc Vụ, Đại Địa Chấn: `BeastSkillDef.safe`, số vòng / bán kính ở `FLOOR_SAFE`.
- Lúc bắt đầu báo trước, server rải các **vòng an toàn** trong sàn: mỗi vòng một dải theo bề ngang sàn, đi thẳng từ chỗ sinh của boss tới được, không chồng nhau.
- Chiêu nổ thì trúng mọi người đứng trong sàn **trừ** người đứng trong một vòng (chạm vòng là an toàn, `teleSafe`) hoặc đã ra khỏi sàn.
- Thời gian báo trước tính để từ phần lớn sàn đi bộ kịp tới vòng gần nhất (bị Làm chậm / khống chế thì có thể không kịp).
- Người vào phòng giữa lúc chiêu đang báo trước cũng nhận vùng và các vòng (thời gian còn lại) khi client xin tin boss lúc vào (`boss`).
- Client vẽ cả sàn đỏ và các vòng xanh ngọc.

### Cơ chế buộc đổi võ hồn đúng lúc (cần đội 4 võ hồn)
- **Điểm yếu hệ:** mỗi mốc máu `WORLD.weakAt` lộ một hệ ngẫu nhiên một lúc. Võ hồn ra trận đúng hệ gây × `weakMult`, hệ khác × `offMult`. Thanh máu lớn báo võ hồn mình có đúng hệ không.
- ***Thái Thản Cự Viên:***
  - **Bá Thể:** khiên theo % máu tối đa trong một lúc. Võ hồn Cường công phá nhanh hơn; phần đánh vào khiên vẫn tính đóng góp; không phá kịp thì boss hồi máu bằng phần khiên còn lại.
  - **Đại Địa Chấn:** tích lực. Chỉ khống chế của võ hồn **Khống chế** đang ra trận mới tính lần ngắt, cần đủ số lần. Ngắt được thì boss bị Choáng; không ngắt thì cả sàn, trừ người trong vòng an toàn, dính *Vết thương sâu* (Phá giáp nặng, lâu và Choáng ngắn).
  - Cùng Cự Thạch, Địa Liệt Quyền.
- ***Thiên Thanh Ngưu Mãng:***
  - **Thanh Lân Độc Vụ:** độc toàn sàn có báo trước và vòng an toàn (Trúng độc nặng, lâu).
  - **Du Thủy:** lặn **ra giữa hồ** (điểm `lake` trong Tiled), không nhận sát thương. Chỗ nổi lên trong sàn, cách chỗ lặn ít nhất `dive.away`, được chọn ngay lúc lặn và **báo trước** cho cả phòng bằng vòng sóng xanh (người vào giữa lúc boss lặn cũng thấy). Hết giờ lặn thì nổi lên đúng chỗ đó, lộ điểm yếu **Mẫn công**.
  - Cùng Ngưu Giác Xung, Mãng Vĩ Tảo.
- ***Vết thương sâu*** là trạng thái thường (Phá giáp / Trúng độc) nhưng nặng và lâu. Lõi không có vùng an toàn nên chỉ **thanh tẩy** của võ hồn phụ trợ giải được.

### Thưởng
Điều kiện: đóng góp từ `WORLD.share`, còn trong phòng, `WORLD.daily` lần/ngày (lượt riêng với thú vương), mỗi khung một lần dù hạ ở kênh nào.
- Người gây **sát thương** nhiều nhất trong kênh đó nhận **hồn hoàn đỏ**; những người khác có tỉ lệ nhận hồn hoàn đỏ, còn lại hồn hoàn đen (`WORLD_RING`).
- Hồn hoàn vào thẳng túi cùng **rương** (`WORLD_CHEST`: mảnh UR, hồn hạch sao cao bộ bất kỳ, có thể có hồn cốt 10 vạn năm của loài boss) trong cùng transaction tăng lượt.
- Mọi người đóng góp nhận kinh nghiệm × `WORLD.xp`; người hạ nhận Hồn Tệ.

### Màn hình
- Thanh máu lớn: đồng hồ nổi giận, thời gian còn lại, khiên, điểm yếu hệ, số lần ngắt tích lực, trạng thái đang lặn; bảng xếp hạng; banner từng cơ chế.
- Trên sàn: vùng đỏ và vòng an toàn của chiêu toàn sàn, vòng sóng chỗ Du Thủy sắp nổi lên, gợn sóng quanh boss đang lặn giữa hồ.

## Liên quan
- Phòng bản đồ, kênh, đồng bộ state: `docs/tech/phong-ban-do.md`, `docs/tech/dong-bo-state.md`, `docs/tech/kenh-arena.md`.
- Khóa tinh anh và thưởng dùng chung nhiều tiến trình: `docs/tech/presence-redis.md`.
- Trạng thái trên hồn sư (Hàn, Ngập nước, Che tầm nhìn…): `docs/design/trang-thai-buff.md`.
- Nhật ký các bước đã làm: `docs/lich-su.md`.
