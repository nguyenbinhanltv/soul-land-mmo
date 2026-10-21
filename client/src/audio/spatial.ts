import { worldToScreen } from "../iso.ts";

export interface AudioPoint { x: number; y: number; }
export interface SpatialMix { volume: number; pan: number; }

export const AUDIO_RANGE = 320;

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value));

type ScreenXProjection = (x: number, y: number) => number;

export function panFromProjection(source: AudioPoint, listener: AudioPoint, range: number, projectX: ScreenXProjection = (x, y) => worldToScreen(x, y).x): number {
  if (!Number.isFinite(range) || range <= 0) return 0;
  const sourceX = projectX(source.x, source.y), listenerX = projectX(listener.x, listener.y);
  const screenRange = Math.abs(projectX(listener.x + range, listener.y) - listenerX);
  const screenDx = sourceX - listenerX;
  return Number.isFinite(screenDx) && Number.isFinite(screenRange) && screenRange > 0 ? clamp(screenDx / screenRange, -1, 1) : 0;
}

/** Giảm âm lượng theo bình phương khoảng cách và lệch trái/phải theo trục ngang màn chơi. */
export function spatialMix(source: AudioPoint, listener: AudioPoint, range = AUDIO_RANGE): SpatialMix | null {
  if (!Number.isFinite(range) || range <= 0) return null;
  const dx = source.x - listener.x, dy = source.y - listener.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance > range) return null;
  const ratio = distance / range;
  return { volume: 1 - 0.8 * ratio * ratio, pan: panFromProjection(source, listener, range) };
}
