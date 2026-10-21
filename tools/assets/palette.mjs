// Sinh bảng màu Aseprite / GIMP (.gpl) gồm mọi màu sprite được phép dùng, để chỉnh tay (mục 5.11 "Bảng màu").
//   node tools/assets/palette.mjs <ra.gpl> [--map <mapId>]
// Gồm: art/palette.gpl, mọi `col:` / `glow:` của shared/data.ts mà validate nhận (dải hồn hoàn của TIERS…), col / robe của VOHON kèm 1 sắc tối và 1 sắc sáng
// (shared/data.ts, không chép số ra chỗ khác), và bảng nhấn art/palettes/<mapId>.gpl nếu có --map.
// File ra là bản sinh, không đưa vào repo (đổi data.ts thì chạy lại).
import { writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT, readGplNamed, readDataColors, shadesOf, hex } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const map = opt("--map", ""), out = args[0];
if (!out) { console.error("Cách dùng: palette.mjs <ra.gpl> [--map <mapId>]"); process.exit(1); }

const rows = [], seen = new Set();
const add = (c, name) => { if (seen.has(c)) return; seen.add(c); rows.push(`${hex(c).map((v) => String(v).padStart(3)).join(" ")}\t${name} ${c}`); };
for (const c of readGplNamed()) add(c.hex, c.name.replace(/\s*#[0-9a-f]{6}$/i, ""));
const { vohon, tiers } = readDataColors();
tiers.forEach((c) => add(c, "data.ts col / glow (hồn hoàn TIERS…)"));
vohon.forEach((c) => { add(c, "Võ hồn (VOHON)"); shadesOf(c).forEach((s) => add(s, "Võ hồn, sắc suy ra")); });
if (map) {
  const f = path.join(ROOT, "art", "palettes", `${map}.gpl`);
  if (!existsSync(f)) { console.error(`--map: không có ${path.relative(ROOT, f)}`); process.exit(1); }
  for (const c of readGplNamed(f)) add(c.hex, c.name.replace(/\s*#[0-9a-f]{6}$/i, ""));
}
writeFileSync(out, `GIMP Palette\nName: Rung San Hon${map ? ` + ${map}` : ""} (sinh bởi tools/assets/palette.mjs)\nColumns: 8\n#\n${rows.join("\n")}\n`);
console.log(`[palette] ${out}: ${rows.length} màu`);
