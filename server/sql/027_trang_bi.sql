-- Trang bị hồn sư E1 (GAME_DESIGN.md mục 5.15): món đang mặc nằm ở bảng items với equip_slot (chỉ số ô trong EQUIP_SLOTS), ver đếm lần ghi.
-- Chạy sau 008_items.sql, an toàn khi chạy lại nhiều lần. Bảng items đã bật RLS ở 008 (không tạo policy).

-- equip_slot: NULL = nằm trong túi (hoặc không phải trang bị); 0–9 = đang mặc ở ô tương ứng (EQUIP_SLOTS). Đồ mặc có vohon_id NULL.
ALTER TABLE items ADD COLUMN IF NOT EXISTS equip_slot SMALLINT;
-- ver: tăng mỗi lần dữ liệu một món đổi (cấp cường hóa, chỉ số, ô mặc); chống ghi chồng cho các bước cường hóa / hợp thành (E3, E4).
ALTER TABLE items ADD COLUMN IF NOT EXISTS ver INTEGER NOT NULL DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_equip_slot_range') THEN
    ALTER TABLE items ADD CONSTRAINT items_equip_slot_range CHECK (equip_slot IS NULL OR (equip_slot BETWEEN 0 AND 9 AND vohon_id IS NULL));
  END IF;
END $$;

-- Mỗi ô của mỗi tài khoản chỉ một món đang mặc.
CREATE UNIQUE INDEX IF NOT EXISTS items_equip_slot_uq ON items (account_id, equip_slot) WHERE equip_slot IS NOT NULL;
