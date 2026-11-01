# Thư hệ thống

Màn **Thư** là hộp thư của người chơi, **một chiều** (hệ thống gửi, người chơi đọc và nhận): chỗ chứa thưởng từ Phúc Lợi, Bí Cảnh và lệnh GM, kèm vật phẩm / Hồn Tệ nhận một lần, có hạn. Thẻ "Thư" ở hub hiện đang khóa ("Chờ máy chủ", `client/src/hubMenu.ts`, mã `mail`). Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`; tên *(đề xuất)* chưa tồn tại). Số issue ở cuối file. **Server (P1–P4) đã có code** (#1336: `MAIL` / `MAIL_KINDS` ở `shared/data.ts`, `040_thu.sql`, `server/src/rooms/mail.ts`, bot nhóm `mail`, soát `docs/tech/soat-gian-lan-thu.md`); nguồn Phúc Lợi / Bí Cảnh chưa nối (xem "Câu hỏi mở" 1); màn client (P5, `client/src/mailScreen.ts`, thẻ `mail` ở hub) xong.

Tham chiếu: chỉ học bố cục (danh sách thư bên trái, nội dung bên phải, nút nhận) từ bộ tham chiếu UI của #877; không chép tên / chữ / ảnh.

## 5.24 Thư hệ thống

### Mục tiêu
- Cho thưởng một **chỗ chờ an toàn**: thưởng của Phúc Lợi / Bí Cảnh khi túi đầy, và quà GM tặng, không bị mất.
- **Không thêm nguồn thưởng:** thư chỉ **chuyển giao** thứ mà hệ khác đã quyết định cho (đúng số lượng đó), không tự sinh thưởng mới. Trần thưởng của từng hệ vẫn là trần của hệ đó (`docs/design/phuc-loi.md`, `docs/design/bi-canh.md`).
- **Một chiều, không thư người chơi gửi nhau:** không chat riêng, không gửi đồ giữa người chơi (mục 5.7 cấm giao dịch), nên không có đường lừa đảo / spam qua thư.
- **Không nạp tiền, không bán / chuyển thư hay vật phẩm đính kèm.**

### Nguồn thư
Chỉ **server** tạo thư, ở nơi chính nó quyết định sự kiện. Mỗi thư có `kind` (nguồn) và `dedup` (khóa chống tạo trùng).

| `kind` | Khi nào gửi | `dedup` (đề xuất) |
|---|---|---|
| `welfare` (Phúc Lợi) | Ký ô điểm danh / ký bù mà **túi không đủ chỗ**: thay vì từ chối, quà vào thư (tuỳ chọn, xem "Câu hỏi mở" 1) | `welfare:<chu kỳ>:<ô>` |
| `bicanh` (Bí Cảnh) | Cuối phòng mà túi đầy: thưởng quyển chuyển vào thư thay vì mất | `bicanh:<ngày>:<mã phòng>` |
| `gm` (lệnh GM) | `/gm mail <mã vật phẩm> [số lượng]` của tài khoản trong `ADMIN_ACCOUNTS`: v1 gửi cho **chính người gõ** (thử hộp thư); gửi theo tên người khác để sau | `gm:<mã ngẫu nhiên mỗi lệnh>` |

- Thư hệ thống do server soạn (tiêu đề, nội dung ngắn, tiếng Việt, đúng tên gốc Đấu La); thư GM v1 có tiêu đề / nội dung cố định. Mọi thư bị kiểm bởi `mailOk` (`db.ts`): nguồn trong `MAIL_KINDS`, trần độ dài (`MAIL.titleMax`, `MAIL.bodyMax`), đính kèm trong trần.
- Nguồn mới sau này (Thành Tựu, sự kiện, bù server) chỉ cần thêm một `kind` + một chỗ gọi `sendMail`; không đổi giao thức.

### Thư có gì
Mỗi thư: **tiêu đề, nội dung, người gửi** (nhãn theo `kind`, không phải tên người chơi), **vật phẩm đính kèm** (danh sách `{id, n}` theo `ITEMS`, tối đa `MAIL.maxAttach` dòng, mỗi dòng ≤ `MAIL.maxQty`, chỉ vật phẩm gộp thường, không hồn hoàn / cốt / hạch / trang bị) và **Hồn Tệ đính kèm** (có thể 0), **ngày gửi, hạn**, trạng thái đọc / nhận.

- **Đã đọc** (`read`): chỉ để bỏ chấm đỏ, không đổi gì khác; mở thư thì client gửi `read`, hay đánh dấu hàng loạt.
- **Đã nhận** (`claimed`): nhận **cả gói đính kèm một lần**, không nhận nửa chừng. Thư không đính kèm thì chỉ có "đã đọc".
- **Hạn:** `MAIL.ttlDays` ngày kể từ lúc gửi. Hết hạn thì thư **ẩn và dọn**, đính kèm chưa nhận bị bỏ (chỉ hiển thị cảnh báo "còn N ngày" khi sắp hết, nhãn nổi bật khi ≤ `MAIL.warnDays`). Thư đã nhận / đã đọc không đính kèm có thể xóa tay; thư còn đính kèm chưa nhận **không xóa tay được** (tránh bấm nhầm mất quà).
- **Giới hạn hộp:** tối đa `MAIL.boxMax` thư mỗi tài khoản. Đầy thì **thư cũ nhất đã nhận hoặc không đính kèm bị dọn trước** (xóa mềm); nếu vẫn đầy (toàn thư còn quà) thì `mailSend` trả `full`, nguồn **giữ quà ở nguồn** (xem "Câu hỏi mở" 2), không bỏ quà.

### Quy tắc nhận (tóm tắt hành vi)
1. Người chơi mở Thư → danh sách (mới nhất trên cùng), chấm đỏ nếu còn thư chưa đọc **hoặc** còn đính kèm chưa nhận.
2. Bấm "Nhận" ở một thư (hoặc "Nhận tất cả" trong giới hạn `MAIL.claimAllMax` thư mỗi lần, từ thư cũ nhất): server kiểm hạn + chưa nhận + túi đủ chỗ, rồi ghi **đã nhận** và vật phẩm / Hồn Tệ vào túi **trong cùng một transaction**.
3. Túi không đủ chỗ → từ chối bằng `err` tiếng Việt "Túi không đủ chỗ", thư giữ nguyên, không nhận nửa phần.
4. "Nhận tất cả" dừng ở thư đầu tiên không nhận được (túi đầy) và báo đã nhận bao nhiêu; không xếp lại thứ tự.

### Dữ liệu và nơi tính
- Hằng số **`MAIL`** ở `shared/data.ts`: `ttlDays`, `warnDays`, `boxMax`, `maxAttach`, `maxQty`, `maxHonTe`, `titleMax`, `bodyMax`, `claimAllMax`, và bảng nhãn MAIL_KINDS (`kind` → tên người gửi hiển thị). Tài liệu này trỏ tên hằng, không chép số.
- Vật phẩm đính kèm chỉ gồm `id` có trong `ITEMS`; `/gm mail` kiểm `id` lạ / vật phẩm có dữ liệu riêng / vượt trần như `/gm give` hiện có.

### Lưu trữ
SQL mới `server/sql/00N_thu.sql` (N kế tiếp trên `origin/main` lúc làm; chạy lại an toàn, bật RLS), theo skill `db-migration`:

```
mail(
  id bigserial primary key, account_id bigint not null references accounts(id) on delete cascade,
  kind text not null, dedup text not null,
  title text not null, body text not null default '',
  honTe int not null default 0, items jsonb not null default '[]',
  created_at timestamptz not null default now(), expires_at timestamptz not null,
  read_at timestamptz, claimed_at timestamptz, deleted_at timestamptz,
  unique (account_id, dedup)
)
index (account_id, created_at desc)
```

- **Chống tạo trùng:** `INSERT … ON CONFLICT (account_id, dedup) DO NOTHING` — một sự kiện nguồn (chạy lại, hai tiến trình, nối lại) chỉ ra **một** thư.
- **Nhận nguyên tử** (khuôn `checkinClaim` / `claimBoss`): trong một transaction, `UPDATE mail SET claimed_at = now(), read_at = COALESCE(read_at, now()) WHERE id = $id AND account_id = $a AND claimed_at IS NULL AND expires_at > now() RETURNING items, honTe`; không trúng dòng nào thì **dừng, không cộng gì**; trúng thì cộng vào túi / `items` cùng transaction. Không dùng cột `ver`: điều kiện `claimed_at IS NULL` đã đủ.
- **Hạn tính ở DB** (`now()` của DB), không tin giờ client; thư hết hạn của một người bị dọn (xóa cứng) lúc người đó mở hộp thư, không quét toàn bảng. **Xóa tay là xóa mềm** (`deleted_at`): `dedup` còn chặn nguồn tạo lại tới hết hạn.
- Ghi DB của một người chơi qua `this.chain(d, fn)`, giữ chỗ trong RAM (`claimBusy`: không bán / bỏ / hấp thụ lúc chờ), DB báo lỗi thì **hoàn** (không cộng quà, không đổi `claimed_at`).
- `Store.mailList / mailSend / mailRead / mailClaim / mailDelete` (`mailClaim` trả `ok` / `gone`) thêm vào **cả** `PgStore` lẫn `MemoryStore`; `Store.removeTestAccount` thêm bảng này.

### Giao thức
Bổ sung vào bảng ở `docs/tech/giao-thuc-server.md` khi làm (kiểm `tools/docs-check.mjs`).

| Hướng | Tin | Nội dung | Nhóm / giới hạn |
|---|---|---|---|
| client → server | `mail {op: "get" \| "read" \| "claim" \| "claimAll" \| "del", id?}` | `get`: xin danh sách; `read`: đánh dấu đã đọc; `claim` / `claimAll`: nhận đính kèm; `del`: xóa | `get` / `read`: `read`; `claim` / `claimAll` / `del`: `trade` (ghi DB) |
| server → client | `mail {list, unread, pending, claimedNow?, err?}` | `list`: thư (`id`, `from`, `title`, `body`, `honTe`, `items`, `at`, `exp`, `read`, `claimed`); `unread` / `pending`: số thư chưa đọc / còn đính kèm (cho chấm đỏ); `claimedNow` `{count, honTe, items}`: kết quả lần vừa nhận; `err`: lý do tiếng Việt | riêng |

- Server gửi `mail` lúc vào phòng (cho chấm đỏ) và khi có thư **mới** tới người đang online; không tự nhận hộ.
- Từ chối bằng `err` tiếng Việt: thư lạ / không phải của mình, đã nhận, hết hạn, túi đầy, đang đi cổng, `claimBusy`; nhận được ở mọi trạng thái an toàn khác. `ArenaRoom` / `BiCanhRoom` chặn `mail`; thêm vào bài `cheat` (dồn `claim` 200 lần, `id` lạ / của người khác, nhận thư hết hạn).

### Chống gian lận
Soát theo skill `anti-cheat-audit`; kết quả ghi ở `docs/tech/soat-gian-lan-thu.md`.
- **Chỉ server tạo thư và quyết định đính kèm;** client không có tin tạo thư nào. Thư GM chỉ qua `ADMIN_ACCOUNTS`, tắt ở bản prod mặc định (`tools` kiểm cổng GM đã có).
- **Không nhận trùng:** `claimed_at IS NULL` trong câu `UPDATE` nguyên tử + `unique (account_id, dedup)` lúc tạo; không có đường nhận ngoài transaction.
- **Chỉ thư của chính mình:** mọi câu SQL ràng `account_id`; `id` thư của người khác coi như "thư lạ".
- **Không nhân thưởng qua thư:** thư từ Phúc Lợi / Bí Cảnh thay cho phần thưởng **không** cộng vào túi; server không cộng hai lần (túi + thư). Cách ghi chung một transaction với dấu "đã ký / đã dùng lượt" của nguồn.
- **Không thành đường đổi đồ giữa tài khoản:** thư chỉ có chiều hệ thống → người chơi; thư không chứa tên / địa chỉ người chơi khác. Nuôi nhiều tài khoản chỉ nhận đúng phần từng tài khoản chơi thật.
- **Tài khoản test** (`is_test`): nhận bình thường; bài bot dọn dòng `mail` khi xong.
- **Tải:** `get` / `read` nhóm `read`, `claim` / `claimAll` / `del` nhóm `trade`; mỗi người một chỉ mục `(account_id, created_at)`, danh sách cắt ở `MAIL.boxMax`.

### Kinh tế
Nguyên tắc: **thư không phải nguồn thưởng.** Test cân bằng kiểm quan hệ, không chép số:

| Thứ | Quan hệ |
|---|---|
| Quà từ Phúc Lợi / Bí Cảnh qua thư | **bằng đúng** phần thưởng của hệ đó; test: gửi qua thư rồi nhận = nhận thẳng, không hơn |
| Quà GM | không có trần cứng (tay GM), nhưng mỗi dòng ≤ trần như `/gm give`; có log người gửi / người nhận / nội dung |
| Thư hết hạn | đính kèm bị bỏ: chủ ý, để thư không thành kho vô hạn; người chơi thấy cảnh báo |

### Giao diện
- Khi mở lại, giữ nội dung cũ để đọc và báo đang cập nhật; `get` quá hạn thì ghi rõ dữ liệu cũ, lỗi cập nhật và **Thử lại** (chỉ gửi `get`). Tin hợp lệ mới xóa cảnh báo; dùng chung timer với nhận thưởng, không tự retry (#1566).
Chất liệu **Giấy** (kit gốc, `docs/art/ui-kit.md`): cửa sổ riêng mở từ thẻ `mail` ở hub (`client/src/hubMenu.ts`, hiện `why: "Chờ máy chủ"` → nối bảng, bỏ khóa); Esc đóng theo ngăn xếp (`panelStack.ts`); PC.
- **Bố cục:** danh sách thư bên trái (mỗi dòng: biểu tượng đọc / chưa đọc, tiêu đề, người gửi, ngày, nhãn hạn), nội dung bên phải (tiêu đề, người gửi, nội dung, lưới đính kèm, nút "Nhận" / "Nhận tất cả", "Xóa"); vùng bấm 32–44 px.
- **Trạng thái dòng** (hình + chữ, không chỉ màu): *chưa đọc* (đậm + chấm), *đã đọc*, *có đính kèm chưa nhận* (biểu tượng quà + nhãn), *đã nhận* (xám + dấu tick), *sắp hết hạn* (nhãn cảnh báo).
- **Trạng thái bắt buộc:** đang tải, đang gửi (nút tắt, không cho bấm đôi), thành công (toast + dòng đổi trạng thái), lỗi (lý do tiếng Việt; "Túi không đủ chỗ" ghi rõ), mất kết nối, hộp thư trống.
- **Chấm đỏ ở hub:** `unread > 0 || pending > 0` (suy từ tin `mail`).

### Lộ trình triển khai (mỗi bước một PR nhỏ)
| Bước | Việc | Kiểm thử |
|---|---|---|
| P0 | Tài liệu này (+ dòng mục lục `GAME_DESIGN.md`) | `npm run check`, `tools/docs-check.mjs` |
| P1 | `shared/data.ts`: `MAIL`, MAIL_KINDS; hàm thuần kiểm thư hợp lệ | `npm run check` |
| P2 | SQL `mail` + `Store.mail*` (cả `PgStore` lẫn `MemoryStore`) | bot `--pg`: migration chạy lại hai lần; nhận có điều kiện không nhân quà khi hai tiến trình tranh |
| P3 | Server: tin `mail`, `mail.ts`, `sendMail`, nối nguồn (GM; Phúc Lợi / Bí Cảnh khi túi đầy), hoàn khi lỗi | bot nhóm mới `mail`: nhận khi có, nhận đúp, thư hết hạn, id lạ / của người khác, túi đầy, dồn 200 `claim`; hook `savefail` |
| P4 | Soát chống gian lận (`anti-cheat-audit`) → file soát riêng trong docs/tech | tài liệu soát |
| P5 | Client: màn Thư kit Giấy + chấm đỏ hub | `client-ui` + ảnh chụp Chrome headless (`--mute-audio`) đủ trạng thái, 3 cỡ |

### Câu hỏi mở (cho chủ repo)
Ca đêm: chọn phương án **an toàn** làm tiếp; sửa sau nếu chủ repo muốn đổi.
1. **Túi đầy ở Phúc Lợi / Bí Cảnh:** đề xuất (đang chọn) **chuyển vào thư** thay vì từ chối. Phương án thay: giữ hành vi hiện tại (từ chối, "Túi không đủ chỗ"), thư chỉ cho GM; ít đổi hơn nhưng bỏ mất mục đích chính. *Bước server đầu chỉ nối GM + đường thư; nối hai hệ kia làm ở PR sau khi chủ repo xác nhận, để không đổi hành vi đang chạy.*
2. **Hộp đầy** (`MAIL.boxMax`): đề xuất giữ quà ở nguồn (không tạo thư) và báo người chơi dọn thư; phương án thay: ghi đè thư cũ nhất.
3. **Thư hết hạn:** đề xuất bỏ đính kèm sau `MAIL.ttlDays`; phương án thay: không bao giờ hết hạn với thư có đính kèm (hộp dễ đầy).
4. **Thư GM gửi cả máy chủ** (broadcast): để sau; v1 chỉ gửi theo từng tài khoản.

## Lịch sử / issue liên quan
- Theo dõi: #1336 (Part of #877); bộ spec UI #877.
- Khuôn nhận đúng một lần có túi và DB một transaction: Sổ Điểm Danh (`docs/design/phuc-loi.md`, `checkinClaim`), Thành Tựu (`docs/design/thanh-tuu.md`), đổi mảnh ở Thương hội (mục 5.7).
- Nguồn thư: Phúc Lợi (mục 5.21), Bí Cảnh (mục 5.22); lệnh GM ở `docs/ops/chay-local.md`.
- Nhật ký từng bước: `docs/lich-su.md`.
