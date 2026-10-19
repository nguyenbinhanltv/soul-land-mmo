// Biểu tượng 6 vị trí hồn cốt (mục 5.5, bước 4.1), vẽ bằng code từ một lưới điểm ảnh 9×9: dùng cho ô túi đồ (SVG, màu theo
// niên hạn qua `currentColor`) và hồn cốt rơi dưới đất (texture trắng `bone_<vị trí>`, tô màu bằng setTint).
import Phaser from "phaser";
import { BONE_SLOTS, type BoneSlot } from "../../shared/data.ts";

/** "#" là xương, "." trong suốt. Tay / chân phải là ảnh lật ngang của tay / chân trái. */
const LEFT_ARM = [
  "......##.",
  ".....####",
  ".....###.",
  "....###..",
  "...###...",
  "..###....",
  ".###.....",
  "#####....",
  "#.#.#....",
];
const LEFT_LEG = [
  "....##...",
  "...####..",
  "....##...",
  "....##...",
  "....##...",
  "....##...",
  "...####..",
  ".######..",
  ".######..",
];
const mirror = (rows: string[]) => rows.map((r) => [...r].reverse().join(""));
const BONE_PIX: Record<BoneSlot, string[]> = {
  dau: [
    "..#####..",
    ".#######.",
    "#########",
    "#..###..#",
    "#..###..#",
    "####.####",
    ".#######.",
    "..#.#.#..",
    "..#####..",
  ],
  than: [
    "....#....",
    ".#######.",
    "#...#...#",
    ".#######.",
    "#...#...#",
    ".#######.",
    "#...#...#",
    "..#####..",
    "....#....",
  ],
  tay_trai: LEFT_ARM,
  tay_phai: mirror(LEFT_ARM),
  chan_trai: LEFT_LEG,
  chan_phai: mirror(LEFT_LEG),
};

/** Ô điểm ảnh của vị trí `slot` (vị trí lạ: hình thân). */
function cells(slot: string) {
  const rows = BONE_PIX[slot as BoneSlot] ?? BONE_PIX.than, out: [number, number][] = [];
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === "#") out.push([x, y]); }));
  return out;
}

/** SVG biểu tượng hồn cốt cho ô túi đồ: tô bằng `currentColor` (màu niên hạn đặt qua CSS). */
export function boneSvg(slot: string, cls = "ico bone") {
  const r = cells(slot).map(([x, y]) => `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`).join("");
  return `<svg class="${cls}" viewBox="0 0 9 9" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${r}</svg>`;
}

/** Texture trắng `bone_<vị trí>` (9×9, viền tối 1 điểm ảnh cho dễ thấy trên cỏ) cho hồn cốt rơi dưới đất. */
export function boneTextures(scene: Phaser.Scene) {
  for (const s of BONE_SLOTS) {
    const key = `bone_${s.id}`; if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({}, false), px = cells(s.id);
    g.fillStyle(0x000000, 0.55); for (const [x, y] of px) g.fillRect(x, y + 1, 1, 1); // bóng đổ
    g.fillStyle(0xffffff, 1); for (const [x, y] of px) g.fillRect(x, y, 1, 1);
    g.generateTexture(key, 9, 10); g.destroy();
  }
}
