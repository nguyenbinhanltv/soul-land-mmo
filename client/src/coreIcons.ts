// Biểu tượng hồn hạch theo bộ (mục 5.6, bước 5.1), vẽ bằng code từ lưới điểm ảnh 11×11: viên hạch sáu cạnh màu của bộ (CORE_SETS)
// và một hình 5×5 riêng mỗi bộ ở giữa. Dùng cho ô túi đồ (SVG, thân tô `currentColor`) và hồn hạch rơi dưới đất (texture
// `core_<bộ>` đã tô màu sẵn, vì có hai màu).
import Phaser from "phaser";
import { CORE_SETS, type CoreSetId } from "../../shared/data.ts";

/** Thân viên hạch: "#" là thân, "." trong suốt. */
const GEM = [
  "...#####...",
  "..#######..",
  ".#########.",
  "###########",
  "###########",
  "###########",
  "###########",
  "###########",
  ".#########.",
  "..#######..",
  "...#####...",
];
/** Hình riêng mỗi bộ, đặt ở ô (3, 3) của thân. */
const GLYPH: Record<CoreSetId, string[]> = {
  phuong_hoang:  ["..#..", ".##..", ".###.", "#####", ".###."], // ngọn lửa
  ba_vuong_long: ["...#.", "..#..", ".####", "..#..", ".#..."], // tia sét
  xa_hoang:      [".###.", "#....", ".###.", "....#", ".###."], // thân rắn
  hao_thien:     ["#####", "#####", "..#..", "..#..", "..#.."], // chùy
  that_sat:      ["..#..", "..#..", "..#..", "#####", "..#.."], // kiếm
  linh_mieu:     ["#.#.#", "#.#.#", "#.#.#", ".#.#.", "....."], // vết vuốt
  lam_ngan:      ["#...#", "##.##", ".###.", "..#..", "..#.."], // lá cỏ
  luu_ly:        ["..#..", ".###.", "..#..", "#####", ".###."], // tháp
  tien_co:       ["..#..", "#####", ".###.", ".#.#.", "#...#"], // ngôi sao
};

/** Ô điểm ảnh của thân (trừ chỗ hình bộ) và của hình bộ `set` (bộ lạ: không có hình). */
function cells(set: string) {
  const glyph = GLYPH[set as CoreSetId] ?? [], mark = new Set<string>(), body: [number, number][] = [], sym: [number, number][] = [];
  glyph.forEach((r, y) => [...r].forEach((c, x) => { if (c === "#") { mark.add(`${x + 3},${y + 3}`); sym.push([x + 3, y + 3]); } }));
  GEM.forEach((r, y) => [...r].forEach((c, x) => { if (c === "#" && !mark.has(`${x},${y}`)) body.push([x, y]); }));
  return { body, sym };
}
const rects = (px: [number, number][]) => px.map(([x, y]) => `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`).join("");

/** SVG biểu tượng hồn hạch cho ô túi đồ: thân tô `currentColor` (màu bộ đặt qua CSS), hình bộ sáng ở giữa. */
export function coreSvg(set: string, cls = "ico core") {
  const { body, sym } = cells(set);
  return `<svg class="${cls}" viewBox="0 0 11 11" shape-rendering="crispEdges" aria-hidden="true">`
    + `<g fill="currentColor">${rects(body)}</g><g fill="#fff" opacity=".92">${rects(sym)}</g>`
    + `<g fill="#fff" opacity=".45"><rect x="3" y="1" width="2" height="1"/><rect x="2" y="2" width="1" height="1"/></g></svg>`;
}

/** Texture `core_<bộ>` (11×12, có bóng đổ) cho hồn hạch rơi dưới đất: thân màu bộ, nửa dưới tối hơn, hình bộ màu trắng. */
export function coreTextures(scene: Phaser.Scene) {
  for (const s of CORE_SETS) {
    const key = `core_${s.id}`; if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({}, false), { body, sym } = cells(s.id), col = Phaser.Display.Color.HexStringToColor(s.col);
    const dark = Phaser.Display.Color.GetColor(col.red * 0.6, col.green * 0.6, col.blue * 0.6);
    g.fillStyle(0x000000, 0.55); for (const [x, y] of [...body, ...sym]) g.fillRect(x, y + 1, 1, 1); // bóng đổ
    for (const [x, y] of body) { g.fillStyle(y >= 7 ? dark : col.color, 1); g.fillRect(x, y, 1, 1); }
    g.fillStyle(0xffffff, 1); for (const [x, y] of sym) g.fillRect(x, y, 1, 1);
    g.generateTexture(key, 11, 12); g.destroy();
  }
}
