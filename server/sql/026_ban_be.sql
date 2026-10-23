-- #195: bạn bè và chặn (GAME_DESIGN.md mục 5.9 "Bạn bè"). Chạy sau 025_tong_mon.sql, an toàn khi chạy lại nhiều lần.
-- Mỗi tài khoản chỉ ghi dòng của chính mình (account_id) qua chuỗi lưu; không có transaction ghi chéo hai tài khoản.
-- Giới hạn số dòng (FRIEND_MAX, BLOCK_MAX ở shared/data.ts) do server kiểm, không chép vào SQL.

-- Danh sách bạn bè: `account_id` đã thêm `friend_id`. Hai bên là bạn khi có cả hai dòng (A, B) và (B, A).
CREATE TABLE IF NOT EXISTS friends (
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  friend_id  BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, friend_id),
  CHECK (account_id <> friend_id)
);
-- Tra "ai đã thêm tài khoản này" (biết hai bên đã thêm nhau khi người kia ngoại tuyến).
CREATE INDEX IF NOT EXISTS friends_friend_idx ON friends (friend_id);
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Danh sách chặn: `account_id` chặn `blocked_id` (lọc tin riêng, lời mời tổ đội, lời thêm bạn, chat bản đồ / thế giới / tổ đội).
CREATE TABLE IF NOT EXISTS blocks (
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  blocked_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, blocked_id),
  CHECK (account_id <> blocked_id)
);
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
