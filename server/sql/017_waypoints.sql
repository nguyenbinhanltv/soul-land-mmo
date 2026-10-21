-- Bước 11.2: truyền tống trận đã mở khóa (GAME_DESIGN.md mục 5.3 "Truyền tống trận", mục 6 "Dữ liệu lâu dài").
-- Chạy sau 001_init.sql, an toàn khi chạy lại nhiều lần.

-- Mỗi dòng: một trận tài khoản đã bước lên lần đầu. `wp` là mã `<mapId>:<tên object waypoint trong Tiled>` (server/src/map.ts),
-- server tự kiểm tra mã có thật; trận bị bỏ khỏi bản đồ thì dòng cũ nằm yên, không dùng tới. Chỉ thêm, không xóa.
CREATE TABLE IF NOT EXISTS waypoints (
  account_id  BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  wp          TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, wp)
);
ALTER TABLE waypoints ENABLE ROW LEVEL SECURITY;
