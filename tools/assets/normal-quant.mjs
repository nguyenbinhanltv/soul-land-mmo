// Lượng tử lại normal map `_n.png` đã có (#975), chỉ đổi file _n, không đụng ảnh màu; chạy lại an toàn (đã lượng tử thì không đổi).
//   node tools/assets/normal-quant.mjs [<thư mục | file _n.png> …] [--bits 5] [--check] [--max-deg 4]
// Mặc định quét shared/assets/sprites. In dung lượng trước / sau và sai số góc pháp tuyến (trung bình / lớn nhất) so với bản 8 bit.
// --check: không ghi; thoát 1 nếu còn _n chưa lượng tử (CI / npm run check) hoặc sai số lớn nhất vượt --max-deg.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, NORMAL_BITS, decodePng, encodePng, quantizeNormal, normalAngleError } from "./lib.mjs";

const walk = (p) => statSync(p).isDirectory() ? readdirSync(p).flatMap((n) => walk(path.join(p, n))) : /_n\.png$/.test(p) ? [p] : [];

export function quantFile(file, bits = NORMAL_BITS, write = true) {
  const raw = readFileSync(file), before = decodePng(raw), after = quantizeNormal(decodePng(raw), bits);
  const same = before.data.every((v, i) => !before.data[i | 3] || v === after.data[i]); // điểm trong suốt không tính
  const png = encodePng(after), err = normalAngleError(before, after);
  const done = !same; // luôn ghi khi lệch lưới (đích là đúng 5 bit, dung lượng chỉ để báo cáo); --check không bao giờ kẹt
  if (done && write) writeFileSync(file, png);
  return { file, bytesBefore: raw.length, bytesAfter: done ? png.length : raw.length, quantized: same, ...err };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
  const bits = +opt("--bits", String(NORMAL_BITS)), maxDeg = +opt("--max-deg", "4"), ci = args.includes("--check");
  const targets = args.filter((a) => a !== "--check");
  const files = (targets.length ? targets : [path.join(ROOT, "shared", "assets", "sprites")]).flatMap((t) => statSync(t).isDirectory() ? walk(t) : [t]);
  let b = 0, a = 0, sumMean = 0, max = 0, todo = 0;
  for (const f of files) {
    const r = quantFile(f, bits, !ci);
    b += r.bytesBefore; a += r.bytesAfter; sumMean += r.mean; max = Math.max(max, r.max);
    if (ci && !r.quantized) { todo++; console.error(`[normal-quant] ${path.relative(ROOT, f)}: chưa lượng tử ${bits} bit (node tools/assets/normal-quant.mjs)`); }
  }
  const kb = (n) => (n / 1024).toFixed(0);
  console.log(`[normal-quant] ${files.length} file _n, ${bits} bit: ${kb(b)} KB → ${kb(a)} KB (${b ? ((1 - a / b) * 100).toFixed(1) : 0}% nhỏ hơn); sai số góc trung bình ${(sumMean / (files.length || 1)).toFixed(2)}°, lớn nhất ${max.toFixed(2)}°`);
  if (ci && (todo || max > maxDeg)) { if (max > maxDeg) console.error(`[normal-quant] sai số góc lớn nhất ${max.toFixed(2)}° > ${maxDeg}°`); process.exit(1); }
}
