# Nguồn ảnh Thái Thản Cự Viên — H2

Part of #691 và #688. PR: https://github.com/nguyenbinhanltv/soul-land-mmo/pull/726.

Ngày 2026-10-26, sinh bằng `image_gen.imagegen` tích hợp Codex. Tool không trả model ID hoặc seed; không suy đoán các giá trị này. Mỗi tờ một lần gọi độc lập, chỉ sinh nguyên tờ. A/B/D/E một lượt; C hai lượt, chọn lượt hai. Không hậu kỳ, resize, chỉnh metadata, cắt, ghép hoặc nhân pose. Ảnh raw được giữ nguyên byte.

Ảnh tham chiếu thiết kế: `shared/assets/sprites/beast/thai_than_cu_vien.png` (ảnh tĩnh Gemini cũ của dự án; nguồn gốc ở `art/CREDITS.md`). Đã xem reference trước khi sinh. B–E đính thêm candidate A để giữ nét và màu; A chưa được owner duyệt mỹ thuật. Các lời nhắc chuyển động chung được làm rõ thành vượn chống đốt tay, không đổi loài hay thêm vũ khí.

Prompt mẫu sinh bằng `node tools/assets/beast-sheet-prompt.mjs --species thai_than_cu_vien --out <artifact>` nằm ở `thai_than_cu_vien-toA.md` đến `thai_than_cu_vien-toE.md`; giữ nguyên nội dung sinh. Prompt thực gửi tool là `toA.prompt.txt` đến `toE.prompt.txt`, có nhấn hướng ở đầu prompt và block. Nguồn, SHA256, cỡ thực, số lượt và reference từng tờ ở `toX.source.json`. C lượt một và prompt được giữ trong artifact phiên soul-land-mmo-59 ngoài Git.

Mỗi ảnh raw thực tế 1536×1024, lưới 6 cột ×4 hàng; 22 hình, H4 C5–6 trống. A=s, B=se, C=e, D=ne, E=n. H1 C1–4 idle, C5–6 hurt; H2 C1–6 walk; H3 C1–6 attack; H4 C1–4 die. Đếm hình bằng mắt, chưa xác nhận cutter hay animation preview.

## Vị trí cần owner kiểm tra

Các ảnh là candidate để owner cắt và xem, chưa tự nhận đạt mỹ thuật. Hàng/cột tính từ 1, từ trên xuống và trái sang phải. Nét/màu và pose cần đánh giá qua preview hoạt ảnh; các điểm dưới chỉ là nghi vấn từ ảnh nguyên tờ.

- Tờ A: H1 C5–6: hurt quay đầu sang phải, cần kiểm trục nam. H4 C4: die nằm nghiêng, cần kiểm trục nam.
- Tờ B: H2 C3–6 và H3 C2–3: có pose gần hướng nam. H4 C2–4: die có xu hướng xoay về phía người xem.
- Tờ C: H1–2: góc còn hơi 3/4, chưa ngang tuyệt đối. H3 C2: ngực xoay ra trước; H3 C3–4: nắm tay vượt hoặc sát ranh phải ô. H4 C4: mặt còn xoay về người xem.
- Tờ D: H3 C3: nắm tay sát/vượt ranh phải ô. H4 C4: die lộ mặt, có thể đổi trục đông-bắc.
- Tờ E: H1 C5–6 và H3 C2–5: thân xoay nhẹ trong hurt/attack; cần kiểm trục bắc.

Không sửa shared/assets, manifest, client, server, DB hoặc cân bằng. Không đóng #691; phần cắt/preview/nối game thuộc owner.
