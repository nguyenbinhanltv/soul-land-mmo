// Kiểm "Map toàn cục có đường xóa" (#739): Map / Set khai ở cấp module của server/src sống bằng tuổi tiến trình, nên phải có
// `.delete(` hoặc `.clear(` trên chính nó (hoặc gán lại `X = new ...`), nếu không sẽ chỉ tăng theo uptime. Map có trần tự nhiên
// (số bản đồ, số loại thú...) thì thêm chú thích `// map-co-dinh: <lý do>` ở dòng khai hoặc dòng ngay trên. Chạy trong `npm run check`.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "../assets/lib.mjs";

const DECL = /^(?:export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]+)?=\s*new\s+(?:Map|Set)\b/;
const WAIVER = /map-co-dinh:/;
const esc = (s) => s.replace(/[$]/g, "\\$&");
/** Danh sách { name, line } của các Map / Set cấp module trong `src` không có đường xóa và không có chú thích miễn. */
export function findUnbounded(src) {
  const lines = src.split(/\r?\n/), code = src.replace(/\/\/.*$/gm, ""), out = [];
  lines.forEach((ln, i) => {
    const m = DECL.exec(ln); if (!m) return;
    if (WAIVER.test(ln) || /^\s*\/\//.test(lines[i - 1] ?? "") && WAIVER.test(lines[i - 1])) return;
    const n = esc(m[1]);
    const del = new RegExp(String.raw`\b${n}\.(?:delete|clear)\(`), reset = new RegExp(String.raw`(?<![.\w$])${n}\s*=\s*new\s+(?:Map|Set)\b`);
    if (del.test(code) || reset.test(code.replace(ln.replace(/\/\/.*$/, ""), ""))) return;
    out.push({ name: m[1], line: i + 1 });
  });
  return out;
}

// Ca thử khóa hành vi.
for (const [s, want] of [
  ["const a = new Map<string, number>();\na.set('x', 1);", ["a"]],
  ["const a = new Map<string, number>();\na.delete('x');", []],
  ["const a = new Set<number>();\nfor (const k of ks) a.clear();", []],
  ["// map-co-dinh: theo số bản đồ\nconst a = new Map();", []],
  ["const a = new Map(); // map-co-dinh: x", []],
  ["let a = new Map();\nfunction f() { a = new Map(); }", []],
  ["function f() {\n  const a = new Map();\n}", []],
  ["const a = new Map();\n// a.delete(1)", ["a"]],
  ["const ab = new Map();\nab2.delete(1);", ["ab"]],
]) {
  const got = findUnbounded(s).map((x) => x.name).join();
  if (got !== want.join()) { console.error(`regex sai với ${JSON.stringify(s)}: ${got}`); process.exit(1); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const dir = path.join(ROOT, "server", "src"), errs = [];
  for (const f of readdirSync(dir, { recursive: true }).filter((x) => /\.ts$/.test(x)))
    for (const { name, line } of findUnbounded(readFileSync(path.join(dir, f), "utf8")))
      errs.push(`server/src/${f.split(path.sep).join("/")}:${line}: Map/Set toàn cục "${name}" không có .delete() / .clear(); thêm đường xóa hoặc chú thích "// map-co-dinh: <lý do>"`);
  if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
  console.log("global-maps: ok");
}
