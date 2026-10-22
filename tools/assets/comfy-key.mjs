// Tách nền trắng trơn của ảnh ComfyUI (SDXL + pixel-art-xl, skill asset-gen mục ComfyUI) thành trong suốt.
//   node tools/assets/comfy-key.mjs <vào.png> <ra.png> [--tol 24] [--shadow] [--holes 400] [--fringe 1] [--key #ffffff]
//
// gemini-import.mjs xóa nền theo màu trên toàn ảnh: với nền trắng, mọi điểm sáng của vật (giấy, đá nhạt, điểm bắt
// sáng) cũng mất. Công cụ này chỉ xóa phần nền **nối với mép ảnh** (loang 4 hướng từ vành ngoài), nên trắng bên trong
// vật được giữ; ảnh ra có alpha 0 / 255 và gemini-import dùng thẳng alpha đó (không xóa nền lần nữa).
//
// Tùy chọn:
//   --key #rrggbb  màu nền (mặc định màu nhiều nhất ở 4 góc; thường gần #ffffff).
//   --tol 24       sai khác tối đa từng kênh so với màu nền để coi là nền.
//   --shadow       loang cả qua bóng đổ xám nhạt trên nền (độ sáng ≥ 70%, gần như không màu), SDXL hay vẽ dưới vật.
//   --holes N      xóa thêm vùng nền kín (không nối mép, ví dụ khe giữa chân thú) có ít nhất N điểm và sát màu nền
//                  (sai khác ≤ tol / 2); 0 = tắt (mặc định, vì vật có thể có mảng trắng thật).
//   --fringe 1     số lượt gỡ điểm viền còn ánh nền (sai khác ≤ 3 × tol) nằm sát phần đã xóa.
// In ra số điểm đã xóa và hộp bao phần còn lại.
import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodePng, hex } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const keyOpt = opt("--key", ""), tol = +opt("--tol", "24"), holes = +opt("--holes", "0"), fringe = +opt("--fringe", "1");
const shadow = flag("--shadow");
const [inFile, outFile] = args;
if (!inFile || !outFile) {
  console.error("Cách dùng: comfy-key.mjs <vào.png> <ra.png> [--tol 24] [--shadow] [--holes N] [--fringe 1] [--key #rrggbb]");
  process.exit(1);
}

const img = decodePng(readFileSync(inFile));
const W = img.w, H = img.h;
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
  return mx >= 0.7 * 255 && mx - mn <= 14;
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
writeFileSync(outFile, encodePng(img));
const keyHex = "#" + K.map((v) => v.toString(16).padStart(2, "0")).join("");
if (x1 < 0) console.log(`${outFile}: nền ${keyHex}, xóa hết ảnh (tol quá lớn?)`);
else console.log(`${outFile}: nền ${keyHex}, xóa ${removed}/${W * H} điểm${holes ? `, ${holeCount} vùng kín` : ""}; vật ${x1 - x0 + 1}×${y1 - y0 + 1} tại (${x0}, ${y0})`);
