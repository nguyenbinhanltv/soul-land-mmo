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
| Cửu Tinh Thất Sát Kiếm | Đủ | Đủ | Tách PR icon riêng |
| Lam Điện Bá Vương Long | Đủ | Đủ | Tách PR icon riêng |
| Kỳ Nhung Thông Thiên Cúc | Đủ | Đủ | Tách PR icon riêng |
| Tà Hỏa Phượng Hoàng | Đủ | Đủ | Tách PR icon riêng |
| Hạo Thiên Chùy | Đủ | Đủ | Tách PR icon riêng |
| Phá Hồn Thương | Đủ | Đủ | Tách PR icon riêng |
| Bạch Hổ | Đủ | Đủ | Tách PR icon riêng |
| U Minh Linh Miêu | Đủ | Đủ | Tách PR icon riêng |
| Nguyệt Nhận | Đủ | Đủ | Tách PR icon riêng |
| Hỏa Long | Đủ | Đủ | Tách PR icon riêng |
| Nhu Cốt Thố | Đủ | Đủ | Tách PR icon riêng |
| Kim Vũ Miêu Ưng | Đủ | Đủ | Tách PR icon riêng |
| Liệt Hỏa Thương Lang | Đủ | Đủ | Tách PR icon riêng |
| Tử Vong Chu Hoàng | Đủ | Đủ | Tách PR icon riêng |
| Bích Lân Xà Hoàng | Đủ | Đủ | Tách PR icon riêng |
| Càn Khôn Hỗn Nguyên Tỏa | Đủ | Đủ | Tách PR icon riêng |
| Hỏa Ảnh | Đủ | Đủ | Tách PR icon riêng |
| Yêu Hồ | Đủ | Đủ | Tách PR icon riêng |
| Lam Ngân Thảo | Đủ | Đủ | Tách PR icon riêng |
| Băng Phượng Hoàng | Đủ | Đủ | Tách PR icon riêng |
| Xúc Xích | Đủ | Đủ | Ảnh24/32 ở PR này; khóa ở #1263 |
| Quỷ Mị | Đủ | Đủ | Tách PR icon riêng |
| Thiên Càn Bạch Ngọc Đỉnh | Đủ | Đủ | Tách PR icon riêng |
| Cửu Bảo Lưu Ly Tháp | Đủ | Đủ | Tách PR icon riêng |
| A Ngân | Đủ | Đủ | Tách PR icon riêng |

## Icon tách PR riêng

Theo quyết định ca đêm: PR này chỉ nhập chân dung/thẻ (làn nhanh). PR icon riêng sẽ thêm khóa24/32, dùng lượng tử hóa công cụ về tối đa32 màu, không sinh RAW mới và không nới trần màu.

Xúc Xích được duyệt thêm tối đa3 lượt: đã chọn lượt4 (lượt1 bổ sung), một vật duy nhất/nền phẳng, không cần lượt5–6. Nguồn và ảnh24/32 tối đa32 màu ở PR này theo chỉ định; khóa/client ở PR1263 dựa trên PR1262. Hồ sơ ở xuc_xich/NGUON.md.

## Duyệt mắt

Đã xem cả 25 chân dung ở 1× và 2×; giữ nguyên màu/khối của các lô trước. Các cảnh báo NHẸ vẫn tồn tại: nền và thân gần màu, nhiều nét nhỏ. Kỳ Nhung thiên về mặt nạ; Cửu Bảo cắt tầng; Xúc Xích có nhiều vật phụ. Tà Hỏa lượt 3 còn đủ 8/8 điểm sáng sau portrait2; không sinh lượt thứ tư. Đây là các giới hạn mỹ thuật cần chủ repo cân nhắc khi xem PR; không khai thành ĐẸP hoặc xóa cảnh báo máy.
