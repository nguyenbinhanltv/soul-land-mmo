// Phần dùng chung của cutter v2 (#864, theo dõi #861): bố cục ô theo khoảng trống, neo cỡ thân từng khối hướng, phân mức cảnh báo, --patch.
// Tách khỏi beast-sheet-cut.mjs để thử riêng được; không đọc / ghi file (trừ staticAnchors đọc ảnh tĩnh).
import { existsSync } from "node:fs";
import { readPng } from "./lib.mjs";
import { sheetCells, cellRect } from "./beast-sheet-lib.mjs";
import { detectGrid } from "./beast-sheet-grid.mjs";
import { median } from "./beast-sheet-stats.mjs";

// ---------- Bố cục ô ----------
/** Lưới đều (hành vi cũ): ô = ảnh chia đều theo cỡ thực. */
export function uniformLayout(sheet, w, h) {
  const cw = w / sheet.cols, ch = h / sheet.rows;
  return {
    mode: "uniform",
    cellOf: (x, y) => ({ col: Math.min(sheet.cols - 1, (x / cw) | 0), row: Math.min(sheet.rows - 1, (y / ch) | 0) }),
    rect: (col, row) => cellRect(sheet, col, row, w, h),
    notes: [],
  };
}

/**
 * Lưới dò theo KHOẢNG TRỐNG (dùng lại detectGrid của beast-sheet-check): ranh hàng = điểm giữa hai dải liền kề, ranh cột = điểm giữa hai hình liền kề.
 * Dải nào có số hình khác số khung thì cột của dải đó chia đều (ghi vào notes); sai số dải hàng thì trả null (dùng lưới đều).
 * @returns {object | null} cùng giao diện uniformLayout, thêm `fallbackRows`
 */
export function gapLayout(img, sheet, detect = {}) {
  const { w, h } = img, grid = detectGrid(img, detect);
  if (grid.bands.length !== sheet.rows) return null;
  const nominalCw = w / sheet.cols, bands = grid.bands, per = Array.from({ length: sheet.rows }, () => 0);
  for (const c of sheetCells(sheet)) per[c.row]++;
  const rowTop = bands.map((b, i) => (i ? (bands[i - 1].y1 + b.y0 + 1) / 2 : 0));
  const rowBot = bands.map((b, i) => (i < bands.length - 1 ? (b.y1 + bands[i + 1].y0 + 1) / 2 : h));
  const fallbackRows = [], colEdges = bands.map((b, r) => {
    if (b.figures.length !== per[r]) { fallbackRows.push(r); return null; }
    const fs = b.figures, e = [0];
    for (let i = 1; i < fs.length; i++) e.push((fs[i - 1].x1 + fs[i].x0 + 1) / 2);
    e.push(Math.min(w, fs[fs.length - 1].x1 + 1 + Math.max(8, nominalCw * 0.1)));
    return e; // e[i]..e[i+1] = cột i
  });
  const rowOf = (y) => { for (let r = 0; r < rowBot.length; r++) if (y < rowBot[r]) return r; return rowBot.length - 1; };
  const colOf = (r, x) => {
    const e = colEdges[r];
    if (!e) return Math.min(sheet.cols - 1, Math.max(0, (x / nominalCw) | 0));
    for (let i = 0; i < e.length - 1; i++) if (x < e[i + 1]) return i;
    return Math.min(sheet.cols - 1, e.length - 1 + Math.floor((x - e[e.length - 1]) / nominalCw));
  };
  return {
    mode: fallbackRows.length ? "gap+uniform-cols" : "gap", fallbackRows,
    cellOf: (x, y) => { const row = rowOf(y); return { col: colOf(row, x), row }; },
    rect: (col, row) => {
      const e = colEdges[row], x0 = e ? (e[col] ?? col * nominalCw) : col * nominalCw, x1 = e ? (e[col + 1] ?? x0 + nominalCw) : (col + 1) * nominalCw;
      return { x0, y0: rowTop[row], x1, y1: rowBot[row], w: x1 - x0, h: rowBot[row] - rowTop[row] };
    },
    notes: fallbackRows.length ? [`dải hàng ${fallbackRows.map((r) => r + 1).join(", ")}: số hình ≠ số khung, cột chia đều`] : [],
  };
}

/** mode: "auto" (gap nếu dò được, không thì đều) | "uniform" | "gap" (như auto). */
export function layoutFor(img, sheet, mode = "auto", detect = {}) {
  if (mode !== "auto" && mode !== "uniform" && mode !== "gap") throw new Error(`--grid chỉ nhận auto | uniform, không phải: ${mode}`);
  const u = uniformLayout(sheet, img.w, img.h);
  if (mode === "uniform") return u;
  const g = gapLayout(img, sheet, detect);
  if (g) return g;
  u.mode = "uniform (dự phòng: không dò được số dải hàng)";
  u.notes.push("không dò được đúng số dải hàng theo khoảng trống, dùng lưới đều");
  return u;
}

// ---------- --patch ----------
/** "A:5,3=4,3" (dời hình đang ở ô cột 5 hàng 3 sang cột 4 hàng 3; cột / hàng đếm từ 0) hoặc "A:5,3=-" (bỏ hình đó). */
export function parsePatch(spec) {
  const m = /^([A-E]):(\d+),(\d+)=(?:(\d+),(\d+)|-)$/.exec(spec);
  if (!m) throw new Error(`--patch sai cú pháp: ${spec} (mẫu A:5,3=4,3 hoặc A:5,3=-)`);
  return { sheet: m[1], from: `${m[2]},${m[3]}`, to: m[4] === undefined ? null : `${m[4]},${m[5]}` };
}
/** Áp các patch của một tờ lên map ô → hình (đồng thời, theo bản gốc). Trả về danh sách mô tả đã áp. */
export function applyPatches(pieces, patches, sheetId, validKeys = null) {
  const mine = patches.filter((p) => p.sheet === sheetId), src = new Map(pieces), done = [], placed = new Set();
  for (const p of mine) {
    if (!src.has(p.from)) { done.push(`ô ${p.from} không có hình, bỏ qua`); continue; }
    pieces.delete(p.from);
  }
  for (const p of mine) {
    if (!src.has(p.from)) continue;
    if (p.to) {
      if (validKeys && !validKeys.has(p.to)) done.push(`ô đích ${p.to} ngoài kế hoạch tờ ${sheetId}, hình sẽ bị bỏ`);
      if (pieces.has(p.to) || placed.has(p.to)) done.push(`ô ${p.to} đã có hình, hình cũ bị thay`);
      pieces.set(p.to, src.get(p.from)); placed.add(p.to);
    }
    done.push(p.to ? `dời hình ô ${p.from} → ${p.to}` : `bỏ hình ô ${p.from}`);
  }
  return done;
}

// ---------- Neo cỡ thân ----------
/** Chiều cao thân (đơn vị khung F) của ảnh tĩnh theo hướng vẽ: s / e / n đo trực tiếp, se = TB(s,e), ne = TB(e,n); null nếu chưa có ảnh tĩnh. */
export function staticAnchors(file, F) {
  if (!file || !existsSync(file)) return null;
  const st = readPng(file), fw = st.h, out = {};
  ["s", "e", "n"].forEach((d, c) => {
    let y0 = Infinity, y1 = -1;
    for (let y = 0; y < fw; y++) for (let x = c * fw; x < (c + 1) * fw; x++) if (st.alpha(x, y)) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
    out[d] = y1 >= 0 ? (y1 - y0 + 1) * (F / fw) : null;
  });
  if (!out.s || !out.e || !out.n) return null;
  return { s: out.s, e: out.e, n: out.n, se: (out.s + out.e) / 2, ne: (out.e + out.n) / 2 };
}

/**
 * Hệ số hiệu chỉnh từng khối hướng: cao thân idle (trung vị) × hệ số chung so với neo ảnh tĩnh; lệch quá `tol` thì kéo về neo (kẹp 0,6–1,6).
 * `se` / `ne` chỉ có neo nội suy (không phải ảnh vẽ thật) nên dùng ngưỡng rộng hơn `tolInterp`.
 * @returns {Record<string, { bodyH: number, anchor: number, ratio: number, factor: number }>}
 */
export function blockFactors(idleHeightsByDir, anchors, scale, tol = 0.12, tolInterp = 0.2) {
  const out = {};
  for (const [dir, hs] of Object.entries(idleHeightsByDir)) {
    if (!hs.length || !anchors?.[dir]) continue;
    const bodyH = median(hs), ratio = (scale * bodyH) / anchors[dir];
    out[dir] = { bodyH, anchor: anchors[dir], ratio, factor: Math.abs(ratio - 1) > (dir === "se" || dir === "ne" ? Math.max(tol, tolInterp) : tol) ? Math.min(1.6, Math.max(0.6, 1 / ratio)) : 1 };
  }
  return out;
}

// ---------- Phân mức cảnh báo ----------
export const LEVELS = ["info", "warn", "block"];
/** Phân mức một dòng cảnh báo của cutter theo nội dung. block = phải sửa trước khi nhập; warn = nên xem; info = ồn / dự phòng, chỉ đếm. */
export function levelOf(msg, { gapGrid = true } = {}) {
  if (/^THIẾU khung|^thiếu tờ|bị cắt mép$/.test(msg)) return "block";
  if (/vượt khung \d+×\d+/.test(msg)) return "block";
  if (/hình vượt ô/.test(msg)) return gapGrid && !/dải dự phòng/.test(msg) ? "warn" : "info";
  if (/bị thay|ngoài kế hoạch|không có hình, bỏ qua/.test(msg)) return "warn";
  if (/chân lệch (\d+)%/.test(msg)) return +/chân lệch (\d+)%/.exec(msg)[1] >= 30 ? "warn" : "info";
  if (/dời ngang|hệ số|--patch|lưới đều|dải hàng/.test(msg)) return "info";
  return "warn"; // hình dính, mảnh rời lớn, ô trống, khung lệch, chạm mép ảnh nguồn / khung
}
export function summarize(items) {
  const s = { info: 0, warn: 0, block: 0, total: items.length, byCode: {} };
  for (const i of items) { s[i.level]++; s.byCode[i.code] = (s.byCode[i.code] ?? 0) + 1; }
  return s;
}
/** Mã ngắn của một dòng cảnh báo (để gộp khi in). */
export function codeOf(msg) {
  const table = [[/^THIẾU khung/, "thieu-khung"], [/^thiếu tờ/, "thieu-to"], [/vượt khung \d+×\d+/, "vuot-khung-he-so"], [/hình vượt ô/, "vuot-o"],
    [/chạm mép ảnh nguồn/, "cham-mep-nguon"], [/chạm mép khung/, "cham-mep-khung"], [/chân lệch/, "chan-lech"], [/dời ngang/, "doi-ngang"], [/lệch:/, "khung-lech"],
    [/hình dính/, "hinh-dinh"], [/mảnh rời lớn/, "manh-roi"], [/ô trống/, "o-trong"], [/hệ số|--patch|lưới đều/, "ghi-chu"]];
  return table.find(([re]) => re.test(msg))?.[1] ?? "khac";
}
