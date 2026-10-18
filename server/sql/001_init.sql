-- Chạy tự động khi server khởi động (an toàn khi chạy lại nhiều lần).
-- Dùng được cho PostgreSQL thường và Supabase.

CREATE TABLE IF NOT EXISTS accounts (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  pass_hash   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  account_id  BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS characters (
  account_id  BIGINT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  vohon       SMALLINT NOT NULL,
  innate      SMALLINT NOT NULL,
  level       SMALLINT NOT NULL,
  xp          INTEGER  NOT NULL DEFAULT 0,
  rings       SMALLINT[] NOT NULL DEFAULT '{}',
  kills       INTEGER  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chuẩn bị cho giai đoạn 2 (túi đồ, hồn cốt).
CREATE TABLE IF NOT EXISTS inventory (
  account_id  BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  item        TEXT   NOT NULL,
  qty         INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (account_id, item)
);

-- Supabase tự mở mọi bảng trong schema public qua Data API (khóa anon).
-- Bật RLS và không tạo policy nào -> Data API không đọc/ghi được (mật khẩu băm, token phiên an toàn).
-- Server kết nối bằng user postgres (chủ bảng) nên không bị RLS chặn. Postgres thường cũng chạy được.
ALTER TABLE accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory  ENABLE ROW LEVEL SECURITY;
