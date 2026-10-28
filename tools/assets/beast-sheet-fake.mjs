// Dựng tờ hoạt ảnh GIẢ LẬP từ ảnh tĩnh hiện có để thử beast-sheet-cut.mjs (#688): KHÔNG phải ảnh model.
//   node tools/assets/beast-sheet-fake.mjs --species phong_lang --out <thư mục> [--seed 1] [--bad]
// Mỗi ô của tờ chứa khung tĩnh (nam / đông / bắc theo hướng) phóng to, xoay / nhún / lệch theo hoạt ảnh, lệch ngẫu nhiên trong ô,
// thêm nhiễu màu, viền ngả nền màu khóa và vài đốm vụn như ảnh model thật hay gặp. `--bad` thêm các lỗi để thử cảnh báo
// (một khung biến mất, một khung phóng gấp ba, một hình tràn sang ô bên, một hình ở ô trống).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Img, readPng, encodePng } from "./lib.mjs";
import { ANIMS, FRAMES, sheetPlan, sheetCells, cellRect, speciesInfo } from "./beast-sheet-lib.mjs";

const KEY = [255, 0, 255, 255];
/** Khung tĩnh theo hướng 5: nam → 0, đông-nam / đông → 1, đông-bắc / bắc → 2 (như STATIC_DIR_MAP). */
const STATIC_COL = { s: 0, se: 1, e: 1, ne: 2, n: 2 };

function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

/** Phép biến đổi theo hoạt ảnh và khung f: { dy, dx, rot (rad), sx, sy } tính theo cỡ khung nguồn. */
function pose(anim, f) {
  const t = f / FRAMES[anim];
  switch (anim) {
    case "idle": return { dx: 0, dy: Math.sin(t * 2 * Math.PI), rot: 0, sx: 1, sy: 1 + 0.02 * Math.sin(t * 2 * Math.PI) };
    case "walk": return { dx: 0, dy: -2 * Math.abs(Math.sin(t * 2 * Math.PI)), rot: 0.04 * Math.sin(t * 2 * Math.PI), sx: 1, sy: 1 };
    case "attack": return { dx: [-4, -6, 6, 12, 6, 0][f], dy: [0, 0, -3, 0, 0, 0][f], rot: [0, -0.1, 0.12, 0.2, 0.05, 0][f], sx: [1, 0.96, 1.05, 1.1, 1.03, 1][f], sy: [1, 1.04, 0.97, 0.95, 1, 1][f] };
    case "hurt": return { dx: [-3, 2][f], dy: 0, rot: [-0.08, 0.05][f], sx: 1, sy: 1 };
    default: return { dx: 0, dy: [0, 3, 6, 9][f], rot: [0, 0.4, 0.9, 1.35][f], sx: 1, sy: [1, 0.95, 0.85, 0.75][f] };
  }
}

/** Vẽ khung nguồn `src` (cỡ s×s) vào `dst` quanh chân (fx, fy) với hệ số k, theo `p` (ánh xạ ngược, lấy mẫu gần nhất). */
function drawPosed(dst, src, fx, fy, k, p) {
  const s = src.w, c = Math.cos(p.rot), sn = Math.sin(p.rot), footSrc = [s / 2, s - 8];
  const R = Math.ceil(s * k * 1.2);
  for (let y = fy - R; y <= fy + R / 4; y++) for (let x = fx - R; x <= fx + R; x++) {
    if (x < 0 || y < 0 || x >= dst.w || y >= dst.h) continue;
    // điểm đích → quanh chân → xoay ngược → chia hệ số → điểm nguồn
    let u = (x - fx - p.dx * k) / (k * p.sx), v = (y - fy - p.dy * k) / (k * p.sy);
    const ru = u * c + v * sn, rv = -u * sn + v * c;
    const X = Math.round(footSrc[0] + ru), Y = Math.round(footSrc[1] + rv);
    if (X < 0 || Y < 0 || X >= s || Y >= s) continue;
    const q = src.get(X, Y);
    if (q[3]) dst.set(x, y, q);
  }
}

/**
 * Dựng các tờ giả của một loài.
 * @returns {Record<string, Img>} tờ theo mã A, B… cùng cỡ với sheetPlan(F, layout)
 */
export function fakeSheets(species, { seed = 1, bad = false, layout = "auto", grow = 1, wide = 1 } = {}) {
  const info = speciesInfo(species);
  if (!info.staticFile || !info.frame) throw new Error(`loài ${species} chưa có ảnh tĩnh để dựng tờ giả`);
  const st = readPng(info.staticFile), F = info.frame, r = rng(seed), out = {};
  const frameOf = (col) => { const im = new Img(F, F); im.blit(st, col * F, 0, F, F, 0, 0); return im; };
  const frames = [frameOf(0), frameOf(1), frameOf(2)];
  for (const sh of sheetPlan(F, layout)) {
    const img = new Img(sh.w, sh.h);
    for (let i = 0; i < sh.w * sh.h; i++) img.data.set(KEY, i * 4);
    const cells = sheetCells(sh), rect = (c) => cellRect(sh, c.col, c.row, sh.w, sh.h);
    // hệ số phóng: thân khung F vừa khoảng 70% chiều thấp hơn của ô
    const r0 = rect(cells[0]), k = (Math.min(r0.w, r0.h) * (layout === "direction" ? 0.35 : 0.7) * grow) / F; // ô direction 256² to gấp ~2 ô legacy: giảm để thân cùng cỡ khi trộn tờ
    cells.forEach((c, n) => {
      const rc = rect(c), jx = (r() - 0.5) * rc.w * 0.12, jy = (r() - 0.5) * rc.h * 0.05;
      const fx = Math.round(rc.x0 + rc.w / 2 + jx), fy = Math.round(rc.y1 - rc.h * 0.12 + jy);
      let kk = k, skip = false;
      if (bad && sh.id === "A" && n === 3) skip = true; // thiếu khung
      if (bad && sh.id === "A" && n === 9) kk = k * 2.6; // khung phóng quá
      if (!skip) { const p = pose(c.anim, c.frame); drawPosed(img, frames[STATIC_COL[c.dir]], fx, fy, kk, { ...p, sx: p.sx * wide }); }
    });
    // viền ngả màu khóa (khử răng cưa kiểu model): điểm vật giáp nền trộn 50% với nền
    const fringe = [];
    for (let y = 1; y < sh.h - 1; y++) for (let x = 1; x < sh.w - 1; x++) {
      const p = img.get(x, y);
      if (p[0] === 255 && p[1] === 0 && p[2] === 255) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const q = img.get(x + dx, y + dy); return q[0] === 255 && q[1] === 0 && q[2] === 255; })) fringe.push([x, y, p]);
    }
    for (const [x, y, p] of fringe) img.set(x, y, [(p[0] + 255) >> 1, p[1] >> 1, (p[2] + 255) >> 1, 255]);
    // nhiễu màu ±5 trên vật; đốm vụn 1–3 điểm trên nền
    for (let i = 0; i < sh.w * sh.h; i++) {
      const o = i * 4, d = img.data;
      if (d[o] === 255 && d[o + 1] === 0 && d[o + 2] === 255) continue;
      for (let c = 0; c < 3; c++) d[o + c] = Math.max(0, Math.min(255, d[o + c] + Math.round((r() - 0.5) * 10)));
    }
    for (let n = 0; n < 40; n++) {
      const x = Math.floor(r() * (sh.w - 4)), y = Math.floor(r() * (sh.h - 4)), w = 1 + Math.floor(r() * 3);
      if (img.get(x, y)[0] !== 255 || img.get(x, y)[1] !== 0) continue;
      for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++) img.set(x + dx, y + dy, [60 + (r() * 80) | 0, 60, 70, 255]);
    }
    if (bad && sh.id === "A") { // hình ở ô trống (cột 5 của hàng chết) và hình tràn sang ô bên
      const e = cells.find((c) => c.anim === "die" && c.frame === 3), re = rect({ col: e.col + 1, row: e.row });
      drawPosed(img, frames[0], Math.round(re.x0 + re.w / 2), Math.round(re.y1 - re.h * 0.12), k, pose("idle", 0));
    }
    out[sh.id] = img;
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  const species = val("--species"), out = val("--out");
  if (!species || !out) { console.error("Dùng: node tools/assets/beast-sheet-fake.mjs --species <loài> --out <thư mục> [--seed 1] [--bad]"); process.exit(2); }
  const sheets = fakeSheets(species, { seed: +(val("--seed") ?? 1), bad: a.includes("--bad") });
  mkdirSync(out, { recursive: true });
  for (const [id, im] of Object.entries(sheets)) { writeFileSync(path.join(out, `${species}_to${id}.png`), encodePng(im)); console.log(`ghi ${path.join(out, `${species}_to${id}.png`)} ${im.w}×${im.h}`); }
}
