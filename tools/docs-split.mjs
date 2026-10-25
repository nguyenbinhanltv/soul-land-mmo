// Tách cơ học GAME_DESIGN.md thành nhiều file theo MỎ NEO (không theo số dòng), #619 bước D1.
//   node tools/docs-split.mjs --verify              -> tách trong RAM, ghép lại từ các file đích, so từng byte với nguồn: "OK n/n mục"
//   node tools/docs-split.mjs --out <thư mục>       -> ghi kết quả tách (GAME_DESIGN.md mới có mục lục + file đích) vào thư mục
//   node tools/docs-split.mjs --apply               -> ghi thẳng vào repo (bước B2 của D1, trong khung đóng băng)
//   node tools/docs-split.mjs --toc                 -> chỉ in mục lục "mục → file"
//   tuỳ chọn: --src <GAME_DESIGN.md> (mặc định ở gốc repo), --map <json> (mặc định tools/docs-split.map.json)
// Ánh xạ ở tools/docs-split.map.json: mỗi đoạn mở bằng dòng có tiền tố "a" (40 ký tự đầu của dòng, hoặc cả dòng tiêu đề)
// và kéo tới mỏ neo kế tiếp. Chỉ chuyển nguyên văn, không sửa nội dung. Đổi đích / gộp file: sửa "to" hoặc "aliases".
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
export const TOC_BEGIN = "<!-- docs-split:muc-luc:bat-dau -->";
export const TOC_END = "<!-- docs-split:muc-luc:ket-thuc -->";
const MAX_KB = 30;

// Phần do script sinh dùng cùng kiểu xuống dòng với nguồn (git autocrlf trên Windows cho CRLF).
let EOL = "\n";
const setEol = (text) => { EOL = text.includes("\r\n") ? "\r\n" : "\n"; };
const nl = (s) => s.replace(/\n/g, EOL);
const blankEnd = (t) => /\n\r?\n$/.test(t);
const headerOf = (title) =>
  nl(`# ${title}\n\n<!-- Tách cơ học từ GAME_DESIGN.md (D1, #619): nguyên văn, chưa viết lại; số mục và tên mục con giữ nguyên. -->\n\n`);
const lineOf = (s, i) => s.slice(0, i).split("\n").length; // số dòng (1) của vị trí byte i
const stripCr = (s) => s.replace(/\r$/, "");

/** Dòng nào bắt đầu bằng mỏ neo (so sánh theo ký tự Unicode, bỏ \r cuối dòng). */
const matches = (line, anchor) => stripCr(line).startsWith(anchor);

/** Cắt nguồn thành các đoạn theo mỏ neo, trả [{idx, start, end, text, to, line}] phủ kín nguồn (đoạn đầu nhận phần trước mỏ neo đầu). */
export function splitSource(src, map) {
  const aliases = map.aliases ?? {};
  const resolve = (to) => aliases[to] ?? to;
  const lines = src.split("\n");
  const off = [0];
  for (const l of lines) off.push(off[off.length - 1] + l.length + 1);
  const found = [];
  let cur = 0;
  const missing = [];
  for (const seg of map.segments) {
    let i = cur;
    while (i < lines.length && !matches(lines[i], seg.a)) i++;
    if (i >= lines.length) { missing.push(seg.a); continue; }
    found.push({ line: i, to: resolve(seg.to), a: seg.a });
    cur = i + 1;
  }
  if (missing.length) {
    throw new Error(`Không tìm thấy ${missing.length} mỏ neo (theo thứ tự) trong nguồn:\n  ` + missing.map((m) => JSON.stringify(m)).join("\n  "));
  }
  const segs = found.map((f, k) => {
    const start = k === 0 ? 0 : off[f.line];
    const end = k + 1 < found.length ? off[found[k + 1].line] : src.length;
    return { idx: k, start, end: Math.min(end, src.length), text: src.slice(start, Math.min(end, src.length)), to: f.to, a: f.a };
  });
  return segs;
}

/** Tên ngắn của đoạn từ dòng mở: bỏ "#", dấu đậm, cắt ở " (" hoặc ":" . */
function nameOf(a) {
  const t = a.replace(/^(#+\s+|-\s+|\*\*)/, "").replace(/^\d+(?:\.\d+)?\.?\s+/, "");
  return t.split(/ \(|:|\*\*/)[0].replace(/[.`\s-]+$/, "").trim();
}

/** Mục lục "mục → file": gom các đoạn liền nhau cùng (mục, file); dòng đầu là dòng trong file đích. */
export function buildToc(segs, map) {
  const rows = [];
  const rowMap = new Map();
  const secTitle = new Map();
  let sec = null;
  for (const s of segs) {
    const m = stripCr(s.text.split("\n")[0]).match(/^#{2,3} (\d+(?:\.\d+)?)\.? (.+)$/);
    if (m) { sec = m[1]; if (!secTitle.has(sec)) secTitle.set(sec, m[2].trim()); }
    s.sec = sec;
  }
  const fileLines = new Map();
  for (const s of segs) {
    const isHead = s.to === map.head;
    if (!fileLines.has(s.to)) fileLines.set(s.to, isHead ? 0 : headerOf(map.files[s.to]?.title ?? s.to).split("\n").length - 1);
    s.fline = fileLines.get(s.to) + 1;
    fileLines.set(s.to, fileLines.get(s.to) + s.text.split("\n").length - (s.text.endsWith("\n") ? 1 : 0));
  }
  for (const s of segs) {
    if (!s.sec) continue;
    const key = s.sec + "|" + s.to; // gom mọi đoạn cùng (mục, file); dòng đầu = đoạn đầu tiên
    let row = rowMap.get(key);
    if (!row) { row = { sec: s.sec, to: s.to, line: s.fline, names: [] }; rowMap.set(key, row); rows.push(row); }
    row.names.push(nameOf(s.a));
  }
  const out = [
    TOC_BEGIN,
    "## Mục lục: số mục → file",
    "",
    "Code và tài liệu trích dẫn theo số mục (\"mục 5.3\", \"mục 6 \"Nhiều kênh\"\"). Số mục và tên mục con giữ nguyên trong file đích; bảng dưới cho biết mục nằm ở file nào và từ dòng nào.",
    "",
    "| Mục | Tên | File | Dòng đầu | Mục con |",
    "|---|---|---|---:|---|",
  ];
  for (const r of rows) {
    const own = r.to === map.head;
    const names = r.names.filter((n, i) => n && r.names.indexOf(n) === i && n !== secTitle.get(r.sec)).join("; ");
    out.push(`| ${r.sec} | ${secTitle.get(r.sec).replace(/\|/g, "/")} | ${own ? "(file này)" : `[${r.to}](${r.to})`} | ${own ? "–" : r.line} | ${names.replace(/\|/g, "/")} |`);
  }
  out.push("", TOC_END, "", "");
  return nl(out.join("\n"));
}

/** Dựng nội dung các file đích (Map đường dẫn -> văn bản). */
export function buildOutputs(src, map) {
  setEol(src);
  const segs = splitSource(src, map);
  const toc = buildToc(segs, map);
  const outs = new Map();
  let tocDone = false;
  for (const s of segs) {
    const isHead = s.to === map.head;
    if (!outs.has(s.to)) outs.set(s.to, isHead ? "" : headerOf(map.files[s.to]?.title ?? s.to));
    outs.set(s.to, outs.get(s.to) + s.text);
    if (isHead && !tocDone) { outs.set(s.to, outs.get(s.to) + (blankEnd(s.text) ? "" : EOL) + toc); tocDone = true; }
  }
  return { segs, outs, toc };
}

/** Ghép lại nguồn từ các file đích (đọc qua getFile), tách ngược bằng cùng mỏ neo. Trả {text, ok, total}. */
export function reassemble(segs, map, getFile) {
  setEol(segs[0].text);
  const byFile = new Map();
  for (const s of segs) { if (!byFile.has(s.to)) byFile.set(s.to, []); byFile.get(s.to).push(s); }
  const pieces = new Array(segs.length);
  for (const [to, list] of byFile) {
    let body = getFile(to);
    if (body == null) throw new Error(`Thiếu file đích ${to}`);
    if (to === map.head) {
      const b = body.indexOf(TOC_BEGIN), e = body.indexOf(TOC_END);
      if (b < 0 || e < 0) throw new Error(`${to}: thiếu mục lục`);
      const after = e + TOC_END.length;
      const pad = blankEnd(list[0].text) ? 0 : EOL.length; // dòng trống thêm trước mục lục
      body = body.slice(0, b - pad) + body.slice(after + 2 * EOL.length);
    } else {
      const h = headerOf(map.files[to]?.title ?? to);
      if (!body.startsWith(h)) throw new Error(`${to}: header không khớp`);
      body = body.slice(h.length);
    }
    const lines = body.split("\n");
    const off = [0];
    for (const l of lines) off.push(off[off.length - 1] + l.length + 1);
    let cur = 0;
    const starts = [];
    for (const s of list) {
      let i = cur;
      while (i < lines.length && !matches(lines[i], s.a)) i++;
      if (i >= lines.length) throw new Error(`${to}: mất mỏ neo ${JSON.stringify(s.a)}`);
      starts.push(i); cur = i + 1;
    }
    list.forEach((s, k) => {
      const from = k === 0 ? 0 : off[starts[k]];
      const end = k + 1 < list.length ? off[starts[k + 1]] : body.length;
      pieces[s.idx] = body.slice(from, Math.min(end, body.length));
    });
  }
  return pieces;
}

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : def;
}
const has = (n) => process.argv.includes(n);

function writeAll(dir, outs) {
  for (const [rel, text] of outs) {
    const p = path.join(dir, rel);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, text);
  }
}

function main() {
  const srcPath = path.resolve(arg("--src", path.join(root, "GAME_DESIGN.md")));
  const mapPath = path.resolve(arg("--map", path.join(root, "tools/docs-split.map.json")));
  const src = readFileSync(srcPath, "utf8");
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  const { segs, outs, toc } = buildOutputs(src, map);

  if (has("--toc")) { process.stdout.write(toc); return; }

  const outDir = arg("--out", null);
  if (has("--apply")) writeAll(root, outs);
  else if (outDir) writeAll(path.resolve(outDir), outs);

  const sizes = [...outs].map(([p, t]) => [p, Buffer.byteLength(t) / 1024]);
  const big = sizes.filter(([, kb]) => kb > MAX_KB);

  if (has("--verify")) {
    let tmp = null, dir = null;
    if (has("--apply")) dir = root; else if (outDir) dir = path.resolve(outDir);
    else { tmp = mkdtempSync(path.join(tmpdir(), "docs-split-")); dir = tmp; writeAll(dir, outs); }
    let pieces;
    try {
      pieces = reassemble(segs, map, (to) => { const p = path.join(dir, to); return existsSync(p) ? readFileSync(p, "utf8") : null; });
    } finally { if (tmp) rmSync(tmp, { recursive: true, force: true }); }
    const ok = segs.filter((s) => pieces[s.idx] === s.text).length;
    const whole = pieces.join("") === src;
    if (ok === segs.length && whole) console.log(`OK ${ok}/${segs.length} mục`);
    else {
      const bad = segs.filter((s) => pieces[s.idx] !== s.text).slice(0, 5);
      console.error(`LỖI ${ok}/${segs.length} mục khớp${whole ? "" : "; ghép lại KHÔNG trùng nguồn"}`);
      for (const s of bad) console.error(`  đoạn ${s.idx} (${s.to}): ${JSON.stringify(s.a)}`);
      process.exit(1);
    }
  }
  if (!has("--toc") && !has("--quiet")) {
    console.log(`${segs.length} đoạn → ${outs.size} file; GAME_DESIGN.md mới ${(Buffer.byteLength(outs.get(map.head)) / 1024).toFixed(1)} KB`);
    if (big.length) console.log(`⚠ file > ${MAX_KB} KB: ` + big.map(([p, kb]) => `${p} ${kb.toFixed(1)}`).join(", "));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error(e.message); process.exit(1); }
}
