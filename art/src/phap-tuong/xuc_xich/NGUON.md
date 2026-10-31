# Pháp tướng Xúc Xích vẽ lại — bộ cuối #1456

- Công cụ Codex built-in image_gen.imagegen, không công bố model/seed; ngày2026-10-31.
- Tham chiếu vohonanim/xuc_xich_{b,f}.png và vukhianim/xuc_xich_{b,f}.png trên main3f4243055ec74af8aff84b5aaae26130c788b12b, chỉ hình/màu/motif; không chép khoảng rỗng nộm.
- RAW native vuông1254×1254 giữ nguyên byte, kích thước đã được orchestrator chấp nhận như #1326. Không co giãn ngoài cutter. Prompt đầy đủ cùng tên, SHA256 ở bảng cuối và SHA256.json.
- s/se/e/ne/n đều dùng/chọn lượt1; không sinh song song và không quá3 lượt mỗi tờ.

## Nhật ký

| Hướng | Lượt | Kết quả |
|---|---:|---|
| s | 1 | Chọn: xúc xích nướng đặc, hai đầu buộc, ba vết khía, hai xúc xích nhỏ; cutter đạt. |
| se | 1 | Chọn: đầu dẫn phải-xuống, nghiêng/lắc và đưa đầu tới; cutter đạt. |
| e | 1 | Chọn: nhìn cạnh gần ngang, lấy đà nghiêng và đỉnh đòn nằm ngang sang phải; cutter đạt. |
| ne | 1 | Chọn: mặt vỏ sau, đầu xa hướng phải-lên; cutter đạt. |
| n | 1 | Chọn: mặt sau gần dọc, hai đầu buộc và vỏ nướng đặc; cutter đạt. |

## Tái tạo

`node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/xuc_xich shared/assets/sprites/phaptuong/xuc_xich.png --no-despill`

Giữ nâu đỏ/cam của vỏ, không dùng lọc viền hồng dành thân xanh. Cutter chuẩn blob và hash thành phẩm ở recipe.json; sheet2560×800,16×5 khung160,gốc(80,124),8 thở+8 đánh,48 màu,alpha0/255. Glow sinh bằng buildGlow của phuthe-to-phaptuong-lib từ sheet mới,màu #e8875a (cùng đường công cụ --glow), không chuyển thể lại thân từ phụ thể. validate.mjs đăng ký thân/glow, credits.mjs sinh credits.json. Glow/credits đặt cạnh thân; UI Kit giữ cuối manifest, xuống dòng thống nhất. Không đổi shared/data.ts/display/cân bằng.

## Kiểm trong game

Chrome headless --mute-audio, SwiftShader; màn thử thật /choi?thu=phaptuong&vh=xuc_xich. Đã xem đủ5 hướng thở và đỉnh đánh; script tạm dừng render ở cột thở2–4/đánh11–12 để chụp khung thật, không sửa asset hoặc mã game. Giảm chuyển động bật để tắt flashHit trắng, Cut-in tắt, sheet vẫn chạy; noAudio=true. Thân xúc xích đặc,không cột tối hình người; ne/n vẫn đọc được alpha70%. Cặp xúc xích nhỏ là vật đi kèm thật, không phải hạt/glow nướng sẵn. Không vẽ khói/vòng/sét rời vào ảnh.

Hạn chế: vật cứng nên biên độ đòn s/se/ne nhỏ hơn động tác sinh vật; vết nướng/màu giữa các hướng khác nhẹ, mặt sau n ít phần ruột sáng hơn. Mọi RAW được giữ để truy vết. Không đổi server/SQL, không chạy PostgreSQL, không tự merge.

## RAW native và SHA256

Kiểm tra trước PR: `npm run check`, `npm run build`, `npm run test:phaptuong --prefix client` và `node tools/assets/ui-import.mjs --check` đều đạt. Làn art, không đổi logic nên không chạy bot/PostgreSQL.

| RAW | Native | SHA256 |
|---|---|---|
| e.png | 1254×1254 | 2d53d6486de4019113e6589c9437c1d3f0a697a19aae16ca9f70cd12ae4fbce9 |
| n.png | 1254×1254 | cd5f8249fccfea9d434e149253a744a2475448a9d377d9d2e42b023b71c8018c |
| ne.png | 1254×1254 | 44f9b9196c87ab14fd28095216758ecd7343ba64cb7b5a54788d0f44acddef79 |
| s.png | 1254×1254 | a241c9d05b658942ef867f12db6cb6d2fc79800ef8fe2a3eff69040f5c3e65de |
| se.png | 1254×1254 | 5739dc5bd90de837459538e29daecc89d86e83abcb2720c559fbec4ab876a472 |
