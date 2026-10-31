# Nền bản đồ thế giới — Giấy / Mực

Nguồn: Codex, công cụ tích hợp OpenAI `image_gen.imagegen`, ngày 31/10/2026. Model ID và seed không được công cụ cung cấp, để `null` trong `source.json`. Không dùng ảnh thương mại hay asset ngoài làm đầu vào. Agent xem BOARD của repo để hiểu chất liệu; lần gọi model chỉ gửi văn bản, không gửi BOARD.

Ảnh AI tạo theo yêu cầu chủ repo, quyền sử dụng theo điều khoản đầu ra OpenAI; **không CC0**. Prompt thật: `nen-the-gioi.prompt.txt`. Hash SHA-256 ảnh, prompt, bố cục và dữ liệu nguồn ở `source.json`. `nen-the-gioi.png` giữ nguyên byte đầu ra; không cắt, đổi màu, lượng tử hay phóng nội suy.

Chọn lượt **1/1 đã sinh, tối đa 3**. Tự xem ảnh: đủ thành, thôn, núi tuyết, rừng với suối đôi, biển và đảo, rừng sâu với hồ; không thấy chữ, logo, nhãn hay tuyến cổng vẽ sẵn. Các nét địa hình / sông là minh họa, không phải dữ liệu đi đường. Ảnh 1672×941, tỷ lệ lệch 16:9 khoảng 0,05%; chấp nhận theo quy tắc tỷ lệ của skill ui-kit. Chủ repo yêu cầu tranh vẽ tay liền mạch nên không áp dụng bộ cắt tờ F/N/O, giới hạn màu sprite hay 9-slice cho tranh này.

Ảnh đã duyệt và được nhập vào client (bản chép nguyên byte ở `shared/assets/ui/ban-do-the-gioi/`, tải thẳng bằng URL, không qua manifest). Trang `xem-truoc.html` chỉ minh họa tọa độ phủ code; không thực hiện truyền tống.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/world-map/nen-the-gioi.png` | `world_map_giay_muc` | Codex / OpenAI image_gen.imagegen | `nen-the-gioi.prompt.txt` | 2026-10-31 | Đầu ra AI theo điều khoản OpenAI, không CC0; lượt 1, RAW nguyên byte, SHA-256 ở source.json |

Mục trong `art/CREDITS.md` là nguồn cho công cụ `tools/assets/credits.mjs`; bảng này phục vụ hồ sơ asset, không được cộng thêm lần nữa.
