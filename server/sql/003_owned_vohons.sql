-- Bước 2.2: tài khoản sở hữu nhiều võ hồn, chọn 1 võ hồn ra trận (GAME_DESIGN.md mục 5.1).
-- Chạy sau 002_vohons.sql, an toàn khi chạy lại nhiều lần.

-- Võ hồn đang ra trận. NULL = chưa chọn -> dùng võ hồn sở hữu sớm nhất.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS active_vohon BIGINT REFERENCES vohons(id) ON DELETE SET NULL;

-- Tài khoản cũ (đã có võ hồn từ bước 2.1) được tặng Lam Ngân Thảo nếu chưa có. Võ hồn cũ giữ nguyên và vẫn ra trận.
-- Cấp khởi đầu = hồn lực bẩm sinh cũ (characters.innate) nếu còn, không thì cấp 1.
INSERT INTO vohons (account_id, vohon, level)
SELECT o.account_id, 'lam_ngan_thao', COALESCE(c.innate, 1)
FROM (SELECT DISTINCT account_id FROM vohons) o
LEFT JOIN characters c ON c.account_id = o.account_id
WHERE NOT EXISTS (SELECT 1 FROM vohons v WHERE v.account_id = o.account_id AND v.vohon = 'lam_ngan_thao')
ON CONFLICT (account_id, vohon) DO NOTHING;
