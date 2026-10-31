import type Phaser from "phaser";

/** Giảm chuyển động: giữ nguyên vị trí / cỡ chữ, thời gian đọc và vòng đời của từng loại số. */
export function fadeDamageText(
  tweens: Pick<Phaser.Tweens.TweenManager, "add">,
  text: Phaser.GameObjects.Text,
  self: boolean, crit: boolean, plus: boolean,
): void {
  tweens.add({
    targets: text, alpha: 0,
    delay: self ? 450 : crit ? 500 : plus ? 600 : 350,
    duration: self ? 550 : crit ? 650 : plus ? 700 : 550,
    ...(self ? { ease: "Quad.easeIn" } : {}),
    onComplete: () => text.destroy(),
  });
}
