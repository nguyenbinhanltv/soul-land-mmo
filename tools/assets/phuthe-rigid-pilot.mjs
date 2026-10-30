// Thử riêng hướng nam Hạo Thiên Chùy: ghép ảnh vũ khí độc lập vào nộm LPC, không nhập game.
// node tools/assets/phuthe-rigid-pilot.mjs --raw <PNG nguyên bản> --out <thư mục thử> [--poses <RAW lượt 2>] [--impact <RAW lượt 3>]
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { readPng, encodePng } from "./lib.mjs";
import { dummySheet, gripPoints, dummyCell } from "./phuthe-sheet-dummy.mjs";
import { sheetCells, bodyStepOf, framesOf, DIRS, gripCounts, gripCountAt } from "./phuthe-sheet-lib.mjs";
import { components } from "./beast-sheet-cut.mjs";

const args = process.argv.slice(2), value = (key) => args[args.indexOf(key) + 1];
if (!args.includes("--raw") || !args.includes("--out")) throw new Error("Cần --raw và --out; công cụ chỉ thử hướng s, không nhập game");
const out = value("--out"), raw = readPng(value("--raw"));
const dir = args.includes("--dir") ? value("--dir") : "s", byClip = args.includes("--by-clip");
if (!DIRS.includes(dir)) throw new Error("Hướng chỉ s/se/e/ne/n");
const counts = byClip ? gripCounts("2 tay (theo clip)") : 2;
const config = args.includes("--source-config") ? JSON.parse(readFileSync(value("--source-config"), "utf8").replace(/^\uFEFF/, "")) : null;
if (config && (!byClip || !config[dir])) throw new Error("Cấu hình ảnh cần --by-clip và mục hướng tương ứng");
const poses = args.includes("--poses") ? readPng(value("--poses")) : null;
const impact = args.includes("--impact") ? readPng(value("--impact")) : null;
if (raw.w !== 1536 || raw.h !== 1024) throw new Error("Điểm đo chỉ áp dụng RAW lượt 1 cỡ 1536×1024; không tự co ảnh khác");
if (poses && (poses.w !== 1536 || poses.h !== 1024)) throw new Error("RAW pose lượt 2 phải là 1536×1024");
if (impact && (!poses || impact.w !== 1536 || impact.h !== 1024)) throw new Error("--impact cần --poses và RAW lượt 3 cỡ 1536×1024");
mkdirSync(out, { recursive: true });
// Hai điểm đo trên trục cán của RAW lượt 1, tay thuận ở gần cuối cán.
const source = [[1260, 860], [920, 634]], sourceAngle = Math.atan2(-226, -340), sourceDistance = Math.hypot(340, 226);
const cells = sheetCells("A"), origin = [128, 180];
const isWeapon = (x, y, image = raw, bounds = [0, 0, image.w, image.h]) => {
  if (x < bounds[0] || y < bounds[1] || x >= bounds[2] || y >= bounds[3]) return false;
  const [r, g, b, a] = image.get(x, y);
  return a >= 128 && Math.hypot(r - 255, g, b - 255) > 70;
};
if (!config) for (const [x, y] of source) if (!isWeapon(x, y)) throw new Error("Điểm cầm nguồn không nằm trên vũ khí");
const maskCache = new WeakMap();
function mainMask(image, bounds) {
  if (!maskCache.has(image)) maskCache.set(image, new Map());
  const key = bounds.join(","), cache = maskCache.get(image);
  if (!cache.has(key)) {
    const mask = new Uint8Array(image.w * image.h);
    for (let y = bounds[1]; y < bounds[3]; y++) for (let x = bounds[0]; x < bounds[2]; x++) if (isWeapon(x, y, image, bounds)) mask[y * image.w + x] = 1;
    const parts = components(mask, image.w, image.h).sort((a, b) => b.area - a.area);
    if (!parts.length) throw new Error("Vùng lấy pose rỗng");
    mask.fill(0); for (const i of parts[0].px) mask[i] = 1;
    cache.set(key, mask);
  }
  return cache.get(key);
}
const idleGrip = gripPoints({ dir, clip: "idle", step: 0, frame: 128 });
const idleDistance = Math.hypot(idleGrip.hands[1][0] - idleGrip.hands[0][0], idleGrip.hands[1][1] - idleGrip.hands[0][1]);
const results = {};
for (const mode of byClip ? ["clip-hands"] : ["two-hands", "shoulder", "sliding", ...(poses ? ["poses"] : [])]) {
  const board = dummySheet({ group: "A", dir, frame: 128, key: "#00D0D0", guideKey: "#7A5CFF", gripKey: "#00FF60", gripN: counts }).img;
  const report = { mode, source, method: "nearest-neighbor similarity transform; no mannequin edits", frames: [], anim: { kind: "vukhi", grip: {} } };
  for (const cell of cells) {
    const step = bodyStepOf(cell.anim, framesOf("A")[cell.anim], cell.frame), opt = { dir, clip: cell.anim, step, frame: 128 };
    const g = gripPoints({ ...opt, count: gripCountAt(counts, cell.anim) }); g.hands = g.hands.slice(0, gripCountAt(counts, cell.anim));
    const [A, B] = g.hands;
    if (!A) throw new Error(`Không đo được tay ${cell.anim}/${cell.frame}`);
    const distance = B ? Math.hypot(B[0] - A[0], B[1] - A[1]) : idleDistance;
    const slide = mode === "sliding" || mode === "poses" || byClip;
    let asset = { name: "base", image: raw, anchor: slide ? [1000, 687] : source[0], angle: sourceAngle, head: [325, 260], bounds: [0, 0, raw.w, raw.h], scale: .12, usable: 640 };
    if (byClip) asset = { ...asset, anchor: source[0], scale: .10, usable: 920 };
    if ((mode === "poses" || byClip) && poses && ["attack", "cast"].includes(cell.anim)) {
      const i = cell.anim === "cast" ? cell.frame : cell.frame === 3 ? 2 : cell.frame === 2 ? 1 : 0;
      asset = [
        { name: "raise", image: poses, anchor: [440, 720], angle: Math.atan2(-340, -220), head: [180, 290], bounds: [0, 0, 512, 1024], scale: .18, usable: 405 },
        { name: "strike", image: poses, anchor: [760, 200], angle: Math.atan2(200, -12), head: [740, 730], bounds: [530, 60, 940, 940], scale: .20, usable: 350 },
        { name: "recover", image: poses, anchor: [1050, 300], angle: Math.atan2(245, 250), head: [1380, 700], bounds: [945, 150, 1536, 940], scale: .22, usable: 350 },
      ][i];
      if (impact && cell.anim === "attack" && cell.frame === 2) asset = { name: "impact-front", image: impact, anchor: [768, 170], angle: Math.PI / 2, head: [768, 650], bounds: [0, 0, 1536, 1024], scale: .18, usable: 210 };
    }
    if (config) {
      const useAttack = (cell.anim === "attack" && cell.frame >= 2) || (cell.anim === "cast" && cell.frame === 1);
      const recipe = config[dir][useAttack ? "attack" : "base"];
      asset = { ...recipe, image: raw, angle: Math.atan2(recipe.axis[1], recipe.axis[0]) };
    }
    const { image, anchor, bounds } = asset;
    const mask = config ? mainMask(image, bounds) : null;
    const sample = (x, y) => mask ? (x >= 0 && y >= 0 && x < image.w && y < image.h && mask[y * image.w + x] === 1) : isWeapon(x, y, image, bounds);
    if (!sample(...anchor)) throw new Error(`Điểm A không nằm trên pose ${asset.name}`);
    const scale = mode === "two-hands" ? distance / sourceDistance : slide ? asset.scale : idleDistance / sourceDistance;
    const targetAngle = byClip ? (B ? Math.atan2(B[1] - A[1], B[0] - A[0]) : Math.atan2(g.shoulder[1] - A[1], g.shoulder[0] - A[0])) : mode === "two-hands" ? (B ? Math.atan2(B[1] - A[1], B[0] - A[0]) : 0) : slide ? (B ? Math.atan2(B[1] - A[1], B[0] - A[0]) : Math.PI + .25) : Math.atan2(g.shoulder[1] - A[1], g.shoulder[0] - A[0]);
    const angle = targetAngle - asset.angle, c = Math.cos(angle), s = Math.sin(angle);
    const transform = ([x, y]) => [A[0] + scale * (c * (x - anchor[0]) - s * (y - anchor[1])), A[1] + scale * (s * (x - anchor[0]) + c * (y - anchor[1]))];
    // Giữ cỡ vật cứng; tay B trượt dọc cán thay vì bắt hai landmark cố định phải trùng hai tay.
    const sourceB = slide ? [anchor[0] + Math.cos(asset.angle) * distance / scale, anchor[1] + Math.sin(asset.angle) * distance / scale] : source[1];
    if (slide && B && (distance / scale > asset.usable || !sample(Math.round(sourceB[0]), Math.round(sourceB[1])))) throw new Error(`Tay B trượt ra ngoài cán ${asset.name}: ${cell.anim}/${cell.frame}`);
    const targetB = transform(sourceB), secondError = B ? Math.hypot(targetB[0] - B[0], targetB[1] - B[1]) : null;
    const head = transform(asset.head), dummy = dummyCell(opt), x0 = cell.col * 256, y0 = cell.row * 256;
    let drawn = 0, outside = 0;
    // Duyệt cả hộp biến đổi để đếm chính xác phần bị cắt, không tự thu nhỏ để né cảnh báo.
    const corners = [[bounds[0], bounds[1]], [bounds[2], bounds[1]], [bounds[0], bounds[3]], [bounds[2], bounds[3]]].map(transform);
    const loX = Math.floor(Math.min(...corners.map((p) => p[0]))), hiX = Math.ceil(Math.max(...corners.map((p) => p[0])));
    const loY = Math.floor(Math.min(...corners.map((p) => p[1]))), hiY = Math.ceil(Math.max(...corners.map((p) => p[1])));
    for (let y = loY; y < hiY; y++) for (let x = loX; x < hiX; x++) {
      const dx = (x + .5 - A[0]) / scale, dy = (y + .5 - A[1]) / scale;
      const sx = Math.round(anchor[0] + c * dx + s * dy), sy = Math.round(anchor[1] - s * dx + c * dy);
      if (!sample(sx, sy)) continue;
      if (x < 0 || y < 0 || x >= 256 || y >= 256) { outside++; continue; }
      board.set(x0 + x, y0 + y, image.get(sx, sy)); drawn++;
    }
    const name = `${dir}/${cell.anim}/${cell.frame}`;
    report.anim.grip[name] = g.hands.flatMap(([x, y]) => [(x - origin[0]) / 2, (y - origin[1]) / 2]);
    report.frames.push({ name, asset: asset.name, hands: g.hands, shoulder: g.shoulder, sourceStep: step, fallback: g.fallback, sourceGripA: anchor, sourceGripB: sourceB, scale, angleDegrees: targetAngle * 180 / Math.PI, secondGripError: secondError, headCenter: head, headAboveHero: head[1] < dummy.box.y0, drawn, clipped: outside });
  }
  const file = path.join(out, mode); mkdirSync(file, { recursive: true });
  writeFileSync(path.join(file, `to${"ABCDE"[DIRS.indexOf(dir)]}.png`), encodePng(board));
  writeFileSync(path.join(file, "placement.json"), JSON.stringify(report, null, 2) + "\n");
  results[mode] = report.frames.map(({ name, secondGripError, headAboveHero, clipped, scale }) => ({ name, secondGripError, headAboveHero, clipped, scale }));
}
writeFileSync(path.join(out, "comparison.json"), JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify(results, null, 2));
