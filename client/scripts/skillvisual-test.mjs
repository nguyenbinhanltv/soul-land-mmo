// Kiểm bảng SKILL_VISUAL (client/src/skillVisual.ts): mọi khóa trỏ tới chiêu có thật, sheet khai báo có trong manifest hoặc dựng bằng code.
// Đọc nguồn bằng regex (skillVisual.ts kéo Phaser, Node không nạp được). Chạy: npm run test:skillvisual --prefix client
import { readFileSync } from "node:fs";
import { VOHON, ringSkill, chanThanOf, MAX_RINGS } from "../../shared/data.ts";

let fails = 0;
const ok = (c, msg) => { console.log(`${c ? "✓" : "✗"} ${msg}`); if (!c) fails++; };
const src = readFileSync(new URL("../src/skillVisual.ts", import.meta.url), "utf8");
const body = src.slice(src.indexOf("export const SKILL_VISUAL"), src.indexOf("export function skillVisualOf"));
const keys = [...body.matchAll(/^\s*"([a-z_]+):(\d+|ct)":/gm)].map((m) => [m[1], m[2]]);
ok(keys.length > 0, `bảng có ${keys.length} mục thử`);
for (const [id, r] of keys) {
  const has = VOHON.some((v) => v.id === id) && (r === "ct" ? !!chanThanOf(id)?.skill : +r < MAX_RINGS && !!ringSkill(id, +r));
  ok(has, `khóa ${id}:${r} là chiêu có thật`);
}
const manifest = JSON.parse(readFileSync(new URL("../../shared/assets/sprites/manifest.json", import.meta.url), "utf8")).sprites.map((e) => (typeof e === "string" ? e : e.key));
const codeSheets = [...src.matchAll(/makeCodeSheet\(scene, "([a-z_]+)"/g)].map((m) => m[1]);
for (const k of new Set([...body.matchAll(/key: "([a-z_]+)"/g)].map((m) => m[1]))) ok(manifest.includes(k) || codeSheets.includes(k), `sheet ${k} có ảnh (manifest) hoặc dựng bằng code`);
if (fails) { console.error(`${fails} lỗi`); process.exit(1); }
