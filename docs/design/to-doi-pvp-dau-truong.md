# Tổ đội, dung hợp kỹ, Đại Đấu Hồn Trường, bạn bè

Luật tổ đội, Võ Hồn Dung Hợp Kỹ, trận đấu đội võ hồn xếp hạng Elo và bạn bè. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`); phòng và kênh đấu trường: `docs/tech/kenh-arena.md`; trạng thái dùng chung nhiều tiến trình: `docs/tech/presence-redis.md`. Số issue ở cuối file.

## 5.9 Người chơi lập đội và PvP

### Tổ đội người chơi
Tối đa `PARTY_MAX` người. Luật ở `server/src/party.ts`; trạng thái dùng chung mọi tiến trình qua presence `party:state` / `party:live:<tài khoản>`, không lưu DB.

**Mời và trưởng nhóm**
- Mời bằng cách bấm / chạm hồn sư khác, `/moi <tên>` hoặc nút "Mời…" ở khung tổ đội (mời được người ở bản đồ khác). Người được mời "Vào đội" / "Từ chối" trong `PARTY_INVITE_SECS` giây. Ai trong đội cũng mời được; chống spam lời mời ở `server/src/ratelimit.ts`.
- Người mời làm trưởng nhóm. Trưởng nhóm mời thành viên ra hoặc nhường trưởng nhóm; trưởng nhóm rời thì người vào sớm nhất làm trưởng; còn 1 người thì giải tán.
- Giữ nguyên khi đi cổng / đổi kênh; rời game quá `PARTY_OFFLINE_SECS` giây thì tự ra khỏi đội.

**Chia thưởng**
- **Chia kinh nghiệm:** thành viên cùng phòng (cùng bản đồ, cùng kênh), chưa gục, cách chỗ hồn thú gục dưới `PARTY_XP_RANGE` pixel cùng chia; người hạ luôn được chia.
  - Tổng kinh nghiệm gốc nhân (1 + `PARTY_XP_BONUS` × (n − 1)) với n là số người cùng chia, rồi chia đều (`partyXpShare`).
  - Sau đó mỗi người tự giảm theo chênh cấp của mình và chia cho đội võ hồn.
  - Tinh anh chia cùng cách; thú vương / boss thế giới chia theo đóng góp. Hồn Tệ và mảnh vào túi vẫn chỉ của người hạ.
- **Đồ rơi** ưu tiên cả tổ đội của người được ưu tiên (mục 4).
- **Đóng góp hỗ trợ:** hồi máu / khiên thực cho đồng đội đang tham gia tinh anh / thú vương / boss thế giới tính vào đóng góp của người hồi (`SUPPORT_CONTRIB`); bảng xếp hạng có cột "Hỗ trợ". Hồn hoàn đỏ của boss thế giới vẫn xếp theo sát thương.

**Chat và khung tổ đội**
- Chat tổ đội `/d` / tab "Tổ đội" tới mọi thành viên ở mọi bản đồ / kênh (mục 4 "Kênh chat").
- Khung tổ đội dưới khung chỉ số: tên, cấp, võ hồn ra trận và sinh lực, bản đồ / kênh (nếu khác), đã rời game. Đồng đội cùng phòng có tên và chấm xanh lá trên radar.
- Phục Chế chép được hồn kỹ của đồng đội (mục 5.2).

### Hiệu ứng phụ trợ lan cho đồng đội
- **Điều kiện lan:** hồn kỹ, tiên cơ, Chân Thân tung khi võ hồn hệ **Phụ trợ** ra trận có hiệu ứng lên bản thân (hiệu ứng có lợi, hồi sinh lực, khiên, hồi hồn lực) thì đồng đội cũng nhận nếu: cùng phòng, chưa gục cả đội, không đang đi cổng, ngoài vùng an toàn, đứng trong `PARTY_BUFF_R` pixel.
- **Mức:** × `PARTY_BUFF_MULT` (người tung ×1). Hồi / khiên tính theo sinh lực tối đa võ hồn ra trận của người nhận. Trùng thì lấy mức mạnh hơn và thời gian dài hơn. Thanh tẩy lan tới đồng đội hợp lệ nhưng không nhân hệ số.
- Kỹ năng hồn cốt của **mọi hệ võ hồn** cũng chỉ lan phần hiệu ứng có lợi lên bản thân; sát thương và trạng thái lên hồn thú không lan.
- **Không lan:** lãnh vực phượng hoàng (`PARTY_BUFF_SKIP`); tàng hình của võ hồn không phải Phụ trợ (kể cả chép bằng Phục Chế); bất tử khi bay; Phong Lôi Chi Lực; CoreFx gây sát thương / trạng thái.
- Trong sân Đại Đấu Hồn Trường hiệu ứng tổ đội không lan theo tổ đội, mà theo luật riêng của trận (xem "Hiệu ứng tổ đội trong sân").
- Đồng đội thấy "+N" hồi / khiên và dòng "<tên> tăng công cho bạn".

## Võ Hồn Dung Hợp Kỹ
Số ở `FUSION`, cặp ở `FUSIONS`. Bám truyện: chỉ hai hồn sư võ hồn tương hợp, cực kỳ ăn ý mới dung hợp được, nên cần hai người cùng bấm.

### Điều kiện
- Chiêu chủ động của **hai hồn sư cùng tổ đội**, mỗi người đang ra trận một võ hồn của một cặp trong `FUSIONS`, đứng cách nhau dưới `FUSION.r` pixel. Cả hai võ hồn cần ít nhất `FUSION.minRings` hồn hoàn.
- Không có dung hợp hai võ hồn trong đội của một người: phần đó là ràng buộc (`BONDS`, mục 5.1). Ràng buộc và dung hợp độc lập (ràng buộc không phải điều kiện mở dung hợp, dung hợp không nhận ràng buộc).
- **Bị chặn như hồn kỹ:** gục, hấp thụ, đi cổng / truyền tống, vùng an toàn, Choáng / Câm lặng / Mê hoặc. **Cấm ở Đại Đấu Hồn Trường, kể cả 2v2** (`ArenaRoom` `BLOCKED`). Không có PvP ngoài rừng (`foesOf` rỗng).

### Kích hoạt
1. A gửi `fusion {op: "start"}`. Server tìm đồng đội tổ đội cùng phòng gần nhất có võ hồn ra trận ghép thành cặp, đủ điều kiện và không đang có lời mời khác, rồi gửi người đó (B) tin riêng nhắc "Dung hợp [G]" trong `FUSION.window` giây.
2. B gửi `fusion {op: "join"}` trong khoảng đó thì server kiểm lại cả hai (kể cả còn cùng tổ đội) và chiêu nổ ở **điểm giữa hai người**.
3. Hết giờ hoặc có người không còn đủ điều kiện thì hủy, không tốn gì. Không ai hợp lệ thì A nhận lý do (chưa có tổ đội, sai cặp, đứng xa, trong vùng an toàn, đang hồi chiêu, thiếu hồn hoàn, thiếu hồn lực…).

- Mỗi người tốn `FUSION.cost` hồn lực và vào hồi chiêu `FUSION.cd` giây, tính cho **hồn sư** (theo tài khoản: đổi võ hồn, đổi kênh, đi cổng, thoát vào lại đều không làm mới). Ghi cả vào presence `fusion:<tài khoản>` (TTL `FUSION.cd`) nên dùng chung mọi tiến trình, không lưu DB.

### Sức mạnh và đóng góp
- **Sức mạnh** (bộ máy hồn kỹ, mục 5.2): công = trung bình công võ hồn ra trận của hai người (kể cả tăng công, không ràng buộc), nhân `skillPower` của hồn hoàn năm cao nhất **thấp hơn** giữa hai võ hồn. Không nhận sao, ràng buộc, Phục Chế (không chép được); không tạo năng lượng tiên cơ.
- **A (người mời) là người gây đòn:** hồn thú nhắm A; chí mạng, hiệu ứng bộ hồn hạch, hút huyết, điểm yếu hệ / khiên Bá Thể của boss thế giới tính theo A như hồn kỹ của A; đòn trúng giữ cả hai trong giao chiến.
- Mọi phần của chiêu là vùng quanh điểm giữa; phần có `side` dời tâm về phía người cầm võ hồn đó.
- **Đóng góp** tinh anh / thú vương / boss thế giới chia đôi cho hai người (kể cả sát thương theo thời gian, lan Cảm điện do chiêu gây); cả hai thành người tham gia.
  - Lúc gây mà B đã rời, đang đi cổng, đã gục, đứng trong vùng an toàn hay ngoài bán kính giao chiến (hang thú vương) thì A nhận cả.
  - Kinh nghiệm chia theo tổ đội như cũ.

### Giao diện và mạng
- Server chọn đồng đội, kiểm khoảng cách, tính vị trí và sát thương; client chỉ gửi ý định. Tin riêng `fusion {k: "ask" | "wait" | "done" | "cancel"}`; `fx fusion` (hai người, võ hồn ra trận của từng người, điểm giữa) công khai cho người ở gần.
- **Nút:** phím G và nút "Dung hợp" (ô ấn triện cạnh Chân Thân trên thanh hồn kỹ) gửi `start`, hoặc `join` khi đang được mời. Nút chỉ hiện khi võ hồn ra trận có cặp trong `FUSIONS`, khóa khi thiếu `FUSION.minRings` hồn hoàn, không hiện ở sân đấu.
- **Lời mời:** người được mời thấy banner và khung nhắc "Dung hợp [G]" (máy tính: trên thanh hồn kỹ; chạm: phía trên giữa màn hình), đếm ngược `FUSION.window` giây, có nút chạm được. Người mời thấy "Chờ … hưởng ứng".
- **Hồi chiêu:** ô G phủ hồi chiêu `FUSION.cd` từ tin `done` và trường `fcd` của tin riêng `vohons` (giây còn lại của hồn sư), nên đổi võ hồn, đổi kênh, đi cổng, vào lại không làm mới. Lý do từ chối / hủy là dòng log của server trong khung tin.
- **Hiệu ứng** (vẽ bằng code, hoặc sheet khi có, `FUSION_VISUAL` ở `docs/design/ky-nang-combat-phap-tuong.md`): hai luồng sáng màu võ hồn của hai người vòng cung nhập vào điểm giữa, rồi đóa kính lưu ly (phong cách D, mục 5.11) nở trên mặt đất, vòng sáng màu niên hạn. Như tuyệt kỹ, hai người dung hợp thấy banner tên chiêu; người khác ở gần (theo `fx fusion`) thấy tên chiêu lớn bay lên ở điểm giữa.

### Các cặp dung hợp
Tên chiêu phỏng theo truyện; phần mô tả hiệu ứng là thiết kế riêng.

| Cặp võ hồn | Tên chiêu | Hiệu ứng |
|---|---|---|
| Yêu Hồ + Nguyệt Nhận | Yêu Nguyệt (Hồ Liệt Na và Tà Nguyệt; truyện có dung hợp kỹ của hai người, tên **phỏng theo**, cần kiểm lại tên gốc) | Lưỡi trăng xoay nhiều vòng quanh điểm giữa, mỗi vòng Mị hoặc (đủ tầng thành Mê hoặc) |
| Hạo Thiên Chùy + Nhu Cốt Thố | Hạo Thiên Nhu Cốt (Đường Tam và Tiểu Vũ, phỏng theo; cùng tên ràng buộc) | Quật ngã (Choáng) rồi chùy giáng, thêm sát thương theo % sinh lực tối đa (kẹp `PCT_HP_CAP`) |
| Lam Điện Bá Vương Long + Bích Lân Xà Hoàng | Lôi Độc Song Sát (Ngọc Thiên Hằng và Độc Cô Nhạn, phỏng theo) | Phủ Cảm điện và Trúng độc cả vùng, thêm sát thương theo tầng độc |
| Băng Phượng Hoàng + Hỏa Long | Băng Hỏa Lưỡng Nghi (cặp băng / hỏa ở Tinh Anh Đại Tái và suối Băng Hỏa Lưỡng Nghi Nhãn, phỏng theo; cùng tên ràng buộc) | Nửa phía Băng Phượng Hoàng đóng băng (Choáng), nửa phía Hỏa Long Thiêu đốt; rồi băng hỏa giao nhau, hồn thú đang Choáng hoặc Thiêu đốt chịu thêm |
| Bạch Hổ + U Minh Linh Miêu | U Minh Bạch Hổ (Đái Mộc Bạch và Chu Trúc Thanh, dung hợp kỹ nổi tiếng nhất truyện; tên chiêu theo truyện, phần mô tả hiệu ứng **phỏng theo**) | Nửa phía Bạch Hổ chấn lùi, Phá giáp; nửa phía U Minh Linh Miêu cào bóng tối nhiều nhát (chí mạng cao, mỗi nhát Phá giáp); rồi hổ ảnh U Minh phủ cả vùng, hồn thú đang Phá giáp chịu thêm |

## Đại Đấu Hồn Trường
Đấu đội võ hồn 1v1 / 2v2 xếp hạng Elo; số ở `ARENA`. Hàng chờ ở `server/src/rooms/arenaQueue.ts`; phòng trận là `ArenaRoom` (lớp con của `MapRoom`).

### Xếp hàng và ghép trận
- **Xếp hàng:**
  - Người chơi đơn có thể tự xếp. Tổ đội **đúng 2 người** do trưởng nhóm xếp cho cả đội; hai thành viên phải đang online, cùng bản đồ / kênh và cùng gần biển Đại Đấu Hồn Trường.
  - Khi đọc Elo và chờ ghép, thành phần tổ đội bị khóa; cả hai thành viên đều có thể hủy.
  - Không xếp được khi đứng xa, đã gục, đang hấp thụ, đang giao chiến hoặc đang đi cổng. Đang xếp hàng mà rơi vào các trạng thái đó thì tạm không được ghép (giữ chỗ). Đi bản đồ khác hay thoát game thì cả bên ra khỏi hàng.
  - Hàng chờ chung mọi kênh. Ô "Đang tìm đối thủ…" hiển thị Elo đội (trung bình Elo từng tài khoản), thời gian chờ, thành viên và nút Hủy.
- **Ghép theo Elo gần nhất** (`arenaPairs`): người / bên chờ lâu nhất gặp bên có Elo đội gần nhất trong cửa sổ nới dần theo thời gian chờ (`arenaWindow`). Elo mỗi tài khoản vẫn được đọc riêng từ DB. Không lưu Elo tổ đội lâu dài.
- **Chống dàn xếp:**
  - 1v1 kiểm một cặp; 2v2 kiểm đủ bốn cặp tài khoản chéo giữa hai bên. Chỉ khi mọi cặp còn lượt thì trận tính Elo / thưởng (`arenaRanked`, đếm ở bảng `arena_pairs`); từ trận kế tiếp là **giao hữu**. Trận bỏ / không vào sân cũng đếm vào cặp; trận hủy (không ai vào sân) thì không.
  - Trong `rematchSecs` giây chờ đầu, không ghép lại cùng bên đối thủ trước nếu còn bên khác trong cửa sổ (đối thủ trước giữ ở RAM).
  - Cặp vừa đấu nhau chỉ được ghép lại sau `rematchSettleSecs` giây chờ (người khác xếp hàng ngay sau đó kịp có mặt trước khi vòng ghép xét).

### Trận
- Mỗi trận một phòng riêng trên sân `dai_dau_hon_truong`. Ghép xong hai bên rời bản đồ vào sân (2v2 tối đa 4 người; không vào đủ bên trong `ARENA.joinSecs` giây là bên kia thắng), đứng hai phía, **cả đội hồi đầy**, đếm ngược `readySecs`, giao đấu `fightSecs`.
- Đánh thường, hồn kỹ (cả vòng 5–10, tuyệt kỹ), Chân Thân, kỹ năng hồn cốt, tiên cơ, đổi võ hồn như ngoài rừng; cộng minh, sao, hồn cốt, hồn hạch đều áp. Sát thương lên hồn sư theo "Cân bằng PvP" dưới đây, không có khung bất tử sau đòn của đối thủ.
- Hồi tự nhiên như ngoài rừng; võ hồn gục tự đổi và không hồi trong trận.
- **Bị chặn trong sân** (`ArenaRoom` `BLOCKED`; chỉ số hai bên cố định suốt trận): xếp đội, đổi ô hồn kỹ, hấp thụ, gắn / tháo / cường hóa / nâng cấp đồ, dùng vật phẩm, nhặt / bỏ đồ, mở rương, mở võ hồn / lên sao, nói chuyện NPC, mua bán, mời / nhận tổ đội, đi cổng. Biến hình và hồi chiêu là dữ liệu riêng của phòng sân.
- **Kết quả:**
  - Hạ hết đội đối thủ thì thắng.
  - Hết giờ thì bên còn nhiều % sinh lực cả đội (võ hồn gục tính 0) thắng; chênh không quá `drawPct` là hòa.
  - Rời sân / mất mạng sau khi trận bắt đầu làm cả bên thua; còn thiếu người lúc hết thời gian vào sân thì bên kia thắng.

### Hiệu ứng chỉ áp lên hồn thú, không lên đối thủ
- Mị hoặc / Mê hoặc / Phong ấn và các trạng thái `PLAYER_STATUS_PVE` (Đóng băng, Hàn, Ngập nước, Che tầm nhìn).
- Đẩy lùi, kéo, xóa buff; kích nổ Thiêu đốt / Viêm bạo (cả Phượng Hoàng 4 món `boom`); lãnh vực phượng hoàng; ràng buộc Băng Hỏa Lưỡng Nghi.
- Lan Cảm điện (cả Bá Vương Long 2 món); kéo dài khống chế của Lam Ngân 2 món.
- Tàng hình làm đối thủ không khóa mục tiêu được; sét tìm Cảm điện (`shockR`) trúng cả đối thủ Cảm điện.

### Cân bằng PvP
`ArenaRoom`, `MapRoom.damageFoe` / `applyPStatus` có nguồn đối thủ; ngoài sân không đổi. Một đòn của A lên B theo thứ tự:
1. Sát thương gốc như lên hồn thú: công của A (`calcStats` gồm hồn hạch, cộng minh, sao, tiên thảo, hồn cốt; tăng công; ràng buộc) × hệ số đòn (hồn kỹ, sao, Hạo Thiên 4 món, Tiên Cơ 4 món, % sinh lực / theo tầng / máu thấp / theo trạng thái như lên hồn thú).
2. × `ARENA_HE_DMG` theo hệ võ hồn ra trận của A (một hệ số theo hệ người đánh, không có bảng khắc chế theo cặp hệ).
3. × `ARENA.dmgMult`.
4. Chí mạng: tỉ lệ của A (gồm Linh Miêu 2 món, tăng chí mạng, ràng buộc) + Thất Sát 4 món nếu B đang Phá giáp; × `critMult`.
5. Phía B (`hurtPlayer`): × (1 + Dễ thương + Phá giáp theo tầng + Xà Hoàng 4 món nếu B Trúng độc đủ `CORE_FX_RULE.poisonStacks` tầng do người mang bộ gây) × `HE.def` hệ võ hồn ra trận của B × (1 − tăng thủ, có trần) → khiên đỡ → trừ sinh lực.

**Trường hợp riêng**
- Thiêu đốt / Trúng độc A gây cho B tính một lần lúc gây: công A × hệ số đòn × bước 2 × bước 3 × (1 + Phượng Hoàng / Xà Hoàng 2 món + ràng buộc Tà Hỏa – Hỏa Ảnh), không chí mạng, rồi vào bước 5 mỗi nhịp. Phượng Hoàng 4 món thêm tầng Thiêu đốt tối đa.
- Khống chế đối thủ gây (Choáng, Trói, Câm lặng: `isCcStatus`) kéo dài × `ARENA.ccMult` sau kháng của bị động hồn cốt; Làm chậm và trạng thái sát thương không đổi.
- Hồi sinh lực và khiên trong sân (hồn kỹ, tiên cơ, Chân Thân, kỹ năng hồn cốt; sau Lưu Ly 2 món / ràng buộc) × `ARENA.healMult`; hút máu (theo sát thương thật) và hồi tự nhiên không đổi.
- Hiệu ứng bộ khác lên đối thủ: Bá Vương Long 4 món (đòn trực tiếp trúng đối thủ Cảm điện hồi hồn lực, chung hồi chiêu); Lam Ngân 4 món (hồn kỹ có khống chế trúng đối thủ hồi hồn lực); Linh Miêu 4 món; Hạo Thiên 4 món; Lưu Ly 4 món (cho chính mình); Tiên Cơ như ngoài rừng. Thất Sát 2 món không có tác dụng (hồn sư không có thủ).

**Hiệu ứng tổ đội trong sân**
- Ở trận 2v2, hiệu ứng phụ trợ lan cho **đồng đội cùng bên** của trận (theo hai bên đã ghép, không theo tổ đội vì tổ đội có thể đổi giữa trận) đứng trong `PARTY_BUFF_R`, chưa gục cả đội. Cùng luật "Hiệu ứng phụ trợ lan cho đồng đội" ở trên: mức × `PARTY_BUFF_MULT`, thanh tẩy không nhân hệ số, không lan `PARTY_BUFF_SKIP`, Lưu Ly 4 món.
- Hồi sinh lực và khiên lan theo hệ số hồi của người tung nên đã × `ARENA.healMult` (= mức ngoài rừng × `PARTY_BUFF_MULT` × `ARENA.healMult`).
- Không bao giờ lan cho đối thủ; 1v1 không có ai để lan. Dung hợp kỹ vẫn cấm trong sân.

### Elo, thưởng, bảng xếp hạng
- **Elo:** khởi đầu `startElo`, K = `k` mọi trận (thắng 1, hòa 0,5, thua 0; `eloAfter`), không dưới 0; lưu ở `arena_ratings` (Elo, thắng, thua, hòa). Với trận tổ đội, mỗi tài khoản tính `eloAfter(Elo riêng, Elo trung bình của bên đối thủ)`.
- **Thưởng thắng:** mỗi thành viên bên thắng nhận phần thưởng riêng Hồn Tệ `winHonTe` + `winShards` mảnh của một võ hồn ngẫu nhiên trong `ARENA_SHARDS` (túi đầy thì mảnh đổi ra Hồn Tệ theo giá thương nhân), tính theo `dailyWins` của chính thành viên đó; hết lượt vẫn đấu và tính Elo.
- **Thua / hòa không thưởng, không mất gì.** Trận không đổi kinh nghiệm, đồ, đội hình hay võ hồn ra trận. Không có mùa giải.
- **Bảng xếp hạng** (nút ở hộp thoại): top `topN` theo Elo, bằng Elo thì nhiều trận thắng hơn rồi ai đạt trước; chỉ tài khoản đã đấu; kèm hạng, thành tích của mình và lượt thưởng còn lại hôm nay. Danh sách đầu bảng (và bảng tông môn) được giữ chung trong tiến trình `RANK_BOARD_CACHE` giây nhưng xoá ngay khi tiến trình ghi Elo / điểm; hạng của mình luôn tính mới (chi tiết ở `docs/tech/du-lieu-db.md`).

### Màn hình trận
- Thanh trận đấu: hai bên (tên, Elo, % sinh lực cả đội, số võ hồn còn đứng); đồng hồ; thanh máu nhỏ trên đầu hai hồn sư.
- Hết trận hiện bảng kết quả (thắng / thua / hòa, lý do, Elo trước → sau, phần thưởng). Sau `endSecs` giây hoặc bấm "Về bản đồ cũ" thì **về đúng bản đồ và vị trí trước khi vào sân**.

### Xem trận
Chỉ xem trực tiếp, không lưu replay; số ở `ARENA`.

**Luật**
- Hồn sư đứng gần biển Đại Đấu Hồn Trường, cùng điều kiện như xếp hàng (không giao chiến, gục, hấp thụ, đi cổng) và **không đang xếp hàng** xin danh sách tối đa `liveN` trận đang đếm ngược / giao đấu (1v1 / 2v2, tên và Elo hai bên, thời gian còn lại, số người xem; theo nhịp `topCd`) rồi chọn một trận để xem.
- Mỗi trận tối đa `watchMax` người xem (gồm chỗ đang giữ), quá thì từ chối.
- Người xem rời bản đồ vào sân như người đấu nhưng **chỉ đọc**: không hiện trên sân, không bị trúng đòn, không thuộc bên nào. Mọi lệnh bị bỏ qua (kể cả chat bản đồ của sân) trừ rời xem. Vẫn nhận tin tổ đội / riêng / thế giới; không nhận Elo, thưởng, tiến độ nhiệm vụ / khảo hạch.
- Người đấu thấy số người xem (`ArenaState.watchers`). Người xem rời giữa chừng không ảnh hưởng trận; hết trận người xem bị đưa ra cùng người đấu. Rời xem hay hết trận đều **về đúng bản đồ và vị trí trước khi xem**.

**Màn hình "Xem trận"** (client)
- Hộp thoại biển Đại Đấu Hồn Trường có nút **Trận đang diễn ra**: danh sách 1v1 / 2v2 (tên, Elo, giờ, số người xem), nút Xem từng dòng, nút Làm mới (nhịp `topCd`); chuột và chạm đều dùng được.
- Trong sân: thanh trận như người đấu, kèm nhãn **Đang xem** và nút **Rời xem**. Camera theo một hồn sư, mặc định người đầu bên trái; bấm / chạm tên một bên trên thanh trận (hoặc bấm vào hồn sư trên sân) để đổi người theo dõi; bên 2v2 bấm lại để đổi sang đồng đội.
- HUD người xem ẩn thanh hồn kỹ, đội hình, túi, nút tự động, ô chat; phím và chạm không gửi lệnh nào.
- Hết trận người xem thấy bảng kết quả (bên thắng, sinh lực và số võ hồn còn đứng mỗi bên; không có dòng Elo / thưởng) rồi về bản đồ cũ.

## Bạn bè
Số ở `FRIEND_MAX`, `BLOCK_MAX`; luật ở `server/src/friends.ts`, lưu DB.

### Kết bạn
- **Mỗi người tự thêm** hồn sư khác (theo tên, kể cả người đang ngoại tuyến; bảng "Bạn bè", menu hồn sư "Kết bạn") vào danh sách của mình, tối đa `FRIEND_MAX` người.
- Người được thêm (nếu đang trong game) nhận dòng "X đã thêm bạn vào danh sách bạn bè" kèm nút **"Thêm lại"** (đã có người đó thì báo hai bên đã là bạn bè). Lời này từ cùng một người chỉ gửi lại sau một lúc (`server/src/ratelimit.ts`, xóa rồi thêm lại liên tục không làm ngập log). Xóa thì không báo người kia.
- **Chỉ khi hai bên đã thêm nhau** mới thấy nhau đang online và ở bản đồ / kênh nào, kèm nút "Mời tổ đội" và "Nhắn" (tin riêng `/t`). Vào / rời game, đổi bản đồ / kênh thì bảng của người kia tự cập nhật. Thêm một chiều chỉ thấy "Chưa thêm lại bạn"; bạn hai chiều đang ngoại tuyến hiện "Ngoại tuyến".
- Thao tác bạn bè / chặn có nhịp chống spam riêng.

### Chặn
Tối đa `BLOCK_MAX` người (bảng "Bạn bè" hoặc menu hồn sư).
- Tự bỏ người đó khỏi danh sách bạn bè của mình và bỏ lời mời tổ đội đang chờ giữa hai người (cả hai chiều).
- **Người bị chặn:** không gửi được tin riêng, lời mời tổ đội tới người chặn (bị báo lỗi); lời thêm bạn của họ không tới; tin của họ ở chat bản đồ / tổ đội / thế giới không được server gửi tới người chặn (cả khi người chặn đang xem trận). Người bị chặn không được báo.
- **Người chặn:** cũng không nhắn riêng, mời tổ đội, thêm bạn người mình đang chặn (phải bỏ chặn trước).

### Lưu trữ và giới hạn
- Mỗi người chỉ ghi dữ liệu của chính mình qua chuỗi lưu; không có transaction ghi chéo hai tài khoản.
- Không lưu lịch sử chat, không giao dịch. Để sau: báo bạn bè vừa online, ghi chú tên bạn.

## PvP ngoài rừng
Không có. Phòng bản đồ luôn trả "không có đối thủ" (`MapRoom.foesOf`); chỉ phòng Đại Đấu Hồn Trường bật PvP.

## Lịch sử / issue liên quan
- Dung hợp kỹ: #192 (luật), #193 (giao diện), #194 (cặp U Minh Bạch Hổ); dung hợp kỹ vẫn cấm ở sân kể cả 2v2, xem lại khi #113 (2v2) chạy ổn.
- Bạn bè #195. Màn hình "Xem trận" #280.
- Nhật ký từng bước: `docs/lich-su.md`.
