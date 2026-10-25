# Phong Lang — ảnh thô chờ owner cắt thử

Part of #688, #691. Chỉ bàn giao candidate để preview, chưa đạt duyệt mỹ thuật.
Owner cho phép nộp raw còn lỗi tại [comment PR #709](https://github.com/nguyenbinhanltv/soul-land-mmo/pull/709#issuecomment-6400336691).

- Ngày sinh: 2026-10-25. Người thực hiện: tthoadev qua Codex.
- Công cụ thực tế: `image_gen.imagegen` tích hợp. Công cụ không cung cấp model ID hay seed; không suy đoán các giá trị này.
- Mỗi lượt chỉ truyền reference gốc `shared/assets/sprites/beast/phong_lang.png` qua `referenced_image_paths`; `transparent_background=false`. Không truyền ảnh sheet khác hoặc `num_last_images_to_include`.
- Ảnh được chép nguyên byte từ đầu ra công cụ. Không resize, sửa metadata, cắt, chỉnh pixel hay dựng pose bằng code.

## Candidate bàn giao

- `toA.png`: lượt A thứ 3, **1024×1536**, lưới 6×12. Prompt đầy đủ thực tế: `toA-prompt.txt`. File công cụ: `exec-ddca163f-4762-41f5-8cb3-4d8e6a9ea72a.png`.
- `toB.png`: lượt B thứ 2, **1254×1254**, lưới 6×8. Prompt đầy đủ thực tế: `toB-prompt.txt` (đề nghị 1024×1024 nhưng đầu ra thực tế khác). File công cụ: `exec-b50d07a2-441b-4a3c-8f9a-e443e83183f9.png`.
- Tổng đã sinh: A **3 lượt**, B **2 lượt**. Chưa chạy lượt B thứ 3 do owner yêu cầu ưu tiên nộp candidate hiện có. Các lượt cũ giữ ngoài repo tại artifact phiên `soul-land-mmo-56`.

## Còn cần owner kiểm qua preview

- A lượt 3: hurt/attack nam đã giữ mặt trước tốt hơn; chu kỳ hurt còn khó nhận rõ. Đông-nam ở một số pose đánh vẫn gần đông; pose chết có đổi trục. Chưa coi đạt hướng/chuyển động.
- B lượt 2: đông-bắc vẫn quá gần ngang, chưa thể hiện rõ lưng nghiêng 45°. Cỡ raw khác prompt đã được owner cho phép nộp để cắt thử, không đồng nghĩa đạt mỹ thuật.
- `assignToCells` (`tools/assets/beast-sheet-cut.mjs`) và `cellRect` (`beast-sheet-lib.mjs`) đều chia ô theo `w/cols`, `h/rows` của ảnh thực. Với B, ô thực là 209×156,75 px. Không sửa tool để tiếp nhận ảnh.
- H3/cắt/GIF preview, ghi ô sai và quyết định duyệt thuộc orchestrator chủ repo. Chưa làm Kim Linh Ưng hay Thái Thản Cự Viên, không đóng #691.
