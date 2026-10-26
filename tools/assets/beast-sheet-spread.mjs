// Đo cỡ thân idle theo hướng của sheet game *_anim.png (#1085): bảng max/min chiều cao idle giữa 5 khối hướng.
//   node tools/assets/beast-sheet-spread.mjs [--dir shared/assets/sprites/beast] [--only a,b] [--json]
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, ROOT } from "./lib.mjs";
import { DIRS, BAND_ROWS, FRAMES, animSlot } from "./beast-sheet-lib.mjs";
import { median } from "./beast-sheet-stats.mjs";

/** Chiều cao thân idle (trung vị bốn khung idle, điểm ảnh khung) theo hướng + tỉ lệ max/min. */
export function idleSpread(sheet, F) {
  const { band, col } = animSlot("idle"), heights = {};
  DIRS.forEach((d, di) => {
    const hs = [];
    for (let f = 0; f < FRAMES.idle; f++) {
      const x0 = (col + f) * F, y0 = (di * BAND_ROWS + band) * F;
      let a = Infinity, b = -1;
      for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) if (sheet.alpha(x0 + x, y0 + y)) { if (y < a) a = y; if (y > b) b = y; }
      if (b >= 0) hs.push(b - a + 1);
    }
    heights[d] = hs.length ? median(hs) : 0;
  });
  const v = Object.values(heights).filter(Boolean);
  return { heights, ratio: v.length ? Math.max(...v) / Math.min(...v) : null };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), arg = (k) => (a.includes(k) ? a[a.indexOf(k) + 1] : undefined);
  const dir = path.resolve(arg("--dir") ?? path.join(ROOT, "shared/assets/sprites/beast")), only = arg("--only")?.split(",");
  const rows = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith("_anim.png")).sort()) {
    const id = f.replace(/_anim\.png$/, "");
    if (only && !only.includes(id)) continue;
    const img = readPng(path.join(dir, f)), F = img.w / 6;
    rows.push({ id, ...idleSpread(img, F) });
  }
  if (a.includes("--json")) console.log(JSON.stringify(rows, null, 1));
  else for (const r of rows) console.log(`${r.id.padEnd(30)} ${DIRS.map((d) => `${d} ${r.heights[d]}`).join(", ").padEnd(40)} ${r.ratio?.toFixed(2)}×`);
}
