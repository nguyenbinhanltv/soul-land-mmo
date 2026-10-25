-- Chỉ mục cho bảng xếp hạng tông môn (#738): truy vấn tongBoard lọc theo tuần rồi nhóm theo tông, nhưng khoá chính bắt đầu bằng account_id.
-- Xem docs/tech/du-lieu-db.md. Chạy lại an toàn.
CREATE INDEX IF NOT EXISTS tong_points_week_tong ON tong_points (week, tong);
