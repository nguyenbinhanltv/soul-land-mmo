// Chữ bay khi nhận đồ / Hồn Tệ / kinh nghiệm (#599, đợt 1c UI v2): phần thuần (không Phaser, không DOM) để test bằng node.
// Chỉ hiển thị: số liệu lấy từ tin `bag` / `bagd` (đồ, Hồn Tệ) và state `xp` của mình; server không đổi, không có số mới.
// GameScene.pickupFloat vẽ kế hoạch này lên cảnh bằng `floatText`.

export type PickupKind = "item" | "coin" | "xp";
export interface PickupLine { kind: PickupKind; text: string; col: string; }
export interface PickupStep extends PickupLine { /** Dịch lên so với đầu nhân vật (px cảnh), mỗi dòng cách nhau. */ dy: number; /** Trễ bắt đầu (ms). */ delay: number; /** Có bay lên không (Giảm chuyển động: chữ đứng yên rồi mờ). */ drift: boolean; }

export const COIN_COL = "#f2c84b", XP_COL = "#9ad8ff";
/** Số dòng tối đa mỗi đợt theo mức hiệu ứng (thấp: chỉ dòng quan trọng nhất), khoảng cách dòng (px) và trễ giữa hai dòng (ms). */
export const MAX_LINES = { low: 1, mid: 3, high: 4 } as const;
export const LINE_GAP = 9, LINE_DELAY = 140;
/** Kinh nghiệm cộng dồn tới chừng này ms thì mới hiện một dòng (mỗi lần hạ thú chỉ một dòng, không nháy liên tục). */
export const XP_FLUSH_MS = 700;

/** Thứ tự ưu tiên khi phải cắt bớt dòng: đồ > Hồn Tệ > kinh nghiệm. */
const RANK: Record<PickupKind, number> = { item: 0, coin: 1, xp: 2 };

/** Kế hoạch hiện các dòng: sắp theo ưu tiên, cắt theo mức hiệu ứng, xếp chồng dọc, so le thời gian. */
export function planPickup(lines: readonly PickupLine[], level: keyof typeof MAX_LINES, reduce: boolean): PickupStep[] {
  const kept = [...lines].sort((a, b) => RANK[a.kind] - RANK[b.kind]).slice(0, MAX_LINES[level]);
  return kept.map((l, i) => ({ ...l, dy: i * LINE_GAP, delay: i * LINE_DELAY, drift: !reduce }));
}

/** Kinh nghiệm vừa tăng bao nhiêu: chỉ tính khi cùng võ hồn và cùng cấp (lên cấp / đổi võ hồn thì xp về 0, không phải mất / nhận). 0 nếu không tăng. */
export function xpDelta(prev: { vh: number; level: number; xp: number } | null, cur: { vh: number; level: number; xp: number }): number {
  if (!prev || prev.vh !== cur.vh || prev.level !== cur.level) return 0;
  return cur.xp > prev.xp ? cur.xp - prev.xp : 0;
}

/** Bộ gom kinh nghiệm: `add(n)` mỗi lần tăng, `take(now)` trả tổng khi đã đủ `XP_FLUSH_MS` kể từ lần tăng đầu (rồi xóa), không thì 0. */
export class XpBatch {
  private sum = 0; private since = 0;
  add(n: number, now: number) { if (n > 0) { if (this.sum === 0) this.since = now; this.sum += n; } }
  take(now: number): number { if (this.sum > 0 && now - this.since >= XP_FLUSH_MS) { const s = this.sum; this.sum = 0; return s; } return 0; }
}

export const xpText = (n: number) => `+${n.toLocaleString("vi-VN")} kinh nghiệm`;
export const coinText = (formatted: string) => `+${formatted}`;
