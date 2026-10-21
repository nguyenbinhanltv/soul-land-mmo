# Sáng tác nhạc nền bằng code (#134, phần 1: bản mẫu)

Nhạc nền ngũ cung viết bằng code, bản quyền của dự án. Chuỗi xử lý:
bài trong `songs/*.mjs` → MIDI (`midi-writer-js`) → render âm thanh trong Node bằng SpessaSynth (`spessasynth_core`)
với một bộ tiếng SoundFont → wav → ogg Vorbis (`ffmpeg-static`).

Đây mới là bản mẫu để chủ repo nghe duyệt, **chưa đưa vào game** (bước 2 của #134 sẽ dùng dây chuyền `tools/audio` của #133).

## Chạy

Thư viện cài riêng trong thư mục này (không đụng `package.json` gốc):

```sh
cd tools/audio/compose
npm install
node compose.mjs --soundfont /đường/dẫn/GeneralUser-GS.sf2 --out /thư/mục/ngoài/repo
# tùy chọn: --song thanh-hon-thon | tinh-dau-sam-lam, --bitrate 96k, --keep-wav
```

Mỗi bài ghi ra `<id>.mid` (một vòng), `<id>.ogg` (một vòng lặp liền mạch) và `<id>.json` (độ dài, số mẫu, mức âm, nhạc cụ).
Không commit soundfont, wav, ogg hay `node_modules`; kết quả để ngoài repo.

## Bộ tiếng (soundfont)

Không nằm trong repo, tải riêng:

- **GeneralUser GS** v2.0.3 của S. Christian Collins (bản đang dùng): <https://github.com/mrbumpy409/GeneralUser-GS>
  (`GeneralUser-GS.sf2`, commit `684543d`). Giấy phép cho dùng không hạn chế để làm nhạc, kể cả thương mại;
  âm thanh render ra là của mình, không phải ghi công.
- **FluidR3_GM** (MIT) cũng chạy được, vì mọi bài chỉ dùng số nhạc cụ General MIDI.

## Cách viết bài

- `lib/theory.mjs`: `bars()` đọc câu nhạc dạng `"A4:2 B4:1 D5:1 E5:3 D5:1 | …"` (độ dài theo móc đơn, `-` là nghỉ,
  `D4+A4` hợp âm, `>` / `<` nhấn / nhẹ) và báo lỗi nếu ô nhịp thiếu / thừa phách; `pattern()` rải hợp âm; `rng()` ngẫu nhiên có hạt giống.
- `songs/<id>.mjs`: bài gồm `bpm`, `bars`, danh sách kênh (số nhạc cụ GM, âm lượng, pan, reverb) và nốt (`t`, `d` tính bằng phách).
  Lệch lực / nhịp nhẹ cho tự nhiên được tính một lần nên các vòng lặp giống hệt nhau.
- Nhạc cụ GM dùng: 75 sáo Pan, 77 shakuhachi, 106 shamisen, 107 koto, 116 taiko, 49 dây (đệm nhỏ), kênh 10 mõ gỗ / lắc / tam giác.

## Vòng lặp liền mạch

`lib/render.mjs` render bài lặp 3 lần rồi lấy vòng giữa: đầu vòng đã có đuôi vang và nốt ngân của vòng trước.
Hiệu ứng chạy theo thời gian (chorus, LFO) làm các vòng lệch pha chút ít, nên 4096 mẫu đầu (~93 ms) được trộn dần
từ đầu vòng sau (nối liền đúng từng mẫu với cuối vòng) sang đầu vòng giữa. Độ dài vòng (`bars × 4 × 60 / bpm`)
chọn sao cho số mẫu ở 44,1 kHz là bội của 128 (khối render của SpessaSynth), để sự kiện các vòng rơi cùng pha.
Mức âm chỉnh bằng một hệ số cố định (RMS ~ -20 dBFS, đỉnh ≤ -1 dBFS), không nén động, để chỗ nối không đổi.
Điểm lặp là toàn bộ file: phát từ 0 đến hết rồi quay lại 0.

## Giấy phép công cụ

`midi-writer-js` (MIT), `spessasynth_core` (Apache-2.0) và `ffmpeg-static` 5.3.0 (GPL-3.0-or-later, gọi như tiến trình
riêng lúc dựng, không vào client / server) chỉ dùng lúc tạo nhạc.
