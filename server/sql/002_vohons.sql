-- Giai đoạn 2: tài khoản sở hữu nhiều võ hồn (GAME_DESIGN.md mục 5.1).
-- Chạy sau 001_init.sql, an toàn khi chạy lại nhiều lần.

CREATE TABLE IF NOT EXISTS vohons (
  id          BIGSERIAL PRIMARY KEY,
  account_id  BIGINT   NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  vohon       TEXT     NOT NULL,                 -- mã võ hồn trong VOHON (shared/data.ts)
  level       SMALLINT NOT NULL DEFAULT 1,
  xp          INTEGER  NOT NULL DEFAULT 0,
  stars       SMALLINT NOT NULL DEFAULT 1,
  rings       INTEGER[] NOT NULL DEFAULT '{}',   -- niên hạn (số năm) từng hồn hoàn, theo thứ tự vòng
  kills       INTEGER  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, vohon)
);
CREATE INDEX IF NOT EXISTS vohons_account_idx ON vohons(account_id);
ALTER TABLE vohons ENABLE ROW LEVEL SECURITY;

-- Chuyển nhân vật cũ (bảng characters, 1 võ hồn tạm) thành võ hồn đầu tiên của tài khoản.
-- Chỉ chạy cho tài khoản chưa có võ hồn nào. Bảng characters được giữ lại, không còn ghi vào.
-- Võ hồn tạm cũ -> võ hồn mới gần nhất; hồn hoàn theo bậc -> số năm nhỏ nhất của bậc (TIERS[].years).
INSERT INTO vohons (account_id, vohon, level, xp, rings, kills)
SELECT c.account_id,
       CASE c.vohon
         WHEN 0 THEN 'hoa_long'                  -- Hỏa Long Thương
         WHEN 1 THEN 'yeu_ho'                    -- Băng Tuyết Hồ
         WHEN 2 THEN 'kim_vu_mieu_ung'           -- Lôi Ưng
         WHEN 3 THEN 'lam_ngan_thao'             -- Thanh Mộc Đằng
         ELSE        'thien_can_bach_ngoc_dinh'  -- Kim Cương Thuẫn
       END,
       c.level, c.xp,
       ARRAY(SELECT (ARRAY[10, 100, 1000, 10000, 100000])[t + 1]
             FROM unnest(c.rings) WITH ORDINALITY AS r(t, i) ORDER BY i),
       c.kills
FROM characters c
WHERE NOT EXISTS (SELECT 1 FROM vohons v WHERE v.account_id = c.account_id);
