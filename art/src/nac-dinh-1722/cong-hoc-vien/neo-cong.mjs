// Tính neo mặt đất tại tâm ngưỡng cổng từ mô hình và hộp bao sprite đã nhập.
// Chạy từ gốc repo: node <script> <metadata.json ở thư mục tạm>.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, readPng } from "../../../../tools/assets/lib.mjs";

if (!process.argv[2]) throw Error("Cần đường dẫn metadata đầu ra");
const dir = path.dirname(fileURLToPath(import.meta.url));
const model = JSON.parse(fs.readFileSync(path.join(dir, "hoc_vien_cong_da_trang-model.json"), "utf8"));
const points = [], project = ([x, y, z]) => [x - y, (x + y) / 2 - z];
for (const m of model) {
  if (m.t === "poly") points.push(...m.p.map(project));
  else for (const x of [m.x, m.x + m.w]) for (const y of [m.y, m.y + m.d])
    for (const z of [m.z, m.z + m.h]) points.push(project([x, y, z]));
}
const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
const bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
const threshold = model.findLast(m => m.t === "box" && m.h === .04);
if (!threshold) throw Error("Thiếu ngưỡng đá trong mô hình");
const groundAnchor = [threshold.x + threshold.w / 2, threshold.y + threshold.d / 2, 0];
const im = readPng(path.join(ROOT, "shared/assets/sprites/iso/props/hoc_vien_cong_da_trang.png"));
let x0 = im.w, y0 = im.h, x1 = -1, y1 = -1;
for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.get(x, y)[3] >= 128) {
  x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
}
const p = project(groundAnchor);
const foot = [Math.round(x0 + (p[0] - bounds[0]) / (bounds[2] - bounds[0]) * (x1 - x0)),
  Math.round(y0 + (p[1] - bounds[1]) / (bounds[3] - bounds[1]) * (y1 - y0))];
const metadata = { bounds, spriteBox: [x0, y0, x1, y1], groundAnchor, foot, size: [im.w, im.h] };
fs.writeFileSync(process.argv[2], JSON.stringify(metadata, null, 2) + "\n");
console.log(`Neo tâm ngưỡng: [${foot}]`);
