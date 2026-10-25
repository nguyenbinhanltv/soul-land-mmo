// Ngân sách dung lượng bản build client (#743). Đọc client/dist, so từng nhóm với ngưỡng = mốc × heso (tools/bundle-budget.json),
// in bảng và thoát mã 1 khi vượt. Chạy sau `npm run build` (job check-build): `npm run budget`.
// Cập nhật mốc khi tăng dung lượng có chủ đích: `node tools/bundle-budget.mjs --update` (ghi mốc mới từ bản build hiện tại), rồi ghi lý do vào PR.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "client", "dist");
const cfgPath = join(root, "tools", "bundle-budget.json");

const NHAN = {
  "js-landing": "JS landing (không Phaser)",
  "js-game": "JS game (không Phaser)",
  "js-phaser": "JS Phaser (chunk riêng)",
  css: "CSS (landing + game)",
  "anh-landing": "Ảnh landing (ui/landing)",
};

function walk(d) {
  return readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function measure() {
  const m = Object.fromEntries(Object.keys(NHAN).map((k) => [k, 0]));
  const assets = join(dist, "assets");
  for (const f of readdirSync(assets)) {
    const size = statSync(join(assets, f)).size;
    if (f.endsWith(".css")) m.css += size;
    else if (f.endsWith(".js")) m[/^phaser-/.test(f) ? "js-phaser" : /^landing-/.test(f) ? "js-landing" : "js-game"] += size;
  }
  const lan = join(dist, "ui", "landing");
  if (existsSync(lan)) for (const p of walk(lan)) m["anh-landing"] += statSync(p).size;
  return m;
}

if (!existsSync(join(dist, "assets"))) {
  console.error(`✗ bundle-budget: chưa có ${relative(root, dist)} (chạy npm run build trước)`);
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
const m = measure();

if (process.argv.includes("--update")) {
  cfg.moc = m;
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n");
  console.log("Đã ghi mốc mới vào tools/bundle-budget.json:", m);
  process.exit(0);
}

const kb = (n) => (n / 1024).toFixed(1).padStart(9) + " KB";
let loi = 0;
console.log("Ngân sách dung lượng bản build client (ngưỡng = mốc × " + cfg.heso + ")");
for (const k of Object.keys(NHAN)) {
  const moc = cfg.moc[k];
  const nguong = Math.floor(moc * cfg.heso);
  const vuot = m[k] > nguong;
  if (vuot) loi++;
  console.log(`${vuot ? "✗" : "✓"} ${NHAN[k].padEnd(28)} ${kb(m[k])}  mốc ${kb(moc)}  ngưỡng ${kb(nguong)}`);
}
if (loi) {
  console.error(`✗ ${loi} nhóm vượt ngưỡng. Nếu tăng có chủ đích: node tools/bundle-budget.mjs --update và ghi lý do vào PR (docs/ops/ci.md).`);
  process.exit(1);
}
