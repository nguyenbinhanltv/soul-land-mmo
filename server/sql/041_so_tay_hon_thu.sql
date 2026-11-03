-- Sổ tay hồn thú (docs/design/hon-thu-boss.md "Sổ tay hồn thú", #1720, Part of #1714): bảng `bestiary`. Chạy sau 001_init.sql, an toàn khi chạy lại nhiều lần.

-- Một dòng mỗi (tài khoản, loài hồn thú thường): có dòng = đã gặp (lại gần trong BEAST_REVEAL.r); `kills` = số lần đã hạ (0 = mới gặp).
-- `species` = mã loài (BEASTS[].id, shared/data.ts). Chỉ server ghi; hạ loài thì tăng `kills` một câu upsert nên hai lần ghi cùng lúc không mất lượt.
CREATE TABLE IF NOT EXISTS bestiary (
  account_id  BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  species     TEXT        NOT NULL,
  kills       INTEGER     NOT NULL DEFAULT 0 CHECK (kills >= 0),
  first_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, species)
);
ALTER TABLE bestiary ENABLE ROW LEVEL SECURITY;
