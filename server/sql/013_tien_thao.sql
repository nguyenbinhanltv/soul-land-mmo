-- Bước BĐ6b: tiên thảo đã dùng trên từng võ hồn (GAME_DESIGN.md mục 5.3 "Lạc Nhật Sâm Lâm", 5.7).
-- Chạy sau 012_vohon_skills.sql, an toàn khi chạy lại nhiều lần.

-- `herbs`: JSON mã tiên thảo (HERBS trong shared/data.ts) -> số cây đã dùng cho võ hồn này, ví dụ {"y_la_uat_kim_huong": 3}.
-- Rỗng = chưa dùng cây nào, nên võ hồn có từ trước không cần chuyển dữ liệu. Ghi cùng các lần lưu tiến độ võ hồn (level, xp, stars,
-- rings…); dùng tiên thảo ghi võ hồn và túi đồ (đã bớt cây) trong một transaction (store.saveVohonsBag). % chỉ số mỗi cây và số cây
-- tối đa (HERB_PCT, HERB_MAX) do server kiểm tra và tính bằng herbBonus, không chép vào đây.
ALTER TABLE vohons ADD COLUMN IF NOT EXISTS herbs JSONB NOT NULL DEFAULT '{}'::jsonb;
