-- Bước 2.2a: ngoại hình hồn sư chọn khi tạo nhân vật (GAME_DESIGN.md mục 3, 5.11).
-- Chạy sau 004_account_name_key.sql, an toàn khi chạy lại nhiều lần. Bảng accounts đã bật RLS ở 001_init.sql.

-- Chỉ số trong SEXES, HAIR_STYLES, HAIR_COLORS, OUTFIT_COLORS (shared/data.ts). Khoảng hợp lệ do server kiểm tra
-- bằng parseLooks(), không chép số vào đây. Mặc định 0 = ngoại hình mặc định (DEFAULT_LOOKS).
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sex        SMALLINT NOT NULL DEFAULT 0;  -- 0 nam, 1 nữ
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS hair       SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS hair_col   SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS outfit_col SMALLINT NOT NULL DEFAULT 0;

-- false = chưa tự chọn ngoại hình. Tài khoản mới chọn ngay trước lễ thức tỉnh; tài khoản cũ (có từ trước bước này)
-- nhận ngoại hình mặc định và được chọn lại đúng một lần ở lần vào game tới. Server đặt true khi lưu lựa chọn.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS looks_chosen BOOLEAN NOT NULL DEFAULT false;
