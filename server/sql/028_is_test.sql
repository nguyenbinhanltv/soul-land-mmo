-- Tài khoản TEST (#517, docs/test-accounts.md): chủ repo tạo bằng `npm run seed:test --prefix server` để thử game (max cấp / đồ, giữa game, mới).
-- Chạy sau 027_trang_bi.sql, an toàn khi chạy lại nhiều lần. Bảng accounts đã bật RLS ở 001_init.sql (không tạo policy).

-- is_test: tài khoản test bị ẩn khỏi mọi bảng xếp hạng (đấu trường, cộng minh, tông), không ghép đấu trường với người thật, và là loại
-- tài khoản DUY NHẤT script seed / --remove được phép sửa hoặc xoá. Mặc định false: tài khoản đang có không bị ảnh hưởng.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
