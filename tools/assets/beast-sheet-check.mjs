// Kiểm tờ hoạt ảnh hồn thú trước khi cắt / nhập (#863, theo dõi #861; docs/art/hon-thu-hoat-anh.md mục "Kiểm tờ").
//   npm run beast:check -- <loài> [--out <thư mục>] [--dir <thư mục chứa toA.png…>] [--no-image]
//   npm run beast:check -- --all            (mọi loài trong art/src/beast-anim, chỉ in bảng tóm tắt)
// Chỉ đọc tờ RAW: cỡ / tỉ lệ ∈ tập cho phép, khóa nền (dung sai), dò lưới theo khoảng trống, số hình mỗi dải, ô trống có hình, hình dính,
// chân lệch, cỡ thân từng khối so với ảnh tĩnh, khung chết, hurt = idle, se ≈ e. Ghi <out>/<loài>-check.json + .md + tờ liên hệ có nhãn
// (<loài>-to<X>-lien-he.png) + dòng `LỖI:` nháp. Mức: pass / nhẹ / chặn (thoát mã 1 khi có chặn). Hướng mặt (`n` / `ne` lộ mặt), hurt ngửa
// bụng, die xoay: KHÔNG kiểm bằng code; xem tờ liên hệ bằng mắt. Không sửa tờ, không ghi vào repo (mặc định ghi ở thư mục tạm).
import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, encodePng, ROOT, SPRITES } from "./lib.mjs";
import { DIRS, ANIMS, COLS, BAND_ROWS, sheetCells } from "./beast-sheet-lib.mjs";
import { detectGrid } from "./beast-sheet-grid.mjs";
import { median } from "./beast-sheet-stats.mjs";
import { contactSheet } from "./beast-sheet-contact.mjs";

// ---------- Ngưỡng (đo trên tờ thật, bao-cao-h4.md Phụ lục A) ----------
/** Cỡ hợp lệ theo tỉ lệ (quyết định chủ repo #861): A 2:3, B 1:1 (1254² hoặc 1024²), một hướng mỗi tờ 3:2. Tỉ lệ ±1%. */
export const SHAPES = {
  A: { ratio: 2 / 3, sizes: [[1024, 1536]], canon: 1024, dirs: ["s", "se", "e"] },
  B: { ratio: 1, sizes: [[1254, 1254], [1024, 1024]], canon: 1024, dirs: ["ne", "n"] },
  boss: { ratio: 3 / 2, sizes: [[1536, 1024]], canon: 1536, dirs: null },
};
export const RATIO_TOL = 0.01;
export const BG_LOCK = [255, 0, 255], BG_TOL = 60;
export const EMPTY_CELL_FRAC = 0.003;
export const BASELINE_FRAC = 0.12;
export const BODY_BLOCK = 0.25, BODY_LIGHT = 0.1;
export const DEAD_DIFF = 0.03, HURT_IDLE_DIFF = 0.08, SE_E_IOU = 0.8;
const LEVEL_RANK = { pass: 0, "nhẹ": 1, "chặn": 2 };
const SEV_LEVEL = { block: "chặn", light: "nhẹ", note: "pass" };
const LEVEL_ASCII = { pass: "PASS", "nhẹ": "NHE", "chặn": "CHAN" }; // phông ảnh liên hệ không có dấu
const ANIM_TAG ={ idle: "I", walk: "W", attack: "A", hurt: "H", die: "D" };

const maxLevel = (a, b) => (LEVEL_RANK[b] > LEVEL_RANK[a] ? b : a);
const round = (x, n = 3) => Math.round(x * 10 ** n) / 10 ** n;
const colsText = (cols) => { const a = Math.min(...cols) + 1, b = Math.max(...cols) + 1; return a === b ? `C${a}` : `C${a}–${b}`; };

/** Phân loại tờ theo tỉ lệ → { kind, shape } hoặc null. */
export function classifyShape(w, h) {
  for (const [kind, shape] of Object.entries(SHAPES)) if (Math.abs(w / h - shape.ratio) <= RATIO_TOL * shape.ratio) return { kind, shape };
  return null;
}

// ---------- Hình bóng ----------
function crop(grid, f) {
  const m = new Uint8Array(f.w * f.h);
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) m[y * f.w + x] = grid.mask[(f.y0 + y) * grid.w + f.x0 + x];
  return { w: f.w, h: f.h, m };
}
/** Hai hình bóng căn đáy-giữa: xor / hợp (0 = trùng hẳn). Lấy nhỏ nhất qua lệch ngang ±2 px. */
export function silhouetteDiff(a, b) {
  const W = Math.max(a.w, b.w) + 4, H = Math.max(a.h, b.h);
  const at = (s, x, y, dx) => { const u = x - (((W - s.w) >> 1) + dx), v = y - (H - s.h); return u >= 0 && v >= 0 && u < s.w && v < s.h ? s.m[v * s.w + u] : 0; };
  let best = 1;
  for (let dx = -2; dx <= 2; dx++) {
    let x = 0, u = 0;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const p = at(a, i, j, 0), q = at(b, i, j, dx); if (p || q) { u++; if (p !== q) x++; } }
    if (u) best = Math.min(best, x / u);
  }
  return best;
}
/** Thu hình bóng về cao H (lấy mẫu gần nhất, giữ tỉ lệ) rồi IoU căn đáy-giữa. */
export function silhouetteIou(a, b, H = 48) {
  const rs = (s) => {
    const k = H / s.h, w = Math.max(1, Math.round(s.w * k)), m = new Uint8Array(w * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < w; x++) m[y * w + x] = s.m[Math.min(s.h - 1, (y / k) | 0) * s.w + Math.min(s.w - 1, (x / k) | 0)];
    return { w, m };
  };
  const A = rs(a), B = rs(b), W = Math.max(A.w, B.w), at = (s, x, y) => { const v = x - ((W - s.w) >> 1); return v >= 0 && v < s.w ? s.m[y * s.w + v] : 0; };
  let inter = 0, uni = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = at(A, x, y), q = at(B, x, y); if (p && q) inter++; if (p || q) uni++; }
  return uni ? inter / uni : 0;
}

// ---------- Ảnh tĩnh ----------
/** Chiều cao thân (hộp bao) ba hướng trong ảnh tĩnh `beast/<loài>.png` (3 khung vuông: s, e, n), hoặc null nếu chưa có. */
export function staticHeights(id) {
  const f = path.join(SPRITES, "beast", `${id}.png`);
  if (!existsSync(f)) return null;
  const im = readPng(f), F = im.h, out = {};
  ["s", "e", "n"].forEach((d, c) => {
    let y0 = F, y1 = -1;
    for (let y = 0; y < F; y++) for (let x = c * F; x < (c + 1) * F; x++) if (im.alpha(x, y) > 0) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
    out[d] = y1 >= 0 ? y1 - y0 + 1 : null;
  });
  return out.s && out.e && out.n ? out : null;
}
/** Chiều cao neo theo hướng: s / e / n lấy trực tiếp, se = TB(s, e), ne = TB(e, n). */
const anchorOf = (st, dir) => ({ s: st.s, e: st.e, n: st.n, se: (st.s + st.e) / 2, ne: (st.e + st.n) / 2 })[dir];

// ---------- Một tờ ----------
const issue = (list, sev, code, where, msg, extra = {}) => list.push({ sev, code, where, msg, ...extra });

function finish(res) {
  res.level = res.issues.reduce((l, i) => maxLevel(l, SEV_LEVEL[i.sev]), "pass");
  return res;
}

/** Phân tích một tờ; cỡ thân so với ảnh tĩnh làm ở checkSpecies (cần hệ số chung cả loài). */
export function analyzeSheet(file) {
  const img = readPng(file), name = path.basename(file, ".png"), letter = name.replace(/^to/, "");
  const issues = [], res = { sheet: name, file, size: [img.w, img.h], issues, blocks: [], cells: [], bands: [], dead: [], img };
  const cls = classifyShape(img.w, img.h);
  if (!cls) {
    issue(issues, "block", "kich-thuoc", "toàn tờ", `${img.w}×${img.h} không đúng tỉ lệ nào trong tập cho phép (A 2:3, B 1:1, một hướng 3:2).`);
    return finish(res);
  }
  const { kind, shape } = cls;
  res.kind = kind;
  const exact = shape.sizes.some(([w, h]) => w === img.w && h === img.h);
  if (!exact) issue(issues, "light", "kich-thuoc", "toàn tờ", `cỡ ${img.w}×${img.h} đúng tỉ lệ nhưng ngoài danh sách (${shape.sizes.map((s) => s.join("×")).join(", ")}); cutter chuẩn hoá được.`);
  else if (img.w !== shape.canon) issue(issues, "note", "kich-thuoc", "toàn tờ", `${img.w}×${img.h} hợp lệ (quyết định #861); hệ số chuẩn hoá ${round(shape.canon / img.w, 4)}.`);
  const dirs = shape.dirs ?? [DIRS["ABCDE".indexOf(letter)] ?? DIRS[0]];
  const plan = { dirs, cols: COLS, rows: dirs.length * BAND_ROWS };
  res.dirs = dirs; res.plan = plan; res.canonFactor = shape.canon / img.w;

  const grid = detectGrid(img);
  res.grid = grid;
  const corners = [[0, 0], [img.w - 1, 0], [0, img.h - 1], [img.w - 1, img.h - 1]].map(([x, y]) => img.get(x, y).slice(0, 3));
  const dist = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
  const keyDev = dist(grid.key, BG_LOCK), cornerDev = Math.max(...corners.map((c) => dist(c, grid.key)));
  res.background = { key: grid.key, corners, keyDistFromLock: keyDev, cornerSpread: cornerDev };
  if (keyDev > BG_TOL) issue(issues, "block", "nen", "toàn tờ", `màu nền (${grid.key.join(",")}) cách #FF00FF ${keyDev} > ${BG_TOL} (dung sai khoá).`);
  else if (cornerDev > BG_TOL) issue(issues, "block", "nen", "toàn tờ", `bốn góc lệch màu nền chính ${cornerDev} > ${BG_TOL}: cutter không khoá được nền.`);
  else if (cornerDev > 30) issue(issues, "note", "nen", "toàn tờ", `nền dốc nhẹ (bốn góc lệch ${cornerDev}), trong dung sai ${BG_TOL}; không phải lỗi.`);

  if (grid.bands.length !== plan.rows) {
    issue(issues, "block", "luoi", "toàn tờ", `dò được ${grid.bands.length} dải hàng, cần ${plan.rows}: không dò được lưới (hàng dính nhau hoặc vỡ).`);
    res.bands = grid.bands.map((b) => ({ ...b, state: "bad", figures: b.figures.map((f) => ({ ...f, state: "bad" })) }));
    return finish(res);
  }
  const cellsByRow = new Map();
  for (const c of sheetCells(plan)) { if (!cellsByRow.has(c.row)) cellsByRow.set(c.row, []); cellsByRow.get(c.row).push(c); }
  const nominalCw = img.w / COLS, nominalCh = img.h / plan.rows;
  grid.bands.forEach((b, row) => {
    const exp = cellsByRow.get(row).sort((p, q) => p.col - q.col), dir = dirs[(row / BAND_ROWS) | 0];
    const tag = `H${row + 1} (${dir})`, rb = { ...b, row, dir, state: "ok", figures: b.figures.map((f) => ({ ...f })) };
    res.bands.push(rb);
    // ô trống (cột sau khung cuối của dải) có hình: đếm điểm vật trong ô danh nghĩa, ngưỡng 0,3% diện tích ô
    for (let c = exp.length; c < COLS; c++) {
      let n = 0;
      const x0 = Math.round(c * nominalCw), x1 = Math.round((c + 1) * nominalCw), y0 = Math.round(row * nominalCh), y1 = Math.round((row + 1) * nominalCh);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) n += grid.mask[y * img.w + x];
      if (n > EMPTY_CELL_FRAC * nominalCw * nominalCh) {
        issue(issues, "light", "o-trong", `${tag} C${c + 1}`, `ô trống có hình (${round((100 * n) / (nominalCw * nominalCh), 2)}% diện tích ô): hình tràn từ ô bên.`, { dir });
        rb.state = "warn";
      }
    }
    if (b.figures.length !== exp.length) {
      const stuck = b.figures.some((f) => f.w > 1.5 * grid.medianFigW);
      const why = b.figures.length < exp.length ? (stuck ? "hình dính nhau" : "thiếu khung") : "thừa hình / mảnh rời";
      issue(issues, "block", stuck && b.figures.length < exp.length ? "hinh-dinh" : "so-hinh", tag, `dải có ${b.figures.length} hình, cần ${exp.length}: ${why}.`, { dir });
      rb.state = "bad"; rb.figures.forEach((f) => { f.state = "bad"; });
      return;
    }
    const medH = median(b.figures.map((f) => f.h)), medBottom = median(b.figures.map((f) => f.y1));
    rb.baseline = medBottom; rb.baselineX0 = b.figures[0].x0; rb.baselineX1 = b.figures[b.figures.length - 1].x1;
    const off = [];
    b.figures.forEach((f, i) => {
      const cell = exp[i], dev = Math.abs(f.y1 - medBottom) / medH, rf = rb.figures[i];
      rf.label = `${ANIM_TAG[cell.anim]}${cell.frame}`;
      res.cells.push({ ...cell, dir, fig: b.figures[i], bandRow: row });
      if (dev > BASELINE_FRAC) { off.push({ cell, dev }); rf.state = "warn"; }
      if (f.x0 <= 1 || f.x1 >= img.w - 2 || f.y0 <= 1 || f.y1 >= img.h - 2) {
        issue(issues, "light", "cham-mep", `${tag} ${colsText([cell.col])}`, "hình chạm mép tờ (có thể bị cắt).", { dir });
        rf.state = "warn";
      }
    });
    if (off.length) {
      issue(issues, "light", "chan-lech", `${tag} ${colsText(off.map((o) => o.cell.col))}`, `chân lệch > ${BASELINE_FRAC * 100}% chiều cao so với trung vị dải (lệch lớn nhất ${round(Math.max(...off.map((o) => o.dev)) * 100, 0)}%).`, { dir });
      if (rb.state === "ok") rb.state = "warn";
    }
  });
  analyzeMotion(res, grid);
  return finish(res);
}

/** Cỡ thân idle từng khối, khung chết, hurt = idle, se ≈ e (chỉ khi đủ hình ở các dải liên quan). */
function analyzeMotion(res, grid) {
  const { issues } = res, bySlot = new Map(), crops = new Map();
  for (const c of res.cells) bySlot.set(`${c.dir}/${c.anim}/${c.frame}`, c);
  const cropOf = (c) => { const k = `${c.dir}/${c.anim}/${c.frame}`; if (!crops.has(k)) crops.set(k, crop(grid, c.fig)); return crops.get(k); };
  for (const dir of res.dirs) {
    const idle = [0, 1, 2, 3].map((f) => bySlot.get(`${dir}/idle/${f}`)).filter(Boolean);
    if (idle.length === 4) res.blocks.push({ dir, idleH: median(idle.map((c) => c.fig.h)), row: idle[0].bandRow });
    for (const anim of ["idle", "walk"]) {
      const n = ANIMS.find(([a]) => a === anim)[1], fr = Array.from({ length: n }, (_, f) => bySlot.get(`${dir}/${anim}/${f}`));
      if (fr.some((c) => !c)) continue;
      let maxD = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) maxD = Math.max(maxD, silhouetteDiff(cropOf(fr[i]), cropOf(fr[j])));
      res.dead.push({ dir, anim, maxDiff: round(maxD) });
      if (maxD < DEAD_DIFF) issue(issues, "light", "khung-chet", `H${fr[0].bandRow + 1} (${dir}) ${colsText(fr.map((c) => c.col))}`, `${anim}: mọi khung gần như trùng (xor/hợp tối đa ${round(maxD)} < ${DEAD_DIFF}); hoạt ảnh không chuyển động.`, { dir });
    }
    const i0 = bySlot.get(`${dir}/idle/0`), hurt = [0, 1].map((f) => bySlot.get(`${dir}/hurt/${f}`));
    if (i0 && hurt.every(Boolean)) {
      const ds = hurt.map((h) => silhouetteDiff(cropOf(i0), cropOf(h)));
      res.dead.push({ dir, anim: "hurt-vs-idle", maxDiff: round(Math.max(...ds)) });
      if (Math.max(...ds) < HURT_IDLE_DIFF) issue(issues, "light", "hurt-idle", `H${hurt[0].bandRow + 1} (${dir}) ${colsText(hurt.map((c) => c.col))}`, `hurt trùng idle (xor/hợp ${ds.map((d) => round(d)).join(" / ")}): không thấy phản ứng trúng đòn.`, { dir });
    }
  }
  const se = bySlot.get("se/idle/0"), e = bySlot.get("e/idle/0");
  if (se && e) {
    const iou = silhouetteIou(cropOf(se), cropOf(e));
    res.seVsE = round(iou);
    if (iou > SE_E_IOU) issue(issues, "note", "se-giong-e", `H${se.bandRow + 1} (se) vs H${e.bandRow + 1} (e)`, `hình bóng idle se ≈ e (IoU ${round(iou)} > ${SE_E_IOU}): cảnh báo gần đúng, xem bằng mắt (thú ngồi xổm có thể giống thật).`, { dir: "se" });
  }
}

// ---------- Cả loài ----------
export function sheetFiles(dir) {
  return "ABCDE".split("").map((l) => path.join(dir, `to${l}.png`)).filter(existsSync);
}

/** Kiểm mọi tờ của một loài, thêm kiểm cỡ thân (hệ số chung cả loài, neo theo ảnh tĩnh). */
export function checkSpecies(id, { dir = path.join(ROOT, "art", "src", "beast-anim", id) } = {}) {
  const files = sheetFiles(dir);
  if (!files.length) throw new Error(`không có tờ toA.png… trong ${dir}`);
  const sheets = files.map((f) => analyzeSheet(f));
  const st = staticHeights(id), blocks = sheets.flatMap((s) => s.blocks.map((b) => ({ ...b, sheet: s, h: b.idleH * s.canonFactor })));
  const anchored = Boolean(blocks.length && st);
  const k = !blocks.length ? 1 : anchored ? median(blocks.map((b) => b.h / anchorOf(st, b.dir))) : median(blocks.map((b) => b.h));
  for (const b of blocks) {
    b.rel = (anchored ? b.h / anchorOf(st, b.dir) : b.h) / k;
    const dev = Math.abs(b.rel - 1), ref = anchored ? "ảnh tĩnh" : "trung vị các hướng", where = `H${b.row + 1}–${b.row + BAND_ROWS} (${b.dir})`;
    if (dev > BODY_BLOCK) issue(b.sheet.issues, "block", "co-than", where, `cỡ thân idle ${round(b.rel * 100, 0)}% so với ${ref} (lệch > ${BODY_BLOCK * 100}%).`, { dir: b.dir });
    else if (dev > BODY_LIGHT) issue(b.sheet.issues, "light", "co-than", where, `cỡ thân idle ${round(b.rel * 100, 0)}% so với ${ref} (lệch ${round(dev * 100, 0)}%).`, { dir: b.dir });
    b.sheet.bodyRel = { ...(b.sheet.bodyRel ?? {}), [b.dir]: round(b.rel) };
  }
  let level = "pass";
  const blockLevel = {};
  for (const s of sheets) {
    finish(s); level = maxLevel(level, s.level);
    for (const d of s.dirs ?? []) {
      const l = s.issues.filter((i) => i.dir === d || !i.dir).reduce((a, i) => maxLevel(a, SEV_LEVEL[i.sev]), "pass");
      blockLevel[d] = maxLevel(blockLevel[d] ?? "pass", l);
    }
  }
  return { id, dir, level, anchored, staticHeights: st, bodyScale: round(k, 4), sheets, blockLevel };
}

// ---------- Dòng LỖI nháp ----------
const CODE_VI = { "kich-thuoc": "sai kích thước", nen: "nền ngoài dung sai", luoi: "không dò được lưới", "so-hinh": "sai số hình", "hinh-dinh": "hình dính", "o-trong": "hình ở ô trống", "cham-mep": "chạm mép tờ", "chan-lech": "chân lệch", "co-than": "cỡ thân lệch", "khung-chet": "khung chết", "hurt-idle": "hurt trùng idle" };
/** Dòng `LỖI:` nháp theo mẫu NGUON.md: tờ — loại / loại — vị trí — mô tả. Chỉ gồm mục nhẹ và chặn; null nếu không có. */
export function draftErrorLine(sheet) {
  const list = sheet.issues.filter((i) => i.sev !== "note");
  if (!list.length) return null;
  const codes = [...new Set(list.map((i) => CODE_VI[i.code] ?? i.code))];
  return `LỖI: ${sheet.sheet} — ${codes.join(" / ")} — ${list.map((i) => i.where).join(", ")} — ${list.map((i) => i.msg.replace(/\.$/, "")).join("; ")}.`;
}

// ---------- Báo cáo ----------
export function toJson(r) {
  return {
    species: r.id, level: r.level, bodyScale: r.bodyScale, anchoredToStatic: r.anchored, staticHeights: r.staticHeights, blockLevel: r.blockLevel,
    sheets: r.sheets.map((s) => ({
      sheet: s.sheet, size: s.size, kind: s.kind ?? null, level: s.level, dirs: s.dirs ?? null, background: s.background ?? null, bodyRel: s.bodyRel ?? {}, seVsE: s.seVsE ?? null,
      bands: s.bands.map((b) => ({ row: (b.row ?? 0) + 1, dir: b.dir ?? null, y: [b.y0, b.y1], figures: b.figures.length, state: b.state })),
      motion: s.dead, issues: s.issues.map(({ sev, code, where, msg }) => ({ sev, code, where, msg })), draft: draftErrorLine(s),
    })),
  };
}
export function toMarkdown(r) {
  const n = (s, sev) => s.issues.filter((i) => i.sev === sev).length;
  const L = [`# Kiểm tờ hoạt ảnh: ${r.id}`, "", `**Mức chung: ${r.level.toUpperCase()}** · hệ số cỡ thân ${r.bodyScale} (${r.anchored ? "neo ảnh tĩnh" : "không có ảnh tĩnh, neo trung vị"}).`, "",
    "| Tờ | Cỡ | Loại | Mức | Chặn | Nhẹ | Lưu ý |", "|---|---|---|---|---|---|---|"];
  for (const s of r.sheets) L.push(`| ${s.sheet} | ${s.size.join("×")} | ${s.kind ?? "?"} | ${s.level} | ${n(s, "block")} | ${n(s, "light")} | ${n(s, "note")} |`);
  L.push("", "Mức theo khối hướng: " + DIRS.filter((d) => r.blockLevel[d]).map((d) => `${d} ${r.blockLevel[d]}`).join(" · "), "");
  for (const s of r.sheets) {
    L.push(`## ${s.sheet} — ${s.level}`, "", `Ảnh liên hệ: \`${r.id}-${s.sheet}-lien-he.png\` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/H/D + số khung).`, "");
    if (!s.issues.length) L.push("Không có phát hiện.");
    for (const i of s.issues) L.push(`- **${{ block: "CHẶN", light: "nhẹ", note: "lưu ý" }[i.sev]}** \`${i.code}\` ${i.where}: ${i.msg}`);
    const d = draftErrorLine(s);
    L.push("", d ? ["Dòng nháp cho NGUON.md (soát lại bằng mắt trước khi dán):", "", "```", d, "```"].join("\n") : "Không có dòng `LỖI:` tự sinh.", "");
  }
  L.push("## Việc còn lại cho mắt người", "", "Công cụ không kiểm: `n` / `ne` lộ mặt (kể cả hurt), `se` khác `e` thật sự, hurt lùi đúng hướng (không ngửa bụng / quay mặt), die giữ hướng, nhận diện đúng loài.",
    "Xem từng ảnh liên hệ và bổ sung các điểm này vào dòng `LỖI:`.", "");
  return L.join("\n");
}

/** Ghi JSON + MD + ảnh liên hệ vào `out`; trả về danh sách file. */
export function writeReport(r, out, { images = true } = {}) {
  mkdirSync(out, { recursive: true });
  const files = [];
  const put = (name, data) => { const f = path.join(out, name); writeFileSync(f, data); files.push(f); };
  put(`${r.id}-check.json`, JSON.stringify(toJson(r), null, 2) + "\n");
  put(`${r.id}-check.md`, toMarkdown(r));
  if (images) for (const s of r.sheets) {
    const plan = s.plan ?? { dirs: [], rows: Math.max(1, s.bands.length) };
    const rowLabels = Array.from({ length: plan.rows }, (_, i) => `${(plan.dirs[(i / BAND_ROWS) | 0] ?? "?").toUpperCase()} ${["IDLE+HURT", "WALK", "ATTACK", "DIE"][i % BAND_ROWS]}`);
    put(`${r.id}-${s.sheet}-lien-he.png`, encodePng(contactSheet(s.img, { title: `${r.id} ${s.sheet} ${s.size.join("X")} ${LEVEL_ASCII[s.level]}`, plan, bands: s.bands, rowLabels })));
  }
  return files;
}

// ---------- CLI ----------
function parseArgs(argv) {
  const o = { species: [], images: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") o.out = argv[++i];
    else if (a === "--dir") o.dir = argv[++i];
    else if (a === "--no-image") o.images = false;
    else if (a === "--all") o.all = true;
    else if (a.startsWith("--")) throw new Error(`tùy chọn lạ: ${a}`);
    else o.species.push(a);
  }
  return o;
}
const summary = (r) => `${r.level.padEnd(5)} ${r.id}: ${r.sheets.map((s) => `${s.sheet}=${s.level}(${s.issues.filter((i) => i.sev === "block").length}/${s.issues.filter((i) => i.sev === "light").length})`).join(" ")}`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    if (o.all) o.species = readdirSync(path.join(ROOT, "art", "src", "beast-anim"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
    if (!o.species.length) {
      console.error("Dùng: npm run beast:check -- <loài> [--out <thư mục>] [--dir <thư mục tờ>] [--no-image]   |   npm run beast:check -- --all");
      process.exit(2);
    }
    const base = o.out ?? path.join(os.tmpdir(), "beast-check");
    let blocked = 0;
    for (const id of o.species) {
      const r = checkSpecies(id, o.dir ? { dir: o.dir } : {});
      console.log(summary(r));
      if (r.level === "chặn") blocked++;
      if (!o.all) {
        const files = writeReport(r, o.species.length > 1 ? path.join(base, id) : base, { images: o.images });
        for (const s of r.sheets) { const d = draftErrorLine(s); if (d) console.log(d); }
        console.log(`Đã ghi ${files.length} file vào ${path.dirname(files[0])}`);
      }
    }
    process.exit(blocked ? 1 : 0);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}
