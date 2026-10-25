// S1 (#542): cảm giác đánh theo độ nặng, chất liệu, hệ. Hàm thuần + tia lửa dùng lớp hạt có sẵn; chỉ hiển thị ở client
// (hằng số ở đây là độ dài / độ mạnh hiệu ứng, KHÔNG phải số cân bằng). KHÔNG rung màn: rung vẫn do `beastJerk` / `SHAKE_TIER` ở combatFx.
import type Phaser from "phaser";
import type { He } from "../../shared/data.ts";
import { COMBAT_MATERIALS, type Element, type Material } from "./audio/soundMap.ts";
import { ELEMENT_COL } from "./skillFx.ts";
import { fxPrefs, HIT_SPARK, type ParticleLayer, fxLevel } from "./combatFx.ts";
import { makeCodeSheet, SheetFx } from "./fxSheet.ts";
import { playPriv } from "./privateAssets.ts";
import { SPR } from "./iso.ts";
import { damageTextStyle, HIT_HE_STYLE } from "./combatFeelRules.ts";

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
  da:   { col: 0x9d9a91, n: 5, speed: 46, size: 2, gravity: 62, life: 0.42 },   // mảnh đá nặng
  linh_the: { col: 0xc8b8ff, n: 6, speed: 72, size: 2, gravity: -18, life: 0.48 }, // hạt linh thể bay nhẹ
};
/** Số tia nhân theo mức hiệu ứng (Thấp: không tia, giống hạt chung). */
const SPARK_K = { low: 0, mid: 1, high: 1.6 } as const;

/** Tia lửa theo chất liệu + hệ của đòn tại (x, y); độ nặng nhiều hơn thì nhiều và nhanh hơn. */
export function materialSparks(fxp: ParticleLayer, mat: Material, el: Element | undefined, x: number, y: number, weight: number, px: number) {
  const k = SPARK_K[fxLevel()]; if (k <= 0) return;
  const m = MATERIAL_SPARK[mat], n = Math.round(m.n * k * (1 + weight * 0.35)), hi = el ? ELEMENT_COL[el].hi : 0xffffff;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = m.speed * px / 2 * (0.5 + Math.random() * 0.6) * (1 + weight * 0.12);
    fxp.emit(x, y, i % 3 === 0 ? hi : m.col, { vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7 - 12, life: m.life * (0.7 + Math.random() * 0.5), size: m.size + (weight >= 2 && i % 4 === 0 ? 1 : 0), gravity: m.gravity });
  }
}

export const HIT_HES: readonly He[] = ["cuong_cong", "man_cong", "khong_che", "phu_tro"];
const hitSheetKey = (mat: Material, he: He, glow = false) => `fxh_${mat}_${he}${glow ? "_glow" : ""}`;

/** Sheet code 6 khung cho tia / mảnh C1; chỉ là fallback pixel đã hậu kỳ bằng code, không phải asset gameplay. */
export function registerHitFeelSheets(scene: Phaser.Scene): void {
  for (const mat of COMBAT_MATERIALS) for (const he of HIT_HES) {
    const spec = MATERIAL_SPARK[mat], spark = HIT_SPARK[he], shape = HIT_HE_STYLE[he].shape;
    makeCodeSheet(scene, hitSheetKey(mat, he), 6, 40, (c, k, size) => {
      const fade = 1 - k * 0.8, r = (5 + k * 10) * (1 + spark.size / 4), core = `#${spark.col.toString(16).padStart(6, "0")}`;
      c.globalAlpha = fade;
      if (shape === "burst") {
        for (let i = 0; i < Math.min(8, spec.n + 2); i++) {
          const a = (i / Math.min(8, spec.n + 2)) * Math.PI * 2, x0 = size / 2 + Math.cos(a) * r * 0.28, y0 = size / 2 + Math.sin(a) * r * 0.16;
          const x1 = size / 2 + Math.cos(a) * r, y1 = size / 2 + Math.sin(a) * r * 0.6;
          c.strokeStyle = "#1a1020"; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
          c.strokeStyle = core; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        }
      } else if (shape === "slash") {
        for (let i = -1; i <= 1; i++) {
          const x = size / 2 + i * 5 - k * 2, y = size / 2 + i * 3;
          c.strokeStyle = "#1a1020"; c.lineWidth = 3; c.beginPath(); c.moveTo(x - r * 0.7, y + r * 0.5); c.lineTo(x + r * 0.7, y - r * 0.5); c.stroke();
          c.strokeStyle = core; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - r * 0.7, y + r * 0.5); c.lineTo(x + r * 0.7, y - r * 0.5); c.stroke();
        }
      } else if (shape === "lock") {
        const a = k * 0.65, cx = size / 2 + Math.cos(a) * 2, cy = size / 2 + Math.sin(a) * 2;
        c.strokeStyle = "#1a1020"; c.lineWidth = 3; c.strokeRect(cx - r * 0.5, cy - r * 0.35, r, r * 0.7);
        c.strokeStyle = core; c.lineWidth = 1.5; c.strokeRect(cx - r * 0.5, cy - r * 0.35, r, r * 0.7);
        c.beginPath(); c.arc(cx, cy - r * 0.3, r * 0.32, Math.PI, 0); c.stroke();
      } else {
        const cx = size / 2, cy = size / 2 - k * 4;
        c.strokeStyle = "#1a1020"; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - r, cy); c.lineTo(cx + r, cy); c.moveTo(cx, cy - r * 0.65); c.lineTo(cx, cy + r * 0.65); c.stroke();
        c.strokeStyle = core; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx - r, cy); c.lineTo(cx + r, cy); c.moveTo(cx, cy - r * 0.65); c.lineTo(cx, cy + r * 0.65); c.stroke();
      }
      c.fillStyle = core;
      if (mat === "thit") c.fillRect(size / 2 - 2, size / 2 + k * 5, 3, 5);
      else if (mat === "giap") c.fillRect(size / 2 - 2, size / 2 - 2, 4, 4);
      else if (mat === "bang") { c.beginPath(); c.moveTo(size / 2, size / 2 - 6); c.lineTo(size / 2 + 4, size / 2); c.lineTo(size / 2, size / 2 + 6); c.lineTo(size / 2 - 4, size / 2); c.closePath(); c.fill(); }
      else if (mat === "go") c.fillRect(size / 2 - 6 - k * 5, size / 2 - 1, 7, 2);
      else if (mat === "da") c.fillRect(size / 2 - 3, size / 2 - 3, 6, 6);
      else { c.beginPath(); c.arc(size / 2, size / 2 - k * 7, 3, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1;
    });
    makeCodeSheet(scene, hitSheetKey(mat, he, true), 6, 40, (c, k, size) => {
      c.globalAlpha = (1 - k) * 0.42;
      c.fillStyle = `#${spark.col.toString(16).padStart(6, "0")}`;
      c.fillRect(size / 2 - 1, size / 2 - 1, 2, 2);
      c.globalAlpha = 1;
    });
  }
}

/** Phát sheet trúng đòn và lớp sáng; bản của người khác nhỏ, mờ hơn. */
export function playHitFeelSheets(sheets: SheetFx, mat: Material, he: He, x: number, y: number, mine: boolean, weight: number): void {
  if (fxLevel() === "low") return;
  const scale = (1 + Math.min(2, weight) * 0.15) * SPR;
  const common = { x, y, key: hitSheetKey(mat, he), scale, fps: HIT_HE_STYLE[he].fps, light: !mine } as const;
  sheets.play(common);
  sheets.play({ ...common, key: hitSheetKey(mat, he, true), scale: scale * 1.05, fps: HIT_HE_STYLE[he].fps, light: !mine });
  // #623: va chạm kho riêng cho đòn từ nhẹ trở lên; độ nặng 3 (đòn kết liễu / chí mạng nặng) thêm quả nổ nhỏ.
  if (weight >= 1) playPriv(sheets, "fx_va_cham_vang", { x, y, scale: SPR, light: !mine });
  if (weight >= 3) playPriv(sheets, "fx_ket_lieu", { x, y, scale: SPR, light: !mine });
}

/** Kiểu số sát thương theo hệ người đánh + chí mạng: viền theo màu tối của hệ, chí mạng chữ to hơn khi mức Vừa / Cao. */
export function damageStyle(el: Element | undefined, crit: boolean, mine: boolean, kind: "damage" | "crit" | "heal" | "shield" | "immune" = crit ? "crit" : "damage", serverColor?: string) {
  const visual = damageTextStyle(kind, crit, mine ? undefined : el, mine, serverColor);
  return {
    stroke: parseInt(visual.stroke.slice(1), 16),
    color: visual.color,
    font: visual.font * (fxLevel() === "low" ? 0.92 : 1),
  };
}
