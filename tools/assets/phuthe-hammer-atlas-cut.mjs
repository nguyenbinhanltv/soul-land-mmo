// Cắt atlas chùy đã ghép/kiểm bằng cutter chung; giữ hàng đo trực tiếp của từng giới.
// node tools/assets/phuthe-hammer-atlas-cut.mjs --dir <pose-atlas/result> --out <vukhi>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Img, readPng, encodePng } from "./lib.mjs";
import { cutPhuThe } from "./phuthe-sheet-cut.mjs";
import { DIRS, gameAnims, gameRow } from "./phuthe-sheet-lib.mjs";
import { buildPreview } from "./phuthe-sheet-preview.mjs";

const args = process.argv.slice(2), val = (k) => args[args.indexOf(k) + 1];
if (!args.includes("--dir") || !args.includes("--out")) throw Error("Cần --dir và --out");
const dir = val("--dir"), out = val("--out"), report = JSON.parse(fs.readFileSync(path.join(dir, "report.json"), "utf8"));
if (report.dirs.length !== 5 || DIRS.some((d) => !report.dirs.includes(d)) || report.geometryFailures.length || Object.values(report.checks).some((r) => r.level === "chặn")) throw Error("Chỉ cắt sau khi đủ năm hướng không chặn và đạt hình học");
const plans = DIRS.map((d) => JSON.parse(fs.readFileSync(path.join(dir, d, "compose-plan.json"), "utf8")));
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "hao-cut-"));
try {
  const paletteFile = path.join(scratch, "palette.gpl");
  fs.writeFileSync(paletteFile, `GIMP Palette\nName: Hạo Thiên Chùy\nColumns: 8\n#\n${report.palette.map((c) => c.join(" ")).join("\n")}\n`);
  const halves = { b: new Img(1664, 1280), f: new Img(1664, 1280) }, cuts = {}, layers = {};
  let entries;
  for (const sex of ["m", "f"]) {
    const lop = { huong: Object.fromEntries(DIRS.map((d) => [d, { mac_dinh: ["ne", "n"].includes(d) ? "sau" : "truoc", vung: [] }])), khung: {} };
    for (const p of plans) if (["ne", "n"].includes(p.dir)) for (const f of p.plan.filter((f) => f.sex === sex)) {
      const xs = f.hands.map(([x]) => x - 64), ys = f.hands.map(([, y]) => y - 90);
      lop.khung[f.name] = [{ nhan: "truoc", hop: [Math.min(...xs) - 3, Math.min(...ys) - 3, Math.max(...xs) + 3, Math.max(...ys) + 3] }];
    }
    layers[sex] = lop;
    const sheets = Object.fromEntries(DIRS.map((d, i) => ["ABCDE"[i], readPng(path.join(dir, `boards-${sex}`, `to${"ABCDE"[i]}.png`))]));
    const cut = cutPhuThe({ id: "hao_thien_chuy", kind: "vukhi", sheets, frame: 128, dummySex: sex, palette: paletteFile, lop });
    if (cut.report.missing || cut.report.summary.block) throw Error(`Cutter ${sex}: thiếu khung hoặc có chặn`);
    cuts[sex] = cut.report;
    if (sex === "m") entries = cut.entries;
    // Không dùng hàng giới còn lại do cutter ước lượng bằng neo lưng.
    for (const side of ["b", "f"]) if (cut.halves[side]) for (let y = sex === "m" ? 0 : 640; y < (sex === "m" ? 640 : 1280); y++) for (let x = 0; x < 1664; x++) halves[side].set(x, y, cut.halves[side].get(x, y));
  }
  const geometry = [];
  for (const p of plans) for (const f of p.plan) {
    const x0 = (gameAnims("A")[f.anim][0] + f.frame) * 128, y0 = gameRow(f.sex, p.dir) * 128, near = f.hands.map(() => Infinity);
    let pixels = 0, edge = 0;
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if (Object.values(halves).some((im) => im.alpha(x0 + x, y0 + y))) {
      pixels++; if (x < 2 || x >= 126 || y < 2 || y >= 126) edge++;
      f.hands.forEach(([hx, hy], i) => { near[i] = Math.min(near[i], Math.hypot(x + .5 - hx, y + .5 - hy)); });
    }
    geometry.push({ name: `${f.sex}/${f.name}`, near, pixels, edge });
  }
  const failures = geometry.filter((g) => g.pixels < 15 || g.edge || g.near.some((v) => v > 2));
  if (failures.length) throw Error(`Sheet cắt chưa đạt: ${JSON.stringify(failures)}`);
  fs.mkdirSync(out, { recursive: true });
  for (const side of ["b", "f"]) fs.writeFileSync(path.join(out, `vkanim_hao_thien_chuy_${side}.png`), encodePng(halves[side]));
  fs.writeFileSync(path.join(out, "manifest-entry.json"), JSON.stringify(entries, null, 2) + "\n");
  const finalReport = { frames: geometry.length, cuts, layers, geometry, failures, maxA: Math.max(...geometry.map((g) => g.near[0])), maxB: Math.max(...geometry.flatMap((g) => g.near.slice(1))), edge: geometry.reduce((n, g) => n + g.edge, 0), normalizedHeadWidth: 200 * report.scale, imported: false };
  fs.writeFileSync(path.join(out, "_report.json"), JSON.stringify(finalReport, null, 2) + "\n");
  buildPreview("hao_thien_chuy", out, 2);
  console.log(JSON.stringify({ frames: finalReport.frames, maxA: finalReport.maxA, maxB: finalReport.maxB, edge: finalReport.edge, cuts: Object.fromEntries(Object.entries(cuts).map(([s, r]) => [s, r.summary])) }));
} finally {
  if (!path.resolve(scratch).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw Error("Thư mục tạm ngoài vùng dự kiến");
  fs.rmSync(scratch, { recursive: true, force: true });
}
