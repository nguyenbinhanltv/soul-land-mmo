# Hồn hạch

Hồn hạch: sao, bộ, dòng phụ, hiệu ứng bộ, nâng cấp, đổi bộ. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`). Số issue ở cuối file.


## 5.6 Hồn hạch

### Ô, sao, bộ, rơi, gắn
- **6 ô trên mỗi võ hồn** (`CORE_SLOTS`), **ô nào cũng nhận mọi hồn hạch**. Mỗi hồn hạch có **sao 1–6** (`MAX_CORE_STARS`), thuộc một **bộ** (`CORE_SETS`), có 1 chỉ số chính (theo sao) và số dòng phụ ngẫu nhiên theo sao (`CORE_SUBS`, tối đa `CORE_MAX_SUBS`; không trùng nhau và không trùng chỉ số chính; mỗi dòng tung trong `CORE_SUB_ROLL` mức tối đa của sao). Chỉ số và mức ở `CORE_STATS`, `CORE_STAR_K`, `coreMainValue`, `coreSubMax`.
- **Rơi:** theo `CORE_DROP` (khoảng sao theo niên hạn, sao thấp hay ra hơn: `CORE_STAR_W`); bộ phần lớn theo bản đồ (`CORE_MAP_SET`), còn lại bộ bất kỳ. Tinh anh chắc chắn rơi 1 hồn hạch. Rơi đất cùng luật nhặt (mục 4). Trong túi biểu tượng viên hạch màu bộ, sao ở góc, tên kiểu *+6 Hồn hạch Hạo Thiên 4★*; chi tiết ô ghi bộ, chỉ số chính, dòng phụ, hiệu ứng bộ.
- **Gắn** (mục "Hồn hạch" của bảng đội hình hoặc nút "Gắn…" ở túi; kéo thả, kéo giữa hai ô thì đổi chỗ): không chọn ô thì vào ô trống đầu tiên; đủ 6 ô mà không chọn ô thì từ chối. Cùng luật ngoài giao chiến, không chiếm ô túi, không bao giờ mất như hồn cốt.
- **Chỉ số:** dòng % (sinh lực / công / hồn lực) nhân phần gốc của võ hồn, dòng phẳng cộng thẳng, tỉ lệ / sát thương chí mạng cộng vào `CRIT` (`coreBonus`). Võ hồn không ra trận cũng có sinh lực tối đa theo hồn hạch của nó.
### Hiệu ứng bộ
- **Hiệu ứng bộ** (`CORE_SET_FX`, `CORE_FX_RULE`, `coreFx`): 2 món cùng bộ nhận hiệu ứng 2 món, 4 món nhận thêm hiệu ứng 4 món (ghép 4 + 2 hoặc 2 + 2 + 2). Chỉ tính trên võ hồn **đang ra trận**, lên hồn thú và chính hồn sư; lên đối thủ ở Đại Đấu Hồn Trường theo mục 5.9 "Cân bằng PvP" (không áp Bá Vương Long 2 món, Lam Ngân 2 món, Viêm bạo của Phượng Hoàng 4 món); riêng Tiên Cơ 2 món tính trên võ hồn mang bộ khi ở ngoài sân. Ngoại lệ hỗ trợ tổ đội: Lưu Ly 4 món khi đổi tay chia hiệu ứng tăng công tới đồng đội hợp lệ trong `PARTY_BUFF_R` theo `PARTY_BUFF_MULT`; các CoreFx gây sát thương / trạng thái vẫn chỉ thuộc người mang bộ.

| Bộ | 2 món | 4 món |
|---|---|---|
| Phượng Hoàng (Thiêu đốt) | Thiêu đốt do hồn sư gây mạnh hơn | Thiêu đốt của hồn sư thêm 1 tầng tối đa; Viêm bạo mạnh hơn |
| Bá Vương Long (Cảm điện) | Sát thương lan Cảm điện mạnh hơn | Đòn trực tiếp trúng hồn thú Cảm điện hồi hồn lực (có hồi chiêu) |
| Xà Hoàng (Trúng độc) | Trúng độc do hồn sư gây mạnh hơn | Hồn thú Trúng độc đủ nhiều tầng (người gây cuối mang bộ) nhận thêm sát thương từ mọi nguồn |
| Hạo Thiên (Chấn động) | Công (vào chỉ số) | Đòn đánh thường **trúng** thứ 3 liên tiếp (cách nhau không quá vài giây) gây thêm sát thương, chữ "Hạo Thiên liên kích!" |
| Thất Sát (Phá giáp) | "Xuyên thủ": đòn trực tiếp bỏ qua một phần thủ của hồn thú (cộng với phần Phá giáp giảm, tối đa hết thủ; mục 5.3) | Thêm tỉ lệ chí mạng lên hồn thú đang Phá giáp |
| Linh Miêu (Mẫn công) | Tỉ lệ chí mạng (vào chỉ số) | Chí mạng thì tăng tốc độ đánh thường một lúc |
| Lam Ngân (Khống chế) | Khống chế do hồn sư gây lên hồn thú dài hơn | Hồn kỹ có khống chế trúng ít nhất một hồn thú thì hồi hồn lực (một lần mỗi lần tung) |
| Lưu Ly (Phụ trợ) | Hồi máu và khiên mạnh hơn | Đổi tay võ hồn mang bộ vào thì cả đội tăng công một lúc (hiệu ứng có lợi của hồn sư) |
| Tiên Cơ | Võ hồn mang bộ tích năng lượng tiên cơ nhanh hơn (`TIEN_CO_SET`) | Tiên cơ của võ hồn mang bộ mạnh hơn |

### Nâng cấp
- **Nâng cấp** (nút "Nâng cấp…" ở túi / ô hồn hạch đang gắn, hoặc Thợ rèn "Nâng cấp hồn hạch"; ở đâu cũng được, chỉ khi ngoài giao chiến): tối đa `CORE_FEED_MAX` hồn hạch trong túi làm nguyên liệu. Điểm theo sao (`CORE_FEED_STAR`), cùng bộ được thêm (`CORE_FEED_SAME_SET`), cộng một phần điểm đã nạp (`CORE_FEED_CARRY`). Cấp +0 … +`CORE_MAX_ENHANCE` theo `CORE_ENHANCE_COST` (**một bảng ngưỡng cho mọi sao**: sao thấp nên làm nguyên liệu).
  - Mỗi cấp tăng chỉ số chính (`CORE_ENHANCE_MAIN`); **mỗi `CORE_SUB_EVERY` cấp tăng 1 dòng phụ ngẫu nhiên**: chưa đủ dòng thì thêm dòng mới, đủ rồi thì một dòng có sẵn cộng thêm một lần tung (`coreUpgradeSubs`, tung ở server).
  - **Phí Hồn Tệ** theo cấp vượt qua như cường hóa hồn cốt (`CORE_ENHANCE_FEE`, `enhanceFee`): các cấp thấp miễn phí, thiếu Hồn Tệ thì từ chối cả lần.
  - Nguyên liệu bị tiêu hao, không bao giờ thất bại; bảng xem trước (kèm phí), nút xác nhận đỏ ghi số hồn hạch sẽ mất và phí, banner ghi dòng phụ vừa thêm / tăng. Tháo ra vẫn giữ cấp, điểm, dòng phụ.
### Đổi bộ
- **Đổi bộ** (Thợ rèn "Đổi bộ hồn hạch", message `coreset`; phải đứng trong `NPC_RANGE` của Thợ rèn, ngoài giao chiến): chọn một hồn hạch (trong túi hoặc đang gắn) và một bộ khác bộ hiện tại trong `CORE_SETS`. Chỉ đổi bộ; giữ sao, cấp, điểm đã nạp, chỉ số chính, dòng phụ, khoá. **Phí Hồn Tệ theo sao** (`CORE_RESET_FEE`, `coreResetFee`) mỗi lần đổi; thiếu tiền, cùng bộ, bộ lạ, đứng xa, giao chiến thì từ chối, không trừ gì. Đang gắn thì hiệu ứng bộ tính lại ngay. Không tung lại dòng phụ.
### Lưu
- **Lưu:** mỗi hồn hạch một dòng `items` (`kind` = `code` = `hon_hach`, `stars`, `enhance`, `stats` = `{set, main, subs, slot, xp}`, `years` NULL, `vohon_id`). Chỉ số chính tính lại từ sao và cấp; dòng phụ lưu giá trị.

## Lịch sử / issue liên quan
- Nhật ký từng bước: `docs/lich-su.md`.
