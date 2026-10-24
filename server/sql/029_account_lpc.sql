-- L2 (#509, kế hoạch #507): ngoại hình hồn sư chế độ Tự tạo (LPC), GAME_DESIGN.md mục 5.11 "Hồn sư chế độ Tự tạo".
-- Chạy sau 028_is_test.sql, an toàn khi chạy lại nhiều lần. Bảng accounts đã bật RLS ở 001_init.sql.

-- Chuỗi gọn do encodeLpc() (shared/data.ts) sinh sau khi parseLooks() đã kiểm theo danh mục; để trống = chế độ Mẫu dựng sẵn
-- (mọi tài khoản có từ trước bước này giữ nguyên, không chuyển). Lưu TEXT thay JSONB để không dính bẫy kiểu dữ liệu JSONB;
-- mã món / màu nằm trong danh mục LPC_PARTS, không chép vào đây. Chế độ LPC: cột sex = thể hình, bốn cột preset còn lại là 0.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS looks_lpc TEXT NOT NULL DEFAULT '';
