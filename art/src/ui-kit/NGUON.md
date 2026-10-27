# Nguồn kit Mực — đợt 1, Part of #882

Ảnh duy nhất từ Codex builtin `image_gen.imagegen`; prompt nguyên khối từ `npm run ui:prompt`, không addendum. Tham chiếu đúng thứ tự: BOARD đã duyệt rồi swatch từ `art/palette.gpl`. Không dùng ảnh lỗi làm tham chiếu. RAW không chỉnh sửa; hash và toàn bộ lượt trong `source.json`. Model ID và seed không được công cụ cung cấp.

Nguồn/quyền sử dụng: ảnh tạo bằng OpenAI theo yêu cầu chủ repo; không gán CC0, không sử dụng asset bên thứ ba. BOARD kế thừa nguồn ở `BOARD.source.json`. Theo giới hạn nhiệm vụ, nguồn ghi tại đây thay vì sửa tài liệu ngoài `art/src/ui-kit/`.

| Tờ | Lượt chọn | Chặn | Nhẹ | Trạng thái |
|---|---:|---:|---:|---|
| N | 2/3 | 11 | 11 | Chưa đủ điều kiện cắt |
| O | 3/3 | 1 | 1 | Chưa đủ điều kiện cắt |
| T | 3/3 | 5 | 17 | Chưa đủ điều kiện cắt |

F chưa sinh: tạm bỏ theo chỉ đạo orchestrator tại PR #1165, comment 6443649101 ngày 27/10/2026, chờ sửa lỗi công cụ luôn đòi 2 khung Giấy dù chọn Mực. Giấy chưa triển khai.

## Tờ N

Tab chọn có nền Giấy, sai chất liệu; hover và nhấn có đổi sáng tối, không có chữ đọc được. Còn viền hồng và cạnh không phẳng.

- Lượt 1: 13 chặn, 14 nhẹ; RAW nguyên byte: true.
- Lượt 2: 11 chặn, 11 nhẹ; RAW nguyên byte: true.
- Lượt 3: 13 chặn, 15 nhẹ; RAW nguyên byte: true.

LỖI: toN-2 — mảnh sát nhau / viền ám hồng / cạnh không phẳng / bốn góc khác nhau — nut_chinh_thuong, nut_chinh_ro, nut_chinh_nhan, nut_chinh_tat, nut_chinh_chon, nut_phu_thuong, nut_phu_ro, nut_phu_nhan, nut_phu_tat, nut_phu_chon, toàn tờ, nut_chinh_thuong, nut_chinh_thuong, nut_chinh_ro, nut_chinh_ro, nut_chinh_nhan, nut_chinh_nhan, nut_chinh_tat, nut_chinh_tat, nut_chinh_chon, nut_chinh_chon, nut_phu_thuong, nut_phu_thuong, nut_phu_ro, nut_phu_ro, nut_phu_tat, nut_phu_tat, tab_thuong, tab_thuong, tab_chon, tab_chon — mảnh cách nhau < 5% cạnh tờ (51 px): dễ dính khi tách; viền ám hồng 43.7% điểm viền sau khi khoá nền > 3%: nền ăn vào mảnh (kiểm trên nền tối); nut_chinh_thuong: thân cạnh không phẳng (46% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_chinh_thuong: bốn góc không giống nhau (63% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_chinh_ro: thân cạnh không phẳng (46% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_chinh_ro: bốn góc không giống nhau (69% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_chinh_nhan: thân cạnh không phẳng (41% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_chinh_nhan: bốn góc không giống nhau (44% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_chinh_tat: thân cạnh không phẳng (52% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_chinh_tat: bốn góc không giống nhau (46% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_chinh_chon: thân cạnh không phẳng (52% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_chinh_chon: bốn góc không giống nhau (61% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_phu_thuong: thân cạnh không phẳng (67% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_phu_thuong: bốn góc không giống nhau (52% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_phu_ro: thân cạnh không phẳng (61% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_phu_ro: bốn góc không giống nhau (52% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_phu_tat: thân cạnh không phẳng (44% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_phu_tat: bốn góc không giống nhau (37% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; tab_thuong: thân cạnh không phẳng (100% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; tab_thuong: bốn góc không giống nhau (60% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; tab_chon: thân cạnh không phẳng (89% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; tab_chon: bốn góc không giống nhau (65% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua.

ui:cut từ chối vì còn CHẶN. Không có bản cắt, không dựng trang component hay ghi manifest nhập game.

## Tờ O

Đủ 12 ô; độ hiếm đổi dạng góc; khóa có ổ khóa, hồi chiêu có phần che, thiếu hồn lực có góc gãy. Ruột có vân rõ, cần chủ repo xem lại. Không có chữ đọc được.

- Lượt 1: 1 chặn, 1 nhẹ; RAW nguyên byte: true.
- Lượt 2: 1 chặn, 1 nhẹ; RAW nguyên byte: true.
- Lượt 3: 1 chặn, 1 nhẹ; RAW nguyên byte: true.

LỖI: toO-3 — mảnh sát nhau / viền ám hồng — o_hiem_1, o_hiem_2, o_hiem_3, o_hiem_4, o_hiem_5, toàn tờ — mảnh cách nhau < 5% cạnh tờ (63 px): dễ dính khi tách; viền ám hồng 43.4% điểm viền sau khi khoá nền > 3%: nền ăn vào mảnh (kiểm trên nền tối).

ui:cut từ chối vì còn CHẶN. Không có bản cắt, không dựng trang component hay ghi manifest nhập game.

## Tờ T

Đủ 9 mảnh; ruột thanh đã tách rời; ô nhập Mực. Thanh cuộn nằm ngang. Không có chữ đọc được; còn viền hồng và cạnh không phẳng.

- Lượt 1: 8 chặn, 19 nhẹ; RAW nguyên byte: true.
- Lượt 2: 6 chặn, 19 nhẹ; RAW nguyên byte: true.
- Lượt 3: 5 chặn, 17 nhẹ; RAW nguyên byte: true.

LỖI: toT-3 — viền ám hồng / cạnh không phẳng / bốn góc khác nhau / ruột không đồng nhất / độ dày viền lệch — toàn tờ, thanh_khung_sinh, thanh_khung_sinh, thanh_khung_sinh, thanh_khung_hon, thanh_khung_hon, thanh_khung_hon, thanh_khung_kn, thanh_khung_kn, thanh_khung_kn, thanh_do_sinh, thanh_do_hon, thanh_do_kn, vach_chia, vach_chia, thanh_cuon, thanh_cuon, thanh_cuon, o_nhap, o_nhap, o_nhap, toàn tờ — viền ám hồng 49.1% điểm viền sau khi khoá nền > 3%: nền ăn vào mảnh (kiểm trên nền tối); thanh_khung_sinh: thân cạnh không phẳng (57% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; thanh_khung_sinh: bốn góc không giống nhau (27% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; thanh_khung_sinh: vạch 9-slice đề xuất 19 chạm trần (nửa mảnh) của mảnh 108×40: ruột không đồng nhất, khó kéo; thanh_khung_hon: thân cạnh không phẳng (57% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; thanh_khung_hon: bốn góc không giống nhau (28% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; thanh_khung_hon: vạch 9-slice đề xuất 19 chạm trần (nửa mảnh) của mảnh 108×40: ruột không đồng nhất, khó kéo; thanh_khung_kn: thân cạnh không phẳng (57% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; thanh_khung_kn: bốn góc không giống nhau (28% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; thanh_khung_kn: vạch 9-slice đề xuất 19 chạm trần (nửa mảnh) của mảnh 108×40: ruột không đồng nhất, khó kéo; thanh_do_sinh: bốn góc không giống nhau (54% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; thanh_do_hon: bốn góc không giống nhau (54% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; thanh_do_kn: bốn góc không giống nhau (60% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; vach_chia: bốn góc không giống nhau (68% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; vach_chia: vạch 9-slice đề xuất 5 chạm trần (nửa mảnh) của mảnh 12×38: ruột không đồng nhất, khó kéo; thanh_cuon: thân cạnh hơi lệch (18% điểm > 15%): kiểm tờ liên hệ trước khi kéo; thanh_cuon: bốn góc không giống nhau (53% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; thanh_cuon: vạch 9-slice đề xuất 8 chạm trần (nửa mảnh) của mảnh 132×18: ruột không đồng nhất, khó kéo; o_nhap: thân cạnh không phẳng (65% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; o_nhap: bốn góc không giống nhau (41% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; o_nhap: vạch 9-slice đề xuất 17 chạm trần (nửa mảnh) của mảnh 108×36: ruột không đồng nhất, khó kéo; độ dày viền lệch 17 điểm master (> 2 = 1 px ở 1×) giữa thanh_khung_sinh 9, thanh_khung_hon 9, thanh_khung_kn 9, thanh_do_sinh 2, thanh_do_hon 2, thanh_do_kn 2, vach_chia 19, thanh_cuon 8, o_nhap 8.

ui:cut từ chối vì còn CHẶN. Không có bản cắt, không dựng trang component hay ghi manifest nhập game.

## Đợt 2 — chỉ Mực (27/10/2026, Part of #882)

Chủ repo duyệt hướng mỹ thuật và cho thêm ba lượt N/O/T tại [comment #882](https://github.com/nguyenbinhanltv/soul-land-mmo/issues/882#issuecomment-6445329314). Đã fetch + merge `origin/main`, có #1167. F sinh 3 lượt; N/O/T sinh attempt4–6, không đè candidates cũ. Tất cả ảnh từ Codex builtin `image_gen.imagegen`; prompt nguyên văn từ `ui:prompt --kind <tờ> --material muc`, không addendum. Mỗi lượt đọc báo cáo trước, thêm một bài học ngắn; hết lượt vẫn ghi bài học cho lần sau. BOARD trước, swatch palette sau; không tham chiếu tờ lỗi.

RAW giữ nguyên byte; toàn bộ hash, đường dẫn gốc, prompt và phiếu kiểm nằm ở `dot2.source.json`. Model ID/seed không được công cụ cung cấp. Quyền sử dụng theo nguồn OpenAI đã ghi ở đầu tài liệu.

| Tờ | Lượt | CHẶN | Nhẹ | Chọn trong đợt 2 |
|---|---:|---:|---:|---|
| F | 1 | 7 | 8 |  |
| F | 2 | 7 | 4 | Có |
| F | 3 | 7 | 6 |  |
| N | 4 | 13 | 15 |  |
| N | 5 | 13 | 15 |  |
| N | 6 | 12 | 14 | Có |
| O | 4 | 1 | 1 |  |
| O | 5 | 1 | 1 | Có |
| O | 6 | 1 | 0 |  |
| T | 4 | 5 | 12 |  |
| T | 5 | 4 | 18 | Có |
| T | 6 | 5 | 14 |  |

O attempt6 sai tỉ lệ 3:2 thay vì 1:1 nên bị dừng kiểm sớm (1 CHẶN / 0 nhẹ không có nghĩa tốt hơn); chọn attempt5 đúng tỉ lệ, các góc độ hiếm khác hình rõ. N attempt6 đã hết khoảng cách thiếu và hai tab đều Mực, nhưng còn cạnh/viền hồng. F cả sáu khung đúng Mực; tên chỗ đứng `khung_giay_*` trong spec không phải chất liệu thực tế. T attempt5 ô nhập hết CHẶN cạnh, nhưng ba khung thanh còn cạnh không phẳng; ruột thanh có viền mảnh ngoài yêu cầu. Không có chữ đọc được; ruột một số mảnh vẫn có sắc/vân nhẹ, chưa đạt ruột đồng nhất.

Không tờ nào đạt 0 CHẶN sau giới hạn lượt. Không có bản cắt hoặc trang bộ component 3 nền × 3 cỡ; không sửa công cụ, không ghi manifest, không nhập game. Các bản chính N/O/T và source đợt 1 được giữ nguyên; lựa chọn N/O/T đợt 2 trỏ trực tiếp vào candidates. Riêng F mới có `toF.png` và `toF.prompt.txt`: bản sao nguyên byte của `candidates/toF-attempt2.png` và prompt tương ứng, còn 7 CHẶN / 4 nhẹ, chỉ giữ tên chuẩn cho tờ F chưa đạt; không được cắt hoặc nhập. Mapping và hash bản sao nằm ở `sheets.F.main_copy` trong `dot2.source.json`. Swatch được dựng từ `art/palette.gpl` (hash nguồn đã ghi cùng tham chiếu).

LỖI: toF-attempt2 — viền ám hồng / cạnh không phẳng / bốn góc khác nhau — toàn tờ, khung_muc_lon, khung_muc_nho, khung_muc_nho, khung_giay_lon, khung_giay_nho, khung_giay_nho, khung_tooltip, khung_tooltip, khung_toast, khung_toast — viền ám hồng 32.8% điểm viền sau khi khoá nền > 3%: nền ăn vào mảnh (kiểm trên nền tối); khung_muc_lon: thân cạnh không phẳng (57% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; khung_muc_nho: thân cạnh không phẳng (67% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; khung_muc_nho: bốn góc không giống nhau (48% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; khung_giay_lon: thân cạnh không phẳng (56% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; khung_giay_nho: thân cạnh không phẳng (72% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; khung_giay_nho: bốn góc không giống nhau (40% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; khung_tooltip: thân cạnh không phẳng (67% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; khung_tooltip: bốn góc không giống nhau (44% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; khung_toast: thân cạnh không phẳng (56% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; khung_toast: bốn góc không giống nhau (36% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua.

LỖI: toN-attempt6 — viền ám hồng / cạnh không phẳng / bốn góc khác nhau / quá nhiều màu — toàn tờ, nut_chinh_thuong, nut_chinh_thuong, nut_chinh_ro, nut_chinh_ro, nut_chinh_nhan, nut_chinh_nhan, nut_chinh_tat, nut_chinh_tat, nut_chinh_chon, nut_chinh_chon, nut_phu_thuong, nut_phu_thuong, nut_phu_ro, nut_phu_ro, nut_phu_nhan, nut_phu_nhan, nut_phu_tat, nut_phu_tat, nut_phu_chon, nut_phu_chon, tab_thuong, tab_thuong, tab_chon, tab_chon, toàn tờ — viền ám hồng 35.3% điểm viền sau khi khoá nền > 3%: nền ăn vào mảnh (kiểm trên nền tối); nut_chinh_thuong: thân cạnh không phẳng (41% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_chinh_thuong: bốn góc không giống nhau (29% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_chinh_ro: thân cạnh không phẳng (36% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_chinh_ro: bốn góc không giống nhau (43% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_chinh_nhan: thân cạnh hơi lệch (33% điểm > 15%): kiểm tờ liên hệ trước khi kéo; nut_chinh_nhan: bốn góc không giống nhau (53% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_chinh_tat: thân cạnh không phẳng (40% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_chinh_tat: bốn góc không giống nhau (21% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_chinh_chon: thân cạnh không phẳng (36% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_chinh_chon: bốn góc không giống nhau (40% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_phu_thuong: thân cạnh không phẳng (40% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_phu_thuong: bốn góc không giống nhau (27% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_phu_ro: thân cạnh không phẳng (41% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_phu_ro: bốn góc không giống nhau (42% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_phu_nhan: thân cạnh không phẳng (46% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_phu_nhan: bốn góc không giống nhau (29% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_phu_tat: thân cạnh không phẳng (40% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_phu_tat: bốn góc không giống nhau (20% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; nut_phu_chon: thân cạnh không phẳng (41% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; nut_phu_chon: bốn góc không giống nhau (37% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; tab_thuong: thân cạnh không phẳng (100% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; tab_thuong: bốn góc không giống nhau (67% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; tab_chon: thân cạnh không phẳng (100% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; tab_chon: bốn góc không giống nhau (64% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; 35 màu đáng kể (> 32); cutter lượng tử về ≤ 32 màu nhưng kiểm lại độ mịn.

LỖI: toO-attempt5 — mảnh sát nhau / viền ám hồng — o_trong, o_co, o_chon, o_hiem_1, o_hiem_2, o_hiem_3, o_hiem_4, o_hiem_5, ky_nang_san_sang, ky_nang_hoi_chieu, ky_nang_khoa, ky_nang_thieu_hon_luc, toàn tờ — mảnh cách nhau < 5% cạnh tờ (63 px): dễ dính khi tách; viền ám hồng 43% điểm viền sau khi khoá nền > 3%: nền ăn vào mảnh (kiểm trên nền tối).

LỖI: toT-attempt5 — viền ám hồng / cạnh không phẳng / ruột không đồng nhất / bốn góc khác nhau / độ dày viền lệch — toàn tờ, thanh_khung_sinh, thanh_khung_sinh, thanh_khung_hon, thanh_khung_hon, thanh_khung_hon, thanh_khung_kn, thanh_khung_kn, thanh_khung_kn, thanh_do_sinh, thanh_do_hon, thanh_do_hon, thanh_do_kn, thanh_do_kn, vach_chia, vach_chia, thanh_cuon, thanh_cuon, o_nhap, o_nhap, o_nhap, toàn tờ — viền ám hồng 27.3% điểm viền sau khi khoá nền > 3%: nền ăn vào mảnh (kiểm trên nền tối); thanh_khung_sinh: thân cạnh không phẳng (52% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; thanh_khung_sinh: vạch 9-slice đề xuất 17 chạm trần (nửa mảnh) của mảnh 106×36: ruột không đồng nhất, khó kéo; thanh_khung_hon: thân cạnh không phẳng (51% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; thanh_khung_hon: bốn góc không giống nhau (44% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; thanh_khung_hon: vạch 9-slice đề xuất 17 chạm trần (nửa mảnh) của mảnh 106×36: ruột không đồng nhất, khó kéo; thanh_khung_kn: thân cạnh không phẳng (52% điểm lệch > 35% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn; thanh_khung_kn: bốn góc không giống nhau (21% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; thanh_khung_kn: vạch 9-slice đề xuất 17 chạm trần (nửa mảnh) của mảnh 106×36: ruột không đồng nhất, khó kéo; thanh_do_sinh: vạch 9-slice đề xuất 8 chạm trần (nửa mảnh) của mảnh 100×18: ruột không đồng nhất, khó kéo; thanh_do_hon: bốn góc không giống nhau (23% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; thanh_do_hon: vạch 9-slice đề xuất 8 chạm trần (nửa mảnh) của mảnh 100×18: ruột không đồng nhất, khó kéo; thanh_do_kn: bốn góc không giống nhau (28% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; thanh_do_kn: vạch 9-slice đề xuất 8 chạm trần (nửa mảnh) của mảnh 100×18: ruột không đồng nhất, khó kéo; vach_chia: bốn góc không giống nhau (61% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; vach_chia: vạch 9-slice đề xuất 4 chạm trần (nửa mảnh) của mảnh 10×48: ruột không đồng nhất, khó kéo; thanh_cuon: bốn góc không giống nhau (67% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; thanh_cuon: vạch 9-slice đề xuất 8 chạm trần (nửa mảnh) của mảnh 142×18: ruột không đồng nhất, khó kéo; o_nhap: thân cạnh hơi lệch (29% điểm > 15%): kiểm tờ liên hệ trước khi kéo; o_nhap: bốn góc không giống nhau (46% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua; o_nhap: vạch 9-slice đề xuất 16 chạm trần (nửa mảnh) của mảnh 110×34: ruột không đồng nhất, khó kéo; độ dày viền lệch 10 điểm master (> 2 = 1 px ở 1×) giữa thanh_khung_sinh 10, thanh_khung_hon 10, thanh_khung_kn 10, thanh_do_sinh 3, thanh_do_hon 3, thanh_do_kn 3, vach_chia 12, thanh_cuon 13, o_nhap 7.

## Đợt 3 công cụ — kit Mực cắt được (27/10/2026, Part of #882)

Sửa công cụ, không sinh ảnh: phép đo `edgeFlatness` (hàng thân cạnh trong suốt đồng nhất không còn bị đếm lệch), `ui:cut --soft` (bù viền hồng, ép cạnh phẳng, chỉ hạ chặn → nhẹ khi đạt kiểm hình), `--skip <mảnh>` (cắt phần đạt), `mirror: false` theo mảnh cho tab. Chi tiết ở `docs/art/ui-kit.md` "Cắt mềm". RAW không đổi byte.

| Tờ (bản chọn) | Chặn cũ | Chặn còn (phép đo mới) | Cắt `--soft` | Vẽ lại |
|---|---:|---:|---|---|
| F `toF` (= attempt2) | 7 | 2 (viền hồng, `khung_toast`) | `--skip khung_toast`: 5/6 mảnh | `khung_toast` (cạnh ngắn bị vạch góc 20 nuốt, ngọc cạnh trái / phải bị kéo; bài học ở `lessons.md`) |
| N attempt6 | 12 | 1 (viền hồng) → 0 | 12/12 | không |
| O attempt5 | 1 | 1 (viền hồng) → 0 | 12/12 | không |
| T attempt5 | 4 | 1 (viền hồng) → 0 | 9/9 | không |

Phân loại chặn cũ: `vien-hong` (cả bốn tờ) là mực viền ám tím-hồng do nền ăn vào → sửa bằng công cụ (mực tối về `#1a1020`); `canh-phang` ở F / N / T (19 mảnh, trừ `khung_toast`) là đo sai ở hàng trong suốt (ngọc giữa cạnh nhô ra, tab hở đáy) → sửa phép đo; `khung_toast` là lỗi thật của hình → vẽ lại. Còn nhẹ (ghi sổ): `doi-xung`, `chia-9`, `do-day` (T), 35 màu (N), `khoang-cach` (O), `canh-phang` 15–35% ở N / F / T. Cắt N có tab `mirror: false` (hở đáy).

Trang bộ component 3 nền × 3 cỡ: `kit-muc-dot2-soft/index.html` trong artifact của phiên (38 mảnh, kit 2× ≈ 57 KB). Chưa ghi manifest, chưa nhập game (việc P5).

## Đợt 3 — Giấy và chỉ toast Mực (28/10/2026, Part of #882)

Đã fetch + merge `origin/main`, gồm #1167 và #1175. BOARD là chuẩn phong cách đã duyệt; hướng mỹ thuật Mực được chủ repo duyệt ngày 27/10. Ảnh mới chỉ từ Codex builtin `image_gen.imagegen`, tham chiếu theo thứ tự BOARD rồi swatch palette. Prompt nguyên văn khối `ui:prompt --kind <tờ> --material giay|muc`, không viết tay hoặc addendum; mỗi lệnh sinh chỉ đính hai tham chiếu, không đính ảnh lỗi hay ảnh lượt trước. Không sửa công cụ, không nhập game. RAW giữ nguyên byte và các bản cũ không thay đổi.

Các bài học Mực cũ trong `lessons.md` đã được giới hạn bằng điều kiện MATERIAL is INK để không xung đột với Giấy. Sau mỗi lượt có một bài học ngắn, kiểm parser/prompt bằng `node --test tools/assets/ui-kit-p2.test.mjs`. Toàn bộ lượt, hash RAW/prompt, đường dẫn gốc, phiếu RAW và báo cáo cắt chọn trong `dot3.source.json`. Model ID/seed không được công cụ cung cấp; quyền sử dụng theo nguồn OpenAI ở đầu tài liệu.

| Tờ | Lượt chọn / số lượt đợt này | RAW CHẶN / nhẹ | Kết quả cắt chọn |
|---|---|---|---|
| F Giấy | 2 / 2 | 1 / 10 | `--soft`: 6/6 khung |
| N Giấy | 3 / 3 | 1 / 14 | `--soft --skip tab_thuong,tab_chon`: 10/12 nút; hai tab sai nền Mực, chặn bằng mắt |
| O Giấy | 3 / 3 | 2 / 1 | `--soft`: 12/12 ô; bù viền hồng làm số màu đáng kể giảm về mức cho phép trước lượng tử |
| T Giấy | 2 / 2 | 1 / 12 | `--soft`: 9/9 mảnh |
| Toast Mực | attempt5 / 2 lượt mới (attempt4–5) | 1 / 9 toàn tờ | `--soft --skip` năm khung khác: chỉ 1 toast |

Mục tiêu cắt mềm đạt với mọi phần chọn, trừ **hai tab Giấy chưa đạt chất liệu sau giới hạn ba lượt**. N lượt 2 đúng nền giấy ở tab nhưng hai tab gần giống nhau; cả tờ còn nhiều cạnh chặn. Không ghép tab chưa phân biệt rõ vào bộ chọn. N lượt 1 sai nền ở nút phụ/tab; O lượt 1 sai nền ở tám ô trên; O lượt 2 vượt 40 màu; T lượt 1 sai nền ô nhập/rãnh cuộn. Không có chữ đọc được qua soát RAW bằng mắt. O lượt 3 có ổ khóa và che hồi chiêu rõ, độ hiếm khác dạng góc; một số ruột vẫn có sắc/vân nhẹ. F/T còn cảnh báo vạch sát nửa cạnh và độ dày; không gọi là “đạt đẹp”.

### Riêng thay `khung_toast` Mực

Luồng prompt nguyên văn `ui:prompt F` hiện chỉ sinh cả tờ, không có prompt một ô hoặc mask. Vì vậy dùng phương án chủ repo cho phép: tạo F Mực attempt4–5, **chỉ xuất toast từ attempt5**. Attempt4 toast vẫn bị góc nuốt cạnh ngắn khi kéo ×3; attempt5 bỏ ngọc giữa cạnh và cắt mềm được. Năm khung khác vẫn dùng **nguyên RAW `candidates/toF-attempt2.png`** với `--soft --skip khung_toast`; `toF.png`/prompt chuẩn không bị thay. Trang F Mực nhận hai thư mục cutter riêng: năm mảnh attempt2 + một toast attempt5, không chỉnh/ghép pixel RAW.

### Artifact cắt và trang component

Thư mục gốc: `C:/Users/PC/.ao/data/artifacts/soul_land_game-684/`.

- `F-giay/index.html`: 6 khung; bản cắt `F-giay/cut/`.
- `N-giay/index.html`: 10 nút, không chứa hai tab lỗi; bản cắt `N-giay/cut/`.
- `O-giay/index.html`: 12 ô; bản cắt `O-giay/cut/`.
- `T-giay/index.html`: 9 mảnh; bản cắt `T-giay/cut/`.
- `F-muc/index.html`: 6 khung, gồm `base-attempt2/` (5) và `toast-attempt5/` (1).

Trang do `ui:preview` dựng có ba nền, DPR 1/2, ba cỡ 200×60 / 360×120 / 520×320, nút thật và chuỗi Việt 10/12/24. Asset/font được nhúng vào HTML artifact để mở độc lập; bản cắt và phiếu cắt cũng được giữ trong artifact. Đã thử mở ngay khi tạo: `ao preview` từ chối file ngoài workspace; cả `ao render --check` và `html_preview` trả `RENDER_CHECK_FAILED`. Vì vậy **chưa xác minh hiển thị trang trong trình duyệt**, chưa xác nhận Firefox hoặc thao tác hover/focus; không coi ảnh RAW hiển thị trong chat là kiểm trang component.

Tên file đợt 3 đặt trong `candidates/dot3/giay/toF-1.png`… và `candidates/dot3/muc/toF-4.png` / `toF-5.png` để CI tự suy loại tờ. Nội dung byte không đổi; `analyzed_as` giữ tên lúc chạy phiếu ban đầu.
