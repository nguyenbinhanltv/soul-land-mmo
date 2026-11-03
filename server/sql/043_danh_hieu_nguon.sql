-- Danh Hiệu P5 (docs/design/danh-hieu.md mục 5.25, "Nguồn mở khoá"): hai bảng chống cấp trùng. Chạy sau 042_danh_hieu.sql, an toàn khi chạy lại nhiều lần.

-- Dấu chốt tuần: một dòng mỗi (tuần, bảng xếp hạng). `week_day` = ngày thứ Hai của tuần ĐÃ KẾT THÚC (tongWeekDay). Dòng này và các dòng `title_owned` của bảng đó
-- ghi chung MỘT transaction (db.ts `titleCloseWeek`): có dấu = đã cấp đủ, khởi động lại / hai pod cùng chốt thì chỉ một nơi ghi được, không cấp hai lần.
CREATE TABLE IF NOT EXISTS title_week_close (
  week_day   DATE        NOT NULL,
  board      TEXT        NOT NULL,
  closed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (week_day, board)
);
ALTER TABLE title_week_close ENABLE ROW LEVEL SECURITY;

-- Boss / thú vương lần đầu (server-first): khoá chính theo mã boss, nên chỉ MỘT lần hạ (`kill_key`) ghi được dòng; kênh / pod khác thua ở ràng buộc này.
-- Mọi người đóng góp của CHÍNH lần hạ đó (cùng `kill_key`) đều được danh hiệu.
CREATE TABLE IF NOT EXISTS title_first_kill (
  boss_id    TEXT        PRIMARY KEY,
  kill_key   TEXT        NOT NULL,
  killed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE title_first_kill ENABLE ROW LEVEL SECURITY;
