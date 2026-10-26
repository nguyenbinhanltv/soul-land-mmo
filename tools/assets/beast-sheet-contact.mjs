// Vẽ tờ liên hệ có nhãn cho beast-sheet-check.mjs (#863): tờ gốc thu nhỏ + lưới danh nghĩa + hộp từng hình + nhãn hàng / cột / hướng.
// Chữ vẽ bằng phông 5×7 nhúng sẵn (không dấu, chữ hoa) vì repo không có thư viện phông.
import { Img } from "./lib.mjs";

const G = {
  "0": "0E 11 13 15 19 11 0E", "1": "04 0C 04 04 04 04 0E", "2": "0E 11 01 02 04 08 1F", "3": "1F 02 04 02 01 11 0E", "4": "02 06 0A 12 1F 02 02",
  "5": "1F 10 1E 01 01 11 0E", "6": "06 08 10 1E 11 11 0E", "7": "1F 01 02 04 08 08 08", "8": "0E 11 11 0E 11 11 0E", "9": "0E 11 11 0F 01 02 0C",
  A: "0E 11 11 1F 11 11 11", B: "1E 11 11 1E 11 11 1E", C: "0E 11 10 10 10 11 0E", D: "1C 12 11 11 11 12 1C", E: "1F 10 10 1E 10 10 1F",
  F: "1F 10 10 1E 10 10 10", G: "0E 11 10 17 11 11 0F", H: "11 11 11 1F 11 11 11", I: "0E 04 04 04 04 04 0E", J: "07 02 02 02 02 12 0C",
  K: "11 12 14 18 14 12 11", L: "10 10 10 10 10 10 1F", M: "11 1B 15 15 11 11 11", N: "11 11 19 15 13 11 11", O: "0E 11 11 11 11 11 0E",
  P: "1E 11 11 1E 10 10 10", Q: "0E 11 11 11 15 12 0D", R: "1E 11 11 1E 14 12 11", S: "0F 10 10 0E 01 01 1E", T: "1F 04 04 04 04 04 04",
  U: "11 11 11 11 11 11 0E", V: "11 11 11 11 11 0A 04", W: "11 11 11 15 15 15 0A", X: "11 11 0A 04 0A 11 11", Y: "11 11 0A 04 04 04 04",
  Z: "1F 01 02 04 08 10 1F", "-": "00 00 00 1F 00 00 00", "+": "00 04 04 1F 04 04 00", "/": "01 01 02 04 08 10 10", ":": "00 0C 0C 00 0C 0C 00",
  ".": "00 00 00 00 00 0C 0C", " ": "00 00 00 00 00 00 00",
};
const GLYPH = Object.fromEntries(Object.entries(G).map(([c, s]) => [c, s.split(" ").map((h) => parseInt(h, 16))]));
export const textWidth = (s, k = 1) => s.length * 6 * k;

export function fillRect(im, x, y, w, h, c) {
  for (let j = Math.max(0, y); j < Math.min(im.h, y + h); j++) for (let i = Math.max(0, x); i < Math.min(im.w, x + w); i++) im.set(i, j, c);
}
export function strokeRect(im, x0, y0, x1, y1, c) {
  fillRect(im, x0, y0, x1 - x0 + 1, 1, c); fillRect(im, x0, y1, x1 - x0 + 1, 1, c);
  fillRect(im, x0, y0, 1, y1 - y0 + 1, c); fillRect(im, x1, y0, 1, y1 - y0 + 1, c);
}
export function drawText(im, x, y, s, k, c, bg = null) {
  if (bg) fillRect(im, x - 1, y - 1, textWidth(s, k) + 1, 7 * k + 2, bg);
  [...String(s).toUpperCase()].forEach((ch, n) => {
    const rows = GLYPH[ch] ?? GLYPH[" "];
    rows.forEach((bits, r) => { for (let b = 0; b < 5; b++) if (bits & (16 >> b)) fillRect(im, x + n * 6 * k + b * k, y + r * k, k, k, c); });
  });
}

const BLACK = [20, 16, 28, 255], WHITE = [250, 250, 250, 255];
export const COLORS = { ok: [40, 220, 90, 255], bad: [255, 40, 40, 255], warn: [255, 170, 0, 255], base: [255, 235, 60, 255], grid: [120, 120, 160, 255] };

/**
 * @param src ảnh tờ gốc (Img)
 * @param o { title, plan: { dirs, rows }, bands: [{ y0, y1, figures: [{x0,x1,y0,y1,label,state}], state, baseline? }], rowLabels: [string] }
 * state của hình / dải: "ok" | "bad" | "warn".
 */
export function contactSheet(src, o) {
  const targetW = 1000, k = Math.min(1, targetW / src.w), W = Math.round(src.w * k), H = Math.round(src.h * k);
  const L = 150, T = 40, im = new Img(L + W + 8, T + H + 8);
  fillRect(im, 0, 0, im.w, im.h, BLACK);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) im.set(L + x, T + y, src.get(Math.min(src.w - 1, Math.round(x / k)), Math.min(src.h - 1, Math.round(y / k))));
  drawText(im, 4, 4, o.title, 2, WHITE);
  const cols = o.plan.cols ?? 6, rows = o.plan.rows;
  for (let c = 0; c < cols; c++) {
    const x = L + Math.round((c / cols) * W);
    fillRect(im, x, T, 1, H, COLORS.grid);
    drawText(im, x + Math.round(W / cols / 2) - 6, T - 14, `C${c + 1}`, 2, WHITE);
  }
  for (let r = 0; r < rows; r++) {
    const y = T + Math.round((r / rows) * H);
    fillRect(im, L, y, W, 1, COLORS.grid);
    drawText(im, 4, y + 4, `H${r + 1}`, 2, WHITE);
    drawText(im, 4, y + 22, o.rowLabels[r] ?? "", 1, WHITE);
  }
  o.bands.forEach((b) => {
    if (b.baseline != null) fillRect(im, L + Math.round(b.baselineX0 * k), T + Math.round(b.baseline * k), Math.round((b.baselineX1 - b.baselineX0) * k), 1, COLORS.base);
    for (const f of b.figures) {
      const c = COLORS[f.state ?? b.state ?? "ok"];
      const x0 = L + Math.round(f.x0 * k), x1 = L + Math.round(f.x1 * k), y0 = T + Math.round(f.y0 * k), y1 = T + Math.round(f.y1 * k);
      strokeRect(im, x0, y0, x1, y1, c);
      if (f.label) drawText(im, x0 + 2, y0 + 2, f.label, 1, WHITE, BLACK);
    }
  });
  return im;
}
