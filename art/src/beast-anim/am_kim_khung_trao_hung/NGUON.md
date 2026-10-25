# Ám Kim Khủng Trảo Hùng — H4 #767

Part of #767, thuộc #766. Tờ A candidate 1/10 của batch, chưa owner duyệt mỹ thuật/runtime. Ngày 2026-10-26, fresh worker soul-land-mmo-63.

Sinh bằng builtin `image_gen.imagegen`, không có size/model selector, không trả model ID/seed. Hai lượt cùng tờ A trong phiên63; chọn A2 vì attack/hurt rõ hơn A1. Dừng ở giới hạn 2 lượt; không vẽ tờ B hay loài khác trong phiên này.

Prompt mẫu nguyên vẹn từ script ở `am_kim_khung_trao_hung-toA.md`; prompt thực `toA.prompt.txt` thêm đoạn làm rõ trục hurt/die và góc se. Chỉ reference ảnh tĩnh đúng loài `shared/assets/sprites/beast/am_kim_khung_trao_hung.png`, đã xem trước. Nguồn/giấy phép ảnh tĩnh đã có trong CREDITS. Không tham chiếu loài khác hoặc ảnh thương mại.

Raw A2 1024×1536, lưới 6×12 s/se/e, 66 vị trí hình và sáu ô trống H4/H8/H12 C5–6 theo bố cục yêu cầu. Quan sát ảnh raw, chưa cutter/preview. Giữ nguyên byte, không cắt/hậu kỳ/resize/quantize/đổi metadata. `toA.source.json` ghi hash/params/reference/lịch sử. A1 và A2 đầy đủ ở artifact worker63 ngoài Git.

## Ô nghi lỗi (hàng/cột từ 1)

- H1 C5 và H5 C5: hurt ngửa đầu, cần kiểm đủ giật lùi và giữ hướng s/se.
- H4 C1–4: die đổi trục nam, C3–4 đầu quay trái; cần owner xem toàn chu kỳ.
- H8 C3–4 và H12 C3–4: die nằm quay về người xem, nghi sai trục se/e.
- H5–7 C1–6: kiểm se đủ khác e; H7 C3–4 thân vồ rộng, cần kiểm mép ô.
- H11 C3–4: attack đầu/thân hơi xoay trước, cần kiểm trục e.
- Toàn tờ: chưa cắt/preview, chưa xác nhận loop và độ khớp cỡ với ảnh tĩnh.

Mỗi tờ tiếp theo phải phiên mới. B cần cả ảnh tĩnh và A selected; A2 mới là candidate, chưa owner duyệt. Không coi ngoại lệ offsize H2 là acceptance H4; A2 hiện đúng kích thước yêu cầu. Owner repo cắt/preview/duyệt/nhập game. Không sửa runtime/manifest/client/server/shared/DB.
