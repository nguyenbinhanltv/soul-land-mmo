// S2 (#548): chạy đặc tả pilot.json qua PixelLab /v2/vfx (pixellab-vfx.mjs), vài lệnh song song. Bỏ qua sheet đã có trong thư mục nháp.
//   node tools/assets/skill-vfx/run.mjs [--spec lo-a.json] --out <nháp> [--only a,b] [--conc 3]
import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (n, d = "") => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const specName = opt("--spec", "pilot.json"), out = opt("--out"), only = opt("--only").split(",").filter(Boolean), conc = +opt("--conc", "3");
if (!out) { console.error("cần --out"); process.exit(1); }
const here = path.dirname(fileURLToPath(import.meta.url)), spec = JSON.parse(readFileSync(path.join(here, specName), "utf8"));
const todo = spec.sheets.filter((s) => (!only.length || only.includes(s.n)) && !existsSync(path.join(out, `${s.n}.png`)));
const tool = path.join(here, "..", "pixellab-vfx.mjs");
const sizeNote = (s) => (s.big ? "The canvas is large, about 160x160." : s.t === 2 ? "The canvas is about 96x96." : "The canvas is small, about 64x64.");
const desc = (s) => { const t = `${spec.common} ${spec.vohon[s.v].theme} ${s.d} ${s.f} frames, wind-up, peak, fade, no loop. ${sizeNote(s)}`; if (t.length > 690) console.error(`[skill-vfx] ${s.n}: prompt ${t.length} ký tự (>690 tính gấp đôi)`); return t; };
let i = 0;
async function worker() {
  while (i < todo.length) {
    const s = todo[i++];
    await new Promise((res) => { const p = spawn(process.execPath, [tool, "--name", s.n, "--desc", desc(s), "--out", out], { stdio: "inherit" }); p.on("exit", res); });
  }
}
await Promise.all(Array.from({ length: conc }, worker));
console.log(`[skill-vfx] xong ${todo.length} sheet`);
