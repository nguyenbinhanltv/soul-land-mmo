// Cắt tờ hoạt ảnh phụ thể võ hồn v2 (#1022; docs/art/phu-the-hoat-anh.md) thành sheet game `vhanim_{id}_b` (nửa sau thân) và `vhanim_{id}_f` (nửa trước).
//   node tools/assets/phuthe-sheet-cut.mjs --id ta_hoa_phuong_hoang --sheet A=a.png … --sheet E=e.png --out <thư mục> [tùy chọn]
//
// Mỗi tờ = MỘT hướng (A–E = s, se, e, ne, n), 3:2, lưới 6×4, mỗi ô có nộm LPC màu khóa + phụ thể (phuthe-sheet-dummy.mjs dựng ảnh tham chiếu).
//   1. Chuẩn hóa cỡ theo TỈ LỆ (mọi cỡ 3:2 ±1% về 1536×1024), khóa nền (#FF00FF, dung sai 60), gỡ viền ngả nền.
//   2. Trừ nộm: điểm gần màu khóa nộm (dung sai nhỏ hơn nền) bị xóa, viền ngả màu khóa gỡ ba lớp. Phần còn lại là phụ thể.
//   3. Đăng ký nộm từng ô (tương quan hình bóng với nộm danh nghĩa) → cửa sổ khung 256×256 theo vị trí nộm thật; điểm phụ thể trong cửa sổ ∩ hộp lưới của ô thuộc khung đó.
//   4. Nhãn lớp từng điểm: `sau` / `truoc` theo mặt nạ vùng (`art/src/phuthe-anim/<id>/lop.json`, xem phuthe-sheet-cut-lib.mjs `parseLop`) hoặc quy tắc có sẵn.
//   5. Lượng tử một bảng màu cho cả võ hồn, thu 256 → khung 96 / 128 bằng bỏ phiếu (không nội suy), viền ngoài #1a1020.
//   6. Hai giới dùng chung ảnh vẽ (vẽ trên nộm nam): nửa nữ chỉ dời theo chênh điểm neo `back` của thân nữ so với thân nam (frameAnchors).
//   7. Ghi <out>/vhanim_<id>_b.png, vhanim_<id>_f.png (22 cột, vật cứng 13 cột × 10 hàng = giới × hướng; nửa không có điểm ảnh thì không ghi, `blank`),
//      <out>/manifest-entry.json, <out>/_report.json.
// Không ghi vào shared/assets (P2 nối client, P3 nhập): orchestrator duyệt trang xem trước (phuthe-sheet-preview.mjs) rồi mới chép.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Img, readPng, encodePng, readGpl, hex, OUTLINE } from "./lib.mjs";
import { medianCut, nearest } from "./beast-sheet-cut.mjs";
import { median } from "./beast-sheet-stats.mjs";
import {
  DIRS, CLIPS, SHEET_ID, CELL, SEXES, HALVES, GAME_ROWS, framesOf, gameAnims, gameCols, gameRow, gameKey, frameOrigin, checkFrame, phutheInfo, ANIM_ROOT, bodyStepOf,
} from "./phuthe-sheet-lib.mjs";
import { prepareSheet, cellSpirit, dropSpecks, parseLop, layerFn, defaultLayers, levelOfCode, summarize, DUMMY_TOL, BG_TOL, dist2 } from "./phuthe-sheet-cut-lib.mjs";
import { bodyAnchors } from "./phuthe-sheet-dummy.mjs";

const K_OUT = hex(OUTLINE);

function forEdge(im, fn) {
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    if (!im.alpha(x, y)) continue;
    if (x === 0 || y === 0 || x === im.w - 1 || y === im.h - 1 || !im.alpha(x - 1, y) || !im.alpha(x + 1, y) || !im.alpha(x, y - 1) || !im.alpha(x, y + 1)) fn(x, y);
  }
}
const touchesOpaque = (im, x, y) => (x > 0 && im.alpha(x - 1, y)) || (x < im.w - 1 && im.alpha(x + 1, y)) || (y > 0 && im.alpha(x, y - 1)) || (y < im.h - 1 && im.alpha(x, y + 1));

/** Thu một ô canonical (chỉ số màu + nhãn lớp, 256×256) về khung F×F: mỗi điểm đích lấy 4×4 mẫu, là vật nếu ≥ nửa mẫu là vật, màu / nhãn nhiều phiếu nhất. */
export function downscaleFrame(idx, lab, pal, F) {
  const out = new Img(F, F), labels = new Uint8Array(F * F), k = CELL / F;
  for (let v = 0; v < F; v++) for (let u = 0; u < F; u++) {
    const votes = new Map(); let opaque = 0, truoc = 0;
    for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
      const X = Math.min(CELL - 1, Math.floor((u + (sx + 0.5) / 4) * k)), Y = Math.min(CELL - 1, Math.floor((v + (sy + 0.5) / 4) * k)), c = idx[Y * CELL + X];
      if (c >= 0) { opaque++; votes.set(c, (votes.get(c) ?? 0) + 1); if (lab[Y * CELL + X]) truoc++; }
    }
    if (opaque < 8) continue;
    let bc = -1, bv = 0; for (const [c, n] of votes) if (n > bv) { bv = n; bc = c; }
    out.set(u, v, [...pal[bc], 255]); labels[v * F + u] = truoc * 2 >= opaque ? 1 : 0;
  }
  return { img: out, labels };
}

/**
 * @param {{ id: string, sheets: Record<string, Img>, group?: string, frame?: number, dummyKey?: string, dummyTol?: number, key?: number[], tol?: number, colors?: number,
 *   palette?: string, lop?: object, dummySex?: string, grid?: string, minArea?: number }} o
 * @returns {{ halves: { b: Img | null, f: Img | null }, entries: object[], report: object }}
 */
export function cutPhuThe(o) {
  const info = phutheInfo(o.id), group = o.group ?? info.group, F = checkFrame(o.frame ?? info.frame), dummyKey = o.dummyKey ?? info.dummyKey;
  const dummySex = o.dummySex ?? "m", lop = o.lop ? parseLop(o.lop) : null, dummyTol = o.dummyTol ?? DUMMY_TOL, tol = o.tol ?? BG_TOL;
  const warns = [], rep = { id: o.id, group, frame: F, dummyKey, sheets: {}, dropped: 0 }, fr = framesOf(group);
  const warn = (code, msg) => warns.push({ code, msg });

  // 1–4. Từng tờ → khung canonical (điểm + nhãn lớp)
  const frames = new Map(); // `dir/anim/n` → { dir, anim, frame, step, px: [[u, v, i]], img, area, lab (hàm nhãn), dx, dy }
  for (const dir of DIRS) {
    const sid = SHEET_ID[dir], raw = o.sheets[sid];
    if (!raw) { warn("thieu-to", `thiếu tờ ${sid} (${dir})`); continue; }
    const prep = prepareSheet(raw, { group, dir, frame: F, dummyKey, dummyTol, tol, key: o.key, sex: dummySex, grid: o.grid ?? "auto" });
    for (const n of prep.notes) warn("luoi", `tờ ${sid}: ${n}`);
    const bad = prep.cells.filter((c) => !c.reg.ok);
    rep.sheets[sid] = { dir, size: [raw.w, raw.h], factor: +prep.factor.toFixed(4), key: prep.bgKey, grid: prep.layout.mode, shift: prep.shift, registered: prep.cells.length - bad.length, cells: prep.cells.length };
    if (bad.length) warn("nom-mat", `tờ ${sid}: ${bad.length} / ${prep.cells.length} ô không tìm thấy nộm (điểm khớp < 50%: ${bad.map((c) => `${c.anim}${c.frame + 1}`).join(", ")}), dùng độ dời trung vị của tờ (${prep.shift.dx}, ${prep.shift.dy})`);
    for (const cell of prep.cells) {
      const name = `${dir}/${cell.anim}/${cell.frame}`, sp = cellSpirit(prep, cell), ds = dropSpecks(sp.px, o.minArea ?? 16);
      rep.dropped += ds.dropped;
      if (sp.outside > 30) warn("vuot-khung", `khung ${name}: ${sp.outside} điểm phụ thể nằm ngoài ô khung (bị cắt); kiểm tra lưới / vẽ lại nếu nhiều`);
      if (sp.edge > 8) warn("cham-mep", `khung ${name}: phụ thể chạm mép ô khung (${sp.edge} điểm, có thể bị cắt)`);
      if (!ds.px.length) { warn(cell.anim === "hurt" ? "hurt-rong" : "khung-rong", `${cell.anim === "hurt" ? "khung hurt rỗng" : "THIẾU khung (rỗng)"} ${name} (tờ ${sid} cột ${cell.col} hàng ${cell.row})`); }
      frames.set(name, { dir, anim: cell.anim, frame: cell.frame, step: cell.step, px: ds.px, area: ds.px.length, img: prep.img, nom: cell.nom, dx: cell.reg.ok ? cell.reg.dx : prep.shift.dx, dy: cell.reg.ok ? cell.reg.dy : prep.shift.dy, cell });
    }
  }
  if (![...frames.values()].some((f) => f.px.length)) throw new Error("không cắt được khung nào");

  // Cỡ phụ thể so với khung `s` cùng clip (đặc tả: lệch quá ±25% là cảnh báo, theo quyết định chủ repo 2026-10-26 mục 4 không chặn)
  for (const anim of CLIPS) {
    const ref = [...Array(fr[anim]).keys()].map((f) => frames.get(`s/${anim}/${f}`)?.area).filter(Boolean);
    if (!ref.length) continue;
    const mr = Math.sqrt(median(ref));
    for (const dir of DIRS.filter((d) => d !== "s")) {
      const a = [...Array(fr[anim]).keys()].map((f) => frames.get(`${dir}/${anim}/${f}`)?.area).filter(Boolean);
      if (!a.length) continue;
      const r = Math.sqrt(median(a)) / mr;
      if (Math.abs(r - 1) > 0.25) warn("co-phu-the", `khối ${dir} clip ${anim}: cỡ phụ thể ${Math.round(r * 100)}% so với khối s (lệch quá 25%; cảnh báo kỹ thuật, không chặn)`);
    }
  }

  // 5. Bảng màu chung (lấy thưa cho nhanh)
  const samples = [], total = [...frames.values()].reduce((t, f) => t + f.px.length, 0), stride = Math.max(1, Math.ceil(total / 60000));
  let n0 = 0;
  for (const f of frames.values()) for (const p of f.px) if (++n0 % stride === 0) samples.push([f.img.data[p[2] * 4], f.img.data[p[2] * 4 + 1], f.img.data[p[2] * 4 + 2]]);
  const pal = o.palette && o.palette !== "auto" ? (o.palette === "gpl" ? readGpl() : readGpl(o.palette)).map(hex) : medianCut(samples, o.colors ?? 32);
  rep.palette = pal.length;

  // Thu về khung F, nhãn lớp
  const out = new Map(); // tên → { img, labels }
  for (const [name, f] of frames) {
    const idx = new Int16Array(CELL * CELL).fill(-1), lab = new Uint8Array(CELL * CELL), label = layerFn({ lop, dir: f.dir, clip: f.anim, frameIdx: f.frame, F, base: defaultLayers(f.px, f.nom, f.dir) });
    for (const [u, v, i] of f.px) {
      idx[v * CELL + u] = nearest([f.img.data[i * 4], f.img.data[i * 4 + 1], f.img.data[i * 4 + 2]], pal);
      lab[v * CELL + u] = label(u, v) === "truoc" ? 1 : 0;
    }
    out.set(name, downscaleFrame(idx, lab, pal, F));
  }

  // Viền ngoài: nếu viền hình vốn tối thì chỉ tô lại, không thì thêm một vòng ngoài (nhãn vòng = nhãn điểm đục kề)
  let dark = 0, edge = 0;
  for (const { img } of out.values()) forEdge(img, (x, y) => { edge++; const p = img.get(x, y); if (p[0] * 0.3 + p[1] * 0.59 + p[2] * 0.11 < 60) dark++; });
  const recolor = edge > 0 && dark / edge >= 0.6;
  rep.outline = recolor ? "tô lại viền tối sẵn có" : "thêm vòng viền ngoài";
  for (const fr_ of out.values()) {
    const { img, labels } = fr_;
    if (recolor) { const e = []; forEdge(img, (x, y) => e.push([x, y])); for (const [x, y] of e) img.set(x, y, [...K_OUT, 255]); }
    else {
      const e = [];
      for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) if (!img.alpha(x, y) && touchesOpaque(img, x, y)) e.push([x, y]);
      for (const [x, y] of e) {
        img.set(x, y, [...K_OUT, 255]);
        const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].find(([a, b]) => a >= 0 && b >= 0 && a < F && b < F && img.alpha(a, b));
        labels[y * F + x] = nb ? labels[nb[1] * F + nb[0]] : 0;
      }
    }
  }

  // 6–7. Sheet game: hai nửa, giới × hướng hàng; nửa nữ dời theo chênh neo `back`
  const cols = gameCols(group), anims = gameAnims(group);
  const halves = { b: new Img(cols * F, GAME_ROWS * F), f: new Img(cols * F, GAME_ROWS * F) }, count = { b: 0, f: 0 };
  const shifts = {};
  const missingAnchor = new Set();
  for (const [name, fr_] of out) {
    const f = frames.get(name);
    for (const sex of SEXES) {
      let dx = 0, dy = 0;
      if (sex !== dummySex) {
        const a = bodyAnchors(dummySex, f.dir, f.anim, f.step)?.back, b = bodyAnchors(sex, f.dir, f.anim, f.step)?.back;
        if (a && b) { dx = Math.round(b.x - a.x); dy = Math.round(b.y - a.y); } else missingAnchor.add(`${f.dir}/${f.anim}`);
        shifts[`${sex}/${name}`] = [dx, dy];
      }
      const x0 = (anims[f.anim][0] + f.frame) * F, y0 = gameRow(sex, f.dir) * F;
      for (let v = 0; v < F; v++) for (let u = 0; u < F; u++) {
        if (!fr_.img.alpha(u, v)) continue;
        const X = u + dx, Y = v + dy;
        if (X < 0 || Y < 0 || X >= F || Y >= F) continue;
        const half = fr_.labels[v * F + u] ? "f" : "b";
        halves[half].set(x0 + X, y0 + Y, fr_.img.get(u, v)); count[half]++;
      }
    }
  }
  if (missingAnchor.size) warn("ghi-chu", `không đo được điểm neo thân (nửa nữ không dời): ${[...missingAnchor].join(", ")}`);
  rep.halves = { b: { pixels: count.b, blank: count.b === 0 }, f: { pixels: count.f, blank: count.f === 0 } };
  rep.sexShift = shifts;

  // Còn điểm nộm sau cutter? (nộm KHÔNG vào game)
  const dk = hex(dummyKey);
  let left = 0;
  for (const im of Object.values(halves)) for (let i = 0; i < im.data.length; i += 4) if (im.data[i + 3] && dist2([im.data[i], im.data[i + 1], im.data[i + 2]], dk) <= dummyTol * dummyTol) left++;
  if (left) warn("con-nom", `còn ${left} điểm ảnh gần màu khóa nộm ${dummyKey} trong sheet đầu ra (phụ thể trùng màu khóa hoặc nộm lẫn vào); đổi --dummy-key khi vẽ lại hoặc xem tờ`);

  const entries = [];
  for (const [side, half] of Object.entries(HALVES)) {
    if (count[half] === 0) continue;
    entries.push({
      key: gameKey(o.id, half), frame: [F, F], iso: true,
      anim: { group, layer: side, dirs: DIRS, sexes: SEXES, cols, rows: GAME_ROWS, rowsPerSex: DIRS.length, anims: Object.fromEntries(CLIPS.map((a) => [a, { col: anims[a][0], n: anims[a][1] }])), origin: frameOrigin(F) },
    });
  }
  rep.warnings = warns.map((w) => w.msg);
  rep.issues = warns.map((w) => ({ level: levelOfCode(w.code), code: w.code, msg: w.msg }));
  rep.summary = summarize(rep.issues);
  rep.frames = out.size;
  rep.missing = warns.filter((w) => w.code === "khung-rong" || w.code === "thieu-to").length;
  rep.blank = Object.entries(HALVES).filter(([, h]) => count[h] === 0).map(([s]) => s);
  return { halves: { b: count.b ? halves.b : null, f: count.f ? halves.f : null }, entries, report: rep };
}

/** In tóm tắt phân mức: block / warn từng dòng (tối đa `cap` mỗi mức), info chỉ đếm theo mã (--verbose in hết). */
export function formatSummary(rep, verbose = false, cap = 8) {
  const s = rep.summary, lines = [`  Cảnh báo: ${s.block} block · ${s.warn} warn · ${s.info} info (tổng ${s.total}); lưới: ${Object.entries(rep.sheets).map(([id, x]) => `${id}=${x.grid}`).join(", ")}`];
  for (const level of ["block", "warn"]) {
    const list = rep.issues.filter((i) => i.level === level), shown = verbose ? list : list.slice(0, cap);
    for (const i of shown) lines.push(`  [${level}] ${i.msg}`);
    if (list.length > shown.length) lines.push(`  [${level}] … và ${list.length - shown.length} dòng nữa (xem _report.json)`);
  }
  const info = rep.issues.filter((i) => i.level === "info");
  if (info.length) lines.push(verbose ? info.map((i) => `  [info] ${i.msg}`).join("\n") : `  info: ${Object.entries(info.reduce((m, i) => ({ ...m, [i.code]: (m[i.code] ?? 0) + 1 }), {})).map(([c, n]) => `${c}×${n}`).join(", ")} (--verbose để in hết)`);
  return lines.join("\n");
}

// ---------- CLI ----------
function parseArgs(argv) {
  const o = { sheets: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], next = () => argv[++i];
    if (a === "--id") o.id = next();
    else if (a === "--sheet") { const [id, f] = next().split("="); o.sheets[id] = f; }
    else if (a === "--out") o.out = next();
    else if (a === "--frame") o.frame = +next();
    else if (a === "--dummy-key") o.dummyKey = next();
    else if (a === "--dummy-tol") o.dummyTol = +next();
    else if (a === "--dummy-sex") o.dummySex = next();
    else if (a === "--key") o.key = hex(next());
    else if (a === "--tol") o.tol = +next();
    else if (a === "--colors") o.colors = +next();
    else if (a === "--palette") o.palette = next();
    else if (a === "--lop") o.lopFile = next();
    else if (a === "--grid") o.grid = next();
    else if (a === "--min-area") o.minArea = +next();
    else if (a === "--strict") o.strict = true;
    else if (a === "--verbose") o.verbose = true;
    else throw new Error(`tùy chọn lạ: ${a}`);
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    if (!o.id || !o.out || !Object.keys(o.sheets).length) {
      console.error("Dùng: node tools/assets/phuthe-sheet-cut.mjs --id <võ hồn> --sheet A=<ảnh> [--sheet B=<ảnh> … E] --out <thư mục> [--frame 96|128] [--dummy-key #00D0D0] [--dummy-tol 40] [--dummy-sex m|f] [--tol 60] [--colors 32] [--palette auto|gpl|<gpl>] [--lop <lop.json>] [--grid auto|uniform] [--strict] [--verbose]");
      process.exit(2);
    }
    const hashes = {};
    for (const id of Object.keys(o.sheets)) { hashes[id] = createHash("sha256").update(readFileSync(o.sheets[id])).digest("hex"); o.sheets[id] = readPng(o.sheets[id]); }
    const lopFile = o.lopFile ?? path.join(ANIM_ROOT, o.id, "lop.json");
    if (existsSync(lopFile)) o.lop = JSON.parse(readFileSync(lopFile, "utf8")); else if (o.lopFile) throw new Error(`không có ${o.lopFile}`);
    const res = cutPhuThe(o);
    for (const [id, hash] of Object.entries(hashes)) if (res.report.sheets[id]) res.report.sheets[id].sourceSha256 = hash;
    mkdirSync(o.out, { recursive: true });
    for (const [side, half] of Object.entries(HALVES)) if (res.halves[half]) writeFileSync(path.join(o.out, `${gameKey(o.id, half)}.png`), encodePng(res.halves[half]));
    writeFileSync(path.join(o.out, "manifest-entry.json"), JSON.stringify(res.entries, null, 2) + "\n");
    writeFileSync(path.join(o.out, "_report.json"), JSON.stringify(res.report, null, 2) + "\n");
    const r = res.report;
    console.log(`${o.id}: ${r.frames} khung, khung ${r.frame}, ${r.palette} màu, bỏ ${r.dropped} mảnh vụn; nửa sau ${r.halves.b.blank ? "(rỗng)" : r.halves.b.pixels + " điểm"}, nửa trước ${r.halves.f.blank ? "(rỗng)" : r.halves.f.pixels + " điểm"} → ${o.out}`);
    console.warn(formatSummary(r, o.verbose));
    if (r.missing) { console.error(`${r.missing} khung / tờ thiếu: vẽ lại tờ đó.`); process.exit(1); }
    if (o.strict && r.summary.block) { console.error(`${r.summary.block} cảnh báo mức block (--strict).`); process.exit(1); }
  } catch (e) { console.error(e.message); process.exit(2); }
}
