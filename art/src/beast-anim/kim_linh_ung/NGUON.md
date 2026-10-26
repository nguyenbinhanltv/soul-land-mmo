# Nguồn raw Kim Linh Ưng — Part of #691 và #688

Ngày 2026-10-26, tthoadev / worker soul-land-mmo-58 sinh bằng **image_gen.imagegen tích hợp Codex**. Công cụ không trả model ID hoặc seed; không suy ra model ảnh từ model agent.

Chỉ tham chiếu `shared/assets/sprites/beast/kim_linh_ung.png` của repo, đã xem trước khi gọi. Mỗi lần sinh nguyên tờ độc lập, chỉ truyền reference gốc. Không dùng tờ A chưa duyệt làm reference B. Nguồn ảnh tĩnh giữ theo mục cũ trong `art/CREDITS.md`; ảnh mới theo điều khoản công cụ.

## Ảnh nộp
- `toA.png`: lượt 2, 1024×1536, 6 cột × 12 hàng, s/se/e, 66 khung.
- `toB.png`: lượt 2, 1254×1254 thực tế, 6 cột × 8 hàng, ne/n, 44 khung. Tool không có size selector. Giữ raw khác cỡ theo chỉ định owner; cutter chia theo tỷ lệ lưới.
- `toA.prompt.txt`, `toB.prompt.txt`: nguyên văn prompt thực gửi cho hai ảnh nộp. Hai file `kim_linh_ung-to*.md` là prompt/hướng dẫn gốc sinh bằng `beast-sheet-prompt.mjs`, không phải toàn bộ prompt thực gửi.
- `provenance.json`: đường dẫn output gốc, SHA-256, cỡ PNG và lịch sử 4 lượt. Raw/prompt cả hai lượt giữ trong artifact của phiên ngoài Git; candidate lượt 2 được chép nguyên byte vào đây. Không hậu kỳ, resize, sửa metadata, cắt, ghép, nhân pose hoặc dựng chuyển động bằng code.

## Giới hạn và ô cần owner soát
Chưa duyệt mỹ thuật. Soát bằng mắt trên raw, chưa cắt hay phát GIF. Cột/hàng tính từ 1.
- A H1 C5–6 và H5/H9 C5–6: hurt xòe cánh, cần kiểm độ rõ giật lùi so với attack.
- A H3 C3–4: mặt hơi xoay, cần kiểm trục s khi bổ nhào.
- A H4 C4: khung nằm cuối còn quay sang phải thay vì giữ trục s; H8 C3–4 cần kiểm trục se.
- A H5–7: cần owner kiểm se đủ khác e, nhất là attack H7.
- B H1–3 C1–6: đã thấy lưng nhưng có khung gần ngang, cần kiểm ne đủ 45°; H3 C3–4 kiểm hướng lao.
- B H4 C2–4 và H8 C1–4: chết còn đổi trục sang phải; n chưa giữ trục bắc khi ngã.
- A/B khác kích thước raw và mức chi tiết; cần owner so cỡ sau cắt. Walk là nhảy/bước hai móng, chưa xác nhận độ mượt vòng lặp.
- B lượt 1 còn lộ mặt/ngực nên đã sinh lại toàn tờ để nhấn gáy, lưng và đuôi. A lượt 2 nhấn trục chết; lỗi nêu trên vẫn còn. Đã dừng đúng tối đa hai lượt mỗi tờ.

Bố cục nhìn thấy đủ 110 vị trí có thú, các ô trống A H4/H8/H12 C5–6 và B H4/H8 C5–6. Đây là candidate để owner H3 cắt/preview, không phải xác nhận 110 khung đã đạt mỹ thuật hoặc runtime.

Quyết định raw khác cỡ: https://github.com/nguyenbinhanltv/soul-land-mmo/pull/709#issuecomment-6400336691 . PR của loài này: https://github.com/nguyenbinhanltv/soul-land-mmo/pull/725 . Không đóng issue #691; không làm H3 hoặc loài khác.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/kim_linh_ung/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Kim Linh Ưng: `art/src/beast-anim/kim_linh_ung/toA.png` (1024×1536, lượt 2), `toB.png` (1254×1254, lượt 2); tthoadev sinh ngày 2026-10-26 bằng `image_gen.imagegen` tích hợp Codex, chỉ reference ảnh tĩnh gốc `shared/assets/sprites/beast/kim_linh_ung.png`. Tool không trả model ID hoặc seed. Raw nguyên byte, không hậu kỳ/cắt/resize/sửa metadata; đã được chủ repo duyệt và nhập game ở `beast_kim_linh_ung_anim`. Prompt thật, SHA-256, lịch sử 2 lượt mỗi tờ và ô nghi lỗi: [NGUON.md](src/beast-anim/kim_linh_ung/NGUON.md), `toA.prompt.txt`, `toB.prompt.txt`, `provenance.json` cùng thư mục. Part of #691 và #688; PR #725. | - | Chuyển một lần từ art/CREDITS.md (#973) |
