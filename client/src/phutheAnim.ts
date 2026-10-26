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
  const o = (anim && typeof anim === "object" ? anim : {}) as { cols?: unknown; clips?: Record<string, Partial<PhuSlot>>; offset?: Record<string, unknown> };
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
  return { frame: f, cols: declared as number, clips, offset };
}

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
 */
export function phuClipIndex(n: number, steps: number, step: number, loop: boolean, age: number, total: number): number {
  const p = !loop && age >= 0 && total > 0 ? age / total : (Math.max(0, Math.min(steps - 1, step)) + 0.5) / steps;
  return Math.max(0, Math.min(n - 1, Math.floor(p * n)));
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
