// Hoạt ảnh vẽ thật của phụ thể võ hồn (Phụ thể v2 P2, #1023; đặc tả docs/art/phu-the-hoat-anh.md): sheet game `vhanim_{id}_b` / `_f` (nửa sau / nửa
// trước thân), mỗi giới một nửa (5 hàng hướng s, se, e, ne, n), cột theo clip idle / walk / attack / cast / hurt. Module thuần (không Phaser,
// không tạo object mỗi khung) để kiểm bằng node: chọn khung theo giờ của hoạt ảnh thân (không dùng animation của Phaser, không đồng hồ riêng).
import type { Dir8 } from "./iso.ts";

export type PhuClip = "idle" | "walk" | "attack" | "cast" | "hurt";
export const PHU_CLIPS: readonly PhuClip[] = ["idle", "walk", "attack", "cast", "hurt"];
/** 5 hướng vẽ thật theo thứ tự hàng; sw, w, nw dùng se, e, ne lật ngang (ISO_DIRS). */
export const PHU_DIRS = ["s", "se", "e", "ne", "n"] as const;
/** Số hàng hướng của một nửa giới; sheet đủ hai giới cao 2 × PHU_DIRS.length khung (nam rồi nữ, như ISO_VH_ORIGIN / vohonHalf). */
export const PHU_ROWS_PER_SEX = PHU_DIRS.length;
/** Khung vuông hợp lệ; gốc chân cách mép trên `gy` (96: 74, 128: 90 = gốc thân (32, 58) + mở rộng mỗi phía). */
export const PHU_FRAMES = { 96: 74, 128: 90 } as const;

export interface PhuSlot { col: number; n: number }
export interface PhuLayout {
  frame: 96 | 128; cols: number;
  clips: Record<PhuClip, PhuSlot>;
  /** Độ dời cố định của clip (pixel khung, +x theo hướng nhìn): manifest `anim.offset`, mặc định 0. */
  offset: Record<PhuClip, readonly [number, number]>;
  /** Hướng vẽ thật đã nhập (manifest `anim.dirsOk`, theo PHU_DIRS); thiếu = đủ 5 hướng (võ hồn nhập đủ). Hướng ngoài danh sách dùng phụ thể tĩnh cũ (phuDirOk). */
  dirsOk?: readonly (typeof PHU_DIRS)[number][];
  /** Sheet VŨ KHÍ cầm tay (`vkanim_{id}`, manifest `anim.kind: "vukhi"`, docs/art phu-the-vu-khi, #1312): cùng bố cục như phụ thể hoạt ảnh nhưng ẩn khi Chân Thân và dao động riêng (weaponOscK). */
  weapon?: true;
  /** Điểm cầm đã bake (manifest `anim.grip["<hướng>/<clip>/<khung>"] = [x, y, (x2, y2)]`, điểm ảnh khung từ gốc chân, +x theo hướng nhìn gốc, tay thuận trước, đo trên thân nam). */
  grip?: Readonly<Record<string, readonly number[]>>;
}

/** Bố cục mặc định theo đặc tả (nhóm B / C: 22 cột): idle 4, walk 6, attack 6, cast 4, hurt 2. Số khung thật do manifest `anim` ghi. */
export const PHU_DEFAULT_CLIPS: Record<PhuClip, PhuSlot> = {
  idle: { col: 0, n: 4 }, walk: { col: 4, n: 6 }, attack: { col: 10, n: 6 }, cast: { col: 16, n: 4 }, hurt: { col: 20, n: 2 },
};
const ZERO: readonly [number, number] = [0, 0];

/**
 * Đọc `anim` trong manifest + `frame` của sheet; hợp lệ thì trả bố cục, hỏng / thiếu thì null (võ hồn chạy nhánh cũ: phụ thể tĩnh + spiritMotion).
 * `anim` ghi `clips` (cột đầu + số khung từng clip); thiếu `clips` thì dùng bố cục mặc định 22 cột.
 */
export function parsePhuLayout(anim: unknown, frame: unknown): PhuLayout | null {
  const f = Array.isArray(frame) ? frame[0] : frame;
  if (f !== 96 && f !== 128) return null;
  const o = (anim && typeof anim === "object" ? anim : {}) as { cols?: unknown; clips?: Record<string, Partial<PhuSlot>>; offset?: Record<string, unknown>; dirsOk?: unknown; kind?: unknown; grip?: unknown };
  const clips = {} as Record<PhuClip, PhuSlot>, offset = {} as Record<PhuClip, readonly [number, number]>;
  let cols = 0;
  for (const c of PHU_CLIPS) {
    const s = o.clips ? o.clips[c] : PHU_DEFAULT_CLIPS[c];
    if (!s || !Number.isInteger(s.col) || !Number.isInteger(s.n) || (s.col as number) < 0 || (s.n as number) < 1) return null;
    clips[c] = { col: s.col as number, n: s.n as number };
    cols = Math.max(cols, (s.col as number) + (s.n as number));
    const d = o.offset?.[c];
    offset[c] = Array.isArray(d) && Number.isFinite(d[0]) && Number.isFinite(d[1]) ? [d[0], d[1]] : ZERO;
  }
  const declared = o.cols === undefined ? cols : o.cols;
  if (!Number.isInteger(declared) || (declared as number) < cols) return null;
  // dirsOk: lọc giá trị lạ / trùng, theo thứ tự PHU_DIRS; đủ 5 hướng (hoặc không khai, hoặc không phải mảng) = không ghi (hành vi cũ)
  const ok = Array.isArray(o.dirsOk) ? PHU_DIRS.filter((d) => (o.dirsOk as unknown[]).includes(d)) : null;
  const grip = o.kind === "vukhi" ? parseGrip(o.grip) : null;
  return { frame: f, cols: declared as number, clips, offset, ...(ok && ok.length < PHU_DIRS.length ? { dirsOk: ok } : {}), ...(o.kind === "vukhi" ? { weapon: true as const } : {}), ...(grip ? { grip } : {}) };
}

/** Khóa điểm cầm hợp lệ: `<hướng>/<clip>/<khung>`; giá trị 2 hoặc 4 số hữu hạn (tay thuận, tay kia). Mục hỏng bị bỏ (điểm cầm chỉ để bù lệch / gắn hiệu ứng, không chặn sheet). */
const GRIP_KEY = /^(s|se|e|ne|n)\/(idle|walk|attack|cast|hurt)\/\d+$/;
function parseGrip(g: unknown): Record<string, readonly number[]> | null {
  if (!g || typeof g !== "object") return null;
  const out: Record<string, readonly number[]> = {};
  for (const [k, v] of Object.entries(g as Record<string, unknown>)) {
    if (GRIP_KEY.test(k) && Array.isArray(v) && (v.length === 2 || v.length === 4) && v.every((x) => typeof x === "number" && Number.isFinite(x))) out[k] = v as number[];
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Điểm cầm (điểm ảnh khung, tính từ GỐC CHÂN, +x sang phải màn hình, +y xuống) của khung `i` clip `clip` hướng `face` của sheet vũ khí; `hand` 0 = tay thuận, 1 = tay kia.
 * Hướng tây lật ngang hướng đông tương ứng (đổi dấu x). Không có điểm cầm (sheet cũ, khung đo không ra tay, tay không có) thì null.
 */
export function phuGripAt(L: PhuLayout, face: Dir8, clip: PhuClip, i: number, hand = 0): readonly [number, number] | null {
  const v = L.grip?.[`${PHU_DIRS[phuDirRow(face)]}/${clip}/${Math.max(0, Math.min(L.clips[clip].n - 1, i))}`];
  if (!v || v.length < 2 * (hand + 1)) return null;
  return [phuFlip(face) ? -v[2 * hand] : v[2 * hand], v[2 * hand + 1]];
}

/**
 * Vũ khí cầm tay thu về khi hồn sư đang Chân Thân (`ava` > 0 của người chơi) mà võ hồn có pháp tướng: không để vũ khí và pháp tướng của cùng một võ hồn chen nhau
 * (phu-the-vu-khi, quy tắc 5). Võ hồn chưa có pháp tướng thì vũ khí ở lại. Hết Chân Thân thì hiện lại.
 */
export const weaponHidden = (ava: number, hasPhapTuong: boolean): boolean => ava > 0 && hasPhapTuong;

/**
 * Hướng 8 `face` có hoạt ảnh vẽ thật không. Tây (sw, w, nw) lật hướng đông tương ứng nên theo hàng nguồn (se, e, ne): nguồn chưa nhập thì cả hai
 * phía dùng phụ thể tĩnh cũ. Layout không có `dirsOk` (đủ 5 hướng, manifest cũ) luôn đúng.
 */
export const phuDirOk = (L: PhuLayout, face: Dir8): boolean => !L.dirsOk || (L.dirsOk as readonly string[]).includes(PHU_DIRS[phuDirRow(face)]);

/** Hàng hướng (0–4) của hướng 8 trên màn hình; se / ne chọn hàng riêng (thân vẫn dùng hàng `e`). */
export function phuDirRow(face: Dir8): number {
  switch (face) {
    case "s": return 0;
    case "se": case "sw": return 1;
    case "e": case "w": return 2;
    case "ne": case "nw": return 3;
    default: return 4;
  }
}
/** Hướng tây (sw, w, nw) lật ngang hướng đông tương ứng. */
export const phuFlip = (face: Dir8): boolean => face === "sw" || face === "w" || face === "nw";

/**
 * Hướng 8 dùng chọn hàng phụ thể: thân LPC chỉ hiện 4 hướng (`shown`, có trễ giữ hướng) còn phụ thể có 5 hướng vẽ, nên khi thân đang hiện hướng
 * ngang (e / w) thì lấy hướng thật `face` nếu cùng bên (se / ne chọn hàng riêng); khác bên (đang chờ đổi hướng) thì theo thân để hai lớp không lệch nhau.
 */
export function phuFaceOf(shown: Dir8 | null, face: Dir8): Dir8 {
  if (shown === null) return face;
  if (shown === "e") return face === "se" || face === "ne" ? face : shown;
  if (shown === "w") return face === "sw" || face === "nw" ? face : shown;
  return shown;
}

/** Hoạt ảnh thân (HsAnim) → clip phụ thể; die: null (phụ thể ẩn), absorb: idle (mờ 60% do nơi gọi). */
export function phuClipOf(anim: string): PhuClip | null {
  switch (anim) {
    case "idle": case "absorb": return "idle";
    case "walk": case "attack": case "cast": case "hurt": return anim;
    default: return null;
  }
}

/**
 * Khung (0..n-1) của clip phụ thể `n` khung cho hoạt ảnh thân `steps` bước. Vòng lặp (idle, walk): theo bước thân đang hiển thị `step` (các bước
 * thân đều nhau nên khớp nhịp cả khi `walk` đổi tốc độ). Một lần (attack, cast, hurt): chia đều thời lượng `total` ms theo tuổi `age`
 * (docs "Ánh xạ clip phụ thể sang khung thân"); `age` < 0 (không biết) thì theo giữa bước thân.
 * Vũ khí chọn khung có bước thân đã bake gần `step` nhất; ưu tiên chỉ số cũ khi hòa để giữ tiến độ pose.
 */
export function phuClipIndex(n: number, steps: number, step: number, loop: boolean, age: number, total: number, weapon = false, bodyMs?: readonly number[]): number {
  const p = !loop && age >= 0 && total > 0 ? age / total : (Math.max(0, Math.min(steps - 1, step)) + 0.5) / steps;
  let index = Math.max(0, Math.min(n - 1, Math.floor(p * n)));
  if (weapon && Number.isFinite(step)) {
    if (bodyMs?.length === steps) {
      let distance = Math.abs(phuBodyStep(bodyMs, n, index) - step);
      for (let i = 0; i < n; i++) { const d = Math.abs(phuBodyStep(bodyMs, n, i) - step); if (d < distance) { index = i; distance = d; } }
    } else if (n === steps) index = Math.max(0, Math.min(n - 1, step));
  }
  return index;
}

/** Bước thân (0..steps-1) mà khung `i` của clip `n` khung hiển thị ở giữa đoạn thời gian của nó, theo `ms` từng bước của thân (tâm rơi đúng ranh giới thì lấy bước sau). */
export function phuBodyStep(ms: readonly number[], n: number, i: number): number {
  const total = ms.reduce((a, b) => a + b, 0), mid = (i + 0.5) / n * total;
  let acc = 0;
  for (let s = 0; s < ms.length; s++) { acc += ms[s]; if (mid < acc) return s; }
  return ms.length - 1;
}

/** Chỉ số khung trong sheet (đánh số theo hàng) của khung `i` clip `clip` ở hàng hướng `dir`, nửa giới `half` (0 nam / 1 nữ). */
export function phuFrame(L: PhuLayout, clip: PhuClip, dir: number, half: number, i: number): number {
  const s = L.clips[clip];
  return (half * PHU_ROWS_PER_SEX + dir) * L.cols + s.col + Math.max(0, Math.min(s.n - 1, i));
}

/** Nửa giới theo kích thước thật của sheet: thân nữ (`lpcc_f_…`) dùng nửa nữ nếu sheet có đủ hai nửa. */
export function phuHalf(texHeight: number, L: PhuLayout, female: boolean): number {
  return female && texHeight >= 2 * PHU_ROWS_PER_SEX * L.frame ? 1 : 0;
}

/** Sheet có đúng bố cục theo bố cục khai không (rộng = cols × khung, cao ≥ một nửa giới). */
export const phuSheetFits = (w: number, h: number, L: PhuLayout): boolean => w === L.cols * L.frame && h >= PHU_ROWS_PER_SEX * L.frame && h % (PHU_ROWS_PER_SEX * L.frame) === 0;

/** Gốc dọc của khung (tỉ lệ 0..1, cho setOrigin) theo cỡ khung. */
export const phuOriginY = (frame: 96 | 128): number => PHU_FRAMES[frame] / frame;
