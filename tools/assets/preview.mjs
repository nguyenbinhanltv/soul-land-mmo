// Phóng to ảnh pixel (nearest-neighbor) trên nền ô cờ để xem thử bằng mắt.
//   node tools/assets/preview.mjs <ra.png> <lớp1.png> [lớp2.png …] [--scale 8] [--grid 64x64] [--crop x,y,w,h] [--bg #rrggbb]
//   node tools/assets/preview.mjs <ra.png> <sheet lớp1.png> [sheet lớp2.png …] --dirs8 [--anim idle,walk] [--raw <thư mục>] [--ground] [--scale 3]
// Nhiều lớp thì chồng theo thứ tự (phụ thể sau, thân, áo, tóc, phụ thể trước…) để xem hồn sư ghép lớp.
// --grid vẽ đường kẻ khung (ví dụ 64x64 cho sheet hồn sư) để soát bố cục 24×6; --crop chỉ lấy một vùng.
//
// --dirs8: đọc sheet isometric (hồn sư 1536×384, phụ thể 2304×1152 hai nửa theo giới, hồn thú 20 × 5 khung theo bậc; nhận ra theo kích thước)
//   và xếp lại thành 8 hàng hướng theo vòng kim đồng hồ s, sw, w, nw, n, ne, e, se. Ba hướng sw, w, nw lật ngang hàng
//   se, e, ne như client (nền ô cờ ánh lam để nhận ra). Các lớp khác khung (thân 64, phụ thể 96) được đặt khớp gốc chân.
//   --anim: chỉ lấy các animation này (mặc định mọi animation, mỗi khung một cột; absorb xem bằng --crop trên sheet).
//   --raw <thư mục>: thêm cột đầu là khung đứng {hướng}_idle_0.png do normalize ghi (đủ 8 hướng thật của PixelLab, gộp
//   body/outfit/hair nếu là thư mục --split) để so hướng lật với hướng PixelLab vẽ thật.
//   --sex m|f: nửa sheet phụ thể (ISO_VH_SEXES) ghép với thân; mặc định theo tên sheet thân (body_f_0.png → f).
//   --ground: vẽ thoi một ô logic (ISO_TILE_W) dưới gốc chân để soát chân đứng đúng chỗ.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { decodePng, encodePng, Img, hex, isoLayout, ISO_DIRS, ISO_DIRS8, ISO_FLIP, ISO_HS_COLS, ISO_HS_ROWS, ISO_HS_FRAME, ISO_VH_FRAME, ISO_VH_SEXES, ISO_BEAST_COLS, ISO_BEAST_ROWS, ISO_BEAST_SIZES, ISO_TILE_W, HS_LAYERS } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const dirs8 = flag("--dirs8"), ground = flag("--ground");
const scale = +opt("--scale", dirs8 ? 3 : 8), grid = opt("--grid", ""), bg = opt("--bg", ""), crop = opt("--crop", "");
const animOpt = opt("--anim", ""), rawDir = opt("--raw", ""), sexOpt = opt("--sex", "");
const [out, ...inputs] = args;
if (!out || !inputs.length) { console.error("Cách dùng: preview.mjs <ra.png> <lớp1.png> [lớp2.png …] [--scale 8] [--grid 64x64] [--crop x,y,w,h]\n          preview.mjs <ra.png> <sheet…> --dirs8 [--anim idle,walk] [--raw <thư mục>] [--ground]"); process.exit(1); }

const layers = inputs.map((f) => decodePng(readFileSync(f)));
const checker = (x, y, tint) => {
  const c = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? [200, 200, 200] : [235, 235, 235];
  return tint ? [c[0] - 30, c[1] - 10, c[2] + 15] : c;
};

/** Phóng `src` lên `scale` lần trên nền (`bgAt(x, y)` theo pixel nguồn), kẻ lưới khung nếu có. */
function upscale(src, bgAt, [gw, gh] = [0, 0], [ox, oy] = [0, 0]) {
  const dst = new Img(src.w * scale, src.h * scale);
  for (let y = 0; y < dst.h; y++) for (let x = 0; x < dst.w; x++) {
    const sx = Math.floor(x / scale), sy = Math.floor(y / scale), p = src.get(sx, sy);
    let base = bgAt(sx, sy, x, y);
    if (gw && (((sx + ox) % gw === 0 && x % scale === 0) || ((sy + oy) % gh === 0 && y % scale === 0))) base = [255, 0, 255];
    const a = p[3] / 255;
    dst.set(x, y, [0, 1, 2].map((i) => Math.round(p[i] * a + base[i] * (1 - a))).concat(255));
  }
  return dst;
}

if (!dirs8) {
  const [cx, cy, cw, ch] = crop ? crop.split(",").map(Number) : [0, 0, layers[0].w, layers[0].h];
  const src = new Img(cw, ch);
  for (const l of layers) src.blit(l, cx, cy, cw, ch, 0, 0, true);
  const dst = upscale(src, (sx, sy, x, y) => (bg ? hex(bg) : checker(x, y)), grid ? grid.split("x").map(Number) : [0, 0], [cx, cy]);
  writeFileSync(out, encodePng(dst));
  console.log(`[preview] ${out} (${dst.w}×${dst.h})`);
  process.exit(0);
}

// ---------- --dirs8 ----------
/** Nhận bố cục từ kích thước sheet. */
function layoutOf(img, file) {
  if (img.w % ISO_HS_COLS === 0) {
    const f = img.w / ISO_HS_COLS;
    if (f === ISO_HS_FRAME && img.h === f * ISO_HS_ROWS) return isoLayout("honsu");
    if (f === ISO_VH_FRAME && img.h === f * isoLayout("vohon").rows) return isoLayout("vohon");
  }
  if (img.w % ISO_BEAST_COLS === 0 && img.h === (img.w / ISO_BEAST_COLS) * ISO_BEAST_ROWS && ISO_BEAST_SIZES.includes(img.w / ISO_BEAST_COLS)) return isoLayout("beast", img.w / ISO_BEAST_COLS);
  console.error(`[preview] ${file}: ${img.w}×${img.h} không phải sheet isometric (hồn sư, phụ thể, hồn thú)`); process.exit(1);
}
const lays = layers.map((l, i) => layoutOf(l, inputs[i]));
// Phụ thể có một nửa sheet cho mỗi giới (ISO_VH_SEXES): lấy nửa theo --sex, mặc định theo tên sheet thân (body_f_0.png → f).
const sexOf = inputs.map((f) => path.basename(f).match(/^(?:body|outfit|hair)_([a-z])_[0-9]+[.]png$/)?.[1]).find(Boolean);
const vhRow0 = Math.max(0, ISO_VH_SEXES.indexOf(sexOpt || sexOf || ISO_VH_SEXES[0])) * ISO_HS_ROWS;
// Lấy bảng animation của lớp đầu tiên không phải phụ thể (phụ thể chỉ có idle/walk/attack/cast).
const main = lays.find((l) => l.kind !== "vohon") ?? lays[0];
// Ô kết quả đủ chứa mọi lớp khi đặt khớp gốc chân.
const left = Math.max(...lays.map((l) => l.origin[0])), top = Math.max(...lays.map((l) => l.origin[1]));
const CW = left + Math.max(...lays.map((l) => l.frame[0] - l.origin[0])), CH = top + Math.max(...lays.map((l) => l.frame[1] - l.origin[1]));
const wanted = animOpt ? animOpt.split(",") : Object.keys(main.anims);
for (const a of wanted) if (!main.anims[a]) { console.error(`[preview] --anim ${a}: không có trong bố cục ${main.kind}`); process.exit(1); }
const cols = wanted.flatMap((a) => Array.from({ length: main.anims[a][1] }, (_, i) => main.anims[a][0] + i));
const rawCol = rawDir ? 1 : 0;
const sheet = new Img((cols.length + rawCol) * CW, ISO_DIRS8.length * CH);

/** Thoi một ô logic tâm ở gốc chân (nền, dưới sprite). */
function drawGround(x0, y0) {
  const W = ISO_TILE_W, H = W / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = Math.abs(x + 0.5 - W / 2) / (W / 2) + Math.abs(y + 0.5 - H / 2) / (H / 2);
    if (u <= 1) sheet.set(x0 + left - W / 2 + x, y0 + top + 1 - H / 2 + y, u > 0.85 ? [90, 110, 90, 255] : [150, 170, 140, 255]);
  }
}
/** Đặt khung (r, c) của lớp `l` (lật nếu `flip`) vào ô kết quả (X, Y). */
function put(img, l, r, c, X, Y, flip) {
  const [fw, fh] = l.frame, dx = X + left - l.origin[0], dy = Y + top - l.origin[1];
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const p = img.get(c * fw + (flip ? fw - 1 - x : x), r * fh + y);
    if (p[3]) sheet.set(dx + x, dy + y, p);
  }
}
const readRaw = (d) => {
  const sub = HS_LAYERS.map((l) => path.join(rawDir, l, `${d}_idle_0.png`)).filter(existsSync);
  const one = path.join(rawDir, `${d}_idle_0.png`);
  return (sub.length ? sub : existsSync(one) ? [one] : []).map((f) => decodePng(readFileSync(f)));
};
for (const [R, d] of ISO_DIRS8.entries()) {
  const flip = !!ISO_FLIP[d], row = ISO_DIRS.indexOf(ISO_FLIP[d] ?? d);
  if (rawDir) {
    if (ground) drawGround(0, R * CH);
    for (const img of readRaw(d)) put(img, main, 0, 0, 0, R * CH, false);
  }
  for (const [j, c] of cols.entries()) {
    const X = (j + rawCol) * CW, Y = R * CH;
    if (ground) drawGround(X, Y);
    for (const [i, img] of layers.entries()) if (lays[i].kind !== "vohon" || c < lays[i].cols) put(img, lays[i], lays[i].kind === "vohon" ? vhRow0 + row : row, c, X, Y, flip);
  }
}
const dst = upscale(sheet, (sx, sy, x, y) => {
  const R = Math.floor(sy / CH), C = Math.floor(sx / CW);
  if (bg) return hex(bg);
  if (rawDir && C === 0) return [245, 236, 214]; // cột ảnh PixelLab thật
  return checker(x, y, !!ISO_FLIP[ISO_DIRS8[R]]);
}, [CW, CH]);
writeFileSync(out, encodePng(dst));
console.log(`[preview] ${out} (${dst.w}×${dst.h}): 8 hướng ${ISO_DIRS8.join(", ")} × ${cols.length} khung (${wanted.join(", ")})${rawDir ? ", cột đầu là khung đứng PixelLab thật" : ""}`);
