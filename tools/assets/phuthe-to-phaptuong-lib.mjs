// Phần thuần của `phuthe-to-phaptuong.mjs` (#1306, epic #1020): đóng gói phụ thể cũ (vh_<id>_b/_f, vhanim_<id>_b/_f) thành sheet pháp tướng pt_<id>.
// Không đọc / ghi file, tất định (không ngẫu nhiên): cùng ảnh vào thì cùng sheet ra. Ảnh nhập `Img` của lib.mjs (RGBA, alpha 0 / 255).
// Quy ước: khung nguồn F (96 hoặc 128), gốc chân (F/2, F/2 + 26); khung đích PT_FRAME = 160, gốc PT_ORIGIN; phóng nguyên (láng giềng gần nhất: mỗi điểm
// nguồn thành khối s×s, giữ lưới pixel) với s lớn nhất trong PT_SCALES mà mọi khung còn lọt khung 160 (ưu tiên ×2; hình phụ thể cũ thường đã choán gần hết
// khung 96 nên thực tế ra ×1). Mọi dời chỗ (thở, đánh) làm ở điểm nguồn nên luôn là bội của s điểm đích.
import { Img, PT_FRAME, PT_ORIGIN, PT_COLS, PT_ANIMS, PT_MAX_COLORS, OUTLINE, hex, toHex, ISO_DIRS } from "./lib.mjs";

/** Hệ số phóng nguyên thử theo thứ tự (lớn trước). */
export const PT_SCALES = [2, 1];
/** Chừa ở mỗi mép khung 160 (điểm đích): validate.mjs cấm hình chạm mép trên / trái / phải. */
export const PT_MARGIN = 2;
export const N_IDLE = PT_ANIMS.idle[1], N_ATTACK = PT_ANIMS.attack[1];
/** Gốc chân trong khung nguồn: khung thân 64 mở rộng đều mỗi phía, gốc thân (32, 58) (xem docs/art/phu-the-hoat-anh.md, "Khung 96 / 128"). */
export const srcOrigin = (F) => [F / 2, F / 2 + 26];
/** 3 võ hồn mẫu (chủ repo duyệt trước khi chạy cả 25). */
export const SAMPLES = ["ta_hoa_phuong_hoang", "hao_thien_chuy", "lam_ngan_thao"];

/** Ghép nửa sau và nửa trước của cùng một khung thành một lớp (nửa trước đè nửa sau; một nửa có thể thiếu). */
export function composeHalves(back, front) {
  const [a, b] = [back, front];
  const w = (a ?? b).w, h = (a ?? b).h, o = new Img(w, h);
  for (const s of [a, b]) if (s) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = s.get(x, y); if (p[3]) o.set(x, y, [p[0], p[1], p[2], 255]); }
  return o;
}

/** Cắt khung (col, row) cỡ F ra khỏi sheet. */
export function cell(sheet, F, col, row) {
  const o = new Img(F, F);
  o.blit(sheet, col * F, row * F, F, F, 0, 0);
  return o;
}

/** Nửa bề ngang (điểm nguồn) quanh gốc chân mà khoảng rỗng hình người có thể nằm: thân LPC rộng khoảng 20 điểm. */
export const BODY_HALF = 16;
/** Viền tối quanh chỗ rỗng (do cutter) dày chừng này điểm: khi lấp bỏ qua để lấy màu thật của lông / lá ở ngoài viền. */
export const OUTLINE_SKIP = 6;
/** Chỗ rỗng hình người lớn nhất cần lấp (điểm nguồn, theo hàng và theo cột). */
export const FILL_GAP = 28;
/**
 * Lấp chỗ rỗng hình người (cutter trừ nộm nên phụ thể có một khoảng rỗng ngay chỗ thân hồn sư đứng; khi pháp tướng phóng to và bay lên thì chỗ rỗng lộ ra):
 * tự lấp từ hình xung quanh, tất định. Hai lượt: (1) mỗi hàng, khoảng trong suốt ≤ maxGap điểm kẹp giữa hai điểm đặc, nằm trong ±BODY_HALF điểm quanh gốc chân,
 * tô bằng trung bình màu hai điểm đặc kề (bỏ viền tối), tối đi 28 / 38% xen theo ô cờ (không thành khối phẳng); (2) mỗi cột trong dải đó, khoảng trong suốt
 * kẹp giữa hai điểm đặc phía trên và phía dưới, tô như trên. Lượt 2 dùng kết quả lượt 1 nên bịt cả hàng đầu hở.
 * Không dùng cho vật cứng (búa, kiếm: lõm thật) và không đụng kẽ xa thân (kẽ cánh, kẽ lá). Trả khung mới.
 */
export function fillBodyHole(im, maxGap = FILL_GAP, F = im.w) {
  const o = new Img(im.w, im.h, new Uint8Array(im.data)), cx = srcOrigin(F)[0], x0 = cx - BODY_HALF, x1 = cx + BODY_HALF + 1;
  const lum = (p) => 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2];
  /** Màu lấy từ điểm đặc gần nhất đi từ (x, y) theo (dx, dy) mà không phải viền tối quanh nộm (tối đa OUTLINE_SKIP điểm); không có thì chính điểm kề. */
  const pick = (src, x, y, dx, dy) => { const first = src.get(x, y); for (let k = 0; k < OUTLINE_SKIP; k++) { const X = x + dx * k, Y = y + dy * k; if (X < 0 || Y < 0 || X >= src.w || Y >= src.h || !src.alpha(X, Y)) break; const p = src.get(X, Y); if (lum(p) > 70) return p; } return first; };
  const mix = (p, q, t) => [0, 1, 2].map((c) => (((p[c] + q[c]) / 2) * t) | 0).concat(255); // trung bình hai màu, tối đi theo t
  for (let y = 0; y < im.h; y++) {
    let x = 0;
    while (x < im.w) {
      if (im.alpha(x, y)) { x++; continue; }
      let e = x; while (e < im.w && !im.alpha(e, y)) e++;
      if (x > 0 && e < im.w && e - x <= maxGap && x >= x0 && e <= x1) {
        const L = pick(im, x - 1, y, -1, 0), R = pick(im, e, y, 1, 0);
        for (let k = x; k < e; k++) o.set(k, y, mix(L, R, (k + y) & 1 ? 0.62 : 0.72));
      }
      x = e;
    }
  }
  const mid = new Img(o.w, o.h, new Uint8Array(o.data));
  for (let x = x0; x < x1 && x < im.w; x++) {
    let y = 0;
    while (y < im.h) {
      if (mid.alpha(x, y)) { y++; continue; }
      let e = y; while (e < im.h && !mid.alpha(x, e)) e++;
      if (y > 0 && e < im.h && e - y <= maxGap) { const U = pick(mid, x, y - 1, 0, -1), D = pick(mid, x, e, 0, 1); for (let k = y; k < e; k++) o.set(x, k, mix(U, D, (x + k) & 1 ? 0.62 : 0.72)); }
      y = e;
    }
  }
  return o;
}

/** Xóa các đĩa tròn (x, y từ gốc chân, bán kính r, điểm nguồn): bỏ phần thuộc tay cầm / vật nắm không hợp pháp tướng bay. */
export function dropDiscs(im, discs, F = im.w) {
  if (!discs?.length) return im;
  const o = new Img(im.w, im.h, new Uint8Array(im.data)), [ox, oy] = srcOrigin(F);
  for (const { x, y, r } of discs) for (let j = Math.floor(oy + y - r); j <= oy + y + r; j++) for (let i = Math.floor(ox + x - r); i <= ox + x + r; i++)
    if (i >= 0 && j >= 0 && i < o.w && j < o.h && (i - ox - x) ** 2 + (j - oy - y) ** 2 <= r * r) o.set(i, j, [0, 0, 0, 0]);
  return o;
}

/** Dời / nghiêng khung nguồn theo điểm nguồn: dx, dy dời; lean = số điểm nghiêng ở đỉnh (tỉ lệ theo độ cao so với gốc chân). Không làm mờ. */
export function warp(im, { dx = 0, dy = 0, lean = 0 }, F = im.w) {
  const o = new Img(im.w, im.h), oy = srcOrigin(F)[1];
  for (let y = 0; y < im.h; y++) {
    const sh = dx + Math.round((lean * (oy - y)) / oy);
    for (let x = 0; x < im.w; x++) {
      if (!im.alpha(x, y)) continue;
      const X = x + sh, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < im.w && Y < im.h) o.set(X, Y, im.get(x, y));
    }
  }
  return o;
}

/** Hộp bao (điểm nguồn) của các khung: { x0, y0, x1, y1 } tính từ gốc chân (x sang phải, y xuống); null nếu trống. */
export function bboxOf(frames, F) {
  const [sx, sy] = srcOrigin(F), b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  for (const im of frames) for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y)) { b.x0 = Math.min(b.x0, x - sx); b.x1 = Math.max(b.x1, x - sx); b.y0 = Math.min(b.y0, y - sy); b.y1 = Math.max(b.y1, y - sy); }
  return b.x1 < b.x0 ? null : b;
}
/** Hệ số phóng nguyên lớn nhất (PT_SCALES) mà hộp bao `b` đặt ở PT_ORIGIN còn cách mép khung 160 ít nhất PT_MARGIN; 1 nếu ×1 cũng không lọt (khi đó placeFrame cắt). */
export function pickScale(b) {
  if (!b) return PT_SCALES[PT_SCALES.length - 1];
  const fit = (k) => PT_ORIGIN[0] + b.x0 * k >= PT_MARGIN && PT_ORIGIN[0] + (b.x1 + 1) * k <= PT_FRAME - PT_MARGIN && PT_ORIGIN[1] + b.y0 * k >= 0 && PT_ORIGIN[1] + (b.y1 + 1) * k <= PT_FRAME;
  return PT_SCALES.find(fit) ?? 1;
}

/** Đặt khung nguồn (cỡ F) vào khung pháp tướng 160: phóng ×scale, gốc chân trùng PT_ORIGIN, cắt phần ra ngoài; trả { img, clipped: số điểm bị cắt }. */
export function placeFrame(im, F, scale) {
  const o = new Img(PT_FRAME, PT_FRAME), [sx, sy] = srcOrigin(F);
  const ox = PT_ORIGIN[0] - sx * scale, oy = PT_ORIGIN[1] - sy * scale;
  let clipped = 0;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const p = im.get(x, y); if (!p[3]) continue;
    for (let j = 0; j < scale; j++) for (let i = 0; i < scale; i++) {
      const X = ox + x * scale + i, Y = oy + y * scale + j;
      if (X < 0 || Y < 0 || X >= PT_FRAME || Y >= PT_FRAME) clipped++; else o.set(X, Y, [p[0], p[1], p[2], 255]);
    }
  }
  return { img: o, clipped };
}

// ---------- Trình tự khung ----------
/** Vòng thở N_IDLE khung từ `n` khung nguồn: đi tới khung cuối rồi quay về (tam giác), khung đầu là tư thế gốc; n = 1 giữ nguyên. */
export const idleSeq = (n, len = N_IDLE) => Array.from({ length: len }, (_, i) => { const t = i / len; return Math.round((1 - Math.abs(2 * t - 1)) * (n - 1)); });
/** Đánh N_ATTACK khung từ `n` khung nguồn: chia đều từ khung đầu đến khung cuối (khung ra đòn ở giữa). */
export const attackSeq = (n, len = N_ATTACK) => Array.from({ length: len }, (_, i) => Math.round((i * (n - 1)) / (len - 1)));

// ---------- Nội suy tất định cho võ hồn chỉ có ảnh tĩnh ----------
/** Hướng lao tới của từng hướng vẽ (x sang phải, y xuống), theo isometric 2:1. */
export const FORWARD = { s: [0, 1], se: [1, 0.5], e: [1, 0], ne: [1, -0.5], n: [0, -1] };
/** Thở (bảng số nguyên, không dùng hàm lượng giác để kết quả giống hệt trên mọi máy): dời dọc nhấp nhô `bob` điểm nguồn, nghiêng `lean` điểm; chu kỳ N_IDLE khung. */
const BREATH_UP = [0, 0, 1, 1, 1, 1, 1, 0], BREATH_LEAN = [0, 1, 1, 1, 0, -1, -1, -1];
export const breathPose = (i, { bob = 1, lean = 1 } = {}) => ({ dx: 0, dy: 0 - BREATH_UP[i % N_IDLE] * bob, lean: BREATH_LEAN[i % N_IDLE] * lean });
/** Đường đi lùi lấy đà rồi lao / nện, đơn vị điểm nguồn theo khung (nhân với hướng lao ở `strikePose`). */
const LUNGE = [0, -1, -2, 3, 4, 2, 1, 0];
const SLAM = [0, -2, -4, -5, 2, 3, 1, 0];
/** Đánh: kiểu `lunge` (sinh vật / thực vật lao về hướng nhìn) hoặc `slam` (vật cứng nhấc lên rồi nện xuống). */
export function strikePose(i, dir, kind = "lunge", amp = 1) {
  if (kind === "slam") return { dx: 0, dy: Math.round(SLAM[i] * amp) + 0, lean: 0 };
  const [fx, fy] = FORWARD[dir];
  return { dx: Math.round(LUNGE[i] * fx * amp) + 0, dy: Math.round(LUNGE[i] * fy * amp) + 0, lean: Math.round(Math.sign(LUNGE[i]) * -amp) + 0 };
}
/** Nhóm bố cục pháp tướng (PtGroup) → kiểu đánh và biên độ thở. Vật cứng (V, O) nện / nhấc, không uốn; còn lại lao tới và uốn nhẹ. */
export const poseOf = (group) => (group === "V" || group === "O" ? { kind: "slam", bob: 1, lean: 0 } : { kind: "lunge", bob: 1, lean: 1 });

// ---------- Bảng màu ----------
/** Giảm sheet còn tối đa `max` màu (median cut theo số điểm); viền #1a1020 giữ nguyên. Sửa tại chỗ, trả số màu còn lại. */
export function quantize(t, max = PT_MAX_COLORS) {
  const count = new Map();
  for (let i = 0; i < t.data.length; i += 4) if (t.data[i + 3]) { const c = toHex([t.data[i], t.data[i + 1], t.data[i + 2]]); count.set(c, (count.get(c) ?? 0) + 1); }
  if (count.size <= max) return count.size;
  const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const keep = new Set([hex(OUTLINE).join(",")]);
  let boxes = [[...count].filter(([c]) => !keep.has(hex(c).join(","))).map(([c, n]) => ({ p: hex(c), n, c }))];
  const sum = (b) => b.reduce((m, x) => m + x.n, 0);
  while (boxes.length < max - keep.size) {
    let bi = -1, best = 0, axis = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      const span = [0, 1, 2].map((k) => Math.max(...b.map((x) => x.p[k])) - Math.min(...b.map((x) => x.p[k])));
      const a = span.indexOf(Math.max(...span)), score = span[a] * sum(b);
      if (score > best) { best = score; bi = i; axis = a; }
    });
    if (bi < 0) break;
    const b = boxes[bi].sort((x, y) => x.p[axis] - y.p[axis] || x.c.localeCompare(y.c)), half = sum(b) / 2;
    let acc = 0, cut = 1;
    for (let i = 0; i < b.length - 1; i++) { acc += b[i].n; if (acc >= half) { cut = i + 1; break; } }
    boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut));
  }
  const map = new Map();
  for (const b of boxes) {
    const N = sum(b), mean = [0, 1, 2].map((k) => b.reduce((m, x) => m + x.p[k] * x.n, 0) / N);
    const rep = b.reduce((a, x) => (dist(x.p, mean) < dist(a.p, mean) ? x : a)).p;
    for (const x of b) map.set(x.c, rep);
  }
  for (let i = 0; i < t.data.length; i += 4) {
    if (!t.data[i + 3]) continue;
    const r = map.get(toHex([t.data[i], t.data[i + 1], t.data[i + 2]])); if (r) [t.data[i], t.data[i + 1], t.data[i + 2]] = r;
  }
  return max;
}

// ---------- Dựng sheet ----------
/**
 * source: { F, anim: boolean, dirs: { <hướng>: { idle: [{ back?, front? }], attack: [{ back?, front? }] } } }; mỗi phần tử là một khung nguồn đã cắt (Img cỡ F).
 *   - Nguồn hoạt ảnh (`anim`): idle / attack lấy lại theo `idleSeq` / `attackSeq`;
 *   - Nguồn tĩnh (hoặc chỉ 1 khung): chỉ dùng idle[0]; thở và đánh nội suy bằng `breathPose` / `strikePose` theo `opt.group`.
 * opt: { group: PtGroup, fill: số điểm tối đa của khoảng lấp hình người (mặc định FILL_GAP cho sinh vật / thực vật / hư ảnh, 0 cho vật cứng; 0 = không lấp), drop: [{ x, y, r }] đĩa xóa phần tay cầm, scale: ép hệ số phóng (mặc định `pickScale`) }.
 * Trả { sheet (2560×800), scale, clipped: số điểm bị cắt khỏi khung 160, colors }.
 */
export function buildSheet(source, opt = {}) {
  const { F, anim } = source, pose = poseOf(opt.group), fill = opt.fill ?? (pose.kind === "lunge" ? FILL_GAP : 0);
  const flat = (fr) => { const im = dropDiscs(composeHalves(fr.back, fr.front), opt.drop, F); return fill ? fillBodyHole(im, fill, F) : im; };
  const cells = []; // { row, col, im } khung nguồn đã dựng, chưa phóng
  ISO_DIRS.forEach((d, row) => {
    const { idle, attack } = source.dirs[d];
    if (anim && idle.length > 1 && attack.length > 1) {
      idleSeq(idle.length).forEach((k, i) => cells.push({ row, col: PT_ANIMS.idle[0] + i, im: flat(idle[k]) }));
      attackSeq(attack.length).forEach((k, i) => cells.push({ row, col: PT_ANIMS.attack[0] + i, im: flat(attack[k]) }));
    } else {
      const base = flat(idle[0]);
      for (let i = 0; i < N_IDLE; i++) cells.push({ row, col: PT_ANIMS.idle[0] + i, im: warp(base, breathPose(i, pose), F) });
      for (let i = 0; i < N_ATTACK; i++) cells.push({ row, col: PT_ANIMS.attack[0] + i, im: warp(base, strikePose(i, d, pose.kind), F) });
    }
  });
  const scale = opt.scale ?? pickScale(bboxOf(cells.map((c) => c.im), F));
  const sheet = new Img(PT_FRAME * PT_COLS, PT_FRAME * ISO_DIRS.length);
  let clipped = 0;
  for (const { row, col, im } of cells) { const r = placeFrame(im, F, scale); clipped += r.clipped; sheet.blit(r.img, 0, 0, PT_FRAME, PT_FRAME, col * PT_FRAME, row * PT_FRAME); }
  return { sheet, scale, clipped, colors: quantize(sheet) };
}

// ---------- Lớp sáng `pt_<id>_glow` ----------
/** Khung trống? */
const emptyFrame = (im) => !im.data.some((v, i) => i % 4 === 3 && v);
/** Hạt bay lên (tất định): số hạt, độ cao bay, mỗi hạt một cột / pha riêng theo bảng số nguyên. */
const MOTES = [[0.1, 0], [0.35, 3], [0.6, 5], [0.85, 1], [0.22, 6], [0.72, 2]];
/**
 * Lớp phát sáng cùng bố cục với sheet thân (client vẽ cộng sáng): viền sáng 1–3 điểm quanh hình (điểm ngoài dithering) màu `col`, thêm vài hạt `hat` bay lên từ
 * nửa trên của hình, mỗi hạt một pha, một vòng lặp đúng bằng độ dài hoạt ảnh (thở 8 khung, đánh 8 khung). Alpha 0 / 255, tất định.
 */
export function buildGlow(sheet, col, hat = [255, 255, 255]) {
  const g = new Img(sheet.w, sheet.h);
  for (let row = 0; row < ISO_DIRS.length; row++) for (let c = 0; c < PT_COLS; c++) {
    const body = cell(sheet, PT_FRAME, c, row);
    if (emptyFrame(body)) continue;
    const solid = (x, y) => x >= 0 && y >= 0 && x < PT_FRAME && y < PT_FRAME && body.alpha(x, y) > 0;
    let x0 = PT_FRAME, x1 = -1, y0 = PT_FRAME;
    for (let y = 0; y < PT_FRAME; y++) for (let x = 0; x < PT_FRAME; x++) if (solid(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); }
    const put = (x, y, rgb) => { if (x >= 1 && y >= 1 && x < PT_FRAME - 1 && y < PT_FRAME - 1 && !solid(x, y)) g.set(c * PT_FRAME + x, row * PT_FRAME + y, [...rgb, 255]); };
    for (let y = 0; y < PT_FRAME; y++) for (let x = 0; x < PT_FRAME; x++) {
      if (solid(x, y)) continue;
      let d = 4; for (let j = -3; j <= 3 && d > 1; j++) for (let i = -3; i <= 3; i++) if (solid(x + i, y + j)) d = Math.min(d, Math.max(Math.abs(i), Math.abs(j)));
      if (d === 1 || (d === 2 && (x + y) % 2 === 0) || (d === 3 && x % 2 === 0 && y % 2 === 0)) put(x, y, col);
    }
    const n = c % 8, w = x1 - x0 + 1;
    MOTES.forEach(([fx, ph], k) => { const u = ((n + ph) % 8) / 8; if (u < 0.9) put(Math.round(x0 + fx * w), Math.round(y0 + 2 - 22 * u), k % 2 ? hat : col); });
  }
  return g;
}
