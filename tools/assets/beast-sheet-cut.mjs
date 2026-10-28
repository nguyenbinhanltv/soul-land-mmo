// Cắt tờ hoạt ảnh hồn thú do ChatGPT / Codex vẽ thành sheet game (#688, docs/art/hon-thu-hoat-anh.md).
//   node tools/assets/beast-sheet-cut.mjs --species phong_lang --sheet A=a.png --sheet B=b.png --out <thư mục> [tùy chọn]
//
// Các bước (mỗi tờ theo bố cục sheetPlan của beast-sheet-lib.mjs: lưới cố định, hàng = dải hoạt ảnh, cột = khung):
//   1. Xóa nền (màu khóa mặc định đọc ở góc, thường #FF00FF; hoặc alpha thấp), gỡ 3 lớp viền nhiễm màu nền.
//   (Cỡ tờ theo TỈ LỆ, mặc định chuẩn hóa về đơn vị canonical của sheetPlan theo diện tích: B 1254×1254 và A 948×1659 / 941×1672 hợp lệ; --no-normalize-size để tắt.)
//   2. Tách hình theo thành phần liên thông; mỗi thành phần về ô lưới chứa trọng tâm của nó (hình dính nhiều ô thì chia theo ô);
//      mảnh vụn nhỏ hoặc xa thân bị bỏ (đếm trong báo cáo), mảnh nhỏ sát thân gộp vào thân.
//   3. Mỗi khung: chân = đáy hộp bao, tâm chân ngang = trung bình x của các hàng đáy; MỘT hệ số thu chung cho cả loài
//      (khớp cỡ ảnh tĩnh hiện có nếu có, không thì --fill); đặt chân vào gốc (giữa, cách đáy ISO_BEAST_FOOT).
//   4. Lượng tử về bảng màu (auto: median cut --colors, hoặc --palette gpl|<file.gpl>), thu về lưới pixel bằng bỏ phiếu màu
//      nhiều nhất (không nội suy), viền ngoài #1a1020.
//   5. Cảnh báo: thiếu khung, hình ở ô trống, khung lệch cỡ / chân / vượt khung, hình dính, mảnh rời lớn bị bỏ.
//   6. Ghi <out>/<loài>_anim.png (sheet game, 6 cột × 20 hàng: hướng × dải), <out>/manifest-entry.json, <out>/_report.json.
// Không ghi vào shared/assets: orchestrator duyệt trang xem trước (beast-sheet-preview.mjs) rồi mới chép và nối client.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Img, readPng, encodePng, readGpl, hex, toHex, OUTLINE, ISO_BEAST_FOOT } from "./lib.mjs";
import { DIRS, ANIMS, COLS, BAND_ROWS, animSlot, sheetPlan, sheetCells, speciesInfo, sheetFits, canonFactor, mixedPlan } from "./beast-sheet-lib.mjs";
import { layoutFor, parsePatch, applyPatches, staticAnchors, blockFactors, equalizeBlocks, levelOf, codeOf, summarize } from "./beast-sheet-cut-lib.mjs";

const K_OUT = hex(OUTLINE);
export const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
export const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };

// ---------- Nền ----------
/** Màu khóa: màu nhiều phiếu nhất ở 4 góc (ảnh có alpha thấp ở góc thì không cần khóa). */
function keyOf(img) {
  const votes = new Map();
  for (const [x, y] of [[0, 0], [img.w - 1, 0], [0, img.h - 1], [img.w - 1, img.h - 1]]) {
    const p = img.get(x, y);
    if (p[3] >= 128) { const k = p.slice(0, 3).join(","); votes.set(k, (votes.get(k) ?? 0) + 1); }
  }
  let best = null, n = 0;
  for (const [k, v] of votes) if (v > n) { n = v; best = k; }
  return best ? best.split(",").map(Number).concat(255) : null;
}

/** Mặt nạ vật (1 = vật) sau khi bỏ nền và 3 lớp viền nhiễm màu nền (điểm giáp nền, màu nằm giữa vật và nền). */
export function foregroundMask(img, key, tol) {
  const { w, h } = img, m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = img.get(x, y);
    m[y * w + x] = p[3] < 128 || (key && dist2(p, key) <= tol * tol) ? 0 : 1;
  }
  if (key) for (let pass = 0; pass < 3; pass++) {
    const kill = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      const touches = (x > 0 && !m[y * w + x - 1]) || (x < w - 1 && !m[y * w + x + 1]) || (y > 0 && !m[(y - 1) * w + x]) || (y < h - 1 && !m[(y + 1) * w + x]);
      if (!touches) continue;
      const p = img.get(x, y), d = dist2(p, key), tint = p[0] - p[1] > 40 && p[2] - p[1] > 40; // ngả hồng-tím như nền
      if (d <= (tol * 1.9) ** 2 || (tint && d <= (tol * 2.8) ** 2)) kill.push(y * w + x);
    }
    for (const i of kill) m[i] = 0;
  }
  return m;
}

// ---------- Thành phần liên thông ----------
/** Nhãn 8 liên thông: danh sách { px: [chỉ số], area, x0, y0, x1, y1, cx, cy }. */
export function components(mask, w, h) {
  const seen = new Uint8Array(w * h), out = [], stack = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue;
    const c = { px: [], x0: w, y0: h, x1: -1, y1: -1, cx: 0, cy: 0 };
    seen[s] = 1; stack.push(s);
    while (stack.length) {
      const i = stack.pop(), x = i % w, y = (i / w) | 0;
      c.px.push(i); c.cx += x; c.cy += y;
      if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const j = Y * w + X;
        if (mask[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    c.area = c.px.length; c.cx /= c.area; c.cy /= c.area;
    out.push(c);
  }
  return out;
}
const pieceOf = (px, w) => {
  const p = { px, area: px.length, x0: Infinity, y0: Infinity, x1: -1, y1: -1 };
  for (const i of px) { const x = i % w, y = (i / w) | 0; if (x < p.x0) p.x0 = x; if (x > p.x1) p.x1 = x; if (y < p.y0) p.y0 = y; if (y > p.y1) p.y1 = y; }
  return p;
};

/**
 * Gán thành phần về ô lưới rồi gộp trong từng ô: thân = mảnh lớn nhất; mảnh khác ≥ minArea và cách hộp thân ≤ gap thì gộp, còn lại bỏ.
 * @returns {{ pieces: Map<string, object>, dropped: number, droppedBig: object[], stuck: number }}
 */
export function assignToCells(img, sheet, mask, opt) {
  const { w, h } = img, cw = w / sheet.cols, ch = h / sheet.rows;
  const cellOf = opt.layout?.cellOf ?? ((x, y) => ({ col: Math.min(sheet.cols - 1, (x / cw) | 0), row: Math.min(sheet.rows - 1, (y / ch) | 0) }));
  const buckets = new Map(); let stuck = 0;
  const push = (k, p) => { if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(p); };
  for (const c of components(mask, w, h)) {
    if (c.x1 - c.x0 + 1 > cw * 1.5 || c.y1 - c.y0 + 1 > ch * 1.5) {
      stuck++;
      const by = new Map();
      for (const i of c.px) { const { col, row } = cellOf(i % w, (i / w) | 0), k = `${col},${row}`; if (!by.has(k)) by.set(k, []); by.get(k).push(i); }
      for (const [k, px] of by) push(k, pieceOf(px, w));
    } else {
      const { col, row } = cellOf(c.cx, c.cy);
      push(`${col},${row}`, c);
    }
  }
  const unit = opt.unit ?? 1;
  const minArea = Math.max(6, opt.minArea ?? Math.round(cw * unit * ch * unit * 0.0012)) / (unit * unit), gap = opt.gap ?? Math.round(Math.min(cw, ch) * unit * 0.08) / unit;
  const pieces = new Map(); let dropped = 0; const droppedBig = [];
  for (const [k, list] of buckets) {
    list.sort((a, b) => b.area - a.area);
    const main = list[0], keep = [main];
    let box = { x0: main.x0, y0: main.y0, x1: main.x1, y1: main.y1 };
    for (const p of list.slice(1)) {
      const near = p.x0 <= box.x1 + gap && p.x1 >= box.x0 - gap && p.y0 <= box.y1 + gap && p.y1 >= box.y0 - gap;
      if (near && p.area >= minArea) { keep.push(p); box = { x0: Math.min(box.x0, p.x0), y0: Math.min(box.y0, p.y0), x1: Math.max(box.x1, p.x1), y1: Math.max(box.y1, p.y1) }; }
      else { dropped++; if (p.area >= main.area * 0.03) droppedBig.push({ cell: k, area: p.area, of: main.area }); }
    }
    pieces.set(k, { px: keep.flatMap((p) => p.px), box });
  }
  // ô chỉ có đốm vụn (diện tích dưới 10% trung vị các thân) không phải khung vẽ
  const med = median([...pieces.values()].map((p) => p.px.length));
  for (const [k, p] of [...pieces]) if (p.px.length < med * 0.1) { pieces.delete(k); dropped++; }
  return { pieces, dropped, droppedBig, stuck };
}

// ---------- Màu ----------
export function medianCut(pixels, n) {
  const boxes = [pixels];
  while (boxes.length < n) {
    let bi = -1, bs = 0;
    boxes.forEach((b, i) => { if (b.length > 1 && b.length > bs) { bs = b.length; bi = i; } });
    if (bi < 0) break;
    const b = boxes[bi]; let ch = 0, best = -1;
    for (let c = 0; c < 3; c++) { let lo = 255, hi = 0; for (const p of b) { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c]; } if (hi - lo > best) { best = hi - lo; ch = c; } }
    b.sort((p, q) => p[ch] - q[ch]);
    boxes.splice(bi, 1, b.slice(0, b.length >> 1), b.slice(b.length >> 1));
  }
  return boxes.map((b) => [0, 1, 2].map((c) => Math.round(b.reduce((s, p) => s + p[c], 0) / b.length)));
}
export const nearest = (p, pal) => { let bi = 0, bd = Infinity; for (let i = 0; i < pal.length; i++) { const d = dist2(p, pal[i]); if (d < bd) { bd = d; bi = i; } } return bi; };

// ---------- Cắt một loài ----------
/**
 * @param {{ species: string, sheets: Record<string, Img>, frame?: number, key?: number[], tol?: number, colors?: number, palette?: string, fill?: number, scale?: number, minArea?: number, normalizeSize?: boolean (mặc định true) }} o
 * @returns {{ sheet: Img, entry: object, report: object, frames: Map<string, Img> }} frames: khóa `dir/anim/n`
 */
export function cutSpecies(o) {
  const info = speciesInfo(o.species), F = o.frame ?? info.frame;
  if (!F) throw new Error(`loài ${o.species} chưa có khung trong manifest: đặt --frame`);
  // Không ép --layout: bố cục theo từng tờ có mặt (legacy / direction / trộn, hướng ở tờ direction thắng tờ legacy; mixedPlan ở beast-sheet-lib.mjs)
  const dims = Object.fromEntries(Object.entries(o.sheets).map(([id, im]) => [id, { w: im.w, h: im.h }]));
  const plan = o.layout ? sheetPlan(F, o.layout) : mixedPlan(F, dims), warns = [], gapGrid = {}, rep = { species: o.species, frame: F, sheets: {}, scale: 0, dropped: 0 };
  const foot = F - ISO_BEAST_FOOT, tol = o.tol ?? 60, normalize = o.normalizeSize !== false; // mặc định bật (#862)

  // 1–2. Tách hình, gán ô
  const raw = new Map(); // `dir/anim/n` → { img: Img (cắt, alpha 0/255), footX, w, h, cellBottom, cellH }
  for (const sh of plan) {
    const img = sh.absent ? undefined : o.sheets[sh.id];
    if (!img) { warns.push(`thiếu tờ ${sh.id} (${sh.dirs.join(", ")})`); continue; }
    if (normalize && !sheetFits(img.w, img.h, sh)) throw new Error(`tờ ${sh.id}: sai tỉ lệ ${img.w}×${img.h}, cần ${sh.w}×${sh.h}${sh.w * 3 === sh.h * 2 ? " (tờ A nhận tỉ lệ 0,55–0,70, vd Codex 948×1659)" : ""}; không thể chuẩn hóa đồng đều`);
    const factor = normalize ? canonFactor(img.w, img.h, sh.w, sh.h) : 1; // theo diện tích: tờ A 948×1659 ≈ 1,0 (quyết định chủ repo 2026-10-26 mục 2)
    const key = o.key ?? keyOf(img), mask = foregroundMask(img, key, tol);
    const layout = layoutFor(img, sh, o.grid ?? "auto", { ...(o.key ? { key: o.key.slice(0, 3) } : {}), ...(o.tol ? { tol: o.tol } : {}) });
    const { pieces, dropped, droppedBig, stuck } = assignToCells(img, sh, mask, { minArea: o.minArea, unit: factor, layout });
    const patched = applyPatches(pieces, o.patches ?? [], sh.id, new Set(sheetCells(sh).map((c) => `${c.col},${c.row}`)));
    rep.dropped += dropped;
    gapGrid[sh.id] = layout.mode.startsWith("gap");
    for (const n of [...layout.notes.map((x) => `tờ ${sh.id}: ${x}`), ...patched.map((x) => `tờ ${sh.id} --patch: ${x}`)]) warns.push(n);
    for (const b of droppedBig) warns.push(`tờ ${sh.id} ô ${b.cell}: bỏ mảnh rời lớn ${Math.round(b.area * factor * factor)} điểm (thân ${Math.round(b.of * factor * factor)}), kiểm tra ảnh`);
    if (stuck) warns.push(`tờ ${sh.id}: ${stuck} hình dính nhiều ô, đã chia theo ô; nên vẽ lại cho các hình cách xa nhau`);
    const used = new Set();
    if (sh.skip?.length) {
      for (const c of sheetCells(sh)) if (sh.skip.includes(c.dir)) used.add(`${c.col},${c.row}`); // hàng hướng đã có tờ direction: bỏ, không tính ô trống
    }
    rep.sheets[sh.id] = { size: [img.w, img.h], key: key && toHex(key), cells: pieces.size, grid: layout.mode, ...(sh.skip?.length ? { dirsUsed: sh.dirs.filter((d) => !sh.skip.includes(d)), dirsOverridden: sh.skip } : {}) };
    if (patched.length) rep.sheets[sh.id].patches = patched;
    if (normalize) Object.assign(rep.sheets[sh.id], { originalSize: [img.w, img.h], expectedSize: [sh.w, sh.h], factor, normalizedMode: "canonical-units" });
    for (const c of sheetCells(sh).filter((x) => !sh.skip?.includes(x.dir))) {
      const k = `${c.col},${c.row}`, p = pieces.get(k), name = `${c.dir}/${c.anim}/${c.frame}`;
      used.add(k);
      if (!p) { warns.push(`THIẾU khung ${name} (tờ ${sh.id} cột ${c.col} hàng ${c.row})`); continue; }
      const { x0, y0, x1, y1 } = p.box, fw = x1 - x0 + 1, fh = y1 - y0 + 1, im = new Img(fw, fh);
      for (const i of p.px) im.set((i % img.w) - x0, ((i / img.w) | 0) - y0, img.get(i % img.w, (i / img.w) | 0));
      const lowRows = Math.max(1, Math.round(fh * 0.08)); let sx = 0, n = 0;
      for (let y = fh - lowRows; y < fh; y++) for (let x = 0; x < fw; x++) if (im.alpha(x, y)) { sx += x; n++; }
      const r = layout.rect(c.col, c.row);
      if (normalize) {
        if (x0 < Math.floor(r.x0) || y0 < Math.floor(r.y0) || x1 >= Math.ceil(r.x1) || y1 >= Math.ceil(r.y1)) warns.push(`khung ${name}: hình vượt ô tờ ${sh.id}, kiểm tra lưới; chuẩn hóa không sửa bố cục${layout.fallbackRows?.includes(c.row) ? " (dải dự phòng lưới đều)" : ""}`);
        if (x0 === 0 || y0 === 0 || x1 === img.w - 1 || y1 === img.h - 1) warns.push(`khung ${name}: chạm mép ảnh nguồn tờ ${sh.id} (có thể đã bị cắt)`);
      }
      // Hình nguồn giữ pixel RAW; mọi phép đo trước common scale dùng đơn vị canonical của tờ.
      raw.set(name, { img: im, factor, w: fw * factor, h: fh * factor, area: p.px.length * factor * factor, footX: (n ? sx / n : fw / 2) * factor, bottom: (y1 + 1 - r.y0) * factor, cellH: r.h * factor, anim: c.anim, dir: c.dir });
    }
    for (const k of pieces.keys()) if (!used.has(k)) warns.push(`tờ ${sh.id}: có hình ở ô trống ${k} (bỏ qua)`);
  }

  // Khung lệch: so với trung vị cùng dải hoạt ảnh và cùng hướng
  for (const dir of DIRS) for (const [anim, n] of ANIMS) {
    const fr = [...Array(n).keys()].map((f) => ({ f, r: raw.get(`${dir}/${anim}/${f}`) })).filter((x) => x.r);
    if (fr.length < 2) continue;
    const mh = median(fr.map((x) => x.r.h)), mw = median(fr.map((x) => x.r.w)), ma = median(fr.map((x) => x.r.area));
    for (const { f, r } of fr) {
      const area = r.area, why = [];
      if (area > ma * 1.7 || area < ma / 1.7) why.push(`diện tích ${Math.round((area / ma) * 100)}% trung vị`);
      if (anim !== "attack" && anim !== "die" && (r.h > mh * 1.35 || r.h < mh / 1.35)) why.push(`cao ${r.h} (trung vị ${Math.round(mh)})`);
      if (anim !== "attack" && anim !== "die" && (r.w > mw * 1.5 || r.w < mw / 1.5)) why.push(`rộng ${r.w} (trung vị ${Math.round(mw)})`);
      if (why.length) warns.push(`khung ${dir}/${anim}/${f} lệch: ${why.join(", ")}`);
    }
    const mb = median(fr.map((x) => x.r.bottom / x.r.cellH));
    for (const { f, r } of fr) if (anim !== "attack" && Math.abs(r.bottom / r.cellH - mb) > 0.15) warns.push(`khung ${dir}/${anim}/${f}: chân lệch ${Math.round(Math.abs(r.bottom / r.cellH - mb) * 100)}% chiều cao ô so với các khung cùng hoạt ảnh`);
  }

  // 3. Hệ số thu: MỘT hệ số chung cả loài (hành vi v1), rồi hiệu chỉnh từng khối hướng theo ảnh tĩnh (chỉ khi tự động, #864)
  const idle = [...raw.entries()].filter(([, r]) => r.anim === "idle");
  const all = [...raw.values()];
  if (!all.length) throw new Error("không cắt được khung nào");
  const fitOf = (rs) => Math.min(...rs.map((r) => Math.min((F - 4) / r.w, (foot - 2) / r.h)));
  let scale = o.scale, source = o.scale ? "--scale" : "tự động";
  const ref = info.staticFile && !o.fill ? staticRef(info.staticFile, F) : null;
  if (!scale) {
    if (ref) {
      // khớp cỡ ảnh tĩnh: chiều cao thân đứng khung đông (hoặc nam) của sheet tĩnh bằng chiều cao trung vị khung đứng cùng hướng
      const hs = idle.filter(([k]) => k.startsWith(ref.dir + "/")).map(([, r]) => r.h);
      scale = (hs.length ? ref.h / median(hs) : null);
      if (scale) source = "tự động (khớp ảnh tĩnh)";
    }
    if (!scale) source = "tự động (--fill)";
    scale ??= ((o.fill ?? 0.8) * F) / Math.max(median(idle.map(([, r]) => r.w)), median(idle.map(([, r]) => r.h)));
  }
  const scaleAuto = scale, fit = fitOf(all);
  if (fit < scale) {
    if (fit >= scale * 0.8) scale = fit;
    else warns.push(`một số khung vượt khung ${F}×${F} ở hệ số ${scale.toFixed(3)} (nhỏ nhất vừa: ${fit.toFixed(3)}), bị cắt mép; đề xuất --scale ${(Math.floor(fit * 1000) / 1000).toFixed(3)}`);
  }
  rep.scale = +scale.toFixed(4);
  rep.scaleInfo = { source, auto: +scaleAuto.toFixed(4), used: rep.scale, fit: +fit.toFixed(4), suggested: fit < scale ? Math.floor(fit * 1000) / 1000 : null };
  warns.push(`hệ số thu: ${source} ${scaleAuto.toFixed(3)}, dùng ${scale.toFixed(3)}${scale < scaleAuto ? " (hạ cho vừa khung)" : ""}; vừa khung tối đa ${fit.toFixed(3)}`);

  const dirScale = Object.fromEntries(DIRS.map((d) => [d, scale]));
  const anchors = !o.scale && o.anchorBlocks !== false && info.staticFile && !o.fill ? staticAnchors(info.staticFile, F) : null;
  if (anchors) {
    const idleH = Object.fromEntries(DIRS.map((d) => [d, idle.filter(([, r]) => r.dir === d).map(([, r]) => r.h)]));
    const bf = blockFactors(idleH, anchors, scale, o.blockTol);
    rep.blocks = {};
    for (const [dir, b] of Object.entries(bf)) {
      let sd = scale * b.factor;
      if (b.factor !== 1) {
        const f = fitOf(all.filter((r) => r.dir === dir));
        if (f < sd) { if (f >= sd * 0.8) sd = f; else warns.push(`khối ${dir}: hệ số ${sd.toFixed(3)} làm khung vượt khung ${F}×${F} (vừa tối đa ${f.toFixed(3)}), bị cắt mép`); }
        warns.push(`khối ${dir}: cao thân ${(b.ratio * 100).toFixed(0)}% so với ảnh tĩnh ở hệ số chung, hiệu chỉnh ×${(sd / scale).toFixed(3)} → ${sd.toFixed(3)}`);
      }
      dirScale[dir] = sd;
      rep.blocks[dir] = { bodyH: +b.bodyH.toFixed(1), anchor: +b.anchor.toFixed(1), ratioShared: +b.ratio.toFixed(3), scale: +sd.toFixed(4), ratioAfter: +((sd * b.bodyH) / b.anchor).toFixed(3) };
    }
  }

  // 3b. Chuẩn hóa cỡ giữa 5 khối hướng theo trung vị cao idle (#1085); đặt tay --scale / --fill thì không đụng (giữ byte #870)
  if (!o.scale && !o.fill && o.equalizeBlocks !== false) {
    const bodyH = (d) => median(idle.filter(([, r]) => r.dir === d).map(([, r]) => r.h));
    const heights = Object.fromEntries(DIRS.map((d) => [d, dirScale[d] * (bodyH(d) || 0)]));
    const eq = equalizeBlocks(heights, o.blockSpread);
    rep.equalize = { before: +(eq.spread ?? 0).toFixed(3), active: eq.active, target: +eq.target.toFixed(1), heightsBefore: Object.fromEntries(Object.entries(heights).map(([d, h]) => [d, +h.toFixed(1)])), factors: {}, after: null };
    if (eq.active) {
      for (const d of DIRS) {
        const k = eq.factors[d];
        if (!k || k === 1) continue;
        let sd = dirScale[d] * k;
        const f = fitOf(all.filter((r) => r.dir === d));
        if (f < sd) { if (f >= sd * 0.8) sd = f; else warns.push(`khối ${d}: hệ số ${sd.toFixed(3)} làm khung vượt khung ${F}×${F} (vừa tối đa ${f.toFixed(3)}), bị cắt mép`); }
        warns.push(`khối ${d}: cao idle ${heights[d].toFixed(1)} so với trung vị 5 hướng ${eq.target.toFixed(1)}, chuẩn hóa ×${(sd / dirScale[d]).toFixed(3)} → ${sd.toFixed(3)}`);
        rep.equalize.factors[d] = +(sd / dirScale[d]).toFixed(3);
        dirScale[d] = sd;
        if (rep.blocks?.[d]) rep.blocks[d].scale = +sd.toFixed(4);
      }
      const after = DIRS.map((d) => dirScale[d] * (bodyH(d) || 0)).filter(Boolean);
      rep.equalize.after = +(Math.max(...after) / Math.min(...after)).toFixed(3);
    }
  }

  // 4. Bảng màu
  const samples = [];
  // lấy thưa để median cut vẫn nhanh với khung lớn (boss 192: hàng triệu điểm vật)
  const total = all.reduce((t, r) => t + r.w * r.h, 0), stride = Math.max(3, Math.ceil(total / 60000));
  for (const r of all) for (let i = 0, n = 0; i < r.img.data.length; i += 4) if (r.img.data[i + 3] && ++n % stride === 0) samples.push([r.img.data[i], r.img.data[i + 1], r.img.data[i + 2]]);
  const pal = o.palette && o.palette !== "auto"
    ? (o.palette === "gpl" ? readGpl() : readGpl(o.palette)).map(hex)
    : medianCut(samples, o.colors ?? 24);
  rep.palette = pal.length;

  const frames = new Map(), q = [];
  for (const [name, r] of raw) {
    const pw = r.img.w, ph = r.img.h, scale = dirScale[r.dir], sourceScale = scale * r.factor, idx = new Int16Array(pw * ph).fill(-1);
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) if (r.img.alpha(x, y)) idx[y * pw + x] = nearest(r.img.get(x, y), pal);
    const out = new Img(F, F), sw = r.w * scale, y0 = Math.round(foot - r.h * scale);
    // chân về giữa khung; hình lệch ra mép (đòn lao, ngã) thì dời vào trong cho còn chỗ viền, báo nếu phải dời xa
    let x0 = Math.round(F / 2 - r.footX * scale); const want = x0;
    x0 = Math.max(2, Math.min(F - 2 - Math.ceil(sw), x0));
    if (Math.abs(x0 - want) > F * 0.06) warns.push(`khung ${name}: dời ngang ${Math.abs(x0 - want)} điểm để vừa khung (chân lệch tâm nhiều)`);
    // bỏ phiếu: mỗi điểm đích lấy 4×4 mẫu trong vùng nguồn tương ứng, vật nếu ≥ nửa mẫu là vật, màu nhiều phiếu nhất
    for (let v = 0; v < F; v++) for (let u = 0; u < F; u++) {
      const votes = new Map(); let opaque = 0;
      for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
        const X = Math.floor((u - x0 + (sx + 0.5) / 4) / sourceScale), Y = Math.floor((v - y0 + (sy + 0.5) / 4) / sourceScale);
        if (X < 0 || Y < 0 || X >= pw || Y >= ph) continue;
        const c = idx[Y * pw + X];
        if (c >= 0) { opaque++; votes.set(c, (votes.get(c) ?? 0) + 1); }
      }
      if (opaque < 8) continue;
      let bc = -1, bv = 0; for (const [c, n] of votes) if (n > bv) { bv = n; bc = c; }
      out.set(u, v, [...pal[bc], 255]);
    }
    if (clippedEdge(out)) warns.push(`khung ${name} chạm mép khung ${F}×${F} (có thể bị cắt)`);
    frames.set(name, out); q.push(out);
  }

  // Viền ngoài: nếu viền hình vốn tối thì chỉ tô lại, không thì thêm một vòng ngoài
  let dark = 0, edge = 0;
  for (const im of q) forEdge(im, (x, y) => { edge++; const p = im.get(x, y); if (p[0] * 0.3 + p[1] * 0.59 + p[2] * 0.11 < 60) dark++; });
  const recolor = edge > 0 && dark / edge >= 0.6;
  rep.outline = recolor ? "tô lại viền tối sẵn có" : "thêm vòng viền ngoài";
  for (const im of q) {
    if (recolor) { const e = []; forEdge(im, (x, y) => e.push([x, y])); for (const [x, y] of e) im.set(x, y, [...K_OUT, 255]); }
    else { const e = []; for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) if (!im.alpha(x, y) && touchesOpaque(im, x, y)) e.push([x, y]); for (const [x, y] of e) im.set(x, y, [...K_OUT, 255]); }
  }

  // 6. Sheet game: 6 cột × (5 hướng × 4 dải) hàng
  const sheet = new Img(COLS * F, DIRS.length * BAND_ROWS * F);
  for (const [name, im] of frames) {
    const [dir, anim, n] = name.split("/"), { band, col } = animSlot(anim);
    sheet.blit(im, 0, 0, F, F, (col + +n) * F, (DIRS.indexOf(dir) * BAND_ROWS + band) * F);
  }
  const anims = Object.fromEntries(ANIMS.map(([a, n]) => [a, { band: animSlot(a).band, col: animSlot(a).col, n }]));
  const entry = { key: `beast_${o.species}_anim`, frame: [F, F], iso: true, anim: { dirs: DIRS, cols: COLS, rowsPerDir: BAND_ROWS, anims, origin: [F >> 1, foot] } };
  rep.warnings = warns;
  rep.issues = warns.map((msg) => ({ level: levelOf(msg, { gapGrid: gapGrid[/tờ ([A-E])/.exec(msg)?.[1]] ?? false }), code: codeOf(msg), msg }));
  rep.summary = summarize(rep.issues);
  rep.frames = frames.size; rep.missing = warns.filter((w) => w.startsWith("THIẾU")).length;
  return { sheet, entry, report: rep, frames };
}

function staticRef(file, F) {
  const st = readPng(file), fw = st.h, cols = Math.round(st.w / st.h);
  const col = cols >= 2 ? 1 : 0; // khung đông; sheet tĩnh = nam, đông, bắc
  let y0 = Infinity, y1 = -1;
  for (let y = 0; y < st.h; y++) for (let x = 0; x < fw; x++) if (st.alpha(col * fw + x, y)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return y1 < 0 ? null : { dir: "e", h: (y1 - y0 + 1) * (F / fw) };
}
function forEdge(im, fn) {
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    if (!im.alpha(x, y)) continue;
    if (x === 0 || y === 0 || x === im.w - 1 || y === im.h - 1 || !im.alpha(x - 1, y) || !im.alpha(x + 1, y) || !im.alpha(x, y - 1) || !im.alpha(x, y + 1)) fn(x, y);
  }
}
function touchesOpaque(im, x, y) { return (x > 0 && im.alpha(x - 1, y)) || (x < im.w - 1 && im.alpha(x + 1, y)) || (y > 0 && im.alpha(x, y - 1)) || (y < im.h - 1 && im.alpha(x, y + 1)); }
function clippedEdge(im) {
  for (let i = 0; i < im.w; i++) if (im.alpha(i, 0) || im.alpha(i, im.h - 1) || im.alpha(0, i) || im.alpha(im.w - 1, i)) return true;
  return false;
}

/** In tóm tắt phân mức: block / warn từng dòng (tối đa `cap` mỗi mức, dòng cùng mã gộp đếm), info chỉ đếm theo mã (--verbose in hết). */
export function formatSummary(rep, verbose = false, cap = 8) {
  const s = rep.summary, lines = [`  Cảnh báo: ${s.block} block · ${s.warn} warn · ${s.info} info (tổng ${s.total}); lưới: ${Object.entries(rep.sheets).map(([id, x]) => `${id}=${x.grid}`).join(", ")}`];
  const si = rep.scaleInfo;
  if (si) lines.push(`  Hệ số thu: tự động ${si.auto} (${si.source}) · dùng ${si.used} · vừa khung tối đa ${si.fit}${si.suggested ? ` · ĐỀ XUẤT --scale ${si.suggested}` : ""}`);
  if (rep.blocks) lines.push(`  Khối hướng so với ảnh tĩnh (cao thân chung → sau hiệu chỉnh): ${Object.entries(rep.blocks).map(([d, b]) => `${d} ${b.ratioShared}→${b.ratioAfter}`).join(", ")}`);
  for (const level of ["block", "warn"]) {
    const list = rep.issues.filter((i) => i.level === level), shown = verbose ? list : list.slice(0, cap);
    for (const i of shown) lines.push(`  [${level}] ${i.msg}`);
    if (list.length > shown.length) lines.push(`  [${level}] … và ${list.length - shown.length} dòng nữa (xem _report.json)`);
  }
  if (!verbose && s.info) lines.push(`  info: ${Object.entries(rep.issues.filter((i) => i.level === "info").reduce((m, i) => ({ ...m, [i.code]: (m[i.code] ?? 0) + 1 }), {})).map(([c, n]) => `${c}×${n}`).join(", ")} (--verbose để in hết)`);
  if (verbose) for (const i of rep.issues.filter((x) => x.level === "info")) lines.push(`  [info] ${i.msg}`);
  return lines.join("\n");
}

// ---------- CLI ----------
function parseArgs(argv) {
  const o = { sheets: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], next = () => argv[++i];
    if (a === "--species") o.species = next();
    else if (a === "--sheet") { const [id, f] = next().split("="); o.sheets[id] = f; }
    else if (a === "--out") o.out = next();
    else if (a === "--frame") o.frame = +next();
    else if (a === "--key") o.key = hex(next());
    else if (a === "--tol") o.tol = +next();
    else if (a === "--colors") o.colors = +next();
    else if (a === "--palette") o.palette = next();
    else if (a === "--fill") o.fill = +next();
    else if (a === "--scale") o.scale = +next();
    else if (a === "--min-area") o.minArea = +next();
    else if (a === "--normalize-size") o.normalizeSize = true;
    else if (a === "--no-normalize-size") o.normalizeSize = false;
    else if (a === "--grid") o.grid = next();
    else if (a === "--layout") o.layout = next();
    else if (a === "--patch") (o.patches ??= []).push(parsePatch(next()));
    else if (a === "--no-anchor-blocks") o.anchorBlocks = false;
    else if (a === "--block-tol") o.blockTol = +next();
    else if (a === "--no-equalize-blocks") o.equalizeBlocks = false;
    else if (a === "--block-spread") o.blockSpread = +next();
    else if (a === "--strict") o.strict = true;
    else if (a === "--verbose") o.verbose = true;
    else throw new Error(`tùy chọn lạ: ${a}`);
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    if (!o.species || !o.out || !Object.keys(o.sheets).length) {
      console.error("Dùng: node tools/assets/beast-sheet-cut.mjs --species <loài> --sheet A=<ảnh> [--sheet B=<ảnh>] --out <thư mục> [--no-normalize-size] [--frame N] [--colors 24] [--palette auto|gpl|<gpl>] [--fill 0.8 | --scale S] [--key #ff00ff] [--tol 60] [--grid auto|uniform] [--layout auto|direction] [--patch A:c,r=c,r|A:c,r=-]... [--no-anchor-blocks] [--block-tol 0.12] [--no-equalize-blocks] [--block-spread 1.3] [--strict] [--verbose]");
      process.exit(2);
    }
    const hashes = {};
    for (const id of Object.keys(o.sheets)) {
      if (o.normalizeSize !== false) hashes[id] = createHash("sha256").update(readFileSync(o.sheets[id])).digest("hex");
      o.sheets[id] = readPng(o.sheets[id]);
    }
    const res = cutSpecies(o);
    if (o.normalizeSize !== false) for (const [id, hash] of Object.entries(hashes)) if (res.report.sheets[id]) res.report.sheets[id].sourceSha256 = hash;
    mkdirSync(o.out, { recursive: true });
    writeFileSync(path.join(o.out, `${o.species}_anim.png`), encodePng(res.sheet));
    writeFileSync(path.join(o.out, "manifest-entry.json"), JSON.stringify(res.entry, null, 2) + "\n");
    writeFileSync(path.join(o.out, "_report.json"), JSON.stringify(res.report, null, 2) + "\n");
    console.log(`${o.species}: ${res.report.frames} khung, hệ số thu ${res.report.scale}, ${res.report.palette} màu, bỏ ${res.report.dropped} mảnh vụn → ${path.join(o.out, `${o.species}_anim.png`)}`);
    console.warn(formatSummary(res.report, o.verbose));
    if (res.report.missing) { console.error(`${res.report.missing} khung thiếu: vẽ lại tờ đó.`); process.exit(1); }
    if (o.strict && res.report.summary.block) { console.error(`${res.report.summary.block} cảnh báo mức block (--strict).`); process.exit(1); }
  } catch (e) { console.error(e.message); process.exit(2); }
}
