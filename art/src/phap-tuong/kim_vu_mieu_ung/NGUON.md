# Pháp tướng Kim Vũ Miêu Ưng vẽ lại — #1456

- Công cụ: Codex built-in image_gen.imagegen; model/seed không được công bố. Ngày 2026-10-31.
- Tham chiếu hình, màu, motif: shared/assets/sprites/vohonanim/kim_vu_mieu_ung_{b,f}.png và vukhianim/kim_vu_mieu_ung_{b,f}.png trên main 1de8f12d4a53751c348f17126c77cf419ab5c602. Không chép khoảng rỗng hình người.
- RAW giữ nguyên byte native vuông 1254×1254, kích thước đã được orchestrator chấp nhận như #1326. Prompt đầy đủ cùng tên. Không co giãn RAW ngoài cutter.
- s/se/e/ne/n đã dùng 3/1/3/1/3 lượt; chọn 1/1/3/1/3. Giữ các lượt bị loại và SHA256. Không sinh lượt thứ tư.

## Nhật ký

| Hướng | Lượt | Kết quả |
|---|---:|---|
| s | 1 | Chọn: thân cú liền và bố cục đều, cutter đạt. Hạn chế: ô 12 còn đầu thế vỗ, ô 13 đưa vuốt xa hơn, chưa giữ nguyên pose giữa hai ô. Cần orchestrator chấp nhận trước khi gộp. |
| s | 2 | Loại: đúng nhịp hơn nhưng đầu cánh chạm mép ô lấy đà cuối. |
| s | 3 | Loại: lề đạt nhưng lưới hình lệch dần sang trái, làm cutter thu cả bộ quá nhỏ (hệ số 0,435); đã thấy trong game. |
| se | 1 | Chọn: góc phải-xuống, vỗ cánh và đưa vuốt tới, cutter đạt. |
| e | 1 | Loại: đỉnh đòn chưa giữ ở ô 12–13. |
| e | 2 | Loại: đầu cánh hàng đánh nhô sang ô thở phía trên. |
| e | 3 | Chọn: thu toàn hình, giữ pose lao phải và vuốt tới; cutter đạt. |
| ne | 1 | Chọn: quay lưng chếch phải, vỗ cánh lao phải-lên; cutter đạt. |
| n | 1 | Loại: đầu cánh chạm mép ô đánh đầu. |
| n | 2 | Loại: ô 12 còn lấy đà, pose nghiêng có vuốt thừa khó đọc. |
| n | 3 | Chọn: hạ cánh giữ đỉnh, quay lưng hoàn toàn, chỉ một cặp vuốt; cutter đạt. |

## Tái tạo và nhập

`node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/kim_vu_mieu_ung shared/assets/sprites/phaptuong/kim_vu_mieu_ung.png`

Cutter chuẩn, khóa nền mặc định cho thân vàng, không áp dụng cho thân hồng/đỏ. Blob cutter, hash thành phẩm, display ở recipe.json. Kết quả 2560×800, 80 khung 160, 48 màu, alpha 0/255, gốc (80,124), 8 thở + 8 đánh mỗi hướng. Lớp sáng dùng buildGlow của phuthe-to-phaptuong-lib từ sheet mới, màu #ffd54a; không chuyển thể lại thân từ phụ thể.

validate.mjs đăng ký thân/glow, credits.mjs sinh credits.json. appendManifestEntry giữ UI Kit cuối manifest. Không sửa shared/data.ts; giữ thông số hiển thị hiện có.

## Kiểm trong game

Chrome headless --mute-audio, SwiftShader, màn thử /choi?thu=phaptuong&vh=kim_vu_mieu_ung, thở và đỉnh đánh đủ5 hướng. Script tạm giữ vòng render tại cột thở2–4 và đánh11–12 để chụp đúng hình thật, không sửa asset/mã game. Giảm chuyển động bật để tắt flashHit trắng, Cut-in tắt; sheet vẫn chạy. Màn thử noAudio=true. Đã xem ảnh: thân liền, không cột tối, ne/n đọc được alpha70%; thân vàng còn trầm ở nền tối. Gallery trong artifact phiên AO891 được cập nhật cùng bộ Nhu Cốt Thố. Hạn chế s ở trên chưa được tự coi là duyệt mỹ thuật.

## RAW native và SHA256

| RAW | Native | SHA256 |
|---|---|---|
| e-v1.png | 1254×1254 | 0ea15ce888707359a585d4884702b389b777ee5a1593fcd636cbfdc9cab1951e |
| e-v2.png | 1254×1254 | 1748cd78bfbd1faf8ddfc3d168d99bbb9bfdf88fe40cd9361550412fe43c6d86 |
| e.png | 1254×1254 | 14bbe724077c070c5e77dbfddcc7f3dbac5d32e867887b095a3a84698b76790e |
| n-v1.png | 1254×1254 | f0200476d38da7d298928d4a17d75a3eddade80871a982f90b9d5e9fde8fdf7c |
| n-v2.png | 1254×1254 | 7c555f1c874ff9d6af3f3ec7ad454f84308efdc084b18711afd3b9deadf25590 |
| n.png | 1254×1254 | 4a5809a5ea89ff62dcc37ec8754ebf90bf981337aee9d6a4df548f6e6af6389d |
| ne.png | 1254×1254 | 9adf4008d50e41f04462aa3dc8da2725a2452a1aa99d0ac8d357fe1ef22069eb |
| s-v1.png | 1254×1254 | a19b47daa8271c0ad759b1b423aa32a7cbad9b9f91b0e5b66a4c9de5c403b482 |
| s-v2.png | 1254×1254 | 3b0085dafe31230f19715e1a933cf3cee7e3f16a97f2f0582dd8aac9b6d68a49 |
| s-v3.png | 1254×1254 | ac1f2d8a734d5d5e2741c50dbb11730c50ce5937b606c7dbabac7343742abf6f |
| s.png | 1254×1254 | a19b47daa8271c0ad759b1b423aa32a7cbad9b9f91b0e5b66a4c9de5c403b482 |
| se.png | 1254×1254 | dbfa80acf53fab819f411d6bf3b8a1cfa02536cc4c33d459aface78f9f2aa113 |

Kiểm trước PR: npm run check, npm run build, test:phaptuong client, ui-import --check đều đạt. Cutter tái tạo sheet đúng từng byte theo SHA256 recipe. Không đổi server/SQL, không chạy PostgreSQL. Không tự merge.
