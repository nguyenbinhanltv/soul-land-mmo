// Vẽ bản đồ Tiled (shared/assets/<mapId>.json) theo phép chiếu của iso.ts. Server vẫn đọc đúng file đó theo lưới vuông; ở đây chỉ
// đổi cách vẽ (GAME_DESIGN.md mục 5.11 "Bản đồ isometric"):
// - lớp `ground` → ô thoi thật theo bảng shared/assets/iso/tiles.json (bước 10.2): biến thể và lật ngang chọn theo băm vị trí, khối
//   2×2 cùng loại vẽ bằng ô lớn 64×32, mép giữa hai loại địa hình có lớp phủ (loại `edge` cao hơn lấn sang ô bên);
// - lớp `trees` → vật đứng (cây, lều, lửa trại, băng tinh, đá ngầm…) đặt ở tâm ô, sắp lớp theo độ sâu; khối ô `roof` có hàng
//   `wall` phía trước gom thành một ngôi nhà (isoBuild.ts, cắt lát 16 pixel), ô `wall` đứng riêng là tường thành;
// - lớp `canopy` (tán cây) không vẽ: tán là một phần ảnh cây (chỉ dùng ở chế độ nhìn thẳng).
// Ô / vật chưa có trong tiles.json (hoặc ảnh chưa tải được) vẽ tạm bằng code từ chính tiles.png như bước 10.1.
// Chỉ tạo ảnh cho các ô trong tầm camera (cộng lề), dùng lại ảnh khi camera đi; nhà dựng một lần khi vào bản đồ.
import Phaser from "phaser";
import { TILE } from "../../shared/data.ts";
import { TILE_W, TILE_H, TOPDOWN, worldToScreen, screenToWorld, depthAt } from "./iso.ts";
import { Buf, rgba, shade, buildHouse, buildFence, frontDepth, type RGBA, type BuildStyle } from "./isoBuild.ts";

/** Độ sâu mặt đất: dưới mọi thứ (vùng cảnh báo, hồn sư, chữ); ô phía trước vẽ sau để che đáy ô phía sau. Lớp phủ mép trên mọi ô. */
const GROUND_DEPTH = -100000, EDGE_DEPTH = -60000;
/**
 * Khối vẽ bằng code theo cỡ gốc thoi BASE_W × BASE_H (cây, nhà, vật nhỏ so với hồn sư cao khoảng 52 pixel), rồi phóng OBJ_K
 * cho đúng cỡ thoi đang dùng: đổi TILE_W / TILE_H trong iso.ts là đủ, không phải sửa ở đây.
 */
const BASE_W = 32, BASE_H = 16, OBJ_K = TILE_W / BASE_W;
/** Khối vẽ code cao nhất (cây, cỡ gốc) nhô lên trên tâm ô chừng này pixel. */
const BASE_RISE = 88;
/**
 * Vật đang che chính mình (cây, nhà): WebGL khoét một lỗ elip HOLE_W × HOLE_H quanh thân (mặt nạ hình học đảo) và mờ nhẹ còn
 * HOLE_ALPHA, để thấy hồn sư cả khi nhiều cây rừng rậm chồng lên nhau; chỉ có Canvas thì mờ còn FADE.
 */
const FADE = 0.4, HOLE_ALPHA = 0.85, HOLE_W = 44, HOLE_H = 64;
/** Gid Tiled của mái và tường (tools/gen-map.mjs, bảng GID). */
const ROOF = 14, WALL = 15;

// ---------- shared/assets/iso/tiles.json ----------
/** Ô nền: các biến thể ảnh 32×32 (thoi 32×16), ô lớn 64×64 (thoi 64×32, phủ 2×2 ô), tâm mặt trên trong ảnh, thứ bậc lấn mép. */
interface GroundDef { img: string[]; big?: string[]; c: [number, number]; cBig?: [number, number]; edge: number; flip?: boolean }
/** Vật đứng: key manifest `prop_{vật}` (ảnh sprites/iso/props/{vật}.png) và điểm chân (chạm tâm ô) trong ảnh. */
interface PropDef { key: string; foot: [number, number]; flip?: boolean }
/** Bộ của một bản đồ: gid → tên ô / vật (kèm `~#rrggbb` để nhân màu), kiểu nhà. Bộ "*" là mặc định. */
interface MapSet { ground?: Record<string, string>; props?: Record<string, string | string[]>; build?: BuildStyle }
interface IsoTiles { ground: Record<string, GroundDef>; props: Record<string, PropDef>; maps: Record<string, MapSet> }

const TILES_KEY = "iso-tiles", BASE = "iso/";
/** Texture của ảnh ô nền (đường dẫn trong shared/assets/iso). Vật đứng dùng thẳng key manifest. */
const texKey = (file: string) => `iso:${file}`;
const propFile = (key: string) => `sprites/iso/props/${key.replace(/^prop_/, "")}.png`;
/** "tên~#rrggbb" → tên và màu nhân. */
const parseRef = (ref: string) => { const [name, tint] = ref.split("~"); return { name, tint: tint ?? "" }; };

/** Bộ ô / vật của một bản đồ: "*" rồi đè bằng bộ riêng. */
function mapSet(data: IsoTiles | undefined, mapId: string) {
  const all = data?.maps?.["*"] ?? {}, own = data?.maps?.[mapId] ?? {};
  return { ground: { ...all.ground, ...own.ground }, props: { ...all.props, ...own.props }, build: own.build ?? all.build };
}

/** Tải tiles.json rồi chỉ những ảnh bản đồ `mapId` dùng tới (tránh tải ảnh của vùng khác). Gọi trong preload(). */
export function preloadIso(scene: Phaser.Scene, mapId: string) {
  if (TOPDOWN) return;
  scene.load.json(TILES_KEY, BASE + "tiles.json");
  scene.load.once(`filecomplete-json-${TILES_KEY}`, (_k: string, _t: string, data: IsoTiles) => {
    const set = mapSet(data, mapId), files = new Set<string>();
    for (const ref of Object.values(set.ground)) { const g = data.ground[parseRef(ref).name]; for (const f of [...(g?.img ?? []), ...(g?.big ?? [])]) files.add(f); }
    for (const f of files) if (!scene.textures.exists(texKey(f))) scene.load.image(texKey(f), BASE + f);
    for (const v of Object.values(set.props)) for (const ref of ([] as string[]).concat(v)) {
      const p = data.props[parseRef(ref).name];
      if (p && !scene.textures.exists(p.key)) scene.load.image(p.key, propFile(p.key));
    }
  });
}

/** Băm vị trí ô → số nguyên không âm ổn định (chọn biến thể, lật). */
const hash = (x: number, y: number, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; };

/** Ô nền đã phân giải cho một gid. */
interface Ground { def: GroundDef; tint: string; small: string[]; big: string[] }
/** Một nhóm ảnh cùng mờ khi che chính mình (cây là 1 ảnh, nhà là các lát của nó). */
interface Tall { ims: Phaser.GameObjects.Image[] }

/** Màu tán cây theo vùng (giống tools/gen-tiles.py: CAN, CAND, CANL) cho khối vẽ code. */
const CANOPY = [["#2f7a2c", "#24612a", "#4b9c3f"], ["#276528", "#1d5024", "#388636"], ["#1e4a2a", "#163a22", "#2b6436"], ["#2b2f55", "#1f2240", "#434a80"]];
/**
 * Khối vẽ code (đường lùi khi chưa có ảnh): tree: thân + tán theo vùng; pine: thông tuyết; block: khối hộp (mái, tường) cao `h`;
 * tent / fire / crystal / rock: vật nhỏ.
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

/** Ngẫu nhiên có hạt giống (vẽ hoa văn giống nhau mỗi lần tải). */
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

export class IsoMap {
  readonly MW: number; readonly MH: number;
  private ground: number[]; private trees: number[]; private canopy: number[];
  private src: { d: Uint8ClampedArray; w: number; cols: number } | null = null;
  /** Ô nền theo gid (null: vẽ code), vật theo gid (danh sách tên, null: vẽ code), kiểu nhà. */
  private groundDefs = new Map<number, Ground | null>();
  private propDefs = new Map<number, { key: string; def: PropDef }[] | null>();
  private build: BuildStyle | null = null;
  /** Ô thuộc ô lớn: chỉ số ô góc trên (gốc ô lớn) → true; ô khác trong khối → chỉ số gốc. */
  private bigAt = new Map<number, number>();
  /** Ô thuộc một ngôi nhà (không vẽ vật riêng). */
  private inHouse = new Set<number>();
  /** Ảnh đang hiện theo chỉ số ô; ảnh rời tầm nhìn cất vào `free` để dùng lại. */
  private live = new Map<number, Phaser.GameObjects.Image[]>();
  private free: Phaser.GameObjects.Image[] = [];
  /** Vật có chiều cao đang hiện (để làm mờ khi che chính mình). */
  private tall = new Set<Tall>();
  private tallOf = new Map<Phaser.GameObjects.Image, Tall>();
  private viewKey = "";
  private hole: Phaser.GameObjects.Graphics | null = null;
  private holeMask: Phaser.Display.Masks.GeometryMask | null = null;
  /** Vật cao nhất nhô lên trên tâm ô (pixel màn hình): lề camera và vùng tải ô. */
  private rise = BASE_RISE * OBJ_K;

  constructor(private scene: Phaser.Scene, raw: any, private mapId: string) {
    this.MW = raw.width; this.MH = raw.height;
    const layer = (n: string): number[] => raw.layers.find((l: any) => l.type === "tilelayer" && l.name === n)?.data ?? [];
    this.ground = layer("ground"); this.trees = layer("trees"); this.canopy = layer("canopy");
    const img = scene.textures.get("tiles").getSourceImage() as HTMLImageElement;
    if (img?.width) {
      const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext("2d")!; ctx.drawImage(img, 0, 0);
      this.src = { d: ctx.getImageData(0, 0, img.width, img.height).data, w: img.width, cols: Math.floor(img.width / TILE) };
    }
    if (TOPDOWN) return;
    if (scene.game.renderer.type === Phaser.WEBGL) {
      this.hole = scene.make.graphics({}, false);
      this.holeMask = this.hole.createGeometryMask().setInvertAlpha(true);
    }
    this.resolve(scene.cache.json.get(TILES_KEY) as IsoTiles | undefined, mapId);
    this.planBig();
    if (this.build) this.buildHouses();
  }

  // ---------- Phân giải tiles.json ----------
  private resolve(data: IsoTiles | undefined, mapId: string) {
    if (!data) return;
    const set = mapSet(data, mapId), has = (f: string) => this.scene.textures.exists(texKey(f));
    for (const [gid, ref] of Object.entries(set.ground)) {
      const { name, tint } = parseRef(ref), def = data.ground[name];
      const small = def?.img.filter(has) ?? [], big = def?.big?.filter(has) ?? [];
      if (!def || !small.length) { if (def) console.warn(`[isoMap] thiếu ảnh ô ${name}`); continue; }
      this.groundDefs.set(+gid, { def, tint, small: small.map((f) => this.tinted(texKey(f), tint)), big: big.map((f) => this.tinted(texKey(f), tint)) });
    }
    for (const [gid, v] of Object.entries(set.props)) {
      const list = ([] as string[]).concat(v).flatMap((ref) => {
        const { name, tint } = parseRef(ref), def = data.props[name];
        if (!def || !this.scene.textures.exists(def.key)) { console.warn(`[isoMap] thiếu ảnh vật ${name}`); return []; }
        this.rise = Math.max(this.rise, def.foot[1]);
        return [{ key: this.tinted(def.key, tint), def }];
      });
      if (list.length) this.propDefs.set(+gid, list);
    }
    this.build = set.build ?? null;
  }

  /** Texture nhân màu `tint` (#rrggbb) của `key` (tạo một lần, chạy cả khi chỉ có Canvas, không dùng setTint). */
  private tinted(key: string, tint: string) {
    if (!tint) return key;
    const out = `${key}~${tint}`; if (this.scene.textures.exists(out)) return out;
    const { cv, ctx, data } = this.pixels(key), [r, g, b] = rgba(tint), d = data.data;
    for (let i = 0; i < d.length; i += 4) { d[i] = (d[i] * r) / 255; d[i + 1] = (d[i + 1] * g) / 255; d[i + 2] = (d[i + 2] * b) / 255; }
    ctx.putImageData(data, 0, 0); this.scene.textures.addCanvas(out, cv);
    return out;
  }

  private pixels(key: string) {
    const img = this.scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!; ctx.drawImage(img, 0, 0);
    return { cv, ctx, data: ctx.getImageData(0, 0, img.width, img.height) };
  }

  /** Khối 2×2 thẳng hàng chẵn cùng một loại ô (cùng tên, cùng màu nhân) và loại đó có ô lớn → vẽ một ô lớn. */
  private planBig() {
    for (let ty = 0; ty + 1 < this.MH; ty += 2) for (let tx = 0; tx + 1 < this.MW; tx += 2) {
      const i = ty * this.MW + tx, g = this.groundDefs.get(this.ground[i]);
      if (!g?.big.length) continue;
      const same = [i + 1, i + this.MW, i + this.MW + 1].every((j) => { const h = this.groundDefs.get(this.ground[j]); return h && h.def === g.def && h.tint === g.tint; });
      if (same) for (const j of [i, i + 1, i + this.MW, i + this.MW + 1]) this.bigAt.set(j, i);
    }
  }

  // ---------- Nhà và tường thành ----------
  /**
   * Mỗi khối ô `roof` liền nhau (theo hình chữ nhật bao) cộng các hàng `wall` ngay phía trước (+y) là một ngôi nhà; dựng ảnh rồi cắt
   * lát 16 pixel, độ sâu mỗi lát là mép trước chân nhà tại cột đó. Ô `wall` còn lại là tường thành (vẽ theo ô khi tải).
   */
  private buildHouses() {
    const seen = new Set<number>(), MW = this.MW;
    for (let i = 0; i < this.trees.length; i++) {
      if (this.trees[i] !== ROOF || seen.has(i)) continue;
      let x0 = i % MW, x1 = x0, y0 = Math.floor(i / MW), y1 = y0;
      const stack = [i]; seen.add(i);
      while (stack.length) {
        const j = stack.pop()!, x = j % MW, y = Math.floor(j / MW);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy, k = Y * MW + X;
          if (X >= 0 && Y >= 0 && X < MW && Y < this.MH && this.trees[k] === ROOF && !seen.has(k)) { seen.add(k); stack.push(k); }
        }
      }
      // Hàng tường mặt tiền: tối đa 2 hàng `wall` phủ kín bề ngang nhà ngay dưới khối mái.
      for (let n = 0; n < 2 && y1 + 1 < this.MH; n++) {
        if (!Array.from({ length: x1 - x0 + 1 }, (_, k) => this.trees[(y1 + 1) * MW + x0 + k]).every((g) => g === WALL)) break;
        y1++;
      }
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.inHouse.add(y * MW + x);
      this.addHouse(x0 * TILE, y0 * TILE, (x1 + 1) * TILE, (y1 + 1) * TILE);
    }
  }

  private addHouse(X0: number, Y0: number, X1: number, Y1: number) {
    // Texture dùng chung mọi scene nên khóa theo bản đồ và chân nhà; vào lại bản đồ thì dùng lại ảnh đã dựng.
    const key = `isoHouse|${this.mapId}|${X0}_${Y0}_${X1}_${Y1}`;
    if (!this.scene.textures.exists(key)) {
      const h = buildHouse(X0, Y0, X1, Y1, this.build!), tex = this.scene.textures.addCanvas(key, h.canvas)!;
      tex.customData = { x: h.x, y: h.y };
      for (let c = 0; c * 16 < h.canvas.width; c++) tex.add(`c${c}`, 0, c * 16, 0, Math.min(16, h.canvas.width - c * 16), h.canvas.height);
    }
    const tex = this.scene.textures.get(key), at = tex.customData as { x: number; y: number }, W = tex.source[0].width, group: Tall = { ims: [] };
    for (let c = 0; c * 16 < W; c++) {
      const w = Math.min(16, W - c * 16);
      const im = this.scene.add.image(at.x + c * 16, at.y, key, `c${c}`).setOrigin(0, 0);
      im.setDepth(frontDepth(X0, Y0, X1, Y1, at.x + c * 16 + w / 2));
      group.ims.push(im); this.tallOf.set(im, group);
    }
    this.tall.add(group);
  }

  private fenceKey() {
    const key = `isoFence|${this.mapId}`;
    if (!this.scene.textures.exists(key)) {
      const f = buildFence(this.build!), tex = this.scene.textures.addCanvas(key, f.canvas)!;
      tex.customData = { ox: f.cx / f.canvas.width, oy: f.cy / f.canvas.height };
    }
    return { key, ...(this.scene.textures.get(key).customData as { ox: number; oy: number }) };
  }

  // ---------- Lớp phủ mép ----------
  /**
   * Lớp phủ mép phía `side` (0: +x, 1: −x, 2: +y, 3: −y) lấy từ ô `key` của loại lấn sang: dải răng cưa dọc cạnh thoi (ảnh ô liền
   * mép nên cùng điểm ảnh của ô bên là phần nối tiếp), viền bóng 1 pixel ở mép trong dải.
   */
  private edgeKey(key: string, c: [number, number], side: number, seed: number) {
    const out = `isoEdge|${key}|${side}|${seed}`; if (this.scene.textures.exists(out)) return out;
    const { cv, ctx, data } = this.pixels(key), d = data.data, w = cv.width, h = cv.height, src = d.slice();
    const r = rng(seed * 97 + side * 13 + 7), knots = Array.from({ length: 6 }, () => r());
    const depthAtP = (p: number) => { const f = ((p + 1) / 2) * 5, k = Math.floor(f), t = f - k; return 0.16 + 0.22 * (knots[k] * (1 - t) + knots[Math.min(5, k + 1)] * t); };
    const band = (x: number, y: number) => {
      const dx = (x + 0.5 - c[0]) / (TILE_W / 2), dy = (y + 0.5 - c[1]) / (TILE_H / 2), a = dx + dy, b = dy - dx;
      if (Math.abs(a) >= 1 || Math.abs(b) >= 1) return -1;
      const [u, v] = side === 0 ? [a, b] : side === 1 ? [-a, b] : side === 2 ? [b, a] : [-b, a];
      return u - (1 - depthAtP(v)); // > 0: trong dải
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, k = band(x, y);
      if (k > 0) continue;
      // Ngay trong ô mình sát mép dải: bóng mờ; còn lại trong suốt.
      const near = k > -0.13 && k !== -1;
      d[i] = near ? 26 : 0; d[i + 1] = near ? 16 : 0; d[i + 2] = near ? 32 : 0; d[i + 3] = near && src[i + 3] ? 70 : 0;
    }
    ctx.putImageData(data, 0, 0); this.scene.textures.addCanvas(out, cv);
    return out;
  }

  // ---------- Đường lùi vẽ code (bước 10.1) ----------
  /** Khung bao bản đồ trên màn hình (cho camera.setBounds), kèm lề trên cho khối cao ở hàng đầu. */
  bounds() {
    const c = [worldToScreen(0, 0), worldToScreen(this.MW * TILE, 0), worldToScreen(0, this.MH * TILE), worldToScreen(this.MW * TILE, this.MH * TILE)];
    const x0 = Math.min(...c.map((p) => p.x)), x1 = Math.max(...c.map((p) => p.x)), y0 = Math.min(...c.map((p) => p.y)), y1 = Math.max(...c.map((p) => p.y));
    const top = TOPDOWN ? 0 : this.rise;
    return { x: x0, y: y0 - top, w: x1 - x0, h: y1 - y0 + top };
  }

  /** Điểm ảnh (u, v) của ô `gid` trong tiles.png (gid = chỉ số ô + 1). */
  private texel(gid: number, u: number, v: number): RGBA {
    if (!this.src) return [0, 0, 0, 0];
    const i = gid - 1, sx = (i % this.src.cols) * TILE + u, sy = Math.floor(i / this.src.cols) * TILE + v, o = (sy * this.src.w + sx) * 4, d = this.src.d;
    return [d[o], d[o + 1], d[o + 2], d[o + 3]];
  }

  /**
   * Trải ảnh ô 16×16 lên hình thoi w × h (mặc định TILE_W × TILE_H, tỉ lệ 2:1) có góc trên ở (ox, oy) của bộ đệm (lấy mẫu gần nhất,
   * ô kề nhau khít không hở).
   */
  private diamond(b: Buf, gid: number, ox: number, oy: number, k = 1, w = TILE_W, h = TILE_H) {
    const hx = w / 2, sc = TILE / h;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hx, py = y + 0.5, u = (py + px / 2) * sc, v = (py - px / 2) * sc;
      if (u < 0 || v < 0 || u >= TILE || v >= TILE) continue;
      const c = this.texel(gid, Math.floor(u), Math.floor(v));
      b.set(ox + x, oy + y, k === 1 ? c : shade(c, k));
    }
  }

  /** Texture mặt đất vẽ code của ô `gid`: hình thoi (isometric) hoặc ô vuông phóng 2 (nhìn thẳng). */
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

  /** Texture vật vẽ code trên lớp `trees` và gốc (điểm chạm đất ở tâm ô). */
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
    const W = BASE_W, hx = W / 2, hy = BASE_H / 2, TH = BASE_H; // cỡ gốc, phóng OBJ_K khi đặt
    const r = rng(gid * 7919 + 13);
    if (o.k === "block") {
      // Khối hộp: mặt trên là ô hình thoi lấy từ ảnh ô `top`, hai mặt bên (trái sáng hơn, ánh sáng từ trên bên trái).
      const h = o.h, b = new Buf(W, TH + h), cy = hy + h;
      const side = o.side ? rgba(o.side) : shade(this.texel(o.top, 8, 8), 0.8);
      const L = shade(side, 0.92), R = shade(side, 0.7);
      b.poly([[0, hy], [hx, TH], [hx, TH + h], [0, hy + h]], (x, y) => (y >= hy + x / 2 + h - 2 ? shade(L, 0.75) : L));
      b.poly([[hx, TH], [W, hy], [W, hy + h], [hx, TH + h]], (x, y) => (y >= TH - (x - hx) / 2 + h - 2 ? shade(R, 0.75) : R));
      if (o.win) for (const [x0, face] of [[4, L], [hx + 4, R]] as [number, RGBA][]) {
        // Cửa sổ trên mỗi mặt bên: khung gỗ tối, kính xanh.
        const y0 = (x: number) => (x < hx ? hy + x / 2 : TH - (x - hx) / 2) + 12;
        b.poly([[x0, y0(x0)], [x0 + 8, y0(x0 + 8)], [x0 + 8, y0(x0 + 8) + 10], [x0, y0(x0) + 10]], rgba("#3a2a18"));
        b.poly([[x0 + 1, y0(x0 + 1) + 1], [x0 + 7, y0(x0 + 7) + 1], [x0 + 7, y0(x0 + 7) + 9], [x0 + 1, y0(x0 + 1) + 9]], face === L ? rgba("#7fb8d8") : rgba("#5a8aa8"));
      }
      this.diamond(b, o.top, 0, 0, 1, BASE_W, BASE_H);
      return { buf: b, oy: cy / b.h };
    }
    if (o.k === "tree" || o.k === "pine") {
      // Cây rộng hơn một ô (tán lấn sang ô bên), cao khoảng 1,7 lần hồn sư.
      const TW = 44, tx = TW / 2, H = BASE_RISE, b = new Buf(TW, H), cy = H - hy;
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

  // ---------- Mỗi khung hình ----------
  /**
   * Hiện đúng các ô trong tầm camera (tính lại khi camera đi quá nửa ô hoặc đổi cỡ / phóng), rồi làm mờ vật cao đang che điểm
   * `focus` (chân chính mình, tọa độ màn hình) mà đứng trước nó; nhà mờ cả khối.
   */
  update(cam: Phaser.Cameras.Scene2D.Camera, focus: { x: number; y: number } | null) {
    const v = cam.worldView, key = `${Math.floor(v.x / 16)}|${Math.floor(v.y / 16)}|${Math.round(v.width)}|${Math.round(v.height)}`;
    // Lề 2 ô: ô lớn gắn với ô góc trên của khối 2×2 nên phải tải cả khi chỉ ô kề của nó trong tầm nhìn.
    if (key !== this.viewKey) { this.viewKey = key; this.stream(v.x - 2 * TILE_W, v.y - 2 * TILE_H, v.right + 2 * TILE_W, v.bottom + this.rise + 2 * TILE_H); }
    if (TOPDOWN) return;
    if (this.hole && focus) this.hole.clear().fillStyle(0xffffff).fillEllipse(focus.x, focus.y - HOLE_H / 2 + 6, HOLE_W, HOLE_H);
    for (const g of this.tall) {
      const cover = !!focus && g.ims.some((im) => covers(im, focus));
      const a = cover ? (this.holeMask ? HOLE_ALPHA : FADE) : 1;
      for (const im of g.ims) {
        if (im.alpha !== a) im.setAlpha(a);
        if (this.holeMask && (im.mask === this.holeMask) !== cover) { if (cover) im.setMask(this.holeMask); else im.clearMask(); }
      }
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
      for (const im of ims) {
        im.setVisible(false); this.free.push(im);
        const g = this.tallOf.get(im); if (g) { this.tall.delete(g); this.tallOf.delete(im); }
      }
      this.live.delete(i);
    }
    for (const i of want) if (!this.live.has(i)) this.live.set(i, this.place(i));
  }

  private img(x: number, y: number, key: string) {
    const im = this.free.pop() ?? this.scene.add.image(0, 0, key);
    if (im.mask) im.clearMask();
    return im.setTexture(key).setPosition(x, y).setVisible(true).setAlpha(1).setScale(1).setFlipX(false);
  }

  /** Tạo các ảnh của ô `i`: mặt đất (ô thường / ô lớn / vẽ code), lớp phủ mép, rồi vật trên lớp `trees`. */
  private place(i: number): Phaser.GameObjects.Image[] {
    const tx = i % this.MW, ty = Math.floor(i / this.MW), cx = (tx + 0.5) * TILE, cy = (ty + 0.5) * TILE, s = worldToScreen(cx, cy);
    const out: Phaser.GameObjects.Image[] = [];
    const gid = this.ground[i], g = TOPDOWN ? null : this.groundDefs.get(gid);
    if (g) {
      const root = this.bigAt.get(i), h = hash(tx, ty);
      if (root === i) {
        // Ô lớn: tâm khối 2×2 là góc chung của bốn ô.
        const c = worldToScreen((tx + 1) * TILE, (ty + 1) * TILE), key = g.big[h % g.big.length], cb = g.def.cBig ?? [32, 37];
        const tex = this.scene.textures.get(key).getSourceImage();
        out.push(this.img(c.x, c.y, key).setOrigin(cb[0] / tex.width, cb[1] / tex.height).setFlipX(g.def.flip !== false && !!(h & 0x100))
          .setDepth(GROUND_DEPTH + c.y * 0.01));
      } else if (root === undefined) {
        const key = g.small[h % g.small.length], tex = this.scene.textures.get(key).getSourceImage();
        out.push(this.img(s.x, s.y, key).setOrigin(g.def.c[0] / tex.width, g.def.c[1] / tex.height).setFlipX(g.def.flip !== false && !!(h & 0x100))
          .setDepth(GROUND_DEPTH + s.y * 0.01));
      }
      // Lớp phủ mép: ô bên có thứ bậc cao hơn lấn sang ô này.
      const nb: [number, number, number][] = [[1, 0, 0], [-1, 0, 1], [0, 1, 2], [0, -1, 3]];
      for (const [dx, dy, side] of nb) {
        const X = tx + dx, Y = ty + dy;
        if (X < 0 || Y < 0 || X >= this.MW || Y >= this.MH) continue;
        const o = this.groundDefs.get(this.ground[Y * this.MW + X]);
        if (!o || o.def.edge <= g.def.edge) continue;
        const key = this.edgeKey(o.small[0], o.def.c, side, hash(X, Y, side) % 3), tex = this.scene.textures.get(key).getSourceImage();
        out.push(this.img(s.x, s.y, key).setOrigin(o.def.c[0] / tex.width, o.def.c[1] / tex.height).setDepth(EDGE_DEPTH));
      }
    } else if (gid > 0) out.push(this.img(s.x, s.y, this.groundKey(gid)).setOrigin(0.5, 0.5).setDepth(GROUND_DEPTH + (TOPDOWN ? 0 : s.y * 0.01)));
    const t = this.trees[i];
    if (t > 0 && !this.inHouse.has(i)) {
      const props = TOPDOWN ? null : this.propDefs.get(t);
      let im: Phaser.GameObjects.Image;
      if (props) {
        const h = hash(tx, ty, 1), p = props[h % props.length], tex = this.scene.textures.get(p.key).getSourceImage();
        im = this.img(s.x, s.y, p.key).setOrigin(p.def.foot[0] / tex.width, p.def.foot[1] / tex.height).setFlipX(p.def.flip !== false && !!(h & 0x100));
      } else if (!TOPDOWN && t === WALL && this.build) {
        const f = this.fenceKey(); im = this.img(s.x, s.y, f.key).setOrigin(f.ox, f.oy);
      } else {
        const o = this.objKey(t); im = this.img(s.x, s.y, o.key).setOrigin(0.5, o.oy).setScale(TOPDOWN ? 1 : OBJ_K);
      }
      // Nhìn thẳng: lớp `trees` nằm sát mặt đất như trước. Isometric: vật sắp lớp theo độ sâu của tâm ô.
      im.setDepth(TOPDOWN ? GROUND_DEPTH + 1 : depthAt(cx, cy));
      out.push(im);
      if (!TOPDOWN) { const g2: Tall = { ims: [im] }; this.tall.add(g2); this.tallOf.set(im, g2); }
    }
    const c = this.canopy[i];
    if (TOPDOWN && c > 0) out.push(this.img(s.x, s.y, this.objKey(c).key).setOrigin(0.5, 0.5).setDepth(99970));
    return out;
  }
}

/**
 * Ảnh `im` che hồn sư có chân `f` (tọa độ màn hình): chân nằm sau vật (độ sâu nhỏ hơn) và khung thân (rộng HOLE_W − 16, cao
 * HOLE_H − 8 trên chân) giao với khung ảnh.
 */
function covers(im: Phaser.GameObjects.Image, f: { x: number; y: number }) {
  if (!im.visible || im.depth <= f.y) return false;
  const w = im.displayWidth, h = im.displayHeight, left = im.x - w * im.originX, top = im.y - h * im.originY, hw = HOLE_W / 2 - 8;
  return f.x + hw > left && f.x - hw < left + w && f.y - HOLE_H + 8 < top + h && f.y > top;
}

/** Đa giác xấp xỉ elip tâm (x, y), bán trục rx, ry. */
function ellipse(x: number, y: number, rx: number, ry: number): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; out.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); }
  return out;
}
