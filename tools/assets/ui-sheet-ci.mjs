// CI nhẹ cho tờ UI Kit (#880, theo dõi #877; mẫu beast-sheet-ci.mjs của #866; docs/ops/ci.md mục "CI nhẹ cho tờ UI"): không Chrome / server / bot.
//   node tools/assets/ui-sheet-ci.mjs --files <danh-sách-file-đổi.txt> --out <thư mục> [--summary <file.md>]
//   node tools/assets/ui-sheet-ci.mjs --local [--staged]   (ở máy, #971: tự lấy file đổi từ git; --staged chỉ file đã add; không ghi artifact)
//   node tools/assets/ui-sheet-ci.mjs --sheets art/src/ui-kit/toF.png,… --out <thư mục>
// Tờ cần kiểm = file PNG đổi dưới art/src/ui-kit/ có tên suy được loại tờ (toF.png, N-2.png, BOARD.png…). Chỉ đổi công cụ / spec
// (tools/assets/ui-sheet-*, ui-kit-*, art/src/ui-kit/ui-kit.json, lessons.md) thì kiểm mọi tờ đang có chỉ để báo cáo, KHÔNG chặn.
// Chạy analyzeUiSheet (ui-sheet-check.mjs), ghi <out>/<tờ>/ (JSON, markdown, tờ liên hệ), dựng trang bộ component từ fixture C2 / UI-5 khi đổi
// công cụ (xem tay trang), và tóm tắt cho job summary.
// CHẶN (thoát mã 1) chỉ khi: cỡ ngoài tập / sai tỉ lệ, nền ngoài dung sai, thiếu mảnh / mảnh dính / thiếu trạng thái, không dò được dải. Còn lại chỉ cảnh báo.
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT } from "./lib.mjs";
import { loadKit, kindFromName } from "./ui-kit-lib.mjs";
import { analyzeUiSheet, draftErrorLine, writeReport } from "./ui-sheet-check.mjs";
import { localChangedFiles, SIZE_HINT } from "./sheet-local.mjs";

export const KIT_PREFIX = "art/src/ui-kit/";
const TOOL_RE = /^(tools\/assets\/(ui-sheet-|ui-kit-)[^/]+|art\/src\/ui-kit\/(ui-kit\.json|lessons\.md))$/;
/** Số tờ tối đa ghi tờ liên hệ vào artifact (còn lại chỉ có bảng) để artifact không phình. */
export const MAX_IMAGE_SHEETS = 12;

/** Mã phát hiện chặn CI: cỡ, nền, lưới, mảnh dính, thiếu trạng thái, và `so-hinh` khi thiếu mảnh (thừa mảnh rời chỉ cảnh báo). */
export function isCiBlocker(issue) {
  if (issue.sev !== "block") return false;
  if (issue.code === "so-hinh") return /thiếu mảnh|không có điểm vật/.test(issue.msg);
  return ["kich-thuoc", "nen", "luoi", "hinh-dinh", "trang-thai"].includes(issue.code);
}

/** Từ danh sách file PR đổi → { sheets: tờ PNG đổi, toolsChanged }. */
export function changedFromFiles(files) {
  const sheets = new Set();
  let toolsChanged = false;
  for (const raw of files) {
    const f = raw.trim().replace(/\\/g, "/");
    if (f.startsWith(KIT_PREFIX) && f.endsWith(".png") && kindFromName(f)) sheets.add(f);
    else if (TOOL_RE.test(f)) toolsChanged = true;
  }
  return { sheets: [...sheets].sort(), toolsChanged };
}

/** Mọi tờ PNG đang có dưới art/src/ui-kit/ (đệ quy, bỏ thư mục bắt đầu bằng `_`). */
export function allSheets(root = ROOT) {
  const out = [], walk = (rel) => {
    for (const d of readdirSync(path.join(root, rel), { withFileTypes: true })) {
      if (d.isDirectory() && !d.name.startsWith("_")) walk(`${rel}${d.name}/`);
      else if (d.isFile() && d.name.endsWith(".png") && kindFromName(d.name)) out.push(`${rel}${d.name}`);
    }
  };
  if (existsSync(path.join(root, KIT_PREFIX))) walk(KIT_PREFIX);
  return out.sort();
}

/** Kiểm một tờ → hàng tóm tắt. */
export function evaluate(file, kit = loadKit(), root = ROOT) {
  const name = path.basename(file, ".png"), r = analyzeUiSheet(path.resolve(root, file), { kit, name });
  const blockers = r.issues.filter(isCiBlocker), warns = r.issues.filter((i) => i.sev !== "note" && !isCiBlocker(i));
  return { file, name, r, blockers, warns };
}

/** Tóm tắt markdown cho job summary. */
export function summaryMarkdown(rows, { toolsOnly = false, skipped = [] } = {}) {
  const L = ["## Kiểm tờ UI Kit", ""];
  if (toolsOnly) L.push("PR chỉ đổi công cụ / spec UI Kit: kiểm mọi tờ đang có để bắt hồi quy, chỉ báo cáo, không chặn (không ghi tờ liên hệ).", "");
  const bad = rows.filter((x) => x.blockers.length);
  L.push(bad.length ? `**${toolsOnly ? "Có" : "CHẶN:"} ${bad.length} tờ có lỗi mức chặn CI${toolsOnly ? " (không chặn PR này)" : ""}.**` : rows.length ? "Không có lỗi chặn CI." : "Không có tờ nào để kiểm.", "");
  if (rows.length) L.push("| Tờ | Loại | Mức | Chặn CI | Cảnh báo |", "|---|---|---|---|---|");
  for (const x of rows) L.push(`| ${x.file} | ${x.r.kind} | ${x.r.level} | ${x.blockers.length} | ${x.warns.length} |`);
  for (const x of rows) {
    if (!x.blockers.length && !x.warns.length) continue;
    L.push("", `### ${x.file}`);
    for (const i of x.blockers) L.push(`- ⛔ **chặn** \`${i.code}\` ${i.where}: ${i.msg}`);
    for (const i of x.warns) L.push(`- ⚠ \`${i.code}\` ${i.where}: ${i.msg}`);
    const d = draftErrorLine(x.r);
    if (d) L.push("", "Dòng `LỖI:` nháp (soát bằng mắt trước khi dán vào NGUON.md):", "", "```", d, "```");
  }
  if (skipped.length) L.push("", `Bỏ qua (tệp không còn, ví dụ vừa xóa): ${skipped.join(", ")}.`);
  L.push("", "Công cụ không kiểm: chữ / ký tự đọc được trong ảnh (chỉ cảnh báo `chu-lac`), hoa văn sai chỗ, vật liệu / phong cách. Xem tờ liên hệ trong artifact `ui-check`, rồi trang bộ component `ui-kit-preview` khi PR đổi công cụ (skill `ui-kit`, phần DUYỆT).");
  return L.join("\n");
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--local") o.local = true;
    else if (a === "--staged") o.staged = true;
    else if (a === "--files") o.files = argv[++i];
    else if (a === "--sheets") o.sheets = argv[++i].split(",").filter(Boolean);
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--summary") o.summary = argv[++i];
    else throw new Error(`tùy chọn lạ: ${a}`);
  }
  return o;
}

/** Chế độ ở máy (#971): cùng changedFromFiles / evaluate / isCiBlocker với CI; in `LỖI:` + cách sửa, thoát 1 nếu có lỗi chặn. */
export function runLocal({ staged = false } = {}) {
  const ch = changedFromFiles(localChangedFiles({ staged, paths: [KIT_PREFIX] }));
  const kit = ch.sheets.length ? loadKit() : null, bad = [];
  for (const f of ch.sheets) {
    if (!existsSync(path.resolve(ROOT, f))) continue;
    for (const i of evaluate(f, kit).blockers) bad.push(`LỖI: ${f} — ${i.where} — ${i.msg}`);
  }
  if (!bad.length) { console.log(`[ui-sheet] ${ch.sheets.length} tờ UI Kit đổi: không có lỗi chặn CI.`); return 0; }
  console.error(`[ui-sheet] tờ UI Kit sẽ làm job CI ui-sheet-check đỏ:\n${bad.join("\n")}\n${SIZE_HINT}`);
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    if (o.local) process.exit(runLocal(o));
    if (!o.out || (!o.files && !o.sheets)) { console.error("Dùng: node tools/assets/ui-sheet-ci.mjs (--files <file> | --sheets a.png,b.png) --out <thư mục> [--summary <file.md>]"); process.exit(2); }
    let sheets = o.sheets, toolsOnly = false, toolsChanged = false;
    if (!sheets) {
      const ch = changedFromFiles(readFileSync(o.files, "utf8").split(/\r?\n/).filter(Boolean));
      sheets = ch.sheets; toolsChanged = ch.toolsChanged;
      if (!sheets.length && toolsChanged) { toolsOnly = true; sheets = allSheets(); }
    }
    const kit = loadKit(), rows = [], skipped = [];
    for (const f of sheets) { if (!existsSync(path.resolve(ROOT, f))) skipped.push(f); else rows.push(evaluate(f, kit)); }
    mkdirSync(o.out, { recursive: true });
    rows.forEach((x, n) => { if (!toolsOnly && n < MAX_IMAGE_SHEETS) writeReport(x.r, path.join(o.out, x.name), { images: true }); });
    // Trang bộ component: từ tờ không chặn (cắt trong bộ nhớ) và, khi đổi công cụ, thêm fixture C2 / UI-5 (bắt lỗi trang hỏng).
    const { sourceFromFixture, writePreview } = await import("./ui-kit-preview.mjs"), { cutUiSheet } = await import("./ui-sheet-cut.mjs");
    const sources = [];
    for (const x of toolsOnly ? [] : rows) {
      if (x.r.kind === "BOARD" || x.r.level === "chặn") continue;
      try { const cut = cutUiSheet({ img: x.r.img, name: x.name, kindId: x.r.kind, kit }); sources.push({ label: x.name, pieces: cut.pieces, groups: cut.groups, read: (rel) => cut.files.get(rel) }); }
      catch (e) { console.warn(`không cắt được ${x.file} cho trang xem trước: ${e.message.split(/\r?\n/)[0]}`); }
    }
    if (toolsChanged || toolsOnly) for (const id of ["c2", "ui5"]) sources.push(await sourceFromFixture(id));
    if (sources.length) {
      const r = writePreview(sources, path.join(o.out, "ui-kit-preview"), { title: toolsChanged || toolsOnly ? "Bộ component UI Kit (có tờ giả lập, không phải ảnh model)" : "Bộ component UI Kit" });
      console.log(`Trang bộ component: ${r.file} (${r.pieces} mảnh)`);
    }
    const md = summaryMarkdown(rows, { toolsOnly, skipped });
    writeFileSync(path.join(o.out, "tom-tat.md"), md);
    const sum = o.summary ?? process.env.GITHUB_STEP_SUMMARY;
    if (sum) appendFileSync(sum, md + "\n");
    for (const x of rows) console.log(`${x.blockers.length ? "CHAN" : "ok  "} ${x.file}: ${x.r.level}, chặn CI ${x.blockers.length}, cảnh báo ${x.warns.length}`);
    const blocked = toolsOnly ? [] : rows.filter((x) => x.blockers.length);
    if (blocked.length) { console.error(`Chặn: ${blocked.map((x) => x.file).join(", ")}`); process.exit(1); }
    console.log(`Đạt: ${rows.length} tờ (${skipped.length} bỏ qua).`);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}
