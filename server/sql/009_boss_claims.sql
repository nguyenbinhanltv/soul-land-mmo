-- Bước BĐ5: lượt nhận thưởng boss mỗi ngày (GAME_DESIGN.md mục 5.4, 6 – bảng `boss_claims`).
-- Chạy sau 008_items.sql, an toàn khi chạy lại nhiều lần.

-- Mỗi dòng: số lần một tài khoản đã nhận rương của một loại boss trong một ngày. `day` là ngày theo giờ Việt Nam
-- (Asia/Ho_Chi_Minh, đổi lúc 00:00), server tự tính (vnDay trong shared/data.ts), không dùng giờ client hay múi giờ máy chủ DB.
-- `kind`: 'thu_vuong' (tà hóa thú vương, BĐ5, tối đa 3 lần/ngày tính chung mọi bản đồ); boss thế giới thêm loại riêng ở BĐ6.
-- Giới hạn mỗi ngày (KING.daily) do server kiểm tra trong cùng transaction ghi rương vào túi, không chép vào đây.
CREATE TABLE IF NOT EXISTS boss_claims (
  account_id  BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day         DATE        NOT NULL,
  kind        TEXT        NOT NULL,
  n           INTEGER     NOT NULL DEFAULT 0 CHECK (n >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, day, kind)
);
ALTER TABLE boss_claims ENABLE ROW LEVEL SECURITY;
