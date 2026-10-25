---
name: db-migration
description: Cách thêm bảng, cột hoặc chuyển dữ liệu PostgreSQL / Supabase (server/sql/00N_*.sql) và cập nhật lớp lưu trữ server/src/db.ts (PgStore + MemoryStore). Dùng khi tính năng cần lưu dữ liệu lâu dài mới hoặc đổi cách ghi dữ liệu người chơi.
---

# Thay đổi cơ sở dữ liệu

## Cách server chạy migration
`PgStore.init()` trong `server/src/db.ts` đọc **mọi** file `.sql` trong `server/sql/`, sắp theo tên và chạy lần lượt **mỗi lần server khởi động**. Không có bảng ghi "đã chạy", nên mỗi file phải chạy lại được vô hạn lần mà không lỗi và không nhân đôi dữ liệu. File mới tự được nạp.

## Viết file SQL mới
1. Tạo `server/sql/00N_<ten>.sql` với N là số kế tiếp (lúc viết skill: file cuối là `016_account_skin.sql`). Luôn xem `git fetch` rồi `git ls-tree --name-only origin/main server/sql/` (nhánh khác có thể vừa thêm file) để không trùng số. Không sửa file cũ đã chạy trên DB thật, trừ khi chỉ thêm câu lệnh an toàn khi chạy lại.
2. Đầu file: chú thích tiếng Việt nói file làm gì, trỏ tới file thiết kế `docs/design/…` hoặc `docs/tech/du-lieu-db.md`.
3. Câu lệnh chạy lại an toàn: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`; chuyển dữ liệu bằng `INSERT ... SELECT ... WHERE NOT EXISTS (...)` (mẫu ở cuối `002_vohons.sql`) hoặc `ON CONFLICT DO NOTHING`.
4. **Bật RLS cho mọi bảng mới**: `ALTER TABLE <bang> ENABLE ROW LEVEL SECURITY;` và **không** tạo policy (Data API công khai của Supabase không đọc được; server kết nối bằng user `postgres` nên không bị chặn; giải thích ở cuối `001_init.sql`).
5. Khóa ngoại tới `accounts(id)` dùng `ON DELETE CASCADE`. Mã (võ hồn, vật phẩm, bản đồ…) lưu `TEXT` theo mã cố định trong `shared/data.ts`. Niên hạn lưu số năm; Hồn Tệ lưu một số nguyên (đồng).
6. Số cân bằng (như `TEAM_SIZE`) không chép vào SQL. Chuyển dữ liệu cần số đó thì làm trong JS ở store (như `getTeam` tự xếp đội cho tài khoản cũ, `backfillNameKeys`).

Bảng hiện có và vai trò: `docs/tech/du-lieu-db.md` (mục "Dữ liệu lâu dài").

## Cập nhật `server/src/db.ts`, luôn song song hai nơi
1. Thêm / đổi kiểu dữ liệu và chữ ký hàm trong interface `Store`.
2. Cài trong **`PgStore`**: SQL có tham số `$1, $2…` (không nối chuỗi); nhiều câu lệnh liên quan thì dùng một transaction trên một kết nối (`BEGIN` … `COMMIT`, lỗi thì `ROLLBACK` rồi ném lỗi), như `saveTravel`, `saveBag`, `claimBoss`, `saveArena`.
3. Cài trong **`MemoryStore`** với hành vi giống hệt (dùng khi không có `DATABASE_URL`): kiểm tra xong mới gán mọi trường trong một hàm đồng bộ, trả bản sao để room không sửa thẳng dữ liệu lưu.
4. Gọi từ `MapRoom.ts` / `ArenaRoom.ts` / `index.ts` qua `store`, không viết SQL ở nơi khác. Mọi lần ghi về một người chơi đi qua chuỗi lưu `this.chain(d, fn)`; dữ liệu chưa lưu mới phải có trong cả lần lưu thường **và** transaction đi cổng `saveTravel` (mục 6 "Đi qua cổng và lưu vị trí").
5. Cột JSONB (ví dụ `items.stats`) đổi thứ tự khóa khi đọc lại: so sánh phải sắp khóa, không `JSON.stringify` thẳng.

## Kiểm tra
- `npm run check`.
- Chạy tuần tự, mỗi lượt trên server mới bật (state sạch): `npm run bot:local` (`CLAUDE.md` phần Lệnh) lo cổng, server và dọn dẹp.
- Chế độ RAM: `npm run bot:local -- --only <nhóm>` (nhóm gần phần dữ liệu đổi; bot đầy đủ để CI `bot-ram`).
- Sau đó PostgreSQL thật, chạy server **hai lần liên tiếp**; cả hai lần phải in `✓ Đã kết nối PostgreSQL và cập nhật bảng.` (chứng minh chạy lại an toàn), rồi chạy bot:
  - `npm run bot:local -- --only <nhóm> --pg`: PostgreSQL chung của máy (tự bật từ `embedded-postgres` trong `node_modules`, cổng 5433), database riêng UTF8 mỗi lượt, server bật hai lần (log ở `ci-logs/local-*-server.log` có hai dòng `✓ Đã kết nối…`) rồi bot, xoá database khi xong. Không tự bật embedded-postgres riêng.
  - Có Docker / PostgreSQL cài sẵn: `BOT_PG_URL=postgres://…/postgres` cho công cụ; server dev thì `docker compose up -d`, `cp .env.example server/.env`.
- Thử nhánh "tài khoản cũ" khi chuyển dữ liệu: chạy server và bot của `origin/main` trên cùng DB trước, rồi mới chạy bản mới (tạo database tay trên instance chung `postgres://postgres@localhost:5433/postgres`, xoá khi xong).
