// Liệt kê ảnh trong hộp thư phẳng `anh-inbox/` (ảnh người dùng tự tạo trên Gemini / Copilot / Qwen…), chưa nhập.
//   node tools/assets/inbox.mjs [--dir <thư mục>] [--code <mã>] [--all]
//
// Tên file: `<mã prompt>[-v2][-dịch-vụ].png`, mã prompt có thể chứa dấu gạch (honsu-m2, radar-labam, ao-m-slk).
//   không hậu tố dịch vụ = Gemini; `-vN` = lần vẽ lại thứ N (không ghi đè ảnh cũ); hậu tố dịch vụ ghi nguồn ở art/CREDITS.md:
//   -copilot (Microsoft Copilot / Bing Image Creator), -qwen (Qwen Chat), -leonardo, -meta (Meta AI), -grok.
// Chọn bản dùng cho mỗi mã: lần vẽ cao nhất, rồi file mới nhất. `_processed.txt` (cùng thư mục) ghi các file đã nhập, mỗi dòng một tên file
// (có thể kèm đường dẫn cũ `thư-mục/tên.png` hoặc ghi chú sau tên). Mặc định chỉ in ảnh chưa nhập; --all in cả ảnh đã nhập.
import { closeSync, existsSync, openSync, readdirSync, readFileSync, readSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SERVICES = { copilot: "Microsoft Copilot (Bing Image Creator)", qwen: "Qwen Chat", leonardo: "Leonardo AI", meta: "Meta AI", grok: "Grok" };
const NAME = /^(.+?)(?:-v(\d+))?(?:-(copilot|qwen|leonardo|meta|grok))?\.png$/i;

/** Tách tên file ảnh hộp thư: { code, version (1 nếu không có -vN), service (khóa trong SERVICES, hoặc "gemini") }; null nếu không phải ảnh. */
export function parseInboxName(file) {
  const m = NAME.exec(file);
  if (!m) return null;
  return { code: m[1], version: m[2] ? +m[2] : 1, service: (m[3] ?? "gemini").toLowerCase() };
}
/** Tên công cụ ghi vào CREDITS (`validate --register --tool`): Gemini hoặc dịch vụ theo hậu tố. */
export const serviceName = (service) => (service === "gemini" ? "Gemini (gemini.google.com)" : SERVICES[service] ?? service);

/** Định dạng thật của file (đuôi .png nhưng có thể là WebP / JPEG, ví dụ ảnh Copilot): "png" | "webp" | "jpeg" | "?". */
export function sniffFormat(file) {
  const b = Buffer.alloc(12), fd = openSync(file, "r");
  try { readSync(fd, b, 0, 12, 0); } finally { closeSync(fd); }
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "webp";
  if (b[0] === 0xff && b[1] === 0xd8) return "jpeg";
  return "?";
}
/** Mọi ảnh trong thư mục phẳng, kèm cờ đã nhập và cờ "bản dùng" (cao nhất / mới nhất theo mã). */
export function scanInbox(dir) {
  const done = new Set(existsSync(path.join(dir, "_processed.txt")) ? readFileSync(path.join(dir, "_processed.txt"), "utf8").split(/\r?\n/).map((l) => path.basename(l.trim().split(/\s+/)[0] ?? "")).filter(Boolean) : []);
  const files = readdirSync(dir).filter((f) => !f.startsWith("_") && statSync(path.join(dir, f)).isFile()).map((f) => ({ file: f, ...parseInboxName(f), mtime: statSync(path.join(dir, f)).mtimeMs, format: sniffFormat(path.join(dir, f)), done: done.has(f) })).filter((f) => f.code);
  const best = new Map();
  for (const f of files) { const b = best.get(f.code); if (!b || f.version > b.version || (f.version === b.version && f.mtime > b.mtime)) best.set(f.code, f); }
  for (const f of files) f.latest = best.get(f.code) === f;
  return files.sort((a, b) => a.code.localeCompare(b.code) || a.version - b.version || a.mtime - b.mtime);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), opt = (n, d) => { const i = a.indexOf(n); return i >= 0 ? a.splice(i, 2)[1] : d; };
  const dir = opt("--dir", process.env.ANH_INBOX ?? ""), code = opt("--code", ""), all = a.includes("--all");
  if (!dir || !existsSync(dir)) { console.error(`không thấy thư mục hộp thư "${dir}": truyền --dir <thư mục anh-inbox> hoặc đặt biến ANH_INBOX`); process.exit(1); }
  const list = scanInbox(dir).filter((f) => (all || !f.done) && (!code || f.code === code));
  if (!list.length) console.log("không có ảnh nào chưa nhập");
  for (const f of list) console.log(`${f.latest ? "*" : " "} ${f.file.padEnd(46)} mã ${f.code}  lần ${f.version}  ${serviceName(f.service)}${f.format !== "png" ? `  ⚠ ${f.format.toUpperCase()} giả đuôi .png: node tools/assets/to-png.mjs ${f.file}` : ""}${f.done ? "  (đã nhập)" : ""}  ${new Date(f.mtime).toLocaleString("sv-SE")}`);
  if (list.length) console.log("(* = bản dùng cho mã: lần vẽ cao nhất, mới nhất)");
}
