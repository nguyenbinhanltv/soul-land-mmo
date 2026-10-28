# can_khon_hon_nguyen_toa — phụ thể hoạt ảnh lô 8

Part of #1025. Ngày 2026-10-28. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW nguyên byte, không hậu kỳ; prompt nguyên văn khối text của `phuthe-sheet-prompt.mjs --stage direction --concept-ref`. Bài học chỉ từ `art/src/phuthe-anim/lessons.md`. Mỗi tờ tối đa ba lượt.

Tham chiếu cố định: (1) bảng từng hướng trong `references/`; (2) concept riêng đã duyệt (đường dẫn và SHA256 trong source JSON từng tờ). Không dùng tờ lỗi hay phụ thể tĩnh cũ làm tham chiếu. Không dùng ảnh thứ ba. Màu thân tham chiếu: `#00D0D0`. SHA256 RAW, prompt và từng ảnh dẫn nằm trong `toX.source.json`; `raw_check` giữ báo cáo kỹ thuật từng hướng. Prompt giữ nguyên byte qua thuộc tính Git `-text`.

## Kết quả kỹ thuật

| Tờ | Lượt | Mức | Chặn | Mã cảnh báo |
|---|---|---|---|---|
| toA (s) | 2/3 | nhẹ | 0 | nen, tach-hinh, o-trong, nom-mat, cham-mep-khung, vuot-khung, nom-lech |
| toB (se) | 2/3 | nhẹ | 0 | nen, o-trong, nom-mat, nom-lech, cham-mep-khung, vuot-khung |
| toC (e) | 2/3 | nhẹ | 0 | nen, tach-hinh, cham-mep-khung, vuot-khung, nom-lech, co-phu-the |
| toD (ne) | 1/3 | nhẹ | 0 | nen, cham-mep-khung, vuot-khung, nom-mat |
| toE (n) | 2/3 | nhẹ | 0 | nen, cham-mep-khung, vuot-khung, nom-mat, co-phu-the |

Lượt hỏng lưu nguyên bộ PNG/prompt/source trong `candidates/`, không dùng làm tham chiếu hay nhập game. Chỉ cắt và nhập các tờ có 0 chặn kỹ thuật theo chỉ định chủ repo; hướng không đạt giữ phụ thể tĩnh cũ qua `dirsOk`. Neo tự động do công cụ sinh, worker khác chỉnh sau.

## Soát mắt

Cutter: 65 khung, 32 màu, **0 block / 105 warn**. Đã nhập đủ năm hướng bằng `phuthe-import.mjs`, không cần `dirsOk` hay fallback riêng hướng. Preview ghép LPC nam/nữ có đủ clip và trang xoay. Neo tự động chưa căn đẹp, để worker sau chỉnh.

Lịch sử C1: lệnh sinh bị ngắt khi phát hiện test công cụ giả định tháp chưa có concept; không có RAW được lưu. Khi chủ repo cho tiếp tục, bắt đầu C2 và đạt; tổng lượt gọi tờ C vẫn dưới trần ba. Các tờ hỏng A1/B1/E1 giữ trong `candidates/`, không dùng làm tham chiếu hay nhập.

Giữ màu đồng vàng, khóa đỏ và xích đen; vật còn lớn và cao so với thân. Góc ne và n vẫn lộ khóa mặt trước; se/e/ne chưa tách ổn định. Xích và mũi nhọn vung sát mép ở attack/cast, có phần bị xén; thân chuẩn nhỏ/dời. Không sửa RAW, neo tự động chờ worker sau chỉnh.

Các lỗi mỹ thuật trên được khai riêng, không thay đổi mức kỹ thuật của công cụ. Chưa chứng nhận căn neo đẹp trong game.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phuthe-anim/can_khon_hon_nguyen_toa/` | `vhanim_can_khon_hon_nguyen_toa_b/f` | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | RAW phụ thể lô 8, prompt CLI nguyên văn; SHA256 trong source từng tờ | 2026-10-28 | Chỉ nhập hướng 0 chặn; neo tự động chờ chỉnh |
