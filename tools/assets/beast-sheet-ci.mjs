// CI nhẹ cho tờ hoạt ảnh hồn thú (#866, theo dõi #861; docs/ops/ci.md mục "CI nhẹ cho tờ hồn thú"): không cần Chrome / server / bot.
//   node tools/assets/beast-sheet-ci.mjs --files <danh-sách-file-đổi.txt> --out <thư mục> [--summary <file.md>]
//   node tools/assets/beast-sheet-ci.mjs --local [--staged]   (ở máy, #971: tự lấy file đổi từ git; --staged chỉ file đã add; không ghi artifact)
//   node tools/assets/beast-sheet-ci.mjs --species phong_lang,hac_boi_da_tru --out <thư mục>
// Loài cần kiểm = loài có tờ toA..toE.png hoặc turnaround.png đổi (art/src/beast-anim/<loài>/to?.png; candidates/*.png không kiểm; đổi NGUON.md / prompt không kích hoạt). Chỉ đổi công cụ
// (tools/assets/beast-sheet-*) thì kiểm mọi loài chỉ để báo cáo, KHÔNG chặn (dữ liệu cũ còn loài chưa đạt).
// Chạy checkSpecies (beast-sheet-check.mjs) rồi gom tóm tắt cho job summary; ghi <out>/<loài>-check.json|md + tờ liên hệ làm artifact.
// CHẶN (thoát mã 1) chỉ khi: cỡ ngoài tập, nền ngoài dung sai, thiếu khung / hình dính, không dò được lưới. Còn lại chỉ cảnh báo trong bảng.
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT } from "./lib.mjs";
import { allSheets, checkSpecies, draftErrorLine, liveIssues, writeReport } from "./beast-sheet-check.mjs";
import { localChangedFiles, SIZE_HINT } from "./sheet-local.mjs";

const ANIM_DIR = "art/src/beast-anim/";
const TOOL_RE = /^tools\/assets\/beast-sheet-[^/]+$/;
/** Số loài tối đa ghi tờ liên hệ vào artifact (còn lại chỉ có bảng) để artifact không phình. */
export const MAX_IMAGE_SPECIES = 12;

/** Mã phát hiện chặn CI: kích thước, nền, lưới, hình dính, và `so-hinh` khi thiếu khung (thừa hình chỉ cảnh báo). */
export function isCiBlocker(issue) {
  if (issue.sev !== "block") return false;
  if (issue.code === "so-hinh") return /thiếu khung/.test(issue.msg);
  return ["kich-thuoc", "nen", "luoi", "hinh-dinh"].includes(issue.code);
}

/** Từ danh sách file PR đổi → { species: loài có tờ đổi, toolsChanged }. */
export function changedFromFiles(files) {
  const species = new Set();
  let toolsChanged = false;
  for (const raw of files) {
    const f = raw.trim().replace(/\\/g, "/");
    if (f.startsWith(ANIM_DIR)) { const m = /^([^/]+)\/(?:to[A-E]|turnaround)\.png$/.exec(f.slice(ANIM_DIR.length)); if (m) species.add(m[1]); }
    else if (TOOL_RE.test(f)) toolsChanged = true;
  }
  return { species: [...species].sort(), toolsChanged };
}

/** Kiểm một loài → hàng tóm tắt (blockers: phát hiện chặn CI; warns: các phát hiện khác ở mức chặn / nhẹ của công cụ). */
export function evaluate(id, dir) {
  const r = checkSpecies(id, dir ? { dir } : {});
  const all = allSheets(r).flatMap((s) => liveIssues(s, r.dirOwned).map((i) => ({ ...i, sheet: s.sheet })));
  const blockers = all.filter(isCiBlocker), warns = all.filter((i) => i.sev !== "note" && !isCiBlocker(i));
  return { id, r, blockers, warns };
}

/** Tóm tắt markdown cho job summary. */
export function summaryMarkdown(rows, { skipped = [], toolsOnly = false } = {}) {
  const L = ["## Kiểm tờ hoạt ảnh hồn thú", ""];
  if (toolsOnly) L.push("PR chỉ đổi công cụ `tools/assets/beast-sheet-*`: kiểm mọi loài để bắt hồi quy, chỉ báo cáo, không chặn (không ghi tờ liên hệ).", "");
  const bad = rows.filter((x) => x.blockers.length);
  L.push(bad.length ? `**${toolsOnly ? "Có" : "CHẶN:"} ${bad.length} loài có lỗi mức chặn CI${toolsOnly ? " (dữ liệu cũ, không chặn PR này)" : ""}.**` : "Không có lỗi chặn CI.", "", "| Loài | Mức công cụ | Chặn CI | Cảnh báo |", "|---|---|---|---|");
  for (const x of rows) L.push(`| ${x.id} | ${x.r.level} | ${x.blockers.length} | ${x.warns.length} |`);
  for (const x of rows) {
    if (!x.blockers.length && !x.warns.length) continue;
    L.push("", `### ${x.id}`);
    for (const i of x.blockers) L.push(`- ⛔ **chặn** \`${i.code}\` ${i.sheet} ${i.where}: ${i.msg}`);
    for (const i of x.warns) L.push(`- ⚠ \`${i.code}\` ${i.sheet} ${i.where}: ${i.msg}`);
    const drafts = allSheets(x.r).map(draftErrorLine).filter(Boolean);
    if (drafts.length) L.push("", "Dòng `LỖI:` nháp (soát bằng mắt trước khi dán vào NGUON.md):", "", "```", ...drafts, "```");
  }
  if (skipped.length) L.push("", `Bỏ qua (không còn tờ toA.png… trong thư mục, ví dụ vừa xóa): ${skipped.join(", ")}.`);
  L.push("", "Hướng mặt (`n` / `ne` lộ mặt), hurt ngửa bụng, die xoay: công cụ không kiểm; xem tờ liên hệ trong artifact `beast-check`, hoặc chạy `node tools/assets/beast-sheet-preview.mjs` để xem trang xoay vòng hướng.", "");
  return L.join("\n");
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--local") o.local = true;
    else if (a === "--staged") o.staged = true;
    else if (a === "--files") o.files = argv[++i];
    else if (a === "--species") o.species = argv[++i].split(",").filter(Boolean);
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--summary") o.summary = argv[++i];
    else throw new Error(`tùy chọn lạ: ${a}`);
  }
  return o;
}

/** Chế độ ở máy (#971): cùng changedFromFiles / evaluate / isCiBlocker với CI; in `LỖI:` + cách sửa, thoát 1 nếu có lỗi chặn. */
export function runLocal({ staged = false } = {}) {
  const ch = changedFromFiles(localChangedFiles({ staged, paths: [ANIM_DIR] }));
  const bad = [];
  for (const id of ch.species) {
    if (!existsSync(path.join(ROOT, ANIM_DIR, id))) continue;
    let x;
    try { x = evaluate(id); } catch (e) { if (/không có tờ/.test(e.message)) continue; throw e; }
    for (const i of x.blockers) bad.push(`LỖI: ${id}/${i.sheet} — ${i.where} — ${i.msg}`);
  }
  if (!bad.length) { console.log(`[beast-sheet] ${ch.species.length} loài có tờ đổi: không có lỗi chặn CI.`); return 0; }
  console.error(`[beast-sheet] tờ hồn thú sẽ làm job CI beast-sheet-check đỏ:\n${bad.join("\n")}\n${SIZE_HINT}`);
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    if (o.local) process.exit(runLocal(o));
    if (!o.out || (!o.files && !o.species)) { console.error("Dùng: node tools/assets/beast-sheet-ci.mjs (--files <file> | --species a,b) --out <thư mục> [--summary <file.md>]"); process.exit(2); }
    let species = o.species, toolsOnly = false;
    if (!species) {
      const ch = changedFromFiles(readFileSync(o.files, "utf8").split(/\r?\n/).filter(Boolean));
      species = ch.species;
      if (!species.length && ch.toolsChanged) {
        toolsOnly = true;
        species = readdirSync(path.join(ROOT, "art", "src", "beast-anim"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
      }
    }
    const rows = [], skipped = [];
    for (const id of species) {
      if (!existsSync(path.join(ROOT, ANIM_DIR, id))) { skipped.push(id); continue; }
      try { rows.push(evaluate(id)); } catch (e) { if (/không có tờ/.test(e.message)) skipped.push(id); else throw e; }
    }
    rows.forEach((x, n) => { if (!toolsOnly && n < MAX_IMAGE_SPECIES) writeReport(x.r, path.join(o.out, x.id), { images: true }); });
    mkdirSync(o.out, { recursive: true });
    const md = summaryMarkdown(rows, { skipped, toolsOnly });
    writeFileSync(path.join(o.out, "tom-tat.md"), md);
    const sum = o.summary ?? process.env.GITHUB_STEP_SUMMARY;
    if (sum) appendFileSync(sum, md + "\n");
    for (const x of rows) console.log(`${x.blockers.length ? "CHAN" : "ok  "} ${x.id}: ${x.r.level}, chặn CI ${x.blockers.length}, cảnh báo ${x.warns.length}`);
    const blocked = toolsOnly ? [] : rows.filter((x) => x.blockers.length);
    if (blocked.length) { console.error(`Chặn: ${blocked.map((x) => x.id).join(", ")}`); process.exit(1); }
    console.log(`Đạt: ${rows.length} loài (${skipped.length} bỏ qua).`);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}
