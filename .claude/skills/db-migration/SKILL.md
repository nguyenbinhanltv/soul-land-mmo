---
name: db-migration
description: Cách thêm bảng, cột hoặc chuyển dữ liệu PostgreSQL/Supabase (server/sql/00N_*.sql) và cập nhật lớp lưu trữ server/src/db.ts. Dùng khi tính năng cần lưu dữ liệu lâu dài mới: võ hồn, items, teams, túi đồ, tiền tệ.
---

# Thay đổi cơ sở dữ liệu

## Cách server chạy migration
`PgStore.init()` trong `server/src/db.ts` đọc **mọi** file `.sql` trong `server/sql/`, sắp theo tên và chạy lần lượt **mỗi lần server khởi động**. Không có bảng ghi "đã chạy", nên mỗi file phải chạy lại được vô hạn lần mà không lỗi và không nhân đôi dữ liệu. File mới tự được nạp, không cần đăng ký thêm.

## Viết file SQL mới
1. Tạo `server/sql/00N_<ten>.sql` với N là số kế tiếp (`ls server/sql`; hiện có `001_init.sql`, `002_vohons.sql`). Worker khác có thể cũng đang thêm file: kiểm tra nhánh `main` mới nhất để tránh trùng số. Không sửa file cũ đã chạy trên DB thật, trừ khi chỉ thêm câu lệnh an toàn khi chạy lại.
2. Đầu file: chú thích tiếng Việt nói file làm gì, trỏ tới mục trong `GAME_DESIGN.md`.
3. Câu lệnh chạy lại an toàn:
   - `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`
   - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
   - Chuyển dữ liệu: `INSERT ... SELECT ... WHERE NOT EXISTS (...)` (mẫu ở cuối `002_vohons.sql`) hoặc `ON CONFLICT DO NOTHING`.
4. **Bật RLS cho mọi bảng mới**: `ALTER TABLE <bang> ENABLE ROW LEVEL SECURITY;` và **không** tạo policy. Data API công khai của Supabase vì vậy không đọc được; server kết nối bằng user `postgres` nên không bị chặn (giải thích ở cuối `001_init.sql`).
5. Khóa ngoại tới `accounts(id)` dùng `ON DELETE CASCADE`. Mã võ hồn lưu dạng `TEXT` theo `VOHON[].id` trong `shared/data.ts` (mã không bao giờ đổi). Niên hạn lưu theo số năm. Tiền (Hồn Tệ) lưu một số nguyên (đồng).
6. Dự kiến theo `GAME_DESIGN.md` mục 6: `vohons` (đã có), `teams` (đã có, `006_teams.sql`), `items` (mỗi món có id riêng).
7. Số cân bằng (như `TEAM_SIZE`) không chép vào SQL. Chuyển dữ liệu cần số đó thì làm trong JS ở store (ví dụ `getTeam` tự xếp đội cho tài khoản cũ) như `backfillNameKeys`.

## Cập nhật `server/src/db.ts`, luôn song song hai nơi
1. Thêm/đổi kiểu dữ liệu (như `Character`) và chữ ký hàm trong interface `Store`.
2. Cài trong **`PgStore`** (SQL có tham số `$1, $2…`, không nối chuỗi; nhiều câu lệnh liên quan thì dùng transaction như `awaken()`).
3. Cài trong **`MemoryStore`** với hành vi giống hệt (dùng khi không có `DATABASE_URL`, bot test hay chạy chế độ này). Trả về bản sao (`{ ...c, rings: [...c.rings] }`) để room không sửa thẳng dữ liệu lưu.
4. Gọi từ `MapRoom.ts` / `index.ts` qua `store`, không viết SQL ở nơi khác.

## Kiểm tra
- `npm run check`.
- Chế độ RAM: `npm run dev:server` (không có `DATABASE_URL`) + `npm run bot --prefix client`.
- PostgreSQL thật: `docker compose up -d`, `cp .env.example server/.env`, chạy server **hai lần liên tiếp**; cả hai lần phải in `✓ Đã kết nối PostgreSQL và cập nhật bảng.` (chứng minh chạy lại an toàn), rồi chạy bot.
