// Pháp tướng nhóm VẬT THỂ (khí võ hồn; H3 #487 lô P4): ảnh tĩnh 5 hướng của PixelLab → làm sạch → hai sheet 160×160
//   `phaptuong/<id>.png` (thân) và `phaptuong/<id>_glow.png` (lớp phát sáng, client vẽ cộng sáng), thở + đánh dựng bằng code (0 lượt).
//   node tools/assets/phaptuong-khi.mjs --id <mã> [--preview <file.png>]   dựng hai sheet từ art/src/pixellab/phap_tuong/<id>/
//   node tools/assets/phaptuong-khi.mjs --id <mã> --check                  chỉ kiểm sheet đã dựng: khung bao, điểm neo 5 hướng lệch ≤ 2 điểm, lề
// Tham số mỗi võ hồn ở `recipe.json` (khóa `clean`, `mode`, `prescale`, `chuyenDong`): xem `docs/phap-tuong-cong-thuc.md` mục "Vật thể (khí)".
// Bố cục sheet như `phaptuong.mjs` (isoLayout("phaptuong"): 5 hướng × idle 8 + attack 8). Alpha chỉ 0 / 255; độ đục hư ảnh do client áp (`pt.ghost`).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT, SPRITES, Img, readPng, encodePng, hex, toHex, vohonColors, ISO_DIRS, isoLayout, PT_FRAME, PT_ORIGIN, PT_MAX_COLORS, OUTLINE } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const id = opt("--id", ""), previewOut = opt("--preview", ""), checkOnly = args.includes("--check");
const fail = (m) => { console.error(`[phaptuong-khi] ${m}`); process.exit(1); };
if (!id) fail("Cách dùng: phaptuong-khi.mjs --id <mã võ hồn> [--check] [--preview <file.png>]");
const src = path.join(ROOT, "art", "src", "pixellab", "phap_tuong", id);
const outBody = path.join(SPRITES, "phaptuong", `${id}.png`), outGlow = path.join(SPRITES, "phaptuong", `${id}_glow.png`);
const colors = vohonColors(id);
if (!colors) fail(`không có võ hồn "${id}" trong VOHON`);
const COL = hex(colors[0]), OUT = hex(OUTLINE), GLC = recipe0Glow() ?? COL; // GLC: màu viền / vệt sáng (mặc định màu võ hồn; recipe có thể đặt `glowMau` cho võ hồn đa sắc như A Ngân)
const L = isoLayout("phaptuong"), [N_IDLE, N_ATK] = [L.anims.idle[1], L.anims.attack[1]], N = N_IDLE + N_ATK;
const recipe = JSON.parse(readFileSync(path.join(src, "recipe.json"), "utf8"));
function recipe0Glow() { try { const g = JSON.parse(readFileSync(path.join(src, "recipe.json"), "utf8")).glowMau; return g ? hex(g) : null; } catch { return null; } }
const M = recipe.chuyenDong, CLEAN = recipe.clean ?? {}, MODE = recipe.mode ?? "dat";
const FACE = { s: [0, 0.6], se: [0.8, 0.4], e: [1, 0], ne: [0.8, -0.4], n: [0, -0.6] }; // hướng "ra đòn" trên màn hình (đơn vị điểm × `fwd`)
const rnd = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const lum = (p) => 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2];
const opaque = (im, x, y) => x >= 0 && y >= 0 && x < im.w && y < im.h && im.alpha(x, y) > 0;
const bboxOf = (im) => { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0, sx = 0, sy = 0; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); n++; sx += x; sy += y; } return n ? { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, n, cx: sx / n, cy: sy / n } : null; };

// ---------- Kiểm khung bao / điểm neo ----------
/** Neo của khung: giữa-đáy hộp bao (vật đứng đất, mode "dat") hoặc trọng tâm (vật lơ lửng, mode "troi"). */
const anchorOf = (b) => (MODE === "dat" ? [(b.x0 + b.x1 + 1) / 2, b.y1 + 1] : [b.cx, b.cy]);
function check(sheet, label, anchor = true) {
  let bad = 0; const rows = [];
  ISO_DIRS.forEach((d, r) => {
    const f = new Img(PT_FRAME, PT_FRAME); f.blit(sheet, L.anims.idle[0] * PT_FRAME, r * PT_FRAME, PT_FRAME, PT_FRAME, 0, 0);
    const b = bboxOf(f); rows.push({ d, b, a: anchorOf(b) });
  });
  const dev = [0, 1].map((k) => Math.max(...rows.map((x) => x.a[k])) - Math.min(...rows.map((x) => x.a[k])));
  const hs = rows.map((x) => x.b.h), hDev = (Math.max(...hs) - Math.min(...hs)) / Math.max(...hs);
  console.log(`[kiểm ${label}] neo ${MODE === "dat" ? "giữa-đáy" : "trọng tâm"}: lệch x ${dev[0].toFixed(1)}, y ${dev[1].toFixed(1)} điểm; cao ${rows.map((x) => `${x.d}:${x.b.h}`).join(" ")} (chênh ${(hDev * 100).toFixed(0)}%)`);
  if (anchor && (dev[0] > 2 || dev[1] > 2)) { console.error(`  ✗ điểm neo 5 hướng lệch > 2 điểm`); bad++; }
  let minTop = 1e9, minSide = 1e9;
  for (let r = 0; r < L.rows; r++) for (let c = 0; c < PT_COLS_N; c++) {
    const f = new Img(PT_FRAME, PT_FRAME); f.blit(sheet, c * PT_FRAME, r * PT_FRAME, PT_FRAME, PT_FRAME, 0, 0);
    const b = bboxOf(f); if (!b) { console.error(`  ✗ khung trống (${r},${c})`); bad++; continue; }
    minTop = Math.min(minTop, b.y0); minSide = Math.min(minSide, b.x0, PT_FRAME - 1 - b.x1);
  }
  console.log(`  lề nhỏ nhất: trên ${minTop}, bên ${minSide} điểm`);
  if (minTop < 1 || minSide < 1) { console.error(`  ✗ hình chạm mép khung`); bad++; }
  return bad;
}
const PT_COLS_N = L.cols;
if (checkOnly) {
  if (!existsSync(outBody)) fail(`chưa có ${outBody}`);
  process.exit(check(readPng(outBody), "thân") + (existsSync(outGlow) ? check(readPng(outGlow), "sáng", false) : 0) ? 1 : 0);
}

// ---------- Làm sạch ảnh nguồn ----------
/** Thành phần liên thông 8 hướng của điểm đục: [{ pts: [[x,y]], n }]. */
function components(im) {
  const seen = new Uint8Array(im.w * im.h), out = [];
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    if (!im.alpha(x, y) || seen[y * im.w + x]) continue;
    const q = [[x, y]]; seen[y * im.w + x] = 1; const pts = [];
    while (q.length) { const [a, b] = q.pop(); pts.push([a, b]); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const u = a + dx, v = b + dy; if (opaque(im, u, v) && !seen[v * im.w + u]) { seen[v * im.w + u] = 1; q.push([u, v]); } } }
    out.push({ pts, n: pts.length });
  }
  return out.sort((a, b) => b.n - a.n);
}
/** Thu nhỏ theo hộp (trung bình có trọng số alpha), alpha ≥ 50% → đục. */
function shrink(im, f) {
  if (f === 1) return im;
  const w = Math.round(im.w * f), h = Math.round(im.h * f), o = new Img(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const x0 = Math.floor(x / f), x1 = Math.max(x0 + 1, Math.ceil((x + 1) / f)), y0 = Math.floor(y / f), y1 = Math.max(y0 + 1, Math.ceil((y + 1) / f));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let v = y0; v < y1 && v < im.h; v++) for (let u = x0; u < x1 && u < im.w; u++) { const p = im.get(u, v); n++; if (p[3]) { r += p[0]; g += p[1]; b += p[2]; a++; } }
    if (a * 2 >= n && a) o.set(x, y, [Math.round(r / a), Math.round(g / a), Math.round(b / a), 255]);
  }
  return o;
}
function clean(file) {
  const raw = readPng(file); let im = new Img(raw.w, raw.h);
  for (let y = 0; y < raw.h; y++) for (let x = 0; x < raw.w; x++) { const p = raw.get(x, y); if (p[3] >= 128) im.set(x, y, [p[0], p[1], p[2], 255]); }
  if (CLEAN.catDe) { // bỏ đế đá của concept: xóa điểm xám (độ bão hòa thấp, không phải viền tối), rồi viền tối mồ côi không còn sát điểm màu nào
    const sat = (p) => Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]), S = CLEAN.catDe;
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) { const p = im.get(x, y); if (p[3] && sat(p) < S.sat && lum(p) >= 48) im.set(x, y, [0, 0, 0, 0]); }
    if (S.cot) { // vật dạng cột: bỏ mọi thứ ngoài cột màu (theo nửa trên) và dưới điểm màu thấp nhất
      let x0 = 1e9, x1 = -1, yLow = -1; const col = (x, y) => { const p = im.get(x, y); return p[3] && sat(p) >= S.sat + 30 && lum(p) > 60; };
      for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (col(x, y)) { if (y < im.h * 0.6) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } yLow = Math.max(yLow, y); }
      for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y) && (x < x0 - 2 || x > x1 + 2 || y > yLow + 1)) im.set(x, y, [0, 0, 0, 0]);
    }
    const keep = (x, y) => { for (let dy = -S.gan; dy <= S.gan; dy++) for (let dx = -S.gan; dx <= S.gan; dx++) { const p = opaque(im, x + dx, y + dy) && im.get(x + dx, y + dy); if (p && sat(p) >= S.sat) return true; } return false; };
    const del = []; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y) && !keep(x, y)) del.push([x, y]);
    for (const [x, y] of del) im.set(x, y, [0, 0, 0, 0]);
  }
  if (CLEAN.catMau) { // bỏ đế đất / bóng tối của concept: xóa điểm gần các màu `catMau.mau` (sai số `d`) ở `catMau.duoi` phần dưới hộp bao
    const b0 = bboxOf(im), yMin = b0.y1 - CLEAN.catMau.duoi * b0.h, ks = CLEAN.catMau.mau.map(hex), d2 = CLEAN.catMau.d ** 2;
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) { const p = im.get(x, y); if (p[3] && y >= yMin && ks.some((k) => (k[0] - p[0]) ** 2 + (k[1] - p[1]) ** 2 + (k[2] - p[2]) ** 2 <= d2)) im.set(x, y, [0, 0, 0, 0]); }
  }
  if (CLEAN.thanToi) { // bỏ phần sáng bao quanh (lửa trong concept): giữ vùng tối nhất, đóng khe, lấp lỗ; phần sáng làm lại ở lớp sáng
    const m = new Img(im.w, im.h); for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y) && lum(im.get(x, y)) < CLEAN.thanToi) m.set(x, y, [0, 0, 0, 255]);
    const big = components(m)[0], k = new Img(im.w, im.h); for (const [x, y] of big.pts) k.set(x, y, [0, 0, 0, 255]);
    const morph = (a, grow) => { const o = new Img(a.w, a.h); for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) { let any = false, all = true; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = opaque(a, x + dx, y + dy); any ||= v; all &&= v; } if (grow ? any : all) o.set(x, y, [0, 0, 0, 255]); } return o; };
    let c = k; for (let i = 0; i < 3; i++) c = morph(c, true); for (let i = 0; i < 3; i++) c = morph(c, false);
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y) && !opaque(c, x, y)) im.set(x, y, [0, 0, 0, 0]);
  }
  const comps = components(im), marks = [], big = comps[0], bb = new Img(im.w, im.h); // điểm rời nhỏ gần vật chính (như 7 sao) giữ lại làm dấu; còn lại xóa
  for (const [x, y] of big.pts) bb.set(x, y, [0, 0, 0, 255]);
  const B = bboxOf(bb), far = CLEAN.xa ?? 30;
  for (const c of comps.slice(1)) {
    const cx = c.pts.reduce((s, p) => s + p[0], 0) / c.n, cy = c.pts.reduce((s, p) => s + p[1], 0) / c.n;
    const near = cx > B.x0 - far && cx < B.x1 + far && cy > B.y0 - far && cy < B.y1 + far;
    if (c.n >= (CLEAN.minComp ?? 6) && near) { if (c.n <= (CLEAN.markMax ?? 0)) marks.push([cx, cy]); continue; }
    for (const [x, y] of c.pts) im.set(x, y, [0, 0, 0, 0]);
  }
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) { // lỗ 1 điểm trong thân → lấp bằng màu láng giềng
    if (im.alpha(x, y)) continue; let n = 0, c = null; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (opaque(im, x + dx, y + dy)) { n++; c = im.get(x + dx, y + dy); } if (n === 4) im.set(x, y, c);
  }
  if (CLEAN.nhuom) { // đưa màu gốc về dải màu võ hồn (robe → col → trắng theo độ sáng), pha `nhuom` phần dải
    const dark = hex(colors[1]), k = CLEAN.nhuom;
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
      const p = im.get(x, y); if (!p[3] || lum(p) < 48) continue; const l = Math.min(1, lum(p) / 230);
      const ramp = l < 0.5 ? dark.map((v, i) => v + (COL[i] - v) * (l / 0.5)) : COL.map((v) => v + (255 - v) * ((l - 0.5) / 0.5) * 0.7);
      im.set(x, y, [0, 1, 2].map((i) => Math.round(p[i] * (1 - k) + ramp[i] * k)).concat(255));
    }
  }
  im = shrink(im, recipe.prescale ?? 1);
  const f = recipe.prescale ?? 1, mk = marks.map(([x, y]) => [x * f, y * f]);
  // viền #1a1020 đều 1 điểm: điểm biên tối → đúng màu viền; thêm viền ngoài chỗ biên sáng
  const o = new Img(im.w + 4, im.h + 4); o.blit(im, 0, 0, im.w, im.h, 2, 2);
  const edge = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !opaque(o, x + dx, y + dy));
  const add = [];
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
    if (o.alpha(x, y)) { if (edge(x, y) && lum(o.get(x, y)) < 70) o.set(x, y, [...OUT, 255]); continue; }
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([u, v]) => opaque(o, u, v));
    if (nb.length && nb.some(([u, v]) => lum(o.get(u, v)) >= 70)) add.push([x, y]);
  }
  for (const [x, y] of add) o.set(x, y, [...OUT, 255]);
  return { im: o, marks: mk.map(([x, y]) => [x + 2, y + 2]) };
}

// ---------- Đặt vào khung 160 theo neo ----------
const stat = {};
for (const d of ISO_DIRS) stat[d] = clean(path.join(src, `${d}.png`));
const heights = ISO_DIRS.map((d) => bboxOf(stat[d].im).h).sort((a, b) => a - b), medH = heights[2];
function place(d) {
  const { im: im0, marks } = stat[d];
  const im = recipe.nghieng ? xform(im0, [(bboxOf(im0).x0 + bboxOf(im0).x1) / 2, bboxOf(im0).y1], recipe.nghieng, 1, 1, 0, 0, 1, null) : im0, b = bboxOf(im), c = new Img(PT_FRAME, PT_FRAME);
  const ox = Math.round(PT_ORIGIN[0] - (MODE === "dat" ? (b.x0 + b.x1 + 1) / 2 : b.cx));
  const oy = Math.round(MODE === "dat" ? PT_ORIGIN[1] - (b.y1 + 1) : PT_ORIGIN[1] - (recipe.lift ?? 14) - medH / 2 - b.cy);
  c.blit(im, 0, 0, im.w, im.h, ox, oy, true);
  return { c, marks: marks.map(([x, y]) => [x + ox, y + oy]) };
}

// ---------- Chuyển động ----------
/** Biến đổi ngược, láng giềng gần nhất: xoay deg quanh pv, co giãn sx / sy quanh pv, dời (tx, ty), nhân sáng `br`, dải sáng `band` (tỉ lệ 0..1 từ đáy lên). */
function xform(im, pv, deg, sx, sy, tx, ty, br, bandY, ext) {
  const o = new Img(im.w, im.h), a = (deg * Math.PI) / 180, co = Math.cos(a), si = Math.sin(a);
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const X = x - tx - pv[0], Y = y - ty - pv[1]; let u = Math.round((co * X + si * Y) / sx + pv[0]), v = Math.round((-si * X + co * Y) / sy + pv[1]);
    if (ext?.lay) { const h = Math.max(0, Math.min(1, (ext.lay.base - y) / ext.lay.hgt)); u = Math.round(u - ext.lay.amp * Math.pow(h, 1.3) * Math.sin(ext.lay.ph - ext.lay.lag * h)); } // cây cỏ: uốn theo chiều cao, ngọn trễ pha
    if (ext?.hoa && Math.hypot(u - ext.hoa.c[0], v - ext.hoa.c[1]) < ext.hoa.r) { const q = (ext.hoa.deg * Math.PI) / 180, dx = u - ext.hoa.c[0], dy = v - ext.hoa.c[1]; u = Math.round(ext.hoa.c[0] + Math.cos(q) * dx - Math.sin(q) * dy); v = Math.round(ext.hoa.c[1] + Math.sin(q) * dx + Math.cos(q) * dy); } // xoay riêng vùng hoa (cánh)
    if (!opaque(im, u, v)) continue;
    const p = im.get(u, v); let k = br;
    if (bandY != null && Math.abs(y - bandY) <= 7) k *= 1 + 0.5 * (1 - Math.abs(y - bandY) / 8);
    o.set(x, y, [Math.min(255, p[0] * k), Math.min(255, p[1] * k), Math.min(255, p[2] * k), 255]);
  }
  return o;
}
const tf = (pt, pv, deg, sx, sy, tx, ty) => { const a = (deg * Math.PI) / 180, X = (pt[0] - pv[0]) * sx, Y = (pt[1] - pv[1]) * sy; return [pv[0] + Math.cos(a) * X - Math.sin(a) * Y + tx, pv[1] + Math.sin(a) * X + Math.cos(a) * Y + ty]; };
/** Phần mở rộng cho cây cỏ (`lay`: biên độ uốn ngọn, điểm; `hoa`: độ xoay vùng hoa) — `cfg.layLag` là độ trễ pha giữa gốc và ngọn, `cfg.hoaTam` / `hoaBk` tâm / bán kính vùng hoa theo hộp bao. */
const vegExt = (b, cfg, ph, lay, hoa) => ({
  lay: lay ? { base: b.y1 + 1, hgt: b.h, amp: lay, ph, lag: cfg.layLag ?? 1.6 } : null,
  hoa: hoa ? { c: [b.x0 + cfg.hoaTam[0] * b.w, b.y0 + cfg.hoaTam[1] * b.h], r: cfg.hoaBk * Math.max(b.w, b.h), deg: hoa } : null,
});
function motion(d) {
  const { c, marks } = place(d), b = bboxOf(c), out = [];
  const poseOf = (anim, i, cfg) => {
    const pv = [b.x0 + cfg.pivot[0] * b.w, b.y0 + cfg.pivot[1] * b.h];
    if (anim === "idle") {
      const t = (i / N_IDLE) * 2 * Math.PI;
      return { pv, deg: Math.sin(t) * (cfg.rot ?? 0), sx: 1, sy: 1, tx: Math.round(Math.sin(t + 1.57) * (cfg.sway ?? 0)), ty: Math.round(Math.sin(t) * cfg.bob), br: 1 + (cfg.pulse ?? 0.1) * (Math.sin(t) + 1) / 2, band: null, k: (Math.sin(t) + 1) / 2,
        ext: vegExt(b, cfg, t, cfg.lay ?? 0, cfg.hoaDeg ? Math.sin(t) * cfg.hoaDeg : 0) };
    }
    const [deg, fwd, up, sx, sy, br, band, lay = 0, hoa = 0] = cfg.poses[i], f = FACE[d];
    return { pv, deg, sx, sy, tx: Math.round(f[0] * fwd), ty: Math.round(f[1] * fwd - up), br, band: band == null ? null : b.y1 - band * b.h, k: br > 1.2 ? 1 : 0.4, ext: vegExt(b, cfg, (i / N_ATK) * 2 * Math.PI * (cfg.layCyc ?? 1), lay, hoa) };
  };
  for (let i = 0; i < N; i++) {
    const anim = i < N_IDLE ? "idle" : "attack", j = i < N_IDLE ? i : i - N_IDLE, p = poseOf(anim, j, M[anim]);
    out.push({ anim, j, p, body: xform(c, p.pv, p.deg, p.sx, p.sy, p.tx, p.ty, p.br, p.band, p.ext), marks: marks.map((m) => tf(m, p.pv, p.deg, p.sx, p.sy, p.tx, p.ty)) });
  }
  return out;
}

// ---------- Lớp phát sáng ----------
const CHEB = (im, maxD) => { // khoảng cách Chebyshev tới thân (0 = thân), tối đa maxD + 1
  const d = new Uint8Array(im.w * im.h).fill(maxD + 1);
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y)) d[y * im.w + x] = 0;
  for (let k = 1; k <= maxD; k++) for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    if (d[y * im.w + x] !== maxD + 1) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const u = x + dx, v = y + dy; if (u >= 0 && v >= 0 && u < im.w && v < im.h && d[v * im.w + u] === k - 1) { d[y * im.w + x] = k; dy = 2; break; } }
  }
  return d;
};
const RAINBOW = ["#ff4a4a", "#ff9a3a", "#ffe04a", "#5ae06a", "#4ad8ff", "#5a7aff", "#b06bff"].map(hex);
const dot = (g, x, y, c, s = 1) => { for (let v = 0; v < s; v++) for (let u = 0; u < s; u++) { const X = Math.round(x) + u, Y = Math.round(y) + v; if (X >= 1 && Y >= 1 && X < g.w - 1 && Y < g.h - 1) g.set(X, Y, [...c, 255]); } };
function glow(fr, prev, bd, idx) {
  const g = new Img(PT_FRAME, PT_FRAME), body = fr.body, bb = bboxOf(body), G = M.hao ?? {};
  const strong = fr.anim === "attack" && fr.p.br > 1.2, k = fr.p.k, ring = strong ? 6 : 2 + (k > 0.5 ? 1 : 0) + (k > 0.85 ? 1 : 0);
  const dist = CHEB(body, ring);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = dist[y * g.w + x]; if (v === 0 || v > ring) continue;
    const on = v === 1 || (v === 2 && (x + y) % 2 === 0) || (v === 3 && (x % 2 === 0 && y % 2 === 0)) || (v >= 4 && x % 3 === 0 && y % 3 === 0);
    if (!on) continue;
    let c = GLC; if (G.cauVong && v === 1) c = RAINBOW[Math.floor(((Math.atan2(y - bb.cy, x - bb.cx) / (2 * Math.PI) + 1.5) % 1) * RAINBOW.length)];
    g.set(x, y, [...c, 255]);
  }
  if (fr.anim === "attack" && M.attack.vet?.includes(fr.j) && prev) { // vệt tàn ảnh: thân khung trước, rải điểm
    const bp = prev.body; for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (bp.alpha(x, y) && !body.alpha(x, y) && (x + y) % 2 === 0) g.set(x, y, [...GLC, 255]);
  }
  const rg = rnd(idx * 977 + 13);
  for (const e of M.hat ?? []) { // hạt theo hệ: mỗi hạt có pha riêng, một vòng lặp đúng bằng độ dài hoạt ảnh
    const nF = fr.anim === "idle" ? N_IDLE : N_ATK;
    for (let n = 0; n < e.n; n++) {
      const r = rnd(e.seed * 131 + n * 17 + (idx < N_IDLE ? 0 : 5000)), phase = r(), off = r() - 0.5, off2 = r() - 0.5, u = (fr.j / nF + phase) % 1;
      let x, y; const c = hex(e.mau[n % e.mau.length]);
      if (e.vi === "tren") { x = bb.cx + off * bb.w * (e.rong ?? 0.4) + (e.troi ?? 0) * u; y = bb.y0 + 2 - e.len * u; }
      else if (e.vi === "chan") { x = bb.cx + off * bb.w * 0.8; y = bb.y1 - e.len * u; }
      else if (e.vi === "quay") { const a = 2 * Math.PI * (u + (n / e.n)); x = bb.cx + Math.cos(a) * (bb.w / 2 + (e.xa ?? 6)); y = bb.cy + Math.sin(a) * (bb.h * (e.e ?? 0.28)) + (e.len ?? 0) * -u; }
      else { x = bb.x0 + (off + 0.5) * bb.w; y = bb.y0 + (off2 + 0.5) * bb.h - (e.len ?? 12) * u; } // "nen": rải trong hộp bao rồi bay lên
      if (u > 0.9) continue; // tắt dần cuối vòng
      if (e.mini) { for (let k2 = 0; k2 < 5; k2++) { dot(g, x + k2, y, hex("#c8602a")); dot(g, x + k2, y + 1, hex("#7a3418")); } dot(g, x + 1, y, hex("#ffd060")); dot(g, x + 3, y, hex("#ffd060")); dot(g, x - 1, y, OUT); dot(g, x + 5, y, OUT); continue; } // xúc xích nhỏ 5×2 quay quanh
      dot(g, x, y, c, u < 0.5 ? e.s ?? 2 : 1);
    }
  }
  if (M.xich) { // xích rủ từ đáy hình, đung đưa trễ pha theo mắt xích (dấu hiệu "xích vàng")
    const nF = fr.anim === "idle" ? N_IDLE : N_ATK, ph = (fr.j / nF) * 2 * Math.PI, gold = [hex("#ffe08a"), hex("#e0b04a")];
    for (let k = 0; k < M.xich.n; k++) for (let i = 0; i < M.xich.mat; i++) {
      const fx = (k / (M.xich.n - 1) - 0.5) * 0.7, x = bb.cx + fx * bb.w + Math.sin(ph + i * 0.7 + k * 2) * (0.6 + i * 0.5), y = bb.y1 + 1 + i * 3;
      if (y < PT_FRAME - 3) dot(g, x, y, gold[i % 2], 2);
    }
  }
  if (M.dau) for (const m of fr.marks) { // dấu nhận diện nháy theo thứ tự (7 sao): hình chữ thập 5×5
    const order = fr.marks.indexOf(m), on = fr.anim === "idle" ? order === fr.j : fr.j === M.attack.hit || fr.j === M.attack.hit + 1;
    if (!on) continue; const [x, y] = m;
    for (let k2 = -3; k2 <= 3; k2++) { dot(g, x + k2, y, hex("#ffffff")); dot(g, x, y + k2, hex("#ffffff")); } dot(g, x, y, hex("#ffffff"), 2);
    dot(g, x - 1, y - 1, COL); dot(g, x + 2, y + 2, COL);
  }
  if (strong && M.attack.vong) { // vòng sóng sáng bung ra từ tâm ở khung ra đòn / giữ
    const r = M.attack.vong * (1 + 0.5 * (fr.j - M.attack.hit)), cx = bb.cx, cy = bb.cy;
    for (let a = 0; a < 64; a++) { const t = (a / 64) * 2 * Math.PI; dot(g, cx + Math.cos(t) * r, cy + Math.sin(t) * r * 0.5, hex(M.attack.vongMau ?? colors[0])); }
  }
  void bd; void rg;
  return g;
}

// ---------- Nén bảng màu ----------
function quantize(t, max, keep) {
  const count = new Map();
  for (let i = 0; i < t.data.length; i += 4) if (t.data[i + 3]) { const c = toHex([t.data[i], t.data[i + 1], t.data[i + 2]]); count.set(c, (count.get(c) ?? 0) + 1); }
  if (count.size <= max) return count.size;
  const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2, kp = new Set(keep.map((c) => c.join(",")));
  let boxes = [[...count].filter(([c]) => !kp.has(hex(c).join(","))).map(([c, n]) => ({ p: hex(c), n, c }))];
  while (boxes.length < max - kp.size) {
    let bi = -1, best = 0, axis = 0;
    boxes.forEach((b, i) => { if (b.length < 2) return; const span = [0, 1, 2].map((k) => Math.max(...b.map((x) => x.p[k])) - Math.min(...b.map((x) => x.p[k]))), a = span.indexOf(Math.max(...span)), score = span[a] * b.reduce((m, x) => m + x.n, 0); if (score > best) { best = score; bi = i; axis = a; } });
    if (bi < 0) break;
    const b = boxes[bi].sort((x, y) => x.p[axis] - y.p[axis]), half = b.reduce((m, x) => m + x.n, 0) / 2; let acc = 0, cut = 1;
    for (let i = 0; i < b.length - 1; i++) { acc += b[i].n; if (acc >= half) { cut = i + 1; break; } }
    boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut));
  }
  const map = new Map();
  for (const b of boxes) { const Nn = b.reduce((m, x) => m + x.n, 0), mean = [0, 1, 2].map((k) => b.reduce((m, x) => m + x.p[k] * x.n, 0) / Nn), rep = b.reduce((a, x) => (dist(x.p, mean) < dist(a.p, mean) ? x : a)).p; for (const x of b) map.set(x.c, rep); }
  for (let i = 0; i < t.data.length; i += 4) { if (!t.data[i + 3]) continue; const r = map.get(toHex([t.data[i], t.data[i + 1], t.data[i + 2]])); if (r) [t.data[i], t.data[i + 1], t.data[i + 2]] = r; }
  return max;
}

// ---------- Dựng ----------
const sheet = new Img(PT_FRAME * L.cols, PT_FRAME * L.rows), gsheet = new Img(sheet.w, sheet.h);
ISO_DIRS.forEach((d, row) => {
  const fr = motion(d);
  fr.forEach((f, i) => {
    const col = i < N_IDLE ? L.anims.idle[0] + i : L.anims.attack[0] + (i - N_IDLE), g = glow(f, i > 0 ? fr[i - 1] : null, null, row * 100 + i);
    sheet.blit(f.body, 0, 0, PT_FRAME, PT_FRAME, col * PT_FRAME, row * PT_FRAME); gsheet.blit(g, 0, 0, PT_FRAME, PT_FRAME, col * PT_FRAME, row * PT_FRAME);
  });
});
const nb = quantize(sheet, PT_MAX_COLORS, [OUT]);
mkdirSync(path.dirname(outBody), { recursive: true });
writeFileSync(outBody, encodePng(sheet)); writeFileSync(outGlow, encodePng(gsheet));
const ng = new Set(); for (let i = 0; i < gsheet.data.length; i += 4) if (gsheet.data[i + 3]) ng.add(gsheet.data[i] + "," + gsheet.data[i + 1] + "," + gsheet.data[i + 2]);
console.log(`[phaptuong-khi] ${id}: ${path.relative(ROOT, outBody)} + _glow (${sheet.w}×${sheet.h}, ${nb} màu thân, ${ng.size} màu sáng)`);
const bad = check(sheet, "thân") + check(gsheet, "sáng", false);
if (previewOut) {
  const pv = new Img(sheet.w, sheet.h);
  for (let i = 0; i < pv.data.length; i += 4) { pv.data[i] = 58; pv.data[i + 1] = 62; pv.data[i + 2] = 74; pv.data[i + 3] = 255; }
  for (const s of [gsheet, sheet]) for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const p = s.get(x, y); if (p[3]) pv.set(x, y, [p[0], p[1], p[2], 255]); }
  writeFileSync(previewOut, encodePng(pv));
}
process.exit(bad ? 1 : 0);
