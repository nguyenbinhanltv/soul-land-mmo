// Thuật toán chuyển ảnh RAW (ChatGPT / Codex) của võ hồn v2 thành pixel thật (#1087, epic #1020; docs/art/vo-hon-phong-cach.md phần 6.1).
// Model không làm được lưới pixel, nên bước này việc của công cụ: cắt vùng quan trọng → bỏ phiếu màu theo khối (không nội suy) → ép bảng màu →
// khử "độ mềm" (gộp sắc độ, bỏ cụm điểm lẻ, làm cứng cạnh) → viền ngoài #1a1020. Dùng cho vohon-pixelize / vohon-check / vohon-preview.
// Hằng ở đây là hằng công cụ, KHÔNG phải số cân bằng (shared/data.ts). Giới hạn màu lấy từ lib.mjs (PORTRAIT_MAX_COLORS, PT_MAX_COLORS).
import { Img, hex, OUTLINE, ISO_PORTRAIT, PORTRAIT_MAX_COLORS, PT_FRAME, PT_MAX_COLORS } from "./lib.mjs";

export const OUT = hex(OUTLINE);
export const TYPES = ["portrait", "icon", "phaptuong"];
export const TYPE_VI = { portrait: "chân dung / thẻ", icon: "icon", phaptuong: "pháp tướng" };
/** Cỡ ra theo loại: chân dung 64, icon 32 và 24, pháp tướng khung 160 (hoặc 128 cho concept). */
export const PORTRAIT_SIZE = ISO_PORTRAIT, ICON_SIZES = [32, 24];
export const MAX_COLORS = { portrait: PORTRAIT_MAX_COLORS, icon: PORTRAIT_MAX_COLORS, phaptuong: PT_MAX_COLORS };
/**
 * Khung pháp tướng: `origin` giữa-đáy (khớp phap-tuong-cong-thuc.md mục 5: gốc (80, 124) ở khung 160), `fitW` / `fitH` = hộp tối đa của hình (kể cả viền),
 * chừa chỗ cho viền sáng 2 điểm và nhấc / nện của hậu kỳ (`phaptuong.mjs`). Khung 128 là khung concept (đệm 16 mỗi phía).
 */
export const PT_FRAMES = { 160: { origin: [80, PT_FRAME - 36], fitW: 144, fitH: 112 }, 128: { origin: [64, 112], fitW: 96, fitH: 96 } };
export const PT_DIRS = ["s", "se", "e", "ne", "n"];

export const luma = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
export const sat = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
/** Độ "phát sáng" 0..1: sáng và (hơi) bão hòa. Điểm phát sáng được ưu tiên khi bỏ phiếu và khi ép màu để mắt, lõi, nét đạo văn không bị dòng tối nuốt. */
export const glow = (r, g, b) => { const v = Math.max(r, g, b) / 255; return v * v * (0.5 + 0.5 * sat(r, g, b)); };
export const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const keyOf = (r, g, b) => ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);

// ---------- Cắt, bỏ nền ----------
/** Vùng cắt hình vuông quanh `focus` (tỉ lệ 0..1) với `zoom` ≥ 1 (1 = cả cạnh ngắn): { x, y, w, h } theo điểm ảnh nguồn. */
export function squareCrop(img, { focus = [0.5, 0.5], zoom = 1 } = {}) {
  const s = Math.round(Math.min(img.w, img.h) / Math.max(1, zoom));
  const x = Math.max(0, Math.min(img.w - s, Math.round(focus[0] * img.w - s / 2))), y = Math.max(0, Math.min(img.h - s, Math.round(focus[1] * img.h - s / 2)));
  return { x, y, w: s, h: s };
}
export function crop(img, { x, y, w, h }) {
  if (x < 0 || y < 0 || w < 1 || h < 1 || x + w > img.w || y + h > img.h) throw new Error(`vùng cắt ${x},${y},${w},${h} nằm ngoài ảnh ${img.w}×${img.h}`);
  const o = new Img(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const s = img.idx(x + i, y + j), d = o.idx(i, j); o.data.set(img.data.subarray(s, s + 4), d); }
  return o;
}

/** Màu nền ước lượng từ viền ảnh (trung vị từng kênh) và phần viền gần màu đó. null nếu ảnh có alpha thật ở viền. */
export function borderKey(img) {
  const px = [], d = img.data;
  const add = (x, y) => { const i = img.idx(x, y); px.push([d[i], d[i + 1], d[i + 2], d[i + 3]]); };
  for (let x = 0; x < img.w; x++) { add(x, 0); add(x, img.h - 1); }
  for (let y = 1; y < img.h - 1; y++) { add(0, y); add(img.w - 1, y); }
  const clear = px.filter((p) => p[3] < 128).length / px.length;
  const med = (c) => px.map((p) => p[c]).sort((a, b) => a - b)[px.length >> 1];
  const key = [med(0), med(1), med(2)];
  const near = (tol) => px.filter((p) => p[3] >= 128 && dist(p, key) <= tol).length / px.length;
  return { key, clear, near40: near(40), near70: near(70) };
}

/** Bỏ nền: điểm nối với mép ảnh và gần `key` (±tol) → trong suốt; điểm alpha thấp cũng trong suốt. `key` = null: chỉ lấy alpha. Trả số điểm bỏ. */
export function removeBg(img, key, tol = 48) {
  const { w, h, data: d } = img, seen = new Uint8Array(w * h), stack = [];
  const bg = (i) => d[i + 3] < 128 || (key && dist([d[i], d[i + 1], d[i + 2]], key) <= tol);
  const push = (x, y) => { const p = y * w + x; if (!seen[p] && bg(p * 4)) { seen[p] = 1; stack.push(p); } };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop(), x = p % w, y = (p / w) | 0;
    if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
  }
  let n = 0;
  for (let p = 0; p < w * h; p++) { if (seen[p]) { d[p * 4 + 3] = 0; n++; } else if (d[p * 4 + 3] < 128) { d[p * 4 + 3] = 0; n++; } else d[p * 4 + 3] = 255; }
  return n;
}
/** Hộp bao của điểm đục (alpha ≥ 128), hoặc null nếu ảnh trống. */
export function bbox(img) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[img.idx(x, y) + 3] >= 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// ---------- Bỏ phiếu màu theo khối ----------
/**
 * Thu `img` về W×H bằng bỏ phiếu: mỗi ô đích gom các điểm nguồn rơi vào ô, gán điểm vào thùng màu 16 mức mỗi kênh, thùng nhiều phiếu nhất thắng
 * (không trung bình khác màu, nên không có màu "bùn" và cạnh không mờ); điểm phát sáng được nhân phiếu `1 + accent·glow`. Màu ra = trung bình thùng thắng.
 * Ô có dưới nửa điểm đục thì trong suốt. Không nội suy.
 */
export function voteDown(img, W, H, { accent = 1.5 } = {}) {
  const out = new Img(W, H), { w: sw, h: sh, data: d } = img;
  for (let oy = 0; oy < H; oy++) {
    const y0 = Math.floor((oy * sh) / H), y1 = Math.max(y0 + 1, Math.ceil(((oy + 1) * sh) / H));
    for (let ox = 0; ox < W; ox++) {
      const x0 = Math.floor((ox * sw) / W), x1 = Math.max(x0 + 1, Math.ceil(((ox + 1) * sw) / W));
      const bins = new Map(); let total = 0, opaque = 0;
      for (let y = y0; y < Math.min(y1, sh); y++) for (let x = x0; x < Math.min(x1, sw); x++) {
        const i = (y * sw + x) * 4; total++;
        if (d[i + 3] < 128) continue;
        opaque++;
        const r = d[i], g = d[i + 1], b = d[i + 2], k = keyOf(r, g, b);
        let e = bins.get(k); if (!e) bins.set(k, (e = { w: 0, n: 0, r: 0, g: 0, b: 0 }));
        e.w += 1 + accent * glow(r, g, b); e.n++; e.r += r; e.g += g; e.b += b;
      }
      if (opaque * 2 < total || !opaque) continue;
      let best = null; for (const e of bins.values()) if (!best || e.w > best.w) best = e;
      out.set(ox, oy, [Math.round(best.r / best.n), Math.round(best.g / best.n), Math.round(best.b / best.n), 255]);
    }
  }
  return out;
}
/** Thu về W×H theo hai chặng: bỏ phiếu về 4W×4H rồi 4×4 điểm một ô về W×H (ảnh nguồn nhỏ hơn 4W thì một chặng). */
export function pixelizeDown(img, W, H, opt = {}) {
  if (img.w < W * 4 || img.h < H * 4) return voteDown(img, W, H, opt);
  return voteDown(voteDown(img, W * 4, H * 4, opt), W, H, opt);
}

// ---------- Bảng màu ----------
/** Cắt trung vị có trọng số trên danh sách [r, g, b, trọng số]. */
function medianCutW(colors, n) {
  const boxes = [colors];
  while (boxes.length < n) {
    let bi = -1, bs = 0;
    boxes.forEach((b, i) => { if (b.length > 1) { const s = b.reduce((a, c) => a + c[3], 0); if (s > bs) { bs = s; bi = i; } } });
    if (bi < 0) break;
    const b = boxes[bi]; let ch = 0, best = -1;
    for (let c = 0; c < 3; c++) { let lo = 255, hi = 0; for (const p of b) { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c]; } if (hi - lo > best) { best = hi - lo; ch = c; } }
    b.sort((p, q) => p[ch] - q[ch]);
    const half = b.reduce((a, c) => a + c[3], 0) / 2; let acc = 0, cut = 1;
    for (let i = 0; i < b.length - 1; i++) { acc += b[i][3]; cut = i + 1; if (acc >= half) break; }
    boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut));
  }
  return boxes.map((b) => { const s = b.reduce((a, c) => a + c[3], 0) || 1; return [0, 1, 2].map((c) => Math.round(b.reduce((a, p) => a + p[c] * p[3], 0) / s)); });
}
/** Các màu duy nhất (điểm đục) của `imgs`: Map khóa "r,g,b" → số điểm. */
export function colorCounts(imgs) {
  const m = new Map();
  for (const img of [].concat(imgs)) for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3] >= 128) { const k = img.data[i] + "," + img.data[i + 1] + "," + img.data[i + 2]; m.set(k, (m.get(k) ?? 0) + 1); }
  return m;
}
/**
 * Bảng ≤ n màu cho `imgs`. `mode` "auto" = cắt trung vị (trọng số √số điểm × (1 + 2·glow): màu hiếm mà sáng như mắt, lõi vẫn có chỗ);
 * "gpl" = chỉ chọn trong `pool` (art/palette.gpl + màu võ hồn). Rồi gộp sắc độ: hai màu gần nhau hơn `merge` (khoảng cách RGB) thành một.
 */
export function buildPalette(imgs, n, { mode = "auto", pool = [], merge = 0 } = {}) {
  const counts = colorCounts(imgs), cols = [...counts].map(([k, c]) => { const [r, g, b] = k.split(",").map(Number); return [r, g, b, c]; });
  if (!cols.length) return [];
  let pal;
  if (mode === "gpl") {
    if (!pool.length) throw new Error("--palette gpl cần bảng màu (art/palette.gpl) trống");
    const use = new Map();
    for (const [r, g, b, c] of cols) { const j = nearest([r, g, b], pool); use.set(j, (use.get(j) ?? 0) + Math.sqrt(c) * (1 + 2 * glow(r, g, b))); }
    pal = [...use].sort((a, b) => b[1] - a[1]).slice(0, n).map(([j]) => pool[j]);
  } else pal = medianCutW(cols.map(([r, g, b, c]) => [r, g, b, Math.sqrt(c) * (1 + 2 * glow(r, g, b))]), n);
  if (merge > 0) {
    let again = true;
    while (again) {
      again = false;
      for (let i = 0; i < pal.length && !again; i++) for (let j = i + 1; j < pal.length; j++) {
        if (dist(pal[i], pal[j]) < merge) { pal[i] = pal[i].map((v, c) => Math.round((v + pal[j][c]) / 2)); pal.splice(j, 1); again = true; break; }
      }
    }
  }
  return pal;
}
export function nearest(p, pal) { let bi = 0, bd = Infinity; for (let i = 0; i < pal.length; i++) { const dd = dist(p, pal[i]); if (dd < bd) { bd = dd; bi = i; } } return bi; }

/** Ảnh → mảng chỉ số bảng (-1 = trong suốt). */
export function toIndexed(img, pal) {
  const idx = new Int16Array(img.w * img.h).fill(-1);
  for (let p = 0; p < idx.length; p++) { const i = p * 4; if (img.data[i + 3] >= 128) idx[p] = nearest([img.data[i], img.data[i + 1], img.data[i + 2]], pal); }
  return idx;
}
export function fromIndexed(idx, W, H, pal) {
  const img = new Img(W, H);
  for (let p = 0; p < idx.length; p++) if (idx[p] >= 0) img.set(p % W, (p / W) | 0, [...pal[idx[p]], 255]);
  return img;
}

// ---------- Khử "độ mềm" ----------
/**
 * Làm cứng ảnh đã ép bảng (chỉ số): (1) cụm 4-liền cùng màu nhỏ hơn `minCluster` điểm bị gộp vào màu láng giềng nhiều nhất, trừ màu phát sáng
 * (luma ≥ `protect`: mắt, lõi, đạo văn); (2) `passes` lượt lọc đa số 3×3: điểm khác ≥ `vote` trong 8 láng giềng cùng một màu khác thì đổi theo (trừ màu phát sáng).
 * Trả số điểm đổi.
 */
export function harden(idx, W, H, pal, { minCluster = 2, passes = 1, vote = 6, protect = 0.62 } = {}) {
  const hot = pal.map((c) => luma(...c) >= protect);
  let changed = 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -2 : idx[y * W + x]);
  if (minCluster > 1) {
    const seen = new Uint8Array(W * H);
    for (let s = 0; s < idx.length; s++) {
      if (seen[s] || idx[s] < 0) continue;
      const comp = [s], c = idx[s]; seen[s] = 1;
      for (let k = 0; k < comp.length; k++) {
        const p = comp[k], x = p % W, y = (p / W) | 0;
        for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (at(nx, ny) === c && !seen[ny * W + nx]) { seen[ny * W + nx] = 1; comp.push(ny * W + nx); }
      }
      if (comp.length >= minCluster || hot[c]) continue;
      const tally = new Map();
      for (const p of comp) { const x = p % W, y = (p / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = at(x + dx, y + dy); if (v >= 0 && v !== c) tally.set(v, (tally.get(v) ?? 0) + 1); } }
      if (!tally.size) continue;
      const to = [...tally].sort((a, b) => b[1] - a[1])[0][0];
      for (const p of comp) idx[p] = to;
      changed += comp.length;
    }
  }
  for (let pass = 0; pass < passes; pass++) {
    const next = idx.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = idx[y * W + x]; if (c < 0 || hot[c]) continue;
      const tally = new Map();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) { const v = at(x + dx, y + dy); if (v >= 0) tally.set(v, (tally.get(v) ?? 0) + 1); }
      for (const [v, n] of tally) if (v !== c && n >= vote) { next[y * W + x] = v; changed++; break; }
    }
    idx.set(next);
  }
  return changed;
}

/** Thêm viền 1 điểm `#1a1020` ra NGOÀI hình (điểm trong suốt kề 4 hướng với điểm đục). Ảnh phải chừa mép ≥ 1 điểm. Trả số điểm viền. */
export function outlineOutside(img) {
  const { w, h } = img, add = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (img.alpha(x, y) >= 128) continue;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (nx >= 0 && ny >= 0 && nx < w && ny < h && img.alpha(nx, ny) >= 128) { add.push([x, y]); break; }
  }
  for (const [x, y] of add) img.set(x, y, [...OUT, 255]);
  return add.length;
}
export const hasAlpha = (img) => { for (let i = 3; i < img.data.length; i += 4) if (img.data[i] < 128) return true; return false; };

// ---------- Điểm sáng (mắt, mỏ, lõi) ----------
/** Thu nhỏ hộp-trung-bình để dò nhanh (chỉ để đo, không vào game). */
function shrinkAvg(img, maxSide) {
  const k = Math.max(1, Math.floor(Math.max(img.w, img.h) / maxSide)); if (k === 1) return { img, k };
  const W = Math.floor(img.w / k), H = Math.floor(img.h / k), o = new Img(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) { const s = img.idx(x * k + i, y * k + j); r += img.data[s]; g += img.data[s + 1]; b += img.data[s + 2]; a += img.data[s + 3]; }
    const n = k * k; o.set(x, y, [r / n, g / n, b / n, a / n >= 128 ? 255 : 0]);
  }
  return { img: o, k };
}
/**
 * Các đốm sáng nổi nhất của ảnh nguồn (mắt, mỏ, lõi lửa, đạo văn): thành phần 4-liền của điểm luma ≥ `min`, diện tích ≥ `minArea` (tỉ lệ ảnh),
 * `top` đốm lớn nhất. Trả [{ cx, cy, area, luma }] (tọa độ 0..1).
 */
export function accentBlobs(img, { min = 0.72, minArea = 0.00015, top = 8 } = {}) {
  const { img: s } = shrinkAvg(img, 256), { w, h, data: d } = s, seen = new Uint8Array(w * h), out = [];
  const hot = (p) => d[p * 4 + 3] >= 128 && luma(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]) >= min && sat(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]) >= 0.05;
  for (let st = 0; st < w * h; st++) {
    if (seen[st] || !hot(st)) continue;
    const comp = [st]; seen[st] = 1;
    for (let k = 0; k < comp.length; k++) {
      const p = comp[k], x = p % w, y = (p / w) | 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (nx >= 0 && ny >= 0 && nx < w && ny < h) { const q = ny * w + nx; if (!seen[q] && hot(q)) { seen[q] = 1; comp.push(q); } }
    }
    if (comp.length / (w * h) < minArea) continue;
    let sx = 0, sy = 0, sl = 0;
    for (const p of comp) { sx += p % w; sy += (p / w) | 0; sl += luma(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]); }
    out.push({ cx: (sx / comp.length + 0.5) / w, cy: (sy / comp.length + 0.5) / h, area: comp.length / (w * h), luma: sl / comp.length });
  }
  return out.sort((a, b) => b.area - a.area).slice(0, top);
}
/** Đốm sáng nguồn còn thấy ở ảnh pixel: ô (hoặc 8 ô quanh) có luma ≥ 0,55. `blobs` theo tọa độ 0..1 của vùng đã cắt. Trả { kept, total }. */
export function accentSurvival(blobs, pix) {
  let kept = 0;
  for (const b of blobs) {
    const x = Math.min(pix.w - 1, Math.floor(b.cx * pix.w)), y = Math.min(pix.h - 1, Math.floor(b.cy * pix.h));
    let ok = false;
    for (let dy = -1; dy <= 1 && !ok; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= pix.w || Y >= pix.h || pix.alpha(X, Y) < 128) continue;
      const [r, g, bb] = pix.get(X, Y); if (luma(r, g, bb) >= 0.55) { ok = true; break; }
    }
    if (ok) kept++;
  }
  return { kept, total: blobs.length };
}

/**
 * Nâng sáng tuyến tính: luma phân vị 98 của điểm đục thấp hơn `target` thì nhân RGB cho đạt `target` (tối đa ×2,2). Ảnh nguồn tối (đen sắt, thép) nếu không nâng sẽ
 * thành khối đen ở cỡ 32 / 24. Sửa tại chỗ; trả hệ số nhân (1 = không đổi).
 */
export function lift(img, target = 0.85) {
  const ls = []; for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3] >= 128) ls.push(luma(img.data[i], img.data[i + 1], img.data[i + 2]));
  if (!ls.length) return 1;
  ls.sort((a, b) => a - b); const p98 = ls[Math.floor(ls.length * 0.98)] || 0.01, k = Math.min(2.2, target / p98);
  if (k <= 1.02) return 1;
  for (let i = 0; i < img.data.length; i += 4) for (let c = 0; c < 3; c++) img.data[i + c] = Math.min(255, Math.round(img.data[i + c] * k));
  return k;
}


// ---------- Tạo tương phản (#1095) ----------
const toHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const sv = d / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, sv, l];
};
const fromHsl = (h, sv, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * sv, hp = (((h % 360) + 360) % 360) / 60, x = c * (1 - Math.abs((hp % 2) - 1)), m = l - c / 2;
  const [r, g, b] = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round((v + m) * 255))));
};
const hueToward = (h, target, t) => { const d = ((target - h + 540) % 360) - 180; return h + d * t; };
export const SHADOW_HUE = 270, LIGHT_HUE = 50;
/**
 * Hue-shift theo sắc độ (sửa tại chỗ): bóng (luma < 0,4) đẩy về tím / đen xanh (270°), vùng sáng (luma > 0,65) đẩy về vàng ấm (50°), giữa giữ nguyên.
 * `k` 0..1 = độ mạnh (k = 1: điểm tối nhất / sáng nhất đi tới 50% đường hue). Các tông cùng gam nhờ đó khác hue chứ không chỉ khác độ sáng. Trả số điểm đổi.
 */
export function hueShift(img, k = 0.5, { shadowHue = SHADOW_HUE } = {}) {
  if (k <= 0) return 0;
  let n = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 128) continue;
    const [h, sv, l] = toHsl(img.data[i], img.data[i + 1], img.data[i + 2]); if (sv < 0.08) continue;
    const t = l < 0.4 ? ((0.4 - l) / 0.4) * 0.5 * k : l > 0.65 ? ((l - 0.65) / 0.35) * 0.5 * k : 0; if (!t) continue;
    const tgt = l < 0.4 ? shadowHue : LIGHT_HUE; if (tgt == null) continue;
    const [r, g, b] = fromHsl(hueToward(h, tgt, t), sv, l);
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; n++;
  }
  return n;
}
/** Mặt nạ chủ thể (1 = chủ thể): ngưỡng Otsu trên luma của điểm đục, rồi `passes` lượt lọc đa số 3×3 cho bớt điểm lẻ. Trả { mask, threshold, share }. */
export function subjectMask(img, passes = 2) {
  const { w, h } = img, L = new Float32Array(w * h), hist = new Array(64).fill(0); let n = 0;
  for (let p = 0; p < w * h; p++) { if (img.data[p * 4 + 3] < 128) continue; L[p] = luma(img.data[p * 4], img.data[p * 4 + 1], img.data[p * 4 + 2]); hist[Math.min(63, (L[p] * 64) | 0)]++; n++; }
  let best = 0, bt = 0, sumAll = 0; hist.forEach((c, i) => (sumAll += i * c));
  for (let t = 1, w0 = 0, s0 = 0; t < 64; t++) {
    w0 += hist[t - 1]; s0 += (t - 1) * hist[t - 1]; const w1 = n - w0; if (!w0 || !w1) continue;
    const v = w0 * w1 * (s0 / w0 - (sumAll - s0) / w1) ** 2; if (v > best) { best = v; bt = t; }
  }
  const thr = bt / 64; let m = new Uint8Array(w * h); for (let p = 0; p < w * h; p++) m[p] = img.data[p * 4 + 3] >= 128 && L[p] >= thr ? 1 : 0;
  for (let k = 0; k < passes; k++) {
    const nx = m.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h) c += m[Y * w + X]; }
      if (c >= 6) nx[y * w + x] = 1; else if (c <= 2) nx[y * w + x] = 0;
    }
    m = nx;
  }
  return { mask: m, threshold: thr, share: m.reduce((a, v) => a + v, 0) / (n || 1) };
}
/** Hue trung bình của chủ thể (trung bình vòng, trọng số sắc độ × luma), độ; null nếu chủ thể không có màu (xám). */
export function subjectHue(img, mask) {
  let x = 0, y = 0;
  for (let p = 0; p < mask.length; p++) { if (!mask[p] || img.data[p * 4 + 3] < 128) continue; const [h, sv, l] = toHsl(img.data[p * 4], img.data[p * 4 + 1], img.data[p * 4 + 2]), wt = sv * l; x += Math.cos((h * Math.PI) / 180) * wt; y += Math.sin((h * Math.PI) / 180) * wt; }
  return Math.hypot(x, y) < 1e-6 ? null : ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
/** Hue nền đối với chủ thể: chủ thể thuộc gam tím / lam (trong ±60° của 270°) thì nền về nâu ấm (30°), còn lại về tím (270°). */
export const backgroundHue = (subj) => (subj != null && Math.abs(((subj - SHADOW_HUE + 540) % 360) - 180) <= 60 ? 30 : SHADOW_HUE);
/** Nền về gam tối đối với chủ thể (sửa tại chỗ): điểm ngoài `mask` đẩy hue về `hue` (mặc định tím 270°) `mix` phần và hạ sáng còn `dim`. Trả số điểm đổi. */
export function coolBackground(img, mask, { mix = 0.7, dim = 0.55, hue = SHADOW_HUE } = {}) {
  let n = 0;
  for (let p = 0; p < mask.length; p++) {
    if (mask[p] || img.data[p * 4 + 3] < 128) continue;
    const [h, sv, l] = toHsl(img.data[p * 4], img.data[p * 4 + 1], img.data[p * 4 + 2]);
    const [r, g, b] = fromHsl(hueToward(h, hue, mix), Math.max(sv * 0.8, 0.25), l * dim);
    img.data[p * 4] = r; img.data[p * 4 + 1] = g; img.data[p * 4 + 2] = b; n++;
  }
  return n;
}
/** Màu sáng nhất của bảng theo `glow` (màu nhấn). */
export const brightestOf = (pal) => pal.reduce((a, c) => (glow(...c) > glow(...a) ? c : a), pal[0]);
/**
 * Bảo vệ điểm nhấn nhỏ: màu `glow` cao nhất của ảnh nhỏ (mắt, mỏ, lõi) mà bảng không có màu gần (khoảng cách ≥ 28) thì THÊM vào bảng nếu còn chỗ (< `max` màu);
 * bảng đầy thì thay màu ÍT điểm nhất của `small` (không thay màu gần nhất: đó thường là tông sáng chính của thân). Sửa `pal` tại chỗ; trả true nếu đã đổi.
 */
export function protectAccent(small, pal, max = pal.length) {
  let top = null, tg = 0;
  for (let i = 0; i < small.data.length; i += 4) { if (small.data[i + 3] < 128) continue; const c = [small.data[i], small.data[i + 1], small.data[i + 2]], g = glow(...c); if (g > tg) { tg = g; top = c; } }
  if (!top || !pal.length) return false;
  if (dist(top, pal[nearest(top, pal)]) < 28) return false;
  if (pal.length < max) { pal.push(top); return true; }
  const use = new Array(pal.length).fill(0);
  for (let i = 0; i < small.data.length; i += 4) if (small.data[i + 3] >= 128) use[nearest([small.data[i], small.data[i + 1], small.data[i + 2]], pal)]++;
  pal[use.indexOf(Math.min(...use))] = top; return true;
}
/**
 * Nền theo màu viền (P1c2): điểm nối với mép ảnh, gần màu viền trung vị (RGB ≤ `tol`) và không sáng hơn viền quá 0,1 luma. Phủ > `maxShare` ảnh (thân tối cùng gam nền)
 * thì thử lại với `tol` một nửa. Trả { bg: Uint8Array (1 = nền), key, share }.
 */
export function edgeBackground(img, { tol = 34, maxShare = 0.5 } = {}) {
  const { w, h } = img, n = w * h, px = [];
  for (let x = 0; x < w; x++) px.push(img.get(x, 0), img.get(x, h - 1));
  for (let y = 1; y < h - 1; y++) px.push(img.get(0, y), img.get(w - 1, y));
  const med = (c) => px.map((p) => p[c]).sort((a, b) => a - b)[px.length >> 1], key = [med(0), med(1), med(2)], kl = luma(...key);
  for (let t = tol; ; t = Math.floor(t / 2)) {
    const bg = new Uint8Array(n), st = [];
    const push = (x, y) => { const p = y * w + x, i = p * 4, d = img.data; if (!bg[p] && d[i + 3] >= 128 && dist([d[i], d[i + 1], d[i + 2]], key) <= t && luma(d[i], d[i + 1], d[i + 2]) <= kl + 0.1) { bg[p] = 1; st.push(p); } };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (st.length) { const p = st.pop(), x = p % w, y = (p / w) | 0; if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1); }
    const share = bg.reduce((a, v) => a + v, 0) / n; if (share <= maxShare || t < 16) return { bg, key, share };
  }
}
/**
 * Bảo vệ MỌI đốm sáng nguồn (mắt, mỏ, lõi): màu rực nhất quanh tâm đốm (ô nhỏ) mà bảng chưa có màu gần (≥ 28) thì thêm khi còn chỗ (< `max`); đầy thì thôi (không thay màu thân).
 * Sửa `pal` tại chỗ; trả số màu đã thêm.
 */
export function protectBlobs(small, blobs, pal, max) {
  let added = 0;
  for (const b of blobs) {
    if (pal.length >= max) break;
    const x = Math.min(small.w - 1, Math.floor(b.cx * small.w)), y = Math.min(small.h - 1, Math.floor(b.cy * small.h)); let top = null, tg = -1;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= small.w || Y >= small.h || small.alpha(X, Y) < 128) continue; const c = small.get(X, Y), g = glow(c[0], c[1], c[2]); if (g > tg) { tg = g; top = c.slice(0, 3); } }
    if (top && dist(top, pal[nearest(top, pal)]) >= 28) { pal.push(top); added++; }
  }
  return added;
}
/** Độ lệch màu so với RAW (0..1): khoảng cách RGB trung bình (chia √3·255) giữa ảnh pixel và bản thu hộp-trung-bình của `region`, bỏ điểm `skip` (nền) và điểm trong suốt. */
export function colorDrift(pix, region, skip = null) {
  let sum = 0, n = 0;
  for (let y = 0; y < pix.h; y++) for (let x = 0; x < pix.w; x++) {
    if (pix.alpha(x, y) < 128 || skip?.[y * pix.w + x]) continue;
    const x0 = Math.floor((x * region.w) / pix.w), x1 = Math.max(x0 + 1, Math.floor(((x + 1) * region.w) / pix.w)), y0 = Math.floor((y * region.h) / pix.h), y1 = Math.max(y0 + 1, Math.floor(((y + 1) * region.h) / pix.h));
    let r = 0, g = 0, b = 0, m = 0; for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) { const q = region.get(i, j); if (q[3] >= 128) { r += q[0]; g += q[1]; b += q[2]; m++; } }
    if (!m) continue; const p = pix.get(x, y); sum += dist([p[0], p[1], p[2]], [r / m, g / m, b / m]); n++;
  }
  return n ? +(sum / n / (Math.sqrt(3) * 255)).toFixed(3) : null;
}
/** Viền sáng 1 điểm phía nguồn sáng (trên trái): điểm chủ thể có láng giềng trên / trái là nền → màu nhấn `accent`. Sửa `img` tại chỗ; trả số điểm. */
export function rimLight(img, mask, accent) {
  const { w, h } = img, at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : mask[y * w + x]); let n = 0;
  for (let y = 1; y < h; y++) for (let x = 1; x < w; x++) if (mask[y * w + x] && img.alpha(x, y) >= 128 && (!at(x - 1, y) || !at(x, y - 1))) { img.set(x, y, [...accent, 255]); n++; }
  return n;
}
/**
 * Tương phản của ảnh pixel: `sep` = khoảng cách RGB nhỏ nhất giữa hai màu chiếm ≥ `minShare` điểm (tông cùng gam dính nhau thì nhỏ);
 * `bgRatio` = (luma trung bình vùng giữa + 0,05) / (luma trung bình vòng ngoài + 0,05) (> 1: chủ thể sáng hơn nền).
 */
export function contrastMetrics(img, minShare = 0.02) {
  const cnt = colorCounts(img); let tot = 0; for (const c of cnt.values()) tot += c;
  const big = [...cnt].filter(([, c]) => c / tot >= minShare).map(([k]) => k.split(",").map(Number)); let sep = Infinity;
  for (let i = 0; i < big.length; i++) for (let j = i + 1; j < big.length; j++) sep = Math.min(sep, dist(big[i], big[j]));
  let cs = 0, cn = 0, bs = 0, bn = 0; const m = Math.floor(Math.min(img.w, img.h) / 4);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { if (img.alpha(x, y) < 128) continue; const l = luma(...img.get(x, y)); if (x >= m && x < img.w - m && y >= m && y < img.h - m) { cs += l; cn++; } else { bs += l; bn++; } }
  return { sep: Number.isFinite(sep) ? +sep.toFixed(1) : null, bigColors: big.length, bgRatio: cn && bn ? +((cs / cn + 0.05) / (bs / bn + 0.05)).toFixed(2) : null };
}

// ---------- Quy trình theo loại ----------
const parseCrop = (c) => { if (!c) return null; const v = (Array.isArray(c) ? c : String(c).split(",")).map(Number); if (v.length !== 4 || v.some((n) => !Number.isFinite(n))) throw new Error("--crop x,y,w,h"); return { x: v[0], y: v[1], w: v[2], h: v[3] }; };
/** Tham số khử mềm mặc định theo loại (đã chỉnh trên RAW #1083: chân dung ăn khối tối mạnh, pháp tướng vật cứng cần giữ chi tiết nhỏ như đạo văn, vết nứt). */
export const DEFAULTS_BY_TYPE = {
  portrait: { accent: 1.5, minCluster: 2, passes: 1, merge: 18 },
  icon: { accent: 2.5, minCluster: 2, passes: 1, merge: 10 },
  phaptuong: { accent: 3, minCluster: 1, passes: 0, merge: 8 },
};
/** `--preset portrait` (#1095): nền lạnh tối, hue-shift, gộp tông giống (merge cao), ≤ `maxColors` màu khác hẳn, bảo vệ điểm nhấn, viền sáng 1 điểm. */
export const PRESET_PORTRAIT = { hueShift: 0.5, merge: 34, maxColors: 8, rim: true, cool: true, protect: true };
/**
 * `--preset portrait2` (P1c2, #1158): sát RAW. P1c cho Otsu theo độ sáng làm "chủ thể" nên chỉ nét phát sáng được giữ, thân tối bị coi là nền (hạ ×0,55, hue-shift, ép 8 màu) → khối tối mất / dính.
 * Ở đây: nền = vùng nối mép ảnh VÀ gần màu viền (không theo độ sáng) → phẳng một tông tối cùng gam; thân KHÔNG đổi màu; bỏ phiếu ít thiên về điểm sáng (`accent` thấp);
 * 16 màu, gộp nhẹ; mỗi đốm sáng nguồn (mắt, mỏ, lõi) giữ một màu riêng; viền sáng 1 điểm theo tông thân.
 */
export const PRESET_PORTRAIT2 = { faithful: true, merge: 12, maxColors: 16, rim: true, protect: true, accent: 0.6 };
export const DEFAULTS = { ...DEFAULTS_BY_TYPE.portrait, bgTol: 48 };
const dflt = (type, o, k) => o[k] ?? DEFAULTS_BY_TYPE[type][k];

/** Chuẩn bị ảnh nguồn: bỏ nền theo `bg` ("auto" | "none" | "#rrggbb"). Trả { img (bản sao), bgInfo }. */
export function prepareSource(src, { bg = "auto", bgTol = DEFAULTS.bgTol } = {}) {
  const img = new Img(src.w, src.h, Uint8Array.from(src.data)), info = borderKey(img);
  if (bg === "none") return { img, info, removed: 0 };
  let key = null;
  if (/^#[0-9a-f]{6}$/i.test(bg)) key = hex(bg);
  else if (info.clear < 0.5 && info.near70 >= 0.85) key = info.key; // viền một màu phẳng (kể cả magenta)
  if (!key && info.clear < 0.5) return { img, info, removed: 0 };
  return { img, info, removed: removeBg(img, key, bgTol) };
}

/**
 * Chân dung 64×64 (hoặc `size`): cắt (`crop` hoặc `focus` + `zoom`) → bỏ phiếu → bảng ≤ `colors` → khử mềm → viền nếu có vùng trong suốt.
 * Trả { img, palette, report }.
 */
export function pixelizePortrait(src, o = {}) {
  const size = o.size ?? PORTRAIT_SIZE, colors = o.colors ?? MAX_COLORS.portrait, cr = parseCrop(o.crop) ?? squareCrop(src, { focus: o.focus, zoom: o.zoom });
  const prep = prepareSource(src, { bg: o.bg ?? "none", bgTol: o.bgTol }), region = crop(prep.img, cr), blobs = accentBlobs(region);
  const transparent = hasAlpha(region), outline = o.outline === "on" || (o.outline !== "off" && transparent);
  const small = pixelizeDown(region, size, size, { accent: o.accent ?? (o.preset === "portrait2" ? PRESET_PORTRAIT2.accent : dflt("portrait", o, "accent")) }), op = o.preset === "portrait" ? { ...PRESET_PORTRAIT, ...o } : o.preset === "portrait2" ? { ...PRESET_PORTRAIT2, ...o } : o;
  if (op.preset === "portrait2") return portraitFaithful(small, region, blobs, { ...op, colors, outline, crop: cr, size });
  const mask = op.cool || op.rim ? subjectMask(small) : null, extra = {};
  const subj = mask ? subjectHue(small, mask.mask) : null, cold = backgroundHue(subj) !== SHADOW_HUE; // chủ thể gam lam / tím: nền về nâu ấm, bóng không đẩy về tím
  if (mask) extra.subjectHue = subj == null ? null : Math.round(subj);
  if (op.cool) { extra.bgHue = backgroundHue(subj); extra.coolPixels = coolBackground(small, mask.mask, { hue: extra.bgHue }); }
  if (op.hueShift) extra.hueShifted = hueShift(small, op.hueShift, { shadowHue: cold ? null : SHADOW_HUE });
  return finish(small, { ...op, colors: Math.min(colors, op.maxColors ?? colors) - (outline ? 1 : 0), outline, blobs, crop: cr, size, type: "portrait", mask: op.rim ? mask.mask : null, extra, subjectShare: mask && +mask.share.toFixed(2) });
}
/**
 * Chân dung sát RAW (preset portrait2): nền theo màu viền → phẳng một tông tối (0,7 × màu viền); bảng tính trên thân (không có nền) cộng đốm sáng riêng; thân giữ màu RAW;
 * làm cứng không đụng nền; viền sáng = tông sáng nhất của thân không quá chói (luma ≤ 0,8) hoặc màu sáng nhất. Report có `colorDrift` (độ lệch so với RAW).
 */
function portraitFaithful(small, region, blobs, o) {
  const eb = edgeBackground(small), bgc = eb.key.map((v) => Math.round(v * 0.7)), body = new Img(small.w, small.h, Uint8Array.from(small.data));
  for (let p = 0; p < eb.bg.length; p++) if (eb.bg[p]) body.data[p * 4 + 3] = 0;
  const colors = Math.min(o.colors, o.maxColors ?? o.colors) - (o.outline ? 1 : 0), pal = buildPalette(body, colors - 1, { mode: o.palette ?? "auto", pool: o.pool ?? [], merge: dflt("portrait", o, "merge") });
  const added = o.protect ? protectBlobs(body, blobs, pal, colors - 1) : 0, bgIdx = pal.push(bgc) - 1, bodyPal = pal.slice(0, bgIdx);
  const idx = toIndexed(body, bodyPal); for (let p = 0; p < idx.length; p++) if (eb.bg[p]) idx[p] = bgIdx;
  const changed = harden(idx, small.w, small.h, pal, { minCluster: dflt("portrait", o, "minCluster"), passes: dflt("portrait", o, "passes") });
  for (let p = 0; p < idx.length; p++) if (eb.bg[p]) idx[p] = bgIdx; else if (idx[p] === bgIdx) idx[p] = nearest([body.data[p * 4], body.data[p * 4 + 1], body.data[p * 4 + 2]], bodyPal);
  for (const b of blobs) { // ghim lại điểm rực nhất tâm mỗi đốm sáng (mắt tím luma thấp không thuộc "màu phát sáng" nên harden có thể xóa)
    const cx = Math.min(small.w - 1, Math.floor(b.cx * small.w)), cy = Math.min(small.h - 1, Math.floor(b.cy * small.h)); let best = -1, bg = -1;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= small.w || Y >= small.h || eb.bg[Y * small.w + X]) continue; const c = small.get(X, Y), g = glow(c[0], c[1], c[2]); if (g > bg) { bg = g; best = Y * small.w + X; } }
    if (best >= 0) idx[best] = nearest([small.data[best * 4], small.data[best * 4 + 1], small.data[best * 4 + 2]], bodyPal);
  }
  const img = fromIndexed(idx, small.w, small.h, pal), calm = bodyPal.filter((c) => luma(...c) <= 0.8);
  const rim = o.rim ? rimLight(img, eb.bg.map((v) => 1 - v), (calm.length ? calm : bodyPal).reduce((a, c) => (luma(...c) > luma(...a) ? c : a))) : 0;
  if (o.outline) outlineOutside(img);
  return { img, palette: pal, report: { type: "portrait", size: o.size, crop: o.crop, preset: "portrait2", bgShare: +eb.share.toFixed(2), bgColor: bgc, accentAdded: added, ...(rim && { rimPixels: rim }), contrast: contrastMetrics(img), hardenedPixels: changed, accent: accentSurvival(blobs, img), colorDrift: colorDrift(img, region, eb.bg), colors: pal.length + (o.outline ? 1 : 0) } };
}
/** Icon `size`×`size`: bỏ nền, cắt theo hộp bao (hoặc `crop`), vừa (size − 2) có viền ngoài, căn giữa. */
export function pixelizeIcon(src, o = {}) {
  if (o.preset === "icon-nearest32") {
    const raw = iconNearest(src, o), quant = quantizeNearestIcon(raw.img, o.colors);
    return { ...quant, report: { ...raw.report, ...quant.report, preset: "icon-nearest32" } };
  }
  if (o.preset === "icon-nearest") return iconNearest(src, o);
  const size = o.size ?? ICON_SIZES[0], colors = o.colors ?? MAX_COLORS.icon, prep = prepareSource(src, { bg: o.bg ?? "auto", bgTol: o.bgTol });
  const cr = parseCrop(o.crop) ?? bbox(prep.img);
  if (!cr) throw new Error("icon: ảnh không còn điểm đục sau khi bỏ nền (nền không tách?)");
  const region = crop(prep.img, cr), liftK = o.lift === "off" ? 1 : lift(region, o.lift && o.lift !== "auto" ? +o.lift : 0.8), blobs = accentBlobs(region), inner = size - 2, k = Math.min(inner / cr.w, inner / cr.h);
  const W = Math.max(1, Math.round(cr.w * k)), H = Math.max(1, Math.round(cr.h * k));
  const fit = pixelizeDown(region, W, H, { accent: dflt("icon", o, "accent") }), canvas = new Img(size, size);
  canvas.blit(fit, 0, 0, W, H, Math.floor((size - W) / 2), Math.floor((size - H) / 2));
  return finish(canvas, { ...o, colors: colors - 1, outline: o.outline !== "off", blobs, crop: cr, size, type: "icon", lift: +liftK.toFixed(2) });
}
/**
 * Preset `icon-nearest` (#1159, cách C = RAW): bỏ nền, cắt cận hộp bao thành ô vuông, thu về (size − 2) bằng láng giềng gần nhất (lấy điểm giữa ô, không trộn màu,
 * không ép bảng màu, không làm cứng), nền trong suốt, viền ngoài #1a1020 1 điểm (`--outline off` để bỏ). Alpha 0 / 255. Số màu theo ảnh nguồn.
 */
export function iconNearest(src, o = {}) {
  const size = o.size ?? ICON_SIZES[0], prep = prepareSource(src, { bg: o.bg ?? "auto", bgTol: o.bgTol }), bb = parseCrop(o.crop) ?? bbox(prep.img);
  if (!bb) throw new Error("icon: ảnh không còn điểm đục sau khi bỏ nền (nền không tách?)");
  const side = Math.max(bb.w, bb.h), cr = { x: bb.x - Math.floor((side - bb.w) / 2), y: bb.y - Math.floor((side - bb.h) / 2), w: side, h: side };
  const outline = o.outline !== "off", inner = outline ? size - 2 : size, off = (size - inner) >> 1, out = new Img(size, size);
  for (let y = 0; y < inner; y++) for (let x = 0; x < inner; x++) {
    const sx = cr.x + Math.floor(((x + 0.5) * side) / inner), sy = cr.y + Math.floor(((y + 0.5) * side) / inner);
    if (sx < 0 || sy < 0 || sx >= prep.img.w || sy >= prep.img.h) continue;
    const p = prep.img.get(sx, sy); if (p[3] >= 128) out.set(x + off, y + off, [p[0], p[1], p[2], 255]);
  }
  if (outline) outlineOutside(out);
  const cc = colorCounts(out);
  return { img: out, palette: [...cc.keys()].map((k) => k.split(",").map(Number)), report: { type: "icon", size, crop: bb, preset: "icon-nearest", outline, contrast: contrastMetrics(out), colors: cc.size } };
}
/** Giảm màu sau nearest, giữ nguyên alpha/hình; dành một màu cho viền, không làm cứng hay nâng sáng. */
export function quantizeNearestIcon(img, limit = MAX_COLORS.icon) {
  if (!Number.isInteger(limit) || limit < 2 || limit > MAX_COLORS.icon) throw new Error(`icon: số màu phải từ2 đến${MAX_COLORS.icon}`);
  if (img.w !== img.h || !ICON_SIZES.includes(img.w)) throw new Error("icon nearest đầu vào phải24/32 vuông");
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] !== 0 && img.data[i] !== 255) throw new Error("icon nearest đầu vào chỉ được alpha0/255");
  const palette = buildPalette(img, limit - 1, { merge: 0 });
  if (!palette.length) throw new Error("icon: ảnh không có chủ thể");
  protectAccent(img, palette, limit - 1);
  palette.push(OUT);
  const out = fromIndexed(toIndexed(img, palette), img.w, img.h, palette);
  return { img: out, palette, report: { preset: "icon-nearest32", sourceColors: colorCounts(img).size, colors: colorCounts(out).size, colorDrift: colorDrift(out, img) } };
}
function finish(small, o) {
  const pal = buildPalette(small, o.colors, { mode: o.palette ?? "auto", pool: o.pool ?? [], merge: dflt(o.type, o, "merge") });
  if (o.protect) protectAccent(small, pal, o.colors);
  const idx = toIndexed(small, pal), changed = harden(idx, small.w, small.h, pal, { minCluster: dflt(o.type, o, "minCluster"), passes: dflt(o.type, o, "passes") });
  const img = fromIndexed(idx, small.w, small.h, pal);
  const rim = o.mask && pal.length ? rimLight(img, o.mask, brightestOf(pal)) : 0;
  if (o.outline) outlineOutside(img);
  return { img, palette: pal, report: { type: o.type, size: o.size, crop: o.crop, ...(o.preset && { preset: o.preset }), ...(o.subjectShare != null && { subjectShare: o.subjectShare }), ...o.extra, ...(rim && { rimPixels: rim }), contrast: contrastMetrics(img), ...(o.lift !== undefined && { lift: o.lift }), hardenedPixels: changed, accent: accentSurvival(o.blobs ?? [], img), colors: pal.length + (o.outline ? 1 : 0) } };
}

/**
 * Tách tờ pháp tướng nhiều hướng thành từng hình: thành phần liền (dò trên bản thu nhỏ, nở 1 ô để nối mảnh rời sát nhau) sắp theo tâm ngang trái → phải;
 * bỏ mảnh vụn nhỏ hơn 2% diện tích hình lớn nhất. Hình xếp chéo, chồng khoảng ngang với hình bên cạnh vẫn tách được (khác cách chia theo cột trống).
 * Trả [{ box: { x, y, w, h }, img }]: `img` đã cắt theo hộp bao và xóa điểm thuộc hình khác.
 */
export function splitPoses(img) {
  const k = Math.max(1, Math.floor(Math.max(img.w, img.h) / 400)), W = Math.ceil(img.w / k), H = Math.ceil(img.h / k), cell = new Uint8Array(W * H);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y) >= 128) cell[((y / k) | 0) * W + ((x / k) | 0)] = 1;
  const grown = cell.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cell[y * W + x]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) grown[Y * W + X] = 1; }
  const label = new Int32Array(W * H); let n = 0;
  for (let st = 0; st < W * H; st++) {
    if (!grown[st] || label[st]) continue;
    label[st] = ++n; const q = [st];
    for (let i = 0; i < q.length; i++) { const p = q[i], x = p % W, y = (p / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && grown[Y * W + X] && !label[Y * W + X]) { label[Y * W + X] = n; q.push(Y * W + X); } } }
  }
  const comps = Array.from({ length: n }, () => ({ x0: img.w, y0: img.h, x1: -1, y1: -1, area: 0, sx: 0 }));
  const lab = (x, y) => label[((y / k) | 0) * W + ((x / k) | 0)];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y) >= 128) { const c = comps[lab(x, y) - 1]; c.area++; c.sx += x; if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y; }
  const big = Math.max(0, ...comps.map((c) => c.area)), keep = comps.map((c, i) => ({ c, id: i + 1 })).filter(({ c }) => c.area >= big * 0.02 && c.x1 >= 0).sort((p, q) => p.c.sx / p.c.area - q.c.sx / q.c.area);
  return keep.map(({ c, id }) => {
    const box = { x: c.x0, y: c.y0, w: c.x1 - c.x0 + 1, h: c.y1 - c.y0 + 1 }, o = crop(img, box);
    for (let y = 0; y < box.h; y++) for (let x = 0; x < box.w; x++) if (o.alpha(x, y) >= 128 && lab(box.x + x, box.y + y) !== id) o.data[o.idx(x, y) + 3] = 0;
    return { box, img: o };
  });
}
/**
 * Pháp tướng: `poses` = ảnh (đã bỏ nền) từng hướng; cùng một tỉ lệ thu cho cả bộ (hướng cao nhất / rộng nhất vừa hộp `fitW × fitH`), bảng chung ≤ `colors`
 * (PT_MAX_COLORS), alpha 0 / 255, viền ngoài, đặt giữa-đáy hộp bao trùng gốc khung. Trả { frames: Img[] (khung × khung), palette, report }.
 */
export function pixelizePhapTuong(poses, o = {}) {
  const F = o.frame ?? PT_FRAME, fr = PT_FRAMES[F]; if (!fr) throw new Error(`khung pháp tướng chỉ ${Object.keys(PT_FRAMES).join(" / ")}`);
  const colors = o.colors ?? MAX_COLORS.phaptuong, inner = { w: fr.fitW - 2, h: fr.fitH - 2 };
  const k = Math.min(...poses.map((p) => Math.min(inner.w / p.w, inner.h / p.h))), smalls = [], blobs = poses.map((p) => accentBlobs(p));
  for (const p of poses) smalls.push(pixelizeDown(p, Math.max(1, Math.round(p.w * k)), Math.max(1, Math.round(p.h * k)), { accent: dflt("phaptuong", o, "accent") }));
  const pal = buildPalette(smalls, colors - 1, { mode: o.palette ?? "auto", pool: o.pool ?? [], merge: dflt("phaptuong", o, "merge") }), frames = [], surv = [];
  smalls.forEach((s, i) => {
    const idx = toIndexed(s, pal); harden(idx, s.w, s.h, pal, { minCluster: dflt("phaptuong", o, "minCluster"), passes: dflt("phaptuong", o, "passes") });
    const pix = fromIndexed(idx, s.w, s.h, pal), padded = new Img(s.w + 4, s.h + 4); padded.blit(pix, 0, 0, s.w, s.h, 2, 2); outlineOutside(padded);
    const f = new Img(F, F), [ox, oy] = fr.origin, dx = Math.round(ox - padded.w / 2), dy = oy - padded.h + 2;
    f.blit(padded, 0, 0, padded.w, padded.h, dx, dy); frames.push(f);
    surv.push(accentSurvival(blobs[i], pix)); // đo trên ảnh chưa đệm: đốm nguồn tính theo hộp bao của hướng
  });
  return { frames, palette: pal, report: { type: "phaptuong", frame: F, scale: +k.toFixed(4), colors: pal.length + 1, accent: surv.reduce((a, s) => ({ kept: a.kept + s.kept, total: a.total + s.total }), { kept: 0, total: 0 }) } };
}
/** Ghép các khung hàng ngang thành một dải (xem trước / nhập sau). */
export function strip(frames) { const f = frames[0], o = new Img(f.w * frames.length, f.h); frames.forEach((x, i) => o.blit(x, 0, 0, x.w, x.h, i * f.w, 0)); return o; }
export const uniqueColors = (img) => colorCounts(img).size;
