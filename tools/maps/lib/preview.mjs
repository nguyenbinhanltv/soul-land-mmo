// Ảnh nhìn thẳng của bản đồ vừa dựng (tools/maps/build.mjs --preview): mỗi ô SCALE điểm, màu theo gid, viền mảnh vùng theo tầng,
// dấu cổng / truyền tống trận / tinh anh / hang thú vương / trại. Để soát bố cục nhanh; ảnh isometric thật: tools/maps/preview.mjs.
import { Img, encodePng, hex } from "../../assets/lib.mjs";

const SCALE = 3;
/** Màu mặc định theo gid (giống bản đồ nhỏ của client); bố cục có thể đè bằng `preview.colors`. */
const COLORS = {
  1: "#5a9440", 2: "#4f8a3c", 3: "#6b6a3a", 4: "#3f8a7a", 5: "#3f7a40", 6: "#6b6a3a", 7: "#a08a63", 8: "#7d6b55", 9: "#2d6a96", 10: "#b89a68",
  13: "#a39f94", 16: "#8c877c", 25: "#7a6448", 26: "#7d7a70", 33: "#c0a070", 34: "#4f98b8", 35: "#173f63",
  11: "#d8c8a2", 12: "#ff9a3c", 17: "#2f6e2a", 18: "#24612a", 19: "#1d5024", 20: "#163a22", 27: "#e8e0d0", 28: "#5fb8a0", 29: "#c89a50",
  30: "#0e2a18", 32: "#3a3f48", 36: "#8a8a80", 37: "#6a6a70", 38: "#9ab0c0", 39: "#7a7a80", 40: "#6a4a2a",
};
const TIER_COL = ["#ffe066", "#9be15d", "#4fd1ff", "#ff6b6b", "#c58cff"];

/** `r`: kết quả build(), `L`: bố cục. Trả PNG. */
export function topdownPreview(r, L) {
  const { map } = r, MW = map.width, MH = map.height, img = new Img(MW * SCALE, MH * SCALE);
  const col = { ...COLORS, ...(L.preview?.colors ?? {}) }, C = {};
  const rgb = (g) => (C[g] ??= [...hex(col[g] ?? "#ff00ff").slice(0, 3), 255]);
  const ground = map.layers.find((l) => l.name === "ground").data, trees = map.layers.find((l) => l.name === "trees").data;
  const box = (x0, y0, x1, y1, c) => { for (let y = Math.max(0, y0); y < Math.min(img.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(img.w, x1); x++) img.set(x, y, c); };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = y * MW + x, t = trees[i];
    box(x * SCALE, y * SCALE, (x + 1) * SCALE, (y + 1) * SCALE, rgb(ground[i]));
    // Vật: chấm giữa ô (cây chiếm gần hết ô) để vẫn thấy nền.
    if (t) box(x * SCALE + (t >= 17 && t <= 20 ? 0 : 1), y * SCALE + (t >= 17 && t <= 20 ? 0 : 1), (x + 1) * SCALE - (t >= 17 && t <= 20 ? 1 : 0), (y + 1) * SCALE - (t >= 17 && t <= 20 ? 1 : 0), rgb(t));
  }
  const outline = (o, c, w = 1) => {
    const x0 = Math.round(o.x / 16 * SCALE), y0 = Math.round(o.y / 16 * SCALE), x1 = Math.round((o.x + o.width) / 16 * SCALE), y1 = Math.round((o.y + o.height) / 16 * SCALE);
    box(x0, y0, x1, y0 + w, c); box(x0, y1 - w, x1, y1, c); box(x0, y0, x0 + w, y1, c); box(x1 - w, y0, x1, y1, c);
  };
  const objs = map.layers.find((l) => l.type === "objectgroup").objects;
  const tierOfZone = new Map(L.zones.map((z) => [z.name, z.tier]));
  for (const o of objs) {
    if (o.type === "zone") { const c = hex(TIER_COL[tierOfZone.get(o.name) ?? 4]); outline(o, [c[0], c[1], c[2], 255]); }
  }
  const mark = { portal: "#ff3cf0", waypoint: "#3cf0ff", elite: "#ff9a1f", boss: "#ff2020", spawn: "#fff04a", safe: "#ffffff" };
  for (const o of objs) {
    if (mark[o.type]) { const c = hex(mark[o.type]); outline(o, [c[0], c[1], c[2], 255], 2); }
    if (o.type === "arrive" || o.type === "npc") { const x = Math.round(o.x / 16 * SCALE), y = Math.round(o.y / 16 * SCALE); box(x - 2, y - 2, x + 3, y + 3, [255, 255, 255, 255]); }
  }
  return encodePng(img);
}
