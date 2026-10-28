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
| Cửu Tinh Thất Sát Kiếm | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Lam Điện Bá Vương Long | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Kỳ Nhung Thông Thiên Cúc | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Tà Hỏa Phượng Hoàng | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Hạo Thiên Chùy | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Phá Hồn Thương | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Bạch Hổ | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| U Minh Linh Miêu | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Nguyệt Nhận | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Hỏa Long | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Nhu Cốt Thố | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Kim Vũ Miêu Ưng | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Liệt Hỏa Thương Lang | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Tử Vong Chu Hoàng | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Bích Lân Xà Hoàng | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Càn Khôn Hỗn Nguyên Tỏa | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Hỏa Ảnh | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Yêu Hồ | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Lam Ngân Thảo | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Băng Phượng Hoàng | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Xúc Xích | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Quỷ Mị | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Thiên Càn Bạch Ngọc Đỉnh | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| Cửu Bảo Lưu Ly Tháp | Đủ | Đủ | Chưa nhập: chặn bộ nhập |
| A Ngân | Đủ | Đủ | Chưa nhập: chặn bộ nhập |

## Icon còn chặn

Đã có nguồn nearest cho cả 25 võ hồn (lô 1–3); riêng Xúc Xích đã dùng hết 3 lượt. Icon 32 px có 164–589 màu kể cả nền trong suốt. `vohon-check pixel` miễn giới hạn màu với preset icon-nearest, nhưng `validate.mjs` vẫn áp trần PORTRAIT_MAX_COLORS (32) cho icon và UI thường; chưa có loại khóa icon võ hồn 24/32 trong sheetSpec. Client hiện chỉ dùng portrait, chưa dùng icon võ hồn riêng.

Muốn nhập nguyên bản nearest cần bổ sung công cụ và cách dùng icon ở client: đó là làn code. Không lượng tử lại màu (sai preset đã chốt), không gắn nhầm loại UI/static để lách kiểm. Chờ chủ repo chọn mở rộng phạm vi hoặc tách việc tiếp.

## Duyệt mắt

Đã xem cả 25 chân dung ở 1× và 2×; giữ nguyên màu/khối của các lô trước. Các cảnh báo NHẸ vẫn tồn tại: nền và thân gần màu, nhiều nét nhỏ. Kỳ Nhung thiên về mặt nạ; Cửu Bảo cắt tầng; Xúc Xích có nhiều vật phụ. Tà Hỏa lượt 3 còn đủ 8/8 điểm sáng sau portrait2; không sinh lượt thứ tư. Đây là các giới hạn mỹ thuật cần chủ repo cân nhắc khi xem PR; không khai thành ĐẸP hoặc xóa cảnh báo máy.
