# Đấu La Tu Tiên

Nâng cấp lớn của game: thêm lớp **tu tiên** (Dưỡng Hoàn, Thú Niệm, Đạo Tâm, Lôi Kiếp, linh căn ngũ hành, Động Phủ…) lên trên hệ võ hồn / hồn hoàn hiện có, và **đổi tên game thành "Đấu La Tu Tiên"**. Tài liệu này là **thiết kế giai đoạn 0**: chỉ có chữ, **chưa đổi code, chưa sửa các file thiết kế cũ** (mục "Đối chiếu hệ thống hiện có" liệt kê những gì sẽ bị thay). Số cân bằng **không** nằm ở đây: chỉ ghi dạng công thức và tên hằng dự kiến, giai đoạn sau đặt trong `shared/data.ts`. Quyết định chủ repo: Q59, Q60, Q61 ở `docs/quyet-dinh.md`. Số issue ở cuối file.

> Quy ước viết: tên hằng **chưa có** trong `shared/data.ts` ghi chữ thường không dấu backtick (vd DUONG_HOAN_RATE); khi hằng được thêm vào code thì đóng backtick để `docs-check` kiểm.
>
> Trạng thái: **đề xuất để chủ repo duyệt** trừ ba quyết định đã chốt (Q59–Q61). Chỗ nào ghi *(đề xuất)* hoặc nằm ở mục "Câu hỏi còn mở" thì chưa chốt; không làm code trước khi chủ repo duyệt giai đoạn tương ứng.

## 5.26 Đấu La Tu Tiên

### Ý tưởng: "Hồn ở ngoài, Đạo ở trong"
- **Hồn ở ngoài:** sức mạnh bên ngoài đến từ võ hồn, hồn hoàn, hồn cốt, hồn hạch, hồn thú đã hạ; săn bắn, kỹ năng, đội hình giữ như hiện nay.
- **Đạo ở trong:** sức mạnh bên trong là tu vi, linh căn, Đạo Tâm, đạo cơ. Hồn hoàn không còn là món đồ "đúng một số năm rồi xong": nó là một thứ **nuôi được**, **đột phá được**, **có thể phản chủ**, và người nuôi nó phải có Đạo Tâm đủ vững.
- Hai nửa phải bổ sung cho nhau: săn ngoài rừng cho nguyên liệu (hồn hoàn, hồn thú để bổ hoàn, dược thảo), ngồi trong nội tâm (đả tọa, vượt Thú Niệm, vượt Lôi Kiếp) biến nguyên liệu thành sức mạnh.

### Vòng chơi
```text
Săn (hồn thú, hồn hoàn) → Hấp thụ = đột phá nhỏ (đối mặt Thú Niệm)
   → Đả tọa Dưỡng Hoàn (niên hạn tăng dần, linh căn hợp hệ thì nhanh)
   → Vòng vượt ngưỡng màu (trăm → nghìn → vạn → mười vạn năm), hồn kỹ có thể biến dị
   → Cần hồn thú hợp hệ để bổ hoàn / mở vòng mới → quay lại săn
Ở các mốc lớn của cảnh giới: Lôi Kiếp (có hộ pháp), Hồn Hạch đầu, Chân Linh, Pháp Tướng…
```
Nhịp một lượt hấp thụ → dưỡng → đột phá phải đủ ngắn để có "thứ nhìn thấy được" sau mỗi phiên chơi (niên hạn nhích lên, vòng đổi màu, hồn kỹ mới) nhưng đủ dài để vòng 10 không thể đạt trong một tuần. Mục tiêu thời gian: đặt khi làm giai đoạn 1 theo `balance-review`, so với nhịp lên cấp đã chốt ở Q54.

## Bảng cảnh giới song song

Cảnh giới tu tiên là **lớp nhãn song song**, không thay cấp hồn lực 1–100 (`MAX_LEVEL`) hay danh hiệu Đấu La hiện có (`TITLES`, mỗi 10 cấp một danh hiệu). Mỗi hàng dưới đây là **thứ được mở thêm** khi qua mốc.

| Cấp hồn lực | Cảnh giới tu tiên | Danh hiệu Đấu La (`TITLES`) | Mở ra / đổi gì |
|---|---|---|---|
| 1–30 | Luyện Khí → Trúc Cơ | Hồn Sĩ → Hồn Tôn | Thức tỉnh võ hồn **kèm linh căn**; Dưỡng Hoàn (đả tọa nuôi vòng); Thú Niệm lần đầu ở các vòng đầu |
| 31–50 | Kim Đan | Hồn Tông → Hồn Vương (đầu) | Ngưng **Hồn Hạch đầu** (Kim Đan); hồn cốt luyện thành **pháp bảo bản mệnh** |
| 51–70 | Nguyên Anh | Hồn Vương → Hồn Đế | **Võ Hồn Chân Linh xuất khiếu** = tự săn / ủy thác; **Lôi Kiếp đầu tiên** ở bậc Hồn Vương |
| 71–80 | Hóa Thần | Hồn Thánh | **Võ Hồn Chân Thân = Pháp Tướng Thiên Địa** + **Hồn Lĩnh Vực** |
| 81–90 | Luyện Hư / Hợp Thể | Hồn Đấu La | **Dung Hợp Kỹ** thành **hợp kích trận pháp** (nhiều người cùng bày) |
| 91–99 | Đại Thừa | Phong Hào Đấu La | Phong hào là **Đại Đạo pháp tắc** (một đặc quyền pháp tắc gắn danh hiệu) |
| 100 | Độ Kiếp → Thành Thần | Phong Hào Đấu La | Kiếp cuối; qua kiếp thì **Thần vị = Phi Thăng** |

Ghi chú:
- Mốc cấp theo đúng quy ước hiện có: vòng thứ k hấp thụ ở bình cảnh cấp 10×k (`atBottleneck`), nên **các mốc lớn khớp bình cảnh**: vòng 3 (cấp 30 → Kim Đan), vòng 5 (cấp 50 → Nguyên Anh, Lôi Kiếp đầu), vòng 7 (cấp 70 → Hóa Thần, đúng vòng mở Chân Thân hiện nay), vòng 8 (cấp 80 → Luyện Hư), vòng 9 (cấp 90 → Đại Thừa), vòng 10 (cấp 100 → Độ Kiếp).
- Danh hiệu Đấu La và cảnh giới là hai cột **hiển thị** song song; không đổi `TITLES`. Tên cảnh giới hiện trên bảng Nhân vật và Danh Hiệu (`docs/design/danh-hieu.md`); bậc danh hiệu mới (Thần vị) thêm sau.
- Ở các cảnh giới sau Hóa Thần, "Hợp Thể" và "Đại Thừa" là nhãn; luật mở thêm của từng nấc làm ở giai đoạn 5.

## Dưỡng Hoàn

**Chốt (Q59):** niên hạn hồn hoàn **không còn cố định**. Người chơi **đả tọa** để dồn tu vi vào **một vòng đang nuôi**; niên hạn của vòng đó tăng dần. Vượt **ngưỡng màu** (trăm năm → nghìn → vạn → 10 vạn năm, đúng `TIERS`) là một **đột phá nhỏ**, hồn kỹ của vòng đó **có thể biến dị**. **Linh căn hợp hệ ngũ hành** của vòng thì lớn nhanh, bị khắc thì chậm.

### Luật
- **Một vòng đang nuôi mỗi lúc** (đổi vòng được, ngoài giao chiến). Vòng không được nuôi đứng yên; không có suy giảm theo thời gian.
- **Đả tọa:** hành động ngồi yên (không đi, không giao chiến, không bị đánh trong `TEAM_COMBAT_SECS`). Server tính theo thời gian **server** đã ngồi; client chỉ gửi ý định ngồi / đứng dậy. Hiệu suất cao hơn trong vùng an toàn và cao nhất ở Động Phủ (mục Động Phủ); thấp hơn nơi linh khí loãng (thành chính).
- **Tốc độ tăng niên hạn** (dạng công thức, hằng ở `shared/data.ts`):
  - `tốc_độ = DUONG_HOAN_RATE × m_linh_can × m_he_vong × m_mat_do × m_dan / (niên_hạn / DUONG_HOAN_Y0)^DUONG_HOAN_EXP`, với `0 < DUONG_HOAN_EXP < 1`: niên hạn càng cao càng chậm tăng, nhưng không bao giờ kẹt cứng.
  - `m_linh_can`: độ thuần linh căn của người chơi (căn bậc hai của độ khớp, như ý tưởng ở nguồn tham khảo tu tiên, DUONG_HOAN_LINH_CAN).
  - `m_he_vong`: hệ ngũ hành của vòng (lấy từ hồn thú nguồn, hoặc từ võ hồn nếu là vòng khởi) so với linh căn: **hợp / sinh nhân lên, bị khắc chia xuống** (DUONG_HOAN_HE, bảng ngũ hành ở dưới).
  - `m_mat_do`: mật độ linh khí nơi ngồi (bản đồ, Động Phủ, Linh Mạch nếu có, DUONG_HOAN_RHO).
  - `m_dan`: đan Dưỡng Hoàn đang có tác dụng (giới hạn số viên cùng lúc, DUONG_HOAN_DAN_MAX).
- **Niên hạn tăng thế nào được ghi:** vòng lưu `niên hạn` hiện tại (số năm) và `tu vi dồn` chưa đủ một bước; chỉ server ghi.
- **Trần mỗi bước:** mỗi lần ngồi chỉ tính tối đa DUONG_HOAN_SESSION_MAX giây hữu hiệu (kể cả offline); vượt thì phải đứng dậy ngồi lại. Đây là lớp chống treo; chi tiết kết hợp với Tự săn / Ủy thác ở giai đoạn 4.
- **Ngưỡng màu và đột phá nhỏ:** chạm 100 / 1.000 / 10.000 / 100.000 năm thì vòng đổi màu (`TIERS`), đủ điều kiện **đột phá** nếu đã đủ `tu vi dồn` cho bước đó. Đột phá nhỏ: thông báo, hiệu ứng riêng, và một lần **tung biến dị** (bên dưới). Không cần Thú Niệm (Thú Niệm là của lúc hấp thụ), nhưng đột phá nhỏ ở bậc 10.000 → 100.000 năm cần Đạo Tâm tối thiểu (DAO_TAM_NEED_DEN, đề xuất).
- **Biến dị hồn kỹ:** tại mỗi ngưỡng màu, vòng có xác suất BIEN_DI_CHANCE[bậc] (tăng theo bậc, tăng thêm khi hợp hệ) để hồn kỹ vòng đó **đổi dạng** theo một nhánh dựng sẵn (BIEN_DI: thêm hiệu ứng nguyên tố theo hệ vòng, hoặc đổi vùng tác dụng). Không làm hồn kỹ mất; biến dị là cộng thêm, tung ở server, ghi log. Khuôn: dữ liệu hồn kỹ vẫn ở `VOHON_SKILLS`, thêm bảng nhánh biến dị cạnh đó.

### Tương tác với hồn hoàn hiện có
Hồn hoàn rơi từ hồn thú vẫn có niên hạn (số năm) như bây giờ, nhưng **đó là niên hạn khởi điểm** của vòng khi hấp thụ, không phải niên hạn cuối. Hồn hoàn niên hạn thấp vẫn nuôi lên được, chỉ tốn thời gian hơn; hồn hoàn niên hạn cao là đường tắt. Điều này làm săn vẫn có giá trị mà không còn "mua đứt" bằng một viên hồn hoàn.

### Chống gian lận (ghi ở đây, soát khi làm)
- Thời gian ngồi do server đếm; client không báo "đã ngồi X giây".
- Một tài khoản chỉ nuôi một vòng một lúc; không ngồi khi đang giao chiến, đang trong bí cảnh, đang tự săn.
- Offline: không cộng (hoặc cộng tối đa DUONG_HOAN_OFFLINE_MAX kiểu Ủy thác offline, chưa duyệt, mục "Câu hỏi còn mở").
- Mọi đột phá nhỏ ghi log (hạt giống, tung ra, kết quả) để khiếu nại.

## Thú Niệm

**Chốt (Q60):** bỏ giới hạn cứng niên hạn khi hấp thụ (`RING_LIMIT`, `ABSORB_FAIL`, `absorbChance`), thay bằng **rủi ro Thú Niệm**.

### Luật
- **Hấp thụ = đột phá.** Hấp thụ một hồn hoàn vào vòng kế tiếp (vẫn ở bình cảnh cấp 10×k, vẫn ngoài giao chiến) mở ra **một lần đối mặt với ý chí hồn thú**.
- **Ý chí hiện thành bóng:** server tạo một **bóng Thú Niệm** của chính loài hồn thú đã cho hồn hoàn đó, dùng **kỹ năng của chính con thú** (hồn thú có hồn kỹ riêng theo loài, hiện đã có cơ chế hồn thú đánh bằng chiêu: `docs/design/hon-thu-boss.md`). Đây là **trận đấu nhỏ giữa người chơi và bóng**, một chọi một, ngoài tầm nhìn người khác (dạng instance nhỏ, giai đoạn 2 chốt phương án).
- **Vượt mức an toàn càng xa thì Thú Niệm càng mạnh.**
  - `mức_an_toàn(vòng)` thay cho `RING_LIMIT`: niên hạn một vòng chịu được *mà bóng chỉ ở mức dễ* (MUC_AN_TOAN[vòng]).
  - `độ_vượt = max(0, log(niên_hạn_hồn_hoàn / mức_an_toàn))` (dạng log, vì niên hạn trải nhiều bậc độ lớn).
  - `sức_bóng = THU_NIEM_BASE × (1 + THU_NIEM_SLOPE × độ_vượt)^THU_NIEM_EXP × h_đạo_tâm × h_khắc`, với chỉ số bóng suy từ `beastStats` của đúng niên hạn hồn thú (bóng mạnh bằng hồn thú đó ở niên hạn đó, nhân hệ số); `h_khắc` nhân thêm khi hệ vòng bị hệ hồn thú khắc.
  - Trong mức an toàn thì bóng chỉ là **thử thách mềm** (ít hoặc không thể thua), để cấp thấp vẫn hấp thụ thoải mái.
- **Thắng bóng:** hấp thụ thành công; được **vượt cấp** nếu hấp thụ vượt mức: vòng nhận niên hạn hồn hoàn **cao hơn trần cũ**, hoặc nhận thêm phần thưởng đột phá theo `độ_vượt` (THU_NIEM_VUOT, đề xuất: cộng điểm niên hạn dưỡng sẵn / hồn kỹ biến dị chắc chắn một lần). Mục đích: người dám mạo hiểm có thưởng xứng đáng, không chỉ là bỏ rủi ro.
- **Thua bóng:** **mất vòng đó** (vòng đang hấp thụ bị phá, hồn hoàn mất, vòng trước đó giữ nguyên) **và chấn thương đạo cơ** (buff xấu theo thời gian, DAO_CO_CHAN_THUONG: giảm chỉ số / giảm tốc độ Dưỡng Hoàn trong một khoảng; mức nặng theo `độ_vượt`). **Ngoại lệ có chủ đích cho Q02** ("thua không mất đồ"); chủ repo đã chốt trong Q60. Hồn cốt, hồn hạch, trang bị **không** mất.
- **Đạo Tâm làm Thú Niệm yếu đi:** hệ số `h_đạo_tâm` giảm khi Đạo Tâm cao (mục Đạo Tâm).
- **Không thể trốn:** rời trận / mất kết nối giữa chừng tính là **thua** (chống thoát để giữ hồn hoàn); đứng dậy khỏi hấp thụ trước khi bóng hiện thì hồn hoàn còn trong túi như hiện nay (`ABSORB_SECS` vẫn là thời gian chuẩn bị).
- **Ai thấy bóng:** chỉ người hấp thụ; hồn sư gần đó không bị cuốn vào (`interest.ts`, `beastsNear` không phát bóng cho người khác, hoặc bóng ở instance riêng).

### Chống gian lận
Kết quả trận bóng, phép tung tỉ lệ vượt cấp, mọi thứ tính ở server; client không gửi kết quả. Soát bằng skill `anti-cheat-audit` trước khi gộp giai đoạn 2: thoát giữa chừng, nhiều phiên, trục lợi bằng hồn thú cấp thấp ở vòng cao, thử lặp lại cùng một hồn hoàn.

## Đạo Tâm

- **Đạo Tâm** là một thang số của nhân vật (đề xuất 0–100, DAO_TAM_MAX, giá trị khởi đầu DAO_TAM_START). Nó **không** nằm trong công thức xác suất đột phá nào; nó **làm Thú Niệm (và sau này Tâm Ma / Lôi Kiếp) yếu đi**.
- Ý tưởng công thức: `h_đạo_tâm = 1 − DAO_TAM_GIAM × Đạo_Tâm / DAO_TAM_MAX` (hệ số giảm tối đa kẹp, không bao giờ vô hiệu hoá bóng).
- **Nguồn tăng** *(đề xuất)*: nhiệm vụ đạo tâm, thắng Thú Niệm, vượt Lôi Kiếp, giữ lời thề (nhiệm vụ cố định, không nạp). **Nguồn giảm**: thua Thú Niệm, giết hại vô tội ở PvP ngoài rừng nếu về sau có, nghiệp lực xấu (mục Chính / Tà / Ma). Số cụ thể: hằng `DAO_TAM_*`.
- **Trần theo phe** (mượn ý tưởng nguồn tu tiên): Hồn Sư (Chính) trần cao nhất; Tà Hồn Sư thấp hơn; Ma Hồn Sư thấp nhất. Đây là *đề xuất*, xem câu hỏi mở.
- **Lưu:** cột mới trong bảng tài khoản / nhân vật (SQL giai đoạn 2); chỉ server ghi; gửi cho client qua tin riêng (`dữ liệu riêng gửi tin riêng`), không đồng bộ cho người khác.

## Linh căn và ngũ hành

### Linh căn của hồn sư
- Mỗi tài khoản có **linh căn**: một hoặc nhiều hệ trong ngũ hành **Kim · Mộc · Thủy · Hỏa · Thổ**, cộng ba **hệ biến dị Phong · Lôi · Băng** (Phong theo Mộc, Lôi theo Kim, Băng theo Thủy khi tính khắc / sinh).
- **Loại:** Đơn / Song / Tạp (số hệ nhiều thì thuần thấp hơn). Hệ số tốc độ dưỡng: LINH_CAN_P[loại], tỉ lệ khi tạo LINH_CAN_ROLL. Có xác suất nhỏ ra biến dị (LINH_CAN_BIEN_DI).
- **Khi nào roll:** lúc thức tỉnh (`/api/awaken`), roll ở server, ghi một lần. Linh căn không tự đổi; có nhiệm vụ hiếm "Cải Căn" *(đề xuất, sau)*.
- **Tài khoản cũ:** chưa có linh căn → gán lúc nạp bằng roll cố định theo mã tài khoản (xem câu hỏi mở).
- **Quan hệ với võ hồn:** linh căn **không** thay hệ của võ hồn; nó ảnh hưởng **tốc độ Dưỡng Hoàn** và **mức phạt / thưởng khi dùng hồn kỹ khác hệ** (tuỳ chọn, giai đoạn 1 chỉ làm phần Dưỡng Hoàn để khỏi đụng cân bằng chiến đấu, Q12).

### Bảng khắc / sinh
- Khắc: Kim → Mộc → Thổ → Thủy → Hỏa → Kim. Sinh: Kim → Thủy → Mộc → Hỏa → Thổ → Kim.
- **Trong Dưỡng Hoàn:** hệ nguồn của vòng **sinh** hoặc **cùng** hệ linh căn thì nhanh; **bị linh căn khắc** thì chậm nhất; khác thì trung lập (DUONG_HOAN_HE).
- **Trong chiến đấu** *(chỉ khi chủ repo duyệt; giai đoạn 1 chưa làm)*: hệ hồn kỹ đánh trúng hệ hồn thú bị khắc thì hơi mạnh hơn, bị khắc thì hơi yếu hơn (NGU_HANH_DMG). Đây là lớp **trực giao** với bốn hệ võ hồn (cường công, mẫn công, khống chế, phụ trợ) và với `ARENA_HE_DMG`; phải soát `balance-review` vì động tới cán cân đấu trường.

### Đề xuất gán hệ cho võ hồn hiện có (`VOHON`)
Cơ sở: hình tượng, tên võ hồn, bộ hồn hạch và lối chơi hiện có. **Chưa duyệt**; chủ repo sửa tự do, dữ liệu chính thức nằm ở `shared/data.ts`.

| Hệ | Võ hồn |
|---|---|
| Kim | Cửu Tinh Thất Sát Kiếm, Nguyệt Nhận, Càn Khôn Hỗn Nguyên Tỏa, Phá Hồn Thương, Bạch Hổ |
| Mộc | Kỳ Nhung Thông Thiên Cúc, Bích Lân Xà Hoàng, Xúc Xích, Lam Ngân Thảo, A Ngân |
| Thủy | Yêu Hồ, Quỷ Mị, Cửu Bảo Lưu Ly Tháp |
| Hỏa | Tà Hỏa Phượng Hoàng, Hỏa Long, Hỏa Ảnh, Liệt Hỏa Thương Lang |
| Thổ | Nhu Cốt Thố, Tử Vong Chu Hoàng, Thiên Càn Bạch Ngọc Đỉnh, Hạo Thiên Chùy |
| Lôi (biến dị) | Lam Điện Bá Vương Long |
| Phong (biến dị) | U Minh Linh Miêu, Kim Vũ Miêu Ưng |
| Băng (biến dị) | Băng Phượng Hoàng |

(25 võ hồn: Kim 5, Mộc 5, Thủy 3, Hỏa 4, Thổ 4, Lôi 1, Phong 2, Băng 1. Thủy hơi ít; chủ repo cân nhắc chuyển Yêu Hồ hoặc Quỷ Mị nếu muốn.)

### Đề xuất gán hệ cho hồn thú (`BEASTS`)
Hệ của hồn thú quyết định **hệ của vòng** khi lấy hồn hoàn từ nó (và `h_khắc` của bóng Thú Niệm). Gán theo **loài**, theo vùng thường gặp.

| Hệ | Hồn thú |
|---|---|
| Kim | Ám Kim Khủng Trảo Hùng, Kiếm Vĩ Hạt, Kim Linh Ưng, Thiết Giáp Xuyên Sơn Giáp, Thiết Giáp Tê Ngưu, Thiết Giáp Cự Giải, Kiếm Ngư, Kim Lân Long Quy, Liệt Trảo Hùng |
| Mộc | Quỷ Đằng, Quỷ Đằng non, Thực Nhân Hoa, Cúc Yêu Hoa Linh, Độc Cức Đằng, Cổ Mộc Thụ Nhân, Ỷ La Hoa Yêu, Mạn Đà La Xà, Thanh Lân Xà, Bích Lân Xà, Thanh Lân Độc Cổ, Thiên Thanh Ngưu Mãng |
| Thủy | Thanh Lân Ngạc, Hắc Thủy Mãng, Lam Lân Hải Xà, Quỷ Diện Hải Yêu, Thâm Hải Ma Chương, Thâm Hải Ma Kình, U Linh Hải Mẫu, Huyết Nha Cự Sa, Độc Vụ Thiềm, Thất Tinh Độc Thiềm |
| Hỏa | Liệt Hỏa Tích Dịch, Hỏa Linh Điệp, Xích Lân Mãng |
| Thổ | Nhu Cốt Thỏ hoang, Điền Thử, Hắc Bối Dã Trư, Thái Thản Cự Viên, Nhân Diện Ma Chu, Nhân Diện Ma Chu non, Quỷ Hổ |
| Lôi (biến dị) | Lôi Văn Hầu, Lam Lôi Tê Ngưu, Lôi Dực Ưng, Lôi Quang Hải Diêu, Lôi Vân Hải Ưng |
| Phong (biến dị) | Phong Lang, Phong Lang con, Tử Văn Báo, Quỷ Ảnh Báo, U Minh Lang, Hôi Vũ Tước, Hắc Vụ Biên Bức, Độc Châm Phong |
| Băng (biến dị) | Tuyết Lang, Băng Nguyên Cự Tượng, Băng Vũ Ưng, Băng Giáp Cự Quy, Tuyết Vĩ Yêu Hồ, Băng Tinh Hạt, Hàn Băng Địa Long, Băng Phong Bạch Hùng, Hàn Nguyệt Ưng, Băng Bích Hạt, Huyền Minh Băng Tằm, Tuyết Ma Viên, Huyền Băng Thiềm |

Thú vương, boss thế giới và hồn thú thêm sau: gán khi thêm; boss 10 vạn năm nên là hệ đặc thù (đề xuất: hệ của bản đồ chứa nó). Quy tắc chung: **loài mới phải khai hệ** cùng lúc với `BEASTS`.

## Lôi Kiếp

- **Khi nào:** ở các **đột phá lớn** của cảnh giới (vòng 5, 7, 8, 9, 10 trong bảng cảnh giới). Lôi Kiếp đầu ở bậc **Hồn Vương** (cấp 50, Nguyên Anh).
- **Dạng:** sát thương **thuần** theo đợt (bỏ qua thủ và ngũ hành, ý tưởng từ nguồn tu tiên), giáng lên **chủ kiếp**; vòng cảnh báo để canh thời điểm dùng khiên / đan, **không để né** (nhất quán "sát thương thuần").
- **Độ mạnh theo tổng niên hạn:** `Kiếp_Số = f(log(Σ niên hạn các vòng đang có))`; mỗi đợt `Strike(w) = HP_ref × KIEP_KAPPA[nấc] × KIEP_GROWTH^(w−1)`, với `HP_ref` chuẩn hoá theo sinh lực gốc của người chơi để kiếp luôn "đáng sợ" bất kể trang bị. Tổng niên hạn càng cao, hệ số KIEP_KAPPA càng lớn (KIEP_NIEN_HAN_SLOPE). Số đợt và số tia theo nấc (KIEP_WAVES, KIEP_BOLTS).
- **Người nuôi vòng quá cao bị kiếp nặng hơn**: đây là cái giá của Thú Niệm vượt cấp và Dưỡng Hoàn dài; nó gắn việc "đi nhanh" với rủi ro, thay cho trần cứng bị bỏ.
- **Nguồn giảm trừ** *(chỉ những nguồn này có tác dụng)*: **khiên pháp bảo bản mệnh** (giai đoạn 3, hồn cốt luyện thành), **trận bàn** (vật phẩm tiêu hao, nạp từng đợt), **đan hộ mạch** (hồi máu, có hồi chiêu; đan hồi thường bị khóa trong kiếp), **hộ pháp**.
- **Hộ pháp:** đồng đội tổ đội (hiện đã có tổ đội) đứng trong bán kính KIEP_HO_PHAP_R, tối đa KIEP_HO_PHAP_MAX người; mỗi người nhận KIEP_HO_PHAP_SHARE phần của mỗi tia, **chịu đúng phần đã chia**. Hộ pháp **không** được nhận thưởng đột phá của chủ kiếp; thưởng riêng cho hộ pháp (danh hiệu, vật phẩm nhỏ, KIEP_HO_PHAP_REWARD) để việc hộ pháp có giá trị xã hội. Chống gian lận: hộ pháp phải là tài khoản khác thật, không cùng phiên / cùng máy theo luật soát hiện có.
- **Kết cục:** sống hết các đợt → qua đột phá lớn. Chết giữa kiếp → hậu quả theo tiến độ kiếp đã qua (Nhẹ / Trung / Nặng; *đề xuất*: mất độ bền, buff chấn thương đạo cơ cùng loại với thua Thú Niệm, khoá đột phá lớn một khoảng); **không rớt cảnh giới đã đạt**, **không mất hồn hoàn đã có**.
- **Kiếp Đài:** chỗ chịu kiếp là vùng trống do server cấp (instance nhỏ) để sét không đánh nhầm người khác; chi tiết phòng ở giai đoạn 3.

## Chính, Tà, Ma và nghiệp lực

Dùng **tên trong truyện**: **Hồn Sư** (chính), **Tà Hồn Sư**, **Ma Hồn Sư** (thay "Chính / Tà / Ma" của nguồn tu tiên, không dùng thuật ngữ khác).

- **Nghiệp Lực** (`K`, thang đối xứng quanh 0): tăng khi làm việc thiện (nhiệm vụ cứu người, hộ pháp, bảo vệ hồn sư yếu), giảm khi làm việc ác. Ngoài rừng không có PvP (Q03), nên nguồn nghiệp ban đầu chỉ từ **nhiệm vụ, lựa chọn trong nhiệm vụ, và cách xử lý hồn thú** *(đề xuất: săn hồn thú non / hồn thú biết điều bị tính khác với hồn thú hung)*. Nghiệp từ PvP chỉ có khi PvP ngoài rừng mở lại; không có trong phạm vi các giai đoạn đầu.
- **Dải phe:** Hồn Sư (K ≥ ngưỡng NGHIEP_CHINH), vô phái ở giữa, Tà Hồn Sư (K ≤ NGHIEP_TA), Ma Hồn Sư (K ≤ NGHIEP_MA). Ngưỡng ở `shared/data.ts`.
- **Hiệu ứng (nhẹ, không phá cân bằng):**
  - Ảnh hưởng **trần Đạo Tâm** và **mức Thú Niệm** (Ma Hồn Sư gặp bóng mạnh hơn).
  - Ma Hồn Sư dưỡng hoàn **nhanh** hơn ở vòng khắc kiểu tà (ý tưởng "Ma đạo tu nhanh" của nguồn) nhưng **chịu Lôi Kiếp nặng hơn** và hao mòn độ bền nhiều hơn.
  - Hồn Sư nhận **thưởng xã hội** (danh hiệu, nhiệm vụ riêng, dịch vụ) chứ không nhận sức mạnh thuần.
- **Cái giá:** không cho nghiệp thiện cộng thẳng tỉ lệ nào; lợi thế Hồn Sư nằm ở Đạo Tâm và xã hội, tránh "làm việc thiện để mạnh hơn".
- Tông môn / tổ đội: không giới hạn theo phe ở giai đoạn đầu.

## Động Phủ, tiên phẩm dược thảo, luyện đan

- **Động Phủ:** không gian riêng (phụ bản cá nhân) mở ở Hóa Thần (cấp 71) hoặc sớm hơn *(đề xuất giai đoạn 5; chủ repo quyết cảnh giới mở)*. Dựng theo ô trên bản đồ riêng (khuôn bản đồ `docs/tech/phong-ban-do.md`, đã có cách dựng bản đồ riêng như Bí Cảnh). Công trình: **bồ đoàn** (tăng mật độ đả tọa), **linh điền** (trồng dược thảo), **đan lô** (luyện đan), **tụ linh trận** (tăng tốc linh điền / bồ đoàn, tiêu trận bàn định kỳ = sink), **giá kinh thư** (cất sách).
- **Tiên phẩm dược thảo:** mở rộng `HERBS` hiện có (tiên thảo dùng trực tiếp lên võ hồn: `013_tien_thao.sql`). Thêm **phẩm** (cấp, DUOC_THAO_PHAM) và **hệ** (ngũ hành, ảnh hưởng lên đan và vòng). Trồng ở linh điền; thời gian lớn theo phẩm; thu hoạch có số lượng ngẫu nhiên tung ở server; hạn chế thu hoạch tránh "treo cày" (`LINH_DIEN_*`).
- **Luyện đan:** `đan` là vật phẩm tiêu hao có tác dụng riêng: **Dưỡng Hoàn đan** (tăng tốc ngồi), **Định Tâm đan** (tạm thời giảm Thú Niệm), **Hộ Mạch đan** (hồi máu trong Lôi Kiếp), **Phá Cảnh đan** (cộng vào đột phá lớn). Luyện bằng dược thảo đúng hệ ở đan lô, có thời gian luyện và tỉ lệ ra phẩm (`LUYEN_DAN_*`). Ra thành phẩm tính ở server.
- Không làm ở giai đoạn đầu; Dưỡng Hoàn giai đoạn 1 chạy được mà không cần Động Phủ (ngồi ở vùng an toàn).

## Kinh tế

Mục tiêu giữ nguyên tinh thần nguồn tu tiên: **tiêu hao / sinh ra = 0,9–1,0 mỗi tuần** cho từng đồng tiền chính (Hồn Tệ, mảnh, nguyên liệu); vòng điều chỉnh hằng tuần do `balance-review` làm khi số liệu thật có.

| Nguồn sinh | Chỗ tiêu hao (sink) mới |
|---|---|
| Săn hồn thú (Hồn Tệ, hồn hoàn, mảnh, dược thảo rơi) | Đan (nguyên liệu + phí luyện); trận bàn Lôi Kiếp (tiêu khi nạp); Dưỡng Hoàn đan |
| Linh điền (dược thảo trồng) | Nạp tụ linh trận Động Phủ định kỳ; mở rộng Động Phủ |
| Hộ pháp, nhiệm vụ đạo tâm | Phí khởi Kiếp Đài; sửa độ bền sau kiếp |

- **Không thêm tiền mới** nếu chưa cần; dùng Hồn Tệ và mảnh hiện có (`kinh-te-tui-do.md`). Nếu cần đơn vị mới (linh thạch kiểu nguồn tu tiên) thì mở câu hỏi riêng.
- **Cân bằng:** mọi con số nằm ở `shared/data.ts`; đổi nguồn / sink thì chạy skill `balance-review` và ghi ở `docs/trang-bi-kinh-te.md`. Lưu ý Q57 (quái trâu hơn) và P7–P8 đang chờ chủ repo: nên chốt trước hoặc cùng lúc giai đoạn 1.
- **Giao dịch:** giữ Q03 (không giao dịch giữa người chơi). Đan, dược thảo **không** thành món đổi giữa người.

## Không lấy từ nguồn tu tiên

Hai thứ đã chốt **không** đưa vào Đấu La Tu Tiên:
- **Bay tự do** (di chuyển trên không): không làm; khinh công / `fly` chỉ giữ như hiệu ứng hình ảnh của hồn kỹ như hiện nay.
- **Phân thân chiến đấu đánh cùng lúc:** không làm; Chân Linh xuất khiếu (Nguyên Anh) chỉ để **tự săn / ủy thác** (một bản thân tự đi săn như Tự săn hiện nay), không cho điều khiển hai thân cùng lúc.

Nguồn tu tiên ở `van-gioi-tien-do/docs` là Cocos Creator: **chỉ đọc ý tưởng và công thức**, không chép code.

## Đối chiếu hệ thống hiện có

Mỗi hệ trong `GAME_DESIGN.md`: **giữ** (không đổi luật), **sửa** (đổi một phần, file cũ sẽ được cập nhật ở giai đoạn làm), **thay** (luật cũ bị thay hẳn). **Chưa sửa file cũ trong giai đoạn 0.**

| Hệ (mục) | File | Kết luận | Ghi chú |
|---|---|---|---|
| Võ hồn và đội hình (5.1) | `vo-hon-doi-hinh.md`, `trang-thai-buff.md` | **Giữ + sửa nhẹ** | 4 hệ võ hồn (cường công…) và danh hiệu giữ nguyên; thêm cột ngũ hành (trực giao) và cột cảnh giới. Nhịp lên cấp Q54 giữ. |
| Hồn hoàn (5.2) | `hon-hoan.md` | **Thay một phần lớn** | Xem danh sách luật bị thay ngay dưới. |
| Hồn thú, boss (5.3–5.4) | `the-gioi-ban-do.md`, `hon-thu-boss.md` | **Sửa** | Mỗi loài khai hệ ngũ hành; "Quy cấp theo niên hạn" (`beastLevel`, dựa trên `RING_LIMIT`) phải tính lại khi bỏ trần; hồn thú dùng chiêu làm nền cho bóng Thú Niệm. |
| Hồn cốt (5.5) | `hon-cot.md` | **Giữ + mở rộng** | Hồn cốt giữ; ở Kim Đan có thể luyện thành pháp bảo bản mệnh (một nhánh thêm, không bỏ gắn / cường hóa hiện có). |
| Hồn hạch (5.6) | `hon-hach.md` | **Giữ + mở rộng** | Hồn hạch hiện nay là **trang bị rơi 6 ô**; "Hồn Hạch đầu" ở Kim Đan là **một viên đặc biệt** ngưng bằng tu vi, không thay hệ ô hồn hạch. Cần chủ repo xác nhận (câu hỏi mở). |
| Túi, tiền (5.7) | `kinh-te-tui-do.md`, `trang-bi-kinh-te*.md` | **Sửa nhẹ** | Thêm đan, dược thảo, trận bàn, đan Dưỡng Hoàn; sink mới ở bảng kinh tế trên. |
| NPC, nhiệm vụ (5.8) | `npc-dia-diem.md`, `nhiem-vu.md` | **Sửa nhẹ** | Nhiệm vụ đạo tâm; NPC dạy dưỡng hoàn; chuỗi tân thủ giới thiệu linh căn. |
| Tổ đội, PvP, Đấu Hồn Trường (5.9) | `to-doi-pvp-dau-truong.md` | **Giữ + mở rộng** | Tổ đội thành hộ pháp Lôi Kiếp; Dung Hợp Kỹ thành hợp kích trận pháp (giai đoạn 5); đấu trường **không** áp Dưỡng Hoàn / Thú Niệm, chuẩn hoá như Q12; ngũ hành trong đấu trường chỉ làm khi chủ repo duyệt và phải soát `ARENA_HE_DMG`. |
| Pháp tướng (5.18) | `ky-nang-combat-phap-tuong.md` | **Sửa** | Chân Thân vòng 7 thành **Pháp Tướng Thiên Địa** ở Hóa Thần + Hồn Lĩnh Vực; luật Chân Thân hiện có giữ nền. |
| Tự săn, ủy thác (5.13) | `tu-san-uy-thac.md` | **Mở rộng** | Ở Nguyên Anh, tự săn / ủy thác trở thành **Chân Linh xuất khiếu** (đổi nhãn + điều kiện mở; luật hiệu suất giữ, Q07). Dưỡng Hoàn **không** chạy khi tự săn. |
| Tông môn (5.14) | `tong-mon.md` | **Giữ + mở rộng nhẹ** | Hộ pháp Lôi Kiếp tính vào tông vụ; không giới hạn tông theo phe ở giai đoạn đầu. |
| Danh Hiệu (5.25) | `danh-hieu.md` | **Mở rộng** | Thêm cột cảnh giới, danh hiệu Thần vị, danh hiệu hộ pháp. |
| Bí Cảnh (5.22) | `bi-canh.md` | **Mở rộng** | Phụ bản "Đột Phá", "Luyện Khí" ở danh sách sau MVP khớp với Thú Niệm / Dưỡng Hoàn. |
| Luật chung (4) | `01-luat-chung.md` | **Sửa nhẹ** | Hiển thị cảnh giới; trạng thái đả tọa; chấn thương đạo cơ như buff xấu (`trang-thai-buff.md`). |

### Luật cũ sẽ bị thay (chưa sửa, chỉ liệt kê)
Ở `docs/design/hon-hoan.md` (mục 5.2):
1. "**Niên hạn là số năm cụ thể**... hồn hoàn rơi ra mang đúng số năm đó" → niên hạn của vòng **tăng** nhờ Dưỡng Hoàn; số năm của hồn hoàn rơi là niên hạn khởi điểm.
2. "**Giới hạn theo vòng** (`RING_LIMIT`)... vượt quá mức cuối thì không cho hấp thụ" → **bỏ** trần cứng; thay bằng MUC_AN_TOAN + bóng Thú Niệm.
3. "**Thất bại thì chỉ mất hồn hoàn đó, không phạt gì thêm**" (`ABSORB_FAIL`) → thua bóng Thú Niệm **mất vòng + chấn thương đạo cơ**.
4. Hàm `absorbChance` (client và server dùng chung để hiển thị tỉ lệ thất bại) → đổi thành hàm hiển thị `mức_an_toàn` / độ vượt; bảng chọn hấp thụ không còn "tỉ lệ thất bại" mà là "độ vượt / sức bóng".
5. "Màu (bậc) suy ra từ số năm theo `TIERS`... đỏ = đúng 10 vạn năm" → màu vẫn theo `TIERS` nhưng số năm của một vòng **thay đổi được**; 10 vạn là ngưỡng, có thể vượt hay không là **câu hỏi mở** (trần `MAX_YEARS`).
6. "Hồn kỹ theo vòng": hồn kỹ có thể **biến dị** tại ngưỡng màu.

Ở file khác:
- `docs/quyet-dinh.md` Q02: "Thua không mất đồ" có thêm **ngoại lệ** (thua Thú Niệm mất vòng; Lôi Kiếp chấn thương). Cần ghi chú ở `docs/design/01-luat-chung.md`.
- `the-gioi-ban-do.md` "Quy cấp theo niên hạn": `beastLevel` dựa `RING_LIMIT`.
- Tên game: toàn bộ ở mục "Đổi tên game".
- `docs/trang-bi-kinh-te.md`: giả định hồn hoàn có niên hạn cố định trong tính giá.

## Đổi tên game

**Chốt (Q61):** tên mới **"Đấu La Tu Tiên"**. Danh sách dưới lấy từ `git grep` trên `origin/main` (2026-11-11), **chưa sửa**. Phân làn theo `CONTRIBUTING.md` (mục Hai làn).

### Tên hiển thị "Rừng Săn Hồn" (và biến thể)
| Chỗ | Nội dung hiện tại | Làn |
|---|---|---|
| `client/index.html` (landing, 8 chỗ) | `<title>`, `meta description`, `og:site_name`, `og:title`, tên thương hiệu đầu và cuối trang, `<h1>`, đoạn giới thiệu cuối trang | **Code** (`client/**`; landing sinh một phần từ `tools/landing-gen.mjs`, vùng võ hồn không đổi) |
| `client/choi/index.html` | `<title>Rừng Săn Hồn Online</title>` | **Code** |
| `client/src/main.ts` (màn đăng nhập) | `alt` logo và `<h1 class="c6-title">` | **Code** |
| `client/src/credits.ts` | "Rừng Săn Hồn dùng asset của…" (màn Ghi công) | **Code** |
| `client/scripts/ui-shots.mjs` | thư thử "Chào mừng đến Rừng Săn Hồn" | **Code** (script thử) |
| `server/src/index.ts` | log khởi động "Server Rừng Săn Hồn chạy tại…" | **Code** |
| `README.md` | tiêu đề "Rừng Săn Hồn Online" | **Nhanh** (`*.md`) |
| `GAME_DESIGN.md` | tiêu đề "Rừng Săn Hồn (Đấu La Đại Lục)" | **Nhanh**; `tools/docs-split.map.json` dòng khớp tiêu đề cũng cần đổi (công cụ: **Code**, đổi cùng một lượt) |
| `docs/huong-dan-choi.md` | tiêu đề "Hướng dẫn chơi Rừng Săn Hồn" | **Nhanh** |
| `docs/en/OVERVIEW.md` | "Rừng Săn Hồn Online" ("Soul Hunting Forest Online") | **Nhanh** |
| `docs/design/00-tong-quan.md` | "vào rừng săn hồn thú" (nghĩa thường, có thể giữ) | **Nhanh** (xét giữ) |
| `docs/design/trang-bi.md` | "luật nền của Rừng Săn Hồn" | **Nhanh** |
| `docs/art/ban-phac-nhan-vat-tui/index.html` | chữ cảnh "RỪNG SĂN HỒN" | **Nhanh** (`docs/**`) |
| `art/src/imagegen/c6/prompts.md`, `art/src/ui-kit/calendar-1597/prompt.txt` | lời nhắc sinh ảnh nhắc tên game | **Nhanh** (`art/**`; là lịch sử prompt, có thể giữ nguyên bản gốc) |

### Biểu tượng, ảnh có chữ tên cũ
- Logo (`/ui/landing/logo.webp`, `ui/c6/logo.png`) và ảnh chia sẻ `og.jpg` có thể chứa chữ "Rừng Săn Hồn": cần **kiểm bằng mắt**; nếu có chữ thì vẽ lại bằng skill `asset-gen` / `ui-kit` (**Nhanh**: `art/**`, ảnh sprite) rồi nhập (**Code** nếu đụng `client/**` / `shared/assets/**` ngoài `sprites/**`).

### Tên kỹ thuật (đề xuất KHÔNG đổi trong lượt này)
Các định danh sau không hiện ra người chơi; đổi tốn kém và rủi ro (đường dẫn Docker, gitops, khóa lưu):
- `package.json` / `client/package.json` / `server/package.json`: `rung-san-hon-online`; `Dockerfile` ghi chú; `art/palette.gpl`, `tools/assets/palette.mjs` ("Rung San Hon") → **Code**, ưu tiên thấp, làm sau.
- Image / repo: `soul-land-game`, `soul-land-mmo`, `soul-land-gitops`, `soul-land-assets-private`, tiền tố Redis `soul-land-mmo:presence`, `soulland.oleqima.com` (tên miền): **không đổi**; thay đổi hạ tầng do chủ repo quyết (ngoài phạm vi tài liệu).
- `.env.example`: "Sơn Hồn / Soul Land MMO" (ghi chú) → **Nhanh**? Tệp này nằm ngoài danh sách làn nhanh nên xếp **Code**.
- `tools/assets/quality.mjs`: tiêu đề trang preview "Preview asset Đấu La Đại Lục" (tên truyện, không phải tên game: **giữ**).

### Thứ tự làm đề xuất
1. **Một lượt làn nhanh** cho các file tài liệu thuần (`README.md`, `docs/huong-dan-choi.md`, `docs/en/OVERVIEW.md`, `docs/design/trang-bi.md`, `docs/art/ban-phac-nhan-vat-tui/index.html`). Riêng tiêu đề `GAME_DESIGN.md` đi cùng PR code ở bước 2, vì `tools/docs-split.map.json` (công cụ, làn code) đang khớp đúng dòng tiêu đề đó.
2. **Một PR làn code** cho `client/**`, `server/src/index.ts`, `tools/docs-split.map.json`, `GAME_DESIGN.md` (tiêu đề), `.env.example`; chạy `npm run check` và xem nhanh màn đăng nhập / landing.
3. **Việc ảnh** (logo, og) riêng, sau khi chủ repo duyệt chữ mới.
Không làm đổi tên trước khi chủ repo duyệt phương án (câu hỏi mở).

## Lộ trình

Số file SQL: **044 trở đi** (kiểm lại `ls server/sql` trên `origin/main` ngay trước khi tạo; ghi vào issue). Mỗi việc nhỏ cỡ một PR, một nhánh từ `origin/main`. Cột "Rủi ro": **AG** = chống gian lận (skill `anti-cheat-audit`), **SQL**, **MR** = đụng `MapRoom` / giao thức (cần `ao review trigger`), **CB** = cân bằng (skill `balance-review`).

### Giai đoạn 1: linh căn + ngũ hành + Dưỡng Hoàn
| Việc | Đụng tới | Rủi ro |
|---|---|---|
| 1.1 Hằng và hàm thuần: linh căn, bảng khắc / sinh, bảng hệ võ hồn / hồn thú, công thức tốc độ dưỡng (`DUONG_HOAN_*`, `LINH_CAN_*`, `NGU_HANH_*`) | `shared/data.ts` | CB |
| 1.2 SQL `044_linh_can_duong_hoan.sql`: cột linh căn (tài khoản), vòng đang nuôi + tu vi dồn + niên hạn động (cạnh dữ liệu vòng đã có); `PgStore` + `MemoryStore`; chạy lại an toàn, RLS | `server/sql`, `server/src/db.ts` | SQL |
| 1.3 Roll linh căn lúc thức tỉnh; gán cho tài khoản cũ khi nạp | `rooms/looks.ts` (`/api/awaken`), `db.ts` | AG |
| 1.4 Server: tin bắt đầu / dừng đả tọa; tích lũy niên hạn theo thời gian server; chọn vòng đang nuôi; ghi qua `this.chain(d, fn)`; cắt khi giao chiến / di chuyển | `MapRoom` (hoặc miền tách riêng), `rooms/schema.ts` nếu có trường đồng bộ | MR, AG |
| 1.5 Đột phá nhỏ ở ngưỡng màu + biến dị hồn kỹ (tung ở server, log) | `shared/data.ts` (BIEN_DI), `VOHON_SKILLS`, server | AG, CB |
| 1.6 Client: nút Đả tọa, bảng Dưỡng Hoàn (vòng đang nuôi, tiến độ, tốc độ, hệ), hiển thị linh căn ở thức tỉnh và bảng Nhân vật | `client/src` (kit Giấy / Mực, `GameScene.ts` nếu cần) | — |
| 1.7 Bot nhóm `duonghoan` (RAM + `--pg`); soát chống gian lận (tài liệu soát riêng cho Dưỡng Hoàn, đặt cạnh các `soat-gian-lan-*` khác ở `docs/tech`) | `client/scripts/bot/`, `docs/tech` | AG |
| 1.8 Cập nhật tài liệu thiết kế `hon-hoan.md`, `vo-hon-doi-hinh.md` theo luật đã chạy | `docs/design` | — |

### Giai đoạn 2: Thú Niệm + Đạo Tâm + hấp thụ vượt giới hạn
| Việc | Đụng tới | Rủi ro |
|---|---|---|
| 2.1 Hằng và hàm thuần Thú Niệm (MUC_AN_TOAN, `THU_NIEM_*`), Đạo Tâm (`DAO_TAM_*`) | `shared/data.ts` | CB |
| 2.2 SQL `04x_dao_tam.sql`: Đạo Tâm, chấn thương đạo cơ (buff xấu có hạn) | `server/sql`, `db.ts` | SQL |
| 2.3 Phương án phòng bóng: **chốt trước** (instance nhỏ dạng phụ bản như Bí Cảnh, hay thực thể tạm trong phòng hiện tại); tạo bóng bằng chiêu của loài | `rooms/` (con của `MapRoom` như `BiCanhRoom`), `interest.ts` | MR |
| 2.4 Bỏ trần `RING_LIMIT` / `ABSORB_FAIL` ở luồng hấp thụ; thay bằng độ vượt + trận bóng; thua mất vòng + chấn thương; thắng vượt cấp | `MapRoom` hấp thụ, `shared/data.ts` | MR, AG |
| 2.5 Client: bảng chọn hấp thụ hiện độ vượt / sức bóng; màn trận bóng; buff chấn thương | `client/src` | — |
| 2.6 Nguồn Đạo Tâm cơ bản (nhiệm vụ, thắng Thú Niệm); nhiệm vụ đạo tâm | `nhiem-vu.md`, server | CB |
| 2.7 Bot nhóm `thuniem`, soát gian lận (thoát giữa chừng, hồn thú thấp vào vòng cao, lặp) + ghi ngoại lệ Q02 ở `01-luat-chung.md` | `client/scripts/bot/`, `docs/tech` | AG |

### Giai đoạn 3: Lôi Kiếp + hộ pháp + Kim Đan (Hồn Hạch đầu, pháp bảo bản mệnh)
| Việc | Đụng tới | Rủi ro |
|---|---|---|
| 3.1 Hằng và hàm thuần Lôi Kiếp (`KIEP_*`), theo tổng niên hạn | `shared/data.ts` | CB |
| 3.2 Kiếp Đài: instance nhỏ + vòng đời kiếp (đợt, tia, cảnh báo, kết cục) | `rooms/` phòng mới hoặc con của `MapRoom`, giao thức tin kiếp | MR, AG |
| 3.3 Hộ pháp (tổ đội, chia tia, thưởng hộ pháp), trận bàn, đan hộ mạch | server, `shared/data.ts`, vật phẩm | MR, AG |
| 3.4 Hồn Hạch đầu ở Kim Đan (cấp 30 → 31): ngưng bằng tu vi, một viên đặc biệt cạnh 6 ô hồn hạch | `hon-hach.md`, `PgStore` nếu cần cột | SQL, CB |
| 3.5 Pháp bảo bản mệnh từ hồn cốt: luyện, kỹ năng, khiên chống kiếp | `hon-cot.md`, server | CB, AG |
| 3.6 Client: Kiếp Đài, thanh kiếp, mời hộ pháp | `client/src` | — |
| 3.7 Bot nhóm `loikiep`, soát gian lận hộ pháp | bot, `docs/tech` | AG |

### Giai đoạn 4: Nguyên Anh xuất khiếu, Hóa Thần
| Việc | Đụng tới | Rủi ro |
|---|---|---|
| 4.1 Võ Hồn Chân Linh xuất khiếu = tự săn / ủy thác (đổi nhãn, điều kiện mở ở cấp 51; luật hiệu suất giữ Q07) | `tu-san-uy-thac.md`, server tự săn | MR, AG |
| 4.2 Lôi Kiếp đầu ở Hồn Vương gắn với mở Chân Linh | Kiếp (giai đoạn 3) | AG |
| 4.3 Pháp Tướng Thiên Địa (Hóa Thần): nâng Chân Thân hiện có | `ky-nang-combat-phap-tuong.md`, `docs/art/phap-tuong.md`, client | CB |
| 4.4 Hồn Lĩnh Vực: vùng ảnh hưởng quanh hồn sư (ngoài giao chiến / trong trận) | server, `shared/data.ts` | MR, CB |
| 4.5 Dưỡng Hoàn tương tác với tự săn / offline (DUONG_HOAN_OFFLINE_MAX) | server | AG |

### Giai đoạn 5: Phong Hào pháp tắc, Thành Thần, Động Phủ
| Việc | Đụng tới | Rủi ro |
|---|---|---|
| 5.1 Dung Hợp Kỹ thành hợp kích trận pháp (Luyện Hư / Hợp Thể) | `to-doi-pvp-dau-truong.md`, server | MR, CB |
| 5.2 Phong Hào Đại Đạo pháp tắc (Đại Thừa): đặc quyền pháp tắc gắn danh hiệu | `danh-hieu.md`, `TITLES` | CB |
| 5.3 Độ Kiếp → Thần vị = Phi Thăng; danh hiệu và bảng xếp hạng Thần vị | server, `xep-hang.md` | AG |
| 5.4 Động Phủ: bản đồ riêng, công trình, linh điền, đan lô, tụ linh trận | `phong-ban-do.md`, SQL, server, client | SQL, MR |
| 5.5 Tiên phẩm dược thảo, luyện đan, sink kinh tế | `HERBS`, `shared/data.ts`, `balance-review` | CB, AG |
| 5.6 Chính / Tà / Ma Hồn Sư + nghiệp lực | nhiệm vụ, Đạo Tâm | CB |
| 5.7 Soak hiệu năng với đủ hệ mới (`soak-perf`) | `hieu-nang-soak.md` | — |

Đổi tên game (mục trên) chạy **song song**, độc lập các giai đoạn.

## Câu hỏi còn mở

1. **Trần niên hạn:** có còn trần 10 vạn năm (`MAX_YEARS`) không? Hay vòng nuôi có thể vượt 10 vạn nhưng cùng bậc "Đỏ"?
2. **Q02 "thua không mất đồ":** thua Thú Niệm **mất vòng** đã chốt (Q60); có cho **một lần miễn** (bảo hộ, đan Hộ Hồn) hay thay thế bằng chấn thương nhẹ hơn ở cấp thấp để người mới không bị "đập mất" vòng 1–2?
3. **Hồn Hạch đầu (Kim Đan):** có phải **viên đặc biệt thứ 7** cạnh 6 ô hồn hạch rơi hiện có, hay **thay hẳn** hệ hồn hạch? Đề xuất: thêm, không thay.
4. **Linh căn tài khoản cũ:** gán cố định theo mã tài khoản, hay cho **chọn một lần** miễn phí? Có cho Cải Căn không?
5. **Ngũ hành trong chiến đấu:** làm hay chỉ dừng ở Dưỡng Hoàn? Nếu làm, có áp ở Đại Đấu Hồn Trường (Q12) không?
6. **Dưỡng Hoàn khi offline:** cộng tối đa bao nhiêu (so với Ủy thác offline Q07)? Hay chỉ chạy khi online?
7. **Đả tọa và Tự săn:** hai thứ loại trừ nhau hay Chân Linh (Nguyên Anh) đi săn còn bản thân ngồi dưỡng cùng lúc? (Ghi nhớ: không có phân thân chiến đấu đồng thời.)
8. **Phe Hồn Sư / Tà / Ma:** trần Đạo Tâm khác nhau theo phe có chấp nhận không? Nguồn nghiệp ban đầu (vì không có PvP ngoài rừng) lấy từ đâu?
9. **Hộ pháp:** thưởng hộ pháp là gì; có cho hộ pháp cùng tông môn không; chống nuôi acc phụ làm hộ pháp?
10. **Động Phủ:** mở ở cảnh giới nào (cấp mấy), cá nhân hay theo tông môn? Có cho thăm viếng?
11. **Tên game:** "Đấu La Tu Tiên" đã chốt; có đổi tên miền / repo / ảnh chia sẻ không (hiện chỉ đề xuất đổi tên hiển thị)? Tiền tố Redis, tên image giữ?
12. **Tiền tệ:** dùng Hồn Tệ / mảnh hiện có hay thêm đơn vị mới (linh thạch)?
13. **Pháp bảo bản mệnh:** luyện từ **một hồn cốt cụ thể** (mất hồn cốt đó) hay **chiếu sáng một hồn cốt đang gắn** thành pháp bảo mà không mất? Ảnh hưởng đến hệ hồn cốt hiện có.
14. **Mốc cảnh giới trên bảng:** các mốc "81–90 Luyện Hư / Hợp Thể" và "91–99 Đại Thừa" có cần tách nấc rõ hơn (như nguồn có 4 tiểu cảnh) hay giữ nhãn?
15. **Thứ tự duyệt:** chủ repo có muốn **chốt P7 / P8 (cân bằng tiền)** trước giai đoạn 1 không?

## Lịch sử / issue liên quan
- Chủ repo chốt 2026-11-11: Q59 (Dưỡng Hoàn), Q60 (Thú Niệm), Q61 (đổi tên).
- Epic GitHub: xem dòng "Đấu La Tu Tiên" ở `ROADMAP.md`.
- Nguồn tham khảo (đọc, không chép code): `D:/METAGRIT/van-gioi-tien-do/docs` (`00-ho-so-tong-hop.md`, `01-gdd.md` mục 3–8 và 11, `07-cong-thuc-data-schema.md`, `11-he-phai-ky-nang.md`).
