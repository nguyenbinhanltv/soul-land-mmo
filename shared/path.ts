// Tìm đường (mục 5.11 "Điều khiển", bước 11.1): A* trên lưới ô chặn của file Tiled (shared/move.ts). Client dùng khi bấm chuột trên
// nền (vẫn chỉ gửi hướng đi trong `input`; server tính vị trí và va chạm như khi giữ phím, mục 6); server dùng cho tự săn (mục 5.13,
// server/src/rooms/autoHunt.ts) rồi cũng chỉ đặt hướng đi như input. Không dùng Phaser: bot và kiểm thử Node import thẳng file này.
import { TILE, CLICK_PATH } from "./data.ts";
import { hits, isSolidTile, PLAYER_HW, PLAYER_HH, type SolidGrid } from "./move.ts";

/** Một điểm thế giới (pixel). */
export interface Pt { x: number; y: number; }

/** 8 hướng lân cận: dx, dy, chi phí (chéo √2). */
const NB: [number, number, number][] = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];

/** Hàng đợi ưu tiên nhị phân (chỉ số nút, khóa f nhỏ nhất ra trước). */
class Heap {
  private a: number[] = []; private f: Float64Array;
  constructor(f: Float64Array) { this.f = f; }
  get size() { return this.a.length; }
  push(i: number) {
    const a = this.a, f = this.f; a.push(i); let k = a.length - 1;
    while (k > 0) { const p = (k - 1) >> 1; if (f[a[p]] <= f[i]) break; a[k] = a[p]; k = p; }
    a[k] = i;
  }
  pop(): number {
    const a = this.a, f = this.f, top = a[0], last = a.pop()!;
    if (a.length) {
      let k = 0; const n = a.length;
      for (;;) {
        let c = 2 * k + 1; if (c >= n) break;
        if (c + 1 < n && f[a[c + 1]] < f[a[c]]) c++;
        if (f[a[c]] >= f[last]) break;
        a[k] = a[c]; k = c;
      }
      a[k] = last;
    }
    return top;
  }
}

/** Hộp va chạm hồn sư đi thẳng từ `a` tới `b` không vướng ô chặn nào (lấy mẫu mỗi 2 pixel, hộp nới 1 pixel để không cọ mép). */
export function clearLine(g: SolidGrid, a: Pt, b: Pt): boolean {
  const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (hits(g, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, PLAYER_HW + 1, PLAYER_HH + 1)) return false;
  }
  return true;
}

/**
 * Đường đi từ `from` tới `to` (pixel thế giới) cho hồn sư: A* 8 hướng trên ô (không cắt góc ô chặn), trong khung CLICK_PATH.maxTiles ô
 * quanh chỗ đứng, xét tối đa CLICK_PATH.maxNodes ô. Không tới được (ô chặn, bị vây, quá xa) thì đi tới ô tới được gần `to` nhất.
 * Trả về các điểm cần đi qua (không gồm `from`), đã rút gọn: bỏ điểm giữa khi đi thẳng được; rỗng nếu không cần / không thể đi.
 */
export function findPath(g: SolidGrid, from: Pt, to: Pt, opt = CLICK_PATH): Pt[] {
  const sx = Math.floor(from.x / TILE), sy = Math.floor(from.y / TILE);
  const R = opt.maxTiles, x0 = Math.max(0, sx - R), y0 = Math.max(0, sy - R), x1 = Math.min(g.MW - 1, sx + R), y1 = Math.min(g.MH - 1, sy + R);
  // Điểm bấm ngoài khung: nhắm điểm trong khung theo cùng hướng (đi dần tới, bấm lại sau).
  const gx = Math.max(x0, Math.min(x1, Math.floor(to.x / TILE))), gy = Math.max(y0, Math.min(y1, Math.floor(to.y / TILE)));
  const exact = gx === Math.floor(to.x / TILE) && gy === Math.floor(to.y / TILE) && !hits(g, to.x, to.y, PLAYER_HW, PLAYER_HH);
  // Đi thẳng được thì khỏi tìm.
  if (exact && clearLine(g, from, to)) return Math.hypot(to.x - from.x, to.y - from.y) < 1 ? [] : [{ x: to.x, y: to.y }];
  const W = x1 - x0 + 1, H = y1 - y0 + 1, N = W * H;
  const gs = new Float64Array(N).fill(Infinity), fs = new Float64Array(N), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const id = (x: number, y: number) => (y - y0) * W + (x - x0);
  const h = (x: number, y: number) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy); };
  const open = new Heap(fs), s = id(sx, sy);
  gs[s] = 0; fs[s] = h(sx, sy); open.push(s);
  let best = s, bestH = h(sx, sy), seen = 0;
  while (open.size && seen < opt.maxNodes) {
    const c = open.pop(); if (closed[c]) continue; closed[c] = 1; seen++;
    const cx = x0 + (c % W), cy = y0 + Math.floor(c / W), hc = h(cx, cy);
    if (hc < bestH || (hc === bestH && gs[c] < gs[best])) { best = c; bestH = hc; }
    if (cx === gx && cy === gy) break;
    for (const [dx, dy, cost] of NB) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < x0 || ny < y0 || nx > x1 || ny > y1 || isSolidTile(g, nx, ny)) continue;
      if (dx && dy && (isSolidTile(g, cx + dx, cy) || isSolidTile(g, cx, cy + dy))) continue; // không cắt góc
      const n = id(nx, ny); if (closed[n]) continue;
      const ng = gs[c] + cost; if (ng >= gs[n]) continue;
      gs[n] = ng; fs[n] = ng + h(nx, ny); came[n] = c; open.push(n);
    }
  }
  // Dựng lại đường (tâm ô), điểm cuối là chính điểm bấm khi tới đúng ô đó.
  const cells: Pt[] = [];
  for (let c = best; c !== s && c >= 0; c = came[c]) cells.push({ x: (x0 + (c % W) + 0.5) * TILE, y: (y0 + Math.floor(c / W) + 0.5) * TILE });
  cells.reverse();
  if (!cells.length) return [];
  if (best === id(gx, gy) && exact) cells[cells.length - 1] = { x: to.x, y: to.y };
  // Rút gọn: từ điểm đang đứng nhảy tới điểm xa nhất còn đi thẳng được.
  const out: Pt[] = []; let at: Pt = from, i = 0;
  while (i < cells.length) {
    let j = cells.length - 1;
    while (j > i && !clearLine(g, at, cells[j])) j--;
    out.push(cells[j]); at = cells[j]; i = j + 1;
  }
  return out;
}

/** Độ dài đường đi (pixel) từ `from` qua các điểm `path`. */
export const pathLength = (from: Pt, path: Pt[]) => path.reduce((s, p, i) => s + Math.hypot(p.x - (i ? path[i - 1].x : from.x), p.y - (i ? path[i - 1].y : from.y)), 0);
