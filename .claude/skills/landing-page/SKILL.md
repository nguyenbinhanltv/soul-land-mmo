---
name: landing-page
description: Làm trang giới thiệu (landing) của game ở "/" và chuyển game sang "/choi" (Vite nhiều trang, không tải Phaser ở landing). Phong cách thủy mặc, phông đủ dấu tiếng Việt, ngân sách hiệu năng, SEO / OG, tin cập nhật từ docs/lich-su.md. Dùng khi tạo / sửa landing, trang tin, ảnh chia sẻ; không đụng logic game.
---

# Trang giới thiệu (landing)

Landing là trang tĩnh, nhẹ, để người lạ hiểu game và bấm vào chơi. **Không đụng logic game** (server, `GameScene`, `shared/data.ts`); mọi việc chỉ ở trang mới, CSS / ảnh riêng của nó và cấu hình build.

## Dùng skill nào
- `frontend-design` (skill gốc của Anthropic, đã chép): **thiết kế**: hướng thẩm mỹ, chữ, bố cục, tránh vẻ "mẫu có sẵn". Đọc trước khi dựng. Phần nào xung đột với mục "Phong cách" dưới đây (ví dụ gợi ý tránh nền ngà + chữ có chân) thì **phong cách thủy mặc của repo thắng**: đó là nhận diện đã chốt, không phải mặc định.
- `webapp-testing` (đã chép): **kiểm** bằng trình duyệt headless (xem "Kiểm").
- `client-ui`: chỉ để biết token CSS và giao diện game; landing không import code client.
- `asset-gen`: khi cần ảnh mới.

## Cấu trúc trang
- `/` = landing (`client/index.html` mới, JS riêng rất nhỏ hoặc không có JS). `/choi` = game (HTML hiện tại chuyển thành `client/choi/index.html`, vẫn nạp `main.ts` và Phaser). Vite nhiều trang: `build.rollupOptions.input = { landing: "index.html", choi: "choi/index.html" }` trong `client/vite.config.ts`; giữ `manualChunks` Phaser và `publicDir: ../shared/assets`.
- **Landing không import Phaser, `net.ts`, `main.ts`** (kiểm bằng `npm run build --prefix client`: chunk của landing không chứa `phaser`). Nút "Vào chơi" là liên kết `<a href="/choi">`.
- Server (`server/src/index.ts`) phục vụ `client/dist` bằng `express.static`: `/choi/` ra `dist/choi/index.html` nhờ thư mục; kiểm cả `/choi` không có dấu gạch cuối. Đừng đổi đường `/api` và WebSocket. Nơi nào trong repo / tài liệu / bot / chụp ảnh đang trỏ vào `/` để vào game thì đổi thành `/choi` (tìm `localhost:5173`, `SERVER_URL`, `client/scripts`, `docs/`).
- Asset dùng đường dẫn tuyệt đối từ gốc (`/ui/c6/logo.png`), vì `publicDir` là `shared/assets` (xem skill `client-ui`, bẫy `url()` tương đối trong biến CSS).

## Phong cách (thủy mặc, khớp game)
- Màu lấy từ `client/src/style.css` (`:root`), không bịa màu mới: nền mực `--bg #1a1020`, giấy ngà `--paper #ece2c8` / `--paper2 #d8caa8` / `--paper3 #b8a888`, chữ mực `--ink #2a2230`, triện son `--son #942823` (`--son-l #d84a3a`), gỗ trục `--wood #5a3b22`, ngọc `--accent #245a46`. Viền mực `#1a1020`, đổ bóng cứng không mờ. Bảng đầy đủ: `art/palettes/_thuy_mac.gpl`; vùng sang trọng (thẻ võ hồn, học viện) có thể dùng `_luu_ly.gpl`, tiết chế.
- Cách thể hiện: cuộn giấy ngà mép mực trên nền tối, nút chính là ấn triện đỏ son, chữ mực trên giấy, chữ sáng trên nền tối có viền mực 1 điểm. Chi tiết nhận diện: `docs/design/giao-dien.md` (phong cách C), `docs/art/*` (nguồn ảnh, quy cách).
- Độ tương phản chữ ≥ 4,5 : 1; không truyền tin chỉ bằng màu; tôn trọng `prefers-reduced-motion`; focus bàn phím nhìn thấy; chạm ≥ 40×40.
- **Phông phải đủ dấu tiếng Việt** (kiểm chuỗi `Hồn Sư Đấu La – ỹ ự ẵ Ờ ẩ ế ỗ ộ ặ Ữ ơ ư`). Đang dùng: Galmuri 11 / 9 (`client/src/fonts/`, OFL; chỉ cỡ bội số của lưới font, không chữ đậm giả) và Be Vietnam Pro. Ứng viên đã kiểm đủ dấu, OFL: VT323, Handjet (số, tiêu đề điểm ảnh), LXGW WenKai TC (thư pháp, 13 MB nên **phải cắt tập con** chỉ gồm chữ dùng trên trang, xuất woff2). Nguồn tải: Google Fonts (VT323 `fonts.google.com/specimen/VT323`, Handjet, LXGW WenKai TC). Đã **loại vì thiếu dấu**: Pixelify Sans, Silkscreen, Jersey 10, Micro 5. Phông chưa kiểm thì tự kiểm cmap bằng chuỗi trên trước khi dùng. Phông mới đi vào repo kèm giấy phép OFL ở `client/src/fonts/` và dòng ở `art/CREDITS.md`; `font-display: swap` ở landing (game dùng `block`).

## Nội dung và asset
- Dùng asset sẵn có ở `shared/assets`: `ui/c6/logo.png`, `ui/c6/login-bg.png`, `ui/c6/loading-bg.png`, `ui/c6/event-banner.png`, chân dung ở `sprites/iso/portrait/`, sheet hiệu ứng kỹ năng `sprites/iso/fx/sk_*` (là sheet PNG, muốn ảnh động trên landing thì dựng bằng CSS `steps()` hoặc xuất WebP động / GIF từ sheet, **không** nhúng sheet gốc dung lượng lớn). Ảnh landing xuất WebP riêng (kích thước đúng chỗ dùng, `width` / `height` ghi sẵn, `loading="lazy"` trừ ảnh đầu trang; ảnh đầu trang `fetchpriority="high"`). Không chép ảnh vào nhiều chỗ: ảnh mới của landing để ở `shared/assets/ui/landing/`.
- Asset ngoài: chỉ miễn phí, giấy phép theo `docs/art/nguon-giay-phep.md` (ghi nguồn + giấy phép ở `art/CREDITS.md`), **đổi tên theo quy ước game** (`fx_*`, `gi_*`, `vat_*`…), tên gốc chỉ ở CREDITS / licenses. Ảnh chụp màn hình game thật là nguồn tốt nhất (quy trình chụp ở skill `webapp-testing`); chụp trong Chrome `--mute-audio`.
- Ngôn ngữ tiếng Việt, dùng đúng tên gốc Đấu La. Chữ viết cho người chơi, không thuật ngữ kỹ thuật; nút nói đúng việc ("Vào chơi").
- **Tin cập nhật**: lấy từ `docs/lich-su.md` (mốc đã xong, luật hiện hành ở `docs/design/`). Viết lại thành vài dòng ngắn cho người chơi, ghi ngày; không chép số cân bằng (số chỉ ở `shared/data.ts`), không lộ mục chưa làm.

## Hiệu năng (ngân sách)
- Lighthouse di động (Performance, Accessibility, Best Practices, SEO) **≥ 90**; LCP là ảnh đầu trang hoặc chữ, không chờ JS.
- JS landing nhỏ (đích < 20 KB gzip, tốt nhất không JS), CSS gọn, không thư viện UI, không tải Phaser / Colyseus. Phông tự host, tập con, `preload` đúng 1 phông tiêu đề. Không tải Google Fonts ở landing (trang game hiện còn tải Be Vietnam Pro từ Google; landing dùng bản tự host nếu cần).
- Ảnh WebP, kích thước đúng, lazy; video không tự phát. Cache theo `server/src/staticCache.ts` (asset có `?v=` hoặc tên có hash).

## SEO / chia sẻ
- `<html lang="vi">`, `<title>` và `meta description` riêng, một `h1`, `link rel="canonical"`, thẻ Open Graph + Twitter Card (`og:image` 1200×630 tuyệt đối URL, `og:locale vi_VN`), `theme-color` = nền mực, favicon.
- `robots.txt` và `sitemap.xml` (gồm `/`, và `/choi` nếu muốn lập chỉ mục) đặt ở `shared/assets/` (thành gốc `dist/`); URL tuyệt đối lấy từ tên miền triển khai (`docs/ops/trien-khai.md`), không bịa tên miền: chưa biết thì để biến / ghi chú cho chủ repo.
- Dữ liệu có cấu trúc `VideoGame` (JSON-LD) là tuỳ chọn, chỉ ghi điều có thật.

## Kiểm
Bằng `webapp-testing` (Playwright) hoặc Chrome headless CDP của repo; **luôn `--mute-audio`**, không cổng 9333, cổng dev riêng, chỉ tắt đúng PID mình bật.
1. `npm run check` và `npm run build --prefix client` sạch; chunk landing không chứa Phaser; `dist/index.html` và `dist/choi/index.html` đều có.
2. Chụp ba cỡ: máy tính 1280×720 và 1920×1080, điện thoại 390×844 (cảm ứng); đọc từng ảnh: không tràn ngang (`scrollWidth ≤ innerWidth`), dấu tiếng Việt đủ, chữ không đè nhau, nút "Vào chơi" bấm tới `/choi` và game vào được.
3. Lighthouse di động ≥ 90; kiểm tab Network: không có request tới Phaser / WebSocket ở `/`.
4. `/choi` vẫn chơi bình thường: bot `npm run bot:local -- --only <nhóm nhanh>` nếu đổi đường dẫn bot / server; đổi `index.html` của game thì thử đăng nhập tay một lượt.
5. Ảnh / văn bản kiểm xong mới mở PR; PR chỉ landing có ảnh chụp trước / sau trong mô tả (ảnh lưu ở artifacts, không commit ảnh chụp thử).
