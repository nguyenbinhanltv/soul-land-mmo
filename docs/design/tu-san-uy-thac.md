# Tự săn và ủy thác offline

Tự săn khi đang online (Auto 1, 2) và ủy thác offline (Auto 3). Tự săn chạy **hoàn toàn ở server**: server phát lệnh như người chơi nên mọi luật áp như khi bấm tay. Số ở `shared/data.ts` (mục "Tự săn", "Ủy thác offline"); tên hằng viết trong dấu `code`. Quyết định của chủ repo và issue ở cuối file.

## 5.13 Tự săn (Auto 1, Auto 2)

### Bật, phạm vi, giờ treo

#### Bật / tắt và điều kiện
- Phím T, hoặc nút trong bảng Tự động (nút "Tự động" ở khung chỉ số mở bảng).
- Chỉ bật được khi: ở bản đồ săn (`hunt`) hoặc bản đồ boss (`boss`); ngoài vùng an toàn; không gục / hấp thụ / đi cổng; túi còn chỗ; còn giờ treo.
  - Lõi Tinh Đấu không có hồn thú thường, tự săn ở đó chỉ để đánh boss thế giới.
- Chỗ bật là **điểm neo**. Mỗi ô lưới đồng bộ (`SYNC_VIEW.cell`) của một kênh có tối đa `AUTO_MAX_PER_CELL` điểm neo (chống dồn một chỗ).
- Vào lại game thì không tự bật.

#### Phạm vi (`AutoSettings.scope`)
- **Toàn bản đồ** (`map`, mặc định): săn khắp bản đồ đang đứng, chỉ chỗ đi bộ tới được, không qua cổng / truyền tống. Nhặt đồ trong `AUTO_RADIUS` quanh mình.
- **Chỉ quanh chỗ đứng** (`near`): chỉ nhắm hồn thú và nhặt đồ trong bán kính đã chọn quanh điểm neo (`AutoSettings.radius`, số ô từ `AUTO_RADIUS_MIN` tới `AUTO_RADIUS`, mặc định lớn nhất); đi ra ngoài thì quay về.
- Bản lưu chưa có `scope` đọc thành toàn bản đồ.

#### Giờ treo và Ủy Thác Lệnh
- Mỗi tài khoản treo miễn phí tối đa `AUTO_DAILY_SECS` mỗi ngày theo giờ Việt Nam (đặt lại 00:00 như lượt boss, `this.today()`).
- **Ủy Thác Lệnh** (`AUTO_TOKEN`, nhóm lệnh bài): thương nhân trong thành bán giá `AUTO_TOKEN_PRICE` (thương nhân lưu động không bán, thương nhân không mua lại).
  - Dùng trong túi thì cộng `AUTO_TOKEN_SECS` vào **quỹ giờ cộng thêm** của tài khoản, tích tối đa `AUTO_BONUS_MAX` (quá thì không dùng được, lệnh còn).
  - Quỹ không đặt lại theo ngày. Tự săn online và ủy thác offline chỉ tiêu quỹ này khi đã hết giờ miễn phí của ngày.
  - Túi đã bớt lệnh và quỹ mới ghi trong cùng một transaction (`saveAutoBag`).

#### Giới hạn chống lạm dụng
- **Trần tốc độ** (`AUTO_PACE`): tối đa bằng tự đánh, cùng mốc ủy thác offline. Xem "Hiệu suất bằng tự đánh".
  - Nợ nhịp còn lại của lượt trước giảm theo **thời gian thật** (`PData.autoPace`): tắt rồi bật lại không xóa nợ, nên không lách được trần.
- **Nhịp tin `auto`** (`AUTO_MSG_RATE`, theo người chơi): gửi liền tối đa `burst` tin (bật / tắt / đặt / hỏi), hồi `perSec` tin mỗi giây.
  - Vượt thì bỏ tin và trả lại trạng thái thật; riêng tin `set` vượt nhịp giữ cấu hình cuối rồi áp một lần khi có token (cài đặt cuối không bị mất, không tốn DB).
  - Với `GAME_TEST=1` nhịp được nới cho bot; hook `test auto {rate}` trả về nhịp thật.
- Không cướp quái và chia thưởng boss như người chơi tự đánh (xem các mục dưới).

### Mỗi nhịp tự săn làm gì

#### Thứ tự trong nhịp
**Né** chiêu báo trước / vùng độc → **uống đan** → **đánh trả** hồn thú đang đánh mình (chỉ khi nó ở sát, trong `AUTO_TARGET.retaliate`) → **nhặt đồ** → **chọn mục tiêu** → đi dạo.
- Đã đánh trúng một con (hoặc nó đang đánh mình) thì giữ tới khi hạ, không nhặt đồ giữa trận.
- Đang đi tới một con chưa đánh trúng mà có đồ để nhặt thì bỏ con đó, nhặt xong chọn lại.
- Chế độ boss "Luôn ưu tiên" giữ thứ tự cũ: boss trước mọi việc (xem "Tinh anh, thú vương, boss thế giới").

#### Hiệu suất bằng tự đánh
- Server phát đúng các lệnh như người chơi (hướng đi như tin `input`, đánh thường, hồn kỹ, đổi võ hồn, dùng đan, nhặt) qua chính các hàm xử lý lệnh đó. Hồi chiêu, hồn lực, Choáng / Câm lặng, vùng an toàn, quyền nhặt, túi đầy đều áp như khi bấm tay. Không giảm kinh nghiệm hay tỉ lệ rơi.
- **Trần tốc độ** (`AUTO_PACE`):
  - Mỗi hồn thú thường bị hạ khi đang tự săn (mục tiêu, đánh trả, trúng lan) cộng thời gian tự đánh con đó vào **nợ nhịp** (`offlineFight` với chỉ số võ hồn ra trận lúc hạ, `MapRoom.offlinePower`); nợ giảm theo thời gian thực.
  - Còn nợ thì đứng nghỉ, không nhắm con mới (vẫn đánh trả, nhặt đồ).
  - Nợ bị kẹp ở −`AUTO_PACE.credit` giây khi không có mục tiêu và khi thôi nhắm một mục tiêu (không kẹp lúc đang đi tới / đánh). Nên mỗi con tốn khoảng max(thời gian thật, ước lượng), trận dài không bị tính hai lần, thời gian rảnh không tích để sau hạ dồn.
  - Tinh anh, thú vương, boss thế giới không tính vào trần (máu tăng theo số người nên treo không hạ nhanh hơn tự đánh; thưởng đã giới hạn bằng khóa / lượt mỗi ngày). Hồn thú thường chúng gọi ra (bầy, nhện con) vẫn tính.

#### Chọn mục tiêu
- **Chi phí thấp nhất** trong hồn thú thường thuộc khoảng niên hạn đã chọn (`AutoSettings.years`): (độ dài đường đi / tốc độ) + giây ước lượng hạ nó (`offlineFight` với chỉ số võ hồn ra trận; không đánh nổi thì cộng `AUTO_TARGET.tough`).
  - Độ dài đường là khoảng cách thẳng nếu đi thẳng được, không thì nhân `AUTO_TARGET.detour` (không chạy A* cho từng ứng viên).
  - Bỏ qua hồn thú đang về chỗ sinh. Sau khi hạ một con, chờ `AUTO_LOOT_WAIT` giây cho đồ rơi rồi mới chọn tiếp.
- **Toàn bản đồ:** tìm trong `AUTO_RADIUS` quanh mình trước, không có thì cả bản đồ (chỉ con cùng vùng liên thông, đi bộ tới được). Đang đi tới con ở xa (chưa đánh trúng) mà gần mình có con hợp lệ thì đổi sang con gần.
- **Không cướp quái:** không nhắm hồn thú đang nhắm người khác hoặc bị người khác (ngoài tổ đội) đánh trong `AUTO_CLAIM_SECS` giây, hoặc người treo khác (ngoài tổ đội) đang nhắm. Đòn thường và hồn kỹ diện rộng cũng không ra khi sẽ trúng hồn thú đó (trừ lúc đánh trả).
- **Đánh trả:** hồn thú đang đánh mình ở sát thì đánh trả trước, kể cả ngoài khoảng niên hạn (trừ khi chế độ boss "Luôn ưu tiên" có boss để đánh).
- **Ưu tiên cụm quái** (`AUTO_CLUSTER`, `AUTO_AOE_MIN`):
  - Chi phí một con chia cho `1 + bonus × số hồn thú thường hợp lệ khác trong r pixel quanh nó` (tối đa `max` con), nên cụm đông được nhắm trước một con lẻ hơi gần hơn.
  - Có từ `AUTO_AOE_MIN` hồn thú thường (kể cả mục tiêu, không tính con người khác đang giao chiến) trong vùng của một hồn kỹ diện rộng (quanh thân / trước mặt) thì hồn kỹ đó được tung trước các hồn kỹ khác. Thứ tự cài đặt giữ nguyên trong từng nhóm; không áp trận boss. Vẫn trong trần `AUTO_PACE`.
- **Không có việc:** đi dạo quanh điểm neo (toàn bản đồ: quanh chỗ đang đứng) chờ hồn thú hồi sinh. Khi hết hồn thú hợp lệ, xem "Nhớ chỗ hồi sinh".

#### Nhớ chỗ hồi sinh
`AUTO_SPAWN`.
- Vùng sinh hồn thú nơi mình vừa hạ một con được nhớ `keep` giây (tối đa `max` vùng; hồn thú hồi sinh sau khoảng `wait` giây).
- Hết hồn thú hợp lệ thì đi dạo trong vùng nhớ có (thời gian đi + giây còn chờ hồi sinh) nhỏ nhất: đi bộ tới được, niên hạn vùng giao khoảng đã chọn, chỉ quanh chỗ đứng thì trong vùng neo. Không có thì đi dạo quanh tâm săn như trước. Trạng thái hiện "Đi tới chỗ hồi sinh".

#### Đường đi
- Đi thẳng tới mục tiêu; vướng thì theo đường A* (`shared/path.ts`, khung `AUTO_MOVE.path`).
- Đích xa hơn khung thì **đường dài có điểm trung gian** (`AUTO_MOVE.nav`): bản đồ chia khối ô, mỗi vùng ô liền nhau trong một khối là một nút của đồ thị dẫn đường (`buildNav`, dựng một lần mỗi bản đồ); A* trên đồ thị rồi nối điểm trung gian bằng đường thẳng hoặc A* trong khung (`findLongPath`).
- Lưới tìm đường của tự săn coi ô chạm vùng an toàn là ô chặn, nên đường không đi qua trại / làng (vào vùng an toàn thì tự săn dừng).
- Không tới được hoặc kẹt thì bỏ qua một lúc (`AUTO_MOVE`).
- **Chống kẹt** (`AUTO_STUCK`): ngoài kẹt tại chỗ (`AUTO_MOVE.stuck`), cứ `AUTO_STUCK.sample` giây ghi một điểm đứng. Đang định di chuyển (chưa tới tầm đánh, không nghỉ, không né / lùi) mà trong `AUTO_STUCK.window` giây mọi điểm nằm trong `AUTO_STUCK.radius` thì coi là đi vòng lặp: bỏ mục tiêu (bỏ qua `AUTO_MOVE.skip` giây); không có mục tiêu thì bỏ đồ rơi / chọn điểm dạo khác. Lý do (`AutoStatus.w`: `stuck` / `loop`) hiện ở dòng trạng thái thêm `AUTO_STUCK.show` giây.

#### Né
Mọi lúc tự săn, mỗi nhịp server:
- Đứng trong vùng chiêu báo trước của bất kỳ hồn thú nào (kể cả chiêu toàn sàn, trừ khi đã đứng trong vòng an toàn) hoặc vùng lưu lại trên đất (vũng / sương độc, vùng ngập, phần hang đang hóa hoặc sắp hóa; `ground.ts`) thì đi thẳng tới chỗ an toàn gần nhất đi tới được.
- Chỗ an toàn: các vòng an toàn và điểm quanh mình (`AUTO_BOSS.dodge`); mọi điểm cách chỗ đó trong `pad` pixel cũng phải an toàn, để dừng sát chỗ né không rơi ngay ngoài mép vòng.
- Đang đi mà bước kế tiếp vào vùng như vậy thì đứng chờ. Tính trúng như server (`teleHits`, `teleSafe`).

#### Đánh
- Đánh thường khi mục tiêu trong tầm; hồn kỹ theo thứ tự ô ưu tiên (`AutoSettings.skills`) khi mục tiêu trong tầm của hồn kỹ đó và hồn lực còn trên `mpKeep` sau khi tung.
- **Tiên cơ** (`tienCo`): võ hồn khác trong đội đầy năng lượng thì đổi tay vào tung (xét các ô đội hình theo thứ tự `slots`; ô không có trong danh sách thì không đổi vào). Hết hồi chiêu đổi thì về võ hồn chính (người chơi tự đổi võ hồn thì thôi đổi về).

#### Đan và nghỉ hồi
- Uống khi sinh lực võ hồn ra trận / hồn lực dưới `hp` / `mp`: đan thường trước đan lớn, chung hồi chiêu `DAN_CD`.
- Bật `stopNoPot`: cần uống mà hết đan hồi sinh lực là dừng.
- **Nghỉ hồi khi hết đan** (`AutoSettings.restNoPot`, mặc định bật; bản lưu cũ đọc thành bật; `stopNoPot` bật thì dừng, không nghỉ): cần uống đan hồi sinh lực mà hết thì đứng nghỉ (không nhắm con mới, không đi dạo; vẫn né, đánh trả con đang đánh mình, nhặt đồ) cho tới khi sinh lực võ hồn ra trận từ `AUTO_REST.resume` phần rồi săn tiếp. Giờ nghỉ vẫn tính vào giờ treo.

#### Nhặt đồ
Ưu tiên ngay sau né / đan / đánh trả.
- Nhặt mọi món hợp bộ lọc trong `AUTO_LOOT_RADIUS` quanh mình (chỉ quanh chỗ đứng: còn phải trong vùng neo). Món gần nhất trước; nhặt xong lại tìm từ chỗ mới (chuỗi gần nhất).
- Món không tới được thì bỏ qua một lúc (`AUTO_MOVE.skip`); món nằm trong vùng chiêu báo trước / vùng độc thì chưa đi tới.
- **Bộ lọc:** hồn hoàn từ `ring` năm; hồn cốt (`bone`); hồn hạch từ `coreStar` sao (`core`); vật phẩm khác dưới đất theo loại (`kinds`, trong `AUTO_LOOT_KINDS`: mảnh võ hồn, tiên thảo rơi khi túi người hạ đầy). Chỉ món mình được nhặt (mục 4).
- Nhặt đúng món đã chọn (`pickup` với id món), không nhặt món bị lọc nằm gần hơn. Hồn Tệ vẫn vào thẳng túi như thường.
- **Không tự hấp thụ hồn hoàn.**

### Tinh anh, thú vương, boss thế giới

#### Công tắc và chế độ
- Ba công tắc trong bảng Tự động (`AutoSettings.elite` / `king` / `world`, mặc định bật; bản lưu cũ đọc thành bật).
- Chỉ nhắm con đang sống **trên bản đồ đang đứng** (không đi cổng / truyền tống), chỗ sinh đi bộ tới được, trong vùng neo nếu chỉ quanh chỗ đứng.
- **Chế độ** `AutoSettings.bossMode` (bản lưu cũ và giá trị lạ đọc thành `near`):
  - **`near` "Khi gần"** (mặc định): chỉ nhắm con có đường đi tới nó không dài hơn `AUTO_BOSS_DETOUR`, hoặc khi quanh mình không còn hồn thú thường hợp lệ (đang nhắm hay chọn được trong `AUTO_RADIUS`). Xếp theo đường đi chia hệ số `AUTO_TARGET.value` của bậc (cao hơn được ưu tiên hơn). Vẫn theo thứ tự mỗi nhịp (nhặt đồ, đánh trả trước).
  - **`always` "Luôn ưu tiên"**: tới đánh trước mọi việc khác, kể cả đánh trả và nhặt (đòn và hồn kỹ diện rộng vẫn trúng lan bầy / nhện con quanh boss). Bậc cao trước, cùng bậc thì gần nhất, tìm trên cả bản đồ.
  - **`off` "Không"**: không đánh boss (ba công tắc riêng từng loại vẫn có).
- Chưa đánh trúng thì vẫn xét lại (boss tốt hơn vừa nhắm được thì đổi); đã đánh trúng thì giữ tới khi hạ.

#### Mục tiêu chung và điều kiện nhận thưởng
- Đây là **mục tiêu chung**: không áp luật không cướp quái, nhiều người treo cùng nhắm một con. Máu theo số người, đóng góp theo tài khoản, chia thưởng như người chơi tự đánh (mục 5.4).
- Chỉ nhắm con **còn nhận được thưởng** (`MapRoom.autoBossOk`):
  - tinh anh chưa bị khóa `ELITE.lock`;
  - thú vương / boss thế giới còn lượt `KING.daily` / `WORLD.daily` hôm nay và chưa nhận rương của khung giờ đó ở kênh nào. Hết lượt thì thôi nhắm: vào đánh chỉ làm boss nhiều máu hơn cho người khác.

#### Trong trận (`AUTO_BOSS`)
- Sinh lực võ hồn ra trận dưới `retreat` thì lùi ra cách boss ít nhất `dist` pixel (chỗ đi thẳng tới được, không có thì theo đường A*; đan uống theo ngưỡng cài đặt như thường); từ `back` thì quay lại.
- Boss thế giới đang lặn (Du Thủy) thì tới chỗ nổi lên đã báo trước.
- Mục tiêu đang báo trước chiêu (mọi bậc) thì hồn kỹ có Choáng / Câm lặng / Mê hoặc lên trước để ngắt.
- Gục cả đội thì dừng như mọi khi (về doanh trại, không tự bật lại).

#### Đổi võ hồn theo cơ chế
Như người chơi bấm số; xong việc thì về võ hồn chính; mỗi cơ chế giữ tối đa `hold` giây.
- Boss thế giới tích lực → võ hồn hệ Khống chế trong đội, ưu tiên hồn kỹ khống chế để ngắt.
- Trên mình có trạng thái xấu còn từ `cleanse` giây (Vết thương sâu) hoặc từ `chill` tầng Hàn (Cực Hàn) → võ hồn Phụ trợ có hồn kỹ thanh tẩy sẵn sàng (trong ô được phép tung).
- Bá Thể → hệ phá khiên; điểm yếu hệ đang hiện → đúng hệ.
- **Cực Hàn** của Huyền Minh Băng Giao: từ `chill` tầng Hàn mà không có thanh tẩy sẵn sàng thì tới đứng cạnh Hỏa Đàn (trong `ColdDef.fire.r`) tới khi hết tầng rồi quay lại đánh.

### Dừng, tổng kết, trạng thái

#### Dừng khi
- Cả đội gục; túi đầy (đã bật tự bán thì bán từ xa theo bộ lọc trước, mục 5.7; vẫn đầy mới dừng, cũng như lúc bật); hết đan (tùy chọn).
- Bị người chơi tấn công (đòn `pvp`); vào vùng an toàn; đi cổng / truyền tống / vào sân đấu; đang hấp thụ; hết giờ trong ngày; mất kết nối.
- **Người chơi tự bấm** đi, đánh, hồn kỹ, Chân Thân, kỹ năng hồn cốt (tay luôn được ưu tiên; nhả phím không tính).
- Lý do dừng báo bằng dòng log.

#### Tổng kết lượt
Mỗi lần tự săn dừng (tự tắt hay bị dừng), tin `auto` kèm `sum` (`AutoSummary`):
- Thời gian treo lượt đó, số hồn thú đã hạ, kinh nghiệm mọi võ hồn trong đội nhận, Hồn Tệ.
- Đồ đã nhặt hoặc vào thẳng túi (tối đa `AUTO_SUM_LOOT` dòng); số món đã tự bán và Hồn Tệ thu được (`sold`, đã tính trong Hồn Tệ; đồ đã bán không còn ở dòng đồ nhặt); giờ treo còn lại.
- Server tính bằng ảnh chụp lúc bật so với lúc dừng (`AutoHunter.summary`), không thêm móc vào luật đánh / rơi đồ.
- Client mở hộp tổng kết kèm lý do dừng (lượt dưới 1 giây thì không) và giữ "Lượt vừa rồi" trong bảng Tự động.

#### Trạng thái đang làm và thống kê theo giờ
`AUTO_STATUS`; mã `server/src/rooms/autoStatus.ts` (`AutoFeed`). Chỉ hiển thị: không đổi luật chọn mục tiêu, trần `AUTO_PACE` hay quyền cướp quái.
- Server gửi riêng cho chính chủ tin `autost` (`AutoStatus`): mã việc `loot` / `fight` / `go` / `dodge` / `back` / `rest` / `patrol`, tên mục tiêu, khoảng cách làm tròn, vài điểm đầu của đường đang đi, thống kê.
- Chỉ gửi khi việc đổi (cách nhau tối thiểu `every` giây) hoặc mỗi `rateEvery` giây để làm mới thống kê, không mỗi khung; dừng tự săn thì dừng gửi.
- Client dựng chữ bằng `autoStatusText`: dòng đậm trong bảng Tự động; thay chữ "Tự động" trên đầu **nhân vật của mình** (người khác vẫn chỉ thấy "Tự động"); đường đi vẽ mờ (`RADAR.autoCol`) trên radar, nhường đường tới cờ nếu người chơi đang tự đi tới cờ.
- **Thống kê theo giờ** (kinh nghiệm, Hồn Tệ, số món đồ nhặt được): cửa sổ trượt `window` giây (cả lượt nếu ngắn hơn), chỉ hiện khi đã treo đủ `minSecs`. Tổng kết lượt có thêm dòng "Mỗi giờ" (`AutoSummary.rate`, tính cả lượt).

#### Gợi ý niên hạn hợp sức và tổ đội cùng treo
`AUTO_HINT`, `AUTO_PARTY`.
- **Gợi ý niên hạn hợp sức:** ở bản đồ săn, tin `auto` kèm `hint` (`autoHint` trong `shared/data.ts`).
  - Mỗi vùng săn có khai báo niên hạn được thử bằng `offlineFight` với chỉ số võ hồn ra trận (loài tệ nhất của vùng). Niên hạn cao nhất mà đánh nổi và hạ một con trong `AUTO_HINT.maxSecs` giây là mức hợp sức; vùng nào cả mức thấp nhất cũng không hợp thì ghi "quá sức".
  - Vùng có mức hợp sức cao nhất là gợi ý tốt nhất. Bảng Tự động hiện gợi ý (mở bảng thì xin lại theo võ hồn đang ra trận) và nút "Áp dụng" đặt khoảng niên hạn. Chỉ là gợi ý, không đổi cài đặt khi chưa bấm.
- **Tổ đội cùng treo:** thành viên tổ đội cùng tự săn trong một phòng:
  - chỉ nhắm hồn thú trong `AUTO_PARTY.leash` quanh đồng đội gần nhất;
  - chi phí con đồng đội đang nhắm nhân `AUTO_PARTY.focus` nên cả đội dồn vào một con;
  - hết việc mà cách đồng đội quá `AUTO_PARTY.follow` thì đi lại gần thay vì đi dạo;
  - con đã nhắm mà chưa đánh trúng, ngoài `leash` khi đồng đội vừa bật thì bỏ;
  - săn "Chỉ quanh chỗ đứng" thì chỉ tính đồng đội có tâm săn cách tâm mình không quá bán kính + `leash` (neo xa nhau thì mỗi người săn vùng mình);
  - nhặt đồ theo luật chia đồ của tổ đội (`canLoot`), không cướp quái người ngoài tổ đội, mỗi người vẫn chịu trần `AUTO_PACE` riêng.

### Giao diện

- Ai cũng thấy chữ "Tự động" cạnh danh hiệu trên đầu (`PlayerState.auto`); chính mình thấy nút sáng, giờ treo còn lại ở chú thích nút.
- **Bảng Tự động** (thủy mặc, `client/src/autoPanel.ts`) gồm: trạng thái và giờ treo còn lại (cả phần từ Ủy Thác Lệnh); nút bật / tắt; phạm vi và bán kính (chỉ khi quanh chỗ đứng); khoảng niên hạn; thứ tự ưu tiên hồn kỹ (tên hồn kỹ của võ hồn đang ra trận) và ô đội hình đổi tay tiên cơ; chừa hồn lực; ngưỡng đan; dừng khi hết đan; nghỉ hồi; bộ lọc nhặt; ba công tắc tinh anh / thú vương / boss thế giới; chế độ boss; nút về mặc định (`AUTO_DEFAULTS`).
- Đổi gì thì gửi ngay `auto {op: "set", cfg}`; server kẹp bằng `parseAuto` và lưu theo tài khoản (bảng `auto_hunt`). Bản lưu từ Auto 1 có cờ `item: false` thì đọc thành không nhặt loại nào.

### Cài đặt (tham khảo)
`server/src/rooms/autoHunt.ts` (`AutoHunter`): quyết định `AUTO_HZ` lần mỗi giây (đan, đánh trả, nhặt, mục tiêu, đường đi, hồn kỹ, tiên cơ); giữa hai lần chỉ lái hướng đi theo đường đã tìm và đánh thường khi trong tầm.
- Bật / dừng / lưu ở `rooms/autoRun.ts` (`autoAction`, `autoStop`, `flushAuto`; `MapRoom` chỉ chuyển tiếp); boss của phòng và điều kiện nhận thưởng `autoBosses` / `autoBossOk`; chiêu đang báo trước `activeCasts`; vùng lưu lại `Grounds.hits`.
- Đo tải: `client/scripts/auto-soak.mjs`. Nhiều người treo cùng đánh một boss thế giới: nhóm bot `autobossperf` (server `PERF_LOG=1`, hook test `perf`).

## Ủy thác offline (Auto 3)
Số ở `shared/data.ts`, mục "Ủy thác offline" (`OFFLINE`, `offlineFight`, `offlineSplit`).

### Bắt đầu và nhận
- **Bắt đầu:** rời game (không qua cổng, đổi kênh hay vào sân đấu) khi đứng trong một vùng săn của bản đồ săn, ngoài vùng an toàn, không gục thì server ghi vùng và thời điểm (đồng hồ server, không dùng giờ client). Không cần bật tự săn. Rời ở thành, trong vùng an toàn (làng Thánh Hồn Thôn) hay khi đã gục thì không ủy thác.
- **Nhận khi vào lại:** server lấy và xóa lần ủy thác trong một lệnh (một lần thoát chỉ nhận một lần), tính thưởng bằng công thức, **không sinh hay hạ hồn thú thật**. Vắng dưới `OFFLINE.minSecs` thì bỏ.

### Giờ được tính (chung quỹ với tự săn)
- Quãng vắng chia theo ngày giờ Việt Nam. Mỗi ngày chỉ tính phần còn lại của `AUTO_DAILY_SECS` (ngày thoát trừ phần đã treo hôm đó).
- Thời gian vượt phần đó thì lấy tiếp từ quỹ giờ cộng thêm của Ủy Thác Lệnh (quỹ đọc lúc nhận, đã trừ phần tự săn online tiêu) tới khi hết quỹ. Dồn từ ngày cũ tới ngày mới, tối đa `OFFLINE.maxSecs` một lần nhận (`offlineSplit`).
- Quỹ hôm nay và quỹ cộng thêm chỉ trừ phần thật sự đã săn, theo thứ tự thời gian (dừng sớm thì trừ ít hơn). Bảng nhận thưởng ghi số giờ đã lấy từ Ủy Thác Lệnh.

### Hiệu suất 100% và thưởng
- Chạy từng con như săn trong vùng đó: niên hạn và loài tung như hồn thú của vùng.
- Thời gian hạ (`offlineFight`) theo chỉ số võ hồn ra trận lúc vào (công, chí mạng, thủ của loài, hệ số hồn kỹ `OFFLINE.skill`), cộng hồi máu sau trận và thời gian tìm / nhặt `OFFLINE.seek`. Một trận mất quá `OFFLINE.hpCap` sinh lực tối đa thì coi là không đánh nổi (bỏ con đó).
- Mỗi con: kinh nghiệm (giảm theo chênh cấp, chia đội như hạ tay), Hồn Tệ, mảnh võ hồn, tiên thảo vào thẳng túi; hồn cốt, hồn hạch, hồn hoàn theo bộ lọc nhặt của tự săn (`bone`, `core` từ `coreStar` sao, `ring`), hồn hoàn tối đa `OFFLINE.rings` chiếc.
- Không có tinh anh, thú vương, hồn thú 10 vạn năm, không tính nhiệm vụ.

### Dừng sớm
Túi đầy (như tự săn; ủy thác offline không tự bán, mục 5.7), vùng quá sức (không hạ được con nào), hết giờ treo.

### Bảng nhận thưởng
Tin riêng `offline`, khung giấy cuộn thủy mặc, `client/src/offline.ts`:
- vùng, thời gian vắng / được tính / đã săn, số hồn thú, kinh nghiệm, Hồn Tệ, vật phẩm, lý do dừng sớm, giờ treo còn lại hôm nay;
- dòng xác nhận kinh nghiệm đã được cộng cho đội, Hồn Tệ và vật phẩm liệt kê đã vào túi khi đăng nhập; trang bị bỏ do túi đầy vẫn ghi riêng, không tính là đồ đã nhận;
- nút "Đã rõ" chỉ đóng bảng, không gửi yêu cầu nhận thêm; đóng bảng không làm mất thưởng.

### Cài đặt (tham khảo)
- `MapRoom.onLeave` ghi (`offlineZone`, bảng `auto_offline`); `rooms/autoRun.ts` `claimOffline` (`MapRoom` chuyển tiếp; xếp vào chuỗi lưu khi vào phòng) tính, cộng rồi `write()`.
- Hook `test {op: "offline", ago}` lùi thời điểm của lần ủy thác kế tiếp (giả lập thời gian trôi).

## Quyết định của chủ repo và issue liên quan
- **2026-10-22:** tự săn chạy hoàn toàn ở server; phạm vi mặc định Toàn bản đồ (#213); trần tốc độ `AUTO_PACE` bằng tự đánh, cùng mốc ủy thác offline; tinh anh / thú vương / boss thế giới có công tắc riêng và không tính vào trần (#218).
- **2026-10-25:** thứ tự mỗi nhịp và chế độ boss `bossMode` (AH1, #608, #617).
- Trạng thái đang làm + thống kê theo giờ: AH2 #609, #614. Ưu tiên cụm quái, nhớ chỗ hồi sinh, nghỉ hồi khi hết đan: AH3 #610, #631 (bot kiểm hồn kỹ diện rộng #634). Gợi ý hợp sức, tổ đội cùng treo, chống kẹt: AH4 #611, #628.
- Soát bảo mật: nợ nhịp `AUTO_PACE` không xóa khi tắt / bật lại #633; nhịp tin `auto` (F2) trong soát #612, #635.
- Tìm đường thẳng và A* của tự săn: #547 (#291). Tự săn ở bản đồ boss: #218.
- Nhật ký từng bước: `docs/lich-su.md`.
