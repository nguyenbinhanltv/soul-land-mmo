# Tài khoản test (max / giữa game / mới)

Dành cho chủ repo: tạo một tài khoản **riêng, xoá được** để thử game mà không cần cày. Tài khoản có cờ `is_test` (migration `server/sql/028_is_test.sql`):

- ẩn khỏi mọi bảng xếp hạng (đấu trường, cộng minh, tông tuần), kể cả hạng của chính nó;
- chỉ ghép Đại Đấu Hồn Trường với tài khoản test khác, không bao giờ với người thật;
- là loại tài khoản **duy nhất** script được sửa hoặc xoá: tên trùng một tài khoản thật thì script từ chối.

Công cụ: `server/scripts/seed-test-account.ts` (lệnh `npm run seed:test --prefix server -- …`). Mức dựng sẵn nằm ở `server/src/testPreset.ts`; mọi giới hạn lấy từ `shared/data.ts`, nên đổi luật thì mức `max` tự đổi theo.

## Ba mức dựng sẵn

| Mức | Nội dung |
| --- | --- |
| `max` | Mọi võ hồn cấp tối đa, sao tối đa, đủ 10 hồn hoàn mỗi vòng đúng niên hạn tối đa của vòng đó, 4 hồn kỹ mạnh nhất, tiên thảo đầy. Mỗi võ hồn gắn đủ 6 hồn cốt (100.000 năm, cường hóa tối đa) và 6 hồn hạch cùng bộ (sao tối đa, nâng cấp tối đa). 10 ô trang bị bậc cao nhất, cường hóa tối đa, may mắn tối đa. Túi tối đa ô có đan, phù, lệnh, nguyên liệu, hồn hoàn mỗi bậc; 1.000 kim Hồn Tệ; mở mọi truyền tống trận; đội 4 võ hồn mạnh nhất, đứng ở Thiên Đấu Thành. |
| `giua-game` | 6 võ hồn, 4 võ hồn đầu cấp 55 (5 hồn hoàn, 3 sao), 2 võ hồn còn lại cấp 30; võ hồn ra trận gắn 6 hồn cốt 10.000 năm +5, 4 hồn hạch 4★ +6, cả 10 trang bị Tử Kim +5; 20 kim, túi mở thêm một trang, truyền tống trận các bản đồ tới cấp 55. Định nghĩa chính xác ở đầu `server/src/testPreset.ts`. |
| `moi` | Ngay sau lễ thức tỉnh: Lam Ngân Thảo + một võ hồn SSR, cấp 1, không đồ (server tặng vật phẩm khởi đầu ở lần vào game đầu), ở Thánh Hồn Thôn. |

Không dựng: nhiệm vụ, tông môn, cài đặt tự săn, Elo, bạn bè. Dựng lại (`--preset` lên tài khoản test đã có) xoá võ hồn, đồ, đội, nhiệm vụ, truyền tống, tự săn, điểm tông, lượt nhận thưởng boss của riêng tài khoản đó rồi ghi lại; Elo, bạn bè, mật khẩu giữ nguyên.

## An toàn: công cụ này làm gì và không làm gì

- **Mặc định chạy thử**: chỉ in những gì sẽ ghi, **không nối DB**.
- **Chỉ nối DB khi có `--confirm-db <host>`** khớp host trong `DATABASE_URL`. Script **không tự đọc `server/.env`**: bạn tự đặt `DATABASE_URL` trong phiên shell. Sai host thì dừng, không nối gì.
- Không chạy khi có biến môi trường `CI`.
- Chỉ đụng đúng tài khoản `--name`. Không có cờ `is_test` thì từ chối (cả ghi đè lẫn `--remove`).
- Mọi thay đổi trong **một transaction**; lỗi thì không ghi gì.
- **Từ chối khi tài khoản đang online**, vì server ghi đè dữ liệu lúc người chơi thoát: có `REDIS_URL` thì hỏi khoá phiên (chính xác); không có thì coi phiên đăng nhập trong 30 phút gần nhất là có thể đang online (thêm `--force-offline` khi bạn đã chắc đã thoát game). **Thoát game trước khi chạy lại.**
- Lần ghi thật chạy mọi file `server/sql/*.sql` (migration, chạy lại an toàn) giống lúc server khởi động, để có cột `is_test`.

## Chạy trên Supabase, từng bước

Làm trên máy của bạn (không dùng agent). Dưới đây `<host>` là phần host trong chuỗi kết nối, ví dụ `aws-0-xx.pooler.supabase.com`; dùng chuỗi **Session pooler** như server vẫn dùng.

1. **Sao lưu trước.** Supabase → Project → Database → Backups: kiểm bản sao lưu hằng ngày gần nhất, hoặc tạo điểm khôi phục (PITR nếu gói có), hoặc `pg_dump "<DATABASE_URL>" -Fc -f soul-truoc-test.dump`. Migration 028 chỉ thêm một cột `is_test` mặc định `false`, không đổi dòng nào; script chỉ ghi dòng của tài khoản test.
2. **Đặt `DATABASE_URL` trong phiên shell hiện tại** (không ghi vào file, không dán vào chat):
   - PowerShell: `$env:DATABASE_URL = "<chuỗi Session pooler>"`
   - bash: `export DATABASE_URL='<chuỗi Session pooler>'`
3. **Chạy thử, không nối DB** (xem sẽ ghi gì):
   ```
   npm run seed:test --prefix server -- --name TestMax --preset max
   ```
4. **Chạy thử có nối DB, chỉ đọc** (báo tài khoản đã có chưa, có cờ `is_test` không, có đang online không; không chạy migration, không ghi):
   ```
   npm run seed:test --prefix server -- --name TestMax --preset max --confirm-db <host> --dry-run
   ```
5. **Ghi thật** (tạo tài khoản mới sẽ hỏi mật khẩu ẩn trong terminal; hoặc thêm `--password <mật khẩu>`, nhưng mật khẩu sẽ nằm trong lịch sử shell):
   ```
   npm run seed:test --prefix server -- --name TestMax --preset max --confirm-db <host>
   ```
   Thấy `✓ Đã tạo tài khoản test "TestMax"` là xong. Đăng nhập trong game bằng đúng tên đó và mật khẩu vừa đặt. Các mức khác: `--preset giua-game`, `--preset moi` (dùng tên khác nhau cho mỗi tài khoản).
6. **Dựng lại** một tài khoản test đã có (về đúng mức, mật khẩu giữ nguyên): chạy lại lệnh ở bước 5 sau khi đã thoát game (chờ 30 phút hoặc thêm `--force-offline` nếu không có Redis).
7. **Xoá sạch** khi không dùng nữa (xoá mọi bảng liên quan rồi dòng tài khoản, in số dòng mỗi bảng):
   ```
   npm run seed:test --prefix server -- --name TestMax --remove --confirm-db <host>
   ```
8. Xong thì đóng phiên shell (hoặc xoá biến: PowerShell `Remove-Item Env:DATABASE_URL`, bash `unset DATABASE_URL`).

Nếu có sự cố: dừng, không chạy thêm lệnh nào lên DB, khôi phục từ bản sao lưu ở bước 1.

## Lệnh GM trong game (#518)

Cho phép chủ repo chỉnh tài khoản đang chơi mà không phải thoát game. **Mặc định tắt hẳn.**

1. Biết `accounts.id` của tài khoản (Supabase → Table editor → `accounts`, tìm theo `name`).
2. Đặt biến môi trường `ADMIN_ACCOUNTS=<id>[,<id>…]` cho server rồi khởi động lại. Trống hoặc không đặt = không ai dùng được lệnh GM (kể cả khi gõ).
3. Trong game, ô chat: `/gm <lệnh>`. Người không có trong danh sách chỉ nhận dòng "Không có quyền dùng lệnh GM"; mọi lệnh (kể cả bị từ chối) ghi một dòng `[GM]` vào log server.

| Lệnh | Việc |
| --- | --- |
| `/gm level <cấp>` | Đặt cấp võ hồn đang ra trận (tự thêm hồn hoàn đúng giới hạn vòng cho đủ bình cảnh) |
| `/gm give <mã vật phẩm> [số lượng]` | Cho đồ gộp thường (đan, phù, lệnh, mảnh, nguyên liệu…) |
| `/gm ring <số năm> [số lượng]` | Cho hồn hoàn |
| `/gm bone <mã loài> <vị trí> [số năm] [cường hóa]` | Cho hồn cốt (vị trí: `dau`, `than`, `tay_trai`, `tay_phai`, `chan_trai`, `chan_phai`) |
| `/gm core <mã bộ> <sao> [nâng cấp]` | Cho hồn hạch |
| `/gm gear <mã mẫu> [cấp vật phẩm] [cường hóa]` | Cho trang bị (mã mẫu `<ô>_<bậc>`, vd `vu_khi_chi_bao`) |
| `/gm vohon <mã võ hồn> [cấp] [số hồn hoàn]` | Thêm võ hồn kèm hồn hoàn |
| `/gm coin <đồng>` | Đặt Hồn Tệ |
| `/gm tp <mã bản đồ>` | Dịch chuyển |
| `/gm fog [open\|reset]` | Sương mù khám phá: mở cả bản đồ đang đứng (mặc định) hoặc xoá về trống |
| `/gm preset max\|giua-game\|moi` | Áp mức dựng sẵn (như script) rồi ngắt kết nối; vào lại game để thấy |

Mọi giá trị bị kẹp theo giới hạn của luật (vd cấp ≤ 100, cường hóa ≤ mức tối đa); sai thì báo lỗi, không đổi gì. Tài khoản dùng lệnh GM lần đầu **tự bật `is_test`** (ẩn khỏi xếp hạng, chỉ đấu trường với tài khoản test); tắt cờ chỉ bằng SQL tay (`UPDATE accounts SET is_test=false WHERE id=…`).

**Tổ đội đấu trường:** tổ đội có cả tài khoản test và người thật không xếp hàng Đại Đấu Hồn Trường được (báo từ chối); đội test chỉ gặp đội test.

## Kiểm thử (cho người làm code)

- `npm run test:seed --prefix server`: mức dựng sẵn hợp lệ với luật (`checkSeed`), `seedTestAccount` / `removeTestAccount`, từ chối tài khoản thật, ẩn khỏi xếp hạng. Mặc định MemoryStore; đặt `TEST_DATABASE_URL` (một database **riêng**, vd PostgreSQL cục bộ của `npm run bot:local`) để thử cả PgStore.
- `npm run bot:local -- --only testacc --seed-test max --pg`: dựng tài khoản `max` vào database cục bộ của lượt chạy rồi để bot đăng nhập: vào game, mở túi, đổi võ hồn, hạ hồn thú, kiểm ẩn khỏi xếp hạng, vào lại.
- `npm run test:gm --prefix server` (phần thuần của lệnh GM) và `npm run bot:local -- --only gm --pg` (admin dùng được, người thường bị từ chối, `preset` ghi đè DB).
- Agent **không** trỏ công cụ này vào DB thật (xem `CLAUDE.md`); sự cố bot ghi vào DB thật ở #406 là lý do script mặc định không nối DB.
