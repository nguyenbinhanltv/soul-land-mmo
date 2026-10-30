// Công thức atlas #1320 cấu hình riêng cho Cửu Tinh, không sửa công cụ chung.
// node art/src/phuthe-anim/cuu_tinh_that_sat_kiem/vukhi/compose.mjs --sources <json> --out <temp>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("../../../../../", import.meta.url));
const id = "cuu_tinh_that_sat_kiem", args = process.argv.slice(2);
if (!args.includes("--sources") || !args.includes("--out")) throw Error("Cần --sources và --out");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "cuu-tinh-atlas-"));
const names = ["phuthe-hammer-atlas.mjs", "phuthe-hammer-atlas-finalize.mjs", "phuthe-hammer-atlas-cut.mjs", "phuthe-sheet-check.mjs"];
for (const name of names) {
  let code = fs.readFileSync(path.join(root, "tools/assets", name), "utf8");
  if (!code.includes("hao_thien_chuy")) throw Error(`${name}: công thức mẫu đã đổi mã`);
  if (name === names[0]) for (const token of [".11294905654", "idle: [0, 0], walk: [1, 1, 1, 1]", "hurt: [0]"]) {
    if (!code.includes(token)) throw Error(`${name}: thiếu cấu hình mẫu ${token}`);
  }
  if (name === names[3] && !code.includes('id === "hao_thien_chuy"')) throw Error("Quy tắc ngoại lệ mẫu đã đổi");
  // Ngoại lệ A ở attack/cast dọc≤15° được yêu cầu cho rollout; ngưỡng A/B giữ nguyên.
  code = code.replaceAll("hao_thien_chuy", id).replaceAll("Hạo Thiên Chùy", "Cửu Tinh Thất Sát Kiếm")
    .replaceAll('kind: "vukhi",', 'kind: "vukhi", frame: 128,')
    .replace(".11294905654", ".20")
    // Chỉ dùng pose2/4/6/7 đủ7sao: nâng/nâng cao/chém xuống/impact.
    .replace("idle: [0, 0], walk: [1, 1, 1, 1]", "idle: [2, 2], walk: [2, 2, 2, 2]")
    .replace("[2, 3, 6, 7]", "[2, 6, 4, 7]")
    .replace("cast: poseA ? [6, 7]", "cast: poseA ? [2, 6]")
    .replace("const angle = hands.length === 2 ?", "const angle = pose === 4 && Math.sin(p.axis) < 0 ? Math.PI : hands.length === 2 ?")
    .replace("pose, hands, angle, step", 'pose, hands, angle: angle + (dir === "n" && pose === 4 ? Math.PI / 12 : 0), step')
    .replace("hurt: [0]", "hurt: [2]");
  code = code.replace(/from "\.\/(.*?)"/g, (_, p) => "from " + JSON.stringify(pathToFileURL(path.join(p === "phuthe-sheet-check.mjs" ? scratch : path.join(root, "tools/assets"), p)).href));
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
