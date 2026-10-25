// Sinh danh sách võ hồn của landing (client/index.html, giữa hai dấu <!--vohon:start--> và <!--vohon:end-->) từ shared/data.ts,
// để tên / hệ / độ hiếm không lệch bản game. Chân dung lấy từ tấm ghép shared/assets/ui/landing/vohon.webp (5×5 ô 64 px, theo thứ tự VOHON;
// dựng lại tấm ghép bằng tools/landing-sheet.py khi thêm võ hồn). Dùng: node tools/landing-gen.mjs [--check]
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { VOHON, HE } = await import(pathToFileURL(join(root, "shared/data.ts")).href);
const file = join(root, "client/index.html");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

if (VOHON.length > 25) console.warn(`Có ${VOHON.length} võ hồn: tấm ghép 5×5 chỉ chứa 25, cần dựng lại tấm ghép và sửa tiêu đề "Thư viện 25 võ hồn".`);
const items = VOHON.map((v, i) => {
  const owner = v.owner ? `<small class="who">${esc(v.owner)}</small>` : "";
  return `      <li data-he="${v.he}" style="--x:${i % 5};--y:${Math.floor(i / 5)};--c:${v.col}"><span class="pt" aria-hidden="true"></span><b>${esc(v.name)}</b><span class="meta">${HE[v.he].name} · ${v.rarity}</span>${owner}</li>`;
}).join("\n");

const html = readFileSync(file, "utf8");
const re = /(<!--vohon:start-->)[\s\S]*?(<!--vohon:end-->)/;
if (!re.test(html)) throw new Error("Thiếu dấu <!--vohon:start--> / <!--vohon:end--> ở client/index.html");
const eol = html.includes("\r\n") ? "\r\n" : "\n"; // checkout Windows (autocrlf) có thể là CRLF
const out = html.replace(re, (_, a, b) => `${a}${eol}${items.replaceAll("\n", eol)}${eol}${b}`);
if (process.argv.includes("--check")) {
  if (out !== html) { console.error("Danh sách võ hồn ở client/index.html đã cũ: chạy node tools/landing-gen.mjs"); process.exit(1); }
  console.log("Danh sách võ hồn của landing khớp shared/data.ts");
} else {
  writeFileSync(file, out);
  console.log(`Đã ghi ${VOHON.length} võ hồn vào client/index.html`);
}
