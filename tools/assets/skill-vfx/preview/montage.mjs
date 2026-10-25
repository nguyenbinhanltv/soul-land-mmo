// Ghép khung của các job thành ảnh xem: mỗi hàng một job, các cột là khung ở thời điểm (ms) chọn, cắt vùng giữa.
//   node montage.mjs --frames <thư mục> --out <png> --names a,b,c [--at 150,350,550,800] [--crop 120,40,400,260]
import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodePng } from "../../lib.mjs";
const a = process.argv.slice(2), g = (n, d) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : d; };
const dir = g("--frames"), names = g("--names").split(","), at = g("--at", "150,350,550,800").split(",").map(Number), [cx, cy, cw, ch] = g("--crop", "120,40,400,260").split(",").map(Number);
const o = { w: cw * at.length, h: ch * names.length, data: Buffer.alloc(cw * at.length * ch * names.length * 4) };
names.forEach((n, r) => {
  const T = JSON.parse(readFileSync(`${dir}/${n}/times.json`, "utf8")).frames;
  at.forEach((ms, c) => {
    const f = T.find((x) => x.t >= ms) ?? T.at(-1), img = decodePng(readFileSync(`${dir}/${n}/${f.f}`));
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const s = ((cy + y) * img.w + cx + x) * 4, d = ((r * ch + y) * o.w + c * cw + x) * 4; for (let k = 0; k < 4; k++) o.data[d + k] = img.data[s + k]; }
  });
});
writeFileSync(g("--out"), encodePng(o)); console.log("ok", o.w, o.h);
