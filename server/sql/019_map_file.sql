-- Bước 11.5: tên file Tiled của bản đồ lúc lưu vị trí (GAME_DESIGN.md mục 6 "File Tiled mỗi bản đồ", "Bản đồ lớn dựng bằng tools/maps").
-- Chạy sau 007_account_map.sql, an toàn khi chạy lại nhiều lần.

-- `map_file`: tên file (không đuôi) của `map_id` lúc ghi `pos_x` / `pos_y`, ví dụ `tinh_dau_noi_dia.v2` (bản ×8) hay `tinh_dau_noi_dia`
-- (bản cũ, đường lùi MAP_V1). Tọa độ chỉ có nghĩa trên đúng file đó: vào lại mà file đang dùng khác thì server đặt người chơi ở `spawn`.
-- NULL (dòng ghi trước 11.5) coi như bản cũ `<map_id>`.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS map_file TEXT;
