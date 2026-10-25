-- Đăng nhập Google (SSO, #612): liên kết định danh bên ngoài với tài khoản game. Chạy sau 031_map_fog.sql, an toàn khi chạy lại nhiều lần.
-- subject = mã người dùng Google (`sub`, cố định). KHÔNG lưu email, token Google hay tên Google.
-- UNIQUE(provider, subject): một Google chỉ vào một tài khoản. UNIQUE(account_id, provider): một tài khoản tối đa một Google.
CREATE TABLE IF NOT EXISTS account_identities (
  provider    TEXT NOT NULL,
  subject     TEXT NOT NULL,
  account_id  BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, subject),
  UNIQUE (account_id, provider)
);

-- Bật RLS, không tạo policy (như mọi bảng khác): Data API của Supabase không đọc / ghi được.
ALTER TABLE account_identities ENABLE ROW LEVEL SECURITY;
