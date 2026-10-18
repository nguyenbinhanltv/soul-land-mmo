-- Bước 2.3a: đội hình 4 võ hồn (GAME_DESIGN.md mục 3, 5.1, 6 – bảng `teams`).
-- Chạy sau 005_account_looks.sql, an toàn khi chạy lại nhiều lần.

-- Khóa (account_id, id) của vohons để teams tham chiếu được cả hai cột: võ hồn trong đội phải thuộc đúng tài khoản đó.
CREATE UNIQUE INDEX IF NOT EXISTS vohons_account_row_idx ON vohons(account_id, id);

-- Mỗi dòng là một ô của đội; ô trống thì không có dòng. Số ô (TEAM_SIZE trong shared/data.ts) do server kiểm tra,
-- không chép vào đây. Võ hồn đang ra trận vẫn là accounts.active_vohon và luôn nằm trong đội.
-- Tài khoản cũ chưa có dòng nào: PgStore.getTeam() (db.ts) tự xếp đội từ các võ hồn đang có ở lần vào game tới,
-- võ hồn đang ra trận ở ô 1 (slot 0). Làm trong JS để dùng đúng TEAM_SIZE.
CREATE TABLE IF NOT EXISTS teams (
  account_id  BIGINT   NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  slot        SMALLINT NOT NULL CHECK (slot >= 0),
  vohon_id    BIGINT   NOT NULL,
  PRIMARY KEY (account_id, slot),
  UNIQUE (account_id, vohon_id),
  FOREIGN KEY (account_id, vohon_id) REFERENCES vohons(account_id, id) ON DELETE CASCADE
);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
