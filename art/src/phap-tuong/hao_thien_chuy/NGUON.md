# Hạo Thiên Chùy — RAW concept turnaround (#1024)

Lượt 1 (FAIL: texture mềm/nhiễu) không đưa vào PR này; chỉ giữ lượt 2 đã được chủ repo chốt. Nguồn: PR #1083 của tthoadev, tích hợp qua PR mới (Part of #1024).

## Attempt 2/3 — concept turnaround, chủ repo chốt ĐẠT

`concept-turnaround-attempt2.png`: 2172×724, 1,147,628 byte, SHA256 `631ac2ef55e230875ee2452b5dac9c634829ed09642d9666824e2a20f0e664af`; PNG có alpha, bản sao khớp byte với output gốc. Prompt chính xác nằm ở `concept-turnaround-attempt2.prompt.txt`, SHA256 `cd8c9097ec72444e8adf3b97fcb4eba549e445d6da3c9c913b19bf71f4b34348`.

Đây là **lượt 2/3**, attempt1 không đưa vào PR này; còn tối đa một lượt trong giới hạn đã duyệt. Tham chiếu duy nhất, theo đúng thứ tự, là ảnh mới đã được chủ repo cho phép dùng làm tham chiếu phong cách: `art/src/vohon-v2/ta_hoa_phuong_hoang/portrait-attempt2.png`, SHA256 `dd0fdb1cfeb6042cc1a2ed6f0a6c7a254005120e1eaab3fb575ca917ec7ad85f`. Không dùng ảnh PixelLab / Gemini cũ. Model, seed và thời gian sinh: unknown (tool không cung cấp).

Chủ repo chốt **ĐẠT concept** trong [comment #6430325821](https://github.com/nguyenbinhanltv/soul-land-mmo/pull/1083#issuecomment-6430325821): khối đá lớn, mạch dung nham dày, một dải đồng và ấn văn giữa đúng hướng pixel rõ, bá đạo. Năm hình trong RAW thực chất là **ba góc nhìn độc lập**: hai cặp gương và một mặt trước; do búa đối xứng, hướng `ne` / `n` sẽ dùng lại mặt trước theo quyết định owner. Không cần attempt 3.

Phê duyệt này chỉ chốt **concept hình dáng**; đây chưa phải sprite cuối, chưa import và chưa tạo hoạt ảnh. Ghi chú QA kỹ thuật: ảnh không gắn nhãn hướng; cặp trong/ngoài nhìn như cặp gương như owner xác nhận; shading mềm và một ít texture mịn vẫn còn trong RAW. Không crop, resize hay sửa RAW.

Full tool response được lưu trong session store với key `soul-land-1024-hao-thien-concept-attempt2-full-response`; `output_hint` nguyên văn, prompt, ordered reference/hash và thông tin file được ghi trong `.source.json`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phap-tuong/hao_thien_chuy/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | RAW concept attempt 2/3, 2172×724; portrait Tà Hỏa attempt2 là style ref duy nhất. Prompt, hash, ordered ref, output path/hint và QA trong NGUON.md + `*.prompt.txt` + `*.source.json`. | 2026-10-27 | Owner đã chốt concept; chưa formal GitHub PR review, không animation/import; không sửa `art/CREDITS.md`. |
