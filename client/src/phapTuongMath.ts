// Hàm thuần của pháp tướng (không phụ thuộc Phaser, để client/scripts/phaptuong-test.mjs kiểm bằng Node).
import { PT_DIRS, PT_BACK_DIRS, PT_STRIKE, PT_ATTACK_N, type PtDir } from "../../shared/data.ts";
import type { Dir8 } from "./iso.ts";

export const FLIP: Partial<Record<Dir8, PtDir>> = { sw: "se", w: "e", nw: "ne" };
/** Hướng nhìn → vectơ đơn vị trên màn hình (đòn lao theo hướng đó). */
export const DIRV: Record<Dir8, [number, number]> = {
  s: [0, 1], se: [0.89, 0.45], e: [1, 0], ne: [0.89, -0.45], n: [0, -1], nw: [-0.89, -0.45], w: [-1, 0], sw: [-0.89, 0.45],
};
export const ease = (t: number) => t * t * (3 - 2 * t);
export const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

/** Chuẩn hóa hướng hồn sư về (hàng sheet, có lật không). */
export function ptRow(face: Dir8): { row: number; flip: boolean; dir: PtDir } {
  const f = FLIP[face], dir = (f ?? face) as PtDir;
  return { row: Math.max(0, PT_DIRS.indexOf(dir)), flip: !!f, dir };
}
/** Lớp vẽ: hướng s / se / e sau thân, ne / n trước thân (mờ PT_FRONT_ALPHA). */
export const ptIsBack = (dir: PtDir) => PT_BACK_DIRS.includes(dir);

/** Khung "đánh" liên tục 0..PT_ATTACK_N-1 theo thời gian `ts` (giây) từ lúc ra tay; ngoài khoảng trả -1. Giữ khung ra đòn suốt lúc dừng hình. */
export function ptStrikeFrame(ts: number): number {
  const { windup: w, hit: h, stop: s, recover: r } = PT_STRIKE;
  if (ts < 0 || ts >= w + h + s + r) return -1;
  const n = PT_ATTACK_N - 1, hitF = n * 0.62;
  if (ts < w) return (ts / w) * (n * 0.38);
  if (ts < w + h) return n * 0.38 + ((ts - w) / h) * (hitF - n * 0.38);
  if (ts < w + h + s) return hitF;
  return hitF + ((ts - w - h - s) / r) * (n - hitF);
}
/** Đường cong đà đòn 0..1 (-0,5 lúc lấy đà, 1 lúc ra đòn / dừng, về 0). */
export function ptStrikeCurve(ts: number): number {
  const { windup: w, hit: h, stop: s, recover: r } = PT_STRIKE;
  if (ts < 0 || ts >= w + h + s + r) return 0;
  if (ts < w) return -0.5 * ease(ts / w);
  if (ts < w + h) return -0.5 + 1.5 * ease((ts - w) / h);
  if (ts < w + h + s) return 1;
  return 1 - ease((ts - w - h - s) / r);
}

