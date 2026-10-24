// Pháp tướng Võ Hồn Chân Thân (#482, H1 #485): khung PixelLab 128×128 → sheet 160×160, 5 hướng × (idle 8, attack 8), hư ảnh + viền sáng.
//   node tools/assets/phaptuong.mjs --id <mã võ hồn> [--src <thư mục>] [--code idle,attack] [--out <file.png>] [--preview <file.png>]
//
// Nguồn ảnh (mặc định `art/src/pixellab/phap_tuong/<id>/`, đọc cả `recipe.json` cùng thư mục):
//   - `<hướng>_idle_NN.png`, `<hướng>_attack_NN.png`: khung 128×128 từ `animate-with-text-v3` (hướng s, se, e, ne, n; NN từ 00);
//   - `<hướng>.png`: ảnh tĩnh 128×128 của hướng đó (từ `generate-8-rotations-v3`). Cùng với `--code idle,attack` (hoặc recipe `code`),
//     công cụ dựng hoạt ảnh bằng code cho vật cứng (búa, tháp...): idle nhấp nhô + xoay nhẹ + sáng nhịp, attack nhấc lên rồi nện xuống
//     kèm bụi và vết nứt. Không tốn lượt PixelLab.
// Hậu kỳ mỗi hướng: hộp bao (alpha > ALPHA_MIN) hợp của cả 16 khung đặt sao cho giữa-đáy hộp trùng gốc PT_ORIGIN (cùng hộp cho idle và
// attack nên gốc không nhảy giữa hai hoạt ảnh); điểm alpha ≤ PT_ALPHA_MIN bỏ, còn lại đục 255 (độ đục hư ảnh do client áp, `pt.ghost` ở
// manifest); viền sáng 2 điểm màu `col` của võ hồn (VOHON) quanh hình (điểm ngoài dithering); cả sheet giảm còn PT_MAX_COLORS màu
// (median cut). Bố cục sheet: isoLayout("phaptuong") trong lib.mjs.
// `recipe.post` (tùy chọn, dùng cho lô Sinh vật P1 trở đi): { despeckle: N (xóa cụm điểm lẻ < N điểm, mặc định 0), anchor: "median" (đặt điểm neo
// theo trung vị của 8 khung idle thay cho hộp bao hợp), stabilize: px (kẹp khung idle lệch neo quá px, mặc định 0 = không), maxColors: N (≤ PT_MAX_COLORS),
// idleLoop: [chỉ số khung] (xếp lại 8 khung idle thành vòng thở mượt, ví dụ [0,1,2,3,4,3,2,1]: đi tới giữa rồi quay về, không nhảy ở điểm nối), attackLoop: "peak" (đánh = khung 0 → khung đổi nhiều nhất trong 2–4, giữ 2 khung lúc chạm, rồi quay về dần, khung cuối là khung 1: hoạt ảnh PixelLab thường kết thúc ở tư thế xa idle),
// match: { idle: 0..1, attack: 0..1 } (khớp biểu đồ màu từng kênh về khung idle đầu, diệt nhấp nháy màu / độ sáng của hoạt ảnh PixelLab), tint: { color, amount: { <hướng>: 0..1 } } (đẩy điểm xám / trắng về màu, ví dụ đẩy cyan cho Băng Phượng) }. Luôn in độ lệch điểm neo từng hướng
// (neo = giữa-đáy hộp bao mỗi khung): lệch quá 2 điểm giữa các khung idle thì cảnh báo.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { ROOT, SPRITES, Img, readPng, encodePng, hex, vohonColors, ISO_DIRS, isoLayout, PT_FRAME, PT_ORIGIN, PT_ALPHA_MIN, PT_MAX_COLORS, toHex, OUTLINE } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const id = opt("--id", ""), codeOpt = opt("--code", ""), previewOut = opt("--preview", "");
const fail = (m) => { console.error(`[phaptuong] ${m}`); process.exit(1); };
if (!id) fail("Cách dùng: phaptuong.mjs --id <mã võ hồn> [--src <thư mục>] [--code idle,attack] [--out <file.png>] [--preview <file.png>]");
const src = opt("--src", path.join(ROOT, "art", "src", "pixellab", "phap_tuong", id));
const out = opt("--out", path.join(SPRITES, "phaptuong", `${id}.png`));
const recipe = existsSync(path.join(src, "recipe.json")) ? JSON.parse(readFileSync(path.join(src, "recipe.json"), "utf8")) : {};
const code = new Set((codeOpt || (recipe.code ?? []).join(",")).split(",").filter(Boolean));
const colors = vohonColors(id);
if (!colors) fail(`không có võ hồn "${id}" trong VOHON`);
const COL = hex(colors[0]);
const L = isoLayout("phaptuong");
const [N_IDLE, N_ATK] = [L.anims.idle[1], L.anims.attack[1]];
const OUTLINE_RGB = hex("#1a1020");

// ---------- Hoạt ảnh bằng code cho vật cứng (0 lượt PixelLab) ----------
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
/** Xoay `deg` độ quanh (cx, cy) rồi dời dy, láng giềng gần nhất (không làm mờ pixel). */
function xform(im, deg, cx, cy, dy, bright = 1) {
  const o = new Img(im.w, im.h), a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const X = x - cx, Y = y - dy - cy, u = Math.round(c * X + s * Y + cx), v = Math.round(-s * X + c * Y + cy);
    if (u < 0 || v < 0 || u >= im.w || v >= im.h) continue;
    const p = im.get(u, v);
    if (p[3]) o.set(x, y, [Math.min(255, p[0] * bright), Math.min(255, p[1] * bright), Math.min(255, p[2] * bright), p[3]]);
  }
  return o;
}
/** Đệm 16 điểm mỗi phía để xoay / nhấc không cắt hình (hậu kỳ tính hộp bao và đặt lại theo gốc). */
const PAD = 16;
const pad = (im) => { const o = new Img(im.w + 2 * PAD, im.h + 2 * PAD); o.blit(im, 0, 0, im.w, im.h, PAD, PAD); return o; };
const codeIdle = (st) => Array.from({ length: N_IDLE }, (_, i) => {
  const t = (i / N_IDLE) * 2 * Math.PI;
  return xform(st, Math.sin(t) * 1.2, 64 + PAD, 118 + PAD, Math.round(Math.sin(t) * 2), 1 + 0.12 * (Math.sin(t) + 1) / 2);
});
const ATK_POSE = [[0, 0], [5, 0], [9, -1], [9, -1], [-8, 4], [-5, 5], [-2, 3], [0, 1]]; // [độ xoay, dy] mỗi khung
const codeAttack = (st, seed) => ATK_POSE.slice(0, N_ATK).map(([deg, dy], i) => {
  const im = xform(st, deg, 64 + PAD, 110 + PAD, dy);
  if (i >= 4) { // vết nứt dưới đáy, rồi bụi bay lên
    const n = Math.min(3, i - 3);
    for (const sgn of [-1, 1]) for (let k = 0; k <= n; k++) im.set(64 + PAD + sgn * 8 * k, 118 + PAD + (k % 2), [...OUTLINE_RGB, 255]);
    const r = mulberry(seed + i), t = (i - 3) / 4;
    for (let k = 0; k < 14; k++) {
      const ang = r() * Math.PI, sp = (8 + r() * 26) * t, x = Math.round(64 + PAD + Math.cos(ang) * sp * (k % 2 ? 1 : -1)), y = Math.round(116 + PAD - Math.sin(ang) * sp * 0.6);
      const c = k % 3 ? [170, 170, 185] : [240, 240, 250];
      for (const [dx, dy2] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (x + dx >= 0 && x + dx < im.w && y + dy2 >= 0 && y + dy2 < im.h) im.set(x + dx, y + dy2, [...c, Math.round(255 * (1 - t * 0.7))]);
    }
  }
  return im;
});

// ---------- Nạp khung ----------
const loadFrames = (d, anim, n) => Array.from({ length: n }, (_, i) => {
  const f = path.join(src, `${d}_${anim}_${String(i).padStart(2, "0")}.png`);
  if (!existsSync(f)) fail(`thiếu ${f}`);
  return readPng(f);
});
function framesOf(d, anim, n, seed) {
  if (code.has(anim)) {
    const f = path.join(src, `${d}.png`);
    if (!existsSync(f)) fail(`--code ${anim} cần ảnh tĩnh ${f}`);
    const st = pad(readPng(f));
    return anim === "idle" ? codeIdle(st) : codeAttack(st, seed);
  }
  return loadFrames(d, anim, n);
}

// ---------- Hậu kỳ ----------
const solid = (im, x, y) => x >= 0 && y >= 0 && x < im.w && y < im.h && im.alpha(x, y) > PT_ALPHA_MIN;
const POST = recipe.post ?? {};
/** Nhị phân hóa alpha, xóa cụm điểm lẻ nhỏ hơn `min` điểm (8 láng giềng), đẩy điểm xám / trắng về màu `tint` (đẩy cyan cho Băng Phượng...). */
function clean(f, dir) {
  const o = new Img(f.w, f.h), seen = new Uint8Array(f.w * f.h);
  const tint = POST.tint, amt = tint ? (tint.amount?.[dir] ?? 0) : 0, tc = tint ? hex(tint.color) : null;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.alpha(x, y) > PT_ALPHA_MIN) {
    const p = f.get(x, y); let c = [p[0], p[1], p[2]];
    if (amt && Math.max(...c) - Math.min(...c) < 60 && Math.max(...c) > 110) c = c.map((v, k) => Math.round(v * (1 - amt) + tc[k] * amt));
    o.set(x, y, [...c, 255]);
  }
  const min = POST.despeckle ?? 0;
  if (min > 1) for (let y0 = 0; y0 < f.h; y0++) for (let x0 = 0; x0 < f.w; x0++) {
    if (!o.alpha(x0, y0) || seen[y0 * f.w + x0]) continue;
    const comp = [], st = [[x0, y0]]; seen[y0 * f.w + x0] = 1;
    while (st.length) {
      const [x, y] = st.pop(); comp.push([x, y]);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < f.w && Y < f.h && o.alpha(X, Y) && !seen[Y * f.w + X]) { seen[Y * f.w + X] = 1; st.push([X, Y]); } }
    }
    if (comp.length < min) for (const [x, y] of comp) o.set(x, y, [0, 0, 0, 0]);
  }
  return o;
}
/** Biểu đồ phân bố (CDF) từng kênh RGB của các điểm đục. */
function colorStats(f) {
  const cdf = [0, 1, 2].map(() => new Float64Array(256)); let c = 0;
  for (let i = 0; i < f.data.length; i += 4) if (f.data[i + 3]) { c++; for (let k = 0; k < 3; k++) cdf[k][f.data[i + k]]++; }
  for (const h of cdf) { let a = 0; for (let v = 0; v < 256; v++) { a += h[v]; h[v] = c ? a / c : 0; } }
  return { cdf };
}
/** Khớp biểu đồ từng kênh của khung `f` với khung tham chiếu `ref` (histogram specification), trộn theo độ mạnh `k` (0..1): diệt nhấp nháy màu / độ sáng. */
function matchColor(f, ref, k) {
  if (!k) return f;
  const a = colorStats(f), map = [0, 1, 2].map((c) => {
    const m = new Uint8Array(256); let j = 0;
    for (let v = 0; v < 256; v++) { while (j < 255 && ref.cdf[c][j] < a.cdf[c][v]) j++; m[v] = j; }
    return m;
  });
  const o = new Img(f.w, f.h, new Uint8Array(f.data));
  for (let i = 0; i < o.data.length; i += 4) if (o.data[i + 3]) for (let c = 0; c < 3; c++) o.data[i + c] = Math.round(o.data[i + c] * (1 - k) + map[c][o.data[i + c]] * k);
  return o;
}
/** Hộp bao (alpha > 0) và điểm neo (giữa-đáy) của một khung. */
function anchorOf(f) {
  let x0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.alpha(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return x1 < 0 ? null : { cx: (x0 + x1 + 1) / 2, bottom: y1 + 1 };
}
const med = (a) => { const v = [...a].sort((p, q) => p - q); return v[v.length >> 1]; };
/** Dời khung nguồn (đã đệm) dx, dy điểm. */
function shift(f, dx, dy) { const o = new Img(f.w, f.h); o.blit(f, 0, 0, f.w, f.h, dx, dy); return o; }
function bake(frames, ox, oy) {
  return frames.map((f) => {
    const o = new Img(PT_FRAME, PT_FRAME), body = (x, y) => solid(f, x - ox, y - oy);
    for (let y = 0; y < PT_FRAME; y++) for (let x = 0; x < PT_FRAME; x++) {
      if (body(x, y)) { const p = f.get(x - ox, y - oy); o.set(x, y, [p[0], p[1], p[2], 255]); continue; }
      let d = 3; // khoảng cách Chebyshev tới điểm thân gần nhất (chỉ cần tới 2)
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (body(x + dx, y + dy)) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
      if (d === 1 || (d === 2 && (x + y) % 2 === 0)) o.set(x, y, [...COL, 255]);
    }
    return o;
  });
}
/** Median cut theo số điểm: giảm sheet còn tối đa `max` màu, mỗi hộp màu thay bằng điểm thật gần trung bình nhất (như lpc-item.mjs). */
function quantize(t, max) {
  const count = new Map();
  for (let i = 0; i < t.data.length; i += 4) if (t.data[i + 3]) { const c = toHex([t.data[i], t.data[i + 1], t.data[i + 2]]); count.set(c, (count.get(c) ?? 0) + 1); }
  if (count.size <= max) return count.size;
  const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const keep = new Set([hex(OUTLINE).join(","), COL.join(",")]); // viền #1a1020 và màu viền sáng giữ nguyên
  let boxes = [[...count].filter(([c]) => !keep.has(hex(c).join(","))).map(([c, n]) => ({ p: hex(c), n, c }))];
  while (boxes.length < max - keep.size) {
    let bi = -1, best = 0, axis = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      const span = [0, 1, 2].map((k) => Math.max(...b.map((x) => x.p[k])) - Math.min(...b.map((x) => x.p[k])));
      const a = span.indexOf(Math.max(...span)), score = span[a] * b.reduce((m, x) => m + x.n, 0);
      if (score > best) { best = score; bi = i; axis = a; }
    });
    if (bi < 0) break;
    const b = boxes[bi].sort((x, y) => x.p[axis] - y.p[axis]), half = b.reduce((m, x) => m + x.n, 0) / 2;
    // mốc cắt gần nửa số điểm nhất: màu nặng (nền trắng của thỏ, hổ) vượt nửa hộp thì tách riêng, không dính với các màu nhẹ bên dưới
    let acc = 0, cut = 1; for (let i = 0; i < b.length - 1; i++) { acc += b[i].n; if (acc >= half) { cut = i > 0 && acc - half > half - (acc - b[i].n) ? i : i + 1; break; } }
    boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut));
  }
  const map = new Map();
  for (const b of boxes) {
    const N = b.reduce((m, x) => m + x.n, 0), mean = [0, 1, 2].map((k) => b.reduce((m, x) => m + x.p[k] * x.n, 0) / N);
    const rep = b.reduce((a, x) => (dist(x.p, mean) < dist(a.p, mean) ? x : a)).p;
    for (const x of b) map.set(x.c, rep);
  }
  for (let i = 0; i < t.data.length; i += 4) {
    if (!t.data[i + 3]) continue;
    const r = map.get(toHex([t.data[i], t.data[i + 1], t.data[i + 2]])); if (r) [t.data[i], t.data[i + 1], t.data[i + 2]] = r;
  }
  return max;
}

const sheet = new Img(PT_FRAME * L.cols, PT_FRAME * L.rows);
ISO_DIRS.forEach((d, row) => {
  let idle0 = framesOf(d, "idle", N_IDLE, 11).map((f) => clean(f, d)), atk0 = framesOf(d, "attack", N_ATK, 29).map((f) => clean(f, d));
  if (POST.idleLoop) idle0 = POST.idleLoop.map((i) => idle0[i]);
  if (POST.attackLoop === "peak") {
    const diff = (f, g) => { let n = 0; for (let i = 0; i < f.data.length; i += 4) { const a = f.data[i + 3], b = g.data[i + 3]; if ((a === 0) !== (b === 0) || (a && Math.abs(f.data[i] - g.data[i]) + Math.abs(f.data[i + 1] - g.data[i + 1]) + Math.abs(f.data[i + 2] - g.data[i + 2]) > 90)) n++; } return n; };
    let peak = 2; for (let i = 3; i <= 4; i++) if (diff(atk0[i], atk0[0]) > diff(atk0[peak], atk0[0])) peak = i; // đỉnh trong 2–4 để còn chỗ quay về
    const seq = []; for (let i = 0; i <= peak; i++) seq.push(i);
    seq.push(peak); // giữ 2 khung lúc chạm
    const back = N_ATK - seq.length; // quay về dần: chia đều từ đỉnh xuống khung 1, khung cuối luôn là khung 1
    for (let k = 1; k <= back; k++) seq.push(Math.max(1, Math.floor(peak - ((peak - 1) * k) / back)));
    console.log(`[phaptuong] đánh ${d}: đỉnh ${peak}, chuỗi ${seq.join(" ")}`);
    atk0 = seq.slice(0, N_ATK).map((i) => atk0[i]);
  }
  if (POST.match) { const ref = colorStats(idle0[0]); idle0 = idle0.map((f, i) => (i ? matchColor(f, ref, POST.match.idle ?? 1) : f)); atk0 = atk0.map((f) => matchColor(f, ref, POST.match.attack ?? 0.5)); }
  const A = [...idle0, ...atk0].map(anchorOf);
  if (A.some((a) => !a)) fail(`hướng ${d} có khung trống`);
  const mcx = med(A.slice(0, N_IDLE).map((a) => a.cx)), mb = med(A.slice(0, N_IDLE).map((a) => a.bottom));
  let idle = idle0, atk = atk0;
  if (POST.stabilize) { // kẹp khung idle lệch neo quá `stabilize` điểm về sát ngưỡng
    const k = POST.stabilize, clamp = (v) => (Math.abs(v) > k ? Math.round(v - Math.sign(v) * k) : 0);
    idle = idle0.map((f, i) => shift(f, clamp(mcx - A[i].cx), clamp(mb - A[i].bottom)));
  }
  const all = [...idle, ...atk];
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (const f of all) for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.alpha(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) fail(`hướng ${d} trống`);
  const byMedian = POST.anchor === "median";
  const ox = PT_ORIGIN[0] - Math.floor((byMedian ? mcx : (x0 + x1 + 1) / 2)), oy = PT_ORIGIN[1] - (byMedian ? mb : y1 + 1);
  const dev = (arr, m, key) => Math.max(...arr.map((a) => Math.abs(a[key] - m)));
  const Ai = [...idle, ...atk].map(anchorOf), im = med(Ai.slice(0, N_IDLE).map((a) => a.cx)), ib = med(Ai.slice(0, N_IDLE).map((a) => a.bottom));
  const dIdle = [dev(Ai.slice(0, N_IDLE), im, "cx"), dev(Ai.slice(0, N_IDLE), ib, "bottom")], dAtk = [dev(Ai.slice(N_IDLE), im, "cx"), dev(Ai.slice(N_IDLE), ib, "bottom")];
  console.log(`[phaptuong] neo ${d}: idle lệch ngang ${dIdle[0]} / đáy ${dIdle[1]}, attack lệch ngang ${dAtk[0]} / đáy ${dAtk[1]} điểm${Math.max(...dIdle) > 2 ? "  ⚠ idle > 2" : ""}`);
  bake(all, ox, oy).forEach((b, i) => {
    const col = i < N_IDLE ? L.anims.idle[0] + i : L.anims.attack[0] + (i - N_IDLE);
    sheet.blit(b, 0, 0, PT_FRAME, PT_FRAME, col * PT_FRAME, row * PT_FRAME);
  });
});
const nColors = quantize(sheet, Math.min(PT_MAX_COLORS, POST.maxColors ?? PT_MAX_COLORS));
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, encodePng(sheet));
console.log(`[phaptuong] ${id}: ${path.relative(ROOT, out)} (${sheet.w}×${sheet.h}, ${nColors} màu)`);
if (previewOut) {
  const pv = new Img(sheet.w, sheet.h);
  for (let i = 0; i < pv.data.length; i += 4) { pv.data[i] = 58; pv.data[i + 1] = 62; pv.data[i + 2] = 74; pv.data[i + 3] = 255; }
  for (let y = 0; y < sheet.h; y++) for (let x = 0; x < sheet.w; x++) { const p = sheet.get(x, y); if (p[3]) { const q = pv.get(x, y), a = p[3] / 255; pv.set(x, y, [0, 1, 2].map((k) => Math.round(p[k] * a + q[k] * (1 - a))).concat(255)); } }
  writeFileSync(previewOut, encodePng(pv));
}
