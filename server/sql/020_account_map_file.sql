-- Bước 11.5: phiên bản bản đồ của vị trí đã lưu (GAME_DESIGN.md mục 6 "Đi qua cổng và lưu vị trí").
-- Chạy sau 007_account_map.sql, an toàn khi chạy lại nhiều lần. Bảng accounts đã bật RLS ở 001_init.sql.

-- Tên file Tiled (không đuôi, `mapFile` ở server/src/map.ts: `<mapId>` bản cũ hoặc `<mapId>.v2` bản dựng bằng tools/maps) mà server
-- đang dùng cho `map_id` lúc ghi pos_x / pos_y. Tọa độ chỉ có nghĩa trên đúng file đó: khi vào, file khác file server đang dùng thì
-- vào ở `spawn`. NULL = ghi trước bước này, coi là bản cũ `<map_id>`. Không chuyển dữ liệu: dòng cũ giữ NULL.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS map_file TEXT;
