// Thống nhất tỷ lệ/bảng màu cho các atlas chùy đã sinh; không gọi model, không nhập game.
// node tools/assets/phuthe-hammer-atlas-finalize.mjs --sources <JSON {dir:{raw,axes?}}> --out <thư mục>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Img, readPng, encodePng } from "./lib.mjs";
import { medianCut } from "./beast-sheet-cut.mjs";
import { DIRS } from "./phuthe-sheet-lib.mjs";
import { buildPreview } from "./phuthe-sheet-preview.mjs";
import { checkPhuThe, toJson, writeReport } from "./phuthe-sheet-check.mjs";

const args = process.argv.slice(2), val = (k) => args[args.indexOf(k) + 1];
if (!args.includes("--sources") || !args.includes("--out")) throw Error("Cần --sources và --out");
const sources = JSON.parse(fs.readFileSync(val("--sources"), "utf8").replace(/^\uFEFF/, "")), dirs = DIRS.filter((d) => sources[d]), out = val("--out");
if (!dirs.length || Object.keys(sources).some((d) => !DIRS.includes(d))) throw Error("Nguồn cần có hướng s/se/e/ne/n hợp lệ");
fs.mkdirSync(out, { recursive: true });
const outRoot = fs.realpathSync(out);
for (const input of [val("--sources"), ...dirs.flatMap((d) => [sources[d].raw, ...(sources[d].axes ? [sources[d].axes] : [])])]) {
  const relative = path.relative(outRoot, fs.realpathSync(input));
  if (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`)) throw Error("Thư mục đầu ra không được chứa RAW hoặc cấu hình đầu vào");
}
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "hao-atlas-finalize-"));
const compiler = fileURLToPath(new URL("./phuthe-hammer-atlas.mjs", import.meta.url));
function run(dir, dest, extra = []) {
  const source = sources[dir], params = [compiler, "--raw", source.raw, "--dir", dir, "--out", dest, ...(args.includes("--pose-a") ? ["--pose-a"] : []), ...(source.axes ? ["--axes", source.axes] : []), ...(source.omitUnused?.length ? ["--omit-unused", source.omitUnused.join(",")] : []), ...extra];
  const r = spawnSync(process.execPath, params, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (r.status !== 0) throw Error(`${dir}: ${r.error?.message ?? r.stderr ?? ""}\n${r.stdout ?? ""}`);
  return JSON.parse(fs.readFileSync(path.join(dest, "compose-plan.json"), "utf8"));
}
const preliminary = dirs.map((dir) => run(dir, path.join(scratch, dir)));
const scale = Math.min(...preliminary.map((p) => p.scale)), palette = medianCut(preliminary.flatMap((p) => p.palette), 32);
const paletteFile = path.join(scratch, "palette.json"); fs.writeFileSync(paletteFile, JSON.stringify(palette));
fs.mkdirSync(out, { recursive: true });
const plans = dirs.map((dir) => run(dir, path.join(out, dir), ["--scale-cap", String(scale), "--palette", paletteFile]));
const halves = { b: new Img(1664, 1280), f: new Img(1664, 1280) }, counts = { b: 0, f: 0 }, grip = {};
let base;
for (const dir of dirs) {
  const folder = path.join(out, dir), entries = JSON.parse(fs.readFileSync(path.join(folder, "manifest-entry.json"), "utf8"));
  base ??= entries[0]; Object.assign(grip, entries[0].anim.grip);
  for (const entry of entries) {
    const side = entry.key.endsWith("_b") ? "b" : "f", im = readPng(path.join(folder, `${entry.key}.png`));
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y)) { halves[side].set(x, y, im.get(x, y)); counts[side]++; }
  }
  for (const sex of ["m", "f"]) {
    const dest = path.join(out, `boards-${sex}`); fs.mkdirSync(dest, { recursive: true });
    const file = `to${"ABCDE"[DIRS.indexOf(dir)]}.png`;
    fs.copyFileSync(path.join(folder, sex, file), path.join(dest, file));
  }
}
const entries = [];
for (const side of ["b", "f"]) if (counts[side]) {
  const key = `vkanim_hao_thien_chuy_${side}`, anim = { ...base.anim, layer: side === "b" ? "sau" : "truoc", grip };
  if (dirs.length === 5) delete anim.dirsOk; else anim.dirsOk = dirs;
  entries.push({ ...base, key, anim }); fs.writeFileSync(path.join(out, `${key}.png`), encodePng(halves[side]));
}
fs.writeFileSync(path.join(out, "manifest-entry.json"), JSON.stringify(entries, null, 2) + "\n");
const checks = {};
const distances = plans.flatMap((p) => p.distances);
for (const sex of ["m", "f"]) { const r = checkPhuThe("hao_thien_chuy", { kind: "vukhi", sex, dir: path.join(out, `boards-${sex}`), ...(args.includes("--pose-a") ? { poseFrames: distances } : {}) }); checks[sex] = toJson(r); writeReport(r, path.join(out, `review-${sex}`)); }
const report = { dirs, scale, palette, frames: distances.length, maxA: Math.max(...distances.map((d) => d.near[0])), maxB: Math.max(...distances.flatMap((d) => d.near.slice(1))), edge: distances.reduce((n, d) => n + d.edge, 0), geometryFailures: plans.flatMap((p) => p.geometryFailures), checks, preview: "preview/index.html", approvedForImport: false };
fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2) + "\n");
fs.writeFileSync(path.join(out, "summary.js"), `window.hammerAtlasSummary = ${JSON.stringify({ dirs, frames: report.frames, scale, maxA: report.maxA, maxB: report.maxB, edge: report.edge })};\n`);
buildPreview("hao_thien_chuy", out, 2);
console.log(JSON.stringify({ dirs, scale, frames: report.frames, maxA: report.maxA, maxB: report.maxB, edge: report.edge, levels: Object.fromEntries(Object.entries(checks).map(([s, r]) => [s, r.level])) }));
if (Object.values(checks).some((r) => r.level === "chặn")) process.exitCode = 1;
