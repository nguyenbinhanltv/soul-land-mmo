-- Bước 3.1: túi đồ và Hồn Tệ (GAME_DESIGN.md mục 5.7, 6 – bảng `items`).
-- Chạy sau 007_account_map.sql, an toàn khi chạy lại nhiều lần. Bảng accounts đã bật RLS ở 001_init.sql.

-- Hồn Tệ lưu một số nguyên (đồng); đồng / ngân / kim chỉ quy đổi khi hiển thị (formatHonTe trong shared/data.ts).
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS hon_te BIGINT NOT NULL DEFAULT 0;
-- Đã nhận vật phẩm khởi đầu (STARTER_ITEMS) chưa: tài khoản mới và tài khoản cũ đều nhận một lần ở lần vào game tới.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS starter_items BOOLEAN NOT NULL DEFAULT false;

-- Mỗi dòng là một ô trong túi đồ (một món, hoặc một chồng đồ gộp được). id do server sinh (UUID) ngay khi món đồ xuất hiện,
-- nên phòng game dùng được id trước khi ghi DB; lần lưu ghi cả túi (thêm, sửa, xóa ô) trong một transaction.
-- `kind` là nhóm vật phẩm (ITEM_KINDS: đan, hồn hoàn, hồn cốt, hồn hạch, mảnh võ hồn, tiên thảo), `code` là mã trong ITEMS.
-- Mã không bao giờ đổi; mã không còn trong ITEMS thì server vẫn giữ dòng (không bao giờ mất đồ). Số ô, số món mỗi chồng
-- (BAG_SLOTS, ItemDef.stack) do server kiểm tra, không chép vào đây.
CREATE TABLE IF NOT EXISTS items (
  id          UUID        PRIMARY KEY,
  account_id  BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind        TEXT        NOT NULL,
  code        TEXT        NOT NULL,
  qty         INTEGER     NOT NULL DEFAULT 1 CHECK (qty > 0),
  years       INTEGER,                         -- số năm (hồn hoàn, hồn cốt); NULL = không có
  stars       SMALLINT,                        -- sao (hồn hạch 1–6, mảnh võ hồn)
  enhance     SMALLINT    NOT NULL DEFAULT 0,  -- cấp cường hóa (hồn cốt +0..+20, hồn hạch +0..+15)
  stats       JSONB,                           -- dòng chỉ số (chỉ số chính / phụ của hồn cốt, hồn hạch)
  vohon_id    BIGINT,                          -- đang gắn vào võ hồn nào (vohons.id); NULL = nằm trong túi
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Đồ gắn vào võ hồn phải là võ hồn của chính tài khoản đó (khóa vohons_account_row_idx tạo ở 006_teams.sql).
  FOREIGN KEY (account_id, vohon_id) REFERENCES vohons(account_id, id)
);
CREATE INDEX IF NOT EXISTS items_account_idx ON items(account_id);
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
