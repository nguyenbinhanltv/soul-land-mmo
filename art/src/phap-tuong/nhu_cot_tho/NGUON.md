# Pháp tướng Nhu Cốt Thố vẽ lại — phần đầu #1456

- Công cụ: Codex built-in `image_gen.imagegen`; không công bố model/seed. Ngày: 2026-10-31.
- Tham chiếu: `shared/assets/sprites/vohonanim/nhu_cot_tho_{b,f}.png` và `shared/assets/sprites/vukhianim/nhu_cot_tho_{b,f}.png` trên main `844ebeb1f41df0ecbb8f04f48fddd44a08a795d3`. Chỉ hình, màu, motif; không chép khoảng rỗng nộm.
- RAW sao chép nguyên byte; orchestrator chấp nhận native vuông 1254×1254 như #1326. Không thu/sửa RAW ngoài cutter. Prompt đầy đủ cùng tên `.prompt.txt`; SHA256 ở bảng cuối và `SHA256.json`.
- Năm tờ chọn `s/se/e/ne/n.png`: lượt 2/2/3/3/1; đã dùng 3/2/3/3/1. Không sinh lượt thứ tư.

## Nhật ký lượt

| Hướng | Lượt | Kết quả |
|---|---:|---|
| s | 1 | Loại: chạm mép ô. |
| s | 2 | Chọn: cutter đạt; vồ chân trước thay cú đạp chân sau. Orchestrator chấp nhận hạn chế này ngày 2026-10-31, yêu cầu ghi trên PR. |
| s | 3 | Loại, giữ s-v3.png: đúng cú đạp nhưng cutter chặn s/9 chạm mép. |
| se | 1 | Loại: canvas ngang 1402×1122. |
| se | 2 | Chọn: vuông, đạp chân sau về phải-xuống; cutter đạt. |
| e | 1 | Loại: đạp ngược hướng nhìn và chạm mép. |
| e | 2 | Loại: đạp đúng phải nhưng tai chạm mép. |
| e | 3 | Chọn: thu toàn hình, đạp sang phải; cutter đạt. |
| ne | 1 | Loại: ô đánh thứ ba chạm mép ngang. |
| ne | 2 | Loại: tai cụp, đầu tròn, quá hiền. |
| ne | 3 | Chọn: tai nhọn, lưng chếch phải; cutter đạt. Dấu đùi khác các hướng trước, hết ba lượt. |
| n | 1 | Chọn: quay lưng hoàn toàn; cutter đạt. |

## Tái tạo

`node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/nhu_cot_tho shared/assets/sprites/phaptuong/nhu_cot_tho.png --no-despill`

Cutter blob `e9189290c797aa640347b7a0229d745ab4f69075`. Giữ màu hồng tím thật bằng `--no-despill`, không dùng bộ lọc riêng Lam Ngân Thảo. Sheet 2560×800, 16×5 khung 160, gốc (80,124), 8 thở + 8 đánh; 48 màu, alpha 0/255. Glow dựng bằng `buildGlow` của `phuthe-to-phaptuong-lib.mjs` từ sheet mới, màu #ffc2e2 (cùng đường sinh glow của cờ --glow), không chuyển thể lại thân từ phụ thể. Recipe ghi cấu hình và hash thành phẩm. Giữ thông số hiển thị hiện có, không sửa shared/data.ts.

Thân/glow đăng ký bằng validate.mjs; credits.json sinh bằng credits.mjs. Manifest giữ nguyên thứ tự, chỉ thêm glow.

## Kiểm tra

- Đủ 80 khung, không rỗng/chạm mép, 48 màu, alpha nhị phân.
- npm.cmd run check, npm.cmd run build, npm.cmd run test:phaptuong --prefix client: đạt sau npm ci từ lockfile, không đổi lockfile.
- Đã xem đủ năm hướng TRONG GAME tại /choi?thu=phaptuong&vh=nhu_cot_tho&auto=1&danh=1. ne/n đọc được ở lớp trước alpha 70%; không cột tối độc lập dạng nộm; hồn sư che phần thân theo luật lớp ở s/se/e.
- Màn thử audio.noAudio=true; bật Giảm chuyển động để tắt flashHit trắng, tắt Cut-in. Sheet thở/đánh vẫn chạy; không sửa client trong PR art.
- Hạn chế: s vồ chân trước đã được chấp nhận; mép hồng tím và glow còn rõ trên nền tối. Không khử bằng bộ lọc dành thân xanh làm mất viền thật.
- Không đổi server/SQL, không chạy PostgreSQL. Không tự merge; chờ AO review và CI.

## RAW native và SHA256

| RAW | Native | SHA256 |
|---|---|---|
| e-v1.png | 1254×1254 | 274d39958ae41d614355e5ed95c1742c1958e67a8fd2edf90c5905fcbb831d6a |
| e-v2.png | 1254×1254 | e5cd250451640e67daba23623606c289b3ab410049cd7ba1b37e118d991396a9 |
| e.png | 1254×1254 | 5f7c538556bdb671c6523b08cbc1f8926836de7928f5ef957b5cc18d17407505 |
| n.png | 1254×1254 | 479ed6e27ebb5a5fb5388303a36ffc6ab220a5d491935a23671e5f7a6f8566dc |
| ne-v1.png | 1254×1254 | 81686c400d18e90e23e99aafb5a6b2d7b3d4930c1347d2b7f853c351a47a8e57 |
| ne-v2.png | 1254×1254 | 2c3f2a3fab367775686642a08ac5306518e5b9afe3142b58bafaaa8b5df9b4ef |
| ne.png | 1254×1254 | 316236391d2f535d0b32ed7221633d7ee4bcaf18368a51f4f06a7485638a5665 |
| s-v1.png | 1254×1254 | 8acae169b016fb888307b4591205797220d097ccc007b330adc5e1c1b62f3f81 |
| s-v2.png | 1254×1254 | 3cfc19864dfe88931ee5c6d697bfe8a7620ae943843f917be2bb6b84809c05d1 |
| s-v3.png | 1254×1254 | f82baf8f5c85e3cef5833c1f2a50c95f53d29f7efefe4cde96b94347b77e89de |
| s.png | 1254×1254 | 3cfc19864dfe88931ee5c6d697bfe8a7620ae943843f917be2bb6b84809c05d1 |
| se-v1.png | 1402×1122 | b7d74491c9ebc07a1111c0681ee14a2a7066c9e9d0b87bf018e4f285477a8554 |
| se.png | 1254×1254 | 179e49a7da2135fd740c77593a40462085c3892d0d88d0b3bcf94033c48c40bf |
