-- #1011: bảng sessions không còn lưu token rõ, chỉ lưu sha256(token) dạng hex (cột token_hash); lộ DB / bản sao lưu không lộ token đăng nhập.
-- Phiên cũ được băm tại chỗ (không buộc ai đăng nhập lại), rồi xóa token rõ. Chạy sau 035, an toàn khi chạy lại nhiều lần:
-- mỗi lần khởi động băm nốt dòng token rõ còn sót (ví dụ bản server cũ còn chạy song song lúc triển khai).
-- Giá trị khớp với createHash("sha256").update(token).digest("hex") của db.ts (token toàn ASCII base64url).
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS token_hash TEXT;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE sessions ALTER COLUMN token DROP NOT NULL;
UPDATE sessions SET token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex') WHERE token_hash IS NULL AND token IS NOT NULL;
UPDATE sessions SET token = NULL WHERE token IS NOT NULL AND token_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);
-- Tra token rõ của bản server cũ chèn sau migration (db.ts accountFromToken nâng cấp dần); chỉ chỉ mục các dòng còn token rõ.
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_legacy_idx ON sessions(token) WHERE token IS NOT NULL;
