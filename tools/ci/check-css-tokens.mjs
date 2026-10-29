// Luật token màu cho CSS MỚI (UI gốc, đợt 5c; docs/art/ui-kit.md "Lớp token"): trong `client/src/ui2*.css`, màu chỉ qua `var(--…)`;
// `#hex` và `rgb()/rgba()/hsl()/hsla()` ngoài khối `:root` là vi phạm. Còn tồn đọng nên ở mức CẢNH BÁO có chốt trần: số vi phạm KHÔNG
// được tăng (vượt BASELINE thì lỗi), giảm thì cập nhật BASELINE xuống đúng số mới; về 0 thì chặn hẳn (đặt BASELINE = 0).
// Chạy trong `npm run check`. Đếm toàn bộ (cả `style.css` cũ) bằng `npm run ui:inventory`.
//   node tools/ci/check-css-tokens.mjs [--list]   (--list: in từng vi phạm kèm dòng)
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "../assets/lib.mjs";

const BASELINE = 6; // số vi phạm hiện còn ở ui2*.css (ghi bằng số đếm của `--list` khi đổi)
const dir = path.join(ROOT, "client", "src");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")); // giữ số dòng
const lineOf = (t, i) => t.slice(0, i).split("\n").length;

/** Khoảng `[đầu, cuối)` của các khối `:root{…}` (nơi ĐỊNH NGHĨA token được phép chứa màu thô). */
export function rootRanges(text) {
  const out = []; const re = /:root\s*\{/g; let m;
  while ((m = re.exec(text))) { let d = 1, i = re.lastIndex; while (i < text.length && d) { if (text[i] === "{") d++; else if (text[i] === "}") d--; i++; } out.push([m.index, i]); }
  return out;
}
/** Giá trị của khai báo biến (`--x:…`) là ĐỊNH NGHĨA token (vd bảng màu mù màu ở `body.a11y-cb`): được phép chứa màu thô. */
const inTokenDecl = (text, i) => /^\s*--[\w-]+\s*:/.test(text.slice(Math.max(text.lastIndexOf(";", i), text.lastIndexOf("{", i), text.lastIndexOf("}", i)) + 1, i));
/** Vi phạm trong một đoạn CSS: [{ at, what }] (mã màu #hex hoặc hàm màu ngoài :root). */
export function violations(css) {
  const text = strip(css), rr = rootRanges(text), inRoot = (i) => rr.some(([a, b]) => i >= a && i < b), out = [];
  for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b(?![\w-])/g)) {
    if (![4, 5, 7, 9].includes(m[0].length) || inRoot(m.index) || inTokenDecl(text, m.index)) continue; // bỏ id kiểu #quest; bỏ định nghĩa token
    const next = /[;{}]/.exec(text.slice(m.index + m[0].length))?.[0];
    if (next === "{") continue; // đứng trong selector (`#abc{`, `#abc,#def{`), không phải giá trị
    out.push({ at: m.index, what: m[0] });
  }
  for (const m of text.matchAll(/\b(?:rgba?|hsla?)\([^)]*\)/g)) if (!inRoot(m.index) && !inTokenDecl(text, m.index)) out.push({ at: m.index, what: m[0].replace(/\s+/g, "") });
  return out.map((v) => ({ ...v, line: lineOf(text, v.at) }));
}

// Ca thử khóa hành vi.
{
  const t = (css, n) => { const k = violations(css).length; if (k !== n) { console.error(`css-tokens: ca thử sai (${k} ≠ ${n}) với: ${css}`); process.exit(1); } };
  t(":root{--a:#fff;--b:rgba(0,0,0,.5)} .x{color:var(--a)}", 0);
  t(".x{color:#fff}", 1); t(".x{background:rgba(0,0,0,.4)}", 1); t(".x{box-shadow:0 0 4px #000,0 0 2px rgb(1,2,3)}", 2);
  t("body.cb{--a:#fff;--b:rgba(1,2,3,.5)}", 0); t("#quest{color:var(--a)} #abc,#def{top:0}", 0); t("/* #fff */ .x{top:0}", 0);
}

const files = readdirSync(dir).filter((f) => /^ui2.*\.css$/.test(f)).sort(), all = [];
for (const f of files) for (const v of violations(readFileSync(path.join(dir, f), "utf8"))) all.push(`${f}:${v.line} ${v.what}`);
if (process.argv.includes("--list")) console.log(all.join("\n"));
const n = all.length;
if (n > BASELINE) { console.error(`css-tokens: ${n} màu thô (#hex / rgba) ngoài :root trong ui2*.css, trần ${BASELINE}. Dùng var(--token) (docs/art/ui-kit.md); xem từng chỗ: node tools/ci/check-css-tokens.mjs --list`); process.exit(1); }
if (n < BASELINE) console.log(`css-tokens: còn ${n} (< trần ${BASELINE}): hạ BASELINE xuống ${n} trong tools/ci/check-css-tokens.mjs`);
else console.log(n ? `css-tokens: cảnh báo, còn ${n} màu thô trong ui2*.css (trần ${BASELINE}, không được tăng)` : "css-tokens: ok (0 màu thô trong ui2*.css: luật chặn)");
