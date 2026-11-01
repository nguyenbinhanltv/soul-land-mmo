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
| Lớp giao chiến (`kind: "stem"`, `of` = id bài nền) | `<bản đồ>_chien` (mono, 40 kbps) chồng đồng bộ lên bài nền khi đang đánh nhau; `giao_chien_boss_nang` (`phase: 2`) chồng lên bài giao chiến boss khi boss nổi giận. Sinh tự động từ gốc hợp âm của bài nền ở `songs/stems.mjs` (cùng bpm / số ô nên cùng độ dài vòng) |
| Khúc ngắn (`kind: "jingle"`, chơi một lần, có `event`) | `level_up`, `ring_absorb` (hấp thụ hồn hoàn / đột phá), `arena_win`, `arena_lose`, `quest_accept`, `quest_complete`, `crit_big` (stinger chí mạng lớn), `boss_down` (stinger hạ boss) |

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

`validate.mjs` kiểm (thêm G5): mỗi lớp giao chiến chồng lên một bài nền / giao chiến có cùng độ dài vòng, bài giao chiến boss có lớp pha 2, đủ khúc ngắn cho mọi sự kiện; mọi bài trong `songs/` đã render, file đúng số byte, mỗi file < 1,5 MB, không có file thừa,
mọi bản đồ trong `MAPS` có đúng một bài, có bài giao chiến, `event` của khúc ngắn không trùng. Thêm bản đồ mới thì phải
thêm bài (hoặc thêm mã bản đồ vào `maps` của một bài có sẵn) rồi render lại.

## Bộ tiếng (soundfont)

### Ứng viên Luyện Hồn Cảnh (#1553)

`candidates/luyen_hon_canh.mjs` là một bài riêng đang chờ chủ repo nghe A/B, chưa nằm trong `songs/index.mjs`.
Render bằng `node compose.mjs --candidate --soundfont <GeneralUser-GS.sf2> --extra-soundfont <DSK-Asian-DreamZ.SF2> --out <thư-mục-nghe-thử>`.
Chế độ này chỉ render ứng viên và từ chối đầu ra trong `shared/assets`; không thay manifest đang chạy.
File nghe thử được giữ ở `art/src/audio/luyen_hon_canh/`; nguồn và SHA256 ở `NGUON.md` cùng thư mục.
Sau khi chủ repo duyệt, việc gán bài chỉ được chuyển `luyen_hon_canh`; Đại Đấu Hồn Trường giữ bài hiện tại.
Đây là bước nghe thử, không thêm lớp giao chiến hay thay bộ phát, gió, mute, slider, cache hoặc mờ chéo.

Không nằm trong repo, tải riêng: **GeneralUser GS** v2.0.3 của S. Christian Collins, <https://github.com/mrbumpy409/GeneralUser-GS>
(`GeneralUser-GS.sf2`, commit `684543d`, SHA-256 `9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe`).
Giấy phép (`documentation/LICENSE.txt`, License v2.0) cho dùng không hạn chế để làm nhạc, kể cả thương mại; âm thanh render ra
không phải ghi công. Bài chỉ dùng số nhạc cụ General MIDI nên FluidR3_GM (MIT) cũng chạy được (tiếng sẽ khác).

## Nhạc cụ Trung Hoa (bộ tiếng phụ) và bài ngũ cung

Bài thuộc phong cách tu tiên / kiếm hiệp nhẹ nhàng dùng thêm **DSK Asian DreamZ** (soundfont của DSK Music, `DSK Asian DreamZ.SF2`, SHA-256 gói zip
`f0b8a7943e8d7368b0c5ec492d1803088a6ce2210ec1528ec7b1301c4fa1a9d2`, tải ở `rekkerd.org/samples/DSK_Asian_DreamZ_sf2.zip`; trang DSK Music ghi
"100% free for private and commercial use", không bắt ghi công): tỳ bà, tỳ bà rung, cổ tranh, nhị hồ, sáo trúc (ban-di), bộ gõ Trung Hoa. Truyền bằng
`--extra-soundfont <file>` (xếp ở bank 1; kênh bài chọn bằng `bank: 1`, kênh không có `bank` vẫn lấy GeneralUser GS). Tiêu lấy shakuhachi, chuông lấy
tubular bells, nền lấy warm pad của GeneralUser GS.

`lib/ngucung.mjs`: thang ngũ cung (cung, thương, giốc, chủy, vũ), giai điệu viết theo bậc 1–5 (`melody`), khuôn bài 4 đoạn 8 ô (`buildSong`: sáo / tiêu dẫn, nhị hồ bè,
tranh rải và lướt, cổ cầm trầm, nền ngân, chuông, mõ) và lớp giao chiến cùng điệu (`chienStem`: tỳ bà gảy nhanh, trống nhỏ, nhị hồ kéo căng).
Bài ghi `ngucung: { tonic, mode, roots }` để `songs/stems.mjs` dựng `_chien` từ gốc theo ô. Với 63 / 70 / 75 BPM và 32 ô, vòng vẫn là bội của 1024 mẫu.

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
