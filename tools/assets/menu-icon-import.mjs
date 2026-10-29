// Nhập 16 icon menu AI (tờ `art/src/ui-kit/toI-2.png`, #884, theo dõi #877) vào game thay cho 16 `gi_menu_*` game-icons.
//   node tools/assets/menu-icon-import.mjs           cắt tờ bằng cutter ui:cut (--soft --prefix menu_), ghi ảnh + đăng ký khoá vào manifest
//   node tools/assets/menu-icon-import.mjs --check   không ghi; lỗi nếu ảnh / manifest lệch kết quả cắt (tất định) hoặc vượt ngân sách icon
// Mỗi icon ra hai bản (luật 1× / 2× của kit): `gi_menu_<key>` = 2× khung 32×32 (cỡ cũ, HUD / hub dùng ở 24 px CSS khi DPR ≥ 1,5),
// `gi_menu_<key>_1x` = 1× khung 24×24 (đúng 24 px CSS, DPR 1). Ảnh = mảnh 2× của cutter, hạ theo vùng vào khung (giữ tỉ lệ),
// lượng tử về bảng màu của chính mảnh, alpha nhị phân; không chép key vào ui-kit.json (khoá `gi_*`, không phải `ui2_*`).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, encodePng, Img, MANIFEST, readPng, ROOT, SPRITES } from "./lib.mjs";
import { loadKit } from "./ui-kit-lib.mjs";
import { cutUiSheet } from "./ui-sheet-cut.mjs";

const SHEET = path.join(ROOT, "art/src/ui-kit/toI-2.png");
const SOURCE = path.join(ROOT, "art/src/ui-kit/menu-pilot.source.json");
const OUT = path.join(SPRITES, "iso/gi");
export const FRAMES = { "": 32, _1x: 24 };
/** Ngân sách icon của kit (docs/art/ui-kit.md): ≤ 150 KB, mỗi bản 2× / 1× tính riêng. */
export const BUDGET = 150_000;

/** Hạ `src` (Img có alpha) về khung `size`×`size`: vừa khít (không phóng), giữ tỉ lệ, căn giữa; box filter rồi bắt về màu gần nhất của chính ảnh. */
export function fitFrame(src, size) {
  const k = Math.min(1, size / src.w, size / src.h), w = Math.max(1, Math.round(src.w * k)), h = Math.max(1, Math.round(src.h * k));
  const pal = new Map();
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const p = src.get(x, y); if (p[3] >= 128) pal.set(p.slice(0, 3).join(","), p.slice(0, 3)); }
  const colors = [...pal.values()];
  const out = new Img(size, size), ox = (size - w) >> 1, oy = (size - h) >> 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const x0 = x * src.w / w, x1 = (x + 1) * src.w / w, y0 = y * src.h / h, y1 = (y + 1) * src.h / h;
    let a = 0, r = 0, g = 0, b = 0, n = 0;
    for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy++) for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx++) {
      const wt = (Math.min(x1, sx + 1) - Math.max(x0, sx)) * (Math.min(y1, sy + 1) - Math.max(y0, sy)), p = src.get(sx, sy);
      n += wt; a += p[3] * wt; r += p[0] * p[3] * wt; g += p[1] * p[3] * wt; b += p[2] * p[3] * wt;
    }
    if (a / n < 128 || !a) continue;
    const c = [r / a, g / a, b / a];
    let best = colors[0], bd = Infinity;
    for (const q of colors) { const d = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2; if (d < bd) { bd = d; best = q; } }
    out.set(ox + x, oy + y, [...best, 255]);
  }
  return out;
}

/** Cắt tờ rồi dựng { `menu_<key><hậu tố>.png` → Buffer }. */
export function buildIcons() {
  const kit = loadKit(), mapping = JSON.parse(readFileSync(SOURCE, "utf8")).mapping;
  const cut = cutUiSheet({ img: readPng(SHEET), name: "toI-2", kindId: "I", kit, prefix: "menu_", soft: true });
  const files = new Map();
  for (const m of mapping) {
    const piece = cut.files.get(`2x/ui2_menu_icon_${String(m.index).padStart(2, "0")}.png`);
    if (!piece) throw new Error(`thiếu mảnh icon_${m.index} (${m.key})`);
    const img = decodePng(piece);
    for (const [suffix, size] of Object.entries(FRAMES)) files.set(`${m.key.replace(/^gi_/, "")}${suffix}.png`, encodePng(fitFrame(img, size)));
  }
  return { files, keys: mapping.map((m) => m.key) };
}

/** Thêm khoá `_1x` còn thiếu vào manifest (mục `gi_menu_<key>` đã có), ngay sau khoá gốc; giữ nguyên từng byte phần còn lại. */
export function spliceManifest(text, keys) {
  const nl = text.includes("\r\n") ? "\r\n" : "\n";
  let t = text;
  for (const key of keys) {
    if (t.includes(`"${key}_1x"`)) continue;
    const re = new RegExp(String.raw`(\{\s*"key": "${key}",\s*"iso": true\s*\},?)`);
    if (!re.test(t)) throw new Error(`manifest chưa có ${key}`);
    t = t.replace(re, (m) => `${m.replace(/,?$/, ",")}${nl}    { "key": "${key}_1x", "iso": true }${m.endsWith(",") ? "," : ""}`);
  }
  return t;
}

function main() {
  const check = process.argv.includes("--check");
  const { files, keys } = buildIcons();
  const bytes = { 2: 0, 1: 0 };
  for (const [f, buf] of files) bytes[f.endsWith("_1x.png") ? 1 : 2] += buf.length;
  const over = Object.entries(bytes).filter(([, n]) => n > BUDGET);
  if (over.length) throw new Error(`vượt ngân sách icon ${BUDGET / 1000} KB: ${over.map(([x, n]) => `${x}× ${n} B`).join(", ")}`);
  const mtext = readFileSync(MANIFEST, "utf8"), next = spliceManifest(mtext, keys);
  const diff = [...files].filter(([f, buf]) => !existsSync(path.join(OUT, f)) || !readFileSync(path.join(OUT, f)).equals(buf)).map(([f]) => f);
  if (next !== mtext) diff.push("sprites/manifest.json");
  if (check) {
    if (diff.length) { console.error(`[menu-icon] lệch ${diff.length} mục (chạy node tools/assets/menu-icon-import.mjs): ${diff.slice(0, 6).join(", ")}`); process.exit(1); }
    console.log(`[menu-icon] ${keys.length} icon × 2 bản khớp kết quả cắt · 2× ${bytes[2]} B · 1× ${bytes[1]} B (ngân sách ${BUDGET / 1000} KB)`);
    return;
  }
  mkdirSync(OUT, { recursive: true });
  for (const [f, buf] of files) writeFileSync(path.join(OUT, f), buf);
  writeFileSync(MANIFEST, next);
  console.log(`[menu-icon] ${keys.length} icon × 2 bản → shared/assets/sprites/iso/gi · 2× ${bytes[2]} B · 1× ${bytes[1]} B (ngân sách ${BUDGET / 1000} KB)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error(e.message); process.exit(2); }
}
