// Cache-Control cho client/dist (#580). Phía trước là Cloudflare → ingress-nginx → một pod Node, nên mỗi lần origin không đặt header là một
// lần REVALIDATED về pod. Ba nhóm:
//  - /assets/<tên>-<hash>.<đuôi> (Vite đặt hash theo nội dung): immutable 1 năm.
//  - index.html: no-cache (luôn hỏi lại, ETag giữ nên thường là 304) vì nó trỏ tới file hash mới sau mỗi bản build.
//  - asset không hash (shared/assets: lpcparts, sprites, iso, mini, audio, bản đồ, manifest): client gắn `?v=<hash nội dung>` (client/src/assetUrl.ts),
//    có `v` thì immutable 1 năm (nội dung đổi thì URL đổi); không có `v` (bot, trang thử, người gõ tay) thì ảnh / âm thanh 7 ngày + stale-while-revalidate,
//    json no-cache.
import path from "node:path";

const YEAR = "public, max-age=31536000, immutable";
const WEEK = "public, max-age=604800, stale-while-revalidate=86400";
const HASHED = /^\/assets\/.+-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/;
const BINARY = new Set([".png", ".ogg", ".m4a", ".mp3", ".webp", ".jpg", ".jpeg", ".gif", ".svg", ".woff", ".woff2", ".ttf"]); // map-co-dinh: hằng số

/** `urlPath`: đường dẫn trong dist (bắt đầu bằng "/"); `versioned`: URL có `?v=`. */
export function cacheControlFor(urlPath: string, versioned: boolean): string {
  if (HASHED.test(urlPath)) return YEAR;
  const ext = path.extname(urlPath).toLowerCase();
  if (ext === ".html" || ext === "") return "no-cache";
  if (versioned) return YEAR;
  return BINARY.has(ext) ? WEEK : "no-cache";
}
