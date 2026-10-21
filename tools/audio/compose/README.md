# Nhạc nền và khúc ngắn sáng tác bằng code (#134)

Toàn bộ nhạc của game viết bằng code, bản quyền của dự án (không cần ghi công trong game). Chuỗi xử lý:
bài trong `songs/*.mjs` → MIDI (`midi-writer-js`) → render âm thanh trong Node bằng SpessaSynth (`spessasynth_core`) với
soundfont GeneralUser GS → xử lý tổng (EQ, độ to, limiter) → `shared/assets/audio/music/<id>.ogg` (Vorbis ~96 kbps) và
`<id>.m4a` (AAC 96 kbps, dự phòng cho Safari như dây chuyền `tools/audio` của #133) + `manifest.json`.

## Có gì

| Loại | Bài |
|---|---|
| Nhạc nền bản đồ (`kind: "map"`, `maps` là mã trong `MAPS` của `shared/data.ts`) | một bài lặp liền mạch 1–2 phút cho mỗi bản đồ, sắc thái theo vùng |
| Giao chiến (`kind: "battle"`) | `giao_chien_boss`: phát thay nhạc bản đồ khi đánh boss thế giới / thú vương |
| Khúc ngắn (`kind: "jingle"`, chơi một lần, có `event`) | `level_up`, `ring_absorb` (hấp thụ hồn hoàn / đột phá), `arena_win`, `arena_lose`, `quest_accept`, `quest_complete` |

Danh mục ở `songs/index.mjs`. Mỗi file ghi ý đồ (thang âm, nhịp, nhạc cụ, khuôn đoạn) ở đầu.

## Chạy

Thư viện cài riêng trong thư mục này (không đụng `package.json` gốc):

```sh
cd tools/audio/compose
npm install
node compose.mjs --soundfont /đường/dẫn/GeneralUser-GS.sf2              # render lại cả bộ (~3 phút)
node compose.mjs --soundfont … --song hai_than_dao,jingle_thang          # chỉ vài bài, manifest giữ các bài còn lại
node compose.mjs --soundfont … --midi /thư/mục/ngoài/repo                 # thêm <id>.mid + <id>.json để xem lại
node validate.mjs                                                         # cũng chạy trong npm run check, không cần npm install
```

`validate.mjs` kiểm: mọi bài trong `songs/` đã render, file đúng số byte, mỗi file < 1,5 MB, không có file thừa,
mọi bản đồ trong `MAPS` có đúng một bài, có bài giao chiến, `event` của khúc ngắn không trùng. Thêm bản đồ mới thì phải
thêm bài (hoặc thêm mã bản đồ vào `maps` của một bài có sẵn) rồi render lại.

## Bộ tiếng (soundfont)

Không nằm trong repo, tải riêng: **GeneralUser GS** v2.0.3 của S. Christian Collins, <https://github.com/mrbumpy409/GeneralUser-GS>
(`GeneralUser-GS.sf2`, commit `684543d`, SHA-256 `9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe`).
Giấy phép (`documentation/LICENSE.txt`, License v2.0) cho dùng không hạn chế để làm nhạc, kể cả thương mại; âm thanh render ra
không phải ghi công. Bài chỉ dùng số nhạc cụ General MIDI nên FluidR3_GM (MIT) cũng chạy được (tiếng sẽ khác).

## Cách viết bài

- `lib/theory.mjs`: `bars()` đọc câu nhạc dạng `"A4:2 B4:1 D5:1 E5:3 D5:1 | …"` (độ dài theo `unit`, mặc định móc đơn;
  `-` nghỉ, `D4+A4` hợp âm, `>` / `<` nhấn / nhẹ) và báo lỗi nếu ô thiếu / thừa phách; `pattern()` rải hợp âm; `grid()` lưới
  trống (`X` nhấn, `x`, `o` nhẹ, `.` nghỉ); `chord()`, `shift()`, `rng()`.
- Kênh nhạc cụ (`lib/midi.mjs`): số nhạc cụ GM, âm lượng, pan, reverb, chorus; cộng các tùy chọn làm bớt tiếng "MIDI":
  `humanVel` / `humanTicks` (lệch lực / nhịp), `phrase` (lực nhô giữa câu), `groove` (nhấn phách mạnh), `expr` (phồng / lặng hơi
  đầu – cuối nốt bằng CC11), `vibrato` (rung CC1 ở nốt dài), `bend` (uốn từ dưới lên khi vào nốt, kiểu shakuhachi).
  Các lệch ngẫu nhiên tính một lần bằng hạt giống cố định nên chạy lại ra cùng bài và mọi vòng lặp giống hệt nhau.
- Xử lý tổng (`lib/render.mjs`): cắt hạ âm dưới 32 Hz, bớt đục 280 Hz, mở "không khí" 9 kHz; đưa độ to về -16 LUFS
  (đo xấp xỉ BS.1770); limiter nhìn trước 5 ms giữ đỉnh ≤ -1 dBFS.

## Vòng lặp liền mạch

Bài lặp được render 3 vòng liền, lấy vòng giữa (đầu vòng đã có đuôi vang / nốt ngân của vòng trước), rồi trộn 4096 mẫu đầu
(~93 ms) từ đầu vòng sau sang để chỗ nối liền đúng từng mẫu. EQ và limiter chạy trên cả bản render trước khi cắt, nên trạng thái
bộ lọc cũng liền qua chỗ nối. Độ dài vòng (`bars × beatsPerBar × 60 / bpm` giây) **phải là bội của 1024 mẫu ở 44,1 kHz**:
khi đó khung AAC khớp đúng nên m4a không thêm mẫu đệm cuối (hở chỗ nối), và sự kiện các vòng rơi cùng pha khối render 128 mẫu.
Với 32 ô 4/4 dùng bpm là số lẻ hoặc gấp đôi số lẻ chia hết `3³·5³·7²` (63, 70, 75, 90, 98, 105, 126, 135, 147…); 48 ô
cần bpm lẻ; `compose.mjs` báo lỗi nếu sai. Sau khi mã hóa, công cụ giải mã lại ogg và m4a để chắc số mẫu đúng bằng vòng.
Điểm lặp là toàn bộ file: phát từ 0 đến hết rồi quay lại 0.

## Giấy phép công cụ

`midi-writer-js` (MIT), `spessasynth_core` (Apache-2.0) và `ffmpeg-static` 5.3.0 (GPL-3.0-or-later, gọi như tiến trình riêng
lúc dựng, không vào client / server) chỉ dùng lúc tạo nhạc.
