// Dùng chung cho ui-sheet-check.mjs / ui-sheet-cut.mjs (#879, theo dõi #877; docs/art/ui-kit.md mục "Công cụ tờ UI").
// Gồm: đọc manifest art/src/ui-kit/ui-kit.json, phân loại cỡ tờ theo tỉ lệ, tách mảnh (TÁI DÙNG dò lưới của beast-sheet-grid
// và khoá nền / gỡ viền của beast-sheet-cut), hạ lưới, bảng màu, dựng gương, và các phép đo khung (độ dày viền, vạch 9-slice,
// cạnh phẳng, đối xứng góc, chữ lạc). Mọi hàm thuần và tất định (cùng đầu vào → cùng byte) để cắt lại ra đúng file cũ.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT, Img, hex, toHex } from "./lib.mjs";
import { median } from "./beast-sheet-stats.mjs";
import { detectGrid } from "./beast-sheet-grid.mjs";
import { foregroundMask, components } from "./beast-sheet-cut.mjs";

export const KIT_DIR = path.join(ROOT, "art", "src", "ui-kit");
export const KIT_JSON = path.join(KIT_DIR, "ui-kit.json");
export const RATIO_TOL = 0.01;
/** Dung sai màu (kênh lệch nhất) khi so hai điểm ảnh của kit. */
export const TOL = 40;

export const loadKit = (file = KIT_JSON) => JSON.parse(readFileSync(file, "utf8"));
export const saveKit = (kit, file = KIT_JSON) => writeFileSync(file, JSON.stringify(kit, null, 2) + "\n");

/** Loại tờ từ tên file: `toF.png`, `F.png`, `F-2.png`, `BOARD.png`; null nếu không suy ra được. */
export function kindFromName(file) {
  const m = /^(?:to)?(BOARD|[FNOTID])(?:[-_.]?\d+)?$/i.exec(path.basename(file, path.extname(file)));
  return m ? m[1].toUpperCase() : null;
}

/** Spec một loại tờ, danh sách mảnh theo thứ tự đọc (hàng trên → dưới, trái → phải). `layout` chọn bố cục khi có nhiều bố cục. */
export function expandKind(kit, id) {
  const k = kit.kinds[id];
  if (!k) throw new Error(`loại tờ lạ: ${id} (có: ${Object.keys(kit.kinds).join(", ")})`);
  return { id, ...k };
}

/** Phân loại tờ theo tỉ lệ: { id, exact, canon } hoặc null. */
export function classifyUiShape(kit, w, h) {
  for (const [id, s] of Object.entries(kit.shapes)) {
    if (Math.abs(w / h - s.ratio) > RATIO_TOL * s.ratio) continue;
    return { id, exact: s.sizes.some(([sw, sh]) => sw === w && sh === h), canon: s.sizes[0], sizes: s.sizes };
  }
  return null;
}

// ---------- Màu ----------
export const cdist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
const medColor = (cs) => (cs.length ? [0, 1, 2].map((c) => median(cs.map((p) => p[c]))) : null);
export const opaque = (m, x, y) => m.data[(y * m.w + x) * 4 + 3] >= 128;
export const colorAt = (m, x, y) => { const i = (y * m.w + x) * 4; return [m.data[i], m.data[i + 1], m.data[i + 2]]; };
const pxAt = (m, x, y) => (x >= 0 && y >= 0 && x < m.w && y < m.h && opaque(m, x, y) ? colorAt(m, x, y) : null);
/** Điểm ngả hồng-tím như nền khoá (cùng ngưỡng với gỡ viền của beast-sheet-cut). */
export const isPink = (p) => p[0] - p[1] > 40 && p[2] - p[1] > 40;

/** Đếm màu theo ô 3 bit mỗi kênh trên các điểm đặc: số màu chiếm ≥ minShare. */
export function significantColors(imgs, { shift = 5, minShare = 0.005 } = {}) {
  const count = new Map(); let total = 0;
  for (const m of imgs) for (let i = 0; i < m.data.length; i += 4) {
    if (m.data[i + 3] < 128) continue;
    const k = (m.data[i] >> shift) * 4096 + (m.data[i + 1] >> shift) * 64 + (m.data[i + 2] >> shift);
    count.set(k, (count.get(k) ?? 0) + 1); total++;
  }
  let n = 0;
  for (const c of count.values()) if (c >= total * minShare) n++;
  return { n, total, buckets: count.size };
}

/** Bảng màu: ≤ n màu. Ít màu hơn n thì giữ nguyên các màu có thật (nên cắt lại ảnh đã lượng tử ra đúng ảnh cũ); không thì median cut có trọng số, dành 1 ô cho viền mực. */
export function buildPalette(imgs, n, outline) {
  const count = new Map();
  for (const m of imgs) for (let i = 0; i < m.data.length; i += 4) {
    if (m.data[i + 3] < 128) continue;
    const k = (m.data[i] << 16) | (m.data[i + 1] << 8) | m.data[i + 2];
    count.set(k, (count.get(k) ?? 0) + 1);
  }
  const rgb = (k) => [k >> 16, (k >> 8) & 255, k & 255];
  const entries = [...count].sort((a, b) => a[0] - b[0]).map(([k, c]) => ({ c: rgb(k), n: c }));
  let pal;
  if (entries.length <= n) pal = entries.map((e) => e.c);
  else {
    const want = outline ? n - 1 : n, boxes = [entries];
    while (boxes.length < want) {
      let bi = -1, bs = 0;
      boxes.forEach((b, i) => { const s = b.reduce((t, e) => t + e.n, 0); if (b.length > 1 && s > bs) { bs = s; bi = i; } });
      if (bi < 0) break;
      const b = boxes[bi]; let ch = 0, best = -1;
      for (let c = 0; c < 3; c++) { let lo = 255, hi = 0; for (const e of b) { lo = Math.min(lo, e.c[c]); hi = Math.max(hi, e.c[c]); } if (hi - lo > best) { best = hi - lo; ch = c; } }
      b.sort((p, q) => p.c[ch] - q.c[ch] || p.c[0] - q.c[0] || p.c[1] - q.c[1] || p.c[2] - q.c[2]);
      const half = b.reduce((t, e) => t + e.n, 0) / 2; let acc = 0, cut = 1;
      for (let i = 0; i < b.length - 1; i++) { acc += b[i].n; cut = i + 1; if (acc >= half) break; }
      boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut));
    }
    pal = boxes.map((b) => { const s = b.reduce((t, e) => t + e.n, 0); return [0, 1, 2].map((c) => Math.round(b.reduce((t, e) => t + e.c[c] * e.n, 0) / s)); });
    if (outline) pal.push(hex(outline));
  }
  const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  return pal.sort((a, b) => lum(a) - lum(b) || a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}

/** Đổi mọi điểm đặc về màu gần nhất trong bảng; alpha nhị phân. Trả ảnh mới. */
export function quantize(img, pal) {
  const out = new Img(img.w, img.h), memo = new Map();
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 128) continue;
    const k = (img.data[i] << 16) | (img.data[i + 1] << 8) | img.data[i + 2];
    let c = memo.get(k);
    if (!c) {
      let bd = Infinity;
      for (const p of pal) { const d = (p[0] - img.data[i]) ** 2 + (p[1] - img.data[i + 1]) ** 2 + (p[2] - img.data[i + 2]) ** 2; if (d < bd) { bd = d; c = p; } }
      memo.set(k, c);
    }
    out.data[i] = c[0]; out.data[i + 1] = c[1]; out.data[i + 2] = c[2]; out.data[i + 3] = 255;
  }
  return out;
}

// ---------- Hình ----------
/** Hạ lưới theo vùng: mỗi điểm đích = trung bình các điểm đặc trong vùng nguồn; đặc nếu ≥ nửa vùng là đặc. */
export function areaDown(img, div) {
  const ow = Math.max(1, Math.round(img.w / div)), oh = Math.max(1, Math.round(img.h / div)), out = new Img(ow, oh), d = img.data;
  for (let y = 0; y < oh; y++) {
    const y0 = Math.floor((y * img.h) / oh), y1 = Math.max(y0 + 1, Math.floor(((y + 1) * img.h) / oh));
    for (let x = 0; x < ow; x++) {
      const x0 = Math.floor((x * img.w) / ow), x1 = Math.max(x0 + 1, Math.floor(((x + 1) * img.w) / ow));
      let n = 0, o = 0, r = 0, g = 0, b = 0;
      for (let v = y0; v < y1; v++) for (let u = x0; u < x1; u++) {
        n++; const i = (v * img.w + u) * 4;
        if (d[i + 3] >= 128) { o++; r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      }
      if (o * 2 >= n && o) out.set(x, y, [Math.round(r / o), Math.round(g / o), Math.round(b / o), 255]);
    }
  }
  return out;
}

/** Cắt bớt hàng / cột lẻ cuối để cạnh chẵn (hạ 2× → 1× đúng điểm). */
export function evenSize(img) {
  const w = img.w & ~1, h = img.h & ~1;
  if (w === img.w && h === img.h) return img;
  const out = new Img(w, h);
  out.blit(img, 0, 0, w, h, 0, 0);
  return out;
}

/** Dựng đối xứng bốn góc bằng gương: lấy phần tư trên-trái (góc + nửa cạnh + nửa ruột) lật sang ba phần còn lại. */
export function mirrorFold(img) {
  const { w, h } = img, out = new Img(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.set(x, y, img.get(Math.min(x, w - 1 - x), Math.min(y, h - 1 - y)));
  return out;
}

/** Cắt khung `rect` của tờ, chỉ giữ điểm vật (mặt nạ đã gỡ viền), bỏ mảnh vụn rời, thu về hộp bao sát. */
export function cropPiece(img, mask, rect) {
  const { w } = img, sub = new Uint8Array(img.w * img.h);
  for (let y = rect.y0; y <= rect.y1; y++) for (let x = rect.x0; x <= rect.x1; x++) sub[y * w + x] = mask[y * w + x];
  const comps = components(sub, img.w, img.h);
  if (!comps.length) return null;
  const main = comps.reduce((a, b) => (b.area > a.area ? b : a)), keep = comps.filter((c) => c === main || c.area >= main.area * 0.02);
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (const c of keep) { x0 = Math.min(x0, c.x0); y0 = Math.min(y0, c.y0); x1 = Math.max(x1, c.x1); y1 = Math.max(y1, c.y1); }
  const out = new Img(x1 - x0 + 1, y1 - y0 + 1);
  for (const c of keep) for (const i of c.px) out.set((i % w) - x0, ((i / w) | 0) - y0, img.get(i % w, (i / w) | 0));
  return { img: out, x0, y0, dropped: comps.length - keep.length };
}

/** Phát phối bố cục: chọn bố cục khớp số dải, rồi ghép tên mảnh theo thứ tự đọc. */
export function pickLayout(kind, grid) {
  const cands = (kind.layouts ?? []).filter((l) => l.length === grid.bands.length);
  if (!cands.length) return null;
  const miss = (l) => l.reduce((t, n, i) => t + Math.abs(n - grid.bands[i].figures.length), 0);
  return cands.reduce((a, b) => (miss(b) < miss(a) ? b : a));
}

/** Ghép tên: `names` ghi đè tên trong spec. Trả [{ name, set, state, row, col, fig }] cho các hình có tên. */
export function assignNames(kind, layout, grid, names) {
  const list = names ?? kind.pieces.map((p) => p.name), out = [];
  let k = 0;
  grid.bands.forEach((b, row) => {
    for (let c = 0; c < layout[row]; c++, k++) {
      const spec = kind.pieces[k] ?? {}, fig = b.figures[c];
      if (fig) out.push({ name: list[k] ?? `${kind.id.toLowerCase()}_${String(k + 1).padStart(2, "0")}`, set: spec.set ?? null, state: spec.state ?? null, stretch: spec.stretch ?? kind.stretch === true, text: spec.text ?? kind.text === true, row, col: c, fig, index: k });
    }
  });
  return out;
}

/** Hệ số hạ lưới thực: div của loại tờ × (bề ngang tờ / bề ngang chuẩn của tỉ lệ), để 1024² và 1254² ra cùng cỡ mảnh. */
export function effectiveDiv(kind, img, cls, override) {
  return (override ?? kind.div) * (cls ? img.w / cls.canon[0] : 1);
}

/** Mặt nạ vật đã khoá nền và gỡ viền (dùng cho cả kiểm và cắt). */
export function sheetMask(img, key, tol = 60) { return foregroundMask(img, [...key, 255], tol); }

export { detectGrid };

// ---------- Phép đo khung (trên ảnh master, alpha nhị phân) ----------
/** Nhìn một cạnh: at(i, j) = màu (hoặc null nếu trong suốt) ở độ sâu i tính từ cạnh, vị trí j dọc cạnh. */
export function edgeView(m, side) {
  const horiz = side === "top" || side === "bottom", L = horiz ? m.w : m.h, D = horiz ? m.h : m.w;
  const at = (i, j) => {
    const x = side === "top" || side === "bottom" ? j : side === "left" ? i : m.w - 1 - i;
    const y = side === "top" ? i : side === "bottom" ? m.h - 1 - i : j;
    return pxAt(m, x, y);
  };
  return { L, D, at };
}
const SIDES = ["top", "bottom", "left", "right"];

function thickness(v, ref, tol = 36) {
  const half = v.D >> 1, j0 = Math.floor(v.L * 0.25), j1 = Math.floor(v.L * 0.75), sig = new Map();
  const sigAt = (i) => { if (!sig.has(i)) { const cs = []; for (let j = j0; j < j1; j++) { const c = v.at(i, j); if (c) cs.push(c); } sig.set(i, medColor(cs)); } return sig.get(i); };
  for (let i = 0; i < half; i++) {
    let ok = true;
    for (let k = 0; k < 3 && i + k < half; k++) { const s = sigAt(i + k); if (!s || cdist(s, ref) > tol) { ok = false; break; } }
    if (ok) return i;
  }
  return half;
}

/** Điểm xa nhất (trong 25% đầu mỗi bên của cạnh) mà dải mép còn lệch khỏi thân phẳng của nó (hoa văn góc), +1. */
function cornerExtent(v, t, tol) {
  let ext = 0;
  if (t < 1) return 0;
  for (const step of [1, -1]) {
    const s0 = Math.floor(v.L * (step > 0 ? 0.25 : 0.62)), s1 = Math.floor(v.L * (step > 0 ? 0.38 : 0.75)), body = [];
    for (let i = 0; i < t; i++) { const cs = []; for (let j = s0; j < s1; j++) { const c = v.at(i, j); if (c) cs.push(c); } body.push(medColor(cs)); }
    const lo = step > 0 ? 0 : Math.floor(v.L * 0.75), hi = step > 0 ? Math.floor(v.L * 0.25) : v.L;
    for (let j = lo; j < hi; j++) {
      let dev = false;
      for (let i = 0; i < t && !dev; i++) { if (!body[i]) continue; const c = v.at(i, j); dev = !c || cdist(c, body[i]) > tol; }
      if (dev) ext = Math.max(ext, step > 0 ? j + 1 : v.L - j);
    }
  }
  return ext;
}

/** Vạch 9-slice tự đề xuất (nhỏ nhất sao cho ruột và thân cạnh đồng nhất): { nine, thickness, cornerExt }. */
export function suggestNine(m, tol = TOL) {
  const cs = [];
  for (let y = Math.floor(m.h * 0.35); y < Math.ceil(m.h * 0.65); y++) for (let x = Math.floor(m.w * 0.35); x < Math.ceil(m.w * 0.65); x++) { const c = pxAt(m, x, y); if (c) cs.push(c); }
  const ref = medColor(cs);
  if (!ref || Math.min(m.w, m.h) < 6) return { nine: Math.max(1, Math.min(m.w, m.h) >> 1), thickness: 0, cornerExt: 0, sides: {} };
  let t = 0, ext = 0; const sides = {};
  for (const s of SIDES) {
    const v = edgeView(m, s), ts = thickness(v, ref), es = cornerExtent(v, ts, tol);
    sides[s] = { thickness: ts, cornerExt: es }; t = Math.max(t, ts); ext = Math.max(ext, es);
  }
  const cap = (Math.min(m.w, m.h) >> 1) - 1;
  return { nine: Math.max(1, Math.min(cap, Math.max(t, ext))), thickness: t, cornerExt: ext, sides };
}

/** Kéo 9-slice (lấy mẫu gần nhất) tới W×H: bốn góc `s` giữ nguyên, thân cạnh và ruột giãn. */
export function nineSliceRender(m, s, W, H) {
  const out = new Img(W, H), map = (v, size, src) => (v < s ? v : v >= size - s ? src - (size - v) : s + Math.floor(((v - s) * (src - 2 * s)) / Math.max(1, size - 2 * s)));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out.set(x, y, m.get(Math.min(m.w - 1, map(x, W, m.w)), Math.min(m.h - 1, map(y, H, m.h))));
  return out;
}

/** Độ phẳng thân cạnh: tỉ lệ điểm trong dải mép (độ sâu depth, thường là độ dày viền; bỏ hai góc và vùng đầu giữa cạnh) lệch khỏi màu trung vị của hàng ≥ tol. Trả max bốn cạnh, hoặc null nếu không đo được. */
export function edgeFlatness(m, s, depth = s, tol = TOL) {
  let worst = null;
  for (const side of SIDES) {
    const v = edgeView(m, side), j0 = s, j1 = v.L - s, capLo = Math.floor(v.L * 0.38), capHi = Math.ceil(v.L * 0.62);
    if (j1 - j0 < 8 || depth < 1 || depth >= v.D / 2) continue;
    let bad = 0, n = 0;
    for (let i = 0; i < depth; i++) {
      const cs = [];
      for (let j = j0; j < j1; j++) if (j < capLo || j >= capHi) { const c = v.at(i, j); if (c) cs.push(c); }
      const med = medColor(cs);
      for (let j = j0; j < j1; j++) {
        if (j >= capLo && j < capHi) continue;
        n++; const c = v.at(i, j);
        if (!med || !c || cdist(c, med) > tol) bad++;
      }
    }
    if (n) worst = Math.max(worst ?? 0, bad / n);
  }
  return worst;
}

/** Sai lệch bốn góc: góc trên-trái s×s so với ba góc kia lật gương (tỉ lệ điểm khác, trung bình). */
export function cornerAsymmetry(m, s, tol = TOL) {
  if (2 * s > m.w || 2 * s > m.h || s < 1) return null;
  let sum = 0;
  for (const [fx, fy] of [[1, 0], [0, 1], [1, 1]]) {
    let diff = 0, n = 0;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const a = pxAt(m, x, y), b = pxAt(m, fx ? m.w - 1 - x : x, fy ? m.h - 1 - y : y);
      if (!a && !b) continue;
      n++; if (!a || !b || cdist(a, b) > tol) diff++;
    }
    sum += n ? diff / n : 0;
  }
  return sum / 3;
}

/**
 * Chữ lạc (heuristic, chỉ cảnh báo): trong ruột (cách mép `s`), thành phần liên thông nhỏ lệch màu nền ruột mà ≥ 3 cái thẳng hàng,
 * cao gần bằng nhau. Trả danh sách ô nghi ngờ [{ x, y, w, h, n }].
 */
export function strayText(m, s) {
  const x0 = s + 1, y0 = s + 1, x1 = m.w - s - 1, y1 = m.h - s - 1, ih = y1 - y0;
  if (x1 - x0 < 12 || ih < 8) return [];
  const cs = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const c = pxAt(m, x, y); if (c) cs.push(c); }
  const ref = medColor(cs), mask = new Uint8Array(m.w * m.h);
  if (!ref) return [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const c = pxAt(m, x, y); if (c && cdist(c, ref) > 70) mask[y * m.w + x] = 1; }
  const comps = components(mask, m.w, m.h);
  if (comps.length > 60) return [];
  const glyphs = comps.map((c) => ({ x: c.x0, y: c.y0, w: c.x1 - c.x0 + 1, h: c.y1 - c.y0 + 1, area: c.area }))
    .filter((g) => g.area >= 3 && g.h >= 4 && g.h <= Math.max(8, ih * 0.6) && g.w <= g.h * 2.5 && g.w * 5 >= g.h);
  const out = [];
  for (const g of glyphs) {
    const line = glyphs.filter((o) => Math.abs(o.y + o.h / 2 - (g.y + g.h / 2)) <= g.h * 0.35 && o.h <= g.h * 2 && o.h * 2 >= g.h);
    if (line.length >= 3 && !out.some((r) => Math.abs(r.y - g.y) <= g.h)) {
      const xa = Math.min(...line.map((o) => o.x)), xb = Math.max(...line.map((o) => o.x + o.w));
      out.push({ x: xa, y: Math.min(...line.map((o) => o.y)), w: xb - xa, h: g.h, n: line.length });
    }
  }
  return out;
}

/** Hai ảnh (cỡ gần nhau) khác nhau bao nhiêu: tỉ lệ điểm khác trên cỡ nhỏ hơn; null nếu cỡ lệch quá 4%. */
export function pieceDiff(a, b, tol = 24) {
  if (Math.abs(a.w - b.w) > Math.max(1, a.w * 0.04) || Math.abs(a.h - b.h) > Math.max(1, a.h * 0.04)) return null;
  const w = Math.min(a.w, b.w), h = Math.min(a.h, b.h);
  let n = 0, d = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = pxAt(a, x, y), q = pxAt(b, x, y);
    if (!p && !q) continue;
    n++; if (!p || !q || cdist(p, q) > tol) d++;
  }
  return n ? d / n : 0;
}

/** Điểm viền (đặc, có hàng xóm trong suốt) còn ngả hồng sau khi khoá nền: { edge, pink }. */
export function pinkFringe(m) {
  let edge = 0, pink = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (!opaque(m, x, y)) continue;
    const touches = x === 0 || y === 0 || x === m.w - 1 || y === m.h - 1 || !opaque(m, x - 1, y) || !opaque(m, x + 1, y) || !opaque(m, x, y - 1) || !opaque(m, x, y + 1);
    if (!touches) continue;
    edge++; if (isPink(colorAt(m, x, y))) pink++;
  }
  return { edge, pink };
}

export const hexOf = toHex;
