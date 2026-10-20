-- Bước 8.1a: 4 ô hồn kỹ mang theo của từng võ hồn (GAME_DESIGN.md mục 5.2 "Hồn kỹ theo vòng").
-- Chạy sau 010_quests.sql (và 011_arena.sql của bước 7.2 nếu có), an toàn khi chạy lại nhiều lần.

-- `skills`: chỉ số vòng (0..9) của hồn kỹ ở các ô U / I / O / P theo thứ tự, -1 = ô trống. Mảng rỗng = chưa chọn: server dùng mặc
-- định vòng 1–4 (DEFAULT_LOADOUT trong shared/data.ts), nên võ hồn có từ trước không cần chuyển dữ liệu. Chỉ ghi khi người chơi xếp
-- lại ô (store.saveSkills); các lần lưu tiến độ võ hồn (level, xp, rings…) không đụng tới cột này. Kiểm tra hợp lệ (vòng đã mở, có
-- hồn kỹ, không trùng) do server làm bằng parseLoadout / ringSkill, không chép luật vào đây.
ALTER TABLE vohons ADD COLUMN IF NOT EXISTS skills SMALLINT[] NOT NULL DEFAULT '{}';
