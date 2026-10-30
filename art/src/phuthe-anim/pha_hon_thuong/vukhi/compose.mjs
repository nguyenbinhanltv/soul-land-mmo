// Ghép atlas riêng Phá Hồn Thương bằng công cụ canonical, giữ nguyên LPC.
// node <recipe> --sources <json> --out <thư mục>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
const root = process.cwd(), id = "pha_hon_thuong", args = process.argv.slice(2);
if (!args.includes("--sources") || !args.includes("--out")) throw Error("Cần --sources và --out");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "pha-hon-atlas-"));
const names = ["phuthe-hammer-atlas.mjs", "phuthe-hammer-atlas-finalize.mjs", "phuthe-hammer-atlas-cut.mjs"];
for (const name of names) {
  let code = fs.readFileSync(path.join(root, "tools/assets", name), "utf8");
  if (!code.includes("hao_thien_chuy")) throw Error(`${name}: công thức mẫu đã đổi mã`);
  code = code.replaceAll("hao_thien_chuy", id).replaceAll("Hạo Thiên Chùy", "Phá Hồn Thương")
    .replaceAll('kind: "vukhi",', 'kind: "vukhi", frame: 128,')
    .replaceAll("#00D0D0", "#D0D000").replace(".11294905654", ".10").replace("poseA ? Math.max(0,", "poseA ? Math.max(3,").replace("filter((c) => c.area >= 4)", "filter((c) => c.area >= 100)");
  code = code.replace(/from "\.\/(.*?)"/g, (_, p) => "from " + JSON.stringify(pathToFileURL(path.join(root, "tools/assets", p)).href));
  fs.writeFileSync(path.join(scratch, name), code);
}
function run(name, params) {
  const r = spawnSync(process.execPath, [path.join(scratch, name), ...params], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) throw Error(`${name}: mã thoát ${r.status}`);
}
const out = path.resolve(args[args.indexOf("--out") + 1]);
run(names[1], ["--sources", path.resolve(args[args.indexOf("--sources") + 1]), "--pose-a", "--out", path.join(out, "final")]);
const report = JSON.parse(fs.readFileSync(path.join(out, "final/report.json"), "utf8"));
if (report.dirs.length === 5) run(names[2], ["--dir", path.join(out, "final"), "--out", path.join(out, "import")]);
