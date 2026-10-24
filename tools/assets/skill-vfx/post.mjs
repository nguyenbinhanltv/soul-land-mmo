// S2 (#548): hậu kỳ sheet PixelLab /vfx → sheet game. Mỗi sheet thô (lưới + json) thành:
//   shared/assets/sprites/iso/fx/sk_<tên>.png    dải một hàng, khung vuông (cỡ thô + lề 4), alpha 0 / 255, màu theo thang 7 mức của võ hồn (≤ 7 màu)
//   shared/assets/sprites/iso/fx/sk_<tên>_g.png  lớp cộng sáng riêng (viền đặc 2 điểm quanh phần sáng nhất, một màu), code hạ theo mức hiệu ứng
// Bước: nhị phân alpha → nhuộm theo độ sáng (viền #1a1020 / tối / chủ / nhấn / sáng, không lòe) → bỏ khung rỗng ở hai đầu → lớp sáng.
//   node tools/assets/skill-vfx/post.mjs --raw <nháp> [--only a,b] [--thr 90]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { encodePng, hex, SPRITES } from "../lib.mjs";
import { rawStrip } from "../vfx-strip.mjs";

const args = process.argv.slice(2);
const opt = (n, d = "") => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const raw = opt("--raw"), only = opt("--only").split(",").filter(Boolean), THR = +opt("--thr", "90");
if (!raw) { console.error("cần --raw"); process.exit(1); }
const here = path.dirname(fileURLToPath(import.meta.url)), spec = JSON.parse(readFileSync(path.join(here, "pilot.json"), "utf8"));
const outDir = path.join(SPRITES, "iso", "fx"); mkdirSync(outDir, { recursive: true });
const PAD = 4;
const mix = (a, b) => a.map((v, i) => Math.round((v + b[i]) / 2));

/** Thang 7 mức theo độ sáng: ngưỡng trên của mỗi mức. */
function ramp(pal) {
  const [o, lo, main, hi, white] = pal.map(hex);
  return [[0.2, o], [0.36, lo], [0.5, mix(lo, main)], [0.66, main], [0.8, mix(main, hi)], [0.92, hi], [2, white]];
}
const lum = (r, g, b) => (0.3 * r + 0.59 * g + 0.11 * b) / 255;
const pick = (R, l) => R.find(([t]) => l < t)[1];

for (const s of spec.sheets.concat(spec.extra ?? [])) {
  if (only.length && !only.includes(s.n)) continue;
  const f = path.join(raw, `${s.n}.png`); if (!existsSync(f)) { console.log(`[post] ${s.n}: chưa có ảnh thô`); continue; }
  const src = rawStrip(f), fr = JSON.parse(readFileSync(f.replace(/\.png$/, ".json"), "utf8")).frames, fw = fr[0].frame.w, fh = fr[0].frame.h, n = fr.length, S = Math.max(fw, fh), W = S + 2 * PAD, ox = (S - fw) >> 1, oy = (S - fh) >> 1;
  const R = ramp(spec.vohon[s.v].palette), main = hex(spec.vohon[s.v].palette[2]);
  // khung → lưới cỡ W×W
  const frames = [];
  for (let k = 0; k < n; k++) {
    const g = { w: W, h: W, data: Buffer.alloc(W * W * 4), px: 0 };
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      const i = (y * src.w + k * fw + x) * 4; if (src.data[i + 3] < THR) continue;
      const c = pick(R, lum(src.data[i], src.data[i + 1], src.data[i + 2])), d = ((y + PAD + oy) * W + x + PAD + ox) * 4;
      g.data[d] = c[0]; g.data[d + 1] = c[1]; g.data[d + 2] = c[2]; g.data[d + 3] = 255; g.px++;
    }
    frames.push(g);
  }
  let a = 0, b = n; while (a < b - 1 && frames[a].px < 4) a++; while (b > a + 1 && frames[b - 1].px < 4) b--;
  const kept = frames.slice(a, b);
  // lớp sáng: quanh điểm sáng nhất (nhấn / sáng), viền đặc 2 điểm
  const bright = (g, x, y) => { const d = (y * W + x) * 4; return g.data[d + 3] === 255 && lum(g.data[d], g.data[d + 1], g.data[d + 2]) > 0.7; };
  const strip = (arr, glow) => {
    const o = { w: W * arr.length, h: W, data: Buffer.alloc(W * arr.length * W * 4) };
    arr.forEach((g, k) => {
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
        let c = null;
        if (!glow) { const i = (y * W + x) * 4; if (g.data[i + 3]) c = [g.data[i], g.data[i + 1], g.data[i + 2]]; }
        else if (!g.data[(y * W + x) * 4 + 3]) {
          let near = 99;
          for (let dy = -2; dy <= 2 && near > 2; dy++) for (let dx = -2; dx <= 2; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < W && bright(g, X, Y)) { near = 1; break; } }
          if (near <= 2) c = main; // viền đặc 2 điểm quanh phần sáng nhất; code vẽ cộng sáng, độ đục theo mức hiệu ứng
        }
        if (c) { const d = (y * o.w + k * W + x) * 4; o.data[d] = c[0]; o.data[d + 1] = c[1]; o.data[d + 2] = c[2]; o.data[d + 3] = 255; }
      }
    });
    if (glow) arr.forEach((g, k) => { // validate cấm khung rỗng: khung không có điểm sáng nào giữ một điểm ở góc (không nhìn thấy được)
      let any = false; for (let y = 0; y < W && !any; y++) for (let x = 0; x < W; x++) if (o.data[(y * o.w + k * W + x) * 4 + 3]) { any = true; break; }
      if (!any) { const d = (1 * o.w + k * W + 1) * 4; o.data[d] = main[0]; o.data[d + 1] = main[1]; o.data[d + 2] = main[2]; o.data[d + 3] = 255; }
    });
    return o;
  };
  writeFileSync(path.join(outDir, `sk_${s.n}.png`), encodePng(strip(kept, false)));
  const gl = strip(kept, true), glowPx = gl.data.reduce((t, v, i) => t + (i % 4 === 3 && v ? 1 : 0), 0);
  if (glowPx > 20) writeFileSync(path.join(outDir, `sk_${s.n}_g.png`), encodePng(gl));
  const meta = JSON.parse(readFileSync(f.replace(/\.png$/, ".meta.json"), "utf8"));
  console.log(`[post] ${s.n}: ${kept.length}/${n} khung ${W}×${W} fps ${meta.fps} điểm/khung ${kept.map((g) => g.px).join(",")}${glowPx > 20 ? " +sáng" : ""}`);
}
