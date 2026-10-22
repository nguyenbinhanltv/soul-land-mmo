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

/**
 * Đồ thị dẫn đường cho đường đi dài (tự săn toàn bản đồ, #213): bản đồ chia khối `block`×`block` ô; mỗi vùng ô đi được liền nhau (4 hướng,
 * như A* 8 hướng không cắt góc) trong một khối là một nút, đặt tại ô thoáng gần tâm vùng nhất. Hai nút nối nhau khi có hai ô kề nhau
 * qua ranh khối. `region`: vùng liên thông của cả bản đồ (khác vùng thì không đi bộ tới được).
 */
export interface Nav { MW: number; node: Int32Array; pts: Pt[]; adj: number[][]; region: Int32Array; }

export function buildNav(g: SolidGrid, block: number): Nav {
  const { MW, MH } = g, node = new Int32Array(MW * MH).fill(-1), pts: Pt[] = [], adj: number[][] = [];
  const free = (x: number, y: number) => !isSolidTile(g, x, y);
  const D4: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let by = 0; by < MH; by += block) for (let bx = 0; bx < MW; bx += block) {
    const ex = Math.min(MW, bx + block), ey = Math.min(MH, by + block);
    for (let y = by; y < ey; y++) for (let x = bx; x < ex; x++) {
      if (!free(x, y) || node[y * MW + x] >= 0) continue;
      // Loang trong khối: các ô của vùng, rồi chọn ô thoáng (4 ô kề đều đi được) gần tâm vùng nhất làm điểm của nút.
      const n = pts.length, cells: number[] = [y * MW + x]; node[y * MW + x] = n;
      let sx = 0, sy = 0;
      for (let k = 0; k < cells.length; k++) {
        const cx = cells[k] % MW, cy = (cells[k] - cx) / MW; sx += cx; sy += cy;
        for (const [dx, dy] of D4) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < bx || ny < by || nx >= ex || ny >= ey || !free(nx, ny) || node[ny * MW + nx] >= 0) continue;
          node[ny * MW + nx] = n; cells.push(ny * MW + nx);
        }
      }
      const mx = sx / cells.length, my = sy / cells.length;
      let best = cells[0], bs = Infinity;
      for (const c of cells) {
        const cx = c % MW, cy = (c - cx) / MW, open = D4.every(([dx, dy]) => free(cx + dx, cy + dy));
        const s = Math.hypot(cx - mx, cy - my) + (open ? 0 : block);
        if (s < bs) { bs = s; best = c; }
      }
      pts.push({ x: ((best % MW) + 0.5) * TILE, y: (Math.floor(best / MW) + 0.5) * TILE }); adj.push([]);
    }
  }
  // Cạnh: ô kề nhau (phải / dưới) thuộc hai nút khác nhau.
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const a = node[y * MW + x]; if (a < 0) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
      if (x + dx >= MW || y + dy >= MH) continue;
      const b = node[(y + dy) * MW + x + dx];
      if (b >= 0 && b !== a && !adj[a].includes(b)) { adj[a].push(b); adj[b].push(a); }
    }
  }
  const region = new Int32Array(pts.length).fill(-1);
  for (let s = 0, r = 0; s < pts.length; s++) {
    if (region[s] >= 0) continue;
    const q = [s]; region[s] = r;
    for (let k = 0; k < q.length; k++) for (const b of adj[q[k]]) if (region[b] < 0) { region[b] = r; q.push(b); }
    r++;
  }
  return { MW, node, pts, adj, region };
}

/** Nút dẫn đường của điểm (x, y): ô chứa điểm, ô đó chặn thì ô kề đầu tiên đi được; −1 nếu không có. */
export function navNode(nav: Nav, x: number, y: number): number {
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE), MH = nav.node.length / nav.MW;
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const nx = tx + dx, ny = ty + dy;
    if (nx < 0 || ny < 0 || nx >= nav.MW || ny >= MH) continue;
    const n = nav.node[ny * nav.MW + nx]; if (n >= 0) return n;
  }
  return -1;
}

/**
 * Đường đi dài từ `from` tới `to` (tự săn toàn bản đồ, #213): A* trên đồ thị dẫn đường cho dãy điểm trung gian, rồi nối từng đoạn:
 * đi thẳng tới điểm xa nhất (trong `look` điểm kế tiếp) còn đi thẳng được, không thì A* trong khung `opt` tới điểm kế tiếp (hai nút kề
 * nhau luôn nằm trong khung khi opt.maxTiles ≥ 2 khối). Trả về các điểm cần đi qua như findPath; rỗng nếu không cùng vùng liên thông.
 * Một đoạn A* không tới thì dừng ở chỗ tới được gần nhất (nơi gọi so điểm cuối với `to`).
 */
export function findLongPath(g: SolidGrid, nav: Nav, from: Pt, to: Pt, look: number, opt = CLICK_PATH): Pt[] {
  const s = navNode(nav, from.x, from.y), t = navNode(nav, to.x, to.y);
  if (s < 0 || t < 0 || nav.region[s] !== nav.region[t]) return [];
  const route: Pt[] = [];
  if (s !== t) {
    const N = nav.pts.length, gs = new Float64Array(N).fill(Infinity), fs = new Float64Array(N), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const h = (n: number) => Math.hypot(nav.pts[n].x - to.x, nav.pts[n].y - to.y), open = new Heap(fs);
    gs[s] = 0; fs[s] = h(s); open.push(s);
    while (open.size) {
      const c = open.pop(); if (closed[c]) continue; closed[c] = 1;
      if (c === t) break;
      for (const n of nav.adj[c]) {
        if (closed[n]) continue;
        const ng = gs[c] + Math.hypot(nav.pts[n].x - nav.pts[c].x, nav.pts[n].y - nav.pts[c].y); if (ng >= gs[n]) continue;
        gs[n] = ng; fs[n] = ng + h(n); came[n] = c; open.push(n);
      }
    }
    if (came[t] < 0) return [];
    // Điểm của các nút giữa (bỏ nút xuất phát và nút đích: đi thẳng từ chỗ đứng / tới đích trong khối của nó).
    for (let c = came[t]; c !== s && c >= 0; c = came[c]) route.push(nav.pts[c]);
    route.reverse();
  }
  route.push({ x: to.x, y: to.y });
  const out: Pt[] = []; let at: Pt = from, i = 0;
  while (i < route.length) {
    let j = Math.min(route.length - 1, i + look);
    while (j >= i && !clearLine(g, at, route[j])) j--;
    if (j >= i) { out.push(route[j]); at = route[j]; i = j + 1; continue; }
    const seg = findPath(g, at, route[i], opt);
    out.push(...seg);
    const end = seg.at(-1) ?? at;
    if (Math.hypot(end.x - route[i].x, end.y - route[i].y) > 1) break;
    at = route[i]; i++;
  }
  return out;
}
