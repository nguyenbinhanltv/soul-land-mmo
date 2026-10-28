# BOARD v3 — Hồn Quang Tiên Môn

Part of #877; công việc #1260. Candidate để chủ repo chọn hướng, **chưa duyệt nhập kit**.

- Nguồn: Codex, công cụ OpenAI `image_gen` tích hợp; công cụ không trả model ID. Không dùng ảnh tham chiếu ngoài.
- Ảnh chọn: `BOARD-v3.png`, nguyên byte từ lượt 3; 1536×1024, 3:2. Không hậu kỳ, resize, lượng tử, cắt hoặc nhập.
- Prompt thật đã gửi: `BOARD-v3.prompt.txt`, sinh từ `ui-sheet-prompt.mjs --kind BOARD --style hon-quang`. Sau sinh ảnh có sửa bộ lọc để loại thêm bài học chất liệu hướng B; tệp prompt này giữ đúng bản đã gửi, không viết lại theo bản công cụ mới.
- Điều khoản: đầu ra OpenAI; không tự gán CC0. Ghi công tại `art/CREDITS.md`.

## Tự duyệt 3 lượt

| Lượt | Thay đổi duy nhất | Kiểm máy | Soát bằng mắt |
|---|---|---|---|
| 1 | Bản đầu | BOARD 1536×1024 đạt, 0 chặn / nhẹ / cảnh báo về cỡ | Đủ bố cục nhưng dải năm ô thiếu vật phẩm, không chọn |
| 2 | Bắt buộc viên ngọc bạc trong năm ô | BOARD 1536×1024 đạt, 0 chặn / nhẹ / cảnh báo về cỡ | Đủ vật phẩm và màu hồn hoàn, góc theo hạng chưa rõ |
| 3 | Làm rõ hình góc theo hạng ở thang xám | BOARD 1536×1024 đạt, 0 chặn / nhẹ / cảnh báo về cỡ | Chọn: góc thay đổi rõ, đủ nội dung, không chữ lạc; còn chặn màu / lưới pixel sản xuất |

Đã dùng hết 3 lượt. Không dùng ảnh lỗi làm tham chiếu, không sinh thêm.

## Phiếu BOARD chọn

`ui:check --kind BOARD` **chỉ kiểm cỡ**, không xác nhận lưới pixel / bảng màu. Có thể chạy lại:

```sh
npm run ui:check -- art/src/ui-kit/candidates/hon-quang-v3/BOARD-v3.png --kind BOARD --out <thư mục ngoài repo>
```

- Bố cục: HUD ba thanh, sáu nút (2×3); bảng Mực sáu ô (3×2); Xếp Hạng ba tab, năm hàng và hạng bản thân; Giấy ba thanh đọc, hai nút; hotbar tám ô; dải năm viên ngọc bạc cùng mẫu, năm vòng trắng / vàng / tím / đen / đỏ. Không chồng bảng, hàng / cột thẳng và khoảng cách tương đối đều.
- Nhất quán: Mực lam đen, Giấy ngà, đồng cổ và ngọc mờ; góc cùng họ, trang trí chủ yếu tại góc / giữa cạnh; hồn lực là vùng sáng chính. Chữ / số / dấu chu sa chứa ký tự: không thấy.
- Nhẹ: hình góc có phân hạng nhưng chưa đúng tuyệt đối số góc khuyết 0–4; cỡ ô so hạng / khung ngoài chênh vài pixel, cần dựng lại theo lưới master khi làm tờ O. Nét giấy / viền chưa hoàn toàn phẳng.
- **Chặn nhập**: 131.160 màu RGB (đếm trực tiếp ảnh gốc), vượt 40 màu; còn nội suy / chuyển sắc và chưa chứng minh lưới pixel 2×. Ảnh concept không thay được kiểm F/N/O/T, 9-slice, ba nền / ba cỡ / DPR 1 và 2.

LỖI: BOARD-v3 — màu — 131160 màu RGB, vượt 40; lưới — có nội suy, chưa đạt master pixel 2×; chỉ nộp duyệt hướng, không cắt / nhập.

Kit hiện hành, manifest, token, ảnh trong `shared/assets` và client không đổi. Chủ repo xem BOARD trước khi quyết định làm lại F/N/O/T.
