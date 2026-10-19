// Hồn sư và phụ thể võ hồn vẽ bằng code theo quy cách 5.11 của GAME_DESIGN.md (bước 2.2b).
// Module thuần (không phụ thuộc Phaser): vẽ từng khung vào bộ đệm pixel rồi xếp thành spritesheet
// đúng bố cục cố định (16 cột × 4 hàng). textures.ts biến các sheet này thành texture Phaser,
// màn tạo nhân vật (main.ts) dùng lại để vẽ ô xem trước.
// - Mỗi tổ hợp giới × kiểu tóc là một bộ 3 lớp `hs_{body,outfit,hair}_{m,f}_{0-3}` (honsuKey trong sprites.ts).
//   Bản vẽ bằng code dùng chung một thân và một áo cho cả 4 kiểu tóc; ảnh thật thì mỗi bộ tách từ một hình riêng.
// - Thân: da, mặt, quần, giày. Áo và tóc: vẽ bằng dải 4 xám chuẩn để hoán màu.
// - Phụ thể `vh_{id}_b` / `vh_{id}_f`: khung 48×48, chỉ cột 0–11 của hàng 0–2.
import { HAIR_COLORS, OUTFIT_COLORS, type Looks } from "../../shared/data.ts";
import { HS_ANIMS, DIRS, SHEET_COLS, HS_FRAME, VH_FRAME, GRAY_RAMP, type HsAnim, type HsLayer } from "./sprites.ts";

/** Viền ngoài có màu (mục 5.11). Không nằm trong dải xám nên giữ nguyên khi hoán màu. */
export const OUT = "#1a1020";
const [G0, G1, G2, G3]: readonly string[] = GRAY_RAMP;

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

/** Vẽ bộ đệm ra canvas; `swap` là dải 4 màu thay cho dải xám chuẩn (hoán màu). */
export function bufCanvas(buf: Buf, swap?: readonly string[]) {
  const cv = document.createElement("canvas"); cv.width = buf.w; cv.height = buf.h;
  const ctx = cv.getContext("2d")!, img = ctx.createImageData(buf.w, buf.h);
  const map = swap ? new Map(GRAY_RAMP.map((g, i) => [g as string, swap[i]])) : null;
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

const SK = { d: "#c98f6c", b: "#f1c7a0", l: "#ffe2c6" }, EYE = "#1a1010", BLUSH = "#e08a7a";
const PANTS: Record<Sex, [string, string, string]> = { m: ["#2b2430", "#47435c", "#5a5672"], f: ["#2b2430", "#2b2430", "#47435c"] };
const SHOE = ["#3a2a18", "#5a3b22"];

function drawLeg(b: Buf, hipX: number, footX: number, w: number, lift: number, pants: readonly string[]) {
  const [pd, pb, pl] = pants;
  for (let r = 0; r < 3; r++) {
    const x = Math.round(hipX + (footX - hipX) * r / 2), y = 25 + r - (r ? lift : 0);
    b.rect(x, y, w, 1, pb); b.set(x, y, pl); b.set(x + w - 1, y, pd);
  }
  const fy = 28 - lift;
  b.rect(footX, fy, w, 2, SHOE[1]); b.rect(footX, fy + 1, w, 1, SHOE[0]);
}
function drawLegs(b: Buf, sex: Sex, P: Pose) {
  const pants = PANTS[sex];
  if (P.legs === "sit") { // ngồi xếp bằng (chỉ hướng xuống)
    b.rect(9, 26, 14, 4, pants[1]); b.rect(10, 26, 12, 1, pants[2]); b.rect(9, 29, 14, 1, pants[0]);
    b.rect(13, 28, 2, 2, SHOE[1]); b.rect(17, 28, 2, 2, SHOE[1]); return;
  }
  if (P.legs === "kneel") {
    if (P.dir === "right") { b.rect(12, 27, 8, 3, pants[1]); b.rect(12, 27, 8, 1, pants[2]); b.rect(9, 28, 3, 2, SHOE[1]); }
    else { b.rect(11, 27, 4, 3, pants[1]); b.rect(17, 27, 4, 3, pants[1]); b.rect(11, 27, 4, 1, pants[2]); b.rect(17, 27, 4, 1, pants[2]); }
    return;
  }
  if (P.dir === "right") {
    const s = P.step;
    const far = s ? (s > 0 ? [13, 11] : [16, 18]) : [14, 14];
    const near = s ? (s > 0 ? [16, 18] : [13, 11]) : [15, 15];
    drawLeg(b, far[0], far[1], 3, 0, [pants[0], pants[0], pants[1]]);
    drawLeg(b, near[0], near[1], 3, 0, pants);
    b.set(near[1] + 3, 29, SHOE[1]); // mũi giày hướng phải
    return;
  }
  const liftL = P.step > 0 ? 1 : 0, liftR = P.step < 0 ? 1 : 0;
  drawLeg(b, 12, 12, 3, P.dir === "down" ? liftL : liftR, pants);
  drawLeg(b, 17, 17, 3, P.dir === "down" ? liftR : liftL, pants);
}
function headRows(dir: Dir3): Pt[] {
  if (dir === "right") return [[2, 8], [1, 9], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [1, 10], [2, 9]];
  return [[2, 9], [1, 10], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [1, 10], [2, 9]];
}
function drawHead(b: Buf, sex: Sex, P: Pose) {
  const X = 10 + P.headX, Y = 6 + P.bob;
  headRows(P.dir).forEach(([a, z], r) => {
    for (let x = a; x <= z; x++) b.set(X + x, Y + r, SK.b);
    b.set(X + a, Y + r, r < 7 ? SK.l : SK.b); b.set(X + z, Y + r, SK.d);
  });
  b.rect(X + 2, Y + 10, P.dir === "right" ? 7 : 8, 1, SK.d);
  if (P.dir === "right") b.set(X + 11, Y + 6, SK.b); // mũi
  if (P.dir === "up") return;
  const eyes = P.dir === "down" ? (sex === "f" ? [2, 8] : [3, 8]) : (sex === "f" ? [6] : [7]);
  const ey = Y + 5;
  for (const ex of eyes) {
    const x = X + ex, w = sex === "f" ? 2 : 1;
    if (P.eyes === "open") { b.rect(x, ey, w, 2, EYE); if (sex === "f") b.set(x + (P.dir === "right" ? 1 : 0), ey, "#ffffff"); }
    else if (P.eyes === "closed") b.rect(x, ey + 1, 2, 1, EYE);
    else { b.set(x, ey, EYE); b.set(x + 1, ey + 1, EYE); b.set(x, ey + 2, EYE); }
  }
  if (sex === "f") {
    if (P.dir === "down") { b.set(X + 1, Y + 7, BLUSH); b.set(X + 10, Y + 7, BLUSH); b.set(X + 6, Y + 8, BLUSH); }
    else { b.set(X + 6, Y + 7, BLUSH); b.set(X + 9, Y + 8, BLUSH); }
  }
}
function drawArmSkin(b: Buf, S: Pt, H: Hand) { line(b, S[0], S[1], H.x, H.y, SK.b, 2); b.rect(H.x, H.y, 2, 2, SK.b); b.set(H.x + 1, H.y + 1, SK.d); }
const torsoBox = (P: Pose) => (P.dir === "right" ? { x: 12, w: 8 } : { x: 11, w: 10 });

function drawBody(sex: Sex, P: Pose) {
  const b = new Buf(32, 32);
  if (P.legs !== "sit") drawLegs(b, sex, P);
  if (P.main.behind) drawArmSkin(b, P.sm, P.main);
  if (P.off.behind) drawArmSkin(b, P.so, P.off);
  const T = torsoBox(P); b.rect(T.x, 17 + P.bob, T.w, P.legs === "sit" ? 4 : 8, "#2b2430");
  if (P.legs === "sit") drawLegs(b, sex, P);
  drawHead(b, sex, P);
  if (!P.off.behind) drawArmSkin(b, P.so, P.off);
  if (!P.main.behind) drawArmSkin(b, P.sm, P.main);
  outline(b, null);
  return b;
}
function sleeve(b: Buf, S: Pt, H: Hand, c: string) {
  const n = Math.max(Math.abs(H.x - S[0]), Math.abs(H.y - S[1]), 1);
  for (let i = 0; i <= n; i++) {
    const x = Math.round(S[0] + (H.x - S[0]) * i / n), y = Math.round(S[1] + (H.y - S[1]) * i / n);
    if (Math.abs(x - H.x) < 2 && Math.abs(y - H.y) < 2) continue;
    b.rect(x, y, 2, 2, c);
  }
}
/** Khoét chỗ bàn tay khỏi lớp áo/tóc để tay (lớp thân) lộ ra. */
function cutHands(b: Buf, P: Pose, hairLayer: boolean) {
  for (const h of [P.main, P.off]) {
    if (h.behind || (hairLayer && P.dir === "up")) continue;
    b.clear(h.x, h.y, 2, 2);
  }
}
/** Áo hồn sư bằng dải xám: nam áo dài qua hông, nữ váy ngắn trên quần bó. Đai lưng là sắc tối nhất. */
function drawOutfit(sex: Sex, P: Pose, under: Buf) {
  const b = new Buf(32, 32), y0 = 17 + P.bob, T = torsoBox(P);
  if (P.main.behind) sleeve(b, P.sm, P.main, G1);
  if (P.off.behind) sleeve(b, P.so, P.off, G1);
  const sit = P.legs === "sit", len = sit ? 4 : sex === "m" ? 8 : 6;
  b.rect(T.x, y0, T.w, len, G2); b.rect(T.x, y0, 1, len, G3); b.rect(T.x + T.w - 1, y0, 1, len, G1); b.rect(T.x + 1, y0, T.w - 2, 1, G3);
  if (P.dir === "down") { b.set(15, y0, G1); b.set(16, y0, G1); b.set(15, y0 + 1, G1); b.set(16, y0 + 1, G1); b.set(16, y0 + 2, G1); }
  b.rect(T.x, y0 + (sit ? 3 : 4), T.w, 1, G0); // đai lưng
  if (sit) b.rect(15, y0 + 3, 2, 1, G3);
  else if (P.dir === "down") b.rect(15, y0 + 4, 2, 1, G3);
  else if (P.dir === "up") { b.set(15, y0 + 5, G0); b.set(16, y0 + 5, G0); }
  else b.set(T.x + T.w - 2, y0 + 4, G3);
  if (sit) { /* ngồi: áo ngắn, chân xếp bằng nằm trước */ }
  else if (sex === "m") { b.rect(T.x, y0 + 7, T.w, 1, G1); if (P.dir !== "right") b.set(15, y0 + 6, G1); }
  else { // váy ngắn trên quần bó
    b.rect(T.x, y0 + 5, T.w, 1, G2);
    b.rect(T.x - 1, y0 + 6, T.w + 2, 3, G2); b.rect(T.x - 1, y0 + 6, 1, 3, G3); b.rect(T.x + T.w, y0 + 6, 1, 3, G1);
    for (let x = T.x + 1; x < T.x + T.w; x += 3) b.rect(x, y0 + 7, 1, 2, G1);
    b.rect(T.x - 1, y0 + 8, T.w + 2, 1, G1);
  }
  if (!P.off.behind) sleeve(b, P.so, P.off, G2);
  if (!P.main.behind) sleeve(b, P.sm, P.main, G2);
  outline(b, under, G0);
  cutHands(b, P, false);
  return b;
}

/** Tóc theo kiểu (bảng HAIR_STYLES), tọa độ tương đối đầu (X = 10, Y = 6). Đầu chiếm x 0..11, y 0..10. */
function drawHair(sex: Sex, style: number, P: Pose, under: Buf) {
  const b = new Buf(32, 32);
  const X = 10 + P.headX, Y = 6 + P.bob;
  const r = (x: number, y: number, w: number, h: number, c = G2) => b.rect(X + x, Y + y, w, h, c);
  const s = (x: number, y: number, c = G2) => b.set(X + x, Y + y, c);
  const capFront = () => { r(2, -1, 8, 1); r(1, 0, 10, 1); r(0, 1, 12, 3); r(2, 0, 3, 1, G3); r(1, 1, 2, 1, G3); r(11, 1, 1, 3, G1); s(10, 0, G1); };
  const capSide = (backH = 4) => { r(2, -1, 7, 1); r(1, 0, 9, 1); r(0, 1, 11, 3); r(0, 4, 5, backH); r(1, 4 + backH, 3, 1); r(3, 0, 3, 1, G3); r(2, 1, 2, 1, G3); r(0, 4, 1, backH, G1); r(8, 4, 3, 1); };
  const capBack = (h = 5) => { r(2, -1, 8, 1); r(1, 0, 10, 1); r(0, 1, 12, 3 + h); r(1, 4 + h, 10, 1); r(2, 0, 3, 1, G3); r(1, 1, 2, 2, G3); r(0, 4, 1, h, G1); r(11, 1, 1, 3 + h, G1); r(4, 5, 1, h - 1, G1); r(8, 5, 1, h - 1, G1); };
  const key = sex + style;
  if (P.dir === "down") {
    capFront();
    if (key === "m0") { for (const x of [0, 1, 2, 4, 5, 6, 8, 9, 10, 11]) s(x, 4); s(0, 5); s(5, 5); s(11, 5); s(3, -2); s(7, -2); s(8, -2); s(6, 4, G1); s(2, 4, G1); }
    if (key === "m1") { r(0, 4, 4, 1); r(8, 4, 4, 1); s(5, 3, G1); s(6, 3, G1); r(0, 5, 1, 4, G1); r(11, 5, 1, 4, G1); }
    if (key === "m2") { r(1, -2, 2, 1); r(5, -2, 2, 1); r(9, -2, 2, 1); s(2, -3); s(6, -3); s(9, -3); s(6, -4); s(5, -2, G3); r(0, 4, 3, 1); r(5, 4, 2, 1); r(9, 4, 3, 1); s(1, 5); s(10, 5); }
    if (key === "m3") { r(0, 4, 6, 3); r(1, 7, 4, 1); r(8, 4, 4, 1); r(1, 4, 2, 1, G3); r(5, 5, 1, 2, G1); s(11, 5); s(11, 6, G1); }
    if (key === "f0") { r(0, 4, 12, 1); r(0, 5, 2, 1); r(10, 5, 2, 1); r(-2, 2, 3, 16); r(11, 2, 3, 16); r(-2, 2, 1, 16, G1); r(13, 2, 1, 16, G1); r(0, 5, 1, 13, G3); r(11, 5, 1, 13, G1); }
    if (key === "f1") { r(0, 4, 3, 1); r(5, 4, 7, 1); s(0, 5); s(11, 5); r(4, -3, 4, 2); r(4, -1, 4, 1, G0); s(5, -3, G3); r(12, 0, 2, 9); s(12, 0, G3); s(13, 8, G1); }
    if (key === "f2") { r(0, 4, 5, 1); r(6, 4, 6, 1); for (let k = 0; k < 14; k++) { const c = k % 2 ? [G1, G2, G1] : [G2, G3, G2]; c.forEach((cc, j) => s(10 + j, 5 + k, cc)); } s(11, 19, G0); r(10, 20, 3, 1); }
    if (key === "f3") { r(0, 4, 12, 1); for (const x of [0, 1, 4, 5, 6, 7, 10, 11]) s(x, 5); r(-1, 2, 2, 10); r(11, 2, 2, 10); s(0, 11); s(11, 11); r(-1, 2, 1, 10, G1); r(12, 2, 1, 10, G1); s(0, 6, G3); }
  } else if (P.dir === "right") {
    if (key === "m0") { capSide(4); s(3, -2); s(6, -2); s(0, 8); s(2, 8); s(9, 5); s(10, 4); }
    if (key === "m1") { capSide(5); r(-1, 9, 2, 8); r(-1, 9, 2, 1, G0); s(-1, 10, G3); r(9, 4, 2, 3); }
    if (key === "m2") { capSide(3); s(2, -2); s(3, -2); s(5, -2); s(6, -2); s(1, -3); s(4, -3); s(0, -4); s(-1, -2); s(-1, -1); s(10, 4); }
    if (key === "m3") { capSide(4); r(7, 4, 4, 3); r(8, 7, 3, 1); s(8, 4, G3); s(7, 6, G1); }
    if (key === "f0") { capSide(4); r(-1, 4, 6, 14); r(-1, 4, 1, 14, G1); r(4, 8, 1, 10, G1); s(1, 6, G3); }
    if (key === "f1") { capSide(4); r(0, -3, 3, 2); s(1, -1, G0); r(-3, -2, 3, 1); r(-4, -1, 3, 10); r(-3, 9, 2, 1); s(-4, 0, G3); r(-2, 0, 1, 9, G1); r(8, 4, 3, 2); }
    if (key === "f2") { capSide(4); for (let k = 0; k < 10; k++) { s(0, 8 + k, k % 2 ? G1 : G2); s(1, 8 + k, k % 2 ? G2 : G3); } s(0, 18, G0); }
    if (key === "f3") { capSide(4); r(-1, 4, 6, 8); r(-1, 4, 1, 8, G1); r(0, 11, 4, 1, G1); r(8, 4, 3, 2); s(9, 5, G3); }
  } else {
    if (key === "m0") { capBack(5); s(3, 9, G1); s(7, 9, G1); s(3, -2); s(7, -2); s(8, -2); }
    if (key === "m1") { capBack(5); s(5, 10, G0); s(6, 10, G0); r(5, 11, 2, 8); r(5, 11, 1, 8, G3); s(6, 18, G1); }
    if (key === "m2") { capBack(4); r(1, -2, 2, 1); r(5, -2, 2, 1); r(9, -2, 2, 1); s(2, -3); s(6, -3); s(9, -3); s(6, -4); }
    if (key === "m3") { capBack(5); r(9, 8, 3, 2); }
    if (key === "f0") { capBack(5); r(-1, 4, 14, 14); r(-1, 4, 1, 14, G1); r(12, 4, 1, 14, G1); for (const x of [3, 7, 10]) r(x, 6, 1, 11, G1); r(1, 5, 1, 10, G3); }
    if (key === "f1") { capBack(4); r(4, -3, 4, 2); r(4, -1, 4, 1, G0); r(4, 0, 4, 13, G1); r(5, 0, 2, 12); s(5, 1, G3); s(5, 2, G3); }
    if (key === "f2") { capBack(5); for (let k = 0; k < 4; k++) { s(0, 9 + k, k % 2 ? G1 : G2); s(1, 9 + k, k % 2 ? G2 : G3); } }
    if (key === "f3") { capBack(5); r(-1, 2, 14, 10); r(-1, 2, 1, 10, G1); r(12, 2, 1, 10, G1); r(0, 11, 12, 1, G1); r(1, 3, 1, 7, G3); }
  }
  outline(b, under, G0);
  cutHands(b, P, true);
  return b;
}
/** Biến dạng cả khung: nghiêng (hurt, khuỵu) hoặc xoay nằm ngang (die khung cuối). */
function applyXf(src: Buf, xf: Xf | null) {
  if (!xf) return src;
  const b = new Buf(src.w, src.h);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const c = src.d[y * src.w + x]; if (!c) continue;
    if (xf.type === "shear") b.set(x + Math.round((30 - y) * xf.k), y + (xf.dy ?? 0), c);
    else b.set(xf.cw ? 31 - y : y, xf.cw ? x + 7 : 38 - x, c);
  }
  return b;
}

interface HsFrame { P: Pose; body: Buf; outfit: Buf }
const FRAMES: Partial<Record<Sex, (HsFrame | null)[]>> = {};
/** Tư thế, thân và áo của mọi khung (chưa biến dạng) cho một giới; tóc cần chúng làm lớp dưới để tô viền trong. */
function honsuFrames(sex: Sex) {
  return (FRAMES[sex] ??= Array.from({ length: SHEET_COLS * 4 }, (_, f) => {
    const info = frameInfo(f); if (!info) return null;
    let P = pose(info.dir, info.anim, info.i);
    // Khung nằm (die cuối): vẽ tư thế đứng nhắm mắt rồi xoay cả khung.
    if (P.xf?.type === "rot") { const xf = P.xf; P = pose(info.dir, "idle", 0); P.eyes = "closed"; P.xf = xf; }
    const body = drawBody(sex, P);
    return { P, body, outfit: drawOutfit(sex, P, body) };
  }));
}
/** Sheet 512×128 của một lớp hồn sư (đúng bố cục cố định). `style` chỉ dùng cho lớp tóc. */
export function honsuSheet(sex: Sex, layer: HsLayer, style = 0) {
  const out = new Buf(SHEET_COLS * HS_FRAME, 4 * HS_FRAME);
  honsuFrames(sex).forEach((fr, f) => {
    if (!fr) return;
    const b = layer === "body" ? fr.body : layer === "outfit" ? fr.outfit : drawHair(sex, style, fr.P, merge(fr.body, fr.outfit));
    out.paste(applyXf(b, fr.P.xf), (f % SHEET_COLS) * HS_FRAME, Math.floor(f / SHEET_COLS) * HS_FRAME);
  });
  return out;
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

// ---------- Ô xem trước ở màn tạo nhân vật (HTML canvas, không qua Phaser) ----------
const PREVIEW = new Map<string, HTMLCanvasElement>();
const sheetCanvas = (key: string, make: () => HTMLCanvasElement) => PREVIEW.get(key) ?? PREVIEW.set(key, make()).get(key)!;
/** Vẽ hồn sư khung `idle` hướng xuống (thân, áo, tóc đã hoán màu) với gốc chân tại (ox, oy). */
export function paintHonsuPreview(ctx: CanvasRenderingContext2D, L: Looks, ox: number, oy: number) {
  const sex: Sex = L.sex === 1 ? "f" : "m";
  const hair = (HAIR_COLORS[L.hairCol] ?? HAIR_COLORS[0]).ramp, outfit = (OUTFIT_COLORS[L.outfitCol] ?? OUTFIT_COLORS[0]).ramp;
  const layers = [
    sheetCanvas(`hs_body_${sex}`, () => bufCanvas(honsuSheet(sex, "body"))),
    sheetCanvas(`hs_outfit_${sex}_0@${L.outfitCol}`, () => bufCanvas(honsuSheet(sex, "outfit"), outfit)),
    sheetCanvas(`hs_hair_${sex}_${L.hair}@${L.hairCol}`, () => bufCanvas(honsuSheet(sex, "hair", L.hair), hair)),
  ];
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(ox - 5, oy, 10, 1); ctx.fillRect(ox - 6, oy - 1, 12, 1);
  for (const cv of layers) ctx.drawImage(cv, 0, 0, HS_FRAME, HS_FRAME, ox - HS_FRAME / 2, oy - 30, HS_FRAME, HS_FRAME);
}
