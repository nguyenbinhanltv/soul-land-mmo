// Kiểm tham chiếu tài liệu (#619, bước A5 của D1): chạy tay ở D1, thành bước của `npm run check` ở D6.
//   node tools/docs-check.mjs                       -> kiểm repo hiện tại
//   node tools/docs-check.mjs --overlay <thư mục>   -> như trên nhưng file trong thư mục (kết quả `docs-split --out`) đè / bổ sung lên repo
//   tuỳ chọn: --root <thư mục> (mặc định gốc repo), --list <n> (số dòng liệt kê mỗi nhóm, mặc định 15), --json, --warn (luôn thoát 0)
// (a) mọi "mục N(.M)" nhắc trong *.ts *.mjs *.md *.yml *.json phải là một mục có thật (tiêu đề ##/### của GAME_DESIGN.md,
//     hoặc hàng của mục lục khi GAME_DESIGN.md đã tách);
// (b) (khi đã tách, kiểm trong CẢ file mục lục trỏ tới nên lỏng hơn chế độ tiêu đề) mọi `mục N "Tên"` phải tìm thấy Tên (tiêu đề, chữ đậm hoặc đầu dòng) trong phần của mục N (khi đã tách: trong các file mục lục trỏ tới);
// (c) mọi đường dẫn `docs/…` nhắc trong file phải tồn tại;
// (d) tên hằng IN_HOA_GẠCH trong backtick ở docs/design|tech|art phải xuất hiện trong code (*.ts *.mjs);
// (e) link markdown tương đối [chữ](đường/dẫn.md#neo) trong *.md phải trỏ tới file có thật;
// (f) cỡ file *.md (docs/**, file gốc) tối đa MAX_MD_BYTES; ngoại lệ có chủ đích ở MD_SIZE_EXCEPT (hạ dần khi tách file).
// (g) mục lục GAME_DESIGN.md đủ: mọi docs/design|tech|art/*.md phải được nhắc tới trong đó;
// Chữ "mục" nghĩa thường (mục tiêu, mục con…) không bị coi là tham chiếu vì không có số theo sau; "Danh mục / Hạng mục / Đề mục / Tiết mục N" được loại bằng lookbehind ở (a); "mục" dính chữ đứng trước cũng bị loại.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { TOC_BEGIN, TOC_END } from "./docs-split.mjs";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d; };
const has = (n) => process.argv.includes(n);

const EXT = /\.(ts|mjs|md|yml|yaml|json)$/;
const SKIP_DIR = new Set(["node_modules", ".git", "dist", "build", "artifacts"]); // ở mọi cấp
const SKIP_PATH = new Set(["art", "shared/assets"]); // chỉ đúng đường dẫn này (docs/art vẫn quét)
const SKIP_FILE = new Set(["package-lock.json", "docs-check.mjs", "docs-split.mjs", "docs-split.map.json", "docs-split.test.mjs"]);

/** Duyệt thư mục, trả đường dẫn tương đối (dấu /) của file cần quét. `art/` và `shared/assets` bị bỏ (ảnh, Tiled). */
function walk(dir, rel = "", out = []) {
  for (const e of readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name) && !SKIP_PATH.has(r)) walk(dir, r, out); }
    else if (EXT.test(e.name) && !SKIP_FILE.has(e.name) && statSync(path.join(dir, r)).size < 3e6) out.push(r);
  }
  return out;
}

/** Cỡ tối đa (byte, LF) của file .md; lớn hơn thì tách file. */
export const MAX_MD_BYTES = 48000;
/** Ngoại lệ có chủ đích: file -> cỡ tối đa. Hạ / bỏ khi tách file đó. */
export const MD_SIZE_EXCEPT = {};
const CONST_DOCS = /^docs\/(design|tech|art)\//;
const CONST_RE = /`([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)`/g;

const safeDecode = (t) => { try { return decodeURI(t); } catch { return t; } };
const norm = (s) => s.toLowerCase().replace(/[`*_"“”«»]/g, "").replace(/[:.;,\s]+$/g, "").replace(/\s+/g, " ").trim();

/** Các "ứng viên tên mục": tiêu đề, chữ đậm, và 70 ký tự đầu mỗi dòng (đã gọt dấu đánh dấu). */
function candidates(text) {
  const c = [];
  for (const line of text.split("\n")) {
    const l = line.replace(/\r$/, "");
    if (/^#+ /.test(l)) c.push(norm(l.replace(/^#+ (\d+(?:\.\d+)?\.? )?/, "")));
    for (const m of l.matchAll(/\*\*([^*]+)\*\*/g)) c.push(norm(m[1]));
    c.push(norm(Array.from(l.replace(/^[\s>*-]+/, "")).slice(0, 70).join("")));
  }
  return c;
}

export function check({ root = repoRoot, overlay = null, list = 15 } = {}) {
  const files = new Map(); // đường dẫn -> văn bản
  for (const r of walk(root)) files.set(r, readFileSync(path.join(root, r), "utf8"));
  if (overlay) for (const r of walk(overlay)) files.set(r, readFileSync(path.join(overlay, r), "utf8"));
  const exists = (rel) => existsSync(path.join(root, rel)) || (overlay && existsSync(path.join(overlay, rel)));

  const gd = files.get("GAME_DESIGN.md") ?? "";
  const tocMode = gd.includes(TOC_BEGIN);
  const sections = new Set();
  const regionOf = new Map(); // mục -> văn bản của mục (gồm mục con khi là mục nguyên)
  if (tocMode) {
    const block = gd.slice(gd.indexOf(TOC_BEGIN), gd.indexOf(TOC_END));
    const rows = [];
    for (const l of block.split("\n")) {
      const m = l.match(/^\| (\d+(?:\.\d+)?) \| .*? \| (?:\[([^\]]+)\]\([^)]+\)|\(file này\)) \|/);
      if (m) { sections.add(m[1]); rows.push([m[1], m[2] ?? "GAME_DESIGN.md"]); }
    }
    for (const sec of sections) {
      const text = new Set();
      for (const [s, f] of rows) if (s === sec || (!sec.includes(".") && s.startsWith(sec + "."))) text.add(files.get(f) ?? "");
      regionOf.set(sec, [...text].join("\n"));
    }
  } else {
    const lines = gd.split("\n");
    const heads = [];
    lines.forEach((l, i) => { const m = l.match(/^(#{2,3}) (\d+(?:\.\d+)?)\.? /); if (m) heads.push({ i, lvl: m[1].length, sec: m[2] }); });
    heads.forEach((h, k) => {
      sections.add(h.sec);
      let end = lines.length;
      for (let j = k + 1; j < heads.length; j++) if (heads[j].lvl <= h.lvl) { end = heads[j].i; break; }
      regionOf.set(h.sec, lines.slice(h.i, end).join("\n"));
    });
  }
  const candCache = new Map();
  const candOf = (sec) => { if (!candCache.has(sec)) candCache.set(sec, candidates(regionOf.get(sec) ?? "")); return candCache.get(sec); };

  const a = { total: 0, orphans: [] }, b = { total: 0, orphans: [] }, c = { total: 0, orphans: [] };
  const d = { total: 0, orphans: [] }, e = { total: 0, orphans: [] }, f = { total: 0, orphans: [] };
  // (g) mục lục đủ: mọi docs/design|tech|art/*.md phải được GAME_DESIGN.md nhắc tới (hàng mục lục khi đã tách)
  const g = { total: 0, orphans: [] };
  for (const rel of files.keys()) {
    if (!/^docs\/(design|tech|art)\/[^/]+\.md$/.test(rel)) continue;
    g.total++;
    if (!gd.includes(rel)) g.orphans.push(`${rel}  chưa có trong mục lục GAME_DESIGN.md`);
  }
  let code = "";
  for (const [rel, text] of files) if (/\.(ts|mjs)$/.test(rel)) code += text + "\n";
  const constOk = new Map();
  const hasConst = (n) => { if (!constOk.has(n)) constOk.set(n, new RegExp(`(?<![A-Za-z0-9_])${n}(?![A-Za-z0-9_])`).test(code)); return constOk.get(n); };
  for (const [rel, text] of files) {
    const lines = text.split("\n");
    if (rel.endsWith(".md") && (rel.startsWith("docs/") || !rel.includes("/"))) {
      f.total++;
      const bytes = Buffer.byteLength(text.replace(/\r/g, ""));
      const max = MD_SIZE_EXCEPT[rel] ?? MAX_MD_BYTES;
      if (bytes > max) f.orphans.push(`${rel}  ${bytes} byte > ${max}`);
    }
    let fence = false;
    lines.forEach((line, i) => {
      const at = `${rel}:${i + 1}`;
      for (const m of line.matchAll(/(?<![\p{L}])(?<!(?:[Dd]anh|[Hh]ạng|[Đđ]ề|[Tt]iết) )[Mm]ục (\d+(?:\.\d+)?)(?!\d)(?:\s+["“«]([^"”»]{2,80})["”»])?/gu)) {
        // "mục 5.3." cuối câu: bỏ dấu chấm thừa do regex không nuốt; số có dạng N.M chỉ khi theo sau là chữ số
        a.total++;
        if (!sections.has(m[1])) { a.orphans.push(`${at}  mục ${m[1]}`); continue; }
        if (m[2]) {
          b.total++;
          const want = norm(m[2]);
          if (!candOf(m[1]).some((x) => x.includes(want))) b.orphans.push(`${at}  mục ${m[1]} "${m[2]}"`);
        }
      }
      if (/^\s*```/.test(line)) fence = !fence;
      if (CONST_DOCS.test(rel) && !fence) for (const m of line.matchAll(CONST_RE)) {
        d.total++;
        if (!hasConst(m[1])) d.orphans.push(`${at}  \`${m[1]}\``);
      }
      if (rel.endsWith(".md") && !fence) for (const m of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        const t = m[1].split("#")[0];
        if (!t || /^([a-z]+:|\/)/i.test(t)) continue;
        e.total++;
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), safeDecode(t))).replace(/\/$/, "");
        if (!exists(target)) e.orphans.push(`${at}  ${m[1]}`);
      }
      for (const m of line.matchAll(/(?<![A-Za-z0-9_./-])(docs\/[A-Za-z0-9_\-./]*[A-Za-z0-9_\-/])/g)) {
        const next = line[m.index + m[0].length] ?? "";
        const prev3 = line.slice(Math.max(0, m.index - 3), m.index);
        if (/[*<{…]/.test(next) || prev3.includes("…") || /^docs\/[a-z-]*$/.test(m[1]) && next === "/" ) continue; // mẫu / thư mục gốc
        c.total++;
        if (!exists(m[1]) && !exists(m[1].replace(/\/$/, ""))) c.orphans.push(`${at}  ${m[1]}`);
      }
    });
  }
  return { mode: tocMode ? "mục-lục" : "tiêu-đề", sections: sections.size, files: files.size, a, b, c, d, e, f, g, list };
}

function main() {
  const r = check({ root: path.resolve(arg("--root", repoRoot)), overlay: arg("--overlay", null) && path.resolve(arg("--overlay")), list: +arg("--list", 15) });
  if (has("--json")) { console.log(JSON.stringify({ mode: r.mode, sections: r.sections, files: r.files, a: [r.a.total, r.a.orphans.length], b: [r.b.total, r.b.orphans.length], c: [r.c.total, r.c.orphans.length], d: [r.d.total, r.d.orphans.length], e: [r.e.total, r.e.orphans.length], f: [r.f.total, r.f.orphans.length], g: [r.g.total, r.g.orphans.length], orphans: { a: r.a.orphans, b: r.b.orphans, c: r.c.orphans, d: r.d.orphans, e: r.e.orphans, f: r.f.orphans, g: r.g.orphans } }, null, 1)); }
  else {
    console.log(`docs-check: chế độ ${r.mode} (${r.sections} mục, quét ${r.files} file)`);
    for (const [k, label, g] of [["a", "(a) tham chiếu \"mục N\" có thật", r.a], ["b", "(b) tên mục con \"mục N \"Tên\"\" tìm thấy", r.b], ["c", "(c) đường dẫn docs/… tồn tại", r.c], ["d", "(d) tên hằng trong backtick có trong code", r.d], ["e", "(e) link markdown tương đối tồn tại", r.e], ["f", "(f) cỡ file .md trong ngưỡng", r.f], ["g", "(g) mục lục GAME_DESIGN đủ file docs/design|tech|art", r.g]]) {
      console.log(`${g.orphans.length ? "✗" : "✓"} ${label}: ${g.total - g.orphans.length}/${g.total}, mồ côi ${g.orphans.length}`);
      for (const o of g.orphans.slice(0, r.list)) console.log("    " + o);
      if (g.orphans.length > r.list) console.log(`    … và ${g.orphans.length - r.list} chỗ nữa (--list ${g.orphans.length} để xem hết)`);
    }
  }
  if (!has("--warn") && [r.a, r.b, r.c, r.d, r.e, r.f, r.g].some((g) => g.orphans.length)) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
