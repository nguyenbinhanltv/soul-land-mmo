-- Auto 1: tự săn online phía server (GAME_DESIGN.md mục 5.13 "Tự săn", mục 6 "Dữ liệu lâu dài").
-- Chạy sau 001_init.sql, an toàn khi chạy lại nhiều lần.

-- Mỗi tài khoản một dòng: cài đặt tự săn (JSONB, server kiểm lại bằng parseAuto trong shared/data.ts) và số giây đã treo trong ngày
-- `day` (giờ Việt Nam, "YYYY-MM-DD"). Sang ngày khác thì server coi `used_secs` là 0; giới hạn mỗi ngày là AUTO_DAILY_SECS.
CREATE TABLE IF NOT EXISTS auto_hunt (
  account_id  BIGINT      PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  settings    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  day         TEXT        NOT NULL DEFAULT '',
  used_secs   REAL        NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE auto_hunt ENABLE ROW LEVEL SECURITY;
