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
