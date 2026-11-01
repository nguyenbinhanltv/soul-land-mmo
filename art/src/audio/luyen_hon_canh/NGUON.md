# Luyện Hồn Cảnh — Tĩnh tâm luyện hồn

Closes #1553. Chủ repo đã nghe/xem A/B và duyệt bản này qua phiên điều phối soul_land_game-815; nhập nguyên byte vào runtime, chỉ gán cho Luyện Hồn Cảnh. RAW OGG/M4A và manifest nghe thử trong thư mục này được giữ nguyên.

Sáng tác riêng bằng code: La điệu Vũ (A C D E G), 75 BPM, 32 ô 4/4, 102,4 giây. Tiêu đối đáp cổ tranh, gảy trầm thưa; không trống, chuông, lớp giao chiến. Bản quyền nhạc thuộc dự án; không AI sinh âm thanh.

## Nguồn bộ tiếng

- GeneralUser GS v2.0.3, S. Christian Collins: https://github.com/mrbumpy409/GeneralUser-GS/tree/684543d ; GeneralUser GS License v2.0 cho phép làm nhạc thương mại không hạn chế, không bắt ghi công. SF2 SHA256: 9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe.
- DSK Asian DreamZ, DSK Music: https://www.dskmusic.com/dsk-asian-dreamz/ ; miễn phí dùng riêng và thương mại (không phải CC0). Tải https://rekkerd.org/samples/DSK_Asian_DreamZ_sf2.zip ; ZIP SHA256 f0b8a7943e8d7368b0c5ec492d1803088a6ce2210ec1528ec7b1301c4fa1a9d2. SF2 SHA256: e61d0f590db00434fa1a904ab210fdf4439fef13617d89d33eacc8edfc403e5e.

Hai bộ tiếng đã đối chiếu hash tải về với hồ sơ được repo duyệt. Không phân phối soundfont trong repo. Nguồn chung ở art/CREDITS.md; credits sinh bằng node tools/assets/credits.mjs.

## SHA256 bản nghe thử

| File | SHA256 |
|---|---|
| luyen_hon_canh.ogg | 0adff81cad196ffcd73dfab36deac932046d70720a6653acb817ed30323281b9 |
| luyen_hon_canh.m4a | ca84ee3d69e15bde2c4a4bcc5d5cbd008648514639ddd1cf7c39642ad7cf2872 |

## Đo giải mã, không phát âm thật

FFmpeg ebur128=peak=true (EBU R128 có cổng; khác phép xấp xỉ không cổng trong master). Mục tiêu master -21 LUFS.

| Bài | LUFS-I | True peak dBFS | Mẫu/kênh 44,1 kHz | Bước nối FS | Bước lớn nhất trong bài FS |
|---|---:|---:|---:|---:|---:|
| luyen_hon_canh.ogg | -19 | -1 | 4515840 | 1.975e-6 | 1.478e-1 |
| luyen_hon_canh.m4a | -19 | -1 | 4515840 | 5.200e-7 | 1.341e-1 |
| dai_dau_hon_truong.ogg | -15.8 | -1.1 | 3225600 | 1.522e-2 | 4.165e-1 |
| dai_dau_hon_truong.m4a | -15.8 | -0.8 | 3225600 | 6.691e-2 | 4.210e-1 |
| thanh_hon_thon.ogg | -15.7 | -2 | 4515840 | 1.256e-2 | 3.635e-1 |
| thanh_hon_thon.m4a | -15.8 | -2 | 4515840 | 2.476e-2 | 3.626e-1 |

Hai định dạng ứng viên không clip, true peak không vượt -1 dBFS, số mẫu đúng 4.515.840 (bội 1024). Render ba vòng lấy vòng giữa với crossfade 4096 mẫu bằng công cụ hiện có; đo bước nối nhỏ hơn bước lớn nhất trong bài. Chủ repo đã nghe A/B và duyệt; agent chỉ đo giải mã, không phát âm thật.

## Tái dựng và nghe A/B

Từ gốc repo: node tools/audio/compose/compose.mjs --song luyen_hon_canh --soundfont <GeneralUser-GS.sf2> --extra-soundfont <DSK-Asian-DreamZ.SF2> --out art/src/audio/luyen_hon_canh

Trong artifacts phiên có luyen_hon_canh.ogg/m4a (mới), dai_dau_hon_truong.ogg/m4a (cũ nguyên mức), manifest.json riêng ứng viên. Chủ repo mở thủ công để nghe, cùng mức âm lượng. Agent không phát âm thật; nếu mở Chrome phải có --mute-audio.

Đã chuyển duy nhất luyen_hon_canh khỏi bài Đại Đấu Hồn Trường sang bài riêng trong manifest runtime; không đổi gió hoặc hệ phát.

## Brief gốc (không có prompt sinh âm thanh AI)

Một bản nhạc nền lặp ngắn riêng cho Luyện Hồn Cảnh, thí luyện solo khác Đại Đấu Hồn Trường; nhạc tu tiên tự sáng tác bằng code/ngũ cung, soundfont miễn phí có nguồn; âm sắc thưa, không át dấu hiệu kỹ năng. Không AI sinh âm thanh, không gói trả phí. Mã nốt gốc bảo toàn ở songs/luyen_hon_canh.mjs (chỉ cập nhật chú thích duyệt); RAW và SHA256 ở bảng trên không đổi.

## Kiểm nhập runtime sau duyệt

- Runtime `shared/assets/audio/music/luyen_hon_canh.ogg/m4a` sao chép nguyên byte RAW: SHA256 giữ đúng bảng trên; đo lại EBU R128 vẫn -19,0 LUFS-I / true peak -1,0 dBFS cả hai định dạng.
- `npm run budget` đạt, không sửa ngưỡng. Dung lượng thêm trên đĩa runtime: 2.228.667 B; tải lười, không tải bài này ở bản đồ khác.
- Lần đầu vào riêng Luyện Hồn Cảnh: OGG từ 1.223.332 B (bài cũ + stem) xuống 967.240 B; M4A từ 1.354.065 B xuống 1.261.427 B. Khi đã ghé cả hai bản đồ, cache có cả hai bài theo giới hạn sẵn có.
- PCM Float32 ở 44,1 kHz: mới stereo 4.515.840 mẫu = 36.126.720 B; cũ stereo + stem mono 3.225.600 mẫu = 38.707.200 B. Không thêm stem.
- Chrome headless 156.0.8078.76, luôn `--mute-audio`; đo trên trang trống dùng MusicPlayer thật, asset từ bộ nhớ (không đo mạng), chuyển Luyện Hồn Cảnh/Đấu trường bốn lần. Đây là nhịp RAF, **không phải FPS gameplay trong phụ bản**, một lượt đo trên máy dùng chung.

| Định dạng | Trước/sau | Tải + giải mã lạnh (ms) | RAF trung bình | p95 khung (ms) | Khung lâu nhất (ms) |
|---|---|---:|---:|---:|---:|
| OGG | Trước | 152,2 | 103,62 | 10,2 | 12,5 |
| OGG | Sau | 128,5 | 103,68 | 10,2 | 10,9 |
| M4A | Trước | 168,3 | 103,71 | 10,2 | 10,9 |
| M4A | Sau | 134,1 | 103,78 | 10,2 | 10,8 |

Test MusicPlayer dùng AudioContext giả kiểm năm lần vào/ra ở cả OGG/M4A: một bài nền sống sau crossfade, cùng bản đồ không tạo nguồn mới, tái vào dùng cache, mute/bật lại đúng bài. Bộ kiểm cũ vẫn giữ định dạng dự phòng, tải lỗi thử lại, slider và crossfade; không nới checker hoặc thay bộ phát.

