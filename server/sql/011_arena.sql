-- Bước 7.2: Đại Đấu Hồn Trường (GAME_DESIGN.md mục 5.9, 6 – bảng `arena_ratings`).
-- Chạy sau 010_quests.sql, an toàn khi chạy lại nhiều lần.

-- Mỗi dòng: Elo và thành tích đấu hồn xếp hạng của một tài khoản. Tài khoản chưa đấu trận nào thì chưa có dòng (Elo khởi đầu
-- ARENA.startElo do server đọc từ shared/data.ts, không chép vào đây) và không có trong bảng xếp hạng.
-- Elo mới do phòng ArenaRoom tính (eloAfter trong shared/data.ts) rồi ghi đè; mỗi tài khoản chỉ ở một trận một lúc nên không có hai
-- lần ghi chồng nhau. Lượt thắng có thưởng mỗi ngày dùng lại bảng `boss_claims` (009) với `kind` = 'dau_hon_truong' (ARENA.claimKind),
-- ghi cùng transaction với túi đồ có phần thưởng.
CREATE TABLE IF NOT EXISTS arena_ratings (
  account_id  BIGINT      PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  elo         INTEGER     NOT NULL CHECK (elo >= 0),
  wins        INTEGER     NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses      INTEGER     NOT NULL DEFAULT 0 CHECK (losses >= 0),
  draws       INTEGER     NOT NULL DEFAULT 0 CHECK (draws >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Bảng xếp hạng: Elo cao trước, bằng Elo thì nhiều trận thắng hơn, rồi tài khoản đạt mức đó sớm hơn.
CREATE INDEX IF NOT EXISTS arena_ratings_rank ON arena_ratings (elo DESC, wins DESC, updated_at, account_id);
ALTER TABLE arena_ratings ENABLE ROW LEVEL SECURITY;
