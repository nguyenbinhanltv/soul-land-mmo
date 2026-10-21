// Vẽ 4 huy hiệu hệ võ hồn `he_<mã HE_IDS>` (mục 5.11) bằng code, từng điểm, không dùng AI:
//   node tools/assets/he-icons.mjs [--out <thư mục>]   (mặc định shared/assets/sprites/iso/he/)
// Khung vuông ISO_HE_ICON, nền trong suốt: viền ngoài #1a1020, viền vàng kim (sáng trên trái, tối dưới phải), tròn màu
// của hệ, một biểu tượng trắng lớn có viền 1 điểm màu tối của hệ. Màu lấy từ art/palette.gpl (dải Vàng kim, Bạc, Máu,
// Tán, Tím) cộng vài sắc suy ra. Sửa hình thì sửa mảng ký tự bên dưới, chạy lại, rồi `npm run check`.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { Img, encodePng, hex, OUTLINE, ISO_HE_ICON, SPRITES, heIds } from "./lib.mjs";

const args = process.argv.slice(2), oi = args.indexOf("--out");
const outDir = oi >= 0 ? args[oi + 1] : path.join(SPRITES, "iso", "he");
const S = ISO_HE_ICON, C = (S - 1) / 2;
const col = (h) => [...hex(h), 255];
const INK = col(OUTLINE), WHITE = col("#ffffff"), SILVER = col("#c0cce0");
const GOLD = ["#b8862a", "#f2c84b", "#fff2b0"].map(col); // viền vàng kim: tối, gốc, sáng
/** Bán kính (từ tâm điểm ảnh) của viền ngoài, viền vàng, và vùng sáng / tối ở mép tròn. */
const R_OUT = 11.75, R_RIM = 10.75, R_DISC = 9.75, R_SHADE = 8;

/** Tròn màu hệ `cols` = [tối, gốc, sáng] có viền vàng và viền ngoài. */
function badge(cols) {
  const im = new Img(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - C, y - C), lt = (C - x) + (C - y); // lt > 0: phía trên trái (sáng)
    if (d > R_OUT) continue;
    if (d > R_RIM) im.set(x, y, INK);
    else if (d > R_DISC) im.set(x, y, lt > 9 ? GOLD[2] : lt < -9 ? GOLD[0] : GOLD[1]);
    else im.set(x, y, lt > 10 && d > R_SHADE ? cols[2] : lt < -10 && d > R_SHADE ? cols[0] : cols[1]);
  }
  return im;
}

/** Biểu tượng từ mảng ký tự: '#' trắng, '+' bạc, 'g' vàng gốc, 'G' vàng tối; viền 4 hướng màu tối của hệ, trong tròn. */
function glyph(im, rows, ox, oy, cols) {
  const cmap = { "#": WHITE, "+": SILVER, g: GOLD[1], G: GOLD[0] }, pts = new Map();
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (cmap[c]) pts.set(`${ox + x},${oy + y}`, [ox + x, oy + y, cmap[c]]); }));
  for (const [x, y] of pts.values()) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const qx = x + dx, qy = y + dy;
    if (!pts.has(`${qx},${qy}`) && Math.hypot(qx - C, qy - C) <= R_DISC) im.set(qx, qy, cols[0]);
  }
  for (const [x, y, c] of pts.values()) im.set(x, y, c);
  return im;
}

/** Lưới ký tự w × h toàn '.', `fill(x, y)` trả về ký tự (hoặc undefined giữ '.'). */
const grid = (w, h, fill) => Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => fill(x, y) ?? ".").join(""));

const HE = {
  // Cường công: kiếm trắng thẳng đứng, chuôi vàng, trên tròn đỏ.
  cuong_cong: { cols: ["#6a1c26", "#a8303a", "#d0504a"], at: [9, 5], rows: [
    "...#...",
    "..###..",
    "..#+#..",
    "..#+#..",
    "..#+#..",
    "..#+#..",
    "..#+#..",
    "..#+#..",
    "#######",
    "...g...",
    "...g...",
    "..gGg..",
  ] },
  // Mẫn công: 3 vết cào trắng chéo (nét giữa lệch lên một điểm), trên tròn lục.
  man_cong: { cols: ["#1e4a2a", "#2f7a2c", "#5a9440"], at: [4, 5], rows: (() => {
    const g = Array.from({ length: 13 }, () => Array(14).fill("."));
    for (let i = 0; i < 3; i++) {
      const x0 = 7 + 4 * i - (i === 1 ? 1 : 0);
      for (let y = 0; y < 13; y++) {
        const x = x0 - Math.round(y * 0.55), w = y === 0 || y === 12 ? 1 : 2;
        for (let k = 0; k < w; k++) if (x + k >= 0 && x + k < 14) g[y][x + k] = "#";
      }
    }
    return g.map((r) => r.join(""));
  })() },
  // Khống chế: một mắt xích trắng (hình sân vận động rỗng) nằm chéo, nửa dưới phải màu bạc, trên tròn tím.
  khong_che: { cols: ["#2b1a40", "#5d4380", "#8a6bff"], at: [4, 4], rows: grid(15, 15, (x, y) => {
    const c = 7, a = 6.6, b = 3.9, t = 2, ang = (-45 * Math.PI) / 180;
    const u = (x - c) * Math.cos(ang) - (y - c) * Math.sin(ang), v = (x - c) * Math.sin(ang) + (y - c) * Math.cos(ang);
    const d = Math.hypot(Math.max(Math.abs(u) - (a - b), 0), v);
    return b - t <= d && d <= b ? (u + v > -1 ? "#" : "+") : undefined;
  }) },
  // Phụ trợ: hoa sen trắng (cánh giữa có gân bạc), trên tròn vàng.
  phu_tro: { cols: ["#6a4a12", "#b8862a", "#d9a63a"], at: [5, 6], rows: [
    "......#......",
    ".....###.....",
    "....##+##....",
    ".#..##+##..#.",
    ".##.##+##.##.",
    ".###.#+#.###.",
    "..###.+.###..",
    "...###+###...",
    ".#.#######.#.",
    "..#########..",
  ] },
};

const ids = heIds();
const missing = [...ids].filter((h) => !HE[h]), extra = Object.keys(HE).filter((h) => !ids.has(h));
if (missing.length || extra.length) {
  console.error(`[he-icons] HE_IDS (shared/data.ts) khác danh sách hình: thiếu ${missing.join(", ") || "-"}, thừa ${extra.join(", ") || "-"}`);
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
for (const [h, { cols, at, rows }] of Object.entries(HE)) {
  const c = cols.map(col), file = path.join(outDir, `${h}.png`);
  writeFileSync(file, encodePng(glyph(badge(c), rows, at[0], at[1], c)));
  console.log(`[he-icons] ${path.relative(process.cwd(), file)}`);
}
