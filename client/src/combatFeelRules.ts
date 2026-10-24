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

const ELEMENT_TEXT: Record<Element, string> = {
  fire: "#ff9a54", ice: "#b8edff", lightning: "#b9d8ff", poison: "#b6e86b",
  light: "#fff0ae", dark: "#c7a7ff", wood: "#86e88d", wind: "#d9fbff",
};
const ELEMENT_STROKE: Record<Element, string> = {
  fire: "#7d2718", ice: "#245d8d", lightning: "#33479d", poison: "#315c24",
  light: "#87651e", dark: "#39206b", wood: "#235c30", wind: "#477f91",
};

/** Màu / cỡ chữ hiển thị, tách rõ hồi máu, khiên và chí mạng khỏi sát thương thường. */
export function damageTextStyle(kind: DamageTextKind, crit: boolean, el?: Element) {
  if (kind === "heal") return { color: "#7dff8a", stroke: "#1f5a2a", font: 13 };
  if (kind === "shield") return { color: "#9ad8ff", stroke: "#24527a", font: 13 };
  if (kind === "immune") return { color: "#d8d8e8", stroke: "#3a3a52", font: 12 };
  return { color: el ? ELEMENT_TEXT[el] : crit ? "#ffe14d" : "#ff7b72", stroke: el ? ELEMENT_STROKE[el] : "#1a1020", font: crit ? 16 : 12 };
}
