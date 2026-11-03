// Neo tâm nền theo phép chiếu của comfy-shape, kể cả mô hình có mái và cột tròn.
// Chạy: node <script> <model.json> <guide.png> <sprite.png> <metadata.json ở thư mục tạm>.
import fs from "node:fs";
import { readPng } from "../../../../tools/assets/lib.mjs";

const [modelFile, guideFile, spriteFile, outFile] = process.argv.slice(2);
if (!outFile) throw Error("Cần model, ảnh khung, sprite và metadata đầu ra");
const model = JSON.parse(fs.readFileSync(modelFile, "utf8")), points = [];
const project = (x, y, z) => [x - y, (x + y) / 2 - z];
for (const m of model) {
  if (m.t === "poly") points.push(...m.p.map(p => project(...p)));
  else if (m.t === "box") {
    const e = m.roof ? m.roof.eave ?? .3 : 0;
    for (const x of [m.x - e, m.x + m.w + e]) for (const y of [m.y - e, m.y + m.d + e])
      for (const z of [m.z, m.z + m.h + (m.roof?.h ?? 0)]) points.push(project(x, y, z));
  } else for (let k = 0; k < 24; k++) for (const z of [m.z, m.z + m.h]) {
    const a = k * Math.PI / 12;
    points.push(project(m.x + m.r * Math.cos(a), m.y + m.r * Math.sin(a), z));
  }
}
const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
const bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
const guide = readPng(guideFile), sprite = readPng(spriteFile), fit = .85;
const unit = fit * guide.w / Math.max(bounds[2] - bounds[0], bounds[3] - bounds[1]);
const offset = [guide.w / 2 - unit * (bounds[0] + bounds[2]) / 2,
  guide.h / 2 - unit * (bounds[1] + bounds[3]) / 2];
function box(im, white) {
  let x0 = im.w, y0 = im.h, x1 = -1, y1 = -1;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const p = im.get(x, y);
    if (p[3] < 128 || (white && p[0] === 255 && p[1] === 255 && p[2] === 255)) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (x1 < x0) throw Error("Ảnh rỗng");
  return [x0, y0, x1, y1];
}
const floor = model.find(m => m.role === "foundation");
if (!floor) throw Error("Thiếu nền có role foundation");
const groundAnchor = [floor.x + floor.w / 2, floor.y + floor.d / 2, floor.z];
const q = project(...groundAnchor), g = box(guide, true), s = box(sprite, false);
const foot = q.map((v, i) => Math.round(s[i] + (offset[i] + unit * v - g[i]) / (g[i + 2] - g[i]) * (s[i + 2] - s[i])));
const metadata = { bounds, fit, unit, offset, groundAnchor, guideBox: g, spriteBox: s, foot, size: [sprite.w, sprite.h] };
fs.writeFileSync(outFile, JSON.stringify(metadata, null, 2) + "\n");
console.log(`Neo tâm nền: [${foot}]`);
