// Cắt tờ UI thành mảnh game + ghi manifest ui-kit.json (#879, theo dõi #877; docs/art/ui-kit.md "Công cụ tờ UI").
//   node tools/assets/ui-sheet-cut.mjs <tờ.png> --out <thư mục> [--kind F|N|O|T|I|D] [--div N] [--colors 32] [--palette auto|gpl|<file.gpl>]
//        [--no-mirror | --mirror] [--names a,b,…] [--prefix p_] [--soft] [--skip a,b] [--force] [--write-manifest]
//   node tools/assets/ui-sheet-cut.mjs --budget           (tổng KB của các mảnh đã ghi trong manifest so với ngân sách)
// Các bước: (1) chạy ui-sheet-check (tờ có mục CHẶN thì không cắt, trừ --force; --skip a,b = bỏ mảnh còn chặn riêng; --soft = cắt mềm: bù viền hồng + ép cạnh phẳng, mục chặn tương ứng chỉ hạ xuống nhẹ khi đạt kiểm hình, xem SOFT_* ở ui-sheet-check); (2) tách mảnh theo khoảng trống + khoá nền + gỡ viền (dò lưới của
// beast-sheet-grid, khoá nền của beast-sheet-cut); (3) hạ lưới theo vùng về master 2× (ui-kit.md "Kit 1× hay 2×": vẽ master 2×);
// (4) khung / nút: dựng đối xứng bằng gương từ góc trên-trái (mirrorFold); (5) lượng tử về bảng ≤ 32 màu + viền #1a1020, alpha nhị phân;
// (6) xuất bản 2× và bản 1× (hạ 2× → 1× theo vùng rồi lượng tử lại, không nearest trần); (7) vạch 9-slice đo từ ảnh, chung trong một bộ trạng thái;
// (8) ghi <out>/2x/<khoá>.png, <out>/1x/<khoá>.png, manifest-entry.json, _report.json; --write-manifest gộp vào art/src/ui-kit/ui-kit.json (không vượt ngân sách KB).
// Tất định: cùng tờ + cùng tuỳ chọn → cùng byte. Không ghi vào shared/assets: nhập mảnh vào game là việc của PR chuyển màn.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { readPng, encodePng, readGpl, hex } from "./lib.mjs";
import { analyzeUiSheet, draftErrorLine, writeReport } from "./ui-sheet-check.mjs";
import { loadKit, saveKit, KIT_JSON, kindFromName, expandKind, areaDown, evenSize, mirrorFold, buildPalette, quantize, suggestNine } from "./ui-kit-lib.mjs";

const round = (x, n = 3) => Math.round(x * 10 ** n) / 10 ** n;
const sha = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 16);

/** Tổng byte theo nhóm ngân sách (kit / icon) và theo bản xuất (x2 / x1) của danh sách mảnh trong manifest. */
export function budgetOf(kit, pieces = kit.pieces) {
  const out = {};
  for (const g of Object.keys(kit.budget)) out[g] = { limit: kit.budget[g], x2: 0, x1: 0, count: 0 };
  for (const p of pieces) {
    const t = out[p.budget] ?? (out[p.budget] = { limit: Infinity, x2: 0, x1: 0, count: 0 });
    t.x2 += p.bytes.x2; t.x1 += p.bytes.x1; t.count++;
  }
  const over = [];
  for (const [g, t] of Object.entries(out)) for (const s of ["x2", "x1"]) if (t[s] > t.limit) over.push(`${g} ${s === "x2" ? "2×" : "1×"}: ${(t[s] / 1000).toFixed(1)} KB > ${(t.limit / 1000).toFixed(1)} KB`);
  return { groups: out, over };
}

/**
 * Cắt một tờ.
 * @param {{ img: object, name?: string, kit?: object, kindId?: string, div?: number, colors?: number, palette?: string|number[][], mirror?: boolean, names?: string[], prefix?: string, force?: boolean, soft?: boolean, skip?: string[] }} o
 * @returns {{ pieces: object[], groups: object, report: object, check: object, files: Map<string, Buffer> }} files: `2x/<khoá>.png`, `1x/<khoá>.png`
 */
export function cutUiSheet(o) {
  const kit = o.kit ?? loadKit(), name = o.name ?? "to", kindId = o.kindId ?? kindFromName(name);
  const kind = expandKind(kit, kindId);
  if (kind.board) throw new Error("BOARD chỉ để duyệt, không cắt");
  const check = analyzeUiSheet(o.img, { kit, kindId, name, div: o.div, names: o.names, soft: o.soft });
  // --skip: bỏ hẳn mảnh còn CHẶN riêng của nó (vá ô: cắt phần đạt, ô hỏng vẽ lại ở lượt sau); chặn chung của tờ vẫn chặn
  const skip = new Set(o.skip ?? []);
  // tên thật của mảnh (đã qua --names / tên tự đặt), gồm cả mảnh lỗi không có điểm vật (so-hinh) chỉ còn trong issue.piece
  const known = new Set([...check.pieces.map((p) => p.name), ...check.issues.filter((i) => i.piece).map((i) => i.piece)]);
  for (const n of skip) if (!known.has(n)) throw new Error(`--skip: tờ ${kind.id} không có mảnh ${n} (có: ${[...known].join(", ")})`);
  const blocking = check.issues.filter((i) => i.sev === "block" && !(i.piece && skip.has(i.piece)));
  if (blocking.length && !o.force) {
    const e = new Error(`tờ ${name} có mục CHẶN, không cắt (sửa tờ, --soft, --skip <mảnh> hoặc --force):\n` + blocking.map((i) => `  ${i.code} ${i.where}: ${i.msg}`).join("\n"));
    e.check = check;
    throw e;
  }
  check.pieces = check.pieces.filter((p) => !skip.has(p.name));
  if (!check.pieces.length) throw new Error(`tờ ${name}: không cắt được mảnh nào`);
  const mirror = o.mirror ?? kind.mirror === true, colors = o.colors ?? kit.colors, prefix = o.prefix ?? "";

  // 2× master, dựng gương
  // mảnh có `mirror: false` ở spec (tab hở đáy…) không dựng gương dù loại tờ có dựng; --mirror / --no-mirror vẫn ghi đè tất cả
  const mirrorOf = (p) => o.mirror ?? p.mirror ?? kind.mirror === true;
  const masters = check.pieces.map((p) => ({ ...p, m2: mirrorOf(p) ? mirrorFold(p.master) : p.master }));
  // bảng màu
  let pal;
  if (Array.isArray(o.palette)) pal = o.palette;
  else if (o.palette === "gpl") pal = readGpl().map(hex);
  else if (o.palette && o.palette !== "auto") pal = readGpl(o.palette).map(hex);
  else pal = buildPalette(masters.map((p) => p.m2), colors, kit.outline);

  const warnings = [];
  const pieces = [], files = new Map();
  for (const p of masters) {
    const q2 = quantize(p.m2, pal), q1 = quantize(areaDown(evenSize(q2), 2), pal);
    const png2 = encodePng(q2), png1 = encodePng(q1), key = `ui2_${prefix}${p.name}`;
    files.set(`2x/${key}.png`, png2); files.set(`1x/${key}.png`, png1);
    let nine = null;
    // vạch cắt chừa phần giữa ở CẢ hai bản: 2 × ⌈vạch 2× / 2⌉ < cạnh ngắn 1× (mảnh thấp như tab 40 → 20 điểm không còn ruột nếu vạch 2× ≥ 19)
    if (p.stretch) nine = Math.min(suggestNine(q2).nine, 2 * Math.floor((Math.min(q1.w, q1.h) - 1) / 2));
    pieces.push({
      key, name: p.name, kind: kind.id, sheet: name, set: p.set ?? null, state: p.state ?? null, budget: kind.group,
      size: { x2: [q2.w, q2.h], x1: [q1.w, q1.h] }, grid: { master: kit.grid.master, div: round(check.div, 2), source: check.size },
      nine: nine == null ? null : { x2: nine, x1: Math.ceil(nine / 2) }, mirror: mirrorOf(p), bytes: { x2: png2.length, x1: png1.length }, hash: sha(png2),
    });
  }
  // vạch cắt chung trong một bộ trạng thái (nút có 4–5 ảnh dùng chung một vạch)
  const groups = {};
  for (const p of pieces) {
    if (!p.set) continue;
    const g = groups[p.set] ?? (groups[p.set] = { kind: kind.id, states: {}, nine: null });
    g.states[p.state] = p.key;
    if (p.nine) g.nine = { x2: Math.max(g.nine?.x2 ?? 0, p.nine.x2), x1: Math.max(g.nine?.x1 ?? 0, p.nine.x1) };
  }
  for (const p of pieces) if (p.set && groups[p.set].nine) p.nine = { ...groups[p.set].nine };

  const budget = budgetOf(kit, pieces);
  for (const o2 of budget.over) warnings.push(`riêng tờ này đã vượt ngân sách: ${o2}`);
  const report = {
    sheet: name, kind: kind.id, size: check.size, level: check.level, div: round(check.div, 2), mirror, soft: check.soft ?? null, skipped: [...skip], palette: pal.length, pieces: pieces.length,
    bytes: Object.fromEntries(Object.entries(budget.groups).map(([g, t]) => [g, { x2: t.x2, x1: t.x1 }])), warnings,
  };
  return { pieces, groups, report, check, files };
}

/** Gộp mảnh vừa cắt vào manifest (thay mảnh cùng khoá); lỗi nếu khoá trùng với mảnh của tờ khác hoặc tổng vượt ngân sách. */
export function mergeIntoKit(kit, cut) {
  const old = new Map(kit.pieces.map((p) => [p.key, p]));
  for (const p of cut.pieces) {
    const prev = old.get(p.key);
    if (prev && prev.sheet !== p.sheet) throw new Error(`khoá ${p.key} đã thuộc tờ ${prev.sheet} (${prev.kind}); dùng --prefix để đặt tên khác`);
    old.set(p.key, p);
  }
  const merged = [...old.values()].sort((a, b) => (a.key < b.key ? -1 : 1)), budget = budgetOf(kit, merged);
  if (budget.over.length) throw new Error(`vượt ngân sách KB, không ghi manifest: ${budget.over.join("; ")}`);
  return { ...kit, pieces: merged, groups: { ...kit.groups, ...cut.groups } };
}

// ---------- CLI ----------
function parseArgs(argv) {
  const o = { files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], next = () => argv[++i];
    if (a === "--out") o.out = next();
    else if (a === "--kind") o.kindId = next().toUpperCase();
    else if (a === "--div") o.div = +next();
    else if (a === "--colors") o.colors = +next();
    else if (a === "--palette") o.palette = next();
    else if (a === "--no-mirror") o.mirror = false;
    else if (a === "--mirror") o.mirror = true;
    else if (a === "--names") o.names = next().split(",");
    else if (a === "--prefix") o.prefix = next();
    else if (a === "--force") o.force = true;
    else if (a === "--soft") o.soft = true;
    else if (a === "--skip") o.skip = next().split(",");
    else if (a === "--write-manifest") o.write = true;
    else if (a === "--budget") o.budget = true;
    else if (a.startsWith("--")) throw new Error(`tùy chọn lạ: ${a}`);
    else o.files.push(a);
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2)), kit = loadKit();
    if (o.budget) {
      const b = budgetOf(kit);
      for (const [g, t] of Object.entries(b.groups)) console.log(`${g}: ${t.count} mảnh · 2× ${(t.x2 / 1000).toFixed(1)} KB · 1× ${(t.x1 / 1000).toFixed(1)} KB · ngân sách ${(t.limit / 1000).toFixed(1)} KB`);
      if (b.over.length) { console.error("VƯỢT: " + b.over.join("; ")); process.exit(1); }
      process.exit(0);
    }
    if (o.files.length !== 1 || !o.out) {
      console.error("Dùng: node tools/assets/ui-sheet-cut.mjs <tờ.png> --out <thư mục> [--kind F|N|O|T|I|D] [--div N] [--colors 32] [--palette auto|gpl|<gpl>] [--no-mirror] [--names a,b] [--prefix p_] [--soft] [--skip a,b] [--force] [--write-manifest]   |   --budget");
      process.exit(2);
    }
    const file = o.files[0];
    if (!existsSync(file)) throw new Error(`không có tờ ${file}`);
    const name = path.basename(file, ".png");
    let cut;
    try { cut = cutUiSheet({ ...o, img: readPng(file), name, kit }); }
    catch (e) {
      if (e.check) { writeReport(e.check, o.out); const d = draftErrorLine(e.check); if (d) console.error(d); console.error(e.message); process.exit(1); }
      throw e;
    }
    mkdirSync(path.join(o.out, "2x"), { recursive: true }); mkdirSync(path.join(o.out, "1x"), { recursive: true });
    for (const [f, buf] of cut.files) writeFileSync(path.join(o.out, f), buf);
    writeFileSync(path.join(o.out, "manifest-entry.json"), JSON.stringify({ pieces: cut.pieces, groups: cut.groups }, null, 2) + "\n");
    writeFileSync(path.join(o.out, "_report.json"), JSON.stringify(cut.report, null, 2) + "\n");
    writeReport(cut.check, o.out);
    console.log(`${name} [${cut.report.kind}]: ${cut.pieces.length} mảnh, hạ ${cut.report.div}×, ${cut.report.palette} màu${cut.report.mirror ? ", dựng gương" : ""} → ${o.out}`);
    for (const w of cut.report.warnings) console.warn(`  ! ${w}`);
    for (const i of cut.check.issues) if (i.sev !== "note") console.warn(`  ! ${i.code} ${i.where}: ${i.msg}`);
    if (o.write) { saveKit(mergeIntoKit(kit, cut), KIT_JSON); console.log(`Đã ghi ${cut.pieces.length} mảnh vào ${path.relative(process.cwd(), KIT_JSON)}`); }
  } catch (e) { console.error(e.message); process.exit(2); }
}
