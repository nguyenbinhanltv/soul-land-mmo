# Đặc tả hình ảnh kỹ năng combat: 25 võ hồn × 11 chiêu (S0, #541)

Tài liệu đặc tả (chỉ ghi, không có mã). **Cách làm (công thức chuẩn): `docs/art/ky-nang-cong-thuc.md`.** Làm nền cho khung code `SKILL_VISUAL` và các lô hiệu ứng theo võ hồn.

**Nguồn khớp:** tên và mô tả chiêu lấy từ `shared/data.ts` (`VOHON_SKILLS`, `VOHON_SKILLS_HIGH`, `chanThanOf`, `tienCoOf`, `FUSIONS`; đổi tên ở đó thì sửa lại bảng này); hình dáng pháp tướng và dấu hiệu theo `docs/art/phap-tuong.md` (H0). Mọi con số cân bằng (sát thương, tầm, hồi chiêu) **không chép vào đây**, nằm ở `shared/data.ts`.

## 1. Phạm vi và nguyên tắc (chủ repo đã chốt 2026-10-24)

- **Chỉ hình ảnh + cảm giác đánh.** Giữ nguyên số và cơ chế của mọi chiêu. Chiêu trùng cơ chế chỉ **ghi lại** ở mục 6, không sửa.
- **Chưa thêm dung hợp mới.** Mục 5 chỉ làm hình ảnh cho 5 dung hợp hiện có.
- **11 chiêu mỗi võ hồn** = 9 hồn kỹ thường (vòng 1–6, 8, 9, 10; vòng 10 là tuyệt kỹ) + hồn kỹ Chân Thân (vòng 7 biến hình, ô P) + tiên cơ riêng. Vòng 7 không có hồn kỹ thường; ô "Võ Hồn Chân Thân" hiện ở bảng hồn kỹ (PR #543).
- **KHÔNG rung màn hình** trừ boss (mặc định "Chỉ boss" ở `fxPrefs.shake`); mọi chiêu dưới đây tạo cảm giác lực bằng khựng (hit-stop), nháy sáng, tia lửa / mảnh vỡ, lấy đà. Màn tối nhẹ ở T3 là tối viền màn, không rung, không nhòe mạnh.
- **Người khác thấy bản nhẹ:** bỏ lớp sáng trước và cận ảnh mức Thấp; hệ số `PT_OTHERS_K`. Không che vòng báo trước của quái (hiệu ứng vùng để vòng báo trước ở trên cùng); không che thanh máu.
- **Mức hiệu ứng Thấp / Vừa / Cao + Giảm chuyển động** (`fxPrefs`): Thấp chỉ 1 sprite chính, không hạt, không cảnh T3; Vừa theo bảng dưới; Cao thêm hạt (nhân thêm theo mức Cao) và lớp phụ; Giảm chuyển động bỏ nở dần, lắc, xoay, chỉ hiện khung chính + mờ vào / ra.

### 1.1 Ba tầng

| Tầng | Chiêu | Thời lượng | Nội dung | Nguồn ảnh |
|---|---|---|---|---|
| **T1 nhẹ** | hồn kỹ vòng 1–4 | 0,3–0,7 giây | Đạn / vết chém / vùng theo **chữ ký võ hồn** + hạt theo hệ; lấy đà 1–2 khung; khựng 2 khung khi trúng | PixelLab: 1 sprite chữ ký động 4–6 khung / võ hồn (dùng chung cho cả 4 chiêu, đổi cỡ), còn lại code |
| **T2 vừa** | hồn kỹ vòng 5, 6, 8, 9 và tiên cơ | 0,6–1,2 giây | Hiệu ứng trúng riêng, vùng có hoa văn riêng, lấy đà rõ; khựng 3 khung | PixelLab: 2–3 sheet 6–10 khung / võ hồn (trúng, vùng, trạng thái) |
| **T3 trình diễn** | tuyệt kỹ vòng 10, hồn kỹ Chân Thân | 1–2 giây | Pháp tướng ra đòn (khung đánh H2), cut-in tên chiêu, chuỗi **báo trước → bùng → dư chấn**; tối viền màn quanh tâm; khựng 4 khung | PixelLab: sheet lớn 10–16 khung / chiêu; code điều phối |

Quy ước chuỗi chung (mọi tầng): **lấy đà → ra đòn → khựng 2–4 khung khi trúng (`hitstopMs`) → tia lửa / mảnh vỡ theo chất liệu mục tiêu (bảng `soundMap` G2: thịt / giáp / băng / gỗ; C1 thêm đá / linh thể cho visual) → hồi**. Đá hiện là nhánh visual dự phòng vì bảng BEAST/BOSS đang dùng chưa có loài đá riêng; linh thể dùng cho ba boss đặc biệt. Đòn lớn có giật lùi nhẹ thân quái (không rung màn). Số sát thương theo hệ, chí mạng to hơn. Trạng thái có hình bám thân (bảng ở mục 1.3).

### 1.2 Kiểu hiệu ứng (khớp `skillFx.ts`: `FxKind`)

| Kiểu trong bảng | `FxKind` hiện có | Hình hiện nay | Hướng S1 |
|---|---|---|---|
| Phóng | `proj` | quầng sáng + `fx_<hệ>_cau` + vệt hạt | sprite chữ ký của võ hồn |
| Vùng | `zone` | `fx_<hệ>_phu` elip nở thành bậc | hoa văn vùng riêng |
| Chém / Lướt chém | `slash` | `fx_<hệ>_chem` + tàn lửa | vết chém chữ ký |
| Trúng đích | `hit` | `fx_<hệ>_tia` + hạt | hiệu ứng trúng riêng (T2) |
| Hào quang | `aura` | `fx_<hệ>_ngon` bay lên | hào quang theo loại buff / chữa |

### 1.3 Hình trạng thái bám thân (dùng chung, nâng độ rõ ở S1)

| Trạng thái | Hình |
|---|---|
| `burn` | lửa bám thân |
| `shock` | tia điện nhảy trên thân |
| `armor` | mảnh giáp vỡ rơi |
| `poison` | bọt độc xanh nổi |
| `slow` | gợn lạnh chậm lại quanh chân |
| `root` | vòng khóa co giãn, nút dây bám quanh chân |
| `stun` | tia zigzag lệch nhịp và vòng xung quanh đầu |
| `freeze` | sáu mảnh tinh thể và vết nứt băng lệch nhịp |
| `silence` | dấu khóa tím trên đầu |
| `vuln` | vết nứt đỏ trên thân |
| `allure` | trái tim hồng trên đầu |
| `lock` | ổ khóa phù văn |

### 1.4 Quy cách chung của prompt PixelLab (T2 / T3)

Nguồn ảnh hiệu ứng kỹ năng: **PixelLab** theo ngoại lệ ở `GAME_DESIGN.md` mục 5.11 (chủ repo chốt 2026-10-24, #482 / #541; chỉ sheet hiệu ứng, hoạt ảnh kỹ năng và pháp tướng, không tạo hình nhân vật); texture tĩnh vẫn làm bằng ComfyUI / Gemini khi hợp hơn. Prompt của từng chiêu T2 / T3 = phần đầu chung bên dưới + chữ ký võ hồn + kiểu `area` + phần **riêng của chiêu** (tên chiêu, Ý chiêu, khung 1 của chiêu, **Màn** của T3, **Hình** của tiên cơ; chiêu cùng cơ chế với chiêu trước trong võ hồn thì thêm dòng nâng cấp). Kiểm khi sinh bảng: 175 / 175 prompt T2 / T3 khác nhau từng đôi trong cùng võ hồn, kể cả khi bỏ tên chiêu. Số lần của chuỗi / đợt / viên **không ghi ở đây**: S1 đọc `n`, `every` và số đợt của chiêu từ `shared/data.ts` lúc chạy.

Phần đầu mọi prompt: `pixel art VFX sprite sheet, 8 frames (T3: 12), isometric RPG skill effect, additive glow on transparent background, no character, no text, no watermark, clean dark outline, limited palette`. Kèm viền `#1a1020`, nguồn sáng trên-trái. Ảnh tách lớp cộng sáng riêng để code hạ theo mức hiệu ứng. Làm sạch sau PixelLab (lượng tử bảng màu, bỏ điểm lẻ, viền 1 px). Kích thước khung gợi ý: T2 96×96, T3 160×160 (đặt gốc cùng pháp tướng `(80,124)`). Kiểm đọc rõ trên cỏ sáng, hang tối, tuyết, ban đêm.

## 2. Hồn kỹ lớn hiện nay

Hồn kỹ vòng 7+ và Chân Thân dùng `skillCine.ts`: tối màn, chân dung `portrait_<mã>` trượt ngang, tên chiêu chữ lớn (1,25 giây). Mức Thấp không hiện; Vừa chỉ cho người dùng chiêu và người ở gần dưới `CINE_NEAR`; Cao cho mọi người đồng bộ. Pháp tướng chưa ra đòn theo chiêu. T3 sẽ thay phần này bằng cảnh riêng từng võ hồn (cột **Màn** ở mục 4) nhưng giữ nguyên các luật hiện diện trên.

## 3. Bảng tổng: chữ ký 25 võ hồn

| # | Võ hồn | Nhóm | Màu chủ / tối / nhấn / sáng | Nhóm âm G2 (vũ khí · hệ) | Hình đạn | Vết chém |
|---|---|---|---|---|---|---|
| 1 | Cửu Tinh Thất Sát Kiếm | Cường công | `#cfe3ff` / `#3c4f70` / `#8fb4ff` / `#ffffff` | kiếm · Quang | thanh kiếm bạc nhỏ dài như kim, mũi sáng, bay thẳng; loạt thì xòe hình quạt | vệt chém thẳng, mảnh, trắng bạc, rìa trước sáng như nét kiếm |
| 2 | Lam Điện Bá Vương Long | Cường công | `#5ab8ff` / `#1f3f8f` / `#b8e4ff` / `#ffffff` | tay không · Lôi | quả cầu sét lam có đuôi chữ Z, nhả tia nhỏ xung quanh | vệt long trảo ba vạch song song, mép phóng tia sét |
| 3 | Kỳ Nhung Thông Thiên Cúc | Cường công | `#ffb347` / `#8a4a12` / `#ffd98a` / `#fff3c8` | kiếm · Hỏa | cánh cúc dài như phi tiêu, xoay tròn khi bay, nhụy sáng ở gốc | vệt cánh hoa cong, kéo theo cánh nhỏ rơi như mưa |
| 4 | Tà Hỏa Phượng Hoàng | Cường công | `#ff6a2a` / `#8f2a14` / `#ffb347` / `#ffe08a` | tay không · Hỏa | lông vũ lửa tím đỏ có đuôi 3 dải, bay lượn nhẹ | vệt cánh cong rộng, rìa lửa vàng, tàn lửa rơi |
| 5 | U Minh Linh Miêu | Mẫn công | `#b06bff` / `#3e2266` / `#d9b8ff` / `#ffffff` | vuốt · Ám | vệt cào tím phóng thẳng như mảnh trăng nhỏ | ba vệt cào tím chéo, đuôi tan thành khói |
| 6 | Nguyệt Nhận | Mẫn công | `#e6e6f0` / `#4a4a5e` / `#ff5a6a` / `#ffffff` | kiếm · Hỏa | lưỡi trăng khuyết nhỏ xoay bay, viền bạc | vệt trăng khuyết cong lớn, rìa đỏ huyết |
| 7 | Hỏa Long | Mẫn công | `#ff4a2a` / `#7a1c10` / `#ffb347` / `#ffe08a` | vuốt · Hỏa | cầu lửa tròn có đuôi vảy cháy, mặt rồng thoáng hiện ở đầu | vệt móng rồng đỏ cam, rìa cháy |
| 8 | Nhu Cốt Thố | Mẫn công | `#ffc2e2` / `#c86a9a` / `#ffffff` / `#ffe6f4` | tay không · Phong | tia hồng mềm như tai thỏ bay, đầu tròn | vệt tai quất cong màu hồng nhạt |
| 9 | Kim Vũ Miêu Ưng | Mẫn công | `#ffd54a` / `#7a5a12` / `#fff0a0` / `#ffffff` | vuốt · Lôi | lông vũ vàng kim bọc điện, bay thẳng | vệt móng ưng vàng, hai vạch có tia sét |
| 10 | Tử Vong Chu Hoàng | Khống chế | `#9a4aff` / `#2a1240` / `#c8a0ff` / `#7aff9a` | vuốt · Ám | mũi tơ nhện tím đen có sợi kéo theo | hai chân gai đâm chéo, vệt tím đen |
| 11 | Bích Lân Xà Hoàng | Khống chế | `#3ad98a` / `#145a38` / `#9bff9a` / `#e4ffa0` | vuốt · Độc | mũi tên độc xanh lục có đầu rắn thoáng hiện | vệt nanh rắn hai chấm, tia độc nhỏ |
| 12 | Càn Khôn Hỗn Nguyên Tỏa | Khống chế | `#e0b04a` / `#5e4a18` / `#ffe08a` / `#ffffff` | tay không · Lôi | mắt xích vàng bay kéo dây xích sau lưng | xích quất cong, bắn tia lửa vàng |
| 13 | Hỏa Ảnh | Khống chế | `#ff3a4a` / `#701822` / `#ff9a5a` / `#ffe08a` | tay không · Hỏa | chưởng lửa đỏ thẫm hình bàn tay | vệt chưởng rộng như quạt lửa |
| 14 | Yêu Hồ | Khống chế | `#ff9ad5` / `#7a2a5a` / `#ffd0ec` / `#ffffff` | vuốt · Lôi | đuôi hồ hồng nhỏ bay xoay, đầu là trái tim sáng | ba vệt đuôi quạt hồng cong |
| 15 | Xúc Xích | Phụ trợ | `#e8875a` / `#6a3a22` / `#ffd9a0` / `#fff3c8` | chùy · Lôi | xúc xích nhỏ bay xoay, kèm vệt hơi nóng và tia điện nhẹ | vệt quất xúc xích cong, vài hạt vụn nâu |
| 16 | Quỷ Mị | Phụ trợ | `#8a8aff` / `#22224a` / `#c0c0ff` / `#ffffff` | tay không · Ám | bóng tay quỷ dài vươn tới | hai vệt móng dài tím xanh |
| 17 | Thiên Càn Bạch Ngọc Đỉnh | Phụ trợ | `#f0e0a0` / `#6a5a2a` / `#fff6d0` / `#ffffff` | chùy · Mộc | mảnh ngọc trắng bay, đầu tròn có vầng sáng | vệt quầng ngọc cong dịu |
| 18 | Lam Ngân Thảo | Khống chế | `#4ab0ff` / `#1f4a6b` / `#9adfff` / `#ffffff` | thương · Mộc | dây cỏ xanh lam dài bay thẳng như roi | dây quất cong xanh lam, hạt sáng bắn |
| 19 | Hạo Thiên Chùy | Cường công | `#9aa0b4` / `#22222c` / `#d0d4e4` / `#ffffff` | chùy · Quang | mảnh đá văng hình búa nhỏ bay thẳng (hiếm khi dùng đạn) | vệt búa quét ngang rộng, bụi bay theo |
| 20 | Cửu Bảo Lưu Ly Tháp | Phụ trợ | `#7ef0ff` / `#2a6a7a` / `#ffd0f0` / `#ffffff` | chùy · Hỏa | tia sáng 7 màu bay thẳng | dải cầu vồng cong |
| 21 | Phá Hồn Thương | Cường công | `#7fe0d0` / `#1f4a48` / `#c0fff4` / `#ff5a5a` | thương · Quang | mũi thương thoi ngọc bay thẳng, tua đỏ phất phía sau | đường đâm thẳng một vạch, bùng loe ở cuối |
| 22 | A Ngân | Phụ trợ | `#7fd8ff` / `#24527a` / `#ffe08a` / `#ffffff` | tay không · Phong | dây cỏ lam có nụ hoa vàng ở đầu | dải dây vàng cong, hạt sáng |
| 23 | Liệt Hỏa Thương Lang | Mẫn công | `#ff7a3a` / `#4a3a3a` / `#ffb347` / `#ffe08a` | thương · Hỏa | đầu sói lửa nhỏ lao thẳng, nanh sáng | ba vệt vuốt lửa cam |
| 24 | Băng Phượng Hoàng | Khống chế | `#a8e8ff` / `#2a5a8a` / `#eafcff` / `#ffffff` | tay không · Băng | lông vũ băng tinh thể bay thẳng, đuôi sương | vệt cánh băng cong, mảnh vụn băng |
| 25 | Bạch Hổ | Cường công | `#f2f2f6` / `#3a3a4c` / `#ffe08a` / `#ffffff` | vuốt · Phong | sóng quang trắng hình đầu hổ, vằn đen ở rìa | ba vệt vuốt trắng vằn đen |

## 4. Từng võ hồn

Cột **Tầng**: T1 / T2 / T3. Cột **Kiểu**: theo `area` của chiêu (xem 1.2) cộng ghi chú nhiều viên / lặp. Prompt PixelLab chỉ cho T2 và T3 (T1 dùng một sprite chữ ký chung ở đầu mục).

Mỗi võ hồn một file (tiêu đề mục 4.N giữ nguyên trong file):

- [4.1 Cửu Tinh Thất Sát Kiếm](cuu-tinh-that-sat-kiem.md)
- [4.2 Lam Điện Bá Vương Long](lam-dien-ba-vuong-long.md)
- [4.3 Kỳ Nhung Thông Thiên Cúc](ky-nhung-thong-thien-cuc.md)
- [4.4 Tà Hỏa Phượng Hoàng](ta-hoa-phuong-hoang.md)
- [4.5 U Minh Linh Miêu](u-minh-linh-mieu.md)
- [4.6 Nguyệt Nhận](nguyet-nhan.md)
- [4.7 Hỏa Long](hoa-long.md)
- [4.8 Nhu Cốt Thố](nhu-cot-tho.md)
- [4.9 Kim Vũ Miêu Ưng](kim-vu-mieu-ung.md)
- [4.10 Tử Vong Chu Hoàng](tu-vong-chu-hoang.md)
- [4.11 Bích Lân Xà Hoàng](bich-lan-xa-hoang.md)
- [4.12 Càn Khôn Hỗn Nguyên Tỏa](can-khon-hon-nguyen-toa.md)
- [4.13 Hỏa Ảnh](hoa-anh.md)
- [4.14 Yêu Hồ](yeu-ho.md)
- [4.15 Xúc Xích](xuc-xich.md)
- [4.16 Quỷ Mị](quy-mi.md)
- [4.17 Thiên Càn Bạch Ngọc Đỉnh](thien-can-bach-ngoc-dinh.md)
- [4.18 Lam Ngân Thảo](lam-ngan-thao.md)
- [4.19 Hạo Thiên Chùy](hao-thien-chuy.md)
- [4.20 Cửu Bảo Lưu Ly Tháp](cuu-bao-luu-ly-thap.md)
- [4.21 Phá Hồn Thương](pha-hon-thuong.md)
- [4.22 A Ngân](a-ngan.md)
- [4.23 Liệt Hỏa Thương Lang](liet-hoa-thuong-lang.md)
- [4.24 Băng Phượng Hoàng](bang-phuong-hoang.md)
- [4.25 Bạch Hổ](bach-ho.md)

## 5. Năm dung hợp hiện có

Hình hiện nay (`fusionFx` ở `GameScene.ts`): hai luồng sáng màu `col` từ ngực hai người vòng cung nhập vào điểm giữa (280 ms); đóa kính lưu ly nở trên mặt đất (vòng trong xen hai màu võ hồn, vòng ngoài lam / ngọc / tím lưu ly, viền chì và vàng kim); vòng sáng màu niên hạn; tên chiêu bay lên như tuyệt kỹ. Chung cho cả 5 chiêu, chưa thấy được **hai pháp tướng**.

Hướng S4 (chỉ hình, giữ số): trước khi bùng, hai pháp tướng của hai người hiện (khung H2) hai bên điểm giữa, quay về nhau, rồi hòa thành một cột sáng pha hai màu; chiêu bùng bằng sheet riêng theo cặp.

### 5.1 Yêu Nguyệt (Yêu Hồ + Nguyệt Nhận)

- **Ý chiêu (theo `FUSIONS`, không chép số):** lưỡi trăng xoay ba vòng quanh điểm giữa hai người, mỗi vòng thêm một tầng Mị hoặc, đủ tầng thành Mê hoặc.
- **Hình hiện có:** chung (luồng sáng hai màu `#ff9ad5` và `#e6e6f0` + đóa kính lưu ly + tên chiêu).
- **Hình đề xuất:** Hồ ly hồng và trăng khuyết bạc cùng hiện; các vòng lưỡi trăng bạc có viền hồng xoay quanh điểm giữa, mỗi vòng để lại trái tim hồng nhỏ rồi tan thành cánh hoa. Tầng cuối: trăng tròn hồng bạc mở ra.
- **Kiểu:** Vùng nhiều đợt lặp (theo số đợt của chiêu). **Tầng:** T3. **Âm:** chuông nhẹ + vút kiếm, mỗi vòng một nhịp.
- **Prompt PixelLab (T3, 12 khung):** `pixel art VFX sprite sheet, 12 frames, fusion skill, pink fox tails, heart-shaped sparkles, water-drop glow combined with silver crescent moon blades with blood-red edge, two-tone glow #ff9ad5 and #e6e6f0, additive glow on transparent background, no character, no text, large scale, anticipation, burst, aftershock`.

### 5.2 Hạo Thiên Nhu Cốt (Hạo Thiên Chùy + Nhu Cốt Thố)

- **Ý chiêu (theo `FUSIONS`, không chép số):** quật ngã cả vùng (Choáng) rồi chùy giáng nhiều nhát, mỗi nhát thêm sát thương theo sinh lực tối đa (có trần).
- **Hình hiện có:** chung (luồng sáng hai màu `#9aa0b4` và `#ffc2e2` + đóa kính lưu ly + tên chiêu).
- **Hình đề xuất:** Búa đen và thỏ trắng hồng cùng hiện; thỏ quật cả vùng thành vòng sóng hồng rồi búa nện từng nhát (số nhát theo `FUSIONS`), mỗi nhát một vòng nứt đất xám kèm cánh hoa hồng.
- **Kiểu:** Vùng nhiều đợt lặp (theo số đợt của chiêu). **Tầng:** T3. **Âm:** thịch mềm rồi chùy nặng.
- **Prompt PixelLab (T3, 12 khung):** `pixel art VFX sprite sheet, 12 frames, fusion skill, black war hammer shockwave, cracked ground, flying rocks combined with soft pink rabbit-ear whip arcs, white fur puffs, two-tone glow #9aa0b4 and #ffc2e2, additive glow on transparent background, no character, no text, large scale, anticipation, burst, aftershock`.

### 5.3 Lôi Độc Song Sát (Lam Điện Bá Vương Long + Bích Lân Xà Hoàng)

- **Ý chiêu (theo `FUSIONS`, không chép số):** sấm độc giáng nhiều đợt cả vùng: Cảm điện, Trúng độc nhiều tầng, độc cộng thêm sát thương.
- **Hình hiện có:** chung (luồng sáng hai màu `#5ab8ff` và `#3ad98a` + đóa kính lưu ly + tên chiêu).
- **Hình đề xuất:** Rồng sét lam và rắn lục cuộn quấn nhau trên đầu vùng; các đợt giáng sét độc: sét xanh lam kéo theo sương độc lục, vùng nhuộm lam lục xen kẽ.
- **Kiểu:** Vùng nhiều đợt (theo số đợt của chiêu). **Tầng:** T3. **Âm:** sét nổ gắt + rít độc, mỗi đợt một nhịp.
- **Prompt PixelLab (T3, 12 khung):** `pixel art VFX sprite sheet, 12 frames, fusion skill, blue lightning dragon, zigzag electric arcs, three-claw swipe combined with emerald serpent fangs, scale glints, green venom mist, two-tone glow #5ab8ff and #3ad98a, additive glow on transparent background, no character, no text, large scale, anticipation, burst, aftershock`.

### 5.4 Băng Hỏa Lưỡng Nghi (Băng Phượng Hoàng + Hỏa Long)

- **Ý chiêu (theo `FUSIONS`, không chép số):** nửa vùng phía Băng Phượng Hoàng đóng băng (Choáng), nửa phía Hỏa Long Thiêu đốt; băng hỏa giao nhau, hồn thú đang Choáng hoặc Thiêu đốt chịu thêm sát thương.
- **Hình hiện có:** chung (luồng sáng hai màu `#a8e8ff` và `#ff4a2a` + đóa kính lưu ly + tên chiêu).
- **Hình đề xuất:** Phượng băng bên trái, rồng lửa bên phải; vùng chia đôi băng / lửa theo vòng âm dương; rồi hai nửa giao nhau, lửa và băng xoáy thành hơi nước trắng.
- **Kiểu:** Vùng chia nửa + vùng giao. **Tầng:** T3. **Âm:** băng nứt rồi lửa phụt, hơi xì.
- **Prompt PixelLab (T3, 12 khung):** `pixel art VFX sprite sheet, 12 frames, fusion skill, ice phoenix crystal feathers, snowflake rings, frost shards combined with red dragon fire orbs, burning scales, ember smoke, two-tone glow #a8e8ff and #ff4a2a, additive glow on transparent background, no character, no text, large scale, anticipation, burst, aftershock`.

### 5.5 U Minh Bạch Hổ (Bạch Hổ + U Minh Linh Miêu)

- **Ý chiêu (theo `FUSIONS`, không chép số):** nửa vùng phía Bạch Hổ chấn lùi và Phá giáp, nửa phía U Minh Linh Miêu cào nhiều nhát bóng tối; hổ ảnh U Minh phủ cả vùng, hồn thú đang Phá giáp chịu thêm sát thương.
- **Hình hiện có:** chung (luồng sáng hai màu `#f2f2f6` và `#b06bff` + đóa kính lưu ly + tên chiêu).
- **Hình đề xuất:** Hổ trắng và báo tím hiện hai bên; nửa hổ: sóng quang trắng chấn lùi; nửa báo: các nhát cào tím; cuối cùng hổ ảnh U Minh (hổ vằn tím trắng) phủ cả vùng.
- **Kiểu:** Vùng chia nửa + vùng giao. **Tầng:** T3. **Âm:** gầm hổ và rít vuốt, hợp thành tiếng trầm.
- **Prompt PixelLab (T3, 12 khung):** `pixel art VFX sprite sheet, 12 frames, fusion skill, white tiger black stripes, golden eyes, paw print shockwave combined with violet panther claw slashes, dark smoke, glowing eyes, two-tone glow #f2f2f6 and #b06bff, additive glow on transparent background, no character, no text, large scale, anticipation, burst, aftershock`.

## 6. Chiêu trùng cơ chế (chỉ ghi, KHÔNG sửa trong #541)

Tìm bằng so khóa cơ chế (`area`, trạng thái gây, kiểu buff, hút, lướt, nhiều viên, đẩy…) bỏ qua `dmg`, `r`, hồi chiêu. Chiêu cùng khóa cùng võ hồn chủ yếu là **bản nâng cấp số** của nhau (đúng ý thiết kế "mạnh dần"), chỉ đáng đề xuất chỉnh nếu hình ảnh cũng giống hệt. Vì **hình ảnh** sẽ phân biệt chúng theo tầng, mục này là danh sách để chủ repo cân nhắc đề xuất riêng.

### 6.1 Trùng hệt (mọi trường trừ tên, mô tả, biểu tượng giống nhau)

- **Nguyệt Nhận** vòng 1 *Nguyệt Ảnh Đột* và **Phá Hồn Thương** vòng 2 *Thương Ảnh Đột Kích*: cùng lướt tầm như nhau, cùng Phá giáp, cùng bất tử ngắn. Khác võ hồn nên đã khác hình; **không cần sửa**.
- **Thiên Càn Bạch Ngọc Đỉnh** vòng 1 *Bạch Ngọc Hồi Xuân* và **A Ngân** vòng 2 *Lam Ngân Hồi Xuân*: cùng hồi sinh lực cùng mức. Khác võ hồn; **không cần sửa**.

### 6.2 Cùng cơ chế trong một võ hồn (bản nâng cấp số, hình phải phân biệt theo tầng)

| Võ hồn | Nhóm cùng cơ chế (vòng · chiêu) | Ghi chú hình |
|---|---|---|
| Cửu Tinh Thất Sát Kiếm | 1 Thất Sát Kiếm Khí ≈ 4 Thất Sát Trảm ≈ 5 Thất Sát Kiếm Mang ≈ 10 Kiếm Trảm Sơn Hà; 2 Cửu Tinh Kiếm Vũ ≈ 8 Cửu Tinh Kiếm Lưu; 3 Vô Ngã Kiếm Trận ≈ 6 Thất Tinh Kiếm Trận | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Lam Điện Bá Vương Long | 1 Lam Điện Kích ≈ 5 Lam Điện Phá Không Kích; 2 Lôi Đình Phích Lịch ≈ 4 Lam Điện Long Hống; 3 Lôi Long Liên Kích ≈ 6 Lôi Long Cửu Liên; 8 Lam Điện Lôi Ngục ≈ 10 Lôi Động Minh Thiên · Toàn Vực | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Kỳ Nhung Thông Thiên Cúc | 3 Kỳ Nhung Triền ≈ 6 Kỳ Nhung Phược Hoa; 4 Thông Thiên Cúc Vũ ≈ 8 Cúc Hoa Phong Bạo · Liên Hoàn ≈ 10 Vạn Cúc Thông Thiên | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Tà Hỏa Phượng Hoàng | 3 Phượng Hoàng Phi Thiên ≈ 6 Phượng Dực Thiên Tường; 4 Phượng Hoàng Lãnh Vực ≈ 9 Phượng Hoàng Liệt Không ≈ 10 Phượng Hoàng Niết Bàn | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| U Minh Linh Miêu | 2 U Minh Trảo ≈ 10 U Minh Bách Trảo · Vô Ảnh; 4 U Minh Bách Trảo ≈ 9 U Minh Đoạt Phách | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Nguyệt Nhận | 1 Nguyệt Ảnh Đột ≈ 5 Nguyệt Ảnh Liên Đột; 2 Huyết Nguyệt Trảm ≈ 6 Huyết Nguyệt Đoạt Hồn; 3 Song Nguyệt Hồi Toàn ≈ 8 Song Nguyệt Giao Huy; 4 Tà Nguyệt Trảm ≈ 9 Tà Nguyệt Phá Không | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Hỏa Long | 1 Hỏa Long Tức ≈ 3 Hỏa Long Phần Thiên ≈ 5 Hỏa Long Liệt Diễm ≈ 8 Hỏa Long Phệ Thiên; 4 Viêm Bạo ≈ 9 Long Viêm Bạo Liệt | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Nhu Cốt Thố | 2 Thuấn Di ≈ 6 Thuấn Di · Liên Hoàn; 4 Bát Đoạn Suất ≈ 8 Nhu Cốt Liên Suất ≈ 10 Bát Đoạn Suất · Thập Vạn Niên | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Kim Vũ Miêu Ưng | 1 Kim Vũ Trảo ≈ 5 Kim Vũ Lôi Trảo ≈ 8 Tê Liệt Lôi Trảo · Liên Hoàn | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Bích Lân Xà Hoàng | 1 Bích Lân Độc Tiễn ≈ 5 Bích Lân Tử Độc; 4 Vạn Xà Phệ Tâm ≈ 9 Xà Hoàng Thôn Phệ | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Càn Khôn Hỗn Nguyên Tỏa | 4 Hỗn Nguyên Thiên Tỏa ≈ 6 Hỗn Nguyên Lao Ngục ≈ 10 Càn Khôn Hỗn Nguyên · Thiên Địa Tỏa | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Xúc Xích | 4 Phục Chế Hương Tràng ≈ 9 Phục Chế Hương Tràng · Đại Thành | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Thiên Càn Bạch Ngọc Đỉnh | 3 Thiên Càn Trấn Áp ≈ 8 Thiên Càn Phong Ma; 6 Thiên Càn Hộ Thể ≈ 9 Bạch Ngọc Thánh Đỉnh | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Hạo Thiên Chùy | 3 Loạn Phi Phong Chùy Pháp ≈ 10 Loạn Phi Phong Chùy Pháp · Đại Thành | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Phá Hồn Thương | 2 Thương Ảnh Đột Kích ≈ 9 Xuyên Vân Phá Nhật; 3 Phá Hồn Tỏa Phách ≈ 5 Phá Hồn Liên Thương; 4 Phá Hồn Nhất Thương ≈ 8 Phá Hồn Trảm Phách | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Liệt Hỏa Thương Lang | 1 Liệt Hỏa Phệ Giảo ≈ 4 Liệt Hỏa Cuồng Trảo ≈ 10 Liệt Hỏa Thương Lang · Phần Thiên Phệ; 2 Thương Lang Đột Tập ≈ 6 Hỏa Lang Bôn Tập | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |
| Băng Phượng Hoàng | 1 Băng Phượng Vũ ≈ 8 Vạn Băng Phượng Vũ; 4 Băng Phượng Phong Ấn ≈ 9 Cực Hàn Băng Phong | Dùng cùng chữ ký, tăng tầng: T1 gọn → T2 hiệu ứng trúng riêng → T3 pháp tướng ra đòn |

### 6.3 Chuỗi buff / chữa thuần của hệ Phụ trợ

Xúc Xích, Quỷ Mị, Thiên Càn Bạch Ngọc Đỉnh, Cửu Bảo Lưu Ly Tháp, A Ngân có nhiều chiêu `self` chỉ khác loại buff (Lực, Tốc, Hồn, Phòng, Thần…) hoặc chỉ khác mức hồi. Về **hình** phải cho mỗi loại buff một màu / biểu tượng riêng (Lực đỏ, Tốc lục, Hồn lam, Phòng vàng, Thần tím, chữa trắng-xanh) để người chơi đọc được chiêu nào đang bật, vì cơ chế không đổi được trong phạm vi này.

## 7. Việc để S1–S5

- **S1:** bảng `SKILL_VISUAL` (chiêu → chữ ký, sheet, tầng, tham số chuyển động) đọc từ mục 3 và 4; trình phát sheet (lớp cộng sáng, pool); mức hiệu ứng; thay `skillFxOf` chung dần.
- **S2:** Lam Điện Bá Vương Long (4.2) + Hạo Thiên Chùy (4.19), đủ 11 chiêu + 1 dung hợp (Lôi Độc Song Sát hoặc Hạo Thiên Nhu Cốt).
- **S3:** theo lô: rồng + chim, thú, khí, thực vật, côn trùng / hư ảnh. Mỗi lô một trang xem trước → chủ repo duyệt → PR.
- **S5:** âm T3, đo FPS 40–60 người, điện thoại, bot tung mọi chiêu không lỗi.

## Issue liên quan
#541 (S0, đặc tả), kế hoạch combat 2026-10-24.
