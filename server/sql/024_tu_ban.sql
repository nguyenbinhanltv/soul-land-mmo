-- #216: tự bán từ xa khi túi đầy (GAME_DESIGN.md mục 5.7 "Tự bán", mục 6 "Dữ liệu lâu dài").
-- Chạy sau 023_tui_250.sql, an toàn khi chạy lại nhiều lần. Bảng items, accounts đã bật RLS từ trước.

-- Món người chơi khoá: không bao giờ bị bán (tay hay tự bán), bỏ, hay dùng làm nguyên liệu cường hóa / nâng cấp.
ALTER TABLE items ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false;

-- Bộ lọc tự bán (JSON, server kiểm lại bằng parseSell trong shared/data.ts; NULL = mặc định, tắt) và AUTO_SELL_BUYBACK món tự bán
-- gần nhất để mua lại ở thương nhân (mảng JSON {key, item, price, at}, mới nhất trước). Ghi cùng transaction với túi đồ và Hồn Tệ.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS auto_sell JSONB;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS auto_sold JSONB;
