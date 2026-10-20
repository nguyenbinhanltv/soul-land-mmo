-- Bước 9.9: tông da hồn sư chọn khi tạo nhân vật (GAME_DESIGN.md mục 5.11, Lộ trình 9.9).
-- Chạy sau 005_account_looks.sql, an toàn khi chạy lại nhiều lần. Bảng accounts đã bật RLS ở 001_init.sql.

-- Chỉ số trong SKIN_TONES (shared/data.ts), khoảng hợp lệ do server kiểm tra bằng parseLooks(), không chép số vào đây.
-- Mặc định 0 = tông da sprite đang vẽ (#f1c7a0): mọi tài khoản có từ trước bước này giữ nguyên tông 0.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS skin SMALLINT NOT NULL DEFAULT 0;
