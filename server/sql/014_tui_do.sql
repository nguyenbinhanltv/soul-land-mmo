-- Bước 9.8: số ô túi đồ của tài khoản sau khi mua "Mở rộng túi" ở thương nhân (GAME_DESIGN.md mục 5.7, 5.8).
-- Chạy sau 013_tien_thao.sql, an toàn khi chạy lại nhiều lần. Bảng accounts đã bật RLS ở 001_init.sql.

-- `bag_slots`: số ô túi đồ hiện có. NULL = chưa mở rộng lần nào (mức khởi đầu BAG_SLOTS trong shared/data.ts), nên tài khoản có
-- từ trước không cần chuyển dữ liệu. Ghi cùng Hồn Tệ trong mọi lần lưu túi (writeBag); chỉ tăng, không bao giờ giảm. Mức khởi đầu,
-- số ô mỗi lần, mức tối đa và giá (BAG_SLOTS, BAG_EXPAND, BAG_MAX_SLOTS, BAG_EXPAND_COST) do server kiểm tra, không chép vào đây.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS bag_slots SMALLINT;
