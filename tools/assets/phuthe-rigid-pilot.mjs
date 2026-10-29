// Thử riêng hướng nam Hạo Thiên Chùy: ghép ảnh vũ khí độc lập vào nộm LPC, không nhập game.
// node tools/assets/phuthe-rigid-pilot.mjs --raw <PNG nguyên bản> --out <thư mục thử>
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readPng, encodePng } from "./lib.mjs";
import { dummySheet, gripPoints, dummyCell } from "./phuthe-sheet-dummy.mjs";
import { sheetCells, bodyStepOf, framesOf } from "./phuthe-sheet-lib.mjs";

const args = process.argv.slice(2), value = (key) => args[args.indexOf(key) + 1];
if (!args.includes("--raw") || !args.includes("--out")) throw new Error("Cần --raw và --out; công cụ chỉ thử hướng s, không nhập game");
const out = value("--out"), raw = readPng(value("--raw"));
if (raw.w !== 1536 || raw.h !== 1024) throw new Error("Điểm đo chỉ áp dụng RAW lượt 1 cỡ 1536×1024; không tự co ảnh khác");
mkdirSync(out, { recursive: true });
// Hai điểm đo trên trục cán của RAW lượt 1, tay thuận ở gần cuối cán.
const source = [[1260, 860], [920, 634]], sourceAngle = Math.atan2(-226, -340), sourceDistance = Math.hypot(340, 226);
const cells = sheetCells("A"), origin = [128, 180];
const isWeapon = (x, y) => {
  if (x < 0 || y < 0 || x >= raw.w || y >= raw.h) return false;
  const [r, g, b, a] = raw.get(x, y);
  return a >= 128 && Math.hypot(r - 255, g, b - 255) > 70;
};
for (const [x, y] of source) if (!isWeapon(x, y)) throw new Error("Điểm cầm nguồn không nằm trên vũ khí");
const idleGrip = gripPoints({ dir: "s", clip: "idle", step: 0, frame: 128 });
const idleDistance = Math.hypot(idleGrip.hands[1][0] - idleGrip.hands[0][0], idleGrip.hands[1][1] - idleGrip.hands[0][1]);
const results = {};
for (const mode of ["two-hands", "shoulder"]) {
  const board = dummySheet({ group: "A", dir: "s", frame: 128, key: "#00D0D0", guideKey: "#7A5CFF", gripKey: "#00FF60", gripN: 2 }).img;
  const report = { mode, source, method: "nearest-neighbor similarity transform; no mannequin edits", frames: [], anim: { kind: "vukhi", grip: {} } };
  for (const cell of cells) {
    const step = bodyStepOf(cell.anim, framesOf("A")[cell.anim], cell.frame), opt = { dir: "s", clip: cell.anim, step, frame: 128 };
    const g = gripPoints(opt), [A, B] = g.hands;
    if (!A) throw new Error(`Không đo được tay ${cell.anim}/${cell.frame}`);
    const distance = B ? Math.hypot(B[0] - A[0], B[1] - A[1]) : idleDistance;
    const scale = mode === "two-hands" ? distance / sourceDistance : idleDistance / sourceDistance;
    const targetAngle = mode === "two-hands" ? (B ? Math.atan2(B[1] - A[1], B[0] - A[0]) : 0) : Math.atan2(g.shoulder[1] - A[1], g.shoulder[0] - A[0]);
    const angle = targetAngle - sourceAngle, c = Math.cos(angle), s = Math.sin(angle);
    const transform = ([x, y]) => [A[0] + scale * (c * (x - source[0][0]) - s * (y - source[0][1])), A[1] + scale * (s * (x - source[0][0]) + c * (y - source[0][1]))];
    const targetB = transform(source[1]), secondError = B ? Math.hypot(targetB[0] - B[0], targetB[1] - B[1]) : null;
    const head = transform([325, 260]), dummy = dummyCell(opt), x0 = cell.col * 256, y0 = cell.row * 256;
    let drawn = 0, outside = 0;
    // Duyệt cả hộp biến đổi để đếm chính xác phần bị cắt, không tự thu nhỏ để né cảnh báo.
    const corners = [[0, 0], [raw.w, 0], [0, raw.h], [raw.w, raw.h]].map(transform);
    const loX = Math.floor(Math.min(...corners.map((p) => p[0]))), hiX = Math.ceil(Math.max(...corners.map((p) => p[0])));
    const loY = Math.floor(Math.min(...corners.map((p) => p[1]))), hiY = Math.ceil(Math.max(...corners.map((p) => p[1])));
    for (let y = loY; y < hiY; y++) for (let x = loX; x < hiX; x++) {
      const dx = (x + .5 - A[0]) / scale, dy = (y + .5 - A[1]) / scale;
      const sx = Math.round(source[0][0] + c * dx + s * dy), sy = Math.round(source[0][1] - s * dx + c * dy);
      if (!isWeapon(sx, sy)) continue;
      if (x < 0 || y < 0 || x >= 256 || y >= 256) { outside++; continue; }
      board.set(x0 + x, y0 + y, raw.get(sx, sy)); drawn++;
    }
    const name = `s/${cell.anim}/${cell.frame}`;
    report.anim.grip[name] = g.hands.flatMap(([x, y]) => [(x - origin[0]) / 2, (y - origin[1]) / 2]);
    report.frames.push({ name, hands: g.hands, shoulder: g.shoulder, sourceStep: step, fallback: g.fallback, scale, angleDegrees: targetAngle * 180 / Math.PI, secondGripError: secondError, headCenter: head, headAboveHero: head[1] < dummy.box.y0, drawn, clipped: outside });
  }
  const file = path.join(out, mode); mkdirSync(file, { recursive: true });
  writeFileSync(path.join(file, "toA.png"), encodePng(board));
  writeFileSync(path.join(file, "placement.json"), JSON.stringify(report, null, 2) + "\n");
  results[mode] = report.frames.map(({ name, secondGripError, headAboveHero, clipped, scale }) => ({ name, secondGripError, headAboveHero, clipped, scale }));
}
writeFileSync(path.join(out, "comparison.json"), JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify(results, null, 2));
