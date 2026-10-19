-- Bước BĐ2: bản đồ đang đứng và vị trí của hồn sư (GAME_DESIGN.md mục 5.3, 6 "Đi qua cổng và lưu vị trí").
-- Chạy sau 006_teams.sql, an toàn khi chạy lại nhiều lần. Bảng accounts đã bật RLS ở 001_init.sql.

-- Mã bản đồ trong MAPS (shared/data.ts). NULL = chưa lưu (tài khoản mới, tài khoản có từ trước BĐ2): server coi là bản đồ
-- khởi đầu DEFAULT_MAP (Thánh Hồn Thôn). Mã không còn trong MAPS cũng được server ánh xạ, nên không chép mã nào vào đây.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS map_id TEXT;
-- Tọa độ (pixel) của hồn sư trên bản đồ đó; vị trí thuộc hồn sư, không thuộc võ hồn. NULL hoặc kẹt trong ô chặn -> về `spawn`.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS pos_x REAL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS pos_y REAL;
