-- Tên chuẩn hóa của tài khoản: khóa so sánh tên, tính bằng nameKey() trong server/src/names.ts
-- (NFKC + chữ thường), dùng chung với rate limit. "ＴＡＭ", "TAM" và "Tam" là cùng một tài khoản.
-- Chạy sau 003_owned_vohons.sql, an toàn khi chạy lại nhiều lần.

-- Cột để NULL được: tài khoản cũ được điền trong PgStore.backfillNameKeys() (db.ts) ngay sau khi chạy các file .sql,
-- vì nameKey là hàm JS (không dùng lower() của Postgres, kết quả phụ thuộc collation).
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS name_key TEXT;

-- Duy nhất theo tên chuẩn hóa. Postgres cho nhiều dòng NULL, nên tạo chỉ mục được ngay cả khi DB đã có hai tài khoản
-- trùng tên sau chuẩn hóa: tài khoản cũ nhất nhận name_key, tài khoản còn lại giữ NULL (không xóa) và bị cảnh báo khi khởi động.
CREATE UNIQUE INDEX IF NOT EXISTS accounts_name_key_idx ON accounts(name_key);
