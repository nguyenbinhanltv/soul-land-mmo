// Sprite pixel tạm thời được vẽ bằng code. Ảnh thật được tải trước theo
// shared/assets/sprites/manifest.json (sprites.ts); key nào đã có ảnh thì ở đây bỏ qua.
import Phaser from "phaser";
import { TIERS, VOHON } from "../../shared/data.ts";

const hex = (c: string) => parseInt(c.slice(1), 16);

function draw(scene: Phaser.Scene, key: string, w: number, h: number, ox: number, oy: number,
  fn: (R: (x: number, y: number, w: number, h: number, c: string) => void) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  fn((x, y, ww, hh, c) => { g.fillStyle(hex(c), 1); g.fillRect(ox + x, oy + y, ww, hh); });
  g.generateTexture(key, w, h); g.destroy();
}

/** Người chơi: 16x20, gốc tại chân (8,18). */
export const PLAYER_ORIGIN = { x: 0.5, y: 18 / 20 };
/** Hồn thú: 48x32, gốc tại chân (24,28). */
export const BEAST_ORIGIN = { x: 0.5, y: 28 / 32 };

export function makeTextures(scene: Phaser.Scene) {
  VOHON.forEach((v, i) => {
    for (const f of [0, 1]) draw(scene, `p${i}_${f}`, 16, 20, 8, 18, (R) => {
      R(-3, -3, 2, f ? 3 : 4, "#2b2430"); R(1, -3, 2, f ? 4 : 3, "#2b2430");
      R(-4, -11, 8, 9, v.robe); R(-4, -6, 8, 1, v.col); R(-5, -10, 1, 5, v.robe); R(4, -10, 1, 5, v.robe);
      R(-3, -16, 6, 5, "#f1c7a0"); R(-3, -17, 6, 2, "#2a1b14"); R(-4, -16, 2, 4, "#2a1b14"); R(1, -14, 1, 1, "#1a1010");
    });
  });
  TIERS.forEach((t, tier) => {
    for (const f of [0, 1]) for (const ag of [0, 1]) draw(scene, `b${tier}_${f}${ag ? "a" : ""}`, 48, 32, 24, 28, (R) => {
      const C = t.body, eye = ag ? "#ff3030" : "#1a0a0a", bob = f;
      if (tier === 0) {
        R(-4, -6 - bob, 8, 6, C); R(2, -9 - bob, 4, 4, C); R(3, -13 - bob, 1, 4, C); R(5, -12 - bob, 1, 3, C);
        R(4, -8 - bob, 1, 1, eye); R(-5, -5 - bob, 2, 2, "#ffffff");
      } else if (tier === 1 || tier === 2) {
        const s = tier === 2 ? 1 : 0;
        R(-6, -3, 2, 3, C); R(-2, -3 + bob, 2, 3, C); R(2, -3, 2, 3, C);
        R(-7 - s, -9 - s, 12 + s * 2, 6 + s, C); R(4 + s, -12 - s, 6, 5, C); R(9 + s, -10 - s, 2, 2, C); R(5 + s, -14 - s, 2, 2, C);
        R(-11 - s, -10 - s, 4, 2, C); R(7 + s, -11 - s, 1, 1, eye);
        if (s) { R(-4, -10, 1, 5, "#2b1a40"); R(-1, -10, 1, 5, "#2b1a40"); R(2, -10, 1, 5, "#2b1a40"); }
      } else if (tier === 3) {
        R(-8, -4, 4, 4, C); R(2, -4 + bob, 4, 4, C); R(-9, -15, 16, 12, C); R(5, -16, 7, 7, C);
        R(6, -18, 2, 2, C); R(10, -18, 2, 2, C); R(-7, -15, 11, 2, "#5a5672"); R(-7, -11, 11, 1, "#47435c");
        R(9, -13, 1, 1, ag ? "#ff3030" : "#b9a6ff");
      } else {
        for (let i = 7; i >= 0; i--) { const w = Math.max(3, Math.round(8 - i * 0.6)); R(-i * 4 - 2, Math.round(-6 + Math.sin(f * 2 + i) * 2 - w / 2), 5, w, i % 2 ? C : "#a8303a"); }
        R(2, -11, 8, 7, C); R(6, -13, 2, 3, "#f0d27a"); R(7, -9, 1, 1, "#ffe14d"); R(9, -7, 3, 1, "#ff9a9a");
      }
    });
    if (!scene.textures.exists(`ring${tier}`)) {
      const g = scene.make.graphics({}, false);
      g.fillStyle(hex(t.glow), 0.18); g.fillEllipse(12, 7, 22, 11);
      g.lineStyle(3, hex(t.col), 1); g.strokeEllipse(12, 6, 16, 7);
      g.lineStyle(1, hex(t.glow), 1); g.strokeEllipse(12, 6, 17, 8);
      g.generateTexture(`ring${tier}`, 24, 14); g.destroy();
    }
  });
  if (!scene.textures.exists("vignette")) {
    const c = scene.textures.createCanvas("vignette", 256, 256)!;
    const ctx = c.getContext();
    const grd = ctx.createRadialGradient(128, 128, 40, 128, 128, 180);
    grd.addColorStop(0, "rgba(5,8,20,0)"); grd.addColorStop(1, "rgba(5,8,20,1)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256); c.refresh();
  }
}
