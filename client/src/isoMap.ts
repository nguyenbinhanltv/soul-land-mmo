// Vẽ bản đồ Tiled (shared/assets/<mapId>.json) theo phép chiếu của iso.ts (bước 10.1). Server vẫn đọc đúng file đó theo lưới vuông;
// ở đây chỉ đổi cách vẽ: lớp `ground` thành ô hình thoi phẳng, lớp `trees` (cây, tường, mái, lều, đá…) thành khối có chiều cao,
// sắp lớp theo độ sâu để che hồn sư đứng phía sau. Ảnh tạm vẽ bằng code từ chính tiles.png (mỗi ô 16×16 được "trải" lên hình thoi),
// thay bằng ảnh isometric thật ở bước sau. Lớp `canopy` (tán cây) đã nằm trong khối cây nên chỉ dùng ở chế độ nhìn thẳng.
// Chỉ tạo ảnh cho các ô trong tầm camera (cộng lề), dùng lại ảnh khi camera đi.
import Phaser from "phaser";
import { TILE } from "../../shared/data.ts";
import { TILE_W, TILE_H, TOPDOWN, worldToScreen, screenToWorld, depthAt } from "./iso.ts";

/** Độ sâu mặt đất: dưới mọi thứ (vùng cảnh báo, hồn sư, chữ). */
const GROUND_DEPTH = -100000;
/** Khối cao nhất (cây) nhô lên trên tâm ô chừng này pixel: lề dưới khi chọn ô trong tầm camera. */
const MAX_RISE = 88;
/** Độ mờ khối đang che chính mình (để luôn thấy nhân vật khi đứng sau cây / nhà). */
const FADE = 0.45;

type RGBA = [number, number, number, number];
const rgba = (c: string, a = 255): RGBA => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), a];
const shade = (c: RGBA, k: number): RGBA => [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k), c[3]];
const OUTLINE = rgba("#1a1020");

/** Bộ đệm điểm ảnh nhỏ để vẽ khối bằng code (không khử răng cưa, hợp pixel art). */
class Buf {
  d: Uint8ClampedArray<ArrayBuffer>;
  constructor(public w: number, public h: number) { this.d = new Uint8ClampedArray(w * h * 4); }
  set(x: number, y: number, c: RGBA) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c[3]) return;
    const i = (y * this.w + x) * 4; this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = c[3];
  }
  alpha(x: number, y: number) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[(y * this.w + x) * 4 + 3]; }
  /** Tô đa giác (chẵn lẻ theo tâm điểm ảnh); `col` có thể là hàm theo điểm ảnh để tô sắc độ. */
  poly(pts: [number, number][], col: RGBA | ((x: number, y: number) => RGBA)) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y < Math.ceil(Math.max(...ys)); y++)
      for (let x = Math.floor(Math.min(...xs)); x < Math.ceil(Math.max(...xs)); x++) {
        const px = x + 0.5, py = y + 0.5; let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(x, y, typeof col === "function" ? col(x, y) : col);
      }
  }
  /** Viền tối có màu (mục 5.11) quanh mọi điểm ảnh đã tô, chỉ ở phía ngoài. */
  outline(c: RGBA = OUTLINE) {
    const src = this.d.slice(), a = (x: number, y: number) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : src[(y * this.w + x) * 4 + 3]);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++)
      if (!a(x, y) && (a(x - 1, y) > 128 || a(x + 1, y) > 128 || a(x, y - 1) > 128 || a(x, y + 1) > 128)) this.set(x, y, c);
  }
  canvas() {
    const cv = document.createElement("canvas"); cv.width = this.w; cv.height = this.h;
    cv.getContext("2d")!.putImageData(new ImageData(this.d, this.w, this.h), 0, 0); return cv;
  }
}

/** Ngẫu nhiên có hạt giống (vẽ hoa văn giống nhau mỗi lần tải). */
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

/** Màu tán cây theo vùng (giống tools/gen-tiles.py: CAN, CAND, CANL). */
const CANOPY = [["#2f7a2c", "#24612a", "#4b9c3f"], ["#276528", "#1d5024", "#388636"], ["#1e4a2a", "#163a22", "#2b6436"], ["#2b2f55", "#1f2240", "#434a80"]];

/**
 * Cách vẽ từng ô của lớp `trees` theo mã ô (gid) của tiles.png. Ô không có trong bảng: khối thấp, mặt trên lấy từ ảnh ô.
 * tree: thân + tán theo vùng; pine: thông tuyết; block: khối hộp (mái, tường) cao `h`; tent / fire / crystal / rock: vật nhỏ.
 */
type ObjKind = { k: "tree"; z: number } | { k: "pine" } | { k: "block"; h: number; top: number; side: string; win?: boolean }
  | { k: "tent" } | { k: "fire" } | { k: "crystal" } | { k: "rock" };
const OBJ: Record<number, ObjKind> = {
  11: { k: "tent" }, 12: { k: "fire" },
  14: { k: "block", h: 40, top: 14, side: "#8f3b2e" },             // mái ngói
  15: { k: "block", h: 40, top: 14, side: "#d8c8a2", win: true },  // tường nhà có cửa sổ, mặt trên là mái
  17: { k: "tree", z: 0 }, 18: { k: "tree", z: 1 }, 19: { k: "tree", z: 2 }, 20: { k: "tree", z: 3 },
  30: { k: "pine" }, 32: { k: "crystal" }, 36: { k: "rock" },
};

export class IsoMap {
  readonly MW: number; readonly MH: number;
  private ground: number[]; private trees: number[]; private canopy: number[];
  private src: { d: Uint8ClampedArray; w: number; cols: number } | null = null;
  /** Ảnh đang hiện theo chỉ số ô; ảnh rời tầm nhìn cất vào `free` để dùng lại. */
  private live = new Map<number, Phaser.GameObjects.Image[]>();
  private free: Phaser.GameObjects.Image[] = [];
  /** Khối có chiều cao đang hiện (để làm mờ khi che chính mình). */
  private tall = new Set<Phaser.GameObjects.Image>();
  private viewKey = "";

  constructor(private scene: Phaser.Scene, raw: any) {
    this.MW = raw.width; this.MH = raw.height;
    const layer = (n: string): number[] => raw.layers.find((l: any) => l.type === "tilelayer" && l.name === n)?.data ?? [];
    this.ground = layer("ground"); this.trees = layer("trees"); this.canopy = layer("canopy");
    const img = scene.textures.get("tiles").getSourceImage() as HTMLImageElement;
    if (img?.width) {
      const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext("2d")!; ctx.drawImage(img, 0, 0);
      this.src = { d: ctx.getImageData(0, 0, img.width, img.height).data, w: img.width, cols: Math.floor(img.width / TILE) };
    }
  }

  /** Khung bao bản đồ trên màn hình (cho camera.setBounds), kèm lề trên cho khối cao ở hàng đầu. */
  bounds() {
    const c = [worldToScreen(0, 0), worldToScreen(this.MW * TILE, 0), worldToScreen(0, this.MH * TILE), worldToScreen(this.MW * TILE, this.MH * TILE)];
    const x0 = Math.min(...c.map((p) => p.x)), x1 = Math.max(...c.map((p) => p.x)), y0 = Math.min(...c.map((p) => p.y)), y1 = Math.max(...c.map((p) => p.y));
    const top = TOPDOWN ? 0 : MAX_RISE;
    return { x: x0, y: y0 - top, w: x1 - x0, h: y1 - y0 + top };
  }

  /** Điểm ảnh (u, v) của ô `gid` trong tiles.png (gid = chỉ số ô + 1). */
  private texel(gid: number, u: number, v: number): RGBA {
    if (!this.src) return [0, 0, 0, 0];
    const i = gid - 1, sx = (i % this.src.cols) * TILE + u, sy = Math.floor(i / this.src.cols) * TILE + v, o = (sy * this.src.w + sx) * 4, d = this.src.d;
    return [d[o], d[o + 1], d[o + 2], d[o + 3]];
  }

  /** Trải ảnh ô 16×16 lên hình thoi TILE_W × TILE_H có góc trên ở (ox, oy) của bộ đệm (lấy mẫu gần nhất, ô kề nhau khít không hở). */
  private diamond(b: Buf, gid: number, ox: number, oy: number, k = 1) {
    const hx = TILE_W / 2, sc = TILE / TILE_H;
    for (let y = 0; y < TILE_H; y++) for (let x = 0; x < TILE_W; x++) {
      const px = x + 0.5 - hx, py = y + 0.5, u = (py + px / 2) * sc, v = (py - px / 2) * sc;
      if (u < 0 || v < 0 || u >= TILE || v >= TILE) continue;
      const c = this.texel(gid, Math.floor(u), Math.floor(v));
      b.set(ox + x, oy + y, k === 1 ? c : shade(c, k));
    }
  }

  /** Texture mặt đất của ô `gid`: hình thoi (isometric) hoặc ô vuông phóng 2 (nhìn thẳng). */
  private groundKey(gid: number) {
    const key = `isoG${gid}`; if (this.scene.textures.exists(key)) return key;
    let b: Buf;
    if (TOPDOWN) {
      b = new Buf(TILE * 2, TILE * 2);
      for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) b.set(x, y, this.texel(gid, x >> 1, y >> 1));
    } else { b = new Buf(TILE_W, TILE_H); this.diamond(b, gid, 0, 0); }
    this.scene.textures.addCanvas(key, b.canvas());
    return key;
  }

  /** Texture vật trên lớp `trees` và gốc (điểm chạm đất ở tâm ô). */
  private objKey(gid: number): { key: string; oy: number } {
    const key = `isoO${gid}`;
    const meta = this.scene.textures.exists(key) ? (this.scene.textures.get(key).customData as { oy: number }) : null;
    if (meta) return { key, oy: meta.oy };
    const b = TOPDOWN ? this.flatObj(gid) : this.drawObj(gid, OBJ[gid] ?? { k: "block", h: 12, top: gid, side: "" });
    const tex = this.scene.textures.addCanvas(key, b.buf.canvas())!;
    tex.customData = { oy: b.oy };
    return { key, oy: b.oy };
  }

  private flatObj(gid: number) {
    const buf = new Buf(TILE * 2, TILE * 2);
    for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) buf.set(x, y, this.texel(gid, x >> 1, y >> 1));
    return { buf, oy: 0.5 };
  }

  /** Vẽ vật cao bằng code (cỡ theo thoi 32×16 và hồn sư cao khoảng 52 pixel). Trả bộ đệm và gốc dọc (tỉ lệ) tại tâm hình thoi đáy. */
  private drawObj(gid: number, o: ObjKind): { buf: Buf; oy: number } {
    const W = TILE_W, hx = W / 2, hy = TILE_H / 2;
    const r = rng(gid * 7919 + 13);
    if (o.k === "block") {
      // Khối hộp: mặt trên là ô hình thoi lấy từ ảnh ô `top`, hai mặt bên (trái sáng hơn, ánh sáng từ trên bên trái).
      const h = o.h, b = new Buf(W, TILE_H + h), cy = hy + h;
      const side = o.side ? rgba(o.side) : shade(this.texel(o.top, 8, 8), 0.8);
      const L = shade(side, 0.92), R = shade(side, 0.7);
      b.poly([[0, hy], [hx, TILE_H], [hx, TILE_H + h], [0, hy + h]], (x, y) => (y >= hy + x / 2 + h - 2 ? shade(L, 0.75) : L));
      b.poly([[hx, TILE_H], [W, hy], [W, hy + h], [hx, TILE_H + h]], (x, y) => (y >= TILE_H - (x - hx) / 2 + h - 2 ? shade(R, 0.75) : R));
      if (o.win) for (const [x0, face] of [[4, L], [hx + 4, R]] as [number, RGBA][]) {
        // Cửa sổ trên mỗi mặt bên: khung gỗ tối, kính xanh.
        const y0 = (x: number) => (x < hx ? hy + x / 2 : TILE_H - (x - hx) / 2) + 12;
        b.poly([[x0, y0(x0)], [x0 + 8, y0(x0 + 8)], [x0 + 8, y0(x0 + 8) + 10], [x0, y0(x0) + 10]], rgba("#3a2a18"));
        b.poly([[x0 + 1, y0(x0 + 1) + 1], [x0 + 7, y0(x0 + 7) + 1], [x0 + 7, y0(x0 + 7) + 9], [x0 + 1, y0(x0 + 1) + 9]], face === L ? rgba("#7fb8d8") : rgba("#5a8aa8"));
      }
      this.diamond(b, o.top, 0, 0);
      return { buf: b, oy: cy / b.h };
    }
    if (o.k === "tree" || o.k === "pine") {
      // Cây rộng hơn một ô (tán lấn sang ô bên), cao khoảng 1,7 lần hồn sư.
      const TW = 44, tx = TW / 2, H = MAX_RISE, b = new Buf(TW, H), cy = H - hy;
      b.poly(ellipse(tx, cy, 13, 6.5), [26, 16, 32, 90]); // bóng đổ 2:1 dưới gốc
      const trunk = rgba("#5a3b22"), trunkL = rgba("#6e4b2c");
      b.poly([[tx - 3, cy - 26], [tx + 3, cy - 26], [tx + 3, cy + 1], [tx - 3, cy + 1]], (x) => (x < tx - 1 ? trunkL : x >= tx + 2 ? shade(trunk, 0.8) : trunk));
      if (o.k === "tree") {
        const [base, dark, light] = CANOPY[o.z].map((c) => rgba(c));
        const blobs: [number, number, number][] = [[tx, cy - 54, 15], [tx - 9, cy - 42, 10], [tx + 9, cy - 42, 10], [tx, cy - 36, 11]];
        const inside = (x: number, y: number) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 <= br * br);
        for (let y = 0; y < H; y++) for (let x = 0; x < TW; x++) {
          if (!inside(x + 0.5, y + 0.5)) continue;
          const l = (x - tx) * 0.6 + (y - (cy - 50)); // trên trái sáng, dưới phải tối
          b.set(x, y, l < -11 ? light : l > 8 ? dark : base);
        }
        for (let i = 0; i < 16; i++) { // đốm lá
          const x = Math.floor(tx - 15 + r() * 30), y = Math.floor(cy - 68 + r() * 38);
          if (inside(x + 0.5, y + 0.5) && inside(x + 1.5, y + 0.5)) { const c = r() < 0.5 ? light : dark; b.set(x, y, c); b.set(x + 1, y, c); }
        }
      } else {
        const green = rgba("#1e4a2a"), dark = rgba("#163a22"), snow = rgba("#f4f8ff");
        for (let t = 0; t < 4; t++) {
          const top = cy - 76 + t * 12, bot = top + 20, half = 6 + t * 4;
          b.poly([[tx, top], [tx + half, bot], [tx - half, bot]], (x, y) => (y < top + 4 ? snow : x > tx + 1 ? dark : green));
        }
      }
      b.outline();
      return { buf: b, oy: cy / H };
    }
    // Vật nhỏ trên nền ô (lều, lửa trại, băng tinh, đá ngầm): khung 32×48, chạm đất ở tâm hình thoi đáy.
    const H = 48, b = new Buf(W, H), cy = H - hy;
    b.poly(ellipse(hx, cy, 12, 6), [26, 16, 32, 80]);
    if (o.k === "tent") {
      const apex: [number, number] = [hx, cy - 26];
      b.poly([[hx - 15, cy], [hx, cy + 7], apex], rgba("#c9a46a"));
      b.poly([[hx, cy + 7], [hx + 15, cy], apex], rgba("#a8844e"));
      b.poly([[hx - 7, cy + 4], [hx - 1, cy + 7], [hx - 4, cy - 9]], rgba("#3a2a18")); // cửa lều
    } else if (o.k === "fire") {
      b.poly([[hx - 8, cy - 1], [hx + 6, cy + 4], [hx + 8, cy + 1], [hx - 6, cy - 4]], rgba("#5a3b22"));
      b.poly([[hx + 6, cy - 3], [hx - 6, cy + 4], [hx - 8, cy + 1], [hx + 5, cy - 5]], rgba("#6e4b2c"));
      b.poly([[hx - 5, cy], [hx + 5, cy], [hx + 1, cy - 16], [hx - 1, cy - 9]], rgba("#ff9a2e"));
      b.poly([[hx - 3, cy], [hx + 3, cy], [hx + 1, cy - 9]], rgba("#ffe066"));
    } else if (o.k === "crystal") {
      const c = rgba("#7fd0ff"), hi = rgba("#c0e8ff"), lo = rgba("#2d6a96");
      b.poly([[hx - 4, cy + 1], [hx + 4, cy + 1], [hx + 2, cy - 28], [hx - 2, cy - 31]], (x) => (x < hx - 1 ? hi : c));
      b.poly([[hx - 12, cy], [hx - 5, cy + 2], [hx - 8, cy - 16]], (x) => (x < hx - 9 ? hi : lo));
      b.poly([[hx + 5, cy + 2], [hx + 13, cy], [hx + 10, cy - 19]], (x) => (x < hx + 9 ? c : lo));
    } else if (o.k === "rock") {
      const base = rgba("#6a6258"), hi = rgba("#8f877a"), lo = rgba("#4f4840");
      b.poly([[hx - 14, cy + 1], [hx - 10, cy - 8], [hx - 3, cy - 13], [hx + 8, cy - 10], [hx + 14, cy - 1], [hx + 7, cy + 5], [hx - 7, cy + 5]],
        (x, y) => (y < cy - 8 || x < hx - 9 ? hi : y > cy + 1 || x > hx + 9 ? lo : base));
    }
    b.outline();
    return { buf: b, oy: cy / H };
  }

  /**
   * Mỗi khung hình: hiện đúng các ô trong tầm camera (tính lại khi camera đi quá nửa ô hoặc đổi cỡ / phóng), rồi làm mờ khối cao
   * đang che điểm `focus` (chân chính mình, tọa độ màn hình) mà đứng trước nó.
   */
  update(cam: Phaser.Cameras.Scene2D.Camera, focus: { x: number; y: number } | null) {
    const v = cam.worldView, key = `${Math.floor(v.x / 16)}|${Math.floor(v.y / 16)}|${Math.round(v.width)}|${Math.round(v.height)}`;
    if (key !== this.viewKey) { this.viewKey = key; this.stream(v.x - TILE_W, v.y - TILE_H, v.right + TILE_W, v.bottom + MAX_RISE + TILE_H); }
    if (TOPDOWN) return;
    for (const im of this.tall) {
      // Che: chân mình nằm sau khối (độ sâu nhỏ hơn) và thân mình (khoảng 40 pixel trên chân) nằm trong khung ảnh của khối.
      const cover = !!focus && im.depth > focus.y && Math.abs(focus.x - im.x) < im.displayWidth / 2 - 4
        && focus.y - 40 < im.y + im.displayHeight * (1 - im.originY) && focus.y > im.y - im.displayHeight * im.originY;
      const a = cover ? FADE : 1; if (im.alpha !== a) im.setAlpha(a);
    }
  }

  private stream(x0: number, y0: number, x1: number, y1: number) {
    const corners = [screenToWorld(x0, y0), screenToWorld(x1, y0), screenToWorld(x0, y1), screenToWorld(x1, y1)];
    const tx0 = Math.max(0, Math.floor(Math.min(...corners.map((c) => c.x)) / TILE)), tx1 = Math.min(this.MW - 1, Math.floor(Math.max(...corners.map((c) => c.x)) / TILE));
    const ty0 = Math.max(0, Math.floor(Math.min(...corners.map((c) => c.y)) / TILE)), ty1 = Math.min(this.MH - 1, Math.floor(Math.max(...corners.map((c) => c.y)) / TILE));
    const want = new Set<number>();
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const s = worldToScreen((tx + 0.5) * TILE, (ty + 0.5) * TILE);
      if (s.x >= x0 && s.x <= x1 && s.y >= y0 && s.y <= y1) want.add(ty * this.MW + tx);
    }
    for (const [i, ims] of this.live) if (!want.has(i)) {
      for (const im of ims) { im.setVisible(false); this.tall.delete(im); this.free.push(im); }
      this.live.delete(i);
    }
    for (const i of want) if (!this.live.has(i)) this.live.set(i, this.place(i));
  }

  private img(x: number, y: number, key: string) {
    const im = this.free.pop() ?? this.scene.add.image(0, 0, key);
    return im.setTexture(key).setPosition(x, y).setVisible(true).setAlpha(1);
  }

  /** Tạo các ảnh của ô `i`: mặt đất, rồi vật trên lớp `trees` (và tán cây khi nhìn thẳng). */
  private place(i: number): Phaser.GameObjects.Image[] {
    const tx = i % this.MW, ty = Math.floor(i / this.MW), cx = (tx + 0.5) * TILE, cy = (ty + 0.5) * TILE, s = worldToScreen(cx, cy);
    const out: Phaser.GameObjects.Image[] = [];
    const g = this.ground[i];
    if (g > 0) out.push(this.img(s.x, s.y, this.groundKey(g)).setOrigin(0.5, 0.5).setDepth(GROUND_DEPTH));
    const t = this.trees[i];
    if (t > 0) {
      const o = this.objKey(t), im = this.img(s.x, s.y, o.key).setOrigin(0.5, o.oy);
      // Nhìn thẳng: lớp `trees` nằm sát mặt đất như trước. Isometric: khối sắp lớp theo độ sâu của tâm ô.
      im.setDepth(TOPDOWN ? GROUND_DEPTH + 1 : depthAt(cx, cy));
      out.push(im); if (!TOPDOWN) this.tall.add(im);
    }
    const c = this.canopy[i];
    if (TOPDOWN && c > 0) out.push(this.img(s.x, s.y, this.objKey(c).key).setOrigin(0.5, 0.5).setDepth(99970));
    return out;
  }
}

/** Đa giác xấp xỉ elip tâm (x, y), bán trục rx, ry. */
function ellipse(x: number, y: number, rx: number, ry: number): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; out.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); }
  return out;
}
