# Bảy icon Hub — chờ duyệt mỹ thuật

Part of #1580, PR nháp #1585. Codex builtin OpenAI image_gen.imagegen, ngày 01/11/2026; lượt 1/3. Tham chiếu duy nhất: tờ menu đã duyệt của dự án art/src/ui-kit/toI-2.png. Không dùng ảnh bên thứ ba mới. Điều khoản đầu ra OpenAI, không CC0; công cụ không trả model ID/seed.

RAW.png là bản sao nguyên byte native **1254×1254**, so SHA256 với đầu ra công cụ: trùng. Không resize hoặc mã hóa lại RAW.

| File | SHA256 |
|---|---|
| RAW.png | daec34cbcb06a214abc4b01578b2d4e83b4c4ba4a42631252cea1208609fd4ef |
| prompt.txt | c875b174e8316152fa9e075884d008592f8327c4cd828b6f7b7d2c96f18e09c1 |

Prompt thật ở prompt.txt, sinh qua buildPrompt với family hub và lessonsFor('I', undefined, 'hub'); mô tả ở lessons.md. Chín ô cuối chỉ đối chiếu, không nhập. Ánh xạ bảy ô đầu ở nguon.json.

Cắt thử ngoài repo bằng cutUiSheet với kindId I, prefix hub_, soft true; bản 32px/24px bằng fitFrame của menu-icon-import.mjs. RAW có 0 lỗi chặn; hai ghi chú nhẹ: khoảng cách vài ô dưới 5%; viền hồng 51% đã bù về 0%. Cần chủ repo duyệt bản 24px trên nền Mực/Giấy/caro trước khi nhập chính thức. Chưa chép shared/assets, chưa thêm MENU_ICON_KEYS, chưa nối Hub.

Sau duyệt: nhập bằng menu-icon-import.mjs (mở rộng nguồn bảy ô), thêm khóa và nối Hub sau #1579. Merge origin/main mới nhất, giữ đủ hồ sơ nguồn, sinh credits bằng node tools/assets/credits.mjs; chạy credits.test, npm run check, build, test:assets, AO review. Không sửa tay credits.json.
