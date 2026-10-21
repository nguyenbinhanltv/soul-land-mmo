-- Auto 3: ủy thác offline (GAME_DESIGN.md mục 5.13 "Ủy thác offline", mục 6 "Dữ liệu lâu dài").
-- Chạy sau 001_init.sql, an toàn khi chạy lại nhiều lần.

-- Mỗi tài khoản tối đa một dòng: thoát game ở vùng săn `zone` (tên vùng trong file Tiled) của bản đồ săn `map_id` lúc `started_at`
-- (đồng hồ server). Lần vào sau server xóa dòng (DELETE … RETURNING) rồi tính thưởng theo thời gian vắng mặt; `day` / `used_secs`
-- là ngày giờ Việt Nam và số giây tự săn đã treo trong ngày đó lúc thoát (quỹ AUTO_DAILY_SECS dùng chung với tự săn online).
CREATE TABLE IF NOT EXISTS auto_offline (
  account_id  BIGINT      PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  map_id      TEXT        NOT NULL,
  zone        TEXT        NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL,
  day         TEXT        NOT NULL DEFAULT '',
  used_secs   REAL        NOT NULL DEFAULT 0
);
ALTER TABLE auto_offline ENABLE ROW LEVEL SECURITY;
