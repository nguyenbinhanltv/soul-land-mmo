// Ghép lại MỘT khung (1 trong N khung chia đều theo chiều ngang) từ ảnh Gemini mới vào ảnh cũ, giữ nguyên các khung còn lại.
//   node ghep-khung.mjs <ảnh-cũ.png> <ảnh-mới.png> <ra.png> [--frame 2[,4,5]] [--n 5]
// Dùng cho phụ thể (khuôn 5 ma-nơ-canh, khung 2 = hướng đông nam) và áo hồn sư (5 hướng). Ảnh mới khác cỡ ảnh cũ thì phóng nearest về cỡ ảnh cũ (có cảnh báo).
import fs from "node:fs";
const LIB = "./lib.mjs";
const { decodePng, encodePng, Img } = await import(LIB);
const a = process.argv.slice(2), opt = (n, d) => { const i = a.indexOf(n); return i >= 0 ? a.splice(i, 2)[1] : d; };
const frames = String(opt("--frame", "2")).split(",").map(Number), N = +opt("--n", 5), [oldF, newF, outF] = a;
if (!outF) { console.error("Cách dùng: node ghep-khung.mjs <cũ.png> <mới.png> <ra.png> [--frame 2] [--n 5]"); process.exit(1); }
const old = decodePng(fs.readFileSync(oldF)); let nw = decodePng(fs.readFileSync(newF));
if (nw.w !== old.w || nw.h !== old.h) {
  console.warn(`cảnh báo: ảnh mới ${nw.w}×${nw.h} khác ảnh cũ ${old.w}×${old.h}, phóng nearest về cỡ cũ (khung có thể lệch; ưu tiên bảo Gemini giữ đúng cỡ / khuôn)`);
  const r = new Img(old.w, old.h); for (let y = 0; y < old.h; y++) for (let x = 0; x < old.w; x++) r.set(x, y, nw.get(Math.floor((x * nw.w) / old.w), Math.floor((y * nw.h) / old.h))); nw = r;
}
for (const frame of frames) {
  const x0 = Math.floor(((frame - 1) * old.w) / N), x1 = Math.floor((frame * old.w) / N);
  for (let y = 0; y < old.h; y++) for (let x = x0; x < x1; x++) old.set(x, y, nw.get(x, y));
  console.log(`đã thay khung ${frame}/${N} (cột ${x0}–${x1 - 1})`);
}
fs.writeFileSync(outF, encodePng(old));
console.log(`→ ${outF}`);
