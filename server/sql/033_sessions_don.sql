-- #736: bảng sessions chưa từng được dọn và chỉ có khóa chính `token`. Chỉ mục (account_id, created_at DESC) cho truy vấn
-- "phiên mới nhất của tài khoản" (db.ts) và xóa cascade theo tài khoản; chỉ mục created_at cho quét định kỳ xóa phiên quá hạn.
-- Chạy sau 032_account_identities.sql, an toàn khi chạy lại nhiều lần. Việc xóa dòng do server làm (db.ts), không làm ở đây.
CREATE INDEX IF NOT EXISTS sessions_account_idx ON sessions(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sessions_created_idx ON sessions(created_at);
