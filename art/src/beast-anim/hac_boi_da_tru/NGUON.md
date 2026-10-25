# Hắc Bối Dã Trư — raw H4, Part of #768 và #766

Ngày 2026-10-26, tthoadev / phiên `soul-land-mmo-64` sinh duy nhất tờ A bằng `image_gen.imagegen` tích hợp Codex. Hai lượt cùng tờ trong cùng phiên; không sinh B hoặc loài khác. Chỉ đính ảnh tĩnh gốc `shared/assets/sprites/beast/hac_boi_da_tru.png`, đã xem trước khi sinh. Nguồn ảnh tĩnh giữ nguyên theo CREDITS hiện có.

## Raw candidate đã nộp

- `toA.png`: chọn lượt 2/2, thực tế 1024×1536, lưới yêu cầu 6×12, hướng s/se/e. Nhìn thấy 66 vị trí có thú; H4/H8/H12 C5–6 trống. Chưa kiểm bằng công cụ cắt hoặc phát hoạt ảnh.
- `toA.prompt.txt`: nguyên văn prompt thực gửi lượt 2, gồm nguyên khối do script sinh và phần nhấn giữ trục hướng. `hac_boi_da_tru-toA.md` là hướng dẫn/prompt gốc do script sinh, không phải toàn bộ prompt thực.
- `toA.source.json`: SHA-256 ảnh, prompt, reference, tham số thực và đường dẫn hai lượt gốc. Tool không có bộ chọn model/kích thước, không trả model ID hoặc seed; không suy ra model ảnh từ model agent. Kích thước chỉ được yêu cầu qua prompt, raw thực tế đúng 1024×1536.
- Sao chép nguyên byte PNG từ output tool; không cắt, resize, lượng tử màu, sửa metadata/pixel, ghép hay nhân bản khung. Hai raw và prompt thật được giữ trong `/Users/thanhhoa/.ao/data/artifacts/soul-land-mmo-64/`.
- Tờ B chưa sinh. Prompt chuẩn bị tại artifact `prompts/hac_boi_da_tru-toB.md`; cần phiên AO mới, đính cả ảnh tĩnh và A được chọn làm tham chiếu. Các prompt 4 loài kế tiếp cũng đã chuẩn bị ngoài Git. Tiến độ raw toàn batch: **1/10**, không phải số tờ đã được owner duyệt.

## Ô nghi lỗi cần owner kiểm tra

Hàng/cột tính từ 1; đây là soát raw bằng mắt, chưa phải nghiệm thu mỹ thuật hoặc runtime.

- H1 C5–6: hurt xoay/ngẩng đầu, cần kiểm hướng nam và độ rõ giật lùi.
- H3 C3–4: hướng nam giữ tốt hơn lượt 1, cần kiểm động tác lao và chân so với ảnh tĩnh.
- H4 C3–4: die xoay thân/đầu về bên phải, nghi mất trục nam khi ngã.
- H5–8: se còn gần e, cần kiểm góc chéo mặt xuống phải; H8 C2–4 đổi trục khi chết.
- H5/H9 C5–6: hurt ngẩng đầu rõ nhưng cần kiểm chuyển động lùi, tỷ lệ và điểm chân.
- H9–12: kiểm đông có giữ đúng góc ngang, nhất là H12 C2–4 khi ngã.
- Chưa xác nhận độ mượt, cỡ trong khung game, điểm chân hay màu sau cắt. Không tự áp dụng nghiệm thu H2 cho H4.

Lượt 1 bị xoay sang phải ở hàng đánh hướng nam. Lượt 2 nhấn giữ trục s/se/e và hurt; các nghi lỗi trên vẫn còn. Đã dừng ở giới hạn hai lượt/tờ và báo orchestrator44 để chuyển owner xem. Pipeline cắt, preview và nhập game thuộc owner repo.
