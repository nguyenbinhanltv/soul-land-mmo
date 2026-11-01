# Icon nhóm Thành Tựu — mẫu chờ duyệt mỹ thuật

Closes #1596. Loại B: PR nháp, chờ chủ repo duyệt mỹ thuật trước khi nhập ảnh vào shared/assets, manifest và client.

Phạm vi: Cấp, Sưu tầm, Săn, Nhiệm vụ, Đấu trường, Bí Cảnh và huy hiệu đã nhận. Sinh ngày 01/11/2026 bằng Codex builtin OpenAI image_gen.imagegen, lượt 1/3, tham chiếu duy nhất `art/src/ui-kit/toI-2.png` đã duyệt của dự án; điều khoản đầu ra OpenAI, không CC0. Công cụ không trả model ID hoặc seed.

`RAW.png` giữ nguyên byte native **1254×1254**, so SHA256 với file đầu ra của công cụ: trùng; không resize hoặc mã hóa lại. Có 798.340 điểm alpha 0 (nền trong suốt thật). Prompt thật UTF-8 LF ở `prompt.txt`; ánh xạ bảy ô đầu ở `nguon.json`, chín ô cuối chỉ đối chiếu phong cách.

| File | SHA256 |
|---|---|
| RAW.png | becb8e4f3d9c7269125b9b52bd170088a57be79e5810246afd907867577cbd11 |
| prompt.txt | 0e0fad67e2b1005b9bb56fdab28ee4138a3aac817f264ec57d0828bb97ec0fa6 |

Cắt thử: `node tools/assets/achv-icon-preview.mjs <thư mục ngoài repo>`. Công cụ kiểm hash, đổi riêng bản làm việc trong RAM sang nền khóa để tái dùng `cutUiSheet` loại I, soft true, rồi `fitFrame` của bộ menu cho 32/24px. Không sửa RAW, không nới checker, không `--force`. Cutter tách đủ 16 ô, 0 lỗi chặn, 0% viền hồng; một ghi chú nhẹ khoảng cách vài ô dưới 5%. Ảnh xuất có alpha nhị phân, tối đa 32 màu.

Trang `duyet-icon-thanh-tuu.html` và `so-sanh-icon-thanh-tuu.png` ở artifacts phiên `soul_land_game-976`. Ảnh so sánh: hàng đầu là bộ menu đã duyệt; bảy hàng dưới theo thứ tự Cấp → Sưu tầm → Săn → Nhiệm vụ → Đấu trường → Bí Cảnh → Đã nhận. Ba cột nền Mực/Giấy/caro, mỗi ô có 24px, 32px và phóng 3× bản 32px. Đây là mẫu asset, chưa phải ảnh chụp màn game.

**Chưa nhập manifest/shared/assets/client.** Sau khi chủ repo duyệt: nhập đúng byte mẫu, nối nav và huy hiệu bên cạnh chữ Đã nhận; chụp màn thật ở desktop/mobile, giữ vùng bấm ≥44px; merge main và sinh lại credits theo #1483, kiểm tra và review lại head nhập chính thức. Không tự merge.
