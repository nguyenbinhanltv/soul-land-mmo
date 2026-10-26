// Dò lưới tờ hoạt ảnh hồn thú theo KHOẢNG TRỐNG (không giả định ô đều), dùng chung cho beast-sheet-check.mjs (#863) và cutter v2 (#864).
// Cách làm (bao-cao-h4.md, Phụ lục A): mặt nạ vật = điểm cách màu nền (mốt 4 góc) quá `tol` ở kênh lệch nhất; chiếu lên trục y ra các
// dải hàng (cách nhau bằng hàng trống), rồi chiếu từng dải lên trục x ra các hình. Chỉ đọc, không ghi ảnh.
import { median } from "./beast-sheet-stats.mjs";

export const GRID_TOL = 70;
/** Dải hàng ngắn hơn số này (px) là nhiễu; hình hẹp hơn số này là nhiễu. */
export const MIN_BAND_H = 12, MIN_FIG_W = 10;
/** Ngưỡng cổ hẹp khi tách hình dính: điểm vật tại cột cắt so với trung vị điểm vật mỗi cột của hình (đo 5 dải đã biết: 0 – 0,48). */
export const NECK_FRAC = 0.5;

/** Màu nền: màu nhiều phiếu nhất ở 4 góc (lượng tử 8 mức mỗi kênh để chịu vignette), trả về trung bình màu thật của các phiếu đó. */
export function sheetKey(img) {
  const votes = new Map();
  for (const [x0, y0] of [[0, 0], [img.w - 8, 0], [0, img.h - 8], [img.w - 8, img.h - 8]]) {
    for (let y = y0; y < y0 + 8; y++) for (let x = x0; x < x0 + 8; x++) {
      const p = img.get(x, y), k = `${p[0] >> 3},${p[1] >> 3},${p[2] >> 3}`, v = votes.get(k) ?? { n: 0, s: [0, 0, 0] };
      v.n++; for (let c = 0; c < 3; c++) v.s[c] += p[c];
      votes.set(k, v);
    }
  }
  const best = [...votes.values()].sort((a, b) => b.n - a.n)[0];
  return best.s.map((s) => Math.round(s / best.n));
}

/** Mặt nạ vật (1 = vật): kênh lệch nhất so với màu nền > tol. Điểm trong suốt (alpha < 128) là nền. */
export function foreground(img, key, tol = GRID_TOL) {
  const m = new Uint8Array(img.w * img.h), d = img.data;
  for (let i = 0, n = m.length; i < n; i++) {
    const o = i * 4;
    m[i] = d[o + 3] >= 128 && Math.max(Math.abs(d[o] - key[0]), Math.abs(d[o + 1] - key[1]), Math.abs(d[o + 2] - key[2])) > tol ? 1 : 0;
  }
  return m;
}

/** Các đoạn liên tiếp có count > noise, nối đoạn cách nhau < join, bỏ đoạn ngắn hơn min: [{ a, b }] (b là chỉ số cuối, gồm cả). */
export function runsOf(counts, { noise = 0, min = 1, join = 3 } = {}) {
  const out = [];
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] <= noise) continue;
    const last = out[out.length - 1];
    if (last && i - last.b - 1 < join) last.b = i; else out.push({ a: i, b: i });
  }
  return out.filter((r) => r.b - r.a + 1 >= min);
}

/** Dò lưới: dải hàng và hình trong từng dải. figure = { x0, x1, y0, y1, w, h, area } (hộp bao sát, px ảnh gốc). */
export function detectGrid(img, { key = sheetKey(img), tol = GRID_TOL, mask = foreground(img, key, tol) } = {}) {
  const { w, h } = img, rowCount = new Int32Array(h);
  for (let y = 0; y < h; y++) { let c = 0; for (let x = 0; x < w; x++) c += mask[y * w + x]; rowCount[y] = c; }
  const bands = runsOf(rowCount, { noise: Math.max(2, Math.round(w * 0.002)), min: MIN_BAND_H }).map((r) => {
    const colCount = new Int32Array(w);
    for (let y = r.a; y <= r.b; y++) for (let x = 0; x < w; x++) colCount[x] += mask[y * w + x];
    const figures = runsOf(colCount, { noise: 0, min: MIN_FIG_W, join: 4 }).map((c) => {
      let y0 = r.b, y1 = r.a, area = 0;
      for (let y = r.a; y <= r.b; y++) for (let x = c.a; x <= c.b; x++) if (mask[y * w + x]) { area++; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return { x0: c.a, x1: c.b, y0, y1, w: c.b - c.a + 1, h: y1 - y0 + 1, area };
    }).filter((f) => f.area > 0);
    return { y0: r.a, y1: r.b, h: r.b - r.a + 1, figures };
  });
  return { key, mask, w, h, bands, medianFigW: median(bands.flatMap((b) => b.figures.map((f) => f.w))) };
}

/**
 * Tách hình dính (tay / đuôi vươn chồng sang khung bên làm hai khung thành một khối trên trục x): dải nào có ÍT hình hơn số khung dự kiến thì
 * chia hình rộng nhất tại cột có ít điểm vật nhất ở 40% giữa (thung lũng chiếu cột) NẾU đó là cổ hẹp thật (xem NECK_FRAC; không thì dừng, dải vẫn thiếu hình và bị chặn), lặp tới khi đủ số hình hoặc hết hình đủ rộng
 * (≥ 1,4 lần bề rộng trung vị của dải). Dải đủ hình hoặc thừa hình giữ nguyên. Sửa tại chỗ, trả về danh sách dải đã tách [{ band, from, to }].
 * @param {number[]} expected số khung dự kiến theo chỉ số dải hàng
 */
export function splitStuckFigures(grid, expected) {
  const { w, mask } = grid, done = [];
  grid.bands.forEach((b, row) => {
    const want = expected[row];
    if (want === undefined || b.figures.length >= want || !b.figures.length) return;
    const from = b.figures.length, medW = median(b.figures.map((f) => f.w));
    while (b.figures.length < want) {
      const f = b.figures.reduce((m, g) => (g.w > m.w ? g : m));
      if (f.w < 1.4 * medW) break;
      const a = f.x0 + Math.floor(f.w * 0.3), z = f.x1 - Math.floor(f.w * 0.3);
      let best = a, bestN = Infinity;
      for (let x = a; x <= z; x++) {
        let n = 0; for (let y = b.y0; y <= b.y1; y++) n += mask[y * w + x];
        if (n < bestN || (n === bestN && Math.abs(x - (f.x0 + f.x1) / 2) < Math.abs(best - (f.x0 + f.x1) / 2))) { best = x; bestN = n; }
      }
      // cổ hẹp thật: điểm vật tại cột cắt ≤ NECK_FRAC × trung vị điểm vật mỗi cột của hình, và thấp hơn hẳn (≤ 1/2) đỉnh hai bên; hình đặc (die nằm dài, đuôi dài) không có cổ thì không cắt
      const cols = []; for (let x = f.x0; x <= f.x1; x++) { let n = 0; for (let y = b.y0; y <= b.y1; y++) n += mask[y * w + x]; cols.push(n); }
      const left = Math.max(...cols.slice(0, best - f.x0 + 1)), right = Math.max(...cols.slice(best - f.x0));
      if (bestN > NECK_FRAC * median(cols) || bestN * 2 > Math.min(left, right)) break;
      const part = (x0, x1) => {
        let y0 = b.y1, y1 = b.y0, area = 0;
        for (let y = b.y0; y <= b.y1; y++) for (let x = x0; x <= x1; x++) if (mask[y * w + x]) { area++; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        return area ? { x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, area } : null;
      };
      const l = part(f.x0, best - 1), r = part(best, f.x1);
      if (!l || !r) break;
      b.figures.splice(b.figures.indexOf(f), 1, l, r);
    }
    if (b.figures.length !== from) done.push({ band: row, from, to: b.figures.length });
  });
  return done;
}
