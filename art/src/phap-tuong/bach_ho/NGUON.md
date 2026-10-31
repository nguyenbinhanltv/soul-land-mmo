# Pháp tướng Bạch Hổ (#1457)

Đã nhập đủ năm hướng và glow tại PR #1476; chưa merge. Part of #1457.

Nguồn: OpenAI / Codex image_gen tích hợp, 31/10/2026; công cụ không trả model ID/seed. Dùng theo điều khoản đầu ra OpenAI, không gán CC0. RAW giữ nguyên byte, không resize. Điều phối đã chấp nhận RAW vuông native 1254×1254.

Tham chiếu hình/màu/motif: `shared/assets/sprites/vohonanim/bach_ho_{b,f}.png` và vũ khí `vukhianim/bach_ho_{b,f}.png`. Hổ ngồi uy nghi, thân xám lạnh, mảng lông sáng trắng, vằn đen dày, mắt vàng; không chép khoảng rỗng hình người.

STYLE/NEGATIVE theo `docs/art/vo-hon-phong-cach.md`, quy cách theo `docs/art/phap-tuong-codex-ve-lai.md`. Một job mỗi lần, tối đa ba lượt mỗi tờ.

## Nhật ký lượt

| Hướng | Lượt | Kết quả |
| --- | ---: | --- |
| s | 1 | 1254×1254, đúng lưới nhưng cutter phát hiện điểm hình sát ranh ô. Không chọn. |
| s | 2 | 1322×1190 không vuông, loại. |
| s | 3 | Chọn RAW 1254×1254, hình gọn; đỉnh đầu nguyên vẹn của hàng cuối đi qua đường chia ô. Dùng padding nguyên cụm, không sinh lượt 4. |
| se | 1 | Chọn 1254×1254, cutter đạt 48 màu. |
| e | 1 | Chọn 1254×1254, cutter đạt 48 màu, nhìn ngang phải. |
| ne | 1 | Chọn 1254×1254, cutter đạt, nhìn chếch phải lên. |
| n | 1 | Chọn 1254×1254, cutter đạt, quay lưng. |

Đủ năm hướng. Padding chỉ dịch/đệm, không co giãn/vẽ thêm, giữ RAW nguyên byte theo cách điều phối đã duyệt; giữ đủ điểm hình, đúng 16 cụm tách rời, không bị cắt ở RAW trước khi nhập.

## Tiếp quản và tái tạo sau merge main

Worker 909 chỉ đọc/sao chép nguồn từ worktree 892, không sửa nguồn cũ. RAW nguyên byte; kích thước và SHA256 từng ảnh tại `SHA256.json`. Các lượt s/se/e/ne/n = 3/1/1/1/1; không sinh thêm Bạch Hổ.

Lệnh padding: `node art/src/phap-tuong/bach_ho/padding-s.mjs <tmp>`; cutter: `node tools/assets/phaptuong-sheet-cut.mjs <tmp> shared/assets/sprites/phaptuong/bach_ho.png`. Padding giữ đủ 342332/342332 điểm hình, đúng 16 cụm, không co giãn/vẽ thêm. Cutter chuẩn ghép 80 khung, 48 màu, hệ số 0,5846. Glow tái sinh bằng `buildGlow` màu #f2f2f6. Đăng ký thân và glow bằng validate, sinh lại credits sau merge main theo #1483.

## Xem trong game

Chrome headless thật với `--mute-audio`, noAudio của trang thử, năm hướng s/se/e/ne/n, thở và sáu pha đánh mỗi hướng: 35 ảnh, không pageerror. `game-preview.png`: năm cột theo hướng, hàng đầu thở, sáu hàng sau đánh. Thân hổ liền, không cột hình người, ne/n đọc được ở alpha trước thân 0,7. Giữ display scale=1, dx=0, dy=0. Hạn chế: động tác đánh nhỏ, không giữ rõ đỉnh ở mọi hướng; chấp nhận theo phạm vi mẫu #1326, không vượt ba lượt.

Chrome đã xác nhận tải `bach_ho_glow.png` sau đăng ký manifest. Kiểm kỹ thuật: check đầy đủ, build, test:phaptuong và bốn bài credits test đều đạt.
