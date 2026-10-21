// Nhà và tường thành isometric (bước 10.2): bản đồ Tiled ghi nhà là một khối ô `roof` (14) có hàng ô `wall` (15) ở mặt trước
// (phía +y), tường thành là hàng ô `wall` đứng riêng. Kích thước nhà mỗi bản đồ một khác (từ 4×3 tới 24×13 ô) nên không dùng một ảnh
// vẽ sẵn: dựng khối hộp + mái bốn mái bằng phần mềm (tô từng mặt phẳng theo phép chiếu của iso.ts, vân gạch / vữa / ngói / rạ tính
// theo tọa độ trên mặt), màu theo kiểu nhà của bản đồ (`build` trong shared/assets/iso/tiles.json, lấy từ art/palettes/<mapId>.gpl).
// Ảnh nhà sau đó được cắt thành lát dọc rộng 16 pixel, mỗi lát có độ sâu của mép trước chân nhà tại cột đó (mục 5.11).
import { TILE } from "../../shared/data.ts";
import { worldToScreen } from "./iso.ts";

export type RGBA = [number, number, number, number];
export const rgba = (c: string, a = 255): RGBA => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), a];
export const shade = (c: RGBA, k: number): RGBA => [Math.min(255, Math.round(c[0] * k)), Math.min(255, Math.round(c[1] * k)), Math.min(255, Math.round(c[2] * k)), c[3]];
export const OUTLINE = rgba("#1a1020");

/** Bộ đệm điểm ảnh nhỏ để vẽ bằng code (không khử răng cưa, hợp pixel art). */
export class Buf {
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
    for (let y = Math.max(0, Math.floor(Math.min(...ys))); y < Math.min(this.h, Math.ceil(Math.max(...ys))); y++)
      for (let x = Math.max(0, Math.floor(Math.min(...xs))); x < Math.min(this.w, Math.ceil(Math.max(...xs))); x++) {
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

/** Kiểu nhà của một bản đồ (`build` trong tiles.json). Màu: [gốc, tối, sáng]. */
export interface BuildStyle {
  /** Vân tường: vữa có khung gỗ, gạch, đá khối, ván gỗ. */
  wallKind: "plaster" | "brick" | "stone" | "wood";
  wall: [string, string, string];
  /** Khung gỗ, cửa; chân tường; kính cửa sổ. */
  trim: string; base: string; win: string;
  /** Mái ngói hay mái rạ. */
  roofKind: "tile" | "thatch";
  roof: [string, string, string];
  /** Chiều cao tường nhà và độ cao tối đa của nóc so với mép mái (pixel màn hình). */
  wallH: number; roofMax: number;
  /** Tường thành (hàng ô `wall` đứng riêng): vân, màu, chiều cao. */
  fence: { kind: "stone" | "brick" | "wood"; wall: [string, string, string]; top: string; h: number };
  /** Vật đứng (tên trong `props` của tiles.json) thay khối tường thành ở góc và hai đầu tường (cạnh cổng), ví dụ tháp cổng thành. */
  tower?: string;
}

type V3 = [number, number, number];
/** Băm số nguyên → 0…1 (vân lốm đốm cố định). */
const hash = (x: number, y: number) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** Chiếu điểm (x, y thế giới; z cao tính bằng pixel màn hình) lên màn hình. */
const proj = (p: V3) => { const s = worldToScreen(p[0], p[1]); return { x: s.x, y: s.y - p[2] }; };

/** Ảnh vẽ phần mềm theo khung bao màn hình: tô từng mặt phẳng, tọa độ trên mặt (s, t) tính ngược từ điểm ảnh. */
class Canvas3 {
  buf: Buf;
  constructor(public x0: number, public y0: number, w: number, h: number) { this.buf = new Buf(w, h); }
  /**
   * Mặt phẳng đi qua O, trục U (ngang) và V (lên), đa giác `poly` (điểm 3D trên mặt). `col(s, t)` theo độ dài dọc U, V
   * (đơn vị thế giới; z tính như pixel).
   */
  face(O: V3, U: V3, V: V3, poly: V3[], col: (s: number, t: number) => RGBA) {
    const o = proj(O), pu = proj([O[0] + U[0], O[1] + U[1], O[2] + U[2]]), pv = proj([O[0] + V[0], O[1] + V[1], O[2] + V[2]]);
    const ax = pu.x - o.x, ay = pu.y - o.y, bx = pv.x - o.x, by = pv.y - o.y, det = ax * by - ay * bx;
    if (Math.abs(det) < 1e-6) return;
    const pts = poly.map((p) => { const q = proj(p); return [q.x - this.x0, q.y - this.y0] as [number, number]; });
    this.buf.poly(pts, (x, y) => {
      const dx = x + 0.5 + this.x0 - o.x, dy = y + 0.5 + this.y0 - o.y;
      return col((dx * by - dy * bx) / det, (ax * dy - ay * dx) / det);
    });
  }
}

/** Khung bao màn hình của các điểm 3D (cộng lề 1 cho viền). */
function frame(pts: V3[]) {
  const q = pts.map(proj), x0 = Math.floor(Math.min(...q.map((p) => p.x))) - 1, y0 = Math.floor(Math.min(...q.map((p) => p.y))) - 1;
  return new Canvas3(x0, y0, Math.ceil(Math.max(...q.map((p) => p.x))) + 2 - x0, Math.ceil(Math.max(...q.map((p) => p.y))) + 2 - y0);
}

/** Độ sáng theo hướng mặt (ánh sáng chính từ trên bên trái màn hình = phía −x thế giới). */
const LIGHT = { mx: 1.1, my: 1.0, py: 0.9, px: 0.72 };

/** Vân tường tại (s dọc tường, t cao), đơn vị pixel; `kind` theo kiểu tường. */
function wallTex(kind: BuildStyle["wallKind"] | BuildStyle["fence"]["kind"], c: RGBA[], s: number, t: number, blk = 12): RGBA {
  const [base, dark, light] = c, si = Math.floor(s), ti = Math.floor(t);
  if (kind === "brick") {
    const row = Math.floor(t / 4), off = row % 2 ? 4 : 0;
    if (ti % 4 === 0 || (Math.floor(s + off) % 8 === 0)) return dark;
    return hash(Math.floor((s + off) / 8), row) < 0.25 ? light : hash(Math.floor((s + off) / 8), row) > 0.8 ? shade(base, 0.92) : base;
  }
  if (kind === "stone") {
    // Đá khối dài `blk` (tường thành dùng 8 để vân liền qua mép ô 16).
    const row = Math.floor(t / 6), off = row % 2 ? blk / 2 : 0;
    if (ti % 6 === 0 || Math.floor(s + off) % blk === 0) return dark;
    const k = hash(Math.floor((s + off) / blk) % (16 / blk === 2 ? 2 : 1e9), row);
    return k < 0.2 ? light : k > 0.75 ? shade(base, 0.9) : hash(si, ti) < 0.06 ? shade(base, 0.85) : base;
  }
  if (kind === "wood") return ti % 3 === 0 ? dark : hash(si >> 2, ti) < 0.1 ? light : base;
  // Vữa: lốm đốm nhẹ.
  const k = hash(si, ti);
  return k < 0.05 ? shade(base, 0.9) : k > 0.97 ? light : base;
}

/** Vân mái tại (s dọc mép mái, t lên dốc), đơn vị pixel. */
function roofTex(kind: BuildStyle["roofKind"], c: RGBA[], s: number, t: number): RGBA {
  const [base, dark, light] = c;
  if (kind === "thatch") {
    const layer = Math.floor(t / 5);
    if (Math.floor(t) % 5 === 4) return dark;
    const k = hash(Math.floor(s / 2) + layer * 7, layer);
    return k < 0.2 ? dark : k > 0.75 ? light : base;
  }
  // Ngói: mỗi hàng 4 pixel, viên 6 pixel so le, mép dưới mỗi hàng tối.
  const row = Math.floor(t / 4), off = row % 2 ? 3 : 0;
  if (Math.floor(t) % 4 === 0) return dark;
  if (Math.floor(s + off) % 6 === 0) return shade(base, 0.82);
  return Math.floor(t) % 4 === 3 ? light : hash(Math.floor((s + off) / 6), row) < 0.15 ? shade(base, 0.92) : base;
}

export interface Built { canvas: HTMLCanvasElement; x: number; y: number; }

/**
 * Nhà trên chân hình chữ nhật [X0, X1] × [Y0, Y1] (pixel thế giới): tường hai mặt trước (+y có cửa chính) và mái bốn mái (nóc dọc
 * theo cạnh dài). Trả ảnh và góc trên trái trên màn hình.
 */
export function buildHouse(X0: number, Y0: number, X1: number, Y1: number, st: BuildStyle): Built {
  const H = st.wallH, e = 4, w = X1 - X0, h = Y1 - Y0, along = w >= h;
  const half = (Math.min(w, h) + 2 * e) / 2, R = Math.min(st.roofMax, Math.round(half * 0.55)), Z = H + R, Ym = (Y0 + Y1) / 2, Xm = (X0 + X1) / 2;
  const ex0 = X0 - e, ex1 = X1 + e, ey0 = Y0 - e, ey1 = Y1 + e;
  // Hai đầu nóc (mái bốn mái: nóc ngắn hơn cạnh dài đúng bằng cạnh ngắn).
  const r0: V3 = along ? [ex0 + half, Ym, Z] : [Xm, ey0 + half, Z], r1: V3 = along ? [ex1 - half, Ym, Z] : [Xm, ey1 - half, Z];
  const cv = frame([[ex0, ey0, H], [ex1, ey1, 0], [ex0, ey1, 0], [ex1, ey0, 0], r0, r1, [ex1, ey1, H]]);
  const wc = st.wall.map((c) => rgba(c)), rc = st.roof.map((c) => rgba(c)), trim = rgba(st.trim), base = rgba(st.base), win = rgba(st.win);
  const lit = (cs: RGBA[], k: number) => cs.map((c) => shade(c, k));

  // Mái phía sau trước (bị mái trước và nóc che một phần), rồi tường, rồi mái phía trước.
  const slope = (eave0: V3, eave1: V3, top0: V3, top1: V3, k: number) => {
    const U = norm(sub(eave1, eave0)), mid: V3 = [(top0[0] + top1[0]) / 2, (top0[1] + top1[1]) / 2, Z];
    const foot: V3 = [eave0[0] + U[0] * ((mid[0] - eave0[0]) * U[0] + (mid[1] - eave0[1]) * U[1]), eave0[1] + U[1] * ((mid[0] - eave0[0]) * U[0] + (mid[1] - eave0[1]) * U[1]), H];
    const V = norm(sub(mid, foot)), cs = lit(rc, k), len = Math.hypot(...sub(mid, foot));
    cv.face(eave0, U, V, [eave0, eave1, top1, top0], (s, t) => (t > len - 1.2 ? shade(cs[2], 1.05) : roofTex(st.roofKind, cs, s, t)));
  };
  const [A, B, C, D]: V3[] = [[ex0, ey0, H], [ex1, ey0, H], [ex1, ey1, H], [ex0, ey1, H]]; // góc mái: sau trái, sau phải, trước, trái
  if (along) { slope(B, A, r1, r0, LIGHT.my); slope(A, D, r0, r0, LIGHT.mx); }
  else { slope(A, D, r0, r1, LIGHT.mx); slope(B, A, r0, r0, LIGHT.my); }

  // Tường: mặt +y (trái trước, có cửa chính ở giữa) và mặt +x (phải trước). Cửa sổ mỗi ô một ô cửa, trừ ô cửa chính.
  const walls: [V3, V3, number, number, boolean][] = [[[X0, Y1, 0], [1, 0, 0], w, LIGHT.py, true], [[X1, Y1, 0], [0, -1, 0], h, LIGHT.px, false]];
  for (const [O, U, len, k, front] of walls) {
    const cs = lit(wc, k), door = Math.floor(len / TILE / 2), tr = shade(trim, k), bs = shade(base, k), wn = shade(win, k);
    const end: V3 = [O[0] + U[0] * len, O[1] + U[1] * len, 0];
    cv.face(O, U, [0, 0, 1], [O, end, [end[0], end[1], H], [O[0], O[1], H]], (s, t) => {
      const cell = Math.floor(s / TILE), u = s - cell * TILE;
      if (t < 4) return hash(Math.floor(s / 5), 0) < 0.3 ? shade(bs, 0.9) : bs;                 // chân tường
      if (t > H - 3) return tr;                                                                   // xà dưới mái
      if (front && cell === door && u >= 4 && u < 12 && t < H * 0.62) return u < 5 || u >= 11 || t > H * 0.62 - 1.5 ? shade(tr, 0.8) : Math.floor(u) % 3 === 0 ? shade(tr, 0.85) : tr;
      if (!(front && cell === door) && u >= 5 && u < 11 && t > H * 0.38 && t < H * 0.72) {      // cửa sổ có khung
        return u < 6 || u >= 10 || t < H * 0.38 + 1.2 || t > H * 0.72 - 1.2 ? tr : t > H * 0.6 && u < 8 ? shade(wn, 1.5) : wn;
      }
      if (st.wallKind === "plaster" && (u < 1.2 || u > TILE - 1.2)) return tr;                   // cột gỗ ở mép mỗi ô
      return wallTex(st.wallKind, cs, s, t);
    });
  }
  if (along) { slope(D, C, r0, r1, LIGHT.py); slope(C, B, r1, r1, LIGHT.px); }
  else { slope(C, B, r1, r0, LIGHT.px); slope(D, C, r1, r1, LIGHT.py); }
  cv.buf.outline();
  return { canvas: cv.buf.canvas(), x: cv.x0, y: cv.y0 };
}

/**
 * Một ô tường thành: khối 1×1 ô cao `fence.h`, mặt trên lát đá, một lỗ châu mai ở giữa. Vân tính theo tọa độ trong ô với chu kỳ
 * chia hết 16 nên các ô kề nhau liền một dải. Trả ảnh và tâm ô (điểm chạm đất) trong ảnh.
 */
export function buildFence(st: BuildStyle): { canvas: HTMLCanvasElement; cx: number; cy: number } {
  const f = st.fence, H = f.h, T = TILE, m = 4, MH = 5;
  const cv = frame([[0, 0, H + MH], [T, T, 0], [0, T, 0], [T, 0, 0]]);
  const wc = f.wall.map((c) => rgba(c)), top = rgba(f.top);
  const box = (x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, topCol: (s: number, t: number) => RGBA) => {
    cv.face([x0, y1, z0], [1, 0, 0], [0, 0, 1], [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], (s, t) => wallTex(f.kind, wc.map((c) => shade(c, LIGHT.py)), s + x0, t + z0, 8));
    cv.face([x1, y1, z0], [0, -1, 0], [0, 0, 1], [[x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [x1, y1, z1]], (s, t) => wallTex(f.kind, wc.map((c) => shade(c, LIGHT.px)), s + (T - y1), t + z0, 8));
    cv.face([x0, y0, z1], [1, 0, 0], [0, 1, 0], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], topCol);
  };
  box(0, 0, T, T, 0, H, (s, t) => (Math.floor(s) % 8 === 0 || Math.floor(t) % 8 === 0 ? shade(top, 0.82) : hash(Math.floor(s / 8), Math.floor(t / 8)) < 0.3 ? shade(top, 1.08) : top));
  box(T / 2 - m, T / 2 - m, T / 2 + m, T / 2 + m, H, H + MH, () => shade(top, 1.1));
  cv.buf.outline();
  const c = proj([T / 2, T / 2, 0]);
  return { canvas: cv.buf.canvas(), cx: c.x - cv.x0, cy: c.y - cv.y0 };
}

/**
 * Độ sâu (tung độ màn hình) của mép trước chân hình chữ nhật [X0, X1] × [Y0, Y1] tại hoành độ màn hình `sx`: cạnh trước trái
 * (y = Y1) rồi cạnh trước phải (x = X1). Lát ảnh nhà ở cột `sx` dùng độ sâu này (mục 5.11).
 */
export function frontDepth(X0: number, Y0: number, X1: number, Y1: number, sx: number) {
  const L = worldToScreen(X0, Y1), B = worldToScreen(X1, Y1), R = worldToScreen(X1, Y0);
  if (sx <= B.x) { const k = Math.max(0, Math.min(1, (sx - L.x) / (B.x - L.x || 1))); return L.y + (B.y - L.y) * k; }
  const k = Math.max(0, Math.min(1, (sx - B.x) / (R.x - B.x || 1))); return B.y + (R.y - B.y) * k;
}
