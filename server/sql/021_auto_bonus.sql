-- Auto 2: giờ treo cộng thêm từ Ủy Thác Lệnh (GAME_DESIGN.md mục 5.13 "Tự săn", mục 6 "Dữ liệu lâu dài").
-- Chạy sau 018_auto_hunt.sql, an toàn khi chạy lại nhiều lần.

-- Số giây treo cộng thêm còn lại của tài khoản: không đặt lại theo ngày, chỉ tiêu khi đã treo hết AUTO_DAILY_SECS của hôm nay.
-- Dùng Ủy Thác Lệnh thì cộng AUTO_TOKEN_SECS (tối đa AUTO_BONUS_MAX), ghi cùng transaction với túi đồ đã bớt lệnh.
ALTER TABLE auto_hunt ADD COLUMN IF NOT EXISTS bonus_secs REAL NOT NULL DEFAULT 0;
