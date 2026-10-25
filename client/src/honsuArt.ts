// Phụ thể võ hồn vẽ bằng code theo quy cách 5.11 của GAME_DESIGN.md (bước 2.2b). Hồn sư không còn vẽ ở đây (HL3 #572: chỉ còn LPC,
// lpcRig.ts). Module thuần (không phụ thuộc Phaser): vẽ từng khung vào bộ đệm pixel rồi xếp thành spritesheet đúng bố cục cố định
// (16 cột × 4 hàng). textures.ts biến các sheet này thành texture Phaser.
// - Phụ thể `vh_{id}_b` / `vh_{id}_f`: khung 48×48, chỉ cột 0–11 của hàng 0–2.
import { HS_ANIMS, DIRS, SHEET_COLS, VH_FRAME, GRAY_RAMP, type HsAnim } from "./sprites.ts";

/** Viền ngoài có màu (mục 5.11). Không nằm trong dải xám nên giữ nguyên khi hoán màu. */
export const OUT = "#1a1020";

type Paint = string | null;
type Pt = [number, number];

/** Bộ đệm pixel; (ox, oy) dời gốc tọa độ, để phụ thể 48×48 dùng chung tọa độ với khung thân 32×32. */
export class Buf {
  d: Paint[];
  constructor(public w: number, public h: number, public ox = 0, public oy = 0) { this.d = new Array(w * h).fill(null); }
  set(x: number, y: number, c: Paint) {
    x = Math.round(x) + this.ox; y = Math.round(y) + this.oy;
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
  }
  rect(x: number, y: number, w: number, h: number, c: Paint) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  clear(x: number, y: number, w = 1, h = 1) { this.rect(x, y, w, h, null); }
  /** Chép một khung vào sheet tại (dx, dy), bỏ qua ô trống. */
  paste(src: Buf, dx: number, dy: number) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const c = src.d[y * src.w + x]; if (c) this.d[(y + dy) * this.w + x + dx] = c;
    }
  }
}
function merge(...bs: Buf[]) {
  const r = new Buf(bs[0].w, bs[0].h, bs[0].ox, bs[0].oy);
  for (const b of bs) for (let i = 0; i < b.d.length; i++) if (b.d[i]) r.d[i] = b.d[i];
  return r;
}
/** Viền: ô trống kề (4 hướng) một ô có màu. Nằm trên ô trống → viền ngoài OUT; nằm trên lớp dưới → viền trong `inner`. */
function outline(b: Buf, under: Buf | null, inner?: string) {
  const add: [number, string][] = [];
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const i = y * b.w + x; if (b.d[i]) continue;
    const n = (x > 0 && b.d[i - 1]) || (x < b.w - 1 && b.d[i + 1]) || (y > 0 && b.d[i - b.w]) || (y < b.h - 1 && b.d[i + b.w]);
    if (!n) continue;
    const u = under ? under.d[i] : null;
    add.push([i, !u || u === OUT || !inner ? OUT : inner]);
  }
  for (const [i, c] of add) b.d[i] = c;
}
function line(b: Buf, x0: number, y0: number, x1: number, y1: number, c: Paint | ((t: number) => Paint), size = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) {
    const col = typeof c === "function" ? c(i / n) : c;
    if (col) b.rect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), size, size, col);
  }
}
function disc(b: Buf, cx: number, cy: number, r: number, c: Paint | ((dx: number, dy: number) => Paint)) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    if (dx * dx + dy * dy <= r * r) { const col = typeof c === "function" ? c(dx, dy) : c; if (col) b.set(x, y, col); }
  }
}
function poly(b: Buf, pts: Pt[], c: Paint | ((x: number, y: number) => Paint)) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
    const px = x + 0.5, py = y + 0.5; let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) { const col = typeof c === "function" ? c(x, y) : c; if (col) b.set(x, y, col); }
  }
}
/** Ống tròn chạy theo đường gấp khúc, bán kính đổi dần từ r0 tới r1. */
function tube(b: Buf, pts: Pt[], r0: number, r1: number, c: Paint | ((t: number, dx: number, dy: number) => Paint)) {
  const seg: number[] = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const n = Math.max(1, Math.ceil(seg[i - 1] * 2));
    for (let k = 0; k <= n; k++) {
      const t = (acc + seg[i - 1] * k / n) / total;
      const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k / n, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k / n;
      disc(b, x, y, r0 + (r1 - r0) * t, typeof c === "function" ? (dx, dy) => c(t, dx, dy) : c);
    }
    acc += seg[i - 1];
  }
}
const hexRgb = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const rgbHex = (v: number[]) => "#" + v.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
const mix = (a: string, b: string, t: number) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * t)); };
interface Shade { d: string; b: string; l: string }
/** 3 sắc độ suy ra từ một màu võ hồn (mục 5.11 cho phép 1 sắc tối + 1 sắc sáng): tối, gốc, sáng. */
const shade = (c: string): Shade => ({ d: mix(c, OUT, 0.4), b: c, l: mix(c, "#ffffff", 0.45) });

/** Vẽ bộ đệm ra canvas; `swap` là dải màu thay cho dải `from` (mặc định dải xám chuẩn của tóc / áo; thân thì dải da tông 0). */
export function bufCanvas(buf: Buf, swap?: readonly string[], from: readonly string[] = GRAY_RAMP) {
  const cv = document.createElement("canvas"); cv.width = buf.w; cv.height = buf.h;
  const ctx = cv.getContext("2d")!, img = ctx.createImageData(buf.w, buf.h);
  const map = swap ? new Map(from.map((g, i) => [g, swap[i]])) : null;
  for (let i = 0; i < buf.d.length; i++) {
    let c = buf.d[i]; if (!c) continue;
    if (map?.has(c)) c = map.get(c)!;
    const [r, g, b] = hexRgb(c); img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ---------- Hồn sư: tư thế từng khung ----------
export type Sex = "m" | "f";
type Dir3 = (typeof DIRS)[number];
interface Hand { x: number; y: number; behind?: boolean }
type Xf = { type: "shear"; k: number; dy?: number } | { type: "rot"; cw: boolean };
interface Pose {
  dir: Dir3; anim: HsAnim; i: number; bob: number; headX: number; legs: "stand" | "sit" | "kneel"; step: number;
  eyes: "open" | "closed" | "hurt"; xf: Xf | null; glow: boolean;
  /** Vai tay phải (main) và tay trái (off) của nhân vật; main/off là vị trí bàn tay. */
  sm: Pt; so: Pt; main: Hand; off: Hand;
}

/** Khung số f (theo bố cục cố định) ứng với hướng, animation và khung thứ mấy; null nếu ô trống. */
function frameInfo(f: number): { dir: Dir3; anim: HsAnim; i: number } | null {
  const row = Math.floor(f / SHEET_COLS), col = f % SHEET_COLS;
  if (row === 3) return col <= 1 ? { dir: "down", anim: "absorb", i: col } : null;
  for (const [a, d] of Object.entries(HS_ANIMS) as [HsAnim, (typeof HS_ANIMS)[HsAnim]][])
    if (a !== "absorb" && col >= d.col && col < d.col + d.ms.length) return { dir: DIRS[row], anim: a, i: col - d.col };
  return null;
}

/** Tư thế: bob = độ nhún thân trên; tay main = tay phải nhân vật, off = tay trái. Tọa độ khung 32×32. */
function pose(dir: Dir3, anim: HsAnim, i: number): Pose {
  const P: Pose = dir === "down" ? { sm: [9, 18], so: [21, 18], main: { x: 9, y: 23 }, off: { x: 21, y: 23 } } as Pose
    : dir === "up" ? { sm: [21, 18], so: [9, 18], main: { x: 21, y: 23 }, off: { x: 9, y: 23 } } as Pose
    : { sm: [15, 18], so: [13, 18], main: { x: 15, y: 22 }, off: { x: 13, y: 22, behind: true } } as Pose;
  Object.assign(P, { dir, anim, i, bob: 0, headX: 0, legs: "stand", step: 0, eyes: "open", xf: null, glow: false });
  const H = (h: "main" | "off", x: number, y: number, behind = false) => { P[h] = { x, y, behind }; };
  const side = dir === "right", down = dir === "down";
  switch (anim) {
    case "idle": if (i === 1) P.bob = 1; break; // thở: đầu và vai nhích 1 pixel
    case "walk":
      if (i === 1 || i === 3) P.bob = 1; // nhún 1 pixel ở khung đứng giữa
      if (i === 0 || i === 2) {
        P.step = i === 0 ? 1 : -1;
        if (side) { H("main", 15 + 2 * P.step, 22); H("off", 13 - 2 * P.step, 22, true); }
        else { P.main.y -= P.step > 0 ? 1 : 0; P.off.y -= P.step < 0 ? 1 : 0; }
      }
      break;
    case "attack":
      if (down) [() => H("main", 7, 14), () => H("main", 11, 24), () => H("main", 9, 22)][i]();
      else if (side) [() => { H("main", 11, 15); P.headX = -1; }, () => { H("main", 21, 20); P.headX = 1; }, () => H("main", 18, 21)][i]();
      else [() => H("main", 23, 14), () => H("main", 18, 21, true), () => H("main", 21, 22)][i]();
      break;
    case "cast":
      if (down) [() => H("main", 7, 12), () => { H("main", 7, 11); H("off", 23, 11); }, () => { H("main", 9, 19); H("off", 21, 19); }][i]();
      else if (side) [() => H("main", 17, 12), () => { H("main", 18, 11); H("off", 13, 12, true); }, () => H("main", 20, 18)][i]();
      else [() => H("main", 23, 12), () => { H("main", 23, 11); H("off", 7, 11); }, () => { H("main", 19, 19, true); H("off", 11, 19, true); }][i]();
      if (i === 1) P.glow = true;
      break;
    case "hurt":
      P.eyes = "hurt";
      if (side) { P.xf = { type: "shear", k: -0.12 }; H("main", 12, 20); }
      else { P.bob = -1; H("main", down ? 7 : 23, 19); H("off", down ? 23 : 7, 19); }
      break;
    case "die":
      P.eyes = "closed";
      if (i < 2) { P.legs = "kneel"; P.bob = 3; P.main.y = 23; P.off.y = 23; }
      if (i === 1) P.xf = { type: "shear", k: down ? -0.5 : 0.5, dy: 2 };
      if (i === 2) P.xf = { type: "rot", cw: !down };
      break;
    case "absorb":
      P.legs = "sit"; P.eyes = "closed"; P.bob = 5 + i;
      H("main", 8, 21); H("off", 22, 21);
      break;
  }
  P.sm = [P.sm[0], P.sm[1] + P.bob]; P.so = [P.so[0], P.so[1] + P.bob];
  P.main.y += P.bob; P.off.y += P.bob;
  if (P.legs === "sit" || P.legs === "kneel") { P.main.y = Math.min(P.main.y, 27); P.off.y = Math.min(P.off.y, 27); }
  return P;
}

// ---------- Phụ thể võ hồn (48×48, tọa độ dùng chung với khung thân: thân (x, y) = phụ thể (x + 8, y + 8)) ----------
type AnimAngles = Partial<Record<HsAnim, number[]>>;
/** Góc cầm vũ khí (độ, 0 = sang phải, 90 = xuống) theo hướng / animation / khung. */
const WANG: Record<Dir3, AnimAngles> = {
  down: { idle: [110, 110], walk: [110, 104, 110, 116], attack: [-110, 40, 100], cast: [-95, -95, 70] },
  right: { idle: [62, 62], walk: [56, 62, 68, 62], attack: [-140, 8, 50], cast: [-80, -80, 15] },
  up: { idle: [70, 70], walk: [64, 70, 76, 70], attack: [-80, -60, 80], cast: [-90, -90, -90] },
};
/** Góc búa của Hạo Thiên Chùy (vác trên vai). */
const HAMMER: Record<Dir3, AnimAngles> = {
  down: { idle: [-115, -115], walk: [-115, -112, -115, -118], attack: [-90, 95, 140], cast: [-115, -115, -115] },
  right: { idle: [-70, -70], walk: [-68, -70, -72, -70], attack: [-150, 30, 70], cast: [-70, -70, -70] },
  up: { idle: [-70, -70], walk: [-70, -70, -70, -70], attack: [-90, -90, 60], cast: [-70, -70, -70] },
};
/** Góc trường thương của Phá Hồn Thương (8.3): dựng đứng khi đứng / đi (mũi vượt quá đầu), đâm thẳng ra trước khi đánh. */
const SPEAR: Record<Dir3, AnimAngles> = {
  down: { idle: [-100, -100], walk: [-100, -97, -100, -103], attack: [-100, 75, 90], cast: [-95, -95, -100] },
  right: { idle: [-80, -80], walk: [-80, -77, -80, -83], attack: [-110, 0, 5], cast: [-85, -85, -90] },
  up: { idle: [-80, -80], walk: [-80, -77, -80, -83], attack: [-80, -90, -90], cast: [-85, -85, -90] },
};
/** Nhịp vỗ cánh / vẫy đuôi. */
const FLAP: Partial<Record<HsAnim, number[]>> = { idle: [0, 1], walk: [0, 1, 2, 1], attack: [2, 0, 1], cast: [2, 2, 0] };
const dither = (c: string) => (x: number, y: number) => ((x + y) & 1 ? null : c);
interface VhLayers { back: Buf; front: Buf; backFx: Buf; frontFx: Buf }

/** Vẽ phụ thể một khung vào 4 lớp: sau thân / trước thân, mỗi bên có lớp hiệu ứng không viền. */
function drawVohon(v: { id: string; col: string; robe: string }, P: Pose, L: VhLayers) {
  const C = shade(v.col), R = shade(v.robe);
  const up = P.dir === "up", side = P.dir === "right", down = P.dir === "down";
  // Quay lưng (hướng lên) thì phần sau lưng (cánh, đuôi) nằm ở nửa trước, vũ khí nằm ở nửa sau.
  const BK = up ? L.front : L.back, BKfx = up ? L.frontFx : L.backFx;
  const handLayer = (h: Hand, fx = false) => (h.behind || up ? (fx ? L.backFx : L.back) : fx ? L.frontFx : L.front);
  const HM = handLayer(P.main), HMfx = handLayer(P.main, true), HO = handLayer(P.off), HOfx = handLayer(P.off, true);
  const bob = P.bob, ph = HS_ANIMS[P.anim].col + P.i;
  const hm = { x: P.main.x + 1, y: P.main.y + 1 }, ho = { x: P.off.x + 1, y: P.off.y + 1 };
  const ang = WANG[P.dir][P.anim]?.[P.i] ?? 90, ur = ang * Math.PI / 180, u: Pt = [Math.cos(ur), Math.sin(ur)];
  const flap = FLAP[P.anim]?.[P.i] ?? 0;
  const orbit = (b0: Buf, b1: Buf, cx: number, cy: number, rx: number, ry: number, a: number, fn: (b: Buf, x: number, y: number) => void) => {
    const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; fn(Math.sin(a) < 0 ? b0 : b1, x, y);
  };
  // ----- các khối dùng lại -----
  const blade = (b: Buf, h: { x: number; y: number }, uu: Pt, len: number, colB: string, colL: string, hilt: Shade, guard = 3) => {
    const nn = [-uu[1], uu[0]];
    for (let t = -2; t <= len; t += 0.5) {
      const x = h.x + uu[0] * t, y = h.y + uu[1] * t;
      if (t < 0) b.set(x, y, hilt.d);
      else if (t < 1) for (let k = -Math.floor(guard / 2); k <= Math.floor(guard / 2); k++) b.set(x + nn[0] * k, y + nn[1] * k, hilt.b);
      else { b.set(x, y, colB); if (t < len - 1) b.set(x + nn[0], y + nn[1], colL); }
    }
  };
  const wings = (b: Buf, c1: Shade, c2: Shade, feather: boolean) => {
    const y0 = 14 + bob, f = flap * 2;
    if (side) {
      const rx = 12, pts: Pt[] = [[rx + 2, y0], [rx - 4, y0 - 9 + f], [rx - 11, y0 - 11 + f], [rx - 14, y0 - 6 + f], [rx - 12, y0 + 2], [rx - 9, y0 + 8 - f / 2], [rx - 4, y0 + 9 - f / 2], [rx + 1, y0 + 6]];
      poly(b, pts, (x, y) => { if (y < y0 - 7 + f) return c1.l; if (feather && Math.round(rx - x) % 3 === 0 && y > y0) return c2.b; return y > y0 + 4 ? c1.d : c1.b; });
      return;
    }
    for (const sx of [-1, 1]) {
      const rx = 16 + sx * 3;
      const pts: Pt[] = [[rx, y0], [rx + sx * 6, y0 - 8 + f], [rx + sx * 13, y0 - 10 + f], [rx + sx * 16, y0 - 5 + f], [rx + sx * 14, y0 + 2], [rx + sx * 11, y0 + 8 - f / 2], [rx + sx * 6, y0 + 10 - f / 2], [rx + sx * 1, y0 + 6]];
      poly(b, pts, (x, y) => { const dd = Math.abs(x + 0.5 - rx); if (y < y0 - 6 + f) return c1.l; if (feather && Math.round(dd) % 3 === 0 && y > y0) return c2.b; return y > y0 + 4 ? c1.d : c1.b; });
    }
  };
  const ears = (b: Buf, c: { b: string; d: string }, inner: string, tall = 0) => {
    const Y = 6 + bob, h = tall || 5;
    if (side) { poly(b, [[13, Y + 1], [14 - (tall ? 3 : 0), Y - h], [17, Y + 1]], c.b); poly(b, [[14, Y], [14.5 - (tall ? 3 : 0), Y - h + 2], [16, Y]], inner); return; }
    for (const sx of [-1, 1]) {
      const bx = 16 + sx * 4.5;
      poly(b, [[bx - 2.5, Y + 1], [bx + sx * (tall ? 1 : 1.5), Y - h], [bx + 2.5, Y + 1]], up ? c.d : c.b);
      if (!up) poly(b, [[bx - 1.2, Y], [bx + sx * (tall ? 1 : 1.2), Y - h + 2], [bx + 1.2, Y]], inner);
    }
  };
  const tail = (b: Buf, pts: Pt[], r0: number, r1: number, c: Shade, tip?: string) => tube(b, pts, r0, r1, (t) => (t > 0.9 && tip ? tip : t < 0.25 ? c.d : c.b));
  const claws = (b: Buf, h: Hand, c: Shade, toward: Pt) => {
    const dx = Math.sign(toward[0]) || 0, dy = Math.sign(toward[1]) || 1;
    for (let k = 0; k < 3; k++) b.set(h.x - 1 + k * (dy ? 1 : 0), h.y + 1 + (dy > 0 ? 1 : -1) * (k === 1 ? 2 : 1), c.l);
    if (dx) b.set(h.x + dx * 2, h.y, c.l);
  };
  const handDir = (S: Pt, h: Hand): Pt => [h.x - S[0], h.y - S[1]];
  const smoke = (b: Buf, x0: number, y0: number, w: number, h: number, c: string) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x * 7 + y * 3 + ph * 5) % 9 === 0) b.set(x0 + x, y0 + y, c);
  };

  switch (v.id) {
    case "cuu_tinh_that_sat_kiem": {
      blade(HM, hm, u, 13, C.b, C.l, R);
      for (const t of [5, 8, 11]) HM.set(hm.x + u[0] * t, hm.y + u[1] * t, "#ffffff");
      if (P.glow) for (let k = 0; k < 3; k++) orbit(L.back, L.front, 16, 18 + bob, 14, 6, ph * 0.6 + k * 2.1, (b, x, y) => { b.rect(x, y - 3, 1, 4, C.l); b.set(x, y + 1, R.b); b.set(x - 1, y + 1, R.b); b.set(x + 1, y + 1, R.b); });
      break;
    }
    case "lam_dien_ba_vuong_long": {
      for (const [h, S, b] of [[P.main, P.sm, HM], [P.off, P.so, HO]] as [Hand, Pt, Buf][]) {
        const dx = Math.sign(h.x - S[0]), dy = Math.sign(h.y - S[1]);
        b.rect(h.x - 1, h.y - 2 * dy, 3, 3, R.b); b.set(h.x, h.y - 2 * dy, C.b); b.set(h.x - 1, h.y - dy, C.l);
        b.set(h.x - 1 + (dx > 0 ? 3 : 0), h.y + 2, C.l); b.set(h.x + 1, h.y + 2 * (dy || 1) + 1, C.l);
      }
      const hy = 4 + bob;
      if (!side) poly(BKfx, [[7, hy + 6], [9, hy - 2], [12, hy - 6], [14, hy - 1], [18, hy - 1], [20, hy - 6], [23, hy - 2], [25, hy + 6], [22, hy + 12], [10, hy + 12]], dither(C.b));
      else poly(BKfx, [[2, hy + 8], [4, hy], [8, hy - 5], [9, hy + 1], [13, hy + 3], [12, hy + 12], [4, hy + 12]], dither(C.b));
      if (!side) { BKfx.set(11, hy + 3, C.l); BKfx.set(21, hy + 3, C.l); }
      const fx = P.anim === "attack" && P.i === 1 ? 6 : 2;
      for (let k = 0; k < fx; k++) HMfx.set(hm.x + ((k * 5 + ph) % 5) - 2, hm.y - 4 + ((k * 3 + ph) % 7), k % 2 ? "#ffffff" : C.l);
      break;
    }
    case "ky_nhung_thong_thien_cuc": {
      const cx = side ? 11 : 16, cy = (side ? 13 : 11) + bob, rr = side ? 8 : 10;
      disc(BK, cx, cy, rr, (dx, dy) => {
        const a = Math.atan2(dy, dx), r = Math.hypot(dx, dy), k = Math.round(a / (Math.PI / 6));
        const off = Math.abs(a - k * Math.PI / 6) * r;
        if (r < 3) return (Math.round(dx) + Math.round(dy)) & 1 ? R.b : R.l;
        if (off > 1.4 + r * 0.08) return null;
        return r > rr - 2 ? C.l : k & 1 ? C.d : C.b;
      });
      for (let k = 0; k < 3; k++) orbit(L.backFx, L.frontFx, 16, 21 + bob, 13, 5, ph * 0.7 + k * 2.1, (b, x, y) => { b.set(x, y, C.l); b.set(x + 1, y, C.b); });
      break;
    }
    case "ta_hoa_phuong_hoang": {
      wings(BK, C, R, true);
      for (let k = 0; k < 3; k++) BKfx.set(4 + ((k * 11 + ph * 3) % 24), 2 + bob + ((k * 5 + ph * 2) % 6), k % 2 ? "#ffe066" : C.l);
      break;
    }
    case "u_minh_linh_mieu": {
      ears(L.front, R, C.b);
      const ty = 24 + bob;
      if (side) tail(BK, [[12, ty], [7, ty - 2], [5, ty - 7], [6, ty - 11 + flap]], 1.2, 1, R, C.b);
      else tail(BK, [[up ? 16 : 18, ty], [24, ty - 2], [26, ty - 7], [25, ty - 11 + flap]], 1.2, 1, R, C.b);
      claws(HM, P.main, C, handDir(P.sm, P.main)); claws(HO, P.off, C, handDir(P.so, P.off));
      if (P.anim === "attack" && P.i === 1) for (let k = 0; k < 3; k++) line(HMfx, hm.x - 3 + k * 2, hm.y - 4, hm.x + k * 2, hm.y + 2, C.l);
      break;
    }
    case "nguyet_nhan": {
      const cres = (b: Buf, h: { x: number; y: number }, uu: Pt) => {
        const cx = h.x + uu[0] * 4, cy = h.y + uu[1] * 4;
        disc(b, cx, cy, 4.6, (dx, dy) => {
          const r = Math.hypot(dx, dy), dot = (dx * uu[0] + dy * uu[1]) / (r || 1);
          if (r < 3 || dot < -0.3) return null;
          return r > 4 ? C.l : dot > 0.6 ? C.b : R.b;
        });
        b.set(h.x, h.y, R.b);
      };
      cres(HM, hm, u); const ao = Math.PI - ur; cres(HO, ho, [Math.cos(ao), Math.sin(ao)]);
      break;
    }
    case "hoa_long": {
      const cy = 21 + bob, segs = 26;
      for (let k = 0; k < segs; k++) {
        const s = k / segs, a = s * Math.PI * 2.3 + 0.6 + ph * 0.15, x = 16 + Math.cos(a) * 11, y = cy + Math.sin(a) * 4 - s * 9;
        disc(Math.sin(a) < 0 ? L.back : L.front, x, y, 1.6 - s * 0.6, s > 0.5 ? C.b : R.b);
      }
      const hx = P.sm[0] + (down ? -1 : 1), hy = P.sm[1] - 3;
      poly(L.front, [[hx - 2, hy], [hx + 3, hy - 1], [hx + 5, hy + 1], [hx + 3, hy + 3], [hx - 2, hy + 3]], C.b);
      L.front.set(hx + 2, hy, "#ffe066"); L.front.set(hx - 1, hy - 1, R.b); L.front.set(hx, hy - 2, R.b);
      for (let k = 0; k < 3; k++) L.frontFx.set(6 + ((k * 9 + ph * 4) % 20), 8 + bob + ((k * 7 + ph) % 12), C.l);
      break;
    }
    case "nhu_cot_tho": {
      ears(L.front, { b: C.l, d: C.b }, C.b, 9);
      const ty = 24 + bob;
      disc(BK, side ? 11 : up ? 16 : 20, ty, 2, "#ffffff");
      for (let y = 26; y <= 31; y++) for (let x = 9; x <= 22; x++) if ((x + y + ph) % 3 === 0 && (y >= 28 || x < 12 || x > 19)) L.frontFx.set(x, y, (x + ph) % 2 ? C.l : C.b);
      break;
    }
    case "kim_vu_mieu_ung": {
      wings(BK, C, R, true);
      claws(HM, P.main, C, handDir(P.sm, P.main)); claws(HO, P.off, C, handDir(P.so, P.off));
      for (let k = 0; k < 2; k++) BKfx.set((side ? 0 : k ? 30 : 1) + ((ph + k) % 3), 6 + bob + ((ph * 3 + k * 4) % 8), "#fff27a");
      break;
    }
    case "tu_vong_chu_hoang": {
      const legC = (t: number) => (t > 0.85 ? C.l : t > 0.4 ? C.b : R.b);
      const wig = flap - 1;
      if (side) for (let k = 0; k < 4; k++) {
        const ky = 16 + bob, knee: Pt = [2 - k * 2, 2 + bob + k * 4 - wig], tip: Pt = [-3 - k, 12 + bob + k * 5];
        line(BK, 12, ky, knee[0], knee[1], legC, 2); line(BK, knee[0], knee[1], tip[0], tip[1], (t) => legC(0.5 + t / 2), 1);
      }
      else for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) {
        const root: Pt = [16 + sx * 3, 17 + bob], knee: Pt = [16 + sx * (11 + 3 * k), 5 + bob + 6 * k + wig * sx], tip: Pt = [16 + sx * (15 + 2 * k), 15 + bob + 8 * k];
        line(BK, root[0], root[1], knee[0], knee[1], legC, 2); line(BK, knee[0], knee[1], tip[0], tip[1], (t) => legC(0.5 + t / 2), 1);
      }
      smoke(L.backFx, 6, 27, 20, 5, C.d);
      break;
    }
    case "bich_lan_xa_hoang": {
      const S = P.sm, h = P.main, n2 = Math.max(Math.abs(h.x - S[0]), Math.abs(h.y - S[1]), 1);
      for (let k = 0; k <= n2; k++) {
        const x = S[0] + (h.x - S[0]) * k / n2, y = S[1] + (h.y - S[1]) * k / n2;
        HM.set(x + (k % 2 ? 2 : -1), y + 1, k % 2 ? C.b : R.b); HM.set(x + (k % 2 ? 2 : -1), y, C.b);
      }
      const hx = S[0] + (down ? -2 : 1), hy = S[1] - 4;
      L.front.rect(hx, hy, 3, 2, C.b); L.front.set(hx, hy + 2, C.b); L.front.set(hx, hy + 3, R.b); L.front.set(hx + 1, hy, "#fff27a"); L.front.set(hx + 3, hy + 1, "#a8303a");
      smoke(L.backFx, 4, 27, 24, 5, C.b);
      break;
    }
    case "can_khon_hon_nguyen_toa": {
      const cy = 22 + bob, nlink = 40;
      for (let k = 0; k < nlink; k++) {
        const a = k / nlink * Math.PI * 2, b = Math.sin(a) < 0 ? L.back : L.front;
        b.set(16 + Math.cos(a) * 13, cy + Math.sin(a) * 4, (k + ph) % 3 === 0 ? R.b : (k + ph) % 3 === 1 ? C.b : C.l);
      }
      orbit(L.back, L.front, 16, cy, 13, 4, Math.PI / 2 + ph * 0.35, (b, x, y) => { b.rect(x - 1, y, 3, 3, C.b); b.set(x, y - 1, C.l); b.set(x, y + 1, R.d); });
      if (P.glow) for (let k = 0; k < 6; k++) L.frontFx.set(16 + Math.cos(k) * 15, cy - 6 + Math.sin(k * 2) * 6, C.l);
      break;
    }
    case "hoa_anh": {
      const gy = bob ? 1 : 0;
      disc(BKfx, side ? 11 : 16, 9 + gy, 7, dither(C.b));
      poly(BKfx, side ? [[5, 16 + gy], [17, 16 + gy], [18, 29], [4, 29]] : [[7, 16 + gy], [25, 16 + gy], [26, 29], [6, 29]], dither(C.d));
      for (let k = 0; k < 5; k++) BKfx.set((side ? 5 : 8) + k * 3 + ((ph + k) % 2), 2 + gy - (k % 2), C.l);
      for (const [h, b] of [[P.main, HMfx], [P.off, HOfx]] as [Hand, Buf][]) {
        b.rect(h.x, h.y - 1, 2, 1, C.b); b.set(h.x + (ph % 2), h.y - 2, C.l); b.set(h.x - 1, h.y, C.b); b.set(h.x + 2, h.y + 1, "#ffe066");
      }
      break;
    }
    case "yeu_ho": {
      ears(L.front, C, "#ffffff", 6);
      const ty = 23 + bob, ends: Pt[] = side ? [[0, 13], [2, 7], [7, 4]] : [[5, 11 + flap], [16, 6], [27, 11 + flap]];
      const rx = side ? 12 : 16;
      for (const [ex, ey] of ends) tail(BK, [[rx, ty], [(ex + rx) / 2, (ey + ty) / 2 + 3], [ex, ey + bob]], 1.4, 2, C, "#ffffff");
      if (ph % 2) L.frontFx.set(side ? 22 : 26, 12 + bob, C.l);
      break;
    }
    case "xuc_xich": {
      tube(HM, [[hm.x, hm.y], [hm.x + u[0] * 6, hm.y + u[1] * 6]], 1.5, 1.5, (t, _dx, dy) => (t < 0.12 || t > 0.9 ? R.b : dy < -0.5 ? C.l : Math.round(t * 6) % 2 && dy > 0 ? R.b : C.b));
      const bb = ph % 2;
      for (const [x, y] of [[3, 7 + bb], [27, 9 - bb]]) tube(L.front, [[x, y + bob], [x + 3, y + bob]], 1, 1, (_t, _dx, dy) => (dy < 0 ? C.l : C.b));
      smoke(HMfx, hm.x - 2, hm.y - 7, 5, 5, "#ffffff");
      break;
    }
    case "quy_mi": {
      poly(BKfx, side ? [[10, -3 + bob], [17, 4 + bob], [17, 22], [12, 30], [4, 30], [2, 20], [4, 4 + bob]] : [[16, -3 + bob], [24, 5 + bob], [26, 20], [22, 30], [10, 30], [6, 20], [8, 5 + bob]], dither(C.b));
      if (!side) { BKfx.set(13, 5 + bob, C.l); BKfx.set(19, 5 + bob, C.l); BKfx.set(13, 6 + bob, C.l); BKfx.set(19, 6 + bob, C.l); }
      smoke(L.frontFx, 4, 18, 24, 13, R.l); smoke(L.backFx, 2, 8, 28, 22, R.b);
      break;
    }
    case "thien_can_bach_ngoc_dinh": {
      const cx = hm.x, cy = hm.y - 6 - (ph % 2);
      HM.rect(cx - 3, cy - 1, 7, 4, C.b); HM.rect(cx - 4, cy - 2, 9, 1, C.l); HM.rect(cx - 2, cy, 3, 1, C.l); HM.rect(cx - 3, cy + 2, 7, 1, C.d);
      HM.set(cx - 2, cy + 3, R.b); HM.set(cx, cy + 3, R.b); HM.set(cx + 2, cy + 3, R.b); HM.set(cx - 4, cy - 3, R.b); HM.set(cx + 4, cy - 3, R.b);
      smoke(HMfx, cx - 3, cy - 9, 7, 6, "#ffffff");
      break;
    }
    case "lam_ngan_thao": {
      for (const [S, h, b] of [[P.sm, P.main, HMfx], [P.so, P.off, HOfx]] as [Pt, Hand, Buf][]) {
        const nn = Math.max(Math.abs(h.x - S[0]), Math.abs(h.y - S[1]), 1);
        for (let k = 0; k <= nn; k++) {
          const x = S[0] + (h.x - S[0]) * k / nn, y = S[1] + (h.y - S[1]) * k / nn;
          b.set(x + ((k + ph) % 3 === 0 ? 0 : 1), y, k % 3 ? R.b : C.b); if (k % 3 === 1) b.set(x + 2, y, C.l);
        }
      }
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2 + 0.3 + ph * 0.05, r = 7 + (k % 3) * 2.5, x = 16 + Math.cos(a) * r, y = 30 + Math.sin(a) * 3;
        const b = y < 30 ? L.backFx : L.frontFx, ex = x + Math.cos(a + 0.6) * 4, ey = y + Math.sin(a + 0.6) * 1.5;
        line(b, x, y, ex, ey, k % 2 ? C.b : C.d); b.set(ex, ey - 1, C.l);
      }
      for (let k = 0; k < 3; k++) L.frontFx.set(5 + ((k * 9 + ph * 3) % 22), 22 + ((k * 5 + ph) % 7), C.l);
      break;
    }
    case "hao_thien_chuy": {
      const a = (HAMMER[P.dir][P.anim]?.[P.i] ?? -90) * Math.PI / 180, uu: Pt = [Math.cos(a), Math.sin(a)], nn = [-uu[1], uu[0]];
      for (let t = -2; t <= 10; t += 0.5) {
        HM.set(hm.x + uu[0] * t, hm.y + uu[1] * t, t < 0 ? R.b : "#5a3b22");
        HM.set(hm.x + uu[0] * t + nn[0], hm.y + uu[1] * t + nn[1], t < 0 ? R.b : "#3a2a18");
      }
      for (let t = 9; t <= 19; t += 0.5) for (let s = -6; s <= 6; s += 0.5) {
        const x = hm.x + uu[0] * t + nn[0] * s, y = hm.y + uu[1] * t + nn[1] * s;
        const edge = t < 9.6 || t > 18.4 || Math.abs(s) > 5.4;
        const vein = Math.abs(Math.round(s * 0.8 + t * 0.4)) % 5 === 0 && Math.abs(s) < 4.5 && t > 10.5 && t < 17.5;
        HM.set(x, y, edge ? C.b : vein ? C.l : R.b);
      }
      if (P.anim === "attack" && P.i === 1) {
        for (let k = 0; k < 6; k++) HMfx.set(hm.x + uu[0] * 15 + (k - 3) * 2, 31 + (k % 2), k % 2 ? "#c9a46a" : "#957d57");
        line(L.backFx, hm.x + uu[0] * 15 - 7, 31, hm.x + uu[0] * 15 + 7, 32, OUT);
      }
      break;
    }
    case "cuu_bao_luu_ly_thap": {
      const cx = hm.x, by = hm.y - 3 - (ph % 2), widths = [7, 7, 5, 5, 5, 3, 3, 3, 1];
      widths.forEach((w, k) => HM.rect(cx - (w >> 1), by - k, w, 1, k % 2 ? R.b : k === 0 ? C.b : C.l));
      HM.set(cx, by - 9, "#ffffff"); HM.set(cx, by - 10, C.l);
      const rainbow = ["#ff3030", "#ff6a2a", "#ffe066", "#5a9440", "#5a9cc9", "#2d6a96", "#8a6bff"];
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2 + ph * 0.3; HMfx.set(cx + Math.cos(a) * 7, by - 4 + Math.sin(a) * 6, rainbow[k % 7]); }
      break;
    }
    // ---- Bước 8.3 ----
    case "pha_hon_thuong": {
      // Trường thương: cán dài sáng màu robe, mũi thương hình thoi màu col, tua đỏ dưới mũi; hồn quang mờ bám mũi thương.
      const a = (SPEAR[P.dir][P.anim]?.[P.i] ?? -90) * Math.PI / 180, uu: Pt = [Math.cos(a), Math.sin(a)], nn: Pt = [-uu[1], uu[0]], tip = 20;
      for (let t = -7; t <= tip - 4; t += 0.5) HM.set(hm.x + uu[0] * t, hm.y + uu[1] * t, Math.round(t) % 5 === 0 ? R.b : R.l);
      for (let t = tip - 4; t <= tip + 2; t += 0.5) {
        const w = t < tip - 1 ? (t - tip + 4) * 0.6 : (tip + 2 - t) * 0.6;
        for (let s = -w; s <= w; s += 0.5) HM.set(hm.x + uu[0] * t + nn[0] * s, hm.y + uu[1] * t + nn[1] * s, s < 0 ? C.l : C.b);
      }
      for (const k of [-1, 1]) HM.set(hm.x + uu[0] * (tip - 5) + nn[0] * k, hm.y + uu[1] * (tip - 5) + nn[1] * k, "#a8303a");
      HM.set(hm.x + uu[0] * (tip - 6) + nn[0] * 1.5, hm.y + uu[1] * (tip - 6) + nn[1] * 1.5, "#a8303a");
      for (let k = 0; k < 3; k++) HMfx.set(hm.x + uu[0] * (tip + 3 + k) + nn[0] * ((ph + k) % 3 - 1), hm.y + uu[1] * (tip + 3 + k) + nn[1] * ((ph + k) % 3 - 1), k % 2 ? "#ffffff" : C.l);
      if (P.anim === "attack" && P.i === 1) line(HMfx, hm.x + uu[0] * 4, hm.y + uu[1] * 4, hm.x + uu[0] * (tip + 8), hm.y + uu[1] * (tip + 8), C.l);
      break;
    }
    case "a_ngan": {
      // Lam Ngân Hoàng: dây lam ngân có vân vàng quấn hai tay, vương miện cỏ trên đầu, đóa hoa lam ngân nở sau lưng.
      for (const [S, h, b] of [[P.sm, P.main, HMfx], [P.so, P.off, HOfx]] as [Pt, Hand, Buf][]) {
        const nn = Math.max(Math.abs(h.x - S[0]), Math.abs(h.y - S[1]), 1);
        for (let k = 0; k <= nn; k++) {
          const x = S[0] + (h.x - S[0]) * k / nn, y = S[1] + (h.y - S[1]) * k / nn;
          b.set(x + ((k + ph) % 2), y, k % 3 === 2 ? "#f2c84b" : k % 2 ? R.b : C.b);
        }
      }
      const Y = 3 + bob;
      if (!up) for (let k = -2; k <= 2; k++) { L.front.set(16 + k * 2 - (side ? 2 : 0), Y - (k & 1 ? 1 : 2), C.l); L.front.set(16 + k * 2 - (side ? 2 : 0), Y, "#f2c84b"); }
      const fx = side ? 10 : 16, fy = 12 + bob;
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2 + 0.5, ex = fx + Math.cos(a) * 7, ey = fy + Math.sin(a) * 6;
        tube(BK, [[fx, fy], [ex, ey]], 1.2, 2, (t) => (t > 0.7 ? C.l : C.b));
      }
      disc(BK, fx, fy, 1.6, "#f2c84b");
      for (let k = 0; k < 3; k++) L.frontFx.set(5 + ((k * 9 + ph * 3) % 22), 20 + ((k * 5 + ph) % 9), k % 2 ? "#f2c84b" : C.l);
      break;
    }
    case "liet_hoa_thuong_lang": {
      // Sói lửa: tai sói xám, đuôi sói to chóp lửa, vuốt lửa hai tay, tàn lửa bay quanh.
      ears(L.front, R, C.b, 6);
      const ty = 23 + bob;
      if (side) tail(BK, [[12, ty], [7, ty + 1], [3, ty - 2], [1, ty - 6 + flap]], 2, 1.4, R, C.b);
      else tail(BK, [[up ? 16 : 18, ty], [23, ty + 1], [27, ty - 3], [28, ty - 7 + flap]], 2, 1.4, R, C.b);
      for (let k = 0; k < 3; k++) BKfx.set((side ? 1 : 27) + ((ph + k) % 3) - 1, ty - 9 + flap - k * 2, k % 2 ? "#ffe066" : C.l);
      claws(HM, P.main, C, handDir(P.sm, P.main)); claws(HO, P.off, C, handDir(P.so, P.off));
      for (const [h, b] of [[P.main, HMfx], [P.off, HOfx]] as [Hand, Buf][]) { b.set(h.x + (ph % 2), h.y - 2, C.l); b.set(h.x + 1 - (ph % 2), h.y - 3, "#ffe066"); }
      if (P.anim === "attack" && P.i === 1) for (let k = 0; k < 3; k++) line(HMfx, hm.x - 3 + k * 2, hm.y - 4, hm.x + k * 2, hm.y + 2, k === 1 ? "#ffe066" : C.l);
      break;
    }
    case "bang_phuong_hoang": {
      // Đôi cánh băng phượng hoàng, mào băng trên đầu, tinh thể băng rơi quanh người.
      wings(BK, C, R, true);
      if (!up) { const Y = 2 + bob, cx = side ? 15 : 16; L.front.set(cx, Y, C.l); L.front.set(cx - 1, Y - 1, C.b); L.front.set(cx + 1, Y - 2, C.l); L.front.set(cx, Y - 3, "#ffffff"); }
      for (let k = 0; k < 4; k++) {
        const x = 4 + ((k * 7 + ph * 3) % 24), y = 6 + bob + ((k * 9 + ph * 2) % 20), b = k % 2 ? BKfx : L.frontFx;
        b.set(x, y, "#ffffff"); b.set(x - 1, y, C.l); b.set(x + 1, y, C.l); b.set(x, y - 1, C.l); b.set(x, y + 1, C.l);
      }
      break;
    }
  }
}

/** Hai sheet phụ thể 768×192 (nửa sau, nửa trước). Chỉ vẽ cột 0–11 của hàng 0–2; phần còn lại dùng bảng ánh xạ `vohonFrame`. */
export function vohonSheets(v: { id: string; col: string; robe: string }) {
  const back = new Buf(SHEET_COLS * VH_FRAME, 4 * VH_FRAME), front = new Buf(SHEET_COLS * VH_FRAME, 4 * VH_FRAME);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 12; col++) {
    const info = frameInfo(row * SHEET_COLS + col)!, P = pose(info.dir, info.anim, info.i);
    const L: VhLayers = { back: new Buf(48, 48, 8, 8), front: new Buf(48, 48, 8, 8), backFx: new Buf(48, 48, 8, 8), frontFx: new Buf(48, 48, 8, 8) };
    drawVohon(v, P, L);
    outline(L.back, null); outline(L.front, null);
    back.paste(merge(L.backFx, L.back), col * VH_FRAME, row * VH_FRAME);
    front.paste(merge(L.front, L.frontFx), col * VH_FRAME, row * VH_FRAME);
  }
  return { b: back, f: front };
}
