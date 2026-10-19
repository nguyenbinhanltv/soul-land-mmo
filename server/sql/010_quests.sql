-- Bước 6.2: tiến độ nhiệm vụ (GAME_DESIGN.md mục 5.8, 6 – bảng `quests`; chuỗi tân thủ của Ngọc Tiểu Cương).
-- Chạy sau 009_boss_claims.sql, an toàn khi chạy lại nhiều lần.

-- Mỗi dòng: tiến độ của một tài khoản trong một chuỗi nhiệm vụ (`chain` = mã trong QUESTS của shared/data.ts, ví dụ 'tan_thu';
-- nhiệm vụ hằng ngày của Sử Lai Khắc về sau thêm chuỗi mới, không cần bảng mới). `step`: chỉ số bước đang làm (bằng số bước của
-- chuỗi = đã xong cả chuỗi); `accepted`: đã nhận bước đó chưa; `prog`: mảng JSON số đếm từng mục tiêu của bước đó.
-- Tài khoản chưa có dòng (tài khoản mới và tài khoản có từ trước 6.2) bắt đầu ở bước 1, chưa nhận; server không chèn trước.
-- Ghi cùng transaction với túi đồ và Hồn Tệ (writeBag trong db.ts: lưu định kỳ, rời phòng, đi cổng, trả nhiệm vụ) nên phần thưởng
-- và bước mới luôn được ghi cùng nhau. Số lượng mục tiêu và phần thưởng do server đọc từ QUESTS, không chép vào đây.
CREATE TABLE IF NOT EXISTS quests (
  account_id  BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  chain       TEXT        NOT NULL,
  step        SMALLINT    NOT NULL DEFAULT 0 CHECK (step >= 0),
  accepted    BOOLEAN     NOT NULL DEFAULT false,
  prog        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, chain)
);
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
