-- L4 (#511, kế hoạch #507): đếm số lần đổi ngoại hình ở thợ may, GAME_DESIGN.md mục 5.11 "Hồn sư chế độ Tự tạo".
-- Chạy sau 029_account_lpc.sql, an toàn khi chạy lại nhiều lần. Bảng accounts đã bật RLS ở 001_init.sql.

-- Số lần đã đổi ngoại hình sau khi tạo nhân vật (lần chọn đầu, looks_chosen, không tính). Giá từng lần do LOOKS_CHANGE (shared/data.ts)
-- quyết định; server đọc cột này để biết lần đổi kế tiếp có miễn phí không và tăng nó cùng transaction với việc trừ Hồn Tệ.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS looks_changes INTEGER NOT NULL DEFAULT 0;
