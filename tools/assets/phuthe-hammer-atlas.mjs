// Thử atlas chùy riêng theo phương pháp s837, không sửa RAW/LPC hoặc nhập shared/assets.
// node tools/assets/phuthe-hammer-atlas.mjs --raw <atlas 4x2> --dir s --out <thư mục> [--pose-a] [--axes <JSON tám điểm trên trục cán>]
import fs from "node:fs";
import path from "node:path";
import { Img, readPng, encodePng } from "./lib.mjs";
import { components, medianCut, nearest } from "./beast-sheet-cut.mjs";
import { dummySheet, gripPoints } from "./phuthe-sheet-dummy.mjs";
import { sheetCells, framesOf, bodyStepOf, frameOrigin, gameAnims, gameRow, DIRS, gripCounts } from "./phuthe-sheet-lib.mjs";
import { checkPhuThe, writeReport, toJson, weaponPoseGripPolicy } from "./phuthe-sheet-check.mjs";

const args = process.argv.slice(2), val = (k) => args[args.indexOf(k) + 1];
if (!args.includes("--raw") || !args.includes("--out")) throw Error("Cần --raw và --out");
const dir = args.includes("--dir") ? val("--dir") : "s";
if (!DIRS.includes(dir)) throw Error("Hướng chỉ s/se/e/ne/n");
// A chính, khung dọc chỉ một tay: giữ góc pose nguồn, không suy góc từ hai tay LPC.
const poseA = args.includes("--pose-a"), secondaryTolerance = 20;
const map = { idle: [0, 0], walk: [1, 1, 1, 1], attack: poseA ? [2, 3, 6, 7] : [2, 3, 4, 5], cast: poseA ? [6, 7] : [2, 6], hurt: [0] };
const usedPoses = new Set(Object.values(map).flat());
const omittedPoses = args.includes("--omit-unused") ? val("--omit-unused").split(",").map(Number) : [];
if (new Set(omittedPoses).size !== omittedPoses.length || omittedPoses.some((i) => !Number.isInteger(i) || i < 0 || i > 7 || usedPoses.has(i))) throw Error("Không được bỏ pose đang dùng hoặc chỉ số pose không hợp lệ");
const raw = readPng(val("--raw")), out = val("--out"), F = 128, [ox, oy] = frameOrigin(F);
fs.mkdirSync(out, { recursive: true });
const outRoot = fs.realpathSync(out);
for (const input of [val("--raw"), ...(args.includes("--axes") ? [val("--axes")] : []), ...(args.includes("--palette") ? [val("--palette")] : [])]) {
  const relative = path.relative(outRoot, fs.realpathSync(input));
  if (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`)) throw Error("Thư mục đầu ra không được chứa RAW hoặc đầu vào");
}
const axes = args.includes("--axes") ? JSON.parse(fs.readFileSync(val("--axes"), "utf8").replace(/^\uFEFF/, "")) : null;
const green = ([r, g, b]) => g > 170 && r < 110 && b < 140;
const mask = new Uint8Array(raw.w * raw.h), dotMask = new Uint8Array(raw.w * raw.h);
for (let y = 0; y < raw.h; y++) for (let x = 0; x < raw.w; x++) {
  const p = raw.get(x, y);
  if (p[3] < 128) continue;
  if (green(p)) { dotMask[y * raw.w + x] = 1; continue; }
  if (Math.hypot(p[0] - 255, p[1], p[2] - 255) > 120) mask[y * raw.w + x] = 1;
}
const parts = components(mask, raw.w, raw.h).filter((c) => c.area > 1000);
if (parts.length !== 8) throw Error(`Cần tám pose liền tách rời, thấy ${parts.length}`);
const dots = components(dotMask, raw.w, raw.h).filter((c) => c.area >= 4).map((c) => [c.cx + .5, c.cy + .5]);
if (dots.length !== 8 - omittedPoses.length) throw Error(`Cần ${8 - omittedPoses.length} marker gốc cho các pose giữ lại, thấy ${dots.length}`);
const usedDots = new Set();
const poses = Array(8), colors = [];
for (const c of parts) {
  const slot = Math.floor(c.cy / (raw.h / 2)) * 4 + Math.floor(c.cx / (raw.w / 4));
  if (poses[slot]) throw Error(`Ô ${slot + 1} trùng hình`);
  if (omittedPoses.includes(slot)) { poses[slot] = { unused: true, box: [c.x0, c.y0, c.x1, c.y1], area: c.area }; continue; }
  const roots = dots.map((p, index) => ({ p, index, distance: c.px.reduce((d, i) => Math.min(d, Math.hypot(i % raw.w + .5 - p[0], Math.floor(i / raw.w) + .5 - p[1])), Infinity) })).filter((r) => r.distance <= 25);
  if (roots.length !== 1 || usedDots.has(roots[0].index)) throw Error(`Ô ${slot + 1}: marker không gắn duy nhất vào vũ khí`);
  const root = roots[0].p; usedDots.add(roots[0].index);
  const near = c.px.map((i) => [i % raw.w + .5, Math.floor(i / raw.w) + .5]).filter((p) => { const d = Math.hypot(p[0] - root[0], p[1] - root[1]); return d > 12 && d < 110; });
  if (!near.length) throw Error(`Ô ${slot + 1} không đo được trục cán`);
  // PCA lấy hướng của cán, không lấy véc-tơ từ marker hơi lệch tâm tới trọng tâm cán.
  const mean = near.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]).map((v) => v / near.length);
  const covariance = near.reduce((a, p) => [a[0] + (p[0] - mean[0]) ** 2, a[1] + (p[1] - mean[1]) ** 2, a[2] + (p[0] - mean[0]) * (p[1] - mean[1])], [0, 0, 0]);
  const theta = .5 * Math.atan2(2 * covariance[2], covariance[0] - covariance[1]);
  const sign = Math.cos(theta) * (mean[0] - root[0]) + Math.sin(theta) * (mean[1] - root[1]) < 0 ? -1 : 1;
  const axisPoint = axes?.[slot] ?? [root[0] + sign * Math.cos(theta) * 100, root[1] + sign * Math.sin(theta) * 100];
  const axis = Math.atan2(axisPoint[1] - root[1], axisPoint[0] - root[0]), img = new Img(raw.w, raw.h);
  for (const i of c.px) { const x = i % raw.w, y = Math.floor(i / raw.w), p = raw.get(x, y); img.set(x, y, p); colors.push(p.slice(0, 3)); }
  // Cán thẳng: bề ngang theo pháp tuyến trục cán là bề ngang đầu búa, không bị chiều dài cán chi phối.
  // Chuẩn hoá toàn bộ pose (không bóp riêng đầu/cán) để mặt impact không phình bất ngờ.
  const transverse = c.px.map((i) => -(i % raw.w + .5 - root[0]) * Math.sin(axis) + (Math.floor(i / raw.w) + .5 - root[1]) * Math.cos(axis));
  const headWidth = Math.max(...transverse) - Math.min(...transverse), axial = [], slices = new Map();
  c.px.forEach((i, index) => {
    const u = (i % raw.w + .5 - root[0]) * Math.cos(axis) + (Math.floor(i / raw.w) + .5 - root[1]) * Math.sin(axis), v = transverse[index], bin = Math.floor(u);
    axial.push(u); const span = slices.get(bin) ?? [Infinity, -Infinity]; span[0] = Math.min(span[0], v); span[1] = Math.max(span[1], v); slices.set(bin, span);
  });
  // Đầu búa là đoạn rộng, tách khỏi cán mảnh bằng lát cắt ngang. E có mặt dài dọc trục cán:
  // chỉ chuẩn hoá bề ngang sẽ vô tình phóng e; phải xét cả chiều dọc đầu búa.
  const headStart = Math.min(...[...slices].filter(([, [lo, hi]]) => hi - lo >= headWidth * .5).map(([u]) => u));
  const headLength = Math.max(...axial) - headStart, headSize = Math.max(headWidth, headLength), headScale = 200 / headSize;
  if (!Number.isFinite(headSize) || headSize <= 0) throw Error(`Ô ${slot + 1}: không đo được hai chiều đầu búa`);
  poses[slot] = { root, axis, axisPoint, headWidth, headLength, headSize, headScale, shaftLength: headStart, img, box: [c.x0, c.y0, c.x1, c.y1], area: c.area };
}
if (poses.filter(Boolean).length !== 8) throw Error("Thiếu ô pose");
// Kiểu một tay dọc dùng một tỷ lệ ảnh cho cả atlas, không phóng riêng từng pose.
if (poseA) {
  const sizes = poses.filter((p) => !p.unused).map((p) => p.headSize).sort((a, b) => a - b);
  const sharedHeadScale = 200 / ((sizes[3] + sizes[4]) / 2);
  for (const p of poses.filter((p) => !p.unused)) p.headScale = sharedHeadScale;
}
const palette = args.includes("--palette") ? JSON.parse(fs.readFileSync(val("--palette"), "utf8").replace(/^\uFEFF/, "")) : medianCut(colors, 32);
if (!Array.isArray(palette) || !palette.length || palette.length > 32 || palette.some((c) => !Array.isArray(c) || c.length !== 3 || c.some((v) => !Number.isInteger(v) || v < 0 || v > 255))) throw Error("Bảng màu phải có tối đa 32 màu RGB hợp lệ");
for (const p of poses.filter((p) => !p.unused)) for (let y = p.box[1]; y <= p.box[3]; y++) for (let x = p.box[0]; x <= p.box[2]; x++) if (p.img.alpha(x, y)) p.img.set(x, y, [...palette[nearest(p.img.get(x, y), palette)], 255]);
// Atlas cán dài mới: bốn pose attack thực; cast chọn hai pose đủ đoạn cán cho hai tay giơ lên.
const counts = gripCounts("2 tay (theo clip)");
const tilt = { idle: [-2, 2], walk: [-4, -1, 3, 1], hurt: [-8] }, plan = [];
for (const sex of ["m", "f"]) for (const c of sheetCells("A")) {
  const pose = map[c.anim][c.frame], p = poses[pose], step = bodyStepOf(c.anim, framesOf("A")[c.anim], c.frame);
  const gripPolicy = weaponPoseGripPolicy({ id: "hao_thien_chuy", clip: c.anim, axisDegrees: poseA ? p.axis * 180 / Math.PI : undefined, primaryDistance: 0 });
  const g = gripPoints({ sex, dir, clip: c.anim, step, frame: F, count: counts[c.anim], id: "hao_thien_chuy", axisDegrees: poseA ? p.axis * 180 / Math.PI : undefined });
  const hands = g.hands.slice(0, counts[c.anim]).map((p) => p.map((v) => sex === "m" ? +(v / 2).toFixed(1) : v / 2));
  if (hands.length !== counts[c.anim] && !(gripPolicy.primaryOnly && hands.length === 1 && !g.fallback)) throw Error(`Thiếu tay ${sex}/${dir}/${c.anim}/${c.frame}`);
  const angle = hands.length === 2 ? (poseA ? 0 : Math.atan2(hands[1][1] - hands[0][1], hands[1][0] - hands[0][0]) - p.axis) : (gripPolicy.primaryOnly ? 0 : tilt[c.anim][c.frame] * Math.PI / 180);
  plan.push({ ...c, sex, name: `${dir}/${c.anim}/${c.frame}`, pose, hands, angle, step, measuredStep: g.step, fallback: g.fallback });
}
// Chọn điểm nắm trên chính cán thẳng đã vẽ, không bắt tay A ở nút cuối.
// Khoảng dịch cố định cho mỗi clip/pose và hai giới, tránh trượt cán giữa các khung đi.
for (const f of plan) {
  const p = poses[f.pose], co = Math.cos(f.angle), si = Math.sin(f.angle);
  f.bounds = [Infinity, Infinity, -Infinity, -Infinity];
  f.axisUnit = [Math.cos(p.axis + f.angle), Math.sin(p.axis + f.angle)];
  f.gripSpan = f.hands.length > 1 ? Math.hypot(f.hands[1][0] - f.hands[0][0], f.hands[1][1] - f.hands[0][1]) : 0;
  for (let y = p.box[1]; y <= p.box[3]; y++) for (let x = p.box[0]; x <= p.box[2]; x++) if (p.img.alpha(x, y)) {
    const dx = (x + .5 - p.root[0]) * p.headScale, dy = (y + .5 - p.root[1]) * p.headScale, v = [dx * co - dy * si, dx * si + dy * co];
    for (let k = 0; k < 2; k++) { f.bounds[k] = Math.min(f.bounds[k], v[k]); f.bounds[k + 2] = Math.max(f.bounds[k + 2], v[k]); }
  }
}
function placementsAt(s) {
  const ranges = new Map();
  for (const f of plan) {
    let lo = 0, hi = poses[f.pose].shaftLength * poses[f.pose].headScale * s - (poseA ? 0 : f.gripSpan) - 1;
    if (hi < 0) return null;
    for (let k = 0; k < 2; k++) {
      const min = f.hands[0][k] + f.bounds[k] * s, max = f.hands[0][k] + f.bounds[k + 2] * s, u = f.axisUnit[k];
      if (Math.abs(u) < 1e-8) { if (min < 3.5 || max > F - 3.5) return null; }
      else if (u > 0) { lo = Math.max(lo, (max - (F - 3.5)) / u); hi = Math.min(hi, (min - 3.5) / u); }
      else { lo = Math.max(lo, (min - 3.5) / u); hi = Math.min(hi, (max - (F - 3.5)) / u); }
    }
    const key = `${f.anim}/${f.pose}`, previous = ranges.get(key) ?? [0, Infinity];
    lo = Math.max(lo, previous[0]); hi = Math.min(hi, previous[1]);
    if (lo > hi) return null;
    ranges.set(key, [lo, hi]);
  }
  return ranges;
}
// Giữ cỡ tham chiếu s: đầu búa tối đa 22,59 điểm game; không phóng riêng từng hướng/khung.
const cap = Math.min(.11294905654, args.includes("--scale-cap") ? Number(val("--scale-cap")) : Infinity);
let scale = cap, placements = null;
for (; scale > .01; scale -= .0001) { placements = placementsAt(scale); if (placements) break; }
if (!placements) throw Error("Không có tỷ lệ chung giữ đủ đoạn cán cho cả hai tay và lề; cần pose cán dài hơn");
for (const f of plan) {
  const [lo, hi] = placements.get(`${f.anim}/${f.pose}`);
  const peers = plan.filter((p) => p.anim === f.anim && p.pose === f.pose && p.hands.length > 1);
  const desired = poseA ? Math.max(0, ...peers.map((p) => -p.hands[1].reduce((sum, v, k) => sum + (v - p.hands[0][k]) * p.axisUnit[k], 0))) : 0;
  f.gripOffset = Math.max(lo, Math.min(hi, desired));
}
fs.mkdirSync(out, { recursive: true });
const gripFrames = poseA ? plan.map((f) => ({ name: `${f.sex}/${f.name}`, axisDegrees: Math.atan2(f.axisUnit[1], f.axisUnit[0]) * 180 / Math.PI })) : undefined;
const side = ["ne", "n"].includes(dir) ? "b" : "f", half = new Img(13 * F, 10 * F), boards = Object.fromEntries(["m", "f"].map((sex) => [sex, dummySheet({ group: "A", dir, sex, frame: F, key: "#00D0D0", guideKey: "#7A5CFF", gripKey: "#00FF60", gripN: counts, id: "hao_thien_chuy", poseFrames: gripFrames }).img]));
const distances = [];
for (const f of plan) {
  const p = poses[f.pose], co = Math.cos(f.angle), si = Math.sin(f.angle), g = f.hands[0], frame = new Img(F, F);
  const near = f.hands.map(() => Infinity); let pixels = 0, edge = 0;
  for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) {
    const dx = (x + .5 - g[0]) / (scale * p.headScale), dy = (y + .5 - g[1]) / (scale * p.headScale), offset = f.gripOffset / (scale * p.headScale);
    const sx = Math.floor(p.root[0] + Math.cos(p.axis) * offset + co * dx + si * dy), sy = Math.floor(p.root[1] + Math.sin(p.axis) * offset - si * dx + co * dy);
    if (sx < 0 || sy < 0 || sx >= raw.w || sy >= raw.h || !p.img.alpha(sx, sy)) continue;
    const px = p.img.get(sx, sy); frame.set(x, y, px); pixels++;
    f.hands.forEach((h, i) => { near[i] = Math.min(near[i], Math.hypot(x + .5 - h[0], y + .5 - h[1])); });
    if (x < 2 || y < 2 || x >= F - 2 || y >= F - 2) edge++;
    half.set((gameAnims("A")[f.anim][0] + f.frame) * F + x, gameRow(f.sex, dir) * F + y, px);
  }
  const shaftLength = p.shaftLength * p.headScale * scale - f.gripOffset, gripSpan = f.gripSpan;
  const delta = f.hands.length > 1 ? f.hands[1].map((v, k) => v - g[k]) : null;
  const along = delta ? delta[0] * f.axisUnit[0] + delta[1] * f.axisUnit[1] : 0;
  const clamped = Math.max(-f.gripOffset, Math.min(shaftLength, along));
  const secondaryShaftDistance = delta ? Math.hypot(...delta.map((v, k) => v - clamped * f.axisUnit[k])) : 0;
  distances.push({ name: `${f.sex}/${f.name}`, pose: f.pose, near, pixels, edge, shaftLength, gripSpan, gripOffset: f.gripOffset,
    ...(poseA ? { axisDegrees: (p.axis + f.angle) * 180 / Math.PI, primaryAnchorError: 0, secondaryShaftDistance, secondaryTolerance } : {}) });
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const px = frame.get(Math.floor(x / 2), Math.floor(y / 2)); if (px[3]) boards[f.sex].set(f.col * 256 + x, f.row * 256 + y, px); }
}
const sid = "ABCDE"[DIRS.indexOf(dir)];
for (const sex of ["m", "f"]) {
  const folder = path.join(out, sex); fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, `to${sid}.png`), encodePng(boards[sex]));
  const r = checkPhuThe("hao_thien_chuy", { kind: "vukhi", dir: folder, sex, ...(poseA ? { poseFrames: distances } : {}) }); writeReport(r, path.join(folder, "review"));
}
fs.writeFileSync(path.join(out, `vkanim_hao_thien_chuy_${side}.png`), encodePng(half));
const grip = Object.fromEntries(plan.filter((f) => f.sex === "m").map((f) => [f.name, f.hands.flatMap(([x, y]) => [+(x - ox).toFixed(1), +(y - oy).toFixed(1)])]));
fs.writeFileSync(path.join(out, "manifest-entry.json"), JSON.stringify([{ key: `vkanim_hao_thien_chuy_${side}`, frame: [F, F], iso: true, anim: { kind: "vukhi", group: "A", layer: side === "b" ? "sau" : "truoc", dirs: DIRS, sexes: ["m", "f"], cols: 13, rows: 10, rowsPerSex: 5, dirsOk: [dir], anims: Object.fromEntries(Object.entries(gameAnims("A")).map(([k, [col, n]]) => [k, { col, n }])), origin: [ox, oy], grip, gripSex: "m" } }], null, 2) + "\n");
for (const d of distances) if (poseA) Object.assign(d, weaponPoseGripPolicy({ id: "hao_thien_chuy", clip: d.name.split("/")[2], axisDegrees: d.axisDegrees, primaryDistance: d.near[0], secondaryDistance: d.secondaryShaftDistance }));
const geometryFailures = distances.filter((d) => d.edge || d.pixels < 15 || (poseA ? d.blocked : d.near.some((v) => v > 2) || d.gripSpan > d.shaftLength + 2));
const checks = Object.fromEntries(["m", "f"].map((sex) => [sex, toJson(checkPhuThe("hao_thien_chuy", { kind: "vukhi", dir: path.join(out, sex), sex, ...(poseA ? { poseFrames: distances } : {}) }))]));
if (poseA) fs.writeFileSync(path.join(out, "grip-check.json"), JSON.stringify({ policy: "pose-a", units: "game-pixel-frame-128", primaryAnchor: "exact", primaryRasterTolerance: 2, verticalToleranceDegrees: 15, verticalPolicy: "primary-only", secondaryTolerance,
  level: geometryFailures.length ? "block" : "ok", approvedForImport: false,
  issues: geometryFailures.map((d) => ({ code: "diem-cam", severity: "block", frame: d.name, primaryRasterDistance: d.near[0], secondaryShaftDistance: d.secondaryShaftDistance, secondaryTolerance })),
  distances }, null, 2) + "\n");
fs.writeFileSync(path.join(out, "compose-plan.json"), JSON.stringify({ dir, F, scale, palette, omittedPoses, ...(poseA ? { gripPolicy: "pose-a", secondaryTolerance } : {}), poses: poses.map(({ unused, root, axis, axisPoint, headWidth, headLength, headSize, headScale, shaftLength, box, area }) => ({ unused, root, axis, axisPoint, headWidth, headLength, headSize, headScale, shaftLength, box, area })), plan, distances, geometryFailures, checks, note: poseA ? "A raster <=2px; attack/cast vertical <=15deg uses A only; otherwise B shaft distance <=20px. Fixed raster scale per atlas." : "Theo phương pháp s837: atlas pose thật, tỷ lệ chung, đo grip từng giới, không sửa RAW/LPC. Khoảng cách B đo tới hình vũ khí, vẫn cần mắt xác nhận đang nắm cán." }, null, 2) + "\n");
console.log(JSON.stringify({ dir, scale, frames: distances.length, maxA: Math.max(...distances.map((d) => d.near[0])), maxB: Math.max(0, ...distances.flatMap((d) => d.near.slice(1))), edge: distances.reduce((n, d) => n + d.edge, 0), geometryFailures, levels: Object.fromEntries(Object.entries(checks).map(([sex, r]) => [sex, r.level])) }));
if (geometryFailures.length || Object.values(checks).some((r) => r.level === "chặn")) process.exitCode = 1;
