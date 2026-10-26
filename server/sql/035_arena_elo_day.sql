-- #791: trần Elo cộng thêm mỗi tài khoản mỗi ngày của Đại Đấu Hồn Trường (GAME_DESIGN.md mục 5.9, bảng `arena_elo_day`).
-- Chạy sau 011_arena.sql, an toàn khi chạy lại nhiều lần.

-- Mỗi dòng: tổng Elo đã CỘNG THÊM (chỉ tính phần tăng, thua không trừ lại) của một tài khoản trong một ngày. `day` là ngày theo giờ Việt Nam
-- (vnDay trong shared/data.ts, đổi lúc 00:00), server tự tính. Trần là ARENA.eloDaily ở shared/data.ts, không chép vào đây.
-- Ghi trong cùng transaction với `arena_ratings` (saveArena) nên khởi động lại server không xóa số đã tính.
CREATE TABLE IF NOT EXISTS arena_elo_day (
  account_id  BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day         DATE        NOT NULL,
  gain        INTEGER     NOT NULL DEFAULT 0 CHECK (gain >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, day)
);
ALTER TABLE arena_elo_day ENABLE ROW LEVEL SECURITY;
