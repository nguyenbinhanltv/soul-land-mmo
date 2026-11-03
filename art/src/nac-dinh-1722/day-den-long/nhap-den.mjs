// Chạy từ gốc repo: node <script> <thư mục RAW> <thư mục tạm>.
// Cùng 16 pixel / đơn vị mô hình cho cả hai tr?c ??n; không vẽ lại nội dung Codex.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.argv[2] || !process.argv[3]) throw Error("Cần thư mục RAW và thư mục tạm");
const rawDir = path.resolve(process.argv[2]);
const outDir = path.resolve(process.argv[3]);
const modelDir = path.dirname(fileURLToPath(import.meta.url));
const { readPng, encodePng, Img } = await import(pathToFileURL(path.join(process.cwd(), "tools/assets/lib.mjs")));
fs.mkdirSync(outDir, { recursive: true });
const run = (args) => {
  const r = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (r.status !== 0) throw Error(`Công cụ lỗi: ${args[0]}`);
};

function bbox(im) {
  let x0 = im.w, y0 = im.h, x1 = -1, y1 = -1;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    if (im.get(x, y)[3] < 128) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// iso-build thêm viền ngoài cho điểm sáng: tính phép tịnh tiến neo qua bước crop.
function importBottom(im) {
  let bottom = -1;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const p = im.get(x, y);
    if (p[3] < 128) continue;
    bottom = Math.max(bottom, y);
    if (y + 1 < im.h && .299 * p[0] + .587 * p[1] + .114 * p[2] >= .12 * 255)
      bottom = Math.max(bottom, y + 1);
  }
  return bottom;
}

for (const name of ["den_long_treo_x", "den_long_treo_y"]) {
  const rawFile = path.join(rawDir, `${name}-raw.png`);
  const raw = readPng(rawFile);
  const cleanDir = path.join(outDir, `clean-${name}`);
  const frame = Math.ceil(Math.max(raw.w, raw.h) / 16) * 16 + 32;
  run(["tools/assets/gemini-import.mjs", "--kind", "object", "--size", String(frame),
    "--scale", "1", "--cell", "1", "--palette", "none", "--grid", "1x1",
    "--logo", "off", "--names", name, "--out", cleanDir, rawFile]);
  const clean = readPng(path.join(cleanDir, `${name}.png`)), b = bbox(clean);
  const model = JSON.parse(fs.readFileSync(path.join(modelDir, `${name}-model.json`), "utf8"));
  const pts = [], xy = [];
  const add = (x, y, z) => { pts.push([x - y, (x + y) / 2 - z]); xy.push([x, y]); };
  for (const m of model) {
    if (m.t === "poly") m.p.forEach((p) => add(...p));
    else if (m.t === 'cyl') { for (let k=0;k<24;k++) { const a=k*Math.PI*2/24; for (const z of [m.z,m.z+m.h]) add(m.x+m.r*Math.cos(a),m.y+m.r*Math.sin(a),z); } }
    else for (const x of [m.x, m.x + m.w]) for (const y of [m.y, m.y + m.d])
      for (const z of [m.z, m.z + m.h]) add(x, y, z);
  }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
  const cx = (Math.min(...xy.map((p) => p[0])) + Math.max(...xy.map((p) => p[0]))) / 2;
  const cy = (Math.min(...xy.map((p) => p[1])) + Math.max(...xy.map((p) => p[1]))) / 2;
  const fx = 128 - 8 * (xmin + xmax), fy = 128 - 8 * (ymin + ymax);
  const groundAnchor = name.endsWith('_x') ? [7, 0, 0] : [0, 8, 0];
  const sourceFoot = [fx + 16 * (groundAnchor[0] - groundAnchor[1]),
    fy + 8 * (groundAnchor[0] + groundAnchor[1])];
  const scaled = new Img(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const nx = ((x - fx) / 16 - xmin) / (xmax - xmin);
    const ny = ((y - fy) / 16 - ymin) / (ymax - ymin);
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) continue;
    const q = clean.get(Math.round(b.x0 + nx * (b.w - 1)), Math.round(b.y0 + ny * (b.h - 1)));
    if (q[3] >= 128) scaled.set(x, y, [...q.slice(0, 3), 255]);
  }
  const scaledFile = path.join(outDir, `${name}-scaled.png`);
  fs.writeFileSync(scaledFile, encodePng(scaled));
  run(["tools/assets/iso-build.mjs", "prop", name, scaledFile, "--map", "nac_dinh_thanh", "--foot-x", "128"]);
  const publicFile = `shared/assets/sprites/iso/props/${name}.png`;
  run(["tools/assets/normal.mjs", publicFile]);
  const dst = readPng(publicFile), bottom = importBottom(scaled);
  const spriteFoot = [Math.round(sourceFoot[0] + dst.w / 2 - 128),
    Math.round(sourceFoot[1] + dst.h - 4 - (bottom - 3))];
  fs.writeFileSync(path.join(outDir, `${name}-meta.json`), JSON.stringify({
    name, secondFootDelta: name.endsWith('_x') ? [-112,-56] : [128,-64], units: 16, bounds: [xmin, ymin, xmax, ymax], groundAnchor,
    sourceFoot, sourceBox: bbox(scaled), cleanBox: b, spriteFoot,
    spriteSize: [dst.w, dst.h], importBoxMaxY: bottom,
  }, null, 2) + "\n");
  console.log(`${name}: neo [${spriteFoot}], khung ${dst.w}×${dst.h}`);
}
