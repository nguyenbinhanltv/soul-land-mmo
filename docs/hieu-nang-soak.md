# Đo hiệu năng chạy dài trên bản đồ ×8 (#167)

Đo theo skill `soak-perf` trên code `257570e` (sau tự săn toàn bản đồ #213 / #218, vùng độc #220, Thủy Triều Dâng #240, tông môn #250).
So với mốc 11.4 (PR #129) và soak 30 phút của #229. Bot tải, log thô và script đo để ngoài repo (thư mục artifact của phiên).

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
`CHANNEL_MAX=12` để Tinh Đấu Ngoại vi ×8 tách 2 kênh. Có 5 phút 20 bot, rồi 23 phút 40 bot. Mỗi 10 bot gồm: tự săn ở Tinh Đấu Ngoại vi ×2, Lạc Nhật Sâm Lâm và Cực Bắc Chi Địa; 2 bot đánh thú vương (Thâm Hải Ma Kình Vương ở Hải Thần Đảo #240, Thiên Độc Chu Hoàng ở Tinh Đấu Nội địa #220 / #222, gọi ra bằng hook `king spawn`, tự săn đánh boss #241); 1 bot đi lang thang đánh thường / hồn kỹ; 1 bot gia nhập tông môn rồi đứng ở Thiên Đấu Thành (#250); 2 bot **vào ra** mỗi 30–90 giây (đổi kênh, đi cổng sang bản đồ ×8 khác, rời hẳn rồi vào lại thành phiên mới).
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
- **RSS** tăng ~100 → 250–270 MB trong 10 phút đầu rồi phẳng, và không về khi rảnh. Lý do giống #229: V8 / allocator giữ lại trang và bộ đệm mã hóa 1 MB mỗi phòng (11.4).
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
| Nhịp chậm > 50 ms (`max`) | **Chưa rõ**: đỉnh 75–90 ms ở p95 của các cửa sổ 10 giây, lớn nhất 200 ms khi 40–60 người một kênh. Profile không chỉ ra hàm game nào, GC chỉ 0,2 %. Nghi do máy đo bị nhiễu (3 phiên agent khác và Chrome chạy cùng); cần đo lại trên máy rảnh / Linux |
| Băng thông mỗi client | **Đạt**: 5–8 KB/s (mốc 7–8), 9–12 KB/s cạnh thú vương, ~0,5 KB/s trong thành |
| Phòng trống tự hủy, heap về gần mức đầu | **Đạt** |
| Rò bộ nhớ | **Không thấy**: heap tăng do túi đồ đầy dần (có trần), dừng tăng khi túi đầy |
| Kịch bản Dài 1–2 giờ | **Chưa đo**: máy dùng chung, mỗi lượt giới hạn 30 phút. Đã thay bằng 3 lượt 20–28 phút liên tiếp, không thấy xu hướng tăng ngoài túi đồ |
