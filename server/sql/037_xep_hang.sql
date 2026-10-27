-- Bảng Xếp Hạng nhiều hạng mục (docs/design/xep-hang.md mục 5.19, bước X2): bảng `rank_scores`.
-- Chạy sau 001_init.sql, an toàn khi chạy lại nhiều lần.

-- Mỗi dòng: điểm của một tài khoản ở một hạng mục. `board` là mã trong RANK_BOARDS (shared/data.ts); `period` 0 = mọi thời, còn lại = mã kỳ.
-- `score` / `tie` do server suy ra từ dữ liệu đã lưu (client không gửi điểm); `extra` = đội hình hiển thị công khai (mã võ hồn, cấp, sao).
-- `updated_at` chỉ đổi khi `score` đổi ("ai đạt mốc điểm đó trước", xem câu ghi ở db.ts `rankPut`).
CREATE TABLE IF NOT EXISTS rank_scores (
  board       TEXT        NOT NULL,
  period      INTEGER     NOT NULL DEFAULT 0,
  account_id  BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  score       BIGINT      NOT NULL,
  tie         BIGINT      NOT NULL DEFAULT 0,
  extra       JSONB,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (board, period, account_id)
);
-- Phục vụ đúng thứ tự xếp (điểm, phụ, đạt trước, mã) cho trang bảng và đếm hạng của mình.
CREATE INDEX IF NOT EXISTS rank_scores_order ON rank_scores (board, period, score DESC, tie DESC, updated_at, account_id);
ALTER TABLE rank_scores ENABLE ROW LEVEL SECURITY;
