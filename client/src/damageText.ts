import type Phaser from "phaser";
import type { Element } from "./audio/soundMap.ts";
import { damageStyle } from "./hitFeel.ts";
import { fadeDamageText } from "./damageTextMotion.ts";
import { fxPrefs } from "./combatFx.ts";
import { SPR } from "./iso.ts";

export type DamageMessage = { v: number; crit?: boolean; c: string; id?: string; by?: string; dot?: boolean; immune?: boolean; heal?: boolean; shield?: boolean };

/** Đường vẽ số dùng chung cho game và phép đo; giữ nguyên cách vẽ, tween và hủy Text. */
export function drawDamageText(scene: Phaser.Scene, me: string, k: number, x: number, y: number, m: DamageMessage, el?: Element) {
  const plus = !!(m.heal || m.shield), self = !m.immune && !plus && m.v < 0 && m.id === me;
  const label = m.immune ? "Miễn" : `${plus ? "+" : self ? "−" : ""}${Math.abs(m.v).toLocaleString("vi-VN")}${m.crit ? "!" : ""}`;
  const kind = m.heal ? "heal" : m.shield ? "shield" : m.immune ? "immune" : m.crit ? "crit" : "damage" as const;
  const ds = damageStyle(el, !!m.crit, self, kind, m.dot ? m.c : undefined); // C1: self là nạn nhân; DoT giữ màu server gửi
  const t = scene.add.text(x, y, label, {
    fontFamily: '"Galmuri 11", "Be Vietnam Pro", system-ui, sans-serif', fontSize: `${ds.font}px`,
    color: ds.color,
    stroke: "#" + ds.stroke.toString(16).padStart(6, "0"), strokeThickness: m.crit || self ? 4 : 3, resolution: 4,
  }).setOrigin(0.5).setDepth(self ? 100000 : 99999).setScale(k * (m.crit ? 0.6 : 0.8));
  if (fxPrefs.reduce) {
    fadeDamageText(scene.tweens, t, self, !!m.crit, plus);
    return t;
  }
  const base = t.scaleX;
  if (self) {
    t.setScale(base * 1.5); scene.tweens.add({ targets: t, scale: base, duration: 140, ease: "Quad.easeOut" });
    scene.tweens.add({ targets: t, x: { from: x - 3 * k, to: x + 3 * k }, duration: 55, yoyo: true, repeat: 2 });
    scene.tweens.add({ targets: t, y: y + 8 * SPR, alpha: 0, delay: 450, duration: 550, ease: "Quad.easeIn", onComplete: () => t.destroy() });
  } else if (m.crit) {
    t.setScale(base * 1.7); scene.tweens.add({ targets: t, scale: base, duration: 180, ease: "Back.easeOut" });
    scene.tweens.add({ targets: t, y: y - 20 * SPR, alpha: 0, delay: 500, duration: 650, onComplete: () => t.destroy() });
  } else scene.tweens.add({ targets: t, y: y - (plus ? 14 : 16) * SPR, alpha: 0, delay: plus ? 600 : 350, duration: plus ? 700 : 550, onComplete: () => t.destroy() });
  return t;
}
