# Đo hiệu năng chạy dài trên bản đồ ×8

Đây là **báo cáo các lượt đo** (mốc thời điểm, không phải luật chơi). Cách đo chuẩn ở skill `soak-perf`; bot tải, log thô và script đo để ngoài repo (thư mục artifact của phiên).

## Kết luận hiện hành
- 40–60 người tự săn một kênh ×8: tick + bản vá trung bình 7–11 ms trên nhịp 50 ms; nhịp > 50 ms hiếm (≤ 1 / phút), không có nguyên nhân rõ trong code game.
- Băng thông 5–8 KB/s mỗi client (9–12 KB/s cạnh thú vương). Phòng trống tự hủy, heap về gần mức đầu; heap tăng chỉ do túi đồ bot đầy dần (có trần), không thấy rò.
- Redis tắt giữa chừng (hai tiến trình): bài `arena` và `friend` đạt, server sống đến cuối (phần 9 bên dưới).
- Kịch bản 1–2 giờ chưa đo.

Bảng dưới là số liệu từng lượt; mốc đầu đo trên code `257570e`, so với mốc 11.4 và soak 30 phút.

## Cách đo
- Máy: Windows 11, i5-12400F 12 luồng, 32 GB, Node 24.12. **Nhiễu:** cùng lúc có 3 phiên agent khác, Chrome và các tiến trình khác (RAM trống 3,5–8 GB), nên `max` từng nhịp nhiễu nhiều.
- Server: một tiến trình `node` bản dist (esbuild như `tools/bot-local.mjs`), `--max-old-space-size=768 --expose-gc`, `GAME_TEST=1 PERF_LOG=1`, lưu RAM (`MemoryStore`), bản đồ ×8 (`*.v2.json`).
  Một module nạp trước gọi `gc()` mỗi 30 giây rồi ghi heap, RSS, CPU của tiến trình và số phòng (`matchMaker.query`).
- Bot tải (colyseus.js, luồng giống `client/scripts/auto-soak.mjs`): tài khoản mới, đưa tới bản đồ bằng hook `warp`, võ hồn cấp 30 với 3 hồn hoàn (bot đánh thú vương: cấp 60 với 6 hồn hoàn).
  Không bật `test {op: "view", all: true}`, nên băng thông đo đúng lọc view. Mỗi bot đếm byte mọi tin WebSocket nhận được.
- Cột "tick + vá" là `tick + patch` trong dòng `[perf]` (trung bình 10 giây). Cột `max` là nhịp chậm nhất trong 10 giây đó. p50 / p95 lấy theo các dòng `[perf]`.

## 1. Kịch bản Ngắn: một kênh Tinh Đấu Ngoại vi ×8, mọi bot tự săn, rải đều
Mỗi mức chạy 5 phút (20 → 40 → 60 bot trên cùng server), xong thì rảnh 3 phút.

| Bot | tick + vá p50 / p95 (ms) | max p50 / p95 / lớn nhất (ms) | hồn thú / đang thức | KB/s mỗi client | CPU (một nhân) | heap sau gc | RSS |
|---|---|---|---|---|---|---|---|
| 20 | 4,1 / 7,8 | 12 / 51 / 60 | 397 / 391 | 6–7 | 8–14 % | 28–30 MB | 213–225 MB |
| 40 | 7,7 / 12,2 | 29 / 73 / 183 | 329 / 327 | ~7 | 12–16 % | 31–33 MB | 220–237 MB |
| 60 | 10,9 / 16,9 | 37 / 76 / 202 | 175 / 175 | 7–8 | 19–24 % | 35–36 MB | 239–260 MB |
| 60 (lượt profile riêng) | 6,8 / 9,7 | 18 / 88 / 124 | – | 6–7 | ~13 % | – | – |

- Mốc 11.4: 40 bot **đi lang thang** rải đều mất ~7 ms. Nay 40 bot **tự săn** (`AutoHunter`: A*, hồn kỹ, nhặt đồ) mất 7,7 ms (p50), gần như ngang mốc.
- Bot rải khắp bản đồ thì gần như mọi hồn thú đều thức, đúng như mô tả của skill. Ở mức 60 bot, số hồn thú giảm dần (400 → 160) vì bot hạ nhanh hơn tốc độ hồi sinh, nên tick không tăng tuyến tính theo số người.
- Sau khi bot rời: phòng tự hủy (0 phòng), heap về 27,6 MB, RSS giữ ~250 MB.

## 2. Kịch bản Vào ra: 40 bot trộn vai trên 6–7 phòng, 28 phút
`CHANNEL_MAX=12` để Tinh Đấu Ngoại vi ×8 tách 2 kênh. Có 5 phút 20 bot, rồi 23 phút 40 bot. Mỗi 10 bot gồm: tự săn ở Tinh Đấu Ngoại vi ×2, Lạc Nhật Sâm Lâm và Cực Bắc Chi Địa; 2 bot đánh thú vương (Thâm Hải Ma Kình Vương ở Hải Thần Đảo, Thiên Độc Chu Hoàng ở Tinh Đấu Nội địa, gọi ra bằng hook `king spawn`, tự săn đánh boss); 1 bot đi lang thang đánh thường / hồn kỹ; 1 bot gia nhập tông môn rồi đứng ở Thiên Đấu Thành; 2 bot **vào ra** mỗi 30–90 giây (đổi kênh, đi cổng sang bản đồ ×8 khác, rời hẳn rồi vào lại thành phiên mới).
Trong 23 phút ở mức 40 bot: 68 lần vào lại, 63 lần đi cổng, đổi kênh 1 lần (lượt sau 15 lần; hiếm khi có kênh thứ hai còn chỗ), 0 lỗi server.

| Phút | Bot | Phòng | heap sau gc | RSS | CPU | Σ tick + vá mọi phòng / nhịp |
|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 21,2 MB | 101 MB | – | – |
| 4 | 20 | 6 | 37,4 | 226 | 10 % | 5,2 ms |
| 8 | 40 | 6 | 39,9 | 235 | 15 % | 7,9 |
| 12 | 40 | 6 | 41,1 | 241 | 15 % | 9,2 |
| 16 | 40 | 6 | 42,4 | 243 | 17 % | 9,2 |
| 20 | 40 | 6 | 43,4 | 255 | 22 % | 8,4 |
| 24 | 40 | 6 | 44,4 | 254 | 18 % | 9,0 |
| 28 | 40 | 6 | 44,8 | 263 | 16 % | 9,4 |
| 33 (bot rời, rảnh 5 phút) | 0 | 0 | 30,9 | 270 | 0 % | – |

Theo phòng (phút 6–28):

| Phòng | Người TB | tick + vá p50 / p95 (ms) | max p50 / p95 / lớn nhất (ms) | hồn thú / thức | KB/s mỗi client |
|---|---|---|---|---|---|
| Tinh Đấu Ngoại vi kênh 1 | 9,6 | 2,0 / 2,9 | 5,6 / 20 / 47 | 415 / 230 | 5–7 (tự săn) |
| Tinh Đấu Nội địa (Thiên Độc Chu Hoàng) | 9,4 | 1,9 / 2,9 | 4,8 / 15 / 78 | 403 / 257 | 9–12 (cạnh thú vương) |
| Hải Thần Đảo (Thâm Hải Ma Kình Vương) | 5,1 | 1,6 / 2,6 | 4,3 / 13 / 38 | 399 / 167 | 9–12 (cạnh thú vương) |
| Lạc Nhật Sâm Lâm | 5,3 | 1,5 / 2,3 | 3,9 / 24 / 80 | 400 / 183 | 5–7 |
| Cực Bắc Chi Địa | 6,1 | 1,5 / 2,2 | 4,0 / 27 / 52 | 357 / 168 | 5–7 |
| Thiên Đấu Thành (tông môn) | 4,0 | 0,2 / 0,4 | 0,7 / 4 / 20 | 0 | ~0,5 |

Mọi phòng chạy trên cùng một luồng, nên tổng tick + vá của cả tiến trình là cột Σ ở bảng trên (8–10 ms mỗi nhịp 50 ms với 40 người).

## 3. Rò bộ nhớ
- **Sau khi mọi bot rời:** mọi phòng tự hủy (`onDispose`, 0 phòng sau 30 giây) ở mọi lượt. Heap về 27,6 MB (lượt Ngắn) / 30,9 MB (lượt Vào ra).
  Khi khởi động heap là 21 MB. Phần chênh là dữ liệu tài khoản bot trong `MemoryStore` (chỉ có ở chế độ RAM; chạy PostgreSQL thì không có) cùng các `Map` mức tiến trình theo tài khoản.
- **Heap tăng khi tải không đổi:** ở mức 40 bot, heap sau gc tăng 37 → 45 MB trong ~20 phút rồi phẳng từ phút ~22. Một lượt riêng 20 phút lấy mẫu heap (`HeapProfiler.startSampling` từ phút 7, gc rồi đọc ở phút 19) cho thấy đối tượng mới còn sống chủ yếu là:
  hồn thú sinh lại thay con đã chết (`MapRoom.addBeast`, số hồn thú giữ quanh 400 nên không tăng); **túi đồ**: bản đã gửi của từng ô (`bagDiff`, `shared/bagSync.ts:19`), ô mới nhặt (`newItem`), bản lưu của `MemoryStore` (`copyItem`, `server/src/db.ts:86`); lưới `interest` (xóa id không còn trong state ở `sync`).
  Bot tự săn nhặt đồ tới khi túi đầy `BAG_SLOTS` ô (tự săn dừng vì "túi đồ đã đầy", tự bán mặc định tắt). 40 bot × `BAG_SLOTS` ô × ~1 KB (ô trong `pdata`, chuỗi JSON đã gửi, bản lưu) ≈ 10 MB với giá trị `BAG_SLOTS` ở commit `257570e`, khớp mức tăng. Phần này có trần, **không phải rò**.
- **RSS** tăng ~100 → 250–270 MB trong 10 phút đầu rồi phẳng, và không về khi rảnh. Lý do giống soak 30 phút trước: V8 / allocator giữ lại trang và bộ đệm mã hóa 1 MB mỗi phòng (11.4).
- `Map` mức tiến trình (skill `soak-perf` mục 4): `kingSeats`, `eliteLocks` bỏ mục hết hạn khi tra; `party.ts` dọn ở `party.sweep` mỗi tick; `ratelimit.ts` dọn mỗi 5 phút.
  `channelSwitchAt` và `leftRoom` (`MapRoom.ts`) không bao giờ xóa mục của tài khoản không quay lại, nhưng mỗi tài khoản chỉ giữ một mục vài chục byte. Không đáng sửa ở quy mô server bạn bè.

## 4. CPU
Profile CPU 120 giây (inspector, 60 bot tự săn, một kênh): tiến trình bận ~13 % một nhân. Trong phần bận:
- Tick luật chơi ~45 %, trong đó `AutoHunter.tick` ~25 % (60 người treo).
- Mã hóa và gửi bản vá ~40 %: `encodeView` lọc theo client ~25 %, ghi WebSocket ~20 % (hai phần chồng nhau).
- GC 0,2 % tổng thời gian.

Không có hàm game nào nổi bật. `vnClock` (`Intl.DateTimeFormat`, gọi từ `today()` mỗi lần tự săn quyết định) chỉ ~1,4 % phần bận.

## 5. Kết luận
| Tiêu chí | Kết quả |
|---|---|
| Giữ nhịp 50 ms, 40 người một kênh ×8 (tự săn) | **Đạt**: p50 7,7 ms, p95 12 ms (mốc 11.4 ~7 ms khi đi lang thang) |
| 40 người trộn vai trên 6 phòng | **Đạt**: mỗi phòng 1,5–2 ms (p50), cả tiến trình 8–10 ms mỗi nhịp |
| 60 người một kênh | **Cảnh báo**: p50 6,8–10,9 ms, p95 10–17 ms. Vượt ngưỡng báo động ~10 ms của skill ở một lượt, nhưng vẫn còn xa 50 ms |
| Nhịp chậm > 50 ms (`max`) | **Có, hiếm, chưa rõ nguyên nhân**: đo lại ở mục 6. Phần lớn là nhiễu máy (wall ≫ cpu); còn lại là vài nhịp 50–65 ms ở vòng người chơi, chưa thấy tăng theo số người (một lượt 5 phút mỗi mức) |
| Băng thông mỗi client | **Đạt**: 5–8 KB/s (mốc 7–8), 9–12 KB/s cạnh thú vương, ~0,5 KB/s trong thành |
| Phòng trống tự hủy, heap về gần mức đầu | **Đạt** |
| Rò bộ nhớ | **Không thấy**: heap tăng do túi đồ đầy dần (có trần), dừng tăng khi túi đầy |
| Kịch bản Dài 1–2 giờ | **Chưa đo**: máy dùng chung, mỗi lượt giới hạn 30 phút. Đã thay bằng 3 lượt 20–28 phút liên tiếp, không thấy xu hướng tăng ngoài túi đồ |

## 6. Đo lại nhịp chậm
Code `5620686` (có `PERF_LOG` ghi `[perf-slow]` theo đoạn và CPU luồng chính). macOS, 10 luồng, tải nền ~3 (có các phiên khác chạy cùng). Server `node --import tsx`, `GAME_TEST=1 PERF_LOG=1`, lưu RAM (`env -u DATABASE_URL`, log in `Chưa có DATABASE_URL`), bản đồ ×8. Bot: `N=40|60 SECS=300 node client/scripts/auto-soak.mjs`, một kênh Tinh Đấu Ngoại vi, mỗi mức một server mới. Chỉ tính cửa sổ 10 giây có đủ người.

| Bot | tick + vá p50 / p95 (ms) | max p50 / p95 / lớn nhất (ms) | nhịp > 50 ms | KB/s mỗi client |
|---|---|---|---|---|
| 40 | 7,0 / 9,7 | 17,6 / 66,6 / 117,9 | 4 trong 5 phút (0,8 / phút) | 8,5 |
| 60 | 8,3 / 9,0 | 20,7 / 26,3 / 46,0 | 0 | 8,2 |

- Lượt 40 bot, 4 dòng `[perf-slow]` (wall / cpu ms, đoạn nặng): 70 / 68 (người 63), 67 / 27 (người 49), 118 / 22 (nhiễu: wall ≫ cpu), 13 / 10 (trễ nhịp trước). Chỉ nhịp đầu là việc thật của luồng; nhịp thứ hai nửa thật nửa bị hệ điều hành giành CPU.
- Lượt 60 bot không có nhịp nào vượt 50 ms, nên **chưa thấy** đỉnh tăng theo số người (chỉ một lượt 5 phút mỗi mức; với ~0,4 nhịp thật / phút ở lượt 40, xác suất lượt 60 không gặp nhịp nào do ngẫu nhiên vẫn ~13 %, chưa đủ để kết luận). Có vẻ là biến cố rời rạc (nghi `AutoHunter` tìm đường A* một lần nặng khi mục tiêu xa / không tới được), chưa chứng minh vì `[perf-slow]` chỉ chia tới đoạn "người".
- Lượt đo trước (cổng DB thật, bỏ) cho thấy nhiễu máy thật sự gây nhịp tới 25 giây (wall 25 000 ms, cpu 7 ms: cả tiến trình bị treo), không liên quan code game.
- Kết luận: với 40–60 người tự săn một kênh ×8, nhịp trung bình 7–8 ms, nhịp > 50 ms hiếm (≤ 1 / phút) và không có nguyên nhân rõ trong code nên **không sửa code**. Chốt nguyên nhân (đo từng lần gọi `AutoHunter.tick`, đoạn "người", khi nhịp vượt ngưỡng) tách sang phần 7 bên dưới.

## 7. Nhịp chậm ở vòng người chơi khi 40 người tự săn: đo từng lần `AutoHunter.tick`
**Cách đo.** Server `PERF_LOG=1` bật thì mỗi dòng `[perf-slow]` thêm: số `AutoHunter.tick` và tổng ms, ba người tốn nhất, và từng lần `plan()` (A*) kèm thời gian, loại (thường / dài), số điểm (`perfAuto` / `perfPlan` ở `MapRoom`, xóa đầu mỗi tick; tắt `PERF_LOG` thì không đo gì). Lượt đo: server `env -u DATABASE_URL GAME_TEST=1 PERF_LOG=1` (log xác nhận "chỉ lưu trong RAM"), `N=40 node client/scripts/auto-soak.mjs` trên Tinh Đấu Ngoại vi ×8: 10 phút rồi 25 phút (macOS, máy có phiên khác chạy).
**Kết quả.**
- Lượt 10 phút: 0 nhịp chậm, `max` mỗi 10 giây ≤ 39 ms.
- Lượt 25 phút: chỉ **một cụm** nhịp thật vượt 50 ms, lúc 40 bot vừa vào phòng (3 nhịp trong 0,5 giây: 84 / 209 / 36 ms). Ở nhịp 84 ms: `AutoHunter` của một người mất 36,4 ms mà **không có lần tìm đường nào** (`tìm đường 0 lần`), nhịp 209 ms là `vá` 205 ms (đợt người vào, state đầy). Sau đó không còn nhịp nào vượt 50 ms; `AutoHunter.tick` cả 40 người ≤ 2,2 ms, mỗi lần A* ≤ 0,1 ms.
- Microbench `findPath` / `findLongPath` (4000 cặp điểm ngẫu nhiên, bản đồ ×8): thường p99 0,66 ms, lớn nhất 0,73 ms; dài p99 1,4 ms, lớn nhất 2,9 ms. **A* không thể gây nhịp 50–65 ms.**
- Các dòng `[perf-slow]` còn lại (khoảng 30 giây một dòng, về sau) chỉ do `gap` > 100 ms với `wall` 2–5 ms: CPU ngoài tick 100–380 ms, tăng dần theo thời gian soak (túi bot đầy). Nguồn chốt ở mục 7.1 (#664).
**Kết luận.** Giả thuyết "A* một lần nặng" bị bác bỏ; nhịp 50–65 ms ở vòng người chơi là nhiễu lúc người vào đông (một `AutoHunter` quyết định lần đầu 36 ms, chưa rõ chỗ, chỉ gặp một lần). Không sửa code luật. Nhịp trễ định kỳ do CPU ngoài tick: xem 7.1.

### 7.1 Trễ ngoài tick tăng dần khi túi đầy: nguồn là `MemoryStore`, không phải server thật (#664)
**Cách đo.** `PERF_LOG=1` thêm dòng `[perf-save]` mỗi 10 giây có lượt lưu định kỳ (`perfSave` ở `MapRoom`): số lần lưu, ms chụp túi (`unsavedBag` → `bagSnapshot`), ms phần **đồng bộ** của `store.saveProgress` (trước khi trả promise, tức phần chặn vòng lặp), tổng số món đã chụp. Lưu định kỳ chạy mỗi 30 giây cho cả phòng (`saveT` ở `MapRoom.tick`), nên 40 lần lưu dồn vào một đợt. Hai lượt giống hệt nhau, chỉ khác kho lưu: `N=40 SECS=900 node client/scripts/auto-soak.mjs`, Tinh Đấu Ngoại vi ×8, server `GAME_TEST=1 PERF_LOG=1`, Windows, một lượt chạy một mình (không có bot khác). Lượt 1 `env -u DATABASE_URL` (`MemoryStore`), lượt 2 PostgreSQL cục bộ (PostgreSQL chung của `bot:local`, database riêng, xoá sau khi đo).

| Phút | Tổng món trong 40 túi | Chụp túi (ms/đợt) | Ghi DB đồng bộ, `MemoryStore` (ms/đợt) | Ghi DB đồng bộ, PostgreSQL (ms/đợt) |
|---|---|---|---|---|
| ~1 | 170 | 0,4 | 1,7 | 0,3 |
| ~4 | 1000–1200 | 1,2 | 13 | 0,1 |
| ~8 | 3200 | 3,5 | 88 | 0,1 |
| ~12 | 5300 | 3,2–5,6 | 134–200 | 0,1 |
| ~15 | 7000 | 4,2–6,4 | 272 | 0,2 |

**Kết quả.**
- `MemoryStore`: `[perf-slow]` 62 dòng trong 15 phút, 33 dòng có `gap` > 100 ms, 18 dòng có `cpu ngoài tick` > 80 ms (lớn nhất 369 ms), đều cách nhau ~30 giây, tăng theo số món. Trùng khít với ghi DB đồng bộ 272 ms ở 7000 món. Nguồn là `MemoryStore.checkBag` (`server/src/db.ts:596-597`): mỗi lần lưu so id của túi đang lưu với mọi món của mọi tài khoản khác (`b.items.some((i) => bag.items.some(...))`), bậc hai theo số món. Microbench (40 túi bằng nhau, 40 lần lưu mỗi đợt, `tsx`, không commit): 25 món/túi `checkBag` 6 ms; 175 món/túi 90 ms; 500 món/túi 842 ms, còn `putBag` (chứa `copyBag`, nhân bản sâu) tuyến tính 3 / 12 / 37 ms, nên nhân bản không phải thủ phạm.
- PostgreSQL: `[perf-slow]` 15 dòng, **0 dòng** có `cpu ngoài tick` > 80 ms, `gap` lớn nhất 143 ms và không có CPU tương ứng (nhiễu hệ điều hành / GC). Phần đồng bộ của ghi DB ≤ 0,3 ms; chụp túi 6,4 ms cho cả 40 người ở 7000 món (~0,9 µs mỗi món, tuyến tính, chấp nhận được). tick + vá trung bình 6,0 + 2,9 ms, không khác lượt `MemoryStore` (6,3 + 2,9).
- GC không liên quan (`gc ngoài tick` ~0 ở mọi dòng).
**Kết luận.** Không phải lỗi ở server chạy thật: nhịp trễ định kỳ chỉ có ở `MemoryStore` (kho RAM của dev / bot khi không có `DATABASE_URL`), do `MemoryStore.checkBag` kiểm id trùng tài khoản khác theo bậc hai (PostgreSQL dùng khóa duy nhất của bảng `items`). Không sửa luật chơi. Số đo của mục 7 (lượt chạy RAM) vì thế phóng đại phần trễ này; soak tải nên chạy với `--pg`. Giữ dòng `[perf-save]` để lần sau soi lại nếu đổi cách lưu túi.

## 8. Hiệu ứng hồn kỹ theo hệ khi 40–100 người cùng tung chiêu (G3)
**Cách đo.** Trang thử `?thu=fx&stress=<P>` (mỗi trong P người tung một hồn kỹ ngẫu nhiên, hệ / kiểu / niên hạn ngẫu nhiên, mỗi ~2,5 giây; không có server, chỉ phần vẽ). Chrome headless GPU thật (`d3d11`, vsync, `--mute-audio`) 1280×720, camera ×2, mỗi ô 10 giây sau 4 giây khởi động; số liệu từ CDP `Performance.getMetrics` (`ScriptDuration`, `TaskDuration` trên mỗi khung). Màn hình đo giới hạn 112 khung/giây.

| Người (P) | Mức | Khung/giây | Script ms / khung | Tác vụ luồng chính ms / khung | Sprite tối đa | Hạt tối đa |
|---|---|---|---|---|---|---|
| 0 | Thấp / Vừa / Cao | 112 | 0,32 / 0,33 / 0,33 | 0,54 / 0,55 / 0,57 | 0 | 0 |
| 40 | Thấp | 112 | 0,41 | 0,67 | 4 | 0 |
| 40 | Vừa | 112 | 0,50 | 0,77 | 14 | 56 |
| 40 | Cao | 112 | 0,44 | 0,66 | 19 | 140 |
| 60 | Thấp | 112 | 0,38 | 0,59 | 4 | 0 |
| 60 | Vừa | 112 | 0,49 | 0,74 | 14 | 56 |
| 60 | Cao | 112 | 0,50 | 0,74 | 28 | 140 |
| 100 | Thấp / Vừa / Cao | 112 | 0,46 / 0,59 / 0,57 | 0,73 / 0,90 / 0,85 | 4 / 14 / 30 | 0 / 56 / 140 |

**Kết luận.** Hiệu ứng thêm khoảng 0,1–0,2 ms script mỗi khung ở mức Vừa / Cao khi 60 người cùng tung chiêu (0,5 ms trong ngân sách 16,7 ms của 60 khung/giây); sprite và hạt luôn nằm dưới trần theo mức nên chi phí không tăng theo số người. **Giới hạn của phép đo:** không có Chrome nào dựng cả 60 hồn sư, bản đồ và ánh sáng cùng lúc, nên con số này chỉ là phần hiệu ứng cộng thêm; cảnh thật (hồn sư, hồn thú, Light2D) chưa đo trong lượt này. Máy dùng chung với phiên khác.

## 9. Soak Redis hai tiến trình, tắt giữa chừng

Mục tiêu là kiểm tra Redis mất kết nối không làm hai server chết, dữ liệu presence của arena / bạn bè dùng chung được khi Redis hồi, và DB test không chạm dữ liệu thật.

**Môi trường và an toàn.** Chạy ngày 25-10-2026 trên macOS, Node 22.23.3, Redis 8.10.2 ở `127.0.0.1` cổng riêng, hai server `bot-local --procs 2`, `GAME_TEST=1`, `--heap 512`. PostgreSQL dùng embedded cluster tạm ở cổng 55433, mỗi lượt tạo database riêng rồi xóa; không dùng `DATABASE_URL` trong shell và không dùng DB 5433 đang lỗi `plpgsql`.

| Bài | Thời điểm tắt / bật Redis | Kết quả bot | Thời gian | RAM đỉnh server / bot |
|---|---|---:|---:|---:|
| `arena` | khoảng giây 34 / sau 10 giây | **827 ✓, 0 ✗, 0 ⚠** | 160,2 giây | RSS 160 / 158 MB, heap 42 MB |
| `friend` | khoảng giây 14 / sau 10 giây | **188 ✓, 0 ✗, 0 ⚠** | 33,4 giây | RSS 185 / 151 MB, heap 37 MB |

Trong lượt `arena`, các trận tiếp tục chạy qua lúc Redis tắt và dữ liệu Elo / phần thưởng / sổ xem trận vẫn đạt sau khi Redis hồi. Trong lượt `friend`, thao tác thêm bạn, chặn, chat và nạp lại danh sách đạt sau khi Redis hồi. Cả hai server đều sống đến cuối và log tắt bình thường có `đã lưu người chơi đang online`; database test được xóa sau mỗi lượt.

Kiểm tra bổ sung gồm hai phạm vi. Bài `presence` dùng backend local cố định và đạt các nhánh lock / `arena:live` / `friend:state`:

```bash
npm run test:presence --prefix server
```

Bài `presence-kill` dùng Redis localhost riêng, cần prefix an toàn bắt đầu bằng `test`; bài đạt dọn trận sau **15 giây TTL**, nhả lease tài khoản và dọn bản sao bạn bè của tiến trình bị kill:

```bash
REDIS_URL=redis://127.0.0.1:<cổng-local> \
REDIS_PREFIX=test:presence-kill \
npm run test:presence-kill --prefix server
```

Lệnh tái hiện phần bot:

```bash
BOT_PG_URL=postgres://bot@127.0.0.1:55433/postgres \
npm run bot:local -- --only arena --procs 2 --pg --env REDIS_URL=redis://127.0.0.1:<cổng-local>
BOT_PG_URL=postgres://bot@127.0.0.1:55433/postgres \
npm run bot:local -- --only friend --procs 2 --pg --env REDIS_URL=redis://127.0.0.1:<cổng-local>
```

Redis được tắt / bật bởi harness ngoài bài bot đúng giữa lượt; không đưa harness hoặc log tạm vào repo.

## Trang bị hồn sư (E7)
Chạy dài lệnh Thợ rèn / mặc đồ (40 bot × 20 phút, và PostgreSQL 20 bot × 5 phút): tick ~0,9 ms, không chậm dần, bộ nhớ không rò, vào lại đúng trạng thái. Số liệu, cách chạy (`bot:local --only equipsoak`) và kết luận cân bằng ở `docs/trang-bi-kinh-te.md` mục E7.

## Issue liên quan
#167 (soak ×8), #220 / #222 (thú vương Tinh Đấu Nội địa), #229 (soak 30 phút), #240, #241, #250, #273 và #375 (nhịp chậm), #311 (`PERF_LOG` theo đoạn), #394 (hiệu ứng G3), #418 (E7), #496 (Redis).
