# Thành Tựu

Màn **Thành Tựu** ghi lại những mốc người chơi đã đạt (cấp, sưu tầm võ hồn, săn boss, nhiệm vụ, đấu trường, Bí Cảnh) và cho **thưởng nhỏ nhận một lần**. Thẻ "Thành Tựu" ở hub hiện đang khóa ("Sắp có", `client/src/hubMenu.ts`). Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`; tên *(đề xuất)* chưa tồn tại). Số issue ở cuối file. **Chưa có code**: tài liệu này là bước P0 của #1317 (Part of #877).

Tham chiếu: chỉ học bố cục (danh mục theo nhóm, thanh tiến độ, nút nhận) từ bộ tham chiếu UI của #877; không chép tên / chữ / ảnh.

## 5.23 Thành Tựu

### Mục tiêu
- Cho người chơi **mục tiêu dài hạn nhìn thấy được** trên chính các hệ thống đang chạy; không thêm vòng chơi mới và không đổi luật hệ nào.
- **Chỉ ghi nhận cái đã xảy ra:** mọi mốc suy ra từ trạng thái hoặc sự kiện do server quyết định; client không báo "tôi đã làm X".
- **Không phá cân bằng:** thưởng nhỏ, chỉ gồm vật phẩm / Hồn Tệ đã có trong game, mỗi thành tựu nhận **đúng một lần** cho mỗi tài khoản. Tổng toàn bộ danh mục bị trần theo các nguồn hiện hành (mục "Kinh tế").
- **Không nạp tiền, không bán / chuyển thành tựu** (mục 5.7). Không bảng xếp hạng riêng cho thành tựu ở v1 (xem "Riêng tư").

### Cách ghi nhận: "đạt" và "nhận" tách nhau
Mỗi thành tựu có **điều kiện** dạng `chỉ số ≥ ngưỡng`. Hai trạng thái, tính ở server:
1. **Đạt:** chỉ số của người chơi ≥ ngưỡng. Không cần lưu; tính lại từ nguồn khi cần (xem bảng nguồn).
2. **Đã nhận:** người chơi bấm "Nhận" (`achv {op:"claim", id}`); server kiểm lại điều kiện, ghi **đã nhận** và thưởng cùng một transaction. Thành tựu đạt mà chưa nhận hiện chấm đỏ ở hub.

Không tự phát thưởng khi đạt: người chơi túi đầy vẫn không mất gì, chỉ chưa nhận được (như đổi mảnh ở Thương hội).

### Danh mục (nhóm → chỉ số → nguồn)
Mỗi nhóm là **một chuỗi bậc** (ngưỡng tăng dần, mỗi bậc một thành tựu). Số ngưỡng và thưởng nằm trong `ACHV` *(đề xuất)* ở `shared/data.ts`; bảng dưới chỉ ghi **chỉ số lấy ở đâu** và gợi ý số bậc.

| Nhóm | Chỉ số | Nguồn (đã có hay phải thêm) | Gợi ý bậc |
|---|---|---|---|
| **Cấp** | cấp cao nhất trong các võ hồn của tài khoản | có sẵn: bảng `vohons`; mốc trùng danh hiệu `TITLES` (mỗi 10 cấp, trần `MAX_LEVEL`) | 10 bậc theo `TITLES` |
| **Sưu tầm** | số võ hồn đã sở hữu | có sẵn: bảng `owned_vohons` (cùng nguồn bảng xếp hạng "Sưu tầm", `RANK_BOARDS`) | vài mốc, mốc cuối = đủ `VOHON` |
| **Sao** | số sao cao nhất / tổng sao | có sẵn: `vohons` (sao, trần `MAX_STARS`) | 2–3 bậc |
| **Săn tinh anh / thú vương** | số lần hạ tinh anh, thú vương | **phải thêm bộ đếm** (xem "Lưu trữ"); sự kiện hạ ở `rooms/kill.ts` | vài bậc mỗi loại |
| **Săn boss thế giới** | số lần tham gia hạ boss thế giới (đủ điều kiện nhận thưởng, `BOSS_CLAIM_WORLD`) | **phải thêm bộ đếm**; ghi cùng chỗ nhận thưởng boss | 3 bậc |
| **Nhiệm vụ** | số chuỗi nhiệm vụ cố định đã xong (`QUESTS`); số ngày làm khảo hạch hằng ngày (`DAILY`) | chuỗi: có sẵn (bảng `quests`, `step` = số bước); khảo hạch ngày: bộ đếm mới | mỗi chuỗi xong một bậc; mốc ngày |
| **Đấu trường** | số trận thắng; Elo cao nhất đã đạt | thắng: có sẵn (`arena_ratings.wins`); Elo cao nhất: bộ đếm mới (cột `elo` chỉ giữ Elo hiện tại) | vài bậc thắng, vài mốc Elo trong `ARENA` |
| **Bí Cảnh** | số lượt Luyện Hồn Cảnh đã thắng đủ các sóng | **phải thêm bộ đếm**; ghi lúc kết thúc lượt thắng ở `BiCanhRoom` | 3 bậc |

- **Điều kiện chỉ dùng chỉ số mà server đã hoặc sẽ đếm.** Thêm nhóm mới = thêm một chỉ số có nguồn rõ + một chuỗi bậc trong `ACHV`, không đổi giao thức.
- **Không** có thành tựu cho thứ chỉ đo thời gian online, lượt bấm, hay hành vi có thể làm giả bằng nhiều tài khoản chỉ để nhận thưởng (xem "Chống gian lận").
- Tên thành tựu dùng đúng tên gốc Đấu La; thành tựu "Cấp" mượn tên `TITLES`.

### Dữ liệu và nơi tính
- `ACHV` *(đề xuất)* ở `shared/data.ts`: danh sách `{id, group, name, stat, need, reward}`; `stat` là mã chỉ số trong danh sách đóng ACHV_STATS *(đề xuất)* *(đề xuất)*; `reward` chỉ gồm `honTe` và/hoặc `items[]` với mã **có trong `ITEMS`**. Hàm thuần `achvReached(def, stats)` để client hiển thị; server tính thật.
- Server giữ **mọi** phép tính trong một file riêng (đề xuất `server/src/rooms/achv.ts`, như `welfare.ts`, `rank.ts`). Client chỉ gửi `op` và `id`; `id` phải thuộc danh mục (so với bảng đóng, không phải chuỗi tự do).
- Gom chỉ số: một hàm `achvStats(d)` đọc **RAM của người chơi** (cấp, sưu tầm, sao, nhiệm vụ đã tải lúc vào phòng) cộng bộ đếm sự kiện; khi nhận, chỉ số **không có trong RAM** hoặc quan trọng cho chống gian lận (bộ đếm) được đọc lại từ DB trong chính transaction nhận.
- Đồng hồ: không dùng; thành tựu không phụ thuộc giờ nên không có chuyện đổi giờ máy.

### Lưu trữ
**SQL đề xuất** `server/sql/00N_thanh_tuu.sql` (N kế tiếp trên `origin/main` lúc làm; hiện bản mới nhất là 038), chạy lại an toàn, bật RLS không tạo policy:

```
achv_state (
  account_id  bigint PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  claimed     text[]  NOT NULL DEFAULT '{}',        -- mã thành tựu đã nhận (ACHV[].id)
  counters    jsonb   NOT NULL DEFAULT '{}'::jsonb, -- bộ đếm sự kiện: {"elite":n,"king":n,"world":n,"bicanh":n,"daily":n,"eloMax":n}
  ver         integer NOT NULL DEFAULT 0,           -- tăng mỗi lần ghi, để ghi có điều kiện
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

- Một dòng mỗi tài khoản, đọc một lần lúc vào phòng; tài khoản chưa có dòng = chưa nhận gì, bộ đếm 0 (server không chèn trước).
- **Bộ đếm chỉ tăng**, ghi bằng `UPDATE … SET counters = jsonb_set(…)` có điều kiện (`GREATEST` cho `eloMax`), qua `this.chain(d, fn)`; không bao giờ giảm. Sự kiện lỡ ghi (sập phòng) thì mất một lần đếm, không có đường "cộng bù" (chấp nhận được: thưởng nhỏ).
- **Nhận nguyên tử:** `UPDATE achv_state SET claimed = claimed || $id, ver = ver + 1 WHERE account_id = $a AND ver = $ver AND NOT (claimed @> ARRAY[$id])` kèm túi và Hồn Tệ **trong cùng một transaction** (như `checkinClaim`, `claimBoss`). Hai tab / hai tiến trình / bấm dồn: chỉ một lần thắng, lần còn lại nhận "đã nhận". Túi không đủ chỗ cho **cả** phần thưởng thì từ chối, **không** đánh dấu đã nhận.
- Cách ghi: giữ chỗ trong RAM (`claimBusy`, như `welfare`), xếp vào chuỗi lưu `this.chain(d, fn)`; DB báo lỗi thì hoàn lại (không cộng quà, không đổi `claimed`).
- `Store.achvGet(accountId)`, `Store.achvBump(accountId, key, n)` và `Store.achvClaim(accountId, id, bag)` thêm vào **cả** `PgStore` lẫn `MemoryStore`; `Store.removeTestAccount` thêm bảng này. Không `DROP` hay đổi kiểu cột cũ; thêm / đổi ngưỡng trong `ACHV` không đụng dữ liệu đã lưu (chỉ lưu mã đã nhận).

### Giao thức
Bổ sung vào bảng ở `docs/tech/giao-thuc-server.md` khi làm (kiểm `tools/docs-check.mjs`).

| Hướng | Tin | Nội dung | Nhóm / giới hạn |
|---|---|---|---|
| client → server | `achv {op: "get" \| "claim", id?}` | `get`: xin danh sách; `claim`: nhận thưởng thành tựu `id` | `get`: `read`; `claim`: `trade` (ghi DB) |
| server → client | `achv {stats, claimed, ready, ver, claimedNow?, err?}` | `stats`: chỉ số hiện tại theo ACHV_STATS *(đề xuất)*; `claimed`: mã đã nhận; `ready`: số thành tựu đạt chưa nhận (cho chấm đỏ); `claimedNow`: kết quả lần vừa nhận (`{id, items}`); `err`: lý do tiếng Việt | riêng |

- Server gửi `achv` lúc vào phòng (cho chấm đỏ) và sau mỗi sự kiện làm một thành tựu **vừa đạt** (không gửi mỗi lần bộ đếm tăng; chỉ khi `ready` đổi). Không tự nhận hộ.
- Từ chối bằng `err` tiếng Việt: chưa đạt, đã nhận, mã lạ, túi đầy, đang trong sân đấu / Bí Cảnh, đang đi cổng, đang giao chiến *(đề xuất: chặn như `welfare`, nhận được ở mọi trạng thái an toàn)*, `claimBusy`.
- `ArenaRoom` / `BiCanhRoom` chặn `achv`; thêm vào bài `cheat` (dồn `claim` 200 lần, `id` lạ, `claim` thành tựu chưa đạt).

### Chống gian lận
Soát theo skill `anti-cheat-audit` khi làm bước server; kết quả ghi vào một file soát riêng trong docs/tech (tạo khi làm).
- **Chỉ server đếm:** mọi bộ đếm tăng ở nơi server quyết định sự kiện (hạ thú, thắng trận, xong lượt); không tin tin nhắn client nào để cộng.
- **Không nhận trùng:** điều kiện `NOT (claimed @> …)` + `ver` trong câu `UPDATE` (nguyên tử), không có đường nhận ngoài transaction.
- **Điều kiện kiểm lại lúc nhận**, không tin cờ "đã đạt" từ lần xem trước; chỉ số suy từ DB (hoặc RAM đã đồng bộ DB) tại thời điểm nhận.
- **Chống nuôi tài khoản:** đếm trận đấu trường **chỉ trận xếp hạng** (`arenaRanked`) đã qua các luật chống đấu lặp cặp có sẵn (`arena_pairs`); thành tựu săn thú không đếm lần hạ ở chế độ không tính điểm. Thưởng nhỏ, không chuyển được, nên nuôi nhiều tài khoản chỉ nhận đúng phần mỗi tài khoản chơi thật.
- **Tài khoản test** (`is_test`): được nhận bình thường (dữ liệu dựng sẵn); bài bot dọn dòng `achv_state` khi xong.
- **Tải:** `get` nhóm `read`, `claim` nhóm `trade`; mỗi người một dòng, không quét toàn bảng.

### Kinh tế
Nguyên tắc: **thưởng nhỏ, lấy từ vật phẩm đã có, tổng cả danh mục là hữu hạn và bị trần theo nguồn tương đương.** Test cân bằng (thêm vào bài `balance` / `test:*`) kiểm các **quan hệ**, không chép số:

| Thứ | Quan hệ trần (cộng cả danh mục) |
|---|---|
| Hồn Tệ | tổng `ACHV` ≤ một phần cố định của nguồn Hồn Tệ một chu kỳ `CHECKIN.cycleCap.honTe`, nhân số nhóm (thành tựu là một lần cả đời, không lặp) |
| Mảnh võ hồn | chỉ SR / SSR trong `ARENA_SHARDS`; **không** UR, **không** Lam Ngân Thảo; tổng ≤ vài lần `SHARD_BUY.daily` |
| Ủy Thác Lệnh (`AUTO_TOKEN`) | chỉ ở bậc cao; tổng giờ ≤ `AUTO_DAILY_SECS` |
| Đan, phù | chỉ loại nhỏ trong `SHOP` |
| Hồn hoàn, hồn cốt, hồn hạch, trang bị, tiên thảo, rương | **không có** trong thưởng thành tựu (đã có nguồn rơi riêng; tránh phá mục tiêu săn) |

- Thưởng tăng dần theo bậc, bậc cuối mỗi nhóm lớn nhất nhưng vẫn trong các trần trên.
- Giá trị thật của từng thành tựu cân qua skill `balance-data` / `balance-review`; bài soát ghi bảng quan hệ ở trên với số thật lúc đó.

### Giao diện
Chất liệu **Giấy** (kit gốc, `docs/art/ui-kit.md`): cửa sổ riêng mở từ thẻ `achv` ở hub (`client/src/hubMenu.ts`, hiện `why: "Sắp có"` → nối bảng, bỏ khóa); Esc đóng theo ngăn xếp (`panelStack.ts`); PC.
- **Bố cục:** cột nhóm bên trái (Cấp, Sưu tầm, Săn, Nhiệm vụ, Đấu trường, Bí Cảnh), danh sách thành tựu bên phải; mỗi dòng: tên, mô tả điều kiện, thanh tiến độ `chỉ số / ngưỡng`, thưởng, nút "Nhận" (vùng bấm 32–44 px).
- **Trạng thái dòng** (hình + chữ, không chỉ màu): *chưa đạt* (thanh tiến độ), *đạt, chưa nhận* (nổi bật + nút Nhận + chấm đỏ nhóm), *đã nhận* (xám + dấu tick).
- **Trạng thái bắt buộc:** đang tải, đang gửi (nút tắt, không cho bấm đôi), thành công (toast + dòng đổi trạng thái), lỗi (lý do tiếng Việt; "Túi không đủ chỗ" ghi rõ), mất kết nối, chưa có thành tựu nào (nhóm trống).
- **Chấm đỏ ở hub:** `ready > 0` (suy từ tin `achv`).

### Lộ trình triển khai (mỗi bước một PR nhỏ)
| Bước | Việc | Kiểm thử |
|---|---|---|
| P0 | Tài liệu này (+ dòng mục lục `GAME_DESIGN.md`) | `npm run check`, `tools/docs-check.mjs` |
| P1 | `shared/data.ts`: `ACHV`, ACHV_STATS *(đề xuất)*, `achvReached`; test thuần + **test quan hệ trần thưởng** | `npm run check` |
| P2 | SQL `achv_state` + `Store.achvGet` / `achvBump` / `achvClaim` (cả `PgStore` lẫn `MemoryStore`) | bot `--pg`: migration chạy lại hai lần; nhận có điều kiện không nhân quà khi hai tiến trình tranh |
| P3 | Server: tin `achv` (`get`, `claim`), `achv.ts`, bộ đếm sự kiện ở nơi hạ thú / đấu trường / Bí Cảnh / khảo hạch, hoàn khi lỗi | bot nhóm mới `achv`: nhận khi đạt, nhận đúp, chưa đạt, id lạ, túi đầy, dồn 200 `claim`; hook `savefail` kiểm hoàn lại |
| P4 | Soát chống gian lận (`anti-cheat-audit`) + `balance-review` bảng trần thưởng | tài liệu soát + bảng quan hệ với số thật |
| P5 | Client: màn Thành Tựu kit Giấy + chấm đỏ hub | `client-ui` + ảnh chụp Chrome headless (`--mute-audio`) đủ trạng thái |

### Câu hỏi mở (cho chủ repo)
1. **Nhận tay hay tự phát:** đề xuất nhận tay (nút "Nhận", an toàn khi túi đầy). Tự phát thưởng kèm thư (hub "Thư" chưa có) để sau.
2. **Thành tựu đã đạt từ trước khi có tính năng** (người chơi cấp cao, sưu tầm nhiều): đề xuất **tính ngay** cho nhóm suy từ trạng thái (cấp, sưu tầm, sao, nhiệm vụ, thắng đấu trường) và **bắt đầu từ 0** cho nhóm bộ đếm mới (săn, Bí Cảnh, khảo hạch ngày).
3. **Thành tựu ẩn / huy hiệu hiển thị cạnh tên:** để v2; v1 chỉ có danh sách và thưởng nhỏ.

## Lịch sử / issue liên quan
- Theo dõi: #1317 (Part of #877); bộ spec UI #877.
- Khuôn thưởng nhận đúng một lần có túi và DB một transaction: Sổ Điểm Danh (`docs/design/phuc-loi.md`, `checkinClaim`), đổi mảnh ở Thương hội (mục 5.7).
- Nguồn chỉ số: Bảng Xếp Hạng (`docs/design/xep-hang.md`, mục 5.19), Bí Cảnh (mục 5.22), Đại Đấu Hồn Trường (mục 5.9).
- Nhật ký từng bước: `docs/lich-su.md`.
