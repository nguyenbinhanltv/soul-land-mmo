// Cắt lại HÀNG LOẠT mọi loài trong art/src/beast-anim bằng cutter v2, CHỈ ĐỂ CHẠY THỬ (#864, theo dõi #861).
//   node tools/assets/beast-recut-all.mjs --out <thư mục ngoài repo> [--only a,b] [--scale loài=0.55]... [--compare] [--no-write]
// Không bao giờ ghi vào shared/assets hay art/src: chỉ ghi <out>/<loài>/{<loài>_anim.png, manifest-entry.json, _report.json} và
// <out>/_tom-tat.json + _tom-tat.md (hệ số thu tự động vs dùng, kiểu lưới, số cảnh báo theo mức). Nhập lại vào game vẫn làm tay từng loài
// (cắt từng loài + beast-sheet-preview + orchestrator duyệt); công cụ này không làm bước đó.
//   --compare : cắt thêm bằng cách cũ (lưới đều, một hệ số chung) để so số cảnh báo trước / sau.
//   --scale   : đặt tay hệ số cho một loài (vd Ám Kim: --scale am_kim_khung_trao_hung=0.55), như khi nhập thật.
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, encodePng, ROOT } from "./lib.mjs";
import { cutSpecies } from "./beast-sheet-cut.mjs";
import { sheetFiles } from "./beast-sheet-check.mjs";

const SRC = path.join(ROOT, "art", "src", "beast-anim");

function loadSheets(id, src = SRC) {
  const files = sheetFiles(path.join(src, id)), sheets = {};
  for (const f of files) sheets[path.basename(f, ".png").replace(/^to/, "")] = readPng(f);
  return sheets;
}

/** Cắt một loài (không ghi file). Trả về { rep, res } hoặc { error }. */
export function recutOne(id, opt = {}, src = SRC) {
  try {
    const sheets = loadSheets(id, src);
    if (!Object.keys(sheets).length) return { error: "không có tờ RAW" };
    const res = cutSpecies({ species: id, sheets, ...opt });
    return { res, rep: res.report };
  } catch (e) { return { error: e.message }; }
}

const row = (id, r, old) => {
  if (r.error) return { id, error: r.error };
  const rep = r.rep, s = rep.summary, si = rep.scaleInfo;
  return {
    id, frames: rep.frames, missing: rep.missing, grid: Object.values(rep.sheets).map((x) => x.grid).join("/"),
    scaleAuto: si.auto, scaleUsed: si.used, suggested: si.suggested, summary: { block: s.block, warn: s.warn, info: s.info, total: s.total }, byCode: s.byCode,
    before: old && !old.error ? { frames: old.rep.frames, missing: old.rep.missing, scaleUsed: old.rep.scaleInfo.used, block: old.rep.summary.block, warn: old.rep.summary.warn, info: old.rep.summary.info, total: old.rep.summary.total, byCode: old.rep.summary.byCode } : undefined,
  };
};

export function toMarkdown(rows, compare) {
  const L = ["# Cắt lại hàng loạt (chạy thử, không nhập vào game)", "", `| Loài | Khung | Lưới | Hệ số tự động | Dùng | Đề xuất | block | warn | info |${compare ? " Trước (block/warn/info, tổng) |" : ""}`, `|---|---|---|---|---|---|---|---|---|${compare ? "---|" : ""}`];
  for (const r of rows) {
    if (r.error) { L.push(`| ${r.id} | — | — | — | — | — | — | — | ${r.error} |${compare ? " |" : ""}`); continue; }
    const b = r.before;
    L.push(`| ${r.id} | ${r.frames} | ${r.grid} | ${r.scaleAuto} | ${r.scaleUsed} | ${r.suggested ?? ""} | ${r.summary.block} | ${r.summary.warn} | ${r.summary.info} |${compare ? ` ${b ? `${b.block}/${b.warn}/${b.info}, ${b.total}` : ""} |` : ""}`);
  }
  const ok = rows.filter((r) => !r.error), sum = (f) => ok.reduce((t, r) => t + f(r), 0);
  L.push("", `Tổng sau: ${sum((r) => r.summary.total)} cảnh báo (${sum((r) => r.summary.block)} block, ${sum((r) => r.summary.warn)} warn, ${sum((r) => r.summary.info)} info) / ${ok.length} loài.`);
  if (compare) L.push(`Tổng trước (lưới đều, một hệ số): ${sum((r) => r.before?.total ?? 0)} cảnh báo.`);
  return L.join("\n") + "\n";
}

function parseArgs(argv) {
  const o = { scales: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") o.out = argv[++i];
    else if (a === "--only") o.only = argv[++i].split(",");
    else if (a === "--scale") { const [id, v] = argv[++i].split("="); o.scales[id] = +v; }
    else if (a === "--compare") o.compare = true;
    else if (a === "--no-write") o.noWrite = true;
    else throw new Error(`tùy chọn lạ: ${a}`);
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    if (!o.out) { console.error("Dùng: node tools/assets/beast-recut-all.mjs --out <thư mục ngoài repo> [--only a,b] [--scale loài=S]... [--compare] [--no-write]"); process.exit(2); }
    const rel = path.relative(path.resolve(ROOT).toLowerCase(), path.resolve(o.out).toLowerCase());
    if (!rel.startsWith("..") && !path.isAbsolute(rel)) throw new Error("--out không được nằm trong thư mục repo (công cụ chỉ chạy thử, ghi ra ngoài repo)");
    const ids = o.only ?? readdirSync(SRC, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort(), rows = [];
    for (const id of ids) {
      const opt = o.scales[id] ? { scale: o.scales[id] } : {}, r = recutOne(id, opt);
      const old = o.compare ? recutOne(id, { ...opt, grid: "uniform", anchorBlocks: false }) : undefined;
      rows.push(row(id, r, old));
      if (r.error) { console.log(`${id}: LỖI ${r.error}`); continue; }
      if (!o.noWrite) {
        const dir = path.join(o.out, id); mkdirSync(dir, { recursive: true });
        writeFileSync(path.join(dir, `${id}_anim.png`), encodePng(r.res.sheet));
        writeFileSync(path.join(dir, "manifest-entry.json"), JSON.stringify(r.res.entry, null, 2) + "\n");
        writeFileSync(path.join(dir, "_report.json"), JSON.stringify(r.rep, null, 2) + "\n");
      }
      const x = rows[rows.length - 1];
      console.log(`${id}: ${x.frames} khung, lưới ${x.grid}, hệ số ${x.scaleAuto}→${x.scaleUsed}${x.suggested ? ` (đề xuất ${x.suggested})` : ""}, ${x.summary.block} block / ${x.summary.warn} warn / ${x.summary.info} info${x.before ? ` (trước ${x.before.total})` : ""}`);
    }
    mkdirSync(o.out, { recursive: true });
    writeFileSync(path.join(o.out, "_tom-tat.json"), JSON.stringify(rows, null, 2) + "\n");
    writeFileSync(path.join(o.out, "_tom-tat.md"), toMarkdown(rows, o.compare));
    console.log(`Đã ghi tóm tắt vào ${o.out}`);
  } catch (e) { console.error(e.message); process.exit(2); }
}
