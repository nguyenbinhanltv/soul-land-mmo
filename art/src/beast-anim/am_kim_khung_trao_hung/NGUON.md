# Ám Kim Khủng Trảo Hùng — H4 #767

Part of #767, thuộc #766. Tờ A candidate 1/10 của batch, chưa duyệt mỹ thuật/runtime. Ngày 2026-10-26, worker soul-land-mmo-63.

Sinh bằng builtin `image_gen.imagegen`; không có selector kích thước/model, không trả model ID/seed. Prompt nguyên khối từ script ở `toA.prompt.txt`; mẫu ở `am_kim_khung_trao_hung-toA.md`. Reference chỉ ảnh tĩnh đúng loài, đã xem trước. Raw 1024×1536, giữ nguyên byte, không cắt/hậu kỳ/resize/đổi metadata. Nguồn, hash, tham số thực và vị trí nghi lỗi ở `toA.source.json`.

Mỗi tờ phải phiên mới. Phiên63 chỉ tờ A; B và loài khác chưa sinh. Tờ B phải thêm ảnh tĩnh và candidate A được chọn, ghi rõ trạng thái owner duyệt.

## Ô nghi lỗi (hàng/cột từ 1)

- H1 C5–6 hurt quay đầu phải, thiếu giật lùi rõ.
- H4 C2–4 die đổi trục nam sang phải.
- H5–7 vài pose se gần e; H5 C5–6 hurt xoay mặt.
- H9 C5–6 hurt xoay khỏi hướng đông.
- H8/H12 C3–4 die cần kiểm trục và cỡ khi cắt preview.

Owner repo cắt/preview/duyệt; worker không xác nhận độ mượt hoặc nhập game.
