// Song liềm: hai bản cùng một lưỡi, tay B lật ngang quanh grip riêng; không sửa LPC.
// node art/src/phuthe-anim/nguyet_nhan/vukhi/compose.mjs --sources <json> --out <temp>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("../../../../../", import.meta.url));
const id = "nguyet_nhan", args = process.argv.slice(2);
if (!args.includes("--sources") || !args.includes("--out")) throw Error("Cần --sources và --out");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "nguyet-atlas-"));
const names = ["phuthe-hammer-atlas.mjs", "phuthe-hammer-atlas-finalize.mjs", "phuthe-hammer-atlas-cut.mjs"];
for (const name of names) {
  let code = fs.readFileSync(path.join(root, "tools/assets", name), "utf8");
  function patch(before, after) {
    if (!code.includes(before)) throw Error(`${name}: công thức mẫu đã đổi: ${before}`);
    code = code.replace(before, after);
  }
  if (name === names[0]) {
    patch('gripCounts("2 tay (theo clip)")', 'gripCounts("đôi")');
    // Một số khung LPC chỉ đo được một tay: không tạo tay B từ tọa độ đoán.
    patch('if (hands.length !== counts[c.anim])', 'if (!hands.length)');
    patch("const angle = hands.length === 2 ?", "const angle = poseA ? 0 : hands.length === 2 ?");
    patch("pose, hands, angle, step", "pose, hands, requestedHands: counts[c.anim], visibleHands: hands.length, angle, step");
    patch(".11294905654", ".18");
    // Mỗi tay giữ một lưỡi: không tìm một đoạn cán chung hay trượt grip theo tay B.
    patch("let lo = 0, hi = poses[f.pose].shaftLength * poses[f.pose].headScale * s - (poseA ? 0 : f.gripSpan) - 1;", "let lo = 0, hi = 0;");
    patch("const min = f.hands[0][k] + f.bounds[k] * s, max = f.hands[0][k] + f.bounds[k + 2] * s, u = f.axisUnit[k];", "const min = Math.min(...f.hands.map(h => h[k])) + (k === 0 ? Math.min(f.bounds[0], -f.bounds[2]) : f.bounds[k]) * s, max = Math.max(...f.hands.map(h => h[k])) + (k === 0 ? Math.max(f.bounds[2], -f.bounds[0]) : f.bounds[k + 2]) * s, u = f.axisUnit[k];");
    const desired = code.match(/  const desired = poseA \?[^\n]+/);
    if (!desired) throw Error("Thiếu công thức dời grip mẫu");
    patch(desired[0], "  const desired = 0;");
    patch("  for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) {", "  for (const g of f.hands) for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) {");
    patch("p.root[0] + Math.cos(p.axis) * offset + co * dx + si * dy", "p.root[0] + Math.cos(p.axis) * offset + (g === f.hands[0] ? 1 : -1) * (co * dx + si * dy)");
    patch("f.hands.forEach((h, i) => { near[i] = Math.min(near[i], Math.hypot(x + .5 - h[0], y + .5 - h[1])); });", "const own = f.hands.indexOf(g); near[own] = Math.min(near[own], Math.hypot(x + .5 - g[0], y + .5 - g[1]));");
    const secondary = code.match(/  const secondaryShaftDistance =[^\n]+/);
    if (!secondary) throw Error("Thiếu phép đo B mẫu");
    // Tên trường cũ giữ để checker đọc; giá trị B là tới lưỡi riêng, không tới cán A.
    patch(secondary[0], "  const secondaryShaftDistance = near[1] ?? 0;");
    patch("secondaryShaftDistance, secondaryTolerance }", "secondaryShaftDistance, secondaryTolerance, secondaryGripRasterDistance: near[1] ?? null }");
    patch("pose: f.pose, near, pixels", "pose: f.pose, requestedHands: f.requestedHands, visibleHands: f.visibleHands, near, pixels");
    patch("poseA ? d.blocked :", "poseA ? (d.blocked || d.near.some(v => v > 2)) :");
  }
  if (name === names[2]) {
    patch('lop.khung[f.name] = [{ nhan: "truoc", hop: [Math.min(...xs) - 3, Math.min(...ys) - 3, Math.max(...xs) + 3, Math.max(...ys) + 3] }];', 'lop.khung[f.name] = f.hands.map(([x, y]) => ({ nhan: "truoc", hop: [x - 67, y - 93, x - 61, y - 87] }));');
    patch("g.policy ? g.policy.blocked :", "g.policy ? (g.policy.blocked || g.near.some(v => v > 2)) :");
  }
  if (!code.includes("hao_thien_chuy")) throw Error(`${name}: thiếu mã mẫu`);
  code = code.replaceAll("hao_thien_chuy", id).replaceAll("Hạo Thiên Chùy", "Nguyệt Nhận")
    .replaceAll('kind: "vukhi",', 'kind: "vukhi", frame: 128,');
  code = code.replace(/from "\.\/(.*?)"/g, (_, p) => "from " + JSON.stringify(pathToFileURL(path.join(root, "tools/assets", p)).href));
  fs.writeFileSync(path.join(scratch, name), code);
}
function run(name, params) {
  const result = spawnSync(process.execPath, [path.join(scratch, name), ...params], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw Error(`${name}: mã thoát ${result.status}`);
}
const out = path.resolve(args[args.indexOf("--out") + 1]);
run(names[1], ["--sources", path.resolve(args[args.indexOf("--sources") + 1]), "--pose-a", "--out", path.join(out, "final")]);
const report = JSON.parse(fs.readFileSync(path.join(out, "final/report.json"), "utf8"));
if (report.dirs.length === 5) run(names[2], ["--dir", path.join(out, "final"), "--out", path.join(out, "import")]);
console.log(`Kết quả: ${out}`);
