// Phần dùng chung của cutter / kiểm tờ phụ thể v2 (#1022): chuẩn hóa cỡ theo tỉ lệ, mặt nạ nền + nộm + phụ thể, đăng ký vị trí nộm trong từng ô,
// nhãn lớp sau / trước (mặt nạ theo vùng, `lop.json`), phân mức cảnh báo. Không ghi file. Fork ý tưởng từ beast-sheet-cut-lib.mjs.
//
// Mọi phép đo làm ở đơn vị "canonical" (ảnh tờ 1536×1024, ô 256×256); tờ cỡ khác (cùng tỉ lệ 3:2) được lấy mẫu về cỡ canonical trước.
// Cách tìm khung của một ô: nộm trong ô do model vẽ có thể bị dời / đổi chút, nên đăng ký (tương quan hình bóng) mặt nạ nộm đo được với mặt nạ nộm
// danh nghĩa (phuthe-sheet-dummy.mjs dựng lại đúng như ảnh tham chiếu) để biết độ dời (dx, dy); cửa sổ khung = ô danh nghĩa dời (dx, dy).
import { Img, hex } from "./lib.mjs";
import { sheetKey, GRID_TOL } from "./beast-sheet-grid.mjs";
import { layoutFor } from "./beast-sheet-cut-lib.mjs";
import { foregroundMask, components } from "./beast-sheet-cut.mjs";
import { median } from "./beast-sheet-stats.mjs";
import { CELL, SHEET_W, SHEET_H, DIRS, framesOf, sheetPlan, bodyStepOf, sheetFits, canonFactor, DEFAULT_LAYER, LAYER_LABELS, frameOrigin } from "./phuthe-sheet-lib.mjs";
import { dummyCell } from "./phuthe-sheet-dummy.mjs";

/** Dung sai khoá nền (như hồn thú) và dung sai khoá nộm (nhỏ hơn: không ăn sang phụ thể; đặc tả, ý 4). */
export const BG_TOL = 60, DUMMY_TOL = 40;
/** Ngưỡng đăng ký nộm: điểm tối thiểu (tỉ lệ điểm nộm danh nghĩa tìm thấy) để tin vị trí đo được. */
export const REG_MIN_SCORE = 0.5;
const REG_RANGE = 48; // px canonical tìm quanh vị trí danh nghĩa

export const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

/** Đưa tờ cỡ bất kỳ (tỉ lệ 3:2 ±1%) về 1536×1024 bằng lấy mẫu gần nhất; trả { img, factor } (factor theo diện tích như canonFactor). */
export function normalizeSheet(raw) {
  if (!sheetFits(raw.w, raw.h)) throw new Error(`sai tỉ lệ ${raw.w}×${raw.h}, cần 3:2 (chuẩn ${SHEET_W}×${SHEET_H}); không thể chuẩn hóa đồng đều`);
  const factor = canonFactor(raw.w, raw.h, SHEET_W, SHEET_H);
  if (raw.w === SHEET_W && raw.h === SHEET_H) return { img: raw, factor: 1 };
  const out = new Img(SHEET_W, SHEET_H);
  for (let y = 0; y < SHEET_H; y++) for (let x = 0; x < SHEET_W; x++) out.set(x, y, raw.get(Math.min(raw.w - 1, Math.floor(((x + 0.5) * raw.w) / SHEET_W)), Math.min(raw.h - 1, Math.floor(((y + 0.5) * raw.h) / SHEET_H))));
  return { img: out, factor };
}

/**
 * Mặt nạ của tờ canonical: `fg` = không phải nền (sau gỡ viền nền, gồm nộm); `dummy` = điểm nộm (gần màu khoá nộm); `spirit` = phụ thể
 * (fg trừ nộm, gỡ tiếp 3 lớp viền ngả màu khoá nộm giáp vùng nộm, như viền ngả nền).
 */
export function sheetMasks(img, { bgKey, tol = BG_TOL, dummyKey, dummyTol = DUMMY_TOL }) {
  const { w, h } = img, fg = foregroundMask(img, [...bgKey, 255], tol), dummy = new Uint8Array(w * h), spirit = new Uint8Array(w * h), dk = dummyKey.slice(0, 3);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (img.data[o + 3] >= 128 && dist2([img.data[o], img.data[o + 1], img.data[o + 2]], dk) <= dummyTol * dummyTol) dummy[i] = 1;
    spirit[i] = fg[i] && !dummy[i] ? 1 : 0;
  }
  const removed = Uint8Array.from(dummy), fringe = (dummyTol * 1.9) ** 2;
  for (let pass = 0; pass < 3; pass++) {
    const kill = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!spirit[i]) continue;
      const touches = (x > 0 && removed[i - 1]) || (x < w - 1 && removed[i + 1]) || (y > 0 && removed[i - w]) || (y < h - 1 && removed[i + w]);
      if (touches && dist2([img.data[i * 4], img.data[i * 4 + 1], img.data[i * 4 + 2]], dk) <= fringe) kill.push(i);
    }
    for (const i of kill) { spirit[i] = 0; removed[i] = 1; }
  }
  return { fg, dummy, spirit };
}

/** Nộm danh nghĩa của một ô (toạ độ ô 256×256): mặt nạ + danh sách điểm (x, y xen kẽ) cho đăng ký. */
export function nominalOf(args) {
  const d = dummyCell({ ...args, cw: CELL, ch: CELL }), pts = [];
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (d.mask[y * CELL + x]) pts.push(x, y);
  return { ...d, pts, count: pts.length / 2 };
}

/**
 * Đăng ký: độ dời (dx, dy) làm nộm đo được (mặt nạ `obs` ở toạ độ ảnh) khớp nộm danh nghĩa đặt ở (ox, oy): obs(ox + x + dx, oy + y + dy) ≈ nom(x, y).
 * Thô (bước 4) rồi tinh (±4 điểm); điểm = tỉ lệ điểm nộm danh nghĩa trúng nộm đo được (bị phụ thể che bớt thì giảm điểm nhưng đỉnh vẫn đúng chỗ).
 */
export function registerDummy(obs, w, h, nom, ox, oy) {
  const hit = (dx, dy, stride) => {
    let n = 0, tot = 0;
    for (let k = 0; k < nom.pts.length; k += 2) {
      const x = nom.pts[k], y = nom.pts[k + 1];
      if (stride > 1 && (x % stride || y % stride)) continue;
      tot++;
      const X = ox + x + dx, Y = oy + y + dy;
      if (X >= 0 && Y >= 0 && X < w && Y < h && obs[Y * w + X]) n++;
    }
    return tot ? n / tot : 0;
  };
  let best = { dx: 0, dy: 0, s: -1 };
  const better = (dx, dy, s) => s > best.s + 1e-9 || (Math.abs(s - best.s) <= 1e-9 && Math.abs(dx) + Math.abs(dy) < Math.abs(best.dx) + Math.abs(best.dy));
  for (let dy = -REG_RANGE; dy <= REG_RANGE; dy += 4) for (let dx = -REG_RANGE; dx <= REG_RANGE; dx += 4) { const s = hit(dx, dy, 4); if (better(dx, dy, s)) best = { dx, dy, s }; }
  const c = best;
  for (let dy = c.dy - 4; dy <= c.dy + 4; dy++) for (let dx = c.dx - 4; dx <= c.dx + 4; dx++) { const s = hit(dx, dy, 1); if (s > best.s + 1e-9 || (s === best.s && Math.abs(dx) + Math.abs(dy) < Math.abs(best.dx) + Math.abs(best.dy))) best = { dx, dy, s }; }
  return { dx: best.dx, dy: best.dy, score: Math.max(0, best.s) };
}

/**
 * Chuẩn bị một tờ hướng: chuẩn hóa cỡ, mặt nạ, lưới (theo khoảng trống nếu dò được), đăng ký nộm từng ô.
 * @returns {{ img: Img, factor: number, bgKey: number[], masks: object, layout: object, cells: object[], shift: {dx:number, dy:number}, notes: string[] }}
 *   cells[i] = { anim, frame, col, row, step, nom, reg: { dx, dy, score, ok }, win: {x0, y0}, rect }; (win = góc trên trái cửa sổ khung 256×256 trong ảnh canonical)
 */
export function prepareSheet(raw, { group, dir, frame, dummyKey, dummyTol = DUMMY_TOL, tol = BG_TOL, key, sex = "m", grid = "auto" }) {
  const { img, factor } = normalizeSheet(raw), bgKey = (key ?? sheetKey(img)).slice(0, 3);
  const dk = typeof dummyKey === "string" ? hex(dummyKey) : dummyKey, masks = sheetMasks(img, { bgKey, tol, dummyKey: dk, dummyTol });
  const sheet = sheetPlan(group)[DIRS.indexOf(dir)], layout = layoutFor(img, sheet, grid, { key: bgKey, tol: GRID_TOL }), fr = framesOf(group);
  const cells = sheet.cells.map((c) => {
    const step = bodyStepOf(c.anim, fr[c.anim], c.frame), nom = nominalOf({ sex, dir, clip: c.anim, step, frame });
    const reg = registerDummy(masks.dummy, img.w, img.h, nom, c.col * CELL, c.row * CELL);
    return { ...c, step, nom, reg: { ...reg, ok: reg.score >= REG_MIN_SCORE }, rect: layout.rect(c.col, c.row) };
  });
  const good = cells.filter((c) => c.reg.ok), notes = [...layout.notes];
  const shift = good.length ? { dx: Math.round(median(good.map((c) => c.reg.dx))), dy: Math.round(median(good.map((c) => c.reg.dy))) } : { dx: 0, dy: 0 };
  for (const c of cells) {
    const r = c.reg.ok ? c.reg : shift;
    c.win = { x0: c.col * CELL + r.dx, y0: c.row * CELL + r.dy };
  }
  return { img, factor, bgKey, dummyKey: dk, masks, layout, cells, shift, notes };
}

/** Điểm phụ thể (mặt nạ `spirit`) của một ô: các điểm trong cửa sổ khung ∩ hộp lưới của ô; trả { px: [[u, v, i]], outside: số điểm phụ thể của ô nằm ngoài cửa sổ, edge: số điểm chạm mép cửa sổ }. */
export function cellSpirit(prep, cell) {
  const { img, masks } = prep, { rect, win } = cell, px = [];
  let edge = 0, outside = 0;
  const gx0 = Math.floor(rect.x0), gx1 = Math.ceil(rect.x1), gy0 = Math.floor(rect.y0), gy1 = Math.ceil(rect.y1);
  for (let y = Math.max(0, gy0); y < Math.min(img.h, gy1); y++) for (let x = Math.max(0, gx0); x < Math.min(img.w, gx1); x++) {
    const i = y * img.w + x;
    if (!masks.spirit[i]) continue;
    const u = x - win.x0, v = y - win.y0;
    if (u < 0 || v < 0 || u >= CELL || v >= CELL) { outside++; continue; }
    px.push([u, v, i]);
    if (u < 2 || v < 2 || u >= CELL - 2 || v >= CELL - 2) edge++;
  }
  return { px, outside, edge };
}

/** Bỏ các mảnh nhỏ hơn `minArea` điểm (đốm vụn, 8 liên thông); trả { px, dropped }. */
export function dropSpecks(px, minArea = 16) {
  if (!px.length) return { px, dropped: 0 };
  const m = new Uint8Array(CELL * CELL), at = new Map();
  for (const p of px) { m[p[1] * CELL + p[0]] = 1; at.set(p[1] * CELL + p[0], p); }
  const keep = [];
  let dropped = 0;
  for (const c of components(m, CELL, CELL)) { if (c.area >= minArea) for (const i of c.px) keep.push(at.get(i)); else dropped++; }
  return { px: keep, dropped };
}

// ---------- Mặt nạ lớp sau / trước ----------
/**
 * Đọc `lop.json` (art/src/phuthe-anim/<id>/lop.json): { "huong": { "<hướng>": { "mac_dinh": "sau" | "truoc", "vung": [ {nhan, hop: [x0, y0, x1, y1]} | {nhan, da_giac: [[x, y], …]} ] } },
 * "khung": { "<hướng>/<clip>/<khung>": [ vùng… ] } }. Toạ độ theo điểm ảnh của khung phụ thể TÍNH TỪ GỐC CHÂN (x sang phải, y xuống), không phụ thuộc cỡ tờ.
 * Vùng sau thắng vùng trước; vùng riêng theo khung thắng vùng của hướng. Sai cấu trúc thì ném lỗi tiếng Việt.
 */
export function parseLop(json) {
  const o = typeof json === "string" ? JSON.parse(json) : json ?? {};
  const bad = (m) => { throw new Error(`lop.json: ${m}`); };
  const region = (r, where) => {
    if (!LAYER_LABELS.includes(r?.nhan)) bad(`${where}: "nhan" phải là sau | truoc`);
    if (r.hop) { if (!Array.isArray(r.hop) || r.hop.length !== 4 || r.hop.some((v) => typeof v !== "number")) bad(`${where}: "hop" phải là [x0, y0, x1, y1]`); return { nhan: r.nhan, hop: r.hop }; }
    if (r.da_giac) { if (!Array.isArray(r.da_giac) || r.da_giac.length < 3 || r.da_giac.some((p) => !Array.isArray(p) || p.length !== 2)) bad(`${where}: "da_giac" cần ≥ 3 điểm [x, y]`); return { nhan: r.nhan, da_giac: r.da_giac }; }
    return bad(`${where}: cần "hop" hoặc "da_giac"`);
  };
  const out = { huong: {}, khung: {} };
  for (const [d, v] of Object.entries(o.huong ?? {})) {
    if (!DIRS.includes(d)) bad(`hướng lạ ${d}`);
    if (v.mac_dinh && !LAYER_LABELS.includes(v.mac_dinh)) bad(`huong.${d}.mac_dinh phải là sau | truoc`);
    out.huong[d] = { mac_dinh: v.mac_dinh ?? null, vung: (v.vung ?? []).map((r, i) => region(r, `huong.${d}.vung[${i}]`)) };
  }
  for (const [k, list] of Object.entries(o.khung ?? {})) {
    if (!/^(s|se|e|ne|n)\/(idle|walk|attack|cast|hurt)\/\d+$/.test(k)) bad(`khoá khung lạ ${k} (mẫu e/attack/3)`);
    out.khung[k] = list.map((r, i) => region(r, `khung.${k}[${i}]`));
  }
  return out;
}
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const inRegion = (r, x, y) => (r.hop ? x >= r.hop[0] && x < r.hop[2] && y >= r.hop[1] && y < r.hop[3] : inPoly(r.da_giac, x, y));

/**
 * Nhãn lớp mặc định theo quy tắc có sẵn (đặc tả): hướng quay lưng `ne` / `n`: mọi điểm là `truoc` (cánh, đuôi, hư ảnh che thân); hướng còn lại:
 * mỗi mảnh liền (8 liên thông) mà một phần đáng kể **đè lên nộm** (điểm nộm danh nghĩa, nở 1 điểm; tay cầm, tai, vuốt trước ngực, dây leo trước người)
 * là `truoc` nguyên mảnh, mảnh còn lại (cánh, đuôi, chân nhện sau lưng) là `sau`. Trả Uint8Array 256×256 (1 = truoc), chỉ có giá trị ở điểm phụ thể.
 */
export function defaultLayers(px, nom, dir) {
  const out = new Uint8Array(CELL * CELL);
  if (DEFAULT_LAYER[dir] === "truoc") { for (const p of px) out[p[1] * CELL + p[0]] = 1; return out; }
  const m = new Uint8Array(CELL * CELL);
  for (const p of px) m[p[1] * CELL + p[0]] = 1;
  const over = (u, v) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = u + dx, y = v + dy; if (x >= 0 && y >= 0 && x < CELL && y < CELL && nom.mask[y * CELL + x]) return true; } return false; };
  for (const c of components(m, CELL, CELL)) {
    let n = 0;
    for (const i of c.px) if (over(i % CELL, (i / CELL) | 0)) n++;
    if (n >= Math.max(8, c.area * 0.05)) for (const i of c.px) out[i] = 1;
  }
  return out;
}

/**
 * Hàm nhãn lớp của một khung: (u, v) toạ độ ô canonical (cũng là toạ độ nộm danh nghĩa, vì cửa sổ khung đã dời theo nộm) → "sau" | "truoc".
 * Thứ tự: vùng riêng theo khung > vùng của hướng > `mac_dinh` của hướng > `base` (defaultLayers).
 */
export function layerFn({ lop, dir, clip, frameIdx, F, base }) {
  const k = F / CELL, [ox, oy] = frameOrigin(F), own = lop?.khung?.[`${dir}/${clip}/${frameIdx}`] ?? [], reg = lop?.huong?.[dir] ?? { mac_dinh: null, vung: [] };
  return (u, v) => {
    const x = (u + 0.5) * k - ox, y = (v + 0.5) * k - oy;
    for (const list of [own, reg.vung]) {
      let hit = null;
      for (const r of list) if (inRegion(r, x, y)) { if (r.nhan === "sau") return "sau"; hit = r.nhan; }
      if (hit) return hit;
    }
    if (reg.mac_dinh) return reg.mac_dinh;
    return base[v * CELL + u] ? "truoc" : "sau";
  };
}

// ---------- Phân mức cảnh báo ----------
export const LEVELS = ["info", "warn", "block"];
/** Phân mức theo mã (mỗi cảnh báo của cutter có mã ngắn). block = phải sửa trước khi nhập; warn = nên xem; info = chỉ đếm. */
export const CODE_LEVEL = {
  "thieu-to": "block", "khung-rong": "block", "con-nom": "block", "nom-mat": "warn", "nom-lech": "warn", "vuot-khung": "warn", "cham-mep": "warn",
  "co-phu-the": "warn", "khung-lech": "warn", "manh-vun": "info", "luoi": "info", "ghi-chu": "info", "hurt-rong": "warn", "ben-nua": "info", "cat-mep-khung": "warn",
};
export const levelOfCode = (code) => CODE_LEVEL[code] ?? "warn";
export function summarize(items) {
  const s = { info: 0, warn: 0, block: 0, total: items.length, byCode: {} };
  for (const i of items) { s[i.level]++; s.byCode[i.code] = (s.byCode[i.code] ?? 0) + 1; }
  return s;
}
