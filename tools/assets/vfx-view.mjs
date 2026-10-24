// S2 (#548): xem nhanh sheet hiệu ứng: phóng to từng khung, đặt trên 2 nền (tối + cỏ sáng), ghép nhiều sheet thành một ảnh xem.
//   node tools/assets/vfx-view.mjs --out <ảnh.png> [--zoom 3] [--bg dark|grass|both] <sheet.png:khung> ...
// `khung`: bề rộng một khung (px); bỏ trống = bằng chiều cao sheet.
import { readFileSync, writeFileSync } from "node:fs";
import { encodePng } from "./lib.mjs";
import { rawStrip } from "./vfx-strip.mjs";

const args = process.argv.slice(2);
const opt = (n, d = "") => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const out = opt("--out"), Z = +opt("--zoom", "3"), bgm = opt("--bg", "both");
if (!out || !args.length) { console.error("cần --out và danh sách sheet"); process.exit(1); }
const BG = { dark: [14, 18, 28], grass: [96, 150, 84] };
const rows = [];
for (const a of args) {
  const [f, fw] = a.split(/:(?=\d+$)/), img = rawStrip(f), w = +fw || img.h, n = Math.floor(img.w / w);
  for (const bg of bgm === "both" ? ["dark", "grass"] : [bgm]) rows.push({ img, w, n, bg, h: img.h });
}
const W = Math.max(...rows.map((r) => r.n * r.w * Z)), H = rows.reduce((s, r) => s + r.h * Z + 2, 0);
const o = { w: W, h: H, data: Buffer.alloc(W * H * 4) };
let y0 = 0;
for (const r of rows) {
  const [br, bg, bb] = BG[r.bg];
  for (let y = 0; y < r.h * Z; y++) for (let x = 0; x < r.n * r.w * Z; x++) {
    const sx = (x / Z) | 0, sy = (y / Z) | 0, i = (sy * r.img.w + sx) * 4, d = ((y0 + y) * W + x) * 4, a = r.img.data[i + 3] / 255;
    const edge = x % (r.w * Z) === 0;
    o.data[d] = edge ? 60 : br * (1 - a) + r.img.data[i] * a; o.data[d + 1] = edge ? 60 : bg * (1 - a) + r.img.data[i + 1] * a; o.data[d + 2] = edge ? 60 : bb * (1 - a) + r.img.data[i + 2] * a; o.data[d + 3] = 255;
  }
  y0 += r.h * Z + 2;
}
writeFileSync(out, encodePng(o));
console.log(`[vfx-view] ${out} ${W}x${H}`);
