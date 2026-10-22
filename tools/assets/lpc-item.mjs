// Biểu tượng vật phẩm và hiệu ứng từ gói LPC / OpenGameArt (#170, #201) theo công thức art/src/lpc-item.json.
//   node tools/assets/lpc-item.mjs --src <thư mục gói đã tải> [--only key,key] [--preview <thư mục>]
//
// Công thức: `packs` (tên gói → title, url, dir trong --src, licenses như trang OGA) và hai danh sách:
//   - `items`: { key: "item_<mã>", pack, file, cell: [cột, hàng], size? (ô nguồn, mặc định ISO_ITEM_ICON), gray?, by, part }
//     Cắt ô nguồn (ảnh đã là pixel thật 32×32 của LPC, không phóng), alpha về 0 / 255, đặt hộp bao vào giữa khung ISO_ITEM_ICON,
//     viền ngoài về #1a1020 (điểm mép đã tối thì đổi màu, mép sáng thì thêm một điểm viền bên ngoài), `gray` thì ghi bản xám (độ
//     sáng giãn về GRAY_SPAN, viền giữ nguyên) để client tô theo `col` của vật phẩm (uiArt.tintedUrl, như hồn cốt); rồi giảm còn
//     ICON_COLORS màu (median cut, như bảng auto 24 màu của biểu tượng Gemini).
//     → shared/assets/sprites/iso/item/<mã>.png.
//   - `fx`: { key: "fx_<tên>", pack, file, frame, by, part }: dải khung vuông `frame` một hàng (bỏ khung trống ở cuối), alpha về
//     0 / 255, giữ màu gốc → shared/assets/sprites/iso/fx/<tên>.png; manifest ghi "frame" (GameScene chạy animation `<key>:play`).
// Ghi key vào manifest.json ("iso": true) và ghi công vào mục `<!-- lpc-item:start -->` … `<!-- lpc-item:end -->` của
// art/CREDITS.md (tác giả, giấy phép của gói, giấy phép game dùng in đậm, cờ SA / GPL / NC theo licenseUse). Chạy lại thì thay
// đúng dòng của key vừa làm. Giấy phép lạ (không khớp LICENSE_KNOWN) thì dừng. Màu quá PORTRAIT_MAX_COLORS thì dừng.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT, SPRITES, MANIFEST, readPng, encodePng, Img, hex, toHex, OUTLINE, GRAY_RAMP, ISO_ITEM_ICON, PORTRAIT_MAX_COLORS, LICENSE_KNOWN, licenseUse } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const src = opt("--src", ""), only = opt("--only", ""), previewDir = opt("--preview", "");
const fail = (m) => { console.error(`[lpc-item] ${m}`); process.exit(1); };
if (!src) fail("Cách dùng: lpc-item.mjs --src <thư mục gói đã tải> [--only key,key] [--preview <thư mục>]");

const RECIPE = path.join(ROOT, "art", "src", "lpc-item.json");
const recipe = JSON.parse(readFileSync(RECIPE, "utf8"));
for (const [name, p] of Object.entries(recipe.packs)) {
  const bad = p.licenses.filter((l) => !LICENSE_KNOWN.test(l));
  if (!p.licenses.length || bad.length) fail(`gói ${name}: giấy phép lạ hoặc trống (${bad.join(", ") || "không có"})`);
}
const pick = (list) => (list ?? []).filter((e) => !only || only.split(",").includes(e.key));
const items = pick(recipe.items), fxs = pick(recipe.fx);
if (!items.length && !fxs.length) fail(`không có key nào${only ? ` trong --only ${only}` : ""}`);

const OUT_RGB = hex(OUTLINE);
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const DARK = 64; // điểm mép tối hơn ngưỡng này coi là nét viền sẵn có của LPC
const readSrc = (e) => {
  const p = recipe.packs[e.pack]; if (!p) fail(`${e.key}: không có gói "${e.pack}"`);
  const f = path.join(src, p.dir, e.file); if (!existsSync(f)) fail(`${e.key}: thiếu file nguồn ${f}`);
  return readPng(f);
};
/** Alpha về 0 / 255 (LPC có vài điểm mép bán trong suốt). */
function hardAlpha(t) { for (let i = 3; i < t.data.length; i += 4) t.data[i] = t.data[i] >= 128 ? 255 : 0; }
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
/** Viền ngoài #1a1020: điểm mép tối đổi màu viền; điểm mép sáng thì thêm điểm viền ở ô trống kề bên (trong khung). */
function outline(t) {
  const edge = (x, y) => t.alpha(x, y) && N4.some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= t.w || Y >= t.h || !t.alpha(X, Y); });
  const add = [];
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) {
    if (!edge(x, y)) continue;
    const p = t.get(x, y);
    if (lum(p) < DARK) { t.set(x, y, [...OUT_RGB, 255]); continue; }
    for (const [dx, dy] of N4) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < t.w && Y < t.h && !t.alpha(X, Y)) add.push([X, Y]); }
  }
  for (const [x, y] of add) t.set(x, y, [...OUT_RGB, 255]);
}
function bbox(t) {
  let x0 = t.w, y0 = t.h, x1 = -1, y1 = -1;
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) if (t.alpha(x, y)) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return x1 < 0 ? null : { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
/**
 * Bản xám (như gemini-import --gray, viền giữ nguyên), độ sáng giãn về GRAY_SPAN: vật LPC màu tối (rương đỏ, lá xanh) xám ra
 * rất tối, client nhân màu (tintedUrl) thì xỉn; giãn ra để tô màu vật phẩm vẫn tươi và còn khối.
 */
const GRAY_SPAN = [60, 235];
function toGray(t) {
  const L = [];
  for (let i = 0; i < t.data.length; i += 4) if (t.data[i + 3] && toHex([t.data[i], t.data[i + 1], t.data[i + 2]]) !== OUTLINE) L.push(lum([t.data[i], t.data[i + 1], t.data[i + 2]]));
  const lo = Math.min(...L), hi = Math.max(...L), k = hi > lo ? (GRAY_SPAN[1] - GRAY_SPAN[0]) / (hi - lo) : 0;
  for (let i = 0; i < t.data.length; i += 4) {
    if (!t.data[i + 3]) continue;
    const p = [t.data[i], t.data[i + 1], t.data[i + 2]];
    if (toHex(p) === OUTLINE) continue;
    t.data[i] = t.data[i + 1] = t.data[i + 2] = Math.round(GRAY_SPAN[0] + (lum(p) - lo) * k);
  }
}
function colors(t) { const s = new Set(); for (let i = 0; i < t.data.length; i += 4) if (t.data[i + 3]) s.add(toHex([t.data[i], t.data[i + 1], t.data[i + 2]])); return s.size; }
/**
 * Giảm còn tối đa `max` màu (median cut theo số điểm, như bảng auto 24 màu của biểu tượng Gemini): viền #1a1020 giữ nguyên, mỗi
 * hộp màu thay bằng điểm thật gần trung bình nhất của hộp (không sinh màu mới).
 */
function quantize(t, max) {
  const count = new Map();
  for (let i = 0; i < t.data.length; i += 4) if (t.data[i + 3]) { const c = toHex([t.data[i], t.data[i + 1], t.data[i + 2]]); if (c !== OUTLINE) count.set(c, (count.get(c) ?? 0) + 1); }
  if (count.size <= max - 1) return;
  let boxes = [[...count].map(([c, n]) => ({ p: hex(c), n, c }))];
  while (boxes.length < max - 1) {
    // Tách hộp có (số điểm × độ trải) lớn nhất theo trục trải rộng nhất, tại trung vị số điểm.
    let bi = -1, best = 0, axis = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      const span = [0, 1, 2].map((k) => Math.max(...b.map((x) => x.p[k])) - Math.min(...b.map((x) => x.p[k])));
      const a = span.indexOf(Math.max(...span)), score = span[a] * b.reduce((s, x) => s + x.n, 0);
      if (score > best) { best = score; bi = i; axis = a; }
    });
    if (bi < 0) break;
    const b = boxes[bi].sort((x, y) => x.p[axis] - y.p[axis]), half = b.reduce((s, x) => s + x.n, 0) / 2;
    let acc = 0, cut = 1; for (let i = 0; i < b.length - 1; i++) { acc += b[i].n; if (acc >= half) { cut = i + 1; break; } }
    boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut));
  }
  const map = new Map();
  for (const b of boxes) {
    const N = b.reduce((s, x) => s + x.n, 0), mean = [0, 1, 2].map((k) => b.reduce((s, x) => s + x.p[k] * x.n, 0) / N);
    const rep = b.reduce((a, x) => (dist(x.p, mean) < dist(a.p, mean) ? x : a)).p;
    for (const x of b) map.set(x.c, rep);
  }
  for (let i = 0; i < t.data.length; i += 4) {
    if (!t.data[i + 3]) continue;
    const r = map.get(toHex([t.data[i], t.data[i + 1], t.data[i + 2]])); if (r) [t.data[i], t.data[i + 1], t.data[i + 2]] = r;
  }
}
const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const ICON_COLORS = 24;

const done = []; // { key, entry, e }
for (const e of items) {
  const m = e.key.match(/^item_([a-z_]+)$/); if (!m) fail(`${e.key}: key vật phẩm phải là item_<mã>`);
  const S = e.size ?? ISO_ITEM_ICON, im = readSrc(e), cut = new Img(S, S);
  cut.blit(im, e.cell[0] * S, e.cell[1] * S, S, S, 0, 0);
  hardAlpha(cut);
  const b = bbox(cut); if (!b) fail(`${e.key}: ô (${e.cell}) trống`);
  // Chừa 1 điểm mỗi phía cho viền; vật lớn hơn khung thì dừng (không thu nhỏ pixel art).
  if (b.w > ISO_ITEM_ICON - 2 || b.h > ISO_ITEM_ICON - 2) fail(`${e.key}: vật ${b.w}×${b.h} không vừa khung ${ISO_ITEM_ICON} (chừa viền)`);
  const t = new Img(ISO_ITEM_ICON, ISO_ITEM_ICON);
  t.blit(cut, b.x0, b.y0, b.w, b.h, Math.floor((ISO_ITEM_ICON - b.w) / 2), Math.floor((ISO_ITEM_ICON - b.h) / 2));
  outline(t);
  if (e.gray) toGray(t);
  quantize(t, ICON_COLORS);
  const n = colors(t); if (n > PORTRAIT_MAX_COLORS) fail(`${e.key}: ${n} màu, tối đa ${PORTRAIT_MAX_COLORS}`);
  const rel = `iso/item/${m[1]}.png`; mkdirSync(path.join(SPRITES, "iso", "item"), { recursive: true });
  writeFileSync(path.join(SPRITES, rel), encodePng(t));
  done.push({ key: e.key, entry: { key: e.key, iso: true }, e, img: t, change: `cắt ô (${e.cell.join(", ")}) của \`${e.file}\`, căn giữa khung ${ISO_ITEM_ICON}, viền ${OUTLINE}${e.gray ? ", bản xám giãn sáng để client tô theo màu vật phẩm" : ""}, giảm còn ${ICON_COLORS} màu` });
  console.log(`[lpc-item] ${e.key}: ${b.w}×${b.h}, ${n} màu → ${rel}`);
}
for (const e of fxs) {
  const m = e.key.match(/^fx_([a-z_]+)$/); if (!m) fail(`${e.key}: key hiệu ứng phải là fx_<tên>`);
  const F = e.frame, im = readSrc(e);
  if (im.h !== F || im.w % F) fail(`${e.key}: ${e.file} ${im.w}×${im.h} không phải dải một hàng khung ${F}`);
  let n = im.w / F;
  const empty = (i) => { for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) if (im.alpha(i * F + x, y) >= 128) return false; return true; };
  while (n > 1 && empty(n - 1)) n--;
  const t = new Img(n * F, F); t.blit(im, 0, 0, n * F, F, 0, 0); hardAlpha(t);
  for (let i = 0; i < n; i++) if (empty(i)) fail(`${e.key}: khung ${i} trống giữa dải`);
  const c = colors(t); if (c > PORTRAIT_MAX_COLORS) fail(`${e.key}: ${c} màu, tối đa ${PORTRAIT_MAX_COLORS}`);
  const rel = `iso/fx/${m[1]}.png`; mkdirSync(path.join(SPRITES, "iso", "fx"), { recursive: true });
  writeFileSync(path.join(SPRITES, rel), encodePng(t));
  done.push({ key: e.key, entry: { key: e.key, frame: [F, F], iso: true }, e, img: t, change: `${n} khung ${F}×${F} của \`${e.file}\`, giữ màu gốc` });
  console.log(`[lpc-item] ${e.key}: ${n} khung ${F}×${F}, ${c} màu → ${rel}`);
}

// ---------- Manifest ----------
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")), keyOf = (x) => (typeof x === "string" ? x : x.key);
for (const { key, entry } of done) {
  const i = manifest.sprites.findIndex((x) => keyOf(x) === key);
  if (i >= 0) manifest.sprites.splice(i, 1);
  manifest.sprites.push(entry);
}
manifest.sprites.sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

// ---------- Ghi công ----------
const CREDITS = path.join(ROOT, "art", "CREDITS.md");
const START = "<!-- lpc-item:start -->", END = "<!-- lpc-item:end -->";
const HEAD = ["| Key | Tác giả | Giấy phép của gói (game dùng giấy phép in đậm) | Nguồn, thay đổi |", "|---|---|---|---|"];
const rows = done.map(({ key, e, change }) => {
  const p = recipe.packs[e.pack], { use, flags } = licenseUse(p.licenses);
  return `| \`${key}\` | ${e.by} | ${p.licenses.map((l) => (use.includes(l) ? `**${l}**` : l)).join(", ")}${flags.length ? ` (cờ ${flags.join(", ")})` : ""} | [${p.title}](${p.url}): ${e.part}; ${change} |`;
});
let doc = readFileSync(CREDITS, "utf8");
const nS = doc.split(START).length - 1, nE = doc.split(END).length - 1;
if (nS > 1 || nS !== nE || (nS && doc.indexOf(END) < doc.indexOf(START))) fail(`art/CREDITS.md: cần đúng một cặp ${START} … ${END} (đang có ${nS} start, ${nE} end)`);
if (!nS) doc = `${doc}${doc.endsWith("\n") ? "" : "\n"}\n## Biểu tượng vật phẩm và hiệu ứng từ gói LPC (OpenGameArt)\nVùng này do \`tools/assets/lpc-item.mjs\` ghi theo \`art/src/lpc-item.json\`, không sửa tay.\n\n${START}\n${END}\n`;
const old = doc.slice(doc.indexOf(START) + START.length, doc.indexOf(END)).split("\n").filter((l) => /^\| `(item|fx)_/.test(l));
const keep = old.filter((l) => !done.some((d) => l.startsWith(`| \`${d.key}\``)));
doc = doc.slice(0, doc.indexOf(START) + START.length) + "\n" + [...HEAD, ...[...keep, ...rows].sort()].join("\n") + "\n" + doc.slice(doc.indexOf(END));
writeFileSync(CREDITS, doc);

// ---------- Ảnh xem trước (ngoài repo) ----------
if (previewDir) {
  mkdirSync(previewDir, { recursive: true });
  const K = 6, GRAYC = hex(GRAY_RAMP[3]);
  for (const { key, img } of done) {
    const o = new Img(img.w * K, img.h * K);
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
      const p = img.get(Math.floor(x / K), Math.floor(y / K)), chk = ((x >> 3) + (y >> 3)) & 1 ? GRAYC : [255, 255, 255];
      o.set(x, y, p[3] ? p : [...chk, 255]);
    }
    writeFileSync(path.join(previewDir, `${key}.png`), encodePng(o));
  }
}
console.log(`[lpc-item] ${done.length} key → manifest.json, ghi công art/CREDITS.md`);
