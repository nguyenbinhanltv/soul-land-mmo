# Mẫu nguồn Thư và bảng Xếp Hạng — chờ duyệt #1599

PR nháp #1643. Chưa nhập manifest hoặc nối client. Hai phương án A/B, mỗi phương án chín icon; bảy ô cuối tờ 4×4 chỉ đối chiếu phong cách.
Nguồn: Codex builtin OpenAI image_gen.imagegen ngày 01/11/2026. Điều khoản đầu ra OpenAI, không CC0. Công cụ không trả model ID/seed.
Không gửi ảnh tham chiếu vào công cụ; prompt mô tả bảng màu và nét của bộ Hub đã xem tại art/src/ui-kit/hub-1580/RAW.png. Không dùng ảnh thương mại.

RAW ở a/RAW.png và b/RAW.png là bản sao nguyên byte đầu ra native 1254×1254, không mã hóa lại. Prompt thực tế có LF cuối file, ở a/prompt.txt và b/prompt.txt. SHA256 RAW, prompt và 36 PNG thử nằm trong nguon.json.

Danh sách lấy từ MAIL_KINDS ở shared/data.ts và rankAdapters.ts + RANK_BOARDS: Phúc Lợi (welfare), Bí Cảnh (bicanh), Quản trị (gm); Cấp, Sưu tầm, Sức mạnh, Cộng minh, Elo, Tông tuần.
Ba nhóm là Người chơi / Đấu trường / Tông môn: dự kiến tái dùng mẫu Cấp / Elo / Tông tuần, chưa coi là đã duyệt. Khóa dự kiến gi_mail_* và gi_rank_* có thêm _1x cho 24px; không đăng ký khi chưa duyệt. Ánh xạ đủ trong nguon.json.

Tái tạo: node tools/assets/mail-rank-icon-candidate.mjs --out <thư mục ngoài repo>.
Công cụ kiểm SHA256, cỡ RAW; chuyển alpha <128 sang màu khóa trên bản làm việc RAM, gọi cutUiSheet loại I soft và fitFrame của Hub. Không force, không nới checker.
Bản PNG 24×24/32×32 có alpha 0/255, ≤32 màu; hash khớp hồ sơ. Cả hai tờ không lỗi chặn; ghi chú nhẹ: vài khoảng cách RAW dưới 5% cạnh tờ. Không tự sửa RAW.

Trang duyet-icon-thu-xep-hang.html trong artifacts phiên soul_land_game-987 tự chứa 36 mẫu và ảnh Hub hiện có, đổi nền Mực/Giấy/caro, xem 24/32px và phóng 3×.
Đây là duyệt mỹ thuật, chưa có ảnh game sau nhập; sau chủ repo chọn cần nhập qua công cụ, nối client giữ chữ và fallback, kiểm vùng chạm ≥44px, chụp hai màn desktop/mobile và chạy lại kiểm tra. Không tự merge.
