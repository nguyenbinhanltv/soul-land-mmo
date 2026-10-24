-- R8 (#435, kế hoạch #426): sương mù khám phá bản đồ (GAME_DESIGN.md mục 5.17). Chạy sau 029_account_lpc.sql (030 do PR khác giữ),
-- an toàn khi chạy lại nhiều lần.
-- Mỗi tài khoản × bản đồ một dòng: `cells` là bitset ô thô (FOG.cell × FOG.cell ô lưới, bit thấp trước, shared/fog.ts), bản đồ 255×170 ô
-- chỉ khoảng 90 byte. `map_file` là file Tiled của toạ độ (như accounts.map_file): đổi file bản đồ thì bitset cũ không còn đúng, server bỏ
-- và bắt đầu lại. Số liệu cân bằng (cỡ ô, bán kính nhìn) ở shared/data.ts, không chép vào SQL. Chỉ server ghi, qua chuỗi lưu của người chơi.
CREATE TABLE IF NOT EXISTS map_fog (
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  map_id     TEXT   NOT NULL,
  map_file   TEXT   NOT NULL,
  cells      BYTEA  NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, map_id)
);
ALTER TABLE map_fog ENABLE ROW LEVEL SECURITY;
