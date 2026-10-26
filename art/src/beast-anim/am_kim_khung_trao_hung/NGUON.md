# Ám Kim Khủng Trảo Hùng — H4 #767

Part of #767, thuộc #766. Hai tờ A/B candidate 2/10 của batch, chưa owner duyệt mỹ thuật/runtime. Ngày 2026-10-26, fresh worker soul-land-mmo-63.

Sinh bằng builtin `image_gen.imagegen`, không có size/model selector, không trả model ID/seed. Hai lượt cùng tờ A trong phiên63; chọn A2 vì attack/hurt rõ hơn A1. Dừng ở giới hạn 2 lượt; không vẽ tờ B hay loài khác trong phiên này.

Prompt mẫu nguyên vẹn từ script ở `am_kim_khung_trao_hung-toA.md`; prompt thực `toA.prompt.txt` thêm đoạn làm rõ trục hurt/die và góc se. Chỉ reference ảnh tĩnh đúng loài `shared/assets/sprites/beast/am_kim_khung_trao_hung.png`, đã xem trước. Nguồn/giấy phép ảnh tĩnh đã có trong CREDITS. Không tham chiếu loài khác hoặc ảnh thương mại.

Raw A2 1024×1536, lưới 6×12 s/se/e, 66 vị trí hình và sáu ô trống H4/H8/H12 C5–6 theo bố cục yêu cầu. Quan sát ảnh raw, chưa cutter/preview. Giữ nguyên byte, không cắt/hậu kỳ/resize/quantize/đổi metadata. `toA.source.json` ghi hash/params/reference/lịch sử. A1 và A2 đầy đủ ở artifact worker63 ngoài Git.

## Ô nghi lỗi (hàng/cột từ 1)

- H1 C5 và H5 C5: hurt ngửa đầu, cần kiểm đủ giật lùi và giữ hướng s/se.
- H4 C1–4: die đổi trục nam, C3–4 đầu quay trái; cần owner xem toàn chu kỳ.
- H8 C3–4 và H12 C3–4: die nằm quay về người xem, nghi sai trục se/e.
- H5–7 C1–6: kiểm se đủ khác e; H7 C3–4 thân vồ rộng, cần kiểm mép ô.
- H11 C3–4: attack đầu/thân hơi xoay trước, cần kiểm trục e.
- Toàn tờ: chưa cắt/preview, chưa xác nhận loop và độ khớp cỡ với ảnh tĩnh.

Mỗi tờ tiếp theo phải phiên mới. B cần cả ảnh tĩnh và A selected; A2 mới là candidate, chưa owner duyệt. Không coi ngoại lệ offsize H2 là acceptance H4; A2 hiện đúng kích thước yêu cầu. Owner repo cắt/preview/duyệt/nhập game. Không sửa runtime/manifest/client/server/shared/DB.

## Tờ B từ fresh worker68

Chọn B2 sau 2/2 lượt builtin imagegen trong phiên mới. Đã kiểm nguyên byte với output tool và artifact, hash raw `cb558248a52f3e2d5669eb6f71ccc9c66806830a9af9b75be27841580048afbc`. Kích thước thực **1254×1254**, sai yêu cầu 1024×1024; không resize và không suy ngoại lệ H2 thành acceptance H4. Lưới yêu cầu 6×8, 44 hình, H4/H8 C5–6 trống; mới quan sát raw bằng mắt, chưa cutter/preview. Prompt thực `toB.prompt.txt`, mẫu script `am_kim_khung_trao_hung-toB.md`, provenance `toB.source.json`.

Reference đúng thứ tự: ảnh1 static gốc (identity), ảnh2 A2 (style-only candidate, được phép dùng làm reference, chưa duyệt mỹ thuật/runtime). Worker68 đã xem/đính cả hai cho hai lượt. Static/A upright hai chân so DESC generic quad/all-four-legs vẫn là xung đột cần owner đánh giá; không tự nhận anatomy/family/hướng đạt. Prompt thực giữ nguyên khối gốc và thêm role clarification/ghi chú retry.

Provenance gốc worker68 có trường dimensions gán nhầm cho prompt text. Hồ sơ PR bỏ trường không có nghĩa này, giữ bytes/hash đã kiểm; bản artifact gốc không sửa. B1/B2 và prompts/provenance gốc nằm ngoài Git ở artifact worker68.

### Ô B nghi lỗi (H/C từ 1)

- Toàn tờ: sai kích thước yêu cầu, không resize.
- H8C3-C4: đầu dạt trái khi nằm, cần owner xem trục thân N; lưng vẫn hiện, không lộ mặt như B1.
- H4C3-C4: cần xem lại trục NE khi thân nằm ngang.
- H1C5-C6 và H5C5-C6: biên độ hurt nhẹ, khó phân biệt rõ với idle.
- H3C3-C4 và H7C3-C4: động tác attack và margin cần owner kiểm tra khi tích hợp.

Chưa owner duyệt B. Giữ Draft/Đang làm 2/10; worker63 chỉ tích hợp raw, không sinh thêm ảnh. AO review kỹ thuật do orchestrator44 trigger sau khi nhận head A+B ổn định; không tự trigger hoặc ghi Review: đạt trước review.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/am_kim_khung_trao_hung/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Ám Kim Khủng Trảo Hùng (H4 #767): raw `art/src/beast-anim/am_kim_khung_trao_hung/toA.png` (1024×1536, chọn lượt 2/2, fresh worker63) và `toB.png` (1254×1254 thực tế, sai yêu cầu 1024×1024, chọn lượt 2/2, fresh worker68). tthoadev sinh ngày 2026-10-26 bằng `image_gen.imagegen` tích hợp Codex. A reference static đúng loài; B reference static (identity) + A2 (style-only candidate). Tool không trả model ID/seed, không có size/model selector. Giữ nguyên byte, không hậu kỳ/resize. Prompt thực, nguồn và hash: [NGUON.md](src/beast-anim/am_kim_khung_trao_hung/NGUON.md), `toA.prompt.txt`, `toB.prompt.txt`, `toA.source.json`, `toB.source.json`. Candidate chờ owner cắt/preview; chưa xác nhận mỹ thuật/runtime, anatomy/family hoặc acceptance H4. Tiến độ batch 2/10 raw. | - | Chuyển một lần từ art/CREDITS.md (#973) |
