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
/** Ngưỡng và độ trễ của bộ điều tốc (ms / khung): hạ khi trung bình chậm hơn `SLOW_MS` quá `DROP_AFTER`, nâng lại khi nhanh hơn `FAST_MS` đủ `RISE_AFTER`.
 * Màn khóa nhịp thấp (30 Hz: tiết kiệm pin) không phải máy chậm: chu kỳ vsync ước bằng phân vị `PERIOD_PCT` của `WINDOW` khung, lấy giá trị NHỎ NHẤT từng thấy trong phiên (tối đa `PERIOD_MAX`):
 * màn từng chạy ~16,7 ms là màn 60 Hz nên khung 33 ms đều trên đó là chậm; chỉ khi chưa bao giờ thấy khung nhanh mới coi là màn khóa 30 Hz.
 * Chỉ coi là chậm khi `avg` vượt `SLOW_K` × chu kỳ đó (và vẫn phải vượt `SLOW_MS`). */
export const GOV = { SLOW_MS: 1000 / 50, FAST_MS: 1000 / 57, DROP_AFTER: 2000, RISE_AFTER: 12000, SKIP_MS: 250, ALPHA: 0.06, WINDOW: 120, WARM: 30, PERIOD_PCT: 0.1, PERIOD_MAX: 34, SLOW_K: 1.25 };
export class FxGovernor {
  /** Trần mức do FPS (không phải do người chơi chọn). */
  cap: FeelLevel = "high";
  avg = 1000 / 60;
  private bad = 0; private good = 0;
  private win: number[] = []; private wi = 0; private period = 0; private tmp: number[] = [];
  /** Chu kỳ vsync nhanh nhất từng ước được (ms); 0 khi chưa đủ mẫu. */
  private slowLimit(): number {
    return this.period > 0 ? Math.max(GOV.SLOW_MS, Math.min(this.period, GOV.PERIOD_MAX) * GOV.SLOW_K) : GOV.SLOW_MS;
  }
  private sample(dt: number) {
    if (this.win.length < GOV.WINDOW) this.win.push(dt); else { this.win[this.wi] = dt; this.wi = (this.wi + 1) % GOV.WINDOW; }
    const full = this.win.length === GOV.WINDOW;
    if (full ? this.wi % 10 === 0 : this.win.length >= GOV.WARM && this.win.length % 10 === 0) {
      const a = this.tmp; a.length = this.win.length;
      for (let i = 0; i < a.length; i++) a[i] = this.win[i];
      a.sort((x, y) => x - y);
      const p = a[Math.floor((a.length - 1) * GOV.PERIOD_PCT)];
      // Giữ nhịp nhanh nhất từng thấy: máy 60 Hz giật đều 30 FPS vẫn bị coi là chậm.
      this.period = this.period > 0 ? Math.min(this.period, p) : p;
    }
  }
  /** Mức hiện hành sau khi trừ trần FPS. */
  effective(user: FeelLevel): FeelLevel { return LEVELS[Math.min(LEVELS.indexOf(user), LEVELS.indexOf(this.cap))]; }
  /** Mỗi khung (dt ms). Khung dài bất thường (đổi tab, dừng hình) bỏ qua. Trả true khi vừa đổi trần. */
  feed(dt: number, user: FeelLevel): boolean {
    if (!(dt > 0) || dt > GOV.SKIP_MS) return false;
    this.avg += (dt - this.avg) * GOV.ALPHA;
    this.sample(dt);
    const eff = LEVELS.indexOf(this.effective(user));
    if (this.avg > this.slowLimit() && eff > 0) {
      this.good = 0; this.bad += dt;
      if (this.bad >= GOV.DROP_AFTER) { this.cap = LEVELS[eff - 1]; this.bad = 0; this.avg = 1000 / 60; return true; }
    } else if (this.avg < GOV.FAST_MS && LEVELS.indexOf(this.cap) < LEVELS.length - 1) {
      this.bad = 0; this.good += dt;
      if (this.good >= GOV.RISE_AFTER) { this.cap = LEVELS[LEVELS.indexOf(this.cap) + 1]; this.good = 0; return true; }
    } else { this.bad = 0; this.good = 0; }
    return false;
  }
  reset() { this.cap = "high"; this.avg = 1000 / 60; this.bad = this.good = 0; this.win = []; this.wi = 0; /* period giữ nguyên: tần số màn là đặc tính máy */ }
}
