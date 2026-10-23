// Nhập biểu tượng trang bị hồn sư (GAME_DESIGN 5.15, #417) từ ảnh lưới nền trong suốt thật (ChatGPT, bậc 0–4) hoặc nền #FF00FF phẳng (Gemini, từ bậc 5): tự nhận, logo Gemini ở góc tự gỡ.
//   node tools/assets/equip-import.mjs --in <thư mục ảnh> --out <thư mục ra> [--only b0,b1,o,k] [--key #FF00FF] [--cell <mã>=<cỡ>]...
//
// Ảnh vào (tên theo bộ prompt `trangbi-*`, tìm trong --in, kể cả thư mục con `trang-bi/`):
//   trangbi-b0 … trangbi-b5   lưới 5×2, 10 ô × một bậc (EQUIP_TIERS theo thứ tự) → item_equip_<ô>_<bậc>
//   trangbi-o                 lưới 5×2, 10 bóng ô                                 → item_equip_slot_<ô>
//   trangbi-k                 lưới 3×2, 6 khung viền theo bậc (phủ kín 32×32)     → item_equip_frame_<bậc>
//   Nền #FF00FF: nộp thẳng (màu nền tự dò ở góc); tên hậu tố `-magenta` (trangbi-b2-magenta.png) hoặc --key #FF00FF cũng được.
// Thứ tự trong lưới: hàng trên rồi hàng dưới, ô theo EQUIP_SLOTS (vũ khí, mũ, áo, đai, giày / dây chuyền, vòng trái, vòng phải, nhẫn trái, nhẫn phải).
// --cell <mã>=<cỡ>: cỡ khối điểm ảnh thật của ảnh đó (px của ảnh gốc) khi tự dò sai; dò thấy một nửa chu kỳ thì ra biểu tượng nát.
//   Khung `k` (viền 2 khối + 2 nét viền) hay bị dò gấp đôi: dùng `--cell k=10.4` (ảnh ChatGPT 1536×1024, khối ~10,4 px).
// Mỗi ảnh chạy qua `gemini-import.mjs --kind item --icon` (khung: `--frame`): tách lưới, dò cỡ điểm ảnh giả, đưa về pixel thật,
// vừa khung 32×32 (ISO_ITEM_ICON), viền #1a1020, bảng màu riêng mỗi vật. Kết quả ra <out>/item_equip_*.png + <out>/_work/<mã>/ (báo cáo,
// xem trước). Danh sách khóa lấy từ shared/data.ts (equipIconKeys); cuối lệnh in khóa còn thiếu. Không chép vào shared/assets.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { equipSlotTierIds } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d = "") => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const cells = {};
for (let i; (i = args.indexOf("--cell")) >= 0;) { const [c, v] = args.splice(i, 2)[1].split("="); cells[c] = v; }
const inDir = opt("--in"), outDir = opt("--out"), only = opt("--only").split(",").filter(Boolean), key = opt("--key");
if (!inDir || !outDir) { console.error("Cách dùng: equip-import.mjs --in <thư mục ảnh trangbi-*.png> --out <thư mục ra> [--only b0,b1,o,k] [--key #FF00FF]"); process.exit(1); }

const { slots, tiers } = equipSlotTierIds();
const find = (dir, code) => {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) { const r = find(p, code); if (r) return r; continue; }
    if (new RegExp(`^trangbi-${code}(-magenta)?\\.png$`).test(f)) return { file: p, magenta: f.includes("-magenta") };
  }
  return null;
};
// Mã ảnh → lưới, tên vật (theo thứ tự đọc) và tiền tố khóa ra.
const JOBS = [
  ...tiers.map((t, i) => ({ code: `b${i}`, grid: "5x2", names: slots.map((s) => `${s}_${t}`), key: (n) => `item_equip_${n}` })),
  { code: "o", grid: "5x2", names: slots, key: (n) => `item_equip_slot_${n}` },
  { code: "k", grid: "3x2", names: tiers, key: (n) => `item_equip_frame_${n}`, frame: true },
];
const gem = path.join(path.dirname(fileURLToPath(import.meta.url)), "gemini-import.mjs");
mkdirSync(outDir, { recursive: true });
const made = new Set();
for (const job of JOBS) {
  if (only.length && !only.includes(job.code)) continue;
  const src = find(inDir, job.code);
  if (!src) { console.warn(`[equip] chưa có trangbi-${job.code}, bỏ qua`); continue; }
  const work = path.join(outDir, "_work", job.code);
  const run = ["--kind", "item", "--icon", ...(job.frame ? ["--frame"] : []), "--cell", cells[job.code] ?? "auto", "--logo", "auto", "--grid", job.grid, "--names", job.names.join(","), "--out", work, ...(src.magenta || key ? ["--key", key || "#FF00FF"] : []), src.file];
  console.log(`[equip] ${job.code}: ${src.file}`);
  execFileSync(process.execPath, [gem, ...run], { stdio: "inherit" });
  for (const n of job.names) { copyFileSync(path.join(work, `${n}.png`), path.join(outDir, `${job.key(n)}.png`)); made.add(job.key(n)); }
}
const all = [...slots.flatMap((s) => tiers.map((t) => `item_equip_${s}_${t}`)), ...slots.map((s) => `item_equip_slot_${s}`), ...tiers.map((t) => `item_equip_frame_${t}`)];
const have = all.filter((k) => existsSync(path.join(outDir, `${k}.png`)));
const miss = all.filter((k) => !have.includes(k));
console.log(`[equip] ${made.size} khóa mới; tổng ${have.length}/${all.length} khóa equipIconKeys${miss.length ? `; thiếu: ${miss.join(", ")}` : ""}`);
