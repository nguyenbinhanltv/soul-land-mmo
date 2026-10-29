-- Thành Tựu (docs/design/thanh-tuu.md mục 5.23, bước P2): bảng `achv_state`. Chạy sau 001_init.sql, an toàn khi chạy lại nhiều lần.

-- Một dòng mỗi tài khoản (tạo lần đầu khi có bộ đếm hoặc khi nhận): `claimed` = mã thành tựu đã nhận (ACHV[].id, shared/data.ts);
-- `counters` = bộ đếm sự kiện chỉ tăng {"elite": n, "king": n, "world": n, "bicanh": n} (ACHV_COUNTERS). Tài khoản chưa có dòng = chưa nhận gì, bộ đếm 0.
-- Nhận một lần chặn bằng điều kiện `NOT (claimed @> ARRAY[id])` trong câu UPDATE cùng transaction với túi / Hồn Tệ (db.ts `achvClaim`), không cần cột phiên bản.
CREATE TABLE IF NOT EXISTS achv_state (
  account_id  BIGINT      PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  claimed     TEXT[]      NOT NULL DEFAULT '{}',
  counters    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE achv_state ENABLE ROW LEVEL SECURITY;
