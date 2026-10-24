// Ghép 3 khung hồn thú tĩnh (nam, đông, bắc) thành sheet `beast/<loài>.png` (rộng 3 × khung, cao 1 khung).
//   node tools/assets/static-sheet.mjs <nam.png> <dong.png> <bac.png> <ra.png>
// Ba khung phải cùng cỡ vuông (ra từ `gemini-import --kind beast --size <khung>`). Sau đó: `normal.mjs <ra.png> --frame <khung>x<khung>`,
// `validate.mjs --register beast_<loài> --frame <khung>x<khung> --iso --static --map <vùng>` (README mục "Hồn thú lai: sheet tĩnh").
import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodePng, Img } from "./lib.mjs";

const [s, e, n, out] = process.argv.slice(2);
if (!out) { console.error("Cách dùng: static-sheet.mjs <nam.png> <dong.png> <bac.png> <ra.png>"); process.exit(1); }
const frames = [s, e, n].map((f) => decodePng(readFileSync(f)));
const { w, h } = frames[0];
if (w !== h || frames.some((f) => f.w !== w || f.h !== h)) { console.error(`ba khung phải cùng cỡ vuông, nhận ${frames.map((f) => `${f.w}×${f.h}`).join(", ")}`); process.exit(1); }
const sheet = new Img(w * 3, h);
frames.forEach((f, i) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = f.get(x, y); if (p[3]) sheet.set(i * w + x, y, p); } });
writeFileSync(out, encodePng(sheet));
console.log(`[static-sheet] ${w * 3}×${h} → ${out}`);
