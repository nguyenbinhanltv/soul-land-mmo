# Pháp tướng Yêu Hồ vẽ lại — #1456

- Công cụ Codex built-in image_gen.imagegen, không công bố model/seed; ngày 2026-10-31.
- Tham chiếu vohonanim/yeu_ho_{b,f}.png và vukhianim/yeu_ho_{b,f}.png trên main 1de8f12d4a53751c348f17126c77cf419ab5c602, chỉ lấy hình/màu/motif. Không chép khoảng rỗng nộm.
- RAW native vuông1254×1254 nguyên byte như kích thước orchestrator đã chấp nhận. Không sửa/thu RAW ngoài cutter. Prompt đầy đủ cùng tên; SHA256 ở bảng cuối và SHA256.json.
- s/se/e/ne/n dùng và chọn3/1/1/1/1; không hướng nào quá3 lượt.

## Nhật ký

| Hướng | Lượt | Kết quả |
|---|---:|---|
| s | 1 | Loại: các nhánh lông phía dưới dễ đọc thành năm đuôi. |
| s | 2 | Đúng ba đuôi nhưng cutter chặn đuôi ở ô s/11 chạm mép. |
| s | 3 | Chọn: thu toàn hình, ba đuôi độc lập, cutter đạt. |
| se | 1 | Chọn: mặt hẹp, ba đuôi quét phải-xuống; cutter đạt. |
| e | 1 | Chọn: nhìn ngang phải, ba đuôi quét tới; cutter đạt. |
| ne | 1 | Chọn: lưng chếch phải, ba đuôi quét phải-lên; cutter đạt. |
| n | 1 | Chọn: quay lưng hoàn toàn, ba đuôi dựng/quét lên; cutter đạt. |

## Tái tạo

`node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/yeu_ho shared/assets/sprites/phaptuong/yeu_ho.png --no-despill`

Không lọc viền hồng thật của thân. Cutter chuẩn blob và hash sheet/glow ở recipe.json; 2560×800,80 khung160,48 màu,alpha0/255,gốc(80,124),8 thở+8 đánh. Glow từ buildGlow của phuthe-to-phaptuong-lib, màu #ff9ad5, cùng đường công cụ --glow, không tái chuyển thể thân cũ. validate.mjs đăng ký, credits.mjs sinh credits. appendManifestEntry giữ UI Kit cuối manifest. Không sửa mã game hoặc display/cân bằng.

## Kiểm trong game

Chrome headless --mute-audio, SwiftShader; màn thử thật /choi?thu=phaptuong&vh=yeu_ho. Đã xem khung thở và đỉnh đánh đủ5 hướng; script tạm dừng vòng render tại cột thở2–4/đánh11–12 để chụp đúng ảnh thật. Giảm chuyển động bật để tắt flashHit trắng, Cut-in tắt; sheet vẫn chạy; noAudio=true. Thân/ba đuôi liền, không cột tối; ne/n còn đọc được alpha70%. Mép hồng thật/glow vẫn nổi trên nền tối, giữ bằng --no-despill. Các hướng khác nhẹ về tỉ lệ đầu/đùi do RAW sinh riêng; không có chỗ rỗng hình người.

Gallery chung tại artifact phiên AO891 có ảnh thở/đỉnh năm hướng. Không đổi server/SQL, không chạy PostgreSQL; không tự merge.

## RAW native và SHA256

| RAW | Native | SHA256 |
|---|---|---|
| e.png | 1254×1254 | c3bcdf9d8cef2744d8982b82b1c8dc8df6d1cc639a2c681449785bacf3ab844f |
| n.png | 1254×1254 | 8d5a56aa61995707753bb3ba715570cf198c233f28678e2e8731666e4857f179 |
| ne.png | 1254×1254 | 386df27f93bac446e07da657da82142d9f169663fded7694bed72841210f3a3d |
| s-v1.png | 1254×1254 | 91b2ea49f9dce90c7fd0e8a64fc73b45ed860c78cadfc76f318ac8d26af098a0 |
| s-v2.png | 1254×1254 | 01580229aaac4cb5473b28709cde27a1ed13b6c3198d2a13a464eb324be154c2 |
| s.png | 1254×1254 | 0e0748873dcac309b3767abb904cfb5b936d8bc8065584e818fb0c66d5d70428 |
| se.png | 1254×1254 | ca5ed7977a60b8bc4a37d46b2ab4cc031338e66a57188396b79b9c56f07d58ac |

Kiểm trước PR: npm run check, npm run build, test:phaptuong client và ui-import --check đều đạt.
