# Luyện Hồn Cảnh — Tĩnh tâm luyện hồn

Part of #1553. Ứng viên chờ chủ repo nghe A/B; manifest đang chạy vẫn gán bài cũ. Chưa nghiệm thu nghe trong phụ bản.

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

Hai định dạng ứng viên không clip, true peak không vượt -1 dBFS, số mẫu đúng 4.515.840 (bội 1024). Render ba vòng lấy vòng giữa với crossfade 4096 mẫu bằng công cụ hiện có; đo bước nối nhỏ hơn bước lớn nhất trong bài. Đây là kiểm kỹ thuật, chủ repo vẫn cần nghe vòng nối và độ rõ dấu hiệu kỹ năng trong phụ bản trước duyệt.

## Tái dựng và nghe A/B

Từ gốc repo: node tools/audio/compose/compose.mjs --candidate --soundfont <GeneralUser-GS.sf2> --extra-soundfont <DSK-Asian-DreamZ.SF2> --out art/src/audio/luyen_hon_canh

Trong artifacts phiên có luyen_hon_canh.ogg/m4a (mới), dai_dau_hon_truong.ogg/m4a (cũ nguyên mức), manifest.json riêng ứng viên. Chủ repo mở thủ công để nghe, cùng mức âm lượng. Agent không phát âm thật; nếu mở Chrome phải có --mute-audio.

Sau duyệt mới chuyển duy nhất luyen_hon_canh khỏi bài Đại Đấu Hồn Trường sang ứng viên trong manifest; không đổi gió hoặc hệ phát.
