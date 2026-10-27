// Kiểm tờ UI (khung / nút / ô / thanh / icon / trang trí) trước khi cắt, theo cách beast-sheet-check (#879, theo dõi #877; docs/art/ui-kit.md "Công cụ tờ UI").
//   npm run ui:check -- <tờ.png> [--kind F|N|O|T|I|D|BOARD] [--out <thư mục>] [--no-image] [--div N] [--palette <file.gpl>]
// Loại tờ suy từ tên file (`toF.png`, `N-2.png`…) hoặc --kind; spec (tỉ lệ, bố cục, số mảnh, trạng thái) ở art/src/ui-kit/ui-kit.json.
// Chỉ đọc tờ RAW. Kiểm: tỉ lệ / cỡ ∈ tập Codex, khoá nền #FF00FF (dung sai) + viền ám hồng sau cắt, số mảnh / dải (dò lưới theo khoảng trống,
// TÁI DÙNG beast-sheet-grid), mảnh chạm mép / sát nhau, đủ trạng thái, độ dày viền lệch, cạnh phẳng khi kéo ×3, đối xứng góc, số màu / màu ngoài bảng,
// chữ lạc (chỉ cảnh báo), vạch 9-slice đề xuất. Ghi <out>/<tờ>-ui-check.json + .md + tờ liên hệ có nhãn + dòng `LỖI:` nháp.
// Mức: pass / nhẹ / chặn (thoát mã 1 khi có chặn). Chữ đọc được trong ảnh, hoa văn dọc cạnh, hai góc khác hẳn: công cụ chỉ gợi ý, mắt người quyết.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, encodePng, Img, readGpl, hex } from "./lib.mjs";
import { BG_LOCK, BG_TOL } from "./beast-sheet-check.mjs";
import { drawText, fillRect, strokeRect, COLORS } from "./beast-sheet-contact.mjs";
import {
  loadKit, kindFromName, expandKind, classifyUiShape, effectiveDiv, detectGrid, sheetMask, cropPiece, pickLayout, assignNames, areaDown, evenSize,
  suggestNine, nineSliceRender, edgeFlatness, cornerAsymmetry, strayText, pieceDiff, pinkFringe, significantColors, cdist, colorAt, opaque, defringe, flattenEdges,
} from "./ui-kit-lib.mjs";

// ---------- Ngưỡng ----------
export const PINK_BLOCK = 0.03, PINK_LIGHT = 0.01;
export const FLAT_BLOCK = 0.35, FLAT_LIGHT = 0.15;
export const SYM_LIGHT = 0.2;
export const COLORS_LIGHT = 32, COLORS_BLOCK = 40;
export const OFF_PALETTE_LIGHT = 0.1, OFF_PALETTE_BLOCK = 0.35, OFF_PALETTE_DIST = 40;
export const GAP_FRAC = 0.05;
export const THICK_SPREAD = 2;
export const SAME_STATE_DIFF = 0.005;
/** Cắt mềm (--soft): chỉ hạ CHẶN → nhẹ khi xử lý xong mà đạt kiểm hình; quá các ngưỡng này là lỗi thật, vẫn CHẶN, phải vẽ lại. */
export const SOFT_PINK_LEFT = PINK_LIGHT, SOFT_LOSS_MAX = 0.05, SOFT_FLAT_MAX = 0.6, SOFT_FLAT_CHANGE_MAX = 0.08;
export const STRETCH_SIZES = [[200, 60], [360, 120], [520, 320]];
const LEVEL_RANK = { pass: 0, "nhẹ": 1, "chặn": 2 };
const SEV_LEVEL = { block: "chặn", light: "nhẹ", note: "pass", warn: "pass" };
const LEVEL_ASCII = { pass: "PASS", "nhẹ": "NHE", "chặn": "CHAN" };
const maxLevel = (a, b) => (LEVEL_RANK[b] > LEVEL_RANK[a] ? b : a);
const round = (x, n = 3) => Math.round(x * 10 ** n) / 10 ** n;
const issue = (list, sev, code, where, msg, extra = {}) => list.push({ sev, code, where, msg, ...extra });
const finish = (res) => { res.level = res.issues.reduce((l, i) => maxLevel(l, SEV_LEVEL[i.sev]), "pass"); return res; };

/**
 * Phân tích một tờ.
 * @param {string|Img} src đường dẫn PNG hoặc ảnh đã đọc (khi đó cần o.name)
 * @param {{ kit?: object, kindId?: string, kind?: object, div?: number, palette?: number[][], name?: string, soft?: boolean }} o
 *   soft: bù viền hồng + ép cạnh phẳng trước khi đo; mục chặn tương ứng chỉ hạ xuống nhẹ khi đạt kiểm hình (SOFT_*), còn lại giữ chặn.
 */
export function analyzeUiSheet(src, o = {}) {
  const kit = o.kit ?? loadKit(), img = typeof src === "string" ? readPng(src) : src, name = o.name ?? path.basename(String(src), ".png");
  const kindId = o.kindId ?? kindFromName(name);
  if (!o.kind && !kindId) throw new Error(`không suy ra loại tờ từ tên "${name}": dùng --kind ${Object.keys(kit.kinds).join("|")}`);
  const kind = o.kind ?? expandKind(kit, kindId), issues = [];
  const res = { sheet: name, kind: kind.id, size: [img.w, img.h], issues, pieces: [], img, grid: null, kindSpec: kind };

  const cls = classifyUiShape(kit, img.w, img.h);
  if (!cls) {
    issue(issues, "block", "kich-thuoc", "toàn tờ", `${img.w}×${img.h} không đúng tỉ lệ nào trong tập Codex (${Object.keys(kit.shapes).join(", ")}).`);
    return finish(res);
  }
  if (kind.shapes && !kind.shapes.includes(cls.id)) {
    issue(issues, "block", "kich-thuoc", "toàn tờ", `tờ ${kind.id} (${kind.title}) cần tỉ lệ ${kind.shapes.join(" hoặc ")}, tờ này ${cls.id} (${img.w}×${img.h}).`);
    return finish(res);
  }
  res.shape = cls.id;
  if (!cls.exact) issue(issues, "light", "kich-thuoc", "toàn tờ", `cỡ ${img.w}×${img.h} đúng tỉ lệ ${cls.id} nhưng ngoài danh sách (${cls.sizes.map((s) => s.join("×")).join(", ")}); cutter chuẩn hoá được (hệ số ${round(cls.canon[0] / img.w, 4)}).`);
  else if (img.w !== cls.canon[0]) issue(issues, "note", "kich-thuoc", "toàn tờ", `${img.w}×${img.h} hợp lệ; hệ số chuẩn hoá ${round(cls.canon[0] / img.w, 4)}.`);
  if (kind.board) {
    issue(issues, "note", "board", "toàn tờ", "BOARD chỉ để duyệt và làm ảnh tham chiếu, không cắt; công cụ chỉ kiểm cỡ. Chữ / ký tự trong ảnh (luật vẽ 1) soát bằng mắt.");
    return finish(res);
  }

  // ----- nền -----
  const grid = detectGrid(img);
  res.grid = grid;
  const corners = [[0, 0], [img.w - 1, 0], [0, img.h - 1], [img.w - 1, img.h - 1]].map(([x, y]) => img.get(x, y).slice(0, 3));
  const keyDev = cdist(grid.key, BG_LOCK), cornerDev = Math.max(...corners.map((c) => cdist(c, grid.key)));
  res.background = { key: grid.key, keyDistFromLock: keyDev, cornerSpread: cornerDev };
  if (keyDev > BG_TOL) { issue(issues, "block", "nen", "toàn tờ", `màu nền (${grid.key.join(",")}) cách #FF00FF ${keyDev} > ${BG_TOL} (dung sai khoá).`); return finish(res); }
  if (cornerDev > BG_TOL) { issue(issues, "block", "nen", "toàn tờ", `bốn góc lệch màu nền chính ${cornerDev} > ${BG_TOL}: cutter không khoá được nền.`); return finish(res); }
  if (cornerDev > 30) issue(issues, "note", "nen", "toàn tờ", `nền dốc nhẹ (bốn góc lệch ${cornerDev}), trong dung sai ${BG_TOL}; không phải lỗi.`);

  // ----- dải / số mảnh -----
  const layouts = kind.layouts, want = layouts.map((l) => l.join("+")).join(" hoặc ");
  const layout = pickLayout(kind, grid);
  if (!layout) {
    issue(issues, "block", "luoi", "toàn tờ", `dò được ${grid.bands.length} dải hàng, cần bố cục ${want} (mảnh dính nhau theo hàng hoặc vỡ): không dò được dải.`);
    res.bands = grid.bands.map((b) => ({ ...b, state: "bad", figures: b.figures.map((f) => ({ ...f, state: "bad" })) }));
    return finish(res);
  }
  const named = assignNames(kind, layout, grid, o.names), nameOf = new Map(named.map((p) => [p.fig, p]));
  const total = layout.reduce((a, b) => a + b, 0), missing = [];
  let countBad = false;
  res.bands = grid.bands.map((b, row) => {
    const band = { ...b, row, state: "ok", figures: b.figures.map((f) => ({ ...f })) };
    if (b.figures.length !== layout[row]) {
      countBad = true;
      const stuck = b.figures.some((f) => f.w > 1.5 * grid.medianFigW) && b.figures.length < layout[row];
      const why = b.figures.length < layout[row] ? (stuck ? "mảnh dính nhau" : "thiếu mảnh") : "thừa mảnh rời";
      issue(issues, "block", stuck ? "hinh-dinh" : "so-hinh", `dải ${row + 1}`, `có ${b.figures.length} mảnh, cần ${layout[row]}: ${why}.`);
      band.state = "bad"; band.figures.forEach((f) => { f.state = "bad"; });
      const first = layout.slice(0, row).reduce((a, c) => a + c, 0);
      for (let c = b.figures.length; c < layout[row]; c++) missing.push(kind.pieces[first + c]);
    }
    return band;
  });
  if (countBad) {
    const lost = missing.filter((p) => p?.state);
    if (lost.length) issue(issues, "block", "trang-thai", "toàn tờ", `thiếu trạng thái: ${lost.map((p) => `${p.name}`).join(", ")}.`);
    return finish(res);
  }
  if (grid.bands.flatMap((b) => b.figures).length !== total) return finish(res);

  // ----- mảnh chạm mép / sát nhau -----
  const edge = (f) => f.x0 <= 1 || f.x1 >= img.w - 2 || f.y0 <= 1 || f.y1 >= img.h - 2, gapMin = GAP_FRAC * Math.min(img.w, img.h);
  const tooClose = new Set();
  res.bands.forEach((b) => {
    b.figures.forEach((f, i) => {
      const p = nameOf.get(grid.bands[b.row].figures[i]);
      if (edge(f)) { issue(issues, "light", "cham-mep", p.name, `${p.name} chạm mép tờ (có thể bị cắt).`, { piece: p.name }); f.state = "warn"; }
      const nx = b.figures[i + 1];
      if (nx && nx.x0 - f.x1 - 1 < gapMin) { tooClose.add(p.name); tooClose.add(nameOf.get(grid.bands[b.row].figures[i + 1]).name); }
    });
    const nb = res.bands[b.row + 1];
    if (nb && nb.y0 - b.y1 - 1 < gapMin) for (const f of [...b.figures, ...nb.figures]) f.state = f.state === "bad" ? "bad" : "warn";
  });
  if (tooClose.size) issue(issues, "light", "khoang-cach", [...tooClose].join(", "), `mảnh cách nhau < ${round(GAP_FRAC * 100, 0)}% cạnh tờ (${Math.round(gapMin)} px): dễ dính khi tách.`);

  // ----- cắt thử + đo -----
  const key = grid.key, mask = sheetMask(img, key), div = effectiveDiv(kind, img, cls, o.div);
  res.div = div;
  const masters = [];
  let edgePink = 0, edgeAll = 0, rawPink = 0, rawAll = 0;
  const soft = o.soft ? { fringeFixed: 0, lossy: [] } : null, ink = hex(kit.outline);
  for (const p of named) {
    let crop = cropPiece(img, mask, p.fig);
    if (!crop) { issue(issues, "block", "so-hinh", p.name, `${p.name}: không có điểm vật sau khi khoá nền.`, { piece: p.name }); continue; }
    const raw = pinkFringe(crop.img);
    rawPink += raw.pink; rawAll += raw.edge;
    let fixed = null;
    if (soft && raw.pink) {
      fixed = defringe(crop.img, ink);
      soft.fringeFixed += fixed.recolored + fixed.removed;
      const area = crop.img.data.reduce((t, v, i) => (i % 4 === 3 && v >= 128 ? t + 1 : t), 0);
      if (fixed.removed > SOFT_LOSS_MAX * area) soft.lossy.push(`${p.name} (mất ${round((fixed.removed / area) * 100, 1)}% điểm)`);
      crop = { ...crop, img: fixed.img };
    }
    const master = evenSize(areaDown(crop.img, div)), fr = pinkFringe(crop.img);
    edgePink += fr.pink; edgeAll += fr.edge;
    const rec = { ...p, master, rawSize: [crop.img.w, crop.img.h], size: [master.w, master.h], fringe: fr.edge ? round(fr.pink / fr.edge) : 0 };
    if (fixed) rec.defringe = { recolored: fixed.recolored, removed: fixed.removed };
    if (p.stretch) {
      const s = suggestNine(master);
      Object.assign(rec, { nine: s.nine, thickness: s.thickness, cornerExt: s.cornerExt });
      const flatOf = (m) => [edgeFlatness(m, s.nine, s.thickness), edgeFlatness(nineSliceRender(m, s.nine, m.w * 3, m.h * 3), s.nine, s.thickness)];
      [rec.flat, rec.flat3] = flatOf(master);
      const worst = Math.max(rec.flat ?? 0, rec.flat3 ?? 0);
      if (soft && worst > FLAT_BLOCK && worst <= SOFT_FLAT_MAX) {
        const fx = flattenEdges(master, s.nine, s.thickness), [f1, f3] = flatOf(fx.img);
        const area = master.data.reduce((t, v, i) => (i % 4 === 3 && v >= 128 ? t + 1 : t), 0);
        if (Math.max(f1 ?? 0, f3 ?? 0) <= FLAT_LIGHT && fx.changed <= SOFT_FLAT_CHANGE_MAX * area) {
          Object.assign(rec, { master: fx.img, flat: f1, flat3: f3, softFlat: { before: worst, changed: fx.changed } });
        }
      }
      rec.asym = cornerAsymmetry(rec.master, s.nine);
      rec.stretch = STRETCH_SIZES.map(([w, h]) => ({ size: [w, h], ok: w >= 2 * s.nine && h >= 2 * s.nine }));
    }
    if (p.text) rec.text = strayText(master, rec.nine ?? 2);
    masters.push(rec);
  }
  res.pieces = masters;
  const pieceState = (name, st) => { for (const b of res.bands) b.figures.forEach((f, i) => { if (nameOf.get(grid.bands[b.row].figures[i])?.name === name && f.state !== "bad") f.state = st; }); };

  if (soft) res.soft = { fringeBefore: rawAll ? round(rawPink / rawAll) : 0, fringeAfter: edgeAll ? round(edgePink / edgeAll) : 0, defringed: soft.fringeFixed, flattened: masters.filter((r) => r.softFlat).map((r) => r.name) };
  if (soft && rawAll && rawPink / rawAll > PINK_BLOCK && edgePink / Math.max(1, edgeAll) <= SOFT_PINK_LEFT && !soft.lossy.length) {
    res.fringe = round(edgePink / edgeAll);
    issue(issues, "light", "vien-hong", "toàn tờ", `viền ám hồng ${round((rawPink / rawAll) * 100, 1)}% điểm viền: đã bù (${soft.fringeFixed} điểm: mực tối về #1a1020, hồng sáng bỏ), còn ${round(res.fringe * 100, 1)}%; kiểm lại trên nền tối.`);
  } else if (edgeAll) {
    const frac = edgePink / edgeAll;
    res.fringe = round(frac);
    if (soft?.lossy.length) issue(issues, "block", "vien-hong", "toàn tờ", `viền ám hồng ${round((rawPink / rawAll) * 100, 1)}% điểm viền: bù thì mất quá ${SOFT_LOSS_MAX * 100}% điểm ở ${soft.lossy.join(", ")}: nền ăn sâu vào mảnh, phải vẽ lại.`);
    else if (frac > PINK_BLOCK) issue(issues, "block", "vien-hong", "toàn tờ", `viền ám hồng ${round(frac * 100, 1)}% điểm viền sau khi khoá nền > ${PINK_BLOCK * 100}%: nền ăn vào mảnh (kiểm trên nền tối).`);
    else if (frac > PINK_LIGHT) issue(issues, "light", "vien-hong", "toàn tờ", `viền còn ám hồng ${round(frac * 100, 1)}% điểm viền (cutter ăn mòn thêm được).`);
  }

  for (const r of masters) {
    if (r.flat != null && r.flat3 != null) {
      const f = Math.max(r.flat, r.flat3);
      if (f > FLAT_BLOCK) { issue(issues, "block", "canh-phang", r.name, `${r.name}: thân cạnh không phẳng (${round(f * 100, 0)}% điểm lệch > ${FLAT_BLOCK * 100}% khi kéo ×3): hoa văn dọc cạnh sẽ lộ khi kéo giãn${r.flat <= FLAT_LIGHT ? ` (ảnh gốc phẳng, chỉ lệch khi kéo: góc vạch ${r.nine} nuốt gần hết cạnh ngắn ${Math.min(...r.size)}, ngọc / hoa văn giữa cạnh bị kéo; tờ sau vẽ cạnh ngắn dài hơn hoặc bỏ ngọc giữa cạnh)` : ""}.`, { piece: r.name }); pieceState(r.name, "bad"); }
      else if (f > FLAT_LIGHT) { issue(issues, "light", "canh-phang", r.name, `${r.name}: thân cạnh hơi lệch (${round(f * 100, 0)}% điểm > ${FLAT_LIGHT * 100}%): kiểm tờ liên hệ trước khi kéo.`, { piece: r.name }); pieceState(r.name, "warn"); }
    }
    if (r.softFlat) { issue(issues, "light", "canh-phang", r.name, `${r.name}: thân cạnh lệch ${round(r.softFlat.before * 100, 0)}% điểm: đã ép phẳng (${r.softFlat.changed} điểm), còn ${round(Math.max(r.flat ?? 0, r.flat3 ?? 0) * 100, 0)}%; kiểm tờ liên hệ.`, { piece: r.name }); pieceState(r.name, "warn"); }
    if (r.asym != null && r.asym > SYM_LIGHT) {
      issue(issues, "light", "doi-xung", r.name, `${r.name}: bốn góc không giống nhau (${round(r.asym * 100, 0)}% điểm khác); cutter dựng gương từ góc trên-trái nên có thể bỏ qua.`, { piece: r.name });
      pieceState(r.name, "warn");
    }
    if (r.text?.length) {
      const t = r.text[0];
      issue(issues, "warn", "chu-lac", r.name, `${r.name}: nghi có chữ / ký tự trong ruột (${r.text.map((x) => `${x.n} nét thẳng hàng ở (${x.x},${x.y})`).join("; ")}); chỉ cảnh báo, xem tờ liên hệ rồi quyết.`, { piece: r.name, at: t });
      pieceState(r.name, "warn");
    }
    if (r.nine != null && r.nine >= (Math.min(r.size[0], r.size[1]) >> 1) - 1) issue(issues, "light", "chia-9", r.name, `${r.name}: vạch 9-slice đề xuất ${r.nine} chạm trần (nửa mảnh) của mảnh ${r.size.join("×")}: ruột không đồng nhất, khó kéo.`, { piece: r.name });
  }

  // độ dày viền lệch giữa các khung cùng tờ / cùng bộ
  {
    const sets = new Map();
    for (const r of masters) { if (r.thickness == null) continue; const k = r.set ?? "_"; if (!sets.has(k)) sets.set(k, []); sets.get(k).push(r); }
    for (const [k, list] of sets) {
      const th = list.map((r) => r.thickness).filter((v) => v > 0);
      if (th.length > 1 && Math.max(...th) - Math.min(...th) > THICK_SPREAD) issue(issues, "light", "do-day", k === "_" ? "toàn tờ" : k, `độ dày viền lệch ${Math.max(...th) - Math.min(...th)} điểm master (> ${THICK_SPREAD} = 1 px ở 1×) giữa ${list.map((r) => `${r.name} ${r.thickness}`).join(", ")}.`);
    }
  }
  // trạng thái giống nhau (hover yếu)
  const bySet = new Map();
  for (const r of masters) if (r.set && r.state) { if (!bySet.has(r.set)) bySet.set(r.set, []); bySet.get(r.set).push(r); }
  for (const [set, list] of bySet) {
    const same = [];
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const d = pieceDiff(list[i].master, list[j].master);
      if (d != null && d < SAME_STATE_DIFF) same.push(`${list[i].state}≈${list[j].state}`);
    }
    if (same.length) issue(issues, "light", "trang-thai-giong", set, `bộ ${set}: trạng thái gần như trùng nhau (${same.join(", ")}): hover / chọn khó phân biệt (luật không chỉ bằng màu).`);
  }

  // ----- màu -----
  if (masters.length) {
    const sc = significantColors(masters.map((r) => r.master));
    res.colors = sc;
    if (sc.n > COLORS_BLOCK) issue(issues, "block", "mau", "toàn tờ", `${sc.n} màu đáng kể (≥ 0,5% điểm, ô 3 bit) > ${COLORS_BLOCK}: vượt xa bảng ≤ ${kit.colors} màu của kit.`);
    else if (sc.n > COLORS_LIGHT) issue(issues, "light", "mau", "toàn tờ", `${sc.n} màu đáng kể (> ${COLORS_LIGHT}); cutter lượng tử về ≤ ${kit.colors} màu nhưng kiểm lại độ mịn.`);
    if (o.palette?.length) {
      let off = 0, all = 0;
      for (const r of masters) for (let y = 0; y < r.master.h; y++) for (let x = 0; x < r.master.w; x++) {
        if (!opaque(r.master, x, y)) continue;
        all++; const c = colorAt(r.master, x, y);
        if (!o.palette.some((p) => cdist(c, p) <= OFF_PALETTE_DIST)) off++;
      }
      res.offPalette = all ? round(off / all) : 0;
      if (res.offPalette > OFF_PALETTE_BLOCK) issue(issues, "block", "ngoai-bang", "toàn tờ", `${round(res.offPalette * 100, 0)}% điểm xa mọi màu trong bảng tham chiếu > ${OFF_PALETTE_BLOCK * 100}%.`);
      else if (res.offPalette > OFF_PALETTE_LIGHT) issue(issues, "light", "ngoai-bang", "toàn tờ", `${round(res.offPalette * 100, 0)}% điểm xa mọi màu trong bảng tham chiếu.`);
    }
  }
  return finish(res);
}

// ---------- Dòng LỖI nháp ----------
const CODE_VI = {
  "kich-thuoc": "sai kích thước", nen: "nền ngoài dung sai", luoi: "không dò được dải", "so-hinh": "sai số mảnh", "hinh-dinh": "mảnh dính", "trang-thai": "thiếu trạng thái",
  "cham-mep": "chạm mép tờ", "khoang-cach": "mảnh sát nhau", "vien-hong": "viền ám hồng", "canh-phang": "cạnh không phẳng", "doi-xung": "bốn góc khác nhau", mau: "quá nhiều màu",
  "ngoai-bang": "màu ngoài bảng", "chu-lac": "nghi chữ trong ảnh", "do-day": "độ dày viền lệch", "chia-9": "ruột không đồng nhất", "trang-thai-giong": "trạng thái giống nhau",
};
/** Dòng `LỖI:` nháp theo mẫu NGUON.md. Gồm mục nhẹ, chặn và cảnh báo chữ lạc; null nếu sạch. */
export function draftErrorLine(res) {
  const list = res.issues.filter((i) => i.sev !== "note");
  if (!list.length) return null;
  const codes = [...new Set(list.map((i) => CODE_VI[i.code] ?? i.code))];
  return `LỖI: ${res.sheet} — ${codes.join(" / ")} — ${list.map((i) => i.where).join(", ")} — ${list.map((i) => i.msg.replace(/\.$/, "")).join("; ")}.`;
}

// ---------- Tờ liên hệ ----------
/** Tờ gốc thu nhỏ + hộp từng mảnh theo mức (xanh đạt, vàng nhẹ / cảnh báo, đỏ chặn) + tên mảnh; chữ không dấu (phông 5×7). */
export function uiContactSheet(res) {
  const src = res.img, targetW = 1000, k = Math.min(1, targetW / src.w), W = Math.round(src.w * k), H = Math.round(src.h * k), T = 40;
  const im = new Img(W + 16, T + H + 8);
  fillRect(im, 0, 0, im.w, im.h, [20, 16, 28, 255]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) im.set(8 + x, T + y, src.get(Math.min(src.w - 1, Math.round(x / k)), Math.min(src.h - 1, Math.round(y / k))));
  drawText(im, 4, 4, `${res.sheet} ${res.kind} ${res.size.join("X")} ${LEVEL_ASCII[res.level]}`, 2, [250, 250, 250, 255]);
  (res.bands ?? []).forEach((b) => {
    b.figures.forEach((f, i) => {
      const c = COLORS[f.state ?? b.state ?? "ok"], x0 = 8 + Math.round(f.x0 * k), x1 = 8 + Math.round(f.x1 * k), y0 = T + Math.round(f.y0 * k), y1 = T + Math.round(f.y1 * k);
      strokeRect(im, x0, y0, x1, y1, c);
      const label = (res.pieces.find((p) => p.fig && p.fig.x0 === f.x0 && p.fig.y0 === f.y0)?.name ?? `${b.row + 1}.${i + 1}`).replace(/_/g, "-");
      drawText(im, x0 + 2, y0 + 2, label, 1, [250, 250, 250, 255], [20, 16, 28, 255]);
    });
  });
  return im;
}

// ---------- Báo cáo ----------
export function toJson(r) {
  return {
    sheet: r.sheet, kind: r.kind, size: r.size, shape: r.shape ?? null, level: r.level, background: r.background ?? null, fringe: r.fringe ?? null, colors: r.colors ?? null,
    offPalette: r.offPalette ?? null, layout: r.bands?.map((b) => b.figures.length) ?? null,
    pieces: r.pieces.map((p) => ({ name: p.name, set: p.set, state: p.state, size: p.size, rawSize: p.rawSize, nine: p.nine ?? null, thickness: p.thickness ?? null, cornerExt: p.cornerExt ?? null, flat: p.flat ?? null, flat3: p.flat3 ?? null, asym: p.asym ?? null, fringe: p.fringe, stray: p.text ?? [] })),
    issues: r.issues.map(({ sev, code, where, msg }) => ({ sev, code, where, msg })), draft: draftErrorLine(r),
  };
}
export function toMarkdown(r) {
  const L = [`# Kiểm tờ UI: ${r.sheet} (loại ${r.kind})`, "", `**Mức chung: ${r.level.toUpperCase()}** · cỡ ${r.size.join("×")} (${r.shape ?? "?"}).`, ""];
  if (r.pieces.length) {
    L.push("| Mảnh | Cỡ master | Vạch 9-slice | Dày viền | Cạnh phẳng | Lệch góc |", "|---|---|---|---|---|---|");
    for (const p of r.pieces) L.push(`| ${p.name} | ${p.size.join("×")} | ${p.nine ?? "–"} | ${p.thickness ?? "–"} | ${p.flat == null ? "–" : round(p.flat)} | ${p.asym == null ? "–" : round(p.asym)} |`);
    L.push("");
  }
  L.push("Ảnh liên hệ: `<tờ>-ui-lien-he.png` (xanh = đạt, vàng = nhẹ / cảnh báo, đỏ = chặn).", "");
  if (!r.issues.length) L.push("Không có phát hiện.");
  for (const i of r.issues) L.push(`- **${{ block: "CHẶN", light: "nhẹ", note: "lưu ý", warn: "cảnh báo" }[i.sev]}** \`${i.code}\` ${i.where}: ${i.msg}`);
  const d = draftErrorLine(r);
  L.push("", d ? ["Dòng nháp cho NGUON.md (soát lại bằng mắt trước khi dán):", "", "```", d, "```"].join("\n") : "Không có dòng `LỖI:` tự sinh.", "");
  L.push("## Việc còn lại cho mắt người", "", "Công cụ không kiểm: chữ / ký tự đọc được trong ảnh (luật vẽ 1, chỉ cảnh báo heuristic), hoa văn nằm sai chỗ nhưng vẫn \"phẳng\" theo số đo, phong cách / chất liệu khớp BOARD, hover / chọn đọc được ở 3 cỡ.", "");
  return L.join("\n");
}
/** Ghi JSON + MD + tờ liên hệ vào `out`; trả về danh sách file. */
export function writeReport(r, out, { images = true } = {}) {
  mkdirSync(out, { recursive: true });
  const files = [], put = (n, data) => { const f = path.join(out, n); writeFileSync(f, data); files.push(f); };
  put(`${r.sheet}-ui-check.json`, JSON.stringify(toJson(r), null, 2) + "\n");
  put(`${r.sheet}-ui-check.md`, toMarkdown(r));
  if (images && r.bands) put(`${r.sheet}-ui-lien-he.png`, encodePng(uiContactSheet(r)));
  return files;
}

// ---------- CLI ----------
function parseArgs(argv) {
  const o = { files: [], images: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--kind") o.kindId = argv[++i].toUpperCase();
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--div") o.div = +argv[++i];
    else if (a === "--palette") o.palette = argv[++i];
    else if (a === "--no-image") o.images = false;
    else if (a === "--soft") o.soft = true;
    else if (a.startsWith("--")) throw new Error(`tùy chọn lạ: ${a}`);
    else o.files.push(a);
  }
  return o;
}
const summary = (r) => `${r.level.padEnd(5)} ${r.sheet} [${r.kind}] ${r.size.join("×")}: chặn ${r.issues.filter((i) => i.sev === "block").length} · nhẹ ${r.issues.filter((i) => i.sev === "light").length} · cảnh báo ${r.issues.filter((i) => i.sev === "warn").length}`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    if (!o.files.length) { console.error("Dùng: npm run ui:check -- <tờ.png>… [--kind F|N|O|T|I|D|BOARD] [--out <thư mục>] [--no-image] [--div N] [--palette <file.gpl>] [--soft]"); process.exit(2); }
    const kit = loadKit(), palette = o.palette ? readGpl(o.palette).map(hex) : null, base = o.out ?? path.join(os.tmpdir(), "ui-check");
    let blocked = 0;
    for (const f of o.files) {
      if (!existsSync(f)) throw new Error(`không có tờ ${f}`);
      const r = analyzeUiSheet(f, { kit, kindId: o.kindId, div: o.div, palette, soft: o.soft });
      console.log(summary(r));
      if (r.level === "chặn") blocked++;
      for (const i of r.issues) if (i.sev !== "note") console.log(`  ${{ block: "CHẶN", light: "nhẹ", warn: "cảnh báo" }[i.sev]} ${i.code} ${i.where}: ${i.msg}`);
      const files = writeReport(r, o.files.length > 1 ? path.join(base, r.sheet) : base, { images: o.images });
      const d = draftErrorLine(r);
      if (d) console.log(d);
      console.log(`Đã ghi ${files.length} file vào ${path.dirname(files[0])}`);
    }
    process.exit(blocked ? 1 : 0);
  } catch (e) { console.error(e.message); process.exit(2); }
}
