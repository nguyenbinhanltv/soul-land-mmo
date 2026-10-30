// Tái dùng công thức atlas #1320 trong thư mục tạm, không đổi công cụ chung.
// node art/src/phuthe-anim/ta_hoa_phuong_hoang/vukhi/compose.mjs --sources <json> --out <thư mục tạm>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../../../../../", import.meta.url));
const id = "ta_hoa_phuong_hoang", args = process.argv.slice(2);
if (!args.includes("--sources") || !args.includes("--out")) throw Error("Cần --sources và --out");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "phuong-atlas-"));
const names = ["phuthe-hammer-atlas.mjs", "phuthe-hammer-atlas-finalize.mjs", "phuthe-hammer-atlas-cut.mjs"];
for (const name of names) {
  let code = fs.readFileSync(path.join(root, "tools/assets", name), "utf8");
  code = code.replaceAll("hao_thien_chuy", id).replaceAll("Hạo Thiên Chùy", "Tà Hỏa Phượng Hoàng")
    .replaceAll('kind: "vukhi",', 'kind: "vukhi", frame: 128,')
    .replace('gripCounts("2 tay (theo clip)")', 'gripCounts("1 tay")')
    .replace("const angle = hands.length === 2 ?", "const angle = poseA ? 0 : hands.length === 2 ?")
    .replace(".11294905654", ".20");
  // Các import chung trỏ về repo; chỉ ba công thức chuyên biệt chạy bản cấu hình tạm.
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
