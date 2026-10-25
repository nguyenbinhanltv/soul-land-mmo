# Cache tài sản tĩnh và Cloudflare

Origin (`server/src/staticCache.ts`) tự đặt `Cache-Control` cho `client/dist`; Cloudflare chỉ cần cache theo header đó:

| Nhóm | Header origin | Ghi chú |
| --- | --- | --- |
| `/assets/<tên>-<hash>.*` (JS, CSS, font do Vite hash) | `public, max-age=31536000, immutable` | Phaser tách chunk riêng (`phaser-<hash>.js`) nên đổi code game không tải lại Phaser |
| `index.html` | `no-cache` | luôn hỏi lại (ETag, thường 304) vì nó trỏ tới file hash mới |
| ảnh / âm thanh / bản đồ / manifest không hash (`lpcparts`, `sprites`, `iso`, `mini`, `audio`, `*.json`) khi URL có `?v=` | `public, max-age=31536000, immutable` | client gắn `?v=<hash nội dung shared/assets>` (`client/src/assetUrl.ts`, `vite.config.ts`): asset đổi thì URL đổi, không kẹt cache |
| như trên, không có `?v=` (bot, trang thử) | ảnh / âm thanh: `max-age=604800, stale-while-revalidate=86400`; json: `no-cache` | |

Nén: Cloudflare đã nén br cho HTML / JS / JSON từ origin không nén (kiểm bằng `curl -H 'Accept-Encoding: br'`: có `Content-Encoding: br`), nên origin không bật nén; PNG / ogg vốn đã nén.

**Cache Rules cho chủ repo** (Cloudflare → Caching → Cache Rules):

1. Rule "Static game assets": khi `Hostname = soulland.oleqima.com` **và** đường dẫn **không** bắt đầu bằng `/api/`, `/matchmake/`, `/health` (và không phải WebSocket) thì **Eligible for cache**; **Edge TTL**: *Use cache-control header if present* (Respect origin; nếu thiếu header thì 1 tháng); **Browser TTL**: *Respect existing headers*. Cloudflare mặc định chỉ cache theo đuôi file (png, js, css…) và **không cache `.json`**; rule này bật cache cả bản đồ / manifest `.json` (có `?v=`). `index.html` vẫn `no-cache` nên luôn được hỏi lại.
2. Rule "Không cache API": `/api/*`, `/matchmake/*` (và `/health`) → **Bypass cache**. WebSocket (Colyseus) tự không qua cache; không đặt rule cho nó.
3. Không dùng "Override origin" cho Browser TTL: ghi đè 4 giờ như hiện nay (`max-age=14400` ở `/assets/*`) làm mất `immutable` và bắt người chơi tải lại sau 4 giờ.
4. Sau khi deploy bản này, kiểm: `curl -sI 'https://soulland.oleqima.com/lpcparts/<sheet>.png?v=<v>' | grep -i 'cache-control\|cf-cache-status'` lần hai phải `cf-cache-status: HIT`.

Client tải bền (`client/src/assetUrl.ts`): tối đa 12 file cùng lúc (Phaser loader và hàng đợi riêng của `lpcRig.ts`), lỗi mạng / 5xx thì thử lại 5 lần với backoff 0,4 / 1,2 / 3,6 / 8 / 8 giây (± nhiễu); hết lần thì hình dự phòng (thiếu lớp LPC, preset) và `lpcRig` tải lại sheet đó sau 30 giây. Thử tải lỗi ở máy: server `GAME_TEST=1 ASSET_FAIL_RATE=0.3` trả 504 ngẫu nhiên cho 30% request png / json / ogg / m4a (không có tác dụng khi thiếu `GAME_TEST`). Atlas / nén PNG để giảm số file thêm vào `assetUrl.ts` được: chỉ cần URL đi qua `assetUrl()`.

## Issue liên quan
#580 (cache tài sản tĩnh), #556 (atlas / nén PNG).
