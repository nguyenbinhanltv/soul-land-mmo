// Tự sinh normal map cho Light2D (mục 5.11 "Ánh sáng và chiều sâu"), không tốn lượt PixelLab.
//   node tools/assets/normal.mjs <ảnh.png …> [--frame WxH] [--edge 3] [--bump 0.6] [--strength 2] [--quant 5] [--union] [--out <thư mục>]
//
// Ghi `<tên>_n.png` cạnh ảnh gốc (hoặc vào --out), cùng kích thước, alpha giữ như ảnh gốc. Độ cao giả mỗi điểm:
//   mép tròn: khoảng cách tới điểm trong suốt gần nhất (tối đa --edge pixel) đi qua cung tròn, nên viền hình cong xuống
//             như vật tròn (--edge 0 cho ô nền: không bo mép thoi);
//   độ sáng: phần sáng nổi lên, phần tối lõm xuống (hệ số --bump).
// Pháp tuyến lấy từ độ dốc (Sobel) của độ cao, nhân --strength, theo quy ước OpenGL (xanh lá hướng lên, như Phaser):
// R = x sang phải, G = y lên trên, B = z hướng ra màn hình. Điểm phẳng là (128, 128, 255).
// --frame WxH: tính riêng từng khung của sheet (mép khung coi như trong suốt, khung kề không ảnh hưởng nhau);
//   mặc định tự nhận sheet isometric (hồn sư 64, phụ thể 96 hai nửa theo giới, hồn thú theo bậc), ảnh khác coi là một khung.
// --quant N: lượng tử RGB về N bit mỗi kênh (mặc định 5, #975: _n nhỏ hơn ~55–60%, sai số góc pháp tuyến ≲ 2°); 8 = không lượng tử.
//   Điểm phẳng (128, 128, 255) giữ nguyên. Chạy lại cho _n cũ: normal-quant.mjs.
// --union: các ảnh là các lớp của cùng một hình (thân, áo, tóc của một bộ hồn sư, cùng cỡ): mép tròn tính theo hình gộp,
//   nên chỗ giáp giữa hai lớp không thành nếp gấp giả; mỗi lớp vẫn ra một file _n theo độ sáng và alpha của lớp đó.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { decodePng, encodePng, Img, ISO_HS_FRAME, ISO_VH_FRAME, ISO_HS_COLS, ISO_BEAST_COLS, ISO_BEAST_ROWS, ISO_BEAST_SIZES, isoLayout, NORMAL_BITS, quantizeNormal } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const frameOpt = opt("--frame", ""), edge = +opt("--edge", "3"), bump = +opt("--bump", "0.6"), strength = +opt("--strength", "2"), quant = +opt("--quant", String(NORMAL_BITS)), outDir = opt("--out", "");
const unionAt = args.indexOf("--union"), union = unionAt >= 0 && !!args.splice(unionAt, 1);
const files = [...args];
if (!files.length) { console.error("Cách dùng: normal.mjs <ảnh.png …> [--frame WxH] [--edge 3] [--bump 0.6] [--strength 2] [--quant 5] [--out <thư mục>]"); process.exit(1); }

/** Khung của sheet isometric theo kích thước ảnh; ảnh khác là một khung. */
function frameOf(img) {
  if (frameOpt) return frameOpt.split("x").map(Number);
  if (img.w % ISO_HS_COLS === 0 && [ISO_HS_FRAME, ISO_VH_FRAME].includes(img.w / ISO_HS_COLS)) {
    const f = img.w / ISO_HS_COLS, rows = isoLayout(f === ISO_HS_FRAME ? "honsu" : "vohon").rows; // phụ thể: hai nửa theo giới
    if (img.h === f * rows) return [f, f];
  }
  if (img.w % ISO_BEAST_COLS === 0 && ISO_BEAST_SIZES.includes(img.w / ISO_BEAST_COLS) && img.h === (img.w / ISO_BEAST_COLS) * ISO_BEAST_ROWS) return [img.w / ISO_BEAST_COLS, img.h / ISO_BEAST_ROWS];
  return [img.w, img.h];
}

/** Normal map của một khung (x0, y0, w, h) ghi vào `dst`. */
function frameNormal(img, dst, x0, y0, w, h, shape = img) {
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && shape.alpha(x0 + x, y0 + y) > 0;
  const own = (x, y) => img.alpha(x0 + x, y0 + y) > 0;
  // Khoảng cách (8 hướng) tới điểm trong suốt hoặc mép khung, hai lượt quét.
  const INF = 1e9, d = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = solid(x, y) ? INF : 0;
  const D = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[y * w + x]) d[y * w + x] = Math.min(d[y * w + x], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + Math.SQRT2, D(x + 1, y - 1) + Math.SQRT2);
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) if (d[y * w + x]) d[y * w + x] = Math.min(d[y * w + x], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + Math.SQRT2, D(x - 1, y + 1) + Math.SQRT2);
  const H = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!solid(x, y)) continue;
    // Điểm của lớp khác trong hình gộp: độ sáng trung tính (chỉ góp mép tròn).
    const [r, g, b] = own(x, y) ? img.get(x0 + x, y0 + y) : [128, 128, 128], l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // Cung tròn: mép (d = 1) thấp, từ d = edge trở vào phẳng ở độ cao 1.
    const t = edge > 0 ? Math.min(d[y * w + x], edge) / edge : 1, round = Math.sqrt(1 - (1 - t) * (1 - t));
    H[y * w + x] = round * (edge > 0 ? edge / 2 : 0) + bump * l;
  }
  // Ngoài hình lấy độ cao của điểm đang xét (không tạo vách giả ở mép; mép đã do cung tròn lo).
  const at = (x, y, cx, cy) => (solid(x, y) ? H[y * w + x] : H[cy * w + cx]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!own(x, y)) continue;
    const s = (dx, dy) => at(x + dx, y + dy, x, y);
    const gx = (s(1, -1) + 2 * s(1, 0) + s(1, 1) - s(-1, -1) - 2 * s(-1, 0) - s(-1, 1)) / 8;
    const gy = (s(-1, 1) + 2 * s(0, 1) + s(1, 1) - s(-1, -1) - 2 * s(0, -1) - s(1, -1)) / 8; // theo trục y ảnh (xuống)
    // Mặt z = H(x, y_lên): pháp tuyến ∝ (−∂H/∂x, −∂H/∂y_lên, 1) = (−gx, +gy, 1).
    let nx = -gx * strength, ny = gy * strength, nz = 1;
    const len = Math.hypot(nx, ny, nz); nx /= len; ny /= len; nz /= len;
    dst.set(x0 + x, y0 + y, [Math.round((nx + 1) * 127.5), Math.round((ny + 1) * 127.5), Math.round((nz + 1) * 127.5), img.alpha(x0 + x, y0 + y)]);
  }
}

const imgs = files.map((f) => decodePng(readFileSync(f)));
let shape = null;
if (union) {
  if (imgs.some((i) => i.w !== imgs[0].w || i.h !== imgs[0].h)) { console.error("--union cần các ảnh cùng kích thước"); process.exit(1); }
  shape = new Img(imgs[0].w, imgs[0].h);
  for (const i of imgs) shape.blit(i, 0, 0, i.w, i.h, 0, 0, true);
}
for (const [n, f] of files.entries()) {
  const img = imgs[n], [fw, fh] = frameOf(img), dst = new Img(img.w, img.h);
  for (let y0 = 0; y0 + fh <= img.h; y0 += fh) for (let x0 = 0; x0 + fw <= img.w; x0 += fw) frameNormal(img, dst, x0, y0, fw, fh, shape ?? img);
  const out = path.join(outDir || path.dirname(f), path.basename(f, ".png") + "_n.png");
  if (outDir) mkdirSync(outDir, { recursive: true });
  writeFileSync(out, encodePng(quantizeNormal(dst, quant)));
  console.log(`[normal] ${out} (${img.w}×${img.h}, khung ${fw}×${fh}${edge ? `, bo mép ${edge}` : ", không bo mép"}, ${quant} bit)`);
}
