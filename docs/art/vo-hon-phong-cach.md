# Mỹ thuật: phong cách võ hồn v2 (bá đạo, ngầu, tu tiên; #1032, epic #1020)

### 5.11 Mỹ thuật: đồ họa isometric, hồn sư, võ hồn, hồn thú

Chuẩn phong cách **chung** cho mọi hình võ hồn làm lại (chủ repo chốt 2026-10-27: vẽ lại toàn bộ assets võ hồn vì bản cũ quá xấu; muốn **bá đạo, ngầu, đậm chất tu tiên**). Mọi prompt gửi tthoadev (ChatGPT / Codex) và mọi bộ hình v2 dùng đúng một định hướng ở đây. Tài liệu chỉ nói về hình; luật chơi và số cân bằng không đổi (`shared/data.ts`: `VOHON`, `TIERS`, `HAO_QUANG`).

**Trạng thái: ĐỀ XUẤT, chờ chủ repo duyệt.** Mục 4 (bảng thiết kế) và mục 6 (khối prompt) chưa được vẽ trên nền nào cho tới khi chủ repo chốt; tthoadev có thể góp ý trước. Ảnh cũ (phụ thể, pháp tướng PixelLab, chân dung, icon) **chỉ để tham khảo ý**, không dùng làm ảnh nguồn / ảnh dẫn cho bản v2.

## 1. Phạm vi "assets võ hồn v2"

| Loại hình | Nơi dùng | Khung | Tài liệu cách làm |
|---|---|---|---|
| Phụ thể (hoạt ảnh 5 hướng) | Đeo sau / trước hồn sư khi đi, đánh | 96×96 gốc (48, 74); khung 128 thử cho vật lớn (#1020) | phu-the-hoat-anh.md (đặc tả P0, PR #1028, chưa merge), `nhan-vat-hon-thu.md` |
| Pháp tướng Võ Hồn Chân Thân | Hư ảnh khổng lồ sau lưng khi Chân Thân (`pt_<mã>`) | 160×160 | `phap-tuong.md`, `phap-tuong-cong-thuc.md` |
| Chân dung + thẻ võ hồn | Giao diện HTML (`cards.ts`) | 64×64 (tối đa `PORTRAIT_MAX_COLORS` màu) / thẻ 96×152 | `nhan-vat-hon-thu.md` "Chân dung và thẻ võ hồn", `ui-kit.md` |
| Icon võ hồn | Menu, đội hình, kho | 24×24 / 32×32 | `nhan-vat-hon-thu.md` (biểu tượng) |

Giữ nguyên, chỉ chỉnh màu / độ sáng cho khớp nếu cần: vòng hồn hoàn, hiệu ứng hồn kỹ. Một võ hồn phải **đọc ra là cùng một thực thể** ở cả bốn loại hình: cùng silhouette gốc, cùng bảng màu, cùng motif, cùng vật đi kèm (mục 4).

## 2. Định hướng: bá đạo, uy áp, ngầu, tu tiên

**Một câu:** võ hồn không phải thú cưng hay vũ khí đẹp, mà là **một hung vật / thần khí đang đè cả khoảng trời** lên vai người cầm; khí thế như "đạp trời, nghịch thiên".

**Hình ảnh nhận diện** (mỗi võ hồn chọn tối thiểu **hai** thứ phù hợp, không nhồi cả mười):
- **Linh khí cuộn:** dải khí nhiều lớp quấn thân võ hồn, cuộn ngược chiều gió, đầu dải tan thành hạt.
- **Đạo văn / phù triện:** nét chữ cổ, ấn triện, vân bùa chạy dọc thân kiếm, vảy, cánh, thân đỉnh; không phải chữ đọc được (xem điều cấm).
- **Pháp trận:** vòng trận nhiều lớp (bát quái, tinh đồ, vòng chữ) dựng dưới / sau võ hồn, chỉ vẽ nét mảnh, phần phát sáng để code.
- **Mây sấm, sét, trời nứt:** mây đen cuộn quanh đỉnh, sét xanh / tím / vàng; đất nứt dưới chân.
- **Kim quang / hào quang đạo:** vầng sáng sau đầu / sau lưng, tia sáng ngắn, một điểm sáng gắt ở lõi.
- **Hư ảnh khổng lồ sau lưng:** thân võ hồn lớn gấp 1,5–3 lần hồn sư, nửa trong suốt; người nhỏ, võ hồn lớn, tạo cảm giác bị đè.
- **Khí tức:** thứ không vẽ được thành vật: nền xung quanh méo, lá / bụi bị hút về, ánh sáng nền tối đi (phần này **làm bằng code**, phần 3.4).

**Điều cấm (mọi loại hình, mọi võ hồn):**
- Dễ thương, chibi, mắt to tròn long lanh, đầu to thân nhỏ, má hồng, nụ cười ngây thơ.
- Hoạt hình trẻ con, kiểu hoạt hình buổi sáng, linh vật quảng cáo, nhãn dán, emoji.
- Đồ chơi, nhựa bóng, mô hình figure, bề mặt cao su bóng loáng, đường nét tròn mềm như bong bóng.
- **Màu nhạt, phấn, pastel, kẹo**, màu bão hòa đều khắp thân (không có vùng tối); gradient cầu vồng.
- Vũ khí trơn như đồ nhựa: một mảng màu phẳng, không vân, không mẻ, không khắc văn, không phản sáng.
- Kiểu game di động đại trà: lấp lánh sao ngũ giác, cầu vồng, trái tim, bóng nước.
- Chữ đọc được trong hình (tên, logo, watermark); khung / viền thẻ vẽ trong ảnh (khung do giao diện).
- Tư thế đứng chào, vẫy tay, nhún nhảy; võ hồn nhìn thẳng ra người xem với vẻ hiền (chỉ pháp tướng hướng `s` được nhìn thẳng, và phải **hung / lạnh**, không hiền).
- Lấy nhân vật truyện làm hình vẽ (chân dung vẽ chính võ hồn, không vẽ chủ nhân; `docs/design/00-tong-quan.md`).

**Giữ nhận diện gốc:** dáng, tên, vật đặc trưng của từng võ hồn vẫn theo nguyên tác (bảng mục 4); bá đạo hóa là **tăng uy áp và chất liệu**, không đổi một con thú thành con khác.

## 3. Dịch sang pixel isometric hiện có

Khuôn khổ không đổi: thủy mặc trầm, viền ngoài `#1a1020` (không khử răng cưa), mỗi vùng màu **3 sắc độ** (tối, gốc, sáng; sắc thứ 4 chỉ cho kim loại và phát sáng), ánh sáng vẽ sẵn **từ trên bên trái**, bảng màu chung + `col` / `robe` của võ hồn (`art/palette.gpl`; `quy-cach-isometric.md` "Bảng màu", "Quy tắc vẽ").

### 3.1 Silhouette (đọc được ở cỡ nhỏ trước, đẹp sau)
- **To, góc cạnh, bất đối xứng:** hình ngoài dùng góc nhọn, cạnh gãy, gai, sừng, cánh rách; tránh tròn đều hay đối xứng gương hoàn hảo. Lệch một bên vai / một bên cánh nặng hơn, đuôi / dải khí kéo chéo.
- **Võ hồn lớn hơn thân:** phụ thể chiếm **ít nhất khoảng 1,3 lần** chiều cao hồn sư khi vật đứng được, hoặc tràn khỏi hai bên vai; pháp tướng 1,5–3 lần. Phụ thể không được nhỏ hơn đầu hồn sư.
- **Một khối chính + một chi tiết ngoại biên:** thân (sừng, cánh, mũi nhọn) quyết định hình; chi tiết nhỏ (đạo văn, gai phụ) không được làm nát hình ngoài khi thu nhỏ còn 32×32 (kiểm bằng cách thu nhỏ: hình vẫn nhận ra).
- **Không che hồn sư:** phụ thể nửa sau / nửa trước và pháp tướng giữ quy tắc lớp ở `nhan-vat-hon-thu.md` và `phap-tuong.md`; phần trọng điểm (đầu thú, mũi kiếm, đầu búa) đặt **ngoài** vùng đầu / thân hồn sư.
- Hướng nghiêng luôn **nhìn sang phải**; hướng `s` và `n` giữ cùng khối, đổi cách nhìn (lưng, đỉnh đầu), không vẽ lại thành con khác.

### 3.2 Độ tương phản và ánh sáng
- Mỗi võ hồn có **một vùng tối sâu thật** (gần `robe` tối, sát `#1a1020`) cạnh **một điểm sáng gắt** (sắc sáng nhất của `col`), tránh mọi vùng cùng độ sáng trung bình. Mục tiêu: nhìn mờ vẫn thấy hình.
- Nền game trầm, nên phụ thể **không tối hơn nền**: võ hồn tối (Hạo Thiên Chùy, Tử Vong Chu Hoàng, Quỷ Mị, U Minh Linh Miêu) bắt buộc có **viền sáng 1 pixel** hoặc rìa khí sáng đúng `col` (như luật ở `quy-cach-isometric.md` "Độ tương phản").
- Sáng từ trên bên trái: mặt trên / trái sáng (sắc sáng), dưới / phải tối (sắc tối); ngoại lệ **nguồn tự phát sáng** (mắt, lõi, mũi kiếm, hạt sét) vẽ sắc 4 và không theo hướng sáng.
- **Nền tối, tương phản cao, bão hòa vừa:** thân dùng màu trầm đậm (đỏ thẫm, lam đậm, tím than, xám sắt); màu rực (`col` sáng, kim quang) dành cho **vài điểm nhấn** (mắt, lõi, mép sắc, vân đạo văn), không phủ cả thân.
- Chất liệu thể hiện bằng vân, không bằng độ bóng: vảy nhiều mảnh gãy sáng, kim loại có mẻ + một vệt sáng, ngọc có lõi đục, lửa có lõi vàng trắng và rìa đỏ thẫm.

### 3.3 Màu: quy tắc dùng `col` / `robe`
- `robe` = **sắc tối / khối thân**; `col` = **sắc nhấn sáng / phát sáng**; thêm tối đa **1 sắc tối thêm, 1 sắc sáng thêm** suy ra (quy tắc `quy-cach-isometric.md`), cộng **một màu nhấn đối lập** ghi ở bảng mục 4 (chỉ ở điểm nhỏ, ≤ 10% diện tích).
- Chân dung ≤ `PORTRAIT_MAX_COLORS`; pháp tướng ≤ 48 màu (như bản cũ); phụ thể theo bảng riêng của sheet.
- **Cấm** màu `col` làm nền phẳng cả thân khi `col` quá nhạt (ví dụ Nhu Cốt Thố hồng phấn, Yêu Hồ hồng, Bạch Hổ trắng): với các võ hồn đó, `robe` và một sắc sẫm hơn là khối thân, `col` chỉ là ánh / viền / mắt (bảng mục 4 đã ghi từng con).

### 3.4 Phần nào vẽ ảnh, phần nào để code
Để không phá bảng màu và để mức Thấp / Giảm chuyển động vẫn đẹp (cùng nguyên tắc `phap-tuong.md` mục 3, `hieu-nang-hieu-ung.md`):

| Vẽ vào ảnh (nướng sẵn) | Do code phát (client, có thể tắt theo mức hiệu ứng) |
|---|---|
| Silhouette, khối, viền `#1a1020`, 3 sắc độ, đạo văn **mảnh dạng nét** trên thân, vết nứt, mẻ, vảy | Glow cộng màu (`col`) quanh lõi, mắt, mũi sắc; **nhịp thở** của sáng |
| Dải linh khí **đứng yên** gắn thân (đuôi áo khí, gai khí) | Linh khí cuộn chuyển động, hạt khí bay lên, tàn lửa / mảnh băng / lông vũ |
| Chi tiết pháp trận **nét mảnh** nếu vật thể là pháp khí | Vòng pháp trận xoay dưới chân / sau lưng (nét mỏng, cộng sáng) |
| Điểm sáng gắt ở lõi (1–3 pixel sắc 4) | Quầng sáng, tia kim quang, **méo nền khí tức**, rung nhẹ |
| (không vẽ) | Sét nhảy giữa hai điểm, mây sấm trên đỉnh (lớp riêng, mờ ≤ 50%) |

Quy tắc: **ảnh vẽ thật không chứa quầng mờ, gradient, bóng đổ mềm, hạt nhiễu**; mọi cái mềm do code cộng lên. Mọi glow dùng màu đã có trong bảng (`col`, `glow` của `TIERS`), không thêm màu lạ.

### 3.5 Quy tắc theo loại hình
- **Phụ thể:** 5 hướng, giữ khối chính ổn định giữa các khung (không "chảy"), chuyển động theo họ động tác (vung, đâm, vỗ cánh, cuộn); vật đi kèm (mục 4) đi cùng phụ thể trong sheet.
- **Pháp tướng:** là **cùng một võ hồn ở dạng phóng đại**; nét thô hơn, to hơn, nhiều lớp khí hơn phụ thể (mục 5), nhưng cùng silhouette và cùng vật đi kèm. Lớp sau / trước và độ mờ theo `phap-tuong.md` mục 2.
- **Chân dung / thẻ:** cận cảnh phần **trọng điểm** của võ hồn (đầu thú, mũi kiếm, miệng đỉnh), nền tối có quầng `col`, **nhìn vào người xem như đang đối đầu** (đủ uy, không hiền); nền chân dung không vẽ khung. Khung thẻ lưu ly do giao diện (`ui-kit.md`).
- **Icon:** một dấu hiệu duy nhất đọc được ở 24×24: một **hình ngoài** + **một điểm sáng**. Không chữ, không vẽ cả hình thú nhỏ lại.

## 4. Bảng thiết kế mới cho từng võ hồn (25)

Mỗi dòng: **bá đạo ở đâu** (ý tưởng một câu), **hình mẫu** (hình khối gốc), **bảng màu** (thân = `robe`, nhấn = `col`, thêm màu đối lập), **motif tu tiên**, **vật đi kèm** (vẽ cùng sheet; chân dung / icon lấy lại). Màu chủ đạo gọi theo `robe` / `col` trong `VOHON`; chỉ ghi mã màu cho màu nhấn **thêm**. Hệ và hồn kỹ lấy từ `shared/data.ts`.

### 4.1 Cường công

**1. Cửu Tinh Thất Sát Kiếm** (`cuu_tinh_that_sat_kiem`)
- **Bá đạo ở đâu:** một thanh kiếm dài hơn cả chủ nhân, treo ngược mũi xuống như sắp **chém đôi trời đất**; bảy sao là bảy nhát đã sẵn sàng.
- **Hình mẫu:** kiếm bản rộng, sống kiếm có khuyết gãy kiểu cổ kiếm; chuôi dài hai tay; bảy sao thành một dải chéo (bố cục Bắc Đẩu).
- **Màu:** thân thép xanh đậm theo `robe`; lưỡi sáng bạc xanh theo `col`; nhấn bạch kim + một điểm đỏ sẫm ở chuôi.
- **Motif:** đạo văn chạy dọc sống kiếm, bảy sao nối nhau bằng nét khí mảnh, vòng kiếm trận mờ dưới chân (code).
- **Vật đi kèm:** bảy điểm sao (cũng là điểm sáng của icon); kiếm khí cắt (vệt sáng) là code.

**2. Lam Điện Bá Vương Long** (`lam_dien_ba_vuong_long`)
- **Bá đạo ở đâu:** **Bá Vương** đúng nghĩa: rồng sét ngẩng đầu **trên cả mây sấm**, không cúi nhìn người; sừng kéo sét xuống như triệu thiên lôi.
- **Hình mẫu:** thân rồng dài cuộn chữ S, đầu to, sừng chẻ nhánh, bờm sét dựng, móng vuốt xòe.
- **Màu:** thân lam đậm theo `robe`, vảy sáng lam theo `col`; nhấn trắng điện + tím sét.
- **Motif:** mây sấm đen quanh đầu, sét giáng xuống thân, vảy như khắc đạo văn lôi.
- **Vật đi kèm:** viên lôi châu / quầng sét trên sừng; sét nhảy là code.

**3. Kỳ Nhung Thông Thiên Cúc** (`ky_nhung_thong_thien_cuc`)
- **Bá đạo ở đâu:** không phải một đóa hoa đẹp mà là **Đại Đạo Kim Hoa**: cánh dài như dao, nở thành vầng đạo quang sau lưng, đâm thẳng lên trời.
- **Hình mẫu:** hoa cúc cánh dài nhọn, nhiều lớp so le như lưỡi kiếm, gốc là rễ đen xoắn.
- **Màu:** lớp cánh ngoài cam đất theo `robe`; ánh cánh theo `col`; nhấn vàng kim chói ở nhụy + đỏ sẫm giữa các lớp.
- **Motif:** vầng hào quang kim quang sau lưng, đạo văn vòng quanh nhụy, cánh rụng thành lưỡi khí.
- **Vật đi kèm:** nhụy sáng như đạo quả, vài cánh rời bay như phi đao.

**4. Tà Hỏa Phượng Hoàng** (`ta_hoa_phuong_hoang`)
- **Bá đạo ở đâu:** **Tà** hỏa: không phải chim lửa đẹp mà là hung điểu có mắt lạnh, **cánh xòe che nửa trời** như muốn thiêu cả thiên hạ.
- **Hình mẫu:** cánh xòe rộng bất đối xứng (một cánh cao hơn), lông cánh là các lưỡi lửa nhọn, đuôi dài rách, mỏ như móc câu.
- **Màu:** thân đỏ thẫm theo `robe` (lõi tối gần đen ở ngực), lửa cam theo `col`; nhấn vàng trắng ở lõi + tím than rất ít ở rìa khói (chất "tà").
- **Motif:** vệt lửa chảy thành đạo văn dọc cánh, vòng liệt hỏa thành trận dưới chân.
- **Vật đi kèm:** lông lửa rời bay ra; tàn tro bay lên (code).
- *Demo bộ đầy đủ của #1024 dùng võ hồn này.*

**19. Hạo Thiên Chùy** (`hao_thien_chuy`)
- **Bá đạo ở đâu:** búa **trấn thiên hạ**: đầu búa to bằng cả thân người, nặng đến mức đất dưới nó nứt; không cần ra đòn, chỉ vác lên vai đã đủ áp.
- **Hình mẫu:** đầu búa vuông khối, mặt búa có mẻ, cán dài, kết cấu thô chắc; đầu búa chếch cao hơn đầu hồn sư.
- **Màu:** đen sắt theo `robe`, ánh thép xám lạnh theo `col`; nhấn một vệt vàng cũ ở đai cán + nứt sáng cam đỏ rất ít (bắt buộc viền sáng, phần 3.2).
- **Motif:** vân đạo văn chìm khắc quanh đầu búa, đất nứt hình tia dưới chân (lớp nền, code thêm bụi).
- **Vật đi kèm:** mảnh đá vỡ bay lên; dây đai / xích quấn cán.

**21. Phá Hồn Thương** (`pha_hon_thuong`)
- **Bá đạo ở đâu:** mũi thương **xuyên phá cả hồn phách**: dài, thẳng, lạnh; chỉ một đường đâm là đủ.
- **Hình mẫu:** cán dài, mũi thoi hẹp có rãnh, hai tua đỏ; dựng chếch sau lưng cao hơn đầu một đoạn.
- **Màu:** xanh ngọc tối theo `robe`, lưỡi xanh ngọc sáng theo `col`; nhấn đỏ tươi ở tua + trắng ở mũi nhọn.
- **Motif:** khắc đạo văn phá hồn dọc cán, vệt hồn quang kéo dài sau mũi (code), tầng hồn quang chồng lên khi đâm.
- **Vật đi kèm:** hai tua đỏ phất theo gió.

**25. Bạch Hổ** (`bach_ho`)
- **Bá đạo ở đâu:** **Bạch Hổ chúa sơn lâm**: ngồi uy nghi như thần thú giữ cõi Tây, mắt vàng nhìn xuống người, một tiếng gầm cả vùng im.
- **Hình mẫu:** hổ ngồi, ngực nở, vai gồ, đầu hổ cao hơn hồn sư, vằn đen dày, vuốt lộ.
- **Màu:** thân xám lạnh theo `robe` (không dùng trắng phẳng; `col` chỉ là lông sáng ở mặt, ngực), vằn đen `#1a1020`; nhấn mắt vàng kim.
- **Motif:** vằn có dạng đạo văn Tây phương Kim, khí trắng lạnh cuộn quanh chân, vòng trận hình sao Bạch Hổ.
- **Vật đi kèm:** bốn vuốt phát sáng khi đánh (code); khí lạnh.

### 4.2 Mẫn công

**5. U Minh Linh Miêu** (`u_minh_linh_mieu`)
- **Bá đạo ở đâu:** **bóng báo của U Minh**: rình rập, mắt tím sáng giữa bóng tối; không "mèo", là một **sát thủ vô thanh** to hơn người.
- **Hình mẫu:** báo thấp, vai nhô, lưng cong như lò xo, đuôi dài rủ, vuốt dài; hình bóng gần như đen.
- **Màu:** tím than gần đen theo `robe`, viền sáng tím theo `col` (bắt buộc); nhấn mắt tím chói + một vệt hồng sẫm ở móng.
- **Motif:** khí u minh tan thành khói tím từ thân; vết cào để lại đạo văn tím; nửa thân hóa khói.
- **Vật đi kèm:** đuôi khói tan ra; hai vệt vuốt sáng (code).

**6. Nguyệt Nhận** (`nguyet_nhan`)
- **Bá đạo ở đâu:** **huyết nguyệt đoạt mệnh**: vầng trăng không dịu dàng mà là hai lưỡi liềm sắc đang quay quanh, lạnh như chuẩn bị cắt cổ.
- **Hình mẫu:** liềm trăng dựng đứng, hai đầu nhọn kéo dài, mặt trong có răng cưa; tách hai lưỡi khi đánh.
- **Màu:** thép tối xám tím theo `robe`, mép sáng bạc theo `col`; nhấn đỏ máu ở viền trong lưỡi (chất "huyết nguyệt").
- **Motif:** vành trăng khắc phù triện, vòng trận trăng non dưới chân (code), tia sáng bạc cạnh lưỡi.
- **Vật đi kèm:** vài mảnh trăng nhỏ bay quanh như phi đao.

**7. Hỏa Long** (`hoa_long`)
- **Bá đạo ở đâu:** **Viêm Long**: rồng hơi thở là lửa, mỗi vảy như than hồng; đầu rồng chồm qua vai như muốn nuốt người trước mặt.
- **Hình mẫu:** thân rồng quấn vai, đầu to nhiều gai, sừng cong, miệng há, vảy nhọn ngược.
- **Màu:** đỏ thẫm theo `robe`, lửa đỏ cam theo `col`; nhấn vàng trắng ở lõi miệng + khói đen rìa.
- **Motif:** vảy nứt lộ lõi lửa, đạo văn hỏa quanh sừng, vòng liệt hỏa trận.
- **Vật đi kèm:** hạt lửa nổ lách tách (code); hòn viêm châu ở miệng.

**8. Nhu Cốt Thố** (`nhu_cot_tho`)
- **Bá đạo ở đâu:** **Thỏ nhưng là hung thú**: tai dài như roi sắt, chân sau đạp ra nứt đất, mắt đỏ; cái "mềm" là cái bẫy, đòn mới là uy. (Vật cực dễ rơi vào cấm "dễ thương": phải kiểm kỹ.)
- **Hình mẫu:** thỏ cao ngồi chồm, tai dài dựng như hai lưỡi dao, cơ chân sau lớn, vuốt nhọn; **không** mặt tròn, không mắt to.
- **Màu:** khối thân tím hồng sẫm theo `robe` (không dùng `col` hồng phấn làm mảng thân), `col` chỉ ở lông sáng, viền tai; nhấn đỏ máu ở mắt + trắng ngà ở răng.
- **Motif:** vệt khí đạp, đạo văn quanh chân sau (Bát Đoạn Suất), tai bọc khí quấn như roi.
- **Vật đi kèm:** hai dải khí nơi tai; bụi đá khi đạp.

**9. Kim Vũ Miêu Ưng** (`kim_vu_mieu_ung`)
- **Bá đạo ở đâu:** **cú mèo sấm vàng**: cánh quét như dao, mắt dọc sáng, mỗi lông vũ là một tia sét chờ giáng.
- **Hình mẫu:** ưng cánh xòe rộng, mặt có tai lông vểnh, mắt tròn nhưng **dọc, lạnh**; vuốt to.
- **Màu:** nâu vàng sẫm theo `robe`, lông vàng kim theo `col`; nhấn trắng sét + đen ở đầu cánh.
- **Motif:** lông vũ mép cánh khắc đạo văn lôi, mây sấm vàng sau lưng, vòng sét.
- **Vật đi kèm:** lông vũ sét rụng; điểm sét ở mép cánh (code).

**23. Liệt Hỏa Thương Lang** (`liet_hoa_thuong_lang`)
- **Bá đạo ở đâu:** **sói đầu đàn lửa**: gầm thành tiếng tru như triệu cả bầy; thân xám, bờm và đuôi cháy như vừa từ lửa chui ra.
- **Hình mẫu:** sói đứng thấp, vai cao, hàm lộ nanh, bờm gai, đuôi lớn chóp lửa, vuốt lửa.
- **Màu:** xám nâu than theo `robe`, lửa cam theo `col`; nhấn vàng ở mắt + đỏ sẫm ở vết rách lông.
- **Motif:** vết nứt lửa như đạo văn dọc xương sườn, tiếng tru thành vòng sóng sáng (code), vòng liệt hỏa trận.
- **Vật đi kèm:** tàn lửa theo đuôi; hai vệt vuốt lửa.

### 4.3 Khống chế

**10. Tử Vong Chu Hoàng** (`tu_vong_chu_hoang`)
- **Bá đạo ở đâu:** **vua nhện của cái chết**: tám chân dài dựng như tám mũi thương, mắt tím sáng, giăng thiên la địa võng; ai vào là chết.
- **Hình mẫu:** nhện lớn bám chéo sau lưng, mình tròn, tám chân nhọn khớp gấp, một cặp chân trước đâm tới, mạng tơ mờ.
- **Màu:** tím đen theo `robe` (bắt buộc viền sáng tím), tơ / mắt theo `col`; nhấn trắng bệch ở khớp chân + đỏ rất ít ở đồ án sọ trên lưng.
- **Motif:** đồ án mặt quỷ / sọ trên lưng nhện thành đạo văn tử vong, trận mạng nhện hình bát quái, tơ có bùa.
- **Vật đi kèm:** mạng tơ; tơ độc bắn ra (code).

**11. Bích Lân Xà Hoàng** (`bich_lan_xa_hoang`)
- **Bá đạo ở đâu:** **Độc Hoàng**: rắn ngóc đầu ngang tầm trời, độc khí xanh lục lan thành cả vùng, mắt lân quang nhìn là thấy lạnh sống lưng.
- **Hình mẫu:** thân rắn cuộn nhiều vòng sau lưng, đầu có mào / sừng, nanh dài, vảy như lá ngọc.
- **Màu:** lục thẫm theo `robe`, lân quang xanh ngọc theo `col`; nhấn vàng chanh ở mắt + tím đen ở hố nanh.
- **Motif:** vảy khắc đạo văn độc, vòng độc trận, khí độc cuộn thành ấn.
- **Vật đi kèm:** giọt độc lân quang, lưỡi rắn; sương độc (code).

**12. Càn Khôn Hỗn Nguyên Tỏa** (`can_khon_hon_nguyen_toa`)
- **Bá đạo ở đâu:** **khóa cả trời đất**: bánh xe xích vàng và phù văn lớn như một pháp khí nhốt thiên hạ.
- **Hình mẫu:** vòng tròn nhiều lớp (như bánh xe pháp khí) với ổ khóa trung tâm, xích dài rủ, móc nhọn.
- **Màu:** vàng đồng tối theo `robe`, vàng sáng theo `col`; nhấn đen sắt ở mắt xích + đỏ son ở ấn khóa.
- **Motif:** bát quái, vòng chữ cổ, ấn triện khắc trên ổ khóa; pháp trận xoay (code).
- **Vật đi kèm:** xích, ổ khóa; xích bắn ra khi đánh.

**13. Hỏa Ảnh** (`hoa_anh`)
- **Bá đạo ở đâu:** **bóng lửa người khổng lồ đứng sau lưng như hộ pháp ma**: vai rộng, hai tay bọc lửa, không mặt rõ, chỉ hai mắt.
- **Hình mẫu:** bóng người to vai rộng, đầu có sừng lửa, tay dài, thân dưới tan thành khói.
- **Màu:** đỏ thẫm gần đen theo `robe`, lửa đỏ tươi theo `col`; nhấn vàng ở mắt + tím than ở khói.
- **Motif:** vân đạo văn nung đỏ trên ngực, ấn lửa ở lòng bàn tay, bóng đổ dài.
- **Vật đi kèm:** hai nắm lửa; khói tan (code).

**14. Yêu Hồ** (`yeu_ho`)
- **Bá đạo ở đâu:** **yêu mà không mềm**: hồ ly ba đuôi như ba lưỡi quạt sắc; cái mị đi kèm cái lạnh, nhìn xuống người như nhìn con mồi.
- **Hình mẫu:** hồ ly ngồi, ngực ưỡn, đầu nghiêng, ba đuôi xòe nhọn kiểu quạt, tai nhọn, mắt xếch.
- **Màu:** tím hồng sẫm theo `robe`, ánh hồng theo `col` chỉ ở viền lông / mắt; nhấn vàng tối ở mắt + đỏ son ở nốt ruồi / ấn trán.
- **Motif:** ấn vết hồ trên trán, hỏa hồ ảo ảnh, trận lục mang tinh (vẽ nét mảnh).
- **Vật đi kèm:** ba đuôi; vài đốm sáng hình giọt (code), tuyệt đối không đốm sao trái tim.

**18. Lam Ngân Thảo** (`lam_ngan_thao`)
- **Bá đạo ở đâu:** **cỏ hạng bét thành đại thụ nghịch thiên**: dây cỏ xanh lam xoắn như rồng, trói cả vùng; "phế vật" nhưng đè mọi thứ.
- **Hình mẫu:** thân cỏ to xoắn như dây thừng, nhiều dây dài tỏa quất, ngọn nhọn như mũi giáo.
- **Màu:** lam thẫm theo `robe`, lam sáng theo `col`; nhấn xanh lục đen ở thân + trắng ở ngọn dây.
- **Motif:** vân đạo văn xoắn chạy theo dây, vòng pháp trận cỏ, rễ bám nứt đất.
- **Vật đi kèm:** dây cỏ quấn; hạt sáng lam bay lên (code).

**24. Băng Phượng Hoàng** (`bang_phuong_hoang`)
- **Bá đạo ở đâu:** **băng giá tuyệt đối**: cánh là tinh thể sắc như dao, chim bay qua là sương đông cứng cả vùng.
- **Hình mẫu:** phượng xòe cánh như tinh thể, mào băng nhọn, đuôi dài như dải băng đóng cứng.
- **Màu:** lam thẫm theo `robe`, lam băng sáng theo `col`; nhấn trắng tinh thể + một điểm tím ở lõi (khác Tà Hỏa, tránh trùng bảng màu).
- **Motif:** vết nứt băng như đạo văn, vòng trận hoa tuyết (nét mảnh), sương lạnh.
- **Vật đi kèm:** mảnh băng rụng; sương đông (code).

### 4.4 Phụ trợ

**15. Xúc Xích** (`xuc_xich`)
- **Bá đạo ở đâu:** **Thánh Quang Hương Tràng**: bản đặc tả cũ giữ chất hài (xúc xích nướng); bản v2 **bá đạo hóa thành pháp bảo**: một cây "đại hương tràng" khổng lồ nứt vỏ, tỏa kim quang như thần khí, hài chỉ còn là chi tiết tinh tế (vỏ nứt nướng, hơi nóng). **Cần chủ repo duyệt riêng con này.**
- **Hình mẫu:** trụ dài chếch như một cây trượng / lệnh, đầu bo nhưng có gờ, vỏ nứt, có khắc đai.
- **Màu:** nâu cam đậm theo `robe`, ánh nướng cam theo `col`; nhấn vàng kim ở vết nứt + đỏ thẫm ở đai.
- **Motif:** kim quang thánh khí từ vết nứt, vòng ấn hương, hơi nóng thành khí cuộn.
- **Vật đi kèm:** vài hương tràng nhỏ bay quanh như pháp bảo; hơi bốc (code).

**16. Quỷ Mị** (`quy_mi`)
- **Bá đạo ở đâu:** **quỷ đế vô hình**: bóng quỷ lơ lửng không chân, hai tay dài như bóng đêm, mặt mờ chỉ có hai khe sáng; ai nhìn vào cũng thấy lạnh.
- **Hình mẫu:** bóng người dài, đầu có sừng, hai tay vuốt dài, thân dưới tan khói.
- **Màu:** tím lam đậm theo `robe` (bắt buộc viền sáng), khí theo `col`; nhấn trắng lam ở mắt + đen ở miệng.
- **Motif:** mặt nạ quỷ khắc phù, khí u minh cuộn nhiều lớp, ấn quỷ ở ngực.
- **Vật đi kèm:** khói quỷ; vài bóng quỷ nhỏ (không phải hình trẻ con).

**17. Thiên Càn Bạch Ngọc Đỉnh** (`thien_can_bach_ngoc_dinh`)
- **Bá đạo ở đâu:** **đỉnh trấn thiên**: một chiếc đỉnh ngọc cổ ba chân to như ngọn núi nhỏ, bên trong có linh hỏa nấu cả vận mệnh.
- **Hình mẫu:** đỉnh ba chân, hai quai, thân khắc hoa văn, nắp có núm, khói bốc.
- **Màu:** ngọc ngà vàng sẫm theo `robe`, ngọc sáng theo `col`; nhấn xanh ngọc đậm ở khắc + vàng kim ở quai.
- **Motif:** hoa văn thao thiết, vòng bát quái, khí ngọc cuộn.
- **Vật đi kèm:** khói ngọc, ngọn linh hỏa trong miệng đỉnh (code).

**20. Cửu Bảo Lưu Ly Tháp** (`cuu_bao_luu_ly_thap`)
- **Bá đạo ở đâu:** **tháp chín tầng chống trời**: chín tầng, mỗi tầng một sắc bảo quang, dựng đứng sau lưng như ngọn núi phật quang.
- **Hình mẫu:** tháp chín tầng mái cong nhọn, tầng thu nhỏ dần, nóc nhọn; to gấp ba hồn sư khi là pháp tướng.
- **Màu:** lam ngọc tối theo `robe`, lưu ly sáng theo `col`; nhấn **bảy sắc lưu ly** ở mái từng tầng (đây là chỗ duy nhất được nhiều màu, mỗi sắc ≤ 3 sắc độ) + vàng kim ở chóp.
- **Motif:** bảo quang tầng tầng, kinh văn cổ khắc, vòng pháp luân nhiều lớp (nét mảnh).
- **Vật đi kèm:** chuông gió ở mái; tia bảy sắc (code).

**22. A Ngân** (`a_ngan`)
- **Bá đạo ở đâu:** **Lam Ngân Hoàng mười vạn năm**: không phải hoa đẹp, là **đại thụ cổ thần**: rễ bám trời đất, hoa vàng xanh nở trên ngọn như vương miện, sinh sinh bất tức.
- **Hình mẫu:** thân cỏ to cổ xoắn, đóa hoa lớn đài cổ, dây vàng rủ, vòng cỏ như vương miện.
- **Màu:** lam xanh tối theo `robe`, lam sáng theo `col`; nhấn vàng kim ở hoa + trắng ở nhụy.
- **Motif:** vân cổ thụ như đạo văn, vòng trận sinh mệnh, kim quang từ nhụy.
- **Vật đi kèm:** dây vàng; hạt sáng xanh vàng (code, không sao / trái tim).

## 5. Thang uy lực theo niên hạn / bậc hồn hoàn

Cùng một võ hồn, **hồn hoàn thấp bậc ít hào quang, cao bậc nhiều lớp khí**. Quy tắc thị giác (không đổi số cân bằng, không đổi luật):

- **Bậc** = bậc niên hạn của hồn hoàn **cao nhất đang có** (chỉ số trong `TIERS`; Trắng → Vàng → Tím → Đen → Đỏ). Quầng dưới chân và màu vòng theo `TIERS[bậc].col` / `glow` như hiện nay (không chép mã màu vào đây).
- **Ảnh vẽ thật chỉ một bộ** (bản "chuẩn", uy áp đầy đủ nhưng chưa phóng đại). Thang uy lực làm chủ yếu **bằng code**: số lớp khí, độ lan của glow, mật độ hạt, độ lớn quầng pháp trận, độ đậm điểm sáng. Không vẽ 5 bộ ảnh cho 5 bậc.

| Bậc (`TIERS`) | Linh khí | Điểm sáng / glow | Pháp trận, mây, sét | Thêm vào hình |
|---|---|---|---|---|
| 0 (Trắng) | Một lớp mỏng sát thân | Lõi nhỏ, nhịp chậm | Không | Không |
| 1 (Vàng) | Một lớp, gợn chậm | Lõi rõ hơn | Không | Vài hạt |
| 2 (Tím) | Hai lớp | Lõi + rìa sáng | Vòng trận nét mảnh dưới chân, mờ | Hạt đều |
| 3 (Đen) | Ba lớp, cuộn ngược chiều gió | Lõi sáng gắt + glow rộng | Trận rõ, mây / sét ngắn nếu hợp võ hồn | Đạo văn sáng lên theo nhịp |
| 4 (Đỏ) | Bốn lớp, đầu dải tan hạt | Lõi chói + glow lan, kim quang | Trận nhiều vòng, mây sấm / trời nứt | Hư ảnh phóng thêm + méo nền khí tức |

- Quy tắc **chuyển bậc mượt:** lên bậc thêm một lớp, không đổi hình khối; hạ bậc bớt lớp.
- **Giới hạn:** vẫn trong `HAO_QUANG`, `lighting.ts` (tổng ánh sáng có trần, tối đa nguồn sáng cùng lúc); mức Thấp / Giảm chuyển động rơi về bậc 0–1 bất kể bậc thật; người khác thấy bản nhẹ hơn như quầng hào quang (`PT_OTHERS_K`).
- Ghi chú cho thiết kế: nếu chủ repo muốn **hai biến thể ảnh vẽ** (thường / cao bậc, ví dụ thêm sừng, cánh phụ) thì mở thành việc riêng; mặc định một bộ ảnh.

## 6. Khối prompt phong cách (tiếng Anh) dùng chung cho Codex / ChatGPT

Chèn nguyên khối vào đầu mọi prompt (kể cả `phuthe-sheet-prompt`, #1022), rồi nối mô tả riêng từng võ hồn lấy từ mục 4 (silhouette, màu, motif, vật đi kèm). **Không** đưa ảnh cũ vào làm ảnh dẫn.

```
STYLE (apply to every image):
Dark-xianxia pixel art, isometric RPG, overbearing and dominant "heaven-defying" presence.
The spirit (martial soul) is a colossal, menacing power towering behind or beside a small figure.
Angular, jagged, ASYMMETRIC silhouette; large readable shape that stays recognizable when shrunk to 32x32.
Muted dark-ink (shuimo) palette: deep shadow regions, desaturated dark base colors, and only a FEW small
high-contrast glowing accents (eyes, core, blade edge, talisman lines). 3 tones per color region
(shadow, base, highlight), one extra bright tone only for metal and glow. Dark outline #1a1020, 1 px,
no anti-aliasing, hard pixel edges. Light comes from the upper left.
Cultivation (xianxia) motifs: swirling layered spirit qi, thin talisman / dao-script line patterns,
ancient seal marks, thin layered formation circles, storm clouds and lightning, golden divine halo,
cracked ground. Materials shown by texture, never by glossy shine: broken scales, chipped metal, jade with cloudy core.
Calm, cold, lethal expression. Heavy, ancient, sacred-and-dangerous mood.
Transparent background. No UI frame. Do not draw the glow as a soft blur: paint only hard-edged pixels
(glow, particles and motion are added in code).

NEGATIVE (forbidden):
cute, kawaii, chibi, adorable, baby, big round shiny eyes, rosy cheeks, smiling, friendly, mascot, cartoon,
Saturday-morning cartoon, toy, plastic, rubber, figurine, glossy, soft rounded bubble shapes,
pastel, candy colors, rainbow gradient, neon-bright flat color over the whole body,
flat plain featureless weapon, anime sparkle stars, hearts, bubbles, emoji, sticker, game-mobile gacha look,
readable text, letters, logo, watermark, signature, UI frame, card border, human character in the spirit image,
3D render, photorealistic, blurry, smooth gradients, soft shadows, noise, dithering haze,
anti-aliasing, painterly brush texture, drawing a copy of existing sprite.
```

Cách dùng:
- Mỗi lần gửi: **STYLE + NEGATIVE** (nguyên văn) + **mô tả riêng** (dịch một câu "bá đạo ở đâu" và "hình mẫu", "màu", "motif", "vật đi kèm" của võ hồn ở mục 4 sang tiếng Anh, giữ mã màu) + phần kỹ thuật theo loại hình (lưới sheet, hướng, số khung: `phu-the-hoat-anh.md`, `phap-tuong-cong-thuc.md`, skill `asset-gen`).
- **Từ cấm** bổ sung theo loại hình: chân dung / thẻ thêm `border, frame, card, text`; icon thêm `tiny whole animal, full body`; pháp tướng thêm `solid opaque body` (pháp tướng nửa trong suốt, mục 3 `phap-tuong.md`).
- Sau khi sinh: **rà điều cấm** (mục 2) trước khi nhập; vi phạm thì loại, không sửa tay bằng ảnh cũ. Số màu, khung, bảng màu do bước hậu kỳ (`tools/assets`) kiểm.

## 7. Mốc duyệt

1. Tài liệu này (PR của #1032) được review.
2. **Chủ repo duyệt mục 2, 4 và 6** (bảng thiết kế 25 võ hồn); tthoadev có thể góp ý bảng thiết kế trước khi chốt (đặc biệt Xúc Xích, Nhu Cốt Thố, Yêu Hồ, Bạch Hổ là bốn con dễ lệch phong cách).
3. Chỉ sau khi duyệt: tthoadev vẽ **bộ đầy đủ Tà Hỏa Phượng Hoàng** làm demo (#1024); đạt thì gộp mọi võ hồn còn lại × mọi loại hình (#1025). **Không vẽ trên nền chưa duyệt.**

## Issue liên quan
#1020 (epic phụ thể v2), #1032 (tài liệu này), #1022 (công cụ prompt `phuthe-sheet-prompt`), #1024 (demo Tà Hỏa Phượng Hoàng), #1025 (gộp), #1028 (đặc tả phụ thể P0).
