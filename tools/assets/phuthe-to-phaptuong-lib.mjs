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
export const BODY_HALF = 14;
/**
 * Lấp chỗ trống hình người (cutter trừ nộm nên phụ thể có một khoảng rỗng ngay chỗ thân hồn sư đứng): mỗi hàng ngang gốc chân (trong ±BODY_HALF điểm),
 * khoảng trong suốt hẹp (≤ maxGap điểm) kẹp giữa hai điểm đặc được tô bằng màu điểm đặc bên cạnh tối đi một chút (bóng sau lưng). Chỉ dùng khi pháp tướng
 * dời xa thân (display dx / dy lớn) làm lộ chỗ rỗng; không dùng cho vật cứng (búa, kiếm: lõm thật); khoảng rỗng xa thân (kẽ cánh, kẽ lá) giữ nguyên. Trả khung mới.
 */
export function fillBodyHole(im, maxGap = 24, F = im.w) {
  const o = new Img(im.w, im.h, new Uint8Array(im.data)), cx = srcOrigin(F)[0];
  for (let y = 0; y < im.h; y++) {
    let x = 0;
    while (x < im.w) {
      if (im.alpha(x, y)) { x++; continue; }
      let x1 = x; while (x1 < im.w && !im.alpha(x1, y)) x1++;
      if (x > 0 && x1 < im.w && x1 - x <= maxGap && x >= cx - BODY_HALF && x1 <= cx + BODY_HALF + 1) {
        const L = im.get(x - 1, y), R = im.get(x1, y);
        for (let k = x; k < x1; k++) { const p = (k - x) * 2 < x1 - x ? L : R; o.set(k, y, [(p[0] * 0.55) | 0, (p[1] * 0.55) | 0, (p[2] * 0.55) | 0, 255]); }
      }
      x = x1;
    }
  }
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
 * opt: { group: PtGroup, fill: số điểm tối đa của khoảng lấp hình người (mặc định 0 = không lấp: ở ×1, gốc trùng chân hồn sư thì thân hồn sư lấp đúng chỗ rỗng), scale: ép hệ số phóng (mặc định `pickScale`) }.
 * Trả { sheet (2560×800), scale, clipped: số điểm bị cắt khỏi khung 160, colors }.
 */
export function buildSheet(source, opt = {}) {
  const { F, anim } = source, pose = poseOf(opt.group), fill = opt.fill ?? 0;
  const flat = (fr) => { const im = composeHalves(fr.back, fr.front); return fill ? fillBodyHole(im, fill, F) : im; };
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
