// Vẽ ảnh dẫn isometric NHIỀU KHỐI cho img2img ComfyUI (mở rộng comfy-guide.mjs cho dáng phức tạp: tháp nhiều tầng, đền có bậc
// thềm và hàng cột, nhà sàn, lều, giàn phơi, hàng rào). Phép chiếu 2:1 như game (sx = x − y, sy = (x + y) / 2 − z), ánh sáng
// từ trên bên trái: mặt trái (y = D) sáng, mặt phải (x = W) tối. Các khối vẽ theo THỨ TỰ KHAI BÁO (khai từ xa tới gần: y nhỏ, x nhỏ trước).
//   node tools/assets/comfy-shape.mjs <spec.json> <ra.png> [--size 1024] [--fit 0.85]
// Spec: mảng khối.
//   {"t":"box","x":0,"y":0,"z":0,"w":2,"d":2,"h":1,"c":"#d6c8aa","door":true,"win":true,"roof":{"h":0.8,"eave":0.3,"c":"#606870"}}
//        hộp (mái bốn mái nếu có roof, nóc dọc trục dài); door / win vẽ cửa ở mặt trái / cửa sổ ở mặt phải.
//   {"t":"cone","x":1,"y":1,"z":0,"r":1,"h":1.6,"c":"#a08868"}  nón (lều); {"t":"cyl","x":..,"y":..,"z":0,"r":0.3,"h":1,"c":".."}  trụ
//   {"t":"poly","p":[[x,y,z],…],"c":"#…"}  đa giác lồi trong không gian (cờ, lưới, tấm da, cửa lều)
import { readFileSync, writeFileSync } from "node:fs";
import { encodePng, Img } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? +args.splice(i, 2)[1] : d; };
const S = opt("--size", 1024), FIT = opt("--fit", 0.85);
const [specFile, out] = args;
if (!specFile || !out) { console.error("Cách dùng: comfy-shape.mjs <spec.json> <ra.png> [--size 1024] [--fit 0.85]"); process.exit(1); }
const spec = JSON.parse(readFileSync(specFile, "utf8"));
const rgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const shade = (c, k) => c.map((v) => Math.min(255, Math.round(v * k)));
const proj = (x, y, z) => [x - y, (x + y) / 2 - z];

// ---- Điểm biên để vừa khung ----
const pts = [];
const boxPts = (b) => { const o = b.roof ? b.roof.eave ?? 0.3 : 0; for (const x of [b.x - o, b.x + b.w + o]) for (const y of [b.y - o, b.y + b.d + o]) for (const z of [b.z, b.z + b.h + (b.roof?.h ?? 0)]) pts.push(proj(x, y, z)); };
const circ = (b, z) => { for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; pts.push(proj(b.x + b.r * Math.cos(a), b.y + b.r * Math.sin(a), z)); } };
for (const b of spec) { if (b.t === "box") boxPts(b); else if (b.t === "poly") b.p.forEach((p) => pts.push(proj(...p))); else { circ(b, b.z); circ(b, b.z + b.h); } }
const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
const u = (FIT * S) / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
const cx = S / 2 - (u * (Math.max(...xs) + Math.min(...xs))) / 2, cy = S / 2 - (u * (Math.max(...ys) + Math.min(...ys))) / 2;
const P = (x, y, z) => { const [a, b] = proj(x, y, z); return [cx + u * a, cy + u * b]; };

const img = new Img(S, S); img.data.fill(255);
const LINE = Math.max(2, Math.round(S / 170)), OUTLINE = [40, 30, 36, 255];

/** Tô đa giác lồi (điểm màn hình) bằng col(x) theo cột điểm ảnh, viền tối. */
function fill2(pts2, col) {
  const x0 = Math.max(0, Math.floor(Math.min(...pts2.map((p) => p[0])) - LINE)), x1 = Math.min(S - 1, Math.ceil(Math.max(...pts2.map((p) => p[0])) + LINE));
  const y0 = Math.max(0, Math.floor(Math.min(...pts2.map((p) => p[1])) - LINE)), y1 = Math.min(S - 1, Math.ceil(Math.max(...pts2.map((p) => p[1])) + LINE));
  const edges = pts2.map((a, i) => [a, pts2[(i + 1) % pts2.length]]);
  const segDist = ([a, b], x, y) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); };
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5; let inside = false;
    for (const [a, b] of edges) if ((a[1] > py) !== (b[1] > py) && px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    if (edges.some((e) => segDist(e, px, py) <= LINE / 2)) img.set(x, y, OUTLINE);
    else if (inside) img.set(x, y, [...col(px), 255]);
  }
}
const poly3 = (p3, c) => fill2(p3.map((p) => P(...p)), () => c);
const hull = (q) => { const s = [...q].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), h = [];
  for (const p of s) { while (h.length >= 2 && cr(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); }
  const n = h.length + 1; for (let i = s.length - 2; i >= 0; i--) { const p = s[i]; while (h.length >= n && cr(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); }
  h.pop(); return h; };

function box(b) {
  const c = rgb(b.c), { x, y, z, w, d, h } = b, Y = y + d, X = x + w;
  poly3([[x, Y, z], [X, Y, z], [X, Y, z + h], [x, Y, z + h]], c);
  poly3([[X, y, z], [X, Y, z], [X, Y, z + h], [X, y, z + h]], shade(c, 0.75));
  if (b.door) poly3([[x + w * 0.4, Y, z], [x + w * 0.6, Y, z], [x + w * 0.6, Y, z + h * 0.7], [x + w * 0.4, Y, z + h * 0.7]], [92, 58, 36]);
  if (b.win) poly3([[X, y + d * 0.3, z + h * 0.35], [X, y + d * 0.7, z + h * 0.35], [X, y + d * 0.7, z + h * 0.75], [X, y + d * 0.3, z + h * 0.75]], [70, 50, 40]);
  const r = b.roof, T = z + h;
  if (!r) { poly3([[x, y, T], [X, y, T], [X, Y, T], [x, Y, T]], shade(c, 1.12)); return; }
  const o = r.eave ?? 0.3, rc = rgb(r.c), e = [[x - o, y - o, T], [X + o, y - o, T], [X + o, Y + o, T], [x - o, Y + o, T]], H = T + r.h;
  if (w >= d) { const a0 = [x + d / 2, y + d / 2, H], a1 = [X - d / 2, y + d / 2, H]; poly3([e[3], e[2], a1, a0], rc); poly3([e[1], e[2], a1], shade(rc, 0.73)); }
  else { const a0 = [x + w / 2, y + w / 2, H], a1 = [x + w / 2, Y - w / 2, H]; poly3([e[3], e[2], a1], rc); poly3([e[1], e[2], a1, a0], shade(rc, 0.73)); }
}
/** Nón (lều) và trụ: bao lồi của đáy / đỉnh, nửa phải tối hơn. */
function round(b, cone) {
  const c = rgb(b.c), ring = (z, r) => Array.from({ length: 28 }, (_, k) => P(b.x + r * Math.cos((k / 28) * Math.PI * 2), b.y + r * Math.sin((k / 28) * Math.PI * 2), z));
  const top = cone ? [P(b.x, b.y, b.z + b.h)] : ring(b.z + b.h, b.r), mid = P(b.x, b.y, b.z)[0];
  fill2(hull([...ring(b.z, b.r), ...top]), (px) => (px > mid ? shade(c, 0.75) : c));
  if (!cone) fill2(ring(b.z + b.h, b.r), () => shade(c, 1.12));
}
for (const b of spec) { if (b.t === "box") box(b); else if (b.t === "cone") round(b, true); else if (b.t === "cyl") round(b, false); else if (b.t === "poly") poly3(b.p, rgb(b.c)); }
writeFileSync(out, encodePng(img));
console.log(`${out}: ${spec.length} khối, ${S}×${S}`);
