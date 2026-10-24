import type { Element } from "./audio/soundMap.ts";

export type FeelLevel = "low" | "mid" | "high";
export type HitFeelHe = "cuong_cong" | "man_cong" | "khong_che" | "phu_tro";
export type DamageTextKind = "damage" | "crit" | "heal" | "shield" | "immune";

/** Hình và nhịp riêng của bốn hệ đánh, không dùng màu làm dấu hiệu duy nhất. */
export const HIT_HE_STYLE = {
  cuong_cong: { shape: "burst", fps: 18, pulseMs: 170 },
  man_cong: { shape: "slash", fps: 30, pulseMs: 95 },
  khong_che: { shape: "lock", fps: 12, pulseMs: 260 },
  phu_tro: { shape: "cross", fps: 20, pulseMs: 210 },
} as const satisfies Record<HitFeelHe, { shape: string; fps: number; pulseMs: number }>;

/** Số hạt bụi chân mỗi nhịp; Thấp / Giảm chuyển động tắt hoàn toàn, người khác nhẹ hơn. */
export function footDustCount(level: FeelLevel, reduce: boolean, mine: boolean): number {
  if (reduce || level === "low") return 0;
  if (mine) return level === "high" ? 5 : 3;
  return level === "high" ? 2 : 1;
}

export function rootSnareDiameter(width: number, q: number): number {
  return width * q;
}

const ELEMENT_TEXT: Record<Element, string> = {
  fire: "#ff9a54", ice: "#b8edff", lightning: "#b9d8ff", poison: "#b6e86b",
  light: "#fff0ae", dark: "#c7a7ff", wood: "#86e88d", wind: "#d9fbff",
};
const ELEMENT_STROKE: Record<Element, string> = {
  fire: "#7d2718", ice: "#245d8d", lightning: "#33479d", poison: "#315c24",
  light: "#87651e", dark: "#39206b", wood: "#235c30", wind: "#477f91",
};

/** Màu / cỡ chữ hiển thị, tách rõ hồi máu, khiên và chí mạng khỏi sát thương thường. */
export function damageTextStyle(kind: DamageTextKind, crit: boolean, el?: Element, mine = false, serverColor?: string) {
  if (kind === "heal") return { color: "#7dff8a", stroke: "#1f5a2a", font: 13 };
  if (kind === "shield") return { color: "#9ad8ff", stroke: "#24527a", font: 13 };
  if (kind === "immune") return { color: "#d8d8e8", stroke: "#3a3a52", font: 12 };
  if (mine) return { color: "#ff7b72", stroke: "#1a1020", font: crit ? 16 : 12 };
  if (serverColor) return { color: serverColor, stroke: "#1a1020", font: crit ? 16 : 12 };
  if (kind === "crit") return { color: "#ffe14d", stroke: "#70521a", font: 16 };
  return { color: el ? ELEMENT_TEXT[el] : crit ? "#ffe14d" : "#ff7b72", stroke: el ? ELEMENT_STROKE[el] : "#1a1020", font: crit ? 16 : 12 };
}

// ---- H8 (#491): bộ điều tốc mức hiệu ứng theo FPS (thuần, dùng ở combatFx.ts)
const LEVELS: FeelLevel[] = ["low", "mid", "high"];
/** Ngưỡng và độ trễ của bộ điều tốc (ms / khung): hạ khi trung bình chậm hơn `SLOW_MS` quá `DROP_AFTER`, nâng lại khi nhanh hơn `FAST_MS` đủ `RISE_AFTER`. */
export const GOV = { SLOW_MS: 1000 / 50, FAST_MS: 1000 / 57, DROP_AFTER: 2000, RISE_AFTER: 12000, SKIP_MS: 250, ALPHA: 0.06 };
export class FxGovernor {
  /** Trần mức do FPS (không phải do người chơi chọn). */
  cap: FeelLevel = "high";
  avg = 1000 / 60;
  private bad = 0; private good = 0;
  /** Mức hiện hành sau khi trừ trần FPS. */
  effective(user: FeelLevel): FeelLevel { return LEVELS[Math.min(LEVELS.indexOf(user), LEVELS.indexOf(this.cap))]; }
  /** Mỗi khung (dt ms). Khung dài bất thường (đổi tab, dừng hình) bỏ qua. Trả true khi vừa đổi trần. */
  feed(dt: number, user: FeelLevel): boolean {
    if (!(dt > 0) || dt > GOV.SKIP_MS) return false;
    this.avg += (dt - this.avg) * GOV.ALPHA;
    const eff = LEVELS.indexOf(this.effective(user));
    if (this.avg > GOV.SLOW_MS && eff > 0) {
      this.good = 0; this.bad += dt;
      if (this.bad >= GOV.DROP_AFTER) { this.cap = LEVELS[eff - 1]; this.bad = 0; this.avg = 1000 / 60; return true; }
    } else if (this.avg < GOV.FAST_MS && LEVELS.indexOf(this.cap) < LEVELS.length - 1) {
      this.bad = 0; this.good += dt;
      if (this.good >= GOV.RISE_AFTER) { this.cap = LEVELS[LEVELS.indexOf(this.cap) + 1]; this.good = 0; return true; }
    } else { this.bad = 0; this.good = 0; }
    return false;
  }
  reset() { this.cap = "high"; this.avg = 1000 / 60; this.bad = this.good = 0; }
}
