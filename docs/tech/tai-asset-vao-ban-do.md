# Tải asset khi vào / đổi bản đồ (#716)

Đây là **báo cáo đo + kế hoạch chia bước**, không phải luật chơi. Cách đo: `client/scripts/load-measure.mjs` (Chrome thật qua CDP, `--mute-audio`, cổng gỡ lỗi tự chọn, tắt đúng PID mình bật). Cần `npm run build` rồi server `GAME_TEST=1` không `DATABASE_URL` (MemoryStore), ví dụ `env -u DATABASE_URL GAME_TEST=1 PORT=3716 npx tsx server/src/index.ts`, sau đó:

```
node client/scripts/load-measure.mjs --base http://127.0.0.1:3716 [--maps a,b,c] [--json] [--samples] [--shot ảnh.png]
```

Mỗi lần chạy: tạo tài khoản, vào Thánh Hồn Thôn với hồ sơ Chrome trống ("lạnh"), tải lại trang ("nóng"), rồi đi từng bản đồ bằng hook `warp` hai vòng (lần đầu / lần sau). Ghi: thời gian tới khi scene bản đồ dựng xong phần ô (`isoMap` có), số request theo nhóm đường dẫn, số qua mạng thật, KB mạng, mốc nối phòng / tải file / dựng. Số bên dưới là **trung vị 3 lượt** trên máy cục bộ không có độ trễ mạng, nhiều phiên khác cùng chạy nên dao động ±15%: dùng để so trước / sau, không phải mốc tuyệt đối.

## Đo được (trước khi sửa, `f98e6de2`)

Một lần vào bản đồ (warp, cache nóng) ≈ **1.050 request riêng lẻ**, gần như toàn bộ trúng cache trình duyệt (`immutable` của #580: 0–1 request qua mạng, ~0 KB), nhưng bản đồ sẵn sàng sau **6,4–9,0 giây**. Nghĩa là **cái chặn hiển thị là việc giải mã / nạp texture trên luồng chính**, không phải mạng (thử `maxParallelDownloads` 12 → 48: không đổi).

Số "2.090 request" của issue đếm cả `blob:` (Phaser tải ảnh bằng XHR rồi tạo `blob:` để giải mã, ~1.030 dòng). Đó không phải request mạng; script tách riêng cột "blob cục bộ".

Request theo nhóm mỗi lần vào bản đồ (Nặc Đinh Thành, trước khi sửa):

| Nhóm | Số file | Ghi chú |
|---|---|---|
| `sprites/iso` | 672 | 601 là dải hiệu ứng `fx_*` (3,6 MB), còn lại vật đứng / nhà của bản đồ |
| `sprites/beast` | 134 | 67 loài × (ảnh + normal map), tải hết mọi bản đồ |
| `iso/ground` | 88 | ô nền của bản đồ (đúng theo bản đồ) |
| `sprites/vohon` | 100 | phụ thể 25 võ hồn × 2 lớp × (ảnh + normal map), **mỗi ảnh 2304×1152** |
| `sprites/phaptuong` | 35 | mỗi ảnh 2560×800 |

Thử bỏ từng nhóm (`?skip=` tạm, đã gỡ) ở cache nóng, hai bản đồ:

| Bỏ nhóm | Thời gian sẵn sàng |
|---|---|
| (không bỏ) | ~8,5 s |
| `vh` (phụ thể, 100 file) | ~4,5 s (**−4 s**) |
| `fx` (601 file) | ~5,3–6,6 s (−1,5…−2 s) |
| `pt` (pháp tướng, 35 file) | ~7,7 s (−1 s) |
| `beast` (134 file) | 7–8,8 s (−0…−2 s, dao động) |

Phụ thể là thủ phạm chính: 100 ảnh × 2304×1152 × 4 byte ≈ **1 GB điểm ảnh sau giải mã** (kèm normal map) chỉ để vẽ lớp phụ thể của vài người chơi trong tầm nhìn.

## Kế hoạch chia bước (mỗi bước một PR "Part of #716", đo trước / sau bằng script trên)

1. **Phụ thể võ hồn tải theo nhu cầu** (`client/src/vohonLazy.ts`) — **đã làm ở PR đầu**. `preloadSprites` chỉ ghi spec; preload xin sheet của người đang trong phòng lúc vào; người tới sau / đổi võ hồn thì tải lười, lớp phụ thể ẩn tới khi tải xong; ảnh võ hồn trong bảng Đội hình / Nhân vật dựng lại khi sheet tới; tải lỗi hẳn thì dùng phụ thể vẽ bằng code như khi manifest thiếu ảnh. Ảnh hiển thị cuối cùng không đổi.
2. **Pháp tướng `pt_*` theo nhu cầu**: cùng cơ chế (chỉ tải khi một người trong phòng có pháp tướng của võ hồn đó). Ước tính −1 s, −290 MB điểm ảnh.
3. **Hồn thú theo bản đồ**: manifest đã ghi `map` cho từng loài (`beast_*`); tải loài của bản đồ đang vào (cộng boss thế giới / thú vương xuất hiện ngoài bản đồ nhà). Cần đối chiếu với danh sách loài mỗi bản đồ ở `shared/data.ts` (đừng tải thiếu, loài thiếu rơi về hình vẽ code). 134 → khoảng 20–40 file.
4. **Hiệu ứng `fx_*` theo nhu cầu**: 601 dải 1 hàng; tải khi hồn kỹ / hiệu ứng cần lần đầu, hoặc theo võ hồn trong đội (cả của người khác trong tầm). `playFx` đã trả `null` khi chưa có texture (nơi gọi giữ hiệu ứng vẽ code), nhưng lần dùng đầu sẽ không có ảnh nên cần xin trước (khi nhận đội hình / khi thấy người dùng võ hồn). Rủi ro cao hơn các bước trên vì đụng thị giác chiến đấu.
5. **Không huỷ texture dùng chung khi đổi bản đồ** (giữ `Phaser.Game`, đổi scene; hoặc tạm giữ bộ nhớ đệm texture dùng chung): hồn sư, pháp tướng, fx, UI không giải mã lại. Lợi lớn nhất cho đổi bản đồ nhưng đụng `main.ts` / vòng đời scene (sự kiện `filecomplete-json-*` của manifest không bắn khi key đã có trong cache, cần xử lý), phải chạy bot `travel` + soak.
6. **Gom atlas** (ảnh nhỏ, `tools/assets`): giảm số request / số texture cho vật đứng, ô nền; đã có `isoAtlas.ts` cho Light2D (nhiều trang từ #718).
7. **Cache HTTP, preload theo bản đồ, âm thanh**: HTTP cache đã đúng (#580: `?v=` + immutable). Chưa thấy âm thanh chặn hiển thị (nhạc nền 3 request, ~1,6 MB lần đầu). Xem lại sau khi 1–5 xong.

Mọi bước: đo `load-measure.mjs` (trước / sau), chạy `npm run bot:local -- --only travel`, kiểm tay một bản đồ không lỗi console.

## Bước 1: số trước / sau (trung vị 3 lượt, ms tới khi sẵn sàng)

| Ca | Bản đồ | Trước | Sau |
|---|---|---|---|
| vào game, tải lại trang (nóng) | Thánh Hồn Thôn | 6.287 | 3.678 |
| warp lần đầu | Nặc Đinh Thành | 7.891 | 4.844 |
| warp lần đầu | Tinh Đấu Ngoại vi | 6.626 | 3.169 |
| warp lần đầu | Thiên Đấu Thành | 9.367 | 5.806 |
| warp lần đầu | Lõi Tinh Đấu | 6.500 | 2.908 |
| warp lần sau (nóng) | Nặc Đinh Thành | 8.195 | 3.898 |
| warp lần sau (nóng) | Tinh Đấu Ngoại vi | 6.821 | 2.847 |
| warp lần sau (nóng) | Thiên Đấu Thành | 9.038 | 4.735 |
| warp lần sau (nóng) | Lõi Tinh Đấu | 6.425 | 2.815 |

Request mỗi lần vào bản đồ: 1.009–1.124 → 913–1.030 (bỏ 96 file); KB mạng lần đầu vào game: 13.258 → 10.646 (−2,6 MB). Lượt "lạnh" (hồ sơ Chrome trống) dao động theo server nên không nêu trung vị: 12,1 / 10,1 / 10,3 s trước, 16,8 / 11,0 / 6,9 s sau.
