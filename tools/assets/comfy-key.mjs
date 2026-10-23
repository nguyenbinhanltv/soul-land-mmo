// Tách nền trắng trơn của ảnh ComfyUI (SDXL + pixel-art-xl, skill asset-gen mục ComfyUI) thành trong suốt.
//   node tools/assets/comfy-key.mjs <vào.png> <ra.png> [--tol 24] [--shadow] [--holes 400] [--fringe 1] [--key #ffffff]
//   node tools/assets/comfy-key.mjs <texture.png> <ra.png> --diamond 128      (ô nền: texture vuông → thoi 2:1)
//
// gemini-import.mjs xóa nền theo màu trên toàn ảnh: với nền trắng, mọi điểm sáng của vật (giấy, đá nhạt, điểm bắt
// sáng) cũng mất. Công cụ này chỉ xóa phần nền **nối với mép ảnh** (loang 4 hướng từ vành ngoài), nên trắng bên trong
// vật được giữ; ảnh ra có alpha 0 / 255 và gemini-import dùng thẳng alpha đó (không xóa nền lần nữa).
//
// Tùy chọn:
//   --key #rrggbb  màu nền (mặc định màu nhiều nhất ở 4 góc; thường gần #ffffff).
//   --tol 24       sai khác tối đa từng kênh so với màu nền để coi là nền.
//   --shadow       loang cả qua bóng đổ xám trên nền (gần như không màu, độ sáng ≥ --shadow-min × độ sáng nền), SDXL hay
//                  vẽ dưới vật dù prompt cấm. Viền tối của vật chặn đường loang nên thân vật xám vẫn còn.
//   --shadow-min 0.55  bóng đậm còn sót thì hạ; vật xám nhạt không viền bị ăn thì nâng (0,7).
//   --shadow-sat 14  độ lệch kênh tối đa để coi là bóng "không màu"; bóng ngả màu vật (tím, be) thì nâng (40–60), vật cùng tông nền bị ăn thì hạ.
//   --holes N      xóa thêm vùng nền kín (không nối mép, ví dụ khe giữa chân thú) có ít nhất N điểm và sát màu nền
//                  (sai khác ≤ tol / 2); 0 = tắt (mặc định, vì vật có thể có mảng trắng thật).
//   --fringe 1     số lượt gỡ điểm viền còn ánh nền (sai khác ≤ 3 × tol) nằm sát phần đã xóa.
//   --diamond W    ô nền: ảnh vào là texture vuông nhìn thẳng từ trên, liền mép (SDXL không vẽ được thoi 2:1 đúng);
//                  chiếu thành thoi W×W/2 (xoay 45°, ép dọc một nửa, lấy điểm gần nhất, không nội suy) trên nền trong
//                  suốt, rồi đưa vào gemini-import --kind tile --cell 1. Không xóa nền ở chế độ này.
//   --fit N        sau khi xóa nền: cắt hộp bao vật rồi thu về cạnh dài N (trung bình các điểm đặc trong mỗi ô, không lấy
//                  mẫu điểm lẻ). Dùng cho ảnh gốc 1024 khi khung đích nhỏ hơn bản 128 nhiều (chân dung hồn thú 64: thu từ 1024
//                  giữ nét mặt tốt hơn thu tiếp bản 128), rồi gemini-import --cell 1 --scale 1 lo bảng màu, viền, chỗ đặt.
// In ra số điểm đã xóa và hộp bao phần còn lại; nền không trắng (ảnh SDXL đôi khi ra nền xám) thì cảnh báo.
import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodePng, hex, Img } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const keyOpt = opt("--key", ""), tol = +opt("--tol", "24"), holes = +opt("--holes", "0"), fringe = +opt("--fringe", "1");
const shadowMin = +opt("--shadow-min", "0.55"), shadowSat = +opt("--shadow-sat", "14"), shadow = flag("--shadow"), diamond = +opt("--diamond", "0"), fit = +opt("--fit", "0");
const [inFile, outFile] = args;
if (!inFile || !outFile) {
  console.error("Cách dùng: comfy-key.mjs <vào.png> <ra.png> [--tol 24] [--shadow] [--holes N] [--fringe 1] [--key #rrggbb]");
  process.exit(1);
}

const img = decodePng(readFileSync(inFile));
const W = img.w, H = img.h;

if (diamond) {
  // Đỉnh trên của thoi ↔ góc (0, 0) của texture, đỉnh phải ↔ (1, 0), đỉnh dưới ↔ (1, 1), đỉnh trái ↔ (0, 1).
  const DW = diamond, DH = diamond / 2, out = new Img(DW, DH);
  for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) {
    const dx = x + 0.5 - DW / 2, dy = y + 0.5 - DH / 2;
    const s = 0.5 + dx / DW + dy / DH, t = 0.5 - dx / DW + dy / DH;
    if (s < 0 || t < 0 || s >= 1 || t >= 1) continue;
    const p = img.get(Math.min(W - 1, Math.floor(s * W)), Math.min(H - 1, Math.floor(t * H)));
    out.set(x, y, [p[0], p[1], p[2], 255]);
  }
  writeFileSync(outFile, encodePng(out));
  console.log(`${outFile}: texture ${W}×${H} → thoi ${DW}×${DH}`);
  process.exit(0);
}
const maxDiff = (p, K) => Math.max(Math.abs(p[0] - K[0]), Math.abs(p[1] - K[1]), Math.abs(p[2] - K[2]));

/** Màu nền: màu nhiều nhất trong 4 ô 8×8 ở góc ảnh (như gemini-import). */
function keyColor() {
  if (keyOpt) return hex(keyOpt);
  const votes = new Map();
  const n = Math.min(8, W, H);
  for (const [x0, y0] of [[0, 0], [W - n, 0], [0, H - n], [W - n, H - n]])
    for (let y = y0; y < y0 + n; y++) for (let x = x0; x < x0 + n; x++) {
      const p = img.get(x, y), k = `${p[0] >> 3},${p[1] >> 3},${p[2] >> 3}`;
      votes.set(k, [...(votes.get(k) ?? []), p]);
    }
  const best = [...votes.values()].sort((a, b) => b.length - a.length)[0];
  return [0, 1, 2].map((i) => Math.round(best.reduce((s, p) => s + p[i], 0) / best.length));
}
const K = keyColor();

const isBg = (p) => {
  if (maxDiff(p, K) <= tol) return true;
  if (!shadow) return false;
  const mx = Math.max(p[0], p[1], p[2]), mn = Math.min(p[0], p[1], p[2]);
  return mx >= shadowMin * Math.max(...K) && mx - mn <= shadowSat;
};

// Loang từ vành ngoài.
const bg = new Uint8Array(W * H);
const stack = [];
const seed = (x, y) => { const i = y * W + x; if (!bg[i] && isBg(img.get(x, y))) { bg[i] = 1; stack.push(i); } };
for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
while (stack.length) {
  const i = stack.pop(), x = i % W, y = (i / W) | 0;
  if (x > 0) seed(x - 1, y);
  if (x < W - 1) seed(x + 1, y);
  if (y > 0) seed(x, y - 1);
  if (y < H - 1) seed(x, y + 1);
}

// Vùng nền kín đủ lớn.
let holeCount = 0;
if (holes > 0) {
  const seen = new Uint8Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (bg[s] || seen[s] || maxDiff(img.get(s % W, (s / W) | 0), K) > tol / 2) continue;
    const comp = [s];
    seen[s] = 1;
    for (let k = 0; k < comp.length; k++) {
      const i = comp[k], x = i % W, y = (i / W) | 0;
      for (const [X, Y] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const j = Y * W + X;
        if (!bg[j] && !seen[j] && maxDiff(img.get(X, Y), K) <= tol / 2) { seen[j] = 1; comp.push(j); }
      }
    }
    if (comp.length >= holes) { for (const i of comp) bg[i] = 1; holeCount++; }
  }
}

// Viền còn ánh nền sát phần đã xóa.
for (let pass = 0; pass < fringe; pass++) {
  const drop = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (bg[i] || maxDiff(img.get(x, y), K) > 3 * tol) continue;
    if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([X, Y]) => X < 0 || Y < 0 || X >= W || Y >= H || bg[Y * W + X])) drop.push(i);
  }
  for (const i of drop) bg[i] = 1;
}

let removed = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x, p = img.get(x, y);
  if (bg[i] || p[3] < 128) { img.set(x, y, [0, 0, 0, 0]); removed++; continue; }
  img.set(x, y, [p[0], p[1], p[2], 255]);
  x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
}
const keyHex = "#" + K.map((v) => v.toString(16).padStart(2, "0")).join("");
if (x1 < 0) { writeFileSync(outFile, encodePng(img)); console.log(`${outFile}: nền ${keyHex}, xóa hết ảnh (tol quá lớn?)`); process.exit(0); }
let out = img, note = "";
if (fit && Math.max(x1 - x0 + 1, y1 - y0 + 1) > fit) {
  // Cắt hộp bao rồi thu về cạnh dài `fit`: mỗi điểm đích là trung bình các điểm đặc trong ô nguồn của nó, đặc khi phủ ≥ nửa ô.
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, s = fit / Math.max(bw, bh), w = Math.max(1, Math.round(bw * s)), h = Math.max(1, Math.round(bh * s));
  out = new Img(w, h);
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    const sx0 = x0 + Math.floor(tx / s), sx1 = x0 + Math.max(Math.floor(tx / s) + 1, Math.floor((tx + 1) / s));
    const sy0 = y0 + Math.floor(ty / s), sy1 = y0 + Math.max(Math.floor(ty / s) + 1, Math.floor((ty + 1) / s));
    let n = 0, all = 0; const acc = [0, 0, 0];
    for (let y = sy0; y < Math.min(sy1, H); y++) for (let x = sx0; x < Math.min(sx1, W); x++) {
      all++; const p = img.get(x, y); if (!p[3]) continue;
      n++; acc[0] += p[0]; acc[1] += p[1]; acc[2] += p[2];
    }
    if (n * 2 >= all && n) out.set(tx, ty, [Math.round(acc[0] / n), Math.round(acc[1] / n), Math.round(acc[2] / n), 255]);
  }
  note = `; thu về ${w}×${h}`;
}
writeFileSync(outFile, encodePng(out));
const grey = Math.max(...K) < 200 ? " (CẢNH BÁO: nền xám, vật cùng tông xám dễ bị xóa nhầm; nên bỏ ảnh này)" : "";
console.log(`${outFile}: nền ${keyHex}${grey}, xóa ${removed}/${W * H} điểm${holes ? `, ${holeCount} vùng kín` : ""}; vật ${x1 - x0 + 1}×${y1 - y0 + 1} tại (${x0}, ${y0})${note}`);
