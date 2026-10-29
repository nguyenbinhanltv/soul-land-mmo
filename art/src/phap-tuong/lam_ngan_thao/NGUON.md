# Pháp tướng Lam Ngân Thảo vẽ lại (#1324)

Part of #1306, epic #1020. Chỉ mẫu Lam Ngân Thảo; các võ hồn tiếp theo chờ chủ repo duyệt.

- Công cụ: Codex, built-in `image_gen.imagegen`; model và seed không được công cụ công bố.
- Ngày: 2026-10-30. Nguồn tham chiếu: `shared/assets/sprites/vohonanim/lam_ngan_thao_f.png`, chỉ lấy motif và màu; không lấy chỗ rỗng nộm.
- Pháp tướng độc lập: thân cỏ xoắn đặc, không nộm / người; nền RAW #FF00FF, không chữ.
- RAW được sao chép nguyên byte từ đầu ra công cụ, không sửa trực tiếp. Tờ vuông 1254×1254 được cắt theo tỉ lệ.
- Prompt gốc: STYLE + NEGATIVE ở `docs/art/vo-hon-phong-cach.md` mục 6 (đổi nền thành #FF00FF), SPIRIT và SHEET ở `docs/art/phap-tuong-codex-ve-lai.md`. Các file `.prompt.txt` ghi yêu cầu theo hướng và chỉnh sửa.

## Nhật ký lượt

| Hướng | Lượt | Kết quả |
|---|---:|---|
| s | 1 | Loại: 3:2, phần ngọn giống đầu quỷ |
| s | 2 | Vuông, đã bỏ mặt; loại vì hai khung đánh dính |
| s | 3 | Chọn: thu đồng đều, có khoảng trống giữa ô; còn viền nền cần cutter gỡ |
| se | 1 | Loại: cutter phát hiện khung đánh chạm mép |
| se | 2 | Loại: dây ở đỉnh đòn còn vượt ô |
| se | 3 | Chọn để duyệt: đã gọn trong ô; **không giữ đỉnh ở khung 13**, chưa đạt toàn bộ quy cách động tác |
| e | 1 | Loại: đầu dây đánh chạm mép phải |
| e | 2 | Chọn: thu toàn bộ hình, đầu dây nằm trong ô |
| ne | 1 | Loại: khung 13 lấn lên hàng trên |
| ne | 2 | Chọn: thu đồng đều, đỉnh đòn nằm trong ô |
| n | 1 | Loại: khung 13 lấn lên hàng trên |
| n | 2 | Chọn: quay lưng, giữ ngọn vươn lên trong ô |

Không chạy song song job sinh ảnh. Không hướng nào quá ba lượt.

## Hậu kỳ

`node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/lam_ngan_thao shared/assets/sprites/phaptuong/lam_ngan_thao.png`

Cutter khóa nền dung sai 60, loại màu viền ám hồng của cây xanh (bộ lọc này chỉ dành Lam Ngân Thảo), bỏ phiếu màu khi thu, chuẩn hóa chiều cao thở theo hướng bằng một hệ số mỗi tờ, căn chân từng khung về (80,124); giữ chung hệ số trong từng hướng để đòn đánh không co giãn. Ghép s/se/e/ne/n, 8 thở rồi 8 đánh, giới hạn bảng trung gian 5 bit mỗi kênh trước lượng tử tối đa 48 màu, alpha 0/255. Lớp sáng đã dựng lại bằng `buildGlow` từ sheet mới. SHA256 của năm RAW ở `SHA256.json`.

## Kiểm tra

- Hai bài test cutter đạt: thứ tự / neo chân / alpha và từ chối đầu vào lỗi.
- `npm run check` đạt cả trước và sau khi nhập sheet.
- `npm run build` và `npm run test:phaptuong --prefix client` đạt; bot RAM `npm run bot:local -- --only combo`: 34 đạt, 0 lỗi.
- `ui:check --kind I`: tìm được lỗi dính ở s lượt 2; s lượt 3 hết lỗi dính, còn báo viền ám hồng và số màu theo giới hạn UI (32), khác giới hạn pháp tướng (48). Kiểm thành phẩm trên nền tối sau cutter.
- `phuthe:check`: không áp dụng trực tiếp, công cụ đòi toA 6×4 quanh nộm, khác tờ pháp tướng 4×4 độc lập.
- Chủ repo đã duyệt mẫu qua ảnh trong game và chấp nhận hạn chế hướng se (thông báo qua phiên điều phối soul_land_game-815, 2026-10-30).
- Hạn chế đã biết: hướng se chưa giữ đỉnh ở khung 13; đã dùng đủ ba lượt, chủ repo chấp nhận và yêu cầu không sinh thêm. Bỏ nháp PR khi CI xanh.
