// Nhập bộ ảnh Danh Hiệu đã duyệt (#1777 → #1792) từ art/src/danh-hieu-1777 vào shared/assets/sprites/iso/danh_hieu và đăng ký
// bằng validate.mjs (manifest + art/CREDITS.md). Chép đúng byte; chạy lại an toàn. `--check` không ghi, chỉ so byte + manifest.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { ROOT, SPRITES, MANIFEST } from "./lib.mjs";

const SRC = path.join(ROOT, "art/src/danh-hieu-1777"), check = process.argv.includes("--check");
const GROUPS = [
  { dir: "khung", tool: "ChatGPT / Codex builtin OpenAI image_gen.imagegen", note: "Khung nine-patch L8/T13/R8/B11 và đầu trái (đầu phải lật ngang ở client); concept #1771; đầu ra OpenAI, không CC0; art/src/danh-hieu-1777/khung/NGUON.md" },
  { dir: "bieu-tuong", tool: "ChatGPT / Codex builtin OpenAI image_gen.imagegen", note: "Biểu tượng nhóm 32×32; đầu ra OpenAI, không CC0; art/src/danh-hieu-1777/bieu-tuong/NGUON.md" },
  { dir: "hieu-ung", tool: "ChatGPT / Codex (pixel vẽ bằng code, không gọi model)", note: "Clip 4 pha bậc 5–6 và hạt; ảnh tự tạo của dự án, không CC0; art/src/danh-hieu-1777/hieu-ung/NGUON.md", frames: { clip: [16, 24], hat: [8, 8] } },
];
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")), bad = [];
let n = 0;
for (const g of GROUPS) for (const f of readdirSync(path.join(SRC, g.dir)).filter((x) => x.endsWith(".png")).sort()) {
  const key = f.slice(0, -4), bytes = readFileSync(path.join(SRC, g.dir, f)), dest = path.join(SPRITES, "iso/danh_hieu", f);
  const frame = g.frames?.[key.split("_")[2]];
  if (check) {
    if (!existsSync(dest) || !bytes.equals(readFileSync(dest))) bad.push(key);
    if (!manifest.sprites.some((e) => e.key === key && e.iso)) bad.push(`${key}:manifest`);
    n++; continue;
  }
  mkdirSync(path.dirname(dest), { recursive: true }); writeFileSync(dest, bytes);
  const prompt = `Danh Hiệu: ${key}; nguồn và prompt ở art/src/danh-hieu-1777/${g.dir}/`;
  const r = spawnSync(process.execPath, [path.join(ROOT, "tools/assets/validate.mjs"), "--register", key, "--iso", "--keep-order", ...(frame ? ["--frame", frame.join("x")] : []), "--tool", g.tool, "--prompt", prompt, "--note", g.note], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stdout + r.stderr);
  n++;
}
if (bad.length) throw new Error(`Lệch bản nhập: ${bad.join(", ")}`);
console.log(`[danh-hieu] ${n} PNG ${check ? "khớp nguồn và manifest" : "đã nhập và đăng ký bằng công cụ"}`);
