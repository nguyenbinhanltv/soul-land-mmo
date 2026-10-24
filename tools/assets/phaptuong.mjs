// Pháp tướng Võ Hồn Chân Thân (#482, H1 #485): khung PixelLab 128×128 → sheet 160×160, 5 hướng × (idle 8, attack 8), hư ảnh + viền sáng.
//   node tools/assets/phaptuong.mjs --id <mã võ hồn> [--src <thư mục>] [--code idle,attack] [--out <file.png>] [--preview <file.png>]
//
// Nguồn ảnh (mặc định `art/src/pixellab/phap_tuong/<id>/`, đọc cả `recipe.json` cùng thư mục):
//   - `<hướng>_idle_NN.png`, `<hướng>_attack_NN.png`: khung 128×128 từ `animate-with-text-v3` (hướng s, se, e, ne, n; NN từ 00);
//   - `<hướng>.png`: ảnh tĩnh 128×128 của hướng đó (từ `generate-8-rotations-v3`). Cùng với `--code idle,attack` (hoặc recipe `code`),
//     công cụ dựng hoạt ảnh bằng code cho vật cứng (búa, tháp...): idle nhấp nhô + xoay nhẹ + sáng nhịp, attack nhấc lên rồi nện xuống
//     kèm bụi và vết nứt. Không tốn lượt PixelLab.
// Hậu kỳ mỗi hướng: hộp bao (alpha > ALPHA_MIN) hợp của cả 16 khung đặt sao cho giữa-đáy hộp trùng gốc PT_ORIGIN (cùng hộp cho idle và
// attack nên gốc không nhảy giữa hai hoạt ảnh); điểm alpha ≤ PT_ALPHA_MIN bỏ, còn lại đục 255 (độ đục hư ảnh do client áp, `pt.ghost` ở
// manifest); viền sáng 2 điểm màu `col` của võ hồn (VOHON) quanh hình (điểm ngoài dithering); cả sheet giảm còn PT_MAX_COLORS màu
// (median cut). Bố cục sheet: isoLayout("phaptuong") trong lib.mjs.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { ROOT, SPRITES, Img, readPng, encodePng, hex, vohonColors, ISO_DIRS, isoLayout, PT_FRAME, PT_ORIGIN, PT_ALPHA_MIN, PT_MAX_COLORS, toHex, OUTLINE } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const id = opt("--id", ""), codeOpt = opt("--code", ""), previewOut = opt("--preview", "");
const fail = (m) => { console.error(`[phaptuong] ${m}`); process.exit(1); };
if (!id) fail("Cách dùng: phaptuong.mjs --id <mã võ hồn> [--src <thư mục>] [--code idle,attack] [--out <file.png>] [--preview <file.png>]");
const src = opt("--src", path.join(ROOT, "art", "src", "pixellab", "phap_tuong", id));
const out = opt("--out", path.join(SPRITES, "phaptuong", `${id}.png`));
const recipe = existsSync(path.join(src, "recipe.json")) ? JSON.parse(readFileSync(path.join(src, "recipe.json"), "utf8")) : {};
const code = new Set((codeOpt || (recipe.code ?? []).join(",")).split(",").filter(Boolean));
const colors = vohonColors(id);
if (!colors) fail(`không có võ hồn "${id}" trong VOHON`);
const COL = hex(colors[0]);
const L = isoLayout("phaptuong");
const [N_IDLE, N_ATK] = [L.anims.idle[1], L.anims.attack[1]];
const OUTLINE_RGB = hex("#1a1020");

// ---------- Hoạt ảnh bằng code cho vật cứng (0 lượt PixelLab) ----------
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
/** Xoay `deg` độ quanh (cx, cy) rồi dời dy, láng giềng gần nhất (không làm mờ pixel). */
function xform(im, deg, cx, cy, dy, bright = 1) {
  const o = new Img(im.w, im.h), a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const X = x - cx, Y = y - dy - cy, u = Math.round(c * X + s * Y + cx), v = Math.round(-s * X + c * Y + cy);
    if (u < 0 || v < 0 || u >= im.w || v >= im.h) continue;
    const p = im.get(u, v);
    if (p[3]) o.set(x, y, [Math.min(255, p[0] * bright), Math.min(255, p[1] * bright), Math.min(255, p[2] * bright), p[3]]);
  }
  return o;
}
/** Đệm 16 điểm mỗi phía để xoay / nhấc không cắt hình (hậu kỳ tính hộp bao và đặt lại theo gốc). */
const PAD = 16;
const pad = (im) => { const o = new Img(im.w + 2 * PAD, im.h + 2 * PAD); o.blit(im, 0, 0, im.w, im.h, PAD, PAD); return o; };
const codeIdle = (st) => Array.from({ length: N_IDLE }, (_, i) => {
  const t = (i / N_IDLE) * 2 * Math.PI;
  return xform(st, Math.sin(t) * 1.2, 64 + PAD, 118 + PAD, Math.round(Math.sin(t) * 2), 1 + 0.12 * (Math.sin(t) + 1) / 2);
});
const ATK_POSE = [[0, 0], [5, 0], [9, -1], [9, -1], [-8, 4], [-5, 5], [-2, 3], [0, 1]]; // [độ xoay, dy] mỗi khung
const codeAttack = (st, seed) => ATK_POSE.slice(0, N_ATK).map(([deg, dy], i) => {
  const im = xform(st, deg, 64 + PAD, 110 + PAD, dy);
  if (i >= 4) { // vết nứt dưới đáy, rồi bụi bay lên
    const n = Math.min(3, i - 3);
    for (const sgn of [-1, 1]) for (let k = 0; k <= n; k++) im.set(64 + PAD + sgn * 8 * k, 118 + PAD + (k % 2), [...OUTLINE_RGB, 255]);
    const r = mulberry(seed + i), t = (i - 3) / 4;
    for (let k = 0; k < 14; k++) {
      const ang = r() * Math.PI, sp = (8 + r() * 26) * t, x = Math.round(64 + PAD + Math.cos(ang) * sp * (k % 2 ? 1 : -1)), y = Math.round(116 + PAD - Math.sin(ang) * sp * 0.6);
      const c = k % 3 ? [170, 170, 185] : [240, 240, 250];
      for (const [dx, dy2] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (x + dx >= 0 && x + dx < im.w && y + dy2 >= 0 && y + dy2 < im.h) im.set(x + dx, y + dy2, [...c, Math.round(255 * (1 - t * 0.7))]);
    }
  }
  return im;
});

// ---------- Nạp khung ----------
const loadFrames = (d, anim, n) => Array.from({ length: n }, (_, i) => {
  const f = path.join(src, `${d}_${anim}_${String(i).padStart(2, "0")}.png`);
  if (!existsSync(f)) fail(`thiếu ${f}`);
  return readPng(f);
});
function framesOf(d, anim, n, seed) {
  if (code.has(anim)) {
    const f = path.join(src, `${d}.png`);
    if (!existsSync(f)) fail(`--code ${anim} cần ảnh tĩnh ${f}`);
    const st = pad(readPng(f));
    return anim === "idle" ? codeIdle(st) : codeAttack(st, seed);
  }
  return loadFrames(d, anim, n);
}

// ---------- Hậu kỳ ----------
const solid = (im, x, y) => x >= 0 && y >= 0 && x < im.w && y < im.h && im.alpha(x, y) > PT_ALPHA_MIN;
function bake(frames, ox, oy) {
  return frames.map((f) => {
    const o = new Img(PT_FRAME, PT_FRAME), body = (x, y) => solid(f, x - ox, y - oy);
    for (let y = 0; y < PT_FRAME; y++) for (let x = 0; x < PT_FRAME; x++) {
      if (body(x, y)) { const p = f.get(x - ox, y - oy); o.set(x, y, [p[0], p[1], p[2], 255]); continue; }
      let d = 3; // khoảng cách Chebyshev tới điểm thân gần nhất (chỉ cần tới 2)
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (body(x + dx, y + dy)) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
      if (d === 1 || (d === 2 && (x + y) % 2 === 0)) o.set(x, y, [...COL, 255]);
    }
    return o;
  });
}
/** Median cut theo số điểm: giảm sheet còn tối đa `max` màu, mỗi hộp màu thay bằng điểm thật gần trung bình nhất (như lpc-item.mjs). */
function quantize(t, max) {
  const count = new Map();
  for (let i = 0; i < t.data.length; i += 4) if (t.data[i + 3]) { const c = toHex([t.data[i], t.data[i + 1], t.data[i + 2]]); count.set(c, (count.get(c) ?? 0) + 1); }
  if (count.size <= max) return count.size;
  const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const keep = new Set([hex(OUTLINE).join(","), COL.join(",")]); // viền #1a1020 và màu viền sáng giữ nguyên
  let boxes = [[...count].filter(([c]) => !keep.has(hex(c).join(","))).map(([c, n]) => ({ p: hex(c), n, c }))];
  while (boxes.length < max - keep.size) {
    let bi = -1, best = 0, axis = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      const span = [0, 1, 2].map((k) => Math.max(...b.map((x) => x.p[k])) - Math.min(...b.map((x) => x.p[k])));
      const a = span.indexOf(Math.max(...span)), score = span[a] * b.reduce((m, x) => m + x.n, 0);
      if (score > best) { best = score; bi = i; axis = a; }
    });
    if (bi < 0) break;
    const b = boxes[bi].sort((x, y) => x.p[axis] - y.p[axis]), half = b.reduce((m, x) => m + x.n, 0) / 2;
    let acc = 0, cut = 1; for (let i = 0; i < b.length - 1; i++) { acc += b[i].n; if (acc >= half) { cut = i + 1; break; } }
    boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut));
  }
  const map = new Map();
  for (const b of boxes) {
    const N = b.reduce((m, x) => m + x.n, 0), mean = [0, 1, 2].map((k) => b.reduce((m, x) => m + x.p[k] * x.n, 0) / N);
    const rep = b.reduce((a, x) => (dist(x.p, mean) < dist(a.p, mean) ? x : a)).p;
    for (const x of b) map.set(x.c, rep);
  }
  for (let i = 0; i < t.data.length; i += 4) {
    if (!t.data[i + 3]) continue;
    const r = map.get(toHex([t.data[i], t.data[i + 1], t.data[i + 2]])); if (r) [t.data[i], t.data[i + 1], t.data[i + 2]] = r;
  }
  return max;
}

const sheet = new Img(PT_FRAME * L.cols, PT_FRAME * L.rows);
ISO_DIRS.forEach((d, row) => {
  const idle = framesOf(d, "idle", N_IDLE, 11), atk = framesOf(d, "attack", N_ATK, 29), all = [...idle, ...atk];
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (const f of all) for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.alpha(x, y) > PT_ALPHA_MIN) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) fail(`hướng ${d} trống`);
  const ox = PT_ORIGIN[0] - Math.floor((x0 + x1 + 1) / 2), oy = PT_ORIGIN[1] - (y1 + 1);
  bake(all, ox, oy).forEach((b, i) => {
    const col = i < N_IDLE ? L.anims.idle[0] + i : L.anims.attack[0] + (i - N_IDLE);
    sheet.blit(b, 0, 0, PT_FRAME, PT_FRAME, col * PT_FRAME, row * PT_FRAME);
  });
});
const nColors = quantize(sheet, PT_MAX_COLORS);
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, encodePng(sheet));
console.log(`[phaptuong] ${id}: ${path.relative(ROOT, out)} (${sheet.w}×${sheet.h}, ${nColors} màu)`);
if (previewOut) {
  const pv = new Img(sheet.w, sheet.h);
  for (let i = 0; i < pv.data.length; i += 4) { pv.data[i] = 58; pv.data[i + 1] = 62; pv.data[i + 2] = 74; pv.data[i + 3] = 255; }
  for (let y = 0; y < sheet.h; y++) for (let x = 0; x < sheet.w; x++) { const p = sheet.get(x, y); if (p[3]) { const q = pv.get(x, y), a = p[3] / 255; pv.set(x, y, [0, 1, 2].map((k) => Math.round(p[k] * a + q[k] * (1 - a))).concat(255)); } }
  writeFileSync(previewOut, encodePng(pv));
}
