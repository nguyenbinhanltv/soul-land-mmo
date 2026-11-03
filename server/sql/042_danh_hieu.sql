-- Danh Hiệu (docs/design/danh-hieu.md mục 5.25, bước P1): bảng `title_owned` (đã mở + hạn dùng) và `title_equipped` (đang đeo). Chạy sau 001_init.sql, an toàn khi chạy lại nhiều lần.

-- Một dòng mỗi (tài khoản, danh hiệu): `title_id` = TITLE_DEFS[].id (shared/data.ts, ổn định); `expires_at` NULL = vĩnh viễn.
-- Mở lần hai khi còn hạn không đổi gì; chỉ dòng ĐÃ HẾT HẠN mới được ghi đè bằng lần mở mới (db.ts `titleGrant`). Chỉ server ghi (không có đường client).
CREATE TABLE IF NOT EXISTS title_owned (
  account_id   BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title_id     TEXT        NOT NULL,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ,
  PRIMARY KEY (account_id, title_id)
);
ALTER TABLE title_owned ENABLE ROW LEVEL SECURITY;

-- Một dòng mỗi tài khoản (tạo khi đeo lần đầu): `title_id` NULL = dùng danh hiệu cấp mặc định. Đeo chỉ ghi được khi đang sở hữu và còn hạn (db.ts `titleEquip`).
CREATE TABLE IF NOT EXISTS title_equipped (
  account_id  BIGINT      PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  title_id    TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE title_equipped ENABLE ROW LEVEL SECURITY;
