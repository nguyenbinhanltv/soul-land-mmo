// Kiểm manifest nhạc nền (#134) mà không cần cài thư viện (chạy trong `npm run check`):
// - mọi bài trong songs/ có trong manifest và ngược lại, file ogg + m4a tồn tại, đúng số byte, mỗi file < 1,5 MB, không có file thừa;
// - mọi bản đồ trong MAPS (shared/data.ts) có đúng một bài nhạc nền, có ít nhất một bài giao chiến;
// - bài lặp dài 1–2 phút (cho phép thêm vài giây), khúc ngắn có `event` không trùng.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import SONGS from "./songs/index.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const assets = path.join(root, "shared/assets");
const dir = path.join(assets, "audio/music");
const MAX_BYTES = 1.5 * 1024 * 1024;
const errors = [];
const fail = (msg) => errors.push(msg);

const manifestPath = path.join(dir, "manifest.json");
if (!existsSync(manifestPath)) {
  console.error(`[nhạc] Thiếu ${path.relative(root, manifestPath)}: chạy tools/audio/compose/compose.mjs.`);
  process.exit(1);
}
const { tracks } = JSON.parse(readFileSync(manifestPath, "utf8"));
const ids = new Set(tracks.map((t) => t.id));
for (const s of SONGS) if (!ids.has(s.id)) fail(`bài ${s.id} có trong songs/ nhưng chưa render vào manifest`);
for (const t of tracks) if (!SONGS.some((s) => s.id === t.id)) fail(`manifest có ${t.id} nhưng songs/ không có`);

const used = new Set(["manifest.json"]);
const events = new Map();
for (const t of tracks) {
  for (const format of ["ogg", "m4a"]) {
    const f = t.files?.[format];
    if (!f) { fail(`${t.id}: thiếu file ${format}`); continue; }
    const file = path.join(assets, f.path);
    used.add(path.basename(file));
    if (!existsSync(file)) { fail(`${t.id}: không thấy ${f.path}`); continue; }
    const bytes = statSync(file).size;
    if (bytes !== f.bytes) fail(`${t.id}: ${f.path} nặng ${bytes} B, manifest ghi ${f.bytes} B`);
    if (bytes > MAX_BYTES) fail(`${t.id}: ${f.path} vượt 1,5 MB`);
  }
  if (t.loop && (t.seconds < 60 || t.seconds > 125)) fail(`${t.id}: bài lặp dài ${t.seconds} s, cần khoảng 1–2 phút`);
  if (t.kind === "jingle") {
    if (!t.event) fail(`${t.id}: khúc ngắn thiếu event`);
    else if (events.has(t.event)) fail(`event ${t.event} trùng ở ${events.get(t.event)} và ${t.id}`);
    else events.set(t.event, t.id);
  }
}
for (const f of readdirSync(dir)) if (!used.has(f)) fail(`file thừa trong shared/assets/audio/music: ${f}`);

// Mã bản đồ đọc thẳng từ khai báo MAPS (không import TypeScript).
const data = readFileSync(path.join(root, "shared/data.ts"), "utf8");
const block = data.slice(data.indexOf("export const MAPS"), data.indexOf("\n};", data.indexOf("export const MAPS")));
const mapIds = [...block.matchAll(/^\s{2}([a-z_]+): \{ id: "\1"/gm)].map((m) => m[1]);
if (!mapIds.length) fail("không đọc được MAPS trong shared/data.ts");
for (const id of mapIds) {
  const n = tracks.filter((t) => t.kind === "map" && t.maps?.includes(id)).length;
  if (n !== 1) fail(`bản đồ ${id} có ${n} bài nhạc nền, cần đúng 1`);
}
for (const t of tracks) for (const m of t.maps ?? []) if (!mapIds.includes(m)) fail(`${t.id}: bản đồ ${m} không có trong MAPS`);
if (!tracks.some((t) => t.kind === "battle")) fail("thiếu bài giao chiến (kind battle)");

if (errors.length) {
  for (const e of errors) console.error(`[nhạc] Lỗi: ${e}`);
  process.exit(1);
}
console.log(`[nhạc] ${tracks.length} bài (${tracks.filter((t) => t.kind === "map").length} bản đồ, ${events.size} khúc ngắn), ${mapIds.length} bản đồ đều có nhạc: OK`);
