// Nhập đúng byte bảy mẫu chủ repo đã duyệt cho #1596; --check không ghi.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { ROOT, SPRITES, MANIFEST } from "./lib.mjs";
import { buildAchvPreview } from "./achv-icon-preview.mjs";

const check = process.argv.includes("--check"), { files, source } = buildAchvPreview();
if (!source.approved_by || !source.approved_files) throw new Error("Chưa có duyệt mỹ thuật và hash các mẫu");
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")), missing = [];
for (const m of source.mapping) for (const size of [32, 24]) {
  const name = `${m.key}-${size}.png`, bytes = files.get(name);
  if (createHash("sha256").update(bytes).digest("hex") !== source.approved_files[name]) throw new Error(`Lệch mẫu đã duyệt: ${name}`);
  const key = `${m.key}${size === 24 ? "_1x" : ""}`, dest = path.join(SPRITES, "iso/gi", `${key.slice(3)}.png`);
  if (check) {
    if (!existsSync(dest) || !bytes.equals(readFileSync(dest))) missing.push(key);
    if (!manifest.sprites.some((e) => e.key === key && e.iso)) missing.push(`${key}:manifest`);
    continue;
  }
  mkdirSync(path.dirname(dest), { recursive: true }); writeFileSync(dest, bytes);
  const r = spawnSync(process.execPath, [path.join(ROOT, "tools/assets/validate.mjs"), "--register", key, "--iso", "--keep-order", "--tool", "ChatGPT / Codex builtin OpenAI image_gen.imagegen", "--prompt", `Icon Thành Tựu: ${m.label}; prompt thật: art/src/ui-kit/achv-1596/prompt.txt`, "--note", "Chủ repo duyệt cả 7 mẫu, điều phối phiên soul_land_game-815 ngày 02/11/2026; đúng byte PNG đã duyệt. RAW nguyên byte native1254×1254/hash: art/src/ui-kit/achv-1596/NGUON.md; đầu ra OpenAI, không CC0."], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stdout + r.stderr);
  console.log(r.stdout.trim());
}
if (missing.length) throw new Error(`Lệch bản nhập: ${missing.join(", ")}`);
console.log(`[achv-icon] 14 PNG ${check ? "khớp mẫu đã duyệt và manifest" : "đã nhập và đăng ký bằng công cụ"}`);
