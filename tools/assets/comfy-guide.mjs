// Vẽ ảnh dẫn isometric thô cho img2img ComfyUI (skill asset-gen mục ComfyUI): khối nhà / hộp trên nền trắng, phép chiếu
// 2:1 như game (sx = x − y, sy = (x + y) / 2 − z). Chỉ chữ thì SDXL + pixel-art-xl vẽ công trình nhìn thẳng; đưa ảnh này
// làm init_image (denoise khoảng 0,75) thì model giữ góc isometric và hình khối, chỉ vẽ lại chi tiết.
//   node tools/assets/comfy-guide.mjs <ra.png> [--w 3] [--d 2.2] [--h 1.25] [--roof 1.6] [--eave 0.4] [--size 1024] [--fit 0.8] [--wallc #rrggbb] [--roofc #rrggbb] [--no-door]
//
//   --w, --d   dài theo trục x (mặt phải), sâu theo trục y (mặt trái), đơn vị ô logic.
//   --h        cao tường; --roof cao mái bốn mái (0 = hộp mái bằng: rương, bệ, tường); --eave mái chìa ra mỗi phía.
//   --wallc, --roofc  màu tường trái / mái trái dạng #rrggbb (mặt phải tối hơn; mặc định be / xám): model bám màu ảnh dẫn, nên đặt
//              theo tông vùng (băng: tường xanh nhạt, mái trắng) thay vì chỉ dựa vào chữ trong prompt.
//   --size     cạnh ảnh vuông (khớp gen_width / gen_height); --fit phần ảnh khối chiếm (chừa lề cho mái cong, mép).
//   Màu: tường trái sáng, tường phải tối (sáng từ trên bên trái, mục 5.11), mái xám, viền tối; cửa ở tường trái,
//   cửa sổ ở tường phải (--no-door bỏ cả hai).
import { writeFileSync } from "node:fs";
import { encodePng, Img } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? +args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const W = opt("--w", 3), D = opt("--d", 2.2), H = opt("--h", 1.25), R = opt("--roof", 1.6), O = opt("--eave", 0.4);
const S = opt("--size", 1024), FIT = opt("--fit", 0.8), door = !flag("--no-door");
const colOpt = (n, d) => { const i = args.indexOf(n); if (i < 0) return d; const h = args.splice(i, 2)[1]; return [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)); };
const WALLC = colOpt("--wallc", [214, 200, 170]), ROOFC = colOpt("--roofc", [96, 98, 104]);
const shade = (c, k) => c.map((v) => Math.round(v * k));
const out = args[0];
if (!out || !(W > 0 && D > 0 && H > 0 && R >= 0 && O >= 0 && S >= 64 && FIT > 0 && FIT <= 1)) {
  console.error("Cách dùng: comfy-guide.mjs <ra.png> [--w 3] [--d 2.2] [--h 1.25] [--roof 1.6] [--eave 0.4] [--size 1024] [--fit 0.8] [--wallc #rrggbb] [--roofc #rrggbb] [--no-door]");
  process.exit(1);
}

// Khung bao của khối (kể cả mái chìa) → tỉ lệ và tâm ảnh.
const proj = (x, y, z) => [x - y, (x + y) / 2 - z];
const o = R > 0 ? O : 0;
const corners = [];
for (const x of [-o, W + o]) for (const y of [-o, D + o]) for (const z of [0, H + R]) corners.push(proj(x, y, z));
const xs = corners.map((p) => p[0]), ys = corners.map((p) => p[1]);
const u = (FIT * S) / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
const cx = S / 2 - (u * (Math.max(...xs) + Math.min(...xs))) / 2, cy = S / 2 - (u * (Math.max(...ys) + Math.min(...ys))) / 2;
const P = (x, y, z) => { const [a, b] = proj(x, y, z); return [cx + u * a, cy + u * b]; };

const img = new Img(S, S);
img.data.fill(255);
const LINE = Math.max(2, Math.round(S / 170)), OUTLINE = [40, 30, 36, 255];

/** Tô đa giác lồi (điểm 3D) bằng màu col, viền tối dày LINE. */
function poly(pts3, col) {
  const pts = pts3.map((p) => P(...p));
  const x0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[0])) - LINE)), x1 = Math.min(S - 1, Math.ceil(Math.max(...pts.map((p) => p[0])) + LINE));
  const y0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[1])) - LINE)), y1 = Math.min(S - 1, Math.ceil(Math.max(...pts.map((p) => p[1])) + LINE));
  const edges = pts.map((a, i) => [a, pts[(i + 1) % pts.length]]);
  const segDist = ([a, b], x, y) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
  };
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5;
    let inside = false;
    for (const [a, b] of edges) if ((a[1] > py) !== (b[1] > py) && px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    if (edges.some((e) => segDist(e, px, py) <= LINE / 2)) img.set(x, y, OUTLINE);
    else if (inside) img.set(x, y, [...col, 255]);
  }
}

// Tường: mặt y = D (trái, sáng) và x = W (phải, tối).
poly([[0, D, 0], [W, D, 0], [W, D, H], [0, D, H]], WALLC);
poly([[W, 0, 0], [W, D, 0], [W, D, H], [W, 0, H]], shade(WALLC, 0.75));
if (door) {
  poly([[W * 0.4, D, 0], [W * 0.6, D, 0], [W * 0.6, D, H * 0.7], [W * 0.4, D, H * 0.7]], [92, 58, 36]);
  poly([[W, D * 0.3, H * 0.35], [W, D * 0.7, H * 0.35], [W, D * 0.7, H * 0.75], [W, D * 0.3, H * 0.75]], [70, 50, 40]);
}
if (R > 0) {
  // Mái bốn mái, nóc dọc trục dài hơn; chỉ vẽ hai mặt nhìn thấy (trước trái, hồi / trước phải).
  const e = [[-o, -o, H], [W + o, -o, H], [W + o, D + o, H], [-o, D + o, H]];
  if (W >= D) {
    const a0 = [-o + D / 2 + o, D / 2, H + R], a1 = [W + o - D / 2 - o, D / 2, H + R];
    poly([e[3], e[2], a1, a0], ROOFC);
    poly([e[1], e[2], a1], shade(ROOFC, 0.73));
  } else {
    const a0 = [W / 2, -o + W / 2 + o, H + R], a1 = [W / 2, D + o - W / 2 - o, H + R];
    poly([e[3], e[2], a1], ROOFC);
    poly([e[1], e[2], a1, a0], shade(ROOFC, 0.73));
  }
} else {
  poly([[0, 0, H], [W, 0, H], [W, D, H], [0, D, H]], [190, 180, 160]); // mặt trên hộp
}
writeFileSync(out, encodePng(img));
console.log(`${out}: khối ${W}×${D}×${H} ô, mái ${R}, ${S}×${S}`);
