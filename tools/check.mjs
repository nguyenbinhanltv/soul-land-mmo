// Kiểm tra kiểu TypeScript cho server và/hoặc client, chỉ chạy phần bị ảnh hưởng.
//   node tools/check.mjs            -> kiểm tra cả hai
//   node tools/check.mjs --staged   -> theo file đã git add (dùng cho pre-commit); đổi sprite/asset thì chạy thêm
//                                      tools/assets/validate.mjs (npm run check luôn chạy validate); đổi bố cục tools/maps,
//                                      bản đồ dựng lại, tiles.json hoặc data.ts thì chạy thêm tools/maps/build.mjs --check
//   node tools/check.mjs --hook     -> đọc JSON hook của Claude Code từ stdin (PostToolUse Edit/Write)
// Lỗi: thoát mã 1 (git) hoặc 2 (hook Claude, để AI đọc lỗi và tự sửa).
import { spawnSync, execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const mode = process.argv[2] ?? "";

/** Từ danh sách file -> cần kiểm tra project nào. shared/ ảnh hưởng cả hai. */
function targets(files) {
  const t = new Set();
  for (const f of files) {
    const rel = path.relative(root, path.resolve(root, f)).split(path.sep).join("/");
    if (!/\.(ts|mts|tsx)$/.test(rel) && !/(^|\/)tsconfig\.json$/.test(rel)) continue;
    if (rel.startsWith("server/")) t.add("server");
    else if (rel.startsWith("client/")) t.add("client");
    else if (rel.startsWith("shared/")) { t.add("server"); t.add("client"); }
  }
  return [...t];
}

let projects, assets = false, maps = false;
if (mode === "--hook") {
  let f;
  try { f = JSON.parse(readFileSync(0, "utf8") || "{}")?.tool_input?.file_path; } catch { f = undefined; }
  // Không đọc được file vừa sửa -> kiểm tra cả hai cho chắc, không lặng lẽ cho qua.
  projects = typeof f === "string" ? targets([f]) : ["server", "client"];
} else if (mode === "--staged") {
  const out = execSync("git diff --cached --name-only --diff-filter=ACMR", { cwd: root, encoding: "utf8" });
  projects = targets(out.split(/\r?\n/).filter(Boolean));
  // Sprite, manifest, ô / vật isometric (tiles.json), file bản đồ, dây chuyền asset, bảng màu hoặc màu võ hồn đổi (kể cả xóa file) -> chạy validate (~0,1 giây).
  const all = execSync("git diff --cached --name-only", { cwd: root, encoding: "utf8" });
  assets = /^(shared\/assets\/sprites\/|shared\/assets\/iso\/|shared\/assets\/[a-z_]+(\.v\d+)?\.json$|tools\/assets\/|art\/palette\.gpl$|shared\/data\.ts$)/m.test(all);
  // Bản đồ dựng bằng tools/maps (11.3): file Tiled phải đúng bằng bản sinh từ bố cục + lớp tay (~0,3 giây mỗi bản đồ).
  maps = /^(tools\/maps\/|shared\/assets\/[a-z_]+\.v\d+\.json$|shared\/assets\/mini\/|shared\/assets\/iso\/tiles\.json$|shared\/data\.ts$)/m.test(all);
} else projects = ["server", "client"];

let failed = false;
// #701: catch rỗng nuốt lỗi im lặng ở server/src: chỉ cho phép ROLLBACK (rollback lỗi thì không còn gì làm).
// Chỗ khác: log có ngữ cảnh, xử lý, hoặc ghi chú vì sao bỏ qua ngay trong thân catch (có comment thì không tính là rỗng).
if (mode === "") {
  const silent = /catch\s*(\([^)]*\))?\s*\{\s*\}|\.catch\(\s*\(\s*\w*\s*\)\s*=>\s*\{\s*\}\s*\)/;
  const bad = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== "node_modules") walk(f); continue; }
      if (!e.name.endsWith(".ts")) continue;
      readFileSync(f, "utf8").split(/\r?\n/).forEach((line, i) => {
        if (silent.test(line) && !line.includes("ROLLBACK")) bad.push(`${path.relative(root, f).split(path.sep).join("/")}:${i + 1}`);
      });
    }
  };
  walk(path.join(root, "server", "src"));
  if (bad.length) { failed = true; console.error(`[check] catch rỗng nuốt lỗi (chỉ ROLLBACK được phép; log có ngữ cảnh hoặc ghi chú vì sao trong thân catch):\n  ${bad.join("\n  ")}`); }
}
for (const p of projects) {
  const tsc = path.join(root, p, "node_modules", "typescript", "bin", "tsc");
  // Kiểm tra đầy đủ trên CI (CI=true, GitHub Actions tự đặt): thiếu thư viện là lỗi, không được lặng lẽ cho qua.
  if (!existsSync(tsc)) {
    const strict = mode === "" && process.env.CI === "true";
    console.error(`[check] ${strict ? "Lỗi" : "Bỏ qua"} ${p}: chưa cài thư viện (npm run install:all).`);
    if (strict) failed = true;
    continue;
  }
  const r = spawnSync(process.execPath, [tsc, "--noEmit", "-p", path.join(root, p)], { cwd: root, encoding: "utf8" });
  if (r.status !== 0) {
    failed = true;
    console.error(`[check] Lỗi TypeScript trong ${p}:\n${(r.stdout + r.stderr).trim()}`);
  } else if (mode !== "--hook") console.log(`[check] ${p}: OK`);
}
if (assets) {
  const r = spawnSync(process.execPath, [path.join(root, "tools", "assets", "validate.mjs")], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) failed = true;
}
if (maps) {
  const r = spawnSync(process.execPath, [path.join(root, "tools", "maps", "build.mjs"), "--check"], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) failed = true;
  // #747: vật vẽ (nhà, tường, cây, prop chặn) phải khớp ô chặn `collides` (đi xuyên hàng rào = lỗi).
  const q = spawnSync(process.execPath, [path.join(root, "tools", "maps", "quet-chan.mjs")], { cwd: root, stdio: "inherit" });
  if (q.status !== 0) failed = true;
}
process.exit(failed ? (mode === "--hook" ? 2 : 1) : 0);
