// Biểu tượng hồn kỹ 32×32 từ ảnh ComfyUI 1024 (skill asset-gen mục ComfyUI, #384): tách nền (comfy-key), thu nhỏ hình chính,
// giảm màu, ghép khung màu theo hệ / võ hồn. Nền ngoài khung trong suốt, trong khung là nền tối để đọc rõ ở ô 32–40 px.
//   node tools/assets/skill-icon.mjs <1024.png> <ra.png> --col #4ab0ff [--frame round|square] [--fit 20] [--colors 14]
//   --frame none: không ghép khung, chỉ tách nền + giảm màu + đặt giữa ô 32 (biểu tượng vật phẩm: --fit 28 --colors 24).
//   --frame none: không ghép khung, chỉ tách nền + giảm màu + đặt giữa ô 32 (biểu tượng vật phẩm: --fit 28 --colors 24).
//
// Model hay tự vẽ khung / vòng hoa quanh vật dù prompt cấm, nên khung do công cụ ghép (đồng nhất cả ~280 biểu tượng):
// ảnh ComfyUI chỉ cần cho hình chính. `--col` là màu khung (col của võ hồn trong VOHON, hồn kỹ chung dùng màu trung tính).
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodePng, hex, Img, OUTLINE, readPng } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const col = opt("--col", "#9db3a2"), frame = opt("--frame", "round"), fit = +opt("--fit", 20), nCol = +opt("--colors", 14);
const [src, out] = args;
if (!src || !out || !/^#[0-9a-f]{6}$/i.test(col) || !["round", "square", "none"].includes(frame)) {
  console.error("Cách dùng: skill-icon.mjs <1024.png> <ra.png> --col #rrggbb [--frame round|square|none] [--fit 20] [--colors 14]");
  process.exit(1);
}

const S = 32;
const tmp = mkdtempSync(path.join(tmpdir(), "skill-icon-"));
const keyed = path.join(tmp, "k.png");
execFileSync("node", [fileURLToPath(new URL("./comfy-key.mjs", import.meta.url)), src, keyed, "--shadow", "--holes", "20", "--fit", String(fit)], { stdio: "pipe" });
const glyph = readPng(keyed);
rmSync(tmp, { recursive: true, force: true });

// Giảm màu hình chính (median cut).
const pts = [];
for (let y = 0; y < glyph.h; y++) for (let x = 0; x < glyph.w; x++) { const p = glyph.get(x, y); if (p[3] > 127) pts.push(p.slice(0, 3)); }
function medianCut(px, n) {
  let boxes = [px];
  while (boxes.length < n) {
    boxes.sort((a, b) => b.length - a.length);
    const b = boxes.shift();
    if (!b || b.length < 2) { boxes.push(b); break; }
    const rng = [0, 1, 2].map((c) => Math.max(...b.map((p) => p[c])) - Math.min(...b.map((p) => p[c])));
    const c = rng.indexOf(Math.max(...rng));
    b.sort((p, q) => p[c] - q[c]);
    const m = b.length >> 1;
    boxes.push(b.slice(0, m), b.slice(m));
  }
  return boxes.filter((b) => b && b.length).map((b) => [0, 1, 2].map((c) => Math.round(b.reduce((s, p) => s + p[c], 0) / b.length)));
}
const pal = medianCut(pts, nCol);
const near = (p) => pal.reduce((best, q) => (((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2) < best[1] ? [q, ((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2)] : best), [pal[0], 1e9])[0];

// Khung: nền tối pha màu hệ, viền ngoài #1a1020, vòng màu hệ (sáng ở nửa trên trái), chấm sáng.
const base = hex(col), out0 = hex(OUTLINE);
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const fillC = mix(out0, base, 0.22), ringLo = mix(base, out0, 0.35), ringHi = mix(base, [255, 255, 255], 0.35);
const img = new Img(S, S);
const c0 = (S - 1) / 2, R = S / 2;
const inside = (x, y, r) => {
  if (frame === "round") return Math.hypot(x - c0, y - c0) <= r;
  const q = 5 * (r / R); // góc vát của khung vuông
  const dx = Math.abs(x - c0), dy = Math.abs(y - c0), h = r - 0.5;
  return dx <= h && dy <= h && !(dx > h - q && dy > h - q && dx + dy > 2 * h - q + 0.5);
};
for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
  if (inside(x, y, R)) img.set(x, y, [...out0, 255]);
  if (inside(x, y, R - 1)) img.set(x, y, [...((x + y) < S - 1 ? ringHi : ringLo), 255]);
  if (inside(x, y, R - 2.2)) img.set(x, y, [...out0, 255]);
  if (inside(x, y, R - 3.2)) img.set(x, y, [...fillC, 255]);
}
// Hình chính ở giữa.
const ox = Math.round((S - glyph.w) / 2), oy = Math.round((S - glyph.h) / 2);
for (let y = 0; y < glyph.h; y++) for (let x = 0; x < glyph.w; x++) {
  const p = glyph.get(x, y);
  if (p[3] > 127) img.set(ox + x, oy + y, [...near(p.slice(0, 3)), 255]);
}
writeFileSync(out, encodePng(img));
