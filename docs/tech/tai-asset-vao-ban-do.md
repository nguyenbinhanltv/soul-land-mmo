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
2. **Pháp tướng `pt_*` theo nhu cầu** — **đã làm ở PR thứ hai**. Cùng cơ chế với bước 1 (`wantPhapTuong` trong `vohonLazy.ts`): `preloadSprites` chỉ ghi spec; sheet thân + lớp sáng `_glow` được xin khi có người trong phòng đang Chân Thân (`ava > 0`, lúc vào hoặc lúc `PhapTuongSystem.sync` thấy) và của chính mình (lúc vào / đổi võ hồn, để cut-in có ảnh). Chưa tải xong thì chưa dựng hình pháp tướng và không vẽ bản tạm (khỏi nháy); `setSlots` hỏi lại mỗi khung. Manifest không có ảnh / tải lỗi thì vẫn dùng sheet tạm bằng code. Ảnh hiển thị cuối cùng không đổi.
3. **Hồn thú theo loài trong tầm** — **đã làm ở PR thứ ba**. Cùng cơ chế với bước 1 / 2 (`wantBeast` trong `vohonLazy.ts`): `preloadSprites` chỉ ghi spec `beast_*` (cả `_anim` và normal map); preload xin loài của hồn thú đã có trong state lúc vào, hồn thú tới sau (đi vào tầm, boss / thú vương / thú gọi ra) xin lúc xuất hiện (vòng vẽ hồn thú ở `GameScene`). Chọn theo loài thật đang có trong tầm chứ không theo trường `map` của manifest, nên không bao giờ tải thiếu (loài ngoài bản đồ nhà vẫn có ảnh). Chưa tải xong thì ẩn sprite, tên, thanh máu, bóng (không vẽ bản tạm bằng code để khỏi nháy); sheet tới thì dựng animation / đo thân (`setBeastSheetHook` trong `sprites.ts`). Manifest không có ảnh / tải lỗi thì vẽ bằng code theo bậc như trước. Ảnh hiển thị cuối cùng không đổi.
4. **Hiệu ứng chiêu `fx_sk_*` theo võ hồn** — **đã làm ở PR thứ tư**. Cùng cơ chế với bước 1–3 (`wantSkillFx` trong `vohonLazy.ts`): 560 dải `fx_sk_<tên>` (+ lớp sáng `_g`, 3,3 MB; chiếm ~93% trong 601 dải `fx_*`) chỉ ghi spec; sheet của võ hồn nào được xin khi có người dùng võ hồn đó trong phòng (lúc vào, lúc người mới tới / đổi võ hồn), lớp sáng `_g` chỉ cho chính mình (chiêu người khác không vẽ lớp sáng). Danh sách key suy từ `SKILL_VISUAL` (chỉ chiêu khai ở đó); hiệu ứng hệ `fx_<hệ>_*`, hợp thể (`FUSION_VISUAL`), va chạm... vẫn tải ngay. Chưa tải xong thì `SheetFx.play` trả false và chiêu dùng hiệu ứng vẽ bằng code như khi manifest thiếu ảnh, nên chỉ có thể lệch ở chiêu đầu tiên của người vừa vào tầm trong vài chục ms đầu; ảnh hiển thị lúc ổn định không đổi. Phần còn lại của `fx_*` (~40 dải theo hệ) để dành nếu đo cho thấy còn đáng.
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

## Bước 2: số trước / sau (trung vị 3 lượt, ms tới khi sẵn sàng)

Bước 2 bỏ 34 / 35 file `sprites/phaptuong` mỗi lần vào bản đồ (còn lại sheet của chính mình), khoảng 34 × 2560×800×4 B ≈ 280 MB điểm ảnh sau giải mã. Lượt đo này **máy bận** (nhiều phiên khác cùng chạy; có lượt vọt tới 15–28 s ở cả hai bên), nên trung vị dao động mạnh và chênh lệch thời gian nằm trong nhiễu; số file / KB thì chắc chắn.

| Ca | Bản đồ | Trước (ms) | Sau (ms) | Request trước → sau |
|---|---|---|---|---|
| vào game, tải lại trang (nóng) | Thánh Hồn Thôn | 3.296 | 3.267 | 1.040 → 1.006 |
| warp lần đầu | Nặc Đinh Thành | 4.369 | 4.702 | 972 → 938 |
| warp lần đầu | Tinh Đấu Ngoại vi | 3.609 | 15.432 (3.424 / 18.822 / 15.432) | 966 → 932 |
| warp lần đầu | Thiên Đấu Thành | 6.098 | 19.526 (6.468 / 24.697 / 19.526) | 982 → 948 |
| warp lần đầu | Lõi Tinh Đấu | 3.846 | 3.230 | 927 → 893 |
| warp lần sau (nóng) | Nặc Đinh Thành | 8.592 | 4.321 | 972 → 938 |
| warp lần sau (nóng) | Tinh Đấu Ngoại vi | 10.602 | 3.803 | 965 → 921 |
| warp lần sau (nóng) | Thiên Đấu Thành | 9.084 | 6.806 | 982 → 948 |
| warp lần sau (nóng) | Lõi Tinh Đấu | 3.488 | 12.978 | 935 → 891 |

Mức thấp nhất của ba lượt (ít bị nhiễu nhất): vào game nóng 2.956 → 3.018, Nặc Đinh Thành lần đầu 3.738 → 4.293, Tinh Đấu Ngoại vi 3.100 → 3.424, Lõi Tinh Đấu lần sau 3.478 → 3.124. Nghĩa là **lợi về thời gian không đo được trên máy này** (ước tính −1 s ở đo thử nhóm `pt` chưa tái hiện được dưới tải nền); lợi chắc chắn là −34 file, −3,8 MB mạng lần đầu vào game (16.746 → 12.952 KB, lượt lạnh) và −280 MB điểm ảnh. Nên đo lại khi máy rảnh.

Kiểm tay (Chrome thật, `__scene`): bật `ava` trên người chơi của mình sau khi gỡ texture `pt_lam_dien_ba_vuong_long` → sheet tải lại, `PhapTuongSystem` dựng 1 slot, sheet 81 khung (hoạt ảnh đủ), ảnh pháp tướng hiện sau lưng hồn sư, 0 lỗi console.

## Đo lại bước 2 khi máy nhẹ, và bước 3 (trung vị 3 lượt xen kẽ, ms tới khi sẵn sàng)

Lượt đo này máy nhẹ (CPU ~15%): ba bản dựng chạy xen kẽ A, B, C, A, B, C, A, B, C trên cùng một server để nhiễu nền chia đều. A = ngay trước bước 2 (`bd13d2a4^`), B = sau bước 2 (main lúc đó), C = sau bước 3. Mỗi ô: A → B → C.

| Ca | Bản đồ | Thời gian (ms) | Request |
|---|---|---|---|
| vào game, tải lại trang (nóng) | Thánh Hồn Thôn | 3.106 → 2.578 → 2.359 | 1.040 → 1.018 → 888 |
| warp lần đầu | Nặc Đinh Thành | 3.784 → 3.156 → 3.301 | 972 → 939 → 793 |
| warp lần đầu | Tinh Đấu Ngoại vi | 4.681 → 2.685 → 2.053 | 966 → 933 → 799 |
| warp lần đầu | Thiên Đấu Thành | 4.457 → 3.892 → 3.240 | 982 → 949 → 803 |
| warp lần đầu | Lõi Tinh Đấu | 2.851 → 2.161 → 1.978 | 927 → 894 → 748 |
| warp lần sau (nóng) | Nặc Đinh Thành | 3.263 → 3.216 → 2.395 | 972 → 939 → 792 |
| warp lần sau (nóng) | Tinh Đấu Ngoại vi | 2.821 → 2.160 → 1.744 | 965 → 932 → 788 |
| warp lần sau (nóng) | Thiên Đấu Thành | 4.235 → 3.928 → 3.152 | 982 → 949 → 803 |
| warp lần sau (nóng) | Lõi Tinh Đấu | 2.502 → 2.427 → 1.521 | 925 → 892 → 746 |

- **Bước 2** (A → B): thời gian giảm ở 9 / 9 ca (−0,05…−2 s; Nặc Đinh Thành lần sau gần như không đổi), đúng chiều ước tính ban đầu (khoảng −1 s) khi máy không bận.
- **Bước 3** (B → C): thời gian giảm thêm ở 8 / 9 ca (−0,2…−0,9 s; ca Nặc Đinh Thành lần đầu +0,15 s nằm trong nhiễu); request mỗi lần vào bản đồ −130…−145 (1.018 → 888 ở vào game, 939 → 793 ở Nặc Đinh Thành). KB mạng lượt lạnh vào game: 12.959 → 6.002 (−7 MB); đổi sang bản đồ có loài chưa thấy thì tải thêm đúng loài đó (Tinh Đấu Ngoại vi lần đầu 2.169 → 2.827 KB, bù lại không tải 134 file của mọi bản đồ lúc vào game).
- Số ba lượt lẻ lẻ dao động ±30% (có lượt vọt gấp đôi ở cả hai bên), nên so trung vị và chiều chung, không so từng ô.

Kiểm tay (Chrome thật, `__scene`, bản dựng bước 3): ở Thánh Hồn Thôn sinh thêm hồn thú loài có sheet hoạt ảnh vẽ thật (Kim Linh Ưng, Phong Lang, Thái Thản Cự Viên, Huyền Băng Thiềm) và tinh anh Huyết Nhãn Phong Lang sau lúc vào (đường tải lười): cả 35 hồn thú đều dùng đúng sheet `beast_<loài>` hoặc `beast_<loài>_anim`, không con nào ẩn / rơi về hình vẽ code; warp sang Tinh Đấu Ngoại vi và Lạc Nhật Sâm Lâm (đường preload): 37 / 37 con dùng sheet thật; 0 lỗi console; nhãn tên (hotfix #829) hiện bình thường. Bot `waypoint` đạt 76 / 76.

## Bước 4: số trước / sau (trung vị 3 lượt xen kẽ B, C, B, C, B, C trên cùng server, tuần tự 1 Chrome)

B = main lúc đó (`132e97ff`, sau bước 3), C = sau bước 4. Mỗi ô: B → C.

| Ca | Bản đồ | Thời gian (ms) | Request |
|---|---|---|---|
| vào game, hồ sơ trống (lạnh) | Thánh Hồn Thôn | 12.684 → 5.853 | 894 → 364 |
| vào game, tải lại trang (nóng) | Thánh Hồn Thôn | 2.467 → 1.447 | 888 → 360 |
| warp lần đầu | Nặc Đinh Thành | 3.150 → 2.509 | 793 → 265 |
| warp lần đầu | Tinh Đấu Ngoại vi | 2.769 → 1.423 | 789 → 261 |
| warp lần đầu | Thiên Đấu Thành | 4.492 → 3.307 | 803 → 275 |
| warp lần đầu | Lõi Tinh Đấu | 2.191 → 2.370 | 748 → 220 |
| warp lần sau (nóng) | Nặc Đinh Thành | 2.983 → 2.164 | 792 → 264 |
| warp lần sau (nóng) | Tinh Đấu Ngoại vi | 1.839 → 1.280 | 788 → 262 |
| warp lần sau (nóng) | Thiên Đấu Thành | 3.029 → 2.537 | 803 → 275 |
| warp lần sau (nóng) | Lõi Tinh Đấu | 1.486 → 827 | 746 → 218 |

- Request mỗi lần vào bản đồ giảm **~530** (−65…−70%); KB mạng lượt lạnh vào game 6.129 → 3.377 (−2,7 MB). Thời gian giảm ở 9 / 10 ca (−0,5…−1,2 s ở warp, lượt lạnh −6,8 s); ca Lõi Tinh Đấu lần đầu +0,18 s nằm trong nhiễu (lượt riêng 1.321 / 2.370 / 4.249 ms).
- Ba lượt lẻ dao động ±40% (máy dùng chung), nên so trung vị và chiều chung. Lượt đo đầu của đợt này bị hỏng vì hai vòng đo chạy song song, đã bỏ và đo lại tuần tự.
- Kiểm: `skillvisual-test` đạt; `npm run check` xanh.
