// Hậu kỳ asset C6: giảm mẫu nearest-neighbor và lượng tử màu để giữ nét pixel.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { decodePng, encodePng, Img } from "./lib.mjs";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const jobs = [
  ["logo-raw.png", "logo.png", 512, 512, 128, 128, true],
  ["login-raw.png", "login-bg.png", 1280, 720, 320, 180, false],
  ["loading-raw.png", "loading-bg.png", 1280, 720, 320, 180, false],
  ["event-raw.png", "event-banner.png", 1536, 512, 384, 128, false],
];
const srcDir = path.join(ROOT, "art", "src", "imagegen", "c6");
const outDir = path.join(ROOT, "shared", "assets", "ui", "c6");
mkdirSync(outDir, { recursive: true });

function quantize(v) { return Math.max(0, Math.min(255, Math.round(v / 16) * 16)); }

for (const [input, output, w, h, lowW, lowH, alpha] of jobs) {
  const src = decodePng(readFileSync(path.join(srcDir, input)));
  const low = new Img(lowW, lowH);
  for (let y = 0; y < lowH; y++) for (let x = 0; x < lowW; x++) {
    const sx = Math.min(src.w - 1, Math.floor(x * src.w / lowW));
    const sy = Math.min(src.h - 1, Math.floor(y * src.h / lowH));
    const [r, g, b] = src.get(sx, sy);
    low.set(x, y, [quantize(r), quantize(g), quantize(b), alpha ? src.alpha(sx, sy) : 255]);
  }
  const out = new Img(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    out.set(x, y, low.get(Math.floor(x * lowW / w), Math.floor(y * lowH / h)));
  }
  writeFileSync(path.join(outDir, output), encodePng(out));
  console.log(`[c6-post] ${output} ${src.w}x${src.h} -> ${w}x${h}, pixel base ${lowW}x${lowH}`);
}
