-- #196: tông môn (GAME_DESIGN.md mục 5.14). Chạy sau 024_tu_ban.sql, an toàn khi chạy lại nhiều lần.

-- Tông đang thuộc (mã trong TONG_MON, shared/data.ts; NULL = chưa vào / đã rời) và lúc gia nhập gần nhất (ms; giữ khi rời, để tính
-- thời gian chờ đổi tông TONG_SWITCH_DAYS).
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tong TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tong_at BIGINT;

-- Điểm tông vụ theo tuần (#197 ghi, #196 chỉ xoá điểm tuần hiện tại khi đổi tông). `week`: tongWeek (ngày thứ Hai giờ Việt Nam).
CREATE TABLE IF NOT EXISTS tong_points (
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  week       INTEGER NOT NULL,
  tong       TEXT NOT NULL,
  points     INTEGER NOT NULL DEFAULT 0,
  claimed    BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (account_id, week, tong)
);
ALTER TABLE tong_points ENABLE ROW LEVEL SECURITY;
