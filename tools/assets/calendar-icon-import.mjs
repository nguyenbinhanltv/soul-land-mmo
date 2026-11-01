// Nhập sáu icon đã được chủ repo duyệt tại #1626; giữ đúng byte bản 24/32px đã duyệt.
// node tools/assets/calendar-icon-import.mjs [--check]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { ROOT, SPRITES, MANIFEST } from "./lib.mjs";
import { buildCandidate, EVENTS } from "./calendar-icon-candidate.mjs";

const check = process.argv.includes("--check"), dir = path.join(ROOT, "art/src/ui-kit/calendar-1597");
const source = JSON.parse(readFileSync(path.join(dir, "nguon.json"), "utf8"));
if (source.status !== "da-duyet-da-nhap") throw new Error("Chưa có trạng thái chủ repo duyệt mẫu Lịch");
const { files } = buildCandidate();
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const missing = [];
for (const [id, name] of EVENTS) for (const size of [32, 24]) {
  const candidate = `${id}-${size}.png`, bytes = files.get(candidate), hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== source.candidate_files[candidate].sha256) throw new Error(`Bản cắt lệch mẫu đã duyệt: ${candidate}`);
  const key = `gi_calendar_${id}${size === 24 ? "_1x" : ""}`, dest = path.join(SPRITES, "iso/gi", `${key.slice(3)}.png`);
  if (check) {
    if (!existsSync(dest) || !bytes.equals(readFileSync(dest))) missing.push(key);
    if (!manifest.sprites.some((e) => e.key === key && e.iso)) missing.push(`${key}:manifest`);
    continue;
  }
  mkdirSync(path.dirname(dest), { recursive: true }); writeFileSync(dest, bytes);
  const r = spawnSync(process.execPath, [path.join(ROOT, "tools/assets/validate.mjs"), "--register", key, "--iso", "--keep-order", "--tool", "ChatGPT / Codex builtin OpenAI image_gen.imagegen", "--prompt", `Icon Lịch Hoạt Động: ${name}; prompt thật: art/src/ui-kit/calendar-1597/prompt.txt`, "--note", "Chủ repo đã duyệt #1626/#1597; RAW native1254×1254 nguyên byte/SHA256 ở NGUON.md và nguon.json; điều khoản đầu ra OpenAI, không CC0."], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stdout + r.stderr);
  console.log(r.stdout.trim());
}
if (missing.length) throw new Error(`Lệch bản nhập: ${missing.join(", ")}`);
console.log(`[calendar-icon] 12 PNG ${check ? "khớp byte mẫu đã duyệt và manifest" : "đã nhập và đăng ký bằng công cụ"}`);
