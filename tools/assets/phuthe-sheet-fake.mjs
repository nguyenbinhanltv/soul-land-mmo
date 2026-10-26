// Dựng tờ phụ thể GIẢ LẬP để thử phuthe-sheet-cut / -check (#1022): KHÔNG phải ảnh model.
//   node tools/assets/phuthe-sheet-fake.mjs --id hao_thien_chuy --out <thư mục> [--seed 1] [--drift 6,-4] [--bad]
// Mỗi ô lấy nộm từ tờ nộm thật (phuthe-sheet-dummy.mjs), vẽ thêm hai "cánh" cam sau thân (che bởi nộm), một "vũ khí" xanh trước ngực (đè lên nộm),
// dời cả ô lệch ngẫu nhiên vài điểm, cả tờ dời `drift`, thêm nhiễu màu nhẹ. `--bad` thêm đủ lỗi; hoặc chọn riêng (`bad: ["empty", "nodummy", "keycolor", "partkey"]`):
// `empty` ô số 5 (khung walk 2) rỗng; `nodummy` ô số 3 (khung idle 4) nộm bị vẽ lại bằng màu cánh (mất nộm); `keycolor` ô số 7 (khung walk 4) cả cánh lẫn vũ khí trùng màu khóa nộm (khung rỗng sau khi trừ nộm); `partkey` cùng ô nhưng chỉ cánh trùng màu khóa (vũ khí còn).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Img, encodePng, hex } from "./lib.mjs";
import { DIRS, CELL, SHEET_W, SHEET_H, SHEET_ID, phutheInfo } from "./phuthe-sheet-lib.mjs";
import { dummySheet } from "./phuthe-sheet-dummy.mjs";

const OUT = [26, 16, 32, 255], WING = [224, 96, 26, 255], BLADE = [90, 130, 170, 255];
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
function fillPoly(img, poly, color) {
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(img.h - 1, Math.ceil(Math.max(...ys))); y++) for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(img.w - 1, Math.ceil(Math.max(...xs))); x++) if (inPoly(poly, x + 0.5, y + 0.5)) img.set(x, y, color);
}
const outlined = (img, poly, color, out = OUT) => { for (let dy = -2; dy <= 2; dy += 2) for (let dx = -2; dx <= 2; dx += 2) fillPoly(img, poly.map(([x, y]) => [x + dx, y + dy]), out); fillPoly(img, poly, color); };

/**
 * Tờ giả của một hướng: { img }. Tùy chọn: seed, drift [dx, dy], bad (danh sách lỗi), wingColor, jitter (dời ngẫu nhiên từng ô).
 */
export function fakeSheet({ group, dir, frame, key, sex = "m", seed = 1, drift = [0, 0], bad = [], wingColor = WING, jitter = 3 }) {
  const rand = rng(seed), base = dummySheet({ group, dir, frame, key, sex }), out = new Img(SHEET_W, SHEET_H);
  for (let i = 0; i < out.data.length; i += 4) { out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 255; out.data[i + 3] = 255; }
  const kc = hex(key);
  base.cells.forEach((c, n) => {
    const cellImg = new Img(CELL, CELL);
    for (let i = 0; i < cellImg.data.length; i += 4) { cellImg.data[i] = 255; cellImg.data[i + 2] = 255; cellImg.data[i + 3] = 255; }
    if (bad.includes("empty") && n === 5) { /* ô rỗng */ } else {
      const [fx, fy] = c.cell.foot, beat = Math.sin((c.frame / 4) * Math.PI * 2) * 12;
      const wing = (s, col) => outlined(cellImg, [[fx + s * 22, fy - 100], [fx + s * 80, fy - 120 + beat], [fx + s * 86, fy - 60 + beat], [fx + s * 24, fy - 40]], col, bad.includes("keycolor") && n === 7 ? kc.concat(255) : OUT);
      const wc = (bad.includes("keycolor") || bad.includes("partkey")) && n === 7 ? kc.concat(255) : wingColor;
      wing(-1, wc); wing(1, wc);
      const dc = bad.includes("nodummy") && n === 3 ? WING : [...kc, 255];
      for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (c.cell.mask[y * CELL + x]) cellImg.set(x, y, dc);
      fillPoly(cellImg, [[fx - 7, fy - 78], [fx + 7, fy - 78], [fx + 7, fy - 42], [fx - 7, fy - 42]], bad.includes("keycolor") && n === 7 ? kc.concat(255) : BLADE); // vũ khí đè lên nộm
    }
    const jx = Math.round((rand() - 0.5) * 2 * jitter), jy = Math.round((rand() - 0.5) * 2 * jitter);
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const X = c.col * CELL + x + jx + drift[0], Y = c.row * CELL + y + jy + drift[1];
      if (X < 0 || Y < 0 || X >= SHEET_W || Y >= SHEET_H) continue;
      const p = cellImg.get(x, y);
      if (p[0] === 255 && p[1] === 0 && p[2] === 255) continue;
      const nz = Math.round((rand() - 0.5) * 6);
      out.set(X, Y, [Math.max(0, Math.min(255, p[0] + nz)), Math.max(0, Math.min(255, p[1] + nz)), Math.max(0, Math.min(255, p[2] + nz)), 255]);
    }
  });
  return { img: out };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  const id = val("--id"), out = val("--out");
  if (!id || !out) { console.error("Dùng: node tools/assets/phuthe-sheet-fake.mjs --id <võ hồn> --out <thư mục> [--seed 1] [--drift 6,-4] [--bad]"); process.exit(2); }
  const info = phutheInfo(id), drift = (val("--drift") ?? "0,0").split(",").map(Number);
  mkdirSync(out, { recursive: true });
  DIRS.forEach((dir, i) => {
    const { img } = fakeSheet({ group: info.group, dir, frame: info.frame, key: info.dummyKey, seed: +(val("--seed") ?? 1) + i, drift, bad: a.includes("--bad") ? ["empty", "nodummy", "keycolor"] : [] });
    writeFileSync(path.join(out, `to${SHEET_ID[dir]}.png`), encodePng(img));
    console.log(`ghi ${path.join(out, `to${SHEET_ID[dir]}.png`)}`);
  });
}
