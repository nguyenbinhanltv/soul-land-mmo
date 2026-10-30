// Kiểm tờ hoạt ảnh phụ thể võ hồn v2 trước khi cắt / nhập (#1022; docs/art/phu-the-hoat-anh.md mục "Tiêu chí duyệt"). Fork từ beast-sheet-check.mjs.
//   npm run phuthe:check -- <võ hồn> [--out <thư mục>] [--dir <thư mục chứa toA.png…>] [--no-image]
//   npm run phuthe:check -- --all            (mọi võ hồn trong art/src/phuthe-anim, chỉ in bảng tóm tắt)
// Chỉ đọc tờ RAW (toA–toE = s, se, e, ne, n; `turnaround.png`): tỉ lệ 3:2, khóa nền (dung sai), dò lưới theo khoảng trống, số hình mỗi dải, ô trống có hình,
// nộm còn tìm thấy (đăng ký hình bóng nộm), nộm bị dời, khung rỗng (trừ hurt), phụ thể không dính nộm ở khung đứng (điểm gắn trôi), khung chết, hurt = idle,
// se ≈ e, cỡ phụ thể lệch so với khối s. Ghi <id>-check.json + .md + tờ liên hệ có nhãn (<id>-to<X>-lien-he.png) + dòng `LỖI:` nháp.
// --kind vukhi (#1312): thêm `diem-cam` (vũ khí phải chạm marker ở khung đứng; chặn với mềm / găng, nhẹ với cứng) và `marker-troi` (marker bị vẽ lệch khỏi tay nộm); đọc `<id>/vukhi/toA–toE`.
// Mức: pass / nhẹ / chặn (thoát mã 1 khi có chặn). Cỡ phụ thể lệch chỉ là nhẹ, không bao giờ chặn (như hồn thú, quyết định chủ repo 2026-10-26 mục 4).
// KHÔNG kiểm bằng code (xem tờ liên hệ bằng mắt): nhận diện đúng võ hồn so với bảng mô tả, vẽ lại thân / mặt / tay chân người, nộm bị vẽ thêm mặt ở n / ne,
// se / ne khác e thật sự, hurt lùi đúng hướng. Không sửa tờ, không ghi vào repo (mặc định ghi ở thư mục tạm).
// Ngưỡng ở đầu file; MỚI đo trên tờ tổng hợp (phuthe-sheet-fake.mjs), chưa có tờ model thật: chỉnh sau khi P3 có tờ thật.
import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, encodePng } from "./lib.mjs";
import { detectGrid, splitStuckFigures } from "./beast-sheet-grid.mjs";
import { median } from "./beast-sheet-stats.mjs";
import { contactSheet } from "./beast-sheet-contact.mjs";
import { silhouetteDiff, silhouetteIou, BG_LOCK, BG_TOL, EMPTY_CELL_FRAC, BASELINE_FRAC } from "./beast-sheet-check.mjs";
import {
  DIRS, CLIPS, COLS, BAND_ROWS, TURNAROUND, CELL, SHEET_W, SHEET_H, DIR_OF_SHEET, ANIM_ROOT, sheetCells, figuresPerBand, framesOf, sheetFits, phutheInfo, GROUPS,
  guideKeyOf, gripKeyOf, gripCounts, gripCountAt, checkKind, animDir,
} from "./phuthe-sheet-lib.mjs";
import { prepareSheet, cellSpirit, cellGripObs, dropSpecks, eraseGuides, REG_MIN_SCORE } from "./phuthe-sheet-cut-lib.mjs";

// ---------- Ngưỡng ----------
export const REG_BLOCK = 0.25;          // điểm đăng ký nộm dưới mức này: coi như mất nộm (chặn); dưới REG_MIN_SCORE: nhẹ
export const DRIFT_LIGHT = 16, DRIFT_BLOCK = 40; // độ dời nộm của một ô so với trung vị tờ (điểm canonical): nhẹ / chặn
export const MIN_SPIRIT_PX = 20;        // ô có ít điểm phụ thể hơn số này là rỗng
export const ATTACH_FRAC = 0.12;        // khoảng cách tối đa (tỉ lệ cạnh ô) từ phụ thể tới nộm ở khung idle
export const SIZE_LIGHT = 0.1;          // cỡ phụ thể lệch quá mức này so với khối s: nhẹ (chỉ cảnh báo kỹ thuật, không chặn)
export const AREA_OUTLIER = 1.7;       // khung lệch diện tích so với trung vị cùng clip (như hồn thú)
export const GRIP_TOUCH = 12;        // kiểu vũ khí: khoảng cách tối đa (điểm canonical) từ marker điểm cầm tới điểm vũ khí gần nhất ở khung đứng (không lơ lửng cách tay)
export const DEAD_DIFF = 0.03, HURT_IDLE_DIFF = 0.08, SE_E_IOU = 0.8;
const LEVEL_RANK = { pass: 0, "nhẹ": 1, "chặn": 2 };
const SEV_LEVEL = { block: "chặn", light: "nhẹ", note: "pass" };
const LEVEL_ASCII = { pass: "PASS", "nhẹ": "NHE", "chặn": "CHAN" };
const ANIM_TAG = { idle: "I", walk: "W", attack: "A", cast: "C", hurt: "H" };
const ROW_LABELS = ["IDLE+HURT", "WALK", "ATTACK", "CAST"];

const maxLevel = (a, b) => (LEVEL_RANK[b] > LEVEL_RANK[a] ? b : a);
const round = (x, n = 3) => Math.round(x * 10 ** n) / 10 ** n;
const colsText = (cols) => { const a = Math.min(...cols) + 1, b = Math.max(...cols) + 1; return a === b ? `C${a}` : `C${a}–${b}`; };
const issue = (list, sev, code, where, msg, extra = {}) => list.push({ sev, code, where, msg, ...extra });
const finish = (res) => { res.level = res.issues.reduce((l, i) => maxLevel(l, SEV_LEVEL[i.sev]), "pass"); return res; };
/** Tên file turnaround (1 ảnh 3:2, 5 hướng × 3 tư thế). */
export const TURNAROUND_SHEET = "turnaround";

/** Phụ thể không dính nộm ở khung đứng: chặn với sinh vật / thực vật (B, C); nhẹ với vật cứng lơ lửng (A: tháp, đỉnh bồng bềnh). */
export const attachSeverity = (group) => (group === "A" ? "light" : "block");
const cellMask = (px) => { const m = new Uint8Array(CELL * CELL); for (const p of px) m[p[1] * CELL + p[0]] = 1; return { w: CELL, h: CELL, m }; };
/** Khoảng cách xa nhất cho phép: biến đổi khoảng cách (chessboard, hai lượt) từ mặt nạ nộm; trả khoảng cách nhỏ nhất của một tập điểm tới nộm. */
export function minDistToDummy(nomMask, px) {
  const D = new Int16Array(CELL * CELL).fill(9999);
  for (let i = 0; i < D.length; i++) if (nomMask[i]) D[i] = 0;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { let d = D[y * CELL + x]; if (x) d = Math.min(d, D[y * CELL + x - 1] + 1); if (y) d = Math.min(d, D[(y - 1) * CELL + x] + 1); if (x && y) d = Math.min(d, D[(y - 1) * CELL + x - 1] + 1); if (x < CELL - 1 && y) d = Math.min(d, D[(y - 1) * CELL + x + 1] + 1); D[y * CELL + x] = d; }
  for (let y = CELL - 1; y >= 0; y--) for (let x = CELL - 1; x >= 0; x--) { let d = D[y * CELL + x]; if (x < CELL - 1) d = Math.min(d, D[y * CELL + x + 1] + 1); if (y < CELL - 1) d = Math.min(d, D[(y + 1) * CELL + x] + 1); if (x < CELL - 1 && y < CELL - 1) d = Math.min(d, D[(y + 1) * CELL + x + 1] + 1); if (x && y < CELL - 1) d = Math.min(d, D[(y + 1) * CELL + x - 1] + 1); D[y * CELL + x] = d; }
  let best = 9999;
  for (const p of px) best = Math.min(best, D[p[1] * CELL + p[0]]);
  return best;
}

function bgCheck(res, grid, img) {
  const { issues } = res;
  const corners = [[0, 0], [img.w - 1, 0], [0, img.h - 1], [img.w - 1, img.h - 1]].map(([x, y]) => img.get(x, y).slice(0, 3));
  const dist = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
  const keyDev = dist(grid.key, BG_LOCK), cornerDev = Math.max(...corners.map((c) => dist(c, grid.key)));
  res.background = { key: grid.key, corners, keyDistFromLock: keyDev, cornerSpread: cornerDev };
  if (keyDev > BG_TOL) issue(issues, "block", "nen", "toàn tờ", `màu nền (${grid.key.join(",")}) cách #FF00FF ${keyDev} > ${BG_TOL} (dung sai khoá).`);
  else if (cornerDev > BG_TOL) issue(issues, "block", "nen", "toàn tờ", `bốn góc lệch màu nền chính ${cornerDev} > ${BG_TOL}: cutter không khoá được nền.`);
  else if (cornerDev > 30) issue(issues, "note", "nen", "toàn tờ", `nền dốc nhẹ (bốn góc lệch ${cornerDev}), trong dung sai ${BG_TOL}; không phải lỗi.`);
}
function sizeCheck(res, img) {
  if (!sheetFits(img.w, img.h)) { issue(res.issues, "block", "kich-thuoc", "toàn tờ", `${img.w}×${img.h} không đúng tỉ lệ 3:2 của tờ phụ thể (chuẩn ${SHEET_W}×${SHEET_H}).`); return false; }
  if (img.w !== SHEET_W || img.h !== SHEET_H) issue(res.issues, "note", "kich-thuoc", "toàn tờ", `${img.w}×${img.h} hợp lệ (cỡ theo tỉ lệ 3:2); cutter chuẩn hóa về ${SHEET_W}×${SHEET_H}.`);
  return true;
}

/** Phân tích ảnh turnaround (`o.guideKey`: màu vạch tham chiếu, xóa trước khi dò lưới): tỉ lệ 3:2, nền, lưới 3 hàng × 5 hình (không có kiểm nộm / chuyển động, chỉ duyệt bằng mắt). */
export function analyzeTurnaround(file, o = {}) {
  const img = readPng(file), res = { sheet: TURNAROUND_SHEET, file, size: [img.w, img.h], issues: [], blocks: [], cells: [], bands: [], dead: [], img, kind: "turnaround", dirs: DIRS, plan: { dirs: DIRS, cols: TURNAROUND.cols, rows: TURNAROUND.rows } };
  if (!sizeCheck(res, img)) return finish(res);
  const clean = eraseGuides(eraseGuides(img, o.guideKey), o.gripKey), grid = detectGrid(clean); // vạch tham chiếu (góc khung, chân, thước) không phải hình
  bgCheck(res, grid, clean);
  if (grid.bands.length !== TURNAROUND.rows) { issue(res.issues, "block", "luoi", "toàn tờ", `dò được ${grid.bands.length} dải hàng, cần ${TURNAROUND.rows}: không dò được lưới.`); return finish(res); }
  grid.bands.forEach((b, row) => {
    const rb = { ...b, row, state: "ok", figures: b.figures.map((f) => ({ ...f })) };
    res.bands.push(rb);
    if (b.figures.length === TURNAROUND.cols) return;
    const stuck = b.figures.some((f) => f.w > 1.5 * grid.medianFigW), fewer = b.figures.length < TURNAROUND.cols;
    issue(res.issues, "block", stuck && fewer ? "hinh-dinh" : "so-hinh", `H${row + 1} (${TURNAROUND.poses[row]})`, `hàng có ${b.figures.length} hình, cần ${TURNAROUND.cols}: ${fewer ? (stuck ? "hình dính nhau" : "thiếu khung") : "thừa hình / mảnh rời"}.`);
    rb.state = "bad"; rb.figures.forEach((f) => { f.state = "bad"; });
  });
  return finish(res);
}

/**
 * Phân tích một tờ hướng (toA–toE). `o`: { group, dir, frame, dummyKey, sex }.
 * @returns kết quả { issues, cells, bands, dead, grid, ..., frames: Map `anim/n` → { px, mask, dist } } (frames cho kiểm cỡ giữa các hướng)
 */
export function analyzeSheet(file, o) {
  const raw = readPng(file), name = path.basename(file, ".png"), dir = o.dir ?? DIR_OF_SHEET[name.replace(/^to/, "")];
  const res = { group: o.group, sheet: name, file, size: [raw.w, raw.h], issues: [], blocks: [], cells: [], bands: [], dead: [], img: raw, kind: "huong", dirs: [dir], frames: new Map(), areas: {} }, { issues } = res;
  if (!dir) throw new Error(`không biết hướng của ${name} (cần toA–toE)`);
  const group = o.group;
  res.plan = { dirs: [dir], cols: COLS, rows: BAND_ROWS };
  if (!sizeCheck(res, raw)) return finish(res);
  const clean = eraseGuides(eraseGuides(raw, o.guideKey), o.gripKey), grid = detectGrid(clean); // vạch tham chiếu không phải hình
  res.grid = grid;
  bgCheck(res, grid, clean);
  if (grid.bands.length !== BAND_ROWS) {
    issue(issues, "block", "luoi", "toàn tờ", `dò được ${grid.bands.length} dải hàng, cần ${BAND_ROWS}: không dò được lưới (hàng dính nhau hoặc vỡ).`);
    res.bands = grid.bands.map((b) => ({ ...b, state: "bad", figures: b.figures.map((f) => ({ ...f, state: "bad" })) }));
    return finish(res);
  }
  const per = figuresPerBand(group), cells = sheetCells(group), byRow = new Map();
  for (const s of splitStuckFigures(grid, per)) issue(issues, "note", "tach-hinh", `H${s.band + 1} (${dir})`, `dải dò được ${s.from} hình, tách hình dính (phụ thể chồng sang khung bên) tại thung lũng chiếu cột thành ${s.to}.`, { dir });
  for (const c of cells) { if (!byRow.has(c.row)) byRow.set(c.row, []); byRow.get(c.row).push(c); }
  const nominalCw = raw.w / COLS, nominalCh = raw.h / BAND_ROWS;
  let gridOk = true;
  grid.bands.forEach((b, row) => {
    const exp = byRow.get(row).sort((p, q) => p.col - q.col), tag = `H${row + 1} (${dir})`, rb = { ...b, row, dir, state: "ok", figures: b.figures.map((f) => ({ ...f })) };
    res.bands.push(rb);
    for (let c = exp.length; c < COLS; c++) { // ô trống (không có nộm, không có phụ thể) có hình
      let n = 0;
      const x0 = Math.round(c * nominalCw), x1 = Math.round((c + 1) * nominalCw), y0 = Math.round(row * nominalCh), y1 = Math.round((row + 1) * nominalCh);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) n += grid.mask[y * raw.w + x];
      if (n > EMPTY_CELL_FRAC * nominalCw * nominalCh) { issue(issues, "light", "o-trong", `${tag} C${c + 1}`, `ô trống có hình (${round((100 * n) / (nominalCw * nominalCh), 2)}% diện tích ô): hình tràn từ ô bên, hoặc nộm / phụ thể ở ô không dùng.`, { dir }); rb.state = "warn"; }
    }
    if (b.figures.length !== per[row]) {
      gridOk = false;
      const stuck = b.figures.some((f) => f.w > 1.5 * grid.medianFigW), fewer = b.figures.length < per[row];
      issue(issues, "block", stuck && fewer ? "hinh-dinh" : "so-hinh", tag, `dải có ${b.figures.length} hình, cần ${per[row]}: ${fewer ? (stuck ? "hình dính nhau" : "thiếu khung") : "thừa hình / mảnh rời"}.`, { dir });
      rb.state = "bad"; rb.figures.forEach((f) => { f.state = "bad"; });
      return;
    }
    const medH = median(b.figures.map((f) => f.h)), medBottom = median(b.figures.map((f) => f.y1)), off = [];
    rb.baseline = medBottom; rb.baselineX0 = b.figures[0].x0; rb.baselineX1 = b.figures[b.figures.length - 1].x1;
    b.figures.forEach((f, i) => {
      const cell = exp[i], dev = Math.abs(f.y1 - medBottom) / medH, rf = rb.figures[i];
      rf.label = `${ANIM_TAG[cell.anim]}${cell.frame}`;
      if (dev > BASELINE_FRAC) { off.push({ cell, dev }); rf.state = "warn"; }
      if (f.x0 <= 1 || f.x1 >= raw.w - 2 || f.y0 <= 1 || f.y1 >= raw.h - 2) { issue(issues, "light", "cham-mep", `${tag} ${colsText([cell.col])}`, "hình chạm mép tờ (có thể bị cắt).", { dir }); rf.state = "warn"; }
    });
    if (off.length) { issue(issues, "light", "chan-lech", `${tag} ${colsText(off.map((x) => x.cell.col))}`, `chân lệch > ${BASELINE_FRAC * 100}% chiều cao so với trung vị dải (lệch lớn nhất ${round(Math.max(...off.map((x) => x.dev)) * 100, 0)}%).`, { dir }); if (rb.state === "ok") rb.state = "warn"; }
  });
  if (!gridOk) return finish(res);
  analyzeCells(res, raw, o, dir);
  return finish(res);
}

/**
 * Kiểu vũ khí: (1) marker điểm cầm còn thấy thì không được trôi khỏi tay nộm (nhẹ > DRIFT_LIGHT, chặn > DRIFT_BLOCK điểm canonical; vũ khí che hết marker thì bỏ qua);
 * (2) ở khung đứng vũ khí phải CHẠM marker (điểm vũ khí gần nhất cách điểm cầm ≤ GRIP_TOUCH): không thì lơ lửng cách tay; chặn với mềm / găng (B), nhẹ với cứng (A) như `diem-gan`.
 */
export function weaponPoseGripPolicy({ id, clip, axisDegrees, primaryDistance, secondaryDistance = 0 }) {
  const verticalDeviation = Math.abs(90 - ((axisDegrees % 180 + 180) % 180));
  const primaryOnly = id === "hao_thien_chuy" && ["attack", "cast"].includes(clip) && Number.isFinite(axisDegrees) && verticalDeviation <= 15;
  return { primaryOnly, verticalDeviation, blocked: !Number.isFinite(primaryDistance) || primaryDistance > 2 || (!primaryOnly && (!Number.isFinite(secondaryDistance) || secondaryDistance > 20)) };
}

function gripChecks(res, cell, obs, px, tag, dir, skip, figure, o) {
  const { issues } = res;
  for (const [i, g] of obs.entries()) {
    if (g.seen > 0 && g.drift > DRIFT_BLOCK) { issue(issues, "block", "marker-troi", tag, `marker điểm cầm ${i ? "B" : "A"} bị dời ${round(g.drift, 0)} điểm so với tay nộm (> ${DRIFT_BLOCK}).`, { dir }); if (figure) figure.state = "bad"; }
    else if (g.seen > 0 && g.drift > DRIFT_LIGHT) { issue(issues, "light", "marker-troi", tag, `marker điểm cầm ${i ? "B" : "A"} bị dời ${round(g.drift, 0)} điểm so với tay nộm (> ${DRIFT_LIGHT}).`, { dir }); if (figure && figure.state === "ok") figure.state = "warn"; }
  }
  if (skip || !obs.length) return;
  if (o.poseFrames) {
    const measured = o.poseFrames.find((f) => f.name === `${o.sex}/${dir}/${cell.anim}/${cell.frame}`);
    if (!measured) { issue(issues, "block", "diem-cam", tag, "thiếu số đo pose tương ứng trong pose-plan.", { dir }); return; }
    const primaryDistance = minDistToPoint(px, obs[0].nominal) * o.frame / CELL;
    const policy = weaponPoseGripPolicy({ id: o.id, clip: cell.anim, axisDegrees: measured.axisDegrees, primaryDistance, secondaryDistance: measured.secondaryShaftDistance });
    if (policy.blocked) { issue(issues, "block", "diem-cam", tag, `A ${round(primaryDistance, 2)} px; ${policy.primaryOnly ? "khung dọc chỉ kiểm A≤2px" : "A≤2px và B tới cán≤20px"}.`, { dir }); if (figure) figure.state = "bad"; }
    return;
  }
  if (cell.anim !== "idle") return;
  const sev = attachSeverity(res.group), far = obs.map((g, i) => ({ i, d: minDistToPoint(px, g.nominal) })).filter((x) => x.d > GRIP_TOUCH);
  if (far.length) { issue(issues, sev, "diem-cam", tag, `vũ khí cách marker điểm cầm ${far.map((x) => `${x.i ? "B" : "A"} ${Math.round(x.d)}`).join(", ")} điểm (> ${GRIP_TOUCH}) ở khung đứng: lơ lửng, không nằm trong tay${sev === "light" ? " (vật cứng: nhẹ)" : ""}.`, { dir }); if (figure && sev === "block") figure.state = "bad"; }
}
/** Khoảng cách từ một điểm [u, v] tới điểm gần nhất trong `px` ([[u, v, …]]). */
export function minDistToPoint(px, [u, v]) { let best = Infinity; for (const p of px) best = Math.min(best, Math.hypot(p[0] + 0.5 - u, p[1] + 0.5 - v)); return best; }

/** Nộm, phụ thể từng ô (cần lưới đúng): đăng ký nộm, khung rỗng, điểm gắn, cỡ, khung chết, hurt = idle. */
function analyzeCells(res, raw, o, dir) {
  const { issues } = res, group = o.group, fr = framesOf(group);
  const prep = prepareSheet(raw, { group, dir, frame: o.frame, dummyKey: o.dummyKey, guideKey: o.guideKey, gripKey: o.gripKey, gripN: o.gripN, sex: o.sex ?? "m" });
  res.prep = { shift: prep.shift, factor: prep.factor, grid: prep.layout.mode };
  const rowState = (row) => res.bands.find((b) => b.row === row);
  for (const cell of prep.cells) {
    const tag = `H${cell.row + 1} (${dir}) ${colsText([cell.col])}`, key = `${cell.anim}/${cell.frame}`, figure = rowState(cell.row)?.figures[cell.col];
    const sp = cellSpirit(prep, cell), ds = dropSpecks(sp.px);
    const dev = Math.hypot(cell.reg.dx - prep.shift.dx, cell.reg.dy - prep.shift.dy);
    const score = round(cell.reg.score, 2);
    let nomLost = false;
    if (cell.reg.score < REG_BLOCK) { nomLost = true; issue(issues, "block", "nom-mat", tag, `không tìm thấy nộm trong ô (điểm khớp ${score} < ${REG_BLOCK}): nộm bị vẽ đè, đổi màu, xóa hoặc dời xa; cutter không biết vị trí gắn.`, { dir }); if (figure) figure.state = "bad"; }
    else if (cell.reg.score < REG_MIN_SCORE) { issue(issues, "light", "nom-mat", tag, `nộm bị che nhiều hoặc đổi dạng (điểm khớp ${score} < ${REG_MIN_SCORE}); cutter dùng độ dời trung vị của tờ.`, { dir }); if (figure && figure.state === "ok") figure.state = "warn"; }
    else if (dev > DRIFT_BLOCK) { issue(issues, "block", "nom-lech", tag, `nộm bị dời ${round(dev, 0)} điểm so với trung vị tờ (> ${DRIFT_BLOCK}): điểm gắn trôi giữa các khung.`, { dir }); if (figure) figure.state = "bad"; }
    else if (dev > DRIFT_LIGHT) { issue(issues, "light", "nom-lech", tag, `nộm bị dời ${round(dev, 0)} điểm so với trung vị tờ (> ${DRIFT_LIGHT}); cutter bù được.`, { dir }); if (figure && figure.state === "ok") figure.state = "warn"; }
    if (ds.px.length < MIN_SPIRIT_PX) {
      if (cell.anim === "hurt") issue(issues, "light", "hurt-rong", tag, `khung hurt rỗng (${ds.px.length} điểm phụ thể): hurt chỉ còn nháy trắng do code.`, { dir });
      else issue(issues, "block", "khung-rong", tag, `khung ${cell.anim} ${cell.frame + 1} rỗng (${ds.px.length} điểm phụ thể sau khi trừ nền và nộm): thiếu phụ thể, hoặc phụ thể trùng màu khóa nộm.`, { dir });
      if (figure) figure.state = "bad";
    } else if (!nomLost) {
      if (sp.edge > 8) issue(issues, "light", "cham-mep-khung", tag, `phụ thể chạm mép ô khung (${sp.edge} điểm): có thể bị cắt.`, { dir });
      if (sp.outside > 30) issue(issues, "light", "vuot-khung", tag, `${sp.outside} điểm phụ thể nằm ngoài ô khung (bị cắt).`, { dir });
      if (cell.anim === "idle" && o.kind !== "vukhi") { // điểm gắn: ở khung đứng, phụ thể phải dính nộm
        const d = minDistToDummy(cell.nom.mask, ds.px), lim = ATTACH_FRAC * CELL;
        if (d > lim) { issue(issues, attachSeverity(group), "diem-gan", tag, `phụ thể cách nộm ${d} điểm (> ${Math.round(lim)}) ở khung đứng: không dính vào thân${group === "A" ? " (vật cứng lơ lửng: nhẹ)" : ""}.`, { dir }); if (figure && attachSeverity(group) === "block") figure.state = "bad"; }
      }
    }
    if (o.kind === "vukhi") gripChecks(res, cell, cellGripObs(prep, cell), ds.px, tag, dir, nomLost || ds.px.length < MIN_SPIRIT_PX, figure, o);
    res.cells.push({ ...cell, dir, spirit: ds.px.length });
    res.frames.set(key, { px: ds.px, mask: cellMask(ds.px), area: ds.px.length });
  }
  for (const [anim, n] of Object.entries(fr)) { // khung chết, hurt = idle
    if (anim === "idle" || anim === "walk") {
      const fs = Array.from({ length: n }, (_, f) => res.frames.get(`${anim}/${f}`));
      if (n > 1 && fs.every((f) => f && f.px.length >= MIN_SPIRIT_PX)) {
        let maxD = 0;
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) maxD = Math.max(maxD, silhouetteDiff(fs[i].mask, fs[j].mask));
        res.dead.push({ dir, anim, maxDiff: round(maxD) });
        if (maxD < DEAD_DIFF) issue(issues, "light", "khung-chet", `H${anim === "idle" ? 1 : 2} (${dir})`, `${anim}: mọi khung phụ thể gần như trùng (xor/hợp tối đa ${round(maxD)} < ${DEAD_DIFF}); hoạt ảnh không chuyển động.`, { dir });
      }
    }
  }
  const i0 = res.frames.get("idle/0"), hurt = res.frames.get("hurt/0");
  if (i0 && hurt && i0.px.length >= MIN_SPIRIT_PX && hurt.px.length >= MIN_SPIRIT_PX && fr.hurt >= 1) {
    const d = silhouetteDiff(i0.mask, hurt.mask);
    res.dead.push({ dir, anim: "hurt-vs-idle", maxDiff: round(d) });
    if (d < HURT_IDLE_DIFF) issue(issues, "light", "hurt-idle", `H1 (${dir})`, `hurt trùng idle (xor/hợp ${round(d)}): không thấy phản ứng trúng đòn.`, { dir });
  }
  for (const anim of CLIPS) {
    const a = Array.from({ length: fr[anim] }, (_, f) => res.frames.get(`${anim}/${f}`)?.area).filter((x) => x >= MIN_SPIRIT_PX);
    if (a.length) res.areas[anim] = median(a);
  }
}

// ---------- Cả võ hồn ----------
export function sheetFiles(dir) { return "ABCDE".split("").map((l) => path.join(dir, `to${l}.png`)).filter(existsSync); }
export function turnaroundFile(dir) { const f = path.join(dir, `${TURNAROUND_SHEET}.png`); return existsSync(f) ? f : null; }

/** Kiểm mọi tờ của một võ hồn, thêm so cỡ phụ thể giữa các hướng (theo khối `s`) và se ≈ e. `opt`: { dir, group, frame, dummyKey, sex }. */
export function checkPhuThe(id, opt = {}) {
  const kind = checkKind(opt.kind), info = phutheInfo(id, kind, opt.specMd), dir = opt.dir ?? animDir(id, kind), group = opt.group ?? info.group, frame = opt.frame ?? info.frame, dummyKey = opt.dummyKey ?? info.dummyKey;
  if (!GROUPS.includes(group)) throw new Error(`nhóm lạ ${group}`);
  const ta = turnaroundFile(dir), files = sheetFiles(dir);
  if (!files.length && !ta) throw new Error(`không có tờ toA.png… trong ${dir}`);
  const guideKey = opt.guideKey ?? guideKeyOf(id, dummyKey), o = { id, poseFrames: opt.poseFrames, kind, group, frame, dummyKey, guideKey, ...(kind === "vukhi" ? { gripKey: opt.gripKey ?? gripKeyOf(id, dummyKey, guideKey), gripN: gripCounts(info.hands) } : {}), sex: opt.sex ?? "m" };
  const sheets = files.map((f) => analyzeSheet(f, o)), turnaround = ta ? analyzeTurnaround(ta, o) : null;
  const sRef = sheets.find((s) => s.dirs[0] === "s");
  if (sRef) for (const s of sheets) {
    if (s === sRef) continue;
    const parts = [];
    for (const anim of CLIPS) if (sRef.areas[anim] && s.areas[anim]) { const r = Math.sqrt(s.areas[anim] / sRef.areas[anim]); if (Math.abs(r - 1) > SIZE_LIGHT) parts.push(`${anim} ${Math.round(r * 100)}%`); }
    if (parts.length) issue(s.issues, "light", "co-phu-the", `khối ${s.dirs[0]}`, `cỡ phụ thể so với khối s: ${parts.join(", ")} (lệch quá ${SIZE_LIGHT * 100}%; cảnh báo kỹ thuật, cutter không chặn).`, { dir: s.dirs[0] });
  }
  const se = sheets.find((s) => s.dirs[0] === "se")?.frames.get("idle/0"), e = sheets.find((s) => s.dirs[0] === "e")?.frames.get("idle/0");
  if (se && e && se.px.length >= MIN_SPIRIT_PX && e.px.length >= MIN_SPIRIT_PX) {
    const iou = silhouetteIou(se.mask, e.mask), sh = sheets.find((s) => s.dirs[0] === "se");
    sh.seVsE = round(iou);
    if (iou > SE_E_IOU) issue(sh.issues, "note", "se-giong-e", "se vs e", `hình bóng phụ thể idle se ≈ e (IoU ${round(iou)} > ${SE_E_IOU}): cảnh báo gần đúng, xem bằng mắt.`, { dir: "se" });
  }
  let level = turnaround ? turnaround.level : "pass";
  const blockLevel = {};
  for (const s of sheets) {
    finish(s); level = maxLevel(level, s.level);
    const d = s.dirs[0];
    blockLevel[d] = maxLevel(blockLevel[d] ?? "pass", s.level);
  }
  return { id, kind, dir, group, frame, dummyKey, level, sheets, turnaround, blockLevel };
}
export const allSheets = (r) => [...r.sheets, ...(r.turnaround ? [r.turnaround] : [])];

// ---------- Dòng LỖI nháp ----------
const CODE_VI = { "kich-thuoc": "sai kích thước", nen: "nền ngoài dung sai", luoi: "không dò được lưới", "so-hinh": "sai số hình", "hinh-dinh": "hình dính", "o-trong": "hình ở ô trống", "cham-mep": "chạm mép tờ",
  "chan-lech": "chân lệch", "khung-chet": "khung chết", "hurt-idle": "hurt trùng idle", "nom-mat": "mất nộm", "nom-lech": "nộm bị dời", "khung-rong": "khung rỗng", "hurt-rong": "hurt rỗng", "diem-gan": "điểm gắn trôi",
  "diem-cam": "vũ khí không chạm marker", "marker-troi": "marker điểm cầm trôi", "cham-mep-khung": "chạm mép khung", "khung-lech": "khung lệch", "vuot-khung": "vượt khung" };
/** Ghi chú kỹ thuật cỡ phụ thể (không phải lỗi, không có tiền tố `LỖI:`). */
export const sizeNotes = (sheet) => sheet.issues.filter((i) => i.code === "co-phu-the").map((i) => `${i.where}: ${i.msg}`);
/** Dòng `LỖI:` nháp theo mẫu NGUON.md: tờ — loại / loại — vị trí — mô tả. Chỉ mục nhẹ và chặn, trừ cỡ phụ thể (ghi chú kỹ thuật); null nếu không có. */
export function draftErrorLine(sheet) {
  const list = sheet.issues.filter((i) => i.sev !== "note" && i.code !== "co-phu-the");
  if (!list.length) return null;
  const codes = [...new Set(list.map((i) => CODE_VI[i.code] ?? i.code))];
  return `LỖI: ${sheet.sheet} — ${codes.join(" / ")} — ${list.map((i) => i.where).join(", ")} — ${list.map((i) => i.msg.replace(/\.$/, "")).join("; ")}.`;
}

// ---------- Báo cáo ----------
export function toJson(r) {
  return {
    id: r.id, kind: r.kind, level: r.level, group: r.group, frame: r.frame, dummyKey: r.dummyKey, blockLevel: r.blockLevel,
    sheets: allSheets(r).map((s) => ({
      sheet: s.sheet, size: s.size, kind: s.kind ?? null, level: s.level, dirs: s.dirs ?? null, background: s.background ?? null, seVsE: s.seVsE ?? null, prep: s.prep ?? null,
      bands: s.bands.map((b) => ({ row: (b.row ?? 0) + 1, dir: b.dir ?? null, y: [b.y0, b.y1], figures: b.figures.length, state: b.state })),
      motion: s.dead, issues: s.issues.map(({ sev, code, where, msg }) => ({ sev, code, where, msg })), draft: draftErrorLine(s),
    })),
  };
}
export function toMarkdown(r) {
  const n = (s, sev) => s.issues.filter((i) => i.sev === sev).length;
  const L = [`# Kiểm tờ ${r.kind === "vukhi" ? "vũ khí" : "phụ thể"}: ${r.id}`, "", `**Mức chung: ${r.level.toUpperCase()}** · nhóm ${r.group}, khung ${r.frame}, màu khóa nộm ${r.dummyKey}.`, "", "| Tờ | Cỡ | Loại | Mức | Chặn | Nhẹ | Lưu ý |", "|---|---|---|---|---|---|---|"];
  for (const s of allSheets(r)) L.push(`| ${s.sheet} | ${s.size.join("×")} | ${s.kind ?? "?"} | ${s.level} | ${n(s, "block")} | ${n(s, "light")} | ${n(s, "note")} |`);
  L.push("", "Mức theo khối hướng: " + DIRS.filter((d) => r.blockLevel[d]).map((d) => `${d} ${r.blockLevel[d]}`).join(" · "), "");
  for (const s of allSheets(r)) {
    L.push(`## ${s.sheet} — ${s.level}`, "", `Ảnh liên hệ: \`${r.id}-${s.sheet}-lien-he.png\` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).`, "");
    if (!s.issues.length) L.push("Không có phát hiện.");
    for (const i of s.issues) L.push(`- **${{ block: "CHẶN", light: "nhẹ", note: "lưu ý" }[i.sev]}** \`${i.code}\` ${i.where}: ${i.msg}`);
    const d = draftErrorLine(s), sn = sizeNotes(s);
    if (sn.length) L.push("", "Ghi chú kỹ thuật (cỡ phụ thể, không phải lỗi):", ...sn.map((x) => `- ${x}`));
    L.push("", d ? ["Dòng nháp cho NGUON.md (soát lại bằng mắt trước khi dán):", "", "```", d, "```"].join("\n") : "Không có dòng `LỖI:` tự sinh.", "");
  }
  L.push("## Việc còn lại cho mắt người", "", "Công cụ không kiểm: nhận diện đúng võ hồn so với bảng mô tả, vẽ lại thân / mặt / tay chân người, nộm bị vẽ thêm mặt ở `n` / `ne`, `se` / `ne` khác `e` thật sự, hurt lùi đúng hướng, điểm gắn khớp khi ghép lên thân thật (`phuthe-sheet-preview.mjs`).", "Xem từng ảnh liên hệ và bổ sung các điểm này vào dòng `LỖI:`.", "");
  return L.join("\n");
}

/** Ghi JSON + MD + ảnh liên hệ vào `out`; trả danh sách file. */
export function writeReport(r, out, { images = true } = {}) {
  mkdirSync(out, { recursive: true });
  const files = [], put = (name, data) => { const f = path.join(out, name); writeFileSync(f, data); files.push(f); };
  put(`${r.id}-check.json`, JSON.stringify(toJson(r), null, 2) + "\n");
  put(`${r.id}-check.md`, toMarkdown(r));
  if (images) for (const s of allSheets(r)) {
    const plan = s.plan ?? { dirs: [], rows: Math.max(1, s.bands.length), cols: COLS };
    const rowLabels = s.sheet === TURNAROUND_SHEET ? TURNAROUND.poses.map((p) => p.toUpperCase()) : ROW_LABELS.map((l) => `${(s.dirs?.[0] ?? "?").toUpperCase()} ${l}`);
    put(`${r.id}-${s.sheet}-lien-he.png`, encodePng(contactSheet(s.img, { title: `${r.id} ${s.sheet} ${s.size.join("X")} ${LEVEL_ASCII[s.level]}`, plan, bands: s.bands, rowLabels })));
  }
  return files;
}

// ---------- CLI ----------
function parseArgs(argv) {
  const o = { ids: [], images: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") o.out = argv[++i];
    else if (a === "--dir") o.dir = argv[++i];
    else if (a === "--frame") o.frame = +argv[++i];
    else if (a === "--dummy-key") o.dummyKey = argv[++i];
    else if (a === "--guide-key") o.guideKey = argv[++i];
    else if (a === "--grip-key") o.gripKey = argv[++i];
    else if (a === "--pose-plan") o.poseFrames = JSON.parse(readFileSync(argv[++i], "utf8")).distances;
    else if (a === "--kind") o.kind = argv[++i];
    else if (a === "--no-image") o.images = false;
    else if (a === "--all") o.all = true;
    else if (a.startsWith("--")) throw new Error(`tùy chọn lạ: ${a}`);
    else o.ids.push(a);
  }
  return o;
}
const summary = (r) => `${r.level.padEnd(5)} ${r.id}: ${allSheets(r).map((s) => `${s.sheet}=${s.level}(${s.issues.filter((i) => i.sev === "block").length}/${s.issues.filter((i) => i.sev === "light").length})`).join(" ")}`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    if (o.all) o.ids = existsSync(ANIM_ROOT) ? readdirSync(ANIM_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory() && (o.kind !== "vukhi" || existsSync(animDir(d.name, "vukhi")))).map((d) => d.name).sort() : [];
    if (!o.ids.length && !o.all) { console.error("Dùng: npm run phuthe:check -- <võ hồn> [--out <thư mục>] [--dir <thư mục tờ>] [--frame 96|128] [--dummy-key #00D0D0] [--guide-key #7A5CFF] [--kind phuthe|vukhi] [--grip-key #00FF60] [--no-image]   |   npm run phuthe:check -- --all"); process.exit(2); }
    const base = o.out ?? path.join(os.tmpdir(), "phuthe-check");
    let blocked = 0;
    for (const id of o.ids) {
      let r;
      try { r = checkPhuThe(id, { ...(o.dir ? { dir: o.dir } : {}), ...(o.frame ? { frame: o.frame } : {}), ...(o.dummyKey ? { dummyKey: o.dummyKey } : {}), ...(o.guideKey ? { guideKey: o.guideKey } : {}), ...(o.gripKey ? { gripKey: o.gripKey } : {}), ...(o.kind ? { kind: o.kind } : {}), ...(o.poseFrames ? { poseFrames: o.poseFrames } : {}) }); }
      catch (e) { if (o.all && /không có tờ/.test(e.message)) { console.log(`bỏ qua ${id} (chưa có tờ)`); continue; } throw e; }
      console.log(summary(r));
      if (r.level === "chặn") blocked++;
      if (!o.all) {
        const files = writeReport(r, o.ids.length > 1 ? path.join(base, id) : base, { images: o.images });
        for (const s of allSheets(r)) { const d = draftErrorLine(s); if (d) console.log(d); }
        console.log(`Đã ghi ${files.length} file vào ${path.dirname(files[0])}`);
      }
    }
    process.exit(blocked ? 1 : 0);
  } catch (e) { console.error(e.message); process.exit(2); }
}
