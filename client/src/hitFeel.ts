// S1 (#542): cảm giác đánh theo độ nặng, chất liệu, hệ. Hàm thuần + tia lửa dùng lớp hạt có sẵn; chỉ hiển thị ở client
// (hằng số ở đây là độ dài / độ mạnh hiệu ứng, KHÔNG phải số cân bằng). KHÔNG rung màn: rung vẫn do `beastJerk` / `SHAKE_TIER` ở combatFx.
import type { Element, Material } from "./audio/soundMap.ts";
import { ELEMENT_COL } from "./skillFx.ts";
import { fxPrefs, type ParticleLayer } from "./combatFx.ts";

/** Độ nặng đòn 0..3: tỉ lệ sát thương / sinh lực tối đa, chí mạng, kết liễu, và độ nặng khai báo của chiêu (`SKILL_VISUAL.heavy`). */
export function hitWeight(ratio: number, crit: boolean, kill: boolean, heavy = 0): 0 | 1 | 2 | 3 {
  const w = (ratio > 0.02 ? 1 : 0) + (crit ? 1 : 0) + (kill ? 1 : 0) + Math.min(2, heavy);
  return Math.min(3, w) as 0 | 1 | 2 | 3;
}
/** Giật lùi thân quái (chỉ hình, pixel gốc nhân SPR) theo độ nặng: nhẹ, không đẩy quái đi xa. */
export const KNOCK_PX: readonly number[] = [2, 3, 4, 5];

/** Tia lửa theo chất liệu mục tiêu (bảng chất liệu G2): màu, số tia, tốc độ, trọng lực (mảnh vỡ rơi, tia kim loại bay thẳng). */
export const MATERIAL_SPARK: Record<Material, { col: number; n: number; speed: number; size: number; gravity: number; life: number }> = {
  thit: { col: 0xd8503c, n: 4, speed: 55, size: 2, gravity: 40, life: 0.32 },  // giọt đỏ rơi xuống
  giap: { col: 0xffe9a0, n: 7, speed: 130, size: 1, gravity: 10, life: 0.22 }, // tia vàng nhỏ, nhanh, bay thẳng
  bang: { col: 0xcdf3ff, n: 6, speed: 80, size: 2, gravity: 55, life: 0.4 },   // mảnh băng vỡ rơi
  go:   { col: 0xb98a55, n: 5, speed: 65, size: 2, gravity: 45, life: 0.36 },  // vụn gỗ
};
/** Số tia nhân theo mức hiệu ứng (Thấp: không tia, giống hạt chung). */
const SPARK_K = { low: 0, mid: 1, high: 1.6 } as const;

/** Tia lửa theo chất liệu + hệ của đòn tại (x, y); độ nặng nhiều hơn thì nhiều và nhanh hơn. */
export function materialSparks(fxp: ParticleLayer, mat: Material, el: Element | undefined, x: number, y: number, weight: number, px: number) {
  const k = SPARK_K[fxPrefs.level]; if (k <= 0) return;
  const m = MATERIAL_SPARK[mat], n = Math.round(m.n * k * (1 + weight * 0.35)), hi = el ? ELEMENT_COL[el].hi : 0xffffff;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = m.speed * px / 2 * (0.5 + Math.random() * 0.6) * (1 + weight * 0.12);
    fxp.emit(x, y, i % 3 === 0 ? hi : m.col, { vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7 - 12, life: m.life * (0.7 + Math.random() * 0.5), size: m.size + (weight >= 2 && i % 4 === 0 ? 1 : 0), gravity: m.gravity });
  }
}

/** Kiểu số sát thương theo hệ người đánh + chí mạng: viền theo màu tối của hệ, chí mạng chữ to hơn khi mức Vừa / Cao. */
export function damageStyle(el: Element | undefined, crit: boolean, mine: boolean) {
  return {
    stroke: el && mine ? ELEMENT_COL[el].lo : 0x1a1020,
    font: crit ? (fxPrefs.level === "low" ? 24 : 30) : 12,
  };
}
