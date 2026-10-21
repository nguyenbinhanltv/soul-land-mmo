// Hình học trên lưới ô cho công cụ dựng bản đồ: đa giác, đường gấp khúc, spline, tách đa giác thành chữ nhật (server chỉ đọc vùng
// chữ nhật), tìm đường A* trên lưới chi phí.

/** Điểm (x, y) nằm trong đa giác `poly` ([[x, y], …], tọa độ ô) không (quy tắc chẵn lẻ). */
export function inPoly(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** Hình vùng trong bố cục: `rect` [x, y, w, h] hoặc `poly` [[x, y], …] → hàm thử ô (tâm ô). */
export function shapeTest(s) {
  if (s.rect) { const [x0, y0, w, h] = s.rect; return (x, y) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h; }
  if (s.poly) return (x, y) => inPoly(s.poly, x + 0.5, y + 0.5);
  if (s.circle) { const [cx, cy, r] = s.circle; return (x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r; }
  throw new Error(`Hình không hợp lệ: ${JSON.stringify(s)}`);
}

/**
 * Tách một tập ô (hàm `test`) thành ít chữ nhật không chồng nhau theo lưới thô `cell` ô: ô thô thuộc vùng nếu tâm của nó thuộc vùng;
 * lặp lấy chữ nhật lớn nhất còn lại (thuật toán biểu đồ cột), hòa thì lấy cái trên cùng bên trái. Phủ gần đúng hình bằng ít mảnh,
 * vì mỗi mảnh là một object `zone` riêng trên server (sinh và hồi sinh theo từng mảnh).
 */
export function rectsOf(test, MW, MH, cell) {
  const CW = Math.ceil(MW / cell), CH = Math.ceil(MH / cell), on = new Uint8Array(CW * CH);
  for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++)
    on[cy * CW + cx] = test(Math.min(cx * cell + (cell >> 1), MW - 1), Math.min(cy * cell + (cell >> 1), MH - 1)) ? 1 : 0;
  const out = [], hgt = new Int32Array(CW);
  for (;;) {
    let best = null;
    hgt.fill(0);
    for (let cy = 0; cy < CH; cy++) {
      for (let cx = 0; cx < CW; cx++) hgt[cx] = on[cy * CW + cx] ? hgt[cx] + 1 : 0;
      // Chữ nhật lớn nhất có đáy ở hàng cy: với mỗi cột, mở rộng trái phải khi cột còn cao ít nhất bằng nó.
      for (let cx = 0; cx < CW; cx++) {
        const h = hgt[cx]; if (!h) continue;
        let l = cx, r = cx;
        while (l > 0 && hgt[l - 1] >= h) l--;
        while (r < CW - 1 && hgt[r + 1] >= h) r++;
        const area = h * (r - l + 1), y0 = cy - h + 1;
        if (!best || area > best.area || (area === best.area && (y0 < best.y0 || (y0 === best.y0 && l < best.x0)))) best = { area, x0: l, x1: r + 1, y0, y1: cy + 1 };
      }
    }
    if (!best) break;
    for (let cy = best.y0; cy < best.y1; cy++) for (let cx = best.x0; cx < best.x1; cx++) on[cy * CW + cx] = 0;
    const x = best.x0 * cell, y = best.y0 * cell;
    out.push({ x, y, w: Math.min(best.x1 * cell, MW) - x, h: Math.min(best.y1 * cell, MH) - y });
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Spline Catmull-Rom qua các điểm `pts`, trả danh sách điểm cách nhau khoảng `step` ô. */
export function spline(pts, step = 0.5) {
  if (pts.length < 2) return pts.map(([x, y]) => [x, y]);
  const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push([...pts[pts.length - 1]]);
  return out;
}

/** Hàng đợi ưu tiên nhỏ nhất (đống nhị phân) theo `pri`. */
class Heap {
  constructor() { this.k = []; this.p = []; }
  get size() { return this.k.length; }
  push(k, p) {
    const K = this.k, P = this.p; let i = K.length; K.push(k); P.push(p);
    while (i > 0) { const j = (i - 1) >> 1; if (P[j] <= p) break; K[i] = K[j]; P[i] = P[j]; i = j; }
    K[i] = k; P[i] = p;
  }
  pop() {
    const K = this.k, P = this.p, top = K[0], lk = K.pop(), lp = P.pop();
    if (K.length) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1; if (c >= K.length) break;
        if (c + 1 < K.length && P[c + 1] < P[c]) c++;
        if (P[c] >= lp) break;
        K[i] = K[c]; P[i] = P[c]; i = c;
      }
      K[i] = lk; P[i] = lp;
    }
    return top;
  }
}

/**
 * A* 8 hướng trên lưới MW × MH: `cost(x, y)` là chi phí bước vào ô (Infinity = không đi được). Trả danh sách ô [x, y] từ `a` tới `b`,
 * hoặc null. Hòa nhau thì chọn theo thứ tự cố định nên kết quả ổn định.
 */
export function astar(MW, MH, a, b, cost) {
  const N = MW * MH, g = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const start = a[1] * MW + a[0], goal = b[1] * MW + b[0], h = (i) => { const dx = Math.abs((i % MW) - b[0]), dy = Math.abs(((i / MW) | 0) - b[1]); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  const heap = new Heap(); g[start] = 0; heap.push(start, h(start));
  const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  while (heap.size) {
    const i = heap.pop(); if (done[i]) continue; done[i] = 1;
    if (i === goal) break;
    const x = i % MW, y = (i / MW) | 0;
    for (const [dx, dy, len] of D) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      // Đi chéo phải qua được cả hai ô cạnh (đường liền, không cắt góc).
      if (dx && dy && (!Number.isFinite(cost(x + dx, y)) || !Number.isFinite(cost(x, y + dy)))) continue;
      const c = cost(nx, ny); if (!Number.isFinite(c)) continue;
      const j = ny * MW + nx, ng = g[i] + c * len;
      if (ng < g[j]) { g[j] = ng; from[j] = i; heap.push(j, ng + h(j)); }
    }
  }
  if (!done[goal]) return null;
  const out = [];
  for (let i = goal; i >= 0; i = from[i]) out.push([i % MW, (i / MW) | 0]);
  return out.reverse();
}
