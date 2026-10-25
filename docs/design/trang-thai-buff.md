# Trạng thái và hiệu ứng có lợi

Trạng thái (có hại, khống chế) và hiệu ứng có lợi, trên hồn thú và trên hồn sư. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`). Hiệu ứng của hồn thú gây lên hồn sư: `docs/design/hon-thu-boss.md`; hiệu ứng lan cho đồng đội: `docs/design/to-doi-pvp-dau-truong.md`.

## Trạng thái dùng chung

Bảng `STATUS`: thời gian, số tầng tối đa, độ lớn; các lưu phái xoay quanh chúng.

| Trạng thái | Hiệu ứng |
|---|---|
| Thiêu đốt | Mất máu mỗi giây theo tầng. *Viêm bạo* kích nổ một lần phần sát thương còn lại (nhân hệ số) rồi xóa (hoặc đặt lại vài tầng). |
| Cảm điện | Đòn trực tiếp trúng mục tiêu Cảm điện thì lan một phần sát thương sang mục tiêu Cảm điện khác ở gần (một bước, không lan tiếp). |
| Trúng độc | Mất máu mỗi giây theo tầng; hồn thú bị độc hồi máu chậm hơn. |
| Dễ thương | Nhận thêm sát thương từ mọi nguồn (cả sát thương theo thời gian). |
| Phá giáp (Liệt thương) | Hồn thú: mỗi tầng giảm một phần thủ (`STATUS.armor.shred`), đủ tầng thì hết thủ (thủ ở mục 5.3). Hồn sư không có thủ: nhận thêm sát thương đòn trực tiếp theo tầng. |
| Choáng | Không đi, không đánh, không dùng hồn kỹ, không bị đẩy lùi. Trên hồn thú, "đóng băng" (hồn kỹ của hồn sư), "hất tung", "quật ngã", "tê liệt" đều là Choáng. |
| Câm lặng | Không dùng hồn kỹ / chiêu; vẫn đánh thường. |
| Trói | Không đi, không bị đẩy lùi; vẫn đánh khi kề bên. "Giam" là Trói. |
| Làm chậm | Giảm tốc; mọi nguồn làm chậm cộng lại tối đa `SLOW_CAP`. |
| Mị hoặc | Làm chậm theo tầng; đủ tầng thì bùng phát thành Mê hoặc. Đang Mê hoặc thì không nhận thêm Mị hoặc. |
| Mê hoặc | Hồn thú: bỏ mục tiêu, đi lung tung quanh chỗ đứng, không đánh. Hồn sư: không đánh, không dùng hồn kỹ, phím bị bỏ qua, server tự đi lung tung quanh chỗ bị Mê hoặc (`PLAYER_CHARM`). Không bị phá khi trúng đòn. |
| Đóng băng | Chỉ trên hồn sư (chiêu băng của hồn thú): như Choáng (không đi, không đánh, không dùng hồn kỹ), hình khối băng. |
| Hàn | Chỉ trên hồn sư (Cực Hàn của Huyền Minh Băng Giao, mục 5.4): tự nó không gây gì; đủ tầng (`STATUS.chill`) thì bùng phát thành Đóng băng. |
| Ngập nước | Chỉ trên hồn sư (vùng ngập Thủy Triều Dâng của Thâm Hải Ma Kình Vương, mục 5.4): Làm chậm (`STATUS.flood`), cộng với Làm chậm khác tối đa `SLOW_CAP`; vùng ngập gây lại theo nhịp với thời gian ngắn nên ra khỏi nước là hết. |
| Che tầm nhìn | Chỉ trên hồn sư (Phun Mực của tinh anh Ma Chương Vương, mục 5.3): không chặn đi, đánh, hồn kỹ; màn hình người trúng phủ mực, chỉ còn thấy một vòng quanh thân mình (`PLAYER_INK`), giao diện (HUD) không bị che. |
| Phong ấn | Không tự gây gì; đủ tầng thì bùng phát thành Dễ thương dài hơn mặc định. |

### Luật chung
- Sát thương theo thời gian tính một lần lúc gây (công người gây, kể cả tăng công, × sức mạnh hồn kỹ); không chí mạng, không tạo năng lượng tiên cơ, không giữ hồn sư trong giao chiến. Người gây rời phòng thì trạng thái đó mất.
- Gây lại cùng trạng thái: cộng tầng tới tối đa, lấy thời gian còn lại dài hơn và độ lớn mạnh hơn.
- Khống chế (Choáng, Trói, Câm lặng, Mê hoặc, đẩy lùi) ngắn hơn với hồn thú bậc cao (`CC_TIER_MULT`).
- Choáng, Câm lặng, Mê hoặc trên hồn thú **ngắt chiêu báo trước** đang hiện.
- Hồn thú không có mục tiêu và không bị đánh một lúc thì tự hồi máu (`BEAST_REGEN`), để Trúng độc có tác dụng.

## Trạng thái trên hồn sư
`PLAYER_STATUS`, cùng luật cộng tầng.

### Nguồn gây
- Chỉ chiêu của hồn thú và đòn của đối thủ ở Đại Đấu Hồn Trường gây. Mị hoặc, Phong ấn không có trên hồn sư.
- Chiêu "mê hoặc" của hồn thú gây **Mê hoặc**; chiêu "đóng băng" gây **Đóng băng**.
- Tầng **Hàn** chỉ do Cực Hàn gây, **Ngập nước** chỉ do vùng ngập của Thủy Triều Dâng gây (mục 5.4), **Che tầm nhìn** chỉ do Phun Mực gây (mục 5.3). Các trạng thái này chỉ hồn thú gây (`PLAYER_STATUS_PVE`: hồn kỹ có Mê hoặc của đối thủ ở đấu trường không gây lên hồn sư).
- Trạng thái có bùng phát (`burst`): đủ tầng thì mất trạng thái đó và nhận trạng thái bùng phát (qua kháng như mọi lần gây).

### Tác dụng và kháng
- Server bỏ qua đánh thường và từ chối hồn kỹ, Chân Thân, kỹ năng hồn cốt khi đang bị khống chế.
- Đang không đi được (Choáng, Đóng băng, Trói) hoặc Mê hoặc thì không bắt đầu đi cổng / truyền tống (tin báo ghi tên trạng thái).
- Kháng Choáng của bị động hồn cốt cũng rút ngắn Đóng băng, Mê hoặc (`RESIST_AS`); Ngập nước không có kháng (đứng trong nước là chậm). Thời gian khống chế trên hồn sư không nhân theo bậc.
- Trạng thái thuộc hồn sư (đổi võ hồn vẫn còn). Hết khi vào vùng an toàn hoặc cả đội gục; **thanh tẩy** (tiên cơ / hồn kỹ phụ trợ) giải hết.

### Hiển thị
- Ai cũng thấy dây trói, sao choáng, khối băng, tim hồng và biểu tượng trên đầu (Che tầm nhìn: giọt mực).
- Chính mình thấy ô viền đỏ cạnh hiệu ứng có lợi.
- **Che tầm nhìn:** màn mực thủy mặc phủ khung nhìn trừ vòng quanh thân (phủ nhanh, vòng mở dần lúc trúng, tan khi hết; hiện cả khi tắt ánh sáng / hạt bay; mực che cả chữ nổi, tên chiêu ngoài vòng). Giao diện (HUD) không bị che.


- **Trạng thái trên hồn sư** (`PLAYER_STATUS`, cùng luật cộng tầng): chỉ chiêu của hồn thú và đòn của đối thủ ở Đại Đấu Hồn Trường gây. Mị hoặc, Phong ấn không có trên hồn sư. Chiêu "mê hoặc" của hồn thú gây **Mê hoặc**, chiêu "đóng băng" gây **Đóng băng**; tầng **Hàn** chỉ do Cực Hàn gây, **Ngập nước** chỉ do vùng ngập của Thủy Triều Dâng gây (mục 5.4), **Che tầm nhìn** chỉ do Phun Mực gây (mục 5.3); các trạng thái này chỉ hồn thú gây (`PLAYER_STATUS_PVE`: hồn kỹ có Mê hoặc của đối thủ ở đấu trường không gây lên hồn sư). Trạng thái có bùng phát (`burst`) trên hồn sư: đủ tầng thì mất trạng thái đó và nhận trạng thái bùng phát (qua kháng như mọi lần gây). Server bỏ qua đánh thường và từ chối hồn kỹ, Chân Thân, kỹ năng hồn cốt khi đang bị khống chế; đang không đi được (Choáng, Đóng băng, Trói) hoặc Mê hoặc thì không bắt đầu đi cổng / truyền tống (tin báo ghi tên trạng thái). Kháng Choáng của bị động hồn cốt cũng rút ngắn Đóng băng, Mê hoặc; Ngập nước không có kháng (đứng trong nước là chậm) (`RESIST_AS`). Thời gian khống chế trên hồn sư không nhân theo bậc. Trạng thái thuộc hồn sư (đổi võ hồn vẫn còn); vào vùng an toàn hoặc cả đội gục thì hết; **thanh tẩy** (tiên cơ / hồn kỹ phụ trợ) giải hết. Ai cũng thấy dây trói, sao choáng, khối băng, tim hồng và biểu tượng trên đầu (Che tầm nhìn: giọt mực); chính mình thấy ô viền đỏ cạnh hiệu ứng có lợi, và khi bị Che tầm nhìn thì thấy màn mực thủy mặc phủ khung nhìn trừ vòng quanh thân (phủ nhanh, vòng mở dần lúc trúng, tan khi hết; hiện cả khi tắt ánh sáng / hạt bay; mực che cả chữ nổi, tên chiêu ngoài vòng).
- Hồn thú không có mục tiêu và không bị đánh một lúc thì tự hồi máu (`BEAST_REGEN`), để Trúng độc có tác dụng.

## Hiệu ứng có lợi trên hồn sư
`BUFFS`: tăng công, tăng tốc, tăng thủ (giảm sát thương nhận), tăng chí mạng, giảm tiêu hao hồn lực, miễn sát thương, lãnh vực phượng hoàng, tàng hình, hút huyết.

Như khiên, hiệu ứng **thuộc hồn sư** nên đổi võ hồn vẫn còn (tung ở võ hồn phụ trợ rồi đổi về võ hồn đánh chính); cả đội gục thì mất. Hiệu ứng của võ hồn Phụ trợ lan cho đồng đội tổ đội đứng gần (mục 5.9).
### Lãnh vực phượng hoàng, tàng hình, hút huyết, Phong Lôi
- **Lãnh vực phượng hoàng** (Tà Hỏa Phượng Hoàng): vòng lửa bán kính `PHOENIX_FIELD_R` đi theo hồn sư (rộng hơn khi Tà Hỏa Phượng Hoàng đang Chân Thân, `phoenixFieldR`); hồn thú trong vòng nhận thêm sát thương từ mọi nguồn, kể cả của người khác và sát thương theo thời gian (nhiều lãnh vực chồng nhau chỉ lấy cái mạnh nhất). Tạm vô hiệu khi hồn sư đứng trong vùng an toàn hoặc đang đi cổng.
- **Tàng hình:** hồn thú bỏ mục tiêu và không nhắm tới hồn sư; đối thủ không khóa mục tiêu được (đòn diện rộng vẫn trúng). Đánh thường, tung hồn kỹ / tiên cơ khác, hoặc **bị đòn trực tiếp đánh trúng** (kể cả khi khiên đỡ hết) thì hiện hình; sát thương theo thời gian và đòn bị miễn thì không. Người khác thấy mờ hẳn, chính mình thấy nửa trong suốt.
- **Hút huyết** (Quỷ Mị): một phần mọi sát thương hồn sư gây lên hồn thú (đòn trực tiếp, theo thời gian, lan Cảm điện) hồi thành sinh lực cho võ hồn đang ra trận; cộng với hút máu riêng của từng hồn kỹ.
- **Phong Lôi Chi Lực** (Lam Điện Bá Vương Long, `PHONG_LOI`): thanh của hồn sư, chỉ tích khi Lam Điện ra trận đánh trúng (đòn thường, hồn kỹ; nhiều hơn khi trúng hồn thú Cảm điện; gấp đôi khi đang Chân Thân, `ChanThanDef.lei`). Đầy thì **tự tung Lôi Động Minh Thiên** (vùng quanh thân, thêm sát thương lên mục tiêu Cảm điện, Choáng ngắn), thanh về 0; đòn này không tạo năng lượng tiên cơ và không tích lại thanh. Ngoài giao chiến lâu thì giảm dần; Lam Điện gục thì mất hết; không lưu DB. Ai cũng thấy tia sét quanh thân; chính mình thấy thanh dưới thanh kinh nghiệm.

## Lịch sử / issue liên quan
- Nhật ký từng bước: `docs/lich-su.md`.
