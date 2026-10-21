// Kiểm tra kiểu TypeScript cho server và/hoặc client, chỉ chạy phần bị ảnh hưởng.
//   node tools/check.mjs            -> kiểm tra cả hai
//   node tools/check.mjs --staged   -> theo file đã git add (dùng cho pre-commit); đổi sprite/asset thì chạy thêm
//                                      tools/assets/validate.mjs (npm run check luôn chạy validate)
//   node tools/check.mjs --hook     -> đọc JSON hook của Claude Code từ stdin (PostToolUse Edit/Write)
// Lỗi: thoát mã 1 (git) hoặc 2 (hook Claude, để AI đọc lỗi và tự sửa).
import { spawnSync, execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

let projects, assets = false;
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
  assets = /^(shared\/assets\/sprites\/|shared\/assets\/iso\/|shared\/assets\/[a-z_]+\.json$|tools\/assets\/|art\/palette\.gpl$|shared\/data\.ts$)/m.test(all);
} else projects = ["server", "client"];

let failed = false;
for (const p of projects) {
  const tsc = path.join(root, p, "node_modules", "typescript", "bin", "tsc");
  if (!existsSync(tsc)) { console.error(`[check] Bỏ qua ${p}: chưa cài thư viện (npm run install:all).`); continue; }
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
process.exit(failed ? (mode === "--hook" ? 2 : 1) : 0);
