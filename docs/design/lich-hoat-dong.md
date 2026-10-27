# Lịch Hoạt Động

Hộp thoại **Lịch Hoạt Động**: bảng tuần cho biết hôm nay và cả tuần có gì, mở lúc nào, ở đâu. Lịch là **bản đọc** của các luật thời gian đã có (tà hóa thú vương, boss thế giới, mốc làm mới hằng ngày / tuần); nó không tạo sự kiện mới và không có phần thưởng riêng. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`; tên *(đề xuất)* chưa tồn tại). Số issue ở cuối file. **Đã có (server, L1 + L2): `EVENT_DEFS`, `eventSlots`, tin `calendar`; chưa có UI.**

Tham chiếu bố cục: ảnh 13 (lịch hoạt động) trong bộ tham chiếu UI của #877; chỉ học bố cục, không chép.

## 5.20 Lịch Hoạt Động

### Mục tiêu
- Người chơi đọc nhanh "hôm nay có gì, mấy giờ, ở bản đồ nào", và boss thế giới ngày nào là con nào.
- **Một nguồn thời gian:** giờ mở nằm ở đúng hằng mà server dùng để chạy sự kiện; lịch **suy ra** từ đó, không có bản chép thứ hai có thể lệch.
- Mọi giờ theo **giờ Việt Nam** (`BOSS_TZ`), ngày đổi 00:00, tuần bắt đầu thứ Hai (mục 4 "Ngày và giờ"; `tongWeek`). Giờ client chỉ dùng để đếm lùi hiển thị, đã hiệu chỉnh bằng giờ server (mục "Giao thức").

### Loại sự kiện trong lịch
EVENT_DEFS *(đề xuất, mảng cố định, thêm cuối)* khai: mã, tên, loại, nơi (mã bản đồ / NPC, nếu có), thứ trong tuần (thiếu = mọi ngày), giờ bắt đầu, độ dài, ghi chú, và **nguồn** (hằng gốc). Ba loại:

| Loại | Ý nghĩa | Ví dụ (đều đã có luật) | Nguồn giờ |
|---|---|---|---|
| **Khung giờ** | có giờ bắt đầu và kết thúc | Tà hóa thú vương ở từng bản đồ có `MapDef.king`; boss thế giới (con của ngày theo `worldBossOn`) | `KING_TIMES` + `KING.lifeSecs`; `WORLD_TIME` + `WORLD.lifeSecs`; báo trước `KING.warnSecs`, `WORLD.warnSecs` |
| **Làm mới** | một mốc đặt lại, không có "độ dài" | 00:00 mỗi ngày: khảo hạch (`DAILY`), tông vụ (`TONG_DAILY`), lượt thưởng đấu trường (`ARENA.dailyWins`), mảnh Thương hội (`SHARD_BUY.daily`), giờ tự săn (`AUTO_DAILY_SECS`), điểm danh (`phuc-loi.md`). 00:00 thứ Hai: chốt tuần tông (`tongWeek`, bảng và thưởng tuần, mục 5.14) | `BOSS_TZ`, `tongWeek` |
| **Luôn mở** | không theo giờ, hiện ở dải trên bảng để biết có | Đại Đấu Hồn Trường (hàng chờ, mục 5.9), tự săn | không có giờ |

- Bảng tuần chỉ vẽ **Khung giờ** theo ô; **Làm mới** hiện thành một dải chip dưới tiêu đề cột ("Làm mới 00:00") hoặc ở dòng ghi chú; **Luôn mở** ở dải trên cùng. Như vậy ba loại không chen vào nhau.
- Mỗi mục có `link`: bản đồ (nút "Đến" dẫn tới truyền tống trận / bản đồ qua luật `wp` hiện có, **không dịch chuyển tự động**), hoặc tên NPC; nút chỉ mở đúng bảng đã có, không thêm đường đi mới.
- **Giai đoạn đầu chỉ có sự kiện đã tồn tại.** Sự kiện mới (ví dụ "thưởng săn x2 vào ngày …") đổi cân bằng nên là một quyết định riêng của chủ repo (câu hỏi mở 5), không nằm trong v1.
- Boss thế giới luân phiên theo ngày (`worldBossOn`) nên lịch tuần cho thấy **tên boss từng ngày**: đây là thông tin có giá trị nhất của lịch.

### Dữ liệu và nơi tính
- Hàm thuần trong `shared/data.ts` *(đề xuất)*: `weekdayVn(ms)` (0 = thứ Hai, `(vnDayNum + 3) % 7`), `eventSlots(def, weekStartMs)` → danh sách `{s, e}` (ms UTC) của tuần chứa `weekStartMs`. Cả server và client import; test thuần kiểm: với `KING_TIMES` / `WORLD_TIME` hiện hành, **mọi khung của `kingSlots` / `worldSlots` trong tuần đều có mặt trong `eventSlots` và ngược lại** (chống lệch nguồn).
- Server là chỗ **chốt dữ liệu gửi đi** (kể cả tên boss theo ngày, dùng `bossNow`, nên bot đẩy được đồng hồ bằng `bossOffset` / `BOSS_CLOCK`); client không tự tính ngày từ giờ máy.
- **Trạng thái "đã xong hôm nay"** (v2, tùy chọn): chỉ **đọc** lượt đã có trong `boss_claims` của hôm nay (thú vương, boss thế giới, thắng đấu trường, mảnh đổi) để vẽ dấu tick; không có bảng hay cột mới. Chỉ gửi cho chính chủ.
- Không có sự kiện nào kích hoạt từ lịch: `startSchedule` vẫn là nơi duy nhất sinh boss. Lịch không đổi hành vi server; nó chỉ liệt kê.

### Lưu trữ
- **v1: không có bảng SQL và không dùng Redis.** Toàn bộ là hằng + đồng hồ; lịch mọi tiến trình đều cho cùng một kết quả vì cùng hằng và cùng giờ (`bossNow`). Điều này giữ nguyên luật "lịch giữ ở một nơi" của `presence-redis.md` (khóa lãnh đạo lịch `schedule:leader` không đổi).
- **Sau này, nếu chủ repo cho sự kiện tạm thời do GM đặt** (câu hỏi mở 5): bảng `events` *(đề xuất `server/sql/00N_su_kien.sql`, N kế tiếp trên `origin/main`, chạy lại an toàn, RLS không policy)* với `id`, `code` (mã trong EVENT_DEFS), `starts_at`, `ends_at`, `by` (tài khoản admin), `created_at`; chỉ ghi qua lệnh `/gm` đã có (`GM_BURST`), mỗi lệnh ghi một dòng `[GM]`. Sửa cả `PgStore` lẫn `MemoryStore`, đọc nạp lúc khởi động + làm mới mỗi phút (giờ mở không đổi giữa chừng một sự kiện đã bắt đầu). **Không** phát giờ mở qua Redis; nhiều tiến trình đọc cùng bảng.

### Giao thức
Bổ sung vào bảng ở `docs/tech/giao-thuc-server.md` khi làm (kiểm `tools/docs-check.mjs`).

| Hướng | Tin | Nội dung | Nhóm / giới hạn |
|---|---|---|---|
| client → server | `calendar {op: "get", week?: -1 \| 0 \| 1}` | xin lịch tuần này / trước / sau (kẹp `intIn`, mặc định 0) | `read`, nhịp `ASK_CD` (xin dồn thì gộp) |
| server → client | `calendar {now, weekStart, items, fixed, done?}` | `now`: giờ server (ms); `weekStart`: thứ Hai 00:00 (ms); `items`: `{id, name, kind, s, e, map?, npc?, note?}` Khung giờ; `fixed`: Làm mới + Luôn mở; `done?`: mã đã xong hôm nay (v2) | riêng |

- Client tính `skew = now − Date.now()` lúc nhận và dùng cho đếm lùi và nhãn "đang mở / sắp mở"; không dùng để quyết định gì ngoài hiển thị. Hiển thị giờ bằng `vnClock` (đã ở `shared/data.ts`) nên máy đặt múi giờ khác vẫn thấy giờ Việt Nam.
- `ArenaRoom` chặn tin `calendar` (không đổi lịch trong trận).
- Báo trước và thông báo toàn server vẫn do tin `boss` / `announce` hiện có; lịch **không** phát thông báo mới (tránh nhắc hai lần).

### Chống gian lận
- Đọc thuần, không ghi gì nên không có đường gian lận trực tiếp; điều cần giữ là **không để lịch trở thành nguồn sự thật**: client không bao giờ báo "sự kiện đã mở" để xin thưởng. Mọi thưởng vẫn do `MapRoom` kiểm theo `kingActive` / `worldActive` và `bossNow`.
- Đổi giờ máy client chỉ làm sai nhãn trong bảng của chính họ (đã bù bằng `skew`); không đổi được gì ở server.
- Tin `calendar` chịu nhóm `read` và `ASK_CD`; payload nhỏ (vài chục mục), cache theo tuần trong tiến trình (bảng không đổi trong tuần).
- Hook test đồng hồ (`GAME_TEST`, `BOSS_CLOCK`) chỉ bật khi thử; prod không có.

### Kinh tế
Không có. Lịch không cấp, không đổi, không nhân phần thưởng nào. (Nếu sau này có sự kiện thưởng, nó thuộc quyết định cân bằng riêng, theo skill `balance-review`.)

### Giao diện
Chất liệu **Giấy** (hộp thoại giữa màn, nội dung đọc; `docs/art/ui-kit.md`); không đầy khung; token có sẵn (`--paper*`, `--ink`, `--xp-t` cho cột hôm nay, `--son` chỉ cho nút chính nếu có); chữ 10 / 12 / 24; vùng bấm 32 px cho ô, 44 px cho nút "Đến". Điểm vào: nút menu (khi hub có) và icon dưới radar.

```
┌ Lịch Hoạt Động · 2026 ──────────────────────────── [X] ┐
│ Luôn mở: [Đại Đấu Hồn Trường] [Tự săn]                  │
│ ◀ Tuần 44 ▶    T2    T3    T4(hôm nay)  T5    T6  T7  CN │
│  10.26  10.27  10.28*       10.29 …                     │
│  Làm mới 00:00 · chốt tuần tông 00:00 thứ Hai          │
│ ┌────────┬────────┬════════┬────────┐                   │
│ │Thú vương│Thú vương│Thú vương│       │ 20:00 – 20:15   │
│ │20:00   │…       │▶ đang mở│       │                   │
│ │Boss: X │Boss: Y │Boss: Z │ …      │ 21:00 – 21:15   │
│ └────────┴────────┴════════┴────────┘                   │
│ Chi tiết ô chọn: tên, bản đồ, giờ, còn bao lâu [Đến]     │
└──────────────────────────────────────────────────────────┘
```

- **Bảng tuần:** 7 cột thứ + ngày; **cột hôm nay tô nổi** (nền + viền + dấu "hôm nay", không chỉ màu); thẻ giờ = tên + `HH:MM – HH:MM`; hàng xếp theo giờ bắt đầu chứ không theo loại.
- **Trạng thái thẻ** (hình + dấu, không chỉ màu): *đang mở* (nổi, nhãn "Đang mở", đếm lùi tới lúc kết thúc), *sắp mở* (trong vòng CAL_SOON_MIN *(đề xuất)* phút: nhãn "Sắp mở" + đếm lùi), *đã qua* (mờ, ở cột hôm nay), *ngày khác* (thường), *xong hôm nay* (tick, v2), *khóa* (bản đồ chưa tới cấp đề xuất: nhãn lý do, nút "Đến" tắt, chữ lý do vẫn hiện).
- **Trạng thái bắt buộc của màn:** *đang tải* (khung xương), *lỗi / mất kết nối* (nút Thử lại, giữ dữ liệu cũ), *tuần trống* (hiếm; "Tuần này chưa có khung giờ"), *giờ server chưa nhận* (chưa hiện đếm lùi, chỉ hiện giờ). Tên dài xuống dòng; thẻ cắt ở mép cuộn phải có dấu mờ báo "còn nữa". Esc đóng theo ngăn xếp (`panelStack.ts`); cuộn ngang bằng nút ◀ ▶ và chuột, không bắt buộc cuộn.
- Chấm đỏ ở icon lịch khi **có khung giờ vừa mở** mà chưa xem; tắt khi mở bảng.

### Lộ trình triển khai (mỗi bước một PR nhỏ)
| Bước | Việc | Kiểm thử |
|---|---|---|
| L0 | Tài liệu này (+ dòng mục lục `GAME_DESIGN.md`) | `npm run check`, `tools/docs-check.mjs` |
| L1 | `shared/data.ts`: EVENT_DEFS, `weekdayVn`, `eventSlots`; test thuần đối chiếu `kingSlots` / `worldSlots` / `worldBossOn` | `npm run check`; test mới trong `shared` |
| L2 | Server: tin `calendar {op:"get"}` + `calendar` (cache theo tuần, `ArenaRoom` chặn) | bot nhóm mới `calendar`: tuần trước / này / sau, `week` lạ bị kẹp, đẩy `bossOffset` sang ngày khác thì tên boss đổi đúng, xin dồn bị gộp |
| L3 | Client: hộp thoại Giấy, đếm lùi bù `skew`, trạng thái thẻ | `client-ui` + ảnh chụp Chrome headless (`--mute-audio`) đủ trạng thái; `ui:inventory` không tăng màu lẻ |
| L4 (tùy chọn) | "Xong hôm nay" đọc `boss_claims`; icon + chấm đỏ | bot: thắng một trận / hạ thú vương rồi kiểm tick |
| L5 (chờ quyết định) | Bảng `events` + lệnh GM đặt sự kiện tạm | bot `--pg`, migration chạy lại hai lần |

Server thêm vào `server/src/rooms/` một file nhỏ (đề xuất `calendar.ts`) như `tong.ts`, không phình `MapRoom.ts` (#702).

### Câu hỏi mở
Gom ở mô tả PR; riêng lịch: (5) có cho GM đặt sự kiện tạm thời (và nếu có, có sự kiện nhân thưởng không).

## Lịch sử / issue liên quan
- Khung màn: bộ spec UI (#877, mục 3 dòng 12).
- Lịch boss gốc: mục 5.4 và `docs/tech/presence-redis.md`.
- Nhật ký từng bước: `docs/lich-su.md`.
