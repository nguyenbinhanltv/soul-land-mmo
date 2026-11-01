# Icon nhóm Thành Tựu — đang chuẩn bị duyệt

Closes #1596. Loại B: PR nháp, chờ chủ repo duyệt mỹ thuật trước khi nhập ảnh vào shared/assets, manifest và client.

Phạm vi: Cấp, Sưu tầm, Săn, Nhiệm vụ, Đấu trường, Bí Cảnh và huy hiệu đã nhận. Sinh bằng Codex builtin OpenAI image_gen.imagegen, tham chiếu bộ menu đã duyệt của dự án; điều khoản đầu ra OpenAI, không CC0.

Kế hoạch: giữ RAW nguyên byte native, prompt thật và SHA256; cắt bản xem thử 32/24px ngoài repo; tạo trang duyệt và ảnh so sánh trong artifacts. Sau duyệt mới nhập, nối màn Thành Tựu, sinh credits bằng công cụ sau merge origin/main theo #1483, kiểm tra check/build/test:assets, AO review và CI. Không tự merge.
