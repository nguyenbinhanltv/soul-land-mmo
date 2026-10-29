// So hai lượt `ui-shots.mjs --styles <thư mục>`: computed style của từng phần tử DOM, ghép theo đường đi trong cây (UI gốc, đợt 5c).
// Dùng để chứng minh đổi CSS / mã không đổi hình mà không bị nhiễu bởi nền bản đồ của ảnh chụp.
//   node tools/ui-styles-diff.mjs <thư mục> <tag trước> <tag sau> [--show 15]
// Vào: <thư mục>/<tag>-<cảnh>.json. Ra: mỗi cảnh một dòng (số phần tử so, số khác, số chỉ có một bên) và nhóm khác biệt theo thuộc tính. Thoát 1 nếu có khác biệt.
import { readdirSync, readFileSync } from "node:fs";
const [dir, a, b] = process.argv.slice(2), SHOW = process.argv.includes("--show") ? +process.argv[process.argv.indexOf("--show") + 1] : 12;
if (!dir || !a || !b) { console.error("dùng: node tools/ui-styles-diff.mjs <thư mục> <tag trước> <tag sau> [--show N]"); process.exit(2); }
let scenes = 0, totalDiff = 0, totalOnly = 0; const byProp = new Map(), samples = [];
for (const f of readdirSync(dir).filter((x) => x.startsWith(a + "-") && x.endsWith(".json")).sort()) {
  const g = b + f.slice(a.length); let A, B;
  try { A = JSON.parse(readFileSync(`${dir}/${f}`, "utf8")); B = JSON.parse(readFileSync(`${dir}/${g}`, "utf8")); } catch { console.log("THIẾU", g); totalDiff++; continue; }
  let cmp = 0, diff = 0, only = 0;
  for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
    if (!A[k] || !B[k]) { only++; if (samples.length < 400) samples.push(`${f.slice(a.length + 1)} chỉ ${A[k] ? "trước" : "sau"}: ${k.slice(-110)}`); continue; }
    cmp++;
    for (const p in A[k]) if (A[k][p] !== B[k][p]) {
      diff++; const e = byProp.get(p) ?? { n: 0, ex: [] }; e.n++; if (e.ex.length < 3) e.ex.push(`${f.slice(a.length + 1, -5)} ${k.slice(-70)}: ${String(A[k][p]).slice(0, 50)} → ${String(B[k][p]).slice(0, 50)}`); byProp.set(p, e);
    }
  }
  scenes++; totalDiff += diff; totalOnly += only;
  console.log(`${String(diff).padStart(5)} khác / ${String(cmp).padStart(5)} phần tử, ${String(only).padStart(3)} chỉ một bên  ${f.slice(a.length + 1, -5)}`);
}
console.log(`\n${scenes} cảnh: ${totalDiff} khác biệt thuộc tính, ${totalOnly} phần tử chỉ có một bên.`);
for (const [p, e] of [...byProp].sort((x, y) => y[1].n - x[1].n).slice(0, SHOW)) console.log(`  ${p}: ${e.n}\n    ${e.ex.join("\n    ")}`);
if (totalOnly) console.log("Phần tử chỉ một bên (mẫu):\n  " + samples.slice(0, SHOW).join("\n  "));
process.exit(totalDiff || totalOnly ? 1 : 0);
