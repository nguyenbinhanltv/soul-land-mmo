# Dây chuyền audio #133

## Chạy lại pipeline

Nguồn tải xuống phải nằm ngoài repo. Catalog là `catalog.json` và lưu URL, tác giả, license, ngày tải và SHA-256 của từng gói/tệp.

`track.mapId` phải là mã thật trong `shared/data.ts:MAPS`; validator có allowlist để chặn mã giả hoặc mã đã bị đổi.

```sh
npm install
node tools/audio/process.mjs \
  --source-root /path/to/artifact/sources
node tools/audio/validate.mjs
node tools/audio/preview.mjs \
  --out /path/to/artifact/audio-preview/index.html
```

`generatedAt` lấy từ ngày provenance trong catalog (hoặc `SOURCE_DATE_EPOCH`), nên chạy lại cùng nguồn sẽ cho output và manifest tái lập được.

Pipeline tạo `.ogg` và `.m4a` AAC, chuẩn hóa bằng `loudnorm`, cắt khoảng lặng ở cuối, nhóm tiếng ngắn thành audio sprite và ghi manifest. Chỉ sprite bước chân được preload; ambient và tiếng hồn thú được đánh dấu lazy theo map/sự kiện. Manifest chặn tổng tải ban đầu vượt 2 MiB cho từng format. `audio:validate` giải mã từng output bằng FFmpeg và đối chiếu thời lượng thật với sprite, nên output bị cắt hỏng sẽ bị chặn.

`audio:process` tự sinh bảng provenance trong `art/CREDITS.md` giữa hai marker `audio-sfx:start` và `audio-sfx:end`; `audio:validate` báo lỗi nếu bảng này lệch manifest. Preview mặc định ghi vào thư mục tạm của hệ điều hành; dùng `--out` để tạo artifact cố định.

## C4 — tiếng T3 riêng cho 25 võ hồn

`sfx-catalog.json` có 175 clip T3 CC0: 75 pha tuyệt kỹ vòng 10, 75 pha hồn kỹ Chân Thân và 25 tiếng biến hình. Mỗi nhóm mang mã `skill-t3-<ult|ct|avatar>-<mã võ hồn>`; cờ `noVoice` bắt buộc để tránh tiếng hô. Các clip này dùng chung sprite `skill` để tải lười và không thay đổi luật game.

Tạo trang nghe thử theo đúng offset từng clip:

```sh
npm run audio:preview-sfx -- --out /tmp/soul-land-sfx-preview/index.html
```

Trang nghe thử dùng fragment thời gian, nên nút của từng clip chỉ phát đúng đoạn tương ứng trong sprite.

Catalog hiện bao phủ rừng, suối, gió núi, thành trấn/đám đông, chim, sói, rắn, gấu, côn trùng và chuông. Các nhóm bổ sung dùng OGA CC0 đã ghi provenance từng file trong catalog và `art/CREDITS.md`.

## Hiệu ứng lô 2 (G5, #396)

`sfx-catalog.json` thêm ba gói: `amb` (môi trường: gió, sóng, chim, côn trùng, lửa, chuông chùa), `ui` (giao diện) và `pk` (trống mở trận, đếm ngược, kết liễu, nhịp tim). Clip lấy đoạn giữa bản thu dài bằng `startSeconds` / `maxSeconds`, mờ vào / ra bằng `fadeIn` / `fadeOut` (môi trường dài hơn 0,5 s); còn lại như lô 1. Nguồn tải về thư mục tạm ngoài repo (mỗi nguồn một thư mục con theo `sourceId`), chạy `npm run audio:sfx -- --source-root <thư mục>`.

## License và provenance

- Audio đầu vào nhận mọi giấy phép đã biết (`ALLOWED_LICENSES` trong `lib.mjs`, mã SPDX: CC0, CC-BY, CC-BY-SA, CC-BY-NC, OGA-BY, GPL; luật ở `GAME_DESIGN.md` mục 5.11); giấy phép lạ, trống hay ND thì validator dừng. Bảng ghi công gắn cờ SA / GPL / NC cạnh giấy phép: tệp output (kể cả audio sprite ghép nhiều nguồn) có nguồn SA / GPL thì cả tệp theo giấy phép đó, nên tách nguồn SA / GPL ra sprite riêng khi được; NC thì thay nếu thương mại hóa. Kenney (CC0) được ưu tiên; OGA gap-fill sau khi kiểm tra trang nguồn từng gói.
- `ffmpeg-static` được pin exact `5.3.0`, license GPL-3.0-or-later. Đây là công cụ build-time, được gọi như tiến trình độc lập trong `tools/audio/process.mjs`; không import vào client/server runtime.
- Không commit binary FFmpeg, `node_modules`, archive nguồn, hay đưa binary vào `shared/assets`, `public` hoặc Docker image. Docker chỉ cài dependency dưới `server` và `client`; test ranh giới Docker kiểm tra root install và `node_modules`.
- FFmpeg không nhúng nội dung vào output. License output theo input audio; provenance nguồn được ghi riêng trong catalog và `art/CREDITS.md`.
- Khi thêm CC-BY / CC-BY-SA / OGA-BY, phải hiển thị đúng tên tác giả trong màn hình giới thiệu ở phần nối game sau này. PR này không sửa module audio client, GameScene, Cài đặt hoặc GAME_DESIGN.
