// Phóng to ảnh pixel (nearest-neighbor) trên nền ô cờ để xem thử bằng mắt.
//   node tools/assets/preview.mjs <ra.png> <lớp1.png> [lớp2.png …] [--scale 8] [--grid 32x32] [--crop x,y,w,h] [--bg #rrggbb]
// Nhiều lớp thì chồng theo thứ tự (thân, áo, tóc…) để xem hồn sư ghép lớp.
// --grid vẽ đường kẻ khung (ví dụ 32x32 cho sheet hồn sư) để soát bố cục 16×4; --crop chỉ lấy một vùng.
import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodePng, Img, hex } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const scale = +opt("--scale", 8), grid = opt("--grid", ""), bg = opt("--bg", ""), crop = opt("--crop", "");
const [out, ...inputs] = args;
if (!out || !inputs.length) { console.error("Cách dùng: preview.mjs <ra.png> <lớp1.png> [lớp2.png …] [--scale 8] [--grid 32x32] [--crop x,y,w,h]"); process.exit(1); }

const layers = inputs.map((f) => decodePng(readFileSync(f)));
const [cx, cy, cw, ch] = crop ? crop.split(",").map(Number) : [0, 0, layers[0].w, layers[0].h];
const src = new Img(cw, ch);
for (const l of layers) src.blit(l, cx, cy, cw, ch, 0, 0, true);
const [gw, gh] = grid ? grid.split("x").map(Number) : [0, 0];
const dst = new Img(src.w * scale, src.h * scale);
for (let y = 0; y < dst.h; y++) for (let x = 0; x < dst.w; x++) {
  const sx = Math.floor(x / scale), sy = Math.floor(y / scale), p = src.get(sx, sy);
  let base = bg ? hex(bg) : ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? [200, 200, 200] : [235, 235, 235]);
  if (gw && (((sx + cx) % gw === 0 && x % scale === 0) || ((sy + cy) % gh === 0 && y % scale === 0))) base = [255, 0, 255];
  const a = p[3] / 255;
  dst.set(x, y, [0, 1, 2].map((i) => Math.round(p[i] * a + base[i] * (1 - a))).concat(255));
}
writeFileSync(out, encodePng(dst));
console.log(`[preview] ${out} (${dst.w}×${dst.h})`);
