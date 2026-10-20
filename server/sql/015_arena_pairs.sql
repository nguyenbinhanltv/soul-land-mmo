-- Bước 9.7: chống dàn xếp Đại Đấu Hồn Trường (GAME_DESIGN.md mục 5.9, Lộ trình 9.7 – bảng `arena_pairs`).
-- Chạy sau 011_arena.sql, an toàn khi chạy lại nhiều lần.

-- Mỗi dòng: số trận có kết quả giữa một cặp tài khoản trong một ngày. `day` là ngày theo giờ Việt Nam (vnDay trong shared/data.ts,
-- đổi lúc 00:00 như lượt thưởng ở boss_claims), server tự tính. Cặp lưu một chiều: `a` < `b` (server sắp mã trước khi ghi).
-- `n` đếm cả trận giao hữu; trận thứ n có tính Elo và thưởng khi n <= ARENA.pairDaily (arenaRanked), giới hạn không chép vào đây.
-- Trận bị hủy (không ai vào sân) không đếm. Lưu DB để khởi động lại server không xóa số đếm trong ngày.
CREATE TABLE IF NOT EXISTS arena_pairs (
  day         DATE        NOT NULL,
  a           BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  b           BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  n           INTEGER     NOT NULL DEFAULT 0 CHECK (n >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (day, a, b),
  CHECK (a < b)
);
ALTER TABLE arena_pairs ENABLE ROW LEVEL SECURITY;
