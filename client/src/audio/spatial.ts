export interface AudioPoint { x: number; y: number; }
export interface SpatialMix { volume: number; pan: number; }

export const AUDIO_RANGE = 320;

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value));

/** Giảm âm lượng theo bình phương khoảng cách và lệch trái/phải theo trục ngang màn chơi. */
export function spatialMix(source: AudioPoint, listener: AudioPoint, range = AUDIO_RANGE): SpatialMix | null {
  if (!Number.isFinite(range) || range <= 0) return null;
  const dx = source.x - listener.x, dy = source.y - listener.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance > range) return null;
  const ratio = distance / range;
  const screenDx = dx - dy; // iso.ts: sx = x - y, nên pan dùng trục ngang sau phép chiếu.
  return { volume: 1 - 0.8 * ratio * ratio, pan: clamp(screenDx / range, -1, 1) };
}
