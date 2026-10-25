# Công thức chuẩn làm hiệu ứng chiêu (chủ repo duyệt 2026-10-25)

Chuẩn đã dùng cho 25 võ hồn (thử ở Lam Điện Bá Vương Long và Hạo Thiên Chùy rồi theo lô). Đặc tả hình, màu, ý chiêu từng chiêu ở `docs/art/ky-nang/README.md` (S0); khung code ở `GAME_DESIGN.md` mục 5.11 (S1). Ở đây ghi cách làm, tham số, lượt thực tế và bẫy. Chỉ hình ảnh + cảm giác đánh: giữ nguyên số và cơ chế, **không rung màn hình** (chỉ boss).

## 1. Quy trình một võ hồn (11 chiêu)

| Bước | Lệnh | Ra |
|---|---|---|
| 1. Khai báo sheet | thêm vào `tools/assets/skill-vfx/pilot.json` (đổi tên file nếu làm lô khác): mục `vohon` (`palette` 5 màu `[viền, tối, chủ, nhấn, sáng]` lấy từ bảng màu võ hồn ở `ky-nang/README.md` mục 3, `theme` một câu) và `sheets` (`n` tên, `v` võ hồn, `t` tầng, `f` số khung, `d` mô tả hiệu ứng) | |
| 2. Sinh sheet thô | `node tools/assets/skill-vfx/run.mjs --out <nháp ngoài repo> [--only a,b]` (3 lệnh song song, bỏ qua sheet đã có) | `<tên>.png` (lưới) + `.json` (khung) + `.gif` + `.meta.json` |
| 3. Xem | `node tools/assets/vfx-view.mjs --out <ảnh.png> --zoom 3 <sheet.png:khung> ...` | ảnh xem trên nền tối và nền cỏ |
| 4. Hậu kỳ | `node tools/assets/skill-vfx/post.mjs --raw <nháp> [--only a,b]` | `shared/assets/sprites/iso/fx/sk_<tên>.png` + `sk_<tên>_g.png` |
| 5. Đăng ký | `node tools/assets/skill-vfx/reg.mjs [--only a,b]` | manifest `fx_sk_<tên>`, `fx_sk_<tên>_g`, `art/CREDITS.md` |
| 6. Điền bảng | mục `"<mã võ hồn>:<vòng 0..9 \| ct \| tc>"` ở `SKILL_VISUAL` (`client/src/skillVisual.ts`, mục 3 dưới đây) | |
| 7. Kiểm | `npm run check`, `npm run test:skillvisual --prefix client`, xem trước (mục 5) | |

Ảnh thô (lưới, gif, meta) để ở thư mục nháp (artifacts), **không đưa vào repo**; repo chỉ giữ sheet đã hậu kỳ, `pilot.json` (prompt) và công cụ. Key PixelLab đọc từ file lúc chạy (`PIXELLAB_KEY_FILE`, mặc định `~/.config/pixellab/api-key.txt`), không in, không ghi vào repo, log hay PR.

## 2. PixelLab: endpoint, prompt, lượt

- **Endpoint:** `POST /v2/vfx`, `artist: "lite"` (công cụ `tools/assets/pixellab-vfx.mjs`: gửi, hỏi `GET /v2/background-jobs/<id>` mỗi 6 giây, tải `.png` / `.json` / `.gif`, in số dư trước / sau). Trả luôn sheet nhiều khung (lưới 3 cột), không cần ảnh đầu vào, không cần xoay hay hoạt ảnh riêng như pháp tướng. Mỗi lệnh 60–170 giây.
- **Giá:** `lite` **1 lượt** cho mỗi hiệu ứng mới, **với điều kiện mô tả dưới 700 ký tự** (từ 700 ký tự giá gấp đôi; từ 1.000 gấp 1,5 lần ở `pro`). `run.mjs` cảnh báo khi vượt 690. Số dư `/v2/balance` cập nhật trễ và dùng chung nhiều worker: cộng theo `quoted_generations` của lệnh mình gọi, không theo chênh số dư.
- **Dạng prompt** (`run.mjs`): `common` (pixel art VFX, góc nhìn 3/4 từ trên xuống, nền trong suốt, không nhân vật / chữ, viền tối, bảng màu hạn chế, lõi trắng sáng, một hiệu ứng ở giữa) + `theme` của võ hồn (hệ, vật chính, các màu `#hex`) + `d` của chiêu + "N frames, wind-up, peak, fade, no loop" + cỡ khung gợi ý (T1 ~64, T2 ~96, T3 ~160). `d` bám cột "Động tác và khung chính" của S0: vòng tròn 6 tia, cột sét ngắn, vệt ba vạch, 'đùng' sóng chấn... ; chiêu cùng kiểu trong một võ hồn phải khác nhau rõ (chiêu sau lớn hơn, thêm lớp phụ). Cỡ thật PixelLab chọn: 64 / 96 / 160 (hơi lệch: một sheet 58×59, hậu kỳ đệm cho vuông).
- **Số khung:** T1 6 (vệt chém 8), T2 8, T3 12; fps ghi ở bảng (T1 10–16, T2 10–12, T3 9) để T1 ≈ 0,5 giây, T2 ≈ 0,7–0,8, T3 ≈ 1,3.
- **Lượt thực tế S2:** 22 sheet + 6 lượt thử khung / prompt dài + 3 làm lại ≈ **28 lượt** cho 2 võ hồn. Ước tính S3: 23 võ hồn × 11 ≈ 253 sheet ≈ **300 lượt** (kể cả làm lại 10–15%).
- **Phải làm lại khi:** hình chữ T3 là đĩa trắng đặc ở khung đầu (thêm "no filled white disc", nêu rõ màu: đá xám, trắng chỉ cho chớp), cột sét giống con sâu (thêm "thin jagged forked bolt"), hiệu ứng nhỏ yếu so với cỡ khung. Một sheet làm lại tối đa 1–2 lần.

## 3. Hậu kỳ (`post.mjs`) và quy cách sheet

- **Nhị phân alpha** (ngưỡng 90), **nhuộm lại theo thang 7 mức độ sáng** bằng bảng màu võ hồn: viền `#1a1020` < 0,20 · tối < 0,36 · trung bình tối-chủ < 0,50 · chủ < 0,66 · trung bình chủ-nhấn < 0,80 · nhấn < 0,92 · sáng. Mọi sheet chỉ còn 7 màu (trần validate 32), cùng bảng màu cả võ hồn, không lòe loẹt, đọc rõ trên cỏ sáng, hang tối, tuyết, ban đêm.
- **Cắt khung rỗng** ở hai đầu (validate cấm khung rỗng), đệm 4 điểm mỗi phía, khung vuông; dải **một hàng** (`fx_*`).
- **Lớp cộng sáng tách riêng** `sk_<tên>_g.png`: viền đặc 2 điểm màu chủ quanh phần sáng nhất (độ sáng ≥ 0,7); khung nào không có điểm sáng thì giữ một điểm ở góc (validate cấm khung rỗng). Code vẽ nó bằng cộng sáng, độ đục theo mức: Thấp không vẽ, Vừa 0,3, Cao 0,5; không vẽ cho chiêu của người khác và ở chế độ Giảm chuyển động (`GLOW_ALPHA`).
- **Thân sheet vẽ thường** (`normal: true`, mặc định của `sk()`), không cộng sáng: màu và viền giữ đúng trên nền sáng (cộng sáng làm sét ngả trắng trên nền cam). Chỉ lớp `_g` cộng sáng.
- Key: `fx_sk_<tên>` (regex key `fx_` cho phép chữ số), tên = `<viết tắt võ hồn>_<kiểu><vòng>` (ví dụ `ld_zone1`, `ht_slash6`, `ld_t3a`, `ht_zone_tc`). Sheet nhẹ (~5–15 KB mỗi cái, 22 sheet + lớp sáng = 236 KB).

## 4. Điền `SKILL_VISUAL` (mẫu ở `skillVisual.ts`)

Khóa `"<mã>:<vòng 0..9>"` (vòng 1–6, 8, 9, 10 → 0–5, 7, 8, 9; vòng 7 không có hồn kỹ thường), `:ct` Chân Thân, `:tc` tiên cơ. Mỗi mục: `tier`, `heavy`, `replace: true`, `sheet: sk("<tên>", {...})`, thêm `...wind(màu)` cho T2 và `...wind(màu, true)` cho T3.

| Thuộc tính | Dùng khi |
|---|---|
| `at: "cast"` + `fit: 1` + `lift: GROUND` | chiêu **vùng quanh thân**: bề ngang = 2 × bán kính chiêu (`sk.r * RX`), tâm kéo xuống mặt đất |
| `at: "target"` + `scale: 2` (+ `lift`) | đòn **trúng đích** (cột sét, 'đùng'): cỡ nguyên cố định |
| `at: "target"` + `fit: 0.9` | **vệt chém** (đặt ở nửa trước mặt) |
| `repeat: true` | chiêu trúng nhiều lần / nhiều đợt: phát lại theo `n`, `every` của chiêu (tối đa 1 / 4 / 6 lần theo mức Thấp / Vừa / Cao; người khác tối đa 2) |
| `heavy` | T1 0 (nặng: 1), T2 1 (nặng: 2), T3 2 (nặng: 3); chùy / đòn nặng cộng 1 |
| `...wind(màu)` | T2: lấy đà 150 ms (`fxs_tu_khi`, chỉ người tung thấy); T3 `true`: báo trước 400 ms, cỡ lớn |
| T3 | thêm sheet 12 khung (báo trước → bùng → dư chấn nằm trong sheet), `pt.strike` gọi sẵn khi có sheet, cut-in tên chiêu có sẵn |

`replace: true` làm sheet thay sprite + quầng của G3, G3 chỉ còn **hạt theo hệ** (`partsOnly`). Chưa có sheet thì chiêu chạy hiệu ứng G3 cũ (không đổi gì). Cảm giác đánh (khựng, giật lùi, tia lửa theo chất liệu, số theo hệ) tự theo `heavy`, không cần khai báo thêm.

## 5. Trần sheet đồng thời và hiệu năng

`SHEET_CAP` (`fxSheet.ts`): Thấp 3, Vừa 10, Cao 24 sheet cùng lúc; quá trần thì sheet mới bị bỏ (hiệu ứng G3 vẫn chạy); pool `Image` dựng sẵn không phình (đã đo `pooled` ≤ trần). Đo ở trang thử (`stress=P`, Chrome GPU thật, 40 và 100 người tung cả 22 chiêu ngẫu nhiên, mức Thấp / Vừa / Cao, Giảm chuyển động): fps không tụt (~110, bằng nhịp màn hình). Mức Thấp chỉ một sheet chính, không lớp sáng / lấy đà / dư chấn; người khác thấy bản nhẹ (nhỏ 0,7×, mờ 0,75×).

## 6. Xem trước và duyệt (công cụ ở `tools/assets/skill-vfx/preview/`)

Mỗi lô gửi chủ repo một **trang xem trước** (HTML tĩnh, đường dẫn tương đối, để ở artifacts): mỗi chiêu một hàng gồm sheet động, GIF trước / sau ở trang thử, GIF trước / sau trong game thật, và bảng FPS.
1. `node tools/assets/skill-vfx/preview/jobs.mjs --vohon <mã,...> --short <viết tắt,...> --kind fx > jobs-fx.json` (và `--kind real`).
2. Trang thử: `?thu=fx&skill=<mã>:<khóa>&sv=0|1&wait=700&bar=0&zoom=1` (`sv=0` là bản trước, `lv=low|mid|high`, `reduce=1`, `stress=P`, `others=1` cho bản người khác). Chạy vite cổng riêng (`node client/node_modules/vite/bin/vite.js --port <cổng> --strictPort`), rồi `node tools/assets/skill-vfx/preview/cap.mjs --base http://127.0.0.1:<cổng> --out <khung> --jobs jobs-fx.json --dur 2500` (Chrome headless `--mute-audio`, GPU thật, cổng debug ngẫu nhiên, screencast; khung có mốc `t` ms kể từ lúc phát chiêu).
3. Game thật: build client, `PORT=<cổng> TAGS="sau truoc" GOTO=700,1300 OUT=<thư mục> bash tools/assets/skill-vfx/preview/run-real.sh jobs-real.json` (server `GAME_TEST=1`, MemoryStore, cổng riêng, tắt đúng PID). `?sv=0` là bản trước. Hook `grant` / `set` cho võ hồn, hook `beast` cho mục tiêu; **chỗ đứng phải ngoài trại** (trong trại không giao chiến); chiêu "trúng đích" cần quái trong tầm (Hạo Thiên tầm ngắn: đặt `dx 40, dy 20`). **Tiên cơ không kích được bằng hook test** (kiểm ở trang thử).
4. GIF: `node tools/assets/skill-vfx/preview/gif.mjs --frames <khung> --out <gif> --names a,b --from -150 --to 1900 --fps 15 --crop 240,110,480,300` (tự mã hóa GIF, không thư viện); ghép ảnh duyệt nhanh bằng `montage.mjs`. FPS: `fps.mjs`. Xóa thư mục khung sau khi làm GIF (hàng GB).
5. Chạy Chrome luôn `--mute-audio` (chủ repo chơi game trên cùng máy); chỉ tắt đúng PID mình bật.

## 6b. Lô A (S3 #566): các kiểu chiêu mới

- **Đạn** (`area: proj`): sheet `at: "travel"` vẽ hướng sang phải, `rotate: true` xoay ảnh theo hướng bay (không lật), `repeat: true` + `CastCtx.spread` xòe quạt (hoặc vòng khi `spread` ≥ 360°) theo `n`, tối đa 1 / 4 / 6 viên theo mức, người khác 2.
- **Hào quang** (`area: self`, hệ Phụ trợ: Xúc Xích, Thiên Càn, Cửu Bảo): `at: "cast"`, `scale: 2` (T3 `lift: GROUND`); khác chiêu trong cùng võ hồn bằng hình (mũi tên lực, vệt tốc, vòng hồn, khiên lục giác...).
- **Lướt chém** (`area: dash`): phát ở điểm trúng như vệt chém (`fit: 0.9` ở T2).
- **Dung hợp**: `FUSION_VISUAL[tên chiêu]` ở `skillVisual.ts`, gọi trong `fusionFx` (GameScene); trang thử `?thu=fx&skill=fusion:<tên>`.
- Bảng màu xếp **tăng dần theo độ sáng** `[viền, tối, chủ, nhấn, sáng]`: võ hồn có màu nhấn tối hơn màu chủ (Cửu Tinh) thì hoán hai ô; nhấn đỏ (Nguyệt Nhận) đặt ở ô giữa, bạc ở ô nhấn; màu sáng đỏ (Phá Hồn Thương) bỏ, giữ trắng.
- **Lượt thực tế lô A:** 78 sheet + 8 làm lại (đòn quá nhỏ: Phá Hồn Thương ×4, đạn Cửu Tinh / Xúc Xích; khối trắng đặc: Kiếm Trảm Sơn Hà; dung hợp thiếu lưỡi trăng) ≈ **86 lượt** cho 7 võ hồn + 1 dung hợp. Đòn thương một vạch vẫn mảnh: yêu cầu "nét to, đậm, phủ gần hết khung" trong mô tả giúp đạn, ít giúp vệt đâm.
- `--spec <tên>.json` cho `run.mjs` / `post.mjs` / `reg.mjs` (mặc định `pilot.json`); `run-real.sh` luôn bỏ `DATABASE_URL`.

## 6c. Lô C (S3 #568): lửa, băng, ảnh

- **Lượt thực tế lô C:** 56 sheet + 2 làm lại (bàn tay Hỏa Ảnh T3 thành khối chữ nhật; dung hợp ngả nâu tím) + 4 lượt làm lại T3 Hỏa Ảnh sau duyệt (mô tả dài, tính gấp đôi) ≈ **62 lượt** cho 5 võ hồn + 1 dung hợp. Giữ `d` + `theme` + câu cố định dưới 700 ký tự (chủ đề dài hơn 300 ký tự thì rút `d` còn ~250).
- **Bảng màu theo vật chất:** màu chủ đỏ hồng (`#ff3a4a`) nhuộm lửa thành "đất sét hồng"; lửa thật cần thang vàng → cam → đỏ thẫm. T3 Hỏa Ảnh dùng bảng `hs` riêng `[viền, #701822, #e8431e, #ff9a2a, #ffe08a]` và `glowMul: 1.6` (lớp sáng mạnh ở lõi). Dung hợp hai màu (`bh`): tối đỏ sẫm, chủ đỏ cam, nhấn xanh băng, sáng trắng, để nửa lửa không pha thành nâu tím.
- **Hậu kỳ:** `post.mjs` hạ ngưỡng điểm sáng từ 0,7 xuống 0,55 khi lớp `_g` gần rỗng (sheet tối), để vẫn có lớp sáng.
- **Kiểu mới:** Quỷ Mị (phụ trợ) dùng hào quang `at: "cast"` như Xúc Xích; Băng Phượng / Tà Hỏa dùng đạn `travel` + `rotate`, lướt chém `target` như Nguyệt Nhận.
- **Trang xem trước:** vite phải chạy `--host 127.0.0.1` (mặc định chỉ nghe IPv6 `localhost`, `cap.mjs` quay 0 khung).

## 7. Bẫy đã gặp

- Mô tả từ 700 ký tự bị tính gấp đôi (6 lượt thử đầu tốn gấp đôi).
- Sheet thô là lưới nhiều hàng; thứ tự khung theo `.json`. Canvas có thể không vuông (hậu kỳ đệm).
- Cộng sáng làm sét / vệt ngả trắng trên nền cam sáng (Lạc Nhật Sâm Lâm): vẽ thân bằng `normal`, chỉ lớp `_g` cộng sáng.
- Chiêu T3 lấy ngoại lệ: sheet 12 khung phát ngay khi tin `fx` tới (khớp số sát thương); "báo trước" nằm trong sheet và lớp tụ khí, không trì hoãn đòn.
- Hook test `energy` + `switch` không tung tiên cơ trong game thật; Chrome khóa thư mục profile trên Windows (đổi tên profile mỗi lượt, `rm` bọc `try`).
- Trong trại (`inSafe`) chiêu không tung; vùng cần đứng ngoài trại.
- Shell của agent có thể mang sẵn `DATABASE_URL` thật: `run-real.sh` phải bỏ nó (đã làm), nếu không server `GAME_TEST` ghi tài khoản test vào DB thật. Đọc dòng đầu log server (phải là RAM presence, không có "Đã kết nối PostgreSQL").
- Quay game thật: chờ tin riêng `owned` về (thăm tối đa 10 giây) thay vì ngủ cố định 900 ms.

## Issue liên quan
#541 (S0, đặc tả), #548 (S2, công thức), #482.
