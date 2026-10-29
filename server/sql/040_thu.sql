-- Thư hệ thống (docs/design/thu.md mục 5.24, bước P2): bảng `mail`. Chạy sau 001_init.sql, an toàn khi chạy lại nhiều lần.

-- Một dòng mỗi thư của một tài khoản. `dedup` là khóa chống tạo trùng do nguồn đặt (ví dụ "gm:<mã lệnh>"): một sự kiện nguồn chỉ ra một thư (unique theo tài khoản).
-- `items` = [{code, qty}] (vật phẩm gộp trong ITEMS), `hon_te` = Hồn Tệ đính kèm. Nhận đúng một lần: UPDATE ... WHERE claimed_at IS NULL cùng transaction với túi (db.ts `mailClaim`).
-- `deleted_at` = xóa mềm (giữ dòng tới khi hết hạn để `dedup` còn chặn nguồn tạo lại); thư hết hạn bị dọn khi chủ tài khoản mở hộp thư.
CREATE TABLE IF NOT EXISTS mail (
  id          BIGSERIAL   PRIMARY KEY,
  account_id  BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind        TEXT        NOT NULL,
  dedup       TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL DEFAULT '',
  hon_te      INTEGER     NOT NULL DEFAULT 0,
  items       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  read_at     TIMESTAMPTZ,
  claimed_at  TIMESTAMPTZ,
  deleted_at  TIMESTAMPTZ,
  UNIQUE (account_id, dedup)
);
CREATE INDEX IF NOT EXISTS mail_account_created ON mail (account_id, created_at DESC);
ALTER TABLE mail ENABLE ROW LEVEL SECURITY;
