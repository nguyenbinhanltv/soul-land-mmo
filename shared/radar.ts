// Hàm thuần của radar và bản đồ khu vực (GAME_DESIGN.md mục 5.17): chiếu thế giới → radar, kẹp mũi tên vào mép tròn, xếp chấm theo
// ưu tiên. Dùng chung client (vẽ) và kiểm thử; không phụ thuộc Phaser / DOM. Số liệu ở `RADAR` (data.ts).
import { RADAR, TILE } from "./data.ts";

/** "iso": xoay khớp màn hình isometric (đi lên màn hình thì chấm đi lên radar); "flat": nhìn thẳng theo lưới Tiled (Bắc = lên). */
export type RadarMode = "iso" | "flat";
export interface RadarPt { x: number; y: number }

const SQRT1_2 = Math.SQRT1_2;

/**
 * Vector thế giới (pixel) → mặt phẳng radar, cùng đơn vị, y xuống. Isometric là phép xoay 45° (không ép dọc 2:1) nên vòng tròn trên
 * mặt đất vẫn tròn: hướng màn hình "lên" là thế giới (−1, −1), nên ra (0, −√2); "phải" là (1, −1) → (√2, 0).
 */
export function radarRotate(dx: number, dy: number, mode: RadarMode): RadarPt {
  return mode === "iso" ? { x: (dx - dy) * SQRT1_2, y: (dx + dy) * SQRT1_2 } : { x: dx, y: dy };
}

/** Ngược lại `radarRotate`: điểm trên mặt phẳng radar (bấm chuột, đặt cờ) → vector thế giới (pixel). */
export function radarUnrotate(rx: number, ry: number, mode: RadarMode): RadarPt {
  return mode === "iso" ? { x: (rx + ry) * SQRT1_2, y: (ry - rx) * SQRT1_2 } : { x: rx, y: ry };
}

/** Góc (radian, hệ canvas: 0 = phải, dương = chiều kim đồng hồ) của hướng Bắc (thế giới −y) trên radar: iso lên-phải, thẳng lên. */
export function radarNorthAngle(mode: RadarMode): number {
  const n = radarRotate(0, -1, mode);
  return Math.atan2(n.y, n.x);
}

/** Góc quay của ảnh la bàn (mũi Bắc hướng lên trong ảnh) để mũi Bắc trùng `radarNorthAngle`. Đánh dấu Bắc bằng code bám theo góc này. */
export const radarCompassRotation = (mode: RadarMode) => radarNorthAngle(mode) + Math.PI / 2;

export interface RadarPlace {
  /** Vị trí trên radar so với tâm (pixel), đã kẹp vào mép (lùi `inset`) khi ngoài tầm. */
  x: number; y: number;
  /** Ngoài tầm (nằm ngoài vòng bán kính `rTiles`); chỉ lúc đó mới vẽ mũi tên. */
  outside: boolean;
  /** Khoảng cách tới tâm, theo ô (làm tròn xuống ở chỗ hiển thị). */
  tiles: number;
  /** Góc (radian, hệ canvas) từ tâm tới mục tiêu, để xoay mũi tên. */
  angle: number;
}

/**
 * Đặt một điểm lên radar: `dx`, `dy` là hiệu tọa độ thế giới (pixel) mục tiêu − mình; `rTiles` bán kính tầm (ô); `rPx` bán kính vòng
 * radar (pixel). Trong tầm: chiếu tỉ lệ `rPx / (rTiles·TILE)`. Ngoài tầm: kẹp vào mép, lùi `inset` pixel (mặc định `RADAR.arrowInset`).
 */
export function radarPlace(dx: number, dy: number, mode: RadarMode, rTiles: number, rPx: number, inset = RADAR.arrowInset): RadarPlace {
  if (rTiles <= 0) rTiles = 1e-9;
  const v = radarRotate(dx, dy, mode), len = Math.hypot(v.x, v.y);
  const tiles = len / TILE, angle = len < 1e-9 ? 0 : Math.atan2(v.y, v.x);
  if (tiles <= rTiles) { const k = rPx / (rTiles * TILE); return { x: v.x * k, y: v.y * k, outside: false, tiles, angle }; }
  const e = clampToCircle(v.x, v.y, Math.max(0, rPx - inset));
  return { x: e.x, y: e.y, outside: true, tiles, angle };
}

/** Kẹp điểm (x, y) (so với tâm) vào đĩa bán kính `r`: trong đĩa giữ nguyên, ngoài thì đưa về mép theo đúng hướng; (0, 0) giữ nguyên. */
export function clampToCircle(x: number, y: number, r: number): RadarPt {
  const l = Math.hypot(x, y);
  return l <= r || l < 1e-9 ? { x, y } : { x: (x / l) * r, y: (y / l) * r };
}

/** Điểm radar (pixel so với tâm) có nằm trong vòng bán kính `rPx` không (để bắt chuột / chạm vào radar). */
export const radarHit = (x: number, y: number, rPx: number) => x * x + y * y <= rPx * rPx;

/** Mức phóng kế (`dir` +1 phóng to = tầm nhỏ lại, −1 thu nhỏ); kẹp ở hai đầu bảng `RADAR.zooms`. Chỉ số ngoài bảng được kẹp trước. */
export function radarZoomStep(idx: number, dir: 1 | -1): number {
  const last = RADAR.zooms.length - 1, cur = Math.min(last, Math.max(0, Math.round(idx)));
  return Math.min(last, Math.max(0, cur - dir));
}

/** Mức ưu tiên của loại chấm (`RADAR.levels[].id`); loại lạ thì 0 (vẽ dưới cùng, không đè ai). */
export const radarPrio = (id: string) => RADAR.levels.find((l) => l.id === id)?.prio ?? 0;

/** Xếp chấm để vẽ: ưu tiên thấp trước, cao sau (đè lên); cùng mức giữ nguyên thứ tự đầu vào (sắp ổn định). Không sửa mảng gốc. */
export function radarSortDots<T extends { prio: number }>(dots: readonly T[]): T[] {
  return dots.map((d, i) => ({ d, i })).sort((a, b) => a.d.prio - b.d.prio || a.i - b.i).map((o) => o.d);
}

/** Chấm để hiện tên khi rê chuột / chạm: trong `hitPx` pixel của (x, y), ưu tiên cao nhất rồi gần nhất; không có thì undefined. */
export function radarPick<T extends RadarPt & { prio: number }>(dots: readonly T[], x: number, y: number, hitPx = RADAR.hitPx): T | undefined {
  let best: T | undefined, bd = Infinity;
  for (const d of dots) {
    const dist = Math.hypot(d.x - x, d.y - y); if (dist > hitPx) continue;
    if (!best || d.prio > best.prio || (d.prio === best.prio && dist < bd)) { best = d; bd = dist; }
  }
  return best;
}
