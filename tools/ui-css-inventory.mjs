// Kiểm kê màu / cỡ chữ / border-image trong CSS của client (UI Kit v2, #877 / #878). CHỈ BÁO CÁO, không chặn (luôn thoát 0);
// P8 (#886) mới nâng thành luật chặn. Luật: docs/art/ui-kit.md (token màu / chữ theo vai trò, thang chữ 10 / 12 / 24).
//   node tools/ui-css-inventory.mjs            -> bảng tóm tắt
//   node tools/ui-css-inventory.mjs --top 40   -> in nhiều dòng hơn mỗi nhóm (mặc định 15)
//   node tools/ui-css-inventory.mjs --all     -> tính cả landing.css
//   node tools/ui-css-inventory.mjs --json     -> JSON đầy đủ (so trước / sau)
//   node tools/ui-css-inventory.mjs --md <tệp> -> ghi báo cáo markdown
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "client", "src");
const argv = process.argv.slice(2);
const TOP = argv.includes("--top") ? +argv[argv.indexOf("--top") + 1] : 15;
const SCALE = new Set([10, 12, 24]); // thang chữ Galmuri (client-ui mục 6); --fs-s / --fs-m / --fs-l

// landing.css (trang giới thiệu "/", phông WenKai, luật riêng ở skill landing-page) không tính, trừ khi --all.
const files = readdirSync(srcDir).filter((f) => f.endsWith(".css") && (argv.includes("--all") || f !== "landing.css")).sort();
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")); // giữ số dòng
const lineOf = (text, i) => text.slice(0, i).split("\n").length;

/** Khối `:root{…}` (định nghĩa token) để tách "định nghĩa" khỏi "dùng". */
function rootRanges(text) {
  const out = []; const re = /:root\s*\{/g; let m;
  while ((m = re.exec(text))) {
    let d = 1, i = re.lastIndex;
    while (i < text.length && d) { if (text[i] === "{") d++; else if (text[i] === "}") d--; i++; }
    out.push([m.index, i]);
  }
  return out;
}
const inRanges = (rs, i) => rs.some(([a, b]) => i >= a && i < b);
const normHex = (h) => { h = h.toLowerCase(); return h.length === 4 ? "#" + [...h.slice(1)].map((c) => c + c).join("") : h; };

const hex = new Map(), rgba = new Map(), sizes = new Map(), tokenByColor = new Map();
let borderImages = 0, tokenUses = 0, defs = 0;
const bump = (m, k, file, line) => { const e = m.get(k) ?? { n: 0, where: [] }; e.n++; if (e.where.length < 3) e.where.push(`${file}:${line}`); m.set(k, e); };

for (const f of files) {
  const raw = readFileSync(path.join(srcDir, f), "utf8"), text = strip(raw), rr = rootRanges(text);
  // token màu khai ở :root (tên -> giá trị) để gợi ý "thay bằng var(--…)"
  for (const [a, b] of rr) for (const m of text.slice(a, b).matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g)) if (!tokenByColor.has(normHex(m[2]))) tokenByColor.set(normHex(m[2]), m[1]);
  for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b(?![\w-])/g)) {
    if (![4, 7, 9].includes(m[0].length)) continue; // bỏ id kiểu #quest
    // chỉ coi là màu khi đứng sau `:`, `,`, `(` hoặc khoảng trắng trong giá trị (không phải selector `#abc{`)
    const before = text.slice(Math.max(0, m.index - 1), m.index), after = text.slice(m.index + m[0].length, m.index + m[0].length + 1);
    if (after === "{" || after === "," && /^[\s]*[.#\w[:]/.test(text.slice(m.index + m[0].length + 1, m.index + m[0].length + 4)) && before === "\n") continue;
    if (inRanges(rr, m.index)) { defs++; continue; }
    bump(hex, normHex(m[0]), f, lineOf(text, m.index));
  }
  for (const m of text.matchAll(/\b(?:rgba?|hsla?)\(([^)]*)\)/g)) {
    if (inRanges(rr, m.index)) continue;
    bump(rgba, m[0].replace(/\s+/g, ""), f, lineOf(text, m.index));
  }
  for (const m of text.matchAll(/font-size\s*:\s*([^;}\n]+)/g)) bump(sizes, m[1].trim(), f, lineOf(text, m.index));
  for (const m of text.matchAll(/(?<![\w-])font\s*:\s*(?:(?:italic|bold|normal|[1-9]00)\s+)*([\d.]+px|var\(--fs-[sml]\))/g)) bump(sizes, m[1], f, lineOf(text, m.index));
  borderImages += (text.match(/border-image\s*:/g) ?? []).length;
  tokenUses += (text.match(/var\(--(?:paper|ink|son|wood|bg|panel|line|text|muted|accent|hp|mp|xp|warn|good|bad|plate|track)[\w-]*\)/g) ?? []).length;
}

const rank = (m) => [...m.entries()].sort((a, b) => b[1].n - a[1].n || (a[0] < b[0] ? -1 : 1)).map(([k, v]) => ({ value: k, count: v.n, where: v.where }));
const px = (v) => (/^[\d.]+px$/.test(v) ? parseFloat(v) : null);
const sizeRank = rank(sizes).map((s) => ({ ...s, onScale: s.value.startsWith("var(--fs-") || (px(s.value) !== null && SCALE.has(px(s.value))) }));
const hexRank = rank(hex).map((h) => ({ ...h, token: tokenByColor.get(h.value) ?? null }));
const rgbaRank = rank(rgba);
const sum = (r) => r.reduce((a, b) => a + b.count, 0);
const report = {
  files,
  hex: { distinct: hexRank.length, uses: sum(hexRank), withToken: hexRank.filter((h) => h.token).length, items: hexRank },
  rgba: { distinct: rgbaRank.length, uses: sum(rgbaRank), items: rgbaRank },
  fontSize: { distinct: sizeRank.length, uses: sum(sizeRank), offScale: sizeRank.filter((s) => !s.onScale).length, items: sizeRank },
  borderImage: borderImages, tokenUses, rootDefinitions: defs,
};

if (argv.includes("--json")) { console.log(JSON.stringify(report, null, 1)); process.exit(0); }

const lines = [];
const P = (s = "") => lines.push(s);
P(`# Kiểm kê CSS client (${files.join(", ")})`);
P();
P(`| Chỉ số | Giá trị |`); P(`|---|---|`);
P(`| Mã màu #hex khác nhau ngoài :root | ${report.hex.distinct} (${report.hex.uses} lần; ${report.hex.withToken} trùng một token :root) |`);
P(`| rgba()/rgb()/hsl() khác nhau ngoài :root | ${report.rgba.distinct} (${report.rgba.uses} lần) |`);
P(`| Cỡ chữ khác nhau | ${report.fontSize.distinct} (${report.fontSize.uses} lần; ${report.fontSize.offScale} ngoài thang 10 / 12 / 24) |`);
P(`| \`border-image\` | ${report.borderImage} chỗ |`);
P(`| Dùng token màu \`var(--…)\` | ${report.tokenUses} lần |`);
P();
P(`## Cỡ chữ (ngoài thang đánh dấu ✗)`); P(); P(`| Cỡ | Lần | Ví dụ |`); P(`|---|---|---|`);
for (const s of sizeRank.slice(0, Math.max(TOP, 20))) P(`| ${s.onScale ? "" : "✗ "}${s.value} | ${s.count} | ${s.where[0]} |`);
P(); P(`## Mã màu dùng nhiều nhất (→ token nếu có)`); P(); P(`| Màu | Lần | Token trùng | Ví dụ |`); P(`|---|---|---|---|`);
for (const h of hexRank.slice(0, TOP)) P(`| ${h.value} | ${h.count} | ${h.token ?? "—"} | ${h.where[0]} |`);
P(); P(`## Màu dùng một lần (ứng viên gộp / bỏ)`); P();
P(hexRank.filter((h) => h.count === 1).map((h) => h.value + (h.token ? `=${h.token}` : "")).join(" ") || "—");
P(); P(`## rgba() dùng nhiều nhất`); P(); P(`| Giá trị | Lần | Ví dụ |`); P(`|---|---|---|`);
for (const r of rgbaRank.slice(0, TOP)) P(`| ${r.value} | ${r.count} | ${r.where[0]} |`);
P(); P(`Chỉ báo cáo (không chặn). Luật token / thang chữ: docs/art/ui-kit.md; số trước / sau ở PR #878.`);

const mdIdx = argv.indexOf("--md");
if (mdIdx >= 0) writeFileSync(argv[mdIdx + 1], lines.join("\n") + "\n");
console.log(lines.join("\n"));
