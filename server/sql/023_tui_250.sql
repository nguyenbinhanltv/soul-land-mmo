-- Issue #215: túi đồ 250 ô (5 trang × 50), mỗi lần mở rộng +50 ô tới 500 (GAME_DESIGN.md mục 5.7, 5.8).
-- Chạy sau 014_tui_do.sql, an toàn khi chạy lại nhiều lần. Bảng accounts đã bật RLS ở 001_init.sql.

-- Đổi số ô của tài khoản thời túi cũ (khởi đầu 40 ô, +10 ô mỗi lần mở rộng, tối đa 80) sang mức mới, giữ số lần đã mở rộng:
-- 250 + số lần × 50, với số lần = (cũ − 40) / 10. Các số 40 / 10 / 250 / 50 ở đây là mức cũ và mức mới tại thời điểm chuyển, chép
-- vào để câu chuyển không đổi nghĩa khi BAG_SLOTS / BAG_EXPAND trong shared/data.ts đổi về sau.
-- Chỉ chạm dòng còn ở mức cũ (< 250), nên chạy lại không cộng thêm lần nữa; NULL (chưa mở rộng) giữ nguyên = BAG_SLOTS.
UPDATE accounts SET bag_slots = 250 + GREATEST(0, (bag_slots - 40) / 10) * 50 WHERE bag_slots IS NOT NULL AND bag_slots < 250;
