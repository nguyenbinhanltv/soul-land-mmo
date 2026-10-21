// Dựng một mảnh bản đồ isometric mẫu từ các ảnh ô để soát mép ghép, màu và độ lặp bằng mắt.
//   node tools/assets/iso-preview.mjs <ra.png> --tiles grass=a.png,grass=b.png,path=c.png,water=d.png,deep=e.png,stone=f.png
//        [--big grass=A.png,water=B.png,…] [--size 16] [--scale 2] [--seed 1] [--bg #1a1020]
//
// Vai trò ô: grass (nền, nhiều ô cùng vai trò thì chọn theo băm vị trí), path (đường thẳng dọc trục + một nhánh),
// water / deep (ao: mép nông, lòng sâu), stone (sân đá 3×3). Vai trò thiếu thì dùng grass.
// Ảnh ô theo mục 5.11 (ISO_TILE_IMAGES trong lib.mjs): thoi W×W/2 đặt tại tâm quy cách trong ảnh (32×32 tâm (16,19),
// 64×64 tâm (32,37)), đáy bên dưới bị ô phía trước che. Ảnh chỉ có mặt trên (cao W/2) thì mặt trên ở đầu ảnh.
// Ô (i, j) có tâm mặt trên ở x = (i − j)·W/2, y = (i + j)·W/4; vẽ từ sau ra trước (i + j tăng dần).
// --big: ô lớn bề ngang 2W phủ 2×2 ô logic, đặt ở mọi khối 2×2 thẳng hàng chẵn mà cả 4 ô cùng vai trò.
import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodePng, Img, hex, ISO_TILE_IMAGES } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const tilesOpt = opt("--tiles", ""), bigOpt = opt("--big", ""), N = +opt("--size", "16"), scale = +opt("--scale", "2"), seed = +opt("--seed", "1"), bg = hex(opt("--bg", "#1a1020"));
const out = args[0];
if (!out || !tilesOpt) { console.error("Cách dùng: iso-preview.mjs <ra.png> --tiles grass=a.png,path=b.png,… [--big grass=A.png,…] [--size 16] [--scale 2]"); process.exit(1); }

/** Đọc danh sách vai trò=ảnh; mỗi ảnh kèm tâm mặt trên trong ảnh. */
function readRoles(opt) {
  const roles = new Map();
  for (const part of opt.split(",").filter(Boolean)) {
    const [role, file] = part.split("="), img = decodePng(readFileSync(file));
    const spec = ISO_TILE_IMAGES[img.w], center = img.h === img.w / 2 || !spec ? [img.w / 2, img.w / 4] : spec.center;
    roles.set(role, [...(roles.get(role) ?? []), { img, center }]);
  }
  return roles;
}
const roles = readRoles(tilesOpt), bigRoles = readRoles(bigOpt);
if (!roles.has("grass")) { console.error("--tiles cần ít nhất một ô grass"); process.exit(1); }
const W = roles.get("grass")[0].img.w, H = W / 2;
for (const [role, list] of [...roles, ...bigRoles]) for (const t of list) {
  const want = bigRoles.get(role)?.includes(t) ? 2 * W : W;
  if (t.img.w !== want) { console.error(`${role}: ảnh rộng ${t.img.w}, cần ${want}`); process.exit(1); }
}

// Băm vị trí → số 0…1 ổn định (chọn biến thể).
const rnd = (i, j) => { let h = (i * 374761393 + j * 668265263 + seed * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function roleAt(i, j) {
  const pond = Math.hypot(i - N * 0.72, j - N * 0.28);
  if (pond < N * 0.12) return "deep";
  if (pond < N * 0.22) return "water";
  if (i >= Math.floor(N * 0.15) && i < Math.floor(N * 0.15) + 3 && j >= Math.floor(N * 0.62) && j < Math.floor(N * 0.62) + 3) return "stone";
  if (j === Math.floor(N / 2) || (i === Math.floor(N * 0.35) && j > N / 2)) return "path";
  return "grass";
}
const pick = (map, role, i, j) => { const list = map.get(role) ?? map.get("grass"); return list[Math.floor(rnd(i, j) * list.length) % list.length]; };

// Danh sách vẽ: ô lớn cho khối 2×2 cùng vai trò (nếu có ảnh lớn cho vai trò đó), còn lại ô thường.
const draws = [], covered = new Set();
if (bigRoles.size) for (let i = 0; i + 1 < N; i += 2) for (let j = 0; j + 1 < N; j += 2) {
  const r = roleAt(i, j);
  if (!bigRoles.has(r) || [[1, 0], [0, 1], [1, 1]].some(([a, b]) => roleAt(i + a, j + b) !== r)) continue;
  for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) covered.add(`${i + a},${j + b}`);
  // Tâm khối 2×2 trên màn hình = tâm ô (i + 0,5, j + 0,5); độ sâu theo ô trước nhất.
  draws.push({ t: pick(bigRoles, r, i, j), ci: i + 0.5, cj: j + 0.5, depth: i + j + 2 });
}
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (!covered.has(`${i},${j}`)) draws.push({ t: pick(roles, roleAt(i, j), i, j), ci: i, cj: j, depth: i + j });
draws.sort((a, b) => a.depth - b.depth);

const pad = Math.max(...draws.map((d) => d.t.img.h - d.t.center[1])) + 2;
const cw = N * W, chh = N * H + pad + 2, ox = (N * W) / 2, oy = H / 2 + 2;
const canvas = new Img(cw, chh);
for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) canvas.set(x, y, [...bg, 255]);
for (const { t, ci, cj } of draws) {
  const cx = ox + ((ci - cj) * W) / 2, cy = oy + ((ci + cj) * H) / 2;
  canvas.blit(t.img, 0, 0, t.img.w, t.img.h, Math.round(cx - t.center[0]), Math.round(cy - t.center[1]), true);
}
const dst = new Img(cw * scale, chh * scale);
for (let y = 0; y < dst.h; y++) for (let x = 0; x < dst.w; x++) dst.set(x, y, canvas.get(Math.floor(x / scale), Math.floor(y / scale)));
writeFileSync(out, encodePng(dst));
console.log(`[iso-preview] ${out} (${N}×${N} ô ${W}×${H}${bigRoles.size ? `, ${draws.filter((d) => d.t.img.w === 2 * W).length} ô lớn` : ""}, ×${scale} → ${dst.w}×${dst.h})`);
