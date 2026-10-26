// Dò lưới tờ hoạt ảnh hồn thú theo KHOẢNG TRỐNG (không giả định ô đều), dùng chung cho beast-sheet-check.mjs (#863) và cutter v2 (#864).
// Cách làm (bao-cao-h4.md, Phụ lục A): mặt nạ vật = điểm cách màu nền (mốt 4 góc) quá `tol` ở kênh lệch nhất; chiếu lên trục y ra các
// dải hàng (cách nhau bằng hàng trống), rồi chiếu từng dải lên trục x ra các hình. Chỉ đọc, không ghi ảnh.
import { median } from "./beast-sheet-stats.mjs";

export const GRID_TOL = 70;
/** Dải hàng ngắn hơn số này (px) là nhiễu; hình hẹp hơn số này là nhiễu. */
export const MIN_BAND_H = 12, MIN_FIG_W = 10;

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
