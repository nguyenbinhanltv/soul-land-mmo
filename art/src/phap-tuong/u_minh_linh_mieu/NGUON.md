# Pháp tướng U Minh Linh Miêu (#1435)

Part of #1435. RAW checkpoint đã gộp ở #1436; PR #1478 nhập thân + glow + credits. Không tự đóng issue.

## Nguồn

Codex builtin `image_gen.imagegen`, ngày 31/10/2026; không trả model ID / seed. Đầu ra AI theo điều khoản OpenAI, không gán CC0. RAW nguyên byte, prompt thật cạnh ảnh. SHA256 và kích thước native từng file ở `SHA256.json` / `native-sizes.json`.

Tham chiếu hình, màu, motif: `shared/assets/sprites/vohonanim/u_minh_linh_mieu_{b,f}.png` và `shared/assets/sprites/vukhianim/u_minh_linh_mieu_{b,f}.png` trên main `3ae2cbb8427ec7535fedc8f1fb3262ab6e0c7bb3`. Đã xem cả bốn sheet; đính kèm lớp f, các hướng sau thêm mẫu nam lượt 2. Không dùng ảnh hỏng làm ảnh dẫn. Báo tím đen đặc, vai nhô, vuốt dài, viền tím; không nộm / khoảng rỗng hình người.

## Nhật ký lượt

| Hướng | Đã dùng | Tờ chọn | Lượt loại | Kết quả |
|---|---|---|---|---|
| s | 2 | `s.png` | `s-luot1.png` | Lượt 1 trả ngang 1448×1086; lượt 2 vuông, qua cutter. |
| se | 2 | `se.png` | `se-luot1.png` | Lượt 1 chạm ô; lượt 2 chỉ sửa khoảng cách, qua cutter. |
| e | 2 | `e.png` | `e-luot1.png` | Lượt 1 chạm ô; lượt 2 chỉ sửa khoảng cách, qua cutter. |
| ne | 2 | `ne.png` | `ne-luot1.png` | Lượt 1 chạm ô; lượt 2 chỉ sửa khoảng cách, lưng chếch phải, qua cutter. |
| n | 2 | `n.png` | `n-luot1.png` | Lượt 1 chạm ô; lượt 2 chỉ sửa khoảng cách, mặt lưng không mắt, qua cutter. |

Một job mỗi lần, không vượt ba lượt. Tờ chọn native 1254×1254 đã được orchestrator cho phép; giữ nguyên byte, không co giãn ngoài cutter. Tờ ngang lượt loại giữ nguyên để đối chiếu.

## Nhập và kiểm

Lệnh: `node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/u_minh_linh_mieu shared/assets/sprites/phaptuong/u_minh_linh_mieu.png --no-despill`. Giữ viền tím, không dùng bộ lọc hồng riêng Lam Ngân Thảo. Kết quả 80 khung 160, 48 màu, hệ số 0,6028. Glow từ chính sheet Codex bằng `buildGlow` của `phuthe-to-phaptuong-lib.mjs`, màu #b06bff (phần dựng glow của CLI `--glow`, không ghi đè thân bằng bản phụ thể cũ). Recipe và hash thành phẩm ở `recipe.json`.

Đăng ký `pt_u_minh_linh_mieu` / `_glow` bằng validate, thêm glow với `--keep-order`, credits do công cụ sinh. Xem trong game `/choi/?thu=phaptuong&vh=u_minh_linh_mieu&auto=1&danh=1`, đủ năm hướng thở / đánh, âm thanh tắt; gallery phiên AO885. Client flashHit trắng chung được sửa trong PR code riêng theo #1435 / #1457, không sửa server hay checker trong PR art này.

Chạy lại `npm.cmd run check` và test pháp tướng client sau nhập; không tự merge.
