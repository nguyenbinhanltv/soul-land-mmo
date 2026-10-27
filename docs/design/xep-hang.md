# Bảng Xếp Hạng nhiều hạng mục

Màn **Xếp Hạng** gom mọi bảng xếp hạng vào một chỗ: nhóm hạng mục bên trái, bục top 3, bảng điểm, dòng "của tôi" ghim đáy. Bảng đã có (đấu trường, cộng minh, tông tuần) giữ nguyên luật và tin; tài liệu này thêm hạng mục mới, khung màn chung và đường tính / lưu. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`; mọi tên đánh dấu *(đề xuất)* chưa tồn tại, đặt khi làm). Số issue ở cuối file. **Chỉ là thiết kế, chưa có code.**

Tham chiếu bố cục: ảnh 14 (bảng xếp hạng) trong bộ tham chiếu UI của #877; chỉ học bố cục, không chép.

## 5.19 Bảng Xếp Hạng

### Mục tiêu
- Cho người chơi thấy mình đứng đâu và ai đang dẫn đầu ở nhiều trục (cày cấp, sưu tầm, thực lực, PvP, tông), không chỉ trục Elo.
- **Khó gian lận:** điểm chỉ do server suy ra từ dữ liệu đã lưu hoặc sự kiện server tự chứng kiến; client không gửi điểm. Phần thưởng cho thứ hạng nhỏ để không tạo động cơ gian lận (mục "Kinh tế").
- Rẻ: không thêm truy vấn nặng mỗi lần mở bảng; dùng lại cache `RANK_BOARD_CACHE` và chỉ mục.

### Hạng mục
Hai tầng điều hướng (nhóm rồi mục). RANK_BOARDS *(đề xuất, mảng cố định, thêm cuối)* khai mã, nhóm, tên, kiểu nguồn, kỳ.

| Nhóm | Mục (mã) | Điểm xếp | Kỳ | Nguồn | Giai đoạn |
|---|---|---|---|---|---|
| Người chơi | **Cấp** (`cap`) | cấp võ hồn cao nhất; bằng nhau: kinh nghiệm cao hơn, rồi đạt trước (`accounts` / `vohons`) | mọi thời | đọc thẳng | v1 |
| Người chơi | **Sức mạnh** (`suc_manh`) | `powerScore` của đội hình ra trận (ảnh chụp, mục dưới) | mọi thời | bảng điểm lưu | v1 |
| Người chơi | **Sưu tầm** (`suu_tam`) | số võ hồn sở hữu, rồi tổng sao | mọi thời | đọc thẳng | v1 |
| Người chơi | **Cộng minh** (`cong_minh`) | đã có: `resonanceRankValue` / `resonanceRankCompare` (mục 5.10) | mọi thời | đã có | v1 (chỉ nối màn) |
| Đấu trường | **Elo** (`elo`) | đã có: `arena_ratings` (mục 5.9) | mọi thời | đã có | v1 (chỉ nối màn) |
| Tông môn | **Tông tuần** (`tong`) | đã có: điểm trung bình thành viên hoạt động + top cá nhân (mục 5.14) | tuần | đã có | v1 (chỉ nối màn) |
| Người chơi | **Thợ săn tuần** (`san_tuan`) | điểm săn tuần (mục dưới) | tuần | bảng điểm lưu | v2 |
| Người chơi | **Boss thế giới** (`boss_tg`) | sát thương gây lên boss thế giới trong lần xuất hiện gần nhất | theo lần | bảng điểm lưu | v2 |

Ghi chú từng mục:
- **Sức mạnh** không phải tổng chỉ số thô: `powerScore` (hàm thuần trong `shared/data.ts`, client dùng để giải thích, server tính thật) cộng có trọng số chỉ số do `calcStats` trả cho tối đa `TEAM_SIZE` võ hồn đội hình, **không tính** buff tạm, thức ăn, hiệu ứng trận, **có tính** hồn hoàn / hồn cốt / hồn hạch / trang bị đang gắn và cộng minh. Trọng số ở RANK_POWER *(đề xuất)*, cân qua skill `balance-data`; mục tiêu là chọn đúng thứ người chơi thấy là "mạnh" chứ không thưởng một chỉ số duy nhất.
- **Thợ săn tuần** (v2): điểm = Σ RANK_HUNT_PTS[bậc] *(đề xuất)* cho mỗi hồn thú **hợp cấp** (`fitBeast`) do người đó góp công theo luật chia thưởng hiện có, trần RANK_HUNT_DAILY_CAP điểm mỗi ngày giờ Việt Nam; tuần theo `tongWeek`. Chỉ cộng ở chỗ server đã chốt thưởng (không cộng khi hết khóa thưởng `eliteLocks`).
- **Boss thế giới** (v2): lấy từ bảng đóng góp sát thương mà `MapRoom` đã giữ để chia thưởng; chốt khi boss hạ / hết giờ, ghi một lần. Không có hạng cho người chỉ đứng xem.
- Tài khoản `is_test` và tài khoản đã bật cờ do lệnh GM **ẩn khỏi mọi bảng, kể cả hạng của chính nó** (giống mục 5.9, 5.14). Cùng luật cho hạng mục mới.

### Luật chung của mọi bảng
- Tie-break luôn xác định: điểm giảm dần, rồi chỉ tiêu phụ của hạng mục, rồi **ai đạt mốc điểm đó trước** (`updated_at` tăng), rồi `account_id`; hai lần đọc liền nhau không đảo thứ tự.
- Phân trang kiểu cộng minh: trang 1-based, RANK_PAGE_SIZE / RANK_PAGE_MAX *(đề xuất; mặc định lấy bằng `RESONANCE_RANK_PAGE_SIZE` / `_MAX`)*, kết quả có `total`, `hasNext`. Chỉ có người **đã có điểm** mới được xếp (như Elo: chưa đấu thì không).
- Hạng của mình luôn tính riêng, không lấy từ cache danh sách (một truy vấn đếm theo chỉ mục, như `arena_ratings_rank`); người ẩn / chưa có điểm nhận `me: null` và màn hiện "Chưa có hạng".
- Dòng công khai chỉ có: hạng, tên hiển thị, điểm, tông (`PlayerState.tong`), và với Sức mạnh / Cấp: **đội hình** (mỗi ô mã võ hồn + cấp + sao; xem câu hỏi mở). Không có Hồn Tệ, túi, bản đồ, kênh, vị trí.
- Không có "mùa giải" xóa bảng cho hạng mục mọi thời; hạng mục theo kỳ (tuần / lần boss) giữ **kỳ trước** để xem lại một kỳ, rồi xóa khi qua kỳ thứ hai.

### Dữ liệu và nơi tính
Mọi tính toán ở server; client chỉ gửi `rank {op, board, page}`.

| Loại nguồn | Cách tính | Làm tươi |
|---|---|---|
| **Đọc thẳng** (Cấp, Sưu tầm, Cộng minh, Elo, Tông) | truy vấn trên bảng canonical (`vohons`, `accounts`, `arena_ratings`, `tong_points`) theo chỉ mục phục vụ thứ tự xếp; `MemoryStore` và `PgStore` cùng tính | cache `RANK_BOARD_CACHE` giây; ghi Elo / điểm trong cùng tiến trình xóa cache (`rankBoardClear`, mục 6 DB) |
| **Bảng điểm lưu** (Sức mạnh, Thợ săn tuần, Boss thế giới) | server ghi `rank_scores` khi có sự kiện: lưu định kỳ / lên cấp / thay đội hình (Sức mạnh, tối thiểu cách RANK_POWER_CD giây mỗi người), lúc chốt thưởng (săn, boss) | giống trên |

- **Ảnh chụp Sức mạnh:** chỉ tính lại ở các mốc **ổn định** (thoát phòng, lưu định kỳ, đổi đội hình / gắn đồ xong và đã ghi DB), không tính giữa trận, không tính khi đang trong sân đấu. Điểm lưu là ảnh chụp tại lần ghi thành công gần nhất; hạng của mình hiển thị kèm "cập nhật lúc …".
- Số quan hệ giữa điểm hiển thị cho chính chủ (bảng Nhân vật) và điểm trong bảng phải cùng hàm `powerScore`; test so hai đường tính.
- Bảng Elo / cộng minh / tông tuần **không đổi** tin riêng của chúng (`arena {op:"top"}`/`arenaTop`, `resonance {op:"top"}`/`resonanceTop`, `tong {op:"board"}`/`tongBoard`). Giai đoạn đầu client có bộ nối (adapter) gọi đúng tin cũ; hợp nhất vào tin `rank` là việc tùy chọn về sau (cần sửa client + bot cùng lúc, mục "Giao thức").

### Lưu trữ
**SQL đề xuất** `server/sql/00N_xep_hang.sql` (N kế tiếp trên `origin/main` lúc làm; hiện bản mới nhất là 036), chạy lại an toàn, bật RLS không tạo policy:

```
rank_scores (
  board      text    NOT NULL,   -- mã trong RANK_BOARDS
  period     integer NOT NULL,   -- 0 = mọi thời; còn lại = mã kỳ (tongWeek, số lần boss)
  account_id integer NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  score      bigint  NOT NULL,
  tie        bigint  NOT NULL DEFAULT 0,   -- chỉ tiêu phụ của hạng mục
  extra      jsonb,                         -- đội hình hiển thị (mã võ hồn, cấp, sao) nếu hạng mục có
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (board, period, account_id)
);
CREATE INDEX IF NOT EXISTS rank_scores_order ON rank_scores (board, period, score DESC, tie DESC, updated_at, account_id);
```

- Ghi `INSERT … ON CONFLICT DO UPDATE … WHERE rank_scores.score IS DISTINCT FROM EXCLUDED.score` (không tạo phiên bản dòng vô ích, như `upsertItems`). Điểm **chỉ ghi qua chuỗi lưu** của người đó (`this.chain(d, fn)`), trong cùng transaction với lần ghi sinh ra điểm khi có thể (điểm săn đi cùng lần ghi thưởng).
- `Store.rankTop(board, period, page, pageSize)` và `Store.rankMe(board, period, accountId)` thêm vào cả `PgStore` lẫn `MemoryStore`; ba hạng mục đọc thẳng không dùng `rank_scores`. Xóa kỳ cũ bằng một câu `DELETE` theo `period` (quét mỗi giờ, như `pruneSessions`).
- Xóa tài khoản test / `removeTestAccount`: thêm bảng này vào danh sách xóa (đã `ON DELETE CASCADE` thì kiểm test).
- **Redis (tùy chọn):** prod hiện chạy một tiến trình không đặt `REDIS_URL` (mục 6 presence), nên **nguồn sự thật là PostgreSQL** và cache trong tiến trình. Khi bật `REDIS_URL` có thể thêm ZSET `rank:<board>:<period>` làm bộ đọc chung nhiều tiến trình (điểm hợp nhất `score` và `tie` vào một số, `ZREVRANK` cho hạng của mình), dựng lại từ DB lúc khởi động; mất Redis thì theo luật hiện hành (`/health` 503, **không** tự rơi về RAM). Không bắt buộc cho v1.

### Giao thức
Bổ sung vào bảng ở `docs/tech/giao-thuc-server.md` khi làm (kiểm `tools/docs-check.mjs`).

| Hướng | Tin | Nội dung | Nhóm / giới hạn |
|---|---|---|---|
| client → server | `rank {op: "boards" \| "top", board?, page?, pageSize?}` | `boards`: danh mục hạng mục + hạng mục mở; `top`: một trang | `read`, nhịp RANK_CD *(đề xuất, mặc định bằng `RESONANCE_RANK_CD`)* |
| server → client | `rank {k: "boards", list}` | `list`: `{board, group, name, period?}` | riêng |
| server → client | `rankTop {board, period, page, total, hasNext, rows, me, asOf}` | `rows`: `{rank, name, score, tong?, lineup?}`; `me`: `{rank, score}` hoặc `null`; `asOf`: giờ server (ms) của cache | riêng |

Kẹp `board` theo RANK_BOARDS (mã lạ: từ chối bằng tin `log`), `page` / `pageSize` bằng `intIn`; xin dồn thì gộp theo nhịp. `ArenaRoom` chặn tin `rank` (như `resonance`).

### Chống gian lận
Soát theo skill `anti-cheat-audit` trước khi gộp mỗi PR có server.
- **Không tin client:** không có tin nào đặt điểm; mọi điểm suy từ dữ liệu đã lưu hoặc sự kiện thưởng đã xác nhận.
- **Cấp, Sưu tầm, Cộng minh, Elo, Tông:** chỉ đọc dữ liệu đã có, nên khó gian lận hơn các nguồn đó (đã có trần Elo mỗi ngày `ARENA.eloDaily`, trần cặp `ARENA.pairDaily`, trần điểm tông; mục 5.9, 5.14).
- **Sức mạnh:** chỉ chụp ở mốc ổn định đã ghi DB, bỏ buff tạm → không thể thổi điểm bằng cách mặc đồ mượn rồi thả (không có giao dịch giữa người chơi, mục 5.7; đồ tự có). Đổi đội hình rồi đổi lại để "nhảy hạng" chỉ làm điểm đúng với trạng thái đang lưu; nhịp RANK_POWER_CD chống ghi dồn.
- **Thợ săn tuần:** chỉ cộng khi thưởng được chốt (đã có khóa thưởng theo bản đồ, chống nhân thưởng qua kênh / phòng; mục presence), trần mỗi ngày, bỏ qua hồn thú không hợp cấp (chống kéo quái yếu). Tự săn / ủy thác offline **có** tính (là cách chơi hợp lệ) nhưng chịu cùng trần ngày; nếu soát thấy nghiêng bảng thì tách điểm tự săn bằng hệ số RANK_HUNT_AUTO *(đề xuất)*.
- **Boss thế giới:** dùng bảng sát thương server giữ khi giao chiến; chốt một lần; người vào phòng khi boss đã hạ không có hạng.
- **Nhiều tài khoản:** không có chuyển giá trị giữa tài khoản, nên nuôi nhiều tài khoản không dồn điểm lên một tài khoản; phần thưởng hạng không hấp dẫn đủ để đáng đổi (mục "Kinh tế").
- **Tải:** mọi tin đọc đi qua nhóm `read`, nhịp tối thiểu, bảng chung cache; đo bằng bài bot như #738 (số truy vấn / giây khi N người mở bảng).
- **Riêng tư:** dòng công khai theo mục "Luật chung"; `me` chỉ gửi cho chính chủ.

### Kinh tế
- **Không có phần thưởng vật phẩm cho thứ hạng ở v1** (câu hỏi mở 1). Hạng mục tuần có thể thưởng **danh hiệu hiển thị** (dòng chữ cạnh tên, hết khi qua tuần kế) thay vì Hồn Tệ / mảnh: không động tới cân bằng, không tạo nguồn vào mới.
- Nếu chủ repo muốn thưởng, đi qua cùng khuôn thưởng tuần tông (`boss_claims` + túi một transaction, nhận đúng một lần) và tổng thưởng bảng ≤ `TONG_WEEK_REWARD.rest` cho mọi hạng mục cộng lại, để không vượt nguồn hiện có.
- Không có xếp hạng theo Hồn Tệ / giàu có (tránh bị nhắm và cổ vũ gian lận).

### Giao diện
Chất liệu: màn đầy khung nên **Mực** có tấm Giấy cho bảng điểm; token theo `docs/art/ui-kit.md` (không thêm màu ngoài bảng); chữ ba cỡ 10 / 12 / 24; vùng bấm 32 px cho tab / chip, 44 px cho nút chính (không có nút chính nguy hiểm). Ghép khung C2 / kit v2; phím tắt chọn khi làm, tránh trùng, nhắc trên màn (luật 9 của bộ spec UI).

```
┌ Xếp Hạng ──────────────────────────────────────────── [X] ┐
│ Nhóm ▾            │   ② Hạng 2   ① Hạng 1   ③ Hạng 3     │
│  Người chơi ▾     │   (bục: tên, điểm, tông, chân dung)  │
│   Cấp             ├──────────────────────────────────────┤
│   Sức mạnh        │ Hạng │ Tên      │ Điểm  │ Đội hình   │
│   Sưu tầm         │  4   │ …        │ 2,6M  │ [4 thẻ nhỏ]│
│   Cộng minh       │  …   │          │       │            │
│  Đấu trường ▸     ├──────────────────────────────────────┤
│  Tông môn ▸       │ Hạng của tôi (ghim đáy) │ 4 │ 2,6M   │
└───────────────────┴──────────────────────────────────────┘
        [◀ trước]  trang 1/20  [sau ▶]       cập nhật 12:03
```

- **Bục top 3:** hạng 1 giữa và cao nhất (vương miện), hạng 2 trái, hạng 3 phải; phân biệt bằng **dạng + dấu số**, không chỉ màu (luật 4 độ hiếm). Hạng mục tông: bục là ba **tông** (tên + màu `TONG_MON`) còn bảng là top cá nhân.
- **Bảng:** cột Hạng (huy hiệu số), Tên, Điểm, Đội hình (tái dùng thẻ võ hồn thu nhỏ `cards.ts`, cấp + sao). Số rút gọn K / M ở bảng, **số đầy đủ trong tooltip**. Tên dài xuống dòng hoặc co chữ, không cắt im lặng.
- **Dòng của tôi** ghim đáy, nền sáng hơn, luôn thấy khi cuộn; ngoài bảng (hạng sâu) vẫn hiện hạng thật + điểm.
- **Trạng thái bắt buộc** (ngoài trạng thái điều khiển của ui-kit): *đang tải* (khung xương, không trống chớp); *rỗng* ("Chưa có ai trên bảng này"); *chưa có hạng* (cho chính mình, kèm cách lên hạng); *lỗi / mất kết nối* (nút Thử lại, không xóa dữ liệu đang hiện); *đang cập nhật / có thể trễ* (chip "cập nhật lúc …" từ `asOf`); *hạng mục chưa mở* (mục v2: chữ lý do); *ẩn* (tài khoản test: "Tài khoản kiểm thử không xếp hạng"). Esc đóng theo ngăn xếp (`panelStack.ts`); điện thoại ngoài phạm vi (Q40, chỉ PC).
- Nhấn một dòng: mở thẻ nhỏ công khai (tên, tông, đội hình), nút "Kết bạn" dùng luật bạn bè hiện có; không xem túi / chỉ số chi tiết.

### Lộ trình triển khai (mỗi bước một PR nhỏ, theo `roadmap-step`)
Đánh dấu `ROADMAP.md` khi xong từng bước.
| Bước | Việc | Kiểm thử |
|---|---|---|
| X0 | Tài liệu này (+ dòng mục lục `GAME_DESIGN.md`) | `npm run check`, `tools/docs-check.mjs` |
| X1 | `shared/data.ts`: RANK_BOARDS, RANK_POWER, `powerScore`, hằng trang / nhịp; test thuần cho `powerScore` và tie-break | `npm run check` |
| X2 | Server: tin `rank {op:"boards"\|"top"}` cho Cấp + Sưu tầm (đọc thẳng; `Store.rankTop` / `rankMe` cả hai kho; hạng ẩn tài khoản test) | bot nhóm mới `rank` (người thường thấy mình, test ẩn, trang cuối, xin dồn, tin lạ), `--pg` |
| X3 | SQL `rank_scores` + `powerScore` ghi ở mốc ổn định + hạng mục Sức mạnh | bot: đổi đội hình / thoát phòng cập nhật đúng; test `powerScore` khớp bảng Nhân vật; `--pg` kiểm migration chạy lại 2 lần |
| X4 | Client: màn Xếp Hạng (khung, bục, bảng, dòng của tôi, trạng thái) + bộ nối cho Elo / cộng minh / tông tuần | `client-ui` + ảnh chụp Chrome headless các trạng thái; `ui:inventory` không tăng màu lẻ |
| X5 | Soát chống gian lận (skill `anti-cheat-audit`) + đo tải bảng như #738 | tài liệu soát tệp soát soat-gian-lan-xep-hang (trong docs/tech, tạo khi làm X5) |
| X6 (v2) | Thợ săn tuần; Boss thế giới | bot săn / boss với `bossOffset` đẩy tuần |

Mỗi bước server sửa **cả** `PgStore` và `MemoryStore`, thêm hàng vào bảng tin ở `giao-thuc-server.md`, và (khi sửa MapRoom) tránh phình file: đặt logic ở `server/src/rooms/rank.ts` *(đề xuất)* như `tong.ts` / `team.ts` (#702).

### Câu hỏi mở
Gom ở mô tả PR; tóm tắt cho tài liệu này: (1) có thưởng gì cho thứ hạng không; (2) cột "Đội hình" có công khai không.

## Lịch sử / issue liên quan
- Khung màn và hạng mục: bộ spec UI (#877, mục 3 dòng 10).
- Bảng đã có: Elo (#738 cache), cộng minh (mục 5.10), tông tuần (#197).
- Nhật ký từng bước: `docs/lich-su.md`.
