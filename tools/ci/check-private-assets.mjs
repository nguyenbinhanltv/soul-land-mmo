// Kiểm không có file gói asset riêng lọt vào repo công khai (#623, docs/asset-rieng.md). Chạy trong `npm run check` (CI chạy ở check-build).
// Gói Holy / Gigapack / TopDown Forest cấm phân phối lại file (kể cả đã sửa): ảnh chỉ ở kho riêng, repo giữ mô tả.
//   1) không file nào bị theo dõi trong shared/assets/private/ hoặc art/src/private/ (thư mục đặt kho riêng khi dev, đã .gitignore);
//   2) .gitignore còn chặn hai thư mục đó;
//   3) không file theo dõi nào có đường dẫn / tên trùng file của gói gốc hay file đã xử lý trong private-manifest.json;
//   4) mọi mục private-manifest.json đánh dấu "private": true và trỏ vào packs/ (không trỏ vào shared/assets công khai).
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT } from "../assets/lib.mjs";

const errs = [];
const tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 }).split(/\r?\n/).filter(Boolean);
for (const f of tracked) if (/^(shared\/assets\/private|art\/src\/private)\//.test(f)) errs.push(`file kho riêng bị theo dõi: ${f}`);

const gi = readFileSync(path.join(ROOT, ".gitignore"), "utf8");
for (const d of ["shared/assets/private/", "art/src/private/"]) if (!gi.split(/\r?\n/).includes(d)) errs.push(`.gitignore thiếu dòng "${d}"`);

// Tên file đặc trưng của gói gốc (Gigapack: spritesheet.png / frameNNNN.png trong thư mục spritesheet|PNG; Holy: <Tên>_spritesheet.png, <Tên>_NN.png; Forest).
const PACK_FILE = /(^|\/)(TopDownFantasy[^/]*|PixelHolyEffectsPack[^/]*|Super Pixel Effects Gigapack[^/]*|Decorations\.png|Tileset1xPadding\.png|RPGW_Caves[^/]*|Pixel fire asset pack[^/]*|All_Fire_Bullet_Pixel[^/]*|Effect and Bullet 16x16[^/]*)(\/|$)|(^|\/)(Heal|HolyNova|HolyShield|HolySlash_[ABC]|Smite|HeavensFury|SwordOfJustice)(_spritesheet|_\d\d)\.(png|aseprite)$|(^|\/)frame\d{4}\.png$/i;
for (const f of tracked) if (PACK_FILE.test(f)) errs.push(`trùng tên file của gói asset riêng: ${f}`);

const mf = path.join(ROOT, "shared", "assets", "sprites", "private-manifest.json");
if (existsSync(mf)) {
  const man = JSON.parse(readFileSync(mf, "utf8")), set = new Set(tracked);
  for (const e of man.sprites ?? []) {
    if (e.private !== true) errs.push(`private-manifest: ${e.key} thiếu "private": true`);
    for (const f of [e.file, e.glow].filter(Boolean)) {
      if (!/^packs\/[a-z]+\//.test(f)) errs.push(`private-manifest: ${e.key} trỏ ngoài packs/: ${f}`);
      for (const t of set) if (t.endsWith("/" + f) || t === f) errs.push(`file riêng của ${e.key} nằm trong repo: ${t}`);
    }
  }
}
if (errs.length) { for (const e of errs) console.error(`[private-assets] ✗ ${e}`); process.exit(1); }
console.log("[private-assets] OK: không có file gói riêng trong repo công khai");
