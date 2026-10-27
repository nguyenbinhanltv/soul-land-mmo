# Hạo Thiên Chùy — RAW concept turnaround (#1024)

`concept-turnaround-attempt1.png`: 1983×793, 1,381,234 byte, SHA256 `9cab9a9851e7cad8727148a8d63ce687bb32e50b093af368c1392ed890cfea1e`; prompt `concept-turnaround-attempt1.prompt.txt`, prompt SHA256 `dbfa604645fbf4d82e8c6199bc732d069ec2d5b5309b4f9c084124a7c6a24cb7`.

Ảnh có năm góc nhìn liên tiếp. **FAIL cho tiêu chuẩn asset** vì texture vẽ mềm/nhiễu, không đạt pixel cứng theo STYLE/NEGATIVE. RAW giữ nguyên; chưa crop/resize/hậu kỳ, chưa duyệt và chưa nhập game. Chỉ là concept, không tạo hoạt ảnh.

Prompt dùng đúng khối STYLE + NEGATIVE tại `docs/art/vo-hon-phong-cach.md` mục 6 và mô tả Hạo Thiên Chùy mục 4.1; không dùng ảnh cũ làm ảnh dẫn. Không có ảnh tham chiếu.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phap-tuong/hao_thien_chuy/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | RAW concept turnaround 5 hướng, 1983×793; model/seed unknown. Prompt, SHA, output path và lỗi trong NGUON.md + `*.prompt.txt` + `*.source.json`. Không animation / chưa được duyệt. | 2026-10-27 | Pháp tướng Tà Hỏa không thay đổi; không sửa `art/CREDITS.md`. |

## Attempt 2/3 — concept turnaround, chủ repo chốt ĐẠT

`concept-turnaround-attempt2.png`: 2172×724, 1,147,628 byte, SHA256 `631ac2ef55e230875ee2452b5dac9c634829ed09642d9666824e2a20f0e664af`; PNG có alpha, bản sao khớp byte với output gốc. Prompt chính xác nằm ở `concept-turnaround-attempt2.prompt.txt`, SHA256 `cd8c9097ec72444e8adf3b97fcb4eba549e445d6da3c9c913b19bf71f4b34348`.

Đây là **lượt 2/3**, giữ nguyên attempt1; còn tối đa một lượt trong giới hạn đã duyệt. Tham chiếu duy nhất, theo đúng thứ tự, là ảnh mới đã được chủ repo cho phép dùng làm tham chiếu phong cách: `art/src/vohon-v2/ta_hoa_phuong_hoang/portrait-attempt2.png`, SHA256 `dd0fdb1cfeb6042cc1a2ed6f0a6c7a254005120e1eaab3fb575ca917ec7ad85f`. Không dùng ảnh PixelLab / Gemini cũ. Model, seed và thời gian sinh: unknown (tool không cung cấp).

Chủ repo chốt **ĐẠT concept** trong [comment #6430325821](https://github.com/nguyenbinhanltv/soul-land-mmo/pull/1083#issuecomment-6430325821): khối đá lớn, mạch dung nham dày, một dải đồng và ấn văn giữa đúng hướng pixel rõ, bá đạo. Năm hình trong RAW thực chất là **ba góc nhìn độc lập**: hai cặp gương và một mặt trước; do búa đối xứng, hướng `ne` / `n` sẽ dùng lại mặt trước theo quyết định owner. Không cần attempt 3.

Phê duyệt này chỉ chốt **concept hình dáng**; đây chưa phải sprite cuối, chưa import và chưa tạo hoạt ảnh. Ghi chú QA kỹ thuật: ảnh không gắn nhãn hướng; cặp trong/ngoài nhìn như cặp gương như owner xác nhận; shading mềm và một ít texture mịn vẫn còn trong RAW. Không crop, resize hay sửa RAW.

Full tool response được lưu trong session store với key `soul-land-1024-hao-thien-concept-attempt2-full-response`; `output_hint` nguyên văn, prompt, ordered reference/hash và thông tin file được ghi trong `.source.json`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phap-tuong/hao_thien_chuy/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | RAW concept attempt 2/3, 2172×724; portrait Tà Hỏa attempt2 là style ref duy nhất. Prompt, hash, ordered ref, output path/hint và QA trong NGUON.md + `*.prompt.txt` + `*.source.json`. | 2026-10-27 | Owner đã chốt concept; chưa formal GitHub PR review, không animation/import; không sửa `art/CREDITS.md`. |
