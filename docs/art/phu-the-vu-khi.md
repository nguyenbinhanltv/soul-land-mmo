# Mỹ thuật: phụ thể v2 = vũ khí cầm tay của võ hồn đang ra trận (#1307, epic #1020)

Bổ sung cho `phu-the-hoat-anh.md` (khung, nộm, mặt nạ, clip, công cụ `phuthe-sheet-*`) và `vo-hon-phong-cach.md` (ngoại hình, phần 4). **Chỉ tài liệu: không đổi code, server, `shared/data.ts`, số cân bằng, luật chơi.** Bảng 25 dòng dưới đây là **đề xuất, chờ chủ repo duyệt**; chưa duyệt thì chưa ai vẽ, chưa viết công cụ.

## Quyết định chủ repo (2026-10-29, epic #1020)
- **Phụ thể v2 = VŨ KHÍ cầm tay** của võ hồn đang ra trận. Hồn sư thấy mình đang cầm vũ khí mang hình võ hồn.
- **Phụ thể cũ** (cánh, đuôi, đầu thú, hư ảnh hiện đang bay quanh / sau lưng hồn sư; ảnh tĩnh `vh_*`, sheet thử `vhanim_*`) **trở thành pháp tướng bay sau lưng, chỉ hiện khi Chân Thân** (mục 5.18 `GAME_DESIGN.md`; `phap-tuong.md`). Ngoài Chân Thân, sau lưng không còn gì.
- **Trang bị ô `vu_khi` chỉ là chỉ số + viền hạng** (ô túi, tooltip, búp bê Nhân vật), **không có hình trên người**. Hình vũ khí trên người chỉ do võ hồn quyết định. (Đổi dòng "vũ khí do phụ thể" ở `docs/design/trang-bi.md` mục "Hình trên hồn sư" là việc của PR code; PR này không sửa file thiết kế đó.)

## Quy tắc hiển thị
1. **Võ hồn đang ra trận quyết định vũ khí hiện.** Đổi võ hồn ra trận (đội hình, thao tác hiện có) thì vũ khí đổi theo. Client chỉ đọc võ hồn đang ra trận từ state đang đồng bộ (server-authoritative; không thêm logic game, không thêm trường nếu trường hiện có đã đủ).
2. **Mọi người chơi thấy vũ khí của người khác** như phụ thể hiện nay (người ở xa không có trong state thì không vẽ; cùng giới hạn `interest.ts`).
3. **Vũ khí không đổi chỉ số, tầm đánh, vùng chiêu, hitbox.** Chỉ là hình. Đòn đánh, hồn kỹ, `spiritMotion` giữ nguyên số liệu server.
4. **Viền hạng** của trang bị `vu_khi` (nếu hiện) nằm ở giao diện, không phủ lên hình vũ khí trên người.
5. **Chân Thân:** vũ khí cầm tay **ẩn / thu về** (hồn sư giữ tư thế thường) trong lúc pháp tướng sau lưng hiện; hết Chân Thân thì vũ khí hiện lại. Chi tiết thời điểm ẩn (đúng lúc biến hình hay lướt mờ) chốt ở bước client; mục này chỉ chốt nguyên tắc: **không có cả vũ khí lẫn pháp tướng cùng một võ hồn chen nhau trên màn hình**.
6. **Hình dạng lấy từ `vo-hon-phong-cach.md` phần 4** (màu `robe` / `col`, motif, vật đi kèm, độ bá đạo). Phần 4 mô tả **cả võ hồn** (con thú, đóa hoa…); vũ khí là **dạng cầm tay hóa** của đúng võ hồn đó: giữ màu, motif, điểm sáng của icon, vật đi kèm; đổi hình khối thành thứ **cầm được**. Hai bên lệch nhau thì phần 4 thắng về **màu / motif**, bảng dưới thắng về **dạng cầm tay**. Duyệt xong thì phần 4 sẽ có thêm một dòng "dạng vũ khí" trỏ về đây (việc riêng, không làm ở PR này).
7. **Phần để code** (hào quang, vòng trận, vệt chém, hạt sáng, độ trong suốt) giữ luật phần 3.4 của `vo-hon-phong-cach.md`: không nướng vào sheet.

## Bảng 25 võ hồn

**Cách đọc.**
- **Nhóm:** *cứng* = binh khí / bảo vật hình không biến dạng (xoay, dịch, nâng); *mềm* = dây, roi, xích, tơ, khí (đầu cầm tay, thân uốn theo nhịp); *găng-vuốt* = vật bọc bàn tay / cổ tay, tay vẫn cử động như bình thường (cào, đấm).
- **Tay:** *1 tay* (tay thuận, phải khi nhìn hướng `s`), *2 tay* (cùng giữ một vật), *đôi* (mỗi tay một vật), *găng* (cả hai bàn tay).
- **Điểm cầm:** điểm trên nộm LPC mà vũ khí gắn vào (xem "Điểm cầm trên nộm"). `tay` = đầu mút mảng da cẳng tay (`hands[]` của `frameAnchors`, tay thuận trước); `lưng` = `back` (giữa lưng, khi vác / đeo); `vai` = điểm trên `back` hơi lên về phía đầu.
- **Lớp** (`truoc` / `sau`): bảng không có cột riêng, theo quy tắc mặc định ở "Kế hoạch kỹ thuật" bước 4; chỗ đặc biệt ghi trong `lop.json` khi làm thí điểm.
- **Nhóm khung:** A cứng (clip ít pose), B / C mềm (clip đủ pose) như `phu-the-hoat-anh.md`; găng-vuốt dùng B. Khung 96 mặc định; 128 là ứng viên cho vũ khí dài / to.

| # | Võ hồn (`id`) | Dạng vũ khí (từ phần 4) | Nhóm | Tay | Điểm cầm trên nộm | Ghi chú hoạt ảnh `attack` / `cast` |
|---|---|---|---|---|---|---|
| 1 | Cửu Tinh Thất Sát Kiếm (`cuu_tinh_that_sat_kiem`) | trường kiếm bản rộng, sống khuyết gãy, bảy điểm sao chéo sống kiếm, chuôi dài | cứng | 2 tay (theo clip) | `tay` hai tay trên chuôi; đeo `lưng` chéo khi đứng yên (mũi chúc xuống) | `attack` chém chéo vai xuống hông, đổi góc rõ; `cast` giơ kiếm ngang đầu, bảy sao sáng lệch pha (code) |
| 2 | Lam Điện Bá Vương Long (`lam_dien_ba_vuong_long`) | găng long trảo: vảy lam bọc cẳng tay, bốn vuốt rồng, sừng nhỏ chẻ nhánh ở mu tay | găng-vuốt | găng | `tay` cả hai cổ tay; vuốt dài tới đốt ngón | `attack` cào / chộp, vuốt xòe; `cast` hai tay chắp lên, sừng sáng sét (code) |
| 3 | Kỳ Nhung Thông Thiên Cúc (`ky_nhung_thong_thien_cuc`) | trượng hoa cúc: cán dài, đầu nở một đóa cánh dài như dao, nhụy sáng | cứng | 1 tay | `tay` thuận ở đoạn thân cán; đóa hoa trên đầu hồn sư | `attack` quét, vài cánh rời bay như phi đao (một phần là code); `cast` đóa nở tối đa |
| 4 | Tà Hỏa Phượng Hoàng (`ta_hoa_phuong_hoang`) | đao cong lưỡi lửa: sống đao uốn như cánh phượng, lưỡi lông lửa nhọn, đuôi chuôi rách dài | cứng | 1 tay | `tay` thuận ở chuôi; đeo `lưng` ngang hông khi đứng yên | `attack` chém cung rộng, lửa kéo vệt (code); `cast` giơ cao, lông lửa xòe |
| 5 | U Minh Linh Miêu (`u_minh_linh_mieu`) | găng vuốt báo: bốn vuốt dài tím sẫm, khói u minh tan ở cổ tay | găng-vuốt | găng | `tay` cả hai bàn; vuốt vươn khỏi đầu ngón | `attack` cào chéo hai vuốt liền, vệt vuốt (code); `cast` vuốt xòe, khói tuôn |
| 6 | Nguyệt Nhận (`nguyet_nhan`) | song liềm: hai lưỡi trăng cong, mặt trong răng cưa, mép đỏ máu | cứng | đôi | `tay` mỗi tay một lưỡi, nắm ở lõm cong; vắt ngang `lưng` khi đứng yên | `attack` hai lưỡi cắt chéo nhau; `cast` quay một vòng, mảnh trăng bay (code) |
| 7 | Hỏa Long (`hoa_long`) | hỏa long tiên: roi thân rồng quấn quanh cẳng tay, đầu rồng há miệng ở đầu roi, vảy than hồng | mềm | 1 tay | `tay` thuận (đoạn quấn); đầu rồng là đầu roi | `attack` roi quất, đầu rồng phóng tới; `cast` roi cuộn quanh người, đầu ngửa |
| 8 | Nhu Cốt Thố (`nhu_cot_tho`) | găng quyền gân khí: găng nặng bọc cổ tay, hai dải khí như tai thỏ quấn ra sau như roi | găng-vuốt | găng | `tay` cả hai bàn; dải khí buộc ở cổ tay | `attack` đấm / đạp đẩy, dải khí quất; `cast` hai dải khí xòe cao. Giữ nét hung, **không** dễ thương (phần 4) |
| 9 | Kim Vũ Miêu Ưng (`kim_vu_mieu_ung`) | găng vuốt ưng: vuốt to vàng sẫm, hàng lông sét mép trên cẳng tay như cánh nhỏ | găng-vuốt | găng | `tay` cả hai bàn; lông ở cổ tay → khuỷu | `attack` quét xé, lông rung; `cast` giơ hai tay, lông xòe thành cánh nhỏ |
| 10 | Tử Vong Chu Hoàng (`tu_vong_chu_hoang`) | tơ nhện sát: cuộn tơ có bùa quấn tay, mũi tơ như đinh nhọn, đồ án sọ trên cuộn tơ | mềm | 1 tay | `tay` thuận giữ cuộn tơ; tơ thả ra từ đó | `attack` ném tơ ra phía trước (tơ là đường thẳng, đầu nhọn ghim); `cast` căng mạng nhện giữa hai tay (mạng lớn là code) |
| 11 | Bích Lân Xà Hoàng (`bich_lan_xa_hoang`) | xà tiên: thân rắn lục thẫm quấn cẳng tay, đầu rắn mào / nanh dài ở đầu roi, vảy ngọc | mềm | 1 tay | `tay` thuận (đoạn quấn); đầu rắn là đầu roi | `attack` mổ ra phía trước, thân uốn chữ S; `cast` ngóc đầu cao, độc khí (code). Rắn quấn tay có thể cần hai tờ |
| 12 | Càn Khôn Hỗn Nguyên Tỏa (`can_khon_hon_nguyen_toa`) | khóa xích: vòng bánh xe phù văn nhỏ ở đầu xích vàng đồng, ổ khóa ở giữa | mềm | 1 tay | `tay` thuận giữ đầu xích; vòng khóa ở đầu kia | `attack` quăng xích, vòng khóa xoay ghim tới; `cast` nâng vòng ngang đầu, ổ khóa sáng (pháp trận là code) |
| 13 | Hỏa Ảnh (`hoa_anh`) | găng liệt hỏa: nắm tay bọc lửa nung đỏ, đạo văn nung sáng ở mu tay, khói dưới cổ tay | găng-vuốt | găng | `tay` cả hai nắm tay; khói tan ra sau | `attack` đấm thẳng, nắm tay bùng lửa; `cast` hai nắm tay chạm nhau ngang ngực |
| 14 | Yêu Hồ (`yeu_ho`) | quạt ba đuôi: ba lưỡi quạt sắc xòe như ba đuôi hồ ly, cán ngắn, ấn đỏ ở trục quạt | cứng | 1 tay | `tay` thuận ở cán; quạt gập thu gọn ở hông khi đứng yên | `attack` phẩy cắt, ba lưỡi xòe; `cast` xòe tối đa trước mặt, lưỡi lệch pha |
| 15 | Xúc Xích (`xuc_xich`) | thánh quang hương tràng: trượng ngắn hình xúc xích nứt vỏ lộ kim quang, đai đỏ thẫm (**chủ repo duyệt riêng**, phần 4) | cứng | 1 tay | `tay` thuận ở đai; vác `vai` khi đứng yên | `attack` vung như dùi; `cast` giơ cao tỏa kim quang (code). Hài chỉ là chi tiết tinh tế |
| 16 | Quỷ Mị (`quy_mi`) | lưỡi hái bóng: lưỡi cong tím lam đậm, cán dài tan khói ở đuôi, mặt nạ quỷ khắc ở gốc lưỡi | cứng | 2 tay (theo clip) | `tay` hai tay trên cán; kéo `lưng` khi đứng yên | `attack` quét ngang nửa vòng, khói kéo vệt (code); `cast` cắm xuống, bóng quỷ nhỏ (code) |
| 17 | Thiên Càn Bạch Ngọc Đỉnh (`thien_can_bach_ngoc_dinh`) | đỉnh ngọc ba chân nhỏ, hai quai, nắp có núm, khói ngọc bốc | cứng | 1 tay | bưng trên `tay` thuận (lòng bàn tay ngửa) ngang hông; bồng trước ngực khi `cast` | `attack` ném / hất đỉnh về phía trước rồi thu lại; `cast` nâng cao, miệng nghiêng, linh hỏa (code) |
| 18 | Lam Ngân Thảo (`lam_ngan_thao`) | roi dây cỏ: bó dây lam thẫm xoắn như thừng, ngọn nhọn như mũi giáo, hạt sáng | mềm | 1 tay | `tay` thuận giữ gốc bó dây; dây thả dài ra sau / bên | `attack` dây quất vòng trước mặt; `cast` dây cuộn quanh người rồi bung. **Thí điểm mềm** |
| 19 | Hạo Thiên Chùy (`hao_thien_chuy`) | đại chùy: đầu búa vuông khối mẻ, cán dài có đai vàng cũ, nứt sáng cam đỏ rất ít | cứng | 2 tay (theo clip) | `idle` / `walk` / `hurt`: một tay thuận. `attack` / `cast`: neo A chính xác, raster≤2px, góc theo pose atlas (không suy A→B). **Khung cán dọc cách phương dọc≤15° chỉ kiểm A, B không bắt buộc chạm cán** vì tay LPC ngang, đã đo B31–44px; khung không dọc giữ B tới cán≤20px ở khung128. Không đổi LPC. Cán≤khoảng1,4lần thân mọi khung, một cỡ cố định, đầu chùy khoảng22px; không phóng impact, không có cán ngang dài | `attack` nâng đầu trên đầu → nện chạm đất phía trước; `cast` dọc, đá vỡ (code). **Thí điểm cứng**, khung128; PR #1320 giữ nháp chờ mỹ thuật |
| 20 | Cửu Bảo Lưu Ly Tháp (`cuu_bao_luu_ly_thap`) | bảo tháp chín tầng thu nhỏ, mái cong nhiều sắc lưu ly, chóp vàng, chuông gió | cứng | 1 tay | tháp đặt trên lòng bàn tay thuận ngửa; bồng nhẹ | `attack` đập xuống như ấn; `cast` nâng cao, tầng sáng lần lượt (code). Tháp nhỏ vừa tay, không phóng to như pháp tướng |
| 21 | Phá Hồn Thương (`pha_hon_thuong`) | trường thương: cán dài, mũi thoi hẹp có rãnh, hai tua đỏ phất | cứng | 2 tay (theo clip) | `tay` hai tay trên cán; dựng chếch sau `lưng` khi đứng yên | `attack` đâm thẳng theo hướng; `cast` xoay thương một vòng, tua đỏ tung |
| 22 | A Ngân (`a_ngan`) | roi dây vàng xanh: bó dây quấn cổ tay, một đóa hoa nhỏ kim quang ở gốc làm đầu nắm, dây rủ | mềm | 1 tay | `tay` thuận giữ đầu nắm hoa; dây thả dài | `attack` dây quất; `cast` đóa hoa nở, dây vàng bung (hạt sáng là code, không sao / trái tim) |
| 23 | Liệt Hỏa Thương Lang (`liet_hoa_thuong_lang`) | găng vuốt sói: vuốt xám nâu than, bờm gai ở cổ tay, chóp vuốt cháy lửa | găng-vuốt | găng | `tay` cả hai bàn; tàn lửa nhỏ ở chóp vuốt (code) | `attack` cào xuống, hai vệt vuốt lửa (code); `cast` hai tay chạm đất như tru |
| 24 | Băng Phượng Hoàng (`bang_phuong_hoang`) | cung băng: thân cung là hai cánh tinh thể, mào băng ở đỉnh, dây cung sương đông | cứng | 2 tay (theo clip) | `tay` trái giữ thân cung, `tay` phải kéo dây; cầm chếch trước ngực | `attack` giương và buông (không có mũi tên ảnh, tên băng là code); `cast` giương tối đa, sương đông |
| 25 | Bạch Hổ (`bach_ho`) | găng vuốt hổ: vuốt trắng xám, vằn đen `#1a1020` trên mu tay, mép lông trắng | găng-vuốt | găng | `tay` cả hai bàn; vuốt vươn khỏi ngón | `attack` cào xuống, bốn vuốt phát sáng (code); `cast` hai tay chụp, khí trắng lạnh |

**Thống kê:** cứng **12** (#1, 3, 4, 6, 14, 15, 16, 17, 19, 20, 21, 24), mềm **6** (#7, 10, 11, 12, 18, 22), găng-vuốt **7** (#2, 5, 8, 9, 13, 23, 25); tổng 25. Đa dạng silhouette trong nhóm cứng được giữ bằng cách chia: kiếm (#1), đao (#4), song liềm (#6), quạt (#14), hái (#16), thương (#21), chùy (#19), trượng (#3, 15), cung (#24), vật bưng (#17, 20).

**Ghi chú thiết kế còn mở (chủ repo duyệt):**
- Chọn cung (#24), quạt (#14), hái (#16), đao (#4) **thay hình mẫu thú** là quyết định thiết kế của bản đề xuất này, không có trong phần 4; nếu muốn khác (ví dụ Băng Phượng = kiếm băng, Quỷ Mị = găng ma) thì đổi dòng, không ảnh hưởng quy tắc.
- #12 xếp **mềm** vì thân là xích; vòng khóa là đầu nặng (cần xử lý như đầu roi nặng ở clip).
- Găng-vuốt: bàn tay hồn sư LPC có da và ngón; vuốt **gắn thêm** lên bàn, không thay bàn.
- #15 Xúc Xích đã nêu ở phần 4 cần duyệt riêng; giữ dòng này là **đề xuất**.

## Số tay theo clip cho binh khí dài (quyết định điều phối #1320)

Client chọn khung vũ khí có bước thân đã bake gần bước đang hiển thị nhất, ưu tiên chỉ số theo tiến độ cũ nếu hòa. Hạo Thiên Chùy attack bốn khung theo đúng bốn bước thân; cast hai khung không chuyển lên tư thế giơ tay trước bước thân ở300ms. Phụ thể cũ giữ ánh xạ thời lượng hiện hành.

Áp dụng Hạo Thiên Chùy (#19), Cửu Tinh Thất Sát Kiếm (#1), Quỷ Mị (#16), Phá Hồn Thương (#21) và Băng Phượng Hoàng (#24):
- `idle` / `walk` / `hurt`: **một tay thuận**, chỉ marker A; xách / chống / cầm chếch hoặc vác một tay nếu khớp được điểm tay. Với cung: một tay giữ thân cung, tay còn lại nghỉ.
- `attack` / `cast`: **hai tay**, marker A và B theo khung slash / spellcast; giữ động tác riêng của từng vũ khí, Hạo Thiên Chùy nện với pose đổi rõ. `anim.grip` ghi hai hoặc bốn tọa độ theo từng khung.
- Không tạo pose LPC mới. Lý do: tay LPC lúc nghỉ nằm thấp, ép hai tay vào cán đang vác vai làm lệch marker hoặc buộc model sửa nộm; chia số tay theo clip giữ đúng thân hiện có. Các ghi chú đeo lưng / vác vai ở bảng phải tuân theo số tay này; không bắt tay nghỉ thứ hai chạm vũ khí.
- Cột Tay có dấu **theo clip** là dữ liệu để nộm, prompt, kiểm và cutter dùng cùng quy tắc; vũ khí không có dấu này giữ cách đếm tay cũ.

Riêng thí điểm Hạo Thiên Chùy #19 theo quyết định chủ repo 2026-10-30: góc `attack` / `cast` lấy từ pose atlas, không lấy đoạn A→B; A là neo đăng ký chính xác, khoảng cách raster tới hình ≤2 px. **Khung cán dọc (cách phương dọc ≤15°, kể cả nâng/nện) chỉ kiểm A; tay B không bắt buộc chạm cán.** Khung không dọc giữ B tới đoạn cán hữu dụng (không lấy đầu búa) ≤20 px ở khung128. Lý do: hai tay LPC nằm ngang, đã đo B cách cán31–44 px; ép B kéo cán về ngang và mất pose nện. `idle` / `walk` / `hurt` giữ một tay. Cán mọi khung ≤ khoảng1,4 lần chiều cao thân, cỡ cố định giữa khung, đầu chùy khoảng22 px; attack nâng đầu trên đầu rồi nện chạm đất phía trước, không có cán ngang dài. `pose-a/*/grip-check.json` ghi chính sách từng khung; đạt kỹ thuật không thay duyệt mỹ thuật, PR #1320 giữ nháp.

**Băng Phượng Hoàng (#1406, chủ repo chốt 2026-10-31):** cung thuộc danh sách nhóm cứng được miễn tay B ở `attack` / `cast` dọc như Phá Hồn Thương. Giữ các ngưỡng A≤2px, B≤20px ngoài khung dọc và góc≤15° hiện có. Riêng `n/attack/1,2` nam/nữ, nếu chỉ thấy một tay ở đúng bước thì dùng tay A đó (`count1`), không mượn cặp tay bước0/3. Phải có góc của đúng giới/hướng/khung; ngoài danh sách hoặc thiếu góc vẫn giữ kiểm B và hành vi dự phòng cũ. Không đổi pose LPC.

## Điểm cầm trên nộm
Nộm LPC hiện có (`phuthe-sheet-dummy.mjs`, một màu phẳng cyan `#00D0D0`, kèm vạch tham chiếu `GUIDE_KEY`; `phu-the-hoat-anh.md`, `phu-the-vach-tham-chieu.md`) cho người vẽ thấy thân nhưng **không chỉ chỗ cầm**. Vũ khí cần chỗ cầm chính xác theo từng khung (tay đổi chỗ khi vung). Đề xuất:
- **Marker điểm cầm một màu khóa riêng** (GRIP_KEY): một chấm tròn nhỏ (bán kính vài điểm ảnh của ô vẽ) đè **đúng chỗ bàn tay** trên nộm ở từng khung, màu **khác** nền `#FF00FF`, màu nộm, màu vạch và màu khóa thay thế của chúng (đề xuất lục chói `#00FF60`; đổi sang màu phụ theo hàm kiểu `guideKeyOf` khi võ hồn có màu chủ đạo gần, ghi màu dùng vào `NGUON.md`). Hai marker khi cầm hai tay (tay thuận `A`, tay kia `B` phân biệt bằng **hình** chấm / vòng, không thêm màu để tránh tăng số màu khóa).
- **Vị trí marker** do công cụ **đo** từ khung thân `m_0` / `f_0` bằng `frameAnchors` (`hands[]`, mảng da cẳng tay, đầu mút xa lưng nhất), đúng bước thân của từng khung clip (bảng "Ánh xạ clip phụ thể sang khung thân"). `back` cho điểm đeo `lưng`; `vai` = `back` dời lên theo tỉ lệ chiều cao thân (hằng ở công cụ, không ở `data.ts`). Khung nào không đo đủ số tay cần cho clip (cẳng tay bị áo che) thì dùng khung lân cận đủ tay và báo fallback; không sửa pose LPC.
- **Cutter** đọc marker như đọc vạch: trừ khỏi ảnh đầu ra (gỡ viền ngả 3 lớp), **không** vào sheet game; ghi **tọa độ điểm cầm của từng khung** vào manifest (`anim.grip`: `{ "<hướng>/<clip>/<khung>": [x, y, (x2, y2)] }` theo toạ độ khung từ gốc chân) để client có thể bù lệch hoặc gắn hiệu ứng (vệt chém, hạt sáng) tại đúng đầu vũ khí.
- **Kiểm (`phuthe:check` kiểu vũ khí):** vũ khí phải **chạm marker** ở khung đứng (không lơ lửng cách tay > ngưỡng, như `diem-gan`) và trôi marker giữa khung < ngưỡng; còn điểm ảnh màu marker sau cutter thì chặn (`con-nom`). Thí điểm #19 thêm `--pose-plan <compose-plan.json>` để kiểm A mọi khung theo góc/đoạn cán của atlas; A đo lại trên ảnh đang kiểm, khung dọc chỉ A≤2px, khung khác B tới cán≤20px. Cutter kiểm lại A sau cắt.

## Kế hoạch kỹ thuật (đề xuất, chưa làm)
Tái dùng tối đa đường P1 (#1022) / P2 (#1023); thêm chế độ **"vũ khí"** chứ không viết lại công cụ.
1. **Nộm + marker:** `phuthe-sheet-dummy.mjs --kind vukhi` thêm marker điểm cầm (mục trên), giữ nguyên nộm, vạch, hàng thân (`s`, `e` cho `se` / `e` / `ne`, `n`), bước thân theo bảng ánh xạ.
2. **Prompt:** `phuthe-sheet-prompt.mjs --kind vukhi`: ghép dòng của võ hồn ở bảng này ("dạng vũ khí", tay, điểm cầm, ghi chú clip) với phần 4 (màu, motif) và STYLE / NEGATIVE nguyên văn; đòi vẽ **chỉ vũ khí**, **không** vẽ tay / ngón / cẳng tay (bàn tay là nộm, vũ khí **nắm** ở marker), vật cầm đúng cỡ so với nộm. Không có chữ "pháp tướng / cánh / thú" trong mô tả để model khỏi vẽ cả con thú.
3. **Sheet `vkanim_{id}_b` / `vkanim_{id}_f`:** tách khỏi `vhanim_{id}` (phụ thể cũ, nay dùng cho pháp tướng sau lưng khi Chân Thân), cùng bố cục: 5 hướng vẽ thật (`s`, `se`, `e`, `ne`, `n`; tây lật), cột clip theo nhóm (cứng A 13 cột, mềm / găng B 22 cột), hai nửa sau / trước, khung 96 / 128, hai giới chung ảnh dời neo. Manifest thêm `anim.kind: "vukhi"` và `anim.grip`.
4. **Mặt nạ trước / sau theo vũ khí:** mặc định `truoc` (vật nằm ở tay), `sau` khi quay lưng hoặc phần cán / thân vũ khí bị thân che; **đầu mềm** (dây, xích, tơ) có thể quấn sau thân nên cần vùng riêng; vũ khí 2 tay có hai tay ở hai phía thân nên **chia nửa theo tay**. Mặt nạ không đủ thì dùng **hai tờ** (dự phòng đã có ở `phu-the-hoat-anh.md`). `lop.json` của kiểu vũ khí chỉ khai chỗ khác quy tắc mặc định này, đo ở thí điểm (bước 6).
5. **Client:** vũ khí gắn vào điểm tay đã bake trong sheet (như phụ thể v2 đã gắn neo theo khung thân); `spiritMotion` dùng hệ số riêng cho vũ khí cứng (nhỏ, vì clip đã có nhịp cầm); nhánh không có sheet `vkanim` chạy nhánh hiện nay (chưa có vũ khí: hiện phụ thể cũ như trước cho tới khi quyết định gỡ). Đổi hành vi phụ thể cũ chỉ hiện khi Chân Thân là PR code riêng, **sau** khi có vũ khí cho võ hồn đó (tránh võ hồn không có gì hiện).
6. **Thí điểm 3 võ hồn, một mẫu mỗi nhóm:**

| Võ hồn | Nhóm | Mục đích thử |
|---|---|---|
| Hạo Thiên Chùy (#19) | cứng, 2 tay | vật to, khung 128, không vác vai (tay LPC thấp), số tay theo clip, pose `attack` đổi rõ ít khung |
| Lam Ngân Thảo (#18) | mềm | dây dài đủ pose, mặt nạ trước / sau cho đầu dây, bài học "mềm" |
| Một võ hồn găng-vuốt: **U Minh Linh Miêu (#5)** (đề xuất; thay được bằng Bạch Hổ #25 nếu chủ repo muốn) | găng-vuốt | vuốt gắn bàn tay, vệt vuốt là code, nhận diện võ hồn từ vật nhỏ |

   Mỗi mẫu qua khối chặn / nhẹ / đẹp như `phu-the-hoat-anh.md`, chủ repo duyệt mẫu từng nhóm; bài học ghi `art/src/phuthe-anim/lessons.md` (nhóm mới `@VUKHI-*` hoặc theo nhóm cứng / mềm / găng). Thí điểm xong mới roll 22 võ hồn còn lại theo đợt (thứ tự đề xuất: cứng → găng-vuốt → mềm; găng-vuốt dễ chung khuôn như đợt tai / đuôi / vuốt cũ).
7. **Giới hạn hiệu năng:** vẫn hai sprite mỗi hồn sư (nửa sau, nửa trước); sheet 128 chỉ cho vũ khí dài (Hạo Thiên Chùy, Phá Hồn Thương, Cửu Tinh, Quỷ Mị nếu cần) theo đo FPS (`tech/hieu-nang-hieu-ung`).

## Quy trình đã kiểm chứng

**Nhóm mềm — Lam Ngân Thảo (#1322), chủ repo chấp nhận mẫu kể cả hai cảnh báo `chan-lech` 14% ở s/se.** [Hồ sơ, lệnh tái tạo và ảnh kiểm](../../art/src/phuthe-anim/lam_ngan_thao/vukhi/NGUON.md).

- **Vẽ riêng, không nộm:** nền `#FF00FF`, mỗi hướng một atlas 6 pose tách rời (1 idle thả dài, 3 attack quất, 2 cast cuộn). Gốc bó dây đánh dấu rõ; đầu dây nằm trọn ảnh, không thêm tay/người. Không cần mỗi pose một job. Thực tế phương pháp mới dùng **5 job tuần tự / 5 atlas, 1 lượt mỗi hướng**: e đạt rồi mới mở rộng s/se/ne/n. Trước đó vòng sửa kèm nộm riêng hướng e đã hết 3/3 lượt mà chưa đạt; không cộng thêm lượt nếu chưa được giao.
- **Ghép bằng `anim.grip`:** giữ nguyên thân LPC; đo gốc từng pose, chọn pose rồi xoay/dịch tới grip từng khung nam/nữ. Dùng một tỉ lệ chung, đủ chiều dài trong khung (mẫu này 128); không xén để vừa, không dùng code uốn lại dây. Bản mẫu: `isolated/compose.mjs` và `finalize.mjs` trong hồ sơ trên.
- **Giữ đúng lớp và điểm cầm:** đọc `lop.json` bằng `parseLop`/`layerFn`; ne/n mặc định sau thân, vùng cầm trước, cast theo mặt nạ từng khung. Không áp neo lưng của phụ thể cũ lên vũ khí; giữ `spiritMotion`/`weaponOscK` theo bước 5. Kiểm cả ảnh ghép và GameScene thật để tránh trang thử che lỗi runtime.
- **Lỗi hay gặp:** model đổi dáng nộm, thêm dây ở tay phụ, xén đầu dây hoặc làm gốc trôi. Tránh bằng atlas không người, chỉ một gốc cầm, chừa mép, đo gốc rồi ghép grip; không yêu cầu model giữ lại pose thân. Soát thêm vòng dây/ngọn chẻ trông như nhiều đầu, chuyển lớp quay lưng và độ dài giữa các hướng.
- **Cổng duyệt:** e phải 0 chặn và mắt thấy không tay phụ/không xén/gốc đúng tay rồi mới mở rộng. Giữ RAW/prompt lịch sử, hash và bài học bullet `@VUKHI-MEM`; chạy `phuthe:check`, nhập bằng `phuthe-import --kind vukhi`, credits/validate, check/build. Chụp `?thu=vukhi` đủ năm hướng × idle/walk/attack/cast × nam/nữ và võ hồn không vũ khí; ghi cảnh báo vào PR để chủ repo quyết định. Việc chấp nhận hai cảnh báo của mẫu này không tự áp dụng cho mẫu khác.

## Không làm ở file này
- Không đổi code, server, `shared/data.ts`, số cân bằng.
- Không vẽ ảnh, không viết công cụ, không đổi manifest.
- Không sửa `vo-hon-phong-cach.md`, `trang-bi.md` (việc sau khi chủ repo duyệt bảng).
- Không chọn lại pháp tướng: pháp tướng giữ `phap-tuong.md`; phụ thể cũ dùng làm pháp tướng chỉ là hướng đã chốt, cách nhập nằm ở PR riêng.

## Việc tiếp
| Việc | Trạng thái |
|---|---|
| Soạn bảng 25 + quy tắc + kế hoạch (file này, #1307) | PR này |
| Chủ repo duyệt bảng (dạng vũ khí, nhóm, tay, 3 mẫu thí điểm) | hướng đã chốt 2026-10-29 (epic #1020); mẫu mềm Lam Ngân Thảo đã chấp nhận (#1322); bảng đủ 25 dòng vẫn duyệt dần theo từng mẫu |
| Công cụ kiểu `--kind vukhi` (nộm + marker, prompt, cutter, kiểm) | xong (#1313) |
| Nhập `vkanim_<id>_b` / `_f` vào game (`phuthe-import.mjs --kind vukhi`, validate nhận khoá `vkanim`, trang thử `?thu=vukhi`) | xong (#1312) |
| Thí điểm Hạo Thiên Chùy / Lam Ngân Thảo / võ hồn găng-vuốt | Lam Ngân Thảo xong (#1322); Hạo Thiên Chùy #1319 (PR #1320 nháp, chưa đạt); Hỏa Long mềm #1338; U Minh Linh Miêu găng-vuốt #1358: mẫu atlas riêng đủ năm hướng, đã kiểm game, chưa duyệt mỹ thuật; giới hạn hai tay / hurt / khói / clip ở hồ sơ `art/src/phuthe-anim/u_minh_linh_mieu/vukhi/NGUON.md` |
| Client: vũ khí theo võ hồn ra trận, Chân Thân thu về | xong (#1314); thiếu sheet vẫn chạy nhánh hiện nay |
| Phụ thể cũ chỉ hiện khi Chân Thân; sửa `trang-bi.md` | mở sau thí điểm |

## Tiến độ rollout nhóm mềm

Mỗi võ hồn một PR nháp chờ chủ repo duyệt mỹ thuật; chỉ bỏ nháp khi được duyệt. Kiểm 0 chặn không thay cho duyệt mắt, cảnh báo mới không kế thừa mức chấp nhận LNT.

| Dòng | Võ hồn | Issue / PR | Trạng thái |
|---|---|---|---|
| 7 | Hỏa Long | #1338 / #1339 | Đã duyệt mỹ thuật và merge; cảnh báo s 28%, se 20% trong hồ sơ |
| 10 | Tử Vong Chu Hoàng | #1341 / #1342 | Đã duyệt mỹ thuật và merge; s 21% trong hồ sơ |
| 11 | Bích Lân Xà Hoàng | #1346 / #1347 | Đã duyệt mỹ thuật, đã bỏ nháp; cập nhật main và chờ CI xanh; đầu rắn rõ hơn là góp ý không chặn |
| 12 | Càn Khôn Hỗn Nguyên Tỏa | #1349 / #1350 | Đã merge trên main; có ảnh game, AO đạt |
| 22 | A Ngân | #1352 / #1353 | Đã merge trên main; có ảnh game, AO đạt |

## Nhập vào game và trang thử (#1312)
- **Nhập:** cắt tờ bằng `phuthe-sheet-cut.mjs --kind vukhi --out <thư mục>` rồi `node tools/assets/phuthe-import.mjs --id <võ hồn> --kind vukhi --dir <thư mục>`. Ảnh vào `shared/assets/sprites/vukhianim/<id>_{b|f}.png`; mục manifest `vkanim_<id>_{b|f}` giữ `anim.kind: "vukhi"`, `anim.grip`, `anim.gripSex` (nửa không có điểm ảnh ghi `blank`), đặt sau `vhanim_<id>_f` (nếu có) hoặc `vh_<id>_f`. Ghi thêm dòng vào `art/CREDITS.md` (mục ChatGPT, `--credits` đổi đường dẫn) và khối hướng đã nhập ở `art/src/phuthe-anim/<id>/vukhi/NGUON.md`. Chạy lại không đổi gì; `--dry-run` chỉ in. Không dùng `--anchor` (neo là của phụ thể).
- **Kiểm:** `validate.mjs` nhận khoá `vkanim_*` (khung 96 / 128, cỡ sheet như `vhanim`), bắt buộc `anim.kind: "vukhi"` và kiểm `anim.grip` (khoá `<hướng>/<clip>/<khung>` nằm trong số khung của clip, giá trị 2 hoặc 4 số); `vhanim_*` không được mang hai trường đó.
- **Trang thử `?thu=vukhi`** (không cần đăng nhập): sáu hồn sư nhìn s / se / e / ne / n / w cầm vũ khí của võ hồn chọn (`vh=`), đổi clip (`trang=`), tích "Chân Thân" (`chan=1`) để xem vũ khí thu về (chỉ võ hồn có pháp tướng), "Điểm cầm" (`diem=1`) chấm `anim.grip`. Dùng đúng đường client trong game; chưa có sheet thật thì dựng **sheet giả tất định** lúc chạy (gậy + đầu vật, `client/src/vukhiFake.ts`, không phải ảnh model, không vào game; `anh=gia` ép dùng sheet giả kể cả khi đã có ảnh thật).
