# Database, Redis và sao lưu

Dữ liệu người chơi nằm ở PostgreSQL. Luật lưu (chuỗi lưu nối tiếp, `save` / `saveTravel`, bảng) ở `docs/tech/du-lieu-db.md`; Redis và nhiều tiến trình ở `docs/tech/presence-redis.md`. Trang này là phần **vận hành**.

## Ba môi trường DB
| Môi trường | DB | Dùng để |
|---|---|---|
| Thử nhanh | không đặt `DATABASE_URL` → `MemoryStore` (RAM, tắt server là mất) | gỡ lỗi, bot RAM |
| Dev / thử | PostgreSQL ở máy (`docker compose up -d`) hoặc **Supabase = DB test** | quay ảnh, đo FPS, thử migration |
| Prod | PostgreSQL trong cụm Kubernetes (`DATABASE_URL` từ Secret `soul-land-env`) | người chơi thật; **không bao giờ trỏ từ máy dev / bot** |

Bot, `seed:test`, lệnh GM, đo tải: chỉ chạy ở máy hoặc DB test (`docs/ops/chay-local.md`). Supabase là DB **test** (Q39 ở `docs/quyet-dinh.md`).

## PostgreSQL bằng Docker (dev)
```bash
docker compose up -d
cp .env.example server/.env      # đã có sẵn DATABASE_URL cho Postgres local
npm run dev:server
```

## Supabase (DB test)
1. Tạo project trên supabase.com, ghi nhớ mật khẩu database, chọn region gần người dùng.
2. Dashboard → **Connect** → **Connection String** → Type `URI` → Method **Session pooler**, sao chép chuỗi. Đừng dùng "Direct connection" (chỉ chạy qua IPv6) hay "Transaction pooler" (server giữ kết nối lâu dài).
3. Ghi vào `server/.env`: `DATABASE_URL=postgresql://postgres.<ref>:<mật-khẩu>@aws-0-<region>.pooler.supabase.com:5432/postgres`. Mật khẩu có ký tự đặc biệt thì mã hóa URL (`@` → `%40`, `#` → `%23`, `/` → `%2F`). SSL tự bật khi URL chứa "supabase" (hoặc đặt `PGSSL=true`).
4. Chạy `npm run dev:server`, thấy `✓ Đã kết nối PostgreSQL và cập nhật bảng.` là xong.

Gói miễn phí của Supabase tạm dừng project sau khoảng 1 tuần không truy cập; vào dashboard bấm Restore.

## Migration
Server tự tạo / cập nhật bảng mỗi lần khởi động: chạy mọi file `server/sql/*.sql` theo tên, câu lệnh chạy lại an toàn, bật Row Level Security (không tạo policy) nên Data API công khai của Supabase không đọc được dữ liệu; server kết nối bằng user `postgres`. File mới đặt tên `00N_<tên>.sql` (skill `db-migration`); không sửa file đã chạy. Đổi SQL / `db.ts` thì thử thêm bằng `npm run bot:local -- --only <nhóm> --pg` (server bật hai lần liên tiếp).

## Redis (nhiều tiến trình)
- **Prod chạy một tiến trình, không đặt `REDIS_URL`**; Redis chỉ khi thử nhiều tiến trình. Không đặt `REDIS_URL` thì server dùng `LocalPresence` + RAM, không cần dịch vụ ngoài.
- Dùng cùng `REDIS_URL` cho các tiến trình trong một cụm; **mỗi cụm / môi trường một Redis riêng**, không dùng chung Redis của dịch vụ khác (pub/sub và registry phòng của Colyseus không theo `REDIS_PREFIX`).
- Mỗi tiến trình cần `PUBLIC_ADDRESS` là địa chỉ client mở WebSocket tới đúng tiến trình đó (ví dụ `localhost:2567`, `localhost:2568`). Không đặt thì client chỉ vào được phòng ở tiến trình đã nhận HTTP. Sân đấu luôn mở ở tiến trình ghép trận.
```bash
# terminal 1
PORT=2567 REDIS_URL=redis://127.0.0.1:6379 npm run dev:server
# terminal 2
PORT=2568 REDIS_URL=redis://127.0.0.1:6379 npm run dev:server
```
- Lease có TTL 15 giây, heartbeat 5 giây: tiến trình chết không giữ tài khoản hoặc suất vô hạn. Redis đã bật mà lỗi thì server đóng phiên liên quan để tránh hai tiến trình cùng ghi; `/health` trả 503 (readiness), `/live` luôn 200.
- Thử ở máy với Redis cổng riêng (`redis-server --port 6391 --save "" --appendonly no`): `npm run test:presence-kill --prefix server` và `npm run bot:local -- --only arena --pg --procs 2` (chi tiết ở `docs/ops/chay-local.md`).

## Sao lưu
- **Supabase (DB test):** Project → Database → Backups; trước thao tác ghi lớn (ví dụ `seed:test --confirm-db`) kiểm bản sao lưu hằng ngày hoặc tạo điểm khôi phục (`docs/test-accounts.md`).
- **Prod (PostgreSQL trong cụm):** chính sách sao lưu và khôi phục **chưa ghi trong repo game**; thuộc cấu hình cụm / repo GitOps (`docs/ops/gitops.md`). Chủ repo bổ sung tại đây khi có (việc đang chờ).

## Issue liên quan
#195 / #326 (nhiều tiến trình Redis), #496 (soak Redis), #517 (tài khoản test), #561 (Redis mất giữa chừng).
