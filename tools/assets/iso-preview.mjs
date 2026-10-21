// Dựng một mảnh bản đồ isometric mẫu từ các ô hình thoi để soát mép ghép, màu và độ lặp bằng mắt.
//   node tools/assets/iso-preview.mjs <ra.png> --tiles grass=a.png,grass=b.png,path=c.png,water=d.png,deep=e.png,stone=f.png
//        [--size 12] [--scale 2] [--seed 1] [--bg #1a1020] [--label "Gemini"]
//
// Vai trò ô: grass (nền, nhiều ô cùng vai trò thì chọn ngẫu nhiên theo vị trí), path (đường thẳng dọc trục + một nhánh),
// water / deep (ao: mép nông, lòng sâu), stone (sân đá 3×3). Vai trò thiếu thì dùng grass.
// Ô phẳng W×W/2 (hoặc khối cao hơn, mặt trên vẫn W×W/2 ở đầu ảnh) đặt theo lưới thoi: ô (i, j) ở
// x = (i − j)·W/2, y = (i + j)·W/4, vẽ từ sau ra trước (i + j tăng dần).
import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodePng, Img, hex } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const tilesOpt = opt("--tiles", ""), N = +opt("--size", "12"), scale = +opt("--scale", "2"), seed = +opt("--seed", "1"), bg = hex(opt("--bg", "#1a1020"));
const out = args[0];
if (!out || !tilesOpt) { console.error("Cách dùng: iso-preview.mjs <ra.png> --tiles grass=a.png,path=b.png,… [--size 12] [--scale 2]"); process.exit(1); }

const roles = new Map();
for (const part of tilesOpt.split(",")) {
  const [role, file] = part.split("=");
  roles.set(role, [...(roles.get(role) ?? []), decodePng(readFileSync(file))]);
}
if (!roles.has("grass")) { console.error("--tiles cần ít nhất một ô grass"); process.exit(1); }
const any = roles.get("grass")[0], W = any.w, H = Math.floor(W / 2);

// Băm vị trí → số 0…1 ổn định (chọn biến thể ô cỏ).
const rnd = (i, j) => { let h = (i * 374761393 + j * 668265263 + seed * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function roleAt(i, j) {
  const pond = Math.hypot(i - N * 0.72, j - N * 0.28);
  if (pond < N * 0.12) return "deep";
  if (pond < N * 0.22) return "water";
  if (i >= N * 0.15 && i < N * 0.15 + 3 && j >= N * 0.62 && j < N * 0.62 + 3) return "stone";
  if (j === Math.floor(N / 2) || (i === Math.floor(N * 0.35) && j > N / 2)) return "path";
  return "grass";
}
const pick = (role, i, j) => { const list = roles.get(role) ?? roles.get("grass"); return list[Math.floor(rnd(i, j) * list.length) % list.length]; };

const maxH = Math.max(...[...roles.values()].flat().map((t) => t.h));
const cw = N * W, chh = N * H + (maxH - H) + 2;
const canvas = new Img(cw, chh);
for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) canvas.set(x, y, [...bg, 255]);
const ox = Math.floor((N * W) / 2 - W / 2);
for (let d = 0; d <= 2 * (N - 1); d++) for (let i = 0; i < N; i++) {
  const j = d - i;
  if (j < 0 || j >= N) continue;
  const t = pick(roleAt(i, j), i, j);
  canvas.blit(t, 0, 0, t.w, t.h, ox + Math.floor(((i - j) * W) / 2), Math.floor(((i + j) * H) / 2), true);
}
const dst = new Img(cw * scale, chh * scale);
for (let y = 0; y < dst.h; y++) for (let x = 0; x < dst.w; x++) dst.set(x, y, canvas.get(Math.floor(x / scale), Math.floor(y / scale)));
writeFileSync(out, encodePng(dst));
console.log(`[iso-preview] ${out} (${N}×${N} ô ${W}×${H}, ×${scale} → ${dst.w}×${dst.h})`);
