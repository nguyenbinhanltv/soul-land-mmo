-- Phúc Lợi: Sổ Điểm Danh 21 ngày (docs/design/phuc-loi.md mục 5.21, bước P2): bảng `checkin_state`.
-- Chạy sau 001_init.sql, an toàn khi chạy lại nhiều lần.

-- Một dòng mỗi tài khoản (chu kỳ đang chạy). `start_day` = số ngày từ 1970-01-01 theo giờ Việt Nam của ô 1 (vnDayNum); `mask` bit i = ô i đã ký
-- (i = 0 .. CHECKIN.days - 1, tối đa 30 ô); `makeup_used` = số ô ký bù đã dùng trong chu kỳ; `last_at` = lần ký gần nhất theo đồng hồ server
-- (phát hiện đồng hồ lùi); `ver` tăng mỗi lần ghi để ghi có điều kiện (db.ts `checkinClaim`).
CREATE TABLE IF NOT EXISTS checkin_state (
  account_id   BIGINT      PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  cycle        INTEGER     NOT NULL DEFAULT 0,
  start_day    INTEGER     NOT NULL,
  mask         INTEGER     NOT NULL DEFAULT 0 CHECK (mask >= 0 AND mask < (1 << 30)),
  makeup_used  INTEGER     NOT NULL DEFAULT 0 CHECK (makeup_used >= 0),
  last_at      TIMESTAMPTZ,
  ver          INTEGER     NOT NULL DEFAULT 0
);
ALTER TABLE checkin_state ENABLE ROW LEVEL SECURITY;
