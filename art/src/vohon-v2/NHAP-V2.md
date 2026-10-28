# Nhập chân dung võ hồn v2 — #1158, #1159

Ngày 29/10/2026. Đối chiếu main 8160f9bb: lô 1–3 đã lưu nguồn Codex nhưng chưa nhập game. Trước PR này, 25 file chân dung game không trùng ứng viên portrait2; icon v2 chưa có khóa manifest.

## Phần đã nhập

25 chân dung 64×64, 16 màu, alpha đặc: 24 bản lấy nguyên byte từ `candidates/portrait-attempt1-P1c2/`; Tà Hỏa chuyển RAW lượt 3 bằng lệnh dưới. Không sinh RAW mới, không vượt giới hạn 3 lượt. Nguồn và prompt từng võ hồn ở thư mục tương ứng; ghi công thành phẩm ở `art/CREDITS.md`.

```sh
node tools/assets/vohon-pixelize.mjs --type portrait --id ta_hoa_phuong_hoang --in art/src/vohon-v2/ta_hoa_phuong_hoang/portrait-attempt3.png --out <tmp> --preset portrait2
```

Manifest đã có đủ 25 khóa `portrait_<id>` và ba khung `card_sr/ssr/ur`; đăng ký lại bằng validate không đổi manifest. `client/src/cards.ts` dùng trực tiếp các khóa này nên thẻ nhận chân dung mới. Không vẽ thêm 25 khung thẻ trùng ba khung độ hiếm.

## Bảng đủ / thiếu trong game

| Võ hồn | Chân dung portrait2 | Thẻ dùng chân dung v2 | Icon 24/32 nearest |
|---|---|---|---|
| Cửu Tinh Thất Sát Kiếm | Đủ | Đủ | Đủ 24/32 |
| Lam Điện Bá Vương Long | Đủ | Đủ | Đủ 24/32 |
| Kỳ Nhung Thông Thiên Cúc | Đủ | Đủ | Đủ 24/32 |
| Tà Hỏa Phượng Hoàng | Đủ | Đủ | Đủ 24/32 |
| Hạo Thiên Chùy | Đủ | Đủ | Đủ 24/32 |
| Phá Hồn Thương | Đủ | Đủ | Đủ 24/32 |
| Bạch Hổ | Đủ | Đủ | Đủ 24/32 |
| U Minh Linh Miêu | Đủ | Đủ | Đủ 24/32 |
| Nguyệt Nhận | Đủ | Đủ | Đủ 24/32 |
| Hỏa Long | Đủ | Đủ | Đủ 24/32 |
| Nhu Cốt Thố | Đủ | Đủ | Đủ 24/32 |
| Kim Vũ Miêu Ưng | Đủ | Đủ | Đủ 24/32 |
| Liệt Hỏa Thương Lang | Đủ | Đủ | Đủ 24/32 |
| Tử Vong Chu Hoàng | Đủ | Đủ | Đủ 24/32 |
| Bích Lân Xà Hoàng | Đủ | Đủ | Đủ 24/32 |
| Càn Khôn Hỗn Nguyên Tỏa | Đủ | Đủ | Đủ 24/32 |
| Hỏa Ảnh | Đủ | Đủ | Đủ 24/32 |
| Yêu Hồ | Đủ | Đủ | Đủ 24/32 |
| Lam Ngân Thảo | Đủ | Đủ | Đủ 24/32 |
| Băng Phượng Hoàng | Đủ | Đủ | Đủ 24/32 |
| Xúc Xích | Đủ | Đủ | Thiếu: hết 3 lượt RAW |
| Quỷ Mị | Đủ | Đủ | Đủ 24/32 |
| Thiên Càn Bạch Ngọc Đỉnh | Đủ | Đủ | Đủ 24/32 |
| Cửu Bảo Lưu Ly Tháp | Đủ | Đủ | Đủ 24/32 |
| A Ngân | Đủ | Đủ | Đủ 24/32 |

## Icon đã nhập và trường hợp còn thiếu

Đã nhập nguyên byte 48 icon nearest của 24 võ hồn từ lô 1–3, có khóa `icon_<id>_24/32` và file `iso/portrait/<id>_icon24/32.png`. Bộ nhập kiểm đúng võ hồn, đúng cỡ, alpha 0/255 và có cả vật/nền trong suốt; riêng loại này giữ màu RAW theo preset. Các loại icon/chân dung khác vẫn giữ trần màu cũ. Đăng ký bằng `validate --register ... --iso --keep-order` để tránh sắp xếp lại manifest. Client đọc khóa mới qua `artUrl`; dải chọn võ hồn bảng Nhân vật dùng bản 24 px, thiếu ảnh thì giữ chữ.

**Xúc Xích:** ba lượt RAW đều có nhiều chiếc phụ, hồ sơ chưa chọn bản nào. Thử crop từ RAW lượt 3 (`--crop 350,90,420,420`) vẫn không đạt: hình cắt cụt, không đọc ra chiếc chính ở 24/32. Không nhập, không sinh lượt thứ tư; cần chủ repo quyết định cấp thêm lượt hoặc chọn hướng khác. Các file thử chỉ ở thư mục tạm.

## Duyệt mắt

Đã xem cả 25 chân dung ở 1× và 2×; giữ nguyên màu/khối của các lô trước. Các cảnh báo NHẸ vẫn tồn tại: nền và thân gần màu, nhiều nét nhỏ. Kỳ Nhung thiên về mặt nạ; Cửu Bảo cắt tầng; Xúc Xích có nhiều vật phụ. Tà Hỏa lượt 3 còn đủ 8/8 điểm sáng sau portrait2; không sinh lượt thứ tư. Đây là các giới hạn mỹ thuật cần chủ repo cân nhắc khi xem PR; không khai thành ĐẸP hoặc xóa cảnh báo máy.
