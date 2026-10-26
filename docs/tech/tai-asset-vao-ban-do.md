# Tải asset khi vào / đổi bản đồ (#716)

Đây là **báo cáo đo + kế hoạch chia bước**, không phải luật chơi. Cách đo: `client/scripts/load-measure.mjs` (Chrome thật qua CDP, `--mute-audio`, cổng gỡ lỗi tự chọn, tắt đúng PID mình bật). Cần `npm run build` rồi server `GAME_TEST=1` không `DATABASE_URL` (MemoryStore), ví dụ `cd server && env -u DATABASE_URL GAME_TEST=1 PORT=3716 npx tsx src/index.ts` (chạy từ thư mục `server` để tsx đọc đúng tsconfig), sau đó:

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
5. **Giữ `Phaser.Game` khi đổi bản đồ** — **đã làm ở PR thứ năm** (`main.ts`: `leaveThen`, `dropSceneTextures`). Đổi bản đồ chỉ `stop` + `remove` scene `game` rồi thêm scene mới vào cùng Game (canvas ẩn trong lúc chờ vào phòng), không `destroy` nữa nên texture nạp từ file (hồn sư, pháp tướng, `fx_*`, ô nền / vật đứng đã ghé, UI) không phải tải XHR + giải mã lại. Những chỗ phải xử lý: (a) cache JSON / tilemap còn key thì loader bỏ file và sự kiện `filecomplete-json-*` không bắn, nên `preloadSprites` (manifest), `preloadIso` (tiles, kho riêng), `GameScene.preload` (tilemap) gỡ key khỏi cache trước khi tải lại (file nhỏ, HTTP cache); (b) texture vẽ bằng code (canvas: khối nung, nhà, thời tiết, LPC, fx dải...) và mọi hoạt ảnh (tham chiếu khung của chúng) bị bỏ lúc rời bản đồ như khi huỷ Game, để code dựng lại không gặp key cũ; (c) `ScaleManager` thuộc Game nên `GameScene` gỡ listener `resize` khi scene tắt. Đánh đổi: texture file của bản đồ đã ghé ở lại trong bộ nhớ (đo ~650 → ~930 key sau 8 lần đổi bản đồ, ô nền + vật đứng của 5 bản đồ); chưa có cơ chế đuổi, đáng xem nếu soak thấy RAM tăng. Ảnh hiển thị lúc ổn định không đổi.
6. **Gom atlas + giới hạn texture giữ qua bản đồ** — **đã làm ở PR thứ sáu**. (a) `tools/assets/iso-atlas.mjs` xếp ô nền + vật đứng công khai của từng bản đồ (đúng tập `preloadIso` xin, kể cả sân cung uyển; bỏ vật kho riêng) thành 1 trang 1024×~400 (+ trang `_n` normal map) ở `shared/assets/iso/atlas/<bản đồ>-<trang>.png` và `index.json` (khung `[trang, x, y, rộng, cao]`, băm nguồn); `iso-atlas.mjs --check` nằm trong `npm run check` (ảnh nguồn / `tiles.json` đổi mà chưa chạy lại thì báo lệch). Ảnh gốc vẫn ở chỗ cũ. `preloadIso` (`isoMap.ts`) tải `atlas/index.json`, ảnh có trong atlas thì tải trang rồi **cắt lại đúng hình chữ nhật** vào canvas cùng key `iso:<file>` / `prop_<vật>` (+ `_n`), ảnh ngoài atlas hay bản đồ không có mục thì tải từng file như trước; trang atlas gỡ ngay sau khi cắt. Texture cắt (không kèm `~màu`) sống qua đổi bản đồ như texture file (`isIsoSlice`, `main.ts`). `?noatlas` bỏ atlas để đo trước / sau. (b) `textureLru.ts`: mỗi lần vào bản đồ là một lượt; texture lười (hồn thú, phụ thể, pháp tướng, `fx_sk`) và ô / vật đứng được xin lượt nào thì ghi lượt đó (`touchTexture`), lúc rời bản đồ gỡ texture không được xin trong `KEEP_VISITS` (4) lượt gần nhất; xin lại thì tải lại từ cache HTTP. Của chính mình được xin mỗi lần vào nên không bị gỡ. Ảnh hiển thị lúc ổn định không đổi (so từng điểm ảnh, xem dưới).
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

## Bước 5: số trước / sau (trung vị 3 lượt xen kẽ B, C, B, C, B, C trên cùng server, tuần tự 1 Chrome)

B = main lúc đó (`93b04c10`, sau bước 4), C = sau bước 5. Mỗi ô: B → C.

| Ca | Bản đồ | Thời gian (ms) | Request |
|---|---|---|---|
| vào game, hồ sơ trống (lạnh) | Thánh Hồn Thôn | 4.978 → 4.264 | 360 → 359 |
| vào game, tải lại trang (nóng) | Thánh Hồn Thôn | 1.218 → 2.233 (lượt lẻ C: 1.182 / 5.237 / 2.233) | 361 → 362 |
| warp lần đầu | Nặc Đinh Thành | 3.519 → 3.156 | 263 → 91 |
| warp lần đầu | Tinh Đấu Ngoại vi | 1.233 → 804 | 261 → 92 |
| warp lần đầu | Thiên Đấu Thành | 2.435 → 2.289 | 275 → 98 |
| warp lần đầu | Lõi Tinh Đấu | 888 → 907 | 220 → 79 |
| warp lần sau (nóng) | Nặc Đinh Thành | 1.727 → 1.074 | 264 → 24 |
| warp lần sau (nóng) | Tinh Đấu Ngoại vi | 1.103 → 444 | 260 → 8 |
| warp lần sau (nóng) | Thiên Đấu Thành | 2.650 → 1.752 | 275 → 39 |
| warp lần sau (nóng) | Lõi Tinh Đấu | 835 → 168 | 218 → 7 |

- Đổi bản đồ: request mỗi lần vào giảm 170–260 ở lần đầu, 230–250 ở lần sau (còn 7–39); **thời gian lần sau giảm 0,6–1 s (−35…−80%)**, lần đầu −0,1…−0,4 s (Lõi Tinh Đấu +19 ms, trong nhiễu). Vào game (lần đầu mở phiên) không đổi vì chưa có gì để giữ; lượt "tải lại trang" nóng lệch do một lượt vọt 5,2 s ở bên C (hai lượt kia 1,2 / 2,2 s), không phải hiệu ứng của thay đổi (cùng một đường chạy với B).
- KB mạng không đổi (HTTP cache đã đúng từ #580): lợi hoàn toàn nằm ở XHR + giải mã + nạp texture trên luồng chính.
- Ba lượt lẻ dao động ±40% (máy dùng chung), nên so trung vị và chiều chung.

Kiểm bù cho bước 4 (`fx_sk` tải lười) và kiểm bước 5: `waypoint` đạt 76 / 76, `bigmap` đạt 176 / 176 (bot server; không có nhóm tên `travel`). Kiểm tay (Chrome thật, `--mute-audio`, bản dựng bước 5, `__scene`): vào Thánh Hồn Thôn rồi warp Nặc Đinh Thành → Tinh Đấu Ngoại vi → Thánh Hồn Thôn → Thiên Đấu Thành → Nặc Đinh Thành → Lõi Tinh Đấu → Thánh Hồn Thôn: luôn 1 scene, texture `pt_*` / `vh_*` của mình còn, 32 key `fx_sk_*` của võ hồn mình (xin lúc vào) còn sau mọi lần đổi, 0 lỗi console. Phát một dải `fx_sk_ld_zone1` qua `SkillVisualPlayer.cast` trước và sau một lần warp: trả true, sprite hiện (chiêu dùng sheet thật, không rơi về hiệu ứng vẽ bằng code). Bấm chiêu thật bằng tay không làm được vì tài khoản thử chưa có hồn hoàn (hồn kỹ vòng 1 cần hồn hoàn thứ 1).

## Bước 6: số trước / sau

### RAM client sau 20 lần warp (`load-measure.mjs --ram 20`, xoay vòng 9 bản đồ, 1 Chrome)

Mỗi dòng: số key texture / MB điểm ảnh ước tính (w×h×4, gồm normal map) / heap JS. Trước = main sau #872; sau = bước 6.

| Sau lần warp | Trước (key / MB / heap) | Sau (key / MB / heap) |
|---|---|---|
| 0 (vào Thánh Hồn Thôn) | 652 / 194 / 93 | 648 / 192 / 100 |
| 9 (đi hết 9 bản đồ) | 1.204 / 277 / 133 | 1.000 / 244 / 121 |
| 12 | 1.282 / 323 / 213 | 1.025 / 302 / 213 |
| 20 | 1.151 / 267 / 114 | 921 / 245 / 89 |

- Kết luận về rủi ro #872: tăng **có trần** (số key đi ngang ~1.150–1.280 từ lần warp thứ 9 sau khi đã ghé hết 9 bản đồ; heap JS dao động 77–213 MB, không tăng đều), vì tập asset hữu hạn; phần tăng chủ yếu là hồn thú đã thấy (`beast_*` 43 MB), không phải ô / vật đứng (`iso:` + `prop_` chỉ ~17 MB). LRU 4 lượt hạ trần xuống ~920–1.030 key và gỡ ~−35 MB (−12%) điểm ảnh; đỉnh vẫn nằm ở Thiên Đấu Thành (~300 MB, các khối nung + atlas ánh sáng + `lpc` + `vh` của mình, không phải texture file của bản đồ cũ).
- Nhóm texture lúc cuối (key / MB): `vh` 4 / 61, `lpc` 25 / 56, `isoAtlas` 1 / 32 (Light2D), `isoChunk` 91 / 28, `beast` 38 / 23 (trước LRU: 80 / 43), `fx` 84 / 21.

### Tải bản đồ (trung vị 3 lượt xen kẽ B, C, B, C, B, C, tuần tự 1 Chrome, độ trễ giả lập 60 ms mỗi request, `--latency 60`)

B = `?noatlas` (như main), C = có atlas. Mỗi ô: B → C (ms; request).

| Ca | Bản đồ | Thời gian (ms) | Request |
|---|---|---|---|
| vào game, hồ sơ trống (lạnh) | Thánh Hồn Thôn | 8.214 → 4.543 | 361 → 195 |
| vào game, tải lại trang (nóng) | Thánh Hồn Thôn | 1.520 → 1.936 (lượt lẻ B 3.492 / 1.520 / 1.430) | 362 → 199 |
| warp lần đầu | Nặc Đinh Thành | 2.387 → 1.857 | 90 → 38 |
| warp lần đầu | Tinh Đấu Ngoại vi | 1.973 → 1.145 | 93 → 35 |
| warp lần đầu | Thiên Đấu Thành | 2.887 → 2.876 | 99 → 49 |
| warp lần đầu | Lõi Tinh Đấu | 1.513 → 877 | 80 → 12 |
| warp lần sau (nóng) | Nặc Đinh Thành | 1.324 → 1.207 | 26 → 26 |
| warp lần sau (nóng) | Tinh Đấu Ngoại vi | 716 → 689 | 8 → 8 |
| warp lần sau (nóng) | Thiên Đấu Thành | 1.957 → 1.861 | 39 → 39 |
| warp lần sau (nóng) | Lõi Tinh Đấu | 322 → 385 | 7 → 7 |

- Warp lần đầu: request −42…−68 (−52…−85%), thời gian −0,5…−0,9 s ở 3 / 4 bản đồ (Thiên Đấu Thành nhiều file khác nên hòa). Lượt lạnh −3,7 s, request −166. Lần sau không đổi (không có gì để tải, nằm trong nhiễu).
- **Không có độ trễ mạng (localhost)** lợi về thời gian không đo được (trung vị 3 lượt: lần đầu 1.775 → 1.683, 946 → 836, 2.117 → 2.448, 481 → 647 ms; trong nhiễu ±30%): lợi của atlas là giảm số round-trip, chỉ thấy khi mạng có độ trễ. KB mạng lần đầu tăng nhẹ (+~0,15 MB / bản đồ, vì tải trọn trang atlas cả ảnh chưa cần ngay, kèm normal map): 1.778 → 1.944, 2.827 → 2.975 KB.
- Ba lượt lẻ dao động ±40% (máy dùng chung), nên so trung vị và chiều chung.

### Kiểm

- `--verify-atlas` (so từng điểm ảnh, ngưỡng ±1 mỗi kênh): 3.192 lượt so texture `iso:*` / `prop_*` (cả `_n`) qua 9 bản đồ sau các lần warp: **lệch 0**.
- Bot `waypoint` 76 / 76, `bigmap` 176 / 176 (không có nhóm tên `travel`). `npm run check` xanh.
- Kiểm tay (Chrome thật `--mute-audio`, `__scene`): vào Thánh Hồn Thôn, warp qua 9 bản đồ nhiều vòng (20 lần warp trong lượt `--ram`, 9 lần trong `--verify-atlas`), ảnh chụp Lõi Tinh Đấu bình thường, **0 lỗi console**.
- Cách chạy: `node client/scripts/load-measure.mjs --ram 20 --maps a,b,c` (RAM), `--latency 60` (độ trễ), `--verify-atlas` (so điểm ảnh), `QS="&noatlas"` (bỏ atlas).
