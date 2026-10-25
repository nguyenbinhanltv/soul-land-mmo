// Vẽ bằng code phụ thể bám người cho Hỏa Long (rồng quấn tay + thân, đầu rồng trên vai) và Liệt Hỏa Thương Lang (tai sói, đuôi chóp lửa, vuốt) (#102). Ra ảnh mảnh + mô tả nhóm neo cho `vohon-multi.mjs`.
//   node tools/assets/vohon-chi-tiet.mjs [--body <thư mục thân mẫu LPC>]    (mặc định dựng thân mẫu bằng lpc-mannequin.mjs)
// Ghi art/src/vh_nho/<id>/*.png và art/src/vh_nho/<id>/spec.json. Chỉ cần khớp ba hướng LPC dùng (s, e, n; se / ne dùng lại hướng e,
// vì client vẽ se / e / ne bằng cùng hàng LPC "phải"). Mảnh gắn tay lấy hình cẳng tay từ lớp da của thân mẫu nên khít từng giới.
// Màu chỉ dùng bảng của võ hồn (col, robe + một tối, một sáng) và viền #1a1020.
import { mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { readPng, encodePng, Img, hex, vohonColors, shadesOf, isoLayout, frameAnchors, ROOT } from "./lib.mjs";

const args = process.argv.slice(2), bi = args.indexOf("--body");
const BODY = bi >= 0 ? args[bi + 1] : (() => { const d = mkdtempSync(path.join(os.tmpdir(), "lpcman-")); execFileSync(process.execPath, [path.join(ROOT, "tools/assets/lpc-mannequin.mjs"), "--out", d], { stdio: "inherit" }); return d; })();
const OUT = path.join(ROOT, "art/src/vh_nho"), OL = [26, 16, 32, 255], HL = isoLayout("honsu"), [BW, BH] = HL.frame;
const rgba = (c) => [...hex(c), 255];
const pal = (id) => { const [c, r] = vohonColors(id), [cd, cl] = shadesOf(c), [rd, rl] = shadesOf(r); return { c: rgba(c), cd: rgba(cd), cl: rgba(cl), r: rgba(r), rd: rgba(rd), rl: rgba(rl) }; };
const DIRS = ["s", "se", "e", "ne", "n"], ROW = { s: 0, se: 1, e: 2, ne: 3, n: 4 };
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

// Thân mẫu từng giới.
const man = {};
for (const sx of ["m", "f"]) {
  const [b, o, h] = ["body", "outfit", "hair"].map((l) => readPng(path.join(BODY, `${l}_${sx}_0.png`)));
  const m = new Img(b.w, b.h); for (const l of [b, o, h]) m.blit(l, 0, 0, l.w, l.h, 0, 0, true);
  man[sx] = { skin: b, A: Object.fromEntries(DIRS.map((d) => [d, frameAnchors(m, HL.anims.idle[0] * BW, ROW[d] * BH, BW, BH, b)])) };
}

/** Bàn tay bên `side` (-1 trái màn hình, 1 phải) giống cách vohon-part chọn: mảng thấp nhất cùng phía giữa người. */
const handAt = (A, side) => { const hs = A.hands.filter((h) => Math.sign(h.x - A.mid) === side); return hs.length ? hs.reduce((a, b) => (b.y > a.y ? b : a)) : null; };
/** Mảng da liền (cẳng tay + bàn tay) chứa bàn tay `h`: các điểm da trong khung đứng, loang từ điểm da gần h nhất. */
function armBlob(sx, d, h) {
  const { skin } = man[sx], x0 = HL.anims.idle[0] * BW, y0 = ROW[d] * BH, has = (x, y) => x >= 0 && y >= 0 && x < BW && y < BH && skin.alpha(x0 + x, y0 + y);
  let best = null;
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) if (has(x, y)) { const dd = Math.hypot(x + 0.5 - h.x, y + 0.5 - h.y); if (!best || dd < best.dd) best = { x, y, dd }; }
  const seen = new Set([best.x + "," + best.y]), st = [[best.x, best.y]], pts = [];
  while (st.length) { const [x, y] = st.pop(); pts.push([x, y]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy, k = X + "," + Y; if (!seen.has(k) && has(X, Y) && Y >= h.y - 14) { seen.add(k); st.push([X, Y]); } } }
  return pts;
}
/** Phủ mẫu `pat(u, v, nearEdge) → màu | null` lên mảng da (u, v: toạ độ trong ảnh; nearEdge: cạnh trái / phải của mảng) rồi viền #1a1020 quanh phần phủ. */
function wrapPiece(pts, h, pat, pad = 2) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  const img = new Img(Math.max(...xs) - x0 + 1 + pad, Math.max(...ys) - y0 + 1 + pad), set = new Set(pts.map(([x, y]) => `${x - x0},${y - y0}`));
  const cover = new Map();
  for (let v = 0; v < img.h; v++) for (let u = 0; u < img.w; u++) {
    const inside = set.has(`${u},${v}`), side = inside || set.has(`${u - 1},${v}`) || set.has(`${u + 1},${v}`); // thêm 1 điểm ra hai bên cho dây dày hơn cánh
    const c = side ? pat(u, v, !inside) : null;
    if (c) cover.set(`${u},${v}`, c);
  }
  for (const [k, c] of cover) { const [u, v] = k.split(",").map(Number); img.set(u, v, c); }
  for (const k of [...cover.keys()]) { const [u, v] = k.split(",").map(Number); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = u + dx, Y = v + dy; if (X >= 0 && Y >= 0 && X < img.w && Y < img.h && !cover.has(`${X},${Y}`) && !img.alpha(X, Y) && !set.has(`${X},${Y}`)) img.set(X, Y, OL); } }
  return { img, pivot: [Math.round(h.x - x0), Math.round(h.y - y0)] };
}

// Hình tự do: canvas 64×64, gốc (32, 32) = điểm neo.
const C = 64, O = 32;
const blank = () => new Img(C, C);
const px = (img, x, y, c) => { x = Math.round(x + O); y = Math.round(y + O); if (x >= 0 && y >= 0 && x < C && y < C) img.set(x, y, c); };
const get = (img, x, y) => (x >= 0 && y >= 0 && x < C && y < C && img.alpha(x, y) ? img.get(x, y) : null);
function fillPoly(img, pts, c) {
  const ys = pts.map((p) => p[1]), x = pts.map((p) => p[0]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let X = Math.floor(Math.min(...x)); X <= Math.ceil(Math.max(...x)); X++) {
    let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y + 0.5) !== (yj > y + 0.5) && X + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) ins = !ins; }
    if (ins) px(img, X, y, c);
  }
}
function disc(img, cx, cy, r, c) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) px(img, x, y, c); }
/** Đường cong qua các điểm (Catmull-Rom), bán kính r0 → r1, màu `col(t, i)`; trả danh sách điểm đã lấy mẫu. */
function stroke(img, pts, r0, r1, col) {
  const P = [pts[0], ...pts, pts[pts.length - 1]], samp = [];
  for (let i = 1; i < P.length - 2; i++) for (let k = 0; k < 12; k++) { const t = k / 12, t2 = t * t, t3 = t2 * t; samp.push([0, 1].map((a) => 0.5 * (2 * P[i][a] + (-P[i - 1][a] + P[i + 1][a]) * t + (2 * P[i - 1][a] - 5 * P[i][a] + 4 * P[i + 1][a] - P[i + 2][a]) * t2 + (-P[i - 1][a] + 3 * P[i][a] - 3 * P[i + 1][a] + P[i + 2][a]) * t3))); }
  samp.push(pts[pts.length - 1]);
  samp.forEach(([x, y], i) => disc(img, x, y, r0 + (r1 - r0) * (i / (samp.length - 1)), col(i / (samp.length - 1), i)));
  return samp;
}
/** Viền ngoài #1a1020 1 điểm, và viền sáng `rim` ở mép trên-trái bên trong. */
function finish(img, rim) {
  const src = new Img(C, C); src.data.set(img.data);
  for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) {
    if (src.alpha(x, y)) { if (rim && !src.alpha(x, y - 1) && y > 0) img.set(x, y, rim); else if (rim && x > 0 && !src.alpha(x - 1, y)) img.set(x, y, rim); continue; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (x + dx >= 0 && y + dy >= 0 && x + dx < C && y + dy < C && src.alpha(x + dx, y + dy)) { img.set(x, y, OL); break; }
  }
  return img;
}
const save = (dir, name, img) => { mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, name), encodePng(img)); return name; };

const specs = {};
/** Ghi mảnh ra file và thêm vào nhóm `g` của võ hồn `id`. */
function add(id, group, attach, d, piece) { ((specs[id] ??= {})[group] ??= { attach, dirs: {} }).dirs[d] ??= []; specs[id][group].dirs[d].push(piece); }
const SIDES = { s: "left", e: "left", n: "right" }; // tay phải của hồn sư trên màn hình (s: trái màn hình; e: tay gần; n: phải màn hình)
const SIDE_SGN = { left: -1, right: 1 };
const alias = (d) => (d === "se" || d === "ne" ? "e" : d);

/** Mảnh gắn tay cho cả hai giới: `pat` là mẫu phủ cẳng tay, `hands` là các bên tay theo hướng. */
function wraps(id, group, name, hands, pat, extra) {
  for (const d of DIRS) for (const side of hands[alias(d)] ?? []) {
    const piece = {};
    for (const sx of ["m", "f"]) {
      const A = man[sx].A[alias(d)], h = handAt(A, SIDE_SGN[side]);
      if (!h) continue;
      const w = wrapPiece(armBlob(sx, alias(d), h), h, pat);
      const fn = `${name}_${sx}_${alias(d)}_${side}.png`, img = extra ? extra(w, sx, alias(d), side) : w.img;
      save(path.join(OUT, id), fn, img);
      (piece[sx] ??= {}).img = fn; piece[sx].pivot = w.pivot;
    }
    if (piece.m || piece.f) add(id, `${group}_${side}`, "hand", d, { img: piece.m?.img ?? piece.f.img, pivot: piece.m?.pivot ?? piece.f.pivot, hand: side, layer: "f", off: [0, 0], ...(alias(d) === "e" ? { free: true } : {}), m: piece.m, f: piece.f });
  }
}
/** Mảnh tự do (tai, đuôi, đầu rắn): ảnh `build(d, sx)` vẽ quanh gốc (O, O). */
function free(id, group, attach, name, layerOf, build) {
  for (const d of DIRS) {
    const piece = { pivot: [O, O], off: [0, 0], layer: layerOf(d) };
    for (const sx of ["m", "f"]) {
      const img = build(alias(d), sx, man[sx].A[alias(d)]), fn = `${name}_${sx}_${alias(d)}.png`;
      save(path.join(OUT, id), fn, img); piece[sx] = { img: fn };
    }
    add(id, group, attach, d, { img: piece.m.img, ...piece });
  }
}

// ───────────────────────────── Hỏa Long: rồng lửa quấn tay phải và thân, đầu rồng có sừng ngóc trên vai ─────────────────────────────
{
  const id = "hoa_long", p = pal(id);
  const coil = (u, v) => { const t = (((u + v) % 6) + 6) % 6; return t === 0 ? p.cl : t === 1 || t === 2 ? p.c : t === 3 ? p.cd : null; };
  wraps(id, "tay", "rong_tay", { s: ["left"], e: ["left"], n: ["right"] }, coil);
  const SH = { s: [-12, -2], e: [-9, -3], n: [12, -2] };
  free(id, "dau", "back", "dau_rong", () => "f", (d) => {
    const img = blank(), [sx, sy] = SH[d], k = d === "n" ? -1 : 1, head = [sx + (d === "e" ? 3 : -2 * k), sy - 14];
    stroke(img, [[sx, sy + 1], [sx - 3 * k, sy - 4], [head[0] + 3 * k, head[1] + 4], head], 2.6, 2.2, (t, i) => (Math.floor(i / 3) % 2 ? p.c : p.cd));
    if (d === "e") { fillPoly(img, [[head[0] - 3, head[1] - 2], [head[0] + 5, head[1]], [head[0] - 3, head[1] + 3]], p.c); px(img, head[0] - 1, head[1] - 1, p.cl); px(img, head[0] + 3, head[1] + 1, p.cd); fillPoly(img, [[head[0] - 3, head[1] - 3], [head[0] - 6, head[1] - 7], [head[0] - 1, head[1] - 3]], p.cl); }
    else { fillPoly(img, [[head[0] - 4, head[1] - 1], [head[0], head[1] - 3], [head[0] + 4, head[1] - 1], [head[0] + 2.5, head[1] + 3], [head[0] - 2.5, head[1] + 3]], d === "n" ? p.cd : p.c);
      fillPoly(img, [[head[0] - 4, head[1] - 1], [head[0] - 7, head[1] - 6], [head[0] - 2, head[1] - 2]], p.cl); fillPoly(img, [[head[0] + 4, head[1] - 1], [head[0] + 7, head[1] - 6], [head[0] + 2, head[1] - 2]], p.cl);
      if (d === "s") { px(img, head[0] - 2, head[1], p.cl); px(img, head[0] + 1, head[1], p.cl); px(img, head[0] - 1, head[1] + 2, p.rd); px(img, head[0], head[1] + 2, p.rd); } }
    return finish(img, null);
  });
  // Thân rồng vắt chéo qua ngực / lưng.
  free(id, "than", "back", "than_rong", () => "f", (d) => {
    const img = blank(), P = { s: [[-9, -3], [-2, 2], [4, 7], [9, 12]], e: [[-3, -3], [0, 2], [-1, 7], [-4, 12]], n: [[9, -3], [2, 2], [-4, 7], [-9, 12]] }[d];
    stroke(img, P, d === "e" ? 1.8 : 2.2, d === "e" ? 1.8 : 2.2, (t, i) => (Math.floor(i / 3) % 2 ? p.c : p.cd));
    for (let y = -C / 2; y < C / 2; y++) for (let x = -C / 2; x < C / 2; x++) { const c = get(img, x + O, y + O); if (c && same(c, p.c) && !get(img, x + O, y + O - 1)) px(img, x, y, p.cl); }
    return finish(img, null);
  });
}

// ───────────────────────────── Liệt Hỏa Thương Lang: tai sói, đuôi chóp lửa, vuốt lửa ─────────────────────────────
{
  const id = "liet_hoa_thuong_lang", p = pal(id);
  free(id, "tai", "head", "tai", () => "f", (d) => {
    const img = blank();
    const ear = (cx, tipx, w, inner) => { fillPoly(img, [[cx - w / 2, 3], [cx + w / 2, 3], [tipx, -9]], p.r); fillPoly(img, [[cx - w / 2 + 2, 3], [cx + w / 2 - 1, 3], [tipx + 0.2, -4]], inner ? p.c : p.rd); };
    if (d === "e") { ear(3, 4, 6, true); ear(-3.5, -6, 8, true); } else { ear(-6, -8, 7, d === "s"); ear(6, 8, 7, d === "s"); }
    return finish(img, p.rl);
  });
  free(id, "duoi", "back", "duoi", (d) => (d === "n" ? "f" : "b"), (d) => {
    const img = blank(), P = { s: [[8, 10], [15, 11], [19, 3], [17, -5]], e: [[-5, 10], [-12, 9], [-17, 3], [-17, -4]], n: [[3, 11], [8, 15], [13, 12], [15, 5]] }[d];
    const sm = stroke(img, P, d === "n" ? 3 : 4.6, d === "n" ? 2 : 3.2, () => p.r);
    for (let y = -C / 2; y < C / 2; y++) for (let x = -C / 2; x < C / 2; x++) { const c = get(img, x + O, y + O); if (c && same(c, p.r) && !get(img, x + O, y + O - 1)) px(img, x, y, p.rl); }
    const tip = sm[sm.length - 1]; disc(img, tip[0], tip[1], 2.8, p.c); disc(img, tip[0], tip[1] + 0.5, 1.5, p.cl);
    fillPoly(img, [[tip[0] - 2, tip[1] - 1], [tip[0] - 1, tip[1] - 6], [tip[0], tip[1] - 1]], p.c); fillPoly(img, [[tip[0], tip[1] - 1], [tip[0] + 1.5, tip[1] - 7], [tip[0] + 2.5, tip[1] - 1]], p.c); px(img, tip[0] + 1, tip[1] - 4, p.cl);
    return finish(img, null);
  });
  for (const d of DIRS) for (const side of ({ s: ["left", "right"], e: ["left"], n: ["left", "right"] })[alias(d)]) {
    const img = blank();
    for (const [dx, len] of [[-2, 4], [0, 5], [2, 4]]) for (let i = 0; i < len; i++) px(img, dx, 1 + i, i === len - 1 ? p.cl : i < 1 ? p.cd : p.c);
    finish(img, null);
    const fn = `vuot_${alias(d)}_${side}.png`; save(path.join(OUT, id), fn, img);
    add(id, `tay_${side}`, "hand", d, { img: fn, pivot: [O, O], hand: side, layer: "f", off: [0, 0], ...(alias(d) === "e" ? { free: true } : {}) });
  }
}

for (const [id, groups] of Object.entries(specs)) writeFileSync(path.join(OUT, id, "spec.json"), JSON.stringify({ base: [], groups }, null, 1) + "\n");
console.log(`[vohon-chi-tiet] ${Object.keys(specs).join(", ")} → ${path.relative(ROOT, OUT)}`);
