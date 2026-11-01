// Hàm thuần đo "luồng di chuyển" trên lưới ô chặn (L0 #1658, bản thiết kế cải tổ luồng di chuyển bản đồ (PR #1656) phần 0.1–0.2).
// Lưới: { MW, MH, solid: Uint8Array } như shared/move.ts (`solid[ty * MW + tx] = 1` là ô chặn); ngoài bản đồ tính là chặn.
// Không đọc file, không ngẫu nhiên: cùng lưới thì ra đúng cùng số (kiểm thử trên lưới giả ở luong.test.mjs).

/** Bề ngang tính trung bình bị cắt ở mức này (khớp bảng 0.2: hai sân đấu, Thiên Đấu, Nặc Đinh… chỉ khớp khi cắt 14). */
export const WIDTH_CAP = 14;

const NB8 = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];

export const isSolid = (g, x, y) => x < 0 || y < 0 || x >= g.MW || y >= g.MH || g.solid[y * g.MW + x] === 1;

/** Lưới từ mảng chuỗi ("#" chặn, "." trống): tiện cho kiểm thử. */
export function gridFromRows(rows) {
  const MH = rows.length, MW = rows[0].length, solid = new Uint8Array(MW * MH);
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === "#") solid[y * MW + x] = 1; }));
  return { MW, MH, solid };
}

/**
 * Bề ngang ô: w lớn nhất mà ô nằm trong một hình vuông w×w toàn ô đi được (0 ở ô chặn). Chính xác trên lưới.
 * Quy hoạch động ô-vuông-lớn-nhất kết thúc ở góc dưới phải, rồi phủ từng hình vuông cực đại (bỏ qua hình vuông nằm gọn trong hình lớn hơn).
 */
export function widths(g) {
  const { MW, MH } = g, S = new Uint16Array(MW * MH), W = new Uint16Array(MW * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = y * MW + x;
    if (g.solid[i]) continue;
    S[i] = 1 + Math.min(x ? S[i - 1] : 0, y ? S[i - MW] : 0, x && y ? S[i - MW - 1] : 0);
  }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const s = S[y * MW + x];
    if (!s) continue;
    // Hình vuông s×s kết thúc ở (x, y) là cực đại nếu không có hình vuông lớn hơn che trọn nó (kề phải / kề dưới cùng S ≥ s + 1 thì che).
    for (let yy = y - s + 1; yy <= y; yy++) for (let xx = x - s + 1; xx <= x; xx++) if (W[yy * MW + xx] < s) W[yy * MW + xx] = s;
  }
  return W;
}

/** Số kẹt chéo: khối 2×2 có hai ô chặn nằm chéo nhau, hai ô còn lại trống (hộp 10×8 px không lách chéo được). */
export function pinches(g) {
  let n = 0;
  for (let y = -1; y < g.MH; y++) for (let x = -1; x < g.MW; x++) {
    const a = isSolid(g, x, y), b = isSolid(g, x + 1, y), c = isSolid(g, x, y + 1), d = isSolid(g, x + 1, y + 1);
    if ((a && d && !b && !c) || (b && c && !a && !d)) n++;
  }
  return n;
}

/** Số ngõ cụt: ô trống có ≥ 3 ô kề (4 hướng) chặn. */
export function deadEnds(g) {
  let n = 0;
  for (let y = 0; y < g.MH; y++) for (let x = 0; x < g.MW; x++) {
    if (isSolid(g, x, y)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => isSolid(g, x + dx, y + dy)).length >= 3) n++;
  }
  return n;
}

/**
 * Ô chỉ vào được qua khe 1 ô: ô đi được không thuộc thành phần "rộng" lớn nhất, trong đó chỉ đi qua ô có bề ngang ≥ 2
 * (liền 4 hướng); đếm các ô bề ngang ≥ 2 nằm ngoài thành phần đó (vùng sau khe; chính ô khe 1 ô không tính). Khớp bảng 0.2 của thiết kế.
 */
export function behindGap(g, W) {
  const { MW, MH } = g, comp = new Int32Array(MW * MH).fill(-1), sizes = [];
  for (let s = 0; s < MW * MH; s++) {
    if (W[s] < 2 || comp[s] >= 0) continue;
    const id = sizes.length; let n = 0; const st = [s]; comp[s] = id;
    while (st.length) {
      const i = st.pop(); n++;
      const x = i % MW, y = (i - x) / MW;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= MW || Y >= MH) continue;
        const k = Y * MW + X;
        if (W[k] >= 2 && comp[k] < 0) { comp[k] = id; st.push(k); }
      }
    }
    sizes.push(n);
  }
  if (!sizes.length) return 0;
  const main = sizes.indexOf(Math.max(...sizes));
  let n = 0;
  for (let i = 0; i < MW * MH; i++) if (W[i] >= 2 && comp[i] !== main) n++;
  return n;
}

/** Số thành phần liên thông (8 hướng, không cắt góc) của ô đi được. */
export function components(g) {
  const { MW, MH } = g, seen = new Uint8Array(MW * MH); let n = 0;
  for (let s = 0; s < MW * MH; s++) {
    if (g.solid[s] || seen[s]) continue;
    n++; seen[s] = 1; const st = [s];
    while (st.length) {
      const i = st.pop(), x = i % MW, y = (i - x) / MW;
      for (const [dx, dy] of NB8) {
        const X = x + dx, Y = y + dy;
        if (isSolid(g, X, Y) || seen[Y * MW + X]) continue;
        if (dx && dy && (isSolid(g, x + dx, y) || isSolid(g, x, y + dy))) continue;
        seen[Y * MW + X] = 1; st.push(Y * MW + X);
      }
    }
  }
  return n;
}

/** Hàng đợi ưu tiên nhị phân theo khóa. */
class Heap {
  constructor() { this.a = []; this.k = []; }
  get size() { return this.a.length; }
  push(v, key) {
    const { a, k } = this; let i = a.length; a.push(v); k.push(key);
    while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; a[i] = a[p]; k[i] = k[p]; i = p; }
    a[i] = v; k[i] = key;
  }
  pop() {
    const { a, k } = this, top = a[0], lv = a.pop(), lk = k.pop();
    if (a.length) {
      let i = 0; const n = a.length;
      for (;;) {
        let c = 2 * i + 1; if (c >= n) break;
        if (c + 1 < n && k[c + 1] < k[c]) c++;
        if (k[c] >= lk) break;
        a[i] = a[c]; k[i] = k[c]; i = c;
      }
      a[i] = lv; k[i] = lk;
    }
    return top;
  }
}

/** Đường ngắn nhất 8 hướng (chéo √2, không cắt góc ô chặn) từ ô `from` tới ô `to`: { cells: [chỉ số ô…], len } hoặc null. */
export function shortestPath(g, from, to) {
  const { MW, MH } = g, N = MW * MH, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1);
  const tx = to % MW, ty = (to - tx) / MW, h = (i) => { const x = i % MW, y = (i - x) / MW, dx = Math.abs(x - tx), dy = Math.abs(y - ty); return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy); };
  const q = new Heap(); dist[from] = 0; q.push(from, h(from));
  const done = new Uint8Array(N);
  while (q.size) {
    const i = q.pop(); if (done[i]) continue; done[i] = 1;
    if (i === to) break;
    const x = i % MW, y = (i - x) / MW;
    for (const [dx, dy, c] of NB8) {
      const X = x + dx, Y = y + dy;
      if (isSolid(g, X, Y)) continue;
      if (dx && dy && (isSolid(g, x + dx, y) || isSolid(g, x, y + dy))) continue;
      const k = Y * MW + X, d = dist[i] + c;
      if (d < dist[k]) { dist[k] = d; prev[k] = i; q.push(k, d + h(k)); }
    }
  }
  if (!isFinite(dist[to])) return null;
  const cells = []; for (let i = to; i >= 0; i = prev[i]) cells.push(i);
  return { cells: cells.reverse(), len: dist[to] };
}

/** Số đoạn cổ chai trên một đường: đoạn liên tiếp ≥ `minRun` ô có bề ngang ≤ `maxW`. */
export function chokeRuns(W, cells, maxW = 2, minRun = 3) {
  let n = 0, run = 0;
  for (const i of cells) { if (W[i] <= maxW) run++; else { if (run >= minRun) n++; run = 0; } }
  if (run >= minRun) n++;
  return n;
}

/** Bề ngang lớn nhất mà vẫn đi từ ô `from` tới ô `to` (đường có ô hẹp nhất rộng nhất; 8 hướng không cắt góc); 0 nếu không tới được. */
export function widestPath(g, W, from, to) {
  const { MW } = g, best = new Int32Array(g.MW * g.MH).fill(-1);
  // Dijkstra khóa max-min: duyệt theo bề ngang giảm dần bằng cách nới ngưỡng.
  const buckets = new Map(), push = (i, w) => { if (w > best[i]) { best[i] = w; (buckets.get(w) ?? buckets.set(w, []).get(w)).push(i); } };
  push(from, W[from]);
  for (let w = W[from]; w >= 1; w--) {
    const st = buckets.get(w) ?? []; buckets.delete(w);
    while (st.length) {
      const i = st.pop(); if (best[i] !== w) continue;
      const x = i % MW, y = (i - x) / MW;
      for (const [dx, dy] of NB8) {
        const X = x + dx, Y = y + dy;
        if (isSolid(g, X, Y)) continue;
        if (dx && dy && (isSolid(g, x + dx, y) || isSolid(g, x, y + dy))) continue;
        const k = Y * MW + X, nw = Math.min(w, W[k]);
        if (nw > best[k]) { best[k] = nw; if (nw === w) st.push(k); else (buckets.get(nw) ?? buckets.set(nw, []).get(nw)).push(k); }
      }
    }
  }
  return Math.max(0, best[to]);
}

/**
 * Tỷ lệ ô chặn "lẻ": ô chặn (bỏ viền 3 ô) thuộc cụm liên thông 4 hướng chỉ 1–3 ô, trên tổng ô chặn bỏ viền (mục 1.1: cây lẻ / đôi).
 * Cụm chạm viền hoặc ≥ 4 ô không tính là lẻ.
 */
export function smallBlockPct(g, maxSize = 3, border = 3) {
  const { MW, MH } = g, seen = new Uint8Array(MW * MH);
  const inner = (x, y) => x >= border && y >= border && x < MW - border && y < MH - border;
  let total = 0, small = 0;
  for (let s = 0; s < MW * MH; s++) {
    if (!g.solid[s] || seen[s]) continue;
    const cells = [s]; seen[s] = 1;
    for (let k = 0; k < cells.length; k++) {
      const i = cells[k], x = i % MW, y = (i - x) / MW;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= MW || Y >= MH) continue;
        const j = Y * MW + X; if (g.solid[j] && !seen[j]) { seen[j] = 1; cells.push(j); }
      }
    }
    const touch = cells.some((i) => !inner(i % MW, Math.floor(i / MW)));
    const n = cells.filter((i) => inner(i % MW, Math.floor(i / MW))).length;
    total += n;
    if (!touch && cells.length <= maxSize) small += n;
  }
  return total ? (100 * small) / total : 0;
}

/** Chỉ số chính của một lưới (không tính tuyến mốc). */
export function gridStats(g) {
  const N = g.MW * g.MH, W = widths(g);
  let solid = 0, walk = 0, sumW = 0, narrow = 0, open5 = 0;
  for (let i = 0; i < N; i++) {
    if (g.solid[i]) { solid++; continue; }
    walk++; sumW += Math.min(W[i], WIDTH_CAP); if (W[i] <= 2) narrow++; if (W[i] >= 5) open5++;
  }
  // Tỷ lệ chặn "trong": bỏ viền 3 ô.
  let sIn = 0, nIn = 0;
  for (let y = 3; y < g.MH - 3; y++) for (let x = 3; x < g.MW - 3; x++) { nIn++; if (g.solid[y * g.MW + x]) sIn++; }
  const pct = (a, b) => (b ? (100 * a) / b : 0);
  return {
    W, cells: N, walk, solidPct: pct(solid, N), solidInnerPct: pct(sIn, nIn), meanW: walk ? sumW / walk : 0,
    narrowPct: pct(narrow, walk), open5Pct: pct(open5, walk),
    pinchPer1000: (1000 * pinches(g)) / N, deadEndPer1000: (1000 * deadEnds(g)) / (walk || 1),
    behindGap: behindGap(g, W), components: components(g), smallBlockPct: smallBlockPct(g),
  };
}
