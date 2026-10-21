# Dây chuyền audio #133

## Chạy lại pipeline

Nguồn tải xuống phải nằm ngoài repo. Catalog là `catalog.json` và lưu URL, tác giả, license, ngày tải và SHA-256 của từng gói/tệp.

```sh
npm install
node tools/audio/process.mjs \
  --source-root /path/to/artifact/sources
node tools/audio/validate.mjs
node tools/audio/preview.mjs \
  --out /path/to/artifact/audio-preview/index.html
```

`generatedAt` lấy từ ngày provenance trong catalog (hoặc `SOURCE_DATE_EPOCH`), nên chạy lại cùng nguồn sẽ cho output và manifest tái lập được.

Pipeline tạo `.ogg` và `.m4a` AAC, chuẩn hóa bằng `loudnorm`, cắt khoảng lặng ở cuối, nhóm tiếng ngắn thành audio sprite và ghi manifest. Chỉ sprite bước chân được preload; ambient và tiếng hồn thú được đánh dấu lazy theo map/sự kiện. Manifest chặn tổng tải ban đầu vượt 2 MiB cho từng format.

## License và provenance

- Audio đầu vào của #133 chỉ dùng CC0 hoặc CC-BY. Kenney được ưu tiên; OGA chỉ gap-fill sau khi kiểm tra trang nguồn từng gói.
- `ffmpeg-static` được pin exact `5.3.0`, license GPL-3.0-or-later. Đây là công cụ build-time, được gọi như tiến trình độc lập trong `tools/audio/process.mjs`; không import vào client/server runtime.
- Không commit binary FFmpeg, `node_modules`, archive nguồn, hay đưa binary vào `shared/assets`, `public` hoặc Docker image. Docker chỉ cài dependency dưới `server` và `client`; test ranh giới Docker kiểm tra root install và `node_modules`.
- FFmpeg không nhúng nội dung vào output. License output theo input audio; provenance nguồn được ghi riêng trong catalog và `art/CREDITS.md`.
- Khi thêm CC-BY, phải hiển thị đúng tên tác giả trong màn hình giới thiệu ở phần nối game sau này. PR này không sửa module audio client, GameScene, Cài đặt hoặc GAME_DESIGN.
